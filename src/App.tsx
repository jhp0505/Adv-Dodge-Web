import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  CARD, CARDS, INTRO_SLIDE_COUNT, STAGES, TEAMS, TEAM_NAME, createGame, practiceConfig,
  configErrors, earlyStage, effectiveNow, elapsed, nextSelection, other,
  parseState, phase, scores, timeText, phaseRemaining, phaseId, undoRound,
  targetCount, namesValid, canConfirm,
} from './game';
import type { Action, CardId, Config, GameState, Mode, RoundState, Stage, Team } from './game';
import { useGame } from './useGame';
import './App.css';
import { VictoryEffects } from './VictoryEffects';
import { shortcutAction } from './shortcuts';

const GLYPHS: Record<CardId, ReactNode> = {
  'bomber': <><circle cx="42" cy="43" r="13"/><path d="M22 105V80q20-20 40 0v25M42 105v46M22 113h40"/><circle cx="138" cy="43" r="13"/><path d="M118 105V80q20-20 40 0v25M138 105v46M118 113h40M62 101h14m28 0h14"/><path d="m90 61 8 25 22-4-17 20 11 22-24-10-19 14 7-25-15-17 23 1Z" fill="#efb84a"/></>,
  'color-ball': <><circle cx="59" cy="91" r="35"/><path d="M35 66q37 7 47 49M37 116q27-22 45-44"/><circle cx="115" cy="102" r="40" fill="#efb84a"/><path d="M89 72q38 18 46 57M88 130q24-32 60-35M139 31v32m-16-16h32"/></>,
  'couple': <><circle cx="39" cy="43" r="14"/><circle cx="141" cy="43" r="14"/><path d="M39 57v48m0-31 25 16M39 105l-16 42m16-42 17 42M141 57v48m0-31-25 16m25 15-16 42m16-42 17 42"/><path d="m66 76 48 7-2 30-44-8Z" fill="#efb84a"/><path d="m84 82 13 26M69 142h43m-32-9-11 9 11 9m21-18 11 9-11 9"/></>,
  'crossing': <><path d="M32 24v132m116-132v132" strokeDasharray="12 10"/><circle cx="90" cy="38" r="14"/><path d="M90 53v52m0-34-29 19m29-19 29 17m-29 17-21 39m21-39 26 35M17 111h42m-28-14-14 14 14 14M163 64h-42m28-14 14 14-14 14"/></>,
  'foot': <><path d="M26 62v41l43 14 14 26H18v-32m8-8 28 9m-1 9 9 10"/><path d="m102 73 30-9 29 9v29q-6 25-29 38-25-13-30-38Z" fill="#c9d5e6"/><path d="m117 99 11 13 19-27M110 42l-4-19m27 18 9-17"/><circle cx="71" cy="51" r="16" fill="#efb84a"/></>,
  'gymball': <><circle cx="90" cy="63" r="46" fill="#efb84a"/><path d="M57 31q39 18 62 65M52 87q29-40 79-38M23 151l-9-35q-3-12 7-13l24 26m111 22 10-35q3-12-7-13l-24 26M45 129l-6-27q0-13 10-11l21 36 8 29m57-27 6-27q0-13-10-11l-21 36-8 29"/></>,
  'rescue': <><circle cx="41" cy="37" r="13"/><path d="M41 50v47m0-29 28 15M41 97l-13 32m13-32 16 31"/><circle cx="105" cy="67" r="18" fill="#efb84a"/><path d="M83 121q13-17 23-2l10 6 30-28q12-8 15 4l-24 38q-8 10-25 10H80m0-32v36H64v-36h16M110 23q42 0 46 41m-13-9 13 13 11-16M18 164h147"/></>,
  'seal': <><circle cx="50" cy="49" r="14"/><path d="M50 63v39h42l9 43M29 88v37h43v26M15 159h150M112 25v41" strokeDasharray="180 0"/><rect x="108" y="92" width="49" height="44" rx="2" fill="#c9d5e6"/><path d="M118 92V80q14-26 29 0v12m-14 17v12M96 25h64"/></>,
  'shield': <><circle cx="77" cy="35" r="14"/><path d="M52 80V66q24-16 48 0M61 133l-7 25m41-30 5 30"/><path d="m35 77 43-13 42 13v34q-6 28-42 42-36-14-43-42Z" fill="#c9d5e6"/><path d="m57 104 15 16 28-32M139 66l14-17m-7 34h22"/><circle cx="146" cy="108" r="13" fill="#efb84a"/></>,
};
function Icon({ id }: { id: CardId }) {
  return <svg className="pictogram" viewBox="0 0 180 180" fill="none" stroke="#172130" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{GLYPHS[id]}</svg>;
}

let audio: AudioContext | null = null;
let lastSoundAt = 0;
async function sound(volume: number) {
  if (volume <= 0 || Date.now() - lastSoundAt < 1500) return;
  lastSoundAt = Date.now();
  try {
    audio ??= new AudioContext();
    await audio.resume();
    const start = audio.currentTime + 0.02;
    const limiter = audio.createDynamicsCompressor();
    limiter.threshold.value = -8;
    limiter.knee.value = 8;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.18;
    limiter.connect(audio.destination);
    for (let i = 0; i < 4; i++) {
      const at = start + i * 0.48;
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(620, at);
      oscillator.frequency.exponentialRampToValueAtTime(1550, at + 0.19);
      oscillator.frequency.exponentialRampToValueAtTime(650, at + 0.40);
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(volume * 0.55, at + 0.025);
      gain.gain.setValueAtTime(volume * 0.55, at + 0.35);
      gain.gain.linearRampToValueAtTime(0, at + 0.43);
      oscillator.connect(gain);
      gain.connect(limiter);
      oscillator.start(at);
      oscillator.stop(at + 0.45);
      oscillator.onended = () => {
        oscillator.disconnect(); gain.disconnect();
        if (i === 3) limiter.disconnect();
      };
    }
  } catch { /* 오디오가 차단되어도 화면 안내는 유지합니다. */ }
}

