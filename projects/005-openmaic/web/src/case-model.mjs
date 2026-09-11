export const LESSON_VERSION = 'ohm-classroom-v1';
export const SCENES = [
  ['brief','课程准备','资料与课程方案'],
  ['lecture','课件讲解','官方组件 · 实际渲染'],
  ['board','白板推导','逐步计算与重点提示'],
  ['lab','参数实验','调节电压与电阻'],
  ['discussion','角色讨论','预设对话 · 上下文联动'],
  ['quiz','课堂测验','规则评分与错因反馈'],
  ['project','项目任务','设计、校验与提交'],
  ['edit','改课与导出','修改课件 · 下载记录']
];
export function circuit(voltage, resistance) {
  const u = Number(voltage), r = Number(resistance);
  if (!Number.isFinite(u) || !Number.isFinite(r) || u < 0 || r <= 0) throw new RangeError('电压须为非负数，电阻须大于零');
  return {voltage:u, resistance:r, current:u/r, milliamp:u/r*1000, power:u*u/r};
}
export function assessProject(resistance) {
  const result = circuit(6,resistance);
  return {...result, currentPass:result.milliamp>=15 && result.milliamp<=25, powerPass:result.power<=.25, pass:result.milliamp>=15 && result.milliamp<=25 && result.power<=.25};
}
export const QUIZ = [
  {id:'q1',kind:'single',title:'电压保持 6 V，电阻从 300 Ω 变成 600 Ω，电流怎样变化？',options:['从 20 mA 变成 10 mA','从 20 mA 变成 40 mA','保持 20 mA'],answer:['0'],explanation:'I = U / R。电压不变时，电阻翻倍，电流减半。6 ÷ 600 = 0.01 A = 10 mA。'},
  {id:'q2',kind:'multiple',title:'理想欧姆电阻中，下面哪些说法成立？',options:['电阻不变，电压翻倍，电流翻倍','电压不变，电阻翻倍，功率翻倍','电压不变，电阻翻倍，电流减半'],answer:['0','2'],explanation:'① 和 ③ 正确。固定电压时 P = U² / R，电阻翻倍，功率也减半。'},
  {id:'q3',kind:'number',title:'电压 9 V、电阻 450 Ω，电流是多少 mA？',answer:20,explanation:'9 ÷ 450 = 0.02 A。换算为毫安需乘 1000，所以是 20 mA。'}
];
export function gradeQuiz(answers) {
  const results = QUIZ.map(q=>{
    const value=answers[q.id];
    const answered=q.kind==='number' ? value!==undefined && String(value).trim()!=='' && Number.isFinite(Number(value)) : Array.isArray(value) && value.length>0;
    const correct=answered && (q.kind==='number' ? Math.abs(Number(value)-q.answer)<.01 : [...new Set(value)].sort().join(',') === q.answer.join(','));
    return {id:q.id,answered,correct,explanation:q.explanation};
  });
  return {results,correct:results.filter(r=>r.correct).length,total:results.length,complete:results.every(r=>r.answered)};
}
export const INITIAL = {version:LESSON_VERSION,scene:'brief',slideIndex:0,line:0,boardStep:0,voltage:6,resistance:300,records:[],answers:{},submittedQuiz:false,projectResistance:330,projectNote:'',projectSubmitted:false,customTitle:'电压、电阻与电流',customNarration:'保持电阻不变，提高电压，电流会按比例增加。',completed:[]};
export function restore(raw) {
  if (!raw || raw.version!==LESSON_VERSION) return {...INITIAL};
  const next={...INITIAL};
  const clamp=(v,a,b,f)=>Number.isFinite(v)?Math.max(a,Math.min(b,v)):f;
  if(SCENES.some(([id])=>id===raw.scene)) next.scene=raw.scene;
  next.slideIndex=Math.round(clamp(raw.slideIndex,0,2,0));
  next.line=Math.round(clamp(raw.line,0,2,0));
  next.boardStep=Math.round(clamp(raw.boardStep,0,3,0));
  next.voltage=clamp(raw.voltage,1,12,6);
  next.resistance=clamp(raw.resistance,100,1000,300);
  next.records=Array.isArray(raw.records)?raw.records.filter(x=>x&&Number.isFinite(x.voltage)&&x.voltage>=1&&x.voltage<=12&&Number.isFinite(x.resistance)&&x.resistance>=100&&x.resistance<=1000).slice(-20).map(x=>circuit(x.voltage,x.resistance)):[];
  const a=raw.answers;
  if(a&&typeof a==='object') {
    for(const id of ['q1','q2']) if(Array.isArray(a[id])) next.answers={...next.answers,[id]:a[id].filter(x=>['0','1','2'].includes(x)).slice(0,3)};
    if(typeof a.q3==='string' || typeof a.q3==='number') next.answers={...next.answers,q3:String(a.q3).slice(0,20)};
  }
  next.submittedQuiz=raw.submittedQuiz===true && gradeQuiz(next.answers).complete;
  const choices=[100,150,220,330,470,680];
  if(choices.includes(raw.projectResistance)) next.projectResistance=raw.projectResistance;
  if(typeof raw.projectNote==='string') next.projectNote=raw.projectNote.slice(0,1000);
  next.projectSubmitted=raw.projectSubmitted===true && next.projectNote.trim()!=='';
  if(typeof raw.customTitle==='string') next.customTitle=raw.customTitle.slice(0,20);
  if(typeof raw.customNarration==='string') next.customNarration=raw.customNarration.slice(0,300);
  next.completed=Array.isArray(raw.completed)?[...new Set(raw.completed.filter(x=>SCENES.some(([id])=>x===id)))]:[];
  return next;
}
const escapeHtml = text => String(text).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function text(id,content,left,top,width,height,size,color='#153355') {
  return {id,type:'text',left,top,width,height,rotate:0,content:'<p style="margin:0;font-size:'+size+'px;line-height:1.3;color:'+color+'">'+escapeHtml(content)+'</p>',defaultFontName:'Microsoft YaHei',defaultColor:color};
}
export function makeSlides(title=INITIAL.customTitle) {
  const common={viewportSize:1000,viewportRatio:.5625,theme:{backgroundColor:'#f8fbff',themeColors:['#215dba','#f0ad39'],fontColor:'#153355',fontName:'Microsoft YaHei'},background:{type:'solid',color:'#f8fbff'}};
  return [
    {...common,id:'ohm-concepts',elements:[
      text('eyebrow','01 / 一条关系，三个变量',55,36,860,28,20,'#2766ba'),
      text('title',String(title).slice(0,20),55,94,890,62,40),
      text('formula','I = U / R',55,189,850,106,78),
      text('variables','U：电压 V     R：电阻 Ω     I：电流 A',60,340,870,48,28),
      text('condition','适用前提：电阻近似恒定，忽略温度与电源内阻影响。',60,462,880,46,23,'#5f7088')
    ]},
    {...common,id:'ohm-example',elements:[
      text('eyebrow','02 / 从公式到数值',55,36,850,28,20,'#2766ba'),
      text('title','6 V 与 300 Ω，会得到多少电流？',55,94,900,70,38),
      text('formula','6 ÷ 300 = 0.02 A',55,207,890,93,59),
      text('conversion','0.02 A × 1000 = 20 mA',55,350,890,62,36,'#2766ba'),
      text('condition','注意单位：安培与毫安相差 1000 倍。',55,464,880,44,23,'#5f7088')
    ]},
    {...common,id:'ohm-power',elements:[
      text('eyebrow','03 / 不只看电流，也要看功率',55,36,890,28,20,'#2766ba'),
      text('title','电阻把电能转成热',55,94,890,65,40),
      text('formula','P = U × I = U² / R',55,205,910,90,55),
      text('conversion','6 × 0.02 = 0.12 W',55,350,890,62,39,'#2766ba'),
      text('condition','后面的任务会同时检查电流目标和功率上限。',55,464,880,45,23,'#5f7088')
    ]}
  ];
}
export function lessonReport(state) {
  const q=gradeQuiz(state.answers), p=assessProject(state.projectResistance);
  return [
    '# 欧姆定律 · 课堂记录','',
    '本记录来自独立教学案例，课件使用 OpenMAIC renderer 0.1.6；对话预设、评分由规则计算，未调用模型。','',
    '## 实验记录',...state.records.map((r,i)=>String(i+1)+'. '+r.voltage+' V / '+r.resistance+' Ω → '+r.milliamp.toFixed(2)+' mA，'+r.power.toFixed(3)+' W'),
    state.records.length?'':'尚未记录实验。',
    '','## 测验',state.submittedQuiz?q.correct+'/'+q.total+' 题正确':'尚未提交',
    ...QUIZ.flatMap((item,index)=>{
      const value=state.answers[item.id];
      const answer=item.kind==='number'?(value===undefined||String(value).trim()===''?'未作答':String(value)+' mA'):Array.isArray(value)&&value.length?value.map(x=>item.options[Number(x)]).join('；'):'未作答';
      return ['',String(index+1)+'. '+item.title,'作答：'+answer,...(state.submittedQuiz?['结果：'+(q.results[index].correct?'正确':'需修改'),'解析：'+item.explanation]:[])];
    }),
    '','## 项目任务','选择电阻：'+state.projectResistance+' Ω；电流 '+p.milliamp.toFixed(2)+' mA；功率 '+p.power.toFixed(3)+' W。',
    '提交状态：'+(state.projectSubmitted?'已提交':'未提交'),'数值约束：'+(p.pass?'满足':'不满足'),'设计说明：'+(state.projectNote||'未填写'),
    '','## 课件修改','标题：'+state.customTitle,'讲解：'+state.customNarration,'',
    '公式依据：https://openstax.org/books/physics/pages/19-key-equations'
  ].join('\n');
}
