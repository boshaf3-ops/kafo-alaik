'use strict';
document.documentElement.lang='ar';
document.documentElement.dir='rtl';

/* ---------- helpers ---------- */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const REDUCED=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
function rng(seed){let a=seed>>>0;return function(){a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function mk(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}

/* ---------- pixel primitives (logical pixels) ---------- */
function R(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));}
function disc(c,cx,cy,r,col){r=Math.round(r);cx=Math.round(cx);cy=Math.round(cy);c.fillStyle=col;for(let dy=-r;dy<=r;dy++){const w=Math.round(Math.sqrt(Math.max(0,r*r+r*0.5-dy*dy)));c.fillRect(cx-w,cy+dy,w*2+1,1);}}
function ell(c,cx,cy,rx,ry,col){cx=Math.round(cx);cy=Math.round(cy);rx=Math.round(rx);ry=Math.round(ry);c.fillStyle=col;for(let dy=-ry;dy<=ry;dy++){const t=1-(dy*dy)/((ry+0.5)*(ry+0.5));const w=Math.round(rx*Math.sqrt(Math.max(0,t)));c.fillRect(cx-w,cy+dy,w*2+1,1);}}
function tri(c,cx,top,h,hb,colL,colR){cx=Math.round(cx);top=Math.round(top);h=Math.max(1,Math.round(h));for(let i=0;i<=h;i++){const w=Math.round(hb*i/h);c.fillStyle=colL;c.fillRect(cx-w,top+i,w+1,1);c.fillStyle=colR||colL;c.fillRect(cx+1,top+i,w,1);}}
function diamond(c,cx,cy,hw,hh,l,d){cx=Math.round(cx);cy=Math.round(cy);for(let i=-hh;i<=hh;i++){const w=Math.round(hw*(1-Math.abs(i)/(hh+0.5)));R(c,cx-w,cy+i,w+1,1,l);if(w>0)R(c,cx+1,cy+i,w,1,d);}}
function spr(c,rows,x,y,pal,s){s=s||1;for(let j=0;j<rows.length;j++){const row=rows[j];for(let i=0;i<row.length;i++){const ch=row[i];if(ch==='.'||ch===' ')continue;const col=pal[ch];if(!col)continue;c.fillStyle=col;c.fillRect(Math.round(x)+i*s,Math.round(y)+j*s,s,s);}}}
let REC=null;
function sky(c,W,H,cols,h){if(REC)REC.sky.push(...cols);const bh=Math.ceil(h/cols.length);R(c,0,0,W,H,cols[cols.length-1]);cols.forEach((col,i)=>{R(c,0,i*bh,W,bh+1,col);});
  for(let i=1;i<cols.length;i++){const y=i*bh;for(let x=(i&1);x<W;x+=2){R(c,x,y,1,1,cols[i-1]);R(c,x+1-(i&1)*0,y+1,1,1,cols[i-1]);}}}

