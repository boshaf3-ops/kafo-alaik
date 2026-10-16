/* ---------- certificate (A4 portrait, drawn on canvas, themed by the map) ---------- */
function fontsReady(){
  const loads=[document.fonts.load('80px Lalezar','كفو عليك'),document.fonts.load('800 30px Tajawal','شهادة'),document.fonts.load('500 30px Tajawal','شهادة')];
  return Promise.race([Promise.all(loads).catch(()=>{}),new Promise(r=>setTimeout(r,2500))]);
}
function loadImg(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src;});}
function wrapLines(c,text,maxW){const words=text.split(' '),lines=[];let cur='';for(const w of words){const t=cur?cur+' '+w:w;if(c.measureText(t).width>maxW&&cur){lines.push(cur);cur=w;}else cur=t;}if(cur)lines.push(cur);return lines;}
function fmtDate(d){try{return new Date(d).toLocaleDateString('ar-u-nu-latn',{day:'numeric',month:'long',year:'numeric'});}catch(e){return String(d);}}
function fmtDay(s){try{const p=s.split('-');return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString('ar-u-nu-latn',{day:'numeric',month:'long'});}catch(e){return s;}}

function pxFrame(c,x,y,w,h,col,t,corner){
  c.fillStyle=col;c.fillRect(x+t,y,w-2*t,t);c.fillRect(x+t,y+h-t,w-2*t,t);c.fillRect(x,y+t,t,h-2*t);c.fillRect(x+w-t,y+t,t,h-2*t);
  if(corner){c.fillStyle=corner;c.fillRect(x,y,t,t);c.fillRect(x+w-t,y,t,t);c.fillRect(x,y+h-t,t,t);c.fillRect(x+w-t,y+h-t,t,t);}
}
function pixText(c,txt,x,y,font,fill,shadow,off){c.font=font;if(shadow){c.fillStyle=shadow;c.fillText(txt,x+off,y+off);}c.fillStyle=fill;c.fillText(txt,x,y);}

