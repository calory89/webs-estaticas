// kolaboro.com batch 17 (agent n17d, 8 Nov 2026): permit photo reader.
//   GET /tools/permit-photo/   /<lang>/tools/permit-photo/   (en es de fr nl ru zh ar; Arabic right to left)
// The buyer photographs a permit, licence or company certificate. Text recognition runs in the browser (tesseract.js 5.1.1, WASM,
// pinned on cdn.jsdelivr.net; language data loaded on demand). Candidate register numbers are found with per-market patterns
// (and check digits where the format has one). One tap sends ONLY the chosen number to the existing register lookup
// (/api/kb/lookup in kbx_lookup.js, or /api/x/h/lookup for the Australian ABN). The image and the recognised text never leave the
// device; nothing is stored. No paid AI anywhere: every word on the page is a template below.
// Page shell: /<lang>/how-we-score/ (header, footer, language switcher), the same pattern as kbx_net.js.
const ORIGIN = 'https://kolaboro.com';
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?tools\/permit-photo\/?$/;
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const PATH = '/tools/permit-photo/';
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pre = l => l === 'en' ? '' : '/' + l;
const TJS = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';

// ------------------------------------------------------------------------------------------------ strings
const S = {
  en: {
    title: 'Permit photo reader', desc: 'Photograph a permit, licence or company certificate. Your browser reads it, finds the register numbers and looks one up in the official register with one tap. The photo never leaves your device.',
    crumb_tools: 'Tools', h1: 'Read a permit photo, then check its numbers in the register',
    lead: 'Photograph a building licence, permit or company certificate. Your browser reads the text and finds the numbers official registers use. You choose which one to look up.',
    priv_b: 'The photo stays on this device.', priv: 'Text recognition runs in your browser with Tesseract, an open-source reader. We never receive the image or the text, and nothing is stored. Only a number you choose to look up is sent, to our register lookup. Site analytics are masked on this page.',
    pick: 'Choose a photo', cam: 'Take a photo', drop: 'Drop a photo here', drop_help: 'JPG, PNG or WebP. A sharp, straight, well-lit photo reads best.',
    lang_l: 'Language on the document', lang_help: 'English is always included. The reader (about 4 MB) and each language (1 to 3 MB) download once from jsDelivr, then your browser keeps them.',
    read: 'Read the photo', samples: 'No document at hand? Try a sample we made:',
    s_es: 'Spain', s_uk: 'United Kingdom', s_au: 'Australia', s_id: 'Indonesia',
    sample_note: 'Samples are text cards drawn by this page, not real documents. The Spanish cadastral reference, the UK company number (Tesco PLC) and the Australian ABN (Australian Taxation Office) are real public records. The Indonesian numbers are made up.',
    st_load: 'Loading the reader', st_lang: 'Loading language data', st_read: 'Reading the text', st_done: 'Done. Numbers found: {n}.', st_none: 'No register numbers found. Check the text below, correct it if needed, and search again.',
    st_err: 'The reader could not start ({e}). Try again, or type the number into the text box.', st_img: 'This file could not be opened as an image.',
    found_h: 'Numbers found', found_help: 'Each box on the photo matches a number in this list. These are pattern matches: compare each number with your document before you rely on it.',
    text_h: 'Text read from the photo', text_help: 'Correct mistakes here, or type a number yourself. Nothing you type is sent until you press a lookup button.', again: 'Find numbers again',
    lookup: 'Look up in the register', open: 'Open the official site', manual: 'No public lookup we can query. Check by hand:', ask: 'There is no national online register for this. Ask {who}.',
    ck_ok: 'Check digit valid', ck_bad: 'Check digit does not match. Likely a reading error or a wrong number.', fmt: 'Format matches', looking: 'Looking up',
    r_found: 'Found', r_not_found: 'Not found', r_not_published: 'Not published', r_needs_key: 'Not connected yet', r_unavailable: 'Did not answer',
    raw: 'Exact response', sealed: 'Sealed result', rate: 'Hourly limit reached (20 lookups an hour). Try again later.', lk_err: 'The lookup failed. Try again.',
    nf_note: 'A not found or not published result is not proof of a problem. A found result is not proof the project is sound.', sent: 'Sent: the number only.',
    how_h: 'Which numbers we recognise', th_mk: 'Market', th_no: 'Number', th_do: 'What one tap does',
    act_live: 'Live lookup: {reg}', act_key: 'Register lookup (data feed key pending) and the official status page', act_man: 'Link to {reg}', act_ask: 'Tells you who to ask',
    lim_h: 'Limits', lim1: 'Text recognition makes mistakes, mostly with 0 and O, 1 and I, 5 and S. Compare each number with the document.',
    lim2: 'A number found in the register proves only that the record exists. Check that the name, address and dates there match your document.',
    lim3: 'A licence for the building is not a title to the land, and neither proves the developer can sell to you.', lim4: 'Handwriting, stamps over the text and photos taken at an angle read poorly.',
    cr_h: 'Credits and licences', cr: 'Text recognition: tesseract.js 5.1.1 and Tesseract OCR, Apache License 2.0. Language data: tessdata 4.0.0_best_int, Apache License 2.0. Files served by jsDelivr.',
    rel: 'Related tools', rel_qr: 'Permit QR check', rel_agent: 'Is this agent licensed?', rel_reg: 'Official registers',
    who_town: 'the town hall (ayuntamiento) that issued the licence', who_notary: 'a notary (PPAT) or the local land office (Kantor Pertanahan)',
    m: { ES: 'Spain', GB: 'United Kingdom', NYC: 'USA, New York City', MD: 'USA, Miami-Dade', AE: 'Dubai', ID: 'Indonesia', TH: 'Thailand', AU: 'Australia', WW: 'Worldwide' },
    p: { es_refcat: 'Cadastral reference (referencia catastral)', es_lic: 'Building licence (licencia de obras)', es_cif: 'Company tax ID (CIF)', gb_co: 'Company number', us_dobnow: 'DOB NOW job number', us_bis: 'DOB job number', us_md: 'Building permit number',
      ae_proj: 'DLD / RERA project number', ae_oqood: 'Oqood (interim registration) number', ae_permit: 'Trakheesi / Madmoun ad permit', ae_brn: 'Broker (BRN) or office (ORN) number',
      id_nib: 'NIB business number', id_pbg: 'PBG building approval', id_title: 'Land certificate (SHM, HGB, HGU, Hak Pakai)', th_eia: 'ONEP EIA letter number', th_condo: 'Condominium registration number', au_abn: 'ABN', lei: 'LEI (legal entity identifier)' }
  },
  es: {
    title: 'Lector de fotos de licencias', desc: 'Haz una foto de una licencia, permiso o certificado de empresa. Tu navegador la lee, encuentra los números de registro y consulta uno en el registro oficial con un toque. La foto nunca sale de tu dispositivo.',
    crumb_tools: 'Herramientas', h1: 'Lee la foto de una licencia y comprueba sus números en el registro',
    lead: 'Fotografía una licencia de obras, un permiso o un certificado de empresa. Tu navegador lee el texto y encuentra los números que usan los registros oficiales. Tú eliges cuál consultar.',
    priv_b: 'La foto se queda en este dispositivo.', priv: 'El reconocimiento de texto se hace en tu navegador con Tesseract, un lector de código abierto. Nunca recibimos la imagen ni el texto, y no se guarda nada. Solo se envía el número que elijas consultar, a nuestra consulta de registros. La analítica del sitio está enmascarada en esta página.',
    pick: 'Elegir una foto', cam: 'Hacer una foto', drop: 'Suelta una foto aquí', drop_help: 'JPG, PNG o WebP. Una foto nítida, recta y con buena luz se lee mejor.',
    lang_l: 'Idioma del documento', lang_help: 'El inglés se incluye siempre. El lector (unos 4 MB) y cada idioma (de 1 a 3 MB) se descargan una vez desde jsDelivr y luego tu navegador los guarda.',
    read: 'Leer la foto', samples: '¿No tienes un documento a mano? Prueba un ejemplo que hemos hecho:',
    s_es: 'España', s_uk: 'Reino Unido', s_au: 'Australia', s_id: 'Indonesia',
    sample_note: 'Los ejemplos son tarjetas de texto dibujadas por esta página, no documentos reales. La referencia catastral española, el número de empresa británico (Tesco PLC) y el ABN australiano (Australian Taxation Office) son registros públicos reales. Los números indonesios son inventados.',
    st_load: 'Cargando el lector', st_lang: 'Cargando datos del idioma', st_read: 'Leyendo el texto', st_done: 'Listo. Números encontrados: {n}.', st_none: 'No se han encontrado números de registro. Revisa el texto de abajo, corrígelo si hace falta y busca de nuevo.',
    st_err: 'El lector no ha podido arrancar ({e}). Inténtalo otra vez o escribe el número en el cuadro de texto.', st_img: 'Este archivo no se puede abrir como imagen.',
    found_h: 'Números encontrados', found_help: 'Cada recuadro de la foto corresponde a un número de esta lista. Son coincidencias de formato: compara cada número con tu documento antes de fiarte.',
    text_h: 'Texto leído de la foto', text_help: 'Corrige aquí los errores o escribe tú un número. No se envía nada de lo que escribas hasta que pulses un botón de consulta.', again: 'Buscar números de nuevo',
    lookup: 'Consultar en el registro', open: 'Abrir la web oficial', manual: 'No hay una consulta pública que podamos usar. Compruébalo a mano:', ask: 'No hay un registro nacional en línea para esto. Pregunta en {who}.',
    ck_ok: 'Dígito de control válido', ck_bad: 'El dígito de control no coincide. Probablemente es un error de lectura o un número equivocado.', fmt: 'El formato coincide', looking: 'Consultando',
    r_found: 'Encontrado', r_not_found: 'No encontrado', r_not_published: 'No publicado', r_needs_key: 'Aún no conectado', r_unavailable: 'No ha respondido',
    raw: 'Respuesta exacta', sealed: 'Resultado sellado', rate: 'Límite por hora alcanzado (20 consultas por hora). Inténtalo más tarde.', lk_err: 'La consulta ha fallado. Inténtalo otra vez.',
    nf_note: 'Un resultado no encontrado o no publicado no prueba que haya un problema. Un resultado encontrado no prueba que el proyecto sea sólido.', sent: 'Enviado: solo el número.',
    how_h: 'Qué números reconocemos', th_mk: 'Mercado', th_no: 'Número', th_do: 'Qué hace un toque',
    act_live: 'Consulta en directo: {reg}', act_key: 'Consulta de registro (clave del servicio de datos pendiente) y la página oficial de estado', act_man: 'Enlace a {reg}', act_ask: 'Te dice a quién preguntar',
    lim_h: 'Límites', lim1: 'El reconocimiento de texto se equivoca, sobre todo con 0 y O, 1 e I, 5 y S. Compara cada número con el documento.',
    lim2: 'Que un número aparezca en el registro solo prueba que el registro existe. Comprueba que el nombre, la dirección y las fechas coinciden con tu documento.',
    lim3: 'Una licencia para el edificio no es un título sobre el terreno, y ninguna de las dos prueba que el promotor pueda venderte.', lim4: 'La letra a mano, los sellos sobre el texto y las fotos inclinadas se leen mal.',
    cr_h: 'Créditos y licencias', cr: 'Reconocimiento de texto: tesseract.js 5.1.1 y Tesseract OCR, Apache License 2.0. Datos de idioma: tessdata 4.0.0_best_int, Apache License 2.0. Archivos servidos por jsDelivr.',
    rel: 'Herramientas relacionadas', rel_qr: 'Comprobar el QR de una licencia', rel_agent: '¿Tiene licencia este agente?', rel_reg: 'Registros oficiales',
    who_town: 'el ayuntamiento que concedió la licencia', who_notary: 'un notario (PPAT) o la oficina de tierras local (Kantor Pertanahan)',
    m: { ES: 'España', GB: 'Reino Unido', NYC: 'EE. UU., Nueva York', MD: 'EE. UU., Miami-Dade', AE: 'Dubái', ID: 'Indonesia', TH: 'Tailandia', AU: 'Australia', WW: 'Todo el mundo' },
    p: { es_refcat: 'Referencia catastral', es_lic: 'Licencia de obras', es_cif: 'CIF de la empresa', gb_co: 'Número de empresa', us_dobnow: 'Número de expediente DOB NOW', us_bis: 'Número de expediente DOB', us_md: 'Número de permiso de obra',
      ae_proj: 'Número de proyecto DLD / RERA', ae_oqood: 'Número de Oqood (registro provisional)', ae_permit: 'Permiso de anuncio Trakheesi / Madmoun', ae_brn: 'Número de agente (BRN) u oficina (ORN)',
      id_nib: 'Número de empresa NIB', id_pbg: 'Licencia de obra PBG', id_title: 'Certificado de tierra (SHM, HGB, HGU, Hak Pakai)', th_eia: 'Número de oficio EIA de la ONEP', th_condo: 'Número de registro de condominio', au_abn: 'ABN', lei: 'LEI (identificador de entidad jurídica)' }
  },
  de: {
    title: 'Genehmigungsfoto lesen', desc: 'Fotografieren Sie eine Genehmigung, Lizenz oder Firmenurkunde. Ihr Browser liest sie, findet die Registernummern und prüft eine davon mit einem Tipp im amtlichen Register. Das Foto verlässt Ihr Gerät nie.',
    crumb_tools: 'Werkzeuge', h1: 'Ein Genehmigungsfoto lesen und seine Nummern im Register prüfen',
    lead: 'Fotografieren Sie eine Baugenehmigung, Lizenz oder Firmenurkunde. Ihr Browser liest den Text und findet die Nummern, die amtliche Register verwenden. Sie wählen, welche geprüft wird.',
    priv_b: 'Das Foto bleibt auf diesem Gerät.', priv: 'Die Texterkennung läuft in Ihrem Browser mit Tesseract, einem Open-Source-Leser. Wir erhalten weder das Bild noch den Text, und nichts wird gespeichert. Gesendet wird nur eine Nummer, die Sie prüfen lassen, an unsere Registerabfrage. Die Webanalyse ist auf dieser Seite maskiert.',
    pick: 'Foto auswählen', cam: 'Foto aufnehmen', drop: 'Foto hier ablegen', drop_help: 'JPG, PNG oder WebP. Ein scharfes, gerades, gut beleuchtetes Foto liest sich am besten.',
    lang_l: 'Sprache des Dokuments', lang_help: 'Englisch ist immer dabei. Der Leser (etwa 4 MB) und jede Sprache (1 bis 3 MB) werden einmal von jsDelivr geladen, danach behält Ihr Browser sie.',
    read: 'Foto lesen', samples: 'Kein Dokument zur Hand? Probieren Sie ein Beispiel von uns:',
    s_es: 'Spanien', s_uk: 'Vereinigtes Königreich', s_au: 'Australien', s_id: 'Indonesien',
    sample_note: 'Die Beispiele sind Textkarten, die diese Seite zeichnet, keine echten Dokumente. Die spanische Katasterreferenz, die britische Firmennummer (Tesco PLC) und die australische ABN (Australian Taxation Office) sind echte öffentliche Einträge. Die indonesischen Nummern sind erfunden.',
    st_load: 'Leser wird geladen', st_lang: 'Sprachdaten werden geladen', st_read: 'Text wird gelesen', st_done: 'Fertig. Gefundene Nummern: {n}.', st_none: 'Keine Registernummern gefunden. Prüfen Sie den Text unten, korrigieren Sie ihn bei Bedarf und suchen Sie erneut.',
    st_err: 'Der Leser konnte nicht starten ({e}). Versuchen Sie es erneut oder tippen Sie die Nummer in das Textfeld.', st_img: 'Diese Datei lässt sich nicht als Bild öffnen.',
    found_h: 'Gefundene Nummern', found_help: 'Jeder Rahmen auf dem Foto gehört zu einer Nummer in dieser Liste. Es sind Musterübereinstimmungen: Vergleichen Sie jede Nummer mit Ihrem Dokument, bevor Sie sich darauf verlassen.',
    text_h: 'Aus dem Foto gelesener Text', text_help: 'Korrigieren Sie hier Fehler oder tippen Sie selbst eine Nummer. Nichts davon wird gesendet, bevor Sie eine Abfrage starten.', again: 'Nummern erneut suchen',
    lookup: 'Im Register prüfen', open: 'Amtliche Website öffnen', manual: 'Keine öffentliche Abfrage, die wir nutzen können. Von Hand prüfen:', ask: 'Dafür gibt es kein landesweites Online-Register. Fragen Sie {who}.',
    ck_ok: 'Prüfziffer gültig', ck_bad: 'Prüfziffer passt nicht. Wahrscheinlich ein Lesefehler oder eine falsche Nummer.', fmt: 'Format passt', looking: 'Wird geprüft',
    r_found: 'Gefunden', r_not_found: 'Nicht gefunden', r_not_published: 'Nicht veröffentlicht', r_needs_key: 'Noch nicht angebunden', r_unavailable: 'Keine Antwort',
    raw: 'Genaue Antwort', sealed: 'Versiegeltes Ergebnis', rate: 'Stundenlimit erreicht (20 Abfragen pro Stunde). Später erneut versuchen.', lk_err: 'Die Abfrage ist fehlgeschlagen. Erneut versuchen.',
    nf_note: 'Nicht gefunden oder nicht veröffentlicht beweist kein Problem. Gefunden beweist nicht, dass das Projekt solide ist.', sent: 'Gesendet: nur die Nummer.',
    how_h: 'Welche Nummern wir erkennen', th_mk: 'Markt', th_no: 'Nummer', th_do: 'Was ein Tipp bewirkt',
    act_live: 'Live-Abfrage: {reg}', act_key: 'Registerabfrage (Schlüssel für den Datendienst ausstehend) und die amtliche Statusseite', act_man: 'Link zu {reg}', act_ask: 'Sagt Ihnen, wen Sie fragen',
    lim_h: 'Grenzen', lim1: 'Texterkennung macht Fehler, vor allem bei 0 und O, 1 und I, 5 und S. Vergleichen Sie jede Nummer mit dem Dokument.',
    lim2: 'Eine Nummer im Register beweist nur, dass der Eintrag existiert. Prüfen Sie, ob Name, Adresse und Daten dort zu Ihrem Dokument passen.',
    lim3: 'Eine Genehmigung für das Gebäude ist kein Titel am Grundstück, und keines von beiden beweist, dass der Bauträger an Sie verkaufen darf.', lim4: 'Handschrift, Stempel über dem Text und schräg aufgenommene Fotos lesen sich schlecht.',
    cr_h: 'Quellen und Lizenzen', cr: 'Texterkennung: tesseract.js 5.1.1 und Tesseract OCR, Apache License 2.0. Sprachdaten: tessdata 4.0.0_best_int, Apache License 2.0. Dateien über jsDelivr.',
    rel: 'Verwandte Werkzeuge', rel_qr: 'QR-Code einer Genehmigung prüfen', rel_agent: 'Ist dieser Makler lizenziert?', rel_reg: 'Amtliche Register',
    who_town: 'das Rathaus (ayuntamiento), das die Genehmigung erteilt hat', who_notary: 'einen Notar (PPAT) oder das örtliche Grundbuchamt (Kantor Pertanahan)',
    m: { ES: 'Spanien', GB: 'Vereinigtes Königreich', NYC: 'USA, New York City', MD: 'USA, Miami-Dade', AE: 'Dubai', ID: 'Indonesien', TH: 'Thailand', AU: 'Australien', WW: 'Weltweit' },
    p: { es_refcat: 'Katasterreferenz (referencia catastral)', es_lic: 'Baugenehmigung (licencia de obras)', es_cif: 'Steuernummer der Firma (CIF)', gb_co: 'Firmennummer', us_dobnow: 'DOB-NOW-Vorgangsnummer', us_bis: 'DOB-Vorgangsnummer', us_md: 'Baugenehmigungsnummer',
      ae_proj: 'DLD-/RERA-Projektnummer', ae_oqood: 'Oqood-Nummer (vorläufige Registrierung)', ae_permit: 'Trakheesi-/Madmoun-Anzeigengenehmigung', ae_brn: 'Makler- (BRN) oder Büronummer (ORN)',
      id_nib: 'NIB-Unternehmensnummer', id_pbg: 'PBG-Baugenehmigung', id_title: 'Landzertifikat (SHM, HGB, HGU, Hak Pakai)', th_eia: 'ONEP-UVP-Aktenzeichen', th_condo: 'Eigentumswohnungs-Registernummer', au_abn: 'ABN', lei: 'LEI (Rechtsträgerkennung)' }
  },
  fr: {
    title: 'Lecteur de photo de permis', desc: 'Photographiez un permis, une licence ou un certificat de société. Votre navigateur le lit, trouve les numéros de registre et en vérifie un dans le registre officiel en un geste. La photo ne quitte jamais votre appareil.',
    crumb_tools: 'Outils', h1: 'Lire la photo d’un permis, puis vérifier ses numéros dans le registre',
    lead: 'Photographiez un permis de construire, une licence ou un certificat de société. Votre navigateur lit le texte et trouve les numéros utilisés par les registres officiels. Vous choisissez lequel vérifier.',
    priv_b: 'La photo reste sur cet appareil.', priv: 'La reconnaissance de texte se fait dans votre navigateur avec Tesseract, un lecteur open source. Nous ne recevons ni l’image ni le texte, et rien n’est conservé. Seul le numéro que vous choisissez de vérifier est envoyé, à notre recherche dans les registres. L’analyse d’audience est masquée sur cette page.',
    pick: 'Choisir une photo', cam: 'Prendre une photo', drop: 'Déposez une photo ici', drop_help: 'JPG, PNG ou WebP. Une photo nette, droite et bien éclairée se lit mieux.',
    lang_l: 'Langue du document', lang_help: 'L’anglais est toujours inclus. Le lecteur (environ 4 Mo) et chaque langue (1 à 3 Mo) se téléchargent une fois depuis jsDelivr, puis votre navigateur les garde.',
    read: 'Lire la photo', samples: 'Pas de document sous la main ? Essayez un exemple que nous avons fait :',
    s_es: 'Espagne', s_uk: 'Royaume-Uni', s_au: 'Australie', s_id: 'Indonésie',
    sample_note: 'Les exemples sont des cartes de texte dessinées par cette page, pas de vrais documents. La référence cadastrale espagnole, le numéro de société britannique (Tesco PLC) et l’ABN australien (Australian Taxation Office) sont de vrais registres publics. Les numéros indonésiens sont inventés.',
    st_load: 'Chargement du lecteur', st_lang: 'Chargement des données de langue', st_read: 'Lecture du texte', st_done: 'Terminé. Numéros trouvés : {n}.', st_none: 'Aucun numéro de registre trouvé. Vérifiez le texte ci-dessous, corrigez-le si besoin et relancez la recherche.',
    st_err: 'Le lecteur n’a pas pu démarrer ({e}). Réessayez ou tapez le numéro dans la zone de texte.', st_img: 'Ce fichier ne peut pas être ouvert comme image.',
    found_h: 'Numéros trouvés', found_help: 'Chaque cadre sur la photo correspond à un numéro de cette liste. Ce sont des correspondances de format : comparez chaque numéro avec votre document avant de vous y fier.',
    text_h: 'Texte lu sur la photo', text_help: 'Corrigez les erreurs ici ou tapez vous-même un numéro. Rien n’est envoyé tant que vous n’appuyez pas sur un bouton de vérification.', again: 'Chercher à nouveau',
    lookup: 'Vérifier dans le registre', open: 'Ouvrir le site officiel', manual: 'Pas de recherche publique que nous puissions interroger. Vérifiez à la main :', ask: 'Il n’existe pas de registre national en ligne pour cela. Demandez à {who}.',
    ck_ok: 'Chiffre de contrôle valide', ck_bad: 'Le chiffre de contrôle ne correspond pas. Probablement une erreur de lecture ou un mauvais numéro.', fmt: 'Le format correspond', looking: 'Vérification',
    r_found: 'Trouvé', r_not_found: 'Introuvable', r_not_published: 'Non publié', r_needs_key: 'Pas encore connecté', r_unavailable: 'Pas de réponse',
    raw: 'Réponse exacte', sealed: 'Résultat scellé', rate: 'Limite horaire atteinte (20 recherches par heure). Réessayez plus tard.', lk_err: 'La recherche a échoué. Réessayez.',
    nf_note: 'Un résultat introuvable ou non publié ne prouve pas un problème. Un résultat trouvé ne prouve pas que le projet est solide.', sent: 'Envoyé : le numéro seulement.',
    how_h: 'Les numéros que nous reconnaissons', th_mk: 'Marché', th_no: 'Numéro', th_do: 'Ce que fait un geste',
    act_live: 'Recherche en direct : {reg}', act_key: 'Recherche dans le registre (clé du service de données en attente) et la page officielle de statut', act_man: 'Lien vers {reg}', act_ask: 'Vous dit à qui demander',
    lim_h: 'Limites', lim1: 'La reconnaissance de texte se trompe, surtout entre 0 et O, 1 et I, 5 et S. Comparez chaque numéro avec le document.',
    lim2: 'Un numéro trouvé dans le registre prouve seulement que l’inscription existe. Vérifiez que le nom, l’adresse et les dates correspondent à votre document.',
    lim3: 'Un permis pour le bâtiment n’est pas un titre sur le terrain, et aucun des deux ne prouve que le promoteur peut vous vendre.', lim4: 'L’écriture manuscrite, les tampons sur le texte et les photos prises de biais se lisent mal.',
    cr_h: 'Crédits et licences', cr: 'Reconnaissance de texte : tesseract.js 5.1.1 et Tesseract OCR, Apache License 2.0. Données de langue : tessdata 4.0.0_best_int, Apache License 2.0. Fichiers servis par jsDelivr.',
    rel: 'Outils liés', rel_qr: 'Vérifier le QR d’un permis', rel_agent: 'Cet agent a-t-il une licence ?', rel_reg: 'Registres officiels',
    who_town: 'la mairie (ayuntamiento) qui a délivré le permis', who_notary: 'un notaire (PPAT) ou le bureau foncier local (Kantor Pertanahan)',
    m: { ES: 'Espagne', GB: 'Royaume-Uni', NYC: 'États-Unis, New York', MD: 'États-Unis, Miami-Dade', AE: 'Dubaï', ID: 'Indonésie', TH: 'Thaïlande', AU: 'Australie', WW: 'Monde' },
    p: { es_refcat: 'Référence cadastrale (referencia catastral)', es_lic: 'Permis de construire (licencia de obras)', es_cif: 'Identifiant fiscal de la société (CIF)', gb_co: 'Numéro de société', us_dobnow: 'Numéro de dossier DOB NOW', us_bis: 'Numéro de dossier DOB', us_md: 'Numéro de permis de construire',
      ae_proj: 'Numéro de projet DLD / RERA', ae_oqood: 'Numéro Oqood (enregistrement provisoire)', ae_permit: 'Permis d’annonce Trakheesi / Madmoun', ae_brn: 'Numéro d’agent (BRN) ou d’agence (ORN)',
      id_nib: 'Numéro d’entreprise NIB', id_pbg: 'Autorisation de construire PBG', id_title: 'Certificat foncier (SHM, HGB, HGU, Hak Pakai)', th_eia: 'Numéro de courrier EIE de l’ONEP', th_condo: 'Numéro d’enregistrement de copropriété', au_abn: 'ABN', lei: 'LEI (identifiant d’entité juridique)' }
  },
  nl: {
    title: 'Vergunningfoto lezen', desc: 'Fotografeer een vergunning, licentie of bedrijfsuittreksel. Je browser leest het, vindt de registernummers en zoekt er met één tik een op in het officiële register. De foto verlaat je apparaat nooit.',
    crumb_tools: 'Hulpmiddelen', h1: 'Lees een vergunningfoto en controleer de nummers in het register',
    lead: 'Fotografeer een bouwvergunning, licentie of bedrijfsuittreksel. Je browser leest de tekst en vindt de nummers die officiële registers gebruiken. Jij kiest welk nummer wordt opgezocht.',
    priv_b: 'De foto blijft op dit apparaat.', priv: 'Tekstherkenning draait in je browser met Tesseract, een opensource-lezer. Wij ontvangen de afbeelding en de tekst nooit, en er wordt niets bewaard. Alleen een nummer dat jij kiest wordt verstuurd, naar onze registerzoekopdracht. Analytics zijn op deze pagina gemaskeerd.',
    pick: 'Kies een foto', cam: 'Maak een foto', drop: 'Sleep een foto hierheen', drop_help: 'JPG, PNG of WebP. Een scherpe, rechte, goed belichte foto leest het best.',
    lang_l: 'Taal van het document', lang_help: 'Engels zit er altijd bij. De lezer (ongeveer 4 MB) en elke taal (1 tot 3 MB) worden één keer van jsDelivr geladen; daarna bewaart je browser ze.',
    read: 'Lees de foto', samples: 'Geen document bij de hand? Probeer een voorbeeld van ons:',
    s_es: 'Spanje', s_uk: 'Verenigd Koninkrijk', s_au: 'Australië', s_id: 'Indonesië',
    sample_note: 'De voorbeelden zijn tekstkaarten die deze pagina tekent, geen echte documenten. De Spaanse kadastrale referentie, het Britse bedrijfsnummer (Tesco PLC) en het Australische ABN (Australian Taxation Office) zijn echte openbare gegevens. De Indonesische nummers zijn verzonnen.',
    st_load: 'Lezer laden', st_lang: 'Taalgegevens laden', st_read: 'Tekst lezen', st_done: 'Klaar. Gevonden nummers: {n}.', st_none: 'Geen registernummers gevonden. Controleer de tekst hieronder, verbeter hem zo nodig en zoek opnieuw.',
    st_err: 'De lezer kon niet starten ({e}). Probeer het opnieuw of typ het nummer in het tekstvak.', st_img: 'Dit bestand kan niet als afbeelding worden geopend.',
    found_h: 'Gevonden nummers', found_help: 'Elk kader op de foto hoort bij een nummer in deze lijst. Het zijn patroonovereenkomsten: vergelijk elk nummer met je document voordat je erop vertrouwt.',
    text_h: 'Tekst gelezen van de foto', text_help: 'Verbeter hier fouten of typ zelf een nummer. Er wordt niets verstuurd tot je op een opzoekknop drukt.', again: 'Opnieuw nummers zoeken',
    lookup: 'Opzoeken in het register', open: 'Open de officiële site', manual: 'Geen openbare zoekfunctie die wij kunnen bevragen. Controleer met de hand:', ask: 'Hiervoor bestaat geen landelijk online register. Vraag het aan {who}.',
    ck_ok: 'Controlecijfer klopt', ck_bad: 'Controlecijfer klopt niet. Waarschijnlijk een leesfout of een verkeerd nummer.', fmt: 'Formaat klopt', looking: 'Bezig met opzoeken',
    r_found: 'Gevonden', r_not_found: 'Niet gevonden', r_not_published: 'Niet gepubliceerd', r_needs_key: 'Nog niet gekoppeld', r_unavailable: 'Geen antwoord',
    raw: 'Exact antwoord', sealed: 'Verzegeld resultaat', rate: 'Uurlimiet bereikt (20 zoekopdrachten per uur). Probeer het later opnieuw.', lk_err: 'Opzoeken mislukt. Probeer het opnieuw.',
    nf_note: 'Niet gevonden of niet gepubliceerd bewijst geen probleem. Gevonden bewijst niet dat het project degelijk is.', sent: 'Verstuurd: alleen het nummer.',
    how_h: 'Welke nummers we herkennen', th_mk: 'Markt', th_no: 'Nummer', th_do: 'Wat één tik doet',
    act_live: 'Live opzoeken: {reg}', act_key: 'Registerzoekopdracht (sleutel voor de datadienst volgt) en de officiële statuspagina', act_man: 'Link naar {reg}', act_ask: 'Zegt je wie je moet vragen',
    lim_h: 'Beperkingen', lim1: 'Tekstherkenning maakt fouten, vooral met 0 en O, 1 en I, 5 en S. Vergelijk elk nummer met het document.',
    lim2: 'Een nummer in het register bewijst alleen dat de inschrijving bestaat. Controleer of naam, adres en data daar overeenkomen met je document.',
    lim3: 'Een vergunning voor het gebouw is geen eigendomstitel op de grond, en geen van beide bewijst dat de ontwikkelaar aan jou mag verkopen.', lim4: 'Handschrift, stempels over de tekst en schuin genomen foto’s lezen slecht.',
    cr_h: 'Bronnen en licenties', cr: 'Tekstherkenning: tesseract.js 5.1.1 en Tesseract OCR, Apache License 2.0. Taalgegevens: tessdata 4.0.0_best_int, Apache License 2.0. Bestanden via jsDelivr.',
    rel: 'Verwante hulpmiddelen', rel_qr: 'QR-code van een vergunning controleren', rel_agent: 'Heeft deze makelaar een vergunning?', rel_reg: 'Officiële registers',
    who_town: 'het gemeentehuis (ayuntamiento) dat de vergunning gaf', who_notary: 'een notaris (PPAT) of het plaatselijke kadasterkantoor (Kantor Pertanahan)',
    m: { ES: 'Spanje', GB: 'Verenigd Koninkrijk', NYC: 'VS, New York City', MD: 'VS, Miami-Dade', AE: 'Dubai', ID: 'Indonesië', TH: 'Thailand', AU: 'Australië', WW: 'Wereldwijd' },
    p: { es_refcat: 'Kadastrale referentie (referencia catastral)', es_lic: 'Bouwvergunning (licencia de obras)', es_cif: 'Fiscaal nummer van het bedrijf (CIF)', gb_co: 'Bedrijfsnummer', us_dobnow: 'DOB NOW-dossiernummer', us_bis: 'DOB-dossiernummer', us_md: 'Bouwvergunningnummer',
      ae_proj: 'DLD- / RERA-projectnummer', ae_oqood: 'Oqood-nummer (voorlopige registratie)', ae_permit: 'Trakheesi- / Madmoun-advertentievergunning', ae_brn: 'Makelaars- (BRN) of kantoornummer (ORN)',
      id_nib: 'NIB-bedrijfsnummer', id_pbg: 'PBG-bouwvergunning', id_title: 'Grondcertificaat (SHM, HGB, HGU, Hak Pakai)', th_eia: 'ONEP-MER-briefnummer', th_condo: 'Registratienummer appartementencomplex', au_abn: 'ABN', lei: 'LEI (identificatiecode juridische entiteit)' }
  },
  ru: {
    title: 'Чтение фото разрешения', desc: 'Сфотографируйте разрешение, лицензию или свидетельство компании. Браузер прочитает его, найдёт регистрационные номера и одним нажатием проверит номер в официальном реестре. Фото не покидает ваше устройство.',
    crumb_tools: 'Инструменты', h1: 'Прочитайте фото разрешения и проверьте его номера в реестре',
    lead: 'Сфотографируйте разрешение на строительство, лицензию или свидетельство компании. Браузер прочитает текст и найдёт номера, которые используют официальные реестры. Вы выбираете, какой проверить.',
    priv_b: 'Фото остаётся на этом устройстве.', priv: 'Распознавание текста идёт в вашем браузере с помощью Tesseract, программы с открытым кодом. Мы не получаем ни изображение, ни текст, и ничего не сохраняется. Отправляется только номер, который вы решили проверить, в наш поиск по реестрам. Веб-аналитика на этой странице скрыта.',
    pick: 'Выбрать фото', cam: 'Сделать фото', drop: 'Перетащите фото сюда', drop_help: 'JPG, PNG или WebP. Лучше всего читается резкое, ровное, хорошо освещённое фото.',
    lang_l: 'Язык документа', lang_help: 'Английский включён всегда. Программа (около 4 МБ) и каждый язык (от 1 до 3 МБ) загружаются один раз с jsDelivr, затем их хранит браузер.',
    read: 'Прочитать фото', samples: 'Нет документа под рукой? Попробуйте наш пример:',
    s_es: 'Испания', s_uk: 'Великобритания', s_au: 'Австралия', s_id: 'Индонезия',
    sample_note: 'Примеры нарисованы этой страницей, это не настоящие документы. Испанский кадастровый номер, британский номер компании (Tesco PLC) и австралийский ABN (Australian Taxation Office) являются настоящими публичными записями. Индонезийские номера выдуманы.',
    st_load: 'Загрузка программы', st_lang: 'Загрузка языковых данных', st_read: 'Чтение текста', st_done: 'Готово. Найдено номеров: {n}.', st_none: 'Регистрационные номера не найдены. Проверьте текст ниже, исправьте при необходимости и выполните поиск снова.',
    st_err: 'Программа не запустилась ({e}). Попробуйте ещё раз или введите номер в текстовое поле.', st_img: 'Этот файл нельзя открыть как изображение.',
    found_h: 'Найденные номера', found_help: 'Каждая рамка на фото соответствует номеру в этом списке. Это совпадения по формату: сверьте каждый номер с документом, прежде чем полагаться на него.',
    text_h: 'Текст, прочитанный с фото', text_help: 'Исправьте ошибки здесь или введите номер сами. Ничего не отправляется, пока вы не нажмёте кнопку проверки.', again: 'Найти номера снова',
    lookup: 'Проверить в реестре', open: 'Открыть официальный сайт', manual: 'Нет публичного поиска, к которому мы можем обратиться. Проверьте вручную:', ask: 'Национального онлайн-реестра для этого нет. Спросите {who}.',
    ck_ok: 'Контрольная цифра верна', ck_bad: 'Контрольная цифра не совпадает. Скорее всего, ошибка чтения или неверный номер.', fmt: 'Формат совпадает', looking: 'Проверяем',
    r_found: 'Найдено', r_not_found: 'Не найдено', r_not_published: 'Не публикуется', r_needs_key: 'Ещё не подключено', r_unavailable: 'Нет ответа',
    raw: 'Точный ответ', sealed: 'Запечатанный результат', rate: 'Достигнут часовой лимит (20 проверок в час). Попробуйте позже.', lk_err: 'Проверка не удалась. Попробуйте ещё раз.',
    nf_note: 'Результат «не найдено» или «не публикуется» не доказывает проблему. Результат «найдено» не доказывает, что проект надёжен.', sent: 'Отправлено: только номер.',
    how_h: 'Какие номера мы распознаём', th_mk: 'Рынок', th_no: 'Номер', th_do: 'Что делает одно нажатие',
    act_live: 'Проверка онлайн: {reg}', act_key: 'Поиск в реестре (ключ к сервису данных ожидается) и официальная страница статуса', act_man: 'Ссылка на {reg}', act_ask: 'Подсказывает, кого спросить',
    lim_h: 'Ограничения', lim1: 'Распознавание текста ошибается, чаще всего с 0 и O, 1 и I, 5 и S. Сверяйте каждый номер с документом.',
    lim2: 'Номер в реестре доказывает лишь, что запись существует. Проверьте, что имя, адрес и даты там совпадают с вашим документом.',
    lim3: 'Разрешение на здание не является правом на землю, и ни то, ни другое не доказывает, что застройщик может вам продавать.', lim4: 'Рукописный текст, печати поверх текста и фото под углом читаются плохо.',
    cr_h: 'Источники и лицензии', cr: 'Распознавание текста: tesseract.js 5.1.1 и Tesseract OCR, Apache License 2.0. Языковые данные: tessdata 4.0.0_best_int, Apache License 2.0. Файлы с jsDelivr.',
    rel: 'Связанные инструменты', rel_qr: 'Проверка QR-кода разрешения', rel_agent: 'Есть ли у агента лицензия?', rel_reg: 'Официальные реестры',
    who_town: 'в мэрии (ayuntamiento), выдавшей разрешение', who_notary: 'у нотариуса (PPAT) или в местном земельном офисе (Kantor Pertanahan)',
    m: { ES: 'Испания', GB: 'Великобритания', NYC: 'США, Нью-Йорк', MD: 'США, Майами-Дейд', AE: 'Дубай', ID: 'Индонезия', TH: 'Таиланд', AU: 'Австралия', WW: 'Весь мир' },
    p: { es_refcat: 'Кадастровый номер (referencia catastral)', es_lic: 'Разрешение на строительство (licencia de obras)', es_cif: 'Налоговый номер компании (CIF)', gb_co: 'Номер компании', us_dobnow: 'Номер дела DOB NOW', us_bis: 'Номер дела DOB', us_md: 'Номер разрешения на строительство',
      ae_proj: 'Номер проекта DLD / RERA', ae_oqood: 'Номер Oqood (предварительная регистрация)', ae_permit: 'Разрешение на рекламу Trakheesi / Madmoun', ae_brn: 'Номер брокера (BRN) или офиса (ORN)',
      id_nib: 'Номер предприятия NIB', id_pbg: 'Разрешение на строительство PBG', id_title: 'Сертификат на землю (SHM, HGB, HGU, Hak Pakai)', th_eia: 'Номер письма ONEP по ОВОС', th_condo: 'Регистрационный номер кондоминиума', au_abn: 'ABN', lei: 'LEI (идентификатор юридического лица)' }
  },
  zh: {
    title: '许可证照片识别', desc: '拍下许可证、执照或公司证书。浏览器会读取内容，找出登记编号，一键在官方登记处查询。照片不会离开您的设备。',
    crumb_tools: '工具', h1: '读取许可证照片，再到登记处核对其中的编号',
    lead: '拍下建筑许可、执照或公司证书。浏览器读取文字，找出官方登记处使用的编号。由您选择查询哪一个。',
    priv_b: '照片留在本设备上。', priv: '文字识别在您的浏览器中运行，使用开源识别程序 Tesseract。我们不会收到图片或文字，也不保存任何内容。只有您选择查询的编号会发送到我们的登记查询。本页的网站分析已做遮蔽处理。',
    pick: '选择照片', cam: '拍照', drop: '把照片拖到这里', drop_help: 'JPG、PNG 或 WebP。清晰、端正、光线充足的照片识别效果最好。',
    lang_l: '文件语言', lang_help: '始终包含英语。识别程序（约 4 MB）和每种语言（1 到 3 MB）从 jsDelivr 下载一次，之后由浏览器保存。',
    read: '读取照片', samples: '手边没有文件？试试我们制作的示例：',
    s_es: '西班牙', s_uk: '英国', s_au: '澳大利亚', s_id: '印度尼西亚',
    sample_note: '示例是本页绘制的文字卡片，不是真实文件。西班牙地籍编号、英国公司编号（Tesco PLC）和澳大利亚 ABN（Australian Taxation Office）是真实的公开记录。印度尼西亚的编号是虚构的。',
    st_load: '正在加载识别程序', st_lang: '正在加载语言数据', st_read: '正在读取文字', st_done: '完成。找到的编号：{n}。', st_none: '没有找到登记编号。请检查下面的文字，必要时修改后再搜索。',
    st_err: '识别程序无法启动（{e}）。请重试，或在文本框中输入编号。', st_img: '无法将此文件作为图片打开。',
    found_h: '找到的编号', found_help: '照片上的每个方框对应此列表中的一个编号。这些只是格式匹配：在依赖之前，请与您的文件逐一核对。',
    text_h: '从照片读取的文字', text_help: '可在此修改错误，或自己输入编号。在您按下查询按钮之前不会发送任何内容。', again: '重新查找编号',
    lookup: '在登记处查询', open: '打开官方网站', manual: '没有我们可以调用的公开查询。请手动核对：', ask: '这类文件没有全国性的在线登记处。请询问{who}。',
    ck_ok: '校验位有效', ck_bad: '校验位不符。很可能是识别错误或编号有误。', fmt: '格式相符', looking: '正在查询',
    r_found: '已找到', r_not_found: '未找到', r_not_published: '未公开', r_needs_key: '尚未接入', r_unavailable: '无响应',
    raw: '原始响应', sealed: '已封存结果', rate: '已达到每小时上限（每小时 20 次查询）。请稍后再试。', lk_err: '查询失败。请重试。',
    nf_note: '未找到或未公开并不证明存在问题。已找到也不证明项目可靠。', sent: '已发送：仅编号。',
    how_h: '我们能识别的编号', th_mk: '市场', th_no: '编号', th_do: '一键操作的作用',
    act_live: '实时查询：{reg}', act_key: '登记查询（数据服务密钥待配置）及官方状态页面', act_man: '链接到{reg}', act_ask: '告诉您该询问谁',
    lim_h: '局限', lim1: '文字识别会出错，最常见的是 0 和 O、1 和 I、5 和 S。请逐一与文件核对编号。',
    lim2: '编号在登记处存在，只能证明该记录存在。请核对登记处的名称、地址和日期是否与您的文件一致。',
    lim3: '建筑许可不是土地产权，两者都不能证明开发商有权向您出售。', lim4: '手写字、盖在文字上的印章以及倾斜拍摄的照片识别效果差。',
    cr_h: '来源与许可', cr: '文字识别：tesseract.js 5.1.1 和 Tesseract OCR，Apache License 2.0。语言数据：tessdata 4.0.0_best_int，Apache License 2.0。文件由 jsDelivr 提供。',
    rel: '相关工具', rel_qr: '许可证二维码检查', rel_agent: '这位中介有执照吗？', rel_reg: '官方登记处',
    who_town: '签发许可的市政厅（ayuntamiento）', who_notary: '公证人（PPAT）或当地土地办公室（Kantor Pertanahan）',
    m: { ES: '西班牙', GB: '英国', NYC: '美国，纽约市', MD: '美国，迈阿密-戴德', AE: '迪拜', ID: '印度尼西亚', TH: '泰国', AU: '澳大利亚', WW: '全球' },
    p: { es_refcat: '地籍编号（referencia catastral）', es_lic: '建筑许可（licencia de obras）', es_cif: '公司税号（CIF）', gb_co: '公司编号', us_dobnow: 'DOB NOW 案件编号', us_bis: 'DOB 案件编号', us_md: '建筑许可编号',
      ae_proj: 'DLD / RERA 项目编号', ae_oqood: 'Oqood（临时登记）编号', ae_permit: 'Trakheesi / Madmoun 广告许可', ae_brn: '经纪人（BRN）或机构（ORN）编号',
      id_nib: 'NIB 企业编号', id_pbg: 'PBG 建筑许可', id_title: '土地证书（SHM、HGB、HGU、Hak Pakai）', th_eia: 'ONEP 环评公文编号', th_condo: '公寓登记编号', au_abn: 'ABN', lei: 'LEI（法人识别编码）' }
  },
  ar: {
    title: 'قارئ صور التصاريح', desc: 'التقط صورة لتصريح أو رخصة أو شهادة شركة. يقرأها متصفحك ويجد أرقام السجل ويبحث عن أحدها في السجل الرسمي بنقرة واحدة. لا تغادر الصورة جهازك أبدًا.',
    crumb_tools: 'الأدوات', h1: 'اقرأ صورة التصريح ثم تحقق من أرقامه في السجل',
    lead: 'صوّر رخصة بناء أو تصريحًا أو شهادة شركة. يقرأ متصفحك النص ويجد الأرقام التي تستخدمها السجلات الرسمية. أنت تختار الرقم الذي تبحث عنه.',
    priv_b: 'تبقى الصورة على هذا الجهاز.', priv: 'يعمل التعرف على النص داخل متصفحك باستخدام Tesseract، وهو قارئ مفتوح المصدر. لا نستلم الصورة ولا النص، ولا يُحفظ أي شيء. لا يُرسل إلا الرقم الذي تختار البحث عنه، إلى خدمة البحث في السجلات لدينا. أدوات تحليل الموقع محجوبة في هذه الصفحة.',
    pick: 'اختر صورة', cam: 'التقط صورة', drop: 'أفلت صورة هنا', drop_help: 'JPG أو PNG أو WebP. الصورة الواضحة المستقيمة جيدة الإضاءة تُقرأ أفضل.',
    lang_l: 'لغة المستند', lang_help: 'الإنجليزية مضمنة دائمًا. يُنزَّل القارئ (نحو 4 ميغابايت) وكل لغة (من 1 إلى 3 ميغابايت) مرة واحدة من jsDelivr، ثم يحتفظ بها متصفحك.',
    read: 'اقرأ الصورة', samples: 'ليس لديك مستند الآن؟ جرّب مثالًا صنعناه:',
    s_es: 'إسبانيا', s_uk: 'المملكة المتحدة', s_au: 'أستراليا', s_id: 'إندونيسيا',
    sample_note: 'الأمثلة بطاقات نصية ترسمها هذه الصفحة، وليست مستندات حقيقية. المرجع العقاري الإسباني ورقم الشركة البريطانية (Tesco PLC) ورقم ABN الأسترالي (Australian Taxation Office) سجلات عامة حقيقية. الأرقام الإندونيسية مختلقة.',
    st_load: 'جارٍ تحميل القارئ', st_lang: 'جارٍ تحميل بيانات اللغة', st_read: 'جارٍ قراءة النص', st_done: 'تم. الأرقام التي وُجدت: {n}.', st_none: 'لم تُعثر على أرقام سجل. راجع النص أدناه وصححه إن لزم ثم ابحث مجددًا.',
    st_err: 'تعذر تشغيل القارئ ({e}). حاول مجددًا أو اكتب الرقم في مربع النص.', st_img: 'تعذر فتح هذا الملف كصورة.',
    found_h: 'الأرقام التي وُجدت', found_help: 'كل إطار على الصورة يقابل رقمًا في هذه القائمة. هذه مطابقات للصيغة فقط: قارن كل رقم بمستندك قبل الاعتماد عليه.',
    text_h: 'النص المقروء من الصورة', text_help: 'صحّح الأخطاء هنا أو اكتب رقمًا بنفسك. لا يُرسل شيء مما تكتبه حتى تضغط زر البحث.', again: 'ابحث عن الأرقام مجددًا',
    lookup: 'ابحث في السجل', open: 'افتح الموقع الرسمي', manual: 'لا يوجد بحث عام يمكننا الاستعلام منه. تحقق يدويًا:', ask: 'لا يوجد سجل وطني على الإنترنت لهذا. اسأل {who}.',
    ck_ok: 'رقم التحقق صحيح', ck_bad: 'رقم التحقق غير مطابق. على الأرجح خطأ في القراءة أو رقم خاطئ.', fmt: 'الصيغة مطابقة', looking: 'جارٍ البحث',
    r_found: 'موجود', r_not_found: 'غير موجود', r_not_published: 'غير منشور', r_needs_key: 'غير متصل بعد', r_unavailable: 'لم يستجب',
    raw: 'الاستجابة الحرفية', sealed: 'نتيجة مختومة', rate: 'بلغت الحد بالساعة (20 بحثًا في الساعة). حاول لاحقًا.', lk_err: 'فشل البحث. حاول مجددًا.',
    nf_note: 'نتيجة غير موجود أو غير منشور ليست دليلًا على مشكلة. ونتيجة موجود ليست دليلًا على سلامة المشروع.', sent: 'أُرسل: الرقم فقط.',
    how_h: 'الأرقام التي نتعرف عليها', th_mk: 'السوق', th_no: 'الرقم', th_do: 'ما تفعله النقرة',
    act_live: 'بحث مباشر: {reg}', act_key: 'بحث في السجل (مفتاح خدمة البيانات قيد الانتظار) وصفحة الحالة الرسمية', act_man: 'رابط إلى {reg}', act_ask: 'يخبرك بمن تسأل',
    lim_h: 'الحدود', lim1: 'يخطئ التعرف على النص، خاصة بين 0 وO و1 وI و5 وS. قارن كل رقم بالمستند.',
    lim2: 'وجود الرقم في السجل يثبت فقط أن القيد موجود. تحقق من أن الاسم والعنوان والتواريخ فيه تطابق مستندك.',
    lim3: 'رخصة المبنى ليست سند ملكية للأرض، ولا يثبت أي منهما أن المطوّر يحق له البيع لك.', lim4: 'الخط اليدوي والأختام فوق النص والصور الملتقطة بزاوية تُقرأ بصعوبة.',
    cr_h: 'المصادر والتراخيص', cr: 'التعرف على النص: tesseract.js 5.1.1 وTesseract OCR، رخصة Apache 2.0. بيانات اللغة: tessdata 4.0.0_best_int، رخصة Apache 2.0. تُقدَّم الملفات عبر jsDelivr.',
    rel: 'أدوات ذات صلة', rel_qr: 'فحص رمز QR للتصريح', rel_agent: 'هل هذا الوسيط مرخص؟', rel_reg: 'السجلات الرسمية',
    who_town: 'البلدية (ayuntamiento) التي أصدرت الرخصة', who_notary: 'كاتب العدل (PPAT) أو مكتب الأراضي المحلي (Kantor Pertanahan)',
    m: { ES: 'إسبانيا', GB: 'المملكة المتحدة', NYC: 'الولايات المتحدة، مدينة نيويورك', MD: 'الولايات المتحدة، ميامي ديد', AE: 'دبي', ID: 'إندونيسيا', TH: 'تايلاند', AU: 'أستراليا', WW: 'العالم' },
    p: { es_refcat: 'المرجع العقاري (referencia catastral)', es_lic: 'رخصة البناء (licencia de obras)', es_cif: 'الرقم الضريبي للشركة (CIF)', gb_co: 'رقم الشركة', us_dobnow: 'رقم ملف DOB NOW', us_bis: 'رقم ملف DOB', us_md: 'رقم رخصة البناء',
      ae_proj: 'رقم المشروع لدى DLD / RERA', ae_oqood: 'رقم أوقود (التسجيل المبدئي)', ae_permit: 'تصريح إعلان ترخيصي / مأمون', ae_brn: 'رقم الوسيط (BRN) أو المكتب (ORN)',
      id_nib: 'رقم المنشأة NIB', id_pbg: 'رخصة البناء PBG', id_title: 'شهادة الأرض (SHM، HGB، HGU، Hak Pakai)', th_eia: 'رقم خطاب تقييم الأثر البيئي من ONEP', th_condo: 'رقم تسجيل العمارة السكنية', au_abn: 'ABN', lei: 'LEI (معرّف الكيان القانوني)' }
  }
};
const tr = l => { const o = Object.assign({}, S.en, S[l] || {}); o.m = Object.assign({}, S.en.m, (S[l] || {}).m); o.p = Object.assign({}, S.en.p, (S[l] || {}).p); return o; };

