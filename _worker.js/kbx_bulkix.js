// kolaboro.com bulk check against the public index (batch 21, n21d).
//   GET /tools/bulk-check/ (8 languages)   paste or upload up to 100 project names, developer names or links; the browser matches
//                                          them against our public index and shows, per row: tracked or not, link, handover date on
//                                          record, moved dates, permit number published, website health, lookalike websites; CSV export
//   GET /api/x/bulkix                      the compact index the page downloads once (public data only, CC BY 4.0)
// Nothing typed or uploaded leaves the browser: the page fetches the index and matches locally. No AI. This is not the bulk REGISTER
// check at /bulk-check/ (kbx_bulk.js: cadastral references, permit and company numbers looked up in official registers); the two link
// to each other.
export const PATHS = /^\/api\/x\/bulkix\/?$/;
export const PAGE = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?tools\/bulk-check\/?$/;
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MAX = 100, V = 'n21d-1';

// ------------------------------------------------------------------------------------------------ index
const MEMO = {};
async function file(env, name) {
  const m = MEMO[name]; if (m && Date.now() - m.t < 600000) return m.v;
  let r = null;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); } catch (e) { r = null; }
  if (!r || !r.ok) r = await fetch(ORIGIN + '/data/' + name, { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!r.ok) throw new Error(name + ' ' + r.status);
  const v = await r.json(); MEMO[name] = { t: Date.now(), v }; return v;
}
const pathOf = u => { try { const x = new URL(u); return (x.hostname.replace(/^www\./, '') + x.pathname).toLowerCase().replace(/\/+$/, ''); } catch (e) { return ''; } };
let NM = null, BUILT = null;
export async function buildIndex(env) {
  if (!NM) NM = await import('./kbx_named.js');
  const ix = await NM.data(env);
  const [web, look] = await Promise.all([file(env, 'web-health.json').catch(() => null), file(env, 'lookalikes.json').catch(() => null)]);
  if (BUILT && BUILT.ix === ix && BUILT.web === web && BUILT.look === look) return BUILT.v;
  const wd = (web && web.d) || {}, w = {}, l = {};
  for (const it of (look && look.items) || []) { const m = String(it.url || '').match(/^\/developers\/([a-z0-9-]+)\/$/); if (m) l[m[1]] = (l[m[1]] || 0) + 1; }
  const health = h => { const d = wd[h]; if (!d) return false; if (!w[h]) w[h] = [String(d.h || '-').slice(-1), d.s || 0, d.ck || (web && web.updated) || '']; return true; };
  const hostsOf = x => [...new Set([x.url, x.du].filter(u => NM.okHttp(u) && !NM.isListing(u)).map(NM.host).filter(Boolean))];
  const p = ix.P.map(x => {
    const hs = hostsOf(x), ho = NM.handoverOf(ix, x), pr = ix.prom[x.id] || [];
    const dvs = x.dvs && ix.devs.has(x.dvs) ? x.dvs : '';
    return [x.s, x.n, x.id, x.dv || '', dvs, x.mk || '', x.co || '', [...new Set([x.url, x.du].filter(NM.okHttp).map(pathOf).filter(Boolean))], hs,
      ho ? String(ho.d) : '', pr.reduce((a, q) => a + (q.mv || 0), 0), x.pn ? 1 : 0, hs.find(health) || ''];
  });
  // a website that carries projects of several developers (a marketplace we do not list as a portal) is not any one developer's website
  const hostDevs = {}; for (const x of ix.P) for (const h of hostsOf(x)) (hostDevs[h] = hostDevs[h] || new Set()).add(x.dvs || x.dv || x.id);
  const d = [...ix.devs.values()].map(v => {
    const xs = v.ids.map(i => ix.byId.get(i)).filter(Boolean), hs = [...new Set(xs.flatMap(hostsOf))].filter(h => hostDevs[h].size === 1);
    const cnt = {}; for (const x of xs) for (const h of hostsOf(x)) cnt[h] = (cnt[h] || 0) + 1;
    hs.sort((a, b) => cnt[b] - cnt[a]);
    return [v.s, v.n, xs.length, [...new Set(xs.map(x => x.mk).filter(Boolean))].slice(0, 4).join(', '), hs.slice(0, 12),
      xs.reduce((a, x) => a + (ix.prom[x.id] || []).reduce((b, q) => b + (q.mv || 0), 0), 0), xs.filter(x => x.pn).length, hs.find(health) || ''];
  });
  const v = { version: 'bulk-index-1', updated: NM.iso(ix.updated) || ix.updated, licence: 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)', counts: { projects: p.length, developers: d.length },
    sources: { projects: ORIGIN + '/api/v1/projects', promises: ORIGIN + '/data/promises.json', website_health: { url: ORIGIN + '/data/web-health.json', updated: (web && web.updated) || null }, lookalikes: { url: ORIGIN + '/data/lookalikes.json', updated: (look && look.updated) || null, window_days: (look && look.window_days) || null } },
    fields: { p: ['slug', 'name', 'id', 'developer', 'developer_slug', 'market', 'country', 'tracked_pages (host and path)', 'official_hosts', 'handover_on_record', 'times_dates_moved', 'permit_number_published (1 or 0)', 'health_host'],
      d: ['slug', 'name', 'projects', 'markets', 'official_hosts', 'times_dates_moved', 'projects_with_permit_number', 'health_host'],
      w: 'host -> [last daily check: u answered, b answered with a 4xx status, x server error, 0 no answer, - not checked; HTTP status; date checked]', l: 'developer_slug -> lookalike websites recorded' },
    p, d, w, l };
  BUILT = { ix, web, look, v }; return v;
}
export async function handle(req, u, env, ctx) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('{"error":"method"}', { status: 405, headers: { 'content-type': 'application/json' } });
  const ck = new Request(ORIGIN + '/__bulkix/' + V);
  try { const hit = await caches.default.match(ck); if (hit) return hit; } catch (e) {}
  let v; try { v = await buildIndex(env); } catch (e) { return new Response('{"error":"unavailable"}', { status: 503, headers: { 'content-type': 'application/json', 'retry-after': '60', 'cache-control': 'no-store' } }); }
  const r = new Response(JSON.stringify(v), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=900', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' } });
  if (ctx && ctx.waitUntil) ctx.waitUntil(caches.default.put(ck, r.clone()).catch(() => {}));
  return r;
}

