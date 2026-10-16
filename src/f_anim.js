/* ---------- living map: water, wind and floating things drawn over the baked scene ----------
   The baked bitmap holds the land. This layer, redrawn ~16 times a second at the same low resolution,
   adds: shimmering water and lava, drifting clouds, flying birds, props swaying in gusts, a waving flag,
   twinkling stars, and per-map particles (snow, embers, petals, sand, fireflies). */
const MAPFX={
  peak:{parts:[['petal',14,['#ff7eb6','#ffffff','#c6ef7a']]]},
  snow:{parts:[['snow',80]],twinkle:{n:16,maxY:.5},aurora:true},
  volcano:{lava:['#ff5a1f','#ffd23f','#ff7a1a'],parts:[['ember',36]]},
  river:{water:['#2f8fd0','#5cb4ea','#8fd2f5'],parts:[['petal',8,['#ffffff','#ff7eb6']]],clouds:[[.14,.045,1],[.62,.075,1]]},
  desert:{parts:[['sand',36]]},
  jungle:{water:['#1b7fa6','#4fb3da','#6fd0ea','#8fd2f5'],parts:[['firefly',20],['leaf',9,['#58c15a','#ffd23f','#2f9e4f']]]},
  lake:{water:['#25a9c6','#1b9ab8','#168aa8','#117a98','#0f6f8a','#8fe6f2'],parts:[['petal',8,['#ff9fc4','#ffffff']]],clouds:[[.2,.04,1]]},
  island:{water:['#37c0ea','#2fb2e2','#27a2d8','#2092cc','#1a82bf','#bff1ff'],clouds:[[.3,.028,1]]},
  space:{twinkle:{n:26,maxY:1},shoot:true},
  hop:{water:['#2f8fd0','#5cb4ea','#8fd2f5'],parts:[['leaf',7,['#58c15a','#ffd23f','#8ad66f']]]},
  bahrain:{water:['#37c0ea','#2aa8dc','#2fb2e2','#27a2d8','#5fcbee']}
};
const WATER_HI=((105<<24)|0xffffff)>>>0,WATER_DN=((48<<24)|(0x4f<<16)|(0x32<<8)|0x06)>>>0;
const LAVA_HI=((210<<24)|(0x7a<<16)|(0xe2<<8)|0xff)>>>0,LAVA_DN=((160<<24)|(0x0f<<16)|(0x29<<8)|0xc2)>>>0;
const BIRD_A=[[0,0],[1,1],[2,0],[3,1],[4,0]],BIRD_B=[[0,1],[1,0],[2,1],[3,0],[4,1]];
const gust=t=>Math.max(0,Math.sin(t*.45)*Math.sin(t*.21+1.3));
const hex=h=>parseInt(h.slice(1),16);
let LV=null;

function pixMask(sc,fx){
  const W=sc.W,H=sc.H,N=W*H,d=sc.cv.getContext('2d').getImageData(0,0,W,H).data;
  const wset=new Set((fx.water||[]).map(hex)),lset=new Set((fx.lava||[]).map(hex)),sset=new Set(((sc.rec&&sc.rec.sky)||[]).map(hex));
  const wi=[],li=[],sky=new Uint8Array(N);
  for(let p=0,i=0;p<N;p++,i+=4){
    if(d[i+3]<255)continue;const k=(d[i]<<16)|(d[i+1]<<8)|d[i+2];
    if(wset.has(k))wi.push(p);else if(lset.has(k))li.push(p);
    if(sset.has(k))sky[p]=1;
  }
  const pack=(list,fa,fb)=>{const n=list.length,idx=Int32Array.from(list),a=new Float32Array(n),b=new Float32Array(n);
    for(let j=0;j<n;j++){const x=idx[j]%W,y=(idx[j]/W)|0;a[j]=fa(x,y);b[j]=fb(x,y);}return{n,idx,a,b};};
  return{sky,water:pack(wi,(x,y)=>x*.22+y*.55,(x,y)=>x*.07-y*.3),lava:pack(li,(x,y)=>y*.35+x*.5,(x,y)=>x*.2-y*.6)};
}

