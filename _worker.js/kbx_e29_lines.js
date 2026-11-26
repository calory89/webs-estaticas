// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_e29_lines__q, $t = TB.kbx_e29_lines__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
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
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.a, "'": '&#39;' }[c]));
const bdi = s => '<bdi>' + esc(s) + $q.b;
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, a) => v && v[a] != null ? v[a] : m);
const t = (lang, k) => e29t(lang, k);
const fdt = (iso, lang) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); if (!m) return String(iso || ''); try { return new Intl.DateTimeFormat(LOC[lang] || 'en-GB', { day: $q.c, month: 'long', year: $q.c, timeZone: 'UTC' }).format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))); } catch (e) { return iso.slice(0, 10); } };
const tm = (iso, lang) => $q.d + esc(String(iso).slice(0, 10)) + '">' + esc(fdt(iso, lang)) + $q.e;
export const dots = h => String(h).replace(/(\.)(<\/time>)?\.(?!\.)/g, (m, a, b) => a + (b || ''));
export const reviewLine = (lang, d, n) => $q.f + dots(fill(esc(t(lang, 'rev')), { d: tm(d || REVIEWED, lang), n: tm(n || NEXT, lang) })) + '</p>';
export const accLine = lang => $q.f + fill(esc(t(lang, 'acc')), { p: $q.g + pre(lang) + $q.h + bdi(ACC) + '</a>' }) + '</p>';
export const errLine = lang => $q.i + esc(t(lang, 'err_q')) + $q.j + pre(lang) + $q.k + esc(t(lang, 'err_l')) + $q.l;
export const methodLine = lang => $q.m + dots(fill(esc(t(lang, 'mv')), { v: METHOD.v, d: tm(METHOD.d, lang), n: tm(METHOD.next, lang) })) + $q.j + pre(lang) + $q.n + esc(t(lang, 'l_ep')) + $q.o + pre(lang) + $q.k + esc(t(lang, $q.p)) + $q.q;
export function guideNext(lang, reviewed) {
const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(reviewed || ''); if (!m) return '';
const d = new Date(Date.UTC(+m[1], +m[2] - 1 + 3, +m[3])).toISOString().slice(0, 10);
return ' ' + dots(fill(esc(t(lang, 'mv_g')), { n: tm(d, lang) })) + $q.j + pre(lang) + $q.r + esc(t(lang, 'l_ep')) + '</a>';
}
export function aboutBox(lang) {
const row = (k, v) => $q.s + esc(t(lang, k)) + $q.t + v + $q.u;
return $t.k0 + esc(t(lang, 'ab_h')) + $q.v +
row($q.w, $q.x + ORIGIN + $q.y) + row('ab_op', esc(t(lang, $q.z))) +
row('ab_fd', FOUNDERS.map(([n, r]) => bdi(n) + ' (' + esc(t(lang, r)) + ')').join('; ')) +
row('ab_ct', MAIL.map(a => $q.A + a + $q.B + a + $q.C).join(' · ') + $q.D + pre(lang) + $q.E + esc(t(lang, $q.F)) + '</a>') +
row('ab_pg', [[$q.G, 'l_ep'], [$q.H, 'l_hw'], [$q.I, $q.J], [$q.K, $q.p]].map(([h, k]) => $q.g + pre(lang) + h + '">' + esc(t(lang, k)) + '</a>').join(' · ') + $q.L + esc(t(lang, 'l_ind')) + '</a>') +
$q.M;
}
export const ABOUT_CSS = '<style id="k-e29dl-css">.k-e29dl{display:grid;gap:10px;margin:12px 0 0}.k-e29dl>div{display:grid;grid-template-columns:minmax(110px,180px) 1fr;gap:12px;padding:10px 0;border-bottom:1px solid var(--k-line,#ddd)}.k-e29dl dt{font-weight:600}.k-e29dl dd{margin:0;overflow-wrap:anywhere}@media (max-width:560px){.k-e29dl>div{grid-template-columns:1fr;gap:2px}}</style>';
