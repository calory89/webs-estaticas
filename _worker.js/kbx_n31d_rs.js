// comments: _notes/kolaboro-worker-comments.txt
import { TB } from './kbx_strings.js';
const $q = TB.kbx_n31d_rs__q;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
const RX = /^Latest registered home sales listed on the page \((\d+), ([^)]*?) to ([^)]*?)\): (AED) ([\d,]+) to AED ([\d,]+)/;
const MEMO = new WeakMap();
const num = s => +String(s).replace(/,/g, '');
export function regSale(x) {
if (!x || !x.fx) return null;
if (MEMO.has(x)) return MEMO.get(x);
const fx = x.fx, pm = +fx.price_min, px = fx.price_max == null ? null : +fx.price_max;
let r = null;
if (pm > 0) for (const c of (x.cl || []).map(c => [c[0], c[3]]).concat((x.dl || []).map(t => [t, null]))) {
const m = RX.exec(String(c[0] || '')); if (!m) continue;
const a = num(m[5]), b = num(m[6]);
if (a === pm && (px == null ? b <= pm : px === b)) { r = { n: +m[1], d1: m[2], d2: m[3], cur: m[4], a, b, src: c[1] || x.du || x.url || null }; break; }
}
MEMO.set(x, r); return r;
}
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const nf = (v, l) => { try { return Number(v).toLocaleString(LOC[l] || 'en-GB'); } catch (e) { return String(v); } };
const dt = (s, l) => { const t = Date.parse(String(s) + $q.a); if (!isFinite(t)) return s; try { return new Date(t).toLocaleDateString(LOC[l] || 'en-GB', { day: $q.b, month: 'short', year: $q.b, timeZone: 'UTC' }); } catch (e) { return s; } };
const T = {
en: { r: 'Registered sales from {a} to {b} (DLD, {d})', r1: 'Registered sale of {a} (DLD, {d})', k: 'Registered sales (DLD)', np: 'Asking price: not published in the pages we read.' },
es: { r: 'Ventas registradas de {a} a {b} (DLD, {d})', r1: 'Venta registrada de {a} (DLD, {d})', k: 'Ventas registradas (DLD)', np: 'Precio de venta del promotor: no publicado en las páginas que leímos.' },
fr: { r: 'Ventes enregistrées de {a} à {b} (DLD, {d})', r1: 'Vente enregistrée de {a} (DLD, {d})', k: 'Ventes enregistrées (DLD)', np: 'Prix demandé : non publié dans les pages lues.' },
de: { r: 'Registrierte Verkäufe von {a} bis {b} (DLD, {d})', r1: 'Registrierter Verkauf zu {a} (DLD, {d})', k: 'Registrierte Verkäufe (DLD)', np: 'Angebotspreis: auf den gelesenen Seiten nicht veröffentlicht.' },
nl: { r: 'Geregistreerde verkopen van {a} tot {b} (DLD, {d})', r1: 'Geregistreerde verkoop van {a} (DLD, {d})', k: 'Geregistreerde verkopen (DLD)', np: 'Vraagprijs: niet gepubliceerd op de gelezen pagina’s.' },
ru: { r: 'Зарегистрированные сделки от {a} до {b} (DLD, {d})', r1: 'Зарегистрированная сделка на {a} (DLD, {d})', k: 'Зарегистрированные сделки (DLD)', np: 'Цена продажи застройщика: не опубликована на прочитанных страницах.' },
zh: { r: '登记成交价 {a} 至 {b}（DLD，{d}）', r1: '登记成交价 {a}（DLD，{d}）', k: '登记成交价（DLD）', np: '开发商报价：我们读到的页面未公布。' },
ar: { r: 'مبيعات مسجّلة من {a} إلى {b} (DLD، {d})', r1: 'بيع مسجّل بقيمة {a} (DLD، {d})', k: 'مبيعات مسجّلة (DLD)', np: 'السعر المطلوب: غير منشور في الصفحات التي قرأناها.' }
};
const tt = (l, k) => (T[l] || T.en)[k];
export function rsText(lang, r) {
const m = v => r.cur + ' ' + nf(v, lang), d = r.d1 && r.d1 !== r.d2 ? dt(r.d1, lang) + ' - ' + dt(r.d2, lang) : dt(r.d2, lang);
return (r.a === r.b ? tt(lang, 'r1') : tt(lang, 'r')).replace('{a}', m(r.a)).replace('{b}', m(r.b)).replace('{d}', d);
}
export const rsNoAsk = lang => tt(lang, 'np');
