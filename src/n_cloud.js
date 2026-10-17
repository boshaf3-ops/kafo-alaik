/* ---------- cloud accounts and sync (Supabase) ----------
   The game stays local-first: localStorage is always written first and the game works offline.
   When a parent is signed in, every change is also queued and pushed to Supabase (names, ages, points, badges, certificates, settings).
   Photos are NEVER uploaded. The browser only holds the project URL and the public (anon) key: all protection comes from the
   Row Level Security rules in supabase/schema.sql, so a signed-in account can only ever read and write its own rows.
   Leave the two constants empty and the whole feature stays hidden (the game behaves exactly as before). */
/* Password recovery by email code. Keep false while Supabase has no email sender (SMTP): then "Confirm email" must be OFF in the dashboard,
   accounts are created at once without a code, and the forgot-password button stays hidden. Turn it on only after SMTP is configured. */
const CLOUD_RECOVERY=false;
/* where a parent writes when he forgot his email or password (manual recovery during the trial) */
const CLOUD_SUPPORT='kafu.alik.gcc@gmail.com';
function cloudSupportHref(){
  const en=I18N.lang==='en';
  const sub=en?'Forgot my login details - Kafo Alaik':'نسيت بيانات الدخول - كفو عليك';
  const body=en?'Hello,\n\nI forgot my login details for my Kafo Alaik account.\n\nKids\' names:\nKids\' ages:\nThe username I remember (if any):\n\nNote: do not send the password in this message.'
    :'السلام عليكم،\n\nنسيت بيانات الدخول لحسابي في «كفو عليك».\n\nأسماء الأبناء:\nأعمارهم:\nاسم المستخدم اللي أتذكره (إن وجد):\n\nملاحظة: لا ترسل كلمة السر في الرسالة.';
  return 'mailto:'+CLOUD_SUPPORT+'?subject='+encodeURIComponent(sub)+'&body='+encodeURIComponent(body);
}
const CLOUD_URL='https://dqowufqtkkwkmebtrskf.supabase.co';
const CLOUD_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxb3d1ZnF0a2t3a21lYnRyc2tmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyMzE1MTgsImV4cCI6MjEwNzgwNzUxOH0.DPkD_JK6AUa03-9F9f6HDr6kKBNO6Mz9EyyU-3GHjTA';   /* public anon key: safe in the browser, the data is protected by RLS */

const CL={sb:null,user:null,timer:0,retry:0,busy:false,syncing:false,chan:null,err:'',R:null,gateDone:false,lastPull:0,meta:{cfg:false,kids:{},del:{},last:0}};
/* Accounts use a username, not an email. Supabase Auth needs an email-shaped id, so the username is stored as name@kafo.invalid
   (".invalid" is a reserved domain: no mail can ever be delivered there, and nothing is ever sent because "Confirm email" is off). */
const CLOUD_DOMAIN='kafo.invalid';
const clUserEmail=n=>{n=String(n||'').trim().toLowerCase();return n.indexOf('@')>=0?n:n+'@'+CLOUD_DOMAIN;};   /* an old account that signed up with a real email can still type it */
const clShowName=e=>String(e||'').replace('@'+CLOUD_DOMAIN,'');
/* rules: English lowercase letters and digits, starts with a letter, at least one dot between parts (mohammed.ali), 5 to 24 characters */
function clNameCheck(n){
  if(!n)return'empty';if(/[^\x00-\x7f]/.test(n))return'english';if(n.length<5)return'short';if(n.length>24)return'long';
  if(!/^[a-z]/.test(n))return'start';if(n.indexOf('.')<0)return'dot';if(/\.\./.test(n)||/\.$/.test(n))return'dots';
  if(!/^[a-z][a-z0-9]*(\.[a-z0-9]+)+$/.test(n))return'chars';return'';
}
const CL_NAMEMSG={english:'اكتب الاسم بالإنجليزي (حروف a-z فقط)',short:'الاسم قصير، 5 أحرف على الأقل',long:'الاسم طويل، 24 حرف كحد أقصى',start:'لازم يبدأ بحرف إنجليزي',dot:'لازم فيه نقطة بين جزئين، مثل: mohammed.ali',dots:'النقطة ما تكون في الآخر ولا تتكرر',chars:'مسموح حروف إنجليزية وأرقام ونقطة فقط'};
const clNameMsg=k=>CL_NAMEMSG[k]||'اسم المستخدم غير صالح';
const CL_SYNC='kafo.sync',CL_OWN='kafo.owner',CL_KEY='kafo.auth',CL_EMAIL='kafo.email';   /* the last email used on this device (never the password) */
const clLS={get:k=>{try{return localStorage.getItem(k);}catch(e){return null;}},set:(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}},del:k=>{try{localStorage.removeItem(k);}catch(e){}}};
function clMetaLoad(){try{const o=JSON.parse(clLS.get(CL_SYNC)||'null');if(o&&typeof o==='object')CL.meta={cfg:!!o.cfg,kids:o.kids||{},del:o.del||{},last:+o.last||0};}catch(e){}}
function clMetaSave(){clLS.set(CL_SYNC,JSON.stringify(CL.meta));}