function prepLive(sc,id){
  const fx=MAPFX[id]||{},W=sc.W,H=sc.H,r=rng(MAPS[id].seed+5),rec=sc.rec||{clouds:[],birds:[]};
  const L={sc,W,H,fx,on:false,last:0,t0:0};
  const mk2=pixMask(sc,fx);L.water=mk2.water;L.lava=mk2.lava;
  if(L.water.n||L.lava.n){L.shCv=mk(W,H);L.shCtx=L.shCv.getContext('2d');L.shImg=L.shCtx.createImageData(W,H);L.sh32=new Uint32Array(L.shImg.data.buffer);}
  // clouds, birds
  const cl=rec.clouds.map(c=>[c[0],c[1],c[2]]).concat((fx.clouds||[]).map(c=>[c[0]*W,c[1]*H,c[2]]));
  L.clouds=cl.map((c,i)=>({x0:c[0],y:c[1],s:c[2],sp:2.2+c[2]*1.1+(i%3)*.9}));
  L.birds=rec.birds.map((b,i)=>({x0:b[0],y:b[1],col:b[2],sp:7+(i%3)*2.5,ph:i*1.9}));
  // twinkling stars, only on sky pixels
  L.tw=[];if(fx.twinkle){for(let n=0,tries=0;n<fx.twinkle.n&&tries<400;tries++){const x=2+Math.floor(r()*(W-4)),y=2+Math.floor(r()*(H*fx.twinkle.maxY-4));if(mk2.sky[y*W+x]){L.tw.push({x,y,ph:r()*6.3});n++;}}}
  L.aurora=!!fx.aurora;
  // sky layer (clouds, aurora, stars) is clipped to the sky pixels so mountains and emblems stay in front
  if(L.clouds.length||L.tw.length||L.aurora){
    L.skCv=mk(W,H);L.skCtx=L.skCv.getContext('2d');L.skCtx.imageSmoothingEnabled=false;
    const mc=mk(W,H),mctx=mc.getContext('2d'),im=mctx.createImageData(W,H),m32=new Uint32Array(im.data.buffer);
    for(let p=0;p<W*H;p++)if(mk2.sky[p])m32[p]=0xffffffff;
    mctx.putImageData(im,0,0);L.maskCv=mc;
  }
  // flag cloth
  if(MAPS[id].goal==='flag'){const g=sc.path.lv[100];L.flag={x:Math.round(g[0]),y:Math.round(g[1]),h:[]};for(let dx=0;dx<11;dx++){let h=0;for(let i=0;i<7;i++)if(Math.round(11-i*1.5)>dx)h=i+1;L.flag.h.push(h);}}
  // particles
  L.parts=[];
  const pk=MAPS[id].layout==='h'?Math.max(1,W*H/(MW*MH)*.5):1;
  for(const [kind,n,cols] of (fx.parts||[]))for(let i=0,nn=Math.round(n*pk);i<nn;i++)L.parts.push(mkPart(kind,cols,W,H,r,true));
  L.shoot=fx.shoot?{x:0,y:0,age:9,next:3+r()*3}:null;
  L.rr=r;
  return L;
}
function mkPart(kind,cols,W,H,r,first){
  const p={k:kind,x:r()*W,y:r()*H,ph:r()*6.3,col:cols?cols[Math.floor(r()*cols.length)]:'#fff',a:0,b:0,life:0,max:1};
  if(kind==='snow'){p.vy=9+r()*12;p.sz=r()<.25?2:1;}
  else if(kind==='ember'){embReset(p,W,H,r);if(first)p.life=r()*p.max;}
  else if(kind==='petal'||kind==='leaf'){p.vx=6+r()*8;p.vy=kind==='leaf'?(7+r()*6):(2+r()*4);p.y=H*.1+r()*H*.8;}
  else if(kind==='sand'){p.y=H*.42+r()*H*.56;p.len=3+Math.floor(r()*4);p.v=38+r()*34;}
  else if(kind==='firefly'){p.y=H*.25+r()*H*.7;p.tx=p.x;p.ty=p.y;}
  return p;
}
function embReset(p,W,H,r){p.x=W/2+(r()-.5)*28;p.y=H*.125+r()*4;p.vx=-3+r()*12;p.vy=-(14+r()*24);p.life=0;p.max=1.6+r()*1.8;}

