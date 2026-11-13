// kolaboro.com batch 27 (agent n27a, item 89): one dated, sourced lead sentence at the top of the main sections of a named project
// page, so an answer engine that quotes only the first line of a section still gets the fact, its date and its source.
// Built only from fields we hold; inserted after the section heading whatever markup wraps it (h2, or a folded summary).
// No imports from kbx_named.js (it imports this file): helpers come in as arguments.
const T = {
  en: { del: 'Handover on record: {d}, as seen on {s} on {seen}.', del_n: 'No handover date published in the sources we read (checked {c}).', perm: 'Permit or licence number {pn}, published by {s}.', perm_n: 'No permit or licence number published in the sources we read (checked {c}).', dev: 'Developer as published: {dv}, on {s} (checked {c}).', where: 'Location as published: {a}, on {s} (checked {c}).', chk: '{k} of 6 buyer checks public, {v} confirmed by a register or an independent source (checked {c}).', tr: 'Transparency score {v} of 100, computed on {d} from public sources.' },
  es: { del: 'Entrega registrada: {d}, según {s} el {seen}.', del_n: 'Ninguna fecha de entrega publicada en las fuentes que leímos (revisado el {c}).', perm: 'Número de permiso o licencia {pn}, publicado por {s}.', perm_n: 'Ningún número de permiso o licencia publicado en las fuentes que leímos (revisado el {c}).', dev: 'Promotora según lo publicado: {dv}, en {s} (revisado el {c}).', where: 'Ubicación según lo publicado: {a}, en {s} (revisado el {c}).', chk: '{k} de 6 comprobaciones públicas, {v} confirmadas por un registro o una fuente independiente (revisado el {c}).', tr: 'Puntuación de transparencia {v} de 100, calculada el {d} con fuentes públicas.' },
  de: { del: 'Erfasster Übergabetermin: {d}, gesehen auf {s} am {seen}.', del_n: 'In den gelesenen Quellen ist kein Übergabetermin veröffentlicht (geprüft am {c}).', perm: 'Genehmigungs- oder Lizenznummer {pn}, veröffentlicht von {s}.', perm_n: 'In den gelesenen Quellen ist keine Genehmigungs- oder Lizenznummer veröffentlicht (geprüft am {c}).', dev: 'Bauträger laut Veröffentlichung: {dv}, auf {s} (geprüft am {c}).', where: 'Lage laut Veröffentlichung: {a}, auf {s} (geprüft am {c}).', chk: '{k} von 6 Käuferprüfungen öffentlich, {v} durch ein Register oder eine unabhängige Quelle bestätigt (geprüft am {c}).', tr: 'Transparenzwert {v} von 100, berechnet am {d} aus öffentlichen Quellen.' },
  fr: { del: 'Livraison enregistrée : {d}, vue sur {s} le {seen}.', del_n: 'Aucune date de livraison publiée dans les sources lues (vérifié le {c}).', perm: 'Numéro de permis ou de licence {pn}, publié par {s}.', perm_n: 'Aucun numéro de permis ou de licence publié dans les sources lues (vérifié le {c}).', dev: 'Promoteur tel que publié : {dv}, sur {s} (vérifié le {c}).', where: 'Emplacement tel que publié : {a}, sur {s} (vérifié le {c}).', chk: '{k} vérifications acheteur sur 6 publiques, {v} confirmées par un registre ou une source indépendante (vérifié le {c}).', tr: 'Score de transparence {v} sur 100, calculé le {d} à partir de sources publiques.' },
  nl: { del: 'Opleverdatum in onze gegevens: {d}, gezien op {s} op {seen}.', del_n: 'Geen opleverdatum gepubliceerd in de bronnen die we lazen (gecontroleerd op {c}).', perm: 'Vergunnings- of licentienummer {pn}, gepubliceerd door {s}.', perm_n: 'Geen vergunnings- of licentienummer gepubliceerd in de bronnen die we lazen (gecontroleerd op {c}).', dev: 'Ontwikkelaar zoals gepubliceerd: {dv}, op {s} (gecontroleerd op {c}).', where: 'Locatie zoals gepubliceerd: {a}, op {s} (gecontroleerd op {c}).', chk: '{k} van 6 kopercontroles openbaar, {v} bevestigd door een register of een onafhankelijke bron (gecontroleerd op {c}).', tr: 'Transparantiescore {v} van 100, berekend op {d} uit openbare bronnen.' },
  ru: { del: 'Срок сдачи в наших данных: {d}, по данным {s} на {seen}.', del_n: 'В прочитанных источниках срок сдачи не опубликован (проверено {c}).', perm: 'Номер разрешения или лицензии {pn}, опубликован: {s}.', perm_n: 'В прочитанных источниках номер разрешения или лицензии не опубликован (проверено {c}).', dev: 'Застройщик по опубликованным данным: {dv}, источник {s} (проверено {c}).', where: 'Расположение по опубликованным данным: {a}, источник {s} (проверено {c}).', chk: 'Открыто проверок покупателя: {k} из 6, подтверждено реестром или независимым источником: {v} (проверено {c}).', tr: 'Оценка прозрачности {v} из 100, рассчитана {d} по открытым источникам.' },
  zh: { del: '记录的交付日期：{d}，见于 {s}（{seen}）。', del_n: '我们读取的来源中没有公布交付日期（核查于 {c}）。', perm: '许可证或执照编号 {pn}，由 {s} 公布。', perm_n: '我们读取的来源中没有公布许可证或执照编号（核查于 {c}）。', dev: '公布的开发商：{dv}，来源 {s}（核查于 {c}）。', where: '公布的位置：{a}，来源 {s}（核查于 {c}）。', chk: '6 项买家核查中 {k} 项公开，{v} 项经登记机构或独立来源确认（核查于 {c}）。', tr: '透明度评分 {v}/100，于 {d} 根据公开来源计算。' },
  ar: { del: 'موعد التسليم المسجّل: {d}، كما ظهر على {s} في {seen}.', del_n: 'لا يوجد موعد تسليم منشور في المصادر التي قرأناها (تم التحقق في {c}).', perm: 'رقم التصريح أو الترخيص {pn}، نشره {s}.', perm_n: 'لا يوجد رقم تصريح أو ترخيص منشور في المصادر التي قرأناها (تم التحقق في {c}).', dev: 'المطوّر كما نُشر: {dv}، على {s} (تم التحقق في {c}).', where: 'الموقع كما نُشر: {a}، على {s} (تم التحقق في {c}).', chk: '{k} من 6 فحوص للمشتري منشورة، و{v} مؤكدة من سجل أو مصدر مستقل (تم التحقق في {c}).', tr: 'درجة الشفافية {v} من 100، محسوبة في {d} من مصادر عامة.' } };
