// kolaboro.com batch 21 (agent n21c, 11 Nov 2026): can you legally short-let there? No model calls, nothing stored about visitors.
//   A rules table per jurisdiction: licence or registration, caps or zones, night limits, rules of the building or its owners.
//   Only what the official source we read says, each cell linked to that source with the date of the law or page and the date we
//   read it. "Not stated in the sources we read" and "Not checked yet" are shown as such. Facts and questions to ask, no advice.
//   Data: /data/short-let-rules.json (one file; rule summaries in 8 languages, sources, Inside Airbnb dataset -> rule sets).
// Shown: next to the short-let figures on named project pages (kbx_money.js calls rulesHtml), and as a page:
//   GET /guides/short-let-rules/ (+ /<lang>/)   the whole table in 8 languages
//   GET /api/x/short-let-rules                  the data file with a short description (public JSON)
const ORIGIN = 'https://kolaboro.com';
export const PAGE_RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?guides\/short-let-rules(\/?)$/;
export const PATHS = /^\/api\/x\/short-let-rules\/?$/;
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const CELLS = ['reg', 'cap', 'stay', 'own'];

let MEMO = null;
export async function rulesData(env) {
  if (MEMO && Date.now() - MEMO.t < 600000) return MEMO.v;
  let r = null; const path = '/data/short-let-rules.json';
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com' + path)); } catch (e) { r = null; }
  if (!r || !r.ok) { try { r = await fetch(ORIGIN + path + '?v=' + Math.floor(Date.now() / 600000), { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
  const v = r && r.ok ? await r.json().catch(() => null) : null;
  MEMO = { t: Date.now(), v }; return v;
}

const S = {
  en: { h: 'Can you legally short-let here?', lead: 'What the official source we read says. Rules change and cities add their own, so check the source before you count on short-let income.',
    cols: ['Where', 'Licence or registration', 'Caps or zones', 'Nights and stays', 'Building and owners'], nf: 'Not stated in the official sources we read', nc: 'Not checked yet', up: 'See the wider area in this table',
    dk: { law: 'law of {d}', page: 'page updated {d}', force: 'in force since {d}', doc: 'document of {d}', edition: '{d} edition' }, read: 'read {d}', q: 'In the source:', all: 'All places and sources',
    p_title: 'Short-let rules by city: what the official sources say', p_desc: 'Licence or registration, caps and zones, night limits and building rules for short lets in the cities where Kolaboro shows short-let figures. Each rule links to the official source and its date.',
    p_lead: 'A developer may promise short-let income. Whether you may short-let at all depends on the city, the region and often the building. This table says only what the official source we read says, with the link and the date.',
    p_how_h: 'How to read the table', p_how: ['Each row is a jurisdiction. A city row can sit above a wider row (region or country): both apply.', '"Not stated in the official sources we read" means the pages we read are silent on that point. It does not mean there is no rule.', '"Not checked yet" means we have not read an official source for that point.', 'This is not legal advice. Ask a local lawyer and the town hall before you sign.'],
    p_t_h: 'The rules, place by place', p_src_h: 'Official sources read', p_src_d: 'Each source with the date printed on it (law, page or document) and the day we read it.', p_not_h: 'Not read yet', p_not: { 'Abu Dhabi': 'the official guide could not be read by our reader', 'Thailand': 'the official law text could not be read by our reader', 'Bali and the rest of Indonesia': 'no official source read yet', 'Hawaii, Riga, Nairobi': 'no official source read yet', 'City of Vancouver, cities in Florida and Nevada': 'only the province, state or county source was read' },
    p_q_h: 'Questions to ask before you count on short-let income', p_q: ['Which licence or registration number will this unit use, and who applies for it?', 'Is the plot inside a zone where new short-let licences are issued today? Ask for the town hall document.', 'Do the building\'s deed, statutes or house rules allow tourist lets? Ask for the text.', 'Is the yield in the brochure based on nights that the local rule allows?', 'If the rule changes before handover, what does the contract say?'],
    p_where: 'Where we show it', p_where_t: 'On each tracked project in a covered place, next to the short-let figures within 1 km (Inside Airbnb).', p_json: 'Data as JSON', p_upd: 'Sources read on {d}', p_lic: 'Rule summaries by Kolaboro, CC BY 4.0. Quoted passages belong to the official sources.', crumb: 'Guides' },
  es: { h: '¿Se puede alquilar aquí por días legalmente?', lead: 'Lo que dice la fuente oficial que leímos. Las normas cambian y cada ciudad añade las suyas: comprueba la fuente antes de contar con ingresos de alquiler turístico.',
    cols: ['Dónde', 'Licencia o registro', 'Cupos o zonas', 'Noches y estancias', 'Edificio y propietarios'], nf: 'No consta en las fuentes oficiales que leímos', nc: 'Aún sin comprobar', up: 'Ver el ámbito más amplio en esta tabla',
    dk: { law: 'norma del {d}', page: 'página actualizada el {d}', force: 'en vigor desde el {d}', doc: 'documento del {d}', edition: 'edición {d}' }, read: 'leído el {d}', q: 'En la fuente:', all: 'Todos los lugares y fuentes',
    p_title: 'Normas de alquiler turístico por ciudad: lo que dicen las fuentes oficiales', p_desc: 'Licencia o registro, cupos y zonas, límites de noches y normas del edificio para el alquiler de corta duración en las ciudades donde Kolaboro muestra cifras. Cada norma enlaza a la fuente oficial y su fecha.',
    p_lead: 'Un promotor puede prometer ingresos por alquiler turístico. Que puedas alquilar por días depende de la ciudad, la región y a menudo del edificio. Esta tabla solo dice lo que dice la fuente oficial que leímos, con enlace y fecha.',
    p_how_h: 'Cómo leer la tabla', p_how: ['Cada fila es una jurisdicción. Una fila de ciudad puede estar sobre otra más amplia (región o país): se aplican las dos.', '"No consta en las fuentes oficiales que leímos" significa que las páginas leídas no dicen nada sobre ese punto. No significa que no haya norma.', '"Aún sin comprobar" significa que no hemos leído una fuente oficial sobre ese punto.', 'Esto no es asesoramiento jurídico. Consulta a un abogado local y al ayuntamiento antes de firmar.'],
    p_t_h: 'Las normas, lugar por lugar', p_src_h: 'Fuentes oficiales leídas', p_src_d: 'Cada fuente con la fecha que lleva impresa (norma, página o documento) y el día en que la leímos.', p_not_h: 'Aún sin leer', p_not: { 'Abu Dhabi': 'nuestro lector no pudo leer la guía oficial', 'Thailand': 'nuestro lector no pudo leer el texto oficial de la ley', 'Bali and the rest of Indonesia': 'aún no hemos leído ninguna fuente oficial', 'Hawaii, Riga, Nairobi': 'aún no hemos leído ninguna fuente oficial', 'City of Vancouver, cities in Florida and Nevada': 'solo se leyó la fuente de la provincia, el estado o el condado' },
    p_q_h: 'Preguntas antes de contar con ingresos de alquiler turístico', p_q: ['¿Qué número de licencia o registro usará esta unidad y quién lo solicita?', '¿Está la parcela en una zona donde hoy se conceden nuevas licencias? Pide el documento del ayuntamiento.', '¿Permiten el título, los estatutos o las normas del edificio el alquiler turístico? Pide el texto.', '¿La rentabilidad del folleto se basa en noches que la norma local permite?', 'Si la norma cambia antes de la entrega, ¿qué dice el contrato?'],
    p_where: 'Dónde lo mostramos', p_where_t: 'En cada proyecto seguido en un lugar cubierto, junto a las cifras de alquiler turístico a menos de 1 km (Inside Airbnb).', p_json: 'Datos en JSON', p_upd: 'Fuentes leídas el {d}', p_lic: 'Resúmenes de Kolaboro, CC BY 4.0. Las citas pertenecen a las fuentes oficiales.', crumb: 'Guías' },
  fr: { h: 'Peut-on légalement louer ici en courte durée ?', lead: 'Ce que dit la source officielle que nous avons lue. Les règles changent et chaque ville ajoute les siennes : vérifiez la source avant de compter sur des revenus de location courte durée.',
    cols: ['Où', 'Licence ou enregistrement', 'Quotas ou zones', 'Nuits et séjours', 'Immeuble et copropriétaires'], nf: 'Non précisé dans les sources officielles lues', nc: 'Pas encore vérifié', up: 'Voir la zone plus large dans ce tableau',
    dk: { law: 'texte du {d}', page: 'page mise à jour le {d}', force: 'en vigueur depuis le {d}', doc: 'document du {d}', edition: 'édition {d}' }, read: 'lu le {d}', q: 'Dans la source :', all: 'Tous les lieux et sources',
    p_title: 'Règles de location courte durée par ville : ce que disent les sources officielles', p_desc: 'Licence ou enregistrement, quotas et zones, plafonds de nuits et règles d\'immeuble pour la location courte durée dans les villes où Kolaboro affiche des chiffres. Chaque règle renvoie à la source officielle et à sa date.',
    p_lead: 'Un promoteur peut promettre des revenus de location courte durée. Le droit de louer ainsi dépend de la ville, de la région et souvent de l\'immeuble. Ce tableau ne dit que ce que dit la source officielle lue, avec le lien et la date.',
    p_how_h: 'Comment lire le tableau', p_how: ['Chaque ligne est une juridiction. Une ligne de ville peut être placée au-dessus d\'une ligne plus large (région ou pays) : les deux s\'appliquent.', '« Non précisé dans les sources officielles lues » signifie que les pages lues sont muettes sur ce point. Cela ne veut pas dire qu\'il n\'y a pas de règle.', '« Pas encore vérifié » signifie que nous n\'avons pas lu de source officielle sur ce point.', 'Ceci n\'est pas un conseil juridique. Consultez un avocat local et la mairie avant de signer.'],
    p_t_h: 'Les règles, lieu par lieu', p_src_h: 'Sources officielles lues', p_src_d: 'Chaque source avec la date qu\'elle porte (texte, page ou document) et le jour où nous l\'avons lue.', p_not_h: 'Pas encore lu', p_not: { 'Abu Dhabi': 'notre lecteur n\'a pas pu lire le guide officiel', 'Thailand': 'notre lecteur n\'a pas pu lire le texte officiel de la loi', 'Bali and the rest of Indonesia': 'aucune source officielle lue pour l\'instant', 'Hawaii, Riga, Nairobi': 'aucune source officielle lue pour l\'instant', 'City of Vancouver, cities in Florida and Nevada': 'seule la source de la province, de l\'État ou du comté a été lue' },
    p_q_h: 'Questions à poser avant de compter sur des revenus de courte durée', p_q: ['Quel numéro de licence ou d\'enregistrement ce lot utilisera-t-il, et qui le demande ?', 'Le terrain est-il dans une zone où de nouvelles licences sont délivrées aujourd\'hui ? Demandez le document de la mairie.', 'Le règlement de copropriété ou les statuts de l\'immeuble autorisent-ils la location touristique ? Demandez le texte.', 'Le rendement de la brochure repose-t-il sur un nombre de nuits que la règle locale autorise ?', 'Si la règle change avant la livraison, que dit le contrat ?'],
    p_where: 'Où nous l\'affichons', p_where_t: 'Sur chaque projet suivi dans un lieu couvert, à côté des chiffres de location courte durée à moins de 1 km (Inside Airbnb).', p_json: 'Données en JSON', p_upd: 'Sources lues le {d}', p_lic: 'Résumés par Kolaboro, CC BY 4.0. Les citations appartiennent aux sources officielles.', crumb: 'Guides' },
  de: { h: 'Darf man hier legal kurzzeitig vermieten?', lead: 'Was die von uns gelesene amtliche Quelle sagt. Regeln ändern sich und Städte haben eigene: Prüfen Sie die Quelle, bevor Sie mit Einnahmen aus Kurzzeitvermietung rechnen.',
    cols: ['Wo', 'Lizenz oder Registrierung', 'Obergrenzen oder Zonen', 'Nächte und Aufenthalte', 'Gebäude und Eigentümer'], nf: 'In den gelesenen amtlichen Quellen nicht genannt', nc: 'Noch nicht geprüft', up: 'Siehe das größere Gebiet in dieser Tabelle',
    dk: { law: 'Vorschrift vom {d}', page: 'Seite aktualisiert am {d}', force: 'in Kraft seit {d}', doc: 'Dokument vom {d}', edition: 'Ausgabe {d}' }, read: 'gelesen am {d}', q: 'In der Quelle:', all: 'Alle Orte und Quellen',
    p_title: 'Regeln für Kurzzeitvermietung nach Stadt: was die amtlichen Quellen sagen', p_desc: 'Lizenz oder Registrierung, Obergrenzen und Zonen, Nächtegrenzen und Hausregeln für Kurzzeitvermietung in den Städten, für die Kolaboro Zahlen zeigt. Jede Regel verlinkt die amtliche Quelle mit Datum.',
    p_lead: 'Ein Bauträger kann Einnahmen aus Kurzzeitvermietung versprechen. Ob Sie überhaupt so vermieten dürfen, hängt von Stadt, Region und oft vom Gebäude ab. Diese Tabelle sagt nur, was die gelesene amtliche Quelle sagt, mit Link und Datum.',
    p_how_h: 'So lesen Sie die Tabelle', p_how: ['Jede Zeile ist ein Rechtsgebiet. Eine Stadtzeile kann über einer größeren Zeile (Region oder Land) stehen: Beide gelten.', '"In den gelesenen amtlichen Quellen nicht genannt" heißt, dass die gelesenen Seiten dazu schweigen. Es heißt nicht, dass es keine Regel gibt.', '"Noch nicht geprüft" heißt, dass wir dazu keine amtliche Quelle gelesen haben.', 'Das ist keine Rechtsberatung. Fragen Sie vor der Unterschrift einen Anwalt vor Ort und die Gemeinde.'],
    p_t_h: 'Die Regeln, Ort für Ort', p_src_h: 'Gelesene amtliche Quellen', p_src_d: 'Jede Quelle mit dem aufgedruckten Datum (Vorschrift, Seite oder Dokument) und dem Tag, an dem wir sie gelesen haben.', p_not_h: 'Noch nicht gelesen', p_not: { 'Abu Dhabi': 'unser Leser konnte den amtlichen Leitfaden nicht lesen', 'Thailand': 'unser Leser konnte den amtlichen Gesetzestext nicht lesen', 'Bali and the rest of Indonesia': 'noch keine amtliche Quelle gelesen', 'Hawaii, Riga, Nairobi': 'noch keine amtliche Quelle gelesen', 'City of Vancouver, cities in Florida and Nevada': 'nur die Quelle der Provinz, des Staates oder des Countys wurde gelesen' },
    p_q_h: 'Fragen, bevor Sie mit Einnahmen aus Kurzzeitvermietung rechnen', p_q: ['Welche Lizenz- oder Registriernummer nutzt diese Einheit, und wer beantragt sie?', 'Liegt das Grundstück in einer Zone, in der heute neue Lizenzen erteilt werden? Bitten Sie um das Dokument der Gemeinde.', 'Erlauben Teilungserklärung, Satzung oder Hausordnung touristische Vermietung? Bitten Sie um den Text.', 'Beruht die Rendite im Prospekt auf Nächten, die die örtliche Regel erlaubt?', 'Was sagt der Vertrag, wenn sich die Regel vor der Übergabe ändert?'],
    p_where: 'Wo wir es zeigen', p_where_t: 'Bei jedem verfolgten Projekt an einem abgedeckten Ort, neben den Kurzzeitmiet-Zahlen im Umkreis von 1 km (Inside Airbnb).', p_json: 'Daten als JSON', p_upd: 'Quellen gelesen am {d}', p_lic: 'Zusammenfassungen von Kolaboro, CC BY 4.0. Zitate gehören den amtlichen Quellen.', crumb: 'Ratgeber' },
  nl: { h: 'Mag je hier legaal kort verhuren?', lead: 'Wat de officiële bron die wij lazen zegt. Regels veranderen en steden hebben eigen regels: controleer de bron voordat je op inkomsten uit korte verhuur rekent.',
    cols: ['Waar', 'Vergunning of registratie', 'Plafonds of zones', 'Nachten en verblijven', 'Gebouw en eigenaren'], nf: 'Niet vermeld in de officiële bronnen die wij lazen', nc: 'Nog niet gecontroleerd', up: 'Zie het grotere gebied in deze tabel',
    dk: { law: 'regeling van {d}', page: 'pagina bijgewerkt op {d}', force: 'van kracht sinds {d}', doc: 'document van {d}', edition: 'editie {d}' }, read: 'gelezen op {d}', q: 'In de bron:', all: 'Alle plaatsen en bronnen',
    p_title: 'Regels voor korte verhuur per stad: wat de officiële bronnen zeggen', p_desc: 'Vergunning of registratie, plafonds en zones, nachtlimieten en gebouwregels voor korte verhuur in de steden waar Kolaboro cijfers toont. Elke regel linkt naar de officiële bron met datum.',
    p_lead: 'Een ontwikkelaar kan inkomsten uit korte verhuur beloven. Of je zo mag verhuren hangt af van de stad, de regio en vaak het gebouw. Deze tabel zegt alleen wat de gelezen officiële bron zegt, met link en datum.',
    p_how_h: 'Zo lees je de tabel', p_how: ['Elke rij is een rechtsgebied. Een stadsrij kan boven een bredere rij (regio of land) staan: beide gelden.', '"Niet vermeld in de officiële bronnen die wij lazen" betekent dat de gelezen pagina\'s er niets over zeggen. Het betekent niet dat er geen regel is.', '"Nog niet gecontroleerd" betekent dat wij daarover geen officiële bron hebben gelezen.', 'Dit is geen juridisch advies. Vraag een lokale advocaat en de gemeente voordat je tekent.'],
    p_t_h: 'De regels, plaats voor plaats', p_src_h: 'Gelezen officiële bronnen', p_src_d: 'Elke bron met de datum die erop staat (regeling, pagina of document) en de dag waarop wij haar lazen.', p_not_h: 'Nog niet gelezen', p_not: { 'Abu Dhabi': 'onze lezer kon de officiële gids niet lezen', 'Thailand': 'onze lezer kon de officiële wettekst niet lezen', 'Bali and the rest of Indonesia': 'nog geen officiële bron gelezen', 'Hawaii, Riga, Nairobi': 'nog geen officiële bron gelezen', 'City of Vancouver, cities in Florida and Nevada': 'alleen de bron van de provincie, staat of county is gelezen' },
    p_q_h: 'Vragen voordat je op inkomsten uit korte verhuur rekent', p_q: ['Welk vergunnings- of registratienummer gebruikt deze eenheid, en wie vraagt het aan?', 'Ligt het perceel in een zone waar vandaag nieuwe vergunningen worden verleend? Vraag het document van de gemeente.', 'Staan de akte, statuten of het huisreglement toeristische verhuur toe? Vraag de tekst.', 'Is het rendement in de brochure gebaseerd op nachten die de lokale regel toestaat?', 'Wat zegt het contract als de regel vóór oplevering verandert?'],
    p_where: 'Waar we het tonen', p_where_t: 'Bij elk gevolgd project op een gedekte plaats, naast de cijfers over korte verhuur binnen 1 km (Inside Airbnb).', p_json: 'Data als JSON', p_upd: 'Bronnen gelezen op {d}', p_lic: 'Samenvattingen door Kolaboro, CC BY 4.0. Citaten behoren toe aan de officiële bronnen.', crumb: 'Gidsen' },
  ru: { h: 'Можно ли здесь законно сдавать посуточно?', lead: 'Что говорит прочитанный нами официальный источник. Правила меняются, а города добавляют свои: проверьте источник, прежде чем рассчитывать на доход от краткосрочной аренды.',
    cols: ['Где', 'Лицензия или регистрация', 'Квоты или зоны', 'Ночи и сроки', 'Дом и собственники'], nf: 'Не указано в прочитанных официальных источниках', nc: 'Ещё не проверено', up: 'См. более широкую территорию в этой таблице',
    dk: { law: 'акт от {d}', page: 'страница обновлена {d}', force: 'действует с {d}', doc: 'документ от {d}', edition: 'редакция {d}' }, read: 'прочитано {d}', q: 'В источнике:', all: 'Все места и источники',
    p_title: 'Правила краткосрочной аренды по городам: что говорят официальные источники', p_desc: 'Лицензия или регистрация, квоты и зоны, лимиты ночей и правила дома для краткосрочной аренды в городах, где Kolaboro показывает цифры. Каждое правило со ссылкой на официальный источник и датой.',
    p_lead: 'Застройщик может обещать доход от краткосрочной аренды. Можно ли вообще так сдавать, зависит от города, региона и часто от дома. В таблице только то, что говорит прочитанный официальный источник, со ссылкой и датой.',
    p_how_h: 'Как читать таблицу', p_how: ['Каждая строка: юрисдикция. Строка города может стоять над более широкой строкой (регион или страна): действуют обе.', '"Не указано в прочитанных официальных источниках" значит, что прочитанные страницы об этом молчат. Это не значит, что правила нет.', '"Ещё не проверено" значит, что мы не читали официальный источник по этому пункту.', 'Это не юридическая консультация. До подписания спросите местного юриста и мэрию.'],
    p_t_h: 'Правила по местам', p_src_h: 'Прочитанные официальные источники', p_src_d: 'Каждый источник с указанной на нём датой (акт, страница или документ) и днём, когда мы его прочитали.', p_not_h: 'Ещё не прочитано', p_not: { 'Abu Dhabi': 'наш ридер не смог прочитать официальное руководство', 'Thailand': 'наш ридер не смог прочитать официальный текст закона', 'Bali and the rest of Indonesia': 'официальный источник ещё не прочитан', 'Hawaii, Riga, Nairobi': 'официальный источник ещё не прочитан', 'City of Vancouver, cities in Florida and Nevada': 'прочитан только источник провинции, штата или округа' },
    p_q_h: 'Вопросы до того, как рассчитывать на доход от краткосрочной аренды', p_q: ['Какой номер лицензии или регистрации будет у этого объекта и кто его оформляет?', 'Находится ли участок в зоне, где сегодня выдают новые лицензии? Попросите документ мэрии.', 'Разрешают ли учредительный документ, устав или правила дома туристическую сдачу? Попросите текст.', 'Основана ли доходность из брошюры на числе ночей, которое разрешает местное правило?', 'Что говорит договор, если правило изменится до сдачи объекта?'],
    p_where: 'Где мы это показываем', p_where_t: 'У каждого отслеживаемого проекта в охваченном месте, рядом с цифрами краткосрочной аренды в радиусе 1 км (Inside Airbnb).', p_json: 'Данные в JSON', p_upd: 'Источники прочитаны {d}', p_lic: 'Краткие изложения Kolaboro, CC BY 4.0. Цитаты принадлежат официальным источникам.', crumb: 'Гиды' },
  zh: { h: '这里可以合法短租吗？', lead: '以下是我们读到的官方来源的说法。规则会变，各城市还有自己的规定：在指望短租收入之前，请先核对来源。',
    cols: ['地点', '许可或登记', '配额或分区', '晚数与租期', '楼宇与业主'], nf: '我们读到的官方来源未说明', nc: '尚未核查', up: '见本表中更大范围的一行',
    dk: { law: '{d} 的法规', page: '页面更新于 {d}', force: '自 {d} 起施行', doc: '{d} 的文件', edition: '{d} 版' }, read: '阅读于 {d}', q: '来源原文：', all: '全部地点和来源',
    p_title: '各城市短租规则：官方来源怎么说', p_desc: 'Kolaboro 显示短租数据的城市中，短租的许可或登记、配额和分区、晚数上限以及楼宇规定。每条规则都链接到官方来源及其日期。',
    p_lead: '开发商可能承诺短租收入。能否短租取决于城市、地区，往往还取决于楼宇。本表只写我们读到的官方来源的说法，并附链接和日期。',
    p_how_h: '如何阅读本表', p_how: ['每一行是一个辖区。城市行可能位于更大范围（地区或国家）一行之上：两者同时适用。', '"我们读到的官方来源未说明"表示所读页面未提及该点，并不表示没有规定。', '"尚未核查"表示我们还没有读到关于该点的官方来源。', '这不是法律意见。签约前请咨询当地律师和市政部门。'],
    p_t_h: '各地规则', p_src_h: '已阅读的官方来源', p_src_d: '每个来源附其自身标注的日期（法规、页面或文件）以及我们阅读的日期。', p_not_h: '尚未阅读', p_not: { 'Abu Dhabi': '我们的读取工具无法读取官方指南', 'Thailand': '我们的读取工具无法读取官方法律文本', 'Bali and the rest of Indonesia': '尚未阅读官方来源', 'Hawaii, Riga, Nairobi': '尚未阅读官方来源', 'City of Vancouver, cities in Florida and Nevada': '只阅读了省、州或县一级的来源' },
    p_q_h: '指望短租收入之前要问的问题', p_q: ['这个单元将使用哪个许可或登记号？由谁申请？', '地块是否位于目前仍发放新短租许可的区域？请索取市政文件。', '楼宇的设立文件、章程或住户守则是否允许旅游出租？请索取原文。', '宣传册中的收益率是否基于当地规定允许的晚数？', '如果交房前规则改变，合同怎么约定？'],
    p_where: '显示位置', p_where_t: '在覆盖地点的每个跟踪项目页面上，位于 1 公里内短租数据（Inside Airbnb）旁边。', p_json: 'JSON 数据', p_upd: '来源阅读于 {d}', p_lic: '规则摘要由 Kolaboro 提供，CC BY 4.0。引文归官方来源所有。', crumb: '指南' },
  ar: { h: 'هل يمكن التأجير القصير هنا قانونياً؟', lead: 'ما يقوله المصدر الرسمي الذي قرأناه. القواعد تتغير والمدن تضيف قواعدها: راجع المصدر قبل أن تعتمد على دخل التأجير القصير.',
    cols: ['المكان', 'ترخيص أو تسجيل', 'حصص أو مناطق', 'الليالي والمدد', 'المبنى والملاك'], nf: 'غير مذكور في المصادر الرسمية التي قرأناها', nc: 'لم يُفحص بعد', up: 'انظر النطاق الأوسع في هذا الجدول',
    dk: { law: 'نص بتاريخ {d}', page: 'الصفحة محدّثة في {d}', force: 'سارٍ منذ {d}', doc: 'وثيقة بتاريخ {d}', edition: 'طبعة {d}' }, read: 'قُرئ في {d}', q: 'في المصدر:', all: 'كل الأماكن والمصادر',
    p_title: 'قواعد التأجير القصير حسب المدينة: ما تقوله المصادر الرسمية', p_desc: 'الترخيص أو التسجيل، الحصص والمناطق، حدود الليالي وقواعد المبنى للتأجير القصير في المدن التي يعرض فيها Kolaboro أرقاماً. كل قاعدة مرتبطة بالمصدر الرسمي وتاريخه.',
    p_lead: 'قد يعد المطوّر بدخل من التأجير القصير. وإمكان التأجير أصلاً يتوقف على المدينة والإقليم وغالباً على المبنى. هذا الجدول يذكر فقط ما يقوله المصدر الرسمي الذي قرأناه، مع الرابط والتاريخ.',
    p_how_h: 'كيف تقرأ الجدول', p_how: ['كل صف هو ولاية قضائية. قد يعلو صف المدينة صفاً أوسع (إقليم أو بلد): يسري الاثنان.', '"غير مذكور في المصادر الرسمية التي قرأناها" تعني أن الصفحات المقروءة لا تتناول هذه النقطة. ولا تعني عدم وجود قاعدة.', '"لم يُفحص بعد" تعني أننا لم نقرأ مصدراً رسمياً عن هذه النقطة.', 'هذه ليست استشارة قانونية. اسأل محامياً محلياً والبلدية قبل التوقيع.'],
    p_t_h: 'القواعد مكاناً مكاناً', p_src_h: 'المصادر الرسمية المقروءة', p_src_d: 'كل مصدر مع التاريخ المدوَّن عليه (نص أو صفحة أو وثيقة) ويوم قراءتنا له.', p_not_h: 'لم يُقرأ بعد', p_not: { 'Abu Dhabi': 'لم يتمكن قارئنا من قراءة الدليل الرسمي', 'Thailand': 'لم يتمكن قارئنا من قراءة النص الرسمي للقانون', 'Bali and the rest of Indonesia': 'لم يُقرأ مصدر رسمي بعد', 'Hawaii, Riga, Nairobi': 'لم يُقرأ مصدر رسمي بعد', 'City of Vancouver, cities in Florida and Nevada': 'قُرئ مصدر المقاطعة أو الولاية فقط' },
    p_q_h: 'أسئلة قبل الاعتماد على دخل التأجير القصير', p_q: ['أي رقم ترخيص أو تسجيل ستستخدمه هذه الوحدة، ومن يتقدم بطلبه؟', 'هل تقع الأرض في منطقة تُمنح فيها اليوم تراخيص جديدة؟ اطلب وثيقة البلدية.', 'هل يسمح سند المبنى أو نظامه أو لائحته بالتأجير السياحي؟ اطلب النص.', 'هل العائد في الكتيّب مبني على ليالٍ تسمح بها القاعدة المحلية؟', 'إذا تغيّرت القاعدة قبل التسليم، ماذا يقول العقد؟'],
    p_where: 'أين نعرضه', p_where_t: 'في صفحة كل مشروع متابَع في مكان مشمول، بجوار أرقام التأجير القصير ضمن 1 كم (Inside Airbnb).', p_json: 'البيانات بصيغة JSON', p_upd: 'قُرئت المصادر في {d}', p_lic: 'ملخصات القواعد من Kolaboro، CC BY 4.0. الاقتباسات تعود للمصادر الرسمية.', crumb: 'أدلة' }
};
const t = (l, k) => (S[l] && S[l][k] != null ? S[l][k] : S.en[k]);
const fdt = (d, l) => { if (!d) return ''; try { return new Date(d + 'T00:00:00Z').toLocaleDateString(LOC[l] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return d; } };
const ltr = s => '<bdi dir="ltr">' + esc(s) + '</bdi>';

// which rule sets apply to a named project: the Inside Airbnb dataset of its short-let figures first, else its market, else its country
export function rulesFor(rd, x, ds) {
  if (!rd || !rd.rules || !x) return [];
  const ids = (ds && rd.by_dataset && rd.by_dataset[ds]) || (rd.by_market && rd.by_market[x.mk]) || (rd.by_country && rd.by_country[x.co]) || [];
  return ids.filter(i => rd.rules[i]);
}
function srcMark(rd, id, lang) {
  const s = rd.sources && rd.sources[id]; if (!s) return '';
  const pub = String(s.n).split(',')[0], when = s.d ? String(t(lang, 'dk')[s.dk || 'page'] || '{d}').replace('{d}', s.dk === 'edition' ? s.d.slice(0, 4) : fdt(s.d, lang)) : String(t(lang, 'read')).replace('{d}', fdt(s.read, lang));
  return '<a class="k-src" href="' + esc(s.u) + '" rel="noopener" target="_blank">' + ltr(pub) + ', ' + esc(when) + '</a>';
}
function cellHtml(rd, c, lang) {
  if (!c || c.s === 'nc') return '<span class="k-muted">' + esc(t(lang, 'nc')) + '</span>';
  if (c.s === 'nf') return '<span class="k-muted">' + esc(t(lang, 'nf')) + '</span>';
  if (c.s === 'up') return '<span class="k-muted">' + esc(t(lang, 'up')) + '</span>';
  const txt = (c.t && (c.t[lang] || c.t.en)) || '';
  return '<span class="ksr-t">' + esc(txt) + '</span>' + (c.q ? ' <q class="ksr-q" lang="' + esc(c.q.l) + '" dir="ltr">' + esc(c.q.t) + '</q>' : '') + ' ' + (c.src || []).map(i => srcMark(rd, i, lang)).join(' ');
}
function tableHtml(rd, ids, lang, quotes) {
  const cols = t(lang, 'cols');
  return '<div class="k-table-wrap ksr-tw"><table class="k-table k-table--dense k-table--stack ksr"><thead><tr>' + cols.map(c => '<th scope="col">' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' +
    ids.map(i => { const j = rd.rules[i]; return '<tr id="r-' + esc(i) + '"><th scope="row" data-label="' + esc(cols[0]) + '">' + ltr(j.name) + '</th>' + CELLS.map((c, n) => '<td data-label="' + esc(cols[n + 1]) + '">' + cellHtml(rd, quotes ? j[c] : Object.assign({}, j[c], { q: null }), lang) + '</td>').join('') + '</tr>'; }).join('') + '</tbody></table></div>';
}
export const RULES_CSS = '.ksr-tw{margin:12px 0;overflow-x:auto}.ksr th[scope=row]{min-width:7.5em;font-weight:600}.ksr td{min-width:11em;vertical-align:top;font-size:var(--k-fs-sm,15px);overflow-wrap:anywhere}.ksr .k-src{white-space:normal}.ksr-q{display:block;margin:4px 0;color:var(--k-muted,var(--muted));font-size:var(--k-fs-xs,13px);unicode-bidi:isolate}' +
  '@media (max-width:640px){.ksr td,.ksr th[scope=row]{min-width:0}}';

// block for the named project page ('' when no rule set covers the project)
export function rulesHtml(rd, x, lang, ds) {
  const ids = rulesFor(rd, x, ds); if (!ids.length) return '';
  return '<h3 id="short-let-rules">' + esc(t(lang, 'h')) + '</h3><p class="kfact k-small">' + esc(t(lang, 'lead')) + '</p>' + tableHtml(rd, ids, lang, false) +
    '<p class="k-small"><a href="' + pre(lang) + '/guides/short-let-rules/">' + esc(t(lang, 'all')) + '</a></p>';
}
// plain data for the JSON API of a project (/api/x/money/<ID>)
export function rulesJson(rd, x, ds) {
  const ids = rulesFor(rd, x, ds); if (!ids.length) return null;
  return { page: ORIGIN + '/guides/short-let-rules/', read: rd.updated, note: rd.note, rules: ids.map(i => { const j = rd.rules[i], o = { id: i, place: j.name }; for (const c of CELLS) o[c] = { status: j[c].s, text: j[c].t ? j[c].t.en : null, sources: (j[c].src || []).map(s => rd.sources[s]) }; return o; }) };
}

// ------------------------------------------------------------------------------------------------ page /guides/short-let-rules/
const PG_CSS = '<style>' + RULES_CSS + '.ksr-pg h2{margin-top:var(--k-6,32px)}.ksr-pg ul,.ksr-pg ol{padding-inline-start:1.2em}.ksr-pg li{margin:6px 0}.ksr-src li{overflow-wrap:anywhere}.ksr-pg .k-table-wrap{max-width:100%}</style>';
export function pageBody(rd, lang) {   // exported for the local test
  const order = ['uk-lon', 'uk-eng', 'uk-sco', 'ie-dub', 'de-be', 'fr', 'es-an', 'es-ib', 'es-vc', 'es', 'pt', 'gr-ath', 'gr-the', 'gr', 'tr', 'ae-du', 'ca-bc', 'ca-to', 'us-nyc', 'us-nash', 'us-aus', 'us-fl', 'us-nv', 'us-hi', 'th', 'lv-riga', 'ke-nbo'].filter(i => rd.rules[i]);
  for (const i of Object.keys(rd.rules)) if (!order.includes(i)) order.push(i);
  const used = new Set(); for (const i of order) for (const c of CELLS) for (const s of (rd.rules[i][c].src || [])) used.add(s);
  const srcs = Object.keys(rd.sources).filter(k => used.has(k)).map(k => { const s = rd.sources[k]; return '<li><a href="' + esc(s.u) + '" rel="noopener" target="_blank">' + ltr(s.n) + '</a> <span class="k-muted">' + (s.d ? esc(String(t(lang, 'dk')[s.dk || 'page']).replace('{d}', s.dk === 'edition' ? s.d.slice(0, 4) : fdt(s.d, lang))) + ', ' : '') + esc(String(t(lang, 'read')).replace('{d}', fdt(s.read, lang))) + '</span></li>'; }).join('');
  const nr = t(lang, 'p_not'), nots = (rd.not_read || []).map(n => '<li>' + ltr(n.place) + ': ' + esc(nr[n.place] || n.why) + '</li>').join('');
  return '<div class="ksr-pg"><section class="k-sec"><div class="k-wrap"><div class="k-phead"><p class="k-crumb"><a href="' + pre(lang) + '/">Kolaboro</a> / ' + esc(t(lang, 'crumb')) + '</p><h1>' + esc(t(lang, 'p_title')) + '</h1><p class="lead">' + esc(t(lang, 'p_lead')) + '</p>' +
    '<p class="k-small k-muted">' + esc(String(t(lang, 'p_upd')).replace('{d}', fdt(rd.updated, lang))) + '</p></div>' +
    '<h2>' + esc(t(lang, 'p_how_h')) + '</h2><ul>' + t(lang, 'p_how').map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>' +
    '<h2 id="rules">' + esc(t(lang, 'p_t_h')) + '</h2>' + tableHtml(rd, order, lang, true) +
    '<h2>' + esc(t(lang, 'p_q_h')) + '</h2><ol>' + t(lang, 'p_q').map(s => '<li>' + esc(s) + '</li>').join('') + '</ol>' +
    '<h2 id="sources">' + esc(t(lang, 'p_src_h')) + '</h2><p>' + esc(t(lang, 'p_src_d')) + '</p><ul class="ksr-src">' + srcs + '</ul>' +
    (nots ? '<h2>' + esc(t(lang, 'p_not_h')) + '</h2><ul>' + nots + '</ul>' : '') +
    '<h2>' + esc(t(lang, 'p_where')) + '</h2><p>' + esc(t(lang, 'p_where_t')) + ' <a href="' + pre(lang) + '/projects/">kolaboro.com/projects</a></p>' +
    '<p class="k-small"><a class="k-src" href="/api/x/short-let-rules">' + esc(t(lang, 'p_json')) + '</a> <a class="k-src" href="/data/short-let-rules.json">/data/short-let-rules.json</a> <span class="k-muted">' + esc(t(lang, 'p_lic')) + '</span></p></div></section></div>';
}
export async function page(req, u, env, ctx, shell) {
  const m = u.pathname.match(PAGE_RX); if (!m || !shell) return null;
  if (!m[2]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
  const lang = m[1] || 'en', path = '/guides/short-let-rules/', url = ORIGIN + pre(lang) + path;
  const rd = await rulesData(env); if (!rd || !rd.rules) return null;
  const sh = await shell(pre(lang) + '/how-we-score/');
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': url + '#page', url, name: t(lang, 'p_title'), description: t(lang, 'p_desc'), inLanguage: lang, dateModified: rd.updated, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'Dataset', name: t(lang, 'p_title'), description: t(lang, 'p_desc'), url, isAccessibleForFree: true, dateModified: rd.updated, license: 'https://creativecommons.org/licenses/by/4.0/', creator: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/data/short-let-rules.json' }] },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kolaboro', item: ORIGIN + pre(lang) + '/' }, { '@type': 'ListItem', position: 2, name: t(lang, 'p_title'), item: url }] }] };
  const alts = LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + path + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + path + '">';
  const tags = '<title>' + esc(t(lang, 'p_title')) + ' | Kolaboro</title><meta name="description" content="' + esc(t(lang, 'p_desc')) + '"><link rel="canonical" href="' + url + '">' + alts +
    '<meta property="og:type" content="article"><meta property="og:site_name" content="Kolaboro"><meta property="og:title" content="' + esc(t(lang, 'p_title')) + ' | Kolaboro"><meta property="og:description" content="' + esc(t(lang, 'p_desc')) + '"><meta property="og:url" content="' + url + '"><meta name="twitter:card" content="summary">' +
    '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' + PG_CSS;
  const body = pageBody(rd, lang);
  const res = new HTMLRewriter()
    .on('html', { element(e) { e.setAttribute('lang', lang); if (lang === 'ar') e.setAttribute('dir', 'rtl'); else e.removeAttribute('dir'); } })
    .on('title', { element(e) { e.remove(); } })
    .on('meta[name="description"],meta[name="robots"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],link[rel="alternate"][hreflang]', { element(e) { e.remove(); } })
    .on('script[type="application/ld+json"]', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(body, { html: true }); } })
    .on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + path); } })
    .transform(new Response(sh.body, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
  return new Response(await res.text(), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600' } });
}

// ------------------------------------------------------------------------------------------------ JSON API
export async function handle(req, u, env) {
  const H = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=600', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' };
  if (req.method !== 'GET' && req.method !== 'HEAD') return new Response(JSON.stringify({ error: 'method' }), { status: 405, headers: Object.assign({}, H, { 'cache-control': 'no-store' }) });
  const rd = await rulesData(env);
  if (!rd) return new Response(JSON.stringify({ error: 'not_built_yet' }), { status: 503, headers: Object.assign({}, H, { 'cache-control': 'no-store' }) });
  return new Response(JSON.stringify(Object.assign({ page: ORIGIN + '/guides/short-let-rules/', per_project: ORIGIN + '/api/x/money/<ID> (field short_let_rules)' }, rd), null, 1), { headers: H });
}
