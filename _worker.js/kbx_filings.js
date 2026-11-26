// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_filings__q, $s = TB.kbx_filings__s, $t = TB.kbx_filings__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { finRtHtml, loadT as n31cT } from './kbx_n31c.js';
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
export const PATHS = /^\/api\/x\/filings\/?$/;
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.a, "'": '&#39;' }[c]));
const ltr = s => $q.b + esc(s) + $q.c;
const fdt = (d, l) => { if (!d) return ''; try { return new Date(d + $q.d).toLocaleDateString(LOC[l] || 'en-GB', { day: $q.e, month: 'short', year: $q.e, timeZone: 'UTC' }); } catch (e) { return d; } };
let MEMO = null;
export async function filingsData(env) {
await n31cT(env).catch(() => {});
if (MEMO && Date.now() - MEMO.t < 600000) return MEMO.v;
let r = null; const path = $q.f;
try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + $q.g + path)); } catch (e) { r = null; }
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
const rows = d.l.map(l => { const e = EX[l.x] || {}; const link = okUrl(l.u) ? $q.h + esc(l.u) + $t.k0 + esc(t(lang, 'fil')) + '</a>' : okUrl(e.u) ? $q.h + esc(e.u) + $t.k1 + esc(t(lang, $q.i)) + '</a>' : '-';
return $q.j + esc(th[0]) + '">' + ltr(e.n || l.x) + $q.k + esc(th[1]) + '">' + (l.t ? '<b>' + ltr(l.t) + '</b>' : '-') + $q.l + esc(th[2]) + '">' + link + $q.m; }).join('');
let h = $q.n + $s.FIL_CSS + $t.k2 + esc(t(lang, 'intro')).replace('{co}', ltr(d.co)) + '</p>' +
$t.k3 + th.map(x => $q.o + esc(x) + '</th>').join('') + $q.p + rows + $q.q;
const L = [];
if (d.annual && d.cik) L.push(esc(t(lang, $q.r)).replace($q.s, ltr(d.annual.form)).replace('{d}', esc(fdt(d.annual.filed, lang))).replace('{p}', esc(fdt(d.annual.period, lang))) +
$t.k4 + esc(d.cik) + $q.t + esc(d.annual.form) + $t.k5 + esc(t(lang, $q.u)) + '</a>');
if (d.lei) L.push(esc(t(lang, 'lei')) + ': ' + ltr(d.lei) + $t.k6 + esc(d.lei) + $t.k7);
if (d.q) L.push(esc(t(lang, $q.v)) + $t.k8 + esc(d.q) + $t.k9 + esc(d.q) + '</a>');
if (d.src && fd.sources && fd.sources[d.src] && okUrl(fd.sources[d.src].url)) L.push(esc(t(lang, $q.w)) + $q.x + esc(fd.sources[d.src].url) + $t.k10 + ltr(fd.sources[d.src].name) + '</a>');
if (d.cik) L.push(esc(t(lang, $q.y)) + $t.k11 + esc(String(d.cik).padStart(10, '0')) + $t.k12 + esc(d.cik) + '</a>');
const FR31 = finRtHtml(d, lang);
if (L.length || FR31) h += $q.z + L.map(s => $q.A + s + '</li>').join('') + FR31 + '</ul>';
h += $q.B + esc(t(lang, 'cav')) + $t.k13 + esc(slug) + '">' + esc(t(lang, 'json')) + $q.C + esc(String(t(lang, 'upd')).replace('{d}', fdt(fd.updated, lang))) + $q.D;
return h;
}
export async function handle(req, u, env) {
const H = { 'content-type': $q.E, 'cache-control': $q.F, 'access-control-allow-origin': '*', 'x-content-type-options': $q.G };
const out = (o, s) => new Response(JSON.stringify(o, null, 1), { status: s || 200, headers: s && s >= 400 ? Object.assign({}, H, { 'cache-control': $q.H }) : H });
if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: $q.I }, 405);
const fd = await filingsData(env); if (!fd) return out({ error: $q.J }, 503);
const s = (u.searchParams.get('dev') || '').toLowerCase();
if (s) {
if (!/^[a-z0-9-]{1,90}$/.test(s)) return out({ error: $q.K }, 400);
const d = (fd.developers || {})[s];
if (!d) return out({ dev: s, listed_match: false, note: $s.k0, updated: fd.updated }, 404);
return out({ dev: s, url: ORIGIN + $q.L + s + $q.M, listed_match: true, updated: fd.updated, company: d.co, wikidata: d.q || null, lei: d.lei || null, sec_cik: d.cik || null,
listings: d.l.map(l => ({ exchange: (fd.exchanges[l.x] || {}).n || l.x, ticker: l.t || null, filings: l.u || (fd.exchanges[l.x] || {}).u || null })), latest_annual_report_sec: d.annual || null, results_as_published: d.fin || null, credit_ratings_as_announced: d.rt || null, sources: fd.sources });
}
return out(Object.assign({ per_developer: ORIGIN + $q.N }, fd));
}
