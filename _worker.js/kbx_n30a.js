// kolaboro.com batch 30 (agent n30a, 17 Nov 2026): technology features 1 to 7. No model calls, nothing stored, nothing estimated.
//   GET /k/n30a.js?v=<V>                       client script, loaded only where needed: natural-language search on the home search box and
//                                               /projects/ (rules in 8 languages, removable chips), before/after satellite slider (project
//                                               pages with Sentinel-2 imagery, loaded on the first click)
//   GET /k/n30a-cr.js?v=<V>                    client script of the contract reader (pdf.js self-hosted, loaded when a file is dropped)
//   GET /[<lang>/]tools/contract-reader/       contract and brochure reader: rule-based marks for handover date, delay penalty, escrow,
//                                               payment schedule, governing law and cancellation, with page numbers; runs in the browser
//   GET /[<lang>/]methods/handover-slippage/   months past the first handover date on record, per market (median, quartiles, range,
//                                               sample size), computed at the edge from the published data files; method and limits
//   GET /api/v1/slippage[.csv]                 the same figures as JSON or CSV (CC BY 4.0)
//   GET /[<lang>/]projects/<slug>/timeline/    every dated event we hold for one project on one vertical timeline, each with its source
// Parts used by other modules: slipStats() and slipLine() (project pages, kbx_named.js), slipBlock() (market pages, index.js),
// light6() states and radarSvg() (compare page, kbx_u26.js), LOADER (appended to /k/u27.js), N30V.
// Sumba projects never appear (kbx_named.js data() leaves them out), nor Eco Beach City or Equinox.
import { S, C } from './kbx_n30a_i18n.js';
import { hkey, hdisp, mkName } from './kbx_hdate.js';

