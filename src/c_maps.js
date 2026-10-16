/* ---------- maps: nine pixel worlds, each with a 100-step path ---------- */
const MW=200,MH=280;
let AREA=1;
const MAPS={},MAP_LIST=[];
function def(m){MAPS[m.id]=m;MAP_LIST.push(m);}

function zig(n,cx,amp,shrink,y0,y1,sx,ex){const p=[[sx,y0]];for(let i=1;i<=n;i++){const t=i/(n+1);p.push([cx+(i%2?-1:1)*amp*(1-t*shrink),y0+(y1-y0)*t]);}p.push([ex,y1]);return p;}

/* a route is a list of waypoints [x,y,type]; the optional type describes the stretch that ENDS at that point:
   w smooth walk (default) | l straight walk | u climb | d drop | b rope bridge | s stepping stones | t stairs | z zip-line | x boat */
function curve(P,T){
  const n=P.length,dense=[],dty=[];
  for(let i=0;i<n-1;i++){const ty=T?T[i+1]:'w';
    if(ty!=='w'){for(let s=0;s<24;s++){const t=s/24;dense.push([P[i][0]+(P[i+1][0]-P[i][0])*t,P[i][1]+(P[i+1][1]-P[i][1])*t]);dty.push(ty);}continue;}
    const p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(n-1,i+2)];
    for(let s=0;s<24;s++){const t=s/24,t2=t*t,t3=t2*t;const f=k=>0.5*((2*p1[k])+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3);dense.push([f(0),f(1)]);dty.push('w');}}
  dense.push(P[n-1]);dty.push(T?T[n-1]:'w');
  const cum=[0];for(let i=1;i<dense.length;i++)cum.push(cum[i-1]+Math.hypot(dense[i][0]-dense[i-1][0],dense[i][1]-dense[i-1][1]));
  const total=cum[cum.length-1];
  const find=d=>{let lo=0,hi=cum.length-1;while(lo<hi-1){const m=(lo+hi)>>1;if(cum[m]<=d)lo=m;else hi=m;}return[lo,hi];};
  const at=t=>{t=clamp(t,0,1);const d=t*total,[lo,hi]=find(d),seg=cum[hi]-cum[lo]||1,u=(d-cum[lo])/seg;return[dense[lo][0]+(dense[hi][0]-dense[lo][0])*u,dense[lo][1]+(dense[hi][1]-dense[lo][1])*u];};
  const tyAt=t=>dty[find(clamp(t,0,1)*total)[0]];
  return{dense,dty,at,tyAt,total,sparse:dense.filter((_,i)=>i%3===0)};
}
function buildPath(wps,W,H,stage,px){
  const P=wps.map(p=>px?[p[0],p[1]]:[stage?W/2+(p[0]-.5)*stage:p[0]*W,p[1]*H]),c=curve(P,wps.map(p=>p[2]||'w'));
  c.lv=[];for(let i=0;i<=100;i++)c.lv.push(c.at(i/100));
  return c;
}
/* where a child at (fractional) level L stands; alt = on the shortcut bridge of a forked route */
function levelPos(path,L,alt){L=clamp(L,0,100);const f=path.fork;if(alt&&f&&path.alt&&L>f.a&&L<f.b)return path.alt.at((L-f.a)/(f.b-f.a));return path.at(L/100);}
function levelTy(path,L,alt){L=clamp(L,0,100);const f=path.fork;if(alt&&f&&path.alt&&L>f.a&&L<f.b)return'b';return path.tyAt(L/100);}
/* a stretch of the route that is sailed (levels [a,b]) */
function gapAt(m,L){const g=m.gaps;if(!g)return-1;for(let i=0;i<g.length;i++)if(L>g[i][0]&&L<g[i][1])return i;return-1;}
function nearPath(path,x,y,m){const m2=m*m;for(const p of path.sparse){const dx=p[0]-x,dy=(p[1]-y)*0.8;if(dx*dx+dy*dy<m2)return true;}return false;}

/* generic mountain drawn column by column; wide screens get foothills on both sides */
function mountain(c,W,H,r,o){
  if(W>232&&!o.noHills){
    const offs=[[-150,.36],[150,.4]];if(W>470)offs.push([-270,.5],[270,.52]);
    o.hills=offs.map(([dx,py])=>Object.assign({},o,{cx:W/2+dx,peakY:H*py,slope:o.slope*1.1,flat:0,snowDepth:Math.min(o.snowDepth||0,12),rockDepth:Math.min(o.rockDepth||0,7),speck:30,hills:null}));
    o.hills.forEach(h=>mtn1(c,W,H,r,h));
  }
  mtn1(c,W,H,r,o);
}
function mtn1(c,W,H,r,o){
  const noise=[];let nz=0;for(let x=0;x<W;x++){nz+=(r()-0.5)*1.4;nz*=0.9;noise.push(nz);}
  for(let x=0;x<W;x++){
    const dx=Math.abs(x-o.cx);let top=Math.round(o.peakY+Math.max(0,(dx-(o.flat||0))/o.slope)+noise[x]*1.5);if(top>=H)continue;
    const left=x<o.cx;let sy=top;
    if(o.snowDepth){sy=top+o.snowDepth+Math.round(Math.sin(x*0.45)*2+noise[x]);R(c,x,top,1,Math.max(1,sy-top),left?o.snowCols[0]:o.snowCols[1]);}
    let ry=sy;
    if(o.rockDepth){ry=sy+o.rockDepth+Math.round(Math.sin(x*0.3+1)*2);R(c,x,sy,1,Math.max(1,ry-sy),left?o.rockCols[0]:o.rockCols[1]);}
    for(let y0=ry,k=0;y0<H;y0+=12,k++){const col=o.bodyCols[(left?0:2)+(k%2)];R(c,x,y0,1,Math.min(12,H-y0),col);}
  }
  for(let i=0;i<(o.speck||0)*AREA;i++){const x=Math.floor(r()*W),dx=Math.abs(x-o.cx),topx=o.peakY+Math.max(0,(dx-(o.flat||0))/o.slope);const y=topx+(o.snowDepth||0)+(o.rockDepth||0)+6+r()*(H-topx-20);if(y>=H)continue;R(c,x,y,2+Math.floor(r()*4),1,x<o.cx?o.speckCols[0]:o.speckCols[1]);}
}
function mtnTop(o,x){let t=o.peakY+Math.max(0,(Math.abs(x-o.cx)-(o.flat||0))/o.slope);if(o.hills)for(const h of o.hills)t=Math.min(t,mtnTop(h,x));return t;}

/* ---------- terrain helpers for sideways worlds: the ground follows the route ---------- */
/* highest route point in every pixel column, ignoring stretches that float (bridges, zip-lines, stones) */
function groundOf(path,W,skip,pits){
  const g=new Array(W).fill(null),d=path.dense,t=path.dty;
  for(let i=0;i<d.length;i++){if(skip.indexOf(t[i])>=0)continue;const x=Math.max(0,Math.min(W-1,Math.round(d[i][0])));if(g[x]==null||d[i][1]<g[x])g[x]=d[i][1];}
  for(const k in pits){const rg=xRange(path,k);if(rg)for(let x=Math.max(0,rg[0]);x<=Math.min(W-1,rg[1]);x++)g[x]=pits[k];}
  let first=g.findIndex(v=>v!=null);if(first<0)return g.fill(0);
  for(let x=0;x<first;x++)g[x]=g[first];
  let last=first;for(let x=first+1;x<W;x++){if(g[x]==null)continue;if(x-last>1){for(let j=last+1;j<x;j++)g[j]=g[last]+(g[x]-g[last])*(j-last)/(x-last);}last=x;}
  for(let x=last+1;x<W;x++)g[x]=g[last];
  return g;
}
function xRange(path,ty){let a=1e9,b=-1e9;const d=path.dense,t=path.dty;for(let i=0;i<d.length;i++)if(t[i]===ty){a=Math.min(a,d[i][0]);b=Math.max(b,d[i][0]);}return b<a?null:[Math.round(a),Math.round(b)];}

