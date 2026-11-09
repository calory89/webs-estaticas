// kolaboro.com batch 14 (agent f14c): global risk map.
//   GET /graph/developers/  /<lang>/graph/developers/   developer network graph (canvas, search, click-through to named pages)
//   GET /api/x/net/graph                               the graph as JSON: developers, links by type, evidence per link, method
//   GET /live/xrays/        /<lang>/live/xrays/        live globe of X-rays as they run (market-level points, no URLs or names)
//   GET /api/x/net/live                                aggregate of recent X-rays (public DB function kolaboro_xray_live)
// Graph data: only our own public file /data/named.json, no new scraping. A link between two developers
// means two of their tracked projects publish the same identifier: legal company name, company registry number, official website
// domain, company address (street level), or the same project name. Directors are not linked: our public Companies House data
// labels directors per project only, and private individuals are never named. Sumba projects are never named (conflict of
// interest), the same rule as the named pages (kbx_named.js drops them before we see them).
import { data as namedData, isListing, host, pre, esc } from './kbx_named.js';
import { rpc } from './kolaboro.js';
import { LAND } from './kbx_net_land.js';
import { familyData } from './kbx_named_plus.js';   // batch 19 (n19e): corporate family from GLEIF level 2 (/data/gleif-family.json)
import { webGroups } from './kbx_web.js';   // batch 18 (n18a): identifiers shared by developer websites (/data/dev-links.json)   // land mask: 1 bit per 2x2 degree cell (180 x 90), rows from 90N, from Natural Earth 110m land (public domain)

const ORIGIN = 'https://kolaboro.com';
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:graph\/developers|live\/xrays)\/?$|^\/api\/x\/net\/(?:graph|live)$/;
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const GRAPH_V = 'net-v1';
const HUB = 4;   // an identifier shared by more than this many developers is a portal, agency or template, not a link

let MEMO = {};
async function file(env, name) {
  const m = MEMO[name]; if (m && Date.now() - m.t < 600000) return m.v;
  let r = null;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); } catch (e) { r = null; }
  if (!r || !r.ok) r = await fetch(ORIGIN + '/data/' + name, { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!r.ok) throw new Error(name + ' ' + r.status);
  const v = await r.json(); MEMO[name] = { t: Date.now(), v }; return v;
}

