// kolaboro.com batch 37 round 1 (agent r1u, 23 Nov 2026): the project record, field by field. Data: /data/n37u.json (built by
// /open/n37u-build.py from published files only, no network, no model); strings in 8 languages: /data/n37u-i18n.json.
//   GET /[l/]projects/<slug>/record/   10 key facts with source kind and date read, what we still do not know and where to check it,
//                                      market context per field, same developer and same area
//   GET /[l/]data/gaps/                coverage of the 10 key facts per market, registers that fill them, thinnest records
//   inject()                           entry links on project pages, /data/, /data/dictionary/, /registers/; "Shipped 23 Nov 2026" on /engineering/ and /yc/
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
  if (d && d !== D) { D = d; IX = { bySlug: new Map(d.p.map(r => [r[1], r])), byDev: new Map(), byAr: new Map() }; for (const r of d.p) { if (r[5]) (IX.byDev.get(r[5]) || IX.byDev.set(r[5], []).get(r[5])).push(r); const a = r[3] + '|' + r[4]; (IX.byAr.get(a) || IX.byAr.set(a, []).get(a)).push(r); } }
  return !!(T && D);
}
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
const RX_REC = new RegExp('^\\/' + LP + 'projects\\/([a-z0-9-]{1,90})\\/record(\\/?)$'), RX_GAP = new RegExp('^\\/' + LP + 'data\\/gaps(\\/?)$');
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:projects\/[a-z0-9-]{1,90}\/record|data\/gaps)\/?$/;
export const INJ = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:projects\/[a-z0-9-]{1,90}|engineering|yc|data|data\/dictionary|registers)\/$/;

const CSS = '<style id="n37u-css">.n37{max-width:1100px}.n37 h2{margin:28px 0 8px;font-size:1.3rem}.n37 p,.n37 li{line-height:1.6}.n37 .k-xs{font-size:.9rem;color:var(--k-muted,#56636F)}' +
  '.n37-tw{overflow-x:auto;border:1px solid var(--k-line,#D5DCDB);border-radius:12px;margin:10px 0 22px;background:var(--k-surface,#fff)}.n37 table{width:100%;border-collapse:collapse;font-size:.93rem}.n37 th,.n37 td{padding:9px 12px;border-bottom:1px solid var(--k-line,#D5DCDB);text-align:start;vertical-align:top}.n37 thead th{font-size:.82rem}.n37 td.n{font-variant-numeric:tabular-nums;white-space:nowrap}.n37 tbody th{font-weight:600;min-width:140px}' +
  '.n37-b{display:inline-block;padding:2px 8px;border-radius:999px;font-size:.78rem;font-weight:700;border:1px solid currentColor;white-space:nowrap}.n37-b.reg{color:#1F6B3A}.n37-b.dev,.n37-b.web,.n37-b.portal{color:#6A4C00}.n37-b.sat{color:#155C75}.n37-b.rec{color:var(--k-muted,#56636F)}.n37-b.no{color:#9A3412}' +
  ':root[data-theme=dark] .n37-b.reg{color:#7FD49A}:root[data-theme=dark] .n37-b.dev,:root[data-theme=dark] .n37-b.web,:root[data-theme=dark] .n37-b.portal{color:#F2C46B}:root[data-theme=dark] .n37-b.sat{color:#7CC7E0}:root[data-theme=dark] .n37-b.no{color:#FFA07A}' +
  '@media (prefers-color-scheme:dark){:root:not([data-theme=light]) .n37-b.reg{color:#7FD49A}:root:not([data-theme=light]) .n37-b.dev,:root:not([data-theme=light]) .n37-b.web,:root:not([data-theme=light]) .n37-b.portal{color:#F2C46B}:root:not([data-theme=light]) .n37-b.sat{color:#7CC7E0}:root:not([data-theme=light]) .n37-b.no{color:#FFA07A}}' +
  '.n37 a{overflow-wrap:anywhere}.n37-g li{margin:0 0 12px}.n37-g ul{margin:4px 0 0;padding-inline-start:18px}.n37 .n37-v{overflow-wrap:anywhere;max-width:46ch}.n37-rel{display:flex;flex-wrap:wrap;gap:8px 18px;list-style:none;padding:0}.n37-rel a{display:inline-flex;align-items:center;min-height:44px}</style>';

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
const badge = (l, k) => '<span class="n37-b ' + k + '">' + esc(t(l, 'k_' + k)) + '</span>';
const regsFor = r => (D.rg[r[3]] || D.rg[(D.co[r[0]] === 'USA' ? 'United States' : D.co[r[0]])] || []);
const relTable = (l, rows) => '<div class="n37-tw" tabindex="0"><table><thead><tr><th scope="col">' + esc(t(l, 'th_p')) + '</th><th scope="col">' + esc(t(l, 'th_k')) + '</th></tr></thead><tbody>' +
  rows.map(r => '<tr><th scope="row"><a href="' + recU(l, r[1]) + '">' + bdi(r[2]) + '</a></th><td class="n">' + nf(cnt(r), l) + ' / 10</td></tr>').join('') + '</tbody></table></div>';

