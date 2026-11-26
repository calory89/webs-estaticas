// comments: _notes/kolaboro-worker-comments.txt
import { TB } from './kbx_strings.js';
const T = TB.kbx_n27lead_T ;
export const dlLine = (lang, s) => '<p class="ki">' + (TB.kbx_n27lead__t.o_DL[lang] || TB.kbx_n27lead__t.o_DL.en) + ': <a href="/api/v1/projects/' + s + TB.kbx_n27lead__t.k0 + s + TB.kbx_n27lead__t.k1 + s + TB.kbx_n27lead__t.k2 + (lang === 'en' ? '' : '/' + lang) + '/projects/' + s + '/certificate/" rel="nofollow">' + (TB.kbx_n27lead__t.o_CERT[lang] || TB.kbx_n27lead__t.o_CERT.en) + '</a></p>';
const DD = { en: 'Developer dashboard: your score and what is missing', es: 'Panel del promotor: su puntuación y lo que falta', de: 'Bauträger-Übersicht: Ihr Wert und was fehlt', fr: 'Tableau de bord du promoteur : votre score et ce qui manque', nl: 'Dashboard voor ontwikkelaars: uw score en wat ontbreekt', ru: 'Панель застройщика: ваша оценка и чего не хватает', zh: '开发商面板：您的评分和缺少的内容', ar: 'لوحة المطوّر: درجتك وما ينقص' };
export const devDash = (lang, s) => '<p><a href="' + (lang === 'en' ? '' : '/' + lang) + '/developers/' + s + '/dashboard/">' + (DD[lang] || DD.en) + '</a></p>';
export const LEAD_CSS = '<style>.klead{margin:0 0 12px;font-weight:600;line-height:1.45}.klead .k-src{font-weight:400}.klead-s{margin:0 0 10px;font-size:.86rem}</style>';
const ISO = /^\d{4}-\d{2}-\d{2}/;
export function leadMap(ix, x, lang, tp, checked, h) {
const L = T[lang] || T.en, c = ix.caseBy.get(x.id) || {}, rv = h.reviewed(c);
const fill = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
const src = u => h.okHttp(u) ? '<a class="k-src" href="' + h.esc(h.fixU(u)) + '" rel="noopener nofollow" target="_blank"><bdi>' + h.esc(h.host(h.fixU(u))) + '</bdi></a>' : null;
const tx = (k, v, raw) => fill(h.esc(L[k]), Object.assign({}, ...Object.entries(v).map(([a, b]) => ({ [a]: raw && raw.includes(a) ? b : h.esc(b) }))));
const ck = h.esc(h.fd(checked, lang)), out = {}, page = src(x.url);
const ho = h.handoverOf(ix, x), pr = (ix.prom[x.id] || []).find(p => p.k === 'handover');
if (ho && page) { const H = (pr && pr.hist) || [], seen = (H.length ? H[H.length - 1].seen : null) || (pr && pr.seen) || checked;
out.delivery = tx('del', { d: h.fd(ho.d, lang), s: page, seen: h.fd(ISO.test(String(seen)) ? String(seen).slice(0, 10) : checked, lang) }, ['s']); }
else if (!ho) out.delivery = tx('del_n', { c: ck }, ['c']);
const ps = src(x.du) || page;
if (x.pn && ps) out.permits = tx('perm', { pn: '<bdi>' + h.esc(x.pn) + '</bdi>', s: ps }, ['pn', 's']);
else if (!x.pn) out.permits = tx('perm_n', { c: ck }, ['c']);
if (x.dv && page) out.developer = tx('dev', { dv: '<bdi>' + h.esc(x.dv) + '</bdi>', s: page, c: ck }, ['dv', 's', 'c']);
const area = [x.ar && x.ar !== x.mk ? x.ar : null, x.mk].filter(Boolean).join(', ').split(', ').filter((v, i, a) => a.findIndex(w => w.toLowerCase() === v.toLowerCase()) === i).join(', ');
if (area && page) out.where = tx('where', { a: '<bdi>' + h.esc(area) + '</bdi>', s: page, c: ck }, ['a', 's', 'c']);
if (rv && typeof c.score === 'number') out.checks = tx('chk', { k: c.score, v: c.vscore || 0, c: ck }, ['c']) + TB.kbx_n27lead__t.k3;
if (tp && typeof tp.score === 'number' && tp.updated) out.legit = tx('tr', { v: tp.score, d: h.fd(String(tp.updated).slice(0, 10), lang) }) + ' <a class="k-src" href="' + h.esc(tp.method) + '">kolaboro.com</a>';
return out;
}
export function leadify(body, leads) {
let n = 0;
for (const [id, html] of Object.entries(leads)) {
const i = body.indexOf(' id="' + id + '"'); if (i < 0) continue;
const sStart = body.lastIndexOf('<', i);
if (!/^<(section|details|div)\b/.test(body.slice(sStart, sStart + 9))) continue;
const a = body.indexOf('</h2>', i), so = body.indexOf('<summary', i), b = so >= 0 ? body.indexOf('</summary>', so) : -1;
const useS = b >= 0 && (a < 0 || so < a);
if (!useS && a < 0) continue;
const end = useS ? b : a + 5;
if (body.slice(end, end + 40).includes('class="klead"') || (useS && body.slice(so, b).includes('class="klead"'))) continue;
if (useS) {
const links = html.match(/<a\b[^>]*>[\s\S]*?<\/a>/g) || [];
const txt = html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/g, (m, at, inner) => '<span class="k-src">' + inner + '</span>');
body = body.slice(0, end) + '<p class="klead">' + txt + '</p></summary>' + (links.length ? '<p class="klead-s">' + links.join(' ') + '</p>' : '') + body.slice(end + 10); n++;
continue;
}
body = body.slice(0, end) + '<p class="klead">' + html + '</p>' + body.slice(end); n++;
}
return n ? body.replace('<div class="wrap kwrap">', LEAD_CSS + '<div class="wrap kwrap">') : body;
}
