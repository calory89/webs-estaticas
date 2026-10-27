const fs=require('fs');const h=fs.readFileSync(process.argv[2],'utf8');
function grabAt(i){let s=i,d=0,q=null;for(;i<h.length;i++){const c=h[i];if(q){if(c=='\\'){i++;continue}if(c==q)q=null;continue}
 if(c=='"'||c=="'"||c=='`'){q=c;continue}if('([{'.includes(c))d++;else if(')]}'.includes(c)){d--;if(d==0){i++;break}}}return h.slice(s,i);}
const T={};const re=/\nT\.([a-z]{2}) = \{/g;let m;
while((m=re.exec(h))){T[m[1]]=eval('('+grabAt(m.index+m[0].length-1)+')');}
const re2=/Object\.assign\(T\.([a-z]{2}), \{/g;while((m=re2.exec(h))){Object.assign(T[m[1]],eval('('+grabAt(m.index+m[0].length-1)+')'));}
const U=new Set();for(const k in T)for(const x in T[k])U.add(x);
const en=[...U];const out={};
for(const k in T){if(k==='en')continue;const t=T[k];const miss=en.filter(x=>!(x in t));const same=en.filter(x=>x in t && t[x]===T.en[x] && /[a-z]{4}/i.test(T.en[x]) && T.en[x].length>6);
 out[k]={keys:Object.keys(t).length,missing:miss.length,sameAsEn:same.length,missList:miss,sameList:same};}
fs.writeFileSync(process.argv[3],JSON.stringify({en:en.length,langs:out},null,1));
console.log('en keys',en.length);for(const k in out)console.log(k,'keys',out[k].keys,'missing',out[k].missing,'sameAsEn',out[k].sameAsEn);
