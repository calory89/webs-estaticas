// kolaboro.com batch 26 (agent n26y, 13 Nov 2026): trust and visible daily progress. No model calls, nothing stored about visitors,
// nothing estimated: every figure is counted from our own published data files.
// Routes (8 languages, prefix /es /de /fr /nl /ru /zh /ar):
//   GET /progress/                   daily counters (projects, markets, countries, sources, claims, sitemap URLs, changes, deploys),
//                                    chart of projects added per day since the start, day-by-day table, daily records
//   GET /progress/improvements/      the 300 improvements picked on 13 Nov 2026, with their status (text in English and Spanish)
//   GET /press/places/[<place>/]     figures for the press per island or city (from the transparency ranking data, kbx_tr.js)
//   GET /moderation/                 public moderation policy
//   GET /team/                       team and method, with the review date
//   GET /progress/sitemap.xml        every URL above with hreflang alternates (listed in /sitemap_index.xml by kbx_seo.js)
//   GET /api/x/progress              the same figures as JSON (CC BY 4.0)
//   GET /api/x/progress/today        today's snapshot; read once a day by .github/workflows/kolaboro-open-history.yml (main), which
//                                    writes it into /data/progress.json "days" (the figures that cannot be rebuilt later)
// Data: /data/named.json (field "ad": date each project entered the index), /data/bali-cases.json (totals, as /api/open/stats),
// /data/shipping.json (changes shipped per day), /data/deploys.json (deploys the guard checked live), /data/progress.json (items, days).
// Sumba projects never get a press page (the transparency ranking keeps its own disclosure); counts include every tracked project,
// exactly like /api/open/stats.
import { t31 } from './kbx_n31b_page.js';   // n31b (batch 31): external legal advisers note (item 74), conflicts-of-interest link (item 70)
import { e29t } from './kbx_e29_i18n.js';
import { REVIEWED as E29_REV } from './kbx_e29_lines.js';
import { TS } from './kbx_trust_i18n.js';
import { trData } from './kbx_tr.js';
import { placeName } from './kbx_hdate.js';
import { t27 } from './kbx_t27_i18n.js';   // n27t: funding and conflicts of interest on /team/
import { ogImg } from './kbx_ogt.js';   // n29t: share image per page type

const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const PAGE_RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(progress(?:\/improvements)?|moderation|team|press\/places(?:\/[a-z0-9-]{2,40})?)(\/?)$/;
export const SITEMAP = '/progress/sitemap.xml';
export const PATHS = /^\/api\/x\/progress(?:\/today)?\/?$/;
const REVIEWED = '2026-11-13';   // review date of /moderation/ and /team/
const MIN_PRESS = 5;             // a place gets a press page from 5 tracked projects (same threshold as a ranked place)
const CTRY_ALIAS = { 'Puerto Rico (USA)': 'Puerto Rico', 'St Lucia': 'Saint Lucia', 'United States': 'USA', 'United Arab Emirates': 'UAE' };   // as /api/open/stats
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bdi = s => '<bdi>' + esc(s) + '</bdi>';
const t = (lang, k) => (TS[lang] && TS[lang][k] != null) ? TS[lang][k] : TS.en[k];
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, a) => v && v[a] != null ? v[a] : m);
const te = (lang, k, v) => fill(esc(t(lang, k)), v);          // template escaped, values are HTML already
const tx = (lang, k, v) => fill(t(lang, k), v);               // plain text (titles, JSON-LD)
const nf = (lang, n) => n == null ? '' : Number(n).toLocaleString(LOC[lang] || 'en-GB');
const fdt = (iso, lang, short) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); if (!m) return String(iso || ''); try { return new Intl.DateTimeFormat(LOC[lang] || 'en-GB', short ? { day: 'numeric', month: 'short', timeZone: 'UTC' } : { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))); } catch (e) { return iso.slice(0, 10); } };
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const day = d => d.toISOString().slice(0, 10);

// ------------------------------------------------------------------------------------------------ data
const SHARED = (globalThis.__kbJson = globalThis.__kbJson || {}), LOADING = {};
async function load(env, name) {   // same shared parse cache as kbx_tr.js / kbx_named.js
  const m = SHARED[name]; if (m && (m.a || Date.now() - m.t < 600000)) return m.v;
  if (LOADING[name]) return LOADING[name];
  const p = (async () => {
    let r = null, a = false;
    try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); a = !!(r && r.ok); } catch (e) { r = null; }
    if (!r || !r.ok) r = await fetch(ORIGIN + '/data/' + name, { cf: { cacheTtl: 300, cacheEverything: true } });
    if (!r.ok) throw new Error(name + ' ' + r.status);
    const v = await r.json(); SHARED[name] = { t: Date.now(), v, a }; return v;
  })();
  LOADING[name] = p; const done = () => { if (LOADING[name] === p) delete LOADING[name]; }; p.then(done, done);
  return p;
}
const opt = (env, n) => load(env, n).catch(() => null);
const capped = (p, ms) => Promise.race([p.catch(() => null), new Promise(r => setTimeout(() => r(null), ms))]);

// URLs listed in our sitemaps: the counts of kbx_seo.js plus the sitemaps other modules publish (counted in this isolate, 10 minutes)
let SMC = null, SMP = null;
// Computing the count rebuilds every sitemap (about 3 s), so it never blocks a page: the value is kept per isolate and in the edge
// cache (per deploy, 1 hour). Pages never compute it (CPU work cannot be cut by a timer): they show the cached count or, failing
// that, the latest daily record; /api/x/progress and /api/x/progress/today compute it and fill the cache.
async function sitemapUrls(env, inner, ctx, wait) {
  if (SMC && Date.now() - SMC.t < 600000) return SMC.v;
  const ck = typeof caches !== 'undefined' ? new Request(ORIGIN + '/__kpg_sm/v1/' + ((env && env.CF_PAGES_COMMIT_SHA) || 'x')) : null;
  if (ck) { try { const h = await caches.default.match(ck); if (h) { const v = +(await h.text()); if (v > 0) { SMC = { t: Date.now(), v }; return v; } } } catch (e) {} }
  if (!wait) return SMC ? SMC.v : null;   // the count is CPU-heavy: pages only read the cached value (filled by the JSON API and the daily job)
  if (!SMP) SMP = (async () => {
    const seo = await import('./kbx_seo.js');
    let n = await seo.sitemapTotal(env, inner);
    for (const x of ['/stories/sitemap.xml', '/rankings/transparency/sitemap.xml', SITEMAP]) {
      try { const r = x === SITEMAP ? new Response(await sitemapXml(env)) : (inner ? await inner(x) : null); if (r && r.ok) n += ((await r.text()).match(/<url>/g) || []).length; } catch (e) {}
    }
    SMC = { t: Date.now(), v: n };
    if (ck) { try { await caches.default.put(ck, new Response(String(n), { headers: { 'cache-control': 'max-age=3600' } })); } catch (e) {} }
    return n;
  })().catch(() => null).finally(() => { SMP = null; });
  const p = SMP; if (ctx && ctx.waitUntil) ctx.waitUntil(p);
  const v = await capped(p, wait ? 8000 : 600);
  return v != null ? v : (SMC ? SMC.v : null);
}

