// kolaboro.com batch 21 (n21a): official warnings and notices on developer pages. No model calls. Facts only, never a verdict.
// Data (built on main, published to pub/_lovable):
//   /data/sanctions.json "warnings"  tools/kolaboro-agent/sanctions_screen.py (workflow kolaboro-sanctions.yml, lists read weekly):
//                          official regulator warning lists of unauthorised firms that were read (FCA, AMF, MAS, SFC, FINMA,
//                          Central Bank of Ireland, SEC) and the developer pages whose company name had NO possible match.
//                          Possible matches are never published: admin CRM "Screening" tab, same private list as sanctions.
//   /data/gazette.json     tools/kolaboro-agent/gazette_notices.py (workflow kolaboro-gazette.yml, monthly): notices in BORME (Spain),
//                          BODACC (France) and The Gazette (UK) about developer companies matched by exact legal name (BODACC:
//                          by SIREN). Type, date and link only: no officer names, no notice text.
// Routes:  GET /api/x/gazette (?dev=<slug>)   the notices as JSON
// Developer pages: kbx_watch.js calls warnDevHtml() inside the section #watch; kbx_named.js calls gazDevHtml() for the section #gazette.
import { LOCALE } from './kbx_named_i18n.js';

export const PATHS = /^\/api\/x\/gazette$/;
const H = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' };
const out = (o, st) => new Response(JSON.stringify(o), { status: st || 200, headers: Object.assign({ 'cache-control': 'public, max-age=900' }, H) });
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dtf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'd' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.DateTimeFormat(L, o)); };
function fdt(d, lang) { try { return dtf(LOCALE[lang] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(d + 'T00:00:00Z')); } catch (e) { return d; } }
const http = u => /^https:\/\//.test(u || '') ? u : '#';