// item 88: the record of this project as files (JSON, CSV, Markdown), under the sources
const DL = { en: 'Download this record', es: 'Descargar esta ficha', de: 'Diesen Datensatz herunterladen', fr: 'Télécharger cette fiche', nl: 'Dit record downloaden', ru: 'Скачать эту запись', zh: '下载此记录', ar: 'تنزيل هذا السجل' };
export const dlLine = (lang, s) => '<p class="ki">' + (DL[lang] || DL.en) + ': <a href="/api/v1/projects/' + s + '" rel="nofollow">JSON</a> · <a href="/api/v1/projects/' + s + '.csv" rel="nofollow">CSV</a> · <a href="/answers/' + s + '.md">Markdown</a> (CC BY 4.0)</p>';
// item 96: link from the developer page to its read-only dashboard
const DD = { en: 'Developer dashboard: your score and what is missing', es: 'Panel del promotor: su puntuación y lo que falta', de: 'Bauträger-Übersicht: Ihr Wert und was fehlt', fr: 'Tableau de bord du promoteur : votre score et ce qui manque', nl: 'Dashboard voor ontwikkelaars: uw score en wat ontbreekt', ru: 'Панель застройщика: ваша оценка и чего не хватает', zh: '开发商面板：您的评分和缺少的内容', ar: 'لوحة المطوّر: درجتك وما ينقص' };
export const devDash = (lang, s) => '<p><a href="' + (lang === 'en' ? '' : '/' + lang) + '/developers/' + s + '/dashboard/">' + (DD[lang] || DD.en) + '</a></p>';
export const LEAD_CSS = '<style>.klead{margin:0 0 12px;font-weight:600;line-height:1.45}.klead .k-src{font-weight:400}</style>';
const ISO = /^\d{4}-\d{2}-\d{2}/;
// h: { esc, fd, host, okHttp, fixU, handoverOf, reviewed } from kbx_named.js; tp: transparency (kbx_tr.js) or null
export function leadMap(ix, x, lang, tp, checked, h) {
  const L = T[lang] || T.en, c = ix.caseBy.get(x.id) || {}, rv = h.reviewed(c);
  const fill = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
  const src = u => h.okHttp(u) ? '<a class="k-src" href="' + h.esc(h.fixU(u)) + '" rel="noopener nofollow" target="_blank"><bdi>' + h.esc(h.host(h.fixU(u))) + '</bdi></a>' : null;
  const tx = (k, v, raw) => fill(h.esc(L[k]), Object.assign({}, ...Object.entries(v).map(([a, b]) => ({ [a]: raw && raw.includes(a) ? b : h.esc(b) }))));
  const ck = h.esc(h.fd(checked, lang)), out = {}, page = src(x.url);
  // delivery: the handover promise and when we last saw it, or "not published"
  const ho = h.handoverOf(ix, x), pr = (ix.prom[x.id] || []).find(p => p.k === 'handover');
  if (ho && page) { const H = (pr && pr.hist) || [], seen = (H.length ? H[H.length - 1].seen : null) || (pr && pr.seen) || checked;
    out.delivery = tx('del', { d: h.fd(ho.d, lang), s: page, seen: h.fd(ISO.test(String(seen)) ? String(seen).slice(0, 10) : checked, lang) }, ['s']); }
  else if (!ho) out.delivery = tx('del_n', { c: ck }, ['c']);
  // permits
  const ps = src(x.du) || page;
  if (x.pn && ps) out.permits = tx('perm', { pn: '<bdi>' + h.esc(x.pn) + '</bdi>', s: ps }, ['pn', 's']);
  else if (!x.pn) out.permits = tx('perm_n', { c: ck }, ['c']);
  // developer and location, as published on the page we track
  if (x.dv && page) out.developer = tx('dev', { dv: '<bdi>' + h.esc(x.dv) + '</bdi>', s: page, c: ck }, ['dv', 's', 'c']);
  const area = [x.ar && x.ar !== x.mk ? x.ar : null, x.mk].filter(Boolean).join(', ');
  if (area && page) out.where = tx('where', { a: '<bdi>' + h.esc(area) + '</bdi>', s: page, c: ck }, ['a', 's', 'c']);
  // checks, reviewed projects only (not yet reviewed projects carry no check results)
  if (rv && typeof c.score === 'number') out.checks = tx('chk', { k: c.score, v: c.vscore || 0, c: ck }, ['c']) + ' <a class="k-src" href="/how-we-score/">kolaboro.com</a>';
  if (tp && typeof tp.score === 'number' && tp.updated) out.legit = tx('tr', { v: tp.score, d: h.fd(String(tp.updated).slice(0, 10), lang) }) + ' <a class="k-src" href="' + h.esc(tp.method) + '">kolaboro.com</a>';
  return out;
}
// insert each lead right after the heading of its section (works for <h2> and for a heading inside <summary>)
export function leadify(body, leads) {
  let n = 0;
  for (const [id, html] of Object.entries(leads)) {
    const i = body.indexOf(' id="' + id + '"'); if (i < 0) continue;
    const sStart = body.lastIndexOf('<', i);
    if (!/^<(section|details|div)\b/.test(body.slice(sStart, sStart + 9))) continue;
    const a = body.indexOf('</h2>', i), so = body.indexOf('<summary', i), b = so >= 0 ? body.indexOf('</summary>', so) : -1;
    const useS = b >= 0 && (a < 0 || so < a);   // a heading inside a folded <summary>: the lead goes after the summary, into the open body
    if (!useS && a < 0) continue;
    const end = useS ? b + 10 : a + 5;
    if (body.slice(end, end + 40).includes('class="klead"')) continue;
    body = body.slice(0, end) + '<p class="klead">' + html + '</p>' + body.slice(end); n++;
  }
  return n ? body.replace('<div class="wrap kwrap">', LEAD_CSS + '<div class="wrap kwrap">') : body;
}