// ------------------------------------------------------------------------------------------------ page
const T = {
  en: { title: 'Bulk check: which projects on your list are tracked', desc: 'Paste or upload up to 100 project names, developer names or links. Your browser matches them against Kolaboro\'s public index: handover date on record, moved dates, permit number, website health, lookalike websites. Export CSV. Nothing is uploaded.',
    tools: 'Tools', crumb: 'Bulk check', h1: 'Bulk check for agents and lenders', lead: 'Paste or upload up to 100 project names, developer names or links. Your browser matches them against our public index and shows what is on record for each one.',
    priv_b: 'Nothing is uploaded.', priv: 'The index is downloaded once and the matching runs on this device. Your list never leaves your browser, and no AI is used.',
    h_in: 'Your list', in_label: 'One project, developer or link per line (or CSV rows)', ph: 'Project name\nDeveloper name\nhttps://developer-website.example/project', file: 'Choose a CSV or text file', drop: 'or drop the file on the box', run: 'Check the list', sample: 'Fill in an example', clear: 'Clear',
    h_res: 'Results', exp: 'Download the results (CSV)', h_how: 'How to read the columns',
    how: ['Match: an exact name or link first. A close match is shown for you to confirm and is never counted as tracked.', 'Handover on record: the date the developer publishes, as we last read it. Dates moved: how many times a dated promise was pushed later in the copies we keep.', 'Permit number: whether the developer\'s page or an official register publishes a permit or licence number. Published does not mean verified.', 'Website: one request a day to the homepage of the official website. Lookalike websites: names that resemble the developer\'s website, registered or first certified in the last 365 days. A resemblance is a fact about the name only.', 'Not tracked means only that the project is not in our index yet. It says nothing about the project.'],
    src: 'Data: Kolaboro public index, CC BY 4.0, built from developer pages and official registers.', src_a: 'The same index as JSON', reg: 'Have cadastral references, permit numbers or company numbers instead?', reg_a: 'Bulk register check',
    j: { load: 'Loading the index…', err: 'The index could not be loaded. Try again in a minute.', empty: 'Paste at least one name or link.', cut: 'Only the first {max} rows were checked. Your list has {n}.', done: '{n} rows checked against {p} projects and {d} developers. Index of {date}.', toobig: 'This file is larger than 2 MB. Paste the rows instead.',
      s_tracked: 'tracked', s_close: 'close match to confirm', s_not: 'not tracked', th: ['Your row', 'Match', 'Handover on record', 'Dates moved', 'Permit number', 'Website', 'Lookalike websites'],
      proj: 'Project', dev: 'Developer', tracked: 'Tracked', close: 'Close match, please confirm', not: 'Not tracked', multi: '{n} projects share this name', site: '{n} projects on this website', check: 'Check it now', none: 'Not published', dprojects: '{n} projects tracked',
      pub: 'Published', notpub: 'Not published', dperm: '{k} of {n} publish one', h_u: 'Answered (HTTP {s})', h_b: 'Answered with HTTP {s}, often a bot wall', h_x: 'Server error (HTTP {s})', h_0: 'No answer', h_n: 'Not checked (robots.txt)', h_none: 'Not in the daily check', ck: 'checked {d}', look: '{n} recorded', look0: 'None recorded', web_d: 'Website checks of {a}. Lookalike list of {b} (Certificate Transparency through crt.sh, registry RDAP, DNS).' } },
  es: { title: 'Comprobación en lote: qué proyectos de tu lista seguimos', desc: 'Pega o sube hasta 100 nombres de proyectos, promotores o enlaces. Tu navegador los compara con el índice público de Kolaboro: fecha de entrega registrada, fechas aplazadas, número de licencia, estado de la web y webs parecidas. Exporta CSV. No se sube nada.',
    tools: 'Herramientas', crumb: 'Comprobación en lote', h1: 'Comprobación en lote para agentes y entidades financieras', lead: 'Pega o sube hasta 100 nombres de proyectos, promotores o enlaces. Tu navegador los compara con nuestro índice público y muestra lo que consta de cada uno.',
    priv_b: 'No se sube nada.', priv: 'El índice se descarga una vez y la comparación se hace en este dispositivo. Tu lista no sale de tu navegador y no se usa IA.',
    h_in: 'Tu lista', in_label: 'Un proyecto, promotor o enlace por línea (o filas CSV)', ph: 'Nombre del proyecto\nNombre del promotor\nhttps://web-del-promotor.example/proyecto', file: 'Elegir un archivo CSV o de texto', drop: 'o suelta el archivo sobre el cuadro', run: 'Comprobar la lista', sample: 'Rellenar un ejemplo', clear: 'Borrar',
    h_res: 'Resultados', exp: 'Descargar los resultados (CSV)', h_how: 'Cómo leer las columnas',
    how: ['Coincidencia: primero un nombre o enlace exacto. Una coincidencia aproximada se muestra para que la confirmes y nunca cuenta como seguida.', 'Entrega registrada: la fecha que publica el promotor, tal como la leímos por última vez. Fechas aplazadas: cuántas veces una promesa con fecha se retrasó en las copias que guardamos.', 'Número de licencia: si la página del promotor o un registro oficial publica un número de licencia o permiso. Publicado no significa verificado.', 'Web: una petición al día a la portada de la web oficial. Webs parecidas: nombres que se parecen a la web del promotor, registrados o con primer certificado en los últimos 365 días. El parecido es un dato sobre el nombre, nada más.', 'No seguido solo significa que el proyecto aún no está en nuestro índice. No dice nada sobre el proyecto.'],
    src: 'Datos: índice público de Kolaboro, CC BY 4.0, elaborado con páginas de promotores y registros oficiales.', src_a: 'El mismo índice en JSON', reg: '¿Tienes referencias catastrales, números de licencia o de empresa?', reg_a: 'Comprobación en lote en registros',
    j: { load: 'Cargando el índice…', err: 'No se pudo cargar el índice. Inténtalo de nuevo en un minuto.', empty: 'Pega al menos un nombre o enlace.', cut: 'Solo se comprobaron las primeras {max} filas. Tu lista tiene {n}.', done: '{n} filas comprobadas con {p} proyectos y {d} promotores. Índice del {date}.', toobig: 'El archivo supera los 2 MB. Pega las filas en su lugar.',
      s_tracked: 'seguidos', s_close: 'coincidencias por confirmar', s_not: 'no seguidos', th: ['Tu fila', 'Coincidencia', 'Entrega registrada', 'Fechas aplazadas', 'Número de licencia', 'Web', 'Webs parecidas'],
      proj: 'Proyecto', dev: 'Promotor', tracked: 'Seguido', close: 'Coincidencia aproximada, confírmala', not: 'No seguido', multi: '{n} proyectos comparten este nombre', site: '{n} proyectos en esta web', check: 'Comprobarlo ahora', none: 'No publicada', dprojects: '{n} proyectos seguidos',
      pub: 'Publicado', notpub: 'No publicado', dperm: '{k} de {n} lo publican', h_u: 'Respondió (HTTP {s})', h_b: 'Respondió con HTTP {s}, a menudo un filtro antibots', h_x: 'Error del servidor (HTTP {s})', h_0: 'Sin respuesta', h_n: 'No comprobada (robots.txt)', h_none: 'Fuera de la comprobación diaria', ck: 'comprobada el {d}', look: '{n} registradas', look0: 'Ninguna registrada', web_d: 'Comprobaciones de webs del {a}. Lista de webs parecidas del {b} (Certificate Transparency vía crt.sh, RDAP de los registros, DNS).' } },
  de: { title: 'Sammelprüfung: Welche Projekte Ihrer Liste wir verfolgen', desc: 'Bis zu 100 Projektnamen, Bauträgernamen oder Links einfügen oder hochladen. Ihr Browser gleicht sie mit dem öffentlichen Kolaboro-Index ab: erfasster Übergabetermin, verschobene Termine, Genehmigungsnummer, Website-Zustand, ähnliche Websites. CSV-Export. Nichts wird hochgeladen.',
    tools: 'Werkzeuge', crumb: 'Sammelprüfung', h1: 'Sammelprüfung für Makler und Kreditgeber', lead: 'Fügen Sie bis zu 100 Projektnamen, Bauträgernamen oder Links ein oder laden Sie sie hoch. Ihr Browser gleicht sie mit unserem öffentlichen Index ab und zeigt, was zu jedem Eintrag erfasst ist.',
    priv_b: 'Nichts wird hochgeladen.', priv: 'Der Index wird einmal geladen, der Abgleich läuft auf diesem Gerät. Ihre Liste verlässt den Browser nicht, und es wird keine KI verwendet.',
    h_in: 'Ihre Liste', in_label: 'Ein Projekt, Bauträger oder Link pro Zeile (oder CSV-Zeilen)', ph: 'Projektname\nName des Bauträgers\nhttps://bautraeger-website.example/projekt', file: 'CSV- oder Textdatei wählen', drop: 'oder die Datei auf das Feld ziehen', run: 'Liste prüfen', sample: 'Beispiel einfügen', clear: 'Leeren',
    h_res: 'Ergebnisse', exp: 'Ergebnisse herunterladen (CSV)', h_how: 'So lesen Sie die Spalten',
    how: ['Treffer: zuerst ein exakter Name oder Link. Ein ähnlicher Treffer wird zur Bestätigung gezeigt und zählt nie als verfolgt.', 'Erfasste Übergabe: der Termin, den der Bauträger veröffentlicht, wie wir ihn zuletzt gelesen haben. Verschobene Termine: wie oft eine datierte Zusage in unseren Kopien nach hinten verschoben wurde.', 'Genehmigungsnummer: ob die Seite des Bauträgers oder ein amtliches Register eine Genehmigungs- oder Lizenznummer veröffentlicht. Veröffentlicht heißt nicht geprüft.', 'Website: eine Anfrage pro Tag an die Startseite der offiziellen Website. Ähnliche Websites: Namen, die der Website des Bauträgers ähneln und in den letzten 365 Tagen registriert oder erstmals zertifiziert wurden. Eine Ähnlichkeit ist nur eine Tatsache über den Namen.', 'Nicht verfolgt heißt nur, dass das Projekt noch nicht in unserem Index steht. Es sagt nichts über das Projekt aus.'],
    src: 'Daten: öffentlicher Kolaboro-Index, CC BY 4.0, erstellt aus Bauträgerseiten und amtlichen Registern.', src_a: 'Derselbe Index als JSON', reg: 'Sie haben Katasterreferenzen, Genehmigungs- oder Firmennummern?', reg_a: 'Sammelprüfung in Registern',
    j: { load: 'Index wird geladen…', err: 'Der Index konnte nicht geladen werden. Bitte in einer Minute erneut versuchen.', empty: 'Fügen Sie mindestens einen Namen oder Link ein.', cut: 'Nur die ersten {max} Zeilen wurden geprüft. Ihre Liste hat {n}.', done: '{n} Zeilen mit {p} Projekten und {d} Bauträgern abgeglichen. Index vom {date}.', toobig: 'Die Datei ist größer als 2 MB. Fügen Sie die Zeilen stattdessen ein.',
      s_tracked: 'verfolgt', s_close: 'ähnliche Treffer zum Bestätigen', s_not: 'nicht verfolgt', th: ['Ihre Zeile', 'Treffer', 'Erfasste Übergabe', 'Verschobene Termine', 'Genehmigungsnummer', 'Website', 'Ähnliche Websites'],
      proj: 'Projekt', dev: 'Bauträger', tracked: 'Verfolgt', close: 'Ähnlicher Treffer, bitte bestätigen', not: 'Nicht verfolgt', multi: '{n} Projekte tragen diesen Namen', site: '{n} Projekte auf dieser Website', check: 'Jetzt prüfen', none: 'Nicht veröffentlicht', dprojects: '{n} Projekte verfolgt',
      pub: 'Veröffentlicht', notpub: 'Nicht veröffentlicht', dperm: '{k} von {n} veröffentlichen eine', h_u: 'Hat geantwortet (HTTP {s})', h_b: 'Hat mit HTTP {s} geantwortet, oft eine Bot-Sperre', h_x: 'Serverfehler (HTTP {s})', h_0: 'Keine Antwort', h_n: 'Nicht geprüft (robots.txt)', h_none: 'Nicht in der täglichen Prüfung', ck: 'geprüft am {d}', look: '{n} erfasst', look0: 'Keine erfasst', web_d: 'Website-Prüfungen vom {a}. Liste ähnlicher Websites vom {b} (Certificate Transparency über crt.sh, Registry-RDAP, DNS).' } },
  fr: { title: 'Vérification en lot : quels projets de votre liste nous suivons', desc: 'Collez ou importez jusqu’à 100 noms de projets, de promoteurs ou liens. Votre navigateur les compare à l’index public de Kolaboro : date de livraison enregistrée, dates repoussées, numéro de permis, état du site, sites ressemblants. Export CSV. Rien n’est envoyé.',
    tools: 'Outils', crumb: 'Vérification en lot', h1: 'Vérification en lot pour agents et prêteurs', lead: 'Collez ou importez jusqu’à 100 noms de projets, de promoteurs ou liens. Votre navigateur les compare à notre index public et montre ce qui est enregistré pour chacun.',
    priv_b: 'Rien n’est envoyé.', priv: 'L’index est téléchargé une fois et la comparaison se fait sur cet appareil. Votre liste ne quitte pas votre navigateur et aucune IA n’est utilisée.',
    h_in: 'Votre liste', in_label: 'Un projet, un promoteur ou un lien par ligne (ou des lignes CSV)', ph: 'Nom du projet\nNom du promoteur\nhttps://site-du-promoteur.example/projet', file: 'Choisir un fichier CSV ou texte', drop: 'ou déposez le fichier sur la zone', run: 'Vérifier la liste', sample: 'Remplir un exemple', clear: 'Effacer',
    h_res: 'Résultats', exp: 'Télécharger les résultats (CSV)', h_how: 'Comment lire les colonnes',
    how: ['Correspondance : d’abord un nom ou un lien exact. Une correspondance proche est montrée pour confirmation et n’est jamais comptée comme suivie.', 'Livraison enregistrée : la date que publie le promoteur, telle que nous l’avons lue en dernier. Dates repoussées : combien de fois une promesse datée a été reportée dans les copies que nous gardons.', 'Numéro de permis : si la page du promoteur ou un registre officiel publie un numéro de permis ou de licence. Publié ne veut pas dire vérifié.', 'Site : une requête par jour vers la page d’accueil du site officiel. Sites ressemblants : des noms qui ressemblent au site du promoteur, enregistrés ou certifiés pour la première fois dans les 365 derniers jours. Une ressemblance est un fait sur le nom, rien de plus.', 'Non suivi veut seulement dire que le projet n’est pas encore dans notre index. Cela ne dit rien du projet.'],
    src: 'Données : index public de Kolaboro, CC BY 4.0, construit à partir des pages des promoteurs et des registres officiels.', src_a: 'Le même index en JSON', reg: 'Vous avez plutôt des références cadastrales, des numéros de permis ou de société ?', reg_a: 'Vérification en lot dans les registres',
    j: { load: 'Chargement de l’index…', err: 'L’index n’a pas pu être chargé. Réessayez dans une minute.', empty: 'Collez au moins un nom ou un lien.', cut: 'Seules les {max} premières lignes ont été vérifiées. Votre liste en compte {n}.', done: '{n} lignes comparées à {p} projets et {d} promoteurs. Index du {date}.', toobig: 'Ce fichier dépasse 2 Mo. Collez plutôt les lignes.',
      s_tracked: 'suivis', s_close: 'correspondances à confirmer', s_not: 'non suivis', th: ['Votre ligne', 'Correspondance', 'Livraison enregistrée', 'Dates repoussées', 'Numéro de permis', 'Site', 'Sites ressemblants'],
      proj: 'Projet', dev: 'Promoteur', tracked: 'Suivi', close: 'Correspondance proche, à confirmer', not: 'Non suivi', multi: '{n} projets portent ce nom', site: '{n} projets sur ce site', check: 'Le vérifier maintenant', none: 'Non publiée', dprojects: '{n} projets suivis',
      pub: 'Publié', notpub: 'Non publié', dperm: '{k} sur {n} en publient un', h_u: 'A répondu (HTTP {s})', h_b: 'A répondu avec HTTP {s}, souvent un filtre anti-robots', h_x: 'Erreur du serveur (HTTP {s})', h_0: 'Pas de réponse', h_n: 'Non vérifié (robots.txt)', h_none: 'Hors de la vérification quotidienne', ck: 'vérifié le {d}', look: '{n} enregistrés', look0: 'Aucun enregistré', web_d: 'Vérifications des sites du {a}. Liste des sites ressemblants du {b} (Certificate Transparency via crt.sh, RDAP des registres, DNS).' } },
  nl: { title: 'Bulkcheck: welke projecten op je lijst wij volgen', desc: 'Plak of upload tot 100 projectnamen, ontwikkelaars of links. Je browser vergelijkt ze met de openbare index van Kolaboro: vastgelegde opleverdatum, verschoven data, vergunningsnummer, staat van de website, gelijkende websites. CSV-export. Er wordt niets geüpload.',
    tools: 'Tools', crumb: 'Bulkcheck', h1: 'Bulkcheck voor makelaars en kredietverstrekkers', lead: 'Plak of upload tot 100 projectnamen, ontwikkelaars of links. Je browser vergelijkt ze met onze openbare index en toont wat er per regel is vastgelegd.',
    priv_b: 'Er wordt niets geüpload.', priv: 'De index wordt één keer gedownload en het vergelijken gebeurt op dit apparaat. Je lijst verlaat je browser niet en er wordt geen AI gebruikt.',
    h_in: 'Je lijst', in_label: 'Eén project, ontwikkelaar of link per regel (of CSV-rijen)', ph: 'Projectnaam\nNaam van de ontwikkelaar\nhttps://website-ontwikkelaar.example/project', file: 'Kies een CSV- of tekstbestand', drop: 'of sleep het bestand op het vak', run: 'Lijst controleren', sample: 'Voorbeeld invullen', clear: 'Wissen',
    h_res: 'Resultaten', exp: 'Resultaten downloaden (CSV)', h_how: 'Zo lees je de kolommen',
    how: ['Match: eerst een exacte naam of link. Een gelijkende match wordt getoond ter bevestiging en telt nooit als gevolgd.', 'Vastgelegde oplevering: de datum die de ontwikkelaar publiceert, zoals wij die het laatst lazen. Verschoven data: hoe vaak een gedateerde belofte in onze kopieën naar later is verschoven.', 'Vergunningsnummer: of de pagina van de ontwikkelaar of een officieel register een vergunnings- of licentienummer publiceert. Gepubliceerd betekent niet geverifieerd.', 'Website: één verzoek per dag aan de homepage van de officiële website. Gelijkende websites: namen die op de website van de ontwikkelaar lijken en in de laatste 365 dagen zijn geregistreerd of voor het eerst een certificaat kregen. Een gelijkenis is alleen een feit over de naam.', 'Niet gevolgd betekent alleen dat het project nog niet in onze index staat. Het zegt niets over het project.'],
    src: 'Gegevens: openbare index van Kolaboro, CC BY 4.0, opgebouwd uit pagina’s van ontwikkelaars en officiële registers.', src_a: 'Dezelfde index als JSON', reg: 'Heb je kadastrale referenties, vergunnings- of bedrijfsnummers?', reg_a: 'Bulkcheck in registers',
    j: { load: 'Index laden…', err: 'De index kon niet worden geladen. Probeer het over een minuut opnieuw.', empty: 'Plak minstens één naam of link.', cut: 'Alleen de eerste {max} rijen zijn gecontroleerd. Je lijst heeft er {n}.', done: '{n} rijen vergeleken met {p} projecten en {d} ontwikkelaars. Index van {date}.', toobig: 'Dit bestand is groter dan 2 MB. Plak de rijen in plaats daarvan.',
      s_tracked: 'gevolgd', s_close: 'gelijkende matches ter bevestiging', s_not: 'niet gevolgd', th: ['Jouw rij', 'Match', 'Vastgelegde oplevering', 'Verschoven data', 'Vergunningsnummer', 'Website', 'Gelijkende websites'],
      proj: 'Project', dev: 'Ontwikkelaar', tracked: 'Gevolgd', close: 'Gelijkende match, graag bevestigen', not: 'Niet gevolgd', multi: '{n} projecten delen deze naam', site: '{n} projecten op deze website', check: 'Nu controleren', none: 'Niet gepubliceerd', dprojects: '{n} projecten gevolgd',
      pub: 'Gepubliceerd', notpub: 'Niet gepubliceerd', dperm: '{k} van {n} publiceren er een', h_u: 'Antwoordde (HTTP {s})', h_b: 'Antwoordde met HTTP {s}, vaak een botfilter', h_x: 'Serverfout (HTTP {s})', h_0: 'Geen antwoord', h_n: 'Niet gecontroleerd (robots.txt)', h_none: 'Niet in de dagelijkse controle', ck: 'gecontroleerd op {d}', look: '{n} vastgelegd', look0: 'Geen vastgelegd', web_d: 'Websitecontroles van {a}. Lijst van gelijkende websites van {b} (Certificate Transparency via crt.sh, registry-RDAP, DNS).' } },
  ru: { title: 'Пакетная проверка: какие проекты из вашего списка мы отслеживаем', desc: 'Вставьте или загрузите до 100 названий проектов, застройщиков или ссылок. Браузер сверит их с открытым индексом Kolaboro: срок сдачи в записи, перенесённые даты, номер разрешения, состояние сайта, похожие сайты. Экспорт в CSV. Ничего не отправляется.',
    tools: 'Инструменты', crumb: 'Пакетная проверка', h1: 'Пакетная проверка для агентов и кредиторов', lead: 'Вставьте или загрузите до 100 названий проектов, застройщиков или ссылок. Браузер сверит их с нашим открытым индексом и покажет, что записано по каждой строке.',
    priv_b: 'Ничего не отправляется.', priv: 'Индекс загружается один раз, сверка идёт на этом устройстве. Ваш список не покидает браузер, ИИ не используется.',
    h_in: 'Ваш список', in_label: 'Один проект, застройщик или ссылка в строке (или строки CSV)', ph: 'Название проекта\nНазвание застройщика\nhttps://sait-zastroyshchika.example/proekt', file: 'Выбрать файл CSV или текстовый файл', drop: 'или перетащите файл в поле', run: 'Проверить список', sample: 'Подставить пример', clear: 'Очистить',
    h_res: 'Результаты', exp: 'Скачать результаты (CSV)', h_how: 'Как читать столбцы',
    how: ['Совпадение: сначала точное название или ссылка. Близкое совпадение показывается для подтверждения и никогда не считается отслеживаемым.', 'Срок сдачи в записи: дата, которую публикует застройщик, как мы прочитали её в последний раз. Перенесённые даты: сколько раз обещание с датой сдвигалось на более поздний срок в наших копиях.', 'Номер разрешения: публикует ли страница застройщика или официальный реестр номер разрешения или лицензии. Опубликован не значит проверен.', 'Сайт: один запрос в день к главной странице официального сайта. Похожие сайты: имена, похожие на сайт застройщика, зарегистрированные или впервые получившие сертификат за последние 365 дней. Сходство это факт только об имени.', 'Не отслеживается означает лишь, что проекта пока нет в нашем индексе. О самом проекте это ничего не говорит.'],
    src: 'Данные: открытый индекс Kolaboro, CC BY 4.0, собранный по страницам застройщиков и официальным реестрам.', src_a: 'Тот же индекс в JSON', reg: 'У вас кадастровые номера, номера разрешений или компаний?', reg_a: 'Пакетная проверка по реестрам',
    j: { load: 'Загружаем индекс…', err: 'Не удалось загрузить индекс. Повторите через минуту.', empty: 'Вставьте хотя бы одно название или ссылку.', cut: 'Проверены только первые {max} строк. В вашем списке их {n}.', done: 'Строк проверено: {n}. Проектов в индексе: {p}, застройщиков: {d}. Индекс от {date}.', toobig: 'Файл больше 2 МБ. Вставьте строки вручную.',
      s_tracked: 'отслеживается', s_close: 'близкие совпадения для подтверждения', s_not: 'не отслеживается', th: ['Ваша строка', 'Совпадение', 'Срок сдачи в записи', 'Перенесённые даты', 'Номер разрешения', 'Сайт', 'Похожие сайты'],
      proj: 'Проект', dev: 'Застройщик', tracked: 'Отслеживается', close: 'Близкое совпадение, подтвердите', not: 'Не отслеживается', multi: 'Проектов с этим названием: {n}', site: 'Проектов на этом сайте: {n}', check: 'Проверить сейчас', none: 'Не опубликован', dprojects: 'Отслеживаемых проектов: {n}',
      pub: 'Опубликован', notpub: 'Не опубликован', dperm: 'Публикуют: {k} из {n}', h_u: 'Ответил (HTTP {s})', h_b: 'Ответил с HTTP {s}, часто это защита от ботов', h_x: 'Ошибка сервера (HTTP {s})', h_0: 'Нет ответа', h_n: 'Не проверялся (robots.txt)', h_none: 'Нет в ежедневной проверке', ck: 'проверен {d}', look: 'В записи: {n}', look0: 'Не найдено', web_d: 'Проверки сайтов от {a}. Список похожих сайтов от {b} (Certificate Transparency через crt.sh, RDAP реестров, DNS).' } },
  zh: { title: '批量核查：你名单上的哪些项目在我们的跟踪范围内', desc: '粘贴或上传最多 100 个项目名称、开发商名称或链接。浏览器会将它们与 Kolaboro 的公开索引比对：记录在案的交付日期、推迟次数、许可证号、网站状态、相似网站。可导出 CSV。不上传任何内容。',
    tools: '工具', crumb: '批量核查', h1: '面向中介和贷款机构的批量核查', lead: '粘贴或上传最多 100 个项目名称、开发商名称或链接。浏览器会将它们与我们的公开索引比对，并显示每一行的在案记录。',
    priv_b: '不上传任何内容。', priv: '索引只下载一次，比对在本设备上完成。你的名单不会离开浏览器，也不使用 AI。',
    h_in: '你的名单', in_label: '每行一个项目、开发商或链接（或 CSV 行）', ph: '项目名称\n开发商名称\nhttps://developer-website.example/project', file: '选择 CSV 或文本文件', drop: '或把文件拖到输入框上', run: '核查名单', sample: '填入示例', clear: '清空',
    h_res: '结果', exp: '下载结果（CSV）', h_how: '如何阅读各列',
    how: ['匹配：先按完全相同的名称或链接。相近的匹配会显示出来供你确认，绝不计为已跟踪。', '在案交付日期：开发商公布的日期，以我们最近一次读取为准。日期推迟：在我们保存的副本中，带日期的承诺被推后的次数。', '许可证号：开发商页面或官方登记处是否公布了许可证或执照号码。已公布不代表已核实。', '网站：每天向官方网站首页发出一次请求。相似网站：与开发商网站名称相似、在过去 365 天内注册或首次获得证书的域名。相似只是关于名称的事实。', '未跟踪仅表示该项目尚未进入我们的索引，并不说明项目本身的任何情况。'],
    src: '数据：Kolaboro 公开索引，CC BY 4.0，依据开发商页面和官方登记处整理。', src_a: '同一索引的 JSON', reg: '手上是地籍编号、许可证号或公司编号？', reg_a: '登记处批量核查',
    j: { load: '正在加载索引…', err: '索引加载失败，请一分钟后再试。', empty: '请至少粘贴一个名称或链接。', cut: '只核查了前 {max} 行。你的名单共有 {n} 行。', done: '已将 {n} 行与 {p} 个项目和 {d} 家开发商比对。索引日期：{date}。', toobig: '文件超过 2 MB，请改为粘贴各行。',
      s_tracked: '已跟踪', s_close: '相近匹配待确认', s_not: '未跟踪', th: ['你的行', '匹配', '在案交付日期', '日期推迟', '许可证号', '网站', '相似网站'],
      proj: '项目', dev: '开发商', tracked: '已跟踪', close: '相近匹配，请确认', not: '未跟踪', multi: '{n} 个项目同名', site: '该网站上有 {n} 个项目', check: '立即核查', none: '未公布', dprojects: '跟踪 {n} 个项目',
      pub: '已公布', notpub: '未公布', dperm: '{n} 个中有 {k} 个公布', h_u: '有响应（HTTP {s}）', h_b: '以 HTTP {s} 响应，通常是反爬虫拦截', h_x: '服务器错误（HTTP {s}）', h_0: '无响应', h_n: '未检查（robots.txt）', h_none: '不在每日检查范围内', ck: '检查于 {d}', look: '记录 {n} 个', look0: '无记录', web_d: '网站检查日期：{a}。相似网站名单日期：{b}（通过 crt.sh 的证书透明度日志、注册局 RDAP、DNS）。' } },
  ar: { title: 'فحص بالجملة: أي المشاريع في قائمتك نتابعها', desc: 'الصق أو ارفع حتى 100 اسم مشروع أو مطوّر أو رابط. يطابقها متصفحك مع فهرس Kolaboro العام: موعد التسليم المسجَّل، المواعيد المؤجَّلة، رقم الترخيص، حالة الموقع، المواقع المشابهة. تصدير CSV. لا يُرفع أي شيء.',
    tools: 'الأدوات', crumb: 'فحص بالجملة', h1: 'فحص بالجملة للوسطاء وجهات التمويل', lead: 'الصق أو ارفع حتى 100 اسم مشروع أو مطوّر أو رابط. يطابقها متصفحك مع فهرسنا العام ويعرض ما هو مسجَّل لكل منها.',
    priv_b: 'لا يُرفع أي شيء.', priv: 'يُنزَّل الفهرس مرة واحدة وتجري المطابقة على هذا الجهاز. قائمتك لا تغادر متصفحك، ولا يُستخدم أي ذكاء اصطناعي.',
    h_in: 'قائمتك', in_label: 'مشروع أو مطوّر أو رابط واحد في كل سطر (أو صفوف CSV)', ph: 'اسم المشروع\nاسم المطوّر\nhttps://developer-website.example/project', file: 'اختر ملف CSV أو ملفًا نصيًا', drop: 'أو أسقط الملف على المربع', run: 'افحص القائمة', sample: 'املأ مثالًا', clear: 'مسح',
    h_res: 'النتائج', exp: 'تنزيل النتائج (CSV)', h_how: 'كيف تُقرأ الأعمدة',
    how: ['المطابقة: الاسم أو الرابط المطابق تمامًا أولًا. المطابقة القريبة تُعرض لتؤكدها ولا تُحتسب أبدًا متابَعة.', 'التسليم المسجَّل: الموعد الذي ينشره المطوّر كما قرأناه آخر مرة. المواعيد المؤجَّلة: عدد مرات تأجيل وعد مؤرَّخ في النسخ التي نحتفظ بها.', 'رقم الترخيص: هل تنشر صفحة المطوّر أو سجل رسمي رقم ترخيص أو تصريح. منشور لا يعني موثَّقًا.', 'الموقع: طلب واحد يوميًا للصفحة الرئيسية للموقع الرسمي. المواقع المشابهة: أسماء تشبه موقع المطوّر سُجّلت أو حصلت على أول شهادة خلال آخر 365 يومًا. التشابه حقيقة عن الاسم فقط.', 'غير متابَع يعني فقط أن المشروع ليس في فهرسنا بعد. ولا يقول شيئًا عن المشروع.'],
    src: 'البيانات: فهرس Kolaboro العام، CC BY 4.0، مبني على صفحات المطوّرين والسجلات الرسمية.', src_a: 'الفهرس نفسه بصيغة JSON', reg: 'هل لديك مراجع عقارية أو أرقام تراخيص أو أرقام شركات؟', reg_a: 'فحص بالجملة في السجلات',
    j: { load: 'جارٍ تحميل الفهرس…', err: 'تعذّر تحميل الفهرس. حاول مجددًا بعد دقيقة.', empty: 'الصق اسمًا أو رابطًا واحدًا على الأقل.', cut: 'فُحصت أول {max} صفًّا فقط. قائمتك تضم {n}.', done: 'الصفوف المفحوصة: {n}. المشاريع في الفهرس: {p}، المطوّرون: {d}. فهرس بتاريخ {date}.', toobig: 'حجم الملف يتجاوز 2 ميغابايت. الصق الصفوف بدلًا من ذلك.',
      s_tracked: 'متابَع', s_close: 'مطابقات قريبة للتأكيد', s_not: 'غير متابَع', th: ['صفّك', 'المطابقة', 'التسليم المسجَّل', 'المواعيد المؤجَّلة', 'رقم الترخيص', 'الموقع', 'المواقع المشابهة'],
      proj: 'مشروع', dev: 'مطوّر', tracked: 'متابَع', close: 'مطابقة قريبة، يُرجى التأكيد', not: 'غير متابَع', multi: 'المشاريع التي تحمل هذا الاسم: {n}', site: 'المشاريع على هذا الموقع: {n}', check: 'افحصه الآن', none: 'غير منشور', dprojects: 'المشاريع المتابَعة: {n}',
      pub: 'منشور', notpub: 'غير منشور', dperm: '{k} من {n} تنشره', h_u: 'استجاب (HTTP {s})', h_b: 'استجاب بـ HTTP {s}، وغالبًا هو حاجز ضد الروبوتات', h_x: 'خطأ في الخادم (HTTP {s})', h_0: 'لا استجابة', h_n: 'لم يُفحص (robots.txt)', h_none: 'خارج الفحص اليومي', ck: 'فُحص في {d}', look: 'المسجَّل: {n}', look0: 'لا شيء مسجَّل', web_d: 'فحوص المواقع بتاريخ {a}. قائمة المواقع المشابهة بتاريخ {b} (Certificate Transparency عبر crt.sh، RDAP السجلات، DNS).' } },
};
const t = (lang, k) => (T[lang] && T[lang][k] != null ? T[lang][k] : T.en[k]);

