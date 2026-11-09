// kolaboro.com batch 19 (agent n19b, 9 Nov 2026): money reality near the site. No model calls, nothing stored about visitors.
//   (3) Short-let reality check: Inside Airbnb listings (CC BY 4.0) within 1 km of the pin, for the cities Inside Airbnb covers:
//       counts by room type, nightly price quartiles of entire homes, Inside Airbnb's own occupancy and revenue estimates, next
//       to the rental yield or return figures printed on the page we track (quoted from our dated sealed copy).
//       Data: /data/short-lets.json (aggregates only, at least 10 listings per figure; no listing, host or review data).
//   (4) Recorded sale prices within 1 km from official open registers: HM Land Registry Price Paid (England and Wales, OGL v3.0),
//       France DVF geolocated (Licence Ouverte 2.0), NYC rolling sales (NYC Open Data); median, quartiles, price per m2 where the
//       register publishes floor area, versus the developer's own headline price (/data/price-history.json, same currency only).
//       Data: /data/sales-nearby.json. Both files are built on main by .github/workflows/kolaboro-money-nearby.yml
//       (tools/kolaboro-agent/money_nearby.py). Market-wide comparisons stay on /prices/ (kbx_h.js, price-reality.json).
// Routes:
//   GET /api/x/money/            coverage summary
//   GET /api/x/money/<ID>        short lets and recorded sales near one named project (public JSON)
const ORIGIN = 'https://kolaboro.com';
export const PATHS = /^\/api\/x\/money(\/|$)/;
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ltr = s => '<bdi dir="ltr">' + esc(s) + '</bdi>';
const OPINION = /\b(scam\w*|fraud\w*|ponzi|swindl\w*|rip-?off|avoid\w*|beware|dodgy|shady|crook\w*|estafa\w*|fraude\w*|betrug\w*|arnaque\w*|escroc\w*|oplicht\w*|bedrog\w*)\b|мошен|обман|骗局|诈骗|احتيال/i;
const MASK = s => String(s || '').replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[e-mail]').replace(/\+?\d[\d ()-]{8,}\d/g, m => /\d{1,3}([.,\s]\d{3}){2,}/.test(m) ? m : '[phone]');

