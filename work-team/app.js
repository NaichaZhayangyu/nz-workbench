/* =====================================================================
   奶茶炸洋芋 · 团队工作台  app.js
   班表（完整保留）+ 发薪日（智能计算）
   数据全部存于 localStorage
   ===================================================================== */
const $  = (s,p=document)=>p.querySelector(s);
const $$ = (s,p=document)=>[...p.querySelectorAll(s)];
const DB = {
  get(k,def){ try{const v=localStorage.getItem('wt_'+k);return v?JSON.parse(v):def;}catch(e){return def;} },
  set(k,v){ localStorage.setItem('wt_'+k,JSON.stringify(v)); }
};
const fmtMoney = n => '¥'+Number(n||0).toLocaleString('zh-CN');
const pad = n => (n<10?'0':'')+n;
const ymd = d => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const now = ()=>new Date();
const toast = (msg)=>{const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2200);};

/* ---------- SVG 图标 ---------- */
const ICONS={
  schedule:`<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
  payday:`<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="13" rx="2"></rect><circle cx="12" cy="12.5" r="2.5"></circle><path d="M6 9v0M18 9v0M12 6v1"></path></svg>`,
  clock:`<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
  edit:`<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
  tag:`<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>`,
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
    if(p==='payday') renderPayday();
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
   1. 班表（完整保留团队版）
   ===================================================================== */
const SCH_KEY='schedule_v1';
const PROJECTS=['新花','老花','芝麻','安全','借呗','应用','高阶账户'];
let sched = DB.get(SCH_KEY,{});
let viewY, viewM, selKey;

function saveSched(){DB.set(SCH_KEY,sched);}
function hourLabel(h){return pad(h)+':00';}

function renderCalendar(){
  const today=now();
  if(viewY===undefined){viewY=today.getFullYear();viewM=today.getMonth();}
  const first=new Date(viewY,viewM,1);
  const startDow=(first.getDay()+6)%7;
  const daysInMo=new Date(viewY,viewM+1,0).getDate();
  const prevDays=new Date(viewY,viewM,0).getDate();
  $('#calMon').textContent=viewY+'年'+(viewM+1)+'月';
  const dows=['一','二','三','四','五','六','日'];
  let html=dows.map(d=>`<div class="cal-dow">${d}</div>`).join('');
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

let editingKey=null;
function renderSlots(key){
  const [Y,M,D]=key.split('-').map(Number);
  const day=sched[key]||{};
  const hours=Object.keys(day).map(Number).sort((a,b)=>a-b);
  $('#selDateTitle').innerHTML=`${Y}年${M}月${D}日 · <span style="color:var(--gold-deep)">${hours.length?hours.length+'个班次':'暂无班次'}</span>`;
  $('#selEditBtn').textContent = editingKey===key ? '完成排班' : '＋ 排班';
  $('#selEditBtn').onclick=()=>{
    if(editingKey===key){editingKey=null;}
    else{editingKey=key;}
    renderSlots(key);
  };
  // 复制按钮：当天有班次才显示
  const copyBtn=$('#copyDayBtn');
  if(hours.length>0){
    copyBtn.style.display='';
    copyBtn.onclick=()=>copyDay(key,Y,M,D);
  } else {
    copyBtn.style.display='none';
  }
  // 粘贴按钮：剪贴板有已复制的班次才显示
  const pasteBtn=$('#pasteDayBtn');
  if(clipboard && clipboard.shifts.length){
    pasteBtn.style.display='';
    pasteBtn.onclick=()=>pasteDay(key,Y,M,D);
  } else {
    pasteBtn.style.display='none';
  }
  const wrap=$('#slotList');
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
  if(hours.length===0){
    wrap.innerHTML=`<div class="empty-tip">这一天还没排班<br><span style="font-size:13px;">点右上角「＋ 排班」开始安排，或点「📥 粘贴」套用复制的班次</span></div>`;
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
function deleteShift(key,h){
  if(sched[key]&&sched[key][h]){
    const proj=sched[key][h].p;
    delete sched[key][h];
    if(!Object.keys(sched[key]).length)delete sched[key];
    saveSched();
    const [Y,M,D]=key.split('-').map(Number);
    const aid=Y+'-'+M+'-'+D+'-'+h;
    alarms=alarms.filter(a=>a.id!==aid);saveAlarms();
    renderCalendar();renderSlots(key);toast('已删除「'+hourLabel(h)+' '+proj+'」班次');
  }
}

/* ===== 复制 / 粘贴某天班表 ===== */
// clipboard: {dateLabel, shifts:[{h, p}]}
let clipboard = DB.get('clipboard_v1', null);
function humanDayLabel(M,D){ return `${M}月${D}日`; }
function copyDay(key,Y,M,D){
  const day=sched[key]||{};
  const hours=Object.keys(day).map(Number).sort((a,b)=>a-b);
  if(!hours.length){toast('这一天没有班次可复制');return;}
  const shifts=hours.map(h=>({h, p:day[h].p}));
  clipboard={dateLabel:humanDayLabel(M,D), shifts};
  DB.set('clipboard_v1',clipboard);
  // 生成人读文本：如 【7月29日】11:00 老花 / 12:00 新花
  const text=`【${humanDayLabel(M,D)}】`+shifts.map(s=>`${hourLabel(s.h)} ${s.p}`).join(' / ');
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(
      ()=>toast('已复制可分享文本：'+text),
      ()=>toast('已复制（本应用内可用）：'+text)
    );
  } else {
    toast('已复制：'+text);
  }
  renderSlots(key);
}
function pasteDay(key,Y,M,D){
  if(!clipboard||!clipboard.shifts.length){toast('没有可粘贴的班次');return;}
  const src=clipboard;
  const exist=sched[key]?Object.keys(sched[key]).length:0;
  const doPaste=(merge)=>{
    sched[key]=sched[key]||{};
    if(!merge) sched[key]={};
    src.shifts.forEach(s=>{
      sched[key][s.h]={p:s.p,t:Date.now()};
      setAlarm(Y,M,D,s.h,s.p);
    });
    saveSched();
    renderCalendar();renderSlots(key);
    toast(`已粘贴 ${src.shifts.length} 个班次到 ${humanDayLabel(M,D)}（原${src.dateLabel}的安排）`);
  };
  if(exist>0){
    openModal(`<h3>📥 粘贴班次</h3>
      <div class="mdesc">把【${src.dateLabel}】的 ${src.shifts.length} 个班次套用到 ${humanDayLabel(M,D)}</div>
      <div class="opt-grid" id="pm">
        <div class="opt" data-m="merge">合并：保留原有班次</div>
        <div class="opt sel" data-m="replace">覆盖：替换当天全部</div>
      </div>
      <div class="row"><button class="btn" id="doPaste">确认粘贴</button></div>`);
    let mode='replace';
    $$('#pm .opt').forEach(o=>o.onclick=()=>{mode=o.dataset.m;$$('#pm .opt').forEach(x=>x.classList.remove('sel'));o.classList.add('sel');});
    $('#doPaste').onclick=()=>{closeModal();doPaste(mode==='merge');};
  } else {
    doPaste(false);
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
let alarms=DB.get(ALARM_KEY,[]);
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
function startRing(){
  stopRing();
  const beep=()=>{
    try{
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)return;
      ringCtx=new AC();
      [0,0.35].forEach((off,i)=>{
        const o=ringCtx.createOscillator(),g=ringCtx.createGain();
        o.connect(g);g.connect(ringCtx.destination);
        o.type='sine';
        o.frequency.value=i===0?988:1319;
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
  $('#alarmMsg').textContent=msg;
  $('#alarmAlert').classList.add('show');
  startRing();
  try{
    if('Notification' in window && Notification.permission==='granted'){
      new Notification('奶茶炸洋芋 · 上班提醒',{body:msg});
    }
  }catch(e){}
  try{ if(navigator.vibrate) navigator.vibrate([400,200,400,200,400]); }catch(e){}
}
function closeAlarm(){
  stopRing();
  $('#alarmAlert').classList.remove('show');
  $('#alarmDot').classList.remove('show');
}
$('#alarmClose').onclick=()=>closeAlarm();
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
   2. 发薪日（智能工作日计算）
   ===================================================================== */
let curPayYear = now().getFullYear();

function buildYearOptions(){
  const sel=$('#payYearSel');
  const y=now().getFullYear();
  let html='';
  for(let i=y-1;i<=y+1;i++) html+=`<option value="${i}" ${i===curPayYear?'selected':''}>${i} 年</option>`;
  sel.innerHTML=html;
}
$('#payYearSel').onchange=e=>{curPayYear=Number(e.target.value);renderPayday();};

async function renderPayday(){
  buildYearOptions();
  const status=$('#payStatus'), text=$('#payStatusText');
  status.className='pay-status';
  text.textContent='正在获取法定节假日…';
  try{
    await Holiday.ensureYear(curPayYear);
    // 相邻年也确保（上月/跨月顺延）
    await Holiday.ensureYear(curPayYear-1);
    const data=Holiday.getCache()[curPayYear];
    if(data && data.days){
      status.classList.add('ok');
      text.textContent=`✓ 已加载 ${curPayYear} 年国家法定节假日（含调休补班）`;
    }else{
      status.classList.add('warn');
      text.textContent='⚠ 节假日数据获取失败，已用「周末双休」近似计算（不含调休）';
    }
  }catch(e){
    status.classList.add('warn');
    text.textContent='⚠ 网络异常，正在使用本地缓存/近似计算';
  }
  let pay;
  try{
    pay=await Holiday.computePaydays(curPayYear);
  }catch(e){
    toast('发薪日计算失败');
    return;
  }
  renderPayTable(pay);
  renderPaySummary(pay);
}

const WEEK=['周日','周一','周二','周三','周四','周五','周六'];
function fmtDate(d){
  if(!d) return '—';
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function renderPayTable(pay){
  const body=$('#payBody');
  const today=now();
  let html='';
  for(let mo=1;mo<=12;mo++){
    const key=curPayYear+'-'+pad(mo);
    const pd=pay[key];
    if(!pd) continue;
    // 第一次：发上月15~月底
    const prevM = mo===1?12:(mo-1);
    const prevY = mo===1?curPayYear-1:curPayYear;
    const prevLabel = `${prevY}年${prevM}月15日~${prevM}月底`;
    // 第二次：发本月1~15
    const curLabel = `${curPayYear}年${mo}月1日~15日`;
    html+=rowOf(pd.first10, prevLabel, today);
    html+=rowOf(pd.second10, curLabel, today);
  }
  body.innerHTML=html;
}
function rowOf(date, scope, today){
  if(!date) return `<tr><td class="pay-date">—</td><td>—</td><td class="pay-scope">${scope}</td><td><span class="pay-badge">未算出</span></td></tr>`;
  const wd=WEEK[date.getDay()];
  const diff=Math.ceil((date.getTime()-today.getTime())/86400000);
  let badge='', cls='';
  if(diff<0){ badge='已发放'; }
  else if(diff===0){ badge='今天'; cls='upcoming'; }
  else if(diff<=7){ badge=diff+'天后'; cls='upcoming'; }
  else { badge=diff+'天后'; }
  return `<tr>
    <td class="pay-date">${fmtDate(date)}</td>
    <td>${wd}</td>
    <td class="pay-scope">${scope}</td>
    <td><span class="pay-badge ${cls}">${badge}</span></td>
  </tr>`;
}
function renderPaySummary(pay){
  const today=now();
  // 找下一次发薪（first10 或 second10 中 >= 今天的最近一个）
  let next=null, nextScope='';
  const list=[];
  for(let mo=1;mo<=12;mo++){
    const pd=pay[curPayYear+'-'+pad(mo)];
    if(!pd) continue;
    const prevM = mo===1?12:(mo-1);
    const prevY = mo===1?curPayYear-1:curPayYear;
    if(pd.first10) list.push({d:pd.first10, s:`发放 ${prevY}年${prevM}月15日~${prevM}月底 薪资`});
    if(pd.second10) list.push({d:pd.second10, s:`发放 ${curPayYear}年${mo}月1日~15日 薪资`});
  }
  list.sort((a,b)=>a.d-b.d);
  for(const x of list){
    if(x.d>=today){ next=x; break; }
  }
  if(!next && list.length) next=list[list.length-1];
  if(next){
    $('#nextPayDate').textContent=fmtDate(next.d);
    $('#nextPayScope').textContent=next.s;
    const diff=Math.ceil((next.d.getTime()-today.getTime())/86400000);
    $('#nextPayIn').textContent = diff<0?'已发放':(diff===0?'就是今天':diff+' 天');
    $('#nextPayWeekday').textContent=WEEK[next.d.getDay()];
  }else{
    $('#nextPayDate').textContent='—';
    $('#nextPayScope').textContent='—';
    $('#nextPayIn').textContent='—';
    $('#nextPayWeekday').textContent='—';
  }
}
$('#refreshHoliday').onclick=async ()=>{
  toast('正在刷新节假日数据…');
  // 清掉该年缓存强制重拉
  try{
    await Holiday.fetchYear(curPayYear);
    await Holiday.ensureYear(curPayYear-1);
    await Holiday.ensureYear(curPayYear+1);
    renderPayday();
    toast('节假日已刷新');
  }catch(e){
    toast('刷新失败，请检查网络');
  }
};

/* =====================================================================
   初始化
   ===================================================================== */
renderIcons();
renderCalendar();
renderPayday();
alarmLoop();

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  });
}
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
  if(location.protocol==='file:') return '';
  return location.origin + location.pathname.replace(/[^/]*$/,'') + 'index.html';
}
$('#lanBtn').onclick=()=>{
  const url=currentAccessURL();
  let body;
  if(!url){
    body=`<div class="qr-box"><h3>📱 手机扫码打开</h3><div class="hint" style="text-align:left;">检测到你是直接双击打开的本机文件，手机扫不了。<br><br><b>正确姿势：</b><br>① 电脑上双击运行启动脚本<br>② 屏幕弹出二维码和网址<br>③ 手机连同一个 WiFi，扫二维码 → 打开 → 加到主屏幕</div></div>`;
  } else {
    let qrImg='';
    try{
      const qr=qrcode(0, 'M');
      qr.addData(url); qr.make();
      qrImg=`<img class="qr-img" src="${qr.createDataURL(8)}" alt="扫码">`;
    }catch(e){ qrImg='<div class="hint">二维码生成失败，请手动复制下方网址</div>'; }
    body=`<div class="qr-box"><h3>📱 手机扫码打开</h3><div class="mdesc">手机连<b>同一个 WiFi</b>，扫下方二维码即可打开工作台</div>${qrImg}<div class="url-line" id="lanUrl">${url}</div><button class="btn ghost sm copy-btn" id="copyUrl">复制网址</button><div class="hint">打开后点浏览器「分享 / 添加到主屏幕」，桌面就出现图标 🧋</div></div>`;
  }
  openModal(body);
  const cp=$('#copyUrl');
  if(cp) cp.onclick=()=>{
    const u=$('#lanUrl').textContent;
    navigator.clipboard?.writeText(u).then(()=>toast('网址已复制')).catch(()=>toast('复制失败，请手动选'));
  };
};