type Shared = { beam: boolean; state: GameState; now: number; interactive: boolean; dispatch: (a: Action) => void };
function Setup({ config, editing, disabled, onChange, onSave }: {
  config: Config; editing?: boolean; disabled: boolean;
  onChange?: (c: Config) => void; onSave: (c: Config) => void;
}) {
  const [draft, setDraft] = useState(config);
  const [errors, setErrors] = useState<string[]>([]);
  useEffect(() => setDraft(config), [config]);
  function change(fn: (c: Config) => void) {
    const next = structuredClone(draft); fn(next);
    setDraft(next); setErrors([]); onChange?.(next);
  }
  return <form className="setup-form" onSubmit={e => {
    e.preventDefault(); const list = configErrors(draft); setErrors(list);
    if (!list.length) onSave(draft);
  }}>
    <section className="form-section">
      <h2>1. 행사와 주장</h2>
      <label>행사 이름<input required maxLength={80} value={draft.title} disabled={disabled} onChange={e => change(c => { c.title = e.target.value; })} /></label>
      <div className="two-columns">{TEAMS.map(t => <label key={t}>{TEAM_NAME[t]} 주장<input required maxLength={40} placeholder="이름 또는 별칭" value={draft.captains[t]} disabled={disabled} onChange={e => change(c => { c.captains[t] = e.target.value; })} /></label>)}</div>
    </section>
    <section className="form-section">
      <div className="section-title"><h2>2. 라운드 출전 인원</h2><button type="button" disabled={disabled} onClick={() => change(c => { c.rounds[1].blue = c.rounds[0].blue; c.rounds[1].white = c.rounds[0].white; c.unequalAccepted = false; })}>1라운드 인원 복사</button></div>
      <p className="muted">코트에 들어가는 정식 생존 선수만 입력하세요. A·B조 중복 출전이 가능합니다.</p>
      <div className="two-columns">{draft.rounds.map((r, index) => <fieldset key={index} disabled={disabled}>
        <legend>{index + 1}라운드 · {index ? 'B조' : 'A조'}</legend>
        <div className="two-columns">{TEAMS.map(t => <label key={t}>{TEAM_NAME[t]}<input required type="number" min="1" max="999" step="1" value={r[t] || ''} placeholder="시작 인원" onChange={e => change(c => { c.rounds[index][t] = Number(e.target.value); c.unequalAccepted = false; })} /></label>)}</div>
        {r.blue !== r.white && <p className="warning-text">인원 불일치: {r.blue} : {r.white}</p>}
      </fieldset>)}</div>
      <details className="timing-settings"><summary>시간 설정 · 분 단위</summary><p className="muted">준비가 끝나면 진행자가 라운드를 시작합니다. 경기 중에도 추가 시간을 줄 수 있습니다.</p><div className="timing-grid">{(['prepare','round0','switch','round1','finish'] as const).map((key,i)=>{
        const labels=['첫 경기 준비','1라운드 경기','선수 교체 준비','2라운드 경기','마무리'];
        const value=key==='round0'?draft.timing.rounds[0]:key==='round1'?draft.timing.rounds[1]:draft.timing[key];
        return <label key={key}>{labels[i]}<input type="number" min="0.5" max="120" step="0.5" disabled={disabled || !!editing && key!=='round0' && key!=='round1'} value={value/60} onChange={e=>change(c=>{const seconds=Math.round(Number(e.target.value)*60);if(key==='round0')c.timing.rounds[0]=seconds;else if(key==='round1')c.timing.rounds[1]=seconds;else c.timing[key]=seconds;})}/></label>;
      })}</div></details>
      {draft.rounds.some(r => r.blue !== r.white) && <label className="check"><input type="checkbox" disabled={disabled} checked={draft.unequalAccepted} onChange={e => change(c => { c.unequalAccepted = e.target.checked; })} />인원 차이를 확인했고 그대로 운영합니다.</label>}
    </section>
    {!!errors.length && <p role="alert" className="warning-text">확인할 항목: {errors.join(' / ')}</p>}
    <button className="primary start-button" disabled={disabled}>{editing ? '설정 저장' : '게임 시작'}</button>
    {!editing && <p className="muted">시작 후 선공 팀을 정하고 규칙 슬라이드를 진행합니다. 준비 시간과 경기 시간은 아래 설정에 따라 운영합니다.</p>}
  </form>;
}

function FirstPicker({ state, interactive, dispatch }: Omit<Shared, 'now'>) {
  return <section className="first-picker panel">
    <span className="eyebrow">게임 시작 · 선공 팀 결정</span>
    <h1>먼저 공을 던질 팀을 골라주세요</h1>
    <p>공을 먼저 던지지 않는 팀이 해당 라운드의 모든 정규 증강을 먼저 선택합니다.</p>
    <div className="two-columns">{state.config.rounds.map((r, index) => <article key={index}>
      <h2>{index + 1}라운드 · {index ? 'B조 · 자동 배정' : 'A조'}</h2>
      <div className="two-columns">{TEAMS.map(t => <button key={t} className={`team-button ${t} ${r.firstThrow === t ? 'selected' : ''}`} disabled={index === 1 || !interactive || state.rounds[index].started && state.rounds[index].firstThrow !== null || !!state.rounds[index].result} aria-pressed={r.firstThrow === t} onClick={() => dispatch({ type: 'FIRST', round: index, team: t })}>{TEAM_NAME[t]} 선공{r.firstThrow === t ? ' ✓' : ''}</button>)}</div>
      <p className="priority">{r.firstThrow ? `${TEAM_NAME[other(r.firstThrow)]} 증강 우선 선택` : index ? '1라운드 선공의 반대팀으로 자동 배정됩니다.' : '진행자가 선공을 선택합니다.'}</p>
    </article>)}</div>
    <p className="warning-text">준비 시간은 진행자가 조절할 수 있습니다. 1라운드 선공을 고르면 2라운드는 반대팀으로 자동 배정되고 설명 슬라이드가 열립니다.</p>
  </section>;
}

