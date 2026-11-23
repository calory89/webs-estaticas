// kolaboro.com batch 37 round 1 (agent r1u, 23 Nov 2026): the project record, field by field. Data: /data/n37u.json (built by
// /open/n37u-build.py from published files only, no network, no model); strings in 8 languages: /data/n37u-i18n.json.
//   GET /[l/]projects/<slug>/record/   10 key facts with source kind and date read, what we still do not know and where to check it,
//                                      market context per field, same developer and same area
//   GET /[l/]data/gaps/                coverage of the 10 key facts per market, registers that fill them, thinnest records
//   inject()                           entry links on project pages, /data/, /data/dictionary/, /registers/; "Shipped 23 Nov 2026" on /engineering/ and /yc/
//   r2u (round 2): age of each fact with a re-check flag, field names linked to the data dictionary, facts-held distribution on
//   /data/gaps/, GET /data/gaps.csv (coverage by market, CC BY 4.0), GET /projects/<slug>/record.json (one record, machine-readable)
// Sumba, Eco Beach City and Equinox are left out by the build.
import * as N from './kbx_named.js';

const ORIGIN = 'https://kolaboro.com';
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const MEMO = {};
async function file(env, p) {
  const m = MEMO[p]; if (m && m.v && Date.now() - m.t < 600000) return m.v;
  let v = null;
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com' + p)); if (r.ok) v = await r.json(); } catch (e) { v = null; }
  if (!v) { try { const r = await fetch(ORIGIN + p, { cf: { cacheTtl: 600 } }); if (r.ok) v = await r.json(); } catch (e) { v = null; } }
  MEMO[p] = { t: Date.now(), v }; return v;
}
let T = null, D = null, IX = null;
async function load(env) {
  if (!T) T = await file(env, '/data/n37u-i18n.json');
  const d = await file(env, '/data/n37u.json');
  if (d && d !== D) { D = d; MS = null; IX = { bySlug: new Map(d.p.map(r => [r[1], r])), byDev: new Map(), byAr: new Map(), byMk: new Map(), src: 0, regs: 0 }; for (const r of d.p) { (IX.byMk.get(r[3]) || IX.byMk.set(r[3], []).get(r[3])).push(r); for (const c of r[8]) if (c && c[1]) IX.src++; if (r[5]) (IX.byDev.get(r[5]) || IX.byDev.set(r[5], []).get(r[5])).push(r); const a = r[3] + '|' + r[4]; (IX.byAr.get(a) || IX.byAr.set(a, []).get(a)).push(r); } }
  if (D && !IX.regs) { const g = new Set(); for (const k in D.rg) for (const x of D.rg[k]) g.add(x[0] + '|' + x[1]); IX.regs = g.size; }
  return !!(T && D);
}
let MS = null;
const slugM = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const mBySlug = s => { if (!MS) { MS = new Map(); for (const k in D.mk) MS.set(slugM(k), k); } return MS.get(s); };
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const t = (l, k) => { const a = T && T[l] && T[l][k]; return a != null ? a : (T && T.en && T.en[k]) || ''; };
const tf = (l, k, v) => t(l, k).replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m);
const nf = (n, l) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { maximumFractionDigits: 1, numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); } };
const fd = (d, l) => { if (!d) return ''; if (!/^\d{4}-\d{2}-\d{2}/.test(d)) return d; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(d.slice(0, 10) + 'T12:00:00Z')); } catch (e) { return d.slice(0, 10); } };
const dir = l => l === 'ar' ? ' dir="rtl"' : '';
const bdi = s => '<bdi>' + esc(s) + '</bdi>';
const host = u => { try { return new URL(u, ORIGIN).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const recU = (l, s) => pre(l) + '/projects/' + s + '/record/';
const cnt = r => r[7].split('1').length - 1;
const LP = '(?:(es|de|fr|nl|ru|zh|ar)\\/)?';
const RX_REC = new RegExp('^\\/' + LP + 'projects\\/([a-z0-9-]{1,90})\\/record(\\/?)$'), RX_GAP = new RegExp('^\\/' + LP + 'data\\/gaps(\\/?)$'), RX_JS = /^\/projects\/([a-z0-9-]{1,90})\/record\.json$/;
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:projects\/[a-z0-9-]{1,90}\/record|data\/gaps)\/?$|^\/(?:es|de|fr|nl|ru|zh|ar)\/data\/?$|^\/projects\/[a-z0-9-]{1,90}\/record\.json$|^\/data\/gaps\.csv$/;
export const INJ = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:(?:projects\/[a-z0-9-]{1,90}|engineering|yc|data|data\/dictionary|registers|m\/[^/.]{2,60}|developers\/[a-z0-9-]{2,90})\/)?$/;

