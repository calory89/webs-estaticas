// kolaboro.com batch 21 (n21b): what living there is really like. No model calls, no keys, nothing fetched at request time.
// Data (built in tools/kolaboro-agent on main: around.py, climate.py, distance_claims.py; same projects and pins as /data/land-rules.json):
//   /data/around.json           nearest sea, beach, airport, runway end, hospital, school, supermarket and public transport stop from
//                               OpenStreetMap (ODbL, read from OpenFreeMap tiles), plus the yearly mean PM2.5 and NO2 of the CAMS global
//                               model (Copernicus Atmosphere Monitoring Service, from Open-Meteo's open data on AWS, CC BY 4.0)
//   /data/climate.json          1995-2014 against 2040-2059 at the pin: hot days, warm nights, rain and heavy-rain days, ensemble median
//                               and 10th to 90th percentile across models (World Bank Climate Change Knowledge Portal, CMIP6 0.25 degree, CC BY 4.0)
//   /data/distance-claims.json  distance and travel-time claims found in our sealed copy of the page, next to the measurement
// Shown on named project pages (kbx_named.js): section #around (with #distance-claims inside) and #climate.
// Routes: GET /api/x/around/<ID>  the three records of one project (public, cacheable)
//         GET /api/x/around/      about, sources and licences
const ORIGIN = 'https://kolaboro.com';
export const PATHS = /^\/api\/x\/around(\/|$)/;
let MEMO = {};
async function loadOne(env, name) {
  const m = MEMO[name]; if (m && Date.now() - m.t < 600000) return m.v;
  let r = null;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); } catch (e) { r = null; }
  if (!r || !r.ok) { try { r = await fetch(ORIGIN + '/data/' + name + '?w=1', { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
  const v = r && r.ok ? await r.json().catch(() => null) : null;
  MEMO[name] = { t: Date.now(), v }; return v;
}
export async function aroundData(env) {
  const [ar, cl, dc] = await Promise.all([loadOne(env, 'around.json'), loadOne(env, 'climate.json'), loadOne(env, 'distance-claims.json')]);
  return { ar, cl, dc, v: ((ar && ar.updated) || '') + '/' + ((cl && cl.updated) || '') + '/' + ((dc && dc.updated) || '') };
}
// the pin a project's record was measured from ("lat,lng"), for the pin-moved check in kbx_named.js
export const aroundPin = (ad, id) => { const r = ad && ad.ar && ad.ar.projects && ad.ar.projects[id]; return r ? r.pin : null; };

// ------------------------------------------------------------------------------------------------ strings (8 languages)
const S = {
  en: { h: "Around the site", toc: "Around the site", ch: "Climate at the plot: recent past and around 2050", ctoc: "Climate",
    intro: "Straight-line distances from the pin to the nearest place of each kind on OpenStreetMap (map data of {b}). The pin is about {a} m accurate.",
    coast: "Sea", beach: "Beach", airport: "Airport", runway: "Runway", hospital: "Hospital", school: "School", supermarket: "Supermarket", stop: "Public transport stop", rail: "Rail, metro or tram", air: "Air, {y} average",
    sea_in: "The pin falls on the sea as mapped. A mapped coastline can be older than reclaimed land.", none: "None mapped within {km} km.", u100: "under 100 m", noname: "no name on the map", map: "map",
    rw_u5: "A runway end is {d} away{w}. Under 5 km from a runway end, homes can lie below approach and departure paths. Ask which aircraft use it and for a noise map.", rw_far: "No runway end within 5 km. The nearest one mapped is {d} away.", rw_ref: "runway {r}", rw_anon: "The map gives no airfield name for it: it may be closed or private.",
    sk: { bus_stop: "bus stop", bus_station: "bus station", station: "rail station", tram_stop: "tram stop", subway: "metro station", ferry: "ferry terminal" },
    air_v: "PM2.5 {p} µg/m³, NO2 {n} µg/m³.", air_who: "The WHO guideline for a yearly average is 5 for PM2.5 and 10 for NO2.", air_lim: "Modelled for a cell of about 44 km, not measured at a station.", air_src: "CAMS via Open-Meteo open data, CC BY 4.0", who: "WHO 2021",
    lim: "Straight lines, not routes. OpenStreetMap is drawn by volunteers: a place can be missing, closed or wrongly tagged, and \"school\" covers every kind of school. Not checked here: noise, traffic, opening hours, admission rules.",
    osm: "OpenStreetMap contributors, ODbL", method: "method and data", upd: "updated {d}", hz: "natural hazards at any pin",
    c_h: "Distances the page states, next to the map", c_intro: "Quotes from our sealed copy of the page ({d}). Next to each, what OpenStreetMap data gives from the pin.", c_copy: "sealed copy", c_th1: "The page says", c_th2: "Measured from the pin",
    c_sl: "{d} in a straight line", c_car: "{d} by road, about {m} min by car without traffic", c_foot: "{d} on foot, about {m} min", c_none: "none mapped within {km} km", c_in: "the pin falls on it as mapped",
    cn: { beach: "Nearest mapped beach", coast: "The sea as mapped", airport: "Nearest airport", rail: "Nearest rail, metro or tram stop", stop: "Nearest public transport stop", hospital: "Nearest mapped hospital", school: "Nearest mapped school", supermarket: "Nearest mapped supermarket" },
    c_zero: "We found no distance or travel-time claim about a beach, the sea, an airport, a station, a hospital, a school or a supermarket in our copy of the page ({d}).",
    c_other: "The page also gives travel times to other named places, for example \"{q}\". We have not measured those.", c_nocopy: "We hold no sealed copy of this page's text, so no claim was read.", c_index: "The page we track lists several projects, so its distance claims are not read as this project's.",
    c_lim: "The nearest mapped place may not be the one the page means. Route times come from OSRM on OpenStreetMap data and ignore traffic, parking and waiting. Claims are found by fixed patterns, which can miss or misread one.", c_src: "OSRM, FOSSGIS server",
    cintro: "Climate model results for the grid cell at the pin (about 25 km wide). Each figure is the middle of the models. The range across models is in brackets.",
    col0: "Yearly average", col_h: "1995 to 2014", col_m: "2040 to 2059, middle path", col_x: "2040 to 2059, high emissions", scen: "Middle path is scenario SSP2-4.5. High emissions is SSP3-7.0.",
    hd35: "Days reaching 35 °C or more", tr: "Nights staying at 20 °C or more", pr: "Rain, mm", r20mm: "Days with 20 mm of rain or more", rg: "{a} to {b}",
    clim: "Model output for a cell of about 25 km, not a measurement at the plot. It does not see a sea breeze, a hillside or the heat of a built-up area. These are 20-year averages, so single years differ. Scenarios are not forecasts.",
    csrc: "World Bank Climate Change Knowledge Portal, CMIP6 0.25°, CC BY 4.0", csrc2: "built on NASA NEX-GDDP-CMIP6", cflood: "flood depth scenarios at any pin" },
  es: { h: "Alrededor de la obra", toc: "Alrededores", ch: "Clima en la parcela: pasado reciente y hacia 2050", ctoc: "Clima",
    intro: "Distancias en línea recta desde el punto hasta el lugar más cercano de cada tipo en OpenStreetMap (datos del mapa del {b}). El punto tiene unos {a} m de precisión.",
    coast: "Mar", beach: "Playa", airport: "Aeropuerto", runway: "Pista", hospital: "Hospital", school: "Colegio", supermarket: "Supermercado", stop: "Parada de transporte público", rail: "Tren, metro o tranvía", air: "Aire, media de {y}",
    sea_in: "El punto cae sobre el mar tal como está en el mapa. La costa del mapa puede ser anterior a un terreno ganado al mar.", none: "Ninguno en el mapa a menos de {km} km.", u100: "menos de 100 m", noname: "sin nombre en el mapa", map: "mapa",
    rw_u5: "Hay una cabecera de pista a {d}{w}. A menos de 5 km de una cabecera, las viviendas pueden quedar bajo las rutas de aproximación y despegue. Pregunte qué aeronaves la usan y pida un mapa de ruido.", rw_far: "Ninguna cabecera de pista a menos de 5 km. La más cercana del mapa está a {d}.", rw_ref: "pista {r}", rw_anon: "El mapa no da nombre de aeródromo para ella: puede estar cerrada o ser privada.",
    sk: { bus_stop: "parada de autobús", bus_station: "estación de autobuses", station: "estación de tren", tram_stop: "parada de tranvía", subway: "estación de metro", ferry: "terminal de ferry" },
    air_v: "PM2,5 {p} µg/m³, NO2 {n} µg/m³.", air_who: "La guía de la OMS para la media anual es 5 para PM2,5 y 10 para NO2.", air_lim: "Modelizado para una celda de unos 44 km, no medido en una estación.", air_src: "CAMS vía datos abiertos de Open-Meteo, CC BY 4.0", who: "OMS 2021",
    lim: "Líneas rectas, no rutas. OpenStreetMap lo dibujan voluntarios: un lugar puede faltar, estar cerrado o mal etiquetado, y \"colegio\" incluye cualquier tipo de centro. No se comprueba aquí: ruido, tráfico, horarios, normas de admisión.",
    osm: "Colaboradores de OpenStreetMap, ODbL", method: "método y datos", upd: "actualizado el {d}", hz: "riesgos naturales en cualquier punto",
    c_h: "Las distancias que da la página, junto al mapa", c_intro: "Citas de nuestra copia sellada de la página ({d}). Junto a cada una, lo que dan los datos de OpenStreetMap desde el punto.", c_copy: "copia sellada", c_th1: "La página dice", c_th2: "Medido desde el punto",
    c_sl: "{d} en línea recta", c_car: "{d} por carretera, unos {m} min en coche sin tráfico", c_foot: "{d} a pie, unos {m} min", c_none: "ninguno en el mapa a menos de {km} km", c_in: "el punto cae sobre él en el mapa",
    cn: { beach: "Playa más cercana en el mapa", coast: "El mar según el mapa", airport: "Aeropuerto más cercano", rail: "Parada de tren, metro o tranvía más cercana", stop: "Parada de transporte público más cercana", hospital: "Hospital más cercano en el mapa", school: "Colegio más cercano en el mapa", supermarket: "Supermercado más cercano en el mapa" },
    c_zero: "No encontramos en nuestra copia de la página ({d}) ninguna afirmación de distancia o tiempo sobre una playa, el mar, un aeropuerto, una estación, un hospital, un colegio o un supermercado.",
    c_other: "La página da además tiempos de viaje a otros lugares con nombre, por ejemplo \"{q}\". No los hemos medido.", c_nocopy: "No tenemos copia sellada del texto de esta página, así que no se leyó ninguna afirmación.", c_index: "La página que seguimos enumera varios proyectos, así que sus distancias no se leen como propias de este proyecto.",
    c_lim: "El lugar más cercano del mapa puede no ser el que quiere decir la página. Los tiempos de ruta vienen de OSRM sobre datos de OpenStreetMap y no cuentan tráfico, aparcamiento ni esperas. Las afirmaciones se buscan con patrones fijos, que pueden saltarse o leer mal alguna.", c_src: "OSRM, servidor de FOSSGIS",
    cintro: "Resultados de modelos climáticos para la celda de la cuadrícula donde está el punto (unos 25 km de ancho). Cada cifra es el valor central de los modelos. El rango entre modelos va entre paréntesis.",
    col0: "Media anual", col_h: "1995 a 2014", col_m: "2040 a 2059, senda intermedia", col_x: "2040 a 2059, emisiones altas", scen: "La senda intermedia es el escenario SSP2-4.5. Emisiones altas es SSP3-7.0.",
    hd35: "Días que llegan a 35 °C o más", tr: "Noches que no bajan de 20 °C", pr: "Lluvia, mm", r20mm: "Días con 20 mm de lluvia o más", rg: "{a} a {b}",
    clim: "Resultado de modelos para una celda de unos 25 km, no una medición en la parcela. No ve la brisa del mar, una ladera ni el calor de una zona edificada. Son medias de 20 años, así que cada año es distinto. Los escenarios no son pronósticos.",
    csrc: "Portal de Conocimiento sobre Cambio Climático del Banco Mundial, CMIP6 0,25°, CC BY 4.0", csrc2: "basado en NASA NEX-GDDP-CMIP6", cflood: "escenarios de inundación en cualquier punto" },
  fr: { h: "Autour du site", toc: "Autour du site", ch: "Climat sur la parcelle : passé récent et vers 2050", ctoc: "Climat",
    intro: "Distances à vol d'oiseau entre le point et le lieu le plus proche de chaque type sur OpenStreetMap (données de carte du {b}). Le point est précis à environ {a} m.",
    coast: "Mer", beach: "Plage", airport: "Aéroport", runway: "Piste", hospital: "Hôpital", school: "École", supermarket: "Supermarché", stop: "Arrêt de transport public", rail: "Train, métro ou tramway", air: "Air, moyenne {y}",
    sea_in: "Le point tombe sur la mer telle qu'elle est cartographiée. Le trait de côte de la carte peut être plus ancien qu'un terrain gagné sur la mer.", none: "Aucun sur la carte à moins de {km} km.", u100: "moins de 100 m", noname: "sans nom sur la carte", map: "carte",
    rw_u5: "Une extrémité de piste se trouve à {d}{w}. À moins de 5 km d'une extrémité de piste, des logements peuvent se trouver sous les trajectoires d'approche et de décollage. Demandez quels appareils l'utilisent et une carte de bruit.", rw_far: "Aucune extrémité de piste à moins de 5 km. La plus proche sur la carte est à {d}.", rw_ref: "piste {r}", rw_anon: "La carte ne donne pas de nom d'aérodrome pour elle : elle peut être fermée ou privée.",
    sk: { bus_stop: "arrêt de bus", bus_station: "gare routière", station: "gare", tram_stop: "arrêt de tramway", subway: "station de métro", ferry: "terminal de ferry" },
    air_v: "PM2,5 {p} µg/m³, NO2 {n} µg/m³.", air_who: "La valeur guide de l'OMS pour une moyenne annuelle est de 5 pour les PM2,5 et de 10 pour le NO2.", air_lim: "Modélisé pour une maille d'environ 44 km, non mesuré à une station.", air_src: "CAMS via les données ouvertes d'Open-Meteo, CC BY 4.0", who: "OMS 2021",
    lim: "Lignes droites, pas des itinéraires. OpenStreetMap est dessiné par des bénévoles : un lieu peut manquer, être fermé ou mal étiqueté, et « école » couvre tous les types d'établissement. Non vérifié ici : bruit, circulation, horaires, règles d'admission.",
    osm: "Contributeurs OpenStreetMap, ODbL", method: "méthode et données", upd: "mis à jour le {d}", hz: "risques naturels en tout point",
    c_h: "Les distances annoncées par la page, à côté de la carte", c_intro: "Citations de notre copie scellée de la page ({d}). En face, ce que donnent les données OpenStreetMap depuis le point.", c_copy: "copie scellée", c_th1: "La page dit", c_th2: "Mesuré depuis le point",
    c_sl: "{d} à vol d'oiseau", c_car: "{d} par la route, environ {m} min en voiture sans circulation", c_foot: "{d} à pied, environ {m} min", c_none: "aucun sur la carte à moins de {km} km", c_in: "le point tombe dessus sur la carte",
    cn: { beach: "Plage la plus proche sur la carte", coast: "La mer selon la carte", airport: "Aéroport le plus proche", rail: "Arrêt de train, métro ou tramway le plus proche", stop: "Arrêt de transport public le plus proche", hospital: "Hôpital le plus proche sur la carte", school: "École la plus proche sur la carte", supermarket: "Supermarché le plus proche sur la carte" },
    c_zero: "Nous n'avons trouvé dans notre copie de la page ({d}) aucune affirmation de distance ou de temps de trajet concernant une plage, la mer, un aéroport, une gare, un hôpital, une école ou un supermarché.",
    c_other: "La page donne aussi des temps de trajet vers d'autres lieux nommés, par exemple « {q} ». Nous ne les avons pas mesurés.", c_nocopy: "Nous n'avons pas de copie scellée du texte de cette page, donc aucune affirmation n'a été lue.", c_index: "La page que nous suivons présente plusieurs projets, donc ses distances ne sont pas lues comme celles de ce projet.",
    c_lim: "Le lieu le plus proche sur la carte n'est pas forcément celui dont parle la page. Les temps de trajet viennent d'OSRM sur les données OpenStreetMap et ignorent la circulation, le stationnement et l'attente. Les affirmations sont repérées par des motifs fixes, qui peuvent en manquer ou en mal lire une.", c_src: "OSRM, serveur FOSSGIS",
    cintro: "Résultats de modèles climatiques pour la maille de la grille où se trouve le point (environ 25 km de large). Chaque chiffre est la valeur centrale des modèles. L'écart entre modèles est entre parenthèses.",
    col0: "Moyenne annuelle", col_h: "1995 à 2014", col_m: "2040 à 2059, trajectoire médiane", col_x: "2040 à 2059, émissions élevées", scen: "La trajectoire médiane est le scénario SSP2-4.5. Émissions élevées : SSP3-7.0.",
    hd35: "Jours atteignant 35 °C ou plus", tr: "Nuits restant à 20 °C ou plus", pr: "Pluie, mm", r20mm: "Jours avec 20 mm de pluie ou plus", rg: "{a} à {b}",
    clim: "Résultat de modèles pour une maille d'environ 25 km, pas une mesure sur la parcelle. Il ne voit ni la brise de mer, ni un versant, ni la chaleur d'une zone bâtie. Ce sont des moyennes sur 20 ans : chaque année diffère. Les scénarios ne sont pas des prévisions.",
    csrc: "Portail de connaissances sur le changement climatique de la Banque mondiale, CMIP6 0,25°, CC BY 4.0", csrc2: "fondé sur NASA NEX-GDDP-CMIP6", cflood: "scénarios d'inondation en tout point" },
  de: { h: "Rund um das Grundstück", toc: "Umgebung", ch: "Klima am Grundstück: jüngste Vergangenheit und um 2050", ctoc: "Klima",
    intro: "Luftlinie vom Pin zum jeweils nächsten Ort jeder Art in OpenStreetMap (Kartendaten vom {b}). Der Pin ist auf etwa {a} m genau.",
    coast: "Meer", beach: "Strand", airport: "Flughafen", runway: "Start- und Landebahn", hospital: "Krankenhaus", school: "Schule", supermarket: "Supermarkt", stop: "Haltestelle", rail: "Bahn, U-Bahn oder Straßenbahn", air: "Luft, Mittel {y}",
    sea_in: "Der Pin liegt laut Karte im Meer. Die Küstenlinie der Karte kann älter sein als aufgeschüttetes Land.", none: "Keiner in der Karte innerhalb von {km} km.", u100: "unter 100 m", noname: "ohne Namen in der Karte", map: "Karte",
    rw_u5: "Ein Bahnende liegt {d} entfernt{w}. Näher als 5 km an einem Bahnende können Wohnungen unter An- und Abflugrouten liegen. Fragen Sie, welche Flugzeuge die Bahn nutzen, und nach einer Lärmkarte.", rw_far: "Kein Bahnende innerhalb von 5 km. Das nächste in der Karte liegt {d} entfernt.", rw_ref: "Bahn {r}", rw_anon: "Die Karte nennt dafür keinen Flugplatz: Die Bahn kann geschlossen oder privat sein.",
    sk: { bus_stop: "Bushaltestelle", bus_station: "Busbahnhof", station: "Bahnhof", tram_stop: "Straßenbahnhaltestelle", subway: "U-Bahn-Station", ferry: "Fähranleger" },
    air_v: "PM2,5 {p} µg/m³, NO2 {n} µg/m³.", air_who: "Der WHO-Richtwert für das Jahresmittel liegt bei 5 für PM2,5 und 10 für NO2.", air_lim: "Modelliert für eine Zelle von etwa 44 km, nicht an einer Station gemessen.", air_src: "CAMS über offene Daten von Open-Meteo, CC BY 4.0", who: "WHO 2021",
    lim: "Luftlinie, keine Routen. OpenStreetMap wird von Freiwilligen gezeichnet: Ein Ort kann fehlen, geschlossen oder falsch erfasst sein, und „Schule“ umfasst jede Schulart. Hier nicht geprüft: Lärm, Verkehr, Öffnungszeiten, Aufnahmeregeln.",
    osm: "OpenStreetMap-Mitwirkende, ODbL", method: "Methode und Daten", upd: "aktualisiert am {d}", hz: "Naturgefahren an jedem Punkt",
    c_h: "Entfernungen laut Seite, neben der Karte", c_intro: "Zitate aus unserer versiegelten Kopie der Seite ({d}). Daneben, was die OpenStreetMap-Daten vom Pin aus ergeben.", c_copy: "versiegelte Kopie", c_th1: "Die Seite sagt", c_th2: "Vom Pin gemessen",
    c_sl: "{d} Luftlinie", c_car: "{d} auf der Straße, etwa {m} Min. mit dem Auto ohne Verkehr", c_foot: "{d} zu Fuß, etwa {m} Min.", c_none: "keiner in der Karte innerhalb von {km} km", c_in: "der Pin liegt laut Karte darauf",
    cn: { beach: "Nächster Strand in der Karte", coast: "Das Meer laut Karte", airport: "Nächster Flughafen", rail: "Nächste Bahn-, U-Bahn- oder Straßenbahnhaltestelle", stop: "Nächste Haltestelle", hospital: "Nächstes Krankenhaus in der Karte", school: "Nächste Schule in der Karte", supermarket: "Nächster Supermarkt in der Karte" },
    c_zero: "In unserer Kopie der Seite ({d}) fanden wir keine Entfernungs- oder Fahrzeitangabe zu einem Strand, dem Meer, einem Flughafen, einem Bahnhof, einem Krankenhaus, einer Schule oder einem Supermarkt.",
    c_other: "Die Seite nennt außerdem Fahrzeiten zu anderen benannten Orten, zum Beispiel „{q}“. Diese haben wir nicht gemessen.", c_nocopy: "Wir haben keine versiegelte Kopie des Seitentexts, daher wurde keine Angabe gelesen.", c_index: "Die Seite, die wir verfolgen, führt mehrere Projekte auf. Ihre Entfernungsangaben werden daher nicht als Angaben dieses Projekts gelesen.",
    c_lim: "Der nächste Ort in der Karte muss nicht der sein, den die Seite meint. Fahrzeiten stammen von OSRM auf OpenStreetMap-Daten und berücksichtigen weder Verkehr noch Parken oder Warten. Angaben werden mit festen Mustern gesucht, die eine übersehen oder falsch lesen können.", c_src: "OSRM, FOSSGIS-Server",
    cintro: "Ergebnisse von Klimamodellen für die Gitterzelle am Pin (etwa 25 km breit). Jede Zahl ist der mittlere Wert der Modelle. Die Spanne zwischen den Modellen steht in Klammern.",
    col0: "Jahresmittel", col_h: "1995 bis 2014", col_m: "2040 bis 2059, mittlerer Pfad", col_x: "2040 bis 2059, hohe Emissionen", scen: "Der mittlere Pfad ist das Szenario SSP2-4.5. Hohe Emissionen: SSP3-7.0.",
    hd35: "Tage mit 35 °C oder mehr", tr: "Nächte, die nicht unter 20 °C fallen", pr: "Regen, mm", r20mm: "Tage mit 20 mm Regen oder mehr", rg: "{a} bis {b}",
    clim: "Modellergebnis für eine Zelle von etwa 25 km, keine Messung am Grundstück. Es sieht keine Seebrise, keinen Hang und nicht die Wärme bebauter Flächen. Es sind 20-Jahres-Mittel, einzelne Jahre weichen ab. Szenarien sind keine Vorhersagen.",
    csrc: "Climate Change Knowledge Portal der Weltbank, CMIP6 0,25°, CC BY 4.0", csrc2: "auf Basis von NASA NEX-GDDP-CMIP6", cflood: "Überflutungsszenarien an jedem Punkt" },
  nl: { h: "Rond de locatie", toc: "Omgeving", ch: "Klimaat op het perceel: recent verleden en rond 2050", ctoc: "Klimaat",
    intro: "Afstanden in rechte lijn van de pin tot de dichtstbijzijnde plek van elke soort op OpenStreetMap (kaartgegevens van {b}). De pin is op ongeveer {a} m nauwkeurig.",
    coast: "Zee", beach: "Strand", airport: "Luchthaven", runway: "Start- en landingsbaan", hospital: "Ziekenhuis", school: "School", supermarket: "Supermarkt", stop: "Halte openbaar vervoer", rail: "Trein, metro of tram", air: "Lucht, gemiddelde {y}",
    sea_in: "De pin valt volgens de kaart in zee. De kustlijn op de kaart kan ouder zijn dan opgespoten land.", none: "Geen op de kaart binnen {km} km.", u100: "minder dan 100 m", noname: "geen naam op de kaart", map: "kaart",
    rw_u5: "Een baaneinde ligt op {d}{w}. Binnen 5 km van een baaneinde kunnen woningen onder aanvlieg- en vertrekroutes liggen. Vraag welke vliegtuigen de baan gebruiken en naar een geluidskaart.", rw_far: "Geen baaneinde binnen 5 km. Het dichtstbijzijnde op de kaart ligt op {d}.", rw_ref: "baan {r}", rw_anon: "De kaart geeft er geen naam van een vliegveld bij: de baan kan gesloten of privé zijn.",
    sk: { bus_stop: "bushalte", bus_station: "busstation", station: "treinstation", tram_stop: "tramhalte", subway: "metrostation", ferry: "veerterminal" },
    air_v: "PM2,5 {p} µg/m³, NO2 {n} µg/m³.", air_who: "De WHO-richtwaarde voor een jaargemiddelde is 5 voor PM2,5 en 10 voor NO2.", air_lim: "Gemodelleerd voor een cel van ongeveer 44 km, niet gemeten bij een station.", air_src: "CAMS via open data van Open-Meteo, CC BY 4.0", who: "WHO 2021",
    lim: "Rechte lijnen, geen routes. OpenStreetMap wordt door vrijwilligers getekend: een plek kan ontbreken, gesloten zijn of verkeerd getagd, en \"school\" omvat elk soort school. Hier niet gecontroleerd: geluid, verkeer, openingstijden, toelatingsregels.",
    osm: "OpenStreetMap-bijdragers, ODbL", method: "methode en gegevens", upd: "bijgewerkt op {d}", hz: "natuurgevaren op elk punt",
    c_h: "Afstanden die de pagina noemt, naast de kaart", c_intro: "Citaten uit onze verzegelde kopie van de pagina ({d}). Ernaast wat de gegevens van OpenStreetMap vanaf de pin geven.", c_copy: "verzegelde kopie", c_th1: "De pagina zegt", c_th2: "Gemeten vanaf de pin",
    c_sl: "{d} in rechte lijn", c_car: "{d} over de weg, ongeveer {m} min met de auto zonder verkeer", c_foot: "{d} te voet, ongeveer {m} min", c_none: "geen op de kaart binnen {km} km", c_in: "de pin valt erop volgens de kaart",
    cn: { beach: "Dichtstbijzijnde strand op de kaart", coast: "De zee volgens de kaart", airport: "Dichtstbijzijnde luchthaven", rail: "Dichtstbijzijnde trein-, metro- of tramhalte", stop: "Dichtstbijzijnde halte", hospital: "Dichtstbijzijnde ziekenhuis op de kaart", school: "Dichtstbijzijnde school op de kaart", supermarket: "Dichtstbijzijnde supermarkt op de kaart" },
    c_zero: "In onze kopie van de pagina ({d}) vonden we geen afstands- of reistijdclaim over een strand, de zee, een luchthaven, een station, een ziekenhuis, een school of een supermarkt.",
    c_other: "De pagina noemt ook reistijden naar andere plekken met een naam, bijvoorbeeld \"{q}\". Die hebben we niet gemeten.", c_nocopy: "We hebben geen verzegelde kopie van de tekst van deze pagina, dus er is geen claim gelezen.", c_index: "De pagina die we volgen toont meerdere projecten, dus de afstandsclaims worden niet als die van dit project gelezen.",
    c_lim: "De dichtstbijzijnde plek op de kaart hoeft niet de plek te zijn die de pagina bedoelt. Reistijden komen van OSRM op gegevens van OpenStreetMap en houden geen rekening met verkeer, parkeren of wachten. Claims worden met vaste patronen gezocht, die er een kunnen missen of verkeerd lezen.", c_src: "OSRM, server van FOSSGIS",
    cintro: "Uitkomsten van klimaatmodellen voor de rastercel bij de pin (ongeveer 25 km breed). Elk cijfer is het midden van de modellen. De spreiding tussen modellen staat tussen haakjes.",
    col0: "Jaargemiddelde", col_h: "1995 tot 2014", col_m: "2040 tot 2059, middenpad", col_x: "2040 tot 2059, hoge uitstoot", scen: "Het middenpad is scenario SSP2-4.5. Hoge uitstoot is SSP3-7.0.",
    hd35: "Dagen van 35 °C of meer", tr: "Nachten die op 20 °C of meer blijven", pr: "Regen, mm", r20mm: "Dagen met 20 mm regen of meer", rg: "{a} tot {b}",
    clim: "Modeluitkomst voor een cel van ongeveer 25 km, geen meting op het perceel. Het ziet geen zeebries, geen helling en niet de warmte van bebouwd gebied. Het zijn gemiddelden over 20 jaar, losse jaren wijken af. Scenario's zijn geen voorspellingen.",
    csrc: "Climate Change Knowledge Portal van de Wereldbank, CMIP6 0,25°, CC BY 4.0", csrc2: "gebaseerd op NASA NEX-GDDP-CMIP6", cflood: "overstromingsscenario's op elk punt" },
  ru: { h: "Что вокруг участка", toc: "Вокруг", ch: "Климат на участке: недавнее прошлое и около 2050 года", ctoc: "Климат",
    intro: "Расстояния по прямой от точки до ближайшего места каждого вида в OpenStreetMap (данные карты от {b}). Точность точки около {a} м.",
    coast: "Море", beach: "Пляж", airport: "Аэропорт", runway: "Взлётная полоса", hospital: "Больница", school: "Школа", supermarket: "Супермаркет", stop: "Остановка транспорта", rail: "Поезд, метро или трамвай", air: "Воздух, среднее за {y}",
    sea_in: "По карте точка попадает в море. Береговая линия на карте может быть старше намытой земли.", none: "На карте нет в пределах {km} км.", u100: "менее 100 м", noname: "без названия на карте", map: "карта",
    rw_u5: "Торец полосы находится в {d}{w}. Ближе 5 км от торца полосы дома могут оказаться под маршрутами захода и взлёта. Спросите, какие самолёты ею пользуются, и попросите карту шума.", rw_far: "В пределах 5 км торцов полос нет. Ближайший на карте находится в {d}.", rw_ref: "полоса {r}", rw_anon: "На карте для неё нет названия аэродрома: полоса может быть закрытой или частной.",
    sk: { bus_stop: "автобусная остановка", bus_station: "автовокзал", station: "железнодорожная станция", tram_stop: "трамвайная остановка", subway: "станция метро", ferry: "паромный причал" },
    air_v: "PM2,5 {p} мкг/м³, NO2 {n} мкг/м³.", air_who: "Рекомендация ВОЗ для среднегодового значения: 5 для PM2,5 и 10 для NO2.", air_lim: "Расчёт модели для ячейки около 44 км, а не замер на станции.", air_src: "CAMS из открытых данных Open-Meteo, CC BY 4.0", who: "ВОЗ, 2021",
    lim: "Прямые линии, а не маршруты. OpenStreetMap рисуют добровольцы: место может отсутствовать, быть закрытым или неверно помеченным, а «школа» означает любую школу. Здесь не проверяются шум, пробки, часы работы и правила приёма.",
    osm: "Участники OpenStreetMap, ODbL", method: "метод и данные", upd: "обновлено {d}", hz: "природные риски в любой точке",
    c_h: "Расстояния, которые называет страница, рядом с картой", c_intro: "Цитаты из нашей опечатанной копии страницы ({d}). Рядом то, что дают данные OpenStreetMap от точки.", c_copy: "опечатанная копия", c_th1: "Страница говорит", c_th2: "Измерено от точки",
    c_sl: "{d} по прямой", c_car: "{d} по дороге, около {m} мин на машине без пробок", c_foot: "{d} пешком, около {m} мин", c_none: "на карте нет в пределах {km} км", c_in: "по карте точка попадает на него",
    cn: { beach: "Ближайший пляж на карте", coast: "Море по карте", airport: "Ближайший аэропорт", rail: "Ближайшая станция поезда, метро или трамвая", stop: "Ближайшая остановка транспорта", hospital: "Ближайшая больница на карте", school: "Ближайшая школа на карте", supermarket: "Ближайший супермаркет на карте" },
    c_zero: "В нашей копии страницы ({d}) мы не нашли утверждений о расстоянии или времени в пути до пляжа, моря, аэропорта, станции, больницы, школы или супермаркета.",
    c_other: "Страница также называет время в пути до других мест с названием, например «{q}». Их мы не измеряли.", c_nocopy: "У нас нет опечатанной копии текста этой страницы, поэтому утверждения не читались.", c_index: "Страница, за которой мы следим, перечисляет несколько проектов, поэтому её расстояния не читаются как относящиеся к этому проекту.",
    c_lim: "Ближайшее место на карте может быть не тем, которое имеет в виду страница. Время в пути считает OSRM по данным OpenStreetMap без пробок, парковки и ожидания. Утверждения ищутся по фиксированным шаблонам, которые могут пропустить или неверно прочитать одно из них.", c_src: "OSRM, сервер FOSSGIS",
    cintro: "Результаты климатических моделей для ячейки сетки в точке (ширина около 25 км). Каждое число: середина по моделям. В скобках разброс между моделями.",
    col0: "В среднем за год", col_h: "1995–2014", col_m: "2040–2059, средний путь", col_x: "2040–2059, высокие выбросы", scen: "Средний путь: сценарий SSP2-4.5. Высокие выбросы: SSP3-7.0.",
    hd35: "Дней с 35 °C и выше", tr: "Ночей не холоднее 20 °C", pr: "Осадки, мм", r20mm: "Дней с осадками 20 мм и более", rg: "{a}–{b}",
    clim: "Результат модели для ячейки около 25 км, а не замер на участке. Модель не видит морской бриз, склон или тепло застройки. Это средние за 20 лет, отдельные годы отличаются. Сценарии не являются прогнозами.",
    csrc: "Портал знаний об изменении климата Всемирного банка, CMIP6 0,25°, CC BY 4.0", csrc2: "на основе NASA NEX-GDDP-CMIP6", cflood: "сценарии наводнений в любой точке" },
  zh: { h: "项目周边", toc: "周边", ch: "地块气候：近期与 2050 年前后", ctoc: "气候",
    intro: "从定位点到 OpenStreetMap 上每类最近地点的直线距离（地图数据日期 {b}）。定位点精度约 {a} 米。",
    coast: "海", beach: "海滩", airport: "机场", runway: "跑道", hospital: "医院", school: "学校", supermarket: "超市", stop: "公共交通站点", rail: "火车、地铁或有轨电车", air: "空气，{y} 年平均",
    sea_in: "按地图，定位点落在海上。地图上的海岸线可能早于填海造地。", none: "地图上 {km} 公里内没有。", u100: "不到 100 米", noname: "地图上无名称", map: "地图",
    rw_u5: "一处跑道端距离 {d}{w}。距跑道端不到 5 公里时，住宅可能位于进近和起飞航线下方。请询问哪些飞机使用该跑道，并索取噪声图。", rw_far: "5 公里内没有跑道端。地图上最近的一处距离 {d}。", rw_ref: "跑道 {r}", rw_anon: "地图上没有标出它所属机场的名称：它可能已关闭或为私人所有。",
    sk: { bus_stop: "公交站", bus_station: "公交总站", station: "火车站", tram_stop: "有轨电车站", subway: "地铁站", ferry: "渡轮码头" },
    air_v: "PM2.5 {p} 微克/立方米，NO2 {n} 微克/立方米。", air_who: "世卫组织年均值指导值：PM2.5 为 5，NO2 为 10。", air_lim: "为约 44 公里网格的模型值，不是监测站实测。", air_src: "CAMS，来自 Open-Meteo 开放数据，CC BY 4.0", who: "世卫组织 2021",
    lim: "是直线，不是路线。OpenStreetMap 由志愿者绘制：地点可能缺失、已关闭或标注有误，“学校”包括各类学校。此处未核查：噪声、交通、开放时间、入学规定。",
    osm: "OpenStreetMap 贡献者，ODbL", method: "方法与数据", upd: "更新于 {d}", hz: "任意地点的自然灾害",
    c_h: "页面所说的距离与地图对照", c_intro: "引文来自我们封存的页面副本（{d}）。旁边是 OpenStreetMap 数据从定位点得出的结果。", c_copy: "封存副本", c_th1: "页面说法", c_th2: "从定位点测量",
    c_sl: "直线 {d}", c_car: "公路 {d}，不堵车开车约 {m} 分钟", c_foot: "步行 {d}，约 {m} 分钟", c_none: "地图上 {km} 公里内没有", c_in: "按地图，定位点就在其上",
    cn: { beach: "地图上最近的海滩", coast: "地图上的海", airport: "最近的机场", rail: "最近的火车、地铁或有轨电车站", stop: "最近的公共交通站点", hospital: "地图上最近的医院", school: "地图上最近的学校", supermarket: "地图上最近的超市" },
    c_zero: "在我们的页面副本（{d}）中，没有找到关于海滩、海、机场、车站、医院、学校或超市的距离或行程时间说法。",
    c_other: "页面还给出了到其他具名地点的行程时间，例如“{q}”。我们没有测量这些。", c_nocopy: "我们没有该页面文字的封存副本，因此没有读取任何说法。", c_index: "我们跟踪的页面列出了多个项目，因此不把其中的距离说法当作本项目的说法。",
    c_lim: "地图上最近的地点不一定是页面所指的那个。路线时间来自基于 OpenStreetMap 数据的 OSRM，不含拥堵、停车和等候。说法由固定规则查找，可能遗漏或误读。", c_src: "OSRM，FOSSGIS 服务器",
    cintro: "定位点所在网格（宽约 25 公里）的气候模型结果。每个数字是各模型的中间值，括号内是模型之间的范围。",
    col0: "年平均", col_h: "1995 至 2014", col_m: "2040 至 2059，中间路径", col_x: "2040 至 2059，高排放", scen: "中间路径为 SSP2-4.5 情景，高排放为 SSP3-7.0。",
    hd35: "达到 35 °C 及以上的天数", tr: "夜间不低于 20 °C 的天数", pr: "降雨量，毫米", r20mm: "降雨 20 毫米及以上的天数", rg: "{a} 至 {b}",
    clim: "这是约 25 公里网格的模型结果，不是地块实测。模型看不到海风、山坡或建成区的热量。这是 20 年平均值，单个年份会不同。情景不是预报。",
    csrc: "世界银行气候变化知识门户，CMIP6 0.25°，CC BY 4.0", csrc2: "基于 NASA NEX-GDDP-CMIP6", cflood: "任意地点的洪水深度情景" },
  ar: { h: "ما يحيط بالموقع", toc: "المحيط", ch: "المناخ عند قطعة الأرض: الماضي القريب وحوالي 2050", ctoc: "المناخ",
    intro: "مسافات بخط مستقيم من النقطة إلى أقرب مكان من كل نوع على OpenStreetMap (بيانات الخريطة بتاريخ {b}). دقة النقطة نحو {a} م.",
    coast: "البحر", beach: "الشاطئ", airport: "المطار", runway: "المدرج", hospital: "مستشفى", school: "مدرسة", supermarket: "سوبرماركت", stop: "موقف نقل عام", rail: "قطار أو مترو أو ترام", air: "الهواء، متوسط {y}",
    sea_in: "تقع النقطة على البحر بحسب الخريطة. قد يكون خط الساحل في الخريطة أقدم من أرض مردومة.", none: "لا يوجد على الخريطة ضمن {km} كم.", u100: "أقل من 100 م", noname: "بلا اسم على الخريطة", map: "الخريطة",
    rw_u5: "يبعد أحد طرفي مدرج {d}{w}. على أقل من 5 كم من طرف مدرج قد تقع المساكن تحت مسارات الاقتراب والإقلاع. اسأل عن الطائرات التي تستخدمه واطلب خريطة ضجيج.", rw_far: "لا يوجد طرف مدرج ضمن 5 كم. أقرب طرف على الخريطة يبعد {d}.", rw_ref: "المدرج {r}", rw_anon: "لا تذكر الخريطة اسم مطار له: قد يكون مغلقًا أو خاصًا.",
    sk: { bus_stop: "موقف حافلات", bus_station: "محطة حافلات", station: "محطة قطار", tram_stop: "موقف ترام", subway: "محطة مترو", ferry: "مرسى عبّارات" },
    air_v: "PM2.5 {p} ميكروغرام/م³، NO2 {n} ميكروغرام/م³.", air_who: "القيمة الإرشادية لمنظمة الصحة العالمية للمتوسط السنوي: 5 لـ PM2.5 و10 لـ NO2.", air_lim: "قيمة نموذج لخلية بعرض نحو 44 كم، وليست قياس محطة.", air_src: "CAMS عبر بيانات Open-Meteo المفتوحة، CC BY 4.0", who: "منظمة الصحة العالمية 2021",
    lim: "خطوط مستقيمة لا مسارات. يرسم OpenStreetMap متطوعون: قد يكون المكان غير موجود أو مغلقًا أو موسومًا خطأً، و«مدرسة» تشمل كل أنواع المدارس. لم نتحقق هنا من الضجيج أو الازدحام أو ساعات العمل أو شروط القبول.",
    osm: "مساهمو OpenStreetMap، ODbL", method: "المنهج والبيانات", upd: "حُدّث في {d}", hz: "المخاطر الطبيعية عند أي نقطة",
    c_h: "المسافات التي تذكرها الصفحة مقابل الخريطة", c_intro: "اقتباسات من نسختنا المختومة للصفحة ({d}). وبجانب كل منها ما تعطيه بيانات OpenStreetMap من النقطة.", c_copy: "النسخة المختومة", c_th1: "ما تقوله الصفحة", c_th2: "القياس من النقطة",
    c_sl: "{d} بخط مستقيم", c_car: "{d} بالطريق، نحو {m} دقيقة بالسيارة دون ازدحام", c_foot: "{d} مشيًا، نحو {m} دقيقة", c_none: "لا يوجد على الخريطة ضمن {km} كم", c_in: "تقع النقطة عليه بحسب الخريطة",
    cn: { beach: "أقرب شاطئ على الخريطة", coast: "البحر بحسب الخريطة", airport: "أقرب مطار", rail: "أقرب محطة قطار أو مترو أو ترام", stop: "أقرب موقف نقل عام", hospital: "أقرب مستشفى على الخريطة", school: "أقرب مدرسة على الخريطة", supermarket: "أقرب سوبرماركت على الخريطة" },
    c_zero: "لم نجد في نسختنا من الصفحة ({d}) أي ادعاء بمسافة أو زمن وصول إلى شاطئ أو البحر أو مطار أو محطة أو مستشفى أو مدرسة أو سوبرماركت.",
    c_other: "تذكر الصفحة أيضًا أزمنة وصول إلى أماكن أخرى مسماة، مثل «{q}». لم نقس هذه.", c_nocopy: "لا نملك نسخة مختومة من نص هذه الصفحة، لذا لم يُقرأ أي ادعاء.", c_index: "الصفحة التي نتابعها تعرض عدة مشاريع، لذا لا تُقرأ ادعاءات المسافة فيها على أنها تخص هذا المشروع.",
    c_lim: "أقرب مكان على الخريطة قد لا يكون ما تقصده الصفحة. أزمنة المسار من OSRM على بيانات OpenStreetMap ولا تشمل الازدحام أو الوقوف أو الانتظار. تُكتشف الادعاءات بأنماط ثابتة قد تفوّت ادعاءً أو تخطئ قراءته.", c_src: "OSRM، خادم FOSSGIS",
    cintro: "نتائج نماذج مناخية لخلية الشبكة عند النقطة (بعرض نحو 25 كم). كل رقم هو وسط النماذج، والمدى بين النماذج بين قوسين.",
    col0: "المتوسط السنوي", col_h: "1995 إلى 2014", col_m: "2040 إلى 2059، المسار المتوسط", col_x: "2040 إلى 2059، انبعاثات مرتفعة", scen: "المسار المتوسط هو السيناريو SSP2-4.5. الانبعاثات المرتفعة: SSP3-7.0.",
    hd35: "أيام تبلغ 35 °م أو أكثر", tr: "ليالٍ لا تنخفض عن 20 °م", pr: "المطر، مم", r20mm: "أيام بمطر 20 مم أو أكثر", rg: "{a} إلى {b}",
    clim: "ناتج نموذج لخلية بعرض نحو 25 كم، وليس قياسًا عند قطعة الأرض. لا يرى نسيم البحر ولا منحدرًا ولا حرارة منطقة مبنية. هذه متوسطات 20 سنة، والسنوات المنفردة تختلف. السيناريوهات ليست توقعات.",
    csrc: "بوابة المعرفة بتغير المناخ للبنك الدولي، CMIP6 0.25°، CC BY 4.0", csrc2: "مبني على NASA NEX-GDDP-CMIP6", cflood: "سيناريوهات عمق الفيضان عند أي نقطة" },
};
const t = (lang, k, v) => { const s = (S[lang] && S[lang][k]) || S.en[k]; return v && typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
const tm = (lang, k, key) => ((S[lang] && S[lang][k]) || {})[key] || (S.en[k] || {})[key] || null;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cm = lang => lang === 'ar' ? '، ' : lang === 'zh' ? '，' : ', ';
const okU = u => typeof u === 'string' && /^https:\/\/[^\s"<>]+$/.test(u);
export const aroundToc = lang => t(lang, 'toc');
export const aroundHeading = lang => t(lang, 'h');
export const climateToc = lang => t(lang, 'ctoc');
export const climateHeading = lang => t(lang, 'ch');
const nmf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'n' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.NumberFormat(L, o)); };
const num = (v, lang, o) => { try { return nmf(lang === 'en' ? 'en-GB' : lang, o).format(v); } catch (e) { return String(v); } };
const src = (href, label) => okU(href) ? '<a class="k-src" href="' + esc(href) + '" rel="noopener" target="_blank">' + esc(label) + '</a>' : '';
const UNIT = { m: { ru: 'м', zh: '米', ar: 'م' }, km: { ru: 'км', zh: '公里', ar: 'كم' } };
const un = (lang, u) => (UNIT[u] || {})[lang] || u;
// a distance for display: under 100 m is said as such (the pin is about 100 m accurate), then tens of metres, then one decimal of km
const dist = (m, lang) => m < 100 ? t(lang, 'u100') : m < 1000 ? num(Math.round(m / 10) * 10, lang) + ' ' + un(lang, 'm') : num(Math.round(m / 100) / 10, lang, { maximumFractionDigits: m < 20000 ? 1 : 0 }) + ' ' + un(lang, 'km');
const dist2 = (m, lang) => m < 1000 ? num(Math.round(m / 10) * 10, lang) + ' ' + un(lang, 'm') : num(Math.round(m / 100) / 10, lang, { maximumFractionDigits: m < 20000 ? 1 : 0 }) + ' ' + un(lang, 'km');
const mapU = ll => Array.isArray(ll) && isFinite(ll[0]) && isFinite(ll[1]) ? 'https://www.openstreetmap.org/?mlat=' + (+ll[0]).toFixed(5) + '&mlon=' + (+ll[1]).toFixed(5) + '#map=16/' + (+ll[0]).toFixed(5) + '/' + (+ll[1]).toFixed(5) : '';
const bd = s => '<bdi>' + esc(s) + '</bdi>';
const buildDate = (b, fd) => /^\d{8}$/.test(String(b || '')) ? fd(String(b).slice(0, 4) + '-' + String(b).slice(4, 6) + '-' + String(b).slice(6, 8)) : String(b || '');

const CSS = '<style id="karo-css">.karo .kl-led{display:grid;grid-template-columns:minmax(0,1fr);margin:10px 0;border-top:1px solid var(--k-line,#ccd)}.karo .kl-led>dt{margin:0;padding:12px 0 2px;font-weight:640;color:var(--k-ink,inherit)}.karo .kl-led>dd{margin:0;padding:0 0 12px;border-bottom:1px solid var(--k-line,#ccd);text-align:start;line-height:1.55;overflow-wrap:anywhere}' +
  '@media (min-width:760px){.karo .kl-led{grid-template-columns:220px minmax(0,1fr)}.karo .kl-led>dt{padding:12px 0;padding-inline-end:16px;border-bottom:1px solid var(--k-line,#ccd)}.karo .kl-led>dd{padding:12px 0}}.karo .k-src{display:inline-flex;margin-inline-start:4px}' +
  '.karo h3{margin:26px 0 6px;font-size:var(--k-fs-lg,1.2rem);scroll-margin-top:140px}.karo .lim{font-size:var(--k-fs-xs,.82rem);color:var(--k-muted,#56636F);margin:8px 0;max-width:80ch}.karo .srcl{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:var(--k-fs-xs,.82rem);margin:8px 0 0}.karo .srcl a{color:var(--k-sea,#155C75)}' +
  '.karo .k-table td,.karo .k-table th{vertical-align:top;text-align:start}.karo .k-table q{quotes:"\\201C" "\\201D";font-weight:600}.karo .k-table ul{margin:0;padding:0;list-style:none}.karo .k-table li+li{margin-top:2px}.karo td.k-n,.karo th.k-n{text-align:end;white-space:nowrap}.karo td.k-n small{display:block;color:var(--k-muted,#56636F);font-size:var(--k-fs-xs,.82rem)}' +
  '@media (max-width:639px){.karo .k-table--stack th[scope=row]{display:block;padding:0 0 4px;border:0}.karo .k-table--stack td.k-n{white-space:normal}.karo .k-table--stack td.k-n small{display:inline;margin-inline-start:6px}' +
  '.karo .kc thead{display:none}.karo .kc tr{display:block;padding:10px 0;border-bottom:1px solid var(--k-line,#ccd)}.karo .kc td{display:block;padding:2px 0;border:0}.karo .kc td::before{content:attr(data-label);display:block;color:var(--k-muted,#56636F);font-size:var(--k-fs-xs,.82rem)}}</style>';

// ------------------------------------------------------------------------------------------------ #around (with #distance-claims)
function place(o, lang, withKind) {   // "Name (kind), 480 m map"
  const nm = o.n ? bd(o.n) + (o.iata ? ' (' + esc(o.iata) + ')' : '') : '<span class="k-muted">' + esc(t(lang, 'noname')) + '</span>';
  const k = withKind && o.k && tm(lang, 'sk', o.k) ? ' (' + esc(tm(lang, 'sk', o.k)) + ')' : '';
  return nm + k + cm(lang) + esc(dist(o.d, lang)) + ' ' + src(mapU(o.ll), t(lang, 'map'));
}
function claimsHtml(ad, x, lang, fd) {
  const dc = ad && ad.dc, r = dc && dc.projects && dc.projects[x.id];
  let h = '<h3 id="distance-claims">' + esc(t(lang, 'c_h')) + '</h3>';
  if (!r) return h + '<p class="k-muted">' + esc(t(lang, 'c_nocopy')) + '</p>';
  const copy = /^[0-9a-f]{64}$/.test(r.sha || '') ? '/projects/' + encodeURIComponent(x.s) + '/changes/' + r.sha + '.txt' : '';
  if (r.index) return h + '<p class="k-muted">' + esc(t(lang, 'c_index')) + '</p>';
  const cl = (r.c || []).filter(c => c && c.q && (c.t || c.none != null));
  const cp = copy ? ' <a class="k-src" href="' + esc(copy) + '">' + esc(t(lang, 'c_copy')) + '</a>' : '';
  if (!cl.length) h += '<p>' + esc(t(lang, 'c_zero', { d: fd(r.d) })) + cp + '</p>';
  else {
    h += '<p class="ki">' + esc(t(lang, 'c_intro', { d: fd(r.d) })) + cp + '</p><div class="k-table-wrap"><table class="k-table kc"><thead><tr><th>' + esc(t(lang, 'c_th1')) + '</th><th>' + esc(t(lang, 'c_th2')) + '</th></tr></thead><tbody>' +
      cl.map(c => {
        let m;
        if (!c.t) m = esc(tm(lang, 'cn', c.cat) || c.cat) + ': ' + esc(t(lang, 'c_none', { km: num(c.none, lang) }));
        else {
          const T = c.t, who = c.matched && T.n ? bd(T.n) + (T.iata ? ' (' + esc(T.iata) + ')' : '') : esc(tm(lang, 'cn', c.cat) || c.cat) + (T.n ? ': ' + bd(T.n) + (T.iata ? ' (' + esc(T.iata) + ')' : '') : '');
          const li = [T.in ? esc(t(lang, 'c_in')) : esc(t(lang, 'c_sl', { d: dist(T.d, lang) })) + ' ' + src(mapU(T.ll), t(lang, 'map'))];
          if (Array.isArray(c.car)) li.push(esc(t(lang, 'c_car', { d: dist2(c.car[0], lang), m: num(Math.max(1, Math.round(c.car[1] / 60)), lang) })));
          if (Array.isArray(c.foot)) li.push(esc(t(lang, 'c_foot', { d: dist2(c.foot[0], lang), m: num(Math.max(1, Math.round(c.foot[1] / 60)), lang) })));
          m = who + '<ul>' + li.map(s => '<li>' + s + '</li>').join('') + '</ul>';
        }
        return '<tr><td data-label="' + esc(t(lang, 'c_th1')) + '"><q><bdi>' + esc(c.q) + '</bdi></q></td><td data-label="' + esc(t(lang, 'c_th2')) + '">' + m + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  if (r.o > 0 && (r.ox || []).length) h += '<p class="k-muted">' + esc(t(lang, 'c_other', { q: '\u0001' })).replace('\u0001', bd(r.ox[0])) + '</p>';
  return h + '<p class="lim">' + esc(t(lang, 'c_lim')) + ' ' + src('https://routing.openstreetmap.de/', t(lang, 'c_src')) + '</p>';
}
export function aroundHtml(ad, x, lang, fd) {
  const ar = ad && ad.ar, r = ar && ar.projects && ar.projects[x.id];
  if (!r) return '';
  const rows = [], none = o => '<span class="k-muted">' + esc(t(lang, 'none', { km: num(o.none, lang) })) + '</span>';
  const simple = k => { const o = r[k]; if (!o) return; rows.push([t(lang, k), o.d != null ? (o.in ? esc(t(lang, 'sea_in')) : esc(dist(o.d, lang)) + ' ' + src(mapU(o.ll), t(lang, 'map'))) : none(o)]); };
  simple('coast'); simple('beach');
  if (r.airport) rows.push([t(lang, 'airport'), r.airport.d != null ? place(r.airport, lang) + (r.airport2 && r.airport2.d != null && r.airport2.d <= 75000 ? '<br>' + place(r.airport2, lang) : '') : none(r.airport)]);
  if (r.runway) {
    const o = r.runway;
    if (o.d == null) rows.push([t(lang, 'runway'), none(o)]);
    else {
      const w = o.u5 ? [o.ref ? esc(t(lang, 'rw_ref', { r: o.ref })) : '', o.n ? bd(o.n) + (o.iata ? ' (' + esc(o.iata) + ')' : '') : ''].filter(Boolean).join(cm(lang)) : '';   // the airfield is named only for a runway end under 5 km
      rows.push([t(lang, 'runway'), esc(t(lang, o.u5 ? 'rw_u5' : 'rw_far', { d: dist(o.d, lang), w: '\u0001' })).replace('\u0001', w ? ' (' + w + ')' : '') + (o.u5 && !o.n ? ' ' + esc(t(lang, 'rw_anon')) : '') + ' ' + src(mapU(o.ll), t(lang, 'map'))]);
    }
  }
  for (const k of ['hospital', 'school', 'supermarket', 'stop', 'rail']) {
    const o = r[k]; if (!o || o.same) continue;
    rows.push([t(lang, k), o.d != null ? place(o, lang, k === 'stop' || k === 'rail') : none(o)]);
  }
  const A = ar.air || {}, q = r.aq;
  if (q && (q.pm25 != null || q.no2 != null)) {
    const f1 = v => v == null ? '?' : num(v, lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    rows.push([t(lang, 'air', { y: q.y || A.year || '' }), esc(t(lang, 'air_v', { p: f1(q.pm25), n: f1(q.no2) })) + ' ' + esc(t(lang, 'air_who')) + ' ' + src((A.who || {}).url, t(lang, 'who')) +
      '<br><span class="k-muted k-small">' + esc(t(lang, 'air_lim')) + '</span> ' + src(A.via_url, t(lang, 'air_src'))]);
  }
  if (!rows.length) return '';
  const p = String(r.pin || '').split(','), hq = p.length === 2 && isFinite(+p[0]) && isFinite(+p[1]) ? '?lat=' + (+p[0]).toFixed(4) + '&lng=' + (+p[1]).toFixed(4) : '';
  return CSS + '<div class="karo"><p class="ki">' + esc(t(lang, 'intro', { b: buildDate(ar.osm_build, fd), a: num(r.acc || 100, lang) })) + '</p>' +
    '<dl class="kl-led">' + rows.map(([a, b]) => '<dt>' + esc(a) + '</dt><dd>' + b + '</dd>').join('') + '</dl>' +
    '<p class="lim">' + esc(t(lang, 'lim')) + ' ' + src('https://www.openstreetmap.org/copyright', t(lang, 'osm')) + '</p>' + claimsHtml(ad, x, lang, fd) +
    '<p class="srcl"><a href="/hazards/' + esc(hq) + '">' + esc(t(lang, 'hz')) + '</a><a href="/api/x/around/' + encodeURIComponent(x.id) + '">' + esc(t(lang, 'method')) + cm(lang) + esc(t(lang, 'upd', { d: fd(ar.updated) })) + '</a></p></div>';
}

// ------------------------------------------------------------------------------------------------ #climate
export function climateHtml(ad, x, lang, fd) {
  const cl = ad && ad.cl, r = cl && cl.projects && cl.projects[x.id];
  if (!r) return '';
  const cols = [['h', 'col_h'], ['m', 'col_m'], ['x', 'col_x']], rowsK = ['hd35', 'tr', 'pr', 'r20mm'].filter(k => r[k] && cols.every(([c]) => Array.isArray(r[k][c])));
  if (!rowsK.length) return '';
  const f = (v, k) => num(v, lang, { maximumFractionDigits: k !== 'pr' && Math.abs(v) < 10 ? 1 : 0 });   // whole days and millimetres; one decimal under 10 days
  const cell = (a, k) => '<span><b>' + esc(f(a[0], k)) + '</b> <small>(' + esc(t(lang, 'rg', { a: f(a[1], k), b: f(a[2], k) })) + ')</small></span>';
  const s = cl.source || {}, p = String(r.pin || '').split(','), hq = p.length === 2 && isFinite(+p[0]) && isFinite(+p[1]) ? '?lat=' + (+p[0]).toFixed(4) + '&lng=' + (+p[1]).toFixed(4) : '';
  return (ad.ar && ad.ar.projects && ad.ar.projects[x.id] ? '' : CSS) + '<div class="karo"><p class="ki">' + esc(t(lang, 'cintro')) + '</p><div class="k-table-wrap"><table class="k-table k-table--stack"><thead><tr><th>' + esc(t(lang, 'col0')) + '</th>' +
    cols.map(([, l]) => '<th class="k-n">' + esc(t(lang, l)) + '</th>').join('') + '</tr></thead><tbody>' +
    rowsK.map(k => '<tr><th scope="row" data-label="">' + esc(t(lang, k)) + '</th>' + cols.map(([c, l]) => '<td class="k-n" data-label="' + esc(t(lang, l)) + '">' + cell(r[k][c], k) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>' +
    '<p class="lim">' + esc(t(lang, 'scen')) + ' ' + esc(t(lang, 'clim')) + '</p>' +
    '<p class="srcl">' + src(s.catalog || s.url, t(lang, 'csrc')) + src('https://doi.org/10.7917/OFSG3345', t(lang, 'csrc2')) + '<a href="/hazards/' + esc(hq) + '">' + esc(t(lang, 'cflood')) + '</a><a href="/api/x/around/' + encodeURIComponent(x.id) + '">' + esc(t(lang, 'method')) + cm(lang) + esc(t(lang, 'upd', { d: fd(cl.updated) })) + '</a></p></div>';
}

// ------------------------------------------------------------------------------------------------ API
const J = (o, status, age) => new Response(JSON.stringify(o), { status: status || 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': age ? 'public, max-age=' + age : 'no-store', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' } });
export async function handle(req, u, env) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return J({ error: 'GET only' }, 405);
  const id = decodeURIComponent(u.pathname.replace(/^\/api\/x\/around\/?/, '').replace(/\/$/, ''));
  const ad = await aroundData(env).catch(() => null);
  if (!ad || (!ad.ar && !ad.cl && !ad.dc)) return J({ error: 'data not published yet' }, 503);
  const pick = f => f ? Object.fromEntries(Object.entries(f).filter(([k]) => k !== 'projects')) : null;
  if (!id || id === 'about') return J({ about: 'What is around each pinned project (nearest sea, beach, airport, runway end, hospital, school, supermarket, public transport stop; yearly PM2.5 and NO2), the climate at the pin (1995-2014 against 2040-2059) and the distance claims on the page next to the measurement. Shown in #around, #distance-claims and #climate on named project pages.',
    around: pick(ad.ar), climate: pick(ad.cl), distance_claims: pick(ad.dc), projects: Object.keys((ad.ar && ad.ar.projects) || {}).length, files: ['/data/around.json', '/data/climate.json', '/data/distance-claims.json'], example: '/api/x/around/CDS-001' }, 200, 3600);
  if (!/^[A-Z0-9-]{3,20}$/.test(id)) return J({ error: 'bad id' }, 400);
  const a = ad.ar && ad.ar.projects && ad.ar.projects[id], b = ad.cl && ad.cl.projects && ad.cl.projects[id], c = ad.dc && ad.dc.projects && ad.dc.projects[id];
  if (!a && !b && !c) return J({ error: 'not found', note: 'Only named projects with a plot-level pin are covered.' }, 404, 600);
  return J({ id, around: a || null, climate: b || null, distance_claims: c || null,
    sources: { around: ad.ar ? { updated: ad.ar.updated, osm_build: ad.ar.osm_build, source: ad.ar.source, air: ad.ar.air, method: ad.ar.method, limits: ad.ar.limits } : null,
      climate: ad.cl ? { updated: ad.cl.updated, source: ad.cl.source, periods: ad.cl.periods, scenarios: ad.cl.scenarios, indicators: ad.cl.indicators, values: ad.cl.values, method: ad.cl.method, limits: ad.cl.limits } : null,
      distance_claims: ad.dc ? { updated: ad.dc.updated, source: ad.dc.source, method: ad.dc.method, limits: ad.dc.limits, fields: ad.dc.fields } : null } }, 200, 3600);
}

// n29p (batch 29, item 3): nearest beach, airport and hospital measured from the pin, as [label, text] pairs for the one-line summary
// in "Where is it?" and the FAQ (same records and rounding as the #around section; [] when the project has no record)
export function aroundSum(ad, x, lang) {
  const r = ad && ad.ar && ad.ar.projects && ad.ar.projects[x.id]; if (!r) return [];
  const out = [];
  for (const k of ['beach', 'airport', 'hospital']) {
    const o = r[k]; if (!o || o.same) continue;
    if (o.d == null) { if (o.none != null) out.push([t(lang, k), t(lang, 'none', { km: num(o.none, lang) }).replace(/\.$/, '').replace(/^\p{Lu}(?=\p{Ll})/u, c => c.toLowerCase())]); continue; }
    out.push([t(lang, k), (k === 'airport' && o.n ? o.n + (o.iata ? ' (' + o.iata + ')' : '') + ' ' : '') + dist(o.d, lang)]);
  }
  return out;
}
