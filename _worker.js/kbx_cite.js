// kolaboro.com batch 15 (agent s15c, 7 Nov 2026): assets that earn links and answer-engine citations. No paid AI anywhere here:
// every word is a template, every number comes from our published data files.
//   GET /embed/card/<slug>/[?lang=xx]        fact card of one named project (iframe), attribution link, no scripts
//   GET /embed/tracker/<slug>/[?lang=xx]     delivery tracker: every dated promise, first date on record, moves, months past
//   GET /embed/badge/<slug>.svg              "Tracked by Kolaboro" badge, issued only after a developer reply verified by domain
//   GET /embed/p/<slug>/[?lang=xx]           embed codes and live previews for one project (noindex)
//   GET /[<lang>/]stories/                   monthly market data stories, index
//   GET /[<lang>/]stories/<yyyy-mm>/<market>/   one market, one month: delays, promises, permits, prices vs official data,
//                                            page changes, new projects, project table; Dataset schema; CSV beside it
//   GET /stories/<yyyy-mm>/<market>.csv      the story's figures and project rows
//   GET /stories/sitemap.xml                 every story and change-log URL with true lastmod and hreflang
//   GET /[<lang>/]changes/[<yyyy-mm>/]       public change log: what changed on developer pages this month, projects added
//   GET /changes/feed.atom                   the same as an Atom feed (latest 100)
//   GET /answers/<slug>.md                   canonical answers for one project in Markdown (rel=canonical to the HTML page)
//   GET /llms-projects.txt                   every named project in one plain-text file, one citation-ready block each
// Rules kept: facts only with a source; projects not yet reviewed carry no score and stay out of every figure; Sumba projects are
// never named (they are not in the named index); no Review, AggregateRating or ClaimReview schema.
import * as N from './kbx_named.js';
import { rpc } from './kolaboro.js';
import { S } from './kbx_cite_i18n.js';
import { coName, mkName } from './kbx_hdate.js';
import { ogImg } from './kbx_ogt.js';
import { t as W30 } from './kbx_n30c_named.js';   // n30c: widget v2 builder link   // n29t: share image per page type

const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:stories|changes)(?:\/.*)?$|^\/embed\/(?:card|tracker|badge|p)\/.*$|^\/answers\/[a-z0-9-]{1,90}\.md$|^\/llms-projects\.txt$|^\/(?:es|de|fr|nl|ru|zh|ar)\/llms\.txt$|^\/llms\/[a-z0-9-]{2,60}\.txt$|^\/llms-full\/[a-z0-9-]{2,60}\.txt$/;
const MIN_STORY = 8;   // reviewed named projects a market needs for a monthly story (the delay index itself needs 5)
const esc = N.esc, pre = N.pre;
const t = (lang, k, v) => { const s = (S[lang] && S[lang][k]) || S.en[k] || k; return v ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
const nt = (lang, k, v) => N.tr(lang, k, v);
const num = (n, lang) => { try { return new Intl.NumberFormat(LOC[lang] || 'en-GB').format(n); } catch (e) { return String(n); } };
const slug = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const slugM = m => encodeURIComponent(String(m).toLowerCase().replace(/\s+/g, '-'));
const ymIdx = s => { const m = /^(\d{4})-(\d{2})/.exec(s || ''); return m ? +m[1] * 12 + (+m[2] - 1) : null; };
const dir = lang => lang === 'ar' ? ' dir="rtl"' : '';
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;

// ------------------------------------------------------------------------------------------------ data
const MEMO = {};
async function file(env, name, ttl) {
  const m = MEMO[name]; if (m && Date.now() - m.t < (ttl || 600000)) return m.v;
  let v = null;
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); if (r.ok) v = await r.json(); } catch (e) { v = null; }
  MEMO[name] = { t: Date.now(), v }; return v;
}
let CX = null;
async function load(env) {
  const ix = await N.data(env);
  const [drift, price, real, ontime, prom] = await Promise.all(['promise-drift.json', 'price-index.json', 'price-reality.json', 'on-time.json', 'promises.json'].map(f => file(env, f)));
  if (CX && CX.ix === ix && CX.drift === drift && CX.price === price && CX.ontime === ontime) return CX;
  const rev = x => N.reviewed(ix.caseBy.get(x.id));
  // changes between dated, fingerprinted copies of developer pages: both values known and not flipped back (reviewed projects only)
  const changes = [];
  for (const [id, p] of Object.entries((drift && drift.projects) || {})) {
    const x = ix.byId.get(id); if (!x || !rev(x)) continue;
    for (const c of p.changes || []) if (c.from != null && c.to != null && !c.reverted && N.iso(c.first_seen)) changes.push({ x, c, d: N.iso(c.first_seen) });
  }
  changes.sort((a, b) => b.d.localeCompare(a.d) || a.x.n.localeCompare(b.x.n));
  const added = ix.P.filter(x => N.iso(x.ad)).map(x => ({ x, d: N.iso(x.ad) }));
  const months = [...new Set(changes.map(e => e.d.slice(0, 7)).concat(added.map(e => e.d.slice(0, 7))))].sort().reverse();
  // markets with enough reviewed named projects for a story
  const byMk = new Map(); for (const x of ix.P) { if (!rev(x)) continue; if (!byMk.has(x.mk)) byMk.set(x.mk, []); byMk.get(x.mk).push(x); }
  const markets = [...byMk.entries()].filter(([m, L]) => L.length >= MIN_STORY && String(m).toLowerCase() !== 'sumba').map(([m, L]) => ({ m, s: slug(m), L })).sort((a, b) => b.L.length - a.L.length || a.m.localeCompare(b.m));
  const promMk = new Map((((prom && prom.markets) || [])).map(r => [r.market, r]));
  const priceMk = new Map((((price && price.markets) || [])).map(r => [r.market, r]));
  const realMk = new Map((((real && real.markets) || [])).map(r => [r.market, r]));
  const today = N.iso(ix.updated) || new Date().toISOString().slice(0, 10), cur = today.slice(0, 7);
  const storyMonths = [...new Set([cur].concat(months.filter(m => m >= '2026-11' && m <= cur)))].sort().reverse();
  CX = { ix, drift, price, real, ontime, prom, rev, changes, added, months, markets, promMk, priceMk, realMk, today, cur, storyMonths };
  return CX;
}
function late(X, x) {   // months past the first handover date on record (rules of /data/on-time.json)
  const p = X.ontime && X.ontime.projects && X.ontime.projects[x.id]; if (!p || !p.first) return null;
  const now = ymIdx((X.ontime.as_of_month || '') + '-01'), f = ymIdx(p.first + '-01'); if (now == null || f == null) return null;
  return { late: now - f, first: p.first, cur: p.cur, moved: p.moved || 0 };
}
const pageOf = x => N.okHttp(x.url) ? N.fixU(x.url) : null;
const pUrl = (lang, x) => ORIGIN + pre(lang) + '/projects/' + x.s + '/';
const isPermit = c => (c.checks || {}).permit === 2;
const isEscrow = c => (c.checks || {}).escrow === true;
const fval = (lang, f, v, c) => {   // a value from promise-drift, in words
  if (f === 'price_from' && c && c.pct != null) return v === c.to ? (c.pct > 0 ? '+' : '') + num(c.pct, lang) + '%' : t(lang, 'f_price_from');
  if (v === true) return nt(lang, 'yes'); if (v === false) return nt(lang, 'no'); if (v == null) return t(lang, 'notstated');
  return typeof v === 'number' ? (f === 'completion_year' ? String(v) : num(v, lang)) : '<span lang="en">' + esc(v) + '</span>';
};

// ------------------------------------------------------------------------------------------------ embeds (standalone HTML, no scripts)
const ECSS = '<style>:root{--i:#13222E;--m:#56636F;--l:#D9DFDC;--p:#fff;--s:#155C75;--sk:#E8ECEA}@media(prefers-color-scheme:dark){:root{--i:#EEF2F0;--m:#A9B4BD;--l:#33404C;--p:#13222E;--s:#7FC3DA;--sk:#1C2C38}}' +
  'html,body{margin:0;background:var(--p);color:var(--i);font:15px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}.w{padding:14px 16px;border:1px solid var(--l);border-radius:12px;max-width:640px;box-sizing:border-box}' +
  '.h{font-weight:700;font-size:17px;margin:0 0 2px}.s{color:var(--m);font-size:13px;margin:0 0 10px}dl{margin:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:6px 12px}dt{color:var(--m);font-size:13px}dd{margin:0;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
  'ol{margin:6px 0 0;padding-inline-start:18px}li{margin:3px 0}.f{color:var(--m);font-size:12px;margin:10px 0 0;border-top:1px solid var(--l);padding-top:8px}a{color:var(--s)}code{font-size:11px;overflow-wrap:anywhere}.k{display:inline-block;background:var(--sk);border-radius:6px;padding:1px 7px;font-size:13px}' +
  '@media(max-width:420px){dl{grid-template-columns:1fr}dt{margin-top:4px}}</style>';
