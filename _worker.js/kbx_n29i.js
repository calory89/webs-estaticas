// kolaboro.com batch 29 (agent n29i, 14 Nov 2026): international search and AI assistants. No model calls, nothing stored, nothing
// estimated: every figure is computed at the edge from the published data files (/data/named.json, bali-cases.json, promises.json and
// the transparency index of kbx_tr.js), dated with the data date.
//   item 89  GET /[<lang>/]guides/buyers-from/<russia|china|gulf>/  what changes with the buyer's nationality in Dubai, Bali,
//                                           Phuket and Cyprus (official texts, dated), the four places compared from our data
//   item 88  GET /<lang>/m/<market>/        the market file in es fr de nl ru zh ar (before: English only, these URLs were a 301 to /m/).
//                                           Only markets with 5+ named projects (anti-thin rule); smaller ones keep the 301 to English.
//                                           The English /m/<market>/ gets the hreflang alternates (index.js, mAlternates).
//            GET /m/sitemap.xml             every translated market file with its English page, hreflang and the real lastmod
//   item 93/95  hubInject: on hubs without a Q&A block, a table of key figures under the page heading and 3 to 4 questions answered
//                from the data at the end (FAQPage JSON-LD only for those questions): /projects/, /rankings/transparency/, /handover/,
//                /handover/overdue/ (8 languages)
//   item 97  GET /answers/questions.md|json  about 800 questions people ask about off-plan projects, each answered from our data with
//                                           the page that shows the facts and the data date (markets, countries and developers with
//                                           5+ named projects only)
// Conflict of interest: Sumba projects are never named (kbx_named.js data() drops them); Eco Beach City and Equinox never appear.
import { data as namedData, handoverOf, overdueOf, OV_MIN, lastmod, esc, pre, fd } from './kbx_named.js';
import { trData } from './kbx_tr.js';
import { TR_PLACES, inPlace } from './kbx_tr_places.js';
import { BUY_PLACES } from './kbx_buy_i18n.js';
import { mkName, placeName, coName, hdisp, hyear } from './kbx_hdate.js';

const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const MIN_MK = 5;
const CO_AL = { 'Puerto Rico (USA)': 'Puerto Rico', 'St Lucia': 'Saint Lucia', 'United States': 'USA', 'United Arab Emirates': 'UAE' };   // same country names as the country hubs (kbx_seo.js)
export const PAGE_RX = /^\/(es|de|fr|nl|ru|zh|ar)\/m\/([^/.]{2,60})(\/?)$/;
export const PATHS = /^\/(?:es|de|fr|nl|ru|zh|ar)\/(?:countries|rankings)(?:\/[a-z0-9-]{2,60})?\/?$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?guides\/buyers-from(?:\/(?:russia|china|gulf))?\/?$|^\/(?:es|de|fr|nl|ru|zh|ar)\/m\/[^/.]{2,60}\/?$|^\/m\/sitemap\.xml$|^\/answers\/questions\.(?:md|json)$/;
const slugM = m => encodeURIComponent(String(m).toLowerCase().replace(/\s+/g, '-'));
const slugA = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const bdi = s => '<bdi>' + esc(s) + '</bdi>';
const nf = (lang, n) => Number(n).toLocaleString(LOC[lang] || 'en-GB');
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const med = a => { const s = a.filter(v => v != null).sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : Math.round((s[s.length / 2 - 1] + s[s.length / 2]) / 2)) : null; };

