export type Team = 'blue' | 'white';
export type Stage = 1 | 2 | 3;
export type Mode = 'live' | 'practice';
export type CardId = 'color-ball' | 'bomber' | 'shield' | 'crossing' | 'couple' | 'rescue' | 'gymball' | 'seal' | 'foot';
export type Effect = 'active' | 'used' | 'ended';
export type RoundConfig = { blue: number; white: number; firstThrow: Team | null };
export type Flow = 'setup' | 'prepare' | 'round1' | 'switch' | 'round2' | 'finish' | 'ended';
export type Timing = { prepare: number; rounds: [number, number]; switch: number; finish: number };
export type Config = {
  timing: Timing;
  title: string; captains: Record<Team, string>; rounds: [RoundConfig, RoundConfig];
  earlyThird: boolean; unequalAccepted: boolean;
  descriptions: Record<CardId, string>;
};
export type Pick = {
  status: 'empty' | 'reserved' | 'regular' | 'early'; candidates: CardId[];
  card: CardId | null; eventId: string | null; chosenAt: number | null;
  targets: string[]; note: string; effect: Effect; affectedCount: number | null;
};
export type TeamState = {
  initial: number; alive: number; outs: number; revivals: number;
  earlyUses: number; earlyReserved: boolean; picks: [Pick, Pick, Pick];
};
export type Result = { winner: Team | 'draw'; blue: number; white: number; at: number; reason: 'time' | 'elimination' | 'manual' };
export type RoundState = {
  number: 1 | 2; started: boolean; firstThrow: Team | null; captains: Record<Team, string>;
  startAt: number | null; endAt: number | null; teams: Record<Team, TeamState>; result: Result | null;
};
export type ChoiceEvent = {
  id: string; round: number; stage: Stage; kind: 'regular' | 'early';
  teams: Team[]; index: number; createdAt: number; deadline: number | null;
  highlighted: CardId | null; targetNames: string[]; turnStartedAt: number | null;
};
export type Log = { id: number; at: number; text: string };
export type Judgment = {
  round: number; stats: Record<Team, { alive: number; outs: number; revivals: number }>;
  effects: Record<Team, Effect[]>; result: Result | null; text: string;
};
export type GameState = {
  version: 3; flow: Flow; phaseStartAt: number | null; phaseEndAt: number | null; intro: { open: boolean; index: number }; revision: number; mode: Mode; config: Config;
  startedAt: number | null; endAt: number | null; offset: number; pausedAt: number | null;
  rounds: [RoundState, RoundState]; processed: string[]; rng: number; serial: number;
  selection: ChoiceEvent | null; queue: ChoiceEvent[];
  celebration: { until: number; round: number; teams: Team[]; stage: Stage } | null;
  stopped: boolean; rpsWinner: Team | null; logs: Log[]; undo: Judgment[];
};
export type Action =
  | { type: 'START' }
  | { type: 'START_ROUND'; round: number }
  | { type: 'END_ROUND'; round: number }
  | { type: 'ADD_TIME'; seconds: number; phaseId: string }
  | { type: 'FINISH_EVENT' }
  | { type: 'TARGET_DRAFT'; eventId: string; team: Team; names: string[] }
  | { type: 'TARGETS'; round: number; team: Team; stage: Stage; names: string[] }
  | { type: 'CONFIG'; config: Config }
  | { type: 'FIRST'; round: number; team: Team }
  | { type: 'INTRO'; open: boolean; index?: number }
  | { type: 'JUDGE'; blue: number; white: number; kind: 'out' | 'revive' | 'correction'; label?: string }
  | { type: 'UNDO' }
  | { type: 'EARLY'; teams: Team[] }
  | { type: 'HIGHLIGHT'; card: CardId; eventId: string; team: Team }
  | { type: 'CONFIRM'; eventId: string; team: Team }
  | { type: 'NOTE'; team: Team; stage: Stage; note: string }
  | { type: 'END_EFFECT'; team: Team; stage: Stage }
  | { type: 'CORRECT_PICK'; team: Team; stage: Stage; card: CardId }
  | { type: 'STOP' }
  | { type: 'RPS'; team: Team }
  | { type: 'SKIP'; seconds: number }
  | { type: 'PAUSE' };

export type CardDefinition = { id: CardId; stage: Stage; name: string; short: string; duration: string; detail: string; targeted?: boolean; manualEnd?: boolean; curse?: boolean };
export const CARDS: CardDefinition[] = [
  { id: 'color-ball', stage: 1, name: '색공 투입', short: '색이 다른 공 1개 추가', duration: '첫 피격·캐치·이탈까지', detail: '색이 다른 공을 1개 추가합니다. 첫 유효 피격·캐치·코트 밖 이탈 후 추가 공을 회수합니다.', manualEnd: true },
  { id: 'bomber', stage: 1, name: '자폭병', short: '지정 선수 아웃 시 동반 아웃', duration: '심판 확인 후 동시 판정', detail: '지정 아군이 아웃되면 그 공을 던진 상대도 함께 아웃됩니다. 심판이 대상을 확인하고 양 팀 동시 아웃을 말합니다.', targeted: true, manualEnd: true },
  { id: 'shield', stage: 1, name: '첫 피격 보호', short: '지정 1명의 피격 무효', duration: '라운드 종료까지 · 첫 번째 피격', detail: '지정 1명의 첫 번째 유효 피격을 라운드 종료까지 무효로 처리합니다.', targeted: true },
  { id: 'crossing', stage: 2, name: '넘나들기', short: '외야수 코트 안팎 이동 가능', duration: '진입 외야수 피격 시 팀 권한 종료', detail: '모든 외야수가 코트 안팎으로 이동할 수 있습니다. 이동 권한으로 들어온 외야수가 코트 안에서 맞는다면 해당 이동 권한이 종료됩니다. 임시 진입은 부활로 집계하지 않습니다.', manualEnd: true },
  { id: 'couple', stage: 2, name: '커플 저주', short: '상대 2명 연결 · 함께 아웃', duration: '상대 팀 적용 · 라운드 종료까지', detail: '상대 코트 안 2명이 손수건을 함께 잡고 이동합니다. 한 명이 아웃되거나 손수건을 놓치면 둘 다 아웃됩니다.', targeted: true, curse: true },
  { id: 'rescue', stage: 2, name: '구출 캐치', short: '바닥 전에 터치하면 아웃 무효', duration: '라운드 종료까지', detail: '아군 피격 후 공이 바닥에 닿기 전에 아군이 공을 잡거나 닿기만 해도 피격자의 아웃이 무효됩니다. 유효 아웃 여부는 심판이 결정합니다.' },
  { id: 'gymball', stage: 3, name: '짐볼', short: '공을 짐볼로 교체', duration: '양 팀 공유 · 라운드 종료까지', detail: '기본 공을 가벼운 짐볼로 교체합니다. 공은 양 팀이 공유합니다. 양손 언더스로(아래에서 위로) 투척합니다.' },
  { id: 'seal', stage: 3, name: '외야 봉인', short: '상대 외야수는 즉시 자리에 앉기', duration: '선택 당시 대상 · 라운드 종료까지', detail: '선택 시점의 상대 외야수들은 모두 그 자리에서 앉습니다. 적당히 팔을 뻗어 공을 잡는 것은 허용합니다. 이후 새로 아웃된 외야수는 포함하지 않습니다. 대상 인원은 선택 시점에 고정하고 실제 선수는 심판이 확인합니다.', targeted: true, curse: true },
  { id: 'foot', stage: 3, name: '발 가드', short: '발에 맞으면 아웃 무효', duration: '라운드 종료까지', detail: '선택 팀 모든 선수의 발 피격은 무효입니다. 신발을 포함한 발 부위만 보호하며 발목 위·정강이는 포함하지 않습니다. 최종 판정은 심판이 합니다.' },
];
export const INTRO_SLIDE_COUNT = 17;
export const CARD = Object.fromEntries(CARDS.map(c => [c.id, c])) as Record<CardId, CardDefinition>;
export const STAGES: Stage[] = [1, 2, 3];
export const DEFAULT_CONFIG: Config = {
  timing: { prepare: 300, rounds: [900, 900], switch: 120, finish: 180 },
  title: '증강 피구 청백전', captains: { blue: '', white: '' },
  rounds: [{ blue: 0, white: 0, firstThrow: null }, { blue: 0, white: 0, firstThrow: null }],
  earlyThird: true, unequalAccepted: false,
  descriptions: Object.fromEntries(CARDS.map(c => [c.id, c.detail])) as Record<CardId, string>,
};