let PD = null;
export async function progData(env, inner) {
  const [named, cases, ship, dep, prog] = await Promise.all([load(env, 'named.json'), load(env, 'bali-cases.json'), opt(env, 'shipping.json'), opt(env, 'deploys.json'), opt(env, 'progress.json')]);
  const today = day(new Date());
  const key = [named, cases, ship, dep, prog, today];
  let base = PD && PD.key.every((v, i) => v === key[i]) ? PD.v : null;
  if (!base) {
    const cs = cases.cases || [], byId = new Map(cs.map(c => [c.id, c]));
    const add = new Map(); let first = null;
    for (const x of named.projects || []) {
      const d = /^\d{4}-\d{2}-\d{2}$/.test(x.ad || '') ? x.ad : null; if (!d) continue;
      const c = byId.get(x.id), mk = (c && c.market) || x.mk, co = CTRY_ALIAS[(c && c.country) || x.co] || (c && c.country) || x.co;
      const a = add.get(d) || { n: 0, mk: [], co: [] }; a.n++; if (mk) a.mk.push(mk); if (co) a.co.push(co); add.set(d, a);
      if (!first || d < first) first = d;
    }
    const ships = new Map(((ship && ship.days) || []).map(x => [x.date, x.ships || 0]));
    const deps = new Map(); for (const x of (dep && dep.deploys) || []) if (x && x.at && x.result !== 'not_deployed') { const d = String(x.at).slice(0, 10); deps.set(d, (deps.get(d) || 0) + 1); }
    const depFirst = [...deps.keys()].sort()[0] || null, shipFirst = (ship && ship.first_day) || null;
    const series = [], MK = new Set(), CO = new Set(); let total = 0;
    if (first) for (let d = new Date(first + 'T00:00:00Z'); day(d) <= today; d.setUTCDate(d.getUTCDate() + 1)) {
      const k = day(d), a = add.get(k);
      if (a) { total += a.n; a.mk.forEach(m => MK.add(m)); a.co.forEach(c => CO.add(c)); }
      series.push({ d: k, added: a ? a.n : 0, total, markets: MK.size, countries: CO.size, ships: shipFirst && k >= shipFirst && (ship.today ? k <= ship.today : true) ? (ships.get(k) || 0) : null, deploys: depFirst && k >= depFirst ? (deps.get(k) || 0) : null });
    }
    const db = cases.db || {};
    const live = { projects: cs.length, markets: cases.markets, countries: cs.length ? new Set(cs.map(c => CTRY_ALIAS[c.country] || c.country).filter(Boolean)).size : cases.countries,
      sources: db.sources, claims_total: db.claims_total, data_points: db.data_points, data_updated: cases.updated };
    const since = day(new Date(Date.now() - 6 * 864e5));
    live.ships_7d = series.filter(s => s.d >= since && s.ships != null).reduce((a, s) => a + s.ships, 0);
    live.deploys_7d = series.filter(s => s.d >= since && s.deploys != null).reduce((a, s) => a + s.deploys, 0);
    const items = (prog && prog.items) || [], cnt = { done: 0, doing: 0, next: 0, planned: 0 }; for (const i of items) if (cnt[i.st] != null) cnt[i.st]++;
    base = { live, series, first, shipFirst, depFirst, shipBuilt: ship && ship.generated_at, items, cnt, itemsUpd: prog && prog.items_updated, days: ((prog && prog.days) || []).slice().sort((a, b) => String(b.d).localeCompare(String(a.d))) };
    PD = { key, v: base };
  }
  return base;
}

// ------------------------------------------------------------------------------------------------ shared HTML
const CSS = '<style id="kpg-css">.kpg h2{margin-top:var(--k-7,48px)}.kpg .k-grid{--k-min:190px}.kpg-st{border:1px solid var(--k-line);border-radius:var(--k-r-md,10px);background:var(--k-surface);padding:var(--k-4,16px)}.kpg-st b{display:block;font-size:var(--k-fs-2xl,28px);line-height:1.15}.kpg-st span{display:block;color:var(--k-ink-2)}.kpg-st small{display:block;color:var(--k-muted);font-size:var(--k-fs-xs,13px);margin-top:4px;overflow-wrap:anywhere}' +
  '.kpg-fig{margin:var(--k-4,16px) 0;padding:var(--k-4,16px);border:1px solid var(--k-line);border-radius:var(--k-r-md,10px);background:var(--k-surface)}.kpg-fig svg{display:block;width:100%;height:auto}.kpg-fig figcaption{color:var(--k-muted);font-size:var(--k-fs-sm,15px);margin-top:8px}' +
  '.kpg-b{fill:var(--k-sea)}.kpg-l{fill:none;stroke:var(--k-brand-ink);stroke-width:2}.kpg-ax{stroke:var(--k-line-2);stroke-width:1}.kpg-tx{fill:var(--k-muted);font-size:11px;font-family:inherit}.kpg-tv{fill:var(--k-ink);font-size:11px;font-weight:600}.kpg-tl{fill:var(--k-brand-ink);font-size:11px;font-weight:600}' +
  '.kpg ol.kpg-it{list-style:none;padding:0;margin:0}.kpg-it li{display:flex;gap:10px;align-items:baseline;padding:8px 0;border-bottom:1px solid var(--k-line)}.kpg-it li>b{min-width:2.6em;color:var(--k-muted);font-variant-numeric:tabular-nums}.kpg-it li>span:last-child{flex:1}' +
  '.kpg-q li{margin:8px 0}.kpg-q blockquote{margin:0}.kpg-cite{background:var(--k-sunken);border-radius:var(--k-r-sm,6px);padding:var(--k-3,12px);overflow-wrap:anywhere}.kpg ul,.kpg ol{padding-inline-start:1.2em}.kpg li{margin:6px 0}.kpg .k-badge{white-space:nowrap}.kpg-sec h3{margin-top:var(--k-5,24px)}</style>';
