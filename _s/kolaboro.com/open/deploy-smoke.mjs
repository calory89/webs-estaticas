// Kolaboro post-deploy smoke checks. Public so anyone can see exactly what "the deploy passed" means.
// Run: node deploy-smoke.mjs [--base https://kolaboro.com] [--expect <commit sha>] [--browser] [--inject-fail]
// Prints one JSON object: { ok, commit, checks: [{ name, ok, ms, detail }] }. Exit code 0 when every check passes, 1 otherwise.
// --inject-fail adds a check that must fail (used by the rollback drill to prove a failure is caught); never used on a real deploy.
// Node 20+. The browser checks need the 'playwright' package with Chromium; without it they are reported as failed, not skipped silently.
import { createHash, createPublicKey, verify } from 'node:crypto';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'https://kolaboro.com').replace(/\/$/, '');
const EXPECT = arg('--expect', '');
const BROWSER = process.argv.includes('--browser'), INJECT = process.argv.includes('--inject-fail');
const UA = { 'user-agent': 'kolaboro-deploy-guard/1.0 (+https://kolaboro.com/trust/)' };
const checks = [];
async function check(name, fn) {
  const t = Date.now(); let ok = false, detail = '';
  try { const r = await fn(); ok = r === true || (r && r.ok === true); detail = typeof r === 'object' && r ? (r.detail || '') : ''; }
  catch (e) { detail = String(e && e.message || e).slice(0, 200); }
  checks.push({ name, ok, ms: Date.now() - t, detail });
}
async function get(path, opt) { const r = await fetch(BASE + path + (path.includes('?') ? '&' : '?') + 'guard=' + Date.now(), Object.assign({ headers: UA, redirect: 'follow' }, opt || {})); return r; }

// 1. the expected code is live
let live = null;
await check('build: live commit', async () => {
  const d = await (await get('/api/open/build')).json(); live = d.commit;
  return { ok: !!d.commit && (!EXPECT || d.commit === EXPECT), detail: 'live ' + String(d.commit).slice(0, 12) + (EXPECT ? ', expected ' + EXPECT.slice(0, 12) : '') };
});

// 2. key pages answer 200 with the site shell
const PAGES = ['/', '/check/', '/database/', '/pricing/', '/p/BALI-021', '/log/', '/verify/', '/status/', '/changelog/', '/docs/api/', '/investors/', '/trust/', '/investors/dossier/'];
for (const p of PAGES) await check('page ' + p, async () => {
  const r = await get(p), t = await r.text();
  return { ok: r.status === 200 && /kolaboro/i.test(t) && t.length > 2000, detail: r.status + ', ' + t.length + ' bytes' };
});

// 3. worker routes answer with the right shape
await check('api /api/open/stats', async () => { const d = await (await get('/api/open/stats')).json(); return { ok: d.projects > 0 && d.markets > 0, detail: d.projects + ' projects' }; });
await check('api /api/open/projects', async () => { const d = await (await get('/api/open/projects?limit=1')).json(); return { ok: Array.isArray(d.projects || d.items || d.data) || d.count > 0 || d.total > 0, detail: Object.keys(d).slice(0, 6).join(',') }; });
await check('api /api/kb/health', async () => { const d = await (await get('/api/kb/health')).json(); return { ok: d.ok === true && d.database === 'up', detail: 'database ' + d.database }; });
await check('api /api/open/checkpoint', async () => { const t = await (await get('/api/open/checkpoint')).text(); return { ok: /^kolaboro\.com\/log\n\d+\n[A-Za-z0-9+/=]{44}\n/.test(t) && t.includes('\n\u2014 kolaboro.com/log '), detail: 'tree size ' + t.split('\n')[1] }; });
await check('api /api/x/l/trust', async () => { const d = await (await get('/api/x/l/trust')).json(); return { ok: Array.isArray(d.controls) && d.controls.length >= 10, detail: d.summary ? JSON.stringify(d.summary) : 'no summary' }; });

