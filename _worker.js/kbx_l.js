// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_l__q, $s = TB.kbx_l__s, $t = TB.kbx_l__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { rpc, sha, signBody, openLoad, logHeads } from './kolaboro.js';
import { TB } from './kbx_strings.js';
export const PATHS = /^\/api\/x\/l\//;
const ORIGIN = 'https://kolaboro.com';
const H = 3600e3;
function out(o, maxAge, status) {
  return new Response(JSON.stringify(o, null, 1), { status: status || 200, headers: { 'content-type': $q.a, 'cache-control': $q.b + (maxAge || 60), 'access-control-allow-origin': '*', 'access-control-expose-headers': $q.c } });
}
async function signed(env, o, maxAge) {
const body = JSON.stringify(o, null, 1), h = { 'content-type': $q.a, 'cache-control': $q.b + maxAge, 'access-control-allow-origin': '*', 'access-control-expose-headers': $t.k0 };
try { const sg = await signBody(env, body); if (sg) { h[$q.d] = sg; h[$q.e] = (env && env.KB_SIGN_KID) || 'kb'; } } catch (e) {}
return new Response(body, { headers: h });
}
async function asset(env, path) {
try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.f + path)); if (!r.ok) return null; return await r.text(); } catch (e) { return null; }
}
async function assetJson(env, path) { const t = await asset(env, path); if (t == null) return null; try { return JSON.parse(t); } catch (e) { return null; } }
async function self(path, init) {   // a live request to the public site, the same one any visitor can make
  try { return await fetch(ORIGIN + path, Object.assign({ headers: { 'user-agent': $q.g } }, init || {})); } catch (e) { return null; }
}
async function tryRpc(fn) { try { const d = await rpc(fn, {}); return d && !d.error ? d : null; } catch (e) { return null; } }
const iso = t => (t == null || isNaN(+new Date(t))) ? null : new Date(t).toISOString();
const ageH = t => t ? (Date.now() - +new Date(t)) / H : null;
const b64d = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function cached(key, ttl, fn) {
const ck = new Request(ORIGIN + $q.h + key);
try { const hit = await caches.default.match(ck); if (hit) return await hit.json(); } catch (e) {}
const v = await fn();
try { await caches.default.put(ck, new Response(JSON.stringify(v), { headers: { 'content-type': $q.i, 'cache-control': $q.j + ttl } })); } catch (e) {}
return v;
}
async function verifyOpenAnswer(path) {
const [r, kr] = await Promise.all([self(path), self($q.k)]);
if (!r || !r.ok || !kr || !kr.ok) return { ok: false, why: $t.k1 };
const body = await r.text(), sig = r.headers.get($q.d), kid = r.headers.get($q.e);
if (!sig) return { ok: false, why: $q.l };
let keys; try { keys = (await kr.json()).keys || []; } catch (e) { return { ok: false, why: $q.m }; }
const k = keys.find(x => x.kid === kid);
if (!k) return { ok: false, why: $q.n + kid + $q.o };
if (k.status === $q.p) return { ok: false, why: $q.q };
const msg = new TextEncoder().encode($q.r + await sha(body));
for (const alg of [{ name: $q.s }, { name: $q.t, namedCurve: $q.t }]) {
try { const pk = await crypto.subtle.importKey('spki', b64d(k.public_key_spki_b64), alg, false, [$q.u]); return { ok: await crypto.subtle.verify(alg, pk, b64d(sig), msg), kid, bytes: body.length }; } catch (e) {}
}
return { ok: false, why: $q.v };
}
const SRI_PAGES = ['/', '/check/', '/database/', '/verify/', '/log/', '/live/', '/trust/', '/investors/dossier/'];
const SRI_EXEMPT = /^https:\/\/(www\.googletagmanager\.com|www\.clarity\.ms|static\.cloudflareinsights\.com|www\.paypal\.com)\//;
async function sriScan(env) {
const scripts = [];
for (const p of SRI_PAGES) {
const html = await asset(env, p.replace(/\/$/, $q.w));
if (!html) continue;
for (const m of html.matchAll(/<script\b[^>]*\bsrc="(https?:\/\/[^"]+)"[^>]*>/g)) scripts.push({ page: p, src: m[1], integrity: /\bintegrity="sha(256|384|512)-/.test(m[0]), exempt: SRI_EXEMPT.test(m[1]) });
for (const m of html.matchAll(/https:\/\/(?:www\.googletagmanager\.com\/gtag\/js|www\.clarity\.ms\/tag\/)/g)) if (!scripts.some(x => x.page === p && x.src.startsWith(m[0]))) scripts.push({ page: p, src: m[0], integrity: false, exempt: true, injected: true });
}
const pinned = scripts.filter(s => !s.exempt), missing = pinned.filter(s => !s.integrity);
return { pages: SRI_PAGES.length, external_scripts: scripts.length, need_sri: pinned.length, with_sri: pinned.length - missing.length, missing: missing.map(s => s.page + ' ' + s.src).slice(0, 20), exempt: [...new Set(scripts.filter(s => s.exempt).map(s => new URL(s.src).host))] };
}
function control(c) {
let status = c.status;
if (status === 'pass' || status === 'warn') { const a = ageH(c.evidence_at); if (a == null) status = $q.x; else if (a > c.max_age_h) status = 'stale'; }
return Object.assign({}, c, { status, evidence_age_h: c.evidence_at ? Math.round(ageH(c.evidence_at) * 10) / 10 : null });
}
async function trust(env) {
const now = new Date().toISOString();
const [restore, scan, verifiers, deploys, uptime, evals, honey, heads, cpR, sec, admin, httpR, homeR, sigOk, sri, L, buildR] = await Promise.all([
assetJson(env, $q.y), assetJson(env, $q.z), assetJson(env, $q.A), assetJson(env, $q.B),
tryRpc($q.C), tryRpc($q.D), tryRpc($q.E), logHeads().catch(() => null),
self($q.F), self($q.G), self($q.H, { redirect: $q.I }), null,
null, verifyOpenAnswer($q.J), sriScan(env), openLoad().catch(() => null), Promise.resolve(env && env.CF_PAGES_COMMIT_SHA)
]);
const C = [];
if (restore) C.push(control({ id: $q.K, name: $q.L, tsc: ['A1.2', 'A1.3'], max_age_h: 8 * 24 + 6,
status: restore.ok && restore.evidence_ok && restore.backup_age_days <= 2 ? 'pass' : 'fail', evidence_at: restore.drill_at || restore.date,
detail: $q.M + restore.backup_file + ' (' + (restore.backup_age_days) + $q.N + String(restore.postgres || '').split(' ')[0] + ': ' + (restore.tables || []).length + $q.O + restore.rows_total + $q.P + restore.evidence_files_checked + $q.Q + restore.evidence_bad_hash + $q.R + restore.duration_s + ' s.',
how: $s.k0, evidence: [$q.y] }));
else C.push(control({ id: $q.K, name: $q.L, tsc: ['A1.2', 'A1.3'], max_age_h: 200, status: $q.x, evidence_at: null, detail: $t.k2, evidence: [$q.y] }));
{ const d = uptime && (uptime.daily || []).slice().sort((a, b) => a.day < b.day ? 1 : -1)[0];
C.push(control({ id: $q.S, name: $t.k3, tsc: ['A1.1', 'CC7.2'], max_age_h: 30,
status: !uptime ? $q.x : uptime.uptime_7d >= 99.5 ? 'pass' : uptime.uptime_7d >= 98 ? 'warn' : 'fail', evidence_at: d ? d.day + $q.T : null,
detail: uptime ? uptime.uptime_7d + $q.U + (uptime.by_vantage ? Object.entries(uptime.by_vantage).map(([k, v]) => v.probes_7d + $q.V + k).join(', ') : '') + $q.W + uptime.p95_ms_7d + ' ms, ' + (uptime.incidents || []).length + $q.X + String(uptime.since).slice(0, 10) + '.' : $q.Y,
how: $s.k1, evidence: [$q.Z, $q.aa] })); }
{ const lc = deploys && deploys.latest_checks, t = lc ? (lc.checks || []).filter(c => /^tls:/.test(c.name)) : [];
C.push(control({ id: 'tls', name: $q.ab, tsc: ['CC6.7'], max_age_h: 7 * 24,
status: !t.length ? $q.x : t.every(c => c.ok) ? 'pass' : 'warn', evidence_at: t.length ? lc.at : null,
detail: t.length ? t.map(c => c.name.replace(/^tls: /, '') + ': ' + (c.ok ? 'yes' : 'NO') + ' (' + c.detail + ')').join('. ') + '.' : $t.k4,
how: $s.k2, evidence: [$q.B, $t.k5] })); }
{ const v3 = verifiers && verifiers.ok && verifiers.three_languages_agree;
C.push(control({ id: $q.ac, name: $q.ad, tsc: ['PI1.5', 'CC7.1'], max_age_h: 36,
status: sigOk.ok && v3 ? 'pass' : sigOk.ok || v3 ? 'warn' : 'fail', evidence_at: verifiers ? verifiers.date : now,
detail: $t.k6 + (sigOk.ok ? $q.ae + sigOk.kid : $q.af + (sigOk.why || $q.ag) + ')') + $t.k7 + (verifiers ? (verifiers.all_checks_pass ? $q.ah : $q.ai) + ' and ' + (verifiers.three_languages_agree ? 'agree' : $q.aj) : $q.ak) + '.',
how: $s.k3, evidence: [$q.A, $q.k, $q.al] })); }
{ const last = heads && heads[heads.length - 1], cpText = cpR && cpR.ok ? await cpR.text() : '';
const size = +(cpText.split('\n')[1] || 0), witnessed = heads ? heads.filter(h => h.rekor_uuid).length : 0;
const t = last ? (last.rekor_time ? last.rekor_time * 1000 : last.day + $q.T) : null;
C.push(control({ id: $q.am, name: $q.an, tsc: ['PI1.5', 'CC7.2'], max_age_h: 40,
status: !heads ? $q.x : (last && last.rekor_uuid && size === heads.length && last.audit_intact !== false) ? 'pass' : 'warn', evidence_at: iso(t),
detail: heads ? heads.length + $q.ao + witnessed + $t.k8 + (size || $q.ap) + (size === heads.length ? $q.aq : $q.ar) + $q.as + last.day + ', ' + last.projects_count + $q.at : $q.au,
how: $s.k4, evidence: [$q.av, $q.F, '/log/'] })); }
{ const l = evals && evals.latest;
C.push(control({ id: $q.aw, name: $q.ax, tsc: ['PI1.3', 'CC8.1'], max_age_h: 36,
status: !l ? $q.x : l.cases_passed === l.cases_total ? 'pass' : 'fail', evidence_at: l ? l.run_at : null,
detail: l ? l.cases_passed + ' of ' + l.cases_total + $q.ay + l.checks_passed + ' of ' + l.checks_total + $q.az + (l.by_kind && l.by_kind.injection ? $q.aA + l.by_kind.injection.passed + ' of ' + l.by_kind.injection.total + $q.aB : '') + (l.consensus ? $q.aC + l.consensus.fields_agreed + ' of ' + l.consensus.fields_compared + $q.aD : '') + $q.aE + l.seconds + ' s.' : $t.k9,
how: $s.k5, evidence: [$q.aF, $q.aG] })); }
if (scan) { const r = scan.by_risk || {};
C.push(control({ id: $q.aH, name: $q.aI, tsc: ['CC7.1'], max_age_h: 8 * 24 + 6,
status: r.high > 0 ? 'fail' : r.medium > 0 ? 'warn' : 'pass', evidence_at: scan.date,
detail: scan.tool + $q.aJ + scan.zap_version + ': ' + (r.high || 0) + $q.aK + (r.medium || 0) + $q.aL + (r.low || 0) + $q.aM + (r.informational || 0) + $t.k10,
how: $t.k11, evidence: [$q.z, $q.aN] })); }
else C.push(control({ id: $q.aH, name: $q.aI, tsc: ['CC7.1'], max_age_h: 200, status: $q.x, evidence_at: null, detail: $q.aO, evidence: [$q.z] }));
{ const touched = honey ? (honey.touched || []) : [], hits = touched.reduce((a, x) => a + (x.hits || 0), 0), lastHit = touched.map(x => x.last_hit).sort().pop();
C.push(control({ id: $q.aP, name: $q.aQ, tsc: ['CC7.2', 'CC7.3'], max_age_h: 1,
status: honey && honey.decoys > 0 ? 'pass' : $q.x, evidence_at: honey ? now : null,
detail: honey ? honey.decoys + $q.aR + (touched.length ? touched.map(x => x.kind.replace(/_/g, ' ') + ' ' + x.hits + $q.aS).join(', ') + $q.aT + String(lastHit).slice(0, 16).replace('T', ' ') + $t.k12 : $q.aU) : $q.aV,
how: $s.k6, evidence: [$q.aN] })); }
{ const h = admin ? admin.headers : null, rob = h && /noindex/.test(h.get($q.aW) || ''), nst = h && /no-store/.test(h.get($q.aX) || ''), frm = h && (/deny/i.test(h.get($q.aY) || '') || /frame-ancestors 'none'/.test(h.get($q.aZ) || ''));
C.push(control({ id: $q.ba, name: $q.bb, tsc: ['CC6.1', 'CC6.2'], max_age_h: 1,
status: !h ? $q.x : rob && nst && frm ? 'pass' : 'warn', evidence_at: h ? now : null,
detail: h ? $q.bc + [rob ? $q.bd : $q.be, nst ? $q.bf : $q.bg, frm ? $q.bh : $q.bi].join(', ') + $s.k7 : $q.bj,
how: $s.k8, evidence: [$q.bk] })); }
{ const t = sec && sec.ok ? await sec.text() : '', exp = (t.match(/^Expires:\s*(.+)$/m) || [])[1], contact = /^Contact:\s*\S+/m.test(t), days = exp ? Math.floor((+new Date(exp) - Date.now()) / 864e5) : null;
C.push(control({ id: $q.bl, name: $q.bm, tsc: ['CC2.3'], max_age_h: 1,
status: !t ? 'fail' : contact && days > 30 ? 'pass' : 'warn', evidence_at: t ? now : null,
detail: t ? $q.bn + (contact ? $q.bo : $q.bp) + $q.bq + days + ' days' + (/^Policy:/m.test(t) ? $q.br : '') + '.' : $q.bs,
how: $q.bt, evidence: [$q.G, $q.bk] })); }
C.push(control({ id: 'sri', name: $q.bu, tsc: ['CC6.8'], max_age_h: 1,
status: sri.need_sri === 0 || sri.with_sri === sri.need_sri ? 'pass' : 'warn', evidence_at: now,
detail: sri.external_scripts + $q.bv + sri.pages + $q.bw + sri.with_sri + ' of ' + sri.need_sri + $t.k13 + (sri.exempt.length ? $t.k14 + sri.exempt.join(', ') + $t.k15 : '') + (scan ? $q.bx + (((scan.alerts || []).find(a => /Sub Resource Integrity/.test(a.name)) || {}).instances || 0) + $t.k16 : ''),
how: $t.k17, evidence: [$q.z], missing: sri.missing }));
{ const ships = L && L.d && L.d.ships || [], lastShip = ships[0], dl = deploys && (deploys.deploys || [])[0];
C.push(control({ id: $q.by, name: $q.bz, tsc: ['CC8.1'], max_age_h: 72,
status: lastShip ? 'pass' : $q.x, evidence_at: lastShip ? lastShip.d + $q.bA : null,
detail: lastShip ? ships.length + $t.k18 + lastShip.d + ': "' + lastShip.t + $t.k19 + String(buildR || $q.x).slice(0, 12) + '.' : $q.bB,
how: $s.k9, evidence: [$q.bC, $q.bD, $q.bE] }));
C.push(control({ id: $q.bF, name: $t.k20, tsc: ['CC8.1', 'A1.2'], max_age_h: 7 * 24,
status: !dl ? (deploys && (deploys.drills || []).length ? 'warn' : $q.x) : dl.result === 'pass' || dl.result === $q.bG ? 'pass' : 'fail', evidence_at: dl ? dl.at : deploys && (deploys.drills || [])[0] ? deploys.drills[0].at : null,
detail: dl ? $q.bH + String(dl.commit).slice(0, 12) + ': ' + dl.result.replace(/_/g, ' ') + ' (' + dl.checks_passed + ' of ' + dl.checks_total + $q.bI + (deploys.deploys || []).length + $q.bJ + (deploys.deploys || []).filter(x => x.result === $q.bG).length + $q.bK : (deploys && (deploys.drills || []).length ? $q.bL + deploys.drills[0].result.replace(/_/g, ' ') + ' on ' + String(deploys.drills[0].at).slice(0, 10) + $t.k21 : $t.k22),
how: $s.k10, evidence: [$q.B, $q.bM] })); }
const by = s => C.filter(c => c.status === s).length;
return { generated_at: now, build: buildR || null,
framework: $s.k11,
status_rules: $s.k12,
summary: { controls: C.length, pass: by('pass'), warn: by('warn'), fail: by('fail'), stale: by('stale'), unknown: by($q.x) }, controls: C };
}
const MON = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
function changelogDays(html) {
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
openLoad().catch(() => null), tryRpc($q.bN), tryRpc($q.C), tryRpc($q.D), tryRpc($q.bO),
logHeads().catch(() => null), self($q.bP).then(r => r && r.ok ? r.json() : null).catch(() => null), asset(env, $q.bQ), assetJson(env, $q.B)]);
const M = [], S = [];
const add = (id, label, value, unit, source, at, note) => M.push({ id, label, value: value == null ? null : value, unit: unit || null, source, as_of: at || null, note: value == null ? (note || $q.bR) : (note || null) });
const d = L && L.d, db = d && d.db || {};
if (d) {
add($q.bS, $q.bT, (d.cases || []).length, $q.bS, $q.bU, d.updated);
add($q.bV, $q.bW, d.markets, $q.bV, $q.J, d.updated, (d.cases && d.cases.length ? new Set(d.cases.map(c => ({ 'Puerto Rico (USA)': $q.bX, 'St Lucia': $q.bY })[c.country] || c.country)).size : (d.countries || '?')) + $q.bZ);
add($q.ca, $q.cb, db.sources, $q.ca, $q.J, db.updated);
add($q.cc, $q.cd, db.claims_total, $q.cc, $q.J, db.updated, db.claims ? db.claims.verified + $q.ce + db.claims.unverified + $q.cf + db.claims.contradicted + $q.cg : null);
add($q.ch, $q.ci, db.changes_detected, $q.ch, $q.J, db.updated);
} else add($q.bS, $q.bT, null, null, $q.bU, null, $q.cj);
if (fresh) add($q.ck, $q.cl, fresh.pct_7d, '%', $q.bP, fresh.updated, fresh.within_7d + ' of ' + fresh.projects);
if (kb) {
const r7 = kb.runs_7d || {};
add($q.cm, $q.cn, r7.analyze != null ? r7.analyze : null, $q.co, $q.cp, kb.generated_at, $t.k23);
add($q.cq, $q.cr, kb.stamps, $q.cq, $q.cp, kb.generated_at, kb.stamps_confirmed != null ? kb.stamps_confirmed + $q.cs : null);
} else add($q.cm, $q.cn, null, null, $q.cp, null, $q.ct);
add($q.cu, $q.cv, null, null, $q.cw, null, $t.k24);
if (heads) {
add($q.cx, $q.cy, heads.length, 'days', $q.av, heads.length ? heads[heads.length - 1].day : null, heads.filter(h => h.rekor_uuid).length + $t.k25 + (heads[0] || {}).day);
S.push({ id: $q.cz, label: $t.k26, source: $q.av, points: heads.map(h => ({ d: h.day, v: h.projects_count })) });
}
if (evals && evals.latest) {
const l = evals.latest, hist = evals.history || [], passRuns = hist.filter(h => h.cases_passed === h.cases_total).length;
add($q.cA, $t.k27, Math.round(1000 * l.cases_passed / l.cases_total) / 10, '%', $q.aF, l.run_at, l.cases_passed + ' of ' + l.cases_total + $q.cB + passRuns + ' of ' + hist.length + $t.k28);
const byDay = {}; for (const h of hist) { const k = h.day || String(h.at).slice(0, 10); (byDay[k] = byDay[k] || { runs: 0, pass: 0 }); byDay[k].runs++; if (h.cases_passed === h.cases_total) byDay[k].pass++; }
S.push({ id: $q.cC, label: $t.k29, source: $q.aF, points: Object.keys(byDay).sort().map(k => ({ d: k, v: byDay[k].runs, pass: byDay[k].pass })) });
}
if (uptime) {
add($q.cD, $q.cE, uptime.uptime_7d, '%', $q.Z, (uptime.daily || []).map(x => x.day).sort().pop(), uptime.probes_30d + $q.cF + String(uptime.since).slice(0, 10));
S.push({ id: $q.cG, label: $q.cH, source: $q.Z, points: (uptime.daily || []).slice().sort((a, b) => a.day < b.day ? -1 : 1).map(x => ({ d: x.day, v: x.probes ? Math.round(1000 * x.up / x.probes) / 10 : null, n: x.probes })) });
}
if (spend) {
const days = (spend.days || []).slice().sort((a, b) => a.day < b.day ? -1 : 1), usd = days.reduce((a, x) => a + (+x.usd_estimated || 0), 0), calls = days.reduce((a, x) => a + (+x.calls || 0), 0);
add($q.cI, $q.cJ, Math.round(usd * 100) / 100, 'USD', $q.cK, days.length ? days[days.length - 1].day : null, calls + $q.cL + days.length + $q.cM + (days[0] || {}).day + $q.cN + spend.cap_usd_per_day + '.');
add($q.cO, $q.cP, calls ? Math.round(10000 * usd / calls) / 10000 : null, 'USD', $q.cK, days.length ? days[days.length - 1].day : null);
const since7 = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10), w = days.filter(x => x.day > since7), r7 = kb && kb.runs_7d && kb.runs_7d.analyze;
const covered = days.length && days[0].day <= since7;
add($q.cQ, $t.k30, covered && r7 ? Math.round(100 * w.reduce((a, x) => a + (+x.usd_estimated || 0), 0) / r7) / 100 : null, 'USD', $q.cR, covered ? today : null,
covered && r7 ? $s.k13 : $t.k31 + ((days[0] || {}).day || $q.cS) + $t.k32);
S.push({ id: $q.cT, label: $q.cU, source: $q.cK, points: days.map(x => ({ d: x.day, v: +x.usd_estimated, n: x.calls })) });
}
{ const per = changelogDays(clog), keys = Object.keys(per).sort(), start = new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10);
const w = keys.filter(k => k >= start).reduce((a, k) => a + per[k], 0), first = keys[0], fullWeek = first && first <= start;
add($q.cV, $q.cW, keys.length ? w : null, $q.ch, $q.bC, keys[keys.length - 1], keys.length ? $q.cX + (fullWeek ? start : first + $t.k33) + ' to ' + today + ', ' + keys.length + $t.k34 : $q.cY);
S.push({ id: $q.cZ, label: $q.da, source: $q.bC, points: keys.map(k => ({ d: k, v: per[k] })) });
if (d && d.ships) { const a = {}; for (const s of d.ships) a[s.d] = (a[s.d] || 0) + 1; S.push({ id: $q.db, label: $t.k35, source: $q.dc, points: Object.keys(a).sort().map(k => ({ d: k, v: a[k] })) }); }
}
if (deploys && deploys.deploys) add($q.dd, $q.de, deploys.deploys.length, $q.dd, $q.B, (deploys.deploys[0] || {}).at, deploys.deploys.filter(x => x.result === $q.bG).length + $q.df);
else add($q.dd, $q.de, null, null, $q.B, null, $s.k14);
add($q.dg, $q.dh, null, null, null, null, $t.k36);
return { generated_at: now, rules: $s.k15, metrics: M, series: S };
}
export async function handle(req, u, env, ctx) {
const p = u.pathname.replace(/\/+$/, '');
if (req.method === $q.di) return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET', 'access-control-max-age': '86400' } });
if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: $q.dj }, 0, 405);
try {
if (p === $q.dk) return signed(env, await cached($q.dl, 120, () => trust(env)), 120);
if (p === $q.dm) return signed(env, await cached($q.dn, 300, () => dossier(env)), 300);
} catch (e) { return out({ error: $q.do, detail: String(e && e.message || e).slice(0, 200) }, 10, 503); }
return out({ error: $q.dp, routes: [$q.dk, $q.dm] }, 300, 404);
}