const ST_BADGE = { done: 'ok', doing: 'info', next: 'plain', planned: 'plain' };
const badge = (lang, st) => '<span class="k-badge k-badge--' + (ST_BADGE[st] || 'plain') + '">' + esc(t(lang, 'st_' + st)) + '</span>';
const crumb = (lang, list) => '<p class="k-crumb"><a href="' + pre(lang) + '/">Kolaboro</a> / ' + list.map((x, i) => i < list.length - 1 ? '<a href="' + x[1] + '">' + esc(x[0]) + '</a>' : '<span>' + esc(x[0]) + '</span>').join(' / ') + '</p>';
export const head = (lang, list, h1, lead, extra) => '<section class="k-sec"><div class="k-wrap"><div class="k-phead">' + crumb(lang, list) + '<h1>' + h1 + '</h1><p class="lead">' + lead + '</p>' + (extra || '') + '</div>';
export const crumbLd = (lang, list) => ({ '@type': 'BreadcrumbList', itemListElement: [['Kolaboro', pre(lang) + '/']].concat(list).map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x[0], item: ORIGIN + x[1] })) });
const stat = (lang, v, k, src) => '<div class="kpg-st"><b>' + (v == null ? '<span class="k-muted">' + esc(t(lang, 'none')) + '</span>' : esc(nf(lang, v))) + '</b><span>' + esc(t(lang, k)) + '</span>' + (src ? '<small>' + src + '</small>' : '') + '</div>';
const srcA = (href, label) => '<a class="k-src" href="' + esc(href) + '">' + esc(label || href) + '</a>';
const PROG_P = '/progress/', IMP_P = '/progress/improvements/', MOD_P = '/moderation/', TEAM_P = '/team/', PRESS_P = '/press/places/';

// bar chart of projects added per day (bars) with the running total (line); inline SVG, theme colours from the design tokens
function chartSvg(lang, S) {
  const W = 720, H = 240, L = 34, R = 46, T = 18, B = 34, n = S.length; if (!n) return '';
  const max = Math.max(1, ...S.map(s => s.added)), tot = Math.max(1, S[n - 1].total), cw = (W - L - R) / n, bw = Math.max(2, Math.min(28, cw * 0.7));
  const y = v => T + (H - T - B) * (1 - v / max), y2 = v => T + (H - T - B) * (1 - v / tot), x = i => L + cw * i + cw / 2;
  let g = '<line class="kpg-ax" x1="' + L + '" y1="' + (H - B) + '" x2="' + (W - R) + '" y2="' + (H - B) + '"/>';
  g += '<text class="kpg-tx" x="' + (L - 4) + '" y="' + (y(max) + 4) + '" text-anchor="end">' + esc(nf(lang, max)) + '</text><text class="kpg-tx" x="' + (L - 4) + '" y="' + (H - B + 4) + '" text-anchor="end">0</text>';
  g += '<text class="kpg-tl" x="' + (W - R + 4) + '" y="' + (y2(tot) + 4) + '">' + esc(nf(lang, tot)) + '</text><text class="kpg-tx" x="' + (W - R + 4) + '" y="' + (y2(tot) + 17) + '">' + esc(t(lang, 'ch_tot')) + '</text>';
  const every = Math.max(1, Math.ceil(n / 8));
  S.forEach((s, i) => {
    if (s.added) { const h = (H - T - B) - (y(s.added) - T); g += '<rect class="kpg-b" x="' + (x(i) - bw / 2).toFixed(1) + '" y="' + y(s.added).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(1, h).toFixed(1) + '" rx="2"><title>' + esc(fdt(s.d, lang) + ': ' + nf(lang, s.added)) + '</title></rect>';
      if (cw >= 22) g += '<text class="kpg-tv" x="' + x(i).toFixed(1) + '" y="' + (y(s.added) - 4).toFixed(1) + '" text-anchor="middle">' + esc(nf(lang, s.added)) + '</text>'; }
    if (i % every === 0 || i === n - 1) g += '<text class="kpg-tx" x="' + x(i).toFixed(1) + '" y="' + (H - B + 16) + '" text-anchor="middle">' + esc(fdt(s.d, lang, true)) + '</text>';
  });
  g += '<polyline class="kpg-l" points="' + S.map((s, i) => x(i).toFixed(1) + ',' + y2(s.total).toFixed(1)).join(' ') + '"/>';
  const alt = tx(lang, 'ch_alt', { a: fdt(S[0].d, lang), b: fdt(S[n - 1].d, lang), n: nf(lang, tot) });
  return '<figure class="kpg-fig" dir="ltr"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(alt) + '"><title>' + esc(alt) + '</title>' + g + '</svg><figcaption dir="auto">' + esc(t(lang, 'ch_cap')) + '</figcaption></figure>';
}