// one row per recognised number: market, how one tap works (lookup kind or link), register name and URL (facts, not translated)
const ROWS = [
  ['es_refcat', 'ES', 'live', 'Sede Electrónica del Catastro', 'https://www.sedecatastro.gob.es/'],
  ['es_lic', 'ES', 'ask', null, null],
  ['es_cif', 'ES', 'man', 'BORME (Boletín Oficial del Registro Mercantil)', 'https://www.boe.es/diario_borme/'],
  ['gb_co', 'GB', 'live', 'Companies House', 'https://find-and-update.company-information.service.gov.uk/'],
  ['us_dobnow', 'NYC', 'live', 'NYC Department of Buildings (NYC Open Data)', 'https://opendata.cityofnewyork.us/'],
  ['us_bis', 'NYC', 'live', 'NYC Department of Buildings (NYC Open Data)', 'https://opendata.cityofnewyork.us/'],
  ['us_md', 'MD', 'live', 'Miami-Dade County building permits (open data)', 'https://gis-mdc.opendata.arcgis.com/'],
  ['ae_proj', 'AE', 'key', 'Dubai Land Department, project status', 'https://dubailand.gov.ae/en/eservices/real-estate-project-status-landing/'],
  ['ae_oqood', 'AE', 'man', 'Dubai Land Department', 'https://dubailand.gov.ae/en/'],
  ['ae_permit', 'AE', 'man', 'Kolaboro permit QR check (Madmoun QR)', '/tools/permit-check/'],
  ['ae_brn', 'AE', 'man', 'Kolaboro agent licence check (DLD register)', '/tools/agent-check/'],
  ['id_nib', 'ID', 'man', 'OSS (Online Single Submission)', 'https://oss.go.id/'],
  ['id_pbg', 'ID', 'man', 'SIMBG, Ministry of Public Works', 'https://simbg.pu.go.id/'],
  ['id_title', 'ID', 'man', 'BHUMI, ATR/BPN', 'https://bhumi.atrbpn.go.id/'],
  ['th_eia', 'TH', 'man', 'ONEP EIA database', 'https://eia.onep.go.th/'],
  ['th_condo', 'TH', 'man', 'Department of Lands', 'https://www.dol.go.th/'],
  ['au_abn', 'AU', 'live', 'ABN Lookup, Australian Business Register', 'https://abr.business.gov.au/'],
  ['lei', 'WW', 'man', 'GLEIF LEI search', 'https://search.gleif.org/']
];