/* ================== 1. جبل الأبطال ================== */
def({id:'peak',feat:'مسار متعرّج صعودًا نحو القمة',name:'جبل الأبطال',tag:'اصعد حتى القمة',act:'وصلت إلى قمة جبل الأبطال',goal:'flag',start:'tent',seed:11,
  wps:zig(7,.5,.32,.7,.93,.15,.5,.5),
  tile:{a:'#b9b29d',b:'#cdc6b2',hi:'#efe9d8',sh:'#6f6a5a',w:6,h:3},
  cert:{bg:'#eaf7ec',f1:'#1f6f43',f2:'#f4b400',ink:'#103a26',acc:'#d6402f'},
  draw(c,W,H,r,add){
    sky(c,W,H,['#4fb8ec','#6cc6f2','#8dd4f6','#b0e2f8','#d3effa'],H*.7);
    disc(c,W*.84,H*.09,9,'#fff3b0');disc(c,W*.84,H*.09,6,'#ffe27a');
    cloud(c,W*.1,H*.1,2);cloud(c,W*.66,H*.2,1);cloud(c,W*.04,H*.3,1);bird(c,W*.3,H*.14);bird(c,W*.38,H*.17);
    tri(c,W*.08,H*.36,H*.14,H*.17,'#a9c6e4','#94b3d6');tri(c,W*.94,H*.3,H*.16,H*.18,'#a9c6e4','#94b3d6');
    const o={cx:W*.5,peakY:H*.1,slope:.55,snowDepth:20,snowCols:['#ffffff','#d9e8f4'],rockDepth:14,rockCols:['#9aa6b2','#76828f'],bodyCols:['#7ccf55','#6bbd4a','#4fa043','#438f3a'],speck:140,speckCols:['#a0e07a','#2f7f33']};
    mountain(c,W,H,r,o);R(c,0,H*.96,W,H*.04+1,'#3f9a3f');
    const ok=(x,y)=>y>mtnTop(o,x)+(o.snowDepth+o.rockDepth)+4;
    add(16,{y0:H*.22,y1:H*.95,ok},(c,x,y,r)=>pine(c,x,y,9+Math.floor(r()*8),'#2f8f45','#4cb35c'));
    add(10,{y0:H*.3,y1:H*.97,ok},(c,x,y,r)=>rock(c,x,y,1+Math.floor(r()*2)));
    add(22,{y0:H*.3,y1:H*.98,ok},(c,x,y,r)=>flower(c,x,y,['#ff7eb6','#ffd23f','#fff','#ff9a2e'][Math.floor(r()*4)]));
  }});

/* ================== 2. الجبل الثلجي: a real climb up a narrow ice wall, with a rope and ledges ================== */
def({id:'snow',feat:'تسلّق حقيقي بالحبال والسلالم الجليدية',name:'الجبل الثلجي',tag:'اعبر البرد حتى القمة',act:'اجتزت الجبل الثلجي حتى قمته',goal:'crystal',start:'tent',seed:22,climb:true,
  wps:[[.5,.94],[.5,.88,'l'],[.41,.83,'l'],[.41,.74,'u'],[.59,.69,'l'],[.59,.6,'u'],[.41,.55,'l'],[.41,.46,'u'],[.58,.41,'l'],[.58,.32,'u'],[.43,.27,'l'],[.43,.2,'u'],[.5,.16,'l']],
  tile:{a:'#bfeaff',b:'#d9f4ff',hi:'#ffffff',sh:'#6fb0d8',w:5,h:3},
  cert:{bg:'#eaf6ff',f1:'#2b5ea8',f2:'#7fd6ff',ink:'#10294f',acc:'#2b5ea8'},
  extra(c,path,m){
    // ice screws every five levels, an axe stuck in the wall at the ledges
    for(let i=5;i<100;i+=5){const p=path.lv[i];R(c,Math.round(p[0])+4,Math.round(p[1])-2,3,1,'#cfd6de');R(c,Math.round(p[0])+6,Math.round(p[1])-3,1,3,'#cfd6de');}
  },
  draw(c,W,H,r,add){
    sky(c,W,H,['#16275c','#1f3a7a','#2f5a9f','#5a8cc6','#9bc0e2'],H*.62);
    for(let i=0;i<60*AREA;i++){R(c,r()*W,r()*H*.45,1,1,r()<.2?'#ffe9a8':'#ffffff');}
    c.globalAlpha=.32;for(let x=0;x<W;x++){const y=H*.12+Math.sin(x*.045)*9+Math.sin(x*.11)*3;R(c,x,y,1,12,'#6cf0c2');R(c,x,y+12,1,6,'#b58cff');}c.globalAlpha=1;
    tri(c,W*.1,H*.34,H*.22,H*.14,'#8fb3de','#7aa0cf');tri(c,W*.92,H*.3,H*.24,H*.14,'#8fb3de','#7aa0cf');
    // a tall, steep ice tower: pale ice on top, dark blue rock face below
    const o={cx:W*.5,peakY:H*.09,flat:24,slope:.2,snowDepth:40,snowCols:['#f4fbff','#c9e0f2'],rockDepth:0,rockCols:['#98a4b0','#76828f'],bodyCols:['#7f9cc4','#6f8db8','#5b79a3','#4f6c96'],speck:150,speckCols:['#dbeeff','#35507a'],noHills:false};
    mountain(c,W,H,r,o);
    // ice cracks and snow bands on the wall
    for(let i=0;i<46*AREA;i++){const x=Math.floor(r()*W),y=H*.2+r()*H*.7;if(y<mtnTop(o,x)+44)continue;const w=3+Math.floor(r()*6);R(c,x,y,w,1,'#e9f6ff');R(c,x+1,y+1,w-2,1,'#b9d7ee');}
    R(c,0,H*.955,W,H*.05+1,'#f4fbff');for(let x=0;x<W;x+=3)R(c,x,H*.955+(x%7?1:0),2,1,'#c9e0f2');
    const ok=(x,y)=>y>mtnTop(o,x)+46;
    add(10,{y0:H*.3,y1:H*.95,ok,margin:12},(c,x,y,r)=>pine(c,x,y,9+Math.floor(r()*7),'#2a7d52','#3f9a6a','#ffffff'));
    add(8,{y0:H*.3,y1:H*.96,ok,margin:10},(c,x,y,r)=>diamond(c,x,y-4,2,5,'#d8f4ff','#7cc4ec'));
    add(3,{y0:H*.6,y1:H*.95,ok,margin:12},(c,x,y)=>snowman(c,x,y));
    add(8,{y0:H*.3,y1:H*.97,ok,margin:10},(c,x,y,r)=>rock(c,x,y,1+Math.floor(r()*2),'#9fb6cc','#6f87a0','#d8e8f6'));
    for(let i=0;i<70*AREA;i++)R(c,r()*W,r()*H,1,1,'#ffffff');
  }});