export const N30V = 'a6';   // a6: contract text event for the country list (n31e)
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const COI_RX = /eco\s*beach\s*city|\bequinox\b/i;
const MIN_N = 5;
const pre = l => l === 'en' ? '' : '/' + l;
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bdi = (lang, s) => lang === 'ar' ? '<bdi>' + esc(s) + '</bdi>' : esc(s);
export const t30 = (lang, k, v) => { let s = (S[lang] && S[lang][k] != null) ? S[lang][k] : S.en[k]; if (typeof s === 'string' && v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b); return s; };
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const nf = (n, lang) => { try { return Number(n).toLocaleString(LOC[lang] || 'en-GB', { maximumFractionDigits: 1 }); } catch (e) { return String(n); } };
const slugM = m => String(m || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const JT = 'application/json; charset=utf-8';
const jr = (o, st, cc) => new Response(JSON.stringify(o), { status: st || 200, headers: { 'content-type': JT, 'cache-control': cc || 'public, max-age=600', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' } });

// ------------------------------------------------------------------------------------------------ item 3: handover slippage
// For each project: the first handover date on record (the developer's original date where our research recorded one; else the date we
// read first, the later one when two sources were read the same day; else the date on record now), as the last month of its period.
// Past it and not completed: months past = current month minus that month. Completed projects are counted, not measured (no
// completion date on record). Quantiles: type 7 (linear interpolation, PERCENTILE.INC).
const mIdx = k => { const m = /^(\d{4})-(\d{2})$/.exec(String(k || '')); return m ? +m[1] * 12 + +m[2] : null; };
function q7(a, p) { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), h = (s.length - 1) * p, lo = Math.floor(h), hi = Math.ceil(h); return Math.round((s[lo] + (s[hi] - s[lo]) * (h - lo)) * 10) / 10; }
function firstOf(ix, x, handoverOf) {
  const oh = (x.fx || {}).original_handover;
  if (oh && hkey(oh)) return { k: hkey(oh), raw: String(oh).replace(/\s*\(.*$/, ''), how: 'orig' };
  const pr = (ix.prom[x.id] || []).find(p => p && p.k === 'handover');
  const H = pr && (pr.hist || []).filter(e => e && e.seen && hkey(e.d));
  if (H && H.length) { const s0 = H.map(e => e.seen).sort()[0], c = H.filter(e => e.seen === s0).sort((a, b) => hkey(b.d) < hkey(a.d) ? -1 : 1)[0]; return { k: hkey(c.d), raw: c.d, how: 'read', seen: s0 }; }
  const ho = handoverOf(ix, x); if (ho && hkey(ho.d)) return { k: hkey(ho.d), raw: ho.d, how: 'now' };
  return null;
}
const WS = new WeakMap();
export function slipStats(ix, handoverOf, now) {
  const c0 = WS.get(ix), d = now || new Date(), nowI = d.getUTCFullYear() * 12 + d.getUTCMonth() + 1, day = d.toISOString().slice(0, 10);
  if (c0 && c0.day === day) return c0;
  const per = new Map(), mk = new Map(), all = { late: [], done: 0, notdue: 0, nodate: 0, k: 0 };
  for (const x of ix.P) {
    if (COI_RX.test(String(x.n || '') + ' ' + String(x.dv || ''))) continue;
    const c = ix.caseBy.get(x.id) || {}, st = c.stage || x.st, f = firstOf(ix, x, handoverOf);
    const M = mk.get(x.mk) || { mk: x.mk, co: x.co, late: [], done: 0, notdue: 0, nodate: 0, k: 0 }; mk.set(x.mk, M);
    M.k++; all.k++;
    if (st === 'completed') { M.done++; all.done++; continue; }
    if (!f) { M.nodate++; all.nodate++; continue; }
    const fi = mIdx(f.k); if (fi == null) { M.nodate++; all.nodate++; continue; }
    if (fi < nowI) { const m = nowI - fi; M.late.push(m); all.late.push(m); per.set(x.id, { m, f }); } else { M.notdue++; all.notdue++; }
  }
  const row = M => ({ mk: M.mk, co: M.co, n: M.late.length, med: q7(M.late, .5), p25: q7(M.late, .25), p75: q7(M.late, .75), min: M.late.length ? Math.min(...M.late) : null, max: M.late.length ? Math.max(...M.late) : null, notdue: M.notdue, done: M.done, nodate: M.nodate, tracked: M.k });
  const rows = [...mk.values()].map(row).sort((a, b) => b.n - a.n || String(a.mk).localeCompare(String(b.mk)));
  const out = { day, month: d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0'), all: row(Object.assign({ mk: 'All markets', co: '' }, all)), rows, byMk: new Map(rows.map(r => [r.mk, r])), per, min: MIN_N };
  WS.set(ix, out); return out;
}
// one line for the project page ("market" section), in place of the older frozen delay-index line
export function slipLine(ix, x, lang, handoverOf, fd) {
  try {
    const S0 = slipStats(ix, handoverOf), r = S0.byMk.get(x.mk), mkN = mkName(x.mk, lang), me = S0.per.get(x.id);
    const href = pre(lang) + '/methods/handover-slippage/' + (r && r.n >= MIN_N ? '#m-' + slugM(x.mk) : '');
    let t = r && r.n >= MIN_N ? t30(lang, 'sl_line', { mk: mkN, n: nf(r.n, lang), m: nf(r.med, lang), a: nf(r.min, lang), b: nf(r.max, lang) })
      : t30(lang, 'sl_line_few', { mk: mkN, min: MIN_N, m: nf(S0.all.med, lang), n: nf(S0.all.n, lang) });
    if (me) t += ' ' + t30(lang, 'sl_this', { m: nf(me.m, lang), d: hdisp(me.f.raw, lang) || me.f.raw });
    return '<li class="kfact">' + esc(t) + ' <a class="src" href="' + href + '">' + esc(t30(lang, 'sl_meth')) + '</a></li>';
  } catch (e) { return ''; }
}
// market pages (/m/<market>/ and /<lang>/m/<market>/): a short block with the market's figures and the link to the method page
export async function slipBlock(env, mkSlug, lang) {
  const N = await import('./kbx_named.js'), ix = await N.data(env), S0 = slipStats(ix, N.handoverOf);
  const r = S0.rows.find(o => slugM(o.mk) === slugM(mkSlug) || String(o.mk).toLowerCase() === String(mkSlug).toLowerCase()); if (!r) return '';
  const mkN = mkName(r.mk, lang), href = pre(lang) + '/methods/handover-slippage/';
  const line = r.n >= MIN_N ? t30(lang, 'sl_line', { mk: mkN, n: nf(r.n, lang), m: nf(r.med, lang), a: nf(r.min, lang), b: nf(r.max, lang) }) : t30(lang, 'sl_line_few', { mk: mkN, min: MIN_N, m: nf(S0.all.med, lang), n: nf(S0.all.n, lang) });
  return '<section class="sec n30s" id="slippage"><div class="wrap"><h2>' + esc(t30(lang, 'sl_blk_h', { mk: mkN })) + '</h2><p>' + esc(line) + '</p>' +
    (r.n >= MIN_N ? '<p class="k-muted">' + esc(t30(lang, 'sl_th')[3]) + ': ' + nf(r.p25, lang) + ' – ' + nf(r.p75, lang) + ' · ' + esc(t30(lang, 'sl_th')[5]) + ': ' + nf(r.notdue, lang) + ' · ' + esc(t30(lang, 'sl_upd', { d: N.fd(S0.day, lang) })) + '</p>' : '') +
    '<p><a href="' + href + (r.n >= MIN_N ? '#m-' + slugM(r.mk) : '') + '">' + esc(t30(lang, 'sl_meth')) + '</a> · <a href="/api/v1/slippage">' + esc(t30(lang, 'sl_json')) + '</a></p></div></section>';
}
async function slipApi(env, csv) {
  const N = await import('./kbx_named.js'), ix = await N.data(env), S0 = slipStats(ix, N.handoverOf);
  const cols = ['market', 'country', 'past_first_date', 'median_months', 'p25_months', 'p75_months', 'min_months', 'max_months', 'not_yet_due', 'completed', 'no_date', 'tracked'];
  const rr = r => [r.mk, r.co, r.n, r.med, r.p25, r.p75, r.min, r.max, r.notdue, r.done, r.nodate, r.tracked];
  if (csv) {
    const q = v => v == null ? '' : /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v);
    const body = [cols.join(','), rr(S0.all).map(q).join(',')].concat(S0.rows.map(r => rr(r).map(q).join(','))).join('\n') + '\n';
    return new Response(body, { headers: { 'content-type': 'text/csv; charset=utf-8', 'cache-control': 'public, max-age=600', 'access-control-allow-origin': '*', 'content-disposition': 'inline; filename="kolaboro-handover-slippage-' + S0.day + '.csv"' } });
  }
  return jr({ version: 'slippage-1', computed: S0.day, month: S0.month, licence: 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)', method: ORIGIN + '/methods/handover-slippage/', what: 'Months past the first handover date on record, among tracked projects whose first date has passed and that are not recorded as completed. A historical statistic from our records, not a forecast and not a verdict about any developer.',
    rules: { first_date: 'developer\'s original handover date where our research recorded one (named.json fx.original_handover); else the date read first (promises.json hist, earliest seen; the later date when two sources were read that day); else the date on record now', period_end: 'a year counts from December, a quarter from its last month, a half from June or December', months_past: 'current month minus the last month of the first date', completed: 'counted, left out of the months (no completion date on record)', quantiles: 'type 7, linear interpolation (PERCENTILE.INC)', min_sample: MIN_N },
    sources: [ORIGIN + '/data/named.json', ORIGIN + '/data/promises.json', ORIGIN + '/data/bali-cases.json'], fields: cols, all: Object.fromEntries(cols.map((c, i) => [c, rr(S0.all)[i]])), markets: S0.rows.map(r => Object.fromEntries(cols.map((c, i) => [c, rr(r)[i]]))) });
}
async function slipPage(u, env, shell, lang) {
  const N = await import('./kbx_named.js'), ix = await N.data(env), S0 = slipStats(ix, N.handoverOf), P = pre(lang), th = t30(lang, 'sl_th');
  const R = S0.rows.filter(r => r.n >= MIN_N), cell = (v, k) => '<td data-l="' + esc(th[k]) + '">' + v + '</td>';
  const tr = (r, name, id) => '<tr' + (id ? ' id="m-' + id + '"' : '') + '>' + cell(name, 0) + cell(nf(r.n, lang), 1) + cell('<b>' + nf(r.med, lang) + '</b>', 2) + cell(nf(r.p25, lang) + ' – ' + nf(r.p75, lang), 3) + cell(nf(r.min, lang) + ' – ' + nf(r.max, lang), 4) + cell(nf(r.notdue, lang), 5) + cell(nf(r.done, lang), 6) + '</tr>';
  const mkLink = r => ((ix.mk.get(r.mk) || {}).k >= 5 && lang !== 'en' ? '<a href="' + P + '/m/' + encodeURIComponent(String(r.mk).toLowerCase().replace(/\s+/g, '-')) + '/">' : '<a href="/m/' + encodeURIComponent(String(r.mk).toLowerCase().replace(/\s+/g, '-')) + '/">') + bdi(lang, mkName(r.mk, lang)) + '</a>';
  const table = '<div class="n30t"><table><thead><tr>' + th.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + tr(S0.all, '<b>' + esc(t30(lang, 'sl_all')) + '</b>', '') + R.map(r => tr(r, mkLink(r), slugM(r.mk))).join('') + '</tbody></table></div>';
  // a strip per market: each project as a tick on a 0 to max months axis (server SVG, no script)
  const mx = Math.max(12, S0.all.max || 0), W = 640, Hh = 26;
  const strip = r => { const L = []; for (const [id, o] of S0.per) { const x = ix.byId.get(id); if (x && x.mk === r.mk) L.push(o.m); } const X = v => 8 + v / mx * (W - 16);
    return '<svg viewBox="0 0 ' + W + ' ' + Hh + '" class="n30sv" role="img" aria-label="' + esc(mkName(r.mk, lang) + ': ' + L.length) + '"><line x1="8" x2="' + (W - 8) + '" y1="13" y2="13"/>' + L.map(v => '<circle cx="' + X(v).toFixed(1) + '" cy="13" r="4"/>').join('') + '<rect x="' + X(r.p25).toFixed(1) + '" y="5" width="' + Math.max(2, X(r.p75) - X(r.p25)).toFixed(1) + '" height="16" rx="3"/><line class="md" x1="' + X(r.med).toFixed(1) + '" x2="' + X(r.med).toFixed(1) + '" y1="2" y2="24"/></svg>'; };
  const strips = '<div class="n30st">' + R.slice(0, 20).map(r => '<div><p>' + bdi(lang, mkName(r.mk, lang)) + ' <small>n = ' + nf(r.n, lang) + ', ' + esc(th[2]) + ' ' + nf(r.med, lang) + '</small></p><div dir="ltr">' + strip(r) + '</div></div>').join('') + '<p class="k-muted" dir="ltr">0 – ' + nf(mx, lang) + '</p></div>';
  const ul = a => '<ul>' + a.map(s => '<li>' + esc(String(s).split('{n}').join(String(MIN_N))) + '</li>').join('') + '</ul>';
  const body = '<section class="phero kp"><div class="wrap"><p class="crumb"><a href="' + P + '/">Kolaboro</a> / <a href="' + P + '/methods/transparency-score/">' + esc(t30(lang, 'sl_bc')) + '</a></p><h1>' + esc(t30(lang, 'sl_h1')) + '</h1><p class="lead">' + esc(t30(lang, 'sl_lead', { d: N.fd(S0.day, lang), k: nf(S0.all.tracked, lang) })) + '</p></div></section>' +
    '<div class="wrap kwrap n30w"><h2>' + esc(t30(lang, 'sl_tab_h')) + '</h2>' + table + '<p class="k-muted">' + esc(t30(lang, 'sl_few', { n: MIN_N })) + ' <a href="/api/v1/slippage">' + esc(t30(lang, 'sl_json')) + '</a> · <a href="/api/v1/slippage.csv">' + esc(t30(lang, 'sl_csv')) + '</a></p>' + strips +
    '<h2 id="method">' + esc(t30(lang, 'sl_m_h')) + '</h2>' + ul(t30(lang, 'sl_m')) + '<h2 id="limits">' + esc(t30(lang, 'sl_lim_h')) + '</h2>' + ul(t30(lang, 'sl_lim')) + '</div>' +
    '<style>.n30t{overflow-x:auto;border:1px solid var(--line,#d5d3cc);border-radius:14px;background:var(--card,#fff);margin:12px 0}.n30t table{width:100%;border-collapse:collapse;min-width:640px}.n30t th,.n30t td{padding:10px 12px;text-align:start;border-bottom:1px solid var(--line,#d5d3cc);font-variant-numeric:tabular-nums}.n30t th{font-size:.84rem;color:var(--muted,#59626B)}.n30t tr:target{background:color-mix(in srgb,var(--k-sea,#155C75) 10%,transparent)}' +
    '.n30st>div{margin:10px 0}.n30st p{margin:0 0 2px;font-weight:600}.n30st small{font-weight:400;color:var(--muted,#59626B)}.n30sv{width:100%;max-width:640px;height:26px;display:block}.n30sv line{stroke:var(--line,#d5d3cc);stroke-width:2}.n30sv circle{fill:var(--k-sea,#155C75);opacity:.55}.n30sv rect{fill:none;stroke:var(--ink,#17212B);stroke-width:1.5}.n30sv .md{stroke:var(--hivis,#FF5B14);stroke-width:3}' +
    '@media(max-width:640px){.n30t{border:0;background:none}.n30t table{min-width:0}.n30t thead{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}.n30t tr,.n30t td{display:block}.n30t tr{border:1px solid var(--line,#d5d3cc);border-radius:12px;margin:0 0 8px;padding:8px 12px;background:var(--card,#fff)}.n30t td{border:0;padding:2px 0}.n30t td::before{content:attr(data-l) ": ";color:var(--muted,#59626B);font-size:.84rem}}</style>';
  const canon = ORIGIN + P + '/methods/handover-slippage/';
  const pg = { title: t30(lang, 'sl_t') + ' | Kolaboro', desc: t30(lang, 'sl_d'), canon, body, alt: l => ORIGIN + pre(l) + '/methods/handover-slippage/', lastmod: S0.day,
    ld: { '@context': 'https://schema.org', '@graph': [{ '@type': 'Dataset', name: t30(lang, 'sl_h1'), description: t30(lang, 'sl_d'), url: canon, inLanguage: lang, dateModified: S0.day, license: 'https://creativecommons.org/licenses/by/4.0/', creator: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, measurementTechnique: t30(lang, 'sl_m')[3], variableMeasured: t30(lang, 'sl_th')[2], isBasedOn: [ORIGIN + '/data/named.json', ORIGIN + '/data/promises.json', ORIGIN + '/data/bali-cases.json'],
      distribution: [{ '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/api/v1/slippage' }, { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: ORIGIN + '/api/v1/slippage.csv' }] },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kolaboro', item: ORIGIN + P + '/' }, { '@type': 'ListItem', position: 2, name: t30(lang, 'sl_h1'), item: canon }] }] } };
  return page(pg, lang, shell, N);
}
async function page(pg, lang, shell, N, extraHeaders) {
  const sh = await shell(pre(lang) + '/how-we-score/'); if (!sh || sh.status !== 200) return null;
  const html = await N.assemble(pg, lang, sh);
  return new Response(html, { status: 200, headers: Object.assign({ 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600' }, pg.noindex ? { 'x-robots-tag': 'noindex, follow' } : {}, extraHeaders || {}) });
}

// ------------------------------------------------------------------------------------------------ item 6: project timeline
async function timelinePage(u, env, shell, lang, slug) {
  const N = await import('./kbx_named.js'); let ix; try { ix = await N.data(env); } catch (e) { return null; }
  const x = ix.bySlug.get(slug); if (!x || COI_RX.test(String(x.n || '') + ' ' + String(x.dv || ''))) return null;
  const P = pre(lang), base = P + '/projects/' + x.s + '/', fd = d => N.fd(d, lang), c = ix.caseBy.get(x.id) || {};
  const [ph, sat] = await Promise.all([(async () => { try { return (await (await import('./kbx_paper.js')).paperData(env)).ph; } catch (e) { return null; } })(), (async () => { try { return await (await import('./kbx_named_sat.js')).satData(env); } catch (e) { return null; } })()]);
  const E = [];   // { d: 'YYYY-MM-DD' or 'YYYY-MM', k: kind, t: text, src: [label, href] }
  const add = (d, k, t, src) => { const i = N.iso(d) || (/^\d{4}-\d{2}$/.test(String(d)) ? d : null); if (i) E.push({ d: i, k, t, src }); };
  const ds = ['/data/named.json', '/data/named.json'];
  add(x.ad, 'rec', t30(lang, 'ev_added'), [t30(lang, 's_ds'), ds[1]]);
  if (x.pn) add(x.ad, 'rec', t30(lang, 'ev_pn', { p: x.pn }), [t30(lang, 's_ds'), base + '#permits']);
  if (x.sealed && x.sha) add(x.sealed, 'rec', t30(lang, 'ev_sealed', { h: String(x.sha).slice(0, 12) }), [t30(lang, 's_copy'), '/projects/' + x.s + '/changes/' + x.sha + '.txt']);
  if (x.rvw && x.rvw.d) add(x.rvw.d, 'rec', t30(lang, 'ev_rev'), [t30(lang, 's_rev'), base + '#sources']);
  if (c.checked) add(c.checked, 'rec', t30(lang, 'ev_chk'), [t30(lang, 's_ds'), '/data/bali-cases.json']);
  // handover dates: every dated reading, and each move between readings
  const pr = (ix.prom[x.id] || []).find(p => p && p.k === 'handover');
  if (pr) {
    const H = (pr.hist || []).filter(e => e && e.seen && e.d).slice().sort((a, b) => a.seen < b.seen ? -1 : a.seen > b.seen ? 1 : 0), lastBy = {};
    for (const e of H) {
      const src = e.src === 'page' ? [t30(lang, 's_dev'), e.sha ? '/projects/' + x.s + '/changes/' : (x.url || base)] : [t30(lang, 's_res'), base + '#sources'];
      const l0 = lastBy[e.src || '?'];
      if (l0 && hkey(l0.d) && hkey(e.d) && hkey(e.d) !== hkey(l0.d)) add(e.seen, 'date', t30(lang, 'ev_ho_mv', { a: hdisp(l0.d, lang) || l0.d, b: hdisp(e.d, lang) || e.d }), src);
      else if (!l0 || l0.d !== e.d) add(e.seen, 'date', t30(lang, 'ev_ho', { d: hdisp(e.d, lang) || e.d }), src);
      lastBy[e.src || '?'] = e;
    }
  }
  const od = N.overdueOf ? N.overdueOf(ix, x) : null;
  if (od && od.end) { const [y, m] = od.end.split('-').map(Number), nx = m === 12 ? (y + 1) + '-01' : y + '-' + String(m + 1).padStart(2, '0'); add(nx, 'date', t30(lang, 'ev_due', { d: hdisp(od.d, lang) || od.d }), [t30(lang, 's_ds'), base + '#delivery']); }
  // prices printed on the page we track, by dated copy: the first headline, then each change
  const H2 = ph && ph.projects && ph.projects[x.id];
  if (H2 && H2.pts) {
    let prev = null; const ia = (ts, url) => 'https://web.archive.org/web/' + ts + '/' + url;
    for (const p of H2.pts.slice().sort((a, b) => a.d < b.d ? -1 : 1)) {
      const href = p.src === 'copy' ? '/projects/' + x.s + '/changes/' + p.ref + '.txt' : ia(p.ref, H2.url), src = [t30(lang, p.src === 'copy' ? 's_copy' : 's_ia'), href];
      const h = p.head && p.head.p ? p.head.p : null;
      if (h && (!prev || prev.cur !== p.head.cur || prev.v !== p.head.v)) add(p.d, 'price', prev && prev.cur === p.head.cur ? t30(lang, 'ev_price_ch', { a: prev.p, b: h }) : t30(lang, 'ev_price', { p: h }), src);
      else if (!h && p.src === 'ia') add(p.d, 'price', t30(lang, 'ev_ia'), src);
      if (h) prev = p.head;
    }
  }
  // satellite: first and latest clear month, and the first month a change beyond normal variation is seen (two clear months in a row)
  const rec = sat && sat.projects && sat.projects[x.id];
  if (rec && rec.n && rec.m0) {
    const m0 = mIdx(rec.m0), ym = i => { const v = m0 + i - 1; return Math.floor(v / 12) + '-' + String(v % 12 + 1).padStart(2, '0'); }, clr = []; for (let i = 0; i < rec.n; i++) if (rec.c[i] != null) clr.push(i);
    const ssrc = [t30(lang, 's_sat'), base + '#space'];
    if (clr.length) { add(rec.dt[clr[0]] || ym(clr[0]), 'sat', t30(lang, 'ev_sat0'), ssrc); add(rec.dt[clr[clr.length - 1]] || ym(clr[clr.length - 1]), 'sat', t30(lang, 'ev_sat1'), ssrc); }
    try { const SM = await import('./kbx_named_sat.js'), I = SM.index(rec); if (I) { const ok = I.y.map((v, i) => v == null ? -1 : i).filter(i => i >= 0); for (let j = 3; j + 1 < ok.length; j++) { const a = I.y[ok[j]], b = I.y[ok[j + 1]]; if (Math.abs(a) >= SM.BAND && Math.abs(b) >= SM.BAND && Math.sign(a) === Math.sign(b)) { add(rec.dt[ok[j]] || ym(ok[j]), 'sat', t30(lang, 'ev_satc', { x: (a > 0 ? '+' : '') + a }), ssrc); break; } } } } catch (e) {}
  }
  E.sort((a, b) => a.d < b.d ? 1 : a.d > b.d ? -1 : 0);
  const kinds = ['date', 'price', 'rec', 'sat'].filter(k => E.some(e => e.k === k)), kl = { date: 'k_date', price: 'k_price', rec: 'k_rec', sat: 'k_sat' };
  let lastY = '', items = '';
  for (const e of E) {
    const y = e.d.slice(0, 4); if (y !== lastY) { items += '<li class="n30y" aria-hidden="true">' + y + '</li>'; lastY = y; }
    const sh = e.src && e.src[1] ? ' <a class="src" href="' + esc(e.src[1]) + '"' + (/^https?:/.test(e.src[1]) ? ' rel="nofollow noopener" target="_blank"' : '') + '>' + esc(e.src[0]) + '</a>' : '';
    items += '<li class="n30e n30-' + e.k + '" data-k="' + e.k + '"><time datetime="' + e.d + '">' + esc(fd(e.d)) + '</time><p>' + bdi(lang, e.t) + sh + '</p></li>';
  }
  const name = x.n, a = E.length ? fd(E[E.length - 1].d) : '', b = E.length ? fd(E[0].d) : '';
  const chips = kinds.length > 1 ? '<p class="n30c" role="group"><label><input type="radio" name="n30k" value="" checked> ' + esc(t30(lang, 'k_all')) + '</label>' + kinds.map(k => '<label><input type="radio" name="n30k" value="' + k + '"> ' + esc(t30(lang, kl[k])) + ' (' + E.filter(e => e.k === k).length + ')</label>').join('') + '</p>' : '';
  const body = '<section class="phero kp"><div class="wrap"><p class="crumb"><a href="' + P + '/">Kolaboro</a> / <a href="' + P + '/projects/">' + esc(N.tr(lang, 'h1_i')) + '</a> / <a href="' + base + '">' + bdi(lang, name) + '</a></p><h1>' + esc(t30(lang, 'tl_h1', { n: name })) + '</h1><p class="lead">' + esc(t30(lang, 'tl_lead')) + '</p>' +
    (E.length ? '<p><b>' + esc(t30(lang, 'tl_k', { k: nf(E.length, lang), a, b })) + '</b></p>' : '') + '</div></section><div class="wrap kwrap">' + chips +
    (E.length ? '<ol class="n30tl">' + items + '</ol>' : '<p>' + esc(t30(lang, 'tl_none')) + '</p>') + '<p><a class="more" href="' + base + '">' + esc(t30(lang, 'tl_back')) + '</a></p></div>' +
    '<style>.n30c{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}.n30c label{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 14px;border:1.5px solid var(--line,#d5d3cc);border-radius:22px;cursor:pointer;background:var(--card,#fff)}.n30c label:has(input:checked){border-color:var(--ink,#17212B);font-weight:700}.n30c input{accent-color:var(--k-sea,#155C75)}' +
    '.n30tl{list-style:none;margin:8px 0 24px;padding:0;position:relative}.n30tl::before{content:"";position:absolute;inset-block:0;inset-inline-start:7px;width:2px;background:var(--line,#d5d3cc)}.n30y{font-weight:800;font-size:1.1rem;margin:18px 0 6px;padding-inline-start:28px}' +
    '.n30e{position:relative;padding:6px 0 10px;padding-inline-start:28px}.n30e::before{content:"";position:absolute;inset-inline-start:1px;top:12px;width:14px;height:14px;border-radius:50%;background:var(--card,#fff);border:3px solid var(--k-sea,#155C75)}.n30-date::before{border-color:var(--hivis,#FF5B14)}.n30-price::before{border-color:#7A5AF8}.n30-sat::before{border-color:#2E8B57}.n30e time{font-size:.84rem;color:var(--muted,#59626B);font-variant-numeric:tabular-nums}.n30e p{margin:2px 0 0}.n30e .src{font-size:.84rem;margin-inline-start:6px}' +
    '.kwrap:has(input[value=date]:checked) .n30e:not([data-k=date]),.kwrap:has(input[value=price]:checked) .n30e:not([data-k=price]),.kwrap:has(input[value=rec]:checked) .n30e:not([data-k=rec]),.kwrap:has(input[value=sat]:checked) .n30e:not([data-k=sat]){display:none}</style>';
  const canon = ORIGIN + base + 'timeline/';
  const pg = { title: (t30(lang, 'tl_t', { n: name }).length > 60 ? t30(lang, 'tl_h1', { n: name }) : t30(lang, 'tl_t', { n: name })) + ' | Kolaboro', desc: t30(lang, 'tl_d', { n: name }), canon, body, noindex: true, alt: l => ORIGIN + pre(l) + '/projects/' + x.s + '/timeline/', lastmod: E.length ? E[0].d.slice(0, 10) : '',
    ld: { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebPage', name: t30(lang, 'tl_h1', { n: name }), url: canon, inLanguage: lang, about: { '@type': 'Residence', name, url: ORIGIN + base }, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kolaboro', item: ORIGIN + P + '/' }, { '@type': 'ListItem', position: 2, name, item: ORIGIN + base }, { '@type': 'ListItem', position: 3, name: t30(lang, 'tl_h1', { n: name }), item: canon }] }] } };
  return page(pg, lang, shell, N);
}

// ------------------------------------------------------------------------------------------------ item 7: compare radar (used by kbx_u26.js)
// six-check states from the same rules as the traffic light on project pages (kbx_u27.js light6), as values: ok 3, part 2, no 1, nc 0
const RV = { ok: 3, part: 2, no: 1, nc: 0 };
const RC = ['#155C75', '#FF5B14', '#7A5AF8', '#2E8B57'];
export function radarSvg(lang, cols) {   // cols: [{ name, st: ['ok'|'part'|'no'|'nc' x 6] }]
  const L = t30(lang, 'lt'), W = 360, cx = 180, cy = 170, R = 120, n = 6;
  const pt = (i, r) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
  let g = '';
  for (let k = 1; k <= 3; k++) g += '<polygon class="g" points="' + Array.from({ length: n }, (_, i) => pt(i, R * k / 3).map(v => v.toFixed(1)).join(',')).join(' ') + '"/>';
  for (let i = 0; i < n; i++) { const [x, y] = pt(i, R); g += '<line class="g" x1="' + cx + '" y1="' + cy + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '"/>'; const [lx, ly] = pt(i, R + 22); g += '<text x="' + lx.toFixed(1) + '" y="' + (ly + 4).toFixed(1) + '" text-anchor="' + (Math.abs(lx - cx) < 8 ? 'middle' : lx > cx ? 'start' : 'end') + '">' + esc(L[i]) + '</text>'; }
  cols.forEach((c, j) => { const P = c.st.map((s, i) => pt(i, Math.max(6, R * (RV[s] || 0) / 3))); g += '<polygon class="p" style="stroke:' + RC[j] + ';fill:' + RC[j] + '" points="' + P.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ') + '"><title>' + esc(c.name) + '</title></polygon>' + P.map(p => '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.5" style="fill:' + RC[j] + '"/>').join(''); });
  const leg = '<ul class="n30rl">' + cols.map((c, j) => '<li><i style="background:' + RC[j] + '"></i>' + bdi(lang, c.name) + '</li>').join('') + '</ul>';
  return '<figure class="n30r"><figcaption><b>' + esc(t30(lang, 'cp_radar')) + '</b></figcaption><div dir="ltr"><svg viewBox="-90 -6 540 352" role="img" aria-label="' + esc(t30(lang, 'cp_radar') + ': ' + cols.map(c => c.name + ' ' + c.st.map((s, i) => L[i] + ' ' + t30(lang, 'st')[s]).join(', ')).join('; ')) + '">' + g + '</svg></div>' + leg + '<p class="k-muted">' + esc(t30(lang, 'cp_radar_n')) + '</p></figure>' +
    '<style>.n30r{margin:18px 0;border:1px solid var(--line,#d5d3cc);border-radius:14px;background:var(--card,#fff);padding:14px}.n30r svg{width:100%;max-width:520px;display:block;margin:0 auto}.n30r .g{fill:none;stroke:var(--line,#d5d3cc);stroke-width:1}.n30r .p{fill-opacity:.12;stroke-width:2.5}.n30r text{font-size:17px;fill:var(--ink,#17212B)}.n30rl{list-style:none;display:flex;flex-wrap:wrap;gap:6px 16px;padding:0;margin:8px 0}.n30rl i{display:inline-block;width:12px;height:12px;border-radius:3px;margin-inline-end:6px;vertical-align:-1px}</style>';
}

// ------------------------------------------------------------------------------------------------ item 4: contract reader page
const CR_KEYS = ['ho', 'pen', 'esc', 'pay', 'law', 'can'];
async function readerPage(u, env, shell, lang) {
  const N = await import('./kbx_named.js'), P = pre(lang), w = k => t30(lang, k);
  const M = { v: N30V }; for (const k of ['cr_drop', 'cr_rd', 'cr_done', 'cr_scan', 'cr_err', 'cr_big', 'cr_k', 'cr_k1', 'cr_none', 'cr_page', 'cr_vals', 'cr_more', 'cr_text']) M[k.slice(3)] = w(k);
  M.cat = CR_KEYS.map(k => [k, w('cr_' + k), w('cr_' + k + '_q')]);
  const body = '<section class="phero kp"><div class="wrap"><p class="crumb"><a href="' + P + '/">Kolaboro</a> / <a href="/tools/">' + esc(w('cr_bc')) + '</a></p><h1>' + esc(w('cr_h1')) + '</h1><p class="lead">' + esc(w('cr_lead')) + '</p>' +
    '<p class="n30p"><b>' + esc(w('cr_priv')) + '</b></p></div></section><div class="wrap kwrap" id="n30cr" data-cr="' + esc(JSON.stringify(M)) + '">' +
    '<div class="n30d" tabindex="0" role="button" aria-describedby="n30cr-s"><p><b>' + esc(w('cr_drop')) + '</b></p><label class="k-btn" for="n30cr-f">' + esc(w('cr_pick')) + '</label><input id="n30cr-f" type="file" accept="application/pdf,.pdf,text/plain,.txt" hidden></div>' +
    '<details class="n30px"><summary>' + esc(w('cr_or')) + '</summary><label for="n30cr-t" class="k-vh">' + esc(w('cr_or')) + '</label><textarea id="n30cr-t" rows="7" spellcheck="false"></textarea><p><button type="button" class="k-btn" id="n30cr-g">' + esc(w('cr_go')) + '</button> <button type="button" class="k-btn k-btn--ghost" id="n30cr-c">' + esc(w('cr_clear')) + '</button></p></details>' +
    '<p id="n30cr-s" class="n30s0" role="status" aria-live="polite"></p><div id="n30cr-o"></div>' +
    (await (await import('./kbx_n31e.js')).crBlock(lang).catch(() => '')) + '<ul class="n30q">' + CR_KEYS.map(k => '<li><b>' + esc(w('cr_' + k)) + '</b>: ' + esc(w('cr_' + k + '_q')) + '</li>').join('') + '</ul>' +
    '<p class="k-muted">' + esc(w('cr_note')) + '</p><h2>' + esc(w('cr_rel')) + '</h2><ul><li><a href="/tools/contract-check/">' + esc(w('cr_rel1')) + '</a></li><li><a href="' + P + '/tools/contract-addendum/">' + esc(w('cr_rel2')) + '</a></li><li><a href="/tools/pdf-check/">' + esc(w('cr_rel3')) + '</a></li></ul></div>' +
    '<style>.n30p{max-width:70ch}.n30d{display:grid;place-items:center;gap:10px;min-height:170px;margin:18px 0;border:2.5px dashed var(--ink,#17212B);border-radius:18px;background:var(--card,#fff);text-align:center;padding:18px;cursor:pointer}.n30d.is-over{border-color:var(--k-sea,#155C75);background:color-mix(in srgb,var(--k-sea,#155C75) 8%,var(--card,#fff))}.n30d p{margin:0}.n30d .k-btn{min-height:48px;display:inline-flex;align-items:center;cursor:pointer}' +
    '.n30px textarea{width:100%;box-sizing:border-box;border:1.5px solid var(--line,#d5d3cc);border-radius:12px;padding:10px;font:inherit;background:var(--paper,#fff);color:inherit}.n30px summary{min-height:44px;display:flex;align-items:center;cursor:pointer;font-weight:600}.n30s0{font-weight:600;min-height:1.4em}' +
    '.n30k{border:1px solid var(--line,#d5d3cc);border-radius:14px;background:var(--card,#fff);padding:12px 16px;margin:12px 0}.n30k h3{margin:0;font-size:1.1rem;display:flex;flex-wrap:wrap;gap:6px 12px;align-items:baseline}.n30k h3 small{font-weight:600;color:var(--muted,#59626B)}.n30k.is-none{border-inline-start:4px solid var(--hivis,#FF5B14)}.n30k.is-ok{border-inline-start:4px solid var(--k-sea,#155C75)}.n30k>p{margin:6px 0;color:var(--muted,#59626B)}' +
    '.n30k ol{margin:8px 0 0;padding-inline-start:20px}.n30k li{margin:0 0 10px;line-height:1.5}.n30k mark{background:#FFE08A;color:#17212B;border-radius:3px;padding:0 2px}.n30k .pg{display:inline-block;font-size:.8rem;font-weight:700;border:1px solid var(--line,#d5d3cc);border-radius:6px;padding:0 6px;margin-inline-end:6px}.n30k .vals{display:block;font-size:.84rem;color:var(--muted,#59626B)}.n30k button{min-height:44px;border:0;background:none;text-decoration:underline;font:inherit;color:inherit;cursor:pointer}.n30q li{margin:4px 0}</style>' +
    '<script>(function(){var r=document.getElementById("n30cr");if(!r)return;var go=function(){if(window.N30CR)return;var s=document.createElement("script");s.src="/k/n30a-cr.js?v=' + N30V + '";s.async=true;document.head.appendChild(s);};["pointerdown","dragenter","focusin","keydown"].forEach(function(e){r.addEventListener(e,go,{once:true});});if("requestIdleCallback"in window)requestIdleCallback(go,{timeout:4000});else setTimeout(go,2500);})();</script>';
  const canon = ORIGIN + P + '/tools/contract-reader/';
  const pg = { title: w('cr_t') + ' | Kolaboro', desc: w('cr_d'), canon, body, alt: l => ORIGIN + pre(l) + '/tools/contract-reader/', lastmod: '2026-11-17',
    ld: { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebApplication', name: w('cr_h1'), description: w('cr_d'), url: canon, inLanguage: lang, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any (runs in the browser)', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kolaboro', item: ORIGIN + P + '/' }, { '@type': 'ListItem', position: 2, name: w('cr_bc'), item: ORIGIN + '/tools/' }, { '@type': 'ListItem', position: 3, name: w('cr_h1'), item: canon }] }] } };
  return page(pg, lang, shell, N);
}

// ------------------------------------------------------------------------------------------------ client: contract reader (served as /k/n30a-cr.js)
function crClient() {
  var R = document.getElementById('n30cr'); if (!R || window.N30CR) return; window.N30CR = 1;
  var M = JSON.parse(R.getAttribute('data-cr')), st = document.getElementById('n30cr-s'), out = document.getElementById('n30cr-o'), fi = document.getElementById('n30cr-f'), dz = R.querySelector('.n30d');
  var LG = (document.documentElement.lang || 'en').slice(0, 2), LOC = { zh: 'zh-CN', ar: 'ar' }[LG] || LG;
  var PDFJS = '/tools/contract-check/vendor/pdf-4.10.38.min.mjs', WK = '/tools/contract-check/vendor/pdf-4.10.38.worker.min.mjs', lib = null;
  function f(s, v) { for (var k in v) s = s.split('{' + k + '}').join(v[k]); return s; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // terms per subject. B: words in scripts with spaces (a letter may not come right before the term); U: scripts without spaces or
  // with attached prefixes (Chinese, Thai, Arabic), matched anywhere. All case-insensitive.
  var T = {
    ho: { B: ['completion date', 'date of completion', 'handover', 'hand over', 'hand-over', 'delivery date', 'date of delivery', 'possession', 'practical completion', 'shall be completed', 'expected completion', 'anticipated completion', 'fecha de entrega', 'plazo de entrega', 'entrega de (?:la vivienda|las llaves|la unidad)', 'finalizaci[oó]n de (?:la obra|las obras)', 'terminaci[oó]n de la obra', 'data de entrega', 'entrega das chaves', 'conclus[aã]o da obra', 'prazo de entrega', 'date de livraison', 'livraison', 'd[ée]lai d.ach[eè]vement', 'ach[eè]vement des travaux', 'remise des cl[ée]s', '[uü]bergabe', 'fertigstellung', 'bezugsfertig', 'oplevering', 'opleverdatum', 'data di consegna', 'consegna dell.immobile', 'ultimazione dei lavori', 'передач[аиуеы]', 'срок сдачи', 'ввод в эксплуатацию', 'сдач[аиу] объекта', 'serah terima', 'penyerahan unit', 'tanggal penyerahan', 'teslim tarihi', 'teslim'], U: ['交付', '交房', '竣工', '交楼', 'تسليم', 'الإنجاز', 'ส่งมอบ'] },
    pen: { B: ['penalt(?:y|ies)', 'liquidated damages', 'compensation for (?:late|delay)', 'per day of delay', 'delay compensation', 'late delivery', 'delay(?:ed)? (?:in )?(?:handover|completion|delivery)', 'penalizaci[oó]n', 'indemnizaci[oó]n por (?:el )?retraso', 'retraso en la entrega', 'cl[aá]usula penal', 'multa', 'penalidade', 'atraso na entrega', 'p[ée]nalit[ée]s? de retard', 'indemnit[ée]s? de retard', 'retard de livraison', 'vertragsstrafe', 'verzug', 'p[öo]nale', 'boete', 'vertragingsboete', 'penale', 'ritardo nella consegna', 'неустойк', 'штраф', 'пен[ия]', 'просрочк', 'denda', 'keterlambatan', 'ganti rugi', 'cezai [şs]art', 'gecikme'], U: ['违约金', '逾期', '罚金', 'غرامة', 'التأخير', 'تأخير', 'ค่าปรับ', 'ล่าช้า'] },
    esc: { B: ['escrow', 'trust account', 'project account', 'bank guarantee', 'insurance guarantee', 'deposit protection', 'client account', 'stakeholder', 'cuenta especial', 'aval(?:es)? bancario', 'seguro de cauci[oó]n', 'garant[ií]a bancaria', 'ley 38/1999', 'cantidades (?:entregadas )?a cuenta', 'conta cau[cç][aã]o', 'garantia banc[aá]ria', 'patrim[oô]nio de afeta[cç][aã]o', 'garantie financi[eè]re d.ach[eè]vement', 'compte s[ée]questre', 's[ée]questre', 'garantie bancaire', 'treuhand', 'b[üu]rgschaft', 'anderkonto', 'mabv', 'derdengelden', 'bankgarantie', 'notarisrekening', 'woningborg', 'fideiussione', 'conto vincolato', 'эскроу', 'банковская гарантия', 'аккредитив', 'номинальный сч[её]т', 'rekening (?:bersama|escrow|penampungan|notaris)', 'jaminan bank', 'emanet hesab', 'teminat mektub'], U: ['监管账户', '资金监管', '托管账户', '银行保函', '第三方托管', 'حساب الضمان', 'حساب ضمان', 'كفالة بنكية', 'الضمان المصرفي', 'إسكرو', 'บัญชีคุ้มครองเงินดาวน์'] },
    pay: { B: ['payment (?:schedule|plan|terms)', 'instal(?:l)?ments?', 'down ?payment', 'deposit of', 'balance (?:shall|is|will) be (?:paid|payable)', 'upon (?:signing|completion|handover)', 'milestone', 'forma de pago', 'calendario de pagos', 'plazos', 'pagos? fraccionados', 'se[ñn]al', 'a la firma', 'forma de pagamento', 'presta[cç][oõ]es', 'parcelas', '[ée]ch[ée]ancier', 'modalit[ée]s de paiement', 'appels? de fonds', 'acompte', 'zahlungsplan', 'raten', 'abschlagszahlung', 'anzahlung', 'betalingsschema', 'termijnen', 'aanbetaling', 'piano di pagamento', 'acconto', 'caparra', 'график платежей', 'порядок оплаты', 'рассрочк', 'первоначальный взнос', 'предоплат', 'tahap(?:an)? pembayaran', 'jadwal pembayaran', 'cicilan', 'angsuran', 'uang muka', 'tanda jadi', 'booking fee', '[öo]deme plan', 'taksit', 'pe[şs]inat'], U: ['付款计划', '付款方式', '分期', '首付', '定金', 'جدول الدفع', 'خطة الدفع', 'أقساط', 'الدفعة المقدمة', 'دفعة أولى', 'عربون', 'งวดการชำระ', 'เงินดาวน์', 'เงินจอง'] },
    law: { B: ['governing law', 'governed by', 'laws? of', 'jurisdiction', 'arbitration', 'courts? of', 'dispute resolution', 'ley aplicable', 'legislaci[oó]n aplicable', 'jurisdicci[oó]n', 'tribunales', 'juzgados', 'arbitraje', 'lei aplic[aá]vel', 'foro', 'arbitragem', 'droit applicable', 'loi applicable', 'juridiction', 'tribunaux', 'arbitrage', 'anwendbares recht', 'gerichtsstand', 'schiedsgericht', 'toepasselijk recht', 'bevoegde rechter', 'geschillen', 'legge applicabile', 'foro competente', 'arbitrato', 'применимое право', 'подсудност', 'арбитраж', 'hukum yang berlaku', 'pengadilan negeri', 'domisili hukum', 'arbitrase', 'penyelesaian sengketa', 'uygulanacak hukuk', 'yetkili mahkeme', 'tahkim'], U: ['适用法律', '管辖', '仲裁', '争议解决', 'القانون الواجب التطبيق', 'القانون المطبق', 'الاختصاص القضائي', 'التحكيم', 'محاكم', 'กฎหมายที่ใช้บังคับ', 'อนุญาโตตุลาการ'] },
    can: { B: ['terminat(?:e|ion)', 'cancel(?:l?ation|led|s)?', 'rescind', 'rescission', 'refund', 'non-refundable', 'cooling[- ]off', 'withdraw', 'resoluci[oó]n', 'rescisi[oó]n', 'desistimiento', 'cancelaci[oó]n', 'devoluci[oó]n', 'reembolso', 'rescis[aã]o', 'resolu[cç][aã]o', 'distrato', 'devolu[cç][aã]o', 'r[ée]siliation', 'annulation', 'r[ée]tractation', 'remboursement', 'r[üu]cktritt', 'k[üu]ndigung', 'widerruf', 'r[üu]ckzahlung', 'r[üu]ckerstattung', 'ontbinding', 'opzegging', 'annulering', 'terugbetaling', 'bedenktijd', 'recesso', 'risoluzione', 'rimborso', 'расторжени', 'отказ от договора', 'возврат (?:денежных )?средств', 'возврат денег', 'pembatalan', 'pemutusan', 'pengembalian (?:dana|uang)', 'fesih', 'iptal', 'cayma'], U: ['解除', '终止', '退款', '撤销', 'فسخ', 'إلغاء', 'إنهاء العقد', 'استرداد', 'رد المبالغ', 'ยกเลิก', 'บอกเลิก', 'คืนเงิน'] }
  };
  var RX = {}; Object.keys(T).forEach(function (k) { RX[k] = new RegExp('(?:(?<![\\p{L}\\p{N}])(?:' + T[k].B.join('|') + ')|' + T[k].U.join('|') + ')', 'giu'); });
  var MON = '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[ée]cembre|januar|februar|m[äa]rz|juni|juli|oktober|dezember|januari|februari|maart|mei|augustus|janeiro|fevereiro|mar[cç]o|maio|junho|julho|setembro|outubro|novembro|dezembro|januari|pebruari|maret|agustus|desember|января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)';
  var VAL = new RegExp('\\d{1,2}[./-]\\d{1,2}[./-]\\d{2,4}|\\d{4}-\\d{2}-\\d{2}|\\d{1,2}\\s+' + MON + '\\.?,?\\s+\\d{4}|' + MON + '\\.?\\s+\\d{1,2},?\\s+\\d{4}|' + MON + '\\s+\\d{4}|\\b(?:Q[1-4]|H[12])\\s?20\\d\\d|\\d{4}\\s?年\\s?\\d{1,2}\\s?月|\\d+(?:[.,]\\d+)?\\s?%|\\d{1,4}\\s?(?:\\(\\w[\\w\\s-]*\\)\\s?)?(?:calendar |working |business )?(?:days?|months?|years?|weeks?|d[ií]as|meses|a[ñn]os|jours|mois|ans|tage|monate|jahre|dagen|maanden|jaren|giorni|mesi|anni|дн(?:ей|я)|месяц(?:ев|а)?|лет|года?|hari|bulan|tahun|g[üu]n|ay|y[ıi]l|天|个月|年|يومًا|يوم|أشهر|شهرًا|شهر|سنوات|วัน|เดือน)|(?:[$€£฿]|USD|EUR|AED|GBP|THB|IDR|Rp\\.?|MYR|PHP|MXN|TRY|RUB)\\s?\\d[\\d.,\\s]*\\d|\\d[\\d.,]*\\d\\s?(?:USD|EUR|AED|GBP|THB|IDR|MYR|euros?|dollars?|d[oó]lares|dirhams?|рубл\\p{L}*|€)', 'giu');
  function sentences(pages) {   // [ {p, t} ]
    var out = []; pages.forEach(function (txt, i) {
      var s = String(txt).replace(/\u00ad/g, '').replace(/[ \t]+/g, ' ').replace(/\s*\n\s*\n\s*/g, '\n\n');
      s.split(/(?<=[.!?;。！？؛])\s+(?=[\p{Lu}\p{Lo}0-9("«“])|\n{2,}|(?<=[。！？；])/u).forEach(function (z) { z = z.replace(/\s+/g, ' ').trim(); if (z.length >= 12) out.push({ p: i + 1, t: z.length > 700 ? z.slice(0, 700) + '…' : z }); });
    }); return out;
  }
  function mark(t, re) { re.lastIndex = 0; var o = '', i = 0, m; while ((m = re.exec(t))) { if (!m[0]) { re.lastIndex++; continue; } o += esc(t.slice(i, m.index)) + '<mark>' + esc(m[0]) + '</mark>'; i = m.index + m[0].length; } return o + esc(t.slice(i)); }
  function vals(t) { VAL.lastIndex = 0; var a = [], m; while ((m = VAL.exec(t)) && a.length < 6) { var v = m[0].replace(/\s+/g, ' ').trim(); if (a.indexOf(v) < 0) a.push(v); } return a; }
  function run(pages, t0, label) {
    var S = sentences(pages), found = 0, html = '';
    M.cat.forEach(function (c) {
      var re = RX[c[0]], hits = [];
      S.forEach(function (s, j) { re.lastIndex = 0; var n = (s.t.match(re) || []).length; if (n) { var v = vals(s.t); hits.push({ s: s, j: j, sc: n * 2 + (v.length ? 3 : 0) + (s.t.length < 400 ? 1 : 0), v: v }); } });
      hits.sort(function (a, b) { return b.sc - a.sc || a.j - b.j; });
      if (hits.length) found++;
      var li = function (h) { return '<li dir="auto"><span class="pg" dir="auto">' + esc(label || f(M.page, { p: h.s.p })) + '</span>' + mark(h.s.t, re) + (h.v.length ? '<span class="vals" dir="auto">' + esc(M.vals) + ': ' + h.v.map(esc).join(' · ') + '</span>' : '') + '</li>'; };
      html += '<section class="n30k ' + (hits.length ? 'is-ok' : 'is-none') + '"><h3>' + esc(c[1]) + ' <small>' + esc(hits.length === 1 ? M.k1 : hits.length ? f(M.k, { k: hits.length }) : '') + '</small></h3><p>' + esc(hits.length ? c[2] : M.none) + '</p>' +
        (hits.length ? '<ol>' + hits.slice(0, 4).map(li).join('') + '</ol>' + (hits.length > 4 ? '<button type="button" data-more="' + c[0] + '">' + esc(f(M.more, { k: hits.length - 4 })) + '</button><ol hidden data-rest="' + c[0] + '" start="5">' + hits.slice(4, 40).map(li).join('') + '</ol>' : '') : '') + '</section>';
    });
    out.innerHTML = html;
    out.querySelectorAll('[data-more]').forEach(function (b) { b.addEventListener('click', function () { var r = out.querySelector('[data-rest="' + b.getAttribute('data-more') + '"]'); if (r) r.hidden = false; b.remove(); }); });
    st.textContent = f(M.done, { n: pages.length, s: S.length, ms: Math.round(performance.now() - t0), a: found });
    try { document.dispatchEvent(new CustomEvent('n30cr:text', { detail: pages })); } catch (e) {}   // n31e (batch 31, item 159): what is missing for the country
    if (out.scrollIntoView) out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function readPdf(buf) {
    var t0 = performance.now();
    st.textContent = f(M.rd, { i: 1, n: '…' });
    (lib ? Promise.resolve(lib) : import(PDFJS).then(function (m) { m.GlobalWorkerOptions.workerSrc = WK; lib = m; return m; })).then(function (L) {
      return L.getDocument({ data: buf, isEvalSupported: false, disableFontFace: true, useSystemFonts: false }).promise;
    }).then(function (pdf) {
      var pages = [], n = Math.min(pdf.numPages, 400), chain = Promise.resolve();
      for (var i = 1; i <= n; i++) (function (i) { chain = chain.then(function () { st.textContent = f(M.rd, { i: i, n: n }); return pdf.getPage(i); }).then(function (pg) { return pg.getTextContent(); }).then(function (tc) {
        var s = '', lastY = null; tc.items.forEach(function (it) { var y = it.transform ? Math.round(it.transform[5]) : null; if (lastY != null && y != null && Math.abs(y - lastY) > 2) s += it.hasEOL ? '\n' : ' '; s += it.str; if (it.hasEOL) s += '\n'; lastY = y; }); pages.push(s);
      }); })(i);
      return chain.then(function () { var tot = pages.join('').replace(/\s/g, '').length; if (tot < 40 * Math.max(1, n) * 0.5 && tot < 400) { st.textContent = M.scan; out.innerHTML = ''; return; } run(pages, t0); });
    }).catch(function () { st.textContent = M.err; });
  }
  function take(file) { if (!file) return; if (file.size > 40 * 1024 * 1024) { st.textContent = M.big; return; }
    var rd = new FileReader(); rd.onload = function () { if (/\.txt$/i.test(file.name) || /^text\//.test(file.type)) { run([String(rd.result)], performance.now()); } else readPdf(new Uint8Array(rd.result)); };
    if (/\.txt$/i.test(file.name) || /^text\//.test(file.type)) rd.readAsText(file); else rd.readAsArrayBuffer(file); }
  fi.addEventListener('change', function () { take(fi.files[0]); });
  dz.addEventListener('click', function (e) { if (e.target.tagName !== 'LABEL' && e.target.tagName !== 'INPUT') fi.click(); });
  dz.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fi.click(); } });
  ['dragenter', 'dragover'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('is-over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('is-over'); }); });
  dz.addEventListener('drop', function (e) { var fl = e.dataTransfer && e.dataTransfer.files; if (fl && fl[0]) take(fl[0]); });
  var ta = document.getElementById('n30cr-t'); document.getElementById('n30cr-g').addEventListener('click', function () { if (ta.value.trim()) run(ta.value.split(/\f/), performance.now(), M.text); });
  document.getElementById('n30cr-c').addEventListener('click', function () { ta.value = ''; out.innerHTML = ''; st.textContent = ''; fi.value = ''; });
  window.N30CR_TEST = function (pages) { run(pages, performance.now()); return out.innerHTML; };   // used by the automated test only
}
export const CR_JS = '(' + crClient.toString() + ')();';

// ------------------------------------------------------------------------------------------------ client: natural-language search + before/after slider (served as /k/n30a.js)
function nlClient() {
  if (window.N30) return; window.N30 = {};
  var LG = (document.documentElement.lang || 'en').slice(0, 2), PRE = LG === 'en' ? '' : '/' + LG, W = __C__, T = W[LG] || W.en;
  var LOC = { en: 'en-GB', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' }[LG] || 'en-GB';
  function f(s, v) { for (var k in v) s = String(s).split('{' + k + '}').join(v[k]); return s; }
  function el(t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; }
  function nfm(n) { try { return Number(n).toLocaleString(LOC, { maximumFractionDigits: 0 }); } catch (e) { return String(n); } }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/([a-z])[\u0300-\u036f]+/g, '$1').normalize('NFC').replace(/[’']/g, "'"); }

  // ---------------------------------------------------------------- the parser: fixed rules, 8 languages
  var TY = [['v', /\bvill(?:a|as|e|en|a's)\b|вилл|别墅|فيلا|فلل|ville\b/], ['a', /\bapartments?\b|\bapp?art(?:amento|amentos|ement|ements|ementen|menten?)\b|\bflats?\b|\bcondos?\b|\bcondominiums?\b|\bpisos?\b|\bwohnung(?:en)?\b|квартир|апартамент|公寓|شقق|شقة|\bresidences?\b/], ['t', /\btown ?houses?\b|\badosados?\b|\bmaisons? de ville\b|\breihenh(?:au|äu)s(?:er)?\b|\brijtjeshuis\b|\brijwoning(?:en)?\b|таунхаус|联排|تاون ?هاوس/], ['p', /\bpent ?house?s?\b|\baticos?\b|\bpenthauser\b|пентхаус|顶层|بنتهاوس/], ['s', /\bstudios?\b|\bestudios?\b|студи|单间|开间|استوديو/], ['l', /\bland\b|\bplots?\b|\bterrenos?\b|\bparcelas?\b|\bterrains?\b|\bgrundst(?:u|ü)ck(?:e)?\b|\bkavels?\b|участ|土地|地块|أرض|اراض|أراض/], ['h', /\bhotels?\b|\bserviced\b|\bcondotel\b|\bhoteles\b|отел|гостинич|酒店|فندق/], ['o', /\boffices?\b|\bshops?\b|\boficinas?\b|\blocales\b|\bbureaux?\b|\bb(?:u|ü)ros?\b|\bkantor(?:en)?\b|офис|办公|商铺|مكاتب|مكتب|محلات/]];
  var PERMIT = /\b(?:with|has|having)\s+(?:a\s+|an\s+)?(?:building\s+)?(?:permit|licen[cs]e|permit number)\b|\blicensed\b|\bpermitted\b|\bcon\s+(?:licencia|permiso)\b|\bavec\s+(?:permis|licence)\b|\bmit\s+(?:genehmigung|baugenehmigung|lizenz)\b|\bmet\s+(?:vergunning|bouwvergunning)\b|с\s+разрешени|с\s+лицензи|有许可|有执照|有许可证|已获许可|مرخص|بترخيص|مع\s+ترخيص/;
  var NOPERMIT = /\b(?:without|no)\s+(?:a\s+)?(?:permit|licen[cs]e)\b|\bsin\s+(?:licencia|permiso)\b|\bsans\s+(?:permis|licence)\b|\bohne\s+(?:genehmigung|lizenz)\b|\bzonder\s+vergunning\b|без\s+разрешени|без\s+лицензи|无许可|没有许可|بدون\s+ترخيص/;
  var DONE = /\b(?:completed|finished|ready(?: to move)?|move-in|terminad[oa]s?|listos?|achev[ée]s?|livr[ée]s?|fertig(?:gestellt)?|bezugsfertig|opgeleverd)\b|сдан|готов|已完工|现房|已交付|مكتمل|جاهز/;
  var OFF = /\boff[- ]?plan\b|\bsobre plano\b|\bsur plan\b|\bvom plan\b|\bop plan\b|котлован|期房|على الخارطة/;
  var UC = /\bunder construction\b|\ben construcci[oó]n\b|\ben construction\b|\bim bau\b|\bin aanbouw\b|строящ|строит|在建|قيد الإنشاء/;
  var CHEAP = /\bcheap(?:est)?\b|\bm[aá]s barat[oa]s?\b|\bbarat[oa]s?\b|\bmoins chers?\b|\bg(?:u|ü)nstig(?:ste)?\b|\bgoedkoop(?:ste)?\b|дешев|最便宜|便宜|الأرخص|رخيص/;
  var SOON = /\bsoonest\b|\bearliest\b|\bm[aá]s pronto\b|\ble plus t[oô]t\b|\bfr(?:u|ü)heste\b|\bvroegste\b|ближайш|最早|الأقرب/;
  var TRANS = /\bmost transparent\b|\bm[aá]s transparentes?\b|\bplus transparents?\b|\btransparenteste\b|\bmeest transparante?\b|самые прозрачн|最透明|الأكثر شفافية/;
  var SCORE = /(?:\bscore|\btransparen[a-z]*|\bpuntuacion|\bnote|\bpunkte|прозрачност\p{L}*|балл\p{L}*|透明度|评分|الشفافية|درجة)\s*(?:of|de|von|van|над|über|above|over|at least|min(?:imum)?|más de|plus de|mehr als|meer dan|от|不低于|以上|أكثر من|\+|>|≥|=|:)?\s*(\d{1,3})\s*\+?/u;
  function endRx(list) { return new RegExp('(?:' + list.map(function (w) { w = norm(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\./g, '.'); return /[\u4e00-\u9fff\u0600-\u06ff]/.test(w) ? w : '(?:^|[^\\p{L}\\p{N}])' + w; }).join('|') + ')\\s*(?:the\\s+|el\\s+|la\\s+|le\\s+)?$', 'u'); }
  var BEFORE = endRx(['before', 'by', 'until', 'no later than', 'antes de', 'antes del', 'hasta', 'para', 'avant', "d'ici", 'vor', 'bis', 'spätestens', 'voor', 'uiterlijk', 'до', 'не позднее', 'قبل', 'حتى']);
  var AFTER = endRx(['after', 'from', 'since', 'desde', 'después de', 'a partir de', 'à partir de', 'après', 'ab', 'nach', 'vanaf', 'na', 'с', 'после', 'بعد', 'من']);
  var HOWORD = /handover|completion|delivery|ready|entrega|terminaci|livraison|achevement|ubergabe|fertigstellung|oplevering|сдач|交房|交付|تسليم/;
  var LT = endRx(['under', 'below', 'less than', 'max', 'maximum', 'up to', 'at most', '<', '≤', 'bajo', 'menos de', 'hasta', 'por debajo de', 'moins de', "jusqu'à", 'unter', 'bis', 'höchstens', 'maximal', 'onder', 'tot', 'maximaal', 'minder dan', 'до', 'меньше', 'не дороже', 'менее', '低于', '不超过', '不到', 'أقل من', 'حتى', 'بحد أقصى']);
  var GT = endRx(['over', 'above', 'more than', 'from', 'min', 'minimum', 'at least', '>', '≥', 'más de', 'desde', 'plus de', 'à partir de', 'über', 'ab', 'mehr als', 'boven', 'vanaf', 'meer dan', 'от', 'больше', 'свыше', 'более', '超过', '高于', 'أكثر من', 'من']);
  var CUR = [['USD', /\$|\busd\b|\bdollars?\b|\bdolares\b|\bdollar\b|долл[а-я]*|美元|دولار/], ['EUR', /€|\beur\b|\beuros?\b|евро|欧元|يورو/], ['GBP', /£|\bgbp\b|\bpounds?\b|фунт[а-я]*|英镑|جنيه إسترليني/], ['AED', /\baed\b|\bdirhams?\b|дирхам[а-я]*|迪拉姆|درهم/], ['THB', /฿|\bthb\b|\bbaht\b|бат|泰铢/], ['IDR', /\bidr\b|\brupiah\b|\brp\b|рупи|印尼盾/], ['MYR', /\bmyr\b|\bringgit\b|\brm\b|ринггит|令吉/], ['CNY', /\bcny\b|\brmb\b|元|人民币/], ['TRY', /\blira\b|лир/], ['MXN', /\bmxn\b|\bpesos?\b/]];
  var NUM = /(\d+(?:[.,\s]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?)\s*(k\b|m\b|mm\b|mn\b|mio\.?|mln\.?|millions?\b|million\b|mill(?:o|ó)n(?:es)?\b|mil\b|thousand\b|tys\.?|тыс\.?|тысяч\w*|млн\.?|миллион\w*|万|亿|千|ألف|الف|مليون|miljoen\b|miljard\b|milliard\w*)?/g;
  function numVal(s, mul) {
    var t = String(s).replace(/\s/g, ''); if (/^\d{1,3}([.,]\d{3})+$/.test(t)) t = t.replace(/[.,]/g, ''); else if (/^\d{1,3}([.,]\d{3})+[.,]\d{1,2}$/.test(t)) t = t.replace(/[.,](?=\d{3})/g, '').replace(',', '.'); else t = t.replace(',', '.');
    var v = parseFloat(t); if (!isFinite(v)) return null; var m = String(mul || '').toLowerCase();
    if (/^(m|mm|mn|mio|mln|million|mill[oó]n|млн|миллион|مليون|miljoen)/.test(m) && m !== 'mil') v *= 1e6; else if (/^(k|mil|thousand|tys|тыс|тысяч|千|ألف|الف)/.test(m)) v *= 1e3; else if (m === '万') v *= 1e4; else if (m === '亿') v *= 1e8; else if (/^(miljard|milliard)/.test(m)) v *= 1e9;
    return v;
  }
  N30.parse = function (raw, D) {   // D: facets (places, countries, areas) or null
    var q = norm(raw), Q = { ty: [], chips: [], used: [] }, cut = function (a, b) { Q.used.push([a, b]); };
    // types
    TY.forEach(function (p) { var m = q.match(p[1]); if (m) { Q.ty.push(p[0]); cut(m.index, m.index + m[0].length); } });
    // permit
    var m = q.match(NOPERMIT); if (m) { Q.pm = '0'; cut(m.index, m.index + m[0].length); } else if ((m = q.match(PERMIT))) { Q.pm = '1'; cut(m.index, m.index + m[0].length); }
    // stage and sort
    if ((m = q.match(OFF))) { Q.st = 'off-plan'; cut(m.index, m.index + m[0].length); } else if ((m = q.match(UC))) { Q.st = 'under construction'; cut(m.index, m.index + m[0].length); } else if ((m = q.match(DONE))) { Q.st = 'completed'; cut(m.index, m.index + m[0].length); }
    if ((m = q.match(CHEAP))) { Q.so = 'pr'; cut(m.index, m.index + m[0].length); } else if ((m = q.match(SOON))) { Q.so = 'ho'; cut(m.index, m.index + m[0].length); } else if ((m = q.match(TRANS))) { Q.so = 'tr'; cut(m.index, m.index + m[0].length); }
    if ((m = q.match(SCORE))) { Q.sc = Math.min(100, +m[1]); cut(m.index, m.index + m[0].length); }
    // years: ranges first, then single years with a word before them
    var yr = /(20[2-4]\d)\s*(?:-|–|to|a|à|bis|tot|по|至|到|إلى|y|and|und|en|et)\s*(20[2-4]\d)/g, ym;
    while ((ym = yr.exec(q))) { Q.y0 = Math.min(+ym[1], +ym[2]); Q.y1 = Math.max(+ym[1], +ym[2]); cut(ym.index, ym.index + ym[0].length); }
    if (Q.y0 == null) { var y1 = /20[2-4]\d/g; while ((ym = y1.exec(q))) { if (/[\d.,]/.test(q.charAt(ym.index - 1) || '') || /\d/.test(q.charAt(ym.index + 4) || '')) continue; var bf = q.slice(Math.max(0, ym.index - 24), ym.index), af = q.slice(ym.index + 4, ym.index + 12); if (/^\s*(?:k|m|mil|тыс|万)\b/.test(af)) continue; if (/年?\s*(?:之前|以前|前)/.test(af) && LG === 'zh') { Q.y1 = +ym[0]; } else if (/年?\s*(?:之后|以后|起)/.test(af) && LG === 'zh') { Q.y0 = +ym[0]; } else if (BEFORE.test(bf)) { Q.y1 = +ym[0]; } else if (AFTER.test(bf) && !HOWORD.test(bf.slice(-6))) { Q.y0 = +ym[0]; } else { Q.y0 = Q.y1 = +ym[0]; } var bm = bf.match(BEFORE) || bf.match(AFTER); cut(ym.index - (bm ? bm[0].length : 0), ym.index + 4 + (/^\s*年?\s*(?:之前|以前|前|之后|以后|起)?/.exec(af) || [''])[0].length); break; } }
    // prices: a number with a multiplier or a currency, or after a comparison word
    var cur = null; CUR.forEach(function (c) { if (!cur) { var cm = q.match(c[1]); if (cm) { cur = c[0]; cut(cm.index, cm.index + cm[0].length); } } });
    NUM.lastIndex = 0; var nm;
    while ((nm = NUM.exec(q))) {
      var s0 = nm.index, e0 = s0 + nm[0].length; if (Q.used.some(function (u) { return s0 >= u[0] && s0 < u[1]; })) continue;
      var bf2 = q.slice(Math.max(0, s0 - 22), s0), af2 = q.slice(e0, e0 + 10), yrlike = /^20[2-4]\d$/.test(nm[1]) && !nm[2];
      var curNear = /^\s*(?:\$|€|£|usd|eur|aed|gbp|thb|idr|myr|euros?|dollars?|d[oó]lares|dirhams?|baht|元|美元|欧元|دولار|درهم|يورو)/.test(af2) || /(?:\$|€|£|usd|eur|aed|gbp|thb|idr|myr)\s*$/.test(bf2);
      var bfc = bf2.replace(/(?:\$|€|£|usd|eur|aed|gbp|thb|idr|myr)\s*$/, ''), lt = LT.test(bfc) || /^\s*(?:万|元|美元|欧元)?\s*(?:以下|以内)/.test(af2), gt = !lt && (GT.test(bfc) || /^\s*(?:万|元|美元|欧元)?\s*(?:以上|起)/.test(af2));
      if (yrlike || (!nm[2] && !curNear && !lt && !gt)) continue;
      var v = numVal(nm[1], nm[2]); if (v == null || v < 1000 && !nm[2]) continue;
      if (lt || !gt) Q.pmax = v; else Q.pmin = v; Q.cur = cur || Q.cur || ({ es: 'EUR', fr: 'EUR', de: 'EUR', nl: 'EUR', zh: 'CNY', ar: 'AED' }[LG] || 'USD');
      var bm2 = (lt ? bfc.match(LT) : gt ? bfc.match(GT) : null); cut(s0 - (bf2.length - bfc.length) - (bm2 ? bm2[0].length : 0), e0 + (/^\s*(?:万|元|美元|欧元|迪拉姆)?\s*(?:以下|以内|以上|起)的?/.exec(af2) || [''])[0].length);
    }
    // places: longest names first (countries, places, areas), whole words in spaced scripts
    if (D && D.names) {
      for (var i = 0; i < D.names.length; i++) {
        var nmn = D.names[i], k = q.indexOf(nmn[0]); if (k < 0) continue;
        if (/[a-z0-9]/.test(nmn[0]) && (/[a-z0-9]/.test(q.charAt(k - 1) || '') || /[a-z0-9]/.test(q.charAt(k + nmn[0].length) || ''))) continue;
        if (Q.used.some(function (u) { return k < u[1] && k + nmn[0].length > u[0]; })) continue;
        (Q.pl = Q.pl || []).push(nmn); cut(k, k + nmn[0].length); if (Q.pl.length >= 3) break;
      }
    }
    // what is left: stop words out; the rest is matched against project and developer names, or reported as not understood
    var left = q.split(''); Q.used.forEach(function (u) { for (var j = Math.max(0, u[0]); j < Math.min(left.length, u[1]); j++) left[j] = ' '; });
    var STOP = /^(?:in|on|at|the|a|an|and|with|for|of|to|near|projects?|properties|property|homes?|new|buy|i|want|looking|show|me|all|en|el|la|los|las|de|del|y|con|para|un|una|proyectos?|comprar|quiero|busco|cerca|au|aux|a|le|les|des|du|et|avec|pour|un|une|projets?|acheter|je|cherche|im|in|auf|der|die|das|und|mit|fur|ein|eine|projekte?|kaufen|ich|suche|nahe|ubergabe|fertigstellung|op|het|een|met|voor|projecten|kopen|zoek|в|на|и|с|для|проекты?|купить|хочу|ищу|рядом|около|年|在|的|和|有|项目|我|想|买|في|و|مع|مشاريع|مشروع|أريد|شراء|handover|completion|delivery|entrega|livraison|übergabe|oplevering|сдача|сдачей|交房|تسليم|ready|price|precio|prix|preis|prijs|цена|价格|سعر|transparency|transparencia|transparence|transparenz|transparantie|прозрачность|透明度|الشفافية|score|k|m|,|\.)$/;
    Q.left = left.join('').split(/[\s,.;:!?()，。、]+/).map(function (w) { return /[\u4e00-\u9fff]/.test(w) ? w.replace(/[的在和有我想买要找个年]/g, '') : w; }).filter(function (w) { return w && (w.length >= 3 || /[\u4e00-\u9fff]/.test(w) && w.length >= 2) && !STOP.test(w) && !/^\d+$/.test(w); });
    return Q;
  };
  // facets: one row per project from /api/v1/facets, plus the names table for the parser
  var FP = null;
  N30.facets = function () {
    if (FP) return FP;
    FP = fetch('/api/v1/facets?lang=' + LG).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
      var rows = j.p.map(function (r) { var o = {}; j.fields.forEach(function (fl, i) { o[fl] = r[i]; }); o.h = ' ' + norm([o.n, o.dv].join(' ')) + ' '; return o; });
      var nm = {}, put = function (lab, kind, val, show) { var k = norm(lab).trim(); if (!nm[k] && (k.length >= 3 || /[^\x00-\x7f]/.test(k) && k.length >= 2)) nm[k] = [k, kind, val, show]; };
      rows.forEach(function (o) { o.arn = norm(o.ar || ''); [o.con, o.pln].forEach(function (lab) { var k = norm(lab || '').trim(); if (/[а-я]/.test(k) && k.length >= 5 && /[аяйьоеиуы]$/.test(k)) { if (lab === o.con) put(k.slice(0, -1), 'co', o.co, o.con); else put(k.slice(0, -1), 'pl', o.pl, o.pln); } }); if (o.co) { put(o.con || o.co, 'co', o.co, o.con || o.co); put(o.co, 'co', o.co, o.con || o.co); } if (o.pl) { put(o.pln || o.pl, 'pl', o.pl, o.pln || o.pl); put(o.pl, 'pl', o.pl, o.pln || o.pl); } });
      rows.forEach(function (o) { if (o.ar) String(o.ar).replace(/\([^)]*\)/g, ' ').split(/\s*,\s*/).forEach(function (a) { a = a.trim(); if (a.length >= 4 && !/^(?:near|city|district|area|zone|phase|block|new|old|north|south|east|west)\b/i.test(a)) put(a, 'arn', norm(a).trim(), a); }); });
      var names = Object.keys(nm).map(function (k) { return nm[k]; }).sort(function (a, b) { return b[0].length - a[0].length; });
      return { rows: rows, names: names, fx: j.fx || null };
    }).catch(function () { FP = null; return null; });
    return FP;
  };
  function toUSD(v, cur, fx) { if (!v) return v; if (cur === 'USD' || !fx || !fx.r) return v; var r = fx.r[cur]; return r ? v / r : null; }
  function money(v, cur) { return (cur === 'USD' ? 'USD ' : cur + ' ') + nfm(v); }
  N30.chips = function (Q) {   // [label, key]
    var C = []; Q.ty.forEach(function (t) { C.push([T.ty[t], 'ty:' + t]); });
    (Q.pl || []).forEach(function (p, i) { C.push([f(T.in_, { p: p[3] }), 'pl:' + i]); });
    if (Q.pm) C.push([Q.pm === '1' ? T.pm1 : T.pm0, 'pm']);
    if (Q.y0 != null || Q.y1 != null) C.push([Q.y0 === Q.y1 ? f(T.y, { y: Q.y0 }) : Q.y0 == null ? f(T.ylt, { y: Q.y1 }) : Q.y1 == null ? f(T.ygt, { y: Q.y0 }) : f(T.yr, { a: Q.y0, b: Q.y1 }), 'y']);
    if (Q.pmax) C.push([f(T.plt, { p: money(Q.pmax, Q.cur) }), 'pmax']); if (Q.pmin) C.push([f(T.pgt, { p: money(Q.pmin, Q.cur) }), 'pmin']);
    if (Q.sc != null) C.push([f(T.sc, { n: Q.sc }), 'sc']);
    if (Q.st) C.push([Q.st === 'completed' ? T.stc : Q.st === 'off-plan' ? T.sto : T.stu, 'st']);
    if (Q.so) C.push([Q.so === 'pr' ? T.sop : Q.so === 'ho' ? T.soh : T.sot, 'so']);
    (Q.words || []).forEach(function (w, i) { C.push([f(T.w, { w: w }), 'w:' + i]); });
    return C;
  };
  N30.drop = function (Q, key) { var k = key.split(':'); if (k[0] === 'ty') Q.ty = Q.ty.filter(function (t) { return t !== k[1]; }); else if (k[0] === 'pl') Q.pl.splice(+k[1], 1); else if (k[0] === 'y') { Q.y0 = Q.y1 = null; } else if (k[0] === 'w') Q.words.splice(+k[1], 1); else delete Q[k[0]]; };
  N30.filter = function (Q, D) {
    var pmaxU = Q.pmax ? toUSD(Q.pmax, Q.cur, D.fx) : null, pminU = Q.pmin ? toUSD(Q.pmin, Q.cur, D.fx) : null, byKind = {};
    (Q.pl || []).forEach(function (p) { (byKind[p[1]] = byKind[p[1]] || []).push(p[2]); });
    var R = D.rows.filter(function (r) {
      if (Q.ty.length && !Q.ty.some(function (t) { return String(r.ty || '').indexOf(t) >= 0; })) return false;
      for (var kd in byKind) if (kd === 'arn' ? !byKind[kd].some(function (a) { return r.arn.indexOf(a) >= 0; }) : byKind[kd].indexOf(r[kd]) < 0) return false;
      if (Q.pm && String(+!!r.pm) !== Q.pm) return false;
      if (Q.y0 != null || Q.y1 != null) { if (r.yr == null) return false; if (Q.y0 != null && r.yr < Q.y0) return false; if (Q.y1 != null && r.yr > Q.y1) return false; }
      if (pmaxU != null && !(r.pu > 0 && r.pu <= pmaxU)) return false; if (pminU != null && !(r.pu >= pminU)) return false;
      if (Q.sc != null && !(r.sc >= Q.sc)) return false; if (Q.st && r.st !== Q.st) return false;
      if ((Q.words || []).length && !Q.words.every(function (w) { return r.h.indexOf(w) >= 0; })) return false;
      return true;
    });
    var z = function (v, d) { return v == null ? d : v; };
    if (Q.so === 'pr') R.sort(function (a, b) { return z(a.pu, 1e15) - z(b.pu, 1e15); }); else if (Q.so === 'ho') R.sort(function (a, b) { return String(z(a.hk, '9999')).localeCompare(String(z(b.hk, '9999'))); }); else if (Q.so === 'tr') R.sort(function (a, b) { return z(b.sc, -1) - z(a.sc, -1); });
    return R;
  };
  N30.resolve = function (raw, D) { var Q = N30.parse(raw, D); Q.words = []; Q.un = []; Q.left.forEach(function (w) { if (D.rows.some(function (r) { return r.h.indexOf(w) >= 0; })) Q.words.push(w); else Q.un.push(w); }); return Q; };
  N30.structured = function (Q) { return Q.ty.length + (Q.pl || []).length + (Q.pm ? 1 : 0) + (Q.y0 != null || Q.y1 != null ? 1 : 0) + (Q.pmax || Q.pmin ? 1 : 0) + (Q.sc != null ? 1 : 0) + (Q.st ? 1 : 0); };

  var css = el('style'); css.textContent = '.n30q{margin:18px 0 0;max-width:820px}.n30q label{display:block;font-weight:700;margin:0 0 6px}.n30q form{display:flex;gap:8px;flex-wrap:wrap}.n30q input{flex:1 1 260px;min-width:0;min-height:52px;padding:0 14px;border:2px solid var(--ink,#17212B);border-radius:14px;font:inherit;font-size:1.02rem;background:var(--paper,#fff);color:inherit}.n30q button{min-height:52px;padding:0 18px;border-radius:14px;border:0;background:var(--ink,#17212B);color:#fff;font:inherit;font-weight:700;cursor:pointer}' +
    '.n30chips{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 0;padding:0;list-style:none}.n30chips li button,.n30chips li span{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 12px;border:1.5px solid var(--k-sea,#155C75);border-radius:20px;background:color-mix(in srgb,var(--k-sea,#155C75) 8%,transparent);color:inherit;font:inherit;font-size:.92rem;font-weight:600;cursor:pointer}.n30chips li button::after{content:"\\00d7";font-size:1.1rem;line-height:1}.n30chips .un{border-style:dashed;border-color:var(--muted,#59626B);background:none;cursor:default;font-weight:400}' +
    '.n30n{margin:8px 0 0;font-weight:700}.n30h{margin:6px 0 0;font-size:.84rem;color:var(--muted,#59626B)}.n30o{list-style:none;margin:8px 0 14px;padding:0}.n30o li{padding:9px 0;border-bottom:1px solid var(--line,#d5d3cc)}.n30o a{font-weight:600}.n30o small{display:block;color:var(--muted,#59626B);font-size:.84rem;margin-top:2px}.n30m{min-height:44px;margin:0 0 14px;padding:0 14px;border:1.5px solid var(--ink,#17212B);border-radius:10px;background:none;color:inherit;font:inherit;font-weight:600;cursor:pointer}' +
    '.n30hint{position:absolute;inset-inline:0;top:calc(100% + 6px);z-index:41;margin:0;padding:10px 12px;background:#fff;color:#17212B;border:1px solid rgba(23,33,43,.15);border-radius:14px;box-shadow:0 16px 40px rgba(23,33,43,.22);text-align:start}.n30hint p{margin:0 0 6px;font-size:.84rem;color:#59626B}.n30hint .n30chips span{border-color:#155C75;font-size:.86rem;min-height:32px;cursor:default}.n30hint a{display:inline-flex;align-items:center;min-height:44px;font-weight:700;color:#155C75}' +
    '.n30ba{margin:14px 0 0}.n30ba-v{position:relative;width:min(384px,100%);aspect-ratio:1;margin:0 auto;border-radius:6px;overflow:hidden;touch-action:none;user-select:none;background:#E8ECEA}.n30ba-v canvas{position:absolute;inset:0;width:100%;height:100%}.n30ba-v .b{clip-path:inset(0 0 0 50%)}.n30ba-h{position:absolute;top:0;bottom:0;left:50%;width:3px;margin-left:-1.5px;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.35)}.n30ba-h::after{content:"\\2194";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:36px;height:36px;border-radius:50%;background:#fff;color:#17212B;display:grid;place-items:center;font-weight:800;box-shadow:0 2px 8px rgba(0,0,0,.3)}' +
    '.n30ba-l{position:absolute;top:8px;padding:2px 8px;border-radius:6px;background:rgba(0,0,0,.6);color:#fff;font-size:.8rem;font-weight:700}.n30ba-l.a{left:8px}.n30ba-l.b2{right:8px}.n30ba-c{display:grid;grid-template-columns:1fr 1fr;gap:8px;max-width:520px;margin:10px auto 0}.n30ba-c label{display:flex;flex-direction:column;gap:4px;font-size:.84rem;font-weight:600}.n30ba-c select{min-height:44px;border:1.5px solid var(--line,#d5d3cc);border-radius:10px;padding:0 8px;font:inherit;background:var(--paper,#fff);color:inherit}.n30ba-r{width:100%;min-height:44px;accent-color:var(--k-sea,#155C75)}.n30ba p{font-size:.82rem;color:var(--muted,#59626B);margin:6px 0 0}';
  document.head.appendChild(css);

  function chipList(Q, onDrop, ro) {
    var ul = el('ul', 'n30chips'); N30.chips(Q).forEach(function (c) { var li = el('li'), b = el(ro ? 'span' : 'button', null, c[0]); if (!ro) { b.type = 'button'; b.setAttribute('aria-label', f(T.rm, { x: c[0] })); b.addEventListener('click', function () { onDrop(c[1]); }); } li.appendChild(b); ul.appendChild(li); });
    if (!ro) (Q.un || []).forEach(function (w) { var li = el('li'), s = el('span', 'un', f(T.un, { w: w })); li.appendChild(s); ul.appendChild(li); });
    return ul;
  }

  // ---------------------------------------------------------------- /projects/: the search box, chips and results
  var LISTS = document.querySelector('[data-kx-lists]');
  if (LISTS && /\/projects\/?$/.test(location.pathname)) {
    var host = document.querySelector('.kf') || LISTS, box = el('div', 'n30q'), fm = el('form'), lab = el('label', null, T.lbl), inp = el('input'), go = el('button', null, T.go), chips = el('div'), cnt = el('p', 'n30n'), how = el('p', 'n30h'), ol = el('ol', 'n30o'), Q = null, lim = 60;
    inp.type = 'search'; inp.id = 'n30q-i'; lab.htmlFor = 'n30q-i'; inp.placeholder = T.ph; inp.autocomplete = 'off'; inp.setAttribute('enterkeyhint', 'search'); go.type = 'submit'; cnt.setAttribute('role', 'status'); cnt.setAttribute('aria-live', 'polite'); ol.hidden = true;
    fm.setAttribute('role', 'search'); fm.appendChild(inp); fm.appendChild(go); box.appendChild(lab); box.appendChild(fm); box.appendChild(chips); box.appendChild(cnt); box.appendChild(ol); box.appendChild(how);
    host.parentNode.insertBefore(box, host);
    var url = function (q) { try { var u = new URL(location.href); if (q) u.searchParams.set('q', q); else u.searchParams.delete('q'); history.replaceState(null, '', u); } catch (e) {} };
    var draw = function (D) {
      chips.innerHTML = ''; ol.innerHTML = ''; var old = box.querySelector('.n30m'); if (old) old.remove();
      if (!Q || (!N30.structured(Q) && !(Q.words || []).length && !Q.so)) { ol.hidden = true; cnt.textContent = Q && (Q.un || []).length ? f(T.un, { w: Q.un.join(' ') }) : ''; LISTS.hidden = false; how.textContent = ''; return; }
      chips.appendChild(chipList(Q, function (k) { N30.drop(Q, k); draw(D); }));
      var R = N30.filter(Q, D); LISTS.hidden = true; ol.hidden = false;
      cnt.textContent = R.length === 1 ? T.k1 : R.length ? f(T.k, { k: nfm(R.length) }) : T.z;
      R.slice(0, lim).forEach(function (r) { var li = el('li'), a = el('a', null, r.n), s = el('small'); a.href = PRE + '/projects/' + r.s + '/'; s.textContent = [r.dv, r.pln, r.ho, r.pr ? money(r.pr, r.cu || '') : T.np, r.sc != null ? f(T.sct, { s: r.sc }) : ''].filter(Boolean).join(' \u00b7 '); li.appendChild(a); li.appendChild(s); ol.appendChild(li); });
      if (R.length > lim) { var mb = el('button', 'n30m', T.more); mb.type = 'button'; mb.addEventListener('click', function () { lim += 200; draw(D); }); ol.after(mb); }
      how.textContent = f(T.how, { d: D.fx && D.fx.d ? D.fx.d : '' });
    };
    var run = function () { var v = inp.value.trim(); url(v); if (!v) { Q = null; N30.facets().then(function (D) { if (D) draw(D); }); return; } N30.facets().then(function (D) { if (!D) return; Q = N30.resolve(v, D); lim = 60; draw(D); }); };
    fm.addEventListener('submit', function (e) { e.preventDefault(); run(); });
    inp.addEventListener('focus', function () { N30.facets(); }, { once: true });
    try { var q0 = new URL(location.href).searchParams.get('q'); if (q0) { inp.value = q0; run(); } } catch (e) {}
  }

  // ---------------------------------------------------------------- home: a hint under the check box when the words read as a search
  var HQ = document.querySelector('form[data-check] #hero-url');
  if (HQ) {
    var F2 = HQ.form, hint = el('div', 'n30hint'), last = '', tm;
    hint.hidden = true; F2.style.position = 'relative'; F2.appendChild(hint);
    var looksUrl = function (v) { return /^(?:https?:\/\/|www\.)|\.[a-z]{2,}(?:\/|$)/i.test(v.trim()); };
    var upd = function () {
      var v = HQ.value.trim(); if (v === last) return; last = v;
      if (v.length < 6 || looksUrl(v)) { hint.hidden = true; return; }
      N30.facets().then(function (D) { if (!D || HQ.value.trim() !== v) return; var Q = N30.resolve(v, D); if (N30.structured(Q) < 2) { hint.hidden = true; return; } var R = N30.filter(Q, D);
        hint.innerHTML = ''; hint.appendChild(el('p', null, T.hint)); hint.appendChild(chipList(Q, null, true)); var a = el('a', null, f(T.open, { k: nfm(R.length) }) + ' \u2192'); a.href = PRE + '/projects/?q=' + encodeURIComponent(v); hint.appendChild(a); hint.hidden = false;
        var khs = F2.querySelector('.khs'); if (khs) khs.hidden = true; F2.setAttribute('data-n30', a.href); });
    };
    HQ.addEventListener('input', function () { clearTimeout(tm); F2.removeAttribute('data-n30'); tm = setTimeout(upd, 160); });
    F2.addEventListener('submit', function (e) { var h = F2.getAttribute('data-n30'); if (h && !hint.hidden) { e.preventDefault(); e.stopImmediatePropagation(); location.href = h; } }, true);
    document.addEventListener('click', function (e) { if (!F2.contains(e.target)) hint.hidden = true; });
    if (HQ.value) upd();
  }

  // ---------------------------------------------------------------- before/after satellite slider (called by the time machine button)
  N30.ba = function (fig, d, img, T0) {
    if (fig.querySelector('.n30ba')) { fig.querySelector('.n30ba').scrollIntoView({ block: 'nearest' }); return; }
    var n = d.length, Tz = T0 || 96, w = el('div', 'n30ba'), v = el('div', 'n30ba-v'), ca = el('canvas'), cb = el('canvas', 'b'), h = el('div', 'n30ba-h'), la = el('span', 'n30ba-l a'), lb = el('span', 'n30ba-l b2'), rg = el('input', 'n30ba-r'), cc = el('div', 'n30ba-c'), p = el('p', null, T.bas);
    ca.width = cb.width = 384; ca.height = cb.height = 384; v.setAttribute('dir', 'ltr'); v.appendChild(ca); v.appendChild(cb); v.appendChild(h); v.appendChild(la); v.appendChild(lb);
    rg.type = 'range'; rg.min = 0; rg.max = 100; rg.value = 50; rg.setAttribute('aria-label', T.bad);
    var mk = function (lbl, sel) { var L = el('label'), s = el('select'); L.appendChild(document.createTextNode(lbl)); d.forEach(function (e, i) { var o = el('option', null, e[0]); o.value = i; s.appendChild(o); }); s.value = sel; L.appendChild(s); cc.appendChild(L); return s; };
    var sa = mk(T.baa, 0), sb = mk(T.bab, n - 1);
    w.appendChild(v); w.appendChild(rg); w.appendChild(cc); w.appendChild(p); var anchor = fig.querySelector('.ktm-g') || fig.lastChild; fig.insertBefore(w, anchor);
    var drawOne = function (c, i) { var x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(img, d[i][3] * Tz, 0, Tz, Tz, 0, 0, c.width, c.height); };
    var paint = function () { if (!img.complete || !img.naturalWidth) return; drawOne(ca, +sa.value); drawOne(cb, +sb.value); la.textContent = T.baa + ': ' + d[+sa.value][0]; lb.textContent = T.bab + ': ' + d[+sb.value][0]; };
    var pos = function (pc) { pc = Math.max(0, Math.min(100, pc)); cb.style.clipPath = 'inset(0 0 0 ' + pc + '%)'; h.style.left = pc + '%'; rg.value = Math.round(pc); rg.setAttribute('aria-valuetext', Math.round(pc) + '%'); };
    var drag = function (e) { var r = v.getBoundingClientRect(); pos((e.clientX - r.left) / r.width * 100); };
    v.addEventListener('pointerdown', function (e) { v.setPointerCapture(e.pointerId); drag(e); v.addEventListener('pointermove', drag); });
    v.addEventListener('pointerup', function () { v.removeEventListener('pointermove', drag); });
    rg.addEventListener('input', function () { pos(+rg.value); }); sa.addEventListener('change', paint); sb.addEventListener('change', paint);
    if (img.complete && img.naturalWidth) paint(); else img.addEventListener('load', paint, { once: true });
    pos(50); w.scrollIntoView({ block: 'nearest' });
  };
  if (window.N30_BA_Q) { var qq = window.N30_BA_Q; window.N30_BA_Q = null; N30.ba.apply(null, qq); }
}
export const NL_JS = '(' + nlClient.toString().replace('__C__', JSON.stringify(C)) + ')();';
// appended to /k/u27.js: loads /k/n30a.js on the home search box and on /projects/ only
export const LOADER = "(function(){var p=location.pathname;if(document.querySelector('form[data-check] #hero-url')||(/\\/projects\\/?$/.test(p)&&document.querySelector('[data-kx-lists]'))){var s=document.createElement('script');s.src='/k/n30a.js?v=" + N30V + "';s.async=true;document.head.appendChild(s);}})();";
// the time machine's "Compare two dates" button (kbx_named_sat.js): queue the call and load the script once
export const BA_BTN_JS = ";var ba=f.querySelector('[data-n30ba]');if(ba)ba.addEventListener('click',function(){on();var a=[f,d,im,T];if(window.N30&&window.N30.ba){window.N30.ba.apply(null,a);return}window.N30_BA_Q=a;if(!document.querySelector('script[data-n30]')){var s=document.createElement('script');s.src='/k/n30a.js?v=" + N30V + "';s.setAttribute('data-n30','');document.head.appendChild(s)}});";
export const baButton = lang => '<button type="button" class="k-btn k-btn--sm k-btn--ghost" data-n30ba>' + esc((C[lang] || C.en).ba) + '</button>';

// ------------------------------------------------------------------------------------------------ routes
export const PATHS = /^\/k\/n30a(?:-cr)?\.js$|^\/api\/v1\/slippage(?:\.csv)?$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:tools\/contract-reader|methods\/handover-slippage|projects\/[a-z0-9-]{1,90}\/timeline)\/?$/;
export async function handle(req, u, env, ctx, shell) {
  const p = u.pathname;
  if (req.method !== 'GET' && req.method !== 'HEAD') return null;
  const js = (body) => new Response(body, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': u.searchParams.get('v') === N30V ? 'public, max-age=31536000, immutable' : 'public, max-age=300', 'x-content-type-options': 'nosniff' } });
  if (p === '/k/n30a.js') return js(NL_JS);
  if (p === '/k/n30a-cr.js') return js(CR_JS);
  try {
    if (p === '/api/v1/slippage' || p === '/api/v1/slippage.csv') return await slipApi(env, p.endsWith('.csv'));
  } catch (e) { return jr({ error: 'unavailable' }, 503, 'no-store'); }
  const m = p.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(tools\/contract-reader|methods\/handover-slippage|projects\/([a-z0-9-]{1,90})\/timeline)(\/?)$/); if (!m) return null;
  if (!m[4]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
  const lang = m[1] || 'en';
  try {
    if (m[2] === 'tools/contract-reader') return await readerPage(u, env, shell, lang);
    if (m[2] === 'methods/handover-slippage') return await slipPage(u, env, shell, lang);
    return await timelinePage(u, env, shell, lang, m[3]);
  } catch (e) { return null; }
}