function Presentation({ state, interactive, dispatch }: Omit<Shared, 'now'>) {
  const index = state.intro.index;
  const divider = index === 4 ? 1 : index === 8 ? 2 : index === 12 ? 3 : null;
  const cardIndex = index >= 5 && index <= 7 ? index - 5 : index >= 9 && index <= 11 ? index - 6 : index >= 13 && index <= 15 ? index - 7 : -1;
  const card = cardIndex >= 0 ? CARDS[cardIndex] : null;
  return <section className={`presentation ${card ? `stage-${card.stage}` : divider ? `stage-${divider}` : ''}`}>
    <div className="slide-top"><span>{card ? `${card.stage}단계 증강 소개` : '피구 · 경기 안내'}</span><b>{index + 1} / {INTRO_SLIDE_COUNT}</b></div>
    {divider ? <article className="stage-divider"><span>증강 소개</span><h1>{divider}단계</h1><p>{divider === 1 ? '라운드 시작' : `${(divider - 1) * 6}분 경과`} · 새로운 증강을 선택합니다</p></article> : card ? <article className="card-slide">
      <div className="slide-art"><Icon id={card.id} /></div>
      <div className="slide-copy"><span className="stage-tag">{card.stage}단계</span><h1>{card.name}</h1><h2>{card.short}</h2><p>{state.config.descriptions[card.id]}</p><strong>{card.duration}</strong></div>
    </article> : <article className="text-slide">
      {index === 0 && <><h1>진행 방식</h1><div className="slide-points"><p><b>01</b> 청팀·백팀, 총 2라운드로 경기합니다.</p><p><b>02</b> 시작·6분·12분에 증강을 1개씩 고릅니다.</p><p><b>03</b> 팀끼리 상의하고 주장이 결정을 전달합니다.</p><p><b>04</b> 아웃·부활은 심판 판정 후 진행자가 기록합니다.</p></div></>}
      {index === 1 && <><h1>진행자가 조절하는 경기 시간</h1><div className="slide-timeline">{[['준비',`${state.config.timing.prepare/60}분`],['1라운드',`${state.config.timing.rounds[0]/60}분`],['교체',`${state.config.timing.switch/60}분`],['2라운드',`${state.config.timing.rounds[1]/60}분`],['마무리',`${state.config.timing.finish/60}분`]].map(([label,time]) => <div key={label}><span>{label}</span><b>{time}</b></div>)}</div><p className="slide-lead">증강 선택은 <em>팀마다 40초씩</em>.</p><p className="slide-lead">팀이 바뀌면 새 40초가 시작됩니다. 경기 시계는 계속 갑니다.</p></>}
      {index === 2 && <><h1>안전 유의사항!</h1><div className="slide-points"><p>얼굴·머리에 맞으면 <em>아웃 무효</em>.</p><p>가까운 거리의 강한 투척은 금지합니다.</p><p>신체 접촉과 진로 방해는 지양해주세요.</p><p>짐볼은 <em>양손 언더스로</em>(아래에서 위로) 던집니다.</p><p>유효 아웃 여부는 심판이 결정합니다.</p></div></>}
      {index === 3 && <><h1>아웃 판정은 호루라기로!</h1><div className="whistle-rule"><strong>호루라기를 불 경우에만 아웃!</strong><p>아웃이 아니라면 호루라기를 불지 않습니다.</p><p>심판의 호루라기를 듣고 판정에 따라주세요.</p></div></>}
      {index === 16 && <><h1>위기에는 조기 증강</h1><div className="early-explainer"><div><span>첫 번째 기회</span><b>절반 이상 아웃</b><p>다음 단계 증강을 미리 선택합니다.</p></div><div><span>추가 기회</span><b>생존자 1명</b><p>첫 기회를 이미 사용했어도 한 번 더!</p></div></div><p className="slide-lead">같은 조기 선택 버튼을 사용합니다. 팀당 최대 2회입니다.</p><p className="slide-lead">이미 선택한 단계는 다시 받지 않습니다. 증강은 총 3개입니다.</p></>}
    </article>}
    <div className="slide-bottom"><span>설명이 끝나고 준비가 되면 진행자가 라운드 시작 버튼을 누릅니다.</span>{interactive && <div className="button-row"><button disabled={index === 0} onClick={() => dispatch({ type: 'INTRO', open: true, index: index - 1 })}>← 이전</button>{index < INTRO_SLIDE_COUNT - 1 ? <button className="primary" onClick={() => dispatch({ type: 'INTRO', open: true, index: index + 1 })}>다음 →</button> : <button className="primary" onClick={() => dispatch({ type: 'INTRO', open: false })}>설명 완료</button>}<button onClick={() => dispatch({ type: 'INTRO', open: false })}>준비 화면으로</button></div>}</div>
  </section>;
}

