/* ---------- ambient sound for every map (all synthesised with Web Audio, no files) ----------
   One soundscape per map, played quietly while the adventure screen is open. The sound button mutes it with everything else.
   To remove the whole feature: delete this file from the build (nothing else depends on it). */
const AMB={run:null,master:null,an:null,gest:false,nb:{}};
const ambCtx=()=>{if(!ac)ac=new(window.AudioContext||window.webkitAudioContext)();return ac;};
function ambMaster(){
  if(AMB.master)return AMB.master;const c=ambCtx();AMB.master=c.createGain();AMB.master.gain.value=.22*(typeof volBg==='function'?volBg():1);
  AMB.an=c.createAnalyser();AMB.an.fftSize=1024;AMB.master.connect(AMB.an);AMB.an.connect(c.destination);return AMB.master;
}
function ambNoise(kind){
  if(AMB.nb[kind])return AMB.nb[kind];const c=ambCtx(),n=c.sampleRate*3,b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);let l=0;
  for(let i=0;i<n;i++){const w=Math.random()*2-1;if(kind==='brown'){l=(l+.02*w)/1.02;d[i]=l*3.5;}else d[i]=w;}
  return(AMB.nb[kind]=b);
}
const AMB_N=n=>{const m=/^([A-G])([#b]?)(\d)$/.exec(n);if(!m)return 0;const s={C:0,D:2,E:4,F:5,G:7,A:9,B:11}[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0);return 440*Math.pow(2,((+m[3]+1)*12+s-69)/12);};

const AMB_TRIM={peak:1.9,desert:1.3,jungle:1.6,river:1.3,hop:1,bahrain:1.5};
function ambStart(id){
  const c=ambCtx(),run={id,dead:false,nodes:[],timers:[]},g=c.createGain();g.gain.value=0;g.connect(ambMaster());g.gain.linearRampToValueAtTime(AMB_TRIM[id]||1,c.currentTime+1.4);run.g=g;
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
  /* مملكة البحرين: the melody is a hand-transcribed copy of the tune in the nahham recording the teacher chose (the notes only, about 53 seconds, repeating),
     sung by a synthesised deep male voice (sawtooth + vowel formants, an octave below the recording), with a low drone and the sea; no drums. Nothing is copied from the recording. */
  bahrain(r,c){
    /* the sea: slow swells of low surf plus a wash of foam on top */
    r.layer({kind:'brown',t:'lowpass',f:520,v:.05,rate:.09,depth:.035,frate:.07,fdepth:200});
    r.layer({kind:'white',t:'bandpass',f:1500,q:.5,v:.011,rate:.11,depth:.009});
    r.layer({kind:'brown',t:'lowpass',f:300,v:.028,rate:.05,depth:.02});
    const T=151,N=k=>T*Math.pow(2,k/1200);
    r.tone({f:T/2,v:.03,type:'triangle'});r.tone({f:T*.75,v:.012,type:'triangle'});
    const M=[[0.0,0.09,-100],[0.1,0.24,75],[0.51,0.13,125],[0.65,0.22,350],[0.88,0.16,450],[1.05,0.19,625],[1.25,0.72,450],[1.98,0.58,350],[2.59,0.82,100],[3.46,0.97,525],[4.44,0.3,350],[4.75,0.18,75],[4.98,0.1,375],[5.09,0.37,75],[5.47,0.66,-25],[6.14,0.12,50],[6.27,0.53,25],[8.21,0.15,25],[8.37,0.17,200],[8.63,0.33,450],[8.97,0.4,700],[9.45,0.56,400],[10.1,0.27,650],[10.46,0.12,350],[10.59,1.58,500],[12.25,0.1,100],[13.26,0.12,200],[13.39,0.25,375],[13.65,0.12,500],[13.78,0.14,650],[13.93,0.47,500],[14.42,0.11,575],[14.54,0.19,425],[14.84,0.38,125],[15.23,0.12,25],[15.9,0.45,650],[16.37,0.18,500],[16.56,0.09,650],[16.67,0.24,425],[16.92,0.26,100],[17.28,0.51,100],[18.12,0.41,625],[18.56,0.14,450],[18.92,0.15,375],[19.2,0.16,100],[19.41,0.5,0],[19.92,0.49,100],[20.42,0.46,0],[22.21,0.1,725],[22.32,0.25,-450],[22.65,2.26,-25],[25.3,0.27,-25],[25.65,0.56,375],[26.55,0.12,275],[26.68,0.18,75],[27.03,0.14,200],[27.18,0.3,125],[27.49,0.11,0],[28.09,0.16,150],[28.26,0.31,400],[28.67,0.09,650],[28.77,0.12,450],[28.9,0.25,375],[29.47,0.27,0],[29.75,0.66,100],[30.42,0.12,100],[30.59,0.35,-25],[30.95,0.13,25],[32.68,0.28,0],[33.06,0.14,250],[33.21,0.29,425],[33.51,0.37,575],[34.0,0.11,575],[34.12,0.74,450],[34.92,0.3,350],[35.23,0.15,500],[35.39,0.39,650],[35.86,0.25,300],[36.12,0.1,425],[36.23,0.11,575],[36.35,0.87,450],[37.23,0.12,125],[38.0,0.09,525],[38.1,0.22,700],[38.34,0.09,450],[38.55,0.96,450],[39.52,0.22,625],[39.75,0.25,450],[40.01,0.11,350],[40.22,0.41,125],[40.64,0.13,0],[41.3,0.22,650],[41.53,0.94,400],[42.57,0.37,400],[43.05,0.16,150],[43.27,0.11,50],[43.39,0.59,125],[43.99,0.19,0],[45.22,0.25,-450],[45.7,0.44,-400],[46.15,0.17,-325],[46.4,1.84,0],[48.38,0.2,-25],[48.79,0.1,-25],[48.92,0.12,500],[49.05,0.15,350],[49.28,0.1,175],[49.39,0.21,350],[49.65,0.09,50],[49.89,0.47,100],[50.44,0.15,150],[51.02,0.17,550],[51.2,0.18,400],[51.48,0.13,100],[51.72,0.5,0],[52.23,0.22,125],[52.61,0.48,0],[53.1,0.11,-100],[53.22,0.16,0]],LOOP=55;
    const sing=t0=>{
      const mk=(type,det)=>{const o=c.createOscillator();o.type=type;o.detune.value=det;return o;};
      const oa=mk('sawtooth',-7),ob=mk('sawtooth',7),oc=mk('sine',0),mix=c.createGain(),env=c.createGain(),lf=c.createOscillator(),ld=c.createGain(),hp=c.createBiquadFilter();
      mix.gain.value=1;env.gain.value=.0001;
      lf.frequency.value=5.2;ld.gain.value=7;lf.connect(ld);[oa,ob,oc].forEach(o=>ld.connect(o.detune));
      const oS=c.createGain();oS.gain.value=.9;oa.connect(mix);ob.connect(mix);oc.connect(oS);oS.connect(env);
      /* three vowel formants of a man's voice */
      const fm=[[600,3.5,1],[950,4,.4],[2300,5,.08]].map(([f,q,g])=>{const b=c.createBiquadFilter();b.type='bandpass';b.frequency.value=f;b.Q.value=q;const gg=c.createGain();gg.gain.value=g;mix.connect(b);b.connect(gg);gg.connect(env);return b;});
      hp.type='lowpass';hp.frequency.value=1700;env.connect(hp);const out=c.createGain();out.gain.value=.1;hp.connect(out);out.connect(r.g);
      const all=[oa,ob,oc,lf];all.forEach(o=>{r.nodes.push(o);o.start(t0);o.stop(t0+LOOP+1);});r.nodes.push(out);
      oa.frequency.value=ob.frequency.value=oc.frequency.value=N(0);
      M.forEach(([s,d,k],i)=>{const t=t0+s,f=N(k),prev=M[i-1],next=M[i+1],legatoIn=prev&&s-(prev[0]+prev[1])<.15,legatoOut=next&&next[0]-(s+d)<.15;
        [oa,ob,oc].forEach(o=>o.frequency.setTargetAtTime(f,t,legatoIn?.06:.03));
        env.gain.setTargetAtTime(d<.15?.45:.9,t,.06);
        fm[0].frequency.setTargetAtTime(610,t,.05);if(d>=.45)fm[0].frequency.setTargetAtTime(500,t+.18,.25);
        if(!legatoOut)env.gain.setTargetAtTime(.0001,t+d,.1);});
    };
    sing(c.currentTime+.2);r.timers.push(setInterval(()=>{if(!r.dead)sing(c.currentTime+.2);},LOOP*1000));
    r.every(16000,28000,t=>r.osc({t,f:1900,f2:1300,d:.5,v:.02,vib:9,vd:60}));}
};

/* start / stop follows what is on screen: the adventure view, sound on, page visible, after the first tap */
const ambWant=()=>{try{return soundOn()&&AMB.gest&&!document.hidden&&typeof view==='string'&&(view==='home'||Date.now()<(AMB.testUntil||0))&&!!MAPS[S.cfg.mapId];}catch(e){return false;}};
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