// ------------------------------------------------------------------------------------------------ /progress/
const NUMS_L = { en: 'Kolaboro in numbers: figures to cite', es: 'Kolaboro en cifras: datos para citar', de: 'Kolaboro in Zahlen: zitierfähige Angaben', fr: 'Kolaboro en chiffres : données à citer', nl: 'Kolaboro in cijfers: gegevens om te citeren', ru: 'Kolaboro в цифрах: данные для цитирования', zh: 'Kolaboro 数据一览：可引用的数字', ar: 'Kolaboro بالأرقام: أرقام قابلة للاقتباس' };
function progressPage(D, lang, sm, smDay) {
  const L = D.live, S = D.series, now = day(new Date());
  const st = [stat(lang, L.projects, 'k_projects', srcA('/api/open/stats')), stat(lang, L.markets, 'k_markets', srcA('/api/open/stats')), stat(lang, L.countries, 'k_countries', srcA('/api/open/stats')),
    stat(lang, L.sources, 'k_sources', srcA('/data/bali-cases.json')), stat(lang, L.claims_total, 'k_claims', srcA('/data/bali-cases.json')), stat(lang, sm, 'k_sitemap', srcA('/sitemap_index.xml') + (smDay ? ' ' + esc(fdt(smDay, lang)) : '')),
    stat(lang, L.ships_7d, 'k_ships', srcA('/data/shipping.json')), stat(lang, L.deploys_7d, 'k_deploys', srcA('/data/deploys.json'))].join('');
  const cell = v => v == null ? '<td class="k-n k-muted">' + esc(t(lang, 'none')) + '</td>' : '<td class="k-n">' + esc(nf(lang, v)) + '</td>';
  const rows = S.slice().reverse().map(s => '<tr><th scope="row" data-label="' + esc(t(lang, 'c_day')) + '"><time datetime="' + s.d + '">' + esc(fdt(s.d, lang)) + '</time></th>' + [s.added, s.total, s.markets, s.countries, s.ships, s.deploys].map((v, i) => cell(v).replace('<td', '<td data-label="' + esc(t(lang, ['c_added', 'c_total', 'c_mk', 'c_co', 'c_ships', 'c_dep'][i])) + '"')).join('') + '</tr>').join('');
  const th = ['c_day', 'c_added', 'c_total', 'c_mk', 'c_co', 'c_ships', 'c_dep'].map((k, i) => '<th scope="col"' + (i ? ' class="k-n"' : '') + '>' + esc(t(lang, k)) + '</th>').join('');
  const sn = D.days.length ? '<div class="k-table-wrap"><table class="k-table k-table--dense k-table--stack"><thead><tr><th scope="col">' + esc(t(lang, 'c_day')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'c_src')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'c_cl')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'c_sm')) + '</th></tr></thead><tbody>' +
    D.days.slice(0, 60).map(r => '<tr><th scope="row"><time datetime="' + esc(r.d) + '">' + esc(fdt(r.d, lang)) + '</time></th>' + [r.sources, r.claims_total, r.sitemap_urls].map((v, i) => cell(v).replace('<td', '<td data-label="' + esc(t(lang, ['c_src', 'c_cl', 'c_sm'][i])) + '"')).join('') + '</tr>').join('') + '</tbody></table></div>' : '<p class="k-muted">' + esc(t(lang, 'sn_empty')) + '</p>';
  const c = D.cnt;
  const more = [['/changelog/', 'l_chg'], ['/shipping/', 'l_ship'], ['/metrics/', 'l_met'], ['/status/', 'l_stat']].map(([h, k]) => '<li><a href="' + h + '">' + esc(t(lang, k)) + '</a></li>').join('')
    + '<li><a href="' + pre(lang) + '/numbers/">' + esc(NUMS_L[lang] || NUMS_L.en) + '</a></li>';   // n26i: the citable figures page (kbx_numbers.js)
  const body = '<div class="kpg">' + head(lang, [[t(lang, 'chg_a'), pre(lang) + PROG_P]], esc(t(lang, 'p_h1')), esc(t(lang, 'p_lead')), '<p class="k-small k-muted">' + esc(tx(lang, 'p_asof', { d: fdt(now, lang) })) + '</p>') +
    '<div class="k-grid" id="today">' + st + '</div>' +
    '<h2 id="chart">' + esc(t(lang, 'ch_h')) + '</h2>' + chartSvg(lang, S) +
    '<h2 id="days">' + esc(t(lang, 'tb_h')) + '</h2><div class="k-table-wrap"><table class="k-table k-table--dense k-table--stack"><thead><tr>' + th + '</tr></thead><tbody>' + rows + '</tbody></table></div><p class="k-small k-muted">' + esc(t(lang, 'tb_note')) + '</p>' +
    '<h2 id="records">' + esc(t(lang, 'sn_h')) + '</h2><p>' + esc(t(lang, 'sn_d')) + '</p>' + sn +
    '<h2 id="improvements">' + esc(t(lang, 'imp_h')) + '</h2><p>' + esc(tx(lang, 'imp_p', { a: nf(lang, c.done), b: nf(lang, c.doing), c: nf(lang, c.next), d: nf(lang, c.planned) })) + '</p><p><a class="k-btn k-btn--primary" href="' + pre(lang) + IMP_P + '">' + esc(t(lang, 'imp_a')) + '</a></p>' +
    '<h2 id="method">' + esc(t(lang, 'mt_h')) + '</h2><ul>' + t(lang, 'mt').map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>' +
    '<h2>' + esc(t(lang, 'more_h')) + '</h2><ul>' + more + '<li><a href="' + pre(lang) + TEAM_P + '">' + esc(t(lang, 'l_team')) + '</a></li><li><a href="' + pre(lang) + PRESS_P + '">' + esc(t(lang, 'crumb_places')) + '</a></li></ul>' +
    '<p class="k-small"><a class="k-src" href="/api/x/progress">' + esc(t(lang, 'json')) + '</a> <a class="k-src" href="/data/progress.json">/data/progress.json</a> <span class="k-muted">CC BY 4.0</span></p></div></section></div>';
  const title = t(lang, 'p_title'), desc = t(lang, 'p_desc'), url = ORIGIN + pre(lang) + PROG_P;
  const ld = [{ '@type': 'WebPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: now, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'Dataset', name: title, description: desc, url, isAccessibleForFree: true, dateModified: now, license: 'https://creativecommons.org/licenses/by/4.0/', creator: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, temporalCoverage: (D.first || now) + '/' + now, distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/api/x/progress' }] },
    crumbLd(lang, [[t(lang, 'chg_a'), pre(lang) + PROG_P]])];
  return { path: PROG_P, title, desc, ld, body };
}

