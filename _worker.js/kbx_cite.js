// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_cite__q, $s = TB.kbx_cite__s, $t = TB.kbx_cite__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import * as N from './kbx_named.js';
import { rpc } from './kolaboro.js';
import { S } from './kbx_cite_i18n.js';
import { coName, mkName } from './kbx_hdate.js';
import { ogImg } from './kbx_ogt.js';
import { t as W30 } from './kbx_n30c_named.js';
import { TB } from './kbx_strings.js';
import { jget } from './kbx_jget.js';
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:stories|changes)(?:\/.*)?$|^\/embed\/(?:card|tracker|badge|p|developer)\/.*$|^\/answers\/[a-z0-9-]{1,90}\.md$|^\/llms-projects\.txt$|^\/(?:es|de|fr|nl|ru|zh|ar)\/llms\.txt$|^\/llms\/[a-z0-9-]{2,60}\.txt$|^\/llms-full\/[a-z0-9-]{2,60}\.txt$/;
const MIN_STORY = 8;
const esc = N.esc, pre = N.pre;
const t = (lang, k, v) => { const s = (S[lang] && S[lang][k]) || S.en[k] || k; return v ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
const nt = (lang, k, v) => N.tr(lang, k, v);
const num = (n, lang) => { try { return new Intl.NumberFormat(LOC[lang] || 'en-GB').format(n); } catch (e) { return String(n); } };
const slug = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const slugM = m => encodeURIComponent(String(m).toLowerCase().replace(/\s+/g, '-'));
const ymIdx = s => { const m = /^(\d{4})-(\d{2})/.exec(s || ''); return m ? +m[1] * 12 + (+m[2] - 1) : null; };
const dir = lang => lang === 'ar' ? $q.a : '';
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const MEMO = {};
async function file(env, name, ttl) {
  const m = MEMO[name]; if (m && Date.now() - m.t < (ttl || 600000)) return m.v;
  let v = null;
  try { const o = await jget(env, name, ORIGIN + $q.b + name, ORIGIN + '/data/' + name, 600); v = o.a ? o.v : null; } catch (e) { v = null; }   // n40 d15: the shared copy (kbx_jget.js); assets only, as before
  MEMO[name] = { t: Date.now(), v }; return v;
}
let CX = null;
async function load(env) {
const ix = await N.data(env);
const [drift, price, real, ontime, prom] = await Promise.all([$q.c, $q.d, $q.e, $q.f, $q.g].map(f => file(env, f)));
if (CX && CX.ix === ix && CX.drift === drift && CX.price === price && CX.ontime === ontime) return CX;
const rev = x => N.reviewed(ix.caseBy.get(x.id));
const changes = [];
for (const [id, p] of Object.entries((drift && drift.projects) || {})) {
const x = ix.byId.get(id); if (!x || !rev(x)) continue;
for (const c of p.changes || []) if (c.from != null && c.to != null && !c.reverted && N.iso(c.first_seen)) changes.push({ x, c, d: N.iso(c.first_seen) });
}
changes.sort((a, b) => b.d.localeCompare(a.d) || a.x.n.localeCompare(b.x.n));
const added = ix.P.filter(x => N.iso(x.ad)).map(x => ({ x, d: N.iso(x.ad) }));
const months = [...new Set(changes.map(e => e.d.slice(0, 7)).concat(added.map(e => e.d.slice(0, 7))))].sort().reverse();
const byMk = new Map(); for (const x of ix.P) { if (!rev(x)) continue; if (!byMk.has(x.mk)) byMk.set(x.mk, []); byMk.get(x.mk).push(x); }
const markets = [...byMk.entries()].filter(([m, L]) => L.length >= MIN_STORY && String(m).toLowerCase() !== 'sumba').map(([m, L]) => ({ m, s: slug(m), L })).sort((a, b) => b.L.length - a.L.length || a.m.localeCompare(b.m));
const promMk = new Map((((prom && prom.markets) || [])).map(r => [r.market, r]));
const priceMk = new Map((((price && price.markets) || [])).map(r => [r.market, r]));
const realMk = new Map((((real && real.markets) || [])).map(r => [r.market, r]));
const today = N.iso(ix.updated) || new Date().toISOString().slice(0, 10), cur = today.slice(0, 7);
const storyMonths = [...new Set([cur].concat(months.filter(m => m >= $q.h && m <= cur)))].sort().reverse();
CX = { ix, drift, price, real, ontime, prom, rev, changes, added, months, markets, promMk, priceMk, realMk, today, cur, storyMonths };
return CX;
}
function late(X, x) {
const p = X.ontime && X.ontime.projects && X.ontime.projects[x.id]; if (!p || !p.first) return null;
const now = ymIdx((X.ontime.as_of_month || '') + '-01'), f = ymIdx(p.first + '-01'); if (now == null || f == null) return null;
return { late: now - f, first: p.first, cur: p.cur, moved: p.moved || 0 };
}
const pageOf = x => N.okHttp(x.url) ? N.fixU(x.url) : null;
const pUrl = (lang, x) => ORIGIN + pre(lang) + $q.i + x.s + '/';
const isPermit = c => (c.checks || {}).permit === 2;
const isEscrow = c => (c.checks || {}).escrow === true;
const fval = (lang, f, v, c) => {
if (f === $q.j && c && c.pct != null) return v === c.to ? (c.pct > 0 ? '+' : '') + num(c.pct, lang) + '%' : t(lang, $q.k);
if (v === true) return nt(lang, 'yes'); if (v === false) return nt(lang, 'no'); if (v == null) return t(lang, $q.l);
return typeof v === $q.m ? (f === $q.n ? String(v) : num(v, lang)) : $q.o + esc(v) + $q.p;
};
function embedPage(lang, title, inner, canon) {
return $s.k0 + lang + $q.q + lang + '"' + dir(lang) + $s.k1 + canon + $q.r + esc(title) + $q.s + $s.ECSS + $q.t + inner + $q.u;
}
const langOf = u => { const l = u.searchParams.get('lang'); return LANGS.includes(l) ? l : 'en'; };
function head(X, x, lang) {
  const c = X.ix.caseBy.get(x.id) || {};
  return $q.v + esc(x.n) + $q.w + esc([x.ar && x.ar !== x.mk ? x.ar : null, x.mk, x.co].filter(Boolean).join(', ').split(', ').filter((v, i, a) => a.findIndex(w => w.toLowerCase() === v.toLowerCase()) === i).join(', ')) + (c.stage ? ' · ' + esc(nt(lang, c.stage === $q.x ? $q.y : c.stage === $q.z ? $q.A : c.stage === $q.B ? $q.C : $q.D)) : '') + '</p>';
}
const foot = (X, x, lang) => $q.E + esc(t(lang, $q.F, { d: N.fd(N.lastmod(X.ix, x), lang) })) + $q.G + pUrl(lang, x) + $q.H + esc(t(lang, 'open')) + $q.I + esc(t(lang, 'cite')) + '</p>';
function eCard(X, x, lang) {
const c = X.ix.caseBy.get(x.id) || {}, canon = ORIGIN + $q.J + x.s + '/';
if (!X.rev(x)) return embedPage(lang, x.n, head(X, x, lang) + '<p>' + esc(t(lang, 'nr')) + '</p>' + foot(X, x, lang), canon);
const ho = N.handoverOf(X.ix, x), sha = x.sha || (c.fp || {}).sha256, sd = x.sealed || (c.fp || {}).date, lm = late(X, x);
const rows = [[t(lang, 'dev'), x.dv ? esc(x.dv) : esc(t(lang, $q.K))],
[t(lang, 'hand'), ho ? esc(N.fd(ho.d, lang)) + (lm && lm.late > 0 ? $q.L + esc(t(lang, $q.M, { m: lm.late })) + $q.p : '') : esc(t(lang, $q.K))],
[t(lang, $q.N), x.pn ? $q.O + esc(x.pn) + $q.P : isPermit(c) ? esc(t(lang, $q.Q)) : esc(t(lang, $q.K))],
[nt(lang, $q.R), esc(isEscrow(c) ? t(lang, $q.Q) : t(lang, $q.l))],
[nt(lang, $q.S), esc(t(lang, $q.T, { s: c.score || 0, v: c.vscore || 0 }))]];
if (sha && sd) rows.push([t(lang, $q.U, { d: N.fd(sd, lang) }), $q.V + esc(String(sha).slice(0, 16)) + $q.W]);
return embedPage(lang, x.n, head(X, x, lang) + '<dl>' + rows.map(r => '<dt>' + esc(r[0]) + $q.X + r[1] + '</dd>').join('') + '</dl>' + foot(X, x, lang), canon);
}
function eTracker(X, x, lang) {
const canon = ORIGIN + $q.Y + x.s + '/';
if (!X.rev(x)) return embedPage(lang, x.n, head(X, x, lang) + '<p>' + esc(t(lang, 'nr')) + '</p>' + foot(X, x, lang), canon);
const P = X.ix.prom[x.id] || [], lm = late(X, x);
let body = $q.v + esc(t(lang, 't_h')) + ': ' + esc(x.n) + $q.w + esc([x.mk, x.co].filter(Boolean).join(', ')) + '</p>';
if (!P.length) body += '<p>' + esc(nt(lang, $q.Z)) + '</p>';
for (const q of P.slice(0, 4)) {
const H = (q.hist || []).slice().sort((a, b) => String(a.seen).localeCompare(String(b.seen)));
const first = (H[0] && H[0].d) || q.d;
body += $q.aa + esc(nt(lang, 'pk_' + q.k)) + $q.ab + esc(N.fd(q.d, lang)) + $q.ac + esc(nt(lang, 'ps_' + q.st)) + $q.ad +
'<dt>' + esc(t(lang, $q.ae)) + $q.X + esc(N.fd(first, lang)) + (q.k === $q.af && lm ? ' (' + esc(lm.late > 0 ? t(lang, $q.M, { m: lm.late }) : t(lang, $q.ag)) + ')' : '') + '</dd>' +
'<dt>' + esc(t(lang, $q.ah)) + $q.X + esc(q.mv ? t(lang, $q.ai, { k: q.mv, mm: q.mm || 0 }) : t(lang, $q.aj)) + $q.ak;
if (H.length > 1) body += $q.al + esc(t(lang, $q.am)) + $q.an + H.slice(0, 6).map(h => '<li>' + esc(N.fd(h.d, lang)) + $q.ao + esc(nt(lang, $q.ap, { d: N.fd(h.seen, lang) })) + $q.aq).join('') + '</ol>';
}
return embedPage(lang, t(lang, 't_h') + ': ' + x.n, body + foot(X, x, lang), canon);
}
async function verifiedReply(x, ctx) {
const k = new Request(ORIGIN + $q.ar + x.id);
try { const hit = await caches.default.match(k); if (hit) return await hit.json(); } catch (e) {}
let v = null;
try { const L = (await rpc($q.as, { p_id: x.id })) || []; const r = L.find(r => r && r.reply && r.official && r.domain); v = r ? { domain: r.domain, approved: r.approved || null } : null; } catch (e) { return { err: true }; }
const p = caches.default.put(k, new Response(JSON.stringify(v), { headers: { 'cache-control': $q.at, 'content-type': $q.au } })); if (ctx && ctx.waitUntil) ctx.waitUntil(p.catch(() => {}));
return v;
}
const xe = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.av, "'": $q.aw }[c]));
function badgeSvg(left, right, col) {
const w1 = Math.round(14 + left.length * 6.6), w2 = Math.round(12 + right.length * 6.3), W = w1 + w2;
return $t.k0 + W + $q.ax + xe(left + ': ' + right) + $q.ay + xe(left + ': ' + right) + $q.az + W + $t.k1 + w1 + $q.aA + w2 + $q.aB + col + $q.aC + w1 + $q.aD + col + '"/>' +
$s.k2 + xe(left) + $q.aE + (w1 + 7) + $q.aF + xe(right) + $q.aG;
}
function codesPage(X, x, lang, vr) {
const q = lang === 'en' ? '' : $q.aH + lang, card = ORIGIN + $q.J + x.s + '/' + q, trk = ORIGIN + $q.Y + x.s + '/' + q, bdg = ORIGIN + $q.aI + x.s + '.svg';
const ifr = (src, h, ti) => $q.aJ + src + $q.aK + esc(ti) + $q.aL + h + $t.k2;
const code = s => $s.k3 + esc(s) + $q.aM;
const rv = X.rev(x);
const back = $q.aN + pUrl(lang, x) + '">' + esc(x.n + ': ' + t(lang, 'open')) + $q.aO;
let b = $q.v + esc(t(lang, $q.aP, { n: x.n })) + $q.aQ + esc(t(lang, $q.aR)) + '</p>';
b += $q.aS + esc(t(lang, $q.aT)) + '</p>' + ifr(card, rv ? 470 : 190, x.n) + $q.aU + esc(t(lang, $q.aV)) + '</p>' + code(ifr(card, rv ? 470 : 190, $q.aW + x.n) + back);
b += $q.v + esc(t(lang, $q.aX)) + '</p>' + ifr(trk, rv ? 380 : 190, x.n) + $q.aU + esc(t(lang, $q.aV)) + '</p>' + code(ifr(trk, rv ? 380 : 190, $q.aW + x.n) + back);
b += $q.v + esc(t(lang, $q.aY)) + $q.aQ + esc(t(lang, $q.aZ)) + '</p>' + (vr && vr.domain ? '<p>' + esc(t(lang, $q.ba, { d: vr.domain })) + $q.bb + bdg + $q.bc + code($q.bd + pUrl('en', x) + $q.be + bdg + $t.k3)
: '<p>' + esc(t(lang, $q.bf)) + $q.bg + ORIGIN + $q.bh + encodeURIComponent(x.id) + $q.bi + esc(t(lang, $q.bj)) + $q.aO);
b += $q.bk + ORIGIN + pre(lang) + $q.bl + x.s + $q.bi + esc(W30(lang, 'w_t')) + $q.bm + esc(W30(lang, 'w_d')) + '</p>';
b += $q.E + esc(t(lang, $q.bn)) + ' ' + esc(t(lang, 'e_lic')) + $q.bg + pUrl(lang, x) + $q.bi + esc(t(lang, 'open')) + $q.aO;
return embedPage(lang, t(lang, $q.aP, { n: x.n }), b, ORIGIN + $q.bo + x.s + '/');
}
async function shellPage(shell, lang, o) {
const path = o.path, canon = ORIGIN + pre(lang) + path;
const alts = o.langs === false ? '' : LANGS.map(l => $q.bp + l + $q.bq + ORIGIN + pre(l) + path + '">').join('') + $t.k4 + ORIGIN + path + '">';
const crumbs = o.crumbs.map(([n, p]) => [n, ORIGIN + pre(lang) + p]);
const ld = { '@context': $q.br, '@graph': [{ '@type': o.type || $q.bs, '@id': canon + '#page', url: canon, name: o.h1, description: o.desc, inLanguage: lang, dateModified: o.updated, isPartOf: { '@type': $q.bt, name: $q.bu, url: ORIGIN + '/' }, publisher: { '@type': $q.bv, name: $q.bu, url: ORIGIN + '/' } },
{ '@type': $q.bw, itemListElement: crumbs.map((c, i) => ({ '@type': $q.bx, position: i + 1, name: c[0], item: c[1] })) }].concat(o.ld || []) };
const tags = $q.by + esc(o.title) + ([...String(o.title)].length + 11 <= 60 ? $q.bz : '') + $t.k5 + esc(o.desc) + $q.bA + canon + '">' + alts +
$q.bB + (o.noindex ? $q.bC : $t.k6) + $s.k4 + esc(o.title) + $t.k7 + esc(o.desc) + $q.bD + canon + $q.bE + ogImg(canon) + $t.k8 +
(o.feed ? $t.k9 + esc(o.feed[1]) + $q.bq + o.feed[0] + '">' : '') +
$q.bF + JSON.stringify(ld).replace(/</g, $q.bG) + $q.bH + $s.PCSS;
const main = $t.k10 + crumbs.map((c, i) => i < crumbs.length - 1 ? $q.bd + esc(c[1].replace(ORIGIN, '')) + '">' + esc(c[0]) + '</a>' : esc(c[0])).join(' / ') + $q.bI + esc(o.h1) + '</h1>' + (o.lead ? $q.bJ + esc(o.lead) + '</p>' : '') + $t.k11 + o.body + $q.bK;
const sh = await shell(pre(lang) + $q.bL);
const res = new HTMLRewriter()
.on('title', { element(e) { e.remove(); } })
.on($s.k5, { element(e) { e.remove(); } })
.on($q.bM, { element(e) { e.remove(); } })
.on('head', { element(e) { e.append(tags, { html: true }); } })
.on('main', { element(e) { e.setInnerContent(main, { html: true }); } })
.on($q.bN, { element(e) { const l = e.getAttribute($q.bO); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + path); } })
.transform(new Response(sh.body, { headers: { 'content-type': $q.bP } }));
return new Response(await res.text(), { status: o.status || 200, headers: { 'content-type': $q.bP, 'cache-control': $q.bQ, 'last-modified': new Date((o.updated || $q.bR) + $q.bS).toUTCString() } });
}
const h2 = (id, s) => $q.bT + id + '">' + esc(s) + '</h2>';
const src = (href, label) => ' <a class="k-src" href="' + esc(href) + '"' + (/^https?:/.test(href) && !href.startsWith(ORIGIN) ? ' rel="noopener nofollow"' : '') + '>' + esc(label) + '</a>';
function story(X, mkt, month, lang) {
const { m, L } = mkt, cur = month === X.cur, mo = N.fd(month, lang), path = $q.bU + month + '/' + mkt.s + '/';
const delayRow = cur ? X.ix.dmk.get(m) : null;
let b = $q.bV + esc(t(lang, $q.bW, { d: N.fd(X.today, lang) })) + (cur ? '' : ' ' + esc(t(lang, $q.bX))) + '</p>';
const csvRows = [];
b += h2($q.bY, t(lang, $q.bZ));
if (delayRow && delayRow.with_date >= 5 && delayRow.share_past_first != null) {
b += '<p>' + esc(t(lang, $q.ca, { w: delayRow.with_date, mk: m, p: delayRow.past_first, s: num(delayRow.share_past_first, lang), m: delayRow.median_late == null ? '0' : num(delayRow.median_late, lang) })) + src($q.cb, $q.cb) + '</p>';
csvRows.push([$q.cc, delayRow.with_date, $q.cd, $q.cb], [$q.ce, delayRow.past_first, $q.cd, $q.cb], [$q.cf, delayRow.share_past_first, $q.cg, $q.cb], [$q.ch, delayRow.median_late, $q.ci, $q.cb]);
} else b += $q.bV + esc(t(lang, $q.cj, { mk: m })) + '</p>';
if (cur) {
const pr = X.promMk.get(m);
if (pr && pr.promises) { b += h2($q.ck, t(lang, $q.cl)) + '<p>' + esc(t(lang, $q.cm, { n: pr.promises, k: pr.kept, b: pr.broken, mv: pr.moved, pd: pr.pending, u: pr.unknown })) + src($q.cn, $q.co) + '</p>';
csvRows.push([$q.cp, pr.promises, $q.ck, $q.co], [$q.cq, pr.kept, $q.ck, $q.co], [$q.cr, pr.broken, $q.ck, $q.co], [$q.cs, pr.moved, $q.ck, $q.co], [$q.ct, pr.pending, $q.ck, $q.co]); }
const cs = L.map(x => X.ix.caseBy.get(x.id) || {}), pn = cs.filter(isPermit).length, es = cs.filter(isEscrow).length;
b += h2($q.cu, t(lang, $q.cv)) + '<p>' + esc(t(lang, $q.cw, { p: pn, n: L.length, pp: pct(pn, L.length), e: es, pe: pct(es, L.length) })) + src($q.cx, $q.cx) + '</p>';
csvRows.push([$q.cy, L.length, $q.cd, $q.cx], [$q.cz, pn, $q.cd, $q.cx], [$q.cA, es, $q.cd, $q.cx]);
}
b += h2($q.cB, t(lang, $q.cC));
const pi = X.priceMk.get(m), pts = pi ? (pi.index || []).filter(p => p.date && p.index != null) : [];
const inM = pts.filter(p => p.date.slice(0, 7) === month), before = pts.filter(p => p.date.slice(0, 7) < month);
const a = before.length ? before[before.length - 1] : inM[0], z = inM[inM.length - 1];
if (pi && a && z && a !== z && (pi.pairs_total || 0) >= 20) {
b += '<p>' + esc(t(lang, $q.cD, { d0: N.fd(pts[0].date, lang), a: num(a.index, lang), d1: N.fd(a.date, lang), b: num(z.index, lang), d2: N.fd(z.date, lang), k: num(pi.pairs_total, lang) })) + src($q.cE, $q.cE) + '</p>';
csvRows.push([$q.cF, a.index, $q.cG + pts[0].date + $q.cH + a.date, $q.cE], [$q.cI, z.index, $q.cJ + z.date, $q.cE]);
} else b += $q.bV + esc(t(lang, $q.cK, { mk: m })) + '</p>';
const rl = X.realMk.get(m);
if (rl && rl.comparison && rl.comparison.pct != null && rl.official && rl.advertised) {
const o = rl.official, per = o.period || [];
b += '<p>' + esc(t(lang, $q.cL, { k: rl.advertised.n_known, pct: num(Math.abs(Math.round(rl.comparison.pct)), lang), dir: t(lang, rl.comparison.pct >= 0 ? 'above' : 'below'), n: num(o.n, lang), p1: N.fd(per[0], lang), p2: N.fd(per[1], lang) })) + src(o.url, o.source) + src($q.cM, $q.cM) + '</p>';
csvRows.push([$q.cN, rl.comparison.pct, $q.cg, o.url], [$q.cO, o.n, $q.cP + (per[0] || '') + ' to ' + (per[1] || ''), o.url]);
}
const ch = X.changes.filter(e => e.x.mk === m && e.d.slice(0, 7) === month), chp = new Set(ch.map(e => e.x.id));
b += h2($q.cQ, t(lang, $q.cR)) + '<p>' + esc(ch.length ? t(lang, $q.cS, { n: ch.length, mk: m, k: chp.size }) : t(lang, $q.cT, { mk: m })) + src($q.cU, $q.cU) + '</p>';
if (ch.length) b += $q.cV + ch.slice(0, 12).map(e => changeLi(e, lang)).join('') + '</ul>' + (ch.length > 12 ? $q.cW + pre(lang) + $q.cX + month + '/#m-' + mkt.s + '">' + esc(t(lang, $q.cY)) + ' (' + ch.length + $q.cZ : '');
csvRows.push([$q.da, ch.length, $q.cQ, $q.cU]);
const ad = X.added.filter(e => e.x.mk === m && e.d.slice(0, 7) === month);
b += h2('new', t(lang, $q.db)) + (ad.length ? $q.dc + ad.map(e => $q.dd + pre(lang) + $q.i + e.x.s + '/">' + esc(e.x.n) + $q.de + esc(N.fd(e.d, lang)) + $q.df).join('') + '</ul>' : $q.bV + esc(t(lang, $q.dg, { mk: m })) + '</p>');
csvRows.push([$q.dh, ad.length, $q.cd, $q.di]);
const proj = [];
if (cur) {
const rows = L.slice().sort((p, q) => p.n.localeCompare(q.n)).map(x => {
const c = X.ix.caseBy.get(x.id) || {}, ho = N.handoverOf(X.ix, x), lm = late(X, x);
proj.push([x.id, x.n, ho ? ho.d : '', lm ? Math.max(0, lm.late) : '', isPermit(c) ? 'yes' : 'no', isEscrow(c) ? 'yes' : 'no', c.score || 0, c.vscore || 0, N.lastmod(X.ix, x), pUrl('en', x)]);
return $q.dj + esc(t(lang, $q.dk)) + $q.dl + pre(lang) + $q.i + x.s + '/">' + esc(x.n) + $q.dm + esc(t(lang, $q.dn)) + '">' + esc(ho ? N.fd(ho.d, lang) : t(lang, $q.K)) + $q.do + esc(t(lang, $q.dp)) + '">' + (lm && lm.late > 0 ? lm.late : '0') + $q.dq + esc(t(lang, 'th_pn')) + '">' + esc(isPermit(c) ? t(lang, $q.Q) : t(lang, $q.K)) + $q.do + esc(t(lang, $q.dr)) + '">' + (c.score || 0) + $q.ds + esc(t(lang, $q.dt)) + '">' + esc(N.fd(N.lastmod(X.ix, x), lang)) + $q.du;
});
b += h2($q.cd, t(lang, $q.dv, { mk: m })) + $s.k6 + [t(lang, $q.dk), t(lang, $q.dn), t(lang, $q.dp), t(lang, 'th_pn'), t(lang, $q.dr), t(lang, $q.dt)].map(esc).join($q.dw) + $q.dx + rows.join('') + $q.dy;
}
const url = ORIGIN + pre(lang) + path, cite = t(lang, $q.dz, { mk: m, mo, url, d: N.fd(X.today, lang) });
b += h2('cite', t(lang, $q.dA)) + $q.dB + esc(cite).replace(esc(url), $q.dC + esc(url) + '">' + esc(url) + $q.dD + (lang === 'zh' || lang === 'ar' ? ' ' : '')) + $t.k12 + month + '/' + mkt.s + $q.dE + esc(t(lang, 'dl')) + $q.aO;
b += h2('more', t(lang, $q.dF)) + $q.dG + slugM(m) + '/">' + esc(t(lang, $q.dH)) + ': ' + esc(m) + $t.k13 + esc(t(lang, $q.dI)) + $q.dJ + pre(lang) + $q.cX + month + '/">' + esc(t(lang, $q.cY)) + $q.dJ + pre(lang) + $q.dK + esc(t(lang, 'l_all')) + $q.dL;
const tl = t(lang, $q.dM, { mk: m, mo }); let title = tl; for (let i = 2; i < 5 && [...title].length > 60; i++) if (S[lang] && S[lang][$q.dM + i]) title = t(lang, $q.dM + i, { mk: m, mo });   // n40 k59: shorter forms keep the month
const ds = { '@type': $q.dN, '@id': url + $q.dO, name: $q.aW + t(lang, 'st_h1', { mk: m, mo }), description: t(lang, $q.dP, { k: L.length, mk: m }), url,
license: $t.k14, isAccessibleForFree: true,
creator: { '@type': $q.bv, name: $q.bu, url: ORIGIN + '/' }, temporalCoverage: month, dateModified: X.today, spatialCoverage: { '@type': 'Place', name: m + ', ' + (L[0].co || '') },
variableMeasured: [$t.k15, $q.dQ, $q.dR, $q.dS, $q.dT, $t.k16],
distribution: [{ '@type': $q.dU, encodingFormat: $q.dV, contentUrl: ORIGIN + $q.bU + month + '/' + mkt.s + '.csv' }, { '@type': $q.dU, encodingFormat: $q.au, contentUrl: ORIGIN + $q.cb }], citation: t('en', $q.dz, { mk: m, mo: N.fd(month, 'en'), url: ORIGIN + path, d: N.fd(X.today, 'en') }) };
return { path, title, h1: t(lang, 'st_h1', { mk: m, mo }), lead: t(lang, $q.dP, { k: L.length, mk: m }), desc: tl + '. ' + t(lang, $q.dP, { k: L.length, mk: m }), body: b, updated: X.today, ld: [ds], csvRows, proj,
crumbs: [[$q.bu, '/'], [t(lang, $q.dW), $q.bU], [m + ', ' + mo, path]] };
}
const csvCell = v => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
function storyCsv(X, mkt, month) {
const s = story(X, mkt, month, 'en');
const L = [$q.dX + mkt.m + ', ' + month + $q.dY + X.today + $t.k17 + ORIGIN + s.path, $q.dZ];
for (const r of s.csvRows) L.push(r.map((v, i) => csvCell(i === 3 && String(v).startsWith('/') ? ORIGIN + v : v)).join(','));
if (s.proj.length) { L.push('', $s.k7); for (const r of s.proj) L.push(r.map(csvCell).join(',')); }
return L.join('\n') + '\n';
}
function storiesIndex(X, lang) {
let b = '';
for (const month of X.storyMonths) b += h2('m-' + month, N.fd(month, lang)) + $q.ea + X.markets.map(k => $q.dd + pre(lang) + $q.bU + month + '/' + k.s + '/">' + esc(k.m) + $q.eb + k.L.length + $q.ec).join('') + '</ul>';
b += $t.k18 + pre(lang) + $q.ed + esc(t(lang, $q.cY)) + $t.k19;
return { path: $q.bU, title: t(lang, $q.ee), h1: t(lang, $q.ef), lead: t(lang, $q.eg, { k: MIN_STORY }), desc: t(lang, $q.eg, { k: MIN_STORY }), body: b, updated: X.today, type: $q.eh, crumbs: [[$q.bu, '/'], [t(lang, $q.dW), $q.bU]] };
}
function changeLi(e, lang) {
const c = e.c, x = e.x, f = t(lang, 'f_' + c.f) === 'f_' + c.f ? c.label : t(lang, 'f_' + c.f);
const line = c.f === $q.j && c.pct != null ? f + ': ' + (c.pct > 0 ? '+' : '') + num(c.pct, lang) + '%' : null;
const txt = line ? esc(line) : esc(t(lang, $q.ei, { f, a: $q.ej, b: $q.ek })).replace($q.ej, fval(lang, c.f, c.from, c)).replace($q.ek, fval(lang, c.f, c.to, c));
return $q.dd + pre(lang) + $q.i + x.s + '/">' + esc(x.n) + $q.el + txt + $q.em + esc(t(lang, $q.en, { d: N.fd(e.d, lang) })) + $q.eo + esc(c.sha_from || '') + $q.ep + esc(c.sha_to || '') + $q.eq + x.s + $q.ed + esc(t(lang, $q.er)) + $q.es;
}
function changesPage(X, month, lang) {
const mo = N.fd(month, lang), path = $q.cX + month + '/';
const ch = X.changes.filter(e => e.d.slice(0, 7) === month), ad = X.added.filter(e => e.d.slice(0, 7) === month);
let b = $t.k20 + esc(t(lang, $q.et)) + src($q.cU, $q.cU) + $q.eu;
b += $q.ev + esc(t(lang, 'ch_n', { n: ch.length, k: new Set(ch.map(e => e.x.id)).size, a: ad.length })) + $q.ew + esc(t(lang, $q.ex)) + $q.aO;
const mk = [...new Set(ch.map(e => e.x.mk))].sort((a, b2) => ch.filter(e => e.x.mk === b2).length - ch.filter(e => e.x.mk === a).length || a.localeCompare(b2));
if (mk.length) b += $q.bV + esc(t(lang, 'ch_by')) + $q.ey + mk.map(m => $q.ez + slug(m) + '">' + esc(m) + $q.eb + ch.filter(e => e.x.mk === m).length + $q.ec).join('') + '</ul>';
else b += $q.bV + esc(t(lang, $q.eA)) + '</p>';
for (const m of mk) b += h2('m-' + slug(m), m) + $q.cV + ch.filter(e => e.x.mk === m).map(e => changeLi(e, lang)).join('') + '</ul>';
if (ad.length) b += h2('added', t(lang, $q.eB)) + $q.dc + ad.slice().sort((p, q) => p.x.mk.localeCompare(q.x.mk) || p.x.n.localeCompare(q.x.n)).map(e => $q.dd + pre(lang) + $q.i + e.x.s + '/">' + esc(e.x.n) + $q.de + esc(e.x.mk) + ', ' + esc(N.fd(e.d, lang)) + $q.df).join('') + '</ul>';
const others = X.months.filter(m => m !== month);
if (others.length) b += h2($q.ci, t(lang, $q.eC)) + $q.ea + others.map(m => $q.dd + pre(lang) + $q.cX + m + '/">' + esc(N.fd(m, lang)) + $q.eD).join('') + '</ul>';
const up = [ch[0] && ch[0].d, ad.map(e => e.d).sort().pop()].filter(Boolean).sort().pop() || X.today;
return { path, title: t(lang, $q.eE, { mo }), h1: t(lang, 'ch_h1', { mo }), lead: t(lang, $q.eF, { mo }), desc: t(lang, $q.eF, { mo }), body: b, updated: up, type: $q.eh, feed: [ORIGIN + $q.eG, $q.eH],
crumbs: [[$q.bu, '/'], [t(lang, $q.eI), $q.cX], [mo, path]] };
}
function changesAtom(X) {
const E = X.changes.slice(0, 100), upd = (E[0] ? E[0].d : X.today) + $q.eJ;
const ent = E.map(e => { const c = e.c, f = c.label || c.f, v = x => x === true ? 'yes' : x === false ? 'no' : String(x);
const line = c.f === $q.j && c.pct != null ? f + ': ' + (c.pct > 0 ? '+' : '') + c.pct + '%' : f + ': ' + v(c.from) + ' to ' + v(c.to);
return $t.k21 + xe(e.x.id) + '/' + xe(c.f) + '/' + e.d + $q.eK + xe(e.x.n + ': ' + line) + $q.eL + e.d + $q.eM + pUrl('en', e.x) + $q.eN + xe(e.x.n + ' (' + e.x.mk + '): ' + line + $q.eO + e.d + $q.eP + (c.sha_from || '') + ' and ' + (c.sha_to || '') + $t.k22) + $q.eQ; }).join('');
return $t.k23 + ORIGIN + $t.k24 + upd + $q.eR + ORIGIN + $q.eS + ORIGIN + $t.k25 + ent + $q.eT;
}
function answers(X, x, tp) {
const c = X.ix.caseBy.get(x.id) || {}, rv = X.rev(x), page = pageOf(x), ho = N.handoverOf(X.ix, x), lm = late(X, x), P = X.ix.prom[x.id] || [];
const url = pUrl('en', x), sha = x.sha || (c.fp || {}).sha256, sd = x.sealed || (c.fp || {}).date, lc = N.lastmod(X.ix, x);
const ch = X.changes.filter(e => e.x.id === x.id).slice(0, 8), where = [x.ar && x.ar !== x.mk ? x.ar : null, x.mk, x.co].filter(Boolean).join(', ').split(', ').filter((v, i, a) => a.findIndex(w => w.toLowerCase() === v.toLowerCase()) === i).join(', ');
const L = ['# ' + x.n + $q.eU, '', $q.eV + url, $q.eW + LANGS.filter(l => l !== 'en').map(l => pUrl(l, x)).join(' '), $q.eX + lc + $t.k26, $t.k27, ''];
L.push($q.eY, '', N.quickAnswer(X.ix, x, 'en', tp || null), '');
L.push($q.eZ, '');
if (!rv) L.push(x.n + ' (' + where + $s.k8 + url, '');
else {
L.push(x.n + $q.fa + where + (x.dv ? ', by ' + x.dv : '') + (c.stage ? $q.fb + c.stage : '') + '. ' +
(ho ? $q.fc + N.fd(ho.d, 'en') + (lm && lm.late > 0 ? ', ' + lm.late + $t.k28 + N.fd(lm.first, 'en') + ')' : '') + '. ' : $t.k29) +
(x.pn ? $q.fd + x.pn + '. ' : isPermit(c) ? $t.k30 : $t.k31) +
c.score + $q.fe + (c.vscore || 0) + $t.k32, '');
}
L.push($q.ff + x.n + $q.fg, '', $s.k9 + url + $q.fh + (rv && c.claims ? '. Of ' + ((c.claims.verified || 0) + (c.claims.unverified || 0) + (c.claims.contradicted || 0)) + $q.fi + (c.claims.verified || 0) + $q.fj + (c.claims.unverified || 0) + $q.fk + (c.claims.contradicted || 0) + '.' : '.'), '');
L.push($q.fl + x.n + $q.fm, '');
if (rv && P.length) for (const q of P) L.push('- ' + N.tr('en', 'pk_' + q.k) + ': ' + N.fd(q.d, 'en') + ' (' + N.tr('en', 'ps_' + q.st) + (q.mv ? $q.fn + q.mv + $q.fo + (q.mm || 0) + $q.fp : $q.fq) + $q.fr + (q.src === 'page' ? $q.fs + (q.sha ? $q.ft + q.sha : '') : $q.fu) + $q.eO + (((q.hist || [])[0] || {}).seen || q.seen) + ')');
else L.push(rv ? $t.k33 : $q.fv);
L.push('', $q.fw + ORIGIN + $q.Y + x.s + '/', '');
L.push($q.fx + x.n + $q.fy, '', x.pn ? $q.fz + x.pn + $q.fA + (N.okHttp(x.du) ? N.fixU(x.du) : page || url) + ').' : $t.k34 + (rv && isPermit(c) ? $t.k35 : ''));
const rw = x.rw || c.register; if (rw && rw.register) L.push($q.fB + rw.register + ', ' + (rw.item || '') + ': ' + (rw.status || '') + (rw.checked ? $q.fC + rw.checked + ')' : '') + $q.fD + ORIGIN + $q.fE);
L.push('', $q.fF, '', x.dv ? x.dv + (x.dvs && X.ix.devs.has(x.dvs) ? ': ' + ORIGIN + $q.fG + x.dvs + '/' : '') + ((x.fx || {}).developer_company && N.cleanOk(x.fx.developer_company) ? $q.fH + x.fx.developer_company : '') : $q.fI, '');
L.push($q.fJ, '', $s.k10 + url + $t.k36 + ORIGIN + $q.bh + encodeURIComponent(x.id), '');
L.push($q.fK, '');
if (ch.length) for (const e of ch) { const cc = e.c, v = z => z === true ? 'yes' : z === false ? 'no' : String(z); L.push('- ' + e.d + ': ' + (cc.label || cc.f) + ': ' + (cc.f === $q.j && cc.pct != null ? (cc.pct > 0 ? '+' : '') + cc.pct + '%' : v(cc.from) + ' to ' + v(cc.to)) + $q.fL + (cc.sha_from || '') + ' and ' + (cc.sha_to || '') + ')'); }
else L.push($t.k37);
if (sha && sd) L.push('', $q.fM + sd + $q.fN + sha + $q.fO + ORIGIN + $q.fP);
L.push('', $q.fQ, '');
const S2 = [...new Set([page, N.okHttp(x.du) ? N.fixU(x.du) : null, ...(x.src || []).filter(N.okHttp).map(N.fixU)].filter(Boolean))].slice(0, 12);
for (const s of S2) L.push('- ' + s);
L.push('- ' + ORIGIN + $q.fR + x.s + $q.fS, '', $q.fT, '', $q.fU + x.n + $q.fV + url + $q.fW + lc + $q.fX, '');
return L.join('\n');
}
function llmsProjects(X) {
const L = [$t.k38, '', $t.k39 + X.today + $s.k11 + ORIGIN + $s.k12, ''];
const mk = new Map(); for (const x of X.ix.P) { if (!mk.has(x.mk)) mk.set(x.mk, []); mk.get(x.mk).push(x); }
for (const m of [...mk.keys()].sort()) {
L.push('## ' + m, '');
for (const x of mk.get(m).sort((a, b) => a.n.localeCompare(b.n))) {
const c = X.ix.caseBy.get(x.id) || {}, ho = N.handoverOf(X.ix, x), lm = late(X, x);
const s = X.rev(x) ? (ho ? $q.fY + N.fd(ho.d, 'en') + (lm && lm.late > 0 ? ' (' + lm.late + $q.fZ : '') : $q.ga) + $q.gb + (x.pn || isPermit(c) ? $q.gc : $q.gd) + '; ' + c.score + $q.ge + (c.vscore || 0) + $q.gf : $q.gg;
L.push('- [' + x.n + '](' + pUrl('en', x) + ')' + (x.dv ? $q.gh + x.dv : '') + ': ' + s + $q.gi + N.lastmod(X.ix, x) + $q.gj + ORIGIN + $q.gk + x.s + '.md');
}
L.push('');
}
return L.join('\n');
}
const LLD = {};
const llT = (lang, i, v) => String(($t.o_LL[lang] || $t.o_LL.en)[i]).replace(/\{(\w+)\}/g, (m, k) => v && v[k] != null ? v[k] : m);
const fdate = (d, lang) => { try { return new Intl.DateTimeFormat(LOC[lang] || 'en-GB', { day: $q.gl, month: 'long', year: $q.gl, timeZone: 'UTC' }).format(new Date(d + $q.bS)); } catch (e) { return d; } };
const CO_AL = { 'Puerto Rico (USA)': 'Puerto Rico', 'St Lucia': 'Saint Lucia', 'United States': 'USA', 'United Arab Emirates': 'UAE' };
export function llmsCountries(X) { const m = new Map(); for (const x of X.ix.P) if (x.co) { const co = CO_AL[x.co] || x.co, k = slug(co); if (!m.has(k)) m.set(k, { co, s: k, L: [] }); m.get(k).L.push(x); } return [...m.values()].sort((a, b) => b.L.length - a.L.length || a.co.localeCompare(b.co)); }
async function llmsLang(X, env, lang, only) {
const key = lang + '|' + (only ? only.s : '*') + '|' + X.today + '|' + X.ix.P.length; if (LLD[key]) return LLD[key];
const P = only ? only.L : X.ix.P;
let trP = null; try { trP = (await import('./kbx_tr.js')).trProject; } catch (e) { trP = null; }
const tps = trP ? await Promise.all(P.map(x => trP(env, x.id, lang).catch(() => null))) : P.map(() => null);
const tpOf = new Map(P.map((x, i) => [x.id, tps[i]]));
const L = ['# ' + llT(lang, 0) + (only ? ': ' + coName(only.co, lang) : ''), '', '> ' + llT(lang, 1, { d: fdate(X.today, lang) }), ''];
L.push('## ' + llT(lang, 2), '', '- ' + ORIGIN + $q.gm, '- ' + ORIGIN + $q.gn, '- ' + ORIGIN + $q.go, ...LANGS.filter(l => l !== 'en' && l !== lang).map(l => '- ' + ORIGIN + '/' + l + $q.gm), '- ' + ORIGIN + $q.gp + llmsCountries(X).slice(0, 6).map(c => c.s).join(', ') + $q.gq, '- ' + ORIGIN + $t.k40, '- ' + ORIGIN + $q.gr, '');
const byCo = new Map(); for (const x of P) { const c = x.co || '-'; if (!byCo.has(c)) byCo.set(c, new Map()); const m = byCo.get(c); if (!m.has(x.mk)) m.set(x.mk, []); m.get(x.mk).push(x); }
for (const [co, M] of [...byCo.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
if (!only) L.push('## ' + coName(co, lang) + ' (' + llT(lang, 3, { n: [...M.values()].reduce((a, v) => a + v.length, 0) }) + ')', '');
for (const [mk, xs] of [...M.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0])))) {
L.push((only ? '## ' : '### ') + mkName(mk, lang), '');
for (const x of xs.sort((a, b) => a.n.localeCompare(b.n))) {
let qa = ''; try { qa = N.quickAnswer(X.ix, x, lang, tpOf.get(x.id) || null); } catch (e) { qa = ''; }
L.push('- [' + x.n + '](' + pUrl(lang, x) + ')' + (qa ? ': ' + qa.replace(/\s+/g, ' ').trim() : '') + ' ' + ORIGIN + $q.gk + x.s + '.md');
}
L.push('');
}
}
const out = L.join('\n'); for (const k of Object.keys(LLD)) if (!k.endsWith('|' + X.today + '|' + X.ix.P.length)) delete LLD[k];
if (Object.keys(LLD).length < 40) LLD[key] = out; return out;
}
function citeSitemap(X) {
const U = [];
const lastIn = m => [(X.changes.find(e => e.d.slice(0, 7) === m) || {}).d, X.added.filter(e => e.d.slice(0, 7) === m).map(e => e.d).sort().pop()].filter(Boolean).sort().pop() || X.today;
const entries = [[$q.bU, X.today], ...X.storyMonths.flatMap(m => X.markets.map(k => [$q.bU + m + '/' + k.s + '/', m === X.cur ? X.today : m + '-28'])), ...X.months.map(m => [$q.cX + m + '/', lastIn(m)])];
const out = [];
for (const [p, d] of entries) for (const l of LANGS) out.push($q.gs + ORIGIN + pre(l) + p + $q.gt + d + $q.gu + LANGS.map(k => $t.k41 + k + $q.bq + ORIGIN + pre(k) + p + '"/>').join('') + $t.k42 + ORIGIN + p + $q.gv);
return $s.k13 + out.join('') + $q.gw;
}
const txt = (body, type, extra) => new Response(body, { headers: Object.assign({ 'content-type': type, 'cache-control': 'public, max-age=900', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' }, extra || {}) });
function eDev(X, d, lang) {   // n40 k45 (R03-18): developer delivery record widget, from the tracked projects (strings dw_* in kbx_cite_i18n.json)
const L = d.ids.map(i => X.ix.byId.get(i)).filter(x => x && X.rev(x)), cs = x => X.ix.caseBy.get(x.id) || {}, o = x => (X.ontime && X.ontime.projects || {})[x.id] || {};
const dn = x => cs(x).stage === $q.B || /^(done_|completed)/.test(o(x).s || ''), open = L.filter(x => !dn(x)), lt = open.map(x => ({ x, l: late(X, x) })).filter(e => e.l), past = lt.filter(e => e.l.late > 0).sort((a, b) => b.l.late - a.l.late);
const of = (a, b) => t(lang, 'dw_of', { a: num(a, lang), b: num(b, lang) }), dUrl = ORIGIN + pre(lang) + $q.fG + d.s + '/';
const rows = [[t(lang, 'dw_n'), num(L.length, lang)], [t(lang, $q.gx), of(L.filter(dn).length, L.length)], [t(lang, $q.gy), of(past.length, lt.length)], [t(lang, $q.gz), of(L.filter(x => o(x).moved > 0).length, L.length)]];
let b = $q.v + esc(d.n) + $q.w + esc(t(lang, 'dw_h')) + $q.gA + rows.map(r => '<dt>' + esc(r[0]) + $q.X + esc(r[1]) + '</dd>').join('') + '</dl>';
b += past.length ? '<ol>' + past.slice(0, 5).map(e => $q.dd + pUrl(lang, e.x) + $q.H + esc(e.x.n) + $q.gB + esc(t(lang, $q.M, { m: e.l.late })) + $q.aq).join('') + '</ol>' : lt.length ? '' : $q.aU + esc(t(lang, $q.gC)) + '</p>';
return embedPage(lang, d.n + ': ' + t(lang, 'dw_h'), b + $q.E + esc(t(lang, $q.F, { d: N.fd(X.ix.updated, lang) })) + $q.G + dUrl + $q.H + esc(t(lang, $q.gD)) + $q.I + esc(t(lang, $q.gE)) + '</p>', ORIGIN + $q.gF + d.s + '/');
}
const nf = () => new Response($q.gG, { status: 404, headers: { 'content-type': $q.gH, 'cache-control': $q.gI } });
export async function handle(req, u, env, ctx, shell) {
const p = u.pathname;
if (req.method !== 'GET' && req.method !== 'HEAD') return null;
if (!PATHS.test(p)) return null;
let X; try { X = await load(env); } catch (e) { return new Response($t.k43, { status: 503, headers: { 'content-type': $q.gH, 'retry-after': '60', 'cache-control': $q.gJ } }); }
let m;
if ((m = /^\/embed\/(card|tracker|p)\/([a-z0-9-]{1,90})(\/?)$/.exec(p))) {
if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } });
const x = X.ix.bySlug.get(m[2]); if (!x) return nf();
const lang = langOf(u), html = m[1] === 'card' ? eCard(X, x, lang) : m[1] === $q.gK ? eTracker(X, x, lang) : codesPage(X, x, lang, await verifiedReply(x, ctx));
return new Response(html, { headers: { 'content-type': $q.gL, 'cache-control': $q.gM, 'x-robots-tag': $q.bC } });
}
if ((m = /^\/embed\/developer\/([a-z0-9-]{1,90})(\/?)$/.exec(p))) {
if (!m[2]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } });
const d = X.ix.devs.get(m[1]); if (!d || !d.ids.some(i => X.ix.byId.get(i) && X.rev(X.ix.byId.get(i)))) return nf();
return new Response(eDev(X, d, langOf(u)), { headers: { 'content-type': $q.gL, 'cache-control': $q.gM, 'x-robots-tag': $q.bC } });
}
if ((m = /^\/embed\/badge\/([a-z0-9-]{1,90})\.svg$/.exec(p))) {
const x = X.ix.bySlug.get(m[1]); if (!x) return nf();
const vr = await verifiedReply(x, ctx), H = { 'content-type': $q.gN, 'access-control-allow-origin': '*', 'x-content-type-options': $q.gO };
if (vr && vr.domain) return new Response(badgeSvg($q.gP, $q.gQ + vr.domain, $q.gR), { headers: Object.assign(H, { 'cache-control': $q.gS }) });
return new Response(badgeSvg($q.bu, vr && vr.err ? $q.gT : $q.gU, $q.gV), { status: vr && vr.err ? 503 : 404, headers: Object.assign(H, { 'cache-control': $q.gW }) });
}
if ((m = /^\/answers\/([a-z0-9-]{1,90})\.md$/.exec(p))) {
const x = X.ix.bySlug.get(m[1]); if (!x) return nf();
let tp = null; try { tp = await (await import('./kbx_tr.js')).trProject(env, x.id, 'en'); } catch (e) { tp = null; }
return txt(answers(X, x, tp), $q.gX, { link: '<' + pUrl('en', x) + $q.gY, 'last-modified': new Date(N.lastmod(X.ix, x) + $q.bS).toUTCString() });
}
if (p === $q.go) return txt(llmsProjects(X), $q.gH);
if ((m = /^\/(es|de|fr|nl|ru|zh|ar)\/llms\.txt$/.exec(p))) return txt(await llmsLang(X, env, m[1], null), $q.gH, { 'content-language': m[1], 'x-robots-tag': $q.gZ });
if ((m = /^\/llms\/([a-z0-9-]{2,60})\.txt$/.exec(p))) { const c = llmsCountries(X).find(z => z.s === m[1]); if (!c) return nf(); return txt(await llmsLang(X, env, 'en', c), $q.gH, { 'x-robots-tag': $q.gZ }); }
if ((m = /^\/llms-full\/([a-z0-9-]{2,60})\.txt$/.exec(p))) {
const c = llmsCountries(X).find(z => z.s === m[1]); if (!c) return nf();
const k = 'full|' + c.s + '|' + X.today + '|' + X.ix.P.length; if (LLD[k]) return txt(LLD[k], $q.gH, { 'x-robots-tag': $q.gZ });
let trP = null; try { trP = (await import('./kbx_tr.js')).trProject; } catch (e) { trP = null; }
const L = c.L.slice().sort((a, b) => String(a.mk).localeCompare(String(b.mk)) || a.n.localeCompare(b.n)), tps = trP ? await Promise.all(L.map(x => trP(env, x.id, 'en').catch(() => null))) : L.map(() => null);
const mks = [...new Set(L.map(x => x.mk))];
const out = [$t.k44 + c.co + $q.ha, '', '> ' + L.length + $q.hb + mks.length + $q.hc + (mks.length === 1 ? '' : 's') + ' (' + mks.join(', ') + $s.k14 + ORIGIN + $t.k45 + X.today + $t.k46 + ORIGIN + $q.hd + c.s + '.txt', '',
...L.map((x, i) => answers(X, x, tps[i]).replace(/^# /, '# [' + x.mk + '] ') + $q.he)].join('\n');
if (Object.keys(LLD).filter(z => z.startsWith('full|')).length < 8) LLD[k] = out;
return txt(out, $q.gH, { 'x-robots-tag': $q.gZ });
}
if (p === $q.hf) return txt(citeSitemap(X), $q.hg);
if (p === $q.eG) return txt(changesAtom(X), $q.hh);
if ((m = /^\/stories\/(\d{4}-\d{2})\/([a-z0-9-]{1,60})\.csv$/.exec(p))) {
const k = X.markets.find(z => z.s === m[2]); if (!k || !X.storyMonths.includes(m[1])) return nf();
return txt(storyCsv(X, k, m[1]), $q.hi, { 'content-disposition': $q.hj + m[2] + '-' + m[1] + '.csv"', link: '<' + ORIGIN + $q.bU + m[1] + '/' + m[2] + $q.hk });
}
const pm = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(stories|changes)(\/.*)?$/.exec(p); if (!pm) return nf();
const lang = pm[1] || 'en', kind = pm[2], rest = pm[3] || '';
if (!rest || (rest !== '/' && !rest.endsWith('/'))) return /^(\/[a-z0-9-]+)*$/.test(rest) ? new Response(null, { status: 301, headers: { location: p + '/' + u.search } }) : nf();
let o = null;
if (kind === $q.hl) {
if (rest === '/') o = storiesIndex(X, lang);
else if ((m = /^\/(\d{4}-\d{2})\/([a-z0-9-]{1,60})\/$/.exec(rest))) { const k = X.markets.find(z => z.s === m[2]); if (k && X.storyMonths.includes(m[1])) o = story(X, k, m[1], lang); }
} else {
if (rest === '/') { if (!X.months.length) return nf(); return new Response(null, { status: 302, headers: { location: pre(lang) + $q.cX + X.months[0] + '/', 'cache-control': $q.bQ } }); }
if ((m = /^\/(\d{4}-\d{2})\/$/.exec(rest)) && X.months.includes(m[1])) o = changesPage(X, m[1], lang);
}
if (!o) return nf();
return shellPage(shell, lang, o);
}