// ------------------------------------------------------------------------------------------------ graph building (pure)
const fold = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
const LEGAL = /\b(pt|cv|llc|l\.?l\.?c|ltd|limited|plc|llp|inc|corp|corporation|gmbh|ag|kg|sa|s\.a|sas|sarl|sl|s\.l|slu|sau|srl|spa|bv|nv|oy|ab|as|a\/s|aps|sro|s\.r\.o|kft|zrt|sp\.? z o\.?o|ooo|jsc|pjsc|pcl|co\.?,? ltd|sdn bhd|bhd|pte|pty|fze|fzco|fz-llc|dmcc|s\.a\.p\.i|sapi|s de rl|de c\.?v|lda|unipessoal|unipersonal|eood|ood|doo|d\.o\.o|ltda|eirl|sociedad|company)\b/;
// legal names: each ';'-separated part, cut before '(' and before ', <id or note>'; kept only if it carries a legal form
function legalNames(s) {
  if (!s || typeof s !== 'string') return [];
  const out = [];
  for (let part of s.split(/;|\band\b|\s\/\s/)) {
    part = part.replace(/\(.*$/, '').replace(/,\s*(?:subsidiary|part of|per |nif|cif|rfc|id |reg|registration|registered|cr |cin|uen|nib|npwp|tax|company no|licen[cs]e|trade).*$/i, '').trim();
    const f = fold(part).replace(/[“”"'’]/g, '').replace(/\s+/g, ' ').trim();
    if (f.length < 6 || !LEGAL.test(f)) continue;
    const k = f.replace(/[.,]/g, '').replace(/\s+/g, ' ').trim();
    out.push({ k, label: part.replace(/\s+/g, ' ').trim() });
  }
  return out;
}
// registry ids published next to the company name: tokens with at least 6 digits (NIF A-07248206, RFC MTO220308K21, 0505531000630)
function regIds(s) {
  if (!s || typeof s !== 'string') return [];
  const out = new Set();
  for (const m of s.matchAll(/\b([A-Z]{0,4}[- ]?[0-9][0-9A-Z-]{5,24})\b/g)) {
    const t = m[1].replace(/[- ]/g, '').toUpperCase(); const digits = (t.match(/\d/g) || []).length;
    if (digits >= 6 && t.length <= 20 && !/^(19|20)\d{2}(0[1-9]|1[0-2])?$/.test(t)) out.add(t);
  }
  return [...out];
}
// street-level company address: each comma/bracket part of the HQ text with a house number and a street word ("Jl. Bumbak No.156");
// city-only HQs never link
function addresses(s) {
  if (!s || typeof s !== 'string') return [];
  const out = [];
  for (const seg of s.split(/[(),;]/)) {
    const f = fold(seg).replace(/[^a-z0-9 ]+/g, ' ').replace(/\bno\b/g, ' ').replace(/\s+/g, ' ').trim();
    if (f.length >= 8 && /\d/.test(f) && /\b(jl|jalan|gg|street|st|road|rd|avenue|ave|calle|avenida|av|rua|strasse|str|blvd|boulevard|via|rue|lane|soi|moo|floor|tower|building)\b/.test(f)) out.push({ k: f, label: seg.trim() });
  }
  return out;
}
const GENERIC = new Set(['homes', 'home', 'properties', 'property', 'development', 'developments', 'developer', 'developers', 'group', 'real', 'estate', 'realty', 'residence', 'residences', 'resort', 'villas', 'villa', 'living', 'land', 'invest', 'investment', 'investments', 'capital', 'holding', 'holdings', 'company', 'limited', 'construction', 'tower', 'towers', 'city', 'park', 'project', 'projects', 'international', 'global', 'bali', 'dubai', 'grupo', 'inmobiliaria', 'immobilien', 'the']);
const SLD2 = /\.(co|com|net|org|gov|ac|or|ne|go|in|edu)\.[a-z]{2}$/;
function regDomain(h) {
  h = String(h || '').toLowerCase().replace(/^www\./, ''); if (!h || !h.includes('.')) return '';
  const p = h.split('.'); return SLD2.test(h) ? p.slice(-3).join('.') : p.slice(-2).join('.');
}
const nameKey = n => fold(n).replace(/\b(by|the|residences?|residence|resort|villas?|apartments?|tower|towers|project|phase \d+)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();

export function buildGraph(P, web, fam) {
  const devs = new Map();
  for (const x of P) {
    if (!x.dvs || !x.dv) continue;
    let d = devs.get(x.dvs); if (!d) devs.set(x.dvs, d = { s: x.dvs, n: x.dv, p: [], mk: new Map(), co: new Set() });
    d.p.push(x); d.mk.set(x.mk, (d.mk.get(x.mk) || 0) + 1); if (x.co) d.co.add(x.co);
  }
  const TYPES = ['company', 'regid', 'domain', 'address', 'name', 'web', 'family'];
  const idx = Object.fromEntries(TYPES.map(t => [t, new Map()]));   // type -> key -> Map(dev -> [{project, label}])
  const add = (t, key, dev, x, label) => {
    if (!key) return; const m = idx[t]; let e = m.get(key); if (!e) m.set(key, e = new Map());
    if (!e.has(dev)) e.set(dev, []); const a = e.get(dev); if (!a.some(o => o.x === x)) a.push({ x, label });
  };
  for (const d of devs.values()) for (const x of d.p) {
    const fx = x.fx || {};
    for (const ln of legalNames(fx.developer_company)) add('company', ln.k, d.s, x, ln.label);
    for (const id of regIds(fx.developer_company)) add('regid', id, d.s, x, id);
    // own website only: the domain must carry a distinctive word of the developer's or the project's name (news, portals, registers
    // and agents that host pages about many developers do not), and portal domains are skipped outright
    const toks = [...new Set((fold(d.n) + ' ' + fold(x.n)).split(/[^a-z0-9]+/).filter(w => w.length >= 4 && !GENERIC.has(w)))];
    for (const u of [x.url, x.du]) {
      if (!u || isListing(u)) continue;
      const rd = regDomain(host(u)); if (!rd) continue;
      const label = rd.split('.')[0].replace(/-/g, '');
      if (!toks.some(w => label.includes(w))) continue;
      add('domain', rd, d.s, x, rd);
    }
    for (const a of addresses(fx.developer_hq)) add('address', a.k, d.s, x, a.label);
    const nk = nameKey(x.n); if (nk.length >= 6) add('name', nk + '|' + (x.co || x.mk), d.s, x, x.n);
  }
  // n18a: the same public identifier in the source, DNS or TLS certificate of the developers' own websites (read daily by dev_web.py)
  for (const g of (web && web.groups) || []) for (const s of g.devs || []) { const d = devs.get(s); if (!d) continue; const dm = (g.doms || []).filter(x => g.dom && g.dom[x] === s); add('web', g.t + ':' + g.v, s, d.p[0], g.label + (dm.length ? ' (' + dm.join(', ') + ')' : '')); }
  // n19e: GLEIF level 2: one developer is the other's direct or ultimate parent or direct child, or both report the same parent
  const FD = (fam && fam.devs) || {}, WHY = { parent: 'direct parent or child', child: 'direct parent or child', ultimate: 'ultimate parent', same_parent: 'same direct parent', same_ultimate: 'same ultimate parent' };
  for (const l of (fam && fam.links) || []) {
    const da = devs.get(l.a), db = devs.get(l.b); if (!da || !db || !FD[l.a] || !FD[l.b]) continue;
    const pk = l.why.includes('same_parent') ? 'parent' : l.why.includes('same_ultimate') ? 'ultimate' : null;
    const v = l.why.map(w => WHY[w]).filter((w, i, a) => a.indexOf(w) === i).join(', ') + ' (LEI ' + FD[l.a].lei + ' / ' + FD[l.b].lei + (pk && FD[l.a][pk] ? '; parent ' + FD[l.a][pk].legal : '') + ')';
    add('family', 'gl:' + l.a + '|' + l.b, l.a, da.p[0], v); add('family', 'gl:' + l.a + '|' + l.b, l.b, db.p[0], v);
  }
  const links = new Map(), hubs = Object.fromEntries(TYPES.map(t => [t, 0])), shared = Object.fromEntries(TYPES.map(t => [t, 0]));
  for (const t of TYPES) for (const [key, e] of idx[t]) {
    if (e.size < 2) continue;
    if (t !== 'family' && e.size > (t === 'web' ? 8 : HUB)) { hubs[t]++; continue; }
    shared[t]++;
    const ds = [...e.keys()].sort();
    for (let i = 0; i < ds.length; i++) for (let j = i + 1; j < ds.length; j++) {
      const lk = ds[i] + '\n' + ds[j]; let L = links.get(lk); if (!L) links.set(lk, L = { a: ds[i], b: ds[j], t: {} });
      const ea = e.get(ds[i])[0], eb = e.get(ds[j])[0];
      (L.t[t] = L.t[t] || []).push({ v: ea.label === eb.label ? ea.label : ea.label + ' / ' + eb.label, pa: ea.x.s, pb: eb.x.s });
    }
  }
  const linked = new Set(); for (const L of links.values()) { linked.add(L.a); linked.add(L.b); }
  const order = [...devs.values()].sort((a, b) => b.p.length - a.p.length || a.n.localeCompare(b.n));
  const ix = new Map(order.map((d, i) => [d.s, i]));
  const nodes = order.map(d => ({ s: d.s, n: d.n, k: d.p.length, mk: [...d.mk.entries()].sort((a, b) => b[1] - a[1])[0][0], co: [...d.co].join(', '), l: linked.has(d.s) ? 1 : 0 }));
  const L = [...links.values()].map(l => ({ a: ix.get(l.a), b: ix.get(l.b), t: l.t }));
  // components among linked nodes
  const par = nodes.map((_, i) => i), f = i => par[i] === i ? i : (par[i] = f(par[i]));
  for (const l of L) par[f(l.a)] = f(l.b);
  const comp = new Map(); nodes.forEach((n, i) => { if (n.l) { const r = f(i); comp.set(r, (comp.get(r) || 0) + 1); } });
  const byType = Object.fromEntries(TYPES.map(t => [t, L.filter(l => l.t[t]).length]));
  const sizes = [...comp.values()].sort((a, b) => b - a);
  return {
    nodes, links: L,
    stats: { projects: P.length, developers: nodes.length, linked_developers: linked.size, links: L.length, links_by_type: byType, shared_identifiers_by_type: shared, hub_identifiers_dropped: hubs, clusters: sizes.length, largest_cluster: sizes[0] || 0, projects_without_developer: P.filter(x => !x.dvs || !x.dv).length },
  };
}

// ------------------------------------------------------------------------------------------------ i18n (UI strings only; data stays in its source wording)
const T = {
  en: { close: 'Close', dev: 'Developer',
    g_title: 'Developer network graph', g_desc: 'Which property developers we track share a company, a registry number, a website, an address or a project name. From our own public data, every link with its source pages.',
    g_lead: 'Two developers are linked when tracked projects of both publish the same identifier. A link is a fact to check, not a finding: groups, joint ventures and sales agents share names and websites for ordinary reasons.',
    t_company: 'Same legal company', t_regid: 'Same registry number', t_domain: 'Same website domain', t_address: 'Same company address', t_name: 'Same project name', t_web: "Same website identifier", m9: "Website identifier: the same public id on the developers' own websites, read once a day from the homepage source, DNS and TLS certificate: analytics, tag manager, ads, pixel or chat id, custom WordPress theme, homepage HTML skeleton, a shared certificate, own name servers or a dedicated server address. Platforms and shared hosting are excluded. A shared id usually means the same marketing agency, web studio or hosting account, not the same owner.",
    search: 'Find a developer', search_ph: 'Developer name', show_all: 'Show developers without links', reset: 'Reset view',
    s_dev: 'developers', s_linked: 'with at least one link', s_links: 'links', s_clusters: 'clusters',
    pick: 'Select a developer in the graph or search for one.', projects: 'projects', open: 'Open developer page', nolinks: 'No shared identifier found in our data for this developer.',
    linkto: 'Linked to', via: 'via', on: 'on', how_h: 'How the links are built', loading: 'Loading the graph…', err: 'The graph could not be loaded. Reload the page to try again.',
    m1: 'Source: the research record of each tracked project as published on its named page (/data/named.json). No new scraping and no personal data.',
    m2: 'Legal company: the same legal name with a legal form (PT, LLC, Ltd, S.L. and so on) after ignoring case, accents and punctuation.',
    m3: 'Registry number: the same company or tax number (six or more digits) published next to the company name.',
    m4: 'Website domain: the same registrable domain of an own website, meaning a domain that carries a word of the developer\'s or the project\'s name. Portals, agents, news sites and registers are skipped.',
    m5: 'Address: the same street-level company address, with a house number. City-only addresses never link.',
    m6: 'Project name: the same project name in the same country under two developer names.',
    m7: 'An identifier shared by more than 4 developers is treated as a portal, agency or template and dropped. Hosting and directors are not linked: shared hosting joins unrelated companies, and our public register data labels directors per project only.',
    m8: 'Sumba projects are not named, so they are not in this graph (conflict of interest, see our independence policy).',
    data: 'Data as JSON', table_h: 'All links', kbd: 'Keyboard: Tab to the list, Enter opens a developer.', dl: 'Download JSON', updated: 'Data updated',
  },
  es: { t_web: "Mismo identificador web", m9: "Identificador web: el mismo id público en las webs propias de los promotores, leído una vez al día del código de la página de inicio, el DNS y el certificado TLS: id de analítica, de Tag Manager, de anuncios, píxel o chat, tema propio de WordPress, esqueleto HTML de la página de inicio, un certificado compartido, servidores de nombres propios o una dirección de servidor dedicada. Se excluyen plataformas y alojamiento compartido. Un id compartido suele indicar la misma agencia de marketing, estudio web o cuenta de alojamiento, no el mismo propietario.", close: 'Cerrar', dev: 'Promotor', m1: "Fuente: el expediente de cada proyecto seguido tal como se publica en su página (/data/named.json). Sin nuevo rastreo y sin datos personales.", m2: "Sociedad: el mismo nombre legal con forma jurídica (PT, LLC, Ltd, S.L., etc.), ignorando mayúsculas, acentos y puntuación.", m3: "Número de registro: el mismo número mercantil o fiscal (seis o más dígitos) publicado junto al nombre de la sociedad.", m4: "Dominio web: el mismo dominio de una web propia, es decir, un dominio que contiene una palabra del nombre del promotor o del proyecto. Se omiten portales, agentes, medios y registros.", m5: "Dirección: la misma dirección de empresa a nivel de calle, con número. Las direcciones solo con ciudad nunca enlazan.", m6: "Nombre de proyecto: el mismo nombre de proyecto en el mismo país bajo dos nombres de promotor.", m7: "Un identificador compartido por más de 4 promotores se trata como portal, agencia o plantilla y se descarta. No enlazamos por alojamiento ni por administradores: el alojamiento compartido une empresas sin relación y nuestros datos públicos de registro etiquetan a los administradores solo por proyecto.", m8: "Los proyectos de Sumba no se nombran, así que no están en este gráfico (conflicto de interés, ver nuestra política de independencia).", g_title: 'Red de promotores', g_desc: 'Qué promotores que seguimos comparten empresa, número de registro, web, dirección o nombre de proyecto. Con nuestros datos públicos y la fuente de cada enlace.', g_lead: 'Dos promotores quedan enlazados cuando proyectos de ambos publican el mismo identificador. Un enlace es un dato a comprobar, no una conclusión: grupos, sociedades conjuntas y agentes comparten nombres y webs por motivos normales.', t_company: 'Misma sociedad', t_regid: 'Mismo número de registro', t_domain: 'Mismo dominio web', t_address: 'Misma dirección de empresa', t_name: 'Mismo nombre de proyecto', search: 'Buscar un promotor', search_ph: 'Nombre del promotor', show_all: 'Mostrar promotores sin enlaces', reset: 'Restablecer vista', s_dev: 'promotores', s_linked: 'con al menos un enlace', s_links: 'enlaces', s_clusters: 'grupos', pick: 'Elige un promotor en el gráfico o búscalo.', projects: 'proyectos', open: 'Abrir la página del promotor', nolinks: 'No hay identificadores compartidos en nuestros datos para este promotor.', linkto: 'Enlazado con', via: 'por', on: 'en', how_h: 'Cómo se construyen los enlaces', loading: 'Cargando el gráfico…', err: 'No se pudo cargar el gráfico. Recarga la página.', table_h: 'Todos los enlaces', data: 'Datos en JSON', dl: 'Descargar JSON', updated: 'Datos actualizados', kbd: 'Teclado: Tab hasta la lista, Intro abre un promotor.' },
  de: { t_web: "Gleiche Website-Kennung", m9: "Website-Kennung: dieselbe öffentliche ID auf den eigenen Websites der Bauträger, einmal täglich aus Quelltext der Startseite, DNS und TLS-Zertifikat gelesen: Analytics-, Tag-Manager-, Werbe-, Pixel- oder Chat-ID, eigenes WordPress-Theme, HTML-Gerüst der Startseite, ein gemeinsames Zertifikat, eigene Nameserver oder eine dedizierte Serveradresse. Plattformen und Shared Hosting sind ausgenommen. Eine gemeinsame ID bedeutet meist dieselbe Marketingagentur, dasselbe Webstudio oder dasselbe Hosting-Konto, nicht denselben Eigentümer.", close: 'Schließen', dev: 'Bauträger', m1: "Quelle: der Rechercheeintrag jedes verfolgten Projekts, wie auf seiner Seite veröffentlicht (/data/named.json). Kein neues Crawling, keine personenbezogenen Daten.", m2: "Gesellschaft: derselbe Firmenname mit Rechtsform (PT, LLC, Ltd, S.L. usw.), ohne Groß- und Kleinschreibung, Akzente und Satzzeichen.", m3: "Registernummer: dieselbe Handels- oder Steuernummer (mindestens sechs Ziffern), die neben dem Firmennamen steht.", m4: "Website-Domain: dieselbe Domain einer eigenen Website, also einer Domain mit einem Wort aus dem Namen des Bauträgers oder Projekts. Portale, Makler, Nachrichtenseiten und Register zählen nicht.", m5: "Adresse: dieselbe Firmenadresse auf Straßenebene mit Hausnummer. Reine Ortsangaben verbinden nie.", m6: "Projektname: derselbe Projektname im selben Land unter zwei Bauträgernamen.", m7: "Eine Kennung, die mehr als 4 Bauträger teilen, gilt als Portal, Agentur oder Vorlage und wird verworfen. Hosting und Direktoren verbinden wir nicht: geteiltes Hosting verbindet fremde Firmen, und unsere öffentlichen Registerdaten kennzeichnen Direktoren nur je Projekt.", m8: "Projekte auf Sumba werden nicht genannt und fehlen daher hier (Interessenkonflikt, siehe unsere Unabhängigkeitsregeln).", g_title: 'Bauträger-Netzwerk', g_desc: 'Welche Bauträger, die wir verfolgen, dieselbe Firma, Registernummer, Website, Adresse oder denselben Projektnamen nutzen. Aus unseren öffentlichen Daten, jede Verbindung mit Quelle.', g_lead: 'Zwei Bauträger sind verbunden, wenn Projekte beider dieselbe Kennung veröffentlichen. Eine Verbindung ist eine Frage, kein Befund: Gruppen, Joint Ventures und Makler teilen Namen und Websites aus normalen Gründen.', t_company: 'Gleiche Gesellschaft', t_regid: 'Gleiche Registernummer', t_domain: 'Gleiche Website-Domain', t_address: 'Gleiche Firmenadresse', t_name: 'Gleicher Projektname', search: 'Bauträger suchen', search_ph: 'Name des Bauträgers', show_all: 'Bauträger ohne Verbindung zeigen', reset: 'Ansicht zurücksetzen', s_dev: 'Bauträger', s_linked: 'mit mindestens einer Verbindung', s_links: 'Verbindungen', s_clusters: 'Gruppen', pick: 'Wählen Sie einen Bauträger im Graphen oder suchen Sie ihn.', projects: 'Projekte', open: 'Seite des Bauträgers öffnen', nolinks: 'Keine gemeinsame Kennung in unseren Daten für diesen Bauträger.', linkto: 'Verbunden mit', via: 'über', on: 'bei', how_h: 'Wie die Verbindungen entstehen', loading: 'Graph wird geladen…', err: 'Der Graph konnte nicht geladen werden. Bitte neu laden.', table_h: 'Alle Verbindungen', data: 'Daten als JSON', dl: 'JSON herunterladen', updated: 'Daten aktualisiert', kbd: 'Tastatur: Tab zur Liste, Enter öffnet einen Bauträger.' },
  fr: { t_web: "Même identifiant de site", m9: "Identifiant de site : le même identifiant public sur les sites propres des promoteurs, lu une fois par jour dans le code de la page d'accueil, le DNS et le certificat TLS : identifiant d'analyse, de Tag Manager, de publicité, pixel ou chat, thème WordPress sur mesure, squelette HTML de la page d'accueil, certificat partagé, serveurs de noms propres ou adresse de serveur dédiée. Les plateformes et l'hébergement mutualisé sont exclus. Un identifiant partagé signifie en général la même agence marketing, le même studio web ou le même compte d'hébergement, pas le même propriétaire.", close: 'Fermer', dev: 'Promoteur', m1: "Source : la fiche de recherche de chaque projet suivi, telle que publiée sur sa page (/data/named.json). Aucune nouvelle collecte, aucune donnée personnelle.", m2: "Société : le même nom légal avec une forme juridique (PT, LLC, Ltd, S.L., etc.), sans tenir compte de la casse, des accents et de la ponctuation.", m3: "Numéro d'immatriculation : le même numéro de registre ou fiscal (au moins six chiffres) publié à côté du nom de la société.", m4: "Domaine web : le même domaine d'un site propre, c'est-à-dire un domaine qui contient un mot du nom du promoteur ou du projet. Portails, agents, médias et registres sont ignorés.", m5: "Adresse : la même adresse de société au niveau de la rue, avec un numéro. Une ville seule ne relie jamais.", m6: "Nom de projet : le même nom de projet dans le même pays sous deux noms de promoteur.", m7: "Un identifiant partagé par plus de 4 promoteurs est traité comme un portail, une agence ou un modèle et écarté. Pas de liens par hébergement ni par dirigeants : l'hébergement mutualisé relie des sociétés sans rapport, et nos données publiques de registre n'identifient les dirigeants que par projet.", m8: "Les projets de Sumba ne sont pas nommés et ne figurent donc pas ici (conflit d'intérêts, voir notre politique d'indépendance).", g_title: 'Réseau des promoteurs', g_desc: 'Quels promoteurs suivis partagent une société, un numéro d\'immatriculation, un site, une adresse ou un nom de projet. Nos données publiques, chaque lien avec sa source.', g_lead: 'Deux promoteurs sont reliés quand des projets des deux publient le même identifiant. Un lien est un point à vérifier, pas une conclusion : groupes, coentreprises et agents partagent noms et sites pour des raisons ordinaires.', t_company: 'Même société', t_regid: 'Même numéro d\'immatriculation', t_domain: 'Même domaine web', t_address: 'Même adresse de société', t_name: 'Même nom de projet', search: 'Chercher un promoteur', search_ph: 'Nom du promoteur', show_all: 'Afficher les promoteurs sans lien', reset: 'Réinitialiser la vue', s_dev: 'promoteurs', s_linked: 'avec au moins un lien', s_links: 'liens', s_clusters: 'groupes', pick: 'Choisissez un promoteur dans le graphe ou cherchez-le.', projects: 'projets', open: 'Ouvrir la page du promoteur', nolinks: 'Aucun identifiant partagé dans nos données pour ce promoteur.', linkto: 'Relié à', via: 'par', on: 'sur', how_h: 'Comment les liens sont construits', loading: 'Chargement du graphe…', err: 'Le graphe n\'a pas pu être chargé. Rechargez la page.', table_h: 'Tous les liens', data: 'Données JSON', dl: 'Télécharger le JSON', updated: 'Données mises à jour', kbd: 'Clavier : Tab jusqu\'à la liste, Entrée ouvre un promoteur.' },
  nl: { t_web: "Zelfde websitekenmerk", m9: "Websitekenmerk: dezelfde openbare id op de eigen websites van de ontwikkelaars, één keer per dag gelezen uit de broncode van de homepage, de DNS en het TLS-certificaat: analytics-, tagmanager-, advertentie-, pixel- of chat-id, eigen WordPress-thema, HTML-skelet van de homepage, een gedeeld certificaat, eigen nameservers of een eigen serveradres. Platforms en gedeelde hosting zijn uitgesloten. Een gedeelde id betekent meestal hetzelfde marketingbureau, dezelfde webstudio of hetzelfde hostingaccount, niet dezelfde eigenaar.", close: 'Sluiten', dev: 'Ontwikkelaar', m1: "Bron: het onderzoeksdossier van elk gevolgd project zoals op de projectpagina gepubliceerd (/data/named.json). Geen nieuwe scraping, geen persoonsgegevens.", m2: "Rechtspersoon: dezelfde juridische naam met rechtsvorm (PT, LLC, Ltd, S.L. enz.), zonder hoofdletters, accenten en leestekens.", m3: "Registratienummer: hetzelfde handels- of belastingnummer (zes of meer cijfers) naast de bedrijfsnaam.", m4: "Websitedomein: hetzelfde domein van een eigen website, dus een domein met een woord uit de naam van de ontwikkelaar of het project. Portalen, makelaars, nieuwssites en registers tellen niet.", m5: "Adres: hetzelfde bedrijfsadres op straatniveau, met huisnummer. Alleen een plaatsnaam verbindt nooit.", m6: "Projectnaam: dezelfde projectnaam in hetzelfde land onder twee namen van ontwikkelaars.", m7: "Een identificatie die meer dan 4 ontwikkelaars delen geldt als portaal, bureau of sjabloon en vervalt. Hosting en bestuurders verbinden we niet: gedeelde hosting verbindt losse bedrijven, en onze openbare registerdata labelt bestuurders alleen per project.", m8: "Projecten op Sumba worden niet genoemd en staan dus niet in deze grafiek (belangenconflict, zie ons onafhankelijkheidsbeleid).", g_title: 'Netwerk van ontwikkelaars', g_desc: 'Welke ontwikkelaars die we volgen een bedrijf, registratienummer, website, adres of projectnaam delen. Uit onze openbare data, elke link met bron.', g_lead: 'Twee ontwikkelaars zijn verbonden als projecten van beide dezelfde identificatie publiceren. Een link is iets om na te gaan, geen bevinding: groepen, joint ventures en makelaars delen namen en websites om gewone redenen.', t_company: 'Zelfde rechtspersoon', t_regid: 'Zelfde registratienummer', t_domain: 'Zelfde websitedomein', t_address: 'Zelfde bedrijfsadres', t_name: 'Zelfde projectnaam', search: 'Ontwikkelaar zoeken', search_ph: 'Naam ontwikkelaar', show_all: 'Ontwikkelaars zonder links tonen', reset: 'Weergave herstellen', s_dev: 'ontwikkelaars', s_linked: 'met minstens één link', s_links: 'links', s_clusters: 'groepen', pick: 'Kies een ontwikkelaar in de grafiek of zoek er een.', projects: 'projecten', open: 'Pagina van de ontwikkelaar openen', nolinks: 'Geen gedeelde identificatie in onze data voor deze ontwikkelaar.', linkto: 'Verbonden met', via: 'via', on: 'bij', how_h: 'Hoe de links ontstaan', loading: 'Grafiek laden…', err: 'De grafiek kon niet geladen worden. Herlaad de pagina.', table_h: 'Alle links', data: 'Data als JSON', dl: 'JSON downloaden', updated: 'Data bijgewerkt', kbd: 'Toetsenbord: Tab naar de lijst, Enter opent een ontwikkelaar.' },
  ru: { t_web: "Общий идентификатор сайта", m9: "Идентификатор сайта: один и тот же публичный id на собственных сайтах застройщиков, раз в день из кода главной страницы, DNS и TLS-сертификата: id аналитики, Tag Manager, рекламы, пикселя или чата, собственная тема WordPress, HTML-каркас главной страницы, общий сертификат, собственные DNS-серверы или выделенный адрес сервера. Платформы и общий хостинг исключены. Общий id обычно означает одно маркетинговое агентство, веб-студию или хостинг-аккаунт, а не одного владельца.", close: 'Закрыть', dev: 'Застройщик', m1: "Источник: исследовательская запись каждого проекта, опубликованная на его странице (/data/named.json). Без нового сбора данных и без персональных данных.", m2: "Компания: одно и то же юридическое название с организационно-правовой формой (PT, LLC, Ltd, S.L. и т. п.) без учёта регистра, диакритики и пунктуации.", m3: "Регистрационный номер: один и тот же регистрационный или налоговый номер (от шести цифр), опубликованный рядом с названием компании.", m4: "Домен сайта: один и тот же домен собственного сайта, то есть домен со словом из названия застройщика или проекта. Порталы, агенты, СМИ и реестры не учитываются.", m5: "Адрес: один и тот же адрес компании до улицы и номера дома. Адрес только с городом никогда не связывает.", m6: "Название проекта: одно и то же название проекта в одной стране у двух застройщиков.", m7: "Идентификатор, общий для более чем 4 застройщиков, считается порталом, агентством или шаблоном и отбрасывается. Хостинг и директора не связываются: общий хостинг объединяет несвязанные компании, а наши открытые данные реестров помечают директоров только внутри проекта.", m8: "Проекты на Сумбе не называются, поэтому их нет на графе (конфликт интересов, см. нашу политику независимости).", g_title: 'Сеть застройщиков', g_desc: 'Какие застройщики из нашей базы делят компанию, регистрационный номер, сайт, адрес или название проекта. Только наши открытые данные, у каждой связи есть источник.', g_lead: 'Два застройщика связаны, если их проекты публикуют один и тот же идентификатор. Связь — повод проверить, а не вывод: группы, совместные предприятия и агенты делят названия и сайты по обычным причинам.', t_company: 'Одна компания', t_regid: 'Один регистрационный номер', t_domain: 'Один домен сайта', t_address: 'Один адрес компании', t_name: 'Одно название проекта', search: 'Найти застройщика', search_ph: 'Название застройщика', show_all: 'Показать застройщиков без связей', reset: 'Сбросить вид', s_dev: 'застройщиков', s_linked: 'хотя бы с одной связью', s_links: 'связей', s_clusters: 'групп', pick: 'Выберите застройщика на графе или найдите его.', projects: 'проектов', open: 'Открыть страницу застройщика', nolinks: 'В наших данных нет общих идентификаторов для этого застройщика.', linkto: 'Связан с', via: 'через', on: 'в', how_h: 'Как строятся связи', loading: 'Загрузка графа…', err: 'Не удалось загрузить граф. Обновите страницу.', table_h: 'Все связи', data: 'Данные JSON', dl: 'Скачать JSON', updated: 'Данные обновлены', kbd: 'Клавиатура: Tab к списку, Enter открывает застройщика.' },
  zh: { t_web: "相同网站标识符", m9: "网站标识符：开发商自有网站上相同的公开 ID，每天从首页源代码、DNS 和 TLS 证书读取一次：分析、跟踪代码管理器、广告、像素或聊天 ID，定制 WordPress 主题，首页 HTML 骨架，共享证书，自有域名服务器或独立服务器地址。平台和共享主机已排除。共享 ID 通常意味着同一家营销公司、网页工作室或托管账户，而不是同一个所有者。", close: '关闭', dev: '开发商', m1: "来源：每个追踪项目在其页面上公布的研究记录（/data/named.json）。没有新的抓取，没有个人数据。", m2: "法律实体：带有法律形式（PT、LLC、Ltd、S.L. 等）的相同法定名称，忽略大小写、重音和标点。", m3: "注册号：公司名称旁公布的相同商业或税务号码（至少六位数字）。", m4: "网站域名：自有网站的相同域名，即域名中含有开发商或项目名称中的词。门户、代理、新闻网站和登记机构不计。", m5: "地址：带门牌号的相同街道级公司地址。只有城市的地址不会连线。", m6: "项目名称：同一国家内两个开发商名下的相同项目名称。", m7: "被 4 家以上开发商共用的标识视为门户、代理或模板，予以剔除。不按托管或董事连线：共享托管会把无关公司连在一起，而我们的公开登记数据只在项目内标记董事。", m8: "松巴岛项目不公开名称，因此不在此图中（利益冲突，见我们的独立性政策）。", g_title: '开发商关系网络', g_desc: '我们追踪的开发商中，哪些共用同一公司、注册号、网站、地址或项目名称。仅用我们的公开数据，每条连线都有来源。', g_lead: '当两家开发商的项目公布了相同的标识时，二者相连。连线是需要核实的事实，不是结论：集团、合资企业和代理商共用名称和网站很常见。', t_company: '同一法律实体', t_regid: '同一注册号', t_domain: '同一网站域名', t_address: '同一公司地址', t_name: '同一项目名称', search: '查找开发商', search_ph: '开发商名称', show_all: '显示没有连线的开发商', reset: '重置视图', s_dev: '家开发商', s_linked: '至少有一条连线', s_links: '条连线', s_clusters: '个群组', pick: '在图中选择开发商或搜索。', projects: '个项目', open: '打开开发商页面', nolinks: '我们的数据中没有该开发商的共用标识。', linkto: '连接到', via: '依据', on: '项目', how_h: '连线如何生成', loading: '正在加载…', err: '无法加载图。请刷新页面。', table_h: '全部连线', data: 'JSON 数据', dl: '下载 JSON', updated: '数据更新', kbd: '键盘：Tab 到列表，Enter 打开开发商。' },
  ar: { t_web: "معرّف الموقع نفسه", m9: "معرّف الموقع: المعرّف العام نفسه على المواقع الخاصة بالمطورين، يُقرأ مرة يومياً من شيفرة الصفحة الرئيسية وDNS وشهادة TLS: معرّف التحليلات أو مدير العلامات أو الإعلانات أو البكسل أو الدردشة، قالب WordPress خاص، هيكل HTML للصفحة الرئيسية، شهادة مشتركة، خوادم أسماء خاصة أو عنوان خادم مخصص. تُستبعد المنصات والاستضافة المشتركة. المعرّف المشترك يعني عادة وكالة التسويق نفسها أو استوديو الويب نفسه أو حساب الاستضافة نفسه، وليس المالك نفسه.", close: 'إغلاق', dev: 'المطور', m1: "المصدر: سجل البحث لكل مشروع نتابعه كما هو منشور في صفحته (/data/named.json). بلا جمع جديد للبيانات وبلا بيانات شخصية.", m2: "الشركة القانونية: الاسم القانوني نفسه مع الشكل القانوني (PT وLLC وLtd وS.L. وغيرها) بعد تجاهل حالة الأحرف والتشكيل وعلامات الترقيم.", m3: "رقم التسجيل: رقم السجل التجاري أو الضريبي نفسه (ستة أرقام أو أكثر) المنشور بجانب اسم الشركة.", m4: "نطاق الموقع: النطاق نفسه لموقع خاص، أي نطاق يحمل كلمة من اسم المطور أو المشروع. لا تُحتسب البوابات والوكلاء والمواقع الإخبارية والسجلات.", m5: "العنوان: عنوان الشركة نفسه على مستوى الشارع مع رقم المبنى. العناوين التي تذكر المدينة فقط لا تربط أبدًا.", m6: "اسم المشروع: اسم المشروع نفسه في البلد نفسه تحت اسمي مطورين.", m7: "المعرّف الذي يتشاركه أكثر من 4 مطورين يُعامل كبوابة أو وكالة أو قالب ويُستبعد. لا نربط بالاستضافة ولا بالمديرين: الاستضافة المشتركة تجمع شركات لا علاقة بينها، وبيانات السجلات العامة لدينا تميّز المديرين داخل كل مشروع فقط.", m8: "مشاريع سومبا لا تُسمّى، لذلك ليست في هذا الرسم (تضارب مصالح، راجع سياسة الاستقلالية).", g_title: 'شبكة المطورين', g_desc: 'أي المطورين الذين نتابعهم يتشاركون شركة أو رقم تسجيل أو موقعًا أو عنوانًا أو اسم مشروع. من بياناتنا العامة فقط، ولكل رابط مصدره.', g_lead: 'يرتبط مطوران عندما تنشر مشاريع لكليهما المعرّف نفسه. الرابط أمر يستحق التحقق، وليس حكمًا: المجموعات والمشاريع المشتركة والوكلاء يتشاركون الأسماء والمواقع لأسباب عادية.', t_company: 'الشركة القانونية نفسها', t_regid: 'رقم التسجيل نفسه', t_domain: 'نطاق الموقع نفسه', t_address: 'عنوان الشركة نفسه', t_name: 'اسم المشروع نفسه', search: 'ابحث عن مطور', search_ph: 'اسم المطور', show_all: 'إظهار المطورين بلا روابط', reset: 'إعادة العرض', s_dev: 'مطورًا', s_linked: 'لديهم رابط واحد على الأقل', s_links: 'روابط', s_clusters: 'مجموعات', pick: 'اختر مطورًا في الرسم أو ابحث عنه.', projects: 'مشاريع', open: 'افتح صفحة المطور', nolinks: 'لا يوجد معرّف مشترك في بياناتنا لهذا المطور.', linkto: 'مرتبط بـ', via: 'عبر', on: 'في', how_h: 'كيف تُبنى الروابط', loading: 'جارٍ التحميل…', err: 'تعذر تحميل الرسم. أعد تحميل الصفحة.', table_h: 'كل الروابط', data: 'بيانات JSON', dl: 'تنزيل JSON', updated: 'تحديث البيانات', kbd: 'لوحة المفاتيح: Tab إلى القائمة، Enter يفتح المطور.' },
};
// n19e (batch 19): corporate family link type
const FAMT = {
  en: { t_family: 'Same corporate family (GLEIF)', m10: 'Corporate family: the GLEIF level 2 data (CC0) of the LEI matched to each developer by exact legal name and country, read weekly: one is the direct or ultimate parent or a direct child of the other, or both report the same parent. That is accounting consolidation, not who builds or sells a project.' },
  es: { t_family: 'Mismo grupo empresarial (GLEIF)', m10: 'Grupo empresarial: los datos de nivel 2 de GLEIF (CC0) del LEI asignado a cada promotor por nombre legal exacto y país, leídos cada semana: uno es la matriz directa o última o una filial directa del otro, o ambos declaran la misma matriz. Es consolidación contable, no quién construye o vende un proyecto.' },
  de: { t_family: 'Gleicher Konzern (GLEIF)', m10: 'Konzern: die GLEIF-Level-2-Daten (CC0) der LEI, die jedem Bauträger über exakten Firmennamen und Land zugeordnet ist, wöchentlich gelesen: einer ist direkte oder oberste Mutter oder direkte Tochter des anderen, oder beide melden dieselbe Mutter. Das ist bilanzielle Konsolidierung, nicht wer ein Projekt baut oder verkauft.' },
  fr: { t_family: 'Même groupe de sociétés (GLEIF)', m10: 'Groupe : les données de niveau 2 de GLEIF (CC0) du LEI attribué à chaque promoteur par nom légal exact et pays, lues chaque semaine : l\'un est la société mère directe ou ultime ou une filiale directe de l\'autre, ou les deux déclarent la même mère. C\'est la consolidation comptable, pas qui construit ou vend un projet.' },
  nl: { t_family: 'Zelfde concern (GLEIF)', m10: 'Concern: de GLEIF niveau 2-gegevens (CC0) van de LEI die bij elke ontwikkelaar hoort op exacte bedrijfsnaam en land, wekelijks gelezen: de ene is directe of uiteindelijke moeder of directe dochter van de andere, of beide melden dezelfde moeder. Dat is boekhoudkundige consolidatie, niet wie een project bouwt of verkoopt.' },
  ru: { t_family: 'Одна группа компаний (GLEIF)', m10: 'Группа компаний: данные GLEIF уровня 2 (CC0) по LEI, сопоставленному с застройщиком по точному юридическому названию и стране, читаются еженедельно: одна компания является прямой или конечной материнской или прямой дочерней для другой, или обе указывают одну материнскую компанию. Это бухгалтерская консолидация, а не то, кто строит или продаёт проект.' },
  zh: { t_family: '同一企业集团（GLEIF）', m10: '企业集团：按确切法定名称和国家与每个开发商匹配的 LEI 的 GLEIF 二级数据（CC0），每周读取：一方是另一方的直接或最终母公司或直接子公司，或双方申报同一母公司。这是会计合并关系，不代表由谁建造或销售项目。' },
  ar: { t_family: 'المجموعة نفسها (GLEIF)', m10: 'المجموعة: بيانات المستوى 2 من GLEIF (رخصة CC0) لمعرّف LEI المطابق لكل مطور بالاسم القانوني الدقيق والبلد، تُقرأ أسبوعياً: إحداهما الشركة الأم المباشرة أو النهائية أو تابعة مباشرة للأخرى، أو تصرّح الاثنتان بالشركة الأم نفسها. هذا توحيد محاسبي، وليس من يبني المشروع أو يبيعه.' },
};
for (const l of Object.keys(FAMT)) T[l] = Object.assign(T[l] || {}, FAMT[l]);
const LT = {
  en: { l_title: 'X-rays running now', l_desc: 'A live globe of Project X-rays as people run them: the market of each check and how many evidence cards it produced. No links, no names, no project.', l_lead: 'Every dot is one X-ray, placed at the public point of its market, not at the project. We show the time, the market and the number of cards. Nothing else leaves the database.', c_all: 'X-rays run', c_24: 'in the last 24 hours', c_1: 'in the last hour', c_mk: 'markets', c_cards: 'evidence cards', recent: 'Most recent', none: 'No X-ray in the last 24 hours yet. Run one and watch it appear.', run: 'Run an X-ray', nomk: 'market not identified', cards: 'cards', ago_s: 'just now', ago_m: '{n} min ago', ago_h: '{n} h ago', ago_d: '{n} d ago', how_h: 'What this shows', h1: 'Source: our table of sealed X-rays, read through a public database function that returns only time (to the minute), market and card count.', h2: 'The dot sits on the market\'s public point (Natural Earth and GeoNames), the same point our map uses. The project\'s own location is never sent.', h3: 'X-rays of Sumba projects and X-rays where we could not place a market are counted but not drawn.', h4: 'The page asks for new X-rays every 15 seconds.', land: 'Land outline: Natural Earth (public domain).', paused: 'Paused', pause: 'Pause rotation', play: 'Resume rotation', loading: 'Connecting…', err: 'Live data is not available right now. The page will try again.', count_note: 'Counts start on 7 Nov 2026, when sealed X-rays began to be stored.', data: 'Data as JSON' },
  es: { l_title: 'Rayos X en curso', l_desc: 'Un globo en directo de los Rayos X de proyectos que se ejecutan: el mercado de cada comprobación y cuántas tarjetas de evidencia produjo. Sin enlaces, sin nombres, sin proyecto.', l_lead: 'Cada punto es un Rayo X, situado en el punto público de su mercado, no en el proyecto. Mostramos la hora, el mercado y el número de tarjetas. Nada más sale de la base de datos.', c_all: 'Rayos X ejecutados', c_24: 'en las últimas 24 horas', c_1: 'en la última hora', c_mk: 'mercados', c_cards: 'tarjetas de evidencia', recent: 'Más recientes', none: 'Aún no hay Rayos X en las últimas 24 horas. Ejecuta uno y verás cómo aparece.', run: 'Ejecutar un Rayo X', nomk: 'mercado no identificado', cards: 'tarjetas', ago_s: 'ahora', ago_m: 'hace {n} min', ago_h: 'hace {n} h', ago_d: 'hace {n} d', how_h: 'Qué muestra', h1: 'Fuente: nuestra tabla de Rayos X sellados, leída con una función pública que solo devuelve la hora (al minuto), el mercado y el número de tarjetas.', h2: 'El punto está en el punto público del mercado (Natural Earth y GeoNames), el mismo de nuestro mapa. Nunca se envía la ubicación del proyecto.', h3: 'Los Rayos X de proyectos en Sumba y los que no tienen mercado se cuentan pero no se dibujan.', h4: 'La página pide nuevos Rayos X cada 15 segundos.', land: 'Contorno de tierra: Natural Earth (dominio público).', paused: 'En pausa', pause: 'Pausar la rotación', play: 'Reanudar la rotación', loading: 'Conectando…', err: 'Los datos en directo no están disponibles ahora. La página lo reintentará.', count_note: 'El recuento empieza el 7 nov 2026, cuando se empezaron a guardar los Rayos X sellados.', data: 'Datos en JSON' },
  de: { l_title: 'Röntgenchecks, live', l_desc: 'Ein Live-Globus der Projekt-Röntgenchecks: der Markt jeder Prüfung und wie viele Belegkarten sie lieferte. Keine Links, keine Namen, kein Projekt.', l_lead: 'Jeder Punkt ist ein Röntgencheck am öffentlichen Punkt seines Marktes, nicht am Projekt. Wir zeigen Zeit, Markt und Kartenzahl. Sonst verlässt nichts die Datenbank.', c_all: 'Röntgenchecks', c_24: 'in den letzten 24 Stunden', c_1: 'in der letzten Stunde', c_mk: 'Märkte', c_cards: 'Belegkarten', recent: 'Neueste', none: 'In den letzten 24 Stunden noch kein Röntgencheck. Starten Sie einen und sehen Sie ihn erscheinen.', run: 'Röntgencheck starten', nomk: 'Markt nicht erkannt', cards: 'Karten', ago_s: 'gerade eben', ago_m: 'vor {n} Min.', ago_h: 'vor {n} Std.', ago_d: 'vor {n} T.', how_h: 'Was die Seite zeigt', h1: 'Quelle: unsere Tabelle versiegelter Röntgenchecks, gelesen über eine öffentliche Datenbankfunktion, die nur Zeit (auf die Minute), Markt und Kartenzahl liefert.', h2: 'Der Punkt liegt am öffentlichen Punkt des Marktes (Natural Earth und GeoNames), wie auf unserer Karte. Der Ort des Projekts wird nie übertragen.', h3: 'Röntgenchecks zu Sumba und ohne erkannten Markt werden gezählt, aber nicht gezeichnet.', h4: 'Die Seite fragt alle 15 Sekunden nach neuen Röntgenchecks.', land: 'Landumrisse: Natural Earth (gemeinfrei).', paused: 'Pausiert', pause: 'Drehung anhalten', play: 'Drehung fortsetzen', loading: 'Verbinde…', err: 'Live-Daten sind gerade nicht verfügbar. Die Seite versucht es erneut.', count_note: 'Zählung ab 7. Nov. 2026, seit versiegelte Röntgenchecks gespeichert werden.', data: 'Daten als JSON' },
  fr: { l_title: 'Radiographies en cours', l_desc: 'Un globe en direct des radiographies de projets : le marché de chaque vérification et le nombre de fiches de preuves. Sans liens, sans noms, sans projet.', l_lead: 'Chaque point est une radiographie, placée au point public de son marché, pas sur le projet. Nous montrons l\'heure, le marché et le nombre de fiches. Rien d\'autre ne sort de la base.', c_all: 'radiographies', c_24: 'sur les dernières 24 heures', c_1: 'sur la dernière heure', c_mk: 'marchés', c_cards: 'fiches de preuves', recent: 'Les plus récentes', none: 'Aucune radiographie sur les dernières 24 heures. Lancez-en une et regardez-la apparaître.', run: 'Lancer une radiographie', nomk: 'marché non identifié', cards: 'fiches', ago_s: 'à l\'instant', ago_m: 'il y a {n} min', ago_h: 'il y a {n} h', ago_d: 'il y a {n} j', how_h: 'Ce que montre la page', h1: 'Source : notre table de radiographies scellées, lue par une fonction publique qui ne renvoie que l\'heure (à la minute), le marché et le nombre de fiches.', h2: 'Le point est au point public du marché (Natural Earth et GeoNames), comme sur notre carte. L\'emplacement du projet n\'est jamais transmis.', h3: 'Les radiographies de projets à Sumba et sans marché identifié sont comptées mais pas dessinées.', h4: 'La page demande les nouvelles radiographies toutes les 15 secondes.', land: 'Contours des terres : Natural Earth (domaine public).', paused: 'En pause', pause: 'Mettre la rotation en pause', play: 'Reprendre la rotation', loading: 'Connexion…', err: 'Les données en direct sont indisponibles. La page réessaiera.', count_note: 'Le comptage commence le 7 nov. 2026, date du début de l\'enregistrement des radiographies scellées.', data: 'Données JSON' },
  nl: { l_title: 'Röntgenchecks, live', l_desc: 'Een live wereldbol van project-röntgenchecks: de markt van elke check en hoeveel bewijskaarten die opleverde. Geen links, geen namen, geen project.', l_lead: 'Elke stip is één röntgencheck, op het openbare punt van de markt, niet op het project. We tonen tijd, markt en aantal kaarten. Verder verlaat niets de database.', c_all: 'röntgenchecks', c_24: 'in de laatste 24 uur', c_1: 'in het laatste uur', c_mk: 'markten', c_cards: 'bewijskaarten', recent: 'Meest recent', none: 'Nog geen röntgencheck in de laatste 24 uur. Start er een en zie hem verschijnen.', run: 'Röntgencheck starten', nomk: 'markt niet herkend', cards: 'kaarten', ago_s: 'zojuist', ago_m: '{n} min geleden', ago_h: '{n} u geleden', ago_d: '{n} d geleden', how_h: 'Wat dit toont', h1: 'Bron: onze tabel met verzegelde röntgenchecks, gelezen via een openbare databasefunctie die alleen tijd (op de minuut), markt en aantal kaarten teruggeeft.', h2: 'De stip staat op het openbare punt van de markt (Natural Earth en GeoNames), net als op onze kaart. De locatie van het project wordt nooit verstuurd.', h3: 'Röntgenchecks van projecten op Sumba en zonder herkende markt worden geteld maar niet getekend.', h4: 'De pagina vraagt elke 15 seconden om nieuwe röntgenchecks.', land: 'Landcontouren: Natural Earth (publiek domein).', paused: 'Gepauzeerd', pause: 'Draaien pauzeren', play: 'Draaien hervatten', loading: 'Verbinden…', err: 'Live data is nu niet beschikbaar. De pagina probeert het opnieuw.', count_note: 'Tellingen beginnen op 7 nov 2026, toen verzegelde röntgenchecks werden opgeslagen.', data: 'Data als JSON' },
  ru: { l_title: 'Рентген проектов в реальном времени', l_desc: 'Живой глобус проверок «Рентген проекта»: рынок каждой проверки и число карточек с доказательствами. Без ссылок, без имён, без проекта.', l_lead: 'Каждая точка — одна проверка, на публичной точке её рынка, а не проекта. Мы показываем время, рынок и число карточек. Больше ничего не покидает базу данных.', c_all: 'проверок', c_24: 'за последние 24 часа', c_1: 'за последний час', c_mk: 'рынков', c_cards: 'карточек', recent: 'Последние', none: 'За последние 24 часа проверок ещё не было. Запустите проверку и посмотрите, как она появится.', run: 'Запустить рентген', nomk: 'рынок не определён', cards: 'карточек', ago_s: 'только что', ago_m: '{n} мин назад', ago_h: '{n} ч назад', ago_d: '{n} д назад', how_h: 'Что здесь показано', h1: 'Источник: наша таблица запечатанных проверок, через публичную функцию базы, которая отдаёт только время (до минуты), рынок и число карточек.', h2: 'Точка стоит на публичной точке рынка (Natural Earth и GeoNames), как на нашей карте. Местоположение проекта никогда не передаётся.', h3: 'Проверки проектов на Сумбе и без определённого рынка учитываются, но не рисуются.', h4: 'Страница запрашивает новые проверки каждые 15 секунд.', land: 'Контуры суши: Natural Earth (общественное достояние).', paused: 'Пауза', pause: 'Остановить вращение', play: 'Продолжить вращение', loading: 'Подключение…', err: 'Живые данные сейчас недоступны. Страница попробует снова.', count_note: 'Счёт идёт с 7 ноября 2026 года, когда начали сохранять запечатанные проверки.', data: 'Данные JSON' },
  zh: { l_title: '实时项目透视', l_desc: '实时地球仪显示正在运行的项目透视：每次检查所在的市场和生成的证据卡数量。没有链接，没有名称，没有项目。', l_lead: '每个点是一次透视，标在所属市场的公开点上，而不是项目位置。我们只显示时间、市场和卡片数量，其他信息不离开数据库。', c_all: '次透视', c_24: '过去 24 小时', c_1: '过去 1 小时', c_mk: '个市场', c_cards: '张证据卡', recent: '最近', none: '过去 24 小时还没有透视。运行一次，看它出现。', run: '运行透视', nomk: '未识别市场', cards: '张卡', ago_s: '刚刚', ago_m: '{n} 分钟前', ago_h: '{n} 小时前', ago_d: '{n} 天前', how_h: '页面显示什么', h1: '来源：我们的已封存透视表，通过只返回时间（到分钟）、市场和卡片数量的公开数据库函数读取。', h2: '点位于市场的公开点（Natural Earth 和 GeoNames），与我们的地图相同。项目位置从不发送。', h3: '松巴岛项目和无法确定市场的透视会计数，但不绘制。', h4: '页面每 15 秒请求一次新透视。', land: '陆地轮廓：Natural Earth（公共领域）。', paused: '已暂停', pause: '暂停旋转', play: '继续旋转', loading: '连接中…', err: '实时数据暂不可用，页面会重试。', count_note: '自 2026 年 11 月 7 日开始存储已封存透视后开始计数。', data: 'JSON 数据' },
  ar: { l_title: 'فحوص الأشعة الجارية الآن', l_desc: 'كرة أرضية مباشرة لفحوص «أشعة المشروع» أثناء تشغيلها: سوق كل فحص وعدد بطاقات الأدلة. بلا روابط ولا أسماء ولا مشروع.', l_lead: 'كل نقطة فحص واحد، موضوعة على النقطة العامة لسوقه وليس على المشروع. نعرض الوقت والسوق وعدد البطاقات فقط، ولا يخرج شيء آخر من قاعدة البيانات.', c_all: 'فحوص', c_24: 'خلال آخر 24 ساعة', c_1: 'خلال آخر ساعة', c_mk: 'أسواق', c_cards: 'بطاقات أدلة', recent: 'الأحدث', none: 'لا فحوص في آخر 24 ساعة بعد. شغّل فحصًا وشاهده يظهر.', run: 'شغّل فحص الأشعة', nomk: 'السوق غير محدد', cards: 'بطاقات', ago_s: 'الآن', ago_m: 'قبل {n} د', ago_h: 'قبل {n} س', ago_d: 'قبل {n} ي', how_h: 'ماذا تعرض الصفحة', h1: 'المصدر: جدول الفحوص المختومة لدينا، عبر دالة عامة لا تُرجع إلا الوقت (بالدقيقة) والسوق وعدد البطاقات.', h2: 'النقطة على النقطة العامة للسوق (Natural Earth وGeoNames)، كما في خريطتنا. لا يُرسل موقع المشروع أبدًا.', h3: 'فحوص مشاريع سومبا والفحوص بلا سوق محدد تُحسب ولا تُرسم.', h4: 'تطلب الصفحة فحوصًا جديدة كل 15 ثانية.', land: 'حدود اليابسة: Natural Earth (ملكية عامة).', paused: 'متوقف', pause: 'إيقاف الدوران', play: 'استئناف الدوران', loading: 'جارٍ الاتصال…', err: 'البيانات المباشرة غير متاحة الآن. ستحاول الصفحة مجددًا.', count_note: 'يبدأ العد في 7 نوفمبر 2026، عند بدء حفظ الفحوص المختومة.', data: 'بيانات JSON' },
};
const tr = (D, lang) => Object.assign({}, D.en, D[lang] || {});

// ------------------------------------------------------------------------------------------------ JSON endpoints
function out(o, s, cc) { return new Response(JSON.stringify(o), { status: s || 200, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': cc || 'public, max-age=600', 'x-content-type-options': 'nosniff' } }); }

let GMEMO = null;
async function graph(env) {
  const ix = await namedData(env);
  const web = await webGroups(env).catch(() => ({ groups: [] }));
  const fam = await familyData(env).catch(() => null);
  const key = (ix.named.updated || '') + '|' + ix.P.length + '|' + (web.updated || '') + '|' + ((fam && fam.updated) || '');
  if (GMEMO && GMEMO.key === key) return GMEMO.g;
  const g = buildGraph(ix.P, web, fam);
  g.version = GRAPH_V; g.updated = ix.named.updated || null; g.generated_at = new Date().toISOString();
  g.source = { named: ORIGIN + '/data/named.json', pages: ORIGIN + '/projects/<slug>/', licence: 'CC BY 4.0, Kolaboro' };
  g.types = { company: 'same legal company name', regid: 'same company registry or tax number', domain: 'same own-website registrable domain', address: 'same street-level company address', name: 'same project name in the same country', web: 'the same public identifier on both developers\' own websites: analytics, tag manager, ads, pixel or chat id, custom WordPress theme, homepage HTML skeleton, TLS certificate, own name servers or dedicated server address (/data/dev-links.json, read daily). Usually the same marketing agency, web studio or hosting account, not the same owner' };
  g.web_updated = web.updated || null;
  g.types.family = 'GLEIF level 2 (CC0): one developer\'s matched LEI is the other\'s direct or ultimate parent or direct child, or both report the same direct or ultimate parent (/data/gleif-family.json, weekly). Accounting consolidation as reported to GLEIF.';
  g.family_updated = (fam && fam.updated) || null;
  g.not_linked = ['hosting (shared hosts join unrelated companies)', 'directors (our public register data labels directors per project only; private individuals are never named)'];
  g.hub_rule = 'identifiers shared by more than ' + HUB + ' developers are dropped as portals, agencies or templates';
  GMEMO = { key, g }; return g;
}

let LMEMO = { t: 0, v: null };
async function live(env) {
  if (LMEMO.v && Date.now() - LMEMO.t < 8000) return LMEMO.v;
  const [r, sim] = await Promise.all([rpc('kolaboro_xray_live', { p_hours: 24 }), file(env, 'similar.json').catch(() => ({}))]);
  const mp = (sim.market_points && sim.market_points.markets) || {};
  const pt = m => { const p = m && mp[m]; return p && typeof p.lat === 'number' ? [Math.round(p.lat * 100) / 100, Math.round(p.lng * 100) / 100] : null; };
  const recent = ((r && r.recent) || []).map(e => { const mk = e.mk && !/sumba/i.test(e.mk) ? e.mk : null; return { t: e.t, mk, p: pt(mk), c: e.c || 0 }; });
  const v = { totals: (r && r.totals) || null, recent, since: (r && r.since) || null, at: new Date().toISOString(), source: 'kolaboro_xrays via public function kolaboro_xray_live (time to the minute, market, card count only)', points: 'market public points from /data/similar.json (Natural Earth, GeoNames)' };
  LMEMO = { t: Date.now(), v }; return v;
}

// ------------------------------------------------------------------------------------------------ pages
const CSS = `<style id="knet14">
.kn14{--gap:var(--k-5,24px)}
.kn14 .k-phead{padding-block:var(--k-7,48px) var(--k-5,24px)}
.kn14 h1{max-width:20ch}
.kn14 .lead{max-width:62ch;color:var(--k-ink-2)}
.kn-stats{display:flex;flex-wrap:wrap;gap:var(--k-3,12px) var(--k-6,32px);margin:var(--k-4,16px) 0 0;padding:0;list-style:none}
.kn-stats li{display:flex;flex-direction:column}.kn-stats b{font-size:var(--k-fs-2xl,28px);font-weight:700;font-variant-numeric:tabular-nums;color:var(--k-ink)}.kn-stats span{font-size:var(--k-fs-sm,15px);color:var(--k-muted)}
.kn-ui{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:var(--k-4,16px);align-items:start}
.kn-plate{position:relative;border:1px solid var(--k-line-2);border-radius:var(--k-r-lg,14px);background:var(--k-surface);overflow:hidden;min-height:320px}
.kn-plate canvas{display:block;width:100%;height:100%}
.kn-plate .kn-tip{position:absolute;pointer-events:none;background:var(--k-ink);color:var(--k-paper);font-size:var(--k-fs-xs,13px);padding:4px 8px;border-radius:var(--k-r-xs,4px);white-space:nowrap;transform:translate(-50%,-130%);display:none}
.kn-plate .kn-msg{position:absolute;inset:0;display:grid;place-items:center;color:var(--k-muted);font-size:var(--k-fs-sm)}
.kn-tools{position:absolute;inset-inline-end:10px;bottom:10px;display:flex;gap:6px}
.kn-side{display:flex;flex-direction:column;gap:var(--k-4,16px)}
.kn-legend{margin:0;padding:0;list-style:none;display:grid;gap:6px;font-size:var(--k-fs-sm)}
.kn-legend label{display:flex;align-items:center;gap:10px;min-height:32px;cursor:pointer}
.kn-legend svg{flex:none}
.kn-legend small{margin-inline-start:auto;color:var(--k-muted);font-variant-numeric:tabular-nums}
.kn-card{border:1px solid var(--k-line);border-radius:var(--k-r-md,10px);background:var(--k-surface);padding:var(--k-4,16px)}
.kn-card h2{font-size:var(--k-fs-lg,20px);margin:0 0 4px;padding-inline-end:40px}#kn-info{position:relative}#kn-info .kn-x{position:absolute;inset-inline-end:8px;top:8px;width:44px;height:44px;border:0;background:none;font-size:24px;line-height:1;color:var(--k-muted);cursor:pointer;border-radius:var(--k-r-sm)}#kn-info .kn-x:hover{background:var(--k-sunken)}.kn-side{position:sticky;top:90px}
.kn-card p{margin:0 0 8px;font-size:var(--k-fs-sm)}
.kn-card ul{margin:8px 0 0;padding:0;list-style:none;max-height:340px;overflow:auto}
.kn-card li{padding:8px 0;border-top:1px solid var(--k-line);font-size:var(--k-fs-sm)}
.kn-card li b a{color:var(--k-ink)}
.kn-card li span{display:block;color:var(--k-muted);font-size:var(--k-fs-xs);margin-top:2px;overflow-wrap:anywhere}
.kn-sr{position:relative}
.kn-res{position:absolute;z-index:5;inset-inline:0;top:100%;margin:2px 0 0;padding:4px;list-style:none;background:var(--k-surface);border:1px solid var(--k-line-2);border-radius:var(--k-r-sm,6px);box-shadow:var(--k-sh-3);max-height:260px;overflow:auto}
.kn-res li{padding:10px 8px;border-radius:var(--k-r-xs);cursor:pointer;font-size:var(--k-fs-sm)}
.kn-res li[aria-selected=true],.kn-res li:hover{background:var(--k-sea-soft)}
.kn-res small{color:var(--k-muted);margin-inline-start:6px}
.kn-how{margin-top:var(--k-7,48px)}
.kn-how ul{padding-inline-start:1.1em;max-width:72ch}.kn-how li{margin:0 0 8px}
.kn-all{margin-top:var(--k-6,32px)}
.kn-all td a{overflow-wrap:anywhere}
@media(max-width:900px){.kn-ui{grid-template-columns:1fr}.kn-side{order:-1;position:static}#kn-info{display:none}#kn-info.is-open{display:block;position:fixed;z-index:60;inset-inline:8px;bottom:8px;max-height:58vh;overflow:auto;box-shadow:var(--k-sh-3)}}
/* live globe */
.kl-band{background:var(--k-band);color:var(--k-band-ink)}
.kl-band .k-crumb a,.kl-band .k-crumb{color:var(--k-band-muted)}
.kl-band h1{color:var(--k-band-ink)}.kl-band .lead{color:var(--k-band-muted)}
.kl-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:var(--k-6,32px);align-items:center;padding-block:var(--k-6,32px) var(--k-7,48px)}
.kl-globe{position:relative;aspect-ratio:1;width:100%;max-width:620px;margin-inline:auto}
.kl-globe canvas{width:100%;height:100%;display:block;cursor:grab;touch-action:none}
.kl-globe .k-btn{position:absolute;inset-inline-end:0;bottom:0}
.kl-ctr{display:grid;grid-template-columns:1fr 1fr;gap:var(--k-4,16px) var(--k-5,24px);margin:var(--k-5,24px) 0;padding:0;list-style:none}
.kl-ctr b{display:block;font-size:var(--k-fs-3xl,36px);font-weight:700;line-height:1.05;font-variant-numeric:tabular-nums;color:var(--k-band-ink)}
.kl-ctr span{color:var(--k-band-muted);font-size:var(--k-fs-sm)}
.kl-feed{margin:0;padding:0;list-style:none;border-top:1px solid rgba(255,255,255,.14)}
.kl-feed li{display:flex;gap:12px;align-items:baseline;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.14);font-size:var(--k-fs-sm)}
.kl-feed li b{font-weight:600;color:var(--k-band-ink)}.kl-feed li span{color:var(--k-band-muted)}.kl-feed li time{margin-inline-start:auto;color:var(--k-band-muted);font-variant-numeric:tabular-nums;white-space:nowrap}
.kl-feed li.is-new b::before{content:"";display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--k-brand);margin-inline-end:8px;vertical-align:middle}
.kl-band h2{color:var(--k-band-ink);font-size:var(--k-fs-lg);margin:var(--k-5,24px) 0 var(--k-2,8px)}
.kl-note{color:var(--k-band-muted);font-size:var(--k-fs-xs);margin-top:var(--k-3,12px)}
.kl-band .k-btn--primary{margin-top:var(--k-4,16px)}
@media(max-width:900px){.kl-grid{grid-template-columns:1fr}.kl-globe{max-width:440px}}
</style>`;

function graphBody(lang) {
  const t = tr(T, lang), p = pre(lang);
  const sw = (ty) => ({ company: '<svg width="34" height="10" aria-hidden="true"><line x1="1" y1="5" x2="33" y2="5" stroke="currentColor" stroke-width="3"/></svg>', regid: '<svg width="34" height="10" aria-hidden="true"><line x1="1" y1="3" x2="33" y2="3" stroke="currentColor" stroke-width="1.6"/><line x1="1" y1="7" x2="33" y2="7" stroke="currentColor" stroke-width="1.6"/></svg>', domain: '<svg width="34" height="10" aria-hidden="true"><line x1="1" y1="5" x2="33" y2="5" stroke="currentColor" stroke-width="2.4" stroke-dasharray="7 4"/></svg>', address: '<svg width="34" height="10" aria-hidden="true"><line x1="1" y1="5" x2="33" y2="5" stroke="currentColor" stroke-width="2.4" stroke-dasharray="2 4" stroke-linecap="round"/></svg>', name: '<svg width="34" height="10" aria-hidden="true"><line x1="1" y1="5" x2="33" y2="5" stroke="currentColor" stroke-width="1.2"/></svg>', web: '<svg width="34" height="10" aria-hidden="true"><line x1="1" y1="5" x2="33" y2="5" stroke="currentColor" stroke-width="1.6" stroke-dasharray="10 3 2 3"/></svg>', family: '<svg width="34" height="10" aria-hidden="true"><line x1="1" y1="5" x2="33" y2="5" stroke="currentColor" stroke-width="2.8" stroke-dasharray="1 3" stroke-linecap="round"/></svg>' })[ty];
  const types = ['company', 'regid', 'domain', 'address', 'name', 'web', 'family'];
  return '<div class="kn14" data-kn14 data-lang="' + lang + '" data-pre="' + p + '" data-t="' + esc(JSON.stringify(t)) + '">' +
    '<header class="k-phead k-wrap"><nav class="k-crumb" aria-label="Breadcrumb"><a href="' + p + '/">Kolaboro</a> / <a href="/graph/">Company graph</a> / <span aria-current="page">' + esc(t.g_title) + '</span></nav>' +
    '<h1>' + esc(t.g_title) + '</h1><p class="lead">' + esc(t.g_lead) + '</p>' +
    '<ul class="kn-stats" aria-live="polite"><li><b data-st="developers">…</b><span>' + esc(t.s_dev) + '</span></li><li><b data-st="linked_developers">…</b><span>' + esc(t.s_linked) + '</span></li><li><b data-st="links">…</b><span>' + esc(t.s_links) + '</span></li><li><b data-st="clusters">…</b><span>' + esc(t.s_clusters) + '</span></li></ul></header>' +
    '<section class="k-wrap"><div class="kn-ui"><div class="kn-plate" id="kn-plate"><canvas id="kn-c" role="img" aria-label="' + esc(t.g_title) + '"></canvas><div class="kn-tip" id="kn-tip"></div><div class="kn-msg" id="kn-msg">' + esc(t.loading) + '</div>' +
    '<div class="kn-tools"><button type="button" class="k-btn k-btn--sm" id="kn-reset">' + esc(t.reset) + '</button></div></div>' +
    '<aside class="kn-side"><div class="k-field kn-sr"><label class="k-label" for="kn-q">' + esc(t.search) + '</label><input class="k-input" id="kn-q" type="search" autocomplete="off" placeholder="' + esc(t.search_ph) + '" role="combobox" aria-expanded="false" aria-controls="kn-res" aria-autocomplete="list"><ul class="kn-res" id="kn-res" role="listbox" hidden></ul></div>' +
    '<fieldset class="kn-card"><legend class="k-vh">Link types</legend><ul class="kn-legend">' + types.map(ty => '<li><label><input type="checkbox" checked data-ty="' + ty + '"> ' + sw(ty) + ' ' + esc(t['t_' + ty]) + ' <small data-ct="' + ty + '"></small></label></li>').join('') +
    '<li><label><input type="checkbox" id="kn-iso"> ' + esc(t.show_all) + '</label></li></ul></fieldset>' +
    '<div class="kn-card" id="kn-info" aria-live="polite"><p class="k-muted">' + esc(t.pick) + '</p></div></aside></div>' +
    '<div class="kn-how k-prose"><h2>' + esc(t.how_h) + '</h2><ul>' + ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm9', 'm10', 'm7', 'm8'].map(k => '<li>' + esc(t[k] || T.en[k]) + '</li>').join('') + '</ul>' +
    '<p><a href="/api/x/net/graph">' + esc(t.data) + '</a> · <a href="/data/named.json">named.json</a> · <a href="/independence/">Independence policy</a></p></div>' +
    '<div class="kn-all"><h2>' + esc(t.table_h) + '</h2><div class="k-table-wrap"><table class="k-table k-table--dense k-table--stack"><thead><tr><th>' + esc(t.dev) + '</th><th>' + esc(t.dev) + '</th><th>' + esc(t.via) + '</th></tr></thead><tbody id="kn-tb"></tbody></table></div></div></section></div>';
}
const GRAPH_JS = String.raw`(function(){
var R=document.querySelector('[data-kn14]');if(!R)return;var T=JSON.parse(R.getAttribute('data-t')),PRE=R.getAttribute('data-pre'),RTL=document.documentElement.dir==='rtl';
var cv=document.getElementById('kn-c'),cx=cv.getContext('2d'),plate=document.getElementById('kn-plate'),tip=document.getElementById('kn-tip'),msg=document.getElementById('kn-msg'),info=document.getElementById('kn-info');
var TY=['company','regid','domain','address','name','web','family'],DASH={company:[],regid:[],domain:[7,4],address:[2,4],name:[],web:[10,3,2,3],family:[1,3]},W={company:2.6,regid:1.6,domain:2,address:2,name:1,web:1.6,family:2.8};
var G,N=[],L=[],on={company:1,regid:1,domain:1,address:1,name:1,web:1,family:1},iso=false,sel=-1,hov=-1,dpr=1,Wd=0,Ht=0,FONT='13px Archivo,system-ui,sans-serif';
function css(v){return getComputedStyle(document.documentElement).getPropertyValue(v).trim()||'#333'}
var C={};function pal(){C={ink:css('--k-ink'),muted:css('--k-muted'),line:css('--k-line-2'),sea:css('--k-sea'),surf:css('--k-surface'),brand:css('--k-brand'),faint:css('--k-faint'),sunk:css('--k-sunken')}}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function linkOn(l){for(var i=0;i<TY.length;i++)if(on[TY[i]]&&l.t[TY[i]])return true;return false}
function lab(n){return n.n.length>36?n.n.slice(0,35)+'…':n.n}
function rad(n){return 4+Math.min(6,Math.sqrt(n.k)*1.6)}
// layout: every cluster (developers joined by the active link types) is a small column of nodes, clusters are packed in rows
// like entries in a register; developers without links follow as a grid of dots
var comps=[],bx=[];
function layout(){var w=plate.getBoundingClientRect().width;Wd=w;cx.font=FONT;
 var par=N.map(function(_,i){return i}),f=function(i){return par[i]===i?i:(par[i]=f(par[i]))},has={};
 L.forEach(function(l){if(!linkOn(l))return;par[f(l.a)]=f(l.b);has[l.a]=has[l.b]=1});
 var g={};N.forEach(function(n,i){n.on=!!has[i];n.x=n.y=-999;if(n.on){var r=f(i);(g[r]=g[r]||[]).push(i)}});
 comps=Object.keys(g).map(function(k){return g[k].sort(function(a,b){return N[b].k-N[a].k})}).sort(function(a,b){return b.length-a.length||N[b[0]].k-N[a[0]].k});
 var pad=16,gx=18,gy=22,x=pad,y=pad,rowH=0,STEP=40;bx=[];
 comps.forEach(function(c){var lw=0;c.forEach(function(i){lw=Math.max(lw,cx.measureText(lab(N[i])).width)});var cw=Math.min(w-2*pad,34+12+lw),ch=(c.length-1)*STEP+26;
  if(x+cw>w-pad&&x>pad){x=pad;y+=rowH+gy;rowH=0}
  c.forEach(function(i,k){var n=N[i];n.x=x+12+(k%2?22:0);n.y=y+13+k*STEP;});bx.push([x,y,cw,ch]);x+=cw+gx;rowH=Math.max(rowH,ch)});
 y+=rowH+pad;
 if(iso){var s=14,cols=Math.max(1,Math.floor((w-2*pad)/s)),k2=0;y+=8;N.forEach(function(n){if(n.on)return;n.x=pad+6+(k2%cols)*s;n.y=y+6+Math.floor(k2/cols)*s;k2++});if(k2)y+=Math.ceil(k2/cols)*s+pad}
 Ht=Math.max(320,y);plate.style.height=Ht+'px';dpr=Math.min(2,window.devicePixelRatio||1);cv.width=Wd*dpr;cv.height=Ht*dpr;
 if(RTL)N.forEach(function(n){if(n.x>-999)n.x=Wd-n.x});draw()}
function vis(n){return n.on||(iso&&n.x>-999)}
function nb(i){var s={};L.forEach(function(l){if(!linkOn(l))return;if(l.a===i)s[l.b]=1;if(l.b===i)s[l.a]=1});return s}
function draw(){if(!G)return;cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,Wd,Ht);var F=sel>=0?nb(sel):null;
 L.forEach(function(l){if(!linkOn(l))return;var a=N[l.a],b=N[l.b],hl=sel>=0&&(l.a===sel||l.b===sel);var act=TY.filter(function(t){return on[t]&&l.t[t]});
  act.forEach(function(ty,ix){var off=(ix-(act.length-1)/2)*3.2;cx.beginPath();cx.setLineDash(DASH[ty]);cx.lineWidth=W[ty]*(hl?1.3:1);cx.strokeStyle=hl?C.sea:C.muted;cx.globalAlpha=sel>=0&&!hl?.3:.9;cx.moveTo(a.x+off,a.y);cx.lineTo(b.x+off,b.y);cx.stroke()})});
 cx.setLineDash([]);cx.globalAlpha=1;cx.font=FONT;cx.textBaseline='middle';cx.direction='ltr';cx.textAlign=RTL?'right':'left';
 N.forEach(function(n,i){if(!vis(n))return;var dim=F&&i!==sel&&!F[i],r=n.on?rad(n):3;cx.globalAlpha=dim?.3:1;cx.beginPath();cx.arc(n.x,n.y,r,0,7);cx.fillStyle=i===sel?C.brand:(n.on?C.ink:C.faint);cx.fill();if(i===hov||i===sel){cx.lineWidth=2;cx.strokeStyle=C.sea;cx.stroke()}
  if(n.on){cx.fillStyle=C.ink;cx.fillText(lab(n),n.x+(RTL?-1:1)*(r+6+(n.x%1)),n.y)}});cx.globalAlpha=1}
function hit(mx,my){var best=-1,bd=1e9;N.forEach(function(n,i){if(!vis(n))return;var dx=n.x-mx,dy=n.y-my,d=dx*dx+dy*dy,r=n.on?14:8;if(d<r*r&&d<bd){bd=d;best=i}});
 if(best<0)N.forEach(function(n,i){if(!n.on)return;cx.font=FONT;var w=cx.measureText(lab(n)).width,x0=RTL?n.x-rad(n)-6-w:n.x+rad(n)+6;if(mx>=x0&&mx<=x0+w&&Math.abs(my-n.y)<10)best=i});return best}
function pick(i,scroll){sel=i;info.classList.toggle('is-open',i>=0);if(i<0){info.innerHTML='<p class="k-muted">'+esc(T.pick)+'</p>';draw();return}var n=N[i];
 if(!vis(n)){iso=true;document.getElementById('kn-iso').checked=true;layout()}
 if(scroll){var r=plate.getBoundingClientRect(),y=r.top+scrollY+n.y-innerHeight/3;scrollTo({top:Math.max(0,y),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}
 var rows=[];L.forEach(function(l){if(l.a!==i&&l.b!==i)return;var o=N[l.a===i?l.b:l.a];TY.forEach(function(ty){(l.t[ty]||[]).forEach(function(e){var mine=l.a===i?e.pa:e.pb,their=l.a===i?e.pb:e.pa;rows.push('<li><b><a href="'+PRE+'/developers/'+o.s+'/">'+esc(o.n)+'</a></b><span>'+esc(T['t_'+ty])+': '+esc(e.v)+'</span><span>'+esc(T.on)+' <a href="'+PRE+'/projects/'+mine+'/">'+esc(mine)+'</a>, <a href="'+PRE+'/projects/'+their+'/">'+esc(their)+'</a></span></li>')})})});
 info.innerHTML='<button type="button" class="k-x kn-x" aria-label="'+esc(T.close)+'">×</button><h2>'+esc(n.n)+'</h2><p class="k-muted">'+n.k+' '+esc(T.projects)+', '+esc(n.mk)+(n.co?' ('+esc(n.co)+')':'')+'</p><p><a class="k-btn k-btn--sm" href="'+PRE+'/developers/'+n.s+'/">'+esc(T.open)+'</a></p>'+(rows.length?'<p><b>'+esc(T.linkto)+'</b></p><ul>'+rows.join('')+'</ul>':'<p class="k-muted">'+esc(T.nolinks)+'</p>');draw()}
function pos(e){var r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]}
cv.addEventListener('pointermove',function(e){var p=pos(e),h=hit(p[0],p[1]);if(h!==hov){hov=h;cv.style.cursor=h>=0?'pointer':'default';draw()}
 if(h>=0&&e.pointerType==='mouse'){tip.style.display='block';tip.textContent=N[h].n+', '+N[h].k+' '+T.projects;tip.style.left=p[0]+'px';tip.style.top=p[1]+'px'}else tip.style.display='none'});
info.addEventListener('click',function(e){if(e.target.closest('.kn-x'))pick(-1)});
cv.addEventListener('pointerleave',function(){tip.style.display='none';if(hov>=0){hov=-1;draw()}});
cv.addEventListener('click',function(e){var p=pos(e);pick(hit(p[0],p[1]))});
document.getElementById('kn-reset').addEventListener('click',function(){q.value='';pick(-1)});
TY.forEach(function(ty){var b=R.querySelector('[data-ty='+ty+']');b.addEventListener('change',function(){on[ty]=b.checked?1:0;layout();if(sel>=0)pick(sel)})});
document.getElementById('kn-iso').addEventListener('change',function(e){iso=e.target.checked;layout()});
var q=document.getElementById('kn-q'),res=document.getElementById('kn-res'),hits=[],ai=-1;
function norm(s){return String(s).normalize('NFKD').replace(/[̀-ͯ]/g,'').toLowerCase()}
function showRes(){res.innerHTML=hits.map(function(i,k){var n=N[i];return '<li role="option" id="kn-o'+k+'" aria-selected="'+(k===ai)+'" data-i="'+i+'">'+esc(n.n)+'<small>'+n.k+', '+esc(n.mk)+'</small></li>'}).join('');res.hidden=!hits.length;q.setAttribute('aria-expanded',hits.length?'true':'false');if(ai>=0)q.setAttribute('aria-activedescendant','kn-o'+ai);else q.removeAttribute('aria-activedescendant')}
q.addEventListener('input',function(){var v=norm(q.value.trim());ai=-1;hits=[];if(v.length>=2)N.forEach(function(n,i){if(hits.length<12&&norm(n.n).indexOf(v)>=0)hits.push(i)});showRes()});
q.addEventListener('keydown',function(e){if(e.key==='ArrowDown'){ai=Math.min(hits.length-1,ai+1);showRes();e.preventDefault()}else if(e.key==='ArrowUp'){ai=Math.max(0,ai-1);showRes();e.preventDefault()}else if(e.key==='Enter'){var i=hits[ai>=0?ai:0];if(i!=null){q.value=N[i].n;pick(i,1);hits=[];showRes()}e.preventDefault()}else if(e.key==='Escape'){hits=[];showRes()}});
res.addEventListener('click',function(e){var li=e.target.closest('li');if(li){var i=+li.getAttribute('data-i');q.value=N[i].n;pick(i,1);hits=[];showRes()}});
pal();new MutationObserver(function(){pal();draw()}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
fetch('/api/x/net/graph').then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(g){G=g;N=g.nodes;L=g.links;
 var S=g.stats;R.querySelectorAll('[data-st]').forEach(function(b){b.textContent=(S[b.getAttribute('data-st')]||0).toLocaleString()});
 TY.forEach(function(ty){var s=R.querySelector('[data-ct='+ty+']');if(s)s.textContent=S.links_by_type[ty]||0});
 var tb=document.getElementById('kn-tb'),rows=[];L.forEach(function(l){var a=N[l.a],b=N[l.b];rows.push('<tr><td data-label="'+esc(T.dev)+'"><a href="'+PRE+'/developers/'+a.s+'/">'+esc(a.n)+'</a></td><td data-label="'+esc(T.dev)+'"><a href="'+PRE+'/developers/'+b.s+'/">'+esc(b.n)+'</a></td><td data-label="'+esc(T.via)+'">'+TY.filter(function(t){return l.t[t]}).map(function(t){return esc(T['t_'+t])+': '+esc(l.t[t][0].v)}).join('<br>')+'</td></tr>')});tb.innerHTML=rows.join('');
 msg.remove();layout();var h=decodeURIComponent((location.hash||'').slice(1));if(h){N.forEach(function(n,i){if(n.s===h)pick(i,1)})}
}).catch(function(){msg.textContent=T.err});
var rt,lw=0;addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){var w=plate.getBoundingClientRect().width;if(w!==lw){lw=w;layout()}},120)});
})();`;

function liveBody(lang) {
  const t = tr(LT, lang), p = pre(lang);
  return '<div class="kn14" data-kl14 data-lang="' + lang + '" data-t="' + esc(JSON.stringify(t)) + '"><section class="kl-band"><div class="k-wrap">' +
    '<header class="k-phead" style="padding-bottom:0"><nav class="k-crumb" aria-label="Breadcrumb"><a href="' + p + '/">Kolaboro</a> / <a href="/live/">Live</a> / <span aria-current="page">' + esc(t.l_title) + '</span></nav><h1>' + esc(t.l_title) + '</h1><p class="lead">' + esc(t.l_lead) + '</p></header>' +
    '<div class="kl-grid"><div class="kl-globe"><canvas id="kl-c" role="img" aria-label="' + esc(t.l_title) + '"></canvas><button type="button" class="k-btn k-btn--sm" id="kl-pp" aria-pressed="false">' + esc(t.pause) + '</button></div>' +
    '<div><ul class="kl-ctr" aria-live="polite"><li><b data-c="all">…</b><span>' + esc(t.c_all) + '</span></li><li><b data-c="h24">…</b><span>' + esc(t.c_24) + '</span></li><li><b data-c="h1">…</b><span>' + esc(t.c_1) + '</span></li><li><b data-c="markets">…</b><span>' + esc(t.c_mk) + ' (24 h)</span></li></ul>' +
    '<h2>' + esc(t.recent) + '</h2><ol class="kl-feed" id="kl-feed" aria-live="polite"><li><span>' + esc(t.loading) + '</span></li></ol>' +
    '<p class="kl-note">' + esc(t.count_note) + '</p><a class="k-btn k-btn--primary" href="' + p + '/check/">' + esc(t.run) + '</a></div></div></div></section>' +
    '<section class="k-wrap kn-how k-prose" style="margin-bottom:var(--k-8,64px)"><h2>' + esc(t.how_h) + '</h2><ul><li>' + esc(t.h1) + '</li><li>' + esc(t.h2) + '</li><li>' + esc(t.h3) + '</li><li>' + esc(t.h4) + '</li><li>' + esc(t.land) + ' <a class="k-src" href="https://www.naturalearthdata.com/about/terms-of-use/" rel="noopener">naturalearthdata.com</a></li></ul><p><a href="/api/x/net/live">' + esc(t.data) + '</a></p></section></div>';
}
const LIVE_JS = String.raw`(function(){
var R=document.querySelector('[data-kl14]');if(!R)return;var T=JSON.parse(R.getAttribute('data-t'));
var cv=document.getElementById('kl-c'),cx=cv.getContext('2d'),pp=document.getElementById('kl-pp'),feed=document.getElementById('kl-feed');
var RM=matchMedia('(prefers-reduced-motion: reduce)').matches,spin=!RM,lon0=-20,lat0=12,S=0,dpr=1,seen={},dots=[],first=true;
var B=atob('__LAND__'),pts=[];for(var r=0;r<120;r++)for(var c=0;c<240;c++){var k=r*240+c;if(B.charCodeAt(k>>3)&(1<<(k&7))){var la=89.25-r*1.5,lo=-179.25+c*1.5;pts.push([la*Math.PI/180,lo*Math.PI/180])}}
function css(v){return getComputedStyle(document.documentElement).getPropertyValue(v).trim()}
function size(){var w=cv.getBoundingClientRect().width;dpr=Math.min(2,devicePixelRatio||1);cv.width=cv.height=w*dpr;S=w}
function proj(la,lo){var p=lat0*Math.PI/180,l=lo-lon0*Math.PI/180,cl=Math.cos(la);var x=cl*Math.sin(l),y=Math.cos(p)*Math.sin(la)-Math.sin(p)*cl*Math.cos(l),z=Math.sin(p)*Math.sin(la)+Math.cos(p)*cl*Math.cos(l);return[x,y,z]}
function draw(now){var R0=S*.46,c0=S/2;cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,S,S);
 var g=cx.createRadialGradient(c0-R0*.3,c0-R0*.35,R0*.1,c0,c0,R0);g.addColorStop(0,'rgba(255,255,255,.10)');g.addColorStop(1,'rgba(255,255,255,.02)');cx.beginPath();cx.arc(c0,c0,R0,0,7);cx.fillStyle=g;cx.fill();cx.strokeStyle='rgba(255,255,255,.18)';cx.lineWidth=1;cx.stroke();
 cx.fillStyle='rgba(225,236,240,.55)';var ds=Math.max(1.2,S/300);for(var i=0;i<pts.length;i++){var q=proj(pts[i][0],pts[i][1]);if(q[2]<=0)continue;cx.globalAlpha=.25+.75*q[2];cx.fillRect(c0+q[0]*R0-ds/2,c0-q[1]*R0-ds/2,ds,ds)}cx.globalAlpha=1;
 var br=css('--k-brand')||'#FF5B14';
 dots.forEach(function(d){var q=proj(d.p[0]*Math.PI/180,d.p[1]*Math.PI/180);if(q[2]<=0)return;var x=c0+q[0]*R0,y=c0-q[1]*R0,age=(Date.now()-d.t)/36e5,a=Math.max(.25,1-age/24);
  cx.globalAlpha=a;cx.beginPath();cx.arc(x,y,2+Math.min(5,Math.sqrt(d.c)),0,7);cx.fillStyle=br;cx.fill();
  if(d.born&&!RM){var e=(now-d.born)/1600;if(e>=0&&e<3){var f=e%1;cx.globalAlpha=(1-f)*.9;cx.beginPath();cx.arc(x,y,4+f*26,0,7);cx.strokeStyle=br;cx.lineWidth=2;cx.stroke()}}});cx.globalAlpha=1}
var last=0;function loop(now){if(spin){lon0+=(now-last)*.006;}last=now;draw(now);requestAnimationFrame(loop)}
var drag=null;cv.addEventListener('pointerdown',function(e){user=1;cv.setPointerCapture(e.pointerId);drag=[e.clientX,e.clientY,lon0,lat0]});cv.addEventListener('pointermove',function(e){if(!drag)return;lon0=drag[2]-(e.clientX-drag[0])*.4;lat0=Math.max(-70,Math.min(70,drag[3]+(e.clientY-drag[1])*.4));if(RM)draw(0)});addEventListener('pointerup',function(){drag=null});
pp.addEventListener('click',function(){spin=!spin;pp.setAttribute('aria-pressed',spin?'false':'true');pp.textContent=spin?T.pause:T.play});if(RM){pp.textContent=T.play;pp.setAttribute('aria-pressed','true')}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function ago(t){var s=(Date.now()-Date.parse(t))/1000;if(s<90)return T.ago_s;if(s<3600)return T.ago_m.replace('{n}',Math.round(s/60));if(s<86400)return T.ago_h.replace('{n}',Math.round(s/3600));return T.ago_d.replace('{n}',Math.round(s/86400))}
function nf(n){return n==null?'0':Number(n).toLocaleString()}
function poll(){fetch('/api/x/net/live',{cache:'no-store'}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(d){var t=d.totals||{};
 R.querySelectorAll('[data-c]').forEach(function(b){b.textContent=nf(t[b.getAttribute('data-c')])});
 var now=performance.now(),nd=[];(d.recent||[]).forEach(function(e,i){var k=e.t+'|'+e.mk+'|'+e.c+'|'+i;var fresh=!first&&!seen[e.t+'|'+e.mk+'|'+e.c];if(e.p)nd.push({p:e.p,c:e.c,t:Date.parse(e.t),born:fresh||(first&&i<3)?now+i*300:0});});
 var ns={};(d.recent||[]).forEach(function(e){ns[e.t+'|'+e.mk+'|'+e.c]=1});
 var html=(d.recent||[]).slice(0,8).map(function(e){var fresh=!first&&!seen[e.t+'|'+e.mk+'|'+e.c];return '<li'+(fresh?' class="is-new"':'')+'><b>'+esc(e.mk||T.nomk)+'</b><span>'+e.c+' '+esc(T.cards)+'</span><time datetime="'+esc(e.t)+'">'+ago(e.t)+'</time></li>'}).join('');
 feed.innerHTML=html||'<li><span>'+esc(T.none)+'</span></li>';seen=ns;dots=nd;first=false;if(RM)draw(0)}).catch(function(){feed.innerHTML='<li><span>'+esc(T.err)+'</span></li>'})}
size();addEventListener('resize',function(){size();if(RM)draw(0)});poll();setInterval(function(){if(!document.hidden)poll()},15000);if(RM)draw(0);else requestAnimationFrame(loop);
})();`;

async function assemble(shellRes, o) {
  const alts = LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + o.path + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + o.path + '">';
  const tags = '<title>' + esc(o.title) + ' | Kolaboro</title><meta name="description" content="' + esc(o.desc) + '"><link rel="canonical" href="' + ORIGIN + pre(o.lang) + o.path + '">' + alts +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="Kolaboro"><meta property="og:title" content="' + esc(o.title) + ' | Kolaboro"><meta property="og:description" content="' + esc(o.desc) + '"><meta property="og:url" content="' + ORIGIN + pre(o.lang) + o.path + '"><meta name="twitter:card" content="summary">' +
    '<script type="application/ld+json">' + JSON.stringify(o.ld).replace(/</g, '\\u003c') + '</script>' + CSS;
  const res = new HTMLRewriter()
    .on('title', { element(e) { e.remove(); } })
    .on('meta[name="description"],meta[name="robots"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],link[rel="alternate"][hreflang]', { element(e) { e.remove(); } })
    .on('script[type="application/ld+json"]', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(o.body + '<script>' + o.js + '</script>', { html: true }); } })
    .on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + o.path); } })
    .transform(new Response(shellRes.body, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
  return await res.text();
}

export async function handle(req, u, env, ctx, shell) {
  const p = u.pathname;
  if (req.method !== 'GET' && req.method !== 'HEAD') return null;
  if (p === '/api/x/net/graph') { try { return out(await graph(env), 200, 'public, max-age=600'); } catch (e) { return out({ error: 'graph unavailable' }, 503, 'no-store'); } }
  if (p === '/api/x/net/live') {
    try { return out(await live(env), 200, 'public, max-age=10'); }
    catch (e) { return out({ error: 'live data unavailable', totals: null, recent: [] }, 503, 'no-store'); }
  }
  const m = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(graph\/developers|live\/xrays)(\/?)$/); if (!m) return null;
  if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
  const lang = m[1] || 'en', kind = m[2];
  const sh = await shell(pre(lang) + '/how-we-score/');
  let o;
  if (kind === 'graph/developers') {
    const t = tr(T, lang);
    o = { lang, path: '/graph/developers/', title: t.g_title, desc: t.g_desc, body: graphBody(lang), js: GRAPH_JS,
      ld: { '@context': 'https://schema.org', '@graph': [{ '@type': 'Dataset', name: 'Kolaboro developer network', description: T.en.g_desc, url: ORIGIN + '/graph/developers/', license: 'https://creativecommons.org/licenses/by/4.0/', creator: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, distribution: { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/api/x/net/graph' } }, { '@type': 'BreadcrumbList', itemListElement: [['Kolaboro', '/'], ['Company graph', '/graph/'], [t.g_title, pre(lang) + '/graph/developers/']].map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x[0], item: ORIGIN + x[1] })) }] } };
  } else {
    const t = tr(LT, lang);
    o = { lang, path: '/live/xrays/', title: t.l_title, desc: t.l_desc, body: liveBody(lang), js: LIVE_JS.replace('__LAND__', LAND),
      ld: { '@context': 'https://schema.org', '@type': 'WebPage', name: t.l_title, description: t.l_desc, url: ORIGIN + pre(lang) + '/live/xrays/' } };
  }
  return new Response(await assemble(sh, o), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' } });
}