// ------------------------------------------------------------------------------------------------ words (8 languages)
const T = {
  en: { crumb_c: 'Countries', l_enc: 'Country page in English (registers, delays, full detail)', ch_h: 'Off-plan projects by country', ch_t: 'Off-plan projects by country: {c} countries, {n} projects', ch_lead: 'Every country where we track at least {k} named off-plan projects, with what developers publish there. Data of {d}.', c_co: 'Country', rk_t: 'Off-plan rankings and place reports', rk_lead: 'Rankings and reports computed from our data, every figure with its source, in your language.', rk: ["Transparency rankings by place", "Developers ranked by transparency, by place", "Projects with a published permit, by place", "Projects by published price range", "Freehold or leasehold for foreigners, by country", "Projects above residence-visa thresholds", "Projects near airports", "Monthly market reports by place", "Projects by handover year and place", "Overdue handovers by place", "Projects by neighbourhood", "What changed this week, by place", "Kolaboro in numbers"],
    m_t: 'Off-plan projects in {p}: developers and handover dates', m_h1: 'Off-plan projects in {p}', m_lead: 'Every named off-plan project we track in {p}, with what its developer publishes. Facts only, each with its source on the project page. Data of {d}.',
    m_desc: '{n} off-plan projects in {p} from {dv} developers: permit numbers, handover dates on record and transparency scores. Data of {d}.',
    k_n: 'projects tracked', k_dv: 'developers', k_pn: 'publish a permit or licence number', k_h: 'publish a handover date', k_mv: 'handover date moved later', k_ov: 'handover date passed, not completed', k_med: 'median transparency score (0-100)', k_d: 'data date',
    tb: 'Projects', c_p: 'Project', c_dv: 'Developer', c_ar: 'Area', c_h: 'Handover on record', c_pn: 'Permit number', c_s: 'Score', yes: 'published', no: 'not published', np: 'not published',
    faq: 'Questions about off-plan projects in {p}', q1: 'How many off-plan projects in {p} does Kolaboro track?', a1: '{n} named projects from {dv} developers, data of {d}. Each project page lists the sources of its facts.',
    q2: 'How many off-plan projects in {p} publish a permit or licence number?', a2: '{pn} of {n} ({pp}%) publish a permit or licence number in the sources we read.',
    q3: 'When are off-plan projects in {p} due to be handed over?', a3: '{h} of {n} publish a handover date; the most common year is {y} ({k} projects).', a3n: 'None of the {n} projects publishes a handover date in the sources we read.',
    q4: 'How many off-plan projects in {p} are past their handover date?', a4: '{ov} projects have a handover date on record that has passed without a recorded completion, and for {mv} the date on record moved later at least once.',
    more: 'More on {p}', l_tr: 'Transparency ranking: {p}', l_buy: 'Buying off-plan in {p}: what to check', l_ov: 'Overdue handovers in {p}', l_hy: 'Handovers in {y}', l_en: 'Market file in English (full list and filters)', l_mt: 'How the transparency score works', src: 'Sources: named.json, promises.json and the transparency index, CC BY 4.0.', crumb: 'Markets',
    hub_k: 'Key figures', hub_q: 'Questions and answers',
    hp_q1: 'How many off-plan projects does Kolaboro track?', hp_a1: '{n} named projects in {m} markets and {c} countries, from {dv} developers. Data of {d}.',
    hp_q2: 'Which markets have the most tracked projects?', hp_a2: '{l}.', hp_q3: 'How many projects publish a permit or licence number?', hp_a3: '{pn} of {n} ({pp}%).',
    hp_q4: 'How many handover dates on record have passed?', hp_a4: '{ov} projects have a handover date on record that has passed without a recorded completion ({op}% of those with a date).',
    k_mk: 'markets', k_co: 'countries', k_pl: 'places ranked', k_sc: 'projects scored', k_top: 'highest median score',
    ht_q1: 'Which place has the highest median transparency score?', ht_a1: '{p}, median {s} of 100 over {n} projects (data of {d}).', ht_q2: 'Which place has the lowest median transparency score?', ht_a2: '{p}, median {s} of 100 over {n} projects.',
    ht_q3: 'What does the transparency score measure?', ht_a3: 'What is published and checkable about each project (company, permit, handover date, deposit protection and more), from 0 to 100. It is not a verdict on any company.',
    k_y: 'due in {y}', k_y2: 'due in {y} or later', hh_q1: 'How many off-plan projects are due to be handed over in {y}?', hh_a1: '{k} of the projects we track have a handover date on record in {y}.',
    hh_q2: 'Where are most handovers due in {y}?', hh_a2: '{l}.', hh_q3: 'How many handover dates have already passed?', hh_a3: '{ov} projects are past the handover date on record without a recorded completion; {mv} saw the date move later at least once.',
    k_ovp: 'places with 2+ overdue projects', k_ovm: 'median months past the date', k_ovx: 'most months past the date',
    ho_q1: 'How many off-plan projects are past their handover date?', ho_a1: '{ov} projects, a median of {m} months past the handover date on record (data of {d}).', ho_q2: 'Where are most overdue off-plan projects?', ho_a2: '{l}.',
    ho_q3: 'Does an overdue handover mean the project failed?', ho_a3: 'No. It means the date on record has passed and we hold no record of completion. Projects are often finished late; check the developer\'s latest notice and the official register.',
    k_d5: 'developers with 5+ projects', hd_q1: 'How many developers does Kolaboro track?', hd_a1: '{dv} developers with {n} named off-plan projects (data of {d}).', hd_q2: 'Which developers have the most tracked projects?', hd_a2: '{l}.',
    hd_q3: 'Can a developer correct its page?', hd_a3: 'Yes. Developers can reply with documents through the right of reply; corrections are dated on the corrections page.',
    hc_q1: 'In how many countries does Kolaboro track off-plan projects?', hc_a1: '{c} countries, {n} named projects (data of {d}).', hc_q2: 'Which countries have the most tracked projects?', hc_a2: '{l}.' },
  es: { crumb_c: 'Países', l_enc: 'Ficha del país en inglés (registros, retrasos, detalle completo)', ch_h: 'Proyectos sobre plano por país', ch_t: 'Obra nueva sobre plano por país: {c} países, {n} proyectos', ch_lead: 'Cada país donde seguimos al menos {k} proyectos sobre plano con nombre, con lo que publican allí los promotores. Datos del {d}.', c_co: 'País', rk_t: 'Rankings e informes sobre plano', rk_lead: 'Rankings e informes calculados con nuestros datos, cada cifra con su fuente, en tu idioma.', rk: ["Rankings de transparencia por lugar", "Promotores por transparencia, por lugar", "Proyectos con permiso publicado, por lugar", "Proyectos por rango de precio publicado", "Plena propiedad o arrendamiento para extranjeros, por país", "Proyectos por encima de los umbrales de visado de residencia", "Proyectos cerca de aeropuertos", "Informes mensuales del mercado por lugar", "Proyectos por año de entrega y lugar", "Entregas vencidas por lugar", "Proyectos por barrio", "Qué cambió esta semana, por lugar", "Kolaboro en cifras"],
    m_t: 'Obra nueva sobre plano en {p}: promotores y entregas', m_h1: 'Proyectos sobre plano en {p}', m_lead: 'Cada proyecto sobre plano con nombre que seguimos en {p}, con lo que publica su promotor. Solo hechos, cada uno con su fuente en la ficha. Datos del {d}.',
    m_desc: '{n} proyectos sobre plano en {p} de {dv} promotores: números de licencia, fechas de entrega registradas y puntuación de transparencia. Datos del {d}.',
    k_n: 'proyectos seguidos', k_dv: 'promotores', k_pn: 'publican un número de licencia o permiso', k_h: 'publican fecha de entrega', k_mv: 'fecha de entrega retrasada', k_ov: 'fecha de entrega vencida, sin terminar', k_med: 'puntuación de transparencia mediana (0-100)', k_d: 'fecha de los datos',
    tb: 'Proyectos', c_p: 'Proyecto', c_dv: 'Promotor', c_ar: 'Zona', c_h: 'Entrega registrada', c_pn: 'Nº de licencia', c_s: 'Puntuación', yes: 'publicado', no: 'no publicado', np: 'no publicado',
    faq: 'Preguntas sobre obra nueva sobre plano en {p}', q1: '¿Cuántos proyectos sobre plano sigue Kolaboro en {p}?', a1: '{n} proyectos con nombre de {dv} promotores, datos del {d}. Cada ficha enlaza las fuentes de sus datos.',
    q2: '¿Cuántos proyectos sobre plano en {p} publican un número de licencia o permiso?', a2: '{pn} de {n} ({pp} %) publican un número de licencia o permiso en las fuentes que leímos.',
    q3: '¿Cuándo se entregan los proyectos sobre plano en {p}?', a3: '{h} de {n} publican fecha de entrega; el año más frecuente es {y} ({k} proyectos).', a3n: 'Ninguno de los {n} proyectos publica fecha de entrega en las fuentes que leímos.',
    q4: '¿Cuántos proyectos sobre plano en {p} han pasado su fecha de entrega?', a4: '{ov} proyectos tienen una fecha de entrega registrada ya vencida sin terminación registrada, y en {mv} la fecha se retrasó al menos una vez.',
    more: 'Más sobre {p}', l_tr: 'Ranking de transparencia: {p}', l_buy: 'Comprar sobre plano en {p}: qué comprobar', l_ov: 'Entregas vencidas en {p}', l_hy: 'Entregas en {y}', l_en: 'Ficha del mercado en inglés (lista completa y filtros)', l_mt: 'Cómo funciona la puntuación de transparencia', src: 'Fuentes: named.json, promises.json y el índice de transparencia, CC BY 4.0.', crumb: 'Mercados',
    hub_k: 'Cifras clave', hub_q: 'Preguntas y respuestas',
    hp_q1: '¿Cuántos proyectos sobre plano sigue Kolaboro?', hp_a1: '{n} proyectos con nombre en {m} mercados y {c} países, de {dv} promotores. Datos del {d}.',
    hp_q2: '¿Qué mercados tienen más proyectos seguidos?', hp_a2: '{l}.', hp_q3: '¿Cuántos proyectos publican un número de licencia o permiso?', hp_a3: '{pn} de {n} ({pp} %).',
    hp_q4: '¿Cuántas fechas de entrega registradas ya han vencido?', hp_a4: '{ov} proyectos tienen una fecha de entrega registrada vencida sin terminación registrada ({op} % de los que tienen fecha).',
    k_mk: 'mercados', k_co: 'países', k_pl: 'lugares con ranking', k_sc: 'proyectos puntuados', k_top: 'mayor puntuación mediana',
    ht_q1: '¿Qué lugar tiene la mayor puntuación de transparencia mediana?', ht_a1: '{p}, mediana de {s} sobre 100 en {n} proyectos (datos del {d}).', ht_q2: '¿Qué lugar tiene la menor puntuación de transparencia mediana?', ht_a2: '{p}, mediana de {s} sobre 100 en {n} proyectos.',
    ht_q3: '¿Qué mide la puntuación de transparencia?', ht_a3: 'Lo que se publica y se puede comprobar de cada proyecto (empresa, licencia, fecha de entrega, protección del depósito y más), de 0 a 100. No es un veredicto sobre ninguna empresa.',
    k_y: 'entrega en {y}', k_y2: 'entrega en {y} o después', hh_q1: '¿Cuántos proyectos sobre plano se entregan en {y}?', hh_a1: '{k} de los proyectos que seguimos tienen fecha de entrega registrada en {y}.',
    hh_q2: '¿Dónde se concentran las entregas de {y}?', hh_a2: '{l}.', hh_q3: '¿Cuántas fechas de entrega ya han vencido?', hh_a3: '{ov} proyectos han pasado la fecha de entrega registrada sin terminación registrada; en {mv} la fecha se retrasó al menos una vez.',
    k_ovp: 'lugares con 2+ proyectos vencidos', k_ovm: 'meses de retraso (mediana)', k_ovx: 'máximo de meses de retraso',
    ho_q1: '¿Cuántos proyectos sobre plano han pasado su fecha de entrega?', ho_a1: '{ov} proyectos, con una mediana de {m} meses desde la fecha registrada (datos del {d}).', ho_q2: '¿Dónde hay más proyectos sobre plano con entrega vencida?', ho_a2: '{l}.',
    ho_q3: '¿Una entrega vencida significa que el proyecto fracasó?', ho_a3: 'No. Significa que la fecha registrada ya pasó y no tenemos constancia de la terminación. Muchos proyectos terminan tarde; consulta el último aviso del promotor y el registro oficial.',
    k_d5: 'promotores con 5+ proyectos', hd_q1: '¿Cuántos promotores sigue Kolaboro?', hd_a1: '{dv} promotores con {n} proyectos sobre plano con nombre (datos del {d}).', hd_q2: '¿Qué promotores tienen más proyectos seguidos?', hd_a2: '{l}.',
    hd_q3: '¿Puede un promotor corregir su ficha?', hd_a3: 'Sí. Los promotores pueden responder con documentos mediante el derecho de réplica; las correcciones quedan fechadas en la página de correcciones.',
    hc_q1: '¿En cuántos países sigue Kolaboro proyectos sobre plano?', hc_a1: '{c} países, {n} proyectos con nombre (datos del {d}).', hc_q2: '¿Qué países tienen más proyectos seguidos?', hc_a2: '{l}.' },
  fr: { crumb_c: 'Pays', l_enc: 'Fiche du pays en anglais (registres, retards, détail complet)', ch_h: 'Projets sur plan par pays', ch_t: 'Programmes neufs sur plan par pays : {c} pays, {n} projets', ch_lead: 'Chaque pays où nous suivons au moins {k} projets sur plan nommés, avec ce qu’y publient les promoteurs. Données du {d}.', c_co: 'Pays', rk_t: 'Classements et rapports sur plan', rk_lead: 'Classements et rapports calculés à partir de nos données, chaque chiffre avec sa source, dans votre langue.', rk: ["Classements de transparence par lieu", "Promoteurs classés par transparence, par lieu", "Projets avec permis publié, par lieu", "Projets par tranche de prix publiée", "Pleine propriété ou bail pour les étrangers, par pays", "Projets au-dessus des seuils de visa de résidence", "Projets près des aéroports", "Rapports mensuels du marché par lieu", "Projets par année de livraison et lieu", "Livraisons en retard par lieu", "Projets par quartier", "Ce qui a changé cette semaine, par lieu", "Kolaboro en chiffres"],
    m_t: 'Programmes neufs sur plan à {p} : promoteurs, livraisons', m_h1: 'Projets sur plan à {p}', m_lead: 'Chaque projet sur plan nommé que nous suivons à {p}, avec ce que publie son promoteur. Des faits seulement, chacun avec sa source sur la fiche. Données du {d}.',
    m_desc: '{n} projets sur plan à {p} de {dv} promoteurs : numéros de permis, dates de livraison enregistrées et scores de transparence. Données du {d}.',
    k_n: 'projets suivis', k_dv: 'promoteurs', k_pn: 'publient un numéro de permis ou de licence', k_h: 'publient une date de livraison', k_mv: 'date de livraison repoussée', k_ov: 'date de livraison dépassée, non achevé', k_med: 'score de transparence médian (0-100)', k_d: 'date des données',
    tb: 'Projets', c_p: 'Projet', c_dv: 'Promoteur', c_ar: 'Zone', c_h: 'Livraison enregistrée', c_pn: 'N° de permis', c_s: 'Score', yes: 'publié', no: 'non publié', np: 'non publié',
    faq: 'Questions sur les projets sur plan à {p}', q1: 'Combien de projets sur plan Kolaboro suit-il à {p} ?', a1: '{n} projets nommés de {dv} promoteurs, données du {d}. Chaque fiche cite les sources de ses faits.',
    q2: 'Combien de projets sur plan à {p} publient un numéro de permis ou de licence ?', a2: '{pn} sur {n} ({pp} %) publient un numéro de permis ou de licence dans les sources lues.',
    q3: 'Quand les projets sur plan à {p} doivent-ils être livrés ?', a3: '{h} sur {n} publient une date de livraison ; l’année la plus fréquente est {y} ({k} projets).', a3n: 'Aucun des {n} projets ne publie de date de livraison dans les sources lues.',
    q4: 'Combien de projets sur plan à {p} ont dépassé leur date de livraison ?', a4: '{ov} projets ont une date de livraison enregistrée dépassée sans achèvement enregistré, et pour {mv} la date a été repoussée au moins une fois.',
    more: 'Plus sur {p}', l_tr: 'Classement de transparence : {p}', l_buy: 'Acheter sur plan à {p} : que vérifier', l_ov: 'Livraisons en retard à {p}', l_hy: 'Livraisons en {y}', l_en: 'Fiche du marché en anglais (liste complète et filtres)', l_mt: 'Comment fonctionne le score de transparence', src: 'Sources : named.json, promises.json et l’indice de transparence, CC BY 4.0.', crumb: 'Marchés',
    hub_k: 'Chiffres clés', hub_q: 'Questions et réponses',
    hp_q1: 'Combien de projets sur plan Kolaboro suit-il ?', hp_a1: '{n} projets nommés sur {m} marchés et {c} pays, de {dv} promoteurs. Données du {d}.',
    hp_q2: 'Quels marchés comptent le plus de projets suivis ?', hp_a2: '{l}.', hp_q3: 'Combien de projets publient un numéro de permis ou de licence ?', hp_a3: '{pn} sur {n} ({pp} %).',
    hp_q4: 'Combien de dates de livraison enregistrées sont dépassées ?', hp_a4: '{ov} projets ont une date de livraison enregistrée dépassée sans achèvement enregistré ({op} % de ceux qui ont une date).',
    k_mk: 'marchés', k_co: 'pays', k_pl: 'lieux classés', k_sc: 'projets notés', k_top: 'score médian le plus élevé',
    ht_q1: 'Quel lieu a le score de transparence médian le plus élevé ?', ht_a1: '{p}, médiane de {s} sur 100 pour {n} projets (données du {d}).', ht_q2: 'Quel lieu a le score de transparence médian le plus bas ?', ht_a2: '{p}, médiane de {s} sur 100 pour {n} projets.',
    ht_q3: 'Que mesure le score de transparence ?', ht_a3: 'Ce qui est publié et vérifiable pour chaque projet (société, permis, date de livraison, protection du dépôt, etc.), de 0 à 100. Ce n’est un verdict sur aucune société.',
    k_y: 'livraison en {y}', k_y2: 'livraison en {y} ou après', hh_q1: 'Combien de projets sur plan doivent être livrés en {y} ?', hh_a1: '{k} des projets suivis ont une date de livraison enregistrée en {y}.',
    hh_q2: 'Où se concentrent les livraisons de {y} ?', hh_a2: '{l}.', hh_q3: 'Combien de dates de livraison sont déjà dépassées ?', hh_a3: '{ov} projets ont dépassé la date enregistrée sans achèvement enregistré ; pour {mv}, la date a été repoussée au moins une fois.',
    k_ovp: 'lieux avec 2+ projets en retard', k_ovm: 'mois de retard (médiane)', k_ovx: 'retard maximal en mois',
    ho_q1: 'Combien de projets sur plan ont dépassé leur date de livraison ?', ho_a1: '{ov} projets, avec une médiane de {m} mois après la date enregistrée (données du {d}).', ho_q2: 'Où se trouvent le plus de projets sur plan en retard ?', ho_a2: '{l}.',
    ho_q3: 'Une livraison en retard signifie-t-elle que le projet a échoué ?', ho_a3: 'Non. La date enregistrée est passée et nous n’avons aucune trace d’achèvement. Beaucoup de projets sont livrés en retard ; consultez le dernier avis du promoteur et le registre officiel.',
    k_d5: 'promoteurs avec 5+ projets', hd_q1: 'Combien de promoteurs Kolaboro suit-il ?', hd_a1: '{dv} promoteurs avec {n} projets sur plan nommés (données du {d}).', hd_q2: 'Quels promoteurs ont le plus de projets suivis ?', hd_a2: '{l}.',
    hd_q3: 'Un promoteur peut-il corriger sa fiche ?', hd_a3: 'Oui. Les promoteurs peuvent répondre avec des documents via le droit de réponse ; les corrections sont datées sur la page des corrections.',
    hc_q1: 'Dans combien de pays Kolaboro suit-il des projets sur plan ?', hc_a1: '{c} pays, {n} projets nommés (données du {d}).', hc_q2: 'Quels pays comptent le plus de projets suivis ?', hc_a2: '{l}.' },
  de: { crumb_c: 'Länder', l_enc: 'Länderseite auf Englisch (Register, Verzögerungen, alle Details)', ch_h: 'Off-Plan-Projekte nach Land', ch_t: 'Off-Plan-Neubau nach Land: {c} Länder, {n} Projekte', ch_lead: 'Jedes Land, in dem wir mindestens {k} namentlich erfasste Off-Plan-Projekte verfolgen, mit dem, was Bauträger dort veröffentlichen. Datenstand {d}.', c_co: 'Land', rk_t: 'Off-Plan-Ranglisten und Ortsberichte', rk_lead: 'Ranglisten und Berichte aus unseren Daten, jede Zahl mit Quelle, in Ihrer Sprache.', rk: ["Transparenz-Ranglisten nach Ort", "Bauträger nach Transparenz, nach Ort", "Projekte mit veröffentlichter Genehmigung, nach Ort", "Projekte nach veröffentlichter Preisspanne", "Volleigentum oder Pacht für Ausländer, nach Land", "Projekte über den Schwellen für Aufenthaltsvisa", "Projekte in Flughafennähe", "Monatliche Marktberichte nach Ort", "Projekte nach Übergabejahr und Ort", "Überfällige Übergaben nach Ort", "Projekte nach Viertel", "Was sich diese Woche geändert hat, nach Ort", "Kolaboro in Zahlen"],
    m_t: 'Off-Plan-Neubau in {p}: Bauträger und Übergabe', m_h1: 'Off-Plan-Projekte in {p}', m_lead: 'Jedes namentlich erfasste Off-Plan-Projekt, das wir in {p} verfolgen, mit dem, was sein Bauträger veröffentlicht. Nur Fakten, jede mit Quelle auf der Projektseite. Datenstand {d}.',
    m_desc: '{n} Off-Plan-Projekte in {p} von {dv} Bauträgern: Genehmigungsnummern, erfasste Übergabetermine und Transparenzwerte. Datenstand {d}.',
    k_n: 'verfolgte Projekte', k_dv: 'Bauträger', k_pn: 'veröffentlichen eine Genehmigungs- oder Lizenznummer', k_h: 'veröffentlichen einen Übergabetermin', k_mv: 'Übergabetermin verschoben', k_ov: 'Übergabetermin verstrichen, nicht fertig', k_med: 'mittlerer Transparenzwert (0-100)', k_d: 'Datenstand',
    tb: 'Projekte', c_p: 'Projekt', c_dv: 'Bauträger', c_ar: 'Lage', c_h: 'Erfasste Übergabe', c_pn: 'Genehmigungsnr.', c_s: 'Wert', yes: 'veröffentlicht', no: 'nicht veröffentlicht', np: 'nicht veröffentlicht',
    faq: 'Fragen zu Off-Plan-Projekten in {p}', q1: 'Wie viele Off-Plan-Projekte in {p} verfolgt Kolaboro?', a1: '{n} namentlich erfasste Projekte von {dv} Bauträgern, Datenstand {d}. Jede Projektseite nennt die Quellen ihrer Fakten.',
    q2: 'Wie viele Off-Plan-Projekte in {p} veröffentlichen eine Genehmigungs- oder Lizenznummer?', a2: '{pn} von {n} ({pp} %) veröffentlichen in den gelesenen Quellen eine Genehmigungs- oder Lizenznummer.',
    q3: 'Wann sollen Off-Plan-Projekte in {p} übergeben werden?', a3: '{h} von {n} veröffentlichen einen Übergabetermin; am häufigsten {y} ({k} Projekte).', a3n: 'Keines der {n} Projekte veröffentlicht in den gelesenen Quellen einen Übergabetermin.',
    q4: 'Wie viele Off-Plan-Projekte in {p} haben ihren Übergabetermin überschritten?', a4: 'Bei {ov} Projekten ist der erfasste Übergabetermin ohne erfasste Fertigstellung verstrichen, bei {mv} wurde der Termin mindestens einmal verschoben.',
    more: 'Mehr zu {p}', l_tr: 'Transparenz-Rangliste: {p}', l_buy: 'Off-Plan kaufen in {p}: was Sie prüfen sollten', l_ov: 'Überfällige Übergaben in {p}', l_hy: 'Übergaben {y}', l_en: 'Marktseite auf Englisch (vollständige Liste und Filter)', l_mt: 'So funktioniert der Transparenzwert', src: 'Quellen: named.json, promises.json und der Transparenzindex, CC BY 4.0.', crumb: 'Märkte',
    hub_k: 'Kennzahlen', hub_q: 'Fragen und Antworten',
    hp_q1: 'Wie viele Off-Plan-Projekte verfolgt Kolaboro?', hp_a1: '{n} namentlich erfasste Projekte in {m} Märkten und {c} Ländern, von {dv} Bauträgern. Datenstand {d}.',
    hp_q2: 'Welche Märkte haben die meisten verfolgten Projekte?', hp_a2: '{l}.', hp_q3: 'Wie viele Projekte veröffentlichen eine Genehmigungs- oder Lizenznummer?', hp_a3: '{pn} von {n} ({pp} %).',
    hp_q4: 'Wie viele erfasste Übergabetermine sind verstrichen?', hp_a4: 'Bei {ov} Projekten ist der erfasste Übergabetermin ohne erfasste Fertigstellung verstrichen ({op} % derer mit Termin).',
    k_mk: 'Märkte', k_co: 'Länder', k_pl: 'Orte mit Rangliste', k_sc: 'bewertete Projekte', k_top: 'höchster Medianwert',
    ht_q1: 'Welcher Ort hat den höchsten mittleren Transparenzwert?', ht_a1: '{p}, Median {s} von 100 bei {n} Projekten (Datenstand {d}).', ht_q2: 'Welcher Ort hat den niedrigsten mittleren Transparenzwert?', ht_a2: '{p}, Median {s} von 100 bei {n} Projekten.',
    ht_q3: 'Was misst der Transparenzwert?', ht_a3: 'Was zu jedem Projekt veröffentlicht und prüfbar ist (Firma, Genehmigung, Übergabetermin, Absicherung der Anzahlung und mehr), von 0 bis 100. Er ist kein Urteil über ein Unternehmen.',
    k_y: 'Übergabe {y}', k_y2: 'Übergabe {y} oder später', hh_q1: 'Wie viele Off-Plan-Projekte sollen {y} übergeben werden?', hh_a1: '{k} der verfolgten Projekte haben einen erfassten Übergabetermin im Jahr {y}.',
    hh_q2: 'Wo liegen die meisten Übergaben {y}?', hh_a2: '{l}.', hh_q3: 'Wie viele Übergabetermine sind schon verstrichen?', hh_a3: 'Bei {ov} Projekten ist der erfasste Termin ohne erfasste Fertigstellung verstrichen; bei {mv} wurde der Termin mindestens einmal verschoben.',
    k_ovp: 'Orte mit 2+ überfälligen Projekten', k_ovm: 'Monate über dem Termin (Median)', k_ovx: 'längste Überschreitung in Monaten',
    ho_q1: 'Wie viele Off-Plan-Projekte haben ihren Übergabetermin überschritten?', ho_a1: '{ov} Projekte, im Median {m} Monate nach dem erfassten Termin (Datenstand {d}).', ho_q2: 'Wo gibt es die meisten überfälligen Off-Plan-Projekte?', ho_a2: '{l}.',
    ho_q3: 'Heißt eine überfällige Übergabe, dass das Projekt gescheitert ist?', ho_a3: 'Nein. Der erfasste Termin ist verstrichen und uns liegt keine Fertigstellung vor. Viele Projekte werden verspätet fertig; prüfen Sie die letzte Mitteilung des Bauträgers und das amtliche Register.',
    k_d5: 'Bauträger mit 5+ Projekten', hd_q1: 'Wie viele Bauträger verfolgt Kolaboro?', hd_a1: '{dv} Bauträger mit {n} namentlich erfassten Off-Plan-Projekten (Datenstand {d}).', hd_q2: 'Welche Bauträger haben die meisten verfolgten Projekte?', hd_a2: '{l}.',
    hd_q3: 'Kann ein Bauträger seine Seite korrigieren?', hd_a3: 'Ja. Bauträger können über das Recht auf Gegendarstellung mit Dokumenten antworten; Korrekturen stehen datiert auf der Korrekturseite.',
    hc_q1: 'In wie vielen Ländern verfolgt Kolaboro Off-Plan-Projekte?', hc_a1: '{c} Länder, {n} namentlich erfasste Projekte (Datenstand {d}).', hc_q2: 'Welche Länder haben die meisten verfolgten Projekte?', hc_a2: '{l}.' },
  nl: { crumb_c: 'Landen', l_enc: 'Landenpagina in het Engels (registers, vertragingen, alle details)', ch_h: 'Projecten op plan per land', ch_t: 'Nieuwbouw op plan per land: {c} landen, {n} projecten', ch_lead: 'Elk land waar we minstens {k} projecten op plan met naam volgen, met wat ontwikkelaars daar publiceren. Gegevens van {d}.', c_co: 'Land', rk_t: 'Ranglijsten en rapporten over projecten op plan', rk_lead: 'Ranglijsten en rapporten berekend uit onze gegevens, elk cijfer met bron, in uw taal.', rk: ["Transparantieranglijsten per plaats", "Ontwikkelaars naar transparantie, per plaats", "Projecten met gepubliceerde vergunning, per plaats", "Projecten per gepubliceerde prijsklasse", "Volle eigendom of erfpacht voor buitenlanders, per land", "Projecten boven de drempels voor verblijfsvisa", "Projecten bij luchthavens", "Maandelijkse marktrapporten per plaats", "Projecten per opleverjaar en plaats", "Te late opleveringen per plaats", "Projecten per wijk", "Wat er deze week veranderde, per plaats", "Kolaboro in cijfers"],
    m_t: 'Nieuwbouw op plan in {p}: ontwikkelaars en oplevering', m_h1: 'Nieuwbouwprojecten op plan in {p}', m_lead: 'Elk project op plan met naam dat we volgen in {p}, met wat de ontwikkelaar publiceert. Alleen feiten, elk met bron op de projectpagina. Gegevens van {d}.',
    m_desc: '{n} projecten op plan in {p} van {dv} ontwikkelaars: vergunningsnummers, geregistreerde opleverdata en transparantiescores. Gegevens van {d}.',
    k_n: 'gevolgde projecten', k_dv: 'ontwikkelaars', k_pn: 'publiceren een vergunnings- of licentienummer', k_h: 'publiceren een opleverdatum', k_mv: 'opleverdatum uitgesteld', k_ov: 'opleverdatum verstreken, niet klaar', k_med: 'mediane transparantiescore (0-100)', k_d: 'datum gegevens',
    tb: 'Projecten', c_p: 'Project', c_dv: 'Ontwikkelaar', c_ar: 'Gebied', c_h: 'Geregistreerde oplevering', c_pn: 'Vergunningsnr.', c_s: 'Score', yes: 'gepubliceerd', no: 'niet gepubliceerd', np: 'niet gepubliceerd',
    faq: 'Vragen over nieuwbouw op plan in {p}', q1: 'Hoeveel projecten op plan in {p} volgt Kolaboro?', a1: '{n} projecten met naam van {dv} ontwikkelaars, gegevens van {d}. Elke projectpagina noemt de bronnen van haar feiten.',
    q2: 'Hoeveel projecten op plan in {p} publiceren een vergunnings- of licentienummer?', a2: '{pn} van {n} ({pp}%) publiceren een vergunnings- of licentienummer in de bronnen die we lazen.',
    q3: 'Wanneer worden projecten op plan in {p} opgeleverd?', a3: '{h} van {n} publiceren een opleverdatum; het vaakst {y} ({k} projecten).', a3n: 'Geen van de {n} projecten publiceert een opleverdatum in de bronnen die we lazen.',
    q4: 'Hoeveel projecten op plan in {p} zijn over hun opleverdatum?', a4: 'Bij {ov} projecten is de geregistreerde opleverdatum verstreken zonder geregistreerde oplevering, en bij {mv} is de datum minstens één keer uitgesteld.',
    more: 'Meer over {p}', l_tr: 'Transparantieranglijst: {p}', l_buy: 'Off-plan kopen in {p}: wat u moet controleren', l_ov: 'Te late opleveringen in {p}', l_hy: 'Opleveringen in {y}', l_en: 'Marktpagina in het Engels (volledige lijst en filters)', l_mt: 'Hoe de transparantiescore werkt', src: 'Bronnen: named.json, promises.json en de transparantie-index, CC BY 4.0.', crumb: 'Markten',
    hub_k: 'Kerncijfers', hub_q: 'Vragen en antwoorden',
    hp_q1: 'Hoeveel projecten op plan volgt Kolaboro?', hp_a1: '{n} projecten met naam in {m} markten en {c} landen, van {dv} ontwikkelaars. Gegevens van {d}.',
    hp_q2: 'Welke markten hebben de meeste gevolgde projecten?', hp_a2: '{l}.', hp_q3: 'Hoeveel projecten publiceren een vergunnings- of licentienummer?', hp_a3: '{pn} van {n} ({pp}%).',
    hp_q4: 'Hoeveel geregistreerde opleverdata zijn verstreken?', hp_a4: 'Bij {ov} projecten is de geregistreerde opleverdatum verstreken zonder geregistreerde oplevering ({op}% van die met een datum).',
    k_mk: 'markten', k_co: 'landen', k_pl: 'plaatsen met ranglijst', k_sc: 'projecten met score', k_top: 'hoogste mediaanscore',
    ht_q1: 'Welke plaats heeft de hoogste mediane transparantiescore?', ht_a1: '{p}, mediaan {s} van 100 over {n} projecten (gegevens van {d}).', ht_q2: 'Welke plaats heeft de laagste mediane transparantiescore?', ht_a2: '{p}, mediaan {s} van 100 over {n} projecten.',
    ht_q3: 'Wat meet de transparantiescore?', ht_a3: 'Wat per project gepubliceerd en controleerbaar is (bedrijf, vergunning, opleverdatum, bescherming van de aanbetaling en meer), van 0 tot 100. Het is geen oordeel over een bedrijf.',
    k_y: 'oplevering {y}', k_y2: 'oplevering {y} of later', hh_q1: 'Hoeveel projecten op plan worden in {y} opgeleverd?', hh_a1: '{k} van de projecten die we volgen hebben een geregistreerde opleverdatum in {y}.',
    hh_q2: 'Waar vallen de meeste opleveringen in {y}?', hh_a2: '{l}.', hh_q3: 'Hoeveel opleverdata zijn al verstreken?', hh_a3: 'Bij {ov} projecten is de geregistreerde datum verstreken zonder geregistreerde oplevering; bij {mv} is de datum minstens één keer uitgesteld.',
    k_ovp: 'plaatsen met 2+ te late projecten', k_ovm: 'maanden over de datum (mediaan)', k_ovx: 'langste overschrijding in maanden',
    ho_q1: 'Hoeveel projecten op plan zijn over hun opleverdatum?', ho_a1: '{ov} projecten, mediaan {m} maanden na de geregistreerde datum (gegevens van {d}).', ho_q2: 'Waar zijn de meeste te late projecten op plan?', ho_a2: '{l}.',
    ho_q3: 'Betekent een te late oplevering dat het project mislukt is?', ho_a3: 'Nee. De geregistreerde datum is verstreken en we hebben geen registratie van oplevering. Veel projecten worden later klaar; kijk naar de laatste mededeling van de ontwikkelaar en het officiële register.',
    k_d5: 'ontwikkelaars met 5+ projecten', hd_q1: 'Hoeveel ontwikkelaars volgt Kolaboro?', hd_a1: '{dv} ontwikkelaars met {n} projecten op plan met naam (gegevens van {d}).', hd_q2: 'Welke ontwikkelaars hebben de meeste gevolgde projecten?', hd_a2: '{l}.',
    hd_q3: 'Kan een ontwikkelaar zijn pagina corrigeren?', hd_a3: 'Ja. Ontwikkelaars kunnen met documenten reageren via het recht op weerwoord; correcties staan gedateerd op de correctiepagina.',
    hc_q1: 'In hoeveel landen volgt Kolaboro projecten op plan?', hc_a1: '{c} landen, {n} projecten met naam (gegevens van {d}).', hc_q2: 'Welke landen hebben de meeste gevolgde projecten?', hc_a2: '{l}.' },
  ru: { crumb_c: 'Страны', l_enc: 'Страница страны на английском (реестры, задержки, все подробности)', ch_h: 'Новостройки по странам', ch_t: 'Новостройки за рубежом по странам: {c} стран, {n} проектов', ch_lead: 'Все страны, где мы отслеживаем не менее {k} строящихся проектов с названием, и что там публикуют застройщики. Данные на {d}.', c_co: 'Страна', rk_t: 'Рейтинги и отчёты по новостройкам', rk_lead: 'Рейтинги и отчёты по нашим данным, у каждой цифры есть источник, на вашем языке.', rk: ["Рейтинги прозрачности по местам", "Застройщики по прозрачности, по местам", "Проекты с опубликованным разрешением, по местам", "Проекты по опубликованному диапазону цен", "Собственность или аренда для иностранцев, по странам", "Проекты выше порогов для вида на жительство", "Проекты рядом с аэропортами", "Ежемесячные отчёты о рынке по местам", "Проекты по году сдачи и месту", "Просроченная сдача по местам", "Проекты по районам", "Что изменилось на этой неделе, по местам", "Kolaboro в цифрах"],
    m_t: 'Новостройки {p}: застройщики, сроки сдачи, разрешения', m_h1: 'Новостройки {p}', m_lead: 'Все строящиеся проекты с названием, которые мы отслеживаем в {p}, и то, что публикует застройщик. Только факты, у каждого источник на странице проекта. Данные на {d}.',
    m_desc: '{n} строящихся проектов в {p} от {dv} застройщиков: номера разрешений, сроки сдачи и оценки прозрачности. Данные на {d}.',
    k_n: 'проектов отслеживается', k_dv: 'застройщиков', k_pn: 'публикуют номер разрешения или лицензии', k_h: 'публикуют срок сдачи', k_mv: 'срок сдачи переносился', k_ov: 'срок сдачи прошёл, не завершены', k_med: 'медианная оценка прозрачности (0-100)', k_d: 'дата данных',
    tb: 'Проекты', c_p: 'Проект', c_dv: 'Застройщик', c_ar: 'Район', c_h: 'Срок сдачи по данным', c_pn: 'Номер разрешения', c_s: 'Оценка', yes: 'опубликован', no: 'не опубликован', np: 'не опубликовано',
    faq: 'Вопросы о новостройках: {p}', q1: 'Сколько новостроек в {p} отслеживает Kolaboro?', a1: '{n} проектов с названием от {dv} застройщиков, данные на {d}. На странице каждого проекта указаны источники фактов.',
    q2: 'Сколько новостроек в {p} публикуют номер разрешения или лицензии?', a2: '{pn} из {n} ({pp}%) публикуют номер разрешения или лицензии в прочитанных нами источниках.',
    q3: 'Когда сдаются новостройки в {p}?', a3: '{h} из {n} публикуют срок сдачи; чаще всего это {y} год ({k} проектов).', a3n: 'Ни один из {n} проектов не публикует срок сдачи в прочитанных нами источниках.',
    q4: 'Сколько новостроек в {p} просрочили срок сдачи?', a4: 'У {ov} проектов срок сдачи по нашим данным прошёл без отметки о завершении, а у {mv} срок хотя бы раз переносился.',
    more: 'Ещё о месте: {p}', l_tr: 'Рейтинг прозрачности: {p}', l_buy: 'Покупка новостройки: {p}, что проверить', l_ov: 'Просроченная сдача: {p}', l_hy: 'Сдача в {y} году', l_en: 'Страница рынка на английском (полный список и фильтры)', l_mt: 'Как считается оценка прозрачности', src: 'Источники: named.json, promises.json и индекс прозрачности, CC BY 4.0.', crumb: 'Рынки',
    hub_k: 'Ключевые цифры', hub_q: 'Вопросы и ответы',
    hp_q1: 'Сколько новостроек отслеживает Kolaboro?', hp_a1: '{n} проектов с названием на {m} рынках в {c} странах, от {dv} застройщиков. Данные на {d}.',
    hp_q2: 'На каких рынках больше всего отслеживаемых проектов?', hp_a2: '{l}.', hp_q3: 'Сколько проектов публикуют номер разрешения или лицензии?', hp_a3: '{pn} из {n} ({pp}%).',
    hp_q4: 'Сколько сроков сдачи уже прошло?', hp_a4: 'У {ov} проектов срок сдачи по нашим данным прошёл без отметки о завершении ({op}% проектов со сроком).',
    k_mk: 'рынков', k_co: 'стран', k_pl: 'мест с рейтингом', k_sc: 'проектов с оценкой', k_top: 'самая высокая медиана',
    ht_q1: 'Где самая высокая медианная оценка прозрачности?', ht_a1: '{p}: медиана {s} из 100 по {n} проектам (данные на {d}).', ht_q2: 'Где самая низкая медианная оценка прозрачности?', ht_a2: '{p}: медиана {s} из 100 по {n} проектам.',
    ht_q3: 'Что измеряет оценка прозрачности?', ht_a3: 'Что опубликовано и проверяемо по каждому проекту (компания, разрешение, срок сдачи, защита депозита и другое), от 0 до 100. Это не вердикт о какой-либо компании.',
    k_y: 'сдача в {y}', k_y2: 'сдача в {y} и позже', hh_q1: 'Сколько новостроек должны сдать в {y} году?', hh_a1: '{k} отслеживаемых проектов имеют срок сдачи в {y} году.',
    hh_q2: 'Где больше всего сдач в {y} году?', hh_a2: '{l}.', hh_q3: 'Сколько сроков сдачи уже прошло?', hh_a3: 'У {ov} проектов срок по нашим данным прошёл без отметки о завершении; у {mv} срок хотя бы раз переносился.',
    k_ovp: 'мест с 2+ просроченными проектами', k_ovm: 'месяцев после срока (медиана)', k_ovx: 'наибольшая просрочка, месяцев',
    ho_q1: 'Сколько новостроек просрочили срок сдачи?', ho_a1: '{ov} проектов, в среднем (медиана) {m} мес. после срока по нашим данным (данные на {d}).', ho_q2: 'Где больше всего просроченных новостроек?', ho_a2: '{l}.',
    ho_q3: 'Значит ли просрочка, что проект провалился?', ho_a3: 'Нет. Это значит, что срок по нашим данным прошёл, а записи о завершении нет. Многие проекты сдаются с опозданием; проверьте последнее сообщение застройщика и официальный реестр.',
    k_d5: 'застройщиков с 5+ проектами', hd_q1: 'Сколько застройщиков отслеживает Kolaboro?', hd_a1: '{dv} застройщиков, {n} строящихся проектов с названием (данные на {d}).', hd_q2: 'У каких застройщиков больше всего отслеживаемых проектов?', hd_a2: '{l}.',
    hd_q3: 'Может ли застройщик исправить свою страницу?', hd_a3: 'Да. Застройщики могут ответить с документами через право на ответ; исправления с датой публикуются на странице исправлений.',
    hc_q1: 'В скольких странах Kolaboro отслеживает новостройки?', hc_a1: '{c} стран, {n} проектов с названием (данные на {d}).', hc_q2: 'В каких странах больше всего отслеживаемых проектов?', hc_a2: '{l}.' },
  zh: { crumb_c: '国家', l_enc: '英文国家页面（登记、延期、完整详情）', ch_h: '按国家查看期房项目', ch_t: '按国家查看海外期房：{c} 个国家，{n} 个项目', ch_lead: '我们跟踪至少 {k} 个有名称期房项目的每个国家，以及开发商在当地公布的内容。数据日期：{d}。', c_co: '国家', rk_t: '期房排名与地区报告', rk_lead: '根据我们的数据计算的排名和报告，每个数字都有来源，以您的语言呈现。', rk: ["各地透明度排名", "各地开发商透明度排名", "各地公布许可证的项目", "按公布价格区间查看项目", "各国外国人永久产权或租赁权", "高于居留签证门槛的项目", "机场附近的项目", "各地每月市场报告", "按交付年份和地点查看项目", "各地逾期交付", "按社区查看项目", "本周有哪些变化（按地点）", "Kolaboro 数据一览"],
    m_t: '{p}期房项目：开发商、交付日期与许可证', m_h1: '{p}期房项目', m_lead: '我们在{p}跟踪的每个有名称的期房项目，以及开发商公布的内容。只列事实，每项事实在项目页面上都有来源。数据日期：{d}。',
    m_desc: '{p}的 {n} 个期房项目，来自 {dv} 家开发商：许可证编号、记录的交付日期和透明度评分。数据日期：{d}。',
    k_n: '个跟踪项目', k_dv: '家开发商', k_pn: '公布许可证或执照编号', k_h: '公布交付日期', k_mv: '交付日期推迟过', k_ov: '交付日期已过且未完工', k_med: '透明度评分中位数（0-100）', k_d: '数据日期',
    tb: '项目', c_p: '项目', c_dv: '开发商', c_ar: '区域', c_h: '记录的交付日期', c_pn: '许可证编号', c_s: '评分', yes: '已公布', no: '未公布', np: '未公布',
    faq: '关于{p}期房项目的问题', q1: 'Kolaboro 跟踪{p}的多少个期房项目？', a1: '{dv} 家开发商的 {n} 个有名称项目，数据日期 {d}。每个项目页面都列出事实来源。',
    q2: '{p}有多少期房项目公布了许可证或执照编号？', a2: '在我们读到的来源中，{n} 个中有 {pn} 个（{pp}%）公布了许可证或执照编号。',
    q3: '{p}的期房项目何时交付？', a3: '{n} 个中有 {h} 个公布了交付日期；最常见的年份是 {y} 年（{k} 个项目）。', a3n: '在我们读到的来源中，{n} 个项目都没有公布交付日期。',
    q4: '{p}有多少期房项目已超过交付日期？', a4: '{ov} 个项目记录的交付日期已过且没有完工记录；{mv} 个项目的日期至少推迟过一次。',
    more: '更多关于{p}', l_tr: '透明度排名：{p}', l_buy: '在{p}购买期房：需要核实什么', l_ov: '{p}的逾期交付', l_hy: '{y} 年交付', l_en: '英文市场页面（完整列表和筛选）', l_mt: '透明度评分如何计算', src: '来源：named.json、promises.json 和透明度指数，CC BY 4.0。', crumb: '市场',
    hub_k: '关键数据', hub_q: '问答',
    hp_q1: 'Kolaboro 跟踪多少个期房项目？', hp_a1: '{c} 个国家 {m} 个市场中的 {n} 个有名称项目，来自 {dv} 家开发商。数据日期 {d}。',
    hp_q2: '哪些市场跟踪的项目最多？', hp_a2: '{l}。', hp_q3: '有多少项目公布了许可证或执照编号？', hp_a3: '{n} 个中有 {pn} 个（{pp}%）。',
    hp_q4: '有多少记录的交付日期已经过去？', hp_a4: '{ov} 个项目记录的交付日期已过且没有完工记录（占有交付日期项目的 {op}%）。',
    k_mk: '个市场', k_co: '个国家', k_pl: '个有排名的地点', k_sc: '个有评分的项目', k_top: '中位数最高的地点',
    ht_q1: '哪个地点的透明度评分中位数最高？', ht_a1: '{p}，{n} 个项目的中位数为 {s}/100（数据日期 {d}）。', ht_q2: '哪个地点的透明度评分中位数最低？', ht_a2: '{p}，{n} 个项目的中位数为 {s}/100。',
    ht_q3: '透明度评分衡量什么？', ht_a3: '每个项目公开且可核实的内容（公司、许可证、交付日期、定金保护等），从 0 到 100。它不是对任何公司的评判。',
    k_y: '{y} 年交付', k_y2: '{y} 年及以后交付', hh_q1: '有多少期房项目计划在 {y} 年交付？', hh_a1: '我们跟踪的项目中有 {k} 个记录的交付日期在 {y} 年。',
    hh_q2: '{y} 年的交付主要在哪里？', hh_a2: '{l}。', hh_q3: '有多少交付日期已经过去？', hh_a3: '{ov} 个项目已过记录的交付日期且没有完工记录；{mv} 个项目的日期至少推迟过一次。',
    k_ovp: '有 2 个以上逾期项目的地点', k_ovm: '逾期月数（中位数）', k_ovx: '最长逾期月数',
    ho_q1: '有多少期房项目已超过交付日期？', ho_a1: '{ov} 个项目，中位数为记录日期之后 {m} 个月（数据日期 {d}）。', ho_q2: '逾期的期房项目主要在哪里？', ho_a2: '{l}。',
    ho_q3: '逾期交付是否意味着项目失败？', ho_a3: '不是。这表示记录的日期已过，而我们没有完工记录。许多项目会延期完工；请查看开发商的最新通知和官方登记。',
    k_d5: '拥有 5 个以上项目的开发商', hd_q1: 'Kolaboro 跟踪多少家开发商？', hd_a1: '{dv} 家开发商，{n} 个有名称的期房项目（数据日期 {d}）。', hd_q2: '哪些开发商被跟踪的项目最多？', hd_a2: '{l}。',
    hd_q3: '开发商可以更正自己的页面吗？', hd_a3: '可以。开发商可以通过答复权提交文件回应；更正会注明日期并列在更正页面上。',
    hc_q1: 'Kolaboro 在多少个国家跟踪期房项目？', hc_a1: '{c} 个国家，{n} 个有名称项目（数据日期 {d}）。', hc_q2: '哪些国家跟踪的项目最多？', hc_a2: '{l}。' },
  ar: { crumb_c: 'الدول', l_enc: 'صفحة الدولة بالإنجليزية (السجلات والتأخير والتفاصيل الكاملة)', ch_h: 'مشاريع على الخارطة حسب الدولة', ch_t: 'مشاريع على الخارطة حسب الدولة: {c} دولة، {n} مشروعًا', ch_lead: 'كل دولة نتابع فيها {k} مشاريع على الخارطة بأسمائها على الأقل، مع ما ينشره المطوّرون هناك. بيانات {d}.', c_co: 'الدولة', rk_t: 'تصنيفات وتقارير المشاريع على الخارطة', rk_lead: 'تصنيفات وتقارير محسوبة من بياناتنا، لكل رقم مصدره، بلغتك.', rk: ["تصنيفات الشفافية حسب المكان", "المطوّرون حسب الشفافية، حسب المكان", "مشاريع بترخيص منشور، حسب المكان", "المشاريع حسب نطاق السعر المنشور", "التملّك الحر أو الإيجار للأجانب، حسب الدولة", "مشاريع فوق عتبات تأشيرة الإقامة", "مشاريع قرب المطارات", "تقارير السوق الشهرية حسب المكان", "المشاريع حسب سنة التسليم والمكان", "مواعيد تسليم فائتة حسب المكان", "المشاريع حسب الحي", "ما الذي تغيّر هذا الأسبوع، حسب المكان", "Kolaboro بالأرقام"],
    m_t: 'مشاريع على الخارطة في {p}: المطوّرون ومواعيد التسليم', m_h1: 'مشاريع على الخارطة في {p}', m_lead: 'كل مشروع على الخارطة باسمه نتابعه في {p}، مع ما ينشره مطوّره. حقائق فقط، لكلٍّ منها مصدره في صفحة المشروع. بيانات {d}.',
    m_desc: '{n} مشروعًا على الخارطة في {p} من {dv} مطوّرًا: أرقام التراخيص ومواعيد التسليم المسجّلة ودرجات الشفافية. بيانات {d}.',
    k_n: 'مشروعًا نتابعه', k_dv: 'مطوّرًا', k_pn: 'تنشر رقم ترخيص أو تصريح', k_h: 'تنشر موعد تسليم', k_mv: 'تأجّل موعد تسليمها', k_ov: 'فات موعد تسليمها ولم تكتمل', k_med: 'وسيط درجة الشفافية (0-100)', k_d: 'تاريخ البيانات',
    tb: 'المشاريع', c_p: 'المشروع', c_dv: 'المطوّر', c_ar: 'المنطقة', c_h: 'التسليم المسجّل', c_pn: 'رقم الترخيص', c_s: 'الدرجة', yes: 'منشور', no: 'غير منشور', np: 'غير منشور',
    faq: 'أسئلة عن المشاريع على الخارطة في {p}', q1: 'كم مشروعًا على الخارطة تتابع Kolaboro في {p}؟', a1: '{n} مشروعًا باسمه من {dv} مطوّرًا، بيانات {d}. تذكر صفحة كل مشروع مصادر معلوماتها.',
    q2: 'كم مشروعًا على الخارطة في {p} ينشر رقم ترخيص أو تصريح؟', a2: '{pn} من {n} ({pp}%) تنشر رقم ترخيص أو تصريح في المصادر التي قرأناها.',
    q3: 'متى تُسلَّم المشاريع على الخارطة في {p}؟', a3: '{h} من {n} تنشر موعد تسليم؛ والسنة الأكثر تكرارًا {y} ({k} مشاريع).', a3n: 'لا ينشر أيٌّ من المشاريع الـ{n} موعد تسليم في المصادر التي قرأناها.',
    q4: 'كم مشروعًا على الخارطة في {p} فات موعد تسليمه؟', a4: '{ov} مشاريع فات موعد تسليمها المسجّل دون تسجيل اكتمال، و{mv} تأجّل موعدها مرة واحدة على الأقل.',
    more: 'المزيد عن {p}', l_tr: 'تصنيف الشفافية: {p}', l_buy: 'الشراء على الخارطة في {p}: ما الذي يجب التحقق منه', l_ov: 'مواعيد تسليم فائتة في {p}', l_hy: 'التسليم في {y}', l_en: 'صفحة السوق بالإنجليزية (القائمة الكاملة والمرشّحات)', l_mt: 'كيف تُحسب درجة الشفافية', src: 'المصادر: named.json وpromises.json ومؤشر الشفافية، CC BY 4.0.', crumb: 'الأسواق',
    hub_k: 'أرقام رئيسية', hub_q: 'أسئلة وأجوبة',
    hp_q1: 'كم مشروعًا على الخارطة تتابع Kolaboro؟', hp_a1: '{n} مشروعًا باسمه في {m} سوقًا و{c} دولة، من {dv} مطوّرًا. بيانات {d}.',
    hp_q2: 'ما الأسواق التي فيها أكبر عدد من المشاريع المتابَعة؟', hp_a2: '{l}.', hp_q3: 'كم مشروعًا ينشر رقم ترخيص أو تصريح؟', hp_a3: '{pn} من {n} ({pp}%).',
    hp_q4: 'كم موعد تسليم مسجّلًا قد فات؟', hp_a4: '{ov} مشاريع فات موعد تسليمها المسجّل دون تسجيل اكتمال ({op}% من المشاريع التي لها موعد).',
    k_mk: 'سوقًا', k_co: 'دولة', k_pl: 'مكانًا مصنّفًا', k_sc: 'مشروعًا بدرجة', k_top: 'أعلى وسيط',
    ht_q1: 'أي مكان لديه أعلى وسيط لدرجة الشفافية؟', ht_a1: '{p}، بوسيط {s} من 100 على {n} مشروعًا (بيانات {d}).', ht_q2: 'أي مكان لديه أدنى وسيط لدرجة الشفافية؟', ht_a2: '{p}، بوسيط {s} من 100 على {n} مشروعًا.',
    ht_q3: 'ماذا تقيس درجة الشفافية؟', ht_a3: 'ما هو منشور وقابل للتحقق عن كل مشروع (الشركة، الترخيص، موعد التسليم، حماية الدفعة وغير ذلك)، من 0 إلى 100. وهي ليست حكمًا على أي شركة.',
    k_y: 'التسليم في {y}', k_y2: 'التسليم في {y} أو بعدها', hh_q1: 'كم مشروعًا على الخارطة يُسلَّم في {y}؟', hh_a1: '{k} من المشاريع التي نتابعها لها موعد تسليم مسجّل في {y}.',
    hh_q2: 'أين تتركّز عمليات التسليم في {y}؟', hh_a2: '{l}.', hh_q3: 'كم موعد تسليم قد فات بالفعل؟', hh_a3: '{ov} مشاريع تجاوزت موعدها المسجّل دون تسجيل اكتمال؛ و{mv} تأجّل موعدها مرة واحدة على الأقل.',
    k_ovp: 'أماكن فيها مشروعان متأخران أو أكثر', k_ovm: 'أشهر التأخير (الوسيط)', k_ovx: 'أطول تأخير بالأشهر',
    ho_q1: 'كم مشروعًا على الخارطة فات موعد تسليمه؟', ho_a1: '{ov} مشاريع، بوسيط {m} أشهر بعد الموعد المسجّل (بيانات {d}).', ho_q2: 'أين توجد أكثر المشاريع المتأخرة؟', ho_a2: '{l}.',
    ho_q3: 'هل يعني فوات موعد التسليم أن المشروع فشل؟', ho_a3: 'لا. يعني أن الموعد المسجّل قد مضى وليس لدينا سجلّ بالاكتمال. كثير من المشاريع تكتمل متأخرة؛ راجع آخر إعلان للمطوّر والسجل الرسمي.',
    k_d5: 'مطوّرون لديهم 5 مشاريع أو أكثر', hd_q1: 'كم مطوّرًا تتابع Kolaboro؟', hd_a1: '{dv} مطوّرًا مع {n} مشروعًا على الخارطة باسمه (بيانات {d}).', hd_q2: 'أي المطوّرين لديهم أكثر المشاريع المتابَعة؟', hd_a2: '{l}.',
    hd_q3: 'هل يمكن للمطوّر تصحيح صفحته؟', hd_a3: 'نعم. يمكن للمطوّرين الرد بالمستندات عبر حق الرد؛ وتُنشر التصحيحات مؤرّخة في صفحة التصحيحات.',
    hc_q1: 'في كم دولة تتابع Kolaboro مشاريع على الخارطة؟', hc_a1: '{c} دولة، {n} مشروعًا باسمه (بيانات {d}).', hc_q2: 'ما الدول التي فيها أكبر عدد من المشاريع المتابَعة؟', hc_a2: '{l}.' }
};
const t = (lang, k, v) => { let s = (T[lang] && T[lang][k] != null) ? T[lang][k] : T.en[k]; if (Array.isArray(s)) return s; if (v) s = String(s).replace(/\{(\w+)\}/g, (m, a) => v[a] != null ? v[a] : m); return s.replace(/\.\.(?=\s|$)/g, '.'); };   // "2026 г.."
const th = (lang, k, v) => { const e = {}; for (const a in (v || {})) e[a] = v[a] && v[a].__html ? v[a].__html : esc(v[a]); return t(lang, k, e); };   // template with escaped values; {__html} values pass as HTML
const H = s => ({ __html: s });

