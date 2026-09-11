import React, {useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {SlideCanvas} from '@openmaic/renderer';
import {INITIAL,SCENES,QUIZ,LESSON_VERSION,circuit,assessProject,gradeQuiz,restore,makeSlides,lessonReport} from './case-model.mjs';

const STORE='openmaic-ohm-case-v1';
const SOURCES='https://openstax.org/books/physics/pages/19-key-equations';
function loadState(){try{return restore(JSON.parse(localStorage.getItem(STORE)||'null'));}catch{return restore(null);}}
const fmt=(n,d=2)=>Number(n).toFixed(d);
function download(filename,text,type='text/plain;charset=utf-8'){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
class RenderBoundary extends React.Component<any,any>{
  constructor(props){super(props);this.state={failed:false};}
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<div className="sdk-failure"><h3>课件组件未能渲染</h3><p>其他案例仍可操作。请查看下方文字讲解与案例说明；本状态不算渲染成功。</p></div>:this.props.children;}
}
function SourceLink(){return <a href={SOURCES} target="_blank" rel="noreferrer">欧姆定律与功率公式依据 ↗</a>;}
function App(){
  const [state,setState]=useState(loadState);
  const [saveStatus,setSaveStatus]=useState('学习记录保存在本浏览器');
  const [events,setEvents]=useState(['已载入预编写课程；尚未调用模型。']);
  const [playing,setPlaying]=useState(false);
  const [spotlight,setSpotlight]=useState(true);
  const [voiceState,setVoiceState]=useState('idle');
  const [voiceMessage,setVoiceMessage]=useState('');
  const [question,setQuestion]=useState('resistance');
  const [discussionStep,setDiscussionStep]=useState(0);
  const [discussionContext,setDiscussionContext]=useState(()=>({voltage:state.voltage,resistance:state.resistance}));
  const [notice,setNotice]=useState('');
  const [quizNotice,setQuizNotice]=useState('');
  const heading=useRef<HTMLHeadingElement>(null);
  const voiceTimer=useRef<any>(null);
  const slides=useMemo(()=>makeSlides(state.customTitle),[state.customTitle]);
  const value=circuit(state.voltage,state.resistance);
  const project=assessProject(state.projectResistance);
  const graded=gradeQuiz(state.answers);
  const index=SCENES.findIndex(([id])=>id===state.scene);
  const update=patch=>setState(s=>({...s,...patch}));
  const record=text=>setEvents(e=>[text,...e].slice(0,6));
  const stopVoice=()=>{if('speechSynthesis' in window) window.speechSynthesis.cancel();clearTimeout(voiceTimer.current);setVoiceState('idle');};
  const go=id=>{if(id==='discussion'){setDiscussionContext({voltage:state.voltage,resistance:state.resistance});setDiscussionStep(0);}stopVoice();setPlaying(false);setNotice('');setState(s=>({...s,scene:id,completed:[...new Set([...s.completed,s.scene])]}));record('切换场景：'+SCENES.find(x=>x[0]===id)?.[1]);setTimeout(()=>heading.current?.focus(),0);};
  useEffect(()=>{try{localStorage.setItem(STORE,JSON.stringify(state));setSaveStatus('学习记录保存在本浏览器');}catch{setSaveStatus('浏览器存储不可用；本次交互仍可使用，建议下载记录。');}},[state]);
  useEffect(()=>()=>{if('speechSynthesis' in window)window.speechSynthesis.cancel();clearTimeout(voiceTimer.current);},[]);
  const scripts=[
    [state.customNarration,'看公式：电流 I 等于电压 U 除以电阻 R。先确认电压和电阻，再计算电流。','这里讨论理想欧姆电阻，假设电阻近似恒定。发热导致阻值变化时，不能不加判断地套用固定数值。'],
    ['设电压是 6 伏，电阻是 300 欧姆。我们要求通过电阻的电流。','用电压除以电阻：6 除以 300，得到 0.02 安培。','把安培换成毫安，乘以 1000，得到 20 毫安。注意别把 0.02 安培误写成 0.02 毫安。'],
    ['电阻会消耗电能，不能只关心电流，还要计算功率。','用 P 等于 U 乘以 I。也可以把 I 换成 U 除以 R，得到 P 等于 U 的平方除以 R。','在这个例子中，6 乘以 0.02 等于 0.12 瓦。接下来到参数实验里，看改变电压和电阻会发生什么。']
  ];
  const narration=scripts[state.slideIndex][state.line];
  const nextLine=()=>{stopVoice();if(state.line<2)update({line:state.line+1});else if(state.slideIndex<2)update({line:0,slideIndex:state.slideIndex+1});else{setPlaying(false);setNotice('三页讲解已结束。可以进入白板推导，或重播当前课件。');}record('执行讲解动作：推进字幕与课件重点。');};
  useEffect(()=>{if(!playing||state.scene!=='lecture')return;const t=setTimeout(nextLine,4500);return()=>clearTimeout(t);},[playing,state.scene,state.line,state.slideIndex]);
  const readAloud=()=>{
    if(voiceState==='speaking'||voiceState==='starting'){stopVoice();return;}
    if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){setVoiceMessage('此浏览器没有语音朗读接口，请阅读字幕。');return;}
    setPlaying(false);stopVoice();setVoiceState('starting');setVoiceMessage('正在请求浏览器 / 系统语音。');
    const utterance=new SpeechSynthesisUtterance(narration);utterance.lang='zh-CN';utterance.rate=.95;
    const voices=window.speechSynthesis.getVoices();const voice=voices.find(v=>/^zh/i.test(v.lang));if(voice)utterance.voice=voice;
    utterance.onstart=()=>{clearTimeout(voiceTimer.current);setVoiceState('speaking');setVoiceMessage('正在朗读当前字幕；这是浏览器 / 系统声音。');};
    utterance.onend=()=>{clearTimeout(voiceTimer.current);setVoiceState('idle');setVoiceMessage('当前字幕朗读结束。');};
    utterance.onerror=e=>{clearTimeout(voiceTimer.current);setVoiceState('idle');setVoiceMessage(e.error==='canceled'||e.error==='interrupted'?'朗读已停止。':'系统语音不可用，请使用字幕讲解。');};
    voiceTimer.current=setTimeout(()=>{window.speechSynthesis.cancel();setVoiceState('idle');setVoiceMessage('系统语音没有开始响应，请使用字幕讲解。');},8000);
    window.speechSynthesis.speak(utterance);
  };
  const board=[
    ['写出关系','I = U / R','先用符号表达：所求电流由电压和电阻决定。'],
    ['代入数据','I = 6 / 300 = 0.02 A','电压使用 V，电阻使用 Ω，得到的电流单位是 A。'],
    ['换算单位','0.02 A = 20 mA','1 A = 1000 mA，不要把小数点的位置搞错。'],
    ['再算功率','P = 6 × 0.02 = 0.12 W','同一组数值，可以同时检验电流与功率目标。']
  ];
  const dc=circuit(discussionContext.voltage,discussionContext.resistance);
  const dialogues={
    resistance:[
      ['林老师','我们先固定电压 '+dc.voltage+' V。当前电阻 '+dc.resistance+' Ω，对应电流 '+fmt(dc.milliamp)+' mA。'],
      ['小陈 · 提问同学','如果只把电阻翻倍，电流会不会也翻倍？'],
      ['阿宁 · 助教','恰好相反。I = U / R，分母翻倍，电流变成 '+fmt(dc.milliamp/2)+' mA，也就是原来的一半。'],
      ['林老师','回到实验页，保持电压不变，只改变电阻。一次只改一个量，就能检验这个判断。']
    ],
    voltage:[
      ['林老师','现在把电阻保持在 '+dc.resistance+' Ω，思考电压变化。'],
      ['小陈 · 提问同学','电压翻倍后，功率也只是翻倍吗？'],
      ['阿宁 · 助教','电流会翻倍，但 P = U² / R，所以功率变成四倍。当前功率 '+fmt(dc.power,3)+' W，理论上会变成 '+fmt(dc.power*4,3)+' W。'],
      ['林老师','这个推理假设电阻不变。实际元件还涉及温度和额定条件，本案例只验证理想模型。']
    ],
    unit:[
      ['小陈 · 提问同学','我算出 0.02，为什么答案写成 20？'],
      ['阿宁 · 助教','它们用了不同单位。0.02 A 和 20 mA 表示同样大小的电流。'],
      ['林老师','计算时先写 6 V ÷ 300 Ω = 0.02 A，再单独写单位换算。'],
      ['小陈 · 提问同学','明白了，换成毫安是乘 1000，不是改变电流本身。']
    ]
  };
  const currentDialog=dialogues[question];
  const contextText={
    brief:'这里是实际采用的原创材料与预编写大纲；本案例没有执行上传、OCR 或 AI 大纲生成。',
    lecture:'页面由 @openmaic/renderer 0.1.6 的 SlideCanvas 实际渲染。文字、位置和重点目标来自课件数据；讲解顺序由案例程序控制。',
    board:'白板内容和逐步揭示由本案例实现，用于展示“讲解 + 板书”的形态；没有调用上游白板动作引擎。',
    lab:'参数变化由本地公式即时计算。电路图与曲线是原创教学实现，不是上游自动生成的仿真。',
    discussion:'角色话术预先编写，数字由你刚才的实验参数代入；下一位发言者由脚本安排，没有调用导演模型。',
    quiz:'三道题使用明确答案和数值容差评分。这里不是上游简答题模型评分接口。',
    project:'系统实际检查电流和功率约束；设计说明只保存，不做 AI 评价。它演示项目式学习的任务、提交与反馈形态。',
    edit:'修改标题会实时传给官方课件渲染器。导出为课件 Slide 数组与本案例记录；不是上游课堂 ZIP、PPTX 或 MP4。'
  };
  function setAnswer(q,value){setState(s=>({...s,answers:{...s.answers,[q]:value},submittedQuiz:false}));setQuizNotice('');}
  function toggleAnswer(q,value){const current=state.answers[q]||[];setAnswer(q,current.includes(value)?current.filter(v=>v!==value):[...current,value]);}
  function submitQuiz(){const g=gradeQuiz(state.answers);if(!g.complete){setQuizNotice('请先完成三道题，再提交查看反馈。');return;}update({submittedQuiz:true});setQuizNotice('已完成规则评分：'+g.correct+' / '+g.total+' 题正确。');record('测验提交：规则判分 '+g.correct+'/'+g.total+'，保存作答。');}
  function recordExperiment(){update({records:[...state.records,circuit(state.voltage,state.resistance)].slice(-20)});setNotice('已记录当前数据，最多保留最近 20 组。');record('记录实验：'+state.voltage+' V / '+state.resistance+' Ω。');}
  const drawX=u=>55+u/12*460, drawY=i=>220-i/130*170;
  return <div className="case-app">
    <a className="case-skip" href="#lesson-main">跳到课堂</a>
    <header className="case-header"><a href="index.html" className="case-brand"><span>M</span>OpenMAIC <small>案例课堂</small></a><div className="case-course-name">欧姆定律：为 6 V 电路选一个电阻</div><a href="docs/case-study.html">案例与实现边界 ↗</a></header>
    <div className="case-provenance"><span>真实官方组件：课件渲染</span><span>原创交互：公式实验、评分、任务</span><span>预设内容：课程与角色对话</span></div>
    <div className="case-layout">
      <aside className="case-sidebar"><div className="sidebar-title">一堂课，八种效果形态</div><nav aria-label="案例场景">{SCENES.map(([id,title,sub],i)=><button key={id} onClick={()=>go(id)} aria-current={state.scene===id?'step':undefined}><span className="step-number">{String(i+1).padStart(2,'0')}</span><span><strong>{title}</strong><small>{sub}</small></span>{state.completed.includes(id)&&<span className="visited" aria-label="已查看">✓</span>}</button>)}</nav><div className="sidebar-foot"><p>{saveStatus}</p><a href="docs/module-principles.html">六个模块如何生成与运行？</a><a href="assets/capability-overview.png">一图看懂全部能力 ↗</a><a href="index.html#compare">它与 NotebookLM 有何区别？</a><a href="docs/research.html">查看完整研究</a></div></aside>
      <main id="lesson-main" className="lesson-main"><div className="scene-heading"><div><p>CASE STUDY / {String(index+1).padStart(2,'0')}</p><h1 ref={heading} tabIndex={-1}>{SCENES[index][1]}</h1></div><span className="scene-tag">{state.scene==='lecture'?'官方组件运行中':'可操作教学案例'}</span></div>
        {state.scene==='brief'&&<section className="brief-scene"><div className="brief-lead"><p className="tiny-title">你将完成的任务</p><h2>让电流落在 15–25 mA，<br/>同时让功率不超过 0.25 W。</h2><p>已知电压 6 V，从候选电阻中选出合适方案。先理解公式，再用实验和测验验证判断。</p><button className="primary" onClick={()=>go('lecture')}>开始上课 →</button></div><div className="brief-grid"><article><h3>本课使用的材料</h3><blockquote>理想欧姆电阻：I = U / R。<br/>电功率：P = UI = U² / R。<br/>1 A = 1000 mA。</blockquote><p>原创案例文字，基础公式对照 OpenStax。只讨论理想电阻模型，不模拟温升、电源内阻或真实器件公差。</p><SourceLink/></article><article><h3>预编写课程方案</h3><ol><li>讲三个变量，用 6 V / 300 Ω 做例题。</li><li>白板展开计算，并用滑杆观察规律。</li><li>老师、助教和同学讨论两种常见误解。</li><li>做三道题，再提交自己的电阻方案。</li></ol><p className="small-note">这份大纲已编写好；在完整 OpenMAIC 中可由模型生成并继续编辑。</p></article></div></section>}
        {state.scene==='lecture'&&<section><div className="slide-top"><div role="group" aria-label="选择课件">{slides.map((s,i)=><button key={s.id} aria-pressed={state.slideIndex===i} onClick={()=>{stopVoice();setPlaying(false);update({slideIndex:i,line:0});}}>{i+1}. {['理解关系','计算电流','计算功率'][i]}</button>)}</div><label className="switch-label"><input type="checkbox" checked={spotlight} onChange={e=>setSpotlight(e.target.checked)}/>显示重点</label></div><div className="slide-frame"><RenderBoundary key={state.slideIndex}><SlideCanvas slide={slides[state.slideIndex]} effects={spotlight?{highlight:{elementId:state.line===0?'title':state.line===1?'formula':state.slideIndex===0?'condition':'conversion',color:'#d99113',animated:false}}:{}}/></RenderBoundary></div><div className="narration-box"><span className="avatar teacher">林</span><div><strong>林老师 <small>预设讲解 · {state.line+1}/3</small></strong><p aria-live="polite">{narration}</p></div></div><div className="control-row"><button className="primary" onClick={()=>{stopVoice();if(!playing&&state.slideIndex===2&&state.line===2)update({slideIndex:0,line:0});setPlaying(p=>!p);}}>{playing?'暂停讲解':'播放预设讲解'}</button><button onClick={nextLine}>下一句 →</button><button onClick={readAloud}>{voiceState==='starting'?'停止语音请求':voiceState==='speaking'?'停止朗读':'朗读当前字幕'}</button><span className="small-note">浏览器 / 系统语音，不是上游 TTS；没有声音时仍可阅读字幕。</span></div>{voiceMessage&&<p className="small-note" role="status">{voiceMessage}</p>}</section>}
        {state.scene==='board'&&<section><div className="board-surface"><div className="board-label">林老师的白板 · 固定例题：6 V / 300 Ω</div>{board.slice(0,state.boardStep+1).map(([title,formula,tip],i)=><div className={'board-line '+(i===state.boardStep?'current':'')} key={title}><span>{i+1}</span><div><small>{title}</small><strong>{formula}</strong><p>{tip}</p></div></div>)}</div><div className="control-row"><button disabled={state.boardStep===0} onClick={()=>update({boardStep:state.boardStep-1})}>上一步</button><button className="primary" disabled={state.boardStep===3} onClick={()=>{update({boardStep:state.boardStep+1});record('白板动作：显示第 '+(state.boardStep+2)+' 步公式。');}}>下一步推导 →</button><button onClick={()=>update({boardStep:0})}>清空后重讲</button><SourceLink/></div></section>}
        {state.scene==='lab'&&<section><div className="lab-grid"><div className="experiment-visual"><svg viewBox="0 0 540 260" role="img" aria-label="理想电阻回路示意：左侧为电源，右侧为电阻；不表示实体接线"><path d="M100 113 V55 H430 V95 M430 165 V215 H100 V139" fill="none" stroke="#446d83" strokeWidth="5"/><path d="M70 113 H130 M84 139 H116" stroke="#e09b21" strokeWidth="5"/><rect x="410" y="95" width="40" height="70" rx="3" fill="#daf0e8" stroke="#268573" strokeWidth="3"/><text x="145" y="135" fontSize="24" fill="#172d46">{state.voltage} V</text><text x="295" y="137" fontSize="21" fill="#172d46">{state.resistance} Ω</text><text x="206" y="45" fontSize="17" fill="#446d83">I = {fmt(value.milliamp)} mA</text><path d="M260 60 H302 l-9 -7 M302 60 l-9 7" fill="none" stroke="#268573" strokeWidth="3"/></svg><div className="metrics"><div><span>电流 I</span><strong>{fmt(value.milliamp)}<small> mA</small></strong></div><div><span>功率 P</span><strong>{fmt(value.power,3)}<small> W</small></strong></div></div><p className="small-note">理想电阻回路示意；线条是功能连接，不是实体接线指南。</p></div><div className="sliders"><h3>一次改变一个量</h3><label htmlFor="voltage">电压 U <strong>{state.voltage} V</strong></label><input id="voltage" aria-label="电压，伏特" type="range" min="1" max="12" step=".5" value={state.voltage} onChange={e=>update({voltage:Number(e.target.value)})}/><div className="range-ends"><span>1 V</span><span>12 V</span></div><label htmlFor="resistance">电阻 R <strong>{state.resistance} Ω</strong></label><input id="resistance" aria-label="电阻，欧姆" type="range" min="100" max="1000" step="50" value={state.resistance} onChange={e=>update({resistance:Number(e.target.value)})}/><div className="range-ends"><span>100 Ω</span><span>1000 Ω</span></div><div className="control-row"><button onClick={()=>{update({voltage:6,resistance:300});record('老师设置实验条件：6 V / 300 Ω。');}}>老师示范：6 V / 300 Ω</button><button className="primary" onClick={recordExperiment}>记录这一组</button></div><p>当前：{state.voltage} ÷ {state.resistance} × 1000 = <strong>{fmt(value.milliamp)} mA</strong></p></div></div><div className="chart-grid"><div className="chart-card"><h3>固定当前电阻时的 I–U 关系</h3><svg viewBox="0 0 550 260" role="img" aria-label={'电阻 '+state.resistance+' 欧姆时，电流随电压线性增长；横轴0到12伏，纵轴0到130毫安'}><path d="M55 35 V220 H525" fill="none" stroke="#9caebb" strokeWidth="2"/>{[0,30,60,90,120].map(i=><g key={i}><line x1="55" x2="515" y1={drawY(i)} y2={drawY(i)} stroke="#e1e9ed"/><text x="15" y={drawY(i)+4} fontSize="13" fill="#597082">{i}</text></g>)}{[0,3,6,9,12].map(u=><text key={u} x={drawX(u)-7} y="243" fontSize="13" fill="#597082">{u}</text>)}<path d={'M55 220 L515 '+drawY(12000/state.resistance)} fill="none" stroke="#268573" strokeWidth="3"/><circle cx={drawX(state.voltage)} cy={drawY(value.milliamp)} r="7" fill="#dc971b" stroke="#fff" strokeWidth="2"/><text x="63" y="24" fontSize="14" fill="#597082">I / mA</text><text x="488" y="256" fontSize="14" fill="#597082">U / V</text></svg><p className="small-note">绿线是公式结果，橙点是当前参数；不是物理传感器实测数据。</p></div><div className="record-card"><h3>实验记录 <small>{state.records.length}/20</small></h3>{state.records.length?<div className="case-table"><table><thead><tr><th>U / V</th><th>R / Ω</th><th>I / mA</th><th>P / W</th></tr></thead><tbody>{state.records.map((r,i)=><tr key={i}><td>{r.voltage}</td><td>{r.resistance}</td><td>{fmt(r.milliamp)}</td><td>{fmt(r.power,3)}</td></tr>)}</tbody></table></div>:<p>先记录 6 V / 300 Ω，再把电压改成 12 V，比较两组结果。</p>}<button disabled={!state.records.length} onClick={()=>{update({records:[]});setNotice('已清空本案例实验记录。');}}>清空实验记录</button></div></div></section>}
        {state.scene==='discussion'&&<section><div className="discussion-intro"><h2>同一问题，三个角色怎样接力？</h2><p>以下为预设对话，实验数字取自你开始该讨论时的参数。当前讨论条件：{discussionContext.voltage} V / {discussionContext.resistance} Ω。</p><div className="control-row" role="group" aria-label="选择讨论问题">{[['resistance','电阻翻倍会怎样？'],['voltage','电压翻倍，功率呢？'],['unit','为什么 0.02 变成 20？']].map(([id,label])=><button key={id} aria-pressed={question===id} onClick={()=>{setQuestion(id);setDiscussionStep(0);setDiscussionContext({voltage:state.voltage,resistance:state.resistance});record('载入预设讨论与当前实验条件。');}}>{label}</button>)}</div></div><div className="conversation">{currentDialog.slice(0,discussionStep+1).map(([name,text],i)=><article className={name.includes('同学')?'student-message':''} key={question+i}><span className={'avatar '+(name.includes('老师')?'teacher':name.includes('助教')?'assistant':'student')}>{name.slice(0,1)}</span><div><strong>{name}</strong><p>{text}</p></div></article>)}</div><div className="control-row"><button className="primary" disabled={discussionStep===3} onClick={()=>{setDiscussionStep(x=>x+1);record('脚本调度下一位角色发言。');}}>下一位发言 →</button><button onClick={()=>{setDiscussionStep(0);setDiscussionContext({voltage:state.voltage,resistance:state.resistance});}}>用当前实验数据重开讨论</button><button onClick={()=>go('lab')}>回实验里验证</button></div><p className="small-note">这里的按钮选择预设话题，不接受自由提问，也没有运行 LangGraph 导演模型。</p></section>}
        {state.scene==='quiz'&&<section><div className="section-intro"><h2>三道题，检查公式、规律和单位。</h2><p>客观答案由本地规则计算，修改答案后需要重新提交。成绩只代表这三道题，不是掌握度诊断。</p></div><form onSubmit={e=>{e.preventDefault();submitQuiz();}}>{QUIZ.map((q,i)=><fieldset className="quiz-card" key={q.id}><legend><span>{i+1}</span>{q.title}</legend>{q.kind==='number'?<label className="numeric-answer"><input aria-label="电流答案，单位毫安" type="number" step="any" value={state.answers[q.id]??''} onChange={e=>setAnswer(q.id,e.target.value)}/>mA</label>:q.options.map((option,j)=><label className="option" key={option}><input type={q.kind==='single'?'radio':'checkbox'} name={q.id} value={String(j)} checked={(state.answers[q.id]||[]).includes(String(j))} onChange={()=>q.kind==='single'?setAnswer(q.id,[String(j)]):toggleAnswer(q.id,String(j))}/><span>{option}</span></label>)}{state.submittedQuiz&&<div className={'feedback '+(graded.results[i].correct?'correct':'incorrect')}><strong>{graded.results[i].correct?'回答正确':'需要再想一想'}</strong><p>{q.explanation}</p></div>}</fieldset>)}<div className="control-row"><button type="submit" className="primary">提交并查看反馈</button><button type="button" onClick={()=>{update({answers:{},submittedQuiz:false});setQuizNotice('已清空本次作答。');}}>重新作答</button>{state.submittedQuiz&&<strong>{graded.correct} / {graded.total} 题正确</strong>}</div><p role="status">{quizNotice}</p></form></section>}
        {state.scene==='project'&&<section><div className="project-brief"><span className="tiny-title">项目 / 电路参数设计</span><h2>你来当设计师：选一个满足约束的电阻。</h2><p>6 V 理想电源；目标电流 15–25 mA；计算功率不超过 0.25 W。这里校验数学约束，不替代真实器件选型。</p><div className="roles"><span>你 · 设计方案</span><span>助教 · 检查计算规则</span><span>老师 · 预设任务说明</span></div></div><div className="project-grid"><form onSubmit={e=>{e.preventDefault();if(!state.projectNote.trim()){setNotice('请写一句选择理由，再提交方案。');return;}update({projectSubmitted:true});setNotice(project.pass?'方案已提交：数值约束满足。设计说明已保存，未作 AI 评分。':'方案已提交：有数值约束未满足，请根据反馈修改。');record('项目提交：保存方案，检查电流和功率。');}}><label htmlFor="project-r">候选电阻</label><select id="project-r" value={state.projectResistance} onChange={e=>update({projectResistance:Number(e.target.value),projectSubmitted:false})}>{[100,150,220,330,470,680].map(r=><option key={r} value={r}>{r} Ω</option>)}</select><label htmlFor="project-note">选择理由</label><textarea id="project-note" rows={4} maxLength={1000} value={state.projectNote} placeholder="例如：我先算出满足电流范围的阻值区间，再检查候选阻值的功率。" onChange={e=>update({projectNote:e.target.value,projectSubmitted:false})}/><button className="primary" type="submit">提交设计方案</button></form><div className="project-check"><h3>计算校验 · 实时</h3><div><span>电流</span><strong>{fmt(project.milliamp)} mA</strong><small className={project.currentPass?'pass':'fail'}>{project.currentPass?'在 15–25 mA 内':'超出目标范围'}</small></div><div><span>功率</span><strong>{fmt(project.power,3)} W</strong><small className={project.powerPass?'pass':'fail'}>{project.powerPass?'不超过 0.25 W':'超过上限'}</small></div><p>计算：I = 6 / {state.projectResistance}；P = 36 / {state.projectResistance}。</p><details><summary>查看预设解题提示</summary><p>电流目标对应 R 介于 240 Ω 和 400 Ω。候选中 330 Ω 满足这个区间，再检查 P = 36 / 330 ≈ 0.109 W。</p></details>{state.projectSubmitted&&<p className="submission-status">已提交；数值约束{project.pass?'满足':'未满足'}。文字理由只保存，不自动判断优劣。</p>}</div></div></section>}
        {state.scene==='edit'&&<section><div className="section-intro"><h2>改动课程内容，观察真正的渲染变化。</h2><p>这里直接修改课程数据，没有让模型替你改写。修改后回到课件页，讲解字幕也会更新。</p></div><div className="edit-grid"><div><label htmlFor="custom-title">第一页标题</label><input id="custom-title" maxLength={20} value={state.customTitle} onChange={e=>update({customTitle:e.target.value})}/><label htmlFor="custom-narration">第一页第一句讲解</label><textarea id="custom-narration" rows={4} maxLength={300} value={state.customNarration} onChange={e=>update({customNarration:e.target.value})}/><div className="control-row"><button onClick={()=>{update({customTitle:INITIAL.customTitle,customNarration:INITIAL.customNarration});record('恢复初始课件标题与讲解。');}}>恢复原稿</button><button className="primary" onClick={()=>{update({slideIndex:0,line:0});go('lecture');}}>回课堂查看</button></div></div><div className="slide-frame edit-preview"><RenderBoundary><SlideCanvas slide={slides[0]}/></RenderBoundary></div></div><div className="export-panel"><h3>带走这次学习与课件</h3><div className="control-row"><button onClick={()=>{download('ohm-learning-record.md',lessonReport(state));record('下载包含实验、作答与项目方案的 Markdown 记录。');}}>下载学习记录 .md</button><button onClick={()=>{download('ohm-openmaic-slides.json',JSON.stringify(slides,null,2),'application/json');record('导出官方 Slide 结构的三页课件数据。');}}>下载课件数据 .json</button><button onClick={()=>{stopVoice();setPlaying(false);window.print();}}>打印本页 / 保存 PDF</button></div><p>JSON 是三页 Slide 数组，供基于 SDK 的开发使用，不是可直接导入完整 OpenMAIC 的课堂 ZIP。PPTX、音视频生成和 MP4 导出仅在上游完整应用具备配置时可用，本页没有实现这些服务。</p><a href="index.html#showcase">继续看上游官方效果素材 →</a></div></section>}
        {notice&&<p className="case-notice" role="status">{notice}</p>}
        <div className="scene-bottom"><button disabled={index===0} onClick={()=>go(SCENES[index-1][0])}>← 上一环节</button><span>{index+1} / {SCENES.length} · 可自由切换，不按浏览次数判定掌握</span><button className="primary" disabled={index===SCENES.length-1} onClick={()=>go(SCENES[index+1][0])}>下一环节 →</button></div>
        <details className="implementation-note"><summary>这个页面哪些是真实能力，哪些是示范？</summary><p>{contextText[state.scene]}</p><p><a href="docs/case-study.html">完整能力映射与验证边界</a> · <a href="case-dependencies-LICENSE.txt">组件许可</a></p><h3>本次操作记录</h3><ol>{events.map((e,i)=><li key={i}>{e}</li>)}</ol></details>
      </main>
    </div>
  </div>;
}
createRoot(document.getElementById('case-root')!).render(<App/>);
