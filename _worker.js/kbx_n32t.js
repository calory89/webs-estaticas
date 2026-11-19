// kolaboro.com batch 32 (agent n32t, 19 Nov 2026): item 186 (the rest) and /registers/ in 8 languages. No model calls, nothing stored.
//   GET /<lang>/tools/<tool>/   the individual tool pages (account check, risk, law notes, ...) in es fr de nl ru zh ar
//   GET /<lang>/registers/      the official registers guide
//   GET /<lang>/new/, /<lang>/vs/   the "new this month" and comparisons hubs
//   GET /<lang>/m/              the market files hub (markets with 5+ named projects, same rule as the translated market files)
//   enAlt(u, r, env)            hreflang on the English pages that have translations, and the language menu pointed at them
// One translation layer instead of 30 copies: the English page (static file or worker page) is read, its <main> is translated
// fragment by fragment from /data/n32t/<lang>/<page>.json (static assets, never in the bundle), links point at the translated pages
// that exist, and the result is set in the localized site frame (header, footer, canonical, hreflang). A language is served only when
// /data/n32t/manifest.json lists it for the page (the build checks that the dictionary covers every fragment of the English page);
// otherwise the URL keeps answering 404, so no half-English page is published. Text the tool scripts write later (results) is
// translated in the browser by /k/n32t.js with the same dictionary. Dates and place names are put in the page language with Intl and
// kbx_hdate.js. Sumba, Eco Beach City and Equinox: nothing here adds a project; the English pages already leave them out.
import { mkName, coName } from './kbx_hdate.js';