/* ================== 3. الجبل البركاني: a winding trail with a fork: the long way round, or a lava-bridge shortcut ================== */
def({id:'volcano',feat:'مفترق: طريق طويل أو جسر مختصر فيه مجازفة',name:'الجبل البركاني',tag:'اعبر اللهب بشجاعة',act:'عبرت الجبل البركاني بشجاعة',goal:'crown',start:'tent',seed:33,
  wps:[[.5,.94],[.3,.87],[.2,.77],[.3,.68],[.58,.65],[.8,.6],[.86,.5],[.78,.4],[.52,.37],[.24,.4],[.14,.33],[.25,.26],[.55,.22],[.5,.16]].map(p=>[.5+(p[0]-.5)*.72,p[1]]),
  fork:{a:40,b:60,alt:(A,B)=>{const mx=(A[0]+B[0])/2,my=(A[1]+B[1])/2;return[A,[A[0]+(B[0]-A[0])*.3,A[1]+(B[1]-A[1])*.3+5],[mx,my+7],[A[0]+(B[0]-A[0])*.7,A[1]+(B[1]-A[1])*.7+5],B];}},
  tile:{a:'#4a3b45',b:'#5d4b58',hi:'#ff9a2e',sh:'#1d1219',w:6,h:3},
  cert:{bg:'#fff0e2',f1:'#6b2a1e',f2:'#ff7a1a',ink:'#3a140c',acc:'#d6361e'},
  extra(c,path,m){
    // the shortcut: a rope bridge of planks across the lava, with posts at both ends
    const a=path.alt.dense;
    for(let i=0;i<a.length;i+=2){const p=a[i];R(c,p[0],p[1]-5,1,1,ROPE);}
    for(let i=0;i<a.length;i+=3){const p=a[i];R(c,p[0]-3,p[1]-1,6,2,i%2?WOOD2:WOOD1);R(c,p[0]-3,p[1]+1,6,1,WOOD3);}
    post(c,path.lv[path.fork.a][0],path.lv[path.fork.a][1]);post(c,path.lv[path.fork.b][0],path.lv[path.fork.b][1]);
    // signpost at the fork
    const f=path.lv[path.fork.a],fx=Math.round(f[0])-12,fy=Math.round(f[1]);R(c,fx,fy-14,2,14,'#6b4a2b');R(c,fx-5,fy-17,10,4,'#c99a5c');R(c,fx-3,fy-16,6,1,'#5b3a1a');R(c,fx-2,fy-13,10,3,'#c99a5c');R(c,fx,fy-12,6,1,'#5b3a1a');
  },
  draw(c,W,H,r,add,path){
    sky(c,W,H,['#2b1138','#4d1c4f','#8a2d4a','#d1553a','#f08a3a'],H*.7);
    for(let i=0;i<30;i++)R(c,r()*W,r()*H*.3,1,1,'#ffd9a0');
    const o={cx:W*.5,peakY:H*.12,slope:.95,flat:20,snowDepth:0,rockDepth:0,bodyCols:['#5b4552','#4d3a46','#3a2a35','#2f212b'],speck:170,speckCols:['#7a6270','#1d1219']};
    mountain(c,W,H,r,o);
    // a lava lake between the two ways of the fork
    const A=path.lv[40],B=path.lv[60],lx=(A[0]+B[0])/2-3,ly=(A[1]+B[1])/2+4,lw=Math.abs(A[0]-B[0])/2+5;
    ell(c,lx,ly,lw+2,16,'#2a1a24');ell(c,lx,ly,lw,14,'#ff5a1f');ell(c,lx,ly+1,lw-8,7,'#ff7a1a');
    for(let i=0;i<10;i++)R(c,lx-30+r()*60,ly-8+r()*16,3+r()*4,1,'#ffd23f');
    // crater glow and lava flows
    R(c,W*.5-15,H*.12-1,31,3,'#ff7a1a');R(c,W*.5-11,H*.12-1,23,1,'#ffd23f');
    for(let k=0;k<4;k++){let x=W*.5+(k-1.5)*8,y=H*.12+2;const len=(70+Math.floor(r()*80))*(H/MH);const dir=(k-1.5)*0.35;for(let i=0;i<len;i++){x+=dir+(r()-.5)*1.2;y+=1;R(c,x-1,y,3,1,'#ff5a1f');R(c,x,y,1,1,'#ffd23f');}}
    for(let i=0;i<4;i++){const sx=W*.5+(i-1.5)*6;disc(c,sx,H*.12-8-i*7,4+i,'#6e5a68');disc(c,sx+3,H*.12-12-i*7,3+i,'#8a7384');}
    for(let i=0;i<40;i++)R(c,W*.5+(r()-.5)*70,H*.02+r()*H*.1,1,1,r()<.5?'#ffb02e':'#ff5a1f');
    R(c,0,H*.95,W,H*.05+1,'#2a1a24');for(let i=0;i<12;i++)R(c,r()*W,H*.95+r()*10,5+r()*7,1,'#ff5a1f');
    const ok=(x,y)=>y>mtnTop(o,x)+12&&!(Math.abs(x-lx)<lw+10&&Math.abs(y-ly)<22);
    add(10,{y0:H*.3,y1:H*.97,ok},(c,x,y,r)=>deadtree(c,x,y,8+Math.floor(r()*7)));
    add(14,{y0:H*.3,y1:H*.97,ok},(c,x,y,r)=>rock(c,x,y,1+Math.floor(r()*2),'#6e5a68','#3a2a35','#8f7a89'));
    add(8,{y0:H*.5,y1:H*.97,ok},(c,x,y)=>{ell(c,x,y,6,2,'#ff5a1f');ell(c,x,y,3,1,'#ffd23f');});
  }});

/* ================== 4. نهر التماسيح ================== */
def({id:'river',feat:'عبور النهر من ضفة إلى ضفة',name:'نهر التماسيح',tag:'اعبر النهر بحذر',act:'عبرت نهر التماسيح بسلام',goal:'castle',start:'sign',seed:44,
  wps:[[.5,.94],[.5,.82],[.3,.72],[.7,.64],[.3,.56],[.7,.48],[.3,.4],[.62,.32],[.5,.24],[.5,.17]],
  tile:{a:'#9a6b3a',b:'#b27d44',hi:'#d9a566',sh:'#4a2d12',w:7,h:3},
  cert:{bg:'#e6f6ef',f1:'#14705a',f2:'#8fd14f',ink:'#0d3b30',acc:'#14705a'},
  draw(c,W,H,r,add,path){
    sky(c,W,H,['#9ad8f2','#b9e6f6'],H*.12);
    R(c,0,H*.1,W,H*.22,'#6fc25a');for(let i=0;i<60;i++)R(c,r()*W,H*.1+r()*H*.22,2+r()*3,1,r()<.5?'#58aa48':'#86d66d');
    R(c,0,H*.3,W,3,'#b8955a');
    R(c,0,H*.33,W,H*.44,'#2f8fd0');for(let y=H*.33;y<H*.77;y+=5)for(let x=(y|0)%10;x<W;x+=14)R(c,x,y,4,1,'#5cb4ea');waves(c,r,0,H*.33,W,H*.44,'#8fd2f5',50);
    R(c,0,H*.77,W,H*.23+1,'#6fc25a');R(c,0,H*.77,W,3,'#b8955a');for(let i=0;i<70;i++)R(c,r()*W,H*.78+r()*H*.2,2+r()*3,1,r()<.5?'#58aa48':'#86d66d');
    add(8,{y0:H*.38,y1:H*.74,margin:13},(c,x,y,r)=>croc(c,x,y,r()<.5));
    add(9,{y0:H*.36,y1:H*.74,margin:10},(c,x,y)=>lily(c,x,y,'#2f8fd0','#ff7eb6'));
    add(8,{y0:H*.31,y1:H*.34,margin:5},(c,x,y)=>reed(c,x,y+3,9));add(8,{y0:H*.74,y1:H*.77,margin:5},(c,x,y)=>reed(c,x,y+3,9));
    add(9,{y0:H*.2,y1:H*.31,margin:9,x0:4,x1:W-4,ok:(x,y)=>Math.abs(x-W*.5)>34||y>H*.2},(c,x,y,r)=>tree(c,x,y,1+(r()<.3?1:0)));
    add(8,{y0:H*.84,y1:H*.99,margin:9},(c,x,y,r)=>tree(c,x,y,1));
    add(10,{y0:H*.8,y1:H*.99,margin:6},(c,x,y,r)=>flower(c,x,y,['#ff7eb6','#ffd23f','#fff'][Math.floor(r()*3)]));
  }});