let MEMO = {};
async function loadOne(env, path) {
  const m = MEMO[path]; if (m && Date.now() - m.t < 600000) return m.v;
  let r = null;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com' + path)); } catch (e) { r = null; }
  if (!r || !r.ok) { try { r = await fetch(ORIGIN + path + '?v=' + Math.floor(Date.now() / 600000), { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
  const v = r && r.ok ? await r.json().catch(() => null) : null;
  MEMO[path] = { t: Date.now(), v }; return v;
}
export async function moneyData(env) {
  const [sl, sn] = await Promise.all([loadOne(env, '/data/short-lets.json'), loadOne(env, '/data/sales-nearby.json')]);
  return { sl, sn, v: ((sl && sl.updated) || '') + '/' + ((sn && sn.updated) || '') };
}

// ------------------------------------------------------------------------------------------------ strings (8 languages)
const S = {
  en: { h: 'Rent and resale near the site', toc: 'Rent and resale',
    sl_h: 'Short lets within 1 km', sl_claim: 'The page we track says (copy of {d}):', sl_copy: 'our sealed copy', sl_noclaim: 'We found no rental yield or return figure on the page we track (copy of {d}).',
    sl_n: 'Listings within 1 km in the Inside Airbnb snapshot of {city} ({d}): {n}, of which {e} entire homes and {o} rooms.', sl_few: 'Fewer than {m} Inside Airbnb listings within 1 km of the pin ({city} snapshot of {d}), so we show no figures.',
    sl_price: 'Nightly price of entire homes: median {p50}, middle half {p25} to {p75} ({n} listings with a price that day).',
    sl_br: 'Median nightly price by bedrooms', sl_br_h: ['Bedrooms', 'Listings', 'Median per night'], sl_br0: 'studio or 1',
    sl_occ: 'Inside Airbnb occupancy estimate: median {p50} nights a year (about {pct}%), over {n} entire homes with at least one review in the last 12 months.',
    sl_act: 'Entire homes with at least one review in the last 12 months: {a} of {e}.', sl_rev: 'Inside Airbnb revenue estimate for those homes: median {p50} a year, middle half {p25} to {p75}.',
    sl_lic: 'Listings showing a licence or registration number: {l} of {n}.',
    sl_lim: 'These are other listings near the site, not a forecast for this project. Airbnb moves each map point up to 150 m and our pin is about 100 m accurate. Occupancy and revenue are Inside Airbnb\'s own estimates from reviews, not booking data.',
    sl_src: 'Inside Airbnb, {city} snapshot of {d}, licence CC BY 4.0', sl_method: 'how Inside Airbnb estimates occupancy',
    so_h: 'Recorded sale prices within 1 km', so_reg: 'From {reg}, sales recorded from {a} to {b}.',
    so_th: ['What was sold', 'Sales', 'Median price', 'Middle half'], so_all: 'All sales', so_flat: 'Flats', so_new: 'New builds', so_newflat: 'New-build flats', so_apt: 'Flats', so_house: 'Houses', so_vefa: 'Sold off-plan (VEFA)', so_condo: 'Condo units', so_coop: 'Co-op units', so_home: 'One- to three-family homes',
    so_m2: 'Price per m²: median {p50}, middle half {p25} to {p75} ({n} sales with a floor area).', so_m2_new: 'Off-plan sales (VEFA) per m²: median {p50} ({n} sales).', so_m2_home: 'Homes per m² of gross floor area: median {p50} ({n} sales).',
    so_nom2: 'This register does not publish floor area, so there is no price per m².', so_few: 'Fewer than {m} sales recorded within 1 km in this period, so we show no median.',
    so_dev: 'Headline price on the page we track: {p} (copy of {d}).', so_below: '{pct}% of the recorded {what} sales within 1 km were below that price.', so_dev_m2: 'Price per m² printed on the page we track: {p}{u} (copy of {d}).', so_sqft: ', per square foot, about {m2} per m²',
    so_what_flat: 'flat', so_what_all: '', so_what_condo: 'condo',
    so_lim: 'A headline "from" price is usually the cheapest unit and a new building, so it is not directly comparable with resales. The pin is about 100 m accurate and 1 km can mix very different streets.',
    so_skip: 'Registers of Scotland does not publish individual sale prices as free open data, so we show none for this site.', so_more: 'Market-wide comparison', json: 'Data as JSON', upd: 'updated {d}' },
  es: { h: 'Alquiler y reventa cerca del solar', toc: 'Alquiler y reventa',
    sl_h: 'Alquiler turístico a menos de 1 km', sl_claim: 'La página que seguimos dice (copia del {d}):', sl_copy: 'nuestra copia sellada', sl_noclaim: 'No encontramos ninguna cifra de rentabilidad o retorno en la página que seguimos (copia del {d}).',
    sl_n: 'Anuncios a menos de 1 km en la instantánea de Inside Airbnb de {city} ({d}): {n}, de ellos {e} viviendas completas y {o} habitaciones.', sl_few: 'Menos de {m} anuncios de Inside Airbnb a menos de 1 km del punto (instantánea de {city} del {d}), así que no mostramos cifras.',
    sl_price: 'Precio por noche de viviendas completas: mediana {p50}, mitad central {p25} a {p75} ({n} anuncios con precio ese día).',
    sl_br: 'Precio mediano por noche según dormitorios', sl_br_h: ['Dormitorios', 'Anuncios', 'Mediana por noche'], sl_br0: 'estudio o 1',
    sl_occ: 'Estimación de ocupación de Inside Airbnb: mediana de {p50} noches al año (cerca del {pct}%), sobre {n} viviendas completas con al menos una reseña en los últimos 12 meses.',
    sl_act: 'Viviendas completas con al menos una reseña en los últimos 12 meses: {a} de {e}.', sl_rev: 'Estimación de ingresos de Inside Airbnb para esas viviendas: mediana {p50} al año, mitad central {p25} a {p75}.',
    sl_lic: 'Anuncios que muestran un número de licencia o registro: {l} de {n}.',
    sl_lim: 'Son otros anuncios cerca del solar, no una previsión para este proyecto. Airbnb desplaza cada punto hasta 150 m y nuestro punto tiene unos 100 m de precisión. La ocupación y los ingresos son estimaciones de Inside Airbnb a partir de reseñas, no datos de reservas.',
    sl_src: 'Inside Airbnb, instantánea de {city} del {d}, licencia CC BY 4.0', sl_method: 'cómo estima Inside Airbnb la ocupación',
    so_h: 'Precios de venta registrados a menos de 1 km', so_reg: 'De {reg}, ventas registradas del {a} al {b}.',
    so_th: ['Qué se vendió', 'Ventas', 'Precio mediano', 'Mitad central'], so_all: 'Todas las ventas', so_flat: 'Pisos', so_new: 'Obra nueva', so_newflat: 'Pisos de obra nueva', so_apt: 'Pisos', so_house: 'Casas', so_vefa: 'Vendido sobre plano (VEFA)', so_condo: 'Unidades de condominio', so_coop: 'Unidades de cooperativa', so_home: 'Casas de una a tres familias',
    so_m2: 'Precio por m²: mediana {p50}, mitad central {p25} a {p75} ({n} ventas con superficie).', so_m2_new: 'Ventas sobre plano (VEFA) por m²: mediana {p50} ({n} ventas).', so_m2_home: 'Casas por m² de superficie bruta: mediana {p50} ({n} ventas).',
    so_nom2: 'Este registro no publica la superficie, así que no hay precio por m².', so_few: 'Menos de {m} ventas registradas a menos de 1 km en este periodo, así que no mostramos mediana.',
    so_dev: 'Precio destacado en la página que seguimos: {p} (copia del {d}).', so_below: 'El {pct}% de las ventas registradas de {what} a menos de 1 km estuvo por debajo de ese precio.', so_dev_m2: 'Precio por m² impreso en la página que seguimos: {p}{u} (copia del {d}).', so_sqft: ', por pie cuadrado, unos {m2} por m²',
    so_what_flat: 'pisos', so_what_all: 'viviendas', so_what_condo: 'condominios',
    so_lim: 'Un precio "desde" suele ser la unidad más barata de un edificio nuevo, así que no es directamente comparable con reventas. El punto tiene unos 100 m de precisión y 1 km puede mezclar calles muy distintas.',
    so_skip: 'Registers of Scotland no publica precios de venta individuales como datos abiertos gratuitos, así que no mostramos ninguno para este solar.', so_more: 'Comparación de todo el mercado', json: 'Datos en JSON', upd: 'actualizado el {d}' },
  fr: { h: 'Location et revente près du terrain', toc: 'Location et revente',
    sl_h: 'Locations de courte durée à moins de 1 km', sl_claim: 'La page que nous suivons indique (copie du {d}) :', sl_copy: 'notre copie scellée', sl_noclaim: 'Nous n\'avons trouvé aucun chiffre de rendement locatif ou de rentabilité sur la page que nous suivons (copie du {d}).',
    sl_n: 'Annonces à moins de 1 km dans l\'instantané Inside Airbnb de {city} ({d}) : {n}, dont {e} logements entiers et {o} chambres.', sl_few: 'Moins de {m} annonces Inside Airbnb à moins de 1 km du point (instantané de {city} du {d}) ; nous ne montrons donc aucun chiffre.',
    sl_price: 'Prix par nuit des logements entiers : médiane {p50}, moitié centrale {p25} à {p75} ({n} annonces avec un prix ce jour-là).',
    sl_br: 'Prix médian par nuit selon les chambres', sl_br_h: ['Chambres', 'Annonces', 'Médiane par nuit'], sl_br0: 'studio ou 1',
    sl_occ: 'Estimation d\'occupation d\'Inside Airbnb : médiane de {p50} nuits par an (environ {pct} %), sur {n} logements entiers avec au moins un avis sur les 12 derniers mois.',
    sl_act: 'Logements entiers avec au moins un avis sur les 12 derniers mois : {a} sur {e}.', sl_rev: 'Estimation de revenus d\'Inside Airbnb pour ces logements : médiane {p50} par an, moitié centrale {p25} à {p75}.',
    sl_lic: 'Annonces affichant un numéro de licence ou d\'enregistrement : {l} sur {n}.',
    sl_lim: 'Ce sont d\'autres annonces près du terrain, pas une prévision pour ce projet. Airbnb déplace chaque point jusqu\'à 150 m et notre point est précis à environ 100 m. L\'occupation et les revenus sont des estimations d\'Inside Airbnb fondées sur les avis, pas des données de réservation.',
    sl_src: 'Inside Airbnb, instantané de {city} du {d}, licence CC BY 4.0', sl_method: 'comment Inside Airbnb estime l\'occupation',
    so_h: 'Prix de vente enregistrés à moins de 1 km', so_reg: 'Source : {reg}, ventes enregistrées du {a} au {b}.',
    so_th: ['Bien vendu', 'Ventes', 'Prix médian', 'Moitié centrale'], so_all: 'Toutes les ventes', so_flat: 'Appartements', so_new: 'Logements neufs', so_newflat: 'Appartements neufs', so_apt: 'Appartements', so_house: 'Maisons', so_vefa: 'Vendu sur plan (VEFA)', so_condo: 'Lots en copropriété (condo)', so_coop: 'Parts de coopérative', so_home: 'Maisons d\'une à trois familles',
    so_m2: 'Prix au m² : médiane {p50}, moitié centrale {p25} à {p75} ({n} ventes avec une surface).', so_m2_new: 'Ventes sur plan (VEFA) au m² : médiane {p50} ({n} ventes).', so_m2_home: 'Maisons au m² de surface brute : médiane {p50} ({n} ventes).',
    so_nom2: 'Ce registre ne publie pas la surface ; il n\'y a donc pas de prix au m².', so_few: 'Moins de {m} ventes enregistrées à moins de 1 km sur cette période ; nous ne montrons donc pas de médiane.',
    so_dev: 'Prix affiché sur la page que nous suivons : {p} (copie du {d}).', so_below: '{pct} % des ventes enregistrées ({what}) à moins de 1 km étaient en dessous de ce prix.', so_dev_m2: 'Prix au m² imprimé sur la page que nous suivons : {p}{u} (copie du {d}).', so_sqft: ', au pied carré, soit environ {m2} au m²',
    so_what_flat: 'appartements', so_what_all: 'tous biens', so_what_condo: 'condos',
    so_lim: 'Un prix « à partir de » correspond en général au lot le moins cher d\'un immeuble neuf ; il n\'est donc pas directement comparable aux reventes. Le point est précis à environ 100 m et 1 km peut mêler des rues très différentes.',
    so_skip: 'Registers of Scotland ne publie pas les prix de vente individuels en données ouvertes gratuites ; nous n\'en montrons donc aucun pour ce terrain.', so_more: 'Comparaison sur tout le marché', json: 'Données en JSON', upd: 'mis à jour le {d}' },
  de: { h: 'Miete und Wiederverkauf in der Nähe', toc: 'Miete und Verkauf',
    sl_h: 'Kurzzeitvermietung im Umkreis von 1 km', sl_claim: 'Die von uns verfolgte Seite sagt (Kopie vom {d}):', sl_copy: 'unsere versiegelte Kopie', sl_noclaim: 'Auf der von uns verfolgten Seite fanden wir keine Angabe zu Mietrendite oder Ertrag (Kopie vom {d}).',
    sl_n: 'Inserate im Umkreis von 1 km im Inside-Airbnb-Stand für {city} ({d}): {n}, davon {e} ganze Unterkünfte und {o} Zimmer.', sl_few: 'Weniger als {m} Inside-Airbnb-Inserate im Umkreis von 1 km (Stand {city} vom {d}), daher zeigen wir keine Zahlen.',
    sl_price: 'Preis pro Nacht ganzer Unterkünfte: Median {p50}, mittlere Hälfte {p25} bis {p75} ({n} Inserate mit Preis an diesem Tag).',
    sl_br: 'Medianpreis pro Nacht nach Schlafzimmern', sl_br_h: ['Schlafzimmer', 'Inserate', 'Median pro Nacht'], sl_br0: 'Studio oder 1',
    sl_occ: 'Belegungsschätzung von Inside Airbnb: Median {p50} Nächte im Jahr (etwa {pct} %), über {n} ganze Unterkünfte mit mindestens einer Bewertung in den letzten 12 Monaten.',
    sl_act: 'Ganze Unterkünfte mit mindestens einer Bewertung in den letzten 12 Monaten: {a} von {e}.', sl_rev: 'Umsatzschätzung von Inside Airbnb für diese Unterkünfte: Median {p50} im Jahr, mittlere Hälfte {p25} bis {p75}.',
    sl_lic: 'Inserate mit Lizenz- oder Registriernummer: {l} von {n}.',
    sl_lim: 'Das sind andere Inserate in der Nähe, keine Prognose für dieses Projekt. Airbnb verschiebt jeden Kartenpunkt um bis zu 150 m, unser Punkt ist auf etwa 100 m genau. Belegung und Umsatz sind Schätzungen von Inside Airbnb aus Bewertungen, keine Buchungsdaten.',
    sl_src: 'Inside Airbnb, Stand {city} vom {d}, Lizenz CC BY 4.0', sl_method: 'wie Inside Airbnb die Belegung schätzt',
    so_h: 'Registrierte Verkaufspreise im Umkreis von 1 km', so_reg: 'Aus {reg}, Verkäufe registriert vom {a} bis {b}.',
    so_th: ['Was verkauft wurde', 'Verkäufe', 'Medianpreis', 'Mittlere Hälfte'], so_all: 'Alle Verkäufe', so_flat: 'Wohnungen', so_new: 'Neubauten', so_newflat: 'Neubauwohnungen', so_apt: 'Wohnungen', so_house: 'Häuser', so_vefa: 'Vom Plan verkauft (VEFA)', so_condo: 'Eigentumswohnungen (Condo)', so_coop: 'Genossenschaftsanteile (Co-op)', so_home: 'Ein- bis Dreifamilienhäuser',
    so_m2: 'Preis pro m²: Median {p50}, mittlere Hälfte {p25} bis {p75} ({n} Verkäufe mit Fläche).', so_m2_new: 'Verkäufe vom Plan (VEFA) pro m²: Median {p50} ({n} Verkäufe).', so_m2_home: 'Häuser pro m² Bruttofläche: Median {p50} ({n} Verkäufe).',
    so_nom2: 'Dieses Register veröffentlicht keine Fläche, daher gibt es keinen Preis pro m².', so_few: 'Weniger als {m} registrierte Verkäufe im Umkreis von 1 km in diesem Zeitraum, daher kein Median.',
    so_dev: 'Hauptpreis auf der von uns verfolgten Seite: {p} (Kopie vom {d}).', so_below: '{pct} % der registrierten Verkäufe ({what}) im Umkreis von 1 km lagen unter diesem Preis.', so_dev_m2: 'Preis pro m² auf der von uns verfolgten Seite: {p}{u} (Kopie vom {d}).', so_sqft: ', pro Quadratfuß, etwa {m2} pro m²',
    so_what_flat: 'Wohnungen', so_what_all: 'alle', so_what_condo: 'Condos',
    so_lim: 'Ein "ab"-Preis gilt meist für die günstigste Einheit eines Neubaus und ist daher nicht direkt mit Wiederverkäufen vergleichbar. Der Punkt ist auf etwa 100 m genau, und 1 km kann sehr unterschiedliche Straßen umfassen.',
    so_skip: 'Registers of Scotland veröffentlicht einzelne Verkaufspreise nicht als freie offene Daten, daher zeigen wir für diesen Standort keine.', so_more: 'Vergleich für den ganzen Markt', json: 'Daten als JSON', upd: 'aktualisiert am {d}' },
  nl: { h: 'Huur en doorverkoop bij de bouwplaats', toc: 'Huur en verkoop',
    sl_h: 'Kortetermijnverhuur binnen 1 km', sl_claim: 'De pagina die wij volgen zegt (kopie van {d}):', sl_copy: 'onze verzegelde kopie', sl_noclaim: 'We vonden geen huurrendement of opbrengstcijfer op de pagina die wij volgen (kopie van {d}).',
    sl_n: 'Advertenties binnen 1 km in de Inside Airbnb-momentopname van {city} ({d}): {n}, waarvan {e} hele woningen en {o} kamers.', sl_few: 'Minder dan {m} Inside Airbnb-advertenties binnen 1 km van het punt (momentopname {city} van {d}), dus we tonen geen cijfers.',
    sl_price: 'Prijs per nacht van hele woningen: mediaan {p50}, middelste helft {p25} tot {p75} ({n} advertenties met een prijs die dag).',
    sl_br: 'Mediane prijs per nacht naar slaapkamers', sl_br_h: ['Slaapkamers', 'Advertenties', 'Mediaan per nacht'], sl_br0: 'studio of 1',
    sl_occ: 'Bezettingsschatting van Inside Airbnb: mediaan {p50} nachten per jaar (ongeveer {pct}%), over {n} hele woningen met minstens één review in de laatste 12 maanden.',
    sl_act: 'Hele woningen met minstens één review in de laatste 12 maanden: {a} van {e}.', sl_rev: 'Omzetschatting van Inside Airbnb voor die woningen: mediaan {p50} per jaar, middelste helft {p25} tot {p75}.',
    sl_lic: 'Advertenties met een vergunnings- of registratienummer: {l} van {n}.',
    sl_lim: 'Dit zijn andere advertenties in de buurt, geen prognose voor dit project. Airbnb verschuift elk kaartpunt tot 150 m en ons punt is ongeveer 100 m nauwkeurig. Bezetting en omzet zijn schattingen van Inside Airbnb op basis van reviews, geen boekingsgegevens.',
    sl_src: 'Inside Airbnb, momentopname {city} van {d}, licentie CC BY 4.0', sl_method: 'hoe Inside Airbnb de bezetting schat',
    so_h: 'Geregistreerde verkoopprijzen binnen 1 km', so_reg: 'Uit {reg}, verkopen geregistreerd van {a} tot {b}.',
    so_th: ['Wat verkocht is', 'Verkopen', 'Mediane prijs', 'Middelste helft'], so_all: 'Alle verkopen', so_flat: 'Appartementen', so_new: 'Nieuwbouw', so_newflat: 'Nieuwbouwappartementen', so_apt: 'Appartementen', so_house: 'Huizen', so_vefa: 'Op plan verkocht (VEFA)', so_condo: 'Condo-eenheden', so_coop: 'Co-op-eenheden', so_home: 'Een- tot driegezinswoningen',
    so_m2: 'Prijs per m²: mediaan {p50}, middelste helft {p25} tot {p75} ({n} verkopen met oppervlakte).', so_m2_new: 'Verkopen op plan (VEFA) per m²: mediaan {p50} ({n} verkopen).', so_m2_home: 'Woningen per m² bruto vloeroppervlak: mediaan {p50} ({n} verkopen).',
    so_nom2: 'Dit register publiceert geen oppervlakte, dus er is geen prijs per m².', so_few: 'Minder dan {m} geregistreerde verkopen binnen 1 km in deze periode, dus geen mediaan.',
    so_dev: 'Hoofdprijs op de pagina die wij volgen: {p} (kopie van {d}).', so_below: '{pct}% van de geregistreerde verkopen ({what}) binnen 1 km lag onder die prijs.', so_dev_m2: 'Prijs per m² op de pagina die wij volgen: {p}{u} (kopie van {d}).', so_sqft: ', per vierkante voet, ongeveer {m2} per m²',
    so_what_flat: 'appartementen', so_what_all: 'alle', so_what_condo: 'condo\'s',
    so_lim: 'Een "vanaf"-prijs geldt meestal voor de goedkoopste eenheid van een nieuw gebouw en is dus niet direct vergelijkbaar met doorverkopen. Het punt is ongeveer 100 m nauwkeurig en 1 km kan heel verschillende straten omvatten.',
    so_skip: 'Registers of Scotland publiceert geen afzonderlijke verkoopprijzen als vrije open data, dus we tonen er geen voor deze plek.', so_more: 'Vergelijking voor de hele markt', json: 'Data als JSON', upd: 'bijgewerkt op {d}' },
  ru: { h: 'Аренда и перепродажа рядом с участком', toc: 'Аренда и продажи',
    sl_h: 'Краткосрочная аренда в радиусе 1 км', sl_claim: 'На странице, которую мы отслеживаем, сказано (копия от {d}):', sl_copy: 'наша запечатанная копия', sl_noclaim: 'На отслеживаемой странице мы не нашли цифр доходности аренды (копия от {d}).',
    sl_n: 'Объявлений в радиусе 1 км в срезе Inside Airbnb по городу {city} ({d}): {n}, из них {e} жильё целиком и {o} комнат.', sl_few: 'Меньше {m} объявлений Inside Airbnb в радиусе 1 км от точки (срез {city} от {d}), поэтому цифры не показываем.',
    sl_price: 'Цена за ночь жилья целиком: медиана {p50}, средняя половина от {p25} до {p75} ({n} объявлений с ценой в тот день).',
    sl_br: 'Медианная цена за ночь по числу спален', sl_br_h: ['Спальни', 'Объявления', 'Медиана за ночь'], sl_br0: 'студия или 1',
    sl_occ: 'Оценка загрузки Inside Airbnb: медиана {p50} ночей в год (около {pct}%), по {n} объектам целиком хотя бы с одним отзывом за последние 12 месяцев.',
    sl_act: 'Жильё целиком хотя бы с одним отзывом за последние 12 месяцев: {a} из {e}.', sl_rev: 'Оценка выручки Inside Airbnb для этих объектов: медиана {p50} в год, средняя половина от {p25} до {p75}.',
    sl_lic: 'Объявления с номером лицензии или регистрации: {l} из {n}.',
    sl_lim: 'Это другие объявления рядом с участком, а не прогноз для этого проекта. Airbnb сдвигает каждую точку на карте до 150 м, наша точка точна примерно до 100 м. Загрузка и выручка это оценки Inside Airbnb по отзывам, а не данные бронирований.',
    sl_src: 'Inside Airbnb, срез {city} от {d}, лицензия CC BY 4.0', sl_method: 'как Inside Airbnb оценивает загрузку',
    so_h: 'Зарегистрированные цены продаж в радиусе 1 км', so_reg: 'Источник: {reg}, продажи с {a} по {b}.',
    so_th: ['Что продано', 'Продажи', 'Медианная цена', 'Средняя половина'], so_all: 'Все продажи', so_flat: 'Квартиры', so_new: 'Новостройки', so_newflat: 'Квартиры в новостройках', so_apt: 'Квартиры', so_house: 'Дома', so_vefa: 'Продано на этапе строительства (VEFA)', so_condo: 'Кондоминиумы', so_coop: 'Кооперативные квартиры', so_home: 'Дома на одну-три семьи',
    so_m2: 'Цена за м²: медиана {p50}, средняя половина от {p25} до {p75} ({n} продаж с площадью).', so_m2_new: 'Продажи на этапе строительства (VEFA) за м²: медиана {p50} ({n} продаж).', so_m2_home: 'Дома за м² общей площади: медиана {p50} ({n} продаж).',
    so_nom2: 'Этот реестр не публикует площадь, поэтому цены за м² нет.', so_few: 'Меньше {m} зарегистрированных продаж в радиусе 1 км за этот период, поэтому медиану не показываем.',
    so_dev: 'Основная цена на отслеживаемой странице: {p} (копия от {d}).', so_below: '{pct}% зарегистрированных продаж ({what}) в радиусе 1 км были ниже этой цены.', so_dev_m2: 'Цена за м² на отслеживаемой странице: {p}{u} (копия от {d}).', so_sqft: ', за квадратный фут, около {m2} за м²',
    so_what_flat: 'квартиры', so_what_all: 'все', so_what_condo: 'кондоминиумы',
    so_lim: 'Цена «от» обычно относится к самому дешёвому лоту нового дома, поэтому её нельзя напрямую сравнивать с перепродажами. Точка точна примерно до 100 м, а в радиусе 1 км могут быть очень разные улицы.',
    so_skip: 'Registers of Scotland не публикует цены отдельных сделок как бесплатные открытые данные, поэтому для этого участка мы их не показываем.', so_more: 'Сравнение по всему рынку', json: 'Данные в JSON', upd: 'обновлено {d}' },
  zh: { h: '工地附近的租金与转售', toc: '租金与转售',
    sl_h: '1 公里内的短租', sl_claim: '我们跟踪的页面写道（{d} 的副本）：', sl_copy: '我们的封存副本', sl_noclaim: '在我们跟踪的页面上（{d} 的副本）未找到租金收益率或回报数字。',
    sl_n: 'Inside Airbnb {city} 快照（{d}）中定位点 1 公里内的房源：{n} 个，其中整套房源 {e} 个，房间 {o} 个。', sl_few: '定位点 1 公里内的 Inside Airbnb 房源少于 {m} 个（{city} 快照，{d}），因此不显示数字。',
    sl_price: '整套房源每晚价格：中位数 {p50}，中间一半为 {p25} 至 {p75}（当天有价格的房源 {n} 个）。',
    sl_br: '按卧室数的每晚价格中位数', sl_br_h: ['卧室', '房源', '每晚中位数'], sl_br0: '开间或 1 间',
    sl_occ: 'Inside Airbnb 入住率估算：中位数每年 {p50} 晚（约 {pct}%），基于过去 12 个月至少有一条评价的 {n} 个整套房源。',
    sl_act: '过去 12 个月至少有一条评价的整套房源：{e} 个中的 {a} 个。', sl_rev: 'Inside Airbnb 对这些房源的收入估算：中位数每年 {p50}，中间一半为 {p25} 至 {p75}。',
    sl_lic: '显示许可证或登记号的房源：{n} 个中的 {l} 个。',
    sl_lim: '这些是工地附近的其他房源，不是对本项目的预测。Airbnb 会把每个地图点移动最多 150 米，我们的定位点精度约 100 米。入住率和收入是 Inside Airbnb 根据评价得出的估算，不是预订数据。',
    sl_src: 'Inside Airbnb，{city} 快照，{d}，许可 CC BY 4.0', sl_method: 'Inside Airbnb 如何估算入住率',
    so_h: '1 公里内登记的成交价格', so_reg: '来源：{reg}，登记于 {a} 至 {b} 的成交。',
    so_th: ['成交类型', '成交数', '价格中位数', '中间一半'], so_all: '全部成交', so_flat: '公寓', so_new: '新建房屋', so_newflat: '新建公寓', so_apt: '公寓', so_house: '独立屋', so_vefa: '期房成交（VEFA）', so_condo: '共管公寓单元', so_coop: '合作公寓单元', so_home: '一至三户住宅',
    so_m2: '每平方米价格：中位数 {p50}，中间一半为 {p25} 至 {p75}（有面积的成交 {n} 笔）。', so_m2_new: '期房成交（VEFA）每平方米：中位数 {p50}（{n} 笔）。', so_m2_home: '住宅按总建筑面积每平方米：中位数 {p50}（{n} 笔）。',
    so_nom2: '该登记册不公布面积，因此没有每平方米价格。', so_few: '此期间 1 公里内登记的成交少于 {m} 笔，因此不显示中位数。',
    so_dev: '我们跟踪的页面上的标题价格：{p}（{d} 的副本）。', so_below: '1 公里内登记的{what}成交中有 {pct}% 低于该价格。', so_dev_m2: '我们跟踪的页面上印出的每平方米价格：{p}{u}（{d} 的副本）。', so_sqft: '，按平方英尺，约合每平方米 {m2}',
    so_what_flat: '公寓', so_what_all: '', so_what_condo: '共管公寓',
    so_lim: '"起价"通常是新楼中最便宜的单元，因此不能直接与转售价格比较。定位点精度约 100 米，1 公里范围内可能有差别很大的街道。',
    so_skip: 'Registers of Scotland 不以免费开放数据发布单笔成交价格，因此本工地不显示。', so_more: '全市场比较', json: 'JSON 数据', upd: '更新于 {d}' },
  ar: { h: 'الإيجار وإعادة البيع قرب الموقع', toc: 'الإيجار وإعادة البيع',
    sl_h: 'الإيجارات القصيرة ضمن 1 كم', sl_claim: 'تقول الصفحة التي نتابعها (نسخة {d}):', sl_copy: 'نسختنا المختومة', sl_noclaim: 'لم نجد أي رقم لعائد الإيجار أو العائد على الاستثمار في الصفحة التي نتابعها (نسخة {d}).',
    sl_n: 'الإعلانات ضمن 1 كم في لقطة Inside Airbnb لمدينة {city} ({d}): {n}، منها {e} منازل كاملة و{o} غرف.', sl_few: 'أقل من {m} إعلانات من Inside Airbnb ضمن 1 كم من النقطة (لقطة {city} بتاريخ {d})، لذا لا نعرض أرقامًا.',
    sl_price: 'سعر الليلة للمنازل الكاملة: الوسيط {p50}، والنصف الأوسط من {p25} إلى {p75} ({n} إعلانًا بسعر في ذلك اليوم).',
    sl_br: 'وسيط سعر الليلة حسب غرف النوم', sl_br_h: ['غرف النوم', 'الإعلانات', 'الوسيط لليلة'], sl_br0: 'استوديو أو 1',
    sl_occ: 'تقدير الإشغال من Inside Airbnb: الوسيط {p50} ليلة في السنة (نحو {pct}%)، على {n} منزلًا كاملًا لديه مراجعة واحدة على الأقل في آخر 12 شهرًا.',
    sl_act: 'المنازل الكاملة التي لديها مراجعة واحدة على الأقل في آخر 12 شهرًا: {a} من {e}.', sl_rev: 'تقدير الإيرادات من Inside Airbnb لهذه المنازل: الوسيط {p50} في السنة، والنصف الأوسط من {p25} إلى {p75}.',
    sl_lic: 'الإعلانات التي تعرض رقم ترخيص أو تسجيل: {l} من {n}.',
    sl_lim: 'هذه إعلانات أخرى قرب الموقع، وليست توقعًا لهذا المشروع. تحرّك Airbnb كل نقطة على الخريطة حتى 150 م، ودقة نقطتنا نحو 100 م. الإشغال والإيرادات تقديرات من Inside Airbnb مبنية على المراجعات، لا على بيانات الحجوزات.',
    sl_src: 'Inside Airbnb، لقطة {city} بتاريخ {d}، الترخيص CC BY 4.0', sl_method: 'كيف تقدّر Inside Airbnb الإشغال',
    so_h: 'أسعار البيع المسجلة ضمن 1 كم', so_reg: 'المصدر: {reg}، مبيعات مسجلة من {a} إلى {b}.',
    so_th: ['ما بيع', 'المبيعات', 'وسيط السعر', 'النصف الأوسط'], so_all: 'كل المبيعات', so_flat: 'الشقق', so_new: 'المباني الجديدة', so_newflat: 'الشقق الجديدة', so_apt: 'الشقق', so_house: 'المنازل', so_vefa: 'بيع على المخطط (VEFA)', so_condo: 'وحدات الكوندو', so_coop: 'وحدات التعاونيات', so_home: 'منازل لأسرة إلى ثلاث أسر',
    so_m2: 'السعر للمتر المربع: الوسيط {p50}، والنصف الأوسط من {p25} إلى {p75} ({n} عملية بيع بمساحة).', so_m2_new: 'مبيعات على المخطط (VEFA) للمتر المربع: الوسيط {p50} ({n} عملية).', so_m2_home: 'المنازل للمتر المربع من المساحة الإجمالية: الوسيط {p50} ({n} عملية).',
    so_nom2: 'لا ينشر هذا السجل المساحة، لذا لا يوجد سعر للمتر المربع.', so_few: 'أقل من {m} عمليات بيع مسجلة ضمن 1 كم في هذه الفترة، لذا لا نعرض وسيطًا.',
    so_dev: 'السعر الرئيسي في الصفحة التي نتابعها: {p} (نسخة {d}).', so_below: '{pct}% من مبيعات {what} المسجلة ضمن 1 كم كانت أقل من هذا السعر.', so_dev_m2: 'السعر للمتر المربع المطبوع في الصفحة التي نتابعها: {p}{u} (نسخة {d}).', so_sqft: '، للقدم المربعة، أي نحو {m2} للمتر المربع',
    so_what_flat: 'الشقق', so_what_all: 'العقارات', so_what_condo: 'الكوندو',
    so_lim: 'سعر "يبدأ من" يكون عادة لأرخص وحدة في مبنى جديد، لذا لا يقارن مباشرة بإعادة البيع. دقة النقطة نحو 100 م، وقد يجمع نطاق 1 كم شوارع مختلفة جدًا.',
    so_skip: 'لا ينشر Registers of Scotland أسعار البيع الفردية كبيانات مفتوحة مجانية، لذا لا نعرض أيًا منها لهذا الموقع.', so_more: 'مقارنة على مستوى السوق', json: 'البيانات بصيغة JSON', upd: 'حُدّث في {d}' },
};
const t = (lang, k, v) => { const s = (S[lang] && S[lang][k] != null) ? S[lang][k] : S.en[k]; return v && typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
export const moneyToc = lang => t(lang, 'toc');
export const moneyHeading = lang => t(lang, 'h');
const fdt = (d, l) => { try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(String(d).slice(0, 10) + 'T00:00:00Z')); } catch (e) { return String(d || ''); } };
const fnum = (n, l) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { maximumFractionDigits: 0 }).format(n); } catch (e) { return String(n); } };
const fcur = (n, cur, l) => { if (n == null) return '-'; try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n); } catch (e) { return (cur || '') + ' ' + fnum(n, l); } };
// values go in as plain text, then numbers are wrapped in <bdi> so they read left to right on Arabic pages
const fill = (lang, k, v) => { const raw = {}, mark = {}; let i = 0; for (const [a, b] of Object.entries(v || {})) { const key = '\u0001' + (i++) + '\u0002'; raw[a] = key; mark[key] = b; } let s = esc(t(lang, k, raw)); for (const [key, b] of Object.entries(mark)) s = s.split(esc(key)).join(typeof b === 'object' && b && b.html ? b.html : ltr(b)); return s; };
const H = s => ({ html: s });
const ok = st => st && st.p50 != null;
const copyHref = (x, kind, ref, url) => kind === 'ia' ? 'https://web.archive.org/web/' + ref + '/' + url : '/projects/' + x.s + '/changes/' + ref + '.txt';