function NameFields({count,names,onChange,team}:{count:number;names:string[];onChange:(names:string[])=>void;team:Team}) {
  if(count===0)return <p className="target-hint">선택 시점에 지정할 외야수가 없습니다.</p>;
  if(count>2)return <label className="target-list">{TEAM_NAME[team]} 지정 선수 {count}명 · 한 줄에 한 명<textarea rows={3} value={names.join('\n')} placeholder="선수 이름 또는 등번호를 한 줄에 하나씩" onChange={e=>onChange(e.target.value.split('\n').map(n=>n.slice(0,40)))}/><span>{names.filter(n=>n.trim()).length}/{count}명 입력</span></label>;
  return <div className="target-inputs">{Array.from({length:count},(_,index)=><label key={index}>{TEAM_NAME[team]} 지정 선수 {index+1}<input maxLength={40} value={names[index]||''} placeholder={`선수 ${index+1} 이름 또는 등번호`} onChange={e=>{const next=Array.from({length:count},(_,i)=>names[i]||'');next[index]=e.target.value;onChange(next);}}/></label>)}</div>;
}
function TargetEditor({state,ri,team,stage,dispatch}:{state:GameState;ri:number;team:Team;stage:Stage;dispatch:(a:Action)=>void}) {
  const r=state.rounds[ri],p=r.teams[team].picks[stage-1];
  const [names,setNames]=useState(p.targets);
  useEffect(()=>setNames(p.targets),[p.targets]);
  if(!p.card||!CARD[p.card].targeted)return null;
  const card=CARD[p.card],count=targetCount(p.card,r,team,p),valid=namesValid(names,count),done=namesValid(p.targets,count);
  return <form className={`target-editor ${done?'':'needs-target'}`} onSubmit={e=>{e.preventDefault();if(valid)dispatch({type:'TARGETS',round:ri,team,stage,names});}}><h3>{ri+1}라운드 · {TEAM_NAME[team]} 보유 · {card.name}</h3><p>{done?'지정 완료':'지정 선수 이름을 입력하세요.'}{p.card==='seal'?` · 선택 당시 ${count}명으로 고정`:''}</p>{p.note&&<p className="muted">이전 대상 메모: {p.note}</p>}<NameFields count={count} names={names} onChange={setNames} team={card.curse?other(team):team}/><button className="primary" disabled={!valid||state.flow==='ended'}>지정 선수 저장</button>{!valid&&<p className="warning-text">{count}명의 이름을 빠짐없이, 중복 없이 입력하세요.</p>}</form>;
}
function TargetManager({state,dispatch}:{state:GameState;dispatch:(a:Action)=>void}) {
  return <div className="target-manager"><h2>증강 지정 선수</h2><p>커플 저주는 상대 선수 2명, 자폭병·첫 피격 보호는 우리 선수 1명을 지정합니다.</p>{state.rounds.flatMap((r,ri)=>TEAMS.flatMap(team=>STAGES.filter(stage=>{const p=r.teams[team].picks[stage-1];return p.card&&CARD[p.card].targeted;}).map(stage=><TargetEditor key={`${ri}-${team}-${stage}`} state={state} ri={ri} team={team} stage={stage} dispatch={dispatch}/>)))}</div>;
}
function TimingControls({state,now,interactive,dispatch}:Shared) {
  const ph=phase(state,now);
  function add(seconds:number){dispatch({type:'ADD_TIME',seconds,phaseId:phaseId(state)});}
  function custom(){const raw=window.prompt('현재 구간에 더할 시간을 분으로 입력하세요. (0.5~120분)','2');if(raw===null||!raw.trim())return;const n=Number(raw);if(!Number.isFinite(n)||n<0.5||n>120){window.alert('0.5~120분을 입력하세요.');return;}add(Math.round(n*60));}
  return <section className="timing-controls"><div><b>시간·라운드 운영</b><span>현재 구간 남은 시간 {timeText(phaseRemaining(state,now))}</span></div><div className="button-row">
    {ph.key==='prepare'&&<button className="primary" disabled={!interactive||!state.config.rounds[0].firstThrow} onClick={()=>{if(window.confirm('설명과 준비를 마쳤나요? 1라운드를 시작합니다.'))dispatch({type:'START_ROUND',round:0});}}>1라운드 시작</button>}
    {ph.key==='switch'&&<button className="primary" disabled={!interactive||!state.config.rounds[1].firstThrow} onClick={()=>{if(window.confirm('선수 교체를 마쳤나요? 2라운드를 시작합니다.'))dispatch({type:'START_ROUND',round:1});}}>2라운드 시작</button>}
    {ph.round>=0&&<button className="danger" disabled={!interactive} onClick={()=>{if(window.confirm(`${ph.round+1}라운드를 지금 종료하고 현재 생존 인원으로 결과를 기록하나요?`))dispatch({type:'END_ROUND',round:ph.round});}}>현재 라운드 조기 종료</button>}
    {!['setup','ended'].includes(ph.key)&&<><button disabled={!interactive} onClick={()=>add(60)}>추가 +1분</button><button disabled={!interactive} onClick={()=>add(180)}>추가 +3분</button><button disabled={!interactive} onClick={custom}>추가 시간 직접 입력</button></>}
    {ph.key==='finish'&&<button className="danger" disabled={!interactive} onClick={()=>{if(window.confirm('현재 결과로 행사를 종료하나요?'))dispatch({type:'FINISH_EVENT'});}}>행사 종료</button>}
  </div></section>;
}
function Choice({ state, now, interactive, dispatch, beam }: Shared) {
  const e=state.selection;if(!e)return null;
  const team=e.teams[e.index],r=state.rounds[e.round],selected=e.highlighted?CARD[e.highlighted]:null;
  const candidates=r.teams[team].picks[e.stage-1].candidates;
  const seconds=Math.max(0,Math.ceil((e.deadline!-effectiveNow(state,now))/1000));
  const count=e.highlighted?targetCount(e.highlighted,r,team):0;
  return <section className={`choice-overlay choosing-${team} stage-${e.stage}`} role="dialog" aria-modal="true" aria-label={`${TEAM_NAME[team]} 증강 선택`}>
    <div className="choice-content"><div className="choice-heading"><div><div className="selecting-team-badge">지금은 {TEAM_NAME[team]} 차례</div><h1>{TEAM_NAME[team]} 증강 선택 중</h1><span className="stage-tag">{e.stage}단계 {e.kind==='early'?'조기 선택':'정규 선택'}</span></div><div className="choice-clock"><span>{TEAM_NAME[team]} 전용 남은 시간</span><strong>{seconds}<small>초</small></strong><b>팀별 최대 40초</b></div></div>
    <div className="choice-status"><span>상의 → 주장 전달 → 카드 클릭 → 선수 지정 → 확정</span><div>{TEAMS.filter(t=>!e.teams.includes(t)&&r.teams[t].picks[e.stage-1].status==='early').map(t=><b key={t}>{TEAM_NAME[t]} 조기 선택 완료 · 건너뜀</b>)}{e.teams.slice(0,e.index).map(t=><b key={t}>{TEAM_NAME[t]}: {CARD[r.teams[t].picks[e.stage-1].card!].name} 확정</b>)}{e.teams[e.index+1]&&<span>다음: {TEAM_NAME[e.teams[e.index+1]]} · 새 40초</span>}</div></div>
    <div className="choice-grid">{candidates.map(id=><button key={id} className={`choice-card ${e.highlighted===id?'chosen':''}`} disabled={!interactive} aria-pressed={e.highlighted===id} onClick={()=>dispatch({type:'HIGHLIGHT',card:id,eventId:e.id,team})}><div className="card-band"><span>{e.stage}단계</span><b>{e.highlighted===id?'선택 예정 ✓':'후보 카드'}</b></div><Icon id={id}/><h2>{CARD[id].name}</h2><p>{CARD[id].short}</p><small>{CARD[id].duration}</small></button>)}</div>
    {!beam&&selected?.targeted&&<div className="selection-targets">{interactive?<><b>{selected.name} · {selected.curse?'상대':'우리'} 팀 선수 지정</b><NameFields count={count} names={e.targetNames} onChange={names=>dispatch({type:'TARGET_DRAFT',eventId:e.id,team,names})} team={selected.curse?other(team):team}/>{!canConfirm(state)&&<span>이름 또는 등번호 {count}개를 입력하면 확정할 수 있습니다.</span>}</>:<b>{e.targetNames.filter(n=>n.trim()).length?`지정 예정: ${e.targetNames.filter(n=>n.trim()).join(' · ')}`:count===0?'지정할 외야수 없음':`진행자가 지정 선수 ${count}명의 이름을 입력합니다.`}</b>}</div>}
    <div className="choice-footer"><p>{e.kind==='early'?`${e.stage}단계를 미리 적용하며 정규 선택은 건너뜁니다.`:'이 팀의 40초가 끝나면 왼쪽 카드가 자동 확정되고 다음 팀의 40초가 시작됩니다.'}</p>{interactive?<button className="primary" disabled={!canConfirm(state)} onClick={()=>dispatch({type:'CONFIRM',eventId:e.id,team})}>{selected?`${selected.name} · 이 카드 확정`:'카드를 클릭하세요'}</button>:<b>{TEAM_NAME[team]} 주장의 결정을 전달해주세요.</b>}</div>
    {interactive&&<><div className="choice-admin"><button onClick={()=>dispatch({type:'ADD_TIME',seconds:60,phaseId:phaseId(state)})}>경기 시간 +1분</button><button className="danger" onClick={()=>{if(window.confirm('선택 중인 카드는 자동 정리하고 현재 라운드를 종료하나요?'))dispatch({type:'END_ROUND',round:e.round});}}>라운드 조기 종료</button></div>{selected&&<p className="choice-detail">{state.config.descriptions[selected.id]}</p>}</>}
    </div>
  </section>;
}

