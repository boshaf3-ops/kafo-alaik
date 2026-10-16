/* ---------- two more worlds: a sideways jumping world, and a bird's-eye map of the Kingdom of Bahrain ---------- */
START.none=()=>{};

/* ================== 10. عالم القفزات: an original sideways platform world (blocks, bushes, round trees, a stone fort) ================== */
function blk(c,x,y,kind){
  x=Math.round(x);y=Math.round(y);
  if(kind==='gold'){R(c,x,y,10,10,'#8a4a08');R(c,x+1,y+1,8,8,'#ffb02e');R(c,x+1,y+1,8,1,'#ffe27a');R(c,x+1,y+1,1,8,'#ffe27a');R(c,x+8,y+1,1,8,'#d98a10');R(c,x+1,y+8,8,1,'#d98a10');
    R(c,x+4,y+3,2,4,'#fff7c4');R(c,x+3,y+4,4,2,'#fff7c4');R(c,x+2,y+2,1,1,'#8a4a08');R(c,x+7,y+2,1,1,'#8a4a08');R(c,x+2,y+7,1,1,'#8a4a08');R(c,x+7,y+7,1,1,'#8a4a08');return;}
  R(c,x,y,10,10,'#6f3414');R(c,x+1,y+1,4,3,'#e8894a');R(c,x+6,y+1,3,3,'#d6743a');R(c,x+1,y+5,2,3,'#d6743a');R(c,x+4,y+5,5,3,'#e8894a');
  R(c,x+1,y+1,4,1,'#f7c08a');R(c,x+4,y+5,5,1,'#f7c08a');R(c,x+6,y+1,3,1,'#f2a468');R(c,x+1,y+5,2,1,'#f2a468');
}
function coin(c,x,y){x=Math.round(x);y=Math.round(y);ell(c,x,y,2,3,'#b8741a');ell(c,x,y,1,2,'#ffd23f');R(c,x,y-2,1,3,'#fff3b0');}
EMB.fort=(c,x,y)=>{const g=y+2,w='#d9d2bd',d='#a8a18a',rf='#2f9fd0',rfd='#1f6f98';
  R(c,x-14,g-14,29,14,w);R(c,x+1,g-14,14,14,d);for(let i=0;i<6;i++)R(c,x-14+i*5,g-17,3,3,i%2?d:w);
  R(c,x-21,g-25,9,25,w);R(c,x+12,g-25,9,25,d);for(let i=0;i<3;i++){R(c,x-21+i*4,g-28,2,3,w);R(c,x+12+i*4,g-28,2,3,d);}
  tri(c,x-16,g-38,10,6,rf,rfd);tri(c,x+17,g-38,10,6,rf,rfd);
  R(c,x-16,g-46,1,9,'#5b3a1a');R(c,x-15,g-46,5,3,'#ffd23f');R(c,x+17,g-46,1,9,'#5b3a1a');R(c,x+18,g-46,5,3,'#e24a3b');
  R(c,x-3,g-9,7,9,'#3a2210');R(c,x-2,g-10,5,1,'#3a2210');R(c,x-9,g-11,2,3,'#2b3a5c');R(c,x+7,g-11,2,3,'#2b3a5c');R(c,x-18,g-19,2,3,'#2b3a5c');R(c,x+16,g-19,2,3,'#2b3a5c');
  for(let i=0;i<5;i++){R(c,x-12+i*6,g-3,1,3,'#8f8873');}
  sparkle(c,x-24,g-30,'#fff3b0');sparkle(c,x+25,g-34,'#fff3b0');};
