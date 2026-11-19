// kolaboro.com batch 24 (agent n24s, 12 Nov 2026): what people search about one project, answered at the top of its named page.
// Templates only (8 languages); every fact comes from the data the page already holds (named.json, bali-cases.json, promises.json,
// the transparency ranking in kbx_tr.js) and keeps its source link on the page. No verdicts, no opinion words, no Review schema.
// Used by kbx_named.js for: the quick answer, the question headings (when, how much, who, is it legit, where), the related six,
// the search-intent title (under 60 characters) and description (under 155), and by kbx_cite.js for the answer files.
const S = {
  en: { b: '{n} reviews', s1: ': ', s2: ', ', t_h: 'handover {h}', t_pn: 'permit published', t_f: '{n} reviews and facts',
    d_lead: '{n} reviews and facts{by}, {place}.', d_h: 'Handover as published: {h}.', d_h0: 'No handover date published.', d_pn1: 'Permit number published.', d_pn0: 'Permit number not published.', d_tr: 'Transparency score {s}/100.', d_nr: 'Not yet reviewed; sourced facts only.', d_chk: 'Checked {d}.',
    qa_w0: '{n} is a property project in {place}.', qa_w0d: '{n} is a property project in {place}, by {dev}.', qa_pn1: 'A permit number is published.', qa_pn0: 'No permit number is published.',
    qa_tr: 'Transparency score: {s} of 100, rank {r} of {m} in {p}.', qa_tr1: 'Transparency score: {s} of 100.', qa_cl: '{v} of {c} developer claims we tested are confirmed.', qa_chk: 'Last checked {d}.',
    h_when: 'When will {n} be completed?', h_cost: 'How much does {n} cost?', h_who: 'Who is the developer of {n}?', h_legit: 'Is {n} legit? What we could check', h_where: 'Where is {n}?',
    toc_legit: 'What we could check', toc_where: 'Location',
    lg_intro: 'What is published and checkable about {n}, item by item, with the source of each. This is not a verdict: Kolaboro does not label projects or developers. "Not published" means we found no public source.',
    lg_sum: 'Published or confirmed: {a} of {b} items we could check.', lg_m: 'How the transparency score is made', lg_nr: 'This checklist is computed from public facts; our own review of this project is not done yet.',
    c_read: 'Prices and payment plan as published on the pages we read (copy of {d}).', c_price0: 'Price: not published in the pages we read.', c_plan0: 'Payment plan: not published in the pages we read.', c_plan: 'Payment plan as published', c_dep: 'Deposit',
    w_sum0: 'Handover date on record: {h}. Not moved in our records.', w_sum: 'Handover date on record: {h}. First date on record: {a}. Moves recorded: {k}.', w_none: 'Handover date: not published in the sources we read.',
    who_l: '{n} is developed by {dev}, as published on the pages we read.', who_k: 'Projects by {dev} that we track: {k}.', who_none: 'The developer is not named in the sources we read.',
    wh_place: 'Area as published: {place}.', wh_pin_a: 'Pin on the map: from a published address or coordinates, accurate to about {a} m.', wh_pin: 'Pin on the map: from a published address or coordinates.', wh_nopin: 'Pin on the map: none, because no address or coordinates precise enough are published.',
    wh_around: 'What is around the site', wh_map: 'Open the pin on OpenStreetMap', wh_mk: 'All projects in {mk}', wh_rank: 'Transparency ranking: {p}',
    r6_h: 'Related projects', r6_dev: 'same developer', r6_mk: 'also in {mk}', r6_y: 'handover {y}',
    q_tr: 'What is the transparency score of {n}?', a_tr_x: 'It counts what is published and checkable, not quality.', q_plan: 'What is the payment plan of {n}?', a_plan: 'Payment plan as published: {p}. Ask the developer for the current terms before paying.', a_price0: 'No price is published in the pages we read. Ask the developer for the current price list.' },
  es: { b: 'Opiniones de {n}', s1: ': ', s2: ', ', t_h: 'entrega {h}', t_pn: 'licencia publicada', t_f: 'Opiniones y datos de {n}',
    d_lead: 'Opiniones y datos de {n}{by}, {place}.', d_h: 'Entrega según lo publicado: {h}.', d_h0: 'Sin fecha de entrega publicada.', d_pn1: 'Número de licencia publicado.', d_pn0: 'Número de licencia no publicado.', d_tr: 'Puntuación de transparencia {s}/100.', d_nr: 'Aún sin revisar; solo hechos con fuente.', d_chk: 'Revisado el {d}.',
    qa_w0: '{n} es un proyecto inmobiliario en {place}.', qa_w0d: '{n} es un proyecto inmobiliario en {place}, del promotor {dev}.', qa_pn1: 'Se publica un número de licencia.', qa_pn0: 'No se publica ningún número de licencia.',
    qa_tr: 'Puntuación de transparencia: {s} sobre 100, puesto {r} de {m} en {p}.', qa_tr1: 'Puntuación de transparencia: {s} sobre 100.', qa_cl: 'De las {c} afirmaciones del promotor que comprobamos, {v} están confirmadas.', qa_chk: 'Última revisión: {d}.',
    h_when: '¿Cuándo se entrega {n}?', h_cost: '¿Cuánto cuesta {n}?', h_who: '¿Quién es el promotor de {n}?', h_legit: '¿Es fiable {n}? Lo que pudimos comprobar', h_where: '¿Dónde está {n}?',
    toc_legit: 'Lo que pudimos comprobar', toc_where: 'Ubicación',
    lg_intro: 'Lo que se publica y se puede comprobar sobre {n}, punto por punto, con la fuente de cada uno. No es un veredicto: Kolaboro no etiqueta proyectos ni promotores. "No publicado" significa que no encontramos ninguna fuente pública.',
    lg_sum: 'Publicado o confirmado: {a} de {b} puntos que pudimos comprobar.', lg_m: 'Cómo se calcula la puntuación de transparencia', lg_nr: 'Esta lista se calcula con hechos públicos; todavía no hemos hecho nuestra propia revisión de este proyecto.',
    c_read: 'Precios y plan de pagos tal como se publican en las páginas que leímos (copia del {d}).', c_price0: 'Precio: no publicado en las páginas que leímos.', c_plan0: 'Plan de pagos: no publicado en las páginas que leímos.', c_plan: 'Plan de pagos publicado', c_dep: 'Depósito',
    w_sum0: 'Fecha de entrega registrada: {h}. Sin cambios en nuestros registros.', w_sum: 'Fecha de entrega registrada: {h}. Primera fecha registrada: {a}. Cambios registrados: {k}.', w_none: 'Fecha de entrega: no publicada en las fuentes que leímos.',
    who_l: 'El promotor de {n} es {dev}, según las páginas que leímos.', who_k: 'Proyectos de {dev} que seguimos: {k}.', who_none: 'El promotor no aparece en las fuentes que leímos.',
    wh_place: 'Zona publicada: {place}.', wh_pin_a: 'Punto en el mapa: a partir de una dirección o coordenadas publicadas, con unos {a} m de precisión.', wh_pin: 'Punto en el mapa: a partir de una dirección o coordenadas publicadas.', wh_nopin: 'Punto en el mapa: ninguno, porque no se publica una dirección ni coordenadas con precisión suficiente.',
    wh_around: 'Qué hay alrededor de la parcela', wh_map: 'Abrir el punto en OpenStreetMap', wh_mk: 'Todos los proyectos en {mk}', wh_rank: 'Ranking de transparencia: {p}',
    r6_h: 'Proyectos relacionados', r6_dev: 'mismo promotor', r6_mk: 'también en {mk}', r6_y: 'entrega {y}',
    q_tr: '¿Qué puntuación de transparencia tiene {n}?', a_tr_x: 'Cuenta lo que está publicado y se puede comprobar, no la calidad.', q_plan: '¿Cuál es el plan de pagos de {n}?', a_plan: 'Plan de pagos publicado: {p}. Pide al promotor las condiciones vigentes antes de pagar.', a_price0: 'No se publica ningún precio en las páginas que leímos. Pide al promotor la lista de precios vigente.' },
  fr: { b: 'Avis sur {n}', s1: ' : ', s2: ', ', t_h: 'livraison {h}', t_pn: 'permis publié', t_f: 'Avis et faits sur {n}',
    d_lead: 'Avis et faits sur {n}{by}, {place}.', d_h: 'Livraison annoncée : {h}.', d_h0: 'Aucune date de livraison publiée.', d_pn1: 'Numéro de permis publié.', d_pn0: 'Numéro de permis non publié.', d_tr: 'Score de transparence {s}/100.', d_nr: 'Pas encore examiné ; faits sourcés uniquement.', d_chk: 'Vérifié le {d}.',
    qa_w0: '{n} est un projet immobilier situé à {place}.', qa_w0d: '{n} est un projet immobilier situé à {place}, du promoteur {dev}.', qa_pn1: 'Un numéro de permis est publié.', qa_pn0: 'Aucun numéro de permis n’est publié.',
    qa_tr: 'Score de transparence : {s} sur 100, rang {r} sur {m} à {p}.', qa_tr1: 'Score de transparence : {s} sur 100.', qa_cl: '{v} des {c} affirmations du promoteur que nous avons testées sont confirmées.', qa_chk: 'Dernière vérification : {d}.',
    h_when: 'Quand {n} sera-t-il livré ?', h_cost: 'Combien coûte {n} ?', h_who: 'Qui est le promoteur de {n} ?', h_legit: '{n} est-il fiable ? Ce que nous avons pu vérifier', h_where: 'Où se trouve {n} ?',
    toc_legit: 'Ce que nous avons pu vérifier', toc_where: 'Emplacement',
    lg_intro: 'Ce qui est publié et vérifiable sur {n}, point par point, avec la source de chacun. Ce n’est pas un verdict : Kolaboro ne colle pas d’étiquette aux projets ni aux promoteurs. « Non publié » signifie que nous n’avons trouvé aucune source publique.',
    lg_sum: 'Publié ou confirmé : {a} des {b} points que nous avons pu vérifier.', lg_m: 'Comment le score de transparence est calculé', lg_nr: 'Cette liste est calculée à partir de faits publics ; nous n’avons pas encore fait notre propre examen de ce projet.',
    c_read: 'Prix et échéancier tels que publiés sur les pages lues (copie du {d}).', c_price0: 'Prix : non publié sur les pages lues.', c_plan0: 'Échéancier de paiement : non publié sur les pages lues.', c_plan: 'Échéancier publié', c_dep: 'Acompte',
    w_sum0: 'Date de livraison enregistrée : {h}. Inchangée dans nos relevés.', w_sum: 'Date de livraison enregistrée : {h}. Première date enregistrée : {a}. Changements relevés : {k}.', w_none: 'Date de livraison : non publiée dans les sources lues.',
    who_l: 'Le promoteur de {n} est {dev}, d’après les pages consultées.', who_k: 'Projets de {dev} que nous suivons : {k}.', who_none: 'Le promoteur n’est pas nommé dans les sources lues.',
    wh_place: 'Zone publiée : {place}.', wh_pin_a: 'Repère sur la carte : d’après une adresse ou des coordonnées publiées, précis à environ {a} m.', wh_pin: 'Repère sur la carte : d’après une adresse ou des coordonnées publiées.', wh_nopin: 'Repère sur la carte : aucun, car aucune adresse ni coordonnées assez précises ne sont publiées.',
    wh_around: 'Ce qui se trouve autour du terrain', wh_map: 'Ouvrir le repère sur OpenStreetMap', wh_mk: 'Tous les projets : {mk}', wh_rank: 'Classement de transparence : {p}',
    r6_h: 'Projets liés', r6_dev: 'même promoteur', r6_mk: 'même marché : {mk}', r6_y: 'livraison {y}',
    q_tr: 'Quel est le score de transparence de {n} ?', a_tr_x: 'Il compte ce qui est publié et vérifiable, pas la qualité.', q_plan: 'Quel est l’échéancier de paiement de {n} ?', a_plan: 'Échéancier publié : {p}. Demandez les conditions actuelles au promoteur avant de payer.', a_price0: 'Aucun prix n’est publié sur les pages lues. Demandez la grille de prix actuelle au promoteur.' },
  de: { b: '{n} Erfahrungen', s1: ': ', s2: ', ', t_h: 'Fertigstellung {h}', t_pn: 'Genehmigung veröffentlicht', t_f: '{n} Erfahrungen und Fakten',
    d_lead: '{n} Erfahrungen und Fakten{by}, {place}.', d_h: 'Übergabe laut Veröffentlichung: {h}.', d_h0: 'Kein Übergabetermin veröffentlicht.', d_pn1: 'Genehmigungsnummer veröffentlicht.', d_pn0: 'Genehmigungsnummer nicht veröffentlicht.', d_tr: 'Transparenzwert {s}/100.', d_nr: 'Noch nicht geprüft; nur belegte Fakten.', d_chk: 'Geprüft am {d}.',
    qa_w0: '{n} ist ein Immobilienprojekt in {place}.', qa_w0d: '{n} ist ein Immobilienprojekt in {place}, Bauträger {dev}.', qa_pn1: 'Eine Genehmigungsnummer ist veröffentlicht.', qa_pn0: 'Es ist keine Genehmigungsnummer veröffentlicht.',
    qa_tr: 'Transparenzwert: {s} von 100, Platz {r} von {m} in {p}.', qa_tr1: 'Transparenzwert: {s} von 100.', qa_cl: '{v} von {c} geprüften Angaben des Bauträgers sind bestätigt.', qa_chk: 'Zuletzt geprüft: {d}.',
    h_when: 'Wann wird {n} fertiggestellt?', h_cost: 'Was kostet {n}?', h_who: 'Wer ist der Bauträger von {n}?', h_legit: 'Ist {n} seriös? Was wir prüfen konnten', h_where: 'Wo liegt {n}?',
    toc_legit: 'Was wir prüfen konnten', toc_where: 'Lage',
    lg_intro: 'Was über {n} veröffentlicht und überprüfbar ist, Punkt für Punkt, jeweils mit Quelle. Das ist kein Urteil: Kolaboro vergibt keine Etiketten an Projekte oder Bauträger. „Nicht veröffentlicht“ heißt, dass wir keine öffentliche Quelle gefunden haben.',
    lg_sum: 'Veröffentlicht oder bestätigt: {a} von {b} Punkten, die wir prüfen konnten.', lg_m: 'Wie der Transparenzwert berechnet wird', lg_nr: 'Diese Liste wird aus öffentlichen Fakten berechnet; unsere eigene Prüfung dieses Projekts steht noch aus.',
    c_read: 'Preise und Zahlungsplan wie auf den gelesenen Seiten veröffentlicht (Kopie vom {d}).', c_price0: 'Preis: auf den gelesenen Seiten nicht veröffentlicht.', c_plan0: 'Zahlungsplan: auf den gelesenen Seiten nicht veröffentlicht.', c_plan: 'Veröffentlichter Zahlungsplan', c_dep: 'Anzahlung',
    w_sum0: 'Erfasster Übergabetermin: {h}. In unseren Aufzeichnungen nicht verschoben.', w_sum: 'Erfasster Übergabetermin: {h}. Erster erfasster Termin: {a}. Erfasste Verschiebungen: {k}.', w_none: 'Übergabetermin: in den gelesenen Quellen nicht veröffentlicht.',
    who_l: '{n} wird laut den gelesenen Seiten von {dev} entwickelt.', who_k: 'Projekte von {dev}, die wir verfolgen: {k}.', who_none: 'Der Bauträger wird in den gelesenen Quellen nicht genannt.',
    wh_place: 'Veröffentlichte Lage: {place}.', wh_pin_a: 'Markierung auf der Karte: nach einer veröffentlichten Adresse oder Koordinaten, auf etwa {a} m genau.', wh_pin: 'Markierung auf der Karte: nach einer veröffentlichten Adresse oder Koordinaten.', wh_nopin: 'Markierung auf der Karte: keine, weil keine ausreichend genaue Adresse oder Koordinaten veröffentlicht sind.',
    wh_around: 'Was rund um das Grundstück liegt', wh_map: 'Markierung in OpenStreetMap öffnen', wh_mk: 'Alle Projekte in {mk}', wh_rank: 'Transparenz-Ranking: {p}',
    r6_h: 'Verwandte Projekte', r6_dev: 'gleicher Bauträger', r6_mk: 'auch in {mk}', r6_y: 'Fertigstellung {y}',
    q_tr: 'Welchen Transparenzwert hat {n}?', a_tr_x: 'Er zählt, was veröffentlicht und überprüfbar ist, nicht die Qualität.', q_plan: 'Wie sieht der Zahlungsplan von {n} aus?', a_plan: 'Veröffentlichter Zahlungsplan: {p}. Fragen Sie den Bauträger vor der Zahlung nach den aktuellen Bedingungen.', a_price0: 'Auf den gelesenen Seiten ist kein Preis veröffentlicht. Fragen Sie den Bauträger nach der aktuellen Preisliste.' },
  nl: { b: '{n} ervaringen', s1: ': ', s2: ', ', t_h: 'oplevering {h}', t_pn: 'vergunning gepubliceerd', t_f: '{n} ervaringen en feiten',
    d_lead: '{n} ervaringen en feiten{by}, {place}.', d_h: 'Oplevering zoals gepubliceerd: {h}.', d_h0: 'Geen opleverdatum gepubliceerd.', d_pn1: 'Vergunningsnummer gepubliceerd.', d_pn0: 'Vergunningsnummer niet gepubliceerd.', d_tr: 'Transparantiescore {s}/100.', d_nr: 'Nog niet beoordeeld; alleen feiten met bron.', d_chk: 'Gecontroleerd op {d}.',
    qa_w0: '{n} is een vastgoedproject in {place}.', qa_w0d: '{n} is een vastgoedproject in {place}, van {dev}.', qa_pn1: 'Er is een vergunningsnummer gepubliceerd.', qa_pn0: 'Er is geen vergunningsnummer gepubliceerd.',
    qa_tr: 'Transparantiescore: {s} van 100, plaats {r} van {m} in {p}.', qa_tr1: 'Transparantiescore: {s} van 100.', qa_cl: '{v} van de {c} geteste beweringen van de ontwikkelaar zijn bevestigd.', qa_chk: 'Laatst gecontroleerd: {d}.',
    h_when: 'Wanneer wordt {n} opgeleverd?', h_cost: 'Wat kost {n}?', h_who: 'Wie is de ontwikkelaar van {n}?', h_legit: 'Is {n} betrouwbaar? Wat we konden controleren', h_where: 'Waar ligt {n}?',
    toc_legit: 'Wat we konden controleren', toc_where: 'Locatie',
    lg_intro: 'Wat er over {n} gepubliceerd en controleerbaar is, punt voor punt, met de bron van elk. Dit is geen oordeel: Kolaboro plakt geen labels op projecten of ontwikkelaars. "Niet gepubliceerd" betekent dat we geen openbare bron vonden.',
    lg_sum: 'Gepubliceerd of bevestigd: {a} van de {b} punten die we konden controleren.', lg_m: 'Hoe de transparantiescore wordt berekend', lg_nr: 'Deze lijst is berekend uit openbare feiten; onze eigen beoordeling van dit project volgt nog.',
    c_read: 'Prijzen en betalingsschema zoals gepubliceerd op de pagina’s die we lazen (kopie van {d}).', c_price0: 'Prijs: niet gepubliceerd op de pagina’s die we lazen.', c_plan0: 'Betalingsschema: niet gepubliceerd op de pagina’s die we lazen.', c_plan: 'Gepubliceerd betalingsschema', c_dep: 'Aanbetaling',
    w_sum0: 'Opleverdatum in ons dossier: {h}. Niet verschoven in onze gegevens.', w_sum: 'Opleverdatum in ons dossier: {h}. Eerste datum in ons dossier: {a}. Geregistreerde verschuivingen: {k}.', w_none: 'Opleverdatum: niet gepubliceerd in de bronnen die we lazen.',
    who_l: '{n} wordt ontwikkeld door {dev}, volgens de pagina’s die we lazen.', who_k: 'Projecten van {dev} die we volgen: {k}.', who_none: 'De ontwikkelaar wordt niet genoemd in de bronnen die we lazen.',
    wh_place: 'Gepubliceerde locatie: {place}.', wh_pin_a: 'Punt op de kaart: op basis van een gepubliceerd adres of coördinaten, nauwkeurig tot ongeveer {a} m.', wh_pin: 'Punt op de kaart: op basis van een gepubliceerd adres of coördinaten.', wh_nopin: 'Punt op de kaart: geen, omdat er geen voldoende nauwkeurig adres of coördinaten zijn gepubliceerd.',
    wh_around: 'Wat er rond het perceel ligt', wh_map: 'Het punt openen in OpenStreetMap', wh_mk: 'Alle projecten in {mk}', wh_rank: 'Transparantieranglijst: {p}',
    r6_h: 'Gerelateerde projecten', r6_dev: 'zelfde ontwikkelaar', r6_mk: 'ook in {mk}', r6_y: 'oplevering {y}',
    q_tr: 'Wat is de transparantiescore van {n}?', a_tr_x: 'Die telt wat gepubliceerd en controleerbaar is, niet de kwaliteit.', q_plan: 'Wat is het betalingsschema van {n}?', a_plan: 'Gepubliceerd betalingsschema: {p}. Vraag de ontwikkelaar naar de actuele voorwaarden voordat u betaalt.', a_price0: 'Op de pagina’s die we lazen staat geen prijs. Vraag de ontwikkelaar om de actuele prijslijst.' },
  ru: { b: '{n}: отзывы', s1: ', ', s2: ', ', t_h: 'сдача: {h}', t_pn: 'разрешение опубликовано', t_f: '{n}: отзывы и факты',
    d_lead: '{n}: отзывы и факты{by}, {place}.', d_h: 'Срок сдачи по публикации: {h}.', d_h0: 'Срок сдачи не опубликован.', d_pn1: 'Номер разрешения опубликован.', d_pn0: 'Номер разрешения не опубликован.', d_tr: 'Оценка прозрачности {s}/100.', d_nr: 'Ещё не проверен нами; только факты с источниками.', d_chk: 'Проверено {d}.',
    qa_w0: '{n}: проект недвижимости, {place}.', qa_w0d: '{n}: проект недвижимости, {place}, застройщик {dev}.', qa_pn1: 'Номер разрешения опубликован.', qa_pn0: 'Номер разрешения не опубликован.',
    qa_tr: 'Оценка прозрачности: {s} из 100, место {r} из {m} в рейтинге «{p}».', qa_tr1: 'Оценка прозрачности: {s} из 100.', qa_cl: 'Подтверждено заявлений застройщика из проверенных нами: {v} из {c}.', qa_chk: 'Последняя проверка: {d}.',
    h_when: 'Когда сдадут {n}?', h_cost: 'Сколько стоит {n}?', h_who: 'Кто застройщик {n}?', h_legit: 'Можно ли доверять {n}? Что мы смогли проверить', h_where: 'Где находится {n}?',
    toc_legit: 'Что мы смогли проверить', toc_where: 'Расположение',
    lg_intro: 'Что опубликовано и проверяемо о {n}, пункт за пунктом, с источником для каждого. Это не вердикт: Kolaboro не присваивает ярлыков проектам и застройщикам. «Не опубликовано» значит, что мы не нашли публичного источника.',
    lg_sum: 'Опубликовано или подтверждено пунктов из тех, что мы смогли проверить: {a} из {b}.', lg_m: 'Как считается оценка прозрачности', lg_nr: 'Этот список рассчитан по публичным фактам; наша собственная проверка проекта ещё не проведена.',
    c_read: 'Цены и график платежей в том виде, как они опубликованы на прочитанных страницах (копия от {d}).', c_price0: 'Цена: не опубликована на прочитанных страницах.', c_plan0: 'График платежей: не опубликован на прочитанных страницах.', c_plan: 'Опубликованный график платежей', c_dep: 'Задаток',
    w_sum0: 'Срок сдачи в наших данных: {h}. Не переносился.', w_sum: 'Срок сдачи в наших данных: {h}. Первый срок в наших данных: {a}. Переносов зафиксировано: {k}.', w_none: 'Срок сдачи: не опубликован в прочитанных источниках.',
    who_l: 'Застройщик {n}: {dev}, по данным прочитанных страниц.', who_k: 'Проектов {dev}, которые мы отслеживаем: {k}.', who_none: 'Застройщик не назван в прочитанных источниках.',
    wh_place: 'Опубликованное расположение: {place}.', wh_pin_a: 'Точка на карте: по опубликованному адресу или координатам, точность около {a} м.', wh_pin: 'Точка на карте: по опубликованному адресу или координатам.', wh_nopin: 'Точка на карте: нет, так как достаточно точный адрес или координаты не опубликованы.',
    wh_around: 'Что находится вокруг участка', wh_map: 'Открыть точку в OpenStreetMap', wh_mk: 'Все проекты: {mk}', wh_rank: 'Рейтинг прозрачности: {p}',
    r6_h: 'Похожие проекты', r6_dev: 'тот же застройщик', r6_mk: 'тоже {mk}', r6_y: 'сдача {y}',
    q_tr: 'Какая оценка прозрачности у {n}?', a_tr_x: 'Она учитывает, что опубликовано и проверяемо, а не качество.', q_plan: 'Какой график платежей у {n}?', a_plan: 'Опубликованный график платежей: {p}. Уточните актуальные условия у застройщика до оплаты.', a_price0: 'На прочитанных страницах цена не опубликована. Запросите у застройщика актуальный прайс-лист.' },
  zh: { b: '{n}评价', s1: '：', s2: '，', t_h: '交付 {h}', t_pn: '许可证已公布', t_f: '{n}评价与事实',
    d_lead: '{n}评价与事实{by}，{place}。', d_h: '公布的交付时间：{h}。', d_h0: '未公布交付时间。', d_pn1: '已公布许可证编号。', d_pn0: '未公布许可证编号。', d_tr: '透明度评分 {s}/100。', d_nr: '尚未审核；仅列出有来源的事实。', d_chk: '核查于 {d}。',
    qa_w0: '{n}是位于{place}的房地产项目。', qa_w0d: '{n}是位于{place}的房地产项目，开发商为{dev}。', qa_pn1: '已公布许可证编号。', qa_pn0: '未公布许可证编号。',
    qa_tr: '透明度评分：{s}/100，在{p}排名第 {r}（共 {m} 个）。', qa_tr1: '透明度评分：{s}/100。', qa_cl: '在我们核查的 {c} 项开发商声明中，已确认 {v} 项。', qa_chk: '最近核查：{d}。',
    h_when: '{n}何时交付？', h_cost: '{n}多少钱？', h_who: '{n}的开发商是谁？', h_legit: '{n}可靠吗？我们能核查的内容', h_where: '{n}在哪里？',
    toc_legit: '我们能核查的内容', toc_where: '位置',
    lg_intro: '关于{n}已公布且可核查的内容，逐项列出，每项附来源。这不是结论：Kolaboro 不给项目或开发商贴标签。“未公布”表示我们没有找到公开来源。',
    lg_sum: '在我们能核查的 {b} 项中，已公布或已确认 {a} 项。', lg_m: '透明度评分的计算方法', lg_nr: '此清单根据公开事实计算；我们对该项目的审核尚未完成。',
    c_read: '价格和付款计划均按我们所读页面的公布内容列出（{d} 的存档副本）。', c_price0: '价格：我们阅读的页面未公布。', c_plan0: '付款计划：我们阅读的页面未公布。', c_plan: '公布的付款计划', c_dep: '定金',
    w_sum0: '记录的交付时间：{h}。我们的记录中未变更。', w_sum: '记录的交付时间：{h}。最早记录的时间：{a}。记录的变更次数：{k}。', w_none: '交付时间：我们阅读的来源未公布。',
    who_l: '根据我们阅读的页面，{n}的开发商为{dev}。', who_k: '我们跟踪的{dev}项目数：{k}。', who_none: '我们阅读的来源未写明开发商。',
    wh_place: '公布的区域：{place}。', wh_pin_a: '地图标记：依据公布的地址或坐标，精度约 {a} 米。', wh_pin: '地图标记：依据公布的地址或坐标。', wh_nopin: '地图标记：无，因为没有公布足够精确的地址或坐标。',
    wh_around: '地块周边有什么', wh_map: '在 OpenStreetMap 中打开标记', wh_mk: '{mk}的所有项目', wh_rank: '透明度排名：{p}',
    r6_h: '相关项目', r6_dev: '同一开发商', r6_mk: '同在{mk}', r6_y: '{y} 年交付',
    q_tr: '{n}的透明度评分是多少？', a_tr_x: '评分衡量的是已公布且可核查的内容，而非质量。', q_plan: '{n}的付款计划是什么？', a_plan: '公布的付款计划：{p}。付款前请向开发商确认当前条款。', a_price0: '我们阅读的页面未公布价格。请向开发商索取当前价目表。' },
  ar: { b: 'آراء {n}', s1: ': ', s2: '، ', t_h: 'التسليم {h}', t_pn: 'الترخيص منشور', t_f: 'آراء وحقائق عن {n}',
    d_lead: 'آراء وحقائق عن {n}{by}، {place}.', d_h: 'التسليم كما نُشر: {h}.', d_h0: 'لا يوجد موعد تسليم منشور.', d_pn1: 'رقم الترخيص منشور.', d_pn0: 'رقم الترخيص غير منشور.', d_tr: 'درجة الشفافية {s}/100.', d_nr: 'لم نراجعه بعد؛ حقائق موثّقة المصدر فقط.', d_chk: 'آخر فحص {d}.',
    qa_w0: '{n} مشروع عقاري في {place}.', qa_w0d: '{n} مشروع عقاري في {place}، المطوّر {dev}.', qa_pn1: 'رقم الترخيص منشور.', qa_pn0: 'لا يوجد رقم ترخيص منشور.',
    qa_tr: 'درجة الشفافية: {s} من 100، المرتبة {r} من {m} في {p}.', qa_tr1: 'درجة الشفافية: {s} من 100.', qa_cl: 'من بين ادعاءات المطوّر التي فحصناها ({c})، تأكّد منها: {v}.', qa_chk: 'آخر فحص: {d}.',
    h_when: 'متى يُسلَّم {n}؟', h_cost: 'كم سعر {n}؟', h_who: 'من هو مطوّر {n}؟', h_legit: 'هل {n} موثوق؟ ما الذي استطعنا التحقق منه', h_where: 'أين يقع {n}؟',
    toc_legit: 'ما استطعنا التحقق منه', toc_where: 'الموقع',
    lg_intro: 'ما هو منشور وقابل للتحقق عن {n}، بندًا بندًا، مع مصدر كل بند. هذا ليس حكمًا: لا تضع Kolaboro تصنيفات على المشاريع أو المطوّرين. "غير منشور" يعني أننا لم نجد مصدرًا عامًا.',
    lg_sum: 'منشور أو مؤكَّد: {a} من أصل {b} من البنود التي استطعنا التحقق منها.', lg_m: 'كيف تُحسب درجة الشفافية', lg_nr: 'تُحسب هذه القائمة من حقائق عامة؛ مراجعتنا الخاصة لهذا المشروع لم تتم بعد.',
    c_read: 'الأسعار وخطة الدفع كما نُشرت في الصفحات التي قرأناها (نسخة {d}).', c_price0: 'السعر: غير منشور في الصفحات التي قرأناها.', c_plan0: 'خطة الدفع: غير منشورة في الصفحات التي قرأناها.', c_plan: 'خطة الدفع المنشورة', c_dep: 'الدفعة المقدمة',
    w_sum0: 'موعد التسليم المسجّل: {h}. لم يتغير في سجلاتنا.', w_sum: 'موعد التسليم المسجّل: {h}. أول موعد مسجّل: {a}. عدد التغييرات المسجّلة: {k}.', w_none: 'موعد التسليم: غير منشور في المصادر التي قرأناها.',
    who_l: 'مطوّر {n} هو {dev}، وفق الصفحات التي قرأناها.', who_k: 'عدد مشاريع {dev} التي نتابعها: {k}.', who_none: 'لم يُذكر اسم المطوّر في المصادر التي قرأناها.',
    wh_place: 'المنطقة كما نُشرت: {place}.', wh_pin_a: 'العلامة على الخريطة: من عنوان أو إحداثيات منشورة، بدقة نحو {a} م.', wh_pin: 'العلامة على الخريطة: من عنوان أو إحداثيات منشورة.', wh_nopin: 'العلامة على الخريطة: لا توجد، لأنه لم يُنشر عنوان أو إحداثيات بدقة كافية.',
    wh_around: 'ما حول الموقع', wh_map: 'افتح العلامة في OpenStreetMap', wh_mk: 'كل المشاريع في {mk}', wh_rank: 'ترتيب الشفافية: {p}',
    r6_h: 'مشاريع ذات صلة', r6_dev: 'المطوّر نفسه', r6_mk: 'أيضًا في {mk}', r6_y: 'التسليم {y}',
    q_tr: 'ما درجة الشفافية لـ {n}؟', a_tr_x: 'تقيس ما هو منشور وقابل للتحقق، لا الجودة.', q_plan: 'ما خطة الدفع لـ {n}؟', a_plan: 'خطة الدفع المنشورة: {p}. اسأل المطوّر عن الشروط الحالية قبل الدفع.', a_price0: 'لا يوجد سعر منشور في الصفحات التي قرأناها. اطلب من المطوّر قائمة الأسعار الحالية.' }
};

