import * as KB from './kolaboro.js';
import { trueLastmod, lastmodRoute } from './kbx_lastmod.js';
import { BUY_PLACES, PL as BUY_PL } from './kbx_buy_i18n.js';   // batch 27 (n27c): step-by-step buying guides per place
import { placesForCountry } from './kbx_tr_places.js';   // batch 23 (n23): links to the transparency rankings of a country's islands and cities   // batch 15 (s15b): date of the last real data change per project
import { ogImg } from './kbx_ogt.js';   // n29t: share image per page type
const { openData } = KB;

const SITE = 'https://kolaboro.com';
export const INDEXNOW_KEY = '7f3c9a1e5b2d4c8fa06e91d3b7c4f259';
export const PATHS = /^\/(sitemap_index\.xml|api\/seo\/lastmod|sitemaps\/[a-z0-9-]+\.xml|llms(-full)?\.txt|countries(\/.*)?|rankings(\/.*)?|new\/?|vs(\/.*)?|embed\/(delay|project|widgets)(\/.*)?|engineering\/seo\/?|press\/delivery-index(\/.*)?|7f3c9a1e5b2d4c8fa06e91d3b7c4f259\.txt)$/;
const LANGS = ['en', 'es', 'de', 'fr', 'ru', 'nl', 'ar', 'zh'];
const CHECKS = ['permit', 'escrow', 'progress', 'plans', 'record', 'returns_ok'];
const CKN = { permit: 'Permit or licence number', escrow: 'Deposit protection', progress: 'Construction progress', plans: 'Site or floor plans', record: 'Developer track record', returns_ok: 'No guaranteed-return language' };
const isPub = (c, k) => { const v = (c.checks || {})[k]; return k === 'permit' ? v === 2 : k === 'progress' ? v != null : v === true; };
const isConf = (c, k) => ['registry', 'independent'].includes((c.verified || {})[k]);
const ALIAS = { 'Puerto Rico (USA)': 'Puerto Rico', 'St Lucia': 'Saint Lucia', 'United States': 'USA', 'United Arab Emirates': 'UAE' };
const ctry = c => ALIAS[c] || c;
export const slug = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const slugM = m => encodeURIComponent(String(m).toLowerCase().replace(/\s+/g, '-'));   // same rule as /m/<market>/ in kolaboro.js
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const xesc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const fmt = n => Number(n || 0).toLocaleString('en-US');
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const longDate = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? (+m[3]) + ' ' + MONTHS[+m[2] - 1] + ' ' + m[1] : String(iso || ''); };
const ymIdx = s => { const m = /^(\d{4})-(\d{2})/.exec(s || ''); return m ? +m[1] * 12 + (+m[2] - 1) : null; };
const ymName = s => { const m = /^(\d{4})-(\d{2})/.exec(s || ''); return m ? MONTHS[+m[2] - 1] + ' ' + m[1] : ''; };