/* ================== 5. صحراء الكنوز: a sideways trek left to right: dunes, a sheer cliff, quicksand stones, rock stairs, a rope bridge, another cliff ================== */
def({id:'desert',feat:'مغامرة أفقية من اليسار إلى اليمين: منحدرات وجسر',name:'صحراء الكنوز',tag:'اتبع الكثبان إلى الكنز',act:'وصلت إلى كنز الصحراء',goal:'pyramid',start:'sign',seed:55,layout:'h',
  wps:[[.04,.66],[.11,.65],[.19,.575],[.19,.78,'d'],[.35,.78,'s'],[.395,.75],[.5,.5,'t'],[.645,.52,'b'],[.68,.52,'l'],[.68,.73,'d'],[.76,.71],[.83,.74],[.9,.70],[.955,.68]],
  tile:{a:'#a8692a',b:'#bf7d36',hi:'#f0c98a',sh:'#5e3a14',w:6,h:3},
  cert:{bg:'#fff4d8',f1:'#a8691f',f2:'#e9b84a',ink:'#4a2d0a',acc:'#b4541a'},
  draw(c,W,H,r,add,path){
    sky(c,W,H,['#3da5e0','#6bbfe9','#9fd6ee','#d9ecd8','#ffe7a8'],H*.62);
    disc(c,W*.72,H*.13,10,'#fff2b0');disc(c,W*.72,H*.13,7,'#ffe27a');
    cloud(c,W*.08,H*.1,1);cloud(c,W*.3,H*.07,1);cloud(c,W*.52,H*.14,1);cloud(c,W*.86,H*.08,1);bird(c,W*.4,H*.2);bird(c,W*.43,H*.22);
    // far dunes and far pyramids
    const cols=['#f9e6b4','#f5dba2','#efcf90','#e9c47f'],hl=['#fff4cf','#fdeab8','#f8dfa4','#f1d48f'];
    for(let k=0;k<4;k++){const base=H*(.44+k*.07),amp=3+k*1.5,f=.035-k*.004,ph=k*1.7+1;for(let x=0;x<W;x++){const top=Math.round(base+Math.sin(x*f+ph)*amp+Math.sin(x*f*2.3+ph)*amp*.4);R(c,x,top,1,H-top,cols[k]);R(c,x,top,1,1,hl[k]);}
      if(k===0){tri(c,W*.3,base-14,15,15,'#f6d58a','#d9a94d');tri(c,W*.4,base-8,9,9,'#f6d58a','#d9a94d');tri(c,W*.66,base-11,12,12,'#f6d58a','#d9a94d');}}
    // the ground follows the route
    const g=groundOf(path,W,['s','b','z'],{s:H*.8,b:H*.93}),ss=xRange(path,'s'),bb=xRange(path,'b'),tt=xRange(path,'t');
    const rim=bb?Math.round(Math.min(g[Math.max(0,bb[0]-4)],g[Math.min(W-1,bb[1]+4)])):0;
    for(let x=0;x<W;x++){const top=Math.round(g[x]),inS=ss&&x>=ss[0]&&x<=ss[1],inB=bb&&x>=bb[0]&&x<=bb[1],inT=tt&&x>=tt[0]&&x<=tt[1];
      if(inB){const y0=rim+2;R(c,x,y0,1,H-y0,'#a8541f');for(let y=y0;y<H;y+=1){if((y>>2)%2===0)R(c,x,y,1,1,(y-y0)>H*.25?'#8a4119':'#b8622a');}R(c,x,Math.round(H*.93),1,H,'#6f3414');if((x*7)%11===0)R(c,x,y0+10+((x*13)%40),2,1,'#d9894a');continue;}
      if(inS){R(c,x,top,1,H-top,'#c79a52');R(c,x,top,1,2,'#e3bd74');for(let y=top+4;y<H;y+=5)if(((x>>1)+(y>>2))%3===0)R(c,x,y,2,1,'#b0823f');if((x*3)%7===0)R(c,x,top+1,3,1,'#f0d49a');continue;}
      if(inT){R(c,x,top,1,H-top,(x>>1)%2?'#c8a463':'#d2b072');R(c,x,top,1,1,'#f1dca0');for(let y=top+4;y<H;y+=7)R(c,x,y,1,1,'#a98644');continue;}
      R(c,x,top,1,H-top,'#dcad58');R(c,x,top,1,3,'#f4d98f');R(c,x,top+3,1,2,'#e8bf68');
      for(let y=top+22;y<H;y+=22)R(c,x,y,1,H-y,(y-top)%44<22?'#d29f4a':'#c9923e');
      if(x%2===0)R(c,x,top+6+((x*7)%9),1,1,'#f3d68c');if(x%5===0)R(c,x,top+14+((x*11)%17),2,1,'#b8832f');}
    // cliff faces: dark side where the ground steps up or down
    for(let x=1;x<W-1;x++){const dy=g[x+1]-g[x-1];if(Math.abs(dy)>5){const hi=Math.min(g[x-1],g[x+1]),lo=Math.max(g[x-1],g[x+1]),side=dy>0?x:x+1;R(c,side-1,hi,2,lo-hi,'#8f5a26');R(c,side,hi,1,lo-hi,'#6f4218');}}
    const pit=(x)=>(ss&&x>ss[0]-8&&x<ss[1]+8)||(bb&&x>bb[0]-10&&x<bb[1]+10);
    const ok=(x,y)=>x>=0&&x<W&&y>g[x|0]+8&&!pit(x);
    add(7,{y0:H*.5,y1:H*.97,ok},(c,x,y,r)=>cactus(c,x,y,8+Math.floor(r()*6)));
    add(4,{y0:H*.5,y1:H*.97,ok},(c,x,y,r)=>palm(c,x,y,14+Math.floor(r()*6)));
    add(8,{y0:H*.5,y1:H*.98,ok},(c,x,y,r)=>rock(c,x,y,1+Math.floor(r()*2),'#b79565','#8a6b3e','#d9bd8a'));
    add(5,{y0:H*.55,y1:H*.97,ok},(c,x,y)=>{R(c,x,y-2,1,2,'#8a6b3e');R(c,x+2,y-3,1,3,'#8a6b3e');R(c,x+4,y-1,1,1,'#8a6b3e');});
    add(2,{y0:H*.6,y1:H*.97,ok},(c,x,y)=>{R(c,x,y-4,4,3,'#f1ecd8');R(c,x+1,y-3,1,1,'#7a6a4a');R(c,x+3,y-3,1,1,'#7a6a4a');R(c,x+1,y-1,3,1,'#f1ecd8');});
  }});

