// kolaboro.com batch 18 (agent n18d, 8 Nov 2026): paperwork that protects buyers. No model calls, nothing stored.
//   (2) Prices over time on named project pages: the prices printed on the page we track, from our sealed copies (page-history,
//       the same SHA-256 copies as /projects/<slug>/changes/) and Internet Archive captures since 2017. Data: /data/price-history.json,
//       built daily on main by .github/workflows/kolaboro-paperwork.yml (tools/kolaboro-agent/paperwork.py). Currency as printed.
//   (8) Planning and building records near the site, on named project pages with a reliable pin (3+ decimals): England
//       (planning.data.gov.uk, OGL v3.0), New York City (DOB NOW filings), City of Miami (building permits). Data: /data/planning.json
//       (same Action); for England a "check the register now" button asks planning.data.gov.uk from the edge (cached one day).
//   (9) /tools/contract-addendum/ (8 languages): protective clauses to propose to the developer, each with the article of law it
//       relies on (law notes in /tools/law/law.json plus official texts quoted below), built in the browser as PDF (jsPDF 2.5.1,
//       MIT, pinned on jsDelivr, loaded on click) and as an editable Word .docx (written by this page's own code). Inputs never leave
//       the device. A draft to discuss with a lawyer, not legal advice.
// Routes:
//   GET /api/x/paper/<ID>                 prices over time and planning records of one named project (public JSON)
//   GET /api/x/paper/planning/<ID>/live   England only: planning.data.gov.uk within 200 m of the pin, now (cached 1 day, rate-limited)
//   GET /tools/contract-addendum/  /<lang>/tools/contract-addendum/
const ORIGIN = 'https://kolaboro.com';
export const PATHS = /^\/api\/x\/paper\//;
export const TOOL_RX = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?tools\/contract-addendum\/?$/;
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pre = l => l === 'en' ? '' : '/' + l;
const OPINION = /\b(scam\w*|fraud\w*|ponzi|swindl\w*|rip-?off|avoid\w*|beware|dodgy|shady|crook\w*|estafa\w*|fraude\w*|timo|betrug\w*|arnaque\w*|escroc\w*|oplicht\w*|bedrog\w*)\b|мошен|обман|афер|骗局|诈骗|欺诈|احتيال|نصب/i;
const MASK = s => String(s || '').replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[e-mail]').replace(/\+?\d[\d ()-]{8,}\d/g, m => /\d{1,3}([.,\s]\d{3}){2,}/.test(m) ? m : '[phone]');

