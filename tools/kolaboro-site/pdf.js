const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
const dir=process.argv[2], out=process.argv[3]; fs.mkdirSync(out,{recursive:true});
for (const f of fs.readdirSync(dir).filter(f=>f.endsWith('.html'))) {
 await p.goto('file://'+path.resolve(dir,f)); await p.waitForTimeout(300);
 await p.pdf({path:path.join(out,f.replace('.html','.pdf')),format:'A4',printBackground:true,preferCSSPageSize:true});
}
await b.close();})();