/* ================== 6. غابة الأسرار: a sideways trek through the trees: up a giant trunk, rope bridge, zip-line, river stones, temple stairs ================== */
const JG={floor:.86,plat:[[.17,.27,.42],[.41,.46,.47]]};
def({id:'jungle',feat:'مغامرة أفقية بين الأشجار: سلالم وجسور وحبل انزلاق',name:'غابة الأسرار',tag:'اكتشف سر الغابة',act:'وجدت سرّ غابة الأسرار',goal:'star',start:'tent',seed:66,layout:'h',
  wps:[[.04,.83],[.11,.81],[.17,.83],[.17,.42,'u'],[.27,.42,'l'],[.41,.47,'b'],[.46,.47,'l'],[.62,.81,'z'],[.70,.81],[.75,.79],[.88,.79,'s'],[.955,.5,'t']],
  tile:{a:'#7a5a34',b:'#8d6a3e',hi:'#c49a5a',sh:'#2e2012',w:6,h:3},
  cert:{bg:'#e9f5df',f1:'#2f6b2f',f2:'#e8c23a',ink:'#14341a',acc:'#a8352a'},
  draw(c,W,H,r,add,path){
    sky(c,W,H,['#0f3d2b','#14522f','#1d6b3f','#2a8a4a','#3aa65a'],H);
    c.globalAlpha=.16;for(let i=0;i<Math.round(W/38);i++){const x0=W*(.04+i*.09);for(let y=0;y<H*.85;y++)R(c,x0+y*.35,y,6,1,'#fff3b0');}c.globalAlpha=1;
    // far trees: dark silhouettes
    for(let x=-10;x<W+10;x+=14){const h=H*(.35+.2*Math.abs(Math.sin(x*.07)));disc(c,x,H*.82-h,9+((x*3)%5),'#0f3d2b');R(c,x-2,H*.82-h,4,h,'#0c3223');}
    for(let i=0;i<Math.round(W/16);i++){const x=r()*W,y=r()*H*.4;disc(c,x,y,7+r()*6,r()<.5?'#14522f':'#1d6b3f');}
    const FY=Math.round(H*JG.floor);
    // trunks that hold the platforms
    const trunk=(tx,ty,w)=>{R(c,tx-w/2,ty,w,FY-ty+4,'#5b3a1a');R(c,tx-w/2,ty,3,FY-ty+4,'#7a5230');R(c,tx+w/2-3,ty,3,FY-ty+4,'#3f2a14');for(let y=ty+8;y<FY;y+=11)R(c,tx-w/2,y,w,1,'#3f2a14');};
    for(const [x0,x1,py] of JG.plat){const ya=Math.round(py*H);
      trunk(Math.round(x0*W),ya,15);if(x1-x0>.06)trunk(Math.round(x1*W),ya,13);
      R(c,x0*W-9,ya+1,(x1-x0)*W+18,3,'#6b4a2b');R(c,x0*W-9,ya+4,(x1-x0)*W+18,1,'#3f2a14');
      // leafy crown above the platform
      for(let k=0;k<5;k++){const cx=x0*W+(x1-x0)*W*k/4;disc(c,cx,ya-26-((k*7)%9),13+((k*5)%6),k%2?'#1d6b3f':'#2a8a4a');disc(c,cx+3,ya-30-((k*7)%9),9,'#3aa65a');}}
    // the old temple the stairs climb
    const tt=xRange(path,'t');
    if(tt){const top=path.lv[100][1];for(let y=Math.round(top);y<FY+2;y+=1){const f=(y-top)/(FY-top),x0=tt[0]-4-Math.round((1-f)*0);R(c,tt[0]-3,y,(W-tt[0]+3),1,(y>>2)%2?'#6f7f6a':'#7d8d77');}
      for(let y=Math.round(top)+4;y<FY;y+=7)for(let x=tt[0]-3;x<W;x+=11)R(c,x+((y>>3)%2)*5,y,1,6,'#4f5f4c');
      R(c,tt[0]-3,Math.round(top),W-tt[0]+3,2,'#a9b8a2');for(let x=tt[0]+6;x<W;x+=9)R(c,x,top+6+((x*5)%20),3,2,'#3e8a3e');}
    // the forest floor and the river
    R(c,0,FY,W,H-FY+1,'#2f7a3a');for(let x=0;x<W;x++){R(c,x,FY,1,1,'#58c15a');if(x%3===0)R(c,x,FY+3+((x*7)%9),2,1,'#1d5a2e');}
    const rs=xRange(path,'s');
    if(rs){const x0=rs[0]-8,x1=rs[1]+6;R(c,x0,FY-3,x1-x0,H-FY+4,'#1b7fa6');for(let y=FY-3;y<H;y+=5)for(let x=x0+(y%9);x<x1;x+=12)R(c,x,y,4,1,'#4fb3da');R(c,x0,FY-3,x1-x0,2,'#6fd0ea');for(let i=0;i<Math.round((x1-x0)/6);i++)R(c,x0+r()*(x1-x0),FY+r()*(H-FY),4,1,'#8fd2f5');
      R(c,x0-2,FY-3,2,H-FY+4,'#1d5a2e');R(c,x1,FY-3,2,H-FY+4,'#1d5a2e');}
    const inR=x=>rs&&x>rs[0]-14&&x<rs[1]+12,inT=x=>tt&&x>tt[0]-6;
    const okF=(x,y)=>x>6&&x<W-6&&!inR(x)&&!inT(x)&&y>FY+3;
    add(10,{y0:FY+3,y1:H-3,ok:okF,margin:8},(c,x,y,r)=>mushroom(c,x,y,1+(r()<.3?1:0)));
    add(20,{y0:FY+2,y1:H-3,ok:okF,margin:7,sway:1},(c,x,y,r)=>{for(let i=-3;i<=3;i++){R(c,x+i*2,y-5+Math.abs(i),1,5-Math.abs(i),i%2?'#3aa65a':'#58c15a');}});
    add(14,{y0:FY+2,y1:H-3,ok:okF,margin:7},(c,x,y,r)=>flower(c,x,y,['#ff7eb6','#ffd23f','#ff9a2e'][Math.floor(r()*3)]));
    add(6,{y0:FY+3,y1:H-3,ok:okF,margin:8},(c,x,y,r)=>rock(c,x,y,1+Math.floor(r()*2),'#6f8a6b','#3f5a3c','#9ab596'));
    // vines hanging from the canopy
    for(let i=0;i<Math.round(W/20);i++){const x=r()*W,len=H*.1+r()*H*.25;R(c,x,0,1,len,'#2f7a3a');disc(c,x,len,1.5,'#3aa65a');}
    for(let i=0;i<Math.round(W/9);i++){const x=r()*W,y=H*.1+r()*H*.7;R(c,x,y,1,1,'#fff3b0');if(i%4===0)plus(c,x,y,'rgba(255,243,176,.6)');}
  },
  extra(c,path,m){
    // the zip-line end post
        const d=path.dense,t=path.dty;let a=-1,b=-1;for(let i=0;i<d.length;i++)if(t[i]==='z'){if(a<0)a=i;b=i;}
    if(a>=0){const e=d[Math.min(d.length-1,b+1)],s=d[a];R(c,Math.round(e[0])+2,Math.round(e[1])-13,2,15,'#5b3a1a');R(c,Math.round(e[0])-1,Math.round(e[1])-13,6,2,'#3f2a14');R(c,Math.round(s[0])-1,Math.round(s[1])-13,4,2,'#3f2a14');}
  }});

