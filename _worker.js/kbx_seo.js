const $q = TB.kbx_seo__q, $s = TB.kbx_seo__s;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import * as KB from './kolaboro.js';
import { trueLastmod, lastmodRoute } from './kbx_lastmod.js';
import { BUY_PLACES, PL as BUY_PL } from './kbx_buy_i18n.js';   // batch 27 (n27c): step-by-step buying guides per place
import { placesForCountry } from './kbx_tr_places.js';   // batch 23 (n23): links to the transparency rankings of a country's islands and cities   // batch 15 (s15b): date of the last real data change per project
import { ogImg } from './kbx_ogt.js';
import { TB } from './kbx_strings.js';   // n29t: share image per page type
const { openData } = KB;

const SITE = 'https://kolaboro.com';
export const INDEXNOW_KEY = '7f3c9a1e5b2d4c8fa06e91d3b7c4f259';
export const PATHS = /^\/(sitemap_index\.xml|api\/seo\/lastmod|sitemaps\/[a-z0-9-]+\.xml|llms(-full)?\.txt|countries(\/.*)?|rankings(\/.*)?|new\/?|vs(\/.*)?|embed\/(delay|project|widgets)(\/.*)?|engineering\/seo\/?|press\/delivery-index(\/.*)?|7f3c9a1e5b2d4c8fa06e91d3b7c4f259\.txt)$/;
const LANGS = ['en', 'es', 'de', 'fr', 'ru', 'nl', 'ar', 'zh'];
const CHECKS = ['permit', 'escrow', 'progress', 'plans', 'record', 'returns_ok'];
const CKN = { permit: 'Permit or licence number', escrow: 'Deposit protection', progress: 'Construction progress', plans: 'Site or floor plans', record: 'Developer track record', returns_ok: 'No guaranteed-return language' };
const isPub = (c, k) => { const v = (c.checks || {})[k]; return k === $q.a ? v === 2 : k === $q.b ? v != null : v === true; };
const isConf = (c, k) => [$q.c, $q.d].includes((c.verified || {})[k]);
const ALIAS = { 'Puerto Rico (USA)': 'Puerto Rico', 'St Lucia': 'Saint Lucia', 'United States': 'USA', 'United Arab Emirates': 'UAE' };
const ctry = c => ALIAS[c] || c;
export const slug = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const slugM = m => encodeURIComponent(String(m).toLowerCase().replace(/\s+/g, '-'));   // same rule as /m/<market>/ in kolaboro.js
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.e, "'": '&#39;' }[c]));
const xesc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.e, "'": $q.f }[c]));
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const fmt = n => Number(n || 0).toLocaleString('en-US');
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const longDate = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? (+m[3]) + ' ' + MONTHS[+m[2] - 1] + ' ' + m[1] : String(iso || ''); };
const ymIdx = s => { const m = /^(\d{4})-(\d{2})/.exec(s || ''); return m ? +m[1] * 12 + (+m[2] - 1) : null; };
const ymName = s => { const m = /^(\d{4})-(\d{2})/.exec(s || ''); return m ? MONTHS[+m[2] - 1] + ' ' + m[1] : ''; };

