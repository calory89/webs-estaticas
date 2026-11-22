// kolaboro.com batch 35 (agent n35a, 22 Nov 2026): intelligence from our own data. The worker renders page shells and small blocks on
// existing pages; the data are static files built by /open/n35a-build.py (published files only); browser code is static under /k/n35a/.
//   /[l/]construction-pace/                         Dubai: DLD % built against time elapsed to the registered completion date, projected range
//   /[l/]prices/asking-vs-registered/[<area>/]      Dubai: advertised price per m2 against registered off-plan sales per m2, per DLD area
//   /[l/]registers/escrow-banks/                    Dubai projects by the escrow bank printed on the DLD register
//   /[l/]signals/ and /[l/]developers/<slug>/signals/   one dated stream of public signals per developer, filterable
//   /[l/]data/contradictions/                       the same field with different values in two of our sources
//   /[l/]data/aliases/                              names across scripts and languages, the matching rule, a tester
//   /[l/]data/dictionary/                           every public field: definition, type, coverage per market, source types, code
//   /[l/]data/diff/                                 dataset diff between two snapshot dates, in the browser from the delta files
//   /[l/]data/ask/                                  rule-based questions in 8 languages turned into SQL on the DuckDB-WASM dataset
//   /[l/]satellite/changes/                         largest Sentinel-2 built-up index changes between the last two clear readings
// Strings in 8 languages: /data/n35a-i18n.json (static asset, read once per isolate).
const ORIGIN = 'https://kolaboro.com';
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const V = 'a1';
let T = null;
async function loadT(env) {
  if (T) return T;
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/n35a-i18n.json')); if (r.ok) T = await r.json(); } catch (e) {}
  if (!T) { try { const r = await fetch(ORIGIN + '/data/n35a-i18n.json', { cf: { cacheTtl: 300 } }); if (r.ok) T = await r.json(); } catch (e) {} }
  return T;
}
const MEMO = {};
async function file(env, p) {
  const m = MEMO[p]; if (m && Date.now() - m.t < 900000) return m.v;
  let v = null;
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com' + p)); if (r.ok) v = await r.json(); } catch (e) { v = null; }
  MEMO[p] = { t: Date.now(), v }; return v;
}
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const t = (l, k) => { const a = T && T[l] && T[l][k]; return a != null ? a : T && T.en[k] != null ? T.en[k] : ''; };
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
const nf = (n, l, d) => { if (n == null || n === '') return '-'; try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { maximumFractionDigits: d == null ? 0 : d, numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); } };
const fd = (d, l, short) => { if (!d) return '-'; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', short ? { month: 'short', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' } : { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(String(d).slice(0, 10).padEnd(10, '-15').replace(/-$/, '') + 'T12:00:00Z')); } catch (e) { return String(d).slice(0, 10); } };
const bdi = (l, h) => l === 'ar' ? '<bdi>' + h + '</bdi>' : h;
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const ext = u => u ? '<a href="' + esc(u) + '" rel="nofollow noopener" target="_blank">' + esc(hostOf(u) || u) + '</a>' : '';
const pU = (l, s) => pre(l) + '/projects/' + s + '/';
const dU = (l, s) => pre(l) + '/developers/' + s + '/';
const LP = '(?:(es|de|fr|nl|ru|zh|ar)\\/)?';
const F = { pace: 'construction-pace', ask: 'prices\\/asking-vs-registered(?:\\/([a-z0-9-]{2,60}))?', esc: 'registers\\/escrow-banks', sig: 'signals', dsig: 'developers\\/([a-z0-9-]{1,90})\\/signals',
  con: 'data\\/contradictions', ali: 'data\\/aliases', dic: 'data\\/dictionary', dif: 'data\\/diff', qa: 'data\\/ask', sat: 'satellite\\/changes' };
const R = {}; for (const k in F) R[k] = new RegExp('^\\/' + LP + F[k] + '\\/?$');
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:construction-pace|prices\/asking-vs-registered(?:\/[a-z0-9-]{2,60})?|registers\/escrow-banks|signals|developers\/[a-z0-9-]{1,90}\/signals|data\/(?:contradictions|aliases|dictionary|diff|ask)|satellite\/changes)\/?$/;
export const INJECT = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:projects\/[a-z0-9-]{1,90}|developers\/[a-z0-9-]{1,90}|m\/dubai|engineering|yc|data|data\/sql|registers|satellite\/construction-index|numbers)\/$/;
const ALL = [['pace', '/construction-pace/'], ['ask', '/prices/asking-vs-registered/'], ['esc', '/registers/escrow-banks/'], ['sig', '/signals/'], ['con', '/data/contradictions/'], ['ali', '/data/aliases/'], ['dic', '/data/dictionary/'], ['dif', '/data/diff/'], ['qa', '/data/ask/'], ['sat', '/satellite/changes/']];
const CSS = '<style>.n35{max-width:1100px}.n35 h2{margin:28px 0 8px;font-size:1.3rem}.n35 p,.n35 li{max-width:78ch;line-height:1.6}.n35-tw{overflow-x:auto;border:1px solid var(--line,#d5d3cc);border-radius:12px;margin:10px 0 22px;-webkit-overflow-scrolling:touch}' +
  '.n35 table{width:100%;border-collapse:collapse;font-size:.93rem}.n35 th,.n35 td{padding:8px 10px;border-bottom:1px solid var(--line,#d5d3cc);text-align:start;vertical-align:top}.n35 thead th{font-size:.82rem;background:var(--card,#fff)}.n35 td.n{font-variant-numeric:tabular-nums;white-space:nowrap}' +
  '.n35 .k-xs{font-size:.9rem;color:var(--muted,#59626B)}.n35-rel,.n35-f{display:flex;flex-wrap:wrap;gap:4px 16px;padding:0;list-style:none}.n35-rel a,.n35-f a{display:inline-flex;min-height:44px;align-items:center}.n35-f a[aria-current]{font-weight:700;text-decoration:none}' +
  '.n35-k{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0}.n35-k div{border:1px solid var(--line,#d5d3cc);border-radius:12px;padding:8px 12px;min-width:130px;max-width:260px}.n35-k b{display:block;font-size:1.25rem}' +
  '.n35 .bad{color:#B42318;font-weight:600}.n35 .ok{color:#0B7A55;font-weight:600}:root[data-theme=dark] .n35 .ok{color:#4BE3A4}:root[data-theme=dark] .n35 .bad{color:#FF8A80}.n35 code,.n35 pre{font-size:.88em;overflow-wrap:anywhere}' +
  '.n35 pre{white-space:pre-wrap;background:var(--card,#f6f5f1);border:1px solid var(--line,#d5d3cc);border-radius:10px;padding:10px 12px}.n35 input,.n35 select{font:inherit;min-height:44px;padding:8px 10px;border:1px solid var(--line,#c9c6bd);border-radius:10px;background:var(--card,#fff);color:inherit;max-width:100%}' +
  '.n35 button{min-height:44px}.n35 form{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0}.n35 svg{max-width:100%;height:auto}.n35-note{border-inline-start:3px solid var(--line,#d5d3cc);padding-inline-start:10px}</style>';