/* a staircase of n steps as route points (all straight stretches, so the child really hops up each step) */
const hopSt=(x0,y0,x1,y1,n)=>{const p=[];for(let k=1;k<=n;k++){p.push([x0+(x1-x0)*(k-1)/n,y0+(y1-y0)*k/n,'l']);p.push([x0+(x1-x0)*k/n,y0+(y1-y0)*k/n,'l']);}return p;};
def({id:'hop',feat:'مغامرة أفقية: بلوكات وقفزات وسلالم من الطوب',name:'عالم القفزات',tag:'اقفز بين البلوكات',act:'وصلت إلى حصن القفزات',goal:'fort',start:'sign',seed:111,layout:'h',
  noStone:1,
  wps:[[.04,.80],[.13,.80,'l'],[.20,.80,'l'],...hopSt(.20,.80,.30,.58,4),[.38,.58,'l'],...hopSt(.38,.58,.48,.80,4),[.52,.80,'l'],[.565,.64,'s'],[.615,.64,'s'],[.655,.50,'s'],[.705,.50,'s'],[.745,.64,'s'],[.795,.64,'s'],[.83,.80,'s'],[.86,.80,'l'],...hopSt(.86,.80,.955,.52,5)],
  tile:{a:'#d6743a',b:'#e0884a',hi:'#f7c08a',sh:'#6f3414',w:6,h:3},
  cert:{bg:'#e6f4ff',f1:'#2f7fe0',f2:'#ffd23f',ink:'#10305a',acc:'#d6402f'},
  draw(c,W,H,r,add,path){
    sky(c,W,H,['#5aa9ff','#74b8ff','#8ec7ff','#a9d6ff','#c9e6ff'],H*.72);
    for(const [fx,fy] of [[.05,.13],[.19,.22],[.35,.1],[.51,.2],[.66,.09],[.8,.21],[.93,.12]])cloud(c,W*fx,H*fy,1);
    bird(c,W*.28,H*.3);bird(c,W*.31,H*.33);
    // soft round hills far away
    for(let k=0;k<2;k++){const col=k?'#5fbf55':'#8ad66f',dk=k?'#49a846':'#6fc05a',base=H*(.56+k*.08);
      for(let x=0;x<W;x++){const top=Math.round(base-Math.abs(Math.sin(x*(.021+k*.012)+k*2))*(20-k*5));R(c,x,top,1,H-top,col);R(c,x,top,1,1,k?'#7ad66a':'#b4ec94');if((x*3+top)%9===0)R(c,x,top+4+((x*5)%9),2,2,dk);}}
    // the ground follows the route; a pond lies under the hopping blocks
    const g=groundOf(path,W,['s'],{s:H*.93}),ss=xRange(path,'s'),pit=ss?[ss[0]-7,ss[1]+8]:[-9,-9];
    for(let x=0;x<W;x++){
      if(x>=pit[0]&&x<=pit[1]){const y0=Math.round(H*.9);R(c,x,y0,1,H-y0,'#2f8fd0');R(c,x,y0,1,2,'#8fd2f5');if(((x>>2)+(x&1))%3===0)R(c,x,y0+5,3,1,'#5cb4ea');if(x===pit[0]||x===pit[1])R(c,x,y0-2,1,H,'#6f3414');continue;}
      const top=Math.round(g[x]),raised=top<H*.74,base=raised?'#d6743a':'#c8803c',mort=raised?'#7a3a18':'#7a4a22';
      R(c,x,top,1,3,'#58c15a');R(c,x,top,1,1,'#8ad66f');R(c,x,top+3,1,1,'#3a9a46');
      R(c,x,top+4,1,H-top-4,base);
      for(let y=top+12;y<H;y+=9)R(c,x,y,1,1,mort);
      if(x%9===0)R(c,x,top+4,1,H-top-4,mort);
      if((x*7)%13===0)R(c,x,top+7+((x*5)%20),1,2,raised?'#e8894a':'#dc9a54');}
    for(let x=1;x<W-1;x++){const dy=g[x+1]-g[x-1];if(Math.abs(dy)>5&&!(x>=pit[0]&&x<=pit[1])){const hi=Math.min(g[x-1],g[x+1]),lo=Math.max(g[x-1],g[x+1]),side=dy>0?x:x+1;R(c,side,hi,1,lo-hi,'#6f3414');}}
    // round trees, bushes and flowers stand on the ground line behind the route
    const flat=x=>x>8&&x<W-30&&!(x>=pit[0]-10&&x<=pit[1]+10)&&Math.abs(g[Math.min(W-1,x+5)]-g[Math.max(0,x-5)])<2;
    for(let x=22,k=0;x<W-34;x+=16+Math.floor(r()*18),k++){if(!flat(x))continue;const by=Math.round(g[x]);
      if(k%3===1){ell(c,x,by-2,7,4,'#2e8b3d');ell(c,x-1,by-3,6,3,'#3fa04a');R(c,x-3,by-4,2,1,'#6fd078');R(c,x+2,by-3,2,1,'#6fd078');R(c,x+3,by-1,1,1,'#2e8b3d');}
      else tree(c,x,by,1+(k%2));}
    for(let x=14;x<W-20;x+=19+Math.floor(r()*17)){if(!flat(x))continue;if(r()<.5)flower(c,x,Math.round(g[x]),['#ff7eb6','#ffd23f','#ffffff'][Math.floor(r()*3)]);}
    // blocks floating high in the sky, as decoration
    for(const fx of [.12,.64]){const bx=Math.round(W*fx),by=Math.round(H*.34);for(let i=0;i<5;i++)blk(c,bx+i*10,by,i%2?'gold':'brick');}
    for(const fx of [.3,.86]){const bx=Math.round(W*fx),by=Math.round(H*.26);for(let i=0;i<3;i++)blk(c,bx+i*10,by,i===1?'gold':'brick');}
  },
  extra(c,path,m){
    const lv=path.lv,runs=[];let run=null;
    for(let i=0;i<=100;i++){const p=lv[i],flat=path.tyAt(i/100)==='s'&&i>0&&i<100&&Math.abs(lv[i+1][1]-lv[i-1][1])<1.2;
      if(flat){if(!run)run={x0:p[0],x1:p[0],y:p[1]};else run.x1=p[0];}else if(run){runs.push(run);run=null;}}
    if(run)runs.push(run);
    // floating platforms of blocks that carry the hopper across the pond
    runs.forEach(r=>{const n=Math.max(3,Math.round((r.x1-r.x0)/10)+1),sx=(r.x0+r.x1)/2-n*5;for(let k=0;k<n;k++)blk(c,sx+k*10,r.y,(k===Math.floor(n/2))?'gold':'brick');});
    // coins: little rows on the ground and arcs over every jump
    for(let i=1;i<100;i++){const p=lv[i],ty=path.tyAt(i/100),near=[25,50,75].some(k=>Math.abs(i-k)<4);if(near)continue;
      if(ty==='s'){const flat=Math.abs(lv[i+1][1]-lv[i-1][1])<1.2;if(!flat&&i%2===0)coin(c,p[0],p[1]-12);else if(flat&&i%4===0)coin(c,p[0],p[1]-14);}
      else if(i%16<4&&Math.abs(lv[Math.min(100,i+1)][1]-lv[i-1][1])<1.2)coin(c,p[0],p[1]-14);}
  }});