// ------------------------------------------------------------------------------------------------ short lets (3)
function shortletHtml(sl, x, lang) {
  const r = sl && sl.projects && sl.projects[x.id];
  if (!r || r.outside) return '';
  const ds = (sl.datasets || {})[r.ds] || {}, cur = r.cur || ds.currency, city = ds.city || '', d = fdt(ds.date, lang), e = r.e || {}, P = v => fcur(v, cur, lang);
  const src = '<a class="k-src" href="https://insideairbnb.com/get-the-data/" rel="noopener" target="_blank">' + esc(t(lang, 'sl_src', { city, d })) + '</a>';
  let h = '<h3>' + esc(t(lang, 'sl_h')) + '</h3>';
  if (r.claim && r.claim.q && r.claim.q.length) {
    const qs = r.claim.q.filter(q => !OPINION.test(q));
    if (qs.length) h += '<p class="kmo-l">' + esc(t(lang, 'sl_claim', { d: fdt(r.claim.d, lang) })) + '</p>' + qs.map(q => '<blockquote class="kmo-q" dir="auto">' + esc(MASK(q)) + '</blockquote>').join('') +
      '<p class="k-small"><a class="k-src" href="' + esc(copyHref(x, 'copy', r.claim.sha)) + '">' + esc(t(lang, 'sl_copy')) + '</a></p>';
  }
  else if (r.nocl) h += '<p class="kfact k-muted">' + esc(t(lang, 'sl_noclaim', { d: fdt(r.nocl, lang) })) + '</p>';
  if ((r.n || 0) < (sl.min_n || 10)) return h + '<p class="kfact k-muted">' + fill(lang, 'sl_few', { m: sl.min_n || 10, city, d }) + ' ' + src + '</p>';
  const rt = r.rt || {}, rooms = (rt['Private room'] || 0) + (rt['Shared room'] || 0) + (rt['Hotel room'] || 0);
  const L = [];
  L.push(fill(lang, 'sl_n', { city, d, n: fnum(r.n, lang), e: fnum(e.n || 0, lang), o: fnum(rooms, lang) }));
  if (ok(e.price)) L.push(fill(lang, 'sl_price', { p50: P(e.price.p50), p25: P(e.price.p25), p75: P(e.price.p75), n: fnum(e.price.n, lang) }));
  if (e.n) L.push(fill(lang, 'sl_act', { a: fnum(e.act || 0, lang), e: fnum(e.n, lang) }));
  if (ok(e.occ)) L.push(fill(lang, 'sl_occ', { p50: fnum(e.occ.p50, lang), pct: Math.round(e.occ.p50 / 365 * 100), n: fnum(e.occ.n, lang) }));
  if (ok(e.rev)) L.push(fill(lang, 'sl_rev', { p50: P(e.rev.p50), p25: P(e.rev.p25), p75: P(e.rev.p75) }));
  if (e.n && e.lic != null) L.push(fill(lang, 'sl_lic', { l: fnum(Math.min(e.lic, r.n), lang), n: fnum(r.n, lang) }));
  h += '<ul class="fl">' + L.map(s => '<li class="kfact">' + s + '</li>').join('') + '</ul>';
  const br = ['0-1', '2', '3+'].filter(g => e.br && ok(e.br[g])).map(g => [g, e.br[g]]);
  if (br.length) {
    const th = t(lang, 'sl_br_h');
    h += '<div class="k-table-wrap kmo-tw"><table class="k-table k-table--dense"><caption class="k-small k-muted">' + esc(t(lang, 'sl_br')) + '</caption><thead><tr><th scope="col">' + esc(th[0]) + '</th><th scope="col" class="k-n">' + esc(th[1]) + '</th><th scope="col" class="k-n">' + esc(th[2]) + '</th></tr></thead><tbody>' +
      br.map(([g, v]) => '<tr><th scope="row">' + esc(g === '0-1' ? t(lang, 'sl_br0') : g) + '</th><td class="k-n">' + ltr(fnum(v.n, lang)) + '</td><td class="k-n">' + ltr(P(v.p50)) + '</td></tr>').join('') + '</tbody></table></div>';
  }
  h += '<p class="k-small k-muted">' + esc(t(lang, 'sl_lim')) + ' ' + src + ' <a class="k-src" href="https://insideairbnb.com/data-assumptions/" rel="noopener" target="_blank">' + esc(t(lang, 'sl_method')) + '</a></p>';
  return h;
}

