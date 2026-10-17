/* ---------- account screens: sign up, sign in, code, password, sign out, delete ----------
   Sign-up and password reset are confirmed with a 6-digit code typed inside the game (not a link), because an installed
   home-screen app on iPhone cannot receive a link opened in Safari. All screens live in the normal sheet host. */
const AF={email:'',type:'signup',next:null,busy:false,resendAt:0,fam:''};

/* the sheet is raised above the title screen (class gate) so it can be opened before the game starts */
function acctShow(html){
  if(sheetOpen&&$('#sheetHost .sheet-back.gate')){setSheet(html);return;}
  openSheet(html,{acct:1});const b=$('#sheetHost .sheet-back');if(b)b.classList.add('gate');
}
function acctBusy(f,on){AF.busy=on;if(f)$$('button[type=submit]',f).forEach(b=>{b.disabled=on;});}
const acctField=(id,label,type,extra)=>'<label class="lbl" for="'+id+'">'+label+'</label><input class="field" id="'+id+'" type="'+type+'" '+(extra||'')+'>';

function acctGate(next){
  if(next!==undefined)AF.next=next;
  const inGame=$('#splash').classList.contains('gone');
  acctShow('<div class="empty"><div class="big" style="font-size:34px;color:var(--brand)">احفظ تقدّم أبنائك</div>'
   +'<p style="margin-top:6px">سجّل حسابك مرة واحدة، وتفتح اللعبة بكل أبنائك ونقاطهم من أي جهاز، ولا يضيع شيء لو تغيّر الجوال.</p>'
   +'<button class="btn gold forkopt" type="button" data-act="authmode" data-v="signup"><b>إنشاء حساب جديد</b></button>'
   +'<button class="btn forkopt" type="button" data-act="authmode" data-v="login"><b>تسجيل الدخول</b></button>'
   +'<div class="row" style="justify-content:center;margin-top:12px">'+(inGame?'<button class="btn" type="button" data-act="close">إغلاق</button>':'<button class="btn" type="button" data-act="authskip">العب بدون حساب</button>')+'</div>'
   +'<p style="margin-top:6px"><a class="btn small" href="'+esc(cloudSupportHref())+'">نسيت اسم المستخدم أو كلمة السر؟ تواصل معنا</a></p>'
   +'<p class="sub" style="margin-top:10px">تنبيه: بدون حساب تنحفظ بيانات الأبناء على هذا الجهاز فقط، وقد تضيع إذا انمسح المتصفح أو تغيّر الجهاز.</p></div>');
}
function acctForm(mode){
  const su=mode==='signup',fg=mode==='forgot';
  let h='<form id="authForm" data-cform="auth" data-mode="'+mode+'" autocomplete="on"><h2>'+(su?'إنشاء حساب':fg?'نسيت كلمة السر':'تسجيل الدخول')+'</h2>'
   +'<p class="sub">'+(su?'اختر اسم مستخدم وكلمة سر. الحساب لولي الأمر فقط، والأبناء يلعبون من خلاله.':fg?'اكتب اسم المستخدم.':'ادخل باسم المستخدم وكلمة السر.')+'</p>'
   +'<label class="lbl" for="aUser">اسم المستخدم</label>'
   +(su?'<p class="sub" style="margin:0 6px 2px">بالإنجليزي وبدون مسافات <span class="ex">(مثال: mohammed.ali أو salman3)</span></p>':'')
   +'<input class="field" id="aUser" type="text" name="username" dir="ltr" autocomplete="username" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="24" required placeholder="اكتب اسم المستخدم هنا" value="'+esc(su?(AF.email||''):(AF.email||clLS.get(CL_EMAIL)||''))+'">';
  if(su)h+='<div class="uhint" id="aUserMsg" aria-live="polite"></div><p class="sub" style="margin:0 6px 4px">نصيحة: اختر اسمًا تتذكره بسهولة، مثل اسمك، لأنك تحتاجه كل مرة تدخل.</p>';
  if(mode==='login')h+='<p class="sub" style="margin:2px 6px 0">إذا سجّلت قبل بإيميل، اكتب إيميلك في نفس الخانة.</p>';
  if(!fg)h+=acctField('aPw','كلمة السر','password','name="password" dir="ltr" autocomplete="'+(su?'new-password':'current-password')+'" maxlength="72" required'+(su?' minlength="8" placeholder="8 أحرف أو أرقام على الأقل"':''));
  if(su)h+=acctField('aPw2','أعد كتابة كلمة السر','password','dir="ltr" autocomplete="new-password" maxlength="72" required');
  if(su)h+=acctField('aFam','اسم العائلة (اختياري)','text','name="family" maxlength="24" autocomplete="off" placeholder="مثال: عائلة الشافعي" value="'+esc(AF.fam)+'"')
   +'<label class="chk"><input type="checkbox" id="aOk" required><span>أنا ولي أمر، وأوافق على <a href="privacy.html" target="_blank" rel="noopener">سياسة الخصوصية</a>.</span></label>';
  if(CLOUD_RECOVERY&&(su||fg))h+='<p class="sub" style="margin-top:10px">يوصلك رمز التأكيد على إيميلك خلال دقيقة تقريبًا. إذا ما لقيته، شوف مجلد الرسائل غير المرغوبة (Spam).</p>';
  if(!CLOUD_RECOVERY&&su)h+='<p class="sub" style="margin-top:10px"><b>مهم:</b> احفظ اسم المستخدم وكلمة السر في مكان آمن. حاليًا ما فيه طريقة لاسترجاع كلمة السر إذا نسيتها.</p>';
  h+='<div class="row" style="margin-top:14px"><button class="btn primary" type="submit">'+(su?'إنشاء الحساب':fg?'إرسال الرمز':'دخول')+'</button><button class="btn" type="button" data-act="authgate">رجوع</button></div>';
  if(mode==='login'&&CLOUD_RECOVERY)h+='<p style="margin-top:10px"><button class="btn small" type="button" data-act="authmode" data-v="forgot">نسيت كلمة السر؟</button></p>';
  if(mode==='login')h+='<p style="margin-top:6px"><a class="btn small" href="'+esc(cloudSupportHref())+'">نسيت اسم المستخدم أو كلمة السر؟ تواصل معنا</a></p>';
  return h+'</form>';
}
function acctFocus(id){setTimeout(()=>{let i=$('#'+id);if(id==='aUser'&&i&&i.value&&$('#aPw'))i=$('#aPw');if(i)i.focus();},60);}
function acctCode(){
  acctShow('<form id="codeForm" data-cform="code" autocomplete="off"><h2>اكتب الرمز</h2><p class="sub">أرسلنا رمزًا من 6 أرقام إلى <b dir="ltr">'+esc(AF.email)+'</b>. إذا ما وصل خلال دقيقة، شيّك على الرسائل غير المرغوبة (Spam).</p>'
   +'<input class="field code-in" id="aCode" dir="ltr" inputmode="numeric" autocomplete="one-time-code" maxlength="8" required placeholder="000000" aria-label="رمز التأكيد" style="text-align:center;letter-spacing:6px;font-size:26px">'
   +'<div class="row" style="margin-top:12px"><button class="btn primary" type="submit">تأكيد</button><button class="btn" type="button" data-act="authresend">إعادة إرسال الرمز</button><button class="btn" type="button" data-act="authgate">رجوع</button></div></form>');
  acctFocus('aCode');
}
function acctPwForm(kind,title,sub){
  acctShow('<form id="pwForm2" data-cform="'+kind+'" autocomplete="off"><h2>'+title+'</h2><p class="sub">'+sub+'</p>'
   +acctField('nPw','كلمة السر الجديدة','password','dir="ltr" autocomplete="new-password" minlength="8" maxlength="72" required placeholder="8 أحرف أو أرقام على الأقل"')
   +acctField('nPw2','أعد كتابتها','password','dir="ltr" autocomplete="new-password" maxlength="72" required')
   +'<div class="row" style="margin-top:14px"><button class="btn primary" type="submit">حفظ كلمة السر</button>'+(kind==='chpw'?'<button class="btn" type="button" data-act="close">إلغاء</button>':'')+'</div></form>');
  acctFocus('nPw');
}

