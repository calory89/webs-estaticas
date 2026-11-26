// kolaboro.com batch 29 (agent n29p, 14 Nov 2026): what people search about one project or one developer, answered from data we hold.
// No model calls, nothing fetched at request time, nothing stored about visitors. Facts only, each with its source and date.
//   Project pages (kbx_named.js projectPage):
//     #payment-plan   "Payment plan of <project>": plan and deposit as published, with the page and the day we read it (item 1, 11)
//     #floor-plans    "Unit types, sizes and floor plans of <project>": as published, with the date (item 2, 11)
//     #buy-rules      foreign ownership: the project's published terms and the country's law, linked (item 4); short lets: the rule of
//                     the place from /data/short-let-rules.json (item 5)
//     #ppm            entry price per m2 against the median of the same figure in the place, only with 5+ projects (item 6)
//     #where          one line of distances measured from the pin to beach, airport and hospital (item 3); FAQ "how far"
//     under the quick answer: the satellite change sentence of #space (item 13)
//     #developer      other projects of the same developer in the same place first (item 12), the developer's delivery record
//                     link (item 8), the official company register of the place (item 14)
//     JSON-LD         alternateName with the name in Thai as printed in the official ONEP EIA register (item 10)
//   Developer pages (devPage): a 40 to 60 word quick answer (item 15), filters on the projects table (item 7), company registers (14).
// Strings in 8 languages (en es fr de nl ru zh ar). No em dashes.
import { regSale } from './kbx_n31d_rs.js';   // n31d: registered sale prices are not asking prices
import { NT } from './kbx_buy_notes.js';
import { rulesFor } from './kbx_rules.js';
import { words } from './kbx_named_qa.js';
import { TB } from './kbx_strings.js';

const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const okU = u => typeof u === 'string' && /^https?:\/\/[^\s"<>]+$/.test(u);
const pre = l => l === 'en' ? '' : '/' + l;
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const nf = (lang, v, o) => { try { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'n' + LOC[lang] + JSON.stringify(o || 0); return (c[k] || (c[k] = new Intl.NumberFormat(LOC[lang] || 'en-GB', o))).format(v); } catch (e) { return String(v); } };
const src = (u, label) => okU(u) ? ' <a class="src" href="' + esc(u) + '" rel="nofollow noopener" target="_blank">' + esc(label || host(u)) + '</a>' : '';
const own = (u, label) => ' <a class="src" href="' + esc(u) + '">' + esc(label) + '</a>';
const li = (h, s) => '<li class="kfact">' + h + (s || '') + '</li>';
const enq = (t, lang) => lang === 'en' ? esc(t) : '<span lang="en" dir="ltr">' + esc(t) + '</span>';

const S = TB.kbx_p29_S /* n40 k5: in /data/i18n/kbx_p29.json */;
export const t29 = (lang, k, v) => { const s = (S[lang] && S[lang][k]) || S.en[k] || k; return v ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m).replace(/(?<!\.)\.\.(?=\s|$)/g, '.') : s; };   // "2026 г.." -> "2026 г."

