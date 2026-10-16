/* ---------- boys & girls: heads, girls' wardrobe, full-character special suits ----------
   av = {g:'m'|'f', sk, st (index in HEADS), hc, sh, ss, ps, pc, m (map id), hr (special suit id or '')} */
const HEADS=[
  {n:'شعر قصير',g:'m'},{n:'شعر طويل',g:'f'},{n:'قبعة',g:'m'},{n:'غترة',g:'m'},{n:'طرحة',g:'f'},
  {n:'شعر مسنّن',g:'m'},{n:'شعر مجعّد',g:'m'},{n:'كمّة',g:'m'},{n:'شماغ أحمر',g:'m'},{n:'رباط رأس',g:'m'},{n:'قبعة صوف',g:'m'},
  {n:'قصير بناتي',g:'f'},{n:'ذيل حصان',g:'f'},{n:'ضفيرتان',g:'f'},{n:'فيونكة',g:'f'},{n:'قبعة وشعر طويل',g:'f'},{n:'قبعة وشعر قصير',g:'f'},{n:'طرحة مزخرفة',g:'f'}
];
const headsOf=g=>HEADS.map((h,i)=>({h,i})).filter(x=>x.h.g===(g==='f'?'f':'m'));
const defHead=g=>g==='f'?1:0;
const hairHi=hc=>adj(hc,1.3);
/* hc = hair (or hat / scarf) colour, sc = the shirt colour (matching caps) */
const HD=[
  /*0 short*/(c,hc)=>{R(c,4,2,8,3,hc);R(c,4,5,1,2,hc);R(c,11,5,1,2,hc);R(c,5,4,2,1,hc);R(c,5,2,3,1,hairHi(hc));},
  /*1 long*/(c,hc)=>{R(c,4,2,8,3,hc);R(c,3,3,2,10,hc);R(c,11,3,2,10,hc);R(c,5,4,3,1,hc);R(c,5,2,3,1,hairHi(hc));R(c,3,5,1,6,hairHi(hc));},
  /*2 cap*/(c,hc)=>{R(c,4,2,8,3,hc);R(c,3,5,10,1,'rgba(0,0,0,.35)');R(c,3,4,10,1,hc);R(c,7,2,2,1,'rgba(255,255,255,.4)');},
  /*3 ghutra*/(c)=>{R(c,3,1,10,2,'#ffffff');R(c,3,3,10,1,'#1b1b2f');R(c,3,4,10,1,'#ffffff');R(c,3,5,2,6,'#ffffff');R(c,11,5,2,6,'#ffffff');R(c,3,11,1,2,'#ffffff');R(c,12,11,1,2,'#ffffff');R(c,4,2,3,1,'#e8eef5');},
  /*4 tarha*/(c,hc)=>{R(c,3,1,10,4,hc);R(c,3,5,2,7,hc);R(c,11,5,2,7,hc);R(c,3,12,10,2,hc);R(c,4,2,3,1,'rgba(255,255,255,.35)');},
  /*5 spiky*/(c,hc)=>{R(c,4,3,8,2,hc);R(c,4,1,2,3,hc);R(c,7,0,2,4,hc);R(c,10,1,2,3,hc);R(c,4,5,1,2,hc);R(c,11,5,1,2,hc);R(c,6,2,1,2,hc);R(c,9,2,1,2,hc);R(c,7,1,1,2,hairHi(hc));},
  /*6 curly*/(c,hc)=>{const L=hairHi(hc);R(c,4,1,8,4,hc);R(c,3,2,10,3,hc);R(c,3,5,2,3,hc);R(c,11,5,2,3,hc);R(c,5,2,1,1,L);R(c,8,1,1,1,L);R(c,10,3,1,1,L);R(c,4,4,1,1,L);R(c,12,6,1,1,L);},
  /*7 kuma*/(c,hc)=>{R(c,4,5,1,2,'#2a1b12');R(c,11,5,1,2,'#2a1b12');R(c,4,2,8,3,'#f6f6f6');for(let x=4;x<12;x+=2)R(c,x,3,1,1,hc);R(c,4,4,8,1,'#d6d6d6');R(c,5,1,6,1,'#f6f6f6');},
  /*8 shemagh*/(c)=>{R(c,3,1,10,4,'#ffffff');R(c,3,5,2,8,'#ffffff');R(c,11,5,2,8,'#ffffff');for(let y=1;y<13;y++)for(let x=3;x<13;x++)if(((x+y)&1)===0&&(y<5||x<5||x>10))R(c,x,y,1,1,'#e24a3b');R(c,3,3,10,1,'#1b1b2f');R(c,3,4,10,1,'#ffffff');},
  /*9 headband*/(c,hc)=>{R(c,4,2,8,3,hc);R(c,4,5,1,2,hc);R(c,11,5,1,2,hc);R(c,4,4,8,1,'#e24a3b');R(c,12,4,2,1,'#e24a3b');R(c,13,5,1,2,'#e24a3b');R(c,5,2,3,1,hairHi(hc));},
  /*10 beanie*/(c,hc)=>{R(c,4,2,8,3,hc);R(c,3,4,10,2,adj(hc,.78));R(c,4,2,8,1,hairHi(hc));for(let x=4;x<12;x+=2)R(c,x,5,1,1,adj(hc,.6));R(c,7,0,2,2,'#ffffff');},
  /*11 bob*/(c,hc)=>{R(c,4,2,8,3,hc);R(c,3,3,2,7,hc);R(c,11,3,2,7,hc);R(c,5,4,6,1,hc);R(c,4,9,1,1,hc);R(c,11,9,1,1,hc);R(c,5,2,3,1,hairHi(hc));R(c,3,4,1,4,hairHi(hc));},
  /*12 ponytail*/(c,hc)=>{R(c,4,2,8,3,hc);R(c,4,5,1,2,hc);R(c,11,5,1,2,hc);R(c,5,4,2,1,hc);R(c,5,2,3,1,hairHi(hc));R(c,12,3,2,2,hc);R(c,13,5,2,7,hc);R(c,12,4,2,1,'#ee5fa7');R(c,14,6,1,4,hairHi(hc));},
  /*13 braids*/(c,hc)=>{R(c,4,2,8,3,hc);R(c,4,5,1,2,hc);R(c,11,5,1,2,hc);R(c,5,4,2,1,hc);R(c,5,2,3,1,hairHi(hc));for(const x of [3,11]){R(c,x,5,2,9,hc);for(let y=6;y<13;y+=2)R(c,x,y,2,1,adj(hc,.7));R(c,x,13,2,1,'#ee5fa7');}},
  /*14 bow*/(c,hc)=>{HD[1](c,hc);R(c,9,0,2,3,'#ee5fa7');R(c,11,1,1,2,'#b3306e');R(c,12,0,2,3,'#ee5fa7');},
  /*15 cap + long hair*/(c,hc,sc)=>{R(c,3,3,2,10,hc);R(c,11,3,2,10,hc);R(c,3,5,1,6,hairHi(hc));R(c,4,2,8,3,sc);R(c,3,5,10,1,'rgba(0,0,0,.35)');R(c,3,4,10,1,sc);R(c,7,2,2,1,'rgba(255,255,255,.4)');},
  /*16 cap + short hair*/(c,hc,sc)=>{R(c,3,4,2,6,hc);R(c,11,4,2,6,hc);R(c,4,9,1,1,hc);R(c,11,9,1,1,hc);R(c,4,2,8,3,sc);R(c,3,5,10,1,'rgba(0,0,0,.35)');R(c,3,4,10,1,sc);R(c,7,2,2,1,'rgba(255,255,255,.4)');},
  /*17 decorated tarha*/(c,hc)=>{HD[4](c,hc);for(let y=5;y<12;y++){if(y&1){R(c,5,y,1,1,'#ffd23f');R(c,10,y,1,1,'#ffd23f');}}for(let x=3;x<13;x+=2)R(c,x,13,1,1,'#ffd23f');R(c,7,1,2,1,'#ffd23f');}
];
/* the face; girls get lashes and rosier lips */
function drawFace(c,skin,f){
  R(c,4,3,8,8,skin);R(c,5,8,1,1,'rgba(255,90,100,.45)');R(c,10,8,1,1,'rgba(255,90,100,.45)');
  R(c,6,6,1,2,'#1b1b2f');R(c,9,6,1,2,'#1b1b2f');
  if(f){R(c,5,5,1,1,'#1b1b2f');R(c,10,5,1,1,'#1b1b2f');R(c,7,9,2,1,'#d9506a');}else R(c,7,9,2,1,'#b3453c');
}