const CSS = `<style id="kpp17">
.kpp{--gap:var(--k-5,24px)}
.kpp .k-phead{padding-block:var(--k-7,48px) var(--k-5,24px)}
.kpp h1{max-width:22ch}
.kpp .k-phead .lead{max-width:62ch}
.kpp-priv{display:flex;gap:var(--k-3,12px);align-items:flex-start;max-width:72ch;margin-top:var(--k-4,16px)}
.kpp-priv svg{flex:none;width:22px;height:22px;color:var(--k-ok);margin-top:2px}
.kpp-grid{display:grid;gap:var(--k-6,32px);grid-template-columns:minmax(0,1fr);align-items:start;padding-bottom:var(--k-7,48px)}
@media (min-width:960px){.kpp-grid{grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr)}}
.kpp-grid>*{min-width:0}
.kpp-fig{margin:0;max-width:100%;position:relative;border:1.5px dashed var(--k-line-2);border-radius:var(--k-r-lg,14px);background:var(--k-sunken);min-height:260px;display:block;overflow:hidden}
.kpp [hidden]{display:none!important}
.kpp-fig.has{min-height:0;border-style:solid;border-color:var(--k-line);background:var(--k-surface)}
.kpp-fig.over{border-color:var(--k-sea);background:var(--k-sea-soft)}
.kpp-fig canvas{display:block;width:100%;height:auto}
.kpp-fig canvas[hidden]{display:none}
.kpp-empty{text-align:center;padding:var(--k-8,64px) var(--k-4,16px);color:var(--k-muted)}
.kpp-empty svg{width:56px;height:56px;color:var(--k-line-2);display:block;margin:0 auto var(--k-3,12px)}
.kpp-empty b{display:block;color:var(--k-ink);font-size:var(--k-fs-md);margin-bottom:4px}
.kpp-side{display:flex;flex-direction:column;gap:var(--k-4,16px)}
.kpp-pick{display:flex;flex-wrap:wrap;gap:var(--k-2,8px)}
.kpp-pick label{position:relative;cursor:pointer}
.kpp-pick input[type=file]{position:absolute;inset:0;opacity:0;width:1px;height:1px}
.kpp-pick label:focus-within{outline:2px solid var(--k-sea);outline-offset:2px;border-radius:var(--k-r-md,10px)}
.kpp-samples{display:flex;flex-wrap:wrap;gap:var(--k-2,8px);align-items:center}
.kpp-samples>span{width:100%;color:var(--k-muted);font-size:var(--k-fs-sm)}
.kpp-status{min-height:1.5em;margin:0;font-size:var(--k-fs-sm);color:var(--k-ink-2)}
.kpp-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:var(--k-3,12px)}
.kpp-item{border:1px solid var(--k-line);border-radius:var(--k-r-md,10px);background:var(--k-surface);padding:var(--k-4,16px)}
.kpp-item.on{border-color:var(--k-sea);box-shadow:0 0 0 2px var(--k-sea-soft)}
.kpp-ih{display:flex;gap:var(--k-3,12px);align-items:flex-start}
.kpp-n{flex:none;display:grid;place-items:center;width:28px;height:28px;border-radius:var(--k-r-sm,6px);background:var(--k-sea);color:#fff;font-weight:700;font-size:var(--k-fs-sm)}
.kpp-v{display:block;font-size:var(--k-fs-lg);font-weight:650;letter-spacing:.01em;word-break:break-all;color:var(--k-ink)}
.kpp-k{display:block;font-size:var(--k-fs-sm);color:var(--k-ink-2)}
.kpp-meta{display:flex;flex-wrap:wrap;gap:var(--k-2,8px);margin-top:var(--k-2,8px)}
.kpp-act{display:flex;flex-wrap:wrap;gap:var(--k-2,8px);margin-top:var(--k-3,12px);align-items:center}
.kpp-res{margin-top:var(--k-3,12px);overflow-wrap:anywhere;min-width:0}
.kpp-res .k-hash{max-width:100%}
.kpp-res:empty{display:none}
.kpp-item,.kpp-ih>div{min-width:0}
.kpp-res .k-ledger{margin:var(--k-2,8px) 0}
.kpp-chk{border-top:1px solid var(--k-line);padding-top:var(--k-3,12px);margin-top:var(--k-3,12px)}
.kpp-chk:first-child{border-top:0;margin-top:0;padding-top:0}
.kpp-chk h4{font-size:var(--k-fs-sm);margin:0 0 6px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.kpp-chk p{margin:4px 0;font-size:var(--k-fs-sm);color:var(--k-ink-2)}
.kpp-txt textarea{width:100%;max-width:100%;box-sizing:border-box;min-height:9em;font-size:var(--k-fs-sm);line-height:1.5}
.kpp-how{padding-block:var(--k-7,48px)}
.kpp-how h2{margin-top:0}
.kpp-two{display:grid;gap:var(--k-6,32px);grid-template-columns:1fr;margin-top:var(--k-6,32px)}
@media (min-width:860px){.kpp-two{grid-template-columns:1fr 1fr}}
.kpp-two ul{padding-inline-start:1.2em;margin:0}.kpp-two li{margin-bottom:6px}
.kpp-rel{display:flex;flex-wrap:wrap;gap:var(--k-2,8px)}
</style>`;