/* ---------- after signing in: what to do with the data already on this device ---------- */
async function acctLoggedIn(ses){
  if(ses&&ses.user)CL.user=ses.user;
  else{try{const g=await CL.sb.auth.getSession();CL.user=g.data&&g.data.session?g.data.session.user:null;}catch(e){}}
  if(!CL.user){toast('تعذّر تسجيل الدخول، حاول مرة ثانية');return;}
  if(CL.user.email)clLS.set(CL_EMAIL,clShowName(CL.user.email));
  acctShow('<div class="empty"><p class="sub">جارٍ تجهيز حسابك…</p></div>');
  let r;try{r=await cloudBegin();}catch(e){console.warn(e);toast(clErrText(e));acctDone(true);return;}
  acctNext(r);
}
function acctNext(r){
  if(r==='foreign')return acctForeign();
  if(r==='merge')return acctMerge();
  if(r==='upload')return acctUpload();
  acctDone();
}
function acctDone(failed){
  CL.gateDone=true;cloudHint();closeSheet();const nx=AF.next;AF.next=null;
  if(!failed&&AF.fam){S.cfg.famName=AF.fam;persistCfg();}AF.fam='';refreshHud();
  if(!failed&&!isStandalone()&&!clLS.get('kafo.inst')){clLS.set('kafo.inst','1');setTimeout(()=>{if(!sheetOpen)openInstall();},1100);}
  if(failed)toast('سجّلت دخولك، لكن تعذّرت مزامنة البيانات الآن');else{toast('تم تسجيل الدخول');tone(SND.lvl);}
  if(view==='settings')render();
  if(!failed&&acctRealEmail())setTimeout(()=>acctMigrate(nx),300);      /* the username screen comes first; the rest of the flow waits for it */
  else if(nx)setTimeout(nx,320);
}
async function acctChoose(v){
  acctShow('<div class="empty"><p class="sub">جارٍ الحفظ…</p></div>');
  try{acctNext(await cloudResolve(v));}catch(e){console.warn(e);toast(clErrText(e));acctDone(true);}
}
function acctForeign(){
  acctShow('<div class="empty"><div class="big" style="font-size:30px;color:var(--neg)">بيانات هذا الجهاز لحساب ثاني</div>'
   +'<p style="margin-top:8px">في الجهاز أبناء ونقاط تخص حسابًا غير <b dir="ltr">'+esc(cloudEmail())+'</b>. ما نخلطها مع حسابك بدون إذنك.</p>'
   +'<button class="btn gold forkopt" type="button" data-act="acctch" data-v="keep"><b>هذي بيانات عائلتي، أضفها لحسابي</b></button>'
   +'<button class="btn neg" type="button" data-act="acctch" data-v="wipe" data-confirm>امسح بيانات الجهاز وأكمل بحسابي</button>'
   +'<div class="row" style="justify-content:center;margin-top:14px"><button class="btn" type="button" data-act="acctout">إلغاء والخروج</button></div></div>');
}
function acctMerge(){
  acctShow('<div class="empty"><div class="big" style="font-size:30px;color:var(--brand)">نجمع البيانات؟</div>'
   +'<p style="margin-top:8px">حسابك فيه بيانات محفوظة، وجهازك فيه بيانات أيضًا. نجمع الأبناء كلهم في الحساب. أي إعدادات تبي تعتمد (السلوكيات والخريطة والمكافآت)؟</p>'
   +'<button class="btn gold forkopt" type="button" data-act="acctch" data-v="merge-remote"><b>إعدادات الحساب</b></button>'
   +'<button class="btn forkopt" type="button" data-act="acctch" data-v="merge-local"><b>إعدادات هذا الجهاز</b></button></div>');
}
function acctUpload(){
  acctShow('<div class="empty"><div class="big" style="font-size:30px;color:var(--brand)">نرفع بياناتك لحسابك؟</div>'
   +'<p style="margin-top:8px">جهازك فيه أبناء وبيانات، وحسابك فاضي. نرفعها لحسابك عشان تنحفظ وتفتحها من أي جهاز.</p>'
   +'<button class="btn gold forkopt" type="button" data-act="acctch" data-v="upload"><b>ارفع بياناتي</b></button>'
   +'<button class="btn neg" type="button" data-act="acctch" data-v="empty" data-confirm>ابدأ بحساب فاضي (تُمسح بيانات هذا الجهاز)</button></div>');
}

