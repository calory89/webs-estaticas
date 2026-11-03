// Feature module l for kolaboro.com (see kbx.js): trust center evidence, investor dossier metrics, safe-deploy record.
// Every value below is read from a live endpoint or a published file at request time; nothing is typed in by hand.
// GET /api/x/l/trust    controls mapped to SOC 2 criteria (not audited), each with live status, evidence time and raw evidence links
// GET /api/x/l/dossier  investor metrics computed from existing open data, each with its source and timestamp
import { rpc, sha, signBody, openLoad, logHeads } from './kolaboro.js';

export const PATHS = /^\/api\/x\/l\//;
const ORIGIN = 'https://kolaboro.com';
const H = 3600e3;

function out(o, maxAge, status) {
  return new Response(JSON.stringify(o, null, 1), { status: status || 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=' + (maxAge || 60), 'access-control-allow-origin': '*', 'access-control-expose-headers': 'x-kolaboro-signature, x-kolaboro-key-id' } });
}
async function signed(env, o, maxAge) {
  const body = JSON.stringify(o, null, 1), h = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=' + maxAge, 'access-control-allow-origin': '*', 'access-control-expose-headers': 'x-kolaboro-signature, x-kolaboro-key-id' };
  try { const sg = await signBody(env, body); if (sg) { h['x-kolaboro-signature'] = sg; h['x-kolaboro-key-id'] = (env && env.KB_SIGN_KID) || 'kb'; } } catch (e) {}
  return new Response(body, { headers: h });
}
async function asset(env, path) {   // a published file, read from the deployed assets (no network)
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com' + path)); if (!r.ok) return null; return await r.text(); } catch (e) { return null; }
}
async function assetJson(env, path) { const t = await asset(env, path); if (t == null) return null; try { return JSON.parse(t); } catch (e) { return null; } }
async function self(path, init) {   // a live request to the public site, the same one any visitor can make
  try { return await fetch(ORIGIN + path, Object.assign({ headers: { 'user-agent': 'kolaboro-trust-evidence/1.0' } }, init || {})); } catch (e) { return null; }
}
async function tryRpc(fn) { try { const d = await rpc(fn, {}); return d && !d.error ? d : null; } catch (e) { return null; } }
const iso = t => (t == null || isNaN(+new Date(t))) ? null : new Date(t).toISOString();
const ageH = t => t ? (Date.now() - +new Date(t)) / H : null;
const b64d = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function cached(key, ttl, fn) {
  const ck = new Request(ORIGIN + '/__kbx_l/' + key);
  try { const hit = await caches.default.match(ck); if (hit) return await hit.json(); } catch (e) {}
  const v = await fn();
  try { await caches.default.put(ck, new Response(JSON.stringify(v), { headers: { 'content-type': 'application/json', 'cache-control': 'max-age=' + ttl } })); } catch (e) {}
  return v;
}

// Ed25519 check of an open API answer against the published public key: the same check /verify runs in the browser
async function verifyOpenAnswer(path) {
  const [r, kr] = await Promise.all([self(path), self('/.well-known/kolaboro-keys.json')]);
  if (!r || !r.ok || !kr || !kr.ok) return { ok: false, why: 'could not fetch the answer or the key list' };
  const body = await r.text(), sig = r.headers.get('x-kolaboro-signature'), kid = r.headers.get('x-kolaboro-key-id');
  if (!sig) return { ok: false, why: 'answer carries no signature' };
  let keys; try { keys = (await kr.json()).keys || []; } catch (e) { return { ok: false, why: 'key list unreadable' }; }
  const k = keys.find(x => x.kid === kid);
  if (!k) return { ok: false, why: 'key id ' + kid + ' not in the published key list' };
  if (k.status === 'revoked') return { ok: false, why: 'key is revoked' };
  const msg = new TextEncoder().encode('kolaboro-sig-v1\n' + await sha(body));
  for (const alg of [{ name: 'Ed25519' }, { name: 'NODE-ED25519', namedCurve: 'NODE-ED25519' }]) {
    try { const pk = await crypto.subtle.importKey('spki', b64d(k.public_key_spki_b64), alg, false, ['verify']); return { ok: await crypto.subtle.verify(alg, pk, b64d(sig), msg), kid, bytes: body.length }; } catch (e) {}
  }
  return { ok: false, why: 'Ed25519 not available in this runtime' };
}

// external <script src> on key pages: which carry Subresource Integrity
const SRI_PAGES = ['/', '/check/', '/database/', '/verify/', '/log/', '/live/', '/trust/', '/investors/dossier/'];
const SRI_EXEMPT = /^https:\/\/(www\.googletagmanager\.com|www\.clarity\.ms|static\.cloudflareinsights\.com|www\.paypal\.com)\//;   // loaders whose code changes by design: SRI cannot be pinned
async function sriScan(env) {
  const scripts = [];
  for (const p of SRI_PAGES) {
    const html = await asset(env, p.replace(/\/$/, '/index.html'));
    if (!html) continue;
    for (const m of html.matchAll(/<script\b[^>]*\bsrc="(https?:\/\/[^"]+)"[^>]*>/g)) scripts.push({ page: p, src: m[1], integrity: /\bintegrity="sha(256|384|512)-/.test(m[0]), exempt: SRI_EXEMPT.test(m[1]) });
    for (const m of html.matchAll(/https:\/\/(?:www\.googletagmanager\.com\/gtag\/js|www\.clarity\.ms\/tag\/)/g)) if (!scripts.some(x => x.page === p && x.src.startsWith(m[0]))) scripts.push({ page: p, src: m[0], integrity: false, exempt: true, injected: true });
  }
  const pinned = scripts.filter(s => !s.exempt), missing = pinned.filter(s => !s.integrity);
  return { pages: SRI_PAGES.length, external_scripts: scripts.length, need_sri: pinned.length, with_sri: pinned.length - missing.length, missing: missing.map(s => s.page + ' ' + s.src).slice(0, 20), exempt: [...new Set(scripts.filter(s => s.exempt).map(s => new URL(s.src).host))] };
}

