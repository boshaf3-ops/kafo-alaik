import re, json, hashlib, os, time
K='/home/claude/kafo/'
head=open(K+'a_head.html').read()
# fonts: replace the Google Fonts links for the Arabic faces with local ones; keep only the optional pixel font from the CDN
head=re.sub(r'<title>.*?</title>\n','',head,count=1)
head=re.sub(r'<link rel="preconnect"[^\n]*\n<link rel="preconnect"[^\n]*\n<link href="https://fonts.googleapis.com[^\n]*\n','',head,count=1)
assert 'fonts.googleapis' not in head
scripts=''.join(open(K+f).read()+'\n' for f in ['b_core.js','b2_outfits.js','b3_chars.js','c_maps.js','k_worlds.js','d_cert.js','f_anim.js','g_wear.js','h_badges.js','i_chest.js','j_move.js','l_ambient.js','e_app.js'])
fontcss='''@font-face{font-family:Tajawal;font-weight:400 500;font-style:normal;font-display:swap;src:url(fonts/Tajawal-Regular.woff) format("woff")}
@font-face{font-family:Tajawal;font-weight:600 700;font-style:normal;font-display:swap;src:url(fonts/Tajawal-Bold.woff) format("woff")}
@font-face{font-family:Tajawal;font-weight:800 900;font-style:normal;font-display:swap;src:url(fonts/Tajawal-Black.woff) format("woff")}
@font-face{font-family:Lalezar;font-weight:400;font-style:normal;font-display:swap;src:url(fonts/Lalezar-Regular.woff) format("woff")}
'''
DESC='«كفو عليك»: تطبيق عائلي يحفّز الأبناء على السلوك الطيب. كل سلوك إيجابي يرفع شخصيتهم خطوة في خريطة مغامرة بمسار خاص، ويحصلون على ملابس وشارات وشهادة جاهزة للطباعة.'
page=f'''<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>كفو عليك</title>
<meta name="description" content="{DESC}">
<meta name="theme-color" content="#dcefee" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0d1b23" media="(prefers-color-scheme: dark)">
<meta name="color-scheme" content="light dark">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="كفو عليك">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta property="og:type" content="website">
<meta property="og:locale" content="ar_AR">
<meta property="og:title" content="كفو عليك">
<meta property="og:description" content="كل سلوك طيب خطوة جديدة نحو القمة. تطبيق عائلي لتحفيز الأبناء بخرائط مغامرة وشارات وشهادات.">
<meta property="og:image" content="https://boshaf3-ops.github.io/kafo-alaik/og.png">
<meta property="og:url" content="https://boshaf3-ops.github.io/kafo-alaik/">
<meta name="twitter:card" content="summary_large_image">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="icons/favicon-16.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="preload" href="fonts/Tajawal-Regular.woff" as="font" type="font/woff" crossorigin>
<link rel="preload" href="fonts/Lalezar-Regular.woff" as="font" type="font/woff" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<style>{fontcss}</style>
{head}
<script>
{scripts}
</script>
<noscript><p style="font:16px sans-serif;padding:24px;text-align:center">يحتاج «كفو عليك» إلى تفعيل جافاسكربت ليعمل.</p></noscript>
<script>
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){{
  const had=!!navigator.serviceWorker.controller;let rl=false;
  /* a new version took over: reload once when nothing is open (all data lives in the device storage) */
  navigator.serviceWorker.addEventListener('controllerchange',()=>{{if(!had||rl)return;const go=()=>{{if(typeof sheetOpen!=='undefined'&&sheetOpen){{setTimeout(go,3000);return;}}rl=true;location.reload();}};go();}});
  window.addEventListener('load',()=>{{navigator.serviceWorker.register('sw.js').then(r=>{{r.update().catch(()=>{{}});document.addEventListener('visibilitychange',()=>{{if(!document.hidden)r.update().catch(()=>{{}});}});}}).catch(()=>{{}});}});
}}
</script>
</body>
</html>
'''
os.makedirs('dist',exist_ok=True)
open('dist/index.html','w').write(page)
VER=hashlib.md5(page.encode()).hexdigest()[:8]
manifest={
 "name":"كفو عليك","short_name":"كفو عليك","description":"تطبيق عائلي لتحفيز الأبناء على السلوك الطيب بخرائط مغامرة وشارات وشهادات.",
 "lang":"ar","dir":"rtl","id":"./","start_url":"./","scope":"./","display":"standalone","orientation":"any",
 "background_color":"#dcefee","theme_color":"#0a8f68","categories":["education","kids","lifestyle"],
 "icons":[{"src":"icons/icon-192.png","sizes":"192x192","type":"image/png","purpose":"any"},
          {"src":"icons/icon-512.png","sizes":"512x512","type":"image/png","purpose":"any"},
          {"src":"icons/maskable-512.png","sizes":"512x512","type":"image/png","purpose":"maskable"}]}
open('dist/manifest.webmanifest','w').write(json.dumps(manifest,ensure_ascii=False,indent=2))
sw=f'''/* كفو عليك: خدمة العمل دون إنترنت. غيّر رقم النسخة عند كل تحديث ليصل الجهاز للنسخة الجديدة. */
const VERSION='kafo-{VER}';
const CORE=['./','index.html','manifest.webmanifest','fonts/Tajawal-Regular.woff','fonts/Tajawal-Bold.woff','fonts/Tajawal-Black.woff','fonts/Lalezar-Regular.woff','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png','icons/favicon-32.png'];
self.addEventListener('install',e=>{{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));}});
self.addEventListener('activate',e=>{{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('kafo-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));}});
self.addEventListener('fetch',e=>{{
  const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  // the page itself: network first so a new version arrives, cache when offline
  if(r.mode==='navigate'){{e.respondWith(fetch(r,{{cache:'no-cache'}}).then(res=>{{const cp=res.clone();caches.open(VERSION).then(c=>c.put('index.html',cp));return res;}}).catch(()=>caches.match('index.html')));return;}}
  // same-origin files and the optional pixel font: cache first, fill the cache on first use
  if(u.origin===location.origin||u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){{
    e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{{if(res&&(res.ok||res.type==='opaque')){{const cp=res.clone();caches.open(VERSION).then(c=>c.put(r,cp));}}return res;}}).catch(()=>hit)));}}
}});
'''
open('dist/sw.js','w').write(sw)
open('dist/robots.txt','w').write('User-agent: *\nAllow: /\n')
open('dist/_headers','w').write('''/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(), microphone=(), geolocation=()
/sw.js
  Cache-Control: no-cache
/index.html
  Cache-Control: no-cache
/manifest.webmanifest
  Content-Type: application/manifest+json
/fonts/*
  Cache-Control: public, max-age=31536000, immutable
/icons/*
  Cache-Control: public, max-age=604800
''')
print('version',VER,len(page)//1024,'KB')
