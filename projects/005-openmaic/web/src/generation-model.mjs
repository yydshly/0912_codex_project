import {makeSlides} from './case-model.mjs';

export const SOURCE='https://github.com/THU-MAIC/OpenMAIC/blob/d5be3933176247feebf4007f6e31e20b93871609/';
export const MODULES=[
  {id:'slide',title:'课件',noun:'页面数据 + 教学动作',effect:'官方 SlideCanvas 渲染',prompt:'根据材料编排一页课件，输出元素类型、坐标、尺寸和内容。处理最终元素 ID 后，再生成讲解与高亮动作。',principle:'模型决定页面上有什么、放在哪里；固定组件按类型绘制文字、图片与公式。播放器根据元素 ID 执行高亮，讲稿可另交 TTS。',reuse:'保留页面 DSL、归一化与校验、SlideCanvas 和动作执行器。替换材料、生成提示词与模型调用。讲稿与页面分别保存。',contract:'输入材料 → Slide JSON → 最终元素 ID → Actions → 渲染与播放',boundary:'本页直接使用官方 renderer；JSON 由本地模板组装。字幕演示动作顺序，未接上游模型或 TTS。',sources:[['课件生成模板','packages/@openmaic/generation/templates/slide-content/system.md'],['官方渲染器','packages/@openmaic/renderer/src/SlideCanvas.tsx']]},
  {id:'board',title:'白板',noun:'逐条元素操作',effect:'简化白板执行器',prompt:'根据问题输出打开白板、添加文字或公式、坐标与元素 ID。已有白板摘要应进入下一轮上下文，支持继续编辑。',principle:'动作引擎将指令变成元素状态；组件把状态画出来。逐步出现来自顺序执行，不是模型逐帧作画。上游公式使用 KaTeX 排版。',reuse:'保留白板动作协议、元素 ID、白板状态与渲染器；把当前白板摘要送给模型。需要明确坐标范围和清空、编辑规则。',contract:'问题 + 已有白板 → wb_* 指令 → 元素状态 → 画布',boundary:'本页用 SVG 文字和线条演示指令执行，不是上游完整白板；不模拟手写轨迹或数学证明。',sources:[['白板指令规范','lib/prompts/snippets/whiteboard-reference.md'],['白板组件','components/whiteboard/whiteboard-canvas.tsx']]},
  {id:'experiment',title:'实验',noun:'完整 HTML / CSS / JS',effect:'真实 iframe 运行代码',prompt:'制作欧姆定律实验网页，提供电压和电阻滑杆，按 I=U/R、P=U²/R 更新结果；监听 SET_WIDGET_STATE 消息改变控件。',principle:'生成阶段让模型编程；运行阶段由浏览器执行。滑杆触发事件后，本地代码计算并重绘。老师通过消息协议操作控件。',reuse:'保留网页生成规范、HTML 后处理、隔离容器和双向消息约定。必须独立验证学科公式、单位和边界，不能只检查代码能否运行。',contract:'实验要求 → HTML/CSS/JS → iframe → input 事件 → 计算与重绘',boundary:'本页运行的是可编辑的真实网页代码，由本地模板提供。容器只允许内部脚本，阻止外部网络；生成代码可运行不等于科学结论正确。',sources:[['实验生成模板','packages/@openmaic/generation/templates/simulation-content/system.md'],['iframe 与消息','components/scene-renderers/InteractiveIframeHost.tsx']]},
  {id:'dialogue',title:'对话',noun:'角色决策 + 文字与动作',effect:'导演轮次模拟',prompt:'根据场景、问题、角色人设与历史摘要，选择下一位发言者；该角色输出回答及允许的教学动作，之后交回用户或继续一轮。',principle:'默认路径每次请求最多一轮导演与角色，前端续接多轮。角色输出的文字和动作经流式解析、传输和动作引擎呈现。',reuse:'保留角色配置、导演、上下文构造、输出解析和动作权限；替换模型适配。播放位置与实时对话状态需要协调保存。',contract:'问题 + 课堂状态 → director → role → text/actions → 下一轮',boundary:'本页角色发言和导演选择为确定性脚本；可逐轮查看实际状态变化，不是真实多智能体推理，也未实现上游 SSE。',sources:[['导演状态图','lib/orchestration/director-graph.ts'],['角色上下文','lib/orchestration/prompt-builder.ts']]},
  {id:'quiz',title:'测验',noun:'题目结构 + 评分结果',effect:'真实答题与规则评分',prompt:'根据知识点生成题干、选项、答案、分值和解析。选择题使用答案键；上游简答题在提交时另外调用模型生成分数和评语。',principle:'已有组件将题目数据变成表单。选择题用规则匹配；上游简答题调用评分接口。题目生成和答卷评价是两个阶段。',reuse:'保留题目协议、答题组件、提交记录和评分接口；选择题校验答案键，简答题补评分依据与服务失败状态。',contract:'知识点 → 题目 JSON → 答题表单 → 规则 / 模型评分 → 作答记录',boundary:'本页选择题按答案键评分，数值简答按容差计算；没有调用语义评分模型。上游简答失败的半分回退不适合直接用于正式考核。',sources:[['测验界面','components/scene-renderers/quiz-view.tsx'],['选择题评分','lib/quiz/grading.ts'],['上游简答评分','app/api/quiz-grade/route.ts']]},
  {id:'task',title:'任务',noun:'项目结构 + 提交与状态',effect:'简化 PBL 提交闭环',prompt:'规划限流电阻设计项目，给出目标、导师、里程碑、微任务和交付要求。导师依据当前任务与提交提供辅导，评价阶段另读最新成果。',principle:'模型生成任务结构，固定界面呈现阶段与提交入口。运行系统保存提交与评价，重建进度；聊天文本本身不能推进任务状态。',reuse:'保留项目协议、规划校验、导师工具、提交/评价记录和运行状态。接入业务时映射交付物、身份与完成条件。',contract:'项目目标 → 里程碑 / 任务 → 学生提交 → 评价记录 → 进度状态',boundary:'本页只有两步任务和数值约束评价，用于展示提交闭环；没有上游完整 PBL 规划器、导师或模型评价。',sources:[['项目规划器','packages/@openmaic/generation/src/pbl/planner-single-call.ts'],['导师工具','lib/pbl/v2/agents/instructor.ts'],['提交逻辑','lib/pbl/v2/operations/runtime/submission.ts']]}
];
export const DEFAULTS={title:'欧姆定律：从公式到计算',voltage:6,resistance:300,question:'resistance'};
const htmlEscape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function parameters(p){
  const voltage=Number(p.voltage),resistance=Number(p.resistance);
  if(!Number.isFinite(voltage)||voltage<1||voltage>12||!Number.isFinite(resistance)||resistance<100||resistance>1500)throw Error('电压需在 1–12 V，电阻需在 100–1500 Ω。');
  return {...p,title:String(p.title).slice(0,28),voltage,resistance,current:voltage/resistance*1000,power:voltage*voltage/resistance};
}
export const SANDBOX_POLICY='<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; connect-src \'none\'; form-action \'none\';">';
export function experimentHtml(p){
  const a=parameters(p);
  return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>欧姆定律参数实验</title>
<style>body{font:16px/1.6 system-ui,sans-serif;color:#173452;margin:24px}h2{font-size:22px}label{display:block;margin:18px 0}input{display:block;width:100%;accent-color:#2464dd}output{font-weight:700}#meter{font-size:42px;color:#2464dd}#bar{height:18px;background:#2464dd;border-radius:6px}.track{background:#e8eff8;border-radius:6px}small{color:#526b81}</style>
<h2>${htmlEscape(a.title)}</h2><p>I = U / R　·　P = U² / R</p>
<label>电压 <output id="uv"></output> V<input id="voltage" type="range" min="1" max="12" step="1" value="${a.voltage}"></label>
<label>电阻 <output id="rv"></output> Ω<input id="resistance" type="range" min="100" max="1500" step="10" value="${a.resistance}"></label>
<div id="meter" aria-live="polite"></div><div class="track"><div id="bar"></div></div><p id="power"></p><small>条形宽度相对于 120 mA；拖动触发本地计算。</small>
<script>
const u=document.getElementById('voltage'),r=document.getElementById('resistance');
function update(){
 const U=Number(u.value),R=Number(r.value),I=U/R,P=U*I;
 document.getElementById('uv').textContent=U;document.getElementById('rv').textContent=R;
 document.getElementById('meter').textContent=(I*1000).toFixed(2)+' mA';
 document.getElementById('bar').style.width=Math.min(100,I*1000/120*100)+'%';
 document.getElementById('power').textContent='功率 '+P.toFixed(3)+' W';
 parent.postMessage({type:'LAB_STATE',voltage:U,resistance:R,current:I*1000},'*');
}
[u,r].forEach(x=>x.addEventListener('input',update));
addEventListener('message',e=>{if(e.source!==parent||e.data?.type!=='SET_WIDGET_STATE')return;const s=e.data.state||{};if(Number.isFinite(s.voltage))u.value=Math.max(1,Math.min(12,s.voltage));if(Number.isFinite(s.resistance))r.value=Math.max(100,Math.min(1500,s.resistance));update();});
update();
</script></html>`;
}
export function createArtifact(mode,raw){
 const a=parameters(raw),i=a.current.toFixed(2),power=a.power.toFixed(3);
 if(mode==='experiment')return experimentHtml(a);
 if(mode==='slide'){
   const slide=makeSlides(a.title)[0];
   slide.elements.find(e=>e.id==='variables').content='<p style="margin:0;font-size:30px;line-height:1.3;color:#153355">'+a.voltage+' V ÷ '+a.resistance+' Ω = '+i+' mA</p>';
   return {slide,actions:[{name:'spotlight',elementId:'formula',text:'先看关系：I = U / R。'},{name:'spotlight',elementId:'variables',text:'代入 '+a.voltage+' V 和 '+a.resistance+' Ω，电流为 '+i+' mA。'},{name:'spotlight',elementId:'condition',text:'这是理想欧姆电阻模型，忽略温度与电源内阻影响。'}]};
 }
 if(mode==='board')return {actions:[{name:'wb_open'},...['I = U / R','I = '+a.voltage+' / '+a.resistance+' = '+(a.current/1000).toFixed(4)+' A','I = '+i+' mA','P = U × I = '+power+' W'].map((text,n)=>({name:'wb_draw_text',params:{elementId:'step-'+n,text,x:35,y:70+n*70}}))]};
 if(mode==='dialogue')return {question:a.question==='units'?'为什么要乘以 1000？':'电阻翻倍，电流会怎样？',turns:[{role:'老师',text:'当前 '+a.voltage+' V / '+a.resistance+' Ω，电流 '+i+' mA。',focus:'formula'},{role:'同学',text:a.question==='units'?'安培和毫安怎样换算？':'电阻翻倍，电流也会翻倍吗？',focus:'question'},{role:'助教',text:a.question==='units'?'1 A = 1000 mA，所以 '+(a.current/1000).toFixed(4)+' A 等于 '+i+' mA。':'电压不变，分母翻倍，电流变成 '+(a.current/2).toFixed(2)+' mA。',focus:'answer'},{role:'老师',text:'把这个判断带回参数实验，保持一个变量不变进行核验。',focus:'experiment'}]};
 if(mode==='quiz')return {question:'电压 '+a.voltage+' V、电阻 '+a.resistance+' Ω，电流是多少？',options:[{value:'a',label:(a.current/2).toFixed(2)+' mA'},{value:'b',label:i+' mA'},{value:'c',label:(a.current*2).toFixed(2)+' mA'}],answer:'b',explanation:'I = U/R，再乘以 1000 换算为 mA。',short:{question:'用同一组数值计算功率（W）。',answer:a.power,tolerance:.001,explanation:'P = U²/R = '+power+' W。'}};
 if(mode==='task')return {title:'限流电阻设计',voltage:a.voltage,goal:'选择电阻，使电流在 15–20 mA 之间，且功率不超过 0.25 W；提交阻值和理由。',limits:{minCurrent:15,maxCurrent:20,maxPower:.25},milestones:['计算候选阻值','提交设计并核验'],mentor:'导师关注计算过程；这里用规则评价数值，不评价论证质量。'};
 throw Error('未知模块');
}
const check=(ok,message)=>{if(!ok)throw Error(message);};
const short=(x,max=1200)=>typeof x==='string'&&x.length<=max;
export function parseArtifact(mode,text){
 check(typeof text==='string'&&text.length<100000,'内容过长，请限制在 100 KB 内。');
 if(mode==='experiment'){check(/<script[\s>]/i.test(text)&&/input/i.test(text),'示例实验需要包含脚本与输入控件。');return text;}
 let a;try{a=JSON.parse(text);}catch{throw Error('JSON 格式不正确。检查逗号、引号和括号，或恢复示例。');}
 check(a&&typeof a==='object','产物必须是对象。');
 if(mode==='slide'){
  check(a.slide&&Array.isArray(a.slide.elements)&&a.slide.elements.length>0,'需要非空 slide.elements。');
  // The lab accepts a text-only subset; the official renderer supports more types.
  check(a.slide.elements.length<=20&&a.slide.elements.every(e=>e&&e.type==='text'&&short(e.id,80)&&short(e.content,5000)&&[e.left,e.top,e.width,e.height].every(Number.isFinite)&&e.width>0&&e.height>0),'本实验台只接受最多 20 个带有效坐标和内容的 text 元素。');
  check(!/(?:https?:|javascript:|data:|url\s*\(|@import|\bon\w+\s*=)/i.test(JSON.stringify(a.slide))&&a.slide.elements.every(e=>!/<(?!\/?(?:p|span|strong|b|em|i|br)\b)/i.test(e.content)),'本页课件仅接受基本文字排版，不接受外部资源、事件或嵌入代码；网页代码请在实验沙盒中运行。');
  check(new Set(a.slide.elements.map(e=>e.id)).size===a.slide.elements.length,'元素 ID 不能重复。');
  check(Array.isArray(a.actions)&&a.actions.length>0&&a.actions.length<=20&&a.actions.every(x=>x&&x.name==='spotlight'&&a.slide.elements.some(e=>e.id===x.elementId)&&short(x.text)),'动作必须引用存在的元素 ID，并包含 text。');
  check(Number.isFinite(a.slide.viewportSize)&&a.slide.viewportSize>0&&a.slide.viewportSize<=2000&&Number.isFinite(a.slide.viewportRatio)&&a.slide.viewportRatio>.2&&a.slide.viewportRatio<2,'画布尺寸或比例超出实验台范围。');
 }
 if(mode==='board')check(Array.isArray(a.actions)&&a.actions.length>0&&a.actions.length<=12&&a.actions.every(x=>x.name==='wb_open'||x.name==='wb_draw_text'&&x.params&&short(x.params.elementId,80)&&short(x.params.text,80)&&Number.isFinite(x.params.x)&&x.params.x>=0&&x.params.x<=400&&Number.isFinite(x.params.y)&&x.params.y>=0&&x.params.y<=390),'白板仅支持 wb_open 和有效范围内的 wb_draw_text 指令。');
 if(mode==='dialogue')check(short(a.question)&&Array.isArray(a.turns)&&a.turns.length>0&&a.turns.length<=12&&a.turns.every(x=>short(x.role,20)&&short(x.text)&&short(x.focus,80)),'需要 question 和最多 12 条包含 role、text、focus 的发言。');
 if(mode==='quiz'){
  check(short(a.question)&&Array.isArray(a.options)&&a.options.length>=2&&a.options.length<=6&&a.options.every(o=>short(o.value,20)&&short(o.label,100)),'题干或选项格式错误。');
  check(new Set(a.options.map(o=>o.value)).size===a.options.length&&a.options.some(o=>o.value===a.answer),'答案必须指向一个唯一选项。');
  check(short(a.explanation)&&a.short&&short(a.short.question)&&short(a.short.explanation)&&Number.isFinite(a.short.answer)&&Number.isFinite(a.short.tolerance)&&a.short.tolerance>=0&&a.short.tolerance<=1,'数值简答的答案或容差格式错误。');
 }
 if(mode==='task')check(short(a.title,80)&&short(a.goal)&&short(a.mentor)&&Number.isFinite(a.voltage)&&a.voltage>=1&&a.voltage<=12&&Array.isArray(a.milestones)&&a.milestones.length===2&&a.milestones.every(x=>short(x,80))&&a.limits&&[a.limits.minCurrent,a.limits.maxCurrent,a.limits.maxPower].every(Number.isFinite)&&a.limits.minCurrent>0&&a.limits.maxCurrent>=a.limits.minCurrent&&a.limits.maxPower>0,'项目需要两个里程碑、有效电压与正数约束。');
 return a;
}
export function gradeArtifact(a,choice,numeric){
 check(a.options.some(x=>x.value===choice)&&String(numeric).trim()!==''&&Number.isFinite(Number(numeric)),'请完成选择题和数值简答。');
 return {choice:choice===a.answer,numeric:Math.abs(Number(numeric)-a.short.answer)<=a.short.tolerance+1e-10};
}
export function assessTask(a,resistance){
 const r=Number(resistance);check(Number.isFinite(r)&&r>=100&&r<=1500,'候选电阻需在 100–1500 Ω。');
 const current=a.voltage/r*1000,power=a.voltage*a.voltage/r;
 return {current,power,pass:current>=a.limits.minCurrent-1e-9&&current<=a.limits.maxCurrent+1e-9&&power<=a.limits.maxPower+1e-9};
}
