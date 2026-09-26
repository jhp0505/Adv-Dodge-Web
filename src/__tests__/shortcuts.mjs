import assert from 'node:assert/strict';
import { shortcutAction } from '../shortcuts.ts';
const base={code:'KeyA',key:'a',repeat:false,isComposing:false,ctrlKey:false,metaKey:false,altKey:false,shiftKey:false};
let n=0;function test(name,fn){fn();console.log(`통과 ${++n}. ${name}`);}
for(const [code,blue,white,kind] of [['KeyA',-1,0,'out'],['KeyS',1,0,'revive'],['KeyK',0,-1,'out'],['KeyL',0,1,'revive']])test(code+' 판정 매핑',()=>assert.deepEqual(shortcutAction({...base,code},false),{type:'JUDGE',blue,white,kind}));
test('입력창에서는 무시',()=>assert.equal(shortcutAction(base,true),null));
test('길게 눌러 반복 판정 금지',()=>assert.equal(shortcutAction({...base,repeat:true},false),null));
test('한글 조합 입력 중 무시',()=>assert.equal(shortcutAction({...base,isComposing:true},false),null));
test('한글 자판도 물리 키 지원',()=>assert.equal(shortcutAction({...base,key:'ㅁ'},false).blue,-1));
test('Ctrl+Z 취소',()=>assert.deepEqual(shortcutAction({...base,code:'KeyZ',ctrlKey:true},false),{type:'UNDO'}));
test('Cmd+Z 취소',()=>assert.deepEqual(shortcutAction({...base,code:'KeyZ',metaKey:true},false),{type:'UNDO'}));
test('Ctrl+A·Alt+A·Ctrl+Shift+Z는 가로채지 않음',()=>{for(const flags of [{ctrlKey:true},{altKey:true},{ctrlKey:true,shiftKey:true,code:'KeyZ'}])assert.equal(shortcutAction({...base,...flags},false),null);});