// ------------------------------------------------------------------------------------------------ data
let MEMO = {};
async function loadOne(env, path, ttl) {
  const m = MEMO[path]; if (m && Date.now() - m.t < (ttl || 600000)) return m.v;
  let r = null;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com' + path)); } catch (e) { r = null; }
  if (!r || !r.ok) { try { r = await fetch(ORIGIN + path + '?v=' + Math.floor(Date.now() / 600000), { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
  const v = r && r.ok ? await r.json().catch(() => null) : null;
  MEMO[path] = { t: Date.now(), v }; return v;
}
export async function paperData(env) {
  const [ph, pl] = await Promise.all([loadOne(env, '/data/price-history.json'), loadOne(env, '/data/planning.json')]);
  return { ph, pl, v: ((ph && ph.updated) || '') + '/' + ((pl && pl.updated) || '') };
}

// ------------------------------------------------------------------------------------------------ strings for named pages (8 languages)
const N = {
  en: { ph_ncopies: '{n} identical copies', ph_nohead: 'No price on this page is introduced by a word like "from" or "price", so we list the prices as printed and pick no headline.', ph_h: 'Prices over time', ph_toc: 'Prices',
    ph_intro: 'Prices printed on the page we track ({host}), by date of our copy. Currency as printed; we convert nothing.',
    ph_first: 'First headline price we hold: {p} ({d}).', ph_last: 'Latest: {p} ({d}).', ph_same: 'The headline price is the same in all {n} dated copies.',
    ph_chg: 'Change from the first to the latest copy, in {cur}: {pct}.', ph_cur2: 'Copies show the headline in more than one currency, so we do not compute a change.',
    ph_none: 'None of our {n} dated copies of this page ({a} to {b}) shows a price. No prices published.', ph_nocopy: 'We hold no dated copy of this page yet, so we cannot show its prices over time.',
    ph_th: ['Date', 'Copy', 'Headline price as printed', 'Other prices printed'], ph_copy: 'Our sealed copy', ph_ia: 'Internet Archive', ph_open: 'open copy', ph_noprice: 'no price printed',
    ph_rule: 'Headline: the first price printed after a word like "from" or "price". Portal pages can list other projects too; the words around each price show what it refers to.',
    ph_src: 'Copies used: {a} of ours (SHA-256 sealed) and {b} from the Internet Archive.', ph_chart: 'Headline price in {cur} by date of copy. Each point opens its copy.', ph_json: 'Data as JSON',
    k_per_m2: 'per m²', k_rent: 'rent', k_small: 'fee or small amount',
    pl_h: 'Planning and building records near the site', pl_toc: 'Planning',
    pl_intro: 'Official records within {r} m of the pin, from {src}. The pin is about 100 m accurate, so a record can concern a neighbouring plot.',
    pl_th: ['Reference', 'Address or site', 'What', 'Status', 'Submitted', 'Decided or issued', 'Distance'],
    pl_none: 'No record within {r} m in this register (checked {d}).', pl_err: 'The register did not answer when we last checked ({d}).', pl_live: 'Check the register now',
    pl_out: 'This site is outside England. Scotland, Wales and Northern Ireland run their own planning portals and have no national open API. Search the council\'s portal, for Scotland:',
    pl_lic: 'Licence', pl_priv: 'We never copy names, phone numbers or e-mail addresses of applicants, owners or contractors.', pl_rule_nyc: 'Shown: new-building filings and other filings with an estimated cost of USD 1 million or more.',
    pl_rule_mia: 'Shown: permits with a total cost of USD 1 million or more. City of Miami only.', pl_cost: 'cost', pl_load: 'Asking the register', pl_live_none: 'No record found within 200 m today.', pl_live_err: 'The register is not answering right now. Try again later.', pl_stale: 'Last good answer, from {d}.' },
  es: { ph_ncopies: '{n} copias idénticas', ph_nohead: 'Ningún precio de esta página va precedido de palabras como "desde" o "precio", así que listamos los precios tal como aparecen sin elegir uno destacado.', ph_h: 'Precios a lo largo del tiempo', ph_toc: 'Precios',
    ph_intro: 'Precios impresos en la página que seguimos ({host}), por fecha de nuestra copia. Moneda tal como aparece; no convertimos nada.',
    ph_first: 'Primer precio destacado que tenemos: {p} ({d}).', ph_last: 'Último: {p} ({d}).', ph_same: 'El precio destacado es el mismo en las {n} copias fechadas.',
    ph_chg: 'Cambio de la primera a la última copia, en {cur}: {pct}.', ph_cur2: 'Las copias muestran el precio en más de una moneda, así que no calculamos un cambio.',
    ph_none: 'Ninguna de nuestras {n} copias fechadas de esta página ({a} a {b}) muestra un precio. No se publican precios.', ph_nocopy: 'Aún no tenemos ninguna copia fechada de esta página, así que no podemos mostrar sus precios en el tiempo.',
    ph_th: ['Fecha', 'Copia', 'Precio destacado tal como aparece', 'Otros precios impresos'], ph_copy: 'Nuestra copia sellada', ph_ia: 'Internet Archive', ph_open: 'abrir copia', ph_noprice: 'sin precio',
    ph_rule: 'Precio destacado: el primero que aparece tras palabras como "desde" o "precio". Los portales pueden listar otros proyectos; el texto alrededor de cada precio muestra a qué se refiere.',
    ph_src: 'Copias usadas: {a} nuestras (selladas con SHA-256) y {b} del Internet Archive.', ph_chart: 'Precio destacado en {cur} por fecha de copia. Cada punto abre su copia.', ph_json: 'Datos en JSON',
    k_per_m2: 'por m²', k_rent: 'alquiler', k_small: 'tasa o importe pequeño',
    pl_h: 'Expedientes urbanísticos y de obra cerca del solar', pl_toc: 'Urbanismo',
    pl_intro: 'Registros oficiales a menos de {r} m del punto, de {src}. El punto tiene unos 100 m de precisión, así que un registro puede referirse a una parcela vecina.',
    pl_th: ['Referencia', 'Dirección o solar', 'Qué', 'Estado', 'Presentado', 'Resuelto o concedido', 'Distancia'],
    pl_none: 'Ningún registro a menos de {r} m en este registro (consultado el {d}).', pl_err: 'El registro no respondió en nuestra última consulta ({d}).', pl_live: 'Consultar el registro ahora',
    pl_out: 'Este solar está fuera de Inglaterra. Escocia, Gales e Irlanda del Norte tienen sus propios portales sin API abierta nacional. Busque en el portal del ayuntamiento; para Escocia:',
    pl_lic: 'Licencia', pl_priv: 'Nunca copiamos nombres, teléfonos ni correos de solicitantes, propietarios o constructores.', pl_rule_nyc: 'Se muestran: solicitudes de obra nueva y otras con un coste estimado de 1 millón de USD o más.',
    pl_rule_mia: 'Se muestran: permisos con un coste total de 1 millón de USD o más. Solo la ciudad de Miami.', pl_cost: 'coste', pl_load: 'Consultando el registro', pl_live_none: 'Hoy no hay ningún registro a menos de 200 m.', pl_live_err: 'El registro no responde ahora. Inténtelo más tarde.', pl_stale: 'Última respuesta válida, del {d}.' },
  fr: { ph_ncopies: '{n} copies identiques', ph_nohead: 'Aucun prix de cette page n\'est introduit par un mot comme « à partir de » ou « prix » ; nous listons donc les prix tels qu\'imprimés, sans prix affiché.', ph_h: 'Les prix dans le temps', ph_toc: 'Prix',
    ph_intro: 'Prix imprimés sur la page que nous suivons ({host}), par date de notre copie. Devise telle qu\'imprimée ; nous ne convertissons rien.',
    ph_first: 'Premier prix affiché que nous avons : {p} ({d}).', ph_last: 'Dernier : {p} ({d}).', ph_same: 'Le prix affiché est le même dans les {n} copies datées.',
    ph_chg: 'Variation de la première à la dernière copie, en {cur} : {pct}.', ph_cur2: 'Les copies affichent le prix dans plusieurs devises ; nous ne calculons donc pas de variation.',
    ph_none: 'Aucune de nos {n} copies datées de cette page ({a} au {b}) ne montre de prix. Aucun prix publié.', ph_nocopy: 'Nous n\'avons encore aucune copie datée de cette page ; impossible de montrer ses prix dans le temps.',
    ph_th: ['Date', 'Copie', 'Prix affiché tel qu\'imprimé', 'Autres prix imprimés'], ph_copy: 'Notre copie scellée', ph_ia: 'Internet Archive', ph_open: 'ouvrir la copie', ph_noprice: 'aucun prix',
    ph_rule: 'Prix affiché : le premier prix imprimé après un mot comme « à partir de » ou « prix ». Les portails listent parfois d\'autres projets ; le texte autour de chaque prix montre à quoi il se rapporte.',
    ph_src: 'Copies utilisées : {a} des nôtres (scellées SHA-256) et {b} de l\'Internet Archive.', ph_chart: 'Prix affiché en {cur} par date de copie. Chaque point ouvre sa copie.', ph_json: 'Données JSON',
    k_per_m2: 'par m²', k_rent: 'loyer', k_small: 'frais ou petit montant',
    pl_h: 'Dossiers d\'urbanisme et de construction près du terrain', pl_toc: 'Urbanisme',
    pl_intro: 'Registres officiels à moins de {r} m du repère, source : {src}. Le repère est précis à environ 100 m ; un dossier peut concerner une parcelle voisine.',
    pl_th: ['Référence', 'Adresse ou terrain', 'Objet', 'Statut', 'Déposé', 'Décidé ou délivré', 'Distance'],
    pl_none: 'Aucun dossier à moins de {r} m dans ce registre (vérifié le {d}).', pl_err: 'Le registre n\'a pas répondu lors de notre dernière vérification ({d}).', pl_live: 'Interroger le registre maintenant',
    pl_out: 'Ce terrain est hors d\'Angleterre. L\'Écosse, le pays de Galles et l\'Irlande du Nord ont leurs propres portails, sans API ouverte nationale. Cherchez sur le portail du conseil ; pour l\'Écosse :',
    pl_lic: 'Licence', pl_priv: 'Nous ne copions jamais les noms, téléphones ou e-mails des demandeurs, propriétaires ou entrepreneurs.', pl_rule_nyc: 'Affichés : demandes de construction neuve et autres demandes d\'un coût estimé d\'au moins 1 million USD.',
    pl_rule_mia: 'Affichés : permis d\'un coût total d\'au moins 1 million USD. Ville de Miami uniquement.', pl_cost: 'coût', pl_load: 'Interrogation du registre', pl_live_none: 'Aucun dossier à moins de 200 m aujourd\'hui.', pl_live_err: 'Le registre ne répond pas pour le moment. Réessayez plus tard.', pl_stale: 'Dernière réponse valide, du {d}.' },
  de: { ph_ncopies: '{n} gleiche Kopien', ph_nohead: 'Kein Preis auf dieser Seite steht nach einem Wort wie „ab“ oder „Preis“; wir listen die Preise wie angegeben und wählen keinen angezeigten Preis.', ph_h: 'Preise im Zeitverlauf', ph_toc: 'Preise',
    ph_intro: 'Preise, die auf der von uns verfolgten Seite ({host}) stehen, nach Datum unserer Kopie. Währung wie angegeben; wir rechnen nichts um.',
    ph_first: 'Erster angezeigter Preis in unseren Kopien: {p} ({d}).', ph_last: 'Neuester: {p} ({d}).', ph_same: 'Der angezeigte Preis ist in allen {n} datierten Kopien gleich.',
    ph_chg: 'Änderung von der ersten zur neuesten Kopie, in {cur}: {pct}.', ph_cur2: 'Die Kopien zeigen den Preis in mehr als einer Währung, daher berechnen wir keine Änderung.',
    ph_none: 'Keine unserer {n} datierten Kopien dieser Seite ({a} bis {b}) zeigt einen Preis. Keine Preise veröffentlicht.', ph_nocopy: 'Wir haben noch keine datierte Kopie dieser Seite und können keine Preise im Zeitverlauf zeigen.',
    ph_th: ['Datum', 'Kopie', 'Angezeigter Preis wie angegeben', 'Weitere Preise auf der Seite'], ph_copy: 'Unsere versiegelte Kopie', ph_ia: 'Internet Archive', ph_open: 'Kopie öffnen', ph_noprice: 'kein Preis',
    ph_rule: 'Angezeigter Preis: der erste Preis nach einem Wort wie „ab“ oder „Preis“. Portale listen oft weitere Projekte; der Text um jeden Preis zeigt, worauf er sich bezieht.',
    ph_src: 'Verwendete Kopien: {a} eigene (mit SHA-256 versiegelt) und {b} aus dem Internet Archive.', ph_chart: 'Angezeigter Preis in {cur} nach Datum der Kopie. Jeder Punkt öffnet seine Kopie.', ph_json: 'Daten als JSON',
    k_per_m2: 'pro m²', k_rent: 'Miete', k_small: 'Gebühr oder kleiner Betrag',
    pl_h: 'Bau- und Planungsakten nahe dem Grundstück', pl_toc: 'Planung',
    pl_intro: 'Amtliche Einträge im Umkreis von {r} m um die Markierung, aus {src}. Die Markierung ist etwa 100 m genau; ein Eintrag kann ein Nachbargrundstück betreffen.',
    pl_th: ['Aktenzeichen', 'Adresse oder Grundstück', 'Gegenstand', 'Status', 'Eingereicht', 'Entschieden oder erteilt', 'Entfernung'],
    pl_none: 'Kein Eintrag im Umkreis von {r} m in diesem Register (geprüft am {d}).', pl_err: 'Das Register hat bei unserer letzten Prüfung nicht geantwortet ({d}).', pl_live: 'Register jetzt abfragen',
    pl_out: 'Dieses Grundstück liegt außerhalb Englands. Schottland, Wales und Nordirland haben eigene Portale ohne landesweite offene Schnittstelle. Suchen Sie im Portal der Gemeinde; für Schottland:',
    pl_lic: 'Lizenz', pl_priv: 'Wir übernehmen nie Namen, Telefonnummern oder E-Mail-Adressen von Antragstellern, Eigentümern oder Baufirmen.', pl_rule_nyc: 'Angezeigt: Neubauanträge und andere Anträge mit geschätzten Kosten ab 1 Mio. USD.',
    pl_rule_mia: 'Angezeigt: Genehmigungen mit Gesamtkosten ab 1 Mio. USD. Nur Stadt Miami.', pl_cost: 'Kosten', pl_load: 'Register wird abgefragt', pl_live_none: 'Heute kein Eintrag im Umkreis von 200 m.', pl_live_err: 'Das Register antwortet gerade nicht. Bitte später erneut versuchen.', pl_stale: 'Letzte gültige Antwort vom {d}.' },
  nl: { ph_ncopies: '{n} identieke kopieën', ph_nohead: 'Geen prijs op deze pagina staat na een woord als "vanaf" of "prijs", dus we tonen de prijzen zoals vermeld zonder getoonde prijs te kiezen.', ph_h: 'Prijzen door de tijd', ph_toc: 'Prijzen',
    ph_intro: 'Prijzen die op de pagina staan die we volgen ({host}), per datum van onze kopie. Valuta zoals vermeld; we rekenen niets om.',
    ph_first: 'Eerste getoonde prijs in onze kopieën: {p} ({d}).', ph_last: 'Laatste: {p} ({d}).', ph_same: 'De getoonde prijs is gelijk in alle {n} gedateerde kopieën.',
    ph_chg: 'Verandering van de eerste naar de laatste kopie, in {cur}: {pct}.', ph_cur2: 'De kopieën tonen de prijs in meer dan één valuta, dus we berekenen geen verandering.',
    ph_none: 'Geen van onze {n} gedateerde kopieën van deze pagina ({a} tot {b}) toont een prijs. Geen prijzen gepubliceerd.', ph_nocopy: 'We hebben nog geen gedateerde kopie van deze pagina, dus we kunnen geen prijzen door de tijd tonen.',
    ph_th: ['Datum', 'Kopie', 'Getoonde prijs zoals vermeld', 'Andere vermelde prijzen'], ph_copy: 'Onze verzegelde kopie', ph_ia: 'Internet Archive', ph_open: 'kopie openen', ph_noprice: 'geen prijs',
    ph_rule: 'Getoonde prijs: de eerste prijs na een woord als "vanaf" of "prijs". Portalen tonen soms ook andere projecten; de tekst rond elke prijs laat zien waar die bij hoort.',
    ph_src: 'Gebruikte kopieën: {a} van ons (verzegeld met SHA-256) en {b} uit het Internet Archive.', ph_chart: 'Getoonde prijs in {cur} per datum van de kopie. Elk punt opent zijn kopie.', ph_json: 'Gegevens als JSON',
    k_per_m2: 'per m²', k_rent: 'huur', k_small: 'kosten of klein bedrag',
    pl_h: 'Bouw- en planningsdossiers bij het terrein', pl_toc: 'Planning',
    pl_intro: 'Officiële dossiers binnen {r} m van de markering, uit {src}. De markering is ongeveer 100 m nauwkeurig; een dossier kan over een buurperceel gaan.',
    pl_th: ['Kenmerk', 'Adres of terrein', 'Wat', 'Status', 'Ingediend', 'Besloten of verleend', 'Afstand'],
    pl_none: 'Geen dossier binnen {r} m in dit register (gecontroleerd op {d}).', pl_err: 'Het register antwoordde niet bij onze laatste controle ({d}).', pl_live: 'Register nu raadplegen',
    pl_out: 'Dit terrein ligt buiten Engeland. Schotland, Wales en Noord-Ierland hebben eigen portalen zonder landelijke open API. Zoek in het portaal van de gemeente; voor Schotland:',
    pl_lic: 'Licentie', pl_priv: 'We nemen nooit namen, telefoonnummers of e-mailadressen van aanvragers, eigenaren of aannemers over.', pl_rule_nyc: 'Getoond: aanvragen voor nieuwbouw en andere aanvragen met geschatte kosten vanaf 1 miljoen USD.',
    pl_rule_mia: 'Getoond: vergunningen met totale kosten vanaf 1 miljoen USD. Alleen de stad Miami.', pl_cost: 'kosten', pl_load: 'Register wordt geraadpleegd', pl_live_none: 'Vandaag geen dossier binnen 200 m.', pl_live_err: 'Het register antwoordt nu niet. Probeer het later opnieuw.', pl_stale: 'Laatste geldige antwoord, van {d}.' },
  ru: { ph_ncopies: 'одинаковых копий: {n}', ph_nohead: 'Ни одна цена на этой странице не идёт после слов вроде «от» или «цена», поэтому мы показываем цены как есть, без заявленной цены.', ph_h: 'Цены во времени', ph_toc: 'Цены',
    ph_intro: 'Цены, напечатанные на странице, которую мы отслеживаем ({host}), по дате нашей копии. Валюта как на странице; мы ничего не пересчитываем.',
    ph_first: 'Первая заявленная цена в наших копиях: {p} ({d}).', ph_last: 'Последняя: {p} ({d}).', ph_same: 'Заявленная цена одинакова во всех {n} датированных копиях.',
    ph_chg: 'Изменение от первой до последней копии, в {cur}: {pct}.', ph_cur2: 'В копиях цена указана в разных валютах, поэтому изменение не считаем.',
    ph_none: 'Ни одна из наших {n} датированных копий этой страницы ({a} – {b}) не показывает цену. Цены не опубликованы.', ph_nocopy: 'У нас пока нет датированной копии этой страницы, поэтому показать цены во времени нельзя.',
    ph_th: ['Дата', 'Копия', 'Заявленная цена как на странице', 'Другие цены на странице'], ph_copy: 'Наша запечатанная копия', ph_ia: 'Internet Archive', ph_open: 'открыть копию', ph_noprice: 'цены нет',
    ph_rule: 'Заявленная цена: первая цена после слов вроде «от» или «цена». Порталы могут показывать и другие проекты; текст вокруг каждой цены показывает, к чему она относится.',
    ph_src: 'Использованные копии: {a} наших (запечатаны SHA-256) и {b} из Internet Archive.', ph_chart: 'Заявленная цена в {cur} по дате копии. Каждая точка открывает свою копию.', ph_json: 'Данные в JSON',
    k_per_m2: 'за м²', k_rent: 'аренда', k_small: 'сбор или малая сумма',
    pl_h: 'Градостроительные и строительные записи рядом с участком', pl_toc: 'Планирование',
    pl_intro: 'Официальные записи в радиусе {r} м от метки, источник: {src}. Точность метки около 100 м, запись может относиться к соседнему участку.',
    pl_th: ['Номер', 'Адрес или участок', 'Что', 'Статус', 'Подано', 'Решено или выдано', 'Расстояние'],
    pl_none: 'В этом реестре нет записей в радиусе {r} м (проверено {d}).', pl_err: 'Реестр не ответил при последней проверке ({d}).', pl_live: 'Проверить реестр сейчас',
    pl_out: 'Участок находится вне Англии. У Шотландии, Уэльса и Северной Ирландии свои порталы без общенационального открытого API. Ищите на портале совета; для Шотландии:',
    pl_lic: 'Лицензия', pl_priv: 'Мы никогда не копируем имена, телефоны и e-mail заявителей, владельцев или подрядчиков.', pl_rule_nyc: 'Показаны: заявки на новое строительство и другие заявки со сметой от 1 млн USD.',
    pl_rule_mia: 'Показаны: разрешения с общей стоимостью от 1 млн USD. Только город Майами.', pl_cost: 'стоимость', pl_load: 'Запрашиваем реестр', pl_live_none: 'Сегодня записей в радиусе 200 м нет.', pl_live_err: 'Реестр сейчас не отвечает. Попробуйте позже.', pl_stale: 'Последний успешный ответ от {d}.' },
  zh: { ph_ncopies: '{n} 份相同副本', ph_nohead: '该页面上没有价格出现在“起”或“价格”等词之后，因此我们按原样列出价格，不选取标价。', ph_h: '价格变化', ph_toc: '价格',
    ph_intro: '我们跟踪的页面（{host}）上印出的价格，按我们副本的日期排列。货币按原样显示，我们不做换算。',
    ph_first: '我们最早的标价：{p}（{d}）。', ph_last: '最新：{p}（{d}）。', ph_same: '所有 {n} 份带日期的副本中标价相同。',
    ph_chg: '从最早到最新副本的变化（{cur}）：{pct}。', ph_cur2: '各副本的标价使用了不同货币，因此我们不计算变化。',
    ph_none: '我们对该页面的 {n} 份带日期副本（{a} 至 {b}）都没有显示价格。未公布价格。', ph_nocopy: '我们还没有该页面的带日期副本，因此无法显示价格变化。',
    ph_th: ['日期', '副本', '原样标价', '页面上的其他价格'], ph_copy: '我们的封存副本', ph_ia: 'Internet Archive', ph_open: '打开副本', ph_noprice: '无价格',
    ph_rule: '标价：在“起”或“价格”等词之后出现的第一个价格。门户页面也可能列出其他项目；每个价格周围的文字说明它指的是什么。',
    ph_src: '使用的副本：我们的 {a} 份（SHA-256 封存）和 Internet Archive 的 {b} 份。', ph_chart: '按副本日期显示的 {cur} 标价。点击每个点可打开对应副本。', ph_json: 'JSON 数据',
    k_per_m2: '每平方米', k_rent: '租金', k_small: '费用或小额',
    pl_h: '项目附近的规划和建筑记录', pl_toc: '规划',
    pl_intro: '定位点 {r} 米范围内的官方记录，来源：{src}。定位点精度约 100 米，记录可能涉及相邻地块。',
    pl_th: ['编号', '地址或地块', '内容', '状态', '提交', '决定或签发', '距离'],
    pl_none: '该登记册中 {r} 米范围内没有记录（查询于 {d}）。', pl_err: '我们上次查询时登记册没有响应（{d}）。', pl_live: '立即查询登记册',
    pl_out: '该地块不在英格兰。苏格兰、威尔士和北爱尔兰有各自的规划门户，没有全国性的开放接口。请在当地议会门户查询；苏格兰：',
    pl_lic: '许可', pl_priv: '我们从不复制申请人、业主或承包商的姓名、电话或电子邮件。', pl_rule_nyc: '显示：新建建筑申请，以及估算费用 100 万美元及以上的其他申请。',
    pl_rule_mia: '显示：总费用 100 万美元及以上的许可。仅限迈阿密市。', pl_cost: '费用', pl_load: '正在查询登记册', pl_live_none: '今天 200 米范围内没有记录。', pl_live_err: '登记册暂时没有响应，请稍后再试。', pl_stale: '最后一次有效结果，日期 {d}。' },
  ar: { ph_ncopies: 'نسخ متطابقة: {n}', ph_nohead: 'لا يأتي أي سعر في هذه الصفحة بعد كلمة مثل «ابتداءً من» أو «السعر»، لذا نعرض الأسعار كما طُبعت دون اختيار سعر رئيسي.', ph_h: 'الأسعار عبر الزمن', ph_toc: 'الأسعار',
    ph_intro: 'الأسعار المطبوعة على الصفحة التي نتابعها ({host})، حسب تاريخ نسختنا. العملة كما طُبعت؛ لا نحوّل شيئًا.',
    ph_first: 'أول سعر رئيسي لدينا: {p} ({d}).', ph_last: 'الأحدث: {p} ({d}).', ph_same: 'السعر الرئيسي نفسه في جميع النسخ المؤرخة وعددها {n}.',
    ph_chg: 'التغير من أول نسخة إلى أحدث نسخة، بعملة {cur}: {pct}.', ph_cur2: 'تعرض النسخ السعر بأكثر من عملة، لذا لا نحسب التغير.',
    ph_none: 'لا تعرض أي من نسخنا المؤرخة لهذه الصفحة ({n} نسخة، من {a} إلى {b}) سعرًا. لا أسعار منشورة.', ph_nocopy: 'لا نملك بعد نسخة مؤرخة من هذه الصفحة، لذا لا يمكننا عرض أسعارها عبر الزمن.',
    ph_th: ['التاريخ', 'النسخة', 'السعر الرئيسي كما طُبع', 'أسعار أخرى مطبوعة'], ph_copy: 'نسختنا المختومة', ph_ia: 'Internet Archive', ph_open: 'افتح النسخة', ph_noprice: 'لا سعر',
    ph_rule: 'السعر الرئيسي: أول سعر يأتي بعد كلمة مثل «ابتداءً من» أو «السعر». قد تعرض صفحات البوابات مشاريع أخرى؛ النص المحيط بكل سعر يبيّن ما يخصه.',
    ph_src: 'النسخ المستخدمة: {a} من نسخنا (مختومة بـ SHA-256) و{b} من Internet Archive.', ph_chart: 'السعر الرئيسي بعملة {cur} حسب تاريخ النسخة. كل نقطة تفتح نسختها.', ph_json: 'البيانات بصيغة JSON',
    k_per_m2: 'للمتر المربع', k_rent: 'إيجار', k_small: 'رسم أو مبلغ صغير',
    pl_h: 'سجلات التخطيط والبناء قرب الموقع', pl_toc: 'التخطيط',
    pl_intro: 'سجلات رسمية ضمن {r} م من الدبوس، من {src}. دقة الدبوس نحو 100 م، لذا قد يخص السجل قطعة مجاورة.',
    pl_th: ['المرجع', 'العنوان أو الموقع', 'الموضوع', 'الحالة', 'تاريخ التقديم', 'تاريخ القرار أو الإصدار', 'المسافة'],
    pl_none: 'لا سجل ضمن {r} م في هذا السجل (تم التحقق في {d}).', pl_err: 'لم يستجب السجل عند آخر تحقق لنا ({d}).', pl_live: 'استعلم من السجل الآن',
    pl_out: 'هذا الموقع خارج إنجلترا. لدى اسكتلندا وويلز وأيرلندا الشمالية بوابات خاصة بلا واجهة برمجة مفتوحة وطنية. ابحث في بوابة المجلس المحلي؛ لاسكتلندا:',
    pl_lic: 'الترخيص', pl_priv: 'لا ننسخ أبدًا أسماء مقدمي الطلبات أو الملاك أو المقاولين ولا هواتفهم أو بريدهم الإلكتروني.', pl_rule_nyc: 'المعروض: طلبات البناء الجديد وطلبات أخرى بتكلفة تقديرية مليون دولار أمريكي أو أكثر.',
    pl_rule_mia: 'المعروض: تصاريح بتكلفة إجمالية مليون دولار أمريكي أو أكثر. مدينة ميامي فقط.', pl_cost: 'التكلفة', pl_load: 'جارٍ الاستعلام من السجل', pl_live_none: 'لا سجل ضمن 200 م اليوم.', pl_live_err: 'السجل لا يستجيب الآن. حاول لاحقًا.', pl_stale: 'آخر إجابة صالحة، بتاريخ {d}.' }
};
const nt = (l, k, v) => { let s = (N[l] && N[l][k] != null ? N[l][k] : N.en[k]); if (v && typeof s === 'string') s = s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m); return s; };
// n20p: one formatter per locale and options for the life of the isolate (building one per call cost most of the render time)
const dtf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'd' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.DateTimeFormat(L, o)); };
const nmf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'n' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.NumberFormat(L, o)); };
const fdt = (d, l) => { try { return dtf(LOC[l] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(String(d).slice(0, 10) + 'T00:00:00Z')); } catch (e) { return String(d || ''); } };
const nf = (v, l) => { try { return nmf(LOC[l] || 'en-GB', { maximumFractionDigits: 0 }).format(v); } catch (e) { return String(v); } };
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const ia = (ts, url) => 'https://web.archive.org/web/' + ts + '/' + url;
const ltr = t => '<bdi dir="ltr">' + esc(t) + '</bdi>';
// n19f: the words around a price are a cut of the page text; drop markdown asterisks and mark the cut ends with an ellipsis
const ctxClean = c => { let t = String(c).replace(/(?:\s*\*){2,}\s*/g, ' ').replace(/\s+/g, ' ').trim(); if (/^[a-z0-9]/.test(t)) t = '…' + t; if (!/[.!?)\]]$/.test(t)) t += '…'; return t; };

