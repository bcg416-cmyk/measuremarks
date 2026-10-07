const CACHE='measuremarks-v07-dev-3';
const CORE=['/','/index.html','/assets/css/site.css?v=0.7-dev.3','/assets/js/site.js?v=0.7-dev.3'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).catch(()=>{}))});
self.addEventListener('activate',e=>{e.waitUntil(Promise.all([
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),
  self.clients.claim()
]))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(
    fetch(e.request,{cache:'no-store'}).then(resp=>{
      if(resp&&resp.ok){const copy=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{})}
      return resp;
    }).catch(async()=>{
      const cached=await caches.match(e.request);
      if(cached)return cached;
      if(e.request.mode==='navigate')return caches.match('/index.html');
      return Response.error();
    })
  );
});