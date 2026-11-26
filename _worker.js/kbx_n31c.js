// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_n31c__q, $s = TB.kbx_n31c__s, $t = TB.kbx_n31c__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const pre = l => l === 'en' ? '' : '/' + l;
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.a, "'": '&#39;' }[c]));
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
const nf = (n, l, d) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { maximumFractionDigits: d == null ? 0 : d, numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); } };
const fdt = (d, l) => { if (!d) return ''; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { day: $q.b, month: 'short', year: $q.b, timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(String(d).slice(0, 10) + $q.c)); } catch (e) { return d; } };
const bdi = t => '<bdi>' + esc(t) + $q.d;
let TP = null;
export function loadT(env) {
if (DL) return Promise.resolve(true);
if (!TP) TP = (async () => {
let T = null;
try { if (env && env.ASSETS) { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.e)); if (r.ok) T = await r.json(); } } catch (e) {}
if (!T) { try { const r = await fetch(ORIGIN + $q.f, { cf: { cacheTtl: 300 } }); if (r.ok) T = await r.json(); } catch (e) {} }
if (T) ({ DL, WB, WB_ALL, G, RULE, S, FR } = T); else TP = null;
return !!T;
})();
return TP;
}
export const DEV_ALIAS = {
'aldar-properties-pjsc': 'aldar-properties', 'arada-developments-l-l-c-s-o-c': 'arada', 'azizi-developments-l-l-c': 'azizi-developments', 'berjaya-land-bhd': 'berjaya-land-berhad',
'breig-property-development': 'breig-property', 'danube-properties-development-l-l-c': 'danube-properties', 'dar-global-plc': 'dar-global', emaar: 'emaar-properties', danube: 'danube-properties', aldar: 'aldar-properties', sobha: 'sobha-realty', damac: 'damac-properties', azizi: 'azizi-developments', binghatti: 'binghatti-developers', ellington: 'ellington-properties', samana: 'samana-developers', imtiaz: 'imtiaz-developments',
'investland-bali-properties': 'investland-bali', 'lamda-development-s-a': 'lamda-development', 'magnum-estate-international': 'magnum-estate', 'metrovacesa-s-a': 'metrovacesa',
'modon-properties-pjsc': 'modon', 'rak-properties-pjsc': 'rak-properties', 'range-developments-group': 'range-developments', 'sansiri-pcl': 'sansiri',
'sansiri-public-company-limited': 'sansiri', 'sumitomo-realty-development-co-ltd': 'sumitomo-realty-development', 'taraf-development-l-l-c': 'taraf', cyrela: 'cyrela-brazil-realty',
'the-related-group': 'related-group', 'abitarein-s-p-a': 'abitare-in-s-p-a', 'cps-africa': 'cps', 'banyan-group': 'banyan-group-residences',
'origin-property-pcl': 'origin-property-public-company-limited', 'ornsirin-group': 'ornsirin-holding-pcl', 'sc-asset-corporation-pcl': 'sc-asset-corporation-plc', 'rhom-bho-property-pcl': 'rhom-bho-property-plc'
};
export const PROJ_ALIAS = { 'eaton-park-gamuda-land': 'eaton-park-thu-duc-hcmc', 'pavilion-damansara-heights-phase-2-imperial-residences-and-r': 'pavilion-damansara-heights-phase-2-jendela-mayang' };
const AL_RX = /^(\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:projects|developers)\/|\/api\/v1\/(?:projects|developers)\/|\/answers\/developer\/)([a-z0-9-]{1,90})(\/.*|\.md|\.csv)?$/;
let LIVE = null;
export function setLive(a) { if (a && typeof a === $q.g) LIVE = a; }
export function aliasOf(kind, slug) {
const m = kind === $q.h ? DEV_ALIAS : PROJ_ALIAS, l = LIVE && LIVE[kind];
return m[slug] || (l && l[slug]) || null;
}
export function aliasRedirect(u) {
const m = AL_RX.exec(u.pathname); if (!m) return null;
const kind = /developer/.test(m[1]) ? $q.h : $q.i, to = aliasOf(kind, m[2]);
if (!to) return null;
return new Response(null, { status: 301, headers: { location: m[1] + to + (m[3] || '') + u.search, 'cache-control': $q.j, 'x-kb-alias': m[2] } });
}
export function aliasesFor(slug) { return [...new Set(Object.entries(DEV_ALIAS).concat(Object.entries((LIVE && LIVE.developers) || {})).filter(([, v]) => v === slug).map(([k]) => k))].sort(); }
let DL = null;
export function dldKf(x, lang) {
const r = x && x.fx && x.fx.dld; if (!r || !r.src || !DL) return '';
const L = DL[lang] || DL.en, parts = [];
if (r.no) parts.push(esc(fill(L.no, { n: r.no })) + (r.st ? $q.k + esc(r.st) + $q.l : ''));
if (r.pct != null && r.pd) parts.push(esc(fill(L.built, { p: nf(r.pct, lang, 2), d: fdt(r.pd, lang) })));
if (r.bank) parts.push(esc(fill(L.bank, { b: '' })) + $q.m + esc(r.bank) + $q.l);
if (r.units) parts.push(esc(fill(L.units, { u: nf(r.units, lang) })));
if (r.comp) parts.push(esc(fill(L.comp, { d: fdt(r.comp, lang) })));
if (r.reg || r.start) parts.push([r.reg ? esc(fill(L.reg, { d: fdt(r.reg, lang) })) : '', r.start ? esc(fill(L.start, { d: fdt(r.start, lang) })) : ''].filter(Boolean).join(' · '));
if (!parts.length) return '';
let h = ''; try { h = new URL(r.src).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
return $q.n + esc(L.k) + $q.o + parts.join('<br>') + $q.p + esc(r.src) + $t.k0 + esc(h) + $q.q;
}
let WB = null;
let WB_ALL = null;
const ts2d = t => /^\d{8}/.test(String(t || '')) ? t.slice(0, 4) + '-' + t.slice(4, 6) + '-' + t.slice(6, 8) : null;
export function wbLine(wb, x, lang) {
const r = wb && x && wb.pages && wb.pages[x.url]; if (!r || !r.f || !WB) return '';
const a = ts2d(r.f), b = ts2d(r.l || r.f); if (!a) return '';
const link = (t, label) => $q.r + esc(t) + '/' + esc(x.url) + $q.s + esc(label) + '</a>';
return $q.t + fill(esc(WB[lang] || WB.en), { a: link(r.f, fdt(a, lang)), b: link(r.l || r.f, fdt(b, lang)) }) + $t.k1 + esc(x.url) + $t.k2 + esc(WB_ALL[lang] || WB_ALL.en) + $q.u;
}
const GF = ['pin', 'pn', 'co', 'pay', 'prog', 'price', 'ho'];
const GW = { pin: 3, pn: 3, co: 2, pay: 2, prog: 2, price: 1, ho: 1 };
let G = null;
let RULE = null;
const has = v => v != null && v !== '' && !(Array.isArray(v) && !v.length);
function fieldOk(ix, x, k) {
const fx = x.fx || {}, c = ix.caseBy.get(x.id) || {};
switch (k) {
case 'pin': return has(fx.lat) && has(fx.lng);
case 'pn': return has(x.pn);
case 'co': return has(fx.developer_company) || !!(c.verified && c.verified.record && c.verified.record !== 'none');
case 'pay': return has(fx.payment_plan);
case 'prog': return (c.checks || {}).progress != null || (fx.dld && fx.dld.pct != null);
case 'price': return has(fx.price_min);
case 'ho': return has(fx.handover_promised) || has(c.done);
}
return false;
}
const GAPS = new WeakMap();
export function gaps(ix) {
let g = GAPS.get(ix); if (g) return g;
const M = new Map();
for (const x of ix.P) {
const m = M.get(x.mk) || { market: x.mk, country: x.co, projects: 0, missing: Object.fromEntries(GF.map(k => [k, 0])) };
m.projects++; for (const k of GF) if (!fieldOk(ix, x, k)) m.missing[k]++; M.set(x.mk, m);
}
g = [...M.values()].filter(m => m.projects >= 10).map(m => Object.assign(m, { next: GF.map(k => [k, m.missing[k], m.missing[k] * GW[k]]).filter(a => a[1] > 0).sort((a, b) => b[2] - a[2] || b[1] - a[1]).slice(0, 3).map(a => [a[0], a[1]]) }))
.sort((a, b) => b.next.reduce((s, n) => s + n[1] * GW[n[0]], 0) - a.next.reduce((s, n) => s + n[1] * GW[n[0]], 0));
GAPS.set(ix, g); return g;
}
export function dqJson(ix) {
const qa = (ix.named && ix.named.qa) || null, al = (ix.named && ix.named.aliases) || { developers: DEV_ALIAS, projects: PROJ_ALIAS };
return {
gaps: { method: $s.k0, weights: GW, places: gaps(ix).map(m => ({ market: m.market, country: m.country, projects: m.projects, missing: m.missing, next: m.next.map(a => a[0]) })) },
validation: qa ? { checked: qa.checked, records: qa.records, held: qa.held, counts: qa.counts || {}, rules: qa.rules, issues: (qa.issues || []).slice(0, 500).map(i => ({ id: i[0], rule: i[1], field: i[2], value: i[3] })) } : null,
aliases: { developers: al.developers || {}, projects: al.projects || {}, rule: $t.k3 }
};
}
export function dqExtra(ix, lang) {
if (!G) return '';
const L = G[lang] || G.en, P = pre(lang), byId = ix.byId;
const g = gaps(ix);
const grow = g.map(m => $q.v + bdi(m.market) + $q.w + nf(m.projects, lang) + $q.x + m.next.map(a => esc(fill(L.miss, { f: L.f[a[0]], n: nf(a[1], lang) }))).join('<br>') + $q.y).join('');
let h = $q.z + esc(L.h) + $q.A + esc(L.lead) + $t.k4 + L.th.map(t => $q.B + esc(t) + '</th>').join('') + $q.C + grow + $q.D;
const qa = ix.named && ix.named.qa;
if (qa && qa.rules) {
const cnt = qa.counts || {};
const vrow = Object.entries(qa.rules).map(([k, r]) => $q.v + esc((RULE[k] || {})[lang] || (RULE[k] || {}).en || r[1]) + $q.w + esc(L.vk[r[0]] || r[0]) + $q.x + nf(cnt[k] || 0, lang) + $q.y).join('');
const items = (qa.issues || []).filter(i => byId.has(i[0])).slice(0, 40).map(i => { const x = byId.get(i[0]); return $q.E + P + $q.F + esc(x.s) + '/">' + bdi(x.n) + $q.G + bdi(x.mk) + $q.H + esc((RULE[i[1]] || {})[lang] || i[1]) + (i[3] != null ? $q.I + esc(String(i[3])) + $q.J : '') + '</li>'; }).join('');
h += $q.K + esc(L.vh) + $q.A + esc(fill(L.vlead, { d: fdt(qa.checked, lang), n: nf(qa.records, lang) })) + $t.k5 + L.vth.map(t => $q.B + esc(t) + '</th>').join('') + $q.C + vrow + $q.D +
(items ? '<h3>' + esc(L.vlist) + $q.L + items + '</ul>' : '');
}
const al = (ix.named && ix.named.aliases) || { developers: DEV_ALIAS, projects: PROJ_ALIAS };
const arow = [...Object.entries(al.projects || {}).map(([a, b]) => [P + $q.F + a + '/', P + $q.F + b + '/']), ...Object.entries(al.developers || {}).filter(([, b]) => ix.devs.has(b)).map(([a, b]) => [P + $q.M + a + '/', P + $q.M + b + '/'])]
.map(([a, b]) => $q.N + esc(a) + $q.O + esc(b) + '">' + esc(b) + $q.P).join('');
if (arow) h += $q.Q + esc(L.ah) + $q.A + esc(L.alead) + $t.k6 + L.ath.map(t => $q.B + esc(t) + '</th>').join('') + $q.C + arow + $q.D;
return h;
}
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?stalled\/?$|^\/api\/v1\/stalled$/;
let S = null;
async function loadPub(env, name) {
const c = (globalThis.__kbN31 = globalThis.__kbN31 || {});
if (c[name] && Date.now() - c[name].t < 600000) return c[name].v;
let v = null;
try {
let r = null; try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + $q.R + name)); } catch (e) { r = null; }
if (!r || !r.ok) r = await fetch(ORIGIN + $q.S + name, { cf: { cacheTtl: 300, cacheEverything: true } });
if (r.ok) v = await r.json();
} catch (e) { v = null; }
c[name] = { t: Date.now(), v }; return v;
}
export async function wayback(env) { await loadT(env); return loadPub(env, $q.T); }
let N = null;
async function named() { if (!N) N = await import('./kbx_named.js'); return N; }
export async function stalledList(env) {
await loadT(env);
const n = await named(), ix = await n.data(env), ss = await loadPub(env, $q.U), today = new Date().toISOString().slice(0, 10);
const A = [], B = [], C = [];
for (const x of ix.P) {
for (const f of x.fl || []) if (f[0] === $q.V && n.okHttp(f[1])) { A.push({ x, src: f[1] }); break; }
const d = x.fx && x.fx.dld;
if (d && d.comp && d.comp < today && d.pct != null && d.pct < 100 && d.pd && d.src) B.push({ x, d });
const sp = ss && ss.projects && ss.projects[x.id], ov = n.overdueOf(ix, x), ho = n.handoverOf(ix, x);
if (sp && sp.status === 'ok' && (sp.no_visible_change_months || 0) >= 6 && ov && ho) C.push({ x, sp, ov, ho });
}
B.sort((a, b) => a.d.pct - b.d.pct); C.sort((a, b) => b.sp.no_visible_change_months - a.sp.no_visible_change_months);
return { ix, n, A, B, C, updated: ix.updated };
}
async function stalledPage(env, shell, lang) {
await loadT(env);
const L = S[lang] || S.en, P = pre(lang), R = await stalledList(env), { n } = R;
const li = (x, inner, src) => { let h = ''; try { h = new URL(src).hostname.replace(/^www\./, ''); } catch (e) {} return $q.E + P + $q.F + esc(x.s) + '/">' + bdi(x.n) + $q.G + bdi(x.mk) + $q.W + inner + (src ? $q.p + esc(src) + $q.s + esc(h) + '</a>' : '') + '</li>'; };
const grp = (id, h, rows) => $q.X + id + '">' + esc(h) + $q.Y + esc(fill(L.n, { n: nf(rows.length, lang) })) + $q.Z + (rows.length ? $q.aa + rows.join('') + '</ul>' : '<p>' + esc(L.none) + '</p>');
const A = R.A.map(r => li(r.x, esc(L.la), r.src));
const B = R.B.map(r => li(r.x, esc(fill(L.lb, { d: fdt(r.d.comp, lang), p: nf(r.d.pct, lang, 2), i: fdt(r.d.pd, lang) })), r.d.src));
const C = R.C.map(r => li(r.x, esc(fill(L.lc, { h: n.fd(r.ho.d, lang), m: nf(r.ov.m, lang), n: nf(r.sp.no_visible_change_months, lang), d: fdt((r.sp.newest_clear_dates || []).slice(-1)[0], lang) })), null));
const canonU = ORIGIN + P + $q.ab, dir = lang === 'ar' ? $q.ac : '';
const body = $q.ad + dir + $t.k7 + P + $q.ae + esc(L.h1) + $q.af + esc(L.h1) + $q.ag + esc(L.lead) + $q.ah +
$q.ai + dir + $s.k1 +
$q.aj + esc(fill(L.upd, { d: fdt(R.updated, lang) })) + $t.k8 +
grp($q.ak, L.a, A) + grp($q.al, L.b, B) + grp('space', L.c, C) +
'<h2>' + esc(L.m_h) + $q.A + esc(L.method) + $q.am + esc(L.more) + $q.an + P + $q.ao + esc(L.ov) + $q.ap + esc(L.sat) + $q.aq + P + $q.ar + esc(L.dq) + $q.as;
const ld = { '@context': $q.at, '@graph': [{ '@type': $q.au, url: canonU, name: L.h1, description: L.lead.slice(0, 300), inLanguage: lang, dateModified: R.updated, isPartOf: { '@type': $q.av, name: $q.aw, url: ORIGIN + '/' } },
{ '@type': $q.ax, itemListElement: [{ '@type': $q.ay, position: 1, name: $q.aw, item: ORIGIN + P + '/' }, { '@type': $q.ay, position: 2, name: L.h1, item: canonU }] }] };
return n.assemble({ title: L.t + $q.az, desc: L.lead.slice(0, 152).replace(/\s+\S*$/, '') + '...', canon: canonU, body, ld, lastmod: R.updated, alt: l => ORIGIN + pre(l) + $q.ab }, lang, await shell(P + $q.aA));
}
async function stalledJson(env) {
await loadT(env);
const R = await stalledList(env);
const one = x => ({ id: x.id, slug: x.s, name: x.n, market: x.mk, country: x.co, url: ORIGIN + $q.F + x.s + '/' });
return { api: $q.aB, updated: R.updated, method: S.en.method, licence: $t.k9,
reported_in_source: R.A.map(r => Object.assign(one(r.x), { source: r.src })),
register_date_passed: R.B.map(r => Object.assign(one(r.x), { register: $q.aC, completion_on_register: r.d.comp, built_pct: r.d.pct, inspection: r.d.pd, source: r.d.src })),
no_visible_change: R.C.map(r => Object.assign(one(r.x), { handover_on_record: r.ho.d, months_since: r.ov.m, no_visible_change_months: r.sp.no_visible_change_months, newest_clear_image: (r.sp.newest_clear_dates || []).slice(-1)[0] || null, source: ORIGIN + $q.aD })) };
}
export async function handle(req, u, env, ctx, shell) {
const p = u.pathname;
if (!PATHS.test(p) || (req.method !== 'GET' && req.method !== 'HEAD')) return null;
if (p === $q.aE) return new Response(JSON.stringify(await stalledJson(env), null, 1), { headers: { 'content-type': $q.aF, 'access-control-allow-origin': '*', 'cache-control': $q.aG } });
if (!p.endsWith('/')) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } });
const lang = (/^\/(es|de|fr|nl|ru|zh|ar)\//.exec(p) || [])[1] || 'en';
return new Response(await stalledPage(env, shell, lang), { headers: { 'content-type': $q.aH, 'cache-control': $q.aI, 'content-language': lang } });
}
const SL = { en: 'Stalled works and passed dates', es: 'Obras paradas y fechas vencidas', de: 'Stillstand und verstrichene Termine', fr: 'Chantiers à l’arrêt et dates dépassées', nl: 'Stilgevallen bouw en verstreken data', ru: 'Остановленные стройки и прошедшие сроки', zh: '停工与已过期限', ar: 'أعمال متوقفة ومواعيد فائتة' };
export const stalledLabel = lang => SL[lang] || SL.en;
export { LANGS };
let FR = null;
const fdym = (d, l) => /^\d{4}-\d{2}$/.test(String(d || '')) ? (() => { try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { month: 'long', year: $q.b, timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(d + $q.aJ)); } catch (e) { return d; } })() : fdt(d, l);
const money = (cur, v, l) => $q.aK + esc(cur) + ' ' + nf(v / 1e9, l, 1) + $q.aL;
export function finRtHtml(d, lang) {
if (!d || !FR) return '';
const L = FR[lang] || FR.en, src = (u, ) => { let h = ''; try { h = new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } return $q.aM + esc(u) + $q.aN + esc(h) + '</a>'; };
const out = [];
const f = d.fin;
if (f && f.rev && f.src) out.push(fill(esc(L.res), { y: esc(f.y), d: esc(fdt(f.d, lang)), rev: money(f.cur, f.rev, lang), np: f.np ? fill(esc(L.np), { v: money(f.cur, f.np, lang) }) : '', pbt: f.pbt ? fill(esc(L.pbt), { v: money(f.cur, f.pbt, lang) }) : '' }) + src(f.src));
for (const r of d.rt || []) if (r.src && r.r) out.push(fill(esc(L.rt), { d: esc(fdym(r.d, lang)), a: $q.m + esc(r.a) + $q.l, r: $q.aO + esc(r.r) + '</b>', o: esc(L.o[r.o] || r.o) }) + src(r.src));
if (!out.length) return '';
return out.map(s => $q.aP + s + '</li>').join('') + $q.aQ + esc(L.cav) + '</li>';
}
