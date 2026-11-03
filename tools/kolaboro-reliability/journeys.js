// Hourly real-browser user journey on production kolaboro.com:
// home -> search the database -> open a project -> verify that project's signed API answer on /verify -> status page.
// Writes <out>/journeys.json (last 48 runs, newest first) and <out>/shots/<n>.png (one per step, compressed later).
// Usage: node journeys.js <outdir>     env: BASE (default https://kolaboro.com), CHANNEL (chrome | chromium)
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const BASE = process.env.BASE || 'https://kolaboro.com';
const OUT = process.argv[2] || 'out';
const KEEP = 48;

(async () => {
  fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
  let prev = { runs: [] };
  try { const r = await fetch(BASE + '/data/journeys.json?t=' + Date.now(), { headers: { 'user-agent': 'kolaboro-journey/1.0' } }); if (r.ok) prev = await r.json(); } catch (e) {}
  const opts = { headless: true }; if (process.env.CHANNEL !== 'chromium') opts.channel = 'chrome';
  const browser = await chromium.launch(opts);
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, userAgent: (await browser.newPage().then(async p => { const u = await p.evaluate(() => navigator.userAgent); await p.close(); return u; })) + ' kolaboro-journey/1.0' });
  // analytics would count these hourly robot visits as people: block them
  await ctx.route(/googletagmanager|google-analytics|clarity\.ms|cloudflareinsights|doubleclick/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push(String(e.message || e).slice(0, 200)));

  const steps = [];
  let failed = false, projectId = null;
  async function step(n, name, fn) {
    const s = { n, name, ok: false, ms: null, url: null, detail: '', console_errors: 0 };
    if (failed) { s.skipped = true; s.detail = 'not run: an earlier step failed'; steps.push(s); return; }
    const e0 = errors.length, t0 = Date.now();
    try { s.detail = (await fn()) || ''; s.ok = true; }
    catch (e) { s.detail = String(e.message || e).split('\n')[0].slice(0, 240); failed = true; }
    s.ms = Date.now() - t0; s.url = page.url().replace(BASE, '') || '/'; s.console_errors = errors.length - e0;
    if (s.console_errors) s.errors = errors.slice(e0, e0 + 3);
    try { await page.screenshot({ path: path.join(OUT, 'shots', n + '.png') }); s.shot = true; } catch (e) {}
    steps.push(s);
  }

  await step(1, 'Home page', async () => {
    await page.goto(BASE + '/', { waitUntil: 'load', timeout: 30000 });
    await page.waitForSelector('main h1', { timeout: 10000 });
    return (await page.textContent('main h1')).trim().slice(0, 90);
  });
  await step(2, 'Search the database', async () => {
    await page.goto(BASE + '/cases/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('#kq', { timeout: 15000 });
    await page.fill('#kq', 'Bali');
    await page.waitForSelector('a[href*="/p/?id="]', { timeout: 20000 });
    const n = await page.locator('a[href*="/p/?id="]').count();
    return n + ' project links for "Bali"';
  });
  await step(3, 'Open a project', async () => {
    const href = await page.locator('a[href*="/p/?id="]').first().getAttribute('href');
    projectId = decodeURIComponent((href.match(/id=([^&#]+)/) || [])[1] || '');
    await Promise.all([page.waitForURL(/\/p\/\?id=/, { timeout: 20000 }), page.locator('a[href*="/p/?id="]').first().click()]);
    await page.waitForFunction(() => !document.querySelector('.pf-load') && document.querySelector('main h1'), null, { timeout: 25000 });
    return projectId + ': ' + (await page.textContent('main h1')).trim().slice(0, 80);
  });
  await step(4, 'Verify its signed data on /verify', async () => {
    if (!projectId) throw new Error('no project id from step 3');
    await page.goto(BASE + '/verify/#sig', { waitUntil: 'load', timeout: 30000 });
    await page.fill('#sg-u', '/api/open/projects/' + encodeURIComponent(projectId));
    await page.click('#sg-f button[type=submit]');
    await page.waitForFunction(() => /Signed by Kolaboro|does not match|No signature|Could not check/.test((document.getElementById('sg-o') || {}).textContent || ''), null, { timeout: 25000 });
    const t = (await page.textContent('#sg-o')).trim();
    await page.locator('#sg-o').scrollIntoViewIfNeeded().catch(() => {});
    if (!/Signed by Kolaboro, and not changed since/.test(t)) throw new Error('signature check said: ' + t.slice(0, 120));
    return 'Ed25519 signature valid for /api/open/projects/' + projectId;
  });
  await step(5, 'Status page', async () => {
    await page.goto(BASE + '/status/', { waitUntil: 'load', timeout: 30000 });
    await page.waitForFunction(() => document.querySelectorAll('#stt tr').length >= 3, null, { timeout: 20000 });
    const down = await page.$$eval('#stt tr', trs => trs.filter(tr => /Down/.test(tr.children[1] && tr.children[1].textContent || '')).map(tr => tr.children[0].textContent.trim()));
    const n = await page.$$eval('#stt tr', trs => trs.length);
    if (down.length) throw new Error('status page shows down: ' + down.join(', '));
    return n + ' components listed, none down';
  });
  await browser.close();

  const run = { at: new Date().toISOString(), ok: steps.every(s => s.ok), total_ms: steps.reduce((a, s) => a + (s.ms || 0), 0), browser: 'Chrome (GitHub Actions runner, ' + (process.env.RUNNER_OS || 'linux') + ')', steps };
  const runs = [run].concat((prev.runs || []).filter(r => r && r.at)).slice(0, KEEP);
  const ok = runs.filter(r => r.ok).length;
  const med = {}; for (let i = 1; i <= 5; i++) { const v = runs.map(r => (r.steps || []).find(s => s.n === i)).filter(s => s && s.ok).map(s => s.ms).sort((a, b) => a - b); med[i] = v.length ? v[Math.floor(v.length / 2)] : null; }
  const out = { updated: run.at, base: BASE, journey: steps.map(s => s.name), runs_kept: runs.length, runs_passed: ok, median_ms_by_step: med, latest_shots: steps.filter(s => s.shot).map(s => '/data/journeys/' + s.n + '.webp'), runs };
  fs.writeFileSync(path.join(OUT, 'journeys.json'), JSON.stringify(out, null, 1));
  console.log(JSON.stringify(run, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