/* ================== 11. خريطة مملكة البحرين: seen from above, outline traced from the hand-drawn reference the teacher chose ================== */
/* the land is a 126x243 bitmap (run-lengths: sea, land, sea, ...); stations are given in pixels of the reference picture */
const BH_REF={x0:187,y0:26,gw:126,gh:243,rle:"2y,7,39,b,37,b,36,d,35,e,33,h,2z,m,2v,o,2u,p,2t,p,2t,q,2s,q,2s,q,2s,q,2s,q,2s,q,2s,r,2r,r,2r,r,2n,1,3,i,2,7,2n,2,1,c,1,5,4,6,2n,e,b,6,1x,1,o,e,c,6,1u,8,k,7,2,5,c,6,1u,9,9,1,8,7,k,6,1t,b,7,3,7,7,k,6,1d,e,1,e,3,5,6,8,k,6,18,17,5,8,l,5,15,1b,3,8,m,5,13,1e,1,9,n,3,13,1p,1s,1q,1r,1s,1p,1u,1k,20,1h,22,1g,25,1d,27,1b,28,1a,28,1a,28,1a,27,1b,26,1d,24,1f,1g,5,h,1h,1e,8,b,1l,1e,9,8,1n,1e,c,3,1o,1g,23,1f,k,6,1d,1g,h,9,1d,1f,g,b,1c,1g,e,c,1c,1h,c,c,1c,1j,a,d,1c,1j,a,d,p,3,j,1l,9,d,o,5,2,2,d,1n,8,e,m,c,b,1o,8,e,k,d,b,1p,7,e,j,e,b,1r,5,e,h,g,b,1s,4,e,g,h,b,1t,3,e,f,i,b,1u,2,e,f,i,b,1u,3,c,f,i,c,1v,2,c,6,1,7,j,c,2a,2,5,6,j,d,2h,5,j,d,2h,5,j,d,2i,4,j,d,2i,5,i,d,2i,5,i,d,2h,6,j,b,2c,c,k,a,2b,e,k,9,2b,e,k,9,2c,d,k,b,29,e,k,d,27,f,j,e,25,g,j,e,25,g,j,f,24,g,j,f,25,g,9,1,7,g,25,1e,24,1e,24,1f,22,1g,22,1h,20,1i,1y,1l,1w,1m,1w,1n,1u,1o,1v,1o,1u,1o,1u,1p,1t,1p,1t,1p,1t,1p,1t,1p,1t,1p,1s,1q,1t,1p,1v,1n,1v,1n,1w,1m,1w,1m,1w,1m,1v,1o,1t,1p,1s,1q,1s,1r,1r,1r,1s,1q,1s,1q,1s,1r,1r,1r,1r,1s,1r,1r,1t,1o,1v,1n,1w,1l,1x,1k,1y,1k,1x,1k,1x,1l,1x,1k,1y,1k,1y,1k,1y,1k,1y,1j,1z,1j,1z,1j,1z,1j,1z,1j,1z,1j,1z,1j,1y,1k,1y,1k,1y,1j,1y,1k,1y,1j,1y,1j,1z,1j,1z,1i,20,1i,20,1h,20,1h,21,1g,22,1g,22,1g,22,1g,21,1h,21,1h,20,1i,20,1i,20,1i,20,1j,1z,1j,1z,1j,1z,1j,1z,1j,1z,1j,1z,1j,1z,1k,1y,1k,1y,1k,1y,1l,1x,1l,1x,1m,1w,1n,1w,1n,1v,1o,1u,1p,1t,1p,1t,1q,1r,1u,1o,1w,1l,1y,1k,1z,1j,21,1h,22,1g,23,1f,24,1e,24,1e,25,1d,26,1c,27,1b,28,1a,2b,17,2c,16,2c,15,2d,15,2e,14,2e,13,2g,12,2g,12,2h,11,2i,10,2i,10,2j,z,2k,y,2k,y,2l,x,2m,w,2m,w,2n,v,2o,u,2o,u,2p,t,2p,u,2p,t,2q,s,2q,s,2q,s,2r,q,2s,p,2t,o,2u,n,2v,n,2w,l,2x,l,2x,k,2y,j,2z,i,30,i,30,h,31,g,32,f,34,d,36,b,37,b,38,9,39,8,3a,8,3b,6,3c,6,3c,6,3d,4,3e,4,3f,3,3f,3,12"};
let _bhMask=null;
function bhMask(){if(_bhMask)return _bhMask;const g=BH_REF,m=new Float32Array(g.gw*g.gh);let i=0,v=0;
  for(const t of g.rle.split(',')){const n=parseInt(t,36);if(v)m.fill(1,i,i+n);i+=n;v^=1;}
  const o=new Float32Array(m.length);
  for(let y=0;y<g.gh;y++)for(let x=0;x<g.gw;x++){let s=0,k=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=g.gw||Y>=g.gh)continue;const w=(dx&&dy)?1:(dx||dy)?2:4;s+=m[Y*g.gw+X]*w;k+=w;}o[y*g.gw+x]=s/k;}
  return(_bhMask=o);}
