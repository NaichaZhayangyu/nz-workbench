/* =====================================================================
   奶茶炸洋芋 · 专属工作台  app.js
   数据全部存于 localStorage，各模块独立命名空间，互不干扰
   ===================================================================== */
const $  = (s,p=document)=>p.querySelector(s);
const $$ = (s,p=document)=>[...p.querySelectorAll(s)];
const DB = {
  get(k,def){ try{const v=localStorage.getItem('nz_'+k);return v?JSON.parse(v):def;}catch(e){return def;} },
  set(k,v){ localStorage.setItem('nz_'+k,JSON.stringify(v)); }
};
const fmtMoney = n => '¥'+Number(n||0).toLocaleString('zh-CN');
const pad = n => (n<10?'0':'')+n;
const ymd = d => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const now = ()=>new Date();
const toast = (msg)=>{const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2200);};

/* ---------- SVG 图标（跨平台不依赖 emoji 字体） ---------- */
const ICONS={
  schedule:`<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
  note:`<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
  babyA:`<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M16 22v-2a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v2"></path><path d="M18 12h4"></path></svg>`,
  babyB:`<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M16 22v-2a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v2"></path><path d="M17 14l2-2"></path></svg>`,
  save:`<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
  clock:`<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
  edit:`<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
  tag:`<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>`,
  baby:`<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M16 22v-2a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4v2"></path><path d="M9 11s1 2 3 2 3-2 3-2"></path></svg>`,
  ai:`<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>`,
};
function icon(name){return ICONS[name]||'';}
function renderIcons(){
  $$('[data-ico]').forEach(el=>{
    const n=el.dataset.ico;
    if(ICONS[n]){el.innerHTML=ICONS[n];el.style.display='inline-flex';el.style.alignItems='center';}
  });
}

/* ---------- 导航切换 ---------- */
$$('#nav .nav-item').forEach(it=>{
  it.onclick=()=>{
    const p=it.dataset.page;
    $$('#nav .nav-item').forEach(n=>n.classList.remove('active'));
    it.classList.add('active');
    $$('.page').forEach(s=>s.classList.remove('active'));
    $('#'+p).classList.add('active');
    $('#sidebar').classList.remove('open');
    $('#scrim').classList.remove('show');
    if(p==='schedule') renderCalendar();
    if(p==='life') loadLife();
    if(p==='babyA') loadBaby('A');
    if(p==='babyB') loadBaby('B');
    if(p==='save') renderSave();
    window.scrollTo(0,0);
  };
});
$('#menuToggle').onclick=()=>{$('#sidebar').classList.toggle('open');$('#scrim').classList.toggle('show');};
$('#scrim').onclick=()=>{$('#sidebar').classList.remove('open');$('#scrim').classList.remove('show');};

/* ---------- 通用弹窗 ---------- */
const mask=$('#mask'),modal=$('#modal');
function openModal(html){modal.innerHTML=html;mask.classList.add('show');setTimeout(renderIcons,0);}
function closeModal(){mask.classList.remove('show');}
mask.onclick=e=>{if(e.target===mask)closeModal();};

/* =====================================================================
   1. 班表
   ===================================================================== */
const SCH_KEY='schedule_v1';
const PROJECTS=['新花','老花'];
let sched = DB.get(SCH_KEY,{});          // { 'YYYY-M-D' : { 9:{p:'项目组A'}, ... } }
let viewY, viewM, selKey;

function saveSched(){DB.set(SCH_KEY,sched);}
function hourLabel(h){return pad(h)+':00';}