async function makeCert(o){
  await fontsReady();
  const SC=2,W=877,H=1240,cv=mk(W*SC,H*SC),c=cv.getContext('2d');c.scale(SC,SC);
  const m=MAPS[o.mapId]||MAPS.peak,cp=m.cert;
  c.fillStyle=cp.bg;c.fillRect(0,0,W,H);
  c.globalAlpha=.08;c.fillStyle=cp.f2;for(let y=70;y<H-70;y+=24)for(let x=70+((y/24)%2)*12;x<W-70;x+=24)c.fillRect(x,y,6,6);c.globalAlpha=1;
  pxFrame(c,26,26,W-52,H-52,cp.f1,16,cp.f2);pxFrame(c,56,56,W-112,H-112,cp.f2,6,cp.f1);
  c.textAlign='center';c.textBaseline='alphabetic';c.direction='rtl';
  pixText(c,'كفو عليك',W/2,152,'400 92px Lalezar, Tajawal, sans-serif',cp.acc,cp.f1,5);
  c.fillStyle=cp.ink;c.font='800 36px Tajawal, sans-serif';c.fillText('شهادة اجتياز المغامرة',W/2,208);
  // scene panel: the top of the map, with the child standing at the finish
  const px=96,py=236,pw=685,ph=380,sc=pw/MW,cvw=certView(o.mapId||'peak');
  const tmp=mk(MW,MH),tc=tmp.getContext('2d');tc.imageSmoothingEnabled=false;tc.drawImage(cvw.cv,0,0);
  const pre=cvw.pre,cropY=clamp(Math.round(cvw.fin[1]-60),0,MH-Math.round(ph/sc));
  const av=o.av||avatarFrom(0);const ch=mk(CH_W,CH_H);drawChar(ch.getContext('2d'),av,true);
  tc.fillStyle='rgba(0,0,0,.28)';tc.fillRect(Math.round(pre[0])-6,Math.round(pre[1])+1,12,2);tc.drawImage(ch,Math.round(pre[0])-CH_W/2,Math.round(pre[1])-CH_H+2);
  sparkle(tc,Math.round(pre[0])-12,Math.round(pre[1])-18,'#fff3b0');sparkle(tc,Math.round(pre[0])+12,Math.round(pre[1])-22,'#fff3b0');
  c.imageSmoothingEnabled=false;
  const srcH=Math.round(ph/sc);c.drawImage(tmp,0,cropY,MW,srcH,px,py,pw,srcH*sc);
  pxFrame(c,px-10,py-10,pw+20,ph+20,cp.f1,10,cp.f2);
  // photo (or avatar icon)
  const cx=W/2,cy=py+ph+6,ps=150;
  c.fillStyle=cp.f1;c.fillRect(cx-ps/2-12,cy-ps/2-12,ps+24,ps+24);c.fillStyle=cp.f2;c.fillRect(cx-ps/2-6,cy-ps/2-6,ps+12,ps+12);
  c.save();c.beginPath();c.rect(cx-ps/2,cy-ps/2,ps,ps);c.clip();
  if(o.photo){try{const im=await loadImg(o.photo);c.imageSmoothingEnabled=true;c.drawImage(im,cx-ps/2,cy-ps/2,ps,ps);}catch(e){o.photo=null;}}
  if(!o.photo){c.fillStyle='#bfe6f7';c.fillRect(cx-ps/2,cy-ps/2,ps,ps);const big=mk(CH_W,CH_H);drawChar(big.getContext('2d'),av,false);c.imageSmoothingEnabled=false;c.drawImage(big,cx-42,cy-ps/2+10,84,116);}
  c.restore();
  // text
  c.fillStyle=cp.ink;c.font='700 30px Tajawal, sans-serif';c.fillText('تُمنح هذه الشهادة إلى',cx,cy+ps/2+56);
  let fs=84,name=o.name||'اسم البطل';c.font='400 '+fs+'px Lalezar, Tajawal, sans-serif';while(c.measureText(name).width>640&&fs>40){fs-=4;c.font='400 '+fs+'px Lalezar, Tajawal, sans-serif';}
  pixText(c,name,cx,cy+ps/2+138,'400 '+fs+'px Lalezar, Tajawal, sans-serif',cp.acc,cp.f2,4);
  c.fillStyle=cp.f2;for(let i=0;i<11;i++)c.fillRect(cx-110+i*20,cy+ps/2+158,10,6);
  c.fillStyle=cp.ink;c.font='500 27px Tajawal, sans-serif';
  const goal=o.goal||100;
  let body='لأنك '+m.act+' وأنهيت مغامرة «'+m.name+'» بنجاح، وبلغت المستوى 100 بسلوكك الطيب وأخلاقك الحسنة، فكفو عليك! نفخر بك ونسأل الله أن يزيدك صلاحًا وتوفيقًا.';
  const lines=wrapLines(c,body,640);let ly=cy+ps/2+202;for(const ln of lines){c.fillText(ln,cx,ly);ly+=40;}
  let info='عدد النقاط: '+goal;if(o.period&&o.period.start&&o.period.end)info+='  |  الفترة: من '+fmtDay(o.period.start)+' إلى '+fmtDay(o.period.end);
  c.font='700 24px Tajawal, sans-serif';c.fillStyle=cp.acc;c.fillText(info,cx,ly+10);
  // footer
  const fy=H-100;c.fillStyle=cp.ink;c.font='700 24px Tajawal, sans-serif';
  c.textAlign='right';c.fillText('ولي الأمر:',W-110,fy);c.fillRect(W-420,fy+8,300,3);
  c.textAlign='left';c.fillText('التاريخ: '+fmtDate(o.ts||Date.now()),110,fy);
  c.textAlign='center';
  return cv;
}
