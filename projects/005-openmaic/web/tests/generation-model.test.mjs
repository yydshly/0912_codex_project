import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {SlideCanvas} from '@openmaic/renderer';
import {validateScene} from '@openmaic/dsl';
import {MODULES,DEFAULTS,createArtifact,parseArtifact,gradeArtifact,assessTask,experimentHtml,SANDBOX_POLICY} from '../src/generation-model.mjs';

test('六种产物均可解析，输入改变会传播到生成结果',()=>{
 for(const m of MODULES){
  const raw=createArtifact(m.id,DEFAULTS);
  const encode=x=>typeof x==='string'?x:JSON.stringify(x);
  assert.deepEqual(parseArtifact(m.id,encode(raw)),raw);
  assert.notEqual(encode(createArtifact(m.id,{...DEFAULTS,voltage:12})),encode(raw));
 }
 assert.throws(()=>createArtifact('slide',{...DEFAULTS,resistance:0}),/电压/);
});
test('无效格式、悬空元素动作、脚本注入和无效答案键被拒绝',()=>{
 assert.throws(()=>parseArtifact('slide','{'),/JSON/);
 const slide=createArtifact('slide',DEFAULTS);
 slide.actions[0].elementId='missing';assert.throws(()=>parseArtifact('slide',JSON.stringify(slide)),/元素 ID/);
 slide.actions[0].elementId='formula';slide.slide.elements[0].content='<img src=x onerror="alert(1)">';
 assert.throws(()=>parseArtifact('slide',JSON.stringify(slide)),/基本文字/);
 const q=createArtifact('quiz',DEFAULTS);q.answer='missing';assert.throws(()=>parseArtifact('quiz',JSON.stringify(q)),/答案/);
});
test('生成课件通过官方 DSL 并实际渲染；标题输入作为文字处理',()=>{
 const a=createArtifact('slide',{...DEFAULTS,title:'<script>alert(1)</script>'});
 const result=validateScene({id:a.slide.id,stageId:'generation-lab',title:'示例',order:0,type:'slide',content:{type:'slide',canvas:a.slide},actions:[]});
 assert.equal(result.valid,true,JSON.stringify(result));
 const html=renderToStaticMarkup(React.createElement(SlideCanvas,{slide:a.slide}));
 assert.ok(html.includes('20.00 mA'));assert.ok(!html.includes('<script>alert(1)</script>'));
});
test('评分拒绝空答、遵循答案键与数值容差',()=>{
 const q=createArtifact('quiz',DEFAULTS);
 assert.throws(()=>gradeArtifact(q,'b',''),/完成/);
 assert.deepEqual(gradeArtifact(q,'b','.12'),{choice:true,numeric:true});
 assert.deepEqual(gradeArtifact(q,'a','12'),{choice:false,numeric:false});
 q.answer='a';assert.equal(gradeArtifact(q,'b','.12').choice,false);
});
test('项目约束在范围边缘和非法输入时正确处理',()=>{
 const a=createArtifact('task',DEFAULTS);
 assert.equal(assessTask(a,300).pass,true);assert.equal(assessTask(a,400).pass,true);
 assert.equal(assessTask(a,100).pass,false);assert.equal(assessTask(a,470).pass,false);
 assert.throws(()=>assessTask(a,0),/候选电阻/);
});
test('实验实际脚本可计算、响应输入和父页面消息；无浏览器测试',()=>{
 const html=experimentHtml(DEFAULTS),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
 const elements=Object.fromEntries(['voltage','resistance','uv','rv','meter','bar','power'].map(id=>[id,{value:id==='voltage'?'6':id==='resistance'?'300':'',style:{},listeners:{},addEventListener(name,fn){this.listeners[name]=fn;}}]));
 const messages=[],listeners={},parent={postMessage:m=>messages.push(m)};
 vm.runInNewContext(script,{document:{getElementById:id=>elements[id]},parent,addEventListener:(name,fn)=>listeners[name]=fn},{timeout:1000});
 assert.equal(elements.meter.textContent,'20.00 mA');
 elements.resistance.value='600';elements.resistance.listeners.input();assert.equal(elements.meter.textContent,'10.00 mA');
 listeners.message({source:parent,data:{type:'SET_WIDGET_STATE',state:{voltage:12}}});assert.equal(elements.meter.textContent,'20.00 mA');
 assert.equal(messages.at(-1).voltage,12);
 listeners.message({source:{},data:{type:'SET_WIDGET_STATE',state:{voltage:1}}});assert.equal(elements.voltage.value,12);
 assert.ok(SANDBOX_POLICY.includes("connect-src 'none'"));
});
