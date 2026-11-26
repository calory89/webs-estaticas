// comments: _notes/kolaboro-worker-comments.txt
import * as N from './kbx_named.js';
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const V = 'b6';
const COI = /eco\s*beach|\bequinox\b|\bsumba\b/i;
let T = null;
async function loadT(env) {
if (T) return T;
try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/n34b-i18n.json')); if (r.ok) T = await r.json(); } catch (e) {}
if (!T) { try { const r = await fetch(ORIGIN + '/data/n34b-i18n.json', { cf: { cacheTtl: 300 } }); if (r.ok) T = await r.json(); } catch (e) {} }
return T;
}
export async function ready(env) { return loadT(env); }
export const tx = (l, k, v) => fill(t(l, k), v || {});
export const QCSS = '<style>.n34-q{list-style:none;padding:0;margin:0 0 16px;counter-reset:q}.n34-q>li{counter-increment:q;padding:10px 0 10px 2.2em;border-bottom:1px solid var(--line,#d5d3cc);position:relative}.n34-q>li::before{content:counter(q);position:absolute;inset-inline-start:0;top:10px;width:1.7em;height:1.7em;border-radius:50%;border:1px solid var(--line,#d5d3cc);display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:700}[dir=rtl] .n34-q>li{padding:10px 2.2em 10px 0}.n34-q b{display:block;font-weight:600}.n34-q small{display:block;color:var(--muted,#59626B);margin-top:4px}</style>';
const MEMO = {};
function file(e, p, t) { return FQ[p] || (FQ[p] = file0(e, p, t).finally(() => { delete FQ[p]; })); }   // n40 k21: one shared read per file
const FQ = {};
async function file0(env, p, ttl) {
  const m = MEMO[p]; if (m && m.v && Date.now() - m.t < (ttl || 600000)) return m.v;
  let v = null;
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com' + p)); if (r.ok) v = await r.json(); } catch (e) { v = null; }
  if (!v) { try { const r = await fetch(ORIGIN + p, { cf: { cacheTtl: 600 } }); if (r.ok) v = await r.json(); } catch (e) { v = null; } }
  MEMO[p] = { t: Date.now(), v }; return v;
}
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const t = (l, k) => { const a = T && T[l] && T[l][k]; return a != null ? a : T && T.en && T.en[k] != null ? T.en[k] : ''; };
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
const tf = (l, k, v) => fill(t(l, k), v || {});
const nf = (n, l, d) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { maximumFractionDigits: d == null ? 0 : d, numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); } };
const fd = (d, l) => { if (!d) return ''; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(String(d).slice(0, 10) + 'T12:00:00Z')); } catch (e) { return String(d).slice(0, 10); } };
const bdi = (l, h) => l === 'ar' ? '<bdi>' + h + '</bdi>' : h;
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const okName = x => x && !COI.test([x.n, x.dv, x.mk, x.ar].join(' '));
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const dirA = l => l === 'ar' ? ' dir="rtl"' : '';
const LP = '(?:(es|de|fr|nl|ru|zh|ar)\\/)?';
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:tools\/due-diligence|markets\/compare|search|projects\/[a-z0-9-]{1,90}\/questions)\/?$|^\/api\/v1\/projects\/[a-z0-9-]{1,90}\/questions$/;
const RX = { q: new RegExp('^\\/' + LP + 'projects\\/([a-z0-9-]{1,90})\\/questions(\\/?)$'), dd: new RegExp('^\\/' + LP + 'tools\\/due-diligence(\\/?)$'), mc: new RegExp('^\\/' + LP + 'markets\\/compare(\\/?)$'), se: new RegExp('^\\/' + LP + 'search(\\/?)$'), api: /^\/api\/v1\/projects\/([a-z0-9-]{1,90})\/questions$/ };
const PM35 = { en: 'Check a price', es: 'Comprobar un precio', fr: 'Vérifier un prix', de: 'Preis prüfen', nl: 'Prijs controleren', ru: 'Проверить цену', zh: '检查价格', ar: 'افحص سعرًا' };
const ALL = [['se', '/search/'], ['dd', '/tools/due-diligence/'], ['mc', '/markets/compare/'], ['wl', '/watchlist/']];
const CSS = '<style>.n34{max-width:1100px}.n34 h2{margin:28px 0 8px;font-size:1.3rem}.n34 p,.n34 li{line-height:1.6}.n34 .k-xs{font-size:.9rem;color:var(--muted,#59626B)}' +
'.n34-tw{overflow-x:auto;border:1px solid var(--line,#d5d3cc);border-radius:12px;margin:10px 0 22px;-webkit-overflow-scrolling:touch}.n34 table{width:100%;border-collapse:collapse;font-size:.93rem}.n34 th,.n34 td{padding:8px 10px;border-bottom:1px solid var(--line,#d5d3cc);text-align:start;vertical-align:top}.n34 thead th{font-size:.82rem;background:var(--card,#fff)}.n34 td.n{font-variant-numeric:tabular-nums}' +
'.n34 input[type=search],.n34 input[type=text],.n34 select{font:inherit;min-height:44px;padding:8px 10px;border:1px solid var(--line,#c9c6bd);border-radius:10px;background:var(--card,#fff);color:inherit;max-width:100%}.n34 button,.n34 .n34-b{min-height:44px;display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;border:1px solid var(--line,#c9c6bd);background:var(--card,#fff);color:inherit;font:inherit;cursor:pointer;text-decoration:none}.n34 .n34-b.hi,.n34 button.hi{background:var(--hi,#FF5B14);border-color:var(--hi,#FF5B14);color:#170800;font-weight:700}' +
'.n34-rel{display:flex;flex-wrap:wrap;gap:4px 16px;padding:0;list-style:none}.n34-rel a{display:inline-flex;min-height:44px;align-items:center}.n34-row{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin:10px 0}.n34-row label{display:flex;flex-direction:column;gap:4px;font-size:.9rem;min-width:0;max-width:100%}' +
'.n34-q{list-style:none;padding:0;margin:0 0 16px;counter-reset:q}.n34-q>li{counter-increment:q;padding:12px 0 12px 2.2em;border-bottom:1px solid var(--line,#d5d3cc);position:relative}.n34-q>li::before{content:counter(q);position:absolute;inset-inline-start:0;top:12px;width:1.7em;height:1.7em;border-radius:50%;background:var(--card,#f1efe9);border:1px solid var(--line,#d5d3cc);display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:700}[dir=rtl] .n34-q>li{padding:12px 2.2em 12px 0}' +
'.n34-q b{display:block;font-weight:600}.n34-q small{display:block;color:var(--muted,#59626B);margin-top:4px}.n34-acts{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 18px}.n34 .chip{display:inline-block;font-size:.8rem;padding:2px 8px;border-radius:999px;border:1px solid var(--line,#d5d3cc)}.n34 .ok{color:#0B7A55;font-weight:700}.n34 .mut{color:var(--muted,#59626B)}:root[data-theme=dark] .n34 .ok{color:#4BE3A4}' +
'.n34-res{list-style:none;padding:0;margin:0}.n34-res li{padding:10px 0;border-bottom:1px solid var(--line,#d5d3cc)}.n34-res a{font-weight:700}.n34-fac{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,170px),1fr));gap:10px;margin:12px 0}.n34-fac select{width:100%}.n34-pg{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}.n34-pg a,.n34-pg span{min-height:44px;min-width:44px;display:inline-flex;align-items:center;justify-content:center}' +
'.n34-bars{max-width:760px}.n34-bars svg{width:100%;height:auto;display:block}.n34-bars text{font-size:13px;fill:currentColor}.n34-bars .g{stroke:var(--line,#d5d3cc)}.n34-bars rect{fill:var(--k-sea,#155C75)}.n34-bars rect.b{fill:#C9440E}:root[data-theme=dark] .n34-bars rect.b{fill:#FF6A2B}.n34-bars svg:focus{outline:2px solid var(--k-sea,#155C75);outline-offset:4px}' +
'@media print{.n34-acts,.n34 form,.n34-rel,.n34-pg{display:none!important}.n34-tw{overflow:visible;border:0}}</style>';
const table = (th, rows, cap) => '<div class="n34-tw" tabindex="0" role="region"' + (cap ? ' aria-label="' + esc(cap) + '"' : '') + '><table>' + (cap ? '<caption class="k-xs" style="text-align:start;padding:8px 10px">' + esc(cap) + '</caption>' : '') + '<thead><tr>' + th.map(x => '<th scope="col">' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
const rel = (l, skip) => '<h2>' + esc(t(l, 'more')) + '</h2><ul class="n34-rel">' + ALL.filter(x => x[0] !== skip).map(x => '<li><a href="' + (x[0] === 'wl' ? '' : pre(l)) + x[1] + '">' + esc(t(l, x[0] + '_t')) + '</a></li>').join('') + '<li><a href="' + pre(l) + '/tools/">' + esc(t(l, 'tools')) + '</a></li><li><a href="/engineering/">' + esc(t(l, 'eng')) + '</a></li></ul>';
const clientT = (l, k, keys) => TB.kbx_n34b__t.k0 + JSON.stringify(Object.assign({}, T.en['c_' + k] || {}, (T[l] && T[l]['c_' + k]) || {}, Object.fromEntries((keys || []).map(x => [x, t(l, x)])), { _l: l, _loc: LOC[l], _p: pre(l) })).replace(/</g, '\\u003c') + '</script><script src="/k/n34b/' + k + '.js?v=' + V + '" defer></script>';
async function page(shell, l, o) {
  const canon = ORIGIN + pre(l) + o.path;
  const crumbs = [[t(l, 'home'), pre(l) + '/']].concat(o.crumb || []).concat([[o.h1, null]]);
  const body = '<section class="phero"' + dirA(l) + '><div class="wrap"><p class="crumb">' + crumbs.map(c => c[1] ? '<a href="' + esc(c[1]) + '">' + esc(c[0]) + '</a>' : esc(c[0])).join(' / ') + '</p><h1>' + esc(o.h1) + '</h1><p class="lead">' + esc(o.lead) + '</p>' +
    (o.updated ? '<p class="k-xs">' + esc(tf(l, 'upd', { d: fd(o.updated, l) })) + '</p>' : '') + '</div></section><div class="wrap n34"' + dirA(l) + '>' + CSS + o.body + rel(l, o.k) + '</div>';
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': o.type || 'WebPage', url: canon, name: o.h1, description: o.lead, inLanguage: l, dateModified: o.updated || '2026-11-21', isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] ? ORIGIN + c[1] : canon })) }] };
  const desc = o.lead.length > 155 ? o.lead.slice(0, 152).replace(/\s+\S*$/, '') + '…' : o.lead;
  const title = (o.title || o.h1);
  let html = await N.assemble({ title: (title.length > 56 ? title.slice(0, 56).replace(/\s+\S*$/, '') : title) + ' | Kolaboro', desc, canon, body, ld, alt: x => ORIGIN + pre(x) + o.path }, l, await shell(pre(l) + '/how-we-score/'));
  if (o.noindex) html = html.replace('</head>', '<meta name="robots" content="noindex, follow"></head>');
  const h = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=' + (o.maxAge || 900), 'content-language': l };
  if (o.noindex) h['x-robots-tag'] = 'noindex, follow';
  return new Response(html, { status: 200, headers: h });
}
const RET = /guarantee|guaranteed|garant|\byield|\breturns?\b|\broi\b|rental (income|pool|return)|per annum|p\.a\./i;
export async function questionsFor(env, x, lang, tp0) {
await loadT(env);
const ix = await N.data(env), c = (ix.caseBy && ix.caseBy.get(x.id)) || {}, fx = x.fx || {};
let tp = tp0; if (tp === undefined) { try { const TR = await import('./kbx_tr.js'); tp = await TR.trProject(env, x.id, lang); } catch (e) { tp = null; } }
const st = {}; for (const i of (tp && tp.items) || []) st[i.k] = i;
const page = N.okHttp(x.url) ? N.fixU(x.url) : null, Q = [];
const add = (g, k, v, why, src) => Q.push({ g, k, q: tf(lang, 'q_' + k, Object.assign({ n: x.n, dv: x.dv || '' }, v || {})), why: why || '', src: src || null });
const no = k => st[k] && (st[k].st === 'no' || st[k].st === 'part');
const stage = c.stage || x.st;
if (no('deposit') || (!st.deposit && !(c.checks && c.checks.escrow))) add('money', 'deposit', null, st.deposit ? st.deposit.text : t(lang, 'w_deposit'), page);
if (!fx.payment_plan) add('money', 'plan', null, t(lang, 'w_plan'), page);
if (no('price')) add('money', 'price', null, st.price ? st.price.text : t(lang, 'w_price'), page);
if (no('permit') || (!st.permit && !x.pn)) add('legal', 'permit', null, st.permit ? st.permit.text : t(lang, 'w_permit'), page);
else if (x.pn && no('permitreg')) add('legal', 'permitreg', { v: x.pn }, st.permitreg ? st.permitreg.text : '', N.okHttp(x.du) ? N.fixU(x.du) : page);
if (no('legal')) add('legal', 'legal', null, st.legal.text, page);
else if (no('register') && x.dv) add('legal', 'register', null, st.register.text, '/registers/');
if (no('location')) add('legal', 'location', null, st.location.text, page);
if (c.title === 'leasehold') add('legal', 'lease', null, t(lang, 'w_lease'), page);
const ho = (() => { try { return N.handoverOf(ix, x); } catch (e) { return null; } })();
if (c.overdue > 0) add('date', 'past', { m: nf(c.overdue, lang) }, tf(lang, 'w_past', { m: nf(c.overdue, lang) }), '/promises/');
else { const pr = ((ix.prom && ix.prom[x.id]) || []).find(k => k && k.k === 'handover' && k.mm > 0); if (pr) add('date', 'moved', { m: nf(pr.mm, lang) }, tf(lang, 'w_moved', { m: nf(pr.mm, lang) }), '/promises/'); }
if (no('date') || (!st.date && !ho)) add('date', 'date', null, st.date ? st.date.text : t(lang, 'w_date'), page);
else if (!(c.overdue > 0) && stage !== 'completed') add('date', 'penalty', { d: ho && ho.d ? N.fd(ho.d, lang) : '' }, t(lang, 'w_penalty'), page);
if (c.plans === false || (c.checks && c.checks.plans === false)) add('unit', 'plans', null, t(lang, 'w_plans'), page);
if (stage !== 'completed' && !(c.verified && c.verified.progress && c.verified.progress !== 'none' && c.verified.progress !== 'developer')) add('unit', 'progress', null, t(lang, 'w_progress'), page);
const cl = (x.cl || []).filter(k => Array.isArray(k) && k[0]);
for (const k of cl.filter(k => k[1] === 'contradicted').slice(0, 4)) add('claims', 'contra', { c: String(k[0]).slice(0, 140), h: hostOf(k[3]) || t(lang, 'a_source') }, t(lang, 'w_contra'), N.okHttp(k[3]) ? k[3] : null);
for (const k of cl.filter(k => k[1] !== 'verified' && k[1] !== 'contradicted' && RET.test(String(k[0]))).slice(0, 2)) add('claims', 'returns', { c: String(k[0]).slice(0, 140) }, t(lang, 'w_returns'), N.okHttp(k[3]) ? k[3] : null);
if (st.web && (st.web.st === 'no' || st.web.st === 'part')) add('claims', 'web', null, st.web.text, '/projects/' + x.s + '/#web');
const order = ['money', 'legal', 'date', 'unit', 'claims'];
Q.sort((a, b) => order.indexOf(a.g) - order.indexOf(b.g));
return { id: x.id, slug: x.s, name: x.n, developer: x.dv || null, lang, built: ix.updated || null, questions: Q, gaps_read: Object.keys(st).length, groups: order };
}
const qText = (l, R) => tf(l, 'mail_head', { n: R.name }) + '\n\n' + R.questions.map((q, i) => (i + 1) + '. ' + q.q).join('\n') + '\n\n' + tf(l, 'mail_foot', { u: ORIGIN + pre(l) + '/projects/' + R.slug + '/' });
export function questionsHtml(l, R, o) {
o = o || {};
if (!R.questions.length) return '<p>' + esc(t(l, 'q_none')) + '</p>';
const by = {}; for (const q of R.questions) (by[q.g] = by[q.g] || []).push(q);
let i = 0;
return R.groups.filter(g => by[g]).map(g => (o.h3 ? '<h3>' : '<h2>') + esc(t(l, 'g_' + g)) + (o.h3 ? '</h3>' : '</h2>') + '<ol class="n34-q" start="' + (i + 1) + '">' + by[g].map(q => { i++; return '<li><b>' + bdi(l, esc(q.q)) + '</b><small>' + esc(t(l, 'why')) + ': ' + bdi(l, esc(q.why)) + (q.src ? ' <a href="' + esc(q.src) + '"' + (/^https?:/.test(q.src) ? TB.kbx_n34b__t.k1 : '') + '>' + esc(/^https?:/.test(q.src) ? hostOf(q.src) : 'kolaboro.com') + '</a>' : '') + '</small></li>'; }).join('') + '</ol>').join('');
}
async function qPage(env, shell, l, x) {
const R = await questionsFor(env, x, l), P = pre(l), txt = qText(l, R);
const mail = 'mailto:?subject=' + encodeURIComponent(tf(l, 'mail_subj', { n: x.n })) + '&body=' + encodeURIComponent(txt.slice(0, 1800));
const b = '<p class="k-xs">' + esc(tf(l, 'q_count', { k: nf(R.questions.length, l), n: x.n })) + TB.kbx_n34b__t.k2 + esc(t(l, 'copy')) + '</button><a class="n34-b" href="' + esc(mail) + '">' + esc(t(l, 'mail')) + TB.kbx_n34b__t.k3 + esc(t(l, 'print')) + TB.kbx_n34b__t.k4 +
questionsHtml(l, R) + TB.kbx_n34b__t.k5 + esc(txt) + '</textarea>' +
'<p><a href="' + P + '/projects/' + x.s + '/">' + esc(tf(l, 'back', { n: x.n })) + '</a> · <a href="' + P + '/projects/' + x.s + '/report/">' + esc(t(l, 'report')) + '</a> · <a href="/ask-developer/?id=' + esc(x.id) + '" rel="nofollow">' + esc(t(l, 'did_answer')) + '</a> · <a href="/api/v1/projects/' + x.s + '/questions?lang=' + l + '">JSON</a></p>' +
'<h2>' + esc(t(l, 'method')) + '</h2>' + (t(l, 'q_meth') || []).map(p => '<p>' + esc(p) + '</p>').join('') +
TB.kbx_n34b__s.k0 + JSON.stringify(t(l, 'copied')) + TB.kbx_n34b__s.k1 + JSON.stringify(t(l, 'copied')) + TB.kbx_n34b__t.k6;
return page(shell, l, { k: 'q', path: '/projects/' + x.s + '/questions/', h1: tf(l, 'q_h1', { n: x.n }), title: tf(l, 'q_title', { n: x.n }), lead: tf(l, 'q_lead', { n: x.n }), body: b, updated: R.built, noindex: true, crumb: [[t(l, 'projects'), P + '/projects/'], [x.n, P + '/projects/' + x.s + '/']] });
}
let SX = null;
async function sIndex(env) {
const d = await file(env, '/data/n34b-search.json', 1800000); if (!d) return null;
if (SX && SX.d === d) return SX;
const rows = d.p.filter(r => !COI.test(r[1] + ' ' + r[3] + ' ' + r[5] + ' ' + r[7])).map(r => ({ s: r[0], n: r[1], id: r[2], dv: r[3], dvs: r[4], mk: r[5], co: r[6], ar: r[7], st: r[8], pm: r[9], hy: r[10], ov: r[11], mv: r[12], h: norm([r[1], r[2], r[3], r[5], r[6], r[7]].join(' ')), hn: norm(r[1]) }));
SX = { d, rows, bySlug: new Map(rows.map(r => [r.s, r])), byId: new Map(rows.map(r => [r.id, r])) };
return SX;
}
function match(rows, q) {
const qs = norm(q).split(' ').filter(Boolean); if (!qs.length) return rows.slice();
const out = [];
for (const r of rows) { let s = 0, ok = true; for (const w of qs) { const i = r.h.indexOf(w); if (i < 0) { ok = false; break; } s += (r.hn.indexOf(w) === 0 ? 6 : r.hn.indexOf(w) >= 0 ? 4 : 1) + (i === 0 || r.h[i - 1] === ' ' ? 1 : 0); } if (ok) out.push([s, r]); }
out.sort((a, b) => b[0] - a[0] || a[1].n.localeCompare(b[1].n)); return out.map(x => x[1]);
}
const SECS = ['f', 'c', 'q', 'h', 's'];
async function ddPage(env, shell, l, u) {
const X = await sIndex(env); if (!X) return null;
const P = pre(l), q = String(u.searchParams.get('p') || '').slice(0, 120).trim();
let pick = null, cands = [];
const idm = /\b([A-Za-z]{2,5}-\d{3,4})\b/.exec(q);
if (q) { pick = X.bySlug.get(q.toLowerCase()) || X.byId.get(q.toUpperCase()) || (idm && X.byId.get(idm[1].toUpperCase())) || null; if (!pick) { cands = match(X.rows, q).slice(0, 8); if (cands.length === 1) pick = cands[0]; } }
const opt = (v, lab, on) => '<label style="flex-direction:row;align-items:center;gap:8px;min-height:44px"><input type="checkbox" name="s" value="' + v + '"' + (on ? ' checked' : '') + '> ' + esc(lab) + '</label>';
let b = '<h2>' + esc(t(l, 'dd_s1')) + '</h2><form method="get" action="' + P + TB.kbx_n34b__t.k7 + esc(t(l, 'dd_pick')) + '<input type="search" name="p" value="' + esc(q) + TB.kbx_n34b__t.k8 + esc(t(l, 'dd_ph')) + TB.kbx_n34b__t.k9 + esc(t(l, 'dd_find')) + '</button></form>';
if (q && !pick) b += cands.length ? '<p>' + esc(t(l, 'dd_which')) + '</p><ul class="n34-res">' + cands.map(r => '<li><a href="' + P + '/tools/due-diligence/?p=' + esc(r.s) + '">' + bdi(l, esc(r.n)) + '</a> <span class="k-xs">' + bdi(l, esc([r.dv, r.mk, r.co].filter(Boolean).join(' · '))) + ' · ' + esc(r.id) + '</span></li>').join('') + '</ul>' : '<p class="mut">' + esc(tf(l, 'dd_none', { q })) + ' <a href="' + P + '/search/?q=' + encodeURIComponent(q) + '">' + esc(t(l, 'se_t')) + '</a></p>';
if (pick) {
const act = P + '/projects/' + pick.s + '/report/';
b += '<h2>' + esc(t(l, 'dd_s2')) + '</h2><p><b>' + bdi(l, esc(pick.n)) + '</b> <span class="k-xs">' + bdi(l, esc([pick.dv, pick.mk, pick.co].filter(Boolean).join(' · '))) + ' · ' + esc(pick.id) + '</span></p>' +
'<form method="get" action="' + act + TB.kbx_n34b__t.k10 + esc(t(l, 'dd_secs')) + '</legend><div class="n34-row">' + SECS.map(s => opt(s, t(l, 'sec_' + s), true)).join('') + '</div></fieldset>' +
TB.kbx_n34b__t.k11 + esc(t(l, 'dd_go')) + '</button><a class="n34-b" href="' + act + '">' + esc(t(l, 'dd_all')) + '</a><a class="n34-b" href="' + P + '/projects/' + pick.s + TB.kbx_n34b__t.k12 + P + '/projects/' + pick.s + '/questions/">' + esc(t(l, 'q_short')) + '</a></div></form>' +
'<p class="k-xs">' + esc(t(l, 'dd_share')) + ' <code dir="ltr">' + esc(ORIGIN + act) + '</code></p>';
}
b += '<h2>' + esc(t(l, 'dd_what')) + '</h2><ul>' + SECS.map(s => '<li><b>' + esc(t(l, 'sec_' + s)) + '</b>: ' + esc(t(l, 'secd_' + s)) + '</li>').join('') + '</ul>' + (t(l, 'dd_p') || []).map(p => '<p>' + esc(p) + '</p>').join('') +
'<p class="k-xs">' + esc(tf(l, 'src_line', { n: nf(X.rows.length, l), d: fd(X.d.built, l), h: String(X.d.source.sha256).slice(0, 16) })) + '</p>' + clientT(l, 'dd');
return page(shell, l, { k: 'dd', path: '/tools/due-diligence/', h1: t(l, 'dd_t'), lead: t(l, 'dd_l'), body: b, updated: X.d.built, noindex: !!q, crumb: [[t(l, 'tools'), P + '/tools/']], type: 'WebApplication' });
}
const PER = 25;
export function facetFilter(rows, f, skip) {
return rows.filter(r => (skip === 'co' || !f.co || r.co === f.co) && (skip === 'st' || !f.st || r.st === f.st) && (skip === 'pm' || f.pm == null || r.pm === f.pm) && (skip === 'hy' || !f.hy || (f.hy === 'none' ? !r.hy : f.hy === 'past' ? r.ov > 0 : String(r.hy) === f.hy)));
}
const cnt = (rows, key) => { const m = new Map(); for (const r of rows) { const k = key(r); m.set(k, (m.get(k) || 0) + 1); } return m; };
async function sePage(env, shell, l, u) {
const X = await sIndex(env); if (!X) return null;
const P = pre(l), sp = u.searchParams, q = String(sp.get('q') || '').slice(0, 120);
const f = { co: sp.get('co') || '', st: ['o', 'u', 'c'].includes(sp.get('st')) ? sp.get('st') : '', pm: sp.get('pm') === '1' ? 1 : sp.get('pm') === '0' ? 0 : null, hy: /^(20\d\d|none|past)$/.test(sp.get('hy') || '') ? sp.get('hy') : '' };
let G = null, RT = (k, v) => k; try { const R = await import('./kbx_n37u.js'); G = await R.regMap(env); RT = (k, v) => R.rgT(l, k, v); } catch (e) { G = null; }
const rg = G && /^[13]$/.test(sp.get('rg') || '') ? sp.get('rg') : '', so = G && sp.get('so') === 'reg' ? 'reg' : '', gOf = r => (G && G.get(r.s)) || 0;
const base0 = match(X.rows, q), base = rg ? base0.filter(r => gOf(r) >= +rg) : base0, res0 = facetFilter(base, f), res = so ? res0.map((r, i) => [gOf(r), i, r]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).map(x => x[2]) : res0, rgAll = G ? facetFilter(base0, f) : [], pg = Math.max(1, Math.min(200, parseInt(sp.get('pg') || '1', 10) || 1));
const co = cnt(facetFilter(base, f, 'co'), r => r.co), stc = cnt(facetFilter(base, f, 'st'), r => r.st), pmc = cnt(facetFilter(base, f, 'pm'), r => r.pm), hyc = cnt(facetFilter(base, f, 'hy'), r => r.hy || 'none'), pastN = facetFilter(base, f, 'hy').filter(r => r.ov > 0).length;
const sel = (name, lab, opts, cur) => '<label>' + esc(lab) + '<select name="' + name + '" data-f="' + name + '"><option value="">' + esc(t(l, 'all')) + '</option>' + opts.map(o => '<option value="' + esc(o[0]) + '"' + (String(cur) === String(o[0]) ? ' selected' : '') + '>' + esc(o[1]) + ' (' + nf(o[2], l) + ')</option>').join('') + '</select></label>';
const coOpts = [...co.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k, v]) => [k, k, v]);
if (f.co && !co.has(f.co)) coOpts.unshift([f.co, f.co, 0]);
const stName = { o: t(l, 'st_o'), u: t(l, 'st_u'), c: t(l, 'st_c') };
const yrs = [...hyc.keys()].filter(k => k !== 'none').sort();
const form = '<form method="get" action="' + P + TB.kbx_n34b__t.k13 + esc(t(l, 'se_q')) + '<input type="search" name="q" value="' + esc(q) + '" placeholder="' + esc(t(l, 'se_ph')) + TB.kbx_n34b__t.k14 + esc(t(l, 'se_go')) + '</button></div>' +
'<div class="n34-fac">' + sel('co', t(l, 'f_co'), coOpts, f.co) + sel('st', t(l, 'f_st'), ['o', 'u', 'c'].map(k => [k, stName[k], stc.get(k) || 0]), f.st) + sel('pm', t(l, 'f_pm'), [[1, t(l, 'pm_1'), pmc.get(1) || 0], [0, t(l, 'pm_0'), pmc.get(0) || 0]], f.pm == null ? '' : f.pm) +
sel('hy', t(l, 'f_hy'), yrs.map(y => [y, y, hyc.get(+y) || hyc.get(y) || 0]).concat([['past', t(l, 'hy_past'), pastN], ['none', t(l, 'hy_none'), hyc.get('none') || 0]]), f.hy) +
(G ? sel('rg', RT('rg_f'), [['1', RT('rg_1'), rgAll.filter(r => gOf(r) >= 1).length], ['3', RT('rg_3'), rgAll.filter(r => gOf(r) >= 3).length]], rg) + '<label>' + esc(RT('so_l')) + TB.kbx_n34b__t.k15 + esc(RT('so_0')) + '</option><option value="reg"' + (so ? ' selected' : '') + '>' + esc(RT('so_reg')) + '</option></select></label>' : '') + '</div></form>';
const pages = Math.max(1, Math.ceil(res.length / PER)), cur = Math.min(pg, pages), slice = res.slice((cur - 1) * PER, cur * PER);
const qs = o => { const p = new URLSearchParams(); const v = Object.assign({ q, co: f.co, st: f.st, pm: f.pm == null ? '' : String(f.pm), hy: f.hy, rg, so }, o); for (const k of ['q', 'co', 'st', 'pm', 'hy', 'rg', 'so', 'pg']) if (v[k] && !(k === 'pg' && v[k] === 1)) p.set(k, v[k]); const s = p.toString(); return P + '/search/' + (s ? '?' + s : ''); };
const item = r => '<li><a href="' + P + '/projects/' + esc(r.s) + '/">' + bdi(l, esc(r.n)) + '</a> <span class="k-xs">' + bdi(l, esc([r.dv, r.ar && r.ar !== r.mk ? r.ar : '', r.mk, r.co].filter(Boolean).join(' · '))) + '</span><br><span class="k-xs">' + [stName[r.st] || '', r.hy ? tf(l, 'r_hy', { y: r.hy }) : t(l, 'hy_none'), r.ov > 0 ? tf(l, 'r_ov', { m: nf(r.ov, l) }) : '', r.pm ? t(l, 'pm_1') : t(l, 'pm_0')].filter(Boolean).map(esc).join(' · ') + '</span></li>';
const out = TB.kbx_n34b__t.k16 + esc(tf(l, 'se_n', { k: nf(res.length, l), t: nf(X.rows.length, l) })) + '</p>' + (slice.length ? '<ol class="n34-res" start="' + ((cur - 1) * PER + 1) + '">' + slice.map(item).join('') + '</ol>' : '<p class="mut">' + esc(t(l, 'se_empty')) + ' <a href="' + P + '/request-project/?q=' + encodeURIComponent(q) + '">' + esc(t(l, 'se_req')) + '</a></p>') +
(pages > 1 ? '<nav class="n34-pg" aria-label="' + esc(t(l, 'pages')) + '">' + (cur > 1 ? '<a href="' + esc(qs({ pg: cur - 1 })) + '" rel="prev">‹</a>' : '') + '<span>' + nf(cur, l) + ' / ' + nf(pages, l) + '</span>' + (cur < pages ? '<a href="' + esc(qs({ pg: cur + 1 })) + '" rel="next">›</a>' : '') + '</nav>' : '') + '</div>';
const b = form + out + '<p class="k-xs">' + esc(tf(l, 'src_line', { n: nf(X.rows.length, l), d: fd(X.d.built, l), h: String(X.d.source.sha256).slice(0, 16) })) + TB.kbx_n34b__s.k2 +
'<p class="k-xs">' + esc(t(l, 'se_tip')) + '</p>' + clientT(l, 'se', ['se_n', 'se_empty', 'se_req', 'st_o', 'st_u', 'st_c', 'pm_1', 'pm_0', 'r_hy', 'r_ov', 'hy_none', 'hy_past', 'all', 'pages']);
const any = q || f.co || f.st || f.pm != null || f.hy || rg || so || cur > 1;
return page(shell, l, { k: 'se', path: '/search/', h1: t(l, 'se_t'), lead: t(l, 'se_l'), body: b, updated: X.d.built, noindex: !!any, maxAge: 600, type: 'SearchResultsPage' });
}
const DEF = ['dubai', 'bali', 'phuket'];
const ci = (l, v, d) => v ? bdi(l, '[' + nf(v[0], l, d) + ' – ' + nf(v[1], l, d) + ']') : '';
async function mcPage(env, shell, l, u) {
const D = await file(env, '/data/n34b-markets.json', 1800000); if (!D) return null;
const P = pre(l), all = D.markets.filter(m => !COI.test(m.market)), by = new Map(all.map(m => [m.slug, m]));
let want = String(u.searchParams.get('m') || '').toLowerCase().split(/[,\s]+/).concat(['m1', 'm2', 'm3', 'm4'].map(k => String(u.searchParams.get(k) || '').toLowerCase())).filter(s => by.has(s));
want = [...new Set(want)].slice(0, 4); const custom = want.length > 0; if (want.length < 2) want = [...new Set(want.concat(DEF))].slice(0, Math.max(3, want.length));
const M = want.map(s => by.get(s)).filter(Boolean);
const opts = cur => all.slice().sort((a, b) => a.market.localeCompare(b.market)).map(m => '<option value="' + esc(m.slug) + '"' + (m.slug === cur ? ' selected' : '') + '>' + esc(m.market) + ' (' + nf(m.projects, l) + ')</option>').join('');
const form = '<form method="get" action="' + P + '/markets/compare/" class="n34-fac">' + [0, 1, 2, 3].map(i => '<label>' + esc(tf(l, 'mc_m', { i: i + 1 })) + '<select name="m' + (i + 1) + '"><option value="">' + esc(t(l, i < 2 ? 'mc_pick' : 'mc_none')) + '</option>' + opts(M[i] && M[i].slug) + '</select></label>').join('') + TB.kbx_n34b__t.k17 + esc(t(l, 'mc_go')) + '</button></div></form>';
const pct = (a, b) => b ? nf(Math.round(a * 100 / b), l) + '%' : '–';
const med = (o, unit) => o && o.n ? bdi(l, nf(o.median, l, 1) + ' ' + unit) + ' ' + ci(l, o.ci95, 0) + ' <span class="k-xs">' + esc(tf(l, 'n_is', { n: nf(o.n, l) })) + (o.n < 5 ? ', ' + esc(t(l, 'few')) : '') + '</span>' : '<span class="mut">' + esc(t(l, 'none_rec')) + '</span>';
const R = [
[t(l, 'mc_projects'), m => '<a href="' + P + '/m/' + encodeURIComponent(m.slug) + '/">' + bdi(l, nf(m.projects, l)) + '</a>'],
[t(l, 'mc_stage'), m => esc([t(l, 'st_o') + ' ' + nf(m.stage.o, l), t(l, 'st_u') + ' ' + nf(m.stage.u, l), t(l, 'st_c') + ' ' + nf(m.stage.c, l)].join(' · '))],
[t(l, 'mc_date'), m => bdi(l, pct(m.with_date, m.projects)) + ' <span class="k-xs">' + bdi(l, nf(m.with_date, l) + ' / ' + nf(m.projects, l)) + '</span>'],
[t(l, 'mc_past'), m => med(m.past_date, t(l, 'months'))],
[t(l, 'mc_moved'), m => med(m.moved, t(l, 'months'))],
[t(l, 'mc_permit'), m => bdi(l, pct(m.permit_published, m.projects)) + ' <span class="k-xs">' + bdi(l, nf(m.permit_published, l) + ' / ' + nf(m.projects, l)) + '</span>'],
[t(l, 'mc_ti'), m => m.disclosure ? bdi(l, nf(m.disclosure.transparency_index, l)) + ' <span class="k-xs">/ 100</span>' : '<span class="mut">–</span>'],
[t(l, 'mc_dep'), m => m.disclosure && m.disclosure.deposit_protection_pct != null ? bdi(l, nf(m.disclosure.deposit_protection_pct, l) + '%') : '<span class="mut">–</span>'],
[t(l, 'mc_ppm'), m => m.ppm ? bdi(l, esc(m.ppm.currency) + ' ' + nf(m.ppm.median, l)) + ' ' + ci(l, m.ppm.ci95, 0) + ' <span class="k-xs">' + esc(tf(l, 'n_is', { n: nf(m.ppm.n, l) })) + (m.ppm.n < 5 ? ', ' + esc(t(l, 'few')) : '') + '</span>' + (m.ppm.n >= 5 ? ' <a class="k-xs" href="' + pre(l) + '/tools/price-per-m2/?m=' + m.slug + '">' + esc(PM35[l] || PM35.en) + '</a>' : '') : '<span class="mut">' + esc(t(l, 'none_rec')) + '</span>'],
[t(l, 'mc_regs'), m => m.registers.length ? TB.kbx_n34b__t.k18 + m.registers.map(r => '<li><a href="' + esc(r.url) + TB.kbx_n34b__t.k19 + esc(r.name) + '</a> <span class="k-xs">' + esc(t(l, 'auto_' + String(r.automation || '').replace(/[^a-z]+/g, '_')) || r.automation || '') + '</span></li>').join('') + '</ul>' : '<span class="mut">' + esc(t(l, 'mc_noreg')) + '</span>']
];
const tbl = table([t(l, 'mc_metric')].concat(M.map(m => m.market)), R.map(r => '<tr><th scope="row">' + esc(r[0]) + '</th>' + M.map(m => '<td>' + r[1](m) + '</td>').join('') + '</tr>'), t(l, 'mc_cap'));
const bars = (key, val, max, lab) => {
    const W = 640, rowH = 34, H = 16 + M.length * rowH, L0 = 150, R0 = 70, vals = M.map(val);
    const rows = M.map((m, i) => { const v = vals[i], w = v == null ? 0 : Math.max(1, (W - L0 - R0) * v / max); return '<text x="' + (L0 - 8) + '" y="' + (16 + i * rowH + 17) + '" text-anchor="end">' + esc(m.market.length > 18 ? m.market.slice(0, 17) + '…' : m.market) + '</text><rect' + (key === 'past' ? ' class="b"' : '') + ' x="' + L0 + '" y="' + (16 + i * rowH + 4) + '" width="' + w.toFixed(1) + '" height="20" rx="3"></rect><text x="' + (L0 + w + 6).toFixed(1) + '" y="' + (16 + i * rowH + 19) + '">' + (v == null ? '–' : nf(v, l)) + (key === 'ti' ? '' : '%') + '</text>'; }).join('');
    const top = M.map((m, i) => [m.market, vals[i]]).filter(x => x[1] != null).sort((a, b) => b[1] - a[1]);
    const sum = top.length ? tf(l, 'ch_sum_' + key, { a: top[0][0], av: nf(top[0][1], l), b: top[top.length - 1][0], bv: nf(top[top.length - 1][1], l) }) : '';
    const id = 'n34c-' + key;
    return '<figure class="n34-bars"><figcaption id="' + id + '-t"><b>' + esc(lab) + '</b></figcaption><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" tabindex="0" aria-labelledby="' + id + '-t ' + id + '-s"><title>' + esc(lab) + '</title><line class="g" x1="' + L0 + '" x2="' + L0 + '" y1="8" y2="' + (H - 4) + '"></line>' + rows + '</svg><p class="k-xs" id="' + id + '-s">' + esc(sum) + ' ' + esc(t(l, 'ch_tbl')) + '</p></figure>';
  };
const charts = bars('ti', m => m.disclosure ? m.disclosure.transparency_index : null, 100, t(l, 'mc_ti')) + bars('permit', m => m.projects ? Math.round(m.permit_published * 100 / m.projects) : null, 100, t(l, 'mc_permit')) + bars('past', m => m.with_date ? Math.round(m.past_date.n * 100 / m.with_date) : null, Math.max(10, ...M.map(m => m.with_date ? Math.round(m.past_date.n * 100 / m.with_date) : 0)), t(l, 'mc_pastsh'));
const b = form + '<p class="k-xs">' + esc(t(l, 'mc_hist')) + '</p>' + tbl + charts + '<h2>' + esc(t(l, 'method')) + '</h2>' + (t(l, 'mc_p') || []).map(p => '<p>' + esc(p) + '</p>').join('') +
'<p class="k-xs">' + esc(tf(l, 'mc_src', { d: fd(D.built, l), e: D.disclosure_source.edition, h: String(D.source.sha256).slice(0, 16) })) + TB.kbx_n34b__s.k3 + P + '/reports/transparency/">' + esc(t(l, 'mc_trep')) + '</a> · <a href="' + P + '/delays/">' + esc(t(l, 'mc_delays')) + '</a> · <a href="/registers/">' + esc(t(l, 'mc_regpage')) + '</a></p>';
const names = M.map(m => m.market).join(', ');
return page(shell, l, { k: 'mc', path: '/markets/compare/', h1: custom ? tf(l, 'mc_h1x', { m: names }) : t(l, 'mc_t'), title: custom ? tf(l, 'mc_h1x', { m: names }) : t(l, 'mc_t'), lead: t(l, 'mc_l'), body: b, updated: D.built, noindex: custom, crumb: [[t(l, 'markets'), P + '/m/']], type: 'WebPage' });
}
export async function handle(req, u, env, ctx, shell) {
const p = u.pathname; if (!PATHS.test(p)) return null;
if (req.method !== 'GET' && req.method !== 'HEAD') return null;
if (!(await loadT(env))) return null;
let m = p.match(RX.api);
if (m) {
const ix = await N.data(env), x = ix.bySlug.get(m[1]) || ix.byId.get(m[1].toUpperCase());
if (!x || !okName(x)) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' } });
const l = LANGS.includes(u.searchParams.get('lang')) ? u.searchParams.get('lang') : 'en';
const R = await questionsFor(env, x, l);
const body = Object.assign({ api: 'kolaboro-questions-v1', licence: TB.kbx_n34b__t.k20, rules: TB.kbx_n34b__s.k4, page: ORIGIN + pre(l) + '/projects/' + x.s + '/questions/' }, R);
return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=900', 'access-control-allow-origin': '*' } });
}
if ((m = p.match(RX.q))) {
const l = m[1] || 'en'; if (!m[3]) return new Response(null, { status: 301, headers: { location: p + '/' } });
const ix = await N.data(env), x = ix.bySlug.get(m[2]); if (!x || !okName(x)) return null;
return qPage(env, shell, l, x);
}
for (const [k, fn] of [['dd', ddPage], ['mc', mcPage], ['se', sePage]]) {
if ((m = p.match(RX[k]))) { if (!m[2]) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } }); return fn(env, shell, m[1] || 'en', u); }
}
return null;
}