async function recPage(env, shell, l, r) {
  const F = D.f, P = pre(l), k = cnt(r), m = D.mk[r[3]];
  let b = '<p><a href="' + P + '/projects/' + r[1] + '/">' + esc(t(l, 'back')) + '</a> · <b>' + esc(tf(l, 'held', { k: nf(k, l) })) + '</b></p>';
  b += '<h2 id="fields">' + esc(t(l, 'r_tbl')) + '</h2><div class="n37-tw" tabindex="0"><table><thead><tr><th scope="col">' + esc(t(l, 'th_f')) + '</th><th scope="col">' + esc(t(l, 'th_v')) + '</th><th scope="col">' + esc(t(l, 'th_s')) + '</th><th scope="col">' + esc(t(l, 'th_d')) + '</th></tr></thead><tbody>' +
    F.map((f, i) => { const c = r[8][i]; if (!c) return '<tr><th scope="row">' + esc(t(l, 'f_' + f)) + '</th><td>' + esc(t(l, 'none')) + '</td><td><span class="n37-b no">' + esc(t(l, 'none')) + '</span></td><td></td></tr>';
      const v = f === 'ct' ? nf(c[0], l) : String(c[0]), u = c[1], src = u ? '<a href="' + esc(u) + '"' + (/^https?:/.test(u) ? ' rel="nofollow noopener"' : '') + '>' + esc(/^https?:/.test(u) ? host(u) : u) + '</a>' : '<a href="' + P + '/projects/' + r[1] + '/#sources">' + esc(t(l, 'rec_n')) + '</a>';
      return '<tr><th scope="row">' + esc(t(l, 'f_' + f)) + '</th><td class="n37-v">' + bdi(v) + '</td><td>' + badge(l, c[2]) + ' ' + src + '</td><td class="n">' + esc(fd(c[3], l)) + '</td></tr>'; }).join('') + '</tbody></table></div>';
  const miss = F.map((f, i) => [f, i]).filter(x => !r[8][x[1]]), RG = regsFor(r);
  b += '<h2 id="unknown">' + esc(tf(l, 'g_h', { k: nf(miss.length, l) })) + '</h2>';
  if (!miss.length) b += '<p>' + esc(t(l, 'g_all')) + '</p>';
  else b += '<p>' + esc(t(l, 'g_p')) + '</p><ol class="n37-g">' + miss.map(([f]) => { const rr = RG.filter(g => g[2].includes(f));
    return '<li><b>' + esc(t(l, 'f_' + f)) + '.</b> ' + esc(t(l, 'ask_' + f)) + (rr.length ? '<ul>' + rr.map(g => '<li>' + esc(t(l, 'g_reg')) + ': ' + (g[1] ? '<a href="' + esc(g[1]) + '" rel="nofollow noopener">' + bdi(g[0]) + '</a>' : bdi(g[0])) + (g[4] ? ' <span class="k-xs">(' + esc(tf(l, 'g_probe', { d: fd(g[4], l) })) + ')</span>' : '') + '</li>').join('') + '</ul>' : (['pn', 'co', 'es', 'reg'].includes(f) ? ' <span class="k-xs">' + esc(tf(l, 'g_noreg', { m: r[3] })) + '</span>' : '')) + '</li>'; }).join('') + '</ol><p><a href="' + P + '/projects/' + r[1] + '/#ask">' + esc(t(l, 'q_link')) + '</a></p>';
  if (m) {
    const more = D.p.filter(x => x[3] === r[3] && cnt(x) > k).length;
    b += '<h2 id="market">' + esc(tf(l, 'm_h', { m: r[3] })) + '</h2><p>' + esc(tf(l, 'm_p', { k: nf(k, l), m: r[3], md: nf(m.med, l), n: nf(m.n, l), r: nf(more, l) })) + '</p><div class="n37-tw" tabindex="0"><table><thead><tr><th scope="col">' + esc(t(l, 'th_f')) + '</th><th scope="col">' + esc(t(l, 'm_th2')) + '</th><th scope="col">' + esc(tf(l, 'm_th3', { m: r[3] })) + '</th></tr></thead><tbody>' +
      F.map((f, i) => '<tr><th scope="row">' + esc(t(l, 'f_' + f)) + '</th><td>' + esc(t(l, r[7][i] === '1' ? 'yes' : 'no')) + '</td><td class="n">' + bdi(nf(m.cov[i], l) + '%') + '</td></tr>').join('') + '</tbody></table></div>';
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
  let b = '<h2>' + esc(t(l, 'gp_fields')) + '</h2><div class="n37-tw" tabindex="0"><table><thead><tr><th scope="col">' + esc(t(l, 'gp_m')) + '</th><th scope="col">' + esc(t(l, 'gp_n')) + '</th><th scope="col">' + esc(t(l, 'gp_md')) + '</th>' + F.map(f => '<th scope="col">' + esc(t(l, 'f_' + f)) + '</th>').join('') + '</tr></thead><tbody>' +
    '<tr><th scope="row">' + esc(tf(l, 'gp_all', { n: nf(D.n, l) })) + '</th><td class="n">' + nf(D.n, l) + '</td><td></td>' + D.known.map(k => '<td class="n">' + bdi(nf(Math.round(100 * k / D.n), l) + '%') + '</td>').join('') + '</tr>' +
    M.map(([m, v]) => '<tr><th scope="row">' + bdi(m) + '</th><td class="n">' + nf(v.n, l) + '</td><td class="n">' + nf(v.med, l) + '</td>' + v.cov.map(c => '<td class="n">' + bdi(nf(c, l) + '%') + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
  b += '<h2>' + esc(t(l, 'gp_reg_h')) + '</h2><p>' + esc(t(l, 'gp_reg_p')) + '</p><div class="n37-tw" tabindex="0"><table><thead><tr><th scope="col">' + esc(t(l, 'gp_m')) + '</th><th scope="col">' + esc(t(l, 'g_reg')) + '</th><th scope="col">' + esc(t(l, 'th_f')) + '</th></tr></thead><tbody>' +
    Object.entries(D.rg).map(([m, rs]) => rs.filter(g => g[2].length).map(g => '<tr><th scope="row">' + bdi(m) + '</th><td>' + (g[1] ? '<a href="' + esc(g[1]) + '" rel="nofollow noopener">' + bdi(g[0]) + '</a>' : bdi(g[0])) + '</td><td>' + g[2].map(f => esc(t(l, 'f_' + f))).join(', ') + '</td></tr>').join('')).join('') + '</tbody></table></div>';
  b += '<h2>' + esc(t(l, 'gp_thin_h')) + '</h2><p>' + esc(t(l, 'gp_thin_p')) + '</p>' + M.slice(0, 8).map(([m]) => '<h3>' + bdi(m) + '</h3><ul class="n37-rel">' + D.p.filter(x => x[3] === m).sort((a, c) => cnt(a) - cnt(c) || a[0].localeCompare(c[0])).slice(0, 5).map(x => '<li><a href="' + recU(l, x[1]) + '">' + bdi(x[2]) + '</a>&nbsp;<span class="k-xs">' + nf(cnt(x), l) + '/10</span></li>').join('') + '</ul>').join('');
  return page(shell, l, { path: '/data/gaps/', h1: t(l, 'gp_h1'), lead: t(l, 'gp_lead'), body: b, crumb: [[t(l, 'data'), pre(l) + '/data/']] });
}

const ITEMS = [['s1', '/projects/emaar-golf-vale/record/#fields'], ['s2', '/projects/emaar-golf-vale/record/#unknown'], ['s3', '/projects/emaar-golf-vale/record/#market'], ['s4', '/projects/emaar-golf-vale/record/#developer'], ['s5', '/data/gaps/']];
const shipped = l => '<section class="wrap" id="shipped-2026-11-23"' + dir(l) + '><h2>' + esc(t(l, 'sh_h')) + '</h2><p>' + esc(t(l, 'sh_p')) + '</p><ul>' + ITEMS.map(x => '<li><a href="' + pre(l) + x[1] + '">' + esc(t(l, x[0] + '_t')) + '</a>: ' + esc(t(l, x[0] + '_s')) + '</li>').join('') + '</ul></section>';
const STY = '<style>.n37-in{margin:14px 0 0;padding:12px 16px;border:1px solid var(--k-line,var(--line,#d5d3cc));border-radius:14px;line-height:1.55}.n37-in a{font-weight:700}</style>';

export async function inject(req, u, env, r) {
  try {
    if (!/text\/html/.test(r.headers.get('content-type') || '')) return r;
    const m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(.*)$/.exec(u.pathname), l = m[1] || 'en', p = m[2];
    if (!(await load(env))) return r;
    const add = []; let mm;
    if (p === 'engineering/' || p === 'yc/') add.push(['main', 'append', shipped(l)]);
    else if ((mm = /^projects\/([a-z0-9-]{1,90})\/$/.exec(p))) {
      const x = IX.bySlug.get(mm[1]); if (!x) return r;
      const k = cnt(x);
      add.push(['#glance', 'append', STY + '<p class="n37-in"' + dir(l) + '><a href="' + recU(l, x[1]) + '">' + esc(tf(l, 'inj_p', { k: nf(k, l), g: nf(10 - k, l) })) + '</a></p>']);
      if (D.mk[x[3]]) add.push(['#market', 'append', '<p class="n37-in"' + dir(l) + '><a href="' + recU(l, x[1]) + '#market">' + esc(tf(l, 'inj_m', { m: x[3] })) + '</a></p>']);
    } else if (p === 'data/' || p === 'data/dictionary/' || p === 'registers/') add.push(['main', 'append', '<section class="wrap"' + dir(l) + '>' + STY + '<p class="n37-in"><a href="' + pre(l) + '/data/gaps/">' + esc(t(l, 'gp_link')) + '</a> · ' + esc(t(l, 's5_s')) + '</p></section>']);
    if (!add.length) return r;
    let out = new HTMLRewriter();
    for (const [sel, , h] of add) {
      let done = false;
      if (sel === 'main') out = out.on('main', { element(e) { e.onEndTag(end => { if (!done) { done = true; end.before(h, { html: true }); } }); } });
      else out = out.on(sel, { element(e) { if (!done) { done = true; e.append(h, { html: true }); } } });
    }
    return out.transform(r);
  } catch (e) { return r; }
}
export async function handle(req, u, env, ctx, shell) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return null;
  const p = u.pathname; let m;
  if (!PATHS.test(p) || !(await load(env))) return null;
  if ((m = p.match(RX_REC))) {
    if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } });
    const r = IX.bySlug.get(m[2]); if (!r) return null;
    return recPage(env, shell, m[1] || 'en', r);
  }
  if ((m = p.match(RX_GAP))) { if (!m[2]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } }); return gapPage(env, shell, m[1] || 'en'); }
  return null;
}
