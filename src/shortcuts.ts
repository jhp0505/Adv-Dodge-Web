import type { Action } from './game';

type ShortcutEvent = Pick<KeyboardEvent, 'code' | 'key' | 'repeat' | 'isComposing' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>;

export function shortcutAction(event: ShortcutEvent, editing: boolean): Action | null {
  if (editing || event.repeat || event.isComposing || event.altKey) return null;
  const code = event.code || `Key${event.key.toUpperCase()}`;
  if (event.ctrlKey || event.metaKey) {
    return code === 'KeyZ' && !event.shiftKey ? { type: 'UNDO' } : null;
  }
  const blue = code === 'KeyA' ? -1 : code === 'KeyS' ? 1 : 0;
  const white = code === 'KeyK' ? -1 : code === 'KeyL' ? 1 : 0;
  if (!blue && !white) return null;
  return { type: 'JUDGE', blue, white, kind: blue < 0 || white < 0 ? 'out' : 'revive' };
}