// 3b. encryption in transit, measured from outside Cloudflare
await check('tls: plain http redirects to https', async () => {
  const r = await fetch(BASE.replace(/^https:/, 'http:') + '/', { headers: UA, redirect: 'manual' }), loc = r.headers.get('location') || '';
  return { ok: r.status >= 300 && r.status < 400 && /^https:\/\//.test(loc), detail: r.status + ' to ' + loc.slice(0, 60) };
});
await check('tls: HSTS at least 180 days', async () => {
  const r = await get('/'), h = r.headers.get('strict-transport-security') || '', a = +((h.match(/max-age=(\d+)/) || [])[1] || 0);
  return { ok: a >= 15552000, detail: h || 'missing' };
});

// 4. a signed answer verifies against the published key
await check('signature on /api/open/stats', async () => {
  const [r, kr] = await Promise.all([get('/api/open/stats'), get('/.well-known/kolaboro-keys.json')]);
  const body = Buffer.from(await r.arrayBuffer()), sig = r.headers.get('x-kolaboro-signature'), kid = r.headers.get('x-kolaboro-key-id');
  const k = ((await kr.json()).keys || []).find(x => x.kid === kid && x.status !== 'revoked');
  if (!sig || !k) return { ok: false, detail: 'no signature or unknown key ' + kid };
  const msg = Buffer.from('kolaboro-sig-v1\n' + createHash('sha256').update(body).digest('hex'));
  const ok = verify(null, msg, createPublicKey({ key: Buffer.from(k.public_key_spki_b64, 'base64'), format: 'der', type: 'spki' }), Buffer.from(sig, 'base64'));
  return { ok, detail: 'key ' + kid };
});

// 5. no uncaught JavaScript errors in a real browser, desktop and phone width
if (BROWSER) {
  let pw = null; try { pw = await import('playwright'); } catch (e) {}
  if (!pw) checks.push({ name: 'browser', ok: false, ms: 0, detail: 'playwright not installed' });
  else {
    const b = await pw.chromium.launch();
    for (const [w, h] of [[1440, 900], [390, 844]]) for (const p of ['/', '/check/', '/p/BALI-021', '/trust/', '/investors/dossier/']) await check('browser ' + w + 'px ' + p, async () => {
      const pg = await b.newPage({ viewport: { width: w, height: h }, userAgent: UA['user-agent'] + ' Chrome' }), errs = [];
      const host = new URL(BASE).host, other = [];
      // only errors thrown by our own scripts count; a third-party analytics hiccup must not roll back our code
      pg.on('pageerror', e => { const st = String(e.stack || ''); (st.includes(host) || !/https?:\/\//.test(st) ? errs : other).push(String(e.message || e).slice(0, 120)); });
      const r = await pg.goto(BASE + p, { waitUntil: 'load', timeout: 45000 }); await pg.waitForTimeout(2500);
      const over = await pg.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      await pg.close();
      // sideways overflow is reported but does not fail the deploy (a layout flaw is not worth an automatic rollback)
      return { ok: !!r && r.status() === 200 && !errs.length, detail: (r ? r.status() : 'no response') + (errs.length ? ', JS error: ' + errs.join(' | ') : ', no JS errors') + (other.length ? ', third-party error ignored: ' + other.join(' | ') : '') + (over > 1 ? ', warning: overflows by ' + over + 'px' : '') };
    });
    await b.close();
  }
}
if (INJECT) await check('drill: injected failure (must fail)', async () => { const r = await get('/this-page-must-not-exist-' + Date.now()); return { ok: r.status === 200, detail: 'status ' + r.status }; });

const ok = checks.every(c => c.ok);
console.log(JSON.stringify({ ok, base: BASE, commit: live, at: new Date().toISOString(), checks_passed: checks.filter(c => c.ok).length, checks_total: checks.length, failed: checks.filter(c => !c.ok).map(c => c.name), checks }, null, 1));
process.exit(ok ? 0 : 1);
