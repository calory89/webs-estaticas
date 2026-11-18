// kolaboro.com batch 21 (agent n21c, 11 Nov 2026): official filings of developers that are listed companies. No model calls.
//   For developers whose published name matches a listed company exactly (legal-form endings such as PJSC, PLC, PCL, S.A., Inc.
//   aside), the developer page shows the exchange, the ticker and a link to the official place where the company files its
//   accounts and announcements (the exchange or the securities regulator), plus, for companies that file with the US SEC, the
//   form and date of the latest annual report from the SEC EDGAR open API. No share prices, no advice, no verdicts.
//   Sources: Wikidata (CC0) for exchange and ticker, SEC EDGAR (public domain) for US filers. Subsidiaries with another name are
//   not matched. Data: /data/listed-developers.json (one file, built by hand-checked script; see "method" inside the file).
// Routes:
//   GET /api/x/filings            every matched developer (public JSON)
//   GET /api/x/filings?dev=<slug> one developer
import { finRtHtml } from './kbx_n31c.js';   // n31c (items 129, 130)
const ORIGIN = 'https://kolaboro.com';
export const PATHS = /^\/api\/x\/filings\/?$/;
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ltr = s => '<bdi dir="ltr">' + esc(s) + '</bdi>';
const fdt = (d, l) => { if (!d) return ''; try { return new Date(d + 'T00:00:00Z').toLocaleDateString(LOC[l] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return d; } };

let MEMO = null;
export async function filingsData(env) {
  if (MEMO && Date.now() - MEMO.t < 600000) return MEMO.v;
  let r = null; const path = '/data/listed-developers.json';
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com' + path)); } catch (e) { r = null; }
  if (!r || !r.ok) { try { r = await fetch(ORIGIN + path + '?v=' + Math.floor(Date.now() / 600000), { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
  const v = r && r.ok ? await r.json().catch(() => null) : null;
  MEMO = { t: Date.now(), v }; return v;
}

const S = {
  en: { src_list: 'Exchange and ticker from the official company list, matched by exact company name', h: 'Listed company: official filings', intro: 'Shares of {co} are listed on a stock exchange. These are the official places where it files its accounts and announcements.',
    th: ['Exchange', 'Ticker', 'Where to read the filings'], fil: 'Official filings and announcements', exhome: 'Official site of the exchange',
    annual: 'Latest annual report filed with the US SEC: form {form}, filed {d}, for the year ended {p}.', annual_l: 'All filings on SEC EDGAR',
    src_wd: 'Exchange and ticker as recorded in Wikidata (CC0), matched by exact company name', src_sec: 'SEC EDGAR open data, matched by exact company name', lei: 'Legal Entity Identifier',
    cav: 'We show no share prices and give no advice. A listing says nothing about a single project. If the seller named in your contract is a subsidiary with a different name, it is not this listed company: ask which company signs.',
    json: 'Data as JSON', upd: 'checked {d}' },
  es: { src_list: 'Bolsa y símbolo de la lista oficial de empresas, por coincidencia exacta del nombre', h: 'Empresa cotizada: información oficial', intro: 'Las acciones de {co} cotizan en bolsa. Estos son los lugares oficiales donde presenta sus cuentas y comunicados.',
    th: ['Bolsa', 'Símbolo', 'Dónde leer la información'], fil: 'Información oficial y comunicados', exhome: 'Sitio oficial de la bolsa',
    annual: 'Último informe anual presentado ante la SEC de EE. UU.: formulario {form}, presentado el {d}, del ejercicio cerrado el {p}.', annual_l: 'Todos los documentos en SEC EDGAR',
    src_wd: 'Bolsa y símbolo según Wikidata (CC0), por coincidencia exacta del nombre de la empresa', src_sec: 'Datos abiertos de SEC EDGAR, por coincidencia exacta del nombre de la empresa', lei: 'Identificador de entidad jurídica (LEI)',
    cav: 'No mostramos cotizaciones ni damos consejos. Cotizar en bolsa no dice nada sobre un proyecto concreto. Si el vendedor de tu contrato es una filial con otro nombre, no es esta empresa cotizada: pregunta qué sociedad firma.',
    json: 'Datos en JSON', upd: 'comprobado el {d}' },
  fr: { src_list: 'Bourse et symbole selon la liste officielle des sociétés, par correspondance exacte du nom', h: 'Société cotée : publications officielles', intro: 'Les actions de {co} sont cotées en bourse. Voici les lieux officiels où elle dépose ses comptes et ses communiqués.',
    th: ['Bourse', 'Symbole', 'Où lire les publications'], fil: 'Publications et communiqués officiels', exhome: 'Site officiel de la bourse',
    annual: 'Dernier rapport annuel déposé auprès de la SEC américaine : formulaire {form}, déposé le {d}, pour l\'exercice clos le {p}.', annual_l: 'Tous les dépôts sur SEC EDGAR',
    src_wd: 'Bourse et symbole selon Wikidata (CC0), par correspondance exacte du nom de la société', src_sec: 'Données ouvertes SEC EDGAR, par correspondance exacte du nom de la société', lei: 'Identifiant d\'entité juridique (LEI)',
    cav: 'Nous n\'affichons aucun cours et ne donnons aucun conseil. Une cotation ne dit rien d\'un projet précis. Si le vendeur de votre contrat est une filiale portant un autre nom, ce n\'est pas cette société cotée : demandez quelle société signe.',
    json: 'Données en JSON', upd: 'vérifié le {d}' },
  de: { src_list: 'Börse und Kürzel aus der amtlichen Unternehmensliste, exakter Abgleich des Firmennamens', h: 'Börsennotiertes Unternehmen: amtliche Meldungen', intro: 'Die Aktien von {co} sind an einer Börse notiert. Hier reicht das Unternehmen offiziell seine Abschlüsse und Mitteilungen ein.',
    th: ['Börse', 'Kürzel', 'Wo die Meldungen stehen'], fil: 'Amtliche Meldungen und Mitteilungen', exhome: 'Offizielle Website der Börse',
    annual: 'Letzter bei der US-SEC eingereichter Jahresbericht: Formular {form}, eingereicht am {d}, für das Geschäftsjahr bis {p}.', annual_l: 'Alle Einreichungen bei SEC EDGAR',
    src_wd: 'Börse und Kürzel laut Wikidata (CC0), exakter Abgleich des Firmennamens', src_sec: 'Offene Daten von SEC EDGAR, exakter Abgleich des Firmennamens', lei: 'Rechtsträgerkennung (LEI)',
    cav: 'Wir zeigen keine Kurse und geben keine Empfehlungen. Eine Börsennotierung sagt nichts über ein einzelnes Projekt. Ist der Verkäufer in Ihrem Vertrag eine Tochter mit anderem Namen, ist das nicht dieses börsennotierte Unternehmen: Fragen Sie, welche Gesellschaft unterschreibt.',
    json: 'Daten als JSON', upd: 'geprüft am {d}' },
  nl: { src_list: 'Beurs en ticker uit de officiële bedrijvenlijst, exacte overeenkomst van de bedrijfsnaam', h: 'Beursgenoteerd bedrijf: officiële publicaties', intro: 'De aandelen van {co} zijn genoteerd aan een beurs. Dit zijn de officiële plaatsen waar het zijn jaarrekeningen en mededelingen indient.',
    th: ['Beurs', 'Ticker', 'Waar de publicaties staan'], fil: 'Officiële publicaties en mededelingen', exhome: 'Officiële site van de beurs',
    annual: 'Laatste jaarverslag ingediend bij de Amerikaanse SEC: formulier {form}, ingediend op {d}, over het boekjaar tot {p}.', annual_l: 'Alle documenten op SEC EDGAR',
    src_wd: 'Beurs en ticker volgens Wikidata (CC0), exacte overeenkomst van de bedrijfsnaam', src_sec: 'Open data van SEC EDGAR, exacte overeenkomst van de bedrijfsnaam', lei: 'Legal Entity Identifier (LEI)',
    cav: 'We tonen geen koersen en geven geen advies. Een notering zegt niets over één project. Is de verkoper in je contract een dochter met een andere naam, dan is dat niet dit beursgenoteerde bedrijf: vraag welke vennootschap tekent.',
    json: 'Data als JSON', upd: 'gecontroleerd op {d}' },
  ru: { src_list: 'Биржа и тикер из официального списка компаний, точное совпадение названия', h: 'Публичная компания: официальная отчётность', intro: 'Акции {co} торгуются на бирже. Вот официальные места, где компания публикует отчётность и сообщения.',
    th: ['Биржа', 'Тикер', 'Где читать отчётность'], fil: 'Официальная отчётность и сообщения', exhome: 'Официальный сайт биржи',
    annual: 'Последний годовой отчёт, поданный в SEC США: форма {form}, подан {d}, за год, закончившийся {p}.', annual_l: 'Все документы в SEC EDGAR',
    src_wd: 'Биржа и тикер по данным Wikidata (CC0), точное совпадение названия компании', src_sec: 'Открытые данные SEC EDGAR, точное совпадение названия компании', lei: 'Идентификатор юридического лица (LEI)',
    cav: 'Мы не показываем котировки и не даём советов. Листинг ничего не говорит об отдельном проекте. Если продавец в вашем договоре: дочерняя компания с другим названием, это не данная публичная компания. Спросите, какая компания подписывает.',
    json: 'Данные в JSON', upd: 'проверено {d}' },
  zh: { src_list: '交易所和代码来自官方公司名单，按公司名称完全匹配', h: '上市公司：官方披露', intro: '{co} 的股票在证券交易所上市。以下是其提交财务报告和公告的官方渠道。',
    th: ['交易所', '代码', '在哪里查阅披露'], fil: '官方披露与公告', exhome: '交易所官方网站',
    annual: '向美国 SEC 提交的最新年度报告：表格 {form}，提交于 {d}，对应截至 {p} 的财年。', annual_l: 'SEC EDGAR 上的全部文件',
    src_wd: '交易所和代码来自 Wikidata（CC0），按公司名称完全匹配', src_sec: 'SEC EDGAR 开放数据，按公司名称完全匹配', lei: '法人机构识别码（LEI）',
    cav: '我们不显示股价，也不提供建议。上市并不说明某个具体项目的情况。如果合同中的卖方是名称不同的子公司，它就不是这家上市公司：请问清由哪家公司签约。',
    json: 'JSON 数据', upd: '核查于 {d}' },
  ar: { src_list: 'السوق والرمز من القائمة الرسمية للشركات، بمطابقة تامة لاسم الشركة', h: 'شركة مدرجة: الإفصاحات الرسمية', intro: 'أسهم {co} مدرجة في سوق مالية. هذه هي الأماكن الرسمية التي تودع فيها حساباتها وإعلاناتها.',
    th: ['السوق', 'الرمز', 'أين تُقرأ الإفصاحات'], fil: 'الإفصاحات والإعلانات الرسمية', exhome: 'الموقع الرسمي للسوق',
    annual: 'آخر تقرير سنوي مودَع لدى هيئة الأوراق المالية الأمريكية (SEC): النموذج {form}، أُودع في {d}، عن السنة المنتهية في {p}.', annual_l: 'كل الإيداعات على SEC EDGAR',
    src_wd: 'السوق والرمز كما في Wikidata (CC0)، بمطابقة تامة لاسم الشركة', src_sec: 'البيانات المفتوحة لـ SEC EDGAR، بمطابقة تامة لاسم الشركة', lei: 'معرّف الكيان القانوني (LEI)',
    cav: 'لا نعرض أسعار الأسهم ولا نقدّم نصائح. الإدراج لا يقول شيئاً عن مشروع بعينه. إذا كان البائع في عقدك شركة تابعة باسم مختلف فهي ليست هذه الشركة المدرجة: اسأل أي شركة توقّع.',
    json: 'البيانات بصيغة JSON', upd: 'تم التحقق في {d}' }
};
const t = (l, k) => (S[l] && S[l][k] != null ? S[l][k] : S.en[k]);
export const filingsHeading = lang => t(lang, 'h');
const FIL_CSS = '.kfi-tw{margin:12px 0;max-width:760px;overflow-x:auto}.kfi-tw td,.kfi-tw th{vertical-align:top}.kfi-tw .k-src{white-space:normal}.kfi{overflow-wrap:anywhere}';
const okUrl = u => /^https:\/\/[a-z0-9.-]+\//i.test(String(u || ''));

// section body for the developer page ('' when the developer is not matched to a listed company)
export function filingsDevHtml(fd, slug, lang) {
  const d = fd && fd.developers && fd.developers[slug]; if (!d || !(d.l || []).length) return '';
  const EX = fd.exchanges || {}, th = t(lang, 'th');
  const rows = d.l.map(l => { const e = EX[l.x] || {}; const link = okUrl(l.u) ? '<a class="k-src" href="' + esc(l.u) + '" rel="noopener nofollow" target="_blank">' + esc(t(lang, 'fil')) + '</a>' : okUrl(e.u) ? '<a class="k-src" href="' + esc(e.u) + '" rel="noopener nofollow" target="_blank">' + esc(t(lang, 'exhome')) + '</a>' : '-';
    return '<tr><th scope="row" data-label="' + esc(th[0]) + '">' + ltr(e.n || l.x) + '</th><td data-label="' + esc(th[1]) + '">' + (l.t ? '<b>' + ltr(l.t) + '</b>' : '-') + '</td><td data-label="' + esc(th[2]) + '">' + link + '</td></tr>'; }).join('');
  let h = '<style>' + FIL_CSS + '</style><div class="kfi"><p class="kfact">' + esc(t(lang, 'intro')).replace('{co}', ltr(d.co)) + '</p>' +
    '<div class="k-table-wrap kfi-tw"><table class="k-table k-table--dense k-table--stack"><thead><tr>' + th.map(x => '<th scope="col">' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  const L = [];
  if (d.annual && d.cik) L.push(esc(t(lang, 'annual')).replace('{form}', ltr(d.annual.form)).replace('{d}', esc(fdt(d.annual.filed, lang))).replace('{p}', esc(fdt(d.annual.period, lang))) +
    ' <a class="k-src" href="https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&amp;CIK=' + esc(d.cik) + '&amp;type=' + esc(d.annual.form) + '" rel="noopener nofollow" target="_blank">' + esc(t(lang, 'annual_l')) + '</a>');
  if (d.lei) L.push(esc(t(lang, 'lei')) + ': ' + ltr(d.lei) + ' <a class="k-src" href="https://search.gleif.org/#/record/' + esc(d.lei) + '" rel="noopener" target="_blank">search.gleif.org</a>');
  if (d.q) L.push(esc(t(lang, 'src_wd')) + ' <a class="k-src" href="https://www.wikidata.org/wiki/' + esc(d.q) + '" rel="noopener" target="_blank">Wikidata ' + esc(d.q) + '</a>');
  if (d.src && fd.sources && fd.sources[d.src] && okUrl(fd.sources[d.src].url)) L.push(esc(t(lang, 'src_list')) + ' <a class="k-src" href="' + esc(fd.sources[d.src].url) + '" rel="noopener nofollow" target="_blank">' + ltr(fd.sources[d.src].name) + '</a>');
  if (d.cik) L.push(esc(t(lang, 'src_sec')) + ' <a class="k-src" href="https://data.sec.gov/submissions/CIK' + esc(String(d.cik).padStart(10, '0')) + '.json" rel="noopener nofollow" target="_blank">SEC EDGAR, CIK ' + esc(d.cik) + '</a>');
  const FR31 = finRtHtml(d, lang);   // n31c: latest results and credit ratings as the company announced them
  if (L.length || FR31) h += '<ul class="fl">' + L.map(s => '<li class="kfact">' + s + '</li>').join('') + FR31 + '</ul>';
  h += '<p class="k-small k-muted">' + esc(t(lang, 'cav')) + '</p><p class="k-small"><a class="k-src" href="/api/x/filings?dev=' + esc(slug) + '">' + esc(t(lang, 'json')) + '</a> <span class="k-muted">' + esc(String(t(lang, 'upd')).replace('{d}', fdt(fd.updated, lang))) + '</span></p></div>';
  return h;
}

// ------------------------------------------------------------------------------------------------ JSON API
export async function handle(req, u, env) {
  const H = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=600', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' };
  const out = (o, s) => new Response(JSON.stringify(o, null, 1), { status: s || 200, headers: s && s >= 400 ? Object.assign({}, H, { 'cache-control': 'no-store' }) : H });
  if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: 'method' }, 405);
  const fd = await filingsData(env); if (!fd) return out({ error: 'not_built_yet' }, 503);
  const s = (u.searchParams.get('dev') || '').toLowerCase();
  if (s) {
    if (!/^[a-z0-9-]{1,90}$/.test(s)) return out({ error: 'bad_dev' }, 400);
    const d = (fd.developers || {})[s];
    if (!d) return out({ dev: s, listed_match: false, note: 'No exact-name match to a listed company in our sources. This is not a finding: the developer may be private, listed under another name, or a subsidiary of a listed group.', updated: fd.updated }, 404);
    return out({ dev: s, url: ORIGIN + '/developers/' + s + '/#filings', listed_match: true, updated: fd.updated, company: d.co, wikidata: d.q || null, lei: d.lei || null, sec_cik: d.cik || null,
      listings: d.l.map(l => ({ exchange: (fd.exchanges[l.x] || {}).n || l.x, ticker: l.t || null, filings: l.u || (fd.exchanges[l.x] || {}).u || null })), latest_annual_report_sec: d.annual || null, results_as_published: d.fin || null, credit_ratings_as_announced: d.rt || null, sources: fd.sources });
  }
  return out(Object.assign({ per_developer: ORIGIN + '/api/x/filings?dev=<slug>' }, fd));
}