// ------------------------------------------------------------------------------------------------ foreign ownership by country (item 4)
// Country rules restated from the law text, each with its source and the day it was read. Indonesia, Thailand and Mexico reuse the
// notes of the buying guides (kbx_buy_notes.js, same sources as kbx_buy.js SRC); Dubai was read for this batch.
const LAW = {
  id_uupa: { n: 'UUPA (Law 5/1960), Art. 21, 26', u: 'https://peraturan.go.id/files/UU0051960.pdf', d: '2026-11-03' },
  id_pp18: { n: 'PP 18/2021, Art. 52, 71, 72', u: 'https://www.peraturan.go.id/files3/pp-no-18-tahun-2021_asli.pdf', d: '2026-11-03' },
  th_condo: { n: 'Condominium Act B.E. 2522, s. 19 bis, 19 ter', u: 'https://www.dol.go.th/media/716929789247754240/migration/2025/10/6Wp3Tk7hgK5HdDRuvYXGcNsi.pdf', d: '2026-11-03' },
  th_dol: { n: 'Department of Lands', u: 'https://www.dol.go.th/', d: '2026-11-13' },
  mx_lie: { n: 'Ley de Inversión Extranjera, Art. 2, 11, 13', u: 'https://www.ordenjuridico.gob.mx/Documentos/Federal/html/wo14.html', d: '2026-11-13' },
  ae_l7: { n: 'Dubai Law No. 7 of 2006, Art. 4', u: 'https://dlp.dubai.gov.ae/Legislation%20Reference/2006/Law%20No.%20(7)%20of%202006.html', d: '2026-11-14' }
};
const AE_L7 = {
  en: 'Dubai Law No. 7 of 2006, Article 4: ownership is for UAE and GCC nationals and their companies; other foreigners may, with the Ruler’s approval and only in areas he designates, hold freehold without time limit, or usufruct or leasehold for up to 99 years.',
  es: 'Ley de Dubái 7/2006, artículo 4: la propiedad es para nacionales de EAU y del CCG y sus sociedades; los demás extranjeros pueden, con aprobación del Gobernante y solo en las zonas que él designe, tener pleno dominio sin límite de tiempo, o usufructo o arrendamiento de hasta 99 años.',
  fr: 'Loi de Dubaï n° 7 de 2006, article 4 : la propriété est réservée aux ressortissants des EAU et du CCG et à leurs sociétés ; les autres étrangers peuvent, avec l’accord du Souverain et seulement dans les zones qu’il désigne, détenir la pleine propriété sans limite de durée, ou un usufruit ou un bail de 99 ans au plus.',
  de: 'Dubai-Gesetz Nr. 7/2006, Artikel 4: Eigentum ist Staatsangehörigen der VAE und der GCC-Staaten und ihren Gesellschaften vorbehalten; andere Ausländer können mit Zustimmung des Herrschers und nur in von ihm bestimmten Gebieten unbefristetes Volleigentum oder Nießbrauch oder Pacht bis 99 Jahre erhalten.',
  nl: 'Wet van Dubai nr. 7/2006, artikel 4: eigendom is voor staatsburgers van de VAE en de GCC en hun bedrijven; andere buitenlanders kunnen, met goedkeuring van de heerser en alleen in door hem aangewezen gebieden, volle eigendom zonder tijdslimiet krijgen, of vruchtgebruik of erfpacht tot 99 jaar.',
  ru: 'Закон Дубая № 7/2006, статья 4: собственность доступна гражданам ОАЭ и стран ССАГПЗ и их компаниям; другие иностранцы с одобрения Правителя и только в определённых им зонах могут получить бессрочную собственность (freehold) либо узуфрукт или аренду до 99 лет.',
  zh: '迪拜 2006 年第 7 号法律第 4 条：产权限于阿联酋和海合会国家公民及其公司；其他外国人经统治者批准，仅可在其指定区域取得无期限永久产权，或最长 99 年的用益权或租赁权。',
  ar: 'قانون دبي رقم 7 لسنة 2006، المادة 4: التملّك لمواطني الدولة ودول مجلس التعاون وشركاتهم؛ ويجوز لغيرهم من الأجانب، بموافقة الحاكم وفي مناطق يحددها فقط، التملّك الحر دون قيد زمني، أو حق الانتفاع أو الإجارة حتى 99 سنة.'
};
// Mexico: the guide note names Tulum, so a general wording of the same articles is used for the other coastal places
const MX_RZ = {
  en: 'Within 100 km of the borders and 50 km of the coast (the restricted zone), a foreigner acquires residential property through a bank trust (fideicomiso) that needs a permit from the Foreign Affairs ministry (SRE); the trust lasts up to 50 years and can be extended.',
  es: 'A menos de 100 km de las fronteras y 50 km de la costa (la zona restringida), un extranjero adquiere vivienda mediante un fideicomiso bancario que requiere permiso de la Secretaría de Relaciones Exteriores (SRE); el fideicomiso dura hasta 50 años y se puede prorrogar.',
  fr: 'À moins de 100 km des frontières et de 50 km de la côte (la zone restreinte), un étranger acquiert un logement par une fiducie bancaire (fideicomiso) soumise à un permis du ministère des Affaires étrangères (SRE) ; la fiducie dure 50 ans au plus et peut être prolongée.',
  de: 'Innerhalb von 100 km zu den Grenzen und 50 km zur Küste (der Sperrzone) erwirbt ein Ausländer Wohneigentum über einen Bank-Treuhandvertrag (fideicomiso), der eine Genehmigung des Außenministeriums (SRE) braucht; er läuft bis zu 50 Jahre und ist verlängerbar.',
  nl: 'Binnen 100 km van de grenzen en 50 km van de kust (de beperkte zone) verwerft een buitenlander woningbezit via een banktrust (fideicomiso) waarvoor een vergunning van het ministerie van Buitenlandse Zaken (SRE) nodig is; de trust duurt maximaal 50 jaar en kan worden verlengd.',
  ru: 'В пределах 100 км от границ и 50 км от побережья (запретная зона) иностранец приобретает жильё через банковский траст (fideicomiso), для которого нужно разрешение министерства иностранных дел (SRE); траст действует до 50 лет и может быть продлён.',
  zh: '在距国境 100 公里、距海岸 50 公里的范围内（限制区），外国人须通过银行信托（fideicomiso）取得住宅物业，该信托需外交部（SRE）许可；信托期限最长 50 年，可延期。',
  ar: 'ضمن 100 كم من الحدود و50 كم من الساحل (المنطقة المقيّدة)، يتملّك الأجنبي العقار السكني عبر ائتمان مصرفي (fideicomiso) يحتاج إلى تصريح من وزارة الخارجية (SRE)؛ ومدته حتى 50 سنة قابلة للتمديد.'
};
const MX_COAST = new Set(['Riviera Maya', 'Los Cabos', 'Puerto Vallarta', 'Riviera Nayarit']);
const landed = x => /villa|house|home|townhouse|bungalow|land|plot|landed/i.test(((x.fx || {}).unit_types || []).join(' ') + ' ' + x.n) && !/apartment|condo|suite|studio|tower/i.test(((x.fx || {}).unit_types || []).join(' '));
function lawFor(x, lang) {   // [[text, source], ...] for the project's place, or []
  const n = k => (NT[k] && (NT[k][lang] || NT[k].en)) || '';
  if (x.co === 'Indonesia') return [[n('n_id_milik'), LAW.id_uupa]].concat(landed(x) ? [[n('n_id_pakai'), LAW.id_pp18]] : []);
  if (x.co === 'Thailand') return landed(x) ? [[n('n_th_land'), LAW.th_dol]] : [[n('n_th_quota'), LAW.th_condo]];
  if (x.co === 'Mexico' && MX_COAST.has(x.mk)) return [[MX_RZ[lang] || MX_RZ.en, LAW.mx_lie]];
  if (x.co === 'UAE' && x.mk === 'Dubai') return [[AE_L7[lang] || AE_L7.en, LAW.ae_l7]];
  return [];
}

