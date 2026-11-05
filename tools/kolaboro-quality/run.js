// Daily quality run on production kolaboro.com (block W6, 5 Nov 2026): visual regression and page weight.
// For each of the 20 key pages (tools/kolaboro-lighthouse/pages.json) at 390 px (phone) and 1440 px (desktop):
//   1. load the page in Chromium and record every response's transferred bytes (Chrome DevTools Protocol, encodedDataLength),
//      grouped into html, css, js, images, fonts, other first-party, and third party;
//   2. screenshot the top of the page (390 x up to 2400 px, 1440 x up to 1800 px), compare it pixel by pixel (pixelmatch)
//      with the screenshot of the previous run, and keep a small side-by-side webp (before | after | diff) for changed pages.
// Writes <out>/visual-tests.json, <out>/page-weight.json, <out>/resources.json (for sbom.js), <out>/img/*.webp, <out>/shots/*.png.
// Usage: node run.js <outdir>    env: BASE, BASELINE (dir with the previous run's shots), PAGES (json file), BUDGETS (json file), LIMIT
const { chromium } = require('playwright');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'https://kolaboro.com';
const OUT = process.argv[2] || 'out';
const BASELINE = process.env.BASELINE || '';
const HERE = __dirname;
let PAGES = JSON.parse(fs.readFileSync(process.env.PAGES || path.join(HERE, '..', 'kolaboro-lighthouse', 'pages.json'), 'utf8'));
if (process.env.LIMIT) PAGES = PAGES.slice(0, +process.env.LIMIT);
const BUDGETS = JSON.parse(fs.readFileSync(process.env.BUDGETS || path.join(HERE, 'budgets.json'), 'utf8'));
const VIEWS = [
  { w: 390, h: 844, cap: 2400, mobile: true, name: 'phone' },
  { w: 1440, h: 900, cap: 1800, mobile: false, name: 'desktop' },
];
const CHANGED_AT = 0.003;   // more than 0.3% of pixels different (pixelmatch threshold 0.1) counts as "changed"
const MAX_IMAGES = 6;       // side-by-side images per run, embedded in quality.json as data URIs (no image files on the site: Pages file limit)
const OWN = h => h === 'kolaboro.com' || h.endsWith('.kolaboro.com');
const slug = p => (p.replace(/^\/|\/$/g, '').replace(/[^a-zA-Z0-9]+/g, '-') || 'home').toLowerCase();
const pageType = p => {
  for (const t of BUDGETS.types) if (t.match.some(m => (m.endsWith('*') ? p.startsWith(m.slice(0, -1)) : p === m))) return t.id;
  return BUDGETS.default_type;
};
const typeOf = (cdpType, url) => {
  let host = '', pth = ''; try { const x = new URL(url); host = x.hostname; pth = x.pathname; } catch (e) {}
  if (url.startsWith('data:') || url.startsWith('blob:')) return null;
  if (!OWN(host) || pth.startsWith('/cdn-cgi/')) return 'third_party';   // /cdn-cgi/ is code Cloudflare injects (Zaraz, insights)
  return { Document: 'html', Stylesheet: 'css', Script: 'js', Image: 'images', Font: 'fonts', Media: 'images' }[cdpType] || 'other';
};
const CATS = ['html', 'css', 'js', 'images', 'fonts', 'other', 'third_party'];

