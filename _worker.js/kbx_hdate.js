// Kolaboro batch 25 (n25t): handover dates as the developer or a portal published them, in words ("October 2027", "Q1 2027",
// "Mid 2028", "end of 2026", "1er semestre 2027", "Segundo Semestre 2028", "2029 H2", "2027年3月", "06/2028"), parsed ONCE into
// { y, q | h | m | d | s(eason) | p(art of year) } and formatted with Intl in the page language. One parser for every page type
// (named pages, quick answer, FAQ JSON-LD, titles, developer pages, rankings, /api answers). A string that does not start with a
// date we can read stays exactly as published (wrapped in <bdi> by the callers on Arabic pages).
// hparse(s) -> null | { a: <date>, b?: <date> (range end), c?: true (approx), ph?: 1 (phase 1), note: <rest as published or ''> }
// hfmt(s, lang) -> display text in the page language (falls back to the string as published)
// hnote(s) -> true when the published wording carries more than the date (a note, a second date, a qualifier): pages quote it once

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
const PART = { early: 'b', beginning: 'b', start: 'b', mid: 'm', middle: 'm', late: 'l', end: 'e', principios: 'b', inicios: 'b', comienzos: 'b', mediados: 'm', finales: 'e', fines: 'e', 'début': 'b', debut: 'b', fin: 'e', anfang: 'b', mitte: 'm', ende: 'e', begin: 'b', medio: 'm', eind: 'e' };
const W = '[A-Za-zÀ-ÿçñäöüßéèêûôâîœ.]+';
const Y = '((?:19|20)\\d\\d)(?![\\d])';
const RX = [
  // canonical codes first: 2027-Q2, 2027-H1, 2027-10, 2027-10-01, 2027
  [new RegExp('^' + Y + '-Q([1-4])\\b', 'i'), m => ({ y: +m[1], q: +m[2] })],
  [new RegExp('^' + Y + '-H([12])\\b', 'i'), m => ({ y: +m[1], h: +m[2] })],
  [new RegExp('^' + Y + '-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])\\b'), m => ({ y: +m[1], m: +m[2], d: +m[3] })],
  [new RegExp('^' + Y + '-(0[1-9]|1[0-2])(?![\\d-])'), m => ({ y: +m[1], m: +m[2] })],
  // Q2 2027, Q2/2028, 1Q 2028, 2Q-2027, T2 2027, 2T 2027
  [new RegExp('^(?:Q|T)([1-4])\\s*[/ .-]?\\s*' + Y, 'i'), m => ({ y: +m[2], q: +m[1] })],
  [new RegExp('^([1-4])\\s*(?:Q|T)\\s*[/ .-]?\\s*' + Y, 'i'), m => ({ y: +m[2], q: +m[1] })],
  // H2 2027, 2H 2027
  [new RegExp('^H([12])\\s*[/ .-]?\\s*' + Y, 'i'), m => ({ y: +m[2], h: +m[1] })],
  [new RegExp('^([12])H\\s*[/ .-]?\\s*' + Y, 'i'), m => ({ y: +m[2], h: +m[1] })],
  // 2029 H2, 2027 Q3
  [new RegExp('^' + Y + '\\s*[/ -]\\s*H([12])\\b', 'i'), m => ({ y: +m[1], h: +m[2] })],
  [new RegExp('^' + Y + '\\s*[/ -]\\s*Q([1-4])\\b', 'i'), m => ({ y: +m[1], q: +m[2] })],
  // first/second half (of) 2027, 1er semestre 2027, Segundo Semestre 2028, last semester 2028, 2. Halbjahr 2027
  [new RegExp('^(first|second|last|primer|segundo|1er|1º|2º|1°|2°|1st|2nd|1\\.|2\\.)\\s+(?:half|semester|semestre|halbjahr)(?:\\s+(?:of|de|del))?\\s+' + Y, 'i'),
    m => { const w = m[1].toLowerCase(), o = /^(first|primer|1)/.test(w) ? 1 : 2; return { y: +m[2], h: o }; }],
  // first quarter (of) 2027, 1er trimestre 2027, segundo trimestre de 2027
  [new RegExp('^(first|second|third|fourth|primer|segundo|tercer|cuarto|1er|1st|2nd|3rd|4th|[1-4]º|[1-4]°|[1-4]\\.)\\s+(?:quarter|trimestre|quartal)(?:\\s+(?:of|de|del))?\\s+' + Y, 'i'),
    m => { const w = m[1].toLowerCase().replace(/[º°.]|st|nd|rd|th|er/g, ''); const o = { first: 1, primer: 1, second: 2, segundo: 2, third: 3, tercer: 3, fourth: 4, cuarto: 4 }[w] || +w; return o >= 1 && o <= 4 ? { y: +m[2], q: o } : null; }],
  // early / mid / late / end (of) 2027, mid-2027, end-2027, principios de 2027, finales de 2027, début 2027, mi-2027, Ende 2027
  [new RegExp('^(early|beginning|start|mid|middle|late|end|principios|inicios|comienzos|mediados|finales|fines|d[ée]but|fin|anfang|mitte|ende|begin|medio|eind)(?:\\s*-\\s*|\\s+(?:of\\s+|de\\s+|del\\s+)?)' + Y, 'i'),
    m => ({ y: +m[2], p: PART[m[1].toLowerCase()] || PART[m[1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')] })],
  [new RegExp('^mi-' + Y, 'i'), m => ({ y: +m[1], p: 'm' })],
  // 2028 mid-year, 2027 year-end
  [new RegExp('^' + Y + '\\s+(mid|end)-?year\\b', 'i'), m => ({ y: +m[1], p: m[2].toLowerCase() === 'mid' ? 'm' : 'e' })],
  // seasons: Summer 2027, primavera de 2028, printemps 2028
  [new RegExp('^(' + Object.keys(SEASON).join('|') + ')(?:\\s+(?:of|de|del))?\\s+' + Y, 'i'), m => ({ y: +m[2], s: SEASON[m[1].toLowerCase()] })],
  // October 2027, Oct 2027, octubre de 2027, 3 September 2026, September 3, 2026
  [new RegExp('^(\\d{1,2})\\s+(' + W + ')\\s+(?:de\\s+)?' + Y, 'i'), m => { const k = mon(m[2]); return k ? { y: +m[3], m: k, d: +m[1] } : null; }],
  [new RegExp('^(' + W + ')\\s+(\\d{1,2}),?\\s+' + Y, 'i'), m => { const k = mon(m[1]); return k ? { y: +m[3], m: k, d: +m[2] } : null; }],
  [new RegExp('^(' + W + ')\\s+(?:de\\s+|del\\s+)?' + Y, 'i'), m => { const k = mon(m[1]); return k ? { y: +m[2], m: k } : null; }],
  // 2027年3月, 2027年
  [new RegExp('^' + Y + '\\s*年\\s*(1[0-2]|[1-9])\\s*月'), m => ({ y: +m[1], m: +m[2] })],
  // 06/2028 (month/year only; day/month/year is ambiguous and stays as published)
  [new RegExp('^(0?[1-9]|1[0-2])\\s*/\\s*' + Y + '(?!\\s*/)'), m => ({ y: +m[2], m: +m[1] })],
  // a bare year
  [new RegExp('^' + Y + '(?:\\s*年)?(?![./:]\\d|-\\d{1,2}(?!\\d))'), m => ({ y: +m[1] })]
];
function mon(w) { const k = String(w || '').toLowerCase().replace(/\.$/, ''); return MON[k] || null; }

// one date phrase at the start of t: { v, len }
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
  // "about 2025 (...), then January 2027": the date after the last "then" is the current one
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
    // ranges: "2026-2027", "2026-Q4 to 2027-Q1", "Q4 2029-2030"
    const rg = /^\s*(?:-|–|\bto\b|\bal\b|\bà\b|\bbis\b|\bto\s+the\b)\s*/i.exec(rest);
    if (rg) { const z = head(rest.slice(rg[0].length)); if (z && z.v.y >= a.v.y && (z.v.y > a.v.y || JSON.stringify(z.v) !== JSON.stringify(a.v))) { b = z.v; rest = rest.slice(rg[0].length + z.len); } }
    const note = rest.trim().replace(/^[,;:]\s*/, '');
    out = { a: a.v, b, c, ph, note };
  }
  if (CACHE.size > 4000) CACHE.clear();
  CACHE.set(raw, out);
  return out;
}

// words per language for the parts we cannot get from Intl
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
// P: the parsed object; returns the text in the page language
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
// for display next to other text: a date followed by a bracketed note, a second date after ";" or "or" is shown as the date;
// a string whose rest is not such a note ("2000 m2", "12 month lead time") stays exactly as published
export function hdisp(s, lang) {
  if (s == null) return '';
  const P = hparse(s);
  return P && (!P.note || /^[(;,/]|^(or|for|then)\b/i.test(P.note)) ? hshow(P, lang) : String(s);
}
// our storage code for a published wording, when it names one exact period: 2027-10, 2027-Q1, 2027-H2, 2027, 2027-10-01
// (early/mid/late and seasons are not one exact period: null). Used by the calendar (.ics) to place a date in words.
export function hcode(s) {
  const P = hparse(s); if (!P || P.c || P.ph || (P.note && !/^[(;,/]|^(or|for|then)\b/i.test(P.note))) return null;
  const v = P.a, p2 = n => String(n).padStart(2, '0');
  return v.d ? v.y + '-' + p2(v.m) + '-' + p2(v.d) : v.m ? v.y + '-' + p2(v.m) : v.q ? v.y + '-Q' + v.q : v.h ? v.y + '-H' + v.h : v.p || v.s ? null : String(v.y);
}
// canonical storage codes (2027-Q2, 2027-10, 2027) are ours, not the developer's wording
const CANON = /^(?:19|20)\d\d(?:-(?:Q[1-4]|H[12]|\d{2}(?:-\d{2})?))?$/i;
export function hnote(s) {
  if (s == null) return false;
  const raw = String(s).trim();
  return !!raw && !CANON.test(raw);
}
// the year of the handover, for grouping (related projects, rankings by year)
export function hyear(s) { const P = hparse(s); return P ? P.a.y : null; }
// a sortable key: first month of the period (YYYY-MM)
export function hkey(s) {
  const P = hparse(s); if (!P) return null; const v = P.b || P.a;
  const m = v.m || (v.q ? v.q * 3 : v.h ? v.h * 6 : v.p ? { b: 3, m: 6, l: 10, e: 12 }[v.p] : v.s ? { sp: 5, su: 8, au: 11, wi: 12 }[v.s] : 12);
  return v.y + '-' + String(m).padStart(2, '0');
}
export const HDATE_V = 1;

// n25t: country names as we store them (English) shown in the page language, from Intl.DisplayNames (CLDR). English pages keep
// the stored name exactly. Unknown names stay as stored.
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
const SHORT = { ru: { USA: 'США', 'United States': 'США' }, zh: { UAE: '阿联酋' }, ar: { UAE: 'الإمارات' } };   // the short forms people write
const dnC = new Map();
export function coName(co, lang) {
  if (!co || !lang || lang === 'en') return co || '';
  if (co === 'Northern Cyprus') return NCY[lang] || co;
  const sh = SHORT[lang] && SHORT[lang][co]; if (sh) return sh;
  const iso = CO2[co]; if (!iso) return co;
  try { let f = dnC.get(lang); if (!f) { f = new Intl.DisplayNames([LOCALE[lang] || lang], { type: 'region', fallback: 'none' }); dnC.set(lang, f); } return f.of(iso) || co; } catch (e) { return co; }
}
export const CO_ISO2 = CO2;
// a market or place part that is itself a country name ("Germany", "Northern Cyprus") in the page language; other names as stored
export const mkName = (mk, lang) => mk && lang && lang !== 'en' && (CO2[mk] || mk === 'Northern Cyprus') ? coName(mk, lang) : (mk || '');
export const placeName = (p, lang) => !p || lang === 'en' ? (p || '') : String(p).split(', ').map(t => mkName(t, lang)).join(', ');
