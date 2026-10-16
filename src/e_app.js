/* ================= state + storage ================= */
const LS='kafo.v1';
const DEF_CFG=()=>({mapId:'peak',goal:100,period:null,pos:[],neg:[],rewards:{25:'',50:'',75:'',100:''},sound:true,round:1,famName:''});
let S={cfg:DEF_CFG(),kids:[],fams:{},inv:{}};
let db=null,view='home',ready=false,sheetOpen=false,sheetCtx=null,draft=null,certBlob=null,pendingWrites=0,dirty=false,needResync=false;
/* role: 'local' (no database, this device only), 'owner' (the head of the challenge), 'guest' (another family that joined with a code) */
let me={role:'local',uid:null};
const isGuest=()=>me.role==='guest';
const canCtl=k=>!isGuest()||(!!k.fam&&k.fam===me.uid);
const J=o=>JSON.parse(JSON.stringify(o));
const FAMC=['#ffd23f','#ff7eb6','#43c6e8','#58c15a','#ff9a2e','#b28cff','#ff6b6b','#7fe0c8'];
const famList=()=>[{uid:''}].concat(Object.values(S.fams).sort((a,b)=>a.ts-b.ts));
const famName=uid=>uid?((S.fams[uid]&&S.fams[uid].name)||'عائلة'):(S.cfg.famName||'العائلة الأولى');
const famColor=uid=>FAMC[Math.max(0,famList().findIndex(f=>f.uid===(uid||'')))%FAMC.length];
const myFam=()=>isGuest()?(S.fams[me.uid]||null):null;
const behFor=k=>(k.fam&&S.fams[k.fam])?S.fams[k.fam].cfg:S.cfg;
const BH=()=>isGuest()?((myFam()||{}).cfg||{pos:[],neg:[]}):S.cfg;
const soundOn=()=>isGuest()?(function(){try{return localStorage.getItem('kafo.snd')!=='0';}catch(e){return true;}})():S.cfg.sound;

/* ---- volumes (kept on this device): sound effects and background ambience; 60 is the original level, 100 is louder, 0 is silent ---- */
function volGet(){const d={fx:60,bg:60};try{const o=JSON.parse(localStorage.getItem('kafo.vol')||'null');if(o){if(isFinite(o.fx))d.fx=clamp(Math.round(+o.fx),0,100);if(isFinite(o.bg))d.bg=clamp(Math.round(+o.bg),0,100);}}catch(e){}return d;}
let VOL=volGet();
const volFx=()=>VOL.fx/60,volBg=()=>VOL.bg/60;
function volSave(){try{localStorage.setItem('kafo.vol',JSON.stringify(VOL));}catch(e){}}
function volApply(){try{if(AMB.master)AMB.master.gain.value=.22*volBg();}catch(e){}}

function normAv(a){const o=Object.assign({sk:1,st:0,hc:0,sh:0,ss:0,ps:0,pc:0},a||{});if(o.g!=='m'&&o.g!=='f')o.g=(o.st===1||o.st===4)?'f':'m';if(!HEADS[o.st]||HEADS[o.st].g!==o.g)o.st=defHead(o.g);if(typeof o.hr!=='string')o.hr='';return o;}
function normKid(k){return{id:k.id,fam:k.fam||'',name:k.name||'',age:k.age==null?'':k.age,photo:k.photo||null,av:normAv(k.av),hs:+k.hs||0,pts:+k.pts||0,log:Array.isArray(k.log)?k.log:[],certs:Array.isArray(k.certs)?k.certs:[],order:+k.order||0,
    tier:+k.tier||0,tk:k.tk||'',wear:(k.wear&&typeof k.wear==='object')?k.wear:{},badges:(k.badges&&typeof k.badges==='object')?k.badges:{},cnt:Object.assign({pos:0,neg:0},k.cnt||{}),days:(k.days&&typeof k.days==='object')?k.days:{},fork:(k.fork&&typeof k.fork==='object')?k.fork:null,sad:!!k.sad,ck:(k.ck&&typeof k.ck==='object')?k.ck:null};}
function normFam(uid,o){return{uid,name:o.name||'عائلة',code:o.code||'',expected:+o.expected||0,ts:+o.ts||0,cfg:{pos:Array.isArray(o.cfg&&o.cfg.pos)?o.cfg.pos:[],neg:Array.isArray(o.cfg&&o.cfg.neg)?o.cfg.neg:[]}};}
const milestone=L=>L>=75?75:L>=50?50:L>=25?25:0;
const goal=()=>clamp(Math.round(+S.cfg.goal)||100,10,5000);
const lvl=p=>Math.min(100,Math.floor(p*100/goal()));
const curRound=()=>S.cfg.round||1;
const isDone=k=>k.certs.some(c=>c.round===curRound());
const kidById=id=>S.kids.find(k=>k.id===id);
const mapOf=()=>MAPS[S.cfg.mapId]||MAPS.peak;
/* ---- the fork on routes that have one (the volcano): the child chooses the long road or a bridge shortcut ---- */
const FORK_NEGS=3;
const forkOf=k=>{const f=k.fork;return f&&f.tk===tierKey()?f:null;};
const forkSt=k=>{const m=mapOf();if(!m.fork)return'';const f=forkOf(k);return f?(f.st||''):'';};
const needsFork=k=>{const m=mapOf();return !!m.fork&&lvl(k.pts)>=m.fork.a&&(forkSt(k)===''||forkSt(k)==='ask');};
/* the level at which a child is drawn: a child waiting at the fork stands at the fork */
const dispTarget=k=>{const m=mapOf(),L=lvl(k.pts);return needsFork(k)?m.fork.a:L;};
const kidPos=(k,l)=>{const m=mapOf();return levelPos(curScene.path,l,!!(m.fork&&forkSt(k)==='alt'));};
const sortKids=()=>{const idx=uid=>famList().findIndex(f=>f.uid===(uid||''));S.kids.sort((a,b)=>idx(a.fam)-idx(b.fam)||a.order-b.order);};
const myKids=()=>S.kids.filter(canCtl);

function todayStr(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function dayNum(s){const p=s.split('-');return Date.UTC(+p[0],+p[1]-1,+p[2])/86400000;}
function daysTxt(n){return n===1?'يوم واحد':n===2?'يومان':n<=10?n+' أيام':n+' يومًا';}
function periodState(){const p=S.cfg.period;if(!p||!p.start||!p.end)return{k:'none'};const t=todayStr();if(t<p.start)return{k:'before',days:dayNum(p.start)-dayNum(t)};if(t>p.end)return{k:'after'};return{k:'in',left:dayNum(p.end)-dayNum(t)+1};}
const canAward=()=>{const k=periodState().k;return k==='none'||k==='in';};

async function initStore(){
  try{if(window.claude&&window.claude.use){const d=await window.claude.use('db');if(d){await d.doc('app/config').get();db=d;}}}catch(e){db=null;}
  if(db){
    me.role='owner';
    try{const u=await window.claude.use('user');if(u){me.uid=await u.id();me.role=(await u.isOwner())?'owner':'guest';if(me.role==='guest'&&!me.uid){db=null;me.role='local';}}}catch(e){}
  }
}
const kRef=k=>k.fam?db.doc('fam/'+k.fam).collection('kids').doc(k.id):db.doc('kids/'+k.id);
async function loadAll(){
  if(db){
    try{
      const cs=await db.doc('app/config').get();
      S.cfg=Object.assign(DEF_CFG(),cs.exists?J(cs.data()):{});S.cfg.rewards=Object.assign({25:'',50:'',75:'',100:''},S.cfg.rewards||{});
      const fs=await db.collection('fam').get();S.fams={};fs.docs.forEach(d=>{S.fams[d.id]=normFam(d.id,J(d.data()));});
      const ks=await db.collection('kids').get();S.kids=ks.docs.map(d=>normKid(Object.assign(J(d.data()),{id:d.id,fam:''})));
      for(const uid of Object.keys(S.fams)){const kk=await db.doc('fam/'+uid).collection('kids').get();kk.docs.forEach(d=>S.kids.push(normKid(Object.assign(J(d.data()),{id:d.id,fam:uid}))));}
      if(!isGuest()){const iv=await db.doc('app/inv').get();S.inv=iv.exists?J(iv.data().codes||{}):{};}
      sortKids();return;
    }catch(e){console.warn(e);toast('تعذّر قراءة البيانات المحفوظة');}
  }
  try{const raw=localStorage.getItem(LS);if(raw){const o=JSON.parse(raw);S.cfg=Object.assign(DEF_CFG(),o.cfg||{});S.cfg.rewards=Object.assign({25:'',50:'',75:'',100:''},S.cfg.rewards||{});S.kids=(o.kids||[]).map(normKid);}}catch(e){}
}
let wq=Promise.resolve();
function enqueue(fn){pendingWrites++;wq=wq.then(fn).catch(e=>{console.warn(e);toast(isGuest()?'ما تقدر تعدّل هذا، أو تعذّر الحفظ':'تعذّر الحفظ، حاول مرة أخرى');}).then(()=>{pendingWrites--;if(!pendingWrites&&needResync){needResync=false;resync();}});return wq;}
function persistLocal(){try{localStorage.setItem(LS,JSON.stringify({cfg:S.cfg,kids:S.kids}));}catch(e){toast('مساحة التخزين ممتلئة');}}
function persistCfg(){if(isGuest())return;if(db){const d=J(S.cfg);enqueue(()=>db.doc('app/config').set(d));}else persistLocal();}
function stripKid(k){const d=J(k);delete d.id;delete d.fam;return d;}
function persistKid(k){if(db){const d=stripKid(k);enqueue(()=>kRef(k).set(d));}else persistLocal();}
function persistRemove(k){if(db)enqueue(()=>kRef(k).delete());else persistLocal();}
function persistFam(f){if(!db)return;const d={name:f.name,code:f.code,expected:f.expected,ts:f.ts,cfg:J(f.cfg)};enqueue(()=>db.doc('fam/'+f.uid).set(d));}
function persistBH(){if(isGuest()){const f=myFam();if(f)persistFam(f);}else persistCfg();}
function persistInv(){if(db)enqueue(()=>db.doc('app/inv').set({codes:J(S.inv)}));}

/* ---------- live sync: everyone sees everyone's movements ---------- */
const famSubs={};let subs=[];
function unsubAll(){subs.forEach(u=>{try{u();}catch(e){}});subs=[];Object.keys(famSubs).forEach(k=>{try{famSubs[k]();}catch(e){}delete famSubs[k];});}
function subscribe(){
  unsubAll();if(!db)return;const er=e=>console.warn('sync',e);
  try{
    subs.push(db.doc('app/config').onSnapshot(s=>{if(pendingWrites){needResync=true;return;}if(s.metadata.hasPendingWrites||!s.exists)return;applyCfg(J(s.data()));},er));
    subs.push(db.collection('kids').onSnapshot(s=>{if(pendingWrites){needResync=true;return;}if(s.metadata.hasPendingWrites)return;applyKids('',s.docs);},er));
    subs.push(db.collection('fam').onSnapshot(s=>{if(pendingWrites){needResync=true;return;}if(s.metadata.hasPendingWrites)return;applyFams(s.docs);},er));
  }catch(e){er(e);}
  Object.keys(S.fams).forEach(subFam);
}
function subFam(uid){if(famSubs[uid]||!db)return;famSubs[uid]=db.doc('fam/'+uid).collection('kids').onSnapshot(s=>{if(pendingWrites){needResync=true;return;}if(s.metadata.hasPendingWrites)return;applyKids(uid,s.docs);},e=>console.warn('sync',e));}
async function resync(){
  if(!db)return;try{
    const cs=await db.doc('app/config').get();if(cs.exists)applyCfg(J(cs.data()));
    const fs=await db.collection('fam').get();applyFams(fs.docs);
    applyKids('',(await db.collection('kids').get()).docs);
    for(const uid of Object.keys(S.fams))applyKids(uid,(await db.doc('fam/'+uid).collection('kids').get()).docs);
  }catch(e){console.warn(e);}
}
function applyCfg(o){
  const n=Object.assign(DEF_CFG(),o);n.rewards=Object.assign({25:'',50:'',75:'',100:''},n.rewards||{});
  if(JSON.stringify(n)===JSON.stringify(S.cfg))return;
  const big=n.mapId!==S.cfg.mapId||n.round!==S.cfg.round||n.goal!==S.cfg.goal;S.cfg=n;syncUI(big);
}
function applyFams(docs){
  const seen=new Set();let changed=false;
  docs.forEach(d=>{seen.add(d.id);const n=normFam(d.id,J(d.data()));if(JSON.stringify(n)!==JSON.stringify(S.fams[d.id])){S.fams[d.id]=n;changed=true;}subFam(d.id);});
  Object.keys(S.fams).forEach(uid=>{if(!seen.has(uid)){delete S.fams[uid];if(famSubs[uid]){try{famSubs[uid]();}catch(e){}delete famSubs[uid];}S.kids=S.kids.filter(k=>k.fam!==uid);changed=true;}});
  if(changed){sortKids();syncUI(true);}
}
function applyKids(fam,docs){
  const inc=new Map(docs.map(d=>[d.id,normKid(Object.assign(J(d.data()),{id:d.id,fam}))]));let structural=false;const moved=[];let meta=false;
  S.kids=S.kids.filter(k=>{if(k.fam!==fam||inc.has(k.id))return true;structural=true;return false;});
  inc.forEach((nk,id)=>{const ok=S.kids.find(k=>k.id===id&&k.fam===fam);
    if(!ok){S.kids.push(nk);structural=true;return;}
    if(JSON.stringify(ok)===JSON.stringify(nk))return;
    const dp=nk.pts-ok.pts;Object.keys(ok).forEach(x=>delete ok[x]);Object.assign(ok,nk);if(dp)moved.push({k:ok,dp});else meta=true;});
  if(structural){sortKids();syncUI(true);return;}
  if(moved.length||meta)syncUI(false,moved);
}
/* repaint after a remote change, without disturbing whatever the person is doing */
function syncUI(full,moved){
  if(!ready||!$('#splash').classList.contains('gone'))return;
  if(sheetOpen){dirty=true;return;}
  if(view==='home'){
    if(full){closePop();renderHome();}
    else{S.kids.forEach(k=>{if(disp[k.id]!=null&&Math.abs(disp[k.id]-dispTarget(k))>.01&&!(moved||[]).some(o=>o.k===k))animateKid(k.id,dispTarget(k));});
      (moved||[]).forEach(o=>{const L=dispTarget(o.k);animateKid(o.k.id,L);floatText(o.k.id,(o.dp>0?'+':'')+o.dp,o.dp>0?'p':'n');if(o.dp>0)setTimeout(()=>burstAtKid(o.k.id,16),350);
        toast(o.k.name+(o.dp>0?' ارتفع ':' نزل ')+(o.dp>0?'+':'')+o.dp);});
      tone((moved&&moved[0]&&moved[0].dp<0)?SND.neg:SND.lvl);refreshHome();}
  }else if(view!=='round'||full)render();
}

/* ================= feedback: toast, sound, confetti ================= */
let toastT;
function toast(msg){const t=$('#toast');if(!msg){return;}t.innerHTML='<div>'+esc(msg)+'</div>';clearTimeout(toastT);toastT=setTimeout(()=>{t.innerHTML='';},3200);}
let ac=null;
function tone(seq){if(!soundOn()||VOL.fx<=0)return;try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();let t=ac.currentTime+.01;for(const n of seq){const o=ac.createOscillator(),g=ac.createGain();o.type=n[2]||'square';o.frequency.value=n[0];g.gain.setValueAtTime(Math.max(.0004,.05*volFx()),t);g.gain.exponentialRampToValueAtTime(.001,t+n[1]);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+n[1]+.02);t+=n[1]*.92;}}catch(e){}}
const SND={pos:[[523,.07],[659,.07],[784,.12]],neg:[[247,.12,'sawtooth'],[185,.22,'sawtooth']],lvl:[[523,.07],[659,.07],[784,.07],[1047,.18]],mile:[[523,.09],[659,.09],[784,.09],[1047,.09],[784,.09],[1047,.09],[1319,.3]],win:[[523,.1],[523,.1],[523,.1],[659,.14],[784,.1],[659,.1],[784,.1],[1047,.4]]};
/* ---------- interface sounds: every tap makes a small game-like sound; muting silences them all (tone() checks soundOn) ---------- */
const UIS={
  tick:[[760,.03,'triangle']],
  tab:[[660,.04,'triangle'],[990,.07,'triangle']],
  up:[[400,.03,'triangle'],[500,.03,'triangle'],[620,.03,'triangle'],[780,.06,'triangle']],
  down:[[780,.03,'triangle'],[620,.03,'triangle'],[500,.03,'triangle'],[400,.06,'triangle']],
  back:[[520,.03,'sine'],[340,.07,'sine']],
  plus:[[600,.04,'square'],[900,.08,'square']],
  minus:[[420,.05,'square'],[270,.09,'square']],
  swoosh:[[300,.04,'sawtooth'],[450,.04,'sawtooth'],[700,.07,'sawtooth']],
  undo:[[620,.05,'sine'],[470,.05,'sine'],[320,.09,'sine']],
  chime:[[784,.05,'sine'],[1047,.09,'sine']],
  thud:[[220,.09,'square']],
  zin:[[500,.04,'sine'],[1000,.09,'sine']],
  zout:[[1000,.04,'sine'],[500,.09,'sine']]
};
function uiSound(el){
  if(!el||el.disabled)return;const a=el.dataset.act,t=el.dataset.tab;
  if(a==='give')return;
  let s=UIS.tick;
  if(t)s=UIS.tab;
  else if(a==='pm')s=el.dataset.t==='neg'?UIS.minus:UIS.plus;
  else if(a==='pick'){const i=Math.max(0,(S.kids||[]).findIndex(k=>k.id===el.dataset.id));s=[[500+i*70,.04,'sine'],[750+i*70,.07,'sine']];}
  else if(a==='camtop')s=UIS.up;
  else if(a==='cambot')s=UIS.down;
  else if(a==='camzoom')s=camZoom?UIS.zin:UIS.zout;
  else if(a==='popclose'||a==='close'||a==='backdrop')s=UIS.back;
  else if(a==='wdpick'||a==='wdhero'||a==='wdtab'||a==='av'||a==='avg'){const v=parseInt(el.dataset.v,10);s=[[700+((isNaN(v)?0:v)%9)*55,.03,'triangle'],[1000+((isNaN(v)?0:v)%9)*40,.04,'triangle']];}
  else if(a==='pickmap'||a==='fork'||a==='forkgo')s=UIS.swoosh;
  else if(a==='undo')s=UIS.undo;
  else if(a==='bp'||a==='sugg'||a==='cert'||a==='certshow'||a==='kcerts'||a==='badges')s=UIS.chime;
  else if(a==='bdel'||a==='rwdel'||a==='invdel'||a==='famdel')s=UIS.thud;
  tone(s);
}
document.addEventListener('click',e=>{
  if(e.target.closest&&e.target.closest('#soundBtn'))return;
  const el=e.target.closest&&e.target.closest('[data-act],[data-tab],button,.map-card,.actor');
  if(el)uiSound(el);
},true);
const fx={cv:$('#fx'),parts:[],on:false};
function confetti(x,y,n,spread){
  if(REDUCED)return;fx.cv.width=innerWidth;fx.cv.height=innerHeight;const cols=['#ffd23f','#ff7eb6','#43c6e8','#58c15a','#ff9a2e','#ffffff'];
  for(let i=0;i<n;i++)fx.parts.push({x,y,vx:(Math.random()-.5)*9*spread,vy:-Math.random()*10-3,s:4+Math.floor(Math.random()*4),c:cols[i%cols.length],life:55+Math.random()*45});
  if(!fx.on){fx.on=true;requestAnimationFrame(fxLoop);}
}
function fxLoop(){const c=fx.cv.getContext('2d');c.clearRect(0,0,fx.cv.width,fx.cv.height);fx.parts=fx.parts.filter(p=>p.life>0&&p.y<fx.cv.height+20);for(const p of fx.parts){p.vy+=.38;p.x+=p.vx;p.y+=p.vy;p.life--;c.fillStyle=p.c;c.fillRect(Math.round(p.x),Math.round(p.y),p.s,p.s);}if(fx.parts.length)requestAnimationFrame(fxLoop);else{fx.on=false;c.clearRect(0,0,fx.cv.width,fx.cv.height);}}
function burstAtKid(id,n){const el=$('#actors .actor[data-id="'+id+'"]');let x=innerWidth/2,y=innerHeight/3;if(el){const r=el.getBoundingClientRect();x=r.left+r.width/2;y=r.top;}confetti(x,y,n,1);}