/* ---------- girls' wardrobe: same themes and unlock levels, but long sleeves, tunics and skirts ---------- */
const SF={
  ruffle:(a,b)=>c=>{R(c,6,11,4,1,b);R(c,3,17,10,1,a);for(let x=3;x<13;x++)if(x&1)R(c,x,18,1,1,a);},
  cardi:(a,b)=>c=>{R(c,4,11,2,7,a);R(c,10,11,2,7,a);R(c,6,12,4,5,b);R(c,3,17,1,1,a);R(c,12,17,1,1,a);},
  bow:(a,b)=>c=>{R(c,6,11,4,1,b);R(c,5,12,2,2,a);R(c,9,12,2,2,a);R(c,7,12,2,2,b);},
  pinafore:(a,b)=>c=>{R(c,5,12,6,5,a);R(c,5,11,1,1,a);R(c,10,11,1,1,a);R(c,3,16,10,2,a);R(c,7,14,2,1,b);}
};
const SKT={
  skirt:(s,a,b)=>c=>{R(c,4,17,8,3,s);R(c,3,19,10,2,s);R(c,3,20,10,1,a);R(c,5,21,2,1,b);R(c,9,21,2,1,b);},
  pleat:(s,a,b)=>c=>{SKT.skirt(s,a,b)(c);const d=adj(s,.8);for(let x=4;x<12;x+=2)R(c,x,17,1,3,d);R(c,3,19,1,1,d);R(c,12,19,1,1,d);R(c,4,20,1,1,d);R(c,7,20,1,1,d);R(c,10,20,1,1,d);},
  skirtS:(s,a,b)=>c=>{const dk=adj(s,.55);R(c,5,19,3,3,dk);R(c,8,19,3,3,dk);R(c,4,21,4,1,b);R(c,8,21,4,1,b);R(c,4,17,8,1,s);R(c,3,18,10,2,s);R(c,3,19,10,1,a);},
  armorSk:(s,a,b)=>c=>{SKT.skirt(s,a,b)(c);R(c,3,18,10,1,a);R(c,5,19,1,1,a);R(c,10,19,1,1,a);},
  beltSk:(s,a,b)=>c=>{SKT.skirt(s,a,b)(c);R(c,4,17,8,1,a);R(c,7,17,2,1,'#ffffff');},
  scaleSk:(s,a,b)=>c=>{SKT.skirt(s,a,b)(c);for(let y=17;y<20;y++)for(let x=4;x<12;x++)if((x+y)%2===0)R(c,x,y,1,1,a);},
  goldSk:(s,a,b)=>c=>{SKT.skirt(s,s,b)(c);R(c,3,18,10,1,a);R(c,3,20,10,1,a);R(c,7,17,2,3,a);}
};
const PF=Object.assign({},PT,SKT);
const GS={band:'ruffle',vest:'cardi',sash:'bow',emb:'emb',scale:'scale',belt:'belt',hood:'hood',gold:'gold',combo:'pinafore'};
const GP={cuff:'skirt',knee:'pleat',short:'skirtS',boots:'boots',stripe:'stripe',armor:'armorSk',belt:'beltSk',scale:'scaleSk',wide:'wide',gold:'goldSk'};
const GTH={peak:'الجبل',snow:'الثلج',volcano:'الحمم',river:'النهر',desert:'الصحراء',jungle:'الغابة',lake:'البحيرة',island:'الجزيرة',space:'الفضاء',hop:'القفزات',bahrain:'البحرين'};
const GPN={skirt:t=>'تنورة '+t,pleat:t=>'تنورة '+t+' المطوية',skirtS:t=>'تنورة '+t+' والليقنز',boots:t=>'بنطال '+t+' بجزمة',stripe:t=>'بنطال '+t+' الرياضي',armorSk:t=>'تنورة درع '+t,beltSk:t=>'تنورة حزام '+t,wide:t=>'سروال '+t+' الواسع',scaleSk:t=>'تنورة قشور '+t,goldSk:t=>'تنورة '+t+' الذهبية'};
const GSN={
  peak:['متسلقة','كشّافة الجبل','معطف الصقر','حارسة القمة','بطلة الصخور','حاملة الراية','نسرة الجبال','فاتحة القمم','ملكة القمة'],
  snow:['دفء الشتاء','معطف القطب','صائدة الثلج','متزلجة','راعية الجليد','حارسة البلّور','ملكة الثلج','الدبّة القطبية','أميرة الجليد'],
  volcano:['شرارة','درع الحمم','عاملة المنجم','صائدة النار','حارسة البركان','فارسة اللهب','سيّدة الحمم','تنّينة الرماد','ملكة النار'],
  river:['موج النهر','قشور التمساح','صيّادة السمك','حارسة النهر','مستكشفة المستنقع','فارسة التمساح','قبطانة القارب','ملكة التماسيح','بطلة النهر الذهبي'],
  desert:['ظل الواحة','ثوب الكثبان','مستكشفة الرمال','حارسة الصبّار','صائدة الكنز','ابنة الفراعنة','أميرة الشمس','سيّدة الأهرام','فرعونة الذهب'],
  jungle:['ورقة الغابة','قنّاصة الأوراق','مستكشفة الأدغال','نمرة الأدغال','حارسة الأسرار','صاحبة الأثر','ساحرة الغابة','روح الغابة','حارسة الكنز الأخضر'],
  lake:['ماء البحيرة','زنبقة','غوّاصة اللؤلؤ','صيّادة البحيرة','عروس الماء','حارسة اللؤلؤة','سيّدة الضفاف','فارسة الزنبق','أميرة اللؤلؤ'],
  island:['بحّارة','مساعدة القبطان','قرصانة صغيرة','حارسة المرساة','صائدة الكنوز','قبطانة الجزيرة','الراية السوداء','ملكة القراصنة','صاحبة الكنز'],
  space:['متدرّبة فضاء','طيّارة المركبة','مهندسة المحطة','حارسة الكواكب','صائدة النجوم','قائدة المركبة','رائدة القمر','درع المجرة','سيّدة الكون'],
  hop:['نطّاطة','سترة الطوب','جامعة العملات','راكضة المرح','قافزة الغيوم','حارسة البلوك','بطلة القفزات','صائدة النجوم','ملكة العملات'],
  bahrain:['سادة الخليج','غوّاصة اللؤلؤ','بحّارة الداو','ابنة البحرين','حارسة دلمون','سائقة السباق','قبطانة الداو','فارسة المرفأ','ملكة اللؤلؤ']
};
const OUTF={};
(function(){
  for(const id in THEME){
    const T=THEME[id],em=T.e.map(n=>EM[n]),th=GTH[id],o=OUT[id];
    const shirts=[{n:'سادة',t:0,col:1}],pants=[{n:'تنورة عادية',t:0,col:1,d:(c,col)=>SKT.skirt(col,adj(col,.8),DK)(c)}];
    T.s.forEach((r,i)=>{const fixed=r[2]!=='*',g=GS[r[1]]||r[1],mkf=(SF[g]||ST[g])(r[3],r[4],em[r[5]]);
      shirts.push({n:GSN[id][i],t:25*(1+Math.floor(i/3)),col:fixed?0:1,fix:fixed?r[2]:undefined,lg:true,d:(c)=>mkf(c)});});
    T.p.forEach((r,i)=>{const fixed=r[2]!=='*',g=GP[r[1]]||r[1];
      pants.push({n:(GPN[g]||(t=>r[0]))(th),t:25*(1+Math.floor(i/3)),col:fixed?0:1,d:(c,col,skin)=>PF[g](fixed?r[2]:col,r[3],r[4])(c,col,skin)});});
    OUTF[id]={shirts,pants,sc:o.sc,st:o.st,pcl:o.pcl,pt:o.pt};
  }
})();
const outOf=(m,g)=>g==='f'?(OUTF[m]||OUTF.peak):(OUT[m]||OUT.peak);

