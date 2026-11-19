// kolaboro.com batch 19 (agent n19b, 9 Nov 2026): money reality near the site. No model calls, nothing stored about visitors.
//   (3) Short-let reality check: Inside Airbnb listings (CC BY 4.0) within 1 km of the pin, for the cities Inside Airbnb covers:
//       counts by room type, nightly price quartiles of entire homes, Inside Airbnb's own occupancy and revenue estimates, next
//       to the rental yield or return figures printed on the page we track (quoted from our dated sealed copy).
//       Data: /data/short-lets.json (aggregates only, at least 10 listings per figure; no listing, host or review data).
//   (4) Recorded sale prices within 1 km from official open registers: HM Land Registry Price Paid (England and Wales, OGL v3.0),
//       France DVF geolocated (Licence Ouverte 2.0), NYC rolling sales (NYC Open Data); median, quartiles, price per m2 where the
//       register publishes floor area, versus the developer's own headline price (/data/price-history.json, same currency only).
//       Data: /data/sales-nearby.json. Both files are built on main by .github/workflows/kolaboro-money-nearby.yml
//       (tools/kolaboro-agent/money_nearby.py). Market-wide comparisons stay on /prices/ (kbx_h.js, price-reality.json).
// Routes:
//   GET /api/x/money/            coverage summary
//   GET /api/x/money/<ID>        short lets and recorded sales near one named project (public JSON)
import { TB } from './kbx_strings.js';   // n32w: string tables loaded as static JSON (worker size limit)
import { rulesData, rulesHtml, rulesJson, RULES_CSS } from './kbx_rules.js';   // batch 21 (n21c): short-let rules next to the short-let figures
const ORIGIN = 'https://kolaboro.com';
export const PATHS = /^\/api\/x\/money(\/|$)/;
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ltr = s => '<bdi dir="ltr">' + esc(s) + '</bdi>';
const OPINION = /\b(scam\w*|fraud\w*|ponzi|swindl\w*|rip-?off|avoid\w*|beware|dodgy|shady|crook\w*|estafa\w*|fraude\w*|betrug\w*|arnaque\w*|escroc\w*|oplicht\w*|bedrog\w*)\b|мошен|обман|骗局|诈骗|احتيال/i;
const MASK = s => String(s || '').replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[e-mail]').replace(/\+?\d[\d ()-]{8,}\d/g, m => /\d{1,3}([.,\s]\d{3}){2,}/.test(m) ? m : '[phone]');

