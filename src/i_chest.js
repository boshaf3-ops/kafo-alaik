/* ---------- treasure chests at 25%, 50% and 75% ----------
   A chest only exists on the map when the parent wrote a reward for that station.
   Every adventure has its own chest. When a child reaches one it bursts open and shows the reward. */
const CH_BX=14,CH_BY=13;
const rewardOf=m=>((S.cfg.rewards&&S.cfg.rewards[m])||'').trim();
function chClassic(c,P){
  R(c,3,0,8,1,P.o);R(c,2,1,10,1,P.o);R(c,1,2,12,3,P.o);
  R(c,3,1,8,1,P.hi);R(c,2,2,10,2,P.lid);R(c,2,4,10,1,P.lidD);
  R(c,1,5,12,6,P.o);R(c,2,5,10,5,P.body);R(c,2,9,10,1,P.dark);R(c,1,11,12,1,P.o);R(c,2,12,10,1,'rgba(0,0,0,.22)');
  R(c,2,5,10,1,P.band);R(c,3,2,1,9,P.band);R(c,10,2,1,9,P.band);
}
const CHEST={
  /* royal blue with gold bands */
  peak:c=>{const P={o:'#1a2350',hi:'#9bbcff',lid:'#5f8fe8',lidD:'#3f6fc8',body:'#2f5fc0',dark:'#213f8a',band:'#ffd23f'};chClassic(c,P);
    R(c,6,5,2,3,'#ffd23f');R(c,6,6,2,1,'#8a5a10');R(c,5,2,1,1,'#ffffff');R(c,8,3,1,1,'#ffffff');R(c,6,1,2,1,'#ffd23f');},
  /* ice crystal with a snow cap and icicles */
  snow:c=>{const O='#2a6ea8';
    R(c,3,0,8,1,'#ffffff');R(c,2,1,10,1,'#ffffff');R(c,1,2,12,1,'#ffffff');R(c,2,3,10,1,'#e6f6ff');
    R(c,1,3,1,2,O);R(c,12,3,1,2,O);R(c,2,4,10,1,O);
    R(c,2,5,1,1,'#cfeeff');R(c,5,5,1,3,'#cfeeff');R(c,8,5,1,2,'#cfeeff');R(c,11,5,1,3,'#cfeeff');
    R(c,1,5,12,6,O);R(c,2,5,10,5,'#74cdf3');R(c,2,9,10,1,'#3a9ad0');R(c,1,11,12,1,O);R(c,2,12,10,1,'rgba(0,0,0,.22)');
    for(let i=0;i<4;i++)R(c,3+i*2,6+i,1,1,'#ffffff');R(c,10,7,1,1,'#ffffff');R(c,9,8,1,1,'#ffffff');
    R(c,5,5,1,3,'#cfeeff');R(c,8,5,1,2,'#cfeeff');
    R(c,6,6,2,3,'#ffffff');R(c,5,7,4,1,'#ffffff');R(c,6,7,2,1,'#7ad0ff');},
  /* black volcanic rock with glowing cracks and a flame */
  volcano:c=>{const O='#100a0a';
    R(c,6,0,2,1,'#ffd23f');R(c,5,1,4,1,'#ff9a2e');R(c,3,1,1,1,'#ff9a2e');R(c,10,1,1,1,'#ff7a1f');
    R(c,2,2,3,1,O);R(c,5,2,4,1,O);R(c,9,2,3,1,O);R(c,1,2,12,3,O);R(c,2,2,10,2,'#3a2e30');R(c,2,4,10,1,'#241a1c');
    R(c,1,5,12,6,O);R(c,2,5,10,5,'#2a2224');R(c,2,9,10,1,'#171112');R(c,1,11,12,1,O);R(c,2,12,10,1,'rgba(0,0,0,.3)');
    R(c,3,2,1,1,'#ff7a1f');R(c,4,3,1,1,'#ffd23f');R(c,9,2,1,1,'#ff7a1f');R(c,8,3,1,1,'#ff7a1f');
    R(c,3,6,1,2,'#ff7a1f');R(c,4,8,2,1,'#ff7a1f');R(c,9,6,1,2,'#ffd23f');R(c,10,8,1,1,'#ff7a1f');R(c,2,5,10,1,'#7a4a1a');
    R(c,6,5,2,3,'#ff7a1f');R(c,6,6,2,1,'#ffd23f');},
  /* teal with silver scales and a little fish */
  river:c=>{const P={o:'#0f3a3a',hi:'#9ff5de',lid:'#2fbfa6',lidD:'#1f9a88',body:'#1f8f80',dark:'#166a60',band:'#d6f1f2'};chClassic(c,P);
    for(let y=6;y<10;y++)for(let x=4;x<10;x++)if((x+y)%2===0)R(c,x,y,1,1,'#37b8a6');
    R(c,5,2,3,1,'#ffd23f');R(c,8,2,1,1,'#ffd23f');R(c,4,3,1,1,'#ffd23f');R(c,6,5,2,3,'#ffd23f');R(c,6,6,2,1,'#8a5a10');},
  /* sandstone with a pyramid lid and a turquoise gem */
  desert:c=>{const O='#5a3a10';
    for(let i=0;i<5;i++){R(c,6-i,i,2+i*2,1,O);if(i>0)R(c,7-i,i,i*2,1,i%2?'#f0c878':'#e8b868');}
    R(c,6,0,2,1,'#ffe27a');R(c,6,2,2,2,'#2fb5c4');R(c,6,2,1,1,'#bff6ff');
    R(c,1,5,12,6,O);R(c,2,5,10,5,'#e8b868');R(c,2,9,10,1,'#b8883a');R(c,1,11,12,1,O);R(c,2,12,10,1,'rgba(0,0,0,.22)');
    R(c,2,5,10,1,'#ffd23f');R(c,2,8,10,1,'#2fb5c4');R(c,4,6,1,1,'#b8883a');R(c,9,6,1,1,'#b8883a');R(c,5,7,1,1,'#b8883a');R(c,8,7,1,1,'#b8883a');
    R(c,6,6,2,2,'#ffd23f');R(c,6,6,1,1,'#fff7c4');},
  /* enchanted purple wood with vines and a pink flower */
  jungle:c=>{const P={o:'#2a1448',hi:'#d2a8f5',lid:'#9a5ad6',lidD:'#7a3ab8',body:'#6a30a8',dark:'#4a2080',band:'#58c15a'};chClassic(c,P);
    R(c,6,0,2,2,'#ee5fa7');R(c,6,0,1,1,'#ffc7de');R(c,4,1,2,1,'#58c15a');R(c,8,1,2,1,'#2e8b3d');R(c,2,3,1,3,'#58c15a');R(c,11,3,1,4,'#2e8b3d');R(c,3,7,1,2,'#58c15a');
    R(c,6,5,2,3,'#ffd23f');R(c,6,6,2,1,'#8a5a10');},
  /* pink seashell with a pearl */
  lake:c=>{const O='#a8467a';
    ell(c,7,5,6,4,O);ell(c,7,5,5,3,'#f8b4d2');ell(c,7,9,6,3,O);ell(c,7,9,5,2,'#e88cb8');
    for(const x of [3,5,7,9,11]){R(c,x,2+(Math.abs(x-7)>3?1:0),1,4,'#e07aa3');}
    R(c,2,6,10,1,O);R(c,3,7,8,1,'#f4a6c4');R(c,1,5,1,3,O);R(c,12,5,1,3,O);
    disc(c,7,6,2,'#ffffff');R(c,6,5,1,1,'#dff4ff');R(c,8,7,1,1,'#e9d9f0');R(c,2,12,10,1,'rgba(0,0,0,.2)');R(c,5,1,4,1,'#ffd9ea');},
  /* crimson pirate chest with a skull */
  island:c=>{const P={o:'#2a0f10',hi:'#ff9a84',lid:'#d6402f',lidD:'#a82a20',body:'#b3342a',dark:'#7a1f1a',band:'#222831'};chClassic(c,P);
    R(c,5,6,4,3,'#ffffff');R(c,5,7,1,1,'#222831');R(c,8,7,1,1,'#222831');R(c,6,8,1,1,'#222831');R(c,7,8,1,1,'#222831');R(c,6,9,2,1,'#222831');
    R(c,6,2,2,1,'#ffd23f');R(c,6,3,2,1,'#c0392b');R(c,2,1,1,1,'#ffffff');},
  /* silver space capsule with a glowing panel */
  space:c=>{const O='#2a1f5a';
    R(c,7,0,1,1,'#ffffff');R(c,7,1,1,1,'#7ae8ff');R(c,4,2,6,1,O);R(c,3,3,8,1,O);R(c,2,4,10,1,O);R(c,4,3,6,1,'#8b5cd6');R(c,3,4,8,1,'#6a3fc0');R(c,5,3,2,1,'#c8a8ff');
    R(c,1,5,12,6,O);R(c,2,5,10,5,'#c8cfe0');R(c,2,9,10,1,'#8a93aa');R(c,1,11,12,1,O);R(c,2,12,10,1,'rgba(0,0,0,.25)');
    R(c,3,6,8,3,O);R(c,4,6,6,2,'#7ae8ff');R(c,4,6,2,1,'#e0fbff');R(c,3,10,1,1,'#ff9a2e');R(c,10,10,1,1,'#ffd23f');R(c,6,10,2,1,'#8b5cd6');}
};
const _chC={};
function chestCv(id){if(_chC[id])return _chC[id];const cv=mk(CH_BX,CH_BY),c=cv.getContext('2d');(CHEST[id]||CHEST.peak)(c);return(_chC[id]=cv);}
const chestURL=id=>{const cv=chestCv(id);return cv._u||(cv._u=cv.toDataURL());};
/* same chest, drawn into a scene (used for the preview cards and certificates) */
function chestAt2(c,id,x,y){c.drawImage(chestCv(id),Math.round(x),Math.round(y));}
const CH_ORD={25:'الأول',50:'الثاني',75:'الثالث'};
const CH_BG={peak:['#2d62c4','#bfe0f7','#4fa043'],snow:['#5a7fb8','#e8f4ff','#f4f9ff'],volcano:['#2a1010','#ff9a4a','#3a2a2a'],river:['#3f9ad8','#bfe6f7','#4a8a3a'],desert:['#4fb8ec','#ffe9ae','#e8d3a0'],jungle:['#1b5a3a','#8fd27a','#2a5a34'],lake:['#25a9c6','#bff1ff','#58c15a'],island:['#37c0ea','#bff1ff','#f0d890'],space:['#0b0a2a','#3a2a7a','#59616d']};

