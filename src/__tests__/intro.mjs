import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as g from '../game.ts';
const T=1700000000000;
let count=0;
function test(name,fn){fn();console.log(`통과 ${++count}. ${name}`);}
function start(team){let s=g.reduce(g.createGame('live',g.practiceConfig()),{type:'START'},T);return g.reduce(s,{type:'FIRST',round:0,team},T+1000);}
test('청팀 선공 선택 시 백팀 자동 배정·설명 자동 열림',()=>{const s=start('blue');assert.equal(s.config.rounds[1].firstThrow,'white');assert.equal(s.rounds[1].firstThrow,'white');assert(s.intro.open);});
test('백팀 선공 선택 시 청팀 자동 배정',()=>{const s=start('white');assert.equal(s.config.rounds[1].firstThrow,'blue');});
test('준비 중 선공 변경 시 반대팀도 갱신',()=>{const s=g.reduce(start('blue'),{type:'FIRST',round:0,team:'white'},T+2000);assert.equal(s.config.rounds[1].firstThrow,'blue');});
test('같은 팀으로 2라운드 선공 지정 불가',()=>{const s=g.reduce(start('blue'),{type:'FIRST',round:1,team:'blue'},T+2000);assert.equal(s.config.rounds[1].firstThrow,'white');});
test('17장 전체 이동·저장 복구',()=>{let s=start('blue');for(let i=0;i<17;i++){s=g.reduce(s,{type:'INTRO',open:true,index:i},T+2000+i);assert.equal(s.intro.index,i);assert.equal(g.parseState(JSON.stringify(s)).intro.index,i);}s=g.reduce(s,{type:'INTRO',open:true,index:99},T+3000);assert.equal(s.intro.index,16);});
test('새 증강 문구·주의 문구 없음',()=>{assert(g.CARD.shield.detail.includes('첫 번째'));assert.equal(g.CARD.rescue.short,'바닥 전에 터치하면 아웃 무효');assert(!g.CARD.gymball.detail.includes('어깨'));assert(g.CARDS.every(c=>!('caution' in c)));});
test('이전 기본 설명만 새 설명으로 갱신',()=>{const old=JSON.parse(readFileSync(new URL('./fixtures/v2-active.json',import.meta.url),'utf8'));old.config.descriptions.bomber='진행자가 직접 편집한 설명';const s=g.parseState(JSON.stringify(old));assert.equal(s.config.descriptions.bomber,'진행자가 직접 편집한 설명');assert.equal(s.config.descriptions.shield,g.CARD.shield.detail);assert.equal(s.config.descriptions.gymball,g.CARD.gymball.detail);});
