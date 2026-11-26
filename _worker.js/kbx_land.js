// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_land__q, $s = TB.kbx_land__s, $t = TB.kbx_land__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
export const PATHS = /^\/api\/x\/land(\/|$)/;
let MEMO = {};
async function loadOne(env, name) {
const m = MEMO[name]; if (m && Date.now() - m.t < 600000) return m.v;
let r = null;
try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + $q.a + name)); } catch (e) { r = null; }
if (!r || !r.ok) { try { r = await fetch(ORIGIN + $q.b + name + '?w=1', { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
const v = r && r.ok ? await r.json().catch(() => null) : null;
MEMO[name] = { t: Date.now(), v }; return v;
}
export async function landData(env) {
const [lr, mh, hz] = await Promise.all([loadOne(env, $q.c), loadOne(env, $q.d), loadOne(env, $q.e)]);
return { lr, mh, hz, v: ((lr && lr.updated) || '') + '/' + ((mh && mh.updated) || '') + '/' + ((hz && hz.updated) || '') };
}
const S = TB.kbx_land_S ;
const t = (lang, k, v) => { const s = (S[lang] && S[lang][k]) || S.en[k]; return v && typeof s === $q.f ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
const tm = (lang, k, key) => ((S[lang] && S[lang][k]) || {})[key] || (S.en[k] || {})[key] || null;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.g, "'": '&#39;' }[c]));
const cm = lang => lang === 'ar' ? '، ' : lang === 'zh' ? '，' : ', ';
const okU = u => typeof u === $q.f && /^https:\/\/[^\s"<>]+$/.test(u);
export const landToc = lang => t(lang, 'toc');
export const landHeading = lang => t(lang, 'h');
export const histToc = lang => t(lang, 'mtoc');
export const histHeading = lang => t(lang, 'mh');
const nmf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'n' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.NumberFormat(L, o)); };
const num = (v, lang) => { try { return nmf(lang === 'en' ? 'en-GB' : lang).format(v); } catch (e) { return String(v); } };
const src = (href, label) => okU(href) ? $q.h + esc(href) + $q.i + esc(label) + '</a>' : '';
export function landHtml(ld, x, lang, fd) {
const lr = ld && ld.lr, r = lr && lr.projects && lr.projects[x.id];
if (!r) return '';
const S0 = lr.sources || {}, acc = r.acc || 100, lat = (x.fx || {}).lat, lng = (x.fx || {}).lng, ck = fd(r.checked || lr.updated);
const m = v => t(lang, 'about', { m: num(v, lang) });
const rows = [];
if (r.n2k || (r.scope || []).includes('n2k')) {
const n = r.n2k || {}, s = S0.n2k || {}, rel = n.release ? fd(n.release) : '';
let dd;
const site = o => '<bdi>' + esc(o.name || o.code) + $q.j + esc(o.code) + ', ' + esc(tm(lang, 'ty', o.type) || o.type || '') + ')' + (okU(s.sdf) ? ' ' + src(s.sdf + encodeURIComponent(o.code), t(lang, 'sdf')) : '');
if (!n.ok) dd = $q.k + esc(t(lang, 'unav', { d: ck })) + $q.l;
else if ((n.in || []).length) dd = n.in.map(o => esc(t(lang, 'n2in', { n: o.name || o.code, c: o.code, t: tm(lang, 'ty', o.type) || o.type || '' })) + (okU(s.sdf) ? ' ' + src(s.sdf + encodeURIComponent(o.code), t(lang, 'sdf')) : '')).join('<br>') +
((n.near || []).length ? $q.m + n.near.map(o => '<li>' + site(o) + ', ' + esc(m(o.d)) + '</li>').join('') + '</ul>' : '');
else if ((n.near || []).length) dd = esc(t(lang, $q.n)) + $q.m + n.near.map(o => '<li>' + site(o) + ', ' + esc(m(o.d)) + '</li>').join('') + '</ul>';
else dd = esc(t(lang, $q.o));
rows.push([t(lang, 'n2k'), dd + ' ' + src(s.url, t(lang, 'n2src', { r: rel || '?' }))]);
}
if (r.es) {
const e = r.es, s = S0.es || {};
let dd = !e.ok ? $q.k + esc(t(lang, 'unav', { d: ck })) + $q.l : esc(e.sea_m === 0 ? t(lang, 'sea0') : e.sea_m == null ? t(lang, $q.p) : t(lang, 'sea', { m: num(e.sea_m, lang) }));
dd += '<br>' + esc(t(lang, 'eslaw')) + ' ' + src(s.law, t(lang, 'law'));
if (e.ok && e.sea_m != null && e.sea_m <= 600) dd += '<br>' + esc(t(lang, $q.q));
dd += $q.r + esc(e.mit === $q.s ? t(lang, $q.t) : t(lang, 'esmit', { d: fd(((s.miteco || {}).checked) || r.checked) })) + $q.u + src(s.viewer, t(lang, $q.v));
rows.push([t(lang, 'es'), dd]);
}
if ((r.scope || []).includes('eng')) {
const e = r.eng || {}, s = S0.eng || {};
const open = lat != null ? $t.k0 + (+lat).toFixed(5) + ',' + (+lng).toFixed(5) + ',16z' : $q.w;
let dd;
if (!e.ok) dd = $q.k + esc(t(lang, $q.x, { d: ck })) + $q.u + src(open, t(lang, $q.y));
else if ((e.hits || []).length) dd = $q.m + e.hits.map(h => '<li>' + esc(tm(lang, 'ds', h.ds) || h.ds) + (h.name ? $q.z + esc(h.name) + $q.A : '') + ', ' + esc(h.in ? t(lang, 'engin') : m(h.d)) +
(h.entity ? ' ' + src($t.k1 + encodeURIComponent(h.entity), (h.ref || String(h.entity))) : '') + '</li>').join('') + '</ul>';
else dd = esc(t(lang, $q.B, { l: (s.datasets || []).map(k => tm(lang, 'ds', k) || k).join(', ') }));
rows.push([t(lang, 'eng'), dd + ' ' + src(s.url, t(lang, $q.C))]);
}
if ((r.scope || []).includes('sco')) rows.push([t(lang, 'sco'), esc(t(lang, 'scotx')) + ' ' + src($q.D, t(lang, $q.E))]);
if (r.osm) {
const o = r.osm, s = S0.osm || {}, kn = k => tm(lang, 'kind', k) || k;
let dd;
if (!o.ok) dd = $q.k + esc(t(lang, 'unav', { d: ck })) + $q.l;
else {
dd = (o.in || []).map(a => esc(t(lang, 'osin', { k: kn(a.kind), n: a.name ? '"' + a.name + '"' : '' }).replace(/\s+\./, '.'))).join('<br>');
if ((o.near || []).length) dd += (dd ? '<br>' : esc(t(lang, $q.F))) + $q.m + o.near.map(a => '<li>' + esc(kn(a.kind)) + (a.name ? $q.G + esc(a.name) + $q.H : '') + ', ' + esc(m(a.d)) + '</li>').join('') + '</ul>';
if (!dd) dd = esc(t(lang, $q.I));
}
rows.push([t(lang, 'osm'), dd + $q.J + esc(t(lang, 'oslim')) + $q.u + src(s.url, t(lang, 'ossrc', { b: fd(o.build || s.build || lr.updated) }))]);
}
if (!rows.length) return '';
const q = lat != null ? '?lat=' + (+lat).toFixed(4) + '&lng=' + (+lng).toFixed(4) : '';
return $s.CSS + $q.K + esc(t(lang, 'intro', { d: ck, a: num(acc, lang) })) + '</p>' +
$q.L + rows.map(([a, b]) => '<dt>' + esc(a) + $q.M + b + '</dd>').join('') + '</dl>' +
$q.N + esc(t(lang, 'lim')) + $t.k2 + esc(q) + $q.O + esc(t(lang, 'live')) + $q.P + encodeURIComponent(x.id) + '">' + esc(t(lang, $q.Q)) + cm(lang) + esc(t(lang, 'upd', { d: fd(lr.updated) })) + $q.R;
}
function tagLabel(lang, tag) {
const v = String(tag || '').split('=')[1] || '';
const k = String(tag || '').split('=')[0];
if (k === $q.S) return tm(lang, 'tag', $q.T) && v === $q.T ? t(lang, 'mb') + ' (' + tm(lang, 'tag', $q.T) + ')' : t(lang, 'mb');
if (k === $q.U) return t(lang, 'mr');
return tm(lang, 'tag', v) || null;
}
const osmU = (ty, id) => $q.V + (ty === 'r' ? $q.W : 'way') + '/' + encodeURIComponent(id) + $q.X;
export function histHtml(ld, x, lang, fd) {
const mh = ld && ld.mh, r = mh && mh.projects && mh.projects[x.id];
if (!r) return '';
const acc = r.acc || 100, s = mh.source || {};
if (!r.ok) return $s.CSS + $t.k3 + esc(t(lang, 'unav', { d: fd(r.checked || mh.updated) })) + $q.Y;
const b = r.b || {}, rd = r.r || {}, l = r.l || {};
const line = o => o && o.n ? esc(t(lang, 'mn', { n: num(o.n, lang), a: fd(o.first), b: fd(o.last) })) : $q.k + esc(t(lang, 'm0')) + $q.l;
const tagHtml = tag => { const lb = tagLabel(lang, tag); return lb ? esc(lb) + $q.Z + esc(tag) + $q.aa : $q.ab + esc(tag) + $q.aa; };
const rows = [[t(lang, 'mb'), line(b)], [t(lang, 'mr'), line(rd)]];
const land = [];
for (const a of (r.land || []).filter(a => a.first)) {
const g = land.find(o => o.tag === a.tag && (o.name || '') === (a.name || ''));
if (!g) land.push(Object.assign({ k: 1 }, a));
else { g.k++; if (a.first < g.first) Object.assign(g, { first: a.first, t: a.t, id: a.id }); if ((a.last || '') > (g.last || '')) g.last = a.last; }
}
rows.push([t(lang, 'ml'), land.length ? $q.m + land.map(a => '<li>' + tagHtml(a.tag) + (a.name ? $q.G + esc(a.name) + $q.H : '') + (a.k > 1 ? ' (' + num(a.k, lang) + ')' : '') + ': ' + '<bdi>' + esc(fd(a.first)) + (a.last && a.last !== a.first ? ', ' + esc(fd(a.last)) : '') + $q.A + ' ' + src(osmU(a.t, a.id), t(lang, 'hist')) + '</li>').join('') + '</ul>' : $q.k + esc(t(lang, 'm0')) + $q.l]);
const cons = (r.cons || []).filter(c => c.first);
if (cons.length) rows.push([t(lang, 'mcons'), esc(t(lang, 'mcn', { n: num(cons.length, lang), a: fd(cons[0].first) })) + ' ' + src(osmU(cons[0].t, cons[0].id), t(lang, 'hist'))]);
if (!b.n && !rd.n && !l.n) return $s.CSS + $q.K + esc(t(lang, $q.ac)) + $q.ad + esc(t(lang, 'none')) + $q.ae + src(s.url, t(lang, 'msrc')) + $q.Y;
let yr = '';
const by = b.by_year || {}, ys = Object.keys(by).map(Number).filter(Boolean);
if (ys.length) {
const y0 = Math.min(...ys), y1 = Math.max(Number(String(r.checked || mh.updated).slice(0, 4)) || y0, ...ys), mx = Math.max(...Object.values(by));
const span = []; for (let y = Math.max(y0, y1 - 19); y <= y1; y++) span.push(y);
const lab = span.length > 10 ? (y => y === span[0] || y === y1 || y % 5 === 0) : (() => true);
yr = '<h3>' + esc(t(lang, 'myr')) + $q.af + span.map(y => { const n = by[y] || 0; return '<li' + (n ? '' : $q.ag) + $q.ah + y + ': ' + n + '">' + (n ? '<b>' + num(n, lang) + '</b>' : '') + $q.ai + (n ? Math.max(4, Math.round(n / mx * 52)) : 1) + $q.aj + (lab(y) ? "'" + String(y).slice(2) : $q.ak) + $q.al; }).join('') + '</ul>' +
(y0 < span[0] ? $q.N + esc(t(lang, 'mn', { n: num(Object.entries(by).filter(([k]) => +k < span[0]).reduce((a, [, v]) => a + v, 0), lang), a: y0, b: span[0] - 1 })) + '</p>' : '');
}
const ev = [];
if (b.first) ev.push([b.first, t(lang, 't_b1')]);
if (rd.first) ev.push([rd.first, t(lang, 't_r1')]);
const seen = new Set();
for (const a of land.slice().sort((p, q) => (p.first || '').localeCompare(q.first || ''))) { const k = tagLabel(lang, a.tag) || a.tag; if (seen.has(k) || seen.size >= 3) continue; seen.add(k); ev.push([a.first, t(lang, 't_l1', { k: k.charAt(0).toUpperCase() + k.slice(1) })]); }
if (cons.length) ev.push([cons[0].first, t(lang, 't_c1')]);
const top = Object.entries(by).sort((p, q) => q[1] - p[1])[0];
if (top && top[1] >= 3 && Object.keys(by).length > 1) ev.push([top[0] + $q.am, t(lang, 't_yr', { n: num(top[1], lang), y: top[0] }), top[0]]);
const rc = (r.recent || [])[0];
if (rc && rc.last) ev.push([rc.last, t(lang, $q.an, { k: tagLabel(lang, rc.tag) || rc.tag }), null, osmU(rc.t, rc.id)]);
ev.sort((p, q) => p[0].localeCompare(q[0]));
const tl = ev.length ? '<h3>' + esc(t(lang, 'tl')) + $q.ao + ev.map(([d, txt, y, u]) => $q.ap + esc(y || d) + '">' + esc(y || fd(d)) + $q.aq + esc(txt) + (u ? ' ' + src(u, t(lang, 'hist')) : '') + '</li>').join('') + '</ol>' : '';
return $s.CSS + $q.K + esc(t(lang, $q.ac)) + $q.ar + rows.map(([a, c]) => '<dt>' + esc(a) + $q.M + c + '</dd>').join('') + '</dl>' + yr + tl +
$q.N + esc(t(lang, 'mlim', { a: num(acc, lang) })) + $q.ae + src(s.url, t(lang, 'msrc')) + $q.as + encodeURIComponent(x.id) + '">' + esc(t(lang, $q.Q)) + cm(lang) + esc(t(lang, 'upd', { d: fd(mh.updated) })) + $q.R;
}
const J = (o, s = 200, age = 0) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': $q.at, 'access-control-allow-origin': '*', 'cache-control': age ? $q.au + age : $q.av, 'x-content-type-options': $q.aw } });
export async function handle(req, u, env) {
if (req.method !== 'GET' && req.method !== 'HEAD') return J({ error: $q.ax }, 405);
const id = decodeURIComponent(u.pathname.replace(/^\/api\/x\/land\/?/, '').replace(/\/$/, ''));
const ld = await landData(env).catch(() => null);
if (!ld || (!ld.lr && !ld.mh)) return J({ error: $q.ay }, 503);
const pick = f => f ? Object.fromEntries(Object.entries(f).filter(([k]) => k !== $q.az)) : null;
if (!id || id === 'about') return J({ about: $s.k0,
land_rules: pick(ld.lr), map_history: pick(ld.mh), projects: Object.keys((ld.lr && ld.lr.projects) || {}).length, files: [$q.aA, $q.aB], example: $q.aC }, 200, 3600);
if (!/^[A-Z0-9-]{3,20}$/.test(id)) return J({ error: $q.aD }, 400);
const a = ld.lr && ld.lr.projects && ld.lr.projects[id], b = ld.mh && ld.mh.projects && ld.mh.projects[id];
if (!a && !b) return J({ error: $q.aE, note: $t.k4 }, 404, 600);
return J({ id, land_rules: a || null, map_history: b || null, sources: Object.assign({}, (ld.lr || {}).sources || {}, { osm_history: (ld.mh || {}).source || null }), method: (ld.mh || {}).method || null, updated: { land_rules: (ld.lr || {}).updated || null, map_history: (ld.mh || {}).updated || null } }, 200, 3600);
}