// n27g (batch 27): search titles with the searched word and the year ("<project> reviews 2026: handover date, permit and developer"),
// an overdue handover in the title where it fits, descriptions that open with the fact few other pages give (handover date passed N
// months ago, date moved N times, no permit published), the dated overdue notice on project pages and developer titles with the year.
const S27 = {
  en: { ph_t: 'The handover date on record is {h}. An earlier date, {a}, is also on record (an earlier schedule or a first phase).', b_y: '{n} reviews {y}', t_lab: 'handover date, permit and developer', t_lab2: 'handover, permit, developer', t_ov: 'handover {mm} late', t_ov2: 'handover date passed',
    d_ov: 'Handover promised for {h}; that date passed {mm} ago.', d_mv: 'Handover date moved {k} times.', d_mv1: 'Handover date moved once.',
    ov_h: 'Handover date passed', ov_t: 'Promised for {h}. That date passed {mm} ago (as of {d}).', ov_st: 'Our latest research record (checked {c}): {st}.', ov_more: 'Overdue handovers in {p}', ov_all: 'All overdue handovers', upd_on: 'Updated {d}',
    td_y: '{dev} reviews {y}: projects, permits, delivery record', td_y2: '{dev} reviews {y}: projects and permits' },
  es: { ph_t: 'La fecha de entrega registrada es {h}. También consta una fecha anterior, {a} (un calendario anterior o una primera fase).', b_y: '{n} opiniones {y}', t_lab: 'fecha de entrega, permiso y promotor', t_lab2: 'entrega, permiso, promotor', t_ov: 'entrega con {mm} de retraso', t_ov2: 'fecha de entrega vencida',
    d_ov: 'Entrega prometida para {h}; esa fecha pasó hace {mm}.', d_mv: 'Fecha de entrega aplazada {k} veces.', d_mv1: 'Fecha de entrega aplazada una vez.',
    ov_h: 'Fecha de entrega vencida', ov_t: 'Prometida para {h}. Esa fecha pasó hace {mm} (a {d}).', ov_st: 'Nuestro último registro de investigación (revisado el {c}): {st}.', ov_more: 'Entregas vencidas en {p}', ov_all: 'Todas las entregas vencidas', upd_on: 'Actualizado el {d}',
    td_y: '{dev} opiniones {y}: proyectos, licencias y entregas', td_y2: '{dev} opiniones {y}: proyectos y licencias' },
  fr: { ph_t: 'La date de livraison enregistrée est {h}. Une date antérieure, {a}, figure aussi (un calendrier antérieur ou une première phase).', b_y: 'Avis {n} {y}', t_lab: 'date de livraison, permis et promoteur', t_lab2: 'livraison, permis, promoteur', t_ov: 'livraison en retard de {mm}', t_ov2: 'date de livraison dépassée',
    d_ov: 'Livraison promise pour {h} ; cette date est passée depuis {mm}.', d_mv: 'Date de livraison repoussée {k} fois.', d_mv1: 'Date de livraison repoussée une fois.',
    ov_h: 'Date de livraison dépassée', ov_t: 'Promise pour {h}. Cette date est passée depuis {mm} (au {d}).', ov_st: 'Notre dernière fiche de recherche (vérifiée le {c}) : {st}.', ov_more: 'Livraisons en retard : {p}', ov_all: 'Toutes les livraisons en retard', upd_on: 'Mis à jour le {d}',
    td_y: 'Avis {dev} {y} : projets, permis, livraisons', td_y2: 'Avis {dev} {y} : projets et permis' },
  de: { ph_t: 'Der erfasste Übergabetermin ist {h}. Erfasst ist auch ein früherer Termin, {a} (ein früherer Zeitplan oder eine erste Bauphase).', b_y: '{n} Erfahrungen {y}', t_lab: 'Übergabetermin, Genehmigung und Bauträger', t_lab2: 'Übergabe, Genehmigung, Bauträger', t_ov: 'Übergabe {mm} überfällig', t_ov2: 'Übergabetermin verstrichen',
    d_ov: 'Übergabe versprochen für {h}; der Termin ist seit {mm} verstrichen.', d_mv: 'Übergabetermin {k}-mal verschoben.', d_mv1: 'Übergabetermin einmal verschoben.',
    ov_h: 'Übergabetermin verstrichen', ov_t: 'Versprochen für {h}. Dieser Termin ist seit {mm} verstrichen (Stand {d}).', ov_st: 'Unser letzter Recherchestand (geprüft am {c}): {st}.', ov_more: 'Überfällige Übergaben: {p}', ov_all: 'Alle überfälligen Übergaben', upd_on: 'Aktualisiert am {d}',
    td_y: '{dev} Erfahrungen {y}: Projekte, Genehmigungen, Übergaben', td_y2: '{dev} Erfahrungen {y}: Projekte und Genehmigungen' },
  nl: { ph_t: 'De geregistreerde opleverdatum is {h}. Er staat ook een eerdere datum, {a} (een eerdere planning of een eerste fase).', b_y: '{n} ervaringen {y}', t_lab: 'opleverdatum, vergunning en ontwikkelaar', t_lab2: 'oplevering, vergunning, ontwikkelaar', t_ov: 'oplevering {mm} te laat', t_ov2: 'opleverdatum verstreken',
    d_ov: 'Oplevering beloofd voor {h}; die datum is {mm} geleden verstreken.', d_mv: 'Opleverdatum {k} keer verschoven.', d_mv1: 'Opleverdatum één keer verschoven.',
    ov_h: 'Opleverdatum verstreken', ov_t: 'Beloofd voor {h}. Die datum is {mm} geleden verstreken (stand {d}).', ov_st: 'Ons laatste onderzoeksverslag (gecontroleerd op {c}): {st}.', ov_more: 'Te late opleveringen in {p}', ov_all: 'Alle te late opleveringen', upd_on: 'Bijgewerkt op {d}',
    td_y: '{dev} ervaringen {y}: projecten, vergunningen, opleveringen', td_y2: '{dev} ervaringen {y}: projecten en vergunningen' },
  ru: { ph_t: 'Зафиксированный срок сдачи: {h}. Есть и более ранняя дата, {a} (прежний график или первая очередь).', b_y: '{n}: отзывы {y}', t_lab: 'срок сдачи, разрешение и застройщик', t_lab2: 'сдача, разрешение, застройщик', t_ov: 'сдача просрочена на {mm}', t_ov2: 'срок сдачи прошёл',
    d_ov: 'Сдача обещана на {h}; этот срок прошёл {mm} назад.', d_mv: 'Переносов срока сдачи: {k}.', d_mv1: 'Переносов срока сдачи: 1.',
    ov_h: 'Срок сдачи прошёл', ov_t: 'Обещанный срок: {h}. Он прошёл {mm} назад (на {d}).', ov_st: 'Наша последняя запись исследования (проверено {c}): {st}.', ov_more: 'Просроченная сдача: {p}', ov_all: 'Все просроченные сроки сдачи', upd_on: 'Обновлено {d}',
    td_y: '{dev}: отзывы {y}, проекты, разрешения, сроки сдачи', td_y2: '{dev}: отзывы {y}, проекты и разрешения' },
  zh: { ph_t: '登记的交付日期为{h}。记录中还有较早的日期{a}（之前的进度或第一期）。', b_y: '{n} {y}年评价', t_lab: '交付日期、许可证与开发商', t_lab2: '交付、许可证、开发商', t_ov: '交付逾期{mm}', t_ov2: '交付日期已过',
    d_ov: '承诺交付时间为{h}，该日期已过去{mm}。', d_mv: '交付日期已推迟 {k} 次。', d_mv1: '交付日期已推迟 1 次。',
    ov_h: '交付日期已过', ov_t: '承诺交付时间：{h}。该日期已过去{mm}（截至 {d}）。', ov_st: '我们最新的调研记录（核查于 {c}）：{st}。', ov_more: '{p}逾期交付的项目', ov_all: '所有逾期交付的项目', upd_on: '更新于 {d}',
    td_y: '{dev} {y}年评价：项目、许可证与交付记录', td_y2: '{dev} {y}年评价：项目与许可证' },
  ar: { ph_t: 'موعد التسليم المسجّل هو {h}. وهناك أيضًا موعد سابق مسجّل، {a} (جدول سابق أو مرحلة أولى).', b_y: 'آراء {n} {y}', t_lab: 'موعد التسليم والترخيص والمطوّر', t_lab2: 'التسليم والترخيص والمطوّر', t_ov: 'موعد التسليم فات منذ {mm}', t_ov2: 'موعد التسليم فات',
    d_ov: 'التسليم الموعود: {h}، وقد مضى على هذا الموعد {mm}.', d_mv: 'عدد مرات تأجيل موعد التسليم: {k}.', d_mv1: 'عدد مرات تأجيل موعد التسليم: 1.',
    ov_h: 'موعد التسليم فات', ov_t: 'الموعد الموعود: {h}. مضى على هذا الموعد {mm} (حتى {d}).', ov_st: 'سجل بحثنا الأحدث (فُحص في {c}): {st}.', ov_more: 'مواعيد تسليم فائتة في {p}', ov_all: 'كل مواعيد التسليم الفائتة', upd_on: 'آخر تحديث {d}',
    td_y: 'آراء {dev} {y}: المشاريع والتراخيص وسجل التسليم', td_y2: 'آراء {dev} {y}: المشاريع والتراخيص' }
};
for (const l of Object.keys(S27)) S[l] = Object.assign({}, S[l] || {}, S27[l]);
// "26 months" in the page language; cs: 'dat' for German "seit 26 Monaten", 'gen' for Arabic after "منذ"; f formats the number
const PR = {};
export function months(lang, m, cs, f) {
  const n = f ? f(m) : String(m);
  if (lang === 'es') return m === 1 ? n + ' mes' : n + ' meses';
  if (lang === 'fr') return n + ' mois';
  if (lang === 'de') return m === 1 ? n + ' Monat' : n + (cs === 'dat' ? ' Monaten' : ' Monate');
  if (lang === 'nl') return m === 1 ? n + ' maand' : n + ' maanden';
  if (lang === 'zh') return n + '个月';
  if (lang === 'ru' || lang === 'ar') {
    let k = 'other'; try { k = (PR[lang] = PR[lang] || new Intl.PluralRules(lang)).select(m); } catch (e) {}
    if (lang === 'ru') return n + (k === 'one' ? ' месяц' : k === 'few' ? ' месяца' : ' месяцев');
    return k === 'one' ? 'شهر واحد' : k === 'two' ? (cs === 'gen' ? 'شهرين' : 'شهران') : k === 'few' ? n + ' أشهر' : k === 'many' ? n + ' شهرًا' : n + ' شهر';
  }
  return m === 1 ? n + ' month' : n + ' months';
}
export function q(lang, k, v) {
  const s = (S[lang] && S[lang][k] != null) ? S[lang][k] : S.en[k];
  return v ? String(s).replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m).replace(/(?<!\.)\.\.(?=\s|$)/g, '.') : s;   // n25t: no "г.." when a date ends the sentence
}
const len = s => [...String(s)].length;