export const TEAMS: Team[] = ['blue', 'white'];
export const TEAM_NAME: Record<Team, string> = { blue: '청팀', white: '백팀' };
export const other = (team: Team): Team => team === 'blue' ? 'white' : 'blue';
const copy = <T,>(value: T): T => structuredClone(value);
const emptyPick = (): Pick => ({ status: 'empty', candidates: [], card: null, eventId: null, chosenAt: null, targets: [], note: '', effect: 'active', affectedCount: null });
function teamState(initial: number): TeamState {
  return { initial, alive: initial, outs: 0, revivals: 0, earlyUses: 0, earlyReserved: false, picks: [emptyPick(), emptyPick(), emptyPick()] };
}
function roundState(config: Config, index: number): RoundState {
  const c = config.rounds[index];
  return { number: (index + 1) as 1 | 2, started: false, firstThrow: c.firstThrow, captains: copy(config.captains), startAt: null, endAt: null, teams: { blue: teamState(c.blue), white: teamState(c.white) }, result: null };
}
export function createGame(mode: Mode = 'live', config: Config = DEFAULT_CONFIG): GameState {
  return { version: 3, flow: 'setup', phaseStartAt: null, phaseEndAt: null, intro: { open: false, index: 0 }, revision: 0, mode, config: copy(config), startedAt: null, endAt: null, offset: 0, pausedAt: null,
    rounds: [roundState(config, 0), roundState(config, 1)], processed: [], rng: Math.floor(Math.random() * 0xffffffff) || 1,
    serial: 0, selection: null, queue: [], celebration: null, stopped: false, rpsWinner: null, logs: [], undo: [] };
}
export function practiceConfig(): Config {
  const c = copy(DEFAULT_CONFIG);
  c.captains = { blue: '청 주장', white: '백 주장' };
  c.rounds = [{ blue: 10, white: 10, firstThrow: null }, { blue: 10, white: 10, firstThrow: null }];
  return c;
}
export function configErrors(config: Config): string[] {
  const errors: string[] = [];
  if (!config.title.trim()) errors.push('행사 이름');
  for (const t of TEAMS) if (!config.captains[t].trim()) errors.push(`${TEAM_NAME[t]} 주장`);
  config.rounds.forEach((r, i) => {
    for (const t of TEAMS) if (!Number.isInteger(r[t]) || r[t] < 1 || r[t] > 999) errors.push(`${i + 1}라운드 ${TEAM_NAME[t]} 시작 인원 (1~999명)`);
    if (r.blue !== r.white && !config.unequalAccepted) errors.push(`${i + 1}라운드 인원 불일치 확인`);
  });
  if ([config.timing.prepare, ...config.timing.rounds, config.timing.switch, config.timing.finish].some(n => !Number.isInteger(n) || n < 30 || n > 7200)) errors.push('구간 시간 (30초~120분)');
  return errors;
}
export const effectiveNow = (s: GameState, realNow: number) => s.mode === 'practice' ? (s.pausedAt ?? realNow) + s.offset : realNow;
export const elapsed = (s: GameState, now: number) => s.startedAt === null ? 0 : Math.max(0, ((s.endAt ?? effectiveNow(s, now)) - s.startedAt) / 1000);
export function phase(s: GameState, _now: number) {
  const data: Record<Flow, { key: string; label: string; round: number }> = {
    setup: { key: 'setup', label: '행사 준비', round: -1 },
    prepare: { key: 'prepare', label: '경기 준비 · 규칙 설명', round: -1 },
    round1: { key: 'round', label: '1라운드 · A조', round: 0 },
    switch: { key: 'switch', label: '다음 라운드 준비', round: -1 },
    round2: { key: 'round', label: '2라운드 · B조', round: 1 },
    finish: { key: 'finish', label: '마무리 · 최종 결과', round: -1 },
    ended: { key: 'ended', label: '행사 종료', round: -1 },
  };
  return { ...data[s.flow], end: s.phaseEndAt === null || s.startedAt === null ? 0 : (s.phaseEndAt - s.startedAt) / 1000 };
}
export const phaseId = (s: GameState) => `${s.flow}:${s.phaseStartAt}`;
export function phaseRemaining(s: GameState, realNow: number) {
  return Math.max(0, ((s.phaseEndAt ?? effectiveNow(s, realNow)) - effectiveNow(s, realNow)) / 1000);
}
export function targetCount(card: CardId, round: RoundState, owner: Team, pick?: Pick): number {
  if (card === 'bomber' || card === 'shield') return 1;
  if (card === 'couple') return 2;
  if (card === 'seal') return pick?.affectedCount ?? round.teams[other(owner)].initial - round.teams[other(owner)].alive;
  return 0;
}
export function namesValid(names: string[], expected: number): boolean {
  return names.length === expected && names.every(n => n.trim().length > 0 && n.trim().length <= 40)
    && new Set(names.map(n => n.trim().toLocaleLowerCase())).size === names.length;
}
export function canConfirm(s: GameState): boolean {
  const e = s.selection;
  return !!e?.highlighted && namesValid(e.targetNames, targetCount(e.highlighted, s.rounds[e.round], e.teams[e.index]));
}
export function undoRound(s: GameState, realNow: number): number | null {
  const last = s.undo.at(-1);
  if (!last || s.selection || s.celebration || s.flow === 'ended') return null;
  const r = s.rounds[last.round], now = effectiveNow(s, realNow);
  if (r.endAt === null || now >= r.endAt || (last.round === 0 && s.rounds[1].started)) return null;
  const current = phase(s, realNow).round;
  if (current === last.round && !r.result) return last.round;
  if (r.result?.reason === 'elimination' && s.flow === (last.round === 0 ? 'switch' : 'finish')) return last.round;
  return null;
}
export function timeText(seconds: number) {
  const n = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(n / 60).toString().padStart(2, '0')}:${(n % 60).toString().padStart(2, '0')}`;
}
function log(s: GameState, at: number, text: string) {
  s.logs.push({ id: ++s.serial, at, text });
  if (s.logs.length > 600) s.logs.shift();
  s.revision++;
}
function shuffle<T>(s: GameState, values: T[]): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    s.rng = (Math.imul(1664525, s.rng) + 1013904223) >>> 0;
    const j = Math.floor(s.rng / 4294967296 * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function prepareCandidates(s: GameState, event: ChoiceEvent) {
  const team = event.teams[event.index];
  if (!team) return;
  const round = s.rounds[event.round];
  const pick = round.teams[team].picks[event.stage - 1];
  if (pick.candidates.length) return;
  const opponentCard = round.teams[other(team)].picks[event.stage - 1].card;
  pick.candidates = shuffle(s, CARDS.filter(c => c.stage === event.stage && c.id !== opponentCard).map(c => c.id)).slice(0, 2);
}
function enqueue(s: GameState, ri: number, stage: Stage, teams: Team[], kind: ChoiceEvent['kind'], at: number) {
  const round = s.rounds[ri];
  if (round.result || !round.firstThrow) return;
  const ordered = [other(round.firstThrow), round.firstThrow].filter(t => teams.includes(t) && round.teams[t].picks[stage - 1].status === 'empty');
  if (!ordered.length) return;
  const id = `${ri}-${stage}-${kind}-${++s.serial}`;
  for (const t of ordered) {
    const p = round.teams[t].picks[stage - 1];
    p.status = 'reserved'; p.eventId = id;
    if (kind === 'early') round.teams[t].earlyReserved = true;
  }
  s.queue.push({ id, round: ri, stage, kind, teams: ordered, index: 0, createdAt: at, deadline: null, turnStartedAt: null, targetNames: [], highlighted: null });
  log(s, at, `${stage}단계 ${kind === 'early' ? '조기' : '정규'} 선택 예약 · ${ordered.map(t => TEAM_NAME[t]).join(', ')}`);
}
function openNext(s: GameState, at: number) {
  if (s.selection || s.celebration) return;
  while (s.queue.length) {
    const event = s.queue.shift()!;
    const r = s.rounds[event.round];
    if (r.result || r.endAt === null || at >= r.endAt) continue;
    event.teams = event.teams.filter(t => r.teams[t].picks[event.stage - 1].status === 'reserved' && r.teams[t].picks[event.stage - 1].eventId === event.id);
    if (!event.teams.length) continue;
    event.turnStartedAt = at;
    event.deadline = Math.min(at + 40000, r.endAt);
    s.selection = event;
    prepareCandidates(s, event);
    log(s, at, `${event.stage}단계 선택 시작 · 팀별 최대 40초`);
    break;
  }
}
function assign(s: GameState, event: ChoiceEvent, at: number, automatic: boolean) {
  const r = s.rounds[event.round];
  const team = event.teams[event.index];
  if (!team) return;
  prepareCandidates(s, event);
  const own = r.teams[team];
  const p = own.picks[event.stage - 1];
  const taken = r.teams[other(team)].picks[event.stage - 1].card;
  const valid = p.candidates.filter(id => id !== taken);
  const id = !automatic && event.highlighted && valid.includes(event.highlighted) ? event.highlighted : valid[0];
  if (!id) throw new Error('유효 후보가 없습니다. 저장 파일을 확인하세요.');
  p.card = id; p.status = event.kind; p.chosenAt = at;
  p.targets = id === event.highlighted ? event.targetNames.map(n => n.trim()).slice(0, targetCount(id, r, team)) : [];
  p.effect = r.result || (r.endAt !== null && at >= r.endAt) ? 'ended' : 'active';
  p.affectedCount = event.stage === 3 ? r.teams[other(team)].initial - r.teams[other(team)].alive : null;
  if (event.kind === 'early') { own.earlyUses++; own.earlyReserved = false; }
  log(s, at, `${TEAM_NAME[team]} ${event.stage}단계 ${CARD[id].name} ${automatic ? '시간 초과 자동 확정' : '확정'}`);
  event.index++;
  event.highlighted = null; event.targetNames = [];
  if (event.index < event.teams.length) {
    event.turnStartedAt = at;
    event.deadline = Math.min(at + 40000, r.endAt!);
    log(s, at, `${TEAM_NAME[event.teams[event.index]]} 선택 시작 · 새 40초`);
  }
  prepareCandidates(s, event);
}
function finishSelection(s: GameState, at: number, animate = true) {
  const event = s.selection;
  if (!event) return;
  const until = Math.min(at + 1500, event.deadline!, s.rounds[event.round].endAt!);
  if (animate && until > at) s.celebration = { until, round: event.round, teams: [...event.teams], stage: event.stage };
  s.selection = null;
  s.revision++;
  if (!s.celebration) openNext(s, at);
}
function endRound(s: GameState, ri: number, at: number, reason: 'time' | 'elimination' | 'manual') {
  const r = s.rounds[ri];
  if (r.result) return;
  // Settle only an already active selection; unopened reservations are cancelled.
  if (s.selection?.round === ri) {
    while (s.selection.index < s.selection.teams.length) assign(s, s.selection, at, true);
    s.selection = null;
  }
  s.queue = s.queue.filter(e => e.round !== ri);
  s.celebration = null;
  const blue = r.teams.blue.alive, white = r.teams.white.alive;
  r.result = { winner: blue === white ? 'draw' : blue > white ? 'blue' : 'white', blue, white, at, reason };
  for (const t of TEAMS) {
    r.teams[t].earlyReserved = false;
    for (let i = 0; i < 3; i++) {
      const p = r.teams[t].picks[i];
      if (p.status === 'reserved') r.teams[t].picks[i] = emptyPick();
      else if (p.card && p.effect === 'active') p.effect = 'ended';
    }
  }
  s.stopped = false; s.intro.open = false;
  if (!s.processed.includes(`r${ri}-end`)) s.processed.push(`r${ri}-end`);
  s.flow = ri === 0 ? 'switch' : 'finish';
  s.phaseStartAt = at; s.phaseEndAt = at + (ri === 0 ? s.config.timing.switch : s.config.timing.finish) * 1000;
  log(s, at, `${ri + 1}라운드 종료 · ${r.result.winner === 'draw' ? '무승부' : TEAM_NAME[r.result.winner] + ' 승리'} · 생존 ${blue}:${white}`);
}
type Scheduled = { id: string; at: number; ri: number; stage?: Stage; kind: 'stage' | 'end'; priority: number };
function schedule(s: GameState): Scheduled[] {
  const ri = s.flow === 'round1' ? 0 : s.flow === 'round2' ? 1 : -1;
  if (ri < 0) return [];
  const r = s.rounds[ri];
  if (!r.started || r.result || r.startAt === null || r.endAt === null) return [];
  return [
    { id: `r${ri}-s2`, at: r.startAt + 360000, ri, stage: 2, kind: 'stage', priority: 1 },
    { id: `r${ri}-s3`, at: r.startAt + 720000, ri, stage: 3, kind: 'stage', priority: 1 },
    { id: `r${ri}-end`, at: r.endAt, ri, kind: 'end', priority: 0 },
  ];
}
function startRound(s: GameState, ri: number, at: number) {
  const fresh = roundState(s.config, ri);
  fresh.started = true; fresh.startAt = at; fresh.endAt = at + s.config.timing.rounds[ri] * 1000;
  s.rounds[ri] = fresh; s.flow = ri === 0 ? 'round1' : 'round2';
  s.phaseStartAt = at; s.phaseEndAt = fresh.endAt;
  s.undo = []; s.stopped = false; s.intro.open = false;
  s.processed.push(`r${ri}-start`);
  log(s, at, `${ri + 1}라운드 시작 · ${TEAM_NAME[other(fresh.firstThrow!)]} 증강 우선`);
  enqueue(s, ri, 1, TEAMS, 'regular', at); openNext(s, at);
}
function runUntil(s: GameState, now: number) {
  if (s.startedAt === null) return;
  for (let guard = 0; guard < 100; guard++) {
    const due = schedule(s).filter(e => !s.processed.includes(e.id)).sort((a, b) => a.at - b.at || a.priority - b.priority)[0];
    const selectionAt = s.selection?.deadline ?? Infinity;
    const celebrationAt = s.celebration?.until ?? Infinity;
    const at = Math.min(due?.at ?? Infinity, selectionAt, celebrationAt);
    if (at > now) break;
    if (due?.at === at && due.kind === 'end') {
      endRound(s, due.ri, at, 'time');
    } else if (selectionAt === at && s.selection) {
      // Only this team's 40 seconds expire. The next team receives a fresh turn.
      assign(s, s.selection, at, true);
      if (s.selection.index >= s.selection.teams.length) finishSelection(s, at);
    } else if (celebrationAt === at) {
      s.celebration = null; s.revision++; openNext(s, at);
    } else if (due) {
      s.processed.push(due.id); s.revision++;
      const r = s.rounds[due.ri];
      const early = TEAMS.filter(t => r.teams[t].picks[due.stage! - 1].status === 'early');
      if (early.length) log(s, at, `${early.map(t => TEAM_NAME[t]).join(', ')} ${due.stage}단계 조기 선택 완료 · 이번 선택 건너뜀`);
      enqueue(s, due.ri, due.stage!, TEAMS, 'regular', at); openNext(s, at);
    }
  }
}
export function advance(state: GameState, realNow: number): GameState {
  if (state.startedAt === null) return state;
  const s = copy(state); runUntil(s, effectiveNow(s, realNow));
  return s.revision === state.revision ? state : s;
}
export function earlyStage(s: GameState, team: Team, realNow: number): Stage | null {
  const ph = phase(s, realNow);
  if (ph.round < 0) return null;
  const r = s.rounds[ph.round], t = r.teams[team];
  if (!r.started || !r.firstThrow || r.result || t.alive === 0 || !t.picks[0].card || t.earlyReserved) return null;
  const allowed = t.earlyUses === 0
    ? t.initial - t.alive >= Math.ceil(t.initial / 2)
    : t.earlyUses === 1 && t.alive === 1;
  if (!allowed) return null;
  const next = STAGES.find(stage => t.picks[stage - 1].status === 'empty');
  if (!next || next === 1 || (next === 3 && !s.config.earlyThird)) return null;
  if (effectiveNow(s, realNow) >= r.startAt! + (next - 1) * 360000) return null;
  return next;
}
export function nextSelection(s: GameState, realNow: number): { label: string; seconds: number } {
  const ph = phase(s, realNow), now = effectiveNow(s, realNow);
  if (ph.round < 0) return { label: ph.key === 'prepare' ? '준비 남은 시간' : ph.key === 'switch' ? '교체 준비 남은 시간' : '마무리 남은 시간', seconds: phaseRemaining(s, realNow) };
  const r = s.rounds[ph.round];
  for (const stage of STAGES) {
    const due = r.startAt! + (stage - 1) * 360000;
    if (due > now && due < r.endAt! && TEAMS.some(t => r.teams[t].picks[stage - 1].status === 'empty')) return { label: `${stage}단계 증강까지`, seconds: (due - now) / 1000 };
  }
  return { label: '라운드 남은 시간', seconds: phaseRemaining(s, realNow) };
}
export function scores(s: GameState) {
  const points = { blue: 0, white: 0 }, survivors = { blue: 0, white: 0 };
  let count = 0;
  for (const r of s.rounds) if (r.result) {
    count++; survivors.blue += r.result.blue; survivors.white += r.result.white;
    if (r.result.winner !== 'draw') points[r.result.winner]++;
  }
  const tied = points.blue === points.white && survivors.blue === survivors.white;
  const winner: Team | null = count < 2 ? null : points.blue !== points.white ? (points.blue > points.white ? 'blue' : 'white') : survivors.blue !== survivors.white ? (survivors.blue > survivors.white ? 'blue' : 'white') : s.rpsWinner;
  return { points, survivors, tied, winner, complete: count === 2 };
}
export function reduce(state: GameState, action: Action, realNow: number): GameState {
  const caughtUp = advance(state, realNow), s = copy(caughtUp);
  const now = effectiveNow(s, realNow), ph = phase(s, realNow);
  const ri = ph.round, r = ri >= 0 ? s.rounds[ri] : null;
  switch (action.type) {
    case 'START':
      if (s.startedAt !== null || configErrors(s.config).length) break;
      s.startedAt = now; s.endAt = null; s.flow = 'prepare'; s.phaseStartAt = now; s.phaseEndAt = now + s.config.timing.prepare * 1000;
      s.config.rounds.forEach(c => { c.firstThrow = null; });
      s.rounds = [roundState(s.config, 0), roundState(s.config, 1)];
      s.intro = { open: false, index: 0 };
      log(s, now, `${s.mode === 'practice' ? '연습' : '실전'} 행사 시작 · 진행자 시간 운영`); break;
    case 'START_ROUND': {
      if (![0, 1].includes(action.round) || action.round !== (s.flow === 'prepare' ? 0 : s.flow === 'switch' ? 1 : -1)) break;
      if (s.rounds[action.round].started || !s.config.rounds[action.round].firstThrow || configErrors(s.config).length) break;
      startRound(s, action.round, now); break;
    }
    case 'END_ROUND':
      if (r && ri === action.round && !r.result) endRound(s, ri, now, 'manual');
      break;
    case 'ADD_TIME': {
      if (action.phaseId !== phaseId(s) || !Number.isInteger(action.seconds) || action.seconds < 1 || action.seconds > 7200 || s.phaseEndAt === null || ['setup', 'ended'].includes(s.flow)) break;
      // A ready screen at zero receives the full requested additional time.
      s.phaseEndAt = Math.max(s.phaseEndAt, now) + action.seconds * 1000;
      if (r && !r.result) {
        r.endAt = s.phaseEndAt;
        if (s.selection?.round === ri) s.selection.deadline = Math.min(s.selection.turnStartedAt! + 40000, r.endAt);
      }
      log(s, now, `${ph.label} 추가 시간 +${action.seconds}초`); break;
    }
    case 'FINISH_EVENT':
      if (s.flow === 'finish') {
        s.flow = 'ended'; s.endAt = now; s.phaseStartAt = now; s.phaseEndAt = now;
        if (!s.processed.includes('finish')) s.processed.push('finish');
        log(s, now, '진행자 행사 종료');
      }
      break;
    case 'FIRST': {
      if (s.startedAt === null || ![0, 1].includes(action.round) || !TEAMS.includes(action.team)) break;
      if (action.round === 1 && s.config.rounds[0].firstThrow && action.team !== other(s.config.rounds[0].firstThrow)) break;
      const target = s.rounds[action.round];
      if (target.result || (target.started && target.firstThrow !== null)) break;
      const pending = s.config.rounds.some(c => c.firstThrow === null);
      s.config.rounds[action.round].firstThrow = action.team;
      target.firstThrow = action.team;
      if (action.round === 0 && !s.rounds[1].started) {
        s.config.rounds[1].firstThrow = other(action.team);
        s.rounds[1].firstThrow = other(action.team);
        log(s, now, `2라운드 선공 ${TEAM_NAME[other(action.team)]} 자동 배정`);
      }
      log(s, now, `${action.round + 1}라운드 선공 ${TEAM_NAME[action.team]} · 증강 우선 ${TEAM_NAME[other(action.team)]}`);
      if (target.started) {
        for (const stage of STAGES) if (now >= target.startAt! + (stage - 1) * 360000) enqueue(s, action.round, stage, TEAMS, 'regular', now);
        openNext(s, now);
      }
      if (pending && s.config.rounds.every(c => c.firstThrow) && ph.key === 'prepare') s.intro = { open: true, index: 0 };
      break;
    }
    case 'INTRO':
      if (ph.key === 'prepare' && s.config.rounds.every(c => c.firstThrow)) {
        s.intro.open = action.open;
        if (action.index !== undefined) s.intro.index = Math.max(0, Math.min(INTRO_SLIDE_COUNT - 1, Math.trunc(action.index)));
        s.revision++;
      }
      break;
    case 'CONFIG': {
      if (s.startedAt !== null && !['prepare', 'switch'].includes(ph.key)) break;
      if (s.startedAt !== null && configErrors(action.config).length) break;
      // Keep unfinished forms usable without persisting an invalid numeric draft.
      if (action.config.rounds.some(c => TEAMS.some(t => !Number.isInteger(c[t]) || c[t] < 0 || c[t] > 999))) break;
      if ([action.config.timing.prepare, ...action.config.timing.rounds, action.config.timing.switch, action.config.timing.finish].some(n => !Number.isInteger(n) || n < 30 || n > 7200)) break;
      const incoming = copy(action.config);
      incoming.rounds.forEach((c, i) => { c.firstThrow = s.config.rounds[i].firstThrow; });
      if (s.startedAt !== null) {
        // Rule interpretation and early-third policy are locked when the event starts.
        incoming.descriptions = s.config.descriptions; incoming.earlyThird = s.config.earlyThird;
        if (ph.key === 'switch') { incoming.rounds[0] = s.config.rounds[0]; incoming.timing.rounds[0] = s.config.timing.rounds[0]; }
        // Active timers change only through ADD_TIME, not a form save.
        incoming.timing.prepare = s.config.timing.prepare; incoming.timing.switch = s.config.timing.switch; incoming.timing.finish = s.config.timing.finish;
      }
      s.config = incoming;
      for (let i = 0; i < 2; i++) if (!s.rounds[i].started) s.rounds[i] = roundState(s.config, i);
      if (s.startedAt === null) s.revision++; else log(s, now, '행사 설정 저장');
      break;
    }
    case 'JUDGE': {
      if (!r || !r.started || !r.firstThrow || r.result || s.selection || s.celebration || ![action.blue, action.white].every(Number.isInteger)) break;
      if ((action.kind === 'out' && (action.blue > 0 || action.white > 0)) || (action.kind === 'revive' && (action.blue < 0 || action.white < 0))) break;
      const changes = { blue: action.blue, white: action.white };
      if (TEAMS.some(t => r.teams[t].alive + changes[t] < 0 || r.teams[t].alive + changes[t] > r.teams[t].initial) || (!action.blue && !action.white)) break;
      const text = action.label || TEAMS.filter(t => changes[t]).map(t => `${TEAM_NAME[t]} ${changes[t] > 0 ? '+' : ''}${changes[t]}명`).join(' · ');
      s.undo.push({ round: ri, stats: { blue: { alive: r.teams.blue.alive, outs: r.teams.blue.outs, revivals: r.teams.blue.revivals }, white: { alive: r.teams.white.alive, outs: r.teams.white.outs, revivals: r.teams.white.revivals } }, effects: { blue: r.teams.blue.picks.map(p => p.effect), white: r.teams.white.picks.map(p => p.effect) }, result: copy(r.result), text });
      if (s.undo.length > 80) s.undo.shift();
      for (const t of TEAMS) {
        r.teams[t].alive += changes[t];
        if (action.kind === 'out') r.teams[t].outs -= changes[t];
        if (action.kind === 'revive') r.teams[t].revivals += changes[t];
      }
      log(s, now, `${action.kind === 'correction' ? '판정 수정 (누적 통계 제외)' : '심판 판정'} · ${text}`);
      if (TEAMS.some(t => r.teams[t].alive === 0)) endRound(s, ri, now, 'elimination');
      break;
    }
    case 'UNDO': {
      const undoRi = undoRound(s, realNow);
      if (undoRi === null) break;
      const target = s.rounds[undoRi], last = s.undo.pop()!;
      const wasEnded = !!target.result;
      for (const t of TEAMS) {
        Object.assign(target.teams[t], last.stats[t]);
        if (wasEnded) target.teams[t].picks.forEach((p, i) => { if (p.card) p.effect = last.effects[t][i]; });
      }
      target.result = null; s.rpsWinner = null;
      if (wasEnded) {
        s.flow = undoRi === 0 ? 'round1' : 'round2'; s.phaseStartAt = target.startAt; s.phaseEndAt = target.endAt;
        s.processed = s.processed.filter(id => id !== `r${undoRi}-end`);
        for (const stage of STAGES) if (now >= target.startAt! + (stage - 1) * 360000) {
          if (stage > 1 && !s.processed.includes(`r${undoRi}-s${stage}`)) s.processed.push(`r${undoRi}-s${stage}`);
          enqueue(s, undoRi, stage, TEAMS, 'regular', now);
        }
      }
      log(s, now, `직전 판정 취소 · ${last.text} · 시계는 유지`); openNext(s, now); break;
    }
    case 'EARLY': {
      if (!r || r.result || s.selection || s.celebration) break;
      const grouped = new Map<Stage, Team[]>();
      for (const t of [...new Set(action.teams)]) {
        const stage = earlyStage(s, t, realNow);
        if (stage) grouped.set(stage, [...(grouped.get(stage) || []), t]);
      }
      for (const [stage, teams] of [...grouped].sort((a, b) => a[0] - b[0])) enqueue(s, ri, stage, teams, 'early', now);
      openNext(s, now); break;
    }
    case 'HIGHLIGHT': {
      const e = s.selection;
      if (!e || e.id !== action.eventId || e.teams[e.index] !== action.team) break;
      if (s.rounds[e.round].teams[action.team].picks[e.stage - 1].candidates.includes(action.card)) { if (e.highlighted !== action.card) e.targetNames = []; e.highlighted = action.card; s.revision++; }
      break;
    }
    case 'TARGET_DRAFT': {
      const e = s.selection;
      if (!e || e.id !== action.eventId || e.teams[e.index] !== action.team || !e.highlighted || action.names.length > 999) break;
      e.targetNames = action.names.map(n => n.slice(0, 40)); s.revision++; break;
    }
    case 'TARGETS': {
      if (![0, 1].includes(action.round) || s.flow === 'ended') break;
      const target = s.rounds[action.round], p = target.teams[action.team].picks[action.stage - 1];
      if (!p.card || !CARD[p.card].targeted || !namesValid(action.names, targetCount(p.card, target, action.team, p))) break;
      p.targets = action.names.map(n => n.trim());
      log(s, now, `${action.round + 1}라운드 ${TEAM_NAME[action.team]} ${CARD[p.card].name} 지정 선수: ${p.targets.join(', ') || '대상 없음'}`); break;
    }
    case 'CONFIRM': {
      const e = s.selection;
      if (!e || e.id !== action.eventId || e.teams[e.index] !== action.team || !canConfirm(s)) break;
      assign(s, e, now, false);
      if (e.index >= e.teams.length) finishSelection(s, now);
      break;
    }
    case 'NOTE':
      if (r && !r.result && CARD[r.teams[action.team].picks[action.stage - 1].card!]?.targeted) {
        r.teams[action.team].picks[action.stage - 1].note = action.note.slice(0, 100);
        log(s, now, `${TEAM_NAME[action.team]} ${action.stage}단계 대상 메모 저장`);
      } break;
    case 'END_EFFECT': {
      if (!r || r.result || s.selection) break;
      const p = r.teams[action.team].picks[action.stage - 1];
      if (p.card && CARD[p.card].manualEnd && p.effect === 'active') { p.effect = 'used'; log(s, now, `${TEAM_NAME[action.team]} ${CARD[p.card].name} 효과 사용 완료`); }
      break;
    }
    case 'CORRECT_PICK': {
      if (!r || r.result || s.selection || s.celebration || s.queue.length) break;
      const p = r.teams[action.team].picks[action.stage - 1];
      if (!p.card || !p.candidates.includes(action.card) || p.card === action.card || r.teams[other(action.team)].picks[action.stage - 1].card === action.card) break;
      // Preserve the original choice rights, time, candidates and early-use ledger.
      const before = CARD[p.card].name;
      const historicalCount = p.affectedCount;
      p.card = action.card; p.note = ''; p.targets = []; p.effect = 'active';
      // The target count is captured for ALL stage-3 picks at selection time (see below).
      p.affectedCount = historicalCount;
      log(s, now, `선택 정정 · ${TEAM_NAME[action.team]} ${before} → ${CARD[action.card].name} · 원래 후보 유지`); break;
    }
    case 'STOP':
      if (s.startedAt !== null && ph.key !== 'ended') { s.stopped = !s.stopped; log(s, now, s.stopped ? '경기 중지 안내 · 행사 시계 계속 진행' : '경기 중지 안내 해제'); } break;
    case 'RPS':
      if (ph.key === 'finish' && scores(s).complete && scores(s).tied) { s.rpsWinner = action.team; log(s, now, `실제 가위바위보 결과 입력 · ${TEAM_NAME[action.team]} 승리`); } break;
    case 'SKIP':
      if (s.mode === 'practice' && s.startedAt !== null && Number.isFinite(action.seconds) && action.seconds > 0) { s.offset += Math.round(action.seconds * 1000); runUntil(s, effectiveNow(s, realNow)); s.revision++; } break;
    case 'PAUSE':
      if (s.mode === 'practice' && s.startedAt !== null) {
        if (s.pausedAt !== null) { s.offset -= realNow - s.pausedAt; s.pausedAt = null; }
        else s.pausedAt = realNow;
        s.revision++;
      } break;
  }
  return s.revision === caughtUp.revision ? caughtUp : s;
}

export const storageKey = (mode: Mode) => `adv-dodge:v1:${mode}`;
const record = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const integer = (x: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): x is number => Number.isSafeInteger(x) && (x as number) >= min && (x as number) <= max;
const isTeam = (x: unknown): x is Team => x === 'blue' || x === 'white';
function requireValue(test: unknown, name: string): asserts test { if (!test) throw new Error(`저장 파일의 ${name} 값이 올바르지 않습니다.`); }
const namesArray = (x: unknown): x is string[] => Array.isArray(x) && x.length <= 999 && x.every(n => typeof n === 'string' && n.length <= 40);

export function validateState(input: unknown): GameState {
  requireValue(record(input), '형식');
  const v = input;
  requireValue(v.version === 3, '버전 (지원: 3)');
  requireValue(['setup', 'prepare', 'round1', 'switch', 'round2', 'finish', 'ended'].includes(v.flow as string), '진행 구간');
  requireValue(record(v.intro) && typeof v.intro.open === 'boolean' && integer(v.intro.index, 0, INTRO_SLIDE_COUNT - 1), '발표 슬라이드');
  requireValue(v.mode === 'live' || v.mode === 'practice', '실전·연습 구분');
  requireValue(integer(v.revision) && integer(v.serial) && integer(v.rng, 0, 0xffffffff), '기록 번호');
  for (const k of ['startedAt', 'endAt', 'phaseStartAt', 'phaseEndAt']) requireValue(v[k] === null || integer(v[k]), '절대 시각');
  requireValue(typeof v.offset === 'number' && Number.isFinite(v.offset) && Math.abs(v.offset) < 1e13 && (v.pausedAt === null || integer(v.pausedAt)), '연습 시계');
  requireValue(v.mode !== 'live' || (v.offset === 0 && v.pausedAt === null), '실전 시계');
  requireValue(typeof v.stopped === 'boolean' && (v.rpsWinner === null || isTeam(v.rpsWinner)), '진행 상태');
  if (v.flow === 'setup') requireValue(v.startedAt === null && v.endAt === null && v.phaseStartAt === null && v.phaseEndAt === null, '시작 대기 시각');
  else requireValue(integer(v.startedAt) && integer(v.phaseStartAt, v.startedAt) && integer(v.phaseEndAt, v.phaseStartAt), '구간 시작·종료 시각');
  requireValue(v.flow === 'ended' ? v.endAt === v.phaseStartAt && v.endAt === v.phaseEndAt : v.endAt === null, '행사 종료 시각');
  const c = v.config;
  requireValue(record(c) && typeof c.title === 'string' && c.title.length <= 80 && record(c.captains) && record(c.descriptions), '설정');
  for (const t of TEAMS) requireValue(typeof c.captains[t] === 'string' && (c.captains[t] as string).length <= 40, '주장');
  requireValue(typeof c.earlyThird === 'boolean' && typeof c.unequalAccepted === 'boolean', '규칙 설정');
  const timing = c.timing;
  requireValue(record(timing) && Array.isArray(timing.rounds) && timing.rounds.length === 2 && [timing.prepare, ...timing.rounds, timing.switch, timing.finish].every(n => integer(n, 30, 7200)), '기본 구간 시간');
  requireValue(Array.isArray(c.rounds) && c.rounds.length === 2, '라운드 설정');
  for (const r of c.rounds) requireValue(record(r) && integer(r.blue, 0, 999) && integer(r.white, 0, 999) && (r.firstThrow === null || isTeam(r.firstThrow)), '라운드 인원·선공');
  for (const card of CARDS) requireValue(typeof c.descriptions[card.id] === 'string' && (c.descriptions[card.id] as string).length <= 1600, '카드 설명');
  requireValue(Array.isArray(v.rounds) && v.rounds.length === 2, '라운드');
  for (let ri = 0; ri < 2; ri++) {
    const r = v.rounds[ri];
    requireValue(record(r) && r.number === ri + 1 && typeof r.started === 'boolean' && (r.firstThrow === null || isTeam(r.firstThrow)) && record(r.teams) && record(r.captains), '라운드 상태');
    for (const t of TEAMS) requireValue(typeof r.captains[t] === 'string' && (r.captains[t] as string).length <= 40, '라운드 주장');
    requireValue(r.started ? integer(v.startedAt) && integer(r.startAt, v.startedAt) && integer(r.endAt, (r.startAt as number) + 1) : r.startAt === null && r.endAt === null, '라운드 절대 시각');
    for (const t of TEAMS) {
      const ts = r.teams[t];
      requireValue(record(ts) && integer(ts.initial, r.started ? 1 : 0, 999) && integer(ts.alive, 0, ts.initial) && integer(ts.outs) && integer(ts.revivals), '생존 인원·통계');
      requireValue(integer(ts.earlyUses, 0, 2) && typeof ts.earlyReserved === 'boolean' && Array.isArray(ts.picks) && ts.picks.length === 3, '선택 권리');
      let earlyCount = 0;
      for (let i = 0; i < 3; i++) {
        const p = ts.picks[i];
        requireValue(record(p) && ['empty', 'reserved', 'regular', 'early'].includes(p.status as string), '단계 상태');
        requireValue(Array.isArray(p.candidates) && [0, 2].includes(p.candidates.length) && new Set(p.candidates).size === p.candidates.length && p.candidates.every(id => CARDS.some(x => x.id === id && x.stage === i + 1)), '후보 2장');
        requireValue(p.card === null || p.candidates.includes(p.card), '확정 카드');
        requireValue(['active', 'used', 'ended'].includes(p.effect as string) && typeof p.note === 'string' && p.note.length <= 100 && namesArray(p.targets), '효과·지정 선수');
        requireValue(p.affectedCount === null || integer(p.affectedCount, 0, 999), '봉인 대상 인원');
        requireValue(p.eventId === null || typeof p.eventId === 'string', '선택 이벤트 연결');
        requireValue(p.chosenAt === null || integer(p.chosenAt), '확정 시각');
        if (p.status === 'regular' || p.status === 'early') requireValue(p.card !== null && p.chosenAt !== null && p.eventId !== null, '확정 기록');
        if (p.status === 'empty') requireValue(p.card === null && p.candidates.length === 0 && p.eventId === null && p.chosenAt === null, '미선택 기록');
        if (p.status === 'reserved') requireValue(p.card === null && p.eventId !== null && p.chosenAt === null, '예약 기록');
        if (p.status === 'early') earlyCount++;
        if (p.card && r.result !== null) requireValue(p.effect !== 'active', '종료 효과');
        if (p.effect === 'used' && p.card) requireValue(CARD[p.card as CardId]?.manualEnd, '수동 종료 가능 효과');
      }
      requireValue(earlyCount <= 2 && ts.earlyUses === earlyCount, '조기 선택 사용 횟수');
    }
    const teams = r.teams as unknown as Record<Team, TeamState>;
    for (let i = 0; i < 3; i++) requireValue(!teams.blue.picks[i].card || teams.blue.picks[i].card !== teams.white.picks[i].card, '카드 독점');
    if (r.result !== null) {
      const result = r.result;
      requireValue(record(result) && (isTeam(result.winner) || result.winner === 'draw') && integer(result.blue, 0, 999) && integer(result.white, 0, 999) && integer(result.at) && ['time', 'elimination', 'manual'].includes(result.reason as string), '라운드 결과');
      requireValue(result.winner === (result.blue === result.white ? 'draw' : result.blue > result.white ? 'blue' : 'white'), '승리 팀');
      for (const t of TEAMS) requireValue(result[t] === teams[t].alive, '결과 인원');
    }
  }
  const state = input as unknown as GameState;
  if (state.startedAt !== null) requireValue(configErrors(state.config).length === 0, '필수 설정');
  requireValue(Array.isArray(v.processed) && new Set(v.processed).size === v.processed.length && v.processed.every(id => typeof id === 'string' && /^(r[01]-(start|s2|s3|end)|finish)$/.test(id)), '처리 완료 이벤트');
  for (let ri = 0; ri < 2; ri++) {
    const r = state.rounds[ri];
    requireValue(r.started === state.processed.includes(`r${ri}-start`), '시작 이벤트 장부');
    if (state.processed.some(id => id.startsWith(`r${ri}-`) && !id.endsWith('start'))) requireValue(r.started, '단계 이벤트 순서');
    requireValue(state.processed.includes(`r${ri}-end`) === !!r.result, '종료 이벤트 장부');
    if (r.result) {
      requireValue(r.started && r.result.at >= r.startAt! && r.result.at <= r.endAt!, '결과 확정 시각');
      if (r.result.reason === 'time') requireValue(r.result.at === r.endAt, '시간 종료');
      if (r.result.reason === 'elimination') requireValue(r.result.blue === 0 || r.result.white === 0, '전멸 종료');
    }
    for (const t of TEAMS) for (let pi = 0; pi < 3; pi++) {
      const p = r.teams[t].picks[pi];
      if (p.card) {
        requireValue(r.started && p.chosenAt! >= r.startAt! && p.chosenAt! <= r.endAt!, '증강 확정 시각');
        requireValue(p.targets.length <= targetCount(p.card, r, t, p), '지정 선수 수');
      }
      if (p.status === 'early') requireValue(pi > 0 && (pi !== 2 || state.config.earlyThird), '조기 선택 허용 단계');
      if (pi === 2 && p.card) requireValue(p.affectedCount !== null && p.affectedCount <= r.teams[other(t)].initial, '선택 당시 외야 인원');
    }
  }
  if (['setup', 'prepare'].includes(state.flow)) requireValue(state.rounds.every(r => !r.started), '경기 준비 단계');
  if (state.flow === 'switch') requireValue(state.rounds[0].result && !state.rounds[1].started, '다음 라운드 준비 단계');
  if (state.flow === 'round1' || state.flow === 'round2') {
    const ri = state.flow === 'round1' ? 0 : 1, r = state.rounds[ri];
    requireValue(r.started && !r.result && r.startAt === state.phaseStartAt && r.endAt === state.phaseEndAt, '진행 라운드 시계');
    if (ri === 1) requireValue(state.rounds[0].result, '라운드 진행 순서');
  }
  if (state.flow === 'finish' || state.flow === 'ended') requireValue(state.rounds.every(r => r.result), '최종 결과');
  requireValue(state.processed.includes('finish') === (state.flow === 'ended'), '행사 종료 장부');
  if (state.rpsWinner) requireValue(scores(state).complete && scores(state).tied, '가위바위보 결과 조건');
  requireValue(Array.isArray(v.queue) && v.queue.length <= 12, '대기열');
  const events = [...v.queue, ...(v.selection ? [v.selection] : [])];
  const ids = new Set<string>();
  for (const e of events) {
    requireValue(record(e) && typeof e.id === 'string' && !ids.has(e.id) && integer(e.round, 0, 1) && integer(e.stage, 1, 3), '선택 이벤트');
    ids.add(e.id);
    requireValue(['early', 'regular'].includes(e.kind as string) && Array.isArray(e.teams) && e.teams.length >= 1 && e.teams.length <= 2 && e.teams.every(isTeam) && new Set(e.teams).size === e.teams.length && integer(e.index, 0, e.teams.length - 1), '선택 순서');
    const round = state.rounds[e.round];
    requireValue(round.started && !!round.firstThrow && !round.result && integer(e.createdAt) && e.createdAt >= round.startAt!, '선택 라운드');
    requireValue(namesArray(e.targetNames), '지정 선수 입력 초안');
    if (e === v.selection) requireValue(integer(e.turnStartedAt, e.createdAt) && integer(e.deadline, e.turnStartedAt + 1, Math.min(e.turnStartedAt + 40000, round.endAt!)), '팀별 40초 제한');
    else requireValue(e.deadline === null && e.turnStartedAt === null && e.index === 0, '대기 이벤트');
    for (let i = 0; i < e.teams.length; i++) {
      const p = round.teams[e.teams[i] as Team].picks[e.stage - 1];
      requireValue(p.eventId === e.id && (i < e.index ? p.card !== null : p.status === 'reserved'), '예약 소유권');
    }
    const current = round.teams[e.teams[e.index] as Team].picks[e.stage - 1];
    requireValue(e.highlighted === null || current.candidates.includes(e.highlighted as CardId), '선택 강조');
    if (e === v.selection) requireValue(current.candidates.length === 2, '공개 후보');
  }
  requireValue(v.selection === null || record(v.selection), '현재 선택');
  for (const r of state.rounds) for (const t of TEAMS) {
    for (const p of r.teams[t].picks) if (p.status === 'reserved') requireValue(p.eventId && ids.has(p.eventId), '고립된 선택 예약');
    const reservedEarly = events.some(e => e.round === r.number - 1 && e.kind === 'early' && e.teams.slice(e.index).includes(t));
    requireValue(r.teams[t].earlyReserved === reservedEarly, '조기 선택 예약 상태');
  }
  if (v.celebration !== null) {
    const a = v.celebration;
    requireValue(record(a) && integer(a.until) && integer(a.round, 0, 1) && integer(a.stage, 1, 3) && Array.isArray(a.teams) && a.teams.length > 0 && a.teams.every(isTeam) && v.selection === null, '확정 연출');
    requireValue(a.until <= state.rounds[a.round].endAt!, '연출 종료 시각');
  }
  requireValue(Array.isArray(v.logs) && v.logs.length <= 600 && v.logs.every(l => record(l) && integer(l.id) && integer(l.at) && typeof l.text === 'string' && l.text.length <= 50000), '운영 로그');
  requireValue(Array.isArray(v.undo) && v.undo.length <= 80, '취소 기록');
  for (const u of v.undo) {
    requireValue(record(u) && integer(u.round, 0, 1) && record(u.stats) && record(u.effects) && u.result === null && typeof u.text === 'string', '판정 이력');
    for (const t of TEAMS) {
      const st = u.stats[t], ef = u.effects[t];
      requireValue(record(st) && integer(st.alive, 0, state.rounds[u.round].teams[t].initial) && integer(st.outs) && integer(st.revivals) && Array.isArray(ef) && ef.length === 3 && ef.every(e => ['active', 'used', 'ended'].includes(e)), '취소 통계');
    }
  }
  return state;
}
const PREVIOUS_CARD_DETAILS: Record<string, string> = {
  "color-ball": "색이 다른 공을 1개 추가합니다. 첫 유효 피격·캐치·코트 밖 이탈 후 추가 공을 회수하고 효과 사용 완료를 누릅니다.",
  "bomber": "지정 아군이 유효 피격으로 아웃되면 그 공을 던진 상대도 함께 아웃됩니다. 심판이 대상을 확인하고 양 팀 동시 아웃을 입력합니다.",
  "shield": "지정 1명의 모든 유효 피격을 라운드 종료까지 무효로 처리합니다. 이름의 첫과 달리 1회 소모형이 아닙니다.",
  "crossing": "모든 외야수가 코트 안팎으로 이동할 수 있습니다. 이동 권한으로 들어온 외야수가 코트 안에서 맞으면 해당 팀 전체의 이동 권한이 종료됩니다. 임시 진입은 정식 부활로 집계하지 않습니다.",
  "couple": "상대 코트 안 2명이 손수건을 함께 잡고 이동합니다. 한 명이 아웃되거나 손수건을 놓치면 둘 다 아웃입니다. 심판 확인 후 상대 팀 2명 아웃을 입력합니다.",
  "rescue": "아군 피격 후 공이 바닥에 닿기 전에 아군이 공을 잡거나 닿기만 해도 피격자의 아웃이 무효입니다. 유효 아웃 여부는 심판이 결정합니다.",
  "gymball": "기본 공을 가벼운 짐볼 또는 대형 소프트볼로 교체합니다. 공은 양 팀이 공유합니다. 양손 언더스로 어깨 높이 이하로만 투척합니다.",
  "seal": "선택 시점의 상대 외야수만 그 자리에서 앉아 공을 잡습니다. 적당히 팔을 뻗는 것은 허용합니다. 이후 새로 아웃된 외야수는 포함하지 않습니다. 대상 인원은 선택 시점에 고정하고 실제 선수는 심판이 확인합니다.",
  "foot": "선택 팀 선수의 발 피격은 무효입니다. 신발을 포함한 발 부위만 보호하며 발목 위·정강이는 포함하지 않습니다. 최종 판정은 심판이 합니다."
};

export function parseState(text: string): GameState {
  if (text.length > 4_000_000) throw new Error('JSON 파일은 4MB 이하로 가져오세요.');
  const input: unknown = JSON.parse(text);
  if (record(input) && (input.version === 1 || input.version === 2)) {
    requireValue(Array.isArray(input.rounds) && input.rounds.length === 2 && record(input.config) && Array.isArray(input.processed), '이전 버전 기록');
    const wasV1 = input.version === 1;
    for (const r of input.rounds) {
      requireValue(record(r) && record(r.teams), '이전 버전 팀');
      for (const t of TEAMS) {
        const team = r.teams[t];
        requireValue(record(team) && Array.isArray(team.picks), '이전 선택 기록');
        if (wasV1) {
          requireValue(typeof team.earlyUsed === 'boolean', '이전 조기 선택');
          team.earlyUses = team.earlyUsed ? 1 : 0; delete team.earlyUsed;
        }
        for (const p of team.picks) { requireValue(record(p), '이전 카드'); p.targets = []; }
      }
      if (r.result && !input.processed.includes(`r${Number(r.number) - 1}-end`)) input.processed.push(`r${Number(r.number) - 1}-end`);
    }
    const rounds = input.rounds as unknown as [RoundState, RoundState];
    const started = input.startedAt as number | null;
    const flow: Flow = started === null ? 'setup' : input.processed.includes('finish') ? 'ended' : rounds[1].result ? 'finish' : rounds[1].started ? 'round2' : rounds[0].result ? 'switch' : rounds[0].started ? 'round1' : 'prepare';
    input.flow = flow;
    input.config.timing = { prepare: 300, rounds: [900, 900], switch: 120, finish: 180 };
    input.intro = { open: false, index: 0 };
    input.phaseStartAt = flow === 'setup' ? null : flow === 'prepare' ? started : flow === 'switch' ? rounds[0].result!.at : flow === 'finish' ? rounds[1].result!.at : flow === 'ended' ? input.endAt : rounds[flow === 'round1' ? 0 : 1].startAt;
    input.phaseEndAt = flow === 'setup' ? null : flow === 'prepare' ? started! + 300000 : flow === 'switch' ? (input.phaseStartAt as number) + 120000 : flow === 'finish' ? (input.phaseStartAt as number) + 180000 : flow === 'ended' ? input.endAt : rounds[flow === 'round1' ? 0 : 1].endAt;
    if (flow !== 'ended') input.endAt = null;
    requireValue(Array.isArray(input.queue), '이전 선택 대기열');
    for (const e of [...input.queue, ...(input.selection ? [input.selection] : [])]) {
      requireValue(record(e), '이전 선택 이벤트');
      e.targetNames = [];
      e.turnStartedAt = e.deadline === null ? null : Math.max(Number(e.createdAt), Number(e.deadline) - 40000);
    }
    input.version = 3;
  }
  const loaded = validateState(input);
  for (const card of CARDS) {
    if (loaded.config.descriptions[card.id] === PREVIOUS_CARD_DETAILS[card.id]) loaded.config.descriptions[card.id] = card.detail;
  }
  return loaded;
}