/* ================= title screen ================= */
let SPL=null;
function stopSplash(){if(SPL&&SPL.raf)cancelAnimationFrame(SPL.raf);SPL=null;}
function drawSplash(){
  stopSplash();
  const cv=$('#splashCv'),sc=Math.max(5,innerWidth/360,innerHeight/260),W=Math.round(innerWidth/sc),H=Math.round(innerHeight/sc);
  cv.width=W;cv.height=H;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;const r=rng(7);
  /* background: sky and sun (clouds and birds are recorded, then animated) */
  const bg=mk(W,H),bc=bg.getContext('2d');bc.imageSmoothingEnabled=false;
  REC={sky:[],clouds:[],birds:[]};
  sky(bc,W,H,['#2d62c4','#3f7dd8','#5f9fe6','#8bc3f0','#bfe0f7','#ffe9ae'],H*.82);
  disc(bc,W*.8,H*.2,9,'#fff3b0');disc(bc,W*.8,H*.2,6,'#ffe27a');
  cloud(bc,W*.08,H*.14,2);cloud(bc,W*.62,H*.3,1);cloud(bc,W*.3,H*.42,1);cloud(bc,W*.9,H*.08,1);
  bird(bc,W*.22,H*.3);bird(bc,W*.3,H*.26);bird(bc,W*.7,H*.2);bird(bc,W*.5,H*.34);
  const rec=REC;REC=null;
  /* foreground: mountain, path, trees, flag pole (transparent elsewhere) */
  const fg=mk(W,H),fc=fg.getContext('2d');fc.imageSmoothingEnabled=false;
  const o={cx:W*.5,peakY:H*.47,slope:.78,snowDepth:11,snowCols:['#ffffff','#d9e8f4'],rockDepth:8,rockCols:['#9aa6b2','#76828f'],bodyCols:['#7ccf55','#6bbd4a','#4fa043','#438f3a'],speck:90,speckCols:['#a0e07a','#2f7f33'],noHills:true};
  tri(fc,W*.1,H*.62,H*.16,H*.2,'#a9c6e4','#94b3d6');tri(fc,W*.92,H*.58,H*.2,H*.22,'#a9c6e4','#94b3d6');
  mountain(fc,W,H,r,o);R(fc,0,H*.95,W,H*.05+1,'#3f9a3f');
  const path=buildPath(zig(5,.5,.2,.6,.95,.5,.5,.5),W,H),T=MAPS.peak.tile;
  for(let i=1;i<100;i++){const p=path.lv[i];drawTile(fc,p[0],p[1],i,T,i%10===0);}
  const gx=Math.round(path.lv[100][0]),gy=Math.round(path.lv[100][1]);
  EMB.flag(fc,gx,gy,true);
  for(const [x,y,h] of [[.08,.97,18],[.17,.99,14],[.9,.98,18],[.82,.99,13],[.03,.99,12],[.96,.99,12]])pine(fc,Math.round(W*x),Math.round(H*y),h,'#2f8f45','#4cb35c');
  /* the two kids waiting at the start */
  const sprite=av=>{const d=mk(CH_W,CH_H),u=mk(CH_W,CH_H);drawChar(d.getContext('2d'),av,false);drawChar(u.getContext('2d'),av,true);return{d,u};};
  const kids=[{s:sprite({g:'m',sk:1,st:2,hc:3,sh:0}),p:path.lv[38],ph:0,dir:1},{s:sprite({g:'f',sk:2,st:14,hc:1,sh:4}),p:path.lv[55],ph:.55,dir:-1}];
  const dt=[];for(let i=0;i<7;i++)dt.push(1);
  const CL=rec.clouds.map((q,i)=>({x:q[0],y:q[1],s:q[2],sp:1.6+q[2]*1.2+(i%3)*.7})),BD=rec.birds.map((q,i)=>({x:q[0],y:q[1],col:q[2],sp:5+(i%3)*2.2,ph:i*1.7}));
  const flagH=[];for(let dx=0;dx<11;dx++){let h=0;for(let i=0;i<7;i++)if(Math.round(11-i*1.5)>dx)h=i+1;flagH.push(h);}
  const frame=t=>{
    c.clearRect(0,0,W,H);c.drawImage(bg,0,0);
    /* the sky was painted without clouds and birds (recorded), so draw them moving */
    for(const q of CL){const x=((q.x+t*q.sp+20)%(W+40))-20;cloud(c,x,q.y,q.s);}
    for(const q of BD){const x=((q.x+t*q.sp+10)%(W+20))-10,y=q.y+Math.sin(t*1.6+q.ph)*2,up=Math.sin(t*9+q.ph)>0;
      c.fillStyle=q.col;(up?BIRD_A:BIRD_B).forEach(p=>c.fillRect(Math.round(x)+p[0],Math.round(y)+p[1],1,1));}
    c.drawImage(fg,0,0);
    /* flag cloth waving */
    for(let dx=0;dx<11;dx++){const amp=Math.min(1.6,dx*.22),off=Math.round(Math.sin(t*6.5-dx*.75)*amp);
      for(let i=0;i<7;i++){if(Math.round(11-i*1.5)<=dx)continue;R(c,gx+1+dx,gy-22+i+off,1,1,i<2?'#ff7a6a':'#e24a3b');}}
    R(c,gx,gy-23,1,1,'#ffd23f');
    /* kids bouncing happily */
    for(const k of kids){const ph=((t/1.25+k.ph)%1),air=ph<.62,h=air?Math.sin(Math.PI*ph/.62)*5:0,x=Math.round(k.p[0]),y=Math.round(k.p[1]);
      c.fillStyle='rgba(0,0,0,.28)';const sw=Math.round(6-h*.4);c.fillRect(x-sw,y+1,sw*2,2);
      c.drawImage(h>1.4?k.s.u:k.s.d,x-8,Math.round(y-CH_H+2-h));}
  };
  SPL={W,H,raf:0,last:-1};
  if(REDUCED){frame(0);return;}
  const t0=performance.now();
  const loop=ts=>{if(!SPL)return;SPL.raf=requestAnimationFrame(loop);if(ts-SPL.last<62)return;SPL.last=ts;frame((ts-t0)/1000);};
  SPL.raf=requestAnimationFrame(loop);
}

/* ================= navigation ================= */
const V=$('#view');
function go(tab){let sec=null;if(tab==='round'){tab='settings';sec='round';}if(sec)SETOPEN[sec]=true;if(tab==='beh'&&!pwActOK()){guardPw(()=>go('beh'));return;}if(view==='settings'&&tab!=='settings')pwUntil=0;view=tab;closePop();$$('.tab').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===view)));render();window.scrollTo(0,0);}
function render(){document.body.classList.toggle('is-home',view==='home'&&!needJoin());if(view!=='home'||needJoin())stopLive();if(needJoin()){renderJoin();return;}({home:renderHome,kids:renderKids,beh:renderBehaviors,round:renderSettings,certs:renderCerts,settings:renderSettings}[view]||renderHome)();}
const needJoin=()=>isGuest()&&!myFam();
function avHtml(k){return k.photo?'<img class="photo" alt="" src="'+k.photo+'">':'<img class="sp" alt="" src="'+avatarURL(effAv(k),false)+'">';}

