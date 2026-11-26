// comments: _notes/kolaboro-worker-comments.txt
import { e29t } from './kbx_e29_i18n.js';
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const REVIEWED = '2026-11-14';
export const NEXT = '2027-02-14';
export const METHOD = { v: '1.0', d: '2026-11-12', next: '2027-02-12' };
export const ACC = 'Ignacio Hojas García-Plaza';
export const FOUNDERS = [['Carlos de Ory', 'r_ceo'], ['Ignacio Hojas García-Plaza', 'r_co']];
const MAIL = ['hello@kolaboro.com', 'press@kolaboro.com'];
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bdi = s => '<bdi>' + esc(s) + '</bdi>';
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, a) => v && v[a] != null ? v[a] : m);
const t = (lang, k) => e29t(lang, k);
const te = (lang, k, v) => fill(esc(t(lang, k)), v);
const tx = (lang, k, v) => fill(t(lang, k), v);
const nf = (lang, n) => Number(n).toLocaleString(LOC[lang] || 'en-GB');
const fdt = (iso, lang) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); if (!m) return String(iso || ''); try { return new Intl.DateTimeFormat(LOC[lang] || 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))); } catch (e) { return iso.slice(0, 10); } };
const tm = (iso, lang) => '<time datetime="' + esc(String(iso).slice(0, 10)) + '">' + esc(fdt(iso, lang)) + '</time>';
const ul = L => '<ul>' + L.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
const ol = L => '<ol>' + L.map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>';
export const dots = h => String(h).replace(/(\.)(<\/time>)?\.(?!\.)/g, (m, a, b) => a + (b || ''));
export const reviewLine = (lang, d, n) => '<p class="k-small k-muted">' + dots(fill(esc(t(lang, 'rev')), { d: tm(d || REVIEWED, lang), n: tm(n || NEXT, lang) })) + '</p>';
export const accLine = lang => '<p class="k-small k-muted">' + fill(esc(t(lang, 'acc')), { p: '<a href="' + pre(lang) + '/team/#who">' + bdi(ACC) + '</a>' }) + '</p>';
export const errLine = lang => '<p class="k-small">' + esc(t(lang, 'err_q')) + ' <a href="' + pre(lang) + '/corrections/">' + esc(t(lang, 'err_l')) + '</a></p>';
export const methodLine = lang => ' <span class="k-e29mv">' + dots(fill(esc(t(lang, 'mv')), { v: METHOD.v, d: tm(METHOD.d, lang), n: tm(METHOD.next, lang) })) + ' <a href="' + pre(lang) + '/editorial-policy/#review">' + esc(t(lang, 'l_ep')) + '</a> · <a href="' + pre(lang) + '/corrections/">' + esc(t(lang, 'l_corr')) + '</a></span>';
export function guideNext(lang, reviewed) {
const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(reviewed || ''); if (!m) return '';
const d = new Date(Date.UTC(+m[1], +m[2] - 1 + 3, +m[3])).toISOString().slice(0, 10);
return ' ' + dots(fill(esc(t(lang, 'mv_g')), { n: tm(d, lang) })) + ' <a href="' + pre(lang) + '/editorial-policy/">' + esc(t(lang, 'l_ep')) + '</a>';
}
export function aboutBox(lang) {
const row = (k, v) => '<div><dt>' + esc(t(lang, k)) + '</dt><dd>' + v + '</dd></div>';
return TB.kbx_e29_lines__t.k0 + esc(t(lang, 'ab_h')) + '</h2><dl class="k-e29dl">' +
row('ab_name', 'Kolaboro · <a href="' + ORIGIN + '/">kolaboro.com</a>') + row('ab_op', esc(t(lang, 'ab_op_v'))) +
row('ab_fd', FOUNDERS.map(([n, r]) => bdi(n) + ' (' + esc(t(lang, r)) + ')').join('; ')) +
row('ab_ct', MAIL.map(a => '<a href="mailto:' + a + '"><bdi>' + a + '</bdi></a>').join(' · ') + ' · <a href="' + pre(lang) + '/contact/">' + esc(t(lang, 'l_contact')) + '</a>') +
row('ab_pg', [['/editorial-policy/', 'l_ep'], ['/how-we-work/', 'l_hw'], ['/team/', 'l_team'], ['/corrections/', 'l_corr']].map(([h, k]) => '<a href="' + pre(lang) + h + '">' + esc(t(lang, k)) + '</a>').join(' · ') + ' · <a href="/independence/">' + esc(t(lang, 'l_ind')) + '</a>') +
'</dl></div></section>';
}
export const ABOUT_CSS = '<style id="k-e29dl-css">.k-e29dl{display:grid;gap:10px;margin:12px 0 0}.k-e29dl>div{display:grid;grid-template-columns:minmax(110px,180px) 1fr;gap:12px;padding:10px 0;border-bottom:1px solid var(--k-line,#ddd)}.k-e29dl dt{font-weight:600}.k-e29dl dd{margin:0;overflow-wrap:anywhere}@media (max-width:560px){.k-e29dl>div{grid-template-columns:1fr;gap:2px}}</style>';
