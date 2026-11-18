// kolaboro.com batch 19 (agent n19d): "Any plot from space" page, /satellite/plot/ in 8 languages (en es de fr nl ru zh ar).
// The page is the existing on-demand satellite tool (batch 9) extended: one clear Sentinel-2 picture per quarter back to 2017, each
// made on demand at the edge by GET /api/x/g/frame (kbx_g.js, same method as the X-ray satellite card in kbx_xray_ev.js), cached
// per point and quarter, rate limited per address; and a time-lapse GIF built in the browser from those real pictures (/k/tlgif.js)
// with a share link that only carries the pin in the URL. Nothing about the person is stored. No AI anywhere in this module.
// Rendered into the localized /how-we-score/ shell like the other worker pages (kbx_fc.js pattern); the static English
// /satellite/plot/index.html stays as the fallback if this module fails.
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?satellite\/plot\/?$/;
const V = 'n19d-2';

const T = {
  en: {
    title: 'Any plot from space: Sentinel-2 since 2017', desc: 'Drop a pin, paste coordinates or a Google Maps link and see one clear Sentinel-2 picture per quarter since 2017, made on demand from the public archive, plus a time-lapse GIF you can share.',
    crumb_sat: 'Satellite watch', crumb: 'Your plot', h1: 'Any plot from space, one clear picture per quarter since 2017',
    lead: 'Drop a pin on the plot you are paying for. We look up the Sentinel-2 images of that spot in the public archive, check the cloud mask at your pin and keep the first clear picture of every quarter, back to 2017.',
    note_b: 'One pixel is 10 m by 10 m.', note: 'You will see land being cleared, platforms, roads and large roofs. You will not see floors, walls or finishes, and a quarter can be missing when the clouds never left your pin. A picture is not proof that a payment milestone was reached.',
    h_pin: '1. Drop a pin', pin_lead: 'Tap the map where the plot is, or paste coordinates or a Google Maps link.', in_label: 'Coordinates or map link', ph: '-8.6380, 115.1150 or a maps link', show: 'Show',
    span: 'How far back', y3: '3 years', yall: 'Since 2017', map_aria: 'Map. Tap to drop a pin on your plot.',
    priv: 'Your pin is rounded to about 10 m and used only to find and cut the pictures. Each picture is kept in our cache for 30 days per point, so the next view of the same spot is fast. Nothing is linked to you and nothing else is stored. Limit: 240 new quarters per 10 minutes from one connection.',
    h_res: '2. What the satellite saw', st0: 'Drop a pin to start.', at_pin: 'At your pin', read0: 'Waiting for at least three clear quarters.',
    small: 'Brightness and greenness are averaged over the 50 m square at the pin (25 pixels) from the true-colour image. Haze, sun angle and the season move them a little, so only large changes mean something.',
    ms: 'Use this pin in a payment plan', h_share: '3. Share the time-lapse', share_lead: 'Turn the clear quarters into an animated GIF with each date and the Copernicus credit burned in. It is made in your browser. The link opens this page on the same pin; it carries only the coordinates.',
    gif: 'Make the time-lapse GIF', gif_need: 'At least two clear quarters are needed for a time-lapse.',
    making: 'Making the GIF in your browser: {p}%', ready: 'GIF ready: {n} real images, {kb} KB.', share: 'Share', dl: 'Download GIF', copy: 'Copy link', copied: 'Link copied',
    gnote: 'Made in your browser from the real quarterly images above. Nothing is uploaded or stored.', fail: 'This browser could not make the GIF. The images above stay available.',
    h_how: 'How this works', how1_h: 'What happens when you drop a pin', how1: ['For each quarter, our server asks the public Earth Search catalogue for the Sentinel-2 scenes over your point, least cloudy first.', 'It reads the scene classification layer (20 m) at your pin and skips scenes with cloud, shadow or no data within 150 m, trying up to five per quarter.', 'From the first clear scene it cuts the true-colour image (10 m) around the pin, 1.28 km across: the same method as the satellite card of our project X-ray.'],
    how2_h: 'What it cannot tell you', how2: ['Whether a slab, a floor or a roof is finished: one pixel is 10 m wide.', 'Whether the plot you pinned is the plot in your contract. Check the certificate and the coordinates with your agent.', 'Anything that happened between two pictures and was covered again.'],
    credit: 'Contains modified Copernicus Sentinel data. Scene search: Element84 Earth Search. Images: Sentinel-2 L2A cloud-optimised GeoTIFFs on the AWS Open Data registry. API:',
    j: { q: 'Q{n} {y}', look: 'Looking up {n} quarters over your pin, newest first…', prog: '{d} of {n} quarters checked, {ok} clear so far.', done: '{ok} of {n} quarters have a clear picture at your pin. Done in {s} s.',
      none: 'No quarter had a clear view of this point. In very cloudy places (wet seasons in the tropics) this happens.', rate: 'Too many new points from your connection in the last few minutes. Wait a moment and try again; pictures already made still load.',
      load: 'Some images could not be made. The public archive or our server may be busy; please try again.', parse: 'Paste coordinates like -8.6380, 115.1150 or a map link that contains them.', map: 'The map could not start in this browser.',
      wait: 'Checking…', noimg: 'No scene listed', fail: 'Search failed', cloud: 'Cloud at the pin in every scene checked', clear: '{c}% clear at pin, scene {s}% cloud', src: 'source image', tried: '{n} scenes checked',
      show: 'Show {q}, {d}', big: 'Sentinel-2 true colour around your pin, {d}', sel: '{c}% clear within 150 m of the pin. Scene {id}.', prev: 'Previous quarter', next: 'Next quarter', play: 'Play', pause: 'Pause', tryw: 'Try a watched area:',
      few: 'Only {n} clear quarters: not enough to compare.', r_none: 'No large change in brightness or greenness at the pin between the start and the end of the period.',
      r_clear: 'The ground at the pin got brighter or less green: consistent with clearing, earthworks or new roofs. It does not show which stage a building has reached.', r_green: 'The pin got greener: vegetation grew, or the season changed. That is not a sign of construction.',
      r_other: 'The ground at the pin looks different from the start of the period. Look at the pictures to see why.', r_how: '(Median of the first two and the last two clear quarters, {a} to {b}: brightness {db}, greenness {dg}, on a 0 to 255 scale.)',
      lb: 'brightness', lg: 'greenness', chart: 'At the pin, per clear quarter: {x}' } },
  es: {
    title: 'Cualquier parcela desde el espacio: Sentinel-2 desde 2017', desc: 'Pon un pin, pega coordenadas o un enlace de Google Maps y mira una imagen despejada de Sentinel-2 por trimestre desde 2017, generada al momento desde el archivo público, y un GIF animado para compartir.',
    crumb_sat: 'Vigilancia por satélite', crumb: 'Tu parcela', h1: 'Cualquier parcela desde el espacio, una imagen despejada por trimestre desde 2017',
    lead: 'Pon un pin en la parcela que estás pagando. Buscamos las imágenes de Sentinel-2 de ese punto en el archivo público, comprobamos la máscara de nubes en tu pin y guardamos la primera imagen despejada de cada trimestre, desde 2017.',
    note_b: 'Un píxel mide 10 m por 10 m.', note: 'Verás terreno desbrozado, plataformas, caminos y cubiertas grandes. No verás plantas, muros ni acabados, y puede faltar un trimestre si las nubes nunca dejaron ver tu pin. Una imagen no prueba que se haya alcanzado un hito de pago.',
    h_pin: '1. Pon un pin', pin_lead: 'Toca el mapa donde está la parcela, o pega coordenadas o un enlace de Google Maps.', in_label: 'Coordenadas o enlace de mapa', ph: '-8.6380, 115.1150 o un enlace de mapa', show: 'Ver',
    span: 'Desde cuándo', y3: '3 años', yall: 'Desde 2017', map_aria: 'Mapa. Toca para poner un pin en tu parcela.',
    priv: 'Tu pin se redondea a unos 10 m y solo se usa para buscar y recortar las imágenes. Cada imagen se guarda en nuestra caché 30 días por punto, así la siguiente vista del mismo lugar es rápida. Nada se vincula contigo y no se guarda nada más. Límite: 240 trimestres nuevos cada 10 minutos por conexión.',
    h_res: '2. Lo que vio el satélite', st0: 'Pon un pin para empezar.', at_pin: 'En tu pin', read0: 'Esperando al menos tres trimestres despejados.',
    small: 'El brillo y el verdor son la media del cuadrado de 50 m del pin (25 píxeles) en la imagen en color real. La bruma, el ángulo del sol y la estación los mueven un poco, así que solo los cambios grandes significan algo.',
    ms: 'Usar este pin en un plan de pagos', h_share: '3. Comparte el time-lapse', share_lead: 'Convierte los trimestres despejados en un GIF animado con cada fecha y el crédito de Copernicus grabados. Se crea en tu navegador. El enlace abre esta página en el mismo pin; solo lleva las coordenadas.',
    gif: 'Crear el GIF del time-lapse', gif_need: 'Hacen falta al menos dos trimestres despejados para un time-lapse.',
    making: 'Creando el GIF en tu navegador: {p}%', ready: 'GIF listo: {n} imágenes reales, {kb} KB.', share: 'Compartir', dl: 'Descargar GIF', copy: 'Copiar enlace', copied: 'Enlace copiado',
    gnote: 'Hecho en tu navegador con las imágenes trimestrales reales de arriba. No se sube ni se guarda nada.', fail: 'Este navegador no pudo crear el GIF. Las imágenes de arriba siguen disponibles.',
    h_how: 'Cómo funciona', how1_h: 'Qué pasa cuando pones un pin', how1: ['Para cada trimestre, nuestro servidor pide al catálogo público Earth Search las escenas de Sentinel-2 sobre tu punto, de menos a más nubosas.', 'Lee la capa de clasificación de escena (20 m) en tu pin y descarta escenas con nubes, sombras o sin datos a menos de 150 m, probando hasta cinco por trimestre.', 'De la primera escena despejada recorta la imagen en color real (10 m) alrededor del pin, de 1,28 km de lado: el mismo método que la tarjeta de satélite de nuestra radiografía de proyectos.'],
    how2_h: 'Lo que no puede decirte', how2: ['Si una losa, una planta o una cubierta está terminada: un píxel mide 10 m.', 'Si la parcela que marcaste es la de tu contrato. Comprueba el certificado y las coordenadas con tu agente.', 'Lo que pasó entre dos imágenes y volvió a quedar cubierto.'],
    credit: 'Contiene datos modificados de Copernicus Sentinel. Búsqueda de escenas: Element84 Earth Search. Imágenes: GeoTIFF optimizados para la nube de Sentinel-2 L2A en el registro AWS Open Data. API:',
    j: { q: 'T{n} {y}', look: 'Buscando {n} trimestres sobre tu pin, del más reciente al más antiguo…', prog: '{d} de {n} trimestres revisados, {ok} despejados por ahora.', done: '{ok} de {n} trimestres tienen una imagen despejada en tu pin. Hecho en {s} s.',
      none: 'Ningún trimestre tuvo una vista despejada de este punto. En lugares muy nublados (estación de lluvias en el trópico) pasa.', rate: 'Demasiados puntos nuevos desde tu conexión en los últimos minutos. Espera un momento y vuelve a intentarlo; las imágenes ya hechas siguen cargando.',
      load: 'Algunas imágenes no se pudieron crear. El archivo público o nuestro servidor pueden estar ocupados; vuelve a intentarlo.', parse: 'Pega coordenadas como -8.6380, 115.1150 o un enlace de mapa que las contenga.', map: 'El mapa no pudo iniciarse en este navegador.',
      wait: 'Comprobando…', noimg: 'Ninguna escena', fail: 'La búsqueda falló', cloud: 'Nubes en el pin en todas las escenas revisadas', clear: '{c}% despejado en el pin, escena con {s}% de nubes', src: 'imagen original', tried: '{n} escenas revisadas',
      show: 'Ver {q}, {d}', big: 'Sentinel-2 en color real alrededor de tu pin, {d}', sel: '{c}% despejado en 150 m alrededor del pin. Escena {id}.', prev: 'Trimestre anterior', next: 'Trimestre siguiente', play: 'Reproducir', pause: 'Pausa', tryw: 'Prueba una zona vigilada:',
      few: 'Solo {n} trimestres despejados: no basta para comparar.', r_none: 'Sin grandes cambios de brillo o verdor en el pin entre el inicio y el final del periodo.',
      r_clear: 'El suelo del pin se volvió más brillante o menos verde: compatible con desbroce, movimiento de tierras o cubiertas nuevas. No indica en qué fase está un edificio.', r_green: 'El pin se volvió más verde: creció vegetación o cambió la estación. No es señal de obra.',
      r_other: 'El suelo del pin se ve distinto que al inicio del periodo. Mira las imágenes para ver por qué.', r_how: '(Mediana de los dos primeros y los dos últimos trimestres despejados, {a} a {b}: brillo {db}, verdor {dg}, en una escala de 0 a 255.)',
      lb: 'brillo', lg: 'verdor', chart: 'En el pin, por trimestre despejado: {x}' } },
  de: {
    title: 'Jedes Grundstück aus dem All: Sentinel-2 seit 2017', desc: 'Setzen Sie eine Markierung, fügen Sie Koordinaten oder einen Google-Maps-Link ein und sehen Sie ein klares Sentinel-2-Bild pro Quartal seit 2017, auf Abruf aus dem öffentlichen Archiv erstellt, dazu ein teilbares Zeitraffer-GIF.',
    crumb_sat: 'Satellitenbeobachtung', crumb: 'Ihr Grundstück', h1: 'Jedes Grundstück aus dem All, ein klares Bild pro Quartal seit 2017',
    lead: 'Setzen Sie eine Markierung auf das Grundstück, das Sie bezahlen. Wir suchen die Sentinel-2-Bilder dieses Punktes im öffentlichen Archiv, prüfen die Wolkenmaske an Ihrer Markierung und behalten das erste klare Bild jedes Quartals, zurück bis 2017.',
    note_b: 'Ein Pixel misst 10 m mal 10 m.', note: 'Sie sehen gerodetes Land, Plattformen, Wege und große Dächer. Sie sehen keine Geschosse, Wände oder Ausbauten, und ein Quartal kann fehlen, wenn die Wolken Ihre Markierung nie freigaben. Ein Bild beweist nicht, dass ein Zahlungsmeilenstein erreicht wurde.',
    h_pin: '1. Markierung setzen', pin_lead: 'Tippen Sie auf die Karte, wo das Grundstück liegt, oder fügen Sie Koordinaten oder einen Google-Maps-Link ein.', in_label: 'Koordinaten oder Kartenlink', ph: '-8.6380, 115.1150 oder ein Kartenlink', show: 'Anzeigen',
    span: 'Zeitraum', y3: '3 Jahre', yall: 'Seit 2017', map_aria: 'Karte. Tippen, um eine Markierung auf Ihr Grundstück zu setzen.',
    priv: 'Ihre Markierung wird auf etwa 10 m gerundet und nur verwendet, um die Bilder zu finden und zuzuschneiden. Jedes Bild bleibt 30 Tage pro Punkt in unserem Cache, damit der nächste Aufruf derselben Stelle schnell ist. Nichts wird mit Ihnen verknüpft und sonst nichts gespeichert. Grenze: 240 neue Quartale pro 10 Minuten je Verbindung.',
    h_res: '2. Was der Satellit sah', st0: 'Setzen Sie eine Markierung, um zu beginnen.', at_pin: 'An Ihrer Markierung', read0: 'Warten auf mindestens drei klare Quartale.',
    small: 'Helligkeit und Grünanteil sind Mittelwerte des 50-m-Quadrats an der Markierung (25 Pixel) im Echtfarbenbild. Dunst, Sonnenstand und Jahreszeit verschieben sie etwas, daher zählen nur große Änderungen.',
    ms: 'Diese Markierung in einem Zahlungsplan verwenden', h_share: '3. Zeitraffer teilen', share_lead: 'Machen Sie aus den klaren Quartalen ein animiertes GIF, mit jedem Datum und dem Copernicus-Hinweis im Bild. Es entsteht in Ihrem Browser. Der Link öffnet diese Seite an derselben Stelle; er enthält nur die Koordinaten.',
    gif: 'Zeitraffer-GIF erstellen', gif_need: 'Für einen Zeitraffer sind mindestens zwei klare Quartale nötig.',
    making: 'GIF wird in Ihrem Browser erstellt: {p}%', ready: 'GIF fertig: {n} echte Bilder, {kb} KB.', share: 'Teilen', dl: 'GIF herunterladen', copy: 'Link kopieren', copied: 'Link kopiert',
    gnote: 'In Ihrem Browser aus den echten Quartalsbildern oben erstellt. Nichts wird hochgeladen oder gespeichert.', fail: 'Dieser Browser konnte das GIF nicht erstellen. Die Bilder oben bleiben verfügbar.',
    h_how: 'So funktioniert es', how1_h: 'Was passiert, wenn Sie eine Markierung setzen', how1: ['Für jedes Quartal fragt unser Server den öffentlichen Katalog Earth Search nach den Sentinel-2-Szenen über Ihrem Punkt, die wolkenärmsten zuerst.', 'Er liest die Szenenklassifikation (20 m) an Ihrer Markierung und überspringt Szenen mit Wolken, Schatten oder fehlenden Daten im Umkreis von 150 m, bis zu fünf pro Quartal.', 'Aus der ersten klaren Szene schneidet er das Echtfarbenbild (10 m) um die Markierung aus, 1,28 km breit: dieselbe Methode wie die Satellitenkarte unseres Projekt-Röntgens.'],
    how2_h: 'Was es nicht zeigen kann', how2: ['Ob eine Decke, ein Geschoss oder ein Dach fertig ist: ein Pixel ist 10 m breit.', 'Ob das markierte Grundstück das aus Ihrem Vertrag ist. Prüfen Sie Urkunde und Koordinaten mit Ihrem Makler oder Anwalt.', 'Was zwischen zwei Bildern geschah und wieder verdeckt wurde.'],
    credit: 'Enthält veränderte Copernicus-Sentinel-Daten. Szenensuche: Element84 Earth Search. Bilder: Cloud-optimierte GeoTIFFs von Sentinel-2 L2A im AWS Open Data Registry. API:',
    j: { q: 'Q{n} {y}', look: '{n} Quartale über Ihrer Markierung werden gesucht, die neuesten zuerst…', prog: '{d} von {n} Quartalen geprüft, bisher {ok} klar.', done: '{ok} von {n} Quartalen haben ein klares Bild an Ihrer Markierung. Fertig in {s} s.',
      none: 'Kein Quartal hatte freie Sicht auf diesen Punkt. An sehr wolkigen Orten (Regenzeit in den Tropen) kommt das vor.', rate: 'Zu viele neue Punkte von Ihrer Verbindung in den letzten Minuten. Bitte kurz warten und erneut versuchen; bereits erstellte Bilder laden weiter.',
      load: 'Einige Bilder konnten nicht erstellt werden. Das öffentliche Archiv oder unser Server ist vielleicht ausgelastet; bitte erneut versuchen.', parse: 'Fügen Sie Koordinaten wie -8.6380, 115.1150 ein oder einen Kartenlink, der sie enthält.', map: 'Die Karte konnte in diesem Browser nicht starten.',
      wait: 'Wird geprüft…', noimg: 'Keine Szene gelistet', fail: 'Suche fehlgeschlagen', cloud: 'Wolken an der Markierung in jeder geprüften Szene', clear: '{c}% klar an der Markierung, Szene {s}% Wolken', src: 'Quellbild', tried: '{n} Szenen geprüft',
      show: '{q} anzeigen, {d}', big: 'Sentinel-2 in Echtfarben um Ihre Markierung, {d}', sel: '{c}% klar im Umkreis von 150 m. Szene {id}.', prev: 'Vorheriges Quartal', next: 'Nächstes Quartal', play: 'Abspielen', pause: 'Pause', tryw: 'Ein beobachtetes Gebiet testen:',
      few: 'Nur {n} klare Quartale: zu wenig für einen Vergleich.', r_none: 'Keine große Änderung von Helligkeit oder Grünanteil an der Markierung zwischen Anfang und Ende des Zeitraums.',
      r_clear: 'Der Boden an der Markierung wurde heller oder weniger grün: passt zu Rodung, Erdarbeiten oder neuen Dächern. Es zeigt nicht, in welcher Phase ein Gebäude ist.', r_green: 'Die Markierung wurde grüner: Vegetation wuchs oder die Jahreszeit wechselte. Das ist kein Zeichen für Bauarbeiten.',
      r_other: 'Der Boden an der Markierung sieht anders aus als zu Beginn des Zeitraums. Die Bilder zeigen, warum.', r_how: '(Median der ersten zwei und der letzten zwei klaren Quartale, {a} bis {b}: Helligkeit {db}, Grünanteil {dg}, auf einer Skala von 0 bis 255.)',
      lb: 'Helligkeit', lg: 'Grünanteil', chart: 'An der Markierung, je klarem Quartal: {x}' } },
  fr: {
    title: 'N\'importe quel terrain vu de l\'espace : Sentinel-2 depuis 2017', desc: 'Placez un repère, collez des coordonnées ou un lien Google Maps et voyez une image Sentinel-2 dégagée par trimestre depuis 2017, créée à la demande depuis l\'archive publique, avec un GIF animé à partager.',
    crumb_sat: 'Veille satellite', crumb: 'Votre terrain', h1: 'N\'importe quel terrain vu de l\'espace, une image dégagée par trimestre depuis 2017',
    lead: 'Placez un repère sur le terrain que vous payez. Nous cherchons les images Sentinel-2 de ce point dans l\'archive publique, vérifions le masque de nuages à votre repère et gardons la première image dégagée de chaque trimestre, depuis 2017.',
    note_b: 'Un pixel mesure 10 m sur 10 m.', note: 'Vous verrez un terrain défriché, des plateformes, des routes et de grandes toitures. Vous ne verrez ni étages, ni murs, ni finitions, et un trimestre peut manquer si les nuages n\'ont jamais quitté votre repère. Une image ne prouve pas qu\'une étape de paiement a été atteinte.',
    h_pin: '1. Placez un repère', pin_lead: 'Touchez la carte à l\'endroit du terrain, ou collez des coordonnées ou un lien Google Maps.', in_label: 'Coordonnées ou lien de carte', ph: '-8.6380, 115.1150 ou un lien de carte', show: 'Afficher',
    span: 'Depuis quand', y3: '3 ans', yall: 'Depuis 2017', map_aria: 'Carte. Touchez pour placer un repère sur votre terrain.',
    priv: 'Votre repère est arrondi à environ 10 m et sert seulement à trouver et découper les images. Chaque image reste 30 jours par point dans notre cache, pour que la vue suivante du même endroit soit rapide. Rien n\'est lié à vous et rien d\'autre n\'est conservé. Limite : 240 nouveaux trimestres par 10 minutes et par connexion.',
    h_res: '2. Ce que le satellite a vu', st0: 'Placez un repère pour commencer.', at_pin: 'À votre repère', read0: 'En attente d\'au moins trois trimestres dégagés.',
    small: 'La luminosité et le verdissement sont la moyenne du carré de 50 m au repère (25 pixels) dans l\'image en couleurs réelles. La brume, l\'angle du soleil et la saison les font varier un peu : seuls les grands changements comptent.',
    ms: 'Utiliser ce repère dans un plan de paiement', h_share: '3. Partagez le time-lapse', share_lead: 'Transformez les trimestres dégagés en GIF animé, avec chaque date et la mention Copernicus incrustées. Il est créé dans votre navigateur. Le lien ouvre cette page au même repère ; il ne contient que les coordonnées.',
    gif: 'Créer le GIF du time-lapse', gif_need: 'Il faut au moins deux trimestres dégagés pour un time-lapse.',
    making: 'Création du GIF dans votre navigateur : {p} %', ready: 'GIF prêt : {n} vraies images, {kb} Ko.', share: 'Partager', dl: 'Télécharger le GIF', copy: 'Copier le lien', copied: 'Lien copié',
    gnote: 'Créé dans votre navigateur à partir des vraies images trimestrielles ci-dessus. Rien n\'est envoyé ni conservé.', fail: 'Ce navigateur n\'a pas pu créer le GIF. Les images ci-dessus restent disponibles.',
    h_how: 'Comment ça marche', how1_h: 'Ce qui se passe quand vous placez un repère', how1: ['Pour chaque trimestre, notre serveur demande au catalogue public Earth Search les scènes Sentinel-2 sur votre point, les moins nuageuses d\'abord.', 'Il lit la couche de classification de scène (20 m) à votre repère et écarte les scènes avec nuages, ombres ou sans données à moins de 150 m, jusqu\'à cinq par trimestre.', 'Dans la première scène dégagée, il découpe l\'image en couleurs réelles (10 m) autour du repère, 1,28 km de côté : la même méthode que la carte satellite de notre radiographie de projet.'],
    how2_h: 'Ce qu\'il ne peut pas dire', how2: ['Si une dalle, un étage ou une toiture est terminé : un pixel fait 10 m.', 'Si le terrain repéré est celui de votre contrat. Vérifiez le titre et les coordonnées avec votre agent.', 'Ce qui s\'est passé entre deux images et a de nouveau été recouvert.'],
    credit: 'Contient des données Copernicus Sentinel modifiées. Recherche de scènes : Element84 Earth Search. Images : GeoTIFF optimisés pour le cloud de Sentinel-2 L2A sur le registre AWS Open Data. API :',
    j: { q: 'T{n} {y}', look: 'Recherche de {n} trimestres sur votre repère, du plus récent au plus ancien…', prog: '{d} trimestres vérifiés sur {n}, {ok} dégagés pour l\'instant.', done: '{ok} trimestres sur {n} ont une image dégagée à votre repère. Terminé en {s} s.',
      none: 'Aucun trimestre n\'a eu de vue dégagée sur ce point. Cela arrive dans les endroits très nuageux (saison des pluies sous les tropiques).', rate: 'Trop de nouveaux points depuis votre connexion ces dernières minutes. Patientez un instant puis réessayez ; les images déjà créées se chargent toujours.',
      load: 'Certaines images n\'ont pas pu être créées. L\'archive publique ou notre serveur est peut-être occupé ; réessayez.', parse: 'Collez des coordonnées comme -8.6380, 115.1150 ou un lien de carte qui les contient.', map: 'La carte n\'a pas pu démarrer dans ce navigateur.',
      wait: 'Vérification…', noimg: 'Aucune scène', fail: 'Recherche échouée', cloud: 'Nuages au repère dans chaque scène vérifiée', clear: '{c} % dégagé au repère, scène à {s} % de nuages', src: 'image source', tried: '{n} scènes vérifiées',
      show: 'Afficher {q}, {d}', big: 'Sentinel-2 en couleurs réelles autour de votre repère, {d}', sel: '{c} % dégagé dans un rayon de 150 m. Scène {id}.', prev: 'Trimestre précédent', next: 'Trimestre suivant', play: 'Lecture', pause: 'Pause', tryw: 'Essayez une zone surveillée :',
      few: 'Seulement {n} trimestres dégagés : pas assez pour comparer.', r_none: 'Pas de grand changement de luminosité ou de verdissement au repère entre le début et la fin de la période.',
      r_clear: 'Le sol au repère est devenu plus lumineux ou moins vert : compatible avec un défrichage, des terrassements ou de nouvelles toitures. Cela n\'indique pas à quelle étape en est un bâtiment.', r_green: 'Le repère est devenu plus vert : la végétation a poussé ou la saison a changé. Ce n\'est pas un signe de chantier.',
      r_other: 'Le sol au repère est différent du début de la période. Regardez les images pour comprendre pourquoi.', r_how: '(Médiane des deux premiers et des deux derniers trimestres dégagés, de {a} à {b} : luminosité {db}, verdissement {dg}, sur une échelle de 0 à 255.)',
      lb: 'luminosité', lg: 'verdissement', chart: 'Au repère, par trimestre dégagé : {x}' } },
  nl: {
    title: 'Elk perceel vanuit de ruimte: Sentinel-2 sinds 2017', desc: 'Zet een speld, plak coördinaten of een Google Maps-link en zie per kwartaal één heldere Sentinel-2-opname sinds 2017, op aanvraag gemaakt uit het openbare archief, plus een time-lapse-GIF om te delen.',
    crumb_sat: 'Satellietwacht', crumb: 'Uw perceel', h1: 'Elk perceel vanuit de ruimte, één heldere opname per kwartaal sinds 2017',
    lead: 'Zet een speld op het perceel waarvoor u betaalt. Wij zoeken de Sentinel-2-beelden van die plek in het openbare archief, controleren het wolkenmasker bij uw speld en houden de eerste heldere opname van elk kwartaal, terug tot 2017.',
    note_b: 'Eén pixel is 10 m bij 10 m.', note: 'U ziet grond die wordt vrijgemaakt, platforms, wegen en grote daken. U ziet geen verdiepingen, muren of afwerking, en een kwartaal kan ontbreken als de wolken uw speld nooit vrijgaven. Een beeld bewijst niet dat een betalingsmijlpaal is bereikt.',
    h_pin: '1. Zet een speld', pin_lead: 'Tik op de kaart waar het perceel ligt, of plak coördinaten of een Google Maps-link.', in_label: 'Coördinaten of kaartlink', ph: '-8.6380, 115.1150 of een kaartlink', show: 'Tonen',
    span: 'Hoe ver terug', y3: '3 jaar', yall: 'Sinds 2017', map_aria: 'Kaart. Tik om een speld op uw perceel te zetten.',
    priv: 'Uw speld wordt afgerond op ongeveer 10 m en alleen gebruikt om de beelden te vinden en uit te snijden. Elk beeld blijft 30 dagen per punt in onze cache, zodat de volgende weergave van dezelfde plek snel is. Niets wordt aan u gekoppeld en verder wordt niets opgeslagen. Limiet: 240 nieuwe kwartalen per 10 minuten per verbinding.',
    h_res: '2. Wat de satelliet zag', st0: 'Zet een speld om te beginnen.', at_pin: 'Bij uw speld', read0: 'Wachten op ten minste drie heldere kwartalen.',
    small: 'Helderheid en groenheid zijn het gemiddelde van het vierkant van 50 m bij de speld (25 pixels) in het beeld in ware kleuren. Nevel, zonnestand en seizoen verschuiven ze iets, dus alleen grote veranderingen betekenen iets.',
    ms: 'Deze speld gebruiken in een betalingsplan', h_share: '3. Deel de time-lapse', share_lead: 'Maak van de heldere kwartalen een geanimeerde GIF, met elke datum en de Copernicus-vermelding in beeld. Hij wordt in uw browser gemaakt. De link opent deze pagina op dezelfde speld; hij bevat alleen de coördinaten.',
    gif: 'Time-lapse-GIF maken', gif_need: 'Voor een time-lapse zijn ten minste twee heldere kwartalen nodig.',
    making: 'GIF wordt in uw browser gemaakt: {p}%', ready: 'GIF klaar: {n} echte beelden, {kb} KB.', share: 'Delen', dl: 'GIF downloaden', copy: 'Link kopiëren', copied: 'Link gekopieerd',
    gnote: 'Gemaakt in uw browser van de echte kwartaalbeelden hierboven. Er wordt niets geüpload of opgeslagen.', fail: 'Deze browser kon de GIF niet maken. De beelden hierboven blijven beschikbaar.',
    h_how: 'Zo werkt het', how1_h: 'Wat er gebeurt als u een speld zet', how1: ['Voor elk kwartaal vraagt onze server de openbare catalogus Earth Search naar de Sentinel-2-scènes boven uw punt, de minst bewolkte eerst.', 'Hij leest de scèneclassificatie (20 m) bij uw speld en slaat scènes over met wolken, schaduw of geen gegevens binnen 150 m, tot vijf per kwartaal.', 'Uit de eerste heldere scène snijdt hij het beeld in ware kleuren (10 m) rond de speld, 1,28 km breed: dezelfde methode als de satellietkaart van onze project-röntgenfoto.'],
    how2_h: 'Wat het u niet kan vertellen', how2: ['Of een vloer, verdieping of dak af is: één pixel is 10 m breed.', 'Of het perceel dat u aanwees het perceel uit uw contract is. Controleer de akte en de coördinaten met uw makelaar.', 'Wat er tussen twee beelden gebeurde en weer werd afgedekt.'],
    credit: 'Bevat gewijzigde Copernicus Sentinel-gegevens. Scènes zoeken: Element84 Earth Search. Beelden: cloud-geoptimaliseerde GeoTIFF\'s van Sentinel-2 L2A in het AWS Open Data-register. API:',
    j: { q: 'K{n} {y}', look: '{n} kwartalen boven uw speld worden opgezocht, nieuwste eerst…', prog: '{d} van {n} kwartalen gecontroleerd, tot nu toe {ok} helder.', done: '{ok} van {n} kwartalen hebben een heldere opname bij uw speld. Klaar in {s} s.',
      none: 'Geen enkel kwartaal had vrij zicht op dit punt. Op zeer bewolkte plekken (regenseizoen in de tropen) gebeurt dat.', rate: 'Te veel nieuwe punten vanaf uw verbinding in de afgelopen minuten. Wacht even en probeer opnieuw; al gemaakte beelden laden nog wel.',
      load: 'Sommige beelden konden niet worden gemaakt. Het openbare archief of onze server is mogelijk druk; probeer het opnieuw.', parse: 'Plak coördinaten zoals -8.6380, 115.1150 of een kaartlink die ze bevat.', map: 'De kaart kon in deze browser niet starten.',
      wait: 'Controleren…', noimg: 'Geen scène gevonden', fail: 'Zoeken mislukt', cloud: 'Wolken bij de speld in elke gecontroleerde scène', clear: '{c}% helder bij de speld, scène {s}% bewolkt', src: 'bronbeeld', tried: '{n} scènes gecontroleerd',
      show: '{q} tonen, {d}', big: 'Sentinel-2 in ware kleuren rond uw speld, {d}', sel: '{c}% helder binnen 150 m van de speld. Scène {id}.', prev: 'Vorig kwartaal', next: 'Volgend kwartaal', play: 'Afspelen', pause: 'Pauze', tryw: 'Probeer een bewaakt gebied:',
      few: 'Slechts {n} heldere kwartalen: te weinig om te vergelijken.', r_none: 'Geen grote verandering in helderheid of groenheid bij de speld tussen begin en eind van de periode.',
      r_clear: 'De grond bij de speld werd helderder of minder groen: past bij vrijmaken, grondwerk of nieuwe daken. Het toont niet in welke fase een gebouw is.', r_green: 'De speld werd groener: er groeide begroeiing of het seizoen veranderde. Dat is geen teken van bouw.',
      r_other: 'De grond bij de speld ziet er anders uit dan aan het begin van de periode. Bekijk de beelden om te zien waarom.', r_how: '(Mediaan van de eerste twee en de laatste twee heldere kwartalen, {a} tot {b}: helderheid {db}, groenheid {dg}, op een schaal van 0 tot 255.)',
      lb: 'helderheid', lg: 'groenheid', chart: 'Bij de speld, per helder kwartaal: {x}' } },
  ru: {
    title: 'Любой участок из космоса: Sentinel-2 с 2017 года', desc: 'Поставьте метку, вставьте координаты или ссылку Google Maps и посмотрите по одному ясному снимку Sentinel-2 за квартал с 2017 года, созданному по запросу из открытого архива, плюс GIF-таймлапс, которым можно поделиться.',
    crumb_sat: 'Спутниковое наблюдение', crumb: 'Ваш участок', h1: 'Любой участок из космоса, один ясный снимок за квартал с 2017 года',
    lead: 'Поставьте метку на участок, за который вы платите. Мы находим снимки Sentinel-2 этой точки в открытом архиве, проверяем маску облаков у метки и оставляем первый ясный снимок каждого квартала, начиная с 2017 года.',
    note_b: 'Один пиксель равен 10 на 10 м.', note: 'Вы увидите расчистку земли, площадки, дороги и большие крыши. Вы не увидите этажи, стены или отделку, а квартал может отсутствовать, если облака так и не открыли метку. Снимок не доказывает, что этап оплаты достигнут.',
    h_pin: '1. Поставьте метку', pin_lead: 'Нажмите на карту там, где участок, или вставьте координаты или ссылку Google Maps.', in_label: 'Координаты или ссылка на карту', ph: '-8.6380, 115.1150 или ссылка на карту', show: 'Показать',
    span: 'За какой период', y3: '3 года', yall: 'С 2017 года', map_aria: 'Карта. Нажмите, чтобы поставить метку на участок.',
    priv: 'Метка округляется примерно до 10 м и используется только для поиска и обрезки снимков. Каждый снимок хранится в нашем кэше 30 дней для этой точки, чтобы следующий просмотр того же места был быстрым. Ничто не связывается с вами, и больше ничего не сохраняется. Лимит: 240 новых кварталов за 10 минут с одного подключения.',
    h_res: '2. Что увидел спутник', st0: 'Поставьте метку, чтобы начать.', at_pin: 'У вашей метки', read0: 'Ожидание хотя бы трёх ясных кварталов.',
    small: 'Яркость и зелёность усредняются по квадрату 50 м у метки (25 пикселей) на снимке в естественных цветах. Дымка, угол солнца и сезон немного их сдвигают, поэтому значение имеют только большие изменения.',
    ms: 'Использовать эту метку в графике платежей', h_share: '3. Поделитесь таймлапсом', share_lead: 'Превратите ясные кварталы в анимированный GIF с датой каждого снимка и указанием Copernicus на изображении. Он создаётся в вашем браузере. Ссылка открывает эту страницу на той же метке и содержит только координаты.',
    gif: 'Создать GIF-таймлапс', gif_need: 'Для таймлапса нужно хотя бы два ясных квартала.',
    making: 'GIF создаётся в вашем браузере: {p}%', ready: 'GIF готов: {n} настоящих снимков, {kb} КБ.', share: 'Поделиться', dl: 'Скачать GIF', copy: 'Скопировать ссылку', copied: 'Ссылка скопирована',
    gnote: 'Создано в вашем браузере из настоящих квартальных снимков выше. Ничего не загружается и не сохраняется.', fail: 'Этот браузер не смог создать GIF. Снимки выше по-прежнему доступны.',
    h_how: 'Как это работает', how1_h: 'Что происходит, когда вы ставите метку', how1: ['Для каждого квартала наш сервер запрашивает в открытом каталоге Earth Search сцены Sentinel-2 над вашей точкой, начиная с наименее облачных.', 'Он читает слой классификации сцены (20 м) у метки и пропускает сцены с облаками, тенью или без данных в радиусе 150 м, пробуя до пяти за квартал.', 'Из первой ясной сцены он вырезает снимок в естественных цветах (10 м) вокруг метки шириной 1,28 км: тот же метод, что и спутниковая карточка нашего рентгена проекта.'],
    how2_h: 'Чего он не скажет', how2: ['Готова ли плита, этаж или крыша: один пиксель шириной 10 м.', 'Тот ли участок вы отметили, что указан в договоре. Сверьте свидетельство и координаты с вашим агентом.', 'То, что произошло между двумя снимками и снова оказалось скрыто.'],
    credit: 'Содержит изменённые данные Copernicus Sentinel. Поиск сцен: Element84 Earth Search. Снимки: облачно-оптимизированные GeoTIFF Sentinel-2 L2A в реестре AWS Open Data. API:',
    j: { q: '{n} кв. {y}', look: 'Ищем {n} кварталов над вашей меткой, начиная с последних…', prog: 'Проверено {d} из {n} кварталов, пока ясных: {ok}.', done: 'Ясный снимок у вашей метки есть для {ok} из {n} кварталов. Готово за {s} с.',
      none: 'Ни в одном квартале не было ясного вида на эту точку. В очень облачных местах (сезон дождей в тропиках) так бывает.', rate: 'Слишком много новых точек с вашего подключения за последние минуты. Подождите немного и попробуйте снова; уже созданные снимки загружаются.',
      load: 'Некоторые снимки не удалось создать. Открытый архив или наш сервер может быть занят; попробуйте снова.', parse: 'Вставьте координаты вида -8.6380, 115.1150 или ссылку на карту, которая их содержит.', map: 'Карта не запустилась в этом браузере.',
      wait: 'Проверка…', noimg: 'Сцен нет', fail: 'Поиск не удался', cloud: 'Облака у метки на всех проверенных сценах', clear: '{c}% ясно у метки, облачность сцены {s}%', src: 'исходный снимок', tried: 'проверено сцен: {n}',
      show: 'Показать {q}, {d}', big: 'Sentinel-2 в естественных цветах вокруг вашей метки, {d}', sel: '{c}% ясно в радиусе 150 м от метки. Сцена {id}.', prev: 'Предыдущий квартал', next: 'Следующий квартал', play: 'Воспроизвести', pause: 'Пауза', tryw: 'Попробуйте наблюдаемый район:',
      few: 'Только {n} ясных кварталов: недостаточно для сравнения.', r_none: 'Нет больших изменений яркости или зелёности у метки между началом и концом периода.',
      r_clear: 'Земля у метки стала ярче или менее зелёной: это согласуется с расчисткой, земляными работами или новыми крышами. Это не показывает, на какой стадии здание.', r_green: 'У метки стало зеленее: выросла растительность или сменился сезон. Это не признак стройки.',
      r_other: 'Земля у метки выглядит иначе, чем в начале периода. Посмотрите снимки, чтобы понять почему.', r_how: '(Медиана первых двух и последних двух ясных кварталов, с {a} по {b}: яркость {db}, зелёность {dg}, по шкале от 0 до 255.)',
      lb: 'яркость', lg: 'зелёность', chart: 'У метки, по ясным кварталам: {x}' } },
  zh: {
    title: '从太空看任意地块：2017 年以来的 Sentinel-2', desc: '放置标记、粘贴坐标或 Google 地图链接，即可查看 2017 年以来每个季度一张晴朗的 Sentinel-2 影像，按需从公开档案生成，并可分享延时 GIF。',
    crumb_sat: '卫星观察', crumb: '您的地块', h1: '从太空看任意地块，2017 年以来每季度一张晴朗影像',
    lead: '在您正在付款的地块上放置标记。我们在公开档案中查找该地点的 Sentinel-2 影像，检查标记处的云掩膜，并保留每个季度第一张晴朗的影像，最早可追溯到 2017 年。',
    note_b: '一个像素为 10 米 × 10 米。', note: '您能看到土地清理、平台、道路和大型屋顶。您看不到楼层、墙体或装修；如果云层始终遮挡标记处，某个季度可能缺失。影像不能证明某个付款节点已经达成。',
    h_pin: '1. 放置标记', pin_lead: '点击地图上地块所在的位置，或粘贴坐标或 Google 地图链接。', in_label: '坐标或地图链接', ph: '-8.6380, 115.1150 或地图链接', show: '显示',
    span: '时间范围', y3: '3 年', yall: '自 2017 年', map_aria: '地图。点击在您的地块上放置标记。',
    priv: '您的标记会被取整到约 10 米，仅用于查找和裁剪影像。每张影像按地点在我们的缓存中保留 30 天，以便下次查看同一地点时更快。不会与您关联，也不会保存其他内容。限制：每个连接每 10 分钟最多 240 个新季度。',
    h_res: '2. 卫星看到了什么', st0: '放置标记即可开始。', at_pin: '在您的标记处', read0: '正在等待至少三个晴朗季度。',
    small: '亮度和绿度是真彩色影像中标记处 50 米方块（25 个像素）的平均值。雾霾、太阳角度和季节会让它们略有变化，因此只有较大的变化才有意义。',
    ms: '在付款计划中使用此标记', h_share: '3. 分享延时影像', share_lead: '将晴朗季度制作成动画 GIF，每张影像的日期和 Copernicus 署名都印在图上。它在您的浏览器中生成。链接会在同一标记处打开本页面，只包含坐标。',
    gif: '制作延时 GIF', gif_need: '制作延时影像至少需要两个晴朗季度。',
    making: '正在浏览器中制作 GIF：{p}%', ready: 'GIF 已完成：{n} 张真实影像，{kb} KB。', share: '分享', dl: '下载 GIF', copy: '复制链接', copied: '链接已复制',
    gnote: '在您的浏览器中用上方真实的季度影像制作。不会上传或保存任何内容。', fail: '此浏览器无法制作 GIF。上方的影像仍可查看。',
    h_how: '工作原理', how1_h: '放置标记后会发生什么', how1: ['对于每个季度，我们的服务器向公开目录 Earth Search 查询您所选地点上空的 Sentinel-2 场景，云量最少的优先。', '它读取标记处的场景分类层（20 米），跳过 150 米范围内有云、阴影或无数据的场景，每个季度最多尝试五个。', '从第一个晴朗场景中裁剪标记周围 1.28 公里宽的真彩色影像（10 米），方法与我们项目透视中的卫星卡片相同。'],
    how2_h: '它无法告诉您的事', how2: ['楼板、楼层或屋顶是否完工：一个像素宽 10 米。', '您标记的地块是否就是合同中的地块。请与您的代理核对产权证书和坐标。', '两张影像之间发生又被重新遮盖的事情。'],
    credit: '包含经修改的 Copernicus Sentinel 数据。场景搜索：Element84 Earth Search。影像：AWS 开放数据注册表上的 Sentinel-2 L2A 云优化 GeoTIFF。API：',
    j: { q: '{y}年第{n}季度', look: '正在查找您标记处的 {n} 个季度，从最新开始…', prog: '已检查 {n} 个季度中的 {d} 个，目前 {ok} 个晴朗。', done: '{n} 个季度中有 {ok} 个在您的标记处有晴朗影像。用时 {s} 秒。',
      none: '没有任何季度能清晰看到这个地点。在多云地区（热带雨季）会出现这种情况。', rate: '最近几分钟内您的连接请求了太多新地点。请稍等后重试；已生成的影像仍可加载。',
      load: '部分影像无法生成。公开档案或我们的服务器可能繁忙，请重试。', parse: '请粘贴类似 -8.6380, 115.1150 的坐标或包含坐标的地图链接。', map: '地图无法在此浏览器中启动。',
      wait: '检查中…', noimg: '没有场景', fail: '搜索失败', cloud: '所有已检查场景中标记处都有云', clear: '标记处 {c}% 晴朗，场景云量 {s}%', src: '原始影像', tried: '已检查 {n} 个场景',
      show: '显示 {q}，{d}', big: '您标记周围的 Sentinel-2 真彩色影像，{d}', sel: '标记 150 米范围内 {c}% 晴朗。场景 {id}。', prev: '上一季度', next: '下一季度', play: '播放', pause: '暂停', tryw: '试试一个观察区域：',
      few: '只有 {n} 个晴朗季度：不足以比较。', r_none: '在该时期开始和结束之间，标记处的亮度或绿度没有大的变化。',
      r_clear: '标记处的地面变亮或变得不那么绿：与清理、土方工程或新屋顶相符。它不能显示建筑处于哪个阶段。', r_green: '标记处变得更绿：植被生长或季节变化。这不是施工的迹象。',
      r_other: '标记处的地面与时期开始时看起来不同。请查看影像了解原因。', r_how: '（前两个和后两个晴朗季度的中位数，{a} 至 {b}：亮度 {db}，绿度 {dg}，范围 0 到 255。）',
      lb: '亮度', lg: '绿度', chart: '在标记处，每个晴朗季度：{x}' } },
  ar: {
    title: 'أي قطعة أرض من الفضاء: Sentinel-2 منذ 2017', desc: 'ضع علامة أو الصق إحداثيات أو رابط خرائط Google وشاهد صورة صافية واحدة من Sentinel-2 لكل ربع سنة منذ 2017، تُنشأ عند الطلب من الأرشيف العام، مع ملف GIF متحرك يمكنك مشاركته.',
    crumb_sat: 'المراقبة بالأقمار الصناعية', crumb: 'قطعتك', h1: 'أي قطعة أرض من الفضاء، صورة صافية لكل ربع سنة منذ 2017',
    lead: 'ضع علامة على القطعة التي تدفع ثمنها. نبحث عن صور Sentinel-2 لهذه النقطة في الأرشيف العام، ونتحقق من قناع السحب عند علامتك، ونحتفظ بأول صورة صافية لكل ربع سنة، بدءًا من 2017.',
    note_b: 'البكسل الواحد 10 م × 10 م.', note: 'سترى أرضًا تُمهَّد ومنصات وطرقًا وأسطحًا كبيرة. لن ترى الطوابق أو الجدران أو التشطيبات، وقد يغيب ربع سنة إذا لم تنقشع السحب عن علامتك. الصورة ليست دليلًا على بلوغ مرحلة دفع.',
    h_pin: '1. ضع علامة', pin_lead: 'انقر على الخريطة حيث تقع القطعة، أو الصق إحداثيات أو رابط خرائط Google.', in_label: 'إحداثيات أو رابط خريطة', ph: '-8.6380, 115.1150 أو رابط خريطة', show: 'عرض',
    span: 'المدة', y3: '3 سنوات', yall: 'منذ 2017', map_aria: 'خريطة. انقر لوضع علامة على قطعتك.',
    priv: 'تُقرَّب علامتك إلى نحو 10 م وتُستخدم فقط للعثور على الصور واقتصاصها. تبقى كل صورة في ذاكرتنا المؤقتة 30 يومًا لكل نقطة كي يكون العرض التالي للمكان نفسه سريعًا. لا يُربط أي شيء بك ولا يُخزَّن شيء آخر. الحد: 240 ربع سنة جديدًا كل 10 دقائق لكل اتصال.',
    h_res: '2. ما رآه القمر الصناعي', st0: 'ضع علامة للبدء.', at_pin: 'عند علامتك', read0: 'بانتظار ثلاثة أرباع صافية على الأقل.',
    small: 'السطوع والاخضرار هما متوسط المربع البالغ 50 م عند العلامة (25 بكسل) في صورة الألوان الطبيعية. الضباب وزاوية الشمس والموسم تحركها قليلًا، لذا فالتغيرات الكبيرة وحدها ذات معنى.',
    ms: 'استخدم هذه العلامة في خطة دفع', h_share: '3. شارك الفيلم المتسارع', share_lead: 'حوّل الأرباع الصافية إلى ملف GIF متحرك مع تاريخ كل صورة وإشارة Copernicus مطبوعة عليها. يُنشأ في متصفحك. يفتح الرابط هذه الصفحة على العلامة نفسها ولا يحمل سوى الإحداثيات.',
    gif: 'إنشاء ملف GIF المتسارع', gif_need: 'يلزم ربعا سنة صافيان على الأقل لإنشاء فيلم متسارع.',
    making: 'جارٍ إنشاء ملف GIF في متصفحك: {p}%', ready: 'ملف GIF جاهز: {n} صورة حقيقية، {kb} كيلوبايت.', share: 'مشاركة', dl: 'تنزيل GIF', copy: 'نسخ الرابط', copied: 'تم نسخ الرابط',
    gnote: 'أُنشئ في متصفحك من الصور الفصلية الحقيقية أعلاه. لا يُرفع أي شيء ولا يُخزَّن.', fail: 'تعذّر على هذا المتصفح إنشاء ملف GIF. تبقى الصور أعلاه متاحة.',
    h_how: 'كيف يعمل', how1_h: 'ما يحدث عند وضع علامة', how1: ['لكل ربع سنة، يطلب خادمنا من الفهرس العام Earth Search مشاهد Sentinel-2 فوق نقطتك، الأقل غيومًا أولًا.', 'يقرأ طبقة تصنيف المشهد (20 م) عند علامتك ويتخطى المشاهد التي فيها سحب أو ظلال أو بلا بيانات ضمن 150 م، ويجرب حتى خمسة مشاهد لكل ربع.', 'من أول مشهد صافٍ يقتطع صورة الألوان الطبيعية (10 م) حول العلامة بعرض 1.28 كم: الطريقة نفسها المستخدمة في بطاقة القمر الصناعي ضمن فحص المشروع لدينا.'],
    how2_h: 'ما لا يمكنه إخبارك به', how2: ['ما إذا كانت بلاطة أو طابق أو سقف قد اكتمل: عرض البكسل 10 م.', 'ما إذا كانت القطعة التي حددتها هي القطعة الواردة في عقدك. تحقق من السند والإحداثيات مع وكيلك.', 'ما حدث بين صورتين ثم غُطّي من جديد.'],
    credit: 'يحتوي على بيانات Copernicus Sentinel معدّلة. البحث عن المشاهد: Element84 Earth Search. الصور: ملفات GeoTIFF المحسّنة للسحابة من Sentinel-2 L2A في سجل AWS Open Data. واجهة البرمجة:',
    j: { q: 'الربع {n} {y}', look: 'جارٍ البحث في {n} ربع سنة فوق علامتك، الأحدث أولًا…', prog: 'فُحص {d} من {n} ربع سنة، الصافي حتى الآن {ok}.', done: 'لدى {ok} من {n} ربع سنة صورة صافية عند علامتك. اكتمل في {s} ث.',
      none: 'لم يكن لأي ربع سنة رؤية صافية لهذه النقطة. يحدث هذا في الأماكن كثيرة الغيوم (موسم الأمطار في المناطق المدارية).', rate: 'نقاط جديدة كثيرة من اتصالك في الدقائق الأخيرة. انتظر قليلًا ثم أعد المحاولة؛ الصور المنشأة سابقًا ما زالت تُحمَّل.',
      load: 'تعذّر إنشاء بعض الصور. قد يكون الأرشيف العام أو خادمنا مشغولًا؛ أعد المحاولة.', parse: 'الصق إحداثيات مثل -8.6380, 115.1150 أو رابط خريطة يحتويها.', map: 'تعذّر تشغيل الخريطة في هذا المتصفح.',
      wait: 'جارٍ الفحص…', noimg: 'لا يوجد مشهد', fail: 'فشل البحث', cloud: 'سحب عند العلامة في كل المشاهد المفحوصة', clear: '{c}% صافٍ عند العلامة، غيوم المشهد {s}%', src: 'الصورة الأصلية', tried: 'فُحص {n} مشهد',
      show: 'عرض {q}، {d}', big: 'صورة Sentinel-2 بالألوان الطبيعية حول علامتك، {d}', sel: '{c}% صافٍ ضمن 150 م من العلامة. المشهد {id}.', prev: 'الربع السابق', next: 'الربع التالي', play: 'تشغيل', pause: 'إيقاف مؤقت', tryw: 'جرّب منطقة مراقَبة:',
      few: '{n} أرباع صافية فقط: لا تكفي للمقارنة.', r_none: 'لا تغيّر كبيرًا في السطوع أو الاخضرار عند العلامة بين بداية الفترة ونهايتها.',
      r_clear: 'صارت الأرض عند العلامة أكثر سطوعًا أو أقل اخضرارًا: يتوافق ذلك مع التمهيد أو أعمال الحفر أو أسطح جديدة. لا يبيّن في أي مرحلة وصل المبنى.', r_green: 'صارت العلامة أكثر اخضرارًا: نما الغطاء النباتي أو تغيّر الموسم. ليس هذا دليلًا على البناء.',
      r_other: 'تبدو الأرض عند العلامة مختلفة عن بداية الفترة. انظر إلى الصور لمعرفة السبب.', r_how: '(وسيط أول ربعين وآخر ربعين صافيين، من {a} إلى {b}: السطوع {db}، الاخضرار {dg}، على مقياس من 0 إلى 255.)',
      lb: 'السطوع', lg: 'الاخضرار', chart: 'عند العلامة، لكل ربع صافٍ: {x}' } }
};
const t = (lang, k) => (T[lang] && T[lang][k] != null ? T[lang][k] : T.en[k]);

const ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v6M12 16.5v.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
const AR = d => '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CSS = '<style id="kpl19">.pl19 .pl-share{display:grid;gap:10px;justify-items:start;margin-top:16px}.pl19 .pl-share>.k-btn{min-height:44px}.pl19 .pl-gout:empty{display:none}' +
  '.pl19 .st-seg button{min-height:44px}.pl19 .pl-pl .st-ib{min-width:44px;min-height:44px}[dir=rtl] .pl19 #plprev svg,[dir=rtl] .pl19 #plnext svg{transform:scaleX(-1)}' +
  '.pl19 .pl-frame,.pl19 .pl-chart{direction:ltr}.pl19 .st-can ul{padding:0;padding-inline-start:1.1em}</style>';

function body(lang) {
  const L = k => esc(t(lang, k)), p = pre(lang);
  const li = a => a.map(x => '<li>' + esc(x) + '</li>').join('');
  return '<div class="pl19"><section class="st-hero"><div class="wrap"><p class="crumb"><a href="' + p + '/">Kolaboro</a> / <a href="/satellite/">' + L('crumb_sat') + '</a> / ' + L('crumb') + '</p>' +
    '<h1>' + L('h1') + '</h1><p class="lead">' + L('lead') + '</p>' +
    '<p class="st-note">' + ICON + '<span><b>' + L('note_b') + '</b> ' + L('note') + '</span></p></div></section>' +
    '<section class="st-sec" aria-labelledby="h-pin"><div class="wrap"><h2 id="h-pin">' + L('h_pin') + '</h2><p class="lead">' + L('pin_lead') + '</p>' +
    '<div class="pl-ctl"><form class="pl-q" id="plform"><label for="plin" class="sr-only">' + L('in_label') + '</label><input id="plin" type="text" inputmode="text" autocomplete="off" dir="ltr" placeholder="' + L('ph') + '"><button class="btn btn-hi btn-sm" type="submit">' + L('show') + '</button></form>' +
    '<div class="st-seg" id="plyears" role="group" aria-label="' + L('span') + '"><button type="button" data-y="3" aria-pressed="false">' + L('y3') + '</button><button type="button" data-y="all" aria-pressed="true">' + L('yall') + '</button></div></div>' +
    '<p class="pl-try" id="pltry"></p><div class="pl-map" id="plmap" role="application" aria-label="' + L('map_aria') + '" dir="ltr"></div><p class="pl-err" id="plerr" role="alert" hidden></p>' +
    '<p class="pl-priv">Map &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors (ODbL). ' + L('priv') + '</p></div></section>' +
    '<section class="st-sec" id="result" aria-labelledby="h-res"><div class="wrap"><h2 id="h-res">' + L('h_res') + '</h2><p class="pl-status" id="plstatus" aria-live="polite">' + L('st0') + '</p><div class="pl-bar" aria-hidden="true"><i id="plbar"></i></div>' +
    '<div class="pl-v" id="plv" hidden><div><div class="pl-frame"><canvas id="plbig" width="128" height="128" aria-label=""></canvas><i class="pl-x" aria-hidden="true"></i><span class="pl-cap" id="plcap"></span><span class="pl-scale" aria-hidden="true"><i></i>200 m</span></div>' +
    '<div class="pl-pl"><button type="button" class="st-ib" id="plprev" aria-label="' + esc(t(lang, 'j').prev) + '">' + AR('M12.5 4 6.5 10l6 6') + '</button><button type="button" class="st-ib play" id="plplay" aria-label="' + esc(t(lang, 'j').play) + '" aria-pressed="false"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4l10 6-10 6z" fill="currentColor"/></svg></button><button type="button" class="st-ib" id="plnext" aria-label="' + esc(t(lang, 'j').next) + '">' + AR('M7.5 4l6 6-6 6') + '</button><span id="plsel" class="pl-sel"></span></div></div>' +
    '<div class="pl-side"><h3>' + L('at_pin') + '</h3><p class="pl-read" id="plread">' + L('read0') + '</p><div id="plchart" class="pl-chart"></div><p class="pl-small">' + L('small') + '</p><p><a class="btn btn-line btn-sm" id="plms" href="/milestones/">' + L('ms') + '</a></p></div></div>' +
    '<ol class="pl-grid" id="plgrid" aria-label="' + L('h_res') + '"></ol><p class="pl-small" id="plsrc"></p></div></section>' +
    '<section class="st-sec" aria-labelledby="h-share"><div class="wrap"><h2 id="h-share">' + L('h_share') + '</h2><p class="lead">' + L('share_lead') + '</p>' +
    '<div class="pl-share"><button type="button" class="k-btn k-btn--sm" id="plgif" disabled>' + L('gif') + '</button><p class="pl-small" id="plgifn">' + L('gif_need') + '</p><div class="pl-gout" id="plgout"></div></div></div></section>' +
    '<section class="st-sec" aria-labelledby="h-how"><div class="wrap"><h2 id="h-how">' + L('h_how') + '</h2><div class="st-can"><div><h3>' + L('how1_h') + '</h3><ul>' + li(t(lang, 'how1')) + '</ul></div><div><h3>' + L('how2_h') + '</h3><ul>' + li(t(lang, 'how2')) + '</ul></div></div>' +
    '<p class="pl-small">' + L('credit') + ' <a href="/api/x/g/frame?lat=-8.638&amp;lng=115.115&amp;q=2024-Q2" dir="ltr">/api/x/g/frame</a>. <a href="https://earth-search.aws.element84.com/v1" rel="noopener">Element84 Earth Search</a>. <a href="https://sentinels.copernicus.eu/documents/247904/690755/Sentinel_Data_Legal_Notice" rel="noopener">Copernicus Sentinel data legal notice</a>.</p></div></section></div>';
}

