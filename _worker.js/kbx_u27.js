// kolaboro.com batch 27 (agent n27u, 13 Nov 2026): easier to use and faster. No paid AI, no DB writes, nothing invented.
// Project pages in two levels: the quick answer, a six-check traffic light and the date on top; every section below folded
// (<details>, all content stays in the HTML for search engines, Ctrl+F opens a folded section in current browsers, print opens all).
// Routes:
//   GET /k/u27.js?v=<V>                 the client script of named pages, the home and /projects/ (it also carries the scripts that
//                                       kbx_named.js used to inline in every page: live register lookup, watch box, what next, filters)
//   GET /api/v1/cost?id=<ID>&p=<price>  the tax and fee rows of the project's country for a price typed by the reader (kbx_facets.js
//                                       costCalc, the same functions as the table on the page)
//   GET /api/v1/map[?lang=xx]           every named project for the map: pin where the developer publishes an address, else its market
//   GET /[<lang>/]map/                  map of all projects with filters (Leaflet, OpenStreetMap tiles, loaded when the map is near)
//   GET /[<lang>/]updates/              the full text of every line of the "Shipping daily" bar (the bar shows a short form)
// Sumba projects never appear (kbx_named.js data() leaves them out), nor Eco Beach City or Equinox.
import { t30 } from './kbx_n30a.js';
import { TB } from './kbx_strings.js';   // n30a (batch 30): contract reader link in the checklist
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const COI_RX = /eco\s*beach\s*city|\bequinox\b/i;
export const U27V = 'u27o';   // u27o: singular '1 project' in suggestions and map count (n40 k9); u27l: n31t compare checkbox 24 px, href on the compare link; u27k: loads /k/n31d.js on project pages (n31d); u27j: n30a script a5; u27i: n30a script a4; u27h: compare up to 4, loads /k/n30a.js (n30a)
const pre = l => l === 'en' ? '' : '/' + l;
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bdi = (lang, s) => lang === 'ar' ? '<bdi>' + esc(s) + '</bdi>' : esc(s);

// ------------------------------------------------------------------------------------------------ words (server side)
const S = TB.kbx_u27_S /* n40 k5: in /data/i18n/kbx_u27.json */;
export const t27 = (lang, k, v) => { let s = (S[lang] && S[lang][k] != null) ? S[lang][k] : S.en[k]; if (v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b); return s; };

// ------------------------------------------------------------------------------------------------ project page parts
// a folded section: the heading is the summary, everything else is inside (in the HTML, closed). "lead" (optional) is one short
// line shown under the heading while folded (for a dated, sourced lead sentence).
export const secZ = (id, h, inner, lead) => '<section class="ks kz" id="' + id + '"><details class="kz-d"><summary class="kz-s"><h2>' + h + '</h2>' + (lead ? '<p class="kz-l">' + lead + '</p>' : '') + '</summary>' + inner + '</details></section>';

// the six-check traffic light, from fields we already hold: transparency ledger items (kbx_tr.js), the case's satellite line and
// stage, overdue months. Each check links to its section (folded sections open on the link). Colours carry words too.
// n35b (batch 35, item 11): status card v2. Same six checks, now with a state icon drawn in CSS (tick, half, cross, question mark: shape and
// words, not colour alone), the date of the last check and the number of sources in the card head, and the one next question to ask,
// picked by rule from the first check that is not green (the same checklist sentences as below), linked to the full question list.
const LT2 = { en: ['Last checked {d}', '{n} sources', 'Next question to ask', 'All questions', '{n} source'], es: ['Última comprobación: {d}', '{n} fuentes', 'Siguiente pregunta', 'Todas las preguntas', '{n} fuente'],
  fr: ['Dernière vérification : {d}', '{n} sources', 'Prochaine question à poser', 'Toutes les questions', '{n} source'], de: ['Zuletzt geprüft: {d}', '{n} Quellen', 'Nächste Frage', 'Alle Fragen', '{n} Quelle'],
  nl: ['Laatst gecontroleerd: {d}', '{n} bronnen', 'Volgende vraag om te stellen', 'Alle vragen', '{n} bron'], ru: ['Последняя проверка: {d}', 'Источников: {n}', 'Следующий вопрос', 'Все вопросы'],
  zh: ['最近核查：{d}', '{n} 个来源', '下一个要问的问题', '全部问题'], ar: ['آخر فحص: {d}', 'عدد المصادر: {n}', 'السؤال التالي', 'كل الأسئلة'] };
function nextQ(lang, P, o) {
  const st = k => (P.find(p => p[0] === k) || [0, 0, ['nc']])[2][0], co = o.co || '', r0 = (o.regs || [])[0];
  if (st('permit') !== 'ok') return r0 ? esc(t27(lang, 'ck2')) + ' ' + esc(t27(lang, 'ck2r', { r: '\u0000' })).replace('\u0000', '<bdi>' + esc(r0.n) + '</bdi>') : esc(t27(lang, 'ck2'));
  if (st('company') !== 'ok') return esc(t27(lang, 'ck1', { co: '\u0000' })).replace('\u0000', bdi(lang, co));
  if (st('date') === 'no' || st('date') === 'part') return esc(t27(lang, 'ck7'));
  if (st('build') !== 'ok') return esc(t27(lang, 'ck6'));
  return esc(t27(lang, 'ck4'));
}
export function lightHtml(lang, o) {
  const P = light6(o), L = LT2[lang] || LT2.en, f = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
  const meta = o.meta ? '<p class="klt-m">' + (o.meta.d ? '<span>' + esc(f(L[0], { d: o.meta.d })) + '</span>' : '') + (o.meta.n ? '<a href="#sources">' + esc(f(String(o.meta.n).replace(/\D/g, '') === '1' && L[4] ? L[4] : L[1], { n: o.meta.n })) + '</a>' : '') + '</p>' : '';
  const nq = o.meta ? '<p class="klt-q"><b>' + esc(L[2]) + '</b> <span>' + nextQ(lang, P, o.meta) + '</span>' + (o.meta.q ? ' <a href="' + esc(o.meta.q) + '">' + esc(L[3]) + '</a>' : '') + '</p>' : '';
  return '<div class="klt' + (o.meta ? ' klt2' : '') + '" id="checks6" data-u27="' + esc(JSON.stringify(o.data || {})) + '"><div class="klt-t"><p class="klt-h">' + esc(t27(lang, 'lt_h')) + '</p>' + meta + '</div><ul class="klt-l">' +
    P.map(([k, sid, s]) => '<li class="klt-' + s[0] + '"><a href="#' + sid + '"><i aria-hidden="true"></i><b>' + esc(t27(lang, 'lt_' + k)) + '</b><span>' + esc(t27(lang, s[1], s[2])) + '</span></a></li>').join('') +
    '</ul>' + nq + '<details class="klt-k"><summary>' + esc(t27(lang, 'lt_how')) + '</summary>' + keyHtml(lang) + '</details></div>';
}
// n30a (batch 30): the six states on their own, also used by the compare page (radar and one row per check)
export function light6(o) {
  const it = {}; for (const i of ((o.tp && o.tp.items) || [])) it[i.k] = i.st;
  const c = o.c || {}, ck = c.checks || {}, has = id => o.ids.includes(id);
  const P = [];
  // permit
  P.push(['permit', has('permits') ? 'permits' : 'legit', it.permitreg === 'yes' ? ['ok', 'p_reg'] : it.permit === 'yes' || o.pn ? ['ok', 'p_pub'] : ['no', 'p_no']]);
  // company: official register, else legal name published
  P.push(['company', has('developer') ? 'developer' : 'legit', it.register === 'yes' ? ['ok', 'c_reg'] : it.legal === 'yes' ? ['part', 'c_legal'] : it.legal === 'no' ? ['no', 'c_no'] : ['nc', 'c_nc']]);
  // handover date: the record first (kept, moved, past), then published or not
  const rec = it.record, past = +c.overdue || 0;
  let d;
  if (past > 0) d = ['no', 'd_past', { m: String(past) }];
  else if (rec === 'yes' && o.mv && !/completed/.test(String(c.stage || ''))) d = ['part', 'd_moved'];   // n40 k11: a later date is on record, so the date was not kept as first published
  else if (rec === 'yes') d = ['ok', /completed/.test(String(c.stage || '')) ? 'd_done' : 'd_kept'];
  else if (rec === 'part') d = ['part', /completed/.test(String(c.stage || '')) ? 'd_late' : 'd_moved'];
  else if (it.date === 'yes' || o.ho) d = ['ok', 'd_pub'];
  else d = ['no', 'd_no'];
  P.push(['date', 'delivery', d]);
  // construction: completed, satellite line, developer progress note
  const sat = c.sat && c.sat.status;
  P.push(['build', has('space') ? 'space' : 'delivery', /completed/.test(String(c.stage || '')) ? ['ok', 'b_done'] : sat === 'visible change' ? ['ok', 'b_sat'] : sat ? ['part', 'b_still'] : ck.progress != null || (o.ev && o.ev.progress) ? ['part', 'b_dev'] : ['nc', 'b_nc']]);
  // website health (only sites we monitor)
  const w = it.web; P.push(['web', has('web') ? 'web' : 'legit', w === 'yes' ? ['ok', 'w_yes'] : w === 'part' ? ['part', 'w_part'] : w === 'no' ? ['no', 'w_no'] : ['nc', 'w_nc']]);
  // official lists (public "no match" only; anything else is "not screened")
  const n = it.notices; P.push(['lists', 'legit', n === 'yes' ? ['ok', 'l_yes'] : n === 'part' ? ['ok', 'l_part'] : ['nc', 'l_nc']]);
  return P;
}