/* ---------- chests standing on the map ---------- */
const chestHold={};let chestVis={};
/* a chest stays on the map for as long as it has a reward; it opens every time a child reaches it again */
function chestVisible(m){return !!rewardOf(m);}
function renderChests(){
  const host=$('#actors');if(!host||!curScene)return;const id=MAPS[S.cfg.mapId]?S.cfg.mapId:'peak',W=curScene.W,P=curScene.path;
  const want={};[25,50,75].forEach(m=>{want[m]=chestVisible(m);});
  [25,50,75].forEach(m=>{
    let el=host.querySelector('.chest[data-m="'+m+'"]');
    if(!want[m]){if(el&&!el.classList.contains('poof')){if(chestVis[m]&&!REDUCED){el.classList.add('poof');setTimeout(()=>el.remove(),650);}else el.remove();}chestVis[m]=false;return;}
    if(!el){el=document.createElement('div');el.className='chest';el.dataset.m=m;el.setAttribute('role','img');el.setAttribute('aria-label','صندوق كنز عند '+m+'%: '+rewardOf(m));el.innerHTML='<img alt="" src="'+chestURL(id)+'">';host.appendChild(el);}
    el.querySelector('img').src=chestURL(id);
    const p=P.lv[m],x=clamp(p[0]+13,9,W-9);
    el.style.width=(CH_BX/W*100)+'%';el.style.left=(x/W*100)+'%';el.style.top=((p[1]+2)/curScene.H*100)+'%';el.style.zIndex=Math.round(p[1])-1;
    el.setAttribute('aria-label','صندوق كنز عند '+m+'%: '+rewardOf(m));chestVis[m]=true;});
}