const CSS = '<style id="kbk21">.bk21 .bk-hero{padding:clamp(32px,5vw,64px) 0 clamp(20px,3vw,32px);border-bottom:1px solid var(--k-line)}.bk21 .bk-hero h1{font-size:var(--k-fs-4xl);line-height:1.02;letter-spacing:-.03em;max-width:18ch;margin:8px 0 0}.bk21 .bk-hero .lead{max-width:60ch;margin-top:16px}' +
  '.bk21 .bk-priv{display:flex;gap:10px;align-items:flex-start;max-width:68ch;margin:18px 0 0;padding:12px 14px;border:1px solid var(--k-line);border-radius:var(--k-r-md);background:var(--k-surface);font-size:var(--k-fs-sm);color:var(--k-ink-2)}.bk21 .bk-priv svg{flex:none;width:20px;height:20px;margin-top:2px;color:var(--k-ok)}' +
  '.bk21 .bk-sec{padding:clamp(24px,4vw,44px) 0}.bk21 .bk-sec h2{font-size:var(--k-fs-2xl);margin:0 0 12px}.bk21 .bk-in{display:grid;gap:12px;max-width:820px}.bk21 .bk-in textarea{min-height:190px;font-size:16px;line-height:1.45}.bk21 .bk-in textarea.is-drop{outline:2px dashed var(--k-sea);outline-offset:2px;background:var(--k-sea-soft)}' +
  '.bk21 .bk-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.bk21 .bk-row .k-btn,.bk21 .bk-row .btn{min-height:44px}.bk21 .bk-file{position:relative;overflow:hidden;cursor:pointer}.bk21 .bk-file input{position:absolute;inset:0;opacity:0;cursor:pointer;font-size:0}.bk21 .bk-file:focus-within{outline:2px solid var(--k-sea);outline-offset:2px}.bk21 .bk-drop{color:var(--k-muted);font-size:var(--k-fs-sm)}' +
  '.bk21 .bk-status{margin:4px 0 0;color:var(--k-ink-2);font-size:var(--k-fs-sm);min-height:1.4em}.bk21 .bk-status.is-bad{color:var(--k-bad)}.bk21 #bkres[hidden]{display:none}' +
  '.bk21 .bk-stats{display:flex;flex-wrap:wrap;gap:12px 40px;margin:4px 0 18px}.bk21 .bk-tools{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:0 0 14px}' +
  '.bk21 .k-table td{vertical-align:top}.bk21 .k-table td small{display:block;color:var(--k-muted);font-size:var(--k-fs-xs);line-height:1.35;margin-top:2px}.bk21 td.bk-q{max-width:240px;overflow-wrap:anywhere}.bk21 td.bk-m{min-width:200px}.bk21 td.bk-m a{font-weight:600}.bk21 .bk-nm{overflow-wrap:anywhere}' +
  '@media(max-width:640px){.bk21 .k-table--stack td{text-align:end}.bk21 .k-table--stack td>span,.bk21 .k-table--stack td>div{max-width:62%;overflow-wrap:anywhere}.bk21 td.bk-q{max-width:none;font-weight:600}}' +
  '.bk21 .bk-how{max-width:74ch;padding-inline-start:1.2em;display:grid;gap:8px;color:var(--k-ink-2)}.bk21 .bk-src{max-width:74ch;color:var(--k-muted);font-size:var(--k-fs-sm);margin:14px 0 0}.bk21 .bk-ltr{direction:ltr;unicode-bidi:isolate}</style>';
const LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="9.5" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

function body(lang) {
  const L = k => esc(t(lang, k)), p = pre(lang);
  return '<div class="bk21" data-clarity-mask="true"><section class="bk-hero"><div class="wrap"><p class="crumb"><a href="' + p + '/">Kolaboro</a> / <a href="/tools/">' + L('tools') + '</a> / ' + L('crumb') + '</p><h1>' + L('h1') + '</h1><p class="lead">' + L('lead') + '</p>' +
    '<p class="bk-priv">' + LOCK + '<span><b>' + L('priv_b') + '</b> ' + L('priv') + '</span></p></div></section>' +
    '<section class="bk-sec" aria-labelledby="bk-h-in"><div class="wrap"><h2 id="bk-h-in">' + L('h_in') + '</h2><form class="bk-in" id="bkform" novalidate><div class="k-field"><label class="k-label" for="bkin">' + L('in_label') + '</label>' +
    '<textarea class="k-textarea" id="bkin" data-clarity-mask="true" dir="auto" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="' + L('ph') + '"></textarea></div>' +
    '<div class="bk-row"><button class="btn btn-hi" type="submit" id="bkrun">' + L('run') + '</button><label class="k-btn bk-file"><span>' + L('file') + '</span><input type="file" id="bkfile" accept=".csv,.tsv,.txt,text/csv,text/plain"></label><button class="k-btn k-btn--ghost" type="button" id="bksample">' + L('sample') + '</button><button class="k-btn k-btn--ghost" type="button" id="bkclear">' + L('clear') + '</button><span class="bk-drop">' + L('drop') + '</span></div>' +
    '<p class="bk-status" id="bkstatus" role="status" aria-live="polite"></p></form></div></section>' +
    '<section class="bk-sec" id="bkres" aria-labelledby="bk-h-res" hidden><div class="wrap"><h2 id="bk-h-res" tabindex="-1">' + L('h_res') + '</h2><div class="bk-stats" id="bkstats"></div><div class="bk-tools"><button class="k-btn" type="button" id="bkexp">' + L('exp') + '</button></div>' +
    '<div class="k-table-wrap"><table class="k-table k-table--dense k-table--stack" id="bktable"><thead><tr>' + t(lang, 'j').th.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody></tbody></table></div><p class="bk-src" id="bkdates"></p></div></section>' +
    '<section class="bk-sec" aria-labelledby="bk-h-how"><div class="wrap"><h2 id="bk-h-how">' + L('h_how') + '</h2><ul class="bk-how">' + t(lang, 'how').map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
    '<p class="bk-src">' + L('src') + ' <a class="k-src" href="https://creativecommons.org/licenses/by/4.0/" rel="license noopener">CC BY 4.0</a> <a class="k-src" href="/api/x/bulkix">' + L('src_a') + '</a> <a class="k-src" href="/data/web-health.json">web-health.json</a> <a class="k-src" href="' + p + '/watch/lookalikes/">lookalikes</a></p>' +
    '<p class="bk-src">' + L('reg') + ' <a href="/bulk-check/">' + L('reg_a') + '</a></p></div></section></div>';
}