/* the scale: the whole country fits the width, stretched north-south so the country is long and the player scrolls down the page */
function bhS(W,H){const g=BH_REF,sx=Math.min((W-10)/g.gw,(H-20)/g.gh),sy=Math.min((H-20)/g.gh,sx*1.4);return{x:sx,y:sy};}
/* reference-picture pixels (or grid units with grid=1) to scene pixels */
function bhXY(x,y,W,H,grid){const g=BH_REF,S=bhS(W,H),gx=grid?x:(x-g.x0)/2,gy=grid?y:(y-g.y0)/2;return[W/2+(gx-g.gw/2)*S.x,H/2+(gy-g.gh/2)*S.y];}
const BH_WP=[[357,478],[352,440],[340,400],[318,366],[294,334],[282,296],[284,262],[290,236],[304,222],[330,216],[352,212],[340,186],[322,160],[350,176],[390,176],[408,150],[392,164],[360,158],[346,128],[338,100],[362,92],[392,66],[411,47]];
/* the stations in travel order: icon offset from the stop and the side its name sits on */
const BH_ST=[
  {n:'رأس البر',p:[357,478],ic:'gazelle',ox:20,oy:3,side:'r'},
  {n:'الزلاق',p:[294,334],ic:'f1',ox:22,oy:3,side:'r'},
  {n:'المالكية',p:[282,296],ic:'palms',ox:19,oy:3,side:'r'},
  {n:'صدد',p:[284,262],ic:'mosque',ox:20,oy:3,side:'r'},
  {n:'مدينة حمد',p:[304,222],ic:'r22',ox:-4,oy:-12,side:'c'},
  {n:'الرفاع',p:[352,212],ic:'riffa',ox:16,oy:8,side:'r'},
  {n:'مدينة عيسى',p:[322,160],ic:'gate',ox:-21,oy:3,side:'l'},
  {n:'سترة',p:[408,150],ic:'refinery',ox:-3,oy:-2,side:'r'},
  {n:'المنامة',p:[338,100],ic:'bfh',ox:-22,oy:5,side:'l'},
  {n:'المحرق',p:[411,47],ic:'airport',ox:0,oy:0,side:'l',goal:1}
];
function coastDist(L,W,H,cap){const d=new Uint8Array(W*H),q=[];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,v=L[i];if((x>0&&L[i-1]!==v)||(x<W-1&&L[i+1]!==v)||(y>0&&L[i-W]!==v)||(y<H-1&&L[i+W]!==v)){d[i]=1;q.push(i);}}
  for(let h=0;h<q.length;h++){const i=q[h],x=i%W,y=(i/W)|0,v=L[i],nd=d[i]+1;if(nd>cap)continue;
    if(x>0&&!d[i-1]&&L[i-1]===v){d[i-1]=nd;q.push(i-1);}if(x<W-1&&!d[i+1]&&L[i+1]===v){d[i+1]=nd;q.push(i+1);}
    if(y>0&&!d[i-W]&&L[i-W]===v){d[i-W]=nd;q.push(i-W);}if(y<H-1&&!d[i+W]&&L[i+W]===v){d[i+W]=nd;q.push(i+W);}}
  return d;}