// the source link of one dated copy
function copyHref(x, p, url) { return p.src === 'copy' ? '/projects/' + x.s + '/changes/' + p.ref + '.txt' : ia(p.ref, url); }

function chart(pts, cur, x, url, lang) {
  const P = pts.filter(p => p.head && p.head.cur === cur);
  if (P.length < 2 || new Set(P.map(p => p.head.v)).size < 2) return '';   // a flat line adds nothing to the sentence above
  const T = P.map(p => Date.parse(p.d + 'T00:00:00Z')), V = P.map(p => p.head.v);
  let t0 = Math.min(...T), t1 = Math.max(...T); if (t1 === t0) { t0 -= 86400000; t1 += 86400000; }
  let v0 = Math.min(...V), v1 = Math.max(...V); const pad = (v1 - v0) * 0.15 || v1 * 0.08 || 1; v0 = Math.max(0, v0 - pad); v1 += pad;
  const W = 640, H = 220, L = 74, R = 16, TP = 14, B = 30;
  const X = t => L + (t - t0) / (t1 - t0) * (W - L - R), Y = v => TP + (1 - (v - v0) / (v1 - v0)) * (H - TP - B);
  const ticks = [v0 + (v1 - v0) * 0.1, (v0 + v1) / 2, v1 - (v1 - v0) * 0.1];
  const short = v => { try { return nmf(LOC[lang] || 'en-GB', { notation: 'compact', maximumFractionDigits: 2 }).format(v); } catch (e) { return String(Math.round(v)); } };
  const line = P.map((p, i) => (i ? 'L' : 'M') + X(T[i]).toFixed(1) + ' ' + Y(V[i]).toFixed(1)).join(' ');
  return '<figure class="kph-fig"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(nt(lang, 'ph_chart', { cur })) + '" class="kph-svg">' +
    ticks.map(v => '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" class="kph-grid"/><text x="' + (L - 8) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end" class="kph-ax">' + esc(short(v)) + '</text>').join('') +
    '<text x="' + L + '" y="' + (H - 8) + '" class="kph-ax">' + esc(fdt(P[0].d, lang)) + '</text><text x="' + (W - R) + '" y="' + (H - 8) + '" text-anchor="end" class="kph-ax">' + esc(fdt(P[P.length - 1].d, lang)) + '</text>' +
    '<path d="' + line + '" class="kph-line"/>' +
    P.map((p, i) => '<a href="' + esc(copyHref(x, p, url)) + '"' + (p.src === 'ia' ? ' rel="nofollow noopener" target="_blank"' : '') + '><circle cx="' + X(T[i]).toFixed(1) + '" cy="' + Y(V[i]).toFixed(1) + '" r="6" class="kph-pt' + (p.src === 'ia' ? ' is-ia' : '') + '"><title>' + esc(fdt(p.d, lang) + ': ' + p.head.p + ' (' + nt(lang, p.src === 'ia' ? 'ph_ia' : 'ph_copy') + ')') + '</title></circle></a>').join('') +
    '</svg><figcaption>' + esc(nt(lang, 'ph_chart', { cur })) + '</figcaption></figure>';
}

export function pricesHtml(pd, x, lang) {
  const rec = pd && pd.ph && pd.ph.projects && pd.ph.projects[x.id];
  if (!pd || !pd.ph) return '';
  const url = (rec && rec.url) || x.url || '';
  const pts = (rec && rec.pts) || [];
  const json = ' <a class="k-src" href="/api/x/paper/' + esc(x.id) + '">' + esc(nt(lang, 'ph_json')) + '</a>';
  if (!pts.length) return '<p class="ki">' + esc(nt(lang, 'ph_nocopy')) + json + '</p>';
  const nC = pts.filter(p => p.src === 'copy').length, nI = pts.filter(p => p.src === 'ia').length;
  const intro = '<p class="ki">' + esc(nt(lang, 'ph_intro', { host: hostOf(url) || '-' })) + '</p>';
  const withP = pts.filter(p => p.head), anyP = pts.some(p => (p.all || []).some(a => a.k === 'price'));
  if (!anyP) return intro + '<ul class="fl"><li class="kfact">' + esc(nt(lang, 'ph_none', { n: pts.length, a: fdt(pts[0].d, lang), b: fdt(pts[pts.length - 1].d, lang) })) +
    ' <a class="src" href="' + esc(copyHref(x, pts[pts.length - 1], url)) + '"' + (pts[pts.length - 1].src === 'ia' ? ' rel="nofollow noopener" target="_blank"' : '') + '>' + esc(nt(lang, 'ph_open')) + '</a></li></ul><p class="k-small k-muted">' + esc(nt(lang, 'ph_src', { a: nC, b: nI })) + json + '</p>';
  const first = withP[0] || null, last = withP[withP.length - 1] || null;
  const curs = [...new Set(withP.map(p => p.head.cur))];
  const L = [];
  const src = p => ' <a class="src" href="' + esc(copyHref(x, p, url)) + '"' + (p.src === 'ia' ? ' rel="nofollow noopener" target="_blank"' : '') + '>' + esc(nt(lang, p.src === 'ia' ? 'ph_ia' : 'ph_copy')) + '</a>';
  if (!first) L.push('<li class="kfact">' + esc(nt(lang, 'ph_nohead')) + src(pts[pts.length - 1]) + '</li>');
  else L.push('<li class="kfact">' + esc(nt(lang, 'ph_first', { p: first.head.p, d: fdt(first.d, lang) })).replace(esc(first.head.p), ltr(first.head.p)) + src(first) + '</li>');
  if (withP.length > 1) {
    L.push('<li class="kfact">' + esc(nt(lang, 'ph_last', { p: last.head.p, d: fdt(last.d, lang) })).replace(esc(last.head.p), ltr(last.head.p)) + src(last) + '</li>');
    if (curs.length > 1) L.push('<li class="kfact">' + esc(nt(lang, 'ph_cur2')) + src(last) + '</li>');
    else if (withP.every(p => p.head.v === first.head.v)) L.push('<li class="kfact">' + esc(nt(lang, 'ph_same', { n: withP.length })) + src(last) + '</li>');
    else { const pct = (last.head.v - first.head.v) / first.head.v * 100; L.push('<li class="kfact">' + esc(nt(lang, 'ph_chg', { cur: first.head.cur, pct: (pct > 0 ? '+' : '') + pct.toFixed(Math.abs(pct) < 1 ? 2 : 1) + '%' })) + src(last) + '</li>'); }
  }
  const main = curs.length ? curs.map(c => [c, withP.filter(p => p.head.cur === c).length]).sort((a, b) => b[1] - a[1])[0][0] : null;
  const th = nt(lang, 'ph_th');
  const kind = k => k === 'price' ? '' : ' <small class="k-muted">(' + esc(nt(lang, 'k_' + k)) + ')</small>';
  // n19f: consecutive copies that print exactly the same prices become one row (date range, number of copies, link to the newest);
  // every copy stays listed in the change log and in the JSON
  const sig = p => JSON.stringify([p.src, p.head ? [p.head.cur, p.head.v, p.head.c] : null, (p.all || []).map(a => [a.cur, a.v, a.k])]);
  const G = []; for (const p of pts.slice().reverse()) { const g = G[G.length - 1]; if (g && sig(g.p) === sig(p)) { g.n++; g.old = p; } else G.push({ p, n: 1, old: p }); }
  const rows = G.map(({ p, n, old }) => {
    const ctx = p.head && p.head.c && !OPINION.test(p.head.c) ? '<br><small class="k-muted kph-ctx" dir="auto">' + esc(ctxClean(MASK(p.head.c))) + '</small>' : '';
    const when = n > 1 ? esc(fdt(old.d, lang)) + ' – ' + esc(fdt(p.d, lang)) + '<br><small class="k-muted">' + esc(nt(lang, 'ph_ncopies', { n })) + '</small>' : esc(fdt(p.d, lang));
    const others = (p.all || []).filter(a => !(p.head && a.cur === p.head.cur && a.v === p.head.v));
    const oth = others.slice(0, 4).map(a => ltr(a.p) + kind(a.k)).join(', ') + (others.length > 4 ? ' ' + '+' + (others.length - 4) : '');
    const noP = !(p.all || []).some(a => a.k === 'price');
    return '<tr class="kfact"><td data-label="' + esc(th[0]) + '"><span>' + when + '</span></td><td data-label="' + esc(th[1]) + '"><span><a class="src" href="' + esc(copyHref(x, p, url)) + '"' + (p.src === 'ia' ? ' rel="nofollow noopener" target="_blank"' : '') + '>' + esc(nt(lang, p.src === 'ia' ? 'ph_ia' : 'ph_copy')) + '</a></span></td>' +
      '<td data-label="' + esc(th[2]) + '"><span>' + (p.head ? '<b>' + ltr(p.head.p) + '</b>' + ctx : '<span class="k-muted">' + (noP ? esc(nt(lang, 'ph_noprice')) : '-') + '</span>') + '</span></td><td data-label="' + esc(th[3]) + '"><span>' + (oth || '<span class="k-muted">-</span>') + '</span></td></tr>';
  }).join('');
  return intro + '<ul class="fl">' + L.join('') + '</ul>' + (main ? chart(pts, main, x, url, lang) : '') +
    '<div class="k-table-wrap"><table class="k-table k-table--dense k-table--stack kph-t"><thead><tr>' + th.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<p class="k-small k-muted">' + esc(nt(lang, 'ph_rule')) + ' ' + esc(nt(lang, 'ph_src', { a: nC, b: nI })) + json + '</p>';
}

function planRows(items, lang) {
  const th = nt(lang, 'pl_th');
  return '<div class="k-table-wrap"><table class="k-table k-table--dense k-table--stack kpl-t"><thead><tr>' + th.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' +
    items.map(it => '<tr class="kfact"><td data-label="' + esc(th[0]) + '"><span><a class="src" href="' + esc(it.url) + '" rel="nofollow noopener" target="_blank">' + ltr(it.ref || '-') + '</a></span></td><td data-label="' + esc(th[1]) + '">' + esc(MASK(it.name || '-')) + '</td>' +
      '<td data-label="' + esc(th[2]) + '"><span>' + esc(MASK(it.desc || '-')) + (it.cost ? ' <small class="k-muted">(' + esc(nt(lang, 'pl_cost')) + ' ' + ltr((it.cur || '') + ' ' + nf(it.cost, lang)) + ')</small>' : '') + '</span></td>' +
      '<td data-label="' + esc(th[3]) + '">' + esc(it.status || '-') + '</td><td data-label="' + esc(th[4]) + '">' + (it.d_in ? esc(fdt(it.d_in, lang)) : '-') + '</td><td data-label="' + esc(th[5]) + '">' + (it.d_dec ? esc(fdt(it.d_dec, lang)) : '-') + '</td>' +
      '<td data-label="' + esc(th[6]) + '" class="k-n">' + (it.dist_m != null ? esc(nf(it.dist_m, lang)) + ' m' : '-') + '</td></tr>').join('') + '</tbody></table></div>';
}

export function planningHtml(pd, x, lang) {
  const P = pd && pd.pl, rec = P && P.projects && P.projects[x.id];
  if (!rec) return '';
  if (rec.src === 'none') return '<p class="ki">' + esc(nt(lang, 'pl_out')) + ' <a class="k-src" href="https://www.eplanning.scot/" rel="noopener" target="_blank">eplanning.scot</a></p>';
  const S = (P.sources || {})[rec.src] || {};
  const head = '<p class="ki">' + esc(nt(lang, 'pl_intro', { r: rec.radius_m || 200, src: S.name || rec.src })) + '</p>';
  const rule = rec.src === 'nyc' ? '<p class="k-small k-muted">' + esc(nt(lang, 'pl_rule_nyc')) + '</p>' : rec.src === 'miami' ? '<p class="k-small k-muted">' + esc(nt(lang, 'pl_rule_mia')) + '</p>' : '';
  const items = rec.items || [];
  let body;
  if (items.length) body = (rec.stale ? '<p class="k-small k-muted">' + esc(nt(lang, 'pl_stale', { d: fdt(rec.checked, lang) })) + '</p>' : '') + planRows(items, lang);
  else if ((rec.errors || []).length) body = '<p class="ki">' + esc(nt(lang, 'pl_err', { d: fdt(rec.checked, lang) })) + '</p>';
  else body = '<ul class="fl"><li class="kfact">' + esc(nt(lang, 'pl_none', { r: rec.radius_m || 200, d: fdt(rec.checked, lang) })) + ' <a class="src" href="' + esc(S.url || '#') + '" rel="nofollow noopener" target="_blank">' + esc(hostOf(S.url || '')) + '</a></li></ul>';
  const live = rec.src === 'uk' ? '<div class="kpl-live" data-id="' + esc(x.id) + '"><button type="button" class="k-btn k-btn--sm" data-kpl-live>' + esc(nt(lang, 'pl_live')) + '</button><div class="kpl-out" aria-live="polite"></div></div>' +
    '<script>window.KPL=' + JSON.stringify({ load: nt(lang, 'pl_load'), none: nt(lang, 'pl_live_none'), err: nt(lang, 'pl_live_err'), th: nt(lang, 'pl_th') }).replace(/</g, '\\u003c') + ';' + LIVE_JS + '</script>' : '';
  return head + body + live + rule + '<p class="k-small k-muted">' + esc(nt(lang, 'pl_lic')) + ': <a class="k-src" href="' + esc(S.licence_url || S.url || '#') + '" rel="noopener" target="_blank">' + esc(S.licence || '') + '</a>. ' + esc(nt(lang, 'pl_priv')) + ' <a class="k-src" href="/api/x/paper/' + esc(x.id) + '">' + esc(nt(lang, 'ph_json')) + '</a></p>';
}
const LIVE_JS = String.raw`(()=>{const T=window.KPL,e=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
document.querySelectorAll('.kpl-live').forEach(w=>{const b=w.querySelector('button'),o=w.querySelector('.kpl-out');if(!b||b.dataset.on)return;b.dataset.on=1;
b.addEventListener('click',async()=>{b.disabled=true;o.textContent=T.load+'...';try{const r=await fetch('/api/x/paper/planning/'+encodeURIComponent(w.dataset.id)+'/live'),d=await r.json();
if(!r.ok||d.error){o.textContent=T.err;b.disabled=false;return}if(!d.items.length){o.textContent=T.none;return}
const td=(i,h)=>'<td data-label="'+e(T.th[i])+'">'+h+'</td>';
o.innerHTML='<div class="k-table-wrap"><table class="k-table k-table--dense k-table--stack"><thead><tr>'+T.th.map(h=>'<th scope="col">'+e(h)+'</th>').join('')+'</tr></thead><tbody>'+d.items.map(i=>'<tr>'+td(0,'<a href="'+e(i.url)+'" rel="nofollow noopener" target="_blank">'+e(i.ref||'-')+'</a>')+td(1,e(i.name||'-'))+td(2,e(i.desc||'-'))+td(3,e(i.status||'-'))+td(4,e(i.d_in||'-'))+td(5,e(i.d_dec||'-'))+td(6,i.dist_m!=null?e(i.dist_m)+' m':'-')+'</tr>').join('')+'</tbody></table></div>'}
catch(x){o.textContent=T.err;b.disabled=false}})})})();`;
export const paperHeading = (lang, k) => nt(lang, k);
export const PAPER_CSS = '.kph-fig{margin:14px 0 10px;max-width:720px}.kph-svg{width:100%;height:auto;display:block}.kph-grid{stroke:var(--k-line,#d5dbd8);stroke-width:1}.kph-ax{font-size:12px;fill:var(--k-muted,#56636F)}' +
  '.kph-line{fill:none;stroke:var(--k-sea,#155C75);stroke-width:2}.kph-pt{fill:var(--k-surface,#fff);stroke:var(--k-sea,#155C75);stroke-width:2.5}.kph-pt.is-ia{fill:var(--k-sea,#155C75)}a:focus-visible .kph-pt{stroke-width:4}' +
  '@media(max-width:600px){.kph-ax{font-size:21px}}.kph-fig figcaption{font-size:.84rem;color:var(--k-muted,#56636F)}.kph-ctx{display:inline-block;max-width:46ch;overflow-wrap:anywhere}.kph-t td,.kpl-t td{vertical-align:top}.kpl-t td{overflow-wrap:break-word}.kpl-t td::before{overflow-wrap:normal;word-break:normal}.kpl-live{margin:10px 0}.kpl-out{margin-top:10px}';

// ------------------------------------------------------------------------------------------------ England: planning.data.gov.uk now (edge)
const R0 = 6371008.8, rad = v => v * Math.PI / 180;
const dist = (a, b, c, d) => { const h = Math.sin(rad(c - a) / 2) ** 2 + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(rad(d - b) / 2) ** 2; return Math.round(2 * R0 * Math.asin(Math.min(1, Math.sqrt(h)))); };
function circle(la, ln, r) { const p = []; for (let i = 0; i <= 24; i++) { const t = 2 * Math.PI * i / 24; p.push((ln + r * Math.sin(t) / (111320 * Math.cos(rad(la)))).toFixed(6) + ' ' + (la + r * Math.cos(t) / 111320).toFixed(6)); } return 'POLYGON((' + p.join(',') + '))'; }
const clean = (s, n) => { s = MASK(String(s || '').replace(/\s+/g, ' ').trim()); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
async function ukLive(la, ln) {
  const items = [];
  for (const ds of ['planning-application', 'brownfield-land']) {
    const q = 'https://www.planning.data.gov.uk/entity.json?' + new URLSearchParams({ dataset: ds, geometry: circle(la, ln, 200), geometry_relation: 'intersects', limit: '100' });
    const r = await fetch(q, { headers: { accept: 'application/json', 'user-agent': 'kolaboro.com planning check (buyer due diligence)' }, cf: { cacheTtl: 86400, cacheEverything: true } });
    if (!r.ok) throw new Error('uk ' + r.status);
    const d = await r.json();
    for (const e of d.entities || []) {
      const m = /POINT\s*\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)/.exec(e.point || '');
      items.push({ kind: ds, ref: String(e.reference || '').slice(0, 60), name: clean(e.name || e['site-address'], 120), desc: clean(e.description || e.notes, 220),
        status: clean(e['planning-decision'] || e.status || e['planning-permission-status'], 60), d_in: e['start-date'] || e['entry-date'] || null, d_dec: e['decision-date'] || e['planning-permission-date'] || null,
        dist_m: m ? dist(la, ln, +m[2], +m[1]) : null, url: 'https://www.planning.data.gov.uk/entity/' + e.entity });
    }
  }
  return items;
}
async function limited(req, ctx, name, max) {
  const ip = req.headers.get('cf-connecting-ip') || 'x', k = new Request(ORIGIN + '/__kpaper_rl/' + name + '/' + encodeURIComponent(ip) + '/' + new Date().toISOString().slice(0, 13));
  const hit = await caches.default.match(k); const n = hit ? (+(await hit.text()) || 0) : 0; if (n >= max) return true;
  const p = caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=3600' } })); if (ctx && ctx.waitUntil) ctx.waitUntil(p.catch(() => {})); else await p.catch(() => {});
  return false;
}

// ------------------------------------------------------------------------------------------------ API
const HJ = { 'content-type': 'application/json; charset=utf-8', 'x-content-type-options': 'nosniff', 'access-control-allow-origin': '*' };
const out = (o, st, cc) => new Response(JSON.stringify(o), { status: st || 200, headers: Object.assign({ 'cache-control': cc || 'no-store' }, HJ) });
export async function handle(req, u, env, ctx) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: 'method' }, 405);
  const p = u.pathname.replace(/\/+$/, '');
  try {
    const { data } = await import('./kbx_named.js');
    const ix = await data(env).catch(() => null); if (!ix) return out({ error: 'unavailable' }, 503);
    let m = p.match(/^\/api\/x\/paper\/planning\/([A-Za-z0-9-]{3,20})\/live$/);
    if (m) {
      const x = ix.byId.get(m[1].toUpperCase()); if (!x) return out({ error: 'not_found' }, 404);
      const pd = await paperData(env), rec = pd.pl && pd.pl.projects && pd.pl.projects[x.id];
      if (!rec || rec.src !== 'uk' || !rec.pin) return out({ error: 'not_covered', note: 'Live check is for named projects in England with a reliable pin.' }, 400);
      const ck = new Request(ORIGIN + '/__kpaper_uk/v1/' + x.id);
      const hit = await caches.default.match(ck); if (hit) return new Response(hit.body, { status: 200, headers: Object.assign({ 'cache-control': 'public, max-age=3600', 'x-cache': 'hit' }, HJ) });
      if (await limited(req, ctx, 'uk', 30)) return out({ error: 'rate', note: 'At most 30 live checks per hour from one address.' }, 429);
      let items; try { items = await ukLive(rec.pin[0], rec.pin[1]); } catch (e) { return out({ error: 'register_unavailable', source: 'planning.data.gov.uk', note: 'HTTP 200 on purpose: the page shows its own message.' }, 200); }
      const body = JSON.stringify({ id: x.id, checked: new Date().toISOString(), radius_m: 200, source: (pd.pl.sources || {}).uk || null, items: items.slice(0, 40) });
      const put = caches.default.put(ck, new Response(body, { headers: { 'cache-control': 'max-age=86400' } })); if (ctx && ctx.waitUntil) ctx.waitUntil(put.catch(() => {}));
      return new Response(body, { status: 200, headers: Object.assign({ 'cache-control': 'public, max-age=3600' }, HJ) });
    }
    m = p.match(/^\/api\/x\/paper\/([A-Za-z0-9-]{3,20})$/);
    if (m) {
      const x = ix.byId.get(m[1].toUpperCase()) || ix.bySlug.get(m[1].toLowerCase());
      if (!x) return out({ id: m[1], named: false }, 404, 'public, max-age=300');
      const pd = await paperData(env), ph = pd.ph, pl = pd.pl, r = ph && ph.projects && ph.projects[x.id];
      const pts = r ? r.pts.map(q => Object.assign({}, q, { copy_url: q.src === 'copy' ? ORIGIN + '/projects/' + x.s + '/changes/' + q.ref + '.txt' : ia(q.ref, r.url) })) : [];
      return out({ id: x.id, name: x.n || null, page: ORIGIN + '/projects/' + x.s + '/',
        prices: ph ? { updated: ph.updated, url_tracked: r ? r.url : x.url || null, rules: ph.rules, sources: ph.sources, points: pts } : null,
        planning: pl ? Object.assign({ updated: pl.updated, privacy: pl.privacy, not_covered: pl.not_covered }, pl.projects && pl.projects[x.id] ? { record: pl.projects[x.id], source: (pl.sources || {})[pl.projects[x.id].src] || null } : { record: null }) : null }, 200, 'public, max-age=600');
    }
    return out({ error: 'not_found', see: ['/api/x/paper/<ID>', '/api/x/paper/planning/<ID>/live'] }, 404);
  } catch (e) { return out({ error: 'server' }, 500); }
}