function body(lang) {
  const t = tr(lang), p = pre(lang);
  const client = { lang, read: t.read, st_load: t.st_load, st_lang: t.st_lang, st_read: t.st_read, st_done: t.st_done, st_none: t.st_none, st_err: t.st_err, st_img: t.st_img, lookup: t.lookup, open: t.open, manual: t.manual, ask: t.ask,
    ck_ok: t.ck_ok, ck_bad: t.ck_bad, fmt: t.fmt, looking: t.looking, r_found: t.r_found, r_not_found: t.r_not_found, r_not_published: t.r_not_published, r_needs_key: t.r_needs_key, r_unavailable: t.r_unavailable,
    raw: t.raw, sealed: t.sealed, rate: t.rate, lk_err: t.lk_err, nf_note: t.nf_note, sent: t.sent, who_town: t.who_town, who_notary: t.who_notary, m: t.m, p: t.p, rows: ROWS };
  const langOpts = [['eng', 'English'], ['spa', 'Español'], ['ara', 'العربية'], ['ind', 'Bahasa Indonesia'], ['tha', 'ไทย'], ['chi_sim', '简体中文'], ['rus', 'Русский'], ['fra', 'Français'], ['deu', 'Deutsch'], ['nld', 'Nederlands']];
  const def = { en: 'eng', es: 'spa', ar: 'ara', zh: 'chi_sim', ru: 'rus', fr: 'fra', de: 'deu', nl: 'nld' }[lang] || 'eng';
  const rows = ROWS.map(r => {
    const act = r[2] === 'live' ? t.act_live.replace('{reg}', r[3]) : r[2] === 'key' ? t.act_key : r[2] === 'ask' ? t.act_ask : t.act_man.replace('{reg}', r[3]);
    return '<tr><td data-label="' + esc(t.th_mk) + '">' + esc(t.m[r[1]]) + '</td><td data-label="' + esc(t.th_no) + '">' + esc(t.p[r[0]]) + '</td><td data-label="' + esc(t.th_do) + '">' + esc(act) + (r[4] ? ' <a class="k-src" href="' + esc(r[4]) + '" rel="noopener">' + esc(r[4].startsWith('/') ? 'kolaboro.com' + r[4] : new URL(r[4]).hostname.replace(/^www\./, '')) + '</a>' : '') + '</td></tr>';
  }).join('');
  return '<div class="kpp" data-kpp data-t="' + esc(JSON.stringify(client)) + '"><div class="k-wrap">' +
    '<header class="k-phead"><nav class="k-crumb" aria-label="Breadcrumb"><a href="' + p + '/">Kolaboro</a> / <a href="/tools/">' + esc(t.crumb_tools) + '</a> / <span aria-current="page">' + esc(t.title) + '</span></nav>' +
    '<h1>' + esc(t.h1) + '</h1><p class="lead">' + esc(t.lead) + '</p>' +
    '<p class="kpp-priv"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="m8.5 12 2.5 2.5 4.5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span><b>' + esc(t.priv_b) + '</b> ' + esc(t.priv) + '</span></p></header>' +
    '<div class="kpp-grid"><div class="k-stack" style="--k-gap:var(--k-4,16px)">' +
      '<figure class="kpp-fig" id="ppFig"><div class="kpp-empty" id="ppEmpty"><svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="10" width="36" height="28" rx="4" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M12 18h14M12 24h20M12 30h10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg><b>' + esc(t.drop) + '</b><span class="k-small">' + esc(t.drop_help) + '</span></div><canvas id="ppCv" hidden role="img" aria-label="' + esc(t.title) + '"></canvas></figure>' +
      '<div class="kpp-txt k-field" id="ppTxtWrap" hidden><label class="k-label" for="ppTxt">' + esc(t.text_h) + '</label><textarea class="k-textarea" id="ppTxt" spellcheck="false" autocomplete="off"></textarea><p class="k-help">' + esc(t.text_help) + '</p><div><button type="button" class="k-btn k-btn--sm" id="ppAgain">' + esc(t.again) + '</button></div></div>' +
    '</div><div class="kpp-side">' +
      '<div class="kpp-pick"><label class="k-btn">' + esc(t.pick) + '<input type="file" id="ppFile" accept="image/*"></label><label class="k-btn">' + esc(t.cam) + '<input type="file" id="ppCam" accept="image/*" capture="environment"></label></div>' +
      '<div class="k-field"><label class="k-label" for="ppLang">' + esc(t.lang_l) + '</label><select class="k-select" id="ppLang">' + langOpts.map(o => '<option value="' + o[0] + '"' + (o[0] === def ? ' selected' : '') + ' lang="' + ({ eng: 'en', spa: 'es', ara: 'ar', ind: 'id', tha: 'th', chi_sim: 'zh', rus: 'ru', fra: 'fr', deu: 'de', nld: 'nl' })[o[0]] + '">' + esc(o[1]) + '</option>').join('') + '</select><p class="k-help">' + esc(t.lang_help) + '</p></div>' +
      '<div><button type="button" class="k-btn k-btn--primary k-btn--block" id="ppRead" disabled>' + esc(t.read) + '</button></div>' +
      '<div class="k-progress" id="ppProg" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" hidden><i style="--v:0%"></i></div>' +
      '<p class="kpp-status" id="ppStatus" aria-live="polite"></p>' +
      '<div class="kpp-samples"><span>' + esc(t.samples) + '</span><button type="button" class="k-btn k-btn--sm k-btn--ghost" data-pp-sample="es">' + esc(t.s_es) + '</button><button type="button" class="k-btn k-btn--sm k-btn--ghost" data-pp-sample="uk">' + esc(t.s_uk) + '</button><button type="button" class="k-btn k-btn--sm k-btn--ghost" data-pp-sample="au">' + esc(t.s_au) + '</button><button type="button" class="k-btn k-btn--sm k-btn--ghost" data-pp-sample="id">' + esc(t.s_id) + '</button><p class="k-xs k-muted" style="margin:0">' + esc(t.sample_note) + '</p></div>' +
      '<section id="ppFound" hidden aria-labelledby="ppFoundH"><h2 id="ppFoundH" style="font-size:var(--k-fs-xl);margin:0 0 4px">' + esc(t.found_h) + '</h2><p class="k-small k-muted" style="margin:0 0 var(--k-3,12px)">' + esc(t.found_help) + '</p><ol class="kpp-list" id="ppList"></ol></section>' +
    '</div></div></div>' +
    '<section class="k-sec--tint kpp-how"><div class="k-wrap"><h2>' + esc(t.how_h) + '</h2>' +
      '<div class="k-table-wrap"><table class="k-table k-table--stack"><thead><tr><th scope="col">' + esc(t.th_mk) + '</th><th scope="col">' + esc(t.th_no) + '</th><th scope="col">' + esc(t.th_do) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="kpp-two"><div><h3>' + esc(t.lim_h) + '</h3><ul><li>' + esc(t.lim1) + '</li><li>' + esc(t.lim2) + '</li><li>' + esc(t.lim3) + '</li><li>' + esc(t.lim4) + '</li><li>' + esc(t.nf_note) + '</li></ul></div>' +
      '<div><h3>' + esc(t.cr_h) + '</h3><p>' + esc(t.cr) + ' <a class="k-src" href="https://github.com/naptha/tesseract.js" rel="noopener">github.com/naptha/tesseract.js</a> <a class="k-src" href="https://github.com/tesseract-ocr/tessdata" rel="noopener">github.com/tesseract-ocr/tessdata</a></p>' +
      '<h3>' + esc(t.rel) + '</h3><div class="kpp-rel"><a class="k-btn k-btn--sm" href="/tools/permit-check/">' + esc(t.rel_qr) + '</a><a class="k-btn k-btn--sm" href="/tools/agent-check/">' + esc(t.rel_agent) + '</a><a class="k-btn k-btn--sm" href="/registers/">' + esc(t.rel_reg) + '</a></div></div></div>' +
    '</div></section></div>';
}