const MEMO = {};
async function file(env, name, ttl) {
  const m = MEMO[name]; if (m && Date.now() - m.t < (ttl || 300000)) return m.v;
  let v = null;
  try { const r = await env.ASSETS.fetch(new Request(SITE + '/_s/kolaboro.com' + name)); if (r.ok) v = /\.json$/.test(name) ? await r.json() : await r.text(); } catch (e) { v = null; }
  MEMO[name] = { t: Date.now(), v }; return v;
}
async function named(inner) {
  const m = MEMO.__named; if (m && Date.now() - m.t < 300000) return m.v;
  let v = { projects: new Map(), developers: [], all: [] };
  try {
    const r = await inner('/api/seo/urls');
    if (r && r.ok && /json/.test(r.headers.get('content-type') || '')) {
      const j = await r.json(), list = Array.isArray(j) ? j : (j.urls || j.items || []).concat(j.projects || [], j.developers || []);
      for (const it of list) {
        const loc = it.loc || it.url; if (!loc || !/^https:\/\/kolaboro\.com\//.test(loc)) continue;
        const type = it.type || (/\/developers\//.test(loc) ? 'developer' : /\/projects\//.test(loc) ? 'project' : 'page');
        const e = { loc, lastmod: it.lastmod || it.updated || null, type, id: it.id || it.public_id || it.code || null, name: it.name || it.title || null, developer: it.developer || it.developer_name || null, developer_url: it.developer_url || null, lang: it.lang || 'en', alternates: it.alternates || it.alt || null, summary: it.summary || null, sm: it.sm !== false };
        v.all.push(e);
        if (type === 'project' && e.id && (e.lang === 'en' || !v.projects.has(e.id))) v.projects.set(e.id, e);
        if (type === 'developer' && e.lang === 'en') v.developers.push(e);
      }
    }
  } catch (e) {}
  MEMO.__named = { t: Date.now(), v }; return v;
}
async function base(env, inner) {
  const d = await openData();
  const [delay, ontime, promises, drift, regs, cover, law, lh, regHtml] = await Promise.all([
    file(env, '/data/delay-index.json'), file(env, '/data/on-time.json'), file(env, '/data/promises.json'), file(env, '/data/promise-drift.json'),
    file(env, '/data/register-checks.json'), file(env, '/data/lookup-coverage.json'), file(env, '/tools/law/law.json'), file(env, '/tools/late-handover/lh.json'), file(env, '/registers/index.html', 900000)]);
  const N = await named(inner);
  const T = await trueLastmod(env).catch(() => null);
  const all0 = (d.cases || []).map(c => Object.assign({}, c, { country: ctry(c.country) }));
  const coi = all0.filter(c => /^sumba$/i.test(String(c.market || '').trim())), all = all0.filter(c => !coi.includes(c));
  const cases = all.filter(reviewed), unrev = all.filter(c => !reviewed(c));
  const byCountry = new Map(); for (const c of cases) { if (!byCountry.has(c.country)) byCountry.set(c.country, []); byCountry.get(c.country).push(c); }
  const uByCountry = new Map(); for (const c of unrev) { if (!uByCountry.has(c.country)) uByCountry.set(c.country, []); uByCountry.get(c.country).push(c); }
  const mToC = new Map(); for (const c of all) if (!mToC.has(c.market)) mToC.set(c.market, c.country);
  return { d, all, coi, cases, unrev, byCountry, uByCountry, mToC, delay, ontime, promises, drift, regs, cover, law, lh, regCards: parseRegisters(regHtml), N, T };
}
export const NOT_REVIEWED = 'Not yet reviewed by Kolaboro';
function reviewed(c) { return !!(c && c.verified && Object.values(c.verified).some(v => v && v !== 'none')); }
function parseRegisters(h) {
  const out = [];
  if (!h) return out;
  for (const a of h.split('<article class="rgc"').slice(1)) {
    const id = (/^\s*id="([^"]+)"/.exec(a) || [])[1], name = (/<h3 id="h-[^"]+">([^<]+)<\/h3>/.exec(a) || [])[1];
    if (!id || !name) continue;
    const sub = (/<span class="rgc-sub">([^<]*)<\/span>/.exec(a.slice(0, 600)) || [])[1] || null;
    const items = [];
    for (const li of a.split('<li class="rg" ').slice(1)) {
      const g = re => ((re.exec(li) || [])[1] || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
      const href = (/<a class="rg-open" href="([^"]+)"/.exec(li) || [])[1] || null;
      items.push({ name: g(/<h4>(.*?)<\/h4>/), checks: g(/^data-c="([^"]*)"/).split(/\s+/).filter(Boolean), proves: g(/What it proves<\/dt><dd>(.*?)<\/dd>/), not: g(/What it does not prove<\/dt><dd>(.*?)<\/dd>/), how: g(/How to search<\/dt><dd>(.*?)<\/dd>/), url: href && /^https?:\/\//.test(href) ? href : null });
    }
    out.push({ id, name, sub, items });
  }
  return out;
}
function regsFor(B, country) {   // register cards whose market belongs to this country, or whose name or country line is the country
  const mk = new Set((B.byCountry.get(country) || []).map(c => c.market));
  return B.regCards.filter(r => ctry(r.name) === country || (r.sub && ctry(r.sub) === country) || mk.has(r.name));
}
const LAWC = { ID: 'Indonesia', 'AE-DU': 'UAE', TH: 'Thailand', ES: 'Spain', PT: 'Portugal' };
function lawFor(B, country) {
  const rules = [];
  for (const [src, key] of [[B.law, 'law'], [B.lh, 'lh']]) {
    if (!src || !src.rules) continue;
    for (const r of src.rules) if (LAWC[r.market] === country) { const s = (src.sources || {})[r.source] || (B.law && B.law.sources || {})[r.source] || null; if (s && s.url) rules.push(Object.assign({ from: key }, r, { src: s })); }
  }
  const seen = new Set(); return rules.filter(r => !seen.has(r.id) && seen.add(r.id));
}
function lateMonths(B, c) {   // months past the first handover date on record (rules of /data/on-time.json and /data/delay-index.json)
  const p = B.ontime && B.ontime.projects && B.ontime.projects[c.id]; if (!p || !p.first) return null;
  const now = ymIdx((B.ontime.as_of_month || '') + '-01'), f = ymIdx(p.first + '-01'); if (now == null || f == null) return null;
  return { late: now - f, first: p.first, cur: p.cur, moved: p.moved || 0, overdue: p.overdue || 0, status: p.s };
}
function stats(L) {
  const n = L.length, s = { n, pub: {}, conf: {}, overdue: 0, flags: 0, contra: 0, claims: 0, delayed: 0, uc: 0, op: 0, done: 0, avg: 0, vavg: 0 };
  for (const k of CHECKS) { s.pub[k] = L.filter(c => isPub(c, k)).length; s.conf[k] = L.filter(c => isConf(c, k)).length; }
  for (const c of L) { const cl = c.claims || {}; s.contra += cl.contradicted || 0; s.claims += (cl.contradicted || 0) + (cl.verified || 0) + (cl.unverified || 0); if (c.overdue) s.overdue++; if ((c.flags || []).length) s.flags++; if (c.delay) s.delayed++; if (c.stage === 'under construction') s.uc++; else if (c.stage === 'off-plan') s.op++; else if (c.stage === 'completed') s.done++; s.avg += c.score || 0; s.vavg += c.vscore || 0; }
  s.avg = n ? s.avg / n : 0; s.vavg = n ? s.vavg / n : 0; return s;
}
function pname(B, c) { const e = B.N.projects.get(c.id); return e && e.name ? e.name : c.id; }
function tl(B, c) { const d = B.T && B.T.project.get(c.id); if (d) return d; const h = (c.history || []).map(x => x.d).filter(Boolean).sort(); return h[h.length - 1] || B.d.updated; }
function maxLm(B, L, extra) { let m = ''; for (const c of L) { const d = tl(B, c); if (d > m) m = d; } for (const e of extra || []) if (e && e > m) m = e; const today = new Date().toISOString().slice(0, 10); return m > today ? today : (m || B.d.updated); }
let HLM = null;   // path -> true lastmod of the hub being rendered (set by handle() for render())
function plink(B, c) { const e = B.N.projects.get(c.id); return e ? e.loc.replace(SITE, '') : '/p/' + encodeURIComponent(c.id) + '/'; }
const place = c => (c.region && c.region !== c.market ? c.region + ', ' : '') + c.market;

let CSS = '';   // n40 L1: the hub styles live in /data/seo-hub-css.json (loaded in handle(), once per isolate)
function h2(id, text) { return '<h2 id="' + id + '">' + esc(text) + '<a class="sx-anchor" href="#' + id + '" aria-label="Link to this section">#</a></h2>'; }
function crumbs(list) {   // [[name, path], ...] last without link
  return '<p class="crumb">' + list.map((x, i) => i < list.length - 1 ? '<a href="' + x[1] + '">' + esc(x[0]) + '</a>' : esc(x[0])).join(' / ') + '</p>';
}
function crumbLd(list) { return { '@type': 'BreadcrumbList', itemListElement: list.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x[0], item: SITE + x[1] })) }; }
function faqLd(faq) { return { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }; }
function faqHtml(faq) { return h2('faq', 'Questions and answers') + '<div class="faq">' + faq.map(([q, a]) => '<details><summary>' + esc(q) + '</summary><p>' + esc(a) + '</p></details>').join('') + '</div>'; }
const REPLY = '<div class="sx-reply" id="reply"><p><b>Are you the developer, or did we get something wrong?</b> Send documents and we add your reply or correct the record: <a href="/ask-developer/">right of reply</a> · <a href="/corrections/">corrections</a>. Every figure here is computed from the open dataset (<a href="/data/bali-cases.json">/data/bali-cases.json</a>, CC BY 4.0) and changes when the data changes.</p></div>';
function tableWrap(head, rows) {   // d12b: each cell carries its column name (data-l) so phones show rows as labelled cards
  const L = head.map(h => String(h).replace(/<[^>]+>/g, '').replace(/"/g, '&quot;'));
  const R = rows.map(r => { let i = 0; return r.replace(/<td(\s[^>]*)?>/g, (m, a) => '<td' + (a || '') + ' data-l="' + (L[i++] || '') + '">'); });
  return '<div class="sx-tw"><table class="ptable"><thead><tr>' + head.map(h => '<th scope="col">' + h + '</th>').join('') + '</tr></thead><tbody>' + R.join('') + '</tbody></table></div>'; }
const unesc = t => String(t).replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
function listLd(body) {
  let m = [...String(body).matchAll(/<tr><td[^>]*><a href="(\/[^"#]*)">([\s\S]*?)<\/a>/g)];
  if (m.length < 2) m = [...String(body).matchAll(/<li><a href="(\/[^"#]*)">([\s\S]*?)<\/a>/g)];
  const seen = new Set(), it = []; for (const x of m) { if (seen.has(x[1])) continue; seen.add(x[1]); it.push({ '@type': 'ListItem', position: it.length + 1, name: unesc(x[2]).trim(), url: SITE + x[1] }); if (it.length >= 100) break; }
  return it.length >= 2 ? { '@type': 'ItemList', numberOfItems: it.length, itemListElement: it } : null;
}
const sg1 = s => String(s).replace(/(^|[^\d.,])1 (tracked |official )?(project|register|rule)s\b/g, '$1' + '1 $2$3').replace(/(\b1 (tracked )?project) (leave|are|have|do not|make)\b/g, (m, a, b, v) => a + ' ' + { leave: 'leaves', are: 'is', have: 'has', 'do not': 'does not', make: 'makes' }[v]);
function render(P) {
  const canon = SITE + P.path;
  if (P.updated && /^\/countries\/[^/]+\/[a-z-]+\/$/.test(P.path)) P.body = '<p class="sx-src" id="byline">Researched by <a href="/team/">the Kolaboro team</a> · Checked on <time datetime="' + esc(P.updated) + '">' + longDate(P.updated) + '</time></p>' + P.body;   // n40 R01-15
  P.body = P.body.replace(/href="\/corrections\/"/g, 'href="/corrections/?page=' + encodeURIComponent(P.path) + '#request"');   // n40 R01-16
  for (const k of ['title', 'desc', 'lead', 'body']) if (P[k]) P[k] = sg1(P[k]); if (P.ld) P.ld = JSON.parse(sg1(JSON.stringify(P.ld)));   // n40 R01-01
  if ((P.type || '') === 'CollectionPage' && !(P.pageLd && P.pageLd.mainEntity) && !(P.ld || []).some(x => x && x['@type'] === 'ItemList')) { const il = listLd(P.body); if (il) P.pageLd = Object.assign({}, P.pageLd || {}, { mainEntity: il }); }
  if (P.title && P.title.length > 60) P.title = P.title.replace(/ \| Kolaboro( engineering)?$/, '');   // n29t (item 46): titles of hubs and rankings fit in 60 characters where the brand suffix is what overflows
  const ld = { '@context': 'https://schema.org', '@graph': [Object.assign({ '@type': P.type || 'WebPage', '@id': canon + '#page', url: canon, name: P.h1 || P.title, description: P.desc, inLanguage: 'en', dateModified: (HLM && HLM.get(P.path)) || P.updated, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: SITE + '/' }, publisher: { '@type': 'Organization', name: 'Kolaboro', url: SITE + '/' } }, P.pageLd || {}), crumbLd(P.crumbs)].concat(P.ld || []) };
  const head = '<title>' + esc(P.title) + '</title><meta name="description" content="' + esc(P.desc) + '"><link rel="canonical" href="' + canon + '">' +
    (P.noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1"><link rel="alternate" hreflang="en" href="' + canon + '"><link rel="alternate" hreflang="x-default" href="' + canon + '">') +
    '<meta property="og:title" content="' + esc(P.title) + '"><meta property="og:description" content="' + esc(P.desc) + '"><meta property="og:url" content="' + canon + '"><meta name="twitter:title" content="' + esc(P.title) + '"><meta name="twitter:description" content="' + esc(P.desc) + '">' +
    (P.prev ? '<link rel="prev" href="' + SITE + P.prev + '">' : '') + (P.next ? '<link rel="next" href="' + SITE + P.next + '">' : '') +   // n40 k7 (R06-08): paged hubs link their neighbours in <head>
    (P.feed ? '<link rel="alternate" type="application/rss+xml" title="' + esc(P.feed[0]) + '" href="' + esc(P.feed[1]) + '">' : '') +   // n29t (item 48): the place's own change feed
    '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' + CSS;
  const main = '<section class="phero"><div class="wrap">' + crumbs(P.crumbs) + '<h1>' + esc(P.h1 || P.title) + '</h1>' + (P.lead ? '<p class="lead">' + P.lead + '</p>' : '') + '</div></section><section class="sec sx"><div class="wrap">' + P.body + '</div></section>';
  return { head, main, status: P.status || 200, og: ogImg(P.path) };
}
async function shellOut(shell, R, cacheHdr) {
  const s = await shell('/glossary/');
  const res = new HTMLRewriter()
    .on('title', { element(e) { e.remove(); } })
    .on('meta[name="description"],meta[name="robots"],link[rel="canonical"],meta[property="og:title"],meta[property="og:description"],meta[property="og:url"],meta[name="twitter:title"],meta[name="twitter:description"],meta[name="twitter:image"],meta[property="og:image"],meta[property="og:image:width"],meta[property="og:image:height"],script[type="application/ld+json"]', { element(e) { e.remove(); } })
    .on('link[rel="alternate"][hreflang]', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(R.head + '<meta property="og:image" content="' + (R.og || SITE + '/k/og.png') + '"><meta name="twitter:image" content="' + (R.og || SITE + '/k/og.png') + '">', { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(R.main, { html: true }); } })
    .transform(s);
  const h = new Headers(res.headers); h.set('content-type', 'text/html; charset=utf-8'); h.delete('content-length'); h.delete('etag'); if (cacheHdr) h.set('cache-control', cacheHdr);
  return new Response(res.body, { status: R.status, headers: h });
}

function countryList(B) { const names = new Set([...B.byCountry.keys(), ...B.uByCountry.keys()]); return [...names].map(c => ({ c, s: slug(c), L: B.byCountry.get(c) || [], U: B.uByCountry.get(c) || [] })).sort((a, b) => b.L.length - a.L.length || b.U.length - a.U.length || a.c.localeCompare(b.c)); }
function unrevSection(B, U) { return U.length ? h2('not-reviewed', 'Added, not yet reviewed') + '<p>' + U.length + ' project' + (U.length === 1 ? ' was' : 's were') + ' added to tracking and ' + (U.length === 1 ? 'has' : 'have') + ' not been read by our research agent yet. We show no score or check results for them until we have.</p>' + tableWrap(['Project', 'Where', 'Status'], U.slice().sort((a, b) => a.id.localeCompare(b.id)).map(c => '<tr><td><a href="' + plink(B, c) + '">' + esc(pname(B, c)) + '</a></td><td>' + esc(place(c)) + '</td><td>' + NOT_REVIEWED + '</td></tr>')) : ''; }
function coiNote(B) { return B.coi && B.coi.length ? '; ' + B.coi.length + ' of them, in Sumba, are counted here but listed only in the <a href="/rankings/transparency/sumba/">transparency ranking</a> (a Kolaboro founder develops a project there: <a href="/independence/">conflict of interest</a>)' : ''; }
function findCountry(B, s) { return countryList(B).find(x => x.s === s) || null; }
const SAFE_MIN = 5, THIN_MIN = 3;   // n40 R03-06: how-to-check pages of countries with 1-2 projects are noindex,follow and kept out of sitemaps

function pCountries(B) {
  const list = countryList(B), up = B.d.updated;
  const rows = list.map(x => { const s = stats(x.L), mk = new Set(x.L.concat(x.U).map(c => c.market)).size; return '<tr><td><a href="/countries/' + x.s + '/">' + esc(x.c) + '</a></td><td>' + x.L.length + (x.U.length ? ' <small>+' + x.U.length + ' not yet reviewed</small>' : '') + '</td><td>' + mk + '</td><td>' + (s.n ? pct(s.pub.permit, s.n) + '%' : '-') + '</td><td>' + (s.n ? pct(s.pub.escrow, s.n) + '%' : '-') + '</td><td>' + (s.n ? s.overdue : '-') + '</td><td>' + (x.L.length ? '<a href="/countries/' + x.s + '/how-to-check/">How to check</a>' : '') + '</td></tr>'; });
  const S = stats(B.cases);
  const body = '<div class="sx-sum" id="summary"><p><b>Kolaboro tracks ' + fmt(B.all.length + B.coi.length) + ' off-plan projects in ' + list.length + ' countries and ' + (new Set(B.all.map(c => c.market)).size + (B.coi.length ? 1 : 0)) + ' markets</b> (data of ' + longDate(up) + ')' + coiNote(B) + (B.unrev.length ? '; ' + fmt(B.unrev.length) + ' of them were added recently and are not yet reviewed, so the figures below cover the ' + fmt(B.cases.length) + ' reviewed projects' : '') + '. For each project we record what the developer publishes on six buyer checks and whether an official register or independent source confirms it.</p><p>Across all countries, ' + pct(S.pub.permit, S.n) + '% of projects publish a permit or licence number, ' + pct(S.pub.escrow, S.n) + '% state deposit protection, and ' + S.overdue + ' are past the handover date they currently advertise.</p></div>' +
    h2('countries', 'Every country we track') + '<div class="sx-cf"><label for="sx-cfq">Find a country</label><input id="sx-cfq" type="search" autocomplete="off" placeholder="Type a country name" aria-controls="sx-ctb"><p id="sx-cfn" class="sx-cfn" aria-live="polite"></p></div>' +
    tableWrap(['Country', 'Reviewed projects', 'Markets', 'Permit number public', 'Deposit protection stated', 'Past advertised handover', 'Guide'], rows) +
    '<script>(function(){var q=document.getElementById("sx-cfq"),n=document.getElementById("sx-cfn"),t=document.querySelector(".sx-cf ~ .sx-tw"),R=t?[].slice.call(t.querySelectorAll("tbody tr")):[];if(!R.length)return;t.querySelector("tbody").id="sx-ctb";function f(s){return String(s).normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}q.addEventListener("input",function(){var v=f(q.value.trim()),k=0;R.forEach(function(r){var on=!v||f(r.cells[0].textContent).indexOf(v)>=0;r.style.display=on?"":"none";if(on)k++});n.textContent=v?(k?k+" of "+R.length+" countries":"No country matches. Try another spelling."):""})})();</script>' +
    h2('more', 'More ways in') + '<ul class="sx-chips"><li><a href="/rankings/most-delayed/">Most delayed projects</a></li><li><a href="/rankings/changed-promises/">Most changed promises</a></li><li><a href="/new/">New this month</a></li><li><a href="/m/">Market files</a></li><li><a href="/registers/">Official registers</a></li><li><a href="/regulators/">For regulators</a></li><li><a href="/index/delays/">Delivery-delay index</a></li><li><a href="/database/">The database</a></li><li><a href="/countries/foreign-buyers/">Buying as a foreigner: markets compared</a></li><li><a href="/buyer-protection-law/">Buyer protection compared</a></li><li><a href="/sources/">Where our facts come from</a></li></ul>' + REPLY;
  return render({ path: '/countries/', title: 'Off-plan property by country: ' + list.length + ' countries, ' + fmt(B.all.length + B.coi.length) + ' projects tracked | Kolaboro', h1: 'Off-plan property checks by country', lead: 'What developers publish, what official registers confirm and how late handovers are, country by country.', desc: 'Off-plan projects tracked in ' + list.length + ' countries: permit numbers, deposit protection, delays and official registers for each. Data of ' + longDate(up) + '.', updated: up, type: 'CollectionPage', crumbs: [['Kolaboro', '/'], ['Countries', '/countries/']], body,
    pageLd: { mainEntity: { '@type': 'ItemList', numberOfItems: list.length, itemListElement: list.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.c, url: SITE + '/countries/' + x.s + '/' })) } } });
}
function projectRows(B, L, max) {
  return L.slice().sort((a, b) => (b.score - a.score) || a.id.localeCompare(b.id)).slice(0, max || 400).map(c => {
    const lm = lateMonths(B, c);
    return '<tr><td><a href="' + plink(B, c) + '">' + esc(pname(B, c)) + '</a>' + (B.N.projects.get(c.id) ? ' <small>' + esc(c.id) + '</small>' : '') + '</td><td>' + esc(place(c)) + '</td><td>' + esc(c.stage || 'not stated') + '</td><td>' + (c.done || 'not published') + '</td><td>' + c.score + '/6</td><td>' + (c.vscore || 0) + '/6</td><td>' + (lm && lm.late > 0 ? lm.late + ' months' : lm ? 'not past' : 'no date') + '</td></tr>';
  });
}
const PHEAD = ['Project', 'Where', 'Stage', 'Handover year advertised', 'Checks public', 'Confirmed by register or independent source', 'Past first handover date on record'];
function pCountryUnrev(B, x) {
  const { c: C, s: S, U } = x, up = B.d.updated, mk = [...new Set(U.map(c => c.market))];
  const body = '<div class="sx-sum" id="summary"><p><b>Kolaboro has added ' + U.length + ' off-plan project' + (U.length === 1 ? '' : 's') + ' in ' + esc(C) + ' to its tracking.</b> None has been read by our research agent yet, so this page shows no scores or check results. Data of ' + longDate(up) + '.</p></div>' + h2('markets', 'Markets in ' + C) + '<ul class="sx-chips">' + mk.map(m => '<li><a href="/m/' + slugM(m) + '/">' + esc(m) + '</a></li>').join('') + '</ul>' + unrevSection(B, U) + '<p><a href="/countries/">All countries</a> · <a href="/registers/">Official registers</a> · <a href="/check/">Free check</a></p>' + REPLY;
  return render({ path: '/countries/' + S + '/', title: 'Off-plan projects in ' + C + ' tracked by Kolaboro | Kolaboro', h1: 'Off-plan projects in ' + C, lead: U.length + ' project' + (U.length === 1 ? '' : 's') + ' added, not yet reviewed.', desc: 'Off-plan projects in ' + C + ' added to Kolaboro tracking, not yet reviewed by our research agent. Data of ' + longDate(up) + '.', updated: up, type: 'CollectionPage', crumbs: [['Kolaboro', '/'], ['Countries', '/countries/'], [C, '/countries/' + S + '/']], body });
}
function pCountry(B, x) {
  if (!x.L.length) return pCountryUnrev(B, x);
  const { c: C, s: S, L, U } = x, st = stats(L), up = B.d.updated, n = L.length;
  const mk = [...new Set(L.map(c => c.market))].map(m => ({ m, n: L.filter(c => c.market === m).length })).sort((a, b) => b.n - a.n);
  const lates = L.map(c => ({ c, lm: lateMonths(B, c) })).filter(o => o.lm && o.lm.late > 0).sort((a, b) => b.lm.late - a.lm.late);
  const dm = (B.delay && B.delay.markets || []).filter(r => mk.some(o => o.m === r.market));
  const pm = (B.promises && B.promises.markets || []).filter(r => mk.some(o => o.m === r.market));
  const regs = regsFor(B, C), laws = lawFor(B, C);
  const kv = '<div class="sx-kv"><div><b>' + n + '</b><span>projects reviewed</span></div><div><b>' + mk.length + '</b><span>markets</span></div><div><b>' + pct(st.pub.permit, n) + '%</b><span>publish a permit or licence number</span></div><div><b>' + pct(st.pub.escrow, n) + '%</b><span>state deposit protection</span></div><div><b>' + lates.length + '</b><span>past the first handover date on record</span></div><div><b>' + fmt(st.contra) + '</b><span>developer claims contradicted by another source</span></div></div>';
  let body = '<ul class="sx-chips" id="guides"><li><a href="/countries/' + S + '/how-to-check/">How to check a project in ' + esc(C) + '</a></li>' + (n >= SAFE_MIN ? '<li><a href="/countries/' + S + '/is-it-safe/">Is it safe to buy off-plan in ' + esc(C) + '?</a></li>' : '') + (laws.length ? '<li><a href="/countries/' + S + '/buyer-protection-law/">Buyer protection law in ' + esc(C) + '</a></li>' : '') + placesForCountry(C).map(P => '<li><a href="/rankings/transparency/' + P.s + '/">Transparency ranking: ' + esc(P.n) + '</a></li>').join('') + '<li><a href="/guides/">All guides</a></li></ul>' + '<div class="sx-sum" id="summary"><p><b>In ' + esc(C) + ', Kolaboro has reviewed ' + n + ' off-plan project' + (n === 1 ? '' : 's') + ' in ' + mk.length + ' market' + (mk.length === 1 ? '' : 's') + '</b>' + (U.length ? ' (' + U.length + ' more added, not yet reviewed)' : '') + ' (' + st.op + ' off-plan, ' + st.uc + ' under construction' + (st.done ? ', ' + st.done + ' completed' : '') + '). On average ' + st.avg.toFixed(1) + ' of 6 buyer checks are public and ' + st.vavg.toFixed(1) + ' are confirmed by an official register or independent source.</p><p>' + lates.length + ' project' + (lates.length === 1 ? ' is' : 's are') + ' past the first handover date we have on record; ' + st.overdue + ' ' + (st.overdue === 1 ? 'is' : 'are') + ' past the date currently advertised. Data of ' + longDate(up) + '.</p></div>' + kv;
  const mkU = [...new Set(U.map(c => c.market))].filter(m => !mk.some(o => o.m === m));   // n29t (item 36): markets with only not-yet-reviewed projects were linked from nowhere (orphan /m/ pages)
  body += h2('markets', 'Markets in ' + C) + '<ul class="sx-chips">' + mk.map(o => '<li><a href="/m/' + slugM(o.m) + '/">' + esc(o.m) + ' (' + (o.n + U.filter(z => z.market === o.m).length) + ')</a></li>').join('') + mkU.map(m => '<li><a href="/m/' + slugM(m) + '/">' + esc(m) + ' (' + U.filter(c => c.market === m).length + ' not yet reviewed)</a></li>').join('') + '</ul>';
  { const k = (B.coi || []).filter(c => c.country === C).length; if (k) body += '<p class="muted">Some projects in this country are not listed on this page because of a <a href="/independence/">conflict of interest</a>. Site totals include them.</p>'; }   // n29q
  body += h2('projects', 'Off-plan projects tracked in ' + C) + '<p class="muted">Sorted by the number of buyer checks the developer makes public. Facts as advertised, checked against registers where we could; "not published" means we found no public source.</p>' + tableWrap(PHEAD, projectRows(B, L)) + unrevSection(B, U);
  if (lates.length) body += h2('delays', 'Furthest past the first handover date') + '<ol class="sx-l">' + lates.slice(0, 10).map(o => '<li><a href="' + plink(B, o.c) + '">' + esc(pname(B, o.c)) + '</a> (' + esc(o.c.market) + '): first handover on record ' + ymName(o.lm.first + '-01') + ', ' + o.lm.late + ' months ago' + (o.lm.moved ? '; date moved ' + o.lm.moved + ' months in total' : '') + '</li>').join('') + '</ol><p class="sx-src">Source: <a href="/data/on-time.json">/data/on-time.json</a> (as of ' + esc(B.ontime.as_of_month) + '). <a href="/rankings/most-delayed/">All markets</a></p>';
  if (dm.length) body += h2('delay-index', 'Delivery-delay index') + tableWrap(['Market', 'Tracked', 'With a date', 'Past first date', 'Share past first date', 'Median months late'], dm.map(r => '<tr><td>' + esc(r.market) + '</td><td>' + r.tracked + '</td><td>' + r.with_date + '</td><td>' + r.past_first + '</td><td>' + (r.share_past_first == null ? 'too few' : r.share_past_first + '%') + '</td><td>' + (r.median_late == null ? 'too few' : r.median_late) + '</td></tr>')) + '<p class="sx-src">Source: <a href="/index/delays/">delivery-delay index</a>, <a href="/data/delay-index.json">/data/delay-index.json</a>.</p>';
  if (pm.length) body += h2('promises', 'Dated promises: kept, broken, moved') + tableWrap(['Market', 'Promises', 'Kept', 'Broken', 'Moved', 'Pending'], pm.map(r => '<tr><td>' + esc(r.market) + '</td><td>' + r.promises + '</td><td>' + r.kept + '</td><td>' + r.broken + '</td><td>' + r.moved + '</td><td>' + r.pending + '</td></tr>')) + '<p class="sx-src">Each promise is an exact quote from the developer page or research record: <a href="/promises/">promise tracker</a>, <a href="/data/promises.json">/data/promises.json</a>.</p>';
  body += h2('registers', 'Official registers for ' + C) + (regs.length ? regs.map(r => r.items.map(it => regItem(it, r, B)).join('')).join('') : '<p>We have not yet documented an official online register for ' + esc(C) + '. Ask the developer for the permit number and the document that protects your deposit, then check them with the issuing authority; <a href="/registers/">see the registers we cover</a>.</p>');
  const faq = [
    ['How many off-plan projects does Kolaboro track in ' + C + '?', n + ' projects in ' + mk.length + ' market' + (mk.length === 1 ? '' : 's') + ' (' + mk.slice(0, 5).map(o => o.m).join(', ') + '), data of ' + longDate(up) + '.'],
    ['How many off-plan projects in ' + C + ' publish a permit or licence number?', st.pub.permit + ' of ' + n + ' (' + pct(st.pub.permit, n) + '%). ' + st.conf.permit + ' are confirmed in an official register or by an independent source.'],
    ['How many off-plan projects in ' + C + ' state deposit protection such as escrow?', st.pub.escrow + ' of ' + n + ' (' + pct(st.pub.escrow, n) + '%).'],
    ['Are off-plan projects in ' + C + ' delivered late?', lates.length + ' of ' + n + ' tracked projects are past the first handover date on record' + (lates.length ? ', the furthest by ' + lates[0].lm.late + ' months' : '') + '. ' + st.overdue + ' are past the date they currently advertise.']
  ];
  if (regs.length) faq.push(['Which official registers can I use to check a project in ' + C + '?', regs.flatMap(r => r.items.map(i => i.name)).slice(0, 6).join('; ') + '.']);
  body += faqHtml(faq);
  body += h2('related', 'Related') + '<ul class="sx-chips">' + related(B, x).map(o => '<li><a href="/countries/' + o.s + '/">' + esc(o.c) + '</a></li>').join('') + '<li><a href="/countries/">All countries</a></li></ul>' + REPLY;
  return render({ path: '/countries/' + S + '/', title: 'Off-plan projects in ' + C + ': ' + n + ' checked, permits and delays | Kolaboro', h1: 'Off-plan projects in ' + C, lead: 'Facts from ' + (n + U.length) + ' tracked project' + (n + U.length === 1 ? '' : 's') + ': what developers publish, what registers confirm, and how late handovers are.', desc: n + ' off-plan projects in ' + C + ' checked: ' + pct(st.pub.permit, n) + '% publish a permit number, ' + pct(st.pub.escrow, n) + '% deposit protection, ' + lates.length + ' past the first handover date. Data of ' + longDate(up) + '.', updated: up, type: 'CollectionPage', feed: ['Kolaboro: ' + C, '/feed.xml?market=' + encodeURIComponent(C)], crumbs: [['Kolaboro', '/'], ['Countries', '/countries/'], [C, '/countries/' + S + '/']], body,
    pageLd: { about: { '@type': 'Country', name: C }, mainEntity: { '@type': 'ItemList', numberOfItems: n, itemListElement: L.slice(0, 100).map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: pname(B, c), url: SITE + plink(B, c) })) } }, ld: [faqLd(faq)] });
}
function related(B, x) {   // countries sharing a register region or, failing that, of similar size
  const all = countryList(B).filter(o => o.s !== x.s);
  return all.sort((a, b) => Math.abs(a.L.length - x.L.length) - Math.abs(b.L.length - x.L.length)).slice(0, 6);
}
function rck(B, url) {   // n40 k6: date and answer of the latest re-read of a register link (/data/register-checks.json recheck)
  const R = B && B.regs && B.regs.recheck, v = R && R.urls && (R.urls[url] || R.urls[url.replace(/\/$/, '')] || R.urls[url + '/']); if (!v) return '';
  const k = v[0] >= 200 && v[0] < 400 ? 't_ok' : v[0] >= 400 ? 't_blk' : 't_e';
  return ' <span class="sx-src">' + esc(String(R[k] || '').replace('{d}', longDate(R.at)).replace('{s}', v[0])) + '</span>';
}
function regItem(it, r, B) {
  return '<div class="sx-reg"><h3>' + esc(it.name) + ' <small>(' + esc(r.name) + ')</small></h3><dl>' + (it.proves ? '<dt>What it proves</dt><dd>' + esc(it.proves) + '</dd>' : '') + (it.not ? '<dt>What it does not prove</dt><dd>' + esc(it.not) + '</dd>' : '') + (it.how ? '<dt>How to search</dt><dd>' + esc(it.how) + '</dd>' : '') + '</dl>' + (it.url ? '<p><a href="' + esc(it.url) + '" rel="noopener" target="_blank">Open the official register<span class="sr-only"> (opens in a new tab)</span></a> <span class="sx-src">' + esc(new URL(it.url).hostname) + '</span>' + rck(B, it.url) + '</p>' : '<p class="sx-src">No public online search; ask the authority directly.</p>') + '<p class="sx-src">From <a href="/registers/#' + esc(r.id) + '">our register guide</a>.</p></div>';
}
function qTemplate(q) { return String(q).replace(/\b(19|20)\d{2}\b/g, '<year>').replace(/\b\d+([.,]\d+)?\s*(%|years?|months?)/gi, '<n> $2').replace(/\$?\d[\d,.]*/g, '<n>'); }
function srcBox(B, C, laws, regs) {   // n40 R01-40: official links first, the date we read each one, and an archived copy
  const rc = new Map(((B.regs && B.regs.registers) || []).map(r => [r.url, r.probed_at])), seen = new Set(), L = [];
  for (const r of regs || []) for (const it of r.items) if (it.url && !seen.has(it.url)) { seen.add(it.url); L.push([it.name, it.url, rc.get(it.url), 'register']); }
  for (const r of laws || []) if (!seen.has(r.src.url)) { seen.add(r.src.url); L.push([r.src.law, r.src.url, B.law && B.law.version, 'law']); }
  if (!L.length) return '';
  return h2('sources', 'Sources') + '<p class="muted">Official sources first, with the date we last read each one and a link to an archived copy.</p><ol class="sx-l">' + L.map(o => '<li><a href="' + esc(o[1]) + '" rel="noopener">' + esc(o[0]) + '</a> <small>' + esc(new URL(o[1]).hostname) + (o[2] ? ' · ' + (o[3] === 'register' ? 'checked on ' : 'read on ') + '<time datetime="' + esc(String(o[2]).slice(0, 10)) + '">' + longDate(String(o[2]).slice(0, 10)) + '</time>' : '') + ' · <a href="https://web.archive.org/web/2026/' + esc(o[1]) + '" rel="nofollow noopener">archived copy</a></small></li>').join('') + '</ol><p class="sx-src">Data files: <a href="/data/register-checks.json">/data/register-checks.json</a>, <a href="/tools/law/law.json">/tools/law/law.json</a>.</p>';
}
function pCheck(B, x) {
  const { c: C, s: S, L } = x, st = stats(L), n = L.length, up = B.d.updated, regs = regsFor(B, C), laws = lawFor(B, C);
  const cov = (B.cover && B.cover.countries || []).find(o => ctry(o.country.replace(/\s*\(.*$/, '')) === C) || null;
  const qs = new Map(); for (const c of L) for (const q of (c.q || [])) { const t = qTemplate(q); const o = qs.get(t) || { t, n: 0, ex: q }; o.n++; qs.set(t, o); }
  const topQ = [...qs.values()].sort((a, b) => b.n - a.n).slice(0, 8);
  const gaps = CHECKS.map(k => ({ k, miss: n - st.pub[k], conf: st.conf[k] })).sort((a, b) => b.miss - a.miss);
  let body = '<div class="sx-sum" id="summary"><p><b>To check an off-plan project in ' + esc(C) + ', match what the developer tells you against the official record before each payment.</b> ' + (regs.length ? 'Start with the ' + regs.reduce((a, r) => a + r.items.length, 0) + ' official register' + (regs.reduce((a, r) => a + r.items.length, 0) === 1 ? '' : 's') + ' listed below' : 'We have not documented an official online register here yet, so ask for documents and verify them with the issuing authority') + ', then ask the questions that the ' + n + ' project' + (n === 1 ? '' : 's') + ' we track in ' + esc(C) + ' most often leave open.</p><p>The check most often missing in ' + esc(C) + ': ' + CKN[gaps[0].k].toLowerCase() + ' (not public for ' + gaps[0].miss + ' of ' + n + ' projects).</p></div>';
  body += '<ol class="sx-toc"><li><a href="#registers">Official registers</a></li><li><a href="#gaps">What projects here leave out</a></li><li><a href="#questions">Questions to ask the developer</a></li>' + (cov ? '<li><a href="#lookup">What our live lookup reads</a></li>' : '') + (laws.length ? '<li><a href="#law">The law, quoted</a></li>' : '') + '<li><a href="#next">Free check</a></li><li><a href="#faq">Questions and answers</a></li></ol>';
  body += h2('registers', 'Step 1: official registers in ' + C) + (regs.length ? regs.map(r => r.items.map(it => regItem(it, r, B)).join('')).join('') : '<p>No official online register documented yet for ' + esc(C) + '. Ask for the building permit and any sales licence, the land title, and the contract clause or bank document that protects your deposit, and confirm each with the authority that issued it. Our <a href="/registers/">register guide</a> lists the countries we cover.</p>');
  body += h2('gaps', 'Step 2: what off-plan projects in ' + C + ' leave out') + '<p>Share of the ' + n + ' tracked projects that make each check public, and how many are confirmed by an official register or independent source.</p>' + tableWrap(['Check', 'Public', 'Not public', 'Confirmed'], CHECKS.map(k => '<tr><td>' + CKN[k] + '</td><td>' + st.pub[k] + ' (' + pct(st.pub[k], n) + '%)</td><td>' + (n - st.pub[k]) + '</td><td>' + st.conf[k] + '</td></tr>'));
  body += h2('questions', 'Step 3: questions to ask the developer') + (topQ.length ? '<p>The questions our research agent raised most often for projects in ' + esc(C) + ', with how many projects they apply to. Each one points at a gap in what the developer publishes.</p><ol class="sx-l">' + topQ.map(o => '<li>' + esc(o.ex) + ' <small>(' + o.n + ' of ' + n + ' projects)</small></li>').join('') + '</ol>' : '<p>No open questions recorded yet for projects here.</p>') + '<p>Send them in writing: <a href="/ask-developer/">ask the developer with our template</a>.</p>';
  if (cov) body += h2('lookup', 'What our live lookup reads in ' + C) + '<p class="muted">' + esc(cov.country) + '. Online means our lookup queries the official source itself; manual means a person checks it.</p>' + ['online', 'manual', 'needs_key'].map(k => (cov[k] || []).length ? '<h3>' + ({ online: 'Read online, automatically', manual: 'Checked by hand', needs_key: 'Waiting for official API access' })[k] + '</h3><ul class="sx-l">' + cov[k].map(o => '<li>' + esc(o.what) + ': ' + (o.url ? '<a href="' + esc(o.url) + '" rel="noopener">' + esc(o.source) + '</a>' : esc(o.source)) + '</li>').join('') + '</ul>' : '').join('') + ((cov.site_visit || []).length ? '<h3>Needs a site visit</h3><ul class="sx-l">' + cov.site_visit.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>' : '');
  if (laws.length) body += h2('law', 'The law, quoted') + '<p>' + laws.length + ' rule' + (laws.length === 1 ? '' : 's') + ' from official sources. <a href="/countries/' + S + '/buyer-protection-law/">Read them with the quoted text</a>.</p><ul class="sx-l">' + laws.slice(0, 6).map(r => '<li>' + esc(r.title) + ' <small>(' + esc(r.src.law) + (r.cite ? ', ' + esc(r.cite) : '') + ')</small></li>').join('') + '</ul>';
  body += h2('next', 'Step 4: run a free check') + '<p>Paste the project page into <a href="/check/">the free desk review</a>: our agent reads it, quotes every claim and looks it up in the registers above where it can. Then see <a href="/countries/' + S + '/">all projects we track in ' + esc(C) + '</a>.</p>';
  { const G = BUY_PLACES.filter(P => P.c === C); if (G.length) body += '<p>Step by step, with the official sources: ' + G.map(P => '<a href="/guides/buying-off-plan/' + P.s + '/">buying off-plan ' + esc(BUY_PL[P.s].in.en) + '</a>').join(', ') + '.</p>'; }   // n27c
  const faq = [['What should I check before buying off-plan in ' + C + '?', 'The permit or licence number, deposit protection, construction progress, plans, the developer\'s track record and any guaranteed-return promise. In ' + C + ' the check most often missing is ' + CKN[gaps[0].k].toLowerCase() + ' (' + gaps[0].miss + ' of ' + n + ' tracked projects do not publish it).'],
    ['Is there an official register to check an off-plan project in ' + C + '?', regs.length ? 'Yes: ' + regs.flatMap(r => r.items.map(i => i.name)).slice(0, 5).join('; ') + '.' : 'We have not documented an official online register for ' + C + ' yet; verify documents with the issuing authority.'],
    ['What do developers in ' + C + ' most often leave unanswered?', topQ.length ? topQ[0].ex + ' (' + topQ[0].n + ' of ' + n + ' projects).' : 'No open questions recorded yet.']];
  body += srcBox(B, C, laws, regs) + faqHtml(faq) + REPLY;
  return render({ noindex: x.L.length < THIN_MIN, path: '/countries/' + S + '/how-to-check/', title: 'How to check an off-plan project in ' + C + ': registers and questions | Kolaboro', h1: 'How to check an off-plan project in ' + C, lead: 'Official registers, what local projects leave out and the questions to ask, from ' + n + ' tracked project' + (n === 1 ? '' : 's') + '.', desc: 'Checking off-plan property in ' + C + ': ' + (regs.length ? regs.reduce((a, r) => a + r.items.length, 0) + ' official registers with links, ' : '') + 'what ' + n + ' tracked projects leave out, and the questions to ask the developer.', updated: up, crumbs: [['Kolaboro', '/'], ['Countries', '/countries/'], [C, '/countries/' + S + '/'], ['How to check', '/countries/' + S + '/how-to-check/']], body, ld: [faqLd(faq)] });
}
function pSafe(B, x) {
  const { c: C, s: S, L } = x, st = stats(L), n = L.length, up = B.d.updated, laws = lawFor(B, C);
  const lates = L.map(c => lateMonths(B, c)).filter(o => o && o.late > 0), closed = L.map(c => (B.ontime.projects || {})[c.id]).filter(p => p && p.s && p.s !== 'open');
  const pm = (B.promises && B.promises.markets || []).filter(r => L.some(c => c.market === r.market)), P = pm.reduce((a, r) => { for (const k of ['promises', 'kept', 'broken', 'moved', 'pending']) a[k] = (a[k] || 0) + (r[k] || 0); return a; }, {});
  const flagged = L.filter(c => (c.flags || []).length);
  let body = '<div class="sx-sum" id="summary"><p><b>Whether buying off-plan in ' + esc(C) + ' is safe depends on the project, and the public record differs a lot between projects.</b> Of the ' + n + ' projects we track, ' + pct(st.pub.permit, n) + '% publish a permit or licence number, ' + pct(st.pub.escrow, n) + '% state deposit protection and ' + lates.length + ' are past the first handover date on record.</p><p>We found ' + fmt(st.contra) + ' developer claims contradicted by another source out of ' + fmt(st.claims) + ' tested' + (flagged.length ? ', and public reports of problems for ' + flagged.length + ' project' + (flagged.length === 1 ? '' : 's') : '') + '. This page reports facts; it is not a rating of any company.</p></div>';
  body += '<div class="sx-kv"><div><b>' + pct(st.pub.permit, n) + '%</b><span>publish a permit number</span></div><div><b>' + pct(st.pub.escrow, n) + '%</b><span>state deposit protection</span></div><div><b>' + lates.length + '</b><span>past first handover date</span></div><div><b>' + (P.promises || 0) + '</b><span>dated promises tracked</span></div><div><b>' + (P.broken || 0) + '</b><span>promises broken</span></div><div><b>' + pct(st.contra, st.claims) + '%</b><span>of tested claims contradicted</span></div></div>';
  body += h2('delivery', 'Delivery record') + '<p>' + lates.length + ' of ' + n + ' projects are past the first handover date on record' + (lates.length ? ' (median ' + median(lates.map(o => o.late)) + ' months)' : '') + '. ' + closed.length + ' project' + (closed.length === 1 ? ' has' : 's have') + ' a first handover date more than six months in the past, the group used for the on-time odds on <a href="/index/delays/">the delay index</a>.</p>';
  if (P.promises) body += '<p>Dated promises (handover, construction start, permits): ' + P.promises + ' tracked, ' + (P.kept || 0) + ' kept, ' + (P.broken || 0) + ' broken, ' + (P.moved || 0) + ' moved to a later date, ' + (P.pending || 0) + ' still ahead. <a href="/promises/">How promises are tracked</a>.</p>';
  body += h2('disclosure', 'What developers make public') + tableWrap(['Check', 'Public', 'Confirmed by register or independent source'], CHECKS.map(k => '<tr><td>' + CKN[k] + '</td><td>' + pct(st.pub[k], n) + '% (' + st.pub[k] + ')</td><td>' + st.conf[k] + '</td></tr>'));
  if (flagged.length) body += h2('reports', 'Public reports of problems') + '<p>Our research agent found public reports of problems (for example a court case, a regulator notice or press coverage) for ' + flagged.length + ' of ' + n + ' projects. Each project page names the report and links its source; we do not summarise them here.</p>';
  body += h2('protect', 'What protects a buyer') + '<p>The protections that exist on paper only help if the project uses them: a permit you can look up, payments into an escrow or protected account in the project name, and payments tied to construction milestones you can verify. ' + (laws.length ? '<a href="/countries/' + S + '/buyer-protection-law/">' + laws.length + ' rules of ' + esc(C) + ' law, quoted from the official text</a>. ' : '') + '<a href="/countries/' + S + '/how-to-check/">How to check a project in ' + esc(C) + '</a>.</p>';
  const faq = [['Is it safe to buy off-plan property in ' + C + '?', 'It depends on the project. Of ' + n + ' projects tracked by Kolaboro in ' + C + ', ' + pct(st.pub.permit, n) + '% publish a permit number, ' + pct(st.pub.escrow, n) + '% state deposit protection and ' + lates.length + ' are past the first handover date on record (data of ' + longDate(up) + ').'],
    ['How often are off-plan handovers in ' + C + ' late?', lates.length + ' of ' + n + ' tracked projects are past the first handover date on record' + (lates.length ? ', median ' + median(lates.map(o => o.late)) + ' months' : '') + '.'],
    ['How many developer claims in ' + C + ' turned out to be contradicted?', fmt(st.contra) + ' of ' + fmt(st.claims) + ' tested claims (' + pct(st.contra, st.claims) + '%) were contradicted by a register or independent source.']];
  body += srcBox(B, C, laws, regsFor(B, C)) + faqHtml(faq) + REPLY;
  return render({ path: '/countries/' + S + '/is-it-safe/', title: 'Is it safe to buy off-plan in ' + C + '? What ' + n + ' projects show | Kolaboro', h1: 'Is it safe to buy off-plan in ' + C + '?', lead: 'What the delivery record, dated promises and public documents of ' + n + ' tracked projects show.', desc: 'Off-plan in ' + C + ': ' + lates.length + ' of ' + n + ' tracked projects past the first handover date, ' + pct(st.pub.escrow, n) + '% state deposit protection, ' + pct(st.contra, st.claims) + '% of tested claims contradicted. Facts, sources, data of ' + longDate(up) + '.', updated: up, crumbs: [['Kolaboro', '/'], ['Countries', '/countries/'], [C, '/countries/' + S + '/'], ['Is it safe?', '/countries/' + S + '/is-it-safe/']], body, ld: [faqLd(faq)] });
}
const median = a => { const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2)) : null; };
function pLaw(B, x) {
  const { c: C, s: S } = x, laws = lawFor(B, C), up = (B.law && B.law.version) || B.d.updated;
  const topics = (B.law && B.law.topics) || {};
  let body = '<div class="sx-sum" id="summary"><p><b>' + laws.length + ' rule' + (laws.length === 1 ? '' : 's') + ' of ' + esc(C) + ' law that matter when you buy off-plan, each quoted from the official text with a link.</b> We include an article only after reading it in the official source. General information, not legal advice: ask a local lawyer about your contract.</p></div>';
  body += laws.map(r => '<article class="sx-reg" id="' + esc(r.id) + '"><h3>' + esc(r.title) + '<a class="sx-anchor" href="#' + esc(r.id) + '" aria-label="Link to this rule">#</a></h3>' + (r.topics ? '<p class="sx-src">' + r.topics.map(t => esc(topics[t] || t)).join(', ') + '</p>' : '') + '<p>' + esc(r.plain) + '</p>' + (r.quote ? '<blockquote class="sx-q" lang="' + esc(r.src.language || '') + '">' + esc(r.quote) + '</blockquote>' : '') + (r.translation ? '<p class="sx-src">Translation: ' + esc(r.translation) + '</p>' : '') + '<p class="sx-src">' + esc(r.src.law) + (r.cite ? ', ' + esc(r.cite) : '') + '. <a href="' + esc(r.src.url) + '" rel="noopener">' + esc(r.src.publisher || new URL(r.src.url).hostname) + '</a>' + (r.src.checked ? ', checked ' + esc(r.src.checked) : '') + '.</p></article>').join('');
  body += '<p>Used by <a href="/tools/late-handover/">the late-handover calculator</a> and <a href="/tools/law/">the contract law notes</a>. See also <a href="/countries/' + S + '/how-to-check/">how to check a project in ' + esc(C) + '</a> and <a href="/buyer-protection-law/">buyer protection compared across markets</a>. <a href="/guides/">All guides</a>.</p>';
  body += srcBox(B, C, laws, []) + REPLY.replace('Are you the developer, or did we get something wrong?', 'Did we misread a rule?');
  return render({ path: '/countries/' + S + '/buyer-protection-law/', title: C + ' off-plan buyer protection law: ' + laws.length + ' rules quoted | Kolaboro', h1: 'Off-plan buyer protection law in ' + C, lead: 'The rules on delays, refunds, escrow and title, quoted from the official text.', desc: laws.length + ' rules of ' + C + ' law for off-plan buyers (delay, termination, escrow, title), each quoted from the official source with a link. General information, not legal advice.', updated: up, crumbs: [['Kolaboro', '/'], ['Countries', '/countries/'], [C, '/countries/' + S + '/'], ['Buyer protection law', '/countries/' + S + '/buyer-protection-law/']], body,
    pageLd: { citation: [...new Set(laws.map(r => r.src.url))].map(u => ({ '@type': 'Legislation', url: u, name: laws.find(r => r.src.url === u).src.law })) } });
}
function delayedList(B, filter) { return B.cases.filter(filter).map(c => ({ c, lm: lateMonths(B, c) })).filter(o => o.lm && o.lm.late > 0).sort((a, b) => b.lm.late - a.lm.late || a.c.id.localeCompare(b.c.id)); }
function delayRows(B, L) { return L.map((o, i) => '<tr><td>' + (i + 1) + '</td><td><a href="' + plink(B, o.c) + '">' + esc(pname(B, o.c)) + '</a></td><td><a href="/m/' + slugM(o.c.market) + '/">' + esc(o.c.market) + '</a>, ' + esc(o.c.country) + '</td><td>' + ymName(o.lm.first + '-01') + '</td><td>' + (o.lm.cur ? ymName(o.lm.cur + '-01') : '') + '</td><td>' + o.lm.late + '</td><td>' + (o.lm.status === 'on_time' || o.lm.status === 'late' ? esc(o.lm.status.replace('_', ' ')) : esc(o.c.stage || '')) + '</td></tr>'); }
const DHEAD = ['#', 'Project', 'Market', 'First handover date on record', 'Handover date advertised now', 'Months past the first date', 'Status'];
function marketsWithDelays(B) { const m = new Map(); for (const o of delayedList(B, () => true)) m.set(o.c.market, (m.get(o.c.market) || 0) + 1); return [...m.entries()].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]); }
function pDelayed(B, market) {
  const up = B.d.updated, L = delayedList(B, c => !market || c.market === market), mw = marketsWithDelays(B);
  if (market && L.length < 3) return null;
  const where = market ? market + ', ' + B.mToC.get(market) : 'all markets';
  let body = '<div class="sx-sum" id="summary"><p><b>' + L.length + ' tracked off-plan project' + (L.length === 1 ? ' is' : 's are') + ' past the first handover date we have on record in ' + esc(where) + '</b>' + (L.length ? '; the furthest by ' + L[0].lm.late + ' months, the median by ' + median(L.map(o => o.lm.late)) + ' months' : '') + '. Month of reference: ' + ymName(B.ontime.as_of_month + '-01') + '.</p><p>The first handover date on record is the date the developer first advertised, before any later moves we recorded. Where only a year is public we assume December, which can only understate lateness.</p></div>';
  body += tableWrap(DHEAD, delayRows(B, L.slice(0, 200)));
  body += '<p class="sx-src">Method and source: <a href="/index/delays/">delivery-delay index</a>, <a href="/data/on-time.json">/data/on-time.json</a>. A project can be late for reasons outside the developer\'s control; the dates are as advertised.</p>';
  body += h2('markets', 'By market') + '<ul class="sx-chips">' + (market ? '<li><a href="/rankings/most-delayed/">All markets</a></li>' : '') + mw.filter(([m]) => m !== market).map(([m, n]) => '<li><a href="/rankings/most-delayed/' + slug(m) + '/">' + esc(m) + ' (' + n + ')</a></li>').join('') + '</ul>' + REPLY;
  const path = market ? '/rankings/most-delayed/' + slug(market) + '/' : '/rankings/most-delayed/';
  const cr = [['Kolaboro', '/'], ['Rankings', '/rankings/'], ['Most delayed', '/rankings/most-delayed/']]; if (market) cr.push([market, path]);
  return render({ path, title: 'Most delayed off-plan projects' + (market ? ' in ' + market : '') + ': ' + L.length + ' past handover date | Kolaboro', h1: 'Most delayed off-plan projects' + (market ? ' in ' + market : ''), lead: 'Projects furthest past the first handover date on record, from advertised dates we track every day.', desc: L.length + ' off-plan projects' + (market ? ' in ' + market : '') + ' are past the first handover date on record' + (L.length ? ', up to ' + L[0].lm.late + ' months' : '') + '. Dates, sources and method. Data of ' + longDate(up) + '.', updated: up, type: 'CollectionPage', crumbs: cr, body,
    pageLd: { mainEntity: { '@type': 'ItemList', numberOfItems: L.length, itemListOrder: 'https://schema.org/ItemListOrderDescending', itemListElement: L.slice(0, 50).map((o, i) => ({ '@type': 'ListItem', position: i + 1, name: pname(B, o.c), url: SITE + plink(B, o.c) })) } } });
}
function pChanged(B) {
  const up = (B.drift && B.drift.updated) || B.d.updated, P = (B.drift && B.drift.projects) || {}, byId = new Map(B.cases.map(c => [c.id, c]));
  const prom = (B.promises && B.promises.projects) || {};
  const rows = Object.entries(P).map(([id, p]) => { const c = byId.get(id); if (!c) return null; const ch = (p.changes || []).filter(x => !x.reverted); const mm = (prom[id] || []).reduce((a, x) => a + (x.mm || 0), 0); return { c, n: ch.length, f: [...new Set(ch.map(x => x.label))], mm }; }).filter(o => o && (o.n || o.mm)).sort((a, b) => (b.n + (b.mm ? 1 : 0)) - (a.n + (a.mm ? 1 : 0)) || b.mm - a.mm);
  let devs = [];
  if (B.N.projects.size) { const m = new Map(); for (const o of rows) { const e = B.N.projects.get(o.c.id); if (!e || !e.developer) continue; const k = e.developer; const v = m.get(k) || { name: k, url: e.developer_url, projects: 0, changes: 0, mm: 0 }; v.projects++; v.changes += o.n; v.mm += o.mm; m.set(k, v); } devs = [...m.values()].sort((a, b) => b.changes - a.changes || b.mm - a.mm).slice(0, 30); }
  let body = '<div class="sx-sum" id="summary"><p><b>' + rows.length + ' tracked off-plan projects changed what their own pages promise</b> since we started keeping daily copies on ' + longDate(B.drift.first_day) + ' (' + B.drift.counts.changes + ' changes found in ' + B.drift.counts.projects + ' projects read daily), or moved a dated promise such as the handover.</p><p>A change is a difference between two dated copies of the developer page, each fingerprinted with SHA-256; it can be a correction, an update or a new promise. Fields read: ' + B.drift.fields.join(', ') + '.</p></div>';
  if (devs.length) body += h2('developers', 'Developers with the most changed promises') + tableWrap(['Developer', 'Projects with changes', 'Changes on their pages', 'Months handover dates moved'], devs.map(v => '<tr><td>' + (v.url ? '<a href="' + esc(v.url.replace(SITE, '')) + '">' + esc(v.name) + '</a>' : esc(v.name)) + '</td><td>' + v.projects + '</td><td>' + v.changes + '</td><td>' + v.mm + '</td></tr>'));
  const cpRow = o => '<tr><td><a href="' + plink(B, o.c) + '">' + esc(pname(B, o.c)) + '</a></td><td>' + esc(o.c.market) + '</td><td>' + o.n + '</td><td>' + esc(o.f.join(', ') || 'dated promise moved') + '</td><td>' + o.mm + '</td></tr>', CPH = ['Project', 'Market', 'Changes on the page', 'What changed', 'Months handover dates moved'];
  body += h2('projects', 'Projects with the most changes') + tableWrap(CPH, rows.slice(0, 150).map(cpRow)) + (rows.length > 150 ? '<details><summary>' + (rows.length - 150) + ' more projects with changes (' + 151 + ' to ' + rows.length + ')</summary>' + tableWrap(CPH, rows.slice(150).map(cpRow)) + '</details>' : '');
  body += '<p class="sx-src">Sources: <a href="/data/promise-drift.json">/data/promise-drift.json</a> (daily page copies), <a href="/data/promises.json">/data/promises.json</a> (dated promises, each an exact quote). See <a href="/promises/">the promise tracker</a>.</p>' + REPLY;
  return render({ path: '/rankings/changed-promises/', title: 'Most changed promises: off-plan developers and projects', h1: 'Most changed off-plan promises', lead: 'What developers changed on their own pages, found by comparing dated copies we keep every day.', desc: rows.length + ' off-plan projects changed advertised promises (handover date, price, permit, guaranteed returns) since ' + longDate(B.drift.first_day) + '. Dated copies, SHA-256 fingerprints.', updated: up, type: 'CollectionPage', crumbs: [['Kolaboro', '/'], ['Rankings', '/rankings/'], ['Changed promises', '/rankings/changed-promises/']], body });
}
function addedDates(B) {   // first day a project appears in our daily page copies or dated promises; undefined = added after those files were built
  const P = (B.drift && B.drift.projects) || {}, PR = (B.promises && B.promises.projects) || {}, out = new Map();
  for (const c of B.cases) { const ds = []; if (P[c.id] && P[c.id].first) ds.push(P[c.id].first); for (const x of PR[c.id] || []) for (const h of x.hist || []) if (h.seen) ds.push(h.seen); for (const h of c.history || []) if (h.d) ds.push(h.d); out.set(c.id, ds.length ? ds.sort()[0] : null); }
  return out;
}
const NEW_PER = 150;
function pNew(B, u) {
  const up = B.d.updated, m0 = up.slice(0, 7), A = addedDates(B);
  const L = B.all.filter(c => { const a = A.get(c.id); return reviewed(c) ? a != null && a.slice(0, 7) === m0 : true; }).sort((a, b) => String(A.get(b.id) || '9').localeCompare(String(A.get(a.id) || '9')) || a.id.localeCompare(b.id));
  const none = B.cases.filter(c => A.get(c.id) == null).length, mname = ymName(m0 + '-01');
  let body = '<div class="sx-sum" id="summary"><p><b>' + L.length + ' off-plan projects first appear in our records in ' + mname + '</b>, in ' + new Set(L.map(c => c.country)).size + ' countries. The date shown is the first day we hold a dated copy of the project page, a dated promise or a recorded change.</p>' + (none ? '<p>' + none + ' tracked projects have none of these on record yet, so they are not listed here; they are on <a href="/countries/">the country pages</a>.</p>' : '') + '</div>';
  const by = new Map(); for (const c of L) { if (!by.has(c.country)) by.set(c.country, []); by.get(c.country).push(c); }
  const G = [...by.entries()].sort((a, b) => b[1].length - a[1].length), flat = [].concat(...G.map(g => g[1])), NP = Math.max(1, Math.ceil(flat.length / NEW_PER));
  const pg = Math.min(NP, Math.max(1, parseInt((u && u.searchParams.get('p')) || '1', 10) || 1)), lo = (pg - 1) * NEW_PER, hi = lo + NEW_PER;
  const pU = n => '/new/' + (n > 1 ? '?p=' + n : ''), start = new Map(); let ix = 0; for (const [k, v] of G) { start.set(k, Math.floor(ix / NEW_PER) + 1); ix += v.length; }
  const pager = NP < 2 ? '' : '<nav class="sx-pg" aria-label="Pages"><p><span>' + (lo + 1) + '-' + Math.min(hi, flat.length) + ' / ' + flat.length + '</span> ' + Array.from({ length: NP }, (_, i) => i + 1).map(n => n === pg ? '<b aria-current="page">' + n + '</b>' : '<a href="' + pU(n) + '" hreflang="en"' + (n === pg - 1 ? ' rel="prev"' : n === pg + 1 ? ' rel="next"' : '') + '>' + n + '</a>').join(' ') + '</p></nav>';
  body += '<ul class="sx-chips">' + G.map(([k, v]) => '<li><a href="' + (start.get(k) === pg ? '' : pU(start.get(k))) + '#' + slug(k) + '"' + (start.get(k) === pg ? '' : ' hreflang="en"') + '>' + esc(k) + ' (' + v.length + ')</a></li>').join('') + '</ul>' + pager;
  let at = 0; const G2 = []; for (const [k, v] of G) { const a = Math.max(lo, at), b = Math.min(hi, at + v.length); if (a < b) G2.push([k, v.slice(a - at, b - at), a > at]); at += v.length; }
  for (const [k, v, cont] of G2) body += h2(cont ? slug(k) + '-' + pg : slug(k), k + (cont ? ' (continued)' : '')) + tableWrap(['Project', 'Where', 'Stage', 'Handover year advertised', 'Checks public', 'First on record'], v.map(c => '<tr><td><a href="' + plink(B, c) + '">' + esc(pname(B, c)) + '</a></td><td>' + esc(place(c)) + '</td><td>' + esc(c.stage || 'not stated') + '</td><td>' + (c.done || 'not published') + '</td><td>' + (reviewed(c) ? c.score + '/6</td><td>' + longDate(A.get(c.id)) : NOT_REVIEWED + '</td><td>added recently') + '</td></tr>')) + '<p><a href="/countries/' + slug(k) + '/">All projects in ' + esc(k) + '</a></p>';
  body += pager + REPLY;
  return render({ path: pU(pg), prev: pg > 1 ? pU(pg - 1) : null, next: pg < NP ? pU(pg + 1) : null, noindex: pg > 1, title: 'New off-plan projects in ' + mname + ': ' + L.length + ' first on record' + (pg > 1 ? ', page ' + pg : '') + ' | Kolaboro', h1: 'New off-plan projects this month', lead: 'Projects that first appear in our records in ' + mname + ', with what they publish.', desc: L.length + ' off-plan projects first on record at Kolaboro in ' + mname + ' in ' + by.size + ' countries: stage, advertised handover, public buyer checks.', updated: up, type: 'CollectionPage', crumbs: [['Kolaboro', '/'], ['New this month', '/new/']], body });
}
function pairs(B) {
  if (MEMO.__pairs && MEMO.__pairs.k === B.d.updated + B.N.projects.size) return MEMO.__pairs.v;
  const groups = new Map();
  for (const c of B.cases) { if (!B.N.projects.has(c.id) || !c.band || !c.stage || !c.done) continue; const k = c.market + '|' + c.stage + '|' + c.band; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(c); }
  const out = [], used = new Map();
  for (const L of groups.values()) { L.sort((a, b) => a.id.localeCompare(b.id)); for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { const a = L[i], b = L[j]; if ((used.get(a.id) || 0) >= 2 || (used.get(b.id) || 0) >= 2) continue; out.push([a, b]); used.set(a.id, (used.get(a.id) || 0) + 1); used.set(b.id, (used.get(b.id) || 0) + 1); } }
  MEMO.__pairs = { k: B.d.updated + B.N.projects.size, v: out }; return out;
}
const pslug = (B, c) => { const e = B.N.projects.get(c.id), m = e && /\/projects\/([a-z0-9-]+)\/$/.exec(e.loc); return m ? m[1] : c.id.toLowerCase(); };   // n40 R03-01: /vs/ pairs by project slug, the id form 301s
const pairPath = (B, a, b) => { const x = pslug(B, a), y = pslug(B, b); return '/vs/' + (x < y ? x + '-vs-' + y : y + '-vs-' + x) + '/'; };
const VS_PER = 150;
function pVs(B, key, u) {
  const P = pairs(B), up = B.d.updated;
  if (!key) {
    const by = new Map(); for (const [a, b] of P) { if (!by.has(a.market)) by.set(a.market, []); by.get(a.market).push([a, b]); }
    // n40 R03-26: 150 pairs per page (?p=2 ...), market chips jump to the page holding the market
    const flat = []; for (const [m, l] of by) for (const pr of l) flat.push([m, pr]);
    const NP = Math.max(1, Math.ceil(flat.length / VS_PER)), pg = Math.min(NP, Math.max(1, parseInt((u && u.searchParams.get('p')) || '1', 10) || 1)), lo = (pg - 1) * VS_PER, hi = lo + VS_PER;
    const pU = n => '/vs/' + (n > 1 ? '?p=' + n : ''), start = new Map(); flat.forEach(([m], i) => { if (!start.has(m)) start.set(m, Math.floor(i / VS_PER) + 1); });
    const pager = NP < 2 ? '' : '<nav class="sx-pg" aria-label="Pages"><p><span>' + (lo + 1) + '-' + Math.min(hi, flat.length) + ' / ' + flat.length + '</span> ' + Array.from({ length: NP }, (_, i) => i + 1).map(n => n === pg ? '<b aria-current="page">' + n + '</b>' : '<a href="' + pU(n) + '"' + (n === pg - 1 ? ' rel="prev"' : n === pg + 1 ? ' rel="next"' : '') + '>' + n + '</a>').join(' ') + '</p></nav>';
    const G = new Map(); for (const [m, pr] of flat.slice(lo, hi)) { if (!G.has(m)) G.set(m, []); G.get(m).push(pr); }
    let body = '<div class="sx-sum"><p><b>' + P.length + ' side-by-side comparisons of off-plan projects in the same market, at the same stage and in the same price band.</b> Facts only, from the open dataset.</p></div>' + (P.length ? (NP > 1 ? '<ul class="sx-chips">' + [...by.entries()].map(([m, l]) => '<li><a href="' + (start.get(m) === pg ? '' : pU(start.get(m))) + '#' + slug(m) + '">' + esc(m) + ' (' + l.length + ')</a></li>').join('') + '</ul>' : '') + pager + [...G.entries()].map(([m, l]) => { const cont = start.get(m) < pg; return h2(cont ? slug(m) + '-' + pg : slug(m), m + (cont ? ' (continued)' : '')) + '<ul class="sx-l">' + l.map(([a, b]) => '<li><a href="' + pairPath(B, a, b) + '">' + esc(pname(B, a)) + ' vs ' + esc(pname(B, b)) + '</a></li>').join('') + '</ul>'; }).join('') + pager : '<p>Comparisons appear once projects have public pages with their names.</p>');
    return render({ path: pU(pg), prev: pg > 1 ? pU(pg - 1) : null, next: pg < NP ? pU(pg + 1) : null, title: 'Off-plan project comparisons: facts side by side' + (pg > 1 ? ', page ' + pg : '') + ' | Kolaboro', h1: 'Compare off-plan projects', desc: P.length + ' comparisons of off-plan projects in the same market, stage and price band: permits, deposit protection, handover dates, delays.', updated: up, type: 'CollectionPage', crumbs: [['Kolaboro', '/'], ['Comparisons', '/vs/']], body, noindex: !P.length || pg > 1 });
  }
  let pr = P.find(([a, b]) => pairPath(B, a, b) === '/vs/' + key + '/');
  if (!pr) { const mk = /^([a-z0-9]+-[0-9]+)-vs-([a-z0-9]+-[0-9]+)$/.exec(key); let a, b;
    if (mk) { const f = id => B.cases.find(c => c.id.toLowerCase() === id && B.N.projects.has(c.id)); a = f(mk[1]); b = f(mk[2]); }
    else { const bs = new Map(); for (const c of B.cases) if (B.N.projects.has(c.id)) bs.set(pslug(B, c), c);
      for (let i = key.indexOf('-vs-'); i > 0 && !(a && b); i = key.indexOf('-vs-', i + 1)) { a = bs.get(key.slice(0, i)); b = bs.get(key.slice(i + 4)); } }
    if (!a || !b || a === b) return null; if (!a || !b || a.market !== b.market || !a.stage || a.stage !== b.stage || !a.band || a.band !== b.band) return null; if ('/vs/' + key + '/' !== pairPath(B, a, b)) return { redirect: pairPath(B, a, b) }; pr = [a, b]; }
  const [a, b] = pr, la = lateMonths(B, a), lb = lateMonths(B, b), na = pname(B, a), nb = pname(B, b);
  const row = (k, f) => '<tr><th scope="row">' + k + '</th><td>' + f(a, la) + '</td><td>' + f(b, lb) + '</td></tr>';
  const rows = [row('Where', c => esc(place(c)) + ', ' + esc(c.country)), row('Stage', c => esc(c.stage)), row('Price band', c => esc(c.band)), row('Handover year advertised', c => c.done || 'not published'), row('First handover date on record', (c, l) => l ? ymName(l.first + '-01') : 'not published'), row('Months past first handover date', (c, l) => l ? (l.late > 0 ? l.late : 'not past') : 'no date'), row('Title', c => esc(c.title || 'not published') + (c.lease ? ' (' + c.lease + ' years)' : ''))]
    .concat(CHECKS.map(k => row(CKN[k], c => (isPub(c, k) ? 'public' : 'not public') + (isConf(c, k) ? ', confirmed' : '')))).concat([row('Checks public', c => c.score + '/6'), row('Confirmed by register or independent source', c => (c.vscore || 0) + '/6'), row('Developer claims contradicted', c => (c.claims || {}).contradicted || 0), row('Last checked', c => esc(c.checked))]);
  const body = '<div class="sx-sum" id="summary"><p><b>' + esc(na) + ' and ' + esc(nb) + ' are both ' + esc(a.stage) + ' projects in ' + esc(a.market) + ' in the ' + esc(a.band) + ' band.</b> ' + esc(na) + ' makes ' + a.score + ' of 6 buyer checks public (' + (a.vscore || 0) + ' confirmed); ' + esc(nb) + ' makes ' + b.score + ' public (' + (b.vscore || 0) + ' confirmed).</p></div><div class="sx-tw"><table class="ptable"><thead><tr><th scope="col">Fact</th><th scope="col"><a href="' + plink(B, a) + '">' + esc(na) + '</a></th><th scope="col"><a href="' + plink(B, b) + '">' + esc(nb) + '</a></th></tr></thead><tbody>' + rows.join('') + '</tbody></table></div><p>More in <a href="/m/' + slugM(a.market) + '/">' + esc(a.market) + '</a> · <a href="/countries/' + slug(a.country) + '/">' + esc(a.country) + '</a> · <a href="/vs/">all comparisons</a></p>' + REPLY;
  return render({ path: pairPath(B, a, b), title: na + ' vs ' + nb + ': permits, delivery dates, facts compared | Kolaboro', h1: na + ' vs ' + nb, lead: 'Two off-plan projects in ' + esc(a.market) + ', compared on the same public facts.', desc: na + ' vs ' + nb + ' (' + a.market + '): ' + a.score + '/6 vs ' + b.score + '/6 buyer checks public, handover ' + (a.done || 'n/a') + ' vs ' + (b.done || 'n/a') + ', permits and deposit protection side by side.', updated: up, crumbs: [['Kolaboro', '/'], ['Comparisons', '/vs/'], [na + ' vs ' + nb, pairPath(B, a, b)]], body });
}
function pRankings(B) {
  const mw = marketsWithDelays(B);
  const body = '<ul class="sx-l"><li><a href="/rankings/most-delayed/">Most delayed off-plan projects</a>: past the first handover date on record, all markets</li>' + mw.map(([m, n]) => '<li><a href="/rankings/most-delayed/' + slug(m) + '/">Most delayed in ' + esc(m) + '</a> (' + n + ')</li>').join('') + '<li><a href="/rankings/changed-promises/">Most changed promises</a>: what developers changed on their own pages</li><li><a href="/new/">New this month</a></li><li><a href="/rankings/transparency/">Transparency rankings: 30 islands and 30 cities</a>: every project scored 0 to 100 on what is published and checkable</li><li><a href="/transparency-index/">Transparency index by market</a></li><li><a href="/vs/">Project comparisons</a></li><li><a href="/handover/">Projects by handover year and place</a>: with the delay index by place</li><li><a href="/areas/">Projects by neighbourhood</a></li></ul>';
  return render({ path: '/rankings/', title: 'Off-plan rankings: delays, changed promises, transparency', h1: 'Off-plan rankings', desc: 'Data-driven lists of off-plan projects: most delayed by market, most changed promises, new projects, transparency by market.', updated: B.d.updated, type: 'CollectionPage', crumbs: [['Kolaboro', '/'], ['Rankings', '/rankings/']], body });
}