// ================================================================================================ (9) contract addendum builder
// Official texts not in /tools/law/law.json, read in the official source on 8 Nov 2026. Short quotes only.
const EXTRA = {
  'es-loe-17': { law: 'Law 38/1999 on Building Regulation (Ley de Ordenación de la Edificación)', cite: 'Article 17(1)', url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1999-21567#a17', lang: 'es',
    quote: 'El constructor también responderá de los daños materiales por vicios o defectos de ejecución que afecten a elementos de terminación o acabado de las obras dentro del plazo de un año.',
    tr: 'The builder is also liable for material damage from defects of execution affecting finishing elements of the works within one year (structural defects 10 years, habitability defects 3 years, from acceptance of the works).' },
  'mx-73bis-v': { law: 'Federal Consumer Protection Law (Ley Federal de Protección al Consumidor), last reform DOF 12-12-2025', cite: 'Article 73 Bis, section V', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPC.pdf', lang: 'es',
    quote: 'Para el caso de inmuebles nuevos o preventas, las autorizaciones, licencias o permisos expedidos por las autoridades correspondientes para la construcción', tr: 'For new properties or pre-sales [the seller must make available] the authorisations, licences or permits issued by the competent authorities for the construction.' },
  'mx-73bis-xiii': { law: 'Federal Consumer Protection Law (Ley Federal de Protección al Consumidor), last reform DOF 12-12-2025', cite: 'Article 73 Bis, section XIII', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPC.pdf', lang: 'es',
    quote: 'Se deberá indicar al consumidor sobre la existencia y constitución de garantía hipotecaria, fiduciaria o de cualquier otro tipo, así como su instrumentación.', tr: 'The consumer must be told whether a mortgage, trust or any other guarantee exists and how it is set up.' },
  'mx-73ter-ix': { law: 'Federal Consumer Protection Law (Ley Federal de Protección al Consumidor), last reform DOF 12-12-2025', cite: 'Article 73 Ter, section IX', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPC.pdf', lang: 'es',
    quote: 'Las penas convencionales que se apliquen tanto al proveedor como al consumidor por el incumplimiento de las obligaciones contraídas, las cuales deberán ser recíprocas y equivalentes', tr: 'The contractual penalties for breach that apply to both the seller and the consumer, which must be reciprocal and equivalent.' },
  'mx-73ter-xi': { law: 'Federal Consumer Protection Law (Ley Federal de Protección al Consumidor), last reform DOF 12-12-2025', cite: 'Article 73 Ter, section XI', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPC.pdf', lang: 'es',
    quote: 'El procedimiento para la cancelación del contrato de adhesión y las implicaciones que se deriven para el proveedor y el consumidor', tr: 'The procedure to cancel the standard contract and what follows from it for the seller and the consumer.' },
  'mx-73ter-xii': { law: 'Federal Consumer Protection Law (Ley Federal de Protección al Consumidor), last reform DOF 12-12-2025', cite: 'Article 73 Ter, section XII', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPC.pdf', lang: 'es',
    quote: 'Fecha de inicio y término de ejecución de la actividad o servicio contratado, así como la de entrega del bien objeto del contrato', tr: 'Start and end dates of the work contracted, and the date the property is handed over.' },
  'uk-cra-62': { law: 'Consumer Rights Act 2015', cite: 'Section 62(1) and (4)', url: 'https://www.legislation.gov.uk/ukpga/2015/15/section/62', lang: 'en',
    quote: 'An unfair term of a consumer contract is not binding on the consumer. ... A term is unfair if, contrary to the requirement of good faith, it causes a significant imbalance in the parties\' rights and obligations under the contract to the detriment of the consumer.' },
  'uk-dpa-1': { law: 'Defective Premises Act 1972 (England and Wales)', cite: 'Section 1(1)', url: 'https://www.legislation.gov.uk/ukpga/1972/35/section/1', lang: 'en',
    quote: 'to see that the work which he takes on is done in a workmanlike or, as the case may be, professional manner, with proper materials and so that as regards that work the dwelling will be fit for habitation when completed.' },
  'fl-501-1375': { law: 'Florida Statutes, section 501.1375 (one- and two-family homes)', cite: 's. 501.1375(2)', url: 'https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0500-0599/0501/Sections/0501.1375.html', lang: 'en',
    quote: 'any deposit (up to 10 percent of the purchase price) made by the buyer to the building contractor or developer shall, unless waived in writing by the buyer, be deposited in an escrow account' },
  'fl-718-202-1': { law: 'Florida Statutes, section 718.202 (condominiums)', cite: 's. 718.202(1) and (1)(a)', url: 'https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0700-0799/0718/Sections/0718.202.html', lang: 'en',
    quote: 'the developer shall pay into an escrow account all payments up to 10 percent of the sale price received by the developer from the buyer towards the sale price. ... If a buyer properly terminates the contract pursuant to its terms or pursuant to this chapter, the funds shall be paid to the buyer together with any interest earned.' },
  'fl-718-202-2': { law: 'Florida Statutes, section 718.202 (condominiums)', cite: 's. 718.202(2) and (3)', url: 'https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0700-0799/0718/Sections/0718.202.html', lang: 'en',
    quote: 'shall be held in a special escrow account ... and may not be used by the developer prior to closing the transaction, except as provided in subsection (3) or except for refund to the buyer.',
    note: 'Subsection (3) lets the developer use amounts above 10 percent for construction if the contract so provides. The clause asks the developer to give up that option.' },
  'ny-352h': { law: 'New York General Business Law, section 352-h', cite: 'GBL s. 352-h', url: 'https://www.nysenate.gov/legislation/laws/GBS/352-H', lang: 'en',
    quote: 'all moneys received in connection therewith, including deposits or advances therefor, shall continue to be the money of the person making such purchase, deposit or advance, and shall be held in trust',
    note: 'Applies to offerings under section 352-e, which covers real estate offerings including cooperative interests; new condominium and co-op offering plans in New York are filed under it.' },
  'ny-777a': { law: 'New York General Business Law, section 777-a (housing merchant implied warranty)', cite: 'GBL s. 777-a(1)', url: 'https://www.nysenate.gov/legislation/laws/GBS/777-A', lang: 'en',
    quote: 'one year from and after the warranty date the home will be free from defects due to a failure to have been constructed in a skillful manner',
    note: 'A "new home" under section 777(5) is a single-family house or a for-sale unit in a condominium or co-op building of five stories or less.' }
};
// which law notes each clause relies on, per country (ids from law.json or EXTRA); [] = no statutory rule in our notes
const BASIS = {
  ES: { escrow: ['es-deposit-guarantee'], delay: ['es-deposit-guarantee'], refund: ['es-deposit-guarantee'], complete: [], permits: ['es-deposit-guarantee'], snag: ['es-loe-17'], reg: [] },
  PT: { escrow: [], delay: ['pt-sinal'], refund: ['pt-sinal'], complete: [], permits: [], snag: [], reg: [] },
  'AE-DU': { escrow: ['ae-du-escrow-required', 'ae-du-escrow-ring-fenced'], delay: ['ae-du-not-completed'], refund: ['ae-du-not-completed'], complete: ['ae-du-retention'], permits: ['ae-du-land-and-approvals', 'ae-du-ad-permit'], snag: ['ae-du-retention'], reg: ['ae-du-interim-register'] },
  MX: { escrow: ['mx-73bis-xiii'], delay: ['mx-73ter-ix', 'mx-73ter-xii'], refund: ['mx-73ter-xi'], complete: ['mx-73ter-xii'], permits: ['mx-73bis-v'], snag: [], reg: [] },
  TH: { escrow: [], delay: [], refund: [], complete: [], permits: [], snag: [], reg: ['th-foreign-funds', 'th-49-quota'] },
  ID: { escrow: [], delay: [], refund: [], complete: ['id-pbg-definition'], permits: ['id-ppjb-conditions', 'id-pbg-definition'], snag: [], reg: ['id-foreigner-hak-pakai', 'id-nominee-void'] },
  UK: { escrow: [], delay: ['uk-cra-62'], refund: ['uk-cra-62'], complete: [], permits: [], snag: ['uk-dpa-1'], reg: [] },
  'US-FL': { escrow: ['fl-718-202-1', 'fl-718-202-2', 'fl-501-1375'], delay: [], refund: ['fl-718-202-1'], complete: [], permits: [], snag: [], reg: [] },
  'US-NY': { escrow: ['ny-352h'], delay: [], refund: ['ny-352h'], complete: [], permits: [], snag: ['ny-777a'], reg: [] }
};
const COUNTRIES = [['ES', 'Spain', 'EUR'], ['PT', 'Portugal', 'EUR'], ['AE-DU', 'Dubai (UAE)', 'AED'], ['MX', 'Mexico', 'MXN'], ['TH', 'Thailand', 'THB'], ['ID', 'Indonesia', 'IDR'], ['UK', 'England and Wales (UK)', 'GBP'], ['US-FL', 'Florida (USA)', 'USD'], ['US-NY', 'New York (USA)', 'USD']];

