// kolaboro.com batch 27 (agent n27a, 13 Nov 2026): answer engines, open data and what Y Combinator sees. No paid AI anywhere:
// every word is a template, every number comes from our published data files or from counters the site already keeps.
//   GET /answers/place/<slug>.md                one Markdown answer file per place (market), every named project with its quick answer
//   GET /answers/developer/<slug>.md            one Markdown answer file per developer
//   GET /api/v1/projects/<slug>.csv             the per-project record of /api/v1/projects/<slug> flattened to field,value rows
//   GET /corrections.json, /corrections.md      the corrections log of /corrections/ for machines (one source: that page's list)
//   GET /[<lang>/]developers/<slug>/dashboard/  read-only developer dashboard from public data (score, what is missing, how to send it)
//   GET /yc/                                    one-minute summary: problem, data, daily shipping, traction as counted (noindex)
//   GET /api/open/usage                         page views by page type per day (edge counters, lower bounds) and return visits
//   POST /api/open/rv?b=<bucket>                return-visit beacon (no id, no cookie; only "bucket + day -> count")
//   count(req, u, ctx)                          called for every kolaboro.com request: counts a page view by page type
//   metricsHtml()                               the block appended to /metrics/
// Counters: the worker has no durable counter store (no KV or analytics binding), so, like the AI crawler counts of kbx_bots.js,
// they live in the edge cache of each Cloudflare location: a lower bound for the location that answers, kept up to 35 days.
// Rules kept: facts only, each with its source; no verdicts about a named company; Sumba projects never named (not in the named index).
import * as N from './kbx_named.js';
import { rpc } from './kolaboro.js';
import { hyear, mkName, coName } from './kbx_hdate.js';

const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const PATHS = /^\/answers\/(?:place|developer)\/[a-z0-9-]{1,90}\.md$|^\/api\/v1\/projects\/[a-z0-9-]{1,90}\.csv$|^\/corrections\.(?:json|md)$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?developers\/[a-z0-9-]{1,90}\/dashboard\/?$|^\/yc\/?$|^\/api\/open\/(?:usage|rv)\/?$/;
export const slug = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const esc = N.esc, pre = N.pre;
const pUrl = (lang, x) => ORIGIN + pre(lang) + '/projects/' + x.s + '/';
const num = (n, lang) => { try { return new Intl.NumberFormat(LOC[lang] || 'en-GB').format(n); } catch (e) { return String(n); } };
const day = o => new Date(Date.now() - (o || 0) * 864e5).toISOString().slice(0, 10);
const median = a => { if (!a.length) return null; const s = a.slice().sort((p, q) => p - q), h = s.length >> 1; return s.length % 2 ? s[h] : Math.round((s[h - 1] + s[h]) / 2); };

// ------------------------------------------------------------------------------------------------ data
const MEMO = {};
async function file(env, name, ttl) {
  const m = MEMO[name]; if (m && Date.now() - m.t < (ttl || 600000)) return m.v;
  let v = null;
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); if (r.ok) v = await r.json(); } catch (e) { v = null; }
  MEMO[name] = { t: Date.now(), v }; return v;
}
const ymIdx = s => { const m = /^(\d{4})-(\d{2})/.exec(s || ''); return m ? +m[1] * 12 + (+m[2] - 1) : null; };
function late(ot, x) {   // months past the first handover date on record (rules of /data/on-time.json, same as kbx_cite.js)
  const p = ot && ot.projects && ot.projects[x.id]; if (!p || !p.first) return null;
  const now = ymIdx((ot.as_of_month || '') + '-01'), f = ymIdx(p.first + '-01'); if (now == null || f == null) return null;
  return { late: now - f, first: p.first, moved: p.moved || 0 };
}
async function trP(env, id, lang) { try { return await (await import('./kbx_tr.js')).trProject(env, id, lang); } catch (e) { return null; } }
export function places(ix) {   // markets of the named index, by size
  const m = new Map(); for (const x of ix.P) { const k = slug(x.mk); if (!k) continue; if (!m.has(k)) m.set(k, { s: k, mk: x.mk, co: x.co, L: [] }); m.get(k).L.push(x); }
  return [...m.values()].sort((a, b) => b.L.length - a.L.length || a.mk.localeCompare(b.mk));
}