let MEMO = {};
async function loadOne(env, path) {
  const m = MEMO[path]; if (m && Date.now() - m.t < 600000) return m.v;
  let r = null;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com' + path)); } catch (e) { r = null; }
  if (!r || !r.ok) { try { r = await fetch(ORIGIN + path + '?v=' + Math.floor(Date.now() / 600000), { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
  const v = r && r.ok ? await r.json().catch(() => null) : null;
  MEMO[path] = { t: Date.now(), v }; return v;
}
export async function moneyData(env) {
  const [sl, sn, ru] = await Promise.all([loadOne(env, '/data/short-lets.json'), loadOne(env, '/data/sales-nearby.json'), rulesData(env).catch(() => null)]);   // ru: n21c
  return { sl, sn, ru, v: ((sl && sl.updated) || '') + '/' + ((sn && sn.updated) || '') };
}

// ------------------------------------------------------------------------------------------------ strings (8 languages)
const S = TB.kbx_money_S /* n32w (19 Nov 2026): table moved to /data/i18n/kbx_money.json, filled by kbx_strings.js before any kolaboro.com request is handled */;
const t = (lang, k, v) => { const s = (S[lang] && S[lang][k] != null) ? S[lang][k] : S.en[k]; return v && typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
export const moneyToc = lang => t(lang, 'toc');
export const moneyHeading = lang => t(lang, 'h');
// n20p: one formatter per locale and options for the life of the isolate (building one per call cost most of the render time)
const dtf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'd' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.DateTimeFormat(L, o)); };
const nmf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'n' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.NumberFormat(L, o)); };
const fdt = (d, l) => { try { return dtf(LOC[l] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(String(d).slice(0, 10) + 'T00:00:00Z')); } catch (e) { return String(d || ''); } };
const fnum = (n, l) => { try { return nmf(LOC[l] || 'en-GB', { maximumFractionDigits: 0 }).format(n); } catch (e) { return String(n); } };
const fcur = (n, cur, l) => { if (n == null) return '-'; try { return nmf(LOC[l] || 'en-GB', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n); } catch (e) { return (cur || '') + ' ' + fnum(n, l); } };
// values go in as plain text, then numbers are wrapped in <bdi> so they read left to right on Arabic pages
const fill = (lang, k, v) => { const raw = {}, mark = {}; let i = 0; for (const [a, b] of Object.entries(v || {})) { const key = '\u0001' + (i++) + '\u0002'; raw[a] = key; mark[key] = b; } let s = esc(t(lang, k, raw)); for (const [key, b] of Object.entries(mark)) s = s.split(esc(key)).join(typeof b === 'object' && b && b.html ? b.html : ltr(b)); return s; };
const H = s => ({ html: s });
const ok = st => st && st.p50 != null;
const copyHref = (x, kind, ref, url) => kind === 'ia' ? 'https://web.archive.org/web/' + ref + '/' + url : '/projects/' + x.s + '/changes/' + ref + '.txt';

// ------------------------------------------------------------------------------------------------ short lets (3)
function shortletHtml(sl, x, lang) {
  const r = sl && sl.projects && sl.projects[x.id];
  if (!r || r.outside) return '';
  const ds = (sl.datasets || {})[r.ds] || {}, cur = r.cur || ds.currency, city = ds.city || '', d = fdt(ds.date, lang), e = r.e || {}, P = v => fcur(v, cur, lang);
  const src = '<a class="k-src" href="https://insideairbnb.com/get-the-data/" rel="noopener" target="_blank">' + esc(t(lang, 'sl_src', { city, d })) + '</a>';
  let h = '<h3>' + esc(t(lang, 'sl_h')) + '</h3>';
  if (r.claim && r.claim.q && r.claim.q.length) {
    const qs = r.claim.q.filter(q => !OPINION.test(q));
    if (qs.length) h += '<p class="kmo-l">' + esc(t(lang, 'sl_claim', { d: fdt(r.claim.d, lang) })) + '</p>' + qs.map(q => '<blockquote class="kmo-q" dir="auto">' + esc(MASK(q)) + '</blockquote>').join('') +
      '<p class="k-small"><a class="k-src" href="' + esc(copyHref(x, 'copy', r.claim.sha)) + '">' + esc(t(lang, 'sl_copy')) + '</a></p>';
  }
  else if (r.nocl) h += '<p class="kfact k-muted">' + esc(t(lang, 'sl_noclaim', { d: fdt(r.nocl, lang) })) + '</p>';
  if ((r.n || 0) < (sl.min_n || 10)) return h + '<p class="kfact k-muted">' + fill(lang, 'sl_few', { m: sl.min_n || 10, city, d }) + ' ' + src + '</p>';
  const rt = r.rt || {}, rooms = (rt['Private room'] || 0) + (rt['Shared room'] || 0) + (rt['Hotel room'] || 0);
  const L = [];
  L.push(fill(lang, 'sl_n', { city, d, n: fnum(r.n, lang), e: fnum(e.n || 0, lang), o: fnum(rooms, lang) }));
  if (ok(e.price)) L.push(fill(lang, 'sl_price', { p50: P(e.price.p50), p25: P(e.price.p25), p75: P(e.price.p75), n: fnum(e.price.n, lang) }));
  if (e.n) L.push(fill(lang, 'sl_act', { a: fnum(e.act || 0, lang), e: fnum(e.n, lang) }));
  if (ok(e.occ)) L.push(fill(lang, 'sl_occ', { p50: fnum(e.occ.p50, lang), pct: Math.round(e.occ.p50 / 365 * 100), n: fnum(e.occ.n, lang) }));
  if (ok(e.rev)) L.push(fill(lang, 'sl_rev', { p50: P(e.rev.p50), p25: P(e.rev.p25), p75: P(e.rev.p75) }));
  if (e.n && e.lic != null) L.push(fill(lang, 'sl_lic', { l: fnum(Math.min(e.lic, r.n), lang), n: fnum(r.n, lang) }));
  h += '<ul class="fl">' + L.map(s => '<li class="kfact">' + s + '</li>').join('') + '</ul>';
  const br = ['0-1', '2', '3+'].filter(g => e.br && ok(e.br[g])).map(g => [g, e.br[g]]);
  if (br.length) {
    const th = t(lang, 'sl_br_h');
    h += '<div class="k-table-wrap kmo-tw"><table class="k-table k-table--dense"><caption class="k-small k-muted">' + esc(t(lang, 'sl_br')) + '</caption><thead><tr><th scope="col">' + esc(th[0]) + '</th><th scope="col" class="k-n">' + esc(th[1]) + '</th><th scope="col" class="k-n">' + esc(th[2]) + '</th></tr></thead><tbody>' +
      br.map(([g, v]) => '<tr><th scope="row">' + esc(g === '0-1' ? t(lang, 'sl_br0') : g) + '</th><td class="k-n">' + ltr(fnum(v.n, lang)) + '</td><td class="k-n">' + ltr(P(v.p50)) + '</td></tr>').join('') + '</tbody></table></div>';
  }
  h += '<p class="k-small k-muted">' + esc(t(lang, 'sl_lim')) + ' ' + src + ' <a class="k-src" href="https://insideairbnb.com/data-assumptions/" rel="noopener" target="_blank">' + esc(t(lang, 'sl_method')) + '</a></p>';
  return h;
}

// ------------------------------------------------------------------------------------------------ recorded sales (4)
const ROWS = { hmlr: [['all', 'so_all'], ['flat', 'so_flat'], ['new', 'so_new'], ['new_flat', 'so_newflat']], dvf: [['all', 'so_all'], ['apt', 'so_apt'], ['house', 'so_house'], ['new', 'so_vefa']], nyc: [['all', 'so_all'], ['condo', 'so_condo'], ['coop', 'so_coop'], ['home', 'so_home']] };
function soldHtml(sn, x, lang) {
  const r = sn && sn.projects && sn.projects[x.id];
  if (!r) return '';
  let h = '<h3>' + esc(t(lang, 'so_h')) + '</h3>';
  if (r.skip) return r.skip === 'scotland' ? h + '<p class="kfact k-muted">' + esc(t(lang, 'so_skip')) + '</p>' : '';   // pin outside the register's area or not in the project's city: nothing to show
  const reg = (sn.registers || {})[r.reg]; if (!reg) return '';
  const cur = r.cur, P = v => fcur(v, cur, lang), m = sn.min_n || 10;
  const regA = '<a href="' + esc(reg.url) + '" rel="noopener" target="_blank">' + esc(reg.name) + '</a>';
  if (!r.all || !ok(r.all)) return h + '<p class="kfact k-muted">' + fill(lang, 'so_few', { m }) + ' ' + regA + '</p>';
  h += '<p class="kfact">' + fill(lang, 'so_reg', { reg: H(regA), a: fdt(r.from, lang), b: fdt(r.to, lang) }) + '</p>';
  const th = t(lang, 'so_th');
  const rows = (ROWS[r.reg] || []).filter(([k]) => r[k] && r[k].n);
  h += '<div class="k-table-wrap kmo-tw"><table class="k-table k-table--dense"><thead><tr><th scope="col">' + esc(th[0]) + '</th><th scope="col" class="k-n">' + esc(th[1]) + '</th><th scope="col" class="k-n">' + esc(th[2]) + '<br><small class="k-muted">' + esc(th[3]) + '</small></th></tr></thead><tbody>' +
    rows.map(([k, lbl]) => { const s = r[k]; return '<tr><th scope="row">' + esc(t(lang, lbl)) + '</th><td class="k-n">' + ltr(fnum(s.n, lang)) + '</td><td class="k-n">' + (ok(s) ? '<b>' + ltr(P(s.p50)) + '</b><br><small class="k-muted">' + ltr(P(s.p25)) + ' - ' + ltr(P(s.p75)) + '</small>' : '<span class="k-muted">-</span>') + '</td></tr>'; }).join('') + '</tbody></table></div>';
  const L = [];
  if (r.reg === 'dvf') {
    if (ok(r.m2)) L.push(fill(lang, 'so_m2', { p50: P(r.m2.p50), p25: P(r.m2.p25), p75: P(r.m2.p75), n: fnum(r.m2.n, lang) }));
    if (ok(r.new_m2)) L.push(fill(lang, 'so_m2_new', { p50: P(r.new_m2.p50), n: fnum(r.new_m2.n, lang) }));
  } else if (r.reg === 'nyc') { if (ok(r.home_m2)) L.push(fill(lang, 'so_m2_home', { p50: P(r.home_m2.p50), n: fnum(r.home_m2.n, lang) })); }
  else L.push(esc(t(lang, 'so_nom2')));
  if (r.dev && r.dev.v) {
    const a = '<a class="k-src" href="' + esc(copyHref(x, r.dev.src, r.dev.ref, x.url)) + '"' + (r.dev.src === 'ia' ? ' rel="nofollow noopener" target="_blank"' : '') + '>' + esc(t(lang, 'sl_copy')) + '</a>';
    let s = fill(lang, 'so_dev', { p: r.dev.p || P(r.dev.v), d: fdt(r.dev.d, lang) });
    if (r.dev.below_pct != null) s += ' ' + fill(lang, 'so_below', { pct: r.dev.below_pct, what: H(esc(t(lang, 'so_what_' + (r.dev.vs || 'all')))) }).replace(/\s{2,}/g, ' ');
    L.push(s + ' ' + a);
  }
  if (r.dev_m2 && r.dev_m2.v) {
    const a = '<a class="k-src" href="' + esc(copyHref(x, r.dev_m2.src, r.dev_m2.ref, x.url)) + '"' + (r.dev_m2.src === 'ia' ? ' rel="nofollow noopener" target="_blank"' : '') + '>' + esc(t(lang, 'sl_copy')) + '</a>';
    L.push(fill(lang, 'so_dev_m2', { p: r.dev_m2.p || P(r.dev_m2.v), u: H(r.dev_m2.unit === 'sqft' ? fill(lang, 'so_sqft', { m2: P(r.dev_m2.m2) }) : ''), d: fdt(r.dev_m2.d, lang) }) + ' ' + a);
  }
  if (L.length) h += '<ul class="fl">' + L.map(s => '<li class="kfact">' + s + '</li>').join('') + '</ul>';
  const geo = reg.geo ? ' <a class="k-src" href="' + esc(reg.geo.url) + '" rel="noopener" target="_blank">' + esc(reg.geo.name) + '</a>' : '';
  h += '<p class="k-small k-muted">' + esc(t(lang, 'so_lim')) + ' ' + esc(reg.credit || '') + ' <a class="k-src" href="' + esc(reg.licence_url) + '" rel="noopener" target="_blank">' + esc(reg.licence) + '</a>' + geo + '</p>';
  return h;
}

export const MONEY_CSS = '.kmo-q{margin:8px 0;padding:6px 14px;border-inline-start:3px solid var(--k-line-2,var(--line));color:var(--k-ink-2,var(--ink));font-size:var(--k-fs-sm,15px);overflow-wrap:anywhere}.kmo-l{margin:12px 0 4px;font-weight:600}' +
  '.kmo-tw{margin:12px 0;max-width:640px;overflow-x:auto}.kmo-tw caption{text-align:start;padding:0 0 6px;caption-side:top}.kmo-tw .k-n{text-align:end;white-space:nowrap}.kmo-tw th[scope=row]{min-width:0}@media (max-width:480px){.kmo-tw th,.kmo-tw td{padding-inline:8px}}.kmo .fl{overflow-wrap:anywhere}';

// whole section body for the named page ('' when nothing near this project)
export function moneyHtml(md, x, lang) {
  if (!md) return '';
  const a = shortletHtml(md.sl, x, lang), b = soldHtml(md.sn, x, lang);
  const slr = md.sl && md.sl.projects && md.sl.projects[x.id], c = md.ru ? rulesHtml(md.ru, x, lang, slr && !slr.outside ? slr.ds : null) : '';   // n21c: can you legally short-let here
  if (!a && !b && !c) return '';
  if (!a && !b) return '<style>' + RULES_CSS + '</style><div class="kmo">' + c + '</div>';
  return '<style>' + MONEY_CSS + RULES_CSS + '</style><div class="kmo">' + a + c + b + '<p class="k-small"><a href="/prices/">' + esc(t(lang, 'so_more')) + '</a> <a class="k-src" href="/api/x/money/' + esc(x.id) + '">' + esc(t(lang, 'json')) + '</a> <span class="k-muted">' + esc(t(lang, 'upd', { d: fdt(((md.sn && md.sn.updated) || (md.sl && md.sl.updated) || '').slice(0, 10), lang) })) + '</span></p></div>';
}

// ------------------------------------------------------------------------------------------------ API
const out = (o, s, cc) => new Response(JSON.stringify(o, null, 1), { status: s || 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': cc || 'public, max-age=600', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' } });
export async function handle(req, u, env, ctx) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: 'method' }, 405, 'no-store');
  try {
    const md = await moneyData(env), sl = md.sl || {}, sn = md.sn || {};
    const m = u.pathname.match(/^\/api\/x\/money\/([A-Za-z0-9-]{3,20})\/?$/);
    if (!m) return out({ what: 'Short lets (Inside Airbnb) and recorded sale prices (official registers) within 1 km of each pinned named project.', short_lets: { updated: sl.updated, source: sl.source, method: sl.method, datasets: sl.datasets, summary: sl.summary, projects: Object.keys(sl.projects || {}).filter(k => !(sl.projects[k] || {}).outside) },
      recorded_sales: { updated: sn.updated, registers: sn.registers, method: sn.method, not_covered: sn.not_covered, summary: sn.summary, projects: Object.keys(sn.projects || {}) }, per_project: ORIGIN + '/api/x/money/<ID>', files: [ORIGIN + '/data/short-lets.json', ORIGIN + '/data/sales-nearby.json'] });
    const id = m[1].toUpperCase(), a = (sl.projects || {})[id], b = (sn.projects || {})[id];
    if (!a && !b && md.ru) { const { data } = await import('./kbx_named.js'); const ix = await data(env).catch(() => null); const x = ix && ix.byId.get(id); const rj = x ? rulesJson(md.ru, x, null) : null;
      if (rj) return out({ id, name: x.n, url: ORIGIN + '/projects/' + x.s + '/#money', short_lets: null, recorded_sales: null, short_let_rules: rj }); }
    if (!a && !b) return out({ id, error: 'not_covered', note: 'Only projects with a plot-level pin in a city covered by Inside Airbnb or by an official open sales register are covered.' }, 404);
    const { data } = await import('./kbx_named.js'); const ix = await data(env).catch(() => null); const x = ix && ix.byId.get(id);
    return out({ id, name: x ? x.n : null, url: x ? ORIGIN + '/projects/' + x.s + '/#money' : null, radius_m: 1000,
      short_lets: a && !a.outside ? Object.assign({ dataset: Object.assign({ path: a.ds }, (sl.datasets || {})[a.ds] || {}), source: sl.source, updated: sl.updated }, a, { claim: a.claim ? Object.assign({}, a.claim, { copy: x ? ORIGIN + '/projects/' + x.s + '/changes/' + a.claim.sha + '.txt' : null }) : null }) : null,
      recorded_sales: b && (!b.skip || b.skip === 'scotland') ? Object.assign({ register: (sn.registers || {})[b.reg] || null, updated: sn.updated }, b) : null,
      short_let_rules: md.ru && x ? rulesJson(md.ru, x, a && !a.outside ? a.ds : null) : null });
  } catch (e) { return out({ error: 'server' }, 500, 'no-store'); }
}
