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
import { NT } from './kbx_buy_notes.js';
import { rulesFor } from './kbx_rules.js';
import { words } from './kbx_named_qa.js';

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

const S = {
  en: { pp_h: 'Payment plan of {n}', pp_toc: 'Payment plan', pp_read: 'Page read on {d}.', pp_none: 'No payment plan was published on the pages we read (read on {d}).',
    ty_h: 'Unit types, sizes and floor plans of {n}', ty_toc: 'Unit types', ty_none: 'No unit types, sizes or floor plans were published on the pages we read (read on {d}).', ty_pl: 'Floor plans',
    q_ty: 'What unit types and sizes does {n} have?', a_ty: 'As published: {t}.',
    rl_h: 'Can foreigners buy at {n}, and can it be let to tourists?', rl_toc: 'Foreign buyers, short lets', own_pub: 'Ownership as published:', own_law: 'What the law says ({co}):',
    str_l: 'Short lets, {p}:', str_all: 'All short-let rules and sources', q_str: 'Can you rent {n} to tourists?', a_str: '{p}, official source read on {d}: {t}',
    rl_lim: 'Facts from the sources linked; not legal advice.', q_own: 'Can foreigners buy at {n}?',
    ppm_med: 'Median of the same figure in {mk} on Kolaboro ({k} projects): {v} per m²; this project is {p}.', p_up: '{x}% higher', p_dn: '{x}% lower', p_eq: 'within 5% of it',
    sat_l: 'From space (Sentinel-2):', sat_more: 'Monthly images',
    wd_l: 'Measured from the pin (straight line, OpenStreetMap):', q_dist: 'How far is {n} from the beach and the airport?',
    sd_h: 'Other {dev} projects in {mk}', drec: 'Delivery record of {dev}', dreg: 'Official company register ({p}):', dreg_s: 'Official company registers to look up {dev}',
    ln_th: 'Name in Thai in the ONEP EIA register:',
    fl_lbl: 'Show', fl_all: 'All ({k})', d_k: '{dev}: {k} projects tracked on Kolaboro in {mks}.' },
  es: { pp_h: 'Plan de pagos de {n}', pp_toc: 'Plan de pagos', pp_read: 'Página leída el {d}.', pp_none: 'No había plan de pagos publicado en las páginas que leímos (leídas el {d}).',
    ty_h: 'Tipologías, tamaños y planos de {n}', ty_toc: 'Tipologías', ty_none: 'No había tipologías, tamaños ni planos publicados en las páginas que leímos (leídas el {d}).', ty_pl: 'Planos',
    q_ty: '¿Qué tipologías y tamaños tiene {n}?', a_ty: 'Según lo publicado: {t}.',
    rl_h: '¿Pueden comprar extranjeros en {n} y se puede alquilar a turistas?', rl_toc: 'Extranjeros, alquiler turístico', own_pub: 'Propiedad según lo publicado:', own_law: 'Lo que dice la ley ({co}):',
    str_l: 'Alquiler turístico, {p}:', str_all: 'Todas las normas de alquiler turístico y sus fuentes', q_str: '¿Se puede alquilar {n} a turistas?', a_str: '{p}, fuente oficial leída el {d}: {t}',
    rl_lim: 'Datos de las fuentes enlazadas; no es asesoramiento legal.', q_own: '¿Pueden comprar extranjeros en {n}?',
    ppm_med: 'Mediana de la misma cifra en {mk} en Kolaboro ({k} proyectos): {v} por m²; este proyecto está {p}.', p_up: '{x} % por encima', p_dn: '{x} % por debajo', p_eq: 'a menos de un 5 % de ella',
    sat_l: 'Desde el espacio (Sentinel-2):', sat_more: 'Imágenes mensuales',
    wd_l: 'Medido desde el pin (en línea recta, OpenStreetMap):', q_dist: '¿A qué distancia está {n} de la playa y del aeropuerto?',
    sd_h: 'Otros proyectos de {dev} en {mk}', drec: 'Historial de entregas de {dev}', dreg: 'Registro oficial de empresas ({p}):', dreg_s: 'Registros oficiales de empresas para buscar a {dev}',
    ln_th: 'Nombre en tailandés en el registro EIA de ONEP:',
    fl_lbl: 'Mostrar', fl_all: 'Todos ({k})', d_k: '{dev}: {k} proyectos seguidos en Kolaboro en {mks}.' },
  fr: { pp_h: 'Échéancier de paiement de {n}', pp_toc: 'Échéancier', pp_read: 'Page lue le {d}.', pp_none: 'Aucun échéancier n’était publié sur les pages lues (lues le {d}).',
    ty_h: 'Typologies, surfaces et plans de {n}', ty_toc: 'Typologies', ty_none: 'Aucune typologie, surface ni plan n’était publié sur les pages lues (lues le {d}).', ty_pl: 'Plans',
    q_ty: 'Quelles typologies et surfaces propose {n} ?', a_ty: 'Tel que publié : {t}.',
    rl_h: 'Les étrangers peuvent-ils acheter à {n}, et peut-on le louer aux touristes ?', rl_toc: 'Étrangers, location courte', own_pub: 'Propriété, telle que publiée :', own_law: 'Ce que dit la loi ({co}) :',
    str_l: 'Location courte durée, {p} :', str_all: 'Toutes les règles de location courte et leurs sources', q_str: 'Peut-on louer {n} à des touristes ?', a_str: '{p}, source officielle lue le {d} : {t}',
    rl_lim: 'Faits tirés des sources liées ; pas un avis juridique.', q_own: 'Les étrangers peuvent-ils acheter à {n} ?',
    ppm_med: 'Médiane du même chiffre à {mk} sur Kolaboro ({k} projets) : {v} par m² ; ce projet est {p}.', p_up: '{x} % au-dessus', p_dn: '{x} % en dessous', p_eq: 'à moins de 5 % de celle-ci',
    sat_l: 'Vu de l’espace (Sentinel-2) :', sat_more: 'Images mensuelles',
    wd_l: 'Mesuré depuis le repère (à vol d’oiseau, OpenStreetMap) :', q_dist: 'À quelle distance {n} se trouve-t-il de la plage et de l’aéroport ?',
    sd_h: 'Autres projets de {dev} à {mk}', drec: 'Historique de livraison de {dev}', dreg: 'Registre officiel des sociétés ({p}) :', dreg_s: 'Registres officiels des sociétés pour rechercher {dev}',
    ln_th: 'Nom en thaï dans le registre EIE de l’ONEP :',
    fl_lbl: 'Afficher', fl_all: 'Tous ({k})', d_k: '{dev} : {k} projets suivis sur Kolaboro à {mks}.' },
  de: { pp_h: 'Zahlungsplan von {n}', pp_toc: 'Zahlungsplan', pp_read: 'Seite gelesen am {d}.', pp_none: 'Auf den gelesenen Seiten war kein Zahlungsplan veröffentlicht (gelesen am {d}).',
    ty_h: 'Wohnungstypen, Größen und Grundrisse von {n}', ty_toc: 'Wohnungstypen', ty_none: 'Auf den gelesenen Seiten waren keine Wohnungstypen, Größen oder Grundrisse veröffentlicht (gelesen am {d}).', ty_pl: 'Grundrisse',
    q_ty: 'Welche Wohnungstypen und Größen bietet {n}?', a_ty: 'Wie veröffentlicht: {t}.',
    rl_h: 'Dürfen Ausländer bei {n} kaufen, und darf man an Touristen vermieten?', rl_toc: 'Ausländer, Kurzzeitmiete', own_pub: 'Eigentumsform laut Veröffentlichung:', own_law: 'Was das Gesetz sagt ({co}):',
    str_l: 'Kurzzeitvermietung, {p}:', str_all: 'Alle Regeln zur Kurzzeitvermietung und Quellen', q_str: 'Darf man {n} an Touristen vermieten?', a_str: '{p}, amtliche Quelle, gelesen am {d}: {t}',
    rl_lim: 'Fakten aus den verlinkten Quellen; keine Rechtsberatung.', q_own: 'Dürfen Ausländer bei {n} kaufen?',
    ppm_med: 'Median derselben Kennzahl in {mk} auf Kolaboro ({k} Projekte): {v} pro m²; dieses Projekt liegt {p}.', p_up: '{x} % darüber', p_dn: '{x} % darunter', p_eq: 'weniger als 5 % davon entfernt',
    sat_l: 'Aus dem All (Sentinel-2):', sat_more: 'Monatsbilder',
    wd_l: 'Vom Pin aus gemessen (Luftlinie, OpenStreetMap):', q_dist: 'Wie weit ist {n} vom Strand und vom Flughafen entfernt?',
    sd_h: 'Weitere Projekte von {dev} in {mk}', drec: 'Lieferbilanz von {dev}', dreg: 'Amtliches Unternehmensregister ({p}):', dreg_s: 'Amtliche Unternehmensregister, um {dev} nachzuschlagen',
    ln_th: 'Name auf Thai im UVP-Register der ONEP:',
    fl_lbl: 'Zeigen', fl_all: 'Alle ({k})', d_k: '{dev}: {k} auf Kolaboro verfolgte Projekte in {mks}.' },
  nl: { pp_h: 'Betalingsplan van {n}', pp_toc: 'Betalingsplan', pp_read: 'Pagina gelezen op {d}.', pp_none: 'Op de gelezen pagina’s stond geen betalingsplan (gelezen op {d}).',
    ty_h: 'Woningtypes, oppervlaktes en plattegronden van {n}', ty_toc: 'Woningtypes', ty_none: 'Op de gelezen pagina’s stonden geen woningtypes, oppervlaktes of plattegronden (gelezen op {d}).', ty_pl: 'Plattegronden',
    q_ty: 'Welke woningtypes en oppervlaktes heeft {n}?', a_ty: 'Zoals gepubliceerd: {t}.',
    rl_h: 'Mogen buitenlanders kopen bij {n}, en mag je aan toeristen verhuren?', rl_toc: 'Buitenlanders, kortverhuur', own_pub: 'Eigendom volgens publicatie:', own_law: 'Wat de wet zegt ({co}):',
    str_l: 'Kortverhuur, {p}:', str_all: 'Alle regels voor kortverhuur en bronnen', q_str: 'Mag je {n} aan toeristen verhuren?', a_str: '{p}, officiële bron gelezen op {d}: {t}',
    rl_lim: 'Feiten uit de gelinkte bronnen; geen juridisch advies.', q_own: 'Mogen buitenlanders kopen bij {n}?',
    ppm_med: 'Mediaan van hetzelfde cijfer in {mk} op Kolaboro ({k} projecten): {v} per m²; dit project ligt {p}.', p_up: '{x}% hoger', p_dn: '{x}% lager', p_eq: 'binnen 5% ervan',
    sat_l: 'Vanuit de ruimte (Sentinel-2):', sat_more: 'Maandbeelden',
    wd_l: 'Gemeten vanaf de pin (hemelsbreed, OpenStreetMap):', q_dist: 'Hoe ver ligt {n} van het strand en de luchthaven?',
    sd_h: 'Andere projecten van {dev} in {mk}', drec: 'Opleverhistorie van {dev}', dreg: 'Officieel bedrijfsregister ({p}):', dreg_s: 'Officiële bedrijfsregisters om {dev} op te zoeken',
    ln_th: 'Naam in het Thai in het MER-register van ONEP:',
    fl_lbl: 'Toon', fl_all: 'Alle ({k})', d_k: '{dev}: {k} projecten gevolgd op Kolaboro in {mks}.' },
  ru: { pp_h: 'График платежей {n}', pp_toc: 'График платежей', pp_read: 'Страница прочитана {d}.', pp_none: 'На прочитанных страницах график платежей не опубликован (прочитано {d}).',
    ty_h: 'Планировки, площади и типы квартир {n}', ty_toc: 'Планировки', ty_none: 'На прочитанных страницах не опубликованы ни типы квартир, ни площади, ни планировки (прочитано {d}).', ty_pl: 'Планировки',
    q_ty: 'Какие типы квартир и площади в {n}?', a_ty: 'По опубликованным данным: {t}.',
    rl_h: 'Могут ли иностранцы купить в {n} и можно ли сдавать туристам?', rl_toc: 'Иностранцы, аренда', own_pub: 'Форма собственности (опубликовано):', own_law: 'Что говорит закон ({co}):',
    str_l: 'Краткосрочная аренда, {p}:', str_all: 'Все правила краткосрочной аренды и источники', q_str: 'Можно ли сдавать {n} туристам?', a_str: '{p}, официальный источник, прочитан {d}: {t}',
    rl_lim: 'Факты из указанных источников; это не юридическая консультация.', q_own: 'Могут ли иностранцы купить в {n}?',
    ppm_med: 'Медиана того же показателя в {mk} на Kolaboro (проектов: {k}): {v} за м²; этот проект {p}.', p_up: 'на {x}% выше', p_dn: 'на {x}% ниже', p_eq: 'в пределах 5% от неё',
    sat_l: 'Из космоса (Sentinel-2):', sat_more: 'Ежемесячные снимки',
    wd_l: 'Измерено от метки (по прямой, OpenStreetMap):', q_dist: 'Как далеко {n} от пляжа и аэропорта?',
    sd_h: 'Другие проекты {dev} в {mk}', drec: 'История сдачи объектов {dev}', dreg: 'Официальный реестр компаний ({p}):', dreg_s: 'Официальные реестры компаний, где можно найти {dev}',
    ln_th: 'Название на тайском в реестре ОВОС ONEP:',
    fl_lbl: 'Показать', fl_all: 'Все ({k})', d_k: '{dev}: проектов на Kolaboro: {k} ({mks}).' },
  zh: { pp_h: '{n} 的付款计划', pp_toc: '付款计划', pp_read: '页面读取于 {d}。', pp_none: '我们读取的页面未公布付款计划（读取于 {d}）。',
    ty_h: '{n} 的户型、面积和平面图', ty_toc: '户型', ty_none: '我们读取的页面未公布户型、面积或平面图（读取于 {d}）。', ty_pl: '平面图',
    q_ty: '{n} 有哪些户型和面积？', a_ty: '据公布信息：{t}。',
    rl_h: '外国人能否购买 {n}？能否租给游客？', rl_toc: '外国人与短租', own_pub: '公布的产权形式：', own_law: '法律规定（{co}）：',
    str_l: '短租，{p}：', str_all: '全部短租规则与来源', q_str: '{n} 可以租给游客吗？', a_str: '{p}，官方来源，读取于 {d}：{t}',
    rl_lim: '内容来自所链接的来源，不构成法律意见。', q_own: '外国人能否购买 {n}？',
    ppm_med: 'Kolaboro 上 {mk} 同一指标的中位数（{k} 个项目）：每平方米 {v}；本项目{p}。', p_up: '高出 {x}%', p_dn: '低 {x}%', p_eq: '与之相差不到 5%',
    sat_l: '卫星观测（Sentinel-2）：', sat_more: '每月影像',
    wd_l: '从定位点测量（直线距离，OpenStreetMap）：', q_dist: '{n} 离海滩和机场有多远？',
    sd_h: '{dev} 在 {mk} 的其他项目', drec: '{dev} 的交付记录', dreg: '官方公司登记（{p}）：', dreg_s: '可查询 {dev} 的官方公司登记',
    ln_th: 'ONEP 环评登记中的泰文名称：',
    fl_lbl: '显示', fl_all: '全部（{k}）', d_k: '{dev}：Kolaboro 跟踪的项目 {k} 个，位于 {mks}。' },
  ar: { pp_h: 'خطة الدفع في {n}', pp_toc: 'خطة الدفع', pp_read: 'قُرئت الصفحة في {d}.', pp_none: 'لم تُنشر خطة دفع في الصفحات التي قرأناها (قُرئت في {d}).',
    ty_h: 'أنواع الوحدات ومساحاتها ومخططاتها في {n}', ty_toc: 'أنواع الوحدات', ty_none: 'لم تُنشر أنواع وحدات أو مساحات أو مخططات في الصفحات التي قرأناها (قُرئت في {d}).', ty_pl: 'المخططات',
    q_ty: 'ما أنواع الوحدات ومساحاتها في {n}؟', a_ty: 'حسب المنشور: {t}.',
    rl_h: 'هل يحق للأجانب الشراء في {n}، وهل يمكن تأجيره للسياح؟', rl_toc: 'الأجانب والتأجير القصير', own_pub: 'الملكية كما نُشرت:', own_law: 'ما يقوله القانون ({co}):',
    str_l: 'التأجير القصير، {p}:', str_all: 'جميع قواعد التأجير القصير ومصادرها', q_str: 'هل يمكن تأجير {n} للسياح؟', a_str: '{p}، مصدر رسمي قُرئ في {d}: {t}',
    rl_lim: 'حقائق من المصادر المرفقة؛ ليست استشارة قانونية.', q_own: 'هل يحق للأجانب الشراء في {n}؟',
    ppm_med: 'وسيط الرقم نفسه في {mk} على Kolaboro (عدد المشاريع: {k}): {v} للمتر المربع؛ وهذا المشروع {p}.', p_up: 'أعلى بنسبة {x}%', p_dn: 'أقل بنسبة {x}%', p_eq: 'ضمن 5% منه',
    sat_l: 'من الفضاء (Sentinel-2):', sat_more: 'صور شهرية',
    wd_l: 'مقيسة من الدبوس (خط مستقيم، OpenStreetMap):', q_dist: 'كم يبعد {n} عن الشاطئ والمطار؟',
    sd_h: 'مشاريع أخرى لـ {dev} في {mk}', drec: 'سجل تسليم {dev}', dreg: 'السجل الرسمي للشركات ({p}):', dreg_s: 'السجلات الرسمية للشركات للبحث عن {dev}',
    ln_th: 'الاسم بالتايلاندية في سجل تقييم الأثر البيئي لدى ONEP:',
    fl_lbl: 'عرض', fl_all: 'الكل ({k})', d_k: '{dev}: عدد المشاريع المتابَعة على Kolaboro: {k} ({mks}).' }
};
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
const ppmOf = x => { const fx = x.fx || {}, p = +fx.price_min, s = +fx.size_min_m2; return p > 0 && s >= 15 && s <= 5000 && fx.currency ? p / s : null; };
function medians(ix) {
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
export { regLi, lawFor, LAW };
