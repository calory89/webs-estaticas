// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_u27__q, $s = TB.kbx_u27__s, $t = TB.kbx_u27__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { t30 } from './kbx_n30a.js';
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const COI_RX = /eco\s*beach\s*city|\bequinox\b/i;
export const U27V = 'u27p';
const pre = l => l === 'en' ? '' : '/' + l;
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.a, "'": '&#39;' }[c]));
const bdi = (lang, s) => lang === 'ar' ? '<bdi>' + esc(s) + $q.b : esc(s);
const S = TB.kbx_u27_S ;
export const t27 = (lang, k, v) => { let s = (S[lang] && S[lang][k] != null) ? S[lang][k] : S.en[k]; if (v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b); return s; };
export const secZ = (id, h, inner, lead) => $q.c + id + $t.k0 + h + '</h2>' + (lead ? $q.d + lead + '</p>' : '') + $q.e + inner + $q.f;
const LT2 = { en: ['Last checked {d}', '{n} sources', 'Next question to ask', 'All questions', '{n} source'], es: ['Última comprobación: {d}', '{n} fuentes', 'Siguiente pregunta', 'Todas las preguntas', '{n} fuente'],
fr: ['Dernière vérification : {d}', '{n} sources', 'Prochaine question à poser', 'Toutes les questions', '{n} source'], de: ['Zuletzt geprüft: {d}', '{n} Quellen', 'Nächste Frage', 'Alle Fragen', '{n} Quelle'],
nl: ['Laatst gecontroleerd: {d}', '{n} bronnen', 'Volgende vraag om te stellen', 'Alle vragen', '{n} bron'], ru: ['Последняя проверка: {d}', 'Источников: {n}', 'Следующий вопрос', 'Все вопросы'],
zh: ['最近核查：{d}', '{n} 个来源', '下一个要问的问题', '全部问题'], ar: ['آخر فحص: {d}', 'عدد المصادر: {n}', 'السؤال التالي', 'كل الأسئلة'] };
function nextQ(lang, P, o) {
const st = k => (P.find(p => p[0] === k) || [0, 0, ['nc']])[2][0], co = o.co || '', r0 = (o.regs || [])[0];
if (st($q.g) !== 'ok') return r0 ? esc(t27(lang, 'ck2')) + ' ' + esc(t27(lang, 'ck2r', { r: $q.h })).replace($q.h, '<bdi>' + esc(r0.n) + $q.b) : esc(t27(lang, 'ck2'));
if (st($q.i) !== 'ok') return esc(t27(lang, 'ck1', { co: $q.h })).replace($q.h, bdi(lang, co));
if (st('date') === 'no' || st('date') === 'part') return esc(t27(lang, 'ck7'));
if (st('build') !== 'ok') return esc(t27(lang, 'ck6'));
return esc(t27(lang, 'ck4'));
}
export function lightHtml(lang, o) {
const P = light6(o), L = LT2[lang] || LT2.en, f = (s, v) => s.replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
const meta = o.meta ? $q.j + (o.meta.d ? $q.k + esc(f(L[0], { d: o.meta.d })) + $q.l : '') + (o.meta.n ? $q.m + esc(f(String(o.meta.n).replace(/\D/g, '') === '1' && L[4] ? L[4] : L[1], { n: o.meta.n })) + '</a>' : '') + '</p>' : '';
const nq = o.meta ? $q.n + esc(L[2]) + $q.o + nextQ(lang, P, o.meta) + $q.l + (o.meta.q ? $q.p + esc(o.meta.q) + '">' + esc(L[3]) + '</a>' : '') + '</p>' : '';
return $q.q + (o.meta ? ' klt2' : '') + $q.r + esc(JSON.stringify(o.data || {})) + $t.k1 + esc(t27(lang, 'lt_h')) + '</p>' + meta + $q.s +
P.map(([k, sid, s]) => $q.t + s[0] + $q.u + sid + $q.v + esc(t27(lang, 'lt_' + k)) + $q.w + esc(t27(lang, s[1], s[2])) + $q.x).join('') +
'</ul>' + nq + $q.y + esc(t27(lang, $q.z)) + $q.e + keyHtml(lang) + $q.A;
}
export function light6(o) {
const it = {}; for (const i of ((o.tp && o.tp.items) || [])) it[i.k] = i.st;
const c = o.c || {}, ck = c.checks || {}, has = id => o.ids.includes(id);
const P = [];
P.push([$q.g, has($q.B) ? $q.B : 'legit', it.permitreg === 'yes' ? ['ok', 'p_reg'] : it.permit === 'yes' || o.pn ? ['ok', 'p_pub'] : ['no', 'p_no']]);
P.push([$q.i, has($q.C) ? $q.C : 'legit', it.register === 'yes' ? ['ok', 'c_reg'] : it.legal === 'yes' ? ['part', $q.D] : it.legal === 'no' ? ['no', 'c_no'] : ['nc', 'c_nc']]);
const rec = it.record, past = +c.overdue || 0;
let d;
if (past > 0) d = ['no', $q.E, { m: String(past) }];
else if (rec === 'yes' && o.mv && !/completed/.test(String(c.stage || ''))) d = ['part', $q.F];
else if (rec === 'yes') d = ['ok', /completed/.test(String(c.stage || '')) ? $q.G : $q.H];
else if (rec === 'part') d = ['part', /completed/.test(String(c.stage || '')) ? $q.I : $q.F];
else if (it.date === 'yes' || o.ho) d = ['ok', 'd_pub'];
else d = ['no', 'd_no'];
P.push(['date', $q.J, d]);
const sat = c.sat && c.sat.status;
P.push(['build', has('space') ? 'space' : $q.J, /completed/.test(String(c.stage || '')) ? ['ok', $q.K] : sat === $q.L ? ['ok', 'b_sat'] : sat ? ['part', $q.M] : ck.progress != null || (o.ev && o.ev.progress) ? ['part', 'b_dev'] : ['nc', 'b_nc']]);
const w = it.web; P.push(['web', has('web') ? 'web' : 'legit', w === 'yes' ? ['ok', 'w_yes'] : w === 'part' ? ['part', $q.N] : w === 'no' ? ['no', 'w_no'] : ['nc', 'w_nc']]);
const n = it.notices; P.push(['lists', 'legit', n === 'yes' ? ['ok', 'l_yes'] : n === 'part' ? ['ok', $q.O] : ['nc', 'l_nc']]);
return P;
}
function keyHtml(lang) {
const P = String(t27(lang, $q.P)).split(/(?<=[.。])\s*/).map(x => x.trim()).filter(Boolean);
if (P.length < 5) return '<p>' + esc(t27(lang, $q.P)) + '</p>';
return $q.Q + ['ok', 'part', 'no', 'nc'].map((k, i) => $q.t + k + $q.R + esc(P[i]) + '</li>').join('') + $q.S + esc(P.slice(4).join(' ')) + '</p>';
}
export function checklistHtml(lang, o) {
const co = o.co || '', L = [];
L.push(esc(t27(lang, 'ck1', { co: $q.h })).replace($q.h, bdi(lang, co)));
if ((o.regs || []).length) for (const r of o.regs) L.push(esc(t27(lang, 'ck2r', { r: $q.h })).replace($q.h, $q.T + esc(r.u) + $t.k2 + esc(r.n) + $q.U));
else L.push(esc(t27(lang, 'ck2')) + $t.k3);
for (const k of ['ck3', 'ck4', 'ck5', 'ck6', 'ck7']) L.push(esc(t27(lang, k)) + (k === 'ck5' ? $q.p + pre(lang) + $q.V + esc(t30(lang, 'cr_h1')) + '</a>' : ''));
L.push(esc(t27(lang, 'ck8', { co: $q.h })).replace($q.h, bdi(lang, co)) + (o.cost ? $q.W + esc(o.costLbl || '') + '</a>' : ''));
return $q.X + esc(o.id) + $q.Y + esc(t27(lang, 'ck_h', { co })) + $q.Z + esc(t27(lang, 'ck_i')) + $q.aa + esc(t27(lang, 'ck_n')) + $t.k4 +
L.map((h, i) => $t.k5 + i + $q.ab + h + $q.ac).join('') + $t.k6 + esc(t27(lang, 'ck_r')) + $q.ad + (o.s ? $q.ae + pre(lang) + $q.af + o.s + $q.ag + esc($t.o_JL35[lang] || $t.o_JL35.en) + $q.ah : '') + $q.ai;
}
export const Z_CSS = '';

