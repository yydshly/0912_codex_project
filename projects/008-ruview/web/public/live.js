const $ = (id) => document.getElementById(id);
let mode = 'live', live = null, replay = null, cursor = 180, playing = false, failed = null, busy = false;
let displayed = null, lastPaint = 0;
const names = {absent:'未检出变化', present_still:'低频变化', active:'活动候选'};
const descriptions = {absent:'信号波动未达到阈值；这不能证明房间无人。',present_still:'信号有变化，运动频段能量较低；尚未确认有人。',active:'信号变化达到活动阈值。需要实际动作对照，才能确认原因。'};
const clock = (seconds) => `${Math.floor(seconds/60).toString().padStart(2,'0')}:${Math.floor(seconds%60).toString().padStart(2,'0')}`;
const wallClock = (stamp) => new Date(stamp*1000).toLocaleTimeString('zh-CN',{hour12:false});
async function api(path, action=false) {
  const response = await fetch(`/api/live/${path}`, {method:action?'POST':'GET',cache:'no-store',headers:action?{'X-RuView-Local':'1'}:{},signal:AbortSignal.timeout(8000)});
  const body = await response.json();
  if(!response.ok) throw Error(body.error || '本机服务未能完成请求。');
  return body;
}
function errorText(message) { $('error').hidden = !message; $('error').textContent = message || ''; }
function currentData() { return mode==='live'?live:replay; }
function currentSlice() {
  const data = currentData();
  if(!data) return {data:null,samples:[],reports:[],elapsed:0};
  const elapsed = mode==='live'?(data.samples.at(-1)?.elapsed_seconds || 0):cursor;
  return {data,samples:data.samples.filter(s=>s.elapsed_seconds<=elapsed),reports:data.reports.filter(r=>r.elapsed_seconds<=elapsed),elapsed};
}
function render() {
  const {data,samples,reports,elapsed} = currentSlice();
  displayed = {data,samples,reports,elapsed};
  const last = samples.at(-1), report = reports.at(-1);
  const running = live && ['starting','collecting'].includes(live.state);
  const stale = mode==='live' && running && last && (Date.now()/1000-last.timestamp)>4;
  const unhealthy = mode==='live' && (failed || data?.state==='error' || stale);
  let flatSince = last?.elapsed_seconds || 0;
  for(let i=samples.length-1;i>=0 && samples[i].rssi_dbm===last?.rssi_dbm;i--) flatSince=samples[i].elapsed_seconds;
  const flatSeconds = last ? elapsed-flatSince : 0;
  const finished = mode==='live' && data && ['completed','stopped'].includes(data.state);
  const showFlat = mode==='live' && running && !unhealthy && flatSeconds>=15;
  $('mode-notice').hidden = !(mode==='replay'||finished||showFlat);
  $('mode-notice').dataset.kind = mode==='replay'?'replay':'warning';
  $('mode-notice-title').textContent = mode==='replay'?'当前是历史回放：现在走动不会改变这段记录':finished?'采集已经结束：当前动作不会继续写入':`网卡读数已连续 ${Math.floor(flatSeconds)} 秒没有变化`;
  $('mode-notice-detail').textContent = mode==='replay'?'要观察此刻的动作，请切回实时采集。历史曲线只反映 18:53 那次读取。':finished?'本轮自动在 3 分钟后结束。开始新一轮后，先积累 15 秒数据再计算。':'程序仍在读取网卡，但重复读到相同的数值。这不代表你没有动，也不足以判断是否有人；可能与接口更新、读数量化或现场布置有关。';
  $('return-live').hidden = !(mode==='replay'||finished);
  $('return-live').textContent = running?'回到实时采集':'开始实时采集';
  $('live-mode').classList.toggle('selected',mode==='live'); $('live-mode').setAttribute('aria-pressed',mode==='live');
  $('replay-mode').classList.toggle('selected',mode==='replay'); $('replay-mode').setAttribute('aria-pressed',mode==='replay');
  $('live-controls').hidden = mode!=='live'; $('replay-controls').hidden = mode!=='replay';
  $('record-badge').textContent = mode==='replay'?'历史实测 · 回放':(running?'实时数据':'本次实测记录');
  $('record-badge').classList.toggle('replay',mode==='replay');
  $('context-label').textContent = mode==='live'?'当前电脑 · WLAN · 真实 RSSI':'2026-09-13 18:53 · 真实采集记录 · 无受控动作';
  $('context-time').textContent = last?`${mode==='live'?'最近读取':'记录时刻'} ${wallClock(last.timestamp)}`:'等待第一笔读数';
  const status = unhealthy?'采集异常 · 已停止更新':mode==='replay'?'历史回放 · 不是当前现场':running?'正在采集真实 WiFi':data?.state==='completed'?'本轮 3 分钟采集已完成':data?.state==='stopped'?'已停止采集':'正在连接本机采集服务…';
  $('connection').textContent = status; $('connection').dataset.state = unhealthy?'error':running&&mode==='live'?'collecting':'';
  errorText(mode==='live'?(failed || data?.error || (stale?'超过 4 秒未收到新读数，当前判定已隐藏。':null)):null);
  $('rssi').textContent = last&&!unhealthy?last.rssi_dbm.toFixed(0):'—';
  $('sample-count').textContent = `${samples.length} 个真实样本`;
  $('signal-range').textContent = samples.length?`范围 ${Math.min(...samples.map(s=>s.rssi_dbm))} 至 ${Math.max(...samples.map(s=>s.rssi_dbm))} dBm`:'等待采集';
  $('chart-empty').hidden = samples.length>0;
  $('chart-empty').textContent = unhealthy?'采集不可用，未生成替代数据':'正在读取网卡…';
  $('verdict').textContent = unhealthy?'数据不可用':report?names[report.upstream_label]:samples.length?'积累分析窗口':'等待数据';
  $('verdict').dataset.label = unhealthy?'error':(report?.upstream_label||'');
  $('verdict-detail').textContent = unhealthy?'最近记录保留在曲线中；恢复有效读数后才能继续判定。':showFlat?'输入一直相同，原版阈值算法只能给出“未检出变化”；不能据此判断你是否走动。':report?descriptions[report.upstream_label]:`还需约 ${Math.max(0,Math.ceil(15-elapsed))} 秒真实读数，才能开始分析。`;
  $('variance').textContent = report&&!unhealthy?report.variance.toFixed(3):'—';
  $('energy').textContent = report&&!unhealthy?report.motion_energy.toFixed(4):'—';
  $('report-time').textContent = report&&!unhealthy?wallClock(report.timestamp):'—';
  $('remaining').textContent = running?`已采集 ${clock(elapsed)} / 03:00`:`${samples.length} 个样本已保留`;
  $('stop').disabled = !running || busy; $('start').disabled = running || busy;
  $('download').disabled = !samples.length;
  $('play').textContent = playing?'Ⅱ 暂停回放':'▶ 播放实测';
  $('seek').value = cursor; $('replay-time').textContent = `${cursor.toFixed(1)} s`;
  $('signal-note').textContent = mode==='live'?'读数没有变化时，曲线会保持平直。每 3 秒更新一次原版算法判定。':'2026-09-13 实采 356 个样本。约 62 秒信号突变，连续 4 次活动候选；用户未配合受控动作。';
  renderEvents(samples,reports,data);
  draw();
}
function renderEvents(samples,reports,data) {
  const events=[];
  if(samples.length) events.push({time:0,text:mode==='live'?'开始读取本机 WLAN 的真实 RSSI。':'打开原始实测记录；历史数据已校验。'});
  for(let i=1;i<samples.length;i++) if(samples[i].rssi_dbm!==samples[i-1].rssi_dbm) events.push({time:samples[i].elapsed_seconds,text:`信号从 ${samples[i-1].rssi_dbm} 变为 ${samples[i].rssi_dbm} dBm。`});
  let previous=null;
  for(const report of reports) {
    if(report.upstream_label!==previous) events.push({time:report.elapsed_seconds,text:`原版判定：${names[report.upstream_label]}。`,active:report.upstream_label==='active'});
    previous=report.upstream_label;
  }
  if(data?.error && mode==='live') events.push({time:samples.at(-1)?.elapsed_seconds||0,text:`采集停止：${data.error}`});
  events.sort((a,b)=>b.time-a.time);
  const fragment=document.createDocumentFragment();
  for(const event of events.slice(0,30)) {
    const li=document.createElement('li'),time=document.createElement('time'),text=document.createElement('span');
    time.textContent=clock(event.time); text.textContent=event.text; li.append(time,text); if(event.active) li.classList.add('active'); fragment.append(li);
  }
  if(!events.length){const li=document.createElement('li');li.textContent='等待采集记录…';fragment.append(li);}
  $('event-list').replaceChildren(fragment);
}
function draw() {
  const canvas=$('signal-chart'),rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
  if(rect.width<1) return;
  canvas.width=Math.round(rect.width*dpr); canvas.height=Math.round(rect.height*dpr);
  const ctx=canvas.getContext('2d'); ctx.scale(dpr,dpr);
  const w=rect.width,h=rect.height,p={l:43,r:16,t:20,b:31},cw=w-p.l-p.r,ch=h-p.t-p.b;
  const {data,samples,reports,elapsed}=displayed||{samples:[],reports:[],elapsed:0};
  const values=samples.map(s=>s.rssi_dbm);
  const lo=Math.floor(Math.min(-65,...values.map(v=>v-3))/5)*5,hi=Math.ceil(Math.max(-50,...values.map(v=>v+3))/5)*5;
  const x=(t)=>p.l+t/180*cw, y=(v)=>p.t+(hi-v)/(hi-lo)*ch;
  ctx.font='12px "Segoe UI", sans-serif';ctx.lineWidth=1;
  for(let value=lo;value<=hi;value+=5){ctx.strokeStyle='#2a4246';ctx.beginPath();ctx.moveTo(p.l,y(value));ctx.lineTo(w-p.r,y(value));ctx.stroke();ctx.fillStyle='#a5b8b7';ctx.textAlign='right';ctx.fillText(value,p.l-9,y(value)+4);}
  for(let t=0;t<=180;t+=30){ctx.fillStyle='#a5b8b7';ctx.textAlign='center';ctx.fillText(`${t}s`,x(t),h-8);}
  for(let i=0;i<reports.length;i++) if(reports[i].upstream_label==='active'){
    const end=Math.min(elapsed,reports[i+1]?.elapsed_seconds??(reports[i].elapsed_seconds+3));
    ctx.fillStyle='#ffb77922';ctx.fillRect(x(reports[i].elapsed_seconds),p.t,Math.max(1,x(end)-x(reports[i].elapsed_seconds)),ch);
    ctx.fillStyle='#ffb779';ctx.fillRect(x(reports[i].elapsed_seconds),p.t,Math.max(1,x(end)-x(reports[i].elapsed_seconds)),3);
  }
  if(samples.length){
    ctx.beginPath();samples.forEach((s,i)=>{if(!i)ctx.moveTo(x(s.elapsed_seconds),y(s.rssi_dbm));else{ctx.lineTo(x(s.elapsed_seconds),y(samples[i-1].rssi_dbm));ctx.lineTo(x(s.elapsed_seconds),y(s.rssi_dbm));}});
    ctx.strokeStyle=mode==='live'?'#d7ee99':'#73bcce';ctx.lineWidth=2.5;ctx.lineJoin='round';ctx.stroke();
    const last=samples.at(-1);ctx.beginPath();ctx.arc(x(last.elapsed_seconds),y(last.rssi_dbm),4,0,Math.PI*2);ctx.fillStyle=ctx.strokeStyle;ctx.fill();
    ctx.beginPath();ctx.setLineDash([4,5]);ctx.lineWidth=1;ctx.strokeStyle='#799895';ctx.moveTo(x(elapsed),p.t);ctx.lineTo(x(elapsed),p.t+ch);ctx.stroke();ctx.setLineDash([]);
  }
}
async function poll() {
  try {live=await api('state');failed=null;}catch(error){failed=`本机采集服务未连接：${error.message}`;}
  if(mode==='live')render();
  setTimeout(poll,700);
}
async function control(action) {
  busy=true;render();
  try {live=await api(action,true);failed=null;}catch(error){failed=error.message;}
  busy=false;render();
}
$('start').addEventListener('click',()=>control('start'));
$('stop').addEventListener('click',()=>control('stop'));
$('live-mode').addEventListener('click',()=>{mode='live';playing=false;render();});
$('return-live').addEventListener('click',async()=>{mode='live';playing=false;render();if(!live||!['starting','collecting'].includes(live.state))await control('start');});
$('replay-mode').addEventListener('click',async()=>{
  try {if(!replay)replay=await api('replay');mode='replay';cursor=180;playing=false;render();}catch(error){errorText(error.message);}
});
$('seek').addEventListener('input',event=>{cursor=Number(event.target.value);playing=false;render();});
$('play').addEventListener('click',()=>{if(cursor>=180)cursor=0;playing=!playing;lastPaint=performance.now();render();});
$('jump').addEventListener('click',()=>{cursor=58;playing=true;lastPaint=performance.now();render();});
$('download').addEventListener('click',()=>{
  const data=currentData();if(!data)return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download=`ruview-${mode}-${data.session_id}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
new ResizeObserver(draw).observe($('signal-chart'));
function frame(now){if(playing&&mode==='replay'){cursor=Math.min(180,cursor+(now-lastPaint)/1000);if(cursor>=180)playing=false;render();}lastPaint=now;requestAnimationFrame(frame);}
requestAnimationFrame(frame);poll();
