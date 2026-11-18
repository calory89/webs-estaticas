// kolaboro.com batch 18 (n18b): construction stage estimate per month from open satellite and map data. Plain rules, no model,
// no training, no AI calls. Inputs are the public files the "from space" section already shows:
//   /data/construction-progress.json  Sentinel-2 L2A monthly change index of the 150 m circle (kbx_named_sat.js index())
//   /data/satellite-radar.json        Sentinel-1 RTC VV/VH change index, only for cloudy plots (kbx_space.js)
//   /data/buildings.json              Overture Maps building footprints touching the circle, with GERS first-seen release
//   developer's promised dates        /data/promises.json and the project record (kbx_named_sat.js milestones())
// Shown inside the "from space" section of named project pages (kbx_named_sat.js calls stageHtml) and in the time machine.
// Routes:
//   GET /api/x/stage/<ID>                          per-month estimate, confidence and reasons for one named project (JSON)
//   GET /methods/construction-stage/ (+ /<lang>/)  the rules in 8 languages
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOCALE = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const VERSION = 'stage-rules-1';
export const PATHS = /^\/api\/x\/stage(?:\/|$)/;
export const RULES = { optical_band_pts: 15, optical_window: 3, earthworks_after_clear_months: 3, radar_window: 3, footprint_cover_pct: 10, footprint_near_m: 75, already_built_pct: 50, min_clear_months: 6, start_grace_months: 6 };
const ORDER = ['none', 'cleared', 'earthworks', 'structure', 'roofed'];