function renderCalendar(){
  const today=now();
  if(viewY===undefined){viewY=today.getFullYear();viewM=today.getMonth();}
  const first=new Date(viewY,viewM,1);
  const startDow=(first.getDay()+6)%7; // 周一为起点
  const daysInMo=new Date(viewY,viewM+1,0).getDate();
  const prevDays=new Date(viewY,viewM,0).getDate();
  $('#calMon').textContent=viewY+'年'+(viewM+1)+'月';
  const dows=['一','二','三','四','五','六','日'];
  let html=dows.map(d=>`<div class="cal-dow">${d}</div>`).join('');
  // 上月补位
  for(let i=0;i<startDow;i++){
    const d=prevDays-startDow+1+i;
    html+=`<div class="cal-cell other"><div class="dnum">${d}</div></div>`;
  }
  for(let d=1;d<=daysInMo;d++){
    const key=viewY+'-'+(viewM+1)+'-'+d;
    const isToday=(d===today.getDate()&&viewM===today.getMonth()&&viewY===today.getFullYear());
    const day=sched[key]||{};
    const chips=Object.keys(day).sort((a,b)=>a-b).map(h=>`<span class="chip">${hourLabel(h)} ${day[h].p.replace(/·.*/,'')}</span>`).join('');
    html+=`<div class="cal-cell ${isToday?'today':''}" data-key="${key}" data-d="${d}">
      <div class="dnum">${d}</div><div class="mini">${chips}</div></div>`;
  }
  // 下月补位
  const total=startDow+daysInMo;
  const trail=(7-total%7)%7;
  for(let i=1;i<=trail;i++) html+=`<div class="cal-cell other"><div class="dnum">${i}</div></div>`;
  $('#calGrid').innerHTML=html;
  $$('#calGrid .cal-cell[data-key]').forEach(c=>{
    c.onclick=()=>{selKey=c.dataset.key;editingKey=null;renderSlots(selKey);};
  });
  if(selKey) renderSlots(selKey);
}
$('#prevM').onclick=()=>{viewM--;if(viewM<0){viewM=11;viewY--;}renderCalendar();};
$('#nextM').onclick=()=>{viewM++;if(viewM>11){viewM=0;viewY++;}renderCalendar();};
$('#todayM').onclick=()=>{const t=now();viewY=t.getFullYear();viewM=t.getMonth();renderCalendar();};

let editingKey=null;  // 当前是否处于排班编辑模式
function renderSlots(key){
  const [Y,M,D]=key.split('-').map(Number);
  const day=sched[key]||{};
  const hours=Object.keys(day).map(Number).sort((a,b)=>a-b);
  // 标题（排班按钮固定在标题右边，始终可见）
  $('#selDateTitle').innerHTML=`${Y}年${M}月${D}日 · <span style="color:var(--gold-deep)">${hours.length?hours.length+'个班次':'暂无班次'}</span>`;
  $('#selEditBtn').textContent = editingKey===key ? '完成排班' : '＋ 排班';
  $('#selEditBtn').onclick=()=>{
    if(editingKey===key){editingKey=null;}
    else{editingKey=key;}
    renderSlots(key);
  };
  const wrap=$('#slotList');
  // 编辑模式：显示24小时网格
  if(editingKey===key){
    let html=`<div class="edit-bar"><span style="font-size:12.5px;color:var(--ink-soft)">点时段选择项目组 · 已排的时段点 ✕ 可删除</span></div>`;
    for(let h=0;h<24;h++){
      const rec=day[h];
      html+=`<div class="slot ${rec?'has':'empty'}" data-h="${h}">
        <span class="t">${hourLabel(h)}</span>
        <span class="p">${rec?rec.p:'点此排班'}</span>
        ${rec?`<span class="del-shift" data-h="${h}" title="删除">✕</span>`:''}</div>`;
    }
    wrap.innerHTML=html;
    $$('#slotList .slot').forEach(s=>{
      const h=Number(s.dataset.h);
      const del=s.querySelector('.del-shift');
      if(del) del.onclick=(e)=>{e.stopPropagation();deleteShift(key,h);};
      else s.onclick=()=>openShiftModal(key,h);
    });
    return;
  }
  // 查看模式：只显示有班次的记录
  if(hours.length===0){
    wrap.innerHTML=`<div class="empty-tip">这一天还没排班<br><span style="font-size:13px;">点右上角「＋ 排班」开始安排</span></div>`;
    return;
  }
  let html='';
  hours.forEach(h=>{
    const rec=day[h];
    html+=`<div class="slot has" data-h="${h}" style="cursor:default;">
      <span class="t">${hourLabel(h)}</span>
      <span class="p">${rec.p}</span>
      <span class="del-shift" data-h="${h}" title="删除（如请假）">✕</span></div>`;
  });
  wrap.innerHTML=html;
  $$('#slotList .del-shift').forEach(b=>b.onclick=()=>{
    deleteShift(key,Number(b.dataset.h));
  });
}
// 删除某天某时段班次（请假等场景）
function deleteShift(key,h){
  if(sched[key]&&sched[key][h]){
    const proj=sched[key][h].p;
    delete sched[key][h];
    if(!Object.keys(sched[key]).length)delete sched[key];
    saveSched();
    // 同步删除对应闹钟
    const [Y,M,D]=key.split('-').map(Number);
    const aid=Y+'-'+M+'-'+D+'-'+h;
    alarms=alarms.filter(a=>a.id!==aid);saveAlarms();
    renderCalendar();renderSlots(key);toast('已删除「'+hourLabel(h)+' '+proj+'」班次');
  }
}

