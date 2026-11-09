// kolaboro.com batch 19 (n19c): rules on the land. No model calls, no keys.
// Data (built on main by .github/workflows/kolaboro-land-rules.yml, tools/kolaboro-agent/land_rules.py; same projects and pins as
// /data/construction-progress.json):
//   /data/land-rules.json   protected and restricted land at and near each pin: Natura 2000 (EEA, CC BY 4.0), England planning data
//                           (green belt, conservation areas, SSSI, National Landscapes, national parks, SAC, SPA, Ramsar, ancient
//                           woodland; OGL v3.0), Spain coast distance against the Ley de Costas easements, OpenStreetMap protected areas (ODbL)
//   /data/map-history.json  OpenStreetMap history within 150 m of each pin: when buildings, roads and land use were first mapped and last changed
// Shown on named project pages (kbx_named.js): section #land ("Protected land") and #maphist ("Map history").
// Routes: GET /api/x/land/<ID>  both records of one project (public, cacheable)
//         GET /api/x/land/      about
// The live check for any pin stays at /api/x/u/protected (kbx_u.js, OpenStreetMap and mangroves), shown on /hazards/.
const ORIGIN = 'https://kolaboro.com';
export const PATHS = /^\/api\/x\/land(\/|$)/;
let MEMO = {};
async function loadOne(env, name) {
  const m = MEMO[name]; if (m && Date.now() - m.t < 600000) return m.v;
  let r = null;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); } catch (e) { r = null; }
  if (!r || !r.ok) { try { r = await fetch(ORIGIN + '/data/' + name + '?w=1', { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
  const v = r && r.ok ? await r.json().catch(() => null) : null;
  MEMO[name] = { t: Date.now(), v }; return v;
}
export async function landData(env) {
  const [lr, mh] = await Promise.all([loadOne(env, 'land-rules.json'), loadOne(env, 'map-history.json')]);
  return { lr, mh, v: ((lr && lr.updated) || '') + '/' + ((mh && mh.updated) || '') };
}

// ------------------------------------------------------------------------------------------------ strings (8 languages)
const S = {
  en: { h: 'Protected and restricted land near the pin', toc: 'Protected land', mh: 'The map\'s own history at the plot', mtoc: 'Map history',
    intro: 'Official and open map layers checked on {d}. The pin is about {a} m accurate, so a boundary closer than that may or may not cross the plot.',
    n2k: 'Natura 2000 (EU nature network)', n2in: 'The pin is inside Natura 2000 site {n} ({c}, {t}).', n2near: 'Not inside a Natura 2000 site. Within 2 km:', n2none: 'No Natura 2000 site contains the pin or comes within 2 km.',
    about: 'about {m} m from the pin', n2src: 'EEA Natura 2000 sites, release {r}', sdf: 'site record',
    es: 'Spanish coast law (Ley de Costas)', sea: 'The sea as mapped in OpenStreetMap is about {m} m from the pin.', sea0: 'The pin falls on the sea as mapped in OpenStreetMap.', seafar: 'The sea as mapped in OpenStreetMap is more than 1 km from the pin.',
    eslaw: 'Under the Ley de Costas a protection easement covers 100 m inland from the inner edge of the shore (article 23; 20 m in land that was already urban in 1988, transitional provision 3) and the zone of influence is at least 500 m (article 30). The legal line is the boundary survey (deslinde) by MITECO.',
    esnear: 'The pin is within 600 m of the sea as mapped, so the official line matters here: open it in MITECO\'s viewer.', esmit: 'MITECO\'s boundary line map service answered with an error when we checked on {d}, and its file download asks for a human check, so we measured to the mapped sea instead.',
    esmit_ok: 'We measured to the sea as mapped in OpenStreetMap, not to the legal line.', viewer: 'MITECO coast viewer', law: 'Ley 22/1988 (BOE)',
    eng: 'England planning designations', engin: 'Inside', engnone: 'None of these layers contains the pin or comes within 500 m: {l}.', engerr: 'The register did not answer when we checked on {d}. Open it at the pin:', engopen: 'Planning Data map',
    engsrc: 'Planning Data for England (MHCLG), OGL v3.0', sco: 'Scotland: designated sites', scotx: 'Designated sites in Scotland are on NatureScot SiteLink. We do not query it yet.', sitelink: 'NatureScot SiteLink',
    osm: 'Protected areas mapped in OpenStreetMap', osin: 'Inside {k} {n}.', osnear: 'Not inside a mapped protected area. Within 1 km:', osnone: 'No mapped protected area, nature reserve or national park contains the pin or comes within 1 km.',
    oslim: 'Volunteer-mapped boundaries. An OpenStreetMap boundary is not a legal document, and a missing boundary does not prove the land is unprotected.', ossrc: 'OpenStreetMap via OpenFreeMap tiles, build {b}, ODbL',
    unav: 'This source did not answer when we checked on {d}.', lim: 'Not checked here: the municipal zoning plan, building lines and heritage listings. The land office and a local lawyer give the binding answer.', live: 'check any other pin', method: 'method and data', upd: 'updated {d}',
    mintro: 'What volunteers have drawn in OpenStreetMap within 150 m of the pin, and when. A map edit is not a permit or a survey: it shows when someone drew a thing, which can be years after it was built.',
    mb: 'Buildings', mr: 'Roads and tracks', ml: 'Land use', mn: '{n} mapped, the first on {a}, last changed on {b}', m0: 'None mapped within 150 m.', mcons: 'Mapped as under construction',
    mcn: '{n} mapped, the first drawn on {a}', myr: 'Buildings by year first mapped', tl: 'Timeline', t_b1: 'First building mapped', t_r1: 'First road mapped', t_l1: '{k} first mapped', t_c1: 'First object mapped as under construction', t_last: 'Latest change within 150 m ({k})',
    t_yr: '{n} buildings first mapped in {y}', hist: 'history', mlim: 'Objects deleted from the map are not counted. Dates are when an object was drawn or edited, not when it was built. The pin is about {a} m accurate.', msrc: 'OpenStreetMap editing API, ODbL', none: 'No object of these kinds is mapped within 150 m of the pin.',
    ty: { 'SPA': 'bird protection area (SPA)', 'SCI/SAC': 'habitat site (SCI/SAC)', 'SPA and SCI/SAC': 'bird and habitat site (SPA and SCI/SAC)' },
    ds: { 'green-belt': 'Green belt', 'conservation-area': 'Conservation area', 'site-of-special-scientific-interest': 'Site of Special Scientific Interest', 'area-of-outstanding-natural-beauty': 'National Landscape (AONB)', 'national-park': 'National park', 'special-area-of-conservation': 'Special Area of Conservation', 'special-protection-area': 'Special Protection Area', 'ramsar': 'Ramsar wetland', 'ancient-woodland': 'Ancient woodland' },
    kind: { 'protected area': 'protected area', 'nature reserve': 'nature reserve', 'national park': 'national park', 'conservation': 'conservation area' },
    tag: { residential: 'residential area', construction: 'construction site', commercial: 'commercial area', retail: 'retail area', industrial: 'industrial area', brownfield: 'cleared land (brownfield)', greenfield: 'land planned for building (greenfield)', forest: 'forest', wood: 'wood', farmland: 'farmland', meadow: 'meadow', grass: 'grass', scrub: 'scrub', orchard: 'orchard', beach: 'beach', sand: 'sand', water: 'water', wetland: 'wetland', park: 'park', golf_course: 'golf course', garden: 'garden', nature_reserve: 'nature reserve', cemetery: 'cemetery', military: 'military land', railway: 'railway land', vineyard: 'vineyard', heath: 'heath', bare_rock: 'bare rock', marina: 'marina', resort: 'resort' } },
  es: { h: 'Suelo protegido y con limitaciones cerca del punto', toc: 'Suelo protegido', mh: 'La historia del propio mapa en la parcela', mtoc: 'Historia del mapa',
    intro: 'Capas oficiales y abiertas consultadas el {d}. El punto tiene unos {a} m de precisión, así que un límite más cercano puede cruzar la parcela o no.',
    n2k: 'Natura 2000 (red natural de la UE)', n2in: 'El punto está dentro del espacio Natura 2000 {n} ({c}, {t}).', n2near: 'No está dentro de un espacio Natura 2000. A menos de 2 km:', n2none: 'Ningún espacio Natura 2000 contiene el punto ni llega a menos de 2 km.',
    about: 'a unos {m} m del punto', n2src: 'Espacios Natura 2000 de la AEMA, versión {r}', sdf: 'ficha del espacio',
    es: 'Ley de Costas (España)', sea: 'El mar, tal como está en OpenStreetMap, queda a unos {m} m del punto.', sea0: 'El punto cae sobre el mar tal como está en OpenStreetMap.', seafar: 'El mar, tal como está en OpenStreetMap, queda a más de 1 km del punto.',
    eslaw: 'Según la Ley de Costas, la servidumbre de protección ocupa 100 m tierra adentro desde el límite interior de la ribera del mar (artículo 23; 20 m en suelo que ya era urbano en 1988, disposición transitoria tercera) y la zona de influencia es de al menos 500 m (artículo 30). La línea legal es el deslinde del MITECO.',
    esnear: 'El punto está a menos de 600 m del mar cartografiado, así que la línea oficial importa aquí: ábrala en el visor del MITECO.', esmit: 'El servicio de mapas de la línea de deslinde del MITECO respondió con un error cuando lo consultamos el {d}, y su descarga de ficheros pide una comprobación humana, así que medimos hasta el mar cartografiado.',
    esmit_ok: 'Medimos hasta el mar cartografiado en OpenStreetMap, no hasta la línea legal.', viewer: 'Visor de costas del MITECO', law: 'Ley 22/1988 (BOE)',
    eng: 'Protecciones urbanísticas de Inglaterra', engin: 'Dentro', engnone: 'Ninguna de estas capas contiene el punto ni llega a menos de 500 m: {l}.', engerr: 'El registro no respondió cuando lo consultamos el {d}. Ábralo en el punto:', engopen: 'Mapa de Planning Data',
    engsrc: 'Planning Data for England (MHCLG), OGL v3.0', sco: 'Escocia: espacios protegidos', scotx: 'Los espacios protegidos de Escocia están en NatureScot SiteLink. Todavía no lo consultamos.', sitelink: 'NatureScot SiteLink',
    osm: 'Espacios protegidos cartografiados en OpenStreetMap', osin: 'Dentro de {k} {n}.', osnear: 'No está dentro de un espacio protegido cartografiado. A menos de 1 km:', osnone: 'Ningún espacio protegido, reserva natural ni parque nacional cartografiado contiene el punto ni llega a menos de 1 km.',
    oslim: 'Límites dibujados por voluntarios. Un límite de OpenStreetMap no es un documento legal, y que falte un límite no prueba que el suelo no esté protegido.', ossrc: 'OpenStreetMap mediante teselas de OpenFreeMap, versión {b}, ODbL',
    unav: 'Esta fuente no respondió cuando la consultamos el {d}.', lim: 'No comprobado aquí: el plan urbanístico municipal, las alineaciones y la protección del patrimonio. El registro de la propiedad, el ayuntamiento y un abogado local dan la respuesta vinculante.', live: 'consultar otro punto', method: 'método y datos', upd: 'actualizado el {d}',
    mintro: 'Lo que han dibujado los voluntarios en OpenStreetMap a menos de 150 m del punto, y cuándo. Una edición del mapa no es una licencia ni un levantamiento: muestra cuándo alguien dibujó algo, que puede ser años después de construirse.',
    mb: 'Edificios', mr: 'Calles y caminos', ml: 'Usos del suelo', mn: '{n} cartografiados, el primero el {a}, último cambio el {b}', m0: 'Ninguno cartografiado a menos de 150 m.', mcons: 'Cartografiado como en construcción',
    mcn: 'cartografiados: {n}, el primero dibujado el {a}', myr: 'Edificios por año en que se cartografiaron', tl: 'Cronología', t_b1: 'Primer edificio cartografiado', t_r1: 'Primera calle cartografiada', t_l1: '{k}: primera vez en el mapa', t_c1: 'Primer objeto cartografiado como en construcción', t_last: 'Último cambio a menos de 150 m ({k})',
    t_yr: '{n} edificios cartografiados por primera vez en {y}', hist: 'historial', mlim: 'Los objetos borrados del mapa no se cuentan. Las fechas son de cuando se dibujó o editó un objeto, no de cuando se construyó. El punto tiene unos {a} m de precisión.', msrc: 'API de edición de OpenStreetMap, ODbL', none: 'No hay ningún objeto de estos tipos cartografiado a menos de 150 m del punto.',
    ty: { 'SPA': 'zona de protección de aves (ZEPA)', 'SCI/SAC': 'lugar de hábitats (LIC/ZEC)', 'SPA and SCI/SAC': 'lugar de aves y hábitats (ZEPA y LIC/ZEC)' },
    ds: { 'green-belt': 'Cinturón verde', 'conservation-area': 'Área de conservación', 'site-of-special-scientific-interest': 'Lugar de especial interés científico (SSSI)', 'area-of-outstanding-natural-beauty': 'Paisaje nacional (AONB)', 'national-park': 'Parque nacional', 'special-area-of-conservation': 'Zona especial de conservación', 'special-protection-area': 'Zona de especial protección para las aves', 'ramsar': 'Humedal Ramsar', 'ancient-woodland': 'Bosque antiguo' },
    kind: { 'protected area': 'espacio protegido', 'nature reserve': 'reserva natural', 'national park': 'parque nacional', 'conservation': 'área de conservación' },
    tag: { residential: 'zona residencial', construction: 'zona en obras', commercial: 'zona comercial', retail: 'zona de tiendas', industrial: 'zona industrial', brownfield: 'suelo desbrozado', greenfield: 'suelo previsto para construir', forest: 'bosque', wood: 'arbolado', farmland: 'tierra de cultivo', meadow: 'prado', grass: 'césped', scrub: 'matorral', orchard: 'huerto de frutales', beach: 'playa', sand: 'arena', water: 'agua', wetland: 'humedal', park: 'parque', golf_course: 'campo de golf', garden: 'jardín', nature_reserve: 'reserva natural', cemetery: 'cementerio', military: 'zona militar', railway: 'zona ferroviaria', vineyard: 'viñedo', heath: 'brezal', bare_rock: 'roca desnuda', marina: 'puerto deportivo', resort: 'complejo turístico' } },
  fr: { h: 'Terrains protégés et soumis à restrictions près du point', toc: 'Terrains protégés', mh: 'L\'histoire de la carte elle-même sur la parcelle', mtoc: 'Histoire de la carte',
    intro: 'Couches officielles et ouvertes consultées le {d}. Le point est précis à environ {a} m : une limite plus proche peut traverser la parcelle ou non.',
    n2k: 'Natura 2000 (réseau naturel de l\'UE)', n2in: 'Le point est dans le site Natura 2000 {n} ({c}, {t}).', n2near: 'Pas dans un site Natura 2000. À moins de 2 km :', n2none: 'Aucun site Natura 2000 ne contient le point ni n\'arrive à moins de 2 km.',
    about: 'à environ {m} m du point', n2src: 'Sites Natura 2000 de l\'AEE, version {r}', sdf: 'fiche du site',
    es: 'Loi espagnole sur le littoral (Ley de Costas)', sea: 'La mer, telle que cartographiée dans OpenStreetMap, est à environ {m} m du point.', sea0: 'Le point tombe sur la mer telle que cartographiée dans OpenStreetMap.', seafar: 'La mer, telle que cartographiée dans OpenStreetMap, est à plus de 1 km du point.',
    eslaw: 'Selon la Ley de Costas, une servitude de protection couvre 100 m vers l\'intérieur depuis la limite intérieure du rivage (article 23 ; 20 m pour les terrains déjà urbains en 1988, disposition transitoire 3) et la zone d\'influence fait au moins 500 m (article 30). La ligne légale est la délimitation (deslinde) du MITECO.',
    esnear: 'Le point est à moins de 600 m de la mer cartographiée, la ligne officielle compte donc ici : ouvrez-la dans la visionneuse du MITECO.', esmit: 'Le service cartographique de la ligne de délimitation du MITECO a répondu par une erreur lors de notre vérification du {d}, et son téléchargement de fichiers demande une vérification humaine : nous avons donc mesuré jusqu\'à la mer cartographiée.',
    esmit_ok: 'Nous avons mesuré jusqu\'à la mer cartographiée dans OpenStreetMap, pas jusqu\'à la ligne légale.', viewer: 'Visionneuse du littoral du MITECO', law: 'Ley 22/1988 (BOE)',
    eng: 'Protections d\'urbanisme en Angleterre', engin: 'Dedans', engnone: 'Aucune de ces couches ne contient le point ni n\'arrive à moins de 500 m : {l}.', engerr: 'Le registre n\'a pas répondu lors de notre vérification du {d}. Ouvrez-le au point :', engopen: 'Carte Planning Data',
    engsrc: 'Planning Data for England (MHCLG), OGL v3.0', sco: 'Écosse : sites protégés', scotx: 'Les sites protégés d\'Écosse sont sur NatureScot SiteLink. Nous ne l\'interrogeons pas encore.', sitelink: 'NatureScot SiteLink',
    osm: 'Espaces protégés cartographiés dans OpenStreetMap', osin: 'Dans {k} {n}.', osnear: 'Pas dans un espace protégé cartographié. À moins de 1 km :', osnone: 'Aucun espace protégé, réserve naturelle ou parc national cartographié ne contient le point ni n\'arrive à moins de 1 km.',
    oslim: 'Limites tracées par des bénévoles. Une limite OpenStreetMap n\'est pas un document légal, et l\'absence de limite ne prouve pas que le terrain n\'est pas protégé.', ossrc: 'OpenStreetMap via les tuiles OpenFreeMap, version {b}, ODbL',
    unav: 'Cette source n\'a pas répondu lors de notre vérification du {d}.', lim: 'Non vérifié ici : le plan d\'urbanisme communal, les alignements et la protection du patrimoine. Le cadastre, la mairie et un avocat local donnent la réponse qui engage.', live: 'vérifier un autre point', method: 'méthode et données', upd: 'mis à jour le {d}',
    mintro: 'Ce que des bénévoles ont dessiné dans OpenStreetMap à moins de 150 m du point, et quand. Une modification de la carte n\'est ni un permis ni un relevé : elle montre quand quelqu\'un a dessiné un objet, parfois des années après sa construction.',
    mb: 'Bâtiments', mr: 'Routes et chemins', ml: 'Occupation du sol', mn: '{n} cartographiés, le premier le {a}, dernière modification le {b}', m0: 'Aucun cartographié à moins de 150 m.', mcons: 'Cartographié comme en construction',
    mcn: 'cartographiés : {n}, le premier dessiné le {a}', myr: 'Bâtiments par année de première cartographie', tl: 'Chronologie', t_b1: 'Premier bâtiment cartographié', t_r1: 'Première route cartographiée', t_l1: '{k} : première apparition sur la carte', t_c1: 'Premier objet cartographié comme en construction', t_last: 'Dernière modification à moins de 150 m ({k})',
    t_yr: '{n} bâtiments cartographiés pour la première fois en {y}', hist: 'historique', mlim: 'Les objets supprimés de la carte ne sont pas comptés. Les dates sont celles où un objet a été dessiné ou modifié, pas celles de sa construction. Le point est précis à environ {a} m.', msrc: 'API d\'édition d\'OpenStreetMap, ODbL', none: 'Aucun objet de ces types n\'est cartographié à moins de 150 m du point.',
    ty: { 'SPA': 'zone de protection spéciale pour les oiseaux (ZPS)', 'SCI/SAC': 'site d\'habitats (SIC/ZSC)', 'SPA and SCI/SAC': 'site oiseaux et habitats (ZPS et SIC/ZSC)' },
    ds: { 'green-belt': 'Ceinture verte', 'conservation-area': 'Secteur sauvegardé', 'site-of-special-scientific-interest': 'Site d\'intérêt scientifique particulier (SSSI)', 'area-of-outstanding-natural-beauty': 'Paysage national (AONB)', 'national-park': 'Parc national', 'special-area-of-conservation': 'Zone spéciale de conservation', 'special-protection-area': 'Zone de protection spéciale', 'ramsar': 'Zone humide Ramsar', 'ancient-woodland': 'Bois ancien' },
    kind: { 'protected area': 'espace protégé', 'nature reserve': 'réserve naturelle', 'national park': 'parc national', 'conservation': 'zone de conservation' },
    tag: { residential: 'zone résidentielle', construction: 'chantier', commercial: 'zone commerciale', retail: 'zone de commerces', industrial: 'zone industrielle', brownfield: 'terrain dégagé', greenfield: 'terrain prévu pour construire', forest: 'forêt', wood: 'bois', farmland: 'terres agricoles', meadow: 'prairie', grass: 'pelouse', scrub: 'broussailles', orchard: 'verger', beach: 'plage', sand: 'sable', water: 'eau', wetland: 'zone humide', park: 'parc', golf_course: 'golf', garden: 'jardin', nature_reserve: 'réserve naturelle', cemetery: 'cimetière', military: 'terrain militaire', railway: 'emprise ferroviaire', vineyard: 'vigne', heath: 'lande', bare_rock: 'roche nue', marina: 'port de plaisance', resort: 'complexe touristique' } },
  de: { h: 'Geschützte und eingeschränkte Flächen nahe dem Punkt', toc: 'Schutzgebiete', mh: 'Die Geschichte der Karte selbst am Grundstück', mtoc: 'Kartengeschichte',
    intro: 'Amtliche und offene Kartenebenen, geprüft am {d}. Der Punkt ist etwa {a} m genau, eine nähere Grenze kann das Grundstück also schneiden oder nicht.',
    n2k: 'Natura 2000 (EU-Naturnetz)', n2in: 'Der Punkt liegt im Natura-2000-Gebiet {n} ({c}, {t}).', n2near: 'Nicht in einem Natura-2000-Gebiet. Im Umkreis von 2 km:', n2none: 'Kein Natura-2000-Gebiet enthält den Punkt oder reicht bis auf 2 km heran.',
    about: 'etwa {m} m vom Punkt', n2src: 'EUA Natura-2000-Gebiete, Stand {r}', sdf: 'Gebietsblatt',
    es: 'Spanisches Küstengesetz (Ley de Costas)', sea: 'Das Meer, wie in OpenStreetMap kartiert, liegt etwa {m} m vom Punkt.', sea0: 'Der Punkt liegt auf dem Meer, wie in OpenStreetMap kartiert.', seafar: 'Das Meer, wie in OpenStreetMap kartiert, liegt mehr als 1 km vom Punkt.',
    eslaw: 'Nach der Ley de Costas gilt eine Schutzdienstbarkeit 100 m landeinwärts ab der inneren Grenze des Ufers (Artikel 23; 20 m auf Land, das 1988 schon städtisch war, Übergangsbestimmung 3), die Einflusszone beträgt mindestens 500 m (Artikel 30). Die rechtliche Linie ist die Abgrenzung (deslinde) des MITECO.',
    esnear: 'Der Punkt liegt weniger als 600 m vom kartierten Meer, die amtliche Linie zählt hier also: öffnen Sie sie im Viewer des MITECO.', esmit: 'Der Kartendienst der Abgrenzungslinie des MITECO antwortete bei unserer Prüfung am {d} mit einem Fehler, und sein Datei-Download verlangt eine menschliche Prüfung, daher haben wir bis zum kartierten Meer gemessen.',
    esmit_ok: 'Wir haben bis zum in OpenStreetMap kartierten Meer gemessen, nicht bis zur rechtlichen Linie.', viewer: 'Küsten-Viewer des MITECO', law: 'Ley 22/1988 (BOE)',
    eng: 'Planungsrechtliche Ausweisungen in England', engin: 'Innerhalb', engnone: 'Keine dieser Ebenen enthält den Punkt oder reicht bis auf 500 m heran: {l}.', engerr: 'Das Register antwortete bei unserer Prüfung am {d} nicht. Am Punkt öffnen:', engopen: 'Planning-Data-Karte',
    engsrc: 'Planning Data for England (MHCLG), OGL v3.0', sco: 'Schottland: Schutzgebiete', scotx: 'Schutzgebiete in Schottland stehen in NatureScot SiteLink. Wir fragen es noch nicht ab.', sitelink: 'NatureScot SiteLink',
    osm: 'In OpenStreetMap kartierte Schutzgebiete', osin: 'Innerhalb von {k} {n}.', osnear: 'Nicht in einem kartierten Schutzgebiet. Im Umkreis von 1 km:', osnone: 'Kein kartiertes Schutzgebiet, Naturschutzgebiet oder Nationalpark enthält den Punkt oder reicht bis auf 1 km heran.',
    oslim: 'Von Freiwilligen gezeichnete Grenzen. Eine OpenStreetMap-Grenze ist kein Rechtsdokument, und eine fehlende Grenze beweist nicht, dass das Land ungeschützt ist.', ossrc: 'OpenStreetMap über OpenFreeMap-Kacheln, Stand {b}, ODbL',
    unav: 'Diese Quelle antwortete bei unserer Prüfung am {d} nicht.', lim: 'Hier nicht geprüft: der kommunale Bebauungsplan, Baulinien und Denkmalschutz. Grundbuchamt, Gemeinde und ein Anwalt vor Ort geben die verbindliche Antwort.', live: 'einen anderen Punkt prüfen', method: 'Methode und Daten', upd: 'aktualisiert am {d}',
    mintro: 'Was Freiwillige in OpenStreetMap im Umkreis von 150 m um den Punkt gezeichnet haben, und wann. Eine Kartenänderung ist keine Genehmigung und keine Vermessung: Sie zeigt, wann jemand etwas gezeichnet hat, oft Jahre nach dem Bau.',
    mb: 'Gebäude', mr: 'Straßen und Wege', ml: 'Landnutzung', mn: '{n} kartiert, das erste am {a}, zuletzt geändert am {b}', m0: 'Keine im Umkreis von 150 m kartiert.', mcons: 'Als im Bau kartiert',
    mcn: 'kartiert: {n}, das erste gezeichnet am {a}', myr: 'Gebäude nach Jahr der ersten Kartierung', tl: 'Zeitleiste', t_b1: 'Erstes Gebäude kartiert', t_r1: 'Erste Straße kartiert', t_l1: '{k}: zum ersten Mal kartiert', t_c1: 'Erstes Objekt als im Bau kartiert', t_last: 'Letzte Änderung im Umkreis von 150 m ({k})',
    t_yr: '{n} Gebäude im Jahr {y} zum ersten Mal kartiert', hist: 'Verlauf', mlim: 'Aus der Karte gelöschte Objekte werden nicht gezählt. Die Daten zeigen, wann ein Objekt gezeichnet oder geändert wurde, nicht wann es gebaut wurde. Der Punkt ist etwa {a} m genau.', msrc: 'OpenStreetMap-Bearbeitungs-API, ODbL', none: 'Kein Objekt dieser Arten ist im Umkreis von 150 m um den Punkt kartiert.',
    ty: { 'SPA': 'Vogelschutzgebiet (SPA)', 'SCI/SAC': 'FFH-Gebiet (SCI/SAC)', 'SPA and SCI/SAC': 'Vogelschutz- und FFH-Gebiet (SPA und SCI/SAC)' },
    ds: { 'green-belt': 'Grüngürtel', 'conservation-area': 'Erhaltungsgebiet', 'site-of-special-scientific-interest': 'Gebiet von besonderem wissenschaftlichem Interesse (SSSI)', 'area-of-outstanding-natural-beauty': 'National Landscape (AONB)', 'national-park': 'Nationalpark', 'special-area-of-conservation': 'Besonderes Schutzgebiet (SAC)', 'special-protection-area': 'Vogelschutzgebiet (SPA)', 'ramsar': 'Ramsar-Feuchtgebiet', 'ancient-woodland': 'Alter Wald' },
    kind: { 'protected area': 'Schutzgebiet', 'nature reserve': 'Naturschutzgebiet', 'national park': 'Nationalpark', 'conservation': 'Schutzgebiet' },
    tag: { residential: 'Wohngebiet', construction: 'Baustelle', commercial: 'Gewerbegebiet', retail: 'Einzelhandelsfläche', industrial: 'Industriegebiet', brownfield: 'geräumte Fläche', greenfield: 'zur Bebauung vorgesehene Fläche', forest: 'Forst', wood: 'Wald', farmland: 'Ackerland', meadow: 'Wiese', grass: 'Rasen', scrub: 'Gebüsch', orchard: 'Obstgarten', beach: 'Strand', sand: 'Sand', water: 'Wasser', wetland: 'Feuchtgebiet', park: 'Park', golf_course: 'Golfplatz', garden: 'Garten', nature_reserve: 'Naturschutzgebiet', cemetery: 'Friedhof', military: 'Militärgelände', railway: 'Bahngelände', vineyard: 'Weinberg', heath: 'Heide', bare_rock: 'Fels', marina: 'Jachthafen', resort: 'Ferienanlage' } },
  nl: { h: 'Beschermde en beperkte grond bij het punt', toc: 'Beschermde grond', mh: 'De geschiedenis van de kaart zelf op het perceel', mtoc: 'Kaartgeschiedenis',
    intro: 'Officiële en open kaartlagen, gecontroleerd op {d}. Het punt is ongeveer {a} m nauwkeurig, dus een grens die dichterbij ligt kan het perceel wel of niet kruisen.',
    n2k: 'Natura 2000 (EU-natuurnetwerk)', n2in: 'Het punt ligt in Natura 2000-gebied {n} ({c}, {t}).', n2near: 'Niet in een Natura 2000-gebied. Binnen 2 km:', n2none: 'Geen Natura 2000-gebied bevat het punt of komt binnen 2 km.',
    about: 'ongeveer {m} m van het punt', n2src: 'EEA Natura 2000-gebieden, versie {r}', sdf: 'gebiedsfiche',
    es: 'Spaanse kustwet (Ley de Costas)', sea: 'De zee, zoals gekarteerd in OpenStreetMap, ligt ongeveer {m} m van het punt.', sea0: 'Het punt valt op de zee zoals gekarteerd in OpenStreetMap.', seafar: 'De zee, zoals gekarteerd in OpenStreetMap, ligt meer dan 1 km van het punt.',
    eslaw: 'Volgens de Ley de Costas geldt een beschermingserfdienstbaarheid van 100 m landinwaarts vanaf de binnengrens van de kust (artikel 23; 20 m op grond die in 1988 al stedelijk was, overgangsbepaling 3) en de invloedszone is minstens 500 m (artikel 30). De wettelijke lijn is de afbakening (deslinde) van MITECO.',
    esnear: 'Het punt ligt binnen 600 m van de gekarteerde zee, dus de officiële lijn telt hier: open die in de viewer van MITECO.', esmit: 'De kaartdienst van de afbakeningslijn van MITECO gaf een fout toen we op {d} controleerden, en de bestandsdownload vraagt een menselijke controle, dus hebben we gemeten tot de gekarteerde zee.',
    esmit_ok: 'We hebben gemeten tot de zee zoals gekarteerd in OpenStreetMap, niet tot de wettelijke lijn.', viewer: 'Kustviewer van MITECO', law: 'Ley 22/1988 (BOE)',
    eng: 'Ruimtelijke aanwijzingen in Engeland', engin: 'Binnen', engnone: 'Geen van deze lagen bevat het punt of komt binnen 500 m: {l}.', engerr: 'Het register antwoordde niet toen we op {d} controleerden. Open het bij het punt:', engopen: 'Planning Data-kaart',
    engsrc: 'Planning Data for England (MHCLG), OGL v3.0', sco: 'Schotland: aangewezen gebieden', scotx: 'Aangewezen gebieden in Schotland staan in NatureScot SiteLink. Dat raadplegen we nog niet.', sitelink: 'NatureScot SiteLink',
    osm: 'Beschermde gebieden gekarteerd in OpenStreetMap', osin: 'Binnen {k} {n}.', osnear: 'Niet in een gekarteerd beschermd gebied. Binnen 1 km:', osnone: 'Geen gekarteerd beschermd gebied, natuurreservaat of nationaal park bevat het punt of komt binnen 1 km.',
    oslim: 'Grenzen getekend door vrijwilligers. Een OpenStreetMap-grens is geen juridisch document, en een ontbrekende grens bewijst niet dat de grond onbeschermd is.', ossrc: 'OpenStreetMap via OpenFreeMap-tegels, versie {b}, ODbL',
    unav: 'Deze bron antwoordde niet toen we op {d} controleerden.', lim: 'Hier niet gecontroleerd: het gemeentelijke bestemmingsplan, rooilijnen en erfgoedbescherming. Het kadaster, de gemeente en een lokale advocaat geven het bindende antwoord.', live: 'een ander punt controleren', method: 'methode en gegevens', upd: 'bijgewerkt op {d}',
    mintro: 'Wat vrijwilligers binnen 150 m van het punt in OpenStreetMap hebben getekend, en wanneer. Een kaartwijziging is geen vergunning of opmeting: ze toont wanneer iemand iets tekende, soms jaren na de bouw.',
    mb: 'Gebouwen', mr: 'Wegen en paden', ml: 'Grondgebruik', mn: '{n} gekarteerd, het eerste op {a}, laatst gewijzigd op {b}', m0: 'Geen gekarteerd binnen 150 m.', mcons: 'Gekarteerd als in aanbouw',
    mcn: 'gekarteerd: {n}, het eerste getekend op {a}', myr: 'Gebouwen per jaar van eerste kartering', tl: 'Tijdlijn', t_b1: 'Eerste gebouw gekarteerd', t_r1: 'Eerste weg gekarteerd', t_l1: '{k}: voor het eerst gekarteerd', t_c1: 'Eerste object gekarteerd als in aanbouw', t_last: 'Laatste wijziging binnen 150 m ({k})',
    t_yr: '{n} gebouwen voor het eerst gekarteerd in {y}', hist: 'geschiedenis', mlim: 'Objecten die van de kaart zijn verwijderd, tellen niet mee. Datums zijn wanneer een object werd getekend of gewijzigd, niet wanneer het werd gebouwd. Het punt is ongeveer {a} m nauwkeurig.', msrc: 'OpenStreetMap-bewerkings-API, ODbL', none: 'Geen object van deze soorten is gekarteerd binnen 150 m van het punt.',
    ty: { 'SPA': 'vogelrichtlijngebied (SPA)', 'SCI/SAC': 'habitatrichtlijngebied (SCI/SAC)', 'SPA and SCI/SAC': 'vogel- en habitatrichtlijngebied (SPA en SCI/SAC)' },
    ds: { 'green-belt': 'Groene gordel', 'conservation-area': 'Beschermd stadsgezicht', 'site-of-special-scientific-interest': 'Gebied van bijzonder wetenschappelijk belang (SSSI)', 'area-of-outstanding-natural-beauty': 'National Landscape (AONB)', 'national-park': 'Nationaal park', 'special-area-of-conservation': 'Speciale beschermingszone (SAC)', 'special-protection-area': 'Vogelbeschermingszone (SPA)', 'ramsar': 'Ramsar-wetland', 'ancient-woodland': 'Oud bos' },
    kind: { 'protected area': 'beschermd gebied', 'nature reserve': 'natuurreservaat', 'national park': 'nationaal park', 'conservation': 'beschermd gebied' },
    tag: { residential: 'woonwijk', construction: 'bouwterrein', commercial: 'bedrijventerrein', retail: 'winkelgebied', industrial: 'industrieterrein', brownfield: 'braakliggend terrein', greenfield: 'grond bestemd voor bouw', forest: 'productiebos', wood: 'bos', farmland: 'akkerland', meadow: 'weide', grass: 'grasveld', scrub: 'struikgewas', orchard: 'boomgaard', beach: 'strand', sand: 'zand', water: 'water', wetland: 'moerasgebied', park: 'park', golf_course: 'golfbaan', garden: 'tuin', nature_reserve: 'natuurreservaat', cemetery: 'begraafplaats', military: 'militair terrein', railway: 'spoorterrein', vineyard: 'wijngaard', heath: 'heide', bare_rock: 'kale rots', marina: 'jachthaven', resort: 'resort' } },
  ru: { h: 'Охраняемые и ограниченные земли рядом с точкой', toc: 'Охраняемые земли', mh: 'История самой карты на участке', mtoc: 'История карты',
    intro: 'Официальные и открытые слои карт проверены {d}. Точность точки около {a} м, поэтому граница ближе этого может проходить через участок, а может и нет.',
    n2k: 'Natura 2000 (природная сеть ЕС)', n2in: 'Точка находится внутри территории Natura 2000 {n} ({c}, {t}).', n2near: 'Не внутри территории Natura 2000. В пределах 2 км:', n2none: 'Ни одна территория Natura 2000 не содержит точку и не подходит ближе 2 км.',
    about: 'примерно в {m} м от точки', n2src: 'Территории Natura 2000, ЕАОС, выпуск {r}', sdf: 'карточка территории',
    es: 'Закон Испании о побережье (Ley de Costas)', sea: 'Море, как оно нанесено в OpenStreetMap, примерно в {m} м от точки.', sea0: 'Точка попадает на море, как оно нанесено в OpenStreetMap.', seafar: 'Море, как оно нанесено в OpenStreetMap, дальше 1 км от точки.',
    eslaw: 'По Ley de Costas охранный сервитут действует на 100 м вглубь суши от внутренней границы берега (статья 23; 20 м на землях, которые уже были городскими в 1988 году, третье переходное положение), а зона влияния составляет не менее 500 м (статья 30). Юридическая линия устанавливается разграничением (deslinde) MITECO.',
    esnear: 'Точка ближе 600 м к морю на карте, поэтому здесь важна официальная линия: откройте её в картографическом сервисе MITECO.', esmit: 'Картографический сервис линии разграничения MITECO ответил ошибкой при нашей проверке {d}, а скачивание файлов требует проверки человеком, поэтому мы измерили расстояние до моря на карте.',
    esmit_ok: 'Мы измерили расстояние до моря на карте OpenStreetMap, а не до юридической линии.', viewer: 'Карта побережья MITECO', law: 'Ley 22/1988 (BOE)',
    eng: 'Градостроительные зоны Англии', engin: 'Внутри', engnone: 'Ни один из этих слоёв не содержит точку и не подходит ближе 500 м: {l}.', engerr: 'Реестр не ответил при нашей проверке {d}. Откройте его в точке:', engopen: 'Карта Planning Data',
    engsrc: 'Planning Data for England (MHCLG), OGL v3.0', sco: 'Шотландия: охраняемые территории', scotx: 'Охраняемые территории Шотландии есть в NatureScot SiteLink. Мы пока его не запрашиваем.', sitelink: 'NatureScot SiteLink',
    osm: 'Охраняемые территории на карте OpenStreetMap', osin: 'Внутри: {k} {n}.', osnear: 'Не внутри охраняемой территории на карте. В пределах 1 км:', osnone: 'Ни одна охраняемая территория, заповедник или национальный парк на карте не содержит точку и не подходит ближе 1 км.',
    oslim: 'Границы нанесены добровольцами. Граница в OpenStreetMap не является юридическим документом, а отсутствие границы не доказывает, что земля не охраняется.', ossrc: 'OpenStreetMap через тайлы OpenFreeMap, сборка {b}, ODbL',
    unav: 'Этот источник не ответил при нашей проверке {d}.', lim: 'Здесь не проверено: муниципальный план зонирования, линии застройки и охрана наследия. Обязательный ответ дают земельный кадастр, муниципалитет и местный юрист.', live: 'проверить другую точку', method: 'метод и данные', upd: 'обновлено {d}',
    mintro: 'Что добровольцы нанесли в OpenStreetMap в пределах 150 м от точки и когда. Правка карты не является разрешением или съёмкой: она показывает, когда кто-то нарисовал объект, иногда через годы после постройки.',
    mb: 'Здания', mr: 'Дороги и проезды', ml: 'Землепользование', mn: 'нанесено {n}, первое {a}, последнее изменение {b}', m0: 'В пределах 150 м ничего не нанесено.', mcons: 'Нанесено как строящееся',
    mcn: 'нанесено: {n}, первый {a}', myr: 'Здания по году первого нанесения', tl: 'Хронология', t_b1: 'Первое здание на карте', t_r1: 'Первая дорога на карте', t_l1: '{k}: впервые на карте', t_c1: 'Первый объект, нанесённый как строящийся', t_last: 'Последнее изменение в пределах 150 м ({k})',
    t_yr: '{n} зданий впервые нанесено в {y} году', hist: 'история', mlim: 'Объекты, удалённые с карты, не учитываются. Даты показывают, когда объект нарисовали или изменили, а не когда построили. Точность точки около {a} м.', msrc: 'API редактирования OpenStreetMap, ODbL', none: 'В пределах 150 м от точки нет объектов этих типов.',
    ty: { 'SPA': 'зона охраны птиц (SPA)', 'SCI/SAC': 'территория охраны местообитаний (SCI/SAC)', 'SPA and SCI/SAC': 'территория охраны птиц и местообитаний (SPA и SCI/SAC)' },
    ds: { 'green-belt': 'Зелёный пояс', 'conservation-area': 'Охраняемая застройка', 'site-of-special-scientific-interest': 'Территория особого научного интереса (SSSI)', 'area-of-outstanding-natural-beauty': 'Национальный ландшафт (AONB)', 'national-park': 'Национальный парк', 'special-area-of-conservation': 'Особая охраняемая зона (SAC)', 'special-protection-area': 'Зона особой охраны птиц (SPA)', 'ramsar': 'Рамсарское водно-болотное угодье', 'ancient-woodland': 'Старый лес' },
    kind: { 'protected area': 'охраняемая территория', 'nature reserve': 'заповедник', 'national park': 'национальный парк', 'conservation': 'охраняемая территория' },
    tag: { residential: 'жилая зона', construction: 'стройплощадка', commercial: 'деловая зона', retail: 'торговая зона', industrial: 'промзона', brownfield: 'расчищенный участок', greenfield: 'участок под застройку', forest: 'лес', wood: 'лесной массив', farmland: 'пашня', meadow: 'луг', grass: 'газон', scrub: 'кустарник', orchard: 'сад', beach: 'пляж', sand: 'песок', water: 'вода', wetland: 'болото', park: 'парк', golf_course: 'поле для гольфа', garden: 'сад', nature_reserve: 'заповедник', cemetery: 'кладбище', military: 'военная зона', railway: 'железнодорожная зона', vineyard: 'виноградник', heath: 'пустошь', bare_rock: 'скалы', marina: 'марина', resort: 'курорт' } },
  zh: { h: '定位点附近的保护区与受限土地', toc: '保护区', mh: '地块上地图本身的历史', mtoc: '地图历史',
    intro: '官方及开放地图图层，于 {d} 查询。定位点精度约 {a} 米，因此比这更近的边界可能穿过地块，也可能不穿过。',
    n2k: 'Natura 2000（欧盟自然保护网络）', n2in: '定位点位于 Natura 2000 保护地 {n}（{c}，{t}）内。', n2near: '不在 Natura 2000 保护地内。2 公里内有：', n2none: '没有 Natura 2000 保护地包含定位点或位于 2 公里内。',
    about: '距定位点约 {m} 米', n2src: '欧洲环境署 Natura 2000 保护地，版本 {r}', sdf: '保护地档案',
    es: '西班牙海岸法（Ley de Costas）', sea: 'OpenStreetMap 中绘制的海岸距定位点约 {m} 米。', sea0: '定位点落在 OpenStreetMap 绘制的海面上。', seafar: 'OpenStreetMap 中绘制的海岸距定位点超过 1 公里。',
    eslaw: '根据 Ley de Costas，保护地役区为自海岸内缘向内陆 100 米（第 23 条；1988 年时已属城市用地的为 20 米，第三过渡条款），影响区至少 500 米（第 30 条）。法定界线由 MITECO 的海岸界定（deslinde）确定。',
    esnear: '定位点距绘制的海岸不到 600 米，因此官方界线在此很重要：请在 MITECO 地图查看器中打开。', esmit: '我们于 {d} 查询时，MITECO 界定线地图服务返回错误，其文件下载需要人工验证，因此我们改为测量到绘制的海岸。',
    esmit_ok: '我们测量的是到 OpenStreetMap 绘制海岸的距离，不是到法定界线的距离。', viewer: 'MITECO 海岸查看器', law: 'Ley 22/1988（BOE）',
    eng: '英格兰规划保护区', engin: '位于其内', engnone: '这些图层都不包含定位点，也不在 500 米内：{l}。', engerr: '我们于 {d} 查询时登记系统没有响应。在定位点打开：', engopen: 'Planning Data 地图',
    engsrc: 'Planning Data for England（MHCLG），OGL v3.0', sco: '苏格兰：指定保护地', scotx: '苏格兰的指定保护地见 NatureScot SiteLink。我们暂未查询。', sitelink: 'NatureScot SiteLink',
    osm: 'OpenStreetMap 中绘制的保护区', osin: '位于{k}{n}内。', osnear: '不在已绘制的保护区内。1 公里内有：', osnone: '没有已绘制的保护区、自然保护区或国家公园包含定位点或位于 1 公里内。',
    oslim: '边界由志愿者绘制。OpenStreetMap 的边界不是法律文件，缺少边界也不能证明土地不受保护。', ossrc: 'OpenStreetMap，经 OpenFreeMap 瓦片，版本 {b}，ODbL',
    unav: '我们于 {d} 查询时该来源没有响应。', lim: '此处未查：市政分区规划、建筑红线和文物保护。具有约束力的答案来自土地登记部门、市政府和当地律师。', live: '查询其他定位点', method: '方法与数据', upd: '更新于 {d}',
    mintro: '志愿者在 OpenStreetMap 中于定位点 150 米内绘制了什么，以及何时绘制。地图编辑不是许可证也不是测量：它只表明某人何时绘制了某物，可能在建成多年之后。',
    mb: '建筑', mr: '道路', ml: '土地利用', mn: '已绘制 {n} 个，最早于 {a}，最近修改于 {b}', m0: '150 米内没有绘制。', mcons: '标注为在建',
    mcn: '{n} 个对象，最早绘制于 {a}', myr: '按首次绘制年份统计的建筑', tl: '时间线', t_b1: '首个建筑被绘制', t_r1: '首条道路被绘制', t_l1: '{k}首次绘制', t_c1: '首个标注为在建的对象', t_last: '150 米内最近一次修改（{k}）',
    t_yr: '{y} 年首次绘制 {n} 个建筑', hist: '历史', mlim: '已从地图删除的对象不计入。日期是对象被绘制或编辑的时间，不是建成时间。定位点精度约 {a} 米。', msrc: 'OpenStreetMap 编辑 API，ODbL', none: '定位点 150 米内没有绘制这些类型的对象。',
    ty: { 'SPA': '鸟类保护区（SPA）', 'SCI/SAC': '栖息地保护地（SCI/SAC）', 'SPA and SCI/SAC': '鸟类与栖息地保护地（SPA 和 SCI/SAC）' },
    ds: { 'green-belt': '绿化带', 'conservation-area': '保护街区', 'site-of-special-scientific-interest': '具特殊科学价值地点（SSSI）', 'area-of-outstanding-natural-beauty': '国家景观（AONB）', 'national-park': '国家公园', 'special-area-of-conservation': '特别保护区（SAC）', 'special-protection-area': '鸟类特别保护区（SPA）', 'ramsar': '拉姆萨尔湿地', 'ancient-woodland': '古林地' },
    kind: { 'protected area': '保护区', 'nature reserve': '自然保护区', 'national park': '国家公园', 'conservation': '保护区' },
    tag: { residential: '住宅区', construction: '施工区', commercial: '商业区', retail: '零售区', industrial: '工业区', brownfield: '已清理的土地', greenfield: '规划建设用地', forest: '人工林', wood: '树林', farmland: '耕地', meadow: '草甸', grass: '草地', scrub: '灌木丛', orchard: '果园', beach: '海滩', sand: '沙地', water: '水域', wetland: '湿地', park: '公园', golf_course: '高尔夫球场', garden: '花园', nature_reserve: '自然保护区', cemetery: '墓地', military: '军事用地', railway: '铁路用地', vineyard: '葡萄园', heath: '荒地', bare_rock: '裸岩', marina: '游艇码头', resort: '度假村' } },
  ar: { h: 'الأراضي المحمية والمقيّدة قرب النقطة', toc: 'الأراضي المحمية', mh: 'تاريخ الخريطة نفسها عند القطعة', mtoc: 'تاريخ الخريطة',
    intro: 'طبقات خرائط رسمية ومفتوحة فُحصت في {d}. دقة النقطة نحو {a} م، لذا فإن حدًا أقرب من ذلك قد يقطع القطعة وقد لا يقطعها.',
    n2k: 'ناتورا 2000 (شبكة الطبيعة في الاتحاد الأوروبي)', n2in: 'النقطة داخل موقع ناتورا 2000 ‏{n} ({c}، {t}).', n2near: 'ليست داخل موقع ناتورا 2000. ضمن 2 كم:', n2none: 'لا يحتوي أي موقع ناتورا 2000 على النقطة ولا يقترب منها ضمن 2 كم.',
    about: 'على بعد نحو {m} م من النقطة', n2src: 'مواقع ناتورا 2000، الوكالة الأوروبية للبيئة، إصدار {r}', sdf: 'سجل الموقع',
    es: 'قانون السواحل الإسباني (Ley de Costas)', sea: 'البحر كما هو مرسوم في OpenStreetMap على بعد نحو {m} م من النقطة.', sea0: 'تقع النقطة على البحر كما هو مرسوم في OpenStreetMap.', seafar: 'البحر كما هو مرسوم في OpenStreetMap على بعد أكثر من 1 كم من النقطة.',
    eslaw: 'بموجب Ley de Costas يمتد ارتفاق الحماية 100 م نحو اليابسة من الحد الداخلي للشاطئ (المادة 23؛ و20 م في الأراضي التي كانت حضرية في 1988، الحكم الانتقالي الثالث)، ومنطقة التأثير 500 م على الأقل (المادة 30). الخط القانوني هو ترسيم الحدود (deslinde) الصادر عن MITECO.',
    esnear: 'النقطة على بعد أقل من 600 م من البحر المرسوم، لذا فالخط الرسمي مهم هنا: افتحه في عارض MITECO.', esmit: 'ردّت خدمة خرائط خط الترسيم لدى MITECO بخطأ عندما فحصناها في {d}، وتنزيل ملفاتها يطلب تحققًا بشريًا، لذا قسنا المسافة إلى البحر المرسوم بدلًا من ذلك.',
    esmit_ok: 'قسنا المسافة إلى البحر المرسوم في OpenStreetMap، لا إلى الخط القانوني.', viewer: 'عارض السواحل لدى MITECO', law: 'Ley 22/1988 (BOE)',
    eng: 'تصنيفات التخطيط في إنجلترا', engin: 'داخل', engnone: 'لا تحتوي أي من هذه الطبقات على النقطة ولا تقترب منها ضمن 500 م: {l}.', engerr: 'لم يستجب السجل عندما فحصناه في {d}. افتحه عند النقطة:', engopen: 'خريطة Planning Data',
    engsrc: 'Planning Data for England (MHCLG)، OGL v3.0', sco: 'اسكتلندا: المواقع المصنّفة', scotx: 'المواقع المصنّفة في اسكتلندا موجودة في NatureScot SiteLink. لا نستعلم عنه بعد.', sitelink: 'NatureScot SiteLink',
    osm: 'المناطق المحمية المرسومة في OpenStreetMap', osin: 'داخل {k} {n}.', osnear: 'ليست داخل منطقة محمية مرسومة. ضمن 1 كم:', osnone: 'لا تحتوي أي منطقة محمية أو محمية طبيعية أو حديقة وطنية مرسومة على النقطة ولا تقترب منها ضمن 1 كم.',
    oslim: 'حدود رسمها متطوعون. حدود OpenStreetMap ليست وثيقة قانونية، وغياب الحد لا يثبت أن الأرض غير محمية.', ossrc: 'OpenStreetMap عبر بلاطات OpenFreeMap، إصدار {b}، ODbL',
    unav: 'لم يستجب هذا المصدر عندما فحصناه في {d}.', lim: 'لم يُفحص هنا: مخطط التنظيم البلدي وخطوط البناء وحماية التراث. الجواب الملزم لدى مكتب تسجيل الأراضي والبلدية ومحامٍ محلي.', live: 'افحص نقطة أخرى', method: 'المنهجية والبيانات', upd: 'حُدّث في {d}',
    mintro: 'ما رسمه المتطوعون في OpenStreetMap ضمن 150 م من النقطة، ومتى. تعديل الخريطة ليس ترخيصًا ولا مسحًا: إنه يبيّن متى رسم أحدهم شيئًا، وقد يكون ذلك بعد بنائه بسنوات.',
    mb: 'المباني', mr: 'الطرق والمسارات', ml: 'استخدام الأرض', mn: '{n} مرسومة، أولها في {a}، وآخر تغيير في {b}', m0: 'لا شيء مرسوم ضمن 150 م.', mcons: 'مرسوم على أنه قيد الإنشاء',
    mcn: 'العدد {n}، أولها رُسم في {a}', myr: 'المباني حسب سنة أول رسم', tl: 'الخط الزمني', t_b1: 'أول مبنى رُسم', t_r1: 'أول طريق رُسم', t_l1: '{k}: أول رسم على الخريطة', t_c1: 'أول عنصر رُسم على أنه قيد الإنشاء', t_last: 'آخر تغيير ضمن 150 م ({k})',
    t_yr: '{n} مبانٍ رُسمت لأول مرة في {y}', hist: 'السجل', mlim: 'لا تُحسب العناصر المحذوفة من الخريطة. التواريخ هي تواريخ رسم العنصر أو تعديله، لا تاريخ بنائه. دقة النقطة نحو {a} م.', msrc: 'واجهة تحرير OpenStreetMap، ODbL', none: 'لا يوجد عنصر من هذه الأنواع مرسوم ضمن 150 م من النقطة.',
    ty: { 'SPA': 'منطقة حماية الطيور (SPA)', 'SCI/SAC': 'موقع موائل (SCI/SAC)', 'SPA and SCI/SAC': 'موقع طيور وموائل (SPA وSCI/SAC)' },
    ds: { 'green-belt': 'الحزام الأخضر', 'conservation-area': 'منطقة حفاظ', 'site-of-special-scientific-interest': 'موقع ذو أهمية علمية خاصة (SSSI)', 'area-of-outstanding-natural-beauty': 'منظر طبيعي وطني (AONB)', 'national-park': 'حديقة وطنية', 'special-area-of-conservation': 'منطقة حماية خاصة (SAC)', 'special-protection-area': 'منطقة حماية خاصة للطيور (SPA)', 'ramsar': 'أرض رطبة رامسار', 'ancient-woodland': 'غابة قديمة' },
    kind: { 'protected area': 'منطقة محمية', 'nature reserve': 'محمية طبيعية', 'national park': 'حديقة وطنية', 'conservation': 'منطقة حفاظ' },
    tag: { residential: 'منطقة سكنية', construction: 'موقع بناء', commercial: 'منطقة تجارية', retail: 'منطقة متاجر', industrial: 'منطقة صناعية', brownfield: 'أرض ممهّدة', greenfield: 'أرض مخصصة للبناء', forest: 'غابة', wood: 'أشجار', farmland: 'أرض زراعية', meadow: 'مرج', grass: 'عشب', scrub: 'شجيرات', orchard: 'بستان', beach: 'شاطئ', sand: 'رمل', water: 'مياه', wetland: 'أرض رطبة', park: 'حديقة', golf_course: 'ملعب غولف', garden: 'حديقة منزلية', nature_reserve: 'محمية طبيعية', cemetery: 'مقبرة', military: 'أرض عسكرية', railway: 'أرض سكك حديد', vineyard: 'كرم عنب', heath: 'أرض بور', bare_rock: 'صخور جرداء', marina: 'مرسى', resort: 'منتجع' } },
};
const t = (lang, k, v) => { const s = (S[lang] && S[lang][k]) || S.en[k]; return v && typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
const tm = (lang, k, key) => ((S[lang] && S[lang][k]) || {})[key] || (S.en[k] || {})[key] || null;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cm = lang => lang === 'ar' ? '، ' : lang === 'zh' ? '，' : ', ';
const okU = u => typeof u === 'string' && /^https:\/\/[^\s"<>]+$/.test(u);
export const landToc = lang => t(lang, 'toc');
export const landHeading = lang => t(lang, 'h');
export const histToc = lang => t(lang, 'mtoc');
export const histHeading = lang => t(lang, 'mh');

const CSS = '<style id="kland-css">.kland h3{margin:20px 0 6px;font-size:var(--k-fs-lg,1.2rem)}.kland .kl-led{display:grid;grid-template-columns:minmax(0,1fr);margin:10px 0;border-top:1px solid var(--k-line,#ccd)}.kl-led>dt{margin:0;padding:12px 0 2px;font-weight:640;color:var(--k-ink,inherit)}.kl-led>dd{margin:0;padding:0 0 12px;border-bottom:1px solid var(--k-line,#ccd);text-align:start;line-height:1.55}@media (min-width:760px){.kl-led{grid-template-columns:220px minmax(0,1fr)}.kl-led>dt{padding:12px 16px 12px 0;padding-inline:0 16px;border-bottom:1px solid var(--k-line,#ccd)}.kl-led>dd{padding:12px 0}}.kl-led .k-src{display:inline-flex;margin-inline-start:4px}.kl-led ul.kl{margin:6px 0}.kland ul.kl{margin:4px 0 0;padding-inline-start:20px}.kland ul.kl li{margin:2px 0}' +
  '.kland .lim{font-size:var(--k-fs-xs,.82rem);color:var(--k-muted,#56636F);margin:8px 0}.kland .srcl{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:var(--k-fs-xs,.82rem);margin:8px 0 0}.kland .srcl a{color:var(--k-sea,#155C75)}' +
  '.kland code{font-size:.85em;background:var(--k-sunken,#E8ECEA);padding:1px 4px;border-radius:4px;overflow-wrap:anywhere}.kland dd{overflow-wrap:anywhere}' +
  '.klh-yr{display:flex;align-items:flex-end;gap:3px;height:76px;margin:8px 0 2px;padding:0;list-style:none;max-width:560px}.klh-yr li{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;font-size:11px;color:var(--k-muted,#56636F)}' +
  '.klh-yr li i{display:block;width:100%;max-width:26px;background:var(--k-sea,#155C75);border-radius:2px 2px 0 0;min-height:1px}.klh-yr li.z i{background:var(--k-line,#ccd);}.klh-yr li span{line-height:1.3;white-space:nowrap}.klh-yr li b{font-weight:600;font-size:11px;color:var(--k-ink-2,inherit)}' +
  '.klh-tl{list-style:none;margin:8px 0;padding:0;border-inline-start:2px solid var(--k-line,#ccd)}.klh-tl li{position:relative;margin:0 0 8px;padding-inline-start:16px}.klh-tl li::before{content:"";position:absolute;inset-inline-start:-6px;top:.45em;width:10px;height:10px;border-radius:50%;background:var(--k-surface,#fff);border:2px solid var(--k-sea,#155C75)}' +
  '.klh-tl time{font-variant-numeric:tabular-nums;font-weight:600;margin-inline-end:6px}</style>';

const num = (v, lang) => { try { return new Intl.NumberFormat(lang === 'en' ? 'en-GB' : lang).format(v); } catch (e) { return String(v); } };
const src = (href, label) => okU(href) ? '<a class="k-src" href="' + esc(href) + '" rel="noopener" target="_blank">' + esc(label) + '</a>' : '';

// ------------------------------------------------------------------------------------------------ #land
export function landHtml(ld, x, lang, fd) {
  const lr = ld && ld.lr, r = lr && lr.projects && lr.projects[x.id];
  if (!r) return '';
  const S0 = lr.sources || {}, acc = r.acc || 100, lat = (x.fx || {}).lat, lng = (x.fx || {}).lng, ck = fd(r.checked || lr.updated);
  const m = v => t(lang, 'about', { m: num(v, lang) });
  const rows = [];
  if (r.n2k || (r.scope || []).includes('n2k')) {
    const n = r.n2k || {}, s = S0.n2k || {}, rel = n.release ? fd(n.release) : '';
    let dd;
    const site = o => '<bdi>' + esc(o.name || o.code) + '</bdi> (' + esc(o.code) + ', ' + esc(tm(lang, 'ty', o.type) || o.type || '') + ')' + (okU(s.sdf) ? ' ' + src(s.sdf + encodeURIComponent(o.code), t(lang, 'sdf')) : '');
    if (!n.ok) dd = '<span class="k-muted">' + esc(t(lang, 'unav', { d: ck })) + '</span>';
    else if ((n.in || []).length) dd = n.in.map(o => esc(t(lang, 'n2in', { n: o.name || o.code, c: o.code, t: tm(lang, 'ty', o.type) || o.type || '' })) + (okU(s.sdf) ? ' ' + src(s.sdf + encodeURIComponent(o.code), t(lang, 'sdf')) : '')).join('<br>') +
      ((n.near || []).length ? '<ul class="kl">' + n.near.map(o => '<li>' + site(o) + ', ' + esc(m(o.d)) + '</li>').join('') + '</ul>' : '');
    else if ((n.near || []).length) dd = esc(t(lang, 'n2near')) + '<ul class="kl">' + n.near.map(o => '<li>' + site(o) + ', ' + esc(m(o.d)) + '</li>').join('') + '</ul>';
    else dd = esc(t(lang, 'n2none'));
    rows.push([t(lang, 'n2k'), dd + ' ' + src(s.url, t(lang, 'n2src', { r: rel || '?' }))]);
  }
  if (r.es) {
    const e = r.es, s = S0.es || {};
    let dd = !e.ok ? '<span class="k-muted">' + esc(t(lang, 'unav', { d: ck })) + '</span>' : esc(e.sea_m === 0 ? t(lang, 'sea0') : e.sea_m == null ? t(lang, 'seafar') : t(lang, 'sea', { m: num(e.sea_m, lang) }));
    dd += '<br>' + esc(t(lang, 'eslaw')) + ' ' + src(s.law, t(lang, 'law'));
    if (e.ok && e.sea_m != null && e.sea_m <= 600) dd += '<br>' + esc(t(lang, 'esnear'));
    dd += '<br><span class="k-muted">' + esc(e.mit === 'capabilities' ? t(lang, 'esmit_ok') : t(lang, 'esmit', { d: fd(((s.miteco || {}).checked) || r.checked) })) + '</span> ' + src(s.viewer, t(lang, 'viewer'));
    rows.push([t(lang, 'es'), dd]);
  }
  if ((r.scope || []).includes('eng')) {
    const e = r.eng || {}, s = S0.eng || {};
    const open = lat != null ? 'https://www.planning.data.gov.uk/map/#' + (+lat).toFixed(5) + ',' + (+lng).toFixed(5) + ',16z' : 'https://www.planning.data.gov.uk/map/';
    let dd;
    if (!e.ok) dd = '<span class="k-muted">' + esc(t(lang, 'engerr', { d: ck })) + '</span> ' + src(open, t(lang, 'engopen'));
    else if ((e.hits || []).length) dd = '<ul class="kl">' + e.hits.map(h => '<li>' + esc(tm(lang, 'ds', h.ds) || h.ds) + (h.name ? ': <bdi>' + esc(h.name) + '</bdi>' : '') + ', ' + esc(h.in ? t(lang, 'engin') : m(h.d)) +
      (h.entity ? ' ' + src('https://www.planning.data.gov.uk/entity/' + encodeURIComponent(h.entity), (h.ref || String(h.entity))) : '') + '</li>').join('') + '</ul>';
    else dd = esc(t(lang, 'engnone', { l: (s.datasets || []).map(k => tm(lang, 'ds', k) || k).join(', ') }));
    rows.push([t(lang, 'eng'), dd + ' ' + src(s.url, t(lang, 'engsrc'))]);
  }
  if ((r.scope || []).includes('sco')) rows.push([t(lang, 'sco'), esc(t(lang, 'scotx')) + ' ' + src('https://sitelink.nature.scot/map', t(lang, 'sitelink'))]);
  if (r.osm) {
    const o = r.osm, s = S0.osm || {}, kn = k => tm(lang, 'kind', k) || k;
    let dd;
    if (!o.ok) dd = '<span class="k-muted">' + esc(t(lang, 'unav', { d: ck })) + '</span>';
    else {
      dd = (o.in || []).map(a => esc(t(lang, 'osin', { k: kn(a.kind), n: a.name ? '"' + a.name + '"' : '' }).replace(/\s+\./, '.'))).join('<br>');
      if ((o.near || []).length) dd += (dd ? '<br>' : esc(t(lang, 'osnear'))) + '<ul class="kl">' + o.near.map(a => '<li>' + esc(kn(a.kind)) + (a.name ? ' <bdi>"' + esc(a.name) + '"</bdi>' : '') + ', ' + esc(m(a.d)) + '</li>').join('') + '</ul>';
      if (!dd) dd = esc(t(lang, 'osnone'));
    }
    rows.push([t(lang, 'osm'), dd + '<br><span class="k-muted k-small">' + esc(t(lang, 'oslim')) + '</span> ' + src(s.url, t(lang, 'ossrc', { b: fd(o.build || s.build || lr.updated) }))]);
  }
  if (!rows.length) return '';
  const q = lat != null ? '?lat=' + (+lat).toFixed(4) + '&lng=' + (+lng).toFixed(4) : '';
  return CSS + '<div class="kland"><p class="ki">' + esc(t(lang, 'intro', { d: ck, a: num(acc, lang) })) + '</p>' +
    '<dl class="kl-led">' + rows.map(([a, b]) => '<dt>' + esc(a) + '</dt><dd>' + b + '</dd>').join('') + '</dl>' +
    '<p class="lim">' + esc(t(lang, 'lim')) + '</p><p class="srcl"><a href="/hazards/' + esc(q) + '#protected">' + esc(t(lang, 'live')) + '</a><a href="/api/x/land/' + encodeURIComponent(x.id) + '">' + esc(t(lang, 'method')) + cm(lang) + esc(t(lang, 'upd', { d: fd(lr.updated) })) + '</a></p></div>';
}

// ------------------------------------------------------------------------------------------------ #maphist
function tagLabel(lang, tag) {
  const v = String(tag || '').split('=')[1] || '';
  const k = String(tag || '').split('=')[0];
  if (k === 'building') return tm(lang, 'tag', 'construction') && v === 'construction' ? t(lang, 'mb') + ' (' + tm(lang, 'tag', 'construction') + ')' : t(lang, 'mb');
  if (k === 'highway') return t(lang, 'mr');
  return tm(lang, 'tag', v) || null;
}
const osmU = (ty, id) => 'https://www.openstreetmap.org/' + (ty === 'r' ? 'relation' : 'way') + '/' + encodeURIComponent(id) + '/history';
export function histHtml(ld, x, lang, fd) {
  const mh = ld && ld.mh, r = mh && mh.projects && mh.projects[x.id];
  if (!r) return '';
  const acc = r.acc || 100, s = mh.source || {};
  if (!r.ok) return CSS + '<div class="kland"><p class="k-muted">' + esc(t(lang, 'unav', { d: fd(r.checked || mh.updated) })) + '</p></div>';
  const b = r.b || {}, rd = r.r || {}, l = r.l || {};
  const line = o => o && o.n ? esc(t(lang, 'mn', { n: num(o.n, lang), a: fd(o.first), b: fd(o.last) })) : '<span class="k-muted">' + esc(t(lang, 'm0')) + '</span>';
  const tagHtml = tag => { const lb = tagLabel(lang, tag); return lb ? esc(lb) + ' <bdi><code>' + esc(tag) + '</code></bdi>' : '<bdi><code>' + esc(tag) + '</code></bdi>'; };
  const rows = [[t(lang, 'mb'), line(b)], [t(lang, 'mr'), line(rd)]];
  const land = [];   // one row per kind and name: several unnamed forest patches read as one line
  for (const a of (r.land || []).filter(a => a.first)) {
    const g = land.find(o => o.tag === a.tag && (o.name || '') === (a.name || ''));
    if (!g) land.push(Object.assign({ k: 1 }, a));
    else { g.k++; if (a.first < g.first) Object.assign(g, { first: a.first, t: a.t, id: a.id }); if ((a.last || '') > (g.last || '')) g.last = a.last; }
  }
  rows.push([t(lang, 'ml'), land.length ? '<ul class="kl">' + land.map(a => '<li>' + tagHtml(a.tag) + (a.name ? ' <bdi>"' + esc(a.name) + '"</bdi>' : '') + (a.k > 1 ? ' (' + num(a.k, lang) + ')' : '') + ': ' + '<bdi>' + esc(fd(a.first)) + (a.last && a.last !== a.first ? ', ' + esc(fd(a.last)) : '') + '</bdi>' + ' ' + src(osmU(a.t, a.id), t(lang, 'hist')) + '</li>').join('') + '</ul>' : '<span class="k-muted">' + esc(t(lang, 'm0')) + '</span>']);
  const cons = (r.cons || []).filter(c => c.first);
  if (cons.length) rows.push([t(lang, 'mcons'), esc(t(lang, 'mcn', { n: num(cons.length, lang), a: fd(cons[0].first) })) + ' ' + src(osmU(cons[0].t, cons[0].id), t(lang, 'hist'))]);
  if (!b.n && !rd.n && !l.n) return CSS + '<div class="kland"><p class="ki">' + esc(t(lang, 'mintro')) + '</p><p>' + esc(t(lang, 'none')) + '</p><p class="srcl">' + src(s.url, t(lang, 'msrc')) + '</p></div>';
  // buildings by year first mapped: every year from the first to the year of the check, so gaps show
  let yr = '';
  const by = b.by_year || {}, ys = Object.keys(by).map(Number).filter(Boolean);
  if (ys.length) {
    const y0 = Math.min(...ys), y1 = Math.max(Number(String(r.checked || mh.updated).slice(0, 4)) || y0, ...ys), mx = Math.max(...Object.values(by));
    const span = []; for (let y = Math.max(y0, y1 - 19); y <= y1; y++) span.push(y);
    const lab = span.length > 10 ? (y => y === span[0] || y === y1 || y % 5 === 0) : (() => true);
    yr = '<h3>' + esc(t(lang, 'myr')) + '</h3><ul class="klh-yr" role="list">' + span.map(y => { const n = by[y] || 0; return '<li' + (n ? '' : ' class="z"') + ' aria-label="' + y + ': ' + n + '">' + (n ? '<b>' + num(n, lang) + '</b>' : '') + '<i style="height:' + (n ? Math.max(4, Math.round(n / mx * 52)) : 1) + 'px"></i><span>' + (lab(y) ? "'" + String(y).slice(2) : '&nbsp;') + '</span></li>'; }).join('') + '</ul>' +
      (y0 < span[0] ? '<p class="lim">' + esc(t(lang, 'mn', { n: num(Object.entries(by).filter(([k]) => +k < span[0]).reduce((a, [, v]) => a + v, 0), lang), a: y0, b: span[0] - 1 })) + '</p>' : '');
  }
  // timeline: first building, first road, first time each kind of land use was drawn, first construction tag, busiest year, latest change
  const ev = [];
  if (b.first) ev.push([b.first, t(lang, 't_b1')]);
  if (rd.first) ev.push([rd.first, t(lang, 't_r1')]);
  const seen = new Set();
  for (const a of land.slice().sort((p, q) => (p.first || '').localeCompare(q.first || ''))) { const k = tagLabel(lang, a.tag) || a.tag; if (seen.has(k) || seen.size >= 3) continue; seen.add(k); ev.push([a.first, t(lang, 't_l1', { k: k.charAt(0).toUpperCase() + k.slice(1) })]); }
  if (cons.length) ev.push([cons[0].first, t(lang, 't_c1')]);
  const top = Object.entries(by).sort((p, q) => q[1] - p[1])[0];
  if (top && top[1] >= 3 && Object.keys(by).length > 1) ev.push([top[0] + '-12-31', t(lang, 't_yr', { n: num(top[1], lang), y: top[0] }), top[0]]);
  const rc = (r.recent || [])[0];
  if (rc && rc.last) ev.push([rc.last, t(lang, 't_last', { k: tagLabel(lang, rc.tag) || rc.tag }), null, osmU(rc.t, rc.id)]);
  ev.sort((p, q) => p[0].localeCompare(q[0]));
  const tl = ev.length ? '<h3>' + esc(t(lang, 'tl')) + '</h3><ol class="klh-tl">' + ev.map(([d, txt, y, u]) => '<li><time datetime="' + esc(y || d) + '">' + esc(y || fd(d)) + '</time>' + esc(txt) + (u ? ' ' + src(u, t(lang, 'hist')) : '') + '</li>').join('') + '</ol>' : '';
  return CSS + '<div class="kland"><p class="ki">' + esc(t(lang, 'mintro')) + '</p><dl class="kl-led">' + rows.map(([a, c]) => '<dt>' + esc(a) + '</dt><dd>' + c + '</dd>').join('') + '</dl>' + yr + tl +
    '<p class="lim">' + esc(t(lang, 'mlim', { a: num(acc, lang) })) + '</p><p class="srcl">' + src(s.url, t(lang, 'msrc')) + '<a href="/api/x/land/' + encodeURIComponent(x.id) + '">' + esc(t(lang, 'method')) + cm(lang) + esc(t(lang, 'upd', { d: fd(mh.updated) })) + '</a></p></div>';
}

// ------------------------------------------------------------------------------------------------ API
const J = (o, s = 200, age = 0) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': age ? 'public, max-age=' + age : 'no-store', 'x-content-type-options': 'nosniff' } });
export async function handle(req, u, env) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return J({ error: 'GET only' }, 405);
  const id = decodeURIComponent(u.pathname.replace(/^\/api\/x\/land\/?/, '').replace(/\/$/, ''));
  const ld = await landData(env).catch(() => null);
  if (!ld || (!ld.lr && !ld.mh)) return J({ error: 'data not published yet' }, 503);
  const pick = f => f ? Object.fromEntries(Object.entries(f).filter(([k]) => k !== 'projects')) : null;
  if (!id || id === 'about') return J({ about: 'Protected and restricted land near each pinned project and the OpenStreetMap history within 150 m. Shown in #land and #maphist on named project pages.',
    land_rules: pick(ld.lr), map_history: pick(ld.mh), projects: Object.keys((ld.lr && ld.lr.projects) || {}).length, files: ['/data/land-rules.json', '/data/map-history.json'], example: '/api/x/land/CDS-001' }, 200, 3600);
  if (!/^[A-Z0-9-]{3,20}$/.test(id)) return J({ error: 'bad id' }, 400);
  const a = ld.lr && ld.lr.projects && ld.lr.projects[id], b = ld.mh && ld.mh.projects && ld.mh.projects[id];
  if (!a && !b) return J({ error: 'not found', note: 'Only named projects with a plot-level pin are covered.' }, 404, 600);
  return J({ id, land_rules: a || null, map_history: b || null, sources: Object.assign({}, (ld.lr || {}).sources || {}, { osm_history: (ld.mh || {}).source || null }), method: (ld.mh || {}).method || null, updated: { land_rules: (ld.lr || {}).updated || null, map_history: (ld.mh || {}).updated || null } }, 200, 3600);
}