function control(c) {   // status from the evidence and its age
  let status = c.status;
  if (status === 'pass' || status === 'warn') { const a = ageH(c.evidence_at); if (a == null) status = 'unknown'; else if (a > c.max_age_h) status = 'stale'; }
  return Object.assign({}, c, { status, evidence_age_h: c.evidence_at ? Math.round(ageH(c.evidence_at) * 10) / 10 : null });
}

async function trust(env) {
  const now = new Date().toISOString();
  const [restore, scan, verifiers, deploys, uptime, evals, honey, heads, cpR, sec, admin, httpR, homeR, sigOk, sri, L, buildR] = await Promise.all([
    assetJson(env, '/data/restore.json'), assetJson(env, '/data/security-scan.json'), assetJson(env, '/data/verifiers.json'), assetJson(env, '/data/deploys.json'),
    tryRpc('kolaboro_uptime_public'), tryRpc('kolaboro_evals_public'), tryRpc('kolaboro_honey_public'), logHeads().catch(() => null),
    self('/api/open/checkpoint'), self('/.well-known/security.txt'), self('/admin/', { redirect: 'manual' }), null,
    null, verifyOpenAnswer('/api/open/stats'), sriScan(env), openLoad().catch(() => null), Promise.resolve(env && env.CF_PAGES_COMMIT_SHA)
  ]);
  const C = [];

  // 1. Backups and restore drill
  if (restore) C.push(control({ id: 'backup-restore', name: 'Backups and restore drill', tsc: ['A1.2', 'A1.3'], max_age_h: 8 * 24 + 6,
    status: restore.ok && restore.evidence_ok && restore.backup_age_days <= 2 ? 'pass' : 'fail', evidence_at: restore.drill_at || restore.date,
    detail: 'Weekly drill restored backup ' + restore.backup_file + ' (' + (restore.backup_age_days) + ' day old) into a clean PostgreSQL ' + String(restore.postgres || '').split(' ')[0] + ': ' + (restore.tables || []).length + ' tables, ' + restore.rows_total + ' rows, ' + restore.evidence_files_checked + ' evidence files re-hashed, ' + restore.evidence_bad_hash + ' mismatches, in ' + restore.duration_s + ' s.',
    how: 'GitHub Actions every Monday downloads the latest encrypted backup, restores it into an empty database and checks every table and evidence file hash.', evidence: ['/data/restore.json'] }));
  else C.push(control({ id: 'backup-restore', name: 'Backups and restore drill', tsc: ['A1.2', 'A1.3'], max_age_h: 200, status: 'unknown', evidence_at: null, detail: 'Restore drill result not readable right now.', evidence: ['/data/restore.json'] }));

  // 2. Uptime monitoring
  { const d = uptime && (uptime.daily || []).slice().sort((a, b) => a.day < b.day ? 1 : -1)[0];
    C.push(control({ id: 'uptime', name: 'Uptime monitoring from outside Cloudflare', tsc: ['A1.1', 'CC7.2'], max_age_h: 30,
      status: !uptime ? 'unknown' : uptime.uptime_7d >= 99.5 ? 'pass' : uptime.uptime_7d >= 98 ? 'warn' : 'fail', evidence_at: d ? d.day + 'T00:00:00Z' : null,
      detail: uptime ? uptime.uptime_7d + '% up over 7 days (' + (uptime.by_vantage ? Object.entries(uptime.by_vantage).map(([k, v]) => v.probes_7d + ' probes from ' + k).join(', ') : '') + '), p95 ' + uptime.p95_ms_7d + ' ms, ' + (uptime.incidents || []).length + ' incidents. Measured since ' + String(uptime.since).slice(0, 10) + '.' : 'Uptime record not readable right now.',
      how: 'Probes every 5 minutes from our database server and every hour from GitHub runners (OIDC-authenticated). Evidence time has day resolution.', evidence: ['/api/open/uptime', '/status'] })); }

  // 3. Encryption in transit: measured from outside Cloudflare by the deploy guard (a request from inside the edge skips the edge's own HTTPS redirect)
  { const lc = deploys && deploys.latest_checks, t = lc ? (lc.checks || []).filter(c => /^tls:/.test(c.name)) : [];
    C.push(control({ id: 'tls', name: 'Encryption in transit', tsc: ['CC6.7'], max_age_h: 7 * 24,
      status: !t.length ? 'unknown' : t.every(c => c.ok) ? 'pass' : 'warn', evidence_at: t.length ? lc.at : null,
      detail: t.length ? t.map(c => c.name.replace(/^tls: /, '') + ': ' + (c.ok ? 'yes' : 'NO') + ' (' + c.detail + ')').join('. ') + '.' : 'Measured from outside by the deploy guard; no measurement recorded yet.',
      how: 'Checked from a GitHub runner, outside Cloudflare, each time the deploy guard runs: a plain HTTP request must be redirected to HTTPS and the HSTS header must last at least 180 days.', evidence: ['/data/deploys.json', 'https://www.ssllabs.com/ssltest/analyze.html?d=kolaboro.com'] })); }

  // 4. Signed data
  { const v3 = verifiers && verifiers.ok && verifiers.three_languages_agree;
    C.push(control({ id: 'signed-data', name: 'Signed open data', tsc: ['PI1.5', 'CC7.1'], max_age_h: 36,
      status: sigOk.ok && v3 ? 'pass' : sigOk.ok || v3 ? 'warn' : 'fail', evidence_at: verifiers ? verifiers.date : now,
      detail: 'Just now: the Ed25519 signature on /api/open/stats ' + (sigOk.ok ? 'verified with key ' + sigOk.kid : 'did NOT verify (' + (sigOk.why || 'bad signature') + ')') + '. Daily: three independent verifiers (JavaScript, Python, Go) ' + (verifiers ? (verifiers.all_checks_pass ? 'passed every check' : 'reported a failed check') + ' and ' + (verifiers.three_languages_agree ? 'agree' : 'disagree') : 'result not readable') + '.',
      how: 'Every /api/open answer is signed; keys at /.well-known/kolaboro-keys.json. The verifiers are downloaded from the site and run in GitHub Actions.', evidence: ['/data/verifiers.json', '/.well-known/kolaboro-keys.json', '/verify'] })); }

  // 5. Public log
  { const last = heads && heads[heads.length - 1], cpText = cpR && cpR.ok ? await cpR.text() : '';
    const size = +(cpText.split('\n')[1] || 0), witnessed = heads ? heads.filter(h => h.rekor_uuid).length : 0;
    const t = last ? (last.rekor_time ? last.rekor_time * 1000 : last.day + 'T00:00:00Z') : null;
    C.push(control({ id: 'public-log', name: 'Append-only public log', tsc: ['PI1.5', 'CC7.2'], max_age_h: 40,
      status: !heads ? 'unknown' : (last && last.rekor_uuid && size === heads.length && last.audit_intact !== false) ? 'pass' : 'warn', evidence_at: iso(t),
      detail: heads ? heads.length + ' daily heads, ' + witnessed + ' recorded in Sigstore Rekor; signed checkpoint tree size ' + (size || 'unreadable') + (size === heads.length ? ' (matches)' : ' (does not match the head count)') + '. Latest head ' + last.day + ', ' + last.projects_count + ' projects fingerprinted.' : 'Log not readable right now.',
      how: 'Merkle tree of daily heads, C2SP signed checkpoint, inclusion and consistency proofs, Bitcoin timestamps and a copy in Rekor.', evidence: ['/api/open/log', '/api/open/checkpoint', '/log/'] })); }

  // 6. AI evaluation
  { const l = evals && evals.latest;
    C.push(control({ id: 'ai-eval', name: 'AI evaluation on fixed test pages', tsc: ['PI1.3', 'CC8.1'], max_age_h: 36,
      status: !l ? 'unknown' : l.cases_passed === l.cases_total ? 'pass' : 'fail', evidence_at: l ? l.run_at : null,
      detail: l ? l.cases_passed + ' of ' + l.cases_total + ' cases and ' + l.checks_passed + ' of ' + l.checks_total + ' checks passed' + (l.by_kind && l.by_kind.injection ? ', including ' + l.by_kind.injection.passed + ' of ' + l.by_kind.injection.total + ' manipulation attempts' : '') + (l.consensus ? '. Second model agreed on ' + l.consensus.fields_agreed + ' of ' + l.consensus.fields_compared + ' fields' : '') + '. Run took ' + l.seconds + ' s.' : 'Evaluation record not readable right now.',
      how: 'The production desk review reads the same fictional pages daily and after every code change; answers are checked against fixed expectations.', evidence: ['/api/open/evals', '/engineering/evals'] })); }

  // 7. Security scanning
  if (scan) { const r = scan.by_risk || {};
    C.push(control({ id: 'security-scan', name: 'Weekly security scan', tsc: ['CC7.1'], max_age_h: 8 * 24 + 6,
      status: r.high > 0 ? 'fail' : r.medium > 0 ? 'warn' : 'pass', evidence_at: scan.date,
      detail: scan.tool + ', ZAP ' + scan.zap_version + ': ' + (r.high || 0) + ' high, ' + (r.medium || 0) + ' medium, ' + (r.low || 0) + ' low, ' + (r.informational || 0) + ' informational findings. Medium findings are listed in the raw file, unhidden.',
      how: 'GitHub Actions runs the OWASP ZAP baseline scan against the live site every Tuesday.', evidence: ['/data/security-scan.json', '/api/open/security'] })); }
  else C.push(control({ id: 'security-scan', name: 'Weekly security scan', tsc: ['CC7.1'], max_age_h: 200, status: 'unknown', evidence_at: null, detail: 'Scan result not readable right now.', evidence: ['/data/security-scan.json'] }));

  // 8. Decoy credentials
  { const touched = honey ? (honey.touched || []) : [], hits = touched.reduce((a, x) => a + (x.hits || 0), 0), lastHit = touched.map(x => x.last_hit).sort().pop();
    C.push(control({ id: 'decoys', name: 'Decoy credentials and paths', tsc: ['CC7.2', 'CC7.3'], max_age_h: 1,
      status: honey && honey.decoys > 0 ? 'pass' : 'unknown', evidence_at: honey ? now : null,
      detail: honey ? honey.decoys + ' decoys armed. Touched: ' + (touched.length ? touched.map(x => x.kind.replace(/_/g, ' ') + ' ' + x.hits + ' times').join(', ') + ' (last ' + String(lastHit).slice(0, 16).replace('T', ' ') + ' UTC). A touch is an alarm we can see, not a breach: decoys grant nothing.' : 'none so far.') : 'Decoy status not readable right now.',
      how: 'Fake keys and paths that no legitimate user ever sees; any use is recorded. Status read live from the database on this request.', evidence: ['/api/open/security'] })); }

  // 9. Admin access control
  { const h = admin ? admin.headers : null, rob = h && /noindex/.test(h.get('x-robots-tag') || ''), nst = h && /no-store/.test(h.get('cache-control') || ''), frm = h && (/deny/i.test(h.get('x-frame-options') || '') || /frame-ancestors 'none'/.test(h.get('content-security-policy') || ''));
    C.push(control({ id: 'admin-access', name: 'Admin access control', tsc: ['CC6.1', 'CC6.2'], max_age_h: 1,
      status: !h ? 'unknown' : rob && nst && frm ? 'pass' : 'warn', evidence_at: h ? now : null,
      detail: h ? 'Admin page served with ' + [rob ? 'noindex' : 'NO noindex', nst ? 'no-store (never cached)' : 'cacheable (bad)', frm ? 'framing blocked' : 'framing allowed (bad)'].join(', ') + '. The page itself holds no data: every admin action is checked by the database. Not checked from outside: who holds the admin key.' : 'Admin headers not readable right now.',
      how: 'Response headers of /admin/ checked on this request. What we cannot show publicly is listed honestly as not checked.', evidence: ['/security'] })); }

  // 10. security.txt
  { const t = sec && sec.ok ? await sec.text() : '', exp = (t.match(/^Expires:\s*(.+)$/m) || [])[1], contact = /^Contact:\s*\S+/m.test(t), days = exp ? Math.floor((+new Date(exp) - Date.now()) / 864e5) : null;
    C.push(control({ id: 'security-txt', name: 'Security contact (RFC 9116)', tsc: ['CC2.3'], max_age_h: 1,
      status: !t ? 'fail' : contact && days > 30 ? 'pass' : 'warn', evidence_at: t ? now : null,
      detail: t ? 'security.txt published with ' + (contact ? 'a contact' : 'NO contact') + ', expires in ' + days + ' days' + (/^Policy:/m.test(t) ? ', with a disclosure policy' : '') + '.' : 'security.txt missing.',
      how: 'Fetched and parsed on this request.', evidence: ['/.well-known/security.txt', '/security'] })); }

  // 11. Subresource Integrity and third-party scripts
  C.push(control({ id: 'sri', name: 'Third-party scripts pinned (SRI)', tsc: ['CC6.8'], max_age_h: 1,
    status: sri.need_sri === 0 || sri.with_sri === sri.need_sri ? 'pass' : 'warn', evidence_at: now,
    detail: sri.external_scripts + ' external scripts on ' + sri.pages + ' key pages. ' + sri.with_sri + ' of ' + sri.need_sri + ' pinnable scripts carry an integrity hash. ' + (sri.exempt.length ? 'Analytics loaders cannot be pinned because the vendor changes their code: ' + sri.exempt.join(', ') + ' (they load only with consent where required).' : '') + (scan ? ' The weekly scan flags ' + (((scan.alerts || []).find(a => /Sub Resource Integrity/.test(a.name)) || {}).instances || 0) + ' script tags without SRI; it does not separate vendor loaders, so we show its number unedited.' : ''),
    how: 'HTML of the deployed pages parsed on this request.', evidence: ['/data/security-scan.json'], missing: sri.missing }));

  // 12. Change log and safe deploys
  { const ships = L && L.d && L.d.ships || [], lastShip = ships[0], dl = deploys && (deploys.deploys || [])[0];
    C.push(control({ id: 'changelog', name: 'Public change log', tsc: ['CC8.1'], max_age_h: 72,
      status: lastShip ? 'pass' : 'unknown', evidence_at: lastShip ? lastShip.d + 'T12:00:00Z' : null,
      detail: lastShip ? ships.length + ' recent entries in the automatic shipping log, newest ' + lastShip.d + ': "' + lastShip.t + '". The code serving this answer is commit ' + String(buildR || 'unknown').slice(0, 12) + '.' : 'Shipping log not readable right now.',
      how: 'Every change is written to the public changelog and the RSS feed; each API answer names the commit that served it.', evidence: ['/changelog', '/feed.xml', '/api/open/build'] }));
    C.push(control({ id: 'safe-deploys', name: 'Post-deploy guard with automatic rollback', tsc: ['CC8.1', 'A1.2'], max_age_h: 7 * 24,
      status: !dl ? (deploys && (deploys.drills || []).length ? 'warn' : 'unknown') : dl.result === 'pass' || dl.result === 'rolled_back' ? 'pass' : 'fail', evidence_at: dl ? dl.at : deploys && (deploys.drills || [])[0] ? deploys.drills[0].at : null,
      detail: dl ? 'Last guarded deploy ' + String(dl.commit).slice(0, 12) + ': ' + dl.result.replace(/_/g, ' ') + ' (' + dl.checks_passed + ' of ' + dl.checks_total + ' smoke checks). ' + (deploys.deploys || []).length + ' deploys recorded, ' + (deploys.deploys || []).filter(x => x.result === 'rolled_back').length + ' rolled back.' : (deploys && (deploys.drills || []).length ? 'Rollback drill ' + deploys.drills[0].result.replace(/_/g, ' ') + ' on ' + String(deploys.drills[0].at).slice(0, 10) + '; no guarded production deploy recorded yet.' : 'Starting: the guard has not recorded a deploy yet.'),
      how: 'After every push, GitHub Actions waits for the new commit to be live, runs smoke checks in a real browser and reverts the change if they fail twice.', evidence: ['/data/deploys.json', '/open/deploy-smoke.mjs'] })); }

  const by = s => C.filter(c => c.status === s).length;
  return { generated_at: now, build: buildR || null,
    framework: 'Controls mapped by Kolaboro to the AICPA SOC 2 Trust Services Criteria (2017, points of focus revised 2022). Not audited. Kolaboro holds no SOC 2 report and no certification.',
    status_rules: 'pass: evidence meets the target and is fresh. warn: works with a known gap. fail: evidence shows a problem. stale: evidence older than max_age_h. unknown: evidence not readable on this request.',
    summary: { controls: C.length, pass: by('pass'), warn: by('warn'), fail: by('fail'), stale: by('stale'), unknown: by('unknown') }, controls: C };
}