/* the project is configured, the library is on the page, and we are not inside Claude's own storage (db) */
const cloudConfigured=()=>!!(CLOUD_URL&&CLOUD_KEY&&window.supabase&&window.supabase.createClient);
const cloudOn=()=>cloudConfigured()&&!db;
/* a session saved on this device counts as signed in straight away (even offline), the real check runs in the background */
function cloudStoredUser(){try{const o=JSON.parse(clLS.get(CL_KEY)||'null');return o&&o.user?o.user:null;}catch(e){return null;}}
const cloudUser=()=>CL.user||cloudStoredUser();
const cloudSignedIn=()=>cloudOn()&&!!cloudUser();
const cloudEmail=()=>clShowName((cloudUser()||{}).email||'');
/* linked: signed in AND this device's data was attached to this very account (so another family's data is never pushed into it) */
const clLinked=()=>cloudSignedIn()&&clLS.get(CL_OWN)===cloudUser().id;
const cloudNeedsGate=()=>cloudOn()&&!cloudSignedIn()&&!CL.gateDone;

/* ---------- readable errors ---------- */
function clErrText(e){
  const m=String((e&&(e.message||e.error_description||e.code))||e||'').toLowerCase(),st=e&&e.status;
  if(!navigator.onLine||m.indexOf('failed to fetch')>=0||m.indexOf('networkerror')>=0||m.indexOf('network request failed')>=0||m.indexOf('retryable')>=0)return 'ما فيه اتصال بالإنترنت';
  if(st===401||st===403||m.indexOf('jwt')>=0||m.indexOf('not authenticated')>=0)return 'انتهت الجلسة، سجّل دخولك من الإعدادات';
  if(m.indexOf('invalid login')>=0)return 'اسم المستخدم أو كلمة السر غير صحيحة';
  if(m.indexOf('not confirmed')>=0)return 'الإيميل لم يؤكَّد بعد';
  if(m.indexOf('already registered')>=0||m.indexOf('already been registered')>=0)return 'هذا الاسم مستخدم، اختر اسمًا ثانيًا';
  if(m.indexOf('expired')>=0||m.indexOf('otp')>=0||m.indexOf('invalid token')>=0||m.indexOf('invalid or')>=0)return 'الرمز غير صحيح أو انتهت صلاحيته';
  if(st===429||m.indexOf('rate limit')>=0||m.indexOf('security purposes')>=0||m.indexOf('too many')>=0)return 'محاولات كثيرة، انتظر قليلًا ثم حاول مرة ثانية';
  if(m.indexOf('different from the old')>=0)return 'اختر كلمة سر مختلفة عن القديمة';
  if(m.indexOf('weak')>=0||m.indexOf('at least')>=0||m.indexOf('password should')>=0)return 'كلمة السر ضعيفة، استخدم 8 أحرف أو أكثر';
  if(m.indexOf('signups not allowed')>=0||m.indexOf('signup is disabled')>=0)return 'التسجيل مغلق حاليًا';
  if(m.indexOf('invalid email')>=0||m.indexOf('unable to validate email')>=0)return 'اسم المستخدم غير صالح';
  return 'تعذّر الاتصال بالحساب، حاول مرة ثانية';
}