// tool strings (8 languages); clause wording in the document is English (see doc_lang)
const T = {
  en: { title: 'Contract addendum builder', crumb_tools: 'Tools', desc: 'Build protective clauses to propose to the developer, each with the law article it relies on. Made in your browser as PDF and editable Word file. A draft to discuss with your lawyer, not legal advice.',
    h1: 'Draft the clauses you want added to your purchase contract', lead: 'Pick the country, fill in the project and payment details, and choose the protections you want. Each clause names the article of law it relies on, with a link to the official text.',
    warn_b: 'A draft to discuss with your lawyer, not legal advice.', warn: 'Laws change and every contract is different. Ask a local lawyer to check the clauses before you send them. Where our law notes have no statutory rule, the clause says it is a contractual protection only.',
    priv_b: 'What you type stays on this device.', priv: 'The document is built in your browser. Nothing you type is sent to us or stored. The PDF library (jsPDF 2.5.1, MIT licence) loads from jsDelivr when you press Download PDF.',
    s1: 'Property and parties', s2: 'Money and dates', s3: 'Protections to include', s4: 'Your draft',
    f_country: 'Country of the property', f_seller: 'Developer or seller, as named in the contract', f_buyer: 'Buyer, as named in the contract', f_project: 'Project', f_unit: 'Unit', f_contract: 'Contract being amended (name and date)',
    f_price: 'Total price', f_cur: 'Currency', f_paid: 'Paid so far', f_sched: 'Payment schedule as agreed', f_date: 'Promised completion date', f_grace: 'Grace period, months', f_pen: 'Delay penalty per full month, % of amounts paid',
    f_cap: 'Cap on delay penalty, % of price', f_int: 'Interest on refunds, % per year', f_long: 'You may cancel this many months after the completion date', f_snag: 'Days to fix listed defects', opt: 'optional',
    c_escrow: 'Deposit guarantee or escrow', c_delay: 'Delay penalty', c_refund: 'Cancellation and refund with interest', c_complete: 'What counts as completion', c_permits: 'Permits as a condition', c_snag: 'Snagging and defects', c_reg: 'Registration of your purchase',
    law_h: 'Law it relies on', law_none: 'Our law notes have no statutory rule for this point here. It is a contractual protection: you ask for it and the developer may refuse.', law_open: 'official text', quote: 'Quote', trans: 'English translation', note: 'Note',
    pdf: 'Download PDF', docx: 'Download Word (.docx)', print: 'Print', st_pdf: 'Loading the PDF library', st_done: 'Downloaded.', st_err: 'The PDF could not be made ({e}). Use the Word file or Print.', st_latin: 'Some characters cannot be shown in the PDF font and were replaced. The Word file keeps them.',
    doc_lang: 'The clauses are written in English, the language most contracts with foreign buyers use. Your lawyer can adapt them to the language of your contract.',
    rel_h: 'Related', rel_law: 'Law notes for off-plan buyers', rel_delay: 'Late handover compensation', rel_dep: 'Deposit protection check', empty: 'Choose at least one protection.' },
  es: { title: 'Generador de anexo al contrato', crumb_tools: 'Herramientas', desc: 'Cree cláusulas de protección para proponer al promotor, cada una con el artículo de la ley en que se basa. Se genera en su navegador en PDF y Word editable. Un borrador para hablar con su abogado, no asesoramiento legal.',
    h1: 'Redacte las cláusulas que quiere añadir a su contrato de compra', lead: 'Elija el país, rellene los datos del proyecto y de los pagos y elija las protecciones que quiere. Cada cláusula cita el artículo de la ley en que se apoya, con enlace al texto oficial.',
    warn_b: 'Un borrador para hablar con su abogado, no asesoramiento legal.', warn: 'Las leyes cambian y cada contrato es distinto. Pida a un abogado local que revise las cláusulas antes de enviarlas. Si nuestras notas no tienen una norma legal, la cláusula indica que es solo una protección contractual.',
    priv_b: 'Lo que escribe se queda en este dispositivo.', priv: 'El documento se crea en su navegador. Nada de lo que escribe se nos envía ni se guarda. La librería PDF (jsPDF 2.5.1, licencia MIT) se carga desde jsDelivr al pulsar Descargar PDF.',
    s1: 'Inmueble y partes', s2: 'Dinero y fechas', s3: 'Protecciones a incluir', s4: 'Su borrador',
    f_country: 'País del inmueble', f_seller: 'Promotor o vendedor, como figura en el contrato', f_buyer: 'Comprador, como figura en el contrato', f_project: 'Proyecto', f_unit: 'Unidad', f_contract: 'Contrato que se modifica (nombre y fecha)',
    f_price: 'Precio total', f_cur: 'Moneda', f_paid: 'Pagado hasta hoy', f_sched: 'Calendario de pagos acordado', f_date: 'Fecha de entrega prometida', f_grace: 'Periodo de gracia, meses', f_pen: 'Penalización por mes completo de retraso, % de lo pagado',
    f_cap: 'Límite de la penalización, % del precio', f_int: 'Interés sobre las devoluciones, % anual', f_long: 'Puede resolver este número de meses después de la fecha de entrega', f_snag: 'Días para reparar los defectos listados', opt: 'opcional',
    c_escrow: 'Garantía o cuenta especial de las cantidades', c_delay: 'Penalización por retraso', c_refund: 'Resolución y devolución con intereses', c_complete: 'Qué se considera terminado', c_permits: 'Licencias como condición', c_snag: 'Repasos y defectos', c_reg: 'Registro de su compra',
    law_h: 'Ley en que se basa', law_none: 'Nuestras notas no tienen una norma legal para este punto aquí. Es una protección contractual: usted la pide y el promotor puede negarse.', law_open: 'texto oficial', quote: 'Cita', trans: 'Traducción al inglés', note: 'Nota',
    pdf: 'Descargar PDF', docx: 'Descargar Word (.docx)', print: 'Imprimir', st_pdf: 'Cargando la librería PDF', st_done: 'Descargado.', st_err: 'No se pudo crear el PDF ({e}). Use el archivo Word o Imprimir.', st_latin: 'Algunos caracteres no existen en la fuente del PDF y se sustituyeron. El archivo Word los conserva.',
    doc_lang: 'Las cláusulas están en inglés, el idioma que usan la mayoría de contratos con compradores extranjeros. Su abogado puede adaptarlas al idioma de su contrato.',
    rel_h: 'Relacionado', rel_law: 'Notas legales para compradores sobre plano', rel_delay: 'Compensación por entrega tardía', rel_dep: 'Comprobar la protección del depósito', empty: 'Elija al menos una protección.' },
  fr: { title: 'Générateur d\'avenant au contrat', crumb_tools: 'Outils', desc: 'Préparez des clauses protectrices à proposer au promoteur, chacune avec l\'article de loi sur lequel elle s\'appuie. Créé dans votre navigateur en PDF et en Word modifiable. Un projet à discuter avec votre avocat, pas un conseil juridique.',
    h1: 'Rédigez les clauses à ajouter à votre contrat d\'achat', lead: 'Choisissez le pays, remplissez les données du projet et des paiements, puis les protections voulues. Chaque clause cite l\'article de loi sur lequel elle s\'appuie, avec un lien vers le texte officiel.',
    warn_b: 'Un projet à discuter avec votre avocat, pas un conseil juridique.', warn: 'Les lois changent et chaque contrat est différent. Faites vérifier les clauses par un avocat local avant de les envoyer. Si nos notes n\'ont pas de règle légale, la clause indique qu\'il s\'agit d\'une protection contractuelle.',
    priv_b: 'Ce que vous saisissez reste sur cet appareil.', priv: 'Le document est créé dans votre navigateur. Rien de ce que vous saisissez ne nous est envoyé ni enregistré. La bibliothèque PDF (jsPDF 2.5.1, licence MIT) se charge depuis jsDelivr quand vous cliquez sur Télécharger le PDF.',
    s1: 'Bien et parties', s2: 'Montants et dates', s3: 'Protections à inclure', s4: 'Votre projet',
    f_country: 'Pays du bien', f_seller: 'Promoteur ou vendeur, tel que nommé au contrat', f_buyer: 'Acheteur, tel que nommé au contrat', f_project: 'Projet', f_unit: 'Lot', f_contract: 'Contrat modifié (nom et date)',
    f_price: 'Prix total', f_cur: 'Devise', f_paid: 'Déjà payé', f_sched: 'Échéancier convenu', f_date: 'Date de livraison promise', f_grace: 'Délai de grâce, mois', f_pen: 'Pénalité par mois entier de retard, % des sommes payées',
    f_cap: 'Plafond de la pénalité, % du prix', f_int: 'Intérêt sur les remboursements, % par an', f_long: 'Vous pouvez résilier ce nombre de mois après la date de livraison', f_snag: 'Jours pour corriger les défauts listés', opt: 'facultatif',
    c_escrow: 'Garantie ou séquestre des versements', c_delay: 'Pénalité de retard', c_refund: 'Résiliation et remboursement avec intérêts', c_complete: 'Ce qui vaut achèvement', c_permits: 'Permis comme condition', c_snag: 'Réserves et défauts', c_reg: 'Enregistrement de votre achat',
    law_h: 'Loi invoquée', law_none: 'Nos notes n\'ont pas de règle légale sur ce point ici. C\'est une protection contractuelle : vous la demandez, le promoteur peut refuser.', law_open: 'texte officiel', quote: 'Citation', trans: 'Traduction anglaise', note: 'Note',
    pdf: 'Télécharger le PDF', docx: 'Télécharger Word (.docx)', print: 'Imprimer', st_pdf: 'Chargement de la bibliothèque PDF', st_done: 'Téléchargé.', st_err: 'Le PDF n\'a pas pu être créé ({e}). Utilisez le fichier Word ou Imprimer.', st_latin: 'Certains caractères n\'existent pas dans la police du PDF et ont été remplacés. Le fichier Word les conserve.',
    doc_lang: 'Les clauses sont rédigées en anglais, la langue de la plupart des contrats avec des acheteurs étrangers. Votre avocat peut les adapter à la langue de votre contrat.',
    rel_h: 'Voir aussi', rel_law: 'Notes juridiques pour acheteurs sur plan', rel_delay: 'Indemnité de livraison tardive', rel_dep: 'Vérifier la protection de l\'acompte', empty: 'Choisissez au moins une protection.' },
  de: { title: 'Vertragsnachtrag erstellen', crumb_tools: 'Werkzeuge', desc: 'Erstellen Sie Schutzklauseln für den Bauträger, jede mit dem Gesetzesartikel, auf den sie sich stützt. Im Browser erstellt als PDF und bearbeitbare Word-Datei. Ein Entwurf für das Gespräch mit Ihrem Anwalt, keine Rechtsberatung.',
    h1: 'Entwerfen Sie die Klauseln für Ihren Kaufvertrag', lead: 'Wählen Sie das Land, tragen Sie Projekt- und Zahlungsdaten ein und wählen Sie die gewünschten Schutzklauseln. Jede Klausel nennt den Gesetzesartikel mit Link zum amtlichen Text.',
    warn_b: 'Ein Entwurf für das Gespräch mit Ihrem Anwalt, keine Rechtsberatung.', warn: 'Gesetze ändern sich und jeder Vertrag ist anders. Lassen Sie die Klauseln vor dem Versand von einem Anwalt vor Ort prüfen. Wo unsere Notizen keine gesetzliche Regel haben, sagt die Klausel, dass sie nur vertraglich schützt.',
    priv_b: 'Was Sie eingeben, bleibt auf diesem Gerät.', priv: 'Das Dokument entsteht in Ihrem Browser. Nichts, was Sie eingeben, wird an uns gesendet oder gespeichert. Die PDF-Bibliothek (jsPDF 2.5.1, MIT-Lizenz) lädt von jsDelivr, wenn Sie PDF herunterladen wählen.',
    s1: 'Objekt und Parteien', s2: 'Beträge und Termine', s3: 'Schutzklauseln', s4: 'Ihr Entwurf',
    f_country: 'Land der Immobilie', f_seller: 'Bauträger oder Verkäufer laut Vertrag', f_buyer: 'Käufer laut Vertrag', f_project: 'Projekt', f_unit: 'Einheit', f_contract: 'Geänderter Vertrag (Name und Datum)',
    f_price: 'Gesamtpreis', f_cur: 'Währung', f_paid: 'Bisher gezahlt', f_sched: 'Vereinbarter Zahlungsplan', f_date: 'Versprochener Fertigstellungstermin', f_grace: 'Karenzzeit, Monate', f_pen: 'Vertragsstrafe je vollem Verzugsmonat, % der Zahlungen',
    f_cap: 'Obergrenze der Vertragsstrafe, % des Preises', f_int: 'Zinsen auf Rückzahlungen, % pro Jahr', f_long: 'Rücktritt möglich so viele Monate nach dem Fertigstellungstermin', f_snag: 'Tage zur Behebung gelisteter Mängel', opt: 'optional',
    c_escrow: 'Absicherung der Zahlungen (Treuhand)', c_delay: 'Vertragsstrafe bei Verzug', c_refund: 'Rücktritt und Rückzahlung mit Zinsen', c_complete: 'Was als fertiggestellt gilt', c_permits: 'Genehmigungen als Bedingung', c_snag: 'Abnahme und Mängel', c_reg: 'Eintragung Ihres Kaufs',
    law_h: 'Gesetzliche Grundlage', law_none: 'Unsere Notizen haben hier keine gesetzliche Regel zu diesem Punkt. Es ist ein vertraglicher Schutz: Sie fordern ihn, der Bauträger kann ablehnen.', law_open: 'amtlicher Text', quote: 'Zitat', trans: 'Englische Übersetzung', note: 'Hinweis',
    pdf: 'PDF herunterladen', docx: 'Word herunterladen (.docx)', print: 'Drucken', st_pdf: 'PDF-Bibliothek wird geladen', st_done: 'Heruntergeladen.', st_err: 'Das PDF konnte nicht erstellt werden ({e}). Nutzen Sie die Word-Datei oder Drucken.', st_latin: 'Einige Zeichen gibt es in der PDF-Schrift nicht; sie wurden ersetzt. Die Word-Datei behält sie.',
    doc_lang: 'Die Klauseln sind auf Englisch, der Sprache der meisten Verträge mit ausländischen Käufern. Ihr Anwalt kann sie in die Vertragssprache übertragen.',
    rel_h: 'Siehe auch', rel_law: 'Rechtsnotizen für Off-Plan-Käufer', rel_delay: 'Entschädigung bei später Übergabe', rel_dep: 'Schutz der Anzahlung prüfen', empty: 'Wählen Sie mindestens eine Schutzklausel.' },
  nl: { title: 'Aanvulling op het contract opstellen', crumb_tools: 'Hulpmiddelen', desc: 'Stel beschermende clausules op om aan de ontwikkelaar voor te stellen, elk met het wetsartikel waarop ze steunt. In uw browser gemaakt als PDF en bewerkbaar Word-bestand. Een concept om met uw advocaat te bespreken, geen juridisch advies.',
    h1: 'Stel de clausules op die u aan uw koopcontract wilt toevoegen', lead: 'Kies het land, vul de gegevens van project en betalingen in en kies de bescherming die u wilt. Elke clausule noemt het wetsartikel, met een link naar de officiële tekst.',
    warn_b: 'Een concept om met uw advocaat te bespreken, geen juridisch advies.', warn: 'Wetten veranderen en elk contract is anders. Laat een lokale advocaat de clausules controleren voordat u ze verstuurt. Waar onze notities geen wettelijke regel hebben, staat in de clausule dat het alleen contractuele bescherming is.',
    priv_b: 'Wat u typt, blijft op dit apparaat.', priv: 'Het document wordt in uw browser gemaakt. Niets wat u typt wordt naar ons verstuurd of bewaard. De PDF-bibliotheek (jsPDF 2.5.1, MIT-licentie) laadt van jsDelivr als u op PDF downloaden drukt.',
    s1: 'Woning en partijen', s2: 'Bedragen en data', s3: 'Bescherming opnemen', s4: 'Uw concept',
    f_country: 'Land van de woning', f_seller: 'Ontwikkelaar of verkoper, zoals in het contract', f_buyer: 'Koper, zoals in het contract', f_project: 'Project', f_unit: 'Unit', f_contract: 'Contract dat wordt aangevuld (naam en datum)',
    f_price: 'Totale prijs', f_cur: 'Valuta', f_paid: 'Tot nu toe betaald', f_sched: 'Afgesproken betalingsschema', f_date: 'Beloofde opleverdatum', f_grace: 'Respijtperiode, maanden', f_pen: 'Boete per volle maand vertraging, % van het betaalde',
    f_cap: 'Maximum van de boete, % van de prijs', f_int: 'Rente op terugbetalingen, % per jaar', f_long: 'U mag ontbinden zoveel maanden na de opleverdatum', f_snag: 'Dagen om opgesomde gebreken te herstellen', opt: 'optioneel',
    c_escrow: 'Waarborg of derdenrekening voor betalingen', c_delay: 'Boete bij vertraging', c_refund: 'Ontbinding en terugbetaling met rente', c_complete: 'Wat telt als opgeleverd', c_permits: 'Vergunningen als voorwaarde', c_snag: 'Opleverpunten en gebreken', c_reg: 'Registratie van uw aankoop',
    law_h: 'Wet waarop het steunt', law_none: 'Onze notities hebben hier geen wettelijke regel voor dit punt. Het is contractuele bescherming: u vraagt erom en de ontwikkelaar kan weigeren.', law_open: 'officiële tekst', quote: 'Citaat', trans: 'Engelse vertaling', note: 'Opmerking',
    pdf: 'PDF downloaden', docx: 'Word downloaden (.docx)', print: 'Afdrukken', st_pdf: 'PDF-bibliotheek laden', st_done: 'Gedownload.', st_err: 'De PDF kon niet worden gemaakt ({e}). Gebruik het Word-bestand of Afdrukken.', st_latin: 'Sommige tekens bestaan niet in het PDF-lettertype en zijn vervangen. Het Word-bestand bewaart ze.',
    doc_lang: 'De clausules zijn in het Engels, de taal van de meeste contracten met buitenlandse kopers. Uw advocaat kan ze aanpassen aan de taal van uw contract.',
    rel_h: 'Zie ook', rel_law: 'Juridische notities voor kopers op plan', rel_delay: 'Vergoeding bij late oplevering', rel_dep: 'Bescherming van de aanbetaling controleren', empty: 'Kies minstens één bescherming.' },
  ru: { title: 'Конструктор дополнения к договору', crumb_tools: 'Инструменты', desc: 'Составьте защитные условия, чтобы предложить их застройщику, каждое со статьёй закона, на которую оно опирается. Создаётся в браузере в PDF и редактируемом Word. Черновик для обсуждения с юристом, не юридическая консультация.',
    h1: 'Составьте условия, которые вы хотите добавить в договор покупки', lead: 'Выберите страну, заполните данные проекта и платежей и выберите нужные защиты. В каждом условии указана статья закона со ссылкой на официальный текст.',
    warn_b: 'Черновик для обсуждения с юристом, не юридическая консультация.', warn: 'Законы меняются, и каждый договор отличается. Попросите местного юриста проверить условия перед отправкой. Если в наших заметках нет нормы закона, в условии сказано, что это только договорная защита.',
    priv_b: 'Всё, что вы вводите, остаётся на этом устройстве.', priv: 'Документ создаётся в вашем браузере. Ничего из введённого не отправляется нам и не сохраняется. Библиотека PDF (jsPDF 2.5.1, лицензия MIT) загружается с jsDelivr, когда вы нажимаете «Скачать PDF».',
    s1: 'Объект и стороны', s2: 'Суммы и сроки', s3: 'Какие защиты включить', s4: 'Ваш черновик',
    f_country: 'Страна объекта', f_seller: 'Застройщик или продавец, как в договоре', f_buyer: 'Покупатель, как в договоре', f_project: 'Проект', f_unit: 'Юнит', f_contract: 'Изменяемый договор (название и дата)',
    f_price: 'Полная цена', f_cur: 'Валюта', f_paid: 'Уже оплачено', f_sched: 'Согласованный график платежей', f_date: 'Обещанная дата сдачи', f_grace: 'Льготный период, месяцев', f_pen: 'Неустойка за каждый полный месяц просрочки, % от оплаченного',
    f_cap: 'Предел неустойки, % от цены', f_int: 'Проценты на возврат, % годовых', f_long: 'Вы вправе расторгнуть через столько месяцев после даты сдачи', f_snag: 'Дней на устранение перечисленных дефектов', opt: 'необязательно',
    c_escrow: 'Гарантия или эскроу платежей', c_delay: 'Неустойка за просрочку', c_refund: 'Расторжение и возврат с процентами', c_complete: 'Что считается завершением', c_permits: 'Разрешения как условие', c_snag: 'Приёмка и дефекты', c_reg: 'Регистрация вашей покупки',
    law_h: 'На какой закон опирается', law_none: 'В наших заметках нет нормы закона по этому пункту здесь. Это договорная защита: вы её просите, застройщик может отказать.', law_open: 'официальный текст', quote: 'Цитата', trans: 'Перевод на английский', note: 'Примечание',
    pdf: 'Скачать PDF', docx: 'Скачать Word (.docx)', print: 'Печать', st_pdf: 'Загружаем библиотеку PDF', st_done: 'Скачано.', st_err: 'Не удалось создать PDF ({e}). Используйте Word или печать.', st_latin: 'Некоторых символов нет в шрифте PDF, они заменены. В файле Word они сохранены.',
    doc_lang: 'Условия написаны на английском, языке большинства договоров с иностранными покупателями. Юрист может адаптировать их к языку вашего договора.',
    rel_h: 'Связанное', rel_law: 'Правовые заметки для покупателей на этапе строительства', rel_delay: 'Компенсация за позднюю сдачу', rel_dep: 'Проверка защиты депозита', empty: 'Выберите хотя бы одну защиту.' },
  zh: { title: '合同补充条款生成器', crumb_tools: '工具', desc: '生成可向开发商提出的保护性条款，每条都注明所依据的法律条文。在您的浏览器中生成 PDF 和可编辑的 Word 文件。供您与律师讨论的草稿，不是法律意见。',
    h1: '起草您希望加入购房合同的条款', lead: '选择国家，填写项目和付款信息，再选择需要的保护。每条条款都注明所依据的法律条文，并链接到官方文本。',
    warn_b: '供您与律师讨论的草稿，不是法律意见。', warn: '法律会变化，每份合同都不同。发送前请当地律师检查条款。如果我们的法律笔记中没有法定规则，条款会注明这只是合同上的保护。',
    priv_b: '您输入的内容留在本设备上。', priv: '文件在您的浏览器中生成。您输入的任何内容都不会发送给我们，也不会保存。PDF 库（jsPDF 2.5.1，MIT 许可）在您点击“下载 PDF”时从 jsDelivr 加载。',
    s1: '房产和双方', s2: '金额和日期', s3: '要加入的保护', s4: '您的草稿',
    f_country: '房产所在国家', f_seller: '开发商或卖方（与合同一致）', f_buyer: '买方（与合同一致）', f_project: '项目', f_unit: '单元', f_contract: '被补充的合同（名称和日期）',
    f_price: '总价', f_cur: '货币', f_paid: '已付金额', f_sched: '约定的付款计划', f_date: '承诺的交付日期', f_grace: '宽限期（月）', f_pen: '每延误一整月的违约金（已付金额的 %）',
    f_cap: '违约金上限（价格的 %）', f_int: '退款利息（年利率 %）', f_long: '交付日期后多少个月可以解约', f_snag: '修复所列缺陷的天数', opt: '可选',
    c_escrow: '付款担保或托管', c_delay: '延期违约金', c_refund: '解约并连同利息退款', c_complete: '什么算作竣工', c_permits: '以许可证为条件', c_snag: '验房与缺陷', c_reg: '您购买的登记',
    law_h: '所依据的法律', law_none: '我们的法律笔记中这里没有此项的法定规则。这是合同上的保护：您可以提出，开发商可能拒绝。', law_open: '官方文本', quote: '原文', trans: '英文译文', note: '说明',
    pdf: '下载 PDF', docx: '下载 Word（.docx）', print: '打印', st_pdf: '正在加载 PDF 库', st_done: '已下载。', st_err: '无法生成 PDF（{e}）。请使用 Word 文件或打印。', st_latin: '部分字符在 PDF 字体中无法显示，已被替换。Word 文件会保留它们。',
    doc_lang: '条款以英文书写，这是大多数与外国买家签订的合同所用的语言。您的律师可以把它们改成合同所用语言。',
    rel_h: '相关', rel_law: '期房买家的法律笔记', rel_delay: '延期交房补偿', rel_dep: '定金保护检查', empty: '请至少选择一项保护。' },
  ar: { title: 'منشئ ملحق العقد', crumb_tools: 'الأدوات', desc: 'أنشئ بنودًا حمائية لتقترحها على المطوّر، لكل منها المادة القانونية التي يستند إليها. يُنشأ في متصفحك بصيغة PDF وملف Word قابل للتعديل. مسودة للنقاش مع محاميك، وليست استشارة قانونية.',
    h1: 'صِغ البنود التي تريد إضافتها إلى عقد الشراء', lead: 'اختر الدولة، واملأ بيانات المشروع والدفعات، واختر الحمايات التي تريدها. يذكر كل بند المادة القانونية التي يستند إليها مع رابط إلى النص الرسمي.',
    warn_b: 'مسودة للنقاش مع محاميك، وليست استشارة قانونية.', warn: 'القوانين تتغير وكل عقد مختلف. اطلب من محامٍ محلي مراجعة البنود قبل إرسالها. حيث لا تتضمن ملاحظاتنا القانونية قاعدة تشريعية، يذكر البند أنه حماية تعاقدية فقط.',
    priv_b: 'ما تكتبه يبقى على هذا الجهاز.', priv: 'يُنشأ المستند في متصفحك. لا يُرسل إلينا شيء مما تكتبه ولا يُحفظ. تُحمَّل مكتبة PDF ‏(jsPDF 2.5.1، ترخيص MIT) من jsDelivr عند الضغط على تنزيل PDF.',
    s1: 'العقار والأطراف', s2: 'المبالغ والتواريخ', s3: 'الحمايات المطلوبة', s4: 'مسودتك',
    f_country: 'دولة العقار', f_seller: 'المطوّر أو البائع كما في العقد', f_buyer: 'المشتري كما في العقد', f_project: 'المشروع', f_unit: 'الوحدة', f_contract: 'العقد المعدَّل (الاسم والتاريخ)',
    f_price: 'السعر الإجمالي', f_cur: 'العملة', f_paid: 'المدفوع حتى الآن', f_sched: 'جدول الدفعات المتفق عليه', f_date: 'تاريخ التسليم الموعود', f_grace: 'فترة السماح بالأشهر', f_pen: 'غرامة عن كل شهر تأخير كامل، % من المبالغ المدفوعة',
    f_cap: 'حد الغرامة، % من السعر', f_int: 'الفائدة على المبالغ المستردة، % سنويًا', f_long: 'يحق لك الفسخ بعد هذا العدد من الأشهر من تاريخ التسليم', f_snag: 'أيام إصلاح العيوب المدرجة', opt: 'اختياري',
    c_escrow: 'ضمان الدفعات أو حساب الضمان', c_delay: 'غرامة التأخير', c_refund: 'الفسخ واسترداد المبالغ مع الفائدة', c_complete: 'ما يُعد إنجازًا', c_permits: 'التصاريح شرطًا', c_snag: 'الفحص قبل الاستلام والعيوب', c_reg: 'تسجيل شرائك',
    law_h: 'القانون الذي يستند إليه', law_none: 'لا تتضمن ملاحظاتنا القانونية هنا قاعدة تشريعية لهذه النقطة. إنها حماية تعاقدية: تطلبها وقد يرفضها المطوّر.', law_open: 'النص الرسمي', quote: 'اقتباس', trans: 'الترجمة الإنجليزية', note: 'ملاحظة',
    pdf: 'تنزيل PDF', docx: 'تنزيل Word ‏(.docx)', print: 'طباعة', st_pdf: 'جارٍ تحميل مكتبة PDF', st_done: 'تم التنزيل.', st_err: 'تعذّر إنشاء ملف PDF ‏({e}). استخدم ملف Word أو الطباعة.', st_latin: 'بعض الأحرف غير موجودة في خط PDF واستُبدلت. ملف Word يحتفظ بها.',
    doc_lang: 'البنود مكتوبة بالإنجليزية، وهي لغة معظم العقود مع المشترين الأجانب. يمكن لمحاميك تكييفها مع لغة عقدك.',
    rel_h: 'ذات صلة', rel_law: 'ملاحظات قانونية لمشتري العقارات على الخارطة', rel_delay: 'تعويض التأخر في التسليم', rel_dep: 'فحص حماية العربون', empty: 'اختر حماية واحدة على الأقل.' }
};
const tt = l => Object.assign({}, T.en, T[l] || {});

