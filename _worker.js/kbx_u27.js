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
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const COI_RX = /eco\s*beach\s*city|\bequinox\b/i;
export const U27V = 'u27g';   // u27g: currency pre-selected by page language (n29i)   // bump when the client script below changes (kbx_named.js adds CACHE_V to the ?v=)
const pre = l => l === 'en' ? '' : '/' + l;
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bdi = (lang, s) => lang === 'ar' ? '<bdi>' + esc(s) + '</bdi>' : esc(s);

// ------------------------------------------------------------------------------------------------ words (server side)
const S = {
  en: { lt_h: 'Six checks at a glance', lt_permit: 'Permit', lt_company: 'Company', lt_date: 'Handover date', lt_build: 'Construction', lt_web: 'Website', lt_lists: 'Official lists',
    p_reg: 'confirmed in a register', p_pub: 'number published', p_no: 'no number published', c_reg: 'in an official register', c_legal: 'legal name published', c_no: 'no legal name found', c_nc: 'not checked yet',
    d_kept: 'date kept so far', d_done: 'completed', d_moved: 'date moved', d_late: 'completed late', d_past: 'date passed {m} mo. ago', d_pub: 'date published', d_no: 'no date published',
    b_sat: 'change seen from space', b_still: 'no change seen from space', b_dev: 'developer updates only', b_done: 'listed as completed', b_nc: 'not checked yet',
    w_yes: 'all our checks passed', w_part: 'some checks not passed', w_no: 'our checks not passed', w_nc: 'not monitored yet', l_yes: 'no match on sanctions and warning lists', l_part: 'no match on the lists screened', l_nc: 'not screened yet',
    lt_how: 'What each colour means', lt_key: 'Green: published or confirmed. Amber: partly. Red: not published or the date passed. Grey: not checked yet. Facts, not a verdict.', kf_h: 'All key facts',
    ck_h: 'Before you sign: your checklist for {co}', ck_i: 'Tick each step as you do it. Your ticks stay in this browser only.', ck_n: '{a} of {b} done', ck_r: 'Clear ticks',
    ck1: 'Find the developer company in the official company register of {co}.', ck2: 'Ask for the permit or licence number and look it up in the official register.', ck2r: 'Look the project up in {r}.',
    ck3: 'Ask who owns the land and see the title or lease document.', ck4: 'Ask where your deposit goes: an escrow account or a bank guarantee in the project\'s name.', ck5: 'Have a lawyer who does not work for the developer read the contract.',
    ck6: 'Tie each payment to a construction milestone, not to a date.', ck7: 'Check what the contract says if handover is late: penalties and refunds.', ck8: 'Add the taxes and fees of {co} to the price.',
    mp_t: 'Map of off-plan projects we track', mp_d: 'Every project we track on one map, with filters: country, handover year, permit number and transparency score. Pins only where the developer publishes an address.', mp_h1: 'Map of the projects we track',
    mp_lead: 'Projects whose developer publishes an address sit at their pin. The others are grouped at their market. Filter by country, handover year, permit and transparency score.',
    mp_co: 'Country', mp_yr: 'Handover year', mp_pm: 'Permit number', mp_sc: 'Transparency score', mp_all: 'All', mp_yr0: 'No date published', mp_pm1: 'Published', mp_pm0: 'Not published', mp_scn: '{n} or more',
    mp_load: 'Loading the map.', mp_list: 'Projects in this view', mp_src: 'Pins from the address each developer publishes (geocoded with OpenStreetMap Nominatim); market points from Natural Earth and GeoNames. Tiles © OpenStreetMap contributors.',
    up_t: 'Every update in full', up_d: 'The full text of every line of the Shipping daily bar on kolaboro.com, newest first, with a link to the page it is about.', up_h1: 'Every update, in full',
    up_lead: 'The bar at the top of every page shows one short line per update. Here is the full text of each one, newest first.', up_open: 'Open the page', bc_home: 'Kolaboro' },
  es: { lt_h: 'Seis comprobaciones de un vistazo', lt_permit: 'Permiso', lt_company: 'Empresa', lt_date: 'Fecha de entrega', lt_build: 'Obra', lt_web: 'Web', lt_lists: 'Listas oficiales',
    p_reg: 'confirmado en un registro', p_pub: 'número publicado', p_no: 'sin número publicado', c_reg: 'en un registro oficial', c_legal: 'razón social publicada', c_no: 'sin razón social', c_nc: 'aún sin comprobar',
    d_kept: 'fecha mantenida hasta hoy', d_done: 'terminado', d_moved: 'fecha cambiada', d_late: 'terminado con retraso', d_past: 'fecha vencida hace {m} meses', d_pub: 'fecha publicada', d_no: 'sin fecha publicada',
    b_sat: 'cambios vistos desde el satélite', b_still: 'sin cambios vistos desde el satélite', b_dev: 'solo avances del promotor', b_done: 'figura como terminado', b_nc: 'aún sin comprobar',
    w_yes: 'pasa todas nuestras pruebas', w_part: 'no pasa alguna prueba', w_no: 'no pasa nuestras pruebas', w_nc: 'aún sin vigilar', l_yes: 'sin coincidencias en sanciones ni avisos', l_part: 'sin coincidencias en las listas revisadas', l_nc: 'aún sin revisar',
    lt_how: 'Qué significa cada color', lt_key: 'Verde: publicado o confirmado. Ámbar: en parte. Rojo: no publicado o fecha vencida. Gris: aún sin comprobar. Son hechos, no un veredicto.', kf_h: 'Todos los datos clave',
    ck_h: 'Antes de firmar: tu lista para {co}', ck_i: 'Marca cada paso cuando lo hagas. Tus marcas se quedan solo en este navegador.', ck_n: '{a} de {b} hechos', ck_r: 'Borrar marcas',
    ck1: 'Busca la empresa promotora en el registro mercantil oficial de {co}.', ck2: 'Pide el número de permiso o licencia y búscalo en el registro oficial.', ck2r: 'Busca el proyecto en {r}.',
    ck3: 'Pregunta quién es el dueño del terreno y pide ver la escritura o el contrato de arrendamiento.', ck4: 'Pregunta adónde va tu señal: una cuenta de garantía (escrow) o un aval bancario a nombre del proyecto.', ck5: 'Que un abogado que no trabaje para el promotor lea el contrato.',
    ck6: 'Vincula cada pago a un hito de obra, no a una fecha.', ck7: 'Mira qué dice el contrato si la entrega se retrasa: penalizaciones y devoluciones.', ck8: 'Suma al precio los impuestos y gastos de {co}.',
    mp_t: 'Mapa de proyectos sobre plano que seguimos', mp_d: 'Todos los proyectos que seguimos en un mapa, con filtros: país, año de entrega, número de permiso y puntuación de transparencia. Chinchetas solo donde el promotor publica una dirección.', mp_h1: 'Mapa de los proyectos que seguimos',
    mp_lead: 'Los proyectos cuyo promotor publica una dirección aparecen en su ubicación. Los demás se agrupan en su mercado. Filtra por país, año de entrega, permiso y puntuación de transparencia.',
    mp_co: 'País', mp_yr: 'Año de entrega', mp_pm: 'Número de permiso', mp_sc: 'Puntuación de transparencia', mp_all: 'Todos', mp_yr0: 'Sin fecha publicada', mp_pm1: 'Publicado', mp_pm0: 'No publicado', mp_scn: '{n} o más',
    mp_load: 'Cargando el mapa.', mp_list: 'Proyectos en esta vista', mp_src: 'Ubicaciones a partir de la dirección que publica cada promotor (geocodificada con OpenStreetMap Nominatim); puntos de mercado de Natural Earth y GeoNames. Mapa © colaboradores de OpenStreetMap.',
    up_t: 'Todas las novedades completas', up_d: 'El texto completo de cada línea de la barra de novedades de kolaboro.com, de la más reciente a la más antigua, con enlace a la página de la que trata.', up_h1: 'Todas las novedades, completas',
    up_lead: 'La barra de arriba muestra una línea corta por novedad. Aquí está el texto completo de cada una, de la más reciente a la más antigua.', up_open: 'Abrir la página', bc_home: 'Kolaboro' },
  fr: { lt_h: 'Six vérifications en un coup d’œil', lt_permit: 'Permis', lt_company: 'Société', lt_date: 'Date de livraison', lt_build: 'Chantier', lt_web: 'Site web', lt_lists: 'Listes officielles',
    p_reg: 'confirmé dans un registre', p_pub: 'numéro publié', p_no: 'aucun numéro publié', c_reg: 'dans un registre officiel', c_legal: 'raison sociale publiée', c_no: 'aucune raison sociale', c_nc: 'pas encore vérifié',
    d_kept: 'date tenue à ce jour', d_done: 'terminé', d_moved: 'date déplacée', d_late: 'terminé en retard', d_past: 'date dépassée depuis {m} mois', d_pub: 'date publiée', d_no: 'aucune date publiée',
    b_sat: 'changements vus par satellite', b_still: 'aucun changement vu par satellite', b_dev: 'nouvelles du promoteur seulement', b_done: 'indiqué comme terminé', b_nc: 'pas encore vérifié',
    w_yes: 'tous nos contrôles réussis', w_part: 'certains contrôles non réussis', w_no: 'nos contrôles non réussis', w_nc: 'pas encore surveillé', l_yes: 'aucune correspondance sur les listes de sanctions et d’alertes', l_part: 'aucune correspondance sur les listes contrôlées', l_nc: 'pas encore contrôlé',
    lt_how: 'Ce que signifie chaque couleur', lt_key: 'Vert : publié ou confirmé. Orange : en partie. Rouge : non publié ou date dépassée. Gris : pas encore vérifié. Des faits, pas un verdict.', kf_h: 'Tous les faits clés',
    ck_h: 'Avant de signer : votre liste pour {co}', ck_i: 'Cochez chaque étape une fois faite. Vos coches restent uniquement dans ce navigateur.', ck_n: '{a} sur {b} faites', ck_r: 'Effacer les coches',
    ck1: 'Trouvez la société du promoteur dans le registre officiel des sociétés de {co}.', ck2: 'Demandez le numéro de permis ou de licence et vérifiez-le dans le registre officiel.', ck2r: 'Cherchez le projet dans {r}.',
    ck3: 'Demandez à qui appartient le terrain et consultez le titre ou le bail.', ck4: 'Demandez où va votre acompte : un compte séquestre ou une garantie bancaire au nom du projet.', ck5: 'Faites lire le contrat par un avocat qui ne travaille pas pour le promoteur.',
    ck6: 'Liez chaque paiement à une étape du chantier, pas à une date.', ck7: 'Vérifiez ce que prévoit le contrat en cas de retard de livraison : pénalités et remboursements.', ck8: 'Ajoutez au prix les taxes et frais de {co}.',
    mp_t: 'Carte des projets sur plan que nous suivons', mp_d: 'Tous les projets que nous suivons sur une carte, avec filtres : pays, année de livraison, numéro de permis et score de transparence. Des repères seulement là où le promoteur publie une adresse.', mp_h1: 'Carte des projets que nous suivons',
    mp_lead: 'Les projets dont le promoteur publie une adresse figurent à leur emplacement. Les autres sont regroupés sur leur marché. Filtrez par pays, année de livraison, permis et score de transparence.',
    mp_co: 'Pays', mp_yr: 'Année de livraison', mp_pm: 'Numéro de permis', mp_sc: 'Score de transparence', mp_all: 'Tous', mp_yr0: 'Aucune date publiée', mp_pm1: 'Publié', mp_pm0: 'Non publié', mp_scn: '{n} ou plus',
    mp_load: 'Chargement de la carte.', mp_list: 'Projets dans cette vue', mp_src: 'Emplacements tirés de l’adresse publiée par chaque promoteur (géocodée avec OpenStreetMap Nominatim) ; points de marché de Natural Earth et GeoNames. Fond de carte © contributeurs OpenStreetMap.',
    up_t: 'Toutes les nouveautés en entier', up_d: 'Le texte complet de chaque ligne du bandeau des nouveautés de kolaboro.com, de la plus récente à la plus ancienne, avec un lien vers la page concernée.', up_h1: 'Toutes les nouveautés, en entier',
    up_lead: 'Le bandeau en haut de chaque page affiche une ligne courte par nouveauté. Voici le texte complet de chacune, de la plus récente à la plus ancienne.', up_open: 'Ouvrir la page', bc_home: 'Kolaboro' },
  de: { lt_h: 'Sechs Prüfungen auf einen Blick', lt_permit: 'Genehmigung', lt_company: 'Firma', lt_date: 'Übergabetermin', lt_build: 'Bau', lt_web: 'Website', lt_lists: 'Amtliche Listen',
    p_reg: 'in einem Register bestätigt', p_pub: 'Nummer veröffentlicht', p_no: 'keine Nummer veröffentlicht', c_reg: 'in einem amtlichen Register', c_legal: 'Firmenname veröffentlicht', c_no: 'kein Firmenname gefunden', c_nc: 'noch nicht geprüft',
    d_kept: 'Termin bisher gehalten', d_done: 'fertiggestellt', d_moved: 'Termin verschoben', d_late: 'verspätet fertiggestellt', d_past: 'Termin seit {m} Mon. überschritten', d_pub: 'Termin veröffentlicht', d_no: 'kein Termin veröffentlicht',
    b_sat: 'Veränderung aus dem All sichtbar', b_still: 'keine Veränderung aus dem All sichtbar', b_dev: 'nur Meldungen des Bauträgers', b_done: 'als fertig geführt', b_nc: 'noch nicht geprüft',
    w_yes: 'alle unsere Prüfungen bestanden', w_part: 'einige Prüfungen nicht bestanden', w_no: 'unsere Prüfungen nicht bestanden', w_nc: 'noch nicht überwacht', l_yes: 'kein Treffer auf Sanktions- und Warnlisten', l_part: 'kein Treffer auf den geprüften Listen', l_nc: 'noch nicht abgeglichen',
    lt_how: 'Was jede Farbe bedeutet', lt_key: 'Grün: veröffentlicht oder bestätigt. Gelb: teilweise. Rot: nicht veröffentlicht oder Termin überschritten. Grau: noch nicht geprüft. Fakten, kein Urteil.', kf_h: 'Alle wichtigen Fakten',
    ck_h: 'Vor der Unterschrift: Ihre Checkliste für {co}', ck_i: 'Haken Sie jeden Schritt ab, sobald er erledigt ist. Ihre Haken bleiben nur in diesem Browser.', ck_n: '{a} von {b} erledigt', ck_r: 'Haken löschen',
    ck1: 'Suchen Sie die Firma des Bauträgers im amtlichen Handelsregister von {co}.', ck2: 'Fragen Sie nach der Genehmigungs- oder Lizenznummer und prüfen Sie sie im amtlichen Register.', ck2r: 'Suchen Sie das Projekt in {r}.',
    ck3: 'Fragen Sie, wem das Grundstück gehört, und lassen Sie sich den Titel oder Pachtvertrag zeigen.', ck4: 'Fragen Sie, wohin Ihre Anzahlung geht: ein Treuhandkonto oder eine Bankbürgschaft auf den Namen des Projekts.', ck5: 'Lassen Sie den Vertrag von einem Anwalt lesen, der nicht für den Bauträger arbeitet.',
    ck6: 'Knüpfen Sie jede Zahlung an einen Baufortschritt, nicht an ein Datum.', ck7: 'Prüfen Sie, was der Vertrag bei verspäteter Übergabe vorsieht: Vertragsstrafen und Rückzahlung.', ck8: 'Rechnen Sie die Steuern und Gebühren in {co} zum Preis hinzu.',
    mp_t: 'Karte der Off-Plan-Projekte, die wir verfolgen', mp_d: 'Alle Projekte, die wir verfolgen, auf einer Karte mit Filtern: Land, Übergabejahr, Genehmigungsnummer und Transparenzwert. Pins nur, wo der Bauträger eine Adresse veröffentlicht.', mp_h1: 'Karte der Projekte, die wir verfolgen',
    mp_lead: 'Projekte, deren Bauträger eine Adresse veröffentlicht, stehen an ihrem Ort. Die übrigen sind an ihrem Markt gebündelt. Filtern nach Land, Übergabejahr, Genehmigung und Transparenzwert.',
    mp_co: 'Land', mp_yr: 'Übergabejahr', mp_pm: 'Genehmigungsnummer', mp_sc: 'Transparenzwert', mp_all: 'Alle', mp_yr0: 'Kein Termin veröffentlicht', mp_pm1: 'Veröffentlicht', mp_pm0: 'Nicht veröffentlicht', mp_scn: '{n} oder mehr',
    mp_load: 'Karte wird geladen.', mp_list: 'Projekte in dieser Ansicht', mp_src: 'Orte nach der vom Bauträger veröffentlichten Adresse (geokodiert mit OpenStreetMap Nominatim); Marktpunkte aus Natural Earth und GeoNames. Karte © OpenStreetMap-Mitwirkende.',
    up_t: 'Alle Neuerungen im vollen Wortlaut', up_d: 'Der volle Text jeder Zeile der Neuerungsleiste von kolaboro.com, die neueste zuerst, mit Link zur betreffenden Seite.', up_h1: 'Alle Neuerungen im vollen Wortlaut',
    up_lead: 'Die Leiste oben auf jeder Seite zeigt pro Neuerung eine kurze Zeile. Hier steht der volle Text jeder einzelnen, die neueste zuerst.', up_open: 'Seite öffnen', bc_home: 'Kolaboro' },
  nl: { lt_h: 'Zes controles in één oogopslag', lt_permit: 'Vergunning', lt_company: 'Bedrijf', lt_date: 'Opleverdatum', lt_build: 'Bouw', lt_web: 'Website', lt_lists: 'Officiële lijsten',
    p_reg: 'bevestigd in een register', p_pub: 'nummer gepubliceerd', p_no: 'geen nummer gepubliceerd', c_reg: 'in een officieel register', c_legal: 'juridische naam gepubliceerd', c_no: 'geen juridische naam gevonden', c_nc: 'nog niet gecontroleerd',
    d_kept: 'datum tot nu toe gehaald', d_done: 'opgeleverd', d_moved: 'datum verschoven', d_late: 'te laat opgeleverd', d_past: 'datum {m} mnd. verstreken', d_pub: 'datum gepubliceerd', d_no: 'geen datum gepubliceerd',
    b_sat: 'verandering gezien vanuit de ruimte', b_still: 'geen verandering gezien vanuit de ruimte', b_dev: 'alleen berichten van de ontwikkelaar', b_done: 'staat als opgeleverd', b_nc: 'nog niet gecontroleerd',
    w_yes: 'alle controles doorstaan', w_part: 'niet alle controles doorstaan', w_no: 'controles niet doorstaan', w_nc: 'nog niet gevolgd', l_yes: 'geen treffer op sanctie- en waarschuwingslijsten', l_part: 'geen treffer op de gecontroleerde lijsten', l_nc: 'nog niet gecontroleerd',
    lt_how: 'Wat elke kleur betekent', lt_key: 'Groen: gepubliceerd of bevestigd. Oranje: deels. Rood: niet gepubliceerd of datum verstreken. Grijs: nog niet gecontroleerd. Feiten, geen oordeel.', kf_h: 'Alle kernfeiten',
    ck_h: 'Voor u tekent: uw checklist voor {co}', ck_i: 'Vink elke stap af zodra u hem hebt gedaan. Uw vinkjes blijven alleen in deze browser.', ck_n: '{a} van {b} gedaan', ck_r: 'Vinkjes wissen',
    ck1: 'Zoek het bedrijf van de ontwikkelaar op in het officiële handelsregister van {co}.', ck2: 'Vraag het vergunnings- of licentienummer en zoek het op in het officiële register.', ck2r: 'Zoek het project op in {r}.',
    ck3: 'Vraag wie de grond bezit en bekijk de eigendomsakte of het pachtcontract.', ck4: 'Vraag waar uw aanbetaling naartoe gaat: een derdenrekening (escrow) of een bankgarantie op naam van het project.', ck5: 'Laat het contract lezen door een advocaat die niet voor de ontwikkelaar werkt.',
    ck6: 'Koppel elke betaling aan een bouwfase, niet aan een datum.', ck7: 'Kijk wat het contract zegt als de oplevering te laat is: boetes en terugbetaling.', ck8: 'Tel de belastingen en kosten in {co} bij de prijs op.',
    mp_t: 'Kaart van de nieuwbouwprojecten die we volgen', mp_d: 'Alle projecten die we volgen op één kaart, met filters: land, opleverjaar, vergunningsnummer en transparantiescore. Spelden alleen waar de ontwikkelaar een adres publiceert.', mp_h1: 'Kaart van de projecten die we volgen',
    mp_lead: 'Projecten waarvan de ontwikkelaar een adres publiceert, staan op hun plek. De andere zijn gegroepeerd bij hun markt. Filter op land, opleverjaar, vergunning en transparantiescore.',
    mp_co: 'Land', mp_yr: 'Opleverjaar', mp_pm: 'Vergunningsnummer', mp_sc: 'Transparantiescore', mp_all: 'Alle', mp_yr0: 'Geen datum gepubliceerd', mp_pm1: 'Gepubliceerd', mp_pm0: 'Niet gepubliceerd', mp_scn: '{n} of meer',
    mp_load: 'De kaart wordt geladen.', mp_list: 'Projecten in deze weergave', mp_src: 'Plekken op basis van het adres dat elke ontwikkelaar publiceert (gegeocodeerd met OpenStreetMap Nominatim); marktpunten uit Natural Earth en GeoNames. Kaart © OpenStreetMap-bijdragers.',
    up_t: 'Alle updates voluit', up_d: 'De volledige tekst van elke regel van de updatebalk van kolaboro.com, nieuwste eerst, met een link naar de pagina waarover hij gaat.', up_h1: 'Alle updates, voluit',
    up_lead: 'De balk bovenaan elke pagina toont één korte regel per update. Hier staat de volledige tekst van elke update, nieuwste eerst.', up_open: 'Pagina openen', bc_home: 'Kolaboro' },
  ru: { lt_h: 'Шесть проверок коротко', lt_permit: 'Разрешение', lt_company: 'Компания', lt_date: 'Срок сдачи', lt_build: 'Стройка', lt_web: 'Сайт', lt_lists: 'Официальные списки',
    p_reg: 'подтверждено в реестре', p_pub: 'номер опубликован', p_no: 'номер не опубликован', c_reg: 'есть в официальном реестре', c_legal: 'юридическое название опубликовано', c_no: 'юридическое название не найдено', c_nc: 'ещё не проверено',
    d_kept: 'срок пока соблюдается', d_done: 'сдан', d_moved: 'срок переносили', d_late: 'сдан с опозданием', d_past: 'срок прошёл {m} мес. назад', d_pub: 'срок опубликован', d_no: 'срок не опубликован',
    b_sat: 'изменения видны со спутника', b_still: 'со спутника изменений не видно', b_dev: 'только новости застройщика', b_done: 'указан как сданный', b_nc: 'ещё не проверено',
    w_yes: 'все наши проверки пройдены', w_part: 'не все проверки пройдены', w_no: 'наши проверки не пройдены', w_nc: 'пока не отслеживается', l_yes: 'нет совпадений в санкционных и предупредительных списках', l_part: 'нет совпадений в проверенных списках', l_nc: 'ещё не сверено',
    lt_how: 'Что означает каждый цвет', lt_key: 'Зелёный: опубликовано или подтверждено. Жёлтый: частично. Красный: не опубликовано или срок прошёл. Серый: ещё не проверено. Это факты, а не оценка.', kf_h: 'Все ключевые факты',
    ck_h: 'Перед подписанием: ваш список для страны {co}', ck_i: 'Отмечайте каждый шаг, когда он сделан. Отметки хранятся только в этом браузере.', ck_n: 'Сделано {a} из {b}', ck_r: 'Снять отметки',
    ck1: 'Найдите компанию застройщика в официальном реестре компаний страны {co}.', ck2: 'Запросите номер разрешения или лицензии и проверьте его в официальном реестре.', ck2r: 'Найдите проект в реестре {r}.',
    ck3: 'Узнайте, кому принадлежит земля, и посмотрите документ о праве собственности или аренде.', ck4: 'Узнайте, куда пойдёт задаток: на эскроу-счёт или под банковскую гарантию на имя проекта.', ck5: 'Пусть договор прочитает юрист, который не работает на застройщика.',
    ck6: 'Привяжите каждый платёж к этапу стройки, а не к дате.', ck7: 'Проверьте, что сказано в договоре на случай задержки сдачи: штрафы и возврат денег.', ck8: 'Прибавьте к цене налоги и сборы страны {co}.',
    mp_t: 'Карта строящихся проектов, которые мы отслеживаем', mp_d: 'Все проекты, которые мы отслеживаем, на одной карте с фильтрами: страна, год сдачи, номер разрешения и оценка прозрачности. Метки только там, где застройщик публикует адрес.', mp_h1: 'Карта проектов, которые мы отслеживаем',
    mp_lead: 'Проекты, чей застройщик публикует адрес, стоят на своём месте. Остальные собраны в точке своего рынка. Фильтры: страна, год сдачи, разрешение и оценка прозрачности.',
    mp_co: 'Страна', mp_yr: 'Год сдачи', mp_pm: 'Номер разрешения', mp_sc: 'Оценка прозрачности', mp_all: 'Все', mp_yr0: 'Срок не опубликован', mp_pm1: 'Опубликован', mp_pm0: 'Не опубликован', mp_scn: '{n} и выше',
    mp_load: 'Карта загружается.', mp_list: 'Проекты в этой области', mp_src: 'Места по адресу, который публикует застройщик (геокодирование OpenStreetMap Nominatim); точки рынков из Natural Earth и GeoNames. Карта © участники OpenStreetMap.',
    up_t: 'Все обновления полностью', up_d: 'Полный текст каждой строки ленты обновлений kolaboro.com, сначала новые, со ссылкой на страницу, о которой идёт речь.', up_h1: 'Все обновления полностью',
    up_lead: 'Лента вверху каждой страницы показывает по короткой строке на обновление. Здесь полный текст каждого, сначала новые.', up_open: 'Открыть страницу', bc_home: 'Kolaboro' },
  zh: { lt_h: '六项检查一览', lt_permit: '许可', lt_company: '公司', lt_date: '交付日期', lt_build: '施工', lt_web: '网站', lt_lists: '官方名单',
    p_reg: '已在登记册确认', p_pub: '已公布编号', p_no: '未公布编号', c_reg: '在官方登记册中', c_legal: '已公布法定名称', c_no: '未找到法定名称', c_nc: '尚未核查',
    d_kept: '至今未改期', d_done: '已完工', d_moved: '日期已改', d_late: '延期完工', d_past: '已过期 {m} 个月', d_pub: '已公布日期', d_no: '未公布日期',
    b_sat: '卫星可见变化', b_still: '卫星未见变化', b_dev: '仅有开发商的进度消息', b_done: '列为已完工', b_nc: '尚未核查',
    w_yes: '通过我们全部检查', w_part: '部分检查未通过', w_no: '未通过我们的检查', w_nc: '尚未监测', l_yes: '制裁和警示名单均无匹配', l_part: '已筛查名单无匹配', l_nc: '尚未筛查',
    lt_how: '各颜色的含义', lt_key: '绿色：已公布或已确认。琥珀色：部分。红色：未公布或日期已过。灰色：尚未核查。这些是事实，不是结论。', kf_h: '全部关键信息',
    ck_h: '签约之前：{co}购房清单', ck_i: '每完成一步就勾选。勾选只保存在本浏览器中。', ck_n: '已完成 {a}/{b}', ck_r: '清除勾选',
    ck1: '在{co}官方公司登记册中查找开发商公司。', ck2: '索取许可证或执照编号，并在官方登记册中核对。', ck2r: '在{r}中查找该项目。',
    ck3: '询问土地归谁所有，并查看产权证或租约文件。', ck4: '询问定金去向：以项目名义开立的托管账户或银行保函。', ck5: '请一位不为开发商工作的律师审阅合同。',
    ck6: '让每笔付款对应一个施工节点，而不是一个日期。', ck7: '查看合同对延期交付的约定：违约金和退款。', ck8: '把{co}的税费加到房价上。',
    mp_t: '我们追踪的期房项目地图', mp_d: '我们追踪的全部项目都在一张地图上，可按国家、交付年份、许可编号和透明度评分筛选。只有开发商公布地址的项目才有定位点。', mp_h1: '我们追踪的项目地图',
    mp_lead: '开发商公布了地址的项目显示在其位置上，其余项目汇总在所属市场。可按国家、交付年份、许可和透明度评分筛选。',
    mp_co: '国家', mp_yr: '交付年份', mp_pm: '许可编号', mp_sc: '透明度评分', mp_all: '全部', mp_yr0: '未公布日期', mp_pm1: '已公布', mp_pm0: '未公布', mp_scn: '{n} 及以上',
    mp_load: '地图加载中。', mp_list: '此视图中的项目', mp_src: '位置依据开发商公布的地址（使用 OpenStreetMap Nominatim 地理编码）；市场点来自 Natural Earth 和 GeoNames。地图 © OpenStreetMap 贡献者。',
    up_t: '全部更新全文', up_d: 'kolaboro.com 更新栏每一条的全文，按时间倒序，并链接到相关页面。', up_h1: '全部更新全文',
    up_lead: '每个页面顶部的更新栏每条只显示一行短句。这里是每条更新的全文，最新的在前。', up_open: '打开页面', bc_home: 'Kolaboro' },
  ar: { lt_h: 'ستة فحوص في لمحة', lt_permit: 'الترخيص', lt_company: 'الشركة', lt_date: 'موعد التسليم', lt_build: 'البناء', lt_web: 'الموقع الإلكتروني', lt_lists: 'القوائم الرسمية',
    p_reg: 'مؤكَّد في سجل', p_pub: 'الرقم منشور', p_no: 'لا رقم منشور', c_reg: 'مقيدة في سجل رسمي', c_legal: 'الاسم القانوني منشور', c_no: 'لم نجد اسمًا قانونيًا', c_nc: 'لم يُفحص بعد',
    d_kept: 'الموعد محترم حتى الآن', d_done: 'مكتمل', d_moved: 'تغيّر الموعد', d_late: 'اكتمل متأخرًا', d_past: 'انقضى الموعد (عدد الأشهر: {m})', d_pub: 'الموعد منشور', d_no: 'لا موعد منشور',
    b_sat: 'تغيّر مرئي من الفضاء', b_still: 'لا تغيّر مرئيًا من الفضاء', b_dev: 'أخبار المطوّر فقط', b_done: 'مُدرج كمكتمل', b_nc: 'لم يُفحص بعد',
    w_yes: 'اجتاز كل فحوصنا', w_part: 'لم يجتز بعض الفحوص', w_no: 'لم يجتز فحوصنا', w_nc: 'غير مُراقَب بعد', l_yes: 'لا تطابق في قوائم العقوبات والتحذيرات', l_part: 'لا تطابق في القوائم التي فُحصت', l_nc: 'لم يُفحص بعد',
    lt_how: 'ماذا يعني كل لون', lt_key: 'الأخضر: منشور أو مؤكَّد. الكهرماني: جزئيًا. الأحمر: غير منشور أو انقضى الموعد. الرمادي: لم يُفحص بعد. هذه حقائق وليست حكمًا.', kf_h: 'كل الحقائق الأساسية',
    ck_h: 'قبل التوقيع: قائمتك الخاصة بـ{co}', ck_i: 'ضع علامة على كل خطوة عند إنجازها. تبقى علاماتك في هذا المتصفح فقط.', ck_n: 'أُنجز {a} من {b}', ck_r: 'مسح العلامات',
    ck1: 'ابحث عن شركة المطوّر في السجل التجاري الرسمي في {co}.', ck2: 'اطلب رقم الترخيص أو الرخصة وتحقق منه في السجل الرسمي.', ck2r: 'ابحث عن المشروع في {r}.',
    ck3: 'اسأل عن مالك الأرض واطلب الاطلاع على سند الملكية أو عقد الإيجار.', ck4: 'اسأل أين تذهب دفعتك المقدّمة: حساب ضمان (إسكرو) أو ضمان بنكي باسم المشروع.', ck5: 'اطلب من محامٍ لا يعمل لدى المطوّر أن يقرأ العقد.',
    ck6: 'اربط كل دفعة بمرحلة من مراحل البناء، لا بتاريخ.', ck7: 'تحقّق مما ينص عليه العقد إذا تأخر التسليم: الغرامات والاسترداد.', ck8: 'أضف إلى السعر الضرائب والرسوم في {co}.',
    mp_t: 'خريطة مشاريع البيع على الخارطة التي نتابعها', mp_d: 'كل المشاريع التي نتابعها على خريطة واحدة مع مرشحات: الدولة وسنة التسليم ورقم الترخيص ودرجة الشفافية. الدبابيس فقط حيث ينشر المطوّر عنوانًا.', mp_h1: 'خريطة المشاريع التي نتابعها',
    mp_lead: 'المشاريع التي ينشر مطوّرها عنوانًا تظهر في موقعها. والبقية مجمّعة عند سوقها. صفِّ حسب الدولة وسنة التسليم والترخيص ودرجة الشفافية.',
    mp_co: 'الدولة', mp_yr: 'سنة التسليم', mp_pm: 'رقم الترخيص', mp_sc: 'درجة الشفافية', mp_all: 'الكل', mp_yr0: 'لا موعد منشور', mp_pm1: 'منشور', mp_pm0: 'غير منشور', mp_scn: '{n} فأكثر',
    mp_load: 'جارٍ تحميل الخريطة.', mp_list: 'المشاريع في هذا العرض', mp_src: 'المواقع من العنوان الذي ينشره كل مطوّر (ترميز جغرافي عبر OpenStreetMap Nominatim)؛ نقاط الأسواق من Natural Earth وGeoNames. الخريطة © مساهمو OpenStreetMap.',
    up_t: 'كل التحديثات كاملة', up_d: 'النص الكامل لكل سطر في شريط التحديثات على kolaboro.com، الأحدث أولًا، مع رابط إلى الصفحة المعنية.', up_h1: 'كل التحديثات، كاملة',
    up_lead: 'يعرض الشريط أعلى كل صفحة سطرًا قصيرًا لكل تحديث. هنا النص الكامل لكل تحديث، الأحدث أولًا.', up_open: 'افتح الصفحة', bc_home: 'Kolaboro' }
};
export const t27 = (lang, k, v) => { let s = (S[lang] && S[lang][k] != null) ? S[lang][k] : S.en[k]; if (v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b); return s; };

