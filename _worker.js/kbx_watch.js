// kolaboro.com batch 19 (n19a): fraud radar. No model calls. Facts only: a resemblance or a screening result, never a verdict.
// Data (built daily on main, published to pub/_lovable):
//   /data/lookalikes.json  .github/workflows/kolaboro-lookalikes.yml, tools/kolaboro-agent/fake_sites.py: new websites whose names
//                          resemble a developer or project website we track (Certificate Transparency via crt.sh, registered
//                          lookalike names in public DNS), with registry RDAP registration date, first certificate date and whether
//                          the name resolves today. The lookalike websites themselves are never opened.
//   /data/sanctions.json   .github/workflows/kolaboro-sanctions.yml, tools/kolaboro-agent/sanctions_screen.py: the official lists
//                          screened (entity entries only) and the developer pages whose company name had NO possible match.
//                          Possible matches are not published: they go to the admin CRM ("Screening" tab, admin key), kept with
//                          the internal risk graph (kolaboro_machine graph_put, read through kolaboro_ops2 'graph').
// Routes:
//   GET /watch/lookalikes/ (+ /<lang>/)  public feed in 8 languages (index.js calls page())
//   GET /api/x/watch/lookalikes          the feed as JSON (?dev=<slug> or ?d=<official domain> to filter)
//   GET /api/x/watch/sanctions           lists screened and developer pages with no match
//   GET /__k/kwatch-admin.js             admin CRM tab "Screening" (index.js injects it on /admin)
// Developer pages: kbx_named.js calls watchDevHtml() for the section #watch.
import { TB } from './kbx_strings.js';   // n32w: string tables loaded as static JSON (worker size limit)
import { LOCALE } from './kbx_named_i18n.js';
import { warnDevHtml } from './kbx_gaz.js';
import { t as I30 } from './kbx_n30c_named.js';   // n30c: link to the image reuse page   // n21a (batch 21): regulator warning lists line, gazette notices data

const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
export const PATHS = /^\/api\/x\/watch\/(?:lookalikes|sanctions)$/;
export const PAGE_RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?watch\/lookalikes(\/?)$/;
const H = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' };
const out = (o, st) => new Response(JSON.stringify(o), { status: st || 200, headers: Object.assign({ 'cache-control': 'public, max-age=900' }, H) });
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pre = l => l === 'en' ? '' : '/' + l;
// n20p: one formatter per locale and options for the life of the isolate (building one per call cost most of the render time)
const dtf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'd' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.DateTimeFormat(L, o)); };
const nmf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'n' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.NumberFormat(L, o)); };
function fdt(d, lang) { try { return dtf(LOCALE[lang] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(d + 'T00:00:00Z')); } catch (e) { return d; } }