function TeamBoard({ team, round, state, now, beam }: { team: Team; round: RoundState; state: GameState; now: number; beam: boolean }) {
  const t = round.teams[team], early = earlyStage(state, team, now);
  const incoming = round.teams[other(team)].picks.filter(p => p.card && CARD[p.card].curse && p.effect === 'active');
  return <section className={`team-board ${team} ${early ? 'eligible' : ''}`}>
    <div className="team-head"><div><h2>{TEAM_NAME[team]}</h2><span>주장 {round.captains[team]}</span></div><div className="alive"><strong>{t.alive}</strong><span>/ {t.initial}<small>생존 인원</small></span></div><div className="out-info"><b>현재 아웃 {t.initial-t.alive}명</b><span>절반 기준 {Math.ceil(t.initial/2)}명</span></div></div>
    <div className="early-indicator">{round.result ? '라운드 종료' : early ? `${t.earlyUses === 1 ? '1명 생존 · 추가' : '절반 아웃 ·'} ${early}단계 조기 선택 가능` : t.earlyReserved ? '조기 선택 예약 중' : `조기 선택 ${t.earlyUses}/2회 사용${t.earlyUses === 1 ? ' · 1명 남으면 추가 가능' : ''}`}</div>
    <div className="owned-cards">{STAGES.map(stage => {
      const p=t.picks[stage-1], card=p.card ? CARD[p.card] : null;
      return <article className={`owned-card stage-${stage} ${card ? '' : 'empty'}`} key={stage}>
        <div className="owned-art">{card ? <Icon id={card.id} /> : <b>{stage}</b>}</div>
        <div className="owned-copy"><span className="owned-meta">{stage}단계 · {card ? p.effect === 'active' ? p.status === 'early' ? '조기 선택 · 적용 중' : '적용 중' : p.effect === 'used' ? '사용 완료' : '종료' : p.status === 'reserved' ? '선택 예약' : '미선택'}</span><h3>{card?.name || '선택 대기'}</h3><p>{card?.short || `${stage === 1 ? '라운드 시작' : `${(stage-1)*6}분 경과`} 시 선택`}</p>{!beam && card?.targeted && <small title={p.targets.join(', ')}>대상: {p.targets.length ? p.targets.join(' · ') : p.card === 'seal' && p.affectedCount === 0 ? '해당 선수 없음' : '선수 이름 입력 필요'}{card.id === 'seal' ? ` · ${p.affectedCount}명 고정` : ''}</small>}{card?.curse && <small>보유: 우리 팀 / 적용: 상대 팀</small>}</div>
      </article>;
    })}</div>
    {!!incoming.length && <div className="incoming"><b>우리 팀에 적용된 상대 효과</b>{incoming.map(p => <span key={p.card}>{CARD[p.card!].name}{!beam && <>{p.targets.length ? ` · ${p.targets.join(' · ')}` : ' · 지정 선수 입력 필요'}{p.card === 'seal' ? ` · ${p.affectedCount}명` : ''}</>}</span>)}</div>}
  </section>;
}

function Results({ state, now, interactive, dispatch }: Shared) {
  const result=scores(state), ended=phase(state,now).key==='ended';
  const winner=result.complete?result.winner:null;
  return <section className={`results panel ${winner?`victory victory-${winner}`:''}`}>
    {winner&&<><VictoryEffects team={winner}/><div className="champion-emblem" aria-hidden="true"><svg viewBox="0 0 120 120" fill="none"><path d="M35 21h50v27c0 25-14 38-25 38S35 73 35 48V21Z" fill="#ffdb76"/><path d="M35 29H17v15c0 14 9 23 24 24M85 29h18v15c0 14-9 23-24 24" stroke="#f7bd43" strokeWidth="8"/><path d="M60 86v17m-21 4h42" stroke="#ffdb76" strokeWidth="9" strokeLinecap="round"/><path d="m60 32 6 12 13 2-10 9 2 13-11-6-11 6 2-13-10-9 13-2Z" fill="#a86b18"/></svg><span>CHAMPIONS</span></div></>}
    <span className="eyebrow">{result.complete ? '최종 결과' : '라운드 결과'}</span><h1>{!result.complete ? '다음 라운드 준비해주세요'  : result.winner ? `${TEAM_NAME[result.winner]} 최종 승리` : ended ? '최종 승리팀 미확정' : '주장 가위바위보 대기'}</h1>{winner&&<p className="victory-subtitle">오늘의 챔피언, {TEAM_NAME[winner]}!<br/><span>끝까지 함께 만든 승리를 축하합니다</span></p>}<div className="result-score"><span>청팀 <b>{result.points.blue}</b></span><i>:</i><span>백팀 <b>{result.points.white}</b></span></div><table><thead><tr><th>라운드</th><th>청팀 생존</th><th>백팀 생존</th><th>결과</th></tr></thead><tbody>{state.rounds.map(r=><tr key={r.number}><th>{r.number}라운드</th><td>{r.result?.blue??'—'}</td><td>{r.result?.white??'—'}</td><td>{r.result ? r.result.winner==='draw'?'무승부 · 0점':`${TEAM_NAME[r.result.winner]} 승리 · 1점`:'예정'}</td></tr>)}</tbody><tfoot><tr><th>생존 합계</th><td>{result.survivors.blue}</td><td>{result.survivors.white}</td><td>승점 동률 시 비교</td></tr></tfoot></table>
    {result.complete && result.tied && <p>{state.rpsWinner ? `실제 가위바위보: ${TEAM_NAME[state.rpsWinner]} 승리` : ended ? '마감 전 가위바위보 결과가 입력되지 않았습니다.' : '실제 주장 가위바위보로 결정한 뒤 결과를 입력하세요.'}</p>}
    {interactive && result.complete && result.tied && !ended && <div className="button-row centered">{TEAMS.map(t=><button key={t} onClick={()=>{if(window.confirm(`실제 가위바위보에서 ${TEAM_NAME[t]}이 이겼나요?`))dispatch({type:'RPS',team:t});}}>{TEAM_NAME[t]} 가위바위보 승리</button>)}</div>}
  </section>;
}

