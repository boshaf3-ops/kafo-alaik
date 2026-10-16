/* ---------- wardrobe: every map has its own outfits, opening at 25%, 50% and 75% of the climb ----------
   Progress belongs to (map + round): a new map or a new round starts again in plain clothes. */
let wd=null;
const OU=(m,g)=>outOf(m||S.cfg.mapId,g);
const tierKey=()=>(MAPS[S.cfg.mapId]?S.cfg.mapId:'peak')+'#'+curRound();
function tierOf(k){const base=isDone(k)?100:milestone(lvl(k.pts));return k.tk===tierKey()?Math.max(+k.tier||0,base):base;}
function wearOf(k,m){return(k.wear&&k.wear[m||S.cfg.mapId])||{};}
/* the look of a kid on a given map (default: the current one); tier 100 is used for finished certificates */
function effAv(k,m,tier){
  m=MAPS[m||S.cfg.mapId]?(m||S.cfg.mapId):'peak';const o=OU(m,k.av.g),w=wearOf(k,m),t=tier==null?tierOf(k):tier;
  const okI=(list,i)=>i>0&&list[i]&&list[i].t<=t?i:0,okC=(ts,i,def)=>(i!=null&&ts[i]!=null&&ts[i]<=t)?i:def;
  return{sk:k.av.sk,st:k.av.st,hc:k.av.hc,sh:okC(o.st,w.sh,(k.av.sh|0)<8?(k.av.sh|0):0),ss:okI(o.shirts,w.ss),ps:okI(o.pants,w.ps),pc:okC(o.pt,w.pc,(k.av.pc|0)<4?(k.av.pc|0):0),m,g:k.av.g,hr:heroOK(k,k.av.hr)?k.av.hr:''};
}
const thumb=(k,over)=>avatarURL(Object.assign({},effAv(k),over),false);
function wdCount(k){const t=tierOf(k),o=OU(null,k.av.g);return{s:o.shirts.filter(x=>x.t<=t).length,p:o.pants.filter(x=>x.t<=t).length};}
/* ---- special suits: opened by achievement stars (1 per badge, 2 per finished map) ---- */
const mapsDone=k=>new Set((k.certs||[]).map(c=>c.mapId)).size;
const ach=k=>BADGES.filter(b=>hasBadge(k,b.id)).length+2*mapsDone(k);
const heroOK=(k,id)=>{if(!id)return false;const h=heroList(k.av.g).find(x=>x.id===id);return !!h&&ach(k)>=h.need;};
function heroTabHtml(k){
  const hl=heroList(k.av.g),a=ach(k),nx=hl.find(h=>h.need>a),base=Object.assign({},effAv(k),{hr:''});
  const items='<button class="wd-item" type="button" data-act="wdhero" data-v="" aria-pressed="'+(!k.av.hr)+'"><img alt="" src="'+avatarURL(base,false)+'"><span>بدلتي العادية</span></button>'
   +hl.map(h=>{const lock=a<h.need;
     return '<button class="wd-item'+(lock?' locked':'')+'" type="button" data-act="wdhero" data-v="'+h.id+'" aria-pressed="'+(k.av.hr===h.id)+'" aria-label="'+esc(h.n)+(lock?'، تُفتح عند '+h.need+' نجوم إنجاز':'')+'">'
      +'<img alt="" src="'+avatarURL({sk:k.av.sk,hr:h.id},false)+'"><span>'+esc(h.n)+'</span>'+(lock?'<span class="lk"><span class="ico i-lock"></span>'+h.need+'</span>':'')+'</button>';}).join('');
  const pc=nx?Math.round(Math.min(a,nx.need)*100/nx.need):100;
  return '<div class="sheet-head"><div class="av">'+avHtml(k)+'</div><div class="grow"><h2>بدلات '+esc(k.name)+' الخاصة</h2><div class="sub">'+heroList(k.av.g).filter(h=>a>=h.need).length+' من '+hl.length+' بدلات مفتوحة · نجوم الإنجاز: '+a+'</div></div><button class="btn small" type="button" data-act="close">تم</button></div>'
   +'<div class="wd-prev"><img alt="معاينة" src="'+avatarURL(effAv(k),false)+'"></div>'
   +'<div class="row" style="justify-content:center"><button class="btn opt" type="button" data-act="wdtab" data-v="shirt" aria-pressed="false">القميص</button><button class="btn opt" type="button" data-act="wdtab" data-v="pants" aria-pressed="false">البنطلون</button><button class="btn opt" type="button" data-act="wdtab" data-v="hero" aria-pressed="true">بدلات خاصة</button></div>'
   +'<div class="wd-grid">'+items+'</div>'
   +(nx?'<div class="prog" style="margin:6px 4px"><i style="width:'+pc+'%"></i></div><p class="sub">البدلة القادمة «'+esc(nx.n)+'» تُفتح عند '+nx.need+' نجوم إنجاز (عنده '+a+').</p>':'<p class="sub ok">فتح كل البدلات الخاصة، ما شاء الله!</p>')
   +'<p class="sub" style="margin-top:8px">كل شارة تعطي نجمة إنجاز، وكل خريطة يكملها تعطيه نجمتين. البدلة الخاصة تحوّل شخصيته كلها وتمشي معه في كل الخرائط.</p>';
}
function wardrobeHtml(k){
  if(wd.tab==='hero')return heroTabHtml(k);
  const o=OU(null,k.av.g),m=mapOf(),tier=tierOf(k),shirt=wd.tab!=='pants',list=shirt?o.shirts:o.pants,key=shirt?'ss':'ps',ckey=shirt?'sh':'pc',cols=shirt?o.sc:o.pcl,ct=shirt?o.st:o.pt,n=wdCount(k),av=effAv(k);
  const cur=list[av[key]]||list[0];
  const items=list.map((it,i)=>{const lock=it.t>tier;
    return '<button class="wd-item'+(lock?' locked':'')+'" type="button" data-act="wdpick" data-k="'+key+'" data-v="'+i+'" aria-pressed="'+(av[key]===i)+'" aria-label="'+esc(it.n)+(lock?'، يُفتح عند '+it.t+'%':'')+'">'
      +'<img alt="" src="'+thumb(k,{[key]:i,hr:''})+'"><span>'+esc(it.n)+'</span>'+(lock?'<span class="lk"><span class="ico i-lock"></span>'+it.t+'%</span>':'')+'</button>';}).join('');
  const sw=cols.map((c,i)=>{const lock=ct[i]>tier;return '<button type="button" class="sw'+(lock?' locked':'')+'" style="background:'+c+'" data-act="wdpick" data-k="'+ckey+'" data-v="'+i+'" aria-pressed="'+(av[ckey]===i)+'" aria-label="لون '+(i+1)+(lock?'، يُفتح عند '+ct[i]+'%':'')+'"></button>';}).join('');
  const girl=k.av.g==='f';
  return '<div class="sheet-head"><div class="av">'+avHtml(k)+'</div><div class="grow"><h2>ملابس '+esc(k.name)+'</h2><div class="sub">مغامرة «'+esc(m.name)+'»: مفتوح له '+(n.s-1)+' من '+(o.shirts.length-1)+' '+(girl?'قمصان':'قمصان')+' و'+(n.p-1)+' من '+(o.pants.length-1)+' '+(girl?'تنانير وبناطيل':'بناطيل')+'</div></div><button class="btn small" type="button" data-act="close">تم</button></div>'
   +'<div class="wd-prev"><img alt="معاينة" src="'+avatarURL(Object.assign({},av,{hr:''}),false)+'"></div>'
   +'<div class="row" style="justify-content:center"><button class="btn opt" type="button" data-act="wdtab" data-v="shirt" aria-pressed="'+shirt+'">القميص</button><button class="btn opt" type="button" data-act="wdtab" data-v="pants" aria-pressed="'+!shirt+'">'+(girl?'التنورة والبنطلون':'البنطلون')+'</button><button class="btn opt" type="button" data-act="wdtab" data-v="hero" aria-pressed="false">بدلات خاصة</button></div>'
   +(av.hr?'<p class="sub ok" style="text-align:center">يلبس الحين بدلة خاصة. اختر «بدلتي العادية» من تبويب البدلات الخاصة ليرجع للملابس العادية.</p>':'')
   +'<div class="wd-grid">'+items+'</div>'
   +'<div class="lbl">اللون</div><div>'+sw+'</div>'+(cur.col?'':'<p class="sub">هذا الزي بألوانه الخاصة، واللون ينطبق على النوع العادي وبعض الأزياء.</p>')
   +'<p class="sub" style="margin-top:10px">ملابس هذه الخريطة لها وحدها. عند المحطات 25% و50% و75% تنفتح ملابس وألوان جديدة بثيم «'+esc(m.name)+'»، وإذا بدأت خريطة أو جولة جديدة ترجع ملابس ذلك الدور من البداية.</p>';
}
function wdHero(id){
  const k=wd&&kidById(wd.id);if(!k||!canCtl(k))return;
  if(id&&!heroOK(k,id)){toast('تُفتح بنجوم الإنجاز');tone(SND.neg);return;}
  k.av=Object.assign({},k.av,{hr:id||''});persistKid(k);tone(SND.pos);setSheet(wardrobeHtml(k));
  if(view==='home')placeActors();else if(view==='kids')renderKids();
}
/* new suits since the last announcement */
function evalHeroes(k){const n=heroList(k.av.g).filter(h=>ach(k)>=h.need).length;if(n>(k.hs|0)){const ids=heroList(k.av.g).filter(h=>ach(k)>=h.need).slice(k.hs|0).map(h=>h.id);k.hs=n;return ids;}return [];}
function openHeroWin(id,ids){
  const k=kidById(id);if(!k||!ids.length)return;const hs=ids.map(i=>heroList(k.av.g).find(h=>h.id===i)).filter(Boolean);
  openSheet('<div class="empty"><div class="big" style="font-size:38px;color:var(--brand)">'+(hs.length>1?'بدلات خاصة جديدة':'بدلة خاصة جديدة')+' يا '+esc(k.name)+'!</div>'
   +'<div class="wd-new">'+hs.map(h=>'<img alt="'+esc(h.n)+'" src="'+avatarURL({sk:k.av.sk,hr:h.id},false)+'" style="height:120px">').join('')+'</div>'
   +'<p style="margin-top:6px"><b>'+hs.map(h=>esc(h.n)).join('، ')+'</b><br><span class="sub">فتحها بإنجازاته. تحوّل شخصيته كلها وتمشي معه في كل الخرائط.</span></p>'
   +'<div class="row" style="justify-content:center;margin-top:14px">'+(canCtl(k)?'<button class="btn gold" type="button" data-act="wardrobe" data-id="'+k.id+'" data-hero="1">البسها الآن</button>':'')+'<button class="btn" type="button" data-act="close">تم</button></div></div>',{});
  confetti(innerWidth*.3,innerHeight*.55,50,1.2);confetti(innerWidth*.7,innerHeight*.55,50,1.2);
}
function openWardrobe(id,tab){const k=kidById(id);if(!k||!canCtl(k))return;wd={id,tab:tab||'shirt'};openSheet(wardrobeHtml(k),{wd:1});}
function wdPick(key,v){
  const k=wd&&kidById(wd.id);if(!k||!canCtl(k))return;const o=OU(null,k.av.g),mid=S.cfg.mapId;
  const t=key==='ss'?o.shirts[v].t:key==='ps'?o.pants[v].t:key==='sh'?o.st[v]:o.pt[v];
  if(t>tierOf(k)){toast('يُفتح عند المستوى '+t+'%');tone(SND.neg);return;}
  k.wear=Object.assign({},k.wear);k.wear[mid]=Object.assign({},k.wear[mid],{[key]:v});persistKid(k);tone(SND.pos);setSheet(wardrobeHtml(k));
  if(view==='home')placeActors();else if(view==='kids')renderKids();
}
/* shown right after a child reaches 25%, 50% or 75% */
function openUnlock(id,tier){
  const k=kidById(id);if(!k)return;const o=OU(null,k.av.g),m=mapOf();
  const ns=o.shirts.map((s,i)=>({s,i})).filter(x=>x.s.t===tier),np=o.pants.map((s,i)=>({s,i})).filter(x=>x.s.t===tier);
  const nc=o.st.filter(t=>t===tier).length+o.pt.filter(t=>t===tier).length,rw=(S.cfg.rewards[tier]||'').trim();
  openSheet('<div class="empty"><div class="big" style="font-size:38px;color:var(--brand)">فتحت ملابس «'+esc(m.name)+'» يا '+esc(k.name)+'!</div>'
   +'<p style="margin-top:6px">وصلت المحطة '+tier+'%'+(rw?' ومكافأتك: '+esc(rw):'')+'</p>'
   +'<div class="wd-new">'+ns.map(x=>'<img alt="" src="'+thumb(k,{ss:x.i})+'">').join('')+np.map(x=>'<img alt="" src="'+thumb(k,{ps:x.i})+'">').join('')+'</div>'
   +'<p class="sub">'+ns.length+' قمصان جديدة، و'+np.length+' بناطيل جديدة، و'+nc+' ألوان إضافية.</p>'
   +'<div class="row" style="justify-content:center;margin-top:14px">'+(canCtl(k)?'<button class="btn gold" type="button" data-act="wardrobe" data-id="'+k.id+'">غيّر ملابسه الآن</button>':'')+'<button class="btn" type="button" data-act="wdlater">'+(canCtl(k)?'لاحقًا':'تم')+'</button></div></div>',{});
}