async function lawNotes(env) {
  const lj = await loadOne(env, '/tools/law/law.json', 3600000);
  const out = {};
  if (lj) for (const r of lj.rules || []) { const s = (lj.sources || {})[r.source] || {}; out[r.id] = { law: s.law || r.source, cite: r.cite, url: s.url || '/tools/law/', lang: s.language || 'en', quote: String(r.quote || ''), tr: r.translation || '', title: r.title || '', checked: r.checked || lj.version, kb: '/tools/law/#' + r.id }; }
  for (const [k, v] of Object.entries(EXTRA)) out[k] = Object.assign({ checked: '2026-11-08' }, v);
  return out;
}

const CSS = `<style id="kca18">
.kca .k-phead{padding-block:var(--k-7,48px) var(--k-5,24px)}.kca h1{max-width:24ch}
.kca-grid{display:grid;gap:var(--k-6,32px);grid-template-columns:minmax(0,1fr)}
@media(min-width:1000px){.kca-grid{grid-template-columns:minmax(0,5fr) minmax(0,6fr);align-items:start}.kca-out{position:sticky;top:88px}}
.kca fieldset{border:1px solid var(--k-line);border-radius:var(--k-r-lg,14px);padding:var(--k-4,16px) var(--k-5,24px) var(--k-5,24px);margin:0 0 var(--k-5,24px);background:var(--k-surface);min-width:0}
.kca legend{font-weight:700;padding:0 6px;font-size:var(--k-fs-md,17px)}
.kca-row{display:grid;gap:var(--k-3,12px);grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr))}
.kca .k-field{margin:0 0 var(--k-3,12px)}.kca .k-input,.kca .k-select,.kca .k-textarea{width:100%;box-sizing:border-box}
.kca-cl{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-top:1px solid var(--k-line)}.kca-cl:first-of-type{border-top:0}
.kca-cl input{width:22px;height:22px;margin:2px 0 0;flex:none}.kca-cl label{cursor:pointer}.kca-cl small{display:block;color:var(--k-muted)}
.kca-doc{background:var(--k-surface);border:1px solid var(--k-line-2,var(--k-line));border-radius:var(--k-r-lg,14px);padding:var(--k-5,24px);max-height:none}
.kca-doc h3{font-size:var(--k-fs-lg,20px);margin:0 0 6px}.kca-doc h4{font-size:var(--k-fs-md,17px);margin:var(--k-5,24px) 0 6px}
.kca-doc p{margin:6px 0;line-height:1.55}.kca-doc .kca-meta{color:var(--k-muted);font-size:var(--k-fs-sm,15px)}
.kca-law{margin:8px 0 0;padding:10px 12px;border-inline-start:3px solid var(--k-sea);background:var(--k-sunken);border-radius:0 var(--k-r-sm,6px) var(--k-r-sm,6px) 0;font-size:var(--k-fs-sm,15px)}
.kca-law.is-none{border-inline-start-color:var(--k-line-2,var(--k-line));color:var(--k-muted)}.kca-law q{display:block;margin:4px 0;font-style:italic;overflow-wrap:anywhere}
.kca-acts{display:flex;flex-wrap:wrap;gap:10px;margin:var(--k-4,16px) 0}.kca-st{min-height:1.5em;font-size:var(--k-fs-sm,15px)}
.kca-rel{margin-top:var(--k-6,32px)}
@media print{header,footer,nav,.kca-form,.kca-acts,.k-phead,.kca-rel,.ship,.k-alert{display:none!important}.kca-grid{display:block}.kca-doc{border:0;padding:0}}
</style>`;