// ------------------------------------------------------------------------------------------------ recorded sales (4)
const ROWS = { hmlr: [['all', 'so_all'], ['flat', 'so_flat'], ['new', 'so_new'], ['new_flat', 'so_newflat']], dvf: [['all', 'so_all'], ['apt', 'so_apt'], ['house', 'so_house'], ['new', 'so_vefa']], nyc: [['all', 'so_all'], ['condo', 'so_condo'], ['coop', 'so_coop'], ['home', 'so_home']] };
function soldHtml(sn, x, lang) {
  const r = sn && sn.projects && sn.projects[x.id];
  if (!r) return '';
  let h = '<h3>' + esc(t(lang, 'so_h')) + '</h3>';
  if (r.skip) return r.skip === 'scotland' ? h + '<p class="kfact k-muted">' + esc(t(lang, 'so_skip')) + '</p>' : '';   // pin outside the register's area or not in the project's city: nothing to show
  const reg = (sn.registers || {})[r.reg]; if (!reg) return '';
  const cur = r.cur, P = v => fcur(v, cur, lang), m = sn.min_n || 10;
  const regA = '<a href="' + esc(reg.url) + '" rel="noopener" target="_blank">' + esc(reg.name) + '</a>';
  if (!r.all || !ok(r.all)) return h + '<p class="kfact k-muted">' + fill(lang, 'so_few', { m }) + ' ' + regA + '</p>';
  h += '<p class="kfact">' + fill(lang, 'so_reg', { reg: H(regA), a: fdt(r.from, lang), b: fdt(r.to, lang) }) + '</p>';
  const th = t(lang, 'so_th');
  const rows = (ROWS[r.reg] || []).filter(([k]) => r[k] && r[k].n);
  h += '<div class="k-table-wrap kmo-tw"><table class="k-table k-table--dense"><thead><tr><th scope="col">' + esc(th[0]) + '</th><th scope="col" class="k-n">' + esc(th[1]) + '</th><th scope="col" class="k-n">' + esc(th[2]) + '<br><small class="k-muted">' + esc(th[3]) + '</small></th></tr></thead><tbody>' +
    rows.map(([k, lbl]) => { const s = r[k]; return '<tr><th scope="row">' + esc(t(lang, lbl)) + '</th><td class="k-n">' + ltr(fnum(s.n, lang)) + '</td><td class="k-n">' + (ok(s) ? '<b>' + ltr(P(s.p50)) + '</b><br><small class="k-muted">' + ltr(P(s.p25)) + ' - ' + ltr(P(s.p75)) + '</small>' : '<span class="k-muted">-</span>') + '</td></tr>'; }).join('') + '</tbody></table></div>';
  const L = [];
  if (r.reg === 'dvf') {
    if (ok(r.m2)) L.push(fill(lang, 'so_m2', { p50: P(r.m2.p50), p25: P(r.m2.p25), p75: P(r.m2.p75), n: fnum(r.m2.n, lang) }));
    if (ok(r.new_m2)) L.push(fill(lang, 'so_m2_new', { p50: P(r.new_m2.p50), n: fnum(r.new_m2.n, lang) }));
  } else if (r.reg === 'nyc') { if (ok(r.home_m2)) L.push(fill(lang, 'so_m2_home', { p50: P(r.home_m2.p50), n: fnum(r.home_m2.n, lang) })); }
  else L.push(esc(t(lang, 'so_nom2')));
  if (r.dev && r.dev.v) {
    const a = '<a class="k-src" href="' + esc(copyHref(x, r.dev.src, r.dev.ref, x.url)) + '"' + (r.dev.src === 'ia' ? ' rel="nofollow noopener" target="_blank"' : '') + '>' + esc(t(lang, 'sl_copy')) + '</a>';
    let s = fill(lang, 'so_dev', { p: r.dev.p || P(r.dev.v), d: fdt(r.dev.d, lang) });
    if (r.dev.below_pct != null) s += ' ' + fill(lang, 'so_below', { pct: r.dev.below_pct, what: H(esc(t(lang, 'so_what_' + (r.dev.vs || 'all')))) }).replace(/\s{2,}/g, ' ');
    L.push(s + ' ' + a);
  }
  if (r.dev_m2 && r.dev_m2.v) {
    const a = '<a class="k-src" href="' + esc(copyHref(x, r.dev_m2.src, r.dev_m2.ref, x.url)) + '"' + (r.dev_m2.src === 'ia' ? ' rel="nofollow noopener" target="_blank"' : '') + '>' + esc(t(lang, 'sl_copy')) + '</a>';
    L.push(fill(lang, 'so_dev_m2', { p: r.dev_m2.p || P(r.dev_m2.v), u: H(r.dev_m2.unit === 'sqft' ? fill(lang, 'so_sqft', { m2: P(r.dev_m2.m2) }) : ''), d: fdt(r.dev_m2.d, lang) }) + ' ' + a);
  }
  if (L.length) h += '<ul class="fl">' + L.map(s => '<li class="kfact">' + s + '</li>').join('') + '</ul>';
  const geo = reg.geo ? ' <a class="k-src" href="' + esc(reg.geo.url) + '" rel="noopener" target="_blank">' + esc(reg.geo.name) + '</a>' : '';
  h += '<p class="k-small k-muted">' + esc(t(lang, 'so_lim')) + ' ' + esc(reg.credit || '') + ' <a class="k-src" href="' + esc(reg.licence_url) + '" rel="noopener" target="_blank">' + esc(reg.licence) + '</a>' + geo + '</p>';
  return h;
}

