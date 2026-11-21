// kolaboro.com batch 30 (n30c, 17 Nov 2026): items 15 to 20 of the batch. No model calls, no keys, nothing stored.
//   GET /k/n30c-map.js                         item 15: /map/ client: clusters, delay heat layer, filters in the URL (loaded only by /map/)
//   GET /api/v1/pin/<ID>                       item 17: pin check of one project (land, protected areas, flood), sources and dates
//   GET /[<lang>/]prices/history/[<place>/]    item 18: headline price history per place (SVG, no library)
//   GET /[<lang>/]watch/lookalikes/images/     item 16: the same picture on the pages of two projects (/data/image-reuse.json)
//   GET /[<lang>/]tools/widget/                item 19: widget v2 snippet builder
//   GET /embed/v2/<slug>/?theme=&size=&lang=   item 19: widget v2 (XHTML, no scripts, light/dark/auto, s/m/l, followed link)
//   GET /embed/v2.js                           item 19: loader that turns <div data-kolaboro-project="slug"> into the widget
//   GET /[<lang>/]engineering/status/          item 20: uptime, p50/p95 at the edge, deploy and build times, bytes per template
// Rules kept: facts with source and date; statistics with method, sample and date, labelled historical; Sumba, Eco Beach City and
// Equinox never listed; 8 languages, Arabic RTL; no Review/AggregateRating schema.
import * as N from './kbx_named.js';
import { S, t, esc, num, LANGS, slugMk, pinRecord, phMarkets, PH_MIN } from './kbx_n30c_named.js';
import { mkName, coName } from './kbx_hdate.js';