(async () => {
  fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'img'), { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [], resources = {}, t0 = Date.now();
  for (const p of PAGES) {
    for (const v of VIEWS) {
      const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1, isMobile: v.mobile, hasTouch: v.mobile, reducedMotion: 'reduce', locale: 'en-US', timezoneId: 'UTC', serviceWorkers: 'block' });
      const page = await ctx.newPage();
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      const req = new Map();
      cdp.on('Network.responseReceived', e => { const r = req.get(e.requestId) || {}; Object.assign(r, { url: e.response.url, type: e.type, status: e.response.status, mime: e.response.mimeType }); req.set(e.requestId, r); });
      cdp.on('Network.loadingFinished', e => { const r = req.get(e.requestId); if (r) r.bytes = e.encodedDataLength; });
      cdp.on('Network.loadingFailed', e => { const r = req.get(e.requestId); if (r) r.failed = true; });
      const rec = { page: p, slug: slug(p), view: v.name, width: v.w, type: pageType(p), status: 0, error: null };
      try {
        let resp = null;
        for (let k = 0; k < 3; k++) {
          try { resp = await page.goto(BASE + p, { waitUntil: 'load', timeout: 45000 }); if (resp && resp.status() < 500) break; } catch (e) { if (k === 2) throw e; }
          await page.waitForTimeout(3000 * (k + 1));
        }
        rec.status = resp ? resp.status() : 0;
        await page.waitForLoadState('networkidle', { timeout: 9000 }).catch(() => {});
        await page.waitForTimeout(2500);   // the analytics tag is added 1.5 s after load: count it like a visitor's browser would
        // weight
        const by = Object.fromEntries(CATS.map(c => [c, 0])), hosts = {}; let n = 0;
        for (const r of req.values()) {
          if (!r.url || r.bytes == null) continue;
          const c = typeOf(r.type, r.url); if (!c) continue;
          by[c] += r.bytes; n++;
          if (c === 'third_party') { const x = new URL(r.url), h = x.hostname + (x.pathname.startsWith('/cdn-cgi/') ? '/cdn-cgi' : ''); hosts[h] = (hosts[h] || 0) + r.bytes; }
          if (['Script', 'Stylesheet', 'Font'].includes(r.type) || /javascript|css|font/.test(r.mime || '')) {
            const key = r.url; const x = resources[key] || (resources[key] = { url: r.url, type: r.type, mime: r.mime, status: r.status, pages: [] });
            if (!x.pages.includes(p)) x.pages.push(p);
          }
        }
        // integrity attributes as the browser sees them (also covers tags that scripts inject at runtime)
        const tags = await page.evaluate(() => [...document.querySelectorAll('script[src],link[href][rel~="stylesheet"],link[href][rel="preload"],link[href][rel="modulepreload"]')].map(e => ({ url: e.src || e.href, integrity: e.getAttribute('integrity') || null, crossorigin: e.getAttribute('crossorigin') }))).catch(() => []);
        for (const t of tags) { const x = resources[t.url] || (resources[t.url] = { url: t.url, type: null, mime: null, status: null, pages: [] }); x.integrity = x.integrity || t.integrity; x.tag_seen = true; if (!x.pages.includes(p)) x.pages.push(p); }
        rec.weight = { total: CATS.reduce((s, c) => s + by[c], 0), requests: n, by_type: by, third_party_hosts: hosts };
        // screenshot: freeze motion, hide the cookie banner, mask the moving "shipping daily" ticker
        await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}#cc,.cc,.totop{display:none!important}' }).catch(() => {});
        await page.evaluate(() => window.scrollTo(0, 0));
        const docH = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0));
        const h = Math.max(v.h, Math.min(docH, v.cap));
        const file = path.join(OUT, 'shots', rec.slug + '-' + v.w + '.png');
        await page.screenshot({ path: file, fullPage: true, clip: { x: 0, y: 0, width: v.w, height: h }, mask: [page.locator('.ship-v')], maskColor: '#C9CED3', animations: 'disabled' });
        rec.shot = { height: h };
        rec.visual = await compare(rec, file, v);
      } catch (e) { rec.error = String(e.message || e).split('\n')[0].slice(0, 200); }
      results.push(rec);
      process.stdout.write(`${p} ${v.w} ${rec.error ? 'ERROR ' + rec.error : (rec.weight.total / 1024).toFixed(0) + ' KB ' + rec.visual.status + (rec.visual.diff_pct != null ? ' ' + rec.visual.diff_pct + '%' : '')}\n`);
      await ctx.close();
    }
  }
  await browser.close();

  // side-by-side images for the changed pages, largest change first, up to MAX_IMAGES
  const changed = results.filter(r => r.visual && r.visual.status === 'changed').sort((a, b) => b.visual.diff_pct - a.visual.diff_pct);
  for (const r of changed.slice(0, MAX_IMAGES)) {
    try { r.visual.image = await sideBySide(r); } catch (e) { r.visual.image = null; r.visual.image_error = String(e.message || e).slice(0, 120); }
  }
  const now = new Date().toISOString();
  const vis = {
    updated: now, base: BASE, seconds: Math.round((Date.now() - t0) / 1000),
    method: 'Chromium (Playwright) at 390 x 844 (phone, touch) and 1440 x 900 (desktop), device pixel ratio 1, reduced motion, UTC. The top of each page is captured (up to 2400 px tall on a phone, 1800 px on desktop) with the moving "shipping daily" ticker masked and the cookie banner hidden, then compared pixel by pixel with the previous run using pixelmatch (colour threshold 0.1). A page counts as changed when more than ' + (CHANGED_AT * 100) + '% of its pixels differ or its captured height changed. Live numbers on a page (counts, dates) can cause small changes that are not bugs.',
    changed_threshold_pct: CHANGED_AT * 100,
    summary: {
      checks: results.length,
      pass: results.filter(r => r.visual && r.visual.status === 'pass').length,
      changed: changed.length,
      new_baseline: results.filter(r => r.visual && r.visual.status === 'baseline').length,
      errors: results.filter(r => r.error).length,
      images_published: changed.filter(r => r.visual.image).length,
    },
    results: results.map(r => ({ page: r.page, view: r.view, width: r.width, status: r.error ? 'error' : r.visual.status, diff_pct: r.visual ? r.visual.diff_pct : null, diff_pixels: r.visual ? r.visual.diff_pixels : null, height: r.shot ? r.shot.height : null, prev_height: r.visual ? r.visual.prev_height : null, image: r.visual ? r.visual.image || null : null, image_data: r.visual ? r.visual.image_data || null : null, error: r.error })),
  };
  // page weight with budgets
  const breaches = [];
  const pw = results.filter(r => r.weight).map(r => {
    const b = (BUDGETS.budgets[r.type] || {})[r.view] || null, over = [];
    if (b) for (const k of Object.keys(b)) {
      const val = k === 'total' ? r.weight.total : k === 'requests' ? r.weight.requests : r.weight.by_type[k];
      if (val != null && val > b[k]) over.push({ metric: k, value: val, budget: b[k] });
    }
    if (over.length) breaches.push({ page: r.page, view: r.view, over });
    return { page: r.page, view: r.view, width: r.width, type: r.type, status: r.status, total: r.weight.total, requests: r.weight.requests, by_type: r.weight.by_type, third_party_hosts: r.weight.third_party_hosts, budget: b, over };
  });
  const pwOut = {
    updated: now, base: BASE,
    method: 'Bytes transferred over the network (compressed size plus headers, Chrome DevTools Protocol encodedDataLength) for one cold load with the browser cache disabled, waiting for network idle plus 2.5 s so late tags such as analytics are counted. First-party bytes (kolaboro.com) are split by resource type; everything from another host, and code Cloudflare injects under /cdn-cgi/, is counted as third party. Measured from a GitHub Actions runner in the United States.',
    budgets: BUDGETS, ok: breaches.length === 0, breaches, pages: pw,
    errors: results.filter(r => r.error).map(r => ({ page: r.page, view: r.view, error: r.error })),
  };
  fs.writeFileSync(path.join(OUT, 'visual-tests.json'), JSON.stringify(vis, null, 1));
  fs.writeFileSync(path.join(OUT, 'page-weight.json'), JSON.stringify(pwOut, null, 1));
  // one published file for both (the shared Pages project is at its file limit)
  fs.writeFileSync(path.join(OUT, 'quality.json'), JSON.stringify({ visual: vis, weight: pwOut }));
  fs.writeFileSync(path.join(OUT, 'resources.json'), JSON.stringify(Object.values(resources), null, 1));
  fs.writeFileSync(path.join(OUT, 'flags.txt'), String(breaches.length));
  console.log(JSON.stringify({ visual: vis.summary, weight_breaches: breaches.length }));
})().catch(e => { console.error(e); process.exit(1); });

