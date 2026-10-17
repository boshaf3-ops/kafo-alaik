/* كفو عليك: خدمة العمل دون إنترنت. غيّر رقم النسخة عند كل تحديث ليصل الجهاز للنسخة الجديدة. */
const VERSION='kafo-01cc37d3';
const CORE=['./','index.html','manifest.webmanifest','vendor/supabase.js','fonts/Tajawal-Regular.woff','fonts/Tajawal-Bold.woff','fonts/Tajawal-Black.woff','fonts/Lalezar-Regular.woff','fonts/Handjet-800.woff','fonts/PressStart2P-latin.woff2','icons/icon-192.png?v=2','icons/icon-512.png?v=2','icons/apple-touch-icon.png?v=2','icons/favicon-32.png?v=2','icons/eshraqat.png','icons/eshraqat-banner.jpg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('kafo-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  // the page itself: network first so a new version arrives, cache when offline
  if(r.mode==='navigate'){const app=u.pathname.endsWith('/')||u.pathname.endsWith('/index.html');
    e.respondWith(fetch(r,{cache:'no-cache'}).then(res=>{if(app&&res.ok){const cp=res.clone();caches.open(VERSION).then(c=>c.put('index.html',cp));}return res;}).catch(()=>(app?caches.match('index.html'):caches.match(r).then(h=>h||caches.match('index.html')))));return;}
  // same-origin files: cache first, fill the cache on first use
  if(u.origin===location.origin){
    e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(VERSION).then(c=>c.put(r,cp));}return res;}).catch(()=>hit)));}
});