const CSS = '<style id="n37u-css">.n37{max-width:1100px}.n37 h2{margin:28px 0 8px;font-size:1.3rem}.n37 p,.n37 li{line-height:1.6}.n37 .k-xs{font-size:.9rem;color:var(--k-muted,#56636F)}' +
  '.n37-tw{overflow-x:auto;border:1px solid var(--k-line,#D5DCDB);border-radius:12px;margin:10px 0 22px;background:var(--k-surface,#fff)}.n37 table{width:100%;border-collapse:collapse;font-size:.93rem}.n37 th,.n37 td{padding:9px 12px;border-bottom:1px solid var(--k-line,#D5DCDB);text-align:start;vertical-align:top}.n37 thead th{font-size:.82rem}.n37 td.n{font-variant-numeric:tabular-nums;white-space:nowrap}.n37 tbody th{font-weight:600;min-width:140px}' +
  '.n37-b{display:inline-block;padding:2px 8px;border-radius:999px;font-size:.78rem;font-weight:700;border:1px solid currentColor;white-space:nowrap}.n37-b.reg{color:#1F6B3A}.n37-b.dev,.n37-b.web,.n37-b.portal{color:#6A4C00}.n37-b.sat{color:#155C75}.n37-b.rec{color:var(--k-muted,#56636F)}.n37-b.no{color:#9A3412}' +
  ':root[data-theme=dark] .n37-b.reg{color:#7FD49A}:root[data-theme=dark] .n37-b.dev,:root[data-theme=dark] .n37-b.web,:root[data-theme=dark] .n37-b.portal{color:#F2C46B}:root[data-theme=dark] .n37-b.sat{color:#7CC7E0}:root[data-theme=dark] .n37-b.no{color:#FFA07A}' +
  '@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .n37-b.reg{color:#7FD49A}:root:not([data-theme=light]) .n37-b.dev,:root:not([data-theme=light]) .n37-b.web,:root:not([data-theme=light]) .n37-b.portal{color:#F2C46B}:root:not([data-theme=light]) .n37-b.sat{color:#7CC7E0}:root:not([data-theme=light]) .n37-b.no{color:#FFA07A}}' +
  '.n37 tbody th a{color:inherit;text-decoration-style:dotted;text-underline-offset:3px}.n37-age{white-space:nowrap}.n37-b.old{color:#9A3412;margin-inline-start:6px}.n37-ds{display:block;width:100%;max-width:560px;height:auto;margin:8px 0 4px;color:#155C75}.n37-ds text{fill:var(--k-ink,#17212B);font-size:11px}' +
  ':root[data-theme=dark] .n37-ds{color:#7CC7E0}:root[data-theme=dark] .n37-b.old{color:#FFA07A}@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .n37-ds{color:#7CC7E0}:root:not([data-theme=light]) .n37-b.old{color:#FFA07A}}' +
  '.n37 a{overflow-wrap:break-word}.n37-g li{margin:0 0 12px}.n37-g ul{margin:4px 0 0;padding-inline-start:18px}.n37 .n37-v{overflow-wrap:break-word;max-width:46ch;min-width:10ch}.n37-rel{display:flex;flex-wrap:wrap;gap:8px 18px;list-style:none;padding:0}.n37-rel a{display:inline-flex;align-items:center;min-height:44px}</style>';

async function page(shell, l, o) {
  const canon = ORIGIN + pre(l) + o.path;
  const crumbs = [[t(l, 'home'), pre(l) + '/']].concat(o.crumb || []).concat([[o.h1, null]]);
  const body = '<section class="phero"' + dir(l) + '><div class="wrap"><p class="crumb">' + crumbs.map(c => c[1] ? '<a href="' + esc(c[1]) + '">' + esc(c[0]) + '</a>' : esc(c[0])).join(' / ') + '</p><h1>' + esc(o.h1) + '</h1><p class="lead">' + esc(o.lead) + '</p>' +
    '<p class="k-xs">' + esc(tf(l, 'upd', { d: fd(D.built, l) })) + '</p></div></section><div class="wrap n37"' + dir(l) + '>' + CSS + o.body +
    '<p class="k-xs">' + esc(t(l, 'meth')) + ' <a href="/data/n37u.json">' + esc(t(l, 'dl')) + '</a> · <a href="/open/n37u-build.py">' + esc(t(l, 'code')) + '</a> · <a href="' + pre(l) + '/registers/">/registers/</a></p></div>';
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebPage', url: canon, name: o.h1, description: o.lead, inLanguage: l, dateModified: D.built || '2026-11-23', isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] ? ORIGIN + c[1] : canon })) }] };
  const desc = o.lead.length > 155 ? o.lead.slice(0, 152).replace(/\s+\S*$/, '') + '…' : o.lead;
  let html = await N.assemble({ title: (o.h1.length > 56 ? o.h1.slice(0, 56).replace(/\s+\S*$/, '') : o.h1) + ' | Kolaboro', desc, canon, body, ld, alt: x => ORIGIN + pre(x) + o.path }, l, await shell(pre(l) + '/how-we-score/'));
  const h = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=900', 'content-language': l };
  if (o.noindex) { html = html.replace('</head>', '<meta name="robots" content="noindex, follow"></head>'); h['x-robots-tag'] = 'noindex, follow'; }
  return new Response(html, { status: 200, headers: h });
}
const DEF = { ho: '/data/dictionary/#f-handover_on_record', pn: '/data/dictionary/#f-permit_number', un: '/data/dictionary/#f-dld_units', pr: '/data/dictionary/#f-price_min', co: '/data/dictionary/#f-registered_company', es: '/data/dictionary/#f-escrow_bank', cp: '/data/dictionary/#f-dld_percent_built', sat: '/satellite/construction-index/', reg: '/registers/', ct: '/courts/' };
const fname = (l, f) => '<a href="' + (f === 'ct' ? '' : pre(l)) + DEF[f] + '" title="' + esc(t(l, 'def_t')) + '">' + esc(t(l, 'f_' + f)) + '</a>';
const ageOf = d => (/^\d{4}-\d{2}-\d{2}/.test(d || '') ? Math.max(0, Math.floor((Date.now() - Date.parse(d.slice(0, 10) + 'T00:00:00Z')) / 86400000)) : null);
const OLD = 180;
const median = a => { const b = a.slice().sort((x, y) => x - y), n = b.length; return n ? (n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2) : 0; };
const badge = (l, k) => '<span class="n37-b ' + k + '">' + esc(t(l, 'k_' + k)) + '</span>';
const regsFor = r => (D.rg[r[3]] || D.rg[(D.co[r[0]] === 'USA' ? 'United States' : D.co[r[0]])] || []);
const relTable = (l, rows) => '<div class="n37-tw" tabindex="0"><table><thead><tr><th scope="col">' + esc(t(l, 'th_p')) + '</th><th scope="col">' + esc(t(l, 'th_k')) + '</th></tr></thead><tbody>' +
  rows.map(r => '<tr><th scope="row"><a href="' + recU(l, r[1]) + '">' + bdi(r[2]) + '</a></th><td class="n">' + nf(cnt(r), l) + ' / 10</td></tr>').join('') + '</tbody></table></div>';

