/* ---------- badges & achievements ---------- */
const dayOf=ts=>{const d=new Date(ts);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const dayAgo=n=>{const d=new Date();d.setDate(d.getDate()-n);return dayOf(d.getTime());};
const dayRec=(k,s)=>(k.days&&k.days[s])||[0,0,0];
/* pixel art: 16x16 */
const STARBMP=['......ooo.......','......o#o.......','.....o#h#o......','.....o###o......','ooooo#####ooooo','o#h##########o.','.o###########o.','..o#########o..','...o#######o...','...o#######o...','..o####o####o..','..o###o.o###o..','.o##oo...oo##o.','.ooo.......ooo.'];
const BADGE_ART={
  star:(c,p)=>{STARBMP.forEach((row,y)=>{for(let x=0;x<row.length;x++){const ch=row[x];if(ch==='.')continue;R(c,x,y+1,1,1,ch==='o'?p[1]:ch==='h'?p[2]:p[0]);}});},
  shield:(c,p)=>{
    for(let y=0;y<15;y++){const w=y<9?7:Math.max(1,7-(y-8));R(c,8-w,y,2*w,1,p[1]);}
    for(let y=1;y<14;y++){const w=y<9?6:Math.max(0,6-(y-8));if(w>0)R(c,8-w,y,2*w,1,p[0]);}
    R(c,4,2,1,5,p[2]);R(c,5,2,3,1,p[2]);
    for(const [x,y] of [[5,6],[6,7],[7,8],[8,7],[9,6],[10,5],[11,4],[6,6],[7,7],[8,6],[9,5],[10,4]])R(c,x,y+1,1,1,'#ffffff');},
  medal:(c,p)=>{
    R(c,4,0,3,6,'#e24a3b');R(c,9,0,3,6,'#2f7fe0');R(c,6,0,1,6,'#b8302a');R(c,9,0,1,6,'#1f5fb8');
    for(let y=-6;y<=6;y++)for(let x=-6;x<=6;x++){const d=x*x+y*y;if(d<=42)R(c,8+x,9+y,1,1,d>30?p[1]:p[0]);}
    R(c,4,6,2,1,p[2]);R(c,3,7,1,2,p[2]);
    for(let i=0;i<5;i++)R(c,8-i,8+i,2*i+1,1,'#ffffff');},
  crown:(c,p)=>{
    R(c,2,9,12,5,p[1]);R(c,3,9,10,4,p[0]);
    for(const x of [2,7,12]){R(c,x,3,2,6,p[1]);R(c,x+(x===7?0:0),2,2,1,p[2]);}
    R(c,3,5,1,4,p[0]);R(c,4,6,1,3,p[0]);R(c,5,7,1,2,p[0]);R(c,9,7,1,2,p[0]);R(c,10,6,1,3,p[0]);R(c,11,5,1,4,p[0]);R(c,8,4,1,5,p[0]);
    R(c,3,10,10,1,p[2]);R(c,4,12,1,1,'#d6402f');R(c,7,12,2,1,'#2f7fe0');R(c,11,12,1,1,'#d6402f');},
  trophy:(c,p)=>{
    R(c,3,1,10,1,p[1]);R(c,3,2,10,6,p[0]);R(c,4,8,8,1,p[0]);R(c,5,9,6,1,p[0]);R(c,7,10,2,2,p[1]);R(c,4,12,8,1,p[1]);R(c,3,13,10,2,p[1]);R(c,5,13,6,1,p[0]);
    R(c,0,2,3,1,p[1]);R(c,0,3,1,3,p[1]);R(c,1,6,2,1,p[1]);R(c,13,2,3,1,p[1]);R(c,15,3,1,3,p[1]);R(c,13,6,2,1,p[1]);
    R(c,4,2,1,5,p[2]);R(c,5,2,1,2,p[2]);R(c,7,4,2,1,'#ffffff');R(c,6,5,4,1,'#ffffff');R(c,7,6,2,1,'#ffffff');}
};
const BADGES=[
  {id:'week',n:'أسبوع نظيف',d:'سبعة أيام متتالية بدون أي سلوك سلبي، وفيها ثلاثة أيام على الأقل بسلوك إيجابي.',art:'shield',p:['#2f7fe0','#14346b','#9cc4ff']},
  {id:'star1',n:'نجمة الحماس',d:'عشرون سلوكًا إيجابيًا في المجموع.',art:'star',p:['#ffd23f','#b8741a','#fff1a8'],star:1},
  {id:'star2',n:'نجمة المثابر',d:'خمسة أيام متتالية فيها سلوك إيجابي كل يوم.',art:'star',p:['#7ad0ff','#1f4a8f','#e3f6ff'],star:1},
  {id:'climb',n:'شارة المتسلق',d:'الوصول إلى المستوى 50 في أي خريطة.',art:'medal',p:['#ffb43a','#a8590f','#ffe7a8']},
  {id:'crown',n:'تاج اليوم',d:'جمع 15 نقطة أو أكثر في يوم واحد.',art:'crown',p:['#ffd23f','#a8741a','#fff1a8']},
  {id:'trophy',n:'كأس المغامرة',d:'إنهاء خريطة كاملة والوصول إلى المستوى 100.',art:'trophy',p:['#ffd23f','#9a6a12','#fff1a8']}
];
const _bdCache={};
function badgeURL(b){if(_bdCache[b.id])return _bdCache[b.id];const cv=mk(16,16);BADGE_ART[b.art](cv.getContext('2d'),b.p);return(_bdCache[b.id]=cv.toDataURL());}
const hasBadge=(k,id)=>!!(k.badges&&k.badges[id]);
function streakPosToday(k){let n=0;for(let i=0;i<60;i++){if(dayRec(k,dayAgo(i))[0]>0)n++;else break;}return n;}
/* progress shown on the badge sheet */
function badgeProg(k,id){
  const cnt=(k.cnt&&k.cnt.pos)||0;
  if(id==='star1')return{cur:Math.min(cnt,20),max:20};
  if(id==='star2')return{cur:Math.min(streakPosToday(k),5),max:5};
  if(id==='week'){let clean=0;for(let i=0;i<7;i++){if(dayRec(k,dayAgo(i))[1]>0)break;clean++;}return{cur:clean,max:7};}
  if(id==='climb')return{cur:Math.min(lvl(k.pts),50),max:50};
  if(id==='crown')return{cur:Math.min(dayRec(k,dayOf(Date.now()))[2],15),max:15};
  if(id==='trophy')return{cur:isDone(k)||k.certs.length?1:0,max:1};
  return{cur:0,max:1};
}
/* checked after every award; returns the ids earned just now */
function evalBadges(k){
  const got=[],ok=(id,cond)=>{if(cond&&!hasBadge(k,id)){k.badges=Object.assign({},k.badges);k.badges[id]=Date.now();got.push(id);}};
  const t=dayOf(Date.now());let neg=0,posDays=0;for(let i=0;i<7;i++){const r=dayRec(k,dayAgo(i));neg+=r[1];if(r[0]>0)posDays++;}
  ok('week',neg===0&&posDays>=3);
  ok('star1',((k.cnt&&k.cnt.pos)||0)>=20);
  ok('star2',streakPosToday(k)>=5);
  ok('climb',lvl(k.pts)>=50||tierOf(k)>=50);
  ok('crown',dayRec(k,t)[2]>=15);
  ok('trophy',k.certs.length>0);
  return got;
}
/* record an award in the counters (sign = +1 for a new entry, -1 for undo) */
function tally(k,e,sign){
  const d=dayOf(e.ts);k.days=Object.assign({},k.days);const r=(k.days[d]||[0,0,0]).slice();
  if(e.k==='pos'){r[0]=Math.max(0,r[0]+sign);r[2]=Math.max(0,r[2]+sign*Math.abs(e.p));k.cnt=Object.assign({pos:0,neg:0},k.cnt);k.cnt.pos=Math.max(0,k.cnt.pos+sign);}
  else{r[1]=Math.max(0,r[1]+sign);k.cnt=Object.assign({pos:0,neg:0},k.cnt);k.cnt.neg=Math.max(0,k.cnt.neg+sign);}
  k.days[d]=r;
  const keys=Object.keys(k.days).sort();while(keys.length>60)delete k.days[keys.shift()];
}
function badgeStrip(k,size){return BADGES.map(b=>'<img class="bd'+(hasBadge(k,b.id)?'':' off')+'" alt="'+esc(b.n)+(hasBadge(k,b.id)?'':'، لم تُفتح بعد')+'" title="'+esc(b.n)+'" src="'+badgeURL(b)+'"'+(size?' style="width:'+size+'px;height:'+size+'px"':'')+'>').join('');}
function badgesHtml(k){
  const n=BADGES.filter(b=>hasBadge(k,b.id)).length;
  return '<div class="sheet-head"><div class="av">'+avHtml(k)+'</div><div class="grow"><h2>شارات '+esc(k.name)+'</h2><div class="sub">حصل على '+n+' من '+BADGES.length+' شارات</div></div><button class="btn small" type="button" data-act="close">تم</button></div>'
   +'<div class="bd-list">'+BADGES.map(b=>{const on=hasBadge(k,b.id),p=badgeProg(k,b.id),pc=Math.round(p.cur*100/p.max);
     return '<div class="bd-row'+(on?' on':'')+'"><img class="bd'+(on?'':' off')+'" alt="" src="'+badgeURL(b)+'"><div class="grow"><b>'+esc(b.n)+(b.star?' <span class="chip gold">نجمة</span>':'')+'</b><div class="sub">'+esc(b.d)+'</div>'
       +(on?'<div class="sub ok">حصل عليها '+esc(fmtDate(k.badges[b.id]))+'</div>':'<div class="prog"><i style="width:'+pc+'%"></i></div><div class="sub">'+p.cur+' من '+p.max+'</div>')+'</div></div>';}).join('')+'</div>';
}
function openBadges(id){const k=kidById(id);if(!k)return;openSheet(badgesHtml(k),{});}
function openBadgeWin(id,ids){
  const k=kidById(id);if(!k)return;const bs=ids.map(i=>BADGES.find(b=>b.id===i)).filter(Boolean);
  openSheet('<div class="empty"><div class="big" style="font-size:38px;color:var(--brand)">'+(bs.length>1?'شارات جديدة':'شارة جديدة')+' يا '+esc(k.name)+'!</div>'
   +'<div class="wd-new">'+bs.map(b=>'<img class="bd big" alt="'+esc(b.n)+'" src="'+badgeURL(b)+'">').join('')+'</div>'
   +bs.map(b=>'<p style="margin-top:6px"><b>'+esc(b.n)+'</b><br><span class="sub">'+esc(b.d)+'</span></p>').join('')
   +'<div class="row" style="justify-content:center;margin-top:14px"><button class="btn gold" type="button" data-act="badges" data-id="'+k.id+'">كل شاراته</button><button class="btn" type="button" data-act="close">تم</button></div></div>',{});
  confetti(innerWidth*.3,innerHeight*.55,50,1.2);confetti(innerWidth*.7,innerHeight*.55,50,1.2);
}
