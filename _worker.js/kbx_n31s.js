// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_n31s__q, $s = TB.kbx_n31s__s, $t = TB.kbx_n31s__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import * as N from './kbx_named.js';
import { mkName } from './kbx_hdate.js';
import { TR_PLACES } from './kbx_tr_places.js';
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
let S = { en: {} }, TOOLS = {}, GL = {}, I18N = false;
async function loadI18n(env) {
if (I18N) return true;
let j = null;
try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.b)); if (r.ok) j = await r.json(); } catch (e) {}
if (!j) { try { const r = await fetch(ORIGIN + $q.c, { cf: { cacheTtl: 300 } }); if (r.ok) j = await r.json(); } catch (e) {} }
if (j && j.S) { S = j.S; TOOLS = j.TOOLS || {}; GL = j.GL || {}; I18N = true; }
return I18N;
}
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const COI_RX = /eco\s*beach\s*city|\bequinox\b/i;
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.d, "'": '&#39;' }[c]));
const t = (lang, k, v) => { let s = (S[lang] && S[lang][k]) || S.en[k] || k; if (v) s = s.replace(/\{(\w+)\}/g, (m, a) => v[a] != null ? v[a] : m); return s; };
const nmf = (lang, d) => new Intl.NumberFormat(lang === 'en' ? 'en-GB' : lang === 'zh' ? 'zh-CN' : lang, { maximumFractionDigits: d || 0, numberingSystem: 'latn' });
const num = (v, lang, d) => { try { return nmf(lang, d).format(v); } catch (e) { return String(v); } };
const fdt = (d, lang) => N.fd(String(d).slice(0, 10), lang);
const monthName = (ym, lang) => { try { return new Date(ym + $q.e).toLocaleDateString(lang === 'en' ? 'en-GB' : lang === 'zh' ? 'zh-CN' : lang, { month: 'long', year: $q.f, timeZone: 'UTC', numberingSystem: 'latn' }); } catch (e) { return ym; } };
const slugA = s => String(s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export const PATHS = /^\/(?:es|de|fr|nl|ru|zh|ar)\/(?:tools|glossary)\/?$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:docs|reports\/month)\/?$|^\/engineering\/notes(?:\/[a-z0-9-]{3,60})?\/?$|^\/projects\/[a-z0-9-]{1,90}\.md$/;
const html = (b, cc) => new Response(b, { status: 200, headers: { 'content-type': $q.g, 'cache-control': cc || $q.h } });
const MEMO = {};
async function asset(env, path, kind, ttl) {
const m = MEMO[path]; if (m && Date.now() - m.t < (ttl || 600000)) return m.v;
let v = null;
try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.i + path)); if (r.ok) v = kind === 'json' ? await r.json() : await r.text(); } catch (e) { v = null; }
MEMO[path] = { t: Date.now(), v }; return v;
}
async function page(shell, lang, o) {
  const sh = await shell(pre(lang) + $q.j); if (!sh || sh.status !== 200) return null;
  const crumb = $q.k + pre(lang) + $q.l + (o.crumb || []).map(([h, l]) => ' / ' + (h ? $q.m + h + '">' + esc(l) + '</a>' : esc(l))).join('') + '</p>';
  const body = (o.head || '') + $q.n + crumb + '<h1>' + esc(o.h1) + $q.o + esc(o.lead) + '</p>' + (o.hero || '') + $q.p + (lang === 'ar' ? $q.q : '') + '>' + o.body + $q.r + $q.a;
  const pg = { title: o.title + $q.s, desc: o.desc, canon: o.canon, body, alt: o.alt,
    ld: { '@context': $q.t, '@graph': [{ '@type': o.type || $q.u, name: o.title, url: o.canon, inLanguage: lang, description: o.desc, dateModified: o.mod || undefined, isPartOf: { '@type': $q.v, name: $q.w, url: ORIGIN + '/' } }].concat(o.ld || []) } };
  let out = await N.assemble(pg, lang, sh);
  if (o.enOnly) out = out.replace(/<link rel="alternate" hreflang="(?!en"|x-default")[^"]*" href="[^"]*">/g, '');   // English-only pages: no hreflang to other languages
  return html(out);
}
const altOf = path => l => ORIGIN + pre(l) + path;
const ITEM_RX = /<div class="ft-f( look)?"><h3><a href="([^"]+)">([\s\S]*?)<\/a>(?:<span class="ft-tag (ok|note)">([\s\S]*?)<\/span>)?<\/h3><p>([\s\S]*?)<\/p><\/div>/g;
const TAGS = { 'In your browser': 'tag_browser', 'Photos stay on your phone': 'tag_phone', 'Live lookup': 'tag_live', 'Works offline': 'tag_offline', 'Opens after setup': 'tag_setup' };
const T35 = { en: ['Price per m² checker', 'Private document vault', 'Compare developers'], es: ['Comprobador de precio por m²', 'Archivo privado de documentos', 'Comparar promotoras'], fr: ['Vérificateur de prix au m²', 'Coffre de documents privé', 'Comparer des promoteurs'], de: ['Preis pro m² prüfen', 'Privater Dokumententresor', 'Bauträger vergleichen'], nl: ['Prijs per m² controleren', 'Privé documentenkluis', 'Ontwikkelaars vergelijken'], ru: ['Проверка цены за м²', 'Личный сейф документов', 'Сравнение застройщиков'], zh: ['每平方米价格检查', '私人文件保险箱', '比较开发商'], ar: ['فاحص سعر المتر المربع', 'خزنة مستندات خاصة', 'قارن بين المطوّرين'] };
const LOCAL_TOOLS = new Set(['/tools/bulk-check/', '/tools/contract-addendum/', '/tools/contract-reader/', '/tools/permit-photo/', '/tools/widget/', '/tools/total-cost/dubai/']);
export function toolsParse(src) {
const m = /<main[^>]*>([\s\S]*?)<\/main>/.exec(src || ''); if (!m) return null;
const main = m[1], css = (/<link rel="stylesheet" href="(\/tools\/ft\.css[^"]*)"/.exec(src) || [])[1] || $q.x;
const G = []; const gr = /<p class="eyebrow" role="heading" aria-level="2" id="([a-z]+)"[^>]*>[^<]*<\/p>\s*<div class="ft-method"[^>]*>([\s\S]*?)<\/div>\s*(?=<p class="eyebrow"|<\/div><\/section>)/g; let g;
while ((g = gr.exec(main))) { const L = []; let it; ITEM_RX.lastIndex = 0; while ((it = ITEM_RX.exec(g[2]))) L.push({ look: !!it[1], href: it[2], name: it[3], tc: it[4], tag: it[5], desc: it[6] }); G.push({ id: g[1], L }); }
return { G, css };
}
async function toolsHub(u, env, shell, lang) {
const src = await asset(env, $q.y, 'text'); const P = toolsParse(src); if (!P || !P.G.length) return null;
let untr = 0, LT = LOCAL_TOOLS;
try { LT = new Set([...LOCAL_TOOLS, ...(await (await import('./kbx_n32t.js')).localSet(env, lang))]); } catch (e) {}
const grp = P.G.map((g, gi) => $q.z + g.id + $t.k0 + (gi ? '40px' : '0') + $q.A + esc(t(lang, 'g_' + g.id)) + $t.k1 + g.L.map(x => {
const tr = (TOOLS[x.href] || {})[lang]; if (!tr) untr++;
const href = LT.has(x.href) ? pre(lang) + x.href : x.href, en = !LT.has(x.href);
const tag = x.tag ? $q.B + x.tc + '">' + esc(TAGS[x.tag] ? t(lang, TAGS[x.tag]) : x.tag) + $q.C : '';
return $q.D + (x.look ? ' look' : '') + $q.E + href + '"' + (en ? $q.F : '') + '>' + (tr ? esc(tr[0]) : x.name) + '</a>' + tag + $q.G + (tr ? esc(tr[1]) : x.desc) + (en ? $q.H + esc(t(lang, 'inen')) + $q.I : '') + $q.J;
}).join('') + $q.r).join('');
const jump = $q.K + esc(t(lang, $q.L)) + '">' + P.G.map(g => $q.M + g.id + '">' + esc(t(lang, 'g_' + g.id)) + $q.N + g.L.length + $q.O).join('') + $q.P;
const n = P.G.reduce((a, g) => a + g.L.length, 0);
return page(shell, lang, { title: t(lang, $q.Q), desc: t(lang, $q.R), h1: t(lang, $q.Q), lead: t(lang, $q.S), canon: ORIGIN + pre(lang) + $q.y, alt: altOf($q.y),
crumb: [[null, t(lang, 'tools')]], head: $q.T + esc(P.css) + '">', hero: $q.U + pre(lang) + $q.V + esc(t(lang, $q.W)) + '</a>' + ($t.o_T34[lang] || $t.o_T34.en).map((x, i) => $q.X + pre(lang) + [$q.Y, $q.Z, $q.aa][i] + '">' + esc(x) + '</a>').join('') + (T35[lang] || T35.en).map((x, i) => $q.X + pre(lang) + [$q.ab, $q.ac, $q.ad][i] + '">' + esc(x) + '</a>').join('') + '</p>' + jump,
body: $q.ae + grp + $q.af + n + $q.ag + untr + ' -->',
type: $q.ah });
}
const GL_RX = {
escrow: [/\bescrow\b/i], 'certid-o-permanente': [/certid[aã]o/i], ejido: [/\bejido/i, 'Mexico'], fideicomiso: [/fideicomiso/i, 'Mexico'], 'foreign-quota-thailand': [/foreign (?:freehold )?quota/i, 'Thailand'],
freehold: [/\bfreehold\b/i], 'hak-guna-bangunan-hgb': [/\bHGB\b|Hak Guna Bangunan/], 'hak-milik-shm': [/\bSHM\b|Hak Milik/], 'hak-pakai': [/Hak Pakai/i], leasehold: [/\bleasehold\b/i],
'milestone-payment': [/\bmilestones?\b|construction[- ]linked|tied to construction/i], nif: [/\bNIF\b/], oqood: [/\boqood\b/i], pbg: [/\bPBG\b/], ppat: [/\bPPAT\b/], 'pt-pma': [/\bPT\.? ?PMA\b/i],
'rental-yield': [/\byields?\b/i], rera: [/\bRERA\b/, 'UAE'], slf: [/\bSLF\b/], snagging: [/\bsnag/i], zoning: [/\bzon(?:ing|ed)\b/i]
};
let GX = null;
async function glossaryExamples(env) {
const ix = await N.data(env); if (GX && GX.ix === ix) return GX.M;
let top = []; try { const T = (await import('./kbx_g27.js')).TOP_IDS; top = Array.isArray(T) ? T : String(T).split(/\s+/); } catch (e) {}
const rank = new Map(top.map((id, i) => [id, i]));
const P = ix.P.filter(x => x.n && !COI_RX.test(x.n + ' ' + x.dv)).sort((a, b) => (rank.has(a.id) ? rank.get(a.id) : 1e6) - (rank.has(b.id) ? rank.get(b.id) : 1e6) || String(a.id).localeCompare(b.id));
const M = new Map();
for (const [k, [rx, co]] of Object.entries(GL_RX)) {
const L = [], mks = new Set();
const neg = new RegExp($t.k2 + rx.source + ')', 'i');
for (const pass of [0, 1]) for (const x of P) {
if (L.length >= 3) break;
if (co && x.co !== co) continue; if (L.some(e => e.s === x.s)) continue;
const parts = [].concat(x.dl || [], Object.values(x.ev || {})).filter(s => typeof s === $q.ai);
const hit = parts.find(s => rx.test(s) && !N.OPINION_RX.test(s) && (pass === 1 || !neg.test(s))); if (!hit) continue;
if (mks.has(x.mk) && L.length < 2) continue;
const i = hit.search(rx); let a = Math.max(0, i - 60), b = Math.min(hit.length, i + 90);
while (a > 0 && hit[a - 1] !== ' ') a--; while (b < hit.length && hit[b] !== ' ') b++;
L.push({ s: x.s, n: x.n, mk: x.mk, q: (a > 0 ? '... ' : '') + hit.slice(a, b).trim() + (b < hit.length ? ' ...' : '') }); mks.add(x.mk);
}
if (L.length) M.set(k, L);
}
GX = { ix, M }; return M;
}
const exHtml = (L, lang) => L && L.length ? $q.aj + esc(t(lang, 'gl_ex')) + $q.ak + esc(t(lang, 'gl_ex')) + $q.al + L.map(e => $q.am + pre(lang) + $q.an + e.s + $q.ao + esc(e.n) + $q.ap + esc(mkName(e.mk, lang)) + $q.aq + ((e.q.match(/[\u0400-\u04FF]/g) || []).length > (e.q.match(/[A-Za-z]/g) || []).length ? 'ru' : 'en') + '">' + esc(e.q) + $q.ar).join('') + '</ul>' : '';
async function glossaryPage(u, env, shell, lang) {
const src = await asset(env, $q.as, 'text'); if (!src) return null;
const E = []; const rx = /<div class="gl" id="([^"]+)"><dt>([\s\S]*?)<\/dt><dd>([\s\S]*?)<\/dd><\/div>/g; let m;
while ((m = rx.exec(src))) E.push({ id: m[1], dt: m[2], dd: m[3] });
if (!E.length) return null;
let X = new Map(); try { X = await glossaryExamples(env); } catch (e) {}
const rows = E.map(e => { const tr = (GL[e.id] || {})[lang], mo = $t.o_GL_MORE[e.id];
return $q.at + e.id + $q.au + (tr ? esc(tr[0]) : e.dt) + $q.av + (tr ? esc(tr[1]) : e.dd.replace(/<a [^>]*>[\s\S]*?<\/a>/g, '')) + (mo ? $q.aw + pre(lang) + mo[0] + '">' + esc(t(lang, mo[1])) + '</a>' : '') + exHtml(X.get(e.id), lang) + $q.ax; }).join('');
const terms = E.map(e => { const tr = (GL[e.id] || {})[lang]; return { '@type': $q.ay, name: tr ? tr[0] : e.dt.replace(/<[^>]+>/g, ''), description: tr ? tr[1] : e.dd.replace(/<[^>]+>/g, '').trim(), url: ORIGIN + pre(lang) + $q.az + e.id }; });
return page(shell, lang, { title: t(lang, $q.aA), desc: t(lang, $q.aB), h1: t(lang, $q.aA), lead: t(lang, $q.aC), canon: ORIGIN + pre(lang) + $q.as, alt: altOf($q.as),
crumb: [[null, t(lang, 'gloss')]], body: $q.aD + rows + $q.aE + esc(t(lang, $q.aF)) + '</p>', type: $q.aG,
ld: [{ '@type': $q.aG, '@id': ORIGIN + pre(lang) + $q.aH, name: t(lang, $q.aA), hasDefinedTerm: terms }] });
}
export async function enStatic(u, r, env) {
if (!(await loadI18n(env))) return r;
if (!r || r.status !== 200 || !/text\/html/.test(r.headers.get($q.aI) || '')) return r;
const p = u.pathname, alts = LANGS.map(l => $q.aJ + l + $q.aK + ORIGIN + pre(l) + p + '">').join('') + $t.k3 + ORIGIN + p + '">';
let rw = new HTMLRewriter().on($q.aL, { element(e) { e.remove(); } }).on('head', { element(e) { e.append(alts, { html: true }); } });
if (p === $q.as) {
let X = new Map(); try { X = await glossaryExamples(env); } catch (e) {}
let gid = null; rw = rw.on($q.aM, { element(e) { gid = e.getAttribute('id'); } }).on($q.aN, { element(e) { const h = exHtml(X.get(gid), 'en'); if (h) e.append(h, { html: true }); } })
}
return rw.transform(r);
}
async function monthPage(u, env, shell, lang) {
const [pr, ix] = await Promise.all([asset(env, $q.aO, 'json'), N.data(env)]);
const days = ((pr && pr.days) || []).filter(d => d && d.d).sort((a, b) => a.d.localeCompare(b.d)); if (!days.length) return null;
const now = days[days.length - 1], mo = now.d.slice(0, 7), first = days.find(d => d.d.slice(0, 7) === mo) || now, moN = monthName(mo, lang);
const P = ix.P.filter(x => !COI_RX.test(String(x.n) + ' ' + String(x.dv)));
let permit = 0, hand = 0, over = 0, rev = 0, added = 0; const today = new Date();
for (const x of P) { const c = ix.caseBy.get(x.id) || {}; if ((c.checks || {}).permit === 2) permit++; if (N.handoverOf(ix, x)) hand++; if (N.overdueOf(ix, x, today)) over++; if (x.rw) rev++; if (String(x.ad || '').slice(0, 7) === mo) added++; }
const pc = v => num(v / P.length * 100, lang, 1) + ' %';
const ch = (a, b) => { if (a == null || b == null) return '-'; const d = a - b; return (d > 0 ? '+' : d < 0 ? '−' : '') + num(Math.abs(d), lang); };
const K = [[$q.aP, $q.aQ], [$q.aR, $q.aS], [$q.aT, $q.aU], [$q.aV, $q.aW], [$q.aX, $q.aY], [$q.aZ, $q.ba]];
const t1 = $t.k4 + esc(t(lang, 'm_now')) + ' (' + esc(fdt(now.d, lang)) + $q.bb + esc(t(lang, $q.bc, { d: fdt(first.d, lang) })) + $q.bd + esc(t(lang, 'm_ch')) + $q.be +
K.map(([l, k]) => $q.bf + esc(t(lang, l)) + $q.bg + (now[k] != null ? num(now[k], lang) : '-') + $q.bh + (first[k] != null ? num(first[k], lang) : '-') + $q.bh + ch(now[k], first[k]) + $q.bi).join('') + $q.bj;
const Q = [[$q.bk, permit], [$q.bl, hand], [$q.bm, over], ['m_rev', rev]];
const t2 = $t.k5 + Q.map(([l, v]) => $q.bf + esc(t(lang, l)) + $q.bg + num(v, lang) + $q.bh + pc(v) + $q.bi).join('') +
$q.bf + esc(t(lang, $q.bn, { mo: moN })) + $q.bg + num(added, lang) + $t.k6 + esc(t(lang, $q.bo, { n: num(P.length, lang) })) + $q.aw + pre(lang) + $t.k7 + pre(lang) + $t.k8 + pre(lang) + $q.bp;
const byMo = new Map(); for (const d of days) byMo.set(d.d.slice(0, 7), d);
const past = [...byMo.entries()].filter(([m]) => m !== mo).reverse();
const t3 = past.length ? $t.k9 + esc(t(lang, $q.bq)) + '</th>' + K.map(([l]) => $q.br + esc(t(lang, l)) + '</th>').join('') + $q.bs + past.map(([m, d]) => $q.bf + esc(monthName(m, lang)) + ' (' + esc(fdt(d.d, lang)) + $q.bt + K.map(([, k]) => $q.bu + (d[k] != null ? num(d[k], lang) : '-') + '</td>').join('') + '</tr>').join('') + $q.bj : '<p>' + esc(t(lang, $q.bv)) + '</p>';
const rd = fdt(new Date().toISOString().slice(0, 10), lang);
const body = '<h2>' + esc(moN) + '</h2>' + t1 + '<h2>' + esc(t(lang, $q.bw)) + '</h2>' + t2 + '<h2>' + esc(t(lang, $q.bx)) + $q.by + esc(t(lang, $q.bz)) + '</p>' + t3 +
$q.bA + esc(t(lang, 'm_src', { d: rd })) + $s.k0 + esc(t(lang, $q.bB, { mo: moN, d: rd })) + $q.aw + pre(lang) + $q.bC;
return page(shell, lang, { title: t(lang, $q.bD, { mo: moN }), desc: t(lang, $q.bE, { mo: moN }), h1: t(lang, $q.bD, { mo: moN }), lead: t(lang, $q.bF), canon: ORIGIN + pre(lang) + $q.bG, alt: altOf($q.bG),
crumb: [[pre(lang) + $q.bH, t(lang, $q.bI)], [null, moN]], body, mod: now.d, type: $q.bJ,
ld: [{ '@type': $q.bK, name: t(lang, $q.bD, { mo: moN }), description: t(lang, $q.bF) || t(lang, $q.bD, { mo: moN }), url: ORIGIN + pre(lang) + $q.bG, license: $t.k10, creator: { '@type': $q.bL, name: $q.w, url: ORIGIN + '/' }, dateModified: now.d, temporalCoverage: mo, distribution: [{ '@type': $q.bM, encodingFormat: $q.bN, contentUrl: ORIGIN + $q.aO }] }] });
}
function codeBlocks(slug) {
const p = $q.bO + slug, c = $t.k11, s = $q.bP;
return [
['d_ex1', $q.bQ + p + '\n', $t.k12 + p + $t.k13, $q.bR + p + $t.k14],
['d_ex2', $q.bS + c + '"\n', $t.k15 + c + $s.k1, $q.bT + c + $s.k2],
['d_ex3', $q.bQ + s + '\n', $t.k16 + s + $t.k17, $q.bU + s + $q.bV]
];
}
async function docsPage(u, env, shell, lang) {
const P = lang === 'en' ? '' : pre(lang);
const card = (h, p, links) => $q.bW + esc(h) + $q.G + esc(p) + $q.bX + links.map(([href, l, en]) => $q.m + href + '"' + (en && lang !== 'en' ? $q.F : '') + '>' + esc(l) + '</a>').join(' · ') + (h === t(lang, 'd_mcp') ? $t.k18 : '') + $q.J;
const cards = $q.bY +
card(t(lang, 'd_api'), t(lang, $q.bZ), [[P + $q.ca, $q.ca], [$q.cb, $q.cc], [P + $q.cd, $q.cd]]) +
card(t(lang, 'd_mcp'), t(lang, $q.ce), [[$q.cf, $q.cf, 1]]) +
card(t(lang, 'd_wid'), t(lang, $q.cg), [[P + $q.ch, $q.ch]]) +
card(t(lang, 'd_sdk'), t(lang, $q.ci), [[$q.cj, $q.cj, 1]]) +
card(t(lang, $q.ck), t(lang, $q.cl), [[$q.cm, $q.cm, 1]]) +
card(t(lang, $q.cn), t(lang, $q.co), [[$q.cp, $q.cp, 1], [$q.cq, $q.cr], [$q.cs, $q.ct]]) + $q.r;
const ex = codeBlocks($q.cu).map(([k, sh, py, js]) => '<h3>' + esc(t(lang, k)) + $t.k19 + esc(sh) + $t.k20 + esc(py) + $t.k21 + esc(js) + $q.cv).join('');
const body = cards + $q.cw + esc(t(lang, 'd_ex')) + $q.cx + esc(t(lang, $q.cy)) + '</p>' + ex + $q.bA + esc(t(lang, 'd_lim')) + '</p>';
return page(shell, lang, { title: t(lang, $q.cz), desc: t(lang, $q.cA), h1: t(lang, $q.cz), lead: t(lang, $q.cB), canon: ORIGIN + pre(lang) + $q.cC, alt: altOf($q.cC), crumb: [[null, t(lang, 'docs')]], body, type: $q.cD });
}
const NOTES = [
{ s: 'overdue-handovers', d: '2026-11-18', h: 'How we decide that a handover date has passed', l: 'The rule behind the overdue notices, the monthly overdue report and the slippage statistics, and what it cannot tell you.',
b: () => '<p>Every project page shows the handover date we hold on record, with its source. A date is a month, a quarter, a half or a year, as the developer or listing printed it. To compare it with today we turn it into its <b>last</b> month: a year counts from December, a quarter from its third month ("Q3 2026" ends in September 2026), a half from June or December. Giving the developer the whole period means we never call a date passed too early.</p>' +
      '<p>A date has <b>passed</b> when that last month is before the current month and the project is not recorded as completed. A promise recorded as kept is also left out. The number of months past is the current month minus that last month. The same function feeds the notice at the top of a project page, its quick answer and title, and the <a href="/handover/overdue/">overdue report by place</a>, so the figures cannot disagree between pages.</p>' +
      '<p>The <a href="/methods/handover-slippage/">handover slippage statistics</a> use a stricter starting point: the <b>first</b> date on record (the developer\'s original date where our research found one), so a date moved later does not hide lateness. When two sources were read on the same day with different dates, the later one is used, so lateness is not overstated. Medians and quartiles are shown for a market only from 5 projects past their first date.</p>' +
      '<p><b>Limits.</b> We hold the dates developers and listings published, not the contracts. A project past its first date may be on time against a later date the developer announced; the project page shows both. We have no completion date for completed projects, so they are counted but not measured. Finished projects that stopped marketing are under-represented, because we track projects being sold now.</p>' },
{ s: 'sitemaps-and-crawlers', d: '2026-11-18', h: 'How we choose and check the URLs in our sitemaps', l: 'Which pages we list for search engines, how we check that each one answers, and how we test that crawlers and answer engines can read them.',
b: c => '<p>Every page stays reachable, but the sitemaps list only pages with something of their own: project pages with at least two of six basic facts, developer pages, place and market files, rankings, guides and data pages. A page is never marked noindex because it is thin; we add data to it instead. Each URL carries the date its content last changed (lastmod), computed from the data behind the page, not the date of the build.</p>' +
      (c && c.crawl ? '<p><b>Every URL answers.</b> On ' + esc(c.crawl.checked_at) + ' we requested ' + (c.crawl.sampled ? 'a random sample of ' + nmf('en').format(c.crawl.urls) + ' of the ' + nmf('en').format(c.crawl.listed_urls) + ' URLs' : 'all ' + nmf('en').format(c.crawl.urls) + ' URLs') + ' listed in our ' + c.crawl.sitemaps + ' sitemaps, a few at a time: ' + Object.entries(c.crawl.status_counts).map(([k, v]) => nmf('en').format(v) + ' answered ' + esc(k)).join(', ') + '. ' + (c.crawl.without_lastmod ? nmf('en').format(c.crawl.without_lastmod) + ' URLs had no lastmod. ' : 'Every URL had a lastmod. ') + (c.crawl.not_200 && c.crawl.not_200.length ? 'The ones that did not answer 200 are listed in <a href="/data/seo-checks.json">/data/seo-checks.json</a> and are being fixed.' : '') + '</p>' : '') +
      (c && c.nojs ? '<p><b>Without JavaScript.</b> Search engines and answer engines often read the HTML as served. For the pages added on 17 and 18 November 2026 in 8 languages we fetched the raw HTML and checked that the title, the description, the h1, the canonical link and the main text are there before any script runs: ' + nmf('en').format(c.nojs.ok) + ' of ' + nmf('en').format(c.nojs.n) + ' pages passed' + (c.nojs.fail && c.nojs.fail.length ? '; the others are listed in <a href="/data/seo-checks.json">/data/seo-checks.json</a>' : '') + '.</p>' : '') +
      (c && c.crawlers ? '<p><b>Answer-engine crawlers are not blocked.</b> Our <a href="/robots.txt">robots.txt</a> allows every crawler on public pages. On ' + esc(c.crawlers.checked_at) + ' we requested the home page, a project page, /llms.txt, an answer file and the open dataset with the user agents of ' + c.crawlers.agents.map(esc).join(', ') + ': ' + (c.crawlers.blocked ? nmf('en').format(c.crawlers.blocked) + ' requests were refused.' : 'all answered 200.') + ' This tests our rules and the edge in front of the site, not the IP checks a crawler operator may run.</p>' : '') +
      '<p>Visits by answer-engine crawlers per day and by page type are counted at the edge without storing anything about the visitor; see <a href="/engineering/#ai-crawlers">/engineering/</a>.</p>' }
];
async function notesPage(u, env, shell) {
const m = /^\/engineering\/notes(?:\/([a-z0-9-]{3,60}))?\/?$/.exec(u.pathname), s = m && m[1];
if (s) {
const n = NOTES.find(x => x.s === s); if (!n) return null;
const c = await asset(env, $q.cE, 'json', 300000);
return page(shell, 'en', { title: n.h, desc: n.l, h1: n.h, lead: n.l, canon: ORIGIN + $q.cF + s + '/', alt: () => ORIGIN + $q.cF + s + '/', enOnly: true, crumb: [[$q.cG, $q.cH], [$q.cF, 'Notes'], [null, n.h]],
body: $q.bA + esc(fdt(n.d, 'en')) + '</p>' + n.b(c) + $t.k22, type: $q.cD, mod: n.d,
ld: [{ '@type': $q.cD, headline: n.h, datePublished: n.d, dateModified: n.d, author: { '@type': $q.bL, name: $q.w }, url: ORIGIN + $q.cF + s + '/' }] });
}
return page(shell, 'en', { title: $q.cI, desc: $s.k3, h1: $q.cI, lead: $t.k23, canon: ORIGIN + $q.cF, alt: () => ORIGIN + $q.cF, enOnly: true, crumb: [[$q.cG, $q.cH], [null, 'Notes']],
body: '<ul>' + NOTES.map(n => $q.cJ + n.s + '/">' + esc(n.h) + $q.cK + esc(fdt(n.d, 'en')) + $q.cL + esc(n.l) + '</li>').join('') + '</ul>', type: $q.ah });
}
let TOPM = null;
async function topByMk(env) {
const ix = await N.data(env); if (TOPM && TOPM.ix === ix) return TOPM.M;
let ids = []; try { const T = (await import('./kbx_g27.js')).TOP_IDS; ids = Array.isArray(T) ? T : String(T).split(/\s+/); } catch (e) {}
const M = new Map(); for (const id of ids) { const x = ix.byId.get(id); if (!x || COI_RX.test(String(x.n) + ' ' + String(x.dv))) continue; if (!M.has(x.mk)) M.set(x.mk, []); M.get(x.mk).push(x); }
TOPM = { ix, M }; return M;
}
function placeOf(p) {
let m;
if ((m = /^\/guides\/buying-off-plan\/([a-z-]+)\/$/.exec(p))) { const mks = $t.o_GUIDE[m[1]]; if (!mks) return null; return { mks, tr: TR_PLACES.find(P => !P.coi && !P.a && P.s === slugA(mks[0])) || TR_PLACES.find(P => !P.coi && !P.a && P.m.some(k => mks.includes(k))), name: mks[0] }; }
if ((m = /^\/rankings\/transparency\/([a-z0-9-]+)\/$/.exec(p))) { const P = TR_PLACES.find(q => q.s === m[1] && !q.coi); return P ? { mks: P.m, tr: P, name: P.n } : null; }
if ((m = /^\/handover\/20\d\d\/([a-z0-9-]+)\/$/.exec(p))) { const P = TR_PLACES.find(q => q.s === m[1] && !q.coi); return { slug: m[1], tr: P, mks: P ? P.m : null, name: P ? P.n : null }; }
if ((m = /^\/m\/([^/]+)\/$/.exec(p))) { let k = m[1]; try { k = decodeURIComponent(k); } catch (e) {} const P = TR_PLACES.find(q => !q.coi && !q.a && q.s === slugA(k)) || TR_PLACES.find(q => !q.coi && !q.a && q.m.some(x => slugA(x) === slugA(k))); return { tr: P, mks: null, name: null, mOnly: true }; }
return null;
}
export async function inject(req, u, env, r) {
if (req.method !== 'GET' || !r || r.status !== 200 || !/text\/html/.test(r.headers.get($q.aI) || '')) return r;
if (!(await loadI18n(env))) return r;
const lm = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(.*)$/.exec(u.pathname), lang = lm[1] || 'en', p = '/' + lm[2].replace(/\/?$/, '/');
if (/^\/developers\//.test(p)) return r;
let pl = null; try { pl = placeOf(p); } catch (e) {}
const wk = pl && pl.tr ? pl.tr : null;
const head = (wk ? $t.k24 + esc(t(lang, $q.cM, { p: mkName(wk.n, lang) })) + $q.cN + wk.s + $q.cO : '') + $t.k25 + esc(t(lang, $q.cP)) + $q.cQ;
const line = $t.k26 + esc(t(lang, 'fd_h')) + $q.cR + (wk ? $q.m + pre(lang) + $q.cS + wk.s + '/">' + esc(t(lang, $q.cM, { p: mkName(wk.n, lang) })) + $q.cT + wk.s + $q.cU : '') + $q.cV + esc(t(lang, $q.cP)) + $q.cW + esc(t(lang, $q.cX)) + $q.cY;
let ms = '';
if (pl && pl.mks && !pl.mOnly) {
try { const M = await topByMk(env), L = [].concat(...pl.mks.map(k => M.get(k) || [])).slice(0, 24);
if (L.length) ms = $t.k27 + esc(t(lang, 'ms_h', { p: mkName(pl.name || pl.mks[0], lang) })) + $q.cx + esc(t(lang, 'ms_p', { p: mkName(pl.name || pl.mks[0], lang) })) + $t.k28 + L.map(x => $t.k29 + pre(lang) + $q.an + x.s + $q.ao + esc(x.n) + $q.cZ).join('') + $q.da; } catch (e) {}
}
return new HTMLRewriter().on('head', { element(e) { e.append(head, { html: true }); } }).on('main', { element(e) { e.append(ms + line, { html: true }); } }).transform(r);
}
export async function handle(req, u, env, ctx, shell) {
const p = u.pathname;
if (!/\.md$/.test(p) && !(await loadI18n(env))) return null;
let m = /^\/projects\/([a-z0-9-]{1,90})\.md$/.exec(p);
if (m) {
const C = await import('./kbx_cite.js'), au = new URL($q.db + m[1] + '.md', u);
const r = await C.handle(new Request(au, { method: 'GET', headers: req.headers }), au, env, ctx, shell); if (!r || r.status !== 200) return null;
const h = new Headers(r.headers); h.set($q.aI, $q.dc); h.set('link', '<' + ORIGIN + $q.an + m[1] + $q.dd); h.set($q.de, '*');
return new Response(r.body, { status: 200, headers: h });
}
if (!p.endsWith('/')) return Response.redirect(ORIGIN + p + '/' + u.search, 301);
m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(.*?)\/$/.exec(p); const lang = m[1] || 'en', what = m[2];
try {
if (what === 'tools') return await toolsHub(u, env, shell, lang);
if (what === $q.df) return await glossaryPage(u, env, shell, lang);
if (what === $q.dg) return await monthPage(u, env, shell, lang);
if (what === 'docs') return await docsPage(u, env, shell, lang);
if (/^engineering\/notes/.test(what)) return await notesPage(u, env, shell);
} catch (e) { return null; }
return null;
}