/* ================= home: full-screen living map ================= */
let curScene=null,curW=0,sel=null,popCtx=null,hinted=false,scrT=0;const disp={},bobbing={},animTok={};
function sizeHome(){const t=$('.tabs');document.documentElement.style.setProperty('--tabH',(t?Math.max(0,innerHeight-t.getBoundingClientRect().top):78)+'px');}
/* the world is about twice as tall as the screen; the camera follows the climber and can be scrolled */
let camZoom=false;
/* camZoom: the whole world fitted on one screen (zoomed out); otherwise the world is bigger than the screen and is scrolled */
function homeGeo(){
  const h=$('#home'),cw=h?h.clientWidth:innerWidth,ch=h&&h.clientHeight?h.clientHeight:innerHeight-80,m=mapOf();
  if(m.layout==='h'){const H=240,sc0=ch/H,W=clamp(Math.round(cw/sc0*3.2),520,1000);return camZoom?{W,H,scale:Math.min(cw/W,ch/H),hz:true,zoom:true,cw,ch}:{W,H,scale:sc0,hz:true};}
  const W=clamp(Math.round(250*cw/ch),140,480),sc0=cw/W,H=m.tall?clamp(Math.round(W*m.tall),360,900):clamp(Math.round(ch/sc0*1.9),360,640);
  return camZoom?{W,H,scale:Math.min(sc0,ch/H),hz:false,zoom:true,cw,ch}:{W,H,scale:sc0,hz:false};
}
let curGeo={W:0,H:0,scale:1,hz:false},hudOpen=false;const flying={};
const camEl=()=>$('#cam');
const camSmooth=()=>REDUCED?'auto':'smooth';
/* where a child's feet are on screen-world coordinates (scene pixels), also while being flung off a bridge */
function kidFoot(id,lv){const k=kidById(id);if(!k)return[0,0];const fl=flying[id],p=fl&&fl.pos?fl.pos():kidPos(k,lv==null?disp[id]:lv);return[p[0]*curGeo.scale,p[1]*curGeo.scale];}
function camFocus(smooth){
  const cam=camEl();if(!cam||!curScene)return;
  const lead=S.kids.slice().sort((a,b)=>b.pts-a.pts)[0],beh=smooth?camSmooth():'auto';
  if(curGeo.hz){const cw=cam.clientWidth,x=lead&&lead.pts>0?kidFoot(lead.id,dispTarget(lead))[0]-cw*.4:0;cam.scrollTo({left:clamp(x,0,cam.scrollWidth-cw),behavior:beh});return;}
  const ch=cam.clientHeight,top=lead&&lead.pts>0?kidFoot(lead.id,dispTarget(lead))[1]-ch*.58:cam.scrollHeight;
  cam.scrollTo({top:clamp(top,0,cam.scrollHeight-ch),behavior:beh});
}
function camFollow(id){
  const cam=camEl();if(!cam||!curScene)return;const f=kidFoot(id);
  if(curGeo.hz){const cw=cam.clientWidth,x=f[0]-cam.scrollLeft;if(x<cw*.3||x>cw*.7)cam.scrollLeft+=(f[0]-cw*.5-cam.scrollLeft)*.2;return;}
  const y=f[1],top=y-cam.scrollTop,ch=cam.clientHeight;
  if(top<ch*.3||top>ch*.8)cam.scrollTop+=(y-ch*.55-cam.scrollTop)*.2;
}
function hudHtml(){
  const m=mapOf(),st=periodState(),p=S.cfg.period;
  let h='<button class="pill hm" type="button" data-act="hudtoggle" aria-expanded="'+hudOpen+'">'+esc(m.name)+'</button>';
  if(st.k==='in')h+='<span class="pill">باقي '+daysTxt(st.left)+'</span>';
  else if(st.k==='before')h+='<span class="pill warn">تبدأ بعد '+daysTxt(st.days)+'</span>';
  else if(st.k==='after')h+=isGuest()?'<span class="pill warn">انتهت الفترة</span>':'<button class="pill warn" type="button" data-act="gotoround">انتهت الفترة، مدّدها</button>';
  h+='<button class="pill" type="button" data-act="feed">آخر الحركات</button>';
  if(hudOpen){
    if(p&&p.start&&p.end)h+='<span class="pill">'+esc(fmtDay(p.start))+' ← '+esc(fmtDay(p.end))+'</span>';
    h+='<span class="pill">الهدف '+goal()+' نقطة</span><span class="pill">الجولة '+curRound()+'</span>';
    if(famList().length>1)h+=famList().map(f=>'<span class="pill fam"><i style="background:'+famColor(f.uid)+'"></i>'+esc(famName(f.uid))+'</span>').join('');
  }
  return h;
}
function refreshHud(){const h=$('#hud');if(h)h.innerHTML=hudHtml();}
function paintScene(g){
  const id=MAPS[S.cfg.mapId]?S.cfg.mapId:'peak';curGeo=g;curW=g.W;curScene=buildLive(id,g.W,g.H);
  const scn=$('#scene');scn.style.width=(g.hz||g.zoom)?Math.round(g.W*g.scale)+'px':'';scn.style.height=Math.round(g.H*g.scale)+'px';scn.style.margin=g.zoom?(g.hz?Math.max(0,Math.round((g.ch-g.H*g.scale)/2))+'px 0 0':'0 auto'):'';
  $('#cam').classList.toggle('hz',!!g.hz);try{$('#cam').style.background=g.zoom?'rgb('+Array.from(curScene.cv.getContext('2d').getImageData(1,1,1,1).data).slice(0,3).join(',')+')':'';}catch(_){}const cc=$('.camctl');
  if(cc){cc.classList.toggle('hz',!!g.hz);const a=cc.querySelector('[data-act=camtop]'),b=cc.querySelector('[data-act=cambot]');if(a)a.setAttribute('aria-label',g.hz?'إلى النهاية':'إلى القمة');if(b)b.setAttribute('aria-label','إلى البداية');}
  for(const k of ['sceneCv','fxCv']){const cv=$('#'+k);cv.width=g.W;cv.height=g.H;}
  const c=$('#sceneCv').getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(curScene.cv,0,0);
  const ah=$('#actors');ah.style.setProperty('--aw',(CH_W/g.W*100)+'%');ah.style.setProperty('--bw',(26/CH_W*100)+'%');ah.style.setProperty('--rw',(13/g.W*100)+'%');
  ah.style.setProperty('--boat','url('+boatURL()+')');ah.style.setProperty('--rockimg','url('+rockURL()+')');
  startLive(curScene,id);
}
function buildActors(){
  const host=$('#actors');if(!host)return;host.innerHTML='';
  S.kids.forEach(k=>{disp[k.id]=dispTarget(k);const b=document.createElement('div');b.className='actor idle';b.dataset.act='pick';b.dataset.id=k.id;b.tabIndex=0;b.setAttribute('role','button');b.setAttribute('aria-label',k.name+(canCtl(k)?': اضغط لإضافة أو خصم نقاط':': من '+famName(k.fam)+'، للعرض فقط'));
    b.innerHTML='<span class="tag"></span><img alt="" src="'+avatarURL(effAv(k),isDone(k))+'"><i class="bt"></i>';host.appendChild(b);});
  placeActors();
}
function placeActors(){
  const host=$('#actors');if(!host||!curScene)return;const W=curScene.W,hw=host.clientWidth,m=mapOf(),cam=camEl(),hz=!!curGeo.hz,vw=hz&&cam?cam.clientWidth:hw,off=hz&&cam?cam.scrollLeft:0,P=curScene.path;
  const ks=S.kids.filter(k=>disp[k.id]!=null).sort((a,b)=>disp[a.id]-disp[b.id]),placed=[];
  ks.forEach(k=>{const el=host.querySelector('.actor[data-id="'+k.id+'"]');if(!el)return;const l=disp[k.id],fl=flying[k.id],alt=!!(m.fork&&forkSt(k)==='alt');
    const pos=fl&&fl.pos?fl.pos():levelPos(P,l,alt),ty=fl?'u':(gapAt(m,l)>=0?'x':levelTy(P,l,alt));
    let n=0;for(const q of placed)if(Math.abs(q-l)<4)n++;placed.push(l);
    const dx=n?((n%2)?1:-1)*Math.ceil(n/2)*CH_W*0.85:0,fx=(pos[0]+dx)/W;
    const img=el.querySelector('img'),mh=applyMove(k,el,img,isDone(k)||ty==='u'||ty==='d'||ty==='z'),bob=mh!=null?mh:(bobbing[k.id]&&!fl?Math.abs(Math.sin(performance.now()/90))*(ty==='s'?5:2.5):0);
    el.style.left=(fx*100)+'%';el.style.top=(pos[1]/curScene.H*100)+'%';el.style.zIndex=sel===k.id?9000:Math.round(pos[1]);
    el.style.transform='translate(-50%,calc(-100% - '+bob.toFixed(1)+'px))';
    const sx=fx*hw-off,side=sx<84?'r':(vw-sx<84?'l':'');if(el.dataset.side!==side)el.dataset.side=side;
    el.classList.toggle('onboat',ty==='x');
    const f=forkOf(k),tg=el.querySelector('.tag'),multi=famList().length>1,warn=f&&f.st==='alt'&&f.negs>0?'<span class="warn">'+'!'.repeat(Math.min(3,f.negs))+'</span>':(needsFork(k)?'<span class="warn">مفترق</span>':''),
      tx=(multi?'<i style="background:'+famColor(k.fam)+'"></i>':'')+esc(k.name)+' · '+Math.floor(l)+warn;if(tg.dataset.h!==tx){tg.dataset.h=tx;tg.innerHTML=tx;}tg.style.setProperty('--tl',(n*15)+'px');
  });
}
/* tapping a character shows + and − beside it */
function renderSel(){
  $$('#actors .pm').forEach(n=>n.remove());$$('#actors .actor.sel').forEach(n=>n.classList.remove('sel'));
  const k=sel&&kidById(sel),el=k&&$('#actors .actor[data-id="'+sel+'"]');
  if(!k||!el){sel=null;return;}
  el.classList.add('sel');
  el.insertAdjacentHTML('beforeend','<div class="pm">'+(!canCtl(k)?'<span class="pb ro">'+esc(famName(k.fam))+' · للعرض فقط</span>':isDone(k)
    ?'<button class="pb pos cert" type="button" data-act="cert" data-id="'+k.id+'">الشهادة</button>'
    :needsFork(k)?'<button class="pb pos cert" type="button" data-act="fork" data-id="'+k.id+'">اختر الطريق</button>'
    :'<button class="pb pos" type="button" data-act="pm" data-t="pos" data-id="'+k.id+'" aria-label="سلوك إيجابي لـ '+esc(k.name)+'"></button><button class="pb neg" type="button" data-act="pm" data-t="neg" data-id="'+k.id+'" aria-label="سلوك سلبي لـ '+esc(k.name)+'"></button>')+'</div>');
  placeActors();
}
function selectKid(id){closePop();sel=sel===id?null:id;renderSel();if(sel)tone([[698,.05]]);}
function animateKid(id,to){
  const from=disp[id]==null?0:disp[id];
  if(REDUCED||Math.abs(to-from)<0.01||!$('#actors')||!curScene){disp[id]=to;placeActors();return;}
  const tok=(animTok[id]=(animTok[id]||0)+1);moveKid(id,from,to,tok);
}
function floatText(id,txt,cls){const host=$('#actors'),el=host&&host.querySelector('.actor[data-id="'+id+'"]');if(!el)return;const d=document.createElement('div');d.className='float '+cls;d.textContent=txt;d.style.left=el.style.left;d.style.top='calc('+el.style.top+' - 30px)';d.style.zIndex=9999;host.appendChild(d);setTimeout(()=>d.remove(),1300);}
function renderHome(){
  V.innerHTML='<div class="home" id="home"><div class="cam" id="cam"><div class="scene" id="scene" data-act="scenebg"><canvas id="sceneCv"></canvas><canvas id="fxCv"></canvas><div class="actors" id="actors"></div></div></div><div class="hud" id="hud"></div>'
    +'<div class="camctl"><button class="btn iconbtn" type="button" data-act="camtop" aria-label="إلى القمة"><span class="ico i-up"></span></button><button class="btn iconbtn" type="button" data-act="cambot" aria-label="إلى البداية"><span class="ico i-down"></span></button><button class="btn iconbtn" type="button" data-act="camzoom" aria-label="'+(camZoom?'تكبير الخريطة':'تصغير الخريطة')+'"><span class="ico i-zoom"></span></button></div><button class="btn iconbtn homebtn" type="button" data-act="tohome" aria-label="القائمة الرئيسية"><span class="ico i-house"></span></button><div id="homeEmpty"></div></div>';
  sizeHome();paintScene(homeGeo());buildActors();renderChests();renderLabels();refreshHud();renderSel();camFocus(false);
  camEl().addEventListener('scroll',()=>{if(popCtx)closePop();if(curGeo.hz&&sel&&!scrT)scrT=requestAnimationFrame(()=>{scrT=0;placeActors();});},{passive:true});
  if(!S.kids.length)$('#homeEmpty').innerHTML='<div class="home-empty panel empty"><div class="big">ابدأ بإضافة أبطالك</div><p class="sub">أضف الأبناء بأسمائهم وصورهم، ويظهرون هنا شخصيات صغيرة تتسلّق الخريطة مع كل سلوك طيب.</p><div style="margin-top:12px"><button class="btn primary" data-act="addkid">+ إضافة ابن أو ابنة</button></div></div>';
}
function refreshHome(){if(view!=='home')return;refreshHud();placeActors();renderChests();renderLabels();renderSel();}
function fitHome(){sizeHome();if(view!=='home'||!ready||sheetOpen)return;const g=homeGeo();if(Math.abs(g.W-curGeo.W)>=8||Math.abs(g.H-curGeo.H)>=24||!!g.hz!==!!curGeo.hz||(g.hz&&Math.abs(g.scale-curGeo.scale)/curGeo.scale>.04)){closePop();renderHome();}else placeActors();}

/* ---------- simple behaviour list next to the character ---------- */
function popHtml(k,t){
  const pos=t!=='neg',bh=behFor(k),list=pos?bh.pos:bh.neg,st=periodState(),done=isDone(k),off=!canAward()||done;
  const note=done?'أنهى المغامرة':st.k==='before'?'الفترة لم تبدأ بعد':st.k==='after'?'انتهت الفترة':'';
  return '<div class="pop-h '+(pos?'pos':'neg')+'"><span class="pop-n">'+esc(k.name)+'</span><b>'+(pos?'سلوك إيجابي':'سلوك سلبي')+'</b><button class="pop-x" type="button" data-act="badges" data-id="'+k.id+'" aria-label="شارات '+esc(k.name)+'"><span class="ico i-star"></span></button><button class="pop-x" type="button" data-act="wardrobe" data-id="'+k.id+'" aria-label="ملابس '+esc(k.name)+'"><span class="ico i-shirt"></span></button><button class="pop-x" type="button" data-act="popclose" aria-label="إغلاق">×</button></div>'
   +(note?'<div class="pop-note">'+note+'</div>':'')
   +'<div class="pop-list">'+(list.length?list.map(b=>'<button class="pop-row '+(pos?'pos':'neg')+'" type="button" data-act="give" data-id="'+k.id+'" data-bid="'+b.id+'" data-t="'+(pos?'pos':'neg')+'"'+(off?' disabled':'')+'><span class="t">'+esc(b.t)+'</span><span class="chip '+(pos?'':'neg')+'">'+(pos?'+':'-')+b.p+'</span></button>').join('')
     :'<p class="sub" style="padding:6px 4px">ما فيه سلوكيات بعد.</p><button class="btn small" type="button" data-act="gobeh">إضافة سلوكيات</button>')+'</div>'
   +(k.log.length?'<button class="pop-undo" type="button" data-act="undo" data-id="'+k.id+'">تراجع عن آخر نقطة</button>':'');
}
function openPop(id,t){
  const k=kidById(id),el=$('#actors .actor[data-id="'+id+'"]');if(!k||!el||!canCtl(k))return;popCtx={id,t};
  const host=$('#popHost');host.innerHTML='<div class="pop-back" data-act="popclose"><div class="pop" data-act="noop" role="dialog" aria-label="'+esc(k.name)+'">'+popHtml(k,t)+'</div></div>';
  const pop=host.querySelector('.pop'),ar=el.getBoundingClientRect(),vw=innerWidth,tabTop=$('.tabs').getBoundingClientRect().top,topBar=58;
  const above=ar.top-28-topBar,below=tabTop-ar.bottom-12;
  pop.style.maxHeight=Math.max(150,Math.min(400,Math.max(above,below)))+'px';
  const pw=pop.offsetWidth,ph=pop.offsetHeight;
  pop.style.left=clamp(ar.left+ar.width/2-pw/2,10,vw-pw-10)+'px';
  const top=(above>=ph||above>=below)?ar.top-28-ph:ar.bottom+12;
  pop.style.top=clamp(top,topBar,Math.max(topBar,tabTop-ph-8))+'px';
  const f=pop.querySelector('.pop-row:not([disabled])');if(f)f.focus({preventScroll:true});
}
function closePop(){popCtx=null;const h=$('#popHost');if(h)h.innerHTML='';}

