// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_t27__q, $s = TB.kbx_t27__s, $t = TB.kbx_t27__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { t31, loadS as loadS31 } from './kbx_n31b_page.js';
import { t27 } from './kbx_t27_i18n.js';
import { mkName } from './kbx_hdate.js';
import { trData } from './kbx_tr.js';
import { trustRender, head, crumbLd } from './kbx_trust.js';
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const PAGE_RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(corrections|buyer-cases|cite|contact|transparency-badge|faq)(\/?)$/;
export const FILE_RX = /^\/embed\/transparency\/([a-z0-9-]{1,90})\.svg$|^\/rankings\/transparency(?:\/([a-z0-9-]{2,40}))?\.csv$/;
export const PAGES = ['/corrections/', '/buyer-cases/', '/cite/', '/contact/', '/transparency-badge/', '/faq/'];
export const REVIEWED = '2026-11-13';
const BADGE_MIN = 70;
const MAIL = { hello: 'hello@kolaboro.com', founder: 'carlos@kolaboro.com', press: 'press@kolaboro.com' };
const CASES = [];
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.a, "'": '&#39;' }[c]));
const bdi = s => '<bdi>' + esc(s) + $q.b;
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, a) => v && v[a] != null ? v[a] : m);
const te = (lang, k, v) => fill(esc(t27(lang, k)), v);
const tx = (lang, k, v) => fill(t27(lang, k), v);
const nf = (lang, n) => Number(n).toLocaleString(LOC[lang] || 'en-GB');
const fdt = (iso, lang) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); if (!m) return String(iso || ''); try { return new Intl.DateTimeFormat(LOC[lang] || 'en-GB', { day: $q.c, month: 'long', year: $q.c, timeZone: 'UTC' }).format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))); } catch (e) { return iso.slice(0, 10); } };
const tm = (iso, lang) => $q.d + esc(iso) + '">' + esc(fdt(iso, lang)) + $q.e;
const mail = (a, subj) => $q.f + a + (subj ? $q.g + encodeURIComponent(subj) : '') + $q.h + a + $q.i;
const ul = L => '<ul>' + L.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
const links = (lang, L) => '<h2>' + esc(t27(lang, $q.j)) + $q.k + L.map(([h, k]) => $q.l + h + '">' + esc(t27(lang, k)) + $q.m).join('') + '</ul>';
const reviewed = lang => $q.n + fill(esc(t27(lang, 'rev')), { d: tm(REVIEWED, lang) }) + '</p>';
const SHARED = (globalThis.__kbJson = globalThis.__kbJson || {});
async function load(env, name) {
const m = SHARED[name]; if (m && (m.a || Date.now() - m.t < 600000)) return m.v;
let r = null, a = false;
try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + $q.o + name)); a = !!(r && r.ok); } catch (e) { r = null; }
if (!r || !r.ok) r = await fetch(ORIGIN + $q.p + name, { cf: { cacheTtl: 300, cacheEverything: true } });
if (!r.ok) throw new Error(name + ' ' + r.status);
const v = await r.json(); SHARED[name] = { t: Date.now(), v, a }; return v;
}
const eligible = ix => [...ix.rows.values()].filter(r => !r.sumba && r.score >= BADGE_MIN).sort((a, b) => b.score - a.score || a.n.localeCompare(b.n));
function corrPage(C, lang, id, SL, pg) {
const st = v => v == null ? '' : esc(t27(lang, 'st_' + v) || v);
const E = (C.entries || []).filter(e => !id || e.id === id);
const row = e => $q.q + tm(e.date, lang) + $q.r + (SL[e.id] ? $q.s + pre(lang) + $q.t + SL[e.id].s + $q.u + esc(SL[e.id].n) + $q.v + esc(e.id) + $q.w : '<bdi>' + esc(e.id) + $q.b) + ' · ' + esc((e.kind === 'field' || e.kind === $q.x ? t31(lang, 'co_k_' + e.kind) : '') || t27(lang, e.kind === 'pin' ? $q.y : $q.z)) + '<br>' +
    (e.kind === 'pin' ? esc(t27(lang, $q.y)) + ': ' + st(e.after) + '.' : e.before ? te(lang, $q.A, { what: $q.B + esc(e.what) + $q.w, b: st(e.before), a: st(e.after) }) : te(lang, 'co_to', { what: $q.B + esc(e.what) + $q.w, a: st(e.after) })) + $q.C + esc(e.why) + $q.D;
const A = (C.audits || []).map(a => '<p>' + te(lang, $q.E, { d: tm(a.date, lang), n: nf(lang, a.sample_projects), c: nf(lang, a.claims), s: nf(lang, a.supported), w: nf(lang, a.wrong), u: nf(lang, a.unchecked), r: Number(a.error_rate_pct).toLocaleString(LOC[lang] || 'en-GB'), k: nf(lang, a.claims - a.unchecked) }) + $q.F + esc(t27(lang, $q.G)) + '</p>' +
(a.method ? $q.H + esc(t27(lang, $q.I)) + $q.J + esc(a.method.replace(ORIGIN, '')) + '">' + esc(a.method.replace(ORIGIN, '').replace(/^\//, '')) + $q.K : '')).join('');
const latest = (C.entries || []).reduce((m, e) => e.date > m ? e.date : m, '');
const log = id ? $q.L + te(lang, $q.M, { id: bdi(id) }) + '</h2>' + (E.length ? $q.N + E.map(row).join('') + '</ol>' : $q.O + te(lang, $q.P, { id: bdi(id) }) + '</p>') + $q.Q + pre(lang) + $q.R + esc(t27(lang, $q.S)) + $q.K
: $q.L + esc(t27(lang, $q.T)) + '</h2>' + (E.length ? '<p>' + te(lang, 'co_n', { n: nf(lang, E.length), d: tm(latest, lang) }) + $q.U + esc(t27(lang, 'co_en')) + $q.V + E.map(row).join('') + '</ol>' : $q.O + esc(t27(lang, $q.W)) + '</p>');
const req = $q.X + esc(t27(lang, $q.Y)) + '</h2>' + (pg ? $q.Z + te(lang, 'co_pg', { p: $q.s + esc(pg) + $q.aa + esc($q.ab + pg) + '</a>' }) + '</p>' : '') + '<p>' + te(lang, $q.ac, { mail: mail(MAIL.hello) }) + $t.k0 + MAIL.hello + $q.g + encodeURIComponent(t27(lang, $q.ad) + (id ? ' ' + id : '') + (pg ? ' ' + pg : '')) + (pg ? $q.ae + encodeURIComponent(fill(t27(lang, $q.af), { u: ORIGIN + pg })) : '') + '">' + esc(t27(lang, $q.ag)) + $q.K +
$q.ah + esc(t27(lang, $q.ai)) + $q.aj + esc(t27(lang, 'co_rm')) + $q.ak + esc(t27(lang, $q.al)) + $t.k1;
const body = $q.am + head(lang, [[t27(lang, 'co_h1'), pre(lang) + $q.an]], esc(t27(lang, 'co_h1')), esc(t27(lang, $q.ao)), $q.n + fill(esc(t27(lang, 'upd')), { d: tm(C.updated || REVIEWED, lang) }) + '</p>') +
$q.ap + (id ? log + req : $q.aq + esc(t27(lang, $q.ar)) + '</h2>' + A + log + req) +
links(lang, [[pre(lang) + $q.as, 'l_mod'], [$q.at, 'l_ind'], [pre(lang) + $q.au, $q.av], [pre(lang) + $q.aw, $q.ax]]) + $q.ay;
const title = t27(lang, $q.az), desc = t27(lang, $q.aA), url = ORIGIN + pre(lang) + $q.an;
return { path: $q.an, title, desc, body, ttl: 600, ld: [{ '@type': $q.aB, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: C.updated || REVIEWED, publisher: { '@type': $q.aC, name: $q.aD, url: ORIGIN + '/' } },
{ '@type': $q.aE, name: C.name || $q.aF, description: desc, url, license: $t.k2, dateModified: C.updated || REVIEWED, creator: { '@type': $q.aC, name: $q.aD, url: ORIGIN + '/' }, distribution: [{ '@type': $q.aG, encodingFormat: $q.aH, contentUrl: ORIGIN + $q.aI }] },
crumbLd(lang, [[t27(lang, 'co_h1'), pre(lang) + $q.an]])] };
}
function casesPage(lang) {
const pub = CASES.length ? '<ul>' + CASES.map(c => '<li>' + esc(c.title) + '</li>').join('') + '</ul>' : $q.O + esc(t27(lang, $q.aJ)) + '</p>';
const body = $q.am + head(lang, [[t27(lang, 'bc_h1'), pre(lang) + $q.aK]], esc(t27(lang, 'bc_h1')), esc(t27(lang, $q.aL)), reviewed(lang)) +
$t.k3 + esc(t27(lang, $q.aM)) + '</h2>' + pub + $q.aN + esc(t27(lang, $q.aO)) + $q.aP + t27(lang, $q.aQ).map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>' +
$q.aR + esc(t27(lang, $q.aS)) + '</h2>' + ul(t27(lang, $q.aT)) + $q.aU + esc(t27(lang, $q.aV)) + $q.aj + esc(t27(lang, $q.aW)) + $t.k4 + esc(t27(lang, $q.aX)) + $q.K +
links(lang, [[$q.aY, 'l_rep'], [pre(lang) + $q.as, 'l_mod'], [pre(lang) + $q.an, $q.aZ]]) + $q.ay;
const title = t27(lang, $q.ba), desc = t27(lang, $q.bb), url = ORIGIN + pre(lang) + $q.aK;
return { path: $q.aK, title, desc, body, ld: [{ '@type': $q.aB, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: REVIEWED }, crumbLd(lang, [[t27(lang, 'bc_h1'), pre(lang) + $q.aK]])] };
}
function citePage(lang, ix) {
const d = ix ? ix.updated : REVIEWED, place = ix && ix.places.get('bali') ? ix.places.get('bali').P.n : 'Bali';
const pageU = ORIGIN + pre(lang) + $q.bc, csvU = ORIGIN + $q.bd;
const code = s => $q.be + esc(s) + $q.bf;
const bib = $q.bg + d.replace(/-/g, '') + $t.k5 + d.slice(0, 4) + $q.bh + ORIGIN + $t.k6 + d + $q.bi;
const F = [[$q.bj, $q.bk], [$q.bd, $q.bl], [$q.bm, $q.bn], [$q.aI, $q.bo], [$q.bp, $q.bq], [pre(lang) + $q.br, $q.bs]];
const body = $q.am + head(lang, [[t27(lang, 'ci_h1'), pre(lang) + $q.aw]], esc(t27(lang, 'ci_h1')), esc(t27(lang, $q.bt)), reviewed(lang)) +
$q.bu + esc(t27(lang, $q.bv)) + '</h2>' + code(tx(lang, $q.bw, { d: fdt(d, lang) })) +
$q.bx + esc(t27(lang, $q.by)) + '</h2>' + code(tx(lang, $q.bz, { t: t27(lang, $q.bA), u: pageU, d: fdt(d, lang) })) +
$q.bB + esc(t27(lang, $q.bC)) + '</h2>' + code(tx(lang, $q.bD, { p: place, u: csvU, d: fdt(d, lang) })) + '<h3>' + esc(t27(lang, $q.bE)) + $q.bF + esc(bib) + $q.bG +
$q.bH + esc(t27(lang, $q.bI)) + '</h2>' + ul(t27(lang, $q.bJ)) +
$q.bK + esc(t27(lang, $q.bL)) + $q.bM + F.map(([h, k]) => $q.l + h + '">' + esc(t27(lang, k)) + $q.bN + esc(h) + $q.D).join('') + '</ul>' +
'<p>' + te(lang, $q.bO, { mail: mail(MAIL.press) }) + '</p>' + links(lang, [[$q.bP, $q.bQ], [pre(lang) + $q.an, $q.aZ], [pre(lang) + $q.au, $q.av]]) + $q.ay;
const title = t27(lang, $q.bR), desc = t27(lang, $q.bS), url = ORIGIN + pre(lang) + $q.aw;
return { path: $q.aw, title, desc, body, ld: [{ '@type': $q.aB, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: REVIEWED, license: $t.k7 }, crumbLd(lang, [[t27(lang, 'ci_h1'), pre(lang) + $q.aw]])] };
}
function contactPage(lang) {
const where = [mail(MAIL.hello), mail(MAIL.founder), mail(MAIL.press), mail(MAIL.hello, t27(lang, $q.ad)), $q.bT + esc(t27(lang, $q.bU)) + '</a>', $q.bV + esc(t27(lang, $q.bW)) + '</a>', mail(MAIL.hello) + $t.k8];
const th = t27(lang, 'ct_th'), rows = t27(lang, $q.bX);
const body = $q.am + head(lang, [[t27(lang, 'ct_h1'), pre(lang) + $q.au]], esc(t27(lang, 'ct_h1')), esc(t27(lang, $q.bY)), reviewed(lang)) +
$t.k9 + th.map(h => $q.bZ + esc(h) + '</th>').join('') + $q.ca + rows.map(([w, tt], i) => $q.cb + esc(w) + $q.cc + where[i] + $q.cc + esc(tt) + $q.cd).join('') + $q.ce +
'<p>' + esc(t27(lang, $q.cf)) + '</p>' + links(lang, [[pre(lang) + $q.an, $q.aZ], [pre(lang) + $q.as, 'l_mod'], [pre(lang) + $q.aw, $q.ax], [$q.bP, $q.bQ]]) + $q.ay;
const title = t27(lang, $q.cg), desc = t27(lang, $q.ch), url = ORIGIN + pre(lang) + $q.au;
return { path: $q.au, title, desc, body, ld: [{ '@type': $q.ci, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: REVIEWED, about: { '@type': $q.aC, name: $q.aD, url: ORIGIN + '/', email: MAIL.hello, contactPoint: [{ '@type': $q.cj, contactType: $q.ck, email: MAIL.hello }, { '@type': $q.cj, contactType: 'press', email: MAIL.press }] } }, crumbLd(lang, [[t27(lang, 'ct_h1'), pre(lang) + $q.au]])] };
}
function badgePage(lang, ix) {
const L = eligible(ix), th = t27(lang, 'bd_th');
const codeOf = r => $q.s + ORIGIN + $q.t + r.s + $q.cl + ORIGIN + $q.cm + r.s + $q.cn + t27('en', $q.co) + ': ' + r.n.replace(/["<>&]/g, '') + $q.cp;
const table = L.length ? $t.k10 + th.map(h => $q.bZ + esc(h) + '</th>').join('') + $q.ca + L.map(r => $q.cq + pre(lang) + $q.t + r.s + '/">' + bdi(r.n) + $q.cr + (r.dv ? bdi(r.dv) : '') + $q.cc + nf(lang, r.score) + $t.k11 + r.s + $q.cs + r.s + $q.ct).join('') + $q.ce : $q.O + esc(t27(lang, $q.cu)) + '</p>';
const ex = L[0] ? $q.Q + pre(lang) + $q.t + L[0].s + $q.cv + L[0].s + $q.cn + esc(t27(lang, $q.co)) + $q.cw + esc(t27(lang, $q.cx)) + $t.k12 + esc(codeOf(L[0])) + $q.bf : '';
const body = $q.am + head(lang, [[t27(lang, 'bd_h1'), pre(lang) + $q.cy]], esc(t27(lang, 'bd_h1')), esc(t27(lang, $q.cz)), $q.n + fill(esc(t27(lang, 'upd')), { d: tm(ix.updated, lang) }) + '</p>') +
$q.ap + ex + $q.aR + esc(t27(lang, $q.cA)) + '</h2>' + ul(t27(lang, $q.cB)) + $q.cC + pre(lang) + $q.cD + esc(t27(lang, $q.cE)) + $q.K +
$q.cF + te(lang, $q.cG, { n: nf(lang, L.length) }) + '</h2>' + table + $q.cH + esc(t27(lang, $q.cI)) + $q.aj + esc(t27(lang, $q.cJ)) + $t.k13 + esc(t27(lang, $q.bU)) + $q.K +
links(lang, [[pre(lang) + $q.cK, $q.cE], [$q.at, 'l_ind'], [pre(lang) + $q.aw, $q.ax]]) + $q.ay;
const title = t27(lang, $q.cL), desc = t27(lang, $q.cM), url = ORIGIN + pre(lang) + $q.cy;
return { path: $q.cy, title, desc, body, ld: [{ '@type': $q.aB, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: ix.updated }, crumbLd(lang, [[t27(lang, 'bd_h1'), pre(lang) + $q.cy]])] };
}
function badgeSvg(score, date) {
const L = $q.cN, R = score == null ? $q.cO : score + $q.cP + date, lw = 150, rw = score == null ? 92 : 110, w = lw + rw;
const col = score == null ? $q.cQ : $q.cR;
return $t.k14 + w + $q.cS + w + $q.cT + esc(L + ': ' + R) + $q.cU + esc(L + ': ' + R) + $q.cV +
$q.cW + w + $t.k15 + lw + $q.cX + rw + $q.cY + col + $q.cZ + lw + $q.da + col + '"/>' +
$s.k0 +
$q.db + (lw + 10) + '" y="' + (score == null ? 27 : 21) + $q.dc + (score == null ? 12 : 15) + $q.dd + (score == null ? $q.cO : score + $q.de) + $q.df + (score == null ? '' : $q.db + (lw + 10) + $t.k16 + esc(date) + $q.df) + $q.dg;
}
const csvCell = v => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) || /^[=+\-@]/.test(s) ? '"' + (/^[=+\-@]/.test(s) ? "'" : '') + s.replace(/"/g, '""') + '"' : s; };
const COMP = ['legal', 'register', 'permit', 'permitreg', 'date', 'record', 'deposit', 'location', 'web', 'notices', 'price'];
function csv(ix, slug) {
const H = ['place', $q.dh, $q.di, 'rank', $q.dj, $q.dk, $q.dl, $q.dm, $q.dn, $q.do, $q.dp, $q.dq, ...COMP.map(k => k + $q.dr), 'page', $q.ds, $q.dt, $q.du];
const out = [H.join(',')];
for (const [s, pl] of ix.places) {
if (slug && s !== slug) continue;
for (const r of pl.L) {
const st = k => { const q = r.comp[k]; return q.st === 'yes' ? 'yes' : q.st === 'part' ? $q.dv : q.st === 'no' ? $q.dw : $q.dx; };
out.push([pl.P.n, pl.P.k === 'i' ? $q.dy : 'city', pl.P.cc, pl.ranked ? r['rk_' + s] : '', pl.ranked ? 'yes' : 'no', r.id, r.n, r.dv || '', r.score, r.got, r.avail, r.rv ? 'yes' : 'no', ...COMP.map(st), r.sumba ? '' : ORIGIN + $q.t + r.s + '/', ix.updated, ORIGIN + $q.cK, $t.k17].map(csvCell).join(','));
}
}
return out.join('\r\n') + '\r\n';
}
async function file(u, env, m) {
  let ix; try { ix = await trData(env); } catch (e) { return new Response($q.dz, { status: 503, headers: { 'cache-control': $q.dA } }); }
  if (m[1] !== undefined && m[1] !== null && /\.svg$/.test(u.pathname)) {
    const r = [...ix.rows.values()].find(x => x.s === m[1] && !x.sumba);
    const ok = r && r.score >= BADGE_MIN;
    return new Response(badgeSvg(ok ? r.score : null, ix.updated), { status: ok ? 200 : 404, headers: { 'content-type': $q.dB, 'cache-control': $q.dC, 'access-control-allow-origin': '*', 'x-content-type-options': $q.dD, 'content-security-policy': $q.dE } });
  }
  const slug = m[2] || null;
  if (slug && !ix.places.has(slug)) return new Response($q.dF, { status: 404, headers: { 'content-type': $q.dG } });
  return new Response('﻿' + csv(ix, slug), { headers: { 'content-type': $q.dH, 'content-disposition': $q.dI + (slug || 'all') + '-' + ix.updated + '.csv"', 'cache-control': $q.dJ, 'access-control-allow-origin': '*', 'x-content-type-options': $q.dD, link: $q.dK } });
}
function faqPage(F, lang) {
const S = F.S[lang] || F.S.en, f = (k, v) => fill(esc(S[k]), v), d = tm(F.updated, lang), pc = (k, n) => nf(lang, n ? Math.round(k / n * 100) : 0) + ' %';
const src = h => $q.n + esc(S.src) + $q.dL + h + '">' + esc(h.replace(/^\/(?:[a-z]{2}\/)?/, '/')) + $q.dM + f('asof', { d }) + '</p>';
const st = F.stats, c = F.claims, Q = [], qa = (q, a, h) => Q.push([q, a, h]);
const gv = { n: nf(lang, st.n), mk: nf(lang, st.mk), co: nf(lang, st.co), s: nf(lang, st.s), t: nf(lang, c.t), v: nf(lang, c.v), u: nf(lang, c.u), c: nf(lang, c.c) };
[['g1', $q.dN], ['g2', $q.dO], ['g3', $q.dP], ['g4', $q.dP], ['g5', $q.dN], ['g6', pre(lang) + $q.dQ], ['g7', pre(lang) + $q.an], ['g8', $q.p]].forEach(([k, h]) => qa(f(k + 'q'), f(k + 'a', gv), h));
const gen = Q.length;
for (const [m, n, kp, ep, ec, ms, mv] of F.mk) { const v = { m: '<bdi>' + esc(mkName(m, lang)) + $q.b, n: nf(lang, n) }, h = $q.dR;
qa(f('aq', v), f('aa', v), h); qa(f('bq', v), f('ba', Object.assign({ k: nf(lang, kp), p: pc(kp, n) }, v)), h); qa(f('cq', v), f('ca', Object.assign({ k: nf(lang, ep), p: pc(ep, n), v: nf(lang, ec) }, v)), h); qa(f('dq', v), f('da', Object.assign({ s: nf(lang, ms), v: nf(lang, mv) }, v)), h); }
const item = ([q, a, h]) => $q.dS + q + $q.dT + a + '</p>' + src(h) + $q.dU;
const url = ORIGIN + pre(lang) + '/faq/', strip = x => x.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
const body = $q.am + head(lang, [[S.h1, pre(lang) + '/faq/']], esc(S.h1), esc(S.lead), $q.n + f('asof', { d }) + '</p>') + $q.dV + esc(S.h_gen) + '</h2>' + Q.slice(0, gen).map(item).join('') +
$q.dW + esc(S.h_mk) + '</h2>' + Q.slice(gen).map(item).join('') + links(lang, [[pre(lang) + $q.an, $q.aZ], [pre(lang) + $q.aw, $q.ax], [pre(lang) + $q.au, $q.av]]) + $q.ay;
return { path: '/faq/', title: S.title, desc: S.desc, body, ttl: 3600, ld: [{ '@type': $q.dX, '@id': url + '#faq', url, name: S.title, inLanguage: lang, dateModified: F.updated, mainEntity: Q.map(([q, a]) => ({ '@type': $q.dY, name: strip(q), acceptedAnswer: { '@type': $q.dZ, text: strip(a) } })) }, crumbLd(lang, [[S.h1, pre(lang) + '/faq/']])] };
}
const BODY = new Map();
export async function handle(req, u, env, ctx, shell) {
try { await loadS31(env); } catch (e) {}
const f = FILE_RX.exec(u.pathname); if (f) return file(u, env, f);
const m = PAGE_RX.exec(u.pathname); if (!m || !shell) return null;
if (!m[3]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': $q.ea } });
const lang = m[1] || 'en', kind = m[2];
let pg;
try {
if (kind === $q.eb) {
const [C, NM] = await Promise.all([load(env, $q.ec), load(env, $q.ed).catch(() => null)]), id = String(u.searchParams.get('id') || '').toUpperCase();
const okId = /^[A-Z]{2,5}-\d{3,4}$/.test(id) ? id : '', pp = String(u.searchParams.get('page') || ''), okPg = /^\/[a-z0-9][a-z0-9\/._-]{0,160}$/i.test(pp) && !pp.includes('..') ? pp : '';
const k = lang + '|c|' + okId + '|' + okPg + '|' + (C.updated || '') + '|' + (C.entries || []).length; pg = BODY.get(k); if (!pg) { const SL = {}; if (NM) for (const x of NM.projects || []) if ((C.entries || []).some(e => e.id === x.id)) SL[x.id] = { s: x.s, n: String(x.n || x.id).replace(/\s*\([^)]*\)\s*$/, '') }; pg = corrPage(C, lang, okId, SL, okPg); if (BODY.size > 600) BODY.clear(); BODY.set(k, pg); }
} else if (kind === 'faq') {
const F = await load(env, $q.ee), k = lang + '|faq|' + F.updated; pg = BODY.get(k); if (!pg) { pg = faqPage(F, lang); BODY.set(k, pg); }
} else if (kind === $q.ef || kind === 'cite') {
let ix = null; try { ix = await trData(env); } catch (e) { if (kind === $q.ef) return null; }
const k = lang + '|' + kind + '|' + (ix ? ix.v : ''); pg = BODY.get(k); if (!pg) { pg = kind === 'cite' ? citePage(lang, ix) : badgePage(lang, ix); if (BODY.size > 600) BODY.clear(); BODY.set(k, pg); }
} else { const k = lang + '|' + kind; pg = BODY.get(k); if (!pg) { pg = kind === $q.eg ? contactPage(lang) : casesPage(lang); BODY.set(k, pg); } }
} catch (e) { return null; }
return trustRender(lang, Object.assign({}, pg, { ld: pg.ld, body: pg.body.replace($q.am, $s.CSS27 + $q.am) }), shell);
}