function embedPage(lang, title, inner, canon) {
  // served as XHTML: Cloudflare's zone tag injection (analytics) only rewrites text/html, so the widgets stay free of tracking code
  return '<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" lang="' + lang + '" xml:lang="' + lang + '"' + dir(lang) + '><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="robots" content="noindex, follow"/><link rel="canonical" href="' + canon + '"/><title>' + esc(title) + '</title>' + ECSS + '</head><body><div class="w">' + inner + '</div></body></html>';
}
const langOf = u => { const l = u.searchParams.get('lang'); return LANGS.includes(l) ? l : 'en'; };
function head(X, x, lang) {
  const c = X.ix.caseBy.get(x.id) || {};
  return '<p class="h">' + esc(x.n) + '</p><p class="s">' + esc([x.ar && x.ar !== x.mk ? x.ar : null, x.mk, x.co].filter(Boolean).join(', ').split(', ').filter((v, i, a) => a.findIndex(w => w.toLowerCase() === v.toLowerCase()) === i).join(', ')) + (c.stage ? ' · ' + esc(nt(lang, c.stage === 'off-plan' ? 'st_offplan' : c.stage === 'under construction' ? 'st_construction' : c.stage === 'completed' ? 'st_completed' : 'st_unknown')) : '') + '</p>';
}
const foot = (X, x, lang) => '<p class="f">' + esc(t(lang, 'checked', { d: N.fd(N.lastmod(X.ix, x), lang) })) + '. <a href="' + pUrl(lang, x) + '" target="_blank" rel="noopener">' + esc(t(lang, 'open')) + '</a>. ' + esc(t(lang, 'cite')) + '</p>';
function eCard(X, x, lang) {
  const c = X.ix.caseBy.get(x.id) || {}, canon = ORIGIN + '/embed/card/' + x.s + '/';
  if (!X.rev(x)) return embedPage(lang, x.n, head(X, x, lang) + '<p>' + esc(t(lang, 'nr')) + '</p>' + foot(X, x, lang), canon);
  const ho = N.handoverOf(X.ix, x), sha = x.sha || (c.fp || {}).sha256, sd = x.sealed || (c.fp || {}).date, lm = late(X, x);
  const rows = [[t(lang, 'dev'), x.dv ? esc(x.dv) : esc(t(lang, 'notpub'))],
    [t(lang, 'hand'), ho ? esc(N.fd(ho.d, lang)) + (lm && lm.late > 0 ? ' <span class="k">' + esc(t(lang, 't_past', { m: lm.late })) + '</span>' : '') : esc(t(lang, 'notpub'))],
    [t(lang, 'permit'), x.pn ? '<code>' + esc(x.pn) + '</code>' : isPermit(c) ? esc(t(lang, 'stated')) : esc(t(lang, 'notpub'))],
    [nt(lang, 'c_escrow'), esc(isEscrow(c) ? t(lang, 'stated') : t(lang, 'notstated'))],
    [nt(lang, 's_checks'), esc(t(lang, 'checks', { s: c.score || 0, v: c.vscore || 0 }))]];
  if (sha && sd) rows.push([t(lang, 'sealed', { d: N.fd(sd, lang) }), '<code>sha256:' + esc(String(sha).slice(0, 16)) + '...</code>']);
  return embedPage(lang, x.n, head(X, x, lang) + '<dl>' + rows.map(r => '<dt>' + esc(r[0]) + '</dt><dd>' + r[1] + '</dd>').join('') + '</dl>' + foot(X, x, lang), canon);
}
function eTracker(X, x, lang) {
  const canon = ORIGIN + '/embed/tracker/' + x.s + '/';
  if (!X.rev(x)) return embedPage(lang, x.n, head(X, x, lang) + '<p>' + esc(t(lang, 'nr')) + '</p>' + foot(X, x, lang), canon);
  const P = X.ix.prom[x.id] || [], lm = late(X, x);
  let body = '<p class="h">' + esc(t(lang, 't_h')) + ': ' + esc(x.n) + '</p><p class="s">' + esc([x.mk, x.co].filter(Boolean).join(', ')) + '</p>';
  if (!P.length) body += '<p>' + esc(nt(lang, 'no_promises')) + '</p>';
  for (const q of P.slice(0, 4)) {
    const H = (q.hist || []).slice().sort((a, b) => String(a.seen).localeCompare(String(b.seen)));
    const first = (H[0] && H[0].d) || q.d;
    body += '<dl><dt>' + esc(nt(lang, 'pk_' + q.k)) + '</dt><dd><b>' + esc(N.fd(q.d, lang)) + '</b> <span class="k">' + esc(nt(lang, 'ps_' + q.st)) + '</span></dd>' +
      '<dt>' + esc(t(lang, 't_first')) + '</dt><dd>' + esc(N.fd(first, lang)) + (q.k === 'handover' && lm ? ' (' + esc(lm.late > 0 ? t(lang, 't_past', { m: lm.late }) : t(lang, 't_notyet')) + ')' : '') + '</dd>' +
      '<dt>' + esc(t(lang, 't_moves')) + '</dt><dd>' + esc(q.mv ? t(lang, 't_moved', { k: q.mv, mm: q.mm || 0 }) : t(lang, 't_never')) + '</dd></dl>';
    if (H.length > 1) body += '<p class="s" style="margin:6px 0 0">' + esc(t(lang, 't_hist')) + ':</p><ol>' + H.slice(0, 6).map(h => '<li>' + esc(N.fd(h.d, lang)) + ' <span class="s">(' + esc(nt(lang, 'pr_seen', { d: N.fd(h.seen, lang) })) + ')</span></li>').join('') + '</ol>';
  }
  return embedPage(lang, t(lang, 't_h') + ': ' + x.n, body + foot(X, x, lang), canon);
}
async function verifiedReply(x, ctx) {
  const k = new Request(ORIGIN + '/__cite_badge/v1/' + x.id);
  try { const hit = await caches.default.match(k); if (hit) return await hit.json(); } catch (e) {}
  let v = null;
  try { const L = (await rpc('kolaboro_devreply_public', { p_id: x.id })) || []; const r = L.find(r => r && r.reply && r.official && r.domain); v = r ? { domain: r.domain, approved: r.approved || null } : null; } catch (e) { return { err: true }; }
  const p = caches.default.put(k, new Response(JSON.stringify(v), { headers: { 'cache-control': 'max-age=900', 'content-type': 'application/json' } })); if (ctx && ctx.waitUntil) ctx.waitUntil(p.catch(() => {}));
  return v;
}
const xe = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
function badgeSvg(left, right, col) {
  const w1 = Math.round(14 + left.length * 6.6), w2 = Math.round(12 + right.length * 6.3), W = w1 + w2;
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="22" role="img" aria-label="' + xe(left + ': ' + right) + '"><title>' + xe(left + ': ' + right) + '</title><rect width="' + W + '" height="22" rx="4" fill="#13222E"/><rect x="' + w1 + '" width="' + w2 + '" height="22" rx="4" fill="' + col + '"/><rect x="' + w1 + '" width="6" height="22" fill="' + col + '"/>' +
    '<g fill="#fff" font-family="Verdana,DejaVu Sans,sans-serif" font-size="11"><circle cx="9" cy="11" r="3" fill="#FF5B14"/><text x="16" y="15">' + xe(left) + '</text><text x="' + (w1 + 7) + '" y="15">' + xe(right) + '</text></g></svg>';
}
function codesPage(X, x, lang, vr) {
  const q = lang === 'en' ? '' : '?lang=' + lang, card = ORIGIN + '/embed/card/' + x.s + '/' + q, trk = ORIGIN + '/embed/tracker/' + x.s + '/' + q, bdg = ORIGIN + '/embed/badge/' + x.s + '.svg';
  const ifr = (src, h, ti) => '<iframe src="' + src + '" title="' + esc(ti) + '" width="100%" height="' + h + '" style="border:0;max-width:640px" loading="lazy"></iframe>';
  const code = s => '<pre style="white-space:pre-wrap;overflow-wrap:anywhere;background:var(--sk);border-radius:8px;padding:8px 10px;font-size:12px;margin:6px 0 14px"><code>' + esc(s) + '</code></pre>';
  const rv = X.rev(x);
  // n27a (batch 27): every embed code carries a plain link to the project page beside the iframe, so the host page links back (a link inside an iframe counts for the frame only)
  const back = '\n<p><a href="' + pUrl(lang, x) + '">' + esc(x.n + ': ' + t(lang, 'open')) + '</a></p>';
  let b = '<p class="h">' + esc(t(lang, 'e_title', { n: x.n })) + '</p><p>' + esc(t(lang, 'e_lead')) + '</p>';
  b += '<p class="h" style="margin-top:14px">' + esc(t(lang, 'e_card')) + '</p>' + ifr(card, rv ? 470 : 190, x.n) + '<p class="s">' + esc(t(lang, 'e_code')) + '</p>' + code(ifr(card, rv ? 470 : 190, 'Kolaboro: ' + x.n) + back);
  b += '<p class="h">' + esc(t(lang, 'e_tracker')) + '</p>' + ifr(trk, rv ? 380 : 190, x.n) + '<p class="s">' + esc(t(lang, 'e_code')) + '</p>' + code(ifr(trk, rv ? 380 : 190, 'Kolaboro: ' + x.n) + back);
  b += '<p class="h">' + esc(t(lang, 'e_badge')) + '</p><p>' + esc(t(lang, 'e_badge_txt')) + '</p>' + (vr && vr.domain ? '<p>' + esc(t(lang, 'e_badge_yes', { d: vr.domain })) + '</p><p><img src="' + bdg + '" alt="Tracked by Kolaboro"/></p>' + code('<a href="' + pUrl('en', x) + '"><img src="' + bdg + '" alt="Tracked by Kolaboro" height="22"></a>')
    : '<p>' + esc(t(lang, 'e_badge_no')) + ' <a href="' + ORIGIN + '/developers/reply/?id=' + encodeURIComponent(x.id) + '" target="_top">' + esc(t(lang, 'e_reply')) + '</a></p>');
  b += '<p class="h"><a href="' + ORIGIN + pre(lang) + '/tools/widget/?p=' + x.s + '" target="_top">' + esc(W30(lang, 'w_t')) + '</a></p><p>' + esc(W30(lang, 'w_d')) + '</p>';   // n30c (item 19): widget v2
  b += '<p class="f">' + esc(t(lang, 'e_lang')) + ' ' + esc(t(lang, 'e_lic')) + ' <a href="' + pUrl(lang, x) + '" target="_top">' + esc(t(lang, 'open')) + '</a></p>';
  return embedPage(lang, t(lang, 'e_title', { n: x.n }), b, ORIGIN + '/embed/p/' + x.s + '/');
}

