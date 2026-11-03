// Nightly accessibility audit of production kolaboro.com: axe-core (WCAG 2.0/2.1/2.2 A and AA rules) on every page listed in
// sitemap.xml, at desktop width. Writes <out>/a11y.json: violations by rule and by page, plus a 30-run history of totals.
// Usage: node a11y.js <outdir>     env: BASE (default https://kolaboro.com), CHANNEL (chrome | chromium), LIMIT (pages, for tests)
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const BASE = process.env.BASE || 'https://kolaboro.com';
const OUT = process.argv[2] || 'out';
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const AXE_VERSION = require('axe-core/package.json').version;
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const RANK = { critical: 4, serious: 3, moderate: 2, minor: 1 };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const sm = await (await fetch(BASE + '/sitemap.xml', { headers: { 'user-agent': 'kolaboro-a11y/1.0' } })).text();
  let urls = [...new Set([...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim()).filter(u => u.startsWith(BASE)))];
  if (process.env.LIMIT) urls = urls.slice(0, +process.env.LIMIT);
  let prev = {}; try { const r = await fetch(BASE + '/data/a11y.json?t=' + Date.now()); if (r.ok) prev = await r.json(); } catch (e) {}
  const opts = { headless: true }; if (process.env.CHANNEL !== 'chromium') opts.channel = 'chrome';
  const browser = await chromium.launch(opts);
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  await ctx.route(/googletagmanager|google-analytics|clarity\.ms|cloudflareinsights|doubleclick/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  const pages = [], t0 = Date.now();
  for (const url of urls) {
    const page = await ctx.newPage();
    const rec = { url: url.replace(BASE, '') || '/', violations: [], error: null };
    try {
      let resp = null;
      for (let k = 0; k < 3; k++) {   // a transient edge error on one request is not an accessibility result: retry twice
        try { resp = await page.goto(url, { waitUntil: 'load', timeout: 45000 }); if (resp && resp.status() < 500) break; } catch (e) { if (k === 2) throw e; }
        await page.waitForTimeout(4000 * (k + 1));
      }
      rec.status = resp ? resp.status() : 0;
      await page.waitForTimeout(1500);   // let live data render: axe should see what visitors see
      await page.addScriptTag({ content: AXE });
      const v = await page.evaluate(async (tags) => {
        const r = await window.axe.run(document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] });
        return r.violations.map(x => ({ id: x.id, impact: x.impact, help: x.help, helpUrl: x.helpUrl, nodes: x.nodes.length, targets: x.nodes.slice(0, 3).map(n => String(n.target.join(' ')).slice(0, 140)) }));
      }, TAGS);
      rec.violations = v.sort((a, b) => (RANK[b.impact] || 0) - (RANK[a.impact] || 0));
    } catch (e) { rec.error = String(e.message || e).split('\n')[0].slice(0, 200); }
    pages.push(rec);
    await page.close();
    process.stdout.write(rec.url + ' ' + (rec.error ? 'ERROR ' + rec.error : rec.violations.map(x => x.id + ':' + x.impact).join(',') || 'clean') + '\n');
  }
  await browser.close();
  const rules = {}, by = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  pages.forEach(p => p.violations.forEach(v => {
    const r = rules[v.id] || (rules[v.id] = { id: v.id, impact: v.impact, help: v.help, helpUrl: v.helpUrl, pages: 0, nodes: 0, examples: [] });
    r.pages++; r.nodes += v.nodes; if (r.examples.length < 5) r.examples.push(p.url);
    by[v.impact] = (by[v.impact] || 0) + v.nodes;
  }));
  const ruleList = Object.values(rules).sort((a, b) => (RANK[b.impact] || 0) - (RANK[a.impact] || 0) || b.pages - a.pages);
  const pagesSerious = pages.filter(p => p.violations.some(v => v.impact === 'serious' || v.impact === 'critical')).length;
  const run = { at: new Date().toISOString(), pages: pages.length, errors: pages.filter(p => p.error).length, nodes_by_impact: by, pages_clean: pages.filter(p => !p.error && !p.violations.length).length, pages_with_serious_or_critical: pagesSerious };
  const out = {
    updated: run.at, base: BASE, tool: 'axe-core ' + AXE_VERSION + ' in Chrome, rules tagged ' + TAGS.join(', '), viewport: '1280x900', seconds: Math.round((Date.now() - t0) / 1000),
    goal: '0 serious or critical', ok: by.critical === 0 && by.serious === 0 && run.errors === 0,
    summary: run, rules: ruleList,
    pages: pages.map(p => ({ url: p.url, status: p.status, error: p.error, violations: p.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes, targets: v.targets })) })),
    history: [run].concat((prev.history || []).filter(h => h && h.at)).slice(0, 30),
  };
  fs.writeFileSync(path.join(OUT, 'a11y.json'), JSON.stringify(out, null, 1));
  console.log(JSON.stringify(run));
})().catch(e => { console.error(e); process.exit(1); });
