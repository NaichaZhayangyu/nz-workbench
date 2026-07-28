/* =====================================================================
   节假日 + 工作日计算模块（奶茶炸洋芋 · 团队工作台）
   - 主数据源：NateScarlet/holiday-cn（GitHub raw，含法定节假日 + 调休补班）
   - 兜底：localStorage 缓存 + 用户手动补充
   - 计算规则：
       · 工作日 = 周一到周五，且不是法定放假日，或是调休补班日
       · 本月第 10 个工作日 → 发 上月15日~上月月底 薪资
       · 本月16日起第 10 个工作日 → 发 本月1日~15日 薪资
   ===================================================================== */
const Holiday = (function(){
  const SRC_BASE = 'https://raw.githubusercontent.com/NateScarlet/holiday-cn/master/';
  const CACHE_KEY = 'wt_holiday_cache_v1';   // { '2026': {...}, ... }
  const MANUAL_KEY = 'wt_holiday_manual_v1';  // 用户手动覆盖 {"2026-01-01":true/false}

  // 内存缓存
  let cache = loadCache();
  let manual = loadManual();

  function loadCache(){
    try{ return JSON.parse(localStorage.getItem(CACHE_KEY)||'{}'); }catch(e){ return {}; }
  }
  function saveCache(){ try{ localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); }catch(e){} }
  function loadManual(){
    try{ return JSON.parse(localStorage.getItem(MANUAL_KEY)||'{}'); }catch(e){ return {}; }
  }
  function saveManual(){ try{ localStorage.setItem(MANUAL_KEY, JSON.stringify(manual)); }catch(e){} }

  // 拉取某一年（优先缓存→网络→失败）
  async function fetchYear(year){
    if(cache[year] && cache[year].days) return cache[year];
    try{
      const res = await fetch(SRC_BASE + year + '.json', {cache:'no-store'});
      if(!res.ok) throw new Error('HTTP '+res.status);
      const data = await res.json();
      cache[year] = data; saveCache();
      return data;
    }catch(e){
      // 网络失败，若缓存有旧数据也返回
      if(cache[year]) return cache[year];
      throw e;
    }
  }

  // 判断某天是否工作日（周末 + 放假日=非工作日；补班日=工作日）
  // 返回 true=工作日
  function isWorkday(date){
    const y=date.getFullYear(), m=date.getMonth()+1, d=date.getDate();
    const key = y+'-'+pad(m)+'-'+pad(d);
    // 手动覆盖优先
    if(key in manual) return manual[key];
    const dow = date.getDay(); // 0=周日 6=周六
    const isWeekend = (dow===0 || dow===6);
    const info = getDayInfo(y, m, d);
    if(info){
      // info.isOffDay=true 放假日→非工作日；false 补班→工作日
      return !info.isOffDay;
    }
    // 无特殊标注：周末非工作日，平日工作日
    return !isWeekend;
  }

  // 从缓存取某天信息
  function getDayInfo(y,m,d){
    const yr = cache[y];
    if(!yr || !yr.days) return null;
    const key = y+'-'+pad(m)+'-'+pad(d);
    const found = yr.days.find(x=>x.date===key);
    return found || null;
  }

  // 手动设置某天类型（type: 'work' | 'off' | null 清除）
  function setManual(key, type){
    if(type===null) delete manual[key];
    else manual[key] = (type==='work');
    saveManual();
  }
  function getManual(){ return manual; }

  // 计算某年所有"第N个工作日"的日期
  // 返回 Map: 'YYYY-MM' -> { first10: Date(发上月15~底), second10: Date(发本月1~15) }
  async function computePaydays(year){
    // 确保该年及相邻年的数据（上月可能涉及上一年12月）
    await ensureYear(year);
    await ensureYear(year-1);
    await ensureYear(year+1);

    const result = {};
    for(let mo=1; mo<=12; mo++){
      // 第一次发薪：本月第10个工作日
      const first10 = nthWorkdayOfMonth(year, mo, 10);
      // 第二次发薪：本月16日起第10个工作日
      const second10 = nthWorkdayFrom(year, mo, 16, 10);
      result[year+'-'+pad(mo)] = {
        first10: first10,    // 发 上月15~月底
        second10: second10,  // 发 本月1~15
      };
    }
    return result;
  }

  function ensureYear(y){
    if(cache[y] && cache[y].days) return Promise.resolve(cache[y]);
    return fetchYear(y).catch(()=>null);
  }

  // 某月第 n 个工作日（从1号开始数）
  function nthWorkdayOfMonth(y, m, n){
    let count=0;
    const days = new Date(y, m, 0).getDate();
    for(let d=1; d<=days; d++){
      const dt = new Date(y, m-1, d);
      if(isWorkday(dt)){
        count++;
        if(count===n) return dt;
      }
    }
    return null;
  }

  // 从某月指定起始日(day)开始数第 n 个工作日
  function nthWorkdayFrom(y, m, startDay, n){
    let count=0;
    const days = new Date(y, m, 0).getDate();
    for(let d=startDay; d<=days; d++){
      const dt = new Date(y, m-1, d);
      if(isWorkday(dt)){
        count++;
        if(count===n) return dt;
      }
    }
    // 若本月16号起不够10个工作日，顺延到下月（极端情况）
    if(n-count>0){
      return nthWorkdayOfMonthSpan(y, m+1, n-count);
    }
    return null;
  }
  // 跨月继续数（从下月1号起）
  function nthWorkdayOfMonthSpan(y, m, n){
    let yy=y, mm=m;
    if(mm>12){mm=1;yy++;}
    let count=0;
    const days = new Date(yy, mm, 0).getDate();
    for(let d=1; d<=days; d++){
      const dt=new Date(yy, mm-1, d);
      if(isWorkday(dt)){ count++; if(count===n) return dt; }
    }
    return null;
  }

  function pad(n){return (n<10?'0':'')+n;}

  // 当前数据状态
  function yearLoaded(y){ return !!(cache[y] && cache[y].days); }

  return {
    fetchYear, isWorkday, computePaydays, setManual, getManual,
    yearLoaded, ensureYear, pad,
    getCache: ()=>cache,
    SRC_BASE
  };
})();