// ------------------------------------------------------------------------------------------------ strings (8 languages)
const S = {
  en: { w_h: 'Regulator warning lists', w_ok: 'Company name compared on {d} with official warning lists of unauthorised firms ({lists}): no match.',
    w_note: 'These lists name firms that offered financial services or investments without authorisation. A name check, not an identity check; no match is not an endorsement. Possible matches are reviewed by a person and are not published.', w_hand: 'Not read automatically, check by hand:',
    g_h: 'Official gazette notices', g_intro: 'Notices that official gazettes carry about the company behind this developer, found under its exact legal name. A notice is a routine legal publication, not a finding about the company. We list the type, the date and the link; names of people in a notice are not copied.',
    g_co: 'Company searched', via: { published: 'the name this developer publishes', gleif: 'legal name on its GLEIF record', record: 'company name with its legal form in our project record' },
    s_borme: 'BORME (Spain): every daily issue from {a} to {b}.', s_bodacc: 'BODACC (France): searched by SIREN number {n} on {d}.', s_gazette: 'The Gazette (United Kingdom): company notices searched on {d}.',
    g_none: 'No notice found under this exact name.', g_n: '{n} notices found. Newest first.', g_more: 'Show all {n}', g_cap: 'The {n} newest are listed.', th: ['Date', 'Type', 'As printed', 'Source'],
    k: { change: 'Change to the company record', appt: 'Appointments and removals', capital: 'Capital change', insolvency: 'Insolvency notice', accounts: 'Accounts filed', merger: 'Merger or split', address: 'Change of registered office', bylaws: 'Change to the articles', name: 'Change of name', owner: 'Sole shareholder notice', dissolution: 'Dissolution or strike-off', reg: 'Registration', registry: 'Registry sheet notice', sale: 'Sale or transfer', other: 'Other notice' } },
  es: { w_h: 'Listas de advertencias de reguladores', w_ok: 'Nombre de la empresa comparado el {d} con listas oficiales de advertencias sobre entidades no autorizadas ({lists}): sin coincidencias.',
    w_note: 'Estas listas nombran entidades que ofrecieron servicios financieros o inversiones sin autorización. Es una comprobación del nombre, no de la identidad; no aparecer no es un aval. Las posibles coincidencias las revisa una persona y no se publican.', w_hand: 'No se leen de forma automática, compruébelas a mano:',
    g_h: 'Anuncios en boletines oficiales', g_intro: 'Anuncios que los boletines oficiales publican sobre la sociedad de este promotor, encontrados por su denominación social exacta. Un anuncio es una publicación legal ordinaria, no una conclusión sobre la empresa. Mostramos el tipo, la fecha y el enlace; no copiamos nombres de personas.',
    g_co: 'Sociedad buscada', via: { published: 'el nombre que publica este promotor', gleif: 'denominación legal en su registro GLEIF', record: 'sociedad con forma jurídica en nuestra ficha del proyecto' },
    s_borme: 'BORME (España): todos los números diarios del {a} al {b}.', s_bodacc: 'BODACC (Francia): búsqueda por número SIREN {n} el {d}.', s_gazette: 'The Gazette (Reino Unido): anuncios de sociedades buscados el {d}.',
    g_none: 'No se encontró ningún anuncio con esta denominación exacta.', g_n: '{n} anuncios encontrados. Primero los más recientes.', g_more: 'Ver los {n}', g_cap: 'Se muestran los {n} más recientes.', th: ['Fecha', 'Tipo', 'Como se publicó', 'Fuente'],
    k: { change: 'Modificación de los datos de la sociedad', appt: 'Nombramientos y ceses', capital: 'Cambio de capital', insolvency: 'Anuncio concursal', accounts: 'Depósito de cuentas', merger: 'Fusión o escisión', address: 'Cambio de domicilio social', bylaws: 'Modificación de estatutos', name: 'Cambio de denominación', owner: 'Anuncio de socio único', dissolution: 'Disolución o extinción', reg: 'Inscripción', registry: 'Anuncio de hoja registral', sale: 'Venta o cesión', other: 'Otro anuncio' } },
  fr: { w_h: 'Listes de mises en garde des régulateurs', w_ok: 'Nom de la société comparé le {d} aux listes officielles de mises en garde contre des entités non autorisées ({lists}) : aucune correspondance.',
    w_note: 'Ces listes nomment des entités qui ont proposé des services financiers ou des placements sans autorisation. Une vérification du nom, pas de l\'identité ; l\'absence de correspondance n\'est pas une caution. Les correspondances possibles sont examinées par une personne et ne sont pas publiées.', w_hand: 'Non lues automatiquement, à vérifier à la main :',
    g_h: 'Annonces aux bulletins officiels', g_intro: 'Annonces que les bulletins officiels publient sur la société de ce promoteur, trouvées sous sa dénomination sociale exacte. Une annonce est une publication légale courante, pas une conclusion sur la société. Nous indiquons le type, la date et le lien ; les noms de personnes ne sont pas copiés.',
    g_co: 'Société recherchée', via: { published: 'le nom que publie ce promoteur', gleif: 'dénomination légale de sa fiche GLEIF', record: 'société avec sa forme juridique dans notre fiche du projet' },
    s_borme: 'BORME (Espagne) : tous les numéros quotidiens du {a} au {b}.', s_bodacc: 'BODACC (France) : recherche par numéro SIREN {n} le {d}.', s_gazette: 'The Gazette (Royaume-Uni) : annonces de sociétés recherchées le {d}.',
    g_none: 'Aucune annonce trouvée sous cette dénomination exacte.', g_n: '{n} annonces trouvées. Les plus récentes d\'abord.', g_more: 'Afficher les {n}', g_cap: 'Les {n} plus récentes sont affichées.', th: ['Date', 'Type', 'Tel que publié', 'Source'],
    k: { change: 'Modification de la société', appt: 'Nominations et révocations', capital: 'Modification du capital', insolvency: 'Annonce de procédure collective', accounts: 'Dépôt des comptes', merger: 'Fusion ou scission', address: 'Transfert du siège social', bylaws: 'Modification des statuts', name: 'Changement de dénomination', owner: 'Annonce d\'associé unique', dissolution: 'Dissolution ou radiation', reg: 'Immatriculation', registry: 'Annonce du registre', sale: 'Vente ou cession', other: 'Autre annonce' } },
  de: { w_h: 'Warnlisten der Aufsichtsbehörden', w_ok: 'Firmenname am {d} mit offiziellen Warnlisten zu nicht zugelassenen Anbietern verglichen ({lists}): kein Treffer.',
    w_note: 'Diese Listen nennen Anbieter, die Finanzdienstleistungen oder Anlagen ohne Zulassung angeboten haben. Geprüft wird der Name, nicht die Identität; kein Treffer ist keine Empfehlung. Mögliche Treffer prüft ein Mensch, sie werden nicht veröffentlicht.', w_hand: 'Nicht automatisch gelesen, bitte von Hand prüfen:',
    g_h: 'Bekanntmachungen in Amtsblättern', g_intro: 'Bekanntmachungen, die Amtsblätter über die Gesellschaft dieses Bauträgers veröffentlichen, gefunden unter ihrem genauen Firmennamen. Eine Bekanntmachung ist eine übliche Pflichtveröffentlichung, keine Feststellung über das Unternehmen. Wir nennen Art, Datum und Link; Namen von Personen werden nicht übernommen.',
    g_co: 'Gesuchte Gesellschaft', via: { published: 'der Name, den dieser Bauträger veröffentlicht', gleif: 'Firmenname im GLEIF-Eintrag', record: 'Gesellschaft mit Rechtsform in unserem Projekteintrag' },
    s_borme: 'BORME (Spanien): jede Tagesausgabe vom {a} bis {b}.', s_bodacc: 'BODACC (Frankreich): Suche nach SIREN-Nummer {n} am {d}.', s_gazette: 'The Gazette (Vereinigtes Königreich): Bekanntmachungen zu Gesellschaften, gesucht am {d}.',
    g_none: 'Keine Bekanntmachung unter diesem genauen Namen gefunden.', g_n: '{n} Bekanntmachungen gefunden. Neueste zuerst.', g_more: 'Alle {n} anzeigen', g_cap: 'Die {n} neuesten werden gezeigt.', th: ['Datum', 'Art', 'Wie veröffentlicht', 'Quelle'],
    k: { change: 'Änderung der Gesellschaftsdaten', appt: 'Bestellungen und Abberufungen', capital: 'Kapitaländerung', insolvency: 'Insolvenzbekanntmachung', accounts: 'Jahresabschluss hinterlegt', merger: 'Verschmelzung oder Spaltung', address: 'Sitzverlegung', bylaws: 'Satzungsänderung', name: 'Namensänderung', owner: 'Bekanntmachung zum Alleingesellschafter', dissolution: 'Auflösung oder Löschung', reg: 'Eintragung', registry: 'Bekanntmachung zum Registerblatt', sale: 'Verkauf oder Übertragung', other: 'Sonstige Bekanntmachung' } },
  nl: { w_h: 'Waarschuwingslijsten van toezichthouders', w_ok: 'Bedrijfsnaam op {d} vergeleken met officiële waarschuwingslijsten van partijen zonder vergunning ({lists}): geen overeenkomst.',
    w_note: 'Deze lijsten noemen partijen die zonder vergunning financiële diensten of beleggingen aanboden. Een controle van de naam, niet van de identiteit; geen overeenkomst is geen aanbeveling. Mogelijke overeenkomsten worden door een persoon bekeken en niet gepubliceerd.', w_hand: 'Niet automatisch gelezen, controleer ze met de hand:',
    g_h: 'Aankondigingen in officiële publicatiebladen', g_intro: 'Aankondigingen die officiële publicatiebladen over de vennootschap van deze ontwikkelaar plaatsen, gevonden onder de exacte statutaire naam. Een aankondiging is een gewone wettelijke publicatie, geen oordeel over het bedrijf. We tonen het type, de datum en de link; namen van personen nemen we niet over.',
    g_co: 'Gezochte vennootschap', via: { published: 'de naam die deze ontwikkelaar publiceert', gleif: 'statutaire naam in het GLEIF-register', record: 'vennootschap met rechtsvorm in ons projectdossier' },
    s_borme: 'BORME (Spanje): elke dagelijkse uitgave van {a} tot {b}.', s_bodacc: 'BODACC (Frankrijk): gezocht op SIREN-nummer {n} op {d}.', s_gazette: 'The Gazette (Verenigd Koninkrijk): aankondigingen over vennootschappen gezocht op {d}.',
    g_none: 'Geen aankondiging gevonden onder deze exacte naam.', g_n: '{n} aankondigingen gevonden. Nieuwste eerst.', g_more: 'Toon alle {n}', g_cap: 'De {n} nieuwste worden getoond.', th: ['Datum', 'Type', 'Zoals gepubliceerd', 'Bron'],
    k: { change: 'Wijziging van de vennootschapsgegevens', appt: 'Benoemingen en ontslagen', capital: 'Kapitaalwijziging', insolvency: 'Insolventieaankondiging', accounts: 'Jaarrekening gedeponeerd', merger: 'Fusie of splitsing', address: 'Verplaatsing van de zetel', bylaws: 'Statutenwijziging', name: 'Naamswijziging', owner: 'Aankondiging enig aandeelhouder', dissolution: 'Ontbinding of doorhaling', reg: 'Inschrijving', registry: 'Aankondiging registerblad', sale: 'Verkoop of overdracht', other: 'Andere aankondiging' } },
  ru: { w_h: 'Списки предупреждений регуляторов', w_ok: 'Название компании сверено {d} с официальными списками предупреждений о компаниях без лицензии ({lists}): совпадений нет.',
    w_note: 'В этих списках названы компании, предлагавшие финансовые услуги или инвестиции без разрешения. Проверяется название, а не личность; отсутствие совпадения не является рекомендацией. Возможные совпадения проверяет человек, они не публикуются.', w_hand: 'Не читаются автоматически, проверьте вручную:',
    g_h: 'Объявления в официальных бюллетенях', g_intro: 'Объявления, которые официальные бюллетени публикуют о компании этого застройщика, найденные по её точному юридическому названию. Объявление: это обычная обязательная публикация, а не вывод о компании. Мы показываем тип, дату и ссылку; имена людей не копируются.',
    g_co: 'Искомая компания', via: { published: 'название, которое публикует застройщик', gleif: 'юридическое название в записи GLEIF', record: 'компания с правовой формой в нашей записи о проекте' },
    s_borme: 'BORME (Испания): все ежедневные выпуски с {a} по {b}.', s_bodacc: 'BODACC (Франция): поиск по номеру SIREN {n}, {d}.', s_gazette: 'The Gazette (Великобритания): объявления о компаниях, поиск {d}.',
    g_none: 'Объявлений под этим точным названием не найдено.', g_n: 'Найдено объявлений: {n}. Сначала новые.', g_more: 'Показать все ({n})', g_cap: 'Показаны последние {n}.', th: ['Дата', 'Тип', 'Как опубликовано', 'Источник'],
    k: { change: 'Изменение сведений о компании', appt: 'Назначения и прекращения полномочий', capital: 'Изменение капитала', insolvency: 'Объявление о несостоятельности', accounts: 'Сдача отчётности', merger: 'Слияние или разделение', address: 'Смена юридического адреса', bylaws: 'Изменение устава', name: 'Смена названия', owner: 'Объявление о единственном участнике', dissolution: 'Ликвидация или исключение', reg: 'Регистрация', registry: 'Объявление о регистрационном листе', sale: 'Продажа или уступка', other: 'Другое объявление' } },
  zh: { w_h: '监管机构警示名单', w_ok: '已于 {d} 将公司名称与官方未获授权机构警示名单（{lists}）比对：无匹配。',
    w_note: '这些名单列出未经授权提供金融服务或投资的机构。这是名称比对，不是身份核验；无匹配不代表背书。可能的匹配由人工复核，不予公布。', w_hand: '未自动读取，请手动查询：',
    g_h: '官方公报公告', g_intro: '官方公报就该开发商背后的公司刊登的公告，按其准确的法定名称查到。公告是例行的法定公示，不是对公司的结论。我们只列出类型、日期和链接；不复制公告中的人名。',
    g_co: '查询的公司', via: { published: '该开发商公布的名称', gleif: 'GLEIF 记录中的法定名称', record: '我们项目记录中带法律形式的公司名称' },
    s_borme: 'BORME（西班牙）：{a} 至 {b} 的每一期日报。', s_bodacc: 'BODACC（法国）：{d} 按 SIREN 号 {n} 查询。', s_gazette: 'The Gazette（英国）：{d} 查询公司公告。',
    g_none: '未找到该准确名称下的公告。', g_n: '找到 {n} 条公告，最新在前。', g_more: '显示全部 {n} 条', g_cap: '显示最新的 {n} 条。', th: ['日期', '类型', '原文', '来源'],
    k: { change: '公司登记事项变更', appt: '任命与解任', capital: '资本变更', insolvency: '破产公告', accounts: '提交年报', merger: '合并或分立', address: '注册地址变更', bylaws: '章程修改', name: '名称变更', owner: '唯一股东公告', dissolution: '解散或注销', reg: '登记', registry: '登记页公告', sale: '出售或转让', other: '其他公告' } },
  ar: { w_h: 'قوائم تحذيرات الجهات الرقابية', w_ok: 'تمت مقارنة اسم الشركة في {d} بالقوائم الرسمية للتحذير من جهات غير مرخصة ({lists}): لا تطابق.',
    w_note: 'تذكر هذه القوائم جهات عرضت خدمات مالية أو استثمارات دون ترخيص. هذا فحص للاسم لا للهوية، وعدم التطابق ليس تزكية. التطابقات المحتملة يراجعها شخص ولا تُنشر.', w_hand: 'لا تُقرأ آليًا، تحقق منها يدويًا:',
    g_h: 'إعلانات الجرائد الرسمية', g_intro: 'إعلانات تنشرها الجرائد الرسمية عن الشركة التي تقف وراء هذا المطوّر، وُجدت باسمها القانوني المطابق تمامًا. الإعلان نشر قانوني اعتيادي وليس حكمًا على الشركة. نعرض النوع والتاريخ والرابط، ولا ننسخ أسماء الأشخاص.',
    g_co: 'الشركة التي بُحث عنها', via: { published: 'الاسم الذي ينشره هذا المطوّر', gleif: 'الاسم القانوني في سجل GLEIF', record: 'اسم شركة بشكلها القانوني في سجل المشروع لدينا' },
    s_borme: 'BORME (إسبانيا): كل عدد يومي من {a} إلى {b}.', s_bodacc: 'BODACC (فرنسا): بحث برقم SIREN {n} في {d}.', s_gazette: 'The Gazette (المملكة المتحدة): بحث عن إعلانات الشركات في {d}.',
    g_none: 'لم يُعثر على أي إعلان بهذا الاسم المطابق.', g_n: 'عُثر على {n} إعلانًا. الأحدث أولًا.', g_more: 'عرض الكل ({n})', g_cap: 'تُعرض أحدث {n}.', th: ['التاريخ', 'النوع', 'كما نُشر', 'المصدر'],
    k: { change: 'تعديل في بيانات الشركة', appt: 'تعيينات وإعفاءات', capital: 'تغيير في رأس المال', insolvency: 'إعلان إعسار', accounts: 'إيداع الحسابات', merger: 'اندماج أو انقسام', address: 'تغيير المقر المسجل', bylaws: 'تعديل النظام الأساسي', name: 'تغيير الاسم', owner: 'إعلان الشريك الوحيد', dissolution: 'حل أو شطب', reg: 'تسجيل', registry: 'إعلان صفحة السجل', sale: 'بيع أو تنازل', other: 'إعلان آخر' } },
};
const t = (lang, k, v) => { const s = (S[lang] && S[lang][k] != null ? S[lang][k] : S.en[k]); return typeof s === 'string' && v ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
export const gazHeading = lang => t(lang, 'g_h');

const CSS = '<style id="kgaz-css">.kgz-w{margin-top:var(--k-5,24px)}.kgz-w h3{margin:0 0 var(--k-2,8px);font-size:var(--k-fs-lg,20px)}.kgz-co{margin:var(--k-4,16px) 0 var(--k-2,8px)}.kgz-co b{font-weight:650}.kgz-s{list-style:none;padding:0;margin:0 0 var(--k-3,12px);color:var(--k-muted,#56636F);font-size:var(--k-fs-sm,15px)}.kgz-s li{margin:2px 0}' +
  '.kgz td,.kgz th{text-align:start;vertical-align:top}.kgz td:first-child{white-space:nowrap;font-variant-numeric:tabular-nums}.kgz td{overflow-wrap:anywhere}.kgz details{margin-top:var(--k-2,8px)}.kgz summary{cursor:pointer;min-height:44px;display:inline-flex;align-items:center;color:var(--k-sea,#155C75);font-weight:600}.kgz-x{color:var(--k-muted,#56636F)}</style>';

// ------------------------------------------------------------------------------------------------ warning lists line (inside #watch)
export function warnDevHtml(sa, slug, lang) {
  const w = sa && sa.warnings; if (!w || !Array.isArray(w.no_match) || !w.updated) return '';
  const set = w.__set || (w.__set = new Set(w.no_match)); if (!set.has(slug)) return '';
  const ok = (w.lists || []).filter(l => l.ok); if (!ok.length) return '';
  const links = ok.map(l => '<a class="src" href="' + esc(http(l.page)) + '" rel="noopener" target="_blank"><bdi>' + esc(l.short || l.id) + '</bdi>' + (l.list_date ? ' (' + esc(fdt(l.list_date, lang)) + ')' : '') + '</a>').join(' ');
  const hand = (w.not_read || []).map(l => '<a href="' + esc(http(l.page)) + '" rel="noopener" target="_blank"><bdi>' + esc(l.name) + '</bdi></a>').join(', ');
  return '<div class="kgz-w"><h3>' + esc(t(lang, 'w_h')) + '</h3><ul class="fl"><li class="kfact">' + esc(t(lang, 'w_ok', { d: fdt(w.updated, lang), lists: '\u0001' })).replace(/\s*[(（]\u0001[)）]/, '') + '<span class="kgz-ls">' + links + '</span></li></ul><p class="k-xs">' + esc(t(lang, 'w_note')) +
    (hand ? ' ' + esc(t(lang, 'w_hand')) + ' ' + hand + '.' : '') + ' <a href="/data/sanctions.json">sanctions.json</a></p></div><style id="kgazw-css">.kgz-w{margin-top:var(--k-5,24px)}.kgz-w h3{margin:0 0 var(--k-2,8px);font-size:var(--k-fs-lg,20px)}.kgz-ls{display:flex;flex-wrap:wrap;gap:var(--k-1,4px) var(--k-3,12px);margin-top:var(--k-2,8px)}</style>';
}

// ------------------------------------------------------------------------------------------------ gazette notices section (#gazette)
const SRC = { borme: 'BORME', bodacc: 'BODACC', gazette: 'The Gazette' }, SLANG = { borme: 'es', bodacc: 'fr', gazette: 'en' };
function row(r, lang) {
  const th = t(lang, 'th'), k = t(lang, 'k');
  return '<tr><td data-label="' + esc(th[0]) + '">' + esc(fdt(r[0], lang)) + '</td><td data-label="' + esc(th[1]) + '">' + esc(k[r[3]] || k.other) + '</td><td data-label="' + esc(th[2]) + '"><bdi lang="' + (SLANG[r[1]] || 'en') + '" class="kgz-x">' + esc(r[2]) + '</bdi></td><td data-label="' + esc(th[3]) + '"><a class="src" href="' + esc(http(r[4])) + '" rel="noopener" target="_blank"><bdi>' + esc(SRC[r[1]] || r[1]) + '</bdi></a></td></tr>';
}
export function gazDevHtml(gz, slug, lang) {
  const d = gz && gz.devs && gz.devs[slug]; if (!d || !d.searched) return '';
  const names = (d.names || []).map(n => '<p class="kgz-co">' + esc(t(lang, 'g_co')) + ': <b><bdi>' + esc(n.n) + '</bdi></b> <span class="k-muted">(' + esc((t(lang, 'via') || {})[n.via] || '') + ')</span></p>').join('');
  const fr = (d.names || []).find(n => n.siren), se = d.searched, sl = [];
  if (se.borme) sl.push(t(lang, 's_borme', { a: fdt(se.borme.from, lang), b: fdt(se.borme.to, lang) }));
  if (se.bodacc) sl.push(t(lang, 's_bodacc', { n: fr ? fr.siren : '', d: fdt(se.bodacc.to, lang) }));
  if (se.gazette) sl.push(t(lang, 's_gazette', { d: fdt(se.gazette.to, lang) }));
  if (!sl.length) return '';
  const srcs = (gz.sources || []).filter(s => se[s.id]).map(s => '<a class="src" href="' + esc(http(s.url)) + '" rel="noopener" target="_blank"><bdi>' + esc(SRC[s.id] || s.id) + '</bdi></a> <span class="k-muted">(' + esc(s.licence) + ')</span>').join(' ');
  const all = (d.notices_all || []).slice(0, 30), th = t(lang, 'th'), head = '<thead><tr>' + th.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead>';
  const tbl = rows => '<div class="k-table-wrap"><table class="k-table k-table--dense k-table--stack">' + head + '<tbody>' + rows.map(r => row(r, lang)).join('') + '</tbody></table></div>';
  let body;
  if (!all.length) body = '<ul class="fl"><li class="kfact">' + esc(t(lang, 'g_none')) + ' ' + srcs + '</li></ul>';
  else body = '<p><b>' + esc(t(lang, 'g_n', { n: d.total })) + '</b>' + (d.total > all.length ? ' ' + esc(t(lang, 'g_cap', { n: all.length })) : '') + ' ' + srcs + '</p>' + tbl(all.slice(0, 8)) +
    (all.length > 8 ? '<details><summary>' + esc(t(lang, 'g_more', { n: all.length })) + '</summary>' + tbl(all.slice(8)) + '</details>' : '');
  return CSS + '<div class="kgz"><p class="ki">' + esc(t(lang, 'g_intro')) + '</p>' + names + '<ul class="kgz-s">' + sl.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' + body + '<p class="k-xs"><a href="/api/x/gazette?dev=' + esc(slug) + '">/api/x/gazette</a> · <a href="/data/gazette.json">gazette.json</a></p></div>';
}

// ------------------------------------------------------------------------------------------------ JSON API
let MEMO = null;
async function load(env) {
  if (MEMO && Date.now() - MEMO.t < 600000) return MEMO.v;
  let r = null;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request('https://kolaboro.com/_s/kolaboro.com/data/gazette.json')); } catch (e) { r = null; }
  if (!r || !r.ok) { try { r = await fetch('https://kolaboro.com/data/gazette.json?v=1', { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
  const v = r && r.ok ? await r.json().catch(() => null) : null;
  if (v) MEMO = { t: Date.now(), v };
  return v;
}
export async function handle(req, u, env) {
  const gz = await load(env); if (!gz) return out({ error: 'not_built_yet' }, 503);
  const s = u.searchParams.get('dev'), base = { version: gz.version, updated: gz.updated, note: gz.note, method: gz.method, sources: gz.sources, row: gz.row };
  if (s) { const d = gz.devs && gz.devs[s]; return out(Object.assign(base, { dev: s, searched: !!d, names: d ? d.names : [], searched_in: d ? d.searched : {}, total: d ? d.total : 0, notices: d ? d.notices_all : [], note_dev: d ? undefined : 'This developer was not searched: its pages give a brand name, or its country has no open gazette we read. Not a finding.' })); }
  return out(Object.assign(base, { developers: Object.keys(gz.devs || {}).length, devs: gz.devs }));
}