const MEMO = {};
function file(e, p, t) { return FQ[p] || (FQ[p] = file0(e, p, t).finally(() => { delete FQ[p]; })); }   // n40 k21: one shared read per file, failed reads retried after 15 s
const FQ = {};
async function file0(env, name, ttl) {
  const m = MEMO[name]; if (m && Date.now() - m.t < (ttl || 300000)) return m.v;
  let v = null;
  try { const r = await env.ASSETS.fetch(new Request(SITE + $q.g + name)); if (r.ok) v = /\.json$/.test(name) ? await r.json() : await r.text(); } catch (e) { v = null; }
  if (v == null && m) v = m.v; MEMO[name] = { t: v == null ? Date.now() - (ttl || 300000) + 15000 : Date.now(), v }; return v;
}
const named = inner => NQ || (NQ = named0(inner).finally(() => { NQ = null; }));
let NQ = null;
async function named0(inner) {
  const m = MEMO.__named; if (m && Date.now() - m.t < 300000) return m.v;
  let v = { projects: new Map(), developers: [], all: [] };
  try {
    const r = await inner($q.h);
    if (r && r.ok && /json/.test(r.headers.get($q.i) || '')) {
      const j = await r.json(), list = Array.isArray(j) ? j : (j.urls || j.items || []).concat(j.projects || [], j.developers || []);
      for (const it of list) {
        const loc = it.loc || it.url; if (!loc || !/^https:\/\/kolaboro\.com\//.test(loc)) continue;
        const type = it.type || (/\/developers\//.test(loc) ? $q.j : /\/projects\//.test(loc) ? $q.k : 'page');
        const e = { loc, lastmod: it.lastmod || it.updated || null, type, id: it.id || it.public_id || it.code || null, name: it.name || it.title || null, developer: it.developer || it.developer_name || null, developer_url: it.developer_url || null, lang: it.lang || 'en', alternates: it.alternates || it.alt || null, summary: it.summary || null, sm: it.sm !== false };
        v.all.push(e);
        if (type === $q.k && e.id && (e.lang === 'en' || !v.projects.has(e.id))) v.projects.set(e.id, e);
        if (type === $q.j && e.lang === 'en') v.developers.push(e);
      }
    }
  } catch (e) {}
  MEMO.__named = { t: Date.now(), v }; return v;
}
async function base(env, inner) {
  const d = await openData();
  const [delay, ontime, promises, drift, regs, cover, law, lh, regHtml] = await Promise.all([
    file(env, $q.l), file(env, $q.m), file(env, $q.n), file(env, $q.o),
    file(env, $q.p), file(env, $q.q), file(env, $q.r), file(env, $q.s), file(env, $q.t, 900000)]);
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
  for (const a of h.split($q.u).slice(1)) {
    const id = (/^\s*id="([^"]+)"/.exec(a) || [])[1], name = (/<h3 id="h-[^"]+">([^<]+)<\/h3>/.exec(a) || [])[1];
    if (!id || !name) continue;
    const sub = (/<span class="rgc-sub">([^<]*)<\/span>/.exec(a.slice(0, 600)) || [])[1] || null;
    const items = [];
    for (const li of a.split($q.v).slice(1)) {
      const g = re => ((re.exec(li) || [])[1] || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
      const href = (/<a class="rg-open" href="([^"]+)"/.exec(li) || [])[1] || null;
      items.push({ name: g(/<h4>(.*?)<\/h4>/), checks: g(/^data-c="([^"]*)"/).split(/\s+/).filter(Boolean), proves: g(/What it proves<\/dt><dd>(.*?)<\/dd>/), not: g(/What it does not prove<\/dt><dd>(.*?)<\/dd>/), how: g(/How to search<\/dt><dd>(.*?)<\/dd>/), url: href && /^https?:\/\//.test(href) ? href : null, guide: (/<a class="rg-guide" href="(\/registers\/[a-z0-9-]+\/how-to-read\/)"/.exec(li) || [])[1] || null });
    }
    out.push({ id, name, sub, items });
  }
  return out;
}
function regsFor(B, country) {   // register cards whose market belongs to this country, or whose name or country line is the country
  const mk = new Set((B.byCountry.get(country) || []).map(c => c.market));
  return B.regCards.filter(r => ctry(r.name) === country || (r.sub && ctry(r.sub) === country) || mk.has(r.name));
}
const LAWC = { ID: 'Indonesia', 'AE-DU': 'UAE', TH: 'Thailand', ES: 'Spain', PT: 'Portugal', 'US-FL': 'USA', 'AU-VIC': 'Australia', MX: 'Mexico', JP: 'Japan', GB: 'United Kingdom', TR: 'Turkey', CR: 'Costa Rica', CY: 'Cyprus', IN: 'India', BR: 'Brazil', SA: 'Saudi Arabia', 'CA-BC': 'Canada', CO: 'Colombia', MA: 'Morocco', PA: 'Panama', AR: 'Argentina', BH: 'Bahrain', FR: 'France' };   // n40 L4: Florida, Victoria, Mexico; L5: Japan, UK
function lawFor(B, country) {
  const rules = [];
  for (const [src, key] of [[B.law, 'law'], [B.lh, 'lh']]) {
    if (!src || !src.rules) continue;
    for (const r of src.rules) if (LAWC[r.market] === country) { const s = (src.sources || {})[r.source] || (B.law && B.law.sources || {})[r.source] || null; if (s && s.url) rules.push(Object.assign({ from: key }, r, { src: s })); }
  }
  const seen = new Set(); return rules.filter(r => !seen.has(r.id) && seen.add(r.id));
}
function lateMonths(B, c) {   // months past the first handover date on record (rules of /data/on-time.json and /data/delay-index.json)
  const p = B.ontime && B.ontime.projects && B.ontime.projects[c.id]; if (!p || !p.first || /^(done_|completed)/.test(p.s || '') || c.stage === $q.w) return null;   // n40 k24: not completed only, as past_first in /data/delay-index.json
  const now = ymIdx((B.ontime.as_of_month || '') + '-01'), f = ymIdx(p.first + '-01'); if (now == null || f == null) return null;
  return { late: now - f, first: p.first, cur: p.cur, moved: p.moved || 0, overdue: p.overdue || 0, status: p.s };
}
function stats(L) {
  const n = L.length, s = { n, pub: {}, conf: {}, overdue: 0, flags: 0, contra: 0, claims: 0, delayed: 0, uc: 0, op: 0, done: 0, avg: 0, vavg: 0 };
  for (const k of CHECKS) { s.pub[k] = L.filter(c => isPub(c, k)).length; s.conf[k] = L.filter(c => isConf(c, k)).length; }
  for (const c of L) { const cl = c.claims || {}; s.contra += cl.contradicted || 0; s.claims += (cl.contradicted || 0) + (cl.verified || 0) + (cl.unverified || 0); if (c.overdue) s.overdue++; if ((c.flags || []).length) s.flags++; if (c.delay) s.delayed++; if (c.stage === $q.x) s.uc++; else if (c.stage === $q.y) s.op++; else if (c.stage === $q.w) s.done++; s.avg += c.score || 0; s.vavg += c.vscore || 0; }
  s.avg = n ? s.avg / n : 0; s.vavg = n ? s.vavg / n : 0; return s;
}
function pname(B, c) { const e = B.N.projects.get(c.id); return e && e.name ? e.name : c.id; }
function tl(B, c) { const d = B.T && B.T.project.get(c.id); if (d) return d; const h = (c.history || []).map(x => x.d).filter(Boolean).sort(); return h[h.length - 1] || B.d.updated; }
function maxLm(B, L, extra) { let m = ''; for (const c of L) { const d = tl(B, c); if (d > m) m = d; } for (const e of extra || []) if (e && e > m) m = e; const today = new Date().toISOString().slice(0, 10); return m > today ? today : (m || B.d.updated); }
let HLM = null;   // path -> true lastmod of the hub being rendered (set by handle() for render())
function plink(B, c) { const e = B.N.projects.get(c.id); return e ? e.loc.replace(SITE, '') : '/p/' + encodeURIComponent(c.id) + '/'; }
const place = c => (c.region && c.region !== c.market ? c.region + ', ' : '') + c.market;

let CSS = '';   // n40 L1: the hub styles live in /data/seo-hub-css.json (loaded in handle(), once per isolate)
function h2(id, text) { return $q.z + id + '">' + esc(text) + $q.A + id + $q.B; }
function crumbs(list) {   // [[name, path], ...] last without link
  return $q.C + list.map((x, i) => i < list.length - 1 ? $q.D + x[1] + '">' + esc(x[0]) + '</a>' : esc(x[0])).join(' / ') + '</p>';
}
function crumbLd(list) { return { '@type': $q.E, itemListElement: list.map((x, i) => ({ '@type': $q.F, position: i + 1, name: x[0], item: SITE + x[1] })) }; }
function faqLd(faq) { return { '@type': $q.G, mainEntity: faq.map(([q, a]) => ({ '@type': $q.H, name: q, acceptedAnswer: { '@type': $q.I, text: a } })) }; }
function faqHtml(faq) { return h2('faq', $q.J) + $q.K + faq.map(([q, a]) => $q.L + esc(q) + $q.M + esc(a) + $q.N).join('') + $q.O; }
/* REPLY: n40 k17, in /data/i18n/k17s.json */
function tableWrap(head, rows) {   // d12b: each cell carries its column name (data-l) so phones show rows as labelled cards
  const L = head.map(h => String(h).replace(/<[^>]+>/g, '').replace(/"/g, $q.e));
  const R = rows.map(r => { let i = 0; return r.replace(/<td(\s[^>]*)?>/g, (m, a) => '<td' + (a || '') + $q.P + (L[i++] || '') + '">'); });
  return $q.Q + head.map(h => $q.R + h + '</th>').join('') + $q.S + R.join('') + $q.T; }
const unesc = t => String(t).replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
function listLd(body) {
  let m = [...String(body).matchAll(/<tr><td[^>]*><a href="(\/[^"#]*)">([\s\S]*?)<\/a>/g)];
  if (m.length < 2) m = [...String(body).matchAll(/<li><a href="(\/[^"#]*)">([\s\S]*?)<\/a>/g)];
  const seen = new Set(), it = []; for (const x of m) { if (seen.has(x[1])) continue; seen.add(x[1]); it.push({ '@type': $q.F, position: it.length + 1, name: unesc(x[2]).trim(), url: SITE + x[1] }); if (it.length >= 100) break; }
  return it.length >= 2 ? { '@type': $q.U, numberOfItems: it.length, itemListElement: it } : null;
}
const sg1 = s => String(s).replace(/(^|[^\d.,])1 (tracked |official )?(project|register|rule)s\b/g, $q.V).replace(/(\b1 (tracked )?project) (leave|are|have|do not|make)\b/g, (m, a, b, v) => a + ' ' + { leave: $q.W, are: 'is', have: 'has', 'do not': $q.X, make: 'makes' }[v]);
const pruneCss = (css, html) => { if (!css) return css; const keep = sel => { const n = sel.match(/\.[A-Za-z0-9_-]+/g); return !n || n.some(c => html.includes(c.slice(1))); };
  return css.replace(/(@media[^{]*\{)((?:[^{}]*\{[^{}]*\})*)\s*\}/g, (m0, at, inner) => { const r = inner.replace(/([^{}]+)\{([^{}]*)\}/g, (m1, sel) => keep(sel) ? m1 : ''); return r.trim() ? at + r + '}' : ''; })
    .replace(/(?<=^|[}>])([^{}@<>]+)\{([^{}]*)\}/g, (m1, sel) => keep(sel) ? m1 : ''); };   // n40 k43: drop rules of the shared hub style whose classes are absent
function render(P) {
  const canon = SITE + P.path;
  if (P.updated && /^\/countries\/[^/]+\/[a-z-]+\/$/.test(P.path)) P.body = $s.k0 + esc(P.updated) + '">' + longDate(P.updated) + $q.Y + P.body;   // n40 R01-15
  P.body = P.body.replace(/href="\/corrections\/"/g, $q.Z + encodeURIComponent(P.path) + $q.aa);   // n40 R01-16
  for (const k of ['title', 'desc', 'lead', 'body']) if (P[k]) P[k] = sg1(P[k]); if (P.ld) P.ld = JSON.parse(sg1(JSON.stringify(P.ld)));   // n40 R01-01
  if ((P.type || '') === $q.ab && !(P.pageLd && P.pageLd.mainEntity) && !(P.ld || []).some(x => x && x['@type'] === $q.U)) { const il = listLd(P.body); if (il) P.pageLd = Object.assign({}, P.pageLd || {}, { mainEntity: il }); }
  if (P.title && P.title.length > 60) P.title = P.title.replace(/ \| Kolaboro( engineering)?$/, '');   // n29t (item 46): titles of hubs and rankings fit in 60 characters where the brand suffix is what overflows
  const ld = { '@context': $q.ac, '@graph': [Object.assign({ '@type': P.type || $q.ad, '@id': canon + '#page', url: canon, name: P.h1 || P.title, description: P.desc, inLanguage: 'en', dateModified: (HLM && HLM.get(P.path)) || P.updated, isPartOf: { '@type': $q.ae, name: $q.af, url: SITE + '/' }, publisher: { '@type': $q.ag, name: $q.af, url: SITE + '/' } }, P.pageLd || {}), crumbLd(P.crumbs)].concat(P.ld || []) };
  let head = $q.ah + esc(P.title) + $q.ai + esc(P.desc) + $q.aj + canon + '">' +
    (P.noindex ? $q.ak : $s.k1 + canon + $q.al + canon + '">') +
    $q.am + esc(P.title) + $q.an + esc(P.desc) + $q.ao + canon + $q.ap + esc(P.title) + $q.aq + esc(P.desc) + '">' +
    (P.prev ? $q.ar + SITE + P.prev + '">' : '') + (P.next ? $q.as + SITE + P.next + '">' : '') +   // n40 k7 (R06-08): paged hubs link their neighbours in <head>
    (P.feed ? $q.at + esc(P.feed[0]) + $q.au + esc(P.feed[1]) + '">' : '') +   // n29t (item 48): the place's own change feed
    $q.av + JSON.stringify(ld).replace(/</g, $q.aw) + $q.ax + CSS;
  const main = $q.ay + crumbs(P.crumbs) + '<h1>' + esc(P.h1 || P.title) + '</h1>' + (P.lead ? $q.az + P.lead + '</p>' : '') + $q.aA + P.body + $q.aB;
  if (CSS) { const pc = pruneCss(CSS, main); head = head.replace(CSS, () => pc); }   // n40 k43 (R04-50, R05-49, R05-50): only the hub rules whose classes the page uses (0.9 to 2.4 KB less per page)
  return { head, main, status: P.status || 200, og: ogImg(P.path) };
}
async function shellOut(shell, R, cacheHdr) {
  const s = await shell($q.aC);
  const res = new HTMLRewriter()
    .on('title', { element(e) { e.remove(); } })
    .on($s.k2, { element(e) { e.remove(); } })
    .on($q.aD, { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(R.head + $q.aE + (R.og || SITE + $q.aF) + $q.aG + (R.og || SITE + $q.aF) + '">', { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(R.main, { html: true }); } })
    .transform(s);
  const h = new Headers(res.headers); h.set($q.i, $q.aH); h.delete($q.aI); h.delete('etag'); if (cacheHdr) h.set($q.aJ, cacheHdr);
  return new Response(res.body, { status: R.status, headers: h });
}

function countryList(B) { const names = new Set([...B.byCountry.keys(), ...B.uByCountry.keys()]); return [...names].map(c => ({ c, s: slug(c), L: B.byCountry.get(c) || [], U: B.uByCountry.get(c) || [] })).sort((a, b) => b.L.length - a.L.length || b.U.length - a.U.length || a.c.localeCompare(b.c)); }
function unrevSection(B, U) { return U.length ? h2($q.aK, $q.aL) + '<p>' + U.length + $q.aM + (U.length === 1 ? ' was' : $q.aN) + $q.aO + (U.length === 1 ? 'has' : 'have') + $s.k3 + tableWrap([$q.aP, 'Where', $q.aQ], U.slice().sort((a, b) => a.id.localeCompare(b.id)).map(c => $q.aR + plink(B, c) + '">' + esc(pname(B, c)) + $q.aS + esc(place(c)) + $q.aT + NOT_REVIEWED + $q.aU)) : ''; }
function coiNote(B) { return B.coi && B.coi.length ? '; ' + B.coi.length + $s.k4 : ''; }
function findCountry(B, s) { return countryList(B).find(x => x.s === s) || null; }
const SAFE_MIN = 5, THIN_MIN = 3;   // n40 R03-06: how-to-check pages of countries with 1-2 projects are noindex,follow and kept out of sitemaps

function pCountries(B) {
  const list = countryList(B), up = B.d.updated;
  const rows = list.map(x => { const s = stats(x.L), mk = new Set(x.L.concat(x.U).map(c => c.market)).size; return $q.aV + x.s + '/">' + esc(x.c) + $q.aS + x.L.length + (x.U.length ? $q.aW + x.U.length + $q.aX : '') + $q.aT + mk + $q.aT + (s.n ? pct(s.pub.permit, s.n) + '%' : '-') + $q.aT + (s.n ? pct(s.pub.escrow, s.n) + '%' : '-') + $q.aT + (s.n ? s.overdue : '-') + $q.aT + (x.L.length ? $q.aY + x.s + $q.aZ : '') + $q.aU; });
  const S = stats(B.cases);
  const body = $q.ba + fmt(B.all.length + B.coi.length) + $q.bb + list.length + $q.bc + (new Set(B.all.map(c => c.market)).size + (B.coi.length ? 1 : 0)) + $q.bd + longDate(up) + ')' + coiNote(B) + (B.unrev.length ? '; ' + fmt(B.unrev.length) + $q.be + fmt(B.cases.length) + $q.bf : '') + $s.k5 + pct(S.pub.permit, S.n) + $q.bg + pct(S.pub.escrow, S.n) + $q.bh + S.overdue + $q.bi +
    h2($q.bj, $q.bk) + $s.k6 +
    tableWrap([$q.bl, $q.bm, $q.bn, $q.bo, $q.bp, $q.bq, 'Guide'], rows) +
    $s.k7 +
    h2('more', $q.br) + $s.k8 + $s.REPLY;
  return render({ path: $q.bs, title: $q.bt + list.length + $q.bu + fmt(B.all.length + B.coi.length) + $q.bv, h1: $q.bw, lead: $s.k9, desc: $q.bx + list.length + $q.by + longDate(up) + '.', updated: up, type: $q.ab, crumbs: [[$q.af, '/'], [$q.bz, $q.bs]], body,
    pageLd: { mainEntity: { '@type': $q.U, numberOfItems: list.length, itemListElement: list.map((x, i) => ({ '@type': $q.F, position: i + 1, name: x.c, url: SITE + $q.bs + x.s + '/' })) } } });
}
function projectRows(B, L, max) {
  return L.slice().sort((a, b) => (b.score - a.score) || a.id.localeCompare(b.id)).slice(0, max || 400).map(c => {
    const lm = lateMonths(B, c);
    return $q.aR + plink(B, c) + '">' + esc(pname(B, c)) + '</a>' + (B.N.projects.get(c.id) ? $q.bA + esc(c.id) + $q.bB : '') + $q.aT + esc(place(c)) + $q.aT + esc(c.stage || $q.bC) + $q.aT + (c.done || $q.bD) + $q.aT + c.score + $q.bE + (c.vscore || 0) + $q.bE + (lm && lm.late > 0 ? lm.late + $q.bF : lm ? $q.bG : $q.bH) + $q.aU;
  });
}
const PHEAD = ['Project', 'Where', 'Stage', 'Handover year advertised', 'Checks public', 'Confirmed by register or independent source', 'Past first handover date on record'];
function pCountryUnrev(B, x) {
  const { c: C, s: S, U } = x, up = B.d.updated, mk = [...new Set(U.map(c => c.market))];
  const body = $q.bI + U.length + $q.bJ + (U.length === 1 ? '' : 's') + ' in ' + esc(C) + $s.k10 + longDate(up) + $q.bK + h2($q.bL, $q.bM + C) + $q.bN + mk.map(m => $q.bO + slugM(m) + '/">' + esc(m) + $q.bP).join('') + '</ul>' + unrevSection(B, U) + $s.k11 + $s.REPLY;
  return render({ path: $q.bs + S + '/', title: $q.bQ + C + $q.bR, h1: $q.bQ + C, lead: U.length + $q.aM + (U.length === 1 ? '' : 's') + $q.bS, desc: $q.bQ + C + $q.bT + longDate(up) + '.', updated: up, type: $q.ab, crumbs: [[$q.af, '/'], [$q.bz, $q.bs], [C, $q.bs + S + '/']], body });
}
function pCountry(B, x) {
  if (!x.L.length) return pCountryUnrev(B, x);
  const { c: C, s: S, L, U } = x, st = stats(L), up = B.d.updated, n = L.length;
  const mk = [...new Set(L.map(c => c.market))].map(m => ({ m, n: L.filter(c => c.market === m).length })).sort((a, b) => b.n - a.n);
  const lates = L.map(c => ({ c, lm: lateMonths(B, c) })).filter(o => o.lm && o.lm.late > 0).sort((a, b) => b.lm.late - a.lm.late);
  const dm = (B.delay && B.delay.markets || []).filter(r => mk.some(o => o.m === r.market));
  const pm = (B.promises && B.promises.markets || []).filter(r => mk.some(o => o.m === r.market));
  const regs = regsFor(B, C), laws = lawFor(B, C);
  const kv = $q.bU + n + $q.bV + (n === 1 ? $q.bW : $q.bX) + $q.bY + mk.length + $q.bV + (mk.length === 1 ? $q.bZ : $q.bL) + $q.bY + pct(st.pub.permit, n) + $q.ca + pct(st.pub.escrow, n) + $q.cb + lates.length + $q.cc + fmt(st.contra) + $q.cd;
  let body = $q.ce + (n >= SAFE_MIN ? $q.cf + S + $q.cg + esc(C) + $q.ch : '') + $q.cf + S + $q.ci + esc(C) + $q.bP + (laws.length ? $q.cf + S + $q.cj + esc(C) + $q.bP : '') + (lateLaw(B, C).length ? $q.cf + S + $q.ck + esc($s.dhh.replace('{c}', C)) + $q.bP : '') + placesForCountry(C).map(P => $q.cl + P.s + $q.cm + esc(P.n) + $q.bP).join('') + $q.cn + $q.co + esc(C) + $q.cp + n + $q.bJ + (n === 1 ? '' : 's') + ' in ' + mk.length + $q.cq + (mk.length === 1 ? '' : 's') + '</b>' + (U.length ? ' (' + U.length + $q.cr : '') + ' (' + st.op + $q.cs + st.uc + $q.ct + (st.done ? ', ' + st.done + $q.cu : '') + $q.cv + st.avg.toFixed(1) + $q.cw + st.vavg.toFixed(1) + $q.cx + lates.length + $q.aM + (lates.length === 1 ? ' is' : 's are') + $q.cy + st.overdue + ' ' + (st.overdue === 1 ? 'is' : 'are') + $q.cz + longDate(up) + $q.bK + kv;
  body += startHere(S, C, regs, laws);
  const mkU = [...new Set(U.map(c => c.market))].filter(m => !mk.some(o => o.m === m));   // n29t (item 36): markets with only not-yet-reviewed projects were linked from nowhere (orphan /m/ pages)
  body += h2($q.bL, $q.bM + C) + $q.bN + mk.map(o => $q.bO + slugM(o.m) + '/">' + esc(o.m) + ' (' + (o.n + U.filter(z => z.market === o.m).length) + $q.cA).join('') + mkU.map(m => $q.bO + slugM(m) + '/">' + esc(m) + ' (' + U.filter(c => c.market === m).length + $q.cB).join('') + '</ul>';
  { const k = (B.coi || []).filter(c => c.country === C).length; if (k) body += $s.k12; }   // n29q
  body += h2($q.cC, $q.bx + C) + $s.k13 + tableWrap(PHEAD, projectRows(B, L)) + unrevSection(B, U);
  if (lates.length) body += h2($q.cD, $q.cE) + $q.cF + lates.slice(0, 10).map(o => $q.cG + plink(B, o.c) + '">' + esc(pname(B, o.c)) + $q.cH + esc(o.c.market) + $q.cI + ymName(o.lm.first + '-01') + ', ' + o.lm.late + $q.cJ + (o.lm.moved ? $q.cK + o.lm.moved + $q.cL : '') + '</li>').join('') + $q.cM + esc(B.ontime.as_of_month) + $q.cN;
  if (dm.length) body += h2($q.cO, $q.cP) + tableWrap([$q.cQ, $q.cR, $q.cS, $q.cT, $q.cU, $q.cV], dm.map(r => $q.cW + esc(r.market) + $q.aT + r.tracked + $q.aT + r.with_date + $q.aT + r.past_first + $q.aT + (r.share_past_first == null ? $q.cX : r.share_past_first + '%') + $q.aT + (r.median_late == null ? $q.cX : r.median_late) + $q.aU)) + $s.k14;
  if (pm.length) body += h2($q.cY, $q.cZ) + tableWrap([$q.cQ, $q.da, 'Kept', $q.db, 'Moved', $q.dc], pm.map(r => $q.cW + esc(r.market) + $q.aT + r.promises + $q.aT + r.kept + $q.aT + r.broken + $q.aT + r.moved + $q.aT + r.pending + $q.aU)) + $s.k15;
  body += h2($q.dd, $q.de + C) + (regs.length ? regs.map(r => r.items.map(it => regItem(it, r, B)).join('')).join('') : $q.df + esc(C) + $s.k16);
  const faq = [
    [$q.dg + C + '?', n + $q.dh + mk.length + $q.cq + (mk.length === 1 ? '' : 's') + ' (' + mk.slice(0, 5).map(o => o.m).join(', ') + $q.di + longDate(up) + '.'],
    [$q.dj + C + $q.dk, st.pub.permit + ' of ' + n + ' (' + pct(st.pub.permit, n) + '%). ' + st.conf.permit + $q.dl],
    [$q.dj + C + $q.dm, st.pub.escrow + ' of ' + n + ' (' + pct(st.pub.escrow, n) + '%).'],
    [$q.dn + C + $q.do, lates.length + ' of ' + n + $q.dp + (lates.length ? $q.dq + lates[0].lm.late + $q.bF : '') + '. ' + st.overdue + $q.dr]
  ];
  if (regs.length) faq.push([$q.ds + C + '?', regs.flatMap(r => r.items.map(i => i.name)).slice(0, 6).join('; ') + '.']);
  body += faqHtml(faq);
  body += h2($q.dt, $q.du) + $q.bN + related(B, x).map(o => $q.cf + o.s + '/">' + esc(o.c) + $q.bP).join('') + $q.dv + $s.REPLY;
  return render({ path: $q.bs + S + '/', title: ctTitle(C, n, pct(st.pub.permit, n)), h1: $q.bQ + C, lead: $q.dw + (n + U.length) + $q.dx + (n + U.length === 1 ? '' : 's') + $q.dy, desc: n + $q.bb + C + $q.dz + pct(st.pub.permit, n) + $q.dA + pct(st.pub.escrow, n) + $q.dB + lates.length + $q.dC + longDate(up) + '.', updated: up, type: $q.ab, feed: [$q.dD + C, $q.dE + encodeURIComponent(C)], crumbs: [[$q.af, '/'], [$q.bz, $q.bs], [C, $q.bs + S + '/']], body,
    pageLd: { about: { '@type': $q.bl, name: C }, mainEntity: { '@type': $q.U, numberOfItems: n, itemListElement: L.slice(0, 100).map((c, i) => ({ '@type': $q.F, position: i + 1, name: pname(B, c), url: SITE + plink(B, c) })) } }, ld: [faqLd(faq)] });
}
const ctTitle = (C, n, a) => { const t = $q.dF + C + ': ' + n + $q.dG + a + $q.dH; const u = C + ': ' + n + $q.dI + a + $q.dJ; return (t.length <= 60 ? t : u.length <= 60 ? u : $q.dF + C + ': ' + n + $q.dK) + $q.dL; };   // n40 k39 (R15-08, R15-33, R17 CTR items): count and permit share, 60 characters at most
function startHere(S, C, regs, laws) {   // n40 k35 (R13-19, R13-43, R14-17..43): first steps from the law page and the registers, ticks kept on the device (strings in k17s.json)
  const Z = $s, li = (k, t, a) => $q.dM + k + $q.dN + k + $q.dO + k + '">' + t + $q.dP + (a ? ' ' + a : '') + '</li>', A = (h, t, x) => $q.D + esc(h) + '"' + (x ? $q.dQ : '') + '>' + esc(t) + '</a>', L = [];
  if (laws.length) L.push(li('law', Z.k35b, A($q.bs + S + $q.dR, $q.dS + C)));
  L.push(li('check', Z.k35c, A($q.bs + S + $q.dT, $q.dU + C)));
  const seen = new Set(); for (const r of regs) for (const it of r.items) if (it.url && !seen.has(it.url) && seen.size < 3) { seen.add(it.url); L.push(li('r' + seen.size, Z.k35d, A(it.url, it.name, 1))); }
  L.push(li($q.a, Z.k35e), li($q.dV, Z.k35f), li($q.dW, Z.k35g, A($q.dX, $q.bx + C)));
  return h2($q.dY, $q.dZ) + Z.k35a + S + '">' + L.join('') + '</ol>' + Z.k35h;
}
function related(B, x) {   // countries sharing a register region or, failing that, of similar size
  const all = countryList(B).filter(o => o.s !== x.s);
  return all.sort((a, b) => Math.abs(a.L.length - x.L.length) - Math.abs(b.L.length - x.L.length)).slice(0, 6);
}
function rck(B, url) {   // n40 k6: date and answer of the latest re-read of a register link (/data/register-checks.json recheck)
  const R = B && B.regs && B.regs.recheck, v = R && R.urls && (R.urls[url] || R.urls[url.replace(/\/$/, '')] || R.urls[url + '/']); if (!v) return '';
  const k = v[0] >= 200 && v[0] < 400 ? 't_ok' : v[0] >= 400 ? 't_blk' : 't_e';
  return $q.ea + esc(String(R[k] || '').replace('{d}', longDate(R.at)).replace('{s}', v[0])) + $q.eb;
}
function regItem(it, r, B) {
  return $q.ec + esc(it.name) + $q.ed + esc(r.name) + $q.ee + (it.proves ? $q.ef + esc(it.proves) + '</dd>' : '') + (it.not ? $q.eg + esc(it.not) + '</dd>' : '') + (it.how ? $q.eh + esc(it.how) + '</dd>' : '') + '</dl>' + (it.url ? $q.ei + esc(it.url) + $s.k17 + esc(new URL(it.url).hostname) + $q.eb + rck(B, it.url) + '</p>' : $q.ej) + (it.guide ? '<p><a href="' + it.guide + '">Step-by-step guide: how to read this register</a></p>' : '') + $q.ek + esc(r.id) + $q.el;
}
function qTemplate(q) { return String(q).replace(/\b(19|20)\d{2}\b/g, $q.em).replace(/\b\d+([.,]\d+)?\s*(%|years?|months?)/gi, $q.en).replace(/\$?\d[\d,.]*/g, '<n>'); }
function srcBox(B, C, laws, regs) {   // n40 R01-40: official links first, the date we read each one, and an archived copy
  const rc = new Map(((B.regs && B.regs.registers) || []).map(r => [r.url, r.probed_at])), seen = new Set(), L = [];
  for (const r of regs || []) for (const it of r.items) if (it.url && !seen.has(it.url)) { seen.add(it.url); L.push([it.name, it.url, rc.get(it.url), $q.eo]); }
  for (const r of laws || []) if (!seen.has(r.src.url)) { seen.add(r.src.url); L.push([r.src.law, r.src.url, r.src.read || (B.law && B.law.version), 'law']); }
  if (!L.length) return '';
  return h2($q.ep, $q.eq) + $s.k18 + L.map(o => $q.cG + esc(o[1]) + $q.er + esc(o[0]) + $q.es + esc(new URL(o[1]).hostname) + (o[2] ? ' · ' + (o[3] === $q.eo ? $q.et : $q.eu) + $q.ev + esc(String(o[2]).slice(0, 10)) + '">' + longDate(String(o[2]).slice(0, 10)) + $q.ew : '') + $q.ex + esc(o[1]) + $q.ey).join('') + $s.k19;
}
function pCheck(B, x) {
  const { c: C, s: S, L } = x, st = stats(L), n = L.length, up = B.d.updated, regs = regsFor(B, C), laws = lawFor(B, C);
  const cov = (B.cover && B.cover.countries || []).find(o => ctry(o.country.replace(/\s*\(.*$/, '')) === C) || null;
  const qs = new Map(); for (const c of L) for (const q of (c.q || [])) { const t = qTemplate(q); const o = qs.get(t) || { t, n: 0, ex: q }; o.n++; qs.set(t, o); }
  const topQ = [...qs.values()].sort((a, b) => b.n - a.n).slice(0, 8);
  const gaps = CHECKS.map(k => ({ k, miss: n - st.pub[k], conf: st.conf[k] })).sort((a, b) => b.miss - a.miss);
  let body = $q.ez + esc(C) + $q.eA + (regs.length ? $q.eB + regs.reduce((a, r) => a + r.items.length, 0) + $q.eC + (regs.reduce((a, r) => a + r.items.length, 0) === 1 ? '' : 's') + $q.eD : $s.k20) + $q.eE + n + $q.aM + (n === 1 ? '' : 's') + $q.eF + esc(C) + $q.eG + esc(C) + ': ' + CKN[gaps[0].k].toLowerCase() + $q.eH + gaps[0].miss + ' of ' + n + $q.eI;
  body += $s.k21 + (cov ? $q.eJ : '') + (laws.length ? $q.eK : '') + $q.eL;
  body += h2($q.dd, $q.eM + C) + (regs.length ? regs.map(r => r.items.map(it => regItem(it, r, B)).join('')).join('') : $q.eN + esc(C) + $s.k22);
  body += h2('gaps', $q.eO + C + $q.eP) + $q.eQ + n + $s.k23 + tableWrap(['Check', $q.eR, $q.eS, $q.eT], CHECKS.map(k => $q.cW + CKN[k] + $q.aT + st.pub[k] + ' (' + pct(st.pub[k], n) + $q.eU + (n - st.pub[k]) + $q.aT + st.conf[k] + $q.aU));
  body += h2($q.eV, $q.eW) + (topQ.length ? $q.eX + esc(C) + $s.k24 + topQ.map(o => '<li>' + esc(o.ex) + $q.ed + o.n + ' of ' + n + $q.eY).join('') + '</ol>' : $q.eZ) + $q.fa;
  if (cov) body += h2($q.fb, $q.fc + C) + $q.fd + esc(cov.country) + $s.k25 + [$q.fe, $q.ff, $q.fg].map(k => (cov[k] || []).length ? '<h3>' + ({ online: $q.fh, manual: $q.fi, needs_key: $q.fj })[k] + $q.fk + cov[k].map(o => '<li>' + esc(o.what) + ': ' + (o.url ? $q.D + esc(o.url) + $q.er + esc(o.source) + '</a>' : esc(o.source)) + '</li>').join('') + '</ul>' : '').join('') + ((cov.site_visit || []).length ? $q.fl + cov.site_visit.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>' : '');
  if (laws.length) body += h2('law', $q.fm) + '<p>' + laws.length + ' rule' + (laws.length === 1 ? '' : 's') + $q.fn + S + $q.fo + laws.slice(0, 6).map(r => '<li>' + esc(r.title) + $q.ed + esc(r.src.law) + (r.cite ? ', ' + esc(r.cite) : '') + $q.fp).join('') + '</ul>';
  body += h2('next', $q.fq) + $s.k26 + S + $q.fr + esc(C) + $q.fs;
  { const G = BUY_PLACES.filter(P => P.c === C); if (G.length) body += $q.ft + G.map(P => $q.fu + P.s + $q.fv + esc(BUY_PL[P.s].in.en) + '</a>').join(', ') + '.</p>'; }   // n27c
  const faq = [[$q.fw + C + '?', $s.k27 + C + $q.fx + CKN[gaps[0].k].toLowerCase() + ' (' + gaps[0].miss + ' of ' + n + $q.fy],
    [$q.fz + C + '?', regs.length ? 'Yes: ' + regs.flatMap(r => r.items.map(i => i.name)).slice(0, 5).join('; ') + '.' : $q.fA + C + $q.fB],
    [$q.fC + C + $q.fD, topQ.length ? topQ[0].ex + ' (' + topQ[0].n + ' of ' + n + $q.fE : $q.fF]];
  body += srcBox(B, C, laws, regs) + faqHtml(faq) + $s.REPLY;
  return render({ noindex: x.L.length < THIN_MIN, path: $q.bs + S + $q.dT, title: $q.fG + C + $q.dL, h1: $q.fG + C, lead: $q.fH + n + $q.dx + (n === 1 ? '' : 's') + '.', desc: $q.fI + C + ': ' + (regs.length ? regs.reduce((a, r) => a + r.items.length, 0) + $q.fJ : '') + 'what ' + n + $q.fK, updated: up, crumbs: [[$q.af, '/'], [$q.bz, $q.bs], [C, $q.bs + S + '/'], [$q.fL, $q.bs + S + $q.dT]], body, ld: [faqLd(faq)] });
}
function pSafe(B, x) {
  const { c: C, s: S, L } = x, st = stats(L), n = L.length, up = B.d.updated, laws = lawFor(B, C);
  const lates = L.map(c => lateMonths(B, c)).filter(o => o && o.late > 0), closed = L.map(c => (B.ontime.projects || {})[c.id]).filter(p => p && p.s && p.s !== 'open');
  const pm = (B.promises && B.promises.markets || []).filter(r => L.some(c => c.market === r.market)), P = pm.reduce((a, r) => { for (const k of [$q.cY, 'kept', $q.fM, 'moved', $q.fN]) a[k] = (a[k] || 0) + (r[k] || 0); return a; }, {});
  const flagged = L.filter(c => (c.flags || []).length);
  let body = $q.fO + esc(C) + $s.k28 + n + $q.fP + pct(st.pub.permit, n) + $q.fQ + pct(st.pub.escrow, n) + $q.fR + lates.length + $q.fS + fmt(st.contra) + $q.fT + fmt(st.claims) + $q.fU + (flagged.length ? $q.fV + flagged.length + $q.aM + (flagged.length === 1 ? '' : 's') : '') + $q.fW;
  body += $q.bU + pct(st.pub.permit, n) + $q.fX + pct(st.pub.escrow, n) + $q.cb + lates.length + $q.fY + (P.promises || 0) + $q.fZ + (P.broken || 0) + $q.ga + pct(st.contra, st.claims) + $q.gb;
  body += h2($q.gc, $q.gd) + '<p>' + lates.length + ' of ' + n + $q.ge + (lates.length ? $q.gf + median(lates.map(o => o.late)) + $q.gg : '') + '. ' + closed.length + $q.aM + (closed.length === 1 ? ' has' : $q.gh) + $s.k29;
  if (P.promises) body += $q.gi + P.promises + $q.gj + (P.kept || 0) + $q.gk + (P.broken || 0) + $q.gl + (P.moved || 0) + $q.gm + (P.pending || 0) + $q.gn;
  body += h2($q.go, $q.gp) + tableWrap(['Check', $q.eR, $q.gq], CHECKS.map(k => $q.cW + CKN[k] + $q.aT + pct(st.pub[k], n) + '% (' + st.pub[k] + $q.gr + st.conf[k] + $q.aU));
  if (flagged.length) body += h2($q.gs, $q.gt) + $s.k30 + flagged.length + ' of ' + n + $s.k31;
  body += h2($q.gu, $q.gv) + $s.k32 + (laws.length ? $q.aY + S + $q.gw + laws.length + $q.gx + esc(C) + $q.gy : '') + $q.aY + S + $q.ci + esc(C) + $q.fs;
  const faq = [[$q.gz + C + '?', $q.gA + n + $q.gB + C + ', ' + pct(st.pub.permit, n) + $q.dA + pct(st.pub.escrow, n) + $q.fR + lates.length + $q.gC + longDate(up) + ').'],
    [$q.gD + C + $q.gE, lates.length + ' of ' + n + $q.dp + (lates.length ? $q.gF + median(lates.map(o => o.late)) + $q.bF : '') + '.'],
    [$q.gG + C + $q.gH, fmt(st.contra) + ' of ' + fmt(st.claims) + $q.gI + pct(st.contra, st.claims) + $q.gJ]];
  body += srcBox(B, C, laws, regsFor(B, C)) + faqHtml(faq) + $s.REPLY;
  return render({ path: $q.bs + S + $q.gK, title: $q.gL + C + $q.gM + n + $q.gN, h1: $q.gL + C + '?', lead: $q.gO + n + $q.gP, desc: $q.dF + C + ': ' + lates.length + ' of ' + n + $q.gQ + pct(st.pub.escrow, n) + $q.gR + pct(st.contra, st.claims) + $q.gS + longDate(up) + '.', updated: up, crumbs: [[$q.af, '/'], [$q.bz, $q.bs], [C, $q.bs + S + '/'], [$q.gT, $q.bs + S + $q.gK]], body, ld: [faqLd(faq)] });
}
const median = a => { const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2)) : null; };
const lawArt = (r, topics) => $q.gU + esc(r.id) + $q.gV + esc(r.title) + $q.A + esc(r.id) + $q.gW + (r.topics ? $q.gX + r.topics.map(t => esc(topics[t] || t)).join(', ') + '</p>' : '') + '<p>' + esc(r.plain) + '</p>' + (r.quote ? $q.gY + esc(r.src.language || '') + '">' + esc(r.quote) + $q.gZ : '') + (r.translation ? $q.ha + esc(r.translation) + '</p>' : '') + $q.gX + esc(r.src.law) + (r.cite ? ', ' + esc(r.cite) : '') + $q.hb + esc(r.src.url) + $q.er + esc(r.src.publisher || new URL(r.src.url).hostname) + '</a>' + (r.src.checked ? $q.hc + esc(r.src.checked) : '') + $q.hd;
function pLaw(B, x) {
  const { c: C, s: S } = x, laws = lawFor(B, C), up = laws.reduce((m, r) => r.checked > m ? r.checked : m, (B.law && B.law.version) || B.d.updated);
  const topics = (B.law && B.law.topics) || {};
  let body = $q.he + laws.length + ' rule' + (laws.length === 1 ? '' : 's') + ' of ' + esc(C) + $s.k33;
  body += laws.map(r => lawArt(r, topics)).join('');
  if (lateLaw(B, C).length) body += $q.hf + S + $q.ck + esc($s.dhh.replace('{c}', C)) + $q.hg;
  body += $s.k34 + S + $q.hh + esc(C) + $s.k35;
  body += srcBox(B, C, laws, []) + $s.REPLY.replace($q.hi, $q.hj);
  return render({ path: $q.bs + S + $q.dR, title: C + $q.hk + laws.length + $q.hl, h1: $q.hm + C, lead: $q.hn, desc: laws.length + $q.gx + C + $s.k36, updated: up, crumbs: [[$q.af, '/'], [$q.bz, $q.bs], [C, $q.bs + S + '/'], [$q.ho, $q.bs + S + $q.dR]], body,
    pageLd: { citation: [...new Set(laws.map(r => r.src.url))].map(u => ({ '@type': $q.hp, url: u, name: laws.find(r => r.src.url === u).src.law })) } });
}
const lateLaw = (B, C) => { const W = new Set((B.lh && B.lh.page_rules) || []); return lawFor(B, C).filter(r => W.has(r.id)); };   // n40 k45 (R06-10..38, R14, R15): /countries/<c>/delayed-handover/, rules listed in /tools/late-handover/lh.json page_rules, English strings in k17s.json (dh*)
function pLate(B, x) {
  const { c: C, s: S, L } = x, Z = $s, laws = lateLaw(B, C), topics = (B.law && B.law.topics) || {}, n = laws.length, up = laws.reduce((m, r) => r.checked > m ? r.checked : m, (B.law && B.law.version) || B.d.updated), one = n === 1;
  const lates = L.map(c => lateMonths(B, c)).filter(o => o && o.late > 0), q = s => s.replace('{c}', C).replace('{n}', n), cs = esc(C);
  let body = $q.he + esc(q(one ? Z.dh1 : Z.dhn)) + '</b> ' + esc(Z.dhs) + $q.hq + lates.length + ' of ' + L.length + $q.dp + (lates.length ? $q.gF + median(lates.map(o => o.late)) + $q.hr : '.') + $q.hs + esc(Z.dhr) + $q.ht;
  body += h2('steps', Z.dha) + $q.cF + [Z.dhb, Z.dhc, Z.dhd, Z.dhe].map(t => '<li>' + esc(t) + '</li>').join('') + '</ol>' + h2('rules', Z.dhq) + laws.map(r => lawArt(r, topics)).join('');
  body += $q.hf + S + $q.cj + cs + $q.hu + esc(Z.dhz) + $q.hv + S + '/">' + cs + $q.hw + srcBox(B, C, laws, []) + $s.REPLY.replace($q.hi, $q.hj);
  return render({ path: $q.bs + S + $q.hx, title: q(one ? Z.dht1 : Z.dhtn) + $q.dL, h1: q(Z.dhh), lead: Z.dhl, desc: q(one ? Z.dhd1 : Z.dhdn), updated: up, crumbs: [[$q.af, '/'], [$q.bz, $q.bs], [C, $q.bs + S + '/'], [Z.dhk, $q.bs + S + $q.hx]], body,
    pageLd: { citation: [...new Set(laws.map(r => r.src.url))].map(u => ({ '@type': $q.hp, url: u, name: laws.find(r => r.src.url === u).src.law })) } });
}
function delayedList(B, filter) { return (B.all || B.cases).filter(filter).map(c => ({ c, lm: lateMonths(B, c) })).filter(o => o.lm && o.lm.late > 0).sort((a, b) => b.lm.late - a.lm.late || a.c.id.localeCompare(b.c.id)); }
function delayRows(B, L) { return L.map((o, i) => $q.cW + (i + 1) + $q.hy + plink(B, o.c) + '">' + esc(pname(B, o.c)) + $q.hz + slugM(o.c.market) + '/">' + esc(o.c.market) + $q.hA + esc(o.c.country) + $q.aT + ymName(o.lm.first + '-01') + $q.aT + (o.lm.cur ? ymName(o.lm.cur + '-01') : '') + $q.aT + o.lm.late + $q.aT + (o.lm.status === $q.hB || o.lm.status === 'late' ? esc(o.lm.status.replace('_', ' ')) : esc(o.c.stage || '')) + $q.aU); }
const DHEAD = ['#', 'Project', 'Market', 'First handover date on record', 'Handover date advertised now', 'Months past the first date', 'Status'];
function marketsWithDelays(B) { const m = new Map(); for (const o of delayedList(B, () => true)) m.set(o.c.market, (m.get(o.c.market) || 0) + 1); return [...m.entries()].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]); }
function pDelayed(B, market) {
  const up = B.d.updated, L = delayedList(B, c => !market || c.market === market), mw = marketsWithDelays(B);
  if (market && L.length < 3) return null;
  const where = market ? market + ', ' + B.mToC.get(market) : $q.hC;
  let body = $q.he + L.length + $q.hD + (L.length === 1 ? ' is' : 's are') + $q.hE + esc(where) + '</b>' + (L.length ? $q.hF + L[0].lm.late + $q.hG + median(L.map(o => o.lm.late)) + $q.bF : '') + $q.hH + ymName(B.ontime.as_of_month + '-01') + $s.k37;
  body += $q.hI + (market ? '' : $q.hJ) + $q.hK + fmt(delayedList(B, () => true).length) + $q.hL + mw.map(([m, n]) => $q.hM + slug(m) + '/"' + (m === market ? $q.hJ : '') + '>' + esc(m) + $q.bA + n + $q.hL).join('') + $q.hN;   // n40 d9: the market filter above the table
  body += tableWrap(DHEAD, delayRows(B, L.slice(0, 200)));
  body += $s.k38 + $s.k24def + $q.hO + $s.k24pp + $q.hg;   // n40 k18 (R08-03, R08-28)
  body += $s.REPLY;
  const path = market ? $q.hP + slug(market) + '/' : $q.hP;
  const cr = [[$q.af, '/'], [$q.hQ, $q.hR], [$q.hS, $q.hP]]; if (market) cr.push([market, path]);
  return render({ path, title: $q.hT + (market ? ' in ' + market : '') + ': ' + L.length + $q.hU, h1: $q.hT + (market ? ' in ' + market : ''), lead: $s.k39, desc: L.length + $q.hV + (market ? ' in ' + market : '') + $q.hW + (L.length ? $q.hX + L[0].lm.late + $q.bF : '') + $q.hY + longDate(up) + '.', updated: up, type: $q.ab, crumbs: cr, body,
    pageLd: { mainEntity: { '@type': $q.U, numberOfItems: L.length, itemListOrder: $q.hZ, itemListElement: L.slice(0, 50).map((o, i) => ({ '@type': $q.F, position: i + 1, name: pname(B, o.c), url: SITE + plink(B, o.c) })) } } });
}
function pChanged(B) {
  const up = (B.drift && B.drift.updated) || B.d.updated, P = (B.drift && B.drift.projects) || {}, byId = new Map(B.cases.map(c => [c.id, c]));
  const prom = (B.promises && B.promises.projects) || {};
  const rows = Object.entries(P).map(([id, p]) => { const c = byId.get(id); if (!c) return null; const ch = (p.changes || []).filter(x => !x.reverted); const mm = (prom[id] || []).reduce((a, x) => a + (x.mm || 0), 0); return { c, n: ch.length, f: [...new Set(ch.map(x => x.label))], mm }; }).filter(o => o && (o.n || o.mm)).sort((a, b) => (b.n + (b.mm ? 1 : 0)) - (a.n + (a.mm ? 1 : 0)) || b.mm - a.mm);
  let devs = [];
  if (B.N.projects.size) { const m = new Map(); for (const o of rows) { const e = B.N.projects.get(o.c.id); if (!e || !e.developer) continue; const k = e.developer; const v = m.get(k) || { name: k, url: e.developer_url, projects: 0, changes: 0, mm: 0 }; v.projects++; v.changes += o.n; v.mm += o.mm; m.set(k, v); } devs = [...m.values()].sort((a, b) => b.changes - a.changes || b.mm - a.mm).slice(0, 30); }
  let body = $q.he + rows.length + $s.k40 + longDate(B.drift.first_day) + ' (' + B.drift.counts.changes + $q.ia + B.drift.counts.projects + $s.k41 + B.drift.fields.join(', ') + $q.bK;
  if (devs.length) body += h2($q.ib, $q.ic) + tableWrap([$q.id, $q.ie, $q.if, $q.ig], devs.map(v => $q.cW + (v.url ? $q.D + esc(v.url.replace(SITE, '')) + '">' + esc(v.name) + '</a>' : esc(v.name)) + $q.aT + v.projects + $q.aT + v.changes + $q.aT + v.mm + $q.aU));
  const cpRow = o => $q.aR + plink(B, o.c) + '">' + esc(pname(B, o.c)) + $q.aS + esc(o.c.market) + $q.aT + o.n + $q.aT + esc(o.f.join(', ') || $q.ih) + $q.aT + o.mm + $q.aU, CPH = [$q.aP, $q.cQ, $q.ii, $q.ij, $q.ig];
  body += h2($q.cC, $q.ik) + tableWrap(CPH, rows.slice(0, 150).map(cpRow)) + (rows.length > 150 ? $q.L + (rows.length - 150) + $q.il + 151 + ' to ' + rows.length + $q.im + tableWrap(CPH, rows.slice(150).map(cpRow)) + $q.in : '');
  body += $s.k42 + $s.REPLY;
  return render({ path: $q.io, title: $q.ip, h1: $q.iq, lead: $q.ir, desc: rows.length + $s.k43 + longDate(B.drift.first_day) + $q.is, updated: up, type: $q.ab, crumbs: [[$q.af, '/'], [$q.hQ, $q.hR], [$q.it, $q.io]], body });
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
  let body = $q.he + L.length + $q.iu + mname + $q.iv + new Set(L.map(c => c.country)).size + $s.k44 + (none ? '<p>' + none + $s.k45 : '') + $q.O;
  const by = new Map(); for (const c of L) { if (!by.has(c.country)) by.set(c.country, []); by.get(c.country).push(c); }
  const G = [...by.entries()].sort((a, b) => b[1].length - a[1].length), flat = [].concat(...G.map(g => g[1])), NP = Math.max(1, Math.ceil(flat.length / NEW_PER));
  const pg = Math.min(NP, Math.max(1, parseInt((u && u.searchParams.get('p')) || '1', 10) || 1)), lo = (pg - 1) * NEW_PER, hi = lo + NEW_PER;
  const pU = n => '/new/' + (n > 1 ? '?p=' + n : ''), start = new Map(); let ix = 0; for (const [k, v] of G) { start.set(k, Math.floor(ix / NEW_PER) + 1); ix += v.length; }
  const pager = NP < 2 ? '' : $q.iw + (lo + 1) + '-' + Math.min(hi, flat.length) + ' / ' + flat.length + $q.ix + Array.from({ length: NP }, (_, i) => i + 1).map(n => n === pg ? $q.iy + n + '</b>' : $q.D + pU(n) + $q.iz + (n === pg - 1 ? $q.iA : n === pg + 1 ? $q.iB : '') + '>' + n + '</a>').join(' ') + $q.iC;
  body += $q.bN + G.map(([k, v]) => $q.cG + (start.get(k) === pg ? '' : pU(start.get(k))) + '#' + slug(k) + '"' + (start.get(k) === pg ? '' : $q.iD) + '>' + esc(k) + ' (' + v.length + $q.cA).join('') + '</ul>' + pager;
  let at = 0; const G2 = []; for (const [k, v] of G) { const a = Math.max(lo, at), b = Math.min(hi, at + v.length); if (a < b) G2.push([k, v.slice(a - at, b - at), a > at]); at += v.length; }
  for (const [k, v, cont] of G2) body += h2(cont ? slug(k) + '-' + pg : slug(k), k + (cont ? $q.iE : '')) + tableWrap([$q.aP, 'Where', 'Stage', $q.iF, $q.iG, $q.iH], v.map(c => $q.aR + plink(B, c) + '">' + esc(pname(B, c)) + $q.aS + esc(place(c)) + $q.aT + esc(c.stage || $q.bC) + $q.aT + (c.done || $q.bD) + $q.aT + (reviewed(c) ? c.score + $q.bE + longDate(A.get(c.id)) : NOT_REVIEWED + $q.iI) + $q.aU)) + $q.hf + slug(k) + $q.iJ + esc(k) + $q.hg;
  body += pager + $s.REPLY;
  return render({ path: pU(pg), prev: pg > 1 ? pU(pg - 1) : null, next: pg < NP ? pU(pg + 1) : null, noindex: pg > 1, title: $q.iK + mname + ': ' + L.length + $q.iL + (pg > 1 ? $q.iM + pg : '') + $q.dL, h1: $q.iN, lead: $q.iO + mname + $q.iP, desc: L.length + $q.iQ + mname + ' in ' + by.size + $q.iR, updated: up, type: $q.ab, crumbs: [[$q.af, '/'], [$q.iS, '/new/']], body });
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
    const pager = NP < 2 ? '' : $q.iw + (lo + 1) + '-' + Math.min(hi, flat.length) + ' / ' + flat.length + $q.ix + Array.from({ length: NP }, (_, i) => i + 1).map(n => n === pg ? $q.iy + n + '</b>' : $q.D + pU(n) + '"' + (n === pg - 1 ? $q.iA : n === pg + 1 ? $q.iB : '') + '>' + n + '</a>').join(' ') + $q.iC;
    const G = new Map(); for (const [m, pr] of flat.slice(lo, hi)) { if (!G.has(m)) G.set(m, []); G.get(m).push(pr); }
    let body = $q.iT + P.length + $s.k46 + (P.length ? (NP > 1 ? $q.bN + [...by.entries()].map(([m, l]) => $q.cG + (start.get(m) === pg ? '' : pU(start.get(m))) + '#' + slug(m) + '">' + esc(m) + ' (' + l.length + $q.cA).join('') + '</ul>' : '') + pager + [...G.entries()].map(([m, l]) => { const cont = start.get(m) < pg; return h2(cont ? slug(m) + '-' + pg : slug(m), m + (cont ? $q.iE : '')) + $q.iU + l.map(([a, b]) => $q.cG + pairPath(B, a, b) + '">' + esc(pname(B, a)) + ' vs ' + esc(pname(B, b)) + $q.bP).join('') + '</ul>'; }).join('') + pager : $q.iV);
    return render({ path: pU(pg), prev: pg > 1 ? pU(pg - 1) : null, next: pg < NP ? pU(pg + 1) : null, title: $q.iW + (pg > 1 ? $q.iM + pg : '') + $q.dL, h1: $q.iX, desc: P.length + $s.k47, updated: up, type: $q.ab, crumbs: [[$q.af, '/'], [$q.iY, '/vs/']], body, noindex: !P.length || pg > 1 });
  }
  let pr = P.find(([a, b]) => pairPath(B, a, b) === '/vs/' + key + '/');
  if (!pr) { const mk = /^([a-z0-9]+-[0-9]+)-vs-([a-z0-9]+-[0-9]+)$/.exec(key); let a, b;
    if (mk) { const f = id => B.cases.find(c => c.id.toLowerCase() === id && B.N.projects.has(c.id)); a = f(mk[1]); b = f(mk[2]); }
    else { const bs = new Map(); for (const c of B.cases) if (B.N.projects.has(c.id)) bs.set(pslug(B, c), c);
      for (let i = key.indexOf('-vs-'); i > 0 && !(a && b); i = key.indexOf('-vs-', i + 1)) { a = bs.get(key.slice(0, i)); b = bs.get(key.slice(i + 4)); } }
    if (!a || !b || a === b) return null; if (!a || !b || a.market !== b.market || !a.stage || a.stage !== b.stage || !a.band || a.band !== b.band) return null; if ('/vs/' + key + '/' !== pairPath(B, a, b)) return { redirect: pairPath(B, a, b) }; pr = [a, b]; }
  const [a, b] = pr, la = lateMonths(B, a), lb = lateMonths(B, b), na = pname(B, a), nb = pname(B, b);
  const row = (k, f) => $q.iZ + k + $q.ja + f(a, la) + $q.aT + f(b, lb) + $q.aU;
  const rows = [row('Where', c => esc(place(c)) + ', ' + esc(c.country)), row('Stage', c => esc(c.stage)), row($q.jb, c => esc(c.band)), row($q.iF, c => c.done || $q.bD), row($q.jc, (c, l) => l ? ymName(l.first + '-01') : $q.bD), row($q.jd, (c, l) => l ? (l.late > 0 ? l.late : $q.bG) : $q.bH), row('Title', c => esc(c.title || $q.bD) + (c.lease ? ' (' + c.lease + $q.je : ''))]
    .concat(CHECKS.map(k => row(CKN[k], c => (isPub(c, k) ? $q.jf : $q.jg) + (isConf(c, k) ? $q.jh : '')))).concat([row($q.iG, c => c.score + '/6'), row($q.gq, c => (c.vscore || 0) + '/6'), row($q.ji, c => (c.claims || {}).contradicted || 0), row($q.jj, c => esc(c.checked))]);
  const body = $q.he + esc(na) + ' and ' + esc(nb) + $q.jk + esc(a.stage) + $q.dh + esc(a.market) + $q.jl + esc(a.band) + $q.jm + esc(na) + $q.jn + a.score + $q.jo + (a.vscore || 0) + $q.jp + esc(nb) + $q.jn + b.score + $q.jq + (b.vscore || 0) + $s.k48 + plink(B, a) + '">' + esc(na) + $q.jr + plink(B, b) + '">' + esc(nb) + $q.js + rows.join('') + $q.jt + slugM(a.market) + '/">' + esc(a.market) + $q.hv + slug(a.country) + '/">' + esc(a.country) + $q.ju + $s.REPLY;
  return render({ path: pairPath(B, a, b), title: na + ' vs ' + nb + $q.jv, h1: na + ' vs ' + nb, lead: $q.jw + esc(a.market) + $q.jx, desc: na + ' vs ' + nb + ' (' + a.market + '): ' + a.score + $q.jy + b.score + $q.jz + (a.done || 'n/a') + ' vs ' + (b.done || 'n/a') + $q.jA, updated: up, crumbs: [[$q.af, '/'], [$q.iY, '/vs/'], [na + ' vs ' + nb, pairPath(B, a, b)]], body });
}
function pRankings(B) {
  const mw = marketsWithDelays(B);
  const RK = $s.d9rk, nd = delayedList(B, () => true).length;   // n40 d9: the rankings as cards (title, what it ranks), then the delay ranking by market as chips
  const body = RK ? $q.jB + RK.map(r => $q.cG + r[0] + '"><b>' + esc(r[1]) + $q.bV + esc(r[2].replace('{n}', fmt(nd))) + $q.jC).join('') + '</ul>' + h2($q.jD, $q.jE) + $q.bN + mw.map(([m, n]) => $q.hM + slug(m) + '/">' + esc(m) + $q.bA + n + $q.hL).join('') + '</ul>'
    : $s.k49 + mw.map(([m, n]) => $q.hM + slug(m) + $q.jF + esc(m) + $q.cH + n + $q.jG).join('') + $s.k50;
  return render({ path: $q.hR, title: $q.jH, h1: $q.jI, desc: $s.k51, updated: B.d.updated, type: $q.ab, crumbs: [[$q.af, '/'], [$q.hQ, $q.hR]], body });
}

function diMonths(B) { return ((B.delay && B.delay.history) || []).filter(h => /^\d{4}-\d{2}$/.test(h.month)).sort((a, b) => a.month < b.month ? 1 : -1); }
function diRows(h) { return Object.entries(h.markets || {}).map(([m, a]) => ({ m, tracked: a[0], past: a[1], share: a[2], median: a[3], p90: a[4] })).sort((a, b) => b.tracked - a.tracked || a.m.localeCompare(b.m)); }
function diCsv(B, month) {
  const h = diMonths(B).find(x => x.month === month); if (!h) return null;
  const q = v => v == null ? '' : /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
  const lines = [$s.k52, [$q.jJ, '', h.all.with_date, h.all.past_first, h.all.share_past_first, h.all.median_late, h.all.p90_late].map(q).join(',')].concat(diRows(h).map(r => [r.m, B.mToC.get(r.m) || '', r.tracked, r.past, r.share, r.median, r.p90].map(q).join(',')));
  return lines.join('\n') + '\n';
}
function pDeliveryIndex(B, month) {
  const ms = diMonths(B); if (!ms.length) return null;
  if (!month) {
    const body = $s.k53 + ms.map(h => $q.jK + h.month + '/">' + ymName(h.month + '-01') + $q.jL + h.all.share_past_first + $q.jM + h.all.past_first + ' of ' + h.all.with_date + $q.jG).join('') + $s.k54;
    return render({ path: $q.jN, title: $q.jO, h1: $q.jP, lead: $s.k55, desc: $s.k56, updated: ms[0].taken, type: $q.ab, crumbs: [[$q.af, '/'], ['Press', $q.jQ], [$q.jR, $q.jN]], body });
  }
  const h = ms.find(x => x.month === month); if (!h) return null;
  const rows = diRows(h), big = rows.filter(r => r.tracked >= 5), mname = ymName(month + '-01'), path = $q.jN + month + '/';
  const cite = $q.jS + mname + $q.jT + path + $q.jU + h.taken + $q.jV;
  const worst = big.filter(r => r.share > 0).sort((a, b) => b.share - a.share).slice(0, 5);
  let body = $q.he + h.all.share_past_first + $s.k57 + mname + $q.jW + h.all.past_first + ' of ' + h.all.with_date + '); ' + h.all.share_past_current + $q.jX + h.all.median_late + $q.jY + h.all.p90_late + $q.jZ + (worst.length ? $q.ka + worst.map(r => esc(r.m) + ' ' + r.share + '% (' + r.past + ' of ' + r.tracked + ')').join(', ') + '.</p>' : '') + $q.O;
  body += $q.bU + h.all.with_date + $q.kb + h.all.share_past_first + $q.kc + h.all.share_past_current + $q.kd + h.all.median_late + $q.ke + h.all.p90_late + $q.kf;
  body += h2('cite', $q.kg) + $q.kh + esc(cite) + $q.ki + month + $s.k58 + esc(h.input_sha256) + $q.kj;
  body += h2($q.bL, $q.kk) + tableWrap([$q.cQ, $q.bl, $q.kl, $q.km, 'Share', $q.cV, $q.kn], rows.map(r => $q.cW + (B.mToC.has(r.m) ? $q.ko + slugM(r.m) + '/">' + esc(r.m) + '</a>' : esc(r.m)) + $q.aT + esc(B.mToC.get(r.m) || '') + $q.aT + r.tracked + $q.aT + r.past + $q.aT + r.share + $q.kp + (r.median == null ? $q.cX : r.median) + $q.aT + (r.p90 == null ? $q.cX : r.p90) + $q.aU));
  body += h2($q.kq, $q.kr) + $q.iU + Object.entries(B.delay.rules || {}).map(([k, v]) => $q.ks + esc(k.replace(/_/g, ' ')) + $q.kt + esc(v) + '</li>').join('') + '</ul>' + ((B.delay.caveats || []).length ? $q.ku + B.delay.caveats.map(c => '<li>' + esc(c) + '</li>').join('') + '</ul>' : '') + $s.k59;
  return render({ path, title: $q.kv + mname + ': ' + h.all.share_past_first + $q.kw, h1: $q.kx + mname, lead: $q.ky, desc: mname + ': ' + h.all.share_past_first + '% of ' + h.all.with_date + $q.kz + h.all.median_late + $q.kA, updated: h.taken, type: $q.ad, crumbs: [[$q.af, '/'], ['Press', $q.jQ], [$q.jR, $q.jN], [mname, path]], body,
    ld: [{ '@type': $q.kB, '@id': SITE + path + $q.kC, name: $q.jS + mname, description: $s.k60 + h.taken + '.', url: SITE + path, license: $q.kD, creator: { '@type': $q.ag, name: $q.af, url: SITE + '/' }, temporalCoverage: month, dateModified: h.taken, isAccessibleForFree: true, variableMeasured: [$q.kE, $q.kF, $q.kG], distribution: [{ '@type': $q.kH, encodingFormat: $q.kI, contentUrl: SITE + $q.jN + month + '.csv' }, { '@type': $q.kH, encodingFormat: $q.kJ, contentUrl: SITE + $q.l }], citation: cite }] });
}

function embedHtml(title, inner, canon) {
  return $s.k61 + canon + $q.kK + esc(title) + $s.k62 + inner + $q.kL;
}
const EMBED_HDR = { 'content-type': 'application/xhtml+xml; charset=utf-8', 'cache-control': 'public, max-age=3600, no-transform', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'none'", 'x-robots-tag': 'noindex, follow' };
function eDelay(B, mslug) {
  const r = (B.delay && B.delay.markets || []).find(x => slug(x.market) === mslug); if (!r) return null;
  const canon = SITE + $q.kM + mslug + '/';
  return embedHtml($q.kN + r.market, $q.kO + esc(r.market) + $q.kP + esc(ymName(B.delay.as_of_month + '-01')) + $q.kQ + r.tracked + $q.kR + r.share_past_first + $q.kS + (r.median_late == null ? 'n/a' : r.median_late) + $q.kT + SITE + $s.k63 + SITE + '/m/' + slugM(r.market) + $q.kU + esc(r.market) + $q.kV, canon);
}
function eProject(B, id) {
  const c = B.all.find(x => x.id.toLowerCase() === String(id).toLowerCase()); if (!c) return null;
  if (!reviewed(c)) return embedHtml($q.kW + pname(B, c), $q.kX + esc(pname(B, c)) + $q.kY + esc(place(c)) + ', ' + esc(c.country) + $q.hq + NOT_REVIEWED + $q.kZ + SITE + plink(B, c) + $q.la, SITE + $q.lb + c.id.toLowerCase() + '/');
  const lm = lateMonths(B, c), canon = SITE + $q.lb + c.id.toLowerCase() + '/';
  return embedHtml($q.lc + pname(B, c), $q.kX + esc(pname(B, c)) + $q.kY + esc(place(c)) + ', ' + esc(c.country) + ' · ' + esc(c.stage || '') + $q.ld + esc(c.checked) + $q.kQ + c.score + $q.le + (c.vscore || 0) + $q.lf + (lm ? (lm.late > 0 ? lm.late + ' mo' : 'no') : 'n/a') + $q.lg + CHECKS.map(k => '<li>' + CKN[k] + ': ' + (isPub(c, k) ? $q.jf : $q.jg) + (isConf(c, k) ? $q.jh : '') + '</li>').join('') + $q.lh + SITE + plink(B, c) + $s.k64, canon);
}
function pWidgets(B) {
  const ms = (B.delay && B.delay.markets || []).filter(r => r.tracked >= 5).sort((a, b) => b.tracked - a.tracked);
  const ex = B.cases.find(c => B.N.projects.has(c.id)) || B.cases[0], m0 = ms[0];
  const code = s => $s.k65 + esc(s) + $q.li;
  const ifr = (p, h, t) => $q.lj + SITE + p + $q.lk + h + $q.ll + t + $q.lm;
  let body = $s.k66;
  if (m0) body += h2('delay', $q.ln) + $q.lo + esc(m0.market) + ':</p>' + ifr($q.kM + slug(m0.market) + '/', 190, $q.lp + esc(m0.market)) + code(ifr($q.kM + slug(m0.market) + '/', 190, $q.lp + m0.market) + $q.lq + SITE + '/m/' + slugM(m0.market) + $q.lr + m0.market + $q.ls) + $q.lt + ms.map(r => $q.lu + slug(r.market) + '/">' + esc(r.market) + $q.bP).join('') + '</ul>';
  body += $s.k67;   // n30c (item 19)
  if (ex) body += h2($q.k, $q.lv) + ifr($q.lb + ex.id.toLowerCase() + '/', 330, $q.lw) + code(ifr($q.lb + ex.id.toLowerCase() + '/', 330, $q.lw) + $q.lq + SITE + plink(B, ex) + '">' + pname(B, ex) + $q.lx) + $q.ly;
  { const dv = $s.dwx, fr = ifr($q.lz + dv + '/', 380, $q.lA); if (dv) body += h2($q.j, $q.lB) + fr + code(fr + $q.lq + SITE + $q.lC + dv + $q.lD) + $s.dwy; }   // n40 k45 (R03-18)
  body += h2($q.lE, $q.lF) + $s.k68 + (ex && B.N.projects.get(ex.id) ? $q.lG + esc(B.N.projects.get(ex.id).loc.replace(SITE + $q.lH, '').replace(/\/$/, '')) + $q.lI : '') + '</ul>';
  body += h2('more', $q.lJ) + $s.k69;
  return render({ path: $q.lK, title: $q.lL, h1: $q.lM, desc: $s.k70, updated: B.d.updated, crumbs: [[$q.af, '/'], ['Press', $q.jQ], [$q.lN, $q.lK]], body });
}

const XHDR = { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=600', 'x-robots-tag': 'noindex' };
const urlset = (items, alt, img) => $s.k71 + (alt ? $q.lO : '') + (img ? $q.lP : '') + '>\n' + items.map(i => $q.lQ + xesc(i.loc) + $q.lR + (i.lastmod ? $q.lS + i.lastmod + $q.lT : '') + (i.alt || []).map(a => $q.lU + a[0] + $q.au + xesc(a[1]) + '"/>').join('') + (i.img || []).map(u => $q.lV + xesc(u) + $q.lW).join('') + $q.lX).join('\n') + $q.lY;
async function imageUrls(env, B, NP, ND, pages) {
  const prog = await file(env, $q.lZ), sp = (prog && prog.projects) || {};
  const one = (i, kind) => { const b = i.base, img = [SITE + '/og' + b.replace(/\/$/, '') + '.png']; const r = kind === $q.k && i.id && sp[i.id]; if (r && r.frames && r.v) img.push(SITE + $q.ma + encodeURIComponent(i.id) + $q.mb + encodeURIComponent(r.v)); return { loc: i.loc, lastmod: i.lastmod, img }; };
  const en = i => !/^https:\/\/kolaboro\.com\/(es|de|fr|ru|nl|ar|zh)\//.test(i.loc);
  const out = NP.filter(i => en(i) && /^\/projects\/[^/]+\/$/.test(i.base || '')).map(i => one(i, $q.k)).concat(ND.filter(i => en(i) && /^\/developers\/[^/]+\/$/.test(i.base || '')).map(i => one(i, $q.j)));
  if (pages) { const E = pages.filter(pg => pg.lang === 'en'), I = await Promise.all(E.map(pg => ogOf(env, pg.loc.replace(SITE, '')))); E.forEach((pg, i) => { if (I[i]) out.push({ loc: pg.loc, lastmod: pg.lastmod, img: [I[i]] }); }); }
  return out;
}
async function ogOf(env, p) {
  const k = '__og' + p, m = MEMO[k]; if (m && Date.now() - m.t < 21600000) return m.v;
  let v = null;
  if (p.endsWith('/')) try { const r = await env.ASSETS.fetch(new Request(SITE + $q.g + p + $q.mc)); if (r.ok) { const t = (await r.text()).slice(0, 12000), g = /<meta property="og:image" content="(https:\/\/kolaboro\.com\/[^"?#]+\.(?:png|jpe?g|webp))"/.exec(t); v = g ? g[1] : null; }
    if (v) { const i = await env.ASSETS.fetch(new Request(SITE + $q.g + v.replace(SITE, ''))); if (!i.ok) v = null; }   // only images that exist
  } catch (e) { v = null; }
  MEMO[k] = { t: Date.now(), v }; return v;
}
const XL = ['methods/construction-stage', 'methods/delivery-forecast', 'guides/short-let-rules', 'satellite/plot', 'watch/lookalikes', 'graph/developers', 'tools/contract-addendum', 'tools/permit-photo', 'tools/my-checklist', 'tools/account-check', 'tools/payment-email-check', 'live/xrays', 'open', 'numbers', 'bali', 'dubai', 'phuket', 'tulum', 'algarve', 'lombok', 'glossary', 'guides', 'tools', 'compare', 'developers', 'data', 'engineering', 'map', 'press', 'press/monthly', 'courts', 'developers/benchmark', 'transparency-index', 'index/prices', 'index/delays', 'compare/markets', 'rankings/changed-promises'];
const XE = ['tools/site-visit', 'findings', 'room', 'bulk-check', 'engineering/seo'];
const xtraLocs = () => XL.flatMap(p => LANGS.map(l => SITE + (l === 'en' ? '' : '/' + l) + '/' + p + '/')).concat(XE.map(p => SITE + '/' + p + '/')).map(loc => ({ loc, lastmod: null }));
async function staticPages(env, audit) {   // the static sitemap (kept as /sitemap.xml for the QA tools) grouped by language
  const sm = (await file(env, $q.md)) || '';
  const locs0 = [...sm.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?/g)].map(m => ({ loc: m[1], lastmod: m[2] || null }));
  const have = new Set(locs0.map(x => x.loc)), locs = locs0.concat(xtraLocs().filter(x => !have.has(x.loc)));
  const set = new Set(locs.map(x => x.loc)), lm = (audit && audit.lastmod) || {};
  const key = loc => { const p = loc.replace(SITE, ''), m = /^\/(es|de|fr|ru|nl|ar|zh)(\/.*)$/.exec(p); return m ? [m[1], m[2]] : ['en', p]; };
  const drop = new Set(((audit && audit.exclude) || []).concat([$q.me, $q.mf]));   // noindex or non-200 pages found by the crawl audit
  return locs.filter(x => !drop.has(x.loc.replace(SITE, ''))).map(x => { const [l, p] = key(x.loc), alt = LANGS.map(L => [L, SITE + (L === 'en' ? p : '/' + L + p)]).filter(a => set.has(a[1])); return { loc: x.loc, lang: l, lastmod: lm[x.loc.replace(SITE, '')] || x.lastmod, alt: alt.length > 1 ? alt.concat([[$q.mg, SITE + p]]) : null }; });
}
async function hubUrls(B) {
  const up = B.d.updated, list = countryList(B), out = [], asOf = B.ontime && B.ontime.as_of_month ? B.ontime.as_of_month + '-01' : null;
  out.push({ loc: SITE + $q.bs, lastmod: maxLm(B, B.all), t: $q.bj });
  out.push({ loc: SITE + $q.mh, lastmod: maxLm(B, B.all), t: $q.mi });   // n40 R01-33
  for (const x of list) { out.push({ loc: SITE + $q.bs + x.s + '/', lastmod: maxLm(B, x.L.concat(x.U), x.L.some(c => lateMonths(B, c)) ? [asOf] : []), t: $q.bj }); if (x.L.length >= THIN_MIN) out.push({ loc: SITE + $q.bs + x.s + $q.dT, lastmod: maxLm(B, x.L), t: $q.mi }); if (x.L.length >= SAFE_MIN) out.push({ loc: SITE + $q.bs + x.s + $q.gK, lastmod: maxLm(B, x.L, [asOf]), t: $q.mi }); { const lw = lawFor(B, x.c); if (lw.length) out.push({ loc: SITE + $q.bs + x.s + $q.dR, lastmod: lw.reduce((m, r) => r.checked > m ? r.checked : m, (B.law && B.law.version) || up), t: $q.mi }); const dh = lateLaw(B, x.c); if (dh.length) out.push({ loc: SITE + $q.bs + x.s + $q.hx, lastmod: dh.reduce((m, r) => r.checked > m ? r.checked : m, up), t: $q.mi }); } }
  const dl = delayedList(B, () => true).map(o => o.c), drift = (B.drift && B.drift.projects) || {}, m0 = up.slice(0, 7) + '-01', A = addedDates(B);
  out.push({ loc: SITE + $q.hR, lastmod: maxLm(B, B.cases, [asOf]), t: $q.mj }, { loc: SITE + $q.hP, lastmod: maxLm(B, dl, [asOf]), t: $q.mj }, { loc: SITE + $q.io, lastmod: maxLm(B, B.cases.filter(c => drift[c.id])), t: $q.mj }, { loc: SITE + '/new/', lastmod: maxLm(B, B.all.filter(c => !reviewed(c) || (A.get(c.id) || '').slice(0, 7) === m0.slice(0, 7)), [m0]), t: $q.mj }, { loc: SITE + $q.lK, lastmod: maxLm(B, B.all), t: $q.mj });
  out.push({ loc: SITE + $q.jN, lastmod: (diMonths(B)[0] || {}).taken || up, t: $q.mj }); for (const h of diMonths(B)) out.push({ loc: SITE + $q.jN + h.month + '/', lastmod: h.taken, t: $q.mj });
  for (const [m] of marketsWithDelays(B)) out.push({ loc: SITE + $q.hP + slug(m) + '/', lastmod: maxLm(B, dl.filter(c => c.market === m), [asOf]), t: $q.mj });
  const P = pairs(B); if (P.length) { out.push({ loc: SITE + '/vs/', lastmod: maxLm(B, P.flat()), t: $q.dW }); for (const [a, b] of P) out.push({ loc: SITE + pairPath(B, a, b), lastmod: maxLm(B, [a, b]), t: $q.dW }); }
  for (const o of out) if (o.lastmod) o.lastmod = String(o.lastmod).slice(0, 10);
  return out;
}
function namedUrls(B, type) {   // seoP's named pages, grouped by base URL with hreflang alternates; lastmod = last real data change (kbx_lastmod.js)
  const list = B.N.all.filter(e => e.type === type && (e.sm !== false || (B.prio && B.prio.has(e.loc.replace(SITE, '').replace(/^\/(es|de|fr|ru|nl|ar|zh)\//, '/'))))); const byBase = new Map(), T = B.T;
  const all = T ? [...T.project.values()].sort() : [], newest = all[all.length - 1] || null;
  const tlm = (e, b) => { if (!T) return null; if (type === $q.k && e.id) return T.project.get(e.id) || null; if (type === $q.j) { const m = /^\/developers\/([^/]+)\/$/.exec(b); return m ? T.developer.get(m[1]) || null : null; } if (type === 'index') return newest; return null; };
  for (const e of list) { const p = e.loc.replace(SITE, ''), m = /^\/(es|de|fr|ru|nl|ar|zh)(\/.*)$/.exec(p), b = m ? m[2] : p; if (!byBase.has(b)) byBase.set(b, []); byBase.get(b).push(Object.assign({ l: m ? m[1] : (e.lang || 'en') }, e)); }
  const out = [];
  for (const [b, g] of byBase) { const alt = g.length > 1 ? g.map(e => [e.l, e.loc]).concat([[$q.mg, SITE + b]]) : null; const en = g.find(e => e.l === 'en') || g[0], d = tlm(en, b); for (const e of g) out.push({ loc: e.loc, lastmod: d || (e.lastmod || '').slice(0, 10) || null, alt, id: en.id, base: b }); }
  return out;
}
const EXT_MAPS = ['/stories/sitemap.xml', '/rankings/transparency/sitemap.xml', '/progress/sitemap.xml', '/handover/sitemap.xml', '/weekly/sitemap.xml', '/guides/buying-off-plan/sitemap.xml', '/reports/sitemap.xml', '/m/sitemap.xml'];
async function sitemaps(env, B, name) {
  const audit = await file(env, $q.mk);
  const pages = await staticPages(env, audit), hubs = await hubUrls(B), up = B.d.updated;
  const byM = new Map(); for (const c of B.all) { if (!byM.has(c.market)) byM.set(c.market, []); byM.get(c.market).push(c); }
  const mk = [...byM.entries()].map(([m, L]) => ({ loc: SITE + '/m/' + slugM(m) + '/', lastmod: maxLm(B, L) }));
  const anon = B.all.filter(c => !B.N.projects.has(c.id) && /^[A-Za-z0-9-]{3,20}$/.test(c.id)).map(c => ({ loc: SITE + '/p/' + encodeURIComponent(c.id) + '/', lastmod: tl(B, c) }));
  const S = { ['pages-en']: pages.filter(p => p.lang === 'en') };
  for (const l of LANGS.slice(1)) S[$q.ml + l] = pages.filter(p => p.lang === l);
  Object.assign(S, { countries: hubs.filter(h => h.t === $q.bj), guides: hubs.filter(h => h.t === $q.mi), rankings: hubs.filter(h => h.t === $q.mj), compare: hubs.filter(h => h.t === $q.dW && h.loc === SITE + '/vs/'), markets: mk, 'projects-anonymous': [] });   // n27g: sitemap diet: the /vs/<id>-vs-<id>/ pairs and the anonymous /p/ pages stay live but are not listed (anon: kept for the count only)
  try { const pr0 = await file(env, $q.mm); B.prio = new Set(((pr0 && pr0.recrawl) || []).map(r => String(r.path || '').replace(/^\/(es|de|fr|ru|nl|ar|zh)\//, '/'))); } catch (e) { B.prio = null; }
  const NP = namedUrls(B, 'index').concat(namedUrls(B, $q.k)), ND = namedUrls(B, $q.j), lg = i => (/^https:\/\/kolaboro\.com\/(es|de|fr|ru|nl|ar|zh)\//.exec(i.loc) || [0, 'en'])[1];
  for (const l of LANGS) { S[$q.mn + l] = NP.filter(i => lg(i) === l); S[$q.mo + l] = ND.filter(i => lg(i) === l); }
  S.images = (await imageUrls(env, B, NP, ND, pages)).concat(mk.map(i => ({ loc: i.loc, lastmod: i.lastmod, img: [SITE + $q.mp] })));   // n40 R03-05: market pages with the share card they carry
  try { const MP = ((await file(env, $q.mq)) || {}).pages || {}, GL = MP.guides || [], LL = MP.law || [];   // n40 L1: the guides and delay rankings in 7 more languages (kbx_n32t.js), with hreflang
    for (const h of hubs) { const p = h.loc.replace(SITE, ''), G = /^\/countries\/[^/]+\/(?:buyer-protection-law|delayed-handover)\/$/.test(p) ? LL : GL; if (!G.length || !/^\/(?:countries\/[^/]+\/(?:how-to-check|is-it-safe|buyer-protection-law|delayed-handover)|rankings\/most-delayed(?:\/[^/]+)?)\/$/.test(p)) continue; h.alt = [['en', h.loc]].concat(G.map(l => [l, SITE + '/' + l + p]), [[$q.mg, h.loc]]); for (const l of G) S[$q.ml + l].push({ loc: SITE + '/' + l + p, lastmod: h.lastmod, alt: h.alt }); } } catch (e) {}
  for (const k of Object.keys(S)) if (k !== $q.mr) { const seen = new Set(); S[k] = S[k].filter(i => i && i.loc && !seen.has(i.loc) && seen.add(i.loc)); }   // n20f: one URL once per sitemap (/report/sample/ was listed twice)
  try {
    const pr = await file(env, $q.mm), rk = new Map(), base = x => x.replace(SITE, '').replace(/^\/(es|de|fr|ru|nl|ar|zh)\//, '/');
    ((pr && pr.recrawl) || []).forEach((r, i) => { if (r && r.path && !rk.has(r.path)) rk.set(r.path, i); });
    let top = []; try { const T = (await import('./kbx_g27.js')).TOP_IDS; top = Array.isArray(T) ? T : String(T).split(/\s+/); } catch (e) {}
    const tk = new Map(top.map((id, i) => [id, i])), big = 1e6;
    const score = i => { const p = i.loc.replace(SITE, ''); if (rk.has(p)) return rk.get(p); const b = base(i.loc); if (b !== p && rk.has(b)) return 1000 + rk.get(b); return i.id && tk.has(i.id) ? 10000 + tk.get(i.id) : big; };
    for (const k of Object.keys(S)) if (k !== $q.mr && S[k].length > 1) S[k] = S[k].map((i, n) => [score(i), n, i]).sort((x, y) => x[0] - y[0] || x[1] - y[1]).map(x => x[2]);
    const ix = new Map(); for (const k of Object.keys(S)) if (k !== $q.mr) for (const i of S[k]) if (!ix.has(i.loc)) ix.set(i.loc, i);
    S.recrawl = [...rk.keys()].map(p => ix.get(SITE + p)).filter(Boolean);
  } catch (e) { S.recrawl = []; }
  if (name === 'index' || name === 'stats') {
    const keys = Object.keys(S).filter(k => S[k].length);
    if (name === 'stats') return Object.fromEntries(Object.keys(S).filter(k => k !== $q.ms).map(k => [k, S[k].length]));
    const last = k => S[k].reduce((a, i) => (i.lastmod && i.lastmod > a ? i.lastmod : a), '') || up;
    const ext = [];
    for (const x of EXT_MAPS) {   // n29i: translated market files;   // n29h1: + place data pages (kbx_h29.js)
      let ok = MEMO['__ext' + x];
      if ((!ok || Date.now() - ok.t > 600000) && B.inner && B.ctx && B.ctx.waitUntil) { MEMO['__ext' + x] = ok = { t: Date.now(), v: ok ? ok.v : null }; B.ctx.waitUntil((async () => { try { const r = await B.inner(x); if (r && r.ok && /xml/.test(r.headers.get($q.i) || '')) { const t = await r.text(); const ds = [...t.matchAll(/<lastmod>(\d{4}-\d{2}-\d{2})/g)].map(m => m[1]).sort(); MEMO['__ext' + x] = { t: Date.now(), v: { last: ds[ds.length - 1] || null, n: (t.match(/<url>/g) || []).length } }; } } catch (e) {} })()); }
      const lmx = (ok && ok.v && ok.v.last) || String(up || '').slice(0, 10);
      ext.push($q.mt + SITE + x + $q.lR + (/^\d{4}-\d{2}-\d{2}$/.test(lmx) ? $q.lS + lmx + $q.lT : '') + $q.mu);
    }
    return new Response($s.k72 + keys.map(k => $q.mt + SITE + $q.mv + k + $q.mw + last(k) + $q.mx).concat(ext).join('\n') + $q.my, { headers: XHDR });
  }
  if (!S[name] || !S[name].length) return new Response($q.mz, { status: 404 });
  return new Response(urlset(S[name], S[name].some(i => i.alt), S[name].some(i => i.img)), { headers: XHDR });
}

async function llms(env, B, full) {
  const st = (await file(env, full ? $q.mA : $q.mB, 60000)) || $q.mC;
  const S = stats(B.cases), list = countryList(B), up = B.d.updated, L = [];
  L.push('', $q.mD + longDate(up) + $q.mE, '- ' + fmt(B.all.length + B.coi.length) + $q.mF + list.length + $q.bc + (new Set(B.all.map(c => c.market)).size + (B.coi.length ? 1 : 0)) + $q.mG + (B.coi.length ? ' (' + B.coi.length + $q.mH : '') + (B.unrev.length ? '; ' + fmt(B.unrev.length) + $q.mI : '') + '.', '- ' + pct(S.pub.permit, S.n) + $q.mJ + pct(S.pub.escrow, S.n) + $q.mK + S.overdue + $q.mL, '- ' + fmt(S.contra) + ' of ' + fmt(S.claims) + $q.mM, $q.mN + longDate(up) + $q.mO);
  L.push('', $q.mP);
  for (const x of list.filter(o => o.L.length)) { const s = stats(x.L); L.push($q.mQ + x.c + '](' + SITE + $q.bs + x.s + '/): ' + x.L.length + $q.dG + pct(s.pub.permit, s.n) + $q.dA + pct(s.pub.escrow, s.n) + $q.mR + SITE + $q.bs + x.s + $q.mS + (x.L.length >= SAFE_MIN ? $q.mT + SITE + $q.bs + x.s + $q.mU : '') + (lawFor(B, x.c).length ? $q.mV + SITE + $q.bs + x.s + $q.mW : '')); }
  { const lx = p => ['es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'].map(l => '[' + l + '](' + SITE + '/' + l + p + ')').join(', ');   // n40 k7 (R06-32): the guide families and /faq/, with their language versions
    L.push('', $q.mX, $q.mY + SITE + $q.mZ + lx($q.mh) + '.', $q.na + SITE + $q.nb + lx('/faq/') + '.',
      $q.nc + SITE + $q.nd + SITE + $q.ne, $q.nf + SITE + $s.k73 + SITE + $q.ng,
      $q.nh + SITE + $q.ni + SITE + $q.nj + SITE + $q.nk, $q.nl + SITE + $q.nm); }
  L.push('', $q.nn, $q.no + SITE + $q.np);   // n27c
  for (const P of BUY_PLACES) L.push($q.nq + BUY_PL[P.s].in.en + $q.nr + SITE + $q.ns + P.s + $s.k74);
  L.push('', $q.nt, $q.nu + SITE + $q.nv, $q.nw + SITE + $q.nx, $q.ny + SITE + $q.nz, $q.nA + SITE + $q.nB, $q.nC + SITE + $q.nD);
  L.push('', $q.nE, $q.nF + SITE + $s.k75,
    $q.nG + SITE + $s.k76 + SITE + $q.nH, $q.nI + SITE + $q.nJ,
    $q.nK + SITE + $q.nL + SITE + $q.nM, $q.nN + SITE + $q.nO,
    $q.nP + SITE + $q.nQ, $q.nR + SITE + $q.nS, $q.nT + SITE + $q.nU, $q.nV + SITE + $q.nW,
    $q.nX + SITE + $q.nY, $q.nZ + SITE + $q.oa + SITE + $q.ob, $q.oc + SITE + $s.k77,
    $q.od + SITE + $q.oe + SITE + $q.of + SITE + $q.og, $q.oh + SITE + $q.oi + SITE + $q.oj);
  const np = [...B.N.projects.values()], byId = new Map(B.all.map(c => [c.id, c]));
  if (np.length) {
    const cn = new Map(); for (const e of np) { const c = byId.get(e.id); if (c && c.country) cn.set(c.country, (cn.get(c.country) || 0) + 1); }
    L.push('', $q.ok, $q.ol + ['es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'].map(l => '[' + l + '](' + SITE + '/' + l + $q.om).join(', ') + $q.on + SITE + $q.oo + SITE + $q.op, $s.k78 + SITE + $q.oq, $q.or + SITE + $q.os, $q.ot + SITE + $q.ou + SITE + $q.ov, $q.ow + [...cn.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([c, n]) => '[' + c + '](' + SITE + $q.ox + slug(c) + $q.oy + n).join(', '));
  }
  if (np.length) {
    const pm = new Map(); for (const e of np) { const c = byId.get(e.id); if (c && c.market) pm.set(c.market, (pm.get(c.market) || 0) + 1); }
    L.push('', $q.oz, $s.k79 + [...pm.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([m, n]) => '[' + m + '](' + SITE + $q.oA + slug(m) + '.md) ' + n).join(', '),
      $q.oB + SITE + $q.oC, $q.oD + SITE + $q.oE + SITE + $q.oF,
      $q.oG + SITE + $q.oH + SITE + $q.oI + SITE + $q.oJ, $q.oK + SITE + $s.k80 + SITE + $q.oL);
  }
  L.push('', $q.oM, ...[[$q.lH, $q.oN], [$q.lC, $q.oO], [$q.bs, $q.oP], ['/m/', $q.oQ], [$q.hR, $q.hQ], [$q.oR, $q.oS], [$q.oT, $q.oU], [$q.oV, $q.oW], [$q.oX, $q.oY], ['/new/', $q.oZ], [$q.pa, $q.pb], ['/vs/', $q.pc], [$q.pd, $q.pe], [$q.ns, $q.pf], [$q.pg, $q.ph], [$q.aC, $q.pi], ['/map/', $q.pj], [$q.pk, $q.pl], [$q.jN, $q.pm]].map(([p, d]) => '- [' + d + '](' + SITE + p + ')'));
  L.push('', $q.pn, $q.po + SITE + $q.pp, $q.pq + SITE + $q.pr + SITE + $q.ps, $q.pt + SITE + $q.pu, $q.pv + SITE + $q.pw + SITE + $q.px + SITE + $q.py + SITE + $q.oj, $q.pz + SITE + $q.pA + SITE + $q.pB + SITE + $q.pC + SITE + $q.pD + SITE + $q.pE + SITE + $q.pF);
  try { const T = (await import('./kbx_g27.js')).TOP_IDS, ids = Array.isArray(T) ? T : String(T).split(/\s+/), byPid = new Map(np.map(e => [e.id, e])), top = ids.map(i => byPid.get(i)).filter(e => e && e.loc && !/eco\s*beach|equinox|sumba/i.test(String(e.name))).slice(0, 300);
    if (top.length) { L.push('', $q.pG + top.length + ')'); for (const e of top) L.push('- [' + e.name + '](' + e.loc + $q.pH + SITE + $q.pI + String(e.loc).replace(/\/$/, '').split('/').pop() + '.md'); } } catch (e) {}
  if (np.length) {
    L.push('', $q.pJ);
    for (const e of (full ? np : np.slice(0, 400))) { const c = byId.get(e.id); if (e.summary) { L.push('- [' + e.name + '](' + e.loc + '): ' + e.summary + $q.pK + SITE + $q.pI + String(e.loc).replace(/\/$/, '').split('/').pop() + '.md'); continue; } if (c && !reviewed(c)) { L.push('- [' + e.name + '](' + e.loc + '): ' + (c.stage || $q.y) + ' in ' + place(c) + ', ' + c.country + $q.pL); continue; } const lm = c && lateMonths(B, c); L.push('- [' + e.name + '](' + e.loc + ')' + (c ? ': ' + (c.stage || $q.y) + ' in ' + place(c) + ', ' + c.country + (e.developer ? $q.pM + e.developer : '') + '; ' + c.score + $q.pN + (c.vscore || 0) + $q.pO + (c.done ? $q.pP + c.done : '') + (lm && lm.late > 0 ? '; ' + lm.late + $q.pQ : '') + $q.pR + c.checked + '.' : (e.summary ? ': ' + e.summary : ''))); }
    if (!full && np.length > 400) L.push('- ' + (np.length - 400) + $q.pS + SITE + $q.oo + SITE + $q.pT);
    const dv = B.N.developers; if (dv.length) { L.push('', $q.pU); for (const e of dv) L.push('- [' + (e.name || e.loc) + '](' + e.loc + ')' + (e.summary ? ': ' + e.summary : '') + $q.pK + SITE + $q.pV + String(e.loc).replace(/\/$/, '').split('/').pop() + '.md'); }
  } else L.push('', $q.pW, $q.pX + SITE + $q.pY + SITE + $q.pZ);
  const live = st.replace(/covers [\d,]+ off-plan projects in \d+ markets and \d+ countries \([^)]*\), [\d,]+ developer claims tested/, $q.qa + fmt(B.all.length + B.coi.length) + $q.bb + (new Set(B.all.map(c => c.market)).size + (B.coi.length ? 1 : 0)) + $q.qb + list.length + $q.qc + longDate(up) + '), ' + fmt(S.claims) + $q.qd);
  return new Response(live.replace(/\s+$/, '') + '\n' + L.join('\n') + '\n', { headers: { 'content-type': $q.qe, 'cache-control': $q.qf } });
}

const SD_PAGES = ['/', '/es/', '/ar/', '/projects/emaar-golf-vale/', '/fr/projects/emaar-golf-vale/', '/projects/emaar-golf-vale/record/', '/developers/emaar-properties/', '/m/dubai/', '/de/m/dubai/', '/countries/spain/', '/rankings/most-delayed/', '/new/', '/data/', '/data/delays/', '/glossary/', '/engineering/', '/yc/'];
let SDM = null;
async function sdLive() {
  if (SDM && Date.now() - SDM.t < 600000) return SDM.v;
  const one = async p => {
    const o = { p, st: 0, blocks: 0, nodes: 0, types: {}, issues: [] };
    try { const r = await fetch(SITE + p, { headers: { 'user-agent': $q.qg }, redirect: $q.ff, signal: AbortSignal.timeout(8000) }); o.st = r.status; if (r.status !== 200) { o.issues.push('HTTP ' + r.status); try { await r.body.cancel(); } catch (e) {} return o; }
      const h = await r.text(), lang = (/<html[^>]*\blang="([a-zA-Z-]+)"/.exec(h) || [])[1] || '', can = (/<link rel="canonical" href="([^"]+)"/.exec(h) || [])[1] || '';
      const B = [...h.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]); o.blocks = B.length; if (!B.length) o.issues.push($q.qh);
      const walk = (x, top) => { if (Array.isArray(x)) return x.forEach(y => walk(y, top)); if (!x || typeof x !== $q.qi) return;
        if (x['@type']) { o.nodes++; for (const ty of [].concat(x['@type'])) { o.types[ty] = (o.types[ty] || 0) + 1; if (/^(Review|AggregateRating|ClaimReview)$/.test(ty)) o.issues.push(ty + $q.qj); }
          if (x['@type'] === $q.E) { const L = x.itemListElement || []; if (!L.length || L.some((e, i) => +e.position !== i + 1 || !e.name)) o.issues.push($q.qk); }
          if (x.inLanguage && lang && typeof x.inLanguage === $q.ql && x.inLanguage.slice(0, 2).toLowerCase() !== lang.slice(0, 2).toLowerCase()) o.issues.push($q.qm + x.inLanguage + $q.qn + lang + ' page');
          if (top && /Page$/.test([].concat(x['@type'])[0]) && x.url && can && x.url !== can) o.issues.push($q.qo + x.url + $q.qp); }
        else if (top && !x[$q.qq]) o.issues.push($q.qr);
        for (const k in x) if (k !== $q.qs && x[k] && typeof x[k] === $q.qi) walk(x[k], false); };
      for (const b of B) { let j; try { j = JSON.parse(b); } catch (e) { o.issues.push($q.qt); continue; }
        for (const n of [].concat(j)) { if (!/schema\.org/.test(JSON.stringify(n[$q.qs] || ''))) o.issues.push($q.qu); walk(n[$q.qq] || n, true); } }
    } catch (e) { o.issues.push($q.qv); }
    o.issues = [...new Set(o.issues)]; return o;
  };
  const ek = new Request(SITE + '/__kb/sd-live.json'); try { const hit = await caches.default.match(ek); if (hit) { const v = await hit.json(); if (v && v.pages && Date.now() - Date.parse(v.at) < 3600e3) { SDM = { t: Date.parse(v.at), v }; return v; } } } catch (e) {}
  const pages = []; for (let i = 0; i < SD_PAGES.length; i += 4) pages.push(...await Promise.all(SD_PAGES.slice(i, i + 4).map(one)));   // n40 k50: 4 self-requests at a time (17 at once could exceed the isolate's limits)
  const v = { at: new Date().toISOString(), pages }; SDM = { t: Date.now(), v };
  try { await caches.default.put(ek, new Response(JSON.stringify(v), { headers: { 'content-type': 'application/json', 'cache-control': 'max-age=3600' } })); } catch (e) {}
  return v;
}
export async function sdSection() {
  let d; try { d = await sdLive(); } catch (e) { return ''; }
  const ok = d.pages.filter(x => !x.issues.length).length, n = d.pages.reduce((a, x) => a + x.nodes, 0);
  return h2($q.qw, $q.qx) + $q.qy + esc(longDate(d.at.slice(0, 10))) + ' ' + esc(d.at.slice(11, 16)) + $q.qz + ok + ' of ' + d.pages.length + $q.qA + n + $s.k81 +
    tableWrap(['Page', $q.qB, 'Nodes', $q.qC, $q.qD], d.pages.map(x => $q.aR + esc(x.p) + $q.qE + esc(x.p) + $q.qF + x.blocks + $q.aT + x.nodes + $q.aT + esc(Object.entries(x.types).sort((a, b) => b[1] - a[1]).slice(0, 4).map(e => e[0]).join(', ')) + $q.aT + (x.issues.length ? '<b>' + esc(x.issues.join('; ')) + '</b>' : 'pass') + $q.aU));
}
async function pSeo(env, B) {   // n40 k50: sitemap counts and the other modules' sitemap sizes kept 10 minutes per isolate (the page rebuilt them on every view)
  const ck = B.d.updated + '|' + B.N.all.length, cm = MEMO.__seoCnt, audit = await file(env, $q.mk), cnt = cm && cm.k === ck && Date.now() - cm.t < 600000 ? cm.v : (MEMO.__seoCnt = { k: ck, t: Date.now(), v: await sitemaps(env, B, 'stats') }).v, lh = await file(env, $q.qG), inow = await file(env, $q.qH), daily = await file(env, $q.qI);
  const total = Object.values(cnt).reduce((a, b) => a + b, 0);
  let body = $q.he + fmt(total) + $s.k82 + (audit ? $q.qJ + esc(audit.generated_at) + ': ' + fmt(audit.summary.crawled) + $q.qK + (audit.summary.in_sitemaps ? ' of ' + fmt(audit.summary.in_sitemaps) + $q.qL : '') + ', ' + fmt(audit.summary.indexable) + $q.qM + fmt(audit.summary.schema_valid_pages) + $q.qN + (audit.indexable_estimate_all ? $q.qO + fmt(audit.indexable_estimate_all) + $q.qP : '') + '.' : $q.qQ) + $s.k83;
  const extN = await Promise.all(EXT_MAPS.map(async x => { const m = MEMO['__ext' + x]; if (m && m.v) return [x, m.v]; if (!B.inner) return [x, null];
    try { const v = await Promise.race([B.inner(x).then(r => r && r.ok ? r.text() : '').then(t => t ? { n: (t.match(/<url>/g) || []).length, last: null } : null), new Promise(r => setTimeout(() => r(null), 2500))]); if (v) MEMO['__ext' + x] = { t: Date.now(), v }; return [x, v]; } catch (e) { return [x, null]; } }));   // n29t (item 50): the sitemaps other modules publish, with their URL counts when read
  body += h2($q.qR, $q.qS) + tableWrap([$q.qT, 'URLs'], Object.entries(cnt).map(([k, v]) => $q.cW + (v ? $q.qU + k + $q.qV + k + '</a>' : k) + $q.aT + v + $q.aU).concat(extN.map(([x, v]) => $q.aR + x + '">' + x.replace(/^\//, '').replace(/\/sitemap\.xml$/, '') + $q.aS + (v && v.n != null ? v.n : $q.qW) + $q.aU)));
  if (audit) {
    const s = audit.summary;
    body += h2('crawl', $q.qX) + $s.k84 + [[$q.qY, $q.qZ], [$q.ra, $q.rb], [$q.rc, $q.rd], [$q.re, $q.rf], [$q.rg, $q.rh], [$q.ri, $q.rj], [$q.rk, $q.rl], [$q.rm, $q.rn], [$q.ro, $q.rp], [$q.rq, $q.rr], [$q.rs, $q.rt], [$q.ru, $q.rv], [$q.rw, $q.rx]].filter(([k]) => s[k] != null).map(([k, t]) => $q.ry + fmt(s[k]) + $q.bV + t + $q.rz).join('') + $q.O;
    if (audit.coverage) body += $q.rA + tableWrap([$q.qT, $q.rB, $q.rC, $q.rD, $q.rE, $q.rF, $q.rG, $q.rH], Object.entries(audit.coverage).map(([k, c]) => $q.cW + esc(k) + $q.aT + fmt(c.listed) + $q.aT + fmt(c.crawled) + $q.aT + fmt(c.ok_200) + $q.aT + fmt(c.indexable) + $q.aT + fmt(c.canonical_elsewhere) + $q.aT + fmt(c.noindex) + $q.aT + fmt(c.not_200) + $q.aU)) + $s.k85;
    if (audit.internal_links) { const il = audit.internal_links; body += $q.rI + fmt(il.judged) + $q.rJ + fmt(s.orphans || 0) + $q.rK + fmt(s.weakly_linked || 0) + $q.rL + esc(il.method || '') + (il.not_judged && il.not_judged.length ? $q.rM + esc(il.not_judged.join(', ')) + '.' : '') + '</p>' + ((il.orphans || []).length ? $q.rN + fmt(il.orphans.length) + $q.rO + il.orphans.slice(0, 200).map(x => $q.cG + esc(x.replace(SITE, '')) + '">' + esc(x.replace(SITE, '')) + $q.bP).join('') + $q.rP : ''); }
    else body += $s.k86;
    if ((audit.problems || []).length) body += $q.rQ + audit.problems.slice(0, 40).map(p => $q.rR + esc(p.url.replace(SITE, '')) + $q.rS + esc(p.issue) + '</li>').join('') + '</ul>';
    if ((audit.history || []).length) body += $q.rT + tableWrap(['Run', $q.rC, $q.rE, $q.rU, $q.rV], audit.history.slice(-14).reverse().map(h => $q.cW + esc(h.at) + $q.aT + h.crawled + $q.aT + h.indexable + $q.aT + h.schema_valid_pages + $q.aT + h.problems + $q.aU));
  }
  body += h2('daily', $q.rW);
  if (daily && daily.summary) {
    const d = daily.summary;
    body += $q.rX + esc(daily.generated_at) + $q.rY + esc(daily.method || '') + $q.rZ +
      [[d.pages, $q.sa], [d.pages_ok, $q.sb], [d.ld_valid + ' / ' + d.ld_pages, $q.sc], [d.links_checked, $q.sd], [d.broken, $q.se], [d.redirects, $q.sf]].map(([v, l]) => $q.ry + esc(typeof v === $q.sg ? fmt(v) : v) + $q.bV + l + $q.rz).join('') + $q.O;
    const L = (daily.broken || []).map(x => $q.rR + esc(x.url) + $q.rS + esc(x.status) + $q.sh + esc(x.found_on) + $q.si).concat((daily.problems || []).slice(0, 20).map(x => $q.rR + esc(x.url) + $q.rS + esc(x.issue) + '</li>'), (daily.redirects || []).slice(0, 20).map(x => $q.rR + esc(x.url) + $q.rS + esc(x.status) + $q.sj + esc(x.to) + $q.sk + esc(x.found_on) + $q.si));
    body += L.length ? $q.sl + L.slice(0, 60).join('') + '</ul>' : $q.sm;
    if ((daily.history || []).length > 1) body += $q.sn + tableWrap(['Run', 'Pages', $q.so, 'Links', $q.db, $q.sp], daily.history.slice(-14).reverse().map(x => $q.cW + esc(x.at) + $q.aT + x.pages + $q.aT + x.pages_ok + $q.aT + x.links_checked + $q.aT + x.broken + $q.aT + x.redirects + $q.aU));
  } else body += $s.k87;
  if (lh && Array.isArray(lh.runs)) { const rows = lh.runs.filter(r => r.form_factor === $q.sq); const over = rows.filter(r => (r.metrics || {}).lcp_ms >= 2500 || (r.metrics || {}).cls >= 0.1 || (r.metrics || {}).tbt_ms >= 200).length; body += h2('cwv', $q.sr) + $q.ss + (rows.length - over) + ' of ' + rows.length + $s.k88 + esc(String(lh.generated || '').slice(0, 16).replace('T', ' ')) + $q.st + tableWrap(['Page', $q.su, 'LCP', 'CLS', 'TBT', $q.sv], rows.map(r => { const m = r.metrics || {}, ok = m.lcp_ms < 2500 && m.cls < 0.1 && m.tbt_ms < 200; return $q.aR + esc(r.page) + '">' + esc(r.page) + $q.aS + esc((r.scores || {}).performance) + $q.aT + fmt(m.lcp_ms) + $q.sw + m.cls + $q.aT + fmt(m.tbt_ms) + $q.sw + (ok ? $q.sx : 'over') + $q.aU; })); }
  const T = B.T;
  if (T) {
    const ds = [...T.project.values()].sort(), today = new Date().toISOString().slice(0, 10), wk = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    const byDay = new Map(); for (const d of ds) byDay.set(d, (byDay.get(d) || 0) + 1);
    body += h2($q.sy, $q.sz) + $s.k89 + (T.pinned ? $q.sA + esc(String(T.pinned).slice(0, 16).replace('T', ' ')) + ' UTC' : $q.sB) + $s.k90 +
      $q.bU + fmt(ds.length) + $q.sC + fmt(ds.filter(d => d >= wk).length) + $q.sD + fmt(ds.filter(d => d === today).length) + $q.sE +
      tableWrap([$q.sF, $q.sG], [...byDay.entries()].sort((a, b) => a[0] < b[0] ? 1 : -1).slice(0, 10).map(([d, n]) => $q.cW + longDate(d) + $q.aT + fmt(n) + $q.aU));
  }
  body += h2($q.mr, $q.sH) + $q.sI + fmt(cnt.images || 0) + $s.k91;
  body += await sdSection();   // n39 t3
  body += h2($q.sJ, $q.sK) + $s.k92;
  try {
    const il = await file(env, $q.sL), vl = await file(env, $q.sM), pr = await file(env, $q.mm);
    if (il && (il.weeks || []).length) {
      const K = [[$q.sN, $q.sO], [$q.sP, $q.sQ], [$q.sR, $q.sS], [$q.sT, $q.sU], [$q.sV, $q.sW], [$q.sX, $q.sY], [$q.sZ, $q.ta], [$q.tb, '404'], [$q.tc, $q.td], [$q.te, $q.tf]];
      body += h2($q.tg, $q.th) + '<p>' + esc(il.source || '') + $q.ti + tableWrap([$q.tj].concat(K.map(k => k[1])), il.weeks.slice().reverse().map(w => $q.cW + esc(w.date) + '</td>' + K.map(([k]) => '<td>' + (w[k] == null ? '-' : fmt(w[k])) + '</td>').join('') + '</tr>'));
    }
    if (vl && (vl.lists || []).length) body += h2($q.tk, $q.tl) + '<p>' + esc(vl.note || '') + $q.tm + esc(vl.checked || '') + $q.tn + tableWrap(['Fix', 'URLs', $q.to], vl.lists.map(x => $q.cW + esc(x.name) + $q.aT + fmt(x.n != null ? x.n : (x.urls || []).length) + $q.aT + esc(x.now || '') + $q.aU));
    if (pr && (pr.recrawl || []).length) body += h2($q.ms, $q.tp) + $s.k93 + esc(pr.source || '') + $q.tq;
  } catch (e) {}
  body += h2($q.tr, $q.ts) + (inow ? $q.tt + esc(inow.at) + ': ' + fmt(inow.submitted) + $q.tu + esc(inow.status) + $q.tv + fmt(inow.known) + $q.tw : $q.tx) + $q.ty + INDEXNOW_KEY + $q.tz + INDEXNOW_KEY + $s.k94;
  body += h2($q.tA, $q.tB) + $s.k95;
  return render({ path: $q.tC, title: $q.tD, h1: $q.tE, lead: $q.tF, desc: fmt(total) + $s.k96, updated: (audit && audit.generated_at || B.d.updated).slice(0, 10), crumbs: [[$q.af, '/'], [$q.tG, $q.tH], [$q.tE, $q.tC]], body });
}

export async function sitemapStats(env, inner) { const B = await base(env, inner); return sitemaps(env, B, 'stats'); }

export async function handle(req, u, env, ctx, shell, inner) {
  const p = u.pathname;
  if (p === '/' + INDEXNOW_KEY + '.txt') return new Response(INDEXNOW_KEY, { headers: { 'content-type': $q.qe, 'cache-control': $q.tI } });
  if (p === $q.tJ) return lastmodRoute(env);   // batch 15: true lastmod state (published as /data/lastmod.json by the SEO workflow)
  if (/^\/(countries|rankings|vs|new|embed\/(delay|project|widgets)|engineering\/seo|press\/delivery-index)(\/[^?#.]*)?$/.test(p) && !p.endsWith('/')) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } });
  const ckey = req.method === 'GET' && (!u.search || [...u.searchParams.keys()].every(k => /^(utm_[a-z_]+|gclid|gbraid|wbraid|fbclid|msclkid|mc_[a-z]+|igshid|ref|_ga)$/i.test(k) || (k === 'p' && /^\d{1,3}$/.test(u.searchParams.get('p'))))) && env && env.CF_PAGES_COMMIT_SHA && /^\/(countries|rankings|vs|new|press\/delivery-index|embed\/widgets|engineering\/seo)\//.test(p) && typeof caches !== $q.tK ? new Request(SITE + $q.tL + env.CF_PAGES_COMMIT_SHA + p + (u.searchParams.get('p') ? '?p=' + u.searchParams.get('p') : '')) : null;
  if (ckey) { try { const hit = await caches.default.match(ckey); if (hit) { const h = new Headers(hit.headers); h.set($q.tM, 'hit'); h.set($q.aJ, $q.tN); return new Response(hit.body, { status: hit.status, headers: h }); } } catch (e) {} }
  let B; try { B = await base(env, inner); } catch (e) { return new Response($q.tO, { status: 503, headers: { 'retry-after': '60', 'content-type': $q.tP } }); }
  if (p === $q.pT) { B.inner = inner; B.ctx = ctx; return sitemaps(env, B, 'index'); }
  let m = /^\/sitemaps\/([a-z0-9-]+)\.xml$/.exec(p); if (m) return sitemaps(env, B, m[1]);
  if (p === $q.mB || p === $q.mA) return llms(env, B, p === $q.mA);
  if ((m = /^\/press\/delivery-index\/(\d{4}-\d{2})\.csv$/.exec(p))) { const c = diCsv(B, m[1]); return c ? new Response(c, { headers: { 'content-type': $q.tQ, 'content-disposition': $q.tR + m[1] + '.csv"', 'link': $q.tS + m[1] + $q.tT, 'cache-control': $q.tI } }) : new Response($q.mz, { status: 404 }); }
  const nf = async () => { const s = await shell('/404'); return new Response(s.body, { status: 404, headers: { 'content-type': $q.aH } }); };
  if ((m = /^\/embed\/delay\/([a-z0-9-]+)\/$/.exec(p))) { const h = eDelay(B, m[1]); return h ? new Response(h, { headers: EMBED_HDR }) : nf(); }
  if ((m = /^\/embed\/project\/([a-z0-9-]+)\/$/.exec(p))) { const h = eProject(B, m[1]); return h ? new Response(h, { headers: EMBED_HDR }) : nf(); }
  try { const k = B.d.updated + '|' + ((B.T && B.T.pinned) || '') + '|' + B.N.all.length; if (!MEMO.__hlm || MEMO.__hlm.k !== k) MEMO.__hlm = { k, v: new Map((await hubUrls(B)).map(h => [h.loc.replace(SITE, ''), h.lastmod])) }; HLM = MEMO.__hlm.v; } catch (e) { HLM = null; }
  if (!CSS) { const c = await file(env, $q.tU, 864e5); CSS = (c && c.css) || ''; }
  let R = null;
  if (p === $q.bs) R = pCountries(B);
  else if ((m = /^\/countries\/([a-z0-9-]+)\/(?:(how-to-check|is-it-safe|buyer-protection-law|delayed-handover)\/)?$/.exec(p))) {
    const x = findCountry(B, m[1]);
    if (x) { if (!m[2]) R = pCountry(B, x); else if (!x.L.length) R = null; else if (m[2] === $q.tV) R = pCheck(B, x); else if (m[2] === $q.tW) R = x.L.length >= SAFE_MIN ? pSafe(B, x) : null; else if (m[2] === $q.tX) R = lateLaw(B, x.c).length ? pLate(B, x) : null; else R = lawFor(B, x.c).length ? pLaw(B, x) : null; }
  }
  else if (p === $q.hR) R = pRankings(B);
  else if (p === $q.hP) R = pDelayed(B, null);
  else if ((m = /^\/rankings\/most-delayed\/([a-z0-9-]+)\/$/.exec(p))) { const mk = marketsWithDelays(B).find(([x]) => slug(x) === m[1]); R = mk ? pDelayed(B, mk[0]) : null; }
  else if (p === $q.io) R = pChanged(B);
  else if (p === '/new/') R = pNew(B, u);
  else if (p === '/vs/') R = pVs(B, null, u);
  else if ((m = /^\/vs\/([a-z0-9-]+)\/$/.exec(p))) R = pVs(B, m[1]);
  else if (p === $q.lK) R = pWidgets(B);
  else if (p === $q.tC) { B.inner = inner; R = await pSeo(env, B); }
  else if (p === $q.jN) R = pDeliveryIndex(B, null);
  else if ((m = /^\/press\/delivery-index\/(\d{4}-\d{2})\/$/.exec(p))) R = pDeliveryIndex(B, m[1]);
  if (!R) return nf();
  if (R.redirect) return new Response(null, { status: 301, headers: { location: R.redirect } });
  const res = await shellOut(shell, R);
  if (!ckey || res.status !== 200) return res;
  const html = await res.text(), h = new Headers(res.headers); h.set($q.aJ, $q.tY);
  try { const put = caches.default.put(ckey, new Response(html, { status: 200, headers: h })); if (ctx && ctx.waitUntil) ctx.waitUntil(put.catch(() => {})); } catch (e) {}
  const h2 = new Headers(res.headers); h2.set($q.tM, 'miss'); h2.set($q.aJ, $q.tN);
  return new Response(html, { status: 200, headers: h2 });
}
export { sitemaps, countryList, hubUrls };
export async function guideIndex(env, inner) { const B = await base(env, inner); return countryList(B).filter(x => x.L.length).map(x => ({ c: x.c, s: x.s, n: x.L.length, safe: x.L.length >= SAFE_MIN, law: lawFor(B, x.c).length > 0 })); }   // n40 R01-33: the /guides/ hub
export async function sitemapTotal(env, inner) { const B = await base(env, inner); const c = await sitemaps(env, B, 'stats'); return Object.values(c).reduce((a, b) => a + b, 0); }
