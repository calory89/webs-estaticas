// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_e27__q, $s = TB.kbx_e27__s, $t = TB.kbx_e27__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import * as N from './kbx_named.js';
import { jget } from './kbx_jget.js';
import { TB } from './kbx_strings.js';
import { TR_PLACES, inPlace } from './kbx_tr_places.js';
import { E } from './kbx_e27_i18n.js';
import { regSale, rsText } from './kbx_n31d_rs.js';
const IF = (globalThis.__kbIF = globalThis.__kbIF || {}); function sf(k, f) { if (IF[k]) return IF[k]; const p = f(); IF[k] = p; const d = () => { if (IF[k] === p) delete IF[k]; }; p.then(d, d); return p; }   // n40 d12
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const PDF_LANGS = new Set(['en', 'es', 'de', 'fr', 'nl']);
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const COI = /eco\s*beach|equinox/i;
const pre = l => l === 'en' ? '' : '/' + l;
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.a, "'": '&#39;' }[c]));
const xe = t => esc(t).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
const t = (lang, k, v) => { let s = (E[lang] && E[lang][k] != null) ? E[lang][k] : E.en[k]; if (v && typeof s === $q.b) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b); return s; };
const bd = (lang, s) => lang === 'ar' ? '<bdi>' + s + $q.c : s;
const nf = (n, l) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB').format(n); } catch (e) { return String(n); } };
const PLACES = TR_PLACES.filter(P => !P.coi);
const okName = x => !COI.test(String(x.n || '')) && !COI.test(String(x.dv || ''));
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:projects\/[a-z0-9-]{1,90}\/report(?:\/|\.pdf)?|weekly(?:\/[a-z0-9-]{2,40})?\/?)$|^\/weekly\/(?:[a-z0-9-]{2,40}\/feed\.(?:atom|json)|sitemap\.xml)$|^\/api\/x\/e27\/(?:mail\/(?:review|delays)|signups|notices\/[A-Za-z0-9-]{3,20})\/?$/;
const MEMO = {};
const file = (env, name) => sf('e27:' + name, () => file0(env, name));
async function file0(env, name) {
  const m = MEMO[name]; if (m && (m.a || Date.now() - m.t < 600000)) return m.v;
  const o = await jget(env, name, ORIGIN + $q.d + name, ORIGIN + $q.e + name, 600).catch(() => null), v = o ? o.v : null;   // n40 d14: shared parse
  MEMO[name] = { t: Date.now(), v, a: !!(o && o.a && v) }; return v;
}
async function extra(env) {
const [ph, gz, iw] = await Promise.all([file(env, $q.f), file(env, $q.g), file(env, $q.h)]);
return { ph: (ph && ph.projects) || {}, gz: (gz && gz.devs) || {}, gzSrc: Object.fromEntries(((gz && gz.sources) || []).map(s => [s.id, s])), iw: (iw && iw.projects) || {}, iwCov: ((iw && iw.coverage && iw.coverage.covered) || []) };
}
const LIST_KINDS = new Set(['insolvency', 'dissolution']);
export function noticesOf(ix, X, x) {
const L = [];
const g = x.dvs && X.gz[x.dvs];
for (const r of (g && g.notices_all) || []) if (LIST_KINDS.has(r[3]) && N.okHttp(r[4])) L.push({ d: r[0], t: r[2], s: (X.gzSrc[r[1]] || {}).name || r[1], src: r[4] });
const w = X.iw[x.id];
for (const f of (w && w.found) || []) { const cov = X.iwCov.find(c => f.source && f.source.indexOf(c.country === $q.i ? $q.j : 'BORME') >= 0); L.push({ d: f.date, t: f.type, s: f.source, src: (cov && cov.url) || ORIGIN + $q.k }); }
const seen = new Set();
return L.filter(n => N.iso(n.d) && !seen.has(n.d + n.t) && seen.add(n.d + n.t)).sort((a, b) => b.d.localeCompare(a.d));
}
function evs(ix, X, x) {
const c = ix.caseBy.get(x.id) || {}, page = N.okHttp(x.url) ? N.fixU(x.url) : null, base = $q.l + x.s + '/', E2 = [];
const add = (d, k, key, v, src) => { const i = N.iso(d); if (i) E2.push({ d: i, k, key: x.id + '/' + key, v: v || {}, src: src || page }); };
if (x.ad) add(x.ad, 'added', 'added', {}, ORIGIN + base);
for (const h of c.history || []) add(h.d, 'field', 'f/' + h.d + '/' + String(h.f).replace(/\W+/g, '-'), { f: h.f }, page);
for (const q of ix.prom[x.id] || []) {
const H = (q.hist || []).slice().sort((a, b) => String(a.seen).localeCompare(String(b.seen)));
H.forEach((h, i) => { if (i && h.d !== H[i - 1].d) add(h.seen, 'moved', 'm/' + q.k + '/' + h.seen + '/' + i, { w: q.k, a: H[i - 1].d, b: h.d }, page); });
}
const fdays = new Set(); for (const f of ((ix.find[x.id] || {}).f) || []) { const i = N.iso(f.at); if (i && !fdays.has(i)) { fdays.add(i); add(i, 'page', 'p/' + i, {}, ORIGIN + base + $q.m); } }
const P = X.ph[x.id];
if (P && P.pts) {
const H = P.pts.filter(p => p.head && p.head.v && N.iso(p.d)).sort((a, b) => a.d.localeCompare(b.d));
for (let i = 1; i < H.length; i++) if (H[i].head.cur === H[i - 1].head.cur && H[i].head.v !== H[i - 1].head.v) {
const src = H[i].src === 'ia' && P.url ? $q.n + H[i].ref + '/' + P.url : ORIGIN + base + $q.m;
add(H[i].d, 'price', 'pr/' + H[i].d, { a: H[i - 1].head.p, b: H[i].head.p }, src);
}
}
if (c.overdue && N.iso(c.checked)) add(c.checked, 'over', 'o/' + N.iso(c.checked), {}, ORIGIN + $q.o);
const rw = x.rw || c.register; if (rw && rw.checked) add(rw.checked, 'reg', 'r/' + N.iso(rw.checked), { r: rw.register }, ORIGIN + $q.p);
if (c.sat && c.sat.date) add(c.sat.date, 'sat', 's/' + c.sat.date, {}, ORIGIN + $q.q);
for (const n of noticesOf(ix, X, x)) add(n.d, 'list', 'l/' + n.d + '/' + String(n.t).replace(/\W+/g, '-'), { t: n.t, s: n.s }, n.src);
const seen = new Set(); return E2.filter(e => !seen.has(e.key) && seen.add(e.key));
}
const shortD = (d, lang) => N.fd(d, lang);
function evText(lang, e) {
const v = e.v;
if (e.k === 'moved') return t(lang, $q.r, { w: N.tr(lang, 'pk_' + v.w), a: shortD(v.a, lang), b: shortD(v.b, lang) });
if (e.k === 'field') return t(lang, $q.s, { f: v.f });
if (e.k === 'price') return t(lang, $q.t, { a: v.a, b: v.b });
if (e.k === 'reg') return t(lang, $q.u, { r: v.r || '' });
if (e.k === 'list') return t(lang, $q.v, { t: v.t, s: v.s });
return t(lang, 'ev_' + e.k);
}
const DAY = 864e5;
const monday = iso => { const d = new Date(iso + $q.w); const w = (d.getUTCDay() + 6) % 7; return new Date(d.getTime() - w * DAY).toISOString().slice(0, 10); };
const addD = (iso, n) => new Date(new Date(iso + $q.w).getTime() + n * DAY).toISOString().slice(0, 10);
let WK = null;
async function weekly(env) {
const ix = await N.data(env), X = await extra(env);
if (WK && WK.ix === ix && WK.X === X.ph) return WK;
const today = new Date().toISOString().slice(0, 10), w0 = monday(today), weeks = [...Array(8)].map((_, i) => addD(w0, -7 * i)), from = weeks[7];
const byPlace = new Map();
for (const P of PLACES) byPlace.set(P.s, { P, L: [], ev: [] });
for (const x of ix.P) {
if (!okName(x)) continue;
const pl = PLACES.filter(P => inPlace(P, x.mk, x.ar)); if (!pl.length) continue;
const ev = evs(ix, X, x).filter(e => e.d >= from && e.d <= today);
for (const P of pl) { const b = byPlace.get(P.s); b.L.push(x); for (const e of ev) b.ev.push(Object.assign({ x }, e)); }
}
for (const b of byPlace.values()) b.ev.sort((a, c) => c.d.localeCompare(a.d) || a.x.n.localeCompare(c.x.n));
WK = { ix, X: X.ph, Xall: X, today, w0, weeks, byPlace }; return WK;
}
const inWeek = (e, w) => e.d >= w && e.d < addD(w, 7);
async function htmlPage(env, ctx, shell, lang, pg, noindex) {
let html = await N.assemble(Object.assign({ ld: { '@context': $q.x, '@type': $q.y, name: pg.title, url: pg.canon, inLanguage: lang } }, pg, { body: $s.CSS + pg.body }), lang, await shell(pre(lang) + $q.z));
if (noindex) html = html.replace($q.A, $t.k0);
const h = { 'content-type': $q.B, 'cache-control': $q.C, 'content-language': lang };
if (noindex) h[$q.D] = $q.E;
return new Response(html, { headers: h });
}
const hero = (lang, h1, lead) => $q.F + (lang === 'ar' ? $q.G : '') + $q.H + h1 + '</h1>' + (lead ? $q.I + lead + '</p>' : '') + $q.J;
const wrap = (lang, inner) => $q.K + (lang === 'ar' ? $q.G : '') + '>' + inner + $q.L;
const STAGE = { 'off-plan': 'st_offplan', 'under construction': 'st_construction', completed: 'st_completed' };
async function reportData(env, x, lang) {
const ix = await N.data(env), X = await extra(env), c = ix.caseBy.get(x.id) || {}, fx = x.fx || {}, page = N.okHttp(x.url) ? N.fixU(x.url) : null;
let tp = null; try { const TR = await import('./kbx_tr.js'); tp = await TR.trProject(env, x.id, lang); } catch (e) { tp = null; }
const ho = N.handoverOf(ix, x), NP = N.tr(lang, $q.M);
const RS = regSale(x), price = RS ? rsText(lang, RS) : fx.price_min != null ? (fx.currency ? fx.currency + ' ' : '') + nf(fx.price_min, lang) + (fx.price_max != null && fx.price_max !== fx.price_min ? ' - ' + nf(fx.price_max, lang) : '') : null;
const F = [
[N.tr(lang, 'k_dev'), x.dv || N.tr(lang, $q.N), page],
[N.tr(lang, 'k_loc'), [x.ar, x.mk !== x.ar ? x.mk : null, x.co !== x.mk ? x.co : null].filter(Boolean).join(', ').split(', ').filter((v, i, a) => a.findIndex(w => w.toLowerCase() === v.toLowerCase()) === i).join(', '), page],
[N.tr(lang, $q.O), N.tr(lang, STAGE[c.stage || x.st] || $q.P), page],
[N.tr(lang, $q.Q), ho ? N.fd(ho.d, lang) + (c.overdue ? '. ' + N.tr(lang, $q.R, { m: c.overdue }) : '') : NP, page],
[N.tr(lang, $q.S), x.pn || NP, x.pn ? ((N.okHttp(x.du) ? N.fixU(x.du) : null) || page) : null],
[N.tr(lang, $q.T), price || NP, price ? page : null],
[N.tr(lang, $q.U), fx.payment_plan && N.cleanOk(String(fx.payment_plan)) ? String(fx.payment_plan) : NP, fx.payment_plan ? page : null],
[N.tr(lang, $q.V), N.fd(N.lastmod(ix, x), lang), null],
[N.tr(lang, $q.W), page || NP, page]
];
const qa = (() => { try { return N.quickAnswer(ix, x, lang, tp); } catch (e) { return ''; } })();
const ev = evs(ix, X, x).sort((a, b) => b.d.localeCompare(a.d)).slice(0, 20);
const srcs = [...new Set([page, N.okHttp(x.du) ? N.fixU(x.du) : null, ...(x.src || []).filter(N.okHttp).map(N.fixU)].filter(Boolean))].slice(0, 20);
return { ix, x, c, F, qa, tp, ev, srcs, live: ORIGIN + pre(lang) + $q.l + x.s + '/', today: new Date().toISOString().slice(0, 10) };
}
const STW = { yes: ['✓', 'ke-ok'], part: ['◐', 'ke-mid'], no: ['○', 'ke-no'], nc: ['?', 'ke-no'] };
const stWord = (lang, st) => st === 'yes' ? N.tr(lang, 'v_pub') : st === 'no' ? N.tr(lang, $q.M) : t(lang, 'st_' + st);
async function reportPage(req, u, env, ctx, shell, lang, x) {
const R = await reportData(env, x, lang), name = x.n, b = s => bd(lang, s);
const SEC = ['f', 'c', 'q', 'h', 's'], want = new Set(u.searchParams.getAll('s').join(',').split(',').map(v => v.trim()).filter(v => SEC.includes(v)));
const on = k => !want.size || want.has(k);
let X34 = null; try { X34 = await import('./kbx_n34b.js'); await X34.ready(env); } catch (e) { X34 = null; }
const tx = (k, v) => X34 ? X34.tx(lang, k, v) : '';
const a = (u2, l) => u2 ? ' <a class="ke-src" href="' + esc(u2) + '"' + (/^https?:/.test(u2) && !u2.startsWith(ORIGIN) ? ' rel="nofollow noopener" target="_blank"' : '') + '>' + esc(l || t(lang, 'src')) + '</a>' : '';
let body = hero(lang, esc(t(lang, 'rp_h1', { n: name })), esc(t(lang, $q.X, { d: N.fd(R.today, lang) })));
let w = $q.Y + pre(lang) + $q.l + x.s + $q.Z + esc(PDF_LANGS.has(lang) ? t(lang, $q.aa) : t(lang, $q.ab)) + $t.k1 + esc(t(lang, $q.ac)) + $q.ad + pre(lang) + $q.l + x.s + '/">' + esc(t(lang, $q.ae)) + '</a>' + (X34 ? $q.af + pre(lang) + $q.ag + x.s + '">' + esc(tx($q.ah)) + '</a>' : '') + $q.L;
if (X34) { let sha = ''; try { const B = await import('./kbx_n30b.js'); sha = String((await B.chain(env)).live.sha256 || ''); } catch (e) { sha = ''; }
const self = ORIGIN + pre(lang) + $q.l + x.s + $q.ai + (want.size ? '?s=' + SEC.filter(k => want.has(k)).join(',') : '');
w += $q.aj + esc(tx($q.ak, { id: x.id + '-' + R.today.replace(/-/g, ''), d: N.fd(R.today, lang), v: (R.ix.named && R.ix.named.version) || '', u: N.fd((R.ix.named && R.ix.named.updated) || R.ix.updated, lang), h: sha.slice(0, 16) || '-' })) + ' ' + esc(tx($q.al)) + $q.am + esc(self) + $q.an + esc(self.replace(ORIGIN, $q.ao)) + '</a>' +
(want.size ? ' ' + esc(tx($q.ap, { s: SEC.filter(k => want.has(k)).map(k => tx('sec_' + k)).join(', ') })) : '') + '</p>'; }
if (R.qa && on('f')) w += '<h2>' + esc(N.tr(lang, $q.aq)) + $q.ar + b(esc(R.qa)) + '</p>';
if (on('f')) w += '<h2>' + esc(t(lang, $q.as)) + $t.k2 + R.F.map(f => $q.at + esc(f[0]) + $q.au + b(esc(f[1])) + a(f[2]) + $q.av).join('') + $q.aw;
if (R.tp && on('c')) {
w += '<h2>' + esc(t(lang, 'rp_tr')) + $q.ax + esc(t(lang, $q.ay, { s: nf(R.tp.score, lang) })) + '</b>' + R.tp.ranks.filter(r => r.ranked).map(r => ' · ' + esc(t(lang, $q.az, { r: nf(r.r, lang), m: nf(r.m, lang), p: r.p }))).join('') + a(R.tp.method, $q.ao) + '</p>' +
$q.aA + R.tp.items.map(i => $q.aB + (STW[i.st] || STW.nc)[1] + $q.aC + (STW[i.st] || STW.nc)[0] + $q.aD + esc(i.label) + $q.aE + b(esc(i.text || stWord(lang, i.st))) + '</li>').join('') + '</ul>';
}
if (X34 && on('q')) { try { const Q = await X34.questionsFor(env, x, lang, R.tp); w += X34.QCSS + '<h2>' + esc(tx('rp_q')) + '</h2>' + X34.questionsHtml(lang, Q, { h3: true }) + $q.aF + pre(lang) + $q.l + x.s + $q.aG + esc(tx($q.aH)) + $q.aI; } catch (e) {} }
if (on('h')) w += '<h2>' + esc(t(lang, 'rp_ch')) + '</h2>' + (R.ev.length ? $q.aA + R.ev.map(e => $q.aJ + esc(N.fd(e.d, lang)) + $q.aK + b(esc(evText(lang, e))) + a(e.src) + '</li>').join('') + '</ul>' : '<p>' + esc(N.tr(lang, $q.aL)) + '</p>');
if (on('s')) w += '<h2>' + esc(N.tr(lang, $q.aM)) + $q.aN + R.srcs.map(s => $q.aO + esc(s) + $t.k3 + esc(s.length > 100 ? s.slice(0, 100) + '...' : s) + $q.aP).join('') + '</ul>';
w += $q.aQ + esc(t(lang, $q.aR, { u: '' })) + $q.am + esc(R.live) + '">' + esc(R.live) + $q.aS + esc(t(lang, $q.aT)) + '</p>';
body += wrap(lang, w);
const canon = ORIGIN + pre(lang) + $q.l + x.s + $q.ai;
return htmlPage(env, ctx, shell, lang, { title: t(lang, 'rp_t', { n: name }) + $q.aU, desc: t(lang, $q.X, { d: N.fd(R.today, lang) }), canon, body, alt: l => ORIGIN + pre(l) + $q.l + x.s + $q.ai }, true);
}
const HW = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];
function winBytes(s) {
const out = [];
for (const ch of String(s).replace(/[    ]/g, ' ').replace(/[✓]/g, 'x').replace(/[◐]/g, '~').replace(/[○]/g, 'o').replace(/[→]/g, '>')) {
const cp = ch.codePointAt(0);
if (cp >= 32 && cp < 127) out.push(cp); else if (cp >= 0xA0 && cp <= 0xFF) out.push(cp); else if ($t.o_WIN[cp]) out.push($t.o_WIN[cp]);
else { const d = ch.normalize('NFKD').replace(/[̀-ͯ]/g, ''); const c2 = d.codePointAt(0); out.push(d && c2 >= 32 && c2 < 127 ? c2 : 63); }
}
return out;
}
const wOf = (bytes, size, bold) => bytes.reduce((a, c) => a + (c >= 32 && c <= 126 ? HW[c - 32] : 556), 0) * size / 1000 * (bold ? 1.07 : 1);
const pdfStr = bytes => '(' + bytes.map(c => c === 40 || c === 41 || c === 92 ? '\\' + String.fromCharCode(c) : c < 32 || c > 126 ? '\\' + c.toString(8).padStart(3, '0') : String.fromCharCode(c)).join('') + ')';
export function pdfDoc(title, blocks, first) {
const W = 595.28, H = 841.89, M = 50, pages = [[]];
let y = H - M;
const line = (bytes, size, bold, x, col) => { if (y - size < M) { pages.push([]); y = H - M; } y -= size * 1.3; pages[pages.length - 1].push('BT ' + (col || '0 0 0') + ' rg /' + (bold ? 'F2' : 'F1') + ' ' + size + ' Tf ' + x.toFixed(1) + ' ' + y.toFixed(1) + ' Td ' + pdfStr(bytes) + $q.aV); };
for (const b of blocks) {
const size = b.size || 10, x = M + (b.indent || 0), maxW = W - M - x - (b.rm || 0);
y -= b.gap || 0;
const words = winBytes(b.t).reduce((acc, c) => { if (c === 32) acc.push([]); else acc[acc.length - 1].push(c); return acc; }, [[]]).filter(w => w.length);
let cur = [];
for (let wd of words) {
while (wOf(wd, size, b.bold) > maxW) { if (cur.length) { line(cur, size, b.bold, x, b.color); cur = []; } let k = wd.length; while (k > 1 && wOf(wd.slice(0, k), size, b.bold) > maxW) k--; line(wd.slice(0, k), size, b.bold, x, b.color); wd = wd.slice(k); }
const tryL = cur.length ? cur.concat([32], wd) : wd;
if (wOf(tryL, size, b.bold) > maxW && cur.length) { line(cur, size, b.bold, x, b.color); cur = wd.slice(); } else cur = tryL;
}
if (cur.length) line(cur, size, b.bold, x, b.color);
}
const objs = [], add = s => { objs.push(s); return objs.length; };
const cat = add(''), pgs = add(''), f1 = add($t.k4), f2 = add($t.k5);
const kids = [];
pages.forEach((ops, i) => {
const foot = $q.aW + M + $q.aX + pdfStr(winBytes($q.aY + (i + 1) + ' / ' + pages.length)) + $q.aV;
const content = (i === 0 && first ? [first] : []).concat(ops, [foot]).join('\n');
const cs = add($q.aZ + content.length + $q.ba + content + $q.bb);
kids.push(add($q.bc + pgs + $q.bd + W + ' ' + H + $q.be + f1 + $q.bf + f2 + $q.bg + cs + $q.bh));
});
objs[cat - 1] = $q.bi + pgs + $q.bh;
objs[pgs - 1] = $q.bj + kids.map(k => k + ' 0 R').join(' ') + $q.bk + kids.length + ' >>';
const info = add($q.bl + pdfStr(winBytes(title)) + $t.k6);
let out = $q.bm; const off = [];
objs.forEach((o, i) => { off.push(out.length); out += (i + 1) + $q.bn + o + $q.bo; });
const xref = out.length;
out += $q.bp + (objs.length + 1) + $q.bq + off.map(o => String(o).padStart(10, '0') + $q.br).join('') + $q.bs + (objs.length + 1) + $q.bt + cat + $q.bu + info + $q.bv + xref + $q.bw;
return Uint8Array.from(out, ch => ch.charCodeAt(0) & 255);
}
async function reportPdf(env, lang0, x) {
const lang = PDF_LANGS.has(lang0) ? lang0 : 'en', R = await reportData(env, x, lang), B = [];
const GREY = $q.bx;
B.push({ t: t(lang, 'rp_h1', { n: x.n }), size: 18, bold: true, rm: 96 });
B.push({ t: t(lang, $q.X, { d: N.fd(R.today, lang) }), size: 9, color: GREY, gap: 2, rm: 96 });
if (R.qa) { B.push({ t: N.tr(lang, $q.aq), size: 12, bold: true, gap: 12, rm: 96 }); B.push({ t: R.qa, size: 10, rm: 96 }); }
B.push({ t: t(lang, $q.as), size: 12, bold: true, gap: 12 });
for (const f of R.F) { B.push({ t: f[0] + ': ' + f[1], size: 10, gap: 2 }); if (f[2] && f[2] !== f[1]) B.push({ t: t(lang, 'src') + ': ' + f[2], size: 8, color: GREY, indent: 12 }); }
if (R.tp) {
B.push({ t: t(lang, 'rp_tr'), size: 12, bold: true, gap: 12 });
B.push({ t: t(lang, $q.ay, { s: R.tp.score }) + R.tp.ranks.filter(r => r.ranked).map(r => '. ' + t(lang, $q.az, { r: r.r, m: r.m, p: r.p })).join(''), size: 10, bold: true });
for (const i of R.tp.items) B.push({ t: '[' + (STW[i.st] || STW.nc)[0] + '] ' + i.label + ': ' + (i.text || stWord(lang, i.st)), size: 10, gap: 2 });
B.push({ t: ORIGIN + R.tp.method, size: 8, color: GREY });
}
B.push({ t: t(lang, 'rp_ch'), size: 12, bold: true, gap: 12 });
if (!R.ev.length) B.push({ t: N.tr(lang, $q.aL), size: 10 });
for (const e of R.ev) { B.push({ t: N.fd(e.d, lang) + ': ' + evText(lang, e), size: 10, gap: 2 }); if (e.src) B.push({ t: e.src, size: 8, color: GREY, indent: 12 }); }
B.push({ t: N.tr(lang, $q.aM), size: 12, bold: true, gap: 12 });
for (const s of R.srcs) B.push({ t: s, size: 8, gap: 1 });
B.push({ t: t(lang, $q.aR, { u: R.live }), size: 9, gap: 14, color: GREY });
B.push({ t: t(lang, $q.aT), size: 9, color: GREY });
return pdfDoc(t(lang, 'rp_h1', { n: x.n }), B, await certQr(ORIGIN + (lang === 'en' ? '' : '/' + lang) + $q.l + x.s + $q.by, CERT_L[lang] || CERT_L.en));
}
const CERT_L = { en: 'Certificate', es: 'Certificado', de: 'Zertifikat', fr: 'Certificat', nl: 'Certificaat' };
async function certQr(url, cap) {
try {
const Q = (await import('./kbx_qrgen.js')).default, q = Q(0, 'M'); q.addData(url); q.make();
const n = q.getModuleCount(), S = 80, c = S / (n + 8), x0 = 595.28 - 50 - S, y0 = 841.89 - 42 - S, R = [];
for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) R.push(((x0 + (k + 4) * c).toFixed(2)) + ' ' + ((y0 + S - (r + 5) * c).toFixed(2)) + ' ' + c.toFixed(2) + ' ' + c.toFixed(2) + ' re');
return $q.bz + x0.toFixed(2) + ' ' + y0.toFixed(2) + ' ' + S + ' ' + S + $q.bA + R.join(' ') + $q.bB + (x0 + 4 * c).toFixed(2) + ' ' + (y0 - 6).toFixed(2) + ' Td ' + pdfStr(winBytes(cap)) + $q.aV;
} catch (e) { return ''; }
}
function weekBlock(lang, wk, b, w, isNow, cap) {
const a = (u2) => u2 ? ' <a class="ke-src" href="' + esc(u2.replace(ORIGIN, '')) + '"' + (/^https?:/.test(u2) && !u2.startsWith(ORIGIN) ? ' rel="nofollow noopener" target="_blank"' : '') + '>' + esc(t(lang, 'src')) + '</a>' : '';
const E2 = b.ev.filter(e => inWeek(e, w)), by = new Map();
for (const e of E2) { if (!by.has(e.x.id)) by.set(e.x.id, []); by.get(e.x.id).push(e); }
const end = isNow ? wk.today : addD(w, 6);
let h = $q.bC + w + '">' + esc(t(lang, $q.bD, { a: N.fd(w, lang), b: N.fd(end, lang) })) + (isNow ? $q.bE + esc(t(lang, $q.bF)) + $q.bG : '') + '</h2>';
if (!E2.length) return h + $q.bH + esc(t(lang, $q.bI)) + '</p>';
h += $q.bH + esc(t(lang, $q.bJ, { e: nf(E2.length, lang), k: nf(by.size, lang) })) + $q.bK;
let i = 0;
for (const [id, L] of by) {
if (cap && i++ >= cap) { h += '<li>' + esc(t(lang, $q.bL, { k: nf(by.size - cap, lang) })) + '</li>'; break; }
const x = L[0].x;
h += $q.aO + pre(lang) + $q.l + x.s + '/">' + bd(lang, esc(x.n)) + '</a>' + (x.ar && x.ar !== x.mk ? $q.bM + bd(lang, esc(x.ar)) + $q.bN : '') + '<ul>' +
L.slice(0, 6).map(e => $q.aJ + esc(N.fd(e.d, lang)) + $q.aK + bd(lang, esc(evText(lang, e))) + a(e.src) + '</li>').join('') + (L.length > 6 ? '<li>' + esc(t(lang, $q.bL, { k: nf(L.length - 6, lang) })) + '</li>' : '') + $q.bO;
}
return h + '</ul>';
}
async function placePage(req, u, env, ctx, shell, lang, s) {
const wk = await weekly(env), b = wk.byPlace.get(s); if (!b || !b.L.length) return null;
const pn = b.P.n, nowE = b.ev.filter(e => inWeek(e, wk.w0)), nowK = new Set(nowE.map(e => e.x.id)).size;
let w = $q.bP + esc(t(lang, $q.bQ)) + $q.bR + s + $t.k7 + s + $t.k8 + esc(t(lang, $q.bS)) + '</p>';
w += weekBlock(lang, wk, b, wk.w0, true, 0);
w += '<h2>' + esc(t(lang, $q.bT)) + '</h2>' + wk.weeks.slice(1).map(x2 => weekBlock(lang, wk, b, x2, false, 25).replace('<h2 ', '<h3 ').replace('</h2>', '</h3>')).join('');
w += $q.bU + pre(lang) + $q.bV + s + '/">' + bd(lang, esc(t(lang, $q.bW, { p: pn }))) + $q.bX + pre(lang) + $q.bY + esc(t(lang, $q.bZ)) + $q.aI;
const body = hero(lang, bd(lang, esc(t(lang, 'wk_h1', { p: pn }))), bd(lang, esc(t(lang, $q.ca, { k: nf(b.L.length, lang), p: pn })))) + wrap(lang, w);
const canon = ORIGIN + pre(lang) + $q.cb + s + '/', last = b.ev.length ? b.ev[0].d : wk.today;
const ld = { '@context': $q.x, '@graph': [{ '@type': $q.y, '@id': canon + '#page', url: canon, name: t(lang, 'wk_h1', { p: pn }), inLanguage: lang, dateModified: last, about: { '@type': 'Place', name: pn }, isPartOf: { '@type': $q.cc, name: $q.cd, url: ORIGIN + '/' } },
{ '@type': $q.ce, itemListElement: [{ '@type': $q.cf, position: 1, name: $q.cd, item: ORIGIN + pre(lang) + '/' }, { '@type': $q.cf, position: 2, name: t(lang, $q.bZ), item: ORIGIN + pre(lang) + $q.cb }, { '@type': $q.cf, position: 3, name: pn, item: canon }] }] };
let desc = t(lang, $q.cg, { p: pn, e: nf(nowE.length, lang), k: nf(nowK, lang), w: N.fd(wk.w0, lang) }); if ([...desc].length > 155) desc = [...desc].slice(0, 152).join('').replace(/\s+\S*$/, '') + '...';
let title = t(lang, 'wk_t', { p: pn });
try { const d = new Date(wk.w0 + $q.w), th = new Date(d.getTime() + 3 * 864e5), y = th.getUTCFullYear(), w = 1 + Math.round((th - new Date(Date.UTC(y, 0, 4))) / 6048e5 - (3 - ((new Date(Date.UTC(y, 0, 4)).getUTCDay() + 6) % 7)) / 7);
const WL = { en: $q.ch, es: $q.ci, de: $q.cj, fr: $q.ck, nl: $q.ch, ru: $q.cl, zh: $q.cm, ar: $q.cn };
const wl = (WL[lang] || WL.en).replace('{w}', w).replace('{y}', y), t2 = title + (lang === 'zh' ? '（' + wl + '）' : ' (' + wl + ')'); if ([...t2].length <= 60) title = t2; } catch (e) {}
if ([...title].length + 11 <= 60) title += $q.aU;
return htmlPage(env, ctx, shell, lang, { title, desc, canon, body, ld, lastmod: last, alt: l => ORIGIN + pre(l) + $q.cb + s + '/', feed: null }, false);
}
async function hubPage(req, u, env, ctx, shell, lang) {
const wk = await weekly(env), from4 = wk.weeks[3];
const R = [...wk.byPlace.values()].filter(b => b.L.length).map(b => ({ b, now: b.ev.filter(e => inWeek(e, wk.w0)).length, four: b.ev.filter(e => e.d >= from4).length })).sort((a, c) => c.now - a.now || c.four - a.four || a.b.P.n.localeCompare(c.b.P.n));
const th = t(lang, 'wk_th');
const w = $t.k9 + th.map(h => $q.co + esc(h) + '</th>').join('') + $q.cp +
R.map(r => $q.cq + pre(lang) + $q.cb + r.b.P.s + '/">' + bd(lang, esc(r.b.P.n)) + $q.cr + nf(r.b.L.length, lang) + $q.cs + nf(r.now, lang) + $q.cs + nf(r.four, lang) + $q.av).join('') + $t.k10 + esc(t(lang, $q.bS)) + '</p>' + $q.bU + pre(lang) + $q.ct + esc(((TB.kbx_n33a_S || {})[lang] || (TB.kbx_n33a_S || {}).en || {}).dl_t || $q.cu) + $q.aI;
const canon = ORIGIN + pre(lang) + $q.cb;
return htmlPage(env, ctx, shell, lang, { title: t(lang, $q.cv) + $q.aU, desc: t(lang, $q.cw), canon, body: hero(lang, esc(t(lang, $q.cv)), esc(t(lang, $q.cw))) + wrap(lang, w), lastmod: wk.today, alt: l => ORIGIN + pre(l) + $q.cb }, false);
}
async function placeFeed(req, env, s, fmt) {
const wk = await weekly(env), b = wk.byPlace.get(s); if (!b || !b.L.length) return new Response($q.cx, { status: 404 });
const E2 = b.ev.slice(0, 80), home = ORIGIN + $q.cb + s + '/', self = home + 'feed.' + fmt, title = $q.cy + b.P.n + $q.aU, upd = (E2[0] ? E2[0].d : wk.today) + $q.w;
const it = e => ({ id: $q.cz + s + '/' + e.key, url: ORIGIN + $q.l + e.x.s + '/', title: e.x.n + ': ' + evText('en', e), text: e.x.n + ' (' + [e.x.ar, e.x.mk].filter(Boolean).join(', ') + '): ' + evText('en', e) + '.' + (e.src ? $q.cA + e.src : ''), d: e.d + $q.w });
const h = { 'cache-control': $q.cB, 'access-control-allow-origin': '*' };
if (fmt === 'json') return new Response(JSON.stringify({ version: $q.cC, title, home_page_url: home, feed_url: self, language: 'en', authors: [{ name: $q.cd, url: ORIGIN + '/' }], items: E2.map(it).map(i => ({ id: i.id, url: i.url, title: i.title, content_text: i.text, date_published: i.d })) }), { headers: Object.assign({ 'content-type': $q.cD }, h) });
const x = $s.k0 + xe(title) + $q.cE + xe(home) + $t.k11 + xe(self) + $t.k12 + xe(home) + $q.cF + upd + $t.k13 + ORIGIN + $t.k14 +
E2.map(it).map(i => $q.cG + xe(i.title) + $q.cE + xe(i.id) + $t.k15 + xe(i.url) + $q.cF + i.d + $q.cH + xe(i.text) + $q.cI).join('') + $q.cJ;
return new Response(x, { headers: Object.assign({ 'content-type': $q.cK }, h) });
}
async function sitemap(env) {
const wk = await weekly(env), alt = p => LANGS.map(l => $q.cL + l + $q.cM + ORIGIN + pre(l) + p + '"/>').join('') + $q.cN + ORIGIN + p + '"/>';
const U = [[$q.cb, wk.today], [$q.cO, wk.today]];
for (const b of wk.byPlace.values()) if (b.L.length && b.ev.length) U.push([$q.cb + b.P.s + '/', b.ev[0].d]);
const x = $s.k1 + U.flatMap(([p, d]) => LANGS.map(l => $q.cP + ORIGIN + pre(l) + p + $q.cQ + d + $q.cR + alt(p) + $q.cS)).join('') + $q.cT;
return new Response(x, { headers: { 'content-type': $q.cU, 'cache-control': $q.cV } });
}
export function mailReview(lang, x, since, stopUrl) {
const n = x.n, link = ORIGIN + $q.cW + encodeURIComponent(x.id), dir = lang === 'ar' ? $q.G : '';
return { subject: t(lang, $q.cX, { n }), text: [t(lang, $q.cY, { n, d: N.fd(since, lang) }), '', t(lang, $q.cZ), '', t(lang, $q.da) + ': ' + link, '', t(lang, $q.db, { n }), '', t(lang, $q.dc, { u: stopUrl })].join('\n'),
html: $q.dd + lang + '"' + dir + $t.k16 + esc(t(lang, $q.cY, { n, d: N.fd(since, lang) })) + $q.de + esc(t(lang, $q.cZ)) + $q.df + esc(link) + $s.k2 + esc(t(lang, $q.da)) + $q.dg + esc(t(lang, $q.db, { n })) + $t.k17 + esc(t(lang, $q.dc, { u: '' })) + $q.af + esc(stopUrl) + '">' + esc(stopUrl) + $q.dh };
}
export async function mailDelays(env, lang, s, stopUrl) {
const wk = await weekly(env), b = wk.byPlace.get(s); if (!b) return null;
const month = wk.today.slice(0, 7), mName = N.fd(month, lang), ix = wk.ix, dir = lang === 'ar' ? $q.G : '';
const over = b.L.filter(x => (ix.caseBy.get(x.id) || {}).overdue).map(x => ({ x, m: ix.caseBy.get(x.id).overdue })).sort((a, c) => c.m - a.m);
const mv = new Map(); for (const e of b.ev) if (e.k === 'moved' && e.d.slice(0, 7) === month && e.v.w === $q.di && String(e.v.b) > String(e.v.a)) mv.set(e.x.id, e);
const page = ORIGIN + pre(lang) + $q.cb + s + '/';
const li = (x, txt) => $q.aO + ORIGIN + pre(lang) + $q.l + x.s + '/">' + esc(x.n) + $q.dj + esc(txt) + '</li>';
const ol = over.slice(0, 10).map(o => li(o.x, N.tr(lang, $q.R, { m: o.m }))), vl = [...mv.values()].slice(0, 10).map(e => li(e.x, evText(lang, e)));
return { subject: t(lang, $q.dk, { m: mName, p: b.P.n }), text: [t(lang, $q.dl, { p: b.P.n, m: mName }), '', t(lang, $q.dm, { k: b.L.length, p: b.P.n, o: over.length, v: mv.size }), '', t(lang, $q.dn) + ': ' + page, '', t(lang, $q.dc, { u: stopUrl })].join('\n'),
html: $q.dd + lang + '"' + dir + $t.k18 + esc(t(lang, $q.dl, { p: b.P.n, m: mName })) + $q.de + esc(t(lang, $q.dm, { k: nf(b.L.length, lang), p: b.P.n, o: nf(over.length, lang), v: nf(mv.size, lang) })) + '</p>' +
$q.do + esc(t(lang, $q.dp)) + '</h2>' + (ol.length ? '<ul>' + ol.join('') + '</ul>' : '<p>' + esc(t(lang, $q.dq)) + '</p>') + $q.do + esc(t(lang, $q.dr)) + '</h2>' + (vl.length ? '<ul>' + vl.join('') + '</ul>' : '<p>' + esc(t(lang, $q.dq)) + '</p>') +
$q.aF + esc(page) + '">' + esc(t(lang, $q.dn)) + $t.k19 + esc(t(lang, $q.dc, { u: '' })) + $q.af + esc(stopUrl) + '">' + esc(stopUrl) + $q.dh };
}
async function mailPreview(u, env, kind) {
const lang = LANGS.includes(u.searchParams.get('lang')) ? u.searchParams.get('lang') : 'en', stop = ORIGIN + $q.ds;
let m = null;
if (kind === $q.dt) { const ix = await N.data(env), id = String(u.searchParams.get('id') || '').toUpperCase(); const x = ix.byId.get(id) || ix.P.find(okName); if (x && okName(x)) m = mailReview(lang, x, x.ad || ix.updated, stop); }
else { const s = String(u.searchParams.get('place') || 'bali').toLowerCase(); if (PLACES.some(P => P.s === s)) m = await mailDelays(env, lang, s, stop); }
if (!m) return new Response($q.cx, { status: 404 });
const page = $q.du + lang + $s.k3 + esc(m.subject) + $t.k20 +
$s.k4 + esc(t(lang, $q.dv)) + $t.k21 + esc(m.subject) + $t.k22 + m.html + $q.L +
$s.k5 + esc(m.text) + $q.dw;
return new Response(page, { headers: { 'content-type': $q.B, 'cache-control': $q.dx, 'x-robots-tag': $q.dy } });
}
const CHUNK = 40;
async function signups(env, ctx) {
const ix = await N.data(env), ids = ix.P.filter(okName).map(x => x.id).sort(), n = Math.ceil(ids.length / CHUNK), day = new Date().toISOString().slice(0, 10);
const key = i => new Request(ORIGIN + '/__e27/su/v1/' + day + '/' + i);
const got = await Promise.all([...Array(n)].map((_, i) => caches.default.match(key(i)).then(r => r ? r.json() : null).catch(() => null)));
const missing = got.map((g, i) => g ? -1 : i).filter(i => i >= 0);
if (missing.length) {
const i = missing[0], part = ids.slice(i * CHUNK, (i + 1) * CHUNK);
const job = (async () => {
const { rpcW } = await import('./kolaboro.js'), rows = {};
for (let k = 0; k < part.length; k += 8) await Promise.all(part.slice(k, k + 8).map(async id => { try { const r = await rpcW($q.dz, { p_action: $q.dA, p_payload: { domain: '', ref: id } }); if (r && r.ok && r.watchers) rows[id] = r.watchers; } catch (e) {} }));
await caches.default.put(key(i), new Response(JSON.stringify(rows), { headers: { 'cache-control': $q.dB } }));
})();
if (ctx && ctx.waitUntil) ctx.waitUntil(job.catch(() => {}));
}
let total = null; try { const { rpc } = await import('./kolaboro.js'); const m = await rpc($q.dC, {}); total = m && m.totals ? m.totals.followers : null; } catch (e) {}
const rows = [];
got.forEach(g => { if (g) for (const [id, w] of Object.entries(g)) { const x = ix.byId.get(id); if (x && w >= 3) rows.push({ id, slug: x.s, name: x.n, market: x.mk, watchers: w, page: ORIGIN + $q.l + x.s + '/' }); } });
rows.sort((a, b) => b.watchers - a.watchers);
const checked = got.reduce((a, g, i) => a + (g ? ids.slice(i * CHUNK, (i + 1) * CHUNK).length : 0), 0);
return new Response(JSON.stringify({ version: $q.dD, day, about: $s.k6 + CHUNK + $t.k23,
confirmed_watchers_total: total, total_source: $t.k24, threshold: 3, projects_checked_today: checked, projects_total: ids.length, projects: rows }), { headers: { 'content-type': $q.dE, 'cache-control': $q.dF, 'access-control-allow-origin': '*' } });
}
export async function noticeStates(env, ids) {
const ix = await N.data(env), X = await extra(env), out = {};
for (const id of ids) { const x = ix.byId.get(id); if (!x) continue; const L = noticesOf(ix, X, x); out[id] = { n: L.length, last: L[0] ? { d: L[0].d, t: L[0].t, s: L[0].s, src: L[0].src } : null }; }
return out;
}
export async function handle(req, u, env, ctx, shell) {
const p = u.pathname;
if (!PATHS.test(p)) return null;
if (p === $q.dG) return sitemap(env);
let m = p.match(/^\/weekly\/([a-z0-9-]{2,40})\/feed\.(atom|json)$/); if (m) return placeFeed(req, env, m[1], m[2]);
m = p.match(/^\/api\/x\/e27\/(mail\/(review|delays)|signups|notices\/([A-Za-z0-9-]{3,20}))\/?$/);
if (m) {
if (m[2]) return mailPreview(u, env, m[2]);
if (m[1] === $q.dH) return signups(env, ctx);
const ix = await N.data(env), x = ix.byId.get(m[3].toUpperCase()); if (!x || !okName(x)) return new Response(JSON.stringify({ error: $q.dI }), { status: 404, headers: { 'content-type': $q.dJ } });
const X = await extra(env);
return new Response(JSON.stringify({ id: x.id, developer: x.dv || null, kinds: [$q.dK, $q.dL], about: $s.k7, notices: noticesOf(ix, X, x) }), { headers: { 'content-type': $q.dE, 'cache-control': $q.cV, 'access-control-allow-origin': '*' } });
}
const lm = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(?:projects\/([a-z0-9-]{1,90})\/report(\/|\.pdf)?|weekly(?:\/([a-z0-9-]{2,40}))?(\/?))$/);
if (!lm) return null;
const lang = lm[1] || 'en';
if (lm[2]) {
const ix = await N.data(env), x = ix.bySlug.get(lm[2]); if (!x || !okName(x)) return null;
if (!lm[3]) return new Response(null, { status: 301, headers: { location: p + '/' } });
if (lm[3] === '.pdf') {
const bytes = await reportPdf(env, lang, x);
return new Response(req.method === 'HEAD' ? null : bytes, { headers: { 'content-type': $q.dM, 'content-disposition': $q.dN + x.s + '.pdf"', 'cache-control': $q.cV, 'x-robots-tag': $q.dO } });
}
return reportPage(req, u, env, ctx, shell, lang, x);
}
if (!lm[5]) return new Response(null, { status: 301, headers: { location: p + '/' } });
if (lm[4]) return placePage(req, u, env, ctx, shell, lang, lm[4]);
return hubPage(req, u, env, ctx, shell, lang);
}
export { weekly, evs, reportPdf };