// ------------------------------------------------------------------------------------------------ 87: answer files per place and per developer
function projLine(ix, x, tp, ot) {
  let qa = ''; try { qa = N.quickAnswer(ix, x, 'en', tp || null).replace(/\s+/g, ' ').trim(); } catch (e) { qa = ''; }
  const lm = late(ot, x);
  return '- [' + x.n + '](' + pUrl('en', x) + ')' + (qa ? ': ' + qa : '') + (lm && lm.late > 0 ? ' The first handover date on record (' + N.fd(lm.first, 'en') + ') passed ' + lm.late + ' months ago.' : '') + ' Answers: ' + ORIGIN + '/answers/' + x.s + '.md';
}
function figures(ix, L, ot, tps) {
  const cs = L.map(x => ix.caseBy.get(x.id) || {}), rv = L.filter(x => N.reviewed(ix.caseBy.get(x.id)));
  const withDate = L.filter(x => N.handoverOf(ix, x)).length, past = L.filter(x => { const l = late(ot, x); return l && l.late > 0; }).length;
  const permit = L.filter((x, i) => x.pn || (cs[i].checks || {}).permit === 2).length, scores = tps.filter(t => t && typeof t.score === 'number').map(t => t.score);
  return { n: L.length, rv: rv.length, withDate, past, permit, med: median(scores) };
}
async function placeMd(env, ix, pl) {
  const ot = await file(env, 'on-time.json'), L = pl.L.slice().sort((a, b) => a.n.localeCompare(b.n));
  const tps = await Promise.all(L.map(x => trP(env, x.id, 'en')));
  const f = figures(ix, L, ot, tps), today = N.iso(ix.updated) || day();
  const rk = (tps.find(t => t && t.ranks && t.ranks.length) || {}).ranks || [];
  const out = ['# Off-plan projects in ' + pl.mk + (pl.co && pl.co !== pl.mk ? ', ' + pl.co : '') + ': facts on record', '',
    'Canonical page: ' + ORIGIN + '/m/' + encodeURIComponent(String(pl.mk).toLowerCase().replace(/\s+/g, '-')) + '/', 'Data of ' + today + '. Licence: CC BY 4.0, attribute "Kolaboro" and link the page.', 'Rules: facts only, each with its source on the project page. Kolaboro gives no verdicts about a named company. Projects not yet reviewed carry no check results.', '',
    '## Quick answer {#answer}', '',
    'Kolaboro tracks ' + f.n + ' named off-plan project' + (f.n === 1 ? '' : 's') + ' in ' + pl.mk + ' (' + f.rv + ' reviewed). Handover date on record: ' + f.withDate + ' of ' + f.n + '. Past the first handover date on record: ' + f.past + '. ' +
      'Permit or licence number published: ' + f.permit + ' of ' + f.n + '.' + (f.med != null ? ' Median transparency score (what is published and checkable, 0 to 100): ' + f.med + '.' : ''), ''];
  if (rk.length) { out.push('## Transparency rankings {#rankings}', ''); for (const r of rk) out.push('- ' + r.p + ': ' + ORIGIN + '/rankings/transparency/' + r.s + '/'); out.push(''); }
  out.push('## Projects {#projects}', '');
  L.forEach((x, i) => out.push(projLine(ix, x, tps[i], ot)));
  out.push('', '## Sources {#sources}', '', '- ' + ORIGIN + '/data/named.json', '- ' + ORIGIN + '/data/bali-cases.json', '- ' + ORIGIN + '/data/on-time.json', '- ' + ORIGIN + '/methods/transparency-score/', '',
    '## How to cite {#cite}', '', 'Kolaboro, "Off-plan projects in ' + pl.mk + ': facts on record", ' + ORIGIN + '/answers/place/' + pl.s + '.md, data of ' + today + ', CC BY 4.0.', '');
  return out.join('\n');
}
async function devMd(env, ix, dv) {
  const ot = await file(env, 'on-time.json'), L = dv.ids.map(i => ix.byId.get(i)).filter(Boolean).sort((a, b) => a.n.localeCompare(b.n));
  const tps = await Promise.all(L.map(x => trP(env, x.id, 'en'))), f = figures(ix, L, ot, tps), today = N.iso(ix.updated) || day();
  const P = L.flatMap(x => (ix.prom[x.id] || []).map(q => q.st)), cnt = k => P.filter(s => s === k).length;
  const mks = [...new Set(L.map(x => x.mk))];
  const out = ['# ' + dv.n + ': developer facts on record', '', 'Canonical page: ' + ORIGIN + '/developers/' + dv.s + '/', 'Data of ' + today + '. Licence: CC BY 4.0, attribute "Kolaboro" and link the page.', 'Rules: facts only, each with its source on the project pages. Kolaboro gives no verdicts about a named company. The developer can reply with documents: ' + ORIGIN + '/developers/reply/', '',
    '## Quick answer {#answer}', '',
    dv.n + ' has ' + f.n + ' project' + (f.n === 1 ? '' : 's') + ' tracked by Kolaboro in ' + mks.join(', ') + ' (' + f.rv + ' reviewed). Handover date on record: ' + f.withDate + ' of ' + f.n + '. Past the first handover date on record: ' + f.past + '. Permit or licence number published: ' + f.permit + ' of ' + f.n + '.' +
      (P.length ? ' Dated promises on record: ' + P.length + ' (kept ' + cnt('kept') + ', date passed and not done ' + cnt('broken') + ', moved later ' + cnt('moved') + ', pending ' + cnt('pending') + ').' : '') + (f.med != null ? ' Median transparency score of its projects: ' + f.med + ' of 100.' : ''), '',
    '## Projects {#projects}', ''];
  L.forEach((x, i) => out.push(projLine(ix, x, tps[i], ot)));
  out.push('', '## Right of reply {#reply}', '', 'Developers never pay Kolaboro. To add a document or correct a fact: ' + ORIGIN + '/developers/reply/ . Public dashboard of what is missing: ' + ORIGIN + '/developers/' + dv.s + '/dashboard/', '',
    '## How to cite {#cite}', '', 'Kolaboro, "' + dv.n + ': developer facts on record", ' + ORIGIN + '/answers/developer/' + dv.s + '.md, data of ' + today + ', CC BY 4.0.', '');
  return out.join('\n');
}

// ------------------------------------------------------------------------------------------------ 88: per-project CSV
const csvCell = v => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
function flat(o, p, out) {
  if (o === null || o === undefined) { out.push([p, '']); return out; }
  if (Array.isArray(o)) { if (!o.length) out.push([p, '']); o.forEach((v, i) => flat(v, p + '[' + i + ']', out)); return out; }
  if (typeof o === 'object') { const k = Object.keys(o); if (!k.length) out.push([p, '']); for (const key of k) flat(o[key], p ? p + '.' + key : key, out); return out; }
  out.push([p, o]); return out;
}

// ------------------------------------------------------------------------------------------------ 91: corrections for machines (one source: the list on /corrections/)
const MON = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
const unent = s => String(s).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&rarr;/g, '→').replace(/\s+/g, ' ').trim();
async function corrections(env, shellFetch) {
  // n27t: one source for the page and for machines: /data/corrections.json (the page /corrections/ renders from it, kbx_t27.js);
  // the HTML list below is read only if that file cannot be loaded
  try {
    const r = env && env.ASSETS ? await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/corrections.json')) : null;
    if (r && r.ok) { const C = await r.json(); return (C.entries || []).map(e => ({ date: e.date || null, project_id: e.id || null, link: e.id ? ORIGIN + '/p/?id=' + encodeURIComponent(e.id) : null,
      correction: e.kind === 'pin' ? 'Map pin ' + e.after + '. ' + e.why : e.what + ': ' + (e.before ? 'changed from ' + e.before + ' to ' + e.after : 'changed to ' + e.after) + '. ' + e.why })); }
  } catch (e) {}
  let html = '';
  try { const r = await shellFetch('/corrections/'); if (r && r.ok) html = await r.text(); } catch (e) { html = ''; }
  const E = [];
  // every <li> of a list with class "clist" (the corrections log); the date comes first inside <b>, then the project id link
  for (const ol of html.match(/<(?:ol|ul)[^>]*class="[^"]*\bclist\b[^"]*"[^>]*>[\s\S]*?<\/(?:ol|ul)>/g) || []) {
    for (const li of ol.match(/<li[\s>][\s\S]*?<\/li>/g) || []) {
      const b = /<b>([\s\S]*?)<\/b>/.exec(li), head = b ? unent(b[1]) : '', dm = /(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/.exec(head) || /(\d{4})-(\d{2})-(\d{2})/.exec(head);
      const date = dm ? (dm[1].length === 4 ? dm[1] + '-' + dm[2] + '-' + dm[3] : dm[3] + '-' + (MON[dm[2].toLowerCase()] || '01') + '-' + dm[1].padStart(2, '0')) : null;
      const idm = /\b([A-Z]{2,6}-\d{3,4})\b/.exec(head), href = (/<a[^>]+href="([^"]+)"/.exec(li) || [])[1] || null;
      const text = unent(b ? li.slice(li.indexOf('</b>') + 4) : li).replace(/^[:\s]+/, '');
      if (!text) continue;
      E.push({ date, project_id: idm ? idm[1] : null, link: href ? (href.startsWith('/') ? ORIGIN + href : href) : null, correction: text });
    }
  }
  return E;
}