const ORIGIN = 'https://kolaboro.com';
const COI_RX = /eco\s*beach\s*city|\bequinox\b/i;
const pre = l => l === 'en' ? '' : '/' + l;
export const N30C_V = 'n32s1';   // n32s: map starts after the first interaction
export const PATHS = /^\/k\/n30c-map\.js$|^\/api\/v1\/pin\/[A-Za-z0-9-]{3,20}$|^\/embed\/v2(?:\.js|\/[a-z0-9-]{1,90}\/?)$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:prices\/history(?:\/[a-z0-9-]{2,60})?|watch\/lookalikes\/images|tools\/widget|engineering\/status)\/?$/;
const jr = (o, s, cc) => new Response(JSON.stringify(o), { status: s || 200, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': cc || 'public, max-age=600' } });
const MEMO = {};
async function file(env, name, ttl) {
  const m = MEMO[name]; if (m && Date.now() - m.t < (ttl || 600000)) return m.v;
  let v = null;
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); if (r.ok) v = await r.json(); } catch (e) { v = null; }
  MEMO[name] = { t: Date.now(), v }; return v;
}
const quant = (a, q) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), i = (s.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); };   // type 7, as numpy
const fdt = (d, lang) => N.fd(String(d).slice(0, 10), lang);
const ftime = (d, lang) => { try { return new Date(d).toLocaleString(lang === 'en' ? 'en-GB' : lang, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', numberingSystem: 'latn' }) + ' UTC'; } catch (e) { return String(d); } };
const kb = n => n == null ? '-' : (n / 1024).toFixed(n < 10240 ? 1 : 0) + ' KB';
const PCSS = '<style>.n3 h2{margin:34px 0 10px;scroll-margin-top:90px}.n3 .k-table-wrap{overflow-x:auto;margin:10px 0 18px}.n3 table{width:100%;border-collapse:collapse;min-width:520px}.n3 th,.n3 td{padding:8px 10px;border-bottom:1px solid var(--k-line,#d5dbd8);text-align:start;vertical-align:top}.n3 td.k-n,.n3 th.k-n{text-align:end;font-variant-numeric:tabular-nums}.n3 .n3-kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:14px 0}.n3 .n3-kv div{border:1px solid var(--k-line,#d5dbd8);border-radius:12px;padding:10px 12px}.n3 .n3-kv b{display:block;font-size:1.4rem}.n3 .n3-kv span{font-size:.85rem;color:var(--k-muted,#56636F)}.n3 code{overflow-wrap:anywhere}.n3 .lim{font-size:.86rem;color:var(--k-muted,#56636F)}.n3 ul.lk{padding-inline-start:20px}</style>';
async function shellPage(shell, lang, o) {
  const sh = await shell(pre(lang) + '/how-we-score/'); if (!sh || sh.status !== 200) return null;
  const crumb = '<p class="crumb"><a href="' + pre(lang) + '/">Kolaboro</a>' + (o.crumb || []).map(([h, l]) => ' / <a href="' + h + '">' + esc(l) + '</a>').join('') + '</p>';
  const body = '<section class="phero kp"><div class="wrap">' + crumb + '<h1>' + esc(o.h1) + '</h1><p class="lead">' + esc(o.lead) + '</p></div></section><div class="wrap kwrap n3">' + o.body + '</div>' + PCSS;
  const pg = { title: o.title + ' | Kolaboro', desc: o.desc, canon: o.canon, body, noindex: !!o.noindex, alt: o.alt,
    ld: { '@context': 'https://schema.org', '@graph': [{ '@type': o.type || 'WebPage', name: o.title, url: o.canon, inLanguage: lang, description: o.desc, dateModified: o.mod || undefined, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } }].concat(o.ld || []) } };
  return new Response(await N.assemble(pg, lang, sh), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600' } });
}

// ------------------------------------------------------------------------------------------------ item 18: price history pages
const A11Y = {   // n34b (item 16): chart summary and data table labels
  en: { sum: 'Median index of the {n} projects: {a} on {d1}, {b} on {d2}.', tbl: 'Data table of the median line', d: 'Date', m: 'Median index (first copy = 100)' },
  es: { sum: 'Índice mediano de los {n} proyectos: {a} el {d1}, {b} el {d2}.', tbl: 'Tabla de datos de la línea mediana', d: 'Fecha', m: 'Índice mediano (primera copia = 100)' },
  fr: { sum: 'Indice médian des {n} projets : {a} le {d1}, {b} le {d2}.', tbl: 'Tableau des données de la ligne médiane', d: 'Date', m: 'Indice médian (première copie = 100)' },
  de: { sum: 'Medianindex der {n} Projekte: {a} am {d1}, {b} am {d2}.', tbl: 'Datentabelle der Medianlinie', d: 'Datum', m: 'Medianindex (erste Kopie = 100)' },
  nl: { sum: 'Mediane index van de {n} projecten: {a} op {d1}, {b} op {d2}.', tbl: 'Gegevenstabel van de mediaanlijn', d: 'Datum', m: 'Mediane index (eerste kopie = 100)' },
  ru: { sum: 'Медианный индекс {n} проектов: {a} на {d1}, {b} на {d2}.', tbl: 'Таблица данных медианной линии', d: 'Дата', m: 'Медианный индекс (первая копия = 100)' },
  zh: { sum: '{n} 个项目的中位指数：{d1} 为 {a}，{d2} 为 {b}。', tbl: '中位线数据表', d: '日期', m: '中位指数（首份副本 = 100）' },
  ar: { sum: 'المؤشر الوسيط لـ{n} مشروعًا: {a} في {d1}، و{b} في {d2}.', tbl: 'جدول بيانات الخط الوسيط', d: 'التاريخ', m: 'المؤشر الوسيط (النسخة الأولى = 100)' }
};
function phChart(e, lang) {
  const W = 720, Hh = 300, pl = 44, pr = 12, pt = 12, pb = 30, ms = d => Date.parse(d + 'T00:00:00Z');
  const t0 = ms(e.a), t1 = Math.max(ms(e.b), t0 + 864e5 * 30);
  let lo = 100, hi = 100; e.L.forEach(r => r.pts.forEach(p => { lo = Math.min(lo, p[1]); hi = Math.max(hi, p[1]); }));
  lo = Math.max(30, Math.floor((lo - 5) / 10) * 10); hi = Math.min(260, Math.ceil((hi + 5) / 10) * 10);
  const X = d => pl + (ms(d) - t0) / (t1 - t0) * (W - pl - pr), Y = v => pt + (hi - Math.min(hi, Math.max(lo, v))) / (hi - lo) * (Hh - pt - pb);
  const step = (hi - lo) > 80 ? 20 : 10; let g = '';
  for (let v = lo; v <= hi; v += step) g += '<line class="kph-grid" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"' + (v === 100 ? ' style="stroke-width:2"' : '') + '/><text class="kph-ax" x="' + (pl - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end">' + v + '</text>';
  const y0 = +e.a.slice(0, 4), y1 = +e.b.slice(0, 4);
  if (y1 > y0) for (let y = y0 + 1; y <= y1; y++) { const x = X(y + '-01-01'); g += '<line class="kph-grid" x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + pt + '" y2="' + (Hh - pb) + '"/><text class="kph-ax" x="' + x.toFixed(1) + '" y="' + (Hh - 10) + '" text-anchor="middle">' + y + '</text>'; }
  else { g += '<text class="kph-ax" x="' + pl + '" y="' + (Hh - 10) + '">' + esc(fdt(e.a, lang)) + '</text><text class="kph-ax" x="' + (W - pr) + '" y="' + (Hh - 10) + '" text-anchor="end">' + esc(fdt(e.b, lang)) + '</text>'; }
  const lines = e.L.map(r => '<polyline class="n3-pl" points="' + r.pts.map(p => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' ') + '"><title>' + esc(r.p.n) + '</title></polyline>').join('');
  // median across projects with a price on or before each date (last known index carried forward), drawn where 3 or more
  const days = [...new Set(e.L.flatMap(r => r.pts.map(p => p[0])))].sort(), med = [];
  for (const d of days) { const v = []; for (const r of e.L) { if (r.pts[0][0] > d) continue; let last = null; for (const p of r.pts) { if (p[0] <= d) last = p[1]; else break; } v.push(last); } if (v.length >= 3) med.push([d, quant(v, .5)]); }
  const ml = med.length > 1 ? '<polyline class="n3-med" points="' + med.map(p => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' ') + '"/>' : '';
  // n34b (batch 34, item 16): a text summary, keyboard focus and the median line as a data table under the chart
  const A11 = A11Y[lang] || A11Y.en, sid = 'kph-s' + (e.mk ? String(e.mk).toLowerCase().replace(/[^a-z0-9]+/g, '') : 'all');
  const sum = med.length > 1 ? A11.sum.replace('{n}', num(e.L.length, lang)).replace('{a}', num(med[0][1], lang, 1)).replace('{d1}', fdt(med[0][0], lang)).replace('{b}', num(med[med.length - 1][1], lang, 1)).replace('{d2}', fdt(med[med.length - 1][0], lang)) : '';
  const tbl = med.length > 1 ? '<details class="kph-dt"><summary>' + esc(A11.tbl) + '</summary><div class="k-table-wrap" tabindex="0"><table><thead><tr><th scope="col">' + esc(A11.d) + '</th><th scope="col" class="k-n">' + esc(A11.m) + '</th></tr></thead><tbody>' +
    (med.length > 80 ? med.filter((p, i) => i % Math.ceil(med.length / 80) === 0 || i === med.length - 1) : med).map(p => '<tr><td>' + esc(fdt(p[0], lang)) + '</td><td class="k-n">' + num(p[1], lang, 1) + '</td></tr>').join('') + '</tbody></table></div></details>' : '';
  return '<figure class="kph-fig"><svg class="kph-svg" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" tabindex="0" aria-label="' + esc(t(lang, 'ph_chart', { n: e.L.length })) + '"' + (sum ? ' aria-describedby="' + sid + '"' : '') + '>' + g + lines + ml + '</svg><figcaption>' + esc(t(lang, 'ph_chart', { n: num(e.L.length, lang) })) + (sum ? ' <span id="' + sid + '">' + esc(sum) + '</span>' : '') + '</figcaption></figure>' + tbl +
    '<style>.kph-svg:focus{outline:2px solid var(--k-sea,#155C75);outline-offset:4px}.kph-dt{margin:0 0 16px;max-width:760px}.kph-dt summary{min-height:44px;display:flex;align-items:center;cursor:pointer}.kph-fig{margin:14px 0;max-width:760px}.kph-svg{width:100%;height:auto;display:block}.kph-grid{stroke:var(--k-line,#d5dbd8);stroke-width:1}.kph-ax{font-size:12px;fill:var(--k-muted,#56636F)}.n3-pl{fill:none;stroke:var(--k-sea,#155C75);stroke-width:1.4;opacity:.45}.n3-med{fill:none;stroke:var(--k-ink,#17212B);stroke-width:3.5}@media(max-width:600px){.kph-ax{font-size:20px}}.kph-fig figcaption{font-size:.84rem;color:var(--k-muted,#56636F)}</style>';
}
const pctS = (v, lang) => (v > 0 ? '+' : v < 0 ? '−' : '') + num(Math.abs(v), lang, 1) + '%';
async function priceHistory(u, env, shell, lang, mkS) {
  const ix = await N.data(env), ph = await file(env, 'price-history.json', 1800000); if (!ph) return null;
  const M = phMarkets(ph, ix), P = pre(lang), list = [...M.values()].filter(e => e.L.length >= PH_MIN).sort((a, b) => b.L.length - a.L.length || a.mk.localeCompare(b.mk));
  const upd = String(ph.updated || '').slice(0, 10);
  const meth = '<h2 id="method">' + esc(t(lang, 'ph_meth')) + '</h2><ul class="lk"><li>' + esc(t(lang, 'ph_m1')) + '</li><li>' + esc(t(lang, 'ph_m2')) + '</li><li>' + esc(t(lang, 'ph_m3')) + ' <a href="/prices/">' + esc(t(lang, 'ph_reg')) + '</a></li></ul>' +
    '<p class="lim"><a href="/data/price-history.json">' + esc(t(lang, 'ph_data')) + '</a> · ' + esc(N.fd(upd, lang)) + ' · CC BY 4.0</p>';
  if (!mkS) {
    const rows = list.map(e => '<tr><td><a href="' + P + '/prices/history/' + e.s + '/">' + esc(mkName(e.mk, lang)) + '</a></td><td class="k-n">' + num(e.L.length, lang) + '</td><td class="k-n">' + (e.med == null ? '-' : pctS(e.med, lang)) + '</td><td class="k-n">' + num(e.copies, lang) + '</td></tr>').join('');
    const body = '<p>' + esc(t(lang, 'ph_leadi', { k: PH_MIN })) + '</p><div class="k-table-wrap"><table><thead><tr><th scope="col">' + esc(t(lang, 'ph_mk')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'ph_np')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'ph_mc')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'ph_th')[4]) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' + meth;
    return shellPage(shell, lang, { title: t(lang, 'ph_ti'), h1: t(lang, 'ph_ti'), lead: t(lang, 'ph_di'), desc: t(lang, 'ph_di'), canon: ORIGIN + P + '/prices/history/', alt: l => ORIGIN + pre(l) + '/prices/history/', body, mod: upd, crumb: [[P + '/prices/', t(lang, 'ph_reg')]], type: 'CollectionPage',
      ld: [{ '@type': 'ItemList', itemListElement: list.slice(0, 50).map((e, i) => ({ '@type': 'ListItem', position: i + 1, name: e.mk, url: ORIGIN + P + '/prices/history/' + e.s + '/' })) }] });
  }
  const e = list.find(e => e.s === mkS); if (!e) return null;
  const mn = mkName(e.mk, lang), canon = ORIGIN + P + '/prices/history/' + e.s + '/';
  const L = e.L.slice().sort((a, b) => (b.pts[b.pts.length - 1][1] - 100) - (a.pts[a.pts.length - 1][1] - 100) || a.p.n.localeCompare(b.p.n));
  const th = t(lang, 'ph_th');
  const rows = L.map(r => { const ch = r.pts[r.pts.length - 1][1] - 100;
    return '<tr><td><a href="' + P + '/projects/' + r.p.s + '/">' + '<bdi>' + esc(r.p.n) + '</bdi></a></td><td><bdi dir="ltr">' + esc(r.first.head.p) + '</bdi><br><small class="k-muted">' + esc(fdt(r.first.d, lang)) + ' · ' + esc(r.first.src === 'ia' ? 'Internet Archive' : 'Kolaboro') + '</small></td>' +
      '<td><bdi dir="ltr">' + esc(r.last.head.p) + '</bdi><br><small class="k-muted">' + esc(fdt(r.last.d, lang)) + ' · ' + esc(r.last.src === 'ia' ? 'Internet Archive' : 'Kolaboro') + '</small></td><td class="k-n">' + pctS(ch, lang) + '</td><td class="k-n"><a href="' + P + '/projects/' + r.p.s + '/#prices">' + num(r.n, lang) + '</a></td></tr>'; }).join('');
  const body = '<p>' + esc(t(lang, 'ph_lead')) + '</p><div class="n3-kv"><div><b>' + num(e.L.length, lang) + '</b><span>' + esc(t(lang, 'ph_np')) + '</span></div><div><b>' + (e.med == null ? '-' : pctS(e.med, lang)) + '</b><span>' + esc(t(lang, 'ph_mc')) + '</span></div><div><b>' + num(e.copies, lang) + '</b><span>' + esc(th[4]) + '</span></div></div>' +
    '<p>' + esc(t(lang, 'ph_n', { n: num(e.L.length, lang), c: num(e.copies, lang), a: fdt(e.a, lang), b: fdt(e.b, lang) })) + ' ' + esc(t(lang, 'ph_med', { p: e.med == null ? '-' : pctS(e.med, lang) })) + ' ' + esc(t(lang, 'ph_up', { u: num(e.up, lang), d: num(e.down, lang), s: num(e.same, lang) })) + '</p>' +
    phChart(e, lang) + (e.x ? '<p class="lim">' + esc(t(lang, 'ph_x', { n: num(e.x, lang) })) + '</p>' : '') +
    '<div class="k-table-wrap"><table><thead><tr>' + th.map((h, i) => '<th scope="col"' + (i >= 3 ? ' class="k-n"' : '') + '>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>' + meth +
    '<p class="lim"><a href="' + P + '/prices/history/">' + esc(t(lang, 'ph_all')) + '</a> · <a href="/m/' + encodeURIComponent(String(e.mk).toLowerCase().replace(/\s+/g, '-')) + '/">' + esc(mn) + '</a> · <a href="' + P + '/map/">' + esc(t(lang, 'tpl_map')) + '</a></p>';
  return shellPage(shell, lang, { title: t(lang, 'ph_t', { m: mn }), h1: t(lang, 'ph_t', { m: mn }), lead: t(lang, 'ph_d', { m: mn }), desc: t(lang, 'ph_d', { m: mn }), canon, alt: l => ORIGIN + pre(l) + '/prices/history/' + e.s + '/', body, mod: upd,
    crumb: [[P + '/prices/', t(lang, 'ph_reg')], [P + '/prices/history/', t(lang, 'ph_ti')]],
    ld: [{ '@type': 'Dataset', name: t(lang, 'ph_t', { m: mn }), description: t(lang, 'ph_d', { m: mn }), url: canon, license: 'https://creativecommons.org/licenses/by/4.0/', creator: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, dateModified: upd, temporalCoverage: e.a + '/' + e.b, spatialCoverage: { '@type': 'Place', name: e.mk }, isBasedOn: ORIGIN + '/data/price-history.json', distribution: { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/data/price-history.json' } }] });
}

// ------------------------------------------------------------------------------------------------ item 16: the same picture on two project pages
async function imageReuse(u, env, shell, lang) {
  const ix = await N.data(env), R = await file(env, 'image-reuse.json', 1800000); if (!R) return null;
  const P = pre(lang), dom = s => { try { return new URL(s).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
  const th = t(lang, 'ir_th');
  const cell = id => { const x = ix.byId.get(id); if (!x || COI_RX.test(String(x.n) + ' ' + String(x.dv))) return null; return x; };
  const table = kind => { const L = (R.pairs || []).filter(p => p.kind === kind).map(p => [p, cell(p.a), cell(p.b)]).filter(r => r[1] && r[2]);
    if (!L.length) return '<p>' + esc(t(lang, 'ir_none')) + '</p>';
    return '<div class="k-table-wrap"><table><thead><tr>' + th.map((h, i) => '<th scope="col"' + (i >= 4 ? ' class="k-n"' : '') + '>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' +
      L.map(([p, a, b]) => { const best = p.m.reduce((m, q) => !m || q[2] + q[3] < m[2] + m[3] ? q : m, null);
        const pg = x => N.okHttp(x.url) ? '<a href="' + esc(N.fixU(x.url)) + '" rel="nofollow noopener" target="_blank"><bdi>' + esc(dom(x.url)) + '</bdi></a>' : '-';
        return '<tr><td><a href="' + P + '/projects/' + a.s + '/"><bdi>' + esc(a.n) + '</bdi></a><br><small class="k-muted"><bdi>' + esc(a.dv || '') + '</bdi></small></td><td>' + pg(a) + '</td><td><a href="' + P + '/projects/' + b.s + '/"><bdi>' + esc(b.n) + '</bdi></a><br><small class="k-muted"><bdi>' + esc(b.dv || '') + '</bdi></small></td><td>' + pg(b) + '</td>' +
          '<td class="k-n">' + num(p.m.length, lang) + '<br><small class="k-muted"><code>' + esc(best[0]) + '</code></small></td><td class="k-n">' + esc(t(lang, 'ir_bits', { f: best[2], c: best[3] })) + '</td></tr>'; }).join('') + '</tbody></table></div>'; };
  const c = R.counts || {}, cp = R.compared || {};
  const body = '<p>' + esc(t(lang, 'ir_lead', { n: num(cp.images_used || 0, lang), p: num(cp.pairs_compared || 0, lang) })) + '</p>' +
    '<div class="n3-kv"><div><b>' + num((c.by_kind || {}).cross || 0, lang) + '</b><span>' + esc(t(lang, 'ir_c')) + '</span></div><div><b>' + num((c.by_kind || {}).same_site || 0, lang) + '</b><span>' + esc(t(lang, 'ir_cs')) + '</span></div><div><b>' + num((c.by_kind || {}).same_dev || 0, lang) + '</b><span>' + esc(t(lang, 'ir_cd')) + '</span></div><div><b>' + num(cp.images_used || 0, lang) + '</b><span>' + esc(th[4]) + '</span></div></div>' +
    '<p class="lim">' + esc(t(lang, 'ir_caut')) + '</p>' +
    '<h2 id="cross">' + esc(t(lang, 'ir_c')) + '</h2>' + table('cross') + '<h2 id="same-site">' + esc(t(lang, 'ir_cs')) + '</h2>' + table('same_site') + '<h2 id="same-developer">' + esc(t(lang, 'ir_cd')) + '</h2>' + table('same_dev') +
    '<h2 id="method">' + esc(t(lang, 'ir_meth')) + '</h2><p><span lang="en">' + esc(R.method) + '</span></p><p class="lim">' + esc(t(lang, 'ir_from', { d: fdt((R.input || {}).generated || '', lang), c: fdt(R.generated, lang) })) + ' ' + esc(t(lang, 'ir_left', { n: num(cp.images_left_out_low_structure || 0, lang) })) + '</p>' +
    '<ul class="lk"><li><a href="/tools/image-check/">' + esc(t(lang, 'ir_check')) + '</a></li><li><a href="' + P + '/watch/lookalikes/">' + esc(t(lang, 'ir_dom')) + '</a></li><li><a href="/data/image-reuse.json">/data/image-reuse.json</a> (CC BY 4.0)</li><li><a href="/data/image-hashes.json">/data/image-hashes.json</a></li></ul>';
  return shellPage(shell, lang, { title: t(lang, 'ir_t'), h1: t(lang, 'ir_t'), lead: t(lang, 'ir_d'), desc: t(lang, 'ir_d'), canon: ORIGIN + P + '/watch/lookalikes/images/', alt: l => ORIGIN + pre(l) + '/watch/lookalikes/images/', body, mod: R.generated,
    crumb: [[P + '/watch/lookalikes/', t(lang, 'ir_dom')]], ld: [{ '@type': 'Dataset', name: 'Kolaboro image reuse matches', url: ORIGIN + '/data/image-reuse.json', license: 'https://creativecommons.org/licenses/by/4.0/', creator: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, dateModified: R.generated, isBasedOn: ORIGIN + '/data/image-hashes.json' }] });
}

// ------------------------------------------------------------------------------------------------ item 19: widget v2
const WSIZE = { s: { w: 360, h: 200 }, m: { w: 480, h: 320 }, l: { w: 680, h: 440 } };
async function widgetData(env) {
  const ix = await N.data(env), ot = await file(env, 'on-time.json', 1800000);
  let tr = null; try { tr = await (await import('./kbx_tr.js')).trData(env); } catch (e) { tr = null; }
  return { ix, ot, tr };
}
function lateOf(ot, x) {
  const p = ot && ot.projects && ot.projects[x.id]; if (!p || !p.first || /^done|completed/.test(p.s || '')) return null;
  const ym = s => { const m = /^(\d{4})-(\d{2})/.exec(s || ''); return m ? +m[1] * 12 + (+m[2] - 1) : null; };
  const now = ym(ot.as_of_month), f = ym(p.first); if (now == null || f == null) return null;
  return now - f;
}
function widget(D, x, lang, theme, size) {
  const c = D.ix.caseBy.get(x.id) || {}, rev = N.reviewed(c), ho = N.handoverOf(D.ix, x), lm = lateOf(D.ot, x), row = D.tr && D.tr.rows && D.tr.rows.get(x.id);
  const P = pre(lang), url = ORIGIN + P + '/projects/' + x.s + '/', place = [x.ar && x.ar !== x.mk ? x.ar : null, mkName(x.mk, lang), x.co !== x.mk ? coName(x.co, lang) : null].filter(Boolean).join(', ');
  const rows = [];
  rows.push([t(lang, 'w_ho'), ho ? esc(N.fd(ho.d, lang)) + (lm > 0 ? ' <span class="k">' + esc(t(lang, 'w_late', { m: lm })) + '</span>' : '') : esc(t(lang, 'w_np'))]);
  rows.push([t(lang, 'w_pm'), x.pn ? '<code>' + esc(x.pn) + '</code>' : (c.checks || {}).permit === 2 ? esc(t(lang, 'w_st')) : esc(t(lang, 'w_np'))]);
  if (size !== 's') { rows.push([t(lang, 'w_dv'), x.dv ? '<bdi>' + esc(x.dv) + '</bdi>' : esc(t(lang, 'w_np'))]); if (rev) rows.push([t(lang, 'w_ck'), esc(t(lang, 'w_cks', { s: c.score || 0 }))]); }
  if (size === 'l') { if (row && row.score != null) rows.push([t(lang, 'w_tr'), esc(num(row.score, lang)) + '/100']); const sha = x.sha || (c.fp || {}).sha256, sd = x.sealed || (c.fp || {}).date; if (sha && sd) rows.push([t(lang, 'w_sealed', { d: N.fd(sd, lang) }), '<code>sha256:' + esc(String(sha).slice(0, 16)) + '…</code>']); }
  const dark = ':root{--i:#EEF2F0;--m:#A9B4BD;--l:#33404C;--p:#13222E;--s:#7FC3DA;--sk:#1C2C38;--o:#FFB37A}', light = ':root{--i:#13222E;--m:#56636F;--l:#D9DFDC;--p:#fff;--s:#155C75;--sk:#E8ECEA;--o:#B83A05}';
  const css = '<style>' + (theme === 'dark' ? dark : light + (theme === 'auto' ? '@media(prefers-color-scheme:dark){' + dark + '}' : '')) + 'html,body{margin:0;background:var(--p);color:var(--i);font:' + (size === 's' ? 14 : 15) + 'px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
    '.w{padding:12px 14px;border:1px solid var(--l);border-radius:12px;box-sizing:border-box;max-width:' + WSIZE[size].w + 'px;overflow:hidden}.h{font-weight:700;font-size:' + (size === 'l' ? 18 : 16) + 'px;margin:0 0 2px}.h a{color:inherit;text-decoration:none}.s{color:var(--m);font-size:13px;margin:0 0 8px}' +
    'dl{margin:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:5px 12px}dt{color:var(--m);font-size:13px}dd{margin:0;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}code{font-size:12px}.k{display:inline-block;background:var(--sk);color:var(--o);border-radius:6px;padding:0 6px;font-size:12px}' +
    '.f{color:var(--m);font-size:12px;margin:8px 0 0;border-top:1px solid var(--l);padding-top:6px}.f a{color:var(--s);font-weight:600}@media(max-width:340px){dl{grid-template-columns:1fr}}</style>';
  const body = '<div class="w"><p class="h"><a href="' + url + '" target="_blank" rel="noopener">' + esc(x.n) + '</a></p><p class="s">' + esc(place) + '</p>' + (rev ? '' : '<p class="s">' + esc(t(lang, 'w_nr')) + '</p>') +
    '<dl>' + rows.map(r => '<dt>' + esc(r[0]) + '</dt><dd>' + r[1] + '</dd>').join('') + '</dl><p class="f">' + esc(t(lang, 'w_up', { d: N.fd(N.lastmod(D.ix, x), lang) })) + ' · <a href="' + url + '" target="_blank" rel="noopener">' + esc(t(lang, 'w_open')) + '</a> · CC BY 4.0</p></div>';
  return '<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" lang="' + lang + '" xml:lang="' + lang + '"' + (lang === 'ar' ? ' dir="rtl"' : '') + '><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="robots" content="noindex, follow"/><link rel="canonical" href="' + url + '"/><title>' + esc(x.n) + ' | Kolaboro</title>' + css + '</head><body>' + body + '</body></html>';
}
const LOADER = '(function(d){var O="https://kolaboro.com",Z={s:[360,200],m:[480,320],l:[680,440]};function go(){var L=d.querySelectorAll("[data-kolaboro-project]:not([data-kb-done])");for(var i=0;i<L.length;i++){var el=L[i],p=el.getAttribute("data-kolaboro-project")||"";el.setAttribute("data-kb-done","1");if(!/^[a-z0-9-]{1,90}$/.test(p))continue;' +
  'var th=el.getAttribute("data-theme"),z=el.getAttribute("data-size"),l=el.getAttribute("data-lang")||"en";th=/^(light|dark|auto)$/.test(th)?th:"auto";z=Z[z]?z:"m";l=/^(en|es|de|fr|nl|ru|zh|ar)$/.test(l)?l:"en";var f=d.createElement("iframe");f.src=O+"/embed/v2/"+p+"/?theme="+th+"&size="+z+(l!=="en"?"&lang="+l:"");' +
  'f.title="Kolaboro: "+p;f.loading="lazy";f.width="100%";f.height=String(Z[z][1]);f.style.cssText="border:0;display:block;width:100%;max-width:"+Z[z][0]+"px;color-scheme:normal";el.insertBefore(f,el.firstChild);}}d.readyState==="loading"?d.addEventListener("DOMContentLoaded",go):go();})(document);';
const BUILDER_JS = '(function(){var B=document.querySelector("[data-n3w]");if(!B)return;var M=JSON.parse(B.getAttribute("data-n3w")),F=B.querySelector("form"),q=F.elements.p,dl=document.getElementById("n3w-dl"),pv=B.querySelector(".n3w-pv"),c1=document.getElementById("n3w-c1"),c2=document.getElementById("n3w-c2"),IX=null,cur=M.p;' +
  'function v(n){return F.elements[n].value}function nm(){var r=IX&&IX.filter(function(x){return x[0]===cur})[0];return r?r[1]:cur}' +
  'function draw(){var th=v("th"),z=v("sz"),l=v("lg"),W={s:[360,200],m:[480,320],l:[680,440]}[z],src="https://kolaboro.com/embed/v2/"+cur+"/?theme="+th+"&size="+z+(l!=="en"?"&lang="+l:""),url="https://kolaboro.com"+(l==="en"?"":"/"+l)+"/projects/"+cur+"/",a="<a href=\\""+url+"\\">"+nm().replace(/[<>&"]/g,"")+" on Kolaboro</a>";' +
  'pv.innerHTML="";var f=document.createElement("iframe");f.src=src;f.title="Kolaboro";f.width="100%";f.height=W[1];f.style.cssText="border:0;display:block;width:100%;max-width:"+W[0]+"px";pv.appendChild(f);' +
  'c1.value="<iframe src=\\""+src+"\\" title=\\"Kolaboro: "+nm().replace(/[<>&"]/g,"")+"\\" width=\\"100%\\" height=\\""+W[1]+"\\" style=\\"border:0;max-width:"+W[0]+"px\\" loading=\\"lazy\\"></iframe>\\n<p>"+a+"</p>";' +
  'c2.value="<div data-kolaboro-project=\\""+cur+"\\" data-theme=\\""+th+"\\" data-size=\\""+z+"\\""+(l!=="en"?" data-lang=\\""+l+"\\"":"")+">"+a+"</div>\\n<script src=\\"https://kolaboro.com/embed/v2.js\\" async><\\/script>";' +
  'try{var u=new URL(location.href);u.searchParams.set("p",cur);["th","sz","lg"].forEach(function(k){u.searchParams.set(k,v(k))});history.replaceState(null,"",u.pathname+u.search)}catch(e){}}' +
  'function load(){if(IX)return;fetch("/api/v1/search-index").then(function(r){return r.json()}).then(function(j){IX=j.p||[];draw()}).catch(function(){})}' +
  'q.addEventListener("focus",load,{once:true});q.addEventListener("input",function(){load();var s=q.value.toLowerCase().trim();if(!IX||s.length<2)return;dl.innerHTML="";IX.filter(function(x){return (x[1]+" "+x[3]+" "+x[5]).toLowerCase().indexOf(s)>=0}).slice(0,12).forEach(function(x){var o=document.createElement("option");o.value=x[1];o.label=x[5]+" · "+x[3];dl.appendChild(o)});' +
  'var hit=IX.filter(function(x){return x[1].toLowerCase()===s||x[0]===s})[0];if(hit){cur=hit[0];draw()}});F.addEventListener("change",function(e){if(e.target!==q)draw()});F.addEventListener("submit",function(e){e.preventDefault()});' +
  'B.querySelectorAll("[data-cp]").forEach(function(b){b.addEventListener("click",function(){var ta=document.getElementById(b.getAttribute("data-cp"));ta.select();try{navigator.clipboard.writeText(ta.value)}catch(e){document.execCommand&&document.execCommand("copy")}b.textContent=M.ok;setTimeout(function(){b.textContent=M.cp},1600)})});draw()})();';
async function widgetBuilder(u, env, shell, lang) {
  const ix = await N.data(env), P = pre(lang);
  let p = String(u.searchParams.get('p') || '').toLowerCase(); let x = ix.bySlug.get(p);
  if (!x || COI_RX.test(String(x.n) + ' ' + String(x.dv))) { x = ix.bySlug.get('emaar-golf-vale') || ix.P[0]; p = x.s; }
  const opt = (n, L, sel) => '<select id="n3w-' + n + '" name="' + n + '">' + L.map(([v, l]) => '<option value="' + v + '"' + (v === sel ? ' selected' : '') + '>' + esc(l) + '</option>').join('') + '</select>';
  const th = /^(light|dark|auto)$/.test(u.searchParams.get('th')) ? u.searchParams.get('th') : 'auto', sz = /^[sml]$/.test(u.searchParams.get('sz')) ? u.searchParams.get('sz') : 'm', lg = LANGS.includes(u.searchParams.get('lg')) ? u.searchParams.get('lg') : lang;
  const LN = { en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch', nl: 'Nederlands', ru: 'Русский', zh: '中文', ar: 'العربية' };
  const body = '<div class="n3w" data-n3w="' + esc(JSON.stringify({ p, cp: t(lang, 'w_cp'), ok: t(lang, 'w_ok') })) + '"><form class="n3w-f">' +
    '<label for="n3w-p"><span>' + esc(t(lang, 'w_p')) + '</span><input id="n3w-p" name="p" list="n3w-dl" autocomplete="off" value="' + esc(x.n) + '" placeholder="' + esc(t(lang, 'w_ph')) + '"></label><datalist id="n3w-dl"></datalist>' +
    '<label for="n3w-th"><span>' + esc(t(lang, 'w_th')) + '</span>' + opt('th', [['auto', t(lang, 'w_auto')], ['light', t(lang, 'w_light')], ['dark', t(lang, 'w_dark')]], th) + '</label>' +
    '<label for="n3w-sz"><span>' + esc(t(lang, 'w_sz')) + '</span>' + opt('sz', [['s', t(lang, 'w_s') + ' (360 × 200)'], ['m', t(lang, 'w_m') + ' (480 × 320)'], ['l', t(lang, 'w_l') + ' (680 × 440)']], sz) + '</label>' +
    '<label for="n3w-lg"><span>' + esc(t(lang, 'w_lg')) + '</span>' + opt('lg', LANGS.map(l => [l, LN[l]]), lg) + '</label></form>' +
    '<h2>' + esc(t(lang, 'w_pv')) + '</h2><div class="n3w-pv"><iframe src="/embed/v2/' + x.s + '/?theme=' + th + '&amp;size=' + sz + (lg !== 'en' ? '&amp;lang=' + lg : '') + '" title="Kolaboro" width="100%" height="' + WSIZE[sz].h + '" style="border:0;display:block;max-width:' + WSIZE[sz].w + 'px"></iframe></div>' +
    '<h2>' + esc(t(lang, 'w_c1')) + '</h2><textarea id="n3w-c1" aria-label="' + esc(t(lang, 'w_c1')) + '" rows="5" readonly spellcheck="false"></textarea><button type="button" class="n3w-b" data-cp="n3w-c1">' + esc(t(lang, 'w_cp')) + '</button>' +
    '<h2>' + esc(t(lang, 'w_c2')) + '</h2><textarea id="n3w-c2" aria-label="' + esc(t(lang, 'w_c2')) + '" rows="4" readonly spellcheck="false"></textarea><button type="button" class="n3w-b" data-cp="n3w-c2">' + esc(t(lang, 'w_cp')) + '</button>' +
    '<p class="lim">' + esc(t(lang, 'w_lic')) + '</p><ul class="lk"><li><a href="/embed/widgets/">' + esc(t(lang, 'w_more')) + '</a></li><li><a href="/embed/p/' + x.s + '/">/embed/p/' + x.s + '/</a></li></ul></div>' +
    '<style>.n3w-f{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px 14px;margin:18px 0}.n3w-f label{display:flex;flex-direction:column;gap:4px;font-weight:600;font-size:.88rem;min-width:0}.n3w-f input,.n3w-f select{min-height:44px;border:1.5px solid var(--line,#d5d3cc);border-radius:10px;padding:0 10px;background:var(--paper,#fff);color:inherit;font:inherit;font-weight:500;min-width:0;width:100%;box-sizing:border-box}' +
    '.n3w textarea{width:100%;box-sizing:border-box;font:13px/1.45 ui-monospace,Menlo,Consolas,monospace;border:1px solid var(--line,#d5d3cc);border-radius:10px;padding:10px;background:var(--paper,#fff);color:inherit}.n3w-b{min-height:44px;padding:0 16px;margin:6px 0 0;border:1.5px solid var(--ink,#17212B);border-radius:10px;background:none;color:inherit;font:inherit;font-weight:600;cursor:pointer}.n3w-pv{padding:12px;border:1px dashed var(--line,#d5d3cc);border-radius:12px}</style>' +
    '<script>' + BUILDER_JS + '</script>';
  return shellPage(shell, lang, { title: t(lang, 'w_t'), h1: t(lang, 'w_t'), lead: t(lang, 'w_lead'), desc: t(lang, 'w_d'), canon: ORIGIN + P + '/tools/widget/', alt: l => ORIGIN + pre(l) + '/tools/widget/', body, crumb: [['/tools/', t(lang, 'cr_tools')]] });
}

// ------------------------------------------------------------------------------------------------ item 20: engineering status
const TEMPLATES = [['tpl_home', '/'], ['tpl_hub', '/projects/'], ['tpl_proj', '/projects/emaar-golf-vale/'], ['tpl_dev', '/developers/emaar-properties/'], ['tpl_mk', '/m/dubai/'], ['tpl_rank', '/rankings/transparency/'], ['tpl_map', '/map/']];
async function measure(ctx) {
  const ck = new Request(ORIGIN + '/__n30c_weight/v1');
  try { const hit = await caches.default.match(ck); if (hit) return await hit.json(); } catch (e) {}
  const H = { 'user-agent': 'kolaboro-status-probe/1.0', accept: 'text/html' }, js = new Map();
  const pages = await Promise.all(TEMPLATES.map(async ([k, p]) => {
    const t0 = Date.now(); let r; try { r = await fetch(ORIGIN + p, { headers: H }); } catch (e) { return { k, p, ok: false }; }
    const html = await r.text(), ms = Date.now() - t0;
    const S = [...html.matchAll(/<script\b[^>]*\bsrc="(\/[^"]+)"/g)].map(m => m[1]).filter(s => !/^\/\//.test(s));
    return { k, p, ok: r.ok, status: r.status, ms, html: new TextEncoder().encode(html).length, scripts: S };
  }));
  for (const pg of pages) for (const s of pg.scripts || []) if (!js.has(s)) js.set(s, null);
  await Promise.all([...js.keys()].slice(0, 30).map(async s => { try { const r = await fetch(ORIGIN + s, { headers: { 'user-agent': 'kolaboro-status-probe/1.0' } }); if (r.ok) js.set(s, (await r.arrayBuffer()).byteLength); } catch (e) {} }));
  const out = { at: new Date().toISOString(), pages: pages.map(pg => Object.assign({}, pg, { js: (pg.scripts || []).reduce((a, s) => a + (js.get(s) || 0), 0), n: (pg.scripts || []).length, scripts: undefined })) };
  try { ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify(out), { headers: { 'content-type': 'application/json', 'cache-control': 'max-age=3600' } }))); } catch (e) {}
  return out;
}
async function engStatus(u, env, ctx, shell, lang) {
  const P = pre(lang), K = await import('./kolaboro.js');
  const sj = async p => { try { const r = await fetch(ORIGIN + p, { headers: { 'user-agent': 'kolaboro-status-probe/1.0' } }); return r.ok ? await r.json() : null; } catch (e) { return null; } };
  const [up, sw, dep, bld, wt] = await Promise.all([K.rpc('kolaboro_uptime_public', {}).then(d => d && !d.error ? d : null).catch(() => null), sj('/api/x/status/pages'), file(env, 'deploys.json', 300000), file(env, 'builds.json', 300000), measure(ctx).catch(() => null)]);
  const na = '<p class="lim">' + esc(t(lang, 'es_na')) + '</p>', ms = v => v == null ? '-' : num(Math.round(v), lang) + ' ms';
  let b = '<div class="n3-kv">';
  if (up) b += '<div><b>' + num(up.uptime_7d, lang, 3) + '%</b><span>' + esc(t(lang, 'es_up')) + ' (7d)</span></div>';
  const swMs = sw && (sw.pages || []).filter(p => p.ms != null).map(p => p.ms);
  if (up && up.median_ms_7d != null) b += '<div><b>' + ms(up.median_ms_7d) + '</b><span>p50 · ' + esc(t(lang, 'es_k50')) + '</span></div><div><b>' + ms(up.p95_ms_7d) + '</b><span>p95 · ' + esc(t(lang, 'es_k95')) + '</span></div>';
  const D30 = dep && (dep.deploys || []).filter(d => d.at && Date.now() - Date.parse(d.at) < 30 * 864e5), W = D30 ? D30.filter(d => typeof d.wait_s === 'number' && d.result === 'pass').map(d => d.wait_s) : [];
  if (W.length) b += '<div><b>' + num(Math.round(quant(W, .5)), lang) + ' s</b><span>' + esc(t(lang, 'es_dep')) + ' (p50)</span></div>';
  b += '</div>';
  // 1. uptime
  b += '<h2 id="uptime">' + esc(t(lang, 'es_up')) + '</h2>';
  if (up) {
    const n7 = Object.values(up.by_vantage || {}).reduce((a, v) => a + (v.probes_7d || 0), 0), inc = up.incidents || [];
    b += '<p>' + esc(t(lang, 'es_up1', { u: num(up.uptime_7d, lang, 3), n: num(n7, lang), u30: num(up.uptime_30d, lang, 3), md: num(Math.round(up.median_ms_7d || 0), lang), p95: num(Math.round(up.p95_ms_7d || 0), lang) })) + '</p>' +
      '<div class="k-table-wrap"><table><thead><tr><th scope="col">' + esc(t(lang, 'es_vt')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'es_pr')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'es_ut')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'es_md')) + '</th></tr></thead><tbody>' +
      Object.entries(up.by_vantage || {}).map(([k, v]) => '<tr><td><span>' + esc(k === 'database' ? t(lang, 'es_vdb') : k === 'github' ? t(lang, 'es_vgh') : k) + '</span></td><td class="k-n">' + num(v.probes_7d || 0, lang) + '</td><td class="k-n">' + num(v.uptime_7d, lang, 3) + '%</td><td class="k-n">' + ms(v.median_ms_7d) + '</td></tr>').join('') + '</tbody></table></div>' +
      '<p class="lim">' + esc(t(lang, 'es_inc', { n: num(inc.length, lang), l: inc[0] ? ftime(inc[0].at, lang) + ' (' + inc[0].target + ', HTTP ' + inc[0].status + ')' : '-' })) + ' <a href="/api/open/uptime">/api/open/uptime</a></p>';
  } else b += na;
  // 2. latency at the edge
  b += '<h2 id="latency">' + esc(t(lang, 'es_lat')) + '</h2>';
  if (sw && sw.pages) {
    b += '<p>' + esc(t(lang, 'es_lat1', { t: ftime(sw.at, lang), c: sw.commit || '-', up: num(sw.up || 0, lang), n: num(sw.n || 0, lang), p50: num(Math.round(quant(swMs, .5) || 0), lang), p95: num(Math.round(quant(swMs, .95) || 0), lang) })) + '</p>' +
      '<div class="k-table-wrap"><table><thead><tr><th scope="col">' + esc(t(lang, 'es_pg')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'es_hs')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'es_ms')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'es_kb')) + '</th></tr></thead><tbody>' +
      sw.pages.map(p => '<tr><td><a href="' + esc(p.p) + '"><code>' + esc(p.p) + '</code></a></td><td class="k-n">' + esc(p.status) + '</td><td class="k-n">' + ms(p.ms) + '</td><td class="k-n">' + kb(p.bytes) + '</td></tr>').join('') + '</tbody></table></div>' +
      '<p class="lim"><a href="/api/x/status/pages">/api/x/status/pages</a> · p50 / p95: linear interpolation (type 7), n = ' + swMs.length + '</p>';
  } else b += na;
  // 3. deploy and build times
  b += '<h2 id="deploys">' + esc(t(lang, 'es_dep')) + '</h2>';
  if (dep && dep.deploys) {
    const A = dep.deploys, ok = A.filter(d => d.result === 'pass').length, rb = A.filter(d => d.result === 'rolled_back').length, Wa = A.filter(d => typeof d.wait_s === 'number' && d.result === 'pass').map(d => d.wait_s), first = A.reduce((m, d) => !m || d.at < m ? d.at : m, null);
    b += '<p>' + esc(t(lang, 'es_dep1', { n: num(A.length, lang), s: fdt(first, lang), ok: num(ok, lang), rb: num(rb, lang), p50: num(Math.round(quant(Wa, .5) || 0), lang), p95: num(Math.round(quant(Wa, .95) || 0), lang) })) + ' <a href="/data/deploys.json">/data/deploys.json</a></p>';
  } else b += na;
  if (bld && bld.builds && bld.builds.length) {
    const L = bld.builds.slice().sort((a, c) => String(c.built_at).localeCompare(String(a.built_at))), x = L[0];
    b += '<p>' + esc(t(lang, 'es_bld', { b: (x.bytes / 1048576).toFixed(1) + ' MB', d: fdt(x.built_at, lang), r: t(lang, x.reproduced ? 'es_rep' : 'es_nrep'), k: num(L.length, lang) })) + ' <a href="/data/builds.json">/data/builds.json</a></p>';
  }
  // 4. bytes per template
  b += '<h2 id="weight">' + esc(t(lang, 'es_w')) + '</h2>';
  if (wt && wt.pages) {
    b += '<p>' + esc(t(lang, 'es_w1')) + ' ' + esc(t(lang, 'es_at', { t: ftime(wt.at, lang) })) + '</p><div class="k-table-wrap"><table><thead><tr><th scope="col">' + esc(t(lang, 'es_tp')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'es_html')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'es_js')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'es_n')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'es_tot')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'es_ms')) + '</th></tr></thead><tbody>' +
      wt.pages.map(p => '<tr><td><a href="' + esc(p.p) + '">' + esc(t(lang, p.k)) + '</a></td><td class="k-n">' + kb(p.html) + '</td><td class="k-n">' + kb(p.js) + '</td><td class="k-n">' + num(p.n || 0, lang) + '</td><td class="k-n">' + kb((p.html || 0) + (p.js || 0)) + '</td><td class="k-n">' + ms(p.ms) + '</td></tr>').join('') + '</tbody></table></div>';
  } else b += na;
  try { b += await (await import('./kbx_n34c.js')).statusBlock(env, lang); } catch (e) {}   // n34c (batch 34): API usage per endpoint and 30-day synthetic monitoring
  b += '<p class="lim">' + esc(t(lang, 'es_more')) + '</p><ul class="lk"><li><a href="/status/">/status/</a></li><li><a href="/engineering/reliability/">/engineering/reliability/</a></li><li><a href="/engineering/speed/">/engineering/speed/</a></li><li><a href="/engineering/page-weight/">/engineering/page-weight/</a></li><li><a href="/data/lighthouse.json">/data/lighthouse.json</a></li></ul>';
  const r = await shellPage(shell, lang, { title: t(lang, 'es_t'), h1: t(lang, 'es_t'), lead: t(lang, 'es_lead'), desc: t(lang, 'es_d'), canon: ORIGIN + P + '/engineering/status/', alt: l => ORIGIN + pre(l) + '/engineering/status/', body: b, crumb: [['/engineering/', t(lang, 'cr_eng')]] });
  if (r) { const h = new Headers(r.headers); h.set('cache-control', 'public, max-age=120'); return new Response(r.body, { status: 200, headers: h }); }
  return r;
}