// ------------------------------------------------------------------------------------------------ project page parts
// a folded section: the heading is the summary, everything else is inside (in the HTML, closed). "lead" (optional) is one short
// line shown under the heading while folded (for a dated, sourced lead sentence).
export const secZ = (id, h, inner, lead) => '<section class="ks kz" id="' + id + '"><details class="kz-d"><summary class="kz-s"><h2>' + h + '</h2>' + (lead ? '<p class="kz-l">' + lead + '</p>' : '') + '</summary>' + inner + '</details></section>';

// the six-check traffic light, from fields we already hold: transparency ledger items (kbx_tr.js), the case's satellite line and
// stage, overdue months. Each check links to its section (folded sections open on the link). Colours carry words too.
export function lightHtml(lang, o) {
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
  return '<div class="klt" id="checks6" data-u27="' + esc(JSON.stringify(o.data || {})) + '"><p class="klt-h">' + esc(t27(lang, 'lt_h')) + '</p><ul class="klt-l">' +
    P.map(([k, sid, s]) => '<li class="klt-' + s[0] + '"><a href="#' + sid + '"><i aria-hidden="true"></i><b>' + esc(t27(lang, 'lt_' + k)) + '</b><span>' + esc(t27(lang, s[1], s[2])) + '</span></a></li>').join('') +
    '</ul><details class="klt-k"><summary>' + esc(t27(lang, 'lt_how')) + '</summary>' + keyHtml(lang) + '</details></div>';
}