/* ================== 7. بحيرة اللؤلؤ ================== */
def({id:'lake',feat:'قفز بين زنابق البحيرة',name:'بحيرة اللؤلؤ',tag:'اقفز بين الزنابق',act:'وصلت إلى لؤلؤة البحيرة',goal:'pearl',start:'boat',seed:77,
  wps:zig(7,.5,.3,.45,.92,.2,.5,.5),
  tile:{round:true,a:'#2f9e4f',b:'#3fb35e',hi:'#8fe89a',sh:'#14683a',w:7,h:4},
  cert:{bg:'#e5f6fb',f1:'#15779a',f2:'#ff9fc4',ink:'#0b3a4f',acc:'#d4558a'},
  draw(c,W,H,r,add,path){
    sky(c,W,H,['#8fd0f2','#b6e2f6','#e3f4fb'],H*.1);
    R(c,0,H*.1,W,H,'#1b9ab8');const wc=['#25a9c6','#1b9ab8','#168aa8','#117a98','#0f6f8a'];for(let k=0;k<wc.length;k++)R(c,0,H*(.1+k*.18),W,H*.19,wc[k]);
    for(let y=H*.12;y<H;y+=6)for(let x=(y|0)%11;x<W;x+=15)R(c,x,y,3,1,'rgba(255,255,255,.28)');waves(c,r,0,H*.1,W,H*.9,'#8fe6f2',60);
    ell(c,W*.5,H*.14,46,11,'#e9d39a');ell(c,W*.5,H*.13,40,8,'#f4e3b0');for(let i=0;i<5;i++)R(c,W*.5-30+i*14,H*.14+r()*6,3,1,'#fff');
    for(let i=0;i<9;i++)R(c,r()*W,H*.1+r()*4,1,5+r()*5,'#4a8a3a');
    add(9,{y0:H*.2,y1:H*.97,margin:11},(c,x,y,r)=>lily(c,x,y,'#168aa8',r()<.5?'#ff9fc4':null));
    add(5,{y0:H*.25,y1:H*.95,margin:12},(c,x,y,r)=>fish(c,x,y,['#ff9a2e','#ffd23f','#ff7eb6'][Math.floor(r()*3)],r()<.5));
    add(8,{y0:H*.2,y1:H*.97,margin:9},(c,x,y)=>{R(c,x,y,1,1,'#fff');R(c,x-1,y+1,3,1,'rgba(255,255,255,.5)');});
    add(6,{y0:H*.07,y1:H*.12,margin:3,x0:W*.5-80,x1:W*.5+80},(c,x,y)=>palm(c,x,y+5,10));
    add(4,{y0:H*.08,y1:H*.3,margin:9},(c,x,y,r)=>{R(c,x,y,3,1,'#fff');R(c,x-2,y-1,2,1,'#cfe');R(c,x+3,y-1,2,1,'#cfe');});
  }});

/* ================== 8. جزيرة الكنز: a spiral through a group of islands; the gaps between islands are sailed in a boat ================== */
const ISL_GAPS=[[10,17],[26,33],[43,50],[59,66],[75,82],[90,96]];
const ISL=(()=>{const P=[],N=36;for(let i=0;i<=N;i++){const t=i/N,th=Math.PI/2+t*Math.PI*2*1.62,rr=1-.76*t;P.push([.5+.31*rr*Math.cos(th),.5+.38*rr*Math.sin(th)]);}return P;})();
function islandSpans(){const s=[];let a=0;for(const g of ISL_GAPS){s.push([a,g[0]]);a=g[1];}s.push([a,100]);return s;}
def({id:'island',feat:'رحلة لولبية بين الجزر بالسفينة',name:'جزيرة الكنز',tag:'ابحر نحو الكنز المدفون',act:'عثرت على كنز الجزيرة',goal:'chest',start:'boat',seed:88,gaps:ISL_GAPS,wide:330,
  wps:ISL,
  tile:{a:'#b58a50',b:'#c99a5c',hi:'#e6c48a',sh:'#5b3a1a',w:7,h:3},
  cert:{bg:'#e8f8fb',f1:'#c4862e',f2:'#2fb8e6',ink:'#4a2d0a',acc:'#c4862e'},
  draw(c,W,H,r,add,path){
    sky(c,W,H,['#7fd3f5','#8fdcf6'],H*.06);
    const wc=['#37c0ea','#2fb2e2','#27a2d8','#2092cc','#1a82bf'];for(let k=0;k<wc.length;k++)R(c,0,H*(.04+k*.2),W,H*.21,wc[k]);
    for(let y=H*.06;y<H;y+=6)for(let x=(y|0)%9;x<W;x+=13)R(c,x,y,4,1,'rgba(255,255,255,.3)');waves(c,r,0,H*.06,W,H*.94,'#bff1ff',70);
    // the islands: blobs that follow the route
    const spans=islandSpans(),isl=[];
    spans.forEach(([a,b],j)=>{const last=j===spans.length-1,R0=last?15:10;
      for(let L=a;L<=b;L++){const p=path.lv[L];ell(c,p[0],p[1]+2,R0+3,R0*.78+3,'rgba(255,255,255,.35)');}
      for(let L=a;L<=b;L++){const p=path.lv[L];ell(c,p[0],p[1]+1,R0,R0*.78,'#f7e3a6');}
      for(let L=a;L<=b;L++){const p=path.lv[L];ell(c,p[0],p[1],R0-3,R0*.78-3,'#fbeebf');}
      for(let L=a+1;L<b;L+=2){const p=path.lv[L];ell(c,p[0]+((L*5)%7-3),p[1]-2,R0-6,Math.max(2,R0*.78-6),(L%4)?'#6fc25a':'#58aa48');}
      isl.push({a,b,R0,last});});
    // an islet or two off the route
    for(const [fx,fy] of [[.14,.2],[.86,.34],[.1,.62],[.9,.84]]){const x=W/2+(fx-.5)*Math.min(W,230),y=fy*H;ell(c,x,y+1,9,4,'#f7e3a6');ell(c,x,y,7,3,'#6fc25a');rock(c,x+3,y,1,'#b7a37a','#8a7650','#d8c9a2');}
    const near=(x,y,mg)=>{for(const s of isl)for(let L=s.a;L<=s.b;L+=2){const p=path.lv[L],dx=p[0]-x,dy=(p[1]-y)*1.2;if(dx*dx+dy*dy<(s.R0-mg)*(s.R0-mg))return true;}return false;};
    const onIsland=(x,y)=>near(x,y,2),sea=(x,y)=>{for(const s of isl)for(let L=s.a;L<=s.b;L+=2){const p=path.lv[L],dx=p[0]-x,dy=(p[1]-y)*1.2;if(dx*dx+dy*dy<(s.R0+8)*(s.R0+8))return false;}return true;};
    add(16,{y0:H*.05,y1:H*.97,ok:onIsland,margin:7},(c,x,y,r)=>palm(c,x,y,12+Math.floor(r()*7)));
    add(10,{y0:H*.05,y1:H*.97,ok:onIsland,margin:6},(c,x,y,r)=>rock(c,x,y,1,'#b7a37a','#8a7650','#d8c9a2'));
    add(6,{y0:H*.05,y1:H*.97,ok:sea,margin:12},(c,x,y,r)=>fish(c,x,y,['#ff9a2e','#ffd23f','#ff7eb6'][Math.floor(r()*3)],r()<.5));
    add(8,{y0:H*.05,y1:H*.97,ok:sea,margin:10},(c,x,y)=>{for(let i=0;i<4;i++)R(c,x+i*2,y+(i%2),2,1,'#ffffff');});
    bird(c,W*.2,H*.08,'#ffffff');bird(c,W*.32,H*.11,'#ffffff');bird(c,W*.78,H*.08,'#ffffff');
  },
  extra(c,path,m){
    // a moored boat at the start of every crossing
    for(const g of ISL_GAPS){const p=path.lv[g[0]];START.boat(c,Math.round(p[0])+13,Math.round(p[1])+6);}
    // X marks the spot on the last island
    const g=path.lv[100];R(c,Math.round(g[0])-12,Math.round(g[1])+6,2,2,'#c0392b');R(c,Math.round(g[0])-10,Math.round(g[1])+8,2,2,'#c0392b');R(c,Math.round(g[0])-8,Math.round(g[1])+6,2,2,'#c0392b');R(c,Math.round(g[0])-12,Math.round(g[1])+10,2,2,'#c0392b');R(c,Math.round(g[0])-8,Math.round(g[1])+10,2,2,'#c0392b');
  }});