// ------------------------------------------------------------------------------------------------ item 15: map client (only /map/ loads it)
function mapClient() {
  var MP = document.querySelector('[data-u27x]'); if (!MP) return;
  var M = JSON.parse(MP.getAttribute('data-u27x')), S = M.s, LG = (document.documentElement.lang || 'en').slice(0, 2), PRE = LG === 'en' ? '' : '/' + LG;
  var f = function (k, v) { var s = S[k] || k; return v ? s.replace(/\{(\w+)\}/g, function (m, x) { return v[x] != null ? v[x] : m; }) : s; };
  var nf = function (n) { try { return Number(n).toLocaleString(LG === 'zh' ? 'zh-CN' : LG, { numberingSystem: 'latn' }); } catch (e) { return String(n); } };
  var el = function (t, c, x) { var e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  var esc2 = function (s) { var x = document.createElement('i'); x.textContent = s; return x.innerHTML; };
  var mapEl = MP.querySelector('.kmp-m'), listEl = MP.querySelector('.kmp-l'), cnt = MP.querySelector('.kmp-n'), fm = MP.querySelector('form'), leg = MP.querySelector('.kmp-leg'), data = null, map = null, layer = null, heat = null, lim = 60, Lf = null, fit = true;
  var KEYS = ['co', 'yr', 'pm', 'sc', 'dl', 'hm'];
  var q = function (n) { var e = fm.elements[n]; return !e ? '' : e.type === 'checkbox' ? (e.checked ? '1' : '') : e.value; };
  var params = new URLSearchParams(location.search); KEYS.forEach(function (k) { var e = fm.elements[k], v = params.get(k); if (!e || !v) return; if (e.type === 'checkbox') e.checked = v === '1'; else e.value = v; });
  var col = function (m) { return m >= 12 ? '#C2341B' : m >= 6 ? '#E8772E' : '#F2B544'; };
  var pass = function (p) { var co = q('co'), yr = q('yr'), pm = q('pm'), sc = q('sc'), dl = q('dl');
    return (!co || p[3] === co) && (!yr || (yr === '0' ? !p[6] : String(p[6]) === yr)) && (!pm || String(p[7]) === pm) && (!sc || (p[8] != null && p[8] >= +sc)) && (!dl || (p[9] != null && p[9] >= +dl)); };
  var R = [], pins = [], byMk = {};
  var cluster = function () {   // grid clustering in screen space: pins closer than about 48 px share one marker
    if (!map || !Lf) return; if (layer) layer.remove(); layer = Lf.layerGroup().addTo(map);
    var z = map.getZoom(), cells = {}, G = 48;
    pins.forEach(function (p) { var pt = map.project([p[4], p[5]], z), k = Math.floor(pt.x / G) + ':' + Math.floor(pt.y / G); (cells[k] = cells[k] || []).push(p); });
    Object.keys(cells).forEach(function (k) { var L = cells[k];
      if (L.length === 1 || z >= 15) { L.forEach(function (p) { var m = Lf.circleMarker([p[4], p[5]], { radius: 6, weight: 1.5, color: '#fff', fillColor: p[9] > 0 ? col(p[9]) : '#155C75', fillOpacity: .92 });
        m.bindPopup('<b>' + esc2(p[1]) + '</b><br>' + esc2(p[2]) + (p[6] ? ' · ' + p[6] : '') + (p[9] > 0 ? '<br>' + esc2(f('mh_late', { m: p[9] })) : '') + '<br><a href="' + PRE + '/projects/' + p[0] + '/">' + esc2(f('mpo')) + '</a>'); m.addTo(layer); }); return; }
      var la = 0, ln = 0, lt = L.filter(function (p) { return p[9] > 0; }).length; L.forEach(function (p) { la += p[4]; ln += p[5]; }); la /= L.length; ln /= L.length;
      var sz = Math.min(54, 26 + Math.sqrt(L.length) * 4), ic = Lf.divIcon({ className: 'kmp-cl', html: '<span style="width:' + sz + 'px;height:' + sz + 'px;line-height:' + sz + 'px' + (lt ? ';box-shadow:0 0 0 4px ' + col(12) + '55' : '') + '">' + nf(L.length) + '</span>', iconSize: [sz, sz] });
      var m = Lf.marker([la, ln], { icon: ic, keyboard: true, title: f('mh_cl', { k: L.length }) });
      m.on('click', function () { var B = Lf.latLngBounds(L.map(function (p) { return [p[4], p[5]]; })); map.fitBounds(B, { padding: [40, 40], maxZoom: Math.min(18, z + 4) }); }); m.addTo(layer); });
    Object.keys(byMk).forEach(function (k) { var c = data.mk[k], L2 = byMk[k], m = Lf.circleMarker([c[0], c[1]], { radius: Math.min(26, 7 + Math.sqrt(L2.length) * 2.4), weight: 1, color: '#B26A00', fillColor: '#F2B544', fillOpacity: .4, dashArray: '3' });
      m.bindPopup('<b>' + esc2(f('mpa', { k: L2.length, m: k })) + '</b><br>' + L2.slice(0, 12).map(function (p) { return '<a href="' + PRE + '/projects/' + p[0] + '/">' + esc2(p[1]) + '</a>' + (p[9] > 0 ? ' (' + p[9] + ')' : ''); }).join('<br>') + (L2.length > 12 ? '<br>…' : '')); m.addTo(layer); });
  };
  var drawHeat = function () {   // delay heat: one soft disc per project past its first handover date on record, colour by months past
    if (!map || !Lf) return; if (heat) { heat.remove(); heat = null; } if (leg) leg.hidden = q('hm') !== '1'; if (q('hm') !== '1') return;
    heat = Lf.layerGroup(); var rd = Lf.canvas ? Lf.canvas({ padding: .3 }) : undefined;
    R.forEach(function (p) { if (!(p[9] > 0)) return; var ll = p[4] != null ? [p[4], p[5]] : data.mk[p[2]]; if (!ll) return;
      Lf.circleMarker(ll, { renderer: rd, radius: 18 + Math.min(18, p[9]), stroke: false, fillColor: col(p[9]), fillOpacity: .22, interactive: false }).addTo(heat);
      Lf.circleMarker(ll, { renderer: rd, radius: 7, stroke: false, fillColor: col(p[9]), fillOpacity: .35, interactive: false }).addTo(heat); });
    heat.addTo(map); if (heat.bringToBack) heat.eachLayer(function (l) { l.bringToBack && l.bringToBack(); });
  };
  var draw = function () {
    if (!data) return; R = data.p.filter(pass); pins = R.filter(function (p) { return p[4] != null; }); byMk = {};
    R.forEach(function (p) { if (p[4] == null && data.mk[p[2]]) { (byMk[p[2]] = byMk[p[2]] || []).push(p); } });
    cnt.textContent = f('mpk', { k: nf(R.length) }); e0.hidden = R.length > 0; rs.hidden = !KEYS.some(function (k) { return q(k); });
    var h = ''; R.slice(0, lim).forEach(function (p) { h += '<li><a href="' + PRE + '/projects/' + p[0] + '/">' + esc2(p[1]) + '</a> <small>' + esc2([p[2], p[3]].filter(function (v, i, a) { return v && a.indexOf(v) === i; }).join(', ')) + (p[6] ? ' · ' + p[6] : '') + (p[8] != null ? ' · ' + p[8] + '/100' : '') + (p[9] > 0 ? ' · ' + esc2(f('mh_late', { m: p[9] })) : '') + '</small></li>'; });
    listEl.innerHTML = h; var more = MP.querySelector('.kmp-more'); if (more) more.hidden = R.length <= lim;
    var u = new URL(location.href); KEYS.forEach(function (k) { if (q(k)) u.searchParams.set(k, q(k)); else u.searchParams.delete(k); }); try { history.replaceState(null, '', u.pathname + u.search); } catch (e) {}
    if (!map || !Lf) return; cluster(); drawHeat();
    if (fit) { var B = pins.map(function (p) { return [p[4], p[5]]; }).concat(Object.keys(byMk).map(function (k) { return data.mk[k]; })); if (B.length) map.fitBounds(B, { padding: [24, 24], maxZoom: 12, animate: !mapEl.classList.contains('kmp-ld') }); fit = false; }
    if (mapEl.classList.contains('kmp-ld')) setTimeout(function () { mapEl.classList.remove('kmp-ld'); }, 60);   // n32s: shown once in place (no layout shift)
  };
  var rs = el('button', 'kmp-r', f('mpr')); rs.type = 'button'; rs.hidden = true; fm.appendChild(rs);
  var e0 = el('p', 'kmp-0'); e0.hidden = true; e0.setAttribute('role', 'status'); e0.appendChild(document.createTextNode(f('mp0') + ' ')); var e0b = el('button', 'kmp-r', f('mpr')); e0b.type = 'button'; e0.appendChild(e0b); listEl.parentNode.insertBefore(e0, listEl);
  var reset = function () { KEYS.forEach(function (k) { var e = fm.elements[k]; if (!e) return; if (e.type === 'checkbox') e.checked = false; else e.value = ''; }); lim = 60; fit = true; draw(); };
  rs.addEventListener('click', reset); e0b.addEventListener('click', function () { reset(); fm.elements.co && fm.elements.co.focus(); });
  fetch('/api/v1/map?lang=' + LG + '&v=2').then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) { data = j; var sc2 = fm.elements.co; if (sc2 && sc2.options.length < 3) { j.co.forEach(function (c) { var o = el('option', null, c[1] + ' (' + c[2] + ')'); o.value = c[0]; sc2.appendChild(o); }); if (params.get('co')) sc2.value = params.get('co'); }
    var yy = fm.elements.yr; if (yy && yy.options.length < 3) { j.yr.forEach(function (y) { var o = el('option', null, y); o.value = y; yy.insertBefore(o, yy.lastElementChild); }); if (params.get('yr')) yy.value = params.get('yr'); }
    if (leg && j.delay) leg.querySelector('.kmp-legt').textContent = f('mh_leg', { n: nf(j.delay.n), d: j.delay.as_of }); draw(); }).catch(function () { cnt.textContent = f('mpe'); if (!map) mapEl.textContent = f('mpe'); });
  fm.addEventListener('change', function () { lim = 60; fit = true; draw(); }); fm.addEventListener('submit', function (e) { e.preventDefault(); });
  var mb = MP.querySelector('.kmp-more'); if (mb) mb.addEventListener('click', function () { lim += 120; draw(); });
  var boot = function () { if (map || booted) return; booted = true; var cs = el('link'); cs.rel = 'stylesheet'; cs.href = M.css; document.head.appendChild(cs); var hs = el('style'); hs.textContent = '.kmp-ld .leaflet-pane,.kmp-ld .leaflet-control-container{visibility:hidden}'; document.head.appendChild(hs); var s = el('script'); s.src = M.js; s.onload = function () { Lf = window.L; mapEl.textContent = ''; mapEl.classList.add('kmp-ld'); setTimeout(function () { mapEl.classList.remove('kmp-ld'); }, 4000); map = Lf.map(mapEl, { scrollWheelZoom: false, worldCopyJump: true, minZoom: innerWidth < 700 ? 1 : 2, preferCanvas: false }).setView([20, 20], 2);
    Lf.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map); map.on('zoomend', function () { cluster(); }); draw(); }; s.onerror = function () { mapEl.textContent = f('mpe'); }; document.head.appendChild(s); };
  // n32s (item 259): the map library (Leaflet, about 1.2 s of main-thread work on a phone) starts after the reader's first touch, scroll,
  // key or mouse move (window.kbLate, 8 s after load at the latest), or at once on a tap on the map; the list works before that
  var booted = false, late = function () { (window.kbLate || function (f) { f(); })(boot); };
  mapEl.addEventListener('pointerdown', boot, { once: true });
  if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { io.disconnect(); late(); } }, { rootMargin: '300px' }); io.observe(mapEl); } else late();
}
const MAP_JS = '(' + mapClient.toString() + ')();';
// strings the map page passes to the client (kbx_u27.js mapPage)
export const mapStrings = lang => { const o = {}; ['mh_cl', 'mh_late', 'mh_leg', 'mpk', 'mpa', 'mpo', 'mpe', 'mpr', 'mp0'].forEach(k => { o[k] = t(lang, k); }); return o; };
export { t as t30 };