// the page script: index download, parsing, matching, table and CSV, all on the visitor's device
const JS = `(function(){
var D=document,T=JSON.parse(D.getElementById('kbk-t').textContent),MAX=${MAX},$=function(i){return D.getElementById(i)};
var IX=null,LOAD=null,OUT=[],M={};
function f(s,v){return String(s).replace(/\\{(\\w+)\\}/g,function(m,k){return v&&v[k]!=null?v[k]:m})}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function norm(s){return String(s||'').toLowerCase().normalize('NFKD').replace(/[\\u0300-\\u036f]/g,'').replace(/&/g,' and ').replace(/[^a-z0-9\\u0400-\\u04ff\\u0600-\\u06ff\\u0e00-\\u0e7f\\u3040-\\u30ff\\u4e00-\\u9fff]+/g,' ').replace(/\\s+/g,' ').trim()}
var SUF=/\\b(llc|l l c|ltd|limited|inc|incorporated|pjsc|psc|sa|slu|sl|plc|bhd|berhad|sdn|co|company|corp|corporation|pt|tbk|jsc|gmbh|ag|bv|nv|srl|spa|sas|sarl|doo|group|holding|holdings|properties|property|developments|development|developers|developer|real estate|realty)\\b/g;
function dnorm(s){return norm(s).replace(SUF,' ').replace(/\\s+/g,' ').trim()}
function toks(s){return s.split(' ').filter(function(w){return w.length>1})}
function asUrl(s){s=String(s).trim();if(/\\s/.test(s))return null;if(!/^https?:\\/\\//i.test(s)){if(!/^[a-z0-9-]+(\\.[a-z0-9-]+)+(\\/\\S*)?$/i.test(s))return null;s='https://'+s}
  try{var u=new URL(s),h=u.hostname.toLowerCase().replace(/^www\\./,'');return{host:h,path:(h+u.pathname).toLowerCase().replace(/\\/+$/,''),href:u.href}}catch(e){return null}}
function add(m,k,v){if(!k)return;(m[k]=m[k]||[]).push(v)}
function build(d){IX=d;M={path:{},host:{},pn:{},dn:{},slug:{},dslug:{},pt:[],dt:[]};
  d.p.forEach(function(p,i){M.slug[p[0]]=i;p[7].forEach(function(u){add(M.path,u,i)});p[8].forEach(function(h){add(M.host,h,i)});var n=norm(p[1]);add(M.pn,n,i);M.pt.push(toks(n))});
  d.d.forEach(function(v,i){M.dslug[v[0]]=i;var n=dnorm(v[1]);add(M.dn,n,i);if(norm(v[1])!==n)add(M.dn,norm(v[1]),i);M.dt.push(toks(n))});}
function load(){if(LOAD)return LOAD;LOAD=fetch('/api/x/bulkix',{headers:{accept:'application/json'}}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(d){build(d);return d}).catch(function(e){LOAD=null;throw e});return LOAD}
function uniq(a){return a.filter(function(x,i){return a.indexOf(x)===i})}
function devOfHost(h){for(var i=0;i<IX.d.length;i++)if(IX.d[i][4].indexOf(h)>=0)return i;return -1}
function matchUrl(u){
  if(u.host==='kolaboro.com'){var m=u.path.match(/\\/(projects|developers)\\/([a-z0-9-]+)/);if(m&&m[1]==='projects'&&M.slug[m[2]]!=null)return{k:'p',c:'exact',r:[M.slug[m[2]]]};if(m&&m[1]==='developers'&&M.dslug[m[2]]!=null)return{k:'d',c:'exact',r:[M.dslug[m[2]]]};return null}
  var all=M.host[u.host]?uniq(M.host[u.host]):[],a=M.path[u.path],dv=devOfHost(u.host);
  // a home page (or a one-step path such as /en) on a website that carries several tracked projects is the developer, not one project
  if(all.length>1&&dv>=0&&(u.path===u.host||/^[^\\/]+\\/[a-z]{2}(-[a-z]{2})?$/.test(u.path))&&(!a||uniq(a).length<all.length))return{k:'d',c:'exact',r:[dv],site:all.length};
  if(a)return{k:'p',c:'exact',r:uniq(a)};
  a=all;if(!a.length)return null;
  if(u.path!==u.host){var best=null,bl=0;a.forEach(function(i){IX.p[i][7].forEach(function(pp){if(pp.indexOf(u.host)===0&&pp.length>u.host.length&&(u.path.indexOf(pp)===0||pp.indexOf(u.path)===0)&&pp.length>bl){best=i;bl=pp.length}})});if(best!=null)return{k:'p',c:'exact',r:[best]}}
  if(a.length===1)return{k:'p',c:u.path===u.host?'exact':'close',r:a};
  if(dv>=0)return{k:'d',c:'exact',r:[dv],site:a.length};
  return{k:'p',c:'close',r:a.slice(0,3),site:a.length}}
var STOP={the:1,by:1,at:1,of:1,de:1,la:1,el:1,le:1,al:1,and:1,residences:1,residence:1,villas:1,villa:1,tower:1,towers:1,apartments:1,homes:1,project:1,resort:1,beach:1,city:1,park:1,one:1};
function fuzzy(tk,list){var best=-1,bs=0;if(tk.length<1)return null;for(var i=0;i<list.length;i++){var b=list[i];if(!b.length)continue;var n=0,ns=0;for(var j=0;j<tk.length;j++)if(b.indexOf(tk[j])>=0){n++;if(!STOP[tk[j]])ns++}if(!ns)continue;
    var s=n/Math.max(tk.length,b.length),sub=n===tk.length||n===b.length;if(sub&&n>=2)s=Math.max(s,.75+.2*n/Math.max(tk.length,b.length));if(n<2&&!(n===1&&tk.length===1&&b.length===1))continue;if(s>bs){bs=s;best=i}}
  return bs>=.6?{i:best,s:bs}:null}
function matchName(s){var n=norm(s);if(!n||n.length<2)return null;
  var a=M.pn[n];if(a)return{k:'p',c:'exact',r:uniq(a)};
  var dn=dnorm(s);a=M.dn[n]||(dn&&M.dn[dn]);if(a){a=uniq(a);var ex=a.filter(function(i){return norm(IX.d[i][1])===n});if(ex.length!==1){ex=a.filter(function(i){var x=norm(IX.d[i][1]);return x.length>3&&n.indexOf(x+' ')===0}).sort(function(i,j){return IX.d[j][1].length-IX.d[i][1].length});if(ex.length>1&&norm(IX.d[ex[0]][1]).length>norm(IX.d[ex[1]][1]).length)ex=[ex[0]]}if(ex.length===1)a=ex;return{k:'d',c:a.length===1?'exact':'close',r:a.slice(0,3)}}
  var by=n.split(' by ');if(by.length===2&&by[0].length>2){a=M.pn[by[0]];if(a)return{k:'p',c:'close',r:uniq(a).slice(0,3)}}
  var fp=fuzzy(toks(n),M.pt),fd=fuzzy(toks(dn),M.dt);
  if(fp&&(!fd||fp.s>=fd.s))return{k:'p',c:'close',r:[fp.i]};if(fd)return{k:'d',c:'close',r:[fd.i]};return null}
function matchRow(cells){var i,u,m,first=null;
  for(i=0;i<cells.length;i++){u=asUrl(cells[i]);if(u){m=matchUrl(u);if(m&&m.c==='exact')return m;if(m&&!first)first=m}}
  for(i=0;i<cells.length;i++){if(/^https?:\\/\\/|\\//i.test(cells[i])&&asUrl(cells[i]))continue;m=matchName(cells[i]);if(m&&m.c==='exact')return m;if(m&&!first)first=m}
  return first}
function parse(text){var rows=[],row=[],cur='',q=false,i,c;text=String(text).replace(/^\\ufeff/,'');
  
  function endCell(){row.push(cur.trim());cur=''}function endRow(){endCell();if(row.some(function(x){return x}))rows.push(row.filter(function(x){return x}));row=[]}
  for(i=0;i<text.length;i++){c=text[i];if(q){if(c==='"'){if(text[i+1]==='"'){cur+='"';i++}else q=false}else cur+=c}else if(c==='"'&&!cur.trim())q=true;else if(c===','||c===';'||c==='\\t')endCell();else if(c==='\\n'||c==='\\r'){if(c==='\\r'&&text[i+1]==='\\n')i++;endRow()}else cur+=c}
  endRow();
  if(rows.length>1&&rows[0].every(function(x){return /^(name|project|project name|developer|developer name|url|link|website|site|id|#|no|market|country|city|nombre|proyecto|promotor|enlace)$/i.test(x)}))rows.shift();
  return rows}
var LOC=T.locale;
function fdate(s){s=String(s||'');var m;if((m=s.match(/^(\\d{4})-Q([1-4])$/)))return'Q'+m[2]+' '+m[1];if((m=s.match(/^(\\d{4})-H([12])$/)))return'H'+m[2]+' '+m[1];
  try{if((m=s.match(/^(\\d{4})-(\\d{2})$/)))return new Intl.DateTimeFormat(LOC,{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(+m[1],+m[2]-1,1)));
  if((m=s.match(/^(\\d{4})-(\\d{2})-(\\d{2})/)))return new Intl.DateTimeFormat(LOC,{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(+m[1],+m[2]-1,+m[3])))}catch(e){}return s}
function health(h){var w=h&&IX.w[h];if(!w)return{t:T.h_none,d:''};var k={u:'h_u',b:'h_b',x:'h_x','0':'h_0','-':'h_n'}[w[0]]||'h_none';return{t:f(T[k],{s:w[1]}),d:w[2]}}
function rec(q,m){var o={q:q,status:'not',type:'',name:'',url:'',dev:'',ho:'',moved:'',permit:'',site:'',health:'',hck:'',look:'',note:'',alts:[]};if(!m)return o;
  o.status=m.c==='exact'?'tracked':'close';o.type=m.k;
  if(m.k==='p'){var p=IX.p[m.r[0]];o.name=p[1];o.url=T.pre+'/projects/'+p[0]+'/';o.dev=p[3];o.place=[p[5],p[6]!==p[5]?p[6]:''].filter(Boolean).join(', ');o.ho=p[9];o.moved=p[10];o.permit=p[11]?T.pub:T.notpub;o.site=p[12]||p[8][0]||'';var h=health(p[12]);o.health=h.t;o.hck=h.d;o.look=p[4]?(IX.l[p[4]]||0):'';
    if(m.site)o.note=f(T.site,{n:m.site});else if(m.r.length>1)o.note=f(T.multi,{n:m.r.length});o.alts=m.r.slice(1,3).map(function(i){return{n:IX.p[i][1]+(IX.p[i][5]?', '+IX.p[i][5]:''),u:T.pre+'/projects/'+IX.p[i][0]+'/'}})}
  else{var v=IX.d[m.r[0]];o.name=v[1];o.url=T.pre+'/developers/'+v[0]+'/';o.place=v[3];o.ho=f(T.dprojects,{n:v[2]});o.hoText=true;o.moved=v[5];o.permit=f(T.dperm,{k:v[6],n:v[2]});o.site=v[7]||v[4][0]||'';var h2=health(v[7]);o.health=h2.t;o.hck=h2.d;o.look=IX.l[v[0]]||0;
    if(m.site)o.note=f(T.site,{n:m.site});o.alts=m.r.slice(1,3).map(function(i){return{n:IX.d[i][1],u:T.pre+'/developers/'+IX.d[i][0]+'/'}})}
  return o}
function td(i,html,cls){return'<td data-label="'+esc(T.th[i])+'"'+(cls?' class="'+cls+'"':'')+'><div>'+html+'</div></td>'}
function render(n){var c={tracked:0,close:0,not:0};OUT.forEach(function(o){c[o.status]++});
  $('bkstats').innerHTML=[['tracked',T.s_tracked],['close',T.s_close],['not',T.s_not]].map(function(x){return'<div class="k-stat"><b>'+c[x[0]]+'</b><span>'+esc(x[1])+'</span></div>'}).join('');
  $('bktable').tBodies[0].innerHTML=OUT.map(function(o){
    var badge=o.status==='tracked'?'<span class="k-badge k-badge--ok">'+esc(T.tracked)+'</span>':o.status==='close'?'<span class="k-badge k-badge--warn">'+esc(T.close)+'</span>':'<span class="k-badge k-badge--plain">'+esc(T.not)+'</span>';
    var m=badge;
    if(o.status!=='not'){m+='<div class="bk-nm"><a href="'+esc(o.url)+'"><bdi>'+esc(o.name)+'</bdi></a></div><small>'+esc(o.type==='p'?T.proj:T.dev)+(o.dev?' · <bdi>'+esc(o.dev)+'</bdi>':'')+(o.place?' · '+esc(o.place):'')+'</small>'+(o.note?'<small>'+esc(o.note)+'</small>':'')+o.alts.map(function(a){return'<small><a href="'+esc(a.u)+'"><bdi>'+esc(a.n)+'</bdi></a></small>'}).join('')}
    else{var u=asUrl(o.q.split(' | ')[0]);m+='<small><a href="'+T.pre+'/check/?'+(u?'url='+encodeURIComponent(u.href):'q='+encodeURIComponent(o.q.split(' | ')[0]))+'">'+esc(T.check)+'</a></small>'}
    var dash='<span class="k-muted">-</span>',no=o.status==='not';
    return'<tr>'+td(0,'<bdi>'+esc(o.q)+'</bdi>','bk-q')+td(1,m,'bk-m')+td(2,no?dash:o.hoText?esc(o.ho):o.ho?esc(fdate(o.ho)):'<span class="k-muted">'+esc(T.none)+'</span>')+td(3,no?dash:String(o.moved),'k-n')+td(4,no?dash:esc(o.permit))+
      td(5,no?dash:(o.site?'<span class="bk-ltr">'+esc(o.site)+'</span>':'')+'<small>'+esc(o.health)+(o.hck?', '+esc(f(T.ck,{d:fdate(o.hck)})):'')+'</small>')+td(6,no||o.look===''?dash:o.look?esc(f(T.look,{n:o.look})):'<span class="k-muted">'+esc(T.look0)+'</span>')+'</tr>'}).join('');
  var S=IX.sources||{};$('bkdates').textContent=f(T.web_d,{a:fdate((S.website_health||{}).updated||''),b:fdate((S.lookalikes||{}).updated||'')});
  $('bkres').hidden=false;
  status((n>MAX?f(T.cut,{max:MAX,n:n})+' ':'')+f(T.done,{n:OUT.length,p:IX.counts.projects,d:IX.counts.developers,date:fdate(IX.updated)}));
  var h=$('bk-h-res');try{h.focus({preventScroll:true})}catch(e){}h.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}
function status(s,bad){var e=$('bkstatus');e.textContent=s;e.classList.toggle('is-bad',!!bad)}
function run(){var rows=parse($('bkin').value);if(!rows.length){status(T.empty,true);$('bkin').focus();return}
  var b=$('bkrun');b.disabled=true;status(T.load);
  load().then(function(){OUT=rows.slice(0,MAX).map(function(r){return rec(r.join(' | ').slice(0,300),matchRow(r))});render(rows.length);if(window.gtag)try{gtag('event','bulk_check',{rows:OUT.length})}catch(e){}}).catch(function(){status(T.err,true)}).then(function(){b.disabled=false})}
function cell(v){v=String(v==null?'':v);if(/^[=+\\-@\\t\\r]/.test(v))v="'"+v;return /[",\\n\\r;]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}
function csv(){var H=['input','match','type','name','kolaboro_url','developer','handover_on_record','times_dates_moved','permit_number','official_website','website_last_check','website_checked_on','lookalike_websites_recorded','note'];
  var L=[H.join(',')];OUT.forEach(function(o){L.push([o.q,o.status==='tracked'?'tracked':o.status==='close'?'close match, confirm':'not tracked',o.type==='p'?'project':o.type==='d'?'developer':'',o.name,o.url?'https://kolaboro.com'+o.url:'',o.dev,o.ho,o.moved,o.status==='not'?'':o.permit,o.site,o.status==='not'?'':o.health,o.hck,o.look,o.note].map(cell).join(','))});
  var blob=new Blob(['\\ufeff'+L.join('\\r\\n')+'\\r\\n'],{type:'text/csv;charset=utf-8'}),a=D.createElement('a');a.href=URL.createObjectURL(blob);a.download='kolaboro-bulk-check-'+new Date().toISOString().slice(0,10)+'.csv';D.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1500)}
function readFile(fl){if(!fl)return;if(fl.size>2097152){status(T.toobig,true);return}var r=new FileReader();r.onload=function(){$('bkin').value=String(r.result||'');status('');run()};r.readAsText(fl)}
$('bkform').addEventListener('submit',function(e){e.preventDefault();run()});
$('bkfile').addEventListener('change',function(){readFile(this.files[0]);this.value=''});
$('bkclear').addEventListener('click',function(){$('bkin').value='';OUT=[];$('bkres').hidden=true;status('');$('bkin').focus()});
$('bkexp').addEventListener('click',csv);
$('bksample').addEventListener('click',function(){var b=this;b.disabled=true;status(T.load);load().then(function(d){var P=d.p,pick=[P[0],P[Math.floor(P.length/3)],P[Math.floor(P.length/2)]].filter(Boolean),dv=d.d.slice().sort(function(a,b){return b[2]-a[2]})[0];
    var L=[pick[0]?pick[0][1]:'',pick[1]&&pick[1][7][0]?'https://'+pick[1][7][0]:'',dv?dv[1]:'',pick[2]?pick[2][1].split(' ').slice(0,3).join(' ')+' Residences':'','Example Tower That Is Not On Any List'].filter(Boolean);$('bkin').value=L.join('\\n');status('');run()}).catch(function(){status(T.err,true)}).then(function(){b.disabled=false})});
var ta=$('bkin');['dragenter','dragover'].forEach(function(n){ta.addEventListener(n,function(e){if(e.dataTransfer&&[].indexOf.call(e.dataTransfer.types||[],'Files')>=0){e.preventDefault();ta.classList.add('is-drop')}})});
['dragleave','drop'].forEach(function(n){ta.addEventListener(n,function(e){ta.classList.remove('is-drop');if(n==='drop'&&e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0]){e.preventDefault();readFile(e.dataTransfer.files[0])}})});
ta.addEventListener('keydown',function(e){if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();run()}});
window.KBBulk={parse:parse,matchRow:matchRow,load:load};
})();`;