/* ---------- the account section in settings ---------- */
function acctSec(){
  if(!cloudSignedIn())return '<p class="sub">بدون حساب، بيانات الأبناء تنحفظ على هذا الجهاز فقط وقد تضيع. سجّل حسابك لتحفظها وتفتحها من أي جهاز.</p>'
    +'<div class="row"><button class="btn gold" type="button" data-act="acctopen" data-v="signup">إنشاء حساب</button><button class="btn" type="button" data-act="acctopen" data-v="login">تسجيل الدخول</button></div>'
    +'<p class="sub"><a href="privacy.html" target="_blank" rel="noopener">سياسة الخصوصية</a></p>';
  return '<div class="srow"><div class="grow"><b dir="ltr">'+esc(cloudEmail())+'</b><div class="sub" id="acctStat">'+esc(cloudStatus())+'</div></div></div>'
   +'<p class="sub">يُحفظ في حسابك: أسماء الأبناء وأعمارهم ونقاطهم وإعدادات اللعبة. صور الأبناء تبقى على هذا الجهاز فقط.</p>'
   +(acctRealEmail()?'<div class="row"><button class="btn gold" type="button" data-act="acctmig">اختر اسم مستخدم وامسح إيميلك</button></div>':'')
   +'<div class="row"><button class="btn gold" type="button" data-act="acctsync">مزامنة الآن</button><button class="btn" type="button" data-act="acctpw">تغيير كلمة السر</button><button class="btn" type="button" data-act="acctoutask">تسجيل الخروج</button></div>'
   +'<p class="sub" style="margin-top:14px">حذف الحساب يمسح كل ما حُفظ في السحابة نهائيًا.</p><div class="row"><button class="btn neg" type="button" data-act="acctdel">حذف الحساب وبياناته</button></div>'
   +'<p class="sub"><a href="privacy.html" target="_blank" rel="noopener">سياسة الخصوصية</a></p>';
}
const acctSub=()=>cloudSignedIn()?'مسجّل · بياناتك محفوظة في حسابك':'غير مسجّل · البيانات على هذا الجهاز فقط';
function acctOutAsk(){
  openSheet('<div class="empty"><div class="big" style="font-size:30px;color:var(--brand)">تسجيل الخروج</div>'
   +'<p style="margin-top:8px">تبي تبقى بيانات الأبناء على هذا الجهاز بعد الخروج؟ بياناتك في حسابك تبقى محفوظة في كل الأحوال.</p>'
   +'<button class="btn gold forkopt" type="button" data-act="acctoutkeep"><b>اخرج وأبقِ بيانات الجهاز</b></button>'
   +'<button class="btn neg" type="button" data-act="acctoutwipe" data-confirm>اخرج وامسح بيانات هذا الجهاز</button>'
   +'<div class="row" style="justify-content:center;margin-top:14px"><button class="btn" type="button" data-act="close">إلغاء</button></div></div>',{});
}
async function acctOut(wipe){
  if(clLinked()){await cloudFlush();if(clPending()&&wipe){toast('ارفع تغييراتك أولًا: ما فيه اتصال بالإنترنت');return;}}
  try{await clAuth.out();}catch(e){}
  clUnsub();CL.user=null;CL.gateDone=false;
  if(wipe){clWipeLocal();clLS.del(CL_OWN);clLS.del(CL_SYNC);clLS.del(CL_EMAIL);}
  closeSheet();
  if(wipe){location.reload();return;}
  toast('تم تسجيل الخروج');cloudHint();refreshHud();render();
}
function acctDelAsk(){
  openSheet('<form id="delForm" data-cform="del" autocomplete="off"><h2 style="color:var(--neg)">حذف الحساب نهائيًا</h2>'
   +'<p>يُحذف حسابك وكل ما في السحابة: الأبناء ونقاطهم وشهاداتهم وإعدادات اللعبة. لا يمكن التراجع. بيانات هذا الجهاز تبقى عندك.</p>'
   +'<div class="row"><button class="btn gold" type="button" data-act="bkexp">حمّل نسخة من بياناتك أولًا</button></div><p class="sub">ملف يحفظ الأبناء والنقاط والشهادات (وصور هذا الجهاز) تقدر ترجع تستعيده بعدين من الإعدادات.</p>'
   +acctField('dConf','للتأكيد اكتب كلمة: احذف','text','autocomplete="off" required')
   +'<div class="row" style="margin-top:14px"><button class="btn neg" type="submit">احذف حسابي</button><button class="btn" type="button" data-act="close">إلغاء</button></div></form>',{});
  acctFocus('dConf');
}