// ------------------------------------------------------------------------------------------------ names in local script (item 10)
// As printed in the official ONEP EIA register of Thailand (eia.onep.go.th, read by n27r2 on 13 Nov 2026), the generic words
// "โครงการ" (project) and "อาคารชุด" (condominium) left out. Source rows are quoted on each project page under the claims.
const LOCAL = {
  'PHK-011': ['ดิ โอลีฟ', 'https://eia.onep.go.th/eia/detail?id=15578'],
  'BKK-004': ['สติลล์ สุขุมวิท 20', 'https://eia.onep.go.th/services/web/open-api/eia-list?page=138'],
  'PAT-010': ['อควารัส จอมเทียน พัทยา', 'https://eia.onep.go.th/services/web/open-api/eia-list?page=139'],
  'HHQ-003': ['เดอะ สแตนดาร์ด หัวหิน', 'https://eia.onep.go.th/services/web/open-api/eia-list?page=28'],
  'BKK-009': ['เอ็กซ์ที เทน เอกมัย', 'https://eia.onep.go.th/services/web/open-api/eia-list?page=5'],
  'PAT-018': ['พีทีวาย 1', 'https://eia.onep.go.th/services/web/open-api/eia-list?page=7'],
  'PHK-028': ['เดอะ ไทเทิล โมเดวา บางเทา', 'https://eia.onep.go.th/services/web/open-api/eia-list?page=6']
};
export const localName = x => LOCAL[x.id] || null;

