// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_rules__q, $s = TB.kbx_rules__s, $t = TB.kbx_rules__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { TB } from './kbx_strings.js';
import { sf } from './kbx_jget.js';
const ORIGIN = 'https://kolaboro.com';
export const PAGE_RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?guides\/short-let-rules(\/?)$/;
export const PATHS = /^\/api\/x\/short-let-rules\/?$/;
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.a, "'": '&#39;' }[c]));
const CELLS = ['reg', 'cap', 'stay', 'own'];
let MEMO = null;
export const rulesData = env => sf('rules', () => rulesData0(env));   // n40 d14: concurrent requests share one load
async function rulesData0(env) {
if (MEMO && Date.now() - MEMO.t < 600000) return MEMO.v;
let r = null; const path = $q.b;
try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + $q.c + path)); } catch (e) { r = null; }
if (!r || !r.ok) { try { r = await fetch(ORIGIN + path + '?v=' + Math.floor(Date.now() / 600000), { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
const v = r && r.ok ? await r.json().catch(() => null) : null;
MEMO = { t: Date.now(), v }; return v;
}
const S = TB.kbx_rules_S ;
const t = (l, k) => (S[l] && S[l][k] != null ? S[l][k] : S.en[k]);
const fdt = (d, l) => { if (!d) return ''; try { return new Date(d + $q.d).toLocaleDateString(LOC[l] || 'en-GB', { day: $q.e, month: 'short', year: $q.e, timeZone: 'UTC' }); } catch (e) { return d; } };
const ltr = s => $q.f + esc(s) + $q.g;
export function rulesFor(rd, x, ds) {
if (!rd || !rd.rules || !x) return [];
const ids = (ds && rd.by_dataset && rd.by_dataset[ds]) || (rd.by_market && rd.by_market[x.mk]) || (rd.by_country && rd.by_country[x.co]) || [];
return ids.filter(i => rd.rules[i]);
}
function srcMark(rd, id, lang) {
const s = rd.sources && rd.sources[id]; if (!s) return '';
const pub = String(s.n).split(',')[0], when = s.d ? String(t(lang, 'dk')[s.dk || 'page'] || '{d}').replace('{d}', s.dk === $q.h ? s.d.slice(0, 4) : fdt(s.d, lang)) : String(t(lang, 'read')).replace('{d}', fdt(s.read, lang));
return $q.i + esc(s.u) + $t.k0 + ltr(pub) + ', ' + esc(when) + $q.j;
}
function cellHtml(rd, c, lang) {
if (!c || c.s === 'nc') return $q.k + esc(t(lang, 'nc')) + $q.l;
if (c.s === 'nf') return $q.k + esc(t(lang, 'nf')) + $q.l;
if (c.s === 'up') return $q.k + esc(t(lang, 'up')) + $q.l;
const txt = (c.t && (c.t[lang] || c.t.en)) || '';
return $t.k1 + esc(txt) + $q.l + (c.q ? $q.m + esc(c.q.l) + $q.n + esc(c.q.t) + '</q>' : '') + ' ' + (c.src || []).map(i => srcMark(rd, i, lang)).join(' ') + $q.o;
}
function tableHtml(rd, ids, lang, quotes) {
const cols = t(lang, 'cols');
return $s.k0 + cols.map(c => $q.p + esc(c) + '</th>').join('') + $q.q +
ids.map(i => { const j = rd.rules[i]; return $q.r + esc(i) + $q.s + esc(cols[0]) + '">' + ltr(j.name) + '</th>' + CELLS.map((c, n) => $q.t + esc(cols[n + 1]) + '">' + cellHtml(rd, quotes ? j[c] : Object.assign({}, j[c], { q: null }), lang) + '</td>').join('') + '</tr>'; }).join('') + $q.u;
}
export const RULES_CSS = '.ksr-tw{margin:12px 0;overflow-x:auto}.ksr th[scope=row]{min-width:6.5em;font-weight:600}.ksr td{min-width:9.5em;vertical-align:top;font-size:var(--k-fs-sm,15px)}.ksr .k-src{display:flex;white-space:normal;margin-top:4px;width:fit-content;max-width:100%}.ksr-t{display:block}.ksr-q{display:block;margin:4px 0;color:var(--k-muted,var(--muted));font-size:var(--k-fs-xs,13px);unicode-bidi:isolate}' +
'@media (max-width:640px){.ksr td,.ksr th[scope=row]{min-width:0}.ksr.k-table--stack td{display:block;text-align:start;padding:6px 0}.ksr.k-table--stack td::before{display:block;margin-bottom:2px;font-size:var(--k-fs-xs,13px)}.ksr.k-table--stack th[scope=row]{display:block;padding:2px 0 4px;font-size:var(--k-fs-md,17px);text-align:start}}';
export function rulesHtml(rd, x, lang, ds) {
const ids = rulesFor(rd, x, ds); if (!ids.length) return '';
return $q.v + esc(t(lang, 'h')) + $q.w + esc(t(lang, 'lead')) + '</p>' + tableHtml(rd, ids, lang, false) +
$q.x + pre(lang) + $q.y + esc(t(lang, 'all')) + $q.z;
}
export function rulesJson(rd, x, ds) {
const ids = rulesFor(rd, x, ds); if (!ids.length) return null;
return { page: ORIGIN + $q.A, read: rd.updated, note: rd.note, rules: ids.map(i => { const j = rd.rules[i], o = { id: i, place: j.name }; for (const c of CELLS) o[c] = { status: j[c].s, text: j[c].t ? j[c].t.en : null, sources: (j[c].src || []).map(s => rd.sources[s]) }; return o; }) };
}
const PG_CSS = '<style>' + RULES_CSS + '.ksr-pg h2{margin-top:var(--k-6,32px)}.ksr-pg ul,.ksr-pg ol{padding-inline-start:1.2em}.ksr-pg li{margin:6px 0}.ksr-src li{overflow-wrap:anywhere}.ksr-pg .k-table-wrap{max-width:100%}</style>';
export function pageBody(rd, lang) {
const order = [$q.B, $q.C, $q.D, $q.E, 'de-be', 'fr', 'es-an', 'es-ib', 'es-vc', 'es', 'pt', $q.F, $q.G, 'gr', 'tr', 'ae-du', 'ca-bc', 'ca-to', $q.H, $q.I, $q.J, 'us-fl', 'us-nv', 'us-hi', 'th', $q.K, $q.L].filter(i => rd.rules[i]);
for (const i of Object.keys(rd.rules)) if (!order.includes(i)) order.push(i);
const used = new Set(); for (const i of order) for (const c of CELLS) for (const s of (rd.rules[i][c].src || [])) used.add(s);
const srcs = Object.keys(rd.sources).filter(k => used.has(k)).map(k => { const s = rd.sources[k]; return $q.M + esc(s.u) + $q.N + ltr(s.n) + $q.O + (s.d ? esc(String(t(lang, 'dk')[s.dk || 'page']).replace('{d}', s.dk === $q.h ? s.d.slice(0, 4) : fdt(s.d, lang))) + ', ' : '') + esc(String(t(lang, 'read')).replace('{d}', fdt(s.read, lang))) + $q.P; }).join('');
const nr = t(lang, 'p_not'), nots = (rd.not_read || []).map(n => '<li>' + ltr(n.place) + ': ' + esc(nr[n.place] || n.why) + '</li>').join('');
return $s.k1 + pre(lang) + $q.Q + esc(t(lang, 'crumb')) + $q.R + esc(t(lang, $q.S)) + $q.T + esc(t(lang, $q.U)) + '</p>' +
$q.V + esc(String(t(lang, 'p_upd')).replace('{d}', fdt(rd.updated, lang))) + $q.W +
'<h2>' + esc(t(lang, $q.X)) + $q.Y + t(lang, 'p_how').map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>' +
$q.Z + esc(t(lang, 'p_t_h')) + '</h2>' + tableHtml(rd, order, lang, true) +
'<h2>' + esc(t(lang, 'p_q_h')) + $q.aa + t(lang, 'p_q').map(s => '<li>' + esc(s) + '</li>').join('') + '</ol>' +
$q.ab + esc(t(lang, $q.ac)) + $q.ad + esc(t(lang, $q.ae)) + $q.af + srcs + '</ul>' +
(nots ? '<h2>' + esc(t(lang, $q.ag)) + $q.Y + nots + '</ul>' : '') +
'<h2>' + esc(t(lang, $q.ah)) + $q.ad + esc(t(lang, $q.ai)) + $q.aj + pre(lang) + $t.k2 +
$t.k3 + esc(t(lang, $q.ak)) + $s.k2 + esc(t(lang, 'p_lic')) + $q.al;
}
export async function page(req, u, env, ctx, shell) {
  const m = u.pathname.match(PAGE_RX); if (!m || !shell) return null;
  if (!m[2]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': $q.am } });
  const lang = m[1] || 'en', path = $q.A, url = ORIGIN + pre(lang) + path;
  const rd = await rulesData(env); if (!rd || !rd.rules) return null;
  const sh = await shell(pre(lang) + $q.an);
  const ld = { '@context': $q.ao, '@graph': [
    { '@type': $q.ap, '@id': url + '#page', url, name: t(lang, $q.S), description: t(lang, $q.aq), inLanguage: lang, dateModified: rd.updated, isPartOf: { '@type': $q.ar, name: $q.as, url: ORIGIN + '/' } },
    { '@type': $q.at, name: t(lang, $q.S), description: t(lang, $q.aq), url, isAccessibleForFree: true, dateModified: rd.updated, license: $q.au, creator: { '@type': $q.av, name: $q.as, url: ORIGIN + '/' }, distribution: [{ '@type': $q.aw, encodingFormat: $q.ax, contentUrl: ORIGIN + $q.b }] },
    { '@type': $q.ay, itemListElement: [{ '@type': $q.az, position: 1, name: $q.as, item: ORIGIN + pre(lang) + '/' }, { '@type': $q.az, position: 2, name: t(lang, $q.S), item: url }] }] };
  const alts = LANGS.map(l => $q.aA + l + $q.aB + ORIGIN + pre(l) + path + '">').join('') + $q.aC + ORIGIN + path + '">';
  const tags = $q.aD + esc(t(lang, $q.S)) + $q.aE + esc(t(lang, $q.aq)) + $q.aF + url + '">' + alts +
    $q.aG + esc(t(lang, $q.S)) + $q.aH + esc(t(lang, $q.aq)) + $q.aI + url + $q.aJ +
    $q.aK + JSON.stringify(ld).replace(/</g, $q.aL) + $q.aM + PG_CSS;
  const body = pageBody(rd, lang);
  const res = new HTMLRewriter()
    .on('html', { element(e) { e.setAttribute('lang', lang); if (lang === 'ar') e.setAttribute('dir', 'rtl'); else e.removeAttribute('dir'); } })
    .on('title', { element(e) { e.remove(); } })
    .on($q.aN, { element(e) { e.remove(); } })
    .on($q.aO, { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(body, { html: true }); } })
    .on($q.aP, { element(e) { const l = e.getAttribute($q.aQ); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + path); } })
    .transform(new Response(sh.body, { headers: { 'content-type': $q.aR } }));
  return new Response(await res.text(), { status: 200, headers: { 'content-type': $q.aR, 'cache-control': $q.aS } });
}
export async function handle(req, u, env) {
const H = { 'content-type': $q.aT, 'cache-control': $q.aS, 'access-control-allow-origin': '*', 'x-content-type-options': $q.aU };
if (req.method !== 'GET' && req.method !== 'HEAD') return new Response(JSON.stringify({ error: $q.aV }), { status: 405, headers: Object.assign({}, H, { 'cache-control': $q.aW }) });
const rd = await rulesData(env);
if (!rd) return new Response(JSON.stringify({ error: $q.aX }), { status: 503, headers: Object.assign({}, H, { 'cache-control': $q.aW }) });
return new Response(JSON.stringify(Object.assign({ page: ORIGIN + $q.A, per_project: ORIGIN + $t.k4 }, rd), null, 1), { headers: H });
}
