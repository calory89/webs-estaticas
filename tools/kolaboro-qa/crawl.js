// Daily QA of kolaboro.com: every page in the sitemap on mobile and desktop.
// Fails (exit 1) on broken internal links, JS errors, 4xx/5xx assets or horizontal overflow.
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.env.KB_BASE || 'https://kolaboro.com';
(async () => {
  const b = await chromium.launch();
  const sm = await (await fetch(BASE + '/sitemap.xml')).text();
  let urls = [...sm.matchAll(/<loc>https:\/\/kolaboro\.com([^<]*)<\/loc>/g)].map(m => m[1]);
  urls = [...new Set(urls.concat(['/', '/cases', '/database/', '/check', '/pricing']))];
  const problems = [], links = new Set();
  for (const [w, h, dev] of [[390, 844, 'mobile'], [1366, 900, 'desktop']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    for (const u of urls) {
      const p = await ctx.newPage(); const errs = [];
      p.on('pageerror', e => { if (!/clarity\.ms|googletagmanager|google-analytics|gtag/.test(e.stack || '')) errs.push('js: ' + e.message.slice(0, 160)); });
      p.on('response', r => { if (r.status() >= 400 && r.url().startsWith(BASE) && !/\/api\/geo|\/cdn-cgi\//.test(r.url())) errs.push(r.status() + ' ' + r.url().replace(BASE, '')); });
      try { const r = await p.goto(BASE + u, { waitUntil: 'load', timeout: 45000 }); if (!r || r.status() >= 400) errs.push('status ' + (r && r.status())); } catch (e) { errs.push('load: ' + e.message.slice(0, 80)); }
      await p.waitForTimeout(1500);
      const info = await p.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth + 2, links: [...document.querySelectorAll('a[href^="/"]')].map(a => a.getAttribute('href')) })).catch(() => ({ links: [] }));
      if (info.overflow) errs.push('horizontal overflow');
      (info.links || []).forEach(l => { if (!l.startsWith('//')) links.add(l.split('#')[0].split('?')[0]); });
      if (errs.length) problems.push({ page: u, device: dev, errors: [...new Set(errs)].slice(0, 8) });
      await p.close();
    }
    await ctx.close();
  }
  for (const l of links) { if (!l || l.startsWith('/cdn-cgi') || l.startsWith('/api/')) continue; try { const r = await fetch(BASE + l, { redirect: 'manual' }); if (r.status >= 400) problems.push({ page: l, device: 'link', errors: ['broken link ' + r.status] }); } catch (e) { problems.push({ page: l, device: 'link', errors: ['fetch failed'] }); } }
  const out = { date: new Date().toISOString(), pages: urls.length, links: links.size, problems };
  fs.writeFileSync(process.env.KB_QA_OUT || 'qa.json', JSON.stringify(out, null, 1));
  console.log('pages', urls.length, 'links', links.size, 'problems', problems.length);
  problems.slice(0, 40).forEach(x => console.log('::warning::' + x.device + ' ' + x.page + ': ' + x.errors.join('; ')));
  await b.close();
  process.exit(problems.length ? 1 : 0);
})();