const ORIGIN = 'https://kolaboro.com';
const L7 = ['es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'], LANGS = ['en'].concat(L7);
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar-u-nu-latn' };   // Arabic with Latin digits, as the rest of the site
export const N32T_V = 'n32t4';
export const PATHS = /^\/(?:es|de|fr|nl|ru|zh|ar)\/(?:tools\/[a-z-]{3,30}|new|vs|m|registers)\/?$/;
export const EN_RX = /^\/(?:tools\/[a-z-]{3,30}|new|vs|m|registers)\/$/;
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const MEMO = new Map();
async function asset(env, p, json) {
  const m = MEMO.get(p); if (m && Date.now() - m.t < 600000) return m.v;
  let v = null;
  try { if (env && env.ASSETS) { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com' + p)); if (r.ok) v = json ? await r.json() : await r.text(); } } catch (e) { v = null; }
  if (v == null && json) { try { const r = await fetch(ORIGIN + p, { cf: { cacheTtl: 300 } }); if (r.ok) v = await r.json(); } catch (e) { v = null; } }
  MEMO.set(p, { t: Date.now(), v }); return v;
}
const manifest = async env => (await asset(env, '/data/n32t/manifest.json', true)) || { pages: {} };
export async function langsOf(env, key) { const M = await manifest(env); return (M.pages && M.pages[key]) || []; }
// paths ('/tools/risk/') that exist in this language: ours plus the tool pages other modules already serve in 8 languages
const OTHER = ['/tools/bulk-check/', '/tools/contract-addendum/', '/tools/contract-reader/', '/tools/permit-photo/', '/tools/widget/', '/tools/find-listing/', '/tools/handover-history/', '/tools/visa-by-investment/', '/tools/compare-countries/', '/tools/on-time/', '/tools/request-documents/', '/tools/inheritance/', '/tools/foreign-mortgages/', '/tools/area-report/', '/tools/translate/', '/tools/receipt-check/', '/tools/payment-vs-progress/'];
export async function localSet(env, lang) {
  const M = await manifest(env), S = new Set(OTHER);
  for (const [k, L] of Object.entries(M.pages || {})) if (L.includes(lang)) S.add('/' + k + '/');
  // country and market pages exist in the other languages only with 5+ named projects (kbx_n29i): link those, keep the rest in English
  try { const { mdata } = await import('./kbx_n29i.js'), D = await mdata(env); for (const c of D.C.keys()) S.add('/countries/' + c + '/'); for (const k of D.M.keys()) S.add('/m/' + k + '/'); } catch (e) {}
  return S;
}
const FIXED = /^\/(?:|check\/?|pricing\/|how-we-score\/|about\/|checklist\/|database\/|cases\/|apply\/|tools\/|glossary\/|docs\/|projects\/(?:[a-z0-9-]{1,90}\/)?|developers\/(?:[a-z0-9-]{1,90}\/)?|countries\/|rankings\/(?:[a-z0-9-]{2,60}\/)?|guides\/buyers-from\/(?:[a-z]+\/)?|reports\/month\/|satellite\/monthly\/|watch\/new-websites\/|app\/)$/;
function locHref(h, lang, LS) {
  if (!/^\/(?!\/)/.test(h) || /^\/(?:es|de|fr|nl|ru|zh|ar)\//.test(h)) return h;
  const i = h.search(/[?#]/), p = i < 0 ? h : h.slice(0, i);
  if (/\.[a-z0-9]{2,5}$/i.test(p) || /^\/(?:api|data|k|_s)\//.test(p)) return h;
  return LS.has(p) || FIXED.test(p) ? '/' + lang + h : h;
}

// ------------------------------------------------------------------------------------------------ dictionary and translation
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', middot: '·', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', times: '×', euro: '€', copy: '©', rarr: '→', larr: '←', bull: '•', deg: '°' };
const dec = s => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(/x/i.test(e[1]) ? parseInt(e.slice(2), 16) : +e.slice(1)) : (ENT[e] != null ? ENT[e] : m));
const enc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const encA = s => enc(s).replace(/"/g, '&quot;');
const SEP = /^[\s/·|›>]+/;
const DCACHE = new Map();
async function dict(env, lang, key) {
  const k = lang + ':' + key, c = DCACHE.get(k); if (c && Date.now() - c.t < 600000) return c.v;
  const f = key.replace(/\//g, '-');
  const [a, b] = await Promise.all([asset(env, '/data/n32t/' + lang + '/_common.json', true), asset(env, '/data/n32t/' + lang + '/' + f + '.json', true)]);
  let v = null;
  if (b && b.s) {
    const s = Object.assign({}, (a && a.s) || {}, b.s), P = [], H = [];   // H: patterns that span inline markup ("tracks <b>{n}</b> projects"), applied to the HTML first
    for (const [src, out] of ((a && a.p) || []).concat(b.p || [])) { const names = [], html = src.includes('<'); const rx = new RegExp((html ? '' : '^') + src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{(\w+)\\\}/g, (m, n) => { names.push(n); return html ? '([^<>"]*?)' : '(.+?)'; }) + (html ? '' : '$'), html ? 'g' : ''); (html ? H : P).push([rx, out, names]); }
    v = { s, P, H, t: b.t, d: b.d, h: b.h || null, lang };
  }
  DCACHE.set(k, { t: Date.now(), v }); return v;
}
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MRX = MON.map(m => m.slice(0, 3)).join('|');
const DRX = new RegExp('^(\\d{1,2}) (' + MRX + ')[a-z]*\\.? (\\d{4})$'), YRX = new RegExp('^(' + MRX + ')[a-z]* (\\d{4})$');
function auto(s, lang) {
  if (/^(?:https?:\/\/)?[\w-]+(?:\.[\w-]+)*\.[a-z]{2,6}(?:\/\S*)?$/i.test(s)) return s;   // a domain, file or address stays as written
  let m = DRX.exec(s);
  if (m) { const d = new Date(Date.UTC(+m[3], MON.findIndex(x => x.startsWith(m[2])), +m[1], 12)); try { return new Intl.DateTimeFormat(LOC[lang], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d); } catch (e) { return null; } }
  if ((m = YRX.exec(s))) { const d = new Date(Date.UTC(+m[2], MON.findIndex(x => x.startsWith(m[1])), 15, 12)); try { return new Intl.DateTimeFormat(LOC[lang], { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d); } catch (e) { return null; } }
  if ((m = /^(.+) \((\d[\d,]*)\)$/.exec(s)) && /^[A-Z]/.test(m[1]) && m[1].length <= 40) return (place(m[1], lang) || m[1]) + ' (' + m[2] + ')';   // "Spain (80)": a place and its count
  return place(s, lang);
}
function place(s, lang) {
  if (s.length > 60 || !/^[A-Z]/.test(s)) return null;
  const a = mkName(s, lang); if (a && a !== s) return a;
  const parts = s.split(', '); if (parts.length > 1) { const t = parts.map(p => mkName(p, lang)); if (t.some((x, i) => x !== parts[i])) return t.join(', '); }
  const c = coName(s, lang); return c && c !== s ? c : null;
}
function T(D, s) {
  if (D.s[s] != null) return D.s[s];
  for (const [rx, out, names] of D.P) { const m = rx.exec(s); if (m) return out.replace(/\{(\w+)\}/g, (z, k) => { const i = names.indexOf(k); if (i < 0) return z; const v = m[i + 1]; return D.s[v] != null ? D.s[v] : (auto(v, D.lang) || v); }); }
  return auto(s, D.lang);
}
function trText(D, raw) {
  const lead = /^\s*/.exec(raw)[0], trail = /\s*$/.exec(raw)[0];
  let core = dec(raw).replace(/\s+/g, ' ').trim(); if (!core) return raw;
  const sp = (SEP.exec(core) || [''])[0]; core = core.slice(sp.length).trim(); if (!core) return raw;
  const t = T(D, core); return t == null ? raw : lead + enc(sp) + enc(t) + trail;
}
const ATTR = /(\s(?:placeholder|aria-label|title|alt|data-l|data-label|data-n32)=")([^"]*)(")/g;
export function trHtml(html, D, LS) {
  const out = [];
  for (const [rx, o, names] of D.H || []) html = html.replace(rx, (...m) => o.replace(/\{(\w+)\}/g, (z, k) => { const i = names.indexOf(k); if (i < 0) return z; const v = dec(m[i + 1]).trim(); return enc(D.s[v] != null ? D.s[v] : (auto(v, D.lang) || v)); }));
  for (const tok of html.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->|<[^>]+>)/)) {
    if (!tok) continue;
    if (tok[0] !== '<' || tok === '<') { out.push(trText(D, tok)); continue; }
    if (/^<(?:script|style|!--)/.test(tok)) { out.push(tok); continue; }
    let t = tok.replace(ATTR, (m, a, v, z) => { const c = dec(v).replace(/\s+/g, ' ').trim(), x = c ? T(D, c) : null; return a + (x == null ? v : encA(x)) + z; });
    if (/^<a\s/i.test(t)) t = t.replace(/(\shref=")([^"]*)(")/, (m, a, h, z) => a + locHref(h, D.lang, LS) + z);
    out.push(t);
  }
  return out.join('');
}

// ------------------------------------------------------------------------------------------------ page assembly
async function englishOf(env, key, inner) {
  if (key === 'new' || key === 'vs') { const r = await inner('/' + key + '/'); return r && r.status === 200 ? await r.text() : null; }
  return await asset(env, '/' + key + '/', false);
}
function parts(src, shellTxt) {
  const mm = /<main[^>]*>([\s\S]*)<\/main>/.exec(src); if (!mm) return null;
  const hd = src.slice(0, Math.max(0, src.indexOf('</head>'))), after = src.slice(src.indexOf('</main>'));
  const has = p => shellTxt.includes(p.split('?')[0]);
  const css = (hd.match(/<link rel="stylesheet" href="[^"]+"[^>]*>/g) || []).filter(l => !/\/k\/(?:ds-)?site\.css/.test(l) && !has((/href="([^"]+)"/.exec(l) || [])[1]))
    .concat((hd.match(/<style[^>]*>[\s\S]*?<\/style>/g) || []).filter(s => !/id="kb-vt"/.test(s) && !shellTxt.includes(s.slice(0, 120))));
  const js = (after.match(/<script\b[^>]*>[\s\S]*?<\/script>/g) || []).filter(s => { const m = /\ssrc="([^"]+)"/.exec(s); if (m) return !has(m[1]); const body = s.replace(/^<script[^>]*>/, '').trim(); return body && !/^\s*\{/.test(body) && !shellTxt.includes(body.slice(0, 100)); })
    .map(s => s.replace(/\snonce="[^"]*"/, ''));
  return { main: mm[1], css: css.join(''), js: js.join('') };
}
async function render(env, lang, key, D, body, shTxt, extra) {
  const N = await import('./kbx_named.js');
  const path = '/' + key + '/', canon = ORIGIN + pre(lang) + path, have = new Set(await langsOf(env, key));
  const alt = l => ORIGIN + (l === 'en' || have.has(l) ? pre(l) : '') + path;
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': key.startsWith('tools/') ? 'WebApplication' : 'CollectionPage', name: D.t, description: D.d, url: canon, inLanguage: lang, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kolaboro', item: ORIGIN + pre(lang) + '/' }].concat(key.startsWith('tools/') ? [{ '@type': 'ListItem', position: 2, name: T(D, 'Tools') || 'Tools', item: ORIGIN + pre(lang) + '/tools/' }] : []).concat([{ '@type': 'ListItem', position: key.startsWith('tools/') ? 3 : 2, name: D.t, item: canon }]) }] };
  if (key.startsWith('tools/')) Object.assign(ld['@graph'][0], { applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any (runs in the browser)', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } });
  if (!shTxt) return null;
  const pg = { title: D.t + ' | Kolaboro', desc: D.d, canon, body, alt, ld };
  let html = await N.assemble(pg, lang, new Response(shTxt));
  // function replacements: page scripts can hold "$'" or "$&" (e.g. 'US$'), which a replacement string would expand
  // longer words in de/nl/ru can widen a grid track past a 390 px screen: let cards shrink and wrap
  const c = (extra && extra.css ? extra.css : '') + '<style>main .rg-cards>*,main .rgc{min-width:0;overflow-wrap:anywhere}</style></head>'; html = html.replace('</head>', () => c);
  const tail = (extra && extra.js ? extra.js : '') + '<script src="/k/n32t.js?v=' + N32T_V + '" data-k="' + esc(key.replace(/\//g, '-')) + '" defer></script></body>';
  html = html.replace('</body>', () => tail);
  return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600' } });
}

// the market files hub: every market with a translated market file (kbx_n29i.js: 5+ named projects), by country
async function marketsBody(env, lang, D) {
  const { mdata } = await import('./kbx_n29i.js'), M = await mdata(env), P = pre(lang);
  const nf = n => { try { return Number(n).toLocaleString(LOC[lang], { maximumFractionDigits: 0 }); } catch (e) { return String(n); } };
  const L = [...M.M.entries()].map(([s, m]) => ({ s, m, co: (m.L[0] || {}).co || '' })).sort((a, b) => b.m.L.length - a.m.L.length || a.m.mk.localeCompare(b.m.mk));
  const n = L.reduce((a, x) => a + x.m.L.length, 0);
  let fdt = M.d; try { fdt = new Intl.DateTimeFormat(LOC[lang], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(M.d + 'T12:00:00Z')); } catch (e) {}
  const th = ['Market', 'Country', 'Named projects', 'Permit or licence number published', 'Past the advertised handover date'].map(k => '<th scope="col">' + esc(T(D, k) || k) + '</th>').join('');
  const rows = L.map(x => '<tr><td><a href="' + P + '/m/' + x.s + '/"><bdi>' + esc(mkName(x.m.mk, lang)) + '</bdi></a></td><td><bdi>' + esc(coName(x.co, lang)) + '</bdi></td><td>' + nf(x.m.st.n) + '</td><td>' + nf(x.m.st.pn) + '</td><td>' + nf(x.m.st.ov) + '</td></tr>').join('');
  const lead = (T(D, '{n} markets with 5 or more named projects ({p} projects in all). Data of {d}.') || '').replace('{n}', nf(L.length)).replace('{p}', nf(n)).replace('{d}', fdt);
  return '<section class="phero kp"><div class="wrap"><p class="crumb"><a href="' + P + '/">Kolaboro</a> / <a href="' + P + '/database/">' + esc(T(D, 'Database') || 'Database') + '</a> / ' + esc(T(D, 'Markets') || 'Markets') + '</p><h1>' + esc(D.h || D.t) + '</h1><p class="lead">' + esc(lead) + '</p></div></section>' +
    '<div class="wrap kwrap"><div class="tw"><table><thead><tr>' + th + '</tr></thead><tbody>' + rows + '</tbody></table></div><p class="k-small">' + esc(T(D, 'Markets with fewer named projects have an English file: see the full list.') || '') + ' <a href="/m/" hreflang="en">' + esc(T(D, 'All markets (English)') || 'All markets') + '</a>. <a href="' + P + '/countries/">' + esc(T(D, 'Countries') || 'Countries') + '</a></p></div>';
}

export async function handle(req, u, env, ctx, shell, inner) {
  const m = /^\/(es|de|fr|nl|ru|zh|ar)\/(.+?)(\/?)$/.exec(u.pathname); if (!m) return null;
  const lang = m[1], key = m[2];
  if (!(await langsOf(env, key)).includes(lang)) return null;
  if (!m[3]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': 'public, max-age=3600' } });
  const D = await dict(env, lang, key); if (!D) return null;
  const ck = typeof caches !== 'undefined' ? new Request(ORIGIN + '/__n32t/' + N32T_V + '.' + ((await manifest(env)).v || 0) + u.pathname) : null;   // the built page for 15 minutes (the English /new/ is 400 KB)
  if (ck) { try { const hit = await caches.default.match(ck); if (hit) return new Response(hit.body, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600', 'x-n32t-cache': 'hit' } }); } catch (e) {} }
  const r = await build(env, lang, key, D, shell, inner);
  if (r && ck && ctx && ctx.waitUntil) { const c = r.clone(); ctx.waitUntil(caches.default.put(ck, new Response(c.body, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=900' } })).catch(() => {})); }
  return r;
}
async function build(env, lang, key, D, shell, inner) {
  const LS = await localSet(env, lang);
  const sh0 = await shell(pre(lang) + '/how-we-score/'); const shTxt = sh0 && sh0.status === 200 ? await sh0.text() : ''; if (!shTxt) return null;
  if (key === 'm') return render(env, lang, key, D, await marketsBody(env, lang, D), shTxt, null);
  const src = await englishOf(env, key, inner); if (!src) return null;
  const P = parts(src, shTxt); if (!P) return null;
  let body = trHtml(P.main, D, LS);
  if (key === 'new' || key === 'vs') body = body.replace(/(<a\s[^>]*href="\/vs\/[a-z0-9-]+-vs-[a-z0-9-]+\/")/g, '$1 hreflang="en"');   // pair pages are English only
  return render(env, lang, key, D, body, shTxt, { css: P.css, js: P.js });
}

// English pages with translations: hreflang alternates and the language menu pointed at the translated page
export async function enAlt(u, r, env) {
  const key = u.pathname.slice(1, -1), L = await langsOf(env, key); if (!L.length) return r;
  const tags = LANGS.filter(l => l === 'en' || L.includes(l)).map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + u.pathname + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + u.pathname + '">';
  return new HTMLRewriter().on('link[rel="alternate"][hreflang]', { element(e) { e.remove(); } }).on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); if (L.includes(l)) e.setAttribute('href', pre(l) + u.pathname); } }).transform(r);
}
// build and test helper (tools/kolaboro-i18n/n32t-build.mjs): the fragments of an English <main> that the dictionary leaves untranslated
export function missing(html, D) {
  const out = new Set();
  for (const [rx, o] of D.H || []) html = String(html).replace(rx, () => o.replace(/[A-Za-z]/g, ''));   // what a markup pattern covers counts as translated
  const chk = c => { c = dec(c).replace(/\s+/g, ' ').trim(); c = c.slice(((SEP.exec(c) || [''])[0]).length).trim(); if (c && /[A-Za-z]{2}/.test(c) && T(D, c) == null) out.add(c); };
  for (const tok of String(html).split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->|<[^>]+>)/)) {
    if (!tok || /^<(?:script|style|!--)/.test(tok)) continue;
    if (tok[0] === '<' && tok !== '<') { let m; ATTR.lastIndex = 0; while ((m = ATTR.exec(tok))) chk(m[2]); } else chk(tok);
  }
  return [...out];
}
export function mkDict(lang, j) { const P = [], H = []; for (const [src, out] of j.p || []) { const names = [], html = src.includes('<'); const rx = new RegExp((html ? '' : '^') + src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\{(\w+)\\\}/g, (m, n) => { names.push(n); return html ? '([^<>"]*?)' : '(.+?)'; }) + (html ? '' : '$'), html ? 'g' : ''); (html ? H : P).push([rx, out, names]); } return { s: j.s || {}, P, H, t: j.t, d: j.d, h: j.h || null, lang }; }
export { T as n32tT };