function diMonths(B) { return ((B.delay && B.delay.history) || []).filter(h => /^\d{4}-\d{2}$/.test(h.month)).sort((a, b) => a.month < b.month ? 1 : -1); }
function diRows(h) { return Object.entries(h.markets || {}).map(([m, a]) => ({ m, tracked: a[0], past: a[1], share: a[2], median: a[3], p90: a[4] })).sort((a, b) => b.tracked - a.tracked || a.m.localeCompare(b.m)); }
function diCsv(B, month) {
  const h = diMonths(B).find(x => x.month === month); if (!h) return null;
  const q = v => v == null ? '' : /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
  const lines = ['market,country,tracked_with_date,past_first_handover,share_past_first_pct,median_months_late,p90_months_late', ['All markets', '', h.all.with_date, h.all.past_first, h.all.share_past_first, h.all.median_late, h.all.p90_late].map(q).join(',')].concat(diRows(h).map(r => [r.m, B.mToC.get(r.m) || '', r.tracked, r.past, r.share, r.median, r.p90].map(q).join(',')));
  return lines.join('\n') + '\n';
}
function pDeliveryIndex(B, month) {
  const ms = diMonths(B); if (!ms.length) return null;
  if (!month) {
    const body = '<div class="sx-sum"><p><b>The Kolaboro Off-plan Delivery Index is published once a month as a frozen snapshot with its own permanent address</b>, so a figure you cite never changes under you. Each edition states the input file fingerprint (SHA-256) it was computed from.</p></div><ul class="sx-l">' + ms.map(h => '<li><a href="/press/delivery-index/' + h.month + '/">' + ymName(h.month + '-01') + '</a>: ' + h.all.share_past_first + '% of tracked projects with a handover date past the first date on record (' + h.all.past_first + ' of ' + h.all.with_date + ')</li>').join('') + '</ul><p>Live version, updated with every data refresh: <a href="/index/delays/">delivery-delay index</a>. Charts and quotable facts: <a href="/press/data/">data desk</a>, <a href="/press/monthly/">monthly release</a>. Widgets: <a href="/embed/widgets/">embed codes</a>.</p>';
    return render({ path: '/press/delivery-index/', title: 'Off-plan Delivery Index: monthly editions | Kolaboro', h1: 'Off-plan Delivery Index', lead: 'How far off-plan projects are behind their first promised handover date, by market, one frozen edition per month.', desc: 'Monthly editions of the Kolaboro Off-plan Delivery Index: share of off-plan projects past the first handover date and median months late, by market. CC BY 4.0.', updated: ms[0].taken, type: 'CollectionPage', crumbs: [['Kolaboro', '/'], ['Press', '/press/'], ['Delivery Index', '/press/delivery-index/']], body });
  }
  const h = ms.find(x => x.month === month); if (!h) return null;
  const rows = diRows(h), big = rows.filter(r => r.tracked >= 5), mname = ymName(month + '-01'), path = '/press/delivery-index/' + month + '/';
  const cite = 'Kolaboro Off-plan Delivery Index, ' + mname + '. kolaboro.com' + path + ' (snapshot ' + h.taken + '). CC BY 4.0.';
  const worst = big.filter(r => r.share > 0).sort((a, b) => b.share - a.share).slice(0, 5);
  let body = '<div class="sx-sum" id="summary"><p><b>' + h.all.share_past_first + '% of tracked off-plan projects with a usable handover date were past the first handover date on record in ' + mname + '</b> (' + h.all.past_first + ' of ' + h.all.with_date + '); ' + h.all.share_past_current + '% were past even the date advertised then. Among late projects the median delay was ' + h.all.median_late + ' months and the 90th percentile ' + h.all.p90_late + ' months.</p>' + (worst.length ? '<p>Highest shares among markets with at least 5 dated projects: ' + worst.map(r => esc(r.m) + ' ' + r.share + '% (' + r.past + ' of ' + r.tracked + ')').join(', ') + '.</p>' : '') + '</div>';
  body += '<div class="sx-kv"><div><b>' + h.all.with_date + '</b><span>projects with a handover date</span></div><div><b>' + h.all.share_past_first + '%</b><span>past the first date on record</span></div><div><b>' + h.all.share_past_current + '%</b><span>past the date advertised then</span></div><div><b>' + h.all.median_late + '</b><span>median months late</span></div><div><b>' + h.all.p90_late + '</b><span>90th percentile, months</span></div></div>';
  body += h2('cite', 'How to cite') + '<p class="sx-q">' + esc(cite) + '</p><p>Download: <a href="/press/delivery-index/' + month + '.csv">CSV of this edition</a> · charts: <a href="/press/monthly/chart-delays.svg">delays by market (SVG)</a>, <a href="/press/monthly/chart-months-late.svg">months late (SVG)</a> · <a href="/embed/widgets/">embeddable cards</a>. Input file fingerprint: <code style="overflow-wrap:anywhere">' + esc(h.input_sha256) + '</code>.</p>';
  body += h2('markets', 'By market') + tableWrap(['Market', 'Country', 'Projects with a date', 'Past first handover date', 'Share', 'Median months late', '90th percentile'], rows.map(r => '<tr><td>' + (B.mToC.has(r.m) ? '<a href="/m/' + slugM(r.m) + '/">' + esc(r.m) + '</a>' : esc(r.m)) + '</td><td>' + esc(B.mToC.get(r.m) || '') + '</td><td>' + r.tracked + '</td><td>' + r.past + '</td><td>' + r.share + '%</td><td>' + (r.median == null ? 'too few' : r.median) + '</td><td>' + (r.p90 == null ? 'too few' : r.p90) + '</td></tr>'));
  body += h2('method', 'Method') + '<ul class="sx-l">' + Object.entries(B.delay.rules || {}).map(([k, v]) => '<li><b>' + esc(k.replace(/_/g, ' ')) + '</b>: ' + esc(v) + '</li>').join('') + '</ul>' + ((B.delay.caveats || []).length ? '<h3>Caveats</h3><ul class="sx-l">' + B.delay.caveats.map(c => '<li>' + esc(c) + '</li>').join('') + '</ul>' : '') + '<p>Journalists: <a href="/press/">press page and contact</a>. Developers can <a href="/ask-developer/">reply with documents</a>; we correct the record (<a href="/corrections/">corrections</a>).</p>';
  return render({ path, title: 'Off-plan Delivery Index ' + mname + ': ' + h.all.share_past_first + '% past the first handover date | Kolaboro', h1: 'Off-plan Delivery Index, ' + mname, lead: 'A frozen monthly edition: the numbers on this page do not change.', desc: mname + ': ' + h.all.share_past_first + '% of ' + h.all.with_date + ' tracked off-plan projects past the first handover date on record, median ' + h.all.median_late + ' months late. By market, CSV, CC BY 4.0.', updated: h.taken, type: 'WebPage', crumbs: [['Kolaboro', '/'], ['Press', '/press/'], ['Delivery Index', '/press/delivery-index/'], [mname, path]], body,
    ld: [{ '@type': 'Dataset', '@id': SITE + path + '#dataset', name: 'Kolaboro Off-plan Delivery Index, ' + mname, description: 'Share of tracked off-plan property projects past the first handover date on record, and months late, by market. Snapshot of ' + h.taken + '.', url: SITE + path, license: 'https://creativecommons.org/licenses/by/4.0/', creator: { '@type': 'Organization', name: 'Kolaboro', url: SITE + '/' }, temporalCoverage: month, dateModified: h.taken, isAccessibleForFree: true, variableMeasured: ['share of projects past the first handover date', 'median months late', '90th percentile months late'], distribution: [{ '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: SITE + '/press/delivery-index/' + month + '.csv' }, { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: SITE + '/data/delay-index.json' }], citation: cite }] });
}

function embedHtml(title, inner, canon) {
  return '<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="robots" content="noindex, follow"/><link rel="canonical" href="' + canon + '"/><title>' + esc(title) + '</title><style>:root{--i:#17212B;--m:#5B6670;--l:#E1E4DF;--p:#fff;--a:#C9461A}@media(prefers-color-scheme:dark){:root{--i:#F2F1EC;--m:#A9B2BB;--l:#33404C;--p:#17212B;--a:#FF8A5B}}html,body{margin:0;background:var(--p);color:var(--i);font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}.c{border:1px solid var(--l);border-radius:14px;padding:14px 16px;max-width:520px}.h{font-weight:700;font-size:16px;margin:0 0 4px}.s{color:var(--m);font-size:13px;margin:0 0 10px}.k{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:8px 0}.k div{border:1px solid var(--l);border-radius:10px;padding:8px}.k b{display:block;font-size:20px}.k span{font-size:12px;color:var(--m)}ul{margin:6px 0;padding-left:18px}a{color:var(--i)}.f{font-size:12px;color:var(--m);margin-top:10px}.f a{color:var(--a)}</style></head><body><div class="c">' + inner + '</div></body></html>';
}
const EMBED_HDR = { 'content-type': 'application/xhtml+xml; charset=utf-8', 'cache-control': 'public, max-age=3600, no-transform', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'none'", 'x-robots-tag': 'noindex, follow' };
function eDelay(B, mslug) {
  const r = (B.delay && B.delay.markets || []).find(x => slug(x.market) === mslug); if (!r) return null;
  const canon = SITE + '/embed/delay/' + mslug + '/';
  return embedHtml('Off-plan delay index: ' + r.market, '<p class="h">Off-plan delivery delays: ' + esc(r.market) + '</p><p class="s">Kolaboro delivery-delay index, ' + esc(ymName(B.delay.as_of_month + '-01')) + '</p><div class="k"><div><b>' + r.tracked + '</b><span>projects tracked</span></div><div><b>' + r.share_past_first + '%</b><span>past first handover date</span></div><div><b>' + (r.median_late == null ? 'n/a' : r.median_late) + '</b><span>median months late</span></div></div><p class="f">Source: <a href="' + SITE + '/index/delays/?utm_source=embed" target="_blank" rel="noopener">Kolaboro delivery-delay index</a> (CC BY 4.0). <a href="' + SITE + '/m/' + slugM(r.market) + '/?utm_source=embed" target="_blank" rel="noopener">' + esc(r.market) + ' market file</a></p>', canon);
}
function eProject(B, id) {
  const c = B.all.find(x => x.id.toLowerCase() === String(id).toLowerCase()); if (!c) return null;
  if (!reviewed(c)) return embedHtml('Project: ' + pname(B, c), '<p class="h">' + esc(pname(B, c)) + '</p><p class="s">' + esc(place(c)) + ', ' + esc(c.country) + '</p><p>' + NOT_REVIEWED + '.</p><p class="f"><a href="' + SITE + plink(B, c) + '?utm_source=embed" target="_blank" rel="noopener">Kolaboro</a></p>', SITE + '/embed/project/' + c.id.toLowerCase() + '/');
  const lm = lateMonths(B, c), canon = SITE + '/embed/project/' + c.id.toLowerCase() + '/';
  return embedHtml('Project facts: ' + pname(B, c), '<p class="h">' + esc(pname(B, c)) + '</p><p class="s">' + esc(place(c)) + ', ' + esc(c.country) + ' · ' + esc(c.stage || '') + ' · checked ' + esc(c.checked) + '</p><div class="k"><div><b>' + c.score + '/6</b><span>buyer checks public</span></div><div><b>' + (c.vscore || 0) + '/6</b><span>confirmed by register or independent source</span></div><div><b>' + (lm ? (lm.late > 0 ? lm.late + ' mo' : 'no') : 'n/a') + '</b><span>past first handover date</span></div></div><ul>' + CHECKS.map(k => '<li>' + CKN[k] + ': ' + (isPub(c, k) ? 'public' : 'not public') + (isConf(c, k) ? ', confirmed' : '') + '</li>').join('') + '</ul><p class="f">Facts from <a href="' + SITE + plink(B, c) + '?utm_source=embed" target="_blank" rel="noopener">Kolaboro</a> (CC BY 4.0). Developers can reply on the project page.</p>', canon);
}
function pWidgets(B) {
  const ms = (B.delay && B.delay.markets || []).filter(r => r.tracked >= 5).sort((a, b) => b.tracked - a.tracked);
  const ex = B.cases.find(c => B.N.projects.has(c.id)) || B.cases[0], m0 = ms[0];
  const code = s => '<pre style="white-space:pre-wrap;overflow-wrap:anywhere;background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:12px"><code>' + esc(s) + '</code></pre>';
  const ifr = (p, h, t) => '<iframe src="' + SITE + p + '" width="100%" height="' + h + '" style="border:0;max-width:540px" loading="lazy" title="' + t + '"></iframe>';
  let body = '<div class="sx-sum"><p><b>Free widgets for journalists, forums and blogs, built live from the open dataset.</b> Paste the code; the card keeps itself current, and the plain link under it points readers to the source page. Licence CC BY 4.0, credit "Kolaboro, kolaboro.com".</p></div>';
  if (m0) body += h2('delay', 'Delay index for one market') + '<p>Live example for ' + esc(m0.market) + ':</p>' + ifr('/embed/delay/' + slug(m0.market) + '/', 190, 'Kolaboro delay index ' + esc(m0.market)) + code(ifr('/embed/delay/' + slug(m0.market) + '/', 190, 'Kolaboro delay index ' + m0.market) + '\n<p><a href="' + SITE + '/m/' + slugM(m0.market) + '/">Off-plan projects in ' + m0.market + ' on Kolaboro</a></p>') + '<p>Markets with at least 5 tracked projects:</p><ul class="sx-chips">' + ms.map(r => '<li><a href="/embed/delay/' + slug(r.market) + '/">' + esc(r.market) + '</a></li>').join('') + '</ul>';
  body += '<p><b><a href="/tools/widget/">Widget v2 builder</a></b>: any project, light or dark, three sizes, 8 languages, iframe or script, with a plain link back to the facts page.</p>';   // n30c (item 19)
  if (ex) body += h2('project', 'Fact card for one project') + ifr('/embed/project/' + ex.id.toLowerCase() + '/', 330, 'Kolaboro project facts') + code(ifr('/embed/project/' + ex.id.toLowerCase() + '/', 330, 'Kolaboro project facts') + '\n<p><a href="' + SITE + plink(B, ex) + '">' + pname(B, ex) + ' on Kolaboro: facts and sources</a></p>') + '<p>Replace the id with any project id from <a href="/database/">the database</a>.</p>';
  body += h2('stories', 'Monthly data stories and change log') + '<ul class="sx-l"><li><a href="/stories/">Market data stories</a>: each month, per market, the delay index, permits published and advertised vs registered prices, with a CSV and a citation line</li><li><a href="/changes/">What changed this month</a>: changes found on developer pages, from dated copies (also as an <a href="/changes/feed.atom">Atom feed</a>)</li>' + (ex && B.N.projects.get(ex.id) ? '<li>Per-project <a href="/embed/card/' + esc(B.N.projects.get(ex.id).loc.replace(SITE + '/projects/', '').replace(/\/$/, '')) + '/">fact card</a> and delivery tracker embeds in 8 languages</li>' : '') + '</ul>';
  body += h2('more', 'More for the press') + '<ul class="sx-l"><li><a href="/press/data/">Data desk</a>: quotable facts, PNG and CSV charts</li><li><a href="/press/monthly/">Monthly off-plan data release</a></li><li><a href="/index/delays/">Delivery-delay index</a></li><li><a href="/embed/">Transparency index widget</a></li></ul>';
  return render({ path: '/embed/widgets/', title: 'Embeddable off-plan data widgets: delay index, fact cards', h1: 'Embed Kolaboro data', desc: 'Free embeddable cards: off-plan delivery-delay index per market and project fact cards, live from the open dataset, CC BY 4.0.', updated: B.d.updated, crumbs: [['Kolaboro', '/'], ['Press', '/press/'], ['Widgets', '/embed/widgets/']], body });
}

const XHDR = { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=600', 'x-robots-tag': 'noindex' };
const urlset = (items, alt, img) => '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' + (alt ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' : '') + (img ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : '') + '>\n' + items.map(i => '<url><loc>' + xesc(i.loc) + '</loc>' + (i.lastmod ? '<lastmod>' + i.lastmod + '</lastmod>' : '') + (i.alt || []).map(a => '<xhtml:link rel="alternate" hreflang="' + a[0] + '" href="' + xesc(a[1]) + '"/>').join('') + (i.img || []).map(u => '<image:image><image:loc>' + xesc(u) + '</image:loc></image:image>').join('') + '</url>').join('\n') + '\n</urlset>\n';
async function imageUrls(env, B, NP, ND, pages) {
  const prog = await file(env, '/data/construction-progress.json'), sp = (prog && prog.projects) || {};
  const one = (i, kind) => { const b = i.base, img = [SITE + '/og' + b.replace(/\/$/, '') + '.png']; const r = kind === 'project' && i.id && sp[i.id]; if (r && r.frames && r.v) img.push(SITE + '/k/sat/proj/' + encodeURIComponent(i.id) + '.jpg?v=' + encodeURIComponent(r.v)); return { loc: i.loc, lastmod: i.lastmod, img }; };
  const en = i => !/^https:\/\/kolaboro\.com\/(es|de|fr|ru|nl|ar|zh)\//.test(i.loc);
  const out = NP.filter(i => en(i) && /^\/projects\/[^/]+\/$/.test(i.base || '')).map(i => one(i, 'project')).concat(ND.filter(i => en(i) && /^\/developers\/[^/]+\/$/.test(i.base || '')).map(i => one(i, 'developer')));
  if (pages) { const E = pages.filter(pg => pg.lang === 'en'), I = await Promise.all(E.map(pg => ogOf(env, pg.loc.replace(SITE, '')))); E.forEach((pg, i) => { if (I[i]) out.push({ loc: pg.loc, lastmod: pg.lastmod, img: [I[i]] }); }); }
  return out;
}
async function ogOf(env, p) {
  const k = '__og' + p, m = MEMO[k]; if (m && Date.now() - m.t < 21600000) return m.v;
  let v = null;
  if (p.endsWith('/')) try { const r = await env.ASSETS.fetch(new Request(SITE + '/_s/kolaboro.com' + p + 'index.html')); if (r.ok) { const t = (await r.text()).slice(0, 12000), g = /<meta property="og:image" content="(https:\/\/kolaboro\.com\/[^"?#]+\.(?:png|jpe?g|webp))"/.exec(t); v = g ? g[1] : null; }
    if (v) { const i = await env.ASSETS.fetch(new Request(SITE + '/_s/kolaboro.com' + v.replace(SITE, ''))); if (!i.ok) v = null; }   // only images that exist
  } catch (e) { v = null; }
  MEMO[k] = { t: Date.now(), v }; return v;
}
const XL = ['methods/construction-stage', 'methods/delivery-forecast', 'guides/short-let-rules', 'satellite/plot', 'watch/lookalikes', 'graph/developers', 'tools/contract-addendum', 'tools/permit-photo', 'live/xrays', 'open', 'numbers'];
const XE = ['tools/account-check', 'tools/site-visit', 'tools/payment-email-check', 'findings', 'room', 'bulk-check', 'engineering/seo'];
const xtraLocs = () => XL.flatMap(p => LANGS.map(l => SITE + (l === 'en' ? '' : '/' + l) + '/' + p + '/')).concat(XE.map(p => SITE + '/' + p + '/')).map(loc => ({ loc, lastmod: null }));
async function staticPages(env, audit) {   // the static sitemap (kept as /sitemap.xml for the QA tools) grouped by language
  const sm = (await file(env, '/sitemap.xml')) || '';
  const locs0 = [...sm.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?/g)].map(m => ({ loc: m[1], lastmod: m[2] || null }));
  const have = new Set(locs0.map(x => x.loc)), locs = locs0.concat(xtraLocs().filter(x => !have.has(x.loc)));
  const set = new Set(locs.map(x => x.loc)), lm = (audit && audit.lastmod) || {};
  const key = loc => { const p = loc.replace(SITE, ''), m = /^\/(es|de|fr|ru|nl|ar|zh)(\/.*)$/.exec(p); return m ? [m[1], m[2]] : ['en', p]; };
  const drop = new Set(((audit && audit.exclude) || []).concat(['/saved/', '/portal/demo/']));   // noindex or non-200 pages found by the crawl audit
  return locs.filter(x => !drop.has(x.loc.replace(SITE, ''))).map(x => { const [l, p] = key(x.loc), alt = LANGS.map(L => [L, SITE + (L === 'en' ? p : '/' + L + p)]).filter(a => set.has(a[1])); return { loc: x.loc, lang: l, lastmod: lm[x.loc.replace(SITE, '')] || x.lastmod, alt: alt.length > 1 ? alt.concat([['x-default', SITE + p]]) : null }; });
}
async function hubUrls(B) {
  const up = B.d.updated, list = countryList(B), out = [], asOf = B.ontime && B.ontime.as_of_month ? B.ontime.as_of_month + '-01' : null;
  out.push({ loc: SITE + '/countries/', lastmod: maxLm(B, B.all), t: 'countries' });
  out.push({ loc: SITE + '/guides/', lastmod: maxLm(B, B.all), t: 'guides' });   // n40 R01-33
  for (const x of list) { out.push({ loc: SITE + '/countries/' + x.s + '/', lastmod: maxLm(B, x.L.concat(x.U), x.L.some(c => lateMonths(B, c)) ? [asOf] : []), t: 'countries' }); if (x.L.length >= THIN_MIN) out.push({ loc: SITE + '/countries/' + x.s + '/how-to-check/', lastmod: maxLm(B, x.L), t: 'guides' }); if (x.L.length >= SAFE_MIN) out.push({ loc: SITE + '/countries/' + x.s + '/is-it-safe/', lastmod: maxLm(B, x.L, [asOf]), t: 'guides' }); if (lawFor(B, x.c).length) out.push({ loc: SITE + '/countries/' + x.s + '/buyer-protection-law/', lastmod: (B.law && B.law.version) || up, t: 'guides' }); }
  const dl = delayedList(B, () => true).map(o => o.c), drift = (B.drift && B.drift.projects) || {}, m0 = up.slice(0, 7) + '-01', A = addedDates(B);
  out.push({ loc: SITE + '/rankings/', lastmod: maxLm(B, B.cases, [asOf]), t: 'rankings' }, { loc: SITE + '/rankings/most-delayed/', lastmod: maxLm(B, dl, [asOf]), t: 'rankings' }, { loc: SITE + '/rankings/changed-promises/', lastmod: maxLm(B, B.cases.filter(c => drift[c.id])), t: 'rankings' }, { loc: SITE + '/new/', lastmod: maxLm(B, B.all.filter(c => !reviewed(c) || (A.get(c.id) || '').slice(0, 7) === m0.slice(0, 7)), [m0]), t: 'rankings' }, { loc: SITE + '/embed/widgets/', lastmod: maxLm(B, B.all), t: 'rankings' });
  out.push({ loc: SITE + '/press/delivery-index/', lastmod: (diMonths(B)[0] || {}).taken || up, t: 'rankings' }); for (const h of diMonths(B)) out.push({ loc: SITE + '/press/delivery-index/' + h.month + '/', lastmod: h.taken, t: 'rankings' });
  for (const [m] of marketsWithDelays(B)) out.push({ loc: SITE + '/rankings/most-delayed/' + slug(m) + '/', lastmod: maxLm(B, dl.filter(c => c.market === m), [asOf]), t: 'rankings' });
  const P = pairs(B); if (P.length) { out.push({ loc: SITE + '/vs/', lastmod: maxLm(B, P.flat()), t: 'compare' }); for (const [a, b] of P) out.push({ loc: SITE + pairPath(B, a, b), lastmod: maxLm(B, [a, b]), t: 'compare' }); }
  for (const o of out) if (o.lastmod) o.lastmod = String(o.lastmod).slice(0, 10);
  return out;
}
function namedUrls(B, type) {   // seoP's named pages, grouped by base URL with hreflang alternates; lastmod = last real data change (kbx_lastmod.js)
  const list = B.N.all.filter(e => e.type === type && (e.sm !== false || (B.prio && B.prio.has(e.loc.replace(SITE, '').replace(/^\/(es|de|fr|ru|nl|ar|zh)\//, '/'))))); const byBase = new Map(), T = B.T;
  const all = T ? [...T.project.values()].sort() : [], newest = all[all.length - 1] || null;
  const tlm = (e, b) => { if (!T) return null; if (type === 'project' && e.id) return T.project.get(e.id) || null; if (type === 'developer') { const m = /^\/developers\/([^/]+)\/$/.exec(b); return m ? T.developer.get(m[1]) || null : null; } if (type === 'index') return newest; return null; };
  for (const e of list) { const p = e.loc.replace(SITE, ''), m = /^\/(es|de|fr|ru|nl|ar|zh)(\/.*)$/.exec(p), b = m ? m[2] : p; if (!byBase.has(b)) byBase.set(b, []); byBase.get(b).push(Object.assign({ l: m ? m[1] : (e.lang || 'en') }, e)); }
  const out = [];
  for (const [b, g] of byBase) { const alt = g.length > 1 ? g.map(e => [e.l, e.loc]).concat([['x-default', SITE + b]]) : null; const en = g.find(e => e.l === 'en') || g[0], d = tlm(en, b); for (const e of g) out.push({ loc: e.loc, lastmod: d || (e.lastmod || '').slice(0, 10) || null, alt, id: en.id, base: b }); }
  return out;
}
const EXT_MAPS = ['/stories/sitemap.xml', '/rankings/transparency/sitemap.xml', '/progress/sitemap.xml', '/handover/sitemap.xml', '/weekly/sitemap.xml', '/guides/buying-off-plan/sitemap.xml', '/reports/sitemap.xml', '/m/sitemap.xml'];
async function sitemaps(env, B, name) {
  const audit = await file(env, '/data/seo-audit.json');
  const pages = await staticPages(env, audit), hubs = await hubUrls(B), up = B.d.updated;
  const byM = new Map(); for (const c of B.all) { if (!byM.has(c.market)) byM.set(c.market, []); byM.get(c.market).push(c); }
  const mk = [...byM.entries()].map(([m, L]) => ({ loc: SITE + '/m/' + slugM(m) + '/', lastmod: maxLm(B, L) }));
  const anon = B.all.filter(c => !B.N.projects.has(c.id) && /^[A-Za-z0-9-]{3,20}$/.test(c.id)).map(c => ({ loc: SITE + '/p/' + encodeURIComponent(c.id) + '/', lastmod: tl(B, c) }));
  const S = { ['pages-en']: pages.filter(p => p.lang === 'en') };
  for (const l of LANGS.slice(1)) S['pages-' + l] = pages.filter(p => p.lang === l);
  Object.assign(S, { countries: hubs.filter(h => h.t === 'countries'), guides: hubs.filter(h => h.t === 'guides'), rankings: hubs.filter(h => h.t === 'rankings'), compare: hubs.filter(h => h.t === 'compare' && h.loc === SITE + '/vs/'), markets: mk, 'projects-anonymous': [] });   // n27g: sitemap diet: the /vs/<id>-vs-<id>/ pairs and the anonymous /p/ pages stay live but are not listed (anon: kept for the count only)
  try { const pr0 = await file(env, '/data/seo-priority.json'); B.prio = new Set(((pr0 && pr0.recrawl) || []).map(r => String(r.path || '').replace(/^\/(es|de|fr|ru|nl|ar|zh)\//, '/'))); } catch (e) { B.prio = null; }
  const NP = namedUrls(B, 'index').concat(namedUrls(B, 'project')), ND = namedUrls(B, 'developer'), lg = i => (/^https:\/\/kolaboro\.com\/(es|de|fr|ru|nl|ar|zh)\//.exec(i.loc) || [0, 'en'])[1];
  for (const l of LANGS) { S['projects-' + l] = NP.filter(i => lg(i) === l); S['developers-' + l] = ND.filter(i => lg(i) === l); }
  S.images = (await imageUrls(env, B, NP, ND, pages)).concat(mk.map(i => ({ loc: i.loc, lastmod: i.lastmod, img: [SITE + '/og/type/markets.png'] })));   // n40 R03-05: market pages with the share card they carry
  try { const MP = ((await file(env, '/data/n32t/manifest.json')) || {}).pages || {}, GL = MP.guides || [], LL = MP.law || [];   // n40 L1: the guides and delay rankings in 7 more languages (kbx_n32t.js), with hreflang
    for (const h of hubs) { const p = h.loc.replace(SITE, ''), G = /^\/countries\/[^/]+\/buyer-protection-law\/$/.test(p) ? LL : GL; if (!G.length || !/^\/(?:countries\/[^/]+\/(?:how-to-check|is-it-safe|buyer-protection-law)|rankings\/most-delayed(?:\/[^/]+)?)\/$/.test(p)) continue; h.alt = [['en', h.loc]].concat(G.map(l => [l, SITE + '/' + l + p]), [['x-default', h.loc]]); for (const l of G) S['pages-' + l].push({ loc: SITE + '/' + l + p, lastmod: h.lastmod, alt: h.alt }); } } catch (e) {}
  for (const k of Object.keys(S)) if (k !== 'images') { const seen = new Set(); S[k] = S[k].filter(i => i && i.loc && !seen.has(i.loc) && seen.add(i.loc)); }   // n20f: one URL once per sitemap (/report/sample/ was listed twice)
  try {
    const pr = await file(env, '/data/seo-priority.json'), rk = new Map(), base = x => x.replace(SITE, '').replace(/^\/(es|de|fr|ru|nl|ar|zh)\//, '/');
    ((pr && pr.recrawl) || []).forEach((r, i) => { if (r && r.path && !rk.has(r.path)) rk.set(r.path, i); });
    let top = []; try { const T = (await import('./kbx_g27.js')).TOP_IDS; top = Array.isArray(T) ? T : String(T).split(/\s+/); } catch (e) {}
    const tk = new Map(top.map((id, i) => [id, i])), big = 1e6;
    const score = i => { const p = i.loc.replace(SITE, ''); if (rk.has(p)) return rk.get(p); const b = base(i.loc); if (b !== p && rk.has(b)) return 1000 + rk.get(b); return i.id && tk.has(i.id) ? 10000 + tk.get(i.id) : big; };
    for (const k of Object.keys(S)) if (k !== 'images' && S[k].length > 1) S[k] = S[k].map((i, n) => [score(i), n, i]).sort((x, y) => x[0] - y[0] || x[1] - y[1]).map(x => x[2]);
    const ix = new Map(); for (const k of Object.keys(S)) if (k !== 'images') for (const i of S[k]) if (!ix.has(i.loc)) ix.set(i.loc, i);
    S.recrawl = [...rk.keys()].map(p => ix.get(SITE + p)).filter(Boolean);
  } catch (e) { S.recrawl = []; }
  if (name === 'index' || name === 'stats') {
    const keys = Object.keys(S).filter(k => S[k].length);
    if (name === 'stats') return Object.fromEntries(Object.keys(S).filter(k => k !== 'recrawl').map(k => [k, S[k].length]));
    const last = k => S[k].reduce((a, i) => (i.lastmod && i.lastmod > a ? i.lastmod : a), '') || up;
    const ext = [];
    for (const x of EXT_MAPS) {   // n29i: translated market files;   // n29h1: + place data pages (kbx_h29.js)
      let ok = MEMO['__ext' + x];
      if ((!ok || Date.now() - ok.t > 600000) && B.inner && B.ctx && B.ctx.waitUntil) { MEMO['__ext' + x] = ok = { t: Date.now(), v: ok ? ok.v : null }; B.ctx.waitUntil((async () => { try { const r = await B.inner(x); if (r && r.ok && /xml/.test(r.headers.get('content-type') || '')) { const t = await r.text(); const ds = [...t.matchAll(/<lastmod>(\d{4}-\d{2}-\d{2})/g)].map(m => m[1]).sort(); MEMO['__ext' + x] = { t: Date.now(), v: { last: ds[ds.length - 1] || null, n: (t.match(/<url>/g) || []).length } }; } } catch (e) {} })()); }
      const lmx = (ok && ok.v && ok.v.last) || String(up || '').slice(0, 10);
      ext.push('<sitemap><loc>' + SITE + x + '</loc>' + (/^\d{4}-\d{2}-\d{2}$/.test(lmx) ? '<lastmod>' + lmx + '</lastmod>' : '') + '</sitemap>');
    }
    return new Response('<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + keys.map(k => '<sitemap><loc>' + SITE + '/sitemaps/' + k + '.xml</loc><lastmod>' + last(k) + '</lastmod></sitemap>').concat(ext).join('\n') + '\n</sitemapindex>\n', { headers: XHDR });
  }
  if (!S[name] || !S[name].length) return new Response('Not found', { status: 404 });
  return new Response(urlset(S[name], S[name].some(i => i.alt), S[name].some(i => i.img)), { headers: XHDR });
}

async function llms(env, B, full) {
  const st = (await file(env, full ? '/llms-full.txt' : '/llms.txt', 60000)) || '# Kolaboro\n';
  const S = stats(B.cases), list = countryList(B), up = B.d.updated, L = [];
  L.push('', '## Live figures (computed ' + longDate(up) + ' from https://kolaboro.com/data/bali-cases.json)', '- ' + fmt(B.all.length + B.coi.length) + ' off-plan projects tracked in ' + list.length + ' countries and ' + (new Set(B.all.map(c => c.market)).size + (B.coi.length ? 1 : 0)) + ' markets' + (B.coi.length ? ' (' + B.coi.length + ' in Sumba appear only in the transparency ranking: conflict of interest)' : '') + (B.unrev.length ? '; ' + fmt(B.unrev.length) + ' added recently are not yet reviewed and are left out of the figures below' : '') + '.', '- ' + pct(S.pub.permit, S.n) + '% publish a permit or licence number; ' + pct(S.pub.escrow, S.n) + '% state deposit protection; ' + S.overdue + ' are past the handover date they advertise now.', '- ' + fmt(S.contra) + ' of ' + fmt(S.claims) + ' developer claims tested were contradicted by a register or independent source.', '- Cite as: Kolaboro off-plan database, kolaboro.com, data of ' + longDate(up) + ', CC BY 4.0. Pages have stable section anchors (#summary, #projects, #delays, #registers, #faq).');
  L.push('', '## Country hubs and guides');
  for (const x of list.filter(o => o.L.length)) { const s = stats(x.L); L.push('- [Off-plan projects in ' + x.c + '](' + SITE + '/countries/' + x.s + '/): ' + x.L.length + ' projects, ' + pct(s.pub.permit, s.n) + '% publish a permit number, ' + pct(s.pub.escrow, s.n) + '% state deposit protection. Guide: [how to check](' + SITE + '/countries/' + x.s + '/how-to-check/)' + (x.L.length >= SAFE_MIN ? ', [is it safe](' + SITE + '/countries/' + x.s + '/is-it-safe/)' : '') + (lawFor(B, x.c).length ? ', [buyer protection law](' + SITE + '/countries/' + x.s + '/buyer-protection-law/)' : '')); }
  { const lx = p => ['es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'].map(l => '[' + l + '](' + SITE + '/' + l + p + ')').join(', ');   // n40 k7 (R06-32): the guide families and /faq/, with their language versions
    L.push('', '## Guide hubs and buyer questions (8 languages)', '- [All buyer guides, by topic and by country](' + SITE + '/guides/): every guide family in one place. Also in ' + lx('/guides/') + '.', '- [Buyer questions answered with our data](' + SITE + '/faq/): short answers with figures and sources. Also in ' + lx('/faq/') + '.',
      '- How to check an off-plan project, by country: ' + SITE + '/countries/<country>/how-to-check/ (registers to search and what each one proves), e.g. [UAE](' + SITE + '/countries/uae/how-to-check/).', '- Is it safe to buy off-plan, by country: ' + SITE + '/countries/<country>/is-it-safe/ (dated figures on delays, permits and deposit protection), e.g. [Turkey](' + SITE + '/countries/turkey/is-it-safe/).',
      '- Guides for buyers from abroad: [Russia](' + SITE + '/guides/buyers-from/russia/), [China](' + SITE + '/guides/buyers-from/china/), [the Gulf](' + SITE + '/guides/buyers-from/gulf/).', '- [Short-let rules by city](' + SITE + '/guides/short-let-rules/): licence, caps and night limits with the official source.'); }
  L.push('', '## Buying off-plan: step-by-step guides by place (8 languages)', '- [All guides](' + SITE + '/guides/buying-off-plan/)');   // n27c
  for (const P of BUY_PLACES) L.push('- [Buying off-plan ' + BUY_PL[P.s].in.en + ': what to check](' + SITE + '/guides/buying-off-plan/' + P.s + '/): company, land, permit, deposit protection and handover record, with official sources and real project pages.');
  L.push('', '## Rankings', '- [Most delayed off-plan projects](' + SITE + '/rankings/most-delayed/): past the first handover date on record, by market.', '- [Most changed promises](' + SITE + '/rankings/changed-promises/): changes found between dated copies of developer pages.', '- [New projects this month](' + SITE + '/new/)', '- [Embeddable widgets](' + SITE + '/embed/widgets/)', '- [Off-plan Delivery Index, monthly frozen editions](' + SITE + '/press/delivery-index/): citeable permalinks with CSV');
  L.push('', '## New pages (17 and 18 November 2026)', '- [Contract and brochure reader](' + SITE + '/tools/contract-reader/): rule-based highlights of handover date, penalty, escrow, payment schedule, governing law and cancellation in a PDF, in the browser, nothing uploaded.',
    '- [Handover slippage by market](' + SITE + '/methods/handover-slippage/): months past the first handover date on record, median and quartiles, sample size and method; data at ' + SITE + '/api/v1/slippage', '- [Tamper-evident daily dataset](' + SITE + '/data/snapshots/): SHA-256 hash chain of each daily snapshot with an in-browser verifier.',
    '- [API v1 docs and playground](' + SITE + '/api/docs/) and [Kolaboro for developers](' + SITE + '/docs/): API, MCP server, widget, SDKs, with curl, Python and JavaScript examples.', '- [Data quality](' + SITE + '/engineering/data-quality/): coverage and freshness of each field, by market.',
    '- [Price history by place](' + SITE + '/prices/history/): headline prices by date of copy, as an index per project.', '- [Map of all projects](' + SITE + '/map/) with clustering and a delay layer.', '- [Embeddable widget v2](' + SITE + '/tools/widget/)', '- [Engineering status](' + SITE + '/engineering/status/): uptime, edge latency, deploy times, page weight.',
    '- [Figures of the month](' + SITE + '/reports/month/): same address every month.', '- [Glossary](' + SITE + '/glossary/) with real project examples, and [free tools](' + SITE + '/tools/), both now in 8 languages.', '- [Engineering notes](' + SITE + '/engineering/notes/) (English): how overdue handovers are decided, how sitemaps and crawler access are checked.',
    '- Per project: timeline ' + SITE + '/projects/<slug>/timeline/, verification certificate ' + SITE + '/projects/<slug>/certificate/, Markdown version ' + SITE + '/projects/<slug>.md (same as /answers/<slug>.md).', '- Change feed: ' + SITE + '/api/v1/changes?since=<ISO date> and ' + SITE + '/api/v1/changes/feed.json');
  const np = [...B.N.projects.values()], byId = new Map(B.all.map(c => [c.id, c]));
  if (np.length) {
    const cn = new Map(); for (const e of np) { const c = byId.get(e.id); if (c && c.country) cn.set(c.country, (cn.get(c.country) || 0) + 1); }
    L.push('', '## Per language and per country', '- Every named project with the quick answer of its page, in the page language: ' + ['es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'].map(l => '[' + l + '](' + SITE + '/' + l + '/llms.txt)').join(', ') + '; English: ' + SITE + '/llms-full.txt and ' + SITE + '/llms-projects.txt.', '- One answer file per project (quick answer, dated promises, permit, developer, changes, sources): ' + SITE + '/answers/<slug>.md', '- Per country, full answer of every project in one file (English): ' + SITE + '/llms-full/<country>.txt (same country slugs as below)', '- Questions about off-plan projects answered from our data, by market, country and developer: ' + SITE + '/answers/questions.md (JSON: ' + SITE + '/answers/questions.json)', '- Per country (English): ' + [...cn.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([c, n]) => '[' + c + '](' + SITE + '/llms/' + slug(c) + '.txt) ' + n).join(', '));
  }
  if (np.length) {
    const pm = new Map(); for (const e of np) { const c = byId.get(e.id); if (c && c.market) pm.set(c.market, (pm.get(c.market) || 0) + 1); }
    L.push('', '## Answer files per place and per developer', '- One Markdown answer file per place (every named project there with its quick answer, overdue handover dates, permits, rankings): ' + [...pm.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([m, n]) => '[' + m + '](' + SITE + '/answers/place/' + slug(m) + '.md) ' + n).join(', '),
      '- One per developer: ' + SITE + '/answers/developer/<slug>.md (slugs as in /developers/<slug>/; listed under Developers below)', '- Per-project data downloads: ' + SITE + '/api/v1/projects/<slug> (JSON) and ' + SITE + '/api/v1/projects/<slug>.csv (CSV), CC BY 4.0',
      '- Known errors and corrections: ' + SITE + '/corrections/ (also ' + SITE + '/corrections.json and ' + SITE + '/corrections.md)', '- MCP server (read-only, signed answers): ' + SITE + '/mcp with tools search_projects, get_project, project_quick_answer, compare_projects, list_by_handover_year, market_stats, database_stats; docs ' + SITE + '/docs/mcp/');
  }
  L.push('', '## Hubs', ...[['/projects/', 'All tracked projects, searchable'], ['/developers/', 'Developers, with projects, permits and delivery record'], ['/countries/', 'Country hubs'], ['/m/', 'Market files by place'], ['/rankings/', 'Rankings'], ['/handover/', 'Handover dates by year and place'], ['/handover/overdue/', 'Projects past the handover date on record'], ['/delays/', 'Off-plan delays of the week (same address every week, with an archive of earlier weeks)'], ['/weekly/', 'What changed this week, by place'], ['/new/', 'New projects this month'], ['/reports/', 'Market reports by place'], ['/vs/', 'Side-by-side comparisons'], ['/tools/', 'Free buyer tools'], ['/guides/buying-off-plan/', 'Buying guides by place'], ['/registers/', 'Official registers we read, by country'], ['/glossary/', 'Glossary'], ['/map/', 'Map of all projects'], ['/numbers/', 'Key figures with sources'], ['/press/delivery-index/', 'Off-plan Delivery Index, monthly editions']].map(([p, d]) => '- [' + d + '](' + SITE + p + ')'));
  L.push('', '## Open data (CC BY 4.0)', '- [Data catalog](' + SITE + '/data/): every public dataset with licence, update frequency, size, SHA-256 and download', '- [SQL in the browser](' + SITE + '/data/sql/): versioned Parquet and CSV (projects, claims, markets), data card at ' + SITE + '/data/sql/datacard.json', '- [Daily snapshots with a hash chain](' + SITE + '/data/snapshots/)', '- [API v1](' + SITE + '/api/docs/): ' + SITE + '/api/v1/projects/<slug>, ' + SITE + '/api/v1/changes, change feed ' + SITE + '/api/v1/changes/feed.json', '- [Search all claims and sources](' + SITE + '/claims/search/), [anomaly radar](' + SITE + '/anomalies/), [entity graph](' + SITE + '/graph/entities/), [offline verifier](' + SITE + '/verify/offline/), [build provenance](' + SITE + '/engineering/provenance/), [satellite construction index](' + SITE + '/satellite/construction-index/)');
  try { const T = (await import('./kbx_g27.js')).TOP_IDS, ids = Array.isArray(T) ? T : String(T).split(/\s+/), byPid = new Map(np.map(e => [e.id, e])), top = ids.map(i => byPid.get(i)).filter(e => e && e.loc && !/eco\s*beach|equinox|sumba/i.test(String(e.name))).slice(0, 300);
    if (top.length) { L.push('', '## Most searched project pages (' + top.length + ')'); for (const e of top) L.push('- [' + e.name + '](' + e.loc + ') Answers: ' + SITE + '/answers/' + String(e.loc).replace(/\/$/, '').split('/').pop() + '.md'); } } catch (e) {}
  if (np.length) {
    L.push('', '## Named projects (facts only; each page has a right of reply)');
    for (const e of (full ? np : np.slice(0, 400))) { const c = byId.get(e.id); if (e.summary) { L.push('- [' + e.name + '](' + e.loc + '): ' + e.summary + ' Answers: ' + SITE + '/answers/' + String(e.loc).replace(/\/$/, '').split('/').pop() + '.md'); continue; } if (c && !reviewed(c)) { L.push('- [' + e.name + '](' + e.loc + '): ' + (c.stage || 'off-plan') + ' in ' + place(c) + ', ' + c.country + '; not yet reviewed by Kolaboro.'); continue; } const lm = c && lateMonths(B, c); L.push('- [' + e.name + '](' + e.loc + ')' + (c ? ': ' + (c.stage || 'off-plan') + ' in ' + place(c) + ', ' + c.country + (e.developer ? ', developer ' + e.developer : '') + '; ' + c.score + '/6 buyer checks public, ' + (c.vscore || 0) + ' confirmed' + (c.done ? '; handover advertised ' + c.done : '') + (lm && lm.late > 0 ? '; ' + lm.late + ' months past the first handover date on record' : '') + '; checked ' + c.checked + '.' : (e.summary ? ': ' + e.summary : ''))); }
    if (!full && np.length > 400) L.push('- ' + (np.length - 400) + ' more in ' + SITE + '/llms-full.txt and ' + SITE + '/sitemap_index.xml');
    const dv = B.N.developers; if (dv.length) { L.push('', '## Developers'); for (const e of dv) L.push('- [' + (e.name || e.loc) + '](' + e.loc + ')' + (e.summary ? ': ' + e.summary : '') + ' Answers: ' + SITE + '/answers/developer/' + String(e.loc).replace(/\/$/, '').split('/').pop() + '.md'); }
  } else L.push('', '## Projects', '- Every tracked project has a facts page at ' + SITE + '/p/<id>/ (ids in /data/bali-cases.json); market files at ' + SITE + '/m/<market>/.');
  const live = st.replace(/covers [\d,]+ off-plan projects in \d+ markets and \d+ countries \([^)]*\), [\d,]+ developer claims tested/, 'covers ' + fmt(B.all.length + B.coi.length) + ' off-plan projects in ' + (new Set(B.all.map(c => c.market)).size + (B.coi.length ? 1 : 0)) + ' markets and ' + list.length + ' countries (' + longDate(up) + '), ' + fmt(S.claims) + ' developer claims tested');
  return new Response(live.replace(/\s+$/, '') + '\n' + L.join('\n') + '\n', { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=600' } });
}

const SD_PAGES = ['/', '/es/', '/ar/', '/projects/emaar-golf-vale/', '/fr/projects/emaar-golf-vale/', '/projects/emaar-golf-vale/record/', '/developers/emaar-properties/', '/m/dubai/', '/de/m/dubai/', '/countries/spain/', '/rankings/most-delayed/', '/new/', '/data/', '/data/delays/', '/glossary/', '/engineering/', '/yc/'];
let SDM = null;
async function sdLive() {
  if (SDM && Date.now() - SDM.t < 600000) return SDM.v;
  const one = async p => {
    const o = { p, st: 0, blocks: 0, nodes: 0, types: {}, issues: [] };
    try { const r = await fetch(SITE + p, { headers: { 'user-agent': 'kolaboro-sd-check/1.0' }, redirect: 'manual' }); o.st = r.status; if (r.status !== 200) { o.issues.push('HTTP ' + r.status); try { await r.body.cancel(); } catch (e) {} return o; }
      const h = await r.text(), lang = (/<html[^>]*\blang="([a-zA-Z-]+)"/.exec(h) || [])[1] || '', can = (/<link rel="canonical" href="([^"]+)"/.exec(h) || [])[1] || '';
      const B = [...h.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]); o.blocks = B.length; if (!B.length) o.issues.push('no JSON-LD');
      const walk = (x, top) => { if (Array.isArray(x)) return x.forEach(y => walk(y, top)); if (!x || typeof x !== 'object') return;
        if (x['@type']) { o.nodes++; for (const ty of [].concat(x['@type'])) { o.types[ty] = (o.types[ty] || 0) + 1; if (/^(Review|AggregateRating|ClaimReview)$/.test(ty)) o.issues.push(ty + ' present'); }
          if (x['@type'] === 'BreadcrumbList') { const L = x.itemListElement || []; if (!L.length || L.some((e, i) => +e.position !== i + 1 || !e.name)) o.issues.push('breadcrumb positions or names'); }
          if (x.inLanguage && lang && typeof x.inLanguage === 'string' && x.inLanguage.slice(0, 2).toLowerCase() !== lang.slice(0, 2).toLowerCase()) o.issues.push('inLanguage ' + x.inLanguage + ' on a ' + lang + ' page');
          if (top && /Page$/.test([].concat(x['@type'])[0]) && x.url && can && x.url !== can) o.issues.push('page url ' + x.url + ' differs from canonical'); }
        else if (top && !x['@graph']) o.issues.push('node without @type');
        for (const k in x) if (k !== '@context' && x[k] && typeof x[k] === 'object') walk(x[k], false); };
      for (const b of B) { let j; try { j = JSON.parse(b); } catch (e) { o.issues.push('JSON does not parse'); continue; }
        for (const n of [].concat(j)) { if (!/schema\.org/.test(JSON.stringify(n['@context'] || ''))) o.issues.push('no schema.org @context'); walk(n['@graph'] || n, true); } }
    } catch (e) { o.issues.push('fetch failed'); }
    o.issues = [...new Set(o.issues)]; return o;
  };
  const v = { at: new Date().toISOString(), pages: await Promise.all(SD_PAGES.map(one)) }; SDM = { t: Date.now(), v }; return v;
}
export async function sdSection() {
  let d; try { d = await sdLive(); } catch (e) { return ''; }
  const ok = d.pages.filter(x => !x.issues.length).length, n = d.pages.reduce((a, x) => a + x.nodes, 0);
  return h2('sd-live', 'Structured data, every template checked live') + '<p>Read ' + esc(longDate(d.at.slice(0, 10))) + ' ' + esc(d.at.slice(11, 16)) + ' UTC: <b>' + ok + ' of ' + d.pages.length + ' templates pass</b>, ' + n + ' schema.org nodes. Checks: every JSON-LD block parses and names schema.org, every node has a type, no Review, AggregateRating or ClaimReview, the page node matches the canonical URL, breadcrumbs run 1 to n with names, and the language matches the page.</p>' +
    tableWrap(['Page', 'Blocks', 'Nodes', 'Main types', 'Result'], d.pages.map(x => '<tr><td><a href="' + esc(x.p) + '"><code>' + esc(x.p) + '</code></a></td><td>' + x.blocks + '</td><td>' + x.nodes + '</td><td>' + esc(Object.entries(x.types).sort((a, b) => b[1] - a[1]).slice(0, 4).map(e => e[0]).join(', ')) + '</td><td>' + (x.issues.length ? '<b>' + esc(x.issues.join('; ')) + '</b>' : 'pass') + '</td></tr>'));
}
async function pSeo(env, B) {
  const audit = await file(env, '/data/seo-audit.json'), cnt = await sitemaps(env, B, 'stats'), lh = await file(env, '/data/lighthouse.json'), inow = await file(env, '/data/indexnow.json'), daily = await file(env, '/data/seo-daily.json');
  const total = Object.values(cnt).reduce((a, b) => a + b, 0);
  let body = '<div class="sx-sum" id="summary"><p><b>' + fmt(total) + ' URLs are listed in our sitemaps right now</b> (computed live from <a href="/sitemap_index.xml">/sitemap_index.xml</a>). ' + (audit ? 'Last crawl ' + esc(audit.generated_at) + ': ' + fmt(audit.summary.crawled) + ' URLs fetched' + (audit.summary.in_sitemaps ? ' of ' + fmt(audit.summary.in_sitemaps) + ' listed (translated project and developer pages are sampled)' : '') + ', ' + fmt(audit.summary.indexable) + ' indexable, ' + fmt(audit.summary.schema_valid_pages) + ' with valid structured data' + (audit.indexable_estimate_all ? '; about ' + fmt(audit.indexable_estimate_all) + ' indexable across all listed URLs at the sample pass rate' : '') + '.' : 'The first crawl result is not published yet.') + '</p><p>Search Console and Bing Webmaster figures (clicks, impressions, index coverage) will appear here once the site owner connects them; we do not estimate them.</p><p>External links, measured every week: <a href="/engineering/seo/links/">/engineering/seo/links/</a>.</p></div>';
  const extN = await Promise.all(EXT_MAPS.map(async x => { const m = MEMO['__ext' + x]; if (m && m.v) return [x, m.v]; if (!B.inner) return [x, null];
    try { const v = await Promise.race([B.inner(x).then(r => r && r.ok ? r.text() : '').then(t => t ? { n: (t.match(/<url>/g) || []).length, last: null } : null), new Promise(r => setTimeout(() => r(null), 2500))]); return [x, v]; } catch (e) { return [x, null]; } }));   // n29t (item 50): the sitemaps other modules publish, with their URL counts when read
  body += h2('sitemaps', 'Sitemap coverage') + tableWrap(['Sitemap', 'URLs'], Object.entries(cnt).map(([k, v]) => '<tr><td>' + (v ? '<a href="/sitemaps/' + k + '.xml">' + k + '</a>' : k) + '</td><td>' + v + '</td></tr>').concat(extN.map(([x, v]) => '<tr><td><a href="' + x + '">' + x.replace(/^\//, '').replace(/\/sitemap\.xml$/, '') + '</a></td><td>' + (v && v.n != null ? v.n : 'not read yet') + '</td></tr>')));
  if (audit) {
    const s = audit.summary;
    body += h2('crawl', 'Crawl audit') + '<p class="muted">Crawler: tools/kolaboro-seo/audit.py on main (user agent KolaboroSEOAudit/1.0). It fetches every sitemap URL with GET and HEAD and checks status codes, canonicals, hreflang reciprocity and JSON-LD.</p><div class="sx-kv">' + [['crawled', 'URLs crawled'], ['ok_200', 'answered 200'], ['indexable', 'indexable (200, self-canonical, not noindex)'], ['schema_valid_pages', 'pages with valid JSON-LD'], ['schema_errors', 'JSON-LD errors'], ['head_mismatch', 'HEAD differs from GET'], ['canonical_mismatch', 'canonical points elsewhere'], ['hreflang_errors', 'hreflang errors'], ['redirects', 'sitemap URLs that redirect'], ['errors_4xx_5xx', '4xx or 5xx'], ['image_sitemap_images', 'images in the image sitemap'], ['image_errors', 'image sitemap errors'], ['lastmod_future', 'lastmod dates in the future']].filter(([k]) => s[k] != null).map(([k, t]) => '<div><b>' + fmt(s[k]) + '</b><span>' + t + '</span></div>').join('') + '</div>';
    if (audit.coverage) body += '<h3 id="coverage">Coverage by sitemap</h3>' + tableWrap(['Sitemap', 'Listed', 'Crawled', 'Answered 200', 'Indexable', 'Canonical elsewhere', 'Noindex', 'Not 200'], Object.entries(audit.coverage).map(([k, c]) => '<tr><td>' + esc(k) + '</td><td>' + fmt(c.listed) + '</td><td>' + fmt(c.crawled) + '</td><td>' + fmt(c.ok_200) + '</td><td>' + fmt(c.indexable) + '</td><td>' + fmt(c.canonical_elsewhere) + '</td><td>' + fmt(c.noindex) + '</td><td>' + fmt(c.not_200) + '</td></tr>')) + '<p class="muted">Translated project and developer sitemaps are sampled, so "crawled" is lower than "listed" there.</p>';
    if (audit.internal_links) { const il = audit.internal_links; body += '<h3 id="orphans">Orphan pages</h3><p>' + fmt(il.judged) + ' sitemap pages judged: <b>' + fmt(s.orphans || 0) + '</b> that no crawled page links to, ' + fmt(s.weakly_linked || 0) + ' linked from exactly one page. ' + esc(il.method || '') + (il.not_judged && il.not_judged.length ? ' Not judged (sampled): ' + esc(il.not_judged.join(', ')) + '.' : '') + '</p>' + ((il.orphans || []).length ? '<details><summary>Orphan pages (' + fmt(il.orphans.length) + ')</summary><ul class="sx-l">' + il.orphans.slice(0, 200).map(x => '<li><a href="' + esc(x.replace(SITE, '')) + '">' + esc(x.replace(SITE, '')) + '</a></li>').join('') + '</ul></details>' : ''); }
    else body += '<h3 id="orphans">Orphan pages</h3><p>The weekly crawl counts, for every sitemap page, how many crawled pages link to it; the first run with this check has not been published yet.</p>';
    if ((audit.problems || []).length) body += '<h3>Open problems (first 40)</h3><ul class="sx-l">' + audit.problems.slice(0, 40).map(p => '<li><code>' + esc(p.url.replace(SITE, '')) + '</code>: ' + esc(p.issue) + '</li>').join('') + '</ul>';
    if ((audit.history || []).length) body += '<h3>History</h3>' + tableWrap(['Run', 'Crawled', 'Indexable', 'Valid schema', 'Problems'], audit.history.slice(-14).reverse().map(h => '<tr><td>' + esc(h.at) + '</td><td>' + h.crawled + '</td><td>' + h.indexable + '</td><td>' + h.schema_valid_pages + '</td><td>' + h.problems + '</td></tr>'));
  }
  body += h2('daily', 'Daily sample check: structured data, 404s and redirects');
  if (daily && daily.summary) {
    const d = daily.summary;
    body += '<p>Run ' + esc(daily.generated_at) + ' by tools/kolaboro-seo/daily.py on main, every day after the IndexNow job. ' + esc(daily.method || '') + ' Raw result: <a href="/data/seo-daily.json">/data/seo-daily.json</a>.</p><div class="sx-kv">' +
      [[d.pages, 'pages sampled today'], [d.pages_ok, 'passed every check'], [d.ld_valid + ' / ' + d.ld_pages, 'with valid structured data'], [d.links_checked, 'internal links requested'], [d.broken, 'broken (4xx, 5xx)'], [d.redirects, 'through a redirect']].map(([v, l]) => '<div><b>' + esc(typeof v === 'number' ? fmt(v) : v) + '</b><span>' + l + '</span></div>').join('') + '</div>';
    const L = (daily.broken || []).map(x => '<li><code>' + esc(x.url) + '</code>: ' + esc(x.status) + ', linked from <code>' + esc(x.found_on) + '</code></li>').concat((daily.problems || []).slice(0, 20).map(x => '<li><code>' + esc(x.url) + '</code>: ' + esc(x.issue) + '</li>'), (daily.redirects || []).slice(0, 20).map(x => '<li><code>' + esc(x.url) + '</code>: ' + esc(x.status) + ' to <code>' + esc(x.to) + '</code>, linked from <code>' + esc(x.found_on) + '</code></li>'));
    body += L.length ? '<h3>Found today</h3><ul class="sx-l">' + L.slice(0, 60).join('') + '</ul>' : '<p>Nothing found today.</p>';
    if ((daily.history || []).length > 1) body += '<h3>Last runs</h3>' + tableWrap(['Run', 'Pages', 'Passed', 'Links', 'Broken', 'Redirects'], daily.history.slice(-14).reverse().map(x => '<tr><td>' + esc(x.at) + '</td><td>' + x.pages + '</td><td>' + x.pages_ok + '</td><td>' + x.links_checked + '</td><td>' + x.broken + '</td><td>' + x.redirects + '</td></tr>'));
  } else body += '<p>The first daily run has not been published yet. It runs every day after the IndexNow job (tools/kolaboro-seo/daily.py on main) and writes <code>/data/seo-daily.json</code>.</p>';
  if (lh && Array.isArray(lh.runs)) { const rows = lh.runs.filter(r => r.form_factor === 'mobile'); const over = rows.filter(r => (r.metrics || {}).lcp_ms >= 2500 || (r.metrics || {}).cls >= 0.1 || (r.metrics || {}).tbt_ms >= 200).length; body += h2('cwv', 'Core Web Vitals budget (lab, Lighthouse, mobile)') + '<p>Budget per page: LCP under 2,500 ms, CLS under 0.1, TBT under 200 ms (lab stand-in for INP). ' + (rows.length - over) + ' of ' + rows.length + ' key pages are within budget. Source: <a href="/data/lighthouse.json">/data/lighthouse.json</a>, run ' + esc(String(lh.generated || '').slice(0, 16).replace('T', ' ')) + ' UTC. Real-user figures: <a href="/engineering/speed/">speed</a>.</p>' + tableWrap(['Page', 'Performance', 'LCP', 'CLS', 'TBT', 'Budget'], rows.map(r => { const m = r.metrics || {}, ok = m.lcp_ms < 2500 && m.cls < 0.1 && m.tbt_ms < 200; return '<tr><td><a href="' + esc(r.page) + '">' + esc(r.page) + '</a></td><td>' + esc((r.scores || {}).performance) + '</td><td>' + fmt(m.lcp_ms) + ' ms</td><td>' + m.cls + '</td><td>' + fmt(m.tbt_ms) + ' ms</td><td>' + (ok ? 'within' : 'over') + '</td></tr>'; })); }
  const T = B.T;
  if (T) {
    const ds = [...T.project.values()].sort(), today = new Date().toISOString().slice(0, 10), wk = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    const byDay = new Map(); for (const d of ds) byDay.set(d, (byDay.get(d) || 0) + 1);
    body += h2('lastmod', 'True lastmod') + '<p>Every named project page carries the date of the last real change of its data, not the date we last checked it and not the deploy date. Five parts are fingerprinted per project without volatile dates (facts in <a href="/data/named.json">named.json</a>, the case in <a href="/data/bali-cases.json">bali-cases.json</a>, dated promises, live findings, the satellite series); a part keeps the date its fingerprint was first seen (<a href="/data/lastmod.json">/data/lastmod.json</a>, ' + (T.pinned ? 'pinned ' + esc(String(T.pinned).slice(0, 16).replace('T', ' ')) + ' UTC' : 'no pin published yet') + '). Developer pages take the latest of their projects; hubs the latest of the projects they list. IndexNow only receives URLs whose lastmod moved.</p>' +
      '<div class="sx-kv"><div><b>' + fmt(ds.length) + '</b><span>projects with a true lastmod</span></div><div><b>' + fmt(ds.filter(d => d >= wk).length) + '</b><span>changed in the last 7 days</span></div><div><b>' + fmt(ds.filter(d => d === today).length) + '</b><span>changed today</span></div></div>' +
      tableWrap(['Last data change', 'Projects'], [...byDay.entries()].sort((a, b) => a[0] < b[0] ? 1 : -1).slice(0, 10).map(([d, n]) => '<tr><td>' + longDate(d) + '</td><td>' + fmt(n) + '</td></tr>'));
  }
  body += h2('images', 'Image sitemap') + '<p><a href="/sitemaps/images.xml">/sitemaps/images.xml</a> lists ' + fmt(cnt.images || 0) + ' English pages with their images: every named project and developer page with its 1200 x 630 facts card and, where we hold one, the monthly Sentinel-2 satellite strip, plus the static pages that carry their own share image. Each card is also an <code>ImageObject</code> (primaryImageOfPage) in the page\'s JSON-LD.</p>';
  body += await sdSection();   // n39 t3
  body += h2('hygiene', 'Crawl rules') + '<ul class="sx-l"><li>One URL per page: trailing slash, lower case; <code>/p/&lt;id&gt;/</code>, <code>/projects/x</code> and <code>index.html</code> answer one 301 to the final URL (no chains).</li><li>Pages reached with a functional query (<code>?q=</code>, <code>?sort=</code>, <code>?lang=</code> ...) answer <code>X-Robots-Tag: noindex, follow</code>; tracking-only queries (<code>utm_*</code>, <code>gclid</code>, <code>fbclid</code>) keep the canonical as the only signal.</li><li><a href="/robots.txt">robots.txt</a> allows every search and answer-engine crawler (Googlebot, Bingbot, GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Applebot and others) on public pages.</li><li>Structured data on named pages: WebPage or ProfilePage, Organization, Residence or ApartmentComplex with GeoCoordinates where the location is public, Dataset, FAQPage, BreadcrumbList, ImageObject. Never Review, AggregateRating or ClaimReview.</li><li>Since 20 Nov 2026: every <code>/api/</code> answer carries <code>X-Robots-Tag: noindex</code>; old query addresses (<code>/p/?id=</code>, <code>/m/?market=</code>, translated <code>/ask-developer/?id=</code>) answer one 301 to the clean page, and an id we do not hold answers a real 404; links to addresses with a query string carry <code>rel="nofollow"</code>; robots.txt closes <code>/api/kb/</code>, <code>/k/</code> (except scripts, styles, fonts and images) and, for search crawlers, <code>/api/x/</code>.</li><li>Crawlers revalidate pages with <code>If-Modified-Since</code> and get a 304 when the page did not change (the edge remembers each page\'s fingerprint).</li><li>hreflang check: <a href="/open/hreflang-check.py">/open/hreflang-check.py</a> (Python standard library) samples every sitemap and checks status, noindex, self-canonical, return links and x-default.</li></ul>';
  try {
    const il = await file(env, '/data/seo-index-log.json'), vl = await file(env, '/data/seo-validation.json'), pr = await file(env, '/data/seo-priority.json');
    if (il && (il.weeks || []).length) {
      const K = [['indexed', 'Indexed'], ['not_indexed', 'Not indexed'], ['discovered_not_indexed', 'Discovered, not indexed'], ['crawled_not_indexed', 'Crawled, not indexed'], ['noindex', 'Excluded by noindex'], ['alternate_canonical', 'Alternate with canonical'], ['redirect', 'Redirect'], ['not_found', '404'], ['clicks_28d', 'Clicks, 28 days'], ['impressions_28d', 'Impressions, 28 days']];
      body += h2('indexing-log', 'Indexing log') + '<p>' + esc(il.source || '') + ' Counts only. Raw file: <a href="/data/seo-index-log.json">/data/seo-index-log.json</a>.</p>' + tableWrap(['Read on'].concat(K.map(k => k[1])), il.weeks.slice().reverse().map(w => '<tr><td>' + esc(w.date) + '</td>' + K.map(([k]) => '<td>' + (w[k] == null ? '-' : fmt(w[k])) + '</td>').join('') + '</tr>'));
    }
    if (vl && (vl.lists || []).length) body += h2('validation', 'Validation lists') + '<p>' + esc(vl.note || '') + ' Checked ' + esc(vl.checked || '') + '. Raw file: <a href="/data/seo-validation.json">/data/seo-validation.json</a>.</p>' + tableWrap(['Fix', 'URLs', 'Answer now'], vl.lists.map(x => '<tr><td>' + esc(x.name) + '</td><td>' + fmt(x.n != null ? x.n : (x.urls || []).length) + '</td><td>' + esc(x.now || '') + '</td></tr>'));
    if (pr && (pr.recrawl || []).length) body += h2('recrawl', 'Re-crawl sitemap') + '<p><a href="/sitemaps/recrawl.xml">/sitemaps/recrawl.xml</a> lists the pages with Search Console impressions and no clicks that we changed, so they are fetched again soon; the same pages come first in their own sitemap, followed by the most searched projects. Source: ' + esc(pr.source || '') + '. List: <a href="/data/seo-priority.json">/data/seo-priority.json</a>.</p>';
  } catch (e) {}
  body += h2('indexnow', 'IndexNow') + (inow ? '<p>Last submission ' + esc(inow.at) + ': ' + fmt(inow.submitted) + ' URLs, HTTP ' + esc(inow.status) + ' from api.indexnow.org (shared with Bing, Yandex, Naver, Seznam and Yep). ' + fmt(inow.known) + ' URLs known in total.</p>' : '<p>No submission recorded yet.</p>') + '<p>Key file: <a href="/' + INDEXNOW_KEY + '.txt">/' + INDEXNOW_KEY + '.txt</a>. Google does not use IndexNow; it reads <a href="/sitemap_index.xml">the sitemap index</a> listed in <a href="/robots.txt">robots.txt</a>.</p>';
  body += h2('search-console', 'Search Console and Bing Webmaster') + '<p>Not connected yet. The domain is verified in Search Console; clicks, impressions and index coverage will only be shown here once the site owner grants read access (Search Console API with the read-only scope, or a service account added as a restricted user). We do not estimate them. Sitemap to submit: <a href="/sitemap_index.xml">/sitemap_index.xml</a>.</p>';
  return render({ path: '/engineering/seo/', title: 'Search and indexation: sitemaps, crawl audit, structured data | Kolaboro engineering', h1: 'Search and indexation', lead: 'How much of kolaboro.com search engines and answer engines can find, measured, not estimated.', desc: fmt(total) + ' URLs in the sitemaps; crawl audit of status codes, canonicals, hreflang and structured data; Core Web Vitals budget; IndexNow submissions.', updated: (audit && audit.generated_at || B.d.updated).slice(0, 10), crumbs: [['Kolaboro', '/'], ['Engineering', '/engineering/'], ['Search and indexation', '/engineering/seo/']], body });
}

export async function sitemapStats(env, inner) { const B = await base(env, inner); return sitemaps(env, B, 'stats'); }

export async function handle(req, u, env, ctx, shell, inner) {
  const p = u.pathname;
  if (p === '/' + INDEXNOW_KEY + '.txt') return new Response(INDEXNOW_KEY, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=86400' } });
  if (p === '/api/seo/lastmod') return lastmodRoute(env);   // batch 15: true lastmod state (published as /data/lastmod.json by the SEO workflow)
  if (/^\/(countries|rankings|vs|new|embed\/(delay|project|widgets)|engineering\/seo|press\/delivery-index)(\/[^?#.]*)?$/.test(p) && !p.endsWith('/')) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } });
  const ckey = req.method === 'GET' && (!u.search || [...u.searchParams.keys()].every(k => /^(utm_[a-z_]+|gclid|gbraid|wbraid|fbclid|msclkid|mc_[a-z]+|igshid|ref|_ga)$/i.test(k) || (k === 'p' && /^\d{1,3}$/.test(u.searchParams.get('p'))))) && env && env.CF_PAGES_COMMIT_SHA && /^\/(countries|rankings|vs|new|press\/delivery-index|embed\/widgets)\//.test(p) && typeof caches !== 'undefined' ? new Request(SITE + '/__seo_html/v2/' + env.CF_PAGES_COMMIT_SHA + p + (u.searchParams.get('p') ? '?p=' + u.searchParams.get('p') : '')) : null;
  if (ckey) { try { const hit = await caches.default.match(ckey); if (hit) { const h = new Headers(hit.headers); h.set('x-seo-cache', 'hit'); h.set('cache-control', 'no-cache'); return new Response(hit.body, { status: hit.status, headers: h }); } } catch (e) {} }
  let B; try { B = await base(env, inner); } catch (e) { return new Response('Data temporarily unavailable', { status: 503, headers: { 'retry-after': '60', 'content-type': 'text/plain' } }); }
  if (p === '/sitemap_index.xml') { B.inner = inner; B.ctx = ctx; return sitemaps(env, B, 'index'); }
  let m = /^\/sitemaps\/([a-z0-9-]+)\.xml$/.exec(p); if (m) return sitemaps(env, B, m[1]);
  if (p === '/llms.txt' || p === '/llms-full.txt') return llms(env, B, p === '/llms-full.txt');
  if ((m = /^\/press\/delivery-index\/(\d{4}-\d{2})\.csv$/.exec(p))) { const c = diCsv(B, m[1]); return c ? new Response(c, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'inline; filename="kolaboro-delivery-index-' + m[1] + '.csv"', 'link': '<https://kolaboro.com/press/delivery-index/' + m[1] + '/>; rel="describedby"', 'cache-control': 'public, max-age=86400' } }) : new Response('Not found', { status: 404 }); }
  const nf = async () => { const s = await shell('/404'); return new Response(s.body, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } }); };
  if ((m = /^\/embed\/delay\/([a-z0-9-]+)\/$/.exec(p))) { const h = eDelay(B, m[1]); return h ? new Response(h, { headers: EMBED_HDR }) : nf(); }
  if ((m = /^\/embed\/project\/([a-z0-9-]+)\/$/.exec(p))) { const h = eProject(B, m[1]); return h ? new Response(h, { headers: EMBED_HDR }) : nf(); }
  try { const k = B.d.updated + '|' + ((B.T && B.T.pinned) || '') + '|' + B.N.all.length; if (!MEMO.__hlm || MEMO.__hlm.k !== k) MEMO.__hlm = { k, v: new Map((await hubUrls(B)).map(h => [h.loc.replace(SITE, ''), h.lastmod])) }; HLM = MEMO.__hlm.v; } catch (e) { HLM = null; }
  if (!CSS) { const c = await file(env, '/data/seo-hub-css.json', 864e5); CSS = (c && c.css) || ''; }
  let R = null;
  if (p === '/countries/') R = pCountries(B);
  else if ((m = /^\/countries\/([a-z0-9-]+)\/(?:(how-to-check|is-it-safe|buyer-protection-law)\/)?$/.exec(p))) {
    const x = findCountry(B, m[1]);
    if (x) { if (!m[2]) R = pCountry(B, x); else if (!x.L.length) R = null; else if (m[2] === 'how-to-check') R = pCheck(B, x); else if (m[2] === 'is-it-safe') R = x.L.length >= SAFE_MIN ? pSafe(B, x) : null; else R = lawFor(B, x.c).length ? pLaw(B, x) : null; }
  }
  else if (p === '/rankings/') R = pRankings(B);
  else if (p === '/rankings/most-delayed/') R = pDelayed(B, null);
  else if ((m = /^\/rankings\/most-delayed\/([a-z0-9-]+)\/$/.exec(p))) { const mk = marketsWithDelays(B).find(([x]) => slug(x) === m[1]); R = mk ? pDelayed(B, mk[0]) : null; }
  else if (p === '/rankings/changed-promises/') R = pChanged(B);
  else if (p === '/new/') R = pNew(B, u);
  else if (p === '/vs/') R = pVs(B, null, u);
  else if ((m = /^\/vs\/([a-z0-9-]+)\/$/.exec(p))) R = pVs(B, m[1]);
  else if (p === '/embed/widgets/') R = pWidgets(B);
  else if (p === '/engineering/seo/') { B.inner = inner; R = await pSeo(env, B); }
  else if (p === '/press/delivery-index/') R = pDeliveryIndex(B, null);
  else if ((m = /^\/press\/delivery-index\/(\d{4}-\d{2})\/$/.exec(p))) R = pDeliveryIndex(B, m[1]);
  if (!R) return nf();
  if (R.redirect) return new Response(null, { status: 301, headers: { location: R.redirect } });
  const res = await shellOut(shell, R);
  if (!ckey || res.status !== 200) return res;
  const html = await res.text(), h = new Headers(res.headers); h.set('cache-control', 'max-age=3600');
  try { const put = caches.default.put(ckey, new Response(html, { status: 200, headers: h })); if (ctx && ctx.waitUntil) ctx.waitUntil(put.catch(() => {})); } catch (e) {}
  const h2 = new Headers(res.headers); h2.set('x-seo-cache', 'miss'); h2.set('cache-control', 'no-cache');
  return new Response(html, { status: 200, headers: h2 });
}
export { sitemaps, countryList, hubUrls };
export async function guideIndex(env, inner) { const B = await base(env, inner); return countryList(B).filter(x => x.L.length).map(x => ({ c: x.c, s: x.s, n: x.L.length, safe: x.L.length >= SAFE_MIN, law: lawFor(B, x.c).length > 0 })); }   // n40 R01-33: the /guides/ hub
export async function sitemapTotal(env, inner) { const B = await base(env, inner); const c = await sitemaps(env, B, 'stats'); return Object.values(c).reduce((a, b) => a + b, 0); }