/* ---------- start-up and auth events ---------- */
async function cloudInit(){
  if(!cloudOn())return;
  clMetaLoad();
  try{CL.sb=window.supabase.createClient(CLOUD_URL,CLOUD_KEY,{auth:{storageKey:CL_KEY,persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});}catch(e){console.warn(e);CL.sb=null;return;}
  /* never run work inside this callback (the library can deadlock); hand it to the next tick */
  CL.sb.auth.onAuthStateChange((ev,ses)=>{setTimeout(()=>clAuthEvent(ev,ses),0);});
  try{const r=await Promise.race([CL.sb.auth.getSession(),new Promise(res=>setTimeout(()=>res({data:{}}),3500))]);if(r&&r.data&&r.data.session)CL.user=r.data.session.user;}catch(e){}
  if(CL.user&&clLinked()){clRealtime();cloudSync();}
  cloudHint();
}
function clAuthEvent(ev,ses){
  if(ev==='SIGNED_OUT'){CL.user=null;clUnsub();cloudHint();if(view==='settings')render();return;}
  if(ses&&ses.user)CL.user=ses.user;
}
function cloudHint(){
  const h=$('#goHint'),b=$('#acctSplash');if(b)b.hidden=!(cloudOn()&&!cloudSignedIn());
  if(!h||db||!ready)return;
  if(cloudSignedIn())h.textContent='بياناتك محفوظة في حسابك';
  else if(cloudOn())h.textContent='يحفظ بياناتك على هذا الجهاز، سجّل حسابك لتحفظها في السحابة';
}

/* ---------- what the device holds ---------- */
const clHasLocal=()=>S.kids.length>0||(S.cfg.pos&&S.cfg.pos.length>0)||(S.cfg.neg&&S.cfg.neg.length>0)||!!S.cfg.famName;
const clRemoteHas=R=>!!R&&(!!R.cfg||R.kids.some(r=>!r.deleted));
function clKidData(k){const d=J(k);['id','fam','photo','mt'].forEach(x=>delete d[x]);return d;}
function clCfgData(){const d=J(S.cfg);delete d.sound;delete d.mt;return d;}   /* sound is a per-device choice */
function clKidFrom(r,l){return normKid(Object.assign({},r.data||{},{id:r.id,fam:'',photo:l?l.photo:null,mt:+r.mt||0}));}

/* ---------- the push queue (kept on this device until it reaches the server) ---------- */
function clSchedule(ms){if(CL.timer)return;CL.timer=setTimeout(()=>{CL.timer=0;cloudFlush();},ms==null?1500:ms);}
function clQueueKid(k){if(!(+k.mt))k.mt=Date.now();CL.meta.kids[k.id]=k.mt;delete CL.meta.del[k.id];clMetaSave();clSchedule();}
function clQueueCfg(){if(!(+S.cfg.mt))S.cfg.mt=Date.now();CL.meta.cfg=true;clMetaSave();clSchedule();}
/* called by the persist functions after the local save */
function cloudKid(k){if(clLinked())clQueueKid(k);}
function cloudCfg(){if(clLinked())clQueueCfg();}
function cloudDel(id){if(!clLinked())return;CL.meta.del[id]=Date.now();delete CL.meta.kids[id];clMetaSave();clSchedule();}
/* a backup file was restored over the current data */
function cloudRestored(oldIds){
  if(!clLinked())return;const now=Date.now();
  oldIds.forEach(id=>{if(!kidById(id)){CL.meta.del[id]=now;delete CL.meta.kids[id];}});
  S.kids.forEach(k=>{k.mt=now;CL.meta.kids[k.id]=now;delete CL.meta.del[k.id];});S.cfg.mt=now;CL.meta.cfg=true;persistLocal();clMetaSave();clSchedule(300);
}
const clPending=()=>Object.keys(CL.meta.kids).length+Object.keys(CL.meta.del).length+(CL.meta.cfg?1:0);

async function cloudFlush(){
  clearTimeout(CL.timer);CL.timer=0;clearTimeout(CL.retry);CL.retry=0;
  if(!clLinked()||!CL.sb||CL.busy||!clPending())return;
  const u=cloudUser();if(!u||!navigator.onLine){clStatusRefresh();return;}
  const M=CL.meta,uid=u.id,snapK={},snapD={},cfgSnap=M.cfg?(+S.cfg.mt||1):0;
  CL.busy=true;
  try{
    const rows=[];
    Object.keys(M.kids).forEach(id=>{const k=kidById(id);if(k){snapK[id]=M.kids[id];rows.push({user_id:uid,id,data:clKidData(k),mt:+k.mt||Date.now(),deleted:false});}else delete M.kids[id];});
    Object.keys(M.del).forEach(id=>{snapD[id]=M.del[id];rows.push({user_id:uid,id,data:{},mt:M.del[id],deleted:true});});
    if(rows.length){const r=await CL.sb.from('cloud_kids').upsert(rows,{onConflict:'user_id,id'});if(r.error)throw r.error;}
    if(M.cfg){const r=await CL.sb.from('cloud_cfg').upsert({user_id:uid,data:clCfgData(),mt:+S.cfg.mt||Date.now()},{onConflict:'user_id'});if(r.error)throw r.error;}
    /* clear only what was not edited again while we were sending */
    Object.keys(snapK).forEach(id=>{if(M.kids[id]===snapK[id])delete M.kids[id];});
    Object.keys(snapD).forEach(id=>{if(M.del[id]===snapD[id])delete M.del[id];});
    if(M.cfg&&(+S.cfg.mt||1)===cfgSnap)M.cfg=false;
    M.last=Date.now();CL.err='';
  }catch(e){CL.err=clErrText(e);console.warn('sync push',e);CL.retry=setTimeout(cloudFlush,20000);}
  finally{CL.busy=false;clMetaSave();clStatusRefresh();}
  if(!CL.err&&clPending())clSchedule(800);
}

/* ---------- pull and merge (the newest edit of each child wins) ---------- */
async function clFetch(){
  const uid=cloudUser().id,sb=CL.sb;
  const [a,b]=await Promise.all([sb.from('cloud_kids').select('id,data,mt,deleted').eq('user_id',uid),sb.from('cloud_cfg').select('data,mt').eq('user_id',uid).maybeSingle()]);
  if(a.error)throw a.error;if(b.error)throw b.error;
  return{kids:a.data||[],cfg:b.data||null};
}
/* opt.partial: only the given rows are looked at (live updates); opt.cfgFrom: 'local' | 'remote' forces the settings source */
function clMerge(R,opt){
  opt=opt||{};const M=CL.meta;let struct=false,meta=false;const moved=[],seen=new Set();
  R.kids.forEach(r=>{
    seen.add(r.id);const l=kidById(r.id),lm=l?(+l.mt||0):0,rm=+r.mt||0,tomb=+M.del[r.id]||0;
    if(r.deleted){
      if(l&&rm>=lm){S.kids=S.kids.filter(x=>x.id!==r.id);delete disp[r.id];struct=true;}
      else if(l)clQueueKid(l);                       /* the local copy is newer: bring it back */
      if(!l||rm>=lm)delete M.del[r.id];
      return;}
    if(tomb){if(tomb>=rm){clSchedule();return;}delete M.del[r.id];}   /* deleted here after the server copy: keep the deletion */
    if(!l){S.kids.push(clKidFrom(r,null));struct=true;return;}
    if(rm>lm){const nk=clKidFrom(r,l),dp=nk.pts-l.pts;S.kids[S.kids.indexOf(l)]=nk;if(dp)moved.push({k:nk,dp});else meta=true;}
    else if(rm<lm)clQueueKid(l);
  });
  if(!opt.partial)S.kids.slice().forEach(k=>{if(!seen.has(k.id))clQueueKid(k);});   /* never uploaded yet */
  const c=R.cfg;
  if(c){
    const rm=+c.mt||0,lm=+S.cfg.mt||0;
    if(opt.cfgFrom==='local'){S.cfg.mt=Math.max(Date.now(),rm+1);clQueueCfg();}
    else if(opt.cfgFrom==='remote'||rm>lm){applyCfg(Object.assign({},c.data||{},{sound:S.cfg.sound,mt:rm}));}
    else if(rm<lm&&!opt.partial)clQueueCfg();
  }else if(!opt.partial&&opt.cfgFrom!=='remote'&&clHasLocal()){clQueueCfg();}
  if(struct||moved.length||meta)sortKids();
  persistLocal();clMetaSave();
  if(struct||moved.length||meta)syncUI(struct,moved);
}
async function cloudSync(){
  if(!clLinked()||!CL.sb||CL.syncing)return;
  if(!navigator.onLine){clStatusRefresh();return;}
  CL.syncing=true;CL.lastPull=Date.now();
  try{const R=await clFetch();clMerge(R,{});await cloudFlush();if(!CL.err)CL.meta.last=Date.now();clMetaSave();}
  catch(e){CL.err=clErrText(e);console.warn('sync pull',e);}
  finally{CL.syncing=false;clStatusRefresh();}
}
/* live updates from the other devices of the same account */
function clRealtime(){
  if(!CL.sb||CL.chan||!CL.user)return;const uid=CL.user.id;
  try{CL.chan=CL.sb.channel('kafo-'+uid)
    .on('postgres_changes',{event:'*',schema:'public',table:'cloud_kids',filter:'user_id=eq.'+uid},p=>clLive('k',p))
    .on('postgres_changes',{event:'*',schema:'public',table:'cloud_cfg',filter:'user_id=eq.'+uid},p=>clLive('c',p))
    .subscribe();}catch(e){console.warn('realtime',e);CL.chan=null;}
}
function clUnsub(){if(CL.chan&&CL.sb){try{CL.sb.removeChannel(CL.chan);}catch(e){}}CL.chan=null;}
function clLive(t,p){
  const row=p&&p.new&&Object.keys(p.new).length?p.new:null;if(!row)return;
  clMerge(t==='k'?{kids:[row],cfg:null}:{kids:[],cfg:row},{partial:true});
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&clLinked()&&Date.now()-CL.lastPull>10000)cloudSync();});
window.addEventListener('online',()=>{if(clLinked())cloudSync();clStatusRefresh();});
window.addEventListener('offline',()=>clStatusRefresh());