// ------------------------------------------------------------------------------------------------ data
let MD = null;
async function mdata(env) {
  const [ix, tri] = await Promise.all([namedData(env), trData(env).catch(() => null)]);
  if (MD && MD.ix === ix && MD.tri === tri && MD.day === new Date().toISOString().slice(0, 10)) return MD;
  const g = new Map();
  for (const x of ix.P) { if (!g.has(x.mk)) g.set(x.mk, []); g.get(x.mk).push(x); }
  const score = id => { const r = tri && tri.rows.get(id); return r ? r.score : null; };
  const stats = L => {
    const n = L.length, devs = new Map(); for (const x of L) if (x.dv) { const k = x.dvs || x.dv; const d = devs.get(k) || { n: x.dv, s: x.dvs, k: 0 }; d.k++; devs.set(k, d); }
    const permit = x => !!x.pn || ((ix.caseBy.get(x.id) || {}).checks || {}).permit === 2;
    const H = L.map(x => [x, handoverOf(ix, x)]).filter(e => e[1]), ys = new Map();
    for (const [, h] of H) { const y = hyear(h.d); if (y) ys.set(y, (ys.get(y) || 0) + 1); }
    const yTop = [...ys.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0] || null;
    const mv = L.filter(x => { const h = (ix.prom[x.id] || []).find(p => p.k === 'handover'); return h && h.mv > 0; }).length;
    const OV = L.map(x => [x, overdueOf(ix, x)]).filter(e => e[1]);
    const lm = L.map(x => lastmod(ix, x)).sort().pop() || String(ix.updated || '').slice(0, 10);
    return { n, devs, dv: devs.size, pn: L.filter(permit).length, permit, h: H.length, ys, yTop, mv, OV, ov: OV.length, med: med(L.map(x => score(x.id))), lm };
  };
  const M = new Map(); for (const [mk, L] of g) if (L.length >= MIN_MK) M.set(slugM(mk), { mk, L, st: stats(L) });
  const CG = new Map(); for (const x of ix.P) if (x.co) { const c = CO_AL[x.co] || x.co; if (!CG.has(c)) CG.set(c, []); CG.get(c).push(x); }
  const C = new Map(); for (const [co, L] of CG) if (L.length >= MIN_MK) C.set(slugA(co), { kind: 'c', co, s: slugA(co), mk: co, L, st: stats(L) });
  MD = { ix, tri, g, M, C, score, stats, all: stats(ix.P), day: new Date().toISOString().slice(0, 10), body: new Map(), d: String(ix.updated || '').slice(0, 10) };
  return MD;
}
const findMk = (D, key) => { const k = String(key || '').toLowerCase(); let m = D.M.get(k); if (m) return m; try { m = D.M.get(slugM(decodeURIComponent(k))); } catch (e) { m = null; } return m || null; };