// n28b: the colour key as four rows, each with its own dot, then "facts, not a verdict" (split from the one sentence each language has)
function keyHtml(lang) {
  const P = String(t27(lang, 'lt_key')).split(/(?<=[.。])\s*/).map(x => x.trim()).filter(Boolean);
  if (P.length < 5) return '<p>' + esc(t27(lang, 'lt_key')) + '</p>';
  return '<ul class="klt-kl">' + ['ok', 'part', 'no', 'nc'].map((k, i) => '<li class="klt-' + k + '"><i aria-hidden="true"></i>' + esc(P[i]) + '</li>').join('') + '</ul><p>' + esc(P.slice(4).join(' ')) + '</p>';
}

// the "before you sign" checklist for the project's country: steps that apply everywhere, plus the official registers of that
// market as published on /registers/ (kbx_facets.js regFor). Ticks are kept in this browser only (localStorage, try/catch).
export function checklistHtml(lang, o) {
  const co = o.co || '', L = [];
  L.push(esc(t27(lang, 'ck1', { co: '\u0000' })).replace('\u0000', bdi(lang, co)));
  if ((o.regs || []).length) for (const r of o.regs) L.push(esc(t27(lang, 'ck2r', { r: '\u0000' })).replace('\u0000', '<a href="' + esc(r.u) + '" rel="noopener nofollow" target="_blank"><bdi>' + esc(r.n) + '</bdi></a>'));
  else L.push(esc(t27(lang, 'ck2')) + ' <a href="/registers/">kolaboro.com/registers</a>');
  for (const k of ['ck3', 'ck4', 'ck5', 'ck6', 'ck7']) L.push(esc(t27(lang, k)));
  L.push(esc(t27(lang, 'ck8', { co: '\u0000' })).replace('\u0000', bdi(lang, co)) + (o.cost ? ' <a href="#buycost">' + esc(o.costLbl || '') + '</a>' : ''));
  return '<div class="kck" data-u27k="' + esc(o.id) + '"><h3>' + esc(t27(lang, 'ck_h', { co })) + '</h3><p class="ki">' + esc(t27(lang, 'ck_i')) + ' <span class="kck-n" data-n="' + esc(t27(lang, 'ck_n')) + '" aria-live="polite"></span></p><ol class="kck-l">' +
    L.map((h, i) => '<li><label><input type="checkbox" value="' + i + '"><span>' + h + '</span></label></li>').join('') + '</ol><button type="button" class="kck-r" hidden>' + esc(t27(lang, 'ck_r')) + '</button></div>';
}

