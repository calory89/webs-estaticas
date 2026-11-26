// comments: _notes/kolaboro-worker-comments.txt
import { PLACES29, PL29 } from './kbx_buy_c29.js';
export const BUY_LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
export const BUY_PLACES = [
{ s: 'bali', tr: 'bali', cc: 'ID', c: 'Indonesia', m: ['Bali'] },
{ s: 'dubai', tr: 'dubai', cc: 'AE', c: 'UAE', m: ['Dubai'] },
{ s: 'phuket', tr: 'phuket', cc: 'TH', c: 'Thailand', m: ['Phuket'] },
{ s: 'costa-del-sol', tr: null, cc: 'ES', c: 'Spain', m: ['Costa del Sol'] },
{ s: 'lisbon', tr: 'lisbon', cc: 'PT', c: 'Portugal', m: ['Lisbon', 'Portugal'], a: /(^|, )Lisbon$/i, am: ['Portugal'] },
{ s: 'cyprus', tr: 'cyprus', cc: 'CY', c: 'Cyprus', m: ['Cyprus'] },
{ s: 'miami', tr: 'miami', cc: 'US', c: 'USA', m: ['Miami'] },
{ s: 'tulum', tr: 'tulum', cc: 'MX', c: 'Mexico', m: ['Riviera Maya'], a: /Tulum/i }
];
BUY_PLACES.push(...PLACES29);
export function buyPlaceOf(mk, ar, co) {
for (const P of BUY_PLACES) {
if (P.co) { if (co && P.co.includes(co)) return P; continue; }
if (!P.m.includes(mk)) continue;
if (P.a && (!P.am || P.am.includes(mk)) && !P.a.test(String(ar || ''))) continue;
return P;
}
return null;
}
export const PL = {
bali: { n: { en: 'Bali', es: 'Bali', fr: 'Bali', de: 'Bali', nl: 'Bali', ru: 'Бали', zh: '巴厘岛', ar: 'بالي' }, in: { en: 'in Bali', es: 'en Bali', fr: 'à Bali', de: 'auf Bali', nl: 'op Bali', ru: 'на Бали', zh: '在巴厘岛', ar: 'في بالي' } },
dubai: { n: { en: 'Dubai', es: 'Dubái', fr: 'Dubaï', de: 'Dubai', nl: 'Dubai', ru: 'Дубай', zh: '迪拜', ar: 'دبي' }, in: { en: 'in Dubai', es: 'en Dubái', fr: 'à Dubaï', de: 'in Dubai', nl: 'in Dubai', ru: 'в Дубае', zh: '在迪拜', ar: 'في دبي' } },
phuket: { n: { en: 'Phuket', es: 'Phuket', fr: 'Phuket', de: 'Phuket', nl: 'Phuket', ru: 'Пхукет', zh: '普吉岛', ar: 'بوكيت' }, in: { en: 'in Phuket', es: 'en Phuket', fr: 'à Phuket', de: 'auf Phuket', nl: 'op Phuket', ru: 'на Пхукете', zh: '在普吉岛', ar: 'في بوكيت' } },
'costa-del-sol': { n: { en: 'Costa del Sol', es: 'Costa del Sol', fr: 'Costa del Sol', de: 'Costa del Sol', nl: 'Costa del Sol', ru: 'Коста-дель-Соль', zh: '太阳海岸', ar: 'كوستا ديل سول' }, in: { en: 'on the Costa del Sol', es: 'en la Costa del Sol', fr: 'sur la Costa del Sol', de: 'an der Costa del Sol', nl: 'aan de Costa del Sol', ru: 'на Коста-дель-Соль', zh: '在太阳海岸', ar: 'في كوستا ديل سول' } },
lisbon: { n: { en: 'Lisbon', es: 'Lisboa', fr: 'Lisbonne', de: 'Lissabon', nl: 'Lissabon', ru: 'Лиссабон', zh: '里斯本', ar: 'لشبونة' }, in: { en: 'in Lisbon', es: 'en Lisboa', fr: 'à Lisbonne', de: 'in Lissabon', nl: 'in Lissabon', ru: 'в Лиссабоне', zh: '在里斯本', ar: 'في لشبونة' } },
cyprus: { n: { en: 'Cyprus', es: 'Chipre', fr: 'Chypre', de: 'Zypern', nl: 'Cyprus', ru: 'Кипр', zh: '塞浦路斯', ar: 'قبرص' }, in: { en: 'in Cyprus', es: 'en Chipre', fr: 'à Chypre', de: 'auf Zypern', nl: 'op Cyprus', ru: 'на Кипре', zh: '在塞浦路斯', ar: 'في قبرص' } },
miami: { n: { en: 'Miami', es: 'Miami', fr: 'Miami', de: 'Miami', nl: 'Miami', ru: 'Майами', zh: '迈阿密', ar: 'ميامي' }, in: { en: 'in Miami', es: 'en Miami', fr: 'à Miami', de: 'in Miami', nl: 'in Miami', ru: 'в Майами', zh: '在迈阿密', ar: 'في ميامي' } },
tulum: { n: { en: 'Tulum', es: 'Tulum', fr: 'Tulum', de: 'Tulum', nl: 'Tulum', ru: 'Тулум', zh: '图卢姆', ar: 'تولوم' }, in: { en: 'in Tulum', es: 'en Tulum', fr: 'à Tulum', de: 'in Tulum', nl: 'in Tulum', ru: 'в Тулуме', zh: '在图卢姆', ar: 'في تولوم' } }
};
export const BS = {};
export function guideLink(mk, ar, lang, co) {
const P = buyPlaceOf(mk, ar, co); if (!P) return null;
const b = BS[lang] || BS.en, loc = PL[P.s].in[lang] || PL[P.s].in.en;
return { href: (lang === 'en' ? '' : '/' + lang) + '/guides/buying-off-plan/' + P.s + '/', text: String(b.guide_link || BS.en.guide_link).replace('{in}', loc) };
}
Object.assign(PL, PL29);
