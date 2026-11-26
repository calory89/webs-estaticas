// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_numbers__q, $s = TB.kbx_numbers__s, $t = TB.kbx_numbers__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { t31, loadS } from './kbx_n31b_page.js';
import * as N from './kbx_named.js';
import { TB } from './kbx_strings.js';
export const PAGE = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?numbers\/?$/;
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const pre = l => l === 'en' ? '' : '/' + l;
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.a, "'": '&#39;' }[c]));
const nf = (n, l, d) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { maximumFractionDigits: d || 0 }).format(n); } catch (e) { return String(n); } };
const fd = (d, l) => { try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { day: $q.b, month: 'long', year: $q.b, timeZone: 'UTC' }).format(new Date(String(d).slice(0, 10) + $q.c)); } catch (e) { return d; } };
const T = TB.kbx_numbers_T ;
let MEMO = null;
async function figures(env, inner) {
if (MEMO && Date.now() - MEMO.t < 600000) return MEMO.v;
const get = async p => { try { const r = await inner(p); return r && r.ok ? await r.json() : null; } catch (e) { return null; } };
const [st, ix, tr, seo] = await Promise.all([get($q.d), N.data(env).catch(() => null), import('./kbx_tr.js').then(m => m.trData(env)).catch(() => null), import('./kbx_seo.js').then(m => m.sitemapStats(env, inner)).catch(() => null)]);
const today = new Date().toISOString().slice(0, 10), up = (st && st.updated) || today, F = [];
const add = (g, id, v, src, at, dec) => { if (v != null && isFinite(v)) F.push({ g, id, v: +v, src, at: String(at || today).slice(0, 10), dec: dec || 0 }); };
if (st) {
add('db', $q.e, st.projects, $q.d, up); add('db', $q.f, st.markets, $q.d, up); add('db', $q.g, st.countries, $q.d, up);
add('db', $q.h, st.sources, $q.d, up); add('db', $q.i, st.claims_total, $q.d, up);
if (st.claims) { add('db', $q.j, st.claims.verified, $q.d, up); add('db', $q.k, st.claims.contradicted, $q.d, up); }
add('db', 'six', st.all_six_public, $q.d, up); add('db', $q.l, st.overdue, $q.m, up); add('db', $q.n, st.overdue_avg_months, $q.m, up, 1);
add('db', $q.o, st.changes_detected, $q.p, up);
}
if (ix) { const d = (ix.updated || up); add('pages', 'named', ix.P.length, $q.q, d); add('pages', 'devs', ix.devs.size, $q.r, d); add('pages', 'langs', LANGS.length, $q.q, d); add('pages', $q.s, ix.P.length, $q.t, d); }
if (tr) add('pages', $q.u, [...tr.places.values()].filter(p => p.ranked).length, $q.v, tr.updated);
const au = await get($q.w), aun = au && au.summary && au.summary.in_sitemaps;
if (aun) add('pages', 'urls', aun, $q.x, au.generated_at); else if (seo) add('pages', 'urls', Object.values(seo).reduce((a, b) => a + b, 0), $q.y, today);
const rev = ix ? { n: ix.P.length, a: ix.P.filter(x => x.rw).length, b: ix.P.filter(x => x.rvw && x.rvw.ok).length, d: ix.updated || up } : null;
const v = { F, up, today, rev }; MEMO = { t: Date.now(), v }; return v;
}
export async function handle(req, u, env, ctx, shell, inner) {
const m = PAGE.exec(u.pathname); if (!m) return null;
if (!u.pathname.endsWith('/')) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search } });
const lang = m[1] || 'en', L = T[lang], path = pre(lang) + $q.z, canon = ORIGIN + path;
const ck = shell !== 'test' && typeof caches !== $q.A && !u.search ? new Request(ORIGIN + $q.B + lang) : null;
if (ck) { try { const hit = await caches.default.match(ck); if (hit) { const age = Date.now() - (+hit.headers.get($q.C) || 0);
if (age > 900e3 && ctx && ctx.waitUntil) ctx.waitUntil(build().catch(() => {}));
return new Response(hit.body, { headers: { 'content-type': $q.D, 'cache-control': $q.E, 'content-language': lang, 'x-numbers-cache': age > 900e3 ? 'stale' : 'hit' } }); } } catch (e) {} }
if (shell === 'test') return build();
const html = await build();
return new Response(html, { headers: { 'content-type': $q.D, 'cache-control': $q.E, 'content-language': lang } });
async function build() {
const { F, up, today, rev } = await figures(env, inner);
try { await loadS(env); } catch (e) {}
const b = s => lang === 'ar' ? '<bdi>' + s + '</bdi>' : s;
const row = f => $q.F + esc(L[f.id]) + $q.G + b(nf(f.v, lang, f.dec)) + $q.H + f.src + '">' + b(esc(f.src)) + $q.I + esc(fd(f.at, lang)) + $q.J;
const tbl = g => { const R = F.filter(f => f.g === g); return R.length ? $q.K + g + '">' + esc(L['g_' + g]) + $q.L + L.th.map(h => $q.M + esc(h) + '</th>').join('') + $q.N + R.map(row).join('') + $q.O : ''; };
const body = $q.P + (lang === 'ar' ? $q.Q : '') + $q.R + esc(L.h1) + $q.S + esc(L.lead) + $t.k0 + (lang === 'ar' ? $q.Q : '') + '>' +
$s.k0 +
tbl('db') + tbl('pages') + (rev && rev.n && t31(lang, 'nb_h') ? (pc => $q.T + esc(t31(lang, 'nb_h')) + $q.U + esc(t31(lang, 'nb_t', { a: nf(rev.a, lang), n: nf(rev.n, lang), ap: nf(pc(rev.a), lang, 1), b: nf(rev.b, lang), bp: nf(pc(rev.b), lang, 1) })) + $q.V + pre(lang) + $q.W + esc(t31(lang, 'nb_l')) + $t.k1 + esc(fd(rev.d, lang)) + ')</p>')(v => Math.round(v / rev.n * 1000) / 10) : '') +
$q.X + esc(L.cite_h) + $q.U + esc(L.cite).replace('{u}', b($q.Y + path + '">' + canon + '</a>')).replace('{d}', esc(fd(up, lang))) + '</p>' +
$q.Z + esc(L.more_h) + $t.k2 + esc(L.progress) + $q.aa + esc(L.metrics) + $t.k3 + esc(L.api) + $q.ab + pre(lang) + $q.ac + esc(L.method) + $q.ad;
const ld = { '@context': $q.ae, '@graph': [
{ '@type': $q.af, '@id': canon + '#page', url: canon, name: L.h1, description: L.lead, inLanguage: lang, dateModified: up, isPartOf: { '@type': $q.ag, name: $q.ah, url: ORIGIN + '/' } },
{ '@type': $q.ai, name: L.title, description: L.lead, url: canon, license: $t.k4, isAccessibleForFree: true, dateModified: up, creator: { '@type': $q.aj, name: $q.ah, url: ORIGIN + '/' }, variableMeasured: F.map(f => ({ '@type': $q.ak, name: L[f.id], value: f.v })) },
{ '@type': $q.al, itemListElement: [{ '@type': $q.am, position: 1, name: $q.ah, item: ORIGIN + pre(lang) + '/' }, { '@type': $q.am, position: 2, name: L.h1, item: canon }] }] };
const pg = { title: L.title + $q.an, desc: L.lead, canon, body, ld, lastmod: up, alt: l => ORIGIN + pre(l) + $q.z };
if (shell === 'test') return pg;
const html = await N.assemble(pg, lang, await shell(pre(lang) + $q.ao));
if (ck) { try { const put = caches.default.put(ck, new Response(html, { headers: { 'content-type': $q.D, 'cache-control': $q.ap, 'x-built': String(Date.now()) } })); if (ctx && ctx.waitUntil) ctx.waitUntil(put.catch(() => {})); else await put; } catch (e) {} }
return html;
}
}