function roadLine(c,x0,y0,x1,y1,th){const n=Math.ceil(Math.hypot(x1-x0,y1-y0));for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n,y=y0+(y1-y0)*i/n;R(c,x-th/2,y-th/2,th,th,'#8c96a3');}
  for(let i=0;i<=n;i+=4){const x=x0+(x1-x0)*i/n,y=y0+(y1-y0)*i/n;R(c,x,y,1,1,'#ffffff');}}
const _bhRGB=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const DIG2=['111','001','111','100','111'];
/* little landmark icons; x,y is the middle of the base */
const BHI={
  gazelle:(c,x,y)=>{ell(c,x,y+1,9,2,'rgba(0,0,0,.18)');ell(c,x-1,y-6,6,3,'#c98a42');R(c,x-6,y-4,10,1,'#f1dcb0');R(c,x-5,y-6,10,1,'#8a5a22');
    R(c,x+4,y-12,3,6,'#c98a42');R(c,x+5,y-14,5,3,'#c98a42');R(c,x+9,y-13,2,2,'#e6c08a');R(c,x+10,y-13,1,1,'#222');R(c,x+7,y-14,1,1,'#222');R(c,x+4,y-15,2,1,'#c98a42');
    R(c,x+5,y-19,1,5,'#3a2a1a');R(c,x+6,y-20,1,2,'#3a2a1a');R(c,x+8,y-19,1,5,'#3a2a1a');R(c,x+9,y-20,1,2,'#3a2a1a');
    for(const lx of [-6,-4,1,3])R(c,x+lx,y-3,1,4,'#7a4a1a');R(c,x-8,y-8,2,2,'#f1dcb0');},
  f1:(c,x,y)=>{ell(c,x,y+1,10,2,'rgba(0,0,0,.18)');R(c,x-7,y-20,1,18,'#5b3a1a');for(let j=0;j<3;j++)for(let i=0;i<5;i++)R(c,x-6+i*2,y-20+j*2,2,2,(i+j)%2?'#222831':'#ffffff');
    R(c,x-8,y-5,17,3,'#ce1126');R(c,x+9,y-4,3,1,'#ce1126');R(c,x-9,y-8,2,4,'#222831');R(c,x-1,y-7,3,2,'#222831');R(c,x-5,y-3,3,3,'#222831');R(c,x+4,y-3,3,3,'#222831');R(c,x-7,y-4,6,1,'#ffffff');},
  r22:(c,x,y)=>{ell(c,x,y-6,10,6,'#59616d');ell(c,x,y-6,9,5,'#8c96a3');ell(c,x,y-6,5,3,'#59616d');ell(c,x,y-6,4,2,'#58c15a');R(c,x,y-12,1,5,'#8fd6f5');R(c,x-1,y-13,3,1,'#cfeeff');
    R(c,x-6,y-24,13,8,'#1f5fb8');R(c,x-6,y-24,13,1,'#ffffff');R(c,x,y-16,1,5,'#59616d');
    for(const [ox,t] of [[-5,DIG2],[0,DIG2]])t.forEach((row,j)=>{for(let i=0;i<3;i++)if(row[i]==='1')R(c,x+ox+i,y-22+j,1,1,'#ffffff');});},
  riffa:(c,x,y)=>{ell(c,x,y-6,10,6,'#59616d');ell(c,x,y-6,9,5,'#8c96a3');ell(c,x,y-6,5,3,'#59616d');ell(c,x,y-6,4,2,'#58c15a');
    R(c,x-2,y-18,5,13,'#e6c48a');R(c,x-2,y-18,2,13,'#f4dca0');R(c,x-3,y-19,7,2,'#c99a5c');ell(c,x,y-21,3,3,'#ffd23f');R(c,x,y-26,1,3,'#ffd23f');R(c,x-4,y-7,9,2,'#c99a5c');},
  gate:(c,x,y)=>{ell(c,x,y+1,13,2,'rgba(0,0,0,.18)');R(c,x-11,y-17,7,17,'#e6c48a');R(c,x+5,y-17,7,17,'#d2ad6e');R(c,x-11,y-17,2,17,'#f4dca0');
    for(let i=0;i<3;i++){R(c,x-11+i*3,y-20,2,3,'#e6c48a');R(c,x+5+i*3,y-20,2,3,'#d2ad6e');}
    R(c,x-4,y-17,10,5,'#e6c48a');R(c,x-4,y-12,10,1,'#c99a5c');R(c,x-3,y-11,8,11,'#3a2a1a');R(c,x-2,y-12,6,1,'#3a2a1a');R(c,x-8,y-12,2,3,'#3a2a1a');R(c,x+8,y-12,2,3,'#3a2a1a');
    R(c,x,y-26,1,6,'#5b3a1a');R(c,x+1,y-26,5,3,'#ce1126');R(c,x+1,y-24,5,1,'#ffffff');},
  bfh:(c,x,y)=>{ell(c,x,y+1,14,2,'rgba(0,0,0,.18)');R(c,x-12,y-5,25,5,'#9fb4c8');R(c,x-12,y-5,25,1,'#cfe0ee');
    const tw=(tx,h,sl)=>{for(let j=0;j<h;j++){const ty=y-5-h+j+1,cut=j<5?Math.max(0,(5-j)*(sl?1:0)):0;R(c,tx+cut,ty,8-cut,1,j%3===2?'#1f6fa8':'#2b8fd6');R(c,tx+cut,ty,2,1,'#8fd6f5');}R(c,tx+7,y-4-h,1,h,'#1d5a8a');};
    tw(x-10,28,1);tw(x+2,22,1);R(c,x-7,y-37,1,3,'#cfd6de');R(c,x+5,y-31,1,3,'#cfd6de');},
  mosque:(c,x,y)=>{ell(c,x,y+1,12,2,'rgba(0,0,0,.18)');R(c,x-8,y-8,15,8,'#f3ead0');R(c,x-8,y-8,15,1,'#fffbe8');ell(c,x-1,y-9,5,4,'#2fa39a');R(c,x-1,y-15,1,3,'#ffd23f');
    R(c,x+8,y-19,3,19,'#f3ead0');R(c,x+7,y-21,5,2,'#2fa39a');R(c,x+9,y-24,1,3,'#ffd23f');R(c,x-3,y-5,4,5,'#2a6a64');R(c,x-7,y-6,2,2,'#2a6a64');R(c,x+3,y-6,2,2,'#2a6a64');},
  palms:(c,x,y)=>{ell(c,x,y+1,12,2,'rgba(0,0,0,.18)');R(c,x-4,y-6,8,6,'#e6c48a');R(c,x-5,y-7,10,1,'#a8501f');R(c,x-1,y-4,3,4,'#6b4a2b');palm(c,x-8,y,10);palm(c,x+8,y,9);},
  refinery:(c,x,y)=>{ell(c,x,y+1,12,2,'rgba(0,0,0,.18)');R(c,x-9,y-7,9,7,'#cfd6de');ell(c,x-5,y-7,5,2,'#e6ebf0');R(c,x-9,y-3,9,1,'#9aa3b2');R(c,x+2,y-18,3,18,'#9aa3b2');R(c,x+2,y-18,1,18,'#cfd6de');
    R(c,x+3,y-22,1,4,'#ff9a2e');R(c,x+3,y-21,1,2,'#ffd23f');R(c,x+5,y-8,6,8,'#b5bec9');R(c,x+5,y-8,6,1,'#e6ebf0');},
  airport:(c,x,y)=>{ell(c,x,y+2,20,3,'rgba(0,0,0,.18)');R(c,x-17,y-3,36,5,'#59616d');for(let i=-15;i<17;i+=6)R(c,x+i,y-1,3,1,'#ffffff');
    R(c,x+11,y-20,3,17,'#d9d2bd');R(c,x+9,y-26,7,6,'#2b8fd6');R(c,x+9,y-27,7,1,'#d6402f');R(c,x+10,y-25,5,2,'#8fd6f5');
    R(c,x-15,y-11,15,4,'#ffffff');R(c,x-1,y-10,3,2,'#ffffff');R(c,x-15,y-15,3,5,'#ce1126');R(c,x-9,y-9,7,3,'#cfd6de');R(c,x-5,y-14,3,5,'#cfd6de');R(c,x-3,y-10,3,1,'#2b8fd6');}
};
EMB.airport=(c,x,y)=>BHI.airport(c,x-6,y+1);
/* a small wooden dhow with a triangular sail */
function dhow(c,x,y,flip){R(c,x-6,y-2,13,2,'#8a5a2b');R(c,x-5,y,11,1,'#5b3a1a');R(c,flip?x-7:x+7,y-3,1,2,'#8a5a2b');R(c,x,y-9,1,7,'#5b3a1a');
  for(let i=0;i<6;i++){const w=6-i;R(c,flip?x-w:x+1,y-9+i,w,1,'#ffffff');}R(c,x,y-10,1,1,'#ce1126');}