// ------------------------------------------------------------------------------------------------ client (no backticks inside)
const JS = String.raw`(function(){
var R=document.querySelector('[data-kpp]');if(!R)return;var T=JSON.parse(R.getAttribute('data-t'));
var $=function(id){return document.getElementById(id)};
var fig=$('ppFig'),cv=$('ppCv'),cx=cv.getContext('2d'),empty=$('ppEmpty'),btn=$('ppRead'),st=$('ppStatus'),prog=$('ppProg'),list=$('ppList'),found=$('ppFound'),txt=$('ppTxt'),txtW=$('ppTxtWrap'),sel=$('ppLang');
var img=null,words=[],cands=[],worker=null,wlang=null,busy=false;
var ROW={};T.rows.forEach(function(r){ROW[r[0]]=r});
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function say(s){st.textContent=s||''}
function setProg(v){if(v==null){prog.hidden=true;return}prog.hidden=false;var p=Math.round(v*100);prog.setAttribute('aria-valuenow',p);prog.firstChild.style.setProperty('--v',p+'%')}
function css(n,f){var v=getComputedStyle(document.documentElement).getPropertyValue(n).trim();return v||f}
// ---------- image in ----------
function show(c){img=c;cv.width=c.width;cv.height=c.height;draw();cv.hidden=false;empty.hidden=true;fig.classList.add('has');btn.disabled=false;found.hidden=true;list.innerHTML='';txtW.hidden=true;words=[];cands=[];say('')}
function draw(on){cx.drawImage(img,0,0);if(!cands.length)return;var sea=css('--k-sea','#155C75'),k=Math.max(2,Math.round(img.width/500));
 cands.forEach(function(c,i){if(!c.box)return;var b=c.box,pad=k*2;cx.lineWidth=(on===i?2:1)*k*1.5;cx.strokeStyle=sea;cx.strokeRect(b.x0-pad,b.y0-pad,b.x1-b.x0+pad*2,b.y1-b.y0+pad*2);
  var s=Math.min(64,Math.max(26,Math.round((b.y1-b.y0)*1.1))),lx=b.x0-pad,ly=Math.max(0,b.y0-pad-s);cx.fillStyle=sea;cx.fillRect(lx,ly,s,s);cx.fillStyle='#fff';cx.font='700 '+Math.round(s*.7)+'px sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(String(i+1),lx+s/2,ly+s/2+1)})}
function load(file){if(!file)return;if(!/^image\//.test(file.type||'image/')){say(T.st_img);return}
 var done=function(src){var M=2400,w=src.width,h=src.height,s=Math.min(1,M/Math.max(w,h));var c=document.createElement('canvas');c.width=Math.round(w*s);c.height=Math.round(h*s);c.getContext('2d').drawImage(src,0,0,c.width,c.height);show(c);run()};
 if(window.createImageBitmap){createImageBitmap(file,{imageOrientation:'from-image'}).then(done).catch(function(){viaImg(file,done)})}else viaImg(file,done)}
function viaImg(file,done){var u=URL.createObjectURL(file),im=new Image();im.onload=function(){done(im);URL.revokeObjectURL(u)};im.onerror=function(){say(T.st_img);URL.revokeObjectURL(u)};im.src=u}
['ppFile','ppCam'].forEach(function(id){$(id).addEventListener('change',function(e){load(e.target.files[0]);e.target.value=''})});
fig.addEventListener('dragover',function(e){e.preventDefault();fig.classList.add('over')});fig.addEventListener('dragleave',function(){fig.classList.remove('over')});
fig.addEventListener('drop',function(e){e.preventDefault();fig.classList.remove('over');if(e.dataTransfer.files[0])load(e.dataTransfer.files[0])});
btn.addEventListener('click',function(){run()});
// ---------- samples drawn here (no files, no real people) ----------
var SAMPLES={
 es:['MUESTRA PARA PROBAR - NO ES UN DOCUMENTO REAL','Ayuntamiento de Ejemplo','Licencia de obras n.º 2024/0157','Referencia catastral: 9872023VH5797S0001WX','Uso: residencial'],
 uk:['SAMPLE FOR TESTING - NOT A REAL DOCUMENT','Developer letter footer','Registered in England and Wales','Company number 00445790','Registered office: see Companies House'],
 au:['SAMPLE FOR TESTING - NOT A REAL DOCUMENT','Australian body named on a contract','ABN 51 824 753 556','Public body: Australian Taxation Office'],
 id:['CONTOH UNTUK UJI - BUKAN DOKUMEN ASLI','Nomor Induk Berusaha (NIB) 9120001234567','Nomor PBG: SK-PBG-510301-12032024-001','Sertifikat SHM No. 01234 (contoh)']};
document.querySelectorAll('[data-pp-sample]').forEach(function(b){b.addEventListener('click',function(){var L=SAMPLES[b.getAttribute('data-pp-sample')];
 var c=document.createElement('canvas');c.width=1500;c.height=180+L.length*110;var g=c.getContext('2d');g.fillStyle='#fbfbf7';g.fillRect(0,0,c.width,c.height);g.strokeStyle='#9aa4ab';g.lineWidth=6;g.strokeRect(30,30,c.width-60,c.height-60);
 g.fillStyle='#1b2833';g.textBaseline='top';L.forEach(function(s,i){g.font=(i===0?'600 34px':'500 52px')+' Arial, Helvetica, sans-serif';g.fillStyle=i===0?'#8a2a10':'#1b2833';g.fillText(s,80,90+i*110)});
 show(c);sel.value=b.getAttribute('data-pp-sample')==='es'?'spa':b.getAttribute('data-pp-sample')==='id'?'ind':'eng';run()})});
// ---------- OCR (tesseract.js 5.1.1 from jsDelivr, loaded on first use) ----------
var TJS='${TJS}';
function lib(){return new Promise(function(ok,no){if(window.Tesseract)return ok(window.Tesseract);var s=document.createElement('script');s.src=TJS;s.integrity='sha384-GJqSu7vueQ9qN0E9yLPb3Wtpd7OrgK8KmYzC8T1IysG1bcvxvIO4qtYR/D3A991F';s.crossOrigin='anonymous';s.onload=function(){ok(window.Tesseract)};s.onerror=function(){no(new Error('script'))};document.head.appendChild(s)})}
function langs(){var l=sel.value;return l==='eng'?'eng':'eng+'+l}
function getWorker(){var L=langs();if(worker&&wlang===L)return Promise.resolve(worker);
 var old=worker;worker=null;if(old)old.terminate();say(T.st_load);setProg(0);
 return lib().then(function(Ts){return Ts.createWorker(L.split('+'),1,{workerPath:'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',corePath:'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1',
  logger:function(m){if(!m)return;if(/loading tesseract core|initializ/i.test(m.status||''))say(T.st_load);else if(/language/i.test(m.status||''))say(T.st_lang);else if(/recogniz/i.test(m.status||''))say(T.st_read);if(typeof m.progress==='number')setProg(m.progress)}})}).then(function(w){worker=w;wlang=L;return w})}
function gray(){var c=document.createElement('canvas');c.width=img.width;c.height=img.height;var g=c.getContext('2d');g.drawImage(img,0,0);var d=g.getImageData(0,0,c.width,c.height),a=d.data;
 for(var i=0;i<a.length;i+=4){var y=a[i]*.299+a[i+1]*.587+a[i+2]*.114;a[i]=a[i+1]=a[i+2]=y}g.putImageData(d,0,0);return c}
function run(){if(!img||busy)return;busy=true;btn.disabled=true;btn.setAttribute('aria-busy','true');
 getWorker().then(function(w){say(T.st_read);return w.recognize(gray())}).then(function(r){var d=r.data||{};words=(d.words||[]).map(function(x){return{t:x.text,b:x.bbox}});txt.value=d.text||'';txtW.hidden=false;find();
 }).catch(function(e){say(T.st_err.replace('{e}',String(e&&e.message||e).slice(0,80)));txtW.hidden=false}).then(function(){busy=false;btn.disabled=false;btn.removeAttribute('aria-busy');setProg(null)})}
$('ppAgain').addEventListener('click',function(){find()});
// ---------- patterns ----------
function digits(s){return s.replace(/[٠-٩]/g,function(c){return c.charCodeAt(0)-1632}).replace(/[۰-۹]/g,function(c){return c.charCodeAt(0)-1776}).replace(/[๐-๙]/g,function(c){return c.charCodeAt(0)-3664})}
function abnOk(s){if(!/^\d{11}$/.test(s))return false;var w=[10,1,3,5,7,9,11,13,15,17,19],t=0;for(var i=0;i<11;i++)t+=((i?+s[i]:+s[i]-1))*w[i];return t%89===0}
function mod97(s){var r=0;for(var i=0;i<s.length;i++){var c=s[i],v=/\d/.test(c)?c:String(c.charCodeAt(0)-55);for(var j=0;j<v.length;j++)r=(r*10+ +v[j])%97}return r}
function leiOk(s){return /^[0-9A-Z]{18}\d{2}$/.test(s)&&mod97(s)===1}
function cifOk(s){var m=/^([ABCDEFGHJNPQRSUVW])(\d{7})([0-9A-J])$/.exec(s);if(!m)return false;var d=m[2],a=0,b=0;for(var i=0;i<7;i++){var n=+d[i];if(i%2===0){n*=2;a+=Math.floor(n/10)+n%10}else b+=n}
 var c=(10-(a+b)%10)%10,L='JABCDEFGHI'[c];if(/[ABEH]/.test(m[1]))return m[3]===String(c);if(/[KPQSNW]/.test(m[1]))return m[3]===L;return m[3]===String(c)||m[3]===L}
var P=[
 ['es_refcat',/\b(\d{7})\s?([A-Z]{2}\d{4}[A-Z])\s?(\d{4})\s?([A-Z]{2})\b/g,function(m){return m[1]+m[2]+m[3]+m[4]}],
 ['es_refcat',/\b(\d{7}[A-Z]{2}\d{4}[A-Z])\b(?!\s?\d{4}\s?[A-Z]{2})/g,function(m){return m[1]}],
 ['es_lic',/licencia(?:\s+de\s+obras?|\s+urban[ií]stica|\s+municipal)?[^\n]{0,14}?\b(\d[\dA-Z\/.\-]{2,24})/gi,function(m){var v=m[1].replace(/[.\-\/]+$/,'');return (v.match(/\d/g)||[]).length>=3?v:null}],
 ['es_cif',/\b(?:C\.?I\.?F\.?|N\.?I\.?F\.?)\s*[:.]?\s*([A-HJNP-SUVW])[\s\-]?(\d{7})([0-9A-J])\b/gi,function(m){return (m[1]+m[2]+m[3]).toUpperCase()},cifOk],
 ['gb_co',/(?:company\s+(?:registration\s+)?(?:number|no\.?)|registered\s+number|registration\s+number|companies\s+house(?:\s+number)?|\bcrn\b)\s*[:.#]?\s*((?:SC|NI|OC|SO|NC|LP|SL|NL|FC|SF|R0)\d{6}|\d{6,8})\b/gi,function(m){var v=m[1].toUpperCase();return /^\d+$/.test(v)?('00000000'+v).slice(-8):v}],
 ['us_dobnow',/\b([BMQSXR]\d{8}-[A-Z]\d{1,2})\b/g,function(m){return m[1]}],
 ['us_bis',/(?:\bjob|\bDOB|\bNB|\bA1|\bA2)\b[^\d\n]{0,20}\b([1-5]\d{8})\b/gi,function(m){return m[1]}],
 ['us_md',/(?:permit|process)[^\d\n]{0,20}\b(20\d{8})\b/gi,function(m){return m[1]}],
 ['ae_proj',/(?:(?:rera|dld)\s+)?project\s*(?:no|number|id|registration(?:\s+no)?)\.?\s*[:#.]?\s*(\d{3,5})\b|رقم\s*المشروع\s*[:.]?\s*(\d{3,5})/gi,function(m){return m[1]||m[2]}],
 ['ae_oqood',/(?:oqood|interim\s+(?:real\s+estate\s+)?registration|أوقود|اوقود)[^A-Z0-9\n]{0,20}([A-Z0-9][A-Z0-9\-\/]{3,20})/gi,function(m){return /\d/.test(m[1])?m[1]:null}],
 ['ae_permit',/(?:trakheesi|madmoun|advertis(?:ing|ement)\s+permit|ترخيصي)[^\d\n]{0,20}(\d{6,12})\b/gi,function(m){return m[1]}],
 ['ae_brn',/\b(BRN|ORN)\s*[:.#]?\s*(\d{3,6})\b/g,function(m){return m[1]+' '+m[2]}],
 ['id_nib',/\bNIB\b[^\d\n]{0,25}(\d{13})\b/gi,function(m){return m[1]}],
 ['id_pbg',/\b((?:SK[\-\s]?)?PBG[\-\s]\d[\dA-Z\-\.\/]{8,40})/gi,function(m){return m[1].toUpperCase().replace(/\s/g,'-').replace(/[\-.\/]+$/,'')}],
 ['id_title',/\b(SHM|SHGB|HGB|HGU|SHP|Hak\s+Pakai)\b[^\d\n]{0,15}(\d[\d.\/\-]{1,20})/gi,function(m){return m[1].toUpperCase()+' '+m[2].replace(/[.\-\/]+$/,'')}],
 ['th_eia',/(ทส\s?\d{4}(?:\.\d{1,2})*\s?\/\s?\d{1,6})/g,function(m){return m[1].replace(/\s/g,'')}],
 ['th_condo',/(?:ทะเบียนอาคารชุด(?:\s*เลขที่)?|condominium\s+registration\s+(?:no\.?|number))\s*[:.]?\s*(\d{1,4}\/\d{4})/gi,function(m){return m[1]}],
 ['au_abn',/\bABN\b\s*[:.#]?\s*(\d{2}\s?\d{3}\s?\d{3}\s?\d{3})\b/g,function(m){return m[1].replace(/\s/g,'')},abnOk],
 ['lei',/\bLEI\b[^0-9A-Z\n]{0,12}([0-9A-Z]{18}\d{2})\b/g,function(m){return m[1]},leiOk]];
function find(){var s=digits(txt.value||'');cands=[];var seen={};
 P.forEach(function(p){var re=p[1],m;re.lastIndex=0;while((m=re.exec(s))){var v=p[2](m);if(!v)continue;var k=p[0]+'|'+v;if(seen[k])continue;
  if(p[0]==='es_refcat'&&cands.some(function(c){return c.type==='es_refcat'&&c.v.indexOf(v)===0}))continue;seen[k]=1;
  var ck=p[3]?(p[3](v)?'ok':'bad'):null;cands.push({type:p[0],v:v,ck:ck,box:box(v)});if(cands.length>=12)break}});
 render();draw();var n=cands.length;say(n?T.st_done.replace('{n}',n):T.st_none);found.hidden=!n}
function norm(s){return digits(String(s||'')).toUpperCase().replace(/[^0-9A-Z฀-๿]/g,'')}
function box(v){var nv=norm(v);if(nv.length<3)return null;var W=words.map(function(w){return{n:norm(w.t),b:w.b}}),U=function(a,x){return a?{x0:Math.min(a.x0,x.x0),y0:Math.min(a.y0,x.y0),x1:Math.max(a.x1,x.x1),y1:Math.max(a.y1,x.y1)}:{x0:x.x0,y0:x.y0,x1:x.x1,y1:x.y1}};
 for(var i=0;i<W.length;i++){if(!W[i].n)continue;if(W[i].n.length>=4&&W[i].n.indexOf(nv)>=0)return U(null,W[i].b);var c='',b=null;for(var j=i;j<W.length&&j<i+6;j++){c+=W[j].n;b=U(b,W[j].b);if(c===nv)return b;if(nv.indexOf(c)!==0)break}}return null}
// ---------- list + one-tap lookup ----------
function link(u){return u.charAt(0)==='/'?u:u}
function render(){list.innerHTML=cands.map(function(c,i){var r=ROW[c.type],live=r[2]==='live'||r[2]==='key';
 var meta='<span class="k-badge k-badge--plain">'+esc(T.m[r[1]])+'</span>'+(c.ck==='ok'?'<span class="k-badge k-badge--ok">'+esc(T.ck_ok)+'</span>':c.ck==='bad'?'<span class="k-badge k-badge--warn">'+esc(T.ck_bad)+'</span>':'<span class="k-badge k-badge--plain">'+esc(T.fmt)+'</span>');
 var act='';if(live)act+='<button type="button" class="k-btn k-btn--sm" data-lk="'+i+'"'+(c.ck==='bad'?' aria-describedby="ppck'+i+'"':'')+'>'+esc(T.lookup)+'</button>';
 if(r[2]==='ask')act+='<p class="k-small" style="margin:0">'+esc(T.ask.replace('{who}',T.who_town))+'</p>';
 else if(!live){var u=r[4];if(c.type==='lei')u='https://search.gleif.org/#/record/'+encodeURIComponent(c.v);act+='<p class="k-small" style="margin:0;width:100%">'+esc(T.manual)+'</p><a class="k-btn k-btn--sm k-btn--ghost" href="'+esc(link(u))+'" rel="noopener"'+(u.charAt(0)==='/'?'':' target="_blank"')+'>'+esc(r[3])+'</a>';if(c.type==='id_title')act+='<p class="k-small" style="margin:0;width:100%">'+esc(T.ask.replace('{who}',T.who_notary))+'</p>'}
 else act+='<a class="k-btn k-btn--sm k-btn--ghost" href="'+esc(r[4])+'" target="_blank" rel="noopener">'+esc(T.open)+'</a>';
 return '<li class="kpp-item" data-i="'+i+'"><div class="kpp-ih"><span class="kpp-n" aria-hidden="true">'+(i+1)+'</span><div><span class="kpp-k">'+esc(T.p[c.type])+'</span><span class="kpp-v" dir="ltr">'+esc(c.v)+'</span><div class="kpp-meta" id="ppck'+i+'">'+meta+'</div></div></div><div class="kpp-act">'+act+'</div><div class="kpp-res" aria-live="polite"></div></li>'}).join('');
 list.querySelectorAll('.kpp-item').forEach(function(li){var i=+li.getAttribute('data-i');li.addEventListener('mouseenter',function(){mark(i)});li.addEventListener('focusin',function(){mark(i)})});
 list.querySelectorAll('[data-lk]').forEach(function(b){b.addEventListener('click',function(){lookup(+b.getAttribute('data-lk'),b)})})}
function mark(i){list.querySelectorAll('.kpp-item').forEach(function(li){li.classList.toggle('on',+li.getAttribute('data-i')===i)});if(img)draw(i)}
function req(c){if(c.type==='au_abn')return{h:'/api/x/h/lookup?register=au-abn&q='+encodeURIComponent(c.v)};
 var b={};if(c.type==='es_refcat')b.refcat=c.v;else if(c.type==='gb_co'){b.q='company number '+c.v;b.country='GB'}else if(c.type==='ae_proj'){b.permit=c.v;b.country='AE'}else b.permit=c.v;return{lk:b}}
var SB={found:'ok',not_found:'plain',not_published:'plain',needs_key:'info',unavailable:'warn'};
function badge(s){return '<span class="k-badge k-badge--'+(SB[s]||'plain')+'">'+esc(T['r_'+s]||s)+'</span>'}
function host(u){try{return new URL(u).hostname.replace(/^www\./,'')}catch(e){return u}}
function fields(f){var o='';Object.keys(f||{}).forEach(function(k){var v=f[k];if(k==='found'||v==null||v===''||typeof v==='object'&&!Array.isArray(v))return;if(Array.isArray(v)){if(!v.length||typeof v[0]==='object')return;v=v.join(', ')}
 o+='<dt>'+esc(k.replace(/_/g,' ').replace(/^./,function(c){return c.toUpperCase()}))+'</dt><dd>'+esc(String(v).slice(0,200))+'</dd>'});return o?'<dl class="k-ledger">'+o+'</dl>':''}
function chk(c){var links='';if(c.source_url)links+='<a class="k-src" href="'+esc(c.official_page||c.source_url)+'" target="_blank" rel="noopener">'+esc(host(c.official_page||c.source_url))+'</a> ';if(c.manual_check)links+='<a class="k-src" href="'+esc(c.manual_check)+'" target="_blank" rel="noopener">'+esc(host(c.manual_check))+'</a> ';
 if(c.snapshot&&c.snapshot.raw_url)links+='<a class="k-src" href="'+esc(c.snapshot.raw_url)+'" target="_blank" rel="noopener">'+esc(T.raw)+'</a>';
 return '<div class="kpp-chk"><h4>'+badge(c.status)+'<span>'+esc(c.source)+'</span></h4>'+fields(c.fields)+(c.note?'<p>'+esc(c.note)+'</p>':'')+'<p>'+links+'</p></div>'}
function lookup(i,b){var c=cands[i],li=b.closest('.kpp-item'),out=li.querySelector('.kpp-res'),q=req(c);b.disabled=true;b.innerHTML='<span class="k-spin"></span> '+esc(T.looking);
 var p=q.h?fetch(q.h,{headers:{accept:'application/json'}}):fetch('/api/kb/lookup',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(q.lk)});
 p.then(function(r){if(r.status===429)throw new Error('rate');return r.json()}).then(function(d){var h='';
  if(q.h){var res=d.result||{},s=res.found?'found':res.found===false?'not_found':'unavailable';
   h=chk({status:s,source:d.register_name||'ABN Lookup',source_url:d.url,fields:res.found?res:{},note:d.error||null,snapshot:d.sha256?{raw_url:'/api/x/h/archive/'+d.sha256+'?raw=1'}:null})}
  else{(d.checks||[]).forEach(function(x){h+=chk(x)});if(d.seal&&d.seal.result_url)h+='<p class="k-small"><a class="k-src" href="'+esc(d.seal.result_url)+'" target="_blank" rel="noopener">'+esc(T.sealed)+'</a> <span class="k-hash"><code>sha256:'+esc(d.seal.root_sha256.slice(0,16))+'…</code></span></p>';if(!h)h='<p>'+esc(T.lk_err)+'</p>'}
  out.innerHTML='<div class="k-card k-card--sunken" style="padding:var(--k-3,12px)">'+h+'<p class="k-xs k-muted" style="margin:8px 0 0">'+esc(T.sent)+' '+esc(T.nf_note)+'</p></div>';b.remove()
 }).catch(function(e){out.innerHTML='<div class="k-alert k-alert--warn" role="status"><span>'+esc(e&&e.message==='rate'?T.rate:T.lk_err)+'</span></div>';b.disabled=false;b.textContent=T.lookup})}
})();`;

