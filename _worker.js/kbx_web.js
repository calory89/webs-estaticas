// kolaboro.com batch 18 (n18a): what developer websites reveal. No model calls.
// Data (built daily on main by .github/workflows/kolaboro-devweb.yml, tools/kolaboro-agent/dev_web.py, one homepage request per
// developer website per day, robots.txt respected):
//   /data/web-health.json  per own developer website: today's HTTP status, the last 30 daily checks, uptime streak, TLS certificate
//                          expiry, domain registration expiry (registry RDAP), Last-Modified and newest sitemap date
//   /data/dev-links.json   public identifiers (analytics, tag manager, ads, pixel, chat ids, custom theme, HTML skeleton hash,
//                          shared TLS certificate, custom name servers, dedicated server IP) carried by websites of two or more
//                          different developers. No personal data: no emails, phone numbers, names or page text are read or kept.
// Shown on named project pages (#web) and developer pages (#webhealth, #weblinks), as the "same website identifier" link type in
// /graph/developers/ (kbx_net.js calls webGroups), and in the daily push-alert state of watched projects (kbx_j.js calls webStates).
// Routes:
//   GET /api/x/web/project/<ID>   health of the project's own website(s)
//   GET /api/x/web/dev/<slug>     health of a developer's websites and the identifiers they share with other developers
import { LOCALE } from './kbx_named_i18n.js';

const ORIGIN = 'https://kolaboro.com';
export const PATHS = /^\/api\/x\/web\/(?:project\/[A-Za-z0-9-]{3,20}|dev\/[a-z0-9-]{1,90})$/;