/* ================== 9. رحلة الفضاء: a flight path that loops the loop round a ringed planet, then round a second one, and on to the moon ================== */
def({id:'space',feat:'مدارات ودورات حول الكواكب',name:'رحلة الفضاء',tag:'انطلق نحو القمر',act:'هبطت على سطح القمر',goal:'rocket',start:'pad',seed:99,
  route(W,H){
    const cx=W/2,R1=Math.min(40,W/2-26),R2=Math.min(26,W/2-40),c1=[cx,.62*H],c2=[cx,.33*H],P=[];
    P.push([cx,.945*H],[cx+16,.885*H],[cx-8,.83*H]);
    // loop one: all the way round the ringed planet, clockwise, shrinking a little
    for(let i=0;i<=22;i++){const t=i/22,th=Math.PI*.55+t*Math.PI*2.1,rr=R1*(1-.2*t);P.push([c1[0]+rr*Math.cos(th),c1[1]+rr*Math.sin(th)*.92]);}
    P.push([cx+10,.47*H]);
    // loop two: anticlockwise round the small planet
    for(let i=0;i<=14;i++){const t=i/14,th=Math.PI*.35-t*Math.PI*2,rr=R2*(1-.12*t);P.push([c2[0]+rr*Math.cos(th),c2[1]+rr*Math.sin(th)*.9]);}
    P.push([cx,.2*H]);
    return P;
  },
  tile:{a:'#6b5bd6',b:'#8a7bf0',hi:'#d8d2ff',sh:'#261a6e',w:6,h:3},
  cert:{bg:'#12163f',f1:'#6b5bd6',f2:'#ffd23f',ink:'#f2f0ff',acc:'#ffd23f'},
  draw(c,W,H,r,add,path){
    sky(c,W,H,['#070a24','#0c1136','#141a4a','#1d2060','#2a2478'],H);
    c.globalAlpha=.3;disc(c,W*.2,H*.3,40,'#6b2fa8');disc(c,W*.85,H*.55,45,'#c43c9b');disc(c,W*.35,H*.75,38,'#2a8fb8');c.globalAlpha=.2;disc(c,W*.7,H*.2,30,'#6b2fa8');c.globalAlpha=1;
    for(let i=0;i<110*AREA;i++){const x=r()*W,y=r()*H;R(c,x,y,1,1,r()<.25?'#ffe9a8':'#ffffff');if(i%9===0)plus(c,x,y,'rgba(255,255,255,.7)');}
    disc(c,W*.5,-8,46,'#cfd3dd');disc(c,W*.5,-8,40,'#e1e4ec');for(const [dx,dy,rr] of [[-20,6,4],[8,10,3],[24,0,3],[-6,18,2]])disc(c,W*.5+dx,dy,rr,'#b7bcc9');
    // planet one (ringed) sits inside the first loop, planet two inside the second
    const cx=W/2,c1=[cx,.62*H],c2=[cx,.33*H];
    ell(c,c1[0],c1[1],34,5,'#6b4a2b');
    disc(c,c1[0],c1[1],17,'#e8a15a');disc(c,c1[0]-3,c1[1]-3,13,'#f3bf7e');for(let i=-12;i<=12;i+=5)R(c,c1[0]+i-4,c1[1]+i/2,12,1,'rgba(180,100,40,.5)');
    ell(c,c1[0],c1[1]+2,33,4,'rgba(246,217,165,.0)');
    for(let a=0;a<Math.PI*2;a+=.07){const x=c1[0]+Math.cos(a)*32,y=c1[1]+Math.sin(a)*4.5+1;if(Math.sin(a)>0)R(c,x,y,1,1,(a*20|0)%2?'#f6d9a5':'#d98f45');}
    disc(c,c2[0],c2[1],10,'#4a8fe0');disc(c,c2[0]-2,c2[1]-2,7,'#6aa8f0');R(c,c2[0]-5,c2[1]-3,4,3,'#58c15a');R(c,c2[0]+1,c2[1]+2,4,3,'#58c15a');
    disc(c,c2[0]+16,c2[1]-12,3,'#cfd3dd');
    // a red planet and a comet off to the side
    const rx=W*.82,ry=H*.78;disc(c,rx,ry,6,'#e24a3b');R(c,rx-3,ry-2,3,2,'#b3342a');R(c,rx+1,ry+1,3,2,'#b3342a');
    const ok=(x,y)=>Math.hypot(x-c1[0],(y-c1[1])*1.1)>50&&Math.hypot(x-c2[0],(y-c2[1])*1.1)>34;
    add(9,{y0:H*.2,y1:H*.97,margin:11,ok},(c,x,y,r)=>{ell(c,x,y,3,2,'#7a7f8c');R(c,x-1,y-1,2,1,'#a3a8b6');R(c,x+1,y+1,2,1,'#565b68');});
    add(3,{y0:H*.3,y1:H*.9,margin:12,ok},(c,x,y)=>{R(c,x,y,8,1,'#ffffff');R(c,x+8,y,10,1,'rgba(255,255,255,.6)');R(c,x+18,y,12,1,'rgba(255,255,255,.3)');});
  }});

