// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_plot__q, $s = TB.kbx_plot__s, $t = TB.kbx_plot__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.b, "'": '&#39;' }[c]));
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?satellite\/plot\/?$/;
const V = 'n19d-2';
const T = TB.kbx_plot_T ;
const t = (lang, k) => (T[lang] && T[lang][k] != null ? T[lang][k] : T.en[k]);
const AR = d => $t.k0 + d + $s.k0;
function body(lang) {
  const L = k => esc(t(lang, k)), p = pre(lang);
  const li = a => a.map(x => '<li>' + esc(x) + '</li>').join('');
  return $q.c + p + $q.d + L($q.e) + $q.f + L('crumb') + '</p>' +
    '<h1>' + L('h1') + $q.g + L('lead') + '</p>' +
    $q.h + $q.a + $q.i + L($q.j) + '</b> ' + L('note') + $q.k +
    $q.l + L('h_pin') + $q.m + L($q.n) + '</p>' +
    $q.o + L($q.p) + $q.q + L('ph') + $q.r + L('show') + $q.s +
    $q.t + L('span') + $q.u + L('y3') + $q.v + L('yall') + $q.w +
    $q.x + L($q.y) + $q.z +
    $q.A + L('priv') + $q.B +
    $q.C + L('h_res') + $q.D + L('st0') + $q.E +
    $q.F +
    $q.G + esc(t(lang, 'j').prev) + '">' + AR($q.H) + $q.I + esc(t(lang, 'j').play) + $q.J + esc(t(lang, 'j').next) + '">' + AR($q.K) + $q.L +
    $q.M + L($q.N) + $q.O + L('read0') + $q.P + L('small') + $q.Q + L('ms') + $q.R +
    $q.S + L('h_res') + $q.T +
    $q.U + L($q.V) + $q.m + L($q.W) + '</p>' +
    $q.X + L('gif') + $q.Y + L($q.Z) + $q.aa +
    $q.ab + L('h_how') + $q.ac + L($q.ad) + $q.ae + li(t(lang, 'how1')) + $q.af + L($q.ag) + $q.ae + li(t(lang, 'how2')) + $q.ah +
    $q.ai + L($q.aj) + $q.ak;
}
function jsStrings(lang) {
const o = Object.assign({}, T.en.j, (T[lang] || {}).j || {});
for (const k of [$q.al, 'ready', 'share', 'dl', 'copy', $q.am, 'fail']) o['g_' + k] = t(lang, k);
o.g_note = t(lang, 'gnote'); o.lang = lang; o.locale = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' }[lang] || 'en-GB';
return o;
}
async function assemble(shellRes, lang) {
const path = $q.an, url = ORIGIN + pre(lang) + path;
const alts = LANGS.map(l => $q.ao + l + $q.ap + ORIGIN + pre(l) + path + '">').join('') + $t.k1 + ORIGIN + path + '">';
const ld = { '@context': $q.aq, '@graph': [
{ '@type': $q.ar, '@id': url + '#app', name: t(lang, 'title'), description: t(lang, 'desc'), url, inLanguage: lang, applicationCategory: $q.as, operatingSystem: $q.at, isAccessibleForFree: true,
offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }, provider: { '@type': $q.au, name: $q.av, url: ORIGIN + '/' } },
{ '@type': $q.aw, itemListElement: [{ '@type': $q.ax, position: 1, name: $q.av, item: ORIGIN + pre(lang) + '/' }, { '@type': $q.ax, position: 2, name: t(lang, $q.e), item: ORIGIN + $q.ay }, { '@type': $q.ax, position: 3, name: t(lang, 'crumb'), item: url }] }] };
const tags = $q.az + esc(t(lang, 'title')) + $t.k2 + esc(t(lang, 'desc')) + $q.aA + url + '">' + alts +
$s.k1 + esc(t(lang, 'title')) + $t.k3 + esc(t(lang, 'desc')) + $q.aB + url + $q.aC + ORIGIN + $t.k4 +
$q.aD + JSON.stringify(ld).replace(/</g, $q.aE) + $q.aF +
$s.k2 + $s.CSS;
const tail = $t.k5 + JSON.stringify(jsStrings(lang)).replace(/</g, $q.aE) + $q.aF +
$s.k3 + V + $q.aG;
const res = new HTMLRewriter()
.on('title', { element(e) { e.remove(); } })
.on($s.k4, { element(e) { e.remove(); } })
.on($q.aH, { element(e) { e.remove(); } })
.on('head', { element(e) { e.append(tags, { html: true }); } })
.on('main', { element(e) { e.setInnerContent(body(lang) + tail, { html: true }); } })
.on($q.aI, { element(e) { const l = e.getAttribute($q.aJ); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + path); } })
.transform(new Response(shellRes.body, { headers: { 'content-type': $q.aK } }));
return await res.text();
}
export async function handle(req, u, env, ctx, shell) {
const m = u.pathname.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?satellite\/plot(\/?)$/); if (!m || !shell) return null;
if (!m[2]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': $q.aL } });
const lang = m[1] || 'en';
try {
const sh = await shell(pre(lang) + $q.aM);
if (!sh || sh.status !== 200) return null;
return new Response(await assemble(sh, lang), { status: 200, headers: { 'content-type': $q.aK, 'cache-control': $q.aN } });
} catch (e) { return null; }
}
export { T as PLOT_T };
