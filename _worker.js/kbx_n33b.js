// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_n33b__q, $s = TB.kbx_n33b__s, $t = TB.kbx_n33b__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { trData } from './kbx_tr.js';
import { jget } from './kbx_jget.js';
import { trustRender, head, crumbLd } from './kbx_trust.js';
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const FIRST = '2026-11';
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:reports\/transparency(?:\/20\d\d-[01]\d)?|transparency-badge\/developers)\/?$|^\/reports\/transparency(?:\/20\d\d-[01]\d)?\.csv$|^\/embed\/transparency\/developer\/[a-z0-9-]{1,90}\.svg$/;
export const CITE_RX = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:press\/monthly|press\/data|press\/places(?:\/[a-z0-9-]{2,40})?|research(?:\/[a-z0-9-]{1,80})?|index\/(?:delays|prices)|transparency-index|rankings(?:\/[a-z0-9-]{1,60}){0,2}|handover(?:\/[a-z0-9-]{1,60}){0,2}|numbers|data|reports)\/$/;
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.a, "'": '&#39;' }[c]));
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, a) => v && v[a] != null ? v[a] : m);
const nf = (lang, n, d) => Number(n).toLocaleString(LOC[lang] || 'en-GB', d != null ? { minimumFractionDigits: d, maximumFractionDigits: d } : undefined);
const dt = (iso, lang) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); if (!m) return esc(iso || ''); try { return new Intl.DateTimeFormat(LOC[lang], { day: $q.b, month: 'long', year: $q.b, timeZone: 'UTC' }).format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))); } catch (e) { return iso.slice(0, 10); } };
const mon = (ym, lang) => { const m = /^(\d{4})-(\d{2})$/.exec(ym || ''); if (!m) return ym; try { return new Intl.DateTimeFormat(LOC[lang], { month: 'long', year: $q.b, timeZone: 'UTC' }).format(new Date(Date.UTC(+m[1], +m[2] - 1, 15))); } catch (e) { return ym; } };
let T = null;
async function loadT(env) {
if (T) return T;
try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.c)); if (r.ok) T = await r.json(); } catch (e) {}
if (!T) { try { const r = await fetch(ORIGIN + $q.d, { cf: { cacheTtl: 300 } }); if (r.ok) T = await r.json(); } catch (e) {} }
return T;
}
const t = (lang, k, v) => { const L = (T && T[lang]) || {}, E = (T && T.en) || {}; const s = L[k] != null ? L[k] : E[k] != null ? E[k] : k; return v && typeof s === $q.e ? fill(s, v) : s; };
const SHARED = (globalThis.__kbJson = globalThis.__kbJson || {});
async function json(env, name, ttl) {   // name relative to /data/; same shared parse cache as kbx_t27.js / kbx_tr.js
  const m = SHARED[name]; if (m && Date.now() - m.t < (m.a ? 3600000 : ttl || 600000)) return m.v;
  try { return (await jget(env, name, ORIGIN + $q.f + name, ORIGIN + $q.g + name)).v; } catch (e) { SHARED[name] = { t: Date.now(), v: null, a: false }; return null; }
}
function months(now) {
const L = []; let [y, m] = FIRST.split('-').map(Number); const ey = now.getUTCFullYear(), em = now.getUTCMonth() + 1;
while (y < ey || (y === ey && m <= em)) { L.push(y + '-' + String(m).padStart(2, '0')); m++; if (m > 12) { m = 1; y++; } }
return L;
}
async function editions(env) {
const L = months(new Date()), got = await Promise.all(L.map(ym => json(env, $q.h + ym + '.json', 3600000)));
return L.map((ym, i) => got[i] && got[i].markets ? got[i] : null).filter(Boolean);
}
function withChange(E, ed) {
const i = E.indexOf(ed), prev = i > 0 ? E[i - 1] : null, P = new Map(((prev && prev.markets) || []).map(r => [r.market, r]));
return { prev, rows: ed.markets.map(r => Object.assign({}, r, { chg: prev ? (P.has(r.market) ? r.transparency_index - P.get(r.market).transparency_index : null) : undefined })) };
}
const med = a => { const s = a.slice().sort((x, y) => x - y), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null; };
const BASE = '/reports/transparency/';
function reportPage(lang, E, ed, isLatest) {
const { prev, rows } = withChange(E, ed), th = t(lang, 'r_th'), M = mon(ed.edition, lang);
const path = isLatest ? BASE : BASE + ed.edition + '/', fileBase = isLatest ? $q.i : $q.j + ed.edition;
const chg = r => r.chg === undefined ? '' : r.chg === null ? esc(t(lang, 'r_new')) : r.chg > 0 ? $q.k + nf(lang, r.chg) + $q.l : r.chg < 0 ? $q.m + nf(lang, r.chg) + $q.l : '0';
const cols = prev ? th : th.filter((x, i) => i !== 5);
const tr = r => { const c = [nf(lang, r.rank), esc(r.market) + (r.projects < 10 ? ' *' : ''), esc(r.country || ''), nf(lang, r.projects), '<b>' + nf(lang, r.transparency_index) + '</b>', chg(r), nf(lang, r.avg_checks, 2), nf(lang, r.permit_public_pct) + '%', nf(lang, r.deposit_protection_pct) + '%'];
if (!prev) c.splice(5, 1);
return '<tr>' + c.map((v, i) => '<td' + (i === 1 ? '' : $q.n) + $q.o + esc(cols[i]) + '">' + (i === 1 ? '<bdi>' + v + $q.p : v) + '</td>').join('') + '</tr>'; };
const tot = rows.reduce((s, r) => s + r.projects, 0), top = rows[0];
const keys = $q.q + nf(lang, rows.length) + '</b>' + esc(t(lang, $q.r)) + $q.s + nf(lang, tot) + '</b>' + esc(t(lang, $q.t)) + $q.s + nf(lang, med(rows.map(r => r.transparency_index))) + '</b>' + esc(t(lang, $q.u)) + $q.v + (top ? $q.w + nf(lang, top.transparency_index) + '</b>' + esc(t(lang, $q.x)) + $q.y + esc(top.market) + $q.z : '') + $q.v;
const arch = $q.A + E.slice().reverse().map((e, i) => $q.B + pre(lang) + BASE + e.edition + '/">' + esc(mon(e.edition, lang)) + '</a>' + (i === 0 ? ' (' + esc(t(lang, $q.C)) + ')' : '') + $q.D + e.edition + $t.k0 + e.edition + $q.E).join('') + '</ul>';
const url = ORIGIN + pre(lang) + path, title = t(lang, $q.F, { m: M }), h1 = t(lang, 'r_h1', { m: M });
const bib = $q.G + ed.edition.replace('-', '') + $t.k1 + mon(ed.edition, 'en') + $q.H + ed.edition.slice(0, 4) + $q.I + ORIGIN + BASE + ed.edition + $q.J + ed.data_as_of + $q.K;
const body = $q.L + head(lang, [[t(lang, $q.M), pre(lang) + $q.N], [t(lang, 'r_cr'), pre(lang) + BASE]], esc(h1), esc(t(lang, $q.O)),
$q.P + esc(t(lang, $q.Q, { m: M, d: dt(ed.data_as_of, lang), f: dt(ed.frozen || ed.data_as_of, lang) })) + '</p>') +
$q.R + keys +
$q.S + cols.map(h => $q.T + esc(h) + '</th>').join('') + $q.U + rows.map(tr).join('') + $q.V +
$q.P + esc(prev ? t(lang, 'r_chg', { p: mon(prev.edition, lang) }) : t(lang, $q.W)) + ' ' + esc(t(lang, $q.X)) + '</p>' +
$q.Y + esc(t(lang, $q.Z)) + $q.aa + esc(t(lang, $q.ab)) + $q.ac + esc(t(lang, $q.ad)) + '</p>' +
'<p>' + esc(t(lang, $q.ae)) + $q.af + esc(t(lang, $q.ag)) + $q.ah + pre(lang) + $t.k2 +
$q.ai + esc(t(lang, $q.aj)) + $q.ak + fileBase + $q.al + esc(fileBase) + $t.k3 + ed.edition + $t.k4 + ed.edition + $q.am + esc(String((ed.source || {}).sha256 || '').slice(0, 16)) + $q.an +
$q.ao + esc(t(lang, 'c_h')) + $q.aa + esc(t(lang, 'c_lic')) + $t.k5 + esc(mon(ed.edition, 'en')) + $q.ap + ORIGIN + BASE + ed.edition + '/">' + ORIGIN + BASE + ed.edition + $q.aq + esc(ed.data_as_of) + $q.ar +
$t.k6 + esc(bib) + $q.as + pre(lang) + $q.at + esc(t(lang, $q.au)) + $q.av +
$q.aw + esc(t(lang, $q.ax)) + '</h2>' + arch + $q.ay;
const ld = [{ '@type': $q.az, '@id': ORIGIN + BASE + ed.edition + $q.aA, name: $t.k7 + mon(ed.edition, 'en'), description: t('en', $q.aB, { n: rows.length }), url: ORIGIN + BASE + ed.edition + '/',
inLanguage: 'en', license: $t.k8, creator: { '@type': $q.aC, '@id': ORIGIN + '/#org', name: $q.aD, url: ORIGIN + '/' }, temporalCoverage: ed.edition, dateModified: ed.data_as_of, version: ed.edition,
isBasedOn: ORIGIN + $q.aE, distribution: [{ '@type': $q.aF, encodingFormat: $q.aG, contentUrl: ORIGIN + $q.j + ed.edition + '.csv' }, { '@type': $q.aF, encodingFormat: $q.aH, contentUrl: ORIGIN + $q.aI + ed.edition + '.json' }] },
{ '@type': $q.aJ, '@id': url + '#page', url, name: title, inLanguage: lang, dateModified: ed.data_as_of }, crumbLd(lang, [[t(lang, $q.M), pre(lang) + $q.N], [t(lang, 'r_cr'), pre(lang) + BASE]])];
return { path, title, desc: t(lang, $q.aB, { n: rows.length }), body, ld, ttl: 900 };
}
const csvCell = v => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) || /^[=+\-@]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s) ? '"' + (/^[=+@]/.test(s) ? "'" : '') + s.replace(/"/g, '""') + '"' : s; };
function csv(E, ed) {
const { rows } = withChange(E, ed), H = [$q.aK, 'rank', $q.aL, $q.aM, $q.aN, $q.aO, $q.aP, $q.aQ, $q.aR, $q.aS, $q.aT, $q.aU, $q.aV, $q.aW, 'page', $q.aX];
return [H.join(',')].concat(rows.map(r => [ed.edition, r.rank, r.market, r.country, r.projects, r.transparency_index, r.chg == null ? '' : r.chg, r.avg_checks, r.avg_confirmed, r.permit_public_pct, r.deposit_protection_pct, r.all_six_public, r.with_flags, ed.data_as_of, ORIGIN + BASE + ed.edition + '/', $t.k9].map(csvCell).join(','))).join('\r\n') + '\r\n';
}
let DEV = null;
async function devData(env) {
const [ix, cs] = await Promise.all([trData(env), json(env, $q.aY)]);
if (DEV && DEV.ix === ix && DEV.cs === cs) return DEV;
const C = new Map(((cs && cs.cases) || []).map(c => [c.id, c])), by = new Map();
for (const r of ix.rows.values()) { if (!r.dvs) continue; const d = by.get(r.dvs) || { s: r.dvs, n: r.dv || r.dvs, P: [], sumba: false }; d.P.push(r); if (r.sumba) d.sumba = true; by.set(r.dvs, d); }
const ok = d => !d.sumba && d.P.length > 0 && d.P.every(r => { const c = C.get(r.id); return c && c.read !== false && (c.max || 6) === 6 && c.score === 6; });
const L = [...by.values()].filter(ok).sort((a, b) => b.P.length - a.P.length || a.n.localeCompare(b.n));
DEV = { ix, cs, L, set: new Map(L.map(d => [d.s, d])), updated: ix.updated };
return DEV;
}
function devSvg(n, date) {
const L = $q.aZ, R = n == null ? $q.ba : $q.bb + n + (n === 1 ? $q.bc : $q.bd), lw = 150, rw = n == null ? 92 : 132, w = lw + rw, col = n == null ? $q.be : $q.bf;
return $t.k10 + w + $q.bg + w + $q.bh + esc(L + ': ' + R) + $q.bi + esc(L + ': ' + R + (n == null ? '' : $q.bj + date)) + $q.bk +
$q.bl + w + $t.k11 + lw + $q.bm + rw + $q.bn + col + $q.bo + lw + $q.bp + col + '"/>' +
$s.k0 +
$q.bq + (lw + 10) + '" y="' + (n == null ? 27 : 21) + $q.br + (n == null ? 12 : 14) + $q.bs + (n == null ? $q.ba : esc(R)) + $q.bt + (n == null ? '' : $q.bq + (lw + 10) + $t.k12 + esc(date) + $q.bt) + $q.bu;
}
const codeOf = d => $q.bv + ORIGIN + $q.bw + d.s + $q.bx + ORIGIN + $q.by + d.s + $q.bz + String(d.n).replace(/["<>&]/g, '') + $q.bA;
function devPage(lang, D) {
const P = $q.bB, L = D.L, th = t(lang, 'b_th');
const table = L.length ? $q.S + th.map(h => $q.T + esc(h) + '</th>').join('') + $q.U +
L.map(d => $q.bC + esc(th[0]) + $q.bD + pre(lang) + $q.bw + d.s + $q.bE + esc(d.n) + $q.bF + esc(th[1]) + '">' + nf(lang, d.P.length) + $q.bG + esc(th[2]) + $t.k13 + d.s + $q.bH + d.s + $q.bI).join('') + $q.V : '<p>' + esc(t(lang, $q.bJ)) + '</p>';
const ex = L[0] ? $q.bK + pre(lang) + $q.bw + L[0].s + $t.k14 + L[0].s + $q.bL + esc($q.bM + L[0].n) + $q.bN + esc(t(lang, $q.bO)) + $t.k15 + esc(codeOf(L[0])) + $q.bP : '';
const body = $q.L + head(lang, [[t(lang, 'b_cr'), $q.bw], [t(lang, $q.bQ), pre(lang) + P]], esc(t(lang, $q.bQ)), esc(t(lang, $q.bR)), $q.P + esc(t(lang, 'upd', { d: dt(D.updated, lang) })) + '</p>') +
$q.R + ex + $q.bS + esc(t(lang, $q.bT)) + $q.bU + t(lang, $q.bV).map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
$q.bW + esc(t(lang, $q.bX, { n: nf(lang, L.length) })) + '</h2>' + table +
$q.bY + esc(t(lang, $q.bZ)) + $q.aa + esc(t(lang, $q.ca)) + $t.k16 + esc(t(lang, $q.cb)) + $q.av +
$q.cc + pre(lang) + $q.cd + esc(t(lang, $q.ce)) + $q.cf + pre(lang) + $t.k17;
const title = t(lang, $q.bQ), url = ORIGIN + pre(lang) + P;
return { path: P, title, desc: t(lang, $q.cg), body, ld: [{ '@type': $q.aJ, '@id': url + '#page', url, name: title, description: t(lang, $q.cg), inLanguage: lang, dateModified: D.updated }, crumbLd(lang, [[t(lang, $q.bQ), pre(lang) + P]])], ttl: 900 };
}
const BODY = new Map();
export async function handle(req, u, env, ctx, shell) {
const p = u.pathname;
let m = /^\/embed\/transparency\/developer\/([a-z0-9-]{1,90})\.svg$/.exec(p);
if (m) { let D; try { D = await devData(env); } catch (e) { return new Response($q.ch, { status: 503, headers: { 'cache-control': $q.ci } }); }
const d = D.set.get(m[1]); return new Response(devSvg(d ? d.P.length : null, D.updated), { status: d ? 200 : 404, headers: $t.o_SVGH }); }
m = /^\/reports\/transparency(?:\/(20\d\d-[01]\d))?\.csv$/.exec(p);
if (m) { const E = await editions(env), ed = m[1] ? E.find(e => e.edition === m[1]) : E[E.length - 1];
if (!ed) return new Response($q.cj, { status: 404, headers: { 'content-type': $q.ck } });
return new Response('﻿' + csv(E, ed), { headers: { 'content-type': $q.cl, 'content-disposition': $t.k18 + ed.edition + '.csv"', 'cache-control': $q.cm, 'access-control-allow-origin': '*', 'x-content-type-options': $q.cn, link: $t.k19 } }); }
m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(reports\/transparency(?:\/(20\d\d-[01]\d))?|transparency-badge\/developers)(\/?)$/.exec(p);
if (!m || !shell) return null;
if (!m[4]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search, 'cache-control': $q.co } });
const lang = m[1] || 'en';
await loadT(env); if (!T) return null;
let pg;
try {
if (m[2].startsWith($q.cp)) {
const D = await devData(env), k = lang + '|b|' + D.updated + '|' + D.L.length; pg = BODY.get(k); if (!pg) { pg = devPage(lang, D); BODY.set(k, pg); }
} else {
const E = await editions(env); if (!E.length) return null;
const last = E[E.length - 1], ed = m[3] ? E.find(e => e.edition === m[3]) : last; if (!ed) return null;
if (m[3] && ed === last) { pg = reportPage(lang, E, ed, true); pg = Object.assign({}, pg, { path: BASE }); }
else { const k = lang + '|r|' + ed.edition + '|' + E.length + '|' + !m[3]; pg = BODY.get(k); if (!pg) { pg = reportPage(lang, E, ed, !m[3]); BODY.set(k, pg); } }
}
} catch (e) { return null; }
if (BODY.size >= 40) BODY.delete(BODY.keys().next().value);
return trustRender(lang, Object.assign({}, pg, { body: pg.body.replace($q.L, $s.CSS + $q.L) }), shell);
}
const apa40 = (lang, ti, url, d) => { let ds = d; try { ds = d.slice(0, 4) + ', ' + new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : LOC[lang] || 'en-GB', { month: 'long', day: $q.b, timeZone: 'UTC' }).format(new Date(d + $q.cq)); } catch (e) {} return $q.cr + ds + '). ' + ti + '. ' + url; };
const cb40 = (lang, plain, apa, nc) => { const bs = $s.k1;
return $t.k20 + (plain ? $q.cs + bs + $q.ct + esc(plain) + $q.cu + esc(t(lang, 'c_ok')) + '">' + esc(t(lang, 'c_cp')) + $q.cv : '') +
$q.cs + bs + $q.ct + esc(apa) + $q.cu + esc(t(lang, 'c_ok')) + '">' + esc(t(lang, 'c_apa')) + $t.k21 + esc(nc) + '">' + $s.CB40JS + $q.cw; };
export async function cite(req, r, env, u) {
  const m = /^\/(es|de|fr|nl|ru|zh|ar)\//.exec(u.pathname), lang = m ? m[1] : 'en';
  await loadT(env); if (!T) return r;
  let h1 = '', inH1 = false, seenH1 = false, has = false;
  const url = ORIGIN + u.pathname, today = new Date().toISOString().slice(0, 10);
  const kc = { on: false, tx: '' };
  const nc = ((((r.headers.get($q.cx) || '').match(/'nonce-([A-Za-z0-9+/=]+)'/)) || [])[1]) || '';
  return new HTMLRewriter()
    .on($q.cy, { element() { has = true; } })
    .on($q.cz, { element(e) { kc.on = true; e.onEndTag(end => { kc.on = false; const pl = kc.tx.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim(); end.after(cb40(lang, pl, apa40(lang, h1.replace(/\s+/g, ' ').trim() || $q.aD, url, today), nc), { html: true }); }); }, text(x) { if (kc.on) kc.tx += x.text; } })   // n40 k6: copy buttons on /press/places/<place>/
    .on($q.cA, { element(e) { e.append(cb40(lang, null, apa40(lang, h1.replace(/\s+/g, ' ').trim() || $q.cB, url, today), nc), { html: true }); } })   // n40 k6: APA copy on /press/data/
    .on($q.cC, { element(e) { if (seenH1) return; seenH1 = true; inH1 = true; e.onEndTag(() => { inH1 = false; }); }, text(x) { if (inH1) h1 += x.text; } })
    .on('main', { element(e) {
      e.onEndTag(end => {
        if (has) return;
        const ti = h1.replace(/\s+/g, ' ').trim().slice(0, 160) || $q.aD;
        const bib = $q.cD + u.pathname.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 50) + '_' + today.replace(/-/g, '') + $q.cE + ti.replace(/[{}\\]/g, '') + $q.H + today.slice(0, 4) + $q.I + url + $q.cF + today + $q.K;
        end.before($q.cG + esc(t(lang, 'c_h')) + $q.aa + esc(t(lang, 'c_lic')) + '</p>' +
          $q.cH + esc(ti) + $q.ap + esc(url) + '">' + esc(url) + $q.cI + esc(t(lang, $q.cJ, { d: today })) + $q.cK +
          cb40(lang, $q.cL + ti + '", ' + url + ', ' + t(lang, $q.cJ, { d: today }) + $q.cM, apa40(lang, ti, url, today), nc) +
          $q.cN + esc(bib) + $q.cO +
          $q.bK + pre(lang) + $q.cP + esc(t(lang, $q.au)) + $q.cQ, { html: true });
      });
    } })
    .transform(r);
}
