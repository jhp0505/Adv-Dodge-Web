import { useCallback, useEffect, useRef, useState } from 'react';
import { advance, createGame, reduce } from './game';
import { parseState, storageKey } from './game';
import type { Action, GameState, Mode } from './game';

export function useGame(mode: Mode, beam: boolean) {
  const key = storageKey(mode);
  const load = () => {
    const raw = localStorage.getItem(key), loaded = raw ? parseState(raw) : createGame(mode);
    if (loaded.mode !== mode) throw new Error('저장된 파일의 실전·연습 구분이 현재 모드와 다릅니다.');
    return loaded;
  };
  const [initial] = useState(() => { try { return { state: load(), error: '', restored: !!localStorage.getItem(key) }; } catch (e) { return { state: createGame(mode), error: String(e), restored: false }; } });
  const [state, setState] = useState(initial.state);
  const ref = useRef(state), channel = useRef<BroadcastChannel | null>(null), writable = useRef(false);
  const [owner, setOwner] = useState(false), [error, setError] = useState(initial.error);
  const errorRef = useRef(initial.error);
  const [now, setNow] = useState(Date.now()), [lastSync, setLastSync] = useState(Date.now());
  const [restored, setRestored] = useState(initial.restored && initial.state.startedAt !== null);
  const publish = useCallback((next: GameState, force = false) => {
    if (!writable.current || (errorRef.current && !force)) return;
    if (!force && next === ref.current) return;
    try {
      // Save before displaying/announcing a mutation so candidates are durable immediately.
      localStorage.setItem(key, JSON.stringify(next));
      ref.current = next; setState(next); setLastSync(Date.now());
      channel.current?.postMessage({ type: 'state', state: next });
      if (force) { errorRef.current = ''; setError(''); }
    } catch (e) { errorRef.current = `자동 저장을 완료하지 못했습니다. ${String(e)}`; setError(errorRef.current); }
  }, [key]);
  useEffect(() => {
    let alive = true, release: (() => void) | undefined;
    const abort = new AbortController();
    const accept = (raw: unknown) => {
      if (writable.current) return;
      try {
        const next = typeof raw === 'string' ? parseState(raw) : parseState(JSON.stringify(raw));
        if (next.mode !== mode) return;
        ref.current = next; setState(next); setLastSync(Date.now()); errorRef.current = ''; setError('');
      } catch (e) { errorRef.current = String(e); setError(String(e)); }
    };
    if (typeof BroadcastChannel !== 'undefined') {
      channel.current = new BroadcastChannel(key);
      channel.current.onmessage = event => {
        if (event.data?.type === 'state') accept(event.data.state);
        if (event.data?.type === 'request' && writable.current) channel.current?.postMessage({ type: 'state', state: ref.current });
        if (event.data?.type === 'heartbeat' && !writable.current) setLastSync(Date.now());
      };
      channel.current.postMessage({ type: 'request' });
    }
    const storage = (event: StorageEvent) => {
      if (event.key === key && event.newValue) accept(event.newValue);
      if (event.key === `${key}:heartbeat` && !writable.current) setLastSync(Date.now());
    };
    window.addEventListener('storage', storage);
    if (!beam) {
      if (navigator.locks) {
        // A browser-held exclusive lock survives background throttling, and is released on close/crash.
        void navigator.locks.request(`${key}:operator`, { mode: 'exclusive', signal: abort.signal }, async () => {
          if (!alive) return;
          try {
            const current = load(); ref.current = current; setState(current);
            errorRef.current = ''; setError('');
          } catch (e) { errorRef.current = String(e); setError(String(e)); }
          writable.current = true; setOwner(true);
          await new Promise<void>(resolve => { release = resolve; });
          writable.current = false;
        }).catch(e => { if (alive && e?.name !== 'AbortError') { errorRef.current = String(e); setError(String(e)); } });
      } else {
        errorRef.current = '단일 운영자 잠금을 사용할 수 없습니다. Chrome 또는 Edge에서 localhost 주소로 실행하세요.';
        setError(errorRef.current);
      }
    }
    const timer = window.setInterval(() => {
      const n = Date.now(); setNow(n);
      if (writable.current && !errorRef.current) {
        try { publish(advance(ref.current, n)); } catch (e) { errorRef.current = String(e); setError(String(e)); }
      }
    }, 150);
    const heartbeat = window.setInterval(() => {
      if (writable.current) {
        channel.current?.postMessage({ type: 'heartbeat' });
        try { localStorage.setItem(`${key}:heartbeat`, String(Date.now())); } catch { /* Main writes surface storage errors. */ }
      } else channel.current?.postMessage({ type: 'request' });
    }, 2000);
    return () => { alive = false; abort.abort(); release?.(); writable.current = false; window.clearInterval(timer); window.clearInterval(heartbeat); window.removeEventListener('storage', storage); channel.current?.close(); channel.current = null; };
    // Mount identity is fixed by App's mode key. load reads this same storage key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beam, key, mode, publish]);
  const dispatch = useCallback((action: Action) => {
    if (!writable.current || errorRef.current) return;
    try { publish(reduce(ref.current, action, Date.now())); } catch (e) { errorRef.current = String(e); setError(String(e)); }
  }, [publish]);
  const replace = useCallback((next: GameState) => {
    if (next.mode !== mode) throw new Error(`현재 ${mode === 'live' ? '실전' : '연습'} 모드의 JSON만 가져올 수 있습니다.`);
    const checked = parseState(JSON.stringify(next));
    publish(advance(checked, Date.now()), true); setRestored(checked.startedAt !== null);
  }, [mode, publish]);
  return { state, now, dispatch, owner, error, replace, restored, dismissRestored: () => setRestored(false), disconnected: now - lastSync > 8000 };
}