/* ---------- status line ---------- */
function cloudStatus(){
  if(!cloudSignedIn())return '';
  if(CL.err)return CL.err;
  if(!navigator.onLine)return clPending()?'بانتظار الاتصال لرفع التغييرات':'غير متصل';
  if(clPending())return 'جارٍ الرفع…';
  return CL.meta.last?'آخر مزامنة: '+ago(CL.meta.last):'جاهز للمزامنة';
}
function clStatusRefresh(){const el=$('#acctStat');if(el)el.textContent=cloudStatus();const d=$('#hud .acct i');if(d)d.className=clDot();}

/* ---------- after a fresh sign-in: decide what to do with this device's data ---------- */
async function cloudBegin(skipOwn){
  const R=await clFetch(),uid=cloudUser().id,own=skipOwn?null:clLS.get(CL_OWN),local=clHasLocal(),remote=clRemoteHas(R);CL.R=R;
  if(own===uid||!local){await clApply(R,{});return 'done';}
  if(own&&own!==uid)return 'foreign';          /* the data on this device belongs to somebody else: never merge it silently */
  return remote?'merge':'upload';
}
async function cloudResolve(ch){
  const R=CL.R;if(!R)return 'done';
  if(ch==='keep')return cloudBegin(true);        /* "these are my kids": treat them as this account's data */
  if(ch==='wipe'||ch==='empty'){clWipeLocal();await clApply(R,{cfgFrom:'remote'});return 'done';}
  if(ch==='upload'){await clApply(R,{cfgFrom:'local'});return 'done';}
  if(ch==='merge-local'){await clApply(R,{cfgFrom:'local'});return 'done';}
  await clApply(R,{cfgFrom:'remote'});return 'done';   /* merge-remote */
}
async function clApply(R,opt){
  clLS.set(CL_OWN,cloudUser().id);
  clMerge(R,opt);CL.R=null;clRealtime();cloudFlush();clStatusRefresh();
}
function clWipeLocal(){
  const was=S.kids.map(k=>k.id);S.kids=[];S.cfg=DEF_CFG();CL.meta={cfg:false,kids:{},del:{},last:0};clMetaSave();clLS.del('kafo.pw');
  Object.keys(disp).forEach(k=>delete disp[k]);persistLocal();return was;
}