// ------------------------------------------------------------------------------------------------ strings (8 languages)
const S = {
  en: { o_ever: 'Satellite: the circle first rose {b} points or more above the start in {m}.', d_pre: 'Buildings are mapped here, and the circle already looked {p}% built-up or bare in {base}: they were probably there before the series starts, or belong to a neighbour.', o_built: 'Satellite: the circle already looked {p}% built-up or bare at the start, so a structure rising on it may not show in these images.', b_far: 'Map: the nearest building footprint is {d} m from the pin, more than the {t} m these rules count (Overture {rel}).', m_rule_x: 'Two refinements: a radar rise on a plot that already looked at least {a}% built-up or bare at the start counts as "structure likely" (optical images cannot show height on concrete); footprints count only if one lies within {n} m of the pin.', h: 'Construction stage estimate', intro: 'Plain rules combine the satellite change index, radar where we read it, mapped building footprints and the developer\'s dates into one estimate per month. It is read from 10 m pixels, not from a site inspection.',
    latest: 'Estimate for {m}', conf: 'Confidence: {c}', c_high: 'high', c_medium: 'medium', c_low: 'low', why: 'Why',
    st_none: 'No change seen', st_cleared: 'Cleared land', st_earthworks: 'Earthworks likely', st_structure: 'Structure likely', st_roofed: 'Roofed buildings mapped', st_cant: 'Can\'t tell', st_nodata: 'No reading', st_base: 'Baseline months',
    o_up: 'Satellite: the circle looks {x} points more built-up or bare than its surroundings, against {base}, for {k} clear months in a row.', o_same: 'Satellite: no change beyond normal variation (±{b} points) against {base}.',
    o_green: 'Satellite: the circle looks {x} points less built-up or bare than its surroundings, against {base}.', o_gap: 'Satellite: no clear view this month (last clear view: {m}).', o_never: 'Satellite: no clear view this month.', o_base: 'Satellite: {m} is one of the first 3 clear months, which the index is measured against.',
    r_up: 'Radar: VV backscatter {x} dB against the first months, beyond normal variation (±{b} dB). New walls, frames and roofs usually do this.', r_flat: 'Radar: no change beyond normal variation (±{b} dB).', r_down: 'Radar: VV backscatter {x} dB, below normal variation (±{b} dB).',
    r_vh: 'Radar: VH {x} dB, as when vegetation is cleared.', r_na: 'Radar: not read for this site (clear skies in most months).', r_gap: 'Radar: no reading for this month.',
    b_yes: 'Map: {n} building footprints cover {p}% of the circle (Overture {rel}).', b_yesf: 'Map: {n} building footprints cover {p}% of the circle (Overture {rel}), first seen {d}.', b_low: 'Map: building footprints cover {p}% of the circle, under the {t}% these rules count (Overture {rel}).', b_no: 'Map: no building footprint in the circle (Overture {rel}).', b_later: 'Map: footprints first seen {d}, after this month.',
    d_ro: 'Signals disagree: radar shows a change that the optical images do not.', d_bo: 'Signals disagree: buildings are mapped, but the images show no change since {base}. They may be older than the series or belong to a neighbour.',
    d_g: 'The site looks greener than at the start; these rules do not read that as a stage.', d_rd: 'Radar went down while no clear image was available; these rules do not read that alone.',
    p_hand: 'The developer\'s promised handover ({d}) has passed.', p_start: 'The developer\'s promised construction start ({d}) is more than 6 months earlier.',
    thin: 'Not enough data for a stage estimate: {c} clear months and no radar.', leg: 'One cell per month, oldest on the left. Hover or open the table for each month.',
    tbl: 'Monthly estimates', th: ['Month', 'Estimate', 'Confidence', 'Signals'], s_o: 'satellite {x}', s_r: 'radar {x} dB', s_b: 'map: buildings', method: 'How the estimate works', api: 'JSON for this project',
    lim: 'Rules, not a trained model. A cleared plot and a concrete slab look alike at 10 m, a tower rising on an existing slab may change little, and footprints can be years behind the ground. Ask the developer for dated site photos to confirm.',
    m_title: 'How we estimate the construction stage from space', m_desc: 'The plain rules behind the monthly construction stage estimate on Kolaboro project pages: inputs, thresholds, confidence and when we say we can\'t tell.',
    m_lead: 'Each month gets one of five stages, a confidence and the reasons, from open satellite and map data. When signals disagree or data is thin, the page says "can\'t tell".', m_h_in: 'Inputs', m_h_rules: 'Rules, in order', m_h_conf: 'Confidence', m_h_cant: 'When we say "can\'t tell"', m_h_lim: 'Limits', m_h_data: 'Data and licences',
    m_in: ['Sentinel-2 change index: built-up or bare share of a 150 m circle around the pin minus that of a ring 300 to 600 m away, against the first 3 clear months, in points. We use the median of the last {w} clear months, so one odd month does not move the stage.', 'Sentinel-1 radar (only for plots that clouds hide in at least a quarter of months): VV and VH backscatter of the same circle minus the ring, against the first 3 months, median of the last {w} months, in dB.', 'Overture Maps building footprints touching the circle, the share of the circle they cover and the release in which each was first seen.', 'The developer\'s promised construction start and handover from our dated promise history.'],
    m_rules: ['Baseline months: the first 3 clear months, which everything is measured against.', 'Roofed buildings mapped: footprints cover at least {t}% of the circle in a release up to that month, and the images or the radar changed at some point before.', 'Structure likely: the radar rose beyond its normal month-to-month variation, and the optical images do not contradict it.', 'Earthworks likely: the optical index stayed at least {b} points above the start for {e} or more clear months in a row.', 'Cleared land: the optical index rose at least {b} points above the start, for fewer than {e} clear months so far.', 'No change seen: the optical index (and the radar, where read) stayed within normal variation.'],
    m_conf: 'High when two independent signals support the stage (for example the images and the radar), medium when one signal supports it for at least 3 months, low otherwise. The developer\'s dates never raise confidence; they are shown next to the estimate as context.',
    m_cant: ['the radar shows a change and a clear image the same month shows none;', 'buildings are mapped but the images never changed since the start of the series;', 'the circle turned greener than at the start;', 'a project has fewer than {c} clear months and no radar ("not enough data").'],
    m_lim: 'At 10 m a cleared plot and a slab look alike, finished buildings look unchanged, and footprints drawn from imagery can be years behind. The pin is about 100 m accurate. Use the estimate as a reason to ask for dated site photos, not as proof of progress or of a stop.',
    m_data: 'Contains modified Copernicus Sentinel data (free and open); Sentinel-1 RTC from Microsoft Planetary Computer (CC BY 4.0); building footprints from Overture Maps (ODbL 1.0, © OpenStreetMap contributors, Overture Maps Foundation). Estimates: CC BY 4.0, credit Kolaboro.' },
  es: { o_ever: 'Satélite: el círculo subió por primera vez {b} puntos o más sobre el inicio en {m}.', d_pre: 'Hay edificios cartografiados aquí y el círculo ya se veía edificado o desnudo en un {p}% en {base}: probablemente ya estaban antes del inicio de la serie o son de un vecino.', o_built: 'Satélite: el círculo ya se veía edificado o desnudo en un {p}% al principio, así que una estructura que crezca encima puede no verse en estas imágenes.', b_far: 'Mapa: la huella de edificio más cercana está a {d} m del punto, más de los {t} m que cuentan estas reglas (Overture {rel}).', m_rule_x: 'Dos ajustes: una subida del radar en una parcela que ya se veía edificada o desnuda en al menos un {a}% al principio cuenta como "probable estructura" (las imágenes ópticas no muestran altura sobre hormigón); las huellas solo cuentan si una está a menos de {n} m del punto.', h: 'Estimación de la fase de obra', intro: 'Reglas simples combinan el índice de cambio del satélite, el radar donde lo leemos, las huellas de edificios cartografiadas y las fechas del promotor en una estimación por mes. Se lee de píxeles de 10 m, no de una inspección de la obra.',
    latest: 'Estimación de {m}', conf: 'Confianza: {c}', c_high: 'alta', c_medium: 'media', c_low: 'baja', why: 'Por qué',
    st_none: 'Sin cambios', st_cleared: 'Terreno desbrozado', st_earthworks: 'Probable movimiento de tierras', st_structure: 'Probable estructura', st_roofed: 'Edificios con cubierta cartografiados', st_cant: 'No se puede saber', st_nodata: 'Sin lectura', st_base: 'Meses de referencia',
    o_up: 'Satélite: el círculo se ve {x} puntos más edificado o desnudo que su entorno, frente a {base}, durante {k} meses despejados seguidos.', o_same: 'Satélite: ningún cambio por encima de la variación normal (±{b} puntos) frente a {base}.',
    o_green: 'Satélite: el círculo se ve {x} puntos menos edificado o desnudo que su entorno, frente a {base}.', o_gap: 'Satélite: ninguna vista despejada este mes (la última: {m}).', o_never: 'Satélite: ninguna vista despejada este mes.', o_base: 'Satélite: {m} es uno de los 3 primeros meses despejados, la referencia del índice.',
    r_up: 'Radar: retrodispersión VV {x} dB frente a los primeros meses, por encima de la variación normal (±{b} dB). Muros, estructuras y cubiertas nuevas suelen producirlo.', r_flat: 'Radar: ningún cambio por encima de la variación normal (±{b} dB).', r_down: 'Radar: retrodispersión VV {x} dB, por debajo de la variación normal (±{b} dB).',
    r_vh: 'Radar: VH {x} dB, como cuando se desbroza la vegetación.', r_na: 'Radar: no lo leemos en este lugar (cielo despejado la mayoría de los meses).', r_gap: 'Radar: sin lectura este mes.',
    b_yes: 'Mapa: {n} huellas de edificios cubren el {p}% del círculo (Overture {rel}).', b_yesf: 'Mapa: {n} huellas de edificios cubren el {p}% del círculo (Overture {rel}), vistas por primera vez {d}.', b_low: 'Mapa: las huellas de edificios cubren el {p}% del círculo, menos del {t}% que cuentan estas reglas (Overture {rel}).', b_no: 'Mapa: ninguna huella de edificio en el círculo (Overture {rel}).', b_later: 'Mapa: huellas vistas por primera vez {d}, después de este mes.',
    d_ro: 'Las señales no coinciden: el radar muestra un cambio que las imágenes ópticas no muestran.', d_bo: 'Las señales no coinciden: hay edificios cartografiados, pero las imágenes no muestran cambios desde {base}. Pueden ser anteriores a la serie o de un vecino.',
    d_g: 'El lugar se ve más verde que al principio; estas reglas no lo leen como una fase.', d_rd: 'El radar bajó sin ninguna imagen despejada disponible; estas reglas no lo leen por sí solo.',
    p_hand: 'La entrega prometida por el promotor ({d}) ya ha pasado.', p_start: 'El inicio de obra prometido por el promotor ({d}) fue hace más de 6 meses.',
    thin: 'No hay datos suficientes para estimar la fase: {c} meses despejados y sin radar.', leg: 'Una celda por mes, el más antiguo a la izquierda. Pase el cursor o abra la tabla para cada mes.',
    tbl: 'Estimaciones mensuales', th: ['Mes', 'Estimación', 'Confianza', 'Señales'], s_o: 'satélite {x}', s_r: 'radar {x} dB', s_b: 'mapa: edificios', method: 'Cómo funciona la estimación', api: 'JSON de este proyecto',
    lim: 'Reglas, no un modelo entrenado. A 10 m una parcela desbrozada y una losa de hormigón se parecen, una torre que crece sobre una losa existente puede cambiar poco y las huellas pueden ir años por detrás del terreno. Pida al promotor fotos fechadas de la obra para confirmarlo.',
    m_title: 'Cómo estimamos la fase de obra desde el espacio', m_desc: 'Las reglas simples de la estimación mensual de la fase de obra en las páginas de proyectos de Kolaboro: datos, umbrales, confianza y cuándo decimos que no se puede saber.',
    m_lead: 'Cada mes recibe una de cinco fases, una confianza y los motivos, a partir de datos abiertos de satélite y de mapas. Cuando las señales no coinciden o hay pocos datos, la página dice "no se puede saber".', m_h_in: 'Datos', m_h_rules: 'Reglas, en orden', m_h_conf: 'Confianza', m_h_cant: 'Cuándo decimos "no se puede saber"', m_h_lim: 'Límites', m_h_data: 'Datos y licencias',
    m_in: ['Índice de cambio de Sentinel-2: proporción edificada o desnuda de un círculo de 150 m alrededor del punto menos la de un anillo a 300-600 m, frente a los 3 primeros meses despejados, en puntos. Usamos la mediana de los últimos {w} meses despejados, para que un mes raro no cambie la fase.', 'Radar Sentinel-1 (solo en parcelas que las nubes tapan al menos una cuarta parte de los meses): retrodispersión VV y VH del mismo círculo menos el anillo, frente a los 3 primeros meses, mediana de los últimos {w} meses, en dB.', 'Huellas de edificios de Overture Maps que tocan el círculo, la parte del círculo que cubren y la versión en la que se vio cada una por primera vez.', 'El inicio de obra y la entrega prometidos por el promotor, de nuestro historial fechado de promesas.'],
    m_rules: ['Meses de referencia: los 3 primeros meses despejados, frente a los que se mide todo.', 'Edificios con cubierta cartografiados: las huellas cubren al menos el {t}% del círculo en una versión hasta ese mes, y las imágenes o el radar cambiaron en algún momento anterior.', 'Probable estructura: el radar subió por encima de su variación normal de un mes a otro y las imágenes ópticas no lo contradicen.', 'Probable movimiento de tierras: el índice óptico se mantuvo al menos {b} puntos por encima del inicio durante {e} o más meses despejados seguidos.', 'Terreno desbrozado: el índice óptico subió al menos {b} puntos por encima del inicio, durante menos de {e} meses despejados por ahora.', 'Sin cambios: el índice óptico (y el radar, donde se lee) se mantuvo dentro de la variación normal.'],
    m_conf: 'Alta cuando dos señales independientes apoyan la fase (por ejemplo las imágenes y el radar), media cuando una señal la apoya durante al menos 3 meses, baja en los demás casos. Las fechas del promotor nunca suben la confianza; se muestran junto a la estimación como contexto.',
    m_cant: ['el radar muestra un cambio y una imagen despejada del mismo mes no muestra ninguno;', 'hay edificios cartografiados pero las imágenes nunca cambiaron desde el inicio de la serie;', 'el círculo se volvió más verde que al principio;', 'un proyecto tiene menos de {c} meses despejados y no tiene radar ("no hay datos suficientes").'],
    m_lim: 'A 10 m una parcela desbrozada y una losa se parecen, los edificios terminados no cambian y las huellas dibujadas a partir de imágenes pueden ir años por detrás. El punto tiene unos 100 m de precisión. Use la estimación como motivo para pedir fotos fechadas de la obra, no como prueba de avance o de parada.',
    m_data: 'Contiene datos modificados de Copernicus Sentinel (libres y abiertos); Sentinel-1 RTC de Microsoft Planetary Computer (CC BY 4.0); huellas de edificios de Overture Maps (ODbL 1.0, © colaboradores de OpenStreetMap, Overture Maps Foundation). Estimaciones: CC BY 4.0, cite a Kolaboro.' },
  de: { o_ever: 'Satellit: Der Kreis lag erstmals {m} mindestens {b} Punkte über dem Beginn.', d_pre: 'Hier sind Gebäude kartiert, und der Kreis wirkte schon {base} zu {p} % bebaut oder kahl: Sie standen wohl schon vor Beginn der Reihe oder gehören zu einem Nachbarn.', o_built: 'Satellit: Der Kreis wirkte schon zu Beginn zu {p} % bebaut oder kahl, daher zeigt sich ein darauf wachsender Rohbau in diesen Bildern womöglich nicht.', b_far: 'Karte: Der nächste Gebäudegrundriss liegt {d} m vom Punkt entfernt, mehr als die {t} m, die diese Regeln zählen (Overture {rel}).', m_rule_x: 'Zwei Verfeinerungen: Ein Radaranstieg auf einem Grundstück, das schon zu Beginn zu mindestens {a} % bebaut oder kahl wirkte, gilt als "Rohbau wahrscheinlich" (optische Bilder zeigen keine Höhe auf Beton); Grundrisse zählen nur, wenn einer höchstens {n} m vom Punkt entfernt liegt.', h: 'Geschätzter Baufortschritt', intro: 'Einfache Regeln verbinden den Satelliten-Änderungsindex, Radar (wo wir es lesen), kartierte Gebäudegrundrisse und die Termine des Bauträgers zu einer Schätzung pro Monat. Sie stammt aus 10-m-Pixeln, nicht aus einer Besichtigung.',
    latest: 'Schätzung für {m}', conf: 'Sicherheit: {c}', c_high: 'hoch', c_medium: 'mittel', c_low: 'niedrig', why: 'Warum',
    st_none: 'Keine Änderung', st_cleared: 'Fläche geräumt', st_earthworks: 'Erdarbeiten wahrscheinlich', st_structure: 'Rohbau wahrscheinlich', st_roofed: 'Überdachte Gebäude kartiert', st_cant: 'Nicht zu sagen', st_nodata: 'Kein Messwert', st_base: 'Bezugsmonate',
    o_up: 'Satellit: Der Kreis wirkt {x} Punkte stärker bebaut oder kahl als seine Umgebung, gegenüber {base}, seit {k} klaren Monaten in Folge.', o_same: 'Satellit: keine Änderung über die normale Schwankung (±{b} Punkte) gegenüber {base}.',
    o_green: 'Satellit: Der Kreis wirkt {x} Punkte weniger bebaut oder kahl als seine Umgebung, gegenüber {base}.', o_gap: 'Satellit: in diesem Monat keine klare Sicht (zuletzt: {m}).', o_never: 'Satellit: in diesem Monat keine klare Sicht.', o_base: 'Satellit: {m} ist einer der ersten 3 klaren Monate, an denen der Index gemessen wird.',
    r_up: 'Radar: VV-Rückstreuung {x} dB gegenüber den ersten Monaten, über der normalen Schwankung (±{b} dB). Neue Wände, Tragwerke und Dächer bewirken das meist.', r_flat: 'Radar: keine Änderung über die normale Schwankung (±{b} dB).', r_down: 'Radar: VV-Rückstreuung {x} dB, unter der normalen Schwankung (±{b} dB).',
    r_vh: 'Radar: VH {x} dB, wie wenn Vegetation geräumt wird.', r_na: 'Radar: für diesen Ort nicht gelesen (in den meisten Monaten klarer Himmel).', r_gap: 'Radar: kein Messwert in diesem Monat.',
    b_yes: 'Karte: {n} Gebäudegrundrisse bedecken {p} % des Kreises (Overture {rel}).', b_yesf: 'Karte: {n} Gebäudegrundrisse bedecken {p} % des Kreises (Overture {rel}), zuerst gesehen {d}.', b_low: 'Karte: Gebäudegrundrisse bedecken {p} % des Kreises, weniger als die {t} %, die diese Regeln zählen (Overture {rel}).', b_no: 'Karte: kein Gebäudegrundriss im Kreis (Overture {rel}).', b_later: 'Karte: Grundrisse zuerst gesehen {d}, nach diesem Monat.',
    d_ro: 'Die Signale widersprechen sich: Das Radar zeigt eine Änderung, die optischen Bilder nicht.', d_bo: 'Die Signale widersprechen sich: Gebäude sind kartiert, aber die Bilder zeigen seit {base} keine Änderung. Sie können älter als die Reihe sein oder zu einem Nachbarn gehören.',
    d_g: 'Der Ort wirkt grüner als zu Beginn; diese Regeln lesen das nicht als Bauphase.', d_rd: 'Das Radar sank, ohne dass ein klares Bild vorlag; diese Regeln lesen das allein nicht.',
    p_hand: 'Die vom Bauträger versprochene Übergabe ({d}) ist vorbei.', p_start: 'Der vom Bauträger versprochene Baubeginn ({d}) liegt mehr als 6 Monate zurück.',
    thin: 'Zu wenige Daten für eine Schätzung: {c} klare Monate und kein Radar.', leg: 'Eine Zelle pro Monat, der älteste links. Für jeden Monat mit der Maus zeigen oder die Tabelle öffnen.',
    tbl: 'Monatliche Schätzungen', th: ['Monat', 'Schätzung', 'Sicherheit', 'Signale'], s_o: 'Satellit {x}', s_r: 'Radar {x} dB', s_b: 'Karte: Gebäude', method: 'So funktioniert die Schätzung', api: 'JSON zu diesem Projekt',
    lim: 'Regeln, kein trainiertes Modell. Bei 10 m sehen eine geräumte Fläche und eine Betonplatte gleich aus, ein Turm auf einer bestehenden Platte ändert wenig, und Grundrisse können Jahre hinter dem Gelände zurückliegen. Bitten Sie den Bauträger um datierte Baustellenfotos.',
    m_title: 'So schätzen wir den Baufortschritt aus dem All', m_desc: 'Die einfachen Regeln hinter der monatlichen Schätzung des Baufortschritts auf Kolaboro-Projektseiten: Daten, Schwellen, Sicherheit und wann wir sagen, dass es nicht zu sagen ist.',
    m_lead: 'Jeder Monat erhält eine von fünf Phasen, eine Sicherheit und die Gründe, aus offenen Satelliten- und Kartendaten. Widersprechen sich die Signale oder fehlen Daten, steht dort "nicht zu sagen".', m_h_in: 'Daten', m_h_rules: 'Regeln, der Reihe nach', m_h_conf: 'Sicherheit', m_h_cant: 'Wann wir "nicht zu sagen" schreiben', m_h_lim: 'Grenzen', m_h_data: 'Daten und Lizenzen',
    m_in: ['Sentinel-2-Änderungsindex: bebauter oder kahler Anteil eines 150-m-Kreises um den Punkt minus der eines Rings in 300 bis 600 m, gegenüber den ersten 3 klaren Monaten, in Punkten. Wir nehmen den Median der letzten {w} klaren Monate, damit ein Ausreißer die Phase nicht verschiebt.', 'Sentinel-1-Radar (nur für Grundstücke, die in mindestens einem Viertel der Monate von Wolken verdeckt sind): VV- und VH-Rückstreuung desselben Kreises minus Ring, gegenüber den ersten 3 Monaten, Median der letzten {w} Monate, in dB.', 'Gebäudegrundrisse von Overture Maps, die den Kreis berühren, ihr Anteil am Kreis und die Version, in der jeder zuerst erschien.', 'Der vom Bauträger versprochene Baubeginn und die Übergabe aus unserer datierten Versprechens-Historie.'],
    m_rules: ['Bezugsmonate: die ersten 3 klaren Monate, an denen alles gemessen wird.', 'Überdachte Gebäude kartiert: Grundrisse bedecken mindestens {t} % des Kreises in einer Version bis zu diesem Monat, und Bilder oder Radar haben sich vorher geändert.', 'Rohbau wahrscheinlich: Das Radar stieg über seine normale Monatsschwankung, und die optischen Bilder widersprechen nicht.', 'Erdarbeiten wahrscheinlich: Der optische Index lag {e} oder mehr klare Monate in Folge mindestens {b} Punkte über dem Beginn.', 'Fläche geräumt: Der optische Index stieg mindestens {b} Punkte über den Beginn, bisher weniger als {e} klare Monate lang.', 'Keine Änderung: Der optische Index (und das Radar, wo gelesen) blieb innerhalb der normalen Schwankung.'],
    m_conf: 'Hoch, wenn zwei unabhängige Signale die Phase stützen (etwa Bilder und Radar), mittel, wenn ein Signal sie mindestens 3 Monate stützt, sonst niedrig. Die Termine des Bauträgers erhöhen die Sicherheit nie; sie stehen als Kontext neben der Schätzung.',
    m_cant: ['das Radar zeigt eine Änderung und ein klares Bild im selben Monat keine;', 'Gebäude sind kartiert, aber die Bilder haben sich seit Beginn der Reihe nie geändert;', 'der Kreis wurde grüner als zu Beginn;', 'ein Projekt hat weniger als {c} klare Monate und kein Radar ("zu wenige Daten").'],
    m_lim: 'Bei 10 m sehen eine geräumte Fläche und eine Platte gleich aus, fertige Gebäude wirken unverändert, und aus Bildern gezeichnete Grundrisse können Jahre zurückliegen. Der Punkt ist etwa 100 m genau. Nutzen Sie die Schätzung als Anlass, datierte Baustellenfotos zu verlangen, nicht als Beweis für Fortschritt oder Stillstand.',
    m_data: 'Enthält veränderte Copernicus-Sentinel-Daten (frei und offen); Sentinel-1 RTC von Microsoft Planetary Computer (CC BY 4.0); Gebäudegrundrisse von Overture Maps (ODbL 1.0, © OpenStreetMap-Mitwirkende, Overture Maps Foundation). Schätzungen: CC BY 4.0, Quelle Kolaboro.' },
  fr: { o_ever: 'Satellite : le cercle a dépassé pour la première fois le début d\'au moins {b} points en {m}.', d_pre: 'Des bâtiments sont cartographiés ici et le cercle paraissait déjà bâti ou nu à {p} % en {base} : ils existaient sans doute avant le début de la série ou appartiennent à un voisin.', o_built: 'Satellite : le cercle paraissait déjà bâti ou nu à {p} % au début, donc une structure qui y monte peut ne pas apparaître sur ces images.', b_far: 'Carte : l\'emprise de bâtiment la plus proche est à {d} m du point, au-delà des {t} m retenus par ces règles (Overture {rel}).', m_rule_x: 'Deux précisions : une hausse du radar sur une parcelle qui paraissait déjà bâtie ou nue à au moins {a} % au début compte comme "structure probable" (les images optiques ne montrent pas la hauteur sur du béton) ; les emprises ne comptent que si l\'une est à moins de {n} m du point.', h: 'Estimation de l\'étape du chantier', intro: 'Des règles simples combinent l\'indice de changement satellite, le radar quand nous le lisons, les emprises de bâtiments cartographiées et les dates du promoteur en une estimation par mois. Elle est lue sur des pixels de 10 m, pas lors d\'une visite.',
    latest: 'Estimation pour {m}', conf: 'Confiance : {c}', c_high: 'élevée', c_medium: 'moyenne', c_low: 'faible', why: 'Pourquoi',
    st_none: 'Aucun changement', st_cleared: 'Terrain dégagé', st_earthworks: 'Terrassement probable', st_structure: 'Structure probable', st_roofed: 'Bâtiments couverts cartographiés', st_cant: 'Impossible à dire', st_nodata: 'Pas de mesure', st_base: 'Mois de référence',
    o_up: 'Satellite : le cercle paraît {x} points plus bâti ou nu que ses abords, par rapport à {base}, depuis {k} mois clairs de suite.', o_same: 'Satellite : aucun changement au-delà de la variation normale (±{b} points) par rapport à {base}.',
    o_green: 'Satellite : le cercle paraît {x} points moins bâti ou nu que ses abords, par rapport à {base}.', o_gap: 'Satellite : aucune vue claire ce mois-ci (dernière : {m}).', o_never: 'Satellite : aucune vue claire ce mois-ci.', o_base: 'Satellite : {m} fait partie des 3 premiers mois clairs, la référence de l\'indice.',
    r_up: 'Radar : rétrodiffusion VV {x} dB par rapport aux premiers mois, au-delà de la variation normale (±{b} dB). De nouveaux murs, ossatures et toits font en général cela.', r_flat: 'Radar : aucun changement au-delà de la variation normale (±{b} dB).', r_down: 'Radar : rétrodiffusion VV {x} dB, sous la variation normale (±{b} dB).',
    r_vh: 'Radar : VH {x} dB, comme lorsque la végétation est défrichée.', r_na: 'Radar : non lu pour ce site (ciel dégagé la plupart des mois).', r_gap: 'Radar : pas de mesure ce mois-ci.',
    b_yes: 'Carte : {n} emprises de bâtiments couvrent {p} % du cercle (Overture {rel}).', b_yesf: 'Carte : {n} emprises de bâtiments couvrent {p} % du cercle (Overture {rel}), vues pour la première fois {d}.', b_low: 'Carte : les emprises de bâtiments couvrent {p} % du cercle, moins que les {t} % retenus par ces règles (Overture {rel}).', b_no: 'Carte : aucune emprise de bâtiment dans le cercle (Overture {rel}).', b_later: 'Carte : emprises vues pour la première fois {d}, après ce mois.',
    d_ro: 'Les signaux divergent : le radar montre un changement que les images optiques ne montrent pas.', d_bo: 'Les signaux divergent : des bâtiments sont cartographiés, mais les images ne montrent aucun changement depuis {base}. Ils peuvent être antérieurs à la série ou appartenir à un voisin.',
    d_g: 'Le site paraît plus vert qu\'au début ; ces règles ne le lisent pas comme une étape.', d_rd: 'Le radar a baissé sans image claire disponible ; ces règles ne le lisent pas seul.',
    p_hand: 'La livraison promise par le promoteur ({d}) est passée.', p_start: 'Le début des travaux promis par le promoteur ({d}) date de plus de 6 mois.',
    thin: 'Pas assez de données pour estimer l\'étape : {c} mois clairs et pas de radar.', leg: 'Une case par mois, la plus ancienne à gauche. Survolez ou ouvrez le tableau pour chaque mois.',
    tbl: 'Estimations mensuelles', th: ['Mois', 'Estimation', 'Confiance', 'Signaux'], s_o: 'satellite {x}', s_r: 'radar {x} dB', s_b: 'carte : bâtiments', method: 'Comment fonctionne l\'estimation', api: 'JSON de ce projet',
    lim: 'Des règles, pas un modèle entraîné. À 10 m, un terrain dégagé et une dalle de béton se ressemblent, une tour qui monte sur une dalle existante change peu, et les emprises peuvent avoir des années de retard. Demandez au promoteur des photos datées du chantier pour confirmer.',
    m_title: 'Comment nous estimons l\'étape du chantier depuis l\'espace', m_desc: 'Les règles simples de l\'estimation mensuelle de l\'étape du chantier sur les pages projet de Kolaboro : données, seuils, confiance et quand nous disons que c\'est impossible à dire.',
    m_lead: 'Chaque mois reçoit l\'une de cinq étapes, une confiance et les raisons, à partir de données satellite et cartographiques ouvertes. Quand les signaux divergent ou que les données manquent, la page indique "impossible à dire".', m_h_in: 'Données', m_h_rules: 'Règles, dans l\'ordre', m_h_conf: 'Confiance', m_h_cant: 'Quand nous disons "impossible à dire"', m_h_lim: 'Limites', m_h_data: 'Données et licences',
    m_in: ['Indice de changement Sentinel-2 : part bâtie ou nue d\'un cercle de 150 m autour du point moins celle d\'un anneau à 300-600 m, par rapport aux 3 premiers mois clairs, en points. Nous prenons la médiane des {w} derniers mois clairs, pour qu\'un mois atypique ne change pas l\'étape.', 'Radar Sentinel-1 (seulement pour les parcelles que les nuages cachent au moins un mois sur quatre) : rétrodiffusion VV et VH du même cercle moins l\'anneau, par rapport aux 3 premiers mois, médiane des {w} derniers mois, en dB.', 'Emprises de bâtiments Overture Maps qui touchent le cercle, la part du cercle qu\'elles couvrent et la version où chacune est apparue.', 'Le début des travaux et la livraison promis par le promoteur, d\'après notre historique daté des promesses.'],
    m_rules: ['Mois de référence : les 3 premiers mois clairs, base de toutes les mesures.', 'Bâtiments couverts cartographiés : les emprises couvrent au moins {t} % du cercle dans une version jusqu\'à ce mois, et les images ou le radar ont changé auparavant.', 'Structure probable : le radar a dépassé sa variation normale d\'un mois à l\'autre, et les images optiques ne le contredisent pas.', 'Terrassement probable : l\'indice optique est resté au moins {b} points au-dessus du début pendant {e} mois clairs de suite ou plus.', 'Terrain dégagé : l\'indice optique est monté d\'au moins {b} points au-dessus du début, pendant moins de {e} mois clairs jusqu\'ici.', 'Aucun changement : l\'indice optique (et le radar, s\'il est lu) est resté dans la variation normale.'],
    m_conf: 'Élevée quand deux signaux indépendants soutiennent l\'étape (par exemple les images et le radar), moyenne quand un signal la soutient pendant au moins 3 mois, faible sinon. Les dates du promoteur n\'augmentent jamais la confiance ; elles sont affichées à côté comme contexte.',
    m_cant: ['le radar montre un changement et une image claire du même mois n\'en montre aucun ;', 'des bâtiments sont cartographiés mais les images n\'ont jamais changé depuis le début de la série ;', 'le cercle est devenu plus vert qu\'au début ;', 'un projet a moins de {c} mois clairs et pas de radar ("pas assez de données").'],
    m_lim: 'À 10 m, un terrain dégagé et une dalle se ressemblent, un bâtiment fini paraît inchangé, et les emprises tracées sur images peuvent avoir des années de retard. Le point est précis à environ 100 m. Utilisez l\'estimation pour demander des photos datées du chantier, pas comme preuve d\'avancement ou d\'arrêt.',
    m_data: 'Contient des données Copernicus Sentinel modifiées (libres et ouvertes) ; Sentinel-1 RTC de Microsoft Planetary Computer (CC BY 4.0) ; emprises de bâtiments Overture Maps (ODbL 1.0, © contributeurs OpenStreetMap, Overture Maps Foundation). Estimations : CC BY 4.0, crédit Kolaboro.' },
  nl: { o_ever: 'Satelliet: de cirkel kwam in {m} voor het eerst {b} punten of meer boven het begin.', d_pre: 'Hier zijn gebouwen gekarteerd en de cirkel leek in {base} al voor {p}% bebouwd of kaal: ze stonden er waarschijnlijk al voor het begin van de reeks of horen bij een buur.', o_built: 'Satelliet: de cirkel leek aan het begin al voor {p}% bebouwd of kaal, dus ruwbouw die erop verrijst is in deze beelden misschien niet te zien.', b_far: 'Kaart: de dichtstbijzijnde gebouwcontour ligt {d} m van de pin, meer dan de {t} m die deze regels tellen (Overture {rel}).', m_rule_x: 'Twee verfijningen: een radarstijging op een perceel dat aan het begin al voor minstens {a}% bebouwd of kaal leek, telt als "ruwbouw waarschijnlijk" (optische beelden tonen geen hoogte op beton); contouren tellen alleen als er een binnen {n} m van de pin ligt.', h: 'Geschatte bouwfase', intro: 'Eenvoudige regels combineren de veranderingsindex van de satelliet, radar waar we die lezen, gekarteerde gebouwcontouren en de data van de ontwikkelaar tot één schatting per maand. Ze komt uit pixels van 10 m, niet uit een bezoek aan de bouwplaats.',
    latest: 'Schatting voor {m}', conf: 'Zekerheid: {c}', c_high: 'hoog', c_medium: 'gemiddeld', c_low: 'laag', why: 'Waarom',
    st_none: 'Geen verandering', st_cleared: 'Grond vrijgemaakt', st_earthworks: 'Grondwerk waarschijnlijk', st_structure: 'Ruwbouw waarschijnlijk', st_roofed: 'Overdekte gebouwen gekarteerd', st_cant: 'Niet te zeggen', st_nodata: 'Geen meting', st_base: 'Referentiemaanden',
    o_up: 'Satelliet: de cirkel lijkt {x} punten meer bebouwd of kaal dan de omgeving, tegenover {base}, al {k} heldere maanden op rij.', o_same: 'Satelliet: geen verandering boven de normale schommeling (±{b} punten) tegenover {base}.',
    o_green: 'Satelliet: de cirkel lijkt {x} punten minder bebouwd of kaal dan de omgeving, tegenover {base}.', o_gap: 'Satelliet: deze maand geen helder beeld (laatste: {m}).', o_never: 'Satelliet: deze maand geen helder beeld.', o_base: 'Satelliet: {m} is een van de eerste 3 heldere maanden, waartegen de index wordt gemeten.',
    r_up: 'Radar: VV-terugstrooiing {x} dB tegenover de eerste maanden, boven de normale schommeling (±{b} dB). Nieuwe muren, skeletten en daken doen dat meestal.', r_flat: 'Radar: geen verandering boven de normale schommeling (±{b} dB).', r_down: 'Radar: VV-terugstrooiing {x} dB, onder de normale schommeling (±{b} dB).',
    r_vh: 'Radar: VH {x} dB, zoals wanneer begroeiing wordt verwijderd.', r_na: 'Radar: niet gelezen voor deze plek (meestal heldere lucht).', r_gap: 'Radar: geen meting deze maand.',
    b_yes: 'Kaart: {n} gebouwcontouren bedekken {p}% van de cirkel (Overture {rel}).', b_yesf: 'Kaart: {n} gebouwcontouren bedekken {p}% van de cirkel (Overture {rel}), voor het eerst gezien {d}.', b_low: 'Kaart: gebouwcontouren bedekken {p}% van de cirkel, minder dan de {t}% die deze regels tellen (Overture {rel}).', b_no: 'Kaart: geen gebouwcontour in de cirkel (Overture {rel}).', b_later: 'Kaart: contouren voor het eerst gezien {d}, na deze maand.',
    d_ro: 'De signalen spreken elkaar tegen: de radar toont een verandering die de optische beelden niet tonen.', d_bo: 'De signalen spreken elkaar tegen: er zijn gebouwen gekarteerd, maar de beelden tonen geen verandering sinds {base}. Ze kunnen ouder zijn dan de reeks of bij een buur horen.',
    d_g: 'De plek lijkt groener dan aan het begin; deze regels lezen dat niet als een fase.', d_rd: 'De radar daalde terwijl er geen helder beeld was; deze regels lezen dat niet alleen.',
    p_hand: 'De door de ontwikkelaar beloofde oplevering ({d}) is voorbij.', p_start: 'De door de ontwikkelaar beloofde bouwstart ({d}) ligt meer dan 6 maanden terug.',
    thin: 'Te weinig gegevens voor een schatting: {c} heldere maanden en geen radar.', leg: 'Eén vakje per maand, de oudste links. Wijs aan of open de tabel voor elke maand.',
    tbl: 'Maandelijkse schattingen', th: ['Maand', 'Schatting', 'Zekerheid', 'Signalen'], s_o: 'satelliet {x}', s_r: 'radar {x} dB', s_b: 'kaart: gebouwen', method: 'Zo werkt de schatting', api: 'JSON voor dit project',
    lim: 'Regels, geen getraind model. Op 10 m lijken vrijgemaakte grond en een betonplaat op elkaar, een toren op een bestaande plaat verandert weinig, en contouren kunnen jaren achterlopen. Vraag de ontwikkelaar om gedateerde foto\'s van de bouwplaats.',
    m_title: 'Zo schatten we de bouwfase vanuit de ruimte', m_desc: 'De eenvoudige regels achter de maandelijkse schatting van de bouwfase op Kolaboro-projectpagina\'s: gegevens, drempels, zekerheid en wanneer we zeggen dat het niet te zeggen is.',
    m_lead: 'Elke maand krijgt een van vijf fasen, een zekerheid en de redenen, uit open satelliet- en kaartgegevens. Als de signalen elkaar tegenspreken of de gegevens dun zijn, staat er "niet te zeggen".', m_h_in: 'Gegevens', m_h_rules: 'Regels, op volgorde', m_h_conf: 'Zekerheid', m_h_cant: 'Wanneer we "niet te zeggen" schrijven', m_h_lim: 'Grenzen', m_h_data: 'Gegevens en licenties',
    m_in: ['Sentinel-2-veranderingsindex: bebouwd of kaal aandeel van een cirkel van 150 m rond de pin min dat van een ring op 300 tot 600 m, tegenover de eerste 3 heldere maanden, in punten. We nemen de mediaan van de laatste {w} heldere maanden, zodat één afwijkende maand de fase niet verschuift.', 'Sentinel-1-radar (alleen voor percelen die in minstens een kwart van de maanden achter wolken liggen): VV- en VH-terugstrooiing van dezelfde cirkel min de ring, tegenover de eerste 3 maanden, mediaan van de laatste {w} maanden, in dB.', 'Gebouwcontouren van Overture Maps die de cirkel raken, het deel van de cirkel dat ze bedekken en de versie waarin elk voor het eerst verscheen.', 'De door de ontwikkelaar beloofde bouwstart en oplevering uit onze gedateerde beloftegeschiedenis.'],
    m_rules: ['Referentiemaanden: de eerste 3 heldere maanden, waartegen alles wordt gemeten.', 'Overdekte gebouwen gekarteerd: contouren bedekken minstens {t}% van de cirkel in een versie tot die maand, en de beelden of de radar veranderden eerder.', 'Ruwbouw waarschijnlijk: de radar steeg boven zijn normale maandschommeling en de optische beelden spreken dat niet tegen.', 'Grondwerk waarschijnlijk: de optische index bleef {e} of meer heldere maanden op rij minstens {b} punten boven het begin.', 'Grond vrijgemaakt: de optische index steeg minstens {b} punten boven het begin, tot nu toe minder dan {e} heldere maanden.', 'Geen verandering: de optische index (en de radar, waar gelezen) bleef binnen de normale schommeling.'],
    m_conf: 'Hoog als twee onafhankelijke signalen de fase steunen (bijvoorbeeld beelden en radar), gemiddeld als één signaal haar minstens 3 maanden steunt, anders laag. De data van de ontwikkelaar verhogen de zekerheid nooit; ze staan als context naast de schatting.',
    m_cant: ['de radar toont een verandering en een helder beeld van dezelfde maand toont er geen;', 'er zijn gebouwen gekarteerd maar de beelden veranderden sinds het begin van de reeks nooit;', 'de cirkel werd groener dan aan het begin;', 'een project heeft minder dan {c} heldere maanden en geen radar ("te weinig gegevens").'],
    m_lim: 'Op 10 m lijken vrijgemaakte grond en een plaat op elkaar, afgewerkte gebouwen lijken onveranderd, en uit beelden getekende contouren kunnen jaren achterlopen. De pin is ongeveer 100 m nauwkeurig. Gebruik de schatting als reden om gedateerde bouwfoto\'s te vragen, niet als bewijs van voortgang of stilstand.',
    m_data: 'Bevat aangepaste Copernicus Sentinel-gegevens (vrij en open); Sentinel-1 RTC van Microsoft Planetary Computer (CC BY 4.0); gebouwcontouren van Overture Maps (ODbL 1.0, © OpenStreetMap-bijdragers, Overture Maps Foundation). Schattingen: CC BY 4.0, bron Kolaboro.' },
  ru: { o_ever: 'Спутник: круг впервые поднялся на {b} п. или больше выше начала в {m}.', d_pre: 'Здесь на карте есть здания, а круг уже в {base} выглядел застроенным или голым на {p}%: вероятно, они стояли до начала ряда или принадлежат соседу.', o_built: 'Спутник: в начале круг уже выглядел застроенным или голым на {p}%, поэтому растущий на нём каркас может быть не виден на этих снимках.', b_far: 'Карта: ближайший контур здания в {d} м от точки, дальше {t} м, которые учитывают эти правила (Overture {rel}).', m_rule_x: 'Два уточнения: рост радара на участке, который уже в начале выглядел застроенным или голым не менее чем на {a}%, считается «вероятно, каркас» (оптические снимки не показывают высоту на бетоне); контуры учитываются, только если один из них не дальше {n} м от точки.', h: 'Оценка стадии строительства', intro: 'Простые правила объединяют спутниковый индекс изменений, радар (там, где мы его читаем), нанесённые на карту контуры зданий и даты застройщика в одну оценку на каждый месяц. Она основана на пикселях 10 м, а не на осмотре площадки.',
    latest: 'Оценка за {m}', conf: 'Уверенность: {c}', c_high: 'высокая', c_medium: 'средняя', c_low: 'низкая', why: 'Почему',
    st_none: 'Изменений нет', st_cleared: 'Участок расчищен', st_earthworks: 'Вероятно, земляные работы', st_structure: 'Вероятно, каркас', st_roofed: 'На карте здания с крышей', st_cant: 'Нельзя сказать', st_nodata: 'Нет данных', st_base: 'Базовые месяцы',
    o_up: 'Спутник: круг выглядит на {x} п. более застроенным или голым, чем окрестности, по сравнению с {base}, {k} ясных месяцев подряд.', o_same: 'Спутник: изменений сверх обычных колебаний (±{b} п.) по сравнению с {base} нет.',
    o_green: 'Спутник: круг выглядит на {x} п. менее застроенным или голым, чем окрестности, по сравнению с {base}.', o_gap: 'Спутник: в этом месяце ясного снимка нет (последний: {m}).', o_never: 'Спутник: в этом месяце ясного снимка нет.', o_base: 'Спутник: {m} входит в первые 3 ясных месяца, от которых отсчитывается индекс.',
    r_up: 'Радар: обратное рассеяние VV {x} дБ к первым месяцам, сверх обычных колебаний (±{b} дБ). Так обычно дают новые стены, каркасы и крыши.', r_flat: 'Радар: изменений сверх обычных колебаний (±{b} дБ) нет.', r_down: 'Радар: обратное рассеяние VV {x} дБ, ниже обычных колебаний (±{b} дБ).',
    r_vh: 'Радар: VH {x} дБ, как при расчистке растительности.', r_na: 'Радар: для этого места не читаем (в большинстве месяцев ясно).', r_gap: 'Радар: в этом месяце данных нет.',
    b_yes: 'Карта: {n} контуров зданий покрывают {p}% круга (Overture {rel}).', b_yesf: 'Карта: {n} контуров зданий покрывают {p}% круга (Overture {rel}), впервые замечены {d}.', b_low: 'Карта: контуры зданий покрывают {p}% круга, меньше {t}%, которые учитывают эти правила (Overture {rel}).', b_no: 'Карта: в круге нет контуров зданий (Overture {rel}).', b_later: 'Карта: контуры впервые замечены {d}, после этого месяца.',
    d_ro: 'Сигналы расходятся: радар показывает изменение, которого нет на оптических снимках.', d_bo: 'Сигналы расходятся: здания на карте есть, но снимки не показывают изменений с {base}. Они могут быть старше ряда или принадлежать соседу.',
    d_g: 'Участок выглядит зеленее, чем в начале; эти правила не считают это стадией.', d_rd: 'Радар снизился, когда ясного снимка не было; одно это правила не учитывают.',
    p_hand: 'Обещанная застройщиком сдача ({d}) уже прошла.', p_start: 'Обещанное застройщиком начало строительства ({d}) было более 6 месяцев назад.',
    thin: 'Недостаточно данных для оценки (ясных месяцев: {c}, радара нет).', leg: 'Одна клетка на месяц, самый старый слева. Наведите курсор или откройте таблицу.',
    tbl: 'Оценки по месяцам', th: ['Месяц', 'Оценка', 'Уверенность', 'Сигналы'], s_o: 'спутник {x}', s_r: 'радар {x} дБ', s_b: 'карта: здания', method: 'Как устроена оценка', api: 'JSON по этому проекту',
    lim: 'Правила, а не обученная модель. При 10 м расчищенный участок и бетонная плита выглядят одинаково, башня на существующей плите почти ничего не меняет, а контуры могут отставать на годы. Попросите у застройщика датированные фото площадки.',
    m_title: 'Как мы оцениваем стадию строительства из космоса', m_desc: 'Простые правила ежемесячной оценки стадии строительства на страницах проектов Kolaboro: данные, пороги, уверенность и когда мы говорим, что сказать нельзя.',
    m_lead: 'Каждый месяц получает одну из пяти стадий, уверенность и причины на основе открытых спутниковых и картографических данных. Если сигналы расходятся или данных мало, на странице написано «нельзя сказать».', m_h_in: 'Данные', m_h_rules: 'Правила по порядку', m_h_conf: 'Уверенность', m_h_cant: 'Когда мы пишем «нельзя сказать»', m_h_lim: 'Ограничения', m_h_data: 'Данные и лицензии',
    m_in: ['Индекс изменений Sentinel-2: доля застроенной или голой поверхности в круге 150 м вокруг точки минус та же доля в кольце 300 до 600 м, относительно первых 3 ясных месяцев, в пунктах. Берём медиану последних {w} ясных месяцев, чтобы один странный месяц не менял стадию.', 'Радар Sentinel-1 (только для участков, которые облака закрывают хотя бы в четверти месяцев): обратное рассеяние VV и VH того же круга минус кольцо, относительно первых 3 месяцев, медиана последних {w} месяцев, в дБ.', 'Контуры зданий Overture Maps, касающиеся круга, доля круга, которую они покрывают, и версия, в которой каждый появился впервые.', 'Обещанные застройщиком начало строительства и сдача из нашей датированной истории обещаний.'],
    m_rules: ['Базовые месяцы: первые 3 ясных месяца, от которых всё отсчитывается.', 'На карте здания с крышей: контуры покрывают не менее {t}% круга в версии до этого месяца, и снимки или радар до этого менялись.', 'Вероятно, каркас: радар поднялся выше обычных месячных колебаний, и оптические снимки этому не противоречат.', 'Вероятно, земляные работы: оптический индекс держался не менее чем на {b} п. выше начала {e} или больше ясных месяцев подряд.', 'Участок расчищен: оптический индекс поднялся не менее чем на {b} п. выше начала, пока меньше {e} ясных месяцев.', 'Изменений нет: оптический индекс (и радар, где он есть) остался в пределах обычных колебаний.'],
    m_conf: 'Высокая, когда стадию подтверждают два независимых сигнала (например, снимки и радар), средняя, когда один сигнал подтверждает её не менее 3 месяцев, иначе низкая. Даты застройщика никогда не повышают уверенность; они показаны рядом как контекст.',
    m_cant: ['радар показывает изменение, а ясный снимок того же месяца нет;', 'здания на карте есть, но снимки с начала ряда не менялись;', 'круг стал зеленее, чем в начале;', 'у проекта меньше {c} ясных месяцев и нет радара («недостаточно данных»).'],
    m_lim: 'При 10 м расчищенный участок и плита выглядят одинаково, готовые здания кажутся неизменными, а контуры, нарисованные по снимкам, могут отставать на годы. Точность точки около 100 м. Используйте оценку как повод запросить датированные фото площадки, а не как доказательство хода работ или остановки.',
    m_data: 'Содержит изменённые данные Copernicus Sentinel (свободные и открытые); Sentinel-1 RTC из Microsoft Planetary Computer (CC BY 4.0); контуры зданий Overture Maps (ODbL 1.0, © участники OpenStreetMap, Overture Maps Foundation). Оценки: CC BY 4.0, ссылка на Kolaboro.' },
  zh: { o_ever: '卫星：圆内首次比开始时高出 {b} 个点或更多是在 {m}。', d_pre: '此处地图上有建筑，而圆内在 {base} 已有 {p}% 看起来是建成或裸露地面：它们很可能在序列开始前就已存在，或属于邻近地块。', o_built: '卫星：圆内在开始时已有 {p}% 看起来是建成或裸露地面，因此在其上升起的结构可能不会在这些影像中显示。', b_far: '地图：最近的建筑轮廓距图钉 {d} 米，超过这些规则计入的 {t} 米（Overture {rel}）。', m_rule_x: '两项细化：如果地块在开始时已有至少 {a}% 看起来是建成或裸露地面，雷达升高即计为"可能已有结构"（光学影像无法显示混凝土上的高度）；只有当某个轮廓距图钉不超过 {n} 米时才计入轮廓。', h: '施工阶段估计', intro: '用简单规则把卫星变化指数、雷达（仅在我们读取的地方）、已测绘的建筑轮廓和开发商承诺的日期合并为每月一个估计。它来自 10 米像素，而不是现场检查。',
    latest: '{m} 的估计', conf: '可信度：{c}', c_high: '高', c_medium: '中', c_low: '低', why: '原因',
    st_none: '未见变化', st_cleared: '土地已清理', st_earthworks: '可能在土方施工', st_structure: '可能已有结构', st_roofed: '已测绘有顶建筑', st_cant: '无法判断', st_nodata: '无读数', st_base: '基准月份',
    o_up: '卫星：与 {base} 相比，圆内比周边看起来多 {x} 个点的建成或裸露地面，已连续 {k} 个晴朗月份。', o_same: '卫星：与 {base} 相比，没有超出正常波动（±{b} 个点）的变化。',
    o_green: '卫星：与 {base} 相比，圆内比周边看起来少 {x} 个点的建成或裸露地面。', o_gap: '卫星：本月没有晴朗影像（最近一次：{m}）。', o_never: '卫星：本月没有晴朗影像。', o_base: '卫星：{m} 是最早的 3 个晴朗月份之一，指数以此为基准。',
    r_up: '雷达：VV 后向散射相对最初几个月 {x} dB，超出正常波动（±{b} dB）。新墙体、框架和屋顶通常会这样。', r_flat: '雷达：没有超出正常波动（±{b} dB）的变化。', r_down: '雷达：VV 后向散射 {x} dB，低于正常波动（±{b} dB）。',
    r_vh: '雷达：VH {x} dB，与清除植被时相似。', r_na: '雷达：此地未读取（大多数月份天空晴朗）。', r_gap: '雷达：本月无读数。',
    b_yes: '地图：{n} 个建筑轮廓覆盖圆的 {p}%（Overture {rel}）。', b_yesf: '地图：{n} 个建筑轮廓覆盖圆的 {p}%（Overture {rel}），首次出现于 {d}。', b_low: '地图：建筑轮廓覆盖圆的 {p}%，低于这些规则计入的 {t}%（Overture {rel}）。', b_no: '地图：圆内没有建筑轮廓（Overture {rel}）。', b_later: '地图：轮廓首次出现于 {d}，晚于本月。',
    d_ro: '信号不一致：雷达显示变化，而光学影像没有。', d_bo: '信号不一致：地图上有建筑，但自 {base} 以来影像没有变化。它们可能早于本序列，或属于邻近地块。',
    d_g: '此地比开始时更绿；这些规则不把这视为一个阶段。', d_rd: '雷达下降时没有晴朗影像；这些规则不单凭这一点判断。',
    p_hand: '开发商承诺的交付日期（{d}）已过。', p_start: '开发商承诺的开工日期（{d}）已过去 6 个月以上。',
    thin: '数据不足，无法估计阶段：{c} 个晴朗月份，且没有雷达。', leg: '每格一个月，最早的在左边。悬停或打开表格查看每个月。',
    tbl: '每月估计', th: ['月份', '估计', '可信度', '信号'], s_o: '卫星 {x}', s_r: '雷达 {x} dB', s_b: '地图：建筑', method: '估计方法', api: '本项目的 JSON',
    lim: '这是规则，不是训练出来的模型。在 10 米分辨率下，清理过的地块和混凝土底板看起来相似，在已有底板上升高的塔楼变化可能很小，建筑轮廓也可能落后实地数年。请向开发商索取带日期的现场照片加以确认。',
    m_title: '我们如何从太空估计施工阶段', m_desc: 'Kolaboro 项目页面上每月施工阶段估计背后的简单规则：数据、阈值、可信度，以及何时我们说无法判断。',
    m_lead: '每个月根据开放的卫星和地图数据得到五个阶段之一、一个可信度和原因。当信号不一致或数据太少时，页面显示"无法判断"。', m_h_in: '数据', m_h_rules: '规则（按顺序）', m_h_conf: '可信度', m_h_cant: '何时显示"无法判断"', m_h_lim: '局限', m_h_data: '数据与许可',
    m_in: ['Sentinel-2 变化指数：图钉周围 150 米圆内的建成或裸露比例，减去 300 至 600 米环带的同一比例，相对最早 3 个晴朗月份，单位为点。我们取最近 {w} 个晴朗月份的中位数，避免某个异常月份改变阶段。', 'Sentinel-1 雷达（仅用于至少四分之一月份被云遮挡的地块）：同一圆内减去环带的 VV 和 VH 后向散射，相对最初 3 个月，取最近 {w} 个月的中位数，单位 dB。', '与圆相交的 Overture Maps 建筑轮廓、它们覆盖圆的比例，以及每个轮廓首次出现的版本。', '来自我们带日期的承诺记录的开发商承诺开工和交付日期。'],
    m_rules: ['基准月份：最早的 3 个晴朗月份，一切以此衡量。', '已测绘有顶建筑：在截至该月的某个版本中轮廓覆盖圆的至少 {t}%，且此前影像或雷达发生过变化。', '可能已有结构：雷达升高超出正常的月度波动，且光学影像不与之矛盾。', '可能在土方施工：光学指数连续 {e} 个或更多晴朗月份比开始时高至少 {b} 个点。', '土地已清理：光学指数比开始时高至少 {b} 个点，但至今少于 {e} 个晴朗月份。', '未见变化：光学指数（以及读取了的雷达）保持在正常波动之内。'],
    m_conf: '当两个独立信号支持该阶段时（例如影像和雷达）为高；当一个信号支持至少 3 个月时为中；否则为低。开发商的日期从不提高可信度，只作为背景显示在估计旁边。',
    m_cant: ['雷达显示变化，而同月的晴朗影像没有；', '地图上有建筑，但自序列开始影像从未变化；', '圆内比开始时更绿；', '项目的晴朗月份少于 {c} 个且没有雷达（"数据不足"）。'],
    m_lim: '在 10 米分辨率下，清理过的地块和底板看起来相似，完工的建筑看起来没有变化，根据影像绘制的轮廓可能落后数年。图钉精度约 100 米。请把估计当作索取带日期现场照片的理由，而不是进展或停工的证据。',
    m_data: '包含经修改的 Copernicus Sentinel 数据（免费开放）；Sentinel-1 RTC 来自 Microsoft Planetary Computer（CC BY 4.0）；建筑轮廓来自 Overture Maps（ODbL 1.0，© OpenStreetMap 贡献者，Overture Maps Foundation）。估计：CC BY 4.0，注明 Kolaboro。' },
  ar: { o_ever: 'القمر الصناعي: ارتفعت الدائرة أول مرة {b} نقطة أو أكثر فوق البداية في {m}.', d_pre: 'هناك مبانٍ على الخريطة هنا، وكانت الدائرة تبدو مبنية أو جرداء بنسبة {p}% في {base}: الأرجح أنها كانت قائمة قبل بداية السلسلة أو تخص جارًا.', o_built: 'القمر الصناعي: كانت الدائرة تبدو مبنية أو جرداء بنسبة {p}% منذ البداية، لذا قد لا يظهر هيكل يرتفع فوقها في هذه الصور.', b_far: 'الخريطة: أقرب مخطط مبنى على بعد {d} م من الدبوس، أكثر من {t} م التي تحتسبها هذه القواعد (Overture {rel}).', m_rule_x: 'تدقيقان: ارتفاع الرادار في قطعة كانت تبدو مبنية أو جرداء بنسبة {a}% على الأقل منذ البداية يُحتسب "هيكل مرجّح" (لا تُظهر الصور البصرية الارتفاع فوق الخرسانة)؛ ولا تُحتسب المخططات إلا إذا كان أحدها على بعد {n} م أو أقل من الدبوس.', h: 'تقدير مرحلة البناء', intro: 'تجمع قواعد بسيطة مؤشر التغيّر من القمر الصناعي والرادار حيث نقرؤه ومخططات المباني المرسومة على الخريطة ومواعيد المطوّر في تقدير واحد لكل شهر. وهو مأخوذ من بكسلات بدقة 10 م، لا من معاينة الموقع.',
    latest: 'التقدير لشهر {m}', conf: 'درجة الثقة: {c}', c_high: 'عالية', c_medium: 'متوسطة', c_low: 'منخفضة', why: 'السبب',
    st_none: 'لا تغيّر ظاهر', st_cleared: 'أرض مُمهّدة', st_earthworks: 'أعمال ترابية مرجّحة', st_structure: 'هيكل مرجّح', st_roofed: 'مبانٍ مسقوفة على الخريطة', st_cant: 'لا يمكن الجزم', st_nodata: 'لا قراءة', st_base: 'أشهر الأساس',
    o_up: 'القمر الصناعي: تبدو الدائرة مبنية أو جرداء أكثر من محيطها بـ {x} نقطة مقارنة بـ {base}، منذ {k} أشهر صافية متتالية.', o_same: 'القمر الصناعي: لا تغيّر يتجاوز التذبذب المعتاد (±{b} نقطة) مقارنة بـ {base}.',
    o_green: 'القمر الصناعي: تبدو الدائرة مبنية أو جرداء أقل من محيطها بـ {x} نقطة مقارنة بـ {base}.', o_gap: 'القمر الصناعي: لا صورة صافية هذا الشهر (آخر صورة: {m}).', o_never: 'القمر الصناعي: لا صورة صافية هذا الشهر.', o_base: 'القمر الصناعي: {m} من أول 3 أشهر صافية يُقاس المؤشر بالنسبة إليها.',
    r_up: 'الرادار: الارتداد VV بلغ {x} ديسيبل مقارنة بالأشهر الأولى، فوق التذبذب المعتاد (±{b} ديسيبل). الجدران والهياكل والأسقف الجديدة تفعل ذلك عادة.', r_flat: 'الرادار: لا تغيّر يتجاوز التذبذب المعتاد (±{b} ديسيبل).', r_down: 'الرادار: الارتداد VV بلغ {x} ديسيبل، دون التذبذب المعتاد (±{b} ديسيبل).',
    r_vh: 'الرادار: VH بلغ {x} ديسيبل، كما يحدث عند إزالة الغطاء النباتي.', r_na: 'الرادار: لا نقرؤه لهذا الموقع (السماء صافية في معظم الأشهر).', r_gap: 'الرادار: لا قراءة هذا الشهر.',
    b_yes: 'الخريطة: {n} مخططات مبانٍ تغطي {p}% من الدائرة (Overture {rel}).', b_yesf: 'الخريطة: {n} مخططات مبانٍ تغطي {p}% من الدائرة (Overture {rel})، ظهرت أول مرة في {d}.', b_low: 'الخريطة: مخططات المباني تغطي {p}% من الدائرة، أقل من {t}% التي تحتسبها هذه القواعد (Overture {rel}).', b_no: 'الخريطة: لا مخطط مبنى في الدائرة (Overture {rel}).', b_later: 'الخريطة: ظهرت المخططات أول مرة في {d}، بعد هذا الشهر.',
    d_ro: 'الإشارات متعارضة: يُظهر الرادار تغيّرًا لا تُظهره الصور البصرية.', d_bo: 'الإشارات متعارضة: هناك مبانٍ على الخريطة، لكن الصور لا تُظهر أي تغيّر منذ {base}. قد تكون أقدم من السلسلة أو تخص جارًا.',
    d_g: 'يبدو الموقع أكثر خضرة مما كان في البداية؛ ولا تقرأ هذه القواعد ذلك كمرحلة.', d_rd: 'انخفض الرادار دون توفر صورة صافية؛ ولا تقرأ هذه القواعد ذلك وحده.',
    p_hand: 'مضى موعد التسليم الذي وعد به المطوّر ({d}).', p_start: 'مضى أكثر من 6 أشهر على موعد بدء البناء الذي وعد به المطوّر ({d}).',
    thin: 'لا تكفي البيانات لتقدير المرحلة: {c} أشهر صافية ولا رادار.', leg: 'خانة لكل شهر، والأقدم على اليسار. مرّر المؤشر أو افتح الجدول لكل شهر.',
    tbl: 'التقديرات الشهرية', th: ['الشهر', 'التقدير', 'درجة الثقة', 'الإشارات'], s_o: 'القمر الصناعي {x}', s_r: 'الرادار {x} ديسيبل', s_b: 'الخريطة: مبانٍ', method: 'كيف يعمل التقدير', api: 'ملف JSON لهذا المشروع',
    lim: 'قواعد لا نموذج مدرَّب. بدقة 10 م تتشابه الأرض الممهدة والبلاطة الخرسانية، وقد لا يغيّر برج يرتفع فوق بلاطة قائمة إلا القليل، وقد تتأخر المخططات عن الواقع سنوات. اطلب من المطوّر صورًا مؤرخة للموقع للتأكد.',
    m_title: 'كيف نقدّر مرحلة البناء من الفضاء', m_desc: 'القواعد البسيطة وراء التقدير الشهري لمرحلة البناء في صفحات المشاريع على Kolaboro: البيانات والعتبات ودرجة الثقة ومتى نقول لا يمكن الجزم.',
    m_lead: 'يحصل كل شهر على واحدة من خمس مراحل ودرجة ثقة وأسباب، من بيانات أقمار صناعية وخرائط مفتوحة. وحين تتعارض الإشارات أو تقل البيانات تقول الصفحة "لا يمكن الجزم".', m_h_in: 'البيانات', m_h_rules: 'القواعد بالترتيب', m_h_conf: 'درجة الثقة', m_h_cant: 'متى نقول "لا يمكن الجزم"', m_h_lim: 'الحدود', m_h_data: 'البيانات والتراخيص',
    m_in: ['مؤشر التغيّر من Sentinel-2: حصة المبني أو الأجرد في دائرة نصف قطرها 150 م حول الدبوس ناقص حصتها في حلقة على بعد 300 إلى 600 م، مقارنة بأول 3 أشهر صافية، بالنقاط. نأخذ وسيط آخر {w} أشهر صافية حتى لا يغيّر شهر شاذ المرحلة.', 'رادار Sentinel-1 (فقط للقطع التي تحجبها الغيوم في ربع الأشهر على الأقل): الارتداد VV وVH للدائرة نفسها ناقص الحلقة، مقارنة بأول 3 أشهر، وسيط آخر {w} أشهر، بالديسيبل.', 'مخططات مباني Overture Maps التي تلامس الدائرة، والحصة التي تغطيها، والإصدار الذي ظهر فيه كل منها أول مرة.', 'موعدا بدء البناء والتسليم اللذان وعد بهما المطوّر من سجل الوعود المؤرخ لدينا.'],
    m_rules: ['أشهر الأساس: أول 3 أشهر صافية، ويُقاس كل شيء بالنسبة إليها.', 'مبانٍ مسقوفة على الخريطة: المخططات تغطي {t}% على الأقل من الدائرة في إصدار حتى ذلك الشهر، وتغيّرت الصور أو الرادار في وقت سابق.', 'هيكل مرجّح: ارتفع الرادار فوق تذبذبه الشهري المعتاد، ولا تناقضه الصور البصرية.', 'أعمال ترابية مرجّحة: بقي المؤشر البصري أعلى من البداية بـ {b} نقطة على الأقل لمدة {e} أشهر صافية متتالية أو أكثر.', 'أرض مُمهّدة: ارتفع المؤشر البصري {b} نقطة على الأقل فوق البداية، لأقل من {e} أشهر صافية حتى الآن.', 'لا تغيّر ظاهر: بقي المؤشر البصري (والرادار حيث يُقرأ) ضمن التذبذب المعتاد.'],
    m_conf: 'عالية حين تدعم إشارتان مستقلتان المرحلة (مثل الصور والرادار)، ومتوسطة حين تدعمها إشارة واحدة لمدة 3 أشهر على الأقل، ومنخفضة في غير ذلك. لا ترفع مواعيد المطوّر درجة الثقة أبدًا؛ تُعرض بجانب التقدير للسياق.',
    m_cant: ['يُظهر الرادار تغيّرًا ولا تُظهر صورة صافية من الشهر نفسه أي تغيّر؛', 'هناك مبانٍ على الخريطة لكن الصور لم تتغيّر منذ بداية السلسلة؛', 'أصبحت الدائرة أكثر خضرة مما كانت في البداية؛', 'للمشروع أقل من {c} أشهر صافية ولا رادار ("لا تكفي البيانات").'],
    m_lim: 'بدقة 10 م تتشابه الأرض الممهدة والبلاطة، وتبدو المباني المكتملة بلا تغيّر، وقد تتأخر المخططات المرسومة من الصور سنوات. دقة الدبوس نحو 100 م. استخدم التقدير سببًا لطلب صور مؤرخة للموقع، لا دليلًا على تقدّم أو توقف.',
    m_data: 'يتضمن بيانات Copernicus Sentinel معدّلة (مجانية ومفتوحة)؛ Sentinel-1 RTC من Microsoft Planetary Computer (CC BY 4.0)؛ مخططات المباني من Overture Maps (ODbL 1.0، © مساهمو OpenStreetMap، Overture Maps Foundation). التقديرات: CC BY 4.0، مع ذكر Kolaboro.' }
};
const t = (lang, k, v) => { const s = (S[lang] && S[lang][k]) || S.en[k]; return v && typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
export const stageWord = (lang, s) => t(lang, 'st_' + s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mi = s => { const m = String(s || '').match(/^(\d{4})-(\d{2})/); return m ? +m[1] * 12 + (+m[2] - 1) : null; };
const ym = i => Math.floor(i / 12) + '-' + String(i % 12 + 1).padStart(2, '0');
const med = a => { const v = a.slice().sort((x, y) => x - y), h = v.length >> 1; return v.length ? (v.length % 2 ? v[h] : (v[h - 1] + v[h]) / 2) : null; };
const r1 = v => Math.round(v * 10) / 10;
const sg = v => (v > 0 ? '+' : '') + v;
const relDate = r => String(r || '').replace(/\.\d+$/, '');
const pre = l => l === 'en' ? '' : '/' + l;

// ------------------------------------------------------------------------------------------------ the rules
// rec: one project of construction-progress.json; ix: kbx_named_sat.js index(rec) (null when fewer than 6 clear months);
// rd: satellite-radar.json; bd: buildings.json; ms: milestones() of the project (promised dates, old ones flagged).
// Returns { enough, months: [{ m, s, c, r: [[code, params], ...] }], latest } where s is a stage key, c 'high'|'medium'|'low'|null.
export function stages(rec, ix, rd, bd, ms, id) {
  const R = RULES, B = R.optical_band_pts;
  if (!rec || !rec.n || !rec.m0) return null;
  const m0 = mi(rec.m0), n = rec.n;
  const rr = rd && rd.projects && rd.projects[id] && rd.projects[id].status === 'ok' && rd.projects[id].y ? rd.projects[id] : null;
  const band = rd && rd.band_db != null ? rd.band_db : null;
  const bl = bd && bd.projects && bd.projects[id] || null;
  const clearN = rec.c.filter(v => v != null).length;
  if (!ix && !rr) return { enough: false, clear: clearN, months: [], latest: null };
  // buildings: from the month of first sighting (or the release, when the registry has no date) onwards
  const rel = bd ? relDate(bd.release) : '';
  const bCover = bl && bl.n ? bl.cover_pct || 0 : 0;
  const bFrom = bl && bl.n ? mi(bl.first_seen_min ? relDate(bl.first_seen_min) : rel) : null;
  const bNear = bl && bl.b && bl.b.length ? Math.min(...bl.b.map(b => b.d == null ? 1e9 : b.d)) : null;
  const bOk = bCover >= R.footprint_cover_pct && bFrom != null && bNear != null && bNear <= R.footprint_near_m;
  const baseIdx = ix ? new Set([ix.first[0], ...ix.y.map((v, i) => v == null ? -1 : i).filter(i => i >= 0).slice(0, 3)]) : new Set();
  const baseLabel = ix ? ym(m0 + ix.first[0]) : (rr ? rr.m0 : rec.m0);
  const baseBuilt = ix ? med([...baseIdx].map(i => rec.b[i]).filter(v => v != null)) : null;   // built-up or bare share of the circle at the start
  const built0 = baseBuilt != null && baseBuilt >= R.already_built_pct;
  const hand = ms.filter(o => o.k === 'handover' && !o.old).sort((a, b) => a.b - b.b).pop(), start = ms.filter(o => o.k === 'construction_start' && !o.old).sort((a, b) => a.b - b.b).pop();
  const out = []; let run = 0, ever = false, rEver = false, lastClear = null, firstUp = null;
  const optHist = [];
  for (let i = 0; i < n; i++) {
    const M = m0 + i, reasons = [], sup = [];
    // optical: median of the last 3 clear months up to this one, read only when this month itself is clear
    let o = null, ox = null;
    if (ix && ix.y[i] != null) {
      optHist.push(ix.y[i]); lastClear = M;
      ox = med(optHist.slice(-R.optical_window));
      if (baseIdx.has(i)) o = 'base';
      else if (ox >= B) { run++; o = run >= R.earthworks_after_clear_months ? 'earthworks' : 'cleared'; ever = true; if (firstUp == null) firstUp = M; }
      else if (ox <= -B) { run = 0; o = 'green'; }
      else { run = 0; o = 'same'; }
    }
    // radar: median of the last 3 months with data up to this one
    let r = null, rx = null, rh = null;
    if (rr && band != null) {
      const j = M - mi(rr.m0);
      if (j >= 0 && j < rr.n && rr.y[j] != null) {
        const ys = [], hs = []; for (let q = j; q >= 0 && ys.length < R.radar_window; q--) if (rr.y[q] != null) { ys.push(rr.y[q]); if (rr.yh && rr.yh[q] != null) hs.push(rr.yh[q]); }
        rx = r1(med(ys)); rh = hs.length ? r1(med(hs)) : null;
        r = rx > band ? 'up' : rx < -band ? 'down' : 'flat';
        if (r === 'up') rEver = true;
      }
    }
    const bm = bOk && M >= bFrom;
    // reasons, one per signal
    if (o === 'base') reasons.push(['o_base', { m: ym(M) }]);
    else if (o === 'cleared' || o === 'earthworks') reasons.push(['o_up', { x: sg(Math.round(ox)), base: baseLabel, k: run }]);
    else if (o === 'green') reasons.push(['o_green', { x: Math.abs(Math.round(ox)), base: baseLabel }]);
    else if (o === 'same') reasons.push(['o_same', { b: B, base: baseLabel }]);
    else reasons.push(lastClear != null ? ['o_gap', { m: ym(lastClear) }] : ['o_never', {}]);
    if (!rr) reasons.push(['r_na', {}]);
    else if (r == null) reasons.push(['r_gap', {}]);
    else { reasons.push([r === 'up' ? 'r_up' : r === 'down' ? 'r_down' : 'r_flat', { x: sg(rx), b: band }]); if (rh != null && rh < -band) reasons.push(['r_vh', { x: sg(rh) }]); }
    if (bl) {
      if (!bl.n) reasons.push(['b_no', { rel }]);
      else if (bCover < R.footprint_cover_pct) reasons.push(['b_low', { p: bCover, t: R.footprint_cover_pct, rel }]);
      else if (!bOk) reasons.push(['b_far', { d: bNear, t: R.footprint_near_m, rel }]);
      else if (bm) reasons.push(bl.first_seen_min ? ['b_yesf', { n: bl.n, p: bCover, rel, d: relDate(bl.first_seen_min) }] : ['b_yes', { n: bl.n, p: bCover, rel }]);
      else reasons.push(['b_later', { d: ym(bFrom) }]);
    }
    // stage
    let s, c = null;
    if (o == null && r == null && !bm) s = 'nodata';
    else if (o === 'base' && r !== 'up' && !bm) { s = 'base'; }
    else if (bm && (ever || rEver)) { s = 'roofed'; sup.push('b'); if (ever) { sup.push('o'); if (o !== 'cleared' && o !== 'earthworks') reasons.push(['o_ever', { b: B, m: ym(firstUp) }]); } if (rEver) sup.push('r'); }
    else if (bm && (o === 'same' || o === 'base' || o == null) && r !== 'up' && built0) { s = 'none'; c = 'low'; reasons.push(['d_pre', { p: Math.round(baseBuilt), base: baseLabel }]); }
    else if (bm && (o === 'same' || o === 'base' || o == null) && r !== 'up') { s = 'cant'; reasons.push(['d_bo', { base: baseLabel }]); }
    else if (r === 'up' && o === 'same' && built0) { s = 'structure'; sup.push('r'); reasons.push(['o_built', { p: Math.round(baseBuilt) }]); }
    else if (r === 'up' && (o === 'same' || o === 'base')) { s = 'cant'; reasons.push(['d_ro', {}]); }
    else if (r === 'up') { s = 'structure'; sup.push('r'); if (o === 'cleared' || o === 'earthworks') sup.push('o'); }
    else if (o === 'cleared' || o === 'earthworks') { s = o; sup.push('o'); if (o === 'cleared' && rh != null && rh < -band) sup.push('r'); }
    else if (o === 'green' || (bm && o === 'green')) { s = 'cant'; reasons.push(['d_g', {}]); }
    else if (o === 'same') { s = 'none'; sup.push('o'); if (r === 'flat') sup.push('r'); }
    else if (r === 'flat') { s = 'none'; sup.push('r'); }
    else if (r === 'down') { s = 'cant'; reasons.push(['d_rd', {}]); }
    else s = 'nodata';
    if (ORDER.includes(s) && !c) {
      const sustained = (sup.includes('o') && (s === 'none' ? optHist.length >= 3 : run >= 3)) || (sup.includes('r') && !sup.includes('o')) || s === 'roofed';
      c = sup.length >= 2 ? 'high' : sustained ? 'medium' : 'low';
    }
    // the developer's dates, as context (never raise confidence)
    if (hand && M > hand.b && s !== 'roofed') reasons.push(['p_hand', { d: hand.d }]);
    if (start && M > start.b + R.start_grace_months && (s === 'none' || s === 'base')) reasons.push(['p_start', { d: start.d }]);
    out.push({ m: ym(M), s, c, r: reasons });
  }
  const enough = clearN >= R.min_clear_months || !!rr;
  const latest = [...out].reverse().find(x => x.s !== 'nodata') || null;
  return { enough, clear: clearN, months: out, latest };
}

// ------------------------------------------------------------------------------------------------ HTML (inside the "from space" section)
const CSS = '<style id="kstage-css">.kstage{margin-top:28px;padding-top:4px;border-top:1px solid var(--k-line,var(--line))}.kstage h3{margin:18px 0 6px;font-size:var(--k-fs-lg,1.2rem)}' +
  '.kstage-now{margin:12px 0 0;padding:14px 16px;border:1px solid var(--k-line,var(--line));border-radius:var(--k-r-lg,14px);background:var(--k-surface,#fff)}.kstage-now .kstage-st{font-size:var(--k-fs-xl,1.4rem);font-weight:700;margin:2px 0 4px}.kstage-now ul{margin:8px 0 0;padding-inline-start:18px;line-height:1.5;font-size:var(--k-fs-sm,.94rem);color:var(--k-ink-2,var(--ink))}' +
  '.kstage-rib{display:flex;gap:1px;margin:16px 0 4px;height:26px;border-radius:var(--k-r-xs,4px);overflow:hidden}.kstage-rib i{flex:1 1 0;min-width:2px;display:block;background:var(--k-sunken,#E8ECEA)}' +
  '.kstage .s-cleared{background:color-mix(in srgb,var(--k-sea,#155C75) 22%,var(--k-surface,#fff))}.kstage .s-earthworks{background:color-mix(in srgb,var(--k-sea,#155C75) 45%,var(--k-surface,#fff))}.kstage .s-structure{background:color-mix(in srgb,var(--k-sea,#155C75) 72%,var(--k-surface,#fff))}.kstage .s-roofed{background:var(--k-sea,#155C75)}' +
  '.kstage .s-none,.kstage .s-base{background:var(--k-sunken,#E8ECEA)}.kstage .s-base{background:repeating-linear-gradient(90deg,var(--k-sunken,#E8ECEA) 0 3px,var(--k-line-2,#C9D0CD) 3px 4px)}.kstage .s-cant{background:repeating-linear-gradient(135deg,var(--k-surface,#fff) 0 3px,var(--k-muted,#56636F) 3px 4px)}.kstage .s-nodata{background:var(--k-surface,#fff);box-shadow:inset 0 0 0 1px var(--k-line,#D5DAD8)}' +
  '.kstage-yr{display:flex;justify-content:space-between;font-size:.72rem;color:var(--k-muted,var(--muted));font-variant-numeric:tabular-nums}.kstage-lg{display:flex;flex-wrap:wrap;gap:6px 16px;margin:10px 0 0;padding:0;list-style:none;font-size:var(--k-fs-xs,.82rem)}.kstage-lg li{display:flex;align-items:center;gap:6px}.kstage-lg i{display:inline-block;width:14px;height:14px;border-radius:3px}' +
  '.kstage .tw{overflow-x:auto}.kstage table{border-collapse:collapse;font-size:var(--k-fs-xs,.82rem);min-width:100%}.kstage th,.kstage td{text-align:start;padding:6px 8px;border-bottom:1px solid var(--k-line,var(--line));vertical-align:top;font-variant-numeric:tabular-nums}.kstage td:first-child{white-space:nowrap}</style>';

const SRC = { o: '/data/construction-progress.json', r: '/data/satellite-radar.json', b: '/data/buildings.json', d: '/promises/', p: '/promises/' };
function reasonText(lang, fd, code, p) {
  const q = Object.assign({}, p);
  for (const k of ['base', 'm', 'd', 'rel']) if (q[k] && /^\d{4}(-\d{2})?/.test(q[k])) q[k] = fd(q[k]);
  if (q.rel) q.rel = q.rel;
  return t(lang, code, q);
}
const srcOf = code => SRC[code[0]] || '';

// est: stages() result; fd(date) display date; returns the HTML block (empty when the project has no series)
export function stageHtml(est, lang, fd, id) {
  if (!est) return '';
  const head = '<h3>' + esc(t(lang, 'h')) + '</h3><p class="ki">' + esc(t(lang, 'intro')) + '</p>';
  const links = '<p class="ksat-src"><a href="' + pre(lang) + '/methods/construction-stage/">' + esc(t(lang, 'method')) + '</a> <a class="src" href="/api/x/stage/' + encodeURIComponent(id) + '">' + esc(t(lang, 'api')) + '</a></p>';
  if (!est.enough || !est.latest) return CSS + '<div class="kstage" id="stage">' + head + '<p>' + esc(t(lang, 'thin', { c: est.clear })) + '</p>' + links + '</div>';
  const L = est.latest;
  const li = L.r.map(([code, p]) => '<li>' + esc(reasonText(lang, fd, code, p)) + (srcOf(code) ? ' <a class="k-src" href="' + srcOf(code) + '">' + esc(code[0] === 'o' ? 'Sentinel-2' : code[0] === 'r' ? 'Sentinel-1' : code[0] === 'b' ? 'Overture' : t(lang, 'why')) + '</a>' : '') + '</li>').join('');
  const now = '<div class="kstage-now" role="group" aria-label="' + esc(t(lang, 'latest', { m: fd(L.m) })) + '"><div class="k-small k-muted">' + esc(t(lang, 'latest', { m: fd(L.m) })) + '</div><div class="kstage-st">' + esc(stageWord(lang, L.s)) + '</div>' +
    (L.c ? '<div>' + esc(t(lang, 'conf', { c: t(lang, 'c_' + L.c) })) + '</div>' : '') + '<ul aria-label="' + esc(t(lang, 'why')) + '">' + li + '</ul></div>';
  const M = est.months;
  const rib = '<div class="kstage-rib" dir="ltr" aria-hidden="true">' + M.map(x => '<i class="s-' + x.s + '" title="' + esc(fd(x.m) + ': ' + stageWord(lang, x.s) + (x.c ? ' (' + t(lang, 'c_' + x.c) + ')' : '')) + '"></i>').join('') + '</div>' +
    '<div class="kstage-yr" dir="ltr" aria-hidden="true"><span>' + esc(M[0].m.slice(0, 4)) + '</span><span>' + esc(M[Math.floor(M.length / 2)].m.slice(0, 4)) + '</span><span>' + esc(M[M.length - 1].m.slice(0, 4)) + '</span></div>';
  const used = [...new Set(M.map(x => x.s))];
  const lg = '<ul class="kstage-lg">' + ['base', 'none', 'cleared', 'earthworks', 'structure', 'roofed', 'cant', 'nodata'].filter(s => used.includes(s)).map(s => '<li><i class="s-' + s + '"></i>' + esc(stageWord(lang, s)) + '</li>').join('') + '</ul><p class="ksat-src">' + esc(t(lang, 'leg')) + '</p>';
  const th = t(lang, 'th');
  const sigs = x => x.r.map(([code, p]) => code === 'o_up' || code === 'o_green' || code === 'o_same' ? (code === 'o_same' ? '' : t(lang, 's_o', { x: code === 'o_green' ? '-' + p.x : p.x })) : code === 'r_up' || code === 'r_down' || code === 'r_flat' ? t(lang, 's_r', { x: p.x }) : code === 'b_yes' || code === 'b_yesf' ? t(lang, 's_b') : '').filter(Boolean).join(', ');
  const rows = M.slice().reverse().map(x => '<tr><td>' + esc(fd(x.m)) + '</td><td>' + esc(stageWord(lang, x.s)) + '</td><td>' + esc(x.c ? t(lang, 'c_' + x.c) : '') + '</td><td>' + esc(sigs(x)) + '</td></tr>').join('');
  const table = '<details><summary>' + esc(t(lang, 'tbl')) + '</summary><div class="tw"><table><thead><tr>' + th.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div></details>';
  return CSS + '<div class="kstage" id="stage">' + head + now + rib + lg + '<p class="ksat-lim">' + esc(t(lang, 'lim')) + '</p>' + links + table + '</div>';
}
// per-month stage words for the time machine (month -> [stage word, confidence word])
export function stageLabels(est, lang) {
  const o = {}; if (!est || !est.enough) return o;
  for (const x of est.months) o[x.m] = stageWord(lang, x.s) + (x.c ? ' (' + t(lang, 'c_' + x.c) + ')' : '');
  return o;
}

// ------------------------------------------------------------------------------------------------ routes
function out(o, s, cc) { return new Response(JSON.stringify(o), { status: s || 200, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': cc || 'public, max-age=600' } }); }
async function inputs(env, id) {
  const ns = await import('./kbx_named_sat.js'), nm = await import('./kbx_named.js');
  const sat = await ns.satData(env), ix = await nm.data(env), x = ix.byId.get(id);
  if (!sat || !x) return null;
  const rec = sat.projects && sat.projects[id]; if (!rec) return { x, rec: null };
  const ms = ns.milestones(ix.prom[id] || [], x.fx || {});
  return { x, rec, sat, ms, est: stages(rec, ns.index(rec), sat.space && sat.space.radar, sat.space && sat.space.bld, ms, id) };
}
export async function handle(req, u, env) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: 'method not allowed' }, 405, 'no-store');
  const q = u.pathname.replace(/\/+$/, '');
  if (q === '/api/x/stage') return out({ module: 'stage (batch 18, n18b)', endpoints: { '/api/x/stage/<ID>': 'monthly construction stage estimate, confidence and reasons for one named project with a satellite series' }, rules: RULES, version: VERSION, method: ORIGIN + '/methods/construction-stage/', licence: 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)' });
  const id = decodeURIComponent(q.slice('/api/x/stage/'.length)).toUpperCase().slice(0, 20);
  if (!/^[A-Z]{1,6}-\d{1,4}$/.test(id)) return out({ error: 'give /api/x/stage/<ID> like AUH-003' }, 400, 'public, max-age=60');
  let d; try { d = await inputs(env, id); } catch (e) { return out({ error: 'unavailable' }, 503, 'no-store'); }
  if (!d || !d.x) return out({ id, error: 'no named project has this id' }, 404, 'public, max-age=300');
  if (!d.rec) return out({ id, error: 'no satellite series for this project (needs a plot-level pin)' }, 404, 'public, max-age=300');
  const e = d.est;
  return out({ id, name: d.x.n, page: ORIGIN + '/projects/' + d.x.s + '/', version: VERSION, rules: RULES, enough: e.enough, clear_months: e.clear,
    latest: e.latest && { month: e.latest.m, stage: e.latest.s, stage_text: stageWord('en', e.latest.s), confidence: e.latest.c, reasons: e.latest.r.map(([c, p]) => ({ code: c, text: t('en', c, p), params: p, source: srcOf(c) ? ORIGIN + srcOf(c) : null })) },
    months: e.months.map(x => ({ month: x.m, stage: x.s, confidence: x.c, reasons: x.r.map(([c]) => c) })),
    stages: Object.fromEntries(['base', 'none', 'cleared', 'earthworks', 'structure', 'roofed', 'cant', 'nodata'].map(s => [s, stageWord('en', s)])),
    sources: { optical: ORIGIN + SRC.o, radar: ORIGIN + SRC.r, buildings: ORIGIN + SRC.b, promises: ORIGIN + '/data/promises.json' }, data_updated: { optical: d.sat.updated, radar: d.sat.space && d.sat.space.radar && d.sat.space.radar.updated || null, buildings: d.sat.space && d.sat.space.bld && d.sat.space.bld.updated || null },
    caveat: S.en.lim, method: ORIGIN + '/methods/construction-stage/', licence: 'CC BY 4.0 (credit: Kolaboro, kolaboro.com). Contains modified Copernicus Sentinel data; Overture Maps ODbL 1.0.' });
}

// ------------------------------------------------------------------------------------------------ method page
const PG_CSS = '<style id="kstage-pg">.kstg-pg .k-phead{padding-block:var(--k-7,48px) var(--k-5,24px)}.kstg-pg h1{max-width:22ch}.kstg-pg .lead{max-width:62ch;color:var(--k-ink-2)}.kstg-pg h2{margin:0 0 var(--k-3,12px)}.kstg-pg ol,.kstg-pg ul{max-width:72ch;line-height:1.6;padding-inline-start:22px}.kstg-pg li{margin:0 0 8px}.kstg-pg p{max-width:72ch;line-height:1.6}' +
  '.kstg-sw{display:inline-block;width:14px;height:14px;border-radius:3px;margin-inline-end:8px;vertical-align:-2px}.kstg-sw.s-cleared{background:color-mix(in srgb,var(--k-sea,#155C75) 22%,var(--k-surface,#fff))}.kstg-sw.s-earthworks{background:color-mix(in srgb,var(--k-sea,#155C75) 45%,var(--k-surface,#fff))}.kstg-sw.s-structure{background:color-mix(in srgb,var(--k-sea,#155C75) 72%,var(--k-surface,#fff))}.kstg-sw.s-roofed{background:var(--k-sea,#155C75)}.kstg-sw.s-none,.kstg-sw.s-base{background:var(--k-sunken,#E8ECEA);box-shadow:inset 0 0 0 1px var(--k-line,#D5DAD8)}.kstg-sw.s-cant{background:repeating-linear-gradient(135deg,var(--k-surface,#fff) 0 3px,var(--k-muted,#56636F) 3px 4px)}</style>';
function methodBody(lang) {
  const R = RULES, v = { a: R.already_built_pct, n: R.footprint_near_m, w: R.optical_window, t: R.footprint_cover_pct, b: R.optical_band_pts, e: R.earthworks_after_clear_months, c: R.min_clear_months };
  const fill = s => s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m);
  const keys = ['base', 'roofed', 'structure', 'earthworks', 'cleared', 'none'];
  const rules = t(lang, 'm_rules').map((s, i) => '<li><span class="kstg-sw s-' + keys[i] + '" aria-hidden="true"></span>' + esc(fill(s)) + '</li>').join('');
  return '<div class="kstg-pg"><section class="k-sec"><div class="k-wrap"><div class="k-phead"><p class="k-crumb"><a href="' + pre(lang) + '/">Kolaboro</a></p><h1>' + esc(t(lang, 'm_title')) + '</h1><p class="lead">' + esc(t(lang, 'm_lead')) + '</p></div>' +
    '<h2>' + esc(t(lang, 'm_h_in')) + '</h2><ul>' + t(lang, 'm_in').map(s => '<li>' + esc(fill(s)) + '</li>').join('') + '</ul></div></section>' +
    '<section class="k-sec"><div class="k-wrap"><h2>' + esc(t(lang, 'm_h_rules')) + '</h2><ol>' + rules + '</ol>' +
    '<p>' + esc(fill(t(lang, 'm_rule_x'))) + '</p><h2>' + esc(t(lang, 'm_h_conf')) + '</h2><p>' + esc(t(lang, 'm_conf')) + '</p>' +
    '<h2>' + esc(t(lang, 'm_h_cant')) + '</h2><p><span class="kstg-sw s-cant" aria-hidden="true"></span>' + esc(stageWord(lang, 'cant')) + '</p><ul>' + t(lang, 'm_cant').map(s => '<li>' + esc(fill(s)) + '</li>').join('') + '</ul></div></section>' +
    '<section class="k-sec"><div class="k-wrap"><h2>' + esc(t(lang, 'm_h_lim')) + '</h2><p>' + esc(t(lang, 'm_lim')) + '</p><h2>' + esc(t(lang, 'm_h_data')) + '</h2><p>' + esc(t(lang, 'm_data')) + '</p>' +
    '<p class="kfc-links"><a href="/api/x/stage">/api/x/stage</a> <a href="/data/construction-progress.json">/data/construction-progress.json</a> <a href="/data/satellite-radar.json">/data/satellite-radar.json</a> <a href="/data/buildings.json">/data/buildings.json</a> <a href="https://registry.opendata.aws/sentinel-2-l2a-cogs/" rel="noopener">Sentinel-2 L2A COGs</a> <a href="https://planetarycomputer.microsoft.com/dataset/sentinel-1-rtc" rel="noopener">Sentinel-1 RTC</a> <a href="https://docs.overturemaps.org/attribution/" rel="noopener">Overture attribution</a></p></div></section></div>';
}
export async function method(req, u, env, ctx, shell) {
  const m = u.pathname.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?methods\/construction-stage(\/?)$/); if (!m || !shell) return null;
  if (!m[2]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
  const lang = m[1] || 'en', path = '/methods/construction-stage/', url = ORIGIN + pre(lang) + path;
  const sh = await shell(pre(lang) + '/how-we-score/');
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': 'TechArticle', '@id': url + '#article', headline: t(lang, 'm_title'), description: t(lang, 'm_desc'), url, inLanguage: lang, dateModified: '2026-11-08', author: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, publisher: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kolaboro', item: ORIGIN + pre(lang) + '/' }, { '@type': 'ListItem', position: 2, name: t(lang, 'm_title'), item: url }] }] };
  const alts = LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + path + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + path + '">';
  const tags = '<title>' + esc(t(lang, 'm_title')) + ' | Kolaboro</title><meta name="description" content="' + esc(t(lang, 'm_desc')) + '"><link rel="canonical" href="' + url + '">' + alts +
    '<meta property="og:type" content="article"><meta property="og:site_name" content="Kolaboro"><meta property="og:title" content="' + esc(t(lang, 'm_title')) + ' | Kolaboro"><meta property="og:description" content="' + esc(t(lang, 'm_desc')) + '"><meta property="og:url" content="' + url + '"><meta name="twitter:card" content="summary">' +
    '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' + PG_CSS;
  const res = new HTMLRewriter()
    .on('html', { element(e) { e.setAttribute('lang', lang); if (lang === 'ar') e.setAttribute('dir', 'rtl'); else e.removeAttribute('dir'); } })
    .on('title', { element(e) { e.remove(); } })
    .on('meta[name="description"],meta[name="robots"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],link[rel="alternate"][hreflang]', { element(e) { e.remove(); } })
    .on('script[type="application/ld+json"]', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(methodBody(lang), { html: true }); } })
    .on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + path); } })
    .transform(new Response(sh.body, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
  return new Response(await res.text(), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600' } });
}