function Board(props: Shared) {
  const {state,now}=props, ph=phase(state,now), remaining=phaseRemaining(state,now);
  const next=nextSelection(state,now), round=ph.round>=0?state.rounds[ph.round]:null;
  const gymball=round && TEAMS.some(t=>round.teams[t].picks.some(p=>p.card==='gymball'&&p.effect==='active'));
  return <>
    {!scores(state).complete&&<div className="board-clock"><div><span>{ph.label}</span><strong>{timeText(remaining)}</strong></div><div className="next-timer"><span>{next.label}</span><b>{timeText(next.seconds)}</b></div>{gymball && <div className="ball-banner">짐볼 사용 중<br /><small>양 팀 공유 · 양손 언더스로</small></div>}</div>}
    {round ? <><div className="team-grid">{TEAMS.map(t=><TeamBoard key={t} team={t} round={round} state={state} now={now} beam={props.beam}/>)}</div><div className="game-notice">{round.result ? `${round.result.winner==='draw'?'무승부':TEAM_NAME[round.result.winner]+' 승리'} · 라운드 종료` : state.stopped ? '경기 중지 안내 · 심판 지시를 기다리세요. 시계는 계속 갑니다.' : '경기 진행 중 · 유효 아웃과 부활만 기록합니다.'}</div></> : ph.key==='prepare' ? <section className="ready panel"><h1>팀과 출전 인원을 확인하세요</h1><div className="two-columns">{TEAMS.map(t=><div className={t} key={t}><h2>{TEAM_NAME[t]}</h2><strong>{state.config.rounds[0][t]}<small>명</small></strong><p>주장 {state.config.captains[t]}</p></div>)}</div><p>얼굴·머리 피격 무효 · 근거리 강한 투척 금지 · 판정은 심판 확인</p></section> : <><Results {...props}/>{ph.key==='switch'&&<p className="game-notice">B조 출전 준비 · 준비되면 진행자가 2라운드를 시작합니다.</p>}</>}
  </>;
}

function Controls({ state, now, dispatch }: Shared) {
  const ph=phase(state,now), r=ph.round>=0?state.rounds[ph.round]:null;
  const active=!!r?.firstThrow&&!r.result&&!state.selection&&!state.celebration;

  function judge(team:Team,delta:number){dispatch({type:'JUDGE',blue:team==='blue'?delta:0,white:team==='white'?delta:0,kind:delta<0?'out':'revive'});}
  function correct(team:Team){if(!r)return;const answer=window.prompt(`${TEAM_NAME[team]} 현재 생존 인원 (0~${r.teams[team].initial})`,String(r.teams[team].alive));if(answer===null||!answer.trim())return;const n=Number(answer);if(!Number.isInteger(n)||n<0||n>r.teams[team].initial){window.alert('범위 안의 정수를 입력하세요.');return;}const delta=n-r.teams[team].alive;dispatch({type:'JUDGE',blue:team==='blue'?delta:0,white:team==='white'?delta:0,kind:'correction'});}
  return <section className="operator panel" onClickCapture={e=>{if(e.detail>1&&(e.target as HTMLElement).closest('button')){e.preventDefault();e.stopPropagation();}}}>
    <div className="section-title"><h2>클릭·단축키로 경기 운영</h2><button className="undo-button" disabled={undoRound(state,now)===null} onClick={()=>dispatch({type:'UNDO'})}>↶ 직전 작업 취소</button></div>
    {r&&<><div className="two-columns">{TEAMS.map(t=><div className={`control-panel ${t}`} key={t}><h3>{TEAM_NAME[t]}</h3><div className="control-buttons"><button disabled={!active||r.teams[t].alive<1} onClick={()=>judge(t,-1)}>아웃 −1 <kbd>{t==='blue'?'A':'K'}</kbd></button><button disabled={!active||r.teams[t].alive>=r.teams[t].initial} onClick={()=>judge(t,1)}>부활 +1 <kbd>{t==='blue'?'S':'L'}</kbd></button><button disabled={!active||r.teams[t].alive<2} onClick={()=>judge(t,-2)}>2명 아웃</button><button disabled={!active} onClick={()=>correct(t)}>판정 수정</button></div><button className="early-button" disabled={!active||!earlyStage(state,t,now)} onClick={()=>dispatch({type:'EARLY',teams:[t]})}>{earlyStage(state,t,now)?`${r.teams[t].earlyUses===1?'1명 생존 · 추가 ':''}${earlyStage(state,t,now)}단계 조기 선택`:r.teams[t].picks.every(p=>p.card)?'모든 증강 선택 완료':r.teams[t].earlyUses===1?'1명 남으면 추가 조기 선택':'조기 선택 조건 미충족'}</button><p className="muted">누적 아웃 {r.teams[t].outs}회 · 부활 {r.teams[t].revivals}회 · 조기 선택 {r.teams[t].earlyUses}/2회</p></div>)}</div><div className="button-row"><button disabled={!active||TEAMS.some(t=>r.teams[t].alive<1)} onClick={()=>dispatch({type:'JUDGE',blue:-1,white:-1,kind:'out',label:'양 팀 동시 1명 아웃'})}>양 팀 동시 아웃 −1 / −1</button><button disabled={!active||!TEAMS.every(t=>earlyStage(state,t,now))} onClick={()=>dispatch({type:'EARLY',teams:TEAMS})}>양 팀 조기 선택</button></div>
    <details><summary>증강 대상 메모 · 효과 종료 · 선택 정정</summary><div className="two-columns">{TEAMS.map(t=><div key={t}><h3>{TEAM_NAME[t]} 보유 증강</h3>{STAGES.map(stage=>{const p=r.teams[t].picks[stage-1];if(!p.card)return null;const c=CARD[p.card];return <article className="effect-row" key={stage}><h4>{stage}단계 · {c.name}</h4><p>{state.config.descriptions[c.id]}</p>{c.targeted&&<TargetEditor state={state} ri={ph.round} team={t} stage={stage} dispatch={dispatch}/>}{c.manualEnd&&<button disabled={!active||p.effect!=='active'} onClick={()=>dispatch({type:'END_EFFECT',team:t,stage})}>효과 사용 완료</button>}<details><summary>선택 정정 · 원래 후보만</summary><div className="button-row">{p.candidates.map(id=><button key={id} disabled={!active||id===p.card||r.teams[other(t)].picks[stage-1].card===id} onClick={()=>{if(window.confirm(`${TEAM_NAME[t]} ${stage}단계를 ${CARD[id].name}(으)로 정정하나요?`))dispatch({type:'CORRECT_PICK',team:t,stage,card:id});}}>{CARD[id].name}{id===p.card?' (현재)':''}</button>)}</div></details></article>;})}</div>)}</div></details></>}
    <details><summary>운영 로그</summary><ol className="logs">{[...state.logs].reverse().map(l=><li key={l.id}><time>{timeText(state.startedAt===null?0:(l.at-state.startedAt)/1000)}</time>{l.text}</li>)}</ol></details>
  </section>;
}

