// comments: _notes/kolaboro-worker-comments.txt
import { finRtHtml, loadT as n31cT } from './kbx_n31c.js';
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
export const PATHS = /^\/api\/x\/filings\/?$/;
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ltr = s => '<bdi dir="ltr">' + esc(s) + '</bdi>';
const fdt = (d, l) => { if (!d) return ''; try { return new Date(d + 'T00:00:00Z').toLocaleDateString(LOC[l] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return d; } };
let MEMO = null;
export async function filingsData(env) {
await n31cT(env).catch(() => {});
if (MEMO && Date.now() - MEMO.t < 600000) return MEMO.v;
let r = null; const path = '/data/listed-developers.json';
try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com' + path)); } catch (e) { r = null; }
if (!r || !r.ok) { try { r = await fetch(ORIGIN + path + '?v=' + Math.floor(Date.now() / 600000), { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
const v = r && r.ok ? await r.json().catch(() => null) : null;
MEMO = { t: Date.now(), v }; return v;
}
const S = TB.kbx_filings_S ;
const t = (l, k) => (S[l] && S[l][k] != null ? S[l][k] : S.en[k]);
export const filingsHeading = lang => t(lang, 'h');
const okUrl = u => /^https:\/\/[a-z0-9.-]+\//i.test(String(u || ''));
export function filingsDevHtml(fd, slug, lang) {
const d = fd && fd.developers && fd.developers[slug]; if (!d || !(d.l || []).length) return '';
const EX = fd.exchanges || {}, th = t(lang, 'th');
const rows = d.l.map(l => { const e = EX[l.x] || {}; const link = okUrl(l.u) ? '<a class="k-src" href="' + esc(l.u) + TB.kbx_filings__t.k0 + esc(t(lang, 'fil')) + '</a>' : okUrl(e.u) ? '<a class="k-src" href="' + esc(e.u) + TB.kbx_filings__t.k1 + esc(t(lang, 'exhome')) + '</a>' : '-';
return '<tr><th scope="row" data-label="' + esc(th[0]) + '">' + ltr(e.n || l.x) + '</th><td data-label="' + esc(th[1]) + '">' + (l.t ? '<b>' + ltr(l.t) + '</b>' : '-') + '</td><td data-label="' + esc(th[2]) + '">' + link + '</td></tr>'; }).join('');
let h = '<style>' + TB.kbx_filings__s.FIL_CSS + TB.kbx_filings__t.k2 + esc(t(lang, 'intro')).replace('{co}', ltr(d.co)) + '</p>' +
TB.kbx_filings__t.k3 + th.map(x => '<th scope="col">' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
const L = [];
if (d.annual && d.cik) L.push(esc(t(lang, 'annual')).replace('{form}', ltr(d.annual.form)).replace('{d}', esc(fdt(d.annual.filed, lang))).replace('{p}', esc(fdt(d.annual.period, lang))) +
TB.kbx_filings__t.k4 + esc(d.cik) + '&amp;type=' + esc(d.annual.form) + TB.kbx_filings__t.k5 + esc(t(lang, 'annual_l')) + '</a>');
if (d.lei) L.push(esc(t(lang, 'lei')) + ': ' + ltr(d.lei) + TB.kbx_filings__t.k6 + esc(d.lei) + TB.kbx_filings__t.k7);
if (d.q) L.push(esc(t(lang, 'src_wd')) + TB.kbx_filings__t.k8 + esc(d.q) + TB.kbx_filings__t.k9 + esc(d.q) + '</a>');
if (d.src && fd.sources && fd.sources[d.src] && okUrl(fd.sources[d.src].url)) L.push(esc(t(lang, 'src_list')) + ' <a class="k-src" href="' + esc(fd.sources[d.src].url) + TB.kbx_filings__t.k10 + ltr(fd.sources[d.src].name) + '</a>');
if (d.cik) L.push(esc(t(lang, 'src_sec')) + TB.kbx_filings__t.k11 + esc(String(d.cik).padStart(10, '0')) + TB.kbx_filings__t.k12 + esc(d.cik) + '</a>');
const FR31 = finRtHtml(d, lang);
if (L.length || FR31) h += '<ul class="fl">' + L.map(s => '<li class="kfact">' + s + '</li>').join('') + FR31 + '</ul>';
h += '<p class="k-small k-muted">' + esc(t(lang, 'cav')) + TB.kbx_filings__t.k13 + esc(slug) + '">' + esc(t(lang, 'json')) + '</a> <span class="k-muted">' + esc(String(t(lang, 'upd')).replace('{d}', fdt(fd.updated, lang))) + '</span></p></div>';
return h;
}
export async function handle(req, u, env) {
const H = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=600', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' };
const out = (o, s) => new Response(JSON.stringify(o, null, 1), { status: s || 200, headers: s && s >= 400 ? Object.assign({}, H, { 'cache-control': 'no-store' }) : H });
if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: 'method' }, 405);
const fd = await filingsData(env); if (!fd) return out({ error: 'not_built_yet' }, 503);
const s = (u.searchParams.get('dev') || '').toLowerCase();
if (s) {
if (!/^[a-z0-9-]{1,90}$/.test(s)) return out({ error: 'bad_dev' }, 400);
const d = (fd.developers || {})[s];
if (!d) return out({ dev: s, listed_match: false, note: TB.kbx_filings__s.k0, updated: fd.updated }, 404);
return out({ dev: s, url: ORIGIN + '/developers/' + s + '/#filings', listed_match: true, updated: fd.updated, company: d.co, wikidata: d.q || null, lei: d.lei || null, sec_cik: d.cik || null,
listings: d.l.map(l => ({ exchange: (fd.exchanges[l.x] || {}).n || l.x, ticker: l.t || null, filings: l.u || (fd.exchanges[l.x] || {}).u || null })), latest_annual_report_sec: d.annual || null, results_as_published: d.fin || null, credit_ratings_as_announced: d.rt || null, sources: fd.sources });
}
return out(Object.assign({ per_developer: ORIGIN + '/api/x/filings?dev=<slug>' }, fd));
}
