// comments: _notes/kolaboro-worker-comments.txt
import * as N from './kbx_named.js';
import { S, t, esc, num, LANGS, slugMk, pinRecord, phMarkets, PH_MIN } from './kbx_n30c_named.js';
import { mkName, coName } from './kbx_hdate.js';
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const COI_RX = /eco\s*beach\s*city|\bequinox\b/i;
const pre = l => l === 'en' ? '' : '/' + l;
export const N30C_V = 'n32s1';
export const PATHS = /^\/k\/n30c-map\.js$|^\/api\/v1\/pin\/[A-Za-z0-9-]{3,20}$|^\/embed\/v2(?:\.js|\/[a-z0-9-]{1,90}\/?)$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:prices\/history(?:\/[a-z0-9-]{2,60})?|watch\/lookalikes\/images|tools\/widget|engineering\/status)\/?$/;
const jr = (o, s, cc) => new Response(JSON.stringify(o), { status: s || 200, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': cc || 'public, max-age=600' } });
const MEMO = {};
async function file(env, name, ttl) {
  const m = MEMO[name]; if (m && Date.now() - m.t < (ttl || 600000)) return m.v;
  let v = null;
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); if (r.ok) v = await r.json(); } catch (e) { v = null; }
  MEMO[name] = { t: Date.now(), v }; return v;
}
const quant = (a, q) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), i = (s.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); };
const fdt = (d, lang) => N.fd(String(d).slice(0, 10), lang);
const ftime = (d, lang) => { try { return new Date(d).toLocaleString(lang === 'en' ? 'en-GB' : lang, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', numberingSystem: 'latn' }) + ' UTC'; } catch (e) { return String(d); } };
const kb = n => n == null ? '-' : (n / 1024).toFixed(n < 10240 ? 1 : 0) + ' KB';
async function shellPage(shell, lang, o) {
const sh = await shell(pre(lang) + '/how-we-score/'); if (!sh || sh.status !== 200) return null;
const crumb = '<p class="crumb"><a href="' + pre(lang) + '/">Kolaboro</a>' + (o.crumb || []).map(([h, l]) => ' / <a href="' + h + '">' + esc(l) + '</a>').join('') + '</p>';
const body = TB.kbx_n30c__t.k0 + crumb + '<h1>' + esc(o.h1) + '</h1><p class="lead">' + esc(o.lead) + TB.kbx_n30c__t.k1 + o.body + '</div>' + TB.kbx_n30c__s.PCSS;
const pg = { title: o.title + ' | Kolaboro', desc: o.desc, canon: o.canon, body, noindex: !!o.noindex, alt: o.alt,
ld: { '@context': 'https://schema.org', '@graph': [{ '@type': o.type || 'WebPage', name: o.title, url: o.canon, inLanguage: lang, description: o.desc, dateModified: o.mod || undefined, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } }].concat(o.ld || []) } };
return new Response(await N.assemble(pg, lang, sh), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600' } });
}
const A11Y = {
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
const days = [...new Set(e.L.flatMap(r => r.pts.map(p => p[0])))].sort(), med = [];
for (const d of days) { const v = []; for (const r of e.L) { if (r.pts[0][0] > d) continue; let last = null; for (const p of r.pts) { if (p[0] <= d) last = p[1]; else break; } v.push(last); } if (v.length >= 3) med.push([d, quant(v, .5)]); }
const ml = med.length > 1 ? '<polyline class="n3-med" points="' + med.map(p => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' ') + '"/>' : '';
const A11 = A11Y[lang] || A11Y.en, sid = 'kph-s' + (e.mk ? String(e.mk).toLowerCase().replace(/[^a-z0-9]+/g, '') : 'all');
const sum = med.length > 1 ? A11.sum.replace('{n}', num(e.L.length, lang)).replace('{a}', num(med[0][1], lang, 1)).replace('{d1}', fdt(med[0][0], lang)).replace('{b}', num(med[med.length - 1][1], lang, 1)).replace('{d2}', fdt(med[med.length - 1][0], lang)) : '';
const tbl = med.length > 1 ? '<details class="kph-dt"><summary>' + esc(A11.tbl) + TB.kbx_n30c__t.k2 + esc(A11.d) + '</th><th scope="col" class="k-n">' + esc(A11.m) + '</th></tr></thead><tbody>' +
(med.length > 80 ? med.filter((p, i) => i % Math.ceil(med.length / 80) === 0 || i === med.length - 1) : med).map(p => '<tr><td>' + esc(fdt(p[0], lang)) + '</td><td class="k-n">' + num(p[1], lang, 1) + '</td></tr>').join('') + '</tbody></table></div></details>' : '';
return TB.kbx_n30c__t.k3 + W + ' ' + Hh + TB.kbx_n30c__t.k4 + esc(t(lang, 'ph_chart', { n: e.L.length })) + '"' + (sum ? ' aria-describedby="' + sid + '"' : '') + '>' + g + lines + ml + '</svg><figcaption>' + esc(t(lang, 'ph_chart', { n: num(e.L.length, lang) })) + (sum ? ' <span id="' + sid + '">' + esc(sum) + '</span>' : '') + '</figcaption></figure>' + tbl +
TB.kbx_n30c__s.k0;
}
const pctS = (v, lang) => (v > 0 ? '+' : v < 0 ? '−' : '') + num(Math.abs(v), lang, 1) + '%';
async function priceHistory(u, env, shell, lang, mkS) {
const ix = await N.data(env), ph = await file(env, 'price-history.json', 1800000); if (!ph) return null;
const M = phMarkets(ph, ix), P = pre(lang), list = [...M.values()].filter(e => e.L.length >= PH_MIN).sort((a, b) => b.L.length - a.L.length || a.mk.localeCompare(b.mk));
const upd = String(ph.updated || '').slice(0, 10);
const meth = '<h2 id="method">' + esc(t(lang, 'ph_meth')) + '</h2><ul class="lk"><li>' + esc(t(lang, 'ph_m1')) + '</li><li>' + esc(t(lang, 'ph_m2')) + '</li><li>' + esc(t(lang, 'ph_m3')) + ' <a href="/prices/">' + esc(t(lang, 'ph_reg')) + '</a></li></ul>' +
TB.kbx_n30c__t.k5 + esc(t(lang, 'ph_data')) + '</a> · ' + esc(N.fd(upd, lang)) + ' · CC BY 4.0</p>';
if (!mkS) {
const rows = list.map(e => '<tr><td><a href="' + P + '/prices/history/' + e.s + '/">' + esc(mkName(e.mk, lang)) + '</a></td><td class="k-n">' + num(e.L.length, lang) + '</td><td class="k-n">' + (e.med == null ? '-' : pctS(e.med, lang)) + '</td><td class="k-n">' + num(e.copies, lang) + '</td></tr>').join('');
const body = '<p>' + esc(t(lang, 'ph_leadi', { k: PH_MIN })) + TB.kbx_n30c__t.k6 + esc(t(lang, 'ph_mk')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'ph_np')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'ph_mc')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'ph_th')[4]) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>' + meth;
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
TB.kbx_n30c__t.k7 + th.map((h, i) => '<th scope="col"' + (i >= 3 ? ' class="k-n"' : '') + '>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>' + meth +
'<p class="lim"><a href="' + P + '/prices/history/">' + esc(t(lang, 'ph_all')) + '</a> · <a href="/m/' + encodeURIComponent(String(e.mk).toLowerCase().replace(/\s+/g, '-')) + '/">' + esc(mn) + '</a> · <a href="' + P + '/map/">' + esc(t(lang, 'tpl_map')) + '</a></p>';
return shellPage(shell, lang, { title: t(lang, 'ph_t', { m: mn }), h1: t(lang, 'ph_t', { m: mn }), lead: t(lang, 'ph_d', { m: mn }), desc: t(lang, 'ph_d', { m: mn }), canon, alt: l => ORIGIN + pre(l) + '/prices/history/' + e.s + '/', body, mod: upd,
crumb: [[P + '/prices/', t(lang, 'ph_reg')], [P + '/prices/history/', t(lang, 'ph_ti')]],
ld: [{ '@type': 'Dataset', name: t(lang, 'ph_t', { m: mn }), description: t(lang, 'ph_d', { m: mn }), url: canon, license: TB.kbx_n30c__t.k8, creator: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, dateModified: upd, temporalCoverage: e.a + '/' + e.b, spatialCoverage: { '@type': 'Place', name: e.mk }, isBasedOn: ORIGIN + '/data/price-history.json', distribution: { '@type': 'DataDownload', encodingFormat: 'application/json', contentUrl: ORIGIN + '/data/price-history.json' } }] });
}
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
TB.kbx_n30c__t.k9 + esc(t(lang, 'ir_check')) + '</a></li><li><a href="' + P + '/watch/lookalikes/">' + esc(t(lang, 'ir_dom')) + TB.kbx_n30c__s.k1;
return shellPage(shell, lang, { title: t(lang, 'ir_t'), h1: t(lang, 'ir_t'), lead: t(lang, 'ir_d'), desc: t(lang, 'ir_d'), canon: ORIGIN + P + '/watch/lookalikes/images/', alt: l => ORIGIN + pre(l) + '/watch/lookalikes/images/', body, mod: R.generated,
crumb: [[P + '/watch/lookalikes/', t(lang, 'ir_dom')]], ld: [{ '@type': 'Dataset', name: 'Kolaboro image reuse matches', url: ORIGIN + '/data/image-reuse.json', license: TB.kbx_n30c__t.k10, creator: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, dateModified: R.generated, isBasedOn: ORIGIN + '/data/image-hashes.json' }] });
}
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
const P = pre(lang), url = ORIGIN + P + '/projects/' + x.s + '/', place = [x.ar && x.ar !== x.mk ? x.ar : null, mkName(x.mk, lang), x.co !== x.mk ? coName(x.co, lang) : null].filter(Boolean).join(', ').split(', ').filter((v, i, a) => a.findIndex(w => w.toLowerCase() === v.toLowerCase()) === i).join(', ');
const rows = [];
rows.push([t(lang, 'w_ho'), ho ? esc(N.fd(ho.d, lang)) + (lm > 0 ? ' <span class="k">' + esc(t(lang, 'w_late', { m: lm })) + '</span>' : '') : esc(t(lang, 'w_np'))]);
rows.push([t(lang, 'w_pm'), x.pn ? '<code>' + esc(x.pn) + '</code>' : (c.checks || {}).permit === 2 ? esc(t(lang, 'w_st')) : esc(t(lang, 'w_np'))]);
if (size !== 's') { rows.push([t(lang, 'w_dv'), x.dv ? '<bdi>' + esc(x.dv) + '</bdi>' : esc(t(lang, 'w_np'))]); if (rev) rows.push([t(lang, 'w_ck'), esc(t(lang, 'w_cks', { s: c.score || 0 }))]); }
if (size === 'l') { if (row && row.score != null) rows.push([t(lang, 'w_tr'), esc(num(row.score, lang)) + '/100']); const sha = x.sha || (c.fp || {}).sha256, sd = x.sealed || (c.fp || {}).date; if (sha && sd) rows.push([t(lang, 'w_sealed', { d: N.fd(sd, lang) }), '<code>sha256:' + esc(String(sha).slice(0, 16)) + '…</code>']); }
const dark = TB.kbx_n30c__t.k11, light = TB.kbx_n30c__t.k12;
const css = '<style>' + (theme === 'dark' ? dark : light + (theme === 'auto' ? '@media(prefers-color-scheme:dark){' + dark + '}' : '')) + TB.kbx_n30c__t.k13 + (size === 's' ? 14 : 15) + TB.kbx_n30c__t.k14 +
TB.kbx_n30c__s.k2 + WSIZE[size].w + TB.kbx_n30c__t.k15 + (size === 'l' ? 18 : 16) + TB.kbx_n30c__s.k3 +
TB.kbx_n30c__s.k4 +
TB.kbx_n30c__s.k5;
const body = '<div class="w"><p class="h"><a href="' + url + '" target="_blank" rel="noopener">' + esc(x.n) + '</a></p><p class="s">' + esc(place) + '</p>' + (rev ? '' : '<p class="s">' + esc(t(lang, 'w_nr')) + '</p>') +
'<dl>' + rows.map(r => '<dt>' + esc(r[0]) + '</dt><dd>' + r[1] + '</dd>').join('') + '</dl><p class="f">' + esc(t(lang, 'w_up', { d: N.fd(N.lastmod(D.ix, x), lang) })) + ' · <a href="' + url + '" target="_blank" rel="noopener">' + esc(t(lang, 'w_open')) + '</a> · CC BY 4.0</p></div>';
return TB.kbx_n30c__s.k6 + lang + '" xml:lang="' + lang + '"' + (lang === 'ar' ? ' dir="rtl"' : '') + TB.kbx_n30c__s.k7 + url + '"/><title>' + esc(x.n) + ' | Kolaboro</title>' + css + '</head><body>' + body + '</body></html>';
}
async function widgetBuilder(u, env, shell, lang) {
const ix = await N.data(env), P = pre(lang);
let p = String(u.searchParams.get('p') || '').toLowerCase(); let x = ix.bySlug.get(p);
if (!x || COI_RX.test(String(x.n) + ' ' + String(x.dv))) { x = ix.bySlug.get('emaar-golf-vale') || ix.P[0]; p = x.s; }
const opt = (n, L, sel) => '<select id="n3w-' + n + '" name="' + n + '">' + L.map(([v, l]) => '<option value="' + v + '"' + (v === sel ? ' selected' : '') + '>' + esc(l) + '</option>').join('') + '</select>';
const th = /^(light|dark|auto)$/.test(u.searchParams.get('th')) ? u.searchParams.get('th') : 'auto', sz = /^[sml]$/.test(u.searchParams.get('sz')) ? u.searchParams.get('sz') : 'm', lg = LANGS.includes(u.searchParams.get('lg')) ? u.searchParams.get('lg') : lang;
const LN = { en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch', nl: 'Nederlands', ru: 'Русский', zh: '中文', ar: 'العربية' };
const body = '<div class="n3w" data-n3w="' + esc(JSON.stringify({ p, cp: t(lang, 'w_cp'), ok: t(lang, 'w_ok') })) + '"><form class="n3w-f">' +
'<label for="n3w-p"><span>' + esc(t(lang, 'w_p')) + TB.kbx_n30c__t.k16 + esc(x.n) + '" placeholder="' + esc(t(lang, 'w_ph')) + TB.kbx_n30c__t.k17 +
'<label for="n3w-th"><span>' + esc(t(lang, 'w_th')) + '</span>' + opt('th', [['auto', t(lang, 'w_auto')], ['light', t(lang, 'w_light')], ['dark', t(lang, 'w_dark')]], th) + '</label>' +
'<label for="n3w-sz"><span>' + esc(t(lang, 'w_sz')) + '</span>' + opt('sz', [['s', t(lang, 'w_s') + ' (360 × 200)'], ['m', t(lang, 'w_m') + ' (480 × 320)'], ['l', t(lang, 'w_l') + ' (680 × 440)']], sz) + '</label>' +
'<label for="n3w-lg"><span>' + esc(t(lang, 'w_lg')) + '</span>' + opt('lg', LANGS.map(l => [l, LN[l]]), lg) + '</label></form>' +
'<h2>' + esc(t(lang, 'w_pv')) + TB.kbx_n30c__t.k18 + x.s + '/?theme=' + th + '&amp;size=' + sz + (lg !== 'en' ? '&amp;lang=' + lg : '') + TB.kbx_n30c__t.k19 + WSIZE[sz].h + TB.kbx_n30c__t.k20 + WSIZE[sz].w + 'px"></iframe></div>' +
'<h2>' + esc(t(lang, 'w_c1')) + TB.kbx_n30c__t.k21 + esc(t(lang, 'w_c1')) + TB.kbx_n30c__s.k8 + esc(t(lang, 'w_cp')) + '</button>' +
'<h2>' + esc(t(lang, 'w_c2')) + TB.kbx_n30c__t.k22 + esc(t(lang, 'w_c2')) + TB.kbx_n30c__s.k9 + esc(t(lang, 'w_cp')) + '</button>' +
'<p class="lim">' + esc(t(lang, 'w_lic')) + TB.kbx_n30c__t.k23 + esc(t(lang, 'w_more')) + '</a></li><li><a href="/embed/p/' + x.s + '/">/embed/p/' + x.s + '/</a></li></ul></div>' +
TB.kbx_n30c__s.k10 +
TB.kbx_n30c__s.k11 +
'<script>' + TB.kbx_n30c__s.BUILDER_JS + '</script>';
return shellPage(shell, lang, { title: t(lang, 'w_t'), h1: t(lang, 'w_t'), lead: t(lang, 'w_lead'), desc: t(lang, 'w_d'), canon: ORIGIN + P + '/tools/widget/', alt: l => ORIGIN + pre(l) + '/tools/widget/', body, crumb: [['/tools/', t(lang, 'cr_tools')]] });
}
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
b += '<h2 id="uptime">' + esc(t(lang, 'es_up')) + '</h2>';
if (up) {
const n7 = Object.values(up.by_vantage || {}).reduce((a, v) => a + (v.probes_7d || 0), 0), inc = up.incidents || [];
b += '<p>' + esc(t(lang, 'es_up1', { u: num(up.uptime_7d, lang, 3), n: num(n7, lang), u30: num(up.uptime_30d, lang, 3), md: num(Math.round(up.median_ms_7d || 0), lang), p95: num(Math.round(up.p95_ms_7d || 0), lang) })) + '</p>' +
TB.kbx_n30c__t.k24 + esc(t(lang, 'es_vt')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'es_pr')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'es_ut')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'es_md')) + '</th></tr></thead><tbody>' +
Object.entries(up.by_vantage || {}).map(([k, v]) => '<tr><td><span>' + esc(k === 'database' ? t(lang, 'es_vdb') : k === 'github' ? t(lang, 'es_vgh') : k) + '</span></td><td class="k-n">' + num(v.probes_7d || 0, lang) + '</td><td class="k-n">' + num(v.uptime_7d, lang, 3) + '%</td><td class="k-n">' + ms(v.median_ms_7d) + '</td></tr>').join('') + '</tbody></table></div>' +
'<p class="lim">' + esc(t(lang, 'es_inc', { n: num(inc.length, lang), l: inc[0] ? ftime(inc[0].at, lang) + ' (' + inc[0].target + ', HTTP ' + inc[0].status + ')' : '-' })) + TB.kbx_n30c__t.k25;
} else b += na;
b += '<h2 id="latency">' + esc(t(lang, 'es_lat')) + '</h2>';
if (sw && sw.pages) {
b += '<p>' + esc(t(lang, 'es_lat1', { t: ftime(sw.at, lang), c: sw.commit || '-', up: num(sw.up || 0, lang), n: num(sw.n || 0, lang), p50: num(Math.round(quant(swMs, .5) || 0), lang), p95: num(Math.round(quant(swMs, .95) || 0), lang) })) + '</p>' +
TB.kbx_n30c__t.k26 + esc(t(lang, 'es_pg')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'es_hs')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'es_ms')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'es_kb')) + '</th></tr></thead><tbody>' +
sw.pages.map(p => '<tr><td><a href="' + esc(p.p) + '"><code>' + esc(p.p) + '</code></a></td><td class="k-n">' + esc(p.status) + '</td><td class="k-n">' + ms(p.ms) + '</td><td class="k-n">' + kb(p.bytes) + '</td></tr>').join('') + '</tbody></table></div>' +
TB.kbx_n30c__s.k12 + swMs.length + '</p>';
} else b += na;
b += '<h2 id="deploys">' + esc(t(lang, 'es_dep')) + '</h2>';
if (dep && dep.deploys) {
const A = dep.deploys, ok = A.filter(d => d.result === 'pass').length, rb = A.filter(d => d.result === 'rolled_back').length, Wa = A.filter(d => typeof d.wait_s === 'number' && d.result === 'pass').map(d => d.wait_s), first = A.reduce((m, d) => !m || d.at < m ? d.at : m, null);
b += '<p>' + esc(t(lang, 'es_dep1', { n: num(A.length, lang), s: fdt(first, lang), ok: num(ok, lang), rb: num(rb, lang), p50: num(Math.round(quant(Wa, .5) || 0), lang), p95: num(Math.round(quant(Wa, .95) || 0), lang) })) + TB.kbx_n30c__t.k27;
} else b += na;
if (bld && bld.builds && bld.builds.length) {
const L = bld.builds.slice().sort((a, c) => String(c.built_at).localeCompare(String(a.built_at))), x = L[0];
b += '<p>' + esc(t(lang, 'es_bld', { b: (x.bytes / 1048576).toFixed(1) + ' MB', d: fdt(x.built_at, lang), r: t(lang, x.reproduced ? 'es_rep' : 'es_nrep'), k: num(L.length, lang) })) + TB.kbx_n30c__t.k28;
}
b += '<h2 id="weight">' + esc(t(lang, 'es_w')) + '</h2>';
if (wt && wt.pages) {
b += '<p>' + esc(t(lang, 'es_w1')) + ' ' + esc(t(lang, 'es_at', { t: ftime(wt.at, lang) })) + TB.kbx_n30c__t.k29 + esc(t(lang, 'es_tp')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'es_html')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'es_js')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'es_n')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'es_tot')) + '</th><th scope="col" class="k-n">' + esc(t(lang, 'es_ms')) + '</th></tr></thead><tbody>' +
wt.pages.map(p => '<tr><td><a href="' + esc(p.p) + '">' + esc(t(lang, p.k)) + '</a></td><td class="k-n">' + kb(p.html) + '</td><td class="k-n">' + kb(p.js) + '</td><td class="k-n">' + num(p.n || 0, lang) + '</td><td class="k-n">' + kb((p.html || 0) + (p.js || 0)) + '</td><td class="k-n">' + ms(p.ms) + '</td></tr>').join('') + '</tbody></table></div>';
} else b += na;
try { b += await (await import('./kbx_n34c.js')).statusBlock(env, lang); } catch (e) {}
try { b += await (await import('./kbx_n35b.js')).incidentsHtml(env, lang); } catch (e) {}
b += '<p class="lim">' + esc(t(lang, 'es_more')) + TB.kbx_n30c__s.k13;
const r = await shellPage(shell, lang, { title: t(lang, 'es_t'), h1: t(lang, 'es_t'), lead: t(lang, 'es_lead'), desc: t(lang, 'es_d'), canon: ORIGIN + P + '/engineering/status/', alt: l => ORIGIN + pre(l) + '/engineering/status/', body: b, crumb: [['/engineering/', t(lang, 'cr_eng')]] });
if (r) { const h = new Headers(r.headers); h.set('cache-control', 'public, max-age=120'); return new Response(r.body, { status: 200, headers: h }); }
return r;
}
export const mapStrings = lang => { const o = {}; ['mh_cl', 'mh_late', 'mh_leg', 'mpk', 'mpa', 'mpo', 'mpe', 'mpr', 'mp0', 'mps'].forEach(k => { o[k] = t(lang, k); }); return o; };
export { t as t30 };
export async function handle(req, u, env, ctx, shell) {
const p = u.pathname;
if (p === '/k/n30c-map.js') return new Response(null, { status: 301, headers: { location: '/k/n35b/map.js', 'cache-control': 'public, max-age=3600' } });
if (p === '/embed/v2.js') return new Response(TB.kbx_n30c__s.LOADER, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'cache-control': 'public, max-age=3600', 'access-control-allow-origin': '*', 'x-content-type-options': 'nosniff' } });
let m = /^\/api\/v1\/pin\/([A-Za-z0-9-]{3,20})$/.exec(p);
if (m) {
const ix = await N.data(env), x = ix.byId.get(m[1].toUpperCase()) || ix.bySlug.get(m[1].toLowerCase()); if (!x) return jr({ error: 'unknown project id' }, 404);
const L = await import('./kbx_land.js'), ld = await L.landData(env), r = pinRecord(ld, x);
return jr(Object.assign({ about: TB.kbx_n30c__s.k14, project: ORIGIN + '/projects/' + x.s + '/' }, r || { id: x.id, note: TB.kbx_n30c__t.k30 }), 200, 'public, max-age=3600');
}
m = /^\/embed\/v2\/([a-z0-9-]{1,90})\/?$/.exec(p);
if (m) {
if (!p.endsWith('/')) return Response.redirect(ORIGIN + p + '/' + u.search, 301);
const D = await widgetData(env), x = D.ix.bySlug.get(m[1]);
if (!x || COI_RX.test(String(x.n) + ' ' + String(x.dv))) return new Response('not found', { status: 404, headers: { 'content-type': 'text/plain' } });
const lang = LANGS.includes(u.searchParams.get('lang')) ? u.searchParams.get('lang') : 'en', th = /^(light|dark|auto)$/.test(u.searchParams.get('theme')) ? u.searchParams.get('theme') : 'auto', sz = /^[sml]$/.test(u.searchParams.get('size')) ? u.searchParams.get('size') : 'm';
return new Response(widget(D, x, lang, th, sz), { headers: { 'content-type': 'application/xhtml+xml; charset=utf-8', 'cache-control': 'public, max-age=900', 'content-security-policy': TB.kbx_n30c__t.k31, 'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin' } });
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