function frameLive(t,dt){
  const L=LV;if(!L)return;const c=L.ctx,W=L.W,H=L.H,wind=5+11*gust(t),r=L.rr;
  c.clearRect(0,0,W,H);
  // water and lava shimmer
  if(L.shCv){
    const u=L.sh32;u.fill(0);
    let w=L.water;for(let i=0;i<w.n;i++){const v=Math.sin(w.a[i]-t*1.7)+Math.sin(w.b[i]+t*.8);if(v>1.38)u[w.idx[i]]=WATER_HI;else if(v<-1.5)u[w.idx[i]]=WATER_DN;}
    w=L.lava;for(let i=0;i<w.n;i++){const v=Math.sin(w.a[i]-t*3.4)+Math.sin(w.b[i]+t*1.3);if(v>.95)u[w.idx[i]]=LAVA_HI;else if(v<-1.1)u[w.idx[i]]=LAVA_DN;}
    L.shCtx.putImageData(L.shImg,0,0);c.drawImage(L.shCv,0,0);
  }
  // sky layer
  if(L.skCv){
    const s=L.skCtx;s.clearRect(0,0,W,H);
    if(L.aurora){s.globalAlpha=.22;for(let x=0;x<W;x++){const y=Math.round(H*.12+Math.sin(x*.045+t*.55)*9+Math.sin(x*.11-t*.8)*3);s.fillStyle='#6cf0c2';s.fillRect(x,y,1,12);s.fillStyle='#b58cff';s.fillRect(x,y+12,1,6);}s.globalAlpha=1;}
    for(const w of L.tw){const v=Math.sin(t*2.3+w.ph);if(v>.45)plus(s,w.x,w.y,'#ffffff');else if(v>-.25)R(s,w.x,w.y,1,1,'#ffffff');}
    for(const k of L.clouds){const x=((k.x0+t*k.sp+40*k.s)%(W+70*k.s))-35*k.s;cloud(s,Math.round(x),Math.round(k.y),k.s);}
    s.globalCompositeOperation='destination-in';s.drawImage(L.maskCv,0,0);s.globalCompositeOperation='source-over';
    c.drawImage(L.skCv,0,0);
  }
  // props swaying in the wind
  const g=gust(t);
  for(const s of L.sc.sprites){
    const sw=Math.sin(t*1.7+s.ph)*.9+g*1.3+(g>.4?Math.sin(t*5+s.ph)*.4:0),o1=Math.round(sw),o2=Math.round(sw*.5),h=s.h,a=Math.max(1,Math.floor(h*.34)),b=Math.max(a,Math.floor(h*.68));
    if(h<4){c.drawImage(s.cv,s.x+o2,s.y);continue;}
    c.drawImage(s.cv,0,0,s.w,a,s.x+o1,s.y,s.w,a);
    if(b>a)c.drawImage(s.cv,0,a,s.w,b-a,s.x+o2,s.y+a,s.w,b-a);
    c.drawImage(s.cv,0,b,s.w,h-b,s.x,s.y+b,s.w,h-b);
  }
  // flag cloth
  if(L.flag){const f=L.flag;for(let dx=0;dx<11;dx++){const wob=Math.round(Math.sin(t*6.5-dx*.8)*(.35+dx/11*(.7+g*1.1)));
    for(let i=0;i<f.h[dx];i++)R(c,f.x+1+dx,f.y-22+i+wob,1,1,i<2?'#ff7a6a':'#e24a3b');}}
  // birds
  for(const b of L.birds){const x=((b.x0+t*b.sp)%(W+40))-20,y=b.y+Math.sin(t*.9+b.ph)*3,fr=(Math.floor(t*4+b.ph)%2)?BIRD_A:BIRD_B;c.fillStyle=b.col;for(const q of fr)c.fillRect(Math.round(x)+q[0],Math.round(y)+q[1],1,1);}
  // particles
  for(const p of L.parts){
    if(p.k==='snow'){p.y+=p.vy*dt;p.x+=(wind*.55+Math.sin(t*1.3+p.ph)*5)*dt;if(p.y>H+2){p.y=-2;p.x=r()*W;}if(p.x>W+2)p.x=-2;c.globalAlpha=.9;c.fillStyle='#ffffff';c.fillRect(Math.round(p.x),Math.round(p.y),p.sz,p.sz);c.globalAlpha=1;}
    else if(p.k==='ember'){p.life+=dt;if(p.life>p.max)embReset(p,W,H,r);p.x+=(p.vx+wind*.5)*dt;p.y+=p.vy*dt;const u=p.life/p.max;c.globalAlpha=1-u*u;c.fillStyle=u<.35?'#ffe27a':u<.7?'#ff9a2e':'#e2461f';c.fillRect(Math.round(p.x),Math.round(p.y),u<.5?2:1,u<.5?2:1);c.globalAlpha=1;}
    else if(p.k==='petal'||p.k==='leaf'){p.x+=(p.vx+wind)*dt;p.y+=p.vy*dt+Math.sin(t*2+p.ph)*.18;if(p.x>W+4){p.x=-4;p.y=H*.1+r()*H*.8;}if(p.y>H)p.y=H*.1;c.fillStyle=p.col;const f=Math.floor(t*3+p.ph)%2,x=Math.round(p.x),y=Math.round(p.y);c.fillRect(x,y,2,1);c.fillRect(x+f,y+1,1,1);}
    else if(p.k==='sand'){p.x+=(p.v+wind*2)*dt;if(p.x>W+8){p.x=-8;p.y=H*.42+r()*H*.56;}c.globalAlpha=.55;c.fillStyle='#fff2c4';c.fillRect(Math.round(p.x),Math.round(p.y),p.len,1);c.globalAlpha=1;}
    else if(p.k==='firefly'){
      if(Math.abs(p.tx-p.x)+Math.abs(p.ty-p.y)<2){p.tx=clamp(p.x+(r()-.5)*50,4,W-4);p.ty=clamp(p.y+(r()-.5)*40,H*.2,H*.97);}
      p.x+=(p.tx-p.x)*Math.min(1,dt*.8)+Math.sign(p.tx-p.x)*dt*3;p.y+=(p.ty-p.y)*Math.min(1,dt*.8)+Math.sign(p.ty-p.y)*dt*3;
      const gl=.5+.5*Math.sin(t*2.2+p.ph);if(gl>.3){const x=Math.round(p.x),y=Math.round(p.y);c.globalAlpha=.25*gl;c.fillStyle='#fff3b0';c.fillRect(x-1,y-1,3,3);c.globalAlpha=1;c.fillStyle='#fff9d0';c.fillRect(x,y,1,1);}}
  }
  // shooting star
  if(L.shoot){const s=L.shoot;s.age+=dt;
    if(s.age>s.next){s.age=0;s.next=4+r()*5;s.x=r()*W*.8;s.y=r()*H*.4;}
    if(s.age<.7){const u=s.age/.7,x=s.x+u*70,y=s.y+u*34;for(let i=0;i<9;i++){c.globalAlpha=(1-i/9)*(1-u*.4);c.fillStyle='#ffffff';c.fillRect(Math.round(x-i*2.2),Math.round(y-i*1.05),i<3?2:1,1);}c.globalAlpha=1;}}
}
function tickLive(ts){
  if(!LV||!LV.on)return;if(!LV.cv.isConnected){stopLive();return;}
  if(!document.hidden&&ts-LV.last>=62){const t=(ts-LV.t0)/1000,dt=Math.min(.12,(ts-LV.last)/1000);LV.last=ts;frameLive(t,dt);}
  requestAnimationFrame(tickLive);
}
function startLive(sc,id){
  stopLive();const cv=$('#fxCv');if(!cv)return;
  LV=prepLive(sc,id);LV.cv=cv;LV.ctx=cv.getContext('2d');LV.ctx.imageSmoothingEnabled=false;
  frameLive(0,0);
  if(REDUCED)return;
  LV.on=true;LV.t0=performance.now();LV.last=LV.t0;requestAnimationFrame(tickLive);
}
function stopLive(){if(LV)LV.on=false;LV=null;}