/* ---------- little scenery pieces ---------- */
function cloud(c,x,y,s){if(REC){REC.clouds.push([x,y,s]);return;}const w='#ffffff',sh='#d6e8f4';disc(c,x,y,3*s,w);disc(c,x+4*s,y-s,4*s,w);disc(c,x+9*s,y,3*s,w);R(c,x-2*s,y,13*s,2*s,w);R(c,x-2*s,y+2*s,13*s,1,sh);}
function bird(c,x,y,col){col=col||'#25354a';if(REC){REC.birds.push([x,y,col]);return;}R(c,x,y,1,1,col);R(c,x+1,y+1,1,1,col);R(c,x+2,y,1,1,col);R(c,x+3,y+1,1,1,col);R(c,x+4,y,1,1,col);}
function plus(c,x,y,col){R(c,x,y-1,1,3,col);R(c,x-1,y,3,1,col);}
function pine(c,x,by,h,leaf,lite,snow){R(c,x-1,by-2,2,2,'#5b3a1a');const n=3,step=Math.max(3,Math.round(h/n)),y0=by-2-h;for(let i=0;i<n;i++){const top=y0+i*step,hb=Math.round(2+i*1.7+h/10);tri(c,x,top,step+3,hb,lite,leaf);if(snow)tri(c,x,top,Math.round((step+3)*0.4),Math.round(hb*0.4),snow,snow);}}
function tree(c,x,by,s){s=s||1;R(c,x-s,by-4*s,2*s,4*s,'#6b4a2b');disc(c,x,by-8*s,4*s,'#2e8b3d');disc(c,x-2*s,by-7*s,3*s,'#3fa04b');disc(c,x+2*s,by-9*s,3*s,'#58c15a');}
function palm(c,x,by,h){let tx=x;for(let i=0;i<h;i++){tx=x+Math.round(Math.sin(i/h*1.4)*2);R(c,tx,by-i,2,1,i%3?'#8a5a2b':'#6b4a2b');}const ty=by-h;
  for(const d of [-1,1]){for(let k=1;k<=8;k++){const fx=tx+d*k*2,fy=ty+Math.round(0.14*k*k-1.1*k);R(c,fx,fy,2,1,k<4?'#58c15a':'#2e8b3d');R(c,fx,fy+1,1,1,'#2e8b3d');}}
  R(c,tx,ty-4,1,4,'#58c15a');R(c,tx-1,ty-3,3,1,'#2e8b3d');disc(c,tx,ty+1,1,'#6b4a2b');}
function cactus(c,x,by,h){R(c,x-1,by-h,3,h,'#3a9a4a');R(c,x-1,by-h,1,h,'#56bb62');const ay=by-Math.round(h*0.55);R(c,x-5,ay,4,2,'#3a9a4a');R(c,x-5,ay-4,2,5,'#3a9a4a');R(c,x-5,ay-4,1,5,'#56bb62');R(c,x+3,ay-3,4,2,'#3a9a4a');R(c,x+5,ay-6,2,5,'#3a9a4a');R(c,x+5,ay-6,1,5,'#56bb62');}
function rock(c,x,by,s,col,dark,lite){col=col||'#8c96a3';dark=dark||'#59616d';lite=lite||'#b9c2cc';ell(c,x,by-s,s*2,s,col);R(c,x-s*2+1,by,s*4-1,1,dark);R(c,x-s,by-s*2,Math.max(2,s),1,lite);}
function flower(c,x,by,col){R(c,x,by-3,1,3,'#2e8b3d');R(c,x-1,by-4,3,1,col);R(c,x,by-5,1,3,col);R(c,x,by-4,1,1,'#ffd23f');}
function mushroom(c,x,by,s){s=s||1;R(c,x-s,by-3*s,2*s,3*s,'#f4ecd8');ell(c,x,by-4*s,3*s,2*s,'#e24a3b');R(c,x-2*s,by-4*s,s,s,'#fff');R(c,x+s,by-5*s,s,s,'#fff');}
function reed(c,x,by,h){h=h||9;R(c,x,by-h,1,h,'#4a8a3a');R(c,x+1,by-h+3,1,h-3,'#3b7a2e');R(c,x,by-h-2,2,3,'#8a5a2b');}
function lily(c,x,y,water,flowerCol){ell(c,x,y,4,2,'#2f9e4f');R(c,x+1,y-1,4,1,water);R(c,x-3,y-1,2,1,'#5fd172');if(flowerCol){R(c,x-1,y-3,3,2,flowerCol);R(c,x,y-4,1,1,flowerCol);}}
function snowman(c,x,by){disc(c,x,by-3,3,'#fff');disc(c,x,by-8,2,'#fff');R(c,x-1,by-9,1,1,'#222');R(c,x+1,by-9,1,1,'#222');R(c,x,by-8,2,1,'#ff9a2e');R(c,x-2,by-11,5,1,'#2b3a5c');R(c,x-1,by-13,3,2,'#2b3a5c');R(c,x-1,by-6,1,1,'#222');R(c,x-1,by-3,1,1,'#222');}
function deadtree(c,x,by,h){R(c,x,by-h,2,h,'#1a1218');R(c,x-4,by-h+4,4,1,'#1a1218');R(c,x-4,by-h+2,1,3,'#1a1218');R(c,x+2,by-h+7,4,1,'#1a1218');R(c,x+5,by-h+5,1,3,'#1a1218');}
function waves(c,r,x,y,w,h,col,n){for(let i=0;i<n*AREA;i++){const rx=x+Math.floor(r()*w),ry=y+Math.floor(r()*h);R(c,rx,ry,3+Math.floor(r()*4),1,col);}}
function withT(c,x,y,flip,fn){c.save();c.translate(Math.round(x),Math.round(y));if(flip)c.scale(-1,1);fn(c);c.restore();}
function croc(c,x,y,flip){withT(c,x,y,flip,c=>{const g='#2f7a3a',d='#245f2d';ell(c,0,0,8,2,g);R(c,6,-1,8,3,g);R(c,6,1,8,1,d);R(c,-12,0,5,1,d);R(c,-9,-1,3,1,g);for(let i=-6;i<=4;i+=3)R(c,i,-3,1,1,'#1d4d26');R(c,5,-3,2,2,'#f6f6e6');R(c,6,-3,1,1,'#111');R(c,8,2,1,1,'#fff');R(c,10,2,1,1,'#fff');R(c,12,2,1,1,'#fff');R(c,-2,2,3,1,'rgba(255,255,255,.35)');});}
function fish(c,x,y,col,flip){withT(c,x,y,flip,c=>{ell(c,0,0,3,1,col);R(c,-5,-1,2,3,col);R(c,2,-1,1,1,'#fff');});}
function sparkle(c,x,y,col){plus(c,x,y,col);}