let _bhC=null;
function bhLand(W,H){
  if(_bhC&&_bhC.k===W+'x'+H)return _bhC;
  const m=bhMask(),g=BH_REF,S=bhS(W,H),L=new Uint8Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const gx=(x-W/2)/S.x+g.gw/2-.5,gy=(y-H/2)/S.y+g.gh/2-.5,x0=Math.floor(gx),y0=Math.floor(gy),fx=gx-x0,fy=gy-y0;
    const at=(a,b)=>(a<0||b<0||a>=g.gw||b>=g.gh)?0:m[b*g.gw+a];
    const v=at(x0,y0)*(1-fx)*(1-fy)+at(x0+1,y0)*fx*(1-fy)+at(x0,y0+1)*(1-fx)*fy+at(x0+1,y0+1)*fx*fy;L[y*W+x]=v>.5?1:0;}
  return(_bhC={k:W+'x'+H,L,D:coastDist(L,W,H,16),S});
}
def({id:'bahrain',feat:'خريطة من الأعلى: من رأس البر إلى المحرق',name:'مملكة البحرين',tag:'سافر عبر مدن المملكة',act:'وصلت إلى مطار المحرق',goal:'airport',start:'none',seed:123,tall:3.7,
  route(W,H){return BH_WP.map((p,i)=>{const q=bhXY(p[0],p[1],W,H);return i===BH_WP.length-1?[q[0],q[1],'l']:[q[0],q[1]];});},
  labels(W,H,path){
    const out=[];
    BH_ST.forEach(s=>{const q=bhXY(s.p[0],s.p[1],W,H);out.push(s.side==='c'?{n:s.n,x:q[0]+s.ox,y:q[1]+s.oy-14,side:'c'}:{n:s.n,x:q[0]+s.ox+(s.side==='r'?11:-11),y:q[1]+s.oy-(s.goal?14:5),side:s.side});});
    return out;},
  tile:{a:'#ce1126',b:'#e8394a',hi:'#ffffff',sh:'#7a0a18',w:4,h:3},
  cert:{bg:'#fff5f5',f1:'#ce1126',f2:'#ffd23f',ink:'#5a0a14',acc:'#ce1126'},
  draw(c,W,H,r,add,path){
    const {L,D,S}=bhLand(W,H),img=c.createImageData(W,H),px=img.data,idx=(x,y)=>y*W+x;
    const put=(i,col)=>{const q=_bhRGB(col);px[i*4]=q[0];px[i*4+1]=q[1];px[i*4+2]=q[2];px[i*4+3]=255;};
    const G=(x,y)=>bhXY(x,y,W,H),Gg=(x,y)=>bhXY(x,y,W,H,1);
    /* a rough oval region given in grid cells of the land bitmap */
    const oval=(x,y,p,rx,ry)=>{const dx=(x-p[0])/(rx*S.x),dy=(y-p[1])/(ry*S.y);return dx*dx+dy*dy<=1;};
    const farm=Gg(44,42),farm2=Gg(70,35),man=Gg(81,38),muh=Gg(113,14),duk=Gg(74,184),duk2=Gg(79,150);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=idx(x,y),d=D[i];let col;
      if(!L[i]){col=d<=1?'#bff1ff':d<=3?'#8fdcf5':d<=7?'#5fcbee':d<=13?'#37c0ea':(y>>5)%2?'#2aa8dc':'#2fb2e2';if(d>13&&((x*3+y*5)%31===0))col='#27a2d8';}
      else{ if(d===1)col='#f6e7b4';else if(d===2)col='#efdc9f';
        else{col='#e3c98a';const h=(x*7+y*13)%17;if(h===0)col='#d4b570';else if(h===5)col='#efd9a0';
          if(oval(x,y,farm,10,8)||oval(x,y,farm2,7,4)){col='#9fcf6a';if((x*5+y*3)%9===0)col='#6fb04e';}
          if(oval(x,y,man,8,7)||oval(x,y,muh,6,6)){col='#d9d0b8';if((x*3+y*5)%7===0)col='#b8ad96';else if((x+y*2)%11===0)col='#f0ead8';}
          if(oval(x,y,duk,9,22)||oval(x,y,duk2,6,10)){col=(x+y)%9<3?'#b78a52':'#c9a468';if(x<duk[0]-S.x*3&&(x+y)%5===0)col='#e0c088';}}}
      put(i,col);}
    c.putImageData(img,0,0);
    // the causeway to Muharraq
    {const a=G(362,92),b=G(392,64);roadLine(c,a[0],a[1],b[0],b[1],3);}
    // the race circuit near Sakhir
    {const q=Gg(70,166),rx=5*S.x,ry=7*S.y;for(let t=0;t<Math.PI*2;t+=.12){const x=q[0]+Math.cos(t)*rx,y=q[1]+Math.sin(t+Math.sin(t*2)*.5)*ry;R(c,x,y,2,2,'#59616d');}R(c,q[0]+rx-2,q[1]-1,4,1,'#ffffff');}
    // compass rose and the national flag in the bottom corners
    {const cx=14,cy=H-16;R(c,cx,cy-9,1,19,'#1f3a5a');R(c,cx-9,cy,19,1,'#1f3a5a');tri(c,cx,cy-12,8,3,'#ce1126','#9c0d1d');R(c,cx-1,cy-1,3,3,'#ffd23f');}
    {const fx=W-26,fy=H-24;R(c,fx-1,fy-1,1,17,'#5b3a1a');R(c,fx,fy,19,12,'#ce1126');R(c,fx,fy,6,12,'#ffffff');for(let j=0;j<5;j++)R(c,fx+6,fy+j*2+1,j%2?3:4,2,'#ffffff');R(c,fx+6,fy+11,3,1,'#ffffff');}
    // coast life: dhows, fish, waves, palms
    const sea=(x,y)=>x>6&&x<W-6&&y>6&&y<H-6&&!L[idx(x|0,y|0)]&&D[idx(x|0,y|0)]>12,land=(x,y)=>L[idx(x|0,y|0)]&&D[idx(x|0,y|0)]>4&&!oval(x,y,man,8,7)&&!oval(x,y,duk,9,22);
    add(6,{y0:H*.04,y1:H*.97,ok:sea,margin:12},(c,x,y,r)=>dhow(c,x,y,r()<.5));
    add(8,{y0:H*.04,y1:H*.97,ok:sea,margin:10},(c,x,y,r)=>fish(c,x,y,['#ff9a2e','#ffd23f','#ff7eb6'][Math.floor(r()*3)],r()<.5));
    add(26,{y0:H*.04,y1:H*.97,ok:sea,margin:6},(c,x,y)=>{R(c,x,y,3,1,'#ffffff');R(c,x+4,y+1,2,1,'rgba(255,255,255,.6)');});
    add(11,{y0:H*.1,y1:H*.95,ok:land,margin:12},(c,x,y,r)=>palm(c,x,y,7+Math.floor(r()*3)));
    add(8,{y0:H*.1,y1:H*.95,ok:land,margin:6},(c,x,y,r)=>rock(c,x,y,1,'#b7a37a','#8a7650','#d8c9a2'));
  },
  extra(c,path,m){
    const W=c.canvas.width,H=c.canvas.height;
    BH_ST.forEach(s=>{if(s.goal)return;const q=bhXY(s.p[0],s.p[1],W,H),ix=q[0]+s.ox,iy=q[1]+s.oy+6;
      for(let t=.2;t<.85;t+=.2)R(c,q[0]+(ix-q[0])*t,q[1]+(iy-6-q[1])*t,1,1,'#ffffff');
      BHI[s.ic](c,ix,iy);});
  }});

