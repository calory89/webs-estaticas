const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:880,height:160},deviceScaleFactor:2});
 await p.setContent('<html><body style="margin:0;background:transparent">'+fs.readFileSync('out/k/logo.svg','utf8').replace('<svg','<svg width="880" height="160"')+'</body></html>');
 await p.screenshot({path:'out/k/logo.png',omitBackground:true}); await b.close(); })();