// CSS for the two levels, the light and the checklist (inline: the light is above the fold); print opens everything
export const Z_CSS = '<style id="kz-css">.kz-d>summary{list-style:none;cursor:pointer;display:block;position:relative;padding-inline-end:44px;border-radius:10px}.kz-d>summary::-webkit-details-marker{display:none}' +
  '.kz-d>summary::after{content:"";position:absolute;inset-inline-end:12px;top:.55em;width:10px;height:10px;border:solid currentColor;border-width:0 2px 2px 0;transform:rotate(45deg);transition:transform .15s}.kz-d[open]>summary::after{transform:rotate(-135deg);top:.85em}' +
  '.kz-d>summary h2{display:inline;margin:0}.kz-d>summary:focus-visible{outline:3px solid var(--k-sea,#155C75);outline-offset:4px}.kz-l,.kz-s .klead{margin:6px 0 0;color:var(--ink-2);font-size:.92rem;font-weight:500;line-height:1.45}.kwrap section.kz{padding:18px 0 4px;border-top:1px solid var(--line)}.kz-d[open]{padding-bottom:18px}.kz-d[open]>summary{margin-bottom:12px}' +
  '.kz-all{min-height:44px;margin:16px 0 4px;padding:0 14px;border:1.5px solid var(--line);border-radius:10px;background:none;color:inherit;font:inherit;font-weight:600;cursor:pointer}' +
  '.klt{margin:16px 0 0;max-width:80ch}.klt-h{margin:0 0 8px;font-size:.82rem;font-weight:700;color:var(--muted)}.klt-l{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,150px),1fr));gap:8px}@media(min-width:700px){.klt-l{grid-template-columns:repeat(3,minmax(0,1fr))}}' +
  '.klt-l a{display:flex;flex-wrap:wrap;align-items:baseline;column-gap:8px;min-height:48px;padding:9px 12px;border:1px solid var(--line);border-radius:12px;background:var(--card,var(--paper));color:inherit;text-decoration:none;line-height:1.3}.klt-l a:hover{border-color:var(--ink)}' +
  '.klt-l i{-webkit-print-color-adjust:exact;print-color-adjust:exact;flex:none;width:12px;height:12px;border-radius:50%;background:currentColor;align-self:center}.klt-l b{font-size:.92rem}.klt-l span{flex-basis:100%;padding-inline-start:20px;font-size:.84rem;color:var(--ink-2)}.klt-ok i{color:#1C7C4A}.klt-part i{color:#B26A00;background:linear-gradient(90deg,currentColor 50%,transparent 50%);box-shadow:inset 0 0 0 2px currentColor}[dir=rtl] .klt-part i{background:linear-gradient(270deg,currentColor 50%,transparent 50%)}.klt-no i{color:#B3261E}.klt-nc i{color:var(--muted);background:none;box-shadow:inset 0 0 0 2px currentColor}' +
  '.klt-k{margin-top:4px;font-size:.86rem;color:var(--ink-2)}.klt-k summary{cursor:pointer;min-height:44px;display:inline-flex;align-items:center;gap:8px;list-style:none;text-decoration:underline;text-underline-offset:3px}.klt-k summary::-webkit-details-marker{display:none}.klt-k summary::after{content:"";width:7px;height:7px;border:solid currentColor;border-width:0 2px 2px 0;transform:rotate(45deg) translateY(-2px)}.klt-k[open] summary::after{transform:rotate(-135deg)}.klt-k p{margin:4px 0 0}.klt-kl{list-style:none;margin:0;padding:0;display:grid;gap:4px}.klt-kl li{display:flex;align-items:center;gap:8px}.klt-kl i{flex:none;width:12px;height:12px;border-radius:50%;background:currentColor}.kz-kf{margin:12px 0 0}.kz-kf>summary{cursor:pointer;font-weight:700;min-height:44px;display:flex;align-items:center;gap:10px;list-style:none}.kz-kf>summary::-webkit-details-marker{display:none}.kz-kf>summary::after{content:"";width:8px;height:8px;border:solid currentColor;border-width:0 2px 2px 0;transform:rotate(45deg) translateY(-2px)}.kz-kf[open]>summary::after{transform:rotate(-135deg)}' +
  '.kck{margin:8px 0 18px;padding:16px 18px;border:1px solid var(--line);border-radius:14px;background:var(--card,var(--paper))}.kck h3{margin:0 0 6px}.kck-l{margin:10px 0 0;padding-inline-start:0;list-style:none;counter-reset:k}.kck-l li{border-top:1px solid var(--line)}.kck-l label{display:flex;gap:10px;align-items:flex-start;padding:10px 0;cursor:pointer;line-height:1.45}.kck-l input{width:22px;height:22px;flex:0 0 22px;margin-top:1px}.kck-l input:checked+span{color:var(--muted);text-decoration:line-through}.kck-n{font-weight:700}.kck-r{min-height:44px;margin-top:6px;border:0;background:none;color:inherit;text-decoration:underline;font:inherit;cursor:pointer}' +
  '.kwrap a.more{display:inline-flex;align-items:center;min-height:44px}' +
  '@media print{.kz-d>summary::after,.kz-all,.klt-k,.kwatch,.ktoc,.knx,#reply .bts,#cta .bts,.kck-r,.ship,header,footer,.totop,.kfeeds,.klive button{display:none!important}section.phero.kp{display:block!important;padding:0 0 8px!important}.kz-d>:not(style):not(script){display:block!important}details:not([open])>:not(summary):not(style):not(script){display:block!important}details::details-content{content-visibility:visible;display:block}' +
  'body{background:#fff!important;color:#000!important;font-size:11pt}a{color:#000!important;text-decoration:none}.kwrap section.ks{break-inside:auto;padding:10px 0;content-visibility:visible!important}.ks h2{break-after:avoid}.kp h1{font-size:22pt;max-width:none}.klt-l{grid-template-columns:repeat(3,1fr)}.klt-l a{border-color:#999;min-height:0}.kwrap{display:block!important}img,canvas,figure{max-width:100%!important;break-inside:avoid}.ksee,.ksat-strip,#ktm{display:none!important}a.src[href^="http"]::after{content:" (" attr(href) ")";font-size:8pt;word-break:break-all}}' +
  '@media(prefers-reduced-motion:reduce){.kz-d>summary::after{transition:none}}</style>';

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
      cmp: 'Compare', cms: '{k} selected', cmg: 'Compare side by side', cmx: 'Up to 3 projects', cmc: 'Clear', sg: 'Suggestions', sgd: 'Developer', sgp: '{k} projects', mpk: '{k} projects in this view', mpa: '{k} more in {m}, without a published address', mpo: 'Open', mpm: 'Show more', mpe: 'The map did not load. The list below still works.' },
    es: { oa: 'Abrir todas las secciones', ca: 'Cerrar todas las secciones', cu: 'Ver precios en', cuo: 'como se publica', cun: 'Convertido al tipo de referencia del Banco Central Europeo del {d}. El precio publicado sigue siendo la referencia.', cuf: 'No se pudieron cargar los tipos de cambio.',
      kh: 'Tus cifras: coste total y rentabilidad', kp: 'Precio de compra', kr: 'Alquiler esperado al mes', kc: 'Gastos anuales (comunidad, gestión, seguro)', km: 'Meses alquilado al año', kt: 'Impuestos y gastos ({c})', kt0: 'Impuestos y gastos (tu propia cifra)',
      ktot: 'Coste total de compra', kg: 'Rentabilidad bruta', kn: 'Rentabilidad neta tras gastos', kno: 'Tus propias cifras, calculadas en tu navegador. No es una previsión ni un consejo; no se envía ni se guarda nada. El alquiler es tu estimación, no la del promotor.', ke: 'No se pudieron cargar los impuestos. Pon tu propia cifra.',
      cmp: 'Comparar', cms: '{k} seleccionados', cmg: 'Comparar lado a lado', cmx: 'Hasta 3 proyectos', cmc: 'Borrar', sg: 'Sugerencias', sgd: 'Promotora', sgp: '{k} proyectos', mpk: '{k} proyectos en esta vista', mpa: '{k} más en {m}, sin dirección publicada', mpo: 'Abrir', mpm: 'Ver más', mpe: 'El mapa no se pudo cargar. La lista de abajo sigue funcionando.' },
    fr: { oa: 'Ouvrir toutes les sections', ca: 'Fermer toutes les sections', cu: 'Afficher les prix en', cuo: 'tel que publié', cun: 'Converti au taux de référence de la Banque centrale européenne du {d}. Le prix publié reste la référence.', cuf: 'Les taux n’ont pas pu être chargés.',
      kh: 'Vos chiffres : coût total et rendement', kp: 'Prix d’achat', kr: 'Loyer attendu par mois', kc: 'Charges annuelles (copropriété, gestion, assurance)', km: 'Mois loués par an', kt: 'Taxes et frais ({c})', kt0: 'Taxes et frais (votre propre chiffre)',
      ktot: 'Coût total d’achat', kg: 'Rendement brut', kn: 'Rendement net après charges', kno: 'Vos propres chiffres, calculés dans votre navigateur. Ni une prévision ni un conseil ; rien n’est envoyé ni enregistré. Le loyer est votre estimation, pas celle du promoteur.', ke: 'Les taxes n’ont pas pu être chargées. Saisissez votre propre chiffre.',
      cmp: 'Comparer', cms: '{k} sélectionnés', cmg: 'Comparer côte à côte', cmx: 'Jusqu’à 3 projets', cmc: 'Effacer', sg: 'Suggestions', sgd: 'Promoteur', sgp: '{k} projets', mpk: '{k} projets dans cette vue', mpa: '{k} de plus à {m}, sans adresse publiée', mpo: 'Ouvrir', mpm: 'Voir plus', mpe: 'La carte n’a pas pu être chargée. La liste ci-dessous fonctionne toujours.' },
    de: { oa: 'Alle Abschnitte öffnen', ca: 'Alle Abschnitte schließen', cu: 'Preise anzeigen in', cuo: 'wie veröffentlicht', cun: 'Umgerechnet zum Referenzkurs der Europäischen Zentralbank vom {d}. Maßgeblich bleibt der veröffentlichte Preis.', cuf: 'Die Kurse konnten gerade nicht geladen werden.',
      kh: 'Ihre Zahlen: Gesamtkosten und Rendite', kp: 'Kaufpreis', kr: 'Erwartete Miete pro Monat', kc: 'Jährliche laufende Kosten (Hausgeld, Verwaltung, Versicherung)', km: 'Vermietete Monate pro Jahr', kt: 'Steuern und Gebühren ({c})', kt0: 'Steuern und Gebühren (eigener Betrag)',
      ktot: 'Gesamtkosten des Kaufs', kg: 'Bruttorendite', kn: 'Nettorendite nach laufenden Kosten', kno: 'Ihre eigenen Zahlen, im Browser berechnet. Keine Prognose und keine Beratung; nichts wird gesendet oder gespeichert. Die Miete ist Ihre Schätzung, nicht die des Bauträgers.', ke: 'Die Steuerzeilen konnten nicht geladen werden. Tragen Sie einen eigenen Betrag ein.',
      cmp: 'Vergleichen', cms: '{k} ausgewählt', cmg: 'Nebeneinander vergleichen', cmx: 'Bis zu 3 Projekte', cmc: 'Leeren', sg: 'Vorschläge', sgd: 'Bauträger', sgp: '{k} Projekte', mpk: '{k} Projekte in dieser Ansicht', mpa: '{k} weitere in {m}, ohne veröffentlichte Adresse', mpo: 'Öffnen', mpm: 'Mehr zeigen', mpe: 'Die Karte konnte nicht geladen werden. Die Liste unten funktioniert weiter.' },
    nl: { oa: 'Alle secties openen', ca: 'Alle secties sluiten', cu: 'Prijzen tonen in', cuo: 'zoals gepubliceerd', cun: 'Omgerekend tegen de referentiekoers van de Europese Centrale Bank van {d}. De gepubliceerde prijs blijft de referentie.', cuf: 'De koersen konden nu niet laden.',
      kh: 'Uw cijfers: totale kosten en rendement', kp: 'Koopprijs', kr: 'Verwachte huur per maand', kc: 'Jaarlijkse kosten (servicekosten, beheer, verzekering)', km: 'Maanden verhuurd per jaar', kt: 'Belastingen en kosten ({c})', kt0: 'Belastingen en kosten (uw eigen bedrag)',
      ktot: 'Totale aankoopkosten', kg: 'Brutorendement', kn: 'Nettorendement na kosten', kno: 'Uw eigen cijfers, berekend in uw browser. Geen voorspelling en geen advies; er wordt niets verzonden of opgeslagen. De huur is uw schatting, niet die van de ontwikkelaar.', ke: 'De belastingregels konden niet laden. Vul uw eigen bedrag in.',
      cmp: 'Vergelijken', cms: '{k} geselecteerd', cmg: 'Naast elkaar vergelijken', cmx: 'Tot 3 projecten', cmc: 'Wissen', sg: 'Suggesties', sgd: 'Ontwikkelaar', sgp: '{k} projecten', mpk: '{k} projecten in deze weergave', mpa: 'nog {k} in {m}, zonder gepubliceerd adres', mpo: 'Openen', mpm: 'Meer tonen', mpe: 'De kaart kon niet laden. De lijst hieronder werkt nog.' },
    ru: { oa: 'Открыть все разделы', ca: 'Свернуть все разделы', cu: 'Цены в валюте', cuo: 'как опубликовано', cun: 'Пересчитано по справочному курсу Европейского центрального банка на {d}. Опорной остаётся опубликованная цена.', cuf: 'Курсы сейчас не загрузились.',
      kh: 'Ваши цифры: полная стоимость и доходность', kp: 'Цена покупки', kr: 'Ожидаемая аренда в месяц', kc: 'Годовые расходы (обслуживание, управление, страховка)', km: 'Месяцев аренды в году', kt: 'Налоги и сборы ({c})', kt0: 'Налоги и сборы (ваша сумма)',
      ktot: 'Полная стоимость покупки', kg: 'Валовая доходность', kn: 'Чистая доходность после расходов', kno: 'Ваши собственные цифры, расчёт в браузере. Это не прогноз и не совет; ничего не отправляется и не сохраняется. Аренда: это ваша оценка, а не застройщика.', ke: 'Налоги не загрузились. Укажите свою сумму.',
      cmp: 'Сравнить', cms: 'Выбрано: {k}', cmg: 'Сравнить рядом', cmx: 'Не больше 3 проектов', cmc: 'Сбросить', sg: 'Подсказки', sgd: 'Застройщик', sgp: 'Проектов: {k}', mpk: 'Проектов в этой области: {k}', mpa: 'Ещё в {m} без опубликованного адреса: {k}', mpo: 'Открыть', mpm: 'Показать ещё', mpe: 'Карта не загрузилась. Список ниже работает.' },
    zh: { oa: '展开全部章节', ca: '收起全部章节', cu: '价格显示为', cuo: '按公布币种', cun: '按欧洲中央银行 {d} 的参考汇率换算。以公布的价格为准。', cuf: '暂时无法加载汇率。',
      kh: '按您的数字：总成本和收益率', kp: '购买价格', kr: '预计月租金', kc: '每年运营成本（物业费、管理费、保险）', km: '每年出租月数', kt: '税费（{c}）', kt0: '税费（您自己的数字）',
      ktot: '购买总成本', kg: '毛收益率', kn: '扣除运营成本后的净收益率', kno: '这是您自己的数字，在浏览器中计算。不是预测，也不是建议；不发送也不保存任何内容。租金是您的估计，不是开发商的。', ke: '无法加载税费，请填写您自己的数字。',
      cmp: '对比', cms: '已选 {k} 个', cmg: '并排对比', cmx: '最多 3 个项目', cmc: '清除', sg: '建议', sgd: '开发商', sgp: '{k} 个项目', mpk: '此视图中有 {k} 个项目', mpa: '{m} 另有 {k} 个项目未公布地址', mpo: '打开', mpm: '显示更多', mpe: '地图未能加载，下方列表仍可使用。' },
    ar: { oa: 'افتح كل الأقسام', ca: 'أغلق كل الأقسام', cu: 'اعرض الأسعار بـ', cuo: 'كما نُشرت', cun: 'محوَّل بسعر الصرف المرجعي للبنك المركزي الأوروبي بتاريخ {d}. يبقى السعر المنشور هو المرجع.', cuf: 'تعذّر تحميل أسعار الصرف الآن.',
      kh: 'أرقامك: التكلفة الإجمالية والعائد', kp: 'سعر الشراء', kr: 'الإيجار المتوقع شهريًا', kc: 'التكاليف السنوية (رسوم الخدمة، الإدارة، التأمين)', km: 'أشهر الإيجار في السنة', kt: 'الضرائب والرسوم ({c})', kt0: 'الضرائب والرسوم (رقمك الخاص)',
      ktot: 'التكلفة الإجمالية للشراء', kg: 'العائد الإجمالي', kn: 'العائد الصافي بعد التكاليف', kno: 'أرقامك الخاصة، محسوبة في متصفحك. ليست توقعًا ولا نصيحة؛ لا يُرسل شيء ولا يُحفظ. الإيجار تقديرك أنت لا تقدير المطوّر.', ke: 'تعذّر تحميل الضرائب. أدخل رقمك الخاص.',
      cmp: 'قارن', cms: 'المحدد: {k}', cmg: 'قارن جنبًا إلى جنب', cmx: 'حتى 3 مشاريع', cmc: 'مسح', sg: 'اقتراحات', sgd: 'المطوّر', sgp: 'عدد المشاريع: {k}', mpk: 'عدد المشاريع في هذا العرض: {k}', mpa: 'مشاريع أخرى في {m} بلا عنوان منشور: {k}', mpo: 'افتح', mpm: 'اعرض المزيد', mpe: 'تعذّر تحميل الخريطة. القائمة أدناه ما زالت تعمل.' }
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
    try { var s0 = JSON.parse(sessionStorage.getItem('kb-cmp3') || '[]'); if (Array.isArray(s0)) sel3 = s0.filter(function (v) { return /^[a-z0-9-]{1,90}$/.test(v); }).slice(0, 3); } catch (e) {}
    clr.type = 'button'; bar.hidden = true; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', f('cmp')); bar.appendChild(bt); bar.appendChild(go2); bar.appendChild(clr); document.body.appendChild(bar);
    var css = el('style'); css.textContent = '.kcmb{position:absolute;z-index:1;inset-inline-start:-10px;top:50%;margin-top:-22px;display:flex;align-items:center;justify-content:center;width:44px;height:44px;cursor:pointer}[data-kx-lists] .lk li,.kf-out li{position:relative;padding-inline-start:34px}[data-kx-lists] .lk li>a::after,.kf-out li>a::after{content:"";position:absolute;inset:0}.kcm-on .mcta{display:none!important}body.kcm-on{padding-bottom:150px}.kcmb input{width:20px;height:20px;margin:0;cursor:pointer}.kcm{position:fixed;inset-inline:12px;bottom:12px;z-index:60;display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;justify-content:center;max-width:640px;margin:0 auto;padding:10px 14px;border-radius:14px;background:var(--ink,#17212B);color:#fff;box-shadow:0 12px 30px rgba(23,33,43,.3)}.kcm[hidden]{display:none}.kcm-t{font-weight:700}.kcm-g{display:inline-flex;align-items:center;min-height:44px;padding:0 14px;border-radius:10px;background:#fff;color:#17212B;font-weight:700;text-decoration:none}.kcm-g[aria-disabled=true]{opacity:.55;pointer-events:none}.kcm-c{min-height:44px;border:0;background:none;color:#fff;text-decoration:underline;font:inherit;cursor:pointer}';
    document.head.appendChild(css);
    var slugOf = function (a) { var m = /\/projects\/([a-z0-9-]+)\/?$/.exec(a.getAttribute('href') || ''); return m ? m[1] : null; };
    var refresh = function () {
      try { if (sel3.length) sessionStorage.setItem('kb-cmp3', JSON.stringify(sel3)); else sessionStorage.removeItem('kb-cmp3'); } catch (e) {}
      document.body.classList.toggle('kcm-on', sel3.length > 0);
      bar.hidden = !sel3.length; bt.textContent = f('cms', { k: sel3.length }) + (sel3.length >= 3 ? ' · ' + f('cmx') : '');
      go2.href = PRE + '/compare/?p=' + sel3.join(','); go2.setAttribute('aria-disabled', sel3.length < 2 ? 'true' : 'false');
      document.querySelectorAll('.kcmb input').forEach(function (i) { i.checked = sel3.indexOf(i.value) >= 0; i.disabled = !i.checked && sel3.length >= 3; i.parentNode.title = i.disabled ? f('cmx') : ''; });
    };
    var add = function (li) {
      if (li.querySelector('.kcmb')) return; var a = li.querySelector('a[href*="/projects/"]'); if (!a) return; var s = slugOf(a); if (!s) return;
      var w = el('label', 'kcmb'), i = el('input'); i.type = 'checkbox'; i.value = s; i.setAttribute('aria-label', f('cmp') + ': ' + a.textContent); w.appendChild(i); li.insertBefore(w, li.firstChild);
      if (sel3.indexOf(s) >= 0) i.checked = true; if (!i.checked && sel3.length >= 3) { i.disabled = true; w.title = f('cmx'); }
    };
    document.addEventListener('change', function (e) { var i = e.target; if (!i.closest || !i.closest('.kcmb')) return; var k = sel3.indexOf(i.value); if (i.checked && k < 0 && sel3.length < 3) sel3.push(i.value); if (!i.checked && k >= 0) sel3.splice(k, 1); refresh(); });
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
        .concat((d.d || []).map(function (x) { return { u: PRE + '/developers/' + x[0] + '/', n: x[1], sub: f('sgd') + ' · ' + f('sgp', { k: x[2] }) + (x[3] ? ' · ' + x[3] : ''), h: ' ' + norm(x[1] + ' ' + x[3]), w: 1 }; }));
    }).catch(function () { P = null; }); return P; };
    var close = function () { ul.hidden = true; HQ.setAttribute('aria-expanded', 'false'); HQ.removeAttribute('aria-activedescendant'); act = -1; };
    var run = function () {
      var v = HQ.value, ws = norm(v).split(' ').filter(Boolean);
      if (!ws.length || /^(https?:\/\/|www\.)/i.test(v.trim()) || /\.[a-z]{2,}(\/|$)/i.test(v.trim())) { close(); return; }
      load().then(function () { if (!IX) return;
        var R = IX.filter(function (it) { return ws.every(function (w) { return it.h.indexOf(' ' + w) >= 0 || (w.length > 2 && it.h.indexOf(w) >= 0); }); })
          .sort(function (a, b) { var x = norm(a.n).indexOf(ws[0]) === 0 ? 0 : 1, y = norm(b.n).indexOf(ws[0]) === 0 ? 0 : 1; return x - y || a.w - b.w || a.n.length - b.n.length; }).slice(0, 7);
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
      cnt.textContent = f('mpk', { k: nf(R.length) }); var e0 = MP.querySelector('.kmp-0'); if (e0) e0.hidden = R.length > 0; if (rs) rs.hidden = !['co', 'yr', 'pm', 'sc'].some(function (k) { return q(k); });
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
const MAPV = { js: '/satellite/plot/vendor/leaflet-1.9.4.js?v=dc452946ac', css: '/satellite/plot/vendor/leaflet-1.9.4.css?v=b8273795a6' };

async function mapData(env, lang) {
  const N = await import('./kbx_named.js'), T = await import('./kbx_tr.js'), H = await import('./kbx_hdate.js');
  const ix = await N.data(env); let tr = null; try { tr = await T.trData(env); } catch (e) {}
  let mp = null; try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/similar.json')); if (r.ok) mp = ((await r.json()) || {}).market_points; } catch (e) {}
  const mk = {}; for (const [k, v] of Object.entries((mp && mp.markets) || {})) if (v && isFinite(v.lat) && isFinite(v.lng)) mk[k] = [Math.round(v.lat * 100) / 100, Math.round(v.lng * 100) / 100];
  const P = [], co = new Map(), yrs = new Set();
  for (const x of ix.P) {
    if (COI_RX.test(String(x.n || '') + ' ' + String(x.dv || ''))) continue;
    const fx = x.fx || {}, c = ix.caseBy.get(x.id) || {}, h = N.handoverOf(ix, x), m = h && /(20\d\d)/.exec(String(h.d)), y = m ? +m[1] : null, row = tr && tr.rows.get(x.id);
    const pin = typeof fx.lat === 'number' && typeof fx.lng === 'number';
    if (y) yrs.add(y);
    co.set(x.co, (co.get(x.co) || 0) + 1);
    P.push([x.s, x.n, x.mk, x.co, pin ? Math.round(fx.lat * 1e4) / 1e4 : null, pin ? Math.round(fx.lng * 1e4) / 1e4 : null, y, x.pn || (c.checks || {}).permit === 2 ? 1 : 0, row ? row.score : null]);
  }
  const coL = [...co.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => [k, H.placeName(k, lang), n]);
  return { updated: String(ix.updated || '').slice(0, 10), keys: ['slug', 'name', 'market', 'country', 'lat', 'lng', 'handover_year', 'permit_published', 'transparency_score'], mk, co: coL, yr: [...yrs].sort(), p: P,
    note: 'lat/lng only where the developer publishes an address precise enough for a pin; other projects are drawn at their market point (similar.json market_points). Sumba projects are not listed (conflict of interest).' };
}

async function mapPage(req, u, env, ctx, shell, lang) {
  const N = await import('./kbx_named.js'), H = await import('./kbx_hdate.js');
  const P = pre(lang), canon = ORIGIN + P + '/map/';
  // n29t (item 47): the list under the map is already filled in the HTML (markets with their project counts, linked to each market file),
  // so the page says what it holds without script; the map script replaces it with the projects in view
  let pre47 = ''; try { const ix = await N.data(env), mc = new Map(); for (const x of ix.P) { if (COI_RX.test(String(x.n || '') + ' ' + String(x.dv || ''))) continue; mc.set(x.mk, (mc.get(x.mk) || 0) + 1); }
    pre47 = [...mc.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))).slice(0, 60).map(([m, n]) => '<li><a href="/m/' + encodeURIComponent(String(m).toLowerCase().replace(/\s+/g, '-')) + '/">' + esc(H.mkName(m, lang)) + '</a><small>' + n.toLocaleString(lang) + '</small></li>').join(''); } catch (e) { pre47 = ''; }
  const sel = (n, lbl, opts) => '<label for="kmp-' + n + '"><span>' + esc(t27(lang, lbl)) + '</span><select id="kmp-' + n + '" name="' + n + '"><option value="">' + esc(t27(lang, 'mp_all')) + '</option>' + opts + '</select></label>';
  const form = '<form class="kmp-f" role="search">' + sel('co', 'mp_co', '') + sel('yr', 'mp_yr', '<option value="0">' + esc(t27(lang, 'mp_yr0')) + '</option>') +
    sel('pm', 'mp_pm', '<option value="1">' + esc(t27(lang, 'mp_pm1')) + '</option><option value="0">' + esc(t27(lang, 'mp_pm0')) + '</option>') + sel('sc', 'mp_sc', [25, 50, 75].map(n => '<option value="' + n + '">' + esc(t27(lang, 'mp_scn', { n })) + '</option>').join('')) + '</form>';
  const body = '<section class="phero kp"><div class="wrap"><p class="crumb"><a href="' + P + '/">Kolaboro</a> / <a href="' + P + '/projects/">' + esc(N.tr(lang, 'h1_i')) + '</a></p><h1>' + esc(t27(lang, 'mp_h1')) + '</h1><p class="lead">' + esc(t27(lang, 'mp_lead')) + '</p></div></section>' +
    '<div class="wrap kwrap kmp" data-u27map="' + esc(JSON.stringify(MAPV)) + '">' + form + '<p class="kmp-n" role="status" aria-live="polite">' + esc(t27(lang, 'mp_load')) + '</p><div class="kmp-m" role="region" aria-label="' + esc(t27(lang, 'mp_h1')) + '">' + esc(t27(lang, 'mp_load')) + '</div>' +
    '<p class="k-small k-muted">' + esc(t27(lang, 'mp_src')) + '</p><h2>' + esc(t27(lang, 'mp_list')) + '</h2><ul class="kmp-l lk">' + pre47 + '</ul><button type="button" class="kmp-more" hidden>' + esc(W_MORE[lang] || W_MORE.en) + '</button>' +
    '<p><a href="/api/v1/map' + (lang === 'en' ? '' : '?lang=' + lang) + '" rel="nofollow">/api/v1/map</a> · <a href="' + P + '/projects/">' + esc(N.tr(lang, 'h1_i')) + '</a></p></div>' +
    '<style>.kmp-f{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px 14px;margin:18px 0 10px}.kmp-f label{display:flex;flex-direction:column;gap:4px;font-size:.84rem;font-weight:600;min-width:0}.kmp-f select{min-height:44px;width:100%;min-width:0;border:1.5px solid var(--line,#d5d3cc);border-radius:10px;padding:0 10px;background:var(--paper,#fff);color:inherit;font:inherit;font-weight:500}' +
    '.kmp-n{font-weight:700;margin:6px 0 10px}.kmp-m{height:min(70vh,560px);min-height:340px;}@media(max-width:700px){.kmp-m{height:440px}}.kmp-m{border:1px solid var(--line,#d5d3cc);border-radius:14px;overflow:hidden;background:var(--concrete,#F1EFE9);display:grid;place-items:center;color:var(--muted)}.kmp-l{columns:2 300px;padding:0;list-style:none}.kmp-l li{padding:7px 0;border-bottom:1px solid var(--line,#d5d3cc);break-inside:avoid}.kmp-l small{display:block;color:var(--muted)}.kmp-more{min-height:44px;margin:10px 0;padding:0 14px;border:1.5px solid var(--ink,#17212B);border-radius:10px;background:none;color:inherit;font:inherit;font-weight:600;cursor:pointer}.kmp .leaflet-container{font:inherit}.kmp-m{position:relative;z-index:0;isolation:isolate}@media(pointer:coarse){.kmp .leaflet-touch .leaflet-bar a{width:44px;height:44px;line-height:44px;font-size:22px}}.kmp-l li{position:relative}.kmp-l li>a::after{content:"";position:absolute;inset:0}.kmp-r{min-height:44px;padding:0 14px;border:0;background:none;color:inherit;font:inherit;text-decoration:underline;cursor:pointer;align-self:end;justify-self:start}.kmp-0{font-weight:600;margin:10px 0}.kmp-0[hidden]{display:none}</style>';
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
  if (p === '/k/u27.js') {
    const N = await import('./kbx_named.js'), v = N.U27_SRC_V;
    const body = N.NAMED_CLIENT_JS + '\n' + CLIENT_JS;
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
    const ck = new Request(ORIGIN + '/__u27_map/v1/' + lang);
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
