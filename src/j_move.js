/* ---------- how the characters move and feel ----------
   A good behaviour makes the child run (or climb) happily. On the mountain-style maps a bad behaviour makes
   him tumble down and lie there; on the sideways maps he walks back with his head down.
   After any bad behaviour he stays sad (frown, tear, lowered head) until the next good one makes him smile at once. */
const mv={};
const isSad=k=>!!k.sad&&!isDone(k)&&k.pts<goal();
/* a pose is a short code: l1/l2 = which foot is lifted, s = sad face, d1/d2 = head lowered by 1 or 2 pixels */
function poseCv(cv,fx){
  const l=+((/l(\d)/.exec(fx)||[])[1]||0),sad=/s/.test(fx),dn=+((/d(\d)/.exec(fx)||[])[1]||0),sc=cv.getContext('2d');
  if(sad){
    const px=(x,y)=>sc.getImageData(x,y,1,1).data,eye=px(6,6),mo=px(7,9);
    if(mo[3]>200&&mo[0]>150&&mo[1]<120){const mc='rgb('+mo[0]+','+mo[1]+','+mo[2]+')';R(sc,6,10,1,1,mc);R(sc,9,10,1,1,mc);}
    if(eye[3]>200&&eye[0]<70&&eye[1]<70){R(sc,5,8,1,1,'#8fd8ff');R(sc,10,8,1,1,'#8fd8ff');R(sc,5,9,1,1,'#d7f2ff');R(sc,10,9,1,1,'#d7f2ff');}
  }
  if(!l&&!dn)return cv;
  const out=mk(CH_W,CH_H),c=out.getContext('2d');c.drawImage(cv,0,0);
  if(l){const x0=l===1?3:8,w=l===1?5:5;c.clearRect(x0,18,w,4);c.drawImage(cv,x0,18,w,4,x0,16,w,4);}
  if(dn){c.clearRect(0,0,CH_W,11);c.drawImage(cv,0,0,CH_W,11,0,dn,CH_W,11);}
  return out;
}
function poseFx(k,mo){
  const sad=isSad(k)||(mo&&mo.sad);let s='';
  if(mo&&mo.leg)s+='l'+mo.leg;
  if(sad)s+='s'+'d'+((mo&&mo.down)||1);
  return s;
}
const easeIO=u=>u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
const mvDone=id=>{delete mv[id];bobbing[id]=false;placeActors();};
/* the picture and transform used for a character this frame (called from placeActors) */
function applyMove(k,el,img,upBase){
  const mo=mv[k.id];el.classList.toggle('idle',!mo);
  const fx=poseFx(k,mo),up=mo&&mo.up!=null?mo.up:upBase,want=avatarURL(effAv(k),up,fx);
  if(img.getAttribute('src')!==want)img.src=want;
  const tf=mo?'translateY('+(mo.ty||0)+'%) scaleX('+(mo.dir<0?-1:1)+') rotate('+(mo.rot||0)+'deg)':'';
  if(img.style.transform!==tf)img.style.transform=tf;
  const og=mo&&(mo.m==='fall'||mo.m==='lie'||mo.m==='rise')?'50% 55%':'50% 92%';
  if(img.style.transformOrigin!==og)img.style.transformOrigin=og;
  return mo?(mo.hop||0):null;
}
function xAt(k,l){return kidPos(k,l)[0];}
/* the whole trip of one character from level a to level b */
function moveKid(id,from,to,tok){
  const k=kidById(id),hz=!!curGeo.hz,neg=to<from,dist=Math.abs(to-from),t0=performance.now();
  const x0=xAt(k,from),x1=xAt(k,to);let dir=(x1-x0)>=0?1:-1,px=x0;
  const alive=()=>animTok[id]===tok;
  const track=(l)=>{const x=xAt(k,l);if(Math.abs(x-px)>.05)dir=x>px?1:-1;px=x;};
  if(!neg){
    const dur=clamp(dist*55,500,1800);bobbing[id]=true;
    const mo=mv[id]={m:'run',dir,hop:0,rot:0,leg:1,up:null,sad:false};
    (function step(now){if(!alive())return;const ms=now-t0,u=clamp(ms/dur,0,1),l=from+(to-from)*easeIO(u);disp[id]=l;track(l);
      const ph=Math.floor(ms/115)%2;mo.dir=dir;mo.leg=ph+1;
      if(hz){const h=Math.abs(Math.sin(ms/105));mo.hop=h*9;mo.rot=7;mo.up=h>.72;}
      else{mo.hop=Math.abs(Math.sin(ms/115))*3;mo.rot=ph?-4:4;mo.up=!!ph;}
      placeActors();camFollow(id);
      if(u<1)requestAnimationFrame(step);else{disp[id]=to;mvDone(id);}})(t0);
    return;
  }
  if(hz){
    const dur=clamp(dist*85,800,2400);bobbing[id]=true;
    const mo=mv[id]={m:'back',dir,hop:0,rot:5,leg:1,up:false,sad:true,down:2};
    (function step(now){if(!alive())return;const ms=now-t0,u=clamp(ms/dur,0,1),l=from+(to-from)*easeIO(u);disp[id]=l;track(l);
      mo.dir=dir;mo.leg=Math.floor(ms/190)%2+1;mo.hop=Math.abs(Math.sin(ms/190))*1.5;
      placeActors();camFollow(id);
      if(u<1)requestAnimationFrame(step);else{disp[id]=to;mvDone(id);}})(t0);
    return;
  }
  /* mountain maps: he loses his footing, tumbles down the path, lies there, then gets up sadly */
  const dur=clamp(dist*75,800,2100),spins=Math.max(1,Math.round(1+dist/10)),sp=(x1<x0?-1:1)*(Math.random()<.5?1:-1);
  bobbing[id]=true;tone(SND.neg);
  const mo=mv[id]={m:'fall',dir:1,hop:0,rot:0,leg:0,up:true,sad:true,down:1,ty:0};
  (function step(now){if(!alive())return;const ms=now-t0,u=clamp(ms/dur,0,1),e=Math.pow(u,1.5),l=from+(to-from)*e;disp[id]=l;
    mo.rot=sp*spins*360*u;mo.hop=Math.abs(Math.sin(u*Math.PI*(2+dist/9)))*14*(1-u*.55);mo.up=Math.floor(ms/110)%2===0;mo.leg=Math.floor(ms/110)%2+1;
    placeActors();camFollow(id);
    if(u<1)requestAnimationFrame(step);
    else{disp[id]=to;mo.rot=sp*90;mo.hop=0;mo.up=false;mo.leg=0;mo.m='lie';mo.ty=13.6;placeActors();burstAtKid(id,10);
      setTimeout(()=>{if(!alive())return;const r0=performance.now();
        (function rise(n){if(!alive())return;const v=clamp((n-r0)/520,0,1),e2=easeIO(v);mo.m='rise';mo.rot=sp*90*(1-e2);mo.ty=13.6*(1-e2);mo.leg=0;placeActors();
          if(v<1)requestAnimationFrame(rise);else mvDone(id);})(r0);},800);}})(t0);
}
/* a small hop of joy (good behaviour without a change of level) or a slump (bad behaviour without one) */
function reactKid(id,good){
  if(REDUCED||!$('#actors'))return;const tok=(animTok[id]=(animTok[id]||0)+1),t0=performance.now(),D=good?650:700,k=kidById(id);if(!k)return;
  const mo=mv[id]={m:good?'cheer':'slump',dir:1,hop:0,rot:0,leg:0,up:!!good,sad:!good,down:good?0:2};
  (function step(now){if(animTok[id]!==tok)return;const ms=now-t0,u=clamp(ms/D,0,1);
    if(good){mo.hop=Math.abs(Math.sin(u*Math.PI*3))*10;mo.up=true;}else{mo.rot=Math.sin(u*Math.PI*4)*6*(1-u);mo.hop=0;}
    placeActors();if(u<1)requestAnimationFrame(step);else mvDone(id);})(t0);
}