/* ---------- form submits ---------- */
async function acctSubmit(f){
  if(AF.busy||!CL.sb)return;
  const k=f.dataset.cform,v=id=>{const el=$('#'+id);return el?el.value:'';};
  try{
    if(k==='auth'){
      const mode=f.dataset.mode,email=v('aUser').trim().toLowerCase();AF.email=email;
      if(mode==='forgot'){acctBusy(f,true);const r=await clAuth.forgot(email);acctBusy(f,false);if(r.error){toast(clErrText(r.error));return;}AF.type='recovery';acctCode();return;}
      const pw=v('aPw');
      if(mode==='signup'){
        const bad=clNameCheck(email);if(bad){toast(clNameMsg(bad));return;}
        if(pw.length<8){toast('كلمة السر لازم تكون 8 أحرف أو أرقام على الأقل');return;}
        if(pw!==v('aPw2')){toast('الكلمتان غير متطابقتين');return;}
        AF.fam=v('aFam').trim().slice(0,24);
        acctBusy(f,true);const r=await clAuth.signUp(email,pw);acctBusy(f,false);
        if(r.error){toast(clErrText(r.error));return;}
        const u=r.data&&r.data.user;
        if(u&&u.identities&&u.identities.length===0){toast('هذا الاسم مستخدم، اختر اسمًا ثانيًا');return;}
        if(r.data&&r.data.session){await acctLoggedIn(r.data.session);return;}
        AF.type='signup';acctCode();return;}
      acctBusy(f,true);const r=await clAuth.signIn(email,pw);acctBusy(f,false);
      if(r.error){
        if(/not confirmed/i.test(r.error.message||'')){try{await clAuth.resend(email,'signup');}catch(e){}AF.type='signup';toast('الإيميل لم يؤكَّد بعد، أرسلنا لك رمزًا جديدًا');acctCode();return;}
        toast(clErrText(r.error));return;}
      await acctLoggedIn(r.data&&r.data.session);return;}
    if(k==='code'){
      const tok=v('aCode').replace(/\s+/g,'');if(tok.length<6){toast('اكتب الرمز كاملًا');return;}
      acctBusy(f,true);const r=await clAuth.verify(AF.email,tok,AF.type==='recovery'?'recovery':'signup');acctBusy(f,false);
      if(r.error){toast(clErrText(r.error));return;}
      if(r.data&&r.data.user)CL.user=r.data.user;
      if(AF.type==='recovery'){acctPwForm('newpw','كلمة سر جديدة','اختر كلمة سر جديدة لحسابك.');return;}
      await acctLoggedIn(r.data&&r.data.session);return;}
    if(k==='newpw'||k==='chpw'){
      const a=v('nPw'),b=v('nPw2');
      if(a.length<8){toast('كلمة السر لازم تكون 8 أحرف أو أرقام على الأقل');return;}
      if(a!==b){toast('الكلمتان غير متطابقتين');return;}
      acctBusy(f,true);const r=await clAuth.setPw(a);acctBusy(f,false);
      if(r.error){toast(clErrText(r.error));return;}
      toast('تم حفظ كلمة السر');
      if(k==='newpw')await acctLoggedIn(null);else closeSheet();
      return;}
    if(k==='mig'){
      const name=v('aUser').trim().toLowerCase(),bad=clNameCheck(name);if(bad){toast(clNameMsg(bad));return;}
      acctBusy(f,true);const r=await CL.sb.auth.updateUser({email:clUserEmail(name)});
      if(r.error){acctBusy(f,false);toast(clErrText(r.error));return;}
      try{await CL.sb.auth.refreshSession();const g=await CL.sb.auth.getSession();if(g.data&&g.data.session)CL.user=g.data.session.user;}catch(e){}
      acctBusy(f,false);
      if(acctRealEmail()){toast('تعذّر تغيير الاسم الآن، حاول لاحقًا أو تواصل معنا');return;}
      clLS.set(CL_EMAIL,name);closeSheet();refreshHud();if(view==='settings')render();toast('تم! من الآن تدخل باسم المستخدم: '+name);tone(SND.lvl);return;}
    if(k==='del'){
      const w=v('dConf').trim().toLowerCase();if(w!=='احذف'&&w!=='delete'){toast('اكتب كلمة: احذف');return;}
      acctBusy(f,true);const r=await clAuth.del();acctBusy(f,false);
      if(r.error){toast(clErrText(r.error));return;}
      try{await clAuth.out();}catch(e){}
      clUnsub();CL.user=null;CL.meta={cfg:false,kids:{},del:{},last:0};['kafo.sync','kafo.owner','kafo.auth','kafo.email'].forEach(clLS.del);
      closeSheet();toast('تم حذف الحساب وكل بياناته من السحابة');render();return;}
  }catch(e){acctBusy(f,false);console.warn(e);toast(clErrText(e));}
}