async function recPage(env, shell, l, r) {
  const F = D.f, P = pre(l), k = cnt(r), m = D.mk[r[3]];
  let b = '<p><a href="' + P + '/projects/' + r[1] + '/">' + esc(t(l, 'back')) + '</a> · <b>' + esc(tf(l, 'held', { k: nf(k, l) })) + '</b> · <a href="/projects/' + r[1] + '/record.json" type="application/json">' + esc(t(l, 'js_l')) + '</a></p>';
  b += '<h2 id="fields">' + esc(t(l, 'r_tbl')) + '</h2><div class="n37-tw" tabindex="0"><table><thead><tr><th scope="col">' + esc(t(l, 'th_f')) + '</th><th scope="col">' + esc(t(l, 'th_v')) + '</th><th scope="col">' + esc(t(l, 'th_s')) + '</th><th scope="col">' + esc(t(l, 'th_d')) + '</th><th scope="col">' + esc(t(l, 'th_age')) + '</th></tr></thead><tbody>' +
    F.map((f, i) => { const c = r[8][i]; if (!c) return '<tr><th scope="row">' + fname(l, f) + '</th><td>' + esc(t(l, 'none')) + '</td><td><span class="n37-b no">' + esc(t(l, 'none')) + '</span></td><td></td><td></td></tr>';
      const ag = f === 'ct' ? null : ageOf(c[3]);
      const v = f === 'ct' ? nf(c[0], l) : String(c[0]), u = c[1], src = u ? '<a href="' + esc(u) + '"' + (/^https?:/.test(u) ? ' rel="nofollow noopener"' : '') + '>' + esc(/^https?:/.test(u) ? host(u) : u) + '</a>' : '<a href="' + P + '/projects/' + r[1] + '/#sources">' + esc(t(l, 'rec_n')) + '</a>';
      return '<tr><th scope="row">' + fname(l, f) + '</th><td class="n37-v">' + bdi(v) + '</td><td>' + badge(l, c[2]) + ' ' + src + '</td><td class="n">' + esc(fd(c[3], l)) + '</td><td class="n n37-age">' + (ag == null ? '' : nf(ag, l) + (ag > OLD ? '<span class="n37-b old">' + esc(t(l, 'age_old')) + '</span>' : '')) + '</td></tr>'; }).join('') + '</tbody></table></div>';
  const aged = F.map((f, i) => [f, r[8][i]]).filter(x => x[1] && x[0] !== 'ct' && ageOf(x[1][3]) != null).sort((a, c) => ageOf(c[1][3]) - ageOf(a[1][3]));
  if (aged.length) b += '<p id="age">' + esc(ageOf(aged[0][1][3]) > OLD ? tf(l, 'age_sum', { f: t(l, 'f_' + aged[0][0]), d: fd(aged[0][1][3], l) }) : t(l, 'age_ok')) + ' <span class="k-xs">' + esc(t(l, 'age_note')) + '</span></p>';
  const miss = F.map((f, i) => [f, i]).filter(x => !r[8][x[1]]), RG = regsFor(r);
  b += '<h2 id="unknown">' + esc(tf(l, 'g_h', { k: nf(miss.length, l) })) + '</h2>';
  if (!miss.length) b += '<p>' + esc(t(l, 'g_all')) + '</p>';
  else b += '<p>' + esc(t(l, 'g_p')) + '</p><ol class="n37-g">' + miss.map(([f]) => { const rr = RG.filter(g => g[2].includes(f));
    return '<li><b>' + fname(l, f) + '.</b> ' + esc(t(l, 'ask_' + f)) + (rr.length ? '<ul>' + rr.map(g => '<li>' + esc(t(l, 'g_reg')) + ': ' + (g[1] ? '<a href="' + esc(g[1]) + '" rel="nofollow noopener">' + bdi(g[0]) + '</a>' : bdi(g[0])) + (g[4] ? ' <span class="k-xs">(' + esc(tf(l, 'g_probe', { d: fd(g[4], l) })) + ')</span>' : '') + '</li>').join('') + '</ul>' : (['pn', 'co', 'es', 'reg'].includes(f) ? ' <span class="k-xs">' + esc(tf(l, 'g_noreg', { m: r[3] })) + '</span>' : '')) + '</li>'; }).join('') + '</ol><p><a href="' + P + '/projects/' + r[1] + '/#ask">' + esc(t(l, 'q_link')) + '</a></p>';
  if (m) {
    const more = D.p.filter(x => x[3] === r[3] && cnt(x) > k).length;
    b += '<h2 id="market">' + esc(tf(l, 'm_h', { m: r[3] })) + '</h2><p>' + esc(tf(l, 'm_p', { k: nf(k, l), m: r[3], md: nf(m.med, l), n: nf(m.n, l) }) + ' ' + tf(l, more === 0 ? 'm_r0' : more === 1 ? 'm_r1' : 'm_rn', { r: nf(more, l) })) + '</p><div class="n37-tw" tabindex="0"><table><thead><tr><th scope="col">' + esc(t(l, 'th_f')) + '</th><th scope="col">' + esc(t(l, 'm_th2')) + '</th><th scope="col">' + esc(tf(l, 'm_th3', { m: r[3] })) + '</th></tr></thead><tbody>' +
      F.map((f, i) => '<tr><th scope="row">' + fname(l, f) + '</th><td>' + esc(t(l, r[7][i] === '1' ? 'yes' : 'no')) + '</td><td class="n">' + bdi(nf(m.cov[i], l) + '%') + '</td></tr>').join('') + '</tbody></table></div>';
  }
  const sd = (IX.byDev.get(r[5]) || []).filter(x => x !== r).sort((a, c) => cnt(c) - cnt(a)).slice(0, 12);
  if (r[5] && sd.length) b += '<h2 id="developer">' + esc(tf(l, 'd_h', { d: r[6] })) + '</h2>' + relTable(l, sd);
  const sa = (IX.byAr.get(r[3] + '|' + r[4]) || []).filter(x => x !== r && !sd.includes(x)).sort((a, c) => cnt(c) - cnt(a)).slice(0, 12);
  if (r[4] && sa.length) b += '<h2 id="area">' + esc(tf(l, 'a_h', { a: r[4] })) + '</h2>' + relTable(l, sa);
  b += '<p><a href="' + P + '/data/gaps/">' + esc(t(l, 'gp_link')) + '</a></p>';
  return page(shell, l, { path: '/projects/' + r[1] + '/record/', h1: tf(l, 'r_h1', { n: r[2] }), lead: t(l, 'r_lead'), body: b, noindex: true, crumb: [[t(l, 'projects'), pre(l) + '/projects/'], [r[2], pre(l) + '/projects/' + r[1] + '/']] });
}

