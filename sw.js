/* كفو عليك: خدمة العمل دون إنترنت. غيّر رقم النسخة عند كل تحديث ليصل الجهاز للنسخة الجديدة. */
const VERSION='kafo-b1b7f255';
const CORE=['./','index.html','manifest.webmanifest','fonts/Tajawal-Regular.woff','fonts/Tajawal-Bold.woff','fonts/Tajawal-Black.woff','fonts/Lalezar-Regular.woff','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png','icons/favicon-32.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('kafo-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  // the page itself: network first so a new version arrives, cache when offline
  if(r.mode==='navigate'){e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(VERSION).then(c=>c.put('index.html',cp));return res;}).catch(()=>caches.match('index.html')));return;}
  // same-origin files and the optional pixel font: cache first, fill the cache on first use
  if(u.origin===location.origin||u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(VERSION).then(c=>c.put(r,cp));}return res;}).catch(()=>hit)));}
});