// ------------------------------------------------------------------------------------------------ shared HTML
export const CSS = '<style id="k29i-css">.k29-kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));border:1px solid var(--k-line,#d5d3cc);border-radius:var(--k-r-lg,14px);overflow:hidden;background:var(--k-surface,#fff);margin:16px 0}' +
  '.k29-kv div{padding:12px 16px;border-inline-end:1px solid var(--k-line,#d5d3cc);border-bottom:1px solid var(--k-line,#d5d3cc)}.k29-kv b{display:block;font-size:var(--k-fs-xl,24px);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.k29-kv span{font-size:var(--k-fs-xs,13px);color:var(--k-muted,#5f5c55)}' +
  '.k29 .k-table-wrap{overflow-x:auto;margin:12px 0 24px}.k29 td{vertical-align:top}.k29-l{display:flex;flex-wrap:wrap;gap:8px 16px;padding:0;list-style:none;margin:12px 0}.k29-l a{display:inline-flex;align-items:center;min-height:44px}.k29-q{padding:28px 0;border-top:1px solid var(--k-line,#d5d3cc)}.k29-q h2{font-size:1.25rem;margin:0 0 12px}.k29-k h2{font-size:1rem;margin:16px 0 0}</style>';
const kvHtml = items => '<div class="k29-kv">' + items.map(([v, l]) => '<div><b>' + v + '</b><span>' + esc(l) + '</span></div>').join('') + '</div>';
const faqHtml = (title, Q) => '<h2 id="questions">' + esc(title) + '</h2><div class="k-disc">' + Q.map(([q, a]) => '<details><summary>' + esc(q) + '</summary><p>' + esc(a) + '</p></details>').join('') + '</div>';
const faqLd = Q => ({ '@type': 'FAQPage', mainEntity: Q.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
const list = (lang, items) => { try { return new Intl.ListFormat(LOC[lang] || 'en-GB', { style: 'long', type: 'conjunction' }).format(items); } catch (e) { return items.join(', '); } };

// ------------------------------------------------------------------------------------------------ item 88: translated market file
function marketPage(D, m, lang) {
  const { mk, L, st } = m, ix = D.ix, isC = m.kind === 'c', p = isC ? coName(m.co, lang) : mkName(mk, lang), co = L[0].co, d = fd(D.d, lang), path = isC ? '/countries/' + m.s + '/' : '/m/' + slugM(mk) + '/';
  const v = { p, n: nf(lang, st.n), dv: nf(lang, st.dv), d };
  const title = t(lang, 'm_t', v), desc = t(lang, 'm_desc', v);
  const TRP = TR_PLACES.filter(P => !P.coi && (isC ? (CO_AL[P.co] || P.co) === m.co : P.m.includes(mk)) && D.tri && D.tri.places.get(P.s) && D.tri.places.get(P.s).n);
  const BUY = BUY_PLACES.filter(P => isC ? (CO_AL[P.c] || P.c) === m.co : (TRP.some(q => q.s === P.s) || slugA(mk) === P.s));
  const rows = L.slice().sort((a, b) => (D.score(b.id) ?? -1) - (D.score(a.id) ?? -1) || a.n.localeCompare(b.n)).map(x => {
    const h = handoverOf(ix, x), s = D.score(x.id);
    return '<tr><td data-label="' + esc(t(lang, 'c_p')) + '"><a href="' + pre(lang) + '/projects/' + x.s + '/">' + bdi(x.n) + '</a></td><td data-label="' + esc(t(lang, 'c_dv')) + '">' +
      (x.dv ? (x.dvs && ix.devs.has(x.dvs) ? '<a href="' + pre(lang) + '/developers/' + x.dvs + '/">' + bdi(x.dv) + '</a>' : bdi(x.dv)) : esc(t(lang, 'np'))) + '</td><td data-label="' + esc(t(lang, 'c_ar')) + '">' + (x.ar && x.ar !== x.mk ? bdi(placeName(x.ar, lang)) : '') +
      '</td><td data-label="' + esc(t(lang, 'c_h')) + '">' + (h ? bdi(hdisp(h.d, lang)) : esc(t(lang, 'np'))) + '</td><td data-label="' + esc(t(lang, 'c_pn')) + '">' + esc(st.permit(x) ? t(lang, 'yes') : t(lang, 'no')) + '</td><td data-label="' + esc(t(lang, 'c_s')) + '">' + (s == null ? '-' : nf(lang, s)) + '</td></tr>';
  }).join('');
  const Q = [[t(lang, 'q1', v), t(lang, 'a1', v)], [t(lang, 'q2', v), t(lang, 'a2', Object.assign({}, v, { pn: nf(lang, st.pn), pp: nf(lang, pct(st.pn, st.n)) }))],
    [t(lang, 'q3', v), st.h && st.yTop ? t(lang, 'a3', Object.assign({}, v, { h: nf(lang, st.h), y: st.yTop[0], k: nf(lang, st.yTop[1]) })) : t(lang, 'a3n', v)],
    [t(lang, 'q4', v), t(lang, 'a4', Object.assign({}, v, { ov: nf(lang, st.ov), mv: nf(lang, st.mv) }))]];
  const links = [];
  for (const P of TRP) links.push('<a href="' + pre(lang) + '/rankings/transparency/' + P.s + '/">' + th(lang, 'l_tr', { p: mkName(P.n, lang) }) + '</a>');
  if (isC) for (const g of [...new Set(L.map(x => x.mk))].map(k => D.M.get(slugM(k))).filter(Boolean).sort((a, b) => b.L.length - a.L.length)) links.push('<a href="' + pre(lang) + '/m/' + slugM(g.mk) + '/">' + bdi(mkName(g.mk, lang)) + ' (' + nf(lang, g.L.length) + ')</a>');
  for (const P of BUY) links.push('<a href="' + pre(lang) + '/guides/buying-off-plan/' + P.s + '/">' + th(lang, 'l_buy', { p: isC ? mkName(P.m[0], lang) : mkName(mk, lang) }) + '</a>');
  if (!isC && st.ov >= OV_MIN) links.push('<a href="' + pre(lang) + '/handover/overdue/' + slugA(mk) + '/">' + th(lang, 'l_ov', { p }) + '</a>');
  if (!isC) for (const [y, k] of [...st.ys.entries()].filter(e => e[1] >= 3).sort((a, b) => a[0] - b[0]).slice(0, 4)) links.push('<a href="' + pre(lang) + '/handover/' + y + '/' + slugA(mk) + '/">' + th(lang, 'l_hy', { y }) + '</a>');
  links.push('<a href="' + path + '" hreflang="en">' + esc(t(lang, isC ? 'l_enc' : 'l_en')) + '</a>', '<a href="' + pre(lang) + '/methods/transparency-score/">' + esc(t(lang, 'l_mt')) + '</a>');
  const cr = [['Kolaboro', pre(lang) + '/'], isC ? [t(lang, 'crumb_c'), pre(lang) + '/countries/'] : [t(lang, 'crumb'), pre(lang) + '/projects/'], [p, pre(lang) + path]];
  const body = '<div class="k29"><section class="k-sec"><div class="k-wrap"><div class="k-phead"><p class="k-crumb">' + cr.map((c, i) => i < cr.length - 1 ? '<a href="' + c[1] + '">' + esc(c[0]) + '</a>' : '<span>' + bdi(c[0]) + '</span>').join(' / ') + '</p>' +
    '<h1>' + th(lang, 'm_h1', { p: H(bdi(p)) }) + '</h1><p class="lead">' + th(lang, 'm_lead', { p: H(bdi(p)), d }) + '</p></div>' +
    kvHtml([[nf(lang, st.n), t(lang, 'k_n')], [nf(lang, st.dv), t(lang, 'k_dv')], [nf(lang, st.pn) + ' (' + nf(lang, pct(st.pn, st.n)) + '%)', t(lang, 'k_pn')], [nf(lang, st.h) + ' (' + nf(lang, pct(st.h, st.n)) + '%)', t(lang, 'k_h')],
      [nf(lang, st.mv), t(lang, 'k_mv')], [nf(lang, st.ov), t(lang, 'k_ov')], [st.med == null ? '-' : nf(lang, st.med), t(lang, 'k_med')], [esc(d), t(lang, 'k_d')]]) +
    '<h2 id="projects">' + esc(t(lang, 'tb')) + '</h2><div class="k-table-wrap"><table class="k-table k-table--dense k-table--stack"><thead><tr>' + ['c_p', 'c_dv', 'c_ar', 'c_h', 'c_pn', 'c_s'].map(k => '<th scope="col">' + esc(t(lang, k)) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
    faqHtml(t(lang, 'faq', { p }), Q) + (BPL.some(P => P.mk === mk) ? buyerLinks(lang, mk).replace('<section class="k29-q"><div class="k-wrap wrap">', '').replace('</div></section>', '') : '') + '<h2 id="more">' + th(lang, 'more', { p: H(bdi(p)) }) + '</h2><ul class="k29-l">' + links.map(a => '<li>' + a + '</li>').join('') + '</ul><p class="k-small k-muted">' + esc(t(lang, 'src')) + ' <a href="/data/named.json">named.json</a> · <a href="/data/promises.json">promises.json</a></p></div></section></div>';
  const url = ORIGIN + pre(lang) + path;
  const ld = [{ '@type': 'CollectionPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: st.lm, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' },
      about: isC ? { '@type': 'Country', name: p, alternateName: p !== m.co ? m.co : undefined } : { '@type': 'Place', name: p, alternateName: p !== mk ? mk : undefined, containedInPlace: co ? { '@type': 'Country', name: coName(co, lang) } : undefined }, mainEntity: { '@type': 'ItemList', numberOfItems: L.length, itemListElement: L.slice(0, 50).map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: ORIGIN + pre(lang) + '/projects/' + x.s + '/', name: x.n })) } },
    { '@type': 'BreadcrumbList', itemListElement: cr.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: ORIGIN + c[1] })) }, faqLd(Q)];
  return { path, title, desc, body, ld, lm: st.lm };
}
// English /m/<market>/: hreflang alternates when the market has translated files (index.js appends them to <head>)
export async function mAlternates(env, key) {
  let D; try { D = await mdata(env); } catch (e) { return ''; } const m = findMk(D, key); if (!m) return '';
  const p = '/m/' + slugM(m.mk) + '/'; return LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + p + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + p + '">';
}
// is there a translated market file? (for links from other pages)
export function mHas(mk) { return !!(MD && MD.M.has(slugM(mk))); }
function mSitemap(D) {
  const xe = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const urls = [...D.M.values()].flatMap(m => { const p = '/m/' + slugM(m.mk) + '/'; return LANGS.map(l => '<url><loc>' + xe(ORIGIN + pre(l) + p) + '</loc><lastmod>' + m.st.lm + '</lastmod>' + LANGS.map(a => '<xhtml:link rel="alternate" hreflang="' + a + '" href="' + xe(ORIGIN + pre(a) + p) + '"/>').join('') + '<xhtml:link rel="alternate" hreflang="x-default" href="' + xe(ORIGIN + p) + '"/></url>'); });
  for (const p of ['/countries/', '/rankings/'].concat([...D.C.values()].map(c => '/countries/' + c.s + '/'))) { const c = D.C.get(p.split('/')[2]), lm = c ? c.st.lm : D.d; for (const l of LANGS) urls.push('<url><loc>' + ORIGIN + pre(l) + p + '</loc><lastmod>' + lm + '</lastmod>' + LANGS.map(a => '<xhtml:link rel="alternate" hreflang="' + a + '" href="' + ORIGIN + pre(a) + p + '"/>').join('') + '<xhtml:link rel="alternate" hreflang="x-default" href="' + ORIGIN + p + '"/></url>'); }
  for (const g of GROUPS) { const p = '/guides/buyers-from/' + g + '/', lm = BPL.map(P => (D.M.get(slugM(P.mk)) || { st: { lm: '' } }).st.lm).concat(['2026-11-14']).sort().pop(); for (const l of LANGS) urls.push('<url><loc>' + ORIGIN + pre(l) + p + '</loc><lastmod>' + lm + '</lastmod>' + LANGS.map(a => '<xhtml:link rel="alternate" hreflang="' + a + '" href="' + ORIGIN + pre(a) + p + '"/>').join('') + '<xhtml:link rel="alternate" hreflang="x-default" href="' + ORIGIN + p + '"/></url>'); }
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + urls.join('\n') + '\n</urlset>\n';
}