let MEMO = null;
async function loadOne(env, name) {
  let r = null;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); } catch (e) { r = null; }
  if (!r || !r.ok) { try { r = await fetch(ORIGIN + '/data/' + name + '?v=1', { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
  return r && r.ok ? await r.json().catch(() => null) : null;
}
export async function watchData(env) {
  if (MEMO && Date.now() - MEMO.t < 600000) return MEMO.v;
  const [la, sa, gz] = await Promise.all([loadOne(env, 'lookalikes.json'), loadOne(env, 'sanctions.json'), loadOne(env, 'gazette.json')]);   // gz: n21a
  const byUrl = new Map();
  for (const x of ((la && la.items) || [])) { if (!byUrl.has(x.url)) byUrl.set(x.url, []); byUrl.get(x.url).push(x); }
  const v = { la, sa, gz, byUrl, clean: new Set((sa && sa.no_match) || []) };
  MEMO = { t: Date.now(), v }; return v;
}

// ------------------------------------------------------------------------------------------------ strings (8 languages)
const S = TB.kbx_watch_S /* n32w (19 Nov 2026): table moved to /data/i18n/kbx_watch.json, filled by kbx_strings.js before any kolaboro.com request is handled */;
const t = (lang, k, v) => { const s = (S[lang] && S[lang][k] != null ? S[lang][k] : S.en[k]); return typeof s === 'string' && v ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
export const watchHeading = lang => t(lang, 'h');

const rdapUrl = d => 'https://client.rdap.org/?type=domain&object=' + encodeURIComponent(d);
const crtUrl = d => 'https://crt.sh/?q=' + encodeURIComponent(d);
/* CSS: n40 k17, in /data/i18n/k17s.json */

function itemHtml(x, lang) {
  const meta = [x.reg ? t(lang, 'reg', { d: fdt(x.reg, lang) }) : t(lang, 'noreg'), x.cert ? t(lang, x.cert_first ? 'cert' : 'cert2', { d: fdt(x.cert, lang) }) : t(lang, x.cert_first ? 'nocert' : 'nocert2'), x.gone ? t(lang, 'gone', { d: fdt(x.gone, lang) }) : t(lang, x.res ? 'res1' : 'res0')].join(' ');
  return '<li class="kfact"><b dir="ltr">' + esc(x.u || x.d) + '</b> ' + esc(t(lang, 'item', { d: '', o: x.o, why: (t(lang, 'why') || {})[x.why] || x.why }).replace(/^\s+/, '')) +
    '<span class="kwa-m">' + esc(meta) + ' <a class="src" href="' + esc(rdapUrl(x.d)) + '" rel="nofollow noopener" target="_blank">RDAP</a> <a class="src" href="' + esc(crtUrl(x.d)) + '" rel="nofollow noopener" target="_blank">crt.sh</a></span></li>';
}
const SHORT = { ofac_sdn: 'OFAC SDN', ofac_cons: 'OFAC non-SDN', uk: 'UK Sanctions List', eu: 'EU consolidated list', un: 'UN Security Council' };
function listsTxt(sa, lang) { return (sa.lists || []).filter(l => l.ok).map(l => l.name + (l.list_date ? ' (' + fdt(l.list_date, lang) + ')' : '')).join('; '); }

// developer page section: lookalikes of its websites and the sanctions screening line
export function watchDevHtml(wd, slug, lang) {
  if (!wd) return '';
  const url = '/developers/' + slug + '/', la = wd.la, sa = wd.sa;
  const doms = (la && la.w && la.w[url]) || [];
  let h = '';
  if (la && doms.length) {
    const L = (wd.byUrl.get(url) || []).slice(0, 6);
    h += '<div class="kwa-la"><h3>' + esc(t(lang, 'la_h')) + '</h3><p class="ki">' + esc(t(lang, 'la_intro', { doms: doms.slice(0, 6).join(', ') })) + '</p>' +
      (L.length ? '<ul class="kwa-l">' + L.map(x => itemHtml(x, lang)).join('') + '</ul>' : '<ul class="fl"><li class="kfact">' + esc(t(lang, 'none', { d: fdt(la.updated, lang) })) + ' <a class="src" href="/watch/lookalikes/">kolaboro.com</a></li></ul>') +
      '<p class="kwa-lk"><a class="more" href="' + pre(lang) + '/watch/lookalikes/">' + esc(t(lang, 'all')) + '</a> <a class="more" href="' + '/tools/payment-email-check/">' + esc(t(lang, 'p_pay')) + '</a></p></div>';
  }
  const ok = sa ? (sa.lists || []).filter(l => l.ok) : [];
  if (sa && wd.clean.has(slug) && ok.length) {
    const links = ok.map(l => '<a class="src" href="' + esc(l.page) + '" rel="noopener" target="_blank">' + esc(SHORT[l.id] || l.id) + (l.list_date ? ' (' + esc(fdt(l.list_date, lang)) + ')' : '') + '</a>').join(', ');
    h += '<div class="kwa-sa"><h3>' + esc(t(lang, 'sa_h')) + '</h3><ul class="fl"><li class="kfact">' + esc(t(lang, 'sa_ok', { d: fdt(sa.updated, lang), lists: '\u0001' })).replace('\u0001', links) + '</li></ul><p class="k-xs">' + esc(t(lang, 'sa_note')) + ' <a href="/data/sanctions.json">sanctions.json</a></p></div>';
  }
  h += warnDevHtml(sa, slug, lang);   // n21a: regulator warning lists of unauthorised firms
  return h ? TB.kbx_watch__s.CSS + h : '';
}

// ------------------------------------------------------------------------------------------------ public feed page
const PG_CSS = '<style id="kwatch-pg">.kwa-pg .k-phead{padding-block:var(--k-7,48px) var(--k-5,24px)}.kwa-pg h1{max-width:24ch}.kwa-pg .lead,.kwa-pg p{max-width:72ch;line-height:1.6}.kwa-pg .kwa-cav{color:var(--k-ink-2,#2F3E4B)}' +
  '.kwa-f{display:flex;flex-wrap:wrap;gap:var(--k-2,8px);align-items:center;margin:var(--k-4,16px) 0}.kwa-f input{flex:1 1 260px;min-height:44px;padding:0 12px;border:1px solid var(--k-field,#9AA5AE);border-radius:var(--k-r-sm,6px);background:var(--k-surface,#fff);color:var(--k-ink,#13222E);font:inherit}' +
  '.kwa-pg td{overflow-wrap:anywhere}.kwa-pg td a{color:var(--k-sea,#155C75)}.kwa-pg .kwa-src{padding-inline-start:20px}.kwa-pg .kwa-src li{margin:0 0 6px}</style>';
/* FILTER_JS: n40 k17, in /data/i18n/k17s.json */
function pageBody(la, lang) {
  const items = (la && la.items) || [], k = new Set(items.map(x => x.o)).size;
  const rows = items.map(x => '<tr><td data-label="' + esc(t(lang, 'th')[0]) + '" dir="ltr"><b>' + esc(x.u || x.d) + '</b></td><td data-label="' + esc(t(lang, 'th')[1]) + '"><span dir="ltr">' + esc(x.o) + '</span>' + (x.dv ? '<br><a href="' + esc(pre(lang) + (x.url || '')) + '">' + esc(x.dv) + '</a>' : '') + '</td><td data-label="' + esc(t(lang, 'th')[2]) + '">' + esc((t(lang, 'why') || {})[x.why] || x.why) + '</td>' +
    '<td data-label="' + esc(t(lang, 'th')[3]) + '"><a href="' + esc(rdapUrl(x.d)) + '" rel="nofollow noopener" target="_blank">' + esc(x.reg ? fdt(x.reg, lang) : t(lang, 'np')) + '</a></td><td data-label="' + esc(t(lang, 'th')[4]) + '"><a href="' + esc(crtUrl(x.d)) + '" rel="nofollow noopener" target="_blank">' + esc(x.cert ? fdt(x.cert, lang) : x.cert_first ? t(lang, 'nf') : '-') + '</a></td><td data-label="' + esc(t(lang, 'th')[5]) + '">' + esc(x.gone ? t(lang, 'gone', { d: fdt(x.gone, lang) }) : t(lang, x.res ? 'yes' : 'no')) + '</td></tr>').join('');
  const table = items.length ? '<div class="kwa-f"><label for="kwa-q">' + esc(t(lang, 'p_filter')) + '</label><input id="kwa-q" type="search" placeholder="' + esc(t(lang, 'p_ph')) + '" autocomplete="off"><span id="kwa-c" class="k-muted" aria-live="polite"></span></div>' +
    TB.kbx_watch__s.k0 + t(lang, 'th').map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div><script>' + TB.kbx_watch__s.FILTER_JS + '</script>'
    : '<div class="k-empty"><strong>' + esc(t(lang, 'p_empty')) + '</strong></div>';
  const srcs = ((la && la.sources) || []).map(s => '<li><a href="' + esc(s.url) + '" rel="noopener" target="_blank">' + esc(s.name) + '</a> <span class="k-muted">(' + esc(s.licence) + ')</span></li>').join('');
  return TB.kbx_watch__s.k1 + pre(lang) + '/">Kolaboro</a></p><h1>' + esc(t(lang, 'p_title')) + '</h1><p class="lead">' + esc(t(lang, 'p_lead')) + '</p><p class="kwa-cav">' + esc(t(lang, 'p_cav')) + '</p>' +
    '<p><a href="' + pre(lang) + '/watch/lookalikes/images/">' + esc(I30(lang, 'ir_t')) + '</a></p>' +   // n30c (item 16): pictures shared by two projects
    (la ? '<p><b>' + esc(t(lang, 'p_count', { n: items.length, k, w: la.watched || 0 })) + '</b> <span class="k-muted">' + esc(t(lang, 'p_upd', { d: fdt(la.updated, lang) })) + '</span></p>' : '') + '</div>' + table + '</div></section>' +
    '<section class="k-sec"><div class="k-wrap"><h2>' + esc(t(lang, 'p_mh')) + '</h2><p>' + esc(t(lang, 'p_m')) + '</p><h3>' + esc(t(lang, 'p_src')) + '</h3><ul class="kwa-src">' + srcs + TB.kbx_watch__s.k2 + '/tools/payment-email-check/">' + esc(t(lang, 'p_pay')) + '</a></p></div></section></div>';
}
export async function page(req, u, env, ctx, shell) {
  const m = u.pathname.match(PAGE_RX); if (!m || !shell) return null;
  if (!m[2]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
  const lang = m[1] || 'en', path = '/watch/lookalikes/', url = ORIGIN + pre(lang) + path;
  const wd = await watchData(env), la = wd.la;
  const sh = await shell(pre(lang) + '/how-we-score/');
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': url + '#page', url, name: t(lang, 'p_title'), description: t(lang, 'p_desc'), inLanguage: lang, dateModified: (la && la.updated) || undefined, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'Dataset', name: t(lang, 'p_title'), description: t(lang, 'p_desc'), url, isAccessibleForFree: true, license: 'https://creativecommons.org/licenses/by/4.0/', dateModified: (la && la.updated) || undefined, creator: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/data/lookalikes.json' }] },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kolaboro', item: ORIGIN + pre(lang) + '/' }, { '@type': 'ListItem', position: 2, name: t(lang, 'p_title'), item: url }] }] };
  const alts = LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + path + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + path + '">';
  const tags = '<title>' + esc(t(lang, 'p_title')) + ' | Kolaboro</title><meta name="description" content="' + esc(t(lang, 'p_desc')) + '"><link rel="canonical" href="' + url + '">' + alts +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="Kolaboro"><meta property="og:title" content="' + esc(t(lang, 'p_title')) + ' | Kolaboro"><meta property="og:description" content="' + esc(t(lang, 'p_desc')) + '"><meta property="og:url" content="' + url + '"><meta name="twitter:card" content="summary">' +
    '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' + PG_CSS;
  const res = new HTMLRewriter()
    .on('html', { element(e) { e.setAttribute('lang', lang); if (lang === 'ar') e.setAttribute('dir', 'rtl'); else e.removeAttribute('dir'); } })
    .on('title', { element(e) { e.remove(); } })
    .on('meta[name="description"],meta[name="robots"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],link[rel="alternate"][hreflang]', { element(e) { e.remove(); } })
    .on('script[type="application/ld+json"]', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(pageBody(la, lang), { html: true }); } })
    .on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + path); } })
    .transform(new Response(sh.body, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
  return new Response(await res.text(), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600' } });
}

// ------------------------------------------------------------------------------------------------ JSON API
export async function handle(req, u, env) {
  const wd = await watchData(env);
  if (u.pathname === '/api/x/watch/sanctions') {
    if (!wd.sa) return out({ error: 'not_built_yet' }, 503);
    const s = u.searchParams.get('dev');
    if (s) return out({ dev: s, screened_no_match: wd.clean.has(s), updated: wd.sa.updated, lists: wd.sa.lists, warnings: wd.sa.warnings ? { screened_no_match: (wd.sa.warnings.no_match || []).includes(s), updated: wd.sa.warnings.updated, lists: wd.sa.warnings.lists } : undefined, note: TB.kbx_watch__s.k3 });
    return out(wd.sa);
  }
  if (!wd.la) return out({ error: 'not_built_yet' }, 503);
  const dev = u.searchParams.get('dev'), d = (u.searchParams.get('d') || '').toLowerCase();
  let items = wd.la.items || [];
  if (dev) items = items.filter(x => x.url === '/developers/' + dev + '/');
  if (d) items = items.filter(x => x.o === d || x.d === d);
  return out(Object.assign({}, wd.la, { w: undefined, n: items.length, items }));
}

// ------------------------------------------------------------------------------------------------ admin CRM tab
export const ADMIN_JS = `/* kolaboro.com/admin: "Screening" tab (n19a, 9 Nov 2026). Possible sanctions-list matches of developer company names, for a person
   to review (never published), and the newest lookalike websites. Review data: the internal risk graph (RPC kolaboro_ops2 'graph', admin key). */
(function () {
  if (window.__kwadm) return; window.__kwadm = 1;
  function $(i) { return document.getElementById(i); }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function table(head, rows) { if (!rows.length) return '<p class="muted" style="margin:6px 0">Nothing to review.</p>'; return '<div class="tw"><table><tr>' + head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr>' + rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div>'; }
  function render(G, L) {
    var S = (G && G.sanctions_review) || null, h = '';
    if (!S) h += '<p class="muted">No screening uploaded yet (daily workflow kolaboro-sanctions.yml).</p>';
    else {
      h += '<p>Screened ' + esc(S.generated_at) + ': ' + S.screened + ' developer names, ' + S.no_match + ' without a possible match (published as "no match"), ' + S.not_screened_person_like + ' not screened (could be a person). Lists: ' + (S.lists || []).map(function (l) { return esc(l.id) + (l.ok ? ' ' + esc(l.list_date || '') + ' (' + l.entities + ' entities)' : ' <b style="color:#B42318">download failed</b>'); }).join(', ') + '.</p>';
      h += '<p class="muted">Possible matches are hidden from the public pages. Check each one against the official entry (programme, address, registration number) before acting; a similar name is not the same company.</p>';
      h += '<h3>Possible matches to review (' + (S.review || []).length + ')</h3>' + table(['Developer', 'Listed name', 'List', 'Score', 'Programme', 'Entry id'], [].concat.apply([], (S.review || []).map(function (r) { return r.hits.map(function (x, i) { return [i ? '' : '<a href="/developers/' + esc(r.slug) + '/" target="_blank" rel="noopener">' + esc(r.developer) + '</a>', esc(x.listed_name), esc(x.list), esc(x.score), esc(x.programme), esc(x.ref)]; }); })));
    }
    if (S && S.warn) {
      h += '<h3>Regulator warning lists: possible matches to review (' + (S.warn_review || []).length + ')</h3><p class="muted">Lists read ' + esc(S.warn.read || '') + ': ' + (S.warn.lists || []).map(function (l) { return esc(l.id) + (l.ok ? ' ' + esc(l.list_date || '') + ' (' + l.entries + ' entries)' : ' <b style="color:#B42318">not read</b>'); }).join(', ') + '. ' + S.warn.no_match + ' developer names without a possible match (published as "no match"). These lists are about unauthorised financial services; many entries are clones that copy the name of a genuine firm. Never published.</p>' +
        table(['Developer', 'Listed name', 'List', 'Score', 'Kind'], [].concat.apply([], (S.warn_review || []).map(function (r) { return r.hits.map(function (x, i) { return [i ? '' : '<a href="/developers/' + esc(r.slug) + '/" target="_blank" rel="noopener">' + esc(r.developer) + '</a>', esc(x.listed_name), esc(x.list), esc(x.score), esc(x.programme)]; }); })));
    }
    var I = (L && L.items) || [];
    h += '<h3>Newest lookalike websites (' + I.length + ' public)</h3>' + table(['Website', 'Resembles', 'How', 'Registered', 'First cert', 'Resolves'], I.slice(0, 40).map(function (x) { return [esc(x.d), esc(x.o) + (x.dv ? ' (' + esc(x.dv) + ')' : ''), esc(x.why), esc(x.reg || '-'), esc(x.cert || '-'), x.res ? 'yes' : 'no']; })) + '<p><a href="/watch/lookalikes/" target="_blank" rel="noopener">Public feed</a></p>';
    $('t-screen-body').innerHTML = h;
  }
  function load() {
    if (!window.KBADM) return; $('t-screen-body').innerHTML = '<p class="muted">Loading…</p>';
    Promise.all([window.KBADM.rpc('kolaboro_ops2', { p_key: window.KBADM.pw(), p_action: 'graph' }), fetch('/data/lookalikes.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })]).then(function (a) {
      if (a[0] && a[0].error) { $('t-screen-body').innerHTML = '<p class="muted">Could not load (' + esc(a[0].error) + ').</p>'; return; } render(a[0], a[1]);
    }).catch(function () { $('t-screen-body').innerHTML = '<p class="muted">Could not load.</p>'; });
  }
  function setup() {
    var nav = document.querySelector('nav.tabs'), main = document.querySelector('main'); if (!nav || !main || !window.KBADM) return false;
    if ($('t-screen')) return true;
    var b = document.createElement('button'); b.setAttribute('data-t', 'screen'); b.textContent = 'Screening';
    var tr = nav.querySelector('[data-t="graph"]'); nav.insertBefore(b, tr ? tr.nextSibling : null);
    var sec = document.createElement('section'); sec.id = 't-screen'; sec.className = 'hide'; sec.innerHTML = '<div id="t-screen-body"></div>'; main.appendChild(sec);
    b.onclick = function () { nav.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); }); main.querySelectorAll(':scope > section').forEach(function (s) { s.classList.toggle('hide', s !== sec); }); load(); };
    nav.querySelectorAll('button').forEach(function (x) { if (x !== b) x.addEventListener('click', function () { b.classList.remove('on'); sec.classList.add('hide'); }); });
    if (location.hash === '#screen') b.click();
    return true;
  }
  var n = 0, iv = setInterval(function () { if (setup() || ++n > 120) clearInterval(iv); }, 500);
})();
`;