/* ---- small pixel sprites: a rowing boat for crossings, a volcanic rock ---- */
let _boatU,_rockU;
function boatURL(){if(_boatU)return _boatU;const cv=mk(26,11),c=cv.getContext('2d');
  R(c,1,5,24,1,'#e6c48a');R(c,2,6,22,1,'#c99a5c');R(c,3,7,20,1,'#8a5a2b');R(c,5,8,16,1,'#6b4a2b');R(c,8,9,10,1,'#4a2d12');
  R(c,1,5,2,1,'#fff3d0');R(c,23,5,2,1,'#fff3d0');R(c,6,7,14,1,'#a8703a');R(c,4,10,18,1,'rgba(255,255,255,.7)');
  return(_boatU=cv.toDataURL());}
function rockURL(){if(_rockU)return _rockU;const cv=mk(13,13),c=cv.getContext('2d');
  disc(c,6,6,6,'#ff7a1a');disc(c,6,6,5,'#3a2a35');disc(c,5,5,3,'#5b4552');R(c,3,3,2,1,'#8f7a89');R(c,8,8,2,2,'#ff5a1f');R(c,9,4,1,1,'#ffd23f');R(c,3,9,1,1,'#ff9a2e');
  return(_rockU=cv.toDataURL());}
/* the volcano erupts: a rock hits the child on the bridge and flings him back to the long road */
function throwKid(id,toL){
  const k=kidById(id);if(!k||!curScene||!$('#actors')||REDUCED){disp[id]=toL;placeActors();return;}
  const P=curScene.path,from=levelPos(P,disp[id],true).slice(),to=P.at(clamp(toL,0,100)/100),host=$('#actors'),rock=document.createElement('div');
  rock.className='rock';host.appendChild(rock);bobbing[id]=false;animTok[id]=(animTok[id]||0)+1;
  const t0=performance.now(),D1=520,D2=1000,W=curScene.W,H=curScene.H,ease=u=>u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
  const fl=flying[id]={pos:()=>from};
  (function step(now){const t=now-t0;
    if(t<D1){const u=ease(t/D1);rock.style.left=(from[0]/W*100)+'%';rock.style.top=((from[1]+40-(48*u))/H*100)+'%';requestAnimationFrame(step);placeActors();return;}
    const u=clamp((t-D1)/D2,0,1),e=ease(u),x=from[0]+(to[0]-from[0])*e,y=from[1]+(to[1]-from[1])*e-Math.sin(u*Math.PI)*34;
    if(t-D1<40&&!fl.hit){fl.hit=1;tone(SND.neg);floatText(id,'!','n');burstAtKid(id,24);}
    fl.pos=()=>[x,y];rock.style.left=((x-6)/W*100)+'%';rock.style.top=((y+16+u*30)/H*100)+'%';rock.style.opacity=String(1-u);
    placeActors();camFollow(id);
    if(u<1)requestAnimationFrame(step);else{rock.remove();delete flying[id];disp[id]=toL;placeActors();}})(t0);
}

/* ================= sheets ================= */
function openSheet(html,ctx){sheetCtx=ctx||{};$('#sheetHost').innerHTML='<div class="sheet-back" data-act="backdrop"><div class="sheet" role="dialog" aria-modal="true">'+html+'</div></div>';sheetOpen=true;document.body.classList.add('sheet-open');}
function closeSheet(){const nx=sheetCtx&&sheetCtx.next;$('#sheetHost').innerHTML='';sheetOpen=false;document.body.classList.remove('sheet-open');sheetCtx=null;draft=null;wd=null;pwAfter=null;if(dirty){dirty=false;closePop();render();}else fitHome();if(nx)setTimeout(nx,260);}
function setSheet(html){const s=$('#sheetHost .sheet');if(!s)return;const st=s.scrollTop;s.innerHTML=html;s.scrollTop=st;}

/* ---- the choice at the fork ---- */
function openFork(id){
  const k=kidById(id),m=mapOf();if(!k||!canCtl(k)||!m.fork)return;const bonus=Math.round(goal()*.10);
  closePop();
  openSheet('<div class="empty"><div class="big" style="font-size:38px;color:var(--brand)">مفترق طرق يا '+esc(k.name)+'!</div>'
   +'<p style="margin-top:6px">وصل إلى المستوى '+m.fork.a+' في «'+esc(m.name)+'». اختر طريقك:</p>'
   +'<button class="btn forkopt" type="button" data-act="forkgo" data-id="'+k.id+'" data-v="main"><b>الطريق الطويل</b><span>يلفّ حول البركان، آمن وما فيه مفاجآت.</span></button>'
   +'<button class="btn gold forkopt" type="button" data-act="forkgo" data-id="'+k.id+'" data-v="alt"><b>الطريق المختصر: جسر فوق الحمم</b><span>مجازفة عشوائية: قد يختصر عليه '+bonus+' نقاط، وقد يكون فيه خطر؛ فإذا جاءته '+FORK_NEGS+' سلبيات وهو على الجسر ينفجر البركان ويقذفه إلى الطريق الطويل.</span></button>'
   +'<div class="row" style="justify-content:center;margin-top:14px"><button class="btn" type="button" data-act="close">لاحقًا</button></div></div>',{});
}
function forkChoose(id,mode){
  const k=kidById(id),m=mapOf();if(!k||!canCtl(k)||!m.fork||!needsFork(k))return;
  const f=Object.assign({used:false},forkOf(k)||{},{tk:tierKey(),negs:0});
  if(mode==='alt'){f.st='alt';f.danger=Math.random()<.5;}else{f.st='main';f.danger=false;}
  k.fork=f;
  let msg=mode==='alt'?k.name+' اختار الجسر المختصر، الله يعينه!':k.name+' اختار الطريق الطويل، خطوة ثابتة.';
  const cr=forkCross(k,f,k.pts,false);if(cr)msg=cr.msg;
  persistKid(k);closeSheet();
  if(view==='home'){animateKid(k.id,dispTarget(k));refreshHome();}
  toast(msg);tone(mode==='alt'?SND.lvl:SND.pos);
}
/* a child standing on the bridge who reaches its far end crosses it: a safe bridge pays the shortcut bonus (only when pay is true) */
function forkCross(k,f,pts,pay){
  const m=mapOf();if(!m.fork||!f||f.st!=='alt'||lvl(pts)<m.fork.b)return null;
  f.st='done';let bonus=0,msg=k.name+' عبر الجسر بسلام!';
  if(!f.danger&&!f.used){f.used=true;if(pay){bonus=Math.min(Math.round(goal()*.10),goal()-pts);if(bonus>0)msg=k.name+': الجسر كان آمنًا! اختصر الطريق وكسب '+bonus+' نقاط.';}}
  return{bonus,msg};
}

/* ---------- award points ---------- */
function give(kidId,bid,type){
  const k=kidById(kidId);if(!k||!canCtl(k))return;const bh=behFor(k),list=type==='neg'?bh.neg:bh.pos,b=list.find(x=>x.id===bid);if(!b)return;
  if(!canAward()||isDone(k))return;
  if(needsFork(k)){closePop();openFork(k.id);return;}
  const from=k.pts;let to=clamp(from+(type==='neg'?-b.p:b.p),0,goal());
  if(to===from){if(type==='neg')toast('ما عنده نقاط لتُخصم');return;}
  const m=mapOf(),oldL=lvl(from),oldTier=tierOf(k),fk0=m.fork&&forkOf(k)?JSON.parse(JSON.stringify(forkOf(k))):null;
  // the fork: negatives on a dangerous bridge, crossing, falling back, arriving
  let bonus=0,thrown=false,asked=false,forkMsg='';
  if(m.fork){const A=m.fork.a,B=m.fork.b,f=fk0?Object.assign({},fk0):{tk:tierKey(),st:'',danger:false,negs:0,used:false};f.tk=tierKey();
    if(type==='neg'&&f.st==='alt'&&oldL<B){f.negs=(f.negs||0)+1;if(f.danger&&f.negs>=FORK_NEGS){f.st='thrown';thrown=true;}}
    const cr=forkCross(k,f,to,true);if(cr){bonus=cr.bonus;forkMsg=cr.msg;}
    const nl=lvl(to+bonus);
    if(nl<A){f.st='';f.negs=0;thrown=false;}
    else if(f.st===''||f.st==='ask'){f.st='ask';asked=true;}
    if(thrown)forkMsg=k.name+': انفجر البركان وقذفه إلى الطريق الطويل!';
    k.fork=f;}
  to+=bonus;k.pts=to;
  const newL=lvl(to),delta=to-from,newTier=Math.max(oldTier,milestone(newL));k.tier=newTier;k.tk=tierKey();
  const ent={id:uid(),t:b.t,p:delta-bonus,k:type,from,to,ts:Date.now()};if(m.fork){ent.fk=fk0;if(bonus)ent.bonus=bonus;}
  k.log.unshift(ent);if(k.log.length>40)k.log.length=40;tally(k,ent,1);
  const chests=[25,50,75].filter(x=>oldL<x&&newL>=x&&rewardOf(x));chests.forEach(x=>{chestHold[x]=true;});
  let finished=false;
  if(to>=goal()){k.tier=100;k.certs.push({id:uid(),ts:Date.now(),mapId:S.cfg.mapId,round:curRound(),pts:to,goal:goal(),name:k.name,period:S.cfg.period||null});finished=true;}
  k.sad=type==='neg'&&!finished;
  const gotB=evalBadges(k);const gotH=evalHeroes(k);
  persistKid(k);closePop();
  if(view==='home'){
    if(thrown)throwKid(k.id,dispTarget(k));else if(Math.abs(dispTarget(k)-(disp[k.id]==null?0:disp[k.id]))<0.01)reactKid(k.id,type!=='neg');else animateKid(k.id,dispTarget(k));
    floatText(k.id,(delta-bonus>0?'+':'')+(delta-bonus),delta-bonus>0?'p':'n');
    if(bonus)setTimeout(()=>floatText(k.id,'+'+bonus+' اختصار','p'),900);
    refreshHome();}
  let wait=REDUCED?100:Math.min(1900,Math.abs(newL-oldL)*55+700)+(thrown?900:0);
  let mileHit=0;for(const m2 of [25,50,75])if(oldL<m2&&newL>=m2)mileHit=m2;
  const badgeLater=()=>{if(gotB.length)setTimeout(()=>{if(!sheetOpen)openBadgeWin(k.id,gotB);},REDUCED?100:600+(thrown?1600:0));};
  if(forkMsg)setTimeout(()=>toast(forkMsg),thrown?600:wait*.6);
  const tail=()=>{
  if(finished){tone(SND.win);setTimeout(()=>{closeSheet();openFinish(k.id);},wait);if(gotB.length)toast(k.name+' حصل على شارة: '+gotB.map(i=>BADGES.find(x=>x.id===i).n).join('، '));}
  else if(newTier>oldTier&&newTier<100){tone(SND.mile);setTimeout(()=>{if(view==='home'&&!sheetOpen)openUnlock(k.id,newTier);},wait+200);setTimeout(()=>burstAtKid(k.id,46),400);if(gotB.length)toast(k.name+' حصل على شارة: '+gotB.map(i=>BADGES.find(x=>x.id===i).n).join('، '));}
  else if(mileHit){tone(SND.mile);toast(k.name+' وصل المحطة '+mileHit+'!');setTimeout(()=>burstAtKid(k.id,46),400);badgeLater();}
  else if(newL>oldL){tone(SND.lvl);setTimeout(()=>burstAtKid(k.id,18),350);setTimeout(()=>{badgeLater();},wait);}
  else{tone(delta<0?SND.neg:SND.pos);badgeLater();}
  };
  if(chests.length&&view==='home'){const w0=wait;setTimeout(()=>{if(view!=='home'){chests.forEach(x=>{chestHold[x]=false;});wait=100;tail();return;}wait=100;openChests(k.id,chests.slice(),()=>{chests.forEach(x=>{chestHold[x]=false;});renderChests();tail();});},w0+300);}else{chests.forEach(x=>{chestHold[x]=false;});tail();}
  if(gotH.length){const tryH=n=>setTimeout(()=>{if(!sheetOpen)openHeroWin(k.id,gotH);else if(n<4)tryH(n+1);},n?2500:wait+(gotB.length||finished||newTier>oldTier?3200:1200));tryH(0);}
  if(asked&&!finished&&view==='home')setTimeout(()=>{if(!sheetOpen&&needsFork(k))openFork(k.id);},wait+(newTier>oldTier?1400:350));
}
function undoLast(id){
  const k=kidById(id);if(!k||!canCtl(k)||!k.log.length)return;const e=k.log.shift();k.pts=e.from;tally(k,e,-1);k.sad=!!(k.log[0]&&k.log[0].k==='neg');
  if(k.pts<goal())k.certs=k.certs.filter(c=>c.round!==curRound());
  const m=mapOf();if(m.fork){k.fork=e.fk?JSON.parse(JSON.stringify(e.fk)):null;if(k.fork&&lvl(k.pts)<m.fork.a){k.fork.st='';k.fork.negs=0;}}
  persistKid(k);if(view==='home'){animateKid(k.id,dispTarget(k));refreshHome();}closePop();toast('تم التراجع');
}
function openFinish(id){
  const k=kidById(id);if(!k)return;
  openSheet('<div class="empty"><div class="av" style="width:96px;height:96px;margin:0 auto 12px;background:var(--sky);display:grid;place-items:center;overflow:hidden;box-shadow:0 -4px 0 0 var(--line),0 4px 0 0 var(--line),-4px 0 0 0 var(--line),4px 0 0 0 var(--line)">'+avHtml(k)+'</div>'
   +'<div class="big" style="font-size:44px;color:var(--brand)">كفو عليك يا '+esc(k.name)+'!</div><p style="margin-top:6px">أنهيت مغامرة «'+esc(mapOf().name)+'» ووصلت إلى المستوى 100.</p>'
   +'<div class="row" style="justify-content:center;margin-top:16px"><button class="btn gold" type="button" data-act="cert" data-id="'+k.id+'">عرض الشهادة</button><button class="btn" type="button" data-act="close">إغلاق</button></div></div>',{});
  confetti(innerWidth*.25,innerHeight*.6,60,1.3);confetti(innerWidth*.75,innerHeight*.6,60,1.3);setTimeout(()=>confetti(innerWidth*.5,innerHeight*.5,70,1.6),400);
}