// n28b: the colour key as four rows, each with its own dot, then "facts, not a verdict" (split from the one sentence each language has)
function keyHtml(lang) {
  const P = String(t27(lang, 'lt_key')).split(/(?<=[.。])\s*/).map(x => x.trim()).filter(Boolean);
  if (P.length < 5) return '<p>' + esc(t27(lang, 'lt_key')) + '</p>';
  return '<ul class="klt-kl">' + ['ok', 'part', 'no', 'nc'].map((k, i) => '<li class="klt-' + k + '"><i aria-hidden="true"></i>' + esc(P[i]) + '</li>').join('') + '</ul><p>' + esc(P.slice(4).join(' ')) + '</p>';
}

// the "before you sign" checklist for the project's country: steps that apply everywhere, plus the official registers of that
// market as published on /registers/ (kbx_facets.js regFor). Ticks are kept in this browser only (localStorage, try/catch).
// n35b (batch 35, item 15): link to the per-project buyer journey under the checklist
const JL35 = { en: 'Buyer journey for this project, from reservation to handover', es: 'Ruta del comprador para este proyecto, de la reserva a la entrega', fr: 'Parcours d\'achat pour ce projet, de la réservation à la livraison', de: 'Käuferweg für dieses Projekt, von der Reservierung bis zur Übergabe', nl: 'Kopersroute voor dit project, van reservering tot oplevering', ru: 'Путь покупателя для этого проекта: от брони до передачи ключей', zh: '此项目的购房流程：从预订到交付', ar: 'رحلة المشتري لهذا المشروع، من الحجز إلى التسليم' };
export function checklistHtml(lang, o) {
  const co = o.co || '', L = [];
  L.push(esc(t27(lang, 'ck1', { co: '\u0000' })).replace('\u0000', bdi(lang, co)));
  if ((o.regs || []).length) for (const r of o.regs) L.push(esc(t27(lang, 'ck2r', { r: '\u0000' })).replace('\u0000', '<a href="' + esc(r.u) + '" rel="noopener nofollow" target="_blank"><bdi>' + esc(r.n) + '</bdi></a>'));
  else L.push(esc(t27(lang, 'ck2')) + ' <a href="/registers/">kolaboro.com/registers</a>');
  for (const k of ['ck3', 'ck4', 'ck5', 'ck6', 'ck7']) L.push(esc(t27(lang, k)) + (k === 'ck5' ? ' <a href="' + pre(lang) + '/tools/contract-reader/">' + esc(t30(lang, 'cr_h1')) + '</a>' : ''));   // n30a: the contract reader
  L.push(esc(t27(lang, 'ck8', { co: '\u0000' })).replace('\u0000', bdi(lang, co)) + (o.cost ? ' <a href="#buycost">' + esc(o.costLbl || '') + '</a>' : ''));
  return '<div class="kck" data-u27k="' + esc(o.id) + '"><h3>' + esc(t27(lang, 'ck_h', { co })) + '</h3><p class="ki">' + esc(t27(lang, 'ck_i')) + ' <span class="kck-n" data-n="' + esc(t27(lang, 'ck_n')) + '" aria-live="polite"></span></p><ol class="kck-l">' +
    L.map((h, i) => '<li><label><input type="checkbox" value="' + i + '"><span>' + h + '</span></label></li>').join('') + '</ol><button type="button" class="kck-r" hidden>' + esc(t27(lang, 'ck_r')) + '</button>' + (o.s ? '<p class="kck-j"><a href="' + pre(lang) + '/projects/' + o.s + '/journey/">' + esc(JL35[lang] || JL35.en) + '</a></p>' : '') + '</div>';
}

// CSS for the two levels, the light and the checklist (inline: the light is above the fold); print opens everything
export const Z_CSS = '';   // n40 k10: moved to /k/kp.css (one cached file for every named page)

