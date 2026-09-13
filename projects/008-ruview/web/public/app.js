const $=id=>document.getElementById(id);
let record=null,frame=0,playing=false,timer=null,ready=false,current='rest',request=0;
const notes={rest:'安静对照：已知呼吸与心跳频率叠加少量噪声，交给原版预处理与周期提取算法。',fast:'节律对照：呼吸与心跳输入同时加快。输出与真值的差异原样保留。',motion:'干扰对照：加入 0.7 Hz 与 1.7 Hz 运动分量。观察错误周期与质量分数之间的关系。',single:'信息量对照：只提供一个子载波。原版心率算法会对不足四个子载波的输入降低质量分数。',empty:'零输入对照：固定幅度、零噪声、无周期扰动。没有有效估计应显示“—”，不能当作人体存在检测。',custom:'自定义实验：输入仍是合成信号；数值由本机 RuView 原版模块重新计算。'};
const statuses={Valid:'算法状态：有效',Degraded:'算法状态：降级',Unreliable:'算法状态：不可靠',Unavailable:'算法状态：不可用'};
function notice(s){$('notice').textContent=s;clearTimeout(window.noticeTimer);window.noticeTimer=setTimeout(()=>$('notice').textContent='',6000)}
function syncControls(){for(const k of ['br','hr','noise','motion']){$(`${k}-out`).value=k==='br'||k==='hr'?`${$(k).value} 次/分`:Number($(k).value).toFixed(2)}}
function stop(){playing=false;clearInterval(timer);$('play').textContent='▶ 回放';$('play').setAttribute('aria-label','从当前时间回放实验')}
function updateReading(id,value,target){
  const valid=value&&Number.isFinite(value.bpm)&&value.status!=='Unavailable';
  $(id+'-value').textContent=valid?value.bpm.toFixed(1):'—';
  $(id+'-target').textContent=target==null?'无周期信号':target.toFixed(0);
  $(id+'-error').textContent=valid&&target!=null?`误差 ${Math.abs(value.bpm-target).toFixed(1)}`:'无可比结果';
  $(id+'-status').textContent=value?(statuses[value.status]||value.status):'数据不足 / 未检出周期';
  $(id+'-confidence').textContent=valid?`质量 ${(value.confidence*100).toFixed(0)}%`:'—';
  $(id+'-meter').style.width=valid?`${Math.max(0,Math.min(1,value.confidence))*100}%`:'0%';
}
function canvas(id){const c=$(id),r=c.getBoundingClientRect(),d=window.devicePixelRatio||1;c.width=Math.max(1,r.width*d);c.height=r.height*d;const ctx=c.getContext('2d');ctx.scale(d,d);return [ctx,r.width,r.height]}
function charts(){if(!record||$('lab').hidden)return;let [c,w,h]=canvas('wave');const s=record.series;let max=Math.max(1,...s.map(x=>Math.max(Math.abs(x.input),Math.abs(x.residual))));const pad=12,end=w-8; c.strokeStyle='#2b4043';c.lineWidth=.7;for(let k=0;k<5;k++){let y=10+(h-25)*k/4;c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke()}for(const [key,color] of [['input','#d7ee99'],['residual','#73bcce']]){c.strokeStyle=color;c.lineWidth=1.3;c.beginPath();s.forEach((v,i)=>{let x=pad+(end-pad)*i/(s.length-1),y=(h-15)/2-v[key]/max*(h-30)/2;i?c.lineTo(x,y):c.moveTo(x,y)});c.stroke()}c.strokeStyle='#fff9';const x=pad+(end-pad)*frame/(s.length-1);c.beginPath();c.moveTo(x,0);c.lineTo(x,h-16);c.stroke();c.fillStyle='#9bb0b0';c.font='9px monospace';c.fillText('0s',0,h-1);c.fillText('15s',w/3,h-1);c.fillText('30s',w*2/3,h-1);c.fillText('45s',w-23,h-1);
  [c,w,h]=canvas('heatmap');const heat=record.heatmap,rows=heat[0]?.length||1;const scale=Math.max(.01,...heat.flat().map(Math.abs));heat.forEach((col,i)=>col.forEach((v,j)=>{const t=Math.max(-1,Math.min(1,v/scale));c.fillStyle=t>=0?`rgba(215,238,153,${.1+Math.abs(t)*.8})`:`rgba(83,169,193,${.1+Math.abs(t)*.8})`;c.fillRect(i*w/heat.length,j*h/rows,w/heat.length+1,h/rows-.5)}));c.fillStyle='#ffffff90';c.fillRect(frame*w/heat.length,0,1,h);
}
function showFrame(){if(!record)return;const row=record.series[frame];updateReading('br',row.breathing,record.input.occupied?record.input.breathing:null);updateReading('hr',row.heart,record.input.occupied?record.input.heart:null);$('time').textContent=`${row.t.toFixed(1)} s`;$('timeline').value=frame;charts()}
function setRecord(data,name,mode){if(data.evidence!=='synthetic-input-real-upstream-algorithm'||!data.series?.length)throw new Error('实验记录格式无效');stop();record=data;current=name;frame=data.series.length-1;
  $('timeline').max=frame;$('compute-time').textContent=`${Math.round(data.elapsed_ms)} ms`;$('channels-value').textContent=data.input.channels;$('scenario-note').textContent=notes[name];$('person').style.opacity=data.input.occupied?'1':'.12';$('pulse-ring').style.opacity=data.input.occupied?'.2':'0';
  for(const [key,prop] of [['br','breathing'],['hr','heart'],['noise','noise'],['motion','motion']])$(key).value=data.input[prop];syncControls();document.querySelectorAll('[data-preset]').forEach(b=>{b.classList.toggle('selected',b.dataset.preset===name);b.setAttribute('aria-pressed',b.dataset.preset===name)});
  $('engine-status').textContent=mode==='computed'?'本机原版算法 · 已重新计算':'原版计算记录 · 可回放';showFrame();
}
async function preset(name){const id=++request;stop();$('export').disabled=true;try{let r=await fetch(`data/${name}.json`);if(!r.ok)throw new Error('无法载入实验记录');const data=await r.json();if(id===request)setRecord(data,name,'recorded')}catch(e){notice(e.message)}finally{if(id===request)$('export').disabled=false}}
document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>preset(b.dataset.preset)));
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{stop();document.querySelectorAll('.tab-panel').forEach(p=>p.hidden=p.id!==b.dataset.tab);document.querySelectorAll('[data-tab]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b)});charts()}));
$('timeline').addEventListener('input',()=>{stop();frame=+$('timeline').value;showFrame()});
$('play').addEventListener('click',()=>{if(!record)return;if(playing)return stop();if(frame>=record.series.length-1)frame=0;playing=true;$('play').textContent='Ⅱ 暂停';$('play').setAttribute('aria-label','暂停回放');showFrame();timer=setInterval(()=>{if(frame>=record.series.length-1){stop();return}frame++;showFrame()},100)});
for(const k of ['br','hr','noise','motion'])$(k).addEventListener('input',syncControls);
$('parameters').addEventListener('submit',async e=>{e.preventDefault();if(!ready)return;const id=++request;$('run').disabled=true;$('run').textContent='计算中…';stop();const q=new URLSearchParams(Object.fromEntries(['br','hr','noise','motion'].map(k=>[k,$(k).value])));q.set('channels',String(record?.input.channels||56));q.set('occupied','1');try{const r=await fetch(`/api/run?${q}`,{signal:AbortSignal.timeout(30000)});const d=await r.json();if(!r.ok)throw new Error(d.error||'计算失败');if(id===request){setRecord(d,'custom','computed');notice('已完成原版算法计算；结果没有按输入真值修正。')}}catch(e){notice(e.message)}finally{$('run').disabled=!ready;$('run').textContent='重新计算 ↗'}});
$('export').addEventListener('click',()=>{if(!record)return;const url=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`ruview-${current}-synthetic.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('已导出输入参数、原版输出和来源信息。')});
window.addEventListener('resize',charts);
await preset('rest');
try{const r=await fetch('/api/health',{signal:AbortSignal.timeout(1800)});const d=await r.json();ready=d.ready===true}catch{ready=false}
$('run').disabled=!ready;for(const k of ['br','hr','noise','motion'])$(k).disabled=!ready;
if(ready)$('controls-note').textContent='本机原版计算已就绪。每次处理 45 秒合成输入，参数变化后点击重新计算。';
