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
  if (process.env.KB_QA_QUICK) urls = urls.slice(0, 3);
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
  // Speed and accessibility budget on the key pages (mobile). First-party weight is what we control; third-party is analytics.
  const KEY = ['/', '/check', '/pricing/', '/book/', '/database/', '/login/', '/status/', '/metrics/'];
  const BUDGET = { firstPartyKB: 700, totalKB: 2600, loadMs: 4000 };
  const checks = []; let axeSrc = ''; try { axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'); } catch (e) {}
  const mctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  for (const u of KEY) {
    const p = await mctx.newPage(); let fp = 0, all = 0;
    p.on('response', async r => { try { const n = (await r.body()).length; all += n; if (r.url().startsWith(BASE)) fp += n; } catch (e) {} });
    const t0 = Date.now(); try { await p.goto(BASE + u, { waitUntil: 'load', timeout: 45000 }); } catch (e) {}
    const loadMs = Date.now() - t0; await p.waitForTimeout(3500);
    let a11y = null;
    if (axeSrc) { try { await p.addScriptTag({ content: axeSrc }); a11y = await p.evaluate(async () => { const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }, resultTypes: ['violations'] }); return r.violations.filter(v => v.impact === 'critical' || v.impact === 'serious').map(v => v.id + ' (' + v.nodes.length + ')'); }); } catch (e) { a11y = null; } }
    const fk = Math.round(fp / 1024), tk = Math.round(all / 1024);
    const bf = u === '/database/' ? 3500 : BUDGET.firstPartyKB, bt = u === '/database/' ? 5000 : BUDGET.totalKB; // the database page loads the whole open dataset for in-browser search
    checks.push({ name: 'Speed ' + u, ok: fk <= bf && tk <= bt && loadMs <= BUDGET.loadMs, detail: fk + ' KB ours, ' + tk + ' KB total, loaded in ' + (loadMs / 1000).toFixed(1) + ' s on mobile (budget ' + bf + ' KB / ' + bt + ' KB / ' + BUDGET.loadMs / 1000 + ' s)' });
    if (a11y) checks.push({ name: 'Accessibility ' + u, ok: a11y.length === 0, detail: a11y.length ? 'serious issues: ' + a11y.join(', ') : 'no serious or critical WCAG 2 AA issues found by axe-core' });
    await p.close();
  }
  await mctx.close();
  for (const l of links) { if (!l || l.startsWith('/cdn-cgi') || l.startsWith('/api/')) continue; try { const r = await fetch(BASE + l, { redirect: 'manual' }); if (r.status >= 400) problems.push({ page: l, device: 'link', errors: ['broken link ' + r.status] }); } catch (e) { problems.push({ page: l, device: 'link', errors: ['fetch failed'] }); } }
  checks.unshift({ name: 'Every page, mobile and desktop', ok: problems.length === 0, detail: urls.length + ' pages, ' + links.size + ' internal links checked: ' + (problems.length ? problems.length + ' problems' : 'no broken links, JS errors or overflow') });
  const out = { date: new Date().toISOString(), ok: checks.every(c => c.ok), pages: urls.length, links: links.size, checks, problems: problems.slice(0, 60) };
  fs.writeFileSync(process.env.KB_QA_OUT || 'qa.json', JSON.stringify(out, null, 1));
  console.log('pages', urls.length, 'links', links.size, 'problems', problems.length);
  problems.slice(0, 40).forEach(x => console.log('::warning::' + x.device + ' ' + x.page + ': ' + x.errors.join('; ')));
  await b.close();
  process.exit(problems.length ? 1 : 0);
})();
