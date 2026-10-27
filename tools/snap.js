const fs=require('fs');const h=fs.readFileSync(process.argv[2],'utf8');
function grab(name){const m=new RegExp('[ ,;]'+name+'=').exec(h);if(!m)throw name;let i=m.index+m[0].length,s=i,d=0,q=null;
 for(;i<h.length;i++){const c=h[i];if(q){if(c=='\\'){i++;continue}if(c==q)q=null;continue}
  if(c=='"'||c=="'"||c=='`'){q=c;continue}if('([{'.includes(c))d++;else if(')]}'.includes(c)){d--;}else if((c==','||c==';')&&d==0)break;}
 return eval('('+h.slice(s,i)+')');}
const o={};for(const k of ['STATS','CITIES','STR','RAW','HELP','DATA_V'])o[k]=grab(k);
o.CHUNKS=[...grab('CHUNKS')];o.SPLIT=[...grab('SPLIT')];
const m=/<nav class="wel-cities"[^>]*><b[^>]*>[^<]*<\/b>:\s*([\s\S]*?)\s*<a href="c\/"/.exec(h);o.CITYLINKS=m?m[1]:'';
fs.writeFileSync(process.argv[3],JSON.stringify(o));
console.log(o.STATS,o.CITIES.length,o.STR.length,o.RAW.length,o.CHUNKS.length,o.SPLIT.length,o.DATA_V,o.CITYLINKS.slice(0,200));