function jsStrings(lang) {
  const o = Object.assign({}, T.en.j, (T[lang] || {}).j || {});
  for (const k of ['making', 'ready', 'share', 'dl', 'copy', 'copied', 'fail']) o['g_' + k] = t(lang, k);
  o.g_note = t(lang, 'gnote'); o.lang = lang; o.locale = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' }[lang] || 'en-GB';
  return o;
}

async function assemble(shellRes, lang) {
  const path = '/satellite/plot/', url = ORIGIN + pre(lang) + path;
  const alts = LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + path + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + path + '">';
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebApplication', '@id': url + '#app', name: t(lang, 'title'), description: t(lang, 'desc'), url, inLanguage: lang, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any (web browser)', isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }, provider: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kolaboro', item: ORIGIN + pre(lang) + '/' }, { '@type': 'ListItem', position: 2, name: t(lang, 'crumb_sat'), item: ORIGIN + '/satellite/' }, { '@type': 'ListItem', position: 3, name: t(lang, 'crumb'), item: url }] }] };
  const tags = '<title>' + esc(t(lang, 'title')) + ' | Kolaboro</title><meta name="description" content="' + esc(t(lang, 'desc')) + '"><link rel="canonical" href="' + url + '">' + alts +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="Kolaboro"><meta property="og:title" content="' + esc(t(lang, 'title')) + ' | Kolaboro"><meta property="og:description" content="' + esc(t(lang, 'desc')) + '"><meta property="og:url" content="' + url + '"><meta property="og:image" content="' + ORIGIN + '/k/og/pricing.png"><meta name="twitter:card" content="summary_large_image">' +
    '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' +
    '<link rel="stylesheet" href="/satellite/sat.css?v=6ff435225d"><link rel="stylesheet" href="/satellite/plot/vendor/leaflet-1.9.4.css"><link rel="stylesheet" href="/satellite/plot/plot.css?v=a23d55414b">' + CSS;
  const tail = '<script type="application/json" id="kpl-t">' + JSON.stringify(jsStrings(lang)).replace(/</g, '\\u003c') + '</script>' +
    '<script src="/satellite/plot/vendor/leaflet-1.9.4.js" defer></script><script src="/satellite/plot/plot-core.js?v=30c85a4e23" defer></script><script src="/satellite/plot/plot.js?v=' + V + '" defer></script>';
  const res = new HTMLRewriter()
    .on('title', { element(e) { e.remove(); } })
    .on('meta[name="description"],meta[name="robots"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],link[rel="alternate"][hreflang]', { element(e) { e.remove(); } })
    .on('script[type="application/ld+json"]', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(body(lang) + tail, { html: true }); } })
    .on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + path); } })
    .transform(new Response(shellRes.body, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
  return await res.text();
}

export async function handle(req, u, env, ctx, shell) {
  const m = u.pathname.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?satellite\/plot(\/?)$/); if (!m || !shell) return null;
  if (!m[2]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
  const lang = m[1] || 'en';
  try {
    const sh = await shell(pre(lang) + '/how-we-score/');
    if (!sh || sh.status !== 200) return null;
    return new Response(await assemble(sh, lang), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600' } });
  } catch (e) { return null; }
}
export { T as PLOT_T };