// ------------------------------------------------------------------------------------------------ the client script
// Served as one cached file. It is a self-contained function (no closure variables): fold/open/print, the currency selector, the cost and
// yield calculator, the checklist ticks, compare checkboxes on /projects/, suggestions in the home search box and the map page.
function client() {
  var LG = (document.documentElement.lang || 'en').slice(0, 2), PRE = LG === 'en' ? '' : '/' + LG;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  var W = {
    en: { oa: 'Open all sections', ca: 'Close all sections', cu: 'Show prices in', cuo: 'as published', cun: 'Converted at the European Central Bank reference rate of {d}. The price as published stays the reference.', cuf: 'Rates could not load right now.',
      kh: 'Your figures: total cost and yield', kp: 'Purchase price', kr: 'Expected rent per month', kc: 'Yearly running costs (service charge, management, insurance)', km: 'Months rented per year', kt: 'Taxes and fees ({c})', kt0: 'Taxes and fees (your own figure)',
      ktot: 'Total cost to buy', kg: 'Gross yield', kn: 'Net yield after running costs', kno: 'Your own figures, worked out in your browser. Not a forecast and not advice; nothing is sent or stored. The rent is your estimate, not the developer’s.', ke: 'Tax rows could not load. Add your own figure.',
      cmp: 'Compare', cms: '{k} selected', cmg: 'Compare side by side', cmx: 'Up to 4 projects', cmc: 'Clear', sg: 'Suggestions', sgd: 'Developer', sgp: '{k} projects', mpk: '{k} projects in this view', mpa: '{k} more in {m}, without a published address', mpo: 'Open', mpm: 'Show more', mpe: 'The map did not load. The list below still works.' },
    es: { oa: 'Abrir todas las secciones', ca: 'Cerrar todas las secciones', cu: 'Ver precios en', cuo: 'como se publica', cun: 'Convertido al tipo de referencia del Banco Central Europeo del {d}. El precio publicado sigue siendo la referencia.', cuf: 'No se pudieron cargar los tipos de cambio.',
      kh: 'Tus cifras: coste total y rentabilidad', kp: 'Precio de compra', kr: 'Alquiler esperado al mes', kc: 'Gastos anuales (comunidad, gestión, seguro)', km: 'Meses alquilado al año', kt: 'Impuestos y gastos ({c})', kt0: 'Impuestos y gastos (tu propia cifra)',
      ktot: 'Coste total de compra', kg: 'Rentabilidad bruta', kn: 'Rentabilidad neta tras gastos', kno: 'Tus propias cifras, calculadas en tu navegador. No es una previsión ni un consejo; no se envía ni se guarda nada. El alquiler es tu estimación, no la del promotor.', ke: 'No se pudieron cargar los impuestos. Pon tu propia cifra.',
      cmp: 'Comparar', cms: '{k} seleccionados', cmg: 'Comparar lado a lado', cmx: 'Hasta 4 proyectos', cmc: 'Borrar', sg: 'Sugerencias', sgd: 'Promotora', sgp: '{k} proyectos', mpk: '{k} proyectos en esta vista', mpa: '{k} más en {m}, sin dirección publicada', mpo: 'Abrir', mpm: 'Ver más', mpe: 'El mapa no se pudo cargar. La lista de abajo sigue funcionando.' },
    fr: { oa: 'Ouvrir toutes les sections', ca: 'Fermer toutes les sections', cu: 'Afficher les prix en', cuo: 'tel que publié', cun: 'Converti au taux de référence de la Banque centrale européenne du {d}. Le prix publié reste la référence.', cuf: 'Les taux n’ont pas pu être chargés.',
      kh: 'Vos chiffres : coût total et rendement', kp: 'Prix d’achat', kr: 'Loyer attendu par mois', kc: 'Charges annuelles (copropriété, gestion, assurance)', km: 'Mois loués par an', kt: 'Taxes et frais ({c})', kt0: 'Taxes et frais (votre propre chiffre)',
      ktot: 'Coût total d’achat', kg: 'Rendement brut', kn: 'Rendement net après charges', kno: 'Vos propres chiffres, calculés dans votre navigateur. Ni une prévision ni un conseil ; rien n’est envoyé ni enregistré. Le loyer est votre estimation, pas celle du promoteur.', ke: 'Les taxes n’ont pas pu être chargées. Saisissez votre propre chiffre.',
      cmp: 'Comparer', cms: '{k} sélectionnés', cmg: 'Comparer côte à côte', cmx: 'Jusqu’à 4 projets', cmc: 'Effacer', sg: 'Suggestions', sgd: 'Promoteur', sgp: '{k} projets', mpk: '{k} projets dans cette vue', mpa: '{k} de plus à {m}, sans adresse publiée', mpo: 'Ouvrir', mpm: 'Voir plus', mpe: 'La carte n’a pas pu être chargée. La liste ci-dessous fonctionne toujours.' },
    de: { oa: 'Alle Abschnitte öffnen', ca: 'Alle Abschnitte schließen', cu: 'Preise anzeigen in', cuo: 'wie veröffentlicht', cun: 'Umgerechnet zum Referenzkurs der Europäischen Zentralbank vom {d}. Maßgeblich bleibt der veröffentlichte Preis.', cuf: 'Die Kurse konnten gerade nicht geladen werden.',
      kh: 'Ihre Zahlen: Gesamtkosten und Rendite', kp: 'Kaufpreis', kr: 'Erwartete Miete pro Monat', kc: 'Jährliche laufende Kosten (Hausgeld, Verwaltung, Versicherung)', km: 'Vermietete Monate pro Jahr', kt: 'Steuern und Gebühren ({c})', kt0: 'Steuern und Gebühren (eigener Betrag)',
      ktot: 'Gesamtkosten des Kaufs', kg: 'Bruttorendite', kn: 'Nettorendite nach laufenden Kosten', kno: 'Ihre eigenen Zahlen, im Browser berechnet. Keine Prognose und keine Beratung; nichts wird gesendet oder gespeichert. Die Miete ist Ihre Schätzung, nicht die des Bauträgers.', ke: 'Die Steuerzeilen konnten nicht geladen werden. Tragen Sie einen eigenen Betrag ein.',
      cmp: 'Vergleichen', cms: '{k} ausgewählt', cmg: 'Nebeneinander vergleichen', cmx: 'Bis zu 4 Projekte', cmc: 'Leeren', sg: 'Vorschläge', sgd: 'Bauträger', sgp: '{k} Projekte', mpk: '{k} Projekte in dieser Ansicht', mpa: '{k} weitere in {m}, ohne veröffentlichte Adresse', mpo: 'Öffnen', mpm: 'Mehr zeigen', mpe: 'Die Karte konnte nicht geladen werden. Die Liste unten funktioniert weiter.' },
    nl: { oa: 'Alle secties openen', ca: 'Alle secties sluiten', cu: 'Prijzen tonen in', cuo: 'zoals gepubliceerd', cun: 'Omgerekend tegen de referentiekoers van de Europese Centrale Bank van {d}. De gepubliceerde prijs blijft de referentie.', cuf: 'De koersen konden nu niet laden.',
      kh: 'Uw cijfers: totale kosten en rendement', kp: 'Koopprijs', kr: 'Verwachte huur per maand', kc: 'Jaarlijkse kosten (servicekosten, beheer, verzekering)', km: 'Maanden verhuurd per jaar', kt: 'Belastingen en kosten ({c})', kt0: 'Belastingen en kosten (uw eigen bedrag)',
      ktot: 'Totale aankoopkosten', kg: 'Brutorendement', kn: 'Nettorendement na kosten', kno: 'Uw eigen cijfers, berekend in uw browser. Geen voorspelling en geen advies; er wordt niets verzonden of opgeslagen. De huur is uw schatting, niet die van de ontwikkelaar.', ke: 'De belastingregels konden niet laden. Vul uw eigen bedrag in.',
      cmp: 'Vergelijken', cms: '{k} geselecteerd', cmg: 'Naast elkaar vergelijken', cmx: 'Tot 4 projecten', cmc: 'Wissen', sg: 'Suggesties', sgd: 'Ontwikkelaar', sgp: '{k} projecten', mpk: '{k} projecten in deze weergave', mpa: 'nog {k} in {m}, zonder gepubliceerd adres', mpo: 'Openen', mpm: 'Meer tonen', mpe: 'De kaart kon niet laden. De lijst hieronder werkt nog.' },
    ru: { oa: 'Открыть все разделы', ca: 'Свернуть все разделы', cu: 'Цены в валюте', cuo: 'как опубликовано', cun: 'Пересчитано по справочному курсу Европейского центрального банка на {d}. Опорной остаётся опубликованная цена.', cuf: 'Курсы сейчас не загрузились.',
      kh: 'Ваши цифры: полная стоимость и доходность', kp: 'Цена покупки', kr: 'Ожидаемая аренда в месяц', kc: 'Годовые расходы (обслуживание, управление, страховка)', km: 'Месяцев аренды в году', kt: 'Налоги и сборы ({c})', kt0: 'Налоги и сборы (ваша сумма)',
      ktot: 'Полная стоимость покупки', kg: 'Валовая доходность', kn: 'Чистая доходность после расходов', kno: 'Ваши собственные цифры, расчёт в браузере. Это не прогноз и не совет; ничего не отправляется и не сохраняется. Аренда: это ваша оценка, а не застройщика.', ke: 'Налоги не загрузились. Укажите свою сумму.',
      cmp: 'Сравнить', cms: 'Выбрано: {k}', cmg: 'Сравнить рядом', cmx: 'Не больше 4 проектов', cmc: 'Сбросить', sg: 'Подсказки', sgd: 'Застройщик', sgp: 'Проектов: {k}', mpk: 'Проектов в этой области: {k}', mpa: 'Ещё в {m} без опубликованного адреса: {k}', mpo: 'Открыть', mpm: 'Показать ещё', mpe: 'Карта не загрузилась. Список ниже работает.' },
    zh: { oa: '展开全部章节', ca: '收起全部章节', cu: '价格显示为', cuo: '按公布币种', cun: '按欧洲中央银行 {d} 的参考汇率换算。以公布的价格为准。', cuf: '暂时无法加载汇率。',
      kh: '按您的数字：总成本和收益率', kp: '购买价格', kr: '预计月租金', kc: '每年运营成本（物业费、管理费、保险）', km: '每年出租月数', kt: '税费（{c}）', kt0: '税费（您自己的数字）',
      ktot: '购买总成本', kg: '毛收益率', kn: '扣除运营成本后的净收益率', kno: '这是您自己的数字，在浏览器中计算。不是预测，也不是建议；不发送也不保存任何内容。租金是您的估计，不是开发商的。', ke: '无法加载税费，请填写您自己的数字。',
      cmp: '对比', cms: '已选 {k} 个', cmg: '并排对比', cmx: '最多 4 个项目', cmc: '清除', sg: '建议', sgd: '开发商', sgp: '{k} 个项目', mpk: '此视图中有 {k} 个项目', mpa: '{m} 另有 {k} 个项目未公布地址', mpo: '打开', mpm: '显示更多', mpe: '地图未能加载，下方列表仍可使用。' },
    ar: { oa: 'افتح كل الأقسام', ca: 'أغلق كل الأقسام', cu: 'اعرض الأسعار بـ', cuo: 'كما نُشرت', cun: 'محوَّل بسعر الصرف المرجعي للبنك المركزي الأوروبي بتاريخ {d}. يبقى السعر المنشور هو المرجع.', cuf: 'تعذّر تحميل أسعار الصرف الآن.',
      kh: 'أرقامك: التكلفة الإجمالية والعائد', kp: 'سعر الشراء', kr: 'الإيجار المتوقع شهريًا', kc: 'التكاليف السنوية (رسوم الخدمة، الإدارة، التأمين)', km: 'أشهر الإيجار في السنة', kt: 'الضرائب والرسوم ({c})', kt0: 'الضرائب والرسوم (رقمك الخاص)',
      ktot: 'التكلفة الإجمالية للشراء', kg: 'العائد الإجمالي', kn: 'العائد الصافي بعد التكاليف', kno: 'أرقامك الخاصة، محسوبة في متصفحك. ليست توقعًا ولا نصيحة؛ لا يُرسل شيء ولا يُحفظ. الإيجار تقديرك أنت لا تقدير المطوّر.', ke: 'تعذّر تحميل الضرائب. أدخل رقمك الخاص.',
      cmp: 'قارن', cms: 'المحدد: {k}', cmg: 'قارن جنبًا إلى جنب', cmx: 'حتى 4 مشاريع', cmc: 'مسح', sg: 'اقتراحات', sgd: 'المطوّر', sgp: 'عدد المشاريع: {k}', mpk: 'عدد المشاريع في هذا العرض: {k}', mpa: 'مشاريع أخرى في {m} بلا عنوان منشور: {k}', mpo: 'افتح', mpm: 'اعرض المزيد', mpe: 'تعذّر تحميل الخريطة. القائمة أدناه ما زالت تعمل.' }
  };
  // n28b (14 Nov 2026): loading line of the calculator, empty map result and its reset
  var W2 = { en: { kld: 'Loading the taxes and fees…', mp0: 'No project matches these filters.', mpr: 'Clear filters' },
    es: { kld: 'Cargando impuestos y gastos…', mp0: 'Ningún proyecto cumple estos filtros.', mpr: 'Quitar filtros' },
    fr: { kld: 'Chargement des taxes et frais…', mp0: 'Aucun projet ne correspond à ces filtres.', mpr: 'Effacer les filtres' },
    de: { kld: 'Steuern und Gebühren werden geladen…', mp0: 'Kein Projekt passt zu diesen Filtern.', mpr: 'Filter zurücksetzen' },
    nl: { kld: 'Belastingen en kosten laden…', mp0: 'Geen project past bij deze filters.', mpr: 'Filters wissen' },
    ru: { kld: 'Загружаем налоги и сборы…', mp0: 'Ни один проект не подходит под эти фильтры.', mpr: 'Сбросить фильтры' },
    zh: { kld: '正在加载税费…', mp0: '没有符合这些筛选条件的项目。', mpr: '清除筛选' },
    ar: { kld: 'جارٍ تحميل الضرائب والرسوم…', mp0: 'لا يوجد مشروع يطابق هذه المرشحات.', mpr: 'امسح المرشحات' } };
  for (var w2 in W2) for (var w3 in W2[w2]) W[w2][w3] = W2[w2][w3];
  // n40 k9: singular for a count of 1 (developer and market suggestions, map count)
  var W1 = { en: ['1 project', '1 project in this view'], es: ['1 proyecto', '1 proyecto en esta vista'], fr: ['1 projet', '1 projet dans cette vue'], de: ['1 Projekt', '1 Projekt in dieser Ansicht'], nl: ['1 project', '1 project in deze weergave'], ru: ['1 проект', '1 проект в этой области'], zh: ['1 个项目', '此视图中有 1 个项目'], ar: ['مشروع واحد', 'مشروع واحد في هذا العرض'] };
  for (var w1 in W1) { W[w1].sgp1 = W1[w1][0]; W[w1].mpk1 = W1[w1][1]; }
  var T = W[LG] || W.en, f = function (k, v) { var s = T[k] || W.en[k]; if (v) for (var a in v) s = s.split('{' + a + '}').join(v[a]); return s; };
  var LOC = { en: 'en-GB', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' }[LG] || 'en-GB';
  var nf = function (n, d) { try { return Number(n).toLocaleString(LOC, { maximumFractionDigits: d || 0, numberingSystem: 'latn' }); } catch (e) { return String(Math.round(n)); } };

  // ---------------------------------------------------------------- two-level project page
  var Z = document.querySelectorAll('details.kz-d');
  if (Z.length) {
    var openFor = function (id) { if (!id) return; var t = null; try { t = document.getElementById(decodeURIComponent(id)); } catch (e) {} if (!t) return; var d = t.closest ? t.closest('details') : null; while (d) { d.open = true; d = d.parentElement && d.parentElement.closest ? d.parentElement.closest('details') : null; } if (t.matches && t.matches('section.kz')) { var dd = t.querySelector('details.kz-d'); if (dd) dd.open = true; } };
    openFor(location.hash.slice(1));
    addEventListener('hashchange', function () { openFor(location.hash.slice(1)); });
    document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return; var id = a.getAttribute('href').slice(1); openFor(id);
      // n28b: sections below the fold are laid out only when they come near, so a long jump can stop short or overshoot: check where it landed and correct once
      var t = null; try { t = document.getElementById(decodeURIComponent(id)); } catch (x) {} if (!t || a.closest('summary')) return; var done = false;
      var fix = function () { if (done) return; done = true; var y = t.getBoundingClientRect().top; if (y < 0 || y > innerHeight * 0.5) t.scrollIntoView({ block: 'start', behavior: 'instant' }); };
      if ('onscrollend' in window) { addEventListener('scrollend', fix, { once: true }); setTimeout(function () { done = true; }, 3000); } else setTimeout(fix, 1200); }, true);
    var toc = document.querySelector('.kwrap>.ktoc'), all = el('button', 'kz-all', f('oa')); all.type = 'button'; all.setAttribute('aria-expanded', 'false');
    all.addEventListener('click', function () { var o = all.getAttribute('aria-expanded') !== 'true'; if (o) document.documentElement.classList.add('kb-h'); Z.forEach(function (d) { d.open = o; }); all.setAttribute('aria-expanded', o ? 'true' : 'false'); all.textContent = f(o ? 'ca' : 'oa'); });
    var first = document.querySelector('.kwrap>section.kz'); if (first) first.parentNode.insertBefore(all, first);
    var was = []; addEventListener('beforeprint', function () { was = []; document.querySelectorAll('details').forEach(function (d) { was.push([d, d.open]); d.open = true; }); });
    addEventListener('afterprint', function () { was.forEach(function (p) { p[0].open = p[1]; }); was = []; });
    if (toc) toc.setAttribute('data-kz', '1');
  }

  // ---------------------------------------------------------------- project data (price, currency, country) from the light
  var LT = document.querySelector('[data-u27]'), D = null; try { D = LT && JSON.parse(LT.getAttribute('data-u27')); } catch (e) { D = null; }
  var FX = null, FXP = null, ECB = ['USD', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'THB', 'IDR', 'MYR', 'PHP', 'MXN', 'TRY', 'SGD', 'HKD', 'CNY', 'INR', 'BRL', 'ZAR', 'NZD', 'KRW', 'CZK', 'PLN', 'SEK', 'NOK', 'DKK', 'HUF', 'RON', 'ISK', 'ILS', 'BGN'];
  function rates(list) {   // ECB reference rates per EUR (AED from the USD peg), last 20 days, cached by the worker for 12 h
    var need = list.filter(function (c) { return c && c !== 'EUR'; }).map(function (c) { return c === 'AED' ? 'USD' : c; }).filter(function (c, i, a) { return ECB.indexOf(c) >= 0 && a.indexOf(c) === i; }).slice(0, 6);
    if (FXP && need.every(function (c) { return FX ? FX[c] : FXP.want.indexOf(c) >= 0; })) return FXP;
    if (FX) need = need.concat(['USD', 'GBP', 'AED', 'IDR', 'THB'].filter(function (c) { return FX[c] && need.indexOf(c) < 0; })).filter(function (c, i, a) { return ECB.indexOf(c) >= 0 && a.indexOf(c) === i; }).slice(0, 6);
    var from = new Date(Date.now() - 20 * 864e5).toISOString().slice(0, 10);
    FXP = fetch('/api/x/x/fx?c=' + (need.length ? need.join(',') : 'USD') + '&from=' + from).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j || !j.rates || !j.dates || !j.dates.length) return null;
      var o = { EUR: 1, d: j.dates[j.dates.length - 1] }; for (var k in j.rates) { var a = j.rates[k]; for (var i = a.length - 1; i >= 0; i--) if (a[i] != null) { o[k] = a[i]; break; } }
      if (o.USD) o.AED = o.USD * 3.6725; FX = o; return o;
    }).catch(function () { FXP = null; return null; });
    FXP.want = need;
    return FXP;
  }
  function conv(v, from, to) { if (!FX || from === to) return from === to ? v : null; var a = FX[from], b = FX[to]; return a && b ? v / a * b : null; }
  function money(c, v) { return (c ? c + ' ' : '') + nf(v); }

  if (D && D.c) {
    var cst = el('style'); cst.textContent = '.kcu{margin:0 0 12px}.kcu label{display:inline-flex;flex-wrap:wrap;align-items:center;gap:8px;font-weight:600}.kcu select,.kca input{box-sizing:border-box;min-height:44px;padding:0 12px;border:1.5px solid var(--line,#d5d3cc);border-radius:10px;background:var(--paper,#fff);color:inherit;font:inherit;font-weight:500}.kcu select:focus-visible,.kca input:focus-visible{outline:3px solid var(--k-sea,#155C75);outline-offset:1px}' +
      '.kca{margin:18px 0 6px;padding:16px;border:1px solid var(--line,#d5d3cc);border-radius:14px;background:var(--card,var(--paper,#fff))}.kca h3{margin:0 0 12px}.kca label{display:flex;flex-direction:column;gap:4px;margin:0 0 12px;font-weight:600;font-size:.9rem}.kca input{width:100%;max-width:360px}' +
      '.kca-r{list-style:none;margin:0 0 12px;padding:0}.kca-r li{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid var(--line,#d5d3cc);font-size:.9rem}.kca-r b{white-space:nowrap;font-variant-numeric:tabular-nums}.kca-o{display:grid;grid-template-columns:auto auto;justify-content:start;gap:6px 16px;margin:6px 0 10px}.kca-o dt{color:var(--ink-2)}.kca-o dd{margin:0;font-weight:700;font-variant-numeric:tabular-nums}';
    document.head.appendChild(cst);
    // currency selector next to the prices as published (kept in this browser, key shared with the older price-band converter)
    var host = document.querySelector('#promise .kz-d') || document.querySelector('#promise');
    if (host && D.p > 0) {
      var box = el('div', 'kcu'), lab = el('label', null, f('cu') + ' '), sel = el('select'), out = el('p', 'kcu-o'); out.setAttribute('aria-live', 'polite');
      // n29i (item 87): a reader's usual currency by page language is offered and pre-selected until they pick one (stored choice wins)
      var DEF = { es: 'EUR', fr: 'EUR', de: 'EUR', nl: 'EUR', ru: 'USD', zh: 'CNY', ar: 'AED' }[LG];
      var opts = [D.c].concat(['EUR', 'USD', 'GBP', 'AED'].concat(DEF && ['EUR', 'USD', 'GBP', 'AED'].indexOf(DEF) < 0 ? [DEF] : []).filter(function (c) { return c !== D.c; }));
      opts.forEach(function (c, i) { var o = el('option', null, c + (i === 0 ? ' (' + f('cuo') + ')' : '')); o.value = c; sel.appendChild(o); });
      var saved = ls('kb-cur'); if (saved && opts.indexOf(saved) >= 0) sel.value = saved; else if (DEF && opts.indexOf(DEF) >= 0) sel.value = DEF;
      lab.appendChild(sel); box.appendChild(lab); box.appendChild(out);
      var sum = host.querySelector('summary'); if (sum && sum.nextSibling) host.insertBefore(box, sum.nextSibling); else host.appendChild(box);
      var show = function () {
        var to = sel.value; if (!show.auto) ls('kb-cur', to); show.auto = false;
        if (to === D.c) { out.textContent = ''; return; }
        rates([D.c, to]).then(function () { if (!FX) { out.textContent = f('cuf'); return; } var a = conv(D.p, D.c, to), b = D.p2 ? conv(D.p2, D.c, to) : null; if (a == null) { out.textContent = f('cuf'); return; }
          out.textContent = '≈ ' + money(to, Math.round(a)) + (b ? ' - ' + money(to, Math.round(b)) : '') + ' · ' + money(D.c, D.p) + (D.p2 ? ' - ' + money(D.c, D.p2) : '') + '. ' + f('cun', { d: FX.d }); });
      };
      sel.addEventListener('change', show); if (sel.value !== D.c) { show.auto = !saved; show(); }
    }
    // total cost and yield calculator (rows from /api/v1/cost, the same functions as the table on the page)
    var ch = document.querySelector('#buycost .kz-d') || document.querySelector('#promise .kz-d');
    if (ch) {
      var C = el('div', 'kca'), h = el('h3', null, f('kh')); C.appendChild(h);
      var fld = function (k, v, step) { var l = el('label'), s = el('span', null, f(k)), i = el('input'); i._lab = s; i._k = k; i.type = 'number'; i.min = '0'; i.step = step || 'any'; i.inputMode = 'decimal'; if (v) i.value = v; l.appendChild(s); l.appendChild(i); C.appendChild(l); return i; };
      var iP = fld('kp', D.p > 0 ? D.p : '', '1000'), iT = null, iR = fld('kr', '', '50'), iC = fld('kc', '', '100'), iM = fld('km', '12', '1');
      iM.max = '12';
      var rowsEl = el('ul', 'kca-r'), res = el('dl', 'kca-o'); res.setAttribute('aria-live', 'polite');
      C.insertBefore(rowsEl, iR.parentNode); C.appendChild(res); C.appendChild(el('p', 'k-small', f('kno')));
      ch.appendChild(C);
      var tax = 0, cur = D.c || '', tm = null, ask = 0;
      var relabel = function () { [iP, iR, iC].forEach(function (i) { i._lab.textContent = f(i._k) + (cur ? ' (' + cur + ')' : ''); }); };
      relabel();
      var calc = function () {
        var p = +iP.value || 0, t = iT ? (+iT.value || 0) : tax, tot = p + t, r = (+iR.value || 0) * Math.min(12, Math.max(0, +iM.value || 0)), c = +iC.value || 0;
        res.innerHTML = ''; var add = function (k, v) { var dt = el('dt', null, f(k)), dd = el('dd', null, v); res.appendChild(dt); res.appendChild(dd); };
        if (p > 0) add('ktot', money(cur, Math.round(tot)));
        if (p > 0 && r > 0) { add('kg', nf(r / tot * 100, 1) + ' %'); add('kn', nf((r - c) / tot * 100, 1) + ' %'); }
      };
      var rows = function () {
        var p = +iP.value || 0, n = ++ask;
        if (!rowsEl.children.length) rowsEl.appendChild(el('li', 'k-small', f('kld')));
        fetch('/api/v1/cost?id=' + encodeURIComponent(D.id) + '&p=' + Math.round(p) + '&lang=' + LG).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
          if (n !== ask) return;
          rowsEl.innerHTML = '';
          if (!j || !j.calc) { if (!iT) { iT = fld('kt0', '', '100'); C.insertBefore(iT.parentNode, rowsEl); iT.addEventListener('input', calc); } tax = 0; calc(); return; }
          if (j.calc.cur !== cur && !iP._cv) {   // the country's tax rows are in another currency than the published price: convert once (ECB)
            iP._cv = 1; var pv = +iP.value || 0;
            rates([cur, j.calc.cur]).then(function () { var v = pv ? conv(pv, cur, j.calc.cur) : null; cur = j.calc.cur; relabel(); iP.value = v ? Math.round(v) : ''; rows(); });
            return;
          }
          cur = j.calc.cur; tax = 0;
          j.calc.rows.forEach(function (x) { var li = el('li'); li.appendChild(el('span', null, x.label + ' (' + x.rate + ')')); li.appendChild(el('b', null, x.amount != null ? money(cur, x.amount) : '-')); rowsEl.appendChild(li); if (x.amount) tax += x.amount; });
          if (j.calc.part) rowsEl.appendChild(el('li', 'k-small', j.calc.part));
          h.textContent = f('kh'); calc();
        }).catch(function () { rowsEl.innerHTML = ''; rowsEl.appendChild(el('li', 'k-small', f('ke'))); calc(); });
      };
      iP.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(rows, 350); calc(); });
      [iR, iC, iM].forEach(function (i) { i.addEventListener('input', calc); });
      var started = false, go = function () { if (started) return; started = true; rows(); };
      var dd0 = ch.closest('details') || ch; if (dd0.open) go(); else dd0.addEventListener('toggle', function () { if (dd0.open) go(); });
    }
  }

  // ---------------------------------------------------------------- checklist ticks (this browser only)
  document.querySelectorAll('[data-u27k]').forEach(function (K) {
    var key = 'kb-ck27-' + K.getAttribute('data-u27k'), I = K.querySelectorAll('input[type=checkbox]'), n = K.querySelector('.kck-n'), rb = K.querySelector('.kck-r'), st = {};
    try { st = JSON.parse(ls(key) || '{}') || {}; } catch (e) { st = {}; }
    var upd = function () { var a = 0; I.forEach(function (i) { if (i.checked) a++; }); if (n) n.textContent = a ? n.getAttribute('data-n').replace('{a}', a).replace('{b}', I.length) : ''; if (rb) rb.hidden = !a; };
    I.forEach(function (i) { i.checked = !!st[i.value]; i.addEventListener('change', function () { if (i.checked) st[i.value] = 1; else delete st[i.value]; ls(key, Object.keys(st).length ? JSON.stringify(st) : null); upd(); }); });
    if (rb) rb.addEventListener('click', function () { st = {}; ls(key, null); I.forEach(function (i) { i.checked = false; }); upd(); });
    upd();
  });

  // ---------------------------------------------------------------- /projects/: compare checkboxes (up to 3) and a bar that opens /compare/?p=
  var LISTS = document.querySelector('[data-kx-lists]');
  if (LISTS && /\/projects\/?$/.test(location.pathname)) {
    var sel3 = [], bar = el('div', 'kcm'), bt = el('span', 'kcm-t'), go2 = el('a', 'kcm-g', f('cmg')), clr = el('button', 'kcm-c', f('cmc'));
    try { var s0 = JSON.parse(sessionStorage.getItem('kb-cmp3') || '[]'); if (Array.isArray(s0)) sel3 = s0.filter(function (v) { return /^[a-z0-9-]{1,90}$/.test(v); }).slice(0, 4); } catch (e) {}
    clr.type = 'button'; go2.href = PRE + '/compare/'; bar.hidden = true;   /* n31t: an <a> always has an href (crawlable anchors) */
     bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', f('cmp')); bar.appendChild(bt); bar.appendChild(go2); bar.appendChild(clr); document.body.appendChild(bar);
    var css = el('style'); css.textContent = '.kcmb{position:absolute;z-index:1;inset-inline-start:-10px;top:50%;margin-top:-22px;display:flex;align-items:center;justify-content:center;width:44px;height:44px;cursor:pointer}[data-kx-lists] .lk li,.kf-out li{position:relative;padding-inline-start:34px}[data-kx-lists] .lk li>a::after,.kf-out li>a::after{content:"";position:absolute;inset:0}.kcm-on .mcta{display:none!important}body.kcm-on{padding-bottom:150px}.kcmb input{width:24px;height:24px;margin:0;cursor:pointer}.kcm{position:fixed;inset-inline:12px;bottom:12px;z-index:60;display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;justify-content:center;max-width:640px;margin:0 auto;padding:10px 14px;border-radius:14px;background:var(--ink,#17212B);color:#fff;box-shadow:0 12px 30px rgba(23,33,43,.3)}.kcm[hidden]{display:none}.kcm-t{font-weight:700}.kcm-g{display:inline-flex;align-items:center;min-height:44px;padding:0 14px;border-radius:10px;background:#fff;color:#17212B;font-weight:700;text-decoration:none}.kcm-g[aria-disabled=true]{opacity:.55;pointer-events:none}.kcm-c{min-height:44px;border:0;background:none;color:#fff;text-decoration:underline;font:inherit;cursor:pointer}';
    document.head.appendChild(css);
    var slugOf = function (a) { var m = /\/projects\/([a-z0-9-]+)\/?$/.exec(a.getAttribute('href') || ''); return m ? m[1] : null; };
    var refresh = function () {
      try { if (sel3.length) sessionStorage.setItem('kb-cmp3', JSON.stringify(sel3)); else sessionStorage.removeItem('kb-cmp3'); } catch (e) {}
      document.body.classList.toggle('kcm-on', sel3.length > 0);
      bar.hidden = !sel3.length; bt.textContent = f('cms', { k: sel3.length }) + (sel3.length >= 4 ? ' · ' + f('cmx') : '');
      go2.href = PRE + '/compare/?p=' + sel3.join(','); go2.setAttribute('aria-disabled', sel3.length < 2 ? 'true' : 'false');
      document.querySelectorAll('.kcmb input').forEach(function (i) { i.checked = sel3.indexOf(i.value) >= 0; i.disabled = !i.checked && sel3.length >= 4; i.parentNode.title = i.disabled ? f('cmx') : ''; });
    };
    var add = function (li) {
      if (li.querySelector('.kcmb')) return; var a = li.querySelector('a[href*="/projects/"]'); if (!a) return; var s = slugOf(a); if (!s) return;
      var w = el('label', 'kcmb'), i = el('input'); i.type = 'checkbox'; i.value = s; i.setAttribute('aria-label', f('cmp') + ': ' + a.textContent); w.appendChild(i); li.insertBefore(w, li.firstChild);
      if (sel3.indexOf(s) >= 0) i.checked = true; if (!i.checked && sel3.length >= 4) { i.disabled = true; w.title = f('cmx'); }
    };
    document.addEventListener('change', function (e) { var i = e.target; if (!i.closest || !i.closest('.kcmb')) return; var k = sel3.indexOf(i.value); if (i.checked && k < 0 && sel3.length < 4) sel3.push(i.value); if (!i.checked && k >= 0) sel3.splice(k, 1); refresh(); });
    clr.addEventListener('click', function () { sel3 = []; refresh(); });
    go2.addEventListener('click', function (e) { if (sel3.length < 2) e.preventDefault(); });   // aria-disabled alone does not stop Enter on a link
    bt.setAttribute('aria-live', 'polite');
    var LI = Array.prototype.slice.call(LISTS.querySelectorAll('.lk li')), pos = 0;
    var chunk = function (dl) { var end = Math.min(LI.length, pos + 250); for (; pos < end; pos++) add(LI[pos]); if (pos < LI.length) (window.requestIdleCallback || function (fn) { setTimeout(fn, 40); })(chunk); };
    (window.requestIdleCallback || function (fn) { setTimeout(fn, 200); })(chunk);
    if (sel3.length) refresh();
    var kf = document.querySelector('.kf-out'); if (kf && window.MutationObserver) new MutationObserver(function () { kf.querySelectorAll('li').forEach(add); }).observe(kf, { childList: true });
  }

  // ---------------------------------------------------------------- home: suggestions in the "check a project" box
  var HQ = document.querySelector('form[data-check] #hero-url');
  if (HQ) {
    var F2 = HQ.form, ul = el('ul', 'khs'), IX = null, P = null, act = -1;
    ul.id = 'khs-l'; ul.setAttribute('role', 'listbox'); ul.setAttribute('aria-label', f('sg')); ul.hidden = true; F2.style.position = 'relative'; F2.appendChild(ul);
    HQ.setAttribute('role', 'combobox'); HQ.setAttribute('aria-autocomplete', 'list'); HQ.setAttribute('aria-controls', 'khs-l'); HQ.setAttribute('aria-expanded', 'false'); HQ.setAttribute('autocomplete', 'off');
    var st2 = el('style'); st2.textContent = '.khs{position:absolute;inset-inline:0;top:calc(100% + 6px);z-index:40;list-style:none;margin:0;padding:6px;background:#fff;color:#17212B;border:1px solid rgba(23,33,43,.15);border-radius:14px;box-shadow:0 16px 40px rgba(23,33,43,.22);max-height:min(60vh,380px);overflow:auto;text-align:start}.khs li a{display:block;padding:10px 12px;border-radius:10px;color:inherit;text-decoration:none}.khs li[aria-selected=true] a,.khs li a:hover{background:#F1EFE9}.khs b{display:block;font-weight:700}.khs small{display:block;color:#59626B;font-size:.82rem}';
    document.head.appendChild(st2);
    var norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^0-9a-zЀ-ӿ؀-ۿ一-鿿]+/g, ' ').trim(); };
    var load = function () { if (P) return P; P = fetch('/api/v1/search-index').then(function (r) { return r.json(); }).then(function (d) {
      IX = (d.p || []).map(function (p) { return { u: PRE + '/projects/' + p[0] + '/', n: p[1], sub: [p[3], p[7] || p[5], p[6]].filter(Boolean).join(' · '), h: ' ' + norm(p[1] + ' ' + p[3] + ' ' + p[5] + ' ' + p[6] + ' ' + p[7]), w: 0 }; })
        .concat((d.d || []).map(function (x) { return { u: PRE + '/developers/' + x[0] + '/', n: x[1], sub: f('sgd') + ' · ' + (+x[2] === 1 ? f('sgp1') : f('sgp', { k: x[2] })) + (x[3] ? ' · ' + x[3] : ''), h: ' ' + norm(x[1] + ' ' + x[3]), w: 1 }; }));
      var MK = {}; (d.p || []).forEach(function (p) { if (!p[5]) return; var m = MK[p[5]] || (MK[p[5]] = { c: p[6], k: 0 }); m.k++; });   // n40 k6: markets too
      Object.keys(MK).forEach(function (m) { var sl = m.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); IX.push({ u: PRE + '/m/' + sl + '/', n: m, sub: [MK[m].c !== m ? MK[m].c : '', (+MK[m].k === 1 ? f('sgp1') : f('sgp', { k: MK[m].k }))].filter(Boolean).join(' · '), h: ' ' + norm(m + ' ' + MK[m].c), w: 2 }); });
    }).catch(function () { P = null; }); return P; };
    var close = function () { ul.hidden = true; HQ.setAttribute('aria-expanded', 'false'); HQ.removeAttribute('aria-activedescendant'); act = -1; };
    var run = function () {
      var v = HQ.value, ws = norm(v).split(' ').filter(Boolean);
      if (!ws.length || /^(https?:\/\/|www\.)/i.test(v.trim()) || /\.[a-z]{2,}(\/|$)/i.test(v.trim())) { close(); return; }
      load().then(function () { if (!IX) return;
        var R = IX.filter(function (it) { return ws.every(function (w) { return it.h.indexOf(' ' + w) >= 0 || (w.length > 2 && it.h.indexOf(w) >= 0); }); })
          .sort(function (a, b) { var x = norm(a.n).indexOf(ws[0]) === 0 ? 0 : 1, y = norm(b.n).indexOf(ws[0]) === 0 ? 0 : 1; return x - y || a.w - b.w || a.n.length - b.n.length; });
        var Rh = R.filter(function (it) { return it.w === 2; }).slice(0, 2).concat(R.filter(function (it) { return it.w === 1; }).slice(0, 2)); R = Rh.concat(R.filter(function (it) { return it.w === 0; })).slice(0, 7);   // n40 k6: up to 2 markets and 2 developers first
        ul.innerHTML = ''; R.forEach(function (it, i) { var li = el('li'), a = el('a'); li.setAttribute('role', 'option'); li.id = 'khs-' + i; a.href = it.u; a.tabIndex = -1; a.appendChild(el('b', null, it.n)); a.appendChild(el('small', null, it.sub)); li.appendChild(a); ul.appendChild(li); });
        ul.hidden = !R.length; HQ.setAttribute('aria-expanded', R.length ? 'true' : 'false'); act = -1; });
    };
    var tmh; HQ.addEventListener('input', function () { clearTimeout(tmh); tmh = setTimeout(run, 90); }); HQ.addEventListener('focus', function () { load(); }, { once: true });
    HQ.addEventListener('keydown', function (e) {
      var L = ul.hidden ? [] : ul.querySelectorAll('li');
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && L.length) { e.preventDefault(); act = (act + (e.key === 'ArrowDown' ? 1 : -1) + L.length) % L.length; L.forEach(function (li, i) { li.setAttribute('aria-selected', i === act ? 'true' : 'false'); }); HQ.setAttribute('aria-activedescendant', 'khs-' + act); L[act].scrollIntoView({ block: 'nearest' }); }
      else if (e.key === 'Enter' && act >= 0 && L[act]) { e.preventDefault(); e.stopPropagation(); location.href = L[act].firstChild.href; }
      else if (e.key === 'Escape') close();
    });
    document.addEventListener('click', function (e) { if (!F2.contains(e.target)) close(); });
  }

  // ---------------------------------------------------------------- map page
  var MP = document.querySelector('[data-u27map]');
  if (MP) {
    var M = JSON.parse(MP.getAttribute('data-u27map')), mapEl = MP.querySelector('.kmp-m'), listEl = MP.querySelector('.kmp-l'), cnt = MP.querySelector('.kmp-n'), fm = MP.querySelector('form'), data = null, map = null, layer = null, lim = 60, Lf = null;
    var q = function (n) { return fm.elements[n] ? fm.elements[n].value : ''; };
    var params = new URLSearchParams(location.search); ['co', 'yr', 'pm', 'sc'].forEach(function (k) { if (params.get(k) && fm.elements[k]) fm.elements[k].value = params.get(k); });
    var pass = function (p) { var co = q('co'), yr = q('yr'), pm = q('pm'), sc = q('sc');
      return (!co || p[3] === co) && (!yr || (yr === '0' ? !p[6] : String(p[6]) === yr)) && (!pm || String(p[7]) === pm) && (!sc || (p[8] != null && p[8] >= +sc)); };
    var draw = function () {
      if (!data) return; var R = data.p.filter(pass), pins = R.filter(function (p) { return p[4] != null; }), byMk = {};
      R.forEach(function (p) { if (p[4] == null && data.mk[p[2]]) { (byMk[p[2]] = byMk[p[2]] || []).push(p); } });
      cnt.textContent = (R.length === 1 ? f('mpk1') : f('mpk', { k: nf(R.length) })); var e0 = MP.querySelector('.kmp-0'); if (e0) e0.hidden = R.length > 0; if (rs) rs.hidden = !['co', 'yr', 'pm', 'sc'].some(function (k) { return q(k); });
      var h = '', esc2 = function (s) { var x = document.createElement('i'); x.textContent = s; return x.innerHTML; };
      R.slice(0, lim).forEach(function (p) { h += '<li><a href="' + PRE + '/projects/' + p[0] + '/">' + esc2(p[1]) + '</a> <small>' + esc2([p[2], p[3]].filter(function (v, i, a) { return v && a.indexOf(v) === i; }).join(', ')) + (p[6] ? ' · ' + p[6] : '') + (p[8] != null ? ' · ' + p[8] + '/100' : '') + '</small></li>'; });
      listEl.innerHTML = h; var more = MP.querySelector('.kmp-more'); if (more) more.hidden = R.length <= lim;
      var u = new URL(location.href); ['co', 'yr', 'pm', 'sc'].forEach(function (k) { if (q(k)) u.searchParams.set(k, q(k)); else u.searchParams.delete(k); }); try { history.replaceState(null, '', u.pathname + u.search); } catch (e) {}
      if (!map || !Lf) return;
      if (layer) layer.remove(); layer = Lf.layerGroup().addTo(map); var B = [];
      pins.forEach(function (p) { var m = Lf.circleMarker([p[4], p[5]], { radius: 6, weight: 1.5, color: '#fff', fillColor: '#155C75', fillOpacity: .9 }); m.bindPopup('<b>' + esc2(p[1]) + '</b><br>' + esc2(p[2]) + (p[6] ? ' · ' + p[6] : '') + '<br><a href="' + PRE + '/projects/' + p[0] + '/">' + esc2(f('mpo')) + '</a>'); m.addTo(layer); B.push([p[4], p[5]]); });
      Object.keys(byMk).forEach(function (k) { var c = data.mk[k], L2 = byMk[k], m = Lf.circleMarker([c[0], c[1]], { radius: Math.min(26, 7 + Math.sqrt(L2.length) * 2.4), weight: 1, color: '#B26A00', fillColor: '#F2B544', fillOpacity: .45, dashArray: '3' });
        m.bindPopup('<b>' + esc2(f('mpa', { k: L2.length, m: k })) + '</b><br>' + L2.slice(0, 12).map(function (p) { return '<a href="' + PRE + '/projects/' + p[0] + '/">' + esc2(p[1]) + '</a>'; }).join('<br>') + (L2.length > 12 ? '<br>…' : '')); m.addTo(layer); B.push([c[0], c[1]]); });
      if (B.length) map.fitBounds(B, { padding: [24, 24], maxZoom: 12 });
    };
    var rs = el('button', 'kmp-r', f('mpr')); rs.type = 'button'; rs.hidden = true; fm.appendChild(rs);
    var e0 = el('p', 'kmp-0'); e0.hidden = true; e0.setAttribute('role', 'status'); e0.appendChild(document.createTextNode(f('mp0') + ' ')); var e0b = el('button', 'kmp-r', f('mpr')); e0b.type = 'button'; e0.appendChild(e0b); listEl.parentNode.insertBefore(e0, listEl);
    var reset = function () { ['co', 'yr', 'pm', 'sc'].forEach(function (k) { if (fm.elements[k]) fm.elements[k].value = ''; }); lim = 60; draw(); };
    rs.addEventListener('click', reset); e0b.addEventListener('click', function () { reset(); fm.elements.co && fm.elements.co.focus(); });
    fetch('/api/v1/map?lang=' + LG).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) { data = j; var sc2 = fm.elements.co; if (sc2 && sc2.options.length < 3) { j.co.forEach(function (c) { var o = el('option', null, c[1] + ' (' + c[2] + ')'); o.value = c[0]; sc2.appendChild(o); }); if (params.get('co')) sc2.value = params.get('co'); }
      var yy = fm.elements.yr; if (yy && yy.options.length < 3) { j.yr.forEach(function (y) { var o = el('option', null, y); o.value = y; yy.insertBefore(o, yy.lastElementChild); }); if (params.get('yr')) yy.value = params.get('yr'); } draw(); }).catch(function () { cnt.textContent = f('mpe'); if (!map) mapEl.textContent = f('mpe'); });
    fm.addEventListener('change', function () { lim = 60; draw(); }); fm.addEventListener('submit', function (e) { e.preventDefault(); });
    var mb = MP.querySelector('.kmp-more'); if (mb) mb.addEventListener('click', function () { lim += 120; draw(); });
    var boot = function () { if (map) return; var cs = el('link'); cs.rel = 'stylesheet'; cs.href = M.css; document.head.appendChild(cs); var s = el('script'); s.src = M.js; s.onload = function () { Lf = window.L; mapEl.textContent = ''; map = Lf.map(mapEl, { scrollWheelZoom: false, worldCopyJump: true, minZoom: innerWidth < 700 ? 1 : 2 }).setView([20, 20], 2);
      Lf.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map); draw(); }; s.onerror = function () { mapEl.textContent = f('mpe'); }; document.head.appendChild(s); };
    if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { io.disconnect(); boot(); } }, { rootMargin: '300px' }); io.observe(mapEl); } else boot();
  }
}
export const CLIENT_JS = '(' + client.toString() + ')();';