const table = (th, rows, cap) => '<div class="n35-tw" tabindex="0" role="region"' + (cap ? ' aria-label="' + esc(cap) + '"' : '') + '><table>' + (cap ? '<caption class="k-xs" style="text-align:start;padding:6px 10px">' + esc(cap) + '</caption>' : '') + '<thead><tr>' + th.map(x => '<th scope="col">' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
const kpis = xs => '<div class="n35-k">' + xs.map(x => '<div><b>' + x[0] + '</b>' + esc(x[1]) + '</div>').join('') + '</div>';
const sec = (h, b, id) => '<h2' + (id ? ' id="' + id + '"' : '') + '>' + esc(h) + '</h2>' + b;
const paras = (l, k) => [].concat(t(l, k) || []).map(p => '<p>' + esc(p) + '</p>').join('');
const files = (l, fs) => '<p class="k-xs">' + esc(t(l, 'files')) + ': ' + fs.map(f => '<a href="' + f + '"' + (l === 'ar' ? ' dir="ltr"' : '') + '>' + esc(f) + '</a>').join(' · ') + '</p>';
const ci = (l, a, d, suf) => a ? ' <span class="k-xs">(' + esc(t(l, 'ci')) + ' ' + bdi(l, nf(a[0], l, d) + '–' + nf(a[1], l, d) + (suf || '')) + ')</span>' : '';
const filt = (l, base, key, cur, opts) => '<ul class="n35-f" aria-label="' + esc(t(l, 'filter')) + '">' + [['', t(l, 'all')]].concat(opts).map(o => '<li><a href="' + base + (o[0] ? '?' + key + '=' + encodeURIComponent(o[0]) : '') + '"' + ((cur || '') === o[0] ? ' aria-current="page"' : '') + ' rel="nofollow">' + esc(o[1]) + '</a></li>').join('') + '</ul>';
const N = () => import('./kbx_named.js');
const rel = (l, skip) => '<h2>' + esc(t(l, 'more')) + '</h2><ul class="n35-rel">' + ALL.filter(x => x[0] !== skip).map(x => '<li><a href="' + pre(l) + x[1] + '">' + esc(t(l, x[0] + '_t')) + '</a></li>').join('') + '<li><a href="' + pre(l) + '/engineering/">' + esc(t(l, 'eng')) + '</a></li></ul>';

async function page(shell, l, o) {
  const n = await N(), canon = ORIGIN + pre(l) + o.path;
  const crumbs = [[t(l, 'home'), pre(l) + '/']].concat(o.crumb || []).concat([[o.h1, null]]);
  const dir = l === 'ar' ? ' dir="rtl"' : '';
  const body = '<section class="phero"' + dir + '><div class="wrap"><p class="crumb">' + crumbs.map(c => c[1] ? '<a href="' + esc(c[1]) + '">' + esc(c[0]) + '</a>' : esc(c[0])).join(' / ') + '</p><h1>' + esc(o.h1) + '</h1><p class="lead">' + esc(o.lead) + '</p>' +
    (o.updated ? '<p class="k-xs">' + esc(fill(t(l, 'upd'), { d: fd(o.updated, l) })) + '</p>' : '') + '</div></section><div class="wrap n35"' + dir + '>' + CSS + o.body + rel(l, o.k) + '</div>';
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': o.type || 'WebPage', url: canon, name: o.h1, description: o.lead, inLanguage: l, dateModified: o.updated || '2026-11-22', isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] ? ORIGIN + c[1] : canon })) }].concat(o.ld || []) };
  const desc = o.lead.length > 155 ? o.lead.slice(0, 152).replace(/\s+\S*$/, '') + '…' : o.lead;
  const html = await n.assemble({ title: (o.h1.length > 46 ? o.h1.slice(0, 46).replace(/\s+\S*$/, '') : o.h1) + ' | Kolaboro', desc, canon, body, ld, alt: x => ORIGIN + pre(x) + o.path }, l, await shell(pre(l) + '/how-we-score/'));
  const h = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=900', 'content-language': l };
  if (o.noindex) h['x-robots-tag'] = 'noindex, follow';
  return new Response(html, { status: 200, headers: h });
}
const H = (l, k) => ({ h1: t(l, k + '_t'), lead: t(l, k + '_l'), k });
const DS = l => [t(l, 'data'), pre(l) + '/data/'];
const nonceOf = n => n || '';

// ------------------------------------------------------------------------------------------------ 1. construction pace
const KL = (l, k) => t(l, 'pk_' + k);
const gapC = g => g == null ? '' : g < -10 ? ' class="n bad"' : ' class="n"';
const projTxt = (l, r) => r.proj ? (r.proj[0] === r.proj[1] ? esc(fd(r.proj[0], l, 1)) : bdi(l, esc(fd(r.proj[0], l, 1)) + ' – ' + esc(fd(r.proj[1], l, 1)))) : '<span class="k-xs">' + esc(t(l, r.pct != null && r.pct < 10 ? 'p_low' : 'p_none')) + '</span>';
function histSvg(l, h) {
  const mx = Math.max(...h.map(x => x[1])), w = 34, H0 = 120;
  const bars = h.map((x, i) => { const bh = Math.round(H0 * x[1] / mx); return '<g><rect x="' + (i * (w + 4)) + '" y="' + (H0 - bh) + '" width="' + w + '" height="' + bh + '" rx="3" fill="' + (x[0] < -10 ? '#B42318' : '#0B7A55') + '" opacity=".8"></rect><text x="' + (i * (w + 4) + w / 2) + '" y="' + (H0 + 14) + '" font-size="10" text-anchor="middle" fill="currentColor">' + (x[0] <= -60 ? '≤-60' : x[0]) + '</text><text x="' + (i * (w + 4) + w / 2) + '" y="' + (H0 - bh - 3) + '" font-size="10" text-anchor="middle" fill="currentColor">' + x[1] + '</text></g>'; }).join('');
  return '<figure><svg viewBox="0 0 ' + (h.length * (w + 4)) + ' ' + (H0 + 20) + '" role="img" aria-label="' + esc(t(l, 'p_hist')) + '" style="max-width:520px;direction:ltr">' + bars + '</svg><figcaption class="k-xs">' + esc(t(l, 'p_hist')) + '</figcaption></figure>' +
    '<details><summary>' + esc(t(l, 'table')) + '</summary>' + table([t(l, 'p_bin'), t(l, 'projects')], h.map(x => '<tr><td class="n">' + bdi(l, x[0] + ' … ' + (x[0] + 10)) + '</td><td class="n">' + x[1] + '</td></tr>')) + '</details>';
}
async function pacePage(env, shell, l, u) {
  const d = await file(env, '/data/n35a/pace.json'); if (!d) return null;
  const s = d.summary, k = ['behind', 'on', 'past', 'done', 'na'].includes(u.searchParams.get('k')) ? u.searchParams.get('k') : '', dv = (u.searchParams.get('d') || '').replace(/[^a-z0-9-]/g, '').slice(0, 90);
  const pg = Math.max(1, Math.min(20, parseInt(u.searchParams.get('page') || '1', 10) || 1)), PER = 60;
  let rows = d.rows.filter(r => (!k || r.k === k) && (!dv || r.dvs === dv));
  const tot = rows.length; rows = rows.slice((pg - 1) * PER, pg * PER);
  const base = pre(l) + '/construction-pace/';
  const b = '<p class="n35-note"><b>' + esc(t(l, 'p_note')) + '</b></p>' +
    kpis([[bdi(l, nf(s.compared, l)), t(l, 'p_k1')], [bdi(l, nf(s.behind_pct, l, 1) + '%'), fill(t(l, 'p_k2'), { a: nf(s.behind_ci[0], l, 1), b: nf(s.behind_ci[1], l, 1) })], [bdi(l, nf(s.median_gap_pts, l, 1)), fill(t(l, 'p_k3'), { a: nf(s.median_gap_ci[0], l, 1), b: nf(s.median_gap_ci[1], l, 1) })], [bdi(l, nf(s.with_projection, l)), t(l, 'p_k4')], [bdi(l, nf(s.proj_after_comp_pct, l, 1) + '%'), fill(t(l, 'p_k5'), { a: nf(s.proj_after_comp_ci[0], l, 1), b: nf(s.proj_after_comp_ci[1], l, 1) })]]) +
    histSvg(l, s.hist) +
    sec(t(l, 'p_list'), filt(l, base, 'k', k, ['behind', 'on', 'past', 'done', 'na'].map(x => [x, KL(l, x) + ' (' + nf(s.counts[x] || 0, l) + ')'])) + (dv ? '<p>' + esc(t(l, 'p_dev')) + ': <b>' + esc(dv) + '</b> · <a href="' + base + '" rel="nofollow">' + esc(t(l, 'all')) + '</a></p>' : '') +
      table(t(l, 'p_th'), rows.map(r => '<tr><th scope="row"><a href="' + pU(l, r.s) + '">' + esc(r.n) + '</a><br><span class="k-xs"><a href="' + base + '?d=' + r.dvs + '" rel="nofollow">' + esc(r.dv) + '</a>' + (r.ar ? ' · ' + esc(r.ar) : '') + '</span></th><td class="n">' + (r.pct != null ? bdi(l, nf(r.pct, l, 1) + '%') : '-') + '<br><span class="k-xs">' + esc(fd(r.pd, l)) + '</span></td><td class="n">' + (r.el != null ? bdi(l, nf(Math.min(r.el, 100), l, 0) + '%') : '-') + '</td><td' + gapC(r.gap) + '>' + (r.gap != null ? bdi(l, nf(r.gap, l, 1)) : '-') + '</td><td>' + esc(KL(l, r.k)) + '</td><td class="n">' + esc(fd(r.comp, l)) + '</td><td>' + projTxt(l, r) + '</td><td>' + ext(r.src) + '</td></tr>'), fill(t(l, 'p_cap'), { n: nf(tot, l), p: pg })) +
      (tot > pg * PER ? '<p><a rel="nofollow" href="' + base + '?' + (k ? 'k=' + k + '&' : '') + (dv ? 'd=' + dv + '&' : '') + 'page=' + (pg + 1) + '">' + esc(t(l, 'next')) + '</a></p>' : '')) +
    sec(t(l, 'method'), ['elapsed', 'gap', 'projection'].map(x => '<p>' + esc(t(l, 'pm_' + x)) + '</p>').join('') + '<p><b>' + esc(t(l, 'limits')) + '</b> ' + esc(t(l, 'pm_limits')) + '</p>' + '<p class="k-xs">' + esc(fill(t(l, 'p_src'), { n: nf(s.dld_records, l), m: nf(s.multi_readings, l) })) + '</p>') +
    files(l, ['/data/n35a/pace.json', '/open/n35a-build.py', '/registers/changes/']);
  return page(shell, l, Object.assign(H(l, 'pace'), { path: '/construction-pace/', body: b, updated: d.built, crumb: [[t(l, 'dubai'), pre(l) + '/m/dubai/']], noindex: !!(k || dv || pg > 1) }));
}
function paceLine(l, r) {
  if (!r || r.k === 'na') return '';
  return '<div class="n35-pace" id="pace"><h3>' + esc(t(l, 'pb_h')) + '</h3><p>' + esc(fill(t(l, 'pb_1'), { p: nf(r.pct, l, 1), d: fd(r.pd, l), e: nf(Math.min(r.el, 100), l, 0), s: fd(r.start || r.reg, l), c: fd(r.comp, l) })) + (r.gap != null ? ' ' + esc(fill(t(l, 'pb_g'), { g: nf(r.gap, l, 1) })) : '') + '</p>' +
    (r.proj ? '<p><b>' + esc(fill(t(l, 'pb_2'), { a: fd(r.proj[0], l, 1), b: fd(r.proj[1], l, 1) })) + '</b> ' + esc(t(l, 'pb_not')) + '</p>' : '') +
    '<p class="k-xs"><a href="' + pre(l) + '/construction-pace/">' + esc(t(l, 'pb_m')) + '</a> · ' + ext(r.src) + '</p></div>';
}

// ------------------------------------------------------------------------------------------------ 2. asking vs registered
function boxSvg(l, a) {
  const lo = Math.min(a.ask_q[0], a.reg_q[0], ...(a.rows || []).map(x => x.ppm)) * .95, hi = Math.max(a.ask_q[1], a.reg_q[1], ...(a.rows || []).map(x => x.ppm)) * 1.05, W = 520, X = v => Math.round(10 + (W - 20) * (v - lo) / (hi - lo));
  const bar = (y, q, m, c, lab) => '<rect x="' + X(q[0]) + '" y="' + y + '" width="' + Math.max(2, X(q[1]) - X(q[0])) + '" height="18" rx="4" fill="' + c + '" opacity=".35"></rect><line x1="' + X(m) + '" x2="' + X(m) + '" y1="' + (y - 3) + '" y2="' + (y + 21) + '" stroke="' + c + '" stroke-width="3"></line><text x="10" y="' + (y - 6) + '" font-size="11" fill="currentColor">' + esc(lab) + '</text>';
  const dots = (a.rows || []).map(x => '<circle cx="' + X(x.ppm) + '" cy="40" r="3" fill="#B54708" opacity=".7"></circle>').join('');
  return '<svg viewBox="0 0 ' + W + ' 100" role="img" aria-label="' + esc(t(l, 'a_svg')) + '" style="max-width:560px;direction:ltr">' + bar(30, a.ask_q, a.ask_med, '#B54708', t(l, 'a_ask')) + dots + bar(75, a.reg_q, a.reg_med, '#155EEF', t(l, 'a_reg')) + '</svg>';
}
async function askPage(env, shell, l, slug) {
  const d = await file(env, '/data/n35a/asking.json'); if (!d) return null;
  const R = d.registered, base = pre(l) + '/prices/asking-vs-registered/';
  const gap = a => '<td class="n' + (a.gap_ci && a.gap_ci[0] > 0 ? ' bad' : '') + '">' + bdi(l, (a.gap_pct > 0 ? '+' : '') + nf(a.gap_pct, l, 1) + '%') + (a.gap_ci ? '<br><span class="k-xs">' + bdi(l, nf(a.gap_ci[0], l, 1) + '…' + nf(a.gap_ci[1], l, 1) + '%') + '</span>' : '') + '</td>';
  const meth = sec(t(l, 'method'), ['asking', 'registered', 'matching', 'gap'].map(x => '<p>' + esc(t(l, 'am_' + x)) + '</p>').join('') + '<p><b>' + esc(t(l, 'limits')) + '</b> ' + esc(t(l, 'am_limits')) + '</p><p class="k-xs">' + esc(fill(t(l, 'a_regsrc'), { s: R.source, p: R.period_text, n: nf(R.n, l) })) + ' ' + ext(R.url) + '</p>') + files(l, ['/data/n35a/asking.json', '/data/price-reality.json', '/open/n35a-build.py']);
  if (slug) {
    const a = d.areas.find(x => x.slug === slug && x.page); if (!a) return null;
    const b = '<p class="n35-note">' + esc(t(l, 'a_note')) + '</p>' + kpis([[bdi(l, 'AED ' + nf(a.ask_med, l)), fill(t(l, 'a_k1'), { n: nf(a.n_ask, l) })], [bdi(l, 'AED ' + nf(a.reg_med, l)), fill(t(l, 'a_k2'), { n: nf(a.reg_n, l) })], [bdi(l, (a.gap_pct > 0 ? '+' : '') + nf(a.gap_pct, l, 1) + '%'), t(l, 'a_k3') + (a.gap_ci ? ' (' + t(l, 'ci') + ' ' + nf(a.gap_ci[0], l, 1) + '…' + nf(a.gap_ci[1], l, 1) + '%)' : '')]]) +
      boxSvg(l, a) + '<p class="k-xs">' + esc(fill(t(l, 'a_box'), { a: nf(a.ask_q[0], l), b: nf(a.ask_q[1], l), c: nf(a.reg_q[0], l), d: nf(a.reg_q[1], l) })) + '</p>' +
      sec(t(l, 'a_pr'), table(t(l, 'a_pth'), a.rows.map(x => '<tr><th scope="row"><a href="' + pU(l, x.s) + '">' + esc(x.n) + '</a><br><span class="k-xs">' + esc(x.dv) + '</span></th><td class="n">' + bdi(l, nf(x.ppm, l)) + '</td><td class="n">' + bdi(l, nf(x.pmin, l)) + '</td><td class="n">' + bdi(l, nf(x.smin, l)) + '</td></tr>'))) + meth;
    return page(shell, l, { h1: fill(t(l, 'a_area_t'), { a: a.area }), lead: fill(t(l, 'a_area_l'), { a: a.area, n: a.n_ask, r: nf(a.reg_n, l) }), k: 'ask', path: '/prices/asking-vs-registered/' + slug + '/', body: b, updated: d.built, crumb: [[t(l, 'ask_t'), base]] });
  }
  const b = '<p class="n35-note">' + esc(t(l, 'a_note')) + '</p>' + kpis([[bdi(l, nf(d.summary.projects, l)), t(l, 'a_s1')], [bdi(l, nf(d.summary.areas, l)), t(l, 'a_s2')], [bdi(l, nf(d.summary.area_pages, l)), t(l, 'a_s3')], [bdi(l, nf(R.n, l)), t(l, 'a_s4')]]) +
    sec(t(l, 'a_areas'), table(t(l, 'a_th'), d.areas.map(a => '<tr><th scope="row">' + (a.page ? '<a href="' + base + a.slug + '/">' + esc(a.area) + '</a>' : esc(a.area)) + '</th><td class="n">' + nf(a.n_ask, l) + '</td><td class="n">' + bdi(l, nf(a.ask_med, l)) + (a.ask_ci ? '<br><span class="k-xs">' + bdi(l, nf(a.ask_ci[0], l) + '…' + nf(a.ask_ci[1], l)) + '</span>' : '') + '</td><td class="n">' + bdi(l, nf(a.reg_med, l)) + '<br><span class="k-xs">n=' + nf(a.reg_n, l) + '</span></td>' + gap(a) + '</tr>'), t(l, 'a_cap'))) + meth;
  return page(shell, l, Object.assign(H(l, 'ask'), { path: '/prices/asking-vs-registered/', body: b, updated: d.built, crumb: [[t(l, 'dubai'), pre(l) + '/m/dubai/']] }));
}

// ------------------------------------------------------------------------------------------------ 3. escrow banks
async function escPage(env, shell, l, u) {
  const d = await file(env, '/data/n35a/escrow.json'); if (!d) return null;
  const base = pre(l) + '/registers/escrow-banks/', bs = (u.searchParams.get('b') || '').replace(/[^a-z0-9-]/g, ''), one = bs && d.banks.find(x => x.slug === bs);
  let b = '<p class="n35-note">' + esc(t(l, 'e_note')) + '</p>' + kpis([[bdi(l, nf(d.summary.banks, l)), t(l, 'e_k1')], [bdi(l, nf(d.summary.projects, l)), fill(t(l, 'e_k2'), { n: nf(d.summary.dld_records, l) })]]) +
    sec(t(l, 'e_banks'), table(t(l, 'e_th'), d.banks.map(x => '<tr><th scope="row"><a href="' + base + '?b=' + x.slug + '#bank" rel="nofollow">' + esc(x.bank) + '</a></th><td class="n">' + nf(x.n, l) + '</td><td class="n">' + nf(x.developers, l) + '</td><td class="n">' + nf(x.units, l) + '</td><td class="n">' + bdi(l, nf(x.pct_med, l, 1) + '%') + '</td><td class="n">' + nf(x.finished, l) + '</td><td class="n">' + nf(x.past_comp, l) + '</td><td class="n">' + bdi(l, nf(x.behind, l) + ' / ' + nf(x.compared, l)) + '</td><td class="n">' + nf(x.moved, l) + '</td></tr>'), t(l, 'e_cap')));
  if (one) b += sec(one.bank, table(t(l, 'e_pth'), one.rows.map(r => '<tr><th scope="row"><a href="' + pU(l, r.s) + '">' + esc(r.n) + '</a><br><span class="k-xs"><a href="' + dU(l, r.dvs) + '">' + esc(r.dv) + '</a></span></th><td class="n">' + (r.pct != null ? bdi(l, nf(r.pct, l, 1) + '%') : '-') + '<br><span class="k-xs">' + esc(fd(r.pd, l)) + '</span></td><td class="n">' + esc(fd(r.comp, l)) + '</td><td class="n">' + nf(r.units, l) + '</td><td>' + esc(r.k ? KL(l, r.k) : '-') + '</td><td>' + ext(r.src) + '</td></tr>')), 'bank');
  else b += '<p>' + esc(t(l, 'e_pick')) + '</p>';
  b += sec(t(l, 'method'), ['bank', 'past', 'moved', 'behind'].map(x => '<p>' + esc(t(l, 'em_' + x)) + '</p>').join('') + '<p><b>' + esc(t(l, 'limits')) + '</b> ' + esc(t(l, 'em_limits')) + '</p>') + files(l, ['/data/n35a/escrow.json', '/open/n35a-build.py']);
  return page(shell, l, Object.assign(H(l, 'esc'), { path: '/registers/escrow-banks/', body: b, updated: d.built, crumb: [[t(l, 'regs'), pre(l) + '/registers/']], noindex: !!bs }));
}

// ------------------------------------------------------------------------------------------------ 4. developer signals
const SK = l => t(l, 'sk') || {};
function evRow(l, e, withDev, names) {
  const k = SK(l)[e.k] || e.k;
  let det = '';
  if (e.k === 'register') det = '<code>' + esc(e.f) + '</code> ' + bdi(l, esc(String(e.a == null ? '-' : e.a)) + ' → <b>' + esc(String(e.b == null ? '-' : e.b)) + '</b>') + '<br><span class="k-xs">' + esc(e.t) + '</span>';
  else if (e.k === 'court') det = esc(e.t) + (e.w ? '<br><span class="k-xs">' + esc(e.w) + '</span>' : '') + (e.r ? '<br><span class="k-xs">' + esc(e.r) + '</span>' : '');
  else if (e.k === 'source_gone') det = esc(fill(t(l, 's_gone'), { s: e.t }));
  else if (e.k === 'page_change') det = esc(e.t) + ': ' + bdi(l, esc(e.a == null ? '-' : String(e.a)) + ' → <b>' + esc(e.b == null ? '-' : String(e.b)) + '</b>');
  else det = esc(e.t || '');
  return '<tr><td class="n">' + esc(fd(e.d, l)) + '</td><td>' + esc(k) + '</td>' + (withDev ? '<td><a href="' + dU(l, e.dv) + 'signals/">' + esc((names && names[e.dv] && names[e.dv][0]) || e.dv) + '</a></td>' : '') + '<td>' + (e.s ? '<a href="' + pU(l, e.s) + '">' + esc(e.s) + '</a>' : '-') + '</td><td dir="auto">' + det + '</td><td>' + ext(e.u) + '</td></tr>';
}
async function sigPage(env, shell, l, u, dv) {
  const ix = await file(env, '/data/n35a/signals-index.json'); if (!ix) return null;
  const k = ix.kinds.includes(u.searchParams.get('k')) ? u.searchParams.get('k') : '';
  const meth = sec(t(l, 'method'), paras(l, 's_m') + '<ul>' + Object.entries(ix.sources).map(([a, b]) => '<li>' + esc(a.split('|').map(x => SK(l)[x] || x).join(', ')) + ': <code>' + esc(b) + '</code></li>').join('') + '</ul>') + files(l, ['/data/n35a/signals-index.json', '/data/n35a/signals.json', '/open/n35a-build.py']);
  if (dv) {
    const sh = await file(env, '/data/n35a/signals.json'), x = sh && sh.p && sh.p[dv];
    if (!x) return null;
    const c = {}; x.e.forEach(e => { c[e.k] = (c[e.k] || 0) + 1; });
    const es = x.e.filter(e => !k || e.k === k);
    const base = dU(l, dv) + 'signals/';
    const b = '<p class="n35-note">' + esc(t(l, 's_note')) + '</p>' + filt(l, base, 'k', k, ix.kinds.filter(q => c[q]).map(q => [q, (SK(l)[q] || q) + ' (' + nf(c[q], l) + ')'])) +
      table(t(l, 's_th'), es.slice(0, 400).map(e => evRow(l, e, false)), fill(t(l, 's_cap'), { n: nf(es.length, l) })) + '<p><a href="' + dU(l, dv) + '">' + esc(fill(t(l, 's_back'), { d: x.n })) + '</a> · <a href="' + pre(l) + '/track-record/">' + esc(t(l, 'tr')) + '</a></p>' + meth;
    return page(shell, l, { h1: fill(t(l, 'dsig_t'), { d: x.n }), lead: fill(t(l, 'dsig_l'), { d: x.n, n: nf(x.e.length, l) }), k: 'sig', path: '/developers/' + dv + '/signals/', body: b, updated: ix.built, crumb: [[t(l, 'devs'), pre(l) + '/developers/'], [x.n, dU(l, dv)]], noindex: !!k || x.e.length < 3 });
  }
  const base = pre(l) + '/signals/', ev = ix.latest.filter(e => !k || e.k === k);
  const top = Object.entries(ix.developers).sort((a, b) => b[1][1] - a[1][1] || a[0].localeCompare(b[0])).slice(0, 40);
  const b = '<p class="n35-note">' + esc(t(l, 's_note')) + '</p>' + kpis(ix.kinds.filter(q => ix.counts[q]).map(q => [bdi(l, nf(ix.counts[q], l)), SK(l)[q] || q])) +
    sec(t(l, 's_latest'), filt(l, base, 'k', k, ix.kinds.filter(q => ix.counts[q] && q !== 'added' && q !== 'verified').map(q => [q, SK(l)[q] || q])) + table(t(l, 's_thd'), ev.slice(0, 150).map(e => evRow(l, e, true, ix.developers)))) +
    sec(t(l, 's_top'), '<ul class="n35-rel">' + top.map(([s, v]) => '<li><a href="' + dU(l, s) + 'signals/">' + esc(v[0]) + ' (' + nf(v[1], l) + ')</a></li>').join('') + '</ul><p class="k-xs">' + esc(fill(t(l, 's_all'), { n: nf(Object.keys(ix.developers).length, l) })) + '</p>') + meth;
  return page(shell, l, Object.assign(H(l, 'sig'), { path: '/signals/', body: b, updated: ix.built, noindex: !!k }));
}

// ------------------------------------------------------------------------------------------------ 5. contradictions
async function conPage(env, shell, l, u) {
  const d = await file(env, '/data/n35a/contradictions.json'); if (!d) return null;
  const f = ['handover', 'units', 'price'].includes(u.searchParams.get('f')) ? u.searchParams.get('f') : '', ps = (u.searchParams.get('p') || '').replace(/[^a-z0-9-]/g, '');
  const xs = d.items.filter(x => (!f || x.f === f) && (!ps || x.s === ps)), base = pre(l) + '/data/contradictions/';
  const side = x => '<b>' + esc(x.src) + '</b>' + (x.d ? ' <span class="k-xs">(' + esc(fill(t(l, 'c_rd'), { d: fd(x.d, l) })) + ')</span>' : '') + '<br><span dir="auto">' + esc(x.t) + '</span>' + (x.u ? '<br>' + ext(x.u) : '');
  const df = x => x.f === 'handover' ? fill(t(l, 'c_mo'), { n: nf(x.g, l) }) : fill(t(l, 'c_pc'), { n: nf(x.g, l) });
  const b = '<p class="n35-note">' + esc(t(l, 'c_note')) + '</p>' + kpis([[bdi(l, nf(d.items.length, l)), t(l, 'c_k1')], [bdi(l, nf(d.projects, l)), fill(t(l, 'c_k2'), { n: nf(d.projects_read, l) })]]) +
    filt(l, base, 'f', f, ['handover', 'units', 'price'].map(q => [q, t(l, 'cf_' + q) + ' (' + nf(d.counts[q] || 0, l) + ')'])) +
    table(t(l, 'c_th'), xs.map(x => '<tr><th scope="row"><a href="' + pU(l, x.s) + '">' + esc(x.n) + '</a><br><span class="k-xs"><a href="' + dU(l, x.dvs) + '">' + esc(x.dv) + '</a> · ' + esc(x.mk) + '</span></th><td>' + esc(t(l, 'cf_' + x.f)) + '</td><td>' + side(x.a) + '</td><td>' + side(x.b) + '</td><td class="n">' + esc(df(x)) + '</td></tr>')) +
    sec(t(l, 'method'), ['sources', 'handover', 'units', 'price', 'not_checked'].map(x => '<p>' + esc(t(l, 'cm_' + x)) + '</p>').join('') + '<p><b>' + esc(t(l, 'limits')) + '</b> ' + esc(t(l, 'cm_limits')) + '</p><p><a href="' + pre(l) + '/anomalies/">' + esc(t(l, 'c_anom')) + '</a></p>') + files(l, ['/data/n35a/contradictions.json', '/open/n35a-build.py']);
  return page(shell, l, Object.assign(H(l, 'con'), { path: '/data/contradictions/', body: b, updated: d.built, crumb: [DS(l)], noindex: !!(f || ps) }));
}

// ------------------------------------------------------------------------------------------------ 6. aliases
async function aliPage(env, shell, l, nonce) {
  const d = await file(env, '/data/n35a/aliases.json'); if (!d) return null;
  const nm = d.rows.filter(r => r[1] !== 'market'), mk = d.rows.filter(r => r[1] === 'market');
  const row = r => '<tr><th scope="row">' + (r[1] === 'developer' ? '<a href="' + dU(l, r[2]) + '">' + esc(r[0]) + '</a>' : r[1] === 'project' ? '<a href="' + pU(l, r[2]) + '">' + esc(r[0]) + '</a>' : '<a href="' + pre(l) + '/m/' + esc(r[2]) + '/">' + esc(r[0]) + '</a>') + '</th><td dir="auto" lang="' + ({ Arabic: 'ar', Chinese: 'zh', Cyrillic: 'ru', Thai: 'th' }[r[4]] || 'und') + '">' + esc(r[3]) + '</td><td>' + esc(r[4]) + '</td><td>' + esc((t(l, 'al_b') || {})[r[5]] || r[5]) + '</td></tr>';
  const b = '<p class="n35-note">' + esc(t(l, 'al_note')) + '</p>' + kpis(Object.entries(d.counts).map(([a, n]) => [bdi(l, nf(n, l)), a])) +
    sec(t(l, 'al_try'), '<div id="n35-al" data-l="' + l + '" data-ph="' + esc(t(l, 'al_ph')) + '" data-none="' + esc(t(l, 'al_none')) + '" data-key="' + esc(t(l, 'al_key')) + '" data-amb="' + esc(t(l, 'al_amb')) + '"><form role="search"><label for="n35-alq" class="k-xs">' + esc(t(l, 'al_lab')) + '</label><input id="n35-alq" type="search" autocomplete="off" placeholder="' + esc(t(l, 'al_ph')) + '"></form><div id="n35-alo" role="status" aria-live="polite"></div></div><script' + nonceOf(nonce) + ' src="/k/n35a/alias.js?v=' + V + '" defer></script>') +
    sec(t(l, 'al_rule'), '<ol>' + [].concat(t(l, 'al_rules') || []).map(x => '<li>' + esc(x) + '</li>').join('') + '</ol>' + (d.key_collisions.length ? '<p class="k-xs">' + esc(fill(t(l, 'al_coll'), { n: d.key_collisions.length })) + ' ' + d.key_collisions.slice(0, 12).map(c => '<code>' + esc(c[0]) + '</code>: ' + c[1].map(s => '<a href="' + dU(l, s) + '">' + esc(s) + '</a>').join(', ')).join(' · ') + '</p>' : '')) +
    sec(t(l, 'al_names'), table(t(l, 'al_th'), nm.map(row))) + '<details><summary>' + esc(fill(t(l, 'al_mk'), { n: nf(mk.length, l) })) + '</summary>' + table(t(l, 'al_th'), mk.map(row)) + '</details>' +
    files(l, ['/data/n35a/aliases.json', '/data/search-aliases.json', '/open/n35a-build.py']);
  return page(shell, l, Object.assign(H(l, 'ali'), { path: '/data/aliases/', body: b, updated: d.built, crumb: [DS(l)] }));
}

// ------------------------------------------------------------------------------------------------ 7. dictionary
async function dicPage(env, shell, l) {
  const d = await file(env, '/data/n35a/dictionary.json'); if (!d) return null;
  const DF = t(l, 'df') || {}, ST = t(l, 'st') || {};
  const cell = v => '<td class="n"' + (v < 20 ? ' style="color:var(--muted,#59626B)"' : '') + '>' + v + '%</td>';
  const b = '<p>' + esc(fill(t(l, 'd_intro'), { n: nf(d.rows, l), v: d.dataset })) + '</p>' +
    table([t(l, 'd_f'), t(l, 'd_ty'), t(l, 'd_def'), t(l, 'd_cov'), t(l, 'd_src')].concat(d.markets.map(m => m)), d.fields.map(f => '<tr id="f-' + f.f + '"><th scope="row"><code>' + esc(f.f) + '</code></th><td><code>' + esc(f.type) + '</code></td><td>' + esc(DF[f.f] || f.def) + '</td><td class="n">' + bdi(l, nf(f.cov, l, 1) + '%') + '<br><span class="k-xs">n=' + nf(f.n, l) + '</span></td><td>' + esc(f.src.split(', ').map(x => ST[x] || x).join(', ')) + '</td>' + d.markets.map(m => cell(f.per[m])).join('') + '</tr>'), fill(t(l, 'd_cap'), { m: d.markets.map(m => m + ' ' + d.market_rows[m]).join(', ') })) +
    sec(t(l, 'd_types'), '<ul>' + Object.keys(d.source_types).map(k => '<li><b>' + esc(ST[k] || k) + '</b>: ' + esc((t(l, 'st_d') || {})[k] || d.source_types[k]) + '</li>').join('') + '</ul>') +
    sec(t(l, 'd_code'), '<p>' + esc(t(l, 'd_codep')) + '</p>') + files(l, ['/data/n35a/dictionary.json', '/data/sql/datacard.json', '/open/n32x-build.py', '/open/n35a-build.py']);
  return page(shell, l, Object.assign(H(l, 'dic'), { path: '/data/dictionary/', body: b, updated: d.built, crumb: [DS(l)], type: 'TechArticle' }));
}

// ------------------------------------------------------------------------------------------------ 8. diff, 9. ask (browser apps)
const strings = (l, ks) => { const o = { _loc: LOC[l] || 'en-GB', _l: l }; ks.forEach(k => { o[k] = t(l, k); }); return JSON.stringify(o).replace(/</g, '\\u003c'); };
async function difPage(env, shell, l, nonce) {
  const ix = await file(env, '/data/delta/index.json'); if (!ix) return null;
  const days = [ix.entries[0].from].concat(ix.entries.map(e => e.to));
  const b = '<p>' + esc(t(l, 'f_intro')) + '</p><div id="n35-df"><form><label>' + esc(t(l, 'f_from')) + ' <select id="n35-dfa">' + days.map((d, i) => '<option value="' + d + '"' + (i === days.length - 2 ? ' selected' : '') + '>' + esc(fd(d, l)) + '</option>').join('') + '</select></label> <label>' + esc(t(l, 'f_to')) + ' <select id="n35-dfb">' + days.map((d, i) => '<option value="' + d + '"' + (i === days.length - 1 ? ' selected' : '') + '>' + esc(fd(d, l)) + '</option>').join('') + '</select></label> <button type="button" class="btn" id="n35-dfg">' + esc(t(l, 'f_go')) + '</button></form><p id="n35-dfs" role="status" aria-live="polite" class="k-xs"></p><div id="n35-dfo"></div></div>' +
    '<script type="application/json" id="n35-dft">' + strings(l, ['f_load', 'f_res', 'f_add', 'f_rem', 'f_chg', 'f_fields', 'f_rec', 'f_th', 'f_fth', 'f_none', 'f_err', 'f_same', 'f_more', 'f_hist', 'f_seal']) + '</script><script' + nonceOf(nonce) + ' src="/k/n35a/diff.js?v=' + V + '" defer></script>' +
    sec(t(l, 'method'), paras(l, 'f_m')) + files(l, ['/data/delta/index.json', '/data/snapshots/', '/api/v1/delta/' + days[days.length - 1]]);
  return page(shell, l, Object.assign(H(l, 'dif'), { path: '/data/diff/', body: b, updated: days[days.length - 1], crumb: [DS(l)] }));
}
async function qaPage(env, shell, l, nonce) {
  const b = '<p>' + esc(t(l, 'q_intro')) + '</p><div id="n35-qa"><form role="search"><label for="n35-qaq" class="k-xs">' + esc(t(l, 'q_lab')) + '</label><input id="n35-qaq" type="search" style="flex:1 1 320px" autocomplete="off" placeholder="' + esc((t(l, 'q_ex') || [''])[0]) + '"> <button type="button" class="btn" id="n35-qag">' + esc(t(l, 'q_go')) + '</button></form>' +
    '<p class="k-xs">' + esc(t(l, 'q_try')) + '</p><ul class="n35-rel" id="n35-qax">' + [].concat(t(l, 'q_ex') || []).map(x => '<li><button type="button" class="kbtn" data-q="' + esc(x) + '">' + esc(x) + '</button></li>').join('') + '</ul>' +
    '<p id="n35-qas" role="status" aria-live="polite" class="k-xs"></p><div id="n35-qao"></div></div><script type="application/json" id="n35-qat">' + strings(l, ['q_sql', 'q_none', 'q_load', 'q_rows', 'q_err', 'q_hash', 'q_parsed', 'q_open', 'q_run']) + '</script><script' + nonceOf(nonce) + ' src="/k/n35a/ask.js?v=' + V + '" defer></script>' +
    sec(t(l, 'method'), paras(l, 'q_m')) + '<p><a href="' + pre(l) + '/data/sql/">' + esc(t(l, 'q_sqlp')) + '</a> · <a href="' + pre(l) + '/data/dictionary/">' + esc(t(l, 'dic_t')) + '</a></p>' + files(l, ['/k/n35a/ask.js', '/open/n35a-ask-tests.json', '/data/sql/datacard.json']);
  return page(shell, l, Object.assign(H(l, 'qa'), { path: '/data/ask/', body: b, crumb: [DS(l)] }));
}

// ------------------------------------------------------------------------------------------------ 10. satellite changes
async function satPage(env, shell, l, u) {
  const d = await file(env, '/data/n35a/satchange.json'); if (!d) return null;
  const ms = d.months.map(m => m[0]), m = ms.includes(u.searchParams.get('m')) ? u.searchParams.get('m') : ms[0];
  const xs = d.items.filter(x => x.m_last === m), big = xs.filter(x => Math.abs(x.ch) >= 5);
  const b = '<p class="n35-note">' + esc(t(l, 'v_note')) + '</p>' + filt(l, pre(l) + '/satellite/changes/', 'm', m === ms[0] ? '' : m, ms.slice(1, 12).map(x => [x, fd(x + '-15', l, 1) + ' (' + d.months.find(y => y[0] === x)[1] + ')'])).replace('>' + esc(t(l, 'all')) + '<', '>' + esc(fd(ms[0] + '-15', l, 1)) + '<') +
    kpis([[bdi(l, nf(xs.length, l)), fill(t(l, 'v_k1'), { m: fd(m + '-15', l, 1) })], [bdi(l, nf(big.length, l)), t(l, 'v_k2')], [bdi(l, nf(big.filter(x => x.ch > 0).length, l)), t(l, 'v_k3')]]) +
    table(t(l, 'v_th'), xs.slice(0, 120).map(x => '<tr><th scope="row"><a href="' + pU(l, x.s) + '">' + esc(x.n) + '</a><br><span class="k-xs">' + esc(x.mk) + '</span></th><td class="n">' + esc(fd(x.m_prev + '-15', l, 1)) + ': ' + bdi(l, nf(x.v_prev, l)) + '</td><td class="n">' + esc(fd(x.m_last + '-15', l, 1)) + ': ' + bdi(l, nf(x.v_last, l)) + '</td><td class="n' + (Math.abs(x.ch) >= 5 ? '' : ' k-xs') + '"><b>' + bdi(l, (x.ch > 0 ? '+' : '') + nf(x.ch, l)) + '</b></td><td class="n">' + bdi(l, nf(x.raw_prev, l) + ' → ' + nf(x.raw_last, l)) + '</td><td>' + (x.up ? esc(fd(x.up + '-15', l, 1)) : '-') + '</td></tr>'), fill(t(l, 'v_cap'), { n: nf(xs.length, l) })) +
    sec(t(l, 'method'), '<p>' + esc(t(l, 'v_m')) + '</p><p><b>' + esc(t(l, 'limits')) + '</b> ' + esc(t(l, 'v_lim')) + '</p><p class="k-xs">' + esc(d.source.attribution || '') + ' · ' + ext(d.source.url) + '</p><p><a href="' + pre(l) + '/satellite/construction-index/">' + esc(t(l, 'v_ci')) + '</a></p>') + files(l, ['/data/n35a/satchange.json', '/data/construction-index.json', '/open/n35a-build.py']);
  return page(shell, l, Object.assign(H(l, 'sat'), { path: '/satellite/changes/', body: b, updated: d.built, crumb: [[t(l, 'sats'), pre(l) + '/satellite/construction-index/']], noindex: m !== ms[0] }));
}

// ------------------------------------------------------------------------------------------------ blocks on existing pages
const links = (l, ks, h) => '<section class="wrap n35" id="n35a-links"' + (l === 'ar' ? ' dir="rtl"' : '') + '>' + (h ? '<h2>' + esc(h) + '</h2>' : '') + '<ul class="n35-rel">' + ALL.filter(x => ks.includes(x[0])).map(x => '<li><a href="' + pre(l) + x[1] + '">' + esc(t(l, x[0] + '_t')) + '</a></li>').join('') + '</ul></section>';
const shipped = l => '<section class="wrap n35" id="shipped-2026-11-22-data"' + (l === 'ar' ? ' dir="rtl"' : '') + '>' + CSS + '<h2>' + esc(t(l, 'ship_h')) + '</h2><p>' + esc(t(l, 'ship_p')) + '</p><ul>' + ALL.map(x => '<li><a href="' + pre(l) + x[1] + '">' + esc(t(l, x[0] + '_t')) + '</a>: ' + esc(t(l, x[0] + '_s')) + '</li>').join('') + '</ul></section>';
async function projBlock(env, l, slug) {
  const [pc, cd] = await Promise.all([file(env, '/data/n35a/pace.json'), file(env, '/data/n35a/contradictions.json')]);
  let h = '';
  const r = pc && pc.rows.find(x => x.s === slug); if (r) h += paceLine(l, r);
  const c = cd && cd.items.filter(x => x.s === slug);
  if (c && c.length) h += '<p class="n35-con"><b>' + esc(t(l, 'cb_h')) + '</b> ' + c.map(x => esc(t(l, 'cf_' + x.f)) + ': ' + esc(x.a.src) + ' / ' + esc(x.b.src)).join('; ') + '. <a href="' + pre(l) + '/data/contradictions/?p=' + slug + '" rel="nofollow">' + esc(t(l, 'cb_m')) + '</a></p>';
  return h ? '<div class="n35-pb"' + (l === 'ar' ? ' dir="rtl"' : '') + '><style>.n35-pb{margin:18px 0 0;padding:14px 18px;border:1px solid var(--k-line,var(--line,#d5d3cc));border-radius:14px}.n35-pb h3{margin:0 0 6px;font-size:1.05rem}.n35-pb p{margin:6px 0;max-width:72ch;line-height:1.55}</style>' + h + '</div>' : '';
}
async function devBlock(env, l, dv) {
  const ix = await file(env, '/data/n35a/signals-index.json'), x = ix && ix.developers[dv]; if (!x) return '';
  return '<section class="wrap n35" id="signals"' + (l === 'ar' ? ' dir="rtl"' : '') + '><p><a class="btn ghost" href="' + dU(l, dv) + 'signals/">' + esc(fill(t(l, 'db'), { n: nf(x[1], l) })) + '</a> <span class="k-xs">' + esc(fill(t(l, 'db_l'), { d: fd(x[2], l) })) + '</span></p></section>';
}
export async function inject(req, u, env, r, nonce) {
  try {
    if (!/text\/html/.test(r.headers.get('content-type') || '')) return r;
    const m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(.*)$/.exec(u.pathname), l = m[1] || 'en', p = m[2];
    if (!(await loadT(env))) return r;
    let h = '', sel = 'main', where = 'append', mm;
    if (p === 'engineering/' || p === 'yc/') h = shipped(l);
    else if ((mm = /^projects\/([a-z0-9-]{1,90})\/$/.exec(p))) { h = await projBlock(env, l, mm[1]); sel = '#delivery > details'; }
    else if ((mm = /^developers\/([a-z0-9-]{1,90})\/$/.exec(p))) { h = await devBlock(env, l, mm[1]); sel = '#record'; where = 'before'; }
    else if (p === 'm/dubai/') h = links(l, ['pace', 'ask', 'esc'], t(l, 'mk_h'));
    else if (p === 'data/') h = links(l, ['dic', 'dif', 'qa', 'ali', 'con'], t(l, 'data_h'));
    else if (p === 'data/sql/') h = links(l, ['qa', 'dic']);
    else if (p === 'registers/') h = links(l, ['esc', 'pace']);
    else if (p === 'satellite/construction-index/') h = links(l, ['sat']);
    else if (p === 'numbers/') h = links(l, ['pace', 'ask', 'sig']);
    if (!h) return r;
    let done = false;
    const out = new HTMLRewriter().on(sel, { element(e) { if (done) return; done = true; if (where === 'before') e.before(h, { html: true }); else e.append(h, { html: true }); } });
    if (sel !== 'main') out.on('main', { element(e) { e.onEndTag(end => { if (!done) { done = true; end.before(h, { html: true }); } }); } });
    return out.transform(r);
  } catch (e) { return r; }
}
export async function handle(req, u, env, ctx, shell) {
  const p = u.pathname; let m;
  if (!PATHS.test(p) || (req.method !== 'GET' && req.method !== 'HEAD')) return null;
  if (!(await loadT(env))) return null;
  if (!p.endsWith('/')) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } });
  const L = x => x || 'en', nonce = '';
  if ((m = R.pace.exec(p))) return pacePage(env, shell, L(m[1]), u);
  if ((m = R.ask.exec(p))) return askPage(env, shell, L(m[1]), m[2] || null);
  if ((m = R.esc.exec(p))) return escPage(env, shell, L(m[1]), u);
  if ((m = R.sig.exec(p))) return sigPage(env, shell, L(m[1]), u, null);
  if ((m = R.dsig.exec(p))) return sigPage(env, shell, L(m[1]), u, m[2]);
  if ((m = R.con.exec(p))) return conPage(env, shell, L(m[1]), u);
  if ((m = R.ali.exec(p))) return aliPage(env, shell, L(m[1]), nonce);
  if ((m = R.dic.exec(p))) return dicPage(env, shell, L(m[1]));
  if ((m = R.dif.exec(p))) return difPage(env, shell, L(m[1]), nonce);
  if ((m = R.qa.exec(p))) return qaPage(env, shell, L(m[1]), nonce);
  if ((m = R.sat.exec(p))) return satPage(env, shell, L(m[1]), u);
  return null;
}
