// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_stage__q, $s = TB.kbx_stage__s, $t = TB.kbx_stage__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
export const VERSION = 'stage-rules-1';
export const PATHS = /^\/api\/x\/stage(?:\/|$)/;
export const RULES = { optical_band_pts: 15, optical_window: 3, earthworks_after_clear_months: 3, radar_window: 3, footprint_cover_pct: 10, footprint_near_m: 75, already_built_pct: 50, min_clear_months: 6, start_grace_months: 6 };
const ORDER = ['none', 'cleared', 'earthworks', 'structure', 'roofed'];
const S = TB.kbx_stage_S ;
const t = (lang, k, v) => { const s = (S[lang] && S[lang][k]) || S.en[k]; return v && typeof s === $q.b ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
export const stageWord = (lang, s) => t(lang, 'st_' + s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.c, "'": '&#39;' }[c]));
const mi = s => { const m = String(s || '').match(/^(\d{4})-(\d{2})/); return m ? +m[1] * 12 + (+m[2] - 1) : null; };
const ym = i => Math.floor(i / 12) + '-' + String(i % 12 + 1).padStart(2, '0');
const med = a => { const v = a.slice().sort((x, y) => x - y), h = v.length >> 1; return v.length ? (v.length % 2 ? v[h] : (v[h - 1] + v[h]) / 2) : null; };
const r1 = v => Math.round(v * 10) / 10;
const sg = v => (v > 0 ? '+' : '') + v;
const relDate = r => String(r || '').replace(/\.\d+$/, '');
const pre = l => l === 'en' ? '' : '/' + l;
export function stages(rec, ix, rd, bd, ms, id) {
const R = RULES, B = R.optical_band_pts;
if (!rec || !rec.n || !rec.m0) return null;
const m0 = mi(rec.m0), n = rec.n;
const rr = rd && rd.projects && rd.projects[id] && rd.projects[id].status === 'ok' && rd.projects[id].y ? rd.projects[id] : null;
const band = rd && rd.band_db != null ? rd.band_db : null;
const bl = bd && bd.projects && bd.projects[id] || null;
const clearN = rec.c.filter(v => v != null).length;
if (!ix && !rr) return { enough: false, clear: clearN, months: [], latest: null };
const rel = bd ? relDate(bd.release) : '';
const bCover = bl && bl.n ? bl.cover_pct || 0 : 0;
const bFrom = bl && bl.n ? mi(bl.first_seen_min ? relDate(bl.first_seen_min) : rel) : null;
const bNear = bl && bl.b && bl.b.length ? Math.min(...bl.b.map(b => b.d == null ? 1e9 : b.d)) : null;
const bOk = bCover >= R.footprint_cover_pct && bFrom != null && bNear != null && bNear <= R.footprint_near_m;
const baseIdx = ix ? new Set([ix.first[0], ...ix.y.map((v, i) => v == null ? -1 : i).filter(i => i >= 0).slice(0, 3)]) : new Set();
const baseLabel = ix ? ym(m0 + ix.first[0]) : (rr ? rr.m0 : rec.m0);
const baseBuilt = ix ? med([...baseIdx].map(i => rec.b[i]).filter(v => v != null)) : null;
const built0 = baseBuilt != null && baseBuilt >= R.already_built_pct;
const hand = ms.filter(o => o.k === $q.d && !o.old).sort((a, b) => a.b - b.b).pop(), start = ms.filter(o => o.k === $q.e && !o.old).sort((a, b) => a.b - b.b).pop();
const out = []; let run = 0, ever = false, rEver = false, lastClear = null, firstUp = null;
const optHist = [];
for (let i = 0; i < n; i++) {
const M = m0 + i, reasons = [], sup = [];
let o = null, ox = null;
if (ix && ix.y[i] != null) {
optHist.push(ix.y[i]); lastClear = M;
ox = med(optHist.slice(-R.optical_window));
if (baseIdx.has(i)) o = 'base';
else if (ox >= B) { run++; o = run >= R.earthworks_after_clear_months ? $q.f : $q.g; ever = true; if (firstUp == null) firstUp = M; }
else if (ox <= -B) { run = 0; o = 'green'; }
else { run = 0; o = 'same'; }
}
let r = null, rx = null, rh = null;
if (rr && band != null) {
const j = M - mi(rr.m0);
if (j >= 0 && j < rr.n && rr.y[j] != null) {
const ys = [], hs = []; for (let q = j; q >= 0 && ys.length < R.radar_window; q--) if (rr.y[q] != null) { ys.push(rr.y[q]); if (rr.yh && rr.yh[q] != null) hs.push(rr.yh[q]); }
rx = r1(med(ys)); rh = hs.length ? r1(med(hs)) : null;
r = rx > band ? 'up' : rx < -band ? 'down' : 'flat';
if (r === 'up') rEver = true;
}
}
const bm = bOk && M >= bFrom;
if (o === 'base') reasons.push([$q.h, { m: ym(M) }]);
else if (o === $q.g || o === $q.f) reasons.push(['o_up', { x: sg(Math.round(ox)), base: baseLabel, k: run }]);
else if (o === 'green') reasons.push([$q.i, { x: Math.abs(Math.round(ox)), base: baseLabel }]);
else if (o === 'same') reasons.push([$q.j, { b: B, base: baseLabel }]);
else reasons.push(lastClear != null ? ['o_gap', { m: ym(lastClear) }] : [$q.k, {}]);
if (!rr) reasons.push(['r_na', {}]);
else if (r == null) reasons.push(['r_gap', {}]);
else { reasons.push([r === 'up' ? 'r_up' : r === 'down' ? $q.l : $q.m, { x: sg(rx), b: band }]); if (rh != null && rh < -band) reasons.push(['r_vh', { x: sg(rh) }]); }
if (bl) {
if (!bl.n) reasons.push(['b_no', { rel }]);
else if (bCover < R.footprint_cover_pct) reasons.push(['b_low', { p: bCover, t: R.footprint_cover_pct, rel }]);
else if (!bOk) reasons.push(['b_far', { d: bNear, t: R.footprint_near_m, rel }]);
else if (bm) reasons.push(bl.first_seen_min ? [$q.n, { n: bl.n, p: bCover, rel, d: relDate(bl.first_seen_min) }] : ['b_yes', { n: bl.n, p: bCover, rel }]);
else reasons.push([$q.o, { d: ym(bFrom) }]);
}
let s, c = null;
if (o == null && r == null && !bm) s = $q.p;
else if (o === 'base' && r !== 'up' && !bm) { s = 'base'; }
else if (bm && (ever || rEver)) { s = $q.q; sup.push('b'); if (ever) { sup.push('o'); if (o !== $q.g && o !== $q.f) reasons.push([$q.r, { b: B, m: ym(firstUp) }]); } if (rEver) sup.push('r'); }
else if (bm && (o === 'same' || o === 'base' || o == null) && r !== 'up' && built0) { s = 'none'; c = 'low'; reasons.push(['d_pre', { p: Math.round(baseBuilt), base: baseLabel }]); }
else if (bm && (o === 'same' || o === 'base' || o == null) && r !== 'up') { s = 'cant'; reasons.push(['d_bo', { base: baseLabel }]); }
else if (r === 'up' && o === 'same' && built0) { s = $q.s; sup.push('r'); reasons.push([$q.t, { p: Math.round(baseBuilt) }]); }
else if (r === 'up' && (o === 'same' || o === 'base')) { s = 'cant'; reasons.push(['d_ro', {}]); }
else if (r === 'up') { s = $q.s; sup.push('r'); if (o === $q.g || o === $q.f) sup.push('o'); }
else if (o === $q.g || o === $q.f) { s = o; sup.push('o'); if (o === $q.g && rh != null && rh < -band) sup.push('r'); }
else if (o === 'green' || (bm && o === 'green')) { s = 'cant'; reasons.push(['d_g', {}]); }
else if (o === 'same') { s = 'none'; sup.push('o'); if (r === 'flat') sup.push('r'); }
else if (r === 'flat') { s = 'none'; sup.push('r'); }
else if (r === 'down') { s = 'cant'; reasons.push(['d_rd', {}]); }
else s = $q.p;
if (ORDER.includes(s) && !c) {
const sustained = (sup.includes('o') && (s === 'none' ? optHist.length >= 3 : run >= 3)) || (sup.includes('r') && !sup.includes('o')) || s === $q.q;
c = sup.length >= 2 ? 'high' : sustained ? $q.u : 'low';
}
if (hand && M > hand.b && s !== $q.q) reasons.push([$q.v, { d: hand.d }]);
if (start && M > start.b + R.start_grace_months && (s === 'none' || s === 'base')) reasons.push([$q.w, { d: start.d }]);
out.push({ m: ym(M), s, c, r: reasons });
}
const enough = clearN >= R.min_clear_months || !!rr;
const latest = [...out].reverse().find(x => x.s !== $q.p) || null;
return { enough, clear: clearN, months: out, latest };
}
const SRC = { o: '/data/construction-progress.json', r: '/data/satellite-radar.json', b: '/data/buildings.json', d: '/promises/', p: '/promises/' };
function reasonText(lang, fd, code, p) {
const q = Object.assign({}, p);
for (const k of ['base', 'm', 'd', 'rel']) if (q[k] && /^\d{4}(-\d{2})?/.test(q[k])) q[k] = fd(q[k]);
if (q.rel) q.rel = q.rel;
return t(lang, code, q);
}
const srcOf = code => SRC[code[0]] || '';
export function stageHtml(est, lang, fd, id) {
if (!est) return '';
const head = '<h3>' + esc(t(lang, 'h')) + $q.x + esc(t(lang, 'intro')) + '</p>';
const links = $q.y + pre(lang) + $q.z + esc(t(lang, $q.A)) + $t.k0 + encodeURIComponent(id) + '">' + esc(t(lang, 'api')) + $q.B;
if (!est.enough || !est.latest) return $s.CSS + $q.C + head + '<p>' + esc(t(lang, 'thin', { c: est.clear })) + '</p>' + links + $q.D;
const L = est.latest;
const li = L.r.map(([code, p]) => '<li>' + esc(reasonText(lang, fd, code, p)) + (srcOf(code) ? $q.E + srcOf(code) + '">' + esc(code[0] === 'o' ? $q.F : code[0] === 'r' ? $q.G : code[0] === 'b' ? $q.H : t(lang, 'why')) + '</a>' : '') + '</li>').join('');
const now = $t.k1 + esc(t(lang, $q.I, { m: fd(L.m) })) + $q.J + esc(t(lang, $q.I, { m: fd(L.m) })) + $q.K + esc(stageWord(lang, L.s)) + $q.D +
(L.c ? '<div>' + esc(t(lang, 'conf', { c: t(lang, 'c_' + L.c) })) + $q.D : '') + $q.L + esc(t(lang, 'why')) + '">' + li + $q.M;
const M = est.months;
const rib = $t.k2 + M.map(x => $q.N + x.s + $q.O + esc(fd(x.m) + ': ' + stageWord(lang, x.s) + (x.c ? ' (' + t(lang, 'c_' + x.c) + ')' : '')) + $q.P).join('') + $q.D +
$t.k3 + esc(M[0].m.slice(0, 4)) + $q.Q + esc(M[Math.floor(M.length / 2)].m.slice(0, 4)) + $q.Q + esc(M[M.length - 1].m.slice(0, 4)) + $q.R;
const used = [...new Set(M.map(x => x.s))];
const lg = $q.S + ['base', 'none', $q.g, $q.f, $q.s, $q.q, 'cant', $q.p].filter(s => used.includes(s)).map(s => $q.T + s + $q.P + esc(stageWord(lang, s)) + '</li>').join('') + $q.U + esc(t(lang, 'leg')) + '</p>';
const th = t(lang, 'th');
const sigs = x => x.r.map(([code, p]) => code === 'o_up' || code === $q.i || code === $q.j ? (code === $q.j ? '' : t(lang, 's_o', { x: code === $q.i ? '-' + p.x : p.x })) : code === 'r_up' || code === $q.l || code === $q.m ? t(lang, 's_r', { x: p.x }) : code === 'b_yes' || code === $q.n ? t(lang, 's_b') : '').filter(Boolean).join(', ');
const rows = M.slice().reverse().map(x => $q.V + esc(fd(x.m)) + $q.W + esc(stageWord(lang, x.s)) + $q.W + esc(x.c ? t(lang, 'c_' + x.c) : '') + $q.W + esc(sigs(x)) + $q.X).join('');
const table = $q.Y + esc(t(lang, 'tbl')) + $t.k4 + th.map(h => $q.Z + esc(h) + '</th>').join('') + $q.aa + rows + $q.ab;
return $s.CSS + $q.C + head + now + rib + lg + $q.ac + esc(t(lang, 'lim')) + '</p>' + links + table + $q.D;
}
export function stageLabels(est, lang) {
const o = {}; if (!est || !est.enough) return o;
for (const x of est.months) o[x.m] = stageWord(lang, x.s) + (x.c ? ' (' + t(lang, 'c_' + x.c) + ')' : '');
return o;
}
function out(o, s, cc) { return new Response(JSON.stringify(o), { status: s || 200, headers: { 'content-type': $q.ad, 'access-control-allow-origin': '*', 'cache-control': cc || $q.ae } }); }
async function inputs(env, id) {
const ns = await import('./kbx_named_sat.js'), nm = await import('./kbx_named.js');
const sat = await ns.satData(env), ix = await nm.data(env), x = ix.byId.get(id);
if (!sat || !x) return null;
const rec = sat.projects && sat.projects[id]; if (!rec) return { x, rec: null };
const ms = ns.milestones(ix.prom[id] || [], x.fx || {});
return { x, rec, sat, ms, est: stages(rec, ns.index(rec), sat.space && sat.space.radar, sat.space && sat.space.bld, ms, id) };
}
export async function handle(req, u, env) {
if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: $q.af }, 405, $q.ag);
const q = u.pathname.replace(/\/+$/, '');
if (q === $q.ah) return out({ module: $q.ai, endpoints: { '/api/x/stage/<ID>': $s.k0 }, rules: RULES, version: VERSION, method: ORIGIN + $q.aj, licence: $t.k5 });
const id = decodeURIComponent(q.slice($q.ak.length)).toUpperCase().slice(0, 20);
if (!/^[A-Z]{1,6}-\d{1,4}$/.test(id)) return out({ error: $q.al }, 400, $q.am);
let d; try { d = await inputs(env, id); } catch (e) { return out({ error: $q.an }, 503, $q.ag); }
if (!d || !d.x) return out({ id, error: $q.ao }, 404, $q.ap);
if (!d.rec) return out({ id, error: $t.k6 }, 404, $q.ap);
const e = d.est;
return out({ id, name: d.x.n, page: ORIGIN + $q.aq + d.x.s + '/', version: VERSION, rules: RULES, enough: e.enough, clear_months: e.clear,
latest: e.latest && { month: e.latest.m, stage: e.latest.s, stage_text: stageWord('en', e.latest.s), confidence: e.latest.c, reasons: e.latest.r.map(([c, p]) => ({ code: c, text: t('en', c, p), params: p, source: srcOf(c) ? ORIGIN + srcOf(c) : null })) },
months: e.months.map(x => ({ month: x.m, stage: x.s, confidence: x.c, reasons: x.r.map(([c]) => c) })),
stages: Object.fromEntries(['base', 'none', $q.g, $q.f, $q.s, $q.q, 'cant', $q.p].map(s => [s, stageWord('en', s)])),
sources: { optical: ORIGIN + SRC.o, radar: ORIGIN + SRC.r, buildings: ORIGIN + SRC.b, promises: ORIGIN + $q.ar }, data_updated: { optical: d.sat.updated, radar: d.sat.space && d.sat.space.radar && d.sat.space.radar.updated || null, buildings: d.sat.space && d.sat.space.bld && d.sat.space.bld.updated || null },
caveat: S.en.lim, method: ORIGIN + $q.aj, licence: $s.k1 });
}
function methodBody(lang) {
const R = RULES, v = { a: R.already_built_pct, n: R.footprint_near_m, w: R.optical_window, t: R.footprint_cover_pct, b: R.optical_band_pts, e: R.earthworks_after_clear_months, c: R.min_clear_months };
const fill = s => s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m);
const keys = ['base', $q.q, $q.s, $q.f, $q.g, 'none'];
const rules = t(lang, $q.as).map((s, i) => $q.at + keys[i] + $q.au + esc(fill(s)) + '</li>').join('');
return $s.k2 + pre(lang) + $q.av + esc(t(lang, $q.aw)) + $q.ax + esc(t(lang, $q.ay)) + $q.az +
'<h2>' + esc(t(lang, $q.aA)) + $q.aB + t(lang, 'm_in').map(s => '<li>' + esc(fill(s)) + '</li>').join('') + $q.aC +
$t.k7 + esc(t(lang, $q.aD)) + $q.aE + rules + '</ol>' +
'<p>' + esc(fill(t(lang, $q.aF))) + $q.aG + esc(t(lang, $q.aH)) + $q.aI + esc(t(lang, $q.aJ)) + '</p>' +
'<h2>' + esc(t(lang, $q.aK)) + $t.k8 + esc(stageWord(lang, 'cant')) + $q.aL + t(lang, $q.aM).map(s => '<li>' + esc(fill(s)) + '</li>').join('') + $q.aC +
$t.k9 + esc(t(lang, $q.aN)) + $q.aI + esc(t(lang, 'm_lim')) + $q.aG + esc(t(lang, $q.aO)) + $q.aI + esc(t(lang, $q.aP)) + '</p>' +
$s.k3;
}
export async function method(req, u, env, ctx, shell) {
  const m = u.pathname.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?methods\/construction-stage(\/?)$/); if (!m || !shell) return null;
  if (!m[2]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': $q.aQ } });
  const lang = m[1] || 'en', path = $q.aj, url = ORIGIN + pre(lang) + path;
  const sh = await shell(pre(lang) + $q.aR);
  const ld = { '@context': $q.aS, '@graph': [{ '@type': $q.aT, '@id': url + $q.aU, headline: t(lang, $q.aw), description: t(lang, $q.aV), url, inLanguage: lang, dateModified: $q.aW, author: { '@type': $q.aX, name: $q.aY, url: ORIGIN + '/' }, publisher: { '@type': $q.aX, name: $q.aY, url: ORIGIN + '/' } },
    { '@type': $q.aZ, itemListElement: [{ '@type': $q.ba, position: 1, name: $q.aY, item: ORIGIN + pre(lang) + '/' }, { '@type': $q.ba, position: 2, name: t(lang, $q.aw), item: url }] }] };
  const alts = LANGS.map(l => $q.bb + l + $q.bc + ORIGIN + pre(l) + path + '">').join('') + $q.bd + ORIGIN + path + '">';
  const tags = $q.be + esc(t(lang, $q.aw)) + $q.bf + esc(t(lang, $q.aV)) + $q.bg + url + '">' + alts +
    $q.bh + esc(t(lang, $q.aw)) + $q.bi + esc(t(lang, $q.aV)) + $q.bj + url + $q.bk +
    $q.bl + JSON.stringify(ld).replace(/</g, $q.bm) + $q.bn + $q.a;
  const res = new HTMLRewriter()
    .on('html', { element(e) { e.setAttribute('lang', lang); if (lang === 'ar') e.setAttribute('dir', 'rtl'); else e.removeAttribute('dir'); } })
    .on('title', { element(e) { e.remove(); } })
    .on($q.bo, { element(e) { e.remove(); } })
    .on($q.bp, { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(methodBody(lang), { html: true }); } })
    .on($q.bq, { element(e) { const l = e.getAttribute($q.br); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + path); } })
    .transform(new Response(sh.body, { headers: { 'content-type': $q.bs } }));
  return new Response(await res.text(), { status: 200, headers: { 'content-type': $q.bs, 'cache-control': $q.ae } });
}