/* ---------- buttons (merged into ACT by e_app.js) ---------- */
const CLOUD_ACT={
  acctmig(){closeSheet();setTimeout(acctMigrate,200);},
  install(){openInstall();},
  instgo(){instGo();},
  acctgate2(){acctGate();},
  acctmenu(){acctMenu();},
  authmode(el){const e=$('#aUser');if(e&&e.value)AF.email=e.value.trim();acctShow(acctForm(el.dataset.v));acctFocus('aUser');},
  acctopen(el){AF.next=null;acctShow(acctForm(el.dataset.v));acctFocus('aUser');},
  authgate(){acctGate();},
  authskip(){CL.gateDone=true;closeSheet();const nx=AF.next;AF.next=null;if(nx)nx();},
  async authresend(){
    if(Date.now()<AF.resendAt){toast('انتظر قليلًا قبل إعادة الإرسال');return;}
    AF.resendAt=Date.now()+45000;
    try{const r=await clAuth.resend(AF.email,AF.type);toast(r&&r.error?clErrText(r.error):'أرسلنا لك رمزًا جديدًا');}catch(e){toast(clErrText(e));}},
  acctch(el){acctChoose(el.dataset.v);},
  acctout(){acctOut(false);},
  acctoutask(){acctOutAsk();},
  acctoutkeep(){acctOut(false);},
  acctoutwipe(){acctOut(true);},
  acctdel(){acctDelAsk();},
  acctpw(){acctPwForm('chpw','تغيير كلمة السر','اختر كلمة سر جديدة لحسابك.');},
  async acctsync(){await cloudSync();toast(CL.err||'تمت المزامنة');}
};

