const CACHE='measuremarks-v06-dev-4';
const CORE=['/','/index.html','/assets/css/site.css?v=0.6-dev.4','/assets/js/site.js?v=0.6-dev.4'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).catch(()=>{}))});
self.addEventListener('activate',e=>{e.waitUntil(Promise.all([
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),
  self.clients.claim()
]))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(
    fetch(e.request,{cache:'no-store'}).then(resp=>{
      if(resp && resp.ok){
        const copy=resp.clone();
        caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});
      }
      return resp;
    }).catch(()=>caches.match(e.request).then(r=>r||caches.match('/index.html')))
  );
});