/* ---------- sprites ---------- */
const SPR={
  chest:['..bbbbbb..','.bBBBBBBb.','bbbbbbbbbb','bYYYYYYYYb','bbbbYYbbbb','bBBBYYBBBb','bBBBBBBBBb','kkkkkkkkkk'],
  crown:['y....y....y','yy..yyy..yy','yyyyyyyyyyy','yrryyuyyrry','YYYYYYYYYYY','YYYYYYYYYYY'],
  star:['.....y.....','.....y.....','....yyy....','yyyyyyyyyyy','.yyyyyyyyy.','..yyyyyyy..','..yyyyyyy..','.yyyy.yyyy.','.yyy...yyy.','yy.......yy'],
  rocket:['....w....','...www...','...www...','..wwwww..','..wcwcw..','..wwwww..','.rwwwwwr.','rrwwwwwrr','r.wwwww.r','..ooooo..','...yyy...','....y....']
};
const SP_PAL={b:'#a8652a',B:'#7a431b',Y:'#ffd23f',k:'#4a2a10',y:'#ffd23f',r:'#e24a3b',u:'#43c6e8',w:'#f4f7fb',c:'#43a6e8',o:'#ff9a2e'};
SPR.crown.pal={y:'#ffd23f',Y:'#e0a800',r:'#e24a3b',u:'#43c6e8'};
function chestAt(c,x,y,s){spr(c,SPR.chest,x,y,SP_PAL,s||1);}