/* ---------- the account pill on the map (top corner) and its small menu ---------- */
const clDot=()=>CL.err?'sd err':(!navigator.onLine||clPending())?'sd wait':'sd ok';
function acctPill(){
  if(!cloudOn())return '';
  if(!cloudSignedIn())return '<button class="pill warn acct" type="button" data-act="acctgate2">غير مسجّل</button>';
  return '<button class="pill acct" type="button" data-act="acctmenu" aria-label="حسابي"><i class="'+clDot()+'"></i>'+esc(S.cfg.famName||cloudEmail())+'</button>';
}
function acctMenu(){
  if(!cloudSignedIn())return acctGate();
  closePop();
  openSheet('<div class="sheet-head"><div class="grow"><h2>حسابي</h2>'+(S.cfg.famName?'<div><b>'+esc(S.cfg.famName)+'</b></div>':'')+'<div class="sub" dir="ltr" style="text-align:start">'+esc(cloudEmail())+'</div><div class="sub" id="acctStat">'+esc(cloudStatus())+'</div></div><button class="btn small" type="button" data-act="close">تم</button></div>'
   +(acctRealEmail()?'<div class="row"><button class="btn gold" type="button" data-act="acctmig">اختر اسم مستخدم وامسح إيميلك</button></div>':'')
   +'<div class="row"><button class="btn gold" type="button" data-act="acctsync">مزامنة الآن</button><button class="btn" type="button" data-act="acctpw">تغيير كلمة السر</button></div>'
   +'<div class="row"><button class="btn" type="button" data-act="acctoutask">تسجيل الخروج</button><button class="btn neg" type="button" data-act="acctdel">حذف الحساب وبياناته</button></div>',{});
}