function toolBody(lang, LAW) {
  const t = tt(lang), p = pre(lang);
  const f = (id, label, type, extra, val, opt) => '<div class="k-field"><label class="k-label" for="ca-' + id + '">' + esc(label) + (opt ? ' <small class="k-muted">(' + esc(t.opt) + ')</small>' : '') + '</label>' +
    (type === 'textarea' ? '<textarea class="k-textarea" id="ca-' + id + '" name="' + id + '" rows="2" autocomplete="off"' + (extra || '') + '>' + esc(val || '') + '</textarea>' : '<input class="k-input" id="ca-' + id + '" name="' + id + '" type="' + type + '" autocomplete="off"' + (extra || '') + (val != null ? ' value="' + esc(val) + '"' : '') + '>') + '</div>';
  const cls = ['escrow', 'delay', 'refund', 'complete', 'permits', 'snag', 'reg'];
  const client = { lang, t: { law_none: t.law_none, law_open: t.law_open, quote: t.quote, trans: t.trans, note: t.note, st_pdf: t.st_pdf, st_done: t.st_done, st_err: t.st_err, st_latin: t.st_latin, empty: t.empty, law_h: t.law_h }, LAW, BASIS, C: COUNTRIES };
  return '<div class="kca"><section class="k-phead"><div class="k-wrap"><p class="k-crumb"><a href="' + p + '/">Kolaboro</a> / <a href="/tools/">' + esc(t.crumb_tools) + '</a></p><h1>' + esc(t.h1) + '</h1><p class="lead">' + esc(t.lead) + '</p>' +
    '<div class="k-alert k-alert--warn" role="note"><b>' + esc(t.warn_b) + '</b><span>' + esc(t.warn) + '</span></div>' +
    '<div class="k-alert" role="note" style="margin-top:12px"><b>' + esc(t.priv_b) + '</b><span>' + esc(t.priv) + '</span></div></div></section>' +
    '<section class="k-sec" style="padding-top:var(--k-5,24px)"><div class="k-wrap kca-grid"><form class="kca-form" id="kca-f" data-kb-nosubmit novalidate>' +
    '<fieldset><legend>' + esc(t.s1) + '</legend><div class="k-field"><label class="k-label" for="ca-country">' + esc(t.f_country) + '</label><select class="k-select" id="ca-country" name="country">' + COUNTRIES.map(c => '<option value="' + c[0] + '">' + esc(c[1]) + '</option>').join('') + '</select></div>' +
    '<div class="kca-row">' + f('seller', t.f_seller, 'text') + f('buyer', t.f_buyer, 'text', '', '', 1) + '</div><div class="kca-row">' + f('project', t.f_project, 'text') + f('unit', t.f_unit, 'text') + '</div>' + f('contract', t.f_contract, 'text', '', '', 1) + '</fieldset>' +
    '<fieldset><legend>' + esc(t.s2) + '</legend><div class="kca-row">' + f('price', t.f_price, 'text', ' inputmode="decimal"') + '<div class="k-field"><label class="k-label" for="ca-cur">' + esc(t.f_cur) + '</label><input class="k-input" id="ca-cur" name="cur" type="text" maxlength="3" autocomplete="off" value="EUR" style="text-transform:uppercase"></div>' + f('paid', t.f_paid, 'text', ' inputmode="decimal"', '', 1) + '</div>' +
    f('sched', t.f_sched, 'textarea', '', '', 1) + '<div class="kca-row">' + f('date', t.f_date, 'date') + f('grace', t.f_grace, 'number', ' min="0" max="24" step="1"', '3') + f('long', t.f_long, 'number', ' min="1" max="60" step="1"', '6') + '</div>' +
    '<div class="kca-row">' + f('pen', t.f_pen, 'number', ' min="0" max="5" step="0.05"', '0.5') + f('cap', t.f_cap, 'number', ' min="0" max="50" step="0.5"', '10') + f('int', t.f_int, 'number', ' min="0" max="30" step="0.1"', '4') + f('snag', t.f_snag, 'number', ' min="1" max="365" step="1"', '30') + '</div></fieldset>' +
    '<fieldset><legend>' + esc(t.s3) + '</legend>' + cls.map(k => '<div class="kca-cl"><input type="checkbox" id="ca-c-' + k + '" name="c_' + k + '"' + (k !== 'reg' ? ' checked' : '') + '><label for="ca-c-' + k + '">' + esc(t['c_' + k]) + '<small data-basis="' + k + '"></small></label></div>').join('') + '</fieldset></form>' +
    '<div class="kca-out" aria-labelledby="kca-h4"><h2 id="kca-h4" class="k-vh">' + esc(t.s4) + '</h2><div class="kca-acts"><button type="button" class="k-btn k-btn--primary" id="kca-pdf">' + esc(t.pdf) + '</button><button type="button" class="k-btn" id="kca-docx">' + esc(t.docx) + '</button><button type="button" class="k-btn k-btn--ghost" id="kca-print">' + esc(t.print) + '</button></div>' +
    '<p class="kca-st" id="kca-st" role="status" aria-live="polite"></p><article class="kca-doc" id="kca-doc" lang="en" dir="ltr"></article><p class="k-small k-muted">' + esc(t.doc_lang) + '</p></div></div></section>' +
    '<section class="k-sec kca-rel"><div class="k-wrap"><h2>' + esc(t.rel_h) + '</h2><ul><li><a href="/tools/law/">' + esc(t.rel_law) + '</a></li><li><a href="/tools/delay-compensation/">' + esc(t.rel_delay) + '</a></li><li><a href="/tools/deposit-protection/">' + esc(t.rel_dep) + '</a></li></ul></div></section></div>' +
    '<script>window.KCA=' + JSON.stringify(client).replace(/</g, '\\u003c') + ';</script><script>' + JS + '</script>';
}