// ------------------------------------------------------------------------------------------------ price per m2 against the place (item 6)
const MED = new WeakMap();
export const ppmOf = x => { if (regSale(x)) return null; const fx = x.fx || {}, p = +fx.price_min, s = +fx.size_min_m2; return p > 0 && s >= 15 && s <= 5000 && fx.currency ? p / s : null; };
export function medians(ix) {
  let M = MED.get(ix); if (M) return M;
  const G = new Map();
  for (const x of ix.P) { const v = ppmOf(x); if (v == null) continue; const k = x.mk + '|' + String(x.fx.currency).toUpperCase(); if (!G.has(k)) G.set(k, []); G.get(k).push(v); }
  M = new Map();
  for (const [k, a] of G) if (a.length >= 5) { a.sort((p, q) => p - q); const h = a.length >> 1; M.set(k, { n: a.length, m: a.length % 2 ? a[h] : (a[h - 1] + a[h]) / 2 }); }
  MED.set(ix, M); return M;
}
export function ppmMedian(ix, x, lang, mkL) {
  const v = ppmOf(x); if (v == null) return '';
  const cur = String(x.fx.currency).toUpperCase(), m = medians(ix).get(x.mk + '|' + cur); if (!m) return '';
  const d = Math.round((v / m.m - 1) * 100), p = Math.abs(d) < 5 ? t29(lang, 'p_eq') : t29(lang, d > 0 ? 'p_up' : 'p_dn', { x: nf(lang, Math.abs(d)) });
  return li(esc(t29(lang, 'ppm_med', { mk: mkL, k: nf(lang, m.n), c: cur, v: cur + ' ' + nf(lang, Math.round(m.m)), p })), own('/data/named.json', 'kolaboro.com/data/named.json'));
}

// ------------------------------------------------------------------------------------------------ official company registers (item 14)
const CO_REG = { USA: 'United States', UK: 'United Kingdom', 'Türkiye': 'Turkey' };
export function companyRegs(REG, x) {
  if (!REG || !REG.length) return [];
  const has = r => (r.checks || []).includes('company') && okU(r.url);
  const byM = REG.filter(r => r.market === x.mk && has(r)); if (byM.length) return byM;
  const co = CO_REG[x.co] || x.co; return REG.filter(r => r.market === co && has(r));
}
const regLi = (lang, r, p) => li('<b>' + esc(t29(lang, 'dreg', { p })) + '</b> <bdi>' + esc(r.register) + '</bdi>', src(r.url));