// ------------------------------------------------------------------------------------------------ 93, 100: counters at the edge
const TPL = [['home', /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/?)?$/], ['project', /^\/(?:[a-z]{2}\/)?projects\/[a-z0-9-]+\/$/], ['projects_index', /^\/(?:[a-z]{2}\/)?projects\/$/],
  ['developer', /^\/(?:[a-z]{2}\/)?developers\/[a-z0-9-]+\/(?:dashboard\/)?$/], ['ranking', /^\/(?:[a-z]{2}\/)?rankings\//], ['place', /^\/(?:[a-z]{2}\/)?(?:m|countries|handover|areas)\//],
  ['check', /^\/(?:[a-z]{2}\/)?check\/$/], ['compare', /^\/(?:[a-z]{2}\/)?(?:compare|vs)\//], ['guide', /^\/(?:[a-z]{2}\/)?(?:guides|stories|methods|how-we-score)\//], ['tool', /^\/(?:[a-z]{2}\/)?tools\//], ['pricing', /^\/(?:[a-z]{2}\/)?pricing\/$/]];
const TPL_NAMES = TPL.map(t => t[0]).concat(['other', '_search']);
const RV = ['new', 'd0', 'd1_7', 'd8_30', 'd31p'];
const CK = (d, k) => ORIGIN + '/__usage/v1/' + d + '/' + k;
async function inc0(k) {
  try { const c = caches.default, hit = await c.match(k), n = hit ? (+(await hit.text()) || 0) : 0;
    await c.put(k, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=3024000', 'content-type': 'text/plain' } })); } catch (e) {}
}
let CHAIN = Promise.resolve();
const inc = k => (CHAIN = CHAIN.then(() => inc0(k)));
const BOT = /bot|crawl|spider|slurp|lighthouse|headless|preview|fetch|curl|wget|python|httpclient|axios|GPT|Claude|anthropic|Perplexity|Bytespider|facebookexternalhit|meta-extern/i;
export function count(req, u, ctx) {
  if (typeof caches === 'undefined' || !ctx || !ctx.waitUntil || req.method !== 'GET') return;
  const h = req.headers;
  if (/^\/api\/v1\/search-index/.test(u.pathname)) { if (!BOT.test(h.get('user-agent') || '')) ctx.waitUntil(inc(CK(day(), '_search'))); return; }   // the search box loads this index when someone starts to type
  if (h.get('sec-fetch-dest') !== 'document' || h.get('sec-purpose') || h.get('purpose') || BOT.test(h.get('user-agent') || '')) return;   // real page loads in a browser; prefetch and prerender left out
  if (/^\/(?:admin|portal|agents\/me|backup-admin|api|__|cdn-cgi|k|data)\b/.test(u.pathname)) return;
  const t = (TPL.find(z => z[1].test(u.pathname)) || ['other'])[0];
  ctx.waitUntil(inc(CK(day(), t)));
}
async function readDays(keys, days) {
  const out = [];
  for (let i = 0; i < days; i++) {
    const d = day(i), vals = await Promise.all(keys.map(async k => { try { const r = await caches.default.match(CK(d, k)); return r ? (+(await r.text()) || 0) : 0; } catch (e) { return 0; } }));
    const o = {}; keys.forEach((k, j) => { if (vals[j]) o[k] = vals[j]; }); out.push({ date: d, counts: o });
  }
  return out;
}
async function usage(days) {
  const pv = await readDays(TPL_NAMES, days), rv = await readDays(RV.map(b => 'rv_' + b), days);
  const sum = (A, k) => A.reduce((a, r) => a + (r.counts[k] || 0), 0);
  const byTpl = {}; for (const k of TPL_NAMES.filter(k => k !== '_search')) { const v = sum(pv, k); if (v) byTpl[k] = v; }
  const R = {}; for (const b of RV) R[b] = sum(rv, 'rv_' + b);
  const sess = RV.reduce((a, b) => a + R[b], 0), back = R.d0 + R.d1_7 + R.d8_30 + R.d31p;
  return { page: ORIGIN + '/metrics/#usage', licence: 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)', at: new Date().toISOString(), days,
    note: 'Counted at the edge in the Cloudflare location that answers this request, without cookies, ids or IP addresses: only "page type + day -> count". The site has no durable counter store, so these are lower bounds for one location, kept up to 35 days, and can be lost if the location evicts them. Bots, prefetches and prerenders are left out. Counting started on 13 Nov 2026.',
    page_views_by_type: byTpl, page_views_total: Object.values(byTpl).reduce((a, b) => a + b, 0), searches_started: sum(pv, '_search'),
    return_visits: { note: 'One beacon per browser session, only from visitors who accepted analytics cookies; the browser keeps only the date of its first visit (no id). Buckets: new = first visit, d0 = again on the day of the first visit, d1_7 = first visit 1 to 7 days before, d8_30 = 8 to 30 days, d31p = more than 30 days.', sessions: sess, buckets: R, returning_share_pct: sess ? Math.round(back / sess * 1000) / 10 : null },
    per_day: pv.map((r, i) => ({ date: r.date, page_views: Object.entries(r.counts).filter(e => e[0] !== '_search').reduce((a, e) => a + e[1], 0), searches_started: r.counts._search || 0, sessions_counted: RV.reduce((a, b) => a + (rv[i].counts['rv_' + b] || 0), 0) })) };
}
export async function metricsHtml() {
  let u; try { u = await usage(28); } catch (e) { return ''; }
  const L = { home: 'Home', project: 'Project pages', projects_index: 'Project list', developer: 'Developer pages', ranking: 'Rankings', place: 'Place and country pages', check: 'Check a project', compare: 'Comparisons', guide: 'Guides and methods', tool: 'Tools', pricing: 'Pricing', other: 'Other pages' };
  const rows = Object.entries(u.page_views_by_type).sort((a, b) => b[1] - a[1]).map(([k, v]) => '<tr><td>' + esc(L[k] || k) + '</td><td style="text-align:end">' + num(v, 'en') + '</td></tr>').join('');
  const r = u.return_visits;
  return '<section class="sec" id="usage"><div class="wrap"><h2>Usage by page type, last 28 days</h2><p class="muted">Counted at the edge without cookies, ids or IP addresses, in the Cloudflare location that answered this page: lower bounds, counting since 13 Nov 2026. Bots, prefetches and prerenders are left out. <a href="/api/open/usage">JSON</a>.</p>' +
    (rows ? '<div class="tw"><table><thead><tr><th scope="col">Page type</th><th scope="col" style="text-align:end">Page views</th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<p>No page views counted in this location yet.</p>') +
    '<p>Searches started (the search index loaded): <b>' + num(u.searches_started, 'en') + '</b>.</p>' +
    '<h3>Return visits</h3><p>' + (r.sessions ? 'Of ' + num(r.sessions, 'en') + ' sessions from visitors who accepted analytics cookies, ' + r.returning_share_pct + '% came back after an earlier visit (' + num(r.buckets.d0, 'en') + ' on the same day, ' + num(r.buckets.d1_7, 'en') + ' within 7 days, ' + num(r.buckets.d8_30, 'en') + ' after 8 to 30 days, ' + num(r.buckets.d31p, 'en') + ' after more than 30 days).' : 'No sessions counted yet in this location.') + ' The browser keeps only the date of its first visit; nothing identifies a person.</p></div></section>';
}

// ------------------------------------------------------------------------------------------------ 96: developer dashboard (8 languages)
const D = {
  en: { title: '{d}: developer dashboard', lead: 'What buyers see about your projects on Kolaboro, from public data only, and what is missing. Read-only. Developers never pay Kolaboro, and paying can never change a score.', h_p: 'Your projects', th: ['Project', 'Transparency score', 'Published', 'Missing'], nr: 'not yet reviewed by us', none: 'nothing missing', send: 'Send documents', rank: '#{r} of {m} in {p}', sum: '{k} projects tracked. Median transparency score: {m} of 100.', most: 'Most often missing: {i}.', h_how: 'How to add what is missing', how: ['Open "Send documents" on the project row and prove you control the developer domain (one DNS record, free).', 'Attach the document: permit or licence, company registration, escrow or bank guarantee, plot address.', 'A person reviews it. Accepted facts appear on the project page with their source, and the score is recomputed.'], m: 'How the transparency score works', page: 'Public developer page', note: 'Scores count what is published and checkable, not quality. Data of {d}.' },
  es: { title: '{d}: panel del promotor', lead: 'Lo que ven los compradores sobre sus proyectos en Kolaboro, solo con datos públicos, y lo que falta. Solo lectura. Los promotores nunca pagan a Kolaboro, y pagar nunca cambia una puntuación.', h_p: 'Sus proyectos', th: ['Proyecto', 'Puntuación de transparencia', 'Publicado', 'Falta'], nr: 'aún no revisado por nosotros', none: 'no falta nada', send: 'Enviar documentos', rank: 'n.º {r} de {m} en {p}', sum: '{k} proyectos seguidos. Puntuación de transparencia mediana: {m} de 100.', most: 'Lo que más falta: {i}.', h_how: 'Cómo añadir lo que falta', how: ['Abra "Enviar documentos" en la fila del proyecto y demuestre que controla el dominio del promotor (un registro DNS, gratis).', 'Adjunte el documento: permiso o licencia, registro mercantil, depósito en garantía o aval bancario, dirección de la parcela.', 'Lo revisa una persona. Los datos aceptados aparecen en la página del proyecto con su fuente y la puntuación se recalcula.'], m: 'Cómo funciona la puntuación de transparencia', page: 'Página pública del promotor', note: 'Las puntuaciones miden lo publicado y comprobable, no la calidad. Datos del {d}.' },
  de: { title: '{d}: Bauträger-Übersicht', lead: 'Was Käufer auf Kolaboro über Ihre Projekte sehen, nur aus öffentlichen Daten, und was fehlt. Nur lesen. Bauträger zahlen Kolaboro nie, und Zahlungen ändern nie einen Wert.', h_p: 'Ihre Projekte', th: ['Projekt', 'Transparenzwert', 'Veröffentlicht', 'Fehlt'], nr: 'von uns noch nicht geprüft', none: 'nichts fehlt', send: 'Dokumente senden', rank: 'Platz {r} von {m} in {p}', sum: '{k} Projekte erfasst. Median des Transparenzwerts: {m} von 100.', most: 'Fehlt am häufigsten: {i}.', h_how: 'So ergänzen Sie, was fehlt', how: ['Öffnen Sie „Dokumente senden“ in der Projektzeile und weisen Sie nach, dass Sie die Domain des Bauträgers verwalten (ein DNS-Eintrag, kostenlos).', 'Hängen Sie das Dokument an: Genehmigung oder Lizenz, Handelsregister, Treuhandkonto oder Bankbürgschaft, Grundstücksadresse.', 'Ein Mensch prüft es. Angenommene Fakten erscheinen mit Quelle auf der Projektseite, und der Wert wird neu berechnet.'], m: 'So funktioniert der Transparenzwert', page: 'Öffentliche Bauträgerseite', note: 'Der Wert misst, was veröffentlicht und prüfbar ist, nicht die Qualität. Datenstand {d}.' },
  fr: { title: '{d} : tableau de bord du promoteur', lead: 'Ce que les acheteurs voient de vos projets sur Kolaboro, à partir de données publiques uniquement, et ce qui manque. Lecture seule. Les promoteurs ne paient jamais Kolaboro, et payer ne change jamais un score.', h_p: 'Vos projets', th: ['Projet', 'Score de transparence', 'Publié', 'Manquant'], nr: 'pas encore examiné par nous', none: 'rien ne manque', send: 'Envoyer des documents', rank: 'n° {r} sur {m} à {p}', sum: '{k} projets suivis. Score de transparence médian : {m} sur 100.', most: 'Le plus souvent manquant : {i}.', h_how: 'Comment ajouter ce qui manque', how: ['Ouvrez « Envoyer des documents » sur la ligne du projet et prouvez que vous contrôlez le domaine du promoteur (un enregistrement DNS, gratuit).', 'Joignez le document : permis ou licence, immatriculation de la société, séquestre ou garantie bancaire, adresse du terrain.', 'Une personne l\'examine. Les faits acceptés apparaissent sur la page du projet avec leur source et le score est recalculé.'], m: 'Comment fonctionne le score de transparence', page: 'Page publique du promoteur', note: 'Les scores mesurent ce qui est publié et vérifiable, pas la qualité. Données du {d}.' },
  nl: { title: '{d}: dashboard voor ontwikkelaars', lead: 'Wat kopers op Kolaboro over uw projecten zien, alleen uit openbare gegevens, en wat ontbreekt. Alleen lezen. Ontwikkelaars betalen Kolaboro nooit, en betalen verandert nooit een score.', h_p: 'Uw projecten', th: ['Project', 'Transparantiescore', 'Gepubliceerd', 'Ontbreekt'], nr: 'nog niet door ons beoordeeld', none: 'niets ontbreekt', send: 'Documenten sturen', rank: 'nr. {r} van {m} in {p}', sum: '{k} projecten gevolgd. Mediane transparantiescore: {m} van 100.', most: 'Ontbreekt het vaakst: {i}.', h_how: 'Zo vult u aan wat ontbreekt', how: ['Open "Documenten sturen" in de rij van het project en toon aan dat u het domein van de ontwikkelaar beheert (één DNS-record, gratis).', 'Voeg het document toe: vergunning of licentie, inschrijving van het bedrijf, derdenrekening of bankgarantie, adres van het perceel.', 'Een mens beoordeelt het. Aanvaarde feiten verschijnen met hun bron op de projectpagina en de score wordt opnieuw berekend.'], m: 'Zo werkt de transparantiescore', page: 'Openbare pagina van de ontwikkelaar', note: 'Scores meten wat gepubliceerd en controleerbaar is, niet de kwaliteit. Gegevens van {d}.' },
  ru: { title: '{d}: панель застройщика', lead: 'Что покупатели видят о ваших проектах на Kolaboro, только по открытым данным, и чего не хватает. Только просмотр. Застройщики никогда не платят Kolaboro, и оплата никогда не меняет оценку.', h_p: 'Ваши проекты', th: ['Проект', 'Оценка прозрачности', 'Опубликовано', 'Не хватает'], nr: 'ещё не проверен нами', none: 'всё есть', send: 'Отправить документы', rank: '№ {r} из {m}, {p}', sum: 'Проектов отслеживается: {k}. Медианная оценка прозрачности: {m} из 100.', most: 'Чаще всего не хватает: {i}.', h_how: 'Как добавить недостающее', how: ['Нажмите «Отправить документы» в строке проекта и подтвердите, что управляете доменом застройщика (одна DNS-запись, бесплатно).', 'Приложите документ: разрешение или лицензию, регистрацию компании, эскроу или банковскую гарантию, адрес участка.', 'Его проверяет человек. Принятые факты появляются на странице проекта с источником, и оценка пересчитывается.'], m: 'Как устроена оценка прозрачности', page: 'Публичная страница застройщика', note: 'Оценка показывает, что опубликовано и проверяемо, а не качество. Данные на {d}.' },
  zh: { title: '{d}：开发商面板', lead: '买家在 Kolaboro 上看到的您的项目信息（仅来自公开数据）以及缺少的内容。只读。开发商从不付钱给 Kolaboro，付费也永远不会改变评分。', h_p: '您的项目', th: ['项目', '透明度评分', '已公开', '缺少'], nr: '我们尚未审核', none: '没有缺少', send: '发送文件', rank: '{p}第 {r} 名（共 {m} 个）', sum: '跟踪 {k} 个项目。透明度评分中位数：{m}/100。', most: '最常缺少：{i}。', h_how: '如何补充缺少的内容', how: ['在项目行点击“发送文件”，并证明您管理开发商域名（一条 DNS 记录，免费）。', '附上文件：许可证或执照、公司注册、托管账户或银行保函、地块地址。', '由人工审核。被接受的事实会连同来源显示在项目页面上，评分随之重新计算。'], m: '透明度评分如何计算', page: '开发商公开页面', note: '评分衡量已公开且可核查的内容，而不是质量。数据日期 {d}。' },
  ar: { title: '{d}: لوحة المطوّر', lead: 'ما يراه المشترون عن مشاريعك على Kolaboro، من البيانات العامة فقط، وما ينقص. للقراءة فقط. المطوّرون لا يدفعون لـ Kolaboro أبدًا، والدفع لا يغيّر أي درجة.', h_p: 'مشاريعك', th: ['المشروع', 'درجة الشفافية', 'منشور', 'ناقص'], nr: 'لم نراجعه بعد', none: 'لا ينقص شيء', send: 'إرسال المستندات', rank: 'المرتبة {r} من {m} في {p}', sum: 'عدد المشاريع المتابَعة: {k}. الدرجة الوسيطة للشفافية: {m} من 100.', most: 'الأكثر نقصًا: {i}.', h_how: 'كيف تضيف ما ينقص', how: ['افتح "إرسال المستندات" في صف المشروع وأثبت أنك تدير نطاق المطوّر (سجل DNS واحد، مجانًا).', 'أرفق المستند: التصريح أو الترخيص، تسجيل الشركة، حساب الضمان أو الكفالة المصرفية، عنوان قطعة الأرض.', 'يراجعه شخص. تظهر الحقائق المقبولة في صفحة المشروع مع مصدرها، وتُعاد حساب الدرجة.'], m: 'كيف تُحسب درجة الشفافية', page: 'صفحة المطوّر العامة', note: 'تقيس الدرجة ما هو منشور وقابل للتحقق، لا الجودة. بيانات {d}.' } };
const dt = (lang, k, v) => { const s = (D[lang] || D.en)[k]; return v ? String(s).replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
const bdi = s => '<bdi>' + esc(s) + '</bdi>';
const fdate = (d, lang) => { try { return new Intl.DateTimeFormat(LOC[lang] || 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z')); } catch (e) { return d; } };
const CSS = '<style>.k27 .k27-tw{overflow-x:auto;border:1px solid var(--k-line,var(--line));border-radius:12px;margin:12px 0 24px}.k27 table{width:100%;border-collapse:collapse;min-width:640px}.k27 th,.k27 td{padding:10px 12px;border-bottom:1px solid var(--k-line,var(--line));text-align:start;vertical-align:top}.k27 th{font-size:.85rem}.k27 td small{display:block;color:var(--k-muted,var(--muted))}.k27 .k27-n{font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}.k27 ul.k27-m{margin:0;padding-inline-start:16px}.k27 .k27-sum{font-size:1.05rem}.k27 .k27-lk{display:flex;flex-wrap:wrap;gap:8px 18px;margin:18px 0}.k27 .k27-lk a,.k27 a.k27-b{min-height:44px;display:inline-flex;align-items:center}' +
  '@media(max-width:640px){.k27 .k27-tw{border:0;overflow:visible}.k27 table{min-width:0}.k27 thead{display:none}.k27 tr{display:block;border:1px solid var(--k-line,var(--line));border-radius:12px;margin:0 0 12px;padding:6px 0}.k27 td{display:block;border:0;padding:6px 12px}.k27 td[data-l]::before{content:attr(data-l);display:block;font-size:.8rem;color:var(--k-muted,var(--muted))}}</style>';
async function dashboard(env, ix, dv, lang) {
  const L = dv.ids.map(i => ix.byId.get(i)).filter(Boolean).sort((a, b) => a.n.localeCompare(b.n));
  const tps = await Promise.all(L.map(x => trP(env, x.id, lang))), today = N.iso(ix.updated) || day();
  const miss = new Map();
  const th = dt(lang, 'th');
  const rows = L.map((x, i) => {
    const tp = tps[i], rv = N.reviewed(ix.caseBy.get(x.id)), items = tp ? tp.items : [];
    const have = items.filter(z => z.st === 'yes'), lack = items.filter(z => z.st === 'no' || z.st === 'nc');
    for (const z of lack) miss.set(z.label, (miss.get(z.label) || 0) + 1);
    const rk = tp && tp.ranks ? tp.ranks.filter(r => r.ranked && r.r).map(r => dt(lang, 'rank', { r: r.r, m: r.m, p: r.p })) : [];
    return '<tr><td data-l="' + esc(th[0]) + '"><a href="' + pre(lang) + '/projects/' + x.s + '/">' + bdi(x.n) + '</a><small>' + esc([x.ar && x.ar !== x.mk ? x.ar : null, mkName(x.mk, lang)].filter(Boolean).join(', ')) + (rv ? '' : ' · ' + esc(dt(lang, 'nr'))) + '</small></td>' +
      '<td data-l="' + esc(th[1]) + '"><span class="k27-n">' + (tp && typeof tp.score === 'number' ? tp.score + '/100' : '?') + '</span>' + (rk.length ? '<small>' + esc(rk.join(' · ')) + '</small>' : '') + '</td>' +
      '<td data-l="' + esc(th[2]) + '">' + (have.length ? '<ul class="k27-m">' + have.map(z => '<li>' + esc(z.label) + '</li>').join('') + '</ul>' : '0') + '</td>' +
      '<td data-l="' + esc(th[3]) + '">' + (lack.length ? '<ul class="k27-m">' + lack.map(z => '<li>' + esc(z.label) + '</li>').join('') + '</ul>' : esc(dt(lang, 'none'))) + '<a class="k27-b" href="/developers/reply/?id=' + encodeURIComponent(x.id) + '">' + esc(dt(lang, 'send')) + '</a></td></tr>';
  });
  const sc = tps.filter(t => t && typeof t.score === 'number').map(t => t.score), top = [...miss.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(e => e[0]);
  const body = '<p class="k27-sum"><b>' + esc(dt(lang, 'sum', { k: num(L.length, lang), m: sc.length ? median(sc) : '?' })) + '</b>' + (top.length ? ' ' + esc(dt(lang, 'most', { i: top.join(', ') })) : '') + '</p>' +
    '<h2 id="projects">' + esc(dt(lang, 'h_p')) + '</h2><div class="k27-tw"><table><thead><tr>' + th.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>' +
    '<h2 id="how">' + esc(dt(lang, 'h_how')) + '</h2><ol>' + dt(lang, 'how').map(s => '<li>' + esc(s) + '</li>').join('') + '</ol>' +
    '<p class="k27-lk"><a href="' + pre(lang) + '/developers/' + dv.s + '/">' + esc(dt(lang, 'page')) + '</a><a href="' + pre(lang) + '/methods/transparency-score/">' + esc(dt(lang, 'm')) + '</a><a href="/answers/developer/' + dv.s + '.md">Markdown</a></p><p class="muted">' + esc(dt(lang, 'note', { d: fdate(today, lang) })) + '</p>';
  const name = dv.n || dv.s;
  return { path: '/developers/' + dv.s + '/dashboard/', title: dt(lang, 'title', { d: name }), h1: dt(lang, 'title', { d: name }), h1h: esc(dt(lang, 'title', { d: '\u0001' })).replace('\u0001', bdi(name)), lead: dt(lang, 'lead'), body, updated: today, noindex: true,
    crumbs: [['Kolaboro', '/'], [name, '/developers/' + dv.s + '/'], [dt(lang, 'title', { d: '' }).replace(/^[:：\s]+/, ''), '/developers/' + dv.s + '/dashboard/']] };
}

// ------------------------------------------------------------------------------------------------ 98: /yc/ one-minute summary (English, noindex)
async function ycPage(env, inner) {
  const j = async p => { try { const r = await inner(p); return r && r.ok ? await r.json() : null; } catch (e) { return null; } };
  const [st, pg] = await Promise.all([j('/api/open/stats'), j('/api/x/progress')]);
  let mt = null; try { mt = await rpc('kolaboro_metrics_public', {}); } catch (e) { mt = null; }
  const W = (mt && mt.weeks) || [], last = W.slice(-4), sumW = k => last.reduce((a, w) => a + (w[k] || 0), 0), T = (mt && mt.totals) || {};
  const live = (pg && pg.live) || {}, f = n => n == null ? 'n/a' : num(n, 'en');
  const days = ((pg && pg.per_day) || []).filter(d => d.total > 0), first = days[0];
  const b = '<h2 id="problem">The problem</h2><p>People buying property off-plan abroad pay deposits for buildings that do not exist yet, in a country whose registers, language and law they do not know. Developer pages are marketing; the facts that matter (permit, company, handover date record, deposit protection) are scattered across official registers.</p>' +
    '<h2 id="product">What Kolaboro does</h2><p>For every off-plan project we track, a public page with what the developer promises, what official registers and independent sources show, and what we could not verify, each fact with its source and date. Buyers who want certainty pay for a check (from 490 euros) or monthly construction monitoring (99 euros a month). Developers never pay us.</p>' +
    '<h2 id="data">The data today</h2><ul><li>' + f(st && st.projects) + ' projects in ' + f(st && st.markets) + ' markets and ' + f(st && st.countries) + ' countries' + (first ? ', up from ' + f(first.total) + ' on ' + fdate(first.d, 'en') : '') + '.</li><li>' + f(st && st.claims_total) + ' developer claims tested against registers, courts and press; ' + f(st && st.claims && st.claims.contradicted) + ' contradicted by another source.</li><li>' + f(st && st.sources) + ' sources, ' + f(st && st.data_points) + ' data points, ' + f(live.sitemap_urls) + ' public URLs in 8 languages.</li><li>Open API, MCP server, signed daily dataset: <a href="/docs/api/">/docs/api/</a>, <a href="/docs/mcp/">/docs/mcp/</a>.</li></ul>' +
    '<h2 id="shipping">Shipping daily</h2><p>' + f(live.ships_7d) + ' changes shipped and ' + f(live.deploys_7d) + ' deploys in the last 7 days. Every change is listed with its date: <a href="/progress/">/progress/</a> and <a href="/changelog/">/changelog/</a>.</p>' +
    '<h2 id="traction">Traction, as counted</h2><p>From our own database, the same numbers as <a href="/metrics/">/metrics/</a>, zeros included. Visits are one per browser session; bots are left out by user agent.</p><ul><li>Visits in the last 4 weeks: ' + f(sumW('visits')) + '.</li><li>Leads in the last 4 weeks: ' + f(sumW('leads')) + ' (all time: ' + f(T.leads) + ').</li><li>Desk reviews run in the last 4 weeks: ' + f(sumW('desk_reviews')) + '.</li><li>Paid checks so far: ' + f(T.paid_checks != null ? T.paid_checks : sumW('paid_checks')) + '. Revenue so far: ' + f(T.revenue_eur != null ? T.revenue_eur : 0) + ' euros.</li></ul><p class="muted">Usage by page type and return visits, counted at the edge since 13 Nov 2026: <a href="/metrics/#usage">/metrics/#usage</a>.</p>' +
    '<h2 id="more">More</h2><p><a href="/about/">About</a> · <a href="/independence/">Independence and conflicts of interest</a> · <a href="/pricing/">Pricing</a> · <a href="/numbers/">Kolaboro in numbers</a></p>';
  return { path: '/yc/', title: 'Kolaboro in one minute', h1: 'Kolaboro in one minute', lead: 'The problem, the data, what we ship every day, and the traction as we count it. Figures load live from our published data.', body: b, updated: (st && st.updated) || day(), noindex: true, langs: false, crumbs: [['Kolaboro', '/'], ['One-minute summary', '/yc/']] };
}

// ------------------------------------------------------------------------------------------------ page shell (same pattern as kbx_cite.js)
async function shellPage(shell, lang, o) {
  const path = o.path, canon = ORIGIN + pre(lang) + path;
  const alts = o.langs === false ? '' : LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + path + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + path + '">';
  const crumbs = o.crumbs.map(([n, p]) => [n, ORIGIN + pre(lang) + p]);
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebPage', '@id': canon + '#page', url: canon, name: o.h1, description: o.lead, inLanguage: lang, dateModified: o.updated, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] })) }] };
  const tags = '<title>' + esc(o.title) + ' | Kolaboro</title><meta name="description" content="' + esc(o.lead) + '"><link rel="canonical" href="' + canon + '">' + alts +
    '<meta name="robots" content="' + (o.noindex ? 'noindex, follow' : 'index, follow') + '"><meta property="og:type" content="website"><meta property="og:site_name" content="Kolaboro"><meta property="og:title" content="' + esc(o.title) + '"><meta property="og:description" content="' + esc(o.lead) + '"><meta property="og:url" content="' + canon + '"><meta property="og:image" content="' + ORIGIN + '/k/og/home.png"><meta name="twitter:card" content="summary_large_image">' +
    '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' + CSS;
  const main = '<section class="phero"><div class="wrap"><p class="crumb">' + crumbs.map((c, i) => i < crumbs.length - 1 ? '<a href="' + esc(c[1].replace(ORIGIN, '')) + '">' + bdi(c[0]) + '</a>' : bdi(c[0])).join(' / ') + '</p><h1>' + (o.h1h || esc(o.h1)) + '</h1><p class="lead">' + esc(o.lead) + '</p></div></section><section class="sec k27"><div class="wrap k-prose" style="max-width:none">' + o.body + '</div></section>';
  const sh = await shell(pre(lang) + '/how-we-score/');
  const res = new HTMLRewriter()
    .on('title', { element(e) { e.remove(); } })
    .on('meta[name="description"],meta[name="robots"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],link[rel="alternate"][hreflang]', { element(e) { e.remove(); } })
    .on('script[type="application/ld+json"]', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(main, { html: true }); } })
    .on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + path); } })
    .transform(new Response(sh.body, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
  const h = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=900' }; if (o.noindex) h['x-robots-tag'] = 'noindex, follow';
  return new Response(await res.text(), { status: 200, headers: h });
}

// ------------------------------------------------------------------------------------------------ routes
const txt = (body, type, extra) => new Response(body, { headers: Object.assign({ 'content-type': type, 'cache-control': 'public, max-age=900', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' }, extra || {}) });
const nf = () => new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=300' } });
export async function handle(req, u, env, ctx, shell, inner) {
  const p = u.pathname; let m;
  if (!PATHS.test(p)) return null;
  if (p === '/api/open/rv' || p === '/api/open/rv/') {   // return-visit beacon: one bucket name, nothing else is read or kept
    if (req.method !== 'POST') return new Response('POST only', { status: 405, headers: { allow: 'POST' } });
    const b = u.searchParams.get('b');
    if (RV.includes(b) && typeof caches !== 'undefined' && ctx && ctx.waitUntil && !BOT.test(req.headers.get('user-agent') || '')) ctx.waitUntil(inc(CK(day(), 'rv_' + b)));
    return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return null;
  if (p === '/api/open/usage' || p === '/api/open/usage/') { const d = Math.min(35, Math.max(1, +u.searchParams.get('days') || 28)); return txt(JSON.stringify(await usage(d), null, 1), 'application/json; charset=utf-8', { 'cache-control': 'public, max-age=300' }); }
  if (p === '/corrections.json' || p === '/corrections.md') {
    const E = await corrections(env, shell);
    const head = { page: ORIGIN + '/corrections/', licence: 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)', at: new Date().toISOString().slice(0, 10), rules: 'Every factual error we found or were shown with evidence, as logged on /corrections/. Corrections are dated; nothing is removed from this log. To request a correction: ' + ORIGIN + '/corrections/ ; developers can reply with documents on any project page.', count: E.length };
    if (p.endsWith('.json')) return txt(JSON.stringify(Object.assign(head, { corrections: E }), null, 1), 'application/json; charset=utf-8');
    const L = ['# Kolaboro: known errors and corrections', '', 'Canonical page: ' + ORIGIN + '/corrections/ . The same log as JSON: ' + ORIGIN + '/corrections.json . Licence: CC BY 4.0.', '', head.rules, '', '## Log (' + E.length + ')', ''];
    for (const e of E) L.push('- ' + (e.date || 'undated') + (e.project_id ? ', ' + e.project_id : '') + ': ' + e.correction + (e.link ? ' (' + e.link + ')' : ''));
    if (!E.length) L.push('No corrections logged yet.');
    return txt(L.join('\n') + '\n', 'text/markdown; charset=utf-8', { link: '<' + ORIGIN + '/corrections/>; rel="canonical"' });
  }
  if ((m = /^\/api\/v1\/projects\/([a-z0-9-]{1,90})\.csv$/.exec(p))) {
    let r; try { r = await inner('/api/v1/projects/' + m[1]); } catch (e) { r = null; }
    if (!r || r.status === 404) return nf();
    if (!r.ok) return new Response('Data unavailable, try again in a minute.', { status: 503, headers: { 'retry-after': '60', 'cache-control': 'no-store' } });
    const d = await r.json(), rows = flat(d, '', []);
    const out = ['# Kolaboro project record ' + (d.id || '') + ' (' + (d.name || m[1]) + '), the same facts as ' + ORIGIN + '/api/v1/projects/' + m[1] + ' . CC BY 4.0, attribute "Kolaboro" and link ' + ORIGIN + '/projects/' + m[1] + '/', 'field,value'].concat(rows.map(rw => csvCell(rw[0]) + ',' + csvCell(rw[1])));
    return txt(out.join('\n') + '\n', 'text/csv; charset=utf-8', { 'content-disposition': 'inline; filename="kolaboro-' + m[1] + '.csv"', link: '<' + ORIGIN + '/projects/' + m[1] + '/>; rel="canonical"', 'x-robots-tag': 'noindex' });
  }
  if (p === '/yc/' || p === '/yc') { if (p === '/yc') return new Response(null, { status: 301, headers: { location: '/yc/' } }); return shellPage(shell, 'en', await ycPage(env, inner)); }
  let ix; try { ix = await N.data(env); } catch (e) { return new Response('Data unavailable, try again in a minute.', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8', 'retry-after': '60', 'cache-control': 'no-store' } }); }
  if ((m = /^\/answers\/place\/([a-z0-9-]{1,90})\.md$/.exec(p))) {
    const pl = places(ix).find(z => z.s === m[1]); if (!pl) return nf();
    return txt(await placeMd(env, ix, pl), 'text/markdown; charset=utf-8', { link: '<' + ORIGIN + '/m/' + encodeURIComponent(String(pl.mk).toLowerCase().replace(/\s+/g, '-')) + '/>; rel="canonical"' });
  }
  if ((m = /^\/answers\/developer\/([a-z0-9-]{1,90})\.md$/.exec(p))) {
    const dv = ix.devs.get(m[1]); if (!dv) return nf();
    return txt(await devMd(env, ix, dv), 'text/markdown; charset=utf-8', { link: '<' + ORIGIN + '/developers/' + dv.s + '/>; rel="canonical"' });
  }
  if ((m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?developers\/([a-z0-9-]{1,90})\/dashboard(\/?)$/.exec(p))) {
    if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' } });
    const dv = ix.devs.get(m[2]); if (!dv) return null;   // falls through to the usual 404
    return shellPage(shell, m[1] || 'en', await dashboard(env, ix, dv, m[1] || 'en'));
  }
  return null;
}

// ------------------------------------------------------------------------------------------------ 90: MCP tools (called from kbx_e.js)
const cmpRow = (ix, x, tp, ot) => {
  const c = ix.caseBy.get(x.id) || {}, ho = N.handoverOf(ix, x), lm = late(ot, x), pr = (ix.prom[x.id] || []).find(q => q.k === 'handover');
  return { id: x.id, name: x.n, url: pUrl('en', x), developer: x.dv || null, place: [x.ar && x.ar !== x.mk ? x.ar : null, x.mk, x.co].filter(Boolean).join(', '), stage: c.stage || null, reviewed: N.reviewed(c),
    handover_on_record: ho ? ho.d : null, handover_times_moved: pr ? pr.mv || 0 : null, months_past_first_handover_date: lm && lm.late > 0 ? lm.late : 0, permit_number: x.pn || null, permit_published: !!(x.pn || (c.checks || {}).permit === 2),
    deposit_protection_stated: (c.checks || {}).escrow === true, transparency_score: tp && typeof tp.score === 'number' ? tp.score : null, last_checked: N.lastmod(ix, x), answers: ORIGIN + '/answers/' + x.s + '.md' };
};
export async function mcpCompare(env, list) {
  const ix = await N.data(env), ot = await file(env, 'on-time.json'), X = [], miss = [];
  for (const k of list) { const x = ix.bySlug.get(k) || ix.byId.get(String(k).toUpperCase()); if (x && !X.includes(x)) X.push(x); else if (!x) miss.push(k); }
  const tps = await Promise.all(X.map(x => trP(env, x.id, 'en')));
  return { compared: X.map((x, i) => cmpRow(ix, x, tps[i], ot)), not_found: miss, compare_page: X.length >= 2 ? ORIGIN + '/compare/?p=' + X.map(x => x.s).join(',') : null,
    rules: 'Facts only, each with its source on the project page. Kolaboro gives no verdict and no ranking of quality; the transparency score counts what is published and checkable. Projects in Sumba are never named.' };
}
export async function mcpByYear(env, a) {
  const ix = await N.data(env), ot = await file(env, 'on-time.json'), lc = s => String(s || '').toLowerCase();
  let L = ix.P.filter(x => { const ho = N.handoverOf(ix, x); return ho && hyear(ho.d) === a.year; });
  if (a.market) L = L.filter(x => lc(x.mk) === lc(a.market)); if (a.country) L = L.filter(x => lc(x.co) === lc(a.country) || lc(coName(x.co, 'en')) === lc(a.country));
  L.sort((p, q) => String(p.mk).localeCompare(String(q.mk)) || p.n.localeCompare(q.n));
  const total = L.length, page = L.slice(a.offset, a.offset + a.limit), tps = await Promise.all(page.map(x => trP(env, x.id, 'en')));
  return { year: a.year, market: a.market || null, country: a.country || null, total, offset: a.offset, limit: a.limit, projects: page.map((x, i) => cmpRow(ix, x, tps[i], ot)),
    note: 'Handover date as on record (the latest dated promise, or the date the developer publishes). Year read from dates like 2027-Q4, 2027-06 or "end of 2027".', data: ORIGIN + '/data/named.json' };
}
