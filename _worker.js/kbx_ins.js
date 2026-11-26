// comments: _notes/kolaboro-worker-comments.txt
import * as KB from './kolaboro.js';
import { TB } from './kbx_strings.js';
const { json, claude, openData, rateLimited, qnorm } = KB;
export const PATHS = /^\/api\/x\/ins(\/|$)/;
const SITE = 'https://kolaboro.com';
const ID_RE = /^[A-Z]{2,5}-[0-9]{3,4}$/;
const CHECKS = ['permit', 'escrow', 'progress', 'plans', 'record', 'returns_ok'];
const CONFIRMED = ['registry', 'independent'];
const NAME = { permit: 'Permit or licence number', escrow: 'Deposit protection', progress: 'Construction progress', plans: 'Site or floor plans', record: 'Developer track record', returns_ok: 'No guaranteed returns' };
const WHAT = {
permit: 'an official permit or sales licence number a buyer can look up',
escrow: 'escrow, a bank guarantee or a trust account for buyer payments',
progress: 'a percentage built or dated progress updates',
plans: 'site or floor plans a buyer can compare with the contract',
record: 'past projects delivered, stated in public',
returns_ok: 'no "guaranteed" rental return language in the marketing'
};
const LVL = { registry: 'confirmed on an official register', independent: 'confirmed by an independent source (regulator notice, court record, filing or major newspaper)', developer: 'stated only by the developer, its agents or listing portals', contradicted: 'contradicted: sources disagree with the developer', none: 'no source found' };
const TIER = { clear: 'Strong public disclosure', mixed: 'Some gaps', caution: 'Check carefully' };
const METHOD = { scoring: SITE + '/open/scoring.py', how: SITE + '/how-we-score', levels: SITE + '/database', whatif: SITE + '/p/whatif.js' };
function out(o, s = 200, maxAge) {
  return new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': maxAge ? 'public, max-age=' + maxAge : 'no-store' } });
}
const MEMO = {};
async function file(env, name) {
  const m = MEMO[name]; if (m && Date.now() - m.t < 300000) return m.v;
  let v = null;
  try { const r = await env.ASSETS.fetch(new Request(SITE + '/_s/kolaboro.com/data/' + name)); if (r.ok) v = await r.json(); } catch (e) {}
  if (!v) { try { const r = await fetch(SITE + '/data/' + name, { cf: { cacheTtl: 300, cacheEverything: true } }); if (r.ok) v = await r.json(); } catch (e) {} }
  MEMO[name] = { t: Date.now(), v }; return v;
}
let DG = { t: 0, v: null };
async function digestData(env) {
if (DG.v && Date.now() - DG.t < 300000) return DG.v;
let h = null;
try { const r = await env.ASSETS.fetch(new Request(SITE + '/_s/kolaboro.com/digest/index.html')); if (r.ok) h = await r.text(); } catch (e) {}
if (!h) { try { const r = await fetch(SITE + '/digest/', { cf: { cacheTtl: 300 } }); if (r.ok) h = await r.text(); } catch (e) {} }
const m = h && h.match(/<script[^>]*id="digest-data"[^>]*>([\s\S]*?)<\/script>/);
let v = null; try { v = m ? JSON.parse(m[1].replace(/<\\\//g, '</')) : null; } catch (e) {}
DG = { t: Date.now(), v }; return v;
}
const xesc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
function feed(D) {
const items = (D.weeks || []).slice().sort((a, b) => a.id < b.id ? 1 : -1).filter(w => w.intro).map(w => {
const link = SITE + '/digest/' + (w.id === D.latest ? '' : '#w-' + w.id);
return '<item><title>' + xesc('Kolaboro weekly digest, week ' + (+w.id.slice(5)) + ' ' + w.id.slice(0, 4) + (w.partial ? ' (to date)' : '')) + '</title><link>' + xesc(link) + TB.kbx_ins__t.k0 + w.id + (w.partial ? '-' + w.to : '') + '</guid><pubDate>' + new Date(w.generated).toUTCString() + '</pubDate><description>' + xesc(w.intro.text) + '</description></item>';
}).join('');
return TB.kbx_ins__s.k0 + SITE + '/digest/</link><atom:link href="' + SITE + TB.kbx_ins__s.k1 + items + '</channel></rss>\n';
}
async function cases(env) { const d = (await file(env, 'bali-cases.json')) || (await openData()); return d; }
const met = (ck, k) => k === 'permit' ? ck.permit === 2 : k === 'escrow' ? ck.escrow === true : k === 'progress' ? ck.progress !== null && ck.progress !== undefined : !!ck[k];
const level = t => { t = String(t == null ? 'none' : t).toLowerCase(); for (const l of ['registry', 'independent', 'developer', 'contradicted', 'none']) if (t.includes(l)) return l; return 'none'; };
const scoreOf = ck => CHECKS.reduce((a, k) => a + (met(ck || {}, k) ? 1 : 0), 0);
const vscoreOf = v => Object.keys(v || {}).filter(k => CONFIRMED.includes(level(v[k]))).length;
const tierOf = (s, flags, researched) => ((flags && flags.length) || s <= 1) ? 'caution' : s >= (researched === 3 ? 3 : 4) ? 'clear' : 'mixed';
export function explain(c) {
const ck = c.checks || {}, V = c.verified || {}, flags = c.flags || [], researched = (ck.researched && ck.researched.length) ? ck.researched : CHECKS;
const s = scoreOf(ck), vs = vscoreOf(V), tier = tierOf(s, flags, researched.length), mx = c.max || 6;
const rows = CHECKS.map(k => {
const pub = met(ck, k), lv = level(V[k]), res = researched.includes(k);
let state, text;
if (!res) { state = 'not_researched'; text = NAME[k] + TB.kbx_ins__t.k1; }
else if (pub) { state = CONFIRMED.includes(lv) ? 'published_confirmed' : lv === 'contradicted' ? 'published_contradicted' : 'published'; text = NAME[k] + ': published (' + WHAT[k] + '). Source level: ' + LVL[lv] + '.'; }
else if (k === 'permit' && ck.permit === 1) { state = 'claimed'; text = NAME[k] + TB.kbx_ins__s.k2; }
else if (k === 'returns_ok') { state = 'missing'; text = NAME[k] + TB.kbx_ins__t.k2; }
else { state = 'missing'; text = NAME[k] + ': not published (we look for ' + WHAT[k] + ').'; }
return { check: k, name: NAME[k], published: pub, level: lv, researched: res, state, text };
});
const pubRows = rows.filter(r => r.published), miss = rows.filter(r => !r.published && r.researched);
const unconf = pubRows.filter(r => !CONFIRMED.includes(r.level)), contra = rows.filter(r => r.level === 'contradicted');
const raise = [];
miss.forEach(r => {
const s2 = s + 1, t2 = tierOf(s2, flags, researched.length);
raise.push({ check: r.check, kind: 'publish', text: (r.check === 'returns_ok' ? TB.kbx_ins__t.k3 : 'If the developer published ' + WHAT[r.check]) + ': published ' + s + ' to ' + s2 + ' of ' + mx + (t2 !== tier ? ', tier "' + TIER[tier] + '" to "' + TIER[t2] + '"' : '') + '.', score: [s, s2], tier: [tier, t2] });
});
unconf.forEach(r => raise.push({ check: r.check, kind: 'confirm', text: TB.kbx_ins__t.k4 + r.name.toLowerCase() + ': confirmed ' + vs + ' to ' + (vs + 1) + ' of 6.', vscore: [vs, vs + 1] }));
if (flags.length) raise.push({ kind: 'flags', text: 'While ' + (flags.length === 1 ? 'a problem appears' : flags.length + ' problems appear') + TB.kbx_ins__t.k5 + TIER.caution + TB.kbx_ins__t.k6 });
const summary = c.id + ' publishes ' + s + ' of the ' + mx + ' things a careful buyer needs' + (s ? ' (' + pubRows.map(r => r.name.toLowerCase()).join(', ') + ')' : '') + '. ' +
(vs ? vs + ' of them ' + (vs === 1 ? 'is' : 'are') + TB.kbx_ins__t.k7 : TB.kbx_ins__s.k3) + ' ' +
'Tier: "' + TIER[tier] + '"' + (flags.length ? ', because public reports show ' + (flags.length === 1 ? 'a problem' : flags.length + ' problems') + '.' : s <= 1 ? TB.kbx_ins__t.k8 : s >= (researched.length === 3 ? 3 : 4) ? ', because ' + s + TB.kbx_ins__t.k9 : ', because ' + s + ' checks are published (' + (researched.length === 3 ? 3 : 4) + ' are needed for "' + TIER.clear + '").');
const cl = c.claims || {};
return {
id: c.id, market: c.market, country: c.country, stage: c.stage || null, checked: c.checked || null,
score: s, vscore: vs, max: mx, tier, tier_name: TIER[tier],
matches_published: s === (c.score || 0) && vs === (c.vscore || 0) && tier === c.tier,
summary, checks: rows,
published: pubRows.map(r => r.check), missing: miss.map(r => r.check), not_researched: rows.filter(r => !r.researched).map(r => r.check),
unconfirmed: unconf.map(r => r.check), contradicted: contra.map(r => r.check),
claims: { verified: cl.verified || 0, unverified: cl.unverified || 0, contradicted: cl.contradicted || 0, text: (cl.verified || cl.unverified || cl.contradicted) ? TB.kbx_ins__t.k10 + (cl.verified || 0) + ' verified, ' + (cl.unverified || 0) + ' unverified, ' + (cl.contradicted || 0) + TB.kbx_ins__t.k11 : null },
flags, raise,
caveat: TB.kbx_ins__s.k4,
rules: TB.kbx_ins__s.k5 + TIER.caution + TB.kbx_ins__t.k12 + TIER.clear + TB.kbx_ins__t.k13 + TIER.mixed + '".',
method: METHOD, language: 'en', language_note: TB.kbx_ins__s.k6,
links: { project: SITE + '/p/' + encodeURIComponent(c.id) + '/', explain: SITE + '/explain/?id=' + encodeURIComponent(c.id) }
};
}
function flat(prefix, v, outArr, depth) {
if (v === null || v === undefined || v === '') return;
if (Array.isArray(v)) { if (!v.length) return; if (v.every(x => typeof x !== 'object')) { outArr.push([prefix, v.join('; ')]); return; } v.slice(0, 12).forEach((x, i) => flat(prefix + '[' + i + ']', x, outArr, depth + 1)); return; }
if (typeof v === 'object') { if (depth > 3) return; Object.keys(v).forEach(k => flat(prefix + '.' + k, v[k], outArr, depth + 1)); return; }
outArr.push([prefix, String(v)]);
}
export async function evidence(env, id) {
const d = await cases(env); const c = ((d && d.cases) || []).find(x => x.id === id);
if (!c) return null;
const [pr, ot, hz, rc, st, dr] = await Promise.all(['promises.json', 'on-time.json', 'hazards.json', 'register-checks.json', 'stalled-sites.json', 'promise-drift.json'].map(n => file(env, n)));
const L = [];
const REN = { id: 'id', market: 'market', country: 'country', region: 'region', stage: 'stage', band: 'price_band', done: 'advertised_completion_year', title: 'title_type', lease: 'lease_years', units: 'units', yield: 'advertised_yield_pct', score: 'checks_published', max: 'checks_total', vscore: 'checks_confirmed', tier: 'tier', delay: 'months_handover_date_moved', overdue: 'months_past_handover', checked: 'last_checked', flags: 'problems_in_public_reports' };
const rec = {}; Object.keys(REN).forEach(k => { rec[REN[k]] = k === 'tier' && c.tier ? TIER[c.tier] || c.tier : c[k]; });
flat('record', rec, L, 0);
(c.q || []).slice(0, 8).forEach((x, i) => L.push(['record.question_to_ask[' + i + ']', String(x)]));
const ck = c.checks || {}, rs = ck.researched && ck.researched.length ? ck.researched : CHECKS;
const read = {}; CHECKS.forEach(k => { read[NAME[k]] = !rs.includes(k) ? 'not researched' : met(ck, k) ? (k === 'progress' && typeof ck.progress === 'number' ? 'published (' + ck.progress + '% built stated)' : 'published') : k === 'permit' && ck.permit === 1 ? 'permit claimed, no number published' : k === 'returns_ok' ? TB.kbx_ins__t.k14 : 'not published'; });
flat('record.checks', read, L, 1);
flat('record.verified', c.verified, L, 1); flat('record.claims', c.claims, L, 1);
flat('record.page_changes', (c.history || []).map(h => ({ date: h.d, change: h.f, from: h.from, to: h.to })), L, 1);
if (c.sat) flat('record.satellite', c.sat, L, 1);
if (c.register) flat('record.register', c.register, L, 1);
const P = pr && pr.projects && pr.projects[id];
if (P) flat('promises', P.map(p => ({ kind: (pr.kinds || {})[p.k] || p.k, promised_date: p.d, status: p.st, status_meaning: (pr.statuses || {})[p.st], times_moved: p.mv, months_moved: p.mm, last_seen: p.seen, earlier_dates: (p.hist || []).map(h => h.d).filter(x => x !== p.d) })), L, 1);
const T = ot && ot.projects && ot.projects[id];
if (T) flat('timeline', { status: T.s, advertised_handover: T.cur, first_handover_on_record: T.first, months_moved: T.moved, months_overdue: T.overdue, months_to_first_handover: T.to_first }, L, 1);
const D = dr && dr.projects && dr.projects[id];
if (D && (D.changes || []).length) flat('timeline.page_value_changes', D.changes.slice(0, 10).map(x => ({ field: x.label, from: x.from, to: x.to, first_seen: x.first_seen, reverted: x.reverted })), L, 1);
const H = hz && hz.projects && hz.projects[id];
if (H) flat('hazards', H, L, 1);
const R = rc && rc.projects && rc.projects[id];
if (R) flat('checks.register', { register: R.register, item: R.item, status: R.status, checked: R.checked }, L, 1);
const S = st && st.projects && st.projects[id];
if (S) flat('checks.satellite_site', { status: S.status, clear_quarters: (S.clear_quarters || []).length, change_pct_last_quarter: S.change_pct_last, no_visible_change_months: S.no_visible_change_months }, L, 1);
const lines = L.slice(0, 160).map((x, i) => ({ e: 'E' + (i + 1), field: x[0], value: x[1].slice(0, 300) }));
return { id, updated: d.updated, case: c, lines, sources: { record: '/data/bali-cases.json', promises: P ? '/data/promises.json' : null, timeline: T ? '/data/on-time.json' : null, hazards: H ? '/data/hazards.json' : null, register: R ? '/data/register-checks.json' : null, satellite: S ? '/data/stalled-sites.json' : null } };
}
const numsIn = t => (String(t).match(/\d+(?:[.,]\d+)?/g) || []).map(n => n.replace(',', '.'));
async function ask(req, env, ctx) {
if (!env.ANTHROPIC_API_KEY) return out({ error: 'not_configured' }, 503);
let b; try { const t = await req.text(); if (t.length > 4000) return out({ error: 'bad_request' }, 400); b = JSON.parse(t); } catch (e) { return out({ error: 'bad_request' }, 400); }
const id = String(b.id || '').trim().toUpperCase(), q = String(b.q || '').replace(/\s+/g, ' ').trim().slice(0, 300);
if (!ID_RE.test(id)) return out({ error: 'id' }, 400);
if (q.length < 6) return out({ error: 'question' }, 400);
const ev = await evidence(env, id); if (!ev) return out({ error: 'unknown_project' }, 404);
const ck = new Request(SITE + '/__kb_ins_ask/' + encodeURIComponent(id + '|' + ev.updated + '|' + q.toLowerCase().replace(/[?!.]+$/, '')));
const hit = await caches.default.match(ck); if (hit) return out({ ...(await hit.json()), cached: true });
if (await rateLimited(req, ctx)) return out({ error: 'rate', message: TB.kbx_ins__t.k15 }, 429);
const ctxt = ev.lines.map(l => l.e + ' ' + l.field + ': ' + l.value).join('\n');
let o; try { o = await claude(env, TB.kbx_ins__s.ASK1_PROMPT + '\n\nPROJECT ' + id + ' (data updated ' + ev.updated + ')\n' + ctxt + '\n\nQUESTION: ' + q, null, null, 1200); }
catch (e) { return out({ error: e && e.budget ? 'budget' : 'model', message: e && e.budget ? TB.kbx_ins__t.k16 : TB.kbx_ins__t.k17 }, 503); }
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
if (answerable && !good.length) { answerable = false; refused = 'no_valid_citation'; }
else if (answerable && loose.length) { answerable = false; refused = 'number_not_in_cited_evidence'; }
const res = { id, q, updated: ev.updated, answerable, refused,
answer: answerable ? answer : (refused ? TB.kbx_ins__s.k7 : answer || TB.kbx_ins__t.k18),
citations: answerable ? good : [], rejected_citations: cites.filter(c => !c.quote_found).map(c => c.e), unbacked_numbers: loose.slice(0, 6),
model: claude.lastModel || null, evidence_lines: ev.lines.length,
note: TB.kbx_ins__s.k8 };
ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify(res), { headers: { 'content-type': 'application/json', 'cache-control': 'max-age=86400' } })));
return out(res);
}
export async function indices(env, market) {
const [d, di, pr, hz, gg, cg, iw, pi] = await Promise.all([cases(env), file(env, 'delay-index.json'), file(env, 'promises.json'), file(env, 'hazards.json'), file(env, 'company-graph-global.json'), file(env, 'company-graph.json'), file(env, 'insolvency-watch.json'), file(env, 'price-index.json')]);
const C = ((d && d.cases) || []).filter(c => c.market === market);
if (!C.length) return null;
const ids = new Set(C.map(c => c.id)), I = [];
const thin = (key, label, href, why) => I.push({ key, label, status: 'thin', href, text: 'Not enough data: ' + why });
const dm = di && (di.markets || []).find(m => m.market === market), minS = (di && di.rules && di.rules.min_sample) || 5;
if (dm && dm.share_past_first !== null && dm.share_past_first !== undefined) I.push({ key: 'delay', label: 'Delay index', status: 'ok', href: '/index/delays/', value: dm.share_past_first + '%', text: dm.past_first + ' of ' + dm.with_date + TB.kbx_ins__t.k19 + (dm.median_late !== null && dm.median_late !== undefined ? ', median ' + dm.median_late + ' months late' : '') + '. ' + dm.moved + ' had their date moved.', n: dm.with_date, as_of: di.generated });
else thin('delay', 'Delay index', '/index/delays/', (dm ? dm.with_date : 0) + ' dated projects, the index needs ' + minS + '.');
const pm = pr && (pr.markets || []).find(m => m.market === market);
if (pm && pm.promises >= 5) I.push({ key: 'promises', label: 'Promises kept, broken, moved', status: 'ok', href: '/promises/', value: pm.kept + ' / ' + pm.broken + ' / ' + pm.moved, text: 'Of ' + pm.promises + ' dated promises on ' + pm.projects + ' projects: ' + pm.kept + ' kept, ' + pm.broken + ' broken, ' + pm.moved + ' moved and still ahead, ' + pm.pending + ' pending, ' + pm.unknown + ' unknown.', n: pm.promises, as_of: pr.updated });
else thin('promises', 'Promises kept, broken, moved', '/promises/', (pm ? pm.promises : 0) + TB.kbx_ins__t.k20);
const H = hz && hz.projects ? Object.keys(hz.projects).filter(k => ids.has(k)).map(k => hz.projects[k]) : [];
if (H.length) {
const fl = H.filter(h => (h.flood_river_m || 0) > 0 || (h.flood_coast_m || 0) > 0).length, q6 = H.filter(h => ((h.quakes || {}).m6 || 0) > 0).length, vo = H.filter(h => h.volcano && h.volcano.name).length, ts = H.filter(h => ((h.tsunami || {}).runups || 0) > 0).length;
I.push({ key: 'hazards', label: 'Natural hazards', status: H.length >= 3 ? 'ok' : 'thin', href: '/hazards/', value: H.length + ' located', text: 'Of ' + H.length + ' project' + (H.length === 1 ? '' : 's') + ' with a public location: ' + fl + TB.kbx_ins__t.k21 + q6 + TB.kbx_ins__t.k22 + ts + ' with tsunami run-ups within 50 km, ' + vo + ' within 100 km of a Holocene volcano.' + (H.length < 3 ? TB.kbx_ins__t.k23 : ''), n: H.length, as_of: hz.updated });
} else thin('hazards', 'Natural hazards', '/hazards/', TB.kbx_ins__t.k24);
const gm = gg && gg.markets && gg.markets[market];
const uk = cg && cg.projects ? Object.keys(cg.projects).filter(k => ids.has(k) && (cg.projects[k].resolved || 0) > 0).length : 0;
if (gm && gm.checked >= 3) I.push({ key: 'graph', label: 'Company graph share', status: 'ok', href: '/graph/global/', value: Math.round((gm.projects_with_lei / gm.checked) * 100) + '%', text: gm.projects_with_lei + ' of ' + gm.checked + TB.kbx_ins__t.k25 + (gm.projects_lei_not_issued ? ' (' + gm.projects_lei_not_issued + ' with a lapsed or retired LEI)' : '') + '.' + (uk ? ' ' + uk + TB.kbx_ins__t.k26 : ''), n: gm.checked, as_of: String(gg.updated || '').slice(0, 10) });
else thin('graph', 'Company graph share', '/graph/global/', (gm ? gm.checked : 0) + TB.kbx_ins__t.k27);
const im = iw && iw.markets && iw.markets[market];
if (im && im.names_checked > 0) I.push({ key: 'insolvency', label: 'Insolvency watch', status: 'ok', href: '/tools/insolvency-check/', value: String(im.projects_with_notice), text: im.projects_with_notice + ' of ' + im.projects_with_names + TB.kbx_ins__t.k28 + im.source + ' (' + im.names_checked + ' company names checked daily, ' + im.projects + ' projects in the market).', n: im.names_checked, as_of: String(iw.updated || '').slice(0, 10) });
else if (im) thin('insolvency', 'Insolvency watch', '/tools/insolvency-check/', 'covered by ' + im.source + TB.kbx_ins__t.k29);
else thin('insolvency', 'Insolvency watch', '/tools/insolvency-check/', TB.kbx_ins__t.k30 + C[0].country + TB.kbx_ins__t.k31);
const pmk = pi && (pi.markets || []).find(m => m.market === market), last = pmk && pmk.index && pmk.index[pmk.index.length - 1], first = pmk && pmk.index && pmk.index[0];
const minP = (pi && pi.rules && pi.rules.min_pairs_per_link) || 5;
if (last && last.pairs >= minP) I.push({ key: 'prices', label: 'Asking-price index', status: 'ok', href: '/index/prices/', value: (+last.index).toFixed(1), text: TB.kbx_ins__t.k32 + (+last.index).toFixed(1) + ' on ' + last.date + ' against 100 on ' + first.date + ', from ' + last.pairs + TB.kbx_ins__t.k33 + pmk.changes_total + TB.kbx_ins__t.k34, n: last.pairs, as_of: pi.generated });
else thin('prices', 'Asking-price index', '/index/prices/', (last ? last.pairs : 0) + TB.kbx_ins__t.k35 + minP + '.');
return { market, country: C[0].country, projects: C.length, updated: d.updated, indices: I, note: TB.kbx_ins__s.k9 };
}
export async function handle(req, u, env, ctx) {
const p = u.pathname.replace(/\/+$/, '');
try {
if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type' } });
if (p === '/api/x/ins' || p === '/api/x/ins/status') {
const [d, dg] = await Promise.all([cases(env), digestData(env)]);
return out({ module: 'ins', projects: ((d && d.cases) || []).length, updated: d && d.updated, ask: !!env.ANTHROPIC_API_KEY, digest: dg ? { latest: dg.latest, weeks: (dg.weeks || []).length, generated: dg.generated, changes_generated: (dg.changes || {}).generated } : null,
endpoints: ['/api/x/ins/explain?id=', '/api/x/ins/evidence?id=', 'POST /api/x/ins/ask {id,q}', '/api/x/ins/indices?market=', '/api/x/ins/digest.json', '/api/x/ins/feed.xml'], pages: ['/digest/', '/digest/#changes', '/explain/?id='] }, 200, 60);
}
if (p === '/api/x/ins/digest.json' || p === '/api/x/ins/feed.xml') {
const D = await digestData(env);
if (!D) return out({ error: 'not_built_yet', message: TB.kbx_ins__t.k36 }, 503);
if (p.endsWith('.json')) return out(D, 200, 300);
return new Response(feed(D), { headers: { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=600', 'access-control-allow-origin': '*' } });
}
if (p === '/api/x/ins/explain' || p === '/api/x/ins/evidence') {
const id = String(u.searchParams.get('id') || '').trim().toUpperCase();
if (!ID_RE.test(id)) return out({ error: 'id', message: 'Give a project id such as BALI-014.' }, 400);
if (p.endsWith('/evidence')) { const ev = await evidence(env, id); if (!ev) return out({ error: 'unknown_project' }, 404); const { case: _c, ...rest } = ev; return out(rest, 200, 300); }
const d = await cases(env); const c = ((d && d.cases) || []).find(x => x.id === id);
if (!c) return out({ error: 'unknown_project', message: 'No tracked project has the id ' + id + '.' }, 404);
return out(Object.assign({ updated: d.updated }, explain(c)), 200, 300);
}
if (p === '/api/x/ins/ask') { if (req.method !== 'POST') return out({ error: 'method' }, 405); return await ask(req, env, ctx); }
if (p === '/api/x/ins/indices') {
const m = String(u.searchParams.get('market') || '').trim().slice(0, 60);
if (!m) return out({ error: 'market' }, 400);
const d = await cases(env); const all = [...new Set(((d && d.cases) || []).map(c => c.market))];
const norm = s => s.toLowerCase().replace(/[-_+]+/g, ' ').replace(/\s+/g, ' ').trim();
const name = all.find(x => norm(x) === norm(m));
if (!name) return out({ error: 'unknown_market' }, 404);
return out(await indices(env, name), 200, 600);
}
return out({ error: 'not found', module: 'ins' }, 404);
} catch (e) {
return out({ error: 'server', message: String(e && e.message || e).slice(0, 160) }, 500);
}
}