/* ---------- scene assembly ---------- */
function drawTile(c,x,y,i,T,big){
  if(T.round){const a=i%2?T.a:T.b;ell(c,x,y+1,T.w/2+(big?1:0),T.h/2,T.sh);ell(c,x,y,T.w/2+(big?1:0),T.h/2,a);R(c,x-1,y-1,2,1,T.hi);if(big)R(c,x,y,1,1,'#fff');return;}
  const w=T.w+(big?2:0),h=T.h+(big?1:0),x0=Math.round(x-w/2),y0=Math.round(y-h/2);
  R(c,x0,y0+1,w,h,T.sh);R(c,x0,y0,w,h,i%2?T.a:T.b);R(c,x0,y0,w,1,T.hi);if(big)R(c,x0+Math.floor(w/2),y0+1,1,1,T.hi);
}
/* tiles for the different kinds of stretch (see curve()) */
const ROPE='#d9b36b',WOOD1='#a8703a',WOOD2='#8a5a2b',WOOD3='#4a2d12';
function ropeAlong(c,path,types,dx,dy,col){const d=path.dense,t=path.dty;for(let i=0;i<d.length;i++)if(types.indexOf(t[i])>=0)R(c,d[i][0]+dx,d[i][1]+dy,1,1,col);}
function post(c,x,y){x=Math.round(x);y=Math.round(y);R(c,x-1,y-10,2,10,'#6b4a2b');R(c,x-4,y-12,8,2,'#c99a5c');R(c,x-4,y-10,8,1,'#8a5a2b');}
function drawPath(c,path,m,live){
  const s=path.lv[0];START[m.start](c,Math.round(s[0])-16,Math.round(s[1])+3);
  const hasX=path.dty.some(t=>t!=='w'&&t!=='l')||m.gaps;
  if(hasX){ropeAlong(c,path,['u','d'],-3,0,ROPE);ropeAlong(c,path,['u','d'],3,0,ROPE);ropeAlong(c,path,['b'],0,-5,ROPE);ropeAlong(c,path,['b'],0,2,WOOD3);ropeAlong(c,path,['z'],0,-12,'#efe3c0');ropeAlong(c,path,['z'],0,-13,'#8a7a5a');}
  let prev='w';
  for(let i=1;i<100;i++){const p=path.lv[i],g=gapAt(m,i)>=0,ty=g?'x':path.tyAt(i/100),x=Math.round(p[0]),y=Math.round(p[1]);
    if((ty==='b')&&prev!=='b')post(c,path.lv[i-1][0],path.lv[i-1][1]);
    if(prev==='b'&&ty!=='b')post(c,p[0],p[1]);
    prev=ty;
    if(ty==='u'||ty==='d'){R(c,x-3,y,7,1,WOOD1);R(c,x-3,y+1,7,1,WOOD3);}
    else if(ty==='b'){R(c,x-3,y-1,6,2,i%2?WOOD2:WOOD1);R(c,x-3,y+1,6,1,WOOD3);}
    else if(ty==='s'){if(m.noStone){}else if(i%2===0){ell(c,x,y+2,4,2,'#3d4650');ell(c,x,y+1,4,2,'#8c96a3');R(c,x-2,y,3,1,'#c3cad3');}else{R(c,x-2,y+3,4,1,'rgba(255,255,255,.45)');}}
    else if(ty==='t'){R(c,x-4,y,8,2,m.tile.b);R(c,x-4,y,8,1,m.tile.hi);R(c,x-4,y+2,8,1,m.tile.sh);}
    else if(ty==='z'){if(i%4===0)R(c,x,y-12,1,4,'#3a2a1a');}
    else if(ty==='x'){R(c,x-2,y+1,4,1,'rgba(255,255,255,.6)');if(i%2)R(c,x+2,y+3,3,1,'rgba(255,255,255,.35)');}
    else drawTile(c,p[0],p[1],i,m.tile,i%10===0);}
  if(m.extra)m.extra(c,path,m,live);
  if(!live)[25,50,75].forEach(k=>{const p=path.lv[k];R(c,Math.round(p[0])+5,Math.round(p[1])+2,16,1,'rgba(0,0,0,.2)');chestAt2(c,m.id,p[0]+6,p[1]-11);});
  const g=path.lv[100];EMB[m.goal](c,Math.round(g[0]),Math.round(g[1]),live&&m.goal==='flag');
}
const SWAY_RE=/(^|[^a-z])(pine|tree|palm|reed|flower)\(/;
/* a prop that sways in the wind is cut out as its own little sprite */
function makeSprite(it){
  const TW=72,TH=64,AX=36,AY=58,tc=mk(TW,TH),c=tc.getContext('2d');c.imageSmoothingEnabled=false;
  it.fn(c,AX,AY,rng(it.seed));
  const d=c.getImageData(0,0,TW,TH).data;let x0=TW,y0=TH,x1=-1,y1=-1;
  for(let y=0;y<TH;y++)for(let x=0;x<TW;x++)if(d[(y*TW+x)*4+3]){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
  if(x1<0)return null;
  const w=x1-x0+1,h=y1-y0+1,cv=mk(w,h);cv.getContext('2d').drawImage(tc,x0,y0,w,h,0,0,w,h);
  return{cv,w,h,x:it.x+(x0-AX),y:it.y+(y0-AY),ph:(it.seed%628)/100};
}
function compose(id,W,live,H){
  H=H||MH;AREA=Math.max(1,(W*H)/(MW*MH));
  const m=MAPS[id],cv=mk(W,H),c=cv.getContext('2d');c.imageSmoothingEnabled=false;
  const r=rng(m.seed),path=buildPath(m.route?m.route(W,H):m.wps,W,H,m.layout==='h'?0:(m.wide?clamp(W-60,MW,m.wide):MW),!!m.route),items=[],cf=Math.pow(AREA,.75);
  if(m.fork){path.fork={a:m.fork.a,b:m.fork.b};path.alt=curve(m.fork.alt(path.lv[m.fork.a],path.lv[m.fork.b]),null);path.sparse=path.sparse.concat(path.alt.dense.filter((_,i)=>i%3===0));}
  REC=live?{clouds:[],birds:[],sky:[]}:null;const rec=REC;
  const add=(n,o,fn)=>{n=Math.round(n*cf);let placed=0,tries=0;const mg=o.margin==null?9:o.margin,x0=o.x0==null?4:o.x0,x1=o.x1==null?W-4:o.x1;
    while(placed<n&&tries<n*40){tries++;const x=Math.round(x0+r()*(x1-x0)),y=Math.round(o.y0+r()*(o.y1-o.y0));
      if(o.ok&&!o.ok(x,y))continue;if(mg>0&&nearPath(path,x,y,mg))continue;items.push({x,y,fn,seed:Math.floor(r()*1e9),sway:o.sway!=null?!!o.sway:SWAY_RE.test(fn.toString())});placed++;}};
  try{m.draw(c,W,H,r,add,path);}finally{REC=null;AREA=1;}
  items.sort((a,b)=>a.y-b.y);
  const sprites=[];
  for(const it of items){if(live&&it.sway){const sp=makeSprite(it);if(sp)sprites.push(sp);}else it.fn(c,it.x,it.y,rng(it.seed));}
  drawPath(c,path,m,live);
  return{cv,path,W,H,rec,sprites};
}
const SCENES={},LIVES={};
/* the baked 200-wide scene: map thumbnails and certificates. Sideways maps are baked as a long world; the thumbnail shows the start. */
const HW=560;
function buildScene(id){
  if(SCENES[id])return SCENES[id];
  if(MAPS[id].layout!=='h')return(SCENES[id]=compose(id,MW,false));
  const w=compose(id,HW,false,MH),cv=mk(MW,MH);cv.getContext('2d').drawImage(w.cv,0,0,MW,MH,0,0,MW,MH);
  return(SCENES[id]={cv,path:w.path,W:MW,H:MH,rec:null,sprites:[],world:w});
}
/* the picture on a certificate: the finish of the map, as a 200x280 bitmap with the finish coordinates in it */
function certView(id){
  const sc=buildScene(id);if(!sc.world)return{cv:sc.cv,fin:sc.path.lv[100],pre:sc.path.lv[96]};
  const w=sc.world,fin=w.path.lv[100],x0=clamp(Math.round(fin[0])-150,0,HW-MW),cv=mk(MW,MH);cv.getContext('2d').drawImage(w.cv,x0,0,MW,MH,0,0,MW,MH);
  return{cv,fin:[fin[0]-x0,fin[1]],pre:[w.path.lv[96][0]-x0,w.path.lv[96][1]]};
}
/* the full-screen scene: width follows the screen shape, wind-blown props and clouds are left out of the bitmap */
function buildLive(id,W,H){const k=id+'@'+W+'x'+H;if(!LIVES[k]){for(const o in LIVES)delete LIVES[o];LIVES[k]=compose(id,W,true,H);}return LIVES[k];}