// ------------------------------------------------------------------------------------------------ /progress/improvements/
function improvementsPage(D, lang) {
  const c = D.cnt, txtLang = lang === 'es' ? 'es' : 'en';
  const secs = t(lang, 'sec');
  let list = '';
  for (let s = 1; s <= 10; s++) {
    const its = D.items.filter(i => i.s === s); if (!its.length) continue;
    const a = its[0].n, b = its[its.length - 1].n;
    list += '<section class="kpg-sec" id="s' + s + '"><h2>' + esc(secs[s - 1]) + ' <span class="k-muted k-small">(' + nf(lang, a) + '‑' + nf(lang, b) + ')</span></h2><ol class="kpg-it">' +
      its.map(i => '<li id="i' + i.n + '"><b>' + nf(lang, i.n) + '</b>' + badge(lang, i.st) + '<span' + (txtLang !== lang ? ' lang="en" dir="ltr"' : '') + '>' + esc(i[txtLang] || i.en) + '</span></li>').join('') + '</ol></section>';
  }
  const note = t(lang, 'i_note');
  const sum = esc(tx(lang, 'i_sum', { a: nf(lang, c.done), b: nf(lang, c.doing), c: nf(lang, c.next), d: nf(lang, c.planned) }));
  const nav = '<nav aria-label="' + esc(t(lang, 'crumb_imp')) + '"><ul class="k-cluster" style="list-style:none;padding:0">' + secs.map((x, i) => '<li><a href="#s' + (i + 1) + '">' + esc(x) + '</a></li>').join('') + '</ul></nav>';
  const body = '<div class="kpg">' + head(lang, [[t(lang, 'chg_a'), pre(lang) + PROG_P], [t(lang, 'crumb_imp'), pre(lang) + IMP_P]], esc(t(lang, 'i_h1')), esc(t(lang, 'i_lead')),
    '<p><b>' + sum + '</b></p><p class="k-small k-muted">' + esc(tx(lang, 'upd', { d: fdt(D.itemsUpd, lang) })) + (note ? ' ' + esc(note) : '') + '</p>') +
    '<h2>' + esc(t(lang, 'i_crit_h')) + '</h2><ol>' + t(lang, 'i_crit').map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>' + nav + list +
    '<p class="k-small"><a href="' + pre(lang) + PROG_P + '">' + esc(t(lang, 'chg_a')) + '</a> <a class="k-src" href="/data/progress.json">/data/progress.json</a></p></div></section></div>';
  const title = t(lang, 'i_title'), desc = t(lang, 'i_desc'), url = ORIGIN + pre(lang) + IMP_P;
  const ld = [{ '@type': 'WebPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: D.itemsUpd, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
    crumbLd(lang, [[t(lang, 'chg_a'), pre(lang) + PROG_P], [t(lang, 'crumb_imp'), pre(lang) + IMP_P]])];
  return { path: IMP_P, title, desc, ld, body };
}

// ------------------------------------------------------------------------------------------------ /press/places/
function pressPlaces(ix) {
  const out = [];
  for (const [s, pl] of ix.places) { if (s === 'sumba' || !pl.P || pl.L.some(r => r.sumba)) continue; out.push(pl); }
  return out.sort((a, b) => b.n - a.n || a.P.n.localeCompare(b.P.n));
}
function placeFigures(pl) {
  const L = pl.L, n = L.length, cnt = k => L.filter(r => r.comp[k] && r.comp[k].st === 'yes').length;
  return { n, dv: new Set(L.map(r => r.dvs || r.dv).filter(Boolean)).size, date: cnt('date'), permit: cnt('permit'), deposit: cnt('deposit'), location: cnt('location'), price: cnt('price'),
    moved: L.filter(r => ['moved', 'late'].includes(r.comp.record && r.comp.record.r)).length, past: L.filter(r => r.comp.record && r.comp.record.r === 'past').length, med: pl.ranked ? pl.med : null };
}
function pressHub(ix, lang) {
  const P = pressPlaces(ix).filter(pl => pl.n >= MIN_PRESS);
  const rows = P.map(pl => { const f = placeFigures(pl), nm = placeName(pl.P.n, lang);
    return '<tr><th scope="row" data-label="' + esc(t(lang, 'c_place')) + '"><a href="' + pre(lang) + PRESS_P + pl.P.s + '/">' + bdi(nm) + '</a></th><td class="k-n" data-label="' + esc(t(lang, 'c_n')) + '">' + nf(lang, f.n) + '</td><td class="k-n" data-label="' + esc(t(lang, 'c_date')) + '">' + nf(lang, pct(f.date, f.n)) + '%</td><td class="k-n" data-label="' + esc(t(lang, 'c_permit')) + '">' + nf(lang, pct(f.permit, f.n)) + '%</td></tr>'; }).join('');
  const body = '<div class="kpg">' + head(lang, [[t(lang, 'crumb_press'), '/press/'], [t(lang, 'crumb_places'), pre(lang) + PRESS_P]], esc(t(lang, 'r_hub_h1')), esc(t(lang, 'r_hub_lead')), '<p class="k-small k-muted">' + esc(tx(lang, 'upd', { d: fdt(ix.updated, lang) })) + '</p>') +
    '<div class="k-table-wrap"><table class="k-table k-table--stack"><thead><tr><th scope="col">' + esc(t(lang, 'c_place')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'c_n')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'c_date')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'c_permit')) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<ul><li><a href="' + pre(lang) + '/rankings/transparency/">' + esc(t(lang, 'l_ranks')) + '</a></li><li><a href="' + pre(lang) + '/methods/transparency-score/">' + esc(t(lang, 'l_method')) + '</a></li><li><a href="/press/">' + esc(t(lang, 'l_kit')) + '</a></li></ul><p class="k-small">' + esc(t(lang, 'r_contact')) + '</p></div></section></div>';
  const title = t(lang, 'r_hub_title'), desc = t(lang, 'r_hub_desc'), url = ORIGIN + pre(lang) + PRESS_P;
  const ld = [{ '@type': 'WebPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: ix.updated, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } }, crumbLd(lang, [[t(lang, 'crumb_press'), '/press/'], [t(lang, 'crumb_places'), pre(lang) + PRESS_P]])];
  return { path: PRESS_P, title, desc, ld, body };
}
function pressPlace(ix, slug, lang) {
  const pl = pressPlaces(ix).find(x => x.P.s === slug); if (!pl || pl.n < MIN_PRESS) return null;
  const f = placeFigures(pl), nm = placeName(pl.P.n, lang), d = ix.updated, path = PRESS_P + slug + '/', url = ORIGIN + pre(lang) + path;
  const P = bdi(nm), D = esc(fdt(d, lang)), of = (a, b) => te(lang, 'of', { n: nf(lang, a), m: nf(lang, b) }) + ' <span class="k-muted">(' + nf(lang, pct(a, b)) + '%)</span>';
  const src = srcA(pre(lang) + '/rankings/transparency/' + slug + '/', t(lang, 'src'));
  const fig = (k, v) => '<div class="kpg-st"><b>' + v + '</b><span>' + esc(t(lang, k)) + '</span></div>';
  const figs = fig('f_n', nf(lang, f.n)) + fig('f_dev', nf(lang, f.dv)) + fig('f_date', of(f.date, f.n)) + fig('f_permit', of(f.permit, f.n)) + fig('f_dep', of(f.deposit, f.n)) + fig('f_loc', of(f.location, f.n)) + fig('f_price', of(f.price, f.n)) + fig('f_moved', of(f.moved, f.n)) + fig('f_past', of(f.past, f.n)) + (f.med != null ? fig('f_med', nf(lang, f.med) + ' <span class="k-muted">/ 100</span>') : '');
  const q = [te(lang, 'q_n', { n: nf(lang, f.n), p: P, dv: nf(lang, f.dv), d: D }), te(lang, 'q_date', { n: nf(lang, f.date), m: nf(lang, f.n), p: P, x: nf(lang, pct(f.date, f.n)) }), te(lang, 'q_permit', { n: nf(lang, f.permit), m: nf(lang, f.n), x: nf(lang, pct(f.permit, f.n)) }),
    te(lang, 'q_dep', { n: nf(lang, f.deposit), m: nf(lang, f.n), x: nf(lang, pct(f.deposit, f.n)) }), te(lang, 'q_moved', { n: nf(lang, f.moved), m: nf(lang, f.n) }), te(lang, 'q_past', { n: nf(lang, f.past), m: nf(lang, f.n) })];
  if (f.med != null) q.push(te(lang, 'q_med', { p: P, s: nf(lang, f.med) }));
  const cite = te(lang, 'cite_t', { p: P, d: D, u: '<bdi>' + esc(url) + '</bdi>' });
  const body = '<div class="kpg">' + head(lang, [[t(lang, 'crumb_press'), '/press/'], [t(lang, 'crumb_places'), pre(lang) + PRESS_P], [nm, pre(lang) + path]], te(lang, 'r_h1', { p: P }), te(lang, 'r_lead', { p: P, d: D })) +
    '<div class="k-grid">' + figs + '</div><p class="k-small">' + src + ' <span class="k-muted">' + esc(tx(lang, 'upd', { d: fdt(d, lang) })) + '</span></p>' +
    '<h2 id="quotes">' + esc(t(lang, 'q_h')) + '</h2><ul class="kpg-q">' + q.map(x => '<li><blockquote>' + x + '</blockquote></li>').join('') + '</ul>' +
    '<h2 id="cite">' + esc(t(lang, 'cite_h')) + '</h2><p class="kpg-cite">' + cite + '</p>' +
    '<h2 id="sources">' + esc(t(lang, 'rs_h')) + '</h2><ul>' + t(lang, 'rs').map(s => '<li>' + esc(fill(s, { d: fdt(d, lang) })) + '</li>').join('') + '</ul>' +
    '<ul><li><a href="' + pre(lang) + '/rankings/transparency/' + slug + '/">' + te(lang, 'l_rank', { p: P }) + '</a></li><li><a href="' + pre(lang) + '/methods/transparency-score/">' + esc(t(lang, 'l_method')) + '</a></li><li><a href="/api/x/transparency/' + slug + '">' + esc(t(lang, 'json')) + '</a></li><li><a href="' + pre(lang) + PRESS_P + '">' + esc(t(lang, 'l_all')) + '</a></li><li><a href="/press/">' + esc(t(lang, 'l_kit')) + '</a></li></ul>' +
    '<p class="k-small">' + esc(t(lang, 'r_contact')) + '</p></div></section></div>';
  const title = tx(lang, 'r_title', { p: nm }), desc = tx(lang, 'r_desc', { p: nm, n: nf(lang, f.n), d: fdt(d, lang) });
  const ld = [{ '@type': 'WebPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: d, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'Dataset', name: title, description: desc, url, isAccessibleForFree: true, dateModified: d, license: 'https://creativecommons.org/licenses/by/4.0/', creator: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, spatialCoverage: { '@type': 'Place', name: pl.P.n }, distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/api/x/transparency/' + slug }] },
    crumbLd(lang, [[t(lang, 'crumb_press'), '/press/'], [t(lang, 'crumb_places'), pre(lang) + PRESS_P], [nm, pre(lang) + path]])];
  return { path, title, desc, ld, body };
}

// ------------------------------------------------------------------------------------------------ /moderation/ and /team/
const linkList = (lang, L) => '<ul>' + L.map(([h, k]) => '<li><a href="' + h + '">' + esc(t(lang, k)) + '</a></li>').join('') + '</ul>';
function moderationPage(lang) {
  const secs = t(lang, 'mo').map(([h, ps], i) => '<h2 id="m' + (i + 1) + '">' + esc(h) + '</h2>' + (ps.length > 2 ? '<ul>' + ps.map(p => '<li>' + esc(p) + '</li>').join('') + '</ul>' : ps.map(p => '<p>' + esc(p) + '</p>').join(''))).join('');
  const body = '<div class="kpg">' + head(lang, [[t(lang, 'mo_h1'), pre(lang) + MOD_P]], esc(t(lang, 'mo_h1')), esc(t(lang, 'mo_lead')), '<p class="k-small k-muted"><time datetime="' + REVIEWED + '">' + esc(tx(lang, 'rev', { d: fdt(REVIEWED, lang) })) + '</time></p>') +
    '<div class="k-prose">' + secs + '<h2>' + esc(t(lang, 'mo_links')) + '</h2>' + linkList(lang, [['/corrections/', 'l_corr'], ['/independence/', 'l_ind'], ['/developers/reply/', 'l_reply'], ['/buyer-reports/', 'l_rep'], [pre(lang) + TEAM_P, 'l_team']]) + '</div></div></section></div>';
  const title = t(lang, 'mo_title'), desc = t(lang, 'mo_desc'), url = ORIGIN + pre(lang) + MOD_P;
  return { path: MOD_P, title, desc, body, ld: [{ '@type': 'WebPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: REVIEWED, lastReviewed: REVIEWED, publisher: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' } }, crumbLd(lang, [[t(lang, 'mo_h1'), pre(lang) + MOD_P]])] };
}
const FOUNDERS = [['Carlos de Ory', 'r_ceo'], ['Ignacio Hojas García-Plaza', 'r_co']];   // exactly as published on /about/
function teamPage(lang) {
  const how = '<ol class="k-steps">' + t(lang, 'tm_how').map(([h, p]) => '<li><b>' + esc(h) + '</b><p>' + esc(p) + '</p></li>').join('') + '</ol>';
  const ab = lang === 'en' || lang === 'es' ? pre(lang) + '/about/' : '/about/';
  const body = '<div class="kpg">' + head(lang, [[t(lang, 'tm_h1'), pre(lang) + TEAM_P]], esc(t(lang, 'tm_h1')), esc(t(lang, 'tm_lead')), '<p class="k-small k-muted"><time datetime="' + REVIEWED + '">' + esc(tx(lang, 'rev', { d: fdt(REVIEWED, lang) })) + '</time></p>') +
    '<div class="k-prose"><h2 id="who">' + esc(t(lang, 'tm_who_h')) + '</h2><p>' + esc(t(lang, 'tm_who_p')) + '</p><ul>' + FOUNDERS.map(([n, r]) => '<li><b>' + bdi(n) + '</b>: ' + esc(t(lang, r)) + '</li>').join('') + '</ul><p><a class="k-src" href="' + ab + '">' + esc(t(lang, 'l_about')) + '</a></p><p>' + esc(t(lang, 'tm_agents')) + '</p>' +
    '<h2 id="legal">' + esc(t31(lang, 'tm_legal_h')) + '</h2><p>' + esc(t31(lang, 'tm_legal')) + '</p>' +   // n31b (item 74)
    '<h2 id="method">' + esc(t(lang, 'tm_how_h')) + '</h2>' + how +
    '<h2 id="roles">' + esc(t(lang, 'tm_roles_h')) + '</h2><ul>' + t(lang, 'tm_roles').map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
    '<h2 id="not">' + esc(t(lang, 'tm_not_h')) + '</h2><ul>' + t(lang, 'tm_not').map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
    // n27t (batch 27): who pays for Kolaboro and the conflicts of interest, from what /pricing/, /independence/ and the footer already say
    '<h2 id="funding">' + esc(t27(lang, 'tm_fund_h')) + '</h2><ul>' + t27(lang, 'tm_fund').map(x => '<li>' + esc(x) + '</li>').join('') + '</ul><p><a class="k-src" href="' + pre(lang) + '/pricing/">' + esc(t27(lang, 'l_price')) + '</a></p>' +
    '<h2 id="conflicts">' + esc(t27(lang, 'tm_coi_h')) + '</h2><ul>' + t27(lang, 'tm_coi').map(x => '<li>' + esc(x) + '</li>').join('') + '</ul><p><a class="k-src" href="/independence/">' + esc(t27(lang, 'l_ind')) + '</a> · <a class="k-src" href="' + pre(lang) + '/conflicts-of-interest/">' + esc(t31(lang, 'l_coi')) + '</a> · <a class="k-src" href="' + pre(lang) + '/contact/">' + esc(t27(lang, 'l_contact')) + '</a> · <a class="k-src" href="' + pre(lang) + '/corrections/">' + esc(t27(lang, 'l_corr')) + '</a></p>' +
    '<h2 id="review">' + esc(t(lang, 'tm_rev_h')) + '</h2><p>' + esc(tx(lang, 'tm_rev', { d: fdt(REVIEWED, lang) })) + '</p>' +
    linkList(lang, [[pre(lang) + '/how-we-score/', 'l_score'], [pre(lang) + '/methods/transparency-score/', 'l_tsm'], ['/registers/', 'l_reg'], [pre(lang) + MOD_P, 'l_mod'], ['/independence/', 'l_ind'], ['/corrections/', 'l_corr'], ['/changelog/', 'l_chg']]) +
    // n29e (batch 29): editorial policy, daily process and sources per country
    '<p>' + [['/editorial-policy/', 'l_ep'], ['/how-we-work/', 'l_hw'], ['/sources/', 'l_src']].map(([h, k]) => '<a href="' + pre(lang) + h + '">' + esc(e29t(lang, k)) + '</a>').join(' · ') + '</p></div></div></section></div>';
  const title = t(lang, 'tm_title'), desc = t(lang, 'tm_desc'), url = ORIGIN + pre(lang) + TEAM_P;
  return { path: TEAM_P, title, desc, body, ld: [{ '@type': 'AboutPage', '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: REVIEWED, lastReviewed: REVIEWED, about: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/', founder: FOUNDERS.map(([n]) => ({ '@type': 'Person', name: n })) } }, crumbLd(lang, [[t(lang, 'tm_h1'), pre(lang) + TEAM_P]])] };
}