let MEMO = null;
async function loadOne(env, name) {
  let r = null;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); } catch (e) { r = null; }
  if (!r || !r.ok) { try { r = await fetch(ORIGIN + '/data/' + name, { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
  return r && r.ok ? await r.json().catch(() => null) : null;
}
export async function webData(env) {
  if (MEMO && Date.now() - MEMO.t < 600000) return MEMO.v;
  const [health, links, named] = await Promise.all([loadOne(env, 'web-health.json'), loadOne(env, 'dev-links.json'), loadOne(env, 'named.json')]);
  const byDev = new Map();
  for (const g of ((links && links.groups) || [])) for (const s of g.dv || []) { if (!byDev.has(s)) byDev.set(s, []); byDev.get(s).push(g); }
  const domDev = new Map(); for (const [d, h] of Object.entries((health && health.d) || {})) domDev.set(d, h.dv);
  const devName = new Map(); const devDoms = new Map();
  for (const x of ((named && named.projects) || [])) if (x.dvs && x.dv) devName.set(x.dvs, x.dv);
  for (const [d, s] of domDev) { if (!devDoms.has(s)) devDoms.set(s, []); devDoms.get(s).push(d); }
  const v = { health, links, byDev, devName, devDoms, named, v: ((health && health.generated_at) || '') + '/' + ((links && links.updated) || '') };
  MEMO = { t: Date.now(), v }; return v;
}

// ------------------------------------------------------------------------------------------------ helpers
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SLD2 = /\.(co|com|net|org|gov|ac|or|ne|go|in|edu)\.[a-z]{2}$/;
export function regDomain(u) {
  let h = ''; try { h = new URL(String(u || '')).hostname.toLowerCase(); } catch (e) { return ''; }
  h = h.replace(/^www\./, ''); if (!h.includes('.')) return '';
  const p = h.split('.'); return SLD2.test(h) ? p.slice(-3).join('.') : p.slice(-2).join('.');
}
const DAY = 86400000;
const daysTo = (d, today) => Math.round((Date.parse(d + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / DAY);
function fdt(d, lang) { try { return new Intl.DateTimeFormat(LOCALE[lang] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(d + 'T00:00:00Z')); } catch (e) { return d; } }
const pre = l => l === 'en' ? '' : '/' + l;
// last N checked days: how many had no answer or a server error
function lastN(h, n) { const s = (h.h || '').replace(/-/g, ''); const w = s.slice(-n); return { n: w.length, bad: [...w].filter(c => c === '0' || c === 'x').length }; }
function firstChecked(health, h) { const s = h.h || '', days = health.days || []; for (let i = 0; i < s.length; i++) if (s[i] !== '-') return days[i]; return null; }

// ------------------------------------------------------------------------------------------------ strings (8 languages)
const S = {
  en: { s_log: 'our daily checks', ind: 'in {n} days', hh: 'Website health', hl: 'What the websites share',
    intro: 'We check the developer\'s own website once a day: whether the homepage answers, when its TLS certificate and its domain registration expire, and when it was last updated. A site that stops answering or lets its domain lapse is a reason to ask questions, not proof of anything.',
    site: 'Website {d}', ok: 'The homepage answered with HTTP {s} on {d} ({t} s).', b4: 'The homepage answered with HTTP {s} on {d}. A 4xx status often means the site blocks automated visitors.', x5: 'The homepage returned a server error (HTTP {s}) on {d}.',
    no: 'The homepage did not answer on {d} ({w}).', w_dns: 'the domain does not resolve', w_timeout: 'no answer within 10 seconds', w_tls: 'the secure connection failed', w_connect: 'the connection failed',
    bad: 'No answer or a server error on {k} of the last {n} daily checks.', allok: 'Answered on all of the last {n} daily checks.', since: 'Daily checks since {d}.', streak: 'Answered on {n} daily checks in a row.',
    ce: 'TLS certificate expires {d}.', ce_soon: 'TLS certificate expires {d}, in {n} days.', ce_past: 'The TLS certificate the site presented expired on {d}.', ce_bad: 'The TLS certificate the site presented did not pass validation on {d}.',
    de: 'Domain registration expires {d}.', de_soon: 'Domain registration expires {d}, in {n} days.', de_past: 'The registry lists an expiry date that has passed ({d}). Registries often hold a domain for a grace period, so check again before reading anything into it.',
    lm: 'The server reports the homepage last changed on {d}.', sm: 'Newest date in the site\'s sitemap: {d}.', to: 'The homepage now redirects to {d}.',
    rb: 'The site\'s robots.txt asks robots not to fetch the homepage, so we only read its DNS, its certificate and its registry record.',
    strip: 'Last {n} daily checks, oldest first', l_u: 'answered', l_b: 'answered with 4xx', l_x: 'no answer or server error', l_n: 'not checked',
    s_home: 'homepage', s_rdap: 'registry RDAP', s_ct: 'certificate log', method: 'Method and data', upd: 'Checked {d}.',
    th: ['Website', 'Today', 'Last 7 checks', 'Certificate expires', 'Domain expires'], t_ok: 'HTTP {s}', t_no: 'no answer', t_bad: '{k} of {n} without answer',
    l_intro: 'Public identifiers in the source of these websites that websites of other developers we track also carry. A shared id usually means the same marketing agency, web studio or hosting account, not the same owner. It is a fact to ask about, not a finding.',
    l_item: 'Shares {t} {v} with {list}.', l_item0: 'Shares {t} with {list}.', l_none: 'No identifier on these websites is shared with another developer we track (checked {d}).', l_graph: 'See it in the developer network graph',
    ty: { ga4: 'the Google Analytics id', ua: 'the Universal Analytics id', gtm: 'the Google Tag Manager container', gads: 'the Google Ads id', fbpx: 'the Meta pixel', hotjar: 'the Hotjar id', clarity: 'the Microsoft Clarity id', hubspot: 'the HubSpot portal', tawk: 'the Tawk.to chat id', intercom: 'the Intercom app id', wptheme: 'the custom WordPress theme', skeleton: 'the same homepage HTML skeleton', cert: 'one TLS certificate', ns: 'the name servers', ip: 'the server address' } },
  es: { s_log: 'nuestras comprobaciones diarias', ind: 'dentro de {n} días', hh: 'Salud de la web', hl: 'Lo que comparten las webs',
    intro: 'Comprobamos la web propia del promotor una vez al día: si la página de inicio responde, cuándo caducan su certificado TLS y el registro de su dominio, y cuándo se actualizó por última vez. Una web que deja de responder o deja caducar su dominio es un motivo para preguntar, no una prueba de nada.',
    site: 'Web {d}', ok: 'La página de inicio respondió con HTTP {s} el {d} ({t} s).', b4: 'La página de inicio respondió con HTTP {s} el {d}. Un estado 4xx suele indicar que la web bloquea visitas automáticas.', x5: 'La página de inicio devolvió un error del servidor (HTTP {s}) el {d}.',
    no: 'La página de inicio no respondió el {d} ({w}).', w_dns: 'el dominio no resuelve', w_timeout: 'sin respuesta en 10 segundos', w_tls: 'falló la conexión segura', w_connect: 'falló la conexión',
    bad: 'Sin respuesta o con error del servidor en {k} de las últimas {n} comprobaciones diarias.', allok: 'Respondió en las últimas {n} comprobaciones diarias.', since: 'Comprobaciones diarias desde el {d}.', streak: 'Respondió en {n} comprobaciones diarias seguidas.',
    ce: 'El certificado TLS caduca el {d}.', ce_soon: 'El certificado TLS caduca el {d}, dentro de {n} días.', ce_past: 'El certificado TLS que presentó la web caducó el {d}.', ce_bad: 'El certificado TLS que presentó la web no superó la validación el {d}.',
    de: 'El registro del dominio caduca el {d}.', de_soon: 'El registro del dominio caduca el {d}, dentro de {n} días.', de_past: 'El registro indica una fecha de caducidad ya pasada ({d}). Los registros suelen mantener el dominio durante un periodo de gracia, así que vuelva a comprobarlo antes de sacar conclusiones.',
    lm: 'El servidor indica que la página de inicio cambió por última vez el {d}.', sm: 'Fecha más reciente del mapa del sitio: {d}.', to: 'La página de inicio ahora redirige a {d}.',
    rb: 'El robots.txt de la web pide a los robots que no lean la página de inicio, así que solo leemos su DNS, su certificado y su registro.',
    strip: 'Últimas {n} comprobaciones diarias, de la más antigua a la más reciente', l_u: 'respondió', l_b: 'respondió con 4xx', l_x: 'sin respuesta o error del servidor', l_n: 'no comprobado',
    s_home: 'página de inicio', s_rdap: 'registro RDAP', s_ct: 'registro de certificados', method: 'Método y datos', upd: 'Comprobado el {d}.',
    th: ['Web', 'Hoy', 'Últimas 7 comprobaciones', 'Certificado caduca', 'Dominio caduca'], t_ok: 'HTTP {s}', t_no: 'sin respuesta', t_bad: '{k} de {n} sin respuesta',
    l_intro: 'Identificadores públicos en el código de estas webs que también llevan webs de otros promotores que seguimos. Un identificador compartido suele indicar la misma agencia de marketing, el mismo estudio web o la misma cuenta de alojamiento, no el mismo propietario. Es un hecho sobre el que preguntar, no una conclusión.',
    l_item: 'Comparte {t} {v} con {list}.', l_item0: 'Comparte {t} con {list}.', l_none: 'Ningún identificador de estas webs se comparte con otro promotor que seguimos (comprobado el {d}).', l_graph: 'Verlo en el grafo de la red de promotores',
    ty: { ga4: 'el id de Google Analytics', ua: 'el id de Universal Analytics', gtm: 'el contenedor de Google Tag Manager', gads: 'el id de Google Ads', fbpx: 'el píxel de Meta', hotjar: 'el id de Hotjar', clarity: 'el id de Microsoft Clarity', hubspot: 'el portal de HubSpot', tawk: 'el id de chat de Tawk.to', intercom: 'el id de app de Intercom', wptheme: 'el tema propio de WordPress', skeleton: 'el mismo esqueleto HTML de la página de inicio', cert: 'un mismo certificado TLS', ns: 'los servidores de nombres', ip: 'la dirección del servidor' } },
  fr: { s_log: 'nos contrôles quotidiens', ind: 'dans {n} jours', hh: 'Santé du site web', hl: 'Ce que les sites partagent',
    intro: 'Nous vérifions le site propre du promoteur une fois par jour : la page d\'accueil répond-elle, quand expirent son certificat TLS et l\'enregistrement de son domaine, et quand a-t-il été mis à jour pour la dernière fois. Un site qui ne répond plus ou laisse expirer son domaine est une raison de poser des questions, pas une preuve.',
    site: 'Site {d}', ok: 'La page d\'accueil a répondu avec HTTP {s} le {d} ({t} s).', b4: 'La page d\'accueil a répondu avec HTTP {s} le {d}. Un statut 4xx signifie souvent que le site bloque les visites automatiques.', x5: 'La page d\'accueil a renvoyé une erreur serveur (HTTP {s}) le {d}.',
    no: 'La page d\'accueil n\'a pas répondu le {d} ({w}).', w_dns: 'le domaine ne se résout pas', w_timeout: 'pas de réponse en 10 secondes', w_tls: 'la connexion sécurisée a échoué', w_connect: 'la connexion a échoué',
    bad: 'Pas de réponse ou erreur serveur lors de {k} des {n} derniers contrôles quotidiens.', allok: 'A répondu lors des {n} derniers contrôles quotidiens.', since: 'Contrôles quotidiens depuis le {d}.', streak: 'A répondu lors de {n} contrôles quotidiens d\'affilée.',
    ce: 'Le certificat TLS expire le {d}.', ce_soon: 'Le certificat TLS expire le {d}, dans {n} jours.', ce_past: 'Le certificat TLS présenté par le site a expiré le {d}.', ce_bad: 'Le certificat TLS présenté par le site n\'a pas passé la validation le {d}.',
    de: 'L\'enregistrement du domaine expire le {d}.', de_soon: 'L\'enregistrement du domaine expire le {d}, dans {n} jours.', de_past: 'Le registre indique une date d\'expiration passée ({d}). Les registres conservent souvent un domaine pendant une période de grâce : vérifiez à nouveau avant d\'en tirer quoi que ce soit.',
    lm: 'Le serveur indique que la page d\'accueil a changé pour la dernière fois le {d}.', sm: 'Date la plus récente du plan du site : {d}.', to: 'La page d\'accueil redirige désormais vers {d}.',
    rb: 'Le robots.txt du site demande aux robots de ne pas lire la page d\'accueil : nous ne lisons donc que son DNS, son certificat et son enregistrement.',
    strip: '{n} derniers contrôles quotidiens, du plus ancien au plus récent', l_u: 'a répondu', l_b: 'a répondu avec 4xx', l_x: 'pas de réponse ou erreur serveur', l_n: 'non vérifié',
    s_home: 'page d\'accueil', s_rdap: 'registre RDAP', s_ct: 'journal des certificats', method: 'Méthode et données', upd: 'Vérifié le {d}.',
    th: ['Site', 'Aujourd\'hui', '7 derniers contrôles', 'Certificat expire', 'Domaine expire'], t_ok: 'HTTP {s}', t_no: 'pas de réponse', t_bad: '{k} sur {n} sans réponse',
    l_intro: 'Identifiants publics dans le code de ces sites que portent aussi des sites d\'autres promoteurs que nous suivons. Un identifiant partagé signifie en général la même agence marketing, le même studio web ou le même compte d\'hébergement, pas le même propriétaire. C\'est un fait sur lequel poser des questions, pas une conclusion.',
    l_item: 'Partage {t} {v} avec {list}.', l_item0: 'Partage {t} avec {list}.', l_none: 'Aucun identifiant de ces sites n\'est partagé avec un autre promoteur que nous suivons (vérifié le {d}).', l_graph: 'Voir dans le graphe du réseau des promoteurs',
    ty: { ga4: 'l\'identifiant Google Analytics', ua: 'l\'identifiant Universal Analytics', gtm: 'le conteneur Google Tag Manager', gads: 'l\'identifiant Google Ads', fbpx: 'le pixel Meta', hotjar: 'l\'identifiant Hotjar', clarity: 'l\'identifiant Microsoft Clarity', hubspot: 'le portail HubSpot', tawk: 'l\'identifiant de chat Tawk.to', intercom: 'l\'identifiant d\'app Intercom', wptheme: 'le thème WordPress sur mesure', skeleton: 'le même squelette HTML de page d\'accueil', cert: 'un même certificat TLS', ns: 'les serveurs de noms', ip: 'l\'adresse du serveur' } },
  de: { s_log: 'unsere täglichen Prüfungen', ind: 'in {n} Tagen', hh: 'Zustand der Website', hl: 'Was die Websites gemeinsam haben',
    intro: 'Wir prüfen die eigene Website des Bauträgers einmal am Tag: ob die Startseite antwortet, wann ihr TLS-Zertifikat und die Registrierung ihrer Domain ablaufen und wann sie zuletzt aktualisiert wurde. Eine Website, die nicht mehr antwortet oder ihre Domain auslaufen lässt, ist ein Grund für Fragen, kein Beweis.',
    site: 'Website {d}', ok: 'Die Startseite antwortete am {d} mit HTTP {s} ({t} s).', b4: 'Die Startseite antwortete am {d} mit HTTP {s}. Ein 4xx-Status bedeutet oft, dass die Website automatische Besucher sperrt.', x5: 'Die Startseite meldete am {d} einen Serverfehler (HTTP {s}).',
    no: 'Die Startseite antwortete am {d} nicht ({w}).', w_dns: 'die Domain lässt sich nicht auflösen', w_timeout: 'keine Antwort innerhalb von 10 Sekunden', w_tls: 'die sichere Verbindung scheiterte', w_connect: 'die Verbindung scheiterte',
    bad: 'Keine Antwort oder Serverfehler bei {k} der letzten {n} täglichen Prüfungen.', allok: 'Antwort bei allen letzten {n} täglichen Prüfungen.', since: 'Tägliche Prüfungen seit {d}.', streak: 'Antwort bei {n} täglichen Prüfungen in Folge.',
    ce: 'Das TLS-Zertifikat läuft am {d} ab.', ce_soon: 'Das TLS-Zertifikat läuft am {d} ab, in {n} Tagen.', ce_past: 'Das TLS-Zertifikat der Website ist am {d} abgelaufen.', ce_bad: 'Das TLS-Zertifikat der Website bestand am {d} die Prüfung nicht.',
    de: 'Die Domain-Registrierung läuft am {d} ab.', de_soon: 'Die Domain-Registrierung läuft am {d} ab, in {n} Tagen.', de_past: 'Die Registry nennt ein Ablaufdatum, das vorbei ist ({d}). Registries halten eine Domain oft eine Kulanzfrist lang; prüfen Sie erneut, bevor Sie etwas daraus schließen.',
    lm: 'Laut Server wurde die Startseite zuletzt am {d} geändert.', sm: 'Neuestes Datum in der Sitemap: {d}.', to: 'Die Startseite leitet jetzt auf {d} weiter.',
    rb: 'Die robots.txt der Website bittet Robots, die Startseite nicht abzurufen. Wir lesen daher nur DNS, Zertifikat und Registry-Eintrag.',
    strip: 'Letzte {n} tägliche Prüfungen, älteste zuerst', l_u: 'Antwort', l_b: 'Antwort mit 4xx', l_x: 'keine Antwort oder Serverfehler', l_n: 'nicht geprüft',
    s_home: 'Startseite', s_rdap: 'Registry RDAP', s_ct: 'Zertifikatsprotokoll', method: 'Methode und Daten', upd: 'Geprüft am {d}.',
    th: ['Website', 'Heute', 'Letzte 7 Prüfungen', 'Zertifikat läuft ab', 'Domain läuft ab'], t_ok: 'HTTP {s}', t_no: 'keine Antwort', t_bad: '{k} von {n} ohne Antwort',
    l_intro: 'Öffentliche Kennungen im Quelltext dieser Websites, die auch Websites anderer von uns verfolgter Bauträger tragen. Eine gemeinsame Kennung bedeutet meist dieselbe Marketingagentur, dasselbe Webstudio oder dasselbe Hosting-Konto, nicht denselben Eigentümer. Sie ist ein Anlass für Fragen, kein Befund.',
    l_item: 'Teilt {t} {v} mit {list}.', l_item0: 'Teilt {t} mit {list}.', l_none: 'Keine Kennung dieser Websites ist mit einem anderen von uns verfolgten Bauträger gemeinsam (geprüft am {d}).', l_graph: 'Im Netzwerkgraphen der Bauträger ansehen',
    ty: { ga4: 'die Google-Analytics-ID', ua: 'die Universal-Analytics-ID', gtm: 'den Google-Tag-Manager-Container', gads: 'die Google-Ads-ID', fbpx: 'das Meta-Pixel', hotjar: 'die Hotjar-ID', clarity: 'die Microsoft-Clarity-ID', hubspot: 'das HubSpot-Portal', tawk: 'die Tawk.to-Chat-ID', intercom: 'die Intercom-App-ID', wptheme: 'das eigene WordPress-Theme', skeleton: 'dasselbe HTML-Gerüst der Startseite', cert: 'ein TLS-Zertifikat', ns: 'die Nameserver', ip: 'die Serveradresse' } },
  nl: { s_log: 'onze dagelijkse controles', ind: 'over {n} dagen', hh: 'Gezondheid van de website', hl: 'Wat de websites delen',
    intro: 'We controleren de eigen website van de ontwikkelaar één keer per dag: of de homepage antwoordt, wanneer het TLS-certificaat en de domeinregistratie verlopen en wanneer de site voor het laatst is bijgewerkt. Een site die niet meer antwoordt of het domein laat verlopen, is een reden om vragen te stellen, geen bewijs.',
    site: 'Website {d}', ok: 'De homepage antwoordde op {d} met HTTP {s} ({t} s).', b4: 'De homepage antwoordde op {d} met HTTP {s}. Een 4xx-status betekent vaak dat de site automatische bezoekers blokkeert.', x5: 'De homepage gaf op {d} een serverfout (HTTP {s}).',
    no: 'De homepage antwoordde niet op {d} ({w}).', w_dns: 'het domein wordt niet gevonden', w_timeout: 'geen antwoord binnen 10 seconden', w_tls: 'de beveiligde verbinding mislukte', w_connect: 'de verbinding mislukte',
    bad: 'Geen antwoord of een serverfout bij {k} van de laatste {n} dagelijkse controles.', allok: 'Antwoord bij alle laatste {n} dagelijkse controles.', since: 'Dagelijkse controles sinds {d}.', streak: 'Antwoord bij {n} dagelijkse controles op rij.',
    ce: 'Het TLS-certificaat verloopt op {d}.', ce_soon: 'Het TLS-certificaat verloopt op {d}, over {n} dagen.', ce_past: 'Het TLS-certificaat van de site is verlopen op {d}.', ce_bad: 'Het TLS-certificaat van de site doorstond de controle op {d} niet.',
    de: 'De domeinregistratie verloopt op {d}.', de_soon: 'De domeinregistratie verloopt op {d}, over {n} dagen.', de_past: 'Het register noemt een vervaldatum die voorbij is ({d}). Registers houden een domein vaak een tijd vast; controleer opnieuw voordat u er iets uit afleidt.',
    lm: 'Volgens de server is de homepage voor het laatst gewijzigd op {d}.', sm: 'Nieuwste datum in de sitemap: {d}.', to: 'De homepage stuurt nu door naar {d}.',
    rb: 'De robots.txt van de site vraagt robots de homepage niet op te halen, dus lezen we alleen de DNS, het certificaat en de registratie.',
    strip: 'Laatste {n} dagelijkse controles, oudste eerst', l_u: 'antwoord', l_b: 'antwoord met 4xx', l_x: 'geen antwoord of serverfout', l_n: 'niet gecontroleerd',
    s_home: 'homepage', s_rdap: 'register RDAP', s_ct: 'certificatenlog', method: 'Methode en gegevens', upd: 'Gecontroleerd op {d}.',
    th: ['Website', 'Vandaag', 'Laatste 7 controles', 'Certificaat verloopt', 'Domein verloopt'], t_ok: 'HTTP {s}', t_no: 'geen antwoord', t_bad: '{k} van {n} zonder antwoord',
    l_intro: 'Openbare kenmerken in de broncode van deze websites die ook websites van andere ontwikkelaars die we volgen dragen. Een gedeeld kenmerk betekent meestal hetzelfde marketingbureau, dezelfde webstudio of hetzelfde hostingaccount, niet dezelfde eigenaar. Het is een feit om naar te vragen, geen bevinding.',
    l_item: 'Deelt {t} {v} met {list}.', l_item0: 'Deelt {t} met {list}.', l_none: 'Geen kenmerk van deze websites wordt gedeeld met een andere ontwikkelaar die we volgen (gecontroleerd op {d}).', l_graph: 'Bekijk het in de netwerkgrafiek van ontwikkelaars',
    ty: { ga4: 'de Google Analytics-id', ua: 'de Universal Analytics-id', gtm: 'de Google Tag Manager-container', gads: 'de Google Ads-id', fbpx: 'de Meta-pixel', hotjar: 'de Hotjar-id', clarity: 'de Microsoft Clarity-id', hubspot: 'het HubSpot-portaal', tawk: 'de Tawk.to-chat-id', intercom: 'de Intercom-app-id', wptheme: 'het eigen WordPress-thema', skeleton: 'hetzelfde HTML-skelet van de homepage', cert: 'één TLS-certificaat', ns: 'de nameservers', ip: 'het serveradres' } },
  ru: { s_log: 'наши ежедневные проверки', ind: 'через {n} дн.', hh: 'Состояние сайта', hl: 'Что общего у сайтов',
    intro: 'Раз в день мы проверяем собственный сайт застройщика: отвечает ли главная страница, когда истекают его TLS-сертификат и регистрация домена и когда он обновлялся в последний раз. Сайт, который перестал отвечать или не продлил домен, повод задать вопросы, а не доказательство.',
    site: 'Сайт {d}', ok: 'Главная страница ответила HTTP {s} {d} ({t} с).', b4: 'Главная страница ответила HTTP {s} {d}. Статус 4xx часто означает, что сайт блокирует автоматических посетителей.', x5: 'Главная страница вернула ошибку сервера (HTTP {s}) {d}.',
    no: 'Главная страница не ответила {d} ({w}).', w_dns: 'домен не разрешается', w_timeout: 'нет ответа за 10 секунд', w_tls: 'не удалось защищённое соединение', w_connect: 'не удалось соединение',
    bad: 'Нет ответа или ошибка сервера в {k} из последних {n} ежедневных проверок.', allok: 'Ответ во всех последних {n} ежедневных проверках.', since: 'Ежедневные проверки с {d}.', streak: 'Ответ в {n} ежедневных проверках подряд.',
    ce: 'TLS-сертификат истекает {d}.', ce_soon: 'TLS-сертификат истекает {d}, через {n} дн.', ce_past: 'TLS-сертификат сайта истёк {d}.', ce_bad: 'TLS-сертификат сайта не прошёл проверку {d}.',
    de: 'Регистрация домена истекает {d}.', de_soon: 'Регистрация домена истекает {d}, через {n} дн.', de_past: 'Реестр указывает уже прошедшую дату окончания ({d}). Реестры часто держат домен в льготный период, поэтому проверьте ещё раз, прежде чем делать выводы.',
    lm: 'По данным сервера, главная страница последний раз менялась {d}.', sm: 'Самая новая дата в карте сайта: {d}.', to: 'Главная страница теперь перенаправляет на {d}.',
    rb: 'robots.txt сайта просит роботов не загружать главную страницу, поэтому мы читаем только DNS, сертификат и запись в реестре.',
    strip: 'Последние {n} ежедневных проверок, от старых к новым', l_u: 'ответ', l_b: 'ответ 4xx', l_x: 'нет ответа или ошибка сервера', l_n: 'не проверялось',
    s_home: 'главная страница', s_rdap: 'реестр RDAP', s_ct: 'журнал сертификатов', method: 'Метод и данные', upd: 'Проверено {d}.',
    th: ['Сайт', 'Сегодня', 'Последние 7 проверок', 'Сертификат истекает', 'Домен истекает'], t_ok: 'HTTP {s}', t_no: 'нет ответа', t_bad: '{k} из {n} без ответа',
    l_intro: 'Публичные идентификаторы в коде этих сайтов, которые есть и на сайтах других застройщиков, которых мы отслеживаем. Общий идентификатор обычно означает одно маркетинговое агентство, одну веб-студию или один хостинг-аккаунт, а не одного владельца. Это факт, о котором стоит спросить, а не вывод.',
    l_item: 'Общий {t} {v} с {list}.', l_item0: 'Общий {t} с {list}.', l_none: 'Ни один идентификатор этих сайтов не совпадает с другим отслеживаемым застройщиком (проверено {d}).', l_graph: 'Посмотреть на графе сети застройщиков',
    ty: { ga4: 'идентификатор Google Analytics', ua: 'идентификатор Universal Analytics', gtm: 'контейнер Google Tag Manager', gads: 'идентификатор Google Ads', fbpx: 'пиксель Meta', hotjar: 'идентификатор Hotjar', clarity: 'идентификатор Microsoft Clarity', hubspot: 'портал HubSpot', tawk: 'идентификатор чата Tawk.to', intercom: 'идентификатор Intercom', wptheme: 'собственная тема WordPress', skeleton: 'одинаковый HTML-каркас главной страницы', cert: 'один TLS-сертификат', ns: 'DNS-серверы', ip: 'адрес сервера' } },
  zh: { s_log: '我们的每日检查', ind: '还有 {n} 天', hh: '网站状况', hl: '网站之间的共同点',
    intro: '我们每天检查一次开发商自己的网站：首页是否有响应，TLS 证书和域名注册何时到期，以及最近一次更新是什么时候。网站停止响应或域名失效是提出问题的理由，而不是任何事情的证据。',
    site: '网站 {d}', ok: '首页于 {d} 以 HTTP {s} 响应（{t} 秒）。', b4: '首页于 {d} 以 HTTP {s} 响应。4xx 状态通常表示网站拦截自动访问。', x5: '首页于 {d} 返回服务器错误（HTTP {s}）。',
    no: '首页于 {d} 没有响应（{w}）。', w_dns: '域名无法解析', w_timeout: '10 秒内无响应', w_tls: '安全连接失败', w_connect: '连接失败',
    bad: '最近 {n} 次每日检查中有 {k} 次无响应或服务器错误。', allok: '最近 {n} 次每日检查均有响应。', since: '自 {d} 起每日检查。', streak: '连续 {n} 次每日检查有响应。',
    ce: 'TLS 证书于 {d} 到期。', ce_soon: 'TLS 证书于 {d} 到期，还有 {n} 天。', ce_past: '网站出示的 TLS 证书已于 {d} 到期。', ce_bad: '网站出示的 TLS 证书在 {d} 未通过验证。',
    de: '域名注册于 {d} 到期。', de_soon: '域名注册于 {d} 到期，还有 {n} 天。', de_past: '注册局列出的到期日期已过（{d}）。注册局通常会保留域名一段宽限期，下结论前请再次检查。',
    lm: '服务器显示首页最近一次更改于 {d}。', sm: '网站地图中的最新日期：{d}。', to: '首页现在重定向到 {d}。',
    rb: '该网站的 robots.txt 要求机器人不要抓取首页，因此我们只读取其 DNS、证书和注册记录。',
    strip: '最近 {n} 次每日检查，从早到晚', l_u: '有响应', l_b: '以 4xx 响应', l_x: '无响应或服务器错误', l_n: '未检查',
    s_home: '首页', s_rdap: '注册局 RDAP', s_ct: '证书日志', method: '方法和数据', upd: '检查于 {d}。',
    th: ['网站', '今天', '最近 7 次检查', '证书到期', '域名到期'], t_ok: 'HTTP {s}', t_no: '无响应', t_bad: '{n} 次中 {k} 次无响应',
    l_intro: '这些网站源代码中的公开标识符，我们追踪的其他开发商的网站也带有这些标识符。共享标识符通常意味着同一家营销公司、网页工作室或托管账户，而不是同一个所有者。这是值得询问的事实，不是结论。',
    l_item: '与 {list} 共享{t} {v}。', l_item0: '与 {list} 共享{t}。', l_none: '这些网站的标识符没有与我们追踪的其他开发商共享（检查于 {d}）。', l_graph: '在开发商网络图中查看',
    ty: { ga4: 'Google Analytics ID', ua: 'Universal Analytics ID', gtm: 'Google 跟踪代码管理器容器', gads: 'Google Ads ID', fbpx: 'Meta 像素', hotjar: 'Hotjar ID', clarity: 'Microsoft Clarity ID', hubspot: 'HubSpot 门户', tawk: 'Tawk.to 聊天 ID', intercom: 'Intercom 应用 ID', wptheme: '定制 WordPress 主题', skeleton: '相同的首页 HTML 骨架', cert: '同一张 TLS 证书', ns: '域名服务器', ip: '服务器地址' } },
  ar: { s_log: 'فحوصنا اليومية', ind: 'بعد {n} يوماً', hh: 'حالة الموقع', hl: 'ما تشترك فيه المواقع',
    intro: 'نفحص الموقع الخاص بالمطور مرة كل يوم: هل تستجيب الصفحة الرئيسية، ومتى تنتهي صلاحية شهادة TLS وتسجيل النطاق، ومتى حُدّث آخر مرة. الموقع الذي يتوقف عن الاستجابة أو يترك نطاقه ينتهي سبب لطرح الأسئلة، وليس دليلاً على شيء.',
    site: 'الموقع {d}', ok: 'استجابت الصفحة الرئيسية بـ HTTP {s} في {d} ({t} ث).', b4: 'استجابت الصفحة الرئيسية بـ HTTP {s} في {d}. حالة 4xx تعني غالباً أن الموقع يحجب الزيارات الآلية.', x5: 'أعادت الصفحة الرئيسية خطأ خادم (HTTP {s}) في {d}.',
    no: 'لم تستجب الصفحة الرئيسية في {d} ({w}).', w_dns: 'النطاق لا يُحلّ', w_timeout: 'لا استجابة خلال 10 ثوانٍ', w_tls: 'فشل الاتصال الآمن', w_connect: 'فشل الاتصال',
    bad: 'لا استجابة أو خطأ خادم في {k} من آخر {n} فحوص يومية.', allok: 'استجاب في كل آخر {n} فحوص يومية.', since: 'فحوص يومية منذ {d}.', streak: 'استجاب في {n} فحوص يومية متتالية.',
    ce: 'تنتهي شهادة TLS في {d}.', ce_soon: 'تنتهي شهادة TLS في {d}، بعد {n} يوماً.', ce_past: 'انتهت شهادة TLS التي قدمها الموقع في {d}.', ce_bad: 'لم تجتز شهادة TLS التي قدمها الموقع التحقق في {d}.',
    de: 'ينتهي تسجيل النطاق في {d}.', de_soon: 'ينتهي تسجيل النطاق في {d}، بعد {n} يوماً.', de_past: 'يذكر السجل تاريخ انتهاء مضى ({d}). كثيراً ما تحتفظ السجلات بالنطاق مدة سماح، فأعد الفحص قبل استنتاج أي شيء.',
    lm: 'يفيد الخادم بأن الصفحة الرئيسية تغيّرت آخر مرة في {d}.', sm: 'أحدث تاريخ في خريطة الموقع: {d}.', to: 'تعيد الصفحة الرئيسية التوجيه الآن إلى {d}.',
    rb: 'يطلب ملف robots.txt للموقع من الروبوتات عدم جلب الصفحة الرئيسية، لذلك نقرأ فقط DNS والشهادة وسجل النطاق.',
    strip: 'آخر {n} فحوص يومية، من الأقدم إلى الأحدث', l_u: 'استجاب', l_b: 'استجاب بـ 4xx', l_x: 'لا استجابة أو خطأ خادم', l_n: 'لم يُفحص',
    s_home: 'الصفحة الرئيسية', s_rdap: 'سجل RDAP', s_ct: 'سجل الشهادات', method: 'المنهج والبيانات', upd: 'فُحص في {d}.',
    th: ['الموقع', 'اليوم', 'آخر 7 فحوص', 'انتهاء الشهادة', 'انتهاء النطاق'], t_ok: 'HTTP {s}', t_no: 'لا استجابة', t_bad: '{k} من {n} بلا استجابة',
    l_intro: 'معرّفات عامة في شيفرة هذه المواقع تحملها أيضاً مواقع مطورين آخرين نتابعهم. المعرّف المشترك يعني عادة وكالة التسويق نفسها أو استوديو الويب نفسه أو حساب الاستضافة نفسه، وليس المالك نفسه. إنه حقيقة للسؤال عنها، وليس استنتاجاً.',
    l_item: 'يشترك في {t} {v} مع {list}.', l_item0: 'يشترك في {t} مع {list}.', l_none: 'لا يشترك أي معرّف في هذه المواقع مع مطور آخر نتابعه (فُحص في {d}).', l_graph: 'شاهده في مخطط شبكة المطورين',
    ty: { ga4: 'معرّف Google Analytics', ua: 'معرّف Universal Analytics', gtm: 'حاوية Google Tag Manager', gads: 'معرّف Google Ads', fbpx: 'بكسل Meta', hotjar: 'معرّف Hotjar', clarity: 'معرّف Microsoft Clarity', hubspot: 'بوابة HubSpot', tawk: 'معرّف دردشة Tawk.to', intercom: 'معرّف تطبيق Intercom', wptheme: 'قالب WordPress الخاص', skeleton: 'هيكل HTML نفسه للصفحة الرئيسية', cert: 'شهادة TLS واحدة', ns: 'خوادم الأسماء', ip: 'عنوان الخادم' } },
};
const tt = (lang, k, v) => { const L = S[lang] || S.en; let s = L[k] != null ? L[k] : S.en[k]; if (typeof s !== 'string') return s; for (const [a, b] of Object.entries(v || {})) s = s.split('{' + a + '}').join(String(b)); return s; };
export const webHeading = (lang, which) => tt(lang, which === 'l' ? 'hl' : 'hh');
export const typeLabel = (lang, t) => ((S[lang] || S.en).ty || S.en.ty)[t] || t;

// ------------------------------------------------------------------------------------------------ HTML
export const WEB_CSS = '<style id="kweb18">.kw-strip{display:flex;gap:2px;margin:6px 0 2px;padding:0;list-style:none;max-width:480px}.kw-strip li{flex:0 0 auto;width:calc((100% - 58px) / 30);height:22px;border-radius:2px;background:var(--k-sunken,#E8ECEA)}' +
  '.kw-strip .u{background:var(--k-ok,#1F6B45)}.kw-strip .b{background:var(--k-warn,#8A5A00)}.kw-strip .x,.kw-strip .z{background:var(--k-bad,#A12A1C)}.kw-strip .n{background:repeating-linear-gradient(135deg,var(--k-sunken,#E8ECEA) 0 3px,var(--k-line-2,#C9D1CE) 3px 5px)}' +
  '.kw-key{display:flex;flex-wrap:wrap;gap:4px 14px;margin:4px 0 10px;padding:0;list-style:none;font-size:var(--k-fs-xs,13px);color:var(--k-muted)}.kw-key i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-inline-end:6px;vertical-align:-1px}' +
  '.kw-site{margin:0 0 18px}.kw-site h3{font-size:var(--k-fs-md,17px);margin:0 0 4px;overflow-wrap:anywhere}.kw-site .k-xs{color:var(--k-muted)}.kw-dom{font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
  '.kw-links li span.kw-v{font-family:inherit;overflow-wrap:anywhere}</style>';
const KEYS = { u: 'l_u', b: 'l_b', x: 'l_x', '0': 'l_x', '-': 'l_n' };
function strip(health, h, lang) {
  const s = h.h || '', days = health.days || [];
  const cells = [...s].map((c, i) => '<li class="' + (c === '0' ? 'z' : c === '-' ? 'n' : c) + '" title="' + esc((days[i] ? fdt(days[i], lang) + ': ' : '') + tt(lang, KEYS[c] || 'l_n')) + '"></li>').join('');
  const cnt = c => [...s].filter(x => x === c).length;
  const alt = tt(lang, 'strip', { n: s.length }) + ': ' + [['u', 'l_u'], ['b', 'l_b'], ['x', 'l_x'], ['-', 'l_n']].map(([c, k]) => tt(lang, k) + ' ' + (c === 'x' ? cnt('x') + cnt('0') : cnt(c))).join(', ');
  return '<p class="k-xs">' + esc(tt(lang, 'strip', { n: s.length })) + '</p><ul class="kw-strip" role="img" aria-label="' + esc(alt) + '">' + cells + '</ul>' +
    '<ul class="kw-key" aria-hidden="true">' + [['u', 'var(--k-ok,#1F6B45)'], ['b', 'var(--k-warn,#8A5A00)'], ['x', 'var(--k-bad,#A12A1C)'], ['-', 'var(--k-sunken,#E8ECEA)']].map(([c, col]) => '<li><i style="background:' + col + '"></i>' + esc(tt(lang, KEYS[c])) + '</li>').join('') + '</ul>';
}
const src = (u, label) => u.startsWith('/') ? ' <a class="src" href="' + esc(u) + '">' + esc(label) + '</a>' : ' <a class="src" href="' + esc(u) + '" rel="nofollow noopener" target="_blank">' + esc(label) + '</a>';
const li = (t, u, label) => '<li class="kfact">' + esc(t) + (u ? src(u, label) : '') + '</li>';
function siteFacts(health, d, h, lang) {
  const today = health.updated, home = 'https://' + d + '/', rd = 'https://client.rdap.org/?type=domain&object=' + encodeURIComponent(d), ct = 'https://crt.sh/?q=' + encodeURIComponent(d);
  const F = [];
  if (h.rb) F.push(li(tt(lang, 'rb'), home + 'robots.txt', 'robots.txt'));
  else if (h.s > 0 && h.s < 400) F.push(li(tt(lang, 'ok', { s: h.s, d: fdt(h.ck, lang), t: ((h.ms || 0) / 1000).toFixed(1) }), home, tt(lang, 's_home')));
  else if (h.s >= 400 && h.s < 500) F.push(li(tt(lang, 'b4', { s: h.s, d: fdt(h.ck, lang) }), home, tt(lang, 's_home')));
  else if (h.s >= 500) F.push(li(tt(lang, 'x5', { s: h.s, d: fdt(h.ck, lang) }), home, tt(lang, 's_home')));
  else if (h.s === 0) F.push(li(tt(lang, 'no', { d: fdt(h.ck, lang), w: tt(lang, 'w_' + (h.err || 'connect')) }), home, tt(lang, 's_home')));
  if (!h.rb && h.s != null && lastN(h, 7).n < 3) F.push(li(tt(lang, 'since', { d: fdt(firstChecked(health, h) || today, lang) }), '/data/web-health.json', tt(lang, 's_log')));
  if (!h.rb) {
    const w = lastN(h, 7);
    if (w.n >= 3) F.push(li((w.bad ? tt(lang, 'bad', { k: w.bad, n: w.n }) : tt(lang, 'allok', { n: w.n })) + (w.n < 7 ? ' ' + tt(lang, 'since', { d: fdt(firstChecked(health, h) || today, lang) }) : ''), '/data/web-health.json', tt(lang, 's_log')));
    if ((h.st || 0) >= 2) F.push(li(tt(lang, 'streak', { n: h.st }), '/data/web-health.json', tt(lang, 's_log')));
  }
  if (h.to) F.push(li(tt(lang, 'to', { d: h.to }), home, tt(lang, 's_home')));
  if (h.ce === 'invalid') F.push(li(tt(lang, 'ce_bad', { d: fdt(h.ck, lang) }), ct, tt(lang, 's_ct')));
  else if (h.ce) { const n = daysTo(h.ce, today); F.push(li(n < 0 ? tt(lang, 'ce_past', { d: fdt(h.ce, lang) }) : n <= 30 ? tt(lang, 'ce_soon', { d: fdt(h.ce, lang), n }) : tt(lang, 'ce', { d: fdt(h.ce, lang) }), ct, tt(lang, 's_ct'))); }
  if (h.de) { const n = daysTo(h.de, today); F.push(li(n < 0 ? tt(lang, 'de_past', { d: fdt(h.de, lang) }) : n <= 60 ? tt(lang, 'de_soon', { d: fdt(h.de, lang), n }) : tt(lang, 'de', { d: fdt(h.de, lang) }), rd, tt(lang, 's_rdap'))); }
  if (h.lm && h.lm <= today) F.push(li(tt(lang, 'lm', { d: fdt(h.lm, lang) }), home, tt(lang, 's_home')));
  if (h.sm) F.push(li(tt(lang, 'sm', { d: fdt(h.sm, lang) }), home + 'sitemap.xml', 'sitemap'));
  return '<ul class="fl">' + F.join('') + '</ul>' + (h.rb ? '' : strip(health, h, lang));
}
const methodLine = (health, lang) => '<p class="k-xs">' + esc(tt(lang, 'upd', { d: fdt(health.updated, lang) })) + ' <a href="/data/web-health.json">' + esc(tt(lang, 'method')) + '</a>: ' + esc(health.method || '') + '</p>';
export function projectDomains(wd, x) {
  const H = (wd && wd.health && wd.health.d) || {};
  return [...new Set([x.url, x.du].map(regDomain).filter(d => d && H[d]))];
}
export function webProjectHtml(wd, x, lang) {
  const doms = projectDomains(wd, x); if (!doms.length) return '';
  const H = wd.health.d;
  return WEB_CSS + '<p class="ki">' + esc(tt(lang, 'intro')) + '</p>' + doms.map(d => '<div class="kw-site"><h3>' + esc(tt(lang, 'site', { d })) + '</h3>' + siteFacts(wd.health, d, H[d], lang) + '</div>').join('') + methodLine(wd.health, lang);
}
export function webDevHealthHtml(wd, slug, lang) {
  const doms = ((wd && wd.devDoms.get(slug)) || []).slice().sort(); if (!doms.length) return '';
  const H = wd.health.d, today = wd.health.updated, th = tt(lang, 'th');
  if (doms.length === 1) return WEB_CSS + '<p class="ki">' + esc(tt(lang, 'intro')) + '</p><div class="kw-site"><h3>' + esc(tt(lang, 'site', { d: doms[0] })) + '</h3>' + siteFacts(wd.health, doms[0], H[doms[0]], lang) + '</div>' + methodLine(wd.health, lang);
  const rows = doms.map(d => {
    const h = H[d], w = lastN(h, 7), ce = h.ce && h.ce !== 'invalid' ? fdt(h.ce, lang) + (daysTo(h.ce, today) <= 30 && daysTo(h.ce, today) >= 0 ? ' (' + tt(lang, 'ind', { n: daysTo(h.ce, today) }) + ')' : '') : h.ce === 'invalid' ? tt(lang, 'ce_bad', { d: fdt(h.ck, lang) }) : '-';
    const de = h.de ? fdt(h.de, lang) + (daysTo(h.de, today) <= 60 && daysTo(h.de, today) >= 0 ? ' (' + tt(lang, 'ind', { n: daysTo(h.de, today) }) + ')' : '') : '-';
    const now = h.rb ? 'robots.txt' : h.s > 0 ? tt(lang, 't_ok', { s: h.s }) : h.s === 0 ? tt(lang, 't_no') : '-';
    return '<tr><td data-label="' + esc(th[0]) + '"><a class="kw-dom" href="https://' + esc(d) + '/" rel="nofollow noopener" target="_blank">' + esc(d) + '</a></td><td data-label="' + esc(th[1]) + '">' + esc(now) + '</td><td data-label="' + esc(th[2]) + '">' + esc(h.rb || w.n < 3 ? '-' : w.bad ? tt(lang, 't_bad', { k: w.bad, n: w.n }) : tt(lang, 'allok', { n: w.n })) + '</td><td data-label="' + esc(th[3]) + '">' + esc(ce) + '</td><td data-label="' + esc(th[4]) + '">' + esc(de) + '</td></tr>';
  }).join('');
  return WEB_CSS + '<p class="ki">' + esc(tt(lang, 'intro')) + '</p><div class="k-table-wrap"><table class="k-table k-table--dense k-table--stack"><thead><tr>' + th.map(x => '<th>' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<p class="k-xs">' + esc(tt(lang, 'th')[3]) + ': <a href="https://crt.sh/" rel="nofollow noopener" target="_blank">crt.sh</a>. ' + esc(tt(lang, 'th')[4]) + ': <a href="https://client.rdap.org/" rel="nofollow noopener" target="_blank">RDAP</a>.</p>' + methodLine(wd.health, lang);
}
export function webDevLinksHtml(wd, slug, lang) {
  const doms = (wd && wd.devDoms.get(slug)) || []; if (!doms.length || !wd.links) return '';
  const G = wd.byDev.get(slug) || [], P = pre(lang);
  if (!G.length) return '<p class="ki">' + esc(tt(lang, 'l_none', { d: fdt(wd.links.updated, lang) })) + '</p>';
  const items = G.map(g => {
    const mine = g.d.filter(d => wd.health.d[d] && wd.health.d[d].dv === slug);
    const others = [...new Set(g.dv.filter(s => s !== slug))].map(s => {
      const od = g.d.filter(d => wd.health.d[d] && wd.health.d[d].dv === s);
      return '<a href="' + P + '/developers/' + esc(s) + '/">' + esc(wd.devName.get(s) || s) + '</a> (' + od.map(esc).join(', ') + ')';
    }).join(', ');
    const v = g.t === 'cert' ? '' : g.t === 'skeleton' ? g.v.slice(0, 12) : g.v;
    const txt = v ? tt(lang, 'l_item', { t: '%T%', v: '%V%', list: '%L%' }) : tt(lang, 'l_item0', { t: '%T%', list: '%L%' });
    const html = esc(txt).replace('%T%', esc(typeLabel(lang, g.t))).replace('%V%', '<span class="kw-v" dir="ltr">' + esc(v) + '</span>').replace('%L%', others);
    return '<li class="kfact">' + html + ' <small>(' + mine.map(esc).join(', ') + ')</small>' + src('https://' + mine[0] + '/', mine[0]) + '</li>';
  }).join('');
  return '<p class="ki">' + esc(tt(lang, 'l_intro')) + '</p><ul class="fl kw-links">' + items + '</ul><p><a class="more" href="' + P + '/graph/developers/">' + esc(tt(lang, 'l_graph')) + '</a> · <a href="/data/dev-links.json">dev-links.json</a> (' + esc(fdt(wd.links.updated, lang)) + ')</p>';
}

// ------------------------------------------------------------------------------------------------ graph and alerts
// web link groups for the developer network graph: [{t, v, label, devs:[slug...], doms:[...]}]
export async function webGroups(env) {
  const wd = await webData(env).catch(() => null);
  if (!wd || !wd.links) return { groups: [], updated: null };
  return { updated: wd.links.updated, groups: (wd.links.groups || []).map(g => ({ t: g.t, v: g.v, label: typeLabel('en', g.t).replace(/^(the|one) /, '') + (g.t === 'cert' ? '' : ' ' + (g.t === 'skeleton' ? g.v.slice(0, 12) : g.v)), devs: g.dv, doms: g.d, dom: Object.fromEntries(g.d.map(d => [d, wd.health && wd.health.d[d] ? wd.health.d[d].dv : null])) })) };
}
// per project id: website state for the daily push-alert diff (kbx_j.js stateOf/diffOf). Only states that matter to a buyer:
// no answer on 3 or more of the last 7 checks, certificate within 14 days or expired, domain within 30 days or past
export async function webStates(env) {
  const wd = await webData(env).catch(() => null); const out = {};
  if (!wd || !wd.health || !wd.named) return out;
  const today = wd.health.updated;
  for (const x of wd.named.projects || []) {
    for (const d of projectDomains(wd, x)) {
      const h = wd.health.d[d], w = lastN(h, 7);
      const s = { d, down: !h.rb && w.n >= 3 && w.bad >= 3 ? w.bad + '/' + w.n : null, ce: h.ce && h.ce !== 'invalid' && daysTo(h.ce, today) <= 14 ? h.ce : h.ce === 'invalid' ? 'invalid' : null, de: h.de && daysTo(h.de, today) <= 30 ? h.de : null };
      if (s.down || s.ce || s.de) { out[x.id] = s; break; }
      if (!out[x.id]) out[x.id] = { d, down: null, ce: null, de: null };
    }
  }
  return out;
}
export function webDiff(a, b) {   // plain-language lines for the push message
  const L = []; a = a || {}; if (!b) return L;
  if (b.down && !a.down) L.push('Developer website ' + b.d + ': no answer on ' + b.down.split('/')[0] + ' of the last ' + b.down.split('/')[1] + ' daily checks');
  if (b.ce && b.ce !== a.ce) L.push('Developer website ' + b.d + ': ' + (b.ce === 'invalid' ? 'TLS certificate failed validation' : 'TLS certificate expires ' + b.ce));
  if (b.de && b.de !== a.de) L.push('Developer website ' + b.d + ': domain registration expires ' + b.de);
  return L;
}

// ------------------------------------------------------------------------------------------------ JSON routes
function out(o, s) { return new Response(JSON.stringify(o), { status: s || 200, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': s && s !== 200 ? 'public, max-age=60' : 'public, max-age=600', 'x-content-type-options': 'nosniff' } }); }
export async function handle(req, u, env) {
  const wd = await webData(env).catch(() => null);
  if (!wd || !wd.health) return out({ error: 'unavailable', note: 'web-health.json not published yet' }, 503);
  const meta = { updated: wd.health.updated, days: wd.health.days, legend: wd.health.legend, method: wd.health.method, licence: wd.health.licence, data: [ORIGIN + '/data/web-health.json', ORIGIN + '/data/dev-links.json'] };
  let m = u.pathname.match(/^\/api\/x\/web\/project\/([A-Za-z0-9-]+)$/);
  if (m) {
    const id = m[1].toUpperCase(), x = ((wd.named && wd.named.projects) || []).find(p => p.id === id);
    if (!x) return out({ error: 'not found' }, 404);
    const doms = projectDomains(wd, x);
    return out(Object.assign({ id, slug: x.s, sites: doms.map(d => Object.assign({ domain: d }, wd.health.d[d])) }, meta));
  }
  m = u.pathname.match(/^\/api\/x\/web\/dev\/([a-z0-9-]+)$/);
  const s = m[1], doms = wd.devDoms.get(s) || [];
  if (!doms.length && !wd.devName.has(s)) return out({ error: 'not found' }, 404);
  return out(Object.assign({ developer: s, name: wd.devName.get(s) || null, sites: doms.map(d => Object.assign({ domain: d }, wd.health.d[d])), shared: (wd.byDev.get(s) || []).map(g => ({ type: g.t, type_label: (wd.links.types || {})[g.t] || g.t, value: g.v, domains: g.d, developers: g.dv })), caveat: wd.links && wd.links.caveat }, meta));
}