// ------------------------------------------------------------------------------------------------ items 93 and 95: hub figures and Q&A
const HUB_RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(projects|rankings\/transparency|handover|handover\/overdue)\/$/;   // /countries/ and /developers/ count all tracked cases (incl. anonymous ones): left out so the figures never disagree
export const hubMatch = p => HUB_RX.test(p);
function hubParts(D, kind, lang) {
  const A = D.all, ix = D.ix, d = fd(D.d, lang), N = n => nf(lang, n);
  if (kind === 'projects') {
    const cos = new Set(ix.P.map(x => CO_AL[x.co] || x.co).filter(Boolean)), top = [...D.g.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 5);
    const k = [[N(A.n), t(lang, 'k_n')], [N(D.g.size), t(lang, 'k_mk')], [N(cos.size), t(lang, 'k_co')], [N(A.dv), t(lang, 'k_dv')], [N(A.pn) + ' (' + N(pct(A.pn, A.n)) + '%)', t(lang, 'k_pn')], [N(A.h) + ' (' + N(pct(A.h, A.n)) + '%)', t(lang, 'k_h')], [N(A.mv), t(lang, 'k_mv')], [N(A.ov), t(lang, 'k_ov')], [A.med == null ? '-' : N(A.med), t(lang, 'k_med')], [esc(d), t(lang, 'k_d')]];
    const Q = [[t(lang, 'hp_q1'), t(lang, 'hp_a1', { n: N(A.n), m: N(D.g.size), c: N(cos.size), dv: N(A.dv), d })], [t(lang, 'hp_q2'), t(lang, 'hp_a2', { l: list(lang, top.map(([m, L]) => mkName(m, lang) + ' (' + N(L.length) + ')')) })],
      [t(lang, 'hp_q3'), t(lang, 'hp_a3', { pn: N(A.pn), n: N(A.n), pp: N(pct(A.pn, A.n)) })], [t(lang, 'hp_q4'), t(lang, 'hp_a4', { ov: N(A.ov), op: N(pct(A.ov, A.h)) })]];
    return { k, Q };
  }
  if (kind === 'rankings/transparency') {
    if (!D.tri) return null;
    const R = [...D.tri.places.values()].filter(pl => !pl.P.coi && pl.ranked && pl.med != null).sort((a, b) => b.med - a.med || b.n - a.n);
    if (!R.length) return null; const hi = R[0], lo = R[R.length - 1], scored = new Set(); for (const pl of R) for (const r of pl.L) scored.add(r.id);
    const k = [[N(R.length), t(lang, 'k_pl')], [N(scored.size), t(lang, 'k_sc')], [esc(mkName(hi.P.n, lang)) + ' · ' + N(hi.med), t(lang, 'k_top')], [esc(d), t(lang, 'k_d')]];
    const Q = [[t(lang, 'ht_q1'), t(lang, 'ht_a1', { p: mkName(hi.P.n, lang), s: N(hi.med), n: N(hi.n), d })], [t(lang, 'ht_q2'), t(lang, 'ht_a2', { p: mkName(lo.P.n, lang), s: N(lo.med), n: N(lo.n) })], [t(lang, 'ht_q3'), t(lang, 'ht_a3')]];
    return { k, Q };
  }
  if (kind === 'handover') {
    const y0 = new Date().getUTCFullYear(), Y = [y0, y0 + 1, y0 + 2], cnt = y => A.ys.get(y) || 0, later = [...A.ys.entries()].filter(e => e[0] >= y0 + 3).reduce((a, e) => a + e[1], 0), yq = y0 + 1;
    const byMk = [...D.g.entries()].map(([m, L]) => [m, L.filter(x => { const h = handoverOf(ix, x); return h && hyear(h.d) === yq; }).length]).filter(e => e[1]).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const k = [[N(A.h), t(lang, 'k_h')], ...Y.map(y => [N(cnt(y)), t(lang, 'k_y', { y })]), [N(later), t(lang, 'k_y2', { y: y0 + 3 })], [N(A.ov), t(lang, 'k_ov')], [esc(d), t(lang, 'k_d')]];
    const Q = [[t(lang, 'hh_q1', { y: yq }), t(lang, 'hh_a1', { k: N(cnt(yq)), y: yq })], ...(byMk.length ? [[t(lang, 'hh_q2', { y: yq }), t(lang, 'hh_a2', { l: list(lang, byMk.map(([m, n]) => mkName(m, lang) + ' (' + N(n) + ')')) })]] : []),
      [t(lang, 'hh_q3'), t(lang, 'hh_a3', { ov: N(A.ov), mv: N(A.mv) })]];
    return { k, Q };
  }
  if (kind === 'handover/overdue') {
    if (!A.ov) return null;
    const ms = A.OV.map(e => e[1].m), mx = A.OV.slice().sort((a, b) => b[1].m - a[1].m)[0], byMk = new Map(); for (const [x] of A.OV) byMk.set(x.mk, (byMk.get(x.mk) || 0) + 1);
    const top = [...byMk.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const k = [[N(A.ov), t(lang, 'k_ov')], [N([...byMk.values()].filter(v => v >= OV_MIN).length), t(lang, 'k_ovp')], [N(med(ms)), t(lang, 'k_ovm')], [N(mx[1].m), t(lang, 'k_ovx')], [esc(d), t(lang, 'k_d')]];
    const Q = [[t(lang, 'ho_q1'), t(lang, 'ho_a1', { ov: N(A.ov), m: N(med(ms)), d })], [t(lang, 'ho_q2'), t(lang, 'ho_a2', { l: list(lang, top.map(([m, n]) => mkName(m, lang) + ' (' + N(n) + ')')) })], [t(lang, 'ho_q3'), t(lang, 'ho_a3')]];
    return { k, Q };
  }
  if (kind === 'developers') {
    const DV = [...ix.devs.values()].sort((a, b) => b.ids.length - a.ids.length || a.n.localeCompare(b.n)), d5 = DV.filter(v => v.ids.length >= 5).length;
    const k = [[N(ix.devs.size), t(lang, 'k_dv')], [N(d5), t(lang, 'k_d5')], [N(A.n), t(lang, 'k_n')], [esc(d), t(lang, 'k_d')]];
    const Q = [[t(lang, 'hd_q1'), t(lang, 'hd_a1', { dv: N(ix.devs.size), n: N(A.n), d })], [t(lang, 'hd_q2'), t(lang, 'hd_a2', { l: list(lang, DV.slice(0, 5).map(v => v.n + ' (' + N(v.ids.length) + ')')) })], [t(lang, 'hd_q3'), t(lang, 'hd_a3')]];
    return { k, Q };
  }
  if (kind === 'countries') {
    const C = new Map(); for (const x of ix.P) if (x.co) C.set(x.co, (C.get(x.co) || 0) + 1);
    const top = [...C.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const k = [[N(C.size), t(lang, 'k_co')], [N(A.n), t(lang, 'k_n')], [N([...C.values()].filter(v => v >= 10).length), t(lang, 'k_co') + ' (10+)'], [esc(d), t(lang, 'k_d')]];
    const Q = [[t(lang, 'hc_q1'), t(lang, 'hc_a1', { c: N(C.size), n: N(A.n), d })], [t(lang, 'hc_q2'), t(lang, 'hc_a2', { l: list(lang, top.map(([c, n]) => coName(c, lang) + ' (' + N(n) + ')')) })]];
    return { k, Q };
  }
  return null;
}
export async function hubInject(req, u, env, r, fix) {
  const m = HUB_RX.exec(u.pathname); if (!m || req.method !== 'GET' || !r || r.status !== 200 || !/text\/html/.test(r.headers.get('content-type') || '')) return r;
  const lang = m[1] || 'en', kind = m[2];
  let D; try { D = await mdata(env); } catch (e) { return r; }
  const key = lang + '|' + kind; let pt = D.body.get(key);
  if (pt === undefined) { try { pt = hubParts(D, kind, lang); } catch (e) { pt = null; } D.body.set(key, pt); }
  if (!pt) return r;
  const fx = lang === 'ru' && fix ? fix : (h => h);
  const top = CSS + '<div class="k29-k"><h2>' + esc(t(lang, 'hub_k')) + '</h2>' + kvHtml(pt.k) + '</div>', top2 = fx(top);
  const qa = '<section class="k29-q" id="hub-questions"><div class="k-wrap wrap">' + faqHtml(t(lang, 'hub_q'), pt.Q).replace('<h2 id="questions">', '<h2>') + '</div></section><script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@graph': [faqLd(pt.Q)] }).replace(/</g, '\\u003c') + '</script>';
  let done = false;
  return new HTMLRewriter()
    .on('p.lead', { element(e) { if (!done) { done = true; e.after(top2, { html: true }); } } })
    .on('main', { element(e) { e.onEndTag(tg => { tg.before(fx((done ? '' : top) + qa), { html: true }); }); } })
    .transform(r);
}

