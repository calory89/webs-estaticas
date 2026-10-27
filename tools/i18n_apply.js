const fs=require('fs');let h=fs.readFileSync('index.template.html','utf8');
function span(i){let s=i,d=0,q=null;for(;i<h.length;i++){const c=h[i];if(q){if(c=='\\'){i++;continue}if(c==q)q=null;continue}
 if(c=='"'||c=="'"||c=='`'){q=c;continue}if('([{'.includes(c))d++;else if(')]}'.includes(c)){d--;if(d==0){i++;break}}}return [s,i];}
const ser=o=>'{\n'+Object.entries(o).map(([k,v])=>'  '+JSON.stringify(k)+':'+JSON.stringify(v)).join(',\n')+'\n}';
const langs=fs.readdirSync('../i18n').filter(f=>f.endsWith('.fix.json')).map(f=>f.slice(0,2));
const SIDE={sub:'SUB',lbl:'LBL',for:'FOR_LBL'};const log=[];
for(const l of langs){const fx=JSON.parse(fs.readFileSync('../i18n/'+l+'.fix.json','utf8'));
 const m=h.indexOf('\nT.'+l+' = {');if(m<0)throw l;const [a,b]=span(h.indexOf('{',m));const T=eval('('+h.slice(a,b)+')');
 let n=0;for(const [k,v] of Object.entries(Object.assign({},fx.strings||{},fx.plural||{}))){if(T[k]!==v){T[k]=v;n++;}}
 h=h.slice(0,a)+ser(T)+h.slice(b);
 let ns=0;for(const sk in SIDE){const ch=fx[sk]||{};if(!Object.keys(ch).length)continue;const vi=h.indexOf('const '+SIDE[sk]+' = {');const [sa,sb]=span(h.indexOf('{',vi));const O=eval('('+h.slice(sa,sb)+')');
  if(!O[l])throw 'no side '+sk+' '+l; for(const [k,v] of Object.entries(ch)){if(O[l][k]!==v){O[l][k]=v;ns++;}}
  const out='{\n'+Object.entries(O).map(([lk,lv])=>'  '+lk+':'+JSON.stringify(lv)).join(',\n')+'\n}';h=h.slice(0,sa)+out+h.slice(sb);}
 log.push(l+': T '+n+' side '+ns);}
fs.writeFileSync('index.template.html',h);console.log(log.join(' | '));