export const CLIENT_JS = () => '(' + $q.F_client.toString() + ')();';   // n40 k46: a function (script text read from k46s.json)
export const PATHS = /^\/k\/u27\.js$|^\/api\/v1\/(?:cost|map)$|^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:map|updates)\/?$/;
const jr = (o, s, cc) => new Response(JSON.stringify(o), { status: s || 200, headers: { 'content-type': $q.aj, 'access-control-allow-origin': '*', 'cache-control': cc || $q.ak } });
const MAP3_V = '8729c66536';
const MAPV = { js: '/satellite/plot/vendor/leaflet-1.9.4.js?v=dc452946ac', css: '/satellite/plot/vendor/leaflet-1.9.4.css?v=b8273795a6' };
async function mapData(env, lang) {
const N = await import('./kbx_named.js'), T = await import('./kbx_tr.js'), H = await import('./kbx_hdate.js');
const ix = await N.data(env); let tr = null; try { tr = await T.trData(env); } catch (e) {}
let ot = null; try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.al)); if (r.ok) ot = await r.json(); } catch (e) {}
const ym = s => { const m = /^(\d{4})-(\d{2})/.exec(s || ''); return m ? +m[1] * 12 + (+m[2] - 1) : null; }, nowM = ot ? ym(ot.as_of_month) : null; let nLate = 0;
const lateOf = id => { const r = ot && ot.projects && ot.projects[id]; if (!r || !r.first || nowM == null || /^done|completed/.test(r.s || '')) return null; const d = nowM - ym(r.first); return d > 0 ? d : null; };
let mp = null; try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.am)); if (r.ok) mp = ((await r.json()) || {}).market_points; } catch (e) {}
const mk = {}; for (const [k, v] of Object.entries((mp && mp.markets) || {})) if (v && isFinite(v.lat) && isFinite(v.lng)) mk[k] = [Math.round(v.lat * 100) / 100, Math.round(v.lng * 100) / 100];
let G = null; try { const R = await import('./kbx_n37u.js'); G = await R.regMap(env); } catch (e) { G = null; }
const P = [], co = new Map(), yrs = new Set();
for (const x of ix.P) {
if (COI_RX.test(String(x.n || '') + ' ' + String(x.dv || ''))) continue;
const fx = x.fx || {}, c = ix.caseBy.get(x.id) || {}, h = N.handoverOf(ix, x), m = h && /(20\d\d)/.exec(String(h.d)), y = m ? +m[1] : null, row = tr && tr.rows.get(x.id);
const pin = typeof fx.lat === $q.an && typeof fx.lng === $q.an;
if (y) yrs.add(y);
co.set(x.co, (co.get(x.co) || 0) + 1);
const lt = lateOf(x.id); if (lt) nLate++;
P.push([x.s, x.n, x.mk, x.co, pin ? Math.round(fx.lat * 1e4) / 1e4 : null, pin ? Math.round(fx.lng * 1e4) / 1e4 : null, y, x.pn || (c.checks || {}).permit === 2 ? 1 : 0, row ? row.score : null, lt, G ? G.get(x.s) || 0 : null]);
}
const coL = [...co.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => [k, H.placeName(k, lang), n]);
return { updated: String(ix.updated || '').slice(0, 10), keys: ['slug', 'name', $q.ao, $q.ap, 'lat', 'lng', $q.aq, $q.ar, $q.as, $q.at, $q.au], mk,
delay: { n: nLate, as_of: ot ? ot.as_of_month : null, source: $q.av, rule: $s.k0 }, co: coL, yr: [...yrs].sort(), p: P,
note: $s.k1 };
}
async function mapPage(req, u, env, ctx, shell, lang) {
const N = await import('./kbx_named.js'), H = await import('./kbx_hdate.js'), N30 = await import('./kbx_n30c.js');
const P = pre(lang), canon = ORIGIN + P + '/map/';
let pre47 = ''; try { const ix = await N.data(env), mc = new Map(); for (const x of ix.P) { if (COI_RX.test(String(x.n || '') + ' ' + String(x.dv || ''))) continue; mc.set(x.mk, (mc.get(x.mk) || 0) + 1); }
pre47 = [...mc.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))).slice(0, 60).map(([m, n]) => $q.aw + encodeURIComponent(String(m).toLowerCase().replace(/\s+/g, '-')) + '/">' + esc(H.mkName(m, lang)) + $q.ax + n.toLocaleString(lang) + $q.ay).join(''); } catch (e) { pre47 = ''; }
const sel = (n, lbl, opts) => $q.az + n + $q.ab + esc(t27(lang, lbl)) + $q.aA + n + $q.aB + n + $q.aC + esc(t27(lang, $q.aD)) + $q.aE + opts + $q.aF;
let RT = null; try { const R = await import('./kbx_n37u.js'); if (await R.regMap(env)) RT = (k, v) => R.rgT(lang, k, v); } catch (e) { RT = null; }
const rgSel = RT ? $q.aG + esc(RT('rg_f')) + $t.k7 + esc(t27(lang, $q.aD)) + $q.aH + esc(RT('rg_1')) + $q.aI + esc(RT('rg_3')) + $q.aJ : '';
const form = $q.aK + sel('co', 'mp_co', '') + sel('yr', 'mp_yr', $q.aL + esc(t27(lang, $q.aM)) + $q.aE) +
sel('pm', 'mp_pm', $q.aN + esc(t27(lang, $q.aO)) + $q.aP + esc(t27(lang, $q.aQ)) + $q.aE) + sel('sc', 'mp_sc', [25, 50, 75].map(n => $q.aR + n + '">' + esc(t27(lang, $q.aS, { n })) + $q.aE).join('')) +
$q.aT + esc(N30.t30(lang, 'mh_dl')) + $t.k8 + esc(N30.t30(lang, $q.aU)) + $q.aH + esc(N30.t30(lang, $q.aV)) + $q.aW + esc(N30.t30(lang, $q.aX)) + $q.aY + esc(N30.t30(lang, $q.aZ)) + $q.aJ + rgSel +
$t.k9 + esc(N30.t30(lang, 'mh_hm')) + $q.ba;
const body = $t.k10 + P + $q.bb + P + $q.bc + esc(N.tr(lang, 'h1_i')) + $q.bd + esc(t27(lang, 'mp_h1')) + $q.be + esc(t27(lang, $q.bf)) + $q.bg +
$t.k11 + esc(JSON.stringify(Object.assign({ s: Object.assign({}, N30.mapStrings(lang), RT ? { rg_b: RT('rg_b') } : {}) }, MAPV))) + '">' + form +
$s.k2 + esc(N30.t30(lang, 'mh_k1')) + $t.k12 + esc(N30.t30(lang, 'mh_k6')) + $t.k13 + esc(N30.t30(lang, $q.bh)) + $t.k14 + $t.k15 + esc(t27(lang, $q.bi)) + $t.k16 + esc(t27(lang, 'mp_h1')) + '">' + esc(t27(lang, $q.bi)) + $q.ai +
$q.bj + esc(t27(lang, $q.bk)) + $q.bl + esc(t27(lang, $q.bm)) + $q.bn + pre47 + $t.k17 + esc(W_MORE[lang] || W_MORE.en) + $q.ad +
$q.bo + (lang === 'en' ? '' : $q.bp + lang) + $t.k18 + P + $q.bc + esc(N.tr(lang, 'h1_i')) + $q.bq +
$t.k19 + MAP3_V + $q.br;
const pg = { title: t27(lang, 'mp_t') + $q.bs, desc: t27(lang, 'mp_d'), canon, body, alt: l => ORIGIN + pre(l) + '/map/',
ld: { '@context': $q.bt, '@graph': [{ '@type': $q.bu, name: t27(lang, 'mp_t'), url: canon, inLanguage: lang, isPartOf: { '@type': $q.bv, name: $q.bw, url: ORIGIN + '/' } },
{ '@type': $q.bx, itemListElement: [{ '@type': $q.by, position: 1, name: $q.bw, item: ORIGIN + P + '/' }, { '@type': $q.by, position: 2, name: N.tr(lang, 'h1_i'), item: ORIGIN + P + $q.af }, { '@type': $q.by, position: 3, name: t27(lang, 'mp_h1'), item: canon }] }] } };
const sh = await shell(P + $q.bz); if (!sh || sh.status !== 200) return null;
return new Response(await N.assemble(pg, lang, sh), { status: 200, headers: { 'content-type': $q.bA, 'cache-control': $q.bB } });
}
const W_MORE = { en: 'Show more', es: 'Ver más', fr: 'Voir plus', de: 'Mehr zeigen', nl: 'Meer tonen', ru: 'Показать ещё', zh: '显示更多', ar: 'اعرض المزيد' };
async function updatesPage(req, u, env, ctx, shell, lang) {
const N = await import('./kbx_named.js'), K = await import('./kbx_ticker.js');
const items = (await K.tickerItems(env)).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
const P = pre(lang), canon = ORIGIN + P + $q.bC, byDay = new Map();
items.forEach(x => { const t = lang === 'en' ? x.text : x.tl && x.tl[lang]; if (!t) return; const d = String(x.date).slice(0, 10); if (!byDay.has(d)) byDay.set(d, []); byDay.get(d).push([K.tickId(x), t, x]); });
const html = [...byDay.entries()].map(([d, L]) => $q.bD + d + $q.bE + d + '">' + esc(N.fd(d, lang)) + $q.bF +
L.map(([id, t, x]) => $q.bG + id + '"><p>' + esc(t) + '</p>' + (x.url && /^\/[^/]/.test(x.url) ? $q.bH + esc(/^\/(?:database|progress|numbers|rankings|projects|methods|press|moderation|team|compare|map)\b/.test(x.url) ? P + x.url : x.url) + '">' + esc(t27(lang, $q.bI)) + $q.ah : '') + '</li>').join('') + $q.bJ).join('');
const body = $t.k20 + P + $q.bK + esc(t27(lang, 'up_h1')) + $q.be + esc(t27(lang, $q.bL)) + $t.k21 + html +
$q.bM + P + $s.k5;
const pg = { title: t27(lang, 'up_t') + $q.bs, desc: t27(lang, 'up_d'), canon, body, alt: l => ORIGIN + pre(l) + $q.bC,
ld: { '@context': $q.bt, '@graph': [{ '@type': $q.bu, name: t27(lang, 'up_t'), url: canon, inLanguage: lang, isPartOf: { '@type': $q.bv, name: $q.bw, url: ORIGIN + '/' } }] } };
const sh = await shell(P + $q.bz); if (!sh || sh.status !== 200) return null;
return new Response(await N.assemble(pg, lang, sh), { status: 200, headers: { 'content-type': $q.bA, 'cache-control': $q.bB } });
}
export async function handle(req, u, env, ctx, shell) {
const p = u.pathname;
if (p === $q.bN) return (await import('./kbx_n31d.js')).handle(req, u);
if (p === $q.bO) {
const N = await import('./kbx_named.js'), v = N.U27_SRC_V;
const body = N.NAMED_CLIENT_JS + '\n' + CLIENT_JS() + '\n' + (await import('./kbx_n30a.js')).LOADER + '\n' + (await import('./kbx_n31d.js')).LOADER;
return new Response(body, { headers: { 'content-type': $q.bP, 'cache-control': u.searchParams.get('v') === v ? $q.bQ : $q.bB, 'x-content-type-options': $q.bR } });
}
if (p === $q.bS) {
const id = String(u.searchParams.get('id') || '').slice(0, 20), pr = Math.max(0, Math.min(1e12, +u.searchParams.get('p') || 0)), lang = LANGS.includes(u.searchParams.get('lang')) ? u.searchParams.get('lang') : 'en';
const N = await import('./kbx_named.js'), F = await import('./kbx_facets.js');
let ix; try { ix = await N.data(env); } catch (e) { return jr({ error: $q.bT }, 503, $q.bU); }
const x = ix.byId.get(id); if (!x) return jr({ error: $q.bV }, 404);
return jr({ id, price: pr || null, calc: F.costCalc(x, pr, lang), about: $s.k6 }, 200, $q.bW);
}
if (p === $q.bX) {
const lang = LANGS.includes(u.searchParams.get('lang')) ? u.searchParams.get('lang') : 'en';
const ck = new Request(ORIGIN + $q.bY + lang);
try { const hit = await caches.default.match(ck); if (hit) return hit; } catch (e) {}
let d; try { d = await mapData(env, lang); } catch (e) { return jr({ error: $q.bZ }, 503, $q.bU); }
const r = jr(d, 200, $q.ca);
try { ctx.waitUntil(caches.default.put(ck, r.clone())); } catch (e) {}
return r;
}
const m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(map|updates)\/?$/.exec(p); if (!m) return null;
if (!p.endsWith('/')) return Response.redirect(ORIGIN + p + '/' + u.search, 301);
const lang = m[1] || 'en';
try { return m[2] === 'map' ? await mapPage(req, u, env, ctx, shell, lang) : await updatesPage(req, u, env, ctx, shell, lang); } catch (e) { return null; }
}