// ------------------------------------------------------------------------------------------------ routes
export const PATHS = /^\/k\/u27\.js$|^\/api\/v1\/(?:cost|map)$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:map|updates)\/?$/;
const jr = (o, s, cc) => new Response(JSON.stringify(o), { status: s || 200, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': cc || 'public, max-age=600' } });
const MAP3_V = 'b0bfd297a5';   // n40 k13: register layer (was 039ffae532)
// n35b note:   // n35b (batch 35, item 12): /map/ client v3 is a static file, /k/n35b/map.js (sha1 of the file, 10 chars)
const MAPV = { js: '/satellite/plot/vendor/leaflet-1.9.4.js?v=dc452946ac', css: '/satellite/plot/vendor/leaflet-1.9.4.css?v=b8273795a6' };

async function mapData(env, lang) {
  const N = await import('./kbx_named.js'), T = await import('./kbx_tr.js'), H = await import('./kbx_hdate.js');
  const ix = await N.data(env); let tr = null; try { tr = await T.trData(env); } catch (e) {}
  let ot = null; try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/on-time.json')); if (r.ok) ot = await r.json(); } catch (e) {}   // n30c (item 15): delay heat layer
  const ym = s => { const m = /^(\d{4})-(\d{2})/.exec(s || ''); return m ? +m[1] * 12 + (+m[2] - 1) : null; }, nowM = ot ? ym(ot.as_of_month) : null; let nLate = 0;
  const lateOf = id => { const r = ot && ot.projects && ot.projects[id]; if (!r || !r.first || nowM == null || /^done|completed/.test(r.s || '')) return null; const d = nowM - ym(r.first); return d > 0 ? d : null; };
  let mp = null; try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/similar.json')); if (r.ok) mp = ((await r.json()) || {}).market_points; } catch (e) {}
  const mk = {}; for (const [k, v] of Object.entries((mp && mp.markets) || {})) if (v && isFinite(v.lat) && isFinite(v.lng)) mk[k] = [Math.round(v.lat * 100) / 100, Math.round(v.lng * 100) / 100];
  let G = null; try { const R = await import('./kbx_n37u.js'); G = await R.regMap(env); } catch (e) { G = null; }   // r10u (batch 37): key facts read in an official register
  const P = [], co = new Map(), yrs = new Set();
  for (const x of ix.P) {
    if (COI_RX.test(String(x.n || '') + ' ' + String(x.dv || ''))) continue;
    const fx = x.fx || {}, c = ix.caseBy.get(x.id) || {}, h = N.handoverOf(ix, x), m = h && /(20\d\d)/.exec(String(h.d)), y = m ? +m[1] : null, row = tr && tr.rows.get(x.id);
    const pin = typeof fx.lat === 'number' && typeof fx.lng === 'number';
    if (y) yrs.add(y);
    co.set(x.co, (co.get(x.co) || 0) + 1);
    const lt = lateOf(x.id); if (lt) nLate++;
    P.push([x.s, x.n, x.mk, x.co, pin ? Math.round(fx.lat * 1e4) / 1e4 : null, pin ? Math.round(fx.lng * 1e4) / 1e4 : null, y, x.pn || (c.checks || {}).permit === 2 ? 1 : 0, row ? row.score : null, lt, G ? G.get(x.s) || 0 : null]);
  }
  const coL = [...co.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => [k, H.placeName(k, lang), n]);
  return { updated: String(ix.updated || '').slice(0, 10), keys: ['slug', 'name', 'market', 'country', 'lat', 'lng', 'handover_year', 'permit_published', 'transparency_score', 'months_past_first_handover', 'register_facts'], mk,
    delay: { n: nLate, as_of: ot ? ot.as_of_month : null, source: '/data/on-time.json', rule: 'months_past_first_handover = month now minus the first handover month on record, for projects not completed whose first date has passed (on-time.json rules); null otherwise. A historical record, not a forecast.' }, co: coL, yr: [...yrs].sort(), p: P,
    note: 'lat/lng only where the developer publishes an address precise enough for a pin; other projects are drawn at their market point (similar.json market_points). Sumba projects are not listed (conflict of interest).' };
}

async function mapPage(req, u, env, ctx, shell, lang) {
  const N = await import('./kbx_named.js'), H = await import('./kbx_hdate.js'), N30 = await import('./kbx_n30c.js');
  const P = pre(lang), canon = ORIGIN + P + '/map/';
  // n29t (item 47): the list under the map is already filled in the HTML (markets with their project counts, linked to each market file),
  // so the page says what it holds without script; the map script replaces it with the projects in view
  let pre47 = ''; try { const ix = await N.data(env), mc = new Map(); for (const x of ix.P) { if (COI_RX.test(String(x.n || '') + ' ' + String(x.dv || ''))) continue; mc.set(x.mk, (mc.get(x.mk) || 0) + 1); }
    pre47 = [...mc.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))).slice(0, 60).map(([m, n]) => '<li><a href="/m/' + encodeURIComponent(String(m).toLowerCase().replace(/\s+/g, '-')) + '/">' + esc(H.mkName(m, lang)) + '</a><small>' + n.toLocaleString(lang) + '</small></li>').join(''); } catch (e) { pre47 = ''; }
  const sel = (n, lbl, opts) => '<label for="kmp-' + n + '"><span>' + esc(t27(lang, lbl)) + '</span><select id="kmp-' + n + '" name="' + n + '"><option value="">' + esc(t27(lang, 'mp_all')) + '</option>' + opts + '</select></label>';
  let RT = null; try { const R = await import('./kbx_n37u.js'); if (await R.regMap(env)) RT = (k, v) => R.rgT(lang, k, v); } catch (e) { RT = null; }   // r10u: register filter
  const rgSel = RT ? '<label for="kmp-rg"><span>' + esc(RT('rg_f')) + '</span><select id="kmp-rg" name="rg"><option value="">' + esc(t27(lang, 'mp_all')) + '</option><option value="1">' + esc(RT('rg_1')) + '</option><option value="3">' + esc(RT('rg_3')) + '</option></select></label>' : '';
  const form = '<form class="kmp-f" role="search">' + sel('co', 'mp_co', '') + sel('yr', 'mp_yr', '<option value="0">' + esc(t27(lang, 'mp_yr0')) + '</option>') +
    sel('pm', 'mp_pm', '<option value="1">' + esc(t27(lang, 'mp_pm1')) + '</option><option value="0">' + esc(t27(lang, 'mp_pm0')) + '</option>') + sel('sc', 'mp_sc', [25, 50, 75].map(n => '<option value="' + n + '">' + esc(t27(lang, 'mp_scn', { n })) + '</option>').join('')) +
    '<label for="kmp-dl"><span>' + esc(N30.t30(lang, 'mh_dl')) + '</span><select id="kmp-dl" name="dl"><option value="">' + esc(N30.t30(lang, 'mh_dl0')) + '</option><option value="1">' + esc(N30.t30(lang, 'mh_dl1')) + '</option><option value="6">' + esc(N30.t30(lang, 'mh_dl6')) + '</option><option value="12">' + esc(N30.t30(lang, 'mh_dl12')) + '</option></select></label>' + rgSel +
    '<label class="kmp-hm" for="kmp-hm"><input type="checkbox" id="kmp-hm" name="hm" value="1"> <span>' + esc(N30.t30(lang, 'mh_hm')) + '</span></label></form>';   // n30c (item 15)
  const body = '<section class="phero kp"><div class="wrap"><p class="crumb"><a href="' + P + '/">Kolaboro</a> / <a href="' + P + '/projects/">' + esc(N.tr(lang, 'h1_i')) + '</a></p><h1>' + esc(t27(lang, 'mp_h1')) + '</h1><p class="lead">' + esc(t27(lang, 'mp_lead')) + '</p></div></section>' +
    '<div class="wrap kwrap kmp" data-u27x="' + esc(JSON.stringify(Object.assign({ s: Object.assign({}, N30.mapStrings(lang), RT ? { rg_b: RT('rg_b') } : {}) }, MAPV))) + '">' + form +   // n30c (item 15): clusters and delay heat (kbx_n30c.js), u27.js leaves this map alone
    '<p class="kmp-leg" hidden><span class="kmp-legt"></span> <span class="kmp-k"><i style="background:#F2B544"></i>' + esc(N30.t30(lang, 'mh_k1')) + '</span> <span class="kmp-k"><i style="background:#E8772E"></i>' + esc(N30.t30(lang, 'mh_k6')) + '</span> <span class="kmp-k"><i style="background:#C2341B"></i>' + esc(N30.t30(lang, 'mh_k12')) + '</span> <a href="/data/on-time.json">on-time.json</a></p>' + '<p class="kmp-n" role="status" aria-live="polite">' + esc(t27(lang, 'mp_load')) + '</p><div class="kmp-m" role="region" aria-label="' + esc(t27(lang, 'mp_h1')) + '">' + esc(t27(lang, 'mp_load')) + '</div>' +
    '<p class="k-small k-muted">' + esc(t27(lang, 'mp_src')) + '</p><h2>' + esc(t27(lang, 'mp_list')) + '</h2><ul class="kmp-l lk">' + pre47 + '</ul><button type="button" class="kmp-more" hidden>' + esc(W_MORE[lang] || W_MORE.en) + '</button>' +
    '<p><a href="/api/v1/map' + (lang === 'en' ? '' : '?lang=' + lang) + '" rel="nofollow">/api/v1/map</a> · <a href="' + P + '/projects/">' + esc(N.tr(lang, 'h1_i')) + '</a></p></div>' +
    '<style>.kmp-f{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px 14px;margin:18px 0 10px}.kmp-f label{display:flex;flex-direction:column;gap:4px;font-size:.84rem;font-weight:600;min-width:0}.kmp-f select{min-height:44px;width:100%;min-width:0;border:1.5px solid var(--line,#d5d3cc);border-radius:10px;padding:0 10px;background:var(--paper,#fff);color:inherit;font:inherit;font-weight:500}' +
    '.kmp-n{font-weight:700;margin:6px 0 10px}.kmp-m{height:min(70vh,560px);min-height:340px;}@media(max-width:700px){.kmp-m{height:440px}}.kmp-m{border:1px solid var(--line,#d5d3cc);border-radius:14px;overflow:hidden;background:var(--concrete,#F1EFE9);display:grid;place-items:center;color:var(--muted)}.kmp-l{columns:2 300px;padding:0;list-style:none}.kmp-l li{padding:7px 0;border-bottom:1px solid var(--line,#d5d3cc);break-inside:avoid}.kmp-l small{display:block;color:var(--muted)}.kmp-more{min-height:44px;margin:10px 0;padding:0 14px;border:1.5px solid var(--ink,#17212B);border-radius:10px;background:none;color:inherit;font:inherit;font-weight:600;cursor:pointer}.kmp .leaflet-container{font:inherit}.kmp-m{position:relative;z-index:0;isolation:isolate}@media(pointer:coarse){.kmp .leaflet-touch .leaflet-bar a{width:44px;height:44px;line-height:44px;font-size:22px}}.kmp-l li{position:relative}.kmp-l li>a::after{content:"";position:absolute;inset:0}.kmp-r{min-height:44px;padding:0 14px;border:0;background:none;color:inherit;font:inherit;text-decoration:underline;cursor:pointer;align-self:end;justify-self:start}.kmp-0{font-weight:600;margin:10px 0}.kmp-0[hidden]{display:none}.kmp-f label.kmp-hm{flex-direction:row;align-items:center;gap:8px;min-height:44px;align-self:end}.kmp-hm input{width:22px;height:22px}.kmp-leg{font-size:.86rem;margin:8px 0;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center}.kmp-leg[hidden]{display:none}.kmp-k i{display:inline-block;width:12px;height:12px;border-radius:50%;margin-inline-end:5px;vertical-align:-1px}.kmp-cl span{display:block;border-radius:50%;background:#155C75;color:#fff;font-weight:700;text-align:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);font-size:13px}.kmp-cl{background:none;border:0}</style><script src="/k/n35b/map.js?v=' + MAP3_V + '" defer></script>';
  const pg = { title: t27(lang, 'mp_t') + ' | Kolaboro', desc: t27(lang, 'mp_d'), canon, body, alt: l => ORIGIN + pre(l) + '/map/',
    ld: { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebPage', name: t27(lang, 'mp_t'), url: canon, inLanguage: lang, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kolaboro', item: ORIGIN + P + '/' }, { '@type': 'ListItem', position: 2, name: N.tr(lang, 'h1_i'), item: ORIGIN + P + '/projects/' }, { '@type': 'ListItem', position: 3, name: t27(lang, 'mp_h1'), item: canon }] }] } };   // n29t (item 53): the same path as the visible breadcrumb
  const sh = await shell(P + '/how-we-score/'); if (!sh || sh.status !== 200) return null;
  return new Response(await N.assemble(pg, lang, sh), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' } });
}
const W_MORE = { en: 'Show more', es: 'Ver más', fr: 'Voir plus', de: 'Mehr zeigen', nl: 'Meer tonen', ru: 'Показать ещё', zh: '显示更多', ar: 'اعرض المزيد' };