// ------------------------------------------------------------------------------------------------ item 97: questions answered from data
let QC = null;
function questions(D) {
  if (QC && QC.D === D) return QC.q;
  const ix = D.ix, d = D.d, Q = [], add = (q, a, url, scope) => Q.push({ q, a, url, scope, date: d });
  const pl = n => n === 1 ? '' : 's';
  const lstP = (L, f) => L.slice(0, 10).map(f).join('; ') + (L.length > 10 ? '; and ' + (L.length - 10) + ' more' : '');
  for (const { mk, L, st } of [...D.M.values()].sort((a, b) => b.L.length - a.L.length)) {
    const url = ORIGIN + '/m/' + slugM(mk) + '/', where = mk + (L[0].co && L[0].co !== mk ? ', ' + L[0].co : '');
    add('How many off-plan projects in ' + mk + ' does Kolaboro track?', st.n + ' named off-plan projects in ' + where + ' from ' + st.dv + ' developer' + pl(st.dv) + '.', url, mk);
    const P = L.filter(st.permit);
    add('Which off-plan projects in ' + mk + ' publish a permit or licence number?', P.length ? P.length + ' of ' + st.n + ': ' + lstP(P, x => x.n + (x.pn ? ' (' + x.pn + ')' : '')) + '.' : 'None of the ' + st.n + ' projects publishes a permit or licence number in the sources we read.', url, mk);
    if (st.h) add('When are off-plan projects in ' + mk + ' due to be handed over?', st.h + ' of ' + st.n + ' publish a handover date: ' + [...st.ys.entries()].sort((a, b) => a[0] - b[0]).map(([y, k]) => y + ': ' + k).join(', ') + '.', url, mk);
    add('Which off-plan projects in ' + mk + ' are past their handover date?', st.ov ? st.ov + ' project' + pl(st.ov) + ' with a handover date on record that has passed without a recorded completion: ' + lstP(st.OV.slice().sort((a, b) => b[1].m - a[1].m), ([x, o]) => x.n + ' (' + o.m + ' months past ' + hdisp(o.d, 'en') + ')') + '.' : 'None: no handover date on record has passed without a recorded completion.', url, mk);
    const dv = [...st.devs.values()].sort((a, b) => b.k - a.k || a.n.localeCompare(b.n)).slice(0, 5);
    if (dv.length) add('Which developers have the most off-plan projects in ' + mk + '?', dv.map(v => v.n + ' (' + v.k + ')').join(', ') + '.', url, mk);
    const sc = L.map(x => [x, D.score(x.id)]).filter(e => e[1] != null).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (sc.length) add('Which off-plan projects in ' + mk + ' publish the most checkable facts?', 'Highest transparency scores (0-100, what is published and checkable, not a verdict): ' + sc.map(([x, s]) => x.n + ' ' + s).join(', ') + '. Median in ' + mk + ': ' + st.med + '.', url, mk);
  }
  const C = new Map(); for (const x of ix.P) if (x.co) { if (!C.has(x.co)) C.set(x.co, []); C.get(x.co).push(x); }
  const cslug = c => slugA(c);
  for (const [co, L] of [...C.entries()].filter(e => e[1].length >= MIN_MK).sort((a, b) => b[1].length - a[1].length)) {
    const st = D.stats(L), url = ORIGIN + '/countries/' + cslug(co) + '/', mks = [...new Set(L.map(x => x.mk))];
    add('How many off-plan projects in ' + co + ' does Kolaboro track?', st.n + ' named projects in ' + mks.length + ' market' + pl(mks.length) + ' (' + mks.slice(0, 8).join(', ') + (mks.length > 8 ? ', ...' : '') + ') from ' + st.dv + ' developer' + pl(st.dv) + '.', url, co);
    add('What share of off-plan projects in ' + co + ' publish a permit or licence number?', st.pn + ' of ' + st.n + ' (' + pct(st.pn, st.n) + '%) in the sources we read.', url, co);
    add('How many off-plan projects in ' + co + ' are past their handover date?', st.ov + ' of the ' + st.h + ' with a handover date on record; the date moved later at least once for ' + st.mv + '.', url, co);
  }
  for (const v of [...ix.devs.values()].filter(v => v.ids.length >= MIN_MK).sort((a, b) => b.ids.length - a.ids.length)) {
    const L = v.ids.map(id => ix.byId.get(id)).filter(Boolean), st = D.stats(L), url = ORIGIN + '/developers/' + v.s + '/';
    add('Which off-plan projects does ' + v.n + ' have?', L.length + ' tracked: ' + lstP(L, x => { const h = handoverOf(ix, x); return x.n + ' (' + x.mk + (h ? ', handover ' + hdisp(h.d, 'en') : '') + ')'; }) + '.', url, v.n);
    add('Does ' + v.n + ' deliver on time?', 'Of ' + st.h + ' projects with a handover date on record, ' + st.ov + ' are past it without a recorded completion and ' + st.mv + ' saw the date move later at least once. The developer page lists promised against actual dates where a completion is on record.', url, v.n);
  }
  QC = { D, q: Q }; return Q;
}
function questionsMd(D) {
  const Q = questions(D), L = ['# Kolaboro: questions about off-plan projects, answered from our data', '', '> ' + Q.length + ' questions about markets, countries and developers with at least ' + MIN_MK + ' named projects. Each answer is computed from the published data (no estimates) and links the page that shows the facts with their sources. Data of ' + D.d + '. CC BY 4.0, attribute "Kolaboro". JSON: ' + ORIGIN + '/answers/questions.json', ''];
  let scope = null; for (const q of Q) { if (q.scope !== scope) { scope = q.scope; L.push('## ' + scope, ''); } L.push('### ' + q.q, '', q.a + ' Source: ' + q.url + ' (data of ' + q.date + ')', ''); }
  return L.join('\n');
}