export const MONEY_CSS = '.kmo-q{margin:8px 0;padding:6px 14px;border-inline-start:3px solid var(--k-line-2,var(--line));color:var(--k-ink-2,var(--ink));font-size:var(--k-fs-sm,15px);overflow-wrap:anywhere}.kmo-l{margin:12px 0 4px;font-weight:600}' +
  '.kmo-tw{margin:12px 0;max-width:640px;overflow-x:auto}.kmo-tw caption{text-align:start;padding:0 0 6px;caption-side:top}.kmo-tw .k-n{text-align:end;white-space:nowrap}.kmo-tw th[scope=row]{min-width:0}@media (max-width:480px){.kmo-tw th,.kmo-tw td{padding-inline:8px}}.kmo .fl{overflow-wrap:anywhere}';

// whole section body for the named page ('' when nothing near this project)
export function moneyHtml(md, x, lang) {
  if (!md) return '';
  const a = shortletHtml(md.sl, x, lang), b = soldHtml(md.sn, x, lang);
  if (!a && !b) return '';
  return '<style>' + MONEY_CSS + '</style><div class="kmo">' + a + b + '<p class="k-small"><a href="/prices/">' + esc(t(lang, 'so_more')) + '</a> <a class="k-src" href="/api/x/money/' + esc(x.id) + '">' + esc(t(lang, 'json')) + '</a> <span class="k-muted">' + esc(t(lang, 'upd', { d: fdt(((md.sn && md.sn.updated) || (md.sl && md.sl.updated) || '').slice(0, 10), lang) })) + '</span></p></div>';
}