/* ---------- the character ---------- */
function drawChar(c,av,up){
  const skin=SKIN[av.sk]||SKIN[1];
  if(av.hr&&HERO[av.hr]){HERO[av.hr](c,!!up,skin);return;}
  const f=av.g==='f',o=outOf(av.m,av.g),hc=HAIRC[av.hc]||HAIRC[0],shc=o.sc[av.sh|0]||SHIRT[0],pcc=o.pcl[av.pc|0]||PANTC[0];
  const S=o.shirts[av.ss|0]||o.shirts[0],P=o.pants[av.ps|0]||o.pants[0],base=S.col?shc:S.fix;
  P.d(c,pcc,skin);
  torso(c,base,up,skin,f?base:(S.lg===true?base:S.lg));
  if(f){R(c,3,16,10,2,base);R(c,3,17,10,1,'rgba(0,0,0,.18)');}
  if(S.d)S.d(c,base,up,skin);
  drawFace(c,skin,f);
  const h=HEADS[av.st]&&HEADS[av.st].g===(f?'f':'m')?av.st:defHead(av.g);
  HD[h](c,hc,base);
}
function avatarFrom(i){const g=i%2?'f':'m';return{g,sk:i%SKIN.length,st:defHead(g),hc:(i*2)%HAIRC.length,sh:(i*3)%8,ss:0,ps:0,pc:0};}

