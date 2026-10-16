/* ---------- ambient sound for every map (all synthesised with Web Audio, no files) ----------
   One soundscape per map, played quietly while the adventure screen is open. The sound button mutes it with everything else.
   To remove the whole feature: delete this file from the build (nothing else depends on it). */
const AMB={run:null,master:null,an:null,gest:false,nb:{}};
const ambCtx=()=>{if(!ac)ac=new(window.AudioContext||window.webkitAudioContext)();return ac;};
function ambMaster(){
  if(AMB.master)return AMB.master;const c=ambCtx();AMB.master=c.createGain();AMB.master.gain.value=.6;
  AMB.an=c.createAnalyser();AMB.an.fftSize=1024;AMB.master.connect(AMB.an);AMB.an.connect(c.destination);return AMB.master;
}
function ambNoise(kind){
  if(AMB.nb[kind])return AMB.nb[kind];const c=ambCtx(),n=c.sampleRate*3,b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);let l=0;
  for(let i=0;i<n;i++){const w=Math.random()*2-1;if(kind==='brown'){l=(l+.02*w)/1.02;d[i]=l*3.5;}else d[i]=w;}
  return(AMB.nb[kind]=b);
}
const AMB_N=n=>{const m=/^([A-G])([#b]?)(\d)$/.exec(n);if(!m)return 0;const s={C:0,D:2,E:4,F:5,G:7,A:9,B:11}[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0);return 440*Math.pow(2,((+m[3]+1)*12+s-69)/12);};

function ambStart(id){
  const c=ambCtx(),run={id,dead:false,nodes:[],timers:[]},g=c.createGain();g.gain.value=0;g.connect(ambMaster());g.gain.linearRampToValueAtTime(1,c.currentTime+1.4);run.g=g;
  const keep=n=>{run.nodes.push(n);return n;};
  /* a looping noise layer: kind white|brown, filter {t,f,q}, level, optional slow LFO on level (rate,depth) or on the filter (frate,fdepth) */
  run.layer=(o)=>{const s=keep(c.createBufferSource());s.buffer=ambNoise(o.kind||'white');s.loop=true;s.loopStart=Math.random()*1.5;
    const f=c.createBiquadFilter();f.type=o.t||'lowpass';f.frequency.value=o.f||800;f.Q.value=o.q||.7;const v=c.createGain();v.gain.value=o.v||.05;
    s.connect(f);f.connect(v);v.connect(g);s.start();
    if(o.rate){const l=keep(c.createOscillator()),d=c.createGain();l.frequency.value=o.rate;d.gain.value=o.depth||(o.v||.05)*.6;l.connect(d);d.connect(v.gain);l.start();}
    if(o.frate){const l=keep(c.createOscillator()),d=c.createGain();l.frequency.value=o.frate;d.gain.value=o.fdepth||200;l.connect(d);d.connect(f.frequency);l.start();}
    return v;};
  /* a steady tone (drone / insect): freq, type, level, optional tremolo */
  run.tone=(o)=>{const s=keep(c.createOscillator());s.type=o.type||'sine';s.frequency.value=o.f;const v=c.createGain();v.gain.value=o.v||.02;s.connect(v);v.connect(g);s.start();
    if(o.rate){const l=keep(c.createOscillator()),d=c.createGain();l.frequency.value=o.rate;d.gain.value=o.depth||(o.v||.02)*.8;l.connect(d);d.connect(v.gain);l.start();}
    return v;};
  /* one-shot oscillator: start time t, length, level, optional glide to f2, vibrato, filter */
  run.osc=(o)=>{const t=o.t||c.currentTime,s=c.createOscillator(),v=c.createGain();s.type=o.type||'sine';s.frequency.setValueAtTime(o.f,t);if(o.f2)s.frequency.exponentialRampToValueAtTime(o.f2,t+o.d);
    v.gain.setValueAtTime(.0001,t);v.gain.linearRampToValueAtTime(o.v||.03,t+Math.min(o.a==null?.01:o.a,o.d/2));v.gain.exponentialRampToValueAtTime(.0001,t+o.d);
    let out=v;s.connect(v);
    if(o.lp){const f=c.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(o.lp,t);if(o.lp2)f.frequency.exponentialRampToValueAtTime(o.lp2,t+o.d);v.connect(f);out=f;}
    if(o.vib){const l=c.createOscillator(),d=c.createGain();l.frequency.value=o.vib;d.gain.value=o.vd||8;l.connect(d);d.connect(s.frequency);l.start(t);l.stop(t+o.d+.05);}
    if(o.trem){const l=c.createOscillator(),d=c.createGain();l.frequency.value=o.trem;d.gain.value=o.v||.03;l.connect(d);d.connect(v.gain);l.start(t);l.stop(t+o.d+.05);}
    out.connect(o.to||g);s.start(t);s.stop(t+o.d+.05);};
  /* one-shot noise burst */
  run.burst=(o)=>{const t=o.t||c.currentTime,s=c.createBufferSource();s.buffer=ambNoise(o.kind||'white');const f=c.createBiquadFilter();f.type=o.ft||'bandpass';f.frequency.setValueAtTime(o.f||1500,t);if(o.f2)f.frequency.exponentialRampToValueAtTime(o.f2,t+o.d);f.Q.value=o.q||.8;
    const v=c.createGain();v.gain.setValueAtTime(.0001,t);v.gain.linearRampToValueAtTime(o.v||.05,t+(o.a==null?.01:o.a));v.gain.exponentialRampToValueAtTime(.0001,t+o.d);s.connect(f);f.connect(v);v.connect(o.to||g);s.start(t,Math.random()*2);s.stop(t+o.d+.05);};
  run.every=(a,b,fn)=>{const loop=()=>{if(run.dead)return;try{fn(c.currentTime);}catch(e){}run.timers.push(setTimeout(loop,a+Math.random()*(b-a)));};run.timers.push(setTimeout(loop,a*.4+Math.random()*a));};
  /* a step sequencer: bpm, 4 steps per beat, a little look-ahead */
  run.steps=(bpm,fn)=>{const dt=60/bpm/4;let n=0,nt=c.currentTime+.1;const iv=setInterval(()=>{if(run.dead)return;while(nt<c.currentTime+.2){fn(n,nt,dt);n++;nt+=dt;}},40);run.timers.push(iv);};
  run.pick=a=>a[Math.floor(Math.random()*a.length)];
  const S_=SCAPES[id]||SCAPES.peak;S_(run,c);
  AMB.run=run;
}
function ambStop(){
  const run=AMB.run;if(!run)return;AMB.run=null;run.dead=true;const c=ambCtx();
  try{run.g.gain.cancelScheduledValues(c.currentTime);run.g.gain.setValueAtTime(run.g.gain.value,c.currentTime);run.g.gain.linearRampToValueAtTime(0,c.currentTime+.7);}catch(e){}
  run.timers.forEach(t=>{clearTimeout(t);clearInterval(t);});
  setTimeout(()=>{run.nodes.forEach(n=>{try{n.stop();}catch(e){}try{n.disconnect();}catch(e){}});try{run.g.disconnect();}catch(e){}},900);
}
const ambBird=(r,c,t,hi)=>{const k=1+Math.floor(Math.random()*3),b=(hi||2400)+Math.random()*900;for(let i=0;i<k;i++)r.osc({t:t+i*.11,f:b+i*120,f2:b*1.35+i*120,d:.09,v:.022,type:'sine'});};

const SCAPES={
  /* جبل الأبطال: a light breeze and a few birds */
  peak(r){r.layer({t:'bandpass',f:420,q:.5,v:.035,rate:.12,depth:.02,frate:.07,fdepth:160});r.layer({kind:'white',t:'highpass',f:3500,v:.004,rate:.2});
    r.every(2500,6000,t=>ambBird(r,0,t));},
  /* الجبل الثلجي: a howling blizzard */
  snow(r){r.layer({t:'bandpass',f:650,q:.6,v:.09,rate:.15,depth:.045,frate:.11,fdepth:260});r.layer({kind:'brown',t:'lowpass',f:160,v:.14,rate:.08,depth:.05});
    r.layer({t:'bandpass',f:1500,q:7,v:.012,rate:.2,depth:.008,frate:.17,fdepth:420});r.every(5000,10000,t=>r.burst({t,f:500,f2:1700,d:2.2,a:1,v:.07,q:.6}));},
  /* الجبل البركاني: deep rumble, crackling lava, distant booms */
  volcano(r){r.layer({kind:'brown',t:'lowpass',f:110,v:.3,rate:.2,depth:.1});r.layer({t:'bandpass',f:900,q:1,v:.012,rate:.6,depth:.01});
    r.every(120,520,t=>r.burst({t,ft:'highpass',f:2200+Math.random()*1500,d:.04,v:.05}));
    r.every(7000,13000,t=>{r.osc({t,f:62,f2:28,d:1.1,v:.2,a:.02});r.burst({t,kind:'brown',ft:'lowpass',f:260,d:1.6,a:.1,v:.28});});},
  /* نهر التماسيح: running water, splashes and a crocodile wading and growling */
  river(r){r.layer({t:'bandpass',f:900,q:.6,v:.07,frate:.5,fdepth:380,rate:.3,depth:.02});r.layer({t:'bandpass',f:2300,q:.8,v:.025,frate:.9,fdepth:600});
    r.every(2500,6500,t=>r.burst({t,f:1600,f2:700,d:.28,v:.07}));
    r.every(11000,19000,t=>{for(let i=0;i<3;i++)r.burst({t:t+i*.55,kind:'brown',ft:'lowpass',f:520,d:.5,a:.08,v:.1});
      r.osc({t:t+1.7,f:68,f2:52,d:1.2,v:.12,type:'sawtooth',lp:240,trem:24,a:.1});});},
  /* صحراء الكنوز: wind over sand and a distant hawk */
  desert(r){r.layer({t:'bandpass',f:720,q:.5,v:.06,rate:.1,depth:.035,frate:.06,fdepth:260});r.layer({t:'highpass',f:4200,v:.012,rate:.18,depth:.008});
    r.every(13000,24000,t=>{r.osc({t,f:2700,f2:1850,d:.7,v:.026,vib:7,vd:50});r.osc({t:t+.85,f:2600,f2:1800,d:.6,v:.02,vib:7,vd:50});});},
  /* غابة الأسرار: crickets, an owl, frogs, monkeys and birds */
  jungle(r){r.layer({kind:'brown',t:'lowpass',f:320,v:.04,rate:.1});r.tone({f:4300,v:.006,rate:13,depth:.006});r.tone({f:5200,v:.004,rate:16,depth:.004});
    r.every(1800,4200,t=>{const k=Math.floor(Math.random()*4);
      if(k===0){r.osc({t,f:380,f2:340,d:.42,v:.05,a:.08});r.osc({t:t+.55,f:360,f2:320,d:.5,v:.05,a:.08});}
      else if(k===1){for(let i=0;i<3;i++)r.osc({t:t+i*.13,f:170+i*8,d:.09,v:.035,type:'square',lp:600});}
      else if(k===2){for(let i=0;i<4;i++)r.osc({t:t+i*.14,f:650+i*160,f2:1400+i*120,d:.12,v:.025,vib:25,vd:60});}
      else ambBird(r,0,t,2000);});},
  /* بحيرة اللؤلؤ: gentle waves, bubbles, a seagull */
  lake(r){r.layer({kind:'brown',t:'lowpass',f:520,v:.13,rate:.11,depth:.08});r.layer({t:'highpass',f:3000,v:.02,rate:.11,depth:.017});
    r.every(2000,5000,t=>{const f=500+Math.random()*500;r.osc({t,f,f2:f*2.2,d:.1,v:.03});});
    r.every(15000,26000,t=>{r.osc({t,f:1900,f2:1300,d:.5,v:.03,vib:9,vd:70});});},
  /* جزيرة الكنز: stronger waves, creaking ship, parrot, a ship's bell */
  island(r){r.layer({kind:'brown',t:'lowpass',f:600,v:.16,rate:.14,depth:.1});r.layer({t:'highpass',f:2800,v:.025,rate:.14,depth:.02});
    r.every(5000,9000,t=>r.osc({t,f:92,f2:118,d:1,v:.05,type:'sawtooth',lp:300,trem:6,a:.3}));
    r.every(10000,18000,t=>{r.osc({t,f:1500,f2:900,d:.25,v:.03,type:'square',lp:2400});r.osc({t:t+.32,f:1400,f2:800,d:.22,v:.026,type:'square',lp:2400});});
    r.every(16000,28000,t=>{r.osc({t,f:1250,d:1.4,v:.03});r.osc({t,f:2510,d:.9,v:.012});});
    r.every(14000,24000,t=>r.osc({t,f:1800,f2:1200,d:.5,v:.026,vib:9,vd:60}));},
  /* رحلة الفضاء: a deep drone, a shimmering pad and echoing blips */
  space(r,c){r.tone({f:55,v:.05,rate:.07,depth:.02});r.tone({f:82.6,v:.03,type:'triangle',rate:.05,depth:.015});r.tone({f:1760,v:.004,rate:.4,depth:.003});
    const d=c.createDelay(1),fb=c.createGain(),wet=c.createGain();d.delayTime.value=.34;fb.gain.value=.45;wet.gain.value=.7;d.connect(fb);fb.connect(d);d.connect(wet);wet.connect(r.g);r.nodes.push(d);
    r.every(1500,4200,t=>{const f=500+Math.random()*1800,up=Math.random()<.5;r.osc({t,f:up?f:f*1.6,f2:up?f*1.6:f,d:.16,v:.03,to:d});r.osc({t,f:up?f:f*1.6,f2:up?f*1.6:f,d:.16,v:.015});});
    r.every(9000,15000,t=>{r.osc({t,f:1320,d:.5,v:.03,to:d});});
    r.every(7000,14000,t=>r.burst({t,f:300,f2:2400,d:2.2,a:1,v:.03,q:1.5}));},
  /* عالم ماريو: an original cheerful chiptune loop */
  hop(r){
    const A='G4 C5 E5 - G5 E5 C5 - A4 D5 F5 - A5 F5 D5 - B4 D5 G5 - B5 G5 D5 - C5 E5 G5 C6 G5 E5 C5 -'.split(' '),
          B='E5 - G5 E5 C5 - E5 G5 F5 - A5 F5 D5 - F5 A5 G5 - B5 G5 D5 - G5 B5 C6 G5 E5 C5 G4 - C5 -'.split(' '),
          bass=['C3','C3','D3','D3','G2','G2','C3','C3'],bass2=['C3','C3','D3','D3','G2','G2','C3','C3'];
    r.steps(148,(n,t,dt)=>{const ph=(n>>5)&1?B:A,i=n%32,note=ph[i];
      if(note&&note!=='-')r.osc({t,f:AMB_N(note),d:dt*.85,v:.032,type:'square',a:.004,lp:3200});
      if(i%4===0){const b=(bass[(i>>2)%8]||'C3'),f=AMB_N(b)*(((i>>2)&1)?2:1);r.osc({t,f,d:dt*3.2,v:.07,type:'triangle',a:.004});}
      if(i%2===1)r.burst({t,ft:'highpass',f:7000,d:.03,v:.012});
      if(i%8===0)r.osc({t,f:130,f2:55,d:.12,v:.08,type:'sine'});});},
  /* مملكة البحرين: a Gulf pearl-diving sea tune: oud-like plucks in a hijaz scale, drum, claps, a held "nahham" voice and the sea */
  bahrain(r){
    r.layer({kind:'brown',t:'lowpass',f:420,v:.07,rate:.1,depth:.04});r.layer({t:'highpass',f:3200,v:.008,rate:.1,depth:.006});
    r.tone({f:AMB_N('D2'),v:.035,type:'triangle'});r.tone({f:AMB_N('A2'),v:.018,type:'sine'});
    const P=('A4 - - - G4 - F#4 - Eb4 - - - D4 - - - '+'D4 - Eb4 - F#4 - G4 - A4 - - - Bb4 - A4 - '+'A4 - Bb4 - A4 - G4 - F#4 - Eb4 - F#4 - G4 - '+'F#4 - Eb4 - D4 - - - D4 - - - - - - -').split(' ');
    r.steps(86,(n,t,dt)=>{const i=n%64,b=i%16,note=P[i];
      if(note&&note!=='-')r.osc({t,f:AMB_N(note),d:.5,v:.05,type:'sawtooth',a:.004,lp:2200,lp2:500});
      if(note&&note!=='-')r.osc({t,f:AMB_N(note)*2,d:.2,v:.012,type:'triangle',a:.004});
      if(b===0||b===6||b===10)r.osc({t,f:100,f2:52,d:.22,v:.13,type:'sine'});
      if(b===4||b===12||b===14)r.burst({t,f:2600,d:.06,v:.05,q:1.2});
      if(b===8)r.burst({t,f:1800,d:.05,v:.03,q:1});
      if(i===16||i===48){const v=[['A4',1.0],['Bb4',.45],['A4',.45],['G4',1.1]];let tt=t;v.forEach(([nn,d])=>{const f=AMB_N(nn);
        r.osc({t:tt,f,d,v:.035,a:.12,vib:5.5,vd:f*.012,lp:1800});r.osc({t:tt,f:f*2,d,v:.012,a:.12,vib:5.5,vd:f*.02,lp:2400});tt+=d*.92;});}});
    r.every(16000,28000,t=>r.osc({t,f:1900,f2:1300,d:.5,v:.022,vib:9,vd:60}));}
};

/* start / stop follows what is on screen: the adventure view, sound on, page visible, after the first tap */
const ambWant=()=>{try{return soundOn()&&AMB.gest&&!document.hidden&&typeof view==='string'&&view==='home'&&!!MAPS[S.cfg.mapId];}catch(e){return false;}};
function ambSync(){
  try{
    if(!ambWant()){if(AMB.run)ambStop();return;}
    const id=S.cfg.mapId;if(AMB.run&&AMB.run.id===id)return;
    if(AMB.run)ambStop();ambCtx();if(ac.state==='suspended')ac.resume();ambStart(id);
  }catch(e){}
}
['click','touchstart','keydown'].forEach(ev=>document.addEventListener(ev,()=>{AMB.gest=true;},{capture:true,passive:true}));
setInterval(ambSync,700);
document.addEventListener('visibilitychange',ambSync);