/* ---------- emblems at the finish line (x,y = last tile) ---------- */
const EMB={};
EMB.flag=(c,x,y,noCloth)=>{R(c,x-7,y+1,15,2,'#8c96a3');R(c,x-5,y-1,11,2,'#b9c2cc');R(c,x,y-22,1,23,'#5b3a1a');if(!noCloth)for(let i=0;i<7;i++)R(c,x+1,y-22+i,Math.round(11-i*1.5),1,i<2?'#ff7a6a':'#e24a3b');disc(c,x,y-23,1,'#ffd23f');sparkle(c,x-10,y-16,'#fff3b0');sparkle(c,x+13,y-6,'#fff3b0');};
EMB.crystal=(c,x,y)=>{c.globalAlpha=.28;disc(c,x,y-12,13,'#bfeaff');c.globalAlpha=1;ell(c,x,y+1,11,2,'#ffffff');diamond(c,x,y-12,5,11,'#e4f7ff','#8fd6f5');diamond(c,x-9,y-5,3,6,'#cfeeff','#7cc4ec');diamond(c,x+9,y-4,3,5,'#cfeeff','#7cc4ec');R(c,x-1,y-20,1,3,'#fff');sparkle(c,x-12,y-16,'#fff');sparkle(c,x+12,y-14,'#fff');};
EMB.crown=(c,x,y)=>{ell(c,x,y+1,10,3,'#4a3b45');R(c,x-8,y-4,17,5,'#6b5a66');c.globalAlpha=.3;disc(c,x,y-12,13,'#ffd23f');c.globalAlpha=1;spr(c,SPR.crown,x-11,y-18,SPR.crown.pal,2);sparkle(c,x-14,y-18,'#ffe27a');sparkle(c,x+14,y-16,'#ffe27a');};
EMB.castle=(c,x,y)=>{const g=y+2,w='#cdd2dc',d='#9aa3b2',rf='#d6402f',rfd='#9c2a22';R(c,x-12,g-16,13,16,w);R(c,x+1,g-16,12,16,d);for(let i=0;i<5;i++)R(c,x-12+i*6,g-19,3,3,i<2?w:d);
  R(c,x-19,g-26,9,26,w);R(c,x+11,g-26,9,26,d);for(let i=0;i<3;i++){R(c,x-19+i*4,g-29,3,3,w);R(c,x+11+i*4,g-29,3,3,d);}tri(c,x-14,g-39,10,6,rf,rfd);tri(c,x+15,g-39,10,6,rf,rfd);
  R(c,x-14,g-47,1,9,'#5b3a1a');R(c,x-13,g-47,5,3,'#ffd23f');R(c,x-3,g-10,7,10,'#3a2210');R(c,x-2,g-11,5,1,'#3a2210');R(c,x-8,g-13,2,3,'#2b3a5c');R(c,x+6,g-13,2,3,'#2b3a5c');R(c,x-16,g-20,2,3,'#2b3a5c');R(c,x+15,g-20,2,3,'#2b3a5c');sparkle(c,x-24,g-30,'#fff3b0');};
EMB.pyramid=(c,x,y)=>{ell(c,x,y+2,26,3,'rgba(0,0,0,.18)');tri(c,x,y-32,34,28,'#f6d58a','#d9a94d');for(let i=1;i<6;i++){const yy=y-32+i*6,w=Math.round(28*(i*6)/34);R(c,x-w,yy,w,1,'#e3b868');R(c,x+1,yy,w,1,'#b88a38');}R(c,x-3,y-5,7,8,'#4a2e10');R(c,x,y-33,1,2,'#ffe27a');R(c,x-1,y-32,3,1,'#ffe27a');sparkle(c,x-26,y-22,'#fff7c4');sparkle(c,x+27,y-14,'#fff7c4');};
EMB.star=(c,x,y)=>{c.globalAlpha=.25;disc(c,x,y-14,14,'#fff3b0');c.globalAlpha=1;R(c,x-8,y-2,17,5,'#6f7a86');R(c,x-6,y-5,13,3,'#aab4c0');spr(c,SPR.star,x-6,y-19,{y:'#ffd23f'},1);R(c,x-1,y-17,2,2,'#fff7c4');sparkle(c,x-13,y-20,'#fff3b0');sparkle(c,x+13,y-12,'#fff3b0');};
EMB.pearl=(c,x,y)=>{ell(c,x,y,10,6,'#f4a6c4');for(let i=-7;i<=7;i+=3)R(c,x+i,y-4,1,7,'#e07aa3');R(c,x-9,y+4,19,1,'#c85f8a');disc(c,x,y-7,4,'#ffffff');R(c,x-2,y-9,2,1,'#dff4ff');R(c,x+1,y-5,2,1,'#e9d9f0');c.globalAlpha=.3;disc(c,x,y-7,9,'#ffffff');c.globalAlpha=1;sparkle(c,x-13,y-12,'#fff');sparkle(c,x+13,y-10,'#fff');};
EMB.chest=(c,x,y)=>{ell(c,x,y+3,13,2,'rgba(0,0,0,.2)');chestAt(c,x-10,y-14,2);for(let i=0;i<5;i++){R(c,x+14+i,y+i-1,1,1,'#c0392b');R(c,x+18-i,y+i-1,1,1,'#c0392b');}sparkle(c,x-14,y-16,'#fff3b0');sparkle(c,x+12,y-18,'#fff3b0');};
EMB.rocket=(c,x,y)=>{ell(c,x,y+2,13,3,'#cfd3dd');R(c,x-5,y+2,3,1,'#9aa3b2');R(c,x+4,y+1,2,1,'#9aa3b2');spr(c,SPR.rocket,x-9,y-24,SP_PAL,2);sparkle(c,x-16,y-20,'#fff');sparkle(c,x+16,y-14,'#ffe27a');};

