// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_money__q, $s = TB.kbx_money__s, $t = TB.kbx_money__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { TB } from './kbx_strings.js';
import { rulesData, rulesHtml, rulesJson, RULES_CSS } from './kbx_rules.js';
const ORIGIN = 'https://kolaboro.com';
export const PATHS = /^\/api\/x\/money(\/|$)/;
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.a, "'": '&#39;' }[c]));
const ltr = s => $q.b + esc(s) + $q.c;
const OPINION = /\b(scam\w*|fraud\w*|ponzi|swindl\w*|rip-?off|avoid\w*|beware|dodgy|shady|crook\w*|estafa\w*|fraude\w*|betrug\w*|arnaque\w*|escroc\w*|oplicht\w*|bedrog\w*)\b|мошен|обман|骗局|诈骗|احتيال/i;
const MASK = s => String(s || '').replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, $q.d).replace(/\+?\d[\d ()-]{8,}\d/g, m => /\d{1,3}([.,\s]\d{3}){2,}/.test(m) ? m : $q.e);
let MEMO = {};
async function loadOne(env, path) {
const m = MEMO[path]; if (m && Date.now() - m.t < 600000) return m.v;
let r = null;
try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + $q.f + path)); } catch (e) { r = null; }
if (!r || !r.ok) { try { r = await fetch(ORIGIN + path + '?v=' + Math.floor(Date.now() / 600000), { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
const v = r && r.ok ? await r.json().catch(() => null) : null;
MEMO[path] = { t: Date.now(), v }; return v;
}
export async function moneyData(env) {
const [sl, sn, ru] = await Promise.all([loadOne(env, $q.g), loadOne(env, $q.h), rulesData(env).catch(() => null)]);
return { sl, sn, ru, v: ((sl && sl.updated) || '') + '/' + ((sn && sn.updated) || '') };
}
const S = TB.kbx_money_S ;
const t = (lang, k, v) => { const s = (S[lang] && S[lang][k] != null) ? S[lang][k] : S.en[k]; return v && typeof s === $q.i ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
export const moneyToc = lang => t(lang, 'toc');
export const moneyHeading = lang => t(lang, 'h');
const dtf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'd' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.DateTimeFormat(L, o)); };
const nmf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'n' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.NumberFormat(L, o)); };
const fdt = (d, l) => { try { return dtf(LOC[l] || 'en-GB', { day: $q.j, month: 'short', year: $q.j, timeZone: 'UTC' }).format(new Date(String(d).slice(0, 10) + $q.k)); } catch (e) { return String(d || ''); } };
const fnum = (n, l) => { try { return nmf(LOC[l] || 'en-GB', { maximumFractionDigits: 0 }).format(n); } catch (e) { return String(n); } };
const fcur = (n, cur, l) => { if (n == null) return '-'; try { return nmf(LOC[l] || 'en-GB', { style: $q.l, currency: cur, maximumFractionDigits: 0 }).format(n); } catch (e) { return (cur || '') + ' ' + fnum(n, l); } };
const fill = (lang, k, v) => { const raw = {}, mark = {}; let i = 0; for (const [a, b] of Object.entries(v || {})) { const key = $q.m + (i++) + $q.n; raw[a] = key; mark[key] = b; } let s = esc(t(lang, k, raw)); for (const [key, b] of Object.entries(mark)) s = s.split(esc(key)).join(typeof b === $q.o && b && b.html ? b.html : ltr(b)); return s; };
const H = s => ({ html: s });
const ok = st => st && st.p50 != null;
const copyHref = (x, kind, ref, url) => kind === 'ia' ? $q.p + ref + '/' + url : $q.q + x.s + $q.r + ref + '.txt';
function shortletHtml(sl, x, lang) {
const r = sl && sl.projects && sl.projects[x.id];
if (!r || r.outside) return '';
const ds = (sl.datasets || {})[r.ds] || {}, cur = r.cur || ds.currency, city = ds.city || '', d = fdt(ds.date, lang), e = r.e || {}, P = v => fcur(v, cur, lang);
const src = $t.k0 + esc(t(lang, $q.s, { city, d })) + '</a>';
let h = '<h3>' + esc(t(lang, 'sl_h')) + '</h3>';
if (r.claim && r.claim.q && r.claim.q.length) {
const qs = r.claim.q.filter(q => !OPINION.test(q));
if (qs.length) h += $q.t + esc(t(lang, $q.u, { d: fdt(r.claim.d, lang) })) + '</p>' + qs.map(q => $q.v + esc(MASK(q)) + $q.w).join('') +
$t.k1 + esc(copyHref(x, 'copy', r.claim.sha)) + '">' + esc(t(lang, $q.x)) + $q.y;
}
else if (r.nocl) h += $q.z + esc(t(lang, $q.A, { d: fdt(r.nocl, lang) })) + '</p>';
if ((r.n || 0) < (sl.min_n || 10)) return h + $q.z + fill(lang, $q.B, { m: sl.min_n || 10, city, d }) + ' ' + src + '</p>';
const rt = r.rt || {}, rooms = (rt[$q.C] || 0) + (rt[$q.D] || 0) + (rt[$q.E] || 0);
const L = [];
L.push(fill(lang, 'sl_n', { city, d, n: fnum(r.n, lang), e: fnum(e.n || 0, lang), o: fnum(rooms, lang) }));
if (ok(e.price)) L.push(fill(lang, $q.F, { p50: P(e.price.p50), p25: P(e.price.p25), p75: P(e.price.p75), n: fnum(e.price.n, lang) }));
if (e.n) L.push(fill(lang, $q.G, { a: fnum(e.act || 0, lang), e: fnum(e.n, lang) }));
if (ok(e.occ)) L.push(fill(lang, $q.H, { p50: fnum(e.occ.p50, lang), pct: Math.round(e.occ.p50 / 365 * 100), n: fnum(e.occ.n, lang) }));
if (ok(e.rev)) L.push(fill(lang, $q.I, { p50: P(e.rev.p50), p25: P(e.rev.p25), p75: P(e.rev.p75) }));
if (e.n && e.lic != null) L.push(fill(lang, $q.J, { l: fnum(Math.min(e.lic, r.n), lang), n: fnum(r.n, lang) }));
h += $q.K + L.map(s => $q.L + s + '</li>').join('') + '</ul>';
const br = ['0-1', '2', '3+'].filter(g => e.br && ok(e.br[g])).map(g => [g, e.br[g]]);
if (br.length) {
const th = t(lang, $q.M);
h += $s.k0 + esc(t(lang, 'sl_br')) + $q.N + esc(th[0]) + $q.O + esc(th[1]) + $q.O + esc(th[2]) + $q.P +
br.map(([g, v]) => $q.Q + esc(g === '0-1' ? t(lang, $q.R) : g) + $q.S + ltr(fnum(v.n, lang)) + $q.T + ltr(P(v.p50)) + $q.U).join('') + $q.V;
}
h += $q.W + esc(t(lang, $q.X)) + ' ' + src + $s.k1 + esc(t(lang, $q.Y)) + $q.y;
return h;
}
const ROWS = { hmlr: [['all', 'so_all'], ['flat', 'so_flat'], ['new', 'so_new'], ['new_flat', 'so_newflat']], dvf: [['all', 'so_all'], ['apt', 'so_apt'], ['house', 'so_house'], ['new', 'so_vefa']], nyc: [['all', 'so_all'], ['condo', 'so_condo'], ['coop', 'so_coop'], ['home', 'so_home']] };
function soldHtml(sn, x, lang) {
const r = sn && sn.projects && sn.projects[x.id];
if (!r) return '';
let h = '<h3>' + esc(t(lang, 'so_h')) + '</h3>';
if (r.skip) return r.skip === $q.Z ? h + $q.z + esc(t(lang, $q.aa)) + '</p>' : '';
const reg = (sn.registers || {})[r.reg]; if (!reg) return '';
const cur = r.cur, P = v => fcur(v, cur, lang), m = sn.min_n || 10;
const regA = $q.ab + esc(reg.url) + $q.ac + esc(reg.name) + '</a>';
if (!r.all || !ok(r.all)) return h + $q.z + fill(lang, $q.ad, { m }) + ' ' + regA + '</p>';
h += $q.ae + fill(lang, $q.af, { reg: H(regA), a: fdt(r.from, lang), b: fdt(r.to, lang) }) + '</p>';
const th = t(lang, 'so_th');
const rows = (ROWS[r.reg] || []).filter(([k]) => r[k] && r[k].n);
h += $s.k2 + esc(th[0]) + $q.O + esc(th[1]) + $q.O + esc(th[2]) + $q.ag + esc(th[3]) + $q.ah +
rows.map(([k, lbl]) => { const s = r[k]; return $q.Q + esc(t(lang, lbl)) + $q.S + ltr(fnum(s.n, lang)) + $q.T + (ok(s) ? '<b>' + ltr(P(s.p50)) + $q.ai + ltr(P(s.p25)) + ' - ' + ltr(P(s.p75)) + $q.aj : $q.ak) + $q.U; }).join('') + $q.V;
const L = [];
if (r.reg === 'dvf') {
if (ok(r.m2)) L.push(fill(lang, 'so_m2', { p50: P(r.m2.p50), p25: P(r.m2.p25), p75: P(r.m2.p75), n: fnum(r.m2.n, lang) }));
if (ok(r.new_m2)) L.push(fill(lang, $q.al, { p50: P(r.new_m2.p50), n: fnum(r.new_m2.n, lang) }));
} else if (r.reg === 'nyc') { if (ok(r.home_m2)) L.push(fill(lang, $q.am, { p50: P(r.home_m2.p50), n: fnum(r.home_m2.n, lang) })); }
else L.push(esc(t(lang, $q.an)));
if (r.dev && r.dev.v) {
const a = $q.ao + esc(copyHref(x, r.dev.src, r.dev.ref, x.url)) + '"' + (r.dev.src === 'ia' ? $t.k2 : '') + '>' + esc(t(lang, $q.x)) + '</a>';
let s = fill(lang, $q.ap, { p: r.dev.p || P(r.dev.v), d: fdt(r.dev.d, lang) });
if (r.dev.below_pct != null) s += ' ' + fill(lang, $q.aq, { pct: r.dev.below_pct, what: H(esc(t(lang, $q.ar + (r.dev.vs || 'all')))) }).replace(/\s{2,}/g, ' ');
L.push(s + ' ' + a);
}
if (r.dev_m2 && r.dev_m2.v) {
const a = $q.ao + esc(copyHref(x, r.dev_m2.src, r.dev_m2.ref, x.url)) + '"' + (r.dev_m2.src === 'ia' ? $t.k3 : '') + '>' + esc(t(lang, $q.x)) + '</a>';
L.push(fill(lang, $q.as, { p: r.dev_m2.p || P(r.dev_m2.v), u: H(r.dev_m2.unit === 'sqft' ? fill(lang, $q.at, { m2: P(r.dev_m2.m2) }) : ''), d: fdt(r.dev_m2.d, lang) }) + ' ' + a);
}
if (L.length) h += $q.K + L.map(s => $q.L + s + '</li>').join('') + '</ul>';
const geo = reg.geo ? $q.au + esc(reg.geo.url) + $q.ac + esc(reg.geo.name) + '</a>' : '';
h += $q.W + esc(t(lang, $q.av)) + ' ' + esc(reg.credit || '') + $q.au + esc(reg.licence_url) + $q.ac + esc(reg.licence) + '</a>' + geo + '</p>';
return h;
}
export function moneyHtml(md, x, lang) {
if (!md) return '';
const a = shortletHtml(md.sl, x, lang), b = soldHtml(md.sn, x, lang);
const slr = md.sl && md.sl.projects && md.sl.projects[x.id], c = md.ru ? rulesHtml(md.ru, x, lang, slr && !slr.outside ? slr.ds : null) : '';
if (!a && !b && !c) return '';
if (!a && !b) return $q.aw + RULES_CSS + $q.ax + c + $q.ay;
return $q.aw + $q.X_MONEY_CSS + RULES_CSS + $q.ax + a + c + b + $t.k4 + esc(t(lang, $q.az)) + $t.k5 + esc(x.id) + '">' + esc(t(lang, 'json')) + $q.aA + esc(t(lang, 'upd', { d: fdt(((md.sn && md.sn.updated) || (md.sl && md.sl.updated) || '').slice(0, 10), lang) })) + $q.aB;
}
const out = (o, s, cc) => new Response(JSON.stringify(o, null, 1), { status: s || 200, headers: { 'content-type': $q.aC, 'cache-control': cc || $q.aD, 'access-control-allow-origin': '*', 'x-content-type-options': $q.aE } });
export async function handle(req, u, env, ctx) {
if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: $q.aF }, 405, $q.aG);
try {
const md = await moneyData(env), sl = md.sl || {}, sn = md.sn || {};
const m = u.pathname.match(/^\/api\/x\/money\/([A-Za-z0-9-]{3,20})\/?$/);
if (!m) return out({ what: $s.k3, short_lets: { updated: sl.updated, source: sl.source, method: sl.method, datasets: sl.datasets, summary: sl.summary, projects: Object.keys(sl.projects || {}).filter(k => !(sl.projects[k] || {}).outside) },
recorded_sales: { updated: sn.updated, registers: sn.registers, method: sn.method, not_covered: sn.not_covered, summary: sn.summary, projects: Object.keys(sn.projects || {}) }, per_project: ORIGIN + $q.aH, files: [ORIGIN + $q.g, ORIGIN + $q.h] });
const id = m[1].toUpperCase(), a = (sl.projects || {})[id], b = (sn.projects || {})[id];
if (!a && !b && md.ru) { const { data } = await import('./kbx_named.js'); const ix = await data(env).catch(() => null); const x = ix && ix.byId.get(id); const rj = x ? rulesJson(md.ru, x, null) : null;
if (rj) return out({ id, name: x.n, url: ORIGIN + $q.q + x.s + $q.aI, short_lets: null, recorded_sales: null, short_let_rules: rj }); }
if (!a && !b) return out({ id, error: $q.aJ, note: $s.k4 }, 404);
const { data } = await import('./kbx_named.js'); const ix = await data(env).catch(() => null); const x = ix && ix.byId.get(id);
return out({ id, name: x ? x.n : null, url: x ? ORIGIN + $q.q + x.s + $q.aI : null, radius_m: 1000,
short_lets: a && !a.outside ? Object.assign({ dataset: Object.assign({ path: a.ds }, (sl.datasets || {})[a.ds] || {}), source: sl.source, updated: sl.updated }, a, { claim: a.claim ? Object.assign({}, a.claim, { copy: x ? ORIGIN + $q.q + x.s + $q.r + a.claim.sha + '.txt' : null }) : null }) : null,
recorded_sales: b && (!b.skip || b.skip === $q.Z) ? Object.assign({ register: (sn.registers || {})[b.reg] || null, updated: sn.updated }, b) : null,
short_let_rules: md.ru && x ? rulesJson(md.ru, x, a && !a.outside ? a.ds : null) : null });
} catch (e) { return out({ error: $q.aK }, 500, $q.aG); }
}