// ------------------------------------------------------------------------------------------------ page entry
const BODY = new Map();
export async function page(req, u, env, ctx, shell, inner) {
  if (PATHS.test(u.pathname)) return api(req, u, env, inner, ctx);
  if (u.pathname === SITEMAP) return new Response(await sitemapXml(env), { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
  const m = u.pathname.match(PAGE_RX); if (!m || !shell) return null;
  if (!m[3]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
  const lang = m[1] || 'en', kind = m[2];
  let pg = null;
  if (kind === 'moderation' || kind === 'team') { const k = lang + '|' + kind; pg = BODY.get(k); if (!pg) { pg = kind === 'team' ? teamPage(lang) : moderationPage(lang); BODY.set(k, pg); } }
  else if (kind.startsWith('press/places')) {
    let ix; try { ix = await trData(env); } catch (e) { return null; }
    const slug = kind.split('/')[2] || null, k = lang + '|p|' + (slug || '#') + '|' + ix.v;
    pg = BODY.get(k); if (!pg) { pg = slug ? pressPlace(ix, slug, lang) : pressHub(ix, lang); if (!pg) return null; if (BODY.size > 900) BODY.clear(); BODY.set(k, pg); }
  } else {
    let D; try { D = await progData(env, inner); } catch (e) { return null; }
    if (kind === 'progress') { const sm = await sitemapUrls(env, inner, ctx); const rec = sm == null && D.days[0] && D.days[0].sitemap_urls ? D.days[0] : null; pg = progressPage(D, lang, sm != null ? sm : rec ? rec.sitemap_urls : null, rec && rec.d); }
    else pg = improvementsPage(D, lang);
  }
  return trustRender(lang, pg, shell);
}
// n27t (batch 27): the same page frame for the trust pages of kbx_t27.js (/corrections/, /buyer-cases/, /cite/, /contact/, /transparency-badge/)
export async function trustRender(lang, pg, shell) {
  const sh = await shell(pre(lang) + '/how-we-score/');
  const url = ORIGIN + pre(lang) + pg.path, alts = LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + pg.path + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + pg.path + '">';
  const tags = '<title>' + esc(pg.title) + ([...pg.title].length + 11 <= 60 ? ' | Kolaboro' : '') + '</title><meta name="description" content="' + esc(pg.desc) + '"><link rel="canonical" href="' + url + '">' + alts + '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">' +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="Kolaboro"><meta property="og:title" content="' + esc(pg.title) + '"><meta property="og:description" content="' + esc(pg.desc) + '"><meta property="og:url" content="' + url + '"><meta property="og:image" content="' + ogImg(url) + '"><meta name="twitter:card" content="summary_large_image">' +
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
  return new Response(await res.text(), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=' + (pg.ttl || 600) } });
}

async function sitemapXml(env) {
  const paths = [PROG_P, IMP_P, MOD_P, TEAM_P, PRESS_P];
  let lm = { [PROG_P]: day(new Date()), [IMP_P]: '2026-11-13', [MOD_P]: REVIEWED, [TEAM_P]: REVIEWED, [PRESS_P]: null };
  try { const ix = await trData(env); lm[PRESS_P] = ix.updated; for (const pl of pressPlaces(ix)) if (pl.n >= MIN_PRESS) { paths.push(PRESS_P + pl.P.s + '/'); lm[PRESS_P + pl.P.s + '/'] = ix.updated; } } catch (e) {}
  try { const p = await opt(env, 'progress.json'); if (p && p.items_updated) lm[IMP_P] = p.items_updated; } catch (e) {}
  // n27t (batch 27): the trust pages of kbx_t27.js
  for (const p of ['/corrections/', '/buyer-cases/', '/cite/', '/contact/', '/transparency-badge/']) { paths.push(p); lm[p] = REVIEWED; }
  // n31b (batch 31): case studies, conflicts of interest, limits, data removal, fraud tips, transparency report, register copies, score history (kbx_n31b.js)
  for (const p of ['/case-studies/', '/case-studies/aykon-city-3/', '/conflicts-of-interest/', '/what-we-cannot-know/', '/data-removal/', '/report-fraud/', '/transparency-report/2026/', '/registers/captures/', '/score-history/']) { paths.push(p); lm[p] = '2026-11-18'; }
  // n29e (batch 29): editorial policy, how we work, sources, buyer protection compared, foreign buyers compared (kbx_e29.js)
  for (const p of ['/editorial-policy/', '/how-we-work/', '/sources/', '/buyer-protection-law/', '/countries/foreign-buyers/']) { paths.push(p); lm[p] = E29_REV; }
  try { const c = await opt(env, 'corrections.json'); if (c && c.updated) lm['/corrections/'] = c.updated; } catch (e) {}
  if (lm[PRESS_P]) lm['/transparency-badge/'] = lm[PRESS_P];
  const x = paths.flatMap(p => LANGS.map(l => '<url><loc>' + ORIGIN + pre(l) + p + '</loc>' + (lm[p] ? '<lastmod>' + lm[p] + '</lastmod>' : '') + LANGS.map(a => '<xhtml:link rel="alternate" hreflang="' + a + '" href="' + ORIGIN + pre(a) + p + '"/>').join('') + '<xhtml:link rel="alternate" hreflang="x-default" href="' + ORIGIN + p + '"/></url>'));
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + x.join('\n') + '\n</urlset>\n';
}

// ------------------------------------------------------------------------------------------------ JSON API (routed with the pages in index.js)
async function api(req, u, env, inner, ctx) {
  const H = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' };
  if (req.method !== 'GET' && req.method !== 'HEAD') return new Response(JSON.stringify({ error: 'method' }), { status: 405, headers: Object.assign({}, H, { 'cache-control': 'no-store' }) });
  let D; try { D = await progData(env, inner); } catch (e) { return new Response(JSON.stringify({ error: 'not_built_yet' }), { status: 503, headers: Object.assign({}, H, { 'cache-control': 'no-store' }) }); }
  const sm = await sitemapUrls(env, inner, ctx, true), L = D.live, now = new Date();
  if (/\/today\/?$/.test(u.pathname)) return new Response(JSON.stringify({ d: day(now), at: now.toISOString().slice(0, 19) + 'Z', projects: L.projects, markets: L.markets, countries: L.countries, sources: L.sources, claims_total: L.claims_total, data_points: L.data_points, sitemap_urls: sm, ships_7d: L.ships_7d, deploys_7d: L.deploys_7d, data_updated: L.data_updated }), { headers: Object.assign({}, H, { 'cache-control': 'no-store' }) });
  return new Response(JSON.stringify({ page: ORIGIN + PROG_P, licence: 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)', at: now.toISOString().slice(0, 19) + 'Z',
    live: Object.assign({ sitemap_urls: sm }, L), per_day: D.series, daily_records: D.days, improvements: { updated: D.itemsUpd, counts: D.cnt, page: ORIGIN + IMP_P, file: ORIGIN + '/data/progress.json' },
    method: { projects_per_day: 'field "ad" of /data/named.json (date each project entered the index); markets and countries per day counted from the projects added up to that day', changes_shipped: '/data/shipping.json (commits that changed the live site)', deploys: '/data/deploys.json (pushes the deploy guard saw live and checked; kept since ' + (D.depFirst || 'n/a') + ')', sitemap_urls: 'counted live from every sitemap listed in /sitemap_index.xml' } }, null, 1), { headers: H });
}

export { progressPage, improvementsPage, pressHub, pressPlace, moderationPage, teamPage, chartSvg };   // for the local test
