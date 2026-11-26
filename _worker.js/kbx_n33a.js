// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_n33a__q, $s = TB.kbx_n33a__s, $t = TB.kbx_n33a__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?delays\/?$/;
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.a, "'": '&#39;' }[c]));
const S = () => TB.kbx_n33a_S || {};
const t = (l, k, v) => { const T = S(); let s = (T[l] && T[l][k] != null) ? T[l][k] : (T.en || {})[k]; if (v && typeof s === $q.b) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b); return s == null ? '' : s; };
const nf = (n, l) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB').format(n); } catch (e) { return String(n); } };
const COI = /eco\s*beach|equinox|sumba/i;
const DAY = 864e5;
const monday = iso => { const d = new Date(iso + $q.c); return new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY).toISOString().slice(0, 10); };
const addD = (iso, n) => new Date(new Date(iso + $q.c).getTime() + n * DAY).toISOString().slice(0, 10);
function isoWeek(iso) { const d = new Date(iso + $q.c), th = new Date(d.getTime() + (3 - (d.getUTCDay() + 6) % 7) * DAY), y = th.getUTCFullYear(), j4 = new Date(Date.UTC(y, 0, 4)); return { y, n: 1 + Math.round(((th - j4) / DAY - 3 + (j4.getUTCDay() + 6) % 7) / 7) }; }
const wkLabel = (l, w) => { const k = isoWeek(w); return ($t.o_WL[l] || $t.o_WL.en).replace('{w}', k.n).replace('{y}', k.y); };
function span(d) {
const s = String(d || '').trim(); let m;
if ((m = /^(20\d\d)-(\d\d)(?:-\d\d)?$/.exec(s))) { const v = +m[1] * 12 + +m[2]; return [v, v]; }
if ((m = /^(20\d\d)-Q([1-4])$/i.exec(s))) return [+m[1] * 12 + 3 * m[2] - 2, +m[1] * 12 + 3 * m[2]];
if ((m = /^(20\d\d)-H([12])$/i.exec(s))) return [+m[1] * 12 + 6 * m[2] - 5, +m[1] * 12 + 6 * m[2]];
if ((m = /^(20\d\d)$/.exec(s))) return [+m[1] * 12 + 1, +m[1] * 12 + 12];
return null;
}
let MV = null;
function moves(ix) {
if (MV && MV.ix === ix) return MV.L;
const L = [];
for (const x of ix.P) {
if (COI.test(String(x.n) + ' ' + String(x.dv) + ' ' + String(x.mk) + ' ' + String(x.co))) continue;
for (const q of ix.prom[x.id] || []) {
if (q.k !== $q.d) continue;
const H = (q.hist || []).filter(h => h && h.d && h.seen).slice().sort((a, b) => String(a.seen).localeCompare(String(b.seen)));
const byDay = new Map(); H.forEach((h, i) => { const day = String(h.seen).slice(0, 10); if (!byDay.has(day)) byDay.set(day, { a: i ? H[i - 1].d : null, b: h.d }); else byDay.get(day).b = h.d; });
for (const [day, v] of byDay) {
const A = span(v.a), B = span(v.b); if (!A || !B) continue;
const dir = B[0] > A[1] ? 1 : B[1] < A[0] ? -1 : 0; if (dir) L.push({ x, d: day, a: v.a, b: v.b, dir, m: B[1] - A[1] });
}
}
}
L.sort((p, q) => q.d.localeCompare(p.d) || q.m - p.m);
MV = { ix, L }; return L;
}
function mvList(l, L, N, cap) {
if (!L.length) return '<p>' + esc(t(l, $q.e)) + '</p>';
const a = x => N.okHttp(x.url) ? ' <a class="k-xs" href="' + esc(N.fixU(x.url)) + '" rel="nofollow noopener" target="_blank">' + esc(t(l, 'src')) + '</a>' : '';
return $q.f + L.slice(0, cap).map(e => $q.g + pre(l) + $q.h + e.x.s + '/">' + (l === 'ar' ? '<bdi>' + esc(e.x.n) + $q.i : esc(e.x.n)) + $q.j + esc(e.x.mk) + $q.k + esc(t(l, $q.l, { a: N.fd(e.a, l), b: N.fd(e.b, l), d: N.fd(e.d, l) })) + a(e.x) + '</li>').join('') +
(L.length > cap ? '<li>' + esc(t(l, $q.m, { k: nf(L.length - cap, l) })) + '</li>' : '') + '</ul>';
}
async function delaysPage(env, shell, l) {
const N = await import('./kbx_named.js'), ix = await N.data(env);
const today = new Date().toISOString().slice(0, 10), w0 = monday(today), M = moves(ix);
const inW = (e, w) => e.d >= w && e.d < addD(w, 7);
const now = M.filter(e => inW(e, w0)), later = now.filter(e => e.dir > 0), earlier = now.filter(e => e.dir < 0);
const OV = [], byMk = new Map();
for (const x of ix.P) { if (COI.test(String(x.n) + ' ' + String(x.dv) + ' ' + String(x.mk) + ' ' + String(x.co))) continue; const o = N.overdueOf ? N.overdueOf(ix, x) : null; if (!o) continue; OV.push([x, o]); const b = byMk.get(x.mk) || { k: 0, mx: 0 }; b.k++; b.mx = Math.max(b.mx, o.m); byMk.set(x.mk, b); }
const rows = [...byMk.entries()].sort((a, b) => b[1].k - a[1].k || a[0].localeCompare(b[0])).slice(0, 12);
const ym = today.slice(0, 7), cur = span(ym)[0], due = [];
for (const x of ix.P) { if (COI.test(String(x.n) + ' ' + String(x.dv) + ' ' + String(x.mk) + ' ' + String(x.co))) continue; const h = N.handoverOf(ix, x), c = ix.caseBy.get(x.id) || {}; if (!h || (c.stage || x.st) === $q.n || (h.p && h.p.st === 'kept')) continue; const s = span(h.d); if (s && s[1] === cur) due.push(x); }
due.sort((a, b) => a.n.localeCompare(b.n));
const first = M.length ? monday(M[M.length - 1].d) : w0, weeks = []; for (let w = addD(w0, -7); w >= first && weeks.length < 12; w = addD(w, -7)) weeks.push(w);
const W = wkLabel(l, w0);
let b = $q.o + esc(t(l, $q.p)) + ': ' + esc(t(l, $q.q, { n: isoWeek(w0).n, y: isoWeek(w0).y, a: N.fd(w0, l), b: N.fd(today, l) })) + '</h2>' +
'<h3>' + esc(t(l, $q.r)) + ' (' + nf(later.length, l) + $q.s + mvList(l, later, N, 60) + (earlier.length ? $q.t + esc(t(l, 'dl_er', { k: nf(earlier.length, l) })) + '</p>' : '');
b += $q.u + esc(t(l, $q.v)) + $q.w + esc(t(l, $q.x, { k: nf(OV.length, l), d: N.fd(today, l) })) + $t.k0 + t(l, 'dl_th').map(h => $q.y + esc(h) + '</th>').join('') + $q.z +
rows.map(([mk, v]) => $q.A + esc(mk) + $q.B + nf(v.k, l) + $q.B + nf(v.mx, l) + $q.C).join('') + $q.D;
if (due.length) b += $q.E + esc(t(l, $q.F)) + $q.w + esc(t(l, $q.G, { k: nf(due.length, l), m: N.fd(ym, l) })) + $t.k1 + due.slice(0, 40).map(x => $q.g + pre(l) + $q.h + x.s + '/">' + esc(x.n) + $q.j + esc(x.mk) + $q.H).join('') + (due.length > 40 ? '<li>' + esc(t(l, $q.m, { k: nf(due.length - 40, l) })) + '</li>' : '') + '</ul>';
b += $q.I + esc(t(l, $q.J)) + '</h2>';
for (const w of weeks) { const L = M.filter(e => e.dir > 0 && inW(e, w)), k = isoWeek(w); b += $q.K + k.y + '-' + String(k.n).padStart(2, '0') + '">' + esc(t(l, $q.q, { n: k.n, y: k.y, a: N.fd(w, l), b: N.fd(addD(w, 6), l) })) + $q.L + esc(t(l, $q.M, { k: nf(L.length, l) })) + '</p>' + (L.length ? mvList(l, L, N, 25) : ''); }
b += $q.N + esc(t(l, $q.O)) + $q.P + t(l, $q.Q).map(p => '<li>' + esc(p) + '</li>').join('') + $q.R + esc(t(l, $q.S)) + '</p>';
const R = t(l, $q.T), rl = [[$q.U, 0, false], [$q.V, 1, true], [$q.W, 2, true], [$q.X, 3, true]];
b += $q.f + rl.map(([p, i, tr]) => $q.g + (tr ? pre(l) : '') + p + '">' + esc(R[i]) + $q.Y).join('') + '</ul>' + byline(l);
const h1 = t(l, 'dl_h1', { w: W }), canon = ORIGIN + pre(l) + $q.Z, lead = t(l, $q.aa);
let desc = t(l, $q.ab, { m: nf(later.length, l), w: W, k: nf(OV.length, l) }); if ([...desc].length > 160) desc = [...desc].slice(0, 157).join('').replace(/\s+\S*$/, '') + '...';
let title = h1; if ([...title].length + 11 <= 60) title += $q.ac;
const crumbs = [[$q.ad, ORIGIN + pre(l) + '/'], [t(l, 'dl_t'), canon]];
const body = $q.ae + (l === 'ar' ? $q.af : '') + $t.k2 + pre(l) + $q.ag + esc(h1) + $q.ah + esc(lead) + $q.ai + today + '">' + esc(N.fd(today, l)) + $t.k3 + (l === 'ar' ? $q.af : '') + '>' + $s.CSS + b + $q.aj;
const ld = { '@context': $q.ak, '@graph': [
{ '@type': $q.al, '@id': canon + '#page', url: canon, name: h1, description: desc, inLanguage: l, dateModified: today, isPartOf: { '@id': ORIGIN + $q.am }, publisher: { '@id': ORIGIN + '/#org' }, author: { '@id': ORIGIN + '/#org' }, publishingPrinciples: ORIGIN + $q.an, breadcrumb: { '@id': canon + '#bc' }, mainEntity: { '@id': canon + '#data' } },
{ '@type': $q.ao, '@id': canon + '#data', name: h1, description: lead, url: canon, license: $t.k4, isAccessibleForFree: true, creator: { '@id': ORIGIN + '/#org' }, dateModified: today, temporalCoverage: first + '/' + today, distribution: [{ '@type': $q.ap, encodingFormat: $q.aq, contentUrl: ORIGIN + $q.ar }] },
{ '@type': $q.as, '@id': ORIGIN + '/#org', name: $q.ad, url: ORIGIN + '/' },
{ '@type': $q.at, '@id': canon + '#bc', itemListElement: crumbs.map((c, i) => ({ '@type': $q.au, position: i + 1, name: c[0], item: c[1] })) }] };
const html = await N.assemble({ title, desc, canon, body, ld, alt: x => ORIGIN + pre(x) + $q.Z }, l, await shell(pre(l) + $q.av));
return new Response(html, { status: 200, headers: { 'content-type': $q.aw, 'cache-control': $q.ax, 'content-language': l } });
}
const BY_METHOD = [[/^\/(?:press\/delivery-index|delays|weekly|handover|rankings\/most-delayed)(?:\/|$)/, '/methods/handover-slippage/'], [/^\/rankings\/transparency(?:\/|$)/, '/methods/transparency-score/'], [/./, '/how-we-work/']];
export function byline(l, path) {
if (!S().en) return '';
const p = String(path || $q.Z).replace(/^\/(?:es|de|fr|nl|ru|zh|ar)(?=\/)/, ''), m = BY_METHOD.find(r => r[0].test(p))[1];
const a = (h, k) => '<a href="' + pre(l) + h + '">' + esc(t(l, k)) + '</a>';
return $t.k5 + esc(t(l, 'by')).replace($q.ay, a($q.az, $q.aA)).replace($q.aB, $q.aC + esc(t(l, $q.aD)) + '</a>').replace($q.aE, a(m, $q.aF)).replace($q.aG, a($q.aH, $q.aI)) + '</p>';
}
export const REPORTS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:reports(?:\/[a-z0-9-]{2,40})?|press\/delivery-index(?:\/\d{4}-\d{2})?|weekly(?:\/[a-z0-9-]{2,40})?|projects\/[a-z0-9-]{1,90}\/report|numbers|rankings\/(?:most-delayed|changed-promises)|handover\/overdue(?:\/[a-z0-9-]{2,40})?|stories\/[a-z0-9-]{2,90})\/$/;
export const FEED_HUB = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:(?:projects|developers|developers\/benchmark|countries(?:\/[a-z0-9-]{2,60})?|m(?:\/[^/.]{2,60})?|rankings(?:\/[a-z0-9-]{2,40}){0,2}|handover(?:\/[a-z0-9-]{2,40}){0,2}|new|weekly(?:\/[a-z0-9-]{2,40})?|delays|reports(?:\/[a-z0-9-]{2,40})?|vs|tools|guides(?:\/[a-z0-9-]{2,40}){0,2}|data|changes|promises|map|registers|glossary|numbers|press\/delivery-index|compare|cases|courts|regulators|satellite|anomalies|destinations|research)\/)?$/;
export function feedLinks(path, hasJson, hasAtom) {
const lang = (/^\/(es|de|fr|nl|ru|zh|ar)\//.exec(path) || [0, 'en'])[1], p = path.replace(/^\/(?:es|de|fr|nl|ru|zh|ar)(?=\/)/, '');
const wk = /^\/weekly\/([a-z0-9-]{2,40})\/$/.exec(p), T = t(lang, $q.aJ) || $q.aK;
const J = wk ? $q.W + wk[1] + $q.aL : $q.aM, A = wk ? $q.W + wk[1] + $q.aN : $q.aO;
return (hasJson ? '' : $t.k6 + esc(T) + $q.aP + J + '">') + (hasAtom ? '' : $t.k7 + esc(T) + $q.aQ + A + '">');
}
let CARD = null, CARD_AT = 0;
export async function prep(env, u) {
if (u.pathname !== $q.aR || (CARD && Date.now() - CARD_AT < 6e5)) return;
try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $t.k8)); if (r.ok) { CARD = await r.json(); CARD_AT = Date.now(); } } catch (e) {}
}
export function dataLd(path) {
if (path !== $q.aR || !CARD || !CARD.version) return '';
const F = (CARD.files || []).flatMap(f => [[$q.aS, $q.aT], ['csv', $q.aU]].filter(([k]) => f[k] && f[k].path).map(([k, ty]) => ({ '@type': $q.ap, name: f.table + '.' + k, encodingFormat: ty, contentUrl: ORIGIN + f[k].path, contentSize: String(f[k].bytes) })));
const d = { '@context': $q.ak, '@type': $q.ao, '@id': ORIGIN + $q.aV, name: CARD.name || $q.aW, description: String(CARD.what_it_is || '').slice(0, 4900), url: ORIGIN + $q.aX, version: String(CARD.version),
dateModified: CARD.built, license: $t.k9, isAccessibleForFree: true, creator: { '@id': ORIGIN + '/#org' }, publisher: { '@id': ORIGIN + '/#org' }, includedInDataCatalog: { '@id': ORIGIN + $q.aR },
isBasedOn: ORIGIN + ((CARD.source || {}).file || $q.aY), distribution: F.concat([{ '@type': $q.ap, name: $q.aZ, encodingFormat: $q.aq, contentUrl: ORIGIN + $q.ba }]),
keywords: [$q.bb, $q.bc, $q.bd, $q.be, $q.bf, $q.bg] };
return $q.bh + JSON.stringify(d).replace(/</g, $q.bi) + $q.bj;
}
let CS = null, CS_AT = 0;
const slugM = m => encodeURIComponent(String(m).toLowerCase().replace(/\s+/g, '-'));
export async function mIndex(env, r) {
try {
if (!CS || Date.now() - CS_AT > 6e5) { const q = await env.ASSETS.fetch(new Request(ORIGIN + $q.bk)); if (q.ok) { CS = (await q.json()).cases || []; CS_AT = Date.now(); } }
if (!CS || !CS.length) return r;
const G = {}; let n = 0;
for (const c of CS) { if (!c.market || !c.country || COI.test(c.market + ' ' + (c.name || ''))) continue; n++; const g = G[c.country] = G[c.country] || {}; g[c.market] = (g[c.market] || 0) + 1; }
const cs = Object.keys(G).sort(), nm = cs.reduce((a, c) => a + Object.keys(G[c]).length, 0);
const root = $s.k0 + nf(n, 'en') + $q.bl + nm + $q.bm + cs.length + $t.k10;
const body = $t.k11 + cs.map(c => { const ms = Object.keys(G[c]).sort(), tot = ms.reduce((s, m) => s + G[c][m], 0);
return $q.bn + esc(c) + $t.k12 + tot + $q.bo + ms.map(m => $q.bp + slugM(m) + '/">' + esc(m) + $q.bq + G[c][m] + $q.br).join('') + $q.bs; }).join('') + $q.bt;
return new HTMLRewriter().on($q.bu, { element(e) { e.setInnerContent(root, { html: true }); } }).on($q.bv, { element(e) { e.setInnerContent(body, { html: true }); } }).transform(r);
} catch (e) { return r; }
}
export async function handle(req, u, env, ctx, shell) {
if (req.method !== 'GET' && req.method !== 'HEAD') return null;
const m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?delays(\/?)$/.exec(u.pathname); if (!m) return null;
if (!m[2]) return new Response(null, { status: 301, headers: { location: (m[1] ? '/' + m[1] : '') + $q.Z } });
if (!S().en) return null;
return delaysPage(env, shell, m[1] || 'en');
}
export { moves, span };