// ------------------------------------------------------------------------------------------------ routes
export async function handle(req, u, env, ctx, shell) {
  const p = u.pathname;
  if (p === '/k/n30c-map.js') return new Response(MAP_JS, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': u.searchParams.get('v') === N30C_V ? 'public, max-age=31536000, immutable' : 'public, max-age=300', 'x-content-type-options': 'nosniff' } });
  if (p === '/embed/v2.js') return new Response(LOADER, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=3600', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' } });
  let m = /^\/api\/v1\/pin\/([A-Za-z0-9-]{3,20})$/.exec(p);
  if (m) {
    const ix = await N.data(env), x = ix.byId.get(m[1].toUpperCase()) || ix.bySlug.get(m[1].toLowerCase()); if (!x) return jr({ error: 'unknown project id' }, 404);
    const L = await import('./kbx_land.js'), ld = await L.landData(env), r = pinRecord(ld, x);
    return jr(Object.assign({ about: 'Pin check of one named project: what open layers say at the project pin (about 100 m accurate). Readings of global models and volunteer maps, not a verdict on the land; the land office gives the binding answer. Coordinates are not published.', project: ORIGIN + '/projects/' + x.s + '/' }, r || { id: x.id, note: 'no pin check for this project yet (no plot-level pin, or not in the last run)' }), 200, 'public, max-age=3600');
  }
  m = /^\/embed\/v2\/([a-z0-9-]{1,90})\/?$/.exec(p);
  if (m) {
    if (!p.endsWith('/')) return Response.redirect(ORIGIN + p + '/' + u.search, 301);
    const D = await widgetData(env), x = D.ix.bySlug.get(m[1]);
    if (!x || COI_RX.test(String(x.n) + ' ' + String(x.dv))) return new Response('not found', { status: 404, headers: { 'content-type': 'text/plain' } });
    const lang = LANGS.includes(u.searchParams.get('lang')) ? u.searchParams.get('lang') : 'en', th = /^(light|dark|auto)$/.test(u.searchParams.get('theme')) ? u.searchParams.get('theme') : 'auto', sz = /^[sml]$/.test(u.searchParams.get('size')) ? u.searchParams.get('size') : 'm';
    return new Response(widget(D, x, lang, th, sz), { headers: { 'content-type': 'application/xhtml+xml; charset=utf-8', 'cache-control': 'public, max-age=900', 'content-security-policy': "frame-ancestors *; default-src 'none'; style-src 'unsafe-inline'", 'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin' } });
  }
  m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(prices\/history(?:\/([a-z0-9-]{2,60}))?|watch\/lookalikes\/images|tools\/widget|engineering\/status)\/?$/.exec(p);
  if (!m) return null;
  if (!p.endsWith('/')) return Response.redirect(ORIGIN + p + '/' + u.search, 301);
  const lang = m[1] || 'en', what = m[2];
  try {
    if (/^prices\/history/.test(what)) return await priceHistory(u, env, shell, lang, m[3] || null);
    if (what === 'watch/lookalikes/images') return await imageReuse(u, env, shell, lang);
    if (what === 'tools/widget') return await widgetBuilder(u, env, shell, lang);
    if (what === 'engineering/status') return await engStatus(u, env, ctx, shell, lang);
  } catch (e) { return null; }
  return null;
}
export { slugMk };