/* ================= kids ================= */
function kidCard(k){
  const ctl=canCtl(k);
  return '<article class="kcard"><div class="av">'+avHtml(k)+'</div><div class="grow"><div class="nm">'+esc(k.name)+'</div><div class="meta">'+(k.age!==''?'العمر: '+esc(k.age)+' · ':'')+k.pts+' نقطة · '+(k.certs.length?k.certs.length+' شهادة':'بدون شهادات')+'</div><div class="bd-strip">'+badgeStrip(k)+'</div></div>'
   +'<div style="grid-column:1/-1">'+(ctl?'<button class="btn small" data-act="editkid" data-id="'+k.id+'">تعديل</button><button class="btn small" data-act="wardrobe" data-id="'+k.id+'">الملابس</button>':'')+'<button class="btn small" data-act="badges" data-id="'+k.id+'">الشارات</button></div></article>';
}
function invPanel(){
  if(isGuest()||!db)return '';
  const used=new Set(Object.values(S.fams).map(f=>f.code)),pend=Object.keys(S.inv).filter(c=>!used.has(c));
  return '<section class="panel" style="margin-top:12px"><h3>عائلات التحدي</h3><p class="sub">ادعُ عائلة أختك أو أقاربك بكود. تضيف أبناءها، ويتسلقون معكم الجبل نفسه. أنت الرئيس: تتحكم بكل الأبناء، وكل عائلة تتحكم بأبنائها فقط.</p>'
   +(pend.length?'<div class="sub" style="margin-top:8px">أكواد بانتظار الانضمام:</div>'+pend.map(c=>'<div class="invrow"><b class="code">'+esc(fmtCode(c))+'</b><span class="grow sub">'+esc(S.inv[c].label||'')+'</span><button class="btn small" type="button" data-act="copycode" data-id="'+c+'">نسخ</button><button class="btn small neg" type="button" data-act="invdel" data-id="'+c+'" data-confirm>إلغاء</button></div>').join(''):'')
   +'<div class="row" style="margin-top:8px"><button class="btn gold" type="button" data-act="invite">+ دعوة عائلة بكود</button></div></section>';
}
function renderKids(){
  const groups=famList().filter(f=>{const n=S.kids.filter(k=>(k.fam||'')===f.uid).length;return n||(f.uid&&!isGuest())||(!f.uid&&!isGuest())||f.uid===me.uid;});
  const body=groups.map(f=>{
    const ks=S.kids.filter(k=>(k.fam||'')===f.uid),multi=famList().length>1,mine=isGuest()?f.uid===me.uid:!f.uid,fm=f.uid?S.fams[f.uid]:null;
    let head='';
    if(multi){head='<div class="grp"><i style="background:'+famColor(f.uid)+'"></i><h3>'+esc(famName(f.uid))+(mine?' (عائلتي)':'')+'</h3>'
      +(!isGuest()&&fm?'<span class="chip">'+esc(fmtCode(fm.code))+'</span><button class="btn small neg" type="button" data-act="famdel" data-id="'+f.uid+'" data-confirm>إزالة العائلة</button>':'')+'</div>';}
    const need=isGuest()&&fm&&mine&&fm.expected>ks.length?'<p class="sub">أضفت '+ks.length+' من '+fm.expected+' أبناء، أكمل إضافة بقية أبنائك.</p>':'';
    return head+need+(ks.length?'<div class="kgrid">'+ks.map(kidCard).join('')+'</div>':(mine||!isGuest()?'<p class="sub" style="padding:6px 4px">ما أضيف أحد بعد.</p>':''));
  }).join('');
  V.innerHTML='<div class="view"><div class="sec-head"><div><h2>الأبناء</h2><p class="sub">'+(isGuest()?'أضف أبناء عائلتك، وتشوف معهم أبناء بقية العائلات على الجبل نفسه. تتحكم بأبنائك فقط.':'أضف أبناءك بأسمائهم وأعمارهم وصورهم، واختر لكل واحد شخصيته الكرتونية.')+'</p></div><button class="btn primary" data-act="addkid">+ إضافة ابن أو ابنة</button></div>'
   +invPanel()+(S.kids.length||!isGuest()?body:'')+((!S.kids.length&&!Object.keys(S.fams).length)?'<div class="panel empty"><div class="big">ما أضفت أحد بعد</div><p class="sub">اضغط «إضافة ابن أو ابنة» وأدخل الاسم والعمر، والصورة اختيارية.</p></div>':'')+'</div>';
  splitKids();
}
function splitKids(){
  if(innerWidth<760)return;
  const v=V.firstElementChild;if(!v)return;
  const r=document.createElement('div');r.className='splitR';while(v.firstChild)r.appendChild(v.firstChild);
  const l=document.createElement('div');l.className='splitL';
  l.innerHTML=pwActOK()?'<h2>نظام النقاط</h2>'+ptsBody():'<div class="panel lockedpts"><span class="ico i-lock" style="width:40px;height:40px;color:var(--gold)"></span><h3>نظام النقاط مقفل</h3><button class="btn primary" type="button" data-act="ptsunlock">فتح بكلمة السر</button></div>';
  v.classList.add('split');v.appendChild(r);v.appendChild(l);
}
function fmtCode(c){return c&&c.length>3?c.slice(0,3)+'-'+c.slice(3):(c||'');}
const normCode=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
function genCode(){const al='ABCDEFGHJKMNPQRSTUVWXYZ23456789',a=new Uint8Array(6);(window.crypto||{getRandomValues:x=>x.map(()=>Math.random()*256)}).getRandomValues(a);let s='';for(const v of a)s+=al[v%al.length];return s;}
function ago(ts){const m=Math.round((Date.now()-ts)/60000);if(m<1)return 'الآن';if(m<60)return 'قبل '+m+' د';const h=Math.round(m/60);if(h<24)return 'قبل '+h+' س';const d=Math.round(h/24);return d===1?'أمس':'قبل '+d+' أيام';}
/* ---------- families: join with a code ---------- */
function renderJoin(){
  V.innerHTML='<div class="view join"><div class="panel"><h2>انضم إلى تحدي «كفو عليك»</h2><p class="sub">أعطاك الرئيس كودًا. اكتبه هنا، واكتب اسم عائلتكم وعدد الأبناء، وبعدها تضيف أبناءك ويتسلقون مع بقية العائلات على الجبل نفسه.</p>'
   +'<form id="joinForm" autocomplete="off"><label class="lbl" for="jCode">كود الدعوة</label><input class="field code-in" id="jCode" maxlength="12" dir="ltr" autocapitalize="characters" required placeholder="مثال: K7P-Q2M">'
   +'<label class="lbl" for="jName">اسم عائلتكم</label><input class="field" id="jName" maxlength="24" required placeholder="مثال: عائلة أم سارة">'
   +'<label class="lbl" for="jN">كم عدد الأبناء؟</label><input class="field" id="jN" type="number" min="1" max="8" value="1" inputmode="numeric" style="max-width:140px">'
   +'<div class="row" style="margin-top:14px"><button class="btn primary" type="submit">انضمام</button></div></form>'
   +'<p class="sub" style="margin-top:12px">تتحكم بأبناء عائلتك فقط، وتشوف حركات الجميع.</p></div></div>';
}
async function joinFamily(){
  const code=normCode($('#jCode').value),name=$('#jName').value.trim(),n=clamp(Math.round(+$('#jN').value)||1,1,8);
  if(!code||!name){toast('اكتب الكود واسم العائلة');return;}
  try{
    const iv=await db.doc('app/inv').get(),codes=iv.exists?(iv.data().codes||{}):{};
    if(!codes[code]){toast('الكود غير صحيح، تأكد منه');return;}
    const fs=await db.collection('fam').get();
    if(fs.docs.some(d=>d.id!==me.uid&&d.data().code===code)){toast('هذا الكود استُخدم من عائلة ثانية');return;}
    const f=normFam(me.uid,{name,code,expected:n,ts:Date.now(),cfg:{pos:J(S.cfg.pos),neg:J(S.cfg.neg)}});
    await db.doc('fam/'+me.uid).set({name:f.name,code:f.code,expected:f.expected,ts:f.ts,cfg:J(f.cfg)});
    S.fams[me.uid]=f;subFam(me.uid);sortKids();toast('انضممتم للتحدي! الحين أضف أبناءك');go('kids');openKidEditor();
  }catch(e){console.warn(e);toast('تعذّر الانضمام. اطلب من الرئيس يعطيك صلاحية «مشارك» من قائمة المشاركة');}
}
function openInvite(){
  openSheet('<form id="invForm" autocomplete="off"><h2>دعوة عائلة جديدة</h2><label class="lbl" for="ownFam">اسم عائلتك أنت</label><input class="field" id="ownFam" maxlength="24" value="'+esc(S.cfg.famName||'')+'" placeholder="مثال: عائلة الشافعي">'
   +'<label class="lbl" for="invLabel">اسم العائلة المدعوة</label><input class="field" id="invLabel" maxlength="24" required placeholder="مثال: عائلة أختي"><div class="row" style="margin-top:14px"><button class="btn primary" type="submit">إنشاء الكود</button><button class="btn" type="button" data-act="close">إلغاء</button></div></form>',{});
  setTimeout(()=>{const n=$('#invLabel');if(n)n.focus();},50);
}
function createInvite(){
  const label=($('#invLabel').value||'').trim(),own=($('#ownFam').value||'').trim();if(!label)return;
  let code=genCode();while(S.inv[code])code=genCode();
  S.inv[code]={label,ts:Date.now()};if(own&&own!==S.cfg.famName){S.cfg.famName=own;persistCfg();}persistInv();
  setSheet('<h2>كود «'+esc(label)+'»</h2><div class="codebox" dir="ltr">'+esc(fmtCode(code))+'</div>'
   +'<ol class="steps"><li>أرسل الكود للعائلة.</li><li>من قائمة <b>المشاركة (Share)</b> في أعلى الصفحة أعطهم صلاحية <b>مشارك (Contributor)</b> على هذه الصفحة. الكود لا يغني عن هذه الخطوة.</li><li>يفتحون الصفحة، ويدخلون الكود واسم عائلتهم وعدد أبنائهم، ثم يضيفون الأبناء.</li></ol>'
   +'<div class="row" style="justify-content:center"><button class="btn gold" type="button" data-act="copycode" data-id="'+code+'">نسخ الكود</button><button class="btn" type="button" data-act="close">تم</button></div>');
  if(view==='kids')renderKids();
}
async function copyCode(code){
  const t=fmtCode(code);try{await navigator.clipboard.writeText(t);toast('تم نسخ الكود');}catch(e){toast('الكود: '+t+' (انسخه يدويًا)');}
}
function removeFamily(uid){
  const f=S.fams[uid];if(!f||!db)return;
  const ks=S.kids.filter(k=>k.fam===uid);S.kids=S.kids.filter(k=>k.fam!==uid);delete S.fams[uid];if(famSubs[uid]){try{famSubs[uid]();}catch(e){}delete famSubs[uid];}
  delete S.inv[f.code];persistInv();
  enqueue(async()=>{for(const k of ks)await db.doc('fam/'+uid).collection('kids').doc(k.id).delete();await db.doc('fam/'+uid).delete();});
  render();toast('أُزيلت العائلة');
}
function openFeed(){
  const rows=[];S.kids.forEach(k=>k.log.forEach(l=>rows.push({k,l})));rows.sort((a,b)=>b.l.ts-a.l.ts);
  const multi=famList().length>1;
  openSheet('<div class="sheet-head"><div class="grow"><h2>آخر الحركات</h2><div class="sub">كل ما حصل للأبناء '+(multi?'في كل العائلات':'')+'</div></div><button class="btn small" type="button" data-act="close">تم</button></div>'
   +(rows.length?'<div class="feed">'+rows.slice(0,40).map(o=>'<div class="frow"><i style="background:'+famColor(o.k.fam)+'"></i><div class="grow"><b>'+esc(o.k.name)+'</b>'+(multi?' <span class="sub">'+esc(famName(o.k.fam))+'</span>':'')+'<div class="sub">'+esc(o.l.t)+' · '+ago(o.l.ts)+'</div></div><span class="chip '+(o.l.p<0?'neg':'')+'">'+(o.l.p>0?'+':'')+o.l.p+'</span></div>').join('')+'</div>':'<div class="panel empty"><div class="big">لا حركات بعد</div><p class="sub">أول نقطة تُضاف تظهر هنا.</p></div>'),{});
}