function openShiftModal(key,h){
  let sel=null;
  const [Y,M,D]=key.split('-').map(Number);
  const existing=(sched[key]&&sched[key][h])?sched[key][h].p:null;
  let html=`<h3>${icon('clock')} 排班登记</h3>
    <div class="mdesc">${Y}年${M}月${D}日 · ${hourLabel(h)} — 选择所属项目组</div>
    <div class="opt-grid" id="optG">${PROJECTS.map(p=>`<div class="opt ${existing===p?'sel':''}" data-p="${p}">${p}</div>`).join('')}</div>
    <div class="row">
      ${existing?`<button class="btn ghost" id="delShift">删除</button>`:''}
      <button class="btn" id="saveShift">确认记录</button>
    </div>`;
  openModal(html);
  $$('#optG .opt').forEach(o=>o.onclick=()=>{sel=o.dataset.p;$$('#optG .opt').forEach(x=>x.classList.remove('sel'));o.classList.add('sel');});
  $('#saveShift').onclick=()=>{
    if(!sel){toast('请选择一个项目组');return;}
    sched[key]=sched[key]||{};
    sched[key][h]={p:sel,t:Date.now()};
    saveSched();
    setAlarm(Y,M,D,h,sel);
  closeModal();renderCalendar();renderSlots(key);
  toast('已记录，上班前15分钟会提醒你');
  };
  const del=$('#delShift');
  if(del) del.onclick=()=>{
    deleteShift(key,h);
    closeModal();renderCalendar();renderSlots(key);
  };
}

