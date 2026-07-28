/* 团队工作台 service worker：离线缓存 */
const CACHE='wt-cache-v1';
const ASSETS=['./','./index.html','./app.js','./holiday.js','./manifest.webmanifest','./iconflat.png','./iconflat-512.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{
      const cp=resp.clone();
      caches.open(CACHE).then(c=>c.put(e.request,cp)).catch(()=>{});
      return resp;
    }).catch(()=>caches.match('./index.html')))
  );
});
