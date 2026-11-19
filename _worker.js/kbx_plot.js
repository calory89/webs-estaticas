// kolaboro.com batch 19 (agent n19d): "Any plot from space" page, /satellite/plot/ in 8 languages (en es de fr nl ru zh ar).
// The page is the existing on-demand satellite tool (batch 9) extended: one clear Sentinel-2 picture per quarter back to 2017, each
// made on demand at the edge by GET /api/x/g/frame (kbx_g.js, same method as the X-ray satellite card in kbx_xray_ev.js), cached
// per point and quarter, rate limited per address; and a time-lapse GIF built in the browser from those real pictures (/k/tlgif.js)
// with a share link that only carries the pin in the URL. Nothing about the person is stored. No AI anywhere in this module.
// Rendered into the localized /how-we-score/ shell like the other worker pages (kbx_fc.js pattern); the static English
// /satellite/plot/index.html stays as the fallback if this module fails.
import { TB } from './kbx_strings.js';   // n32w: string tables loaded as static JSON (worker size limit)
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?satellite\/plot\/?$/;
const V = 'n19d-2';

const T = TB.kbx_plot_T /* n32w (19 Nov 2026): table moved to /data/i18n/kbx_plot.json, filled by kbx_strings.js before any kolaboro.com request is handled */;
const t = (lang, k) => (T[lang] && T[lang][k] != null ? T[lang][k] : T.en[k]);

const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v6M12 16.5v.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
const AR = d => '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CSS = '<style id="kpl19">.pl19 .pl-share{display:grid;gap:10px;justify-items:start;margin-top:16px}.pl19 .pl-share>.k-btn{min-height:44px}.pl19 .pl-gout:empty{display:none}' +
  '.pl19 .st-seg button{min-height:44px}.pl19 .pl-pl .st-ib{min-width:44px;min-height:44px}[dir=rtl] .pl19 #plprev svg,[dir=rtl] .pl19 #plnext svg{transform:scaleX(-1)}' +
  '.pl19 .pl-frame,.pl19 .pl-chart{direction:ltr}.pl19 .st-can ul{padding:0;padding-inline-start:1.1em}</style>';

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
  const alts = LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + path + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + path + '">';
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebApplication', '@id': url + '#app', name: t(lang, 'title'), description: t(lang, 'desc'), url, inLanguage: lang, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any (web browser)', isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }, provider: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kolaboro', item: ORIGIN + pre(lang) + '/' }, { '@type': 'ListItem', position: 2, name: t(lang, 'crumb_sat'), item: ORIGIN + '/satellite/' }, { '@type': 'ListItem', position: 3, name: t(lang, 'crumb'), item: url }] }] };
  const tags = '<title>' + esc(t(lang, 'title')) + ' | Kolaboro</title><meta name="description" content="' + esc(t(lang, 'desc')) + '"><link rel="canonical" href="' + url + '">' + alts +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="Kolaboro"><meta property="og:title" content="' + esc(t(lang, 'title')) + ' | Kolaboro"><meta property="og:description" content="' + esc(t(lang, 'desc')) + '"><meta property="og:url" content="' + url + '"><meta property="og:image" content="' + ORIGIN + '/k/og/pricing.png"><meta name="twitter:card" content="summary_large_image">' +
    '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' +
    '<link rel="stylesheet" href="/satellite/sat.css?v=6ff435225d"><link rel="stylesheet" href="/satellite/plot/vendor/leaflet-1.9.4.css"><link rel="stylesheet" href="/satellite/plot/plot.css?v=a23d55414b">' + CSS;
  const tail = '<script type="application/json" id="kpl-t">' + JSON.stringify(jsStrings(lang)).replace(/</g, '\\u003c') + '</script>' +
    '<script src="/satellite/plot/vendor/leaflet-1.9.4.js" defer></script><script src="/satellite/plot/plot-core.js?v=30c85a4e23" defer></script><script src="/satellite/plot/plot.js?v=' + V + '" defer></script>';
  const res = new HTMLRewriter()
    .on('title', { element(e) { e.remove(); } })
    .on('meta[name="description"],meta[name="robots"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],link[rel="alternate"][hreflang]', { element(e) { e.remove(); } })
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