async function gapPage(env, shell, l) {
  const F = D.f, P = pre(l), M = Object.entries(D.mk).filter(([, v]) => v.n >= 10).sort((a, b) => b[1].n - a[1].n);
  let b = '<h2>' + esc(t(l, 'gp_fields')) + '</h2><div class="n37-tw" tabindex="0"><table><thead><tr><th scope="col">' + esc(t(l, 'gp_m')) + '</th><th scope="col">' + esc(t(l, 'gp_n')) + '</th><th scope="col">' + esc(t(l, 'gp_md')) + '</th>' + F.map(f => '<th scope="col">' + fname(l, f) + '</th>').join('') + '</tr></thead><tbody>' +
    '<tr><th scope="row">' + esc(tf(l, 'gp_all', { n: nf(D.n, l) })) + '</th><td class="n">' + nf(D.n, l) + '</td><td></td>' + D.known.map(k => '<td class="n">' + bdi(nf(Math.round(100 * k / D.n), l) + '%') + '</td>').join('') + '</tr>' +
    M.map(([m, v]) => '<tr><th scope="row">' + bdi(m) + '</th><td class="n">' + nf(v.n, l) + '</td><td class="n">' + nf(v.med, l) + '</td>' + v.cov.map(c => '<td class="n">' + bdi(nf(c, l) + '%') + '</td>').join('') + '</tr>').join('') + '</tbody></table></div><p><a href="/data/gaps.csv" download>' + esc(t(l, 'csv_l')) + '</a></p>';
  const H = Array(11).fill(0); for (const x of D.p) H[cnt(x)]++;
  const mx = Math.max.apply(null, H) || 1, five = H.slice(5).reduce((a, c) => a + c, 0), md = median(D.p.map(cnt));
  const svg = '<svg class="n37-ds" viewBox="0 0 440 170" role="img" aria-labelledby="ds-s" focusable="false">' + H.map((c, i) => { const h = Math.round(120 * c / mx), x = 8 + i * 39; return '<rect x="' + x + '" y="' + (140 - h) + '" width="30" height="' + h + '" fill="currentColor" rx="2"></rect><text x="' + (x + 15) + '" y="' + (134 - h) + '" text-anchor="middle">' + nf(c, l) + '</text><text x="' + (x + 15) + '" y="158" text-anchor="middle">' + i + '</text>'; }).join('') + '</svg>';
  b += '<h2 id="dist">' + esc(t(l, 'ds_h')) + '</h2><p id="ds-s">' + esc(tf(l, 'ds_sum', { a: nf(five, l), n: nf(D.n, l), p: nf(Math.round(100 * five / D.n), l), md: nf(md, l), z: nf(H[0], l) })) + '</p>' + svg + '<p class="k-xs">' + esc(t(l, 'ds_p')) + '</p>' +
    '<div class="n37-tw" tabindex="0"><table><thead><tr><th scope="col">' + esc(t(l, 'ds_th1')) + '</th>' + H.map((c, i) => '<th scope="col" class="n">' + i + '</th>').join('') + '</tr></thead><tbody><tr><th scope="row">' + esc(t(l, 'ds_th2')) + '</th>' + H.map(c => '<td class="n">' + nf(c, l) + '</td>').join('') + '</tr></tbody></table></div>';
  b += '<h2>' + esc(t(l, 'gp_reg_h')) + '</h2><p>' + esc(t(l, 'gp_reg_p')) + '</p><div class="n37-tw" tabindex="0"><table><thead><tr><th scope="col">' + esc(t(l, 'gp_m')) + '</th><th scope="col">' + esc(t(l, 'g_reg')) + '</th><th scope="col">' + esc(t(l, 'th_f')) + '</th></tr></thead><tbody>' +
    Object.entries(D.rg).map(([m, rs]) => rs.filter(g => g[2].length).map(g => '<tr><th scope="row">' + bdi(m) + '</th><td>' + (g[1] ? '<a href="' + esc(g[1]) + '" rel="nofollow noopener">' + bdi(g[0]) + '</a>' : bdi(g[0])) + '</td><td>' + g[2].map(f => esc(t(l, 'f_' + f))).join(', ') + '</td></tr>').join('')).join('') + '</tbody></table></div>';
  b += '<h2>' + esc(t(l, 'gp_thin_h')) + '</h2><p>' + esc(t(l, 'gp_thin_p')) + '</p>' + M.slice(0, 8).map(([m]) => '<h3>' + bdi(m) + '</h3><ul class="n37-rel">' + D.p.filter(x => x[3] === m).sort((a, c) => cnt(a) - cnt(c) || a[0].localeCompare(c[0])).slice(0, 5).map(x => '<li><a href="' + recU(l, x[1]) + '">' + bdi(x[2]) + '</a>&nbsp;<span class="k-xs">' + nf(cnt(x), l) + '/10</span></li>').join('') + '</ul>').join('');
  return page(shell, l, { path: '/data/gaps/', h1: t(l, 'gp_h1'), lead: t(l, 'gp_lead'), body: b, crumb: [[t(l, 'data'), pre(l) + '/data/']] });
}

