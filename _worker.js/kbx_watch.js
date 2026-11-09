// kolaboro.com batch 19 (n19a): fraud radar. No model calls. Facts only: a resemblance or a screening result, never a verdict.
// Data (built daily on main, published to pub/_lovable):
//   /data/lookalikes.json  .github/workflows/kolaboro-lookalikes.yml, tools/kolaboro-agent/fake_sites.py: new websites whose names
//                          resemble a developer or project website we track (Certificate Transparency via crt.sh, registered
//                          lookalike names in public DNS), with registry RDAP registration date, first certificate date and whether
//                          the name resolves today. The lookalike websites themselves are never opened.
//   /data/sanctions.json   .github/workflows/kolaboro-sanctions.yml, tools/kolaboro-agent/sanctions_screen.py: the official lists
//                          screened (entity entries only) and the developer pages whose company name had NO possible match.
//                          Possible matches are not published: they go to the admin CRM ("Screening" tab, admin key), kept with
//                          the internal risk graph (kolaboro_machine graph_put, read through kolaboro_ops2 'graph').
// Routes:
//   GET /watch/lookalikes/ (+ /<lang>/)  public feed in 8 languages (index.js calls page())
//   GET /api/x/watch/lookalikes          the feed as JSON (?dev=<slug> or ?d=<official domain> to filter)
//   GET /api/x/watch/sanctions           lists screened and developer pages with no match
//   GET /__k/kwatch-admin.js             admin CRM tab "Screening" (index.js injects it on /admin)
// Developer pages: kbx_named.js calls watchDevHtml() for the section #watch.
import { LOCALE } from './kbx_named_i18n.js';