function photoPrevHtml(){return draft&&draft.photo?'<img alt="" src="'+draft.photo+'">':'<img class="sp" alt="" src="'+avatarURL(draft.av,false)+'">';}
function swatches(key,list){return list.map((c,i)=>'<button type="button" class="sw" style="background:'+c+'" data-act="av" data-k="'+key+'" data-v="'+i+'" aria-pressed="'+(draft.av[key]===i)+'" aria-label="خيار '+(i+1)+'"></button>').join('');}
function builderHtml(){
  const g=draft.av.g==='f'?'f':'m';
  return '<div class="bigav"><img alt="معاينة الشخصية" src="'+avatarURL(draft.av,false)+'"></div><div><div class="lbl" style="margin-top:0">النوع</div><div class="row"><button type="button" class="btn opt" data-act="avg" data-v="m" aria-pressed="'+(g==='m')+'">ولد</button><button type="button" class="btn opt" data-act="avg" data-v="f" aria-pressed="'+(g==='f')+'">بنت</button></div>'
   +'<div class="lbl">البشرة</div><div>'+swatches('sk',SKIN)+'</div>'
   +'<div class="lbl">الرأس</div><div class="row">'+headsOf(g).map(x=>'<button type="button" class="btn opt" data-act="av" data-k="st" data-v="'+x.i+'" aria-pressed="'+(draft.av.st===x.i)+'">'+x.h.n+'</button>').join('')+'</div>'
   +'<div class="lbl">لون الشعر أو القبعة أو الطرحة</div><div>'+swatches('hc',HAIRC)+'</div><div class="lbl">لون القميص</div><div>'+swatches('sh',SHIRT.slice(0,8))+'</div></div>';
}
function openKidEditor(id){
  const k=id?kidById(id):null;
  if(k&&!canCtl(k))return;
  draft=k?{id:k.id,name:k.name,age:k.age,photo:k.photo,av:Object.assign({},k.av)}:{id:null,name:'',age:'',photo:null,av:avatarFrom(S.kids.length)};
  openSheet('<form id="kidForm" autocomplete="off"><h2>'+(k?'تعديل بيانات '+esc(k.name):'إضافة ابن أو ابنة')+'</h2>'
   +'<label class="lbl" for="kName">الاسم</label><input class="field" id="kName" maxlength="24" required value="'+esc(draft.name)+'" placeholder="مثال: خالد">'
   +'<label class="lbl" for="kAge">العمر</label><input class="field" id="kAge" type="number" inputmode="numeric" min="1" max="30" value="'+esc(draft.age)+'" placeholder="مثال: 9">'
   +'<div class="lbl">الصورة (اختيارية)</div><div class="row"><div class="photo-prev" id="photoPrev">'+photoPrevHtml()+'</div><label class="btn small" for="kPhoto">رفع صورة</label><input id="kPhoto" type="file" accept="image/*" hidden><button class="btn small" type="button" data-act="photodel">إزالة الصورة</button></div>'
   +'<p class="sub">بدون صورة، تظهر شخصيته الكرتونية في الشهادة.</p><h3 style="margin-top:18px">شخصيته في المغامرة</h3><div class="builder" id="builder">'+builderHtml()+'</div>'
   +'<div class="row" style="margin-top:20px"><button class="btn primary" type="submit">حفظ</button><button class="btn" type="button" data-act="close">إلغاء</button>'+(k?'<button class="btn neg" type="button" data-act="delkid" data-confirm>حذف الابن</button>':'')+'</div></form>',{editor:true});
  setTimeout(()=>{const n=$('#kName');if(n&&!k)n.focus();},50);
}
function resizePhoto(file){return new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>{const im=new Image();im.onload=()=>{const s=Math.min(im.width,im.height),cv=mk(176,176);cv.getContext('2d').drawImage(im,(im.width-s)/2,(im.height-s)/2,s,s,0,0,176,176);res(cv.toDataURL('image/jpeg',.82));};im.onerror=rej;im.src=fr.result;};fr.onerror=rej;fr.readAsDataURL(file);});}
function saveKid(){
  if(!draft)return;const name=($('#kName').value||'').trim();if(!name){$('#kName').focus();return;}
  const age=($('#kAge').value||'').trim();
  if(draft.id){const k=kidById(draft.id);if(k&&canCtl(k)){k.name=name;k.age=age;k.photo=draft.photo;k.av=draft.av;persistKid(k);}}
  else{const fam=isGuest()?me.uid:'',k=normKid({id:uid(),fam,name,age,photo:draft.photo,av:draft.av,pts:0,log:[],certs:[],order:S.kids.filter(x=>x.fam===fam).length});S.kids.push(k);sortKids();persistKid(k);}
  const wasNew=!draft.id;closeSheet();render();
  const f=myFam(),more=isGuest()&&f&&wasNew&&myKids().length<f.expected;
  toast(more?'تمت الإضافة. أضف ابنك التالي ('+myKids().length+' من '+f.expected+')':wasNew?'تمت الإضافة. الآن أضف السلوكيات وابدأ المغامرة':'تم حفظ التعديلات');
  if(more)setTimeout(()=>{if(!sheetOpen)openKidEditor();},500);
}
function delKid(){if(!draft||!draft.id)return;const id=draft.id,k=kidById(id);if(!k||!canCtl(k))return;S.kids=S.kids.filter(x=>x.id!==id);delete disp[id];persistRemove(k);closeSheet();render();toast('تم حذف الابن');}

/* ================= behaviours ================= */
const SUGG={pos:[['صلّى في وقتها',5],['بَرّ والديه',5],['ذاكر دروسه',4],['ساعد في البيت',3],['رتّب غرفته',2],['قال الصدق',3],['حفظ آية أو دعاء',4],['ساعد إخوته',3]],neg:[['تأخر عن الصلاة',3],['ضرب أخاه',5],['كذب',5],['ترك الفوضى',2],['أطال في استخدام الجوال',3],['رفع صوته على والديه',4]]};
function behCol(type){
  const pos=type==='pos',list=pos?BH().pos:BH().neg,sg=SUGG[type].map((s,i)=>({s,i})).filter(o=>!list.some(b=>b.t===o.s[0]));
  return '<section class="panel '+(pos?'posp':'negp')+'"><h3>'+(pos?'سلوكيات إيجابية (تُضاف نقاطها)':'سلوكيات سلبية (تُخصم نقاطها)')+'</h3><div>'
   +(list.length?list.map(b=>'<div class="bitem"><span class="t">'+esc(b.t)+'</span><button class="btn step" type="button" data-act="bp" data-type="'+type+'" data-id="'+b.id+'" data-d="-1" aria-label="أنقص النقاط">−</button><span class="chip '+(pos?'':'neg')+'">'+(pos?'+':'-')+b.p+'</span><button class="btn step" type="button" data-act="bp" data-type="'+type+'" data-id="'+b.id+'" data-d="1" aria-label="زد النقاط">+</button><button class="btn small" type="button" data-act="bdel" data-type="'+type+'" data-id="'+b.id+'" data-confirm>حذف</button></div>').join(''):'<p class="sub" style="padding:10px 0">ما أضفت شيء بعد، اكتب سلوكًا ونقاطه بالأسفل.</p>')
   +'</div><form class="addrow" data-form="beh" data-type="'+type+'"><input class="field" name="t" maxlength="40" required placeholder="'+(pos?'مثال: ساعد في ترتيب البيت':'مثال: تأخر عن النوم')+'" aria-label="اسم السلوك"><input class="field" name="p" type="number" min="1" max="100" value="'+(pos?3:2)+'" inputmode="numeric" aria-label="النقاط"><button class="btn '+(pos?'pos':'neg')+'" type="submit">إضافة</button></form>'
   +(sg.length?'<p class="sub" style="margin-top:14px">اقتراحات سريعة (اضغط لإضافتها):</p><div class="sugg">'+sg.map(o=>'<button class="btn small" type="button" data-act="sugg" data-type="'+type+'" data-i="'+o.i+'">'+esc(o.s[0])+' '+(pos?'+':'-')+o.s[1]+'</button>').join('')+'</div>':'')+'</section>';
}
function ptsBody(){return '<p class="sub">السلوك الإيجابي يرفع الابن مستويات على الخريطة، والسلبي ينزله. أنت تحدد النقاط'+(isGuest()?' لأبناء عائلتك.':(Object.keys(S.fams).length?' لأبنائك، ولكل عائلة سلوكياتها الخاصة.':'.'))+'</p><div class="bgrid" style="margin-top:10px">'+behCol('pos')+behCol('neg')+'</div>';}
function renderBehaviors(){V.innerHTML='<div class="view"><h2>نظام النقاط</h2>'+ptsBody()+'</div>';}
function addBeh(f){const t=f.t.value.trim(),p=clamp(Math.round(+f.p.value)||1,1,100),type=f.dataset.type;if(!t)return;(type==='pos'?BH().pos:BH().neg).push({id:uid(),t,p});persistBH();render();}

/* ================= round (map, period, goal, rewards) ================= */
function roundBodyRO(){
  const m=mapOf(),p=S.cfg.period,st=periodState();
  return '<section class="panel"><h3>الخريطة الحالية: '+esc(m.name)+'</h3><div class="maps"><div class="map-card" style="pointer-events:none"><canvas width="'+MW+'" height="'+MH+'" data-map="'+m.id+'"></canvas><b>'+esc(m.name)+'</b><small>'+esc(m.tag)+'</small></div></div></section>'
   +'<section class="panel"><h3>تفاصيل الجولة</h3><div class="row"><span class="pill">الجولة '+curRound()+'</span><span class="pill">الهدف '+goal()+' نقطة</span>'
   +(p&&p.start&&p.end?'<span class="pill">'+esc(fmtDay(p.start))+' ← '+esc(fmtDay(p.end))+'</span>':'<span class="pill">بدون فترة محددة</span>')+(st.k==='in'?'<span class="pill">باقي '+daysTxt(st.left)+'</span>':'')+'</div></section>'
   +'<section class="panel"><h3>مكافآت المحطات</h3>'+[25,50,75,100].map(x=>'<div class="rw"><span>LV '+x+'</span><span>'+esc(S.cfg.rewards[x]||'—')+'</span></div>').join('')+'</section>';
}
function roundBody(){
  if(isGuest())return roundBodyRO();
  const p=S.cfg.period||{start:'',end:''};
  return '<section class="panel"><h3>اختر الخريطة</h3><p class="sub">الأبناء كلهم يتنافسون على الخريطة نفسها، وتقدر تغيّرها وقت ما تبي ويبقى تقدّمهم كما هو.</p><div class="maps">'
   +MAP_LIST.map(m=>'<button class="map-card" type="button" data-act="pickmap" data-id="'+m.id+'" aria-pressed="'+(m.id===S.cfg.mapId)+'"><canvas width="'+MW+'" height="'+MH+'" data-map="'+m.id+'"></canvas><b>'+m.name+'</b><small>'+m.tag+'</small><small class="ft">'+m.feat+'</small></button>').join('')
   +'</div><div class="row" style="margin-top:14px"><button class="btn gold" type="button" data-act="prevcert">معاينة شهادة هذه الخريطة</button></div></section>'
   +'<section class="panel"><h3>فترة المغامرة</h3><p class="sub">النقاط تُسجَّل خلال هذه الفترة فقط. اتركها فاضية إذا ما تبي تحديد وقت.</p><div class="two"><div><label class="lbl" for="pStart">من تاريخ</label><input class="field" id="pStart" type="date" value="'+esc(p.start)+'"></div><div><label class="lbl" for="pEnd">إلى تاريخ</label><input class="field" id="pEnd" type="date" value="'+esc(p.end)+'"></div></div><div class="row" style="margin-top:6px"><button class="btn small" type="button" data-act="pclear">إلغاء الفترة</button></div></section>'
   +'<section class="panel"><h3>نقاط الوصول إلى النهاية</h3><p class="sub">كم نقطة يحتاج الابن ليوصل المستوى 100؟ كل ما قلّ الرقم صارت الخريطة أسرع.</p><input class="field" id="goalIn" type="number" min="10" max="5000" inputmode="numeric" value="'+goal()+'" style="max-width:200px"></section>'
   +'<section class="panel"><h3>مكافآت المحطات وصناديق الكنز</h3><p class="sub">عند المحطات 25 و50 و75 يوجد صندوق كنز على الخريطة، وعندما يصله الابن ينفجر ويكشف المكافأة التي كتبتها. إذا تركت المكافأة فارغة أو ضغطت «حذف» فلن يظهر الصندوق في هذه المحطة ولن ينفتح أي كنز.</p>'
   +[25,50,75,100].map(m=>'<div class="rw e"><span>LV '+m+'</span><input class="field" data-rw="'+m+'" maxlength="60" value="'+esc(S.cfg.rewards[m]||'')+'" placeholder="مثال: '+({25:'حلا يختاره',50:'نزهة في الحديقة',75:'يوم بدون واجبات منزلية',100:'هدية كبيرة'}[m])+'" aria-label="مكافأة المستوى '+m+'"><button class="btn small neg" type="button" data-act="rwdel" data-m="'+m+'" aria-label="حذف مكافأة المستوى '+m+'">حذف</button></div>').join('')+'</section>'
   +'<section class="panel"><h3>تصفير النقاط: جولة جديدة</h3><p class="sub">تصفّر نقاط الجميع ليبدأوا من جديد، وتبقى الشهادات التي حصلوا عليها.</p><button class="btn gold" type="button" data-act="newround" data-confirm>ابدأ جولة جديدة</button></section>';
}
function paintMaps(){$$('.maps canvas').forEach((cv,i)=>setTimeout(()=>{if(!cv.isConnected||cv.dataset.done)return;cv.dataset.done='1';cv.getContext('2d').drawImage(buildScene(cv.dataset.map).cv,0,0);},i*40));}
function newRound(){S.kids.forEach(k=>{k.pts=0;k.log=[];k.sad=false;k.ck=null;persistKid(k);disp[k.id]=0;});S.cfg.round=curRound()+1;persistCfg();toast('بدأت الجولة '+curRound()+'. الكل من جديد عند البداية');render();}