const START={};
START.tent=(c,x,y)=>{tri(c,x,y-12,12,9,'#e24a3b','#b3342a');R(c,x-2,y-2,5,3,'#4a2a10');R(c,x,y-14,1,3,'#5b3a1a');R(c,x+1,y-14,4,2,'#ffd23f');};
START.sign=(c,x,y)=>{R(c,x,y-14,2,14,'#6b4a2b');R(c,x-6,y-16,14,7,'#c99a5c');R(c,x-6,y-16,14,1,'#e6c48a');R(c,x-4,y-13,8,1,'#5b3a1a');R(c,x-4,y-11,5,1,'#5b3a1a');};
START.boat=(c,x,y)=>{R(c,x-9,y-3,19,3,'#8a5a2b');R(c,x-7,y,15,1,'#5b3a1a');R(c,x,y-16,1,13,'#5b3a1a');tri(c,x+1,y-16,11,7,'#ffffff','#e6eef5');R(c,x+1,y-17,4,2,'#e24a3b');};
START.pad=(c,x,y)=>{R(c,x-10,y-2,21,3,'#8c96a3');R(c,x-10,y-2,21,1,'#c3cad3');for(let i=-8;i<=8;i+=4)R(c,x+i,y,2,1,'#ffd23f');R(c,x-1,y-9,3,7,'#59616d');R(c,x-3,y-11,7,2,'#e24a3b');};

/* ---------- avatars (original pixel kids, 16x22) ---------- */
const SKIN=['#ffdbb5','#f2c28c','#d9a066','#b07848','#7b4a2b'];
const HAIRC=['#2a1b12','#5b3a22','#c9892f','#d6402f','#2a6fdb','#8b44d6','#ee5fa7'];
/* base colours: shirts have 8 from the start; each map adds its own themed colours (see b2_outfits.js) */
const SHIRT=['#e24a3b','#ff9a2e','#ffd23f','#3fbf6a','#1fb5ad','#2f7fe0','#8b5cd6','#ee5fa7'];
const PANTC=['#2b3a5c','#1c1f2b','#6b7380','#b59b66'];
const CH_W=16,CH_H=22,DK='#1b2233';
function adj(h,f){const n=parseInt(h.slice(1),16),m=f<1?v=>Math.round(v*f):v=>Math.round(v+(255-v)*(f-1));
  return '#'+[(n>>16)&255,(n>>8)&255,n&255].map(v=>clamp(m(v),0,255).toString(16).padStart(2,'0')).join('');}