// ------------------------------------------------------------------------------------------------ pages in the site shell
const PCSS = '<style>.cx .k-ledger{margin:10px 0 18px}.cx h2{scroll-margin-top:90px}.cx .cx-l{padding-inline-start:20px}.cx .cx-l li{margin:6px 0}.cx .cx-src{font-size:.88rem;color:var(--k-muted,var(--muted))}.cx .cx-q{border-inline-start:3px solid var(--k-line-2,var(--line));padding:6px 0 6px 14px;margin:10px 0}' +
  '.cx .cx-chips{display:flex;flex-wrap:wrap;gap:8px;list-style:none;padding:0;margin:10px 0 20px}.cx .cx-chips a{display:inline-flex;align-items:center;min-height:44px;padding:0 14px;border:1px solid var(--k-line,var(--line));border-radius:var(--k-r-md,10px);background:var(--k-surface,var(--paper));text-decoration:none}' +
  '.cx code{overflow-wrap:anywhere}.cx .cx-ch li{margin:8px 0;line-height:1.5}.cx .cx-ch small{color:var(--k-muted,var(--muted))}</style>';
async function shellPage(shell, lang, o) {
  const path = o.path, canon = ORIGIN + pre(lang) + path;
  const alts = o.langs === false ? '' : LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + path + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + path + '">';
  const crumbs = o.crumbs.map(([n, p]) => [n, ORIGIN + pre(lang) + p]);
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': o.type || 'WebPage', '@id': canon + '#page', url: canon, name: o.h1, description: o.desc, inLanguage: lang, dateModified: o.updated, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' }, publisher: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] })) }].concat(o.ld || []) };
  const tags = '<title>' + esc(o.title) + ([...String(o.title)].length + 11 <= 60 ? ' | Kolaboro' : '') + '</title><meta name="description" content="' + esc(o.desc) + '"><link rel="canonical" href="' + canon + '">' + alts +
    '<meta name="robots" content="' + (o.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1') + '"><meta property="og:type" content="website"><meta property="og:site_name" content="Kolaboro"><meta property="og:title" content="' + esc(o.title) + '"><meta property="og:description" content="' + esc(o.desc) + '"><meta property="og:url" content="' + canon + '"><meta property="og:image" content="' + ogImg(canon) + '"><meta name="twitter:card" content="summary_large_image">' +
    (o.feed ? '<link rel="alternate" type="application/atom+xml" title="' + esc(o.feed[1]) + '" href="' + o.feed[0] + '">' : '') +
    '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' + PCSS;
  const main = '<section class="phero"><div class="wrap"><p class="crumb">' + crumbs.map((c, i) => i < crumbs.length - 1 ? '<a href="' + esc(c[1].replace(ORIGIN, '')) + '">' + esc(c[0]) + '</a>' : esc(c[0])).join(' / ') + '</p><h1>' + esc(o.h1) + '</h1>' + (o.lead ? '<p class="lead">' + esc(o.lead) + '</p>' : '') + '</div></section><section class="sec cx"><div class="wrap k-prose" style="max-width:var(--wrap)">' + o.body + '</div></section>';
  const sh = await shell(pre(lang) + '/how-we-score/');
  const res = new HTMLRewriter()
    .on('title', { element(e) { e.remove(); } })
    .on('meta[name="description"],meta[name="robots"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],link[rel="alternate"][hreflang]', { element(e) { e.remove(); } })
    .on('script[type="application/ld+json"]', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(main, { html: true }); } })
    .on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + path); } })
    .transform(new Response(sh.body, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
  return new Response(await res.text(), { status: o.status || 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=900', 'last-modified': new Date((o.updated || '2026-11-01') + 'T12:00:00Z').toUTCString() } });
}
const h2 = (id, s) => '<h2 id="' + id + '">' + esc(s) + '</h2>';
const src = (href, label) => ' <a class="k-src" href="' + esc(href) + '"' + (/^https?:/.test(href) && !href.startsWith(ORIGIN) ? ' rel="noopener nofollow"' : '') + '>' + esc(label) + '</a>';

// ---------- monthly market data stories
function story(X, mkt, month, lang) {
  const { m, L } = mkt, cur = month === X.cur, mo = N.fd(month, lang), path = '/stories/' + month + '/' + mkt.s + '/';
  const delayRow = cur ? X.ix.dmk.get(m) : null;
  let b = '<p class="k-muted">' + esc(t(lang, 'st_asof', { d: N.fd(X.today, lang) })) + (cur ? '' : ' ' + esc(t(lang, 'st_past'))) + '</p>';
  const csvRows = [];
  // delays
  b += h2('delays', t(lang, 'st_delay_h'));
  if (delayRow && delayRow.with_date >= 5 && delayRow.share_past_first != null) {
    b += '<p>' + esc(t(lang, 'st_delay', { w: delayRow.with_date, mk: m, p: delayRow.past_first, s: num(delayRow.share_past_first, lang), m: delayRow.median_late == null ? '0' : num(delayRow.median_late, lang) })) + src('/data/delay-index.json', '/data/delay-index.json') + '</p>';
    csvRows.push(['projects_with_handover_date', delayRow.with_date, 'projects', '/data/delay-index.json'], ['past_first_handover_date', delayRow.past_first, 'projects', '/data/delay-index.json'], ['share_past_first_handover_date', delayRow.share_past_first, 'percent', '/data/delay-index.json'], ['median_months_past_first_date', delayRow.median_late, 'months', '/data/delay-index.json']);
  } else b += '<p class="k-muted">' + esc(t(lang, 'st_delay_none', { mk: m })) + '</p>';
  // dated promises and permits: snapshots, current month only
  if (cur) {
    const pr = X.promMk.get(m);
    if (pr && pr.promises) { b += h2('promises', t(lang, 'st_prom_h')) + '<p>' + esc(t(lang, 'st_prom', { n: pr.promises, k: pr.kept, b: pr.broken, mv: pr.moved, pd: pr.pending, u: pr.unknown })) + src('/promises/', '/data/promises.json') + '</p>';
      csvRows.push(['dated_promises', pr.promises, 'promises', '/data/promises.json'], ['promises_kept', pr.kept, 'promises', '/data/promises.json'], ['promises_date_passed_not_done', pr.broken, 'promises', '/data/promises.json'], ['promises_moved_later', pr.moved, 'promises', '/data/promises.json'], ['promises_pending', pr.pending, 'promises', '/data/promises.json']); }
    const cs = L.map(x => X.ix.caseBy.get(x.id) || {}), pn = cs.filter(isPermit).length, es = cs.filter(isEscrow).length;
    b += h2('permits', t(lang, 'st_perm_h')) + '<p>' + esc(t(lang, 'st_perm', { p: pn, n: L.length, pp: pct(pn, L.length), e: es, pe: pct(es, L.length) })) + src('/data/bali-cases.json', '/data/bali-cases.json') + '</p>';
    csvRows.push(['reviewed_projects', L.length, 'projects', '/data/bali-cases.json'], ['permit_number_published', pn, 'projects', '/data/bali-cases.json'], ['deposit_protection_stated', es, 'projects', '/data/bali-cases.json']);
  }
  // prices: chained index points within the month, and the official comparison where we hold registered sales
  b += h2('prices', t(lang, 'st_price_h'));
  const pi = X.priceMk.get(m), pts = pi ? (pi.index || []).filter(p => p.date && p.index != null) : [];
  const inM = pts.filter(p => p.date.slice(0, 7) === month), before = pts.filter(p => p.date.slice(0, 7) < month);
  const a = before.length ? before[before.length - 1] : inM[0], z = inM[inM.length - 1];
  if (pi && a && z && a !== z && (pi.pairs_total || 0) >= 20) {
    b += '<p>' + esc(t(lang, 'st_price', { d0: N.fd(pts[0].date, lang), a: num(a.index, lang), d1: N.fd(a.date, lang), b: num(z.index, lang), d2: N.fd(z.date, lang), k: num(pi.pairs_total, lang) })) + src('/data/price-index.json', '/data/price-index.json') + '</p>';
    csvRows.push(['advertised_price_index_start', a.index, 'index (' + pts[0].date + ' = 100) on ' + a.date, '/data/price-index.json'], ['advertised_price_index_end', z.index, 'index on ' + z.date, '/data/price-index.json']);
  } else b += '<p class="k-muted">' + esc(t(lang, 'st_price_none', { mk: m })) + '</p>';
  const rl = X.realMk.get(m);
  if (rl && rl.comparison && rl.comparison.pct != null && rl.official && rl.advertised) {
    const o = rl.official, per = o.period || [];
    b += '<p>' + esc(t(lang, 'st_off', { k: rl.advertised.n_known, pct: num(Math.abs(Math.round(rl.comparison.pct)), lang), dir: t(lang, rl.comparison.pct >= 0 ? 'above' : 'below'), n: num(o.n, lang), p1: N.fd(per[0], lang), p2: N.fd(per[1], lang) })) + src(o.url, o.source) + src('/data/price-reality.json', '/data/price-reality.json') + '</p>';
    csvRows.push(['advertised_vs_registered_median_pct', rl.comparison.pct, 'percent', o.url], ['registered_sales_used', o.n, 'sales ' + (per[0] || '') + ' to ' + (per[1] || ''), o.url]);
  }
  // page changes and new projects in this month
  const ch = X.changes.filter(e => e.x.mk === m && e.d.slice(0, 7) === month), chp = new Set(ch.map(e => e.x.id));
  b += h2('changes', t(lang, 'st_chg_h')) + '<p>' + esc(ch.length ? t(lang, 'st_chg', { n: ch.length, mk: m, k: chp.size }) : t(lang, 'st_chg_none', { mk: m })) + src('/data/promise-drift.json', '/data/promise-drift.json') + '</p>';
  if (ch.length) b += '<ul class="cx-l cx-ch">' + ch.slice(0, 12).map(e => changeLi(e, lang)).join('') + '</ul>' + (ch.length > 12 ? '<p><a href="' + pre(lang) + '/changes/' + month + '/#m-' + mkt.s + '">' + esc(t(lang, 'l_changes')) + ' (' + ch.length + ')</a></p>' : '');
  csvRows.push(['page_changes_this_month', ch.length, 'changes', '/data/promise-drift.json']);
  const ad = X.added.filter(e => e.x.mk === m && e.d.slice(0, 7) === month);
  b += h2('new', t(lang, 'st_new_h')) + (ad.length ? '<ul class="cx-l">' + ad.map(e => '<li><a href="' + pre(lang) + '/projects/' + e.x.s + '/">' + esc(e.x.n) + '</a> <small class="k-muted">' + esc(N.fd(e.d, lang)) + '</small></li>').join('') + '</ul>' : '<p class="k-muted">' + esc(t(lang, 'st_new_none', { mk: m })) + '</p>');
  csvRows.push(['projects_added_this_month', ad.length, 'projects', '/data/named.json']);
  // project table (current month)
  const proj = [];
  if (cur) {
    const rows = L.slice().sort((p, q) => p.n.localeCompare(q.n)).map(x => {
      const c = X.ix.caseBy.get(x.id) || {}, ho = N.handoverOf(X.ix, x), lm = late(X, x);
      proj.push([x.id, x.n, ho ? ho.d : '', lm ? Math.max(0, lm.late) : '', isPermit(c) ? 'yes' : 'no', isEscrow(c) ? 'yes' : 'no', c.score || 0, c.vscore || 0, N.lastmod(X.ix, x), pUrl('en', x)]);
      return '<tr><td data-label="' + esc(t(lang, 'th_proj')) + '"><a href="' + pre(lang) + '/projects/' + x.s + '/">' + esc(x.n) + '</a></td><td data-label="' + esc(t(lang, 'th_hand')) + '">' + esc(ho ? N.fd(ho.d, lang) : t(lang, 'notpub')) + '</td><td class="k-n" data-label="' + esc(t(lang, 'th_late')) + '">' + (lm && lm.late > 0 ? lm.late : '0') + '</td><td data-label="' + esc(t(lang, 'th_pn')) + '">' + esc(isPermit(c) ? t(lang, 'stated') : t(lang, 'notpub')) + '</td><td class="k-n" data-label="' + esc(t(lang, 'th_chk')) + '">' + (c.score || 0) + '/6</td><td data-label="' + esc(t(lang, 'th_last')) + '">' + esc(N.fd(N.lastmod(X.ix, x), lang)) + '</td></tr>';
    });
    b += h2('projects', t(lang, 'st_tab_h', { mk: m })) + '<div class="k-table-wrap"><table class="k-table k-table--dense k-table--stack"><thead><tr><th scope="col">' + [t(lang, 'th_proj'), t(lang, 'th_hand'), t(lang, 'th_late'), t(lang, 'th_pn'), t(lang, 'th_chk'), t(lang, 'th_last')].map(esc).join('</th><th scope="col">') + '</th></tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
  }
  const url = ORIGIN + pre(lang) + path, cite = t(lang, 'st_cite', { mk: m, mo, url, d: N.fd(X.today, lang) });
  b += h2('cite', t(lang, 'cite_h')) + '<p class="cx-q">' + esc(cite).replace(esc(url), '<bdi><a href="' + esc(url) + '">' + esc(url) + '</a></bdi>' + (lang === 'zh' || lang === 'ar' ? ' ' : '')) + '</p><p><a class="k-btn" href="/stories/' + month + '/' + mkt.s + '.csv" download>' + esc(t(lang, 'dl')) + '</a></p>';
  b += h2('more', t(lang, 'more_h')) + '<ul class="cx-l"><li><a href="/m/' + slugM(m) + '/">' + esc(t(lang, 'l_market')) + ': ' + esc(m) + '</a></li><li><a href="/index/delays/">' + esc(t(lang, 'l_delay')) + '</a></li><li><a href="' + pre(lang) + '/changes/' + month + '/">' + esc(t(lang, 'l_changes')) + '</a></li><li><a href="' + pre(lang) + '/stories/">' + esc(t(lang, 'l_all')) + '</a></li></ul>';
  const title = t(lang, 'st_title', { mk: m, mo });
  const ds = { '@type': 'Dataset', '@id': url + '#dataset', name: 'Kolaboro: ' + t(lang, 'st_h1', { mk: m, mo }), description: t(lang, 'st_lead', { k: L.length, mk: m }), url,   // n25t: in the page language
    license: 'https://creativecommons.org/licenses/by/4.0/', isAccessibleForFree: true,
    creator: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, temporalCoverage: month, dateModified: X.today, spatialCoverage: { '@type': 'Place', name: m + ', ' + (L[0].co || '') },
    variableMeasured: ['projects past the first handover date on record', 'dated promises by status', 'permit or licence number published', 'deposit protection stated', 'advertised price index', 'changes between dated copies of developer pages'],
    distribution: [{ '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: ORIGIN + '/stories/' + month + '/' + mkt.s + '.csv' }, { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/data/delay-index.json' }], citation: t('en', 'st_cite', { mk: m, mo: N.fd(month, 'en'), url: ORIGIN + path, d: N.fd(X.today, 'en') }) };
  return { path, title, h1: t(lang, 'st_h1', { mk: m, mo }), lead: t(lang, 'st_lead', { k: L.length, mk: m }), desc: title + '. ' + t(lang, 'st_lead', { k: L.length, mk: m }), body: b, updated: X.today, ld: [ds], csvRows, proj,
    crumbs: [['Kolaboro', '/'], [t(lang, 'crumb_stories'), '/stories/'], [m + ', ' + mo, path]] };
}
const csvCell = v => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
function storyCsv(X, mkt, month) {
  const s = story(X, mkt, month, 'en');
  const L = ['# Kolaboro off-plan data, ' + mkt.m + ', ' + month + '. Data of ' + X.today + '. CC BY 4.0, attribute "Kolaboro" and link ' + ORIGIN + s.path, 'metric,value,unit,source'];
  for (const r of s.csvRows) L.push(r.map((v, i) => csvCell(i === 3 && String(v).startsWith('/') ? ORIGIN + v : v)).join(','));
  if (s.proj.length) { L.push('', 'id,project,handover_on_record,months_past_first_date,permit_number_published,deposit_protection_stated,checks_public_of_6,checks_confirmed_of_6,last_checked,page'); for (const r of s.proj) L.push(r.map(csvCell).join(',')); }
  return L.join('\n') + '\n';
}
function storiesIndex(X, lang) {
  let b = '';
  for (const month of X.storyMonths) b += h2('m-' + month, N.fd(month, lang)) + '<ul class="cx-chips">' + X.markets.map(k => '<li><a href="' + pre(lang) + '/stories/' + month + '/' + k.s + '/">' + esc(k.m) + ' <small class="k-muted">&nbsp;' + k.L.length + '</small></a></li>').join('') + '</ul>';
  b += '<p class="cx-src"><a href="/press/delivery-index/">Off-plan Delivery Index</a> · <a href="' + pre(lang) + '/changes/">' + esc(t(lang, 'l_changes')) + '</a> · <a href="/embed/widgets/">Widgets</a></p>';
  return { path: '/stories/', title: t(lang, 'idx_title'), h1: t(lang, 'idx_h1'), lead: t(lang, 'idx_lead', { k: MIN_STORY }), desc: t(lang, 'idx_lead', { k: MIN_STORY }), body: b, updated: X.today, type: 'CollectionPage', crumbs: [['Kolaboro', '/'], [t(lang, 'crumb_stories'), '/stories/']] };
}

// ---------- public change log
function changeLi(e, lang) {
  const c = e.c, x = e.x, f = t(lang, 'f_' + c.f) === 'f_' + c.f ? c.label : t(lang, 'f_' + c.f);
  const line = c.f === 'price_from' && c.pct != null ? f + ': ' + (c.pct > 0 ? '+' : '') + num(c.pct, lang) + '%' : null;
  const txt = line ? esc(line) : esc(t(lang, 'ch_line', { f, a: '\u0001', b: '\u0002' })).replace('\u0001', fval(lang, c.f, c.from, c)).replace('\u0002', fval(lang, c.f, c.to, c));
  return '<li><a href="' + pre(lang) + '/projects/' + x.s + '/">' + esc(x.n) + '</a>: ' + txt + ' <small>' + esc(t(lang, 'ch_seen', { d: N.fd(e.d, lang) })) + ' · <code>' + esc(c.sha_from || '') + '</code> → <code>' + esc(c.sha_to || '') + '</code> · <a href="/projects/' + x.s + '/changes/">' + esc(t(lang, 'ch_copies')) + '</a></small></li>';
}
function changesPage(X, month, lang) {
  const mo = N.fd(month, lang), path = '/changes/' + month + '/';
  const ch = X.changes.filter(e => e.d.slice(0, 7) === month), ad = X.added.filter(e => e.d.slice(0, 7) === month);
  let b = '<div class="k-alert" role="note"><span>' + esc(t(lang, 'ch_note')) + src('/data/promise-drift.json', '/data/promise-drift.json') + '</span></div>';
  b += '<p><b>' + esc(t(lang, 'ch_n', { n: ch.length, k: new Set(ch.map(e => e.x.id)).size, a: ad.length })) + '</b> <a href="/changes/feed.atom">' + esc(t(lang, 'ch_feed')) + '</a></p>';
  const mk = [...new Set(ch.map(e => e.x.mk))].sort((a, b2) => ch.filter(e => e.x.mk === b2).length - ch.filter(e => e.x.mk === a).length || a.localeCompare(b2));
  if (mk.length) b += '<p class="k-muted">' + esc(t(lang, 'ch_by')) + ':</p><ul class="cx-chips">' + mk.map(m => '<li><a href="#m-' + slug(m) + '">' + esc(m) + ' <small class="k-muted">&nbsp;' + ch.filter(e => e.x.mk === m).length + '</small></a></li>').join('') + '</ul>';
  else b += '<p class="k-muted">' + esc(t(lang, 'ch_none')) + '</p>';
  for (const m of mk) b += h2('m-' + slug(m), m) + '<ul class="cx-l cx-ch">' + ch.filter(e => e.x.mk === m).map(e => changeLi(e, lang)).join('') + '</ul>';
  if (ad.length) b += h2('added', t(lang, 'ch_added_h')) + '<ul class="cx-l">' + ad.slice().sort((p, q) => p.x.mk.localeCompare(q.x.mk) || p.x.n.localeCompare(q.x.n)).map(e => '<li><a href="' + pre(lang) + '/projects/' + e.x.s + '/">' + esc(e.x.n) + '</a> <small class="k-muted">' + esc(e.x.mk) + ', ' + esc(N.fd(e.d, lang)) + '</small></li>').join('') + '</ul>';
  const others = X.months.filter(m => m !== month);
  if (others.length) b += h2('months', t(lang, 'ch_months')) + '<ul class="cx-chips">' + others.map(m => '<li><a href="' + pre(lang) + '/changes/' + m + '/">' + esc(N.fd(m, lang)) + '</a></li>').join('') + '</ul>';
  const up = [ch[0] && ch[0].d, ad.map(e => e.d).sort().pop()].filter(Boolean).sort().pop() || X.today;
  return { path, title: t(lang, 'ch_title', { mo }), h1: t(lang, 'ch_h1', { mo }), lead: t(lang, 'ch_lead', { mo }), desc: t(lang, 'ch_lead', { mo }), body: b, updated: up, type: 'CollectionPage', feed: [ORIGIN + '/changes/feed.atom', 'Kolaboro: what changed'],
    crumbs: [['Kolaboro', '/'], [t(lang, 'crumb_changes'), '/changes/'], [mo, path]] };
}
function changesAtom(X) {
  const E = X.changes.slice(0, 100), upd = (E[0] ? E[0].d : X.today) + 'T00:00:00Z';
  const ent = E.map(e => { const c = e.c, f = c.label || c.f, v = x => x === true ? 'yes' : x === false ? 'no' : String(x);
    const line = c.f === 'price_from' && c.pct != null ? f + ': ' + (c.pct > 0 ? '+' : '') + c.pct + '%' : f + ': ' + v(c.from) + ' to ' + v(c.to);
    return '<entry><id>tag:kolaboro.com,2026:changes/' + xe(e.x.id) + '/' + xe(c.f) + '/' + e.d + '</id><title>' + xe(e.x.n + ': ' + line) + '</title><updated>' + e.d + 'T00:00:00Z</updated><link href="' + pUrl('en', e.x) + '"/><summary>' + xe(e.x.n + ' (' + e.x.mk + '): ' + line + ', first seen ' + e.d + ' between page copies ' + (c.sha_from || '') + ' and ' + (c.sha_to || '') + '. Values are read from the page text by our agent.') + '</summary></entry>'; }).join('');
  return '<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom"><id>' + ORIGIN + '/changes/</id><title>Kolaboro: what changed on developer pages</title><updated>' + upd + '</updated><link rel="self" href="' + ORIGIN + '/changes/feed.atom"/><link href="' + ORIGIN + '/changes/"/><author><name>Kolaboro</name></author><rights>CC BY 4.0</rights>' + ent + '</feed>';
}

// ---------- answer files for answer engines
function answers(X, x, tp) {
  const c = X.ix.caseBy.get(x.id) || {}, rv = X.rev(x), page = pageOf(x), ho = N.handoverOf(X.ix, x), lm = late(X, x), P = X.ix.prom[x.id] || [];
  const url = pUrl('en', x), sha = x.sha || (c.fp || {}).sha256, sd = x.sealed || (c.fp || {}).date, lc = N.lastmod(X.ix, x);
  const ch = X.changes.filter(e => e.x.id === x.id).slice(0, 8), where = [x.ar && x.ar !== x.mk ? x.ar : null, x.mk, x.co].filter(Boolean).join(', ').split(', ').filter((v, i, a) => a.findIndex(w => w.toLowerCase() === v.toLowerCase()) === i).join(', ');
  const L = ['# ' + x.n + ': facts on record', '', 'Canonical page: ' + url, 'Other languages: ' + LANGS.filter(l => l !== 'en').map(l => pUrl(l, x)).join(' '), 'Last checked: ' + lc + '. Licence: CC BY 4.0, attribute "Kolaboro" and link the canonical page.', 'Rules: facts only, each with its source. Kolaboro gives no verdicts about a named company.', ''];
  L.push('## Quick answer {#answer}', '', N.quickAnswer(X.ix, x, 'en', tp || null), '');   // n24s: the same text as the top of the page
  L.push('## Summary {#summary}', '');
  if (!rv) L.push(x.n + ' (' + where + ') is tracked by Kolaboro and not yet reviewed: our research agent has not read its sources yet, so no score or check results are published. Page: ' + url, '');
  else {
    L.push(x.n + ' is an off-plan property project in ' + where + (x.dv ? ', by ' + x.dv : '') + (c.stage ? ', stage on record: ' + c.stage : '') + '. ' +
      (ho ? 'Handover date on record: ' + N.fd(ho.d, 'en') + (lm && lm.late > 0 ? ', ' + lm.late + ' months past the first date on record (' + N.fd(lm.first, 'en') + ')' : '') + '. ' : 'No handover date is published in the sources we read. ') +
      (x.pn ? 'Permit or licence number published: ' + x.pn + '. ' : isPermit(c) ? 'A permit or licence number is published. ' : 'No permit or licence number is published in the sources we read. ') +
      c.score + ' of 6 buyer checks are public, ' + (c.vscore || 0) + ' confirmed by a register or an independent source.', '');
  }
  L.push('## Is ' + x.n + ' legit? {#legit}', '', 'Kolaboro does not label projects as legit or not. It publishes what official registers and the developer\'s own pages show, with sources, and what it could not verify: ' + url + '#checks' + (rv && c.claims ? '. Of ' + ((c.claims.verified || 0) + (c.claims.unverified || 0) + (c.claims.contradicted || 0)) + ' developer claims tested: confirmed ' + (c.claims.verified || 0) + ', not yet verified ' + (c.claims.unverified || 0) + ', contradicted by another source ' + (c.claims.contradicted || 0) + '.' : '.'), '');
  L.push('## When will ' + x.n + ' be delivered? {#delivery}', '');
  if (rv && P.length) for (const q of P) L.push('- ' + N.tr('en', 'pk_' + q.k) + ': ' + N.fd(q.d, 'en') + ' (' + N.tr('en', 'ps_' + q.st) + (q.mv ? '; moved ' + q.mv + ' times, ' + (q.mm || 0) + ' months in total' : '; not moved in our records') + '; source: ' + (q.src === 'page' ? 'developer or listing page' + (q.sha ? ', copy SHA-256 ' + q.sha : '') : 'research record') + ', first seen ' + (((q.hist || [])[0] || {}).seen || q.seen) + ')');
  else L.push(rv ? 'No dated promise found in the sources we read.' : 'Not yet reviewed.');
  L.push('', 'Live tracker: ' + ORIGIN + '/embed/tracker/' + x.s + '/', '');
  L.push('## Does ' + x.n + ' have a permit? {#permits}', '', x.pn ? 'Number published: ' + x.pn + ' (source: ' + (N.okHttp(x.du) ? N.fixU(x.du) : page || url) + ').' : 'No permit or licence number is published in the sources we read.' + (rv && isPermit(c) ? ' The sources state a permit without a number we can show.' : ''));
  const rw = x.rw || c.register; if (rw && rw.register) L.push('Official register check: ' + rw.register + ', ' + (rw.item || '') + ': ' + (rw.status || '') + (rw.checked ? ' (checked ' + rw.checked + ')' : '') + '. How registers are searched: ' + ORIGIN + '/registers/');
  L.push('', '## Who is the developer? {#developer}', '', x.dv ? x.dv + (x.dvs && X.ix.devs.has(x.dvs) ? ': ' + ORIGIN + '/developers/' + x.dvs + '/' : '') + ((x.fx || {}).developer_company && N.cleanOk(x.fx.developer_company) ? '. Company as published: ' + x.fx.developer_company : '') : 'Not published in the sources we read.', '');
  L.push('## What do buyers say? {#reviews}', '', 'Kolaboro publishes buyer reviews only from verified buyers (proof of purchase), after moderation, on the project page: ' + url + '#reviews. Developers can reply with documents: ' + ORIGIN + '/developers/reply/?id=' + encodeURIComponent(x.id), '');
  L.push('## What changed recently {#changes}', '');
  if (ch.length) for (const e of ch) { const cc = e.c, v = z => z === true ? 'yes' : z === false ? 'no' : String(z); L.push('- ' + e.d + ': ' + (cc.label || cc.f) + ': ' + (cc.f === 'price_from' && cc.pct != null ? (cc.pct > 0 ? '+' : '') + cc.pct + '%' : v(cc.from) + ' to ' + v(cc.to)) + ' (page copies ' + (cc.sha_from || '') + ' and ' + (cc.sha_to || '') + ')'); }
  else L.push('No change found between dated copies of the developer page.');
  if (sha && sd) L.push('', 'Sealed copy of the developer page: ' + sd + ', SHA-256 ' + sha + '. Verify: ' + ORIGIN + '/verify');
  L.push('', '## Sources {#sources}', '');
  const S2 = [...new Set([page, N.okHttp(x.du) ? N.fixU(x.du) : null, ...(x.src || []).filter(N.okHttp).map(N.fixU)].filter(Boolean))].slice(0, 12);
  for (const s of S2) L.push('- ' + s);
  L.push('- ' + ORIGIN + '/api/v1/projects/' + x.s + ' (all facts as JSON)', '', '## How to cite {#cite}', '', 'Kolaboro, "' + x.n + ': facts on record", ' + url + ', checked ' + lc + ', CC BY 4.0.', '');
  return L.join('\n');
}
function llmsProjects(X) {
  const L = ['# Kolaboro: every named off-plan project, one citation-ready block each', '', '> Facts only, each with its source. Data of ' + X.today + '. CC BY 4.0, attribute "Kolaboro". Projects not yet reviewed carry no score. Full answers per project: ' + ORIGIN + '/answers/<slug>.md. Section anchors on each project page: #answer #glance #legit #promise #delivery #permits #where #checks #developer #reviews #reply #faq #sources.', ''];
  const mk = new Map(); for (const x of X.ix.P) { if (!mk.has(x.mk)) mk.set(x.mk, []); mk.get(x.mk).push(x); }
  for (const m of [...mk.keys()].sort()) {
    L.push('## ' + m, '');
    for (const x of mk.get(m).sort((a, b) => a.n.localeCompare(b.n))) {
      const c = X.ix.caseBy.get(x.id) || {}, ho = N.handoverOf(X.ix, x), lm = late(X, x);
      const s = X.rev(x) ? (ho ? 'handover on record ' + N.fd(ho.d, 'en') + (lm && lm.late > 0 ? ' (' + lm.late + ' months past first date on record)' : '') : 'no handover date published') + '; permit number ' + (x.pn || isPermit(c) ? 'published' : 'not published') + '; ' + c.score + '/6 buyer checks public, ' + (c.vscore || 0) + ' confirmed' : 'not yet reviewed';
      L.push('- [' + x.n + '](' + pUrl('en', x) + ')' + (x.dv ? ', developer ' + x.dv : '') + ': ' + s + '; checked ' + N.lastmod(X.ix, x) + '. Answers: ' + ORIGIN + '/answers/' + x.s + '.md');
    }
    L.push('');
  }
  return L.join('\n');
}
// n26i (batch 26): llms.txt per language (/<lang>/llms.txt) and per country (/llms/<country>.txt), every named project with the
// quick answer of its page in that language (the same words, built from the same fields), its page link and its answer file.
const LL = {
  en: ['Kolaboro: off-plan projects, facts only', 'Every named off-plan project we track, with the quick answer shown at the top of its page. Facts only, each with its source on the page. Data of {d}. CC BY 4.0, attribute "Kolaboro". Projects not yet reviewed carry no score.', 'Other files', '{n} projects'],
  es: ['Kolaboro: proyectos sobre plano, solo hechos', 'Todos los proyectos sobre plano con nombre que seguimos, con la respuesta rápida que aparece arriba en su página. Solo hechos, cada uno con su fuente en la página. Datos del {d}. CC BY 4.0, cite "Kolaboro". Los proyectos aún no revisados no llevan puntuación.', 'Otros archivos', '{n} proyectos'],
  de: ['Kolaboro: Off-Plan-Projekte, nur Fakten', 'Alle benannten Off-Plan-Projekte, die wir verfolgen, mit der Kurzantwort oben auf ihrer Seite. Nur Fakten, jede mit Quelle auf der Seite. Datenstand {d}. CC BY 4.0, Quellenangabe „Kolaboro“. Noch nicht geprüfte Projekte haben keinen Wert.', 'Weitere Dateien', '{n} Projekte'],
  fr: ['Kolaboro : projets sur plan, des faits uniquement', 'Tous les projets sur plan nommés que nous suivons, avec la réponse courte affichée en haut de leur page. Des faits uniquement, chacun avec sa source sur la page. Données du {d}. CC BY 4.0, citer « Kolaboro ». Les projets pas encore examinés n\'ont pas de score.', 'Autres fichiers', '{n} projets'],
  nl: ['Kolaboro: projecten op plan, alleen feiten', 'Alle benoemde projecten op plan die we volgen, met het korte antwoord bovenaan hun pagina. Alleen feiten, elk met de bron op de pagina. Gegevens van {d}. CC BY 4.0, vermeld "Kolaboro". Projecten die nog niet zijn beoordeeld hebben geen score.', 'Andere bestanden', '{n} projecten'],
  ru: ['Kolaboro: строящиеся проекты, только факты', 'Все строящиеся проекты с названием, которые мы отслеживаем, с кратким ответом из начала их страницы. Только факты, у каждого источник на странице. Данные на {d}. CC BY 4.0, ссылка на «Kolaboro». У ещё не проверенных проектов нет оценки.', 'Другие файлы', 'проектов: {n}'],
  zh: ['Kolaboro：期房项目，只列事实', '我们跟踪的所有具名期房项目，附其页面顶部的简要回答。只列事实，每条在页面上都有来源。数据日期 {d}。CC BY 4.0，请注明“Kolaboro”。尚未审核的项目没有评分。', '其他文件', '{n} 个项目'],
  ar: ['Kolaboro: مشاريع على المخطط، حقائق فقط', 'كل المشاريع على المخطط المسماة التي نتابعها، مع الإجابة المختصرة الظاهرة أعلى صفحتها. حقائق فقط، لكل منها مصدر على الصفحة. بيانات {d}. ترخيص CC BY 4.0، مع ذكر "Kolaboro". المشاريع التي لم تُراجع بعد ليست لها درجة.', 'ملفات أخرى', '{n} مشروع'] };
const LLD = {};
const llT = (lang, i, v) => String((LL[lang] || LL.en)[i]).replace(/\{(\w+)\}/g, (m, k) => v && v[k] != null ? v[k] : m);
const fdate = (d, lang) => { try { return new Intl.DateTimeFormat(LOC[lang] || 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z')); } catch (e) { return d; } };
const CO_AL = { 'Puerto Rico (USA)': 'Puerto Rico', 'St Lucia': 'Saint Lucia', 'United States': 'USA', 'United Arab Emirates': 'UAE' };   // same names as the country hubs (kbx_seo.js)
export function llmsCountries(X) { const m = new Map(); for (const x of X.ix.P) if (x.co) { const co = CO_AL[x.co] || x.co, k = slug(co); if (!m.has(k)) m.set(k, { co, s: k, L: [] }); m.get(k).L.push(x); } return [...m.values()].sort((a, b) => b.L.length - a.L.length || a.co.localeCompare(b.co)); }
async function llmsLang(X, env, lang, only) {
  const key = lang + '|' + (only ? only.s : '*') + '|' + X.today + '|' + X.ix.P.length; if (LLD[key]) return LLD[key];
  const P = only ? only.L : X.ix.P;
  let trP = null; try { trP = (await import('./kbx_tr.js')).trProject; } catch (e) { trP = null; }
  const tps = trP ? await Promise.all(P.map(x => trP(env, x.id, lang).catch(() => null))) : P.map(() => null);
  const tpOf = new Map(P.map((x, i) => [x.id, tps[i]]));
  const L = ['# ' + llT(lang, 0) + (only ? ': ' + coName(only.co, lang) : ''), '', '> ' + llT(lang, 1, { d: fdate(X.today, lang) }), ''];
  L.push('## ' + llT(lang, 2), '', '- ' + ORIGIN + '/llms.txt', '- ' + ORIGIN + '/llms-full.txt', '- ' + ORIGIN + '/llms-projects.txt', ...LANGS.filter(l => l !== 'en' && l !== lang).map(l => '- ' + ORIGIN + '/' + l + '/llms.txt'), '- ' + ORIGIN + '/llms/<country>.txt (' + llmsCountries(X).slice(0, 6).map(c => c.s).join(', ') + ', ...)', '- ' + ORIGIN + '/llms-full/<country>.txt (the same countries, full answer of every project)', '- ' + ORIGIN + '/answers/<slug>.md', '');
  const byCo = new Map(); for (const x of P) { const c = x.co || '-'; if (!byCo.has(c)) byCo.set(c, new Map()); const m = byCo.get(c); if (!m.has(x.mk)) m.set(x.mk, []); m.get(x.mk).push(x); }
  for (const [co, M] of [...byCo.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (!only) L.push('## ' + coName(co, lang) + ' (' + llT(lang, 3, { n: [...M.values()].reduce((a, v) => a + v.length, 0) }) + ')', '');
    for (const [mk, xs] of [...M.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0])))) {
      L.push((only ? '## ' : '### ') + mkName(mk, lang), '');
      for (const x of xs.sort((a, b) => a.n.localeCompare(b.n))) {
        let qa = ''; try { qa = N.quickAnswer(X.ix, x, lang, tpOf.get(x.id) || null); } catch (e) { qa = ''; }
        L.push('- [' + x.n + '](' + pUrl(lang, x) + ')' + (qa ? ': ' + qa.replace(/\s+/g, ' ').trim() : '') + ' ' + ORIGIN + '/answers/' + x.s + '.md');
      }
      L.push('');
    }
  }
  const out = L.join('\n'); for (const k of Object.keys(LLD)) if (!k.endsWith('|' + X.today + '|' + X.ix.P.length)) delete LLD[k];
  if (Object.keys(LLD).length < 40) LLD[key] = out; return out;
}
function citeSitemap(X) {
  const U = [];
  const lastIn = m => [(X.changes.find(e => e.d.slice(0, 7) === m) || {}).d, X.added.filter(e => e.d.slice(0, 7) === m).map(e => e.d).sort().pop()].filter(Boolean).sort().pop() || X.today;
  const entries = [['/stories/', X.today], ...X.storyMonths.flatMap(m => X.markets.map(k => ['/stories/' + m + '/' + k.s + '/', m === X.cur ? X.today : m + '-28'])), ...X.months.map(m => ['/changes/' + m + '/', lastIn(m)])];
  const out = [];
  for (const [p, d] of entries) for (const l of LANGS) out.push('<url><loc>' + ORIGIN + pre(l) + p + '</loc><lastmod>' + d + '</lastmod>' + LANGS.map(k => '<xhtml:link rel="alternate" hreflang="' + k + '" href="' + ORIGIN + pre(k) + p + '"/>').join('') + '<xhtml:link rel="alternate" hreflang="x-default" href="' + ORIGIN + p + '"/></url>');
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' + out.join('') + '</urlset>';
}

// ------------------------------------------------------------------------------------------------ routes
const txt = (body, type, extra) => new Response(body, { headers: Object.assign({ 'content-type': type, 'cache-control': 'public, max-age=900', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' }, extra || {}) });
const nf = () => new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=300' } });
export async function handle(req, u, env, ctx, shell) {
  const p = u.pathname;
  if (req.method !== 'GET' && req.method !== 'HEAD') return null;
  if (!PATHS.test(p)) return null;
  let X; try { X = await load(env); } catch (e) { return new Response('Data unavailable, try again in a minute.', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8', 'retry-after': '60', 'cache-control': 'no-store' } }); }
  let m;
  if ((m = /^\/embed\/(card|tracker|p)\/([a-z0-9-]{1,90})(\/?)$/.exec(p))) {
    if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } });
    const x = X.ix.bySlug.get(m[2]); if (!x) return nf();
    const lang = langOf(u), html = m[1] === 'card' ? eCard(X, x, lang) : m[1] === 'tracker' ? eTracker(X, x, lang) : codesPage(X, x, lang, await verifiedReply(x, ctx));
    return new Response(html, { headers: { 'content-type': 'application/xhtml+xml; charset=utf-8', 'cache-control': 'public, max-age=900, no-transform', 'x-robots-tag': 'noindex, follow' } });
  }
  if ((m = /^\/embed\/badge\/([a-z0-9-]{1,90})\.svg$/.exec(p))) {
    const x = X.ix.bySlug.get(m[1]); if (!x) return nf();
    const vr = await verifiedReply(x, ctx), H = { 'content-type': 'image/svg+xml; charset=utf-8', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' };
    if (vr && vr.domain) return new Response(badgeSvg('Tracked by Kolaboro', 'developer verified: ' + vr.domain, '#0B6E4F'), { headers: Object.assign(H, { 'cache-control': 'public, max-age=3600' }) });
    return new Response(badgeSvg('Kolaboro', vr && vr.err ? 'badge status unavailable' : 'badge not issued', '#56636F'), { status: vr && vr.err ? 503 : 404, headers: Object.assign(H, { 'cache-control': 'public, max-age=600' }) });
  }
  if ((m = /^\/answers\/([a-z0-9-]{1,90})\.md$/.exec(p))) {
    const x = X.ix.bySlug.get(m[1]); if (!x) return nf();
    let tp = null; try { tp = await (await import('./kbx_tr.js')).trProject(env, x.id, 'en'); } catch (e) { tp = null; }
    return txt(answers(X, x, tp), 'text/markdown; charset=utf-8', { link: '<' + pUrl('en', x) + '>; rel="canonical"', 'last-modified': new Date(N.lastmod(X.ix, x) + 'T12:00:00Z').toUTCString() });
  }
  if (p === '/llms-projects.txt') return txt(llmsProjects(X), 'text/plain; charset=utf-8');
  if ((m = /^\/(es|de|fr|nl|ru|zh|ar)\/llms\.txt$/.exec(p))) return txt(await llmsLang(X, env, m[1], null), 'text/plain; charset=utf-8', { 'content-language': m[1], 'x-robots-tag': 'noindex' });
  if ((m = /^\/llms\/([a-z0-9-]{2,60})\.txt$/.exec(p))) { const c = llmsCountries(X).find(z => z.s === m[1]); if (!c) return nf(); return txt(await llmsLang(X, env, 'en', c), 'text/plain; charset=utf-8', { 'x-robots-tag': 'noindex' }); }
  // n29i (batch 29, item 94): the full answer file of every project of one country in one file, after the short /llms/<country>.txt
  if ((m = /^\/llms-full\/([a-z0-9-]{2,60})\.txt$/.exec(p))) {
    const c = llmsCountries(X).find(z => z.s === m[1]); if (!c) return nf();
    const k = 'full|' + c.s + '|' + X.today + '|' + X.ix.P.length; if (LLD[k]) return txt(LLD[k], 'text/plain; charset=utf-8', { 'x-robots-tag': 'noindex' });
    let trP = null; try { trP = (await import('./kbx_tr.js')).trProject; } catch (e) { trP = null; }
    const L = c.L.slice().sort((a, b) => String(a.mk).localeCompare(String(b.mk)) || a.n.localeCompare(b.n)), tps = trP ? await Promise.all(L.map(x => trP(env, x.id, 'en').catch(() => null))) : L.map(() => null);
    const mks = [...new Set(L.map(x => x.mk))];
    const out = ['# Kolaboro: every named off-plan project in ' + c.co + ', full answers', '', '> ' + L.length + ' projects in ' + mks.length + ' market' + (mks.length === 1 ? '' : 's') + ' (' + mks.join(', ') + '). For each project: quick answer, dated handover promises, permit, developer, changes and sources, the same text as ' + ORIGIN + '/answers/<slug>.md. Facts only, each with its source. Data of ' + X.today + '. CC BY 4.0, attribute "Kolaboro". Short version: ' + ORIGIN + '/llms/' + c.s + '.txt', '',
      ...L.map((x, i) => answers(X, x, tps[i]).replace(/^# /, '# [' + x.mk + '] ') + '\n---\n')].join('\n');
    if (Object.keys(LLD).filter(z => z.startsWith('full|')).length < 8) LLD[k] = out;   // a few MB at most per isolate
    return txt(out, 'text/plain; charset=utf-8', { 'x-robots-tag': 'noindex' });
  }
  if (p === '/stories/sitemap.xml') return txt(citeSitemap(X), 'application/xml; charset=utf-8');
  if (p === '/changes/feed.atom') return txt(changesAtom(X), 'application/atom+xml; charset=utf-8');
  if ((m = /^\/stories\/(\d{4}-\d{2})\/([a-z0-9-]{1,60})\.csv$/.exec(p))) {
    const k = X.markets.find(z => z.s === m[2]); if (!k || !X.storyMonths.includes(m[1])) return nf();
    return txt(storyCsv(X, k, m[1]), 'text/csv; charset=utf-8', { 'content-disposition': 'inline; filename="kolaboro-' + m[2] + '-' + m[1] + '.csv"', link: '<' + ORIGIN + '/stories/' + m[1] + '/' + m[2] + '/>; rel="canonical"' });
  }
  const pm = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(stories|changes)(\/.*)?$/.exec(p); if (!pm) return nf();
  const lang = pm[1] || 'en', kind = pm[2], rest = pm[3] || '';
  if (!rest || (rest !== '/' && !rest.endsWith('/'))) return /^(\/[a-z0-9-]+)*$/.test(rest) ? new Response(null, { status: 301, headers: { location: p + '/' + u.search } }) : nf();
  let o = null;
  if (kind === 'stories') {
    if (rest === '/') o = storiesIndex(X, lang);
    else if ((m = /^\/(\d{4}-\d{2})\/([a-z0-9-]{1,60})\/$/.exec(rest))) { const k = X.markets.find(z => z.s === m[2]); if (k && X.storyMonths.includes(m[1])) o = story(X, k, m[1], lang); }
  } else {
    if (rest === '/') { if (!X.months.length) return nf(); return new Response(null, { status: 302, headers: { location: pre(lang) + '/changes/' + X.months[0] + '/', 'cache-control': 'public, max-age=900' } }); }
    if ((m = /^\/(\d{4}-\d{2})\/$/.exec(rest)) && X.months.includes(m[1])) o = changesPage(X, m[1], lang);
  }
  if (!o) return nf();
  return shellPage(shell, lang, o);
}