// ------------------------------------------------------------------------------------------------ item 89: buyers by nationality
// One page per buyer group (Russia, mainland China, the Gulf states), not one per place and nationality: what changes with the buyer's
// nationality in the four places where these buyers look most (Dubai, Bali, Phuket, Cyprus), with the official text read on the date
// shown, and the same four places compared from our data. Rules that are the same for every foreigner are linked to the buying guides.
export const BUYER_RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?guides\/buyers-from(?:\/(russia|china|gulf))?(\/?)$/;
const GROUPS = ['russia', 'china', 'gulf'];
const BPL = [{ s: 'dubai', mk: 'Dubai', g: 'dubai' }, { s: 'bali', mk: 'Bali', g: 'bali' }, { s: 'phuket', mk: 'Phuket', g: 'phuket' }, { s: 'cyprus', mk: 'Cyprus', g: 'cyprus' }];
const BSRC = {
  ae7: { n: 'Dubai Law No. 7 of 2006 (Real Property Registration), Article 4', u: 'https://dlp.dubai.gov.ae/Legislation%20Reference/2006/Law%20No.%20(7)%20of%202006.html', d: '2026-11-14' },
  pp18: { n: 'Government Regulation No. 18 of 2021, Articles 52, 69, 71 and 72', u: 'https://www.peraturan.go.id/files3/pp-no-18-tahun-2021_asli.pdf', d: '2026-11-03' },
  th: { n: 'Condominium Act B.E. 2522, sections 19 bis and 19 ter', u: 'https://www.dol.go.th/media/716929789247754240/migration/2025/10/6Wp3Tk7hgK5HdDRuvYXGcNsi.pdf', d: '2026-11-14' },
  eu5b: { n: 'European Commission: FAQ on Article 5b of Council Regulation 833/2014 (deposits)', u: 'https://finance.ec.europa.eu/system/files/2022-10/faqs-sanctions-russia-deposits_en.pdf', d: '2026-11-14' },
  safe: { n: 'SAFE Beijing branch: current account FAQ (notice Huifa [2016] No. 36)', u: 'https://www.safe.gov.cn/beijing/file/file/20191127/b29df7fa63504266b9ccb23429185d40.pdf', d: '2026-11-14' }
};
// [rule key, source key] per group and place; null: nothing changes with this nationality there (the guide covers it)
const BRULE = {
  russia: { home: null, dubai: ['ae_for', 'ae7'], bali: ['id_for', 'pp18'], phuket: ['th_for', 'th'], cyprus: ['cy_ru', 'eu5b'] },
  china: { home: ['cn_safe', 'safe'], dubai: ['ae_for', 'ae7'], bali: ['id_for', 'pp18'], phuket: ['th_for', 'th'], cyprus: null },
  gulf: { home: null, dubai: ['ae_gcc', 'ae7'], bali: ['id_for', 'pp18'], phuket: ['th_for', 'th'], cyprus: null }
};
const BT = {
  en: { g_russia: 'Russia', g_china: 'mainland China', g_gulf: 'the Gulf states (GCC)', t: 'Buying off-plan abroad from {g}: Dubai, Bali, Phuket, Cyprus', h1: 'Buying off-plan abroad as a buyer from {g}',
    lead: 'What changes with your nationality when you buy off-plan in the four places where buyers from {g} look most, from the official texts, and how the projects there compare in our data. Not legal advice; rules change, check with a lawyer.',
    desc: 'Rules that depend on your nationality for buyers from {g} in Dubai, Bali, Phuket and Cyprus, from the official texts, with project figures from our data of {d}.',
    home: 'Before you send money from home', same: 'The same rules as for every foreign buyer apply here; see the guide.', rules: 'Rules by place', data: 'The four places in our data', c_pl: 'Place', c_n: 'Projects', c_pn: 'Permit number published', c_ov: 'Past handover date', c_m: 'Median score',
    src: 'Source: {s}, read {d}.', guide: 'Buying off-plan in {p}: what to check', mk: 'All projects in {p}', other: 'Other buyer groups', hub: 'Buying off-plan abroad by nationality', hubl: 'What changes with your nationality in Dubai, Bali, Phuket and Cyprus, from the official texts.', reviewed: 'Rules last read {d}. Not legal advice.',
    ae_gcc: 'In Dubai, nationals of the UAE and of the other Gulf Cooperation Council states (and companies fully owned by them) may own property anywhere in the emirate. Buyers of other nationalities may only own in the areas the Ruler designates, freehold or as usufruct or leasehold of up to 99 years.',
    ae_for: 'In Dubai, buyers who are not nationals of the UAE or another GCC state may only own in the areas the Ruler designates for them: freehold, or usufruct or leasehold of up to 99 years. Check that the project is in such an area.',
    id_for: 'In Bali, foreigners cannot hold freehold title (Hak Milik). A foreign individual with an immigration document can hold a right of use (Hak Pakai) on a house or an apartment unit.',
    th_for: 'In Phuket, foreigners can own a condominium unit freehold while units owned by foreigners stay within 49% of the building\'s floor area, and must show that the purchase money was brought into Thailand in foreign currency or paid from a foreign-currency account. Land and houses cannot be owned freehold by foreigners.',
    cy_ru: 'In Cyprus, EU sanctions forbid banks in the EU from accepting deposits of more than EUR 100,000 in total per bank from Russian nationals, unless they also hold the nationality of, or a residence permit in, an EU or EEA country or Switzerland. Agree with your bank and lawyer how the purchase money will be paid before you sign.',
    cn_safe: 'Under the rules of the State Administration of Foreign Exchange (notice Huifa [2016] No. 36), foreign currency that individuals in mainland China buy within the yearly quota of USD 50,000 may not be used to buy property abroad. Ask your bank in China and your lawyer how the purchase can be paid lawfully before you sign.' },
  es: { g_russia: 'Rusia', g_china: 'China continental', g_gulf: 'los países del Golfo (CCG)', t: 'Comprar sobre plano desde {g}: Dubái, Bali, Phuket, Chipre', h1: 'Comprar sobre plano en el extranjero desde {g}',
    lead: 'Qué cambia según tu nacionalidad al comprar sobre plano en los cuatro lugares que más miran los compradores de {g}, según los textos oficiales, y cómo se comparan allí los proyectos en nuestros datos. No es asesoramiento legal; las normas cambian, consulta a un abogado.',
    desc: 'Normas que dependen de tu nacionalidad para compradores de {g} en Dubái, Bali, Phuket y Chipre, según los textos oficiales, con cifras de proyectos de nuestros datos del {d}.',
    home: 'Antes de enviar dinero desde tu país', same: 'Aquí se aplican las mismas normas que a cualquier comprador extranjero; consulta la guía.', rules: 'Normas por lugar', data: 'Los cuatro lugares en nuestros datos', c_pl: 'Lugar', c_n: 'Proyectos', c_pn: 'Nº de licencia publicado', c_ov: 'Entrega vencida', c_m: 'Puntuación mediana',
    src: 'Fuente: {s}, leída el {d}.', guide: 'Comprar sobre plano en {p}: qué comprobar', mk: 'Todos los proyectos en {p}', other: 'Otros grupos de compradores', hub: 'Comprar sobre plano en el extranjero según tu nacionalidad', hubl: 'Qué cambia según tu nacionalidad en Dubái, Bali, Phuket y Chipre, según los textos oficiales.', reviewed: 'Normas leídas por última vez el {d}. No es asesoramiento legal.',
    ae_gcc: 'En Dubái, los nacionales de los EAU y de los demás países del Consejo de Cooperación del Golfo (y las empresas totalmente suyas) pueden ser propietarios en cualquier parte del emirato. Los compradores de otras nacionalidades solo pueden serlo en las zonas que designa el Gobernante, en plena propiedad o como usufructo o arrendamiento de hasta 99 años.',
    ae_for: 'En Dubái, quien no es nacional de los EAU ni de otro país del CCG solo puede ser propietario en las zonas que designa el Gobernante: en plena propiedad, o como usufructo o arrendamiento de hasta 99 años. Comprueba que el proyecto está en una de esas zonas.',
    id_for: 'En Bali, los extranjeros no pueden tener plena propiedad (Hak Milik). Una persona extranjera con documento de inmigración puede tener un derecho de uso (Hak Pakai) sobre una casa o una unidad de apartamento.',
    th_for: 'En Phuket, los extranjeros pueden tener un apartamento en plena propiedad mientras las unidades de extranjeros no superen el 49 % de la superficie del edificio, y deben acreditar que el dinero de la compra entró en Tailandia en divisa o salió de una cuenta en divisa. Los extranjeros no pueden tener terreno ni casas en plena propiedad.',
    cy_ru: 'En Chipre, las sanciones de la UE prohíben a los bancos de la UE aceptar depósitos de más de 100.000 EUR en total por banco de nacionales rusos, salvo que tengan también la nacionalidad o un permiso de residencia de un país de la UE o del EEE o de Suiza. Acuerda con tu banco y tu abogado cómo se pagará la compra antes de firmar.',
    cn_safe: 'Según las normas de la Administración Estatal de Divisas (aviso Huifa [2016] n.º 36), la divisa que compran las personas en China continental dentro del cupo anual de 50.000 USD no puede usarse para comprar inmuebles en el extranjero. Pregunta a tu banco en China y a tu abogado cómo puede pagarse la compra legalmente antes de firmar.' },
  fr: { g_russia: 'Russie', g_china: 'Chine continentale', g_gulf: 'la région du Golfe (CCG)', t: 'Acheter sur plan depuis {g} : Dubaï, Bali, Phuket, Chypre', h1: 'Acheter sur plan à l’étranger en venant de {g}',
    lead: 'Ce qui change selon votre nationalité quand vous achetez sur plan dans les quatre lieux que regardent le plus les acheteurs de {g}, d’après les textes officiels, et comment les projets s’y comparent dans nos données. Pas un conseil juridique ; les règles changent, consultez un avocat.',
    desc: 'Règles qui dépendent de votre nationalité pour les acheteurs de {g} à Dubaï, Bali, Phuket et Chypre, d’après les textes officiels, avec les chiffres de nos données du {d}.',
    home: 'Avant d’envoyer de l’argent depuis chez vous', same: 'Les mêmes règles que pour tout acheteur étranger s’appliquent ici ; voir le guide.', rules: 'Règles par lieu', data: 'Les quatre lieux dans nos données', c_pl: 'Lieu', c_n: 'Projets', c_pn: 'N° de permis publié', c_ov: 'Livraison dépassée', c_m: 'Score médian',
    src: 'Source : {s}, lue le {d}.', guide: 'Acheter sur plan à {p} : que vérifier', mk: 'Tous les projets à {p}', other: 'Autres groupes d’acheteurs', hub: 'Acheter sur plan à l’étranger selon votre nationalité', hubl: 'Ce qui change selon votre nationalité à Dubaï, Bali, Phuket et Chypre, d’après les textes officiels.', reviewed: 'Règles lues pour la dernière fois le {d}. Pas un conseil juridique.',
    ae_gcc: 'À Dubaï, les ressortissants des Émirats et des autres États du Conseil de coopération du Golfe (et les sociétés qu’ils détiennent entièrement) peuvent être propriétaires partout dans l’émirat. Les acheteurs d’autres nationalités ne le peuvent que dans les zones désignées par le Souverain, en pleine propriété ou en usufruit ou bail de 99 ans au plus.',
    ae_for: 'À Dubaï, qui n’est pas ressortissant des Émirats ou d’un autre État du CCG ne peut être propriétaire que dans les zones que le Souverain désigne : en pleine propriété, ou en usufruit ou bail de 99 ans au plus. Vérifiez que le projet se trouve dans une telle zone.',
    id_for: 'À Bali, les étrangers ne peuvent pas détenir la pleine propriété (Hak Milik). Une personne étrangère munie d’un document d’immigration peut détenir un droit d’usage (Hak Pakai) sur une maison ou un appartement.',
    th_for: 'À Phuket, les étrangers peuvent posséder un appartement en pleine propriété tant que les lots détenus par des étrangers restent dans 49 % de la surface de l’immeuble, et doivent prouver que le prix a été apporté en Thaïlande en devises ou payé depuis un compte en devises. Les terrains et maisons ne peuvent pas être détenus en pleine propriété par des étrangers.',
    cy_ru: 'À Chypre, les sanctions de l’UE interdisent aux banques de l’UE d’accepter des dépôts de plus de 100 000 EUR au total par banque de ressortissants russes, sauf s’ils ont aussi la nationalité ou un titre de séjour d’un pays de l’UE, de l’EEE ou de la Suisse. Convenez avec votre banque et votre avocat du mode de paiement avant de signer.',
    cn_safe: 'Selon les règles de l’Administration d’État des changes (avis Huifa [2016] n° 36), les devises achetées par les particuliers en Chine continentale dans le quota annuel de 50 000 USD ne peuvent pas servir à acheter un bien à l’étranger. Demandez à votre banque en Chine et à votre avocat comment payer légalement avant de signer.' },
  de: { g_russia: 'Russland', g_china: 'Festlandchina', g_gulf: 'den Golfstaaten (GCC)', t: 'Off-Plan kaufen aus {g}: Dubai, Bali, Phuket, Zypern', h1: 'Off-Plan im Ausland kaufen als Käufer aus {g}',
    lead: 'Was sich mit Ihrer Staatsangehörigkeit ändert, wenn Sie an den vier Orten, die Käufer aus {g} am häufigsten ansehen, off-plan kaufen, nach den amtlichen Texten, und wie die Projekte dort in unseren Daten abschneiden. Keine Rechtsberatung; Regeln ändern sich, fragen Sie einen Anwalt.',
    desc: 'Regeln, die von Ihrer Staatsangehörigkeit abhängen, für Käufer aus {g} in Dubai, Bali, Phuket und Zypern, nach den amtlichen Texten, mit Projektzahlen aus unseren Daten vom {d}.',
    home: 'Bevor Sie Geld von zu Hause überweisen', same: 'Hier gelten dieselben Regeln wie für alle ausländischen Käufer; siehe den Leitfaden.', rules: 'Regeln nach Ort', data: 'Die vier Orte in unseren Daten', c_pl: 'Ort', c_n: 'Projekte', c_pn: 'Genehmigungsnr. veröffentlicht', c_ov: 'Übergabe überfällig', c_m: 'Medianwert',
    src: 'Quelle: {s}, gelesen am {d}.', guide: 'Off-Plan kaufen in {p}: was Sie prüfen sollten', mk: 'Alle Projekte in {p}', other: 'Andere Käufergruppen', hub: 'Off-Plan im Ausland kaufen nach Staatsangehörigkeit', hubl: 'Was sich mit Ihrer Staatsangehörigkeit in Dubai, Bali, Phuket und Zypern ändert, nach den amtlichen Texten.', reviewed: 'Regeln zuletzt gelesen am {d}. Keine Rechtsberatung.',
    ae_gcc: 'In Dubai dürfen Staatsangehörige der VAE und der anderen Staaten des Golf-Kooperationsrats (und Unternehmen, die ihnen vollständig gehören) überall im Emirat Eigentum erwerben. Käufer anderer Staatsangehörigkeit nur in den vom Herrscher bestimmten Gebieten, als Volleigentum oder als Nießbrauch oder Pacht bis 99 Jahre.',
    ae_for: 'In Dubai dürfen Käufer, die nicht Staatsangehörige der VAE oder eines anderen GCC-Staates sind, nur in den vom Herrscher bestimmten Gebieten Eigentum erwerben: als Volleigentum oder als Nießbrauch oder Pacht bis 99 Jahre. Prüfen Sie, ob das Projekt in einem solchen Gebiet liegt.',
    id_for: 'Auf Bali können Ausländer kein Volleigentum (Hak Milik) halten. Eine ausländische Person mit Aufenthaltsdokument kann ein Nutzungsrecht (Hak Pakai) an einem Haus oder einer Wohnung halten.',
    th_for: 'Auf Phuket können Ausländer eine Eigentumswohnung als Volleigentum besitzen, solange die Wohnungen von Ausländern höchstens 49 % der Fläche des Gebäudes ausmachen, und müssen nachweisen, dass der Kaufpreis in Fremdwährung nach Thailand gebracht oder von einem Fremdwährungskonto gezahlt wurde. Grund und Häuser können Ausländer nicht als Volleigentum besitzen.',
    cy_ru: 'In Zypern verbieten EU-Sanktionen Banken in der EU, von russischen Staatsangehörigen Einlagen von insgesamt mehr als 100.000 EUR je Bank anzunehmen, außer sie besitzen auch die Staatsangehörigkeit oder einen Aufenthaltstitel eines EU- oder EWR-Landes oder der Schweiz. Klären Sie mit Bank und Anwalt vor der Unterschrift, wie der Kaufpreis gezahlt wird.',
    cn_safe: 'Nach den Regeln der Staatlichen Devisenverwaltung (Mitteilung Huifa [2016] Nr. 36) darf Devisen, die Privatpersonen in Festlandchina im Jahreskontingent von 50.000 USD kaufen, nicht für den Kauf von Immobilien im Ausland verwendet werden. Fragen Sie Ihre Bank in China und Ihren Anwalt vor der Unterschrift, wie der Kauf rechtmäßig bezahlt werden kann.' },
  nl: { g_russia: 'Rusland', g_china: 'het Chinese vasteland', g_gulf: 'de Golfstaten (GCC)', t: 'Off-plan kopen vanuit {g}: Dubai, Bali, Phuket, Cyprus', h1: 'Off-plan kopen in het buitenland als koper uit {g}',
    lead: 'Wat er verandert met uw nationaliteit als u off-plan koopt op de vier plaatsen waar kopers uit {g} het meest kijken, volgens de officiële teksten, en hoe de projecten daar zich verhouden in onze gegevens. Geen juridisch advies; regels veranderen, raadpleeg een advocaat.',
    desc: 'Regels die afhangen van uw nationaliteit voor kopers uit {g} in Dubai, Bali, Phuket en Cyprus, volgens de officiële teksten, met projectcijfers uit onze gegevens van {d}.',
    home: 'Voordat u geld vanuit huis overmaakt', same: 'Hier gelden dezelfde regels als voor elke buitenlandse koper; zie de gids.', rules: 'Regels per plaats', data: 'De vier plaatsen in onze gegevens', c_pl: 'Plaats', c_n: 'Projecten', c_pn: 'Vergunningsnr. gepubliceerd', c_ov: 'Oplevering verstreken', c_m: 'Mediaanscore',
    src: 'Bron: {s}, gelezen op {d}.', guide: 'Off-plan kopen in {p}: wat u moet controleren', mk: 'Alle projecten in {p}', other: 'Andere kopersgroepen', hub: 'Off-plan kopen in het buitenland naar nationaliteit', hubl: 'Wat er met uw nationaliteit verandert in Dubai, Bali, Phuket en Cyprus, volgens de officiële teksten.', reviewed: 'Regels het laatst gelezen op {d}. Geen juridisch advies.',
    ae_gcc: 'In Dubai mogen onderdanen van de VAE en van de andere staten van de Samenwerkingsraad van de Golf (en bedrijven die volledig van hen zijn) overal in het emiraat eigenaar worden. Kopers van een andere nationaliteit alleen in de gebieden die de Heerser aanwijst, in volle eigendom of als vruchtgebruik of erfpacht van ten hoogste 99 jaar.',
    ae_for: 'In Dubai mogen kopers die geen onderdaan zijn van de VAE of een andere GCC-staat alleen eigenaar worden in de gebieden die de Heerser aanwijst: in volle eigendom, of als vruchtgebruik of erfpacht van ten hoogste 99 jaar. Controleer of het project in zo’n gebied ligt.',
    id_for: 'Op Bali kunnen buitenlanders geen volle eigendom (Hak Milik) hebben. Een buitenlandse persoon met een immigratiedocument kan een gebruiksrecht (Hak Pakai) hebben op een huis of een appartement.',
    th_for: 'Op Phuket kunnen buitenlanders een appartement in volle eigendom bezitten zolang de appartementen van buitenlanders binnen 49% van de vloeroppervlakte van het gebouw blijven, en moeten zij aantonen dat het aankoopbedrag in vreemde valuta naar Thailand is gebracht of van een valutarekening is betaald. Grond en huizen kunnen buitenlanders niet in volle eigendom hebben.',
    cy_ru: 'Op Cyprus verbieden EU-sancties banken in de EU om van Russische onderdanen deposito’s van in totaal meer dan 100.000 EUR per bank aan te nemen, tenzij zij ook de nationaliteit of een verblijfsvergunning hebben van een EU- of EER-land of Zwitserland. Spreek vóór het tekenen met uw bank en advocaat af hoe de koopsom wordt betaald.',
    cn_safe: 'Volgens de regels van de Staatsadministratie voor Deviezen (kennisgeving Huifa [2016] nr. 36) mag vreemde valuta die particulieren op het Chinese vasteland binnen het jaarlijkse quotum van 50.000 USD kopen, niet worden gebruikt om vastgoed in het buitenland te kopen. Vraag uw bank in China en uw advocaat vóór het tekenen hoe de aankoop rechtmatig kan worden betaald.' },
  ru: { g_russia: 'России', g_china: 'материкового Китая', g_gulf: 'стран Персидского залива (ССАГПЗ)', t: 'Покупка новостройки за рубежом из {g}: Дубай, Бали, Пхукет, Кипр', h1: 'Покупка новостройки за рубежом для покупателей из {g}',
    lead: 'Что меняется в зависимости от гражданства при покупке новостройки в четырёх местах, которые чаще всего выбирают покупатели из {g}, по официальным текстам, и как там выглядят проекты в наших данных. Это не юридическая консультация; правила меняются, обратитесь к юристу.',
    desc: 'Правила, зависящие от гражданства, для покупателей из {g} в Дубае, на Бали, на Пхукете и на Кипре, по официальным текстам, с цифрами по проектам из наших данных на {d}.',
    home: 'Прежде чем переводить деньги из своей страны', same: 'Здесь действуют те же правила, что и для любого иностранного покупателя; см. руководство.', rules: 'Правила по местам', data: 'Четыре места в наших данных', c_pl: 'Место', c_n: 'Проекты', c_pn: 'Номер разрешения опубликован', c_ov: 'Срок сдачи прошёл', c_m: 'Медианная оценка',
    src: 'Источник: {s}, прочитано {d}.', guide: 'Покупка новостройки: {p}, что проверить', mk: 'Все проекты: {p}', other: 'Другие группы покупателей', hub: 'Покупка новостройки за рубежом в зависимости от гражданства', hubl: 'Что меняется в зависимости от гражданства в Дубае, на Бали, на Пхукете и на Кипре, по официальным текстам.', reviewed: 'Правила последний раз прочитаны {d}. Это не юридическая консультация.',
    ae_gcc: 'В Дубае граждане ОАЭ и других государств Совета сотрудничества стран Залива (и полностью принадлежащие им компании) могут владеть недвижимостью в любой части эмирата. Покупатели другого гражданства могут владеть только в зонах, определённых Правителем: в собственности (freehold) либо на праве узуфрукта или аренды на срок до 99 лет.',
    ae_for: 'В Дубае покупатели, не являющиеся гражданами ОАЭ или другой страны ССАГПЗ, могут владеть недвижимостью только в зонах, определённых для них Правителем: в собственности (freehold) либо на праве узуфрукта или аренды на срок до 99 лет. Проверьте, что проект находится в такой зоне.',
    id_for: 'На Бали иностранцы не могут иметь право полной собственности (Hak Milik). Иностранец с иммиграционным документом может иметь право пользования (Hak Pakai) домом или квартирой.',
    th_for: 'На Пхукете иностранцы могут владеть квартирой в кондоминиуме в собственности, пока квартиры иностранцев занимают не более 49% площади здания, и должны подтвердить, что деньги на покупку ввезены в страну в иностранной валюте или оплачены с валютного счёта. Землёй и домами иностранцы владеть в собственности не могут.',
    cy_ru: 'На Кипре санкции ЕС запрещают банкам ЕС принимать от граждан России депозиты на сумму более 100 000 EUR в целом на один банк, если у них нет также гражданства или вида на жительство страны ЕС, ЕЭЗ или Швейцарии. До подписания договоритесь с банком и юристом о том, как будет оплачена покупка.',
    cn_safe: 'По правилам Государственного валютного управления КНР (уведомление Хуэйфа [2016] № 36) валюту, купленную физическими лицами в материковом Китае в рамках годовой квоты 50 000 USD, нельзя использовать для покупки недвижимости за рубежом. До подписания уточните у банка в Китае и у юриста, как законно оплатить покупку.' },
  zh: { g_russia: '俄罗斯', g_china: '中国内地', g_gulf: '海湾国家（海合会）', t: '{g}买家海外购买期房：迪拜、巴厘岛、普吉岛、塞浦路斯', h1: '{g}买家在海外购买期房',
    lead: '{g}买家最常关注的四个地方：根据官方文本，购买期房时哪些规定会因您的国籍而不同，以及当地项目在我们数据中的对比。不构成法律意见；规定会变化，请咨询律师。',
    desc: '{g}买家在迪拜、巴厘岛、普吉岛和塞浦路斯与国籍有关的规定，依据官方文本，并附我们 {d} 数据中的项目数字。',
    home: '从国内汇款之前', same: '这里适用与所有外国买家相同的规定；请参阅指南。', rules: '各地规定', data: '我们数据中的四个地方', c_pl: '地点', c_n: '项目', c_pn: '公布许可证编号', c_ov: '已过交付日期', c_m: '评分中位数',
    src: '来源：{s}，阅读日期 {d}。', guide: '在{p}购买期房：需要核实什么', mk: '{p}的全部项目', other: '其他买家群体', hub: '按国籍看海外购买期房', hubl: '根据官方文本，在迪拜、巴厘岛、普吉岛和塞浦路斯，哪些规定因国籍而不同。', reviewed: '规定最后阅读日期 {d}。不构成法律意见。',
    ae_gcc: '在迪拜，阿联酋及其他海湾合作委员会成员国的国民（及其全资拥有的公司）可以在酋长国任何地方拥有房产。其他国籍的买家只能在统治者指定的区域内以永久产权或最长 99 年的用益权或租赁权持有。',
    ae_for: '在迪拜，不是阿联酋或其他海合会国家国民的买家，只能在统治者为其指定的区域内持有房产：永久产权，或最长 99 年的用益权或租赁权。请确认项目位于此类区域。',
    id_for: '在巴厘岛，外国人不能持有完全所有权（Hak Milik）。持有移民证件的外国个人可以对住宅或公寓单元持有使用权（Hak Pakai）。',
    th_for: '在普吉岛，只要外国人拥有的单元不超过大楼面积的 49%，外国人可以永久产权持有公寓单元，并须证明购房款以外币汇入泰国或从外币账户支付。外国人不能以永久产权持有土地和独栋房屋。',
    cy_ru: '在塞浦路斯，欧盟制裁禁止欧盟银行接受俄罗斯国民在每家银行合计超过 10 万欧元的存款，除非其同时拥有欧盟、欧洲经济区国家或瑞士的国籍或居留许可。签约前请与银行和律师商定购房款的支付方式。',
    cn_safe: '根据国家外汇管理局的规定（汇发〔2016〕36号），中国内地个人在每年等值 5 万美元便利化额度内购买的外汇，不得用于境外买房。签约前请向您在国内的银行和律师确认如何合法支付购房款。' },
  ar: { g_russia: 'روسيا', g_china: 'البر الرئيسي الصيني', g_gulf: 'دول الخليج (مجلس التعاون)', t: 'الشراء على الخارطة من {g}: دبي وبالي وبوكيت وقبرص', h1: 'الشراء على الخارطة في الخارج للمشترين من {g}',
    lead: 'ما الذي يتغيّر بحسب جنسيتك عند الشراء على الخارطة في الأماكن الأربعة التي يقصدها المشترون من {g} أكثر من غيرها، وفق النصوص الرسمية، وكيف تقارن المشاريع هناك في بياناتنا. ليس استشارة قانونية؛ القواعد تتغيّر، استشر محاميًا.',
    desc: 'قواعد تتوقف على جنسيتك للمشترين من {g} في دبي وبالي وبوكيت وقبرص، وفق النصوص الرسمية، مع أرقام المشاريع من بياناتنا بتاريخ {d}.',
    home: 'قبل أن ترسل المال من بلدك', same: 'تنطبق هنا القواعد نفسها على كل مشترٍ أجنبي؛ راجع الدليل.', rules: 'القواعد حسب المكان', data: 'الأماكن الأربعة في بياناتنا', c_pl: 'المكان', c_n: 'المشاريع', c_pn: 'رقم الترخيص منشور', c_ov: 'فات موعد التسليم', c_m: 'وسيط الدرجة',
    src: 'المصدر: {s}، قُرئ في {d}.', guide: 'الشراء على الخارطة في {p}: ما الذي يجب التحقق منه', mk: 'كل المشاريع في {p}', other: 'فئات مشترين أخرى', hub: 'الشراء على الخارطة في الخارج حسب الجنسية', hubl: 'ما الذي يتغيّر بحسب جنسيتك في دبي وبالي وبوكيت وقبرص، وفق النصوص الرسمية.', reviewed: 'آخر قراءة للقواعد في {d}. ليس استشارة قانونية.',
    ae_gcc: 'في دبي، يحق لمواطني الإمارات ومواطني دول مجلس التعاون الخليجي الأخرى (والشركات المملوكة لهم بالكامل) تملّك العقارات في أي مكان من الإمارة. أما المشترون من جنسيات أخرى فلا يتملّكون إلا في المناطق التي يحددها الحاكم، تملّكًا حرًا أو حق انتفاع أو إجارة لمدة لا تزيد على 99 عامًا.',
    ae_for: 'في دبي، لا يحق للمشترين من غير مواطني الإمارات أو دول مجلس التعاون التملّك إلا في المناطق التي يحددها الحاكم لهم: تملّكًا حرًا، أو حق انتفاع أو إجارة لمدة لا تزيد على 99 عامًا. تحقّق من أن المشروع يقع في منطقة كهذه.',
    id_for: 'في بالي، لا يحق للأجانب التملّك الحر (Hak Milik). يمكن للفرد الأجنبي الحامل لوثيقة إقامة أن يملك حق الانتفاع (Hak Pakai) على منزل أو شقة.',
    th_for: 'في بوكيت، يمكن للأجانب تملّك شقة في مبنى سكني تملّكًا حرًا ما دامت الشقق المملوكة لأجانب لا تتجاوز 49% من مساحة المبنى، وعليهم إثبات أن ثمن الشراء أُدخل إلى تايلاند بعملة أجنبية أو دُفع من حساب بعملة أجنبية. ولا يمكن للأجانب تملّك الأراضي والمنازل تملّكًا حرًا.',
    cy_ru: 'في قبرص، تحظر عقوبات الاتحاد الأوروبي على بنوك الاتحاد قبول ودائع تزيد في مجموعها على 100,000 يورو لكل بنك من المواطنين الروس، ما لم يحملوا أيضًا جنسية أو إقامة دولة في الاتحاد الأوروبي أو المنطقة الاقتصادية الأوروبية أو سويسرا. اتفق مع بنكك ومحاميك على طريقة دفع الثمن قبل التوقيع.',
    cn_safe: 'بموجب قواعد الإدارة الحكومية للنقد الأجنبي في الصين (الإشعار Huifa [2016] رقم 36)، لا يجوز استخدام العملات الأجنبية التي يشتريها الأفراد في البر الرئيسي الصيني ضمن الحصة السنوية البالغة 50,000 دولار لشراء عقارات في الخارج. اسأل بنكك في الصين ومحاميك قبل التوقيع عن طريقة الدفع القانونية.' }
};
const bt = (lang, k, v) => { let s = (BT[lang] && BT[lang][k] != null) ? BT[lang][k] : BT.en[k]; if (v) s = String(s).replace(/\{(\w+)\}/g, (m, a) => v[a] != null ? v[a] : m); return s.replace(/\.\.(?=\s|$)/g, '.'); };
function buyerPage(D, g, lang) {
  const G = bt(lang, 'g_' + g), d = fd(D.d, lang), path = '/guides/buyers-from/' + g + '/', R = BRULE[g], N = n => nf(lang, n);
  const srcP = k => { const S = BSRC[k]; return '<p class="k-small k-muted">' + esc(bt(lang, 'src', { s: S.n, d: fd(S.d, lang) })).replace(esc(S.n), '<a href="' + esc(S.u) + '" rel="noopener">' + esc(S.n) + '</a>') + '</p>'; };
  let body = '<div class="k29"><section class="k-sec"><div class="k-wrap"><div class="k-phead"><p class="k-crumb"><a href="' + pre(lang) + '/">Kolaboro</a> / <a href="' + pre(lang) + '/guides/buying-off-plan/">' + esc(bt(lang, 'hub')) + '</a> / <span>' + esc(G) + '</span></p>' +
    '<h1>' + esc(bt(lang, 'h1', { g: G })) + '</h1><p class="lead">' + esc(bt(lang, 'lead', { g: G })) + '</p></div>';
  if (R.home) body += '<h2 id="home">' + esc(bt(lang, 'home')) + '</h2><p>' + esc(bt(lang, R.home[0])) + '</p>' + srcP(R.home[1]);
  body += '<h2 id="rules">' + esc(bt(lang, 'rules')) + '</h2>';
  const rows = [];
  for (const P of BPL) {
    const m = D.M.get(slugM(P.mk)), pn = mkName(P.mk, lang), r = R[P.s];
    body += '<h3 id="' + P.s + '">' + bdi(pn) + '</h3>' + (r ? '<p>' + esc(bt(lang, r[0])) + '</p>' + srcP(r[1]) : '<p>' + esc(bt(lang, 'same')) + '</p>') +
      '<ul class="k29-l"><li><a href="' + pre(lang) + '/guides/buying-off-plan/' + P.g + '/">' + esc(bt(lang, 'guide', { p: pn })) + '</a></li>' + (m ? '<li><a href="' + pre(lang) + '/m/' + slugM(P.mk) + '/">' + esc(bt(lang, 'mk', { p: pn })) + '</a></li>' : '') + '</ul>';
    if (m) rows.push('<tr><td data-label="' + esc(bt(lang, 'c_pl')) + '"><a href="' + pre(lang) + '/m/' + slugM(P.mk) + '/">' + bdi(pn) + '</a></td><td data-label="' + esc(bt(lang, 'c_n')) + '">' + N(m.st.n) + '</td><td data-label="' + esc(bt(lang, 'c_pn')) + '">' + N(m.st.pn) + ' (' + N(pct(m.st.pn, m.st.n)) + '%)</td><td data-label="' + esc(bt(lang, 'c_ov')) + '">' + N(m.st.ov) + '</td><td data-label="' + esc(bt(lang, 'c_m')) + '">' + (m.st.med == null ? '-' : N(m.st.med)) + '</td></tr>');
  }
  body += '<h2 id="data">' + esc(bt(lang, 'data')) + '</h2><p class="k-small k-muted">' + esc(t(lang, 'k_d')) + ': ' + esc(d) + '</p><div class="k-table-wrap"><table class="k-table k-table--dense k-table--stack"><thead><tr>' + ['c_pl', 'c_n', 'c_pn', 'c_ov', 'c_m'].map(k => '<th scope="col">' + esc(bt(lang, k)) + '</th>').join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>' +
    '<h2 id="other">' + esc(bt(lang, 'other')) + '</h2><ul class="k29-l">' + GROUPS.filter(x => x !== g).map(x => '<li><a href="' + pre(lang) + '/guides/buyers-from/' + x + '/">' + esc(bt(lang, 'h1', { g: bt(lang, 'g_' + x) })) + '</a></li>').join('') + '</ul><p class="k-small k-muted">' + esc(bt(lang, 'reviewed', { d: fd('2026-11-14', lang) })) + '</p></div></section></div>';
  const title = bt(lang, 't', { g: G }), desc = bt(lang, 'desc', { g: G, d }), url = ORIGIN + pre(lang) + path;
  const lm = BPL.map(P => (D.M.get(slugM(P.mk)) || { st: { lm: '' } }).st.lm).concat(['2026-11-14']).sort().pop();
  const ld = [{ '@type': 'Article', '@id': url + '#page', url, headline: title, description: desc, inLanguage: lang, dateModified: lm, datePublished: '2026-11-14', author: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, publisher: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' },
    about: BPL.map(P => ({ '@type': 'Place', name: mkName(P.mk, lang) })), citation: Object.values(BSRC).filter((S, i, a) => JSON.stringify(R).includes(Object.keys(BSRC)[i])).map(S => ({ '@type': 'Legislation', name: S.n, url: S.u })) }];
  return { path, title, desc, body, ld, lm };
}
// links to the buyer pages from the four buying guides and market files (index.js and marketPage)
export function buyerLinks(lang, mkOrGuide) {
  const P = BPL.find(q => q.s === mkOrGuide || q.mk === mkOrGuide); if (!P) return '';
  return '<section class="k29-q"><div class="k-wrap wrap"><h2>' + esc(bt(lang, 'hub')) + '</h2><p>' + esc(bt(lang, 'hubl')) + '</p><ul class="k29-l">' + GROUPS.map(x => '<li><a href="' + pre(lang) + '/guides/buyers-from/' + x + '/#' + P.s + '">' + esc(bt(lang, 'h1', { g: bt(lang, 'g_' + x) })) + '</a></li>').join('') + '</ul></div></section>';
}