/* ---------- wardrobe: original outfits that open at 25%, 50% and 75% of the climb (t = level that opens it) ---------- */
function torso(c,col,up,skin,lg){
  R(c,4,11,8,6,col);R(c,4,16,8,1,'rgba(0,0,0,.18)');R(c,7,11,2,1,'rgba(0,0,0,.18)');
  if(up){R(c,2,10,2,2,col);R(c,12,10,2,2,col);
    if(lg){R(c,1,7,2,4,lg);R(c,13,7,2,4,lg);R(c,1,6,2,1,skin);R(c,13,6,2,1,skin);}else{R(c,1,6,2,5,skin);R(c,13,6,2,5,skin);}}
  else{R(c,2,11,2,2,col);R(c,12,11,2,2,col);
    if(lg){R(c,2,13,2,2,lg);R(c,12,13,2,2,lg);R(c,2,15,2,1,skin);R(c,12,15,2,1,skin);}else{R(c,2,13,2,3,skin);R(c,12,13,2,3,skin);}}
}
function legs(c,col,sh){R(c,5,17,3,3,col);R(c,8,17,3,3,col);R(c,4,20,4,2,sh||DK);R(c,8,20,4,2,sh||DK);}
const _avCache={};
function avatarURL(av,up,fx){const key=JSON.stringify(av)+(up?'u':'')+(fx?'|'+fx:'');if(_avCache[key])return _avCache[key];const cv=mk(CH_W,CH_H);drawChar(cv.getContext('2d'),av,up);return(_avCache[key]=(fx?poseCv(cv,fx):cv).toDataURL());}

/* ---------- tiny pixel icons used as masks ---------- */
const ICONS={
  mountain:['.....##.....','....####....','...######...','..########..','.##########.','############','############'],
  kids:['..##....##..','.####..####.','.####..####.','..##....##..','.####..####.','######.#####','######.#####','######.#####'],
  star:['.....##.....','.....##.....','....####....','############','.##########.','..########..','...######...','..########..','..###..###..','.###....###.'],
  flag:['#########...','###########.','############','###########.','#########...','#...........','#...........','#...........','#...........','#...........'],
  trophy:['############','############','#.########.#','#.########.#','..########..','...######...','.....##.....','.....##.....','....####....','...######...'],
  sound:['...#........','..##..#.....','####...#....','####.#.#....','####.#.#....','####...#....','..##..#.....','...#........'],
  mute:['...#........','..##........','####..#...#.','####...#.#..','####....#...','####...#.#..','..##..#...#.','...#........'],
  shirt:['.###....###.','#####..#####','############','.##########.','..########..','..########..','..########..','..########..'],
  up:['.....##.....','....####....','...######...','..########..','.##########.','############'],
  down:['############','.##########.','..########..','...######...','....####....','.....##.....'],
  zoom:['..######....','.########...','###....###..','##......##..','##......##..','###....###..','.########...','..#######...','......####..','.......####.','........####','.........###'],
  gear:['.....##.....','.#..####..#.','.##########.','..###..###..','.####..####.','####....####','####....####','.####..####.','..###..###..','.##########.','.#..####..#.','.....##.....'],
  map:['...######...','..########..','.####..####.','.###....###.','.###....###.','.####..####.','..########..','...######...','....####....','.....##.....'],
  house:['.....##.....','....####....','...######...','..########..','.##########.','############','.##########.','.####..####.','.####..####.','.####..####.'],
  lock:['..######..','.##....##.','.##....##.','##########','##########','####..####','####..####','##########'],
  crown:['#....#....#','##..###..##','###########','###########','###########','###########']
};
function installIcons(){const root=document.documentElement;let css='';for(const k in ICONS){const rows=ICONS[k],w=rows[0].length,h=rows.length,s=4;const cv=mk(w*s,h*s),c=cv.getContext('2d');c.fillStyle='#000';rows.forEach((r,j)=>{for(let i=0;i<r.length;i++)if(r[i]==='#')c.fillRect(i*s,j*s,s,s);});
  css+='.i-'+k+'{--m:url('+cv.toDataURL()+')}';}
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);}
installIcons();
