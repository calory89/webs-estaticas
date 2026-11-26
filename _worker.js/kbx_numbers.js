// comments: _notes/kolaboro-worker-comments.txt
import { t31, loadS } from './kbx_n31b_page.js';
import * as N from './kbx_named.js';
import { TB } from './kbx_strings.js';
export const PAGE = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?numbers\/?$/;
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const pre = l => l === 'en' ? '' : '/' + l;
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = (n, l, d) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { maximumFractionDigits: d || 0 }).format(n); } catch (e) { return String(n); } };
const fd = (d, l) => { try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(String(d).slice(0, 10) + 'T12:00:00Z')); } catch (e) { return d; } };
const T = TB.kbx_numbers_T ;
let MEMO = null;
async function figures(env, inner) {
if (MEMO && Date.now() - MEMO.t < 600000) return MEMO.v;
const get = async p => { try { const r = await inner(p); return r && r.ok ? await r.json() : null; } catch (e) { return null; } };
const [st, ix, tr, seo] = await Promise.all([get('/api/open/stats'), N.data(env).catch(() => null), import('./kbx_tr.js').then(m => m.trData(env)).catch(() => null), import('./kbx_seo.js').then(m => m.sitemapStats(env, inner)).catch(() => null)]);
const today = new Date().toISOString().slice(0, 10), up = (st && st.updated) || today, F = [];
const add = (g, id, v, src, at, dec) => { if (v != null && isFinite(v)) F.push({ g, id, v: +v, src, at: String(at || today).slice(0, 10), dec: dec || 0 }); };
if (st) {
add('db', 'projects', st.projects, '/api/open/stats', up); add('db', 'markets', st.markets, '/api/open/stats', up); add('db', 'countries', st.countries, '/api/open/stats', up);
add('db', 'sources', st.sources, '/api/open/stats', up); add('db', 'claims', st.claims_total, '/api/open/stats', up);
if (st.claims) { add('db', 'verified', st.claims.verified, '/api/open/stats', up); add('db', 'contradicted', st.claims.contradicted, '/api/open/stats', up); }
add('db', 'six', st.all_six_public, '/api/open/stats', up); add('db', 'overdue', st.overdue, '/data/on-time.json', up); add('db', 'overdue_m', st.overdue_avg_months, '/data/on-time.json', up, 1);
add('db', 'changes', st.changes_detected, '/changes/feed.atom', up);
}
if (ix) { const d = (ix.updated || up); add('pages', 'named', ix.P.length, '/projects/', d); add('pages', 'devs', ix.devs.size, '/developers/', d); add('pages', 'langs', LANGS.length, '/projects/', d); add('pages', 'answers', ix.P.length, '/llms.txt', d); }
if (tr) add('pages', 'places', [...tr.places.values()].filter(p => p.ranked).length, '/rankings/transparency/', tr.updated);
const au = await get('/data/seo-audit.json'), aun = au && au.summary && au.summary.in_sitemaps;
if (aun) add('pages', 'urls', aun, '/engineering/seo/', au.generated_at); else if (seo) add('pages', 'urls', Object.values(seo).reduce((a, b) => a + b, 0), '/sitemap_index.xml', today);
const rev = ix ? { n: ix.P.length, a: ix.P.filter(x => x.rw).length, b: ix.P.filter(x => x.rvw && x.rvw.ok).length, d: ix.updated || up } : null;
const v = { F, up, today, rev }; MEMO = { t: Date.now(), v }; return v;
}
export async function handle(req, u, env, ctx, shell, inner) {
const m = PAGE.exec(u.pathname); if (!m) return null;
if (!u.pathname.endsWith('/')) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search } });
const lang = m[1] || 'en', L = T[lang], path = pre(lang) + '/numbers/', canon = ORIGIN + path;
const ck = shell !== 'test' && typeof caches !== 'undefined' && !u.search ? new Request(ORIGIN + '/__numbers/v4/' + lang) : null;
if (ck) { try { const hit = await caches.default.match(ck); if (hit) { const age = Date.now() - (+hit.headers.get('x-built') || 0);
if (age > 900e3 && ctx && ctx.waitUntil) ctx.waitUntil(build().catch(() => {}));
return new Response(hit.body, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600', 'content-language': lang, 'x-numbers-cache': age > 900e3 ? 'stale' : 'hit' } }); } } catch (e) {} }
if (shell === 'test') return build();
const html = await build();
return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600', 'content-language': lang } });
async function build() {
const { F, up, today, rev } = await figures(env, inner);
try { await loadS(env); } catch (e) {}
const b = s => lang === 'ar' ? '<bdi>' + s + '</bdi>' : s;
const row = f => '<tr><th scope="row">' + esc(L[f.id]) + '</th><td class="knum-v">' + b(nf(f.v, lang, f.dec)) + '</td><td><a href="' + f.src + '">' + b(esc(f.src)) + '</a></td><td>' + esc(fd(f.at, lang)) + '</td></tr>';
const tbl = g => { const R = F.filter(f => f.g === g); return R.length ? '<h2 id="' + g + '">' + esc(L['g_' + g]) + '</h2><div class="knum-w"><table class="knum"><thead><tr>' + L.th.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + R.map(row).join('') + '</tbody></table></div>' : ''; };
const body = '<section class="phero"' + (lang === 'ar' ? ' dir="rtl"' : '') + '><div class="wrap"><h1>' + esc(L.h1) + '</h1><p class="lead">' + esc(L.lead) + TB.kbx_numbers__t.k0 + (lang === 'ar' ? ' dir="rtl"' : '') + '>' +
TB.kbx_numbers__s.k0 +
tbl('db') + tbl('pages') + (rev && rev.n && t31(lang, 'nb_h') ? (pc => '<h2 id="reviewed">' + esc(t31(lang, 'nb_h')) + '</h2><p>' + esc(t31(lang, 'nb_t', { a: nf(rev.a, lang), n: nf(rev.n, lang), ap: nf(pc(rev.a), lang, 1), b: nf(rev.b, lang), bp: nf(pc(rev.b), lang, 1) })) + ' <a href="' + pre(lang) + '/editorial-policy/">' + esc(t31(lang, 'nb_l')) + TB.kbx_numbers__t.k1 + esc(fd(rev.d, lang)) + ')</p>')(v => Math.round(v / rev.n * 1000) / 10) : '') +
'<h2 id="cite">' + esc(L.cite_h) + '</h2><p>' + esc(L.cite).replace('{u}', b('<a href="' + path + '">' + canon + '</a>')).replace('{d}', esc(fd(up, lang))) + '</p>' +
'<h2 id="more">' + esc(L.more_h) + TB.kbx_numbers__t.k2 + esc(L.progress) + '</a></li><li><a href="/metrics/">' + esc(L.metrics) + TB.kbx_numbers__t.k3 + esc(L.api) + '</a></li><li><a href="' + pre(lang) + '/methods/transparency-score/">' + esc(L.method) + '</a></li></ul></div>';
const ld = { '@context': 'https://schema.org', '@graph': [
{ '@type': 'WebPage', '@id': canon + '#page', url: canon, name: L.h1, description: L.lead, inLanguage: lang, dateModified: up, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
{ '@type': 'Dataset', name: L.title, description: L.lead, url: canon, license: TB.kbx_numbers__t.k4, isAccessibleForFree: true, dateModified: up, creator: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, variableMeasured: F.map(f => ({ '@type': 'PropertyValue', name: L[f.id], value: f.v })) },
{ '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kolaboro', item: ORIGIN + pre(lang) + '/' }, { '@type': 'ListItem', position: 2, name: L.h1, item: canon }] }] };
const pg = { title: L.title + ' | Kolaboro', desc: L.lead, canon, body, ld, lastmod: up, alt: l => ORIGIN + pre(l) + '/numbers/' };
if (shell === 'test') return pg;
const html = await N.assemble(pg, lang, await shell(pre(lang) + '/how-we-score/'));
if (ck) { try { const put = caches.default.put(ck, new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'max-age=86400', 'x-built': String(Date.now()) } })); if (ctx && ctx.waitUntil) ctx.waitUntil(put.catch(() => {})); else await put; } catch (e) {} }
return html;
}
}