// ------------------------------------------------------------------------------------------------ project page parts
// h: helpers from kbx_named.js { tr, qa, fd, num, mkName, coName, pre, cleanOk, page, read, place }
export function p29Project(ix, x, lang, c, h, ex) {
  const fx = x.fx || {}, name = x.n, page = h.page, rd = h.read, by = page ? t29(lang, 'pp_read', { d: rd }) : '';
  const out = { faq: [], toc: [], secs: {} };
  // payment plan (item 1)
  const plan = fx.payment_plan && h.cleanOk(String(fx.payment_plan)) ? String(fx.payment_plan) : '';
  out.secs.plan = '<ul class="fl">' + (plan ? li('<b>' + esc(h.tr(lang, 'f_plan')) + ':</b> ' + enq(plan, lang), src(page)) : '<li>' + esc(t29(lang, 'pp_none', { d: rd })) + '</li>') +
    (fx.deposit_pct ? li('<b>' + esc(h.tr(lang, 'f_deposit')) + ':</b> ' + esc(nf(lang, fx.deposit_pct)) + '%', src(page)) : '') + (plan && by ? '<li><small class="k-muted">' + esc(by) + '</small></li>' : '') + '</ul>';
  // unit types, sizes, floor plans (item 2)
  const T = [], A = [];
  if ((fx.unit_types || []).length) { T.push(li('<b>' + esc(h.tr(lang, 'f_types')) + ':</b> ' + enq(fx.unit_types.join(', '), lang), src(page))); A.push(fx.unit_types.join(', ')); }
  if (fx.size_min_m2) { const s = nf(lang, fx.size_min_m2) + (fx.size_max_m2 && fx.size_max_m2 !== fx.size_min_m2 ? ' - ' + nf(lang, fx.size_max_m2) : '') + ' m²'; T.push(li('<b>' + esc(h.tr(lang, 'f_sizes')) + ':</b> ' + esc(s), src(page))); A.push(s); }
  if (c && c.units) { T.push(li('<b>' + esc(h.tr(lang, 'f_units')) + ':</b> ' + esc(nf(lang, c.units)), src(page))); A.push(h.tr(lang, 'f_units') + ': ' + nf(lang, c.units)); }
  if (!h.rvd && x.ev && x.ev.plans && h.cleanOk(x.ev.plans)) T.push(li('<b>' + esc(t29(lang, 'ty_pl')) + ':</b> ' + enq(x.ev.plans, lang), src(x.du || page)));
  out.secs.types = '<ul class="fl">' + (T.length ? T.join('') + (by && !plan ? '<li><small class="k-muted">' + esc(by) + '</small></li>' : '') : '<li>' + esc(t29(lang, 'ty_none', { d: rd })) + '</li>') + '</ul>';
  // foreign ownership and short lets (items 4, 5)
  const R = [], fo = fx.foreign_ownership && h.cleanOk(String(fx.foreign_ownership)) ? String(fx.foreign_ownership) : '', L = lawFor(x, lang), co = h.coName(x.co, lang) || x.co;
  if (fo) R.push(li('<b>' + esc(t29(lang, 'own_pub')) + '</b> ' + enq(fo, lang), src(page)));
  const LL = L.filter(l => l[0]);   // one line per country, each rule followed by its source and the day it was read
  if (LL.length) R.push(li('<b>' + esc(t29(lang, 'own_law', { co })) + '</b> ' + LL.map(([txt, s]) => esc(txt) + src(s.u, s.n) + ' <small class="k-muted">(' + esc(h.fd(s.d, lang)) + ')</small>').join(' ')));
  // JSON-LD only when the project publishes its own terms (the law is named there; its text is in the section above)
  if (fo) out.faq.push([t29(lang, 'q_own', { n: name }), (t29(lang, 'own_pub') + ' ' + fo + '.' + (L.length ? ' ' + t29(lang, 'own_law', { co }) + ' ' + L.map(l => l[1].n).join('; ') + '.' : '')).replace(/\.\.$/, '.'), [fo], 1]);
  const rdat = ex && ex.ru, ds = ex && ex.sl && ex.sl.projects && ex.sl.projects[x.id] && !ex.sl.projects[x.id].outside ? ex.sl.projects[x.id].ds : null;
  const rid = rdat ? rulesFor(rdat, x, ds) : [];
  for (const id of rid.slice(0, 1)) {   // the most local rule set; the full table stays in #money and on the guide
    const j = rdat.rules[id], cell = ['reg', 'stay', 'cap'].map(k => j[k]).find(cc => cc && cc.s === 'rule' && cc.t);
    if (!cell) continue;
    const txt = cell.t[lang] || cell.t.en, s0 = (cell.src || []).map(k => rdat.sources[k]).find(Boolean);
    R.push(li('<b>' + esc(t29(lang, 'str_l', { p: '\u0001' })).replace('\u0001', '<a href="' + pre(lang) + '/guides/short-let-rules/#r-' + esc(id) + '">' + esc(j.name) + '</a>') + '</b> ' + esc(txt), s0 ? src(s0.u, String(s0.n).split(',')[0]) : ''));   // the place links to the full table
  }
  out.secs.rules = R.length ? '<ul class="fl">' + R.join('') + '</ul>' : '';   // the linked law pages and /guides/short-let-rules/ carry the not-legal-advice note
  return out;
}
// the distance line and its FAQ (item 3); pairs from kbx_around.js aroundSum
export function distLine(lang, name, pairs) {
  if (!pairs.length) return { li: '', faq: null };
  const sep = lang === 'zh' ? '；' : lang === 'ar' ? '؛ ' : '; ', cl = lang === 'zh' ? '：' : lang === 'fr' ? ' : ' : ': ';
  const txt = pairs.map(([a, b]) => a + cl + b).join(sep);
  return { li: li('<b>' + esc(t29(lang, 'wd_l')) + '</b> <bdi>' + esc(txt) + '</bdi>', ' <a class="src" href="#around">OpenStreetMap</a>'), faq: null };
}
export const satHtml29 = (lang, s) => s ? '<p class="kans-u k29s"><span>' + esc(t29(lang, 'sat_l')) + ' ' + esc(s) + ' <a href="#space">' + esc(t29(lang, 'sat_more')) + '</a></span></p>' : '';