/* ---------- auth calls ---------- */
const clAuth={
  signUp:(name,password)=>CL.sb.auth.signUp({email:clUserEmail(name),password}),
  signIn:(name,password)=>CL.sb.auth.signInWithPassword({email:clUserEmail(name),password}),
  avail:name=>CL.sb.rpc('username_available',{p_name:name}),
  verify:(email,token,type)=>CL.sb.auth.verifyOtp({email,token,type}),
  resend:(email,type)=>type==='recovery'?CL.sb.auth.resetPasswordForEmail(email):CL.sb.auth.resend({type:'signup',email}),
  forgot:email=>CL.sb.auth.resetPasswordForEmail(email),
  setPw:password=>CL.sb.auth.updateUser({password}),
  out:()=>CL.sb.auth.signOut({scope:'local'}),
  del:()=>CL.sb.rpc('delete_my_account')
};
/* "reset to the original settings" while signed in: also empty the account copy, then leave the account */
async function cloudWipeDone(){
  if(!cloudSignedIn())return true;
  if(clLinked()){S.cfg=DEF_CFG();S.cfg.mt=Date.now();clQueueCfg();await cloudFlush();
    if(clPending()){toast('لازم يكون فيه إنترنت عشان تنحذف نسخة الحساب');return false;}}
  try{await clAuth.out();}catch(e){}
  clUnsub();CL.user=null;['kafo.sync','kafo.owner','kafo.auth','kafo.email'].forEach(clLS.del);return true;
}