function GameApp({mode,beam}:{mode:Mode;beam:boolean}) {
  const {state,now,dispatch,owner,error,replace,restored,dismissRestored,disconnected}=useGame(mode,beam);
  const [toolsVisible,setToolsVisible]=useState(true);
  const [volume,setVolume]=useState(0.9),[muted,setMuted]=useState(false);
  const [modal,setModal]=useState<'settings'|'cards'|'targets'|null>(null);
  const [notice,setNotice]=useState('');
  const dialog=useRef<HTMLDialogElement>(null),fileInput=useRef<HTMLInputElement>(null);
  const lastAlarm=useRef('');
  const ph=phase(state,now),active=state.startedAt!==null,interactive=owner&&!beam&&!error;
  const props={state,now,interactive,dispatch,beam};
  const missingTargets=state.rounds.reduce((total,r)=>total+TEAMS.reduce((n,t)=>n+r.teams[t].picks.filter(p=>p.card&&CARD[p.card].targeted&&!namesValid(p.targets,targetCount(p.card,r,t,p))).length,0),0);
  const needsFirst=active&&(ph.key==='prepare'?state.config.rounds.some(r=>!r.firstThrow):ph.key==='switch'?!state.config.rounds[1].firstThrow:ph.round>=0?!state.rounds[ph.round].firstThrow&&!state.rounds[ph.round].result:false);
  const alarmKey=`${ph.key}:${ph.round}:${state.selection?.id||''}:${state.selection?.index??''}:${state.rounds.map(r=>r.result?.at||'').join(':')}`;
  useEffect(()=>{document.title=state.config.title||'피구 청백전';},[state.config.title]);
  useEffect(()=>{if(modal)dialog.current?.showModal();else dialog.current?.close();},[modal]);
  useEffect(()=>{if(state.selection||ph.key==='round')setModal(null);},[state.selection?.id,ph.key]);
  useEffect(()=>{if(lastAlarm.current&&lastAlarm.current!==alarmKey&&interactive&&active)void sound(muted?0:volume);lastAlarm.current=alarmKey;},[alarmKey,interactive,active,muted,volume]);
  useEffect(()=>{if(missingTargets&&interactive&&!state.selection&&!state.celebration&&state.flow!=='ended')setModal('targets');},[missingTargets,interactive,state.selection?.id,state.celebration?.until,state.flow]);
  useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),6000);return()=>clearTimeout(t);},[notice]);
  async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{setNotice('브라우저의 전체화면 기능을 사용하세요.');}}
  useEffect(()=>{
    if(!interactive||modal||state.selection||state.celebration||state.intro.open)return;
    const handler=(event:KeyboardEvent)=>{
      const target=event.target;
      const editing=target instanceof Element&&!!target.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],dialog');
      const action=shortcutAction(event,editing);
      if(!action)return;
      if(action.type==='UNDO'){
        if(undoRound(state,now)===null)return;
      }else if(ph.round<0||!state.rounds[ph.round].firstThrow||state.rounds[ph.round].result)return;
      event.preventDefault();dispatch(action);
    };
    window.addEventListener('keydown',handler);
    return()=>window.removeEventListener('keydown',handler);
  },[interactive,modal,state,now,ph.round,dispatch]);
  function openBeam(){const url=new URL(location.href);url.searchParams.set('beam','1');if(!window.open(url.href,`adv-dodge-beam-${mode}`,'popup,width=1280,height=720'))setNotice('팝업을 허용한 뒤 다시 눌러주세요.');}
  function switchMode(){const url=new URL(location.href);url.searchParams.delete('beam');if(mode==='live')url.searchParams.set('practice','1');else url.searchParams.delete('practice');if(active&&mode==='live'){window.open(url.href,'adv-dodge-practice');}else location.assign(url.href);}
  function exportJSON(){const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`증강피구-${mode}-${Date.now()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  async function importJSON(file?:File){if(!file)return;try{if(file.size>4_000_000)throw new Error('JSON은 4MB 이하만 가능합니다.');const next=parseState(await file.text());if(next.mode!==mode)throw new Error('실전·연습 구분이 다릅니다.');if(window.confirm('현재 기록을 이 JSON으로 교체하나요? 절대 시각을 유지해 지난 이벤트를 복구합니다.'))replace(next);}catch(e){window.alert(String(e));}if(fileInput.current)fileInput.current.value='';}
  function reset(){if(window.confirm('현재 기록을 지우고 새 행사를 준비하나요? 필요하면 먼저 JSON을 내보내세요.')){replace(createGame(mode,mode==='practice'?practiceConfig():undefined));setModal(null);}}
  function start(config:Config){dispatch({type:'CONFIG',config});dispatch({type:'START'});void sound(muted?0:volume);}
  const dimmed=!!(state.selection||state.celebration);
  return <div className={`app ${beam?'beam':''} ${dimmed?'choosing':''}`}>
    <header className="app-header"><div className="brand"><b>{state.config.title||'피구 청백전'}</b><span>{mode==='practice'?'연습 모드 · 실전과 별도 저장':beam?'빔 전용 화면':'청백전 운영 프로그램'}</span></div><div className="header-clocks"><div><span>{active?ph.label:'행사 시작 대기'}</span>{active&&<b>{timeText(phaseRemaining(state,now))}</b>}</div><div><span>행사 경과 시간</span><strong>{timeText(elapsed(state,now))}</strong></div></div><button onClick={()=>void fullscreen()} aria-label="전체화면">전체화면</button></header>
    {!beam&&<nav className="toolbar"><div className="button-row">{active&&<button disabled={!interactive} className={missingTargets?'warning':''} onClick={()=>setModal('targets')}>지정 선수{missingTargets?` · ${missingTargets}개 입력 필요`:''}</button>}<button onClick={openBeam}>빔 화면 열기 ↗</button>{active&&<button onClick={()=>setToolsVisible(!toolsVisible)}>{toolsVisible?'운영 도구 숨기기':'운영 도구 표시'}</button>}{ph.key==='prepare'&&!needsFirst&&<button disabled={!interactive} onClick={()=>dispatch({type:'INTRO',open:!state.intro.open,index:state.intro.index})}>{state.intro.open?'설명 닫기':'규칙 슬라이드'}</button>}{['prepare','switch'].includes(ph.key)&&<button disabled={!interactive} onClick={()=>setModal('settings')}>인원·선공 설정</button>}{!active&&<button disabled={!interactive} onClick={()=>setModal('cards')}>카드 상세 문구 편집</button>}</div><div className="button-row"><button onClick={()=>setMuted(!muted)}>{muted?'음소거 중':'소리 켜짐'}</button><input aria-label="알림 음량" className="volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={e=>setVolume(Number(e.target.value))}/><button onClick={()=>void sound(volume)}>삐용 소리 테스트</button><span className="muted">{interactive?'자동 저장 중':'읽기 전용'}</span></div></nav>}
    {!beam&&!owner&&!error&&<div className="notice">다른 운영자 창이 있으면 이 창은 읽기 전용입니다. 기존 창을 닫으면 조작 권한을 받습니다.</div>}
    {beam&&(disconnected||error)&&<div className="sync-notice">운영자 연결 확인 중 · 마지막 저장 상태 표시</div>}
    {restored&&interactive&&<div className="notice">저장 기록을 복구했습니다. 현재 실제 선수 인원을 확인하세요.<button onClick={dismissRestored}>확인</button></div>}
    {error&&!beam?<section className="panel recovery"><h1>저장 상태를 확인해야 합니다</h1><p>{error}</p><button disabled={!owner} onClick={()=>fileInput.current?.click()}>정상 JSON 가져오기</button><button disabled={!owner} onClick={reset}>새 행사 시작</button></section>:<>
      <main className={dimmed?'dimmed':''}>
        {active&&!beam&&interactive&&<TimingControls {...props}/>}
        {!active?beam?<section className="waiting"><h1>{state.config.title}</h1><strong>경기 준비</strong><p>진행자가 게임을 시작하면 선공 결정과 규칙 설명을 진행합니다.</p></section>:<div className="setup-layout"><aside><span className="eyebrow">증강으로 달라지는 승부</span><h1>피구<br/>청백전</h1><p>설정 → 게임 시작 → 선공 결정 →<br/>규칙 슬라이드 → 경기</p><div className="schedule-mini">준비 시간·경기 시간 설정<br/>진행자가 라운드 시작<br/>경기 중 추가 시간 부여<br/>필요하면 라운드 조기 종료</div><button disabled={!interactive} onClick={mode==='live'?switchMode:()=>dispatch({type:'CONFIG',config:practiceConfig()})}>{mode==='live'?'연습 모드로 시작하기':'연습용 10명 설정'}</button></aside><Setup config={state.config} disabled={!interactive} onChange={config=>dispatch({type:'CONFIG',config})} onSave={start}/></div>:needsFirst?<FirstPicker {...props}/>:state.intro.open&&ph.key==='prepare'?<Presentation {...props}/>:<Board {...props}/>}
        {active&&!beam&&interactive&&toolsVisible&&!needsFirst&&!state.intro.open&&<><div className="operation-bar"><button disabled={ph.key==='ended'} className={state.stopped?'warning':''} onClick={()=>dispatch({type:'STOP'})}>{state.stopped?'경기 중지 안내 해제':'경기 중지 안내'}</button><span>안내 중에도 행사 시계는 계속 갑니다.</span></div><Controls {...props}/></>}
        {mode==='practice'&&active&&!beam&&interactive&&<div className="practice-tools"><b>연습 전용</b><button onClick={()=>dispatch({type:'PAUSE'})}>{state.pausedAt===null?'시계 일시정지':'시계 재개'}</button><button onClick={()=>dispatch({type:'SKIP',seconds:40})}>+40초</button><button onClick={()=>dispatch({type:'SKIP',seconds:60})}>+1분</button><button onClick={()=>dispatch({type:'SKIP',seconds:300})}>+5분</button></div>}
      </main>
      <Choice {...props}/>
      {state.celebration&&<div className={`celebration stage-${state.celebration.stage}`}><h1>{state.celebration.stage}단계 증강 확정</h1><div className="two-columns">{state.celebration.teams.map(t=>{const p=state.rounds[state.celebration!.round].teams[t].picks[state.celebration!.stage-1];return p.card&&<article key={t}><Icon id={p.card}/><h2>{TEAM_NAME[t]} · {CARD[p.card].name}</h2></article>;})}</div></div>}
    </>}
    {!beam&&<footer><span>청팀 A 아웃 / S 부활 · 백팀 K 아웃 / L 부활 · Ctrl/Cmd+Z 취소 · 클릭도 가능</span><div className="button-row"><button onClick={exportJSON}>JSON 내보내기</button><button disabled={!owner} onClick={()=>fileInput.current?.click()}>JSON 가져오기</button><button onClick={switchMode}>{mode==='live'?'연습 모드':'실전으로'}</button><button disabled={!owner} onClick={reset}>새 행사</button></div></footer>}
    {notice&&<div className="toast" role="status">{notice}</div>}
    <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={e=>void importJSON(e.target.files?.[0])}/>
    <dialog ref={dialog} onCancel={()=>setModal(null)}><button className="dialog-close" onClick={()=>setModal(null)}>닫기 ×</button>{modal==='targets'&&<TargetManager state={state} dispatch={dispatch}/>}{modal==='settings'&&<><Setup config={state.config} editing disabled={!interactive||!['prepare','switch'].includes(ph.key)} onSave={config=>{dispatch({type:'CONFIG',config});setModal(null);}}/><FirstPicker {...props}/></>}{modal==='cards'&&<><h2>카드 상세 문구 편집</h2><p>수정한 설명은 준비 슬라이드와 운영자 설명에 반영됩니다.</p>{CARDS.map(c=><label className="card-editor" key={c.id}>{c.stage}단계 · {c.name}<textarea disabled={!interactive||active} rows={4} maxLength={1600} value={state.config.descriptions[c.id]} onChange={e=>{const config=structuredClone(state.config);config.descriptions[c.id]=e.target.value;dispatch({type:'CONFIG',config});}}/></label>)}</>}</dialog>
  </div>;
}
export default function App(){const params=new URLSearchParams(location.search);const mode:Mode=params.get('practice')==='1'?'practice':'live';return <GameApp key={mode} mode={mode} beam={params.get('beam')==='1'}/>;}
