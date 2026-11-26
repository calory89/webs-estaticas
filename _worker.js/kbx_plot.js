// comments: _notes/kolaboro-worker-comments.txt
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?satellite\/plot\/?$/;
const V = 'n19d-2';
const T = TB.kbx_plot_T ;
const t = (lang, k) => (T[lang] && T[lang][k] != null ? T[lang][k] : T.en[k]);
const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v6M12 16.5v.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
const AR = d => TB.kbx_plot__t.k0 + d + TB.kbx_plot__s.k0;
function body(lang) {
  const L = k => esc(t(lang, k)), p = pre(lang);
  const li = a => a.map(x => '<li>' + esc(x) + '</li>').join('');
  return '<div class="pl19"><section class="st-hero"><div class="wrap"><p class="crumb"><a href="' + p + '/">Kolaboro</a> / <a href="/satellite/">' + L('crumb_sat') + '</a> / ' + L('crumb') + '</p>' +
    '<h1>' + L('h1') + '</h1><p class="lead">' + L('lead') + '</p>' +
    '<p class="st-note">' + ICON + '<span><b>' + L('note_b') + '</b> ' + L('note') + '</span></p></div></section>' +
    '<section class="st-sec" aria-labelledby="h-pin"><div class="wrap"><h2 id="h-pin">' + L('h_pin') + '</h2><p class="lead">' + L('pin_lead') + '</p>' +
    '<div class="pl-ctl"><form class="pl-q" id="plform"><label for="plin" class="sr-only">' + L('in_label') + '</label><input id="plin" type="text" inputmode="text" autocomplete="off" dir="ltr" placeholder="' + L('ph') + '"><button class="btn btn-hi btn-sm" type="submit">' + L('show') + '</button></form>' +
    '<div class="st-seg" id="plyears" role="group" aria-label="' + L('span') + '"><button type="button" data-y="3" aria-pressed="false">' + L('y3') + '</button><button type="button" data-y="all" aria-pressed="true">' + L('yall') + '</button></div></div>' +
    '<p class="pl-try" id="pltry"></p><div class="pl-map" id="plmap" role="application" aria-label="' + L('map_aria') + '" dir="ltr"></div><p class="pl-err" id="plerr" role="alert" hidden></p>' +
    '<p class="pl-priv">Map &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors (ODbL). ' + L('priv') + '</p></div></section>' +
    '<section class="st-sec" id="result" aria-labelledby="h-res"><div class="wrap"><h2 id="h-res">' + L('h_res') + '</h2><p class="pl-status" id="plstatus" aria-live="polite">' + L('st0') + '</p><div class="pl-bar" aria-hidden="true"><i id="plbar"></i></div>' +
    '<div class="pl-v" id="plv" hidden><div><div class="pl-frame"><canvas id="plbig" width="128" height="128" aria-label=""></canvas><i class="pl-x" aria-hidden="true"></i><span class="pl-cap" id="plcap"></span><span class="pl-scale" aria-hidden="true"><i></i>200 m</span></div>' +
    '<div class="pl-pl"><button type="button" class="st-ib" id="plprev" aria-label="' + esc(t(lang, 'j').prev) + '">' + AR('M12.5 4 6.5 10l6 6') + '</button><button type="button" class="st-ib play" id="plplay" aria-label="' + esc(t(lang, 'j').play) + '" aria-pressed="false"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4l10 6-10 6z" fill="currentColor"/></svg></button><button type="button" class="st-ib" id="plnext" aria-label="' + esc(t(lang, 'j').next) + '">' + AR('M7.5 4l6 6-6 6') + '</button><span id="plsel" class="pl-sel"></span></div></div>' +
    '<div class="pl-side"><h3>' + L('at_pin') + '</h3><p class="pl-read" id="plread">' + L('read0') + '</p><div id="plchart" class="pl-chart"></div><p class="pl-small">' + L('small') + '</p><p><a class="btn btn-line btn-sm" id="plms" href="/milestones/">' + L('ms') + '</a></p></div></div>' +
    '<ol class="pl-grid" id="plgrid" aria-label="' + L('h_res') + '"></ol><p class="pl-small" id="plsrc"></p></div></section>' +
    '<section class="st-sec" aria-labelledby="h-share"><div class="wrap"><h2 id="h-share">' + L('h_share') + '</h2><p class="lead">' + L('share_lead') + '</p>' +
    '<div class="pl-share"><button type="button" class="k-btn k-btn--sm" id="plgif" disabled>' + L('gif') + '</button><p class="pl-small" id="plgifn">' + L('gif_need') + '</p><div class="pl-gout" id="plgout"></div></div></div></section>' +
    '<section class="st-sec" aria-labelledby="h-how"><div class="wrap"><h2 id="h-how">' + L('h_how') + '</h2><div class="st-can"><div><h3>' + L('how1_h') + '</h3><ul>' + li(t(lang, 'how1')) + '</ul></div><div><h3>' + L('how2_h') + '</h3><ul>' + li(t(lang, 'how2')) + '</ul></div></div>' +
    '<p class="pl-small">' + L('credit') + ' <a href="/api/x/g/frame?lat=-8.638&amp;lng=115.115&amp;q=2024-Q2" dir="ltr">/api/x/g/frame</a>. <a href="https://earth-search.aws.element84.com/v1" rel="noopener">Element84 Earth Search</a>. <a href="https://sentinels.copernicus.eu/documents/247904/690755/Sentinel_Data_Legal_Notice" rel="noopener">Copernicus Sentinel data legal notice</a>.</p></div></section></div>';
}
function jsStrings(lang) {
const o = Object.assign({}, T.en.j, (T[lang] || {}).j || {});
for (const k of ['making', 'ready', 'share', 'dl', 'copy', 'copied', 'fail']) o['g_' + k] = t(lang, k);
o.g_note = t(lang, 'gnote'); o.lang = lang; o.locale = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' }[lang] || 'en-GB';
return o;
}
async function assemble(shellRes, lang) {
const path = '/satellite/plot/', url = ORIGIN + pre(lang) + path;
const alts = LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + path + '">').join('') + TB.kbx_plot__t.k1 + ORIGIN + path + '">';
const ld = { '@context': 'https://schema.org', '@graph': [
{ '@type': 'WebApplication', '@id': url + '#app', name: t(lang, 'title'), description: t(lang, 'desc'), url, inLanguage: lang, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any (web browser)', isAccessibleForFree: true,
offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }, provider: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' } },
{ '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kolaboro', item: ORIGIN + pre(lang) + '/' }, { '@type': 'ListItem', position: 2, name: t(lang, 'crumb_sat'), item: ORIGIN + '/satellite/' }, { '@type': 'ListItem', position: 3, name: t(lang, 'crumb'), item: url }] }] };
const tags = '<title>' + esc(t(lang, 'title')) + TB.kbx_plot__t.k2 + esc(t(lang, 'desc')) + '"><link rel="canonical" href="' + url + '">' + alts +
TB.kbx_plot__s.k1 + esc(t(lang, 'title')) + TB.kbx_plot__t.k3 + esc(t(lang, 'desc')) + '"><meta property="og:url" content="' + url + '"><meta property="og:image" content="' + ORIGIN + TB.kbx_plot__t.k4 +
'<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' +
TB.kbx_plot__s.k2 + TB.kbx_plot__s.CSS;
const tail = TB.kbx_plot__t.k5 + JSON.stringify(jsStrings(lang)).replace(/</g, '\\u003c') + '</script>' +
TB.kbx_plot__s.k3 + V + '" defer></script>';
const res = new HTMLRewriter()
.on('title', { element(e) { e.remove(); } })
.on(TB.kbx_plot__s.k4, { element(e) { e.remove(); } })
.on('script[type="application/ld+json"]', { element(e) { e.remove(); } })
.on('head', { element(e) { e.append(tags, { html: true }); } })
.on('main', { element(e) { e.setInnerContent(body(lang) + tail, { html: true }); } })
.on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + path); } })
.transform(new Response(shellRes.body, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
return await res.text();
}
export async function handle(req, u, env, ctx, shell) {
const m = u.pathname.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?satellite\/plot(\/?)$/); if (!m || !shell) return null;
if (!m[2]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
const lang = m[1] || 'en';
try {
const sh = await shell(pre(lang) + '/how-we-score/');
if (!sh || sh.status !== 200) return null;
return new Response(await assemble(sh, lang), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600' } });
} catch (e) { return null; }
}
export { T as PLOT_T };