/* ---------- station names written on the map (DOM text over the scene, so Arabic stays sharp) ---------- */
function renderLabels(){
  const host=$('#actors');if(!host||!curScene)return;const id=MAPS[S.cfg.mapId]?S.cfg.mapId:'peak',m=MAPS[id],key=id+'@'+curScene.W+'x'+curScene.H;
  if(!m.labels){host.querySelectorAll('.stn').forEach(e=>e.remove());host.dataset.lbl='';return;}
  if(host.dataset.lbl===key&&host.querySelector('.stn'))return;
  host.querySelectorAll('.stn').forEach(e=>e.remove());host.dataset.lbl=key;
  const W=curScene.W,H=curScene.H;
  const sc=curGeo.scale||1;
  m.labels(W,H,curScene.path).forEach(L=>{const e=document.createElement('div');e.className='stn '+L.side+(L.title?' ttl':'');e.textContent=L.n;
    const w=(L.n.length*6.4+16)/sc;let x=L.x;if(L.side==='r')x=Math.min(x,W-w-1);else if(L.side==='l')x=Math.max(x,w+1);else x=Math.min(Math.max(x,w/2+1),W-w/2-1);
    e.style.left=(x/W*100)+'%';e.style.top=(L.y/H*100)+'%';e.setAttribute('aria-hidden','true');host.appendChild(e);});
}
