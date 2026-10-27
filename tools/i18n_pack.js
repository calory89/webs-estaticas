const fs=require('fs');const h=fs.readFileSync('index.template.html','utf8');
function grabAt(i){let s=i,d=0,q=null;for(;i<h.length;i++){const c=h[i];if(q){if(c=='\\'){i++;continue}if(c==q)q=null;continue}
 if(c=='"'||c=="'"||c=='`'){q=c;continue}if('([{'.includes(c))d++;else if(')]}'.includes(c)){d--;if(d==0){i++;break}}}return h.slice(s,i);}
const T={};let m;const re=/\nT\.([a-z]{2}) = \{/g;while((m=re.exec(h)))T[m[1]]=eval('('+grabAt(m.index+m[0].length-1)+')');
const re2=/Object\.assign\(T\.([a-z]{2}), \{/g;while((m=re2.exec(h)))Object.assign(T[m[1]],eval('('+grabAt(m.index+m[0].length-1)+')'));
const NAMES={es:'Spanish',fr:'French',ar:'Arabic',uk:'Ukrainian',ro:'Romanian',pl:'Polish',ru:'Russian',pt:'Portuguese',ur:'Urdu',fa:'Persian (Farsi)',wo:'Wolof',bm:'Bambara',ti:'Tigrinya',ps:'Pashto',so:'Somali',am:'Amharic',tr:'Turkish',bn:'Bengali',zh:'Chinese (Simplified)'};
const plBase=new Set();for(const l in T)for(const k in T[l])if(k.includes('#'))plBase.add(k.split('#')[0]);
for(const l in NAMES){const L=JSON.parse(fs.readFileSync('l/'+l+'.json'));const cats=new Intl.PluralRules(l).resolvedOptions().pluralCategories;
 const rows={};for(const k in T.en){ if(k.includes('#'))continue; rows[k]={en:T.en[k],cur:(T[l][k]!==undefined?T[l][k]:null)}; }
 const plural={};for(const b of plBase){plural[b]={en_base:T.en[b],en_one:T.en[b+'#one']||null,cur_base:T[l][b]||null};for(const c of cats)plural[b][c]=T[l][b+'#'+c]||null;}
 fs.writeFileSync('../i18n/'+l+'.pack.json',JSON.stringify({lang:l,name:NAMES[l],pluralCategories:cats,strings:rows,plural,sub:L.sub,lbl:L.lbl,for:L.for},null,1));}
console.log('plural bases',[...plBase].join(','));