async function assemble(shellRes, lang) {
  const t = tr(lang), path = PATH, url = ORIGIN + pre(lang) + path;
  const alts = LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + path + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + path + '">';
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebApplication', name: 'Kolaboro ' + t.title, url, description: t.desc, inLanguage: lang, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
    { '@type': 'BreadcrumbList', itemListElement: [['Kolaboro', ORIGIN + pre(lang) + '/'], [t.crumb_tools, ORIGIN + '/tools/'], [t.title, url]].map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x[0], item: x[1] })) }] };
  const tags = '<title>' + esc(t.title) + ' | Kolaboro</title><meta name="description" content="' + esc(t.desc) + '"><link rel="canonical" href="' + url + '">' + alts +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="Kolaboro"><meta property="og:title" content="' + esc(t.title) + ' | Kolaboro"><meta property="og:description" content="' + esc(t.desc) + '"><meta property="og:url" content="' + url + '"><meta name="twitter:card" content="summary">' +
    '<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>' +
    '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' + CSS;
  const res = new HTMLRewriter()
    .on('title', { element(e) { e.remove(); } })
    .on('meta[name="description"],meta[name="robots"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],link[rel="alternate"][hreflang]', { element(e) { e.remove(); } })
    .on('script[type="application/ld+json"]', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setAttribute('data-clarity-mask', 'True'); e.setInnerContent(body(lang) + '<script>' + JS + '</script>', { html: true }); } })
    .on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + path); } })
    .transform(new Response(shellRes.body, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
  return await res.text();
}

export async function handle(req, u, env, ctx, shell) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return null;
  const m = u.pathname.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?tools\/permit-photo(\/?)$/); if (!m) return null;
  if (!m[2]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
  const lang = m[1] || 'en';
  const sh = await shell(pre(lang) + '/how-we-score/');
  if (!sh || sh.status !== 200) return null;
  return new Response(await assemble(sh, lang), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' } });
}