/* ================= settings: family, children, sound, points, round, backup, password ================= */
const SETOPEN={};let pwUntil=0,pwActUntil=0,pwAfter=null;
/* the password lives on this device only (a salted hash, never the word itself) and is not part of backups */
const pwGet=()=>{try{return JSON.parse(localStorage.getItem('kafo.pw')||'null');}catch(e){return null;}};
const hasPw=()=>!!pwGet();
const pwOK=()=>!hasPw()||pwUntil>Date.now();
const pwActOK=()=>pwOK()||pwActUntil>Date.now();
async function pwHash(pw,salt){
  const data=new TextEncoder().encode(salt+':'+pw);
  if(window.crypto&&crypto.subtle){try{const b=await crypto.subtle.digest('SHA-256',data);return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');}catch(e){}}
  let h=5381;for(const c of data)h=((h*33)^c)>>>0;return 'x'+h.toString(16);
}
async function pwSave(pw){const salt=genCode()+genCode();const h=await pwHash(pw,salt);try{localStorage.setItem('kafo.pw',JSON.stringify({s:salt,h}));return true;}catch(e){return false;}}
async function pwCheck(pw){const o=pwGet();if(!o)return true;return (await pwHash(pw,o.s))===o.h;}
/* run fn now, or after the password is entered (used by actions outside the settings page, like editing a child) */
function guardPw(fn){if(pwActOK()){fn();return;}pwAfter=fn;openSheet(pwFormHtml('أدخل كلمة السر لتكمل'),{});setTimeout(()=>{const i=$('#pwIn');if(i)i.focus();},60);}
function pwFormHtml(msg){
  return '<form id="pwForm" autocomplete="off" style="text-align:center"><span class="ico i-lock" style="width:46px;height:46px;color:var(--gold)"></span><h2>'+esc(msg)+'</h2>'
   +'<input class="field" id="pwIn" type="password" autocomplete="off" maxlength="40" placeholder="كلمة السر" aria-label="كلمة السر" style="text-align:center;max-width:260px;margin:10px auto">'
   +'<div class="row" style="justify-content:center"><button class="btn primary" type="submit">فتح</button><button class="btn" type="button" data-act="close">إلغاء</button></div>'
   +'<p style="margin-top:8px"><button class="btn small" type="button" data-act="pwforgot">نسيت كلمة السر؟</button></p></form>';
}
async function doUnlock(){
  const i=$('#pwIn');if(!i)return;const ok=await pwCheck(i.value);
  if(!ok){toast('كلمة السر غير صحيحة');i.value='';i.focus();return;}
  if(view==='settings'&&!sheetOpen)pwUntil=Date.now()+3*3600e3;else pwActUntil=Date.now()+5*60e3;tone(SND.lvl);
  const fn=pwAfter;pwAfter=null;if(sheetOpen)closeSheet();render();if(fn)setTimeout(fn,280);
}
function forgotSheet(){
  openSheet('<div class="empty"><div class="big" style="font-size:32px;color:var(--neg)">الرجوع إلى الإعدادات الأصلية</div><p style="margin-top:8px">سيُحذف كل شيء نهائيًا: الأبناء والنقاط والشهادات والمكافآت وكلمة السر، وترجع اللعبة كأنها جديدة. لا يمكن التراجع.</p>'
   +'<div class="row" style="justify-content:center;margin-top:14px"><button class="btn neg" type="button" data-act="wipego" data-confirm>نعم، احذف كل شيء</button><button class="btn" type="button" data-act="close">إلغاء</button></div></div>',{});
}
async function wipeAll(){
  try{S.kids.forEach(k=>{if(canCtl(k))persistRemove(k);});}catch(e){}
  if(db&&!isGuest()){S.cfg=DEF_CFG();persistCfg();}
  try{await wq;}catch(e){}
  try{['kafo.v1','kafo.pw','kafo.vol','kafo.snd'].forEach(k=>localStorage.removeItem(k));}catch(e){}
  S.kids=[];S.cfg=DEF_CFG();pwUntil=0;pwActUntil=0;location.reload();
}
function toggleSound(){
  if(isGuest()){try{localStorage.setItem('kafo.snd',soundOn()?'0':'1');}catch(e){}}else{S.cfg.sound=!S.cfg.sound;persistCfg();}
  updateSound();if(soundOn())tone(SND.pos);
}
const volIcon=()=>'<span class="ico i-mute"></span>';
function famSec(){
  const nm=isGuest()?((myFam()||{}).name||''):(S.cfg.famName||''),ks=myKids();
  return '<label class="lbl" for="famIn">اسم العائلة</label><input class="field" id="famIn" maxlength="24" value="'+esc(nm)+'" placeholder="مثال: عائلة الشافعي" autocomplete="off">'
   +'<div class="lbl" style="margin-top:18px">الأبناء ('+ks.length+')</div>'
   +(ks.length?ks.map(k=>'<div class="srow"><div class="av">'+avHtml(k)+'</div><div class="grow"><b>'+esc(k.name)+'</b><div class="sub">'+(k.age!==''?'العمر '+esc(k.age)+' · ':'')+k.pts+' نقطة</div></div><button class="btn small" type="button" data-act="editkid" data-id="'+k.id+'">تعديل</button></div>').join(''):'<p class="sub">ما أضفت أحد بعد.</p>')
   +'<div class="row"><button class="btn primary" type="button" data-act="addkid">+ إضافة ابن أو ابنة</button></div><p class="sub">للحذف: اضغط «تعديل» على الابن ثم «حذف الابن».</p>';
}
function soundSec(){
  const on=soundOn();
  return '<div class="row"><button class="btn '+(on?'pos':'neg')+'" type="button" data-act="sndtoggle">'+(on?'الصوت يعمل (اضغط لكتمه)':'الصوت مكتوم (اضغط لتشغيله)')+'</button></div>'
   +'<label class="lbl" for="volFx">المؤثرات الصوتية</label><p class="sub" style="margin:0 4px">أصوات الأزرار والنقاط والاحتفالات.</p>'
   +'<div class="vol"><span class="ico i-mute"></span><input type="range" id="volFx" min="0" max="100" step="5" value="'+VOL.fx+'" aria-label="مستوى المؤثرات الصوتية"><span class="ico i-sound"></span><b id="volFxN">'+VOL.fx+'</b></div>'
   +'<label class="lbl" for="volBg">صوت الخلفية</label><p class="sub" style="margin:0 4px">البحر والرياح وأصوات كل خريطة.</p>'
   +'<div class="vol"><span class="ico i-mute"></span><input type="range" id="volBg" min="0" max="100" step="5" value="'+VOL.bg+'" aria-label="مستوى صوت الخلفية"><span class="ico i-sound"></span><b id="volBgN">'+VOL.bg+'</b></div>'
   +'<p class="sub">حرّك الشريط يمينًا لرفع الصوت ويسارًا لتقليله.</p><div class="row"><button class="btn gold" type="button" data-act="sndtest">تجربة الصوت</button></div>';
}
function ptsSec(){return '<p class="sub">نظام النقاط له تبويب خاص في الشريط السفلي عشان توصله بسرعة.</p><div class="row"><button class="btn gold" type="button" data-act="gobeh">افتح نظام النقاط</button></div>';}
function pwSec(){
  const has=hasPw();
  return (has?'<p class="sub">كلمة السر مفعّلة: لا أحد يفتح الإعدادات ولا يعدّل الأبناء إلا بها.</p>':'<p class="sub">ضع كلمة سر تحمي الإعدادات وتعديل الأبناء من العبث. (على هذا الجهاز فقط)</p>')
   +'<form id="pwSetForm" autocomplete="off"><label class="lbl" for="pwA">'+(has?'كلمة السر الجديدة':'كلمة السر')+'</label><input class="field" id="pwA" type="password" maxlength="40" autocomplete="new-password" placeholder="4 أحرف أو أرقام على الأقل">'
   +'<label class="lbl" for="pwB">أعد كتابتها</label><input class="field" id="pwB" type="password" maxlength="40" autocomplete="new-password">'
   +'<div class="row" style="margin-top:8px"><button class="btn primary" type="submit">'+(has?'تغيير كلمة السر':'حفظ كلمة السر')+'</button>'+(has?'<button class="btn neg" type="button" data-act="pwoff" data-confirm>إزالة كلمة السر</button>':'')+'</div></form>';
}
function resetSec(){return '<p class="sub">يحذف كل شيء: الأبناء والنقاط والشهادات والمكافآت وكلمة السر، وترجع اللعبة كأنها جديدة. استخدمه فقط إذا بغيت تبدأ من الصفر.</p><div class="row"><button class="btn neg" type="button" data-act="pwforgot">الرجوع إلى الإعدادات الأصلية</button></div>';}
function secHtml(id,title,sub,body){return '<details class="panel set" data-sec="'+id+'"'+(SETOPEN[id]?' open':'')+'><summary><span>'+title+'</span><small>'+sub+'</small></summary><div class="setbody">'+body+'</div></details>';}
function langSec(){
  const en=I18N.lang==='en';
  return '<div class="row"><button class="btn opt" type="button" data-act="setlang" data-v="ar" aria-pressed="'+(!en)+'" data-nt>العربية</button><button class="btn opt" type="button" data-act="setlang" data-v="en" aria-pressed="'+en+'" data-nt>English</button></div>'
   +'<p class="sub" data-nt>'+(en?'The whole game switches to English. Kids\' names and the behaviors you typed yourself stay as you wrote them.':'تتحول اللعبة كلها للإنجليزية. أسماء الأبناء والسلوكيات اللي كتبتها بنفسك تبقى كما هي.')+'</p>';
}
function renderSettings(){
  if(!pwOK()){
    V.innerHTML='<div class="view"><div class="panel lockp"><span class="ico i-lock"></span><h2>الإعدادات مقفلة</h2><p class="sub">اكتب كلمة السر لتفتحها.</p>'
     +'<form id="pwForm" autocomplete="off"><input class="field" id="pwIn" type="password" autocomplete="off" maxlength="40" placeholder="كلمة السر" aria-label="كلمة السر"><div class="row" style="justify-content:center"><button class="btn primary" type="submit">فتح</button></div></form>'
     +'<p style="margin-top:6px"><button class="btn small" type="button" data-act="pwforgot">نسيت كلمة السر؟</button></p></div></div>';
    return;
  }
  const g=isGuest();
  V.innerHTML='<div class="view"><h2>الإعدادات</h2><p class="sub">'+esc(famName(g?me.uid:''))+'</p>'
   +secHtml('lang','Language / اللغة','العربية · English',langSec()).replace('<summary><span>','<summary data-nt><span>')
   +secHtml('fam','العائلة والأبناء','اسم العائلة، وإضافة الأبناء وتعديلهم',famSec())
   +secHtml('snd','المؤثرات الصوتية','التحكم بصوت المؤثرات وصوت الخلفية',soundSec())
   +secHtml('pts','نظام النقاط','اختصار لتبويب النقاط في الشريط',ptsSec())
   +(g?'':secHtml('round','الجولة','الخريطة والفترة والهدف والمكافآت وتصفير النقاط',roundBody()))
   +(g||db?'':secHtml('bk','نسخة احتياطية','حفظ نسخة من بيانات اللعبة أو استعادتها',backupPanel().replace(/<section class="panel" style="margin-top:14px">/,'<section>')))
   +secHtml('pw','كلمة السر',hasPw()?'مفعّلة · غيّرها أو أزلها':'غير مفعّلة · ضع كلمة تحمي الإعدادات',pwSec())
   +(g?'':secHtml('rst','الرجوع إلى الإعدادات الأصلية','حذف كل شيء وبدء اللعبة من جديد',resetSec()))
   +'</div>';
  if(SETOPEN.round)paintMaps();
}

/* ================= certificates ================= */
function renderCerts(){
  V.innerHTML='<div class="view"><div class="sec-head"><div><h2>الشهادات</h2><p class="sub">لكل ابن ملف خاص. اضغط «الشهادات» لترى عوالمه كلها، وكل عالم أنهاه تظهر شهادته مضيئة بالأصفر للعرض والحفظ.</p></div><button class="btn gold" data-act="prevcert">معاينة شهادة</button></div>'
   +(S.kids.length?'<div class="cgrid">'+S.kids.map(k=>{const n=new Set(k.certs.map(c=>c.mapId).filter(x=>MAPS[x])).size;
     return '<article class="kcard" style="grid-template-columns:60px minmax(0,1fr)"><div class="av">'+avHtml(k)+'</div><div class="grow"><div class="nm">'+esc(k.name)+'</div><div class="meta">'+(n?'شهادات '+n+' من '+MAP_LIST.length+' عوالم':'لا شهادات بعد')+'</div></div><div style="grid-column:1/-1"><button class="btn gold small" type="button" data-act="kcerts" data-id="'+k.id+'">الشهادات</button></div></article>';}).join('')+'</div>'
     :'<div class="panel empty"><div class="big">لا أبناء بعد</div><p class="sub">أضف ابنًا من صفحة «الأبناء»، وتظهر هنا شهاداته.</p></div>')+'</div>';
}
/* one child's file: every world as an icon; a world he finished glows yellow with its certificate, the others stay dim and empty */
function certsHtml(k){
  const by={};k.certs.forEach(c=>{if(MAPS[c.mapId])(by[c.mapId]=by[c.mapId]||[]).push(c);});
  const n=Object.keys(by).length;
  return '<div class="sheet-head"><div class="av">'+avHtml(k)+'</div><div class="grow"><h2>شهادات '+esc(k.name)+'</h2><div class="sub">'+(n?'أنهى '+n+' من '+MAP_LIST.length+' عوالم':'لم ينهِ أي عالم بعد')+'</div></div><button class="btn small" type="button" data-act="close">تم</button></div>'
   +'<div class="maps wt-grid">'+MAP_LIST.map(m=>{const cs=(by[m.id]||[]).slice().sort((a,b)=>a.ts-b.ts),on=cs.length>0;
     return '<div class="map-card wt '+(on?'on':'off')+'" aria-label="'+esc(m.name)+(on?'':'، لا توجد شهادة')+'"><canvas width="'+MW+'" height="'+MH+'" data-map="'+m.id+'" role="img" aria-label="'+esc(m.name)+'"></canvas><b>'+esc(m.name)+'</b>'
      +(on?(cs.length>1?'<small>'+cs.length+' شهادات</small>':'')+cs.map(c=>'<button class="btn gold small wtb" type="button" data-act="certshow" data-back="1" data-id="'+k.id+'" data-cid="'+c.id+'">عرض وحفظ الشهادة'+(cs.length>1?' · الجولة '+(c.round||1):'')+'</button>').join(''):'')+'</div>';}).join('')+'</div>';
}
function openKidCerts(id){
  const k=kidById(id);if(!k)return;openSheet(certsHtml(k),{});
  $$('#sheetHost canvas[data-map]').forEach((cv,i)=>setTimeout(()=>{if(cv.isConnected)cv.getContext('2d').drawImage(buildScene(cv.dataset.map).cv,0,0);},i*40));
}
async function showCert(o,title,back){
  openSheet('<h2>'+esc(title)+'</h2><p class="sub">جارٍ تجهيز الشهادة…</p>',{});
  try{const cv=await makeCert(o),blob=await new Promise(r=>cv.toBlob(r,'image/png')),url=URL.createObjectURL(blob);certBlob={blob,name:o.name||'بطل'};
    if(!sheetOpen)return;
    setSheet('<h2>'+esc(title)+'</h2><img class="certimg" src="'+url+'" alt="الشهادة"><div class="row" style="justify-content:center"><button class="btn primary" type="button" data-act="certsave">حفظ الصورة للطباعة</button>'+(back?'<button class="btn" type="button" data-act="kcerts" data-id="'+back+'">رجوع للعوالم</button>':'')+'<button class="btn" type="button" data-act="close">إغلاق</button></div><p class="sub" style="text-align:center">بمقاس A4، احفظ الصورة ثم اطبعها.</p>');
  }catch(e){console.warn(e);if(sheetOpen)setSheet('<h2>تعذّر إنشاء الشهادة</h2><p class="sub">حاول مرة ثانية.</p><button class="btn" type="button" data-act="close">إغلاق</button>');}
}
async function saveCert(){
  if(!certBlob)return;
  try{const dl=window.claude&&window.claude.use?await window.claude.use('downloads'):null;if(!dl){toast('اضغط مطولًا على الصورة لحفظها');return;}await dl.save({filename:'شهادة كفو عليك - '+certBlob.name+'.png',data:certBlob.blob});toast('تم حفظ الشهادة');}
  catch(e){if(e&&e.code==='declined')return;toast('تعذّر الحفظ، اضغط مطولًا على الصورة لحفظها');}
}
function certOpts(k,ct){return{mapId:ct.mapId,name:ct.name||k.name,av:effAv(k,ct.mapId,100),photo:k.photo,goal:ct.goal||goal(),period:ct.period,ts:ct.ts};}

/* ---- backup (only when the data lives in this browser): save to a file, restore from a file ---- */
function backupPanel(){
  if(db)return'';
  return '<section class="panel" style="margin-top:14px"><h3>نسخة احتياطية</h3><p class="sub">بيانات الأبناء محفوظة داخل هذا الجهاز فقط. احفظ نسخة بين فترة وأخرى، أو استخدمها لنقل كل شي إلى جهاز ثاني.</p>'
   +'<div class="row"><button class="btn gold" type="button" data-act="bkexp">حفظ نسخة احتياطية</button><label class="btn" for="bkIn" tabindex="0">استعادة من نسخة</label><input id="bkIn" type="file" accept="application/json,.json" hidden></div></section>';
}
function exportBackup(){
  const d=new Date(),ds=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const blob=new Blob([JSON.stringify({app:'kafo',v:1,ts:Date.now(),cfg:S.cfg,kids:S.kids})],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='كفو-عليك-نسخة-'+ds+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);toast('تم حفظ النسخة الاحتياطية');
}
let pendingBk=null;
function readBackup(file){
  if(!file)return;const fr=new FileReader();
  fr.onload=()=>{let o=null;try{o=JSON.parse(String(fr.result));}catch(e){}
    if(!o||o.app!=='kafo'||!Array.isArray(o.kids)){toast('هذا الملف ما هو نسخة من «كفو عليك»');return;}
    pendingBk=o;openSheet('<div class="empty"><div class="big" style="font-size:34px;color:var(--brand)">استعادة النسخة؟</div><p style="margin-top:6px">فيها '+o.kids.length+' من الأبناء. بيانات هذا الجهاز الحالية تُستبدل بها.</p>'
      +'<div class="row" style="justify-content:center;margin-top:14px"><button class="btn gold" type="button" data-act="bkgo">نعم، استعد</button><button class="btn" type="button" data-act="close">إلغاء</button></div></div>',{});};
  fr.onerror=()=>toast('تعذّرت قراءة الملف');fr.readAsText(file);
}
function applyBackup(){
  const o=pendingBk;pendingBk=null;if(!o)return;
  S.cfg=Object.assign(DEF_CFG(),o.cfg||{});S.cfg.rewards=Object.assign({25:'',50:'',75:'',100:''},S.cfg.rewards||{});
  S.kids=o.kids.map(normKid);sortKids();persistLocal();closeSheet();go('home');toast('تمت استعادة النسخة');
}
document.addEventListener('change',e=>{if(e.target&&e.target.id==='bkIn'){readBackup(e.target.files&&e.target.files[0]);e.target.value='';}});

/* ================= actions + events ================= */
const ACT={
  pick(el){selectKid(el.dataset.id);},
  pm(el){openPop(el.dataset.id,el.dataset.t);},
  popclose(){closePop();},
  hudtoggle(){hudOpen=!hudOpen;refreshHud();},
  camzoom(){camZoom=!camZoom;renderHome();toast(camZoom?'الخريطة كاملة على الشاشة':'الخريطة مكبّرة');},
  camtop(){const c=camEl();if(!c)return;if(curGeo.hz)c.scrollTo({left:c.scrollWidth,behavior:camSmooth()});else c.scrollTo({top:0,behavior:camSmooth()});},
  cambot(){const c=camEl();if(!c)return;if(curGeo.hz)c.scrollTo({left:0,behavior:camSmooth()});else c.scrollTo({top:c.scrollHeight,behavior:camSmooth()});},
  fork(el){openFork(el.dataset.id);},
  rwdel(el){const m=el.dataset.m,i=$('[data-rw="'+m+'"]');S.cfg.rewards[m]='';if(i){i.value='';i.focus();}persistCfg();toast(+m<100?'تم حذف المكافأة، ولن يظهر صندوق عند المحطة '+m:'تم حذف المكافأة');},
  bkexp(){exportBackup();},
  bkgo(){applyBackup();},
  forkgo(el){forkChoose(el.dataset.id,el.dataset.v);},
  wardrobe(el){closePop();openWardrobe(el.dataset.id,el.dataset.hero?'hero':null);},
  wdhero(el){wdHero(el.dataset.v);},
  wdtab(el){if(wd){wd.tab=el.dataset.v;setSheet(wardrobeHtml(kidById(wd.id)));}},
  wdpick(el){wdPick(el.dataset.k,+el.dataset.v);},
  wdlater(){closeSheet();},
  noop(){},
  scenebg(){if(sel){sel=null;renderSel();}},
  give(el){give(el.dataset.id,el.dataset.bid,el.dataset.t);},
  undo(el){undoLast(el.dataset.id);},
  close(){closeSheet();},
  addkid(){guardPw(()=>openKidEditor());},
  editkid(el){const id=el.dataset.id;guardPw(()=>openKidEditor(id));},
  tohome(){closeSheet();closePop&&closePop();const sp=$('#splash');sp.classList.remove('gone');drawSplash();},
  setlang(el){if(el.dataset.v!==I18N.lang)setLang(el.dataset.v);},
  ptsunlock(){guardPw(()=>render());},
  sndtoggle(){toggleSound();render();},
  sndtest(){if(!soundOn()){toast('الصوت مكتوم، شغّله أولًا');return;}tone(SND.pos);AMB.gest=true;AMB.testUntil=Date.now()+5000;ambSync();toast('تسمع الآن صوت خلفية الخريطة الحالية');},
  pwforgot(){closeSheet();forgotSheet();},
  wipego(){wipeAll();},
  pwoff(){try{localStorage.removeItem('kafo.pw');}catch(e){}pwUntil=0;pwActUntil=0;render();toast('أُزيلت كلمة السر');},
  delkid(){delKid();},
  photodel(){if(!draft)return;draft.photo=null;$('#photoPrev').innerHTML=photoPrevHtml();},
  avg(el){if(!draft)return;const g=el.dataset.v==='f'?'f':'m';if(draft.av.g!==g){draft.av.g=g;if(HEADS[draft.av.st].g!==g)draft.av.st=defHead(g);$('#builder').innerHTML=builderHtml();$('#photoPrev').innerHTML=photoPrevHtml();}},
  av(el){if(!draft)return;draft.av[el.dataset.k]=+el.dataset.v;$('#builder').innerHTML=builderHtml();$('#photoPrev').innerHTML=photoPrevHtml();},
  gobeh(){closeSheet();go('beh');},
  gotoround(){go('round');},
  sugg(el){const t=el.dataset.type,s=SUGG[t][+el.dataset.i];(t==='pos'?BH().pos:BH().neg).push({id:uid(),t:s[0],p:s[1]});persistBH();render();},
  bp(el){const l=el.dataset.type==='pos'?BH().pos:BH().neg,b=l.find(x=>x.id===el.dataset.id);if(!b)return;b.p=clamp(b.p+(+el.dataset.d),1,100);persistBH();render();},
  bdel(el){const t=el.dataset.type,h=BH();if(t==='pos')h.pos=h.pos.filter(x=>x.id!==el.dataset.id);else h.neg=h.neg.filter(x=>x.id!==el.dataset.id);persistBH();render();},
  pickmap(el){S.cfg.mapId=el.dataset.id;persistCfg();$$('.map-card').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===S.cfg.mapId)));toast('الخريطة الآن: '+mapOf().name+' — '+mapOf().feat);tone(SND.pos);},
  prevcert(){showCert({mapId:S.cfg.mapId,name:'اسم البطل',av:avatarFrom(2),photo:null,goal:goal(),period:S.cfg.period,ts:Date.now()},'معاينة الشهادة');},
  pclear(){S.cfg.period=null;persistCfg();render();toast('أُلغيت الفترة');},
  newround(){newRound();},
  cert(el){const k=kidById(el.dataset.id);if(!k)return;const ct=k.certs.slice().reverse().find(c=>c.round===curRound())||k.certs[k.certs.length-1];if(!ct)return;closeSheet();showCert(certOpts(k,ct),'شهادة '+k.name);},
  certshow(el){const k=kidById(el.dataset.id);if(!k)return;const ct=k.certs.find(c=>c.id===el.dataset.cid);if(!ct)return;showCert(certOpts(k,ct),'شهادة '+(ct.name||k.name),el.dataset.back?k.id:null);},
  kcerts(el){openKidCerts(el.dataset.id);},
  certsave(){saveCert();},
  badges(el){closePop();closeSheet();openBadges(el.dataset.id);},
  feed(){closePop();openFeed();},
  invite(){openInvite();},
  copycode(el){copyCode(el.dataset.id);},
  invdel(el){delete S.inv[el.dataset.id];persistInv();renderKids();toast('أُلغي الكود');},
  famdel(el){removeFamily(el.dataset.id);}
};
function arm(el){el.classList.add('armed');el.dataset.orig=el.textContent;el.textContent='اضغط للتأكيد';setTimeout(()=>{if(el.isConnected&&el.classList.contains('armed')){el.classList.remove('armed');el.textContent=el.dataset.orig;}},3000);}
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act],[data-tab]');if(!el)return;
  if(el.dataset.tab){go(el.dataset.tab);return;}
  const a=el.dataset.act;
  if(a==='backdrop'){if(e.target===el)closeSheet();return;}
  if(el.hasAttribute('data-confirm')&&!el.classList.contains('armed')){arm(el);return;}
  if(ACT[a])ACT[a](el,e);
});
document.addEventListener('submit',e=>{e.preventDefault();const f=e.target;if(f.id==='kidForm')saveKid();else if(f.id==='joinForm')joinFamily();else if(f.id==='invForm')createInvite();else if(f.id==='pwForm')doUnlock();else if(f.id==='pwSetForm')setPwFromForm();else if(f.dataset&&f.dataset.form==='beh')addBeh(f);});
document.addEventListener('change',async e=>{
  const t=e.target;
  if(t.id==='kPhoto'&&t.files&&t.files[0]&&draft){try{draft.photo=await resizePhoto(t.files[0]);$('#photoPrev').innerHTML=photoPrevHtml();}catch(err){toast('تعذّر قراءة الصورة');}t.value='';}
  else if(t.id==='pStart'||t.id==='pEnd'){const s=$('#pStart').value,en=$('#pEnd').value;if(s&&en&&en<s){toast('تاريخ النهاية قبل البداية، عدّله');return;}S.cfg.period=(s||en)?{start:s,end:en}:null;persistCfg();}
  else if(t.id==='goalIn'){S.cfg.goal=clamp(Math.round(+t.value)||100,10,5000);t.value=S.cfg.goal;persistCfg();toast('الهدف الآن '+S.cfg.goal+' نقطة');}
  else if(t.dataset&&t.dataset.rw){S.cfg.rewards[t.dataset.rw]=t.value.trim();persistCfg();}
});
async function setPwFromForm(){
  const a=$('#pwA').value,b=$('#pwB').value;
  if(a.length<4){toast('كلمة السر لازم تكون 4 أحرف أو أرقام على الأقل');return;}
  if(a!==b){toast('الكلمتان غير متطابقتين');return;}
  if(await pwSave(a)){pwUntil=Date.now()+3*3600e3;render();toast('تم حفظ كلمة السر');tone(SND.lvl);}else toast('تعذّر حفظ كلمة السر على هذا الجهاز');
}
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.id==='volFx'){VOL.fx=clamp(+t.value|0,0,100);volSave();const n=$('#volFxN');if(n)n.textContent=VOL.fx;}
  else if(t.id==='volBg'){VOL.bg=clamp(+t.value|0,0,100);volSave();volApply();const n=$('#volBgN');if(n)n.textContent=VOL.bg;}
});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.id==='volFx'){tone(SND.pos);}
  else if(t.id==='volBg'){if(soundOn()&&VOL.bg>0){AMB.gest=true;AMB.testUntil=Date.now()+4500;ambSync();}}
  else if(t.id==='famIn'){const v=t.value.trim().slice(0,24);if(isGuest()){const f=myFam();if(f){f.name=v||'عائلة';persistFam(f);}}else{S.cfg.famName=v;persistCfg();}toast('تم حفظ اسم العائلة');const sb=$('#view .sub');if(sb&&view==='settings')sb.textContent=famName(isGuest()?me.uid:'');}
});
document.addEventListener('toggle',e=>{const d=e.target;if(d&&d.classList&&d.classList.contains('set')){SETOPEN[d.dataset.sec]=d.open;if(d.open&&d.dataset.sec==='round')paintMaps();}},true);
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(sheetOpen)closeSheet();else if(popCtx)closePop();else if(sel){sel=null;renderSel();}}
  else if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('actor')){e.preventDefault();selectKid(e.target.dataset.id);}
});
$('#soundBtn').addEventListener('click',()=>{toggleSound();if(view==='settings'&&pwOK())render();});
function updateSound(){const b=$('#soundBtn');b.setAttribute('aria-pressed',String(soundOn()));b.setAttribute('aria-label',soundOn()?'إيقاف الصوت':'تشغيل الصوت');b.firstElementChild.className='ico '+(soundOn()?'i-sound':'i-mute');}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&db&&ready&&!pendingWrites&&$('#splash').classList.contains('gone'))resync();});
let rzT,wasWide=innerWidth>=760;window.addEventListener('resize',()=>{const w=innerWidth>=760;if(w!==wasWide){wasWide=w;if(view==='kids'&&!sheetOpen)render();}if(!$('#splash').classList.contains('gone')){drawSplash();return;}clearTimeout(rzT);rzT=setTimeout(fitHome,200);});