// ------------------------------------------------------------------------------------------------ developer page parts
// quick answer, 40 to 60 words in English, parts dropped in a fixed order so every language carries the same facts (item 15)
export function devAnswer(lang, P, en) {   // P: [[key, text_lang, text_en], ...] in display order; en: drop order
  const out = new Set(); const W = () => words(P.filter(p => !out.has(p[0])).map(p => p[2]).join(' '));
  for (const k of en) { if (W() <= 60) break; out.add(k); }
  return P.filter(p => !out.has(p[0])).map(p => p[1]).join(' ');
}
// filter chips above the projects table: place and stage, only for 6+ projects with more than one value (item 7)
export function devFilter(lang, rows) {   // rows: [{ mk, mkL, st, stL }]
  if (rows.length < 6) return '';
  const grp = (k, kl) => { const m = new Map(); for (const r of rows) { const e = m.get(r[k]) || { l: r[kl], n: 0 }; e.n++; m.set(r[k], e); } return m; };
  const M = grp('mk', 'mkL'), St = grp('st', 'stL');
  if (M.size < 2 && St.size < 2) return '';
  const b = (f, l, n, on) => '<button type="button" class="k29b" data-f="' + esc(f) + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + esc(String(l).charAt(0).toUpperCase() + String(l).slice(1)) + ' <small>' + esc(nf(lang, n)) + '</small></button>';
  const chips = [b('', t29(lang, 'fl_all', { k: '' }).replace(/\s*[(（]\s*[)）]/, ''), rows.length, true)];
  if (M.size > 1) for (const [k, e] of [...M].sort((a, c) => c[1].n - a[1].n)) chips.push(b('m:' + k, e.l, e.n));
  if (St.size > 1) for (const [k, e] of St) chips.push(b('s:' + k, e.l, e.n));
  return '<div class="k29f" role="group" aria-label="' + esc(t29(lang, 'fl_lbl')) + '">' + chips.join('') + '</div>';
}
export const DEV_CSS = '<style id="k29-css">.k29f{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}.k29b{min-height:44px;padding:8px 14px;border:1px solid var(--line);border-radius:999px;background:var(--card,#fff);color:inherit;font:inherit;cursor:pointer}.k29b[aria-pressed=true]{border-color:var(--k-sea,#155C75);box-shadow:inset 0 0 0 1px var(--k-sea,#155C75)}.k29b small{color:var(--muted)}</style>';
export const DEV_JS = "(function(){var g=document.querySelector('.k29f');if(!g)return;var R=document.querySelectorAll('#projects tbody tr');g.addEventListener('click',function(e){var b=e.target.closest('.k29b');if(!b)return;var f=b.getAttribute('data-f');g.querySelectorAll('.k29b').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});R.forEach(function(r){r.hidden=!!f&&r.getAttribute('data-f').split(' ').indexOf(f)<0})})})();";
export { regLi, lawFor, LAW, AE_L7 };   // AE_L7: n31e (batch 31) compare-countries ownership row