// browser code: builds the document from the form, PDF with jsPDF (loaded on click), .docx with a small stored-ZIP writer. No network calls with user data.
const JS = String.raw`(()=>{const K=window.KCA,t=K.t,$=s=>document.querySelector(s),F=$('#kca-f'),D=$('#kca-doc'),ST=$('#kca-st');
const CUR={ES:'EUR',PT:'EUR','AE-DU':'AED',MX:'MXN',TH:'THB',ID:'IDR',UK:'GBP','US-FL':'USD','US-NY':'USD'};
const e=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const v=n=>{const x=F.elements[n];return x?String(x.value||'').trim():''};const ck=n=>F.elements['c_'+n]&&F.elements['c_'+n].checked;
const num=s=>{s=String(s||'').replace(/[\s\u00a0]/g,'');if(/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(/,/g,'');const n=parseFloat(s);return isFinite(n)?n:null};
const money=(s,c)=>{const n=num(s);return n==null?'[amount]':c+' '+n.toLocaleString('en-GB',{maximumFractionDigits:2})};
const dt=s=>{if(!s)return'[date]';const d=new Date(s+'T00:00:00Z');return isNaN(d)?s:d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})};
const or=(s,d)=>s||d;
const SPEC={escrow:{ES:'a special account at a credit institution, kept apart from any other funds of the Seller and used only for building the Project, and guaranteed by an individual surety insurance policy or a joint and several bank guarantee (aval) in the Buyer\'s name covering all amounts paid plus legal interest',
 'AE-DU':'the escrow account of the Project opened with the Dubai Land Department. The Seller shall write the escrow agent bank and the escrow account number into this addendum and the Buyer shall make every payment only into that account',
 'US-FL':'an escrow account with an escrow agent as required by section 718.202 (condominium) or section 501.1375 (one- or two-family home) of the Florida Statutes. The Buyer does not waive the right to escrow. The Seller shall not withdraw any escrowed amount above 10 percent of the price for construction before closing, even where section 718.202(3) would allow it',
 'US-NY':'trust as required by section 352-h of the General Business Law, in the escrow account named in the offering plan, and shall not be commingled with the Seller\'s own money',
 MX:'a trust (fideicomiso) or an on-demand bank guarantee in the Buyer\'s favour, named in this addendum as the guarantee the Seller discloses under article 73 Bis, section XIII, of the Federal Consumer Protection Law',
 _:'an escrow account at a bank or in a lawyer\'s client account, in the Buyer\'s favour, or shall be covered by an on-demand bank guarantee in the Buyer\'s favour for all amounts paid'},
 cert:{ES:'the first occupation licence (licencia de primera ocupación) or the equivalent declaration of the town hall','AE-DU':'the completion certificate of the Project (Law No. 8 of 2007, Article 14)',ID:'the certificate of fitness for use (Sertifikat Laik Fungsi, SLF)',TH:'registration of the condominium and of the Unit with the Land Department',PT:'the use permit (licença de utilização)',MX:'the notice of completion of works (aviso de terminación de obra) issued by the municipality',UK:'the building control completion certificate and a new-home warranty certificate','US-FL':'the certificate of occupancy','US-NY':'the certificate of occupancy (temporary or final)'},
 permits:{ES:'the building licence (licencia de obras) for the Project','AE-DU':'possession of the land, the approvals of the competent entities, and the written permission of the Land Department to sell and advertise the Project off-plan',ID:'clear land title, the building approval (PBG) and, before this preliminary sale agreement (PPJB), at least 20 percent of the housing built',MX:'the authorisations, licences and permits for the construction and land use of the Project',TH:'the building permit and, where required for the Project, the environmental impact assessment (EIA) approval',PT:'the building licence (licença de construção) for the Project',UK:'planning permission and building control approval for the Project','US-FL':'the building permit for the Project','US-NY':'the building permit for the Project and, for a condominium or co-op, an offering plan accepted for filing by the Attorney General'},
 reg:{'AE-DU':'The Seller shall register this sale in the Interim Property Register of the Dubai Land Department within 30 days of signing and give the Buyer the registration certificate. Until it is registered, the Buyer is not required to make any further payment.',ID:'The Unit shall be registered in the Buyer\'s own name on a right a foreigner may hold (Hak Pakai, or strata title where allowed). The Seller shall not offer any arrangement in which title is held by another person for the Buyer.',TH:'The Seller shall give the Buyer a receipt for every payment and cooperate with the documents the Land Department needs to register a foreign-owned unit, including the bank\'s foreign exchange transaction form for money brought from abroad. The Seller confirms that registering the Unit to the Buyer keeps foreign ownership of the building within 49 percent of the unit area.',_:'The Seller shall complete the registration of the Unit in the Buyer\'s name within 60 days of completion.'}};
function clauses(){const c=v('country'),cur=(v('cur')||CUR[c]||'').toUpperCase(),seller=or(v('seller'),'[Seller]'),date=dt(v('date')),g=or(v('grace'),'0'),pen=or(v('pen'),'0'),cap=or(v('cap'),'0'),int=or(v('int'),'0'),lg=or(v('long'),'6'),sn=or(v('snag'),'30');
 const paid=num(v('paid'))!=null?' (so far '+money(v('paid'),cur)+')':'';const L=[];
 if(ck('escrow'))L.push(['escrow','Protection of payments','All amounts the Buyer pays before completion'+paid+' shall be held in '+(SPEC.escrow[c]||SPEC.escrow._)+'. Within 15 days of signing this addendum the Seller shall give the Buyer written evidence of this protection. While the evidence is missing, the Buyer may hold back any further payment without being in breach.']);
 if(ck('delay'))L.push(['delay','Delay penalty','The Seller shall complete the Unit by '+date+'. If completion is later than that date plus '+g+' month(s), the Seller shall pay the Buyer '+pen+' percent of all amounts paid for each full month of delay, up to '+cap+' percent of the total price. The penalty is due monthly, may be set off against any amount the Buyer still owes, and does not limit the Buyer\'s right to cancel under the clause on cancellation.'+(c==='MX'?' The parties agree that this penalty and any penalty on the Buyer are reciprocal and equivalent.':'')]);
 if(ck('refund'))L.push(['refund','Cancellation and refund with interest','If the Unit is not completed '+lg+' month(s) after '+date+', or if a permit listed in this addendum is refused, suspended or revoked, the Buyer may cancel the contract by written notice. The Seller shall then refund all amounts paid within 30 days, with interest at '+int+' percent per year from the date of each payment until the refund is received'+(c==='ES'?', and never less than the legal interest provided by the First additional provision of Law 38/1999':'')+'. No cancellation fee or deduction applies.']);
 if(ck('complete'))L.push(['complete','What counts as completion','The Unit is complete only when all of these exist: (a) '+(SPEC.cert[c]||'the certificate of occupancy or its local equivalent')+'; (b) the Unit is built as in the plans and specification attached to the contract; (c) the common areas, access and utilities listed in the contract are connected and usable; and (d) the Unit can be transferred or registered to the Buyer. A notice of completion without these does not start any period that runs against the Buyer.']);
 if(ck('permits'))L.push(['permits','Permits as a condition',seller+' confirms that it holds '+(SPEC.permits[c]||'every permit needed to build and sell the Project')+'. The Seller shall give the Buyer copies within 15 days of signing. If any of them is missing, refused, suspended or revoked, the Buyer may cancel and the clause on refunds applies.']);
 if(ck('snag'))L.push(['snag','Snagging and defects','Before completion the Buyer, or an inspector the Buyer chooses, may inspect the Unit with the Seller and list defects in writing. The Seller shall fix the listed defects within '+sn+' days at its own cost. The Buyer may hold back up to 5 percent of the price until the listed defects are fixed. This clause does not limit the Seller\'s liability for defects under the law.']);
 if(ck('reg'))L.push(['reg','Registration of the purchase',SPEC.reg[c]||SPEC.reg._]);
 return L}
function basis(k){const c=v('country');return((K.BASIS[c]||{})[k]||[]).map(id=>K.LAW[id]).filter(Boolean)}
function head(){const c=v('country'),cn=(K.C.find(x=>x[0]===c)||[])[1]||c,cur=(v('cur')||CUR[c]||'').toUpperCase();
 return{title:'Addendum to the purchase contract (draft for discussion)',lines:['Property: '+or(v('project'),'[Project]')+', unit '+or(v('unit'),'[Unit]')+', '+cn,'Seller: '+or(v('seller'),'[Seller]'),'Buyer: '+or(v('buyer'),'[Buyer]'),'Contract amended: '+or(v('contract'),'[contract name and date]'),'Total price: '+money(v('price'),cur)+(v('sched')?'. Payment schedule: '+v('sched'):'')],
 intro:'The parties agree to add the following clauses to the contract. Where this addendum and the contract differ, this addendum prevails.',
 foot:['Draft prepared with kolaboro.com/tools/contract-addendum/ on '+new Date().toISOString().slice(0,10)+'. A draft to discuss with your lawyer, not legal advice. Each legal reference was read in the official source on the date shown; laws change. Where no statute is cited, the clause is a contractual protection the Seller may refuse.','Signed for the Seller: ______________________   Date: __________','Signed by the Buyer: ______________________   Date: __________']}}
function render(){const H=head(),L=clauses();let h='<h3>'+e(H.title)+'</h3>'+H.lines.map(x=>'<p class="kca-meta">'+e(x)+'</p>').join('')+'<p>'+e(H.intro)+'</p>';
 if(!L.length)h+='<p class="k-muted">'+e(t.empty)+'</p>';
 L.forEach((c,i)=>{const B=basis(c[0]);h+='<h4>'+(i+1)+'. '+e(c[1])+'</h4><p>'+e(c[2])+'</p>'+(B.length?B.map(b=>'<div class="kca-law" lang="en"><b>'+e(b.law)+', '+e(b.cite)+'</b> <a class="k-src" href="'+e(b.url)+'" rel="noopener" target="_blank">'+e(t.law_open)+'</a><q lang="'+e(b.lang)+'">'+e(b.quote)+'</q>'+(b.tr?'<small>'+e(t.trans)+': '+e(b.tr)+'</small>':'')+(b.note?'<small style="display:block">'+e(t.note)+': '+e(b.note)+'</small>':'')+'</div>').join(''):'<div class="kca-law is-none" lang="'+e(K.lang)+'" dir="auto">'+e(t.law_none)+'</div>')});
 h+=H.foot.map((x,i)=>'<p class="'+(i?'':'kca-meta')+'">'+e(x)+'</p>').join('');D.innerHTML=h;
 document.querySelectorAll('[data-basis]').forEach(s=>{const B=basis(s.dataset.basis);s.textContent=B.length?B.map(b=>b.cite).join('; '):'-'})}
F.addEventListener('input',render);F.addEventListener('change',ev=>{if(ev.target.name==='country'){F.elements.cur.value=CUR[F.elements.country.value]||''}render()});
try{const q=new URLSearchParams(location.search).get('c');if(q&&CUR[q]){F.elements.country.value=q;F.elements.cur.value=CUR[q]}}catch(x){}
render();
function plain(){const H=head(),L=clauses(),P=[];P.push({h:1,t:H.title});H.lines.forEach(x=>P.push({t:x,m:1}));P.push({t:H.intro});
 L.forEach((c,i)=>{P.push({h:2,t:(i+1)+'. '+c[1]});P.push({t:c[2]});const B=basis(c[0]);if(B.length)B.forEach(b=>{P.push({t:'Legal basis: '+b.law+', '+b.cite+'. '+b.url,s:1});if(b.lang==='en'||b.lang==='es'||b.lang==='pt'||b.lang==='id')P.push({t:'"'+b.quote+'"',s:1,i:1});else P.push({t:'Original text: see the official source above.',s:1});if(b.tr)P.push({t:'English translation: '+b.tr,s:1});if(b.note)P.push({t:'Note: '+b.note,s:1})});else P.push({t:'Legal basis: none in our law notes for this point; contractual protection only.',s:1})});
 H.foot.forEach(x=>P.push({t:x,m:1}));return P}
const fname=x=>('addendum-'+(v('project')||'draft')).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)+'.'+x;
function save(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000)}
let jsp=null;function loadPdf(){if(jsp)return jsp;jsp=new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';s.integrity='sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk';s.crossOrigin='anonymous';s.onload=()=>window.jspdf?res(window.jspdf):rej(new Error('no jsPDF'));s.onerror=()=>{jsp=null;rej(new Error('network'))};document.head.appendChild(s)});return jsp}
const latin=s=>{let r=false;const o=String(s).replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/[\u2013\u2014]/g,'-').replace(/\u2026/g,'...').replace(/[^\x09\x0a\x0d\x20-\x7e\xa0-\xff]/g,()=>{r=true;return'?'});return[o,r]};
$('#kca-pdf').addEventListener('click',async()=>{const b=$('#kca-pdf');b.disabled=true;ST.textContent=t.st_pdf+'...';try{const J=await loadPdf(),doc=new J.jsPDF({unit:'pt',format:'a4'}),W=doc.internal.pageSize.getWidth(),Hh=doc.internal.pageSize.getHeight(),M=56;let y=M,rep=false;
 for(const p of plain()){const [txt,r]=latin(p.t);rep=rep||r;const sz=p.h===1?15:p.h===2?12:p.s?9:10.5;doc.setFont('helvetica',p.h?'bold':p.i?'italic':'normal');doc.setFontSize(sz);doc.setTextColor(p.s||p.m?90:20);
  const lines=doc.splitTextToSize(txt,W-2*M-(p.s?14:0));const lh=sz*1.38;if(p.h)y+=p.h===1?0:8;for(const ln of lines){if(y+lh>Hh-M){doc.addPage();y=M}doc.text(ln,M+(p.s?14:0),y);y+=lh}y+=p.h?2:5}
 const n=doc.getNumberOfPages();for(let i=1;i<=n;i++){doc.setPage(i);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(120);doc.text('Draft to discuss with your lawyer, not legal advice. Page '+i+' of '+n,M,Hh-28)}
 save(doc.output('blob'),fname('pdf'));ST.textContent=t.st_done+(rep?' '+t.st_latin:'')}catch(x){ST.textContent=t.st_err.replace('{e}',x.message||'error')}b.disabled=false});
// .docx: a stored ZIP (no compression) with the four parts Word needs
const CRC=(()=>{const T=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;T[n]=c>>>0}return b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=T[(c^b[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0}})();
function zip(files){const enc=new TextEncoder(),parts=[],cd=[];let off=0;const u16=n=>[n&255,(n>>8)&255],u32=n=>[n&255,(n>>8)&255,(n>>16)&255,(n>>>24)&255];
 for(const[name,txt]of files){const nb=enc.encode(name),db=enc.encode(txt),c=CRC(db);const h=new Uint8Array([0x50,0x4b,3,4,...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(c),...u32(db.length),...u32(db.length),...u16(nb.length),...u16(0)]);
  parts.push(h,nb,db);cd.push(new Uint8Array([0x50,0x4b,1,2,...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(c),...u32(db.length),...u32(db.length),...u16(nb.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),nb);off+=h.length+nb.length+db.length}
 const cdl=cd.reduce((a,b)=>a+b.length,0);parts.push(...cd,new Uint8Array([0x50,0x4b,5,6,0,0,0,0,...u16(files.length),...u16(files.length),...u32(cdl),...u32(off),0,0]));return new Blob(parts,{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'})}
const x=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'');
$('#kca-docx').addEventListener('click',()=>{try{const body=plain().map(p=>'<w:p><w:pPr>'+(p.h?'<w:pStyle w:val="Heading'+p.h+'"/>':'')+(p.s?'<w:ind w:left="360"/>':'')+'<w:spacing w:after="120"/></w:pPr><w:r><w:rPr>'+(p.h?'<w:b/>':'')+(p.i?'<w:i/>':'')+'<w:sz w:val="'+(p.h===1?30:p.h===2?24:p.s?18:21)+'"/>'+(p.s||p.m?'<w:color w:val="555555"/>':'')+'</w:rPr><w:t xml:space="preserve">'+x(p.t)+'</w:t></w:r></w:p>').join('');
 const docx=zip([['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'],
  ['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
  ['word/_rels/document.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
  ['word/styles.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Arial"/><w:sz w:val="21"/><w:lang w:val="en-GB"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="30"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style></w:styles>'],
  ['word/document.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+body+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>']]);
 save(docx,fname('docx'));ST.textContent=t.st_done}catch(z){ST.textContent=t.st_err.replace('{e}',z.message||'error')}});
$('#kca-print').addEventListener('click',()=>window.print());})();`;

async function assembleTool(shellRes, lang, env) {
  const t = tt(lang), path = '/tools/contract-addendum/', url = ORIGIN + pre(lang) + path;
  const alts = LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + path + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + path + '">';
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebApplication', name: 'Kolaboro ' + t.title, url, description: t.desc, inLanguage: lang, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
    { '@type': 'BreadcrumbList', itemListElement: [['Kolaboro', ORIGIN + pre(lang) + '/'], [t.crumb_tools, ORIGIN + '/tools/'], [t.title, url]].map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x[0], item: x[1] })) }] };
  const tags = '<title>' + esc(t.title) + ' | Kolaboro</title><meta name="description" content="' + esc(t.desc) + '"><link rel="canonical" href="' + url + '">' + alts +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="Kolaboro"><meta property="og:title" content="' + esc(t.title) + ' | Kolaboro"><meta property="og:description" content="' + esc(t.desc) + '"><meta property="og:url" content="' + url + '"><meta name="twitter:card" content="summary">' +
    '<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin><script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' + CSS;
  const LAW = await lawNotes(env);
  const res = new HTMLRewriter()
    .on('title', { element(e) { e.remove(); } })
    .on('meta[name="description"],meta[name="robots"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],link[rel="alternate"][hreflang]', { element(e) { e.remove(); } })
    .on('script[type="application/ld+json"]', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setAttribute('data-clarity-mask', 'True'); e.setInnerContent(toolBody(lang, LAW), { html: true }); } })
    .on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + path); } })
    .transform(new Response(shellRes.body, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
  return await res.text();
}
export async function handleTool(req, u, env, ctx, shell) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return null;
  const m = u.pathname.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?tools\/contract-addendum(\/?)$/); if (!m) return null;
  if (!m[2]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
  const lang = m[1] || 'en';
  const sh = await shell(pre(lang) + '/how-we-score/');
  if (!sh || sh.status !== 200) return null;
  return new Response(await assembleTool(sh, lang, env), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' } });
}
