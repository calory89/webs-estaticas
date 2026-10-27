const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const t = JSON.parse(fs.readFileSync('og_titles.json','utf8')); const b = await chromium.launch(); const p = await b.newPage({ viewport:{width:1200,height:630} });
  const esc = s => s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  for (const [k, title] of Object.entries(t)) {
    const h = title.replace(/^Kolaboro: /, '');
    await p.setContent(`<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap" rel="stylesheet"><style>
body{margin:0;width:1200px;height:630px;background:#E3E2DD;font-family:Archivo;color:#17212B;display:flex;flex-direction:column;justify-content:space-between;padding:64px 72px;box-sizing:border-box}
.b{display:flex;align-items:center;gap:14px;font-stretch:125%;font-weight:850;font-size:40px;letter-spacing:-.03em}
h1{font-stretch:125%;font-weight:850;font-size:${h.length>48?66:h.length>30?80:92}px;line-height:.96;letter-spacing:-.035em;margin:0;max-width:1040px}
.r{display:flex;justify-content:space-between;align-items:end;font-size:26px;color:#2A3541}i{display:inline-block;width:14px;height:14px;border-radius:50%;background:#FF5B14;margin-right:12px}
</style></head><body><div class="b"><svg viewBox="0 0 32 32" width="46" height="46"><path d="M8 4v24M8 16 23 6.5M8 16l15 9.5" fill="none" stroke="#17212B" stroke-width="3.2" stroke-linecap="round"/><circle cx="24" cy="6" r="3.4" fill="#17212B"/><circle cx="24" cy="26" r="3.4" fill="#17212B"/><circle cx="8" cy="16" r="4.2" fill="#FF5B14"/></svg>kolaboro</div>
<h1>${esc(h)}</h1><div class="r"><span>Local agents who work for the buyer.</span><span><i></i>kolaboro.com</span></div></body></html>`, { waitUntil: 'networkidle' });
    await p.screenshot({ path: `out/k/og/${k}.png` }); }
  console.log('og images', Object.keys(t).length); await b.close(); })();