/* ---------- (1) install the game on the home screen: opens like an app and keeps the browser from clearing the data ---------- */
let instEv=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();instEv=e;});
window.addEventListener('appinstalled',()=>{instEv=null;});
const isStandalone=()=>{try{return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;}catch(e){return false;}};
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function instBody(){
  const why='<p class="sub">تفتح مثل أي تطبيق، وتشتغل بدون إنترنت، ولا يمسح المتصفح بياناتك لو طال الوقت بدون استخدام.</p>';
  if(isIOS())return why+'<ol class="steps"><li>افتح اللعبة من متصفح Safari.</li><li>اضغط زر المشاركة (المربع اللي فيه سهم لفوق) أسفل الشاشة.</li><li>اختر «إضافة إلى الشاشة الرئيسية».</li><li>اضغط «إضافة»، وبعدها افتح اللعبة من أيقونتها.</li></ol>';
  if(instEv)return why+'<div class="row"><button class="btn gold" type="button" data-act="instgo">تثبيت اللعبة الآن</button></div>';
  return why+'<ol class="steps"><li>افتح قائمة المتصفح (النقاط الثلاث ⋮).</li><li>اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».</li></ol>';
}
function openInstall(){
  openSheet('<div class="sheet-head"><div class="grow"><h2>ثبّت اللعبة على جوالك</h2></div><button class="btn small" type="button" data-act="close">تم</button></div>'+instBody(),{});
}
async function instGo(){
  if(!instEv){openInstall();return;}
  try{instEv.prompt();const r=await instEv.userChoice;instEv=null;if(r&&r.outcome==='accepted')toast('تم تثبيت اللعبة');closeSheet();}catch(e){}
}