// ------------------------------------------------------------------------------------------------ lead's request (14 Nov): /<lang>/countries/ and /<lang>/rankings/
// The English /countries/ pages (kbx_seo.js) carry much more (registers, delay tables); the language versions carry the figures,
// the project table and the links, from the same data, for countries with 5+ named projects. /<lang>/rankings/ lists the rankings
// and place reports that already exist in every language.
export const CR_RX = /^\/(es|de|fr|nl|ru|zh|ar)\/(countries|rankings)(?:\/([a-z0-9-]{2,60}))?(\/?)$/;
const RK = ['/rankings/transparency/', '/rankings/developers/', '/permits/', '/price-ranges/', '/ownership/', '/golden-visa/', '/airports/', '/reports/', '/handover/', '/handover/overdue/', '/areas/', '/weekly/', '/numbers/'];
function countriesHub(D, lang) {
  const C = [...D.C.values()].sort((a, b) => b.L.length - a.L.length || a.co.localeCompare(b.co)), d = fd(D.d, lang), N = n => nf(lang, n), path = '/countries/';
  const n = C.reduce((a, c) => a + c.L.length, 0), title = t(lang, 'ch_t', { c: N(C.length), n: N(n) }), desc = t(lang, 'ch_lead', { k: MIN_MK, d });
  const rows = C.map(c => '<tr><td data-label="' + esc(t(lang, 'c_co')) + '"><a href="' + pre(lang) + '/countries/' + c.s + '/">' + bdi(coName(c.co, lang)) + '</a></td><td data-label="' + esc(t(lang, 'k_n')) + '">' + N(c.st.n) + '</td><td data-label="' + esc(t(lang, 'k_pn')) + '">' + N(c.st.pn) + ' (' + N(pct(c.st.pn, c.st.n)) + '%)</td><td data-label="' + esc(t(lang, 'k_ov')) + '">' + N(c.st.ov) + '</td><td data-label="' + esc(t(lang, 'k_med')) + '">' + (c.st.med == null ? '-' : N(c.st.med)) + '</td></tr>').join('');
  const cr = [['Kolaboro', pre(lang) + '/'], [t(lang, 'crumb_c'), pre(lang) + path]];
  const body = '<div class="k29"><section class="k-sec"><div class="k-wrap"><div class="k-phead"><p class="k-crumb"><a href="' + pre(lang) + '/">Kolaboro</a> / <span>' + esc(t(lang, 'crumb_c')) + '</span></p><h1>' + esc(t(lang, 'ch_h')) + '</h1><p class="lead">' + esc(desc) + '</p></div>' +
    kvHtml([[N(C.length), t(lang, 'k_co')], [N(n), t(lang, 'k_n')], [esc(d), t(lang, 'k_d')]]) +
    '<div class="k-table-wrap"><table class="k-table k-table--dense k-table--stack"><thead><tr>' + ['c_co', 'k_n', 'k_pn', 'k_ov', 'k_med'].map(k => '<th scope="col">' + esc(t(lang, k)) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<ul class="k29-l"><li><a href="/countries/" hreflang="en">' + esc(t(lang, 'l_enc')) + '</a></li><li><a href="' + pre(lang) + '/rankings/">' + esc(t(lang, 'rk_t')) + '</a></li></ul><p class="k-small k-muted">' + esc(t(lang, 'src')) + '</p></div></section></div>';
  const url = ORIGIN + pre(lang) + path, lm = C.map(c => c.st.lm).sort().pop();
  return { path, title, desc, body, lm, ld: [{ '@type': 'CollectionPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: lm, mainEntity: { '@type': 'ItemList', numberOfItems: C.length, itemListElement: C.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: coName(c.co, lang), url: ORIGIN + pre(lang) + '/countries/' + c.s + '/' })) } }, { '@type': 'BreadcrumbList', itemListElement: cr.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: ORIGIN + c[1] })) }] };
}
function rankingsHub(D, lang) {
  const path = '/rankings/', title = t(lang, 'rk_t'), desc = t(lang, 'rk_lead'), L = t(lang, 'rk'), d = fd(D.d, lang);
  const body = '<div class="k29"><section class="k-sec"><div class="k-wrap"><div class="k-phead"><p class="k-crumb"><a href="' + pre(lang) + '/">Kolaboro</a> / <span>' + esc(title) + '</span></p><h1>' + esc(title) + '</h1><p class="lead">' + esc(desc) + '</p></div>' +
    '<ul class="k-list">' + RK.map((r, i) => '<li><a href="' + pre(lang) + r + '">' + esc(L[i]) + '</a></li>').join('') + '</ul>' +
    '<ul class="k29-l"><li><a href="' + pre(lang) + '/countries/">' + esc(t(lang, 'ch_h')) + '</a></li><li><a href="/rankings/" hreflang="en">English</a></li></ul><p class="k-small k-muted">' + esc(t(lang, 'k_d')) + ': ' + esc(d) + '</p></div></section></div>';
  const url = ORIGIN + pre(lang) + path;
  return { path, title, desc, body, lm: D.d, ld: [{ '@type': 'CollectionPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: D.d, mainEntity: { '@type': 'ItemList', numberOfItems: RK.length, itemListElement: RK.map((r, i) => ({ '@type': 'ListItem', position: i + 1, name: L[i], url: ORIGIN + pre(lang) + r })) } }] };
}
// English /countries/, /countries/<c>/ and /rankings/: hreflang to the language versions (index.js)
export async function crAlternates(env, path) {
  let ok = path === '/rankings/' || path === '/countries/';
  if (!ok) { const m = /^\/countries\/([a-z0-9-]{2,60})\/$/.exec(path); if (m) { let D; try { D = await mdata(env); } catch (e) { return ''; } ok = D.C.has(m[1]); } }
  return ok ? LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + path + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + path + '">' : '';
}
// ------------------------------------------------------------------------------------------------ routing
const txt = (b, ct, h) => new Response(b, { headers: Object.assign({ 'content-type': ct, 'cache-control': 'public, max-age=3600', 'access-control-allow-origin': '*' }, h || {}) });
export async function page(req, u, env, ctx, shell) {
  const p = u.pathname;
  let D; try { D = await mdata(env); } catch (e) { return new Response('Temporarily unavailable', { status: 503, headers: { 'retry-after': '60', 'cache-control': 'no-store' } }); }
  if (p === '/m/sitemap.xml') return txt(mSitemap(D), 'application/xml; charset=utf-8');
  if (p === '/answers/questions.md') return txt(questionsMd(D), 'text/markdown; charset=utf-8', { 'x-robots-tag': 'noindex' });
  if (p === '/answers/questions.json') return txt(JSON.stringify({ about: 'Questions about off-plan projects answered from Kolaboro data (no estimates). Each answer links the page with the facts and their sources.', licence: 'CC BY 4.0, attribute "Kolaboro"', updated: D.d, count: questions(D).length, questions: questions(D) }), 'application/json; charset=utf-8');
  const cm = CR_RX.exec(p);
  if (cm) {
    const lang = cm[1], kind = cm[2], slug = cm[3];
    if (kind === 'rankings' && slug) return null;
    const cc = slug ? D.C.get(slug) : null; if (slug && !cc) return null;   // other pages under /<lang>/countries/ belong to other modules
    if (!cm[4]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
    const key = 'c|' + lang + '|' + kind + '|' + (slug || ''); let pg = D.body.get(key);
    if (!pg) { pg = kind === 'rankings' ? rankingsHub(D, lang) : cc ? marketPage(D, cc, lang) : countriesHub(D, lang); D.body.set(key, pg); }
    return render(req, lang, pg, await shell(pre(lang) + '/how-we-score/'));
  }
  const bm = BUYER_RX.exec(p);
  if (bm) {
    const lang = bm[1] || 'en', g = bm[2]; if (!g) return new Response(null, { status: 301, headers: { location: pre(lang) + '/guides/buyers-from/russia/', 'cache-control': 'public, max-age=3600' } });
    if (!bm[3]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
    const key = 'b|' + lang + '|' + g; let pg = D.body.get(key); if (!pg) { pg = buyerPage(D, g, lang); D.body.set(key, pg); }
    return render(req, lang, pg, await shell(pre(lang) + '/how-we-score/'));
  }
  const m = PAGE_RX.exec(p); if (!m || !shell) return null;
  const lang = m[1], mm = findMk(D, m[2]); if (!mm) return null;   // smaller markets: kbx_404.js keeps the 301 to the English file
  if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
  const key = 'm|' + lang + '|' + mm.mk; let pg = D.body.get(key); if (!pg) { pg = marketPage(D, mm, lang); D.body.set(key, pg); }
  return render(req, lang, pg, await shell(pre(lang) + '/how-we-score/'));
}
async function render(req, lang, pg, sh) {
  const url = ORIGIN + pre(lang) + pg.path, alts = LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + pg.path + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + pg.path + '">';
  const tags = '<title>' + esc(pg.title) + ([...pg.title].length + 11 <= 60 ? ' | Kolaboro' : '') + '</title><meta name="description" content="' + esc(pg.desc) + '"><link rel="canonical" href="' + url + '">' + alts + '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">' +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="Kolaboro"><meta property="og:title" content="' + esc(pg.title) + '"><meta property="og:description" content="' + esc(pg.desc) + '"><meta property="og:url" content="' + url + '"><meta property="og:image" content="' + ORIGIN + '/og.png"><meta name="twitter:card" content="summary_large_image">' +
    '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@graph': pg.ld }).replace(/</g, '\\u003c') + '</script>' + CSS;
  const res = new HTMLRewriter()
    .on('html', { element(e) { e.setAttribute('lang', lang); if (lang === 'ar') e.setAttribute('dir', 'rtl'); else e.removeAttribute('dir'); } })
    .on('title', { element(e) { e.remove(); } })
    .on('meta[name="description"],meta[name="robots"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],link[rel="alternate"][hreflang]', { element(e) { e.remove(); } })
    .on('script[type="application/ld+json"]', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(pg.body, { html: true }); } })
    .on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + pg.path); } })
    .transform(new Response(sh.body, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
  return new Response(req.method === 'HEAD' ? null : await res.text(), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600', 'last-modified': new Date(pg.lm + 'T00:00:00Z').toUTCString() } });
}
export { marketPage, mdata, questions, hubParts, buyerPage };   // for the local test
