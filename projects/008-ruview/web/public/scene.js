// Original teaching simulation. Skeletons and events are scripted ground truth,
// not RuView inference. Only the explicitly labelled API section calls RuView.
const $=id=>document.getElementById(id);
const scenarios={
  walk:{name:'走动追踪',action:'行走',count:1,motion:1.2,note:'人物沿房间内的路线走动，轨迹与信号起伏同步变化。位置和骨架由动画脚本设定，用来演示追踪界面。'},
  sit:{name:'静坐呼吸',action:'静坐',count:1,motion:0,note:'人物坐下后，大幅运动减少，胸部随呼吸轻微起伏。为了方便观察，胸部动画位移经过放大。'},
  fall:{name:'跌倒事件',action:'行走',count:1,motion:1.5,note:'时间线：行走 → 第 3 秒开始倒下 → 第 4 秒触发模拟告警 → 保持倒地。点击重播可再次观察；不是跌倒算法的检测结果。'},
  multi:{name:'多人活动',action:'行走 + 静坐',count:3,motion:1.8,note:'三名虚拟人物使用不同颜色和轨迹。信号由多个简化周期叠加；人数直接取自场景设置，未运行人数或多人姿态模型。'},
  empty:{name:'空房对照',action:'无人',count:0,motion:0,note:'空房没有人物、呼吸源和活动事件。只保留设定的环境噪声，用来对照有人时的信号变化。'}
};
const palette=['#d7ee99','#76ccdf','#d0b5ed'];
const bones=[[0,1],[0,2],[1,3],[2,4],[5,6],[5,7],[7,9],[6,8],[8,10],[5,11],[6,12],[11,12],[11,13],[13,15],[12,14],[14,16],[0,5],[0,6]];
let scene='walk',time=0,last=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,topView=false,history=[],events=[],lastSample=-1,lastUI=-1,fallLogged=false,stillLogged=false,runId=0;
const nodes=[[-2.65,-2.15,.35],[2.65,-1.9,.35],[2.3,2.15,.35]];
let people=[],scale=1,width=1,height=1,view;
const room=$('room'),wave=$('sim-wave');
function stamp(t){return `${String(Math.floor(t/60)).padStart(2,'0')}:${(t%60).toFixed(1).padStart(4,'0')}`}
function logEvent(text){events.unshift({time:stamp(time),text});events=events.slice(0,4);$('events').replaceChildren(...events.map(e=>{let li=document.createElement('li'),t=document.createElement('time');t.textContent=e.time;li.append(t,document.createTextNode(e.text));return li}))}
function project([x,y,z=0]){return topView?[width*.5+x*scale*1.05,height*.53+y*scale*.8-z*scale*.18]:[width*.5+(x-y)*scale*.78,height*.64+(x+y)*scale*.36-z*scale]}
function polygon(points,fill,stroke,line=1){view.beginPath();points.forEach((p,i)=>{const [x,y]=project(p);i?view.lineTo(x,y):view.moveTo(x,y)});view.closePath();if(fill){view.fillStyle=fill;view.fill()}if(stroke){view.strokeStyle=stroke;view.lineWidth=line;view.stroke()}}
function path(points,color,line=1,dash=[]){view.beginPath();points.forEach((p,i)=>{const [x,y]=project(p);i?view.lineTo(x,y):view.moveTo(x,y)});view.strokeStyle=color;view.lineWidth=line;view.setLineDash(dash);view.stroke();view.setLineDash([])}
function circle(p,r,color,fill=true){let [x,y]=project(p);view.beginPath();view.arc(x,y,r,0,Math.PI*2);view.fillStyle=color;view.strokeStyle=color;fill?view.fill():view.stroke()}
function pose(index,t){
  let sitting=scene==='sit'||(scene==='multi'&&index===1),falling=scene==='fall',phase=t*4+index*2;
  let x=0,y=0,yaw=0;
  if(sitting){x=scene==='multi'?-1.65:0;y=.1;yaw=.3}
  else if(falling){x=-1.1+Math.min(t,3)*.43;y=0;yaw=0}
  else {x=1.65*Math.sin(t*.48+index*2.1);y=1.15*Math.cos(t*.48+index*2.1);yaw=Math.atan2(Math.cos(t*.48+index*2.1),-Math.sin(t*.48+index*2.1));if(scene==='multi'){x=index===0?.55+Math.sin(t*.48):1.15+.65*Math.sin(t*.48+1);y=index===0?1.25+.42*Math.cos(t*.48):-.85+.5*Math.cos(t*.48+1)}}
  const breath=Math.sin(t*Number($('respiration').value)/60*2*Math.PI+index*.6),hip=sitting?.72:1.02,bob=sitting?0:.024*Math.cos(phase*2),stride=sitting?0:Math.sin(phase)*.3;
  // COCO-like 17 joints, in metres only as a scene coordinate convention.
  let local=[[0,0,hip+.69],[.04,-.01,hip+.73],[-.04,-.01,hip+.73],[.09,0,hip+.69],[-.09,0,hip+.69],[-.22,0,hip+.46],[.22,0,hip+.46],[-.32,sitting?.18:-stride,hip+.2],[.32,sitting?.18:stride,hip+.2],[-.27,sitting?.36:-stride*.9,hip-.04],[.27,sitting?.36:stride*.9,hip-.04],[-.14,0,hip],[.14,0,hip],[-.15,sitting?.38:stride*.7,sitting?.5:.51],[.15,sitting?.38:-stride*.7,sitting?.5:.51],[-.15,sitting?.4:stride,sitting?.05:Math.max(.03,stride*.18)],[.15,sitting?.4:-stride,sitting?.05:Math.max(.03,-stride*.18)]];
  const fall=Math.min(1,Math.max(0,(t-3)/.85));
  let joints=local.map(([a,b,z],i)=>{if(i===5||i===6){a*=1+breath*.045;b+=breath*.023}z+=bob;if(falling){let angle=fall*Math.PI*.49;let nz=z*Math.cos(angle)-b*Math.sin(angle);b=b*Math.cos(angle)+z*Math.sin(angle);z=Math.max(.08,nz)}return [x+a*Math.cos(yaw)-b*Math.sin(yaw),y+a*Math.sin(yaw)+b*Math.cos(yaw),z]});
  return {x,y,joints,color:palette[index],sitting,index,down:falling&&t>=3.85,breath};
}
function renderRoom(){
  const r=room.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);width=r.width;height=r.height;scale=Math.min(width/8.8,height/6.5);
  if(room.width!==Math.round(width*d)||room.height!==Math.round(height*d)){room.width=Math.round(width*d);room.height=Math.round(height*d)}view=room.getContext('2d');view.setTransform(d,0,0,d,0,0);view.clearRect(0,0,width,height);
  polygon([[-3,-2.5,0],[3,-2.5,0],[3,2.5,0],[-3,2.5,0]],'#12262a','#54736a');
  for(let x=-3;x<=3;x+=.5)path([[x,-2.5,0],[x,2.5,0]],'#2b4445',.6);
  for(let y=-2.5;y<=2.5;y+=.5)path([[-3,y,0],[3,y,0]],'#2b4445',.6);
  if(!topView){polygon([[-3,-2.5,0],[3,-2.5,0],[3,-2.5,1.4],[-3,-2.5,1.4]],'#729d9010','#729d9040');polygon([[-3,-2.5,0],[-3,2.5,0],[-3,2.5,1.4],[-3,-2.5,1.4]],'#729d900c','#729d9030')}
  // Furniture footprints provide context without pretending to reconstruct a room.
  polygon([[-2.3,.8,.05],[-1.2,.8,.05],[-1.2,1.8,.05],[-2.3,1.8,.05]],'#293e3e','#47605e');
  polygon([[1.1,-1.9,.05],[2,-1.9,.05],[2,-1.1,.05],[1.1,-1.1,.05]],'#263b3b','#47605e');
  if(scene==='sit'||scene==='multi'){const sx=scene==='multi'?-1.65:0;polygon([[sx-.35,-.18,.67],[sx+.35,-.18,.67],[sx+.35,.48,.67],[sx-.35,.48,.67]],'#40544b','#718675');for(const xx of [-.3,.3])path([[sx+xx,-.15,.67],[sx+xx,-.15,0]],'#718675',1.4)}
  const attenuation=$('wall').checked?.35:1;
  for(let k=0;k<nodes.length;k++){
    let node=nodes[k];for(let ring=0;ring<3;ring++){let radius=((time*.8+ring*1.5)%4.5);view.globalAlpha=(1-radius/4.5)*.26*attenuation;let points=[];for(let n=0;n<=72;n++){const a=n/72*Math.PI*2;points.push([node[0]+Math.cos(a)*radius,node[1]+Math.sin(a)*radius,.06])}path(points,'#a8d592',.8)}view.globalAlpha=1;
    for(const p of people){path([node,[p.x,p.y,.85]],'#c8e99838',1,[4,7]);const u=(time*.6+k*.3+p.index*.2)%1;circle([node[0]+(p.x-node[0])*u,node[1]+(p.y-node[1])*u,.35+.5*u],2,'#ddf0a9')}
    polygon([[node[0]-.13,node[1]-.12,.12],[node[0]+.13,node[1]-.12,.12],[node[0]+.13,node[1]+.12,.12],[node[0]-.13,node[1]+.12,.12]],'#354941','#bfdc93',1.3);path([[node[0],node[1],.12],node],'#bfdc93',2);circle(node,3.5,'#d7ee99');let [px,py]=project(node);view.fillStyle='#a8c0b4';view.font='10px sans-serif';view.fillText(`N${k+1}`,px+9,py+4);
  }
  for(const p of people){if(!p.sitting&&scene!=='fall'){let trail=[];for(let j=0;j<35;j++){const pt=pose(p.index,Math.max(0,time-j*.08));trail.push([pt.x,pt.y,.035])}path(trail,p.color+'55',2)}circle([p.x,p.y,.03],scale*.16,p.color+'28');}
  people.slice().sort((a,b)=>(a.x+a.y)-(b.x+b.y)).forEach(p=>{
    bones.forEach(([a,b])=>{path([p.joints[a],p.joints[b]],'#041916',7);path([p.joints[a],p.joints[b]],p.color,3)});p.joints.forEach((j,k)=>circle(j,k<5?1.8:3,p.color));let head=p.joints[0];circle(head,scale*.098,p.color,false);
    let label=project([p.x,p.y,p.down?.5:1.99]);view.fillStyle=p.color;view.font='11px sans-serif';view.textAlign='center';view.fillText(`P${p.index+1} · ${p.down?'倒地':p.sitting?'静坐':'行走'}`,label[0],label[1]);view.textAlign='left';
    if(p.sitting){let c=project([p.x,p.y,1.02]);view.beginPath();view.ellipse(c[0],c[1],scale*(.25+.015*p.breath),scale*.13,0,0,Math.PI*2);view.strokeStyle=p.color+'75';view.lineWidth=1;view.stroke()}
  });
  if($('wall').checked)polygon([[.7,-2.3,0],[.7,2.3,0],[.7,2.3,1.45],[.7,-2.3,1.45]],'#637f9244','#9cbbc07a');
  let dim=project([0,2.85,0]);view.font='10px sans-serif';view.fillStyle='#93adaa';view.textAlign='center';view.fillText(topView?'俯视 · 示意布局':'6 m × 5 m · 预设房间',dim[0],dim[1]+12);view.textAlign='left';
}
function sample(t){const noise=+$('interference').value/100;let x=0;for(const p of people){x+=.18*Math.sin(t*Number($('respiration').value)/60*2*Math.PI+p.index*.6);if(!p.sitting&&!p.down)x+=.48*Math.sin(t*4+p.index*2)+.12*Math.sin(t*9);if(p.down)x*=.22;}if(scene==='fall')x+=2.2*Math.exp(-Math.pow((t-3.5)*5,2));x+=noise*(.4*Math.sin(t*61.7)+.35*Math.sin(t*43.1));return x*($('wall').checked?.35:1)}
function renderSignal(){const r=wave.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);if(wave.width!==Math.round(r.width*d)||wave.height!==Math.round(r.height*d)){wave.width=Math.round(r.width*d);wave.height=Math.round(r.height*d)}const c=wave.getContext('2d');c.setTransform(d,0,0,d,0,0);c.clearRect(0,0,r.width,r.height);for(let i=0;i<4;i++){c.beginPath();c.moveTo(0,i*r.height/3);c.lineTo(r.width,i*r.height/3);c.strokeStyle='#2b4445';c.lineWidth=.5;c.stroke()}c.beginPath();history.forEach((v,i)=>{const x=r.width-(history.length-1-i)*r.width/240,y=r.height*.5-v*r.height*.19;i?c.lineTo(x,y):c.moveTo(x,y)});c.strokeStyle='#d7ee99';c.lineWidth=1.6;c.stroke()}
function update(){const s=scenarios[scene],down=scene==='fall'&&time>=3.85,still=scene==='fall'&&time>=7;
  $('sim-count').replaceChildren(document.createTextNode(s.count),Object.assign(document.createElement('span'),{textContent:'人'}));
  $('sim-action').textContent=down?'倒地 / 静止':s.action;$('sim-motion').textContent=scene==='empty'?'无':down||scene==='sit'?'低':scene==='multi'?'高':'中';
  $('sim-breath').textContent=s.count?`${$('respiration').value} 次/分（设定）`:'—';$('sim-obstruction').textContent=$('wall').checked?'隔墙（模拟）':'无遮挡';
  const strength=(1-Number($('interference').value)/100*.35)*($('wall').checked?.35:1);$('sim-quality').textContent=`${Math.round(strength*100)}%`;$('sim-meter').style.width=`${strength*100}%`;$('elapsed').textContent=stamp(time);$('fall-alert').hidden=!down;
  if(down&&!fallLogged){logEvent('疑似跌倒告警 · 脚本事件');fallLogged=true}if(still&&!stillLogged){logEvent('倒地后持续静止 · 脚本事件');stillLogged=true}
}
function setScene(key){scene=key;time=0;lastSample=-1;lastUI=-1;history=[];fallLogged=false;stillLogged=false;events=[];runId++;const s=scenarios[key];$('scene-title').textContent=s.name;$('scene-description').textContent=s.note;document.querySelectorAll('[data-scene]').forEach(b=>{b.classList.toggle('selected',b.dataset.scene===key);b.setAttribute('aria-pressed',String(b.dataset.scene===key))});$('native-result').innerHTML='<span class="native-idle">等待运行</span><p>上方展示使用体验；这里展示原版算法实际输出。两者可以不一致。</p>';logEvent(s.count?`场景开始 · 预设 ${s.count} 人`:'场景开始 · 预设空房');logEvent(s.count?'人物、轨迹与信号同步播放':'仅播放环境噪声');people=Array.from({length:s.count},(_,i)=>pose(i,time));update();renderRoom();renderSignal()}
function animate(now){const dt=last?Math.min(.05,(now-last)/1000):0;last=now;if(!paused&&!document.hidden){time+=dt*Number($('speed').value);people=Array.from({length:scenarios[scene].count},(_,i)=>pose(i,time));if(time-lastSample>.05){history.push(sample(time));if(history.length>240)history.shift();lastSample=time}if(time-lastUI>.1){update();lastUI=time}renderRoom();renderSignal()}requestAnimationFrame(animate)}
document.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>setScene(b.dataset.scene)));
$('pause').addEventListener('click',()=>{paused=!paused;$('pause').textContent=paused?'▶ 继续':'Ⅱ 暂停'});
$('restart').addEventListener('click',()=>setScene(scene));$('angle').addEventListener('click',()=>{topView=!topView;$('angle').setAttribute('aria-pressed',String(topView));$('angle').textContent=topView?'切换斜视':'切换俯视';renderRoom()});
for(const id of ['speed','respiration','interference'])$(id).addEventListener('input',()=>{$(`${id}-out`).value=id==='speed'?`${Number($(id).value).toFixed(2)}×`:id==='respiration'?`${$(id).value} 次/分`:`${$(id).value}%`;update();renderRoom()});
$('wall').addEventListener('change',()=>{logEvent($('wall').checked?'加入隔墙 · 固定衰减示意':'移除隔墙');update();renderRoom()});window.addEventListener('resize',()=>{renderRoom();renderSignal()});
$('native-run').addEventListener('click',async()=>{const id=++runId,br=+$('respiration').value,noise=+$('interference').value/100,s=scenarios[scene];$('native-run').disabled=true;$('native-run').textContent='原版算法计算中…';const q=new URLSearchParams({br,hr:72,noise,motion:s.motion,channels:56,occupied:s.count?1:0});try{const r=await fetch(`/api/run?${q}`,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error('请先启动本机算法服务；静态页面仍可使用场景演示。');const data=await r.json();if(data.evidence!=='synthetic-input-real-upstream-algorithm')throw new Error('结果缺少预期的来源标记');if(id!==runId)return;const rr=data.result.breathing,hr=data.result.heart;$('native-result').replaceChildren();const vals=document.createElement('div');vals.className='native-values';for(const [title,v,target] of [['呼吸 / 次每分',rr,s.count?br:null],['心率 / 次每分',hr,s.count?72:null]]){const block=document.createElement('div');block.textContent=title;const b=document.createElement('b');b.textContent=v?v.bpm.toFixed(1):'—';const small=document.createElement('small');small.textContent=`输入 ${target??'无周期'} · ${v?.status??'无结果'}`;block.append(b,small);vals.append(block)}$('native-result').append(vals);const p=document.createElement('p');p.className='native-provenance';p.textContent=`原版 wifi-densepose-vitals 0.3.2 · 合成输入 45 秒 · 计算 ${Math.round(data.elapsed_ms)} ms。这里只验证周期提取，不验证上方位置、人数或动作。隔墙仅影响上方示意图，不传给该算法。`;$('native-result').append(p)}catch(e){if(id===runId){$('native-result').replaceChildren();const p=document.createElement('p');p.className='error';p.textContent=e.message;$('native-result').append(p)}}finally{$('native-run').disabled=false;$('native-run').textContent='用当前参数运行原版算法 ↗'}});
if(paused)$('pause').textContent='▶ 继续';setScene('walk');requestAnimationFrame(animate);
