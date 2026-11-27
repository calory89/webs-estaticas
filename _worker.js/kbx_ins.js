// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_ins__q, $s = TB.kbx_ins__s, $t = TB.kbx_ins__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import * as KB from './kolaboro.js';
import { jget } from './kbx_jget.js';
import { TB } from './kbx_strings.js';
const { json, claude, openData, rateLimited, qnorm } = KB;
export const PATHS = /^\/api\/x\/ins(\/|$)/;
const SITE = 'https://kolaboro.com';
const ID_RE = /^[A-Z]{2,5}-[0-9]{3,4}$/;
const CHECKS = ['permit', 'escrow', 'progress', 'plans', 'record', 'returns_ok'];
const CONFIRMED = ['registry', 'independent'];
const TIER = { clear: 'Strong public disclosure', mixed: 'Some gaps', caution: 'Check carefully' };
const METHOD = { scoring: SITE + '/open/scoring.py', how: SITE + '/how-we-score', levels: SITE + '/database', whatif: SITE + '/p/whatif.js' };
function out(o, s = 200, maxAge) {
  return new Response(JSON.stringify(o), { status: s, headers: { 'content-type': $q.a, 'access-control-allow-origin': '*', 'cache-control': maxAge ? $q.b + maxAge : $q.c } });
}
const MEMO = {};
async function file(env, name) {
  const m = MEMO[name]; if (m && Date.now() - m.t < 300000) return m.v;
  const v = await jget(env, name, SITE + $q.d + name, SITE + $q.e + name).then(o => o.v || null, () => null);   // n40 d14: shared parse
  MEMO[name] = { t: Date.now(), v }; return v;
}
let DG = { t: 0, v: null };
async function digestData(env) {
if (DG.v && Date.now() - DG.t < 300000) return DG.v;
let h = null;
try { const r = await env.ASSETS.fetch(new Request(SITE + $q.f)); if (r.ok) h = await r.text(); } catch (e) {}
if (!h) { try { const r = await fetch(SITE + $q.g, { cf: { cacheTtl: 300 } }); if (r.ok) h = await r.text(); } catch (e) {} }
const m = h && h.match(/<script[^>]*id="digest-data"[^>]*>([\s\S]*?)<\/script>/);
let v = null; try { v = m ? JSON.parse(m[1].replace(/<\\\//g, '</')) : null; } catch (e) {}
DG = { t: Date.now(), v }; return v;
}
const xesc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.h, "'": $q.i }[c]));
function feed(D) {
const items = (D.weeks || []).slice().sort((a, b) => a.id < b.id ? 1 : -1).filter(w => w.intro).map(w => {
const link = SITE + $q.g + (w.id === D.latest ? '' : '#w-' + w.id);
return $q.j + xesc($q.k + (+w.id.slice(5)) + ' ' + w.id.slice(0, 4) + (w.partial ? $q.l : '')) + $q.m + xesc(link) + $t.k0 + w.id + (w.partial ? '-' + w.to : '') + $q.n + new Date(w.generated).toUTCString() + $q.o + xesc(w.intro.text) + $q.p;
}).join('');
return $s.k0 + SITE + $q.q + SITE + $s.k1 + items + $q.r;
}
async function cases(env) { const d = (await file(env, $q.s)) || (await openData()); return d; }
const met = (ck, k) => k === $q.t ? ck.permit === 2 : k === $q.u ? ck.escrow === true : k === $q.v ? ck.progress !== null && ck.progress !== undefined : !!ck[k];
const level = t => { t = String(t == null ? 'none' : t).toLowerCase(); for (const l of [$q.w, $q.x, $q.y, $q.z, 'none']) if (t.includes(l)) return l; return 'none'; };
const scoreOf = ck => CHECKS.reduce((a, k) => a + (met(ck || {}, k) ? 1 : 0), 0);
const vscoreOf = v => Object.keys(v || {}).filter(k => CONFIRMED.includes(level(v[k]))).length;
const tierOf = (s, flags, researched) => ((flags && flags.length) || s <= 1) ? $q.A : s >= (researched === 3 ? 3 : 4) ? 'clear' : 'mixed';
export function explain(c) {
const ck = c.checks || {}, V = c.verified || {}, flags = c.flags || [], researched = (ck.researched && ck.researched.length) ? ck.researched : CHECKS;
const s = scoreOf(ck), vs = vscoreOf(V), tier = tierOf(s, flags, researched.length), mx = c.max || 6;
const rows = CHECKS.map(k => {
const pub = met(ck, k), lv = level(V[k]), res = researched.includes(k);
let state, text;
if (!res) { state = $q.B; text = $t.o_NAME[k] + $t.k1; }
else if (pub) { state = CONFIRMED.includes(lv) ? $q.C : lv === $q.z ? $q.D : $q.E; text = $t.o_NAME[k] + $q.F + $t.o_WHAT[k] + $q.G + $t.o_LVL[lv] + '.'; }
else if (k === $q.t && ck.permit === 1) { state = $q.H; text = $t.o_NAME[k] + $s.k2; }
else if (k === $q.I) { state = $q.J; text = $t.o_NAME[k] + $t.k2; }
else { state = $q.J; text = $t.o_NAME[k] + $q.K + $t.o_WHAT[k] + ').'; }
return { check: k, name: $t.o_NAME[k], published: pub, level: lv, researched: res, state, text };
});
const pubRows = rows.filter(r => r.published), miss = rows.filter(r => !r.published && r.researched);
const unconf = pubRows.filter(r => !CONFIRMED.includes(r.level)), contra = rows.filter(r => r.level === $q.z);
const raise = [];
miss.forEach(r => {
const s2 = s + 1, t2 = tierOf(s2, flags, researched.length);
raise.push({ check: r.check, kind: $q.L, text: (r.check === $q.I ? $t.k3 : $q.M + $t.o_WHAT[r.check]) + $q.N + s + ' to ' + s2 + ' of ' + mx + (t2 !== tier ? $q.O + TIER[tier] + $q.P + TIER[t2] + '"' : '') + '.', score: [s, s2], tier: [tier, t2] });
});
unconf.forEach(r => raise.push({ check: r.check, kind: $q.Q, text: $t.k4 + r.name.toLowerCase() + $q.R + vs + ' to ' + (vs + 1) + $q.S, vscore: [vs, vs + 1] }));
if (flags.length) raise.push({ kind: 'flags', text: $q.T + (flags.length === 1 ? $q.U : flags.length + $q.V) + $t.k5 + TIER.caution + $t.k6 });
const summary = c.id + $q.W + s + $q.X + mx + $q.Y + (s ? ' (' + pubRows.map(r => r.name.toLowerCase()).join(', ') + ')' : '') + '. ' +
(vs ? vs + $q.Z + (vs === 1 ? 'is' : 'are') + $t.k7 : $s.k3) + ' ' +
$q.aa + TIER[tier] + '"' + (flags.length ? $q.ab + (flags.length === 1 ? $q.ac : flags.length + $q.ad) + '.' : s <= 1 ? $t.k8 : s >= (researched.length === 3 ? 3 : 4) ? $q.ae + s + $t.k9 : $q.ae + s + $q.af + (researched.length === 3 ? 3 : 4) + $q.ag + TIER.clear + '").');
const cl = c.claims || {};
return {
id: c.id, market: c.market, country: c.country, stage: c.stage || null, checked: c.checked || null,
score: s, vscore: vs, max: mx, tier, tier_name: TIER[tier],
matches_published: s === (c.score || 0) && vs === (c.vscore || 0) && tier === c.tier,
summary, checks: rows,
published: pubRows.map(r => r.check), missing: miss.map(r => r.check), not_researched: rows.filter(r => !r.researched).map(r => r.check),
unconfirmed: unconf.map(r => r.check), contradicted: contra.map(r => r.check),
claims: { verified: cl.verified || 0, unverified: cl.unverified || 0, contradicted: cl.contradicted || 0, text: (cl.verified || cl.unverified || cl.contradicted) ? $t.k10 + (cl.verified || 0) + $q.ah + (cl.unverified || 0) + $q.ai + (cl.contradicted || 0) + $t.k11 : null },
flags, raise,
caveat: $s.k4,
rules: $s.k5 + TIER.caution + $t.k12 + TIER.clear + $t.k13 + TIER.mixed + '".',
method: METHOD, language: 'en', language_note: $s.k6,
links: { project: SITE + '/p/' + encodeURIComponent(c.id) + '/', explain: SITE + $q.aj + encodeURIComponent(c.id) }
};
}
function flat(prefix, v, outArr, depth) {
if (v === null || v === undefined || v === '') return;
if (Array.isArray(v)) { if (!v.length) return; if (v.every(x => typeof x !== $q.ak)) { outArr.push([prefix, v.join('; ')]); return; } v.slice(0, 12).forEach((x, i) => flat(prefix + '[' + i + ']', x, outArr, depth + 1)); return; }
if (typeof v === $q.ak) { if (depth > 3) return; Object.keys(v).forEach(k => flat(prefix + '.' + k, v[k], outArr, depth + 1)); return; }
outArr.push([prefix, String(v)]);
}
export async function evidence(env, id) {
const d = await cases(env); const c = ((d && d.cases) || []).find(x => x.id === id);
if (!c) return null;
const [pr, ot, hz, rc, st, dr] = await Promise.all([$q.al, $q.am, $q.an, $q.ao, $q.ap, $q.aq].map(n => file(env, n)));
const L = [];
const REN = { id: 'id', market: $q.ar, country: $q.as, region: $q.at, stage: 'stage', band: $q.au, done: $q.av, title: $q.aw, lease: $q.ax, units: 'units', yield: $q.ay, score: $q.az, max: $q.aA, vscore: $q.aB, tier: 'tier', delay: $q.aC, overdue: $q.aD, checked: $q.aE, flags: $q.aF };
const rec = {}; Object.keys(REN).forEach(k => { rec[REN[k]] = k === 'tier' && c.tier ? TIER[c.tier] || c.tier : c[k]; });
flat($q.aG, rec, L, 0);
(c.q || []).slice(0, 8).forEach((x, i) => L.push([$q.aH + i + ']', String(x)]));
const ck = c.checks || {}, rs = ck.researched && ck.researched.length ? ck.researched : CHECKS;
const read = {}; CHECKS.forEach(k => { read[$t.o_NAME[k]] = !rs.includes(k) ? $q.aI : met(ck, k) ? (k === $q.v && typeof ck.progress === $q.aJ ? $q.aK + ck.progress + $q.aL : $q.E) : k === $q.t && ck.permit === 1 ? $q.aM : k === $q.I ? $t.k14 : $q.aN; });
flat($q.aO, read, L, 1);
flat($q.aP, c.verified, L, 1); flat($q.aQ, c.claims, L, 1);
flat($q.aR, (c.history || []).map(h => ({ date: h.d, change: h.f, from: h.from, to: h.to })), L, 1);
if (c.sat) flat($q.aS, c.sat, L, 1);
if (c.register) flat($q.aT, c.register, L, 1);
const P = pr && pr.projects && pr.projects[id];
if (P) flat($q.aU, P.map(p => ({ kind: (pr.kinds || {})[p.k] || p.k, promised_date: p.d, status: p.st, status_meaning: (pr.statuses || {})[p.st], times_moved: p.mv, months_moved: p.mm, last_seen: p.seen, earlier_dates: (p.hist || []).map(h => h.d).filter(x => x !== p.d) })), L, 1);
const T = ot && ot.projects && ot.projects[id];
if (T) flat($q.aV, { status: T.s, advertised_handover: T.cur, first_handover_on_record: T.first, months_moved: T.moved, months_overdue: T.overdue, months_to_first_handover: T.to_first }, L, 1);
const D = dr && dr.projects && dr.projects[id];
if (D && (D.changes || []).length) flat($q.aW, D.changes.slice(0, 10).map(x => ({ field: x.label, from: x.from, to: x.to, first_seen: x.first_seen, reverted: x.reverted })), L, 1);
const H = hz && hz.projects && hz.projects[id];
if (H) flat($q.aX, H, L, 1);
const R = rc && rc.projects && rc.projects[id];
if (R) flat($q.aY, { register: R.register, item: R.item, status: R.status, checked: R.checked }, L, 1);
const S = st && st.projects && st.projects[id];
if (S) flat($q.aZ, { status: S.status, clear_quarters: (S.clear_quarters || []).length, change_pct_last_quarter: S.change_pct_last, no_visible_change_months: S.no_visible_change_months }, L, 1);
const lines = L.slice(0, 160).map((x, i) => ({ e: 'E' + (i + 1), field: x[0], value: x[1].slice(0, 300) }));
return { id, updated: d.updated, case: c, lines, sources: { record: $q.ba, promises: P ? $q.bb : null, timeline: T ? $q.bc : null, hazards: H ? $q.bd : null, register: R ? $q.be : null, satellite: S ? $q.bf : null } };
}
const numsIn = t => (String(t).match(/\d+(?:[.,]\d+)?/g) || []).map(n => n.replace(',', '.'));
async function ask(req, env, ctx) {
if (!env.ANTHROPIC_API_KEY) return out({ error: $q.bg }, 503);
let b; try { const t = await req.text(); if (t.length > 4000) return out({ error: $q.bh }, 400); b = JSON.parse(t); } catch (e) { return out({ error: $q.bh }, 400); }
const id = String(b.id || '').trim().toUpperCase(), q = String(b.q || '').replace(/\s+/g, ' ').trim().slice(0, 300);
if (!ID_RE.test(id)) return out({ error: 'id' }, 400);
if (q.length < 6) return out({ error: $q.bi }, 400);
const ev = await evidence(env, id); if (!ev) return out({ error: $q.bj }, 404);
const ck = new Request(SITE + $q.bk + encodeURIComponent(id + '|' + ev.updated + '|' + q.toLowerCase().replace(/[?!.]+$/, '')));
const hit = await caches.default.match(ck); if (hit) return out({ ...(await hit.json()), cached: true });
if (await rateLimited(req, ctx)) return out({ error: 'rate', message: $t.k15 }, 429);
const ctxt = ev.lines.map(l => l.e + ' ' + l.field + ': ' + l.value).join('\n');
let o; try { o = await claude(env, $s.ASK1_PROMPT + $q.bl + id + $q.bm + ev.updated + ')\n' + ctxt + $q.bn + q, null, null, 1200); }
catch (e) { return out({ error: e && e.budget ? $q.bo : 'model', message: e && e.budget ? $t.k16 : $t.k17 }, 503); }
const byE = {}; ev.lines.forEach(l => { byE[l.e] = l; });
const cites = []; const seen = new Set();
for (const c of (Array.isArray(o.citations) ? o.citations : []).slice(0, 8)) {
const l = byE[String(c && c.e || '').toUpperCase()]; if (!l || seen.has(l.e)) continue;
const qt = qnorm(c.quote || ''), src = qnorm(l.value), whole = qnorm(l.field + ': ' + l.value);
const ok = qt.length >= 1 && (src.includes(qt) || whole.includes(qt));
cites.push({ e: l.e, field: l.field, value: l.value, quote: String(c.quote || '').slice(0, 200), quote_found: ok }); seen.add(l.e);
}
const good = cites.filter(c => c.quote_found);
let answer = String(o.answer || '').replace(/[—–]/g, ', ').slice(0, 900), answerable = o.answerable !== false, refused = null;
const pool = good.map(c => c.field + ' ' + c.value).join(' ') + ' ' + id;
const backed = new Set(numsIn(pool)); const loose = numsIn(answer).filter(n => !backed.has(n));
if (answerable && !good.length) { answerable = false; refused = $q.bp; }
else if (answerable && loose.length) { answerable = false; refused = $q.bq; }
const res = { id, q, updated: ev.updated, answerable, refused,
answer: answerable ? answer : (refused ? $s.k7 : answer || $t.k18),
citations: answerable ? good : [], rejected_citations: cites.filter(c => !c.quote_found).map(c => c.e), unbacked_numbers: loose.slice(0, 6),
model: claude.lastModel || null, evidence_lines: ev.lines.length,
note: $s.k8 };
ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify(res), { headers: { 'content-type': $q.br, 'cache-control': $q.bs } })));
return out(res);
}
export async function indices(env, market) {
const [d, di, pr, hz, gg, cg, iw, pi] = await Promise.all([cases(env), file(env, $q.bt), file(env, $q.al), file(env, $q.an), file(env, $q.bu), file(env, $q.bv), file(env, $q.bw), file(env, $q.bx)]);
const C = ((d && d.cases) || []).filter(c => c.market === market);
if (!C.length) return null;
const ids = new Set(C.map(c => c.id)), I = [];
const thin = (key, label, href, why) => I.push({ key, label, status: 'thin', href, text: $q.by + why });
const dm = di && (di.markets || []).find(m => m.market === market), minS = (di && di.rules && di.rules.min_sample) || 5;
if (dm && dm.share_past_first !== null && dm.share_past_first !== undefined) I.push({ key: 'delay', label: $q.bz, status: 'ok', href: $q.bA, value: dm.share_past_first + '%', text: dm.past_first + ' of ' + dm.with_date + $t.k19 + (dm.median_late !== null && dm.median_late !== undefined ? $q.bB + dm.median_late + $q.bC : '') + '. ' + dm.moved + $q.bD, n: dm.with_date, as_of: di.generated });
else thin('delay', $q.bz, $q.bA, (dm ? dm.with_date : 0) + $q.bE + minS + '.');
const pm = pr && (pr.markets || []).find(m => m.market === market);
if (pm && pm.promises >= 5) I.push({ key: $q.aU, label: $q.bF, status: 'ok', href: $q.bG, value: pm.kept + ' / ' + pm.broken + ' / ' + pm.moved, text: 'Of ' + pm.promises + $q.bH + pm.projects + $q.bI + pm.kept + $q.bJ + pm.broken + $q.bK + pm.moved + $q.bL + pm.pending + $q.bM + pm.unknown + $q.bN, n: pm.promises, as_of: pr.updated });
else thin($q.aU, $q.bF, $q.bG, (pm ? pm.promises : 0) + $t.k20);
const H = hz && hz.projects ? Object.keys(hz.projects).filter(k => ids.has(k)).map(k => hz.projects[k]) : [];
if (H.length) {
const fl = H.filter(h => (h.flood_river_m || 0) > 0 || (h.flood_coast_m || 0) > 0).length, q6 = H.filter(h => ((h.quakes || {}).m6 || 0) > 0).length, vo = H.filter(h => h.volcano && h.volcano.name).length, ts = H.filter(h => ((h.tsunami || {}).runups || 0) > 0).length;
I.push({ key: $q.aX, label: $q.bO, status: H.length >= 3 ? 'ok' : 'thin', href: $q.bP, value: H.length + $q.bQ, text: 'Of ' + H.length + $q.bR + (H.length === 1 ? '' : 's') + $q.bS + fl + $t.k21 + q6 + $t.k22 + ts + $q.bT + vo + $q.bU + (H.length < 3 ? $t.k23 : ''), n: H.length, as_of: hz.updated });
} else thin($q.aX, $q.bO, $q.bP, $t.k24);
const gm = gg && gg.markets && gg.markets[market];
const uk = cg && cg.projects ? Object.keys(cg.projects).filter(k => ids.has(k) && (cg.projects[k].resolved || 0) > 0).length : 0;
if (gm && gm.checked >= 3) I.push({ key: 'graph', label: $q.bV, status: 'ok', href: $q.bW, value: Math.round((gm.projects_with_lei / gm.checked) * 100) + '%', text: gm.projects_with_lei + ' of ' + gm.checked + $t.k25 + (gm.projects_lei_not_issued ? ' (' + gm.projects_lei_not_issued + $q.bX : '') + '.' + (uk ? ' ' + uk + $t.k26 : ''), n: gm.checked, as_of: String(gg.updated || '').slice(0, 10) });
else thin('graph', $q.bV, $q.bW, (gm ? gm.checked : 0) + $t.k27);
const im = iw && iw.markets && iw.markets[market];
if (im && im.names_checked > 0) I.push({ key: $q.bY, label: $q.bZ, status: 'ok', href: $q.ca, value: String(im.projects_with_notice), text: im.projects_with_notice + ' of ' + im.projects_with_names + $t.k28 + im.source + ' (' + im.names_checked + $q.cb + im.projects + $q.cc, n: im.names_checked, as_of: String(iw.updated || '').slice(0, 10) });
else if (im) thin($q.bY, $q.bZ, $q.ca, $q.cd + im.source + $t.k29);
else thin($q.bY, $q.bZ, $q.ca, $t.k30 + C[0].country + $t.k31);
const pmk = pi && (pi.markets || []).find(m => m.market === market), last = pmk && pmk.index && pmk.index[pmk.index.length - 1], first = pmk && pmk.index && pmk.index[0];
const minP = (pi && pi.rules && pi.rules.min_pairs_per_link) || 5;
if (last && last.pairs >= minP) I.push({ key: $q.ce, label: $q.cf, status: 'ok', href: $q.cg, value: (+last.index).toFixed(1), text: $t.k32 + (+last.index).toFixed(1) + ' on ' + last.date + $q.ch + first.date + $q.ci + last.pairs + $t.k33 + pmk.changes_total + $t.k34, n: last.pairs, as_of: pi.generated });
else thin($q.ce, $q.cf, $q.cg, (last ? last.pairs : 0) + $t.k35 + minP + '.');
return { market, country: C[0].country, projects: C.length, updated: d.updated, indices: I, note: $s.k9 };
}
export async function handle(req, u, env, ctx) {
const p = u.pathname.replace(/\/+$/, '');
try {
if (req.method === $q.cj) return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': $q.ck, 'access-control-allow-headers': $q.cl } });
if (p === $q.cm || p === $q.cn) {
const [d, dg] = await Promise.all([cases(env), digestData(env)]);
return out({ module: 'ins', projects: ((d && d.cases) || []).length, updated: d && d.updated, ask: !!env.ANTHROPIC_API_KEY, digest: dg ? { latest: dg.latest, weeks: (dg.weeks || []).length, generated: dg.generated, changes_generated: (dg.changes || {}).generated } : null,
endpoints: [$q.co, $q.cp, $q.cq, $q.cr, $q.cs, $q.ct], pages: [$q.g, $q.cu, $q.aj] }, 200, 60);
}
if (p === $q.cs || p === $q.ct) {
const D = await digestData(env);
if (!D) return out({ error: $q.cv, message: $t.k36 }, 503);
if (p.endsWith('.json')) return out(D, 200, 300);
return new Response(feed(D), { headers: { 'content-type': $q.cw, 'cache-control': $q.cx, 'access-control-allow-origin': '*' } });
}
if (p === $q.cy || p === $q.cz) {
const id = String(u.searchParams.get('id') || '').trim().toUpperCase();
if (!ID_RE.test(id)) return out({ error: 'id', message: $q.cA }, 400);
if (p.endsWith($q.cB)) { const ev = await evidence(env, id); if (!ev) return out({ error: $q.bj }, 404); const { case: _c, ...rest } = ev; return out(rest, 200, 300); }
const d = await cases(env); const c = ((d && d.cases) || []).find(x => x.id === id);
if (!c) return out({ error: $q.bj, message: $q.cC + id + '.' }, 404);
return out(Object.assign({ updated: d.updated }, explain(c)), 200, 300);
}
if (p === $q.cD) { if (req.method !== 'POST') return out({ error: $q.cE }, 405); return await ask(req, env, ctx); }
if (p === $q.cF) {
const m = String(u.searchParams.get($q.ar) || '').trim().slice(0, 60);
if (!m) return out({ error: $q.ar }, 400);
const d = await cases(env); const all = [...new Set(((d && d.cases) || []).map(c => c.market))];
const norm = s => s.toLowerCase().replace(/[-_+]+/g, ' ').replace(/\s+/g, ' ').trim();
const name = all.find(x => norm(x) === norm(m));
if (!name) return out({ error: $q.cG }, 404);
return out(await indices(env, name), 200, 600);
}
return out({ error: $q.cH, module: 'ins' }, 404);
} catch (e) {
return out({ error: $q.cI, message: String(e && e.message || e).slice(0, 160) }, 500);
}
}