const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
export const PATHS = /^\/api\/x\/watch\/(?:lookalikes|sanctions)$/;
export const PAGE_RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?watch\/lookalikes(\/?)$/;
const H = { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' };
const out = (o, st) => new Response(JSON.stringify(o), { status: st || 200, headers: Object.assign({ 'cache-control': 'public, max-age=900' }, H) });
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pre = l => l === 'en' ? '' : '/' + l;
function fdt(d, lang) { try { return new Intl.DateTimeFormat(LOCALE[lang] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(d + 'T00:00:00Z')); } catch (e) { return d; } }

let MEMO = null;
async function loadOne(env, name) {
  let r = null;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); } catch (e) { r = null; }
  if (!r || !r.ok) { try { r = await fetch(ORIGIN + '/data/' + name + '?v=1', { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
  return r && r.ok ? await r.json().catch(() => null) : null;
}
export async function watchData(env) {
  if (MEMO && Date.now() - MEMO.t < 600000) return MEMO.v;
  const [la, sa] = await Promise.all([loadOne(env, 'lookalikes.json'), loadOne(env, 'sanctions.json')]);
  const byUrl = new Map();
  for (const x of ((la && la.items) || [])) { if (!byUrl.has(x.url)) byUrl.set(x.url, []); byUrl.get(x.url).push(x); }
  const v = { la, sa, byUrl, clean: new Set((sa && sa.no_match) || []) };
  MEMO = { t: Date.now(), v }; return v;
}

// ------------------------------------------------------------------------------------------------ strings (8 languages)
const S = {
  en: { h: 'Lookalike websites and sanctions lists', la_h: 'Websites that look like this developer\'s',
    la_intro: 'Every day we look for new websites whose names resemble {doms}: new TLS certificates in public Certificate Transparency logs, and newly registered names with another ending, changed letters or added words. A similar name is a fact about the name only: agents, resellers and developers themselves register such names too. Pay only into the account named in your contract, after confirming it by phone.',
    item: '{d} resembles {o} ({why}).', reg: 'Registered on {d}.', noreg: 'The registry does not publish a registration date.', cert2: 'Certificate issued on {d}.', cert: 'First certificate issued on {d}.', nocert: 'No certificate found.',
    res1: 'Resolves to an address today.', res0: 'Does not resolve today.', gone: 'No longer registered on {d}.', none: 'None found in the last 12 months (checked {d}).', all: 'All lookalike websites',
    why: { hyphen: 'same name with or without a hyphen', tld: 'same name, different ending', glyph: 'letters that look alike', typo: 'one or two letters different', word: 'the name plus another word', contains: 'contains the name' },
    sa_h: 'Sanctions lists', sa_ok: 'Company name screened on {d} against {lists}: no match.', sa_note: 'A name check, not an identity check: a company can also trade under another name. Possible matches are reviewed by a person and are not published.',
    p_title: 'Lookalike websites of property developers', p_desc: 'New websites whose names resemble the website of a developer or project Kolaboro tracks, with registration and certificate dates. Updated daily.',
    p_lead: 'New websites whose names resemble the website of a developer or project we track, with the date each was registered and first given a TLS certificate. Updated daily.',
    p_cav: 'A similar name is not proof of anything. Many belong to agents, resellers, fans or the developer itself. We never open these websites: we read public DNS, registry (RDAP) and Certificate Transparency records.',
    p_count: '{n} websites found, resembling {k} of the {w} developer and project websites we watch.', p_empty: 'Nothing found in the last 12 months.', p_filter: 'Filter', p_ph: 'Type a developer, project or website',
    th: ['Website', 'Resembles', 'How', 'Registered', 'Certificate', 'Resolves today'], yes: 'yes', no: 'no', np: 'not published', nf: 'not found',
    p_mh: 'Method and data', p_m: 'Watched: the developer and project websites in our named project data whose names have at least 5 letters and are not common words. Daily: new certificates in Certificate Transparency (crt.sh), and a fourteenth of the websites checked in public DNS for registered lookalike names, so each one is swept every two weeks. Shown: names registered or first certified in the last 365 days. Left out: names that use the official website\'s own name servers, and names we link for any developer.',
    p_src: 'Sources', p_upd: 'Updated {d}.', p_pay: 'Before paying: check the payment email', p_dev: 'Developer page' },
  es: { h: 'Webs parecidas y listas de sanciones', la_h: 'Webs que se parecen a las de este promotor',
    la_intro: 'Cada día buscamos webs nuevas cuyo nombre se parece a {doms}: certificados TLS nuevos en los registros públicos de Certificate Transparency y nombres recién registrados con otra terminación, letras cambiadas o palabras añadidas. Un nombre parecido es un dato sobre el nombre, nada más: agentes, revendedores y los propios promotores también registran nombres así. Pague solo a la cuenta que figura en su contrato, después de confirmarla por teléfono.',
    item: '{d} se parece a {o} ({why}).', reg: 'Registrado el {d}.', noreg: 'El registro no publica la fecha de alta.', cert2: 'Certificado emitido el {d}.', cert: 'Primer certificado emitido el {d}.', nocert: 'No se encontró ningún certificado.',
    res1: 'Hoy resuelve a una dirección.', res0: 'Hoy no resuelve.', gone: 'Ya no está registrado el {d}.', none: 'Ninguna encontrada en los últimos 12 meses (comprobado el {d}).', all: 'Todas las webs parecidas',
    why: { hyphen: 'mismo nombre con o sin guion', tld: 'mismo nombre, otra terminación', glyph: 'letras que se parecen', typo: 'una o dos letras distintas', word: 'el nombre más otra palabra', contains: 'contiene el nombre' },
    sa_h: 'Listas de sanciones', sa_ok: 'Nombre de la empresa cotejado el {d} con {lists}: sin coincidencia.', sa_note: 'Es una comprobación del nombre, no de la identidad: una empresa también puede operar con otro nombre. Las posibles coincidencias las revisa una persona y no se publican.',
    p_title: 'Webs parecidas a las de promotores inmobiliarios', p_desc: 'Webs nuevas cuyo nombre se parece a la web de un promotor o proyecto que sigue Kolaboro, con fechas de registro y de certificado. Actualizado a diario.',
    p_lead: 'Webs nuevas cuyo nombre se parece a la web de un promotor o proyecto que seguimos, con la fecha de registro y la del primer certificado TLS. Actualizado a diario.',
    p_cav: 'Un nombre parecido no prueba nada. Muchas son de agentes, revendedores, aficionados o del propio promotor. Nunca abrimos estas webs: leemos registros públicos de DNS, del registro de dominios (RDAP) y de Certificate Transparency.',
    p_count: '{n} webs encontradas, parecidas a {k} de las {w} webs de promotores y proyectos que vigilamos.', p_empty: 'Nada encontrado en los últimos 12 meses.', p_filter: 'Filtrar', p_ph: 'Escriba un promotor, proyecto o web',
    th: ['Web', 'Se parece a', 'Cómo', 'Registrada', 'Certificado', 'Resuelve hoy'], yes: 'sí', no: 'no', np: 'no publicado', nf: 'no encontrado',
    p_mh: 'Método y datos', p_m: 'Vigiladas: las webs de promotores y proyectos de nuestros datos con nombre propio, de al menos 5 letras y que no son palabras comunes. A diario: certificados nuevos en Certificate Transparency (crt.sh) y una catorceava parte de las webs comprobada en DNS público en busca de nombres parecidos registrados, de modo que cada una se revisa cada dos semanas. Se muestran: nombres registrados o certificados por primera vez en los últimos 365 días. Se excluyen: nombres que usan los mismos servidores de nombres propios que la web oficial y nombres que enlazamos para algún promotor.',
    p_src: 'Fuentes', p_upd: 'Actualizado el {d}.', p_pay: 'Antes de pagar: compruebe el email de pago', p_dev: 'Página del promotor' },
  de: { h: 'Ähnliche Websites und Sanktionslisten', la_h: 'Websites, die denen dieses Bauträgers ähneln',
    la_intro: 'Jeden Tag suchen wir neue Websites, deren Namen {doms} ähneln: neue TLS-Zertifikate in den öffentlichen Certificate-Transparency-Logs und neu registrierte Namen mit anderer Endung, vertauschten Buchstaben oder zusätzlichen Wörtern. Ein ähnlicher Name ist nur eine Tatsache über den Namen: Makler, Wiederverkäufer und Bauträger selbst registrieren solche Namen auch. Zahlen Sie nur auf das Konto aus Ihrem Vertrag, nachdem Sie es telefonisch bestätigt haben.',
    item: '{d} ähnelt {o} ({why}).', reg: 'Registriert am {d}.', noreg: 'Die Registry veröffentlicht kein Registrierungsdatum.', cert2: 'Zertifikat ausgestellt am {d}.', cert: 'Erstes Zertifikat ausgestellt am {d}.', nocert: 'Kein Zertifikat gefunden.',
    res1: 'Löst heute auf eine Adresse auf.', res0: 'Löst heute nicht auf.', gone: 'Seit {d} nicht mehr registriert.', none: 'In den letzten 12 Monaten keine gefunden (geprüft am {d}).', all: 'Alle ähnlichen Websites',
    why: { hyphen: 'gleicher Name mit oder ohne Bindestrich', tld: 'gleicher Name, andere Endung', glyph: 'ähnlich aussehende Buchstaben', typo: 'ein oder zwei Buchstaben anders', word: 'der Name plus ein weiteres Wort', contains: 'enthält den Namen' },
    sa_h: 'Sanktionslisten', sa_ok: 'Firmenname am {d} mit {lists} abgeglichen: kein Treffer.', sa_note: 'Ein Namensabgleich, keine Identitätsprüfung: Ein Unternehmen kann auch unter einem anderen Namen auftreten. Mögliche Treffer prüft ein Mensch, sie werden nicht veröffentlicht.',
    p_title: 'Ähnliche Websites von Bauträgern', p_desc: 'Neue Websites, deren Namen der Website eines von Kolaboro verfolgten Bauträgers oder Projekts ähneln, mit Registrierungs- und Zertifikatsdatum. Täglich aktualisiert.',
    p_lead: 'Neue Websites, deren Namen der Website eines Bauträgers oder Projekts ähneln, das wir verfolgen, mit dem Datum der Registrierung und des ersten TLS-Zertifikats. Täglich aktualisiert.',
    p_cav: 'Ein ähnlicher Name beweist nichts. Viele gehören Maklern, Wiederverkäufern, Fans oder dem Bauträger selbst. Wir öffnen diese Websites nie: Wir lesen öffentliche DNS-, Registry- (RDAP) und Certificate-Transparency-Daten.',
    p_count: '{n} Websites gefunden, ähnlich wie {k} der {w} Bauträger- und Projektwebsites, die wir beobachten.', p_empty: 'In den letzten 12 Monaten nichts gefunden.', p_filter: 'Filtern', p_ph: 'Bauträger, Projekt oder Website eingeben',
    th: ['Website', 'Ähnelt', 'Wie', 'Registriert', 'Zertifikat', 'Löst heute auf'], yes: 'ja', no: 'nein', np: 'nicht veröffentlicht', nf: 'nicht gefunden',
    p_mh: 'Methode und Daten', p_m: 'Beobachtet: die Bauträger- und Projektwebsites aus unseren Projektdaten, deren Namen mindestens 5 Buchstaben haben und keine gewöhnlichen Wörter sind. Täglich: neue Zertifikate in Certificate Transparency (crt.sh) und ein Vierzehntel der Websites im öffentlichen DNS auf registrierte ähnliche Namen geprüft, sodass jede alle zwei Wochen geprüft wird. Gezeigt: Namen, die in den letzten 365 Tagen registriert oder erstmals zertifiziert wurden. Weggelassen: Namen mit den eigenen Nameservern der offiziellen Website und Namen, die wir für einen Bauträger verlinken.',
    p_src: 'Quellen', p_upd: 'Aktualisiert am {d}.', p_pay: 'Vor dem Zahlen: Zahlungs-E-Mail prüfen', p_dev: 'Bauträgerseite' },
  fr: { h: 'Sites ressemblants et listes de sanctions', la_h: 'Sites qui ressemblent à ceux de ce promoteur',
    la_intro: 'Chaque jour, nous cherchons de nouveaux sites dont le nom ressemble à {doms} : nouveaux certificats TLS dans les journaux publics Certificate Transparency, et noms récemment enregistrés avec une autre extension, des lettres changées ou des mots ajoutés. Un nom ressemblant est un fait sur le nom, rien de plus : agents, revendeurs et promoteurs eux-mêmes enregistrent aussi de tels noms. Ne payez que sur le compte indiqué dans votre contrat, après l\'avoir confirmé par téléphone.',
    item: '{d} ressemble à {o} ({why}).', reg: 'Enregistré le {d}.', noreg: 'Le registre ne publie pas de date d\'enregistrement.', cert2: 'Certificat émis le {d}.', cert: 'Premier certificat émis le {d}.', nocert: 'Aucun certificat trouvé.',
    res1: 'Résout vers une adresse aujourd\'hui.', res0: 'Ne résout pas aujourd\'hui.', gone: 'Plus enregistré le {d}.', none: 'Aucun trouvé ces 12 derniers mois (vérifié le {d}).', all: 'Tous les sites ressemblants',
    why: { hyphen: 'même nom avec ou sans tiret', tld: 'même nom, autre extension', glyph: 'lettres qui se ressemblent', typo: 'une ou deux lettres différentes', word: 'le nom plus un autre mot', contains: 'contient le nom' },
    sa_h: 'Listes de sanctions', sa_ok: 'Nom de la société comparé le {d} à {lists} : aucune correspondance.', sa_note: 'Une vérification du nom, pas de l\'identité : une société peut aussi opérer sous un autre nom. Les correspondances possibles sont examinées par une personne et ne sont pas publiées.',
    p_title: 'Sites ressemblant à ceux de promoteurs immobiliers', p_desc: 'Nouveaux sites dont le nom ressemble au site d\'un promoteur ou projet suivi par Kolaboro, avec dates d\'enregistrement et de certificat. Mis à jour chaque jour.',
    p_lead: 'Nouveaux sites dont le nom ressemble au site d\'un promoteur ou d\'un projet que nous suivons, avec la date d\'enregistrement et celle du premier certificat TLS. Mis à jour chaque jour.',
    p_cav: 'Un nom ressemblant ne prouve rien. Beaucoup appartiennent à des agents, revendeurs, fans ou au promoteur lui-même. Nous n\'ouvrons jamais ces sites : nous lisons les données publiques DNS, du registre (RDAP) et de Certificate Transparency.',
    p_count: '{n} sites trouvés, ressemblant à {k} des {w} sites de promoteurs et projets que nous surveillons.', p_empty: 'Rien trouvé ces 12 derniers mois.', p_filter: 'Filtrer', p_ph: 'Tapez un promoteur, un projet ou un site',
    th: ['Site', 'Ressemble à', 'Comment', 'Enregistré', 'Certificat', 'Résout aujourd\'hui'], yes: 'oui', no: 'non', np: 'non publié', nf: 'non trouvé',
    p_mh: 'Méthode et données', p_m: 'Surveillés : les sites de promoteurs et projets de nos données dont le nom a au moins 5 lettres et n\'est pas un mot courant. Chaque jour : nouveaux certificats dans Certificate Transparency (crt.sh), et un quatorzième des sites vérifié dans le DNS public pour des noms ressemblants enregistrés, de sorte que chacun est vérifié toutes les deux semaines. Affichés : noms enregistrés ou certifiés pour la première fois dans les 365 derniers jours. Exclus : noms utilisant les propres serveurs de noms du site officiel, et noms que nous lions à un promoteur.',
    p_src: 'Sources', p_upd: 'Mis à jour le {d}.', p_pay: 'Avant de payer : vérifiez l\'email de paiement', p_dev: 'Page du promoteur' },
  nl: { h: 'Gelijkende websites en sanctielijsten', la_h: 'Websites die lijken op die van deze ontwikkelaar',
    la_intro: 'Elke dag zoeken we nieuwe websites waarvan de naam lijkt op {doms}: nieuwe TLS-certificaten in de openbare Certificate Transparency-logs en nieuw geregistreerde namen met een andere extensie, gewijzigde letters of toegevoegde woorden. Een gelijkende naam is alleen een feit over de naam: makelaars, wederverkopers en ontwikkelaars zelf registreren zulke namen ook. Betaal alleen op de rekening uit uw contract, nadat u die telefonisch hebt bevestigd.',
    item: '{d} lijkt op {o} ({why}).', reg: 'Geregistreerd op {d}.', noreg: 'Het register publiceert geen registratiedatum.', cert2: 'Certificaat uitgegeven op {d}.', cert: 'Eerste certificaat uitgegeven op {d}.', nocert: 'Geen certificaat gevonden.',
    res1: 'Verwijst vandaag naar een adres.', res0: 'Verwijst vandaag nergens naar.', gone: 'Niet meer geregistreerd op {d}.', none: 'Geen gevonden in de afgelopen 12 maanden (gecontroleerd op {d}).', all: 'Alle gelijkende websites',
    why: { hyphen: 'zelfde naam met of zonder streepje', tld: 'zelfde naam, andere extensie', glyph: 'letters die op elkaar lijken', typo: 'een of twee letters anders', word: 'de naam plus een ander woord', contains: 'bevat de naam' },
    sa_h: 'Sanctielijsten', sa_ok: 'Bedrijfsnaam op {d} vergeleken met {lists}: geen overeenkomst.', sa_note: 'Een naamcontrole, geen identiteitscontrole: een bedrijf kan ook onder een andere naam werken. Mogelijke overeenkomsten worden door een mens bekeken en niet gepubliceerd.',
    p_title: 'Gelijkende websites van projectontwikkelaars', p_desc: 'Nieuwe websites waarvan de naam lijkt op de website van een ontwikkelaar of project dat Kolaboro volgt, met registratie- en certificaatdatum. Dagelijks bijgewerkt.',
    p_lead: 'Nieuwe websites waarvan de naam lijkt op de website van een ontwikkelaar of project dat we volgen, met de registratiedatum en de datum van het eerste TLS-certificaat. Dagelijks bijgewerkt.',
    p_cav: 'Een gelijkende naam bewijst niets. Veel zijn van makelaars, wederverkopers, fans of de ontwikkelaar zelf. We openen deze websites nooit: we lezen openbare DNS-, register- (RDAP) en Certificate Transparency-gegevens.',
    p_count: '{n} websites gevonden, gelijkend op {k} van de {w} ontwikkelaar- en projectwebsites die we volgen.', p_empty: 'Niets gevonden in de afgelopen 12 maanden.', p_filter: 'Filteren', p_ph: 'Typ een ontwikkelaar, project of website',
    th: ['Website', 'Lijkt op', 'Hoe', 'Geregistreerd', 'Certificaat', 'Verwijst vandaag'], yes: 'ja', no: 'nee', np: 'niet gepubliceerd', nf: 'niet gevonden',
    p_mh: 'Methode en gegevens', p_m: 'Gevolgd: de ontwikkelaar- en projectwebsites uit onze projectgegevens waarvan de naam minstens 5 letters heeft en geen gewoon woord is. Dagelijks: nieuwe certificaten in Certificate Transparency (crt.sh), en een veertiende van de websites in openbare DNS gecontroleerd op geregistreerde gelijkende namen, zodat elke website om de twee weken wordt nagelopen. Getoond: namen die in de afgelopen 365 dagen zijn geregistreerd of voor het eerst gecertificeerd. Weggelaten: namen die de eigen naamservers van de officiële website gebruiken, en namen die we voor een ontwikkelaar linken.',
    p_src: 'Bronnen', p_upd: 'Bijgewerkt op {d}.', p_pay: 'Voor het betalen: controleer de betalingsmail', p_dev: 'Ontwikkelaarspagina' },
  ru: { h: 'Похожие сайты и санкционные списки', la_h: 'Сайты, похожие на сайты этого застройщика',
    la_intro: 'Каждый день мы ищем новые сайты, чьи имена похожи на {doms}: новые TLS-сертификаты в публичных журналах Certificate Transparency и недавно зарегистрированные имена с другим окончанием, изменёнными буквами или добавленными словами. Похожее имя говорит только об имени: такие имена регистрируют и агенты, и перепродавцы, и сами застройщики. Платите только на счёт, указанный в договоре, подтвердив его по телефону.',
    item: '{d} похож на {o} ({why}).', reg: 'Зарегистрирован {d}.', noreg: 'Реестр не публикует дату регистрации.', cert2: 'Сертификат выпущен {d}.', cert: 'Первый сертификат выпущен {d}.', nocert: 'Сертификат не найден.',
    res1: 'Сегодня указывает на адрес.', res0: 'Сегодня не указывает на адрес.', gone: 'С {d} больше не зарегистрирован.', none: 'За последние 12 месяцев не найдено (проверено {d}).', all: 'Все похожие сайты',
    why: { hyphen: 'то же имя с дефисом или без', tld: 'то же имя, другое окончание', glyph: 'похожие буквы', typo: 'одна или две буквы отличаются', word: 'имя плюс другое слово', contains: 'содержит имя' },
    sa_h: 'Санкционные списки', sa_ok: 'Название компании сверено {d} со списками {lists}: совпадений нет.', sa_note: 'Это проверка названия, а не личности: компания может работать и под другим названием. Возможные совпадения проверяет человек, они не публикуются.',
    p_title: 'Сайты, похожие на сайты застройщиков', p_desc: 'Новые сайты, чьи имена похожи на сайт застройщика или проекта из базы Kolaboro, с датами регистрации и сертификата. Обновляется ежедневно.',
    p_lead: 'Новые сайты, чьи имена похожи на сайт застройщика или проекта, который мы отслеживаем, с датой регистрации и датой первого TLS-сертификата. Обновляется ежедневно.',
    p_cav: 'Похожее имя ничего не доказывает. Многие принадлежат агентам, перепродавцам, поклонникам или самому застройщику. Мы никогда не открываем эти сайты: мы читаем публичные данные DNS, реестров (RDAP) и Certificate Transparency.',
    p_count: 'Найдено сайтов: {n}; они похожи на {k} из {w} сайтов застройщиков и проектов, за которыми мы следим.', p_empty: 'За последние 12 месяцев ничего не найдено.', p_filter: 'Фильтр', p_ph: 'Введите застройщика, проект или сайт',
    th: ['Сайт', 'Похож на', 'Как', 'Зарегистрирован', 'Сертификат', 'Работает сегодня'], yes: 'да', no: 'нет', np: 'не публикуется', nf: 'не найден',
    p_mh: 'Метод и данные', p_m: 'Отслеживаются: сайты застройщиков и проектов из наших данных, имена которых длиной не менее 5 букв и не являются обычными словами. Ежедневно: новые сертификаты в Certificate Transparency (crt.sh), а четырнадцатая часть сайтов проверяется в публичном DNS на зарегистрированные похожие имена, так что каждый сайт проверяется раз в две недели. Показываются: имена, зарегистрированные или впервые получившие сертификат за последние 365 дней. Исключаются: имена с собственными серверами имён официального сайта и имена, которые мы связываем с каким-либо застройщиком.',
    p_src: 'Источники', p_upd: 'Обновлено {d}.', p_pay: 'Перед оплатой: проверьте письмо с реквизитами', p_dev: 'Страница застройщика' },
  zh: { h: '相似网站与制裁名单', la_h: '与该开发商网站相似的网站',
    la_intro: '我们每天查找名称与 {doms} 相似的新网站：公开证书透明度（Certificate Transparency）日志中的新 TLS 证书，以及新注册的、后缀不同、字母改动或加了词的域名。名称相似只是关于名称的事实：代理、转售商和开发商本身也会注册这类名称。只向合同中写明的账户付款，并先通过电话确认。',
    item: '{d} 与 {o} 相似（{why}）。', reg: '注册于 {d}。', noreg: '注册局未公布注册日期。', cert2: '证书签发于 {d}。', cert: '首张证书签发于 {d}。', nocert: '未找到证书。',
    res1: '今天可解析到地址。', res0: '今天无法解析。', gone: '{d} 起已不再注册。', none: '过去 12 个月内未发现（检查于 {d}）。', all: '全部相似网站',
    why: { hyphen: '同名，有无连字符', tld: '同名，后缀不同', glyph: '字形相似的字母', typo: '一两个字母不同', word: '名称加另一个词', contains: '包含该名称' },
    sa_h: '制裁名单', sa_ok: '公司名称于 {d} 与 {lists} 比对：无匹配。', sa_note: '这是名称比对，不是身份核验：公司也可能以其他名称经营。可能的匹配由人工审核，不予公布。',
    p_title: '与房地产开发商网站相似的网站', p_desc: '名称与 Kolaboro 跟踪的开发商或项目网站相似的新网站，附注册与证书日期。每日更新。',
    p_lead: '名称与我们跟踪的开发商或项目网站相似的新网站，附注册日期和首张 TLS 证书日期。每日更新。',
    p_cav: '名称相似不能证明任何事。许多属于代理、转售商、爱好者或开发商本身。我们从不打开这些网站：只读取公开的 DNS、注册局（RDAP）和证书透明度记录。',
    p_count: '共发现 {n} 个网站，与我们监测的 {w} 个开发商和项目网站中的 {k} 个相似。', p_empty: '过去 12 个月内未发现。', p_filter: '筛选', p_ph: '输入开发商、项目或网站',
    th: ['网站', '相似于', '方式', '注册', '证书', '今天可解析'], yes: '是', no: '否', np: '未公布', nf: '未找到',
    p_mh: '方法与数据', p_m: '监测对象：我们项目数据中名称至少 5 个字母且不是常用词的开发商和项目网站。每天：证书透明度（crt.sh）中的新证书，并在公共 DNS 中检查十四分之一网站的已注册相似名称，因此每个网站每两周检查一次。显示：过去 365 天内注册或首次获得证书的名称。排除：使用官方网站自有域名服务器的名称，以及我们关联到任何开发商的名称。',
    p_src: '来源', p_upd: '更新于 {d}。', p_pay: '付款前：检查付款邮件', p_dev: '开发商页面' },
  ar: { h: 'مواقع مشابهة وقوائم العقوبات', la_h: 'مواقع تشبه مواقع هذا المطوّر',
    la_intro: 'نبحث كل يوم عن مواقع جديدة تشبه أسماؤها {doms}: شهادات TLS جديدة في سجلات شفافية الشهادات (Certificate Transparency) العامة، وأسماء مسجلة حديثًا بامتداد آخر أو بأحرف مغيّرة أو بكلمات مضافة. تشابه الاسم حقيقة عن الاسم فقط: يسجّل الوكلاء والبائعون والمطوّرون أنفسهم أسماء كهذه أيضًا. ادفع فقط إلى الحساب المذكور في عقدك بعد تأكيده هاتفيًا.',
    item: '{d} يشبه {o} ({why}).', reg: 'سُجّل في {d}.', noreg: 'لا ينشر السجل تاريخ التسجيل.', cert2: 'صدرت شهادة في {d}.', cert: 'صدرت أول شهادة في {d}.', nocert: 'لم يُعثر على شهادة.',
    res1: 'يشير اليوم إلى عنوان.', res0: 'لا يشير اليوم إلى عنوان.', gone: 'لم يعد مسجلًا في {d}.', none: 'لم يُعثر على شيء خلال آخر 12 شهرًا (فُحص في {d}).', all: 'كل المواقع المشابهة',
    why: { hyphen: 'الاسم نفسه مع شرطة أو بدونها', tld: 'الاسم نفسه بامتداد مختلف', glyph: 'أحرف متشابهة الشكل', typo: 'حرف أو حرفان مختلفان', word: 'الاسم مع كلمة أخرى', contains: 'يحتوي على الاسم' },
    sa_h: 'قوائم العقوبات', sa_ok: 'قورن اسم الشركة في {d} مع {lists}: لا تطابق.', sa_note: 'هذه مقارنة للاسم لا تحقق من الهوية: قد تعمل الشركة أيضًا باسم آخر. يراجع شخصٌ التطابقات المحتملة ولا تُنشر.',
    p_title: 'مواقع تشبه مواقع المطوّرين العقاريين', p_desc: 'مواقع جديدة تشبه أسماؤها موقع مطوّر أو مشروع تتابعه Kolaboro، مع تاريخي التسجيل والشهادة. تحديث يومي.',
    p_lead: 'مواقع جديدة تشبه أسماؤها موقع مطوّر أو مشروع نتابعه، مع تاريخ التسجيل وتاريخ أول شهادة TLS. تحديث يومي.',
    p_cav: 'تشابه الاسم لا يثبت شيئًا. كثير منها لوكلاء أو بائعين أو معجبين أو للمطوّر نفسه. لا نفتح هذه المواقع أبدًا: نقرأ سجلات DNS العامة وسجلات التسجيل (RDAP) وشفافية الشهادات.',
    p_count: 'عُثر على {n} موقعًا تشبه {k} من أصل {w} موقعًا لمطوّرين ومشاريع نراقبها.', p_empty: 'لم يُعثر على شيء خلال آخر 12 شهرًا.', p_filter: 'تصفية', p_ph: 'اكتب مطوّرًا أو مشروعًا أو موقعًا',
    th: ['الموقع', 'يشبه', 'كيف', 'التسجيل', 'شهادة', 'يعمل اليوم'], yes: 'نعم', no: 'لا', np: 'غير منشور', nf: 'غير موجود',
    p_mh: 'المنهج والبيانات', p_m: 'المراقَب: مواقع المطوّرين والمشاريع في بياناتنا التي تتكون أسماؤها من 5 أحرف على الأقل وليست كلمات شائعة. يوميًا: الشهادات الجديدة في شفافية الشهادات (crt.sh)، وفحص جزء من أربعة عشر من المواقع في DNS العام بحثًا عن أسماء مشابهة مسجلة، فيُفحص كل موقع كل أسبوعين. المعروض: أسماء سُجلت أو حصلت على أول شهادة خلال آخر 365 يومًا. المستبعد: أسماء تستخدم خوادم الأسماء الخاصة بالموقع الرسمي، وأسماء نربطها بأي مطوّر.',
    p_src: 'المصادر', p_upd: 'تحديث {d}.', p_pay: 'قبل الدفع: افحص رسالة الدفع', p_dev: 'صفحة المطوّر' },
};
const t = (lang, k, v) => { const s = (S[lang] && S[lang][k] != null ? S[lang][k] : S.en[k]); return typeof s === 'string' && v ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
export const watchHeading = lang => t(lang, 'h');

const rdapUrl = d => 'https://client.rdap.org/?type=domain&object=' + encodeURIComponent(d);
const crtUrl = d => 'https://crt.sh/?q=' + encodeURIComponent(d);
const CSS = '<style id="kwatch-css">.kwa-l{list-style:none;padding:0;margin:var(--k-3,12px) 0;display:grid;gap:var(--k-3,12px)}.kwa-l li{padding:var(--k-3,12px) var(--k-4,16px);border:1px solid var(--k-line,#D5DAD8);border-radius:var(--k-r-md,10px);background:var(--k-surface,#fff);overflow-wrap:anywhere}.kwa-l b{font-weight:650}.kwa-l .kwa-m{display:block;color:var(--k-muted,#56636F);font-size:var(--k-fs-sm,15px);margin-top:4px}.kwa-l .src{margin-inline-start:6px}.kwa-sa{margin-top:var(--k-5,24px)}.kwa-sa h3,.kwa-la h3{margin:0 0 var(--k-2,8px);font-size:var(--k-fs-lg,20px)}</style>';

function itemHtml(x, lang) {
  const meta = [x.reg ? t(lang, 'reg', { d: fdt(x.reg, lang) }) : t(lang, 'noreg'), x.cert ? t(lang, x.cert_first ? 'cert' : 'cert2', { d: fdt(x.cert, lang) }) : t(lang, 'nocert'), x.gone ? t(lang, 'gone', { d: fdt(x.gone, lang) }) : t(lang, x.res ? 'res1' : 'res0')].join(' ');
  return '<li class="kfact"><b dir="ltr">' + esc(x.u || x.d) + '</b> ' + esc(t(lang, 'item', { d: '', o: x.o, why: (t(lang, 'why') || {})[x.why] || x.why }).replace(/^\s+/, '')) +
    '<span class="kwa-m">' + esc(meta) + ' <a class="src" href="' + esc(rdapUrl(x.d)) + '" rel="nofollow noopener" target="_blank">RDAP</a> <a class="src" href="' + esc(crtUrl(x.d)) + '" rel="nofollow noopener" target="_blank">crt.sh</a></span></li>';
}
const SHORT = { ofac_sdn: 'OFAC SDN', ofac_cons: 'OFAC non-SDN', uk: 'UK Sanctions List', eu: 'EU consolidated list', un: 'UN Security Council' };
function listsTxt(sa, lang) { return (sa.lists || []).filter(l => l.ok).map(l => l.name + (l.list_date ? ' (' + fdt(l.list_date, lang) + ')' : '')).join('; '); }

// developer page section: lookalikes of its websites and the sanctions screening line
export function watchDevHtml(wd, slug, lang) {
  if (!wd) return '';
  const url = '/developers/' + slug + '/', la = wd.la, sa = wd.sa;
  const doms = (la && la.w && la.w[url]) || [];
  let h = '';
  if (la && doms.length) {
    const L = (wd.byUrl.get(url) || []).slice(0, 12);
    h += '<div class="kwa-la"><h3>' + esc(t(lang, 'la_h')) + '</h3><p class="ki">' + esc(t(lang, 'la_intro', { doms: doms.slice(0, 6).join(', ') })) + '</p>' +
      (L.length ? '<ul class="kwa-l">' + L.map(x => itemHtml(x, lang)).join('') + '</ul>' : '<ul class="fl"><li class="kfact">' + esc(t(lang, 'none', { d: fdt(la.updated, lang) })) + ' <a class="src" href="/watch/lookalikes/">kolaboro.com</a></li></ul>') +
      '<p><a class="more" href="' + pre(lang) + '/watch/lookalikes/">' + esc(t(lang, 'all')) + '</a> <a class="more" href="' + pre(lang) + '/tools/payment-email-check/">' + esc(t(lang, 'p_pay')) + '</a></p></div>';
  }
  const ok = sa ? (sa.lists || []).filter(l => l.ok) : [];
  if (sa && wd.clean.has(slug) && ok.length) {
    const links = ok.map(l => '<a class="src" href="' + esc(l.page) + '" rel="noopener" target="_blank">' + esc(SHORT[l.id] || l.id) + (l.list_date ? ' (' + esc(fdt(l.list_date, lang)) + ')' : '') + '</a>').join(', ');
    h += '<div class="kwa-sa"><h3>' + esc(t(lang, 'sa_h')) + '</h3><ul class="fl"><li class="kfact">' + esc(t(lang, 'sa_ok', { d: fdt(sa.updated, lang), lists: '\u0001' })).replace('\u0001', links) + '</li></ul><p class="k-xs">' + esc(t(lang, 'sa_note')) + ' <a href="/data/sanctions.json">sanctions.json</a></p></div>';
  }
  return h ? CSS + h : '';
}

// ------------------------------------------------------------------------------------------------ public feed page
const PG_CSS = '<style id="kwatch-pg">.kwa-pg .k-phead{padding-block:var(--k-7,48px) var(--k-5,24px)}.kwa-pg h1{max-width:24ch}.kwa-pg .lead,.kwa-pg p{max-width:72ch;line-height:1.6}.kwa-pg .kwa-cav{color:var(--k-ink-2,#2F3E4B)}' +
  '.kwa-f{display:flex;flex-wrap:wrap;gap:var(--k-2,8px);align-items:center;margin:var(--k-4,16px) 0}.kwa-f input{flex:1 1 260px;min-height:44px;padding:0 12px;border:1px solid var(--k-field,#9AA5AE);border-radius:var(--k-r-sm,6px);background:var(--k-surface,#fff);color:var(--k-ink,#13222E);font:inherit}' +
  '.kwa-pg td{overflow-wrap:anywhere}.kwa-pg td a{color:var(--k-sea,#155C75)}.kwa-pg .kwa-src{padding-inline-start:20px}.kwa-pg .kwa-src li{margin:0 0 6px}</style>';
const FILTER_JS = '(function(){var i=document.getElementById("kwa-q"),rows=[].slice.call(document.querySelectorAll("#kwa-t tbody tr")),c=document.getElementById("kwa-c");if(!i)return;i.addEventListener("input",function(){var q=i.value.trim().toLowerCase(),n=0;rows.forEach(function(r){var ok=!q||r.textContent.toLowerCase().indexOf(q)>=0;r.hidden=!ok;if(ok)n++;});if(c)c.textContent=n+" / "+rows.length;});})();';
function pageBody(la, lang) {
  const items = (la && la.items) || [], k = new Set(items.map(x => x.o)).size;
  const rows = items.map(x => '<tr><td data-label="' + esc(t(lang, 'th')[0]) + '" dir="ltr"><b>' + esc(x.u || x.d) + '</b></td><td data-label="' + esc(t(lang, 'th')[1]) + '"><span dir="ltr">' + esc(x.o) + '</span>' + (x.dv ? '<br><a href="' + esc(pre(lang) + (x.url || '')) + '">' + esc(x.dv) + '</a>' : '') + '</td><td data-label="' + esc(t(lang, 'th')[2]) + '">' + esc((t(lang, 'why') || {})[x.why] || x.why) + '</td>' +
    '<td data-label="' + esc(t(lang, 'th')[3]) + '"><a href="' + esc(rdapUrl(x.d)) + '" rel="nofollow noopener" target="_blank">' + esc(x.reg ? fdt(x.reg, lang) : t(lang, 'np')) + '</a></td><td data-label="' + esc(t(lang, 'th')[4]) + '"><a href="' + esc(crtUrl(x.d)) + '" rel="nofollow noopener" target="_blank">' + esc(x.cert ? fdt(x.cert, lang) : t(lang, 'nf')) + '</a></td><td data-label="' + esc(t(lang, 'th')[5]) + '">' + esc(x.gone ? t(lang, 'gone', { d: fdt(x.gone, lang) }) : t(lang, x.res ? 'yes' : 'no')) + '</td></tr>').join('');
  const table = items.length ? '<div class="kwa-f"><label for="kwa-q">' + esc(t(lang, 'p_filter')) + '</label><input id="kwa-q" type="search" placeholder="' + esc(t(lang, 'p_ph')) + '" autocomplete="off"><span id="kwa-c" class="k-muted" aria-live="polite"></span></div>' +
    '<div class="k-table-wrap"><table class="k-table k-table--dense k-table--stack" id="kwa-t"><thead><tr>' + t(lang, 'th').map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div><script>' + FILTER_JS + '</script>'
    : '<div class="k-empty"><strong>' + esc(t(lang, 'p_empty')) + '</strong></div>';
  const srcs = ((la && la.sources) || []).map(s => '<li><a href="' + esc(s.url) + '" rel="noopener" target="_blank">' + esc(s.name) + '</a> <span class="k-muted">(' + esc(s.licence) + ')</span></li>').join('');
  return '<div class="kwa-pg"><section class="k-sec"><div class="k-wrap"><div class="k-phead"><p class="k-crumb"><a href="' + pre(lang) + '/">Kolaboro</a></p><h1>' + esc(t(lang, 'p_title')) + '</h1><p class="lead">' + esc(t(lang, 'p_lead')) + '</p><p class="kwa-cav">' + esc(t(lang, 'p_cav')) + '</p>' +
    (la ? '<p><b>' + esc(t(lang, 'p_count', { n: items.length, k, w: la.watched || 0 })) + '</b> <span class="k-muted">' + esc(t(lang, 'p_upd', { d: fdt(la.updated, lang) })) + '</span></p>' : '') + '</div>' + table + '</div></section>' +
    '<section class="k-sec"><div class="k-wrap"><h2>' + esc(t(lang, 'p_mh')) + '</h2><p>' + esc(t(lang, 'p_m')) + '</p><h3>' + esc(t(lang, 'p_src')) + '</h3><ul class="kwa-src">' + srcs + '</ul><p><a href="/api/x/watch/lookalikes">/api/x/watch/lookalikes</a> · <a href="/data/lookalikes.json">/data/lookalikes.json</a> · <a href="' + pre(lang) + '/tools/payment-email-check/">' + esc(t(lang, 'p_pay')) + '</a></p></div></section></div>';
}
export async function page(req, u, env, ctx, shell) {
  const m = u.pathname.match(PAGE_RX); if (!m || !shell) return null;
  if (!m[2]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
  const lang = m[1] || 'en', path = '/watch/lookalikes/', url = ORIGIN + pre(lang) + path;
  const wd = await watchData(env), la = wd.la;
  const sh = await shell(pre(lang) + '/how-we-score/');
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': url + '#page', url, name: t(lang, 'p_title'), description: t(lang, 'p_desc'), inLanguage: lang, dateModified: (la && la.updated) || undefined, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'Dataset', name: t(lang, 'p_title'), description: t(lang, 'p_desc'), url, isAccessibleForFree: true, dateModified: (la && la.updated) || undefined, creator: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/data/lookalikes.json' }] },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kolaboro', item: ORIGIN + pre(lang) + '/' }, { '@type': 'ListItem', position: 2, name: t(lang, 'p_title'), item: url }] }] };
  const alts = LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + path + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + path + '">';
  const tags = '<title>' + esc(t(lang, 'p_title')) + ' | Kolaboro</title><meta name="description" content="' + esc(t(lang, 'p_desc')) + '"><link rel="canonical" href="' + url + '">' + alts +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="Kolaboro"><meta property="og:title" content="' + esc(t(lang, 'p_title')) + ' | Kolaboro"><meta property="og:description" content="' + esc(t(lang, 'p_desc')) + '"><meta property="og:url" content="' + url + '"><meta name="twitter:card" content="summary">' +
    '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' + PG_CSS;
  const res = new HTMLRewriter()
    .on('html', { element(e) { e.setAttribute('lang', lang); if (lang === 'ar') e.setAttribute('dir', 'rtl'); else e.removeAttribute('dir'); } })
    .on('title', { element(e) { e.remove(); } })
    .on('meta[name="description"],meta[name="robots"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],link[rel="alternate"][hreflang]', { element(e) { e.remove(); } })
    .on('script[type="application/ld+json"]', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(pageBody(la, lang), { html: true }); } })
    .on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + path); } })
    .transform(new Response(sh.body, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
  return new Response(await res.text(), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600' } });
}

// ------------------------------------------------------------------------------------------------ JSON API
export async function handle(req, u, env) {
  const wd = await watchData(env);
  if (u.pathname === '/api/x/watch/sanctions') {
    if (!wd.sa) return out({ error: 'not_built_yet' }, 503);
    const s = u.searchParams.get('dev');
    if (s) return out({ dev: s, screened_no_match: wd.clean.has(s), updated: wd.sa.updated, lists: wd.sa.lists, note: 'false means the name was not screened (it could be a person\'s name) or is under review; it is not a finding.' });
    return out(wd.sa);
  }
  if (!wd.la) return out({ error: 'not_built_yet' }, 503);
  const dev = u.searchParams.get('dev'), d = (u.searchParams.get('d') || '').toLowerCase();
  let items = wd.la.items || [];
  if (dev) items = items.filter(x => x.url === '/developers/' + dev + '/');
  if (d) items = items.filter(x => x.o === d || x.d === d);
  return out(Object.assign({}, wd.la, { w: undefined, n: items.length, items }));
}

// ------------------------------------------------------------------------------------------------ admin CRM tab
export const ADMIN_JS = `/* kolaboro.com/admin: "Screening" tab (n19a, 9 Nov 2026). Possible sanctions-list matches of developer company names, for a person
   to review (never published), and the newest lookalike websites. Review data: the internal risk graph (RPC kolaboro_ops2 'graph', admin key). */
(function () {
  if (window.__kwadm) return; window.__kwadm = 1;
  function $(i) { return document.getElementById(i); }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function table(head, rows) { if (!rows.length) return '<p class="muted" style="margin:6px 0">Nothing to review.</p>'; return '<div class="tw"><table><tr>' + head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr>' + rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div>'; }
  function render(G, L) {
    var S = (G && G.sanctions_review) || null, h = '';
    if (!S) h += '<p class="muted">No screening uploaded yet (daily workflow kolaboro-sanctions.yml).</p>';
    else {
      h += '<p>Screened ' + esc(S.generated_at) + ': ' + S.screened + ' developer names, ' + S.no_match + ' without a possible match (published as "no match"), ' + S.not_screened_person_like + ' not screened (could be a person). Lists: ' + (S.lists || []).map(function (l) { return esc(l.id) + (l.ok ? ' ' + esc(l.list_date || '') + ' (' + l.entities + ' entities)' : ' <b style="color:#B42318">download failed</b>'); }).join(', ') + '.</p>';
      h += '<p class="muted">Possible matches are hidden from the public pages. Check each one against the official entry (programme, address, registration number) before acting; a similar name is not the same company.</p>';
      h += '<h3>Possible matches to review (' + (S.review || []).length + ')</h3>' + table(['Developer', 'Listed name', 'List', 'Score', 'Programme', 'Entry id'], [].concat.apply([], (S.review || []).map(function (r) { return r.hits.map(function (x, i) { return [i ? '' : '<a href="/developers/' + esc(r.slug) + '/" target="_blank" rel="noopener">' + esc(r.developer) + '</a>', esc(x.listed_name), esc(x.list), esc(x.score), esc(x.programme), esc(x.ref)]; }); })));
    }
    var I = (L && L.items) || [];
    h += '<h3>Newest lookalike websites (' + I.length + ' public)</h3>' + table(['Website', 'Resembles', 'How', 'Registered', 'First cert', 'Resolves'], I.slice(0, 40).map(function (x) { return [esc(x.d), esc(x.o) + (x.dv ? ' (' + esc(x.dv) + ')' : ''), esc(x.why), esc(x.reg || '-'), esc(x.cert || '-'), x.res ? 'yes' : 'no']; })) + '<p><a href="/watch/lookalikes/" target="_blank" rel="noopener">Public feed</a></p>';
    $('t-screen-body').innerHTML = h;
  }
  function load() {
    if (!window.KBADM) return; $('t-screen-body').innerHTML = '<p class="muted">Loading…</p>';
    Promise.all([window.KBADM.rpc('kolaboro_ops2', { p_key: window.KBADM.pw(), p_action: 'graph' }), fetch('/data/lookalikes.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })]).then(function (a) {
      if (a[0] && a[0].error) { $('t-screen-body').innerHTML = '<p class="muted">Could not load (' + esc(a[0].error) + ').</p>'; return; } render(a[0], a[1]);
    }).catch(function () { $('t-screen-body').innerHTML = '<p class="muted">Could not load.</p>'; });
  }
  function setup() {
    var nav = document.querySelector('nav.tabs'), main = document.querySelector('main'); if (!nav || !main || !window.KBADM) return false;
    if ($('t-screen')) return true;
    var b = document.createElement('button'); b.setAttribute('data-t', 'screen'); b.textContent = 'Screening';
    var tr = nav.querySelector('[data-t="graph"]'); nav.insertBefore(b, tr ? tr.nextSibling : null);
    var sec = document.createElement('section'); sec.id = 't-screen'; sec.className = 'hide'; sec.innerHTML = '<div id="t-screen-body"></div>'; main.appendChild(sec);
    b.onclick = function () { nav.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); }); main.querySelectorAll(':scope > section').forEach(function (s) { s.classList.toggle('hide', s !== sec); }); load(); };
    nav.querySelectorAll('button').forEach(function (x) { if (x !== b) x.addEventListener('click', function () { b.classList.remove('on'); sec.classList.add('hide'); }); });
    if (location.hash === '#screen') b.click();
    return true;
  }
  var n = 0, iv = setInterval(function () { if (setup() || ++n > 120) clearInterval(iv); }, 500);
})();
`;
