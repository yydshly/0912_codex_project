import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {SlideCanvas} from '@openmaic/renderer';
import {validateScene} from '@openmaic/dsl';
import {INITIAL, circuit, assessProject, gradeQuiz, restore, makeSlides, lessonReport} from '../src/case-model.mjs';

test('电路计算与电压、电阻的变化规律',()=>{
  assert.deepEqual(circuit(6,300),{voltage:6,resistance:300,current:.02,milliamp:20,power:.12});
  const base=circuit(6,300),doubleVoltage=circuit(12,300),doubleResistance=circuit(6,600);
  assert.equal(doubleVoltage.current,base.current*2);
  assert.equal(doubleVoltage.power,base.power*4);
  assert.equal(doubleResistance.current,base.current/2);
  assert.equal(doubleResistance.power,base.power/2);
  assert.equal(circuit(0,300).power,0);
  for(const [u,r] of [[-1,300],[6,0],[6,-1],[Infinity,300],[6,NaN]]) assert.throws(()=>circuit(u,r),RangeError);
});

test('项目数值边界与候选阻值筛选',()=>{
  assert.equal(assessProject(240).pass,true);
  assert.equal(assessProject(400).pass,true);
  assert.equal(assessProject(239).currentPass,false);
  assert.equal(assessProject(401).currentPass,false);
  assert.equal(assessProject(100).powerPass,false);
  assert.deepEqual([100,150,220,330,470,680].filter(r=>assessProject(r).pass),[330]);
});

test('测验精确匹配、单位错误与空答识别',()=>{
  assert.equal(gradeQuiz({q1:['0'],q2:['2','0'],q3:'20'}).correct,3);
  assert.equal(gradeQuiz({q1:['0'],q2:['2','0','0'],q3:20}).correct,3);
  assert.equal(gradeQuiz({q1:['1'],q2:['0','1','2'],q3:'.02'}).correct,0);
  for(const value of ['', ' ', undefined, 'NaN', 'Infinity']) assert.equal(gradeQuiz({q1:['0'],q2:['0','2'],q3:value}).complete,false);
  assert.equal(gradeQuiz({}).complete,false);
});

test('恢复学习状态时校验范围、丢弃损坏数据、重新计算实验结果',()=>{
  assert.deepEqual(restore({version:'old'}),INITIAL);
  const restored=restore({...INITIAL,scene:'unknown',voltage:999,resistance:-3,slideIndex:9,customTitle:'长'.repeat(60),records:[{voltage:6,resistance:300,milliamp:999},null,{voltage:0,resistance:0}],answers:{q1:['bad','0']},completed:['lecture','lecture','unknown']});
  assert.equal(restored.scene,'brief');
  assert.equal(restored.voltage,12);
  assert.equal(restored.resistance,100);
  assert.equal(restored.slideIndex,2);
  assert.equal(restored.customTitle.length,20);
  assert.deepEqual(restored.records,[circuit(6,300)]);
  assert.deepEqual(restored.answers.q1,['0']);
  assert.deepEqual(restored.completed,['lecture']);
  assert.equal(restore({...INITIAL,records:Array.from({length:40},()=>({voltage:6,resistance:300}))}).records.length,20);
  assert.equal(restore({...INITIAL,submittedQuiz:true,projectSubmitted:true}).submittedQuiz,false);
  assert.equal(restore({...INITIAL,projectSubmitted:true}).projectSubmitted,false);
});

test('三页课件通过官方 DSL 场景校验，编辑文本作 HTML 转义',()=>{
  const slides=makeSlides('<img src=x>');
  slides.forEach((canvas,order)=>{
    const result=validateScene({id:canvas.id,stageId:'ohm-case',title:'欧姆定律',order,type:'slide',content:{type:'slide',canvas},actions:[]});
    assert.equal(result.valid,true,JSON.stringify(result));
  });
  const title=slides[0].elements.find(e=>e.id==='title').content;
  assert.ok(title.includes('&lt;img src=x&gt;'));
  assert.ok(!title.includes('<img'));
});

test('官方 SlideCanvas 实际完成服务端渲染并产生课件内容',()=>{
  for(const slide of makeSlides()){
    const markup=renderToString(React.createElement(SlideCanvas,{slide}));
    assert.ok(markup.includes(slide.elements.find(e=>e.id==='formula').content));
    assert.ok(markup.length>1000);
  }
});

test('导出记录区分未提交与已提交，保留计算值和修改内容',()=>{
  assert.ok(lessonReport(INITIAL).includes('尚未提交'));
  const report=lessonReport({...INITIAL,records:[circuit(6,300)],submittedQuiz:true,answers:{q1:['0'],q2:['0','2'],q3:'20'},projectSubmitted:true,projectNote:'按电流范围计算阻值',customTitle:'我的电路课'});
  for(const text of ['20.00 mA','3/3 题正确','作答：20 mA','结果：正确','提交状态：已提交','我的电路课','按电流范围计算阻值','未调用模型']) assert.ok(report.includes(text));
});