async function updatesPage(req, u, env, ctx, shell, lang) {
  const N = await import('./kbx_named.js'), K = await import('./kbx_ticker.js');
  const items = (await K.tickerItems(env)).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const P = pre(lang), canon = ORIGIN + P + '/updates/', byDay = new Map();
  items.forEach(x => { const t = lang === 'en' ? x.text : x.tl && x.tl[lang]; if (!t) return; const d = String(x.date).slice(0, 10); if (!byDay.has(d)) byDay.set(d, []); byDay.get(d).push([K.tickId(x), t, x]); });
  const html = [...byDay.entries()].map(([d, L]) => '<section class="ks" id="d-' + d + '"><h2><time datetime="' + d + '">' + esc(N.fd(d, lang)) + '</time></h2><ol class="kup">' +
    L.map(([id, t, x]) => '<li id="' + id + '"><p>' + esc(t) + '</p>' + (x.url && /^\/[^/]/.test(x.url) ? '<p class="k-small"><a href="' + esc(/^\/(?:database|progress|numbers|rankings|projects|methods|press|moderation|team|compare|map)\b/.test(x.url) ? P + x.url : x.url) + '">' + esc(t27(lang, 'up_open')) + '</a></p>' : '') + '</li>').join('') + '</ol></section>').join('');
  const body = '<section class="phero kp"><div class="wrap"><p class="crumb"><a href="' + P + '/">Kolaboro</a></p><h1>' + esc(t27(lang, 'up_h1')) + '</h1><p class="lead">' + esc(t27(lang, 'up_lead')) + '</p></div></section><div class="wrap kwrap">' + html +
    '<p class="ki"><a href="' + P + '/progress/">/progress/</a> · <a href="/changelog/">/changelog/</a> · <a href="/data/ticker.json">ticker.json</a></p></div><style>.kup{padding-inline-start:20px}.kup li{margin:0 0 14px;line-height:1.55}.kup li p{margin:0}.kup li:target{background:color-mix(in srgb,var(--k-sea,#155C75) 10%,transparent);border-radius:8px}</style>';
  const pg = { title: t27(lang, 'up_t') + ' | Kolaboro', desc: t27(lang, 'up_d'), canon, body, alt: l => ORIGIN + pre(l) + '/updates/',
    ld: { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebPage', name: t27(lang, 'up_t'), url: canon, inLanguage: lang, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } }] } };
  const sh = await shell(P + '/how-we-score/'); if (!sh || sh.status !== 200) return null;
  return new Response(await N.assemble(pg, lang, sh), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' } });
}

export async function handle(req, u, env, ctx, shell) {
  const p = u.pathname;
  if (p === '/k/n31d.js') return (await import('./kbx_n31d.js')).handle(req, u);   // n31d (batch 31): project-page client script per language
  if (p === '/k/u27.js') {
    const N = await import('./kbx_named.js'), v = N.U27_SRC_V;
    const body = N.NAMED_CLIENT_JS + '\n' + CLIENT_JS + '\n' + (await import('./kbx_n30a.js')).LOADER + '\n' + (await import('./kbx_n31d.js')).LOADER;   // n31d: project-page client, idle-loaded   // n30a: natural-language search, loaded on the home box and /projects/ only
    return new Response(body, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': u.searchParams.get('v') === v ? 'public, max-age=31536000, immutable' : 'public, max-age=300', 'x-content-type-options': 'nosniff' } });
  }
  if (p === '/api/v1/cost') {
    const id = String(u.searchParams.get('id') || '').slice(0, 20), pr = Math.max(0, Math.min(1e12, +u.searchParams.get('p') || 0)), lang = LANGS.includes(u.searchParams.get('lang')) ? u.searchParams.get('lang') : 'en';
    const N = await import('./kbx_named.js'), F = await import('./kbx_facets.js');
    let ix; try { ix = await N.data(env); } catch (e) { return jr({ error: 'data not available' }, 503, 'no-store'); }
    const x = ix.byId.get(id); if (!x) return jr({ error: 'unknown project id' }, 404);
    return jr({ id, price: pr || null, calc: F.costCalc(x, pr, lang), about: 'Purchase taxes and fees of the project\'s country for a price you choose, the same rows as the project page (kbx_facets.js). Not advice; rates change; check with a local lawyer or notary.' }, 200, 'public, max-age=3600');
  }
  if (p === '/api/v1/map') {
    const lang = LANGS.includes(u.searchParams.get('lang')) ? u.searchParams.get('lang') : 'en';
    const ck = new Request(ORIGIN + '/__u27_map/v3/' + lang);   // v2: months past the first handover date (n30c); v3 (r10u): register_facts
    try { const hit = await caches.default.match(ck); if (hit) return hit; } catch (e) {}
    let d; try { d = await mapData(env, lang); } catch (e) { return jr({ error: 'map data not available' }, 503, 'no-store'); }
    const r = jr(d, 200, 'public, max-age=900');
    try { ctx.waitUntil(caches.default.put(ck, r.clone())); } catch (e) {}
    return r;
  }
  const m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(map|updates)\/?$/.exec(p); if (!m) return null;
  if (!p.endsWith('/')) return Response.redirect(ORIGIN + p + '/' + u.search, 301);
  const lang = m[1] || 'en';
  try { return m[2] === 'map' ? await mapPage(req, u, env, ctx, shell, lang) : await updatesPage(req, u, env, ctx, shell, lang); } catch (e) { return null; }
}