function gapsCsv() {
  const F = D.f, q = v => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const L = ['# Kolaboro: coverage of the 10 key facts by market (markets with 5+ projects), built ' + (D.built || '') + '. Licence CC BY 4.0, cite Kolaboro, https://kolaboro.com/data/gaps/',
    ['market', 'country', 'projects', 'median_fields_held'].concat(F.map(f => 'pct_' + f)).join(',')];
  L.push(['ALL', '', D.n, median(D.p.map(cnt))].concat(D.known.map(k => Math.round(100 * k / D.n))).map(q).join(','));
  for (const [m, v] of Object.entries(D.mk).sort((a, b) => b[1].n - a[1].n)) L.push([m, v.co || '', v.n, v.med].concat(v.cov).map(q).join(','));
  return new Response(L.join('\n') + '\n', { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'inline; filename="kolaboro-gaps.csv"', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=900' } });
}
function recJson(r) {
  const F = D.f, RG = regsFor(r);
  const o = { id: r[0], slug: r[1], name: r[2], market: r[3], area: r[4] || null, developer: r[6] || null, page: ORIGIN + '/projects/' + r[1] + '/', record: ORIGIN + '/projects/' + r[1] + '/record/', built: D.built || null,
    licence: 'CC BY 4.0, cite Kolaboro', fields_held: cnt(r), fields_total: F.length, kinds: { reg: 'official register or its published mirror', dev: "the developer's own site", portal: 'a listing portal', web: 'another web page we read', sat: 'our Sentinel-2 reading', rec: 'our record (sources listed on the project page)' },
    facts: F.map((f, i) => { const c = r[8][i]; return c ? { field: f, label: t('en', 'f_' + f), value: c[0], source: c[1] ? (/^https?:/.test(c[1]) ? c[1] : ORIGIN + c[1]) : ORIGIN + '/projects/' + r[1] + '/#sources', kind: c[2], date: c[3] || null, date_is: f === 'ct' ? 'latest case' : f === 'cp' ? 'register inspection' : f === 'sat' ? 'satellite scene' : 'read', definition: ORIGIN + DEF[f] } : null; }).filter(Boolean),
    unknown: F.filter((f, i) => !r[8][i]).map(f => ({ field: f, label: t('en', 'f_' + f), how_to_find: t('en', 'ask_' + f), registers: RG.filter(g => g[2].includes(f)).map(g => ({ name: g[0], url: g[1] || null, reached_by_our_checker: g[4] || null })) })) };
  return new Response(JSON.stringify(o, null, 1), { headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=900', 'x-robots-tag': 'noindex' } });
}

// r3u (round 3): facts on record per market (/m/<market>/) and per developer (/developers/<slug>/), live numbers in the home hero,
// /<lang>/data/ (open data in 7 more languages), and errPage() used by index.js when a page throws twice
const CSSL = '<style>.n37-tw{overflow-x:auto;border:1px solid var(--k-line,#D5DCDB);border-radius:12px;margin:10px 0 18px}.n37 table{width:100%;border-collapse:collapse;font-size:.93rem}.n37 th,.n37 td{padding:8px 12px;border-bottom:1px solid var(--k-line,#D5DCDB);text-align:start;vertical-align:top}.n37 td.n{font-variant-numeric:tabular-nums;white-space:nowrap}.n37 tbody th a{color:inherit;text-decoration-style:dotted}.n37-rel{display:flex;flex-wrap:wrap;gap:4px 18px;list-style:none;padding:0}.n37-rel a{display:inline-flex;align-items:center;min-height:44px}.n37 .k-xs{font-size:.9rem;opacity:.8}</style>';
const KIND = { reg: 'r', dev: 'd', portal: 'w', web: 'w', sat: 'o', rec: 'o' };
const share = (a, n) => n ? Math.round(100 * a / n) : 0;
function factCounts(rows) {
  const F = D.f, h = F.map(() => 0), g = F.map(() => 0), k = { r: 0, d: 0, w: 0, o: 0 }; let all = 0;
  for (const r of rows) r[8].forEach((c, i) => { if (!c) return; h[i]++; all++; if (c[2] === 'reg') g[i]++; k[KIND[c[2]] || 'o']++; });
  return { h, g, k, all };
}
const recList = (l, rows) => '<ul class="n37-rel">' + rows.map(x => '<li><a href="' + recU(l, x[1]) + '">' + bdi(x[2]) + '</a>&nbsp;<span class="k-xs">' + nf(cnt(x), l) + '/10</span></li>').join('') + '</ul>';
function mkSection(l, m) {
  const rows = IX.byMk.get(m) || []; if (rows.length < 3) return '';
  const F = D.f, c = factCounts(rows), byK = rows.slice().sort((a, b) => cnt(b) - cnt(a) || a[2].localeCompare(b[2]));
  let b = '<section class="wrap n37" id="n37-facts"' + dir(l) + '>' + CSSL + '<h2>' + esc(tf(l, 'mk_h', { m })) + '</h2><p>' + esc(tf(l, 'mk_p', { n: nf(rows.length, l), m })) + '</p>' +
    '<div class="n37-tw" tabindex="0"><table><thead><tr><th scope="col">' + esc(t(l, 'th_f')) + '</th><th scope="col">' + esc(t(l, 'th_hold')) + '</th><th scope="col">' + esc(t(l, 'th_here')) + '</th><th scope="col">' + esc(t(l, 'th_all')) + '</th></tr></thead><tbody>' +
    F.map((f, i) => '<tr><th scope="row">' + fname(l, f) + '</th><td class="n">' + nf(c.h[i], l) + ' / ' + nf(rows.length, l) + '</td><td class="n">' + bdi(nf(share(c.h[i], rows.length), l) + '%') + '</td><td class="n">' + bdi(nf(share(D.known[i], D.n), l) + '%') + '</td></tr>').join('') + '</tbody></table></div>' +
    '<p>' + esc(tf(l, 'mk_src', { k: nf(c.all, l), r: nf(c.k.r, l), d: nf(c.k.d, l), w: nf(c.k.w, l), o: nf(c.k.o, l) })) + '</p>' +
    '<h3>' + esc(t(l, 'mk_best')) + '</h3>' + recList(l, byK.slice(0, 5)) + '<h3>' + esc(t(l, 'mk_thin')) + '</h3>' + recList(l, byK.slice(-5).reverse()) +
    '<p><a href="' + pre(l) + '/data/gaps/">' + esc(t(l, 'gp_link')) + '</a> · <a href="/data/gaps.csv" download>' + esc(t(l, 'csv_l')) + '</a></p></section>';
  return b;
}
function devSection(l, slug) {
  const rows = IX.byDev.get(slug) || []; if (!rows.length) return '';
  const F = D.f, c = factCounts(rows), name = rows[0][6] || slug, thin = rows.slice().sort((a, b) => cnt(a) - cnt(b) || a[2].localeCompare(b[2])).slice(0, 8);
  return '<div class="n37" id="n37-dev"' + dir(l) + '>' + CSSL + '<h3>' + esc(t(l, 'dv_h')) + '</h3><p>' + esc(tf(l, 'dv_p', { n: nf(rows.length, l), d: name })) + '</p>' +
    '<div class="n37-tw" tabindex="0"><table><thead><tr><th scope="col">' + esc(t(l, 'th_f')) + '</th><th scope="col">' + esc(t(l, 'th_hold')) + '</th><th scope="col">' + esc(t(l, 'th_regs')) + '</th></tr></thead><tbody>' +
    F.map((f, i) => '<tr><th scope="row">' + fname(l, f) + '</th><td class="n">' + nf(c.h[i], l) + ' / ' + nf(rows.length, l) + '</td><td class="n">' + nf(c.g[i], l) + '</td></tr>').join('') + '</tbody></table></div>' +
    '<h3>' + esc(t(l, 'dv_list')) + '</h3>' + recList(l, thin) + '</div>';
}
let STATS = null;
async function stats(env) {
  if (STATS && Date.now() - STATS.t < 600000) return STATS.v;
  let v = null;
  try { const kb = await import('./kolaboro.js'); const u = new URL(ORIGIN + '/api/open/stats'); const r = await kb.open(new Request(u), u, env); if (r && r.ok) { const j = await r.json(); if (j && j.projects) v = j; } } catch (e) { v = null; }
  STATS = { t: Date.now(), v }; return v;
}
async function liveLine(l, env) {
  const s = await stats(env); if (!s) return '';
  const tx = tf(l, 'live_p', { p: '\u0001projects\u0002' + nf(s.projects, l) + '\u0003', s: '\u0001sources\u0002' + nf(s.sources, l) + '\u0003', g: nf(IX.regs, l), f: nf(IX.src, l) });
  return '<style>.n37-live{margin:10px 0 0;font-size:.95rem;line-height:1.5;max-width:640px}.n37-live a{font-weight:700}</style><p class="n37-live" id="n37-live"' + dir(l) + '>' +
    esc(tx).replace(/\u0001(\w+)\u0002([^\u0003]*)\u0003/g, (m, k, v) => '<b data-db="' + k + '">' + v + '</b>') + ' <a href="' + pre(l) + '/data/gaps/">' + esc(t(l, 'live_l')) + '</a></p>';
}
const DS = [['ds1', 'bali-cases'], ['ds2', 'kolaboro-parquet'], ['ds3', 'kolaboro-markets-parquet'], ['ds4', 'world-claims'], ['ds5', 'promises'], ['ds6', 'delay-index'], ['ds7', 'price-index'], ['ds8', 'register-checks'], ['ds9', 'satellite'], ['ds10', null, '/data/n37u.json', 'JSON'], ['ds11', null, '/data/gaps.csv', 'CSV']];
const sz = (b, l) => b >= 1048576 ? nf(Math.round(b / 104857.6) / 10, l) + ' MB' : nf(Math.max(1, Math.round(b / 1024)), l) + ' KB';
async function dataHub(env, shell, l) {
  const C = await file(env, '/data/catalog.json'), by = new Map(((C && C.datasets) || []).map(x => [x.id, x]));
  let b = '<h2>' + esc(t(l, 'dh_main')) + '</h2><div class="n37-tw" tabindex="0"><table><thead><tr><th scope="col">' + esc(t(l, 'dh_main')) + '</th><th scope="col">' + esc(t(l, 'dh_fmt')) + '</th><th scope="col">' + esc(t(l, 'dh_size')) + '</th><th scope="col">' + esc(t(l, 'dh_upd')) + '</th><th scope="col">SHA-256</th></tr></thead><tbody>';
  for (const [k, id, url, fmt] of DS) {
    const x = id ? by.get(id) : null; if (id && !x) continue;
    const href = x ? x.url.replace(ORIGIN, '') : url, f = x ? String(x.format || '').toUpperCase() : fmt;
    b += '<tr><th scope="row"><a href="' + esc(href) + '" download>' + esc(t(l, k + '_t')) + '</a><br><span class="k-xs">' + esc(t(l, k + '_d')) + '</span></th><td>' + bdi(f) + '</td><td class="n">' + (x && x.bytes ? sz(x.bytes, l) : '') + '</td><td class="n">' +
      (x ? fd(String(x.last_updated || (x.freshness || {}).stamp || ''), l) : esc(t(l, 'dh_live'))) + '</td><td class="n">' + (x && x.sha256 ? '<code title="' + esc(x.sha256) + '">' + esc(x.sha256.slice(0, 12)) + '…</code>' : '') + '</td></tr>';
  }
  b += '</tbody></table></div>';
  if (C) b += '<p class="k-xs">' + esc(tf(l, 'dh_asof', { d: fd(String(C.generated_at || ''), l) })) + '</p><p><a href="/data/">' + esc(tf(l, 'dh_cat', { n: nf((C.summary || {}).datasets || by.size, l), f: nf((C.summary || {}).files || by.size, l) })) + '</a></p>';
  b += '<h2>' + esc(t(l, 'dh_q')) + '</h2><ul class="n37-g"><li><a href="' + pre(l) + '/data/dictionary/">' + esc(t(l, 'dh_q1')) + '</a></li><li><a href="' + pre(l) + '/data/gaps/">' + esc(t(l, 'gp_link')) + '</a></li><li><a href="' + pre(l) + '/registers/">' + esc(t(l, 'dh_q2')) + '</a></li><li><a href="/docs/api/">' + esc(t(l, 'dh_q3')) + '</a></li></ul><p>' + esc(t(l, 'dh_lic')) + '</p>';
  return page(shell, l, { path: '/data/', h1: t(l, 'dh_h1'), lead: t(l, 'dh_lead'), body: b });
}
export async function errPage(u) {
  const m = /^\/(es|de|fr|nl|ru|zh|ar)\//.exec(u.pathname), l = m ? m[1] : 'en';
  const g = k => (T && T[l] && T[l][k]) || ({ err_h: 'This page did not load', err_p: 'Our server could not build it just now. It usually works again within seconds.', err_a: 'Try again', home: 'Home' })[k];
  const html = '<!doctype html><html lang="' + l + '"' + dir(l) + '><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>' + esc(g('err_h')) + ' | Kolaboro</title>' +
    '<style>body{margin:0;font:16px/1.6 system-ui,sans-serif;background:#F6F4EF;color:#17212B}main{max-width:560px;margin:12vh auto;padding:0 16px}a{color:#155C75;font-weight:700}@media (prefers-color-scheme:dark){body{background:#11181F;color:#E8ECEF}a{color:#7CC7E0}}</style></head>' +
    '<body><main><h1>' + esc(g('err_h')) + '</h1><p>' + esc(g('err_p')) + '</p><p><a href="' + esc(u.pathname) + '">' + esc(g('err_a')) + '</a> · <a href="' + pre(l) + '/">' + esc(g('home')) + '</a> · <a href="/engineering/status/">/engineering/status/</a></p></main></body></html>';
  return new Response(html, { status: 503, headers: { 'content-type': 'text/html; charset=utf-8', 'retry-after': '5', 'cache-control': 'no-store', 'x-kb-fallback': '1' } });
}

const ITEMS = [['s1', '/projects/emaar-golf-vale/record/#fields'], ['s2', '/projects/emaar-golf-vale/record/#unknown'], ['s3', '/projects/emaar-golf-vale/record/#market'], ['s4', '/projects/emaar-golf-vale/record/#developer'], ['s5', '/data/gaps/'], ['s6', '/projects/emaar-golf-vale/record/#age'], ['s7', '/data/dictionary/'], ['s8', '/data/gaps/#dist'], ['s9', '/data/gaps.csv'], ['s10', '/projects/emaar-golf-vale/record.json'], ['s11', '/data/'], ['s12', '/m/dubai/#n37-facts'], ['s13', '/developers/emaar-properties/#n37-dev'], ['s14', '/#n37-live'], ['s15', '/engineering/status/']];
const shipped = l => '<section class="wrap" id="shipped-2026-11-23"' + dir(l) + '><h2>' + esc(t(l, 'sh_h')) + '</h2><p>' + esc(t(l, 'sh_p')) + '</p><ul>' + ITEMS.map(x => '<li><a href="' + (/\.(csv|json)$/.test(x[1]) ? '' : pre(l)) + x[1] + '">' + esc(t(l, x[0] + '_t')) + '</a>: ' + esc(t(l, x[0] + '_s')) + '</li>').join('') + '</ul></section>';
const STY = '<style>.n37-in{margin:14px 0 0;padding:12px 16px;border:1px solid var(--k-line,var(--line,#d5d3cc));border-radius:14px;line-height:1.55}.n37-in a{font-weight:700}</style>';

export async function inject(req, u, env, r) {
  try {
    if (!/text\/html/.test(r.headers.get('content-type') || '')) return r;
    const m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(.*)$/.exec(u.pathname), l = m[1] || 'en', p = m[2];
    if (!(await load(env))) return r;
    const add = []; let mm;
    if (p === 'engineering/' || p === 'yc/') add.push(['main', 'append', shipped(l)]);
    else if (p === '') { const h = await liveLine(l, env); if (h) add.push(['p.hero-sub', 'after', h]); }
    else if ((mm = /^m\/([^/.]{2,60})\/$/.exec(p))) { const mk = mBySlug(mm[1]); const h = mk ? mkSection(l, mk) : ''; if (!h) return r; add.push(['#slippage', 'before', h]); }
    else if ((mm = /^developers\/([a-z0-9-]{2,90})\/$/.exec(p))) { const h = devSection(l, mm[1]); if (!h) return r; add.push(['#projects', 'append', h]); }
    else if ((mm = /^projects\/([a-z0-9-]{1,90})\/$/.exec(p))) {
      const x = IX.bySlug.get(mm[1]); if (!x) return r;
      const k = cnt(x);
      add.push(['#glance', 'append', STY + '<p class="n37-in"' + dir(l) + '><a href="' + recU(l, x[1]) + '">' + esc(tf(l, 'inj_p', { k: nf(k, l), g: nf(10 - k, l) })) + '</a> · <a href="/projects/' + x[1] + '/record.json" type="application/json">' + esc(t(l, 'js_l')) + '</a></p>']);
      if (D.mk[x[3]]) add.push(['#market', 'append', '<p class="n37-in"' + dir(l) + '><a href="' + recU(l, x[1]) + '#market">' + esc(tf(l, 'inj_m', { m: x[3] })) + '</a></p>']);
    } else if (p === 'data/' || p === 'data/dictionary/' || p === 'registers/') add.push(['main', 'append', '<section class="wrap"' + dir(l) + '>' + STY + '<p class="n37-in">' + (l === 'en' || p === 'data/' ? '' : '<a href="' + pre(l) + '/data/">' + esc(t(l, 'dh_link')) + '</a> · ') + '<a href="' + pre(l) + '/data/gaps/">' + esc(t(l, 'gp_link')) + '</a> · ' + esc(t(l, 's5_s')) + ' · <a href="' + pre(l) + '/data/gaps/#dist">' + esc(t(l, 's8_t')) + '</a> · <a href="/data/gaps.csv" download>' + esc(t(l, 'csv_l')) + '</a></p></section>']);
    if (!add.length) return r;
    let out = new HTMLRewriter();
    for (const [sel, , h] of add) {
      let done = false;
      if (sel === 'main') out = out.on('main', { element(e) { e.onEndTag(end => { if (!done) { done = true; end.before(h, { html: true }); } }); } });
      else { const how = add.find(a => a[0] === sel)[1]; out = out.on(sel, { element(e) { if (!done) { done = true; e[how](h, { html: true }); } } }); if (how === 'before') out = out.on('main', { element(e) { e.onEndTag(end => { if (!done) { done = true; end.before(h, { html: true }); } }); } }); }
    }
    return out.transform(r);
  } catch (e) { return r; }
}
export async function handle(req, u, env, ctx, shell) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return null;
  const p = u.pathname; let m;
  if (!PATHS.test(p)) return null;
  if (!(await load(env))) { for (const k in MEMO) delete MEMO[k]; T = null; if (!(await load(env))) return new Response('Temporarily unavailable, please retry.', { status: 503, headers: { 'retry-after': '5', 'cache-control': 'no-store', 'content-type': 'text/plain; charset=utf-8' } }); }
  if ((m = p.match(RX_JS))) { const r = IX.bySlug.get(m[1]); return r ? recJson(r) : null; }
  if (p === '/data/gaps.csv') return gapsCsv();
  try { return await route(env, shell, p); } catch (e) {
    try { return await route(env, shell, p); } catch (e2) { return new Response('Temporarily unavailable, please retry.', { status: 503, headers: { 'retry-after': '5', 'cache-control': 'no-store', 'content-type': 'text/plain; charset=utf-8', 'x-kb-err': String(e2 && e2.message || e2).slice(0, 120).replace(/[^\x20-\x7e]/g, '') } }); }
  }
}
async function route(env, shell, p) {
  let m;
  if ((m = p.match(RX_REC))) {
    if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' } });
    const r = IX.bySlug.get(m[2]); if (!r) return null;
    return recPage(env, shell, m[1] || 'en', r);
  }
  if ((m = p.match(/^\/(es|de|fr|nl|ru|zh|ar)\/data(\/?)$/))) { if (!m[2]) return new Response(null, { status: 301, headers: { location: p + '/' } }); return dataHub(env, shell, m[1]); }
  if ((m = p.match(RX_GAP))) { if (!m[2]) return new Response(null, { status: 301, headers: { location: p + '/' } }); return gapPage(env, shell, m[1] || 'en'); }
  return null;
}