// Title under 60 characters: the searched word for the language, then the most clicked fact (handover date, "permit published"),
// then the brand, dropping from the end until it fits. A very long project name keeps only "<name> reviews".
export function qaTitle(lang, f) {
  const base = q(lang, 'b', { n: f.n }), facts = [f.h ? q(lang, 't_h', { h: f.h }) : null, f.pn ? q(lang, 't_pn') : null].filter(Boolean);
  const C = [];
  // n27g: "<name> reviews <year>: <overdue handover | handover date, permit and developer>", longest form that fits first
  const by = f.y ? q(lang, 'b_y', { n: f.n, y: f.y }) : base;
  if (f.y) {
    const lab = f.ov ? [q(lang, 't_ov', { mm: months(lang, f.ov, lang === 'ar' ? 'gen' : 'nom', f.nf) }), q(lang, 't_ov2')] : f.dn && f.dn[0] ? f.dn : [q(lang, 't_lab'), q(lang, 't_lab2')];   // n32s: f.dn, completed projects
    for (const l of lab) C.push(by + q(lang, 's1') + l + ' | Kolaboro', by + q(lang, 's1') + l);
  }
  for (let k = facts.length; k >= 1; k--) { const t = by + q(lang, 's1') + facts.slice(0, k).join(q(lang, 's2')); C.push(t + ' | Kolaboro', t); }
  if (f.y) C.push(by + ' | Kolaboro', by);
  C.push(q(lang, 't_f', { n: f.n }) + ' | Kolaboro', base + ' | Kolaboro', base);
  const n2 = String(f.n).replace(/\s*\([^)]*\)/g, '').trim();   // a long name without its bracketed part ("Meriva Collection (Gardens / Signature)")
  if (n2 && n2 !== f.n) { const b2 = q(lang, 'b', { n: n2 }); if (facts.length) C.push(b2 + q(lang, 's1') + facts[0] + ' | Kolaboro', b2 + q(lang, 's1') + facts[0]); C.push(b2 + ' | Kolaboro', b2); }
  const n3 = (n2 || String(f.n)).split(/,\s|\s[-\u2013]\s|\s\//)[0].trim();   // still too long: the name up to its first comma, dash or slash
  if (n3 && n3 !== n2 && n3 !== f.n) C.push(q(lang, 'b', { n: n3 }) + ' | Kolaboro', q(lang, 'b', { n: n3 }));
  const hit = C.find(t => len(t) <= 60); if (hit) return hit;
  // n25t: names of 50+ characters: drop the developer's name inside the project name, then words that describe rather than name
  // ("Private", "Resort and", "under construction"), then cut at a word boundary (never ending on "at", "in", "near"...).
  // The searched word ("reviews", "opiniones", "Erfahrungen"...) always stays.
  const nm = n2 || String(f.n), V = [];
  const dv = String(f.dv || '').replace(/\s+(global|group|properties|property|developments?|holdings?|land|bhd|berhad|ltd|llc|inc|plc|sa|sl|pjsc|psc|real estate)\.?$/i, '').trim();
  const drop = (t, rx) => t.replace(rx, ' ').replace(/\s{2,}/g, ' ').replace(/\s+([,)])/g, '$1').trim();
  let v = nm; if (dv.length > 3 && v.toLowerCase().includes(dv.toLowerCase()) && v.toLowerCase() !== dv.toLowerCase()) { v = drop(v, new RegExp(dv.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')); V.push(v); }
  for (const rx of [/\bunder construction\b/i, /\bresort and\b/i, /\bprivate\b/i]) { const w = drop(v, rx); if (w !== v && w.split(' ').length >= 2) { v = w; V.push(v); } }
  for (const w of V) C.push(q(lang, 'b', { n: w }) + ' | Kolaboro', q(lang, 'b', { n: w }));
  const hit2 = C.find(t => len(t) <= 60); if (hit2) return hit2;
  const room = 60 - (len(q(lang, 'b', { n: '' })));
  const W = v.split(' '), STOP = /^(at|in|near|by|on|of|the|and|with|from|for|under|to|de|del|la|el|y|-|–|,)$/i;
  for (let k = W.length - 1; k >= 2; k--) { const t = W.slice(0, k).join(' ').replace(/[,;:(]+$/, ''); if (STOP.test(W[k - 1]) || len(t) > room) continue; return q(lang, 'b', { n: t }); }
  return base;
}
// Description under 155 characters, most useful facts first; shorter place, then fewer facts until it fits.
export function qaDesc(lang, f) {
  const lead = (pl, by) => q(lang, 'd_lead', { n: f.n, by: by && f.by ? f.by : '', place: pl });
  // n27g: the description opens with the fact few other pages give: a handover date that passed, a date moved, no permit published
  const ov = f.ov && f.h ? q(lang, 'd_ov', { h: f.h, mm: months(lang, f.ov, lang === 'de' ? 'dat' : 'nom', f.nf) }) : null;
  const mv = !ov && f.mv ? q(lang, f.mv === 1 ? 'd_mv1' : 'd_mv', { k: f.nf ? f.nf(f.mv) : f.mv }) : null;
  const first = ov || mv || (f.pn ? null : q(lang, 'd_pn0'));
  const tail = [ov ? null : f.h ? q(lang, 'd_h', { h: f.h }) : q(lang, 'd_h0'), first && !ov && !mv ? null : q(lang, f.pn ? 'd_pn1' : 'd_pn0'), f.s != null ? q(lang, 'd_tr', { s: f.s }) : null, f.rv ? null : q(lang, 'd_nr'), q(lang, 'd_chk', { d: f.d })].filter(Boolean);
  const sp = lang === 'zh' ? '' : ' ', head = first ? [first] : [];
  const leads = [lead(f.place, true), lead(f.place, false), lead(f.place2, true), lead(f.place2, false), q(lang, 'b', { n: f.n }) + (lang === 'zh' ? '。' : '.')];
  for (const ld of leads) for (let k = tail.length; k >= 1; k--) {
    const t = head.concat([ld], tail.slice(0, k)).join(sp); if (len(t) <= 155) return t;
  }
  for (let k = tail.length; k >= 1; k--) { const t = head.concat(tail.slice(0, k)).join(sp); if (head.length && len(t) <= 155) return t; }
  const t = [lead(f.place2, false)].concat(tail.slice(0, 2)).join(sp);
  return len(t) <= 155 ? t : [...t].slice(0, 154).join('').replace(/\s+\S*$/, '') + '.';
}
// words in an English-style sentence (for the 40 to 60 word target of the quick answer; the same parts are used in every language)
export const words = s => String(s).split(/\s+/).filter(Boolean).length;
export const QA_CSS = '#legit .ktr-led{padding:0;list-style:none}#legit .ktr-led li{padding:6px 0;border-top:1px solid var(--k-line)}#legit small,.k6 small{color:var(--k-muted)}#legit .k-src{margin-inline-start:6px}.kqa-sum{font-weight:600}';