/* ---------- special suits: a whole new character, open in every adventure ---------- */
const hArms=(c,up,sl,sk,gl,wide)=>{
  if(up){R(c,2,10,2,2,sl);R(c,12,10,2,2,sl);R(c,1,7,2,4,sl);R(c,13,7,2,4,sl);R(c,1,6,2,1,gl||sk);R(c,13,6,2,1,gl||sk);}
  else{R(c,2,11,2,2,sl);R(c,12,11,2,2,sl);R(c,2,13,2,2,sl);R(c,12,13,2,2,sl);if(wide){R(c,1,13,1,3,sl);R(c,14,13,1,3,sl);}R(c,2,15,2,1,gl||sk);R(c,12,15,2,1,gl||sk);}
};
const hLegs=(c,col,sh,a)=>{R(c,5,17,3,3,col);R(c,8,17,3,3,col);R(c,4,20,4,2,sh);R(c,8,20,4,2,sh);if(a){R(c,5,19,3,1,a);R(c,8,19,3,1,a);}};
const hTunic=(c,col)=>{R(c,3,16,10,2,col);R(c,3,17,10,1,'rgba(0,0,0,.18)');};
const HERO={
  /* ---- boys ---- */
  nj:(c,up,sk)=>{const N='#1d2a44',D='#121a2b',T='#2fb5c4',G='#aab8c8';
    hLegs(c,N,D,G);R(c,11,9,3,1,T);R(c,13,10,2,3,T);R(c,12,13,2,1,T);
    R(c,4,11,8,6,N);R(c,4,15,8,1,T);R(c,7,15,2,2,G);R(c,4,16,8,1,'rgba(0,0,0,.25)');hArms(c,up,N,sk,G);
    R(c,4,2,8,9,N);R(c,5,5,6,3,sk);R(c,6,6,1,2,'#1b1b2f');R(c,9,6,1,2,'#1b1b2f');R(c,4,3,8,2,T);R(c,6,3,4,2,G);R(c,7,4,2,1,N);R(c,3,3,1,3,T);},
  sm:(c,up,sk)=>{const K='#2a3f7a',H='#1c2342',O='#c0392b',W='#f4f4ee',B='#1b1b2f';
    R(c,4,16,8,4,H);R(c,3,19,10,1,H);R(c,7,17,2,3,adj(H,.75));R(c,4,20,3,2,'#e8d3a0');R(c,9,20,3,2,'#e8d3a0');
    R(c,4,11,8,6,K);R(c,6,11,4,1,W);R(c,7,12,2,2,W);R(c,4,15,8,1,O);R(c,7,15,2,2,'#ffd23f');hArms(c,up,K,sk,null,1);
    drawFace(c,sk,false);R(c,4,2,8,3,B);R(c,4,5,1,3,B);R(c,11,5,1,3,B);R(c,5,4,2,1,B);R(c,7,0,2,3,B);R(c,6,3,1,1,'#3a3a5a');
    if(!up){R(c,14,8,1,11,'#cfd6de');R(c,14,19,1,2,'#6b4a2b');R(c,13,19,3,1,'#ffd23f');}},
  cp:(c,up,sk)=>{const NV='#1f4a8f',HT='#1f2a5a',G='#ffd23f',BK='#222831',BR='#4a3320';
    R(c,5,17,3,3,BK);R(c,8,17,3,3,BK);R(c,5,18,3,4,BR);R(c,8,18,3,4,BR);R(c,4,21,4,1,'#2a1c10');R(c,8,21,4,1,'#2a1c10');R(c,5,18,3,1,G);R(c,8,18,3,1,G);
    R(c,4,11,8,6,NV);R(c,7,11,2,6,'#ffffff');R(c,6,12,1,1,G);R(c,9,13,1,1,G);R(c,6,14,1,1,G);R(c,4,15,8,1,BK);R(c,7,15,2,1,G);R(c,4,16,8,1,'rgba(0,0,0,.2)');R(c,11,12,1,3,G);hArms(c,up,NV,sk,G);
    drawFace(c,sk,false);R(c,4,5,1,2,'#5b3a22');R(c,11,5,1,2,'#5b3a22');R(c,5,10,6,1,'#7a4a2a');
    R(c,5,0,6,2,HT);R(c,3,2,10,2,HT);R(c,2,3,1,1,HT);R(c,13,3,1,1,HT);R(c,3,4,10,1,G);R(c,7,1,2,1,'#ffffff');R(c,6,2,4,1,'#ffffff');R(c,7,2,2,1,BK);if(!up){R(c,13,15,1,5,'#cfd6de');R(c,12,14,3,1,G);}},
  ma:(c,up,sk)=>{const W='#f4f4ee',CR='#c0392b',B='#1b1b2f';
    for(const [x,y] of [[0,9],[0,13],[15,10],[15,14],[1,3],[14,2],[2,19],[13,18],[0,17],[15,7]])R(c,x,y,1,1,'#7ae8ff');R(c,0,10,1,5,'rgba(122,232,255,.4)');R(c,15,9,1,5,'rgba(122,232,255,.4)');
    R(c,4,17,4,3,W);R(c,8,17,4,3,W);R(c,3,19,5,1,W);R(c,8,19,5,1,W);R(c,4,20,4,2,'#d6d6cc');R(c,8,20,4,2,'#d6d6cc');
    R(c,4,11,8,6,W);R(c,6,11,4,1,'#e0dfd2');R(c,7,12,2,3,'#e0dfd2');R(c,4,15,8,1,CR);R(c,7,15,2,2,CR);R(c,4,16,8,1,'rgba(0,0,0,.15)');hArms(c,up,W,sk,CR);
    drawFace(c,sk,false);R(c,4,2,8,3,B);R(c,4,5,1,2,B);R(c,11,5,1,2,B);R(c,5,1,2,1,B);R(c,8,1,2,1,B);R(c,10,0,2,2,B);R(c,4,4,8,1,CR);R(c,12,4,2,1,CR);R(c,13,5,1,2,CR);},
  wz:(c,up,sk)=>{const P='#5a3a9a',D='#3a2278',Y='#ffd23f';
    R(c,4,11,8,7,P);R(c,3,17,10,4,P);R(c,3,20,10,1,Y);R(c,4,15,8,1,Y);R(c,7,15,2,5,D);R(c,5,12,1,1,Y);R(c,10,13,1,1,Y);R(c,6,18,1,1,Y);R(c,10,18,1,1,Y);R(c,5,21,2,1,'#2a1c10');R(c,9,21,2,1,'#2a1c10');hArms(c,up,P,sk,null,1);
    R(c,13,6,1,15,'#8a5a2b');R(c,12,3,3,3,Y);R(c,13,2,1,1,Y);R(c,13,3,1,1,'#fff');
    drawFace(c,sk,false);R(c,5,9,6,2,'#eeeeee');R(c,6,11,4,1,'#eeeeee');R(c,4,5,1,3,'#eeeeee');R(c,11,5,1,3,'#eeeeee');
    R(c,7,0,2,1,P);R(c,6,1,4,1,P);R(c,5,2,6,1,P);R(c,4,3,8,1,P);R(c,3,4,10,1,D);R(c,7,2,2,1,Y);R(c,6,3,1,1,Y);},
  hk:(c,up,sk)=>{const BL='#1f4a8f',G='#ffd23f',CR='#c0392b',B='#3a2416';
    R(c,2,10,12,10,CR);R(c,2,19,12,1,adj(CR,.7));hLegs(c,BL,CR,G);
    R(c,4,11,8,6,BL);R(c,6,12,4,1,G);R(c,7,13,2,2,G);R(c,4,15,8,1,G);R(c,4,16,8,1,'rgba(0,0,0,.2)');hArms(c,up,BL,sk,G);
    drawFace(c,sk,false);R(c,4,5,8,2,'#222831');R(c,6,6,1,1,'#ffffff');R(c,9,6,1,1,'#ffffff');R(c,4,2,8,3,B);R(c,4,5,1,1,B);R(c,11,5,1,1,B);R(c,6,1,2,1,B);R(c,9,1,2,1,B);},
  /* ثوب أبيض وغترة بيضاء وعقال: white thobe, white ghutra held by a black egal (men only) */
  th:(c,up,sk)=>{const W='#f7f7f1',Sh='#dcdcd0',B='#1b1b2f';
    R(c,4,11,8,6,W);R(c,3,16,10,5,W);R(c,3,20,10,1,Sh);R(c,7,11,1,8,Sh);R(c,8,12,1,1,'#c9c9bd');R(c,8,14,1,1,'#c9c9bd');R(c,4,16,8,1,'rgba(0,0,0,.08)');
    R(c,5,21,2,1,'#6b4a2b');R(c,9,21,2,1,'#6b4a2b');hArms(c,up,W,sk,null,0);
    drawFace(c,sk,false);R(c,5,8,1,1,'rgba(0,0,0,.18)');
    R(c,5,0,6,1,W);R(c,3,1,10,3,W);R(c,3,4,2,7,W);R(c,11,4,2,7,W);R(c,3,9,2,3,Sh);R(c,11,9,2,3,Sh);R(c,4,3,8,1,Sh);
    R(c,3,2,10,1,B);R(c,4,1,8,1,B);R(c,12,3,1,2,B);R(c,5,4,6,1,W);},
  /* ثوب أبيض وغترة حمراء (شماغ) وعقال */
  thr:(c,up,sk)=>{const W='#f7f7f1',Sh='#dcdcd0',RD='#c0392b',RD2='#8f2619',B='#1b1b2f';
    R(c,4,11,8,6,W);R(c,3,16,10,5,W);R(c,3,20,10,1,Sh);R(c,7,11,1,8,Sh);R(c,8,12,1,1,'#c9c9bd');R(c,8,14,1,1,'#c9c9bd');R(c,4,16,8,1,'rgba(0,0,0,.08)');
    R(c,5,21,2,1,'#6b4a2b');R(c,9,21,2,1,'#6b4a2b');hArms(c,up,W,sk,null,0);
    drawFace(c,sk,false);R(c,5,8,1,1,'rgba(0,0,0,.18)');
    R(c,5,0,6,1,RD);R(c,3,1,10,3,RD);R(c,3,4,2,7,RD);R(c,11,4,2,7,RD);R(c,3,9,2,3,RD2);R(c,11,9,2,3,RD2);R(c,4,3,8,1,RD2);
    for(const [x,y] of [[4,1],[6,1],[8,1],[10,1],[5,3],[9,3],[3,6],[3,8],[12,6],[12,8],[4,10],[11,10],[11,5],[4,5]])R(c,x,y,1,1,'#ffffff');
    R(c,3,2,10,1,B);R(c,4,1,8,1,B);R(c,12,3,1,2,B);R(c,5,4,6,1,RD);},
  /* بطل القفزات: orange cap with a star, cream shirt, blue dungarees with gold buttons */
  bd:(c,up,sk)=>{const CAP='#ec8a1c',CD='#b85c0a',SH='#ffe9a8',BL='#2f6fe0',BD='#1f4aa8',G='#ffd23f',BR='#5b3a22';
    R(c,5,17,3,3,BL);R(c,8,17,3,3,BL);R(c,4,20,4,2,BR);R(c,8,20,4,2,BR);R(c,7,17,2,3,BD);
    R(c,4,11,8,6,SH);R(c,5,13,6,4,BL);R(c,5,11,1,2,BL);R(c,10,11,1,2,BL);R(c,5,13,1,1,G);R(c,10,13,1,1,G);R(c,7,14,2,2,BD);R(c,4,16,8,1,'rgba(0,0,0,.2)');hArms(c,up,SH,sk,'#ffffff');
    drawFace(c,sk,false);R(c,4,5,1,2,BR);R(c,11,5,1,2,BR);
    R(c,5,0,6,2,CAP);R(c,3,2,10,2,CAP);R(c,2,3,1,1,CAP);R(c,13,3,1,1,CAP);R(c,3,4,10,1,CD);R(c,7,1,3,2,'#ffffff');R(c,7,1,1,1,CAP);R(c,9,1,1,1,CAP);R(c,8,2,1,1,'#ffd23f');},
  /* ---- girls (modest: long sleeves, long skirts or trousers) ---- */
  njf:(c,up,sk)=>{const N='#5a2a6a',D='#3a1a48',T='#ee5fa7',G='#ffc7de';
    hLegs(c,D,'#2a1236',T);R(c,11,10,3,1,T);R(c,13,11,2,3,T);R(c,12,14,2,1,T);
    R(c,4,11,8,6,N);hTunic(c,N);R(c,4,14,8,1,T);R(c,7,14,2,2,G);hArms(c,up,N,sk,T);
    R(c,4,2,8,9,N);R(c,5,5,6,3,sk);R(c,6,6,1,2,'#1b1b2f');R(c,9,6,1,2,'#1b1b2f');R(c,5,5,1,1,'#1b1b2f');R(c,10,5,1,1,'#1b1b2f');R(c,4,3,8,2,T);R(c,6,3,4,2,G);R(c,7,4,2,1,N);R(c,3,3,1,3,T);},
  smf:(c,up,sk)=>{const K='#e57fa0',H='#7a2a4a',O='#8a1f3a',W='#f4f4ee',B='#1b1b2f';
    R(c,4,16,8,5,H);R(c,3,19,10,2,H);R(c,3,20,10,1,'#c9a96a');R(c,5,21,2,1,'#e8d3a0');R(c,9,21,2,1,'#e8d3a0');
    R(c,4,11,8,6,K);hTunic(c,K);R(c,6,11,4,1,W);R(c,7,12,2,2,W);R(c,5,13,1,1,W);R(c,10,14,1,1,W);R(c,4,15,8,1,O);R(c,11,14,3,3,O);hArms(c,up,K,sk,null,1);
    R(c,3,3,2,9,B);R(c,11,3,2,9,B);drawFace(c,sk,true);R(c,4,2,8,3,B);R(c,5,4,2,1,B);R(c,6,0,4,2,B);R(c,10,1,2,1,'#ee5fa7');R(c,5,0,1,1,'#ee5fa7');},
  cpf:(c,up,sk)=>{const TL='#1fb5ad',HT='#16807b',G='#ffd23f',NV='#2b3a5c',BR='#4a3320',HR='#6b3a22';
    R(c,5,17,3,3,NV);R(c,8,17,3,3,NV);R(c,5,19,3,3,BR);R(c,8,19,3,3,BR);R(c,4,21,4,1,'#2a1c10');R(c,8,21,4,1,'#2a1c10');
    R(c,3,3,2,10,HR);R(c,11,3,2,10,HR);R(c,4,11,8,6,TL);hTunic(c,TL);R(c,7,11,2,6,'#ffffff');R(c,6,12,1,1,G);R(c,9,13,1,1,G);R(c,4,15,8,1,G);hArms(c,up,TL,sk,G);
    drawFace(c,sk,true);R(c,4,5,1,2,HR);R(c,11,5,1,2,HR);R(c,5,0,6,2,HT);R(c,3,2,10,2,HT);R(c,2,3,1,1,HT);R(c,13,3,1,1,HT);R(c,3,4,10,1,G);R(c,7,1,2,1,'#ffffff');R(c,6,2,4,1,'#ffffff');R(c,7,2,2,1,'#222831');},
  maf:(c,up,sk)=>{const W='#f4f4ee',TL='#1fb5ad',B='#2a1b12';
    for(const [x,y] of [[0,9],[0,13],[15,10],[15,14],[1,3],[14,2],[2,19],[13,18],[0,17],[15,7]])R(c,x,y,1,1,'#a9f0ea');R(c,0,10,1,5,'rgba(169,240,234,.4)');R(c,15,9,1,5,'rgba(169,240,234,.4)');
    R(c,4,17,4,3,W);R(c,8,17,4,3,W);R(c,3,19,5,2,W);R(c,8,19,5,2,W);R(c,4,21,4,1,'#d6d6cc');R(c,8,21,4,1,'#d6d6cc');R(c,3,20,10,1,TL);
    R(c,4,11,8,6,W);hTunic(c,W);R(c,6,11,4,1,'#dfeceb');R(c,4,15,8,1,TL);R(c,7,15,2,2,TL);hArms(c,up,W,sk,TL);
    drawFace(c,sk,true);R(c,4,2,8,3,B);R(c,4,5,1,2,B);R(c,11,5,1,2,B);R(c,6,0,4,3,B);R(c,10,1,2,2,TL);R(c,4,4,8,1,TL);R(c,12,4,2,1,TL);R(c,13,5,1,3,TL);},
  wzf:(c,up,sk)=>{const P='#2a3f9a',D='#1f2d70',Y='#ffd23f',S='#d9e0f0';
    R(c,3,3,2,10,S);R(c,11,3,2,10,S);R(c,4,11,8,7,P);R(c,3,17,10,4,P);R(c,3,20,10,1,Y);R(c,7,13,2,6,D);R(c,5,12,1,1,Y);R(c,10,14,1,1,Y);R(c,6,18,1,1,Y);R(c,10,18,1,1,Y);R(c,5,21,2,1,'#2a1c10');R(c,9,21,2,1,'#2a1c10');hArms(c,up,P,sk,null,1);
    R(c,13,6,1,15,'#8a5a2b');R(c,12,3,3,1,Y);R(c,12,4,1,2,Y);R(c,14,4,1,2,Y);R(c,13,6,1,1,Y);
    drawFace(c,sk,true);R(c,4,5,1,3,S);R(c,11,5,1,3,S);
    R(c,7,0,2,1,P);R(c,6,1,4,1,P);R(c,5,2,6,1,P);R(c,4,3,8,1,P);R(c,3,4,10,1,D);R(c,6,1,2,1,Y);R(c,6,2,1,1,Y);R(c,7,2,1,1,P);},
  /* عباءة وشيلة: black abaya with a gold hem and a black shayla */
  thf:(c,up,sk)=>{const A='#252a38',Sh='#171b26',G='#e0b84a';
    R(c,4,11,8,6,A);R(c,3,16,10,5,A);R(c,3,20,10,1,G);R(c,7,11,1,9,Sh);R(c,4,14,8,1,G);R(c,5,21,2,1,'#2a1c10');R(c,9,21,2,1,'#2a1c10');hArms(c,up,A,sk,G);
    drawFace(c,sk,true);
    R(c,5,0,6,1,A);R(c,3,1,10,3,A);R(c,3,4,2,8,A);R(c,11,4,2,8,A);R(c,4,3,8,1,Sh);R(c,3,11,2,2,Sh);R(c,11,11,2,2,Sh);R(c,6,1,1,1,G);R(c,7,2,1,1,G);R(c,5,4,6,1,A);},
  /* عباءة سوداء وبرقع: the traditional face mask leaves only the eyes */
  thb:(c,up,sk)=>{const A='#252a38',Sh='#171b26',G='#e0b84a',BQ='#5a3a22',BQ2='#3a2416';
    R(c,4,11,8,6,A);R(c,3,16,10,5,A);R(c,3,20,10,1,G);R(c,7,11,1,9,Sh);R(c,4,14,8,1,G);R(c,5,21,2,1,'#2a1c10');R(c,9,21,2,1,'#2a1c10');hArms(c,up,A,sk,G);
    drawFace(c,sk,true);
    R(c,5,4,6,6,BQ);R(c,5,4,6,1,G);R(c,7,5,2,5,BQ2);R(c,5,6,2,1,sk);R(c,9,6,2,1,sk);R(c,6,6,1,1,'#1b1b2f');R(c,9,6,1,1,'#1b1b2f');R(c,5,9,6,1,BQ2);
    R(c,5,0,6,1,A);R(c,3,1,10,3,A);R(c,3,4,2,8,A);R(c,11,4,2,8,A);R(c,4,3,8,1,Sh);R(c,3,11,2,2,Sh);R(c,11,11,2,2,Sh);R(c,6,1,1,1,G);R(c,7,2,1,1,G);},
  /* بطلة القفزات: orange cap with a star, cream long-sleeved shirt, blue pinafore with gold buttons */
  bdf:(c,up,sk)=>{const CAP='#ec8a1c',CD='#b85c0a',SH='#ffe9a8',BL='#2f6fe0',BD='#1f4aa8',G='#ffd23f',BR='#5b3a22',HR='#6b3a22';
    R(c,5,17,3,3,'#f4f4ee');R(c,8,17,3,3,'#f4f4ee');R(c,5,20,3,2,BR);R(c,8,20,3,2,BR);R(c,4,21,4,1,'#2a1c10');R(c,8,21,4,1,'#2a1c10');
    R(c,3,3,2,10,HR);R(c,11,3,2,10,HR);R(c,4,11,8,6,SH);R(c,5,13,6,4,BL);R(c,5,11,1,2,BL);R(c,10,11,1,2,BL);R(c,5,13,1,1,G);R(c,10,13,1,1,G);
    R(c,3,16,10,4,BL);R(c,3,19,10,1,BD);R(c,7,17,2,3,BD);hArms(c,up,SH,sk,'#ffffff');
    drawFace(c,sk,true);R(c,4,5,1,2,HR);R(c,11,5,1,2,HR);
    R(c,5,0,6,2,CAP);R(c,3,2,10,2,CAP);R(c,2,3,1,1,CAP);R(c,13,3,1,1,CAP);R(c,3,4,10,1,CD);R(c,7,1,3,2,'#ffffff');R(c,7,1,1,1,CAP);R(c,9,1,1,1,CAP);R(c,8,2,1,1,'#ffd23f');},
  hkf:(c,up,sk)=>{const V='#8b5cd6',G='#ffd23f',CP='#e0a800',B='#3a1a48';
    R(c,2,10,12,11,CP);R(c,2,20,12,1,adj(CP,.7));R(c,3,3,2,10,B);R(c,11,3,2,10,B);
    R(c,5,17,3,3,V);R(c,8,17,3,3,V);R(c,4,20,4,2,G);R(c,8,20,4,2,G);
    R(c,4,11,8,6,V);hTunic(c,V);R(c,7,13,2,2,G);R(c,6,13,1,1,G);R(c,9,13,1,1,G);R(c,7,12,1,1,G);R(c,8,15,1,1,G);R(c,4,15,8,1,G);hArms(c,up,V,sk,G);
    drawFace(c,sk,true);R(c,4,2,8,3,B);R(c,4,5,1,2,B);R(c,11,5,1,2,B);R(c,4,3,8,1,G);R(c,7,2,2,1,'#ee5fa7');}
};
const HEROES={
  m:[{id:'nj',n:'نينجا الظل',need:2},{id:'sm',n:'ساموراي الفجر',need:4},{id:'cp',n:'قبطان العاصفة',need:6},{id:'ma',n:'سيّد القتال',need:9},{id:'wz',n:'ساحر النجوم',need:13},{id:'hk',n:'فارس الصقر',need:18},{id:'th',n:'ثوب وغترة بيضاء',need:20},{id:'thr',n:'ثوب وغترة حمراء',need:22},{id:'bd',n:'بطل القفزات',need:24}],
  f:[{id:'njf',n:'نينجا الورد',need:2},{id:'smf',n:'ساموراي الزهر',need:4},{id:'cpf',n:'قبطانة البحار',need:6},{id:'maf',n:'سيّدة القتال',need:9},{id:'wzf',n:'ساحرة القمر',need:13},{id:'hkf',n:'بطلة الشروق',need:18},{id:'thf',n:'عباءة وشيلة',need:20},{id:'thb',n:'عباءة وبرقع',need:22},{id:'bdf',n:'بطلة القفزات',need:24}]
};
const heroList=g=>HEROES[g==='f'?'f':'m'];
