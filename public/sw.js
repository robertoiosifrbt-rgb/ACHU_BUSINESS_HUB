const CACHE='achu-business-hub-v4.2.0-4x';
const BASE='/ACHU_BUSINESS_HUB/';
const SHELL=[BASE,BASE+'manifest.webmanifest',BASE+'version.json',BASE+'icons/icon-192.png',BASE+'icons/icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL).catch(()=>{})));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('achu-business-hub-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();if(event.data?.type==='CLEAR_CACHES')event.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k))))) });
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 const url=new URL(req.url);if(url.origin!==location.origin||!url.pathname.startsWith(BASE))return;
 if(req.mode==='navigate'||url.pathname.endsWith('/version.json')||url.pathname.endsWith('/sw.js')){event.respondWith(fetch(req,{cache:'no-store'}).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));return res}).catch(()=>caches.match(req).then(r=>r||caches.match(BASE))));return}
 event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return res})))
});