async function compare(rec, file, v) {
  const prev = BASELINE ? path.join(BASELINE, path.basename(file)) : '';
  if (!prev || !fs.existsSync(prev)) return { status: 'baseline', diff_pct: null, diff_pixels: null, prev_height: null };
  const a = PNG.sync.read(fs.readFileSync(prev)), b = PNG.sync.read(fs.readFileSync(file));
  const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height);
  const crop = (img) => { if (img.width === w && img.height === h) return img.data; const o = Buffer.alloc(w * h * 4); for (let y = 0; y < h; y++) img.data.copy(o, y * w * 4, y * img.width * 4, y * img.width * 4 + w * 4); return o; };
  const diff = new PNG({ width: w, height: h });
  const px = pixelmatch(crop(a), crop(b), diff.data, w, h, { threshold: 0.1, includeAA: false, alpha: 0.2 });
  const total = Math.max(a.width * a.height, b.width * b.height);
  const extra = total - w * h;   // height change: the uncovered area counts as different
  const diffPx = px + extra;
  fs.writeFileSync(file.replace(/\.png$/, '.diff.png'), PNG.sync.write(diff));
  const pct = Math.round((diffPx / total) * 1e5) / 1e3;
  return { status: (diffPx / total > CHANGED_AT || a.height !== b.height) ? 'changed' : 'pass', diff_pct: pct, diff_pixels: diffPx, prev_height: a.height };
}

async function sideBySide(r) {
  const file = path.join(OUT, 'shots', r.slug + '-' + r.width + '.png');
  const prev = path.join(BASELINE, path.basename(file)), diff = file.replace(/\.png$/, '.diff.png');
  const panelW = r.width === 390 ? 200 : 360, gap = 6;
  const panel = async f => sharp(f).resize({ width: panelW }).png().toBuffer({ resolveWithObject: true });
  const ps = [await panel(prev), await panel(file), await panel(diff)];
  const H = Math.max(...ps.map(x => x.info.height));
  const name = r.slug + '-' + r.width + '.webp';
  await sharp({ create: { width: panelW * 3 + gap * 2, height: H, channels: 3, background: '#FFFFFF' } })
    .composite(ps.map((x, i) => ({ input: x.data, left: i * (panelW + gap), top: 0 })))
    .webp({ quality: 45 }).toFile(path.join(OUT, 'img', name));
  r.visual.image_data = 'data:image/webp;base64,' + fs.readFileSync(path.join(OUT, 'img', name)).toString('base64');
  return name;
}