async function assemble(shellRes, lang) {
  const path = '/tools/bulk-check/', url = ORIGIN + pre(lang) + path, title = t(lang, 'title'), desc = t(lang, 'desc');
  const alts = LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + path + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + path + '">';
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebApplication', '@id': url + '#app', name: title, description: desc, url, inLanguage: lang, applicationCategory: 'BusinessApplication', operatingSystem: 'Any (web browser)', isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }, provider: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kolaboro', item: ORIGIN + pre(lang) + '/' }, { '@type': 'ListItem', position: 2, name: t(lang, 'tools'), item: ORIGIN + '/tools/' }, { '@type': 'ListItem', position: 3, name: t(lang, 'crumb'), item: url }] }] };
  const tags = '<title>' + esc(title) + ' | Kolaboro</title><meta name="description" content="' + esc(desc) + '"><link rel="canonical" href="' + url + '">' + alts +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="Kolaboro"><meta property="og:title" content="' + esc(title) + ' | Kolaboro"><meta property="og:description" content="' + esc(desc) + '"><meta property="og:url" content="' + url + '"><meta property="og:image" content="' + ORIGIN + '/k/og/pricing.png"><meta name="twitter:card" content="summary_large_image">' +
    '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' + CSS;
  const js = Object.assign({}, t(lang, 'j'), { pre: pre(lang), locale: LOC[lang] || 'en-GB' });
  const tail = '<script type="application/json" id="kbk-t">' + JSON.stringify(js).replace(/</g, '\\u003c') + '</script><script>' + JS + '</script>';
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
export async function page(req, u, env, ctx, shell) {
  const m = u.pathname.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?tools\/bulk-check(\/?)$/); if (!m || !shell) return null;
  if (!m[2]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
  const lang = m[1] || 'en';
  try {
    const sh = await shell(pre(lang) + '/how-we-score/');
    if (!sh || sh.status !== 200) return null;
    return new Response(await assemble(sh, lang), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600' } });
  } catch (e) { return null; }
}
export { T as BULKIX_T, JS as BULKIX_JS };