/* ===== 闹钟（强提醒：循环响铃 + 全屏弹窗） ===== */
const ALARM_KEY='alarms_v1';
let alarms=DB.get(ALARM_KEY,[]); // {id, at(ts), title}
let ringTimer=null, ringCtx=null;
function saveAlarms(){DB.set(ALARM_KEY,alarms);}
function setAlarm(Y,M,D,h,proj){
  const shift=new Date(Y,M-1,D,h,0,0).getTime();
  const at=shift-15*60*1000;
  const id=Y+'-'+M+'-'+D+'-'+h;
  alarms=alarms.filter(a=>a.id!==id);
  alarms.push({id,at,title:`${hourLabel(h)}「${proj}」即将开始`});
  saveAlarms();
}
function alarmLoop(){
  const t=Date.now();
  let fired=false,msg='';
  alarms=alarms.filter(a=>{
    if(a.at<=t){
      fired=true;msg=a.title;
      showAlarm(msg);
      return false;
    }
    return true;
  });
  if(fired)saveAlarms();
}
// 循环响铃：每 1.2 秒"叮咚——叮咚"，直到关闭
function startRing(){
  stopRing();
  const beep=()=>{
    try{
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)return;
      ringCtx=new AC();
      // 两声"叮咚"
      [0,0.35].forEach((off,i)=>{
        const o=ringCtx.createOscillator(),g=ringCtx.createGain();
        o.connect(g);g.connect(ringCtx.destination);
        o.type='sine';
        o.frequency.value=i===0?988:1319; // B5 / E6 清亮铃声
        const st=ringCtx.currentTime+off;
        g.gain.setValueAtTime(.001,st);
        g.gain.exponentialRampToValueAtTime(.5,st+.03);
        g.gain.exponentialRampToValueAtTime(.001,st+.3);
        o.start(st);o.stop(st+.32);
      });
    }catch(e){}
  };
  beep();
  ringTimer=setInterval(beep,1200);
}
function stopRing(){
  if(ringTimer){clearInterval(ringTimer);ringTimer=null;}
  if(ringCtx){try{ringCtx.close();}catch(e){} ringCtx=null;}
}
function showAlarm(msg){
  // 全屏强提醒弹窗
  $('#alarmMsg').textContent=msg;
  $('#alarmAlert').classList.add('show');
  startRing();
  // 尝试系统通知（配合响铃）
  try{
    if('Notification' in window && Notification.permission==='granted'){
      new Notification('奶茶炸洋芋 · 上班提醒',{body:msg});
    }
  }catch(e){}
  // 震动（支持的手机）
  try{ if(navigator.vibrate) navigator.vibrate([400,200,400,200,400]); }catch(e){}
}
function closeAlarm(){
  stopRing();
  $('#alarmAlert').classList.remove('show');
  const dot=$('#alarmDot');
  dot.classList.remove('show');
}
$('#alarmClose').onclick=()=>closeAlarm();
// 稍后提醒：5 分钟后再响一次
$('#alarmSnooze').onclick=()=>{
  const msg=$('#alarmMsg').textContent;
  closeAlarm();
  setTimeout(()=>showAlarm(msg),5*60*1000);
  toast('5 分钟后再提醒你');
};
setInterval(alarmLoop,15000);
function requestNote(){
  try{if('Notification' in window&&Notification.permission==='default')Notification.requestPermission();}catch(e){}
}
requestNote();
// 测试闹钟
$('#testAlarmBtn').onclick=()=>{showAlarm('这是一条测试提醒：模拟上班前15分钟，应用运行期间会准点响铃');};
$('#exportSched').onclick=()=>{
  const rows=[['日期','时间段','项目组']];
  Object.keys(sched).sort().forEach(k=>{
    const [Y,M,D]=k.split('-').map(Number);
    Object.keys(sched[k]).sort((a,b)=>a-b).forEach(h=>rows.push([`${Y}-${pad(M)}-${pad(D)}`,hourLabel(h),sched[k][h].p]));
  });
  if(rows.length===1){toast('本月还没有排班记录');return;}
  const csv=rows.map(r=>r.join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv'});const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download='班表_'+viewY+'_'+(viewM+1)+'.csv';a.click();
  toast('已导出 '+rows.length+' 条排班');
};

/* =====================================================================
   2. 生活化备忘录
   ===================================================================== */
const LIFE_KEY='life_v1';
let life=DB.get(LIFE_KEY,{cats:[{name:'全部',color:'#955fc4'}],notes:[]});
// 默认分类（首次）
if(!life.cats || !life.cats.length){
  life={cats:[{name:'全部',color:'#955fc4'},{name:'待办',color:'#c9a24b'},{name:'菜谱',color:'#7d4aae'},{name:'灵感',color:'#b08dd9'},{name:'杂事',color:'#955fc4'}],notes:[]};
  DB.set(LIFE_KEY,life);
}
let lifeCurCat='全部', lifeCurSearch='', lifeCurId=null;

function saveLife(){DB.set(LIFE_KEY,life);}
function lifeFiltered(){
  let list=life.notes.slice();
  if(lifeCurCat!=='全部') list=list.filter(n=>n.cat===lifeCurCat);
  if(lifeCurSearch){
    const q=lifeCurSearch.toLowerCase();
    list=list.filter(n=>(n.title+' '+n.content+' '+(n.cat||'')).toLowerCase().includes(q));
  }
  return list.sort((a,b)=>b.t-a.t);
}
function loadLife(){
  // 分类列表
  const catsHtml=life.cats.map(c=>`<div class="cat ${lifeCurCat===c.name?'active':''}" data-c="${c.name}">
    <span class="cd" style="background:${c.color}"></span>${c.name}
    <span class="cnt">${c.name==='全部'?life.notes.length:life.notes.filter(n=>n.cat===c.name).length}</span></div>`).join('');
  $('#lifeCats').innerHTML=`<h5>分类</h5>${catsHtml}<div class="cat add" id="addCat">＋ 新建分类</div>`;
  $$('#lifeCats .cat[data-c]').forEach(el=>el.onclick=()=>{lifeCurCat=el.dataset.c;lifeCurId=null;loadLife();});
  $('#addCat').onclick=addCategory;
  renderLifeNotes();
}
function renderLifeNotes(){
  const list=lifeFiltered();
  if(lifeCurId){
    const n=life.notes.find(x=>x.id===lifeCurId);
    if(n){$('#lifeList').innerHTML=lifeNoteDetail(n);bindLifeDetail(n);return;}
  }
  if(!list.length){
    const emptyMsg = lifeCurSearch
      ? `没有匹配的记录 ${icon('note')}`
      : `还没有记录，点击右上角「＋ 新建」开始随手记 ${icon('edit')}`;
    $('#lifeList').innerHTML=`<div class="empty-tip">${emptyMsg}</div>`;
    return;
  }
  $('#lifeList').innerHTML=list.map(n=>{
    const plain=(n.content||'').replace(/\n/g,' ').slice(0,60);
    return `<div class="note-card" data-id="${n.id}">
      <div class="nt"><span class="cd" style="width:8px;height:8px;border-radius:50%;background:${catColor(n.cat)}"></span>${esc(n.title||'无标题')}</div>
      <div class="nm">${plain?esc(plain):'（无正文）'}</div>
      <div class="ntime">${fmtDate(n.t)} · ${n.cat}</div></div>`;
  }).join('');
  $$('#lifeList .note-card').forEach(c=>c.onclick=()=>{lifeCurId=c.dataset.id;renderLifeNotes();});
}
function catColor(name){const c=life.cats.find(x=>x.name===name);return c?c.color:'#955fc4';}
function lifeNoteDetail(n){
  return `<div class="note-detail">
    <div class="dh">${esc(n.title||'无标题')}
      <button class="del-x" id="delNote">✕</button></div>
    <div class="meta">${fmtDate(n.t)} · 分类：${n.cat}</div>
    <div class="content">${esc(n.content||'')}</div>
    <div class="ai-box">
      <h4>${icon('ai')} AI 辅助延伸</h4>
      <div class="ad">基于你录入的内容，AI 帮你延伸拓展、查找相关案例与参考方向</div>
      <button class="btn gold sm" id="aiBtn">让 AI 拓展灵感</button>
      <div class="ai-out" id="aiOut"></div>
    </div>
  </div>`;
}
function bindLifeDetail(n){
  $('#delNote').onclick=()=>{life.notes=life.notes.filter(x=>x.id!==n.id);saveLife();lifeCurId=null;loadLife();toast('已删除');};
  $('#aiBtn').onclick=()=>aiExpand(n);
}
function aiExpand(n){
  const out=$('#aiOut');out.classList.add('show');out.innerHTML='<div class="ai-block">AI 正在基于你的内容生成延伸…</div>';
  // 本地启发式生成（无需联网，秒级响应）
  setTimeout(()=>{
    out.innerHTML=localAI(n);
  },350);
}
function localAI(n){
  const txt=(n.title+' '+(n.content||'')).trim();
  const blocks=[];
  blocks.push(`<div class="ai-block">💡 <b>灵感延伸</b><br>围绕「${esc(n.title||'此内容')}」，你可以尝试从「为什么做 → 怎么做更顺手 → 还能用在哪」三个角度继续发散，把它从一条碎片变成可落地的行动。</div>`);
  blocks.push(`<div class="ai-block">📚 <b>相关案例方向</b><br>① 同类生活化清单：把零散想法按「场景/人物/时间」归类，更容易日后调取；<br>② 家庭事务模板：待办 + 菜谱 + 灵感混排时，用分类色块区分最省心；<br>③ 二胎家庭常见记录：用药、疫苗、校园事项都适合「时间线」沉淀。</div>`);
  blocks.push(`<div class="ai-block">🔗 <b>参考资料检索建议</b><br>可在搜索框输入关键词（如「${esc((n.title||'').slice(0,6)||'菜谱')} 做法」「育儿 用药 注意」）进一步搜集；本工作台已为你保留精准搜索，历史记录随取随用。</div>`);
  blocks.push(`<div class="ai-block">✅ <b>下一步小行动</b><br>建议给这条内容补一个具体时间或负责人，1 分钟后它就从「想法」变成「计划」。</div>`);
  return blocks.join('');
}
function addCategory(){
  openModal(`<h3>${icon('tag')} 新建分类</h3>
    <div class="mdesc">给分类取个名字，选个颜色</div>
    <label>分类名称</label><input id="catName" placeholder="如：旅行计划">
    <label style="margin-top:12px;">颜色</label>
    <div class="opt-grid" id="catColors">
      ${['#955fc4','#c9a24b','#7d4aae','#b08dd9','#6b8fd9','#d98fb0'].map(c=>`<div class="opt" data-c="${c}" style="border-radius:50%;width:34px;height:34px;padding:0;background:${c};margin:auto"></div>`).join('')}
    </div>
    <div class="row"><button class="btn" id="saveCat">创建</button></div>`);
  let col='#955fc4';
  $$('#catColors .opt').forEach(o=>o.onclick=()=>{col=o.dataset.c;$$('#catColors .opt').forEach(x=>x.style.outline='');o.style.outline='3px solid '+col;});
  $('#saveCat').onclick=()=>{
    const nm=$('#catName').value.trim();
    if(!nm){toast('请输入分类名称');return;}
    if(life.cats.some(c=>c.name===nm)){toast('分类已存在');return;}
    life.cats.push({name:nm,color:col});saveLife();closeModal();loadLife();
  };
}
function newLifeNote(){
  openModal(`<h3>${icon('edit')} 新建记录</h3>
    <div class="mdesc">随手记，越简单越好</div>
    <label>标题</label><input id="nTitle" placeholder="一句话概括">
    <label style="margin-top:12px;">内容</label><textarea id="nContent" placeholder="写点什么…灵感、菜谱、待办都行"></textarea>
    <label style="margin-top:12px;">分类</label>
    <select id="nCat">${life.cats.filter(c=>c.name!=='全部').map(c=>`<option value="${c.name}">${c.name}</option>`).join('')||'<option>杂事</option>'}</select>
    <div class="row"><button class="btn" id="saveNote">保存</button></div>`);
  $('#saveNote').onclick=()=>{
    const title=$('#nTitle').value.trim();
    const content=$('#nContent').value.trim();
    const cat=$('#nCat').value||'杂事';
    if(!title&&!content){toast('写点东西再保存吧');return;}
    const note={id:'L'+Date.now(),title:title||'无标题',content,cat,t:Date.now()};
    life.notes.push(note);saveLife();closeModal();lifeCurId=null;loadLife();toast('已保存');
  };
}
$('#newLife').onclick=newLifeNote;
$('#lifeSearch').oninput=e=>{lifeCurSearch=e.target.value;lifeCurId=null;renderLifeNotes();};

/* =====================================================================
   3+4. 宝宝备忘录（大宝/小宝 独立）
   ===================================================================== */
const BABY_KEYS={A:'babyA_v1',B:'babyB_v1'};
const BABY_TYPES=['疫苗','体检','生病日志','校园事项','成长'];
const BABY_TPL={
  '疫苗':['疫苗名称','接种日期','接种机构','下次预约'],
  '体检':['体检项目','体检日期','身高体重','异常提示'],
  '生病日志':['症状','发烧时间/体温','用药记录','护理备注'],
  '校园事项':['事项','日期','老师/班级','备注'],
  '成长':['里程碑','日期','记录','照片备注']
};
function getBaby(k){return DB.get(BABY_KEYS[k],{recs:[]});}
function saveBaby(k,d){DB.set(BABY_KEYS[k],d);}

function loadBaby(who){
  const d=getBaby(who);
  const tabsHtml=BABY_TYPES.map(t=>`<button class="btn ghost sm baby-tab ${d._tab===t?'':' '}" data-t="${t}" style="${d._tab===t?'background:linear-gradient(120deg,#fff,var(--p-purple-100));border-color:var(--gold-light);color:var(--p-purple-600);':''}">${t} <span style="opacity:.6">${d.recs.filter(r=>r.type===t).length}</span></button>`).join('');
  $('#baby'+who+'Tabs').innerHTML=tabsHtml;
  $$('#baby'+who+'Tabs .baby-tab').forEach(b=>b.onclick=()=>{d._tab=b.dataset.t;saveBaby(who,d);loadBaby(who);});
  renderBabyList(who);
}
function renderBabyList(who){
  const d=getBaby(who);
  const search=$('#baby'+who+'Search').value.trim().toLowerCase();
  let list=d.recs.slice();
  const tab=d._tab;
  if(tab&&tab!=='全部') list=list.filter(r=>r.type===tab);
  if(search) list=list.filter(r=>JSON.stringify(r).toLowerCase().includes(search));
  list.sort((a,b)=>b.t-a.t);
  const el=$('#baby'+who+'List');
  if(!list.length){
    const emptyMsg = search ? `没有匹配的记录 ${icon('note')}` : `还没有记录，点击「＋ 新增记录」开始 ${icon('edit')}`;
    el.innerHTML=`<div class="empty-tip">${emptyMsg}</div>`;return;
  }
  el.innerHTML=list.map(r=>{
    const fields=Object.entries(r.fields||{}).filter(([k,v])=>v).map(([k,v])=>`<b>${k}：</b>${esc(v)}`).join('　');
    return `<div class="tl-item">
      <button class="del" data-id="${r.id}">✕</button>
      <div class="tt"><span class="badge">${r.type}</span>${esc(r.title||'')}</div>
      <div class="td">${fields||esc(r.note||'')}</div>
      <div class="ttime">📅 ${fmtDate(r.t)}</div></div>`;
  }).join('');
  $$('#baby'+who+'List .del').forEach(b=>b.onclick=()=>{
    const dd=getBaby(who);dd.recs=dd.recs.filter(x=>x.id!==b.dataset.id);saveBaby(who,dd);loadBaby(who);toast('已删除');
  });
}
function newBabyRec(who){
  const tpl=BABY_TPL;
  const types=BABY_TYPES;
  openModal(`<h3>${icon('baby')} 新增${who==='A'?'大宝':'小宝'}记录</h3>
    <div class="mdesc">选类型 → 填内容，时间线自动更新</div>
    <label>记录类型</label>
    <select id="bType">${types.map(t=>`<option value="${t}">${t}</option>`).join('')}</select>
    <div id="dynFields"></div>
    <label style="margin-top:12px;">标题（一句话，如：发烧38.5℃）</label>
    <input id="bTitle" placeholder="如：第二针乙肝疫苗">
    <div class="row"><button class="btn" id="saveBabyRec">保存</button></div>`);
  const renderFields=()=>{
    const t=$('#bType').value;
    $('#dynFields').innerHTML=tpl[t].map(f=>`<label style="margin-top:10px;">${f}</label><input data-f="${f}" placeholder="${f}">`).join('');
  };
  $('#bType').onchange=renderFields;renderFields();
  $('#saveBabyRec').onclick=()=>{
    const type=$('#bType').value;
    const title=$('#bTitle').value.trim();
    const fields={};$$('#dynFields input').forEach(i=>{if(i.value.trim())fields[i.dataset.f]=i.value.trim();});
    if(!title&&!Object.keys(fields).length){toast('至少填一项吧');return;}
    const d=getBaby(who);
    d.recs.push({id:'B'+who+Date.now(),type,title,fields,t:Date.now()});
    d._tab=type;saveBaby(who,d);
    closeModal();loadBaby(who);toast('已记录');
  };
}
$('#newBabyA').onclick=()=>newBabyRec('A');
$('#newBabyB').onclick=()=>newBabyRec('B');
$('#babyASearch').oninput=()=>renderBabyList('A');
$('#babyBSearch').oninput=()=>renderBabyList('B');

/* =====================================================================
   5. 存钱计划
   ===================================================================== */
const SAVE_KEY='save_v1';
let save=DB.get(SAVE_KEY,{goal:300000,records:[]}); // 默认建水购房目标 30万（可改）
function saveSave(){DB.set(SAVE_KEY,save);}
const QUOTES=[
  '慢慢攒，稳稳爱，建水的小院正在向你走来。',
  '每一笔存入，都是给未来的自己写的一封情书。',
  '不慌不忙，细水长流，房子会有的，烟火气也会有的。',
  '今天省下的奶茶钱，是明天建水院子里的阳光。',
  '攒钱不是将就，而是把喜欢的生活一点点搬回家。',
  '你认真存下的每一元，都在替未来的家添一块砖。',
  '慢一点也没关系，方向对了，建水就在前方。',
  '把平淡的日子过小满，把辛苦的积累变成家。',
  '今天多存一点，离建水的小院就近一点。',
  '温柔攒钱，认真生活，好房子和好运都会来。',
  '不必一次到位，持续下去就是最厉害的魔法。',
  '你在为家努力的样子，本身就很招财。'
];
function dailyQuote(){
  const key='nz_quote_date';
  const today=ymd(now());
  let cur=DB.get('quote_cur',{});
  if(cur.date!==today){
    let idx=Math.floor(Math.random()*QUOTES.length);
    cur={date:today,idx};DB.set('quote_cur',cur);
  }
  return QUOTES[cur.idx];
}
function renderSave(){
  $('#dailyQuote').textContent=dailyQuote();
  // 目标可编辑
  $('#goalAmt').textContent=fmtMoney(save.goal);
  $('#goalAmt').style.cursor='pointer';
  $('#goalAmt').onclick=()=>{
    const v=prompt('设置云南建水购房目标金额（元）：',save.goal);
    if(v!==null&&!isNaN(v)&&v>0){save.goal=Number(v);saveSave();renderSave();}
  };
  const total=save.records.reduce((s,r)=>s+r.amt,0);
  const gap=Math.max(0,save.goal-total);
  const pct=save.goal>0?Math.min(100,Math.round(total/save.goal*100)):0;
  $('#savedAmt').textContent=fmtMoney(total);
  $('#gapAmt').textContent=fmtMoney(gap);
  $('#saveCnt').textContent=save.records.length+' 次';
  $('#saveBar').style.width=pct+'%';
  $('#savePct').textContent='已完成 '+pct+'%';
  const log=save.records.slice().sort((a,b)=>b.t-a.t).slice(0,30)
    .map(r=>`<div class="stat-row"><span class="lab">${fmtDate(r.t)}</span><span class="val gold">+${fmtMoney(r.amt)}</span></div>`).join('')||'<div style="color:var(--ink-soft);font-size:13px;padding:8px 0;">还没有存入记录，记一笔吧</div>';
  $('#saveLog').innerHTML=log;
}
$('#doSave').onclick=()=>{
  const v=parseFloat($('#saveInput').value);
  if(!v||v<=0){toast('请输入有效金额');return;}
  save.records.push({amt:v,t:Date.now()});saveSave();
  $('#saveInput').value='';renderSave();toast('已存入 '+fmtMoney(v));
};
$('#saveInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('#doSave').click();});

/* =====================================================================
   工具
   ===================================================================== */
function esc(s){return (s||'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
function fmtDate(t){
  const d=new Date(t);
  const diff=(now()-d)/86400000;
  let rel=diff<1?'今天':diff<2?'昨天':diff<7?Math.floor(diff)+'天前':'';
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`+(rel?`（${rel}）`:'');
}

/* =====================================================================
   初始化
   ===================================================================== */
renderIcons();
renderCalendar();
renderSave();
alarmLoop();

/* ---------- PWA：注册离线缓存 + 添加到主屏幕引导 ---------- */
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  });
}
// iOS 不自动提示安装，首次访问引导用户手动"添加到主屏幕"
(function installHint(){
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  const stood=DB.get('standalone_hint',false);
  const isStandalone=window.navigator.standalone||window.matchMedia('(display-mode: standalone)').matches;
  if(ios && !isStandalone && !stood && window.innerWidth<820){
    toast('📲 点右下角「分享」→「添加到主屏幕」，就能像 App 一样用啦');
    DB.set('standalone_hint',true);
  }
})();

/* ---------- 本地局域网：手机扫码打开 ---------- */
function currentAccessURL(){
  // 优先用当前地址；若是本地文件打开（无服务器），返回空让启动脚本处理
  if(location.protocol==='file:') return '';
  return location.origin + location.pathname.replace(/[^/]*$/,'') + 'index.html';
}
$('#lanBtn').onclick=()=>{
  const url=currentAccessURL();
  let body;
  if(!url){
    body=`<div class="qr-box">
      <h3>📱 手机扫码打开</h3>
      <div class="hint" style="text-align:left;">
        检测到你是直接双击打开的本机文件，手机扫不了。<br><br>
        <b>正确姿势（傻瓜三步）：</b><br>
        ① 电脑上双击运行 <b>「启动局域网访问.py」</b><br>
        ② 屏幕弹出二维码和网址<br>
        ③ 手机连<b>同一个 WiFi</b>，扫二维码 → 打开 → 加到主屏幕<br><br>
        （找不到启动脚本？在电脑浏览器地址栏输入 <code>localhost:8080</code> 也能用）
      </div>
    </div>`;
  } else {
    let qrImg='';
    try{
      const qr=qrcode(0, 'M');
      qr.addData(url); qr.make();
      qrImg=`<img class="qr-img" src="${qr.createDataURL(8)}" alt="扫码">`;
    }catch(e){ qrImg='<div class="hint">二维码生成失败，请手动复制下方网址</div>'; }
    body=`<div class="qr-box">
      <h3>📱 手机扫码打开</h3>
      <div class="mdesc">手机连<b>同一个 WiFi</b>，扫下方二维码即可打开工作台</div>
      ${qrImg}
      <div class="url-line" id="lanUrl">${url}</div>
      <button class="btn ghost sm copy-btn" id="copyUrl">复制网址</button>
      <div class="hint">打开后点浏览器「分享 / 添加到主屏幕」，桌面就出现紫色奶茶图标 🧋</div>
    </div>`;
  }
  openModal(body);
  const cp=$('#copyUrl');
  if(cp) cp.onclick=()=>{
    const u=$('#lanUrl').textContent;
    navigator.clipboard?.writeText(u).then(()=>toast('网址已复制')).catch(()=>toast('复制失败，请手动选'));
  };
};
