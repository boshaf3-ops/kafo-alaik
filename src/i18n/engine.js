/* ---------- English interface ----------
   The whole game is written in Arabic. In English mode every piece of Arabic text that reaches the page (screens, messages, labels, the certificate)
   is translated on the way in: exact phrases first (EN_EX), then sentence patterns with names and numbers (EN_PAT).
   Text that is not in the tables (a child's name, a behaviour the parent typed) stays exactly as it was written.
   To remove the feature: delete this file from the build and the language option in settings. */
const I18N={lang:(function(){try{return localStorage.getItem('kafo.lang')==='en'?'en':'ar';}catch(e){return 'ar';}})()};
const EN_EX=/*EX*/{};
const EN_PAT=(/*PAT*/[]).map(p=>[new RegExp(p[0]),p[1]]);
const AR_RX=/[؀-ۿ]/,EN_CACHE=new Map();
function trCore(c){
  if(EN_EX[c]!=null)return EN_EX[c];
  const d=c.replace(/[.،]$/,'');if(d!==c&&EN_EX[d]!=null)return EN_EX[d]+(c.endsWith('.')?'.':'');
  for(const [re,t] of EN_PAT){const m=re.exec(c);if(m)return t.replace(/\$(\d)/g,(_,i)=>trText(m[+i]));}
  const lt=/^([+\-−–✓✔★•→←\s]+)([\s\S]*)$/.exec(c);if(lt&&AR_RX.test(lt[2]))return lt[1]+trText(lt[2]);
  const tl=/^([\s\S]*?)(\s+[+\-−]\d+)$/.exec(c);if(tl&&AR_RX.test(tl[1]))return trText(tl[1])+tl[2];
  if(c.indexOf(' · ')>0)return c.split(' · ').map(trText).join(' · ');
  if(c.indexOf(' | ')>0)return c.split(' | ').map(trText).join(' | ');
  if(c.indexOf('، ')>0&&c.length<120)return c.split('، ').map(trText).join(', ');
  return c;
}
function trText(s){
  if(I18N.lang!=='en'||!s||typeof s!=='string'||!AR_RX.test(s))return s;
  const m=/^(\s*)([\s\S]*?)(\s*)$/.exec(s);let r=EN_CACHE.get(m[2]);
  if(r===undefined){r=trCore(m[2]);EN_CACHE.set(m[2],r);}
  return m[1]+r+m[3];
}
const TR=trText;
const TR_ATTR=['placeholder','aria-label','title','alt','value'];
function trNode(n){
  if(!n)return;
  if(n.nodeType===3){const v=n.nodeValue;if(AR_RX.test(v)){const t=trText(v);if(t!==v)n.nodeValue=t;}return;}
  if(n.nodeType!==1)return;
  if(n.hasAttribute&&n.hasAttribute('data-nt'))return;
  const tn=n.tagName;if(tn==='SCRIPT'||tn==='STYLE')return;
  for(const a of TR_ATTR){if(n.hasAttribute(a)){const v=n.getAttribute(a);if(AR_RX.test(v)){const t=trText(v);if(t!==v)n.setAttribute(a,t);}}}
  for(let c=n.firstChild;c;c=c.nextSibling)trNode(c);
}
function i18nStart(){
  if(I18N.lang!=='en')return;
  const de=document.documentElement;de.lang='en';de.dir='ltr';
  document.title='Kafo Alaik';
  trNode(document.body);
  new MutationObserver(recs=>{for(const r of recs){
    if(r.type==='childList')r.addedNodes.forEach(trNode);
    else if(r.type==='characterData')trNode(r.target);
    else if(r.type==='attributes'){const el=r.target,v=el.getAttribute(r.attributeName);if(v&&AR_RX.test(v)){const t=trText(v);if(t!==v)el.setAttribute(r.attributeName,t);}}
  }}).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:TR_ATTR});
}
/* the language switch: remembered on this device, the page reloads so everything is drawn in the new language */
function setLang(l){try{localStorage.setItem('kafo.lang',l==='en'?'en':'ar');}catch(e){}location.reload();}
const dateLoc=()=>I18N.lang==='en'?'en-GB':'ar-u-nu-latn';