function bumpChest(m){const el=$('#actors .chest[data-m="'+m+'"]');if(!el||REDUCED)return;el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump');setTimeout(()=>el.classList.remove('bump'),700);}
/* ---------- opening a chest ---------- */
function openChests(id,list,done){
  const k=kidById(id);const m=list.shift();
  if(!k||m==null){if(done)done();return;}
  const rw=rewardOf(m);
  if(!rw){openChests(id,list,done);return;}
  const mid=MAPS[S.cfg.mapId]?S.cfg.mapId:'peak',nm=esc(k.name);
  closePop();
  openSheet('<div class="chest-win" data-m="'+m+'"><div class="chest-stage"><canvas id="chCv" class="chest-cv" width="120" height="72" aria-label="'+nm+' يفتح الكنز '+CH_ORD[m]+'"></canvas><div class="chest-boom" id="chBoom" aria-hidden="true">بووف!</div></div>'
   +'<div class="chest-txt" id="chTxt" role="status"><div class="chest-title">مبروك '+nm+'، فتحت الكنز '+CH_ORD[m]+'!</div>'
   +'<div class="chest-prize"><small>مكافأتك</small><b>'+esc(rw)+'</b></div>'
   +'<div class="row" style="justify-content:center;margin-top:12px"><button class="btn gold" type="button" data-act="close">'+(list.some(x=>rewardOf(x))?'الكنز التالي':'تم')+'</button></div></div></div>',
   {next:()=>openChests(id,list,done)});
  chestAnim(k,m,mid);
}
function chestAnim(k,m,id){
  const cv=$('#chCv');if(!cv)return;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;const W=120,H=72,GY=64,S2=2;
  const bgc=CH_BG[id]||CH_BG.peak,txt=$('#chTxt'),boom=$('#chBoom');
  const av=effAv(k),kd=mk(CH_W,CH_H),ku=mk(CH_W,CH_H);drawChar(kd.getContext('2d'),av,false);drawChar(ku.getContext('2d'),av,true);
  const sprite=chestCv(id),pal=['#ffffff','#ffd23f','#ffe27a'];
  const d=sprite.getContext('2d').getImageData(0,0,CH_BX,CH_BY).data;for(let i=0;i<d.length;i+=4)if(d[i+3]>200&&Math.random()<.18)pal.push('rgb('+d[i]+','+d[i+1]+','+d[i+2]+')');
  const KX=18,CX=70,CY=GY-CH_BY*S2;
  const TB=1.75,parts=[],smoke=[];let boomed=false,shown=false,t0=performance.now(),seed=rng(m*7+3);
  const sky=()=>{const bh=Math.ceil(GY/5),cs=[bgc[0],bgc[0],bgc[1],bgc[1],bgc[1]];cs.forEach((col,i)=>R(c,0,i*bh,W,bh+1,col));
    if(id==='space'||id==='volcano'){for(let i=0;i<14;i++){const x=(i*37+11)%W,y=(i*23+5)%(GY-8);R(c,x,y,1,1,id==='space'?'#ffffff':'#ff9a4a');}}
    R(c,0,GY,W,H-GY,bgc[2]);R(c,0,GY,W,1,'rgba(0,0,0,.18)');};
  const show=()=>{if(shown)return;shown=true;if(txt)txt.classList.add('show');};
  const boomNow=()=>{if(boomed)return;boomed=true;
    for(let i=0;i<54;i++){const a=seed()*Math.PI*2,sp=22+seed()*58;parts.push({x:CX+14,y:CY+13,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-26,c:pal[Math.floor(seed()*pal.length)],s:1+Math.floor(seed()*2.4),l:.8+seed()*.7});}
    for(let i=0;i<7;i++)smoke.push({x:CX+14+(seed()-.5)*14,y:CY+16+(seed()-.5)*8,r:3,vr:9+seed()*6,vy:-8-seed()*8,l:.9});
    tone(SND.win);if(boom)boom.classList.add('go');chestHold[m]=false;renderChests();bumpChest(m);
    try{const r=cv.getBoundingClientRect();confetti(r.left+r.width*.62,r.top+r.height*.55,60,1.3);}catch(e){}
    if(navigator.vibrate)try{navigator.vibrate([40,30,80]);}catch(e){}
    setTimeout(show,350);};
  tone(SND.mile);
  if(REDUCED){boomed=true;show();chestHold[m]=false;renderChests();draw(5,0,true);return;}
  cv.style.cursor='pointer';cv.addEventListener('click',()=>{if(!boomed)t0=performance.now()-TB*1000;});
  let last=t0;
  function draw(t,dt,still){
    c.save();
    if(boomed&&t-TB<.35){const a=(1-(t-TB)/.35)*2.2;c.translate(Math.round((seed()-.5)*a),Math.round((seed()-.5)*a));}
    sky();
    c.fillStyle='rgba(0,0,0,.25)';c.fillRect(KX+4,GY-1,26,3);if(!boomed||still)c.fillRect(CX,GY-1,30,3);
    /* the child cheers, then jumps with joy after the burst */
    const cheer=t>.5||boomed,jump=boomed?Math.abs(Math.sin((t-TB)*6))*7:(t>.5?Math.abs(Math.sin(t*9))*2.5:0);
    c.drawImage(cheer?ku:kd,KX,Math.round(GY-CH_H*S2-jump),CH_W*S2,CH_H*S2);
    if(!boomed){
      const amp=t<.6?0:Math.min(3.4,(t-.6)*3.2),sx=Math.round(Math.sin(t*55)*amp),bob=t<.6?Math.round(Math.sin(t*5)*.8):0;
      c.drawImage(sprite,CX+sx,CY+bob,CH_BX*S2,CH_BY*S2);
      if(t>TB-.22){c.globalAlpha=Math.min(1,(t-(TB-.22))/.22)*.85;c.globalCompositeOperation='lighter';c.drawImage(sprite,CX+sx,CY+bob,CH_BX*S2,CH_BY*S2);c.globalCompositeOperation='source-over';c.globalAlpha=1;R(c,CX-3+sx,CY-3,CH_BX*S2+6,CH_BY*S2+6,'rgba(255,255,255,'+(.18*(t-(TB-.22))/.22)+')');}
      const tw=Math.floor(t*6)%4;R(c,CX+4+tw*6,CY+3+(tw%2)*4,1,1,'#ffffff');R(c,CX+5+tw*6,CY+3+(tw%2)*4,1,1,'#fff3b0');
    }else{
      const e=t-TB;
      /* shock ring, smoke, flying pieces */
      if(e<.45){const rr=e/.45*34;c.strokeStyle='rgba(255,243,176,'+(1-e/.45)+')';c.lineWidth=2;c.beginPath();c.arc(CX+14,CY+13,rr,0,Math.PI*2);c.stroke();}
      if(e<.22){c.fillStyle='rgba(255,255,255,'+(.9*(1-e/.22))+')';c.fillRect(-4,-4,W+8,H+8);}
      for(const s of smoke){s.r+=s.vr*dt;s.y+=s.vy*dt;s.l-=dt*.9;if(s.l>0){c.fillStyle='rgba(235,235,245,'+(s.l*.55)+')';disc(c,s.x,s.y,s.r,c.fillStyle);}}
      for(const p of parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=95*dt;p.l-=dt;if(p.l>0&&p.y<GY+2){c.globalAlpha=Math.min(1,p.l*2);R(c,p.x,p.y,p.s,p.s,p.c);c.globalAlpha=1;}}
      /* the prize floats up where the chest was */
      if(e>.15){const k2=Math.min(1,(e-.15)/.5),py=CY+4-k2*10+Math.sin(e*4)*1.5;spr(c,SPR.star,CX+14-11,Math.round(py),{y:'#ffd23f'},2);R(c,CX+13,Math.round(py)+8,3,3,'#fff7c4');
        if(Math.floor(e*5)%2===0)R(c,CX-2,Math.round(py)+2,1,3,'#fff'),R(c,CX+29,Math.round(py)+14,3,1,'#fff');}
    }
    c.restore();
  }
  (function loop(now){if(!cv.isConnected)return;const t=(now-t0)/1000,dt=Math.min(.05,(now-last)/1000);last=now;
    if(!boomed&&t>=TB)boomNow();draw(t,dt);if(t-TB>3.2&&boomed){draw(t,0);if(!shown)show();}requestAnimationFrame(loop);})(t0);
}