/* ================= start ================= */
(function(){const b=$('#langBtn'),m=$('#langMenu');if(!b||!m)return;
  const set=o=>{m.hidden=!o;b.setAttribute('aria-expanded',String(o));};
  b.addEventListener('click',e=>{e.stopPropagation();set(m.hidden);});
  document.addEventListener('click',e=>{if(!m.hidden&&!m.contains(e.target))set(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!m.hidden){set(false);b.focus();}});
})();
$('#goBtn').addEventListener('click',()=>{
  if(!ready)return;
  $('#splash').classList.add('gone');stopSplash();tone(SND.lvl);
  const own=isGuest()?myKids():S.kids;
  if(!own.length){go('kids');if(!needJoin())openKidEditor();}else{go('home');if(!hinted){hinted=true;setTimeout(()=>{if(view==='home'&&!sheetOpen&&!popCtx&&!sel)toast('اضغط على أي شخصية لتضيف لها نقاطًا أو تخصمها');},900);}}
});
(async function init(){
  i18nStart();$$('.langmenu button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===I18N.lang)));drawSplash();$('#goBtn').disabled=true;
  await Promise.race([initStore(),new Promise(r=>setTimeout(r,7000))]);
  await Promise.race([loadAll(),new Promise(r=>setTimeout(r,7000))]);
  ready=true;if(db)subscribe();$('#goBtn').disabled=false;$('#goHint').textContent=db?(isGuest()?'مرحبًا بك في تحدي العائلة':'مرحبًا بك'):'يحفظ بياناتك على هذا الجهاز';
  updateSound();$$('.tab').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===view)));render();
})();
