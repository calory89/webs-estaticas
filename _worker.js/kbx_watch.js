// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_watch__q, $s = TB.kbx_watch__s, $t = TB.kbx_watch__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { TB } from './kbx_strings.js';
import { LOCALE } from './kbx_named_i18n.js';
import { warnDevHtml } from './kbx_gaz.js';
import { t as I30 } from './kbx_n30c_named.js';
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
export const PATHS = /^\/api\/x\/watch\/(?:lookalikes|sanctions)$/;
export const PAGE_RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?watch\/lookalikes(\/?)$/;
const H = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' };
const out = (o, st) => new Response(JSON.stringify(o), { status: st || 200, headers: Object.assign({ 'cache-control': $q.b }, H) });
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.c, "'": '&#39;' }[c]));
const pre = l => l === 'en' ? '' : '/' + l;
const dtf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'd' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.DateTimeFormat(L, o)); };
function fdt(d, lang) { try { return dtf(LOCALE[lang] || 'en-GB', { day: $q.d, month: 'short', year: $q.d, timeZone: 'UTC' }).format(new Date(d + $q.e)); } catch (e) { return d; } }
let MEMO = null;
async function loadOne(env, name) {
let r = null;
try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + $q.f + name)); } catch (e) { r = null; }
if (!r || !r.ok) { try { r = await fetch(ORIGIN + $q.g + name + '?v=1', { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
return r && r.ok ? await r.json().catch(() => null) : null;
}
export async function watchData(env) {
if (MEMO && Date.now() - MEMO.t < 600000) return MEMO.v;
const [la, sa, gz] = await Promise.all([loadOne(env, $q.h), loadOne(env, $q.i), loadOne(env, $q.j)]);
const byUrl = new Map();
for (const x of ((la && la.items) || [])) { if (!byUrl.has(x.url)) byUrl.set(x.url, []); byUrl.get(x.url).push(x); }
const v = { la, sa, gz, byUrl, clean: new Set((sa && sa.no_match) || []) };
MEMO = { t: Date.now(), v }; return v;
}
const S = TB.kbx_watch_S ;
const t = (lang, k, v) => { const s = (S[lang] && S[lang][k] != null ? S[lang][k] : S.en[k]); return typeof s === $q.k && v ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
export const watchHeading = lang => t(lang, 'h');
const rdapUrl = d => $t.k0 + encodeURIComponent(d);
const crtUrl = d => $q.l + encodeURIComponent(d);
function itemHtml(x, lang) {
const meta = [x.reg ? t(lang, 'reg', { d: fdt(x.reg, lang) }) : t(lang, 'noreg'), x.cert ? t(lang, x.cert_first ? 'cert' : 'cert2', { d: fdt(x.cert, lang) }) : t(lang, x.cert_first ? $q.m : $q.n), x.gone ? t(lang, 'gone', { d: fdt(x.gone, lang) }) : t(lang, x.res ? 'res1' : 'res0')].join(' ');
return $q.o + esc(x.u || x.d) + '</b> ' + esc(t(lang, 'item', { d: '', o: x.o, why: (t(lang, 'why') || {})[x.why] || x.why }).replace(/^\s+/, '')) +
$q.p + esc(meta) + $q.q + esc(rdapUrl(x.d)) + $t.k1 + esc(crtUrl(x.d)) + $t.k2;
}
const SHORT = { ofac_sdn: 'OFAC SDN', ofac_cons: 'OFAC non-SDN', uk: 'UK Sanctions List', eu: 'EU consolidated list', un: 'UN Security Council' };
export function watchDevHtml(wd, slug, lang) {
if (!wd) return '';
const url = $q.r + slug + '/', la = wd.la, sa = wd.sa;
const doms = (la && la.w && la.w[url]) || [];
let h = '';
if (la && doms.length) {
const L = (wd.byUrl.get(url) || []).slice(0, 6);
h += $q.s + esc(t(lang, 'la_h')) + $q.t + esc(t(lang, $q.u, { doms: doms.slice(0, 6).join(', ') })) + '</p>' +
(L.length ? $q.v + L.map(x => itemHtml(x, lang)).join('') + '</ul>' : $q.w + esc(t(lang, 'none', { d: fdt(la.updated, lang) })) + $t.k3) +
$t.k4 + pre(lang) + $q.x + esc(t(lang, 'all')) + $q.y + $q.z + esc(t(lang, 'p_pay')) + $q.A;
}
const ok = sa ? (sa.lists || []).filter(l => l.ok) : [];
if (sa && wd.clean.has(slug) && ok.length) {
const links = ok.map(l => $q.B + esc(l.page) + $q.C + esc(SHORT[l.id] || l.id) + (l.list_date ? ' (' + esc(fdt(l.list_date, lang)) + ')' : '') + '</a>').join(', ');
h += $q.D + esc(t(lang, 'sa_h')) + $t.k5 + esc(t(lang, 'sa_ok', { d: fdt(sa.updated, lang), lists: $q.E })).replace($q.E, links) + $q.F + esc(t(lang, $q.G)) + $t.k6;
}
h += warnDevHtml(sa, slug, lang);
return h ? $s.CSS + h : '';
}
function pageBody(la, lang) {
const items = (la && la.items) || [], k = new Set(items.map(x => x.o)).size;
const rows = items.map(x => $q.H + esc(t(lang, 'th')[0]) + $q.I + esc(x.u || x.d) + $q.J + esc(t(lang, 'th')[1]) + $q.K + esc(x.o) + $q.L + (x.dv ? $q.M + esc(pre(lang) + (x.url || '')) + '">' + esc(x.dv) + '</a>' : '') + $q.N + esc(t(lang, 'th')[2]) + '">' + esc((t(lang, 'why') || {})[x.why] || x.why) + '</td>' +
$q.O + esc(t(lang, 'th')[3]) + $q.P + esc(rdapUrl(x.d)) + $t.k7 + esc(x.reg ? fdt(x.reg, lang) : t(lang, 'np')) + $q.Q + esc(t(lang, 'th')[4]) + $q.P + esc(crtUrl(x.d)) + $t.k8 + esc(x.cert ? fdt(x.cert, lang) : x.cert_first ? t(lang, 'nf') : '-') + $q.Q + esc(t(lang, 'th')[5]) + '">' + esc(x.gone ? t(lang, 'gone', { d: fdt(x.gone, lang) }) : t(lang, x.res ? 'yes' : 'no')) + $q.R).join('');
const table = items.length ? $t.k9 + esc(t(lang, $q.S)) + $t.k10 + esc(t(lang, 'p_ph')) + $t.k11 +
$s.k0 + t(lang, 'th').map(h => $q.T + esc(h) + '</th>').join('') + $q.U + rows + $q.V + $s.FILTER_JS + $q.W
: $q.X + esc(t(lang, $q.Y)) + $q.Z;
const srcs = ((la && la.sources) || []).map(s => $q.aa + esc(s.url) + $q.C + esc(s.name) + $q.ab + esc(s.licence) + $q.ac).join('');
return $s.k1 + pre(lang) + $q.ad + esc(t(lang, $q.ae)) + $q.af + esc(t(lang, $q.ag)) + $q.ah + esc(t(lang, 'p_cav')) + '</p>' +
$q.ai + pre(lang) + $q.aj + esc(I30(lang, 'ir_t')) + $q.ak +
(la ? $q.al + esc(t(lang, $q.am, { n: items.length, k, w: la.watched || 0 })) + $q.an + esc(t(lang, 'p_upd', { d: fdt(la.updated, lang) })) + $q.ao : '') + $q.ap + table + $q.aq +
$t.k12 + esc(t(lang, 'p_mh')) + $q.ar + esc(t(lang, 'p_m')) + $q.as + esc(t(lang, 'p_src')) + $q.at + srcs + $s.k2 + $q.z + esc(t(lang, 'p_pay')) + $q.au;
}
export async function page(req, u, env, ctx, shell) {
  const m = u.pathname.match(PAGE_RX); if (!m || !shell) return null;
  if (!m[2]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': $q.av } });
  const lang = m[1] || 'en', path = $q.aw, url = ORIGIN + pre(lang) + path;
  const wd = await watchData(env), la = wd.la;
  const sh = await shell(pre(lang) + $q.ax);
  const ld = { '@context': $q.ay, '@graph': [
    { '@type': $q.az, '@id': url + '#page', url, name: t(lang, $q.ae), description: t(lang, $q.aA), inLanguage: lang, dateModified: (la && la.updated) || undefined, isPartOf: { '@type': $q.aB, name: $q.aC, url: ORIGIN + '/' } },
    { '@type': $q.aD, name: t(lang, $q.ae), description: t(lang, $q.aA), url, isAccessibleForFree: true, license: $q.aE, dateModified: (la && la.updated) || undefined, creator: { '@type': $q.aF, name: $q.aC, url: ORIGIN + '/' }, distribution: [{ '@type': $q.aG, encodingFormat: $q.aH, contentUrl: ORIGIN + $q.aI }] },
    { '@type': $q.aJ, itemListElement: [{ '@type': $q.aK, position: 1, name: $q.aC, item: ORIGIN + pre(lang) + '/' }, { '@type': $q.aK, position: 2, name: t(lang, $q.ae), item: url }] }] };
  const alts = LANGS.map(l => $q.aL + l + $q.aM + ORIGIN + pre(l) + path + '">').join('') + $q.aN + ORIGIN + path + '">';
  const tags = $q.aO + esc(t(lang, $q.ae)) + $q.aP + esc(t(lang, $q.aA)) + $q.aQ + url + '">' + alts +
    $q.aR + esc(t(lang, $q.ae)) + $q.aS + esc(t(lang, $q.aA)) + $q.aT + url + $q.aU +
    $q.aV + JSON.stringify(ld).replace(/</g, $q.aW) + $q.W + $q.a;
  const res = new HTMLRewriter()
    .on('html', { element(e) { e.setAttribute('lang', lang); if (lang === 'ar') e.setAttribute('dir', 'rtl'); else e.removeAttribute('dir'); } })
    .on('title', { element(e) { e.remove(); } })
    .on($q.aX, { element(e) { e.remove(); } })
    .on($q.aY, { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(pageBody(la, lang), { html: true }); } })
    .on($q.aZ, { element(e) { const l = e.getAttribute($q.ba); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + path); } })
    .transform(new Response(sh.body, { headers: { 'content-type': $q.bb } }));
  return new Response(await res.text(), { status: 200, headers: { 'content-type': $q.bb, 'cache-control': $q.bc } });
}
export async function handle(req, u, env) {
const wd = await watchData(env);
if (u.pathname === $q.bd) {
if (!wd.sa) return out({ error: $q.be }, 503);
const s = u.searchParams.get('dev');
if (s) return out({ dev: s, screened_no_match: wd.clean.has(s), updated: wd.sa.updated, lists: wd.sa.lists, warnings: wd.sa.warnings ? { screened_no_match: (wd.sa.warnings.no_match || []).includes(s), updated: wd.sa.warnings.updated, lists: wd.sa.warnings.lists } : undefined, note: $s.k3 });
return out(wd.sa);
}
if (!wd.la) return out({ error: $q.be }, 503);
const dev = u.searchParams.get('dev'), d = (u.searchParams.get('d') || '').toLowerCase();
let items = wd.la.items || [];
if (dev) items = items.filter(x => x.url === $q.r + dev + '/');
if (d) items = items.filter(x => x.o === d || x.d === d);
return out(Object.assign({}, wd.la, { w: undefined, n: items.length, items }));
}
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
