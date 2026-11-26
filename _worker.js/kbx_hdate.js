import { TB } from './kbx_strings.js';
// comments: _notes/kolaboro-worker-comments.txt
const MON = {
jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
janeiro: 1, fevereiro: 2, 'março': 3, marco: 3, maio: 5, junho: 6, julho: 7, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
janvier: 1, 'février': 2, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7, 'août': 8, aout: 8, septembre: 9, octobre: 10, novembre: 11, 'décembre': 12, decembre: 12,
januar: 1, februar: 2, 'märz': 3, maerz: 3, juni: 6, juli: 7, oktober: 10, dezember: 12,
januari: 1, februari: 2, maart: 3, mei: 5, augustus: 8, gennaio: 1, febbraio: 2, aprile: 4, maggio: 5, giugno: 6, luglio: 7, settembre: 9, ottobre: 10, dicembre: 12
};
const SEASON = { spring: 'sp', summer: 'su', fall: 'au', autumn: 'au', winter: 'wi', primavera: 'sp', verano: 'su', 'otoño': 'au', invierno: 'wi', printemps: 'sp', 'été': 'su', automne: 'au', hiver: 'wi', 'frühling': 'sp', 'frühjahr': 'sp', sommer: 'su', herbst: 'au', voorjaar: 'sp', zomer: 'su', najaar: 'au' };
const W = '[A-Za-zÀ-ÿçñäöüßéèêûôâîœ.]+';
const Y = '((?:19|20)\\d\\d)(?![\\d])';
const RX = [
[new RegExp('^' + Y + '-Q([1-4])\\b', 'i'), m => ({ y: +m[1], q: +m[2] })],
[new RegExp('^' + Y + '-H([12])\\b', 'i'), m => ({ y: +m[1], h: +m[2] })],
[new RegExp('^' + Y + '-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])\\b'), m => ({ y: +m[1], m: +m[2], d: +m[3] })],
[new RegExp('^' + Y + '-(0[1-9]|1[0-2])(?![\\d-])'), m => ({ y: +m[1], m: +m[2] })],
[new RegExp('^(?:Q|T)([1-4])\\s*[/ .-]?\\s*' + Y, 'i'), m => ({ y: +m[2], q: +m[1] })],
[new RegExp('^([1-4])\\s*(?:Q|T)\\s*[/ .-]?\\s*' + Y, 'i'), m => ({ y: +m[2], q: +m[1] })],
[new RegExp('^H([12])\\s*[/ .-]?\\s*' + Y, 'i'), m => ({ y: +m[2], h: +m[1] })],
[new RegExp('^([12])H\\s*[/ .-]?\\s*' + Y, 'i'), m => ({ y: +m[2], h: +m[1] })],
[new RegExp('^' + Y + '\\s*[/ -]\\s*H([12])\\b', 'i'), m => ({ y: +m[1], h: +m[2] })],
[new RegExp('^' + Y + '\\s*[/ -]\\s*Q([1-4])\\b', 'i'), m => ({ y: +m[1], q: +m[2] })],
[new RegExp('^(first|second|last|primer|segundo|1er|1º|2º|1°|2°|1st|2nd|1\\.|2\\.)\\s+(?:half|semester|semestre|halbjahr)(?:\\s+(?:of|de|del))?\\s+' + Y, 'i'),
m => { const w = m[1].toLowerCase(), o = /^(first|primer|1)/.test(w) ? 1 : 2; return { y: +m[2], h: o }; }],
[new RegExp('^(first|second|third|fourth|primer|segundo|tercer|cuarto|1er|1st|2nd|3rd|4th|[1-4]º|[1-4]°|[1-4]\\.)\\s+(?:quarter|trimestre|quartal)(?:\\s+(?:of|de|del))?\\s+' + Y, 'i'),
m => { const w = m[1].toLowerCase().replace(/[º°.]|st|nd|rd|th|er/g, ''); const o = { first: 1, primer: 1, second: 2, segundo: 2, third: 3, tercer: 3, fourth: 4, cuarto: 4 }[w] || +w; return o >= 1 && o <= 4 ? { y: +m[2], q: o } : null; }],
[new RegExp('^(early|beginning|start|mid|middle|late|end|principios|inicios|comienzos|mediados|finales|fines|d[ée]but|fin|anfang|mitte|ende|begin|medio|eind)(?:\\s*-\\s*|\\s+(?:of\\s+|de\\s+|del\\s+)?)' + Y, 'i'),
m => ({ y: +m[2], p: TB.kbx_hdate__t.o_PART[m[1].toLowerCase()] || TB.kbx_hdate__t.o_PART[m[1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')] })],
[new RegExp('^mi-' + Y, 'i'), m => ({ y: +m[1], p: 'm' })],
[new RegExp('^' + Y + '\\s+(mid|end)-?year\\b', 'i'), m => ({ y: +m[1], p: m[2].toLowerCase() === 'mid' ? 'm' : 'e' })],
[new RegExp('^(' + Object.keys(SEASON).join('|') + ')(?:\\s+(?:of|de|del))?\\s+' + Y, 'i'), m => ({ y: +m[2], s: SEASON[m[1].toLowerCase()] })],
[new RegExp('^(\\d{1,2})\\s+(' + W + ')\\s+(?:de\\s+)?' + Y, 'i'), m => { const k = mon(m[2]); return k ? { y: +m[3], m: k, d: +m[1] } : null; }],
[new RegExp('^(' + W + ')\\s+(\\d{1,2}),?\\s+' + Y, 'i'), m => { const k = mon(m[1]); return k ? { y: +m[3], m: k, d: +m[2] } : null; }],
[new RegExp('^(' + W + ')\\s+(?:de\\s+|del\\s+)?' + Y, 'i'), m => { const k = mon(m[1]); return k ? { y: +m[2], m: k } : null; }],
[new RegExp('^' + Y + '\\s*年\\s*(1[0-2]|[1-9])\\s*月'), m => ({ y: +m[1], m: +m[2] })],
[new RegExp('^(0?[1-9]|1[0-2])\\s*/\\s*' + Y + '(?!\\s*/)'), m => ({ y: +m[2], m: +m[1] })],
[new RegExp('^' + Y + '(?:\\s*年)?(?![./:]\\d|-\\d{1,2}(?!\\d))'), m => ({ y: +m[1] })]
];
function mon(w) { const k = String(w || '').toLowerCase().replace(/\.$/, ''); return MON[k] || null; }
function head(t) {
  for (const [rx, f] of RX) { const m = rx.exec(t); if (m) { const v = f(m); if (v && v.y >= 1990 && v.y <= 2060) return { v, len: m[0].length }; } }
  return null;
}
const CACHE = new Map();
export function hparse(s) {
if (s == null) return null;
const raw = String(s).trim();
if (!raw) return null;
if (CACHE.has(raw)) return CACHE.get(raw);
let t = raw, c = false, ph = 0;
const th = /^(.*?)[,;]?\s+then\s+(.+)$/i.exec(t);
if (th && head(th[2].trim())) t = th[2].trim();
let mm = /^(?:about|around|approx(?:imately|\.)?|ca\.|circa|hacia|vers|etwa|rond)\s+/i.exec(t);
if (mm) { c = true; t = t.slice(mm[0].length); }
mm = /^phase\s+(?:1|i|one)\b[:,]?\s*(?:in\s+)?/i.exec(t);
if (mm) { ph = 1; t = t.slice(mm[0].length); }
const a = head(t);
let out = null;
if (a) {
let rest = t.slice(a.len), b = null;
const rg = /^\s*(?:-|–|\bto\b|\bal\b|\bà\b|\bbis\b|\bto\s+the\b)\s*/i.exec(rest);
if (rg) { const z = head(rest.slice(rg[0].length)); if (z && z.v.y >= a.v.y && (z.v.y > a.v.y || JSON.stringify(z.v) !== JSON.stringify(a.v))) { b = z.v; rest = rest.slice(rg[0].length + z.len); } }
const note = rest.trim().replace(/^[,;:]\s*/, '');
out = { a: a.v, b, c, ph, note };
}
if (CACHE.size > 4000) CACHE.clear();
CACHE.set(raw, out);
return out;
}
const L10N = {
en: { q: (n, y) => 'Q' + n + ' ' + y, h: (n, y) => (n === 1 ? 'first' : 'second') + ' half of ' + y, p: { b: y => 'early ' + y, m: y => 'mid-' + y, l: y => 'late ' + y, e: y => 'end of ' + y }, s: { sp: 'spring', su: 'summer', au: 'autumn', wi: 'winter' }, sy: (s, y) => s + ' ' + y, c: x => 'about ' + x, ph: x => 'phase 1: ' + x },
es: { q: (n, y) => n + '.º trimestre de ' + y, h: (n, y) => (n === 1 ? 'primer' : 'segundo') + ' semestre de ' + y, p: { b: y => 'principios de ' + y, m: y => 'mediados de ' + y, l: y => 'finales de ' + y, e: y => 'finales de ' + y }, s: { sp: 'primavera', su: 'verano', au: 'otoño', wi: 'invierno' }, sy: (s, y) => s + ' de ' + y, c: x => 'hacia ' + x, ph: x => 'fase 1: ' + x },
fr: { q: (n, y) => (n === 1 ? '1er' : n + 'e') + ' trimestre ' + y, h: (n, y) => (n === 1 ? '1er' : '2d') + ' semestre ' + y, p: { b: y => 'début ' + y, m: y => 'mi-' + y, l: y => 'fin ' + y, e: y => 'fin ' + y }, s: { sp: 'printemps', su: 'été', au: 'automne', wi: 'hiver' }, sy: (s, y) => s + ' ' + y, c: x => 'vers ' + x, ph: x => 'phase 1 : ' + x },
de: { q: (n, y) => n + '. Quartal ' + y, h: (n, y) => n + '. Halbjahr ' + y, p: { b: y => 'Anfang ' + y, m: y => 'Mitte ' + y, l: y => 'Ende ' + y, e: y => 'Ende ' + y }, s: { sp: 'Frühjahr', su: 'Sommer', au: 'Herbst', wi: 'Winter' }, sy: (s, y) => s + ' ' + y, c: x => 'etwa ' + x, ph: x => '1. Bauabschnitt: ' + x },
nl: { q: (n, y) => (n === 1 ? '1e' : n + 'e') + ' kwartaal ' + y, h: (n, y) => (n === 1 ? 'eerste' : 'tweede') + ' helft van ' + y, p: { b: y => 'begin ' + y, m: y => 'medio ' + y, l: y => 'eind ' + y, e: y => 'eind ' + y }, s: { sp: 'voorjaar', su: 'zomer', au: 'najaar', wi: 'winter' }, sy: (s, y) => s + ' ' + y, c: x => 'rond ' + x, ph: x => 'fase 1: ' + x },
ru: { q: (n, y) => ['I', 'II', 'III', 'IV'][n - 1] + ' квартал ' + y + ' г.', h: (n, y) => (n === 1 ? 'I' : 'II') + ' полугодие ' + y + ' г.', p: { b: y => 'начало ' + y + ' г.', m: y => 'середина ' + y + ' г.', l: y => 'конец ' + y + ' г.', e: y => 'конец ' + y + ' г.' }, s: { sp: 'весна', su: 'лето', au: 'осень', wi: 'зима' }, sy: (s, y) => s + ' ' + y + ' г.', c: x => 'около ' + x, ph: x => '1-я очередь: ' + x },
zh: { q: (n, y) => y + '年第' + '一二三四'[n - 1] + '季度', h: (n, y) => y + '年' + (n === 1 ? '上' : '下') + '半年', p: { b: y => y + '年初', m: y => y + '年年中', l: y => y + '年底', e: y => y + '年底' }, s: { sp: '春季', su: '夏季', au: '秋季', wi: '冬季' }, sy: (s, y) => y + '年' + s, c: x => '约' + x, ph: x => '一期：' + x },
ar: { q: (n, y) => 'الربع ' + ['الأول', 'الثاني', 'الثالث', 'الرابع'][n - 1] + ' من ' + y, h: (n, y) => 'النصف ' + (n === 1 ? 'الأول' : 'الثاني') + ' من ' + y, p: { b: y => 'أوائل ' + y, m: y => 'منتصف ' + y, l: y => 'أواخر ' + y, e: y => 'نهاية ' + y }, s: { sp: 'ربيع', su: 'صيف', au: 'خريف', wi: 'شتاء' }, sy: (s, y) => s + ' ' + y, c: x => 'نحو ' + x, ph: x => 'المرحلة الأولى: ' + x }
};
const LOCALE = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const fmtC = new Map();
const dtf = (L, o) => { const k = L + JSON.stringify(o); let f = fmtC.get(k); if (!f) { f = new Intl.DateTimeFormat(L, Object.assign({ timeZone: 'UTC' }, o)); fmtC.set(k, f); } return f; };
function one(v, lang) {
  const W8 = L10N[lang] || L10N.en, L = LOCALE[lang] || 'en-GB';
  try {
    if (v.d) return dtf(L, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(Date.UTC(v.y, v.m - 1, v.d)));
    if (v.m) return dtf(L, { month: 'long', year: 'numeric' }).format(new Date(Date.UTC(v.y, v.m - 1, 1)));
  } catch (e) { return String(v.y); }
  if (v.q) return W8.q(v.q, v.y);
  if (v.h) return W8.h(v.h, v.y);
  if (v.p) return W8.p[v.p](v.y);
  if (v.s) return W8.sy(W8.s[v.s], v.y);
  return String(v.y);   // a bare year stays a number in every language (it also reads right inside "2027年" style sentences)
}
export function hshow(P, lang) {
let x = one(P.a, lang);
if (P.b) {
if (!P.a.q && !P.a.h && !P.a.p && !P.a.s && !P.a.m && !P.b.q && !P.b.h && !P.b.p && !P.b.s && !P.b.m) {
try { x = dtf(LOCALE[lang] || 'en-GB', { year: 'numeric' }).formatRange(new Date(Date.UTC(P.a.y, 0, 1)), new Date(Date.UTC(P.b.y, 0, 1))); } catch (e) { x = P.a.y + '–' + P.b.y; }
} else x = x + ' – ' + one(P.b, lang);
}
const W8 = L10N[lang] || L10N.en;
if (P.c) x = W8.c(x);
if (P.ph) x = W8.ph(x);
return x;
}
export function hfmt(s, lang) {
const P = hparse(s);
return P ? hshow(P, lang) : (s == null ? '' : String(s));
}
export function hdisp(s, lang) {
if (s == null) return '';
const P = hparse(s);
return P && (!P.note || /^[(;,/]|^(or|for|then)\b/i.test(P.note)) ? hshow(P, lang) : String(s);
}
export function hcode(s) {
const P = hparse(s); if (!P || P.c || P.ph || (P.note && !/^[(;,/]|^(or|for|then)\b/i.test(P.note))) return null;
const v = P.a, p2 = n => String(n).padStart(2, '0');
return v.d ? v.y + '-' + p2(v.m) + '-' + p2(v.d) : v.m ? v.y + '-' + p2(v.m) : v.q ? v.y + '-Q' + v.q : v.h ? v.y + '-H' + v.h : v.p || v.s ? null : String(v.y);
}
const CANON = /^(?:19|20)\d\d(?:-(?:Q[1-4]|H[12]|\d{2}(?:-\d{2})?))?$/i;
export function hnote(s) {
if (s == null) return false;
const raw = String(s).trim();
return !!raw && !CANON.test(raw);
}
export function hyear(s) { const P = hparse(s); return P ? P.a.y : null; }
export function hkey(s) {
const P = hparse(s); if (!P) return null; const v = P.b || P.a;
const m = v.m || (v.q ? v.q * 3 : v.h ? v.h * 6 : v.p ? { b: 3, m: 6, l: 10, e: 12 }[v.p] : v.s ? { sp: 5, su: 8, au: 11, wi: 12 }[v.s] : 12);
return v.y + '-' + String(m).padStart(2, '0');
}
const CO2 = { UAE: 'AE', 'United Arab Emirates': 'AE', Indonesia: 'ID', Thailand: 'TH', Spain: 'ES', Mexico: 'MX', USA: 'US', 'United States': 'US', Malaysia: 'MY', Turkey: 'TR', 'Türkiye': 'TR',
Portugal: 'PT', Australia: 'AU', 'United Kingdom': 'GB', UK: 'GB', France: 'FR', Japan: 'JP', Philippines: 'PH', Vietnam: 'VN', 'Sri Lanka': 'LK', Egypt: 'EG', Greece: 'GR', Georgia: 'GE',
Oman: 'OM', Cyprus: 'CY', 'Dominican Republic': 'DO', Canada: 'CA', Brazil: 'BR', Mauritius: 'MU', Colombia: 'CO', Morocco: 'MA', Kenya: 'KE', 'Costa Rica': 'CR', Panama: 'PA',
Montenegro: 'ME', India: 'IN', Poland: 'PL', Cambodia: 'KH', 'Saudi Arabia': 'SA', Germany: 'DE', Ghana: 'GH', Croatia: 'HR', Bahrain: 'BH', Qatar: 'QA', 'South Africa': 'ZA',
'Cape Verde': 'CV', Bahamas: 'BS', Bulgaria: 'BG', Tanzania: 'TZ', 'New Zealand': 'NZ', Argentina: 'AR', Malta: 'MT', Italy: 'IT', Namibia: 'NA', 'Cayman Islands': 'KY', Nigeria: 'NG',
Belize: 'BZ', Rwanda: 'RW', Serbia: 'RS', Albania: 'AL', Fiji: 'FJ', Ireland: 'IE', Barbados: 'BB', Ecuador: 'EC', 'South Korea': 'KR', Azerbaijan: 'AZ', Armenia: 'AM', Hungary: 'HU',
Latvia: 'LV', Estonia: 'EE', Paraguay: 'PY', Grenada: 'GD', Seychelles: 'SC', 'Antigua and Barbuda': 'AG', Maldives: 'MV', Jamaica: 'JM', Mozambique: 'MZ', Romania: 'RO', Czechia: 'CZ',
Peru: 'PE', 'Turks and Caicos Islands': 'TC', Uruguay: 'UY', 'Puerto Rico': 'PR', 'Puerto Rico (USA)': 'PR', 'St Kitts and Nevis': 'KN', Laos: 'LA', Singapore: 'SG', Jordan: 'JO', Chile: 'CL',
Senegal: 'SN', 'St Lucia': 'LC', 'Saint Lucia': 'LC', 'El Salvador': 'SV', Nicaragua: 'NI', Curacao: 'CW', 'Curaçao': 'CW', Aruba: 'AW', Vanuatu: 'VU', Taiwan: 'TW', Kazakhstan: 'KZ',
Netherlands: 'NL', Switzerland: 'CH', Austria: 'AT', Belgium: 'BE', Kosovo: 'XK', 'North Macedonia': 'MK', Bosnia: 'BA', Uganda: 'UG', Zanzibar: 'TZ', Tunisia: 'TN', Lebanon: 'LB', Kuwait: 'KW' };
const NCY = { es: 'Chipre del Norte', fr: 'Chypre du Nord', de: 'Nordzypern', nl: 'Noord-Cyprus', ru: 'Северный Кипр', zh: '北塞浦路斯', ar: 'شمال قبرص' };
const SHORT = { ru: { USA: 'США', 'United States': 'США' }, zh: { UAE: '阿联酋' }, ar: { UAE: 'الإمارات' } };
const dnC = new Map();
export function coName(co, lang) {
if (!co || !lang || lang === 'en') return co || '';
if (co === 'Northern Cyprus') return NCY[lang] || co;
const sh = SHORT[lang] && SHORT[lang][co]; if (sh) return sh;
const iso = CO2[co]; if (!iso) return co;
try { let f = dnC.get(lang); if (!f) { f = new Intl.DisplayNames([LOCALE[lang] || lang], { type: 'region', fallback: 'none' }); dnC.set(lang, f); } return f.of(iso) || co; } catch (e) { return co; }
}
export const CO_ISO2 = CO2;
const PLN_RAW = {
'Dubai': 'Dubái|Dubaï|||Дубай|迪拜|دبي', 'Bali': '||||Бали|巴厘岛|بالي', 'Phuket': '||||Пхукет|普吉岛|بوكيت', 'Miami': '||||Майами|迈阿密|ميامي',
'Costa del Sol': '||||Коста-дель-Соль|太阳海岸|كوستا ديل سول', 'Ras Al Khaimah': 'Ras al Jaima|Ras el Khaïmah|Ras al-Chaima|Ras al-Khaimah|Рас-эль-Хайма|哈伊马角|رأس الخيمة',
'Lombok': '||||Ломбок|龙目岛|لومبوك', 'Riviera Maya': '||||Ривьера-Майя|玛雅里维埃拉|ريفييرا مايا', 'Abu Dhabi': 'Abu Dabi|Abou Dabi|||Абу-Даби|阿布扎比|أبوظبي',
'Istanbul': 'Estambul||||Стамбул|伊斯坦布尔|إسطنبول', 'Pattaya': '||||Паттайя|芭提雅|باتايا', 'Los Cabos': '||||Лос-Кабос|洛斯卡沃斯|لوس كابوس',
'Kuala Lumpur': '||||Куала-Лумпур|吉隆坡|كوالالمبور', 'Zanzibar': 'Zanzíbar||Sansibar||Занзибар|桑给巴尔|زنجبار', 'Costa Blanca': '||||Коста-Бланка|白色海岸|كوستا بلانكا',
'Koh Samui': '||||Самуи|苏梅岛|كوه ساموي', 'Puerto Vallarta': '||||Пуэрто-Вальярта|巴亚尔塔港|بويرتو فالارتا', 'Gold Coast': '||||Голд-Кост|黄金海岸|غولد كوست',
'French Riviera': 'Costa Azul||||Лазурный Берег|蔚蓝海岸|الريفييرا الفرنسية', 'French Alps': 'Alpes franceses||||Французские Альпы|法国阿尔卑斯山|جبال الألب الفرنسية',
'Bangkok': '||||Бангкок|曼谷|بانكوك', 'Warsaw': 'Varsovia|Varsovie|Warschau|Warschau|Варшава|华沙|وارسو', 'Algarve': '||||Алгарве|阿尔加维|',
'Ho Chi Minh City': 'Ciudad Ho Chi Minh|Hô-Chi-Minh-Ville|Ho-Chi-Minh-Stadt|Ho Chi Minhstad|Хошимин|胡志明市|مدينة هو تشي منه', 'Nairobi': '||||Найроби|内罗毕|نيروبي',
'London': 'Londres|Londres||Londen|Лондон|伦敦|لندن', 'Sharjah': '|Charjah|Schardscha||Шарджа|沙迦|الشارقة', 'Punta Cana': '||||Пунта-Кана|蓬塔卡纳|بونتا كانا',
'Lisbon': 'Lisboa|Lisbonne|Lissabon|Lissabon|Лиссабон|里斯本|لشبونة', 'Mérida': '||||Мерида|梅里达|ميريدا', 'Antalya': '||||Анталья|安塔利亚|أنطاليا',
'Sydney': 'Sídney||||Сидней|悉尼|سيدني', 'Balearics': 'Baleares||||Балеарские острова|巴利阿里群岛|جزر البليار', 'Panama City': 'Ciudad de Panamá||Panama-Stadt|Panama-Stad|Панама|巴拿马城|مدينة بنما',
'Marrakech': '||Marrakesch|Marrakesh|Марракеш|马拉喀什|مراكش', 'Accra': 'Acra||||Аккра|阿克拉|أكرا', 'Vancouver': '||||Ванкувер|温哥华|فانكوفر',
'Cape Town': 'Ciudad del Cabo|Le Cap|Kapstadt|Kaapstad|Кейптаун|开普敦|كيب تاون', 'Manchester': '||||Манчестер|曼彻斯特|مانشستر', 'Toronto': '||||Торонто|多伦多|تورونتو',
'Medellín': '||||Медельин|麦德林|ميديلين', 'Hua Hin': '||||Хуахин|华欣|هوا هين', 'Goa': '||||Гоа|果阿|غوا', 'Ajman': 'Ajmán||Adschman||Аджман|阿治曼|عجمان',
'Canary Islands': 'Canarias||||Канарские острова|加那利群岛|جزر الكناري', 'Tokyo': 'Tokio||Tokio|Tokio|Токио|东京|طوكيو', 'Lagos': '||||Лагос|拉各斯|لاغوس',
'Bodrum': '||||Бодрум|博德鲁姆|بودروم', 'Mexico City': 'Ciudad de México|Mexico|Mexiko-Stadt|Mexico-Stad|Мехико|墨西哥城|مدينة مكسيكو', 'Madeira': '|Madère|||Мадейра|马德拉|ماديرا',
'Hawaii': 'Hawái|Hawaï||Hawaï|Гавайи|夏威夷|هاواي', 'Liverpool': '||||Ливерпуль|利物浦|ليفربول', 'New York': 'Nueva York||||Нью-Йорк|纽约|نيويورك', 'Perth': '||||Перт|珀斯|بيرث',
'Kigali': '||||Кигали|基加利|كيغالي', 'Berlin': 'Berlín|||Berlijn|Берлин|柏林|برلين', 'Krabi': '||||Краби|甲米|كرابي', 'Chiang Mai': '||||Чиангмай|清迈|شيانغ ماي',
'Labuan Bajo': '||||Лабуан-Баджо||لابوان باجو', 'Austin': '||||Остин|奥斯汀|أوستن', 'Niseko': '||||Нисеко|二世古|نيسيكو', 'Birmingham': '||||Бирмингем|伯明翰|برمنغهام',
'Umm Al Quwain': 'Umm al Qaywayn|Oumm al Qaïwaïn|Umm al-Qaiwain|Umm al-Qaiwain|Умм-эль-Кайвайн|乌姆盖万|أم القيوين', 'Brisbane': '||||Брисбен|布里斯班|بريزبن',
'Dublin': 'Dublín||||Дублин|都柏林|دبلن', 'Izmir': 'Esmirna||||Измир|伊兹密尔|إزمير', 'Mumbai': 'Bombay|Bombay|||Мумбаи|孟买|مومباي', 'Seoul': 'Seúl|Séoul||Seoel|Сеул|首尔|سول',
'Baku': 'Bakú|Bakou||Bakoe|Баку|巴库|باكو', 'Yerevan': 'Ereván|Erevan|Eriwan|Jerevan|Ереван|埃里温|يريفان', 'Belgrade': 'Belgrado||Belgrad|Belgrado|Белград|贝尔格莱德|بلغراد',
'Budapest': '|||Boedapest|Будапешт|布达佩斯|بودابست', 'Riga': '||||Рига|里加|ريغا', 'Tallinn': '||||Таллин|塔林|تالين',
'Al Marjan Island': 'Isla Al Marjan|Île Al Marjan|Insel Al Marjan|Al Marjan-eiland|остров Аль-Марджан|马尔詹岛|جزيرة المرجان', 'Dubai Islands': 'Islas de Dubái|Îles de Dubaï||||迪拜群岛|جزر دبي',
'Mallorca': '|Majorque|||Майорка|马略卡岛|مايوركا', 'Saadiyat Island': 'Isla de Saadiyat|Île de Saadiyat|Insel Saadiyat|Saadiyat-eiland|остров Саадият|萨迪亚特岛|جزيرة السعديات',
'Tenerife': '||Teneriffa||Тенерифе|特内里费岛|تينيريفي', 'Hokkaido': '||||Хоккайдо|北海道|هوكايدو', 'Penang': '||||Пенанг|槟城|بينانغ', 'Okinawa': '||||Окинава|冲绳|أوكيناوا',
'Manhattan': '||||Манхэттен|曼哈顿|مانهاتن', 'Tulum': '||||Тулум|图卢姆|تولوم', 'Muscat': 'Mascate|Mascate|Maskat||Маскат|马斯喀特|مسقط', 'Athens': 'Atenas|Athènes|Athen|Athene|Афины|雅典|أثينا',
'Colombo': '||||Коломбо|科伦坡|كولومبو', 'Limassol': 'Limasol||||Лимасол|利马索尔|ليماسول', 'Metro Manila': 'Gran Manila|Grand Manille|||Большая Манила|马尼拉大都会|مانيلا الكبرى',
'Phnom Penh': 'Nom Pen|||Phnom-Penh|Пномпень|金边|بنوم بنه', 'Batumi': '||||Батуми|巴统|باتومي', 'Grand Cayman': 'Gran Caimán|Grand Caïman|||Большой Кайман|大开曼岛|جزيرة كايمان الكبرى',
'Oahu': '||||Оаху|瓦胡岛|أواهو', 'Honolulu': '||||Гонолулу|檀香山|هونولولو', 'Yucatán': '||Yucatán||Юкатан|尤卡坦|يوكاتان', 'Unguja': '||||Унгуджа|温古贾岛|أنغوجا'
};
const PLL = ['es', 'fr', 'de', 'nl', 'ru', 'zh', 'ar'], PLN = {};
for (const [k, v] of Object.entries(PLN_RAW)) { const a = v.split('|'); PLN[k] = {}; PLL.forEach((l, i) => { if (a[i]) PLN[k][l] = a[i]; }); }
export const mkName = (mk, lang) => {
if (!mk || !lang || lang === 'en') return mk || '';
const n = PLN[mk] && PLN[mk][lang]; if (n) return n;
if (CO2[mk] || mk === 'Northern Cyprus') return coName(mk, lang);
const m = /^(.+?) \((.+)\)$/.exec(mk); if (m && (PLN[m[2]] || CO2[m[2]])) return mkName(m[1], lang) + ' (' + mkName(m[2], lang) + ')';
return mk;
};
export const placeName = (p, lang) => !p || lang === 'en' ? (p || '') : String(p).split(', ').map(t => mkName(t, lang)).join(', ');
const RU_F = { 'Дубай': ['в Дубае', 'Дубая'], 'Бали': ['на Бали', 'Бали'], 'Пхукет': ['на Пхукете', 'Пхукета'], 'Майами': ['в Майами', 'Майами'], 'Коста-дель-Соль': ['на Коста-дель-Соль', 'Коста-дель-Соль'],
'Рас-эль-Хайма': ['в Рас-эль-Хайме', 'Рас-эль-Хаймы'], 'Ломбок': ['на Ломбоке', 'Ломбока'], 'Ривьера-Майя': ['на Ривьере-Майя', 'Ривьеры-Майя'], 'Абу-Даби': ['в Абу-Даби', 'Абу-Даби'],
'Стамбул': ['в Стамбуле', 'Стамбула'], 'Паттайя': ['в Паттайе', 'Паттайи'], 'Лос-Кабос': ['в Лос-Кабосе', 'Лос-Кабоса'], 'Куала-Лумпур': ['в Куала-Лумпуре', 'Куала-Лумпура'],
'Занзибар': ['на Занзибаре', 'Занзибара'], 'Коста-Бланка': ['на Коста-Бланке', 'Коста-Бланки'], 'Самуи': ['на Самуи', 'Самуи'], 'Пуэрто-Вальярта': ['в Пуэрто-Вальярте', 'Пуэрто-Вальярты'],
'Голд-Кост': ['на Голд-Косте', 'Голд-Коста'], 'Лазурный Берег': ['на Лазурном Берегу', 'Лазурного Берега'], 'Французские Альпы': ['во Французских Альпах', 'Французских Альп'],
'Бангкок': ['в Бангкоке', 'Бангкока'], 'Варшава': ['в Варшаве', 'Варшавы'], 'Алгарве': ['в Алгарве', 'Алгарве'], 'Хошимин': ['в Хошимине', 'Хошимина'], 'Найроби': ['в Найроби', 'Найроби'],
'Лондон': ['в Лондоне', 'Лондона'], 'Шарджа': ['в Шардже', 'Шарджи'], 'Пунта-Кана': ['в Пунта-Кане', 'Пунта-Каны'], 'Лиссабон': ['в Лиссабоне', 'Лиссабона'], 'Мерида': ['в Мериде', 'Мериды'],
'Анталья': ['в Анталье', 'Антальи'], 'Сидней': ['в Сиднее', 'Сиднея'], 'Балеарские острова': ['на Балеарских островах', 'Балеарских островов'], 'Панама': ['в Панаме', 'Панамы'],
'Марракеш': ['в Марракеше', 'Марракеша'], 'Аккра': ['в Аккре', 'Аккры'], 'Ванкувер': ['в Ванкувере', 'Ванкувера'], 'Кейптаун': ['в Кейптауне', 'Кейптауна'], 'Манчестер': ['в Манчестере', 'Манчестера'],
'Торонто': ['в Торонто', 'Торонто'], 'Медельин': ['в Медельине', 'Медельина'], 'Хуахин': ['в Хуахине', 'Хуахина'], 'Гоа': ['на Гоа', 'Гоа'], 'Аджман': ['в Аджмане', 'Аджмана'],
'Канарские острова': ['на Канарских островах', 'Канарских островов'], 'Токио': ['в Токио', 'Токио'], 'Лагос': ['в Лагосе', 'Лагоса'], 'Бодрум': ['в Бодруме', 'Бодрума'], 'Мехико': ['в Мехико', 'Мехико'],
'Мадейра': ['на Мадейре', 'Мадейры'], 'Гавайи': ['на Гавайях', 'Гавайев'], 'Ливерпуль': ['в Ливерпуле', 'Ливерпуля'], 'Нью-Йорк': ['в Нью-Йорке', 'Нью-Йорка'], 'Перт': ['в Перте', 'Перта'],
'Кигали': ['в Кигали', 'Кигали'], 'Берлин': ['в Берлине', 'Берлина'], 'Краби': ['в Краби', 'Краби'], 'Чиангмай': ['в Чиангмае', 'Чиангмая'], 'Лабуан-Баджо': ['в Лабуан-Баджо', 'Лабуан-Баджо'],
'Остин': ['в Остине', 'Остина'], 'Нисеко': ['в Нисеко', 'Нисеко'], 'Бирмингем': ['в Бирмингеме', 'Бирмингема'], 'Умм-эль-Кайвайн': ['в Умм-эль-Кайвайне', 'Умм-эль-Кайвайна'],
'Брисбен': ['в Брисбене', 'Брисбена'], 'Дублин': ['в Дублине', 'Дублина'], 'Измир': ['в Измире', 'Измира'], 'Мумбаи': ['в Мумбаи', 'Мумбаи'], 'Сеул': ['в Сеуле', 'Сеула'], 'Баку': ['в Баку', 'Баку'],
'Ереван': ['в Ереване', 'Еревана'], 'Белград': ['в Белграде', 'Белграда'], 'Будапешт': ['в Будапеште', 'Будапешта'], 'Рига': ['в Риге', 'Риги'], 'Таллин': ['в Таллине', 'Таллина'],
'остров Аль-Марджан': ['на острове Аль-Марджан', 'острова Аль-Марджан'], 'Майорка': ['на Майорке', 'Майорки'], 'остров Саадият': ['на острове Саадият', 'острова Саадият'], 'Тенерифе': ['на Тенерифе', 'Тенерифе'],
'Хоккайдо': ['на Хоккайдо', 'Хоккайдо'], 'Пенанг': ['на Пенанге', 'Пенанга'], 'Окинава': ['на Окинаве', 'Окинавы'], 'Манхэттен': ['на Манхэттене', 'Манхэттена'], 'Тулум': ['в Тулуме', 'Тулума'],
'Маскат': ['в Маскате', 'Маската'], 'Афины': ['в Афинах', 'Афин'], 'Коломбо': ['в Коломбо', 'Коломбо'], 'Лимасол': ['в Лимасоле', 'Лимасола'], 'Большая Манила': ['в Большой Маниле', 'Большой Манилы'],
'Пномпень': ['в Пномпене', 'Пномпеня'], 'Батуми': ['в Батуми', 'Батуми'], 'Большой Кайман': ['на Большом Каймане', 'Большого Каймана'],
'ОАЭ': ['в ОАЭ', 'ОАЭ'], 'Индонезия': ['в Индонезии', 'Индонезии'], 'Таиланд': ['в Таиланде', 'Таиланда'], 'Испания': ['в Испании', 'Испании'], 'Мексика': ['в Мексике', 'Мексики'], 'США': ['в США', 'США'],
'Малайзия': ['в Малайзии', 'Малайзии'], 'Турция': ['в Турции', 'Турции'], 'Португалия': ['в Португалии', 'Португалии'], 'Австралия': ['в Австралии', 'Австралии'], 'Вьетнам': ['во Вьетнаме', 'Вьетнама'],
'Япония': ['в Японии', 'Японии'], 'Великобритания': ['в Великобритании', 'Великобритании'], 'Филиппины': ['на Филиппинах', 'Филиппин'], 'Польша': ['в Польше', 'Польши'], 'Бразилия': ['в Бразилии', 'Бразилии'],
'Египет': ['в Египте', 'Египта'], 'Шри-Ланка': ['на Шри-Ланке', 'Шри-Ланки'], 'Греция': ['в Греции', 'Греции'], 'Кипр': ['на Кипре', 'Кипра'], 'Оман': ['в Омане', 'Омана'], 'Грузия': ['в Грузии', 'Грузии'],
'Доминиканская Республика': ['в Доминиканской Республике', 'Доминиканской Республики'], 'Танзания': ['в Танзании', 'Танзании'], 'Канада': ['в Канаде', 'Канады'], 'Камбоджа': ['в Камбодже', 'Камбоджи'],
'Марокко': ['в Марокко', 'Марокко'], 'Маврикий': ['на Маврикии', 'Маврикия'], 'Кения': ['в Кении', 'Кении'], 'Коста-Рика': ['в Коста-Рике', 'Коста-Рики'], 'Колумбия': ['в Колумбии', 'Колумбии'],
'Северный Кипр': ['на Северном Кипре', 'Северного Кипра'], 'Черногория': ['в Черногории', 'Черногории'], 'Саудовская Аравия': ['в Саудовской Аравии', 'Саудовской Аравии'], 'Индия': ['в Индии', 'Индии'],
'Мальта': ['на Мальте', 'Мальты'], 'Германия': ['в Германии', 'Германии'], 'Хорватия': ['в Хорватии', 'Хорватии'], 'Франция': ['во Франции', 'Франции'], 'Катар': ['в Катаре', 'Катара'], 'Бахрейн': ['в Бахрейне', 'Бахрейна'],
'Италия': ['в Италии', 'Италии'], 'Болгария': ['в Болгарии', 'Болгарии'], 'Албания': ['в Албании', 'Албании'], 'Мальдивы': ['на Мальдивах', 'Мальдив'], 'Багамы': ['на Багамах', 'Багам'], 'Кабо-Верде': ['в Кабо-Верде', 'Кабо-Верде'] };
const RU_KEYS = Object.keys(RU_F).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
const RU_IN = new RegExp('(^|[\\s>(«"])(?:в|во|В|Во)((?:\\s|&nbsp;|\\u00a0)+)((?:<(?:bdi|b|strong|span)[^>]*>)*)(' + RU_KEYS + ')(?![а-яёА-ЯЁ-])', 'g');
const RU_GEN = new RegExp('(Новостройки|новостройки|Новостроек|новостроек)((?:\\s|&nbsp;|\\u00a0)+)((?:<(?:bdi|b|strong|span)[^>]*>)*)(' + RU_KEYS + ')(?![а-яёА-ЯЁ-])', 'g');
export function ruPlaces(html) {
return String(html).replace(RU_IN, (m, b, gap, tags, n) => { const f = RU_F[n][0], cap = /^В/.test(m.slice(b.length)); const sp = f.indexOf(' '); return b + (cap ? f.charAt(0).toUpperCase() : f.charAt(0)) + f.slice(1, sp) + gap + tags + f.slice(sp + 1); })
.replace(RU_GEN, (m, w, gap, tags, n) => w + gap + tags + RU_F[n][1]);
}
