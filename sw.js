/* 奶茶炸洋芋 · 离线缓存 Service Worker
   作用：把工作台所有文件缓存到手机，加到主屏后断网也能用 */
const CACHE='nz-workbench-v1';
const FILES=[
  './',
  './index.html',
  './app.js',
  './assets/icon-96.png',
  './assets/icon-144.png',
  './assets/icon-192.png',
  './assets/icon-512.png'
];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{
      const cp=resp.clone();
      caches.open(CACHE).then(c=>c.put(e.request,cp));
      return resp;
    }).catch(()=>caches.match('./index.html')))
  );
});