/* ---------- (3) a gentle reminder for players without an account, at most once every 3 days, after they give points ---------- */
function cloudNag(){
  if(!cloudOn()||cloudSignedIn())return;
  const last=+clLS.get('kafo.nag')||0;if(Date.now()-last<3*864e5)return;
  clLS.set('kafo.nag',String(Date.now()));
  setTimeout(()=>{if(!sheetOpen&&!cloudSignedIn())toast('بياناتك على هذا الجهاز فقط. اضغط «غير مسجّل» فوق لحفظ تقدّم أبنائك بحساب.');},3800);
}

/* ---------- live username check while typing (rules, then "is it free?") ---------- */
let unT=0,unSeq=0;
document.addEventListener('input',e=>{
  const inp=e.target;if(!inp||inp.id!=='aUser')return;
  const v=inp.value.toLowerCase().replace(/\s+/g,'');if(v!==inp.value)inp.value=v;     /* capitals and spaces are fixed for you */
  const f=inp.closest('form'),msg=$('#aUserMsg');if(!f||f.dataset.mode!=='signup'||!msg)return;
  clearTimeout(unT);const seq=++unSeq;
  if(!v){msg.className='uhint';msg.textContent='';return;}
  const bad=clNameCheck(v);if(bad){msg.className='uhint bad';msg.textContent=clNameMsg(bad);return;}
  msg.className='uhint';msg.textContent='جارٍ التحقق من الاسم…';
  unT=setTimeout(async()=>{
    try{const r=await clAuth.avail(v);if(seq!==unSeq)return;if(r.error)throw r.error;
      msg.className='uhint '+(r.data?'ok':'bad');msg.textContent=r.data?'✓ الاسم متاح':'✗ هذا الاسم مستخدم، جرّب اسمًا ثانيًا (مثال: '+v+'2)';}
    catch(err){if(seq===unSeq){msg.className='uhint';msg.textContent='تعذّر التحقق من الاسم الآن';}}
  },450);
});

/* ---------- accounts that signed up with a real email: pick a username, the email is removed from the system ---------- */
const acctRealEmail=()=>{const u=cloudUser();return !!(u&&u.email&&u.email.indexOf('@'+CLOUD_DOMAIN)<0);};
async function acctMigrate(next){
  if(!cloudSignedIn()||!acctRealEmail()){if(next)next();return;}
  if(!navigator.onLine){if(next)next();return;}
  try{const g=await CL.sb.auth.getUser();if(g&&g.data&&g.data.user){CL.user=g.data.user;if(!acctRealEmail()){clLS.set(CL_EMAIL,cloudEmail());refreshHud();if(next)next();return;}}}catch(e){}
  openSheet('<form id="migForm" data-cform="mig" data-mode="signup" autocomplete="off"><h2>اختر اسم مستخدم</h2>'
   +'<p class="sub">ما عدنا نطلب الإيميل. اختر اسم مستخدم بالإنجليزي وتدخل به من الآن. بعد ما تحفظه نمسح إيميلك من النظام، وبيانات أبنائك ونقاطهم تبقى كما هي.</p>'
   +'<label class="lbl" for="aUser">اسم المستخدم</label>'
   +'<p class="sub" style="margin:0 6px 2px">بالإنجليزي وبدون مسافات <span class="ex">(مثال: mohammed.ali أو salman3)</span></p>'
   +'<input class="field" id="aUser" type="text" name="username" dir="ltr" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="24" required placeholder="اكتب اسم المستخدم هنا">'
   +'<div class="uhint" id="aUserMsg" aria-live="polite"></div><p class="sub" style="margin:0 6px 4px">نصيحة: اختر اسمًا تتذكره بسهولة، مثل اسمك، لأنك تحتاجه كل مرة تدخل.</p>'
   +'<div class="row" style="margin-top:14px"><button class="btn primary" type="submit">حفظ الاسم ومسح الإيميل</button><button class="btn" type="button" data-act="close">لاحقًا</button></div></form>',{next:next});
  const b=$('#sheetHost .sheet-back');if(b)b.classList.add('gate');acctFocus('aUser');
}