// ---------- Investor dossier: metrics computed from existing open data only ----------
const MON = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
function changelogDays(html) {   // hand-written changelog: count dated entries per day
  const m = {}; if (!html) return m;
  for (const g of html.matchAll(/<li><span class="dot[^"]*"><\/span><div><b>(\d{1,2}) ([A-Z][a-z]{2}) (\d{4})[^<]*<\/b><ul>([\s\S]*?)<\/ul>/g)) {
    const d = new Date(Date.UTC(+g[3], MON[g[2]], +g[1])).toISOString().slice(0, 10);
    m[d] = (m[d] || 0) + (g[4].match(/<li>/g) || []).length;
  }
  return m;
}
async function dossier(env) {
  const now = new Date().toISOString(), today = now.slice(0, 10);
  const [L, kb, uptime, evals, spend, heads, fresh, clog, deploys] = await Promise.all([
    openLoad().catch(() => null), tryRpc('kolaboro_public_stats'), tryRpc('kolaboro_uptime_public'), tryRpc('kolaboro_evals_public'), tryRpc('kolaboro_ai_spend_public'),
    logHeads().catch(() => null), self('/api/open/freshness').then(r => r && r.ok ? r.json() : null).catch(() => null), asset(env, '/changelog/index.html'), assetJson(env, '/data/deploys.json')]);
  const M = [], S = [];
  const add = (id, label, value, unit, source, at, note) => M.push({ id, label, value: value == null ? null : value, unit: unit || null, source, as_of: at || null, note: value == null ? (note || 'not measured yet') : (note || null) });
  const d = L && L.d, db = d && d.db || {};
  if (d) {
    add('projects', 'Projects tracked', (d.cases || []).length, 'projects', '/data/bali-cases.json', d.updated);
    add('markets', 'Markets with desk research', d.markets, 'markets', '/api/open/stats', d.updated, (d.countries || '?') + ' countries');
    add('sources', 'Public sources read', db.sources, 'sources', '/api/open/stats', db.updated);
    add('claims', 'Developer claims tested', db.claims_total, 'claims', '/api/open/stats', db.updated, db.claims ? db.claims.verified + ' verified, ' + db.claims.unverified + ' unverified, ' + db.claims.contradicted + ' contradicted' : null);
    add('changes', 'Changes detected on developer pages', db.changes_detected, 'changes', '/api/open/stats', db.updated);
  } else add('projects', 'Projects tracked', null, null, '/data/bali-cases.json', null, 'dataset not readable right now');
  if (fresh) add('freshness', 'Projects re-read within 7 days', fresh.pct_7d, '%', '/api/open/freshness', fresh.updated, fresh.within_7d + ' of ' + fresh.projects);
  if (kb) {
    const r7 = kb.runs_7d || {};
    add('reviews_7d', 'AI desk reviews run, last 7 days', r7.analyze != null ? r7.analyze : null, 'reviews', '/api/kb/stats', kb.generated_at, 'Counts calls to the review endpoint; only a 7-day window is published, so no longer history yet.');
    add('stamps', 'Bitcoin timestamps issued', kb.stamps, 'stamps', '/api/kb/stats', kb.generated_at, kb.stamps_confirmed != null ? kb.stamps_confirmed + ' confirmed in a block' : null);
  } else add('reviews_7d', 'AI desk reviews run, last 7 days', null, null, '/api/kb/stats', null, 'source not readable right now');
  add('signed_answers', 'Signed API answers served', null, null, '/api/open/docs', null, 'Not measured yet: every /api/open answer is signed, but we do not count them.');
  if (heads) {
    add('log_days', 'Days in the public log', heads.length, 'days', '/api/open/log', heads.length ? heads[heads.length - 1].day : null, heads.filter(h => h.rekor_uuid).length + ' witnessed in Sigstore Rekor, first day ' + (heads[0] || {}).day);
    S.push({ id: 'log_projects', label: 'Projects fingerprinted in each daily log head', source: '/api/open/log', points: heads.map(h => ({ d: h.day, v: h.projects_count })) });
  }
  if (evals && evals.latest) {
    const l = evals.latest, hist = evals.history || [], passRuns = hist.filter(h => h.cases_passed === h.cases_total).length;
    add('eval_pass', 'AI evaluation pass rate, latest run', Math.round(1000 * l.cases_passed / l.cases_total) / 10, '%', '/api/open/evals', l.run_at, l.cases_passed + ' of ' + l.cases_total + ' cases; ' + passRuns + ' of ' + hist.length + ' recorded runs passed every case (failed runs are kept in the history).');
    const byDay = {}; for (const h of hist) { const k = h.day || String(h.at).slice(0, 10); (byDay[k] = byDay[k] || { runs: 0, pass: 0 }); byDay[k].runs++; if (h.cases_passed === h.cases_total) byDay[k].pass++; }
    S.push({ id: 'eval_runs', label: 'AI evaluation runs per day (all cases passed)', source: '/api/open/evals', points: Object.keys(byDay).sort().map(k => ({ d: k, v: byDay[k].runs, pass: byDay[k].pass })) });
  }
  if (uptime) {
    add('uptime_7d', 'Uptime, last 7 days', uptime.uptime_7d, '%', '/api/open/uptime', (uptime.daily || []).map(x => x.day).sort().pop(), uptime.probes_30d + ' probes since ' + String(uptime.since).slice(0, 10));
    S.push({ id: 'uptime_daily', label: 'Probes up per day', source: '/api/open/uptime', points: (uptime.daily || []).slice().sort((a, b) => a.day < b.day ? -1 : 1).map(x => ({ d: x.day, v: x.probes ? Math.round(1000 * x.up / x.probes) / 10 : null, n: x.probes })) });
  }
  if (spend) {
    const days = (spend.days || []).slice().sort((a, b) => a.day < b.day ? -1 : 1), usd = days.reduce((a, x) => a + (+x.usd_estimated || 0), 0), calls = days.reduce((a, x) => a + (+x.calls || 0), 0);
    add('ai_spend', 'AI spend recorded', Math.round(usd * 100) / 100, 'USD', '/api/open/ai-spend', days.length ? days[days.length - 1].day : null, calls + ' calls over ' + days.length + ' day(s) since ' + (days[0] || {}).day + '; daily cap $' + spend.cap_usd_per_day + '.');
    add('ai_cost_call', 'AI cost per call', calls ? Math.round(10000 * usd / calls) / 10000 : null, 'USD', '/api/open/ai-spend', days.length ? days[days.length - 1].day : null);
    // cost per review needs spend for the same 7 days as the review count; until 7 days of spend exist it is not computed
    const since7 = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10), w = days.filter(x => x.day > since7), r7 = kb && kb.runs_7d && kb.runs_7d.analyze;
    const covered = days.length && days[0].day <= since7;
    add('ai_cost_review', 'AI cost per desk review (upper bound)', covered && r7 ? Math.round(100 * w.reduce((a, x) => a + (+x.usd_estimated || 0), 0) / r7) / 100 : null, 'USD', '/api/open/ai-spend + /api/kb/stats', covered ? today : null,
      covered && r7 ? 'All AI spend in the last 7 days divided by reviews in the same 7 days; includes evaluation runs, so the true cost per review is lower.' : 'Not measured yet: spend is recorded since ' + ((days[0] || {}).day || 'recently') + ' and needs a full 7 days to match the 7-day review count.');
    S.push({ id: 'ai_spend_daily', label: 'AI spend per day (USD)', source: '/api/open/ai-spend', points: days.map(x => ({ d: x.day, v: +x.usd_estimated, n: x.calls })) });
  }
  { const per = changelogDays(clog), keys = Object.keys(per).sort(), start = new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10);
    const w = keys.filter(k => k >= start).reduce((a, k) => a + per[k], 0), first = keys[0], fullWeek = first && first <= start;
    add('ships_week', 'Changes shipped, last 7 days', keys.length ? w : null, 'changes', '/changelog', keys[keys.length - 1], keys.length ? 'Entries in the dated changelog from ' + (fullWeek ? start : first + ' (launch; less than a full week of history)') + ' to ' + today + ', ' + keys.length + ' days of history in all. Data-only refreshes by the research agents are not counted.' : 'changelog not readable right now');
    S.push({ id: 'ships_daily', label: 'Changelog entries per day', source: '/changelog', points: keys.map(k => ({ d: k, v: per[k] })) });
    if (d && d.ships) { const a = {}; for (const s of d.ships) a[s.d] = (a[s.d] || 0) + 1; S.push({ id: 'ships_auto', label: 'Automatic shipping-log entries per day', source: '/api/open/summary', points: Object.keys(a).sort().map(k => ({ d: k, v: a[k] })) }); }
  }
  if (deploys && deploys.deploys) add('deploys', 'Guarded deploys recorded', deploys.deploys.length, 'deploys', '/data/deploys.json', (deploys.deploys[0] || {}).at, deploys.deploys.filter(x => x.result === 'rolled_back').length + ' rolled back automatically');
  else add('deploys', 'Guarded deploys recorded', null, null, '/data/deploys.json', null, 'Not measured yet: the deploy guard started on 3 Nov 2026 and has not recorded a production deploy.');
  add('revenue', 'Revenue', null, null, null, null, 'Not published here. No revenue figure is shown because none is computed from public data.');
  return { generated_at: now, rules: 'Every number is computed on this request from the listed public source. No projections, no estimates of future traction. A metric we do not measure says so.', metrics: M, series: S };
}

export async function handle(req, u, env, ctx) {
  const p = u.pathname.replace(/\/+$/, '');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET', 'access-control-max-age': '86400' } });
  if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: 'method' }, 0, 405);
  try {
    if (p === '/api/x/l/trust') return signed(env, await cached('trust-v2', 120, () => trust(env)), 120);
    if (p === '/api/x/l/dossier') return signed(env, await cached('dossier-v2', 300, () => dossier(env)), 300);
  } catch (e) { return out({ error: 'evidence_unavailable', detail: String(e && e.message || e).slice(0, 200) }, 10, 503); }
  return out({ error: 'not found', routes: ['/api/x/l/trust', '/api/x/l/dossier'] }, 300, 404);
}