// ------------------------------------------------------------------------------------------------ API
const out = (o, s, cc) => new Response(JSON.stringify(o, null, 1), { status: s || 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cc || 'public, max-age=600', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' } });
export async function handle(req, u, env, ctx) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: 'method' }, 405, 'no-store');
  try {
    const md = await moneyData(env), sl = md.sl || {}, sn = md.sn || {};
    const m = u.pathname.match(/^\/api\/x\/money\/([A-Za-z0-9-]{3,20})\/?$/);
    if (!m) return out({ what: 'Short lets (Inside Airbnb) and recorded sale prices (official registers) within 1 km of each pinned named project.', short_lets: { updated: sl.updated, source: sl.source, method: sl.method, datasets: sl.datasets, summary: sl.summary, projects: Object.keys(sl.projects || {}).filter(k => !(sl.projects[k] || {}).outside) },
      recorded_sales: { updated: sn.updated, registers: sn.registers, method: sn.method, not_covered: sn.not_covered, summary: sn.summary, projects: Object.keys(sn.projects || {}) }, per_project: ORIGIN + '/api/x/money/<ID>', files: [ORIGIN + '/data/short-lets.json', ORIGIN + '/data/sales-nearby.json'] });
    const id = m[1].toUpperCase(), a = (sl.projects || {})[id], b = (sn.projects || {})[id];
    if (!a && !b) return out({ id, error: 'not_covered', note: 'Only projects with a plot-level pin in a city covered by Inside Airbnb or by an official open sales register are covered.' }, 404);
    const { data } = await import('./kbx_named.js'); const ix = await data(env).catch(() => null); const x = ix && ix.byId.get(id);
    return out({ id, name: x ? x.n : null, url: x ? ORIGIN + '/projects/' + x.s + '/#money' : null, radius_m: 1000,
      short_lets: a && !a.outside ? Object.assign({ dataset: Object.assign({ path: a.ds }, (sl.datasets || {})[a.ds] || {}), source: sl.source, updated: sl.updated }, a, { claim: a.claim ? Object.assign({}, a.claim, { copy: x ? ORIGIN + '/projects/' + x.s + '/changes/' + a.claim.sha + '.txt' : null }) : null }) : null,
      recorded_sales: b && (!b.skip || b.skip === 'scotland') ? Object.assign({ register: (sn.registers || {})[b.reg] || null, updated: sn.updated }, b) : null });
  } catch (e) { return out({ error: 'server' }, 500, 'no-store'); }
}
