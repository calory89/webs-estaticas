// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_web__q, $t = TB.kbx_web__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { TB } from './kbx_strings.js';
import { jget } from './kbx_jget.js';
import { LOCALE } from './kbx_named_i18n.js';
import { T as T30 } from './kbx_n30b_i18n.js';
const ORIGIN = 'https://kolaboro.com';
export const PATHS = /^\/api\/x\/web\/(?:project\/[A-Za-z0-9-]{3,20}|dev\/[a-z0-9-]{1,90})$/;
let MEMO = null;
let FZ = {};
async function loadOne(env, name) {
const sh = (globalThis.__kbJson || {})[name]; if (sh && sh.v && (sh.a || Date.now() - sh.t < 600000)) return sh.v;
return jget(env, name, ORIGIN + $q.a + name, ORIGIN + $q.b + name).then(o => o.v, () => null);
}
export async function webData(env) {
if (MEMO && Date.now() - MEMO.t < 600000) return MEMO.v;
const [health, links, named, forensics] = await Promise.all([loadOne(env, $q.c), loadOne(env, $q.d), loadOne(env, $q.e), loadOne(env, $q.f)]);
FZ = (forensics && forensics.d) || {};
const byDev = new Map();
for (const g of ((links && links.groups) || [])) for (const s of g.dv || []) { if (!byDev.has(s)) byDev.set(s, []); byDev.get(s).push(g); }
const domDev = new Map(); for (const [d, h] of Object.entries((health && health.d) || {})) domDev.set(d, h.dv);
const devName = new Map(); const devDoms = new Map();
for (const x of ((named && named.projects) || [])) if (x.dvs && x.dv) devName.set(x.dvs, x.dv);
for (const [d, s] of domDev) { if (!devDoms.has(s)) devDoms.set(s, []); devDoms.get(s).push(d); }
const v = { health, links, forensics, byDev, devName, devDoms, named, v: ((health && health.generated_at) || '') + '/' + ((links && links.updated) || '') };
MEMO = { t: Date.now(), v }; return v;
}
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.g, "'": '&#39;' }[c]));
const SLD2 = /\.(co|com|net|org|gov|ac|or|ne|go|in|edu)\.[a-z]{2}$/;
export function regDomain(u) {
let h = ''; try { h = new URL(String(u || '')).hostname.toLowerCase(); } catch (e) { return ''; }
h = h.replace(/^www\./, ''); if (!h.includes('.')) return '';
const p = h.split('.'); return SLD2.test(h) ? p.slice(-3).join('.') : p.slice(-2).join('.');
}
const DAY = 86400000;
const daysTo = (d, today) => Math.round((Date.parse(d + $q.h) - Date.parse(today + $q.h)) / DAY);
const dtf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'd' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.DateTimeFormat(L, o)); };
function fdt(d, lang) { try { return dtf(LOCALE[lang] || 'en-GB', { day: $q.i, month: 'short', year: $q.i, timeZone: 'UTC' }).format(new Date(d + $q.h)); } catch (e) { return d; } }
const pre = l => l === 'en' ? '' : '/' + l;
function lastN(h, n) { const s = (h.h || '').replace(/-/g, ''); const w = s.slice(-n); return { n: w.length, bad: [...w].filter(c => c === '0' || c === 'x').length }; }
function firstChecked(health, h) { const s = h.h || '', days = health.days || []; for (let i = 0; i < s.length; i++) if (s[i] !== '-') return days[i]; return null; }
const S = TB.kbx_web_S ;
const tt = (lang, k, v) => { const L = S[lang] || S.en; let s = L[k] != null ? L[k] : S.en[k]; if (typeof s !== $q.j) return s; for (const [a, b] of Object.entries(v || {})) s = s.split('{' + a + '}').join(String(b)); return s; };
export const webHeading = (lang, which) => tt(lang, which === 'l' ? 'hl' : 'hh');
export const typeLabel = (lang, t) => ((S[lang] || S.en).ty || S.en.ty)[t] || t;
const KEYS = { u: 'l_u', b: 'l_b', x: 'l_x', '0': 'l_x', '-': 'l_n' };
function strip(health, h, lang) {
  const s = h.h || '', days = health.days || [];
  const cells = [...s].map((c, i) => $q.k + (c === '0' ? 'z' : c === '-' ? 'n' : c) + $q.l + esc((days[i] ? fdt(days[i], lang) + ': ' : '') + tt(lang, KEYS[c] || 'l_n')) + $q.m).join('');
  const cnt = c => [...s].filter(x => x === c).length;
  const alt = tt(lang, 'strip', { n: s.length }) + ': ' + [['u', 'l_u'], ['b', 'l_b'], ['x', 'l_x'], ['-', 'l_n']].map(([c, k]) => tt(lang, k) + ' ' + (c === 'x' ? cnt('x') + cnt('0') : cnt(c))).join(', ');
  return $q.n + esc(tt(lang, 'strip', { n: s.length })) + $q.o + esc(alt) + '">' + cells + $q.p +
    $q.q + [['u', $q.r], ['b', $q.s], ['x', $q.t], ['-', $q.u]].map(([c, col]) => $q.v + col + $q.w + esc(tt(lang, KEYS[c])) + '</li>').join('') + '</ul>';
}
const src = (u, label) => u.startsWith('/') ? $q.x + esc(u) + '">' + esc(label) + '</a>' : $q.x + esc(u) + $q.y + esc(label) + '</a>';
const li = (t, u, label) => $q.z + esc(t) + (u ? src(u, label) : '') + '</li>';
function siteFacts(health, d, h, lang) {
const today = health.updated, home = $q.A + d + '/', rd = $t.k0 + encodeURIComponent(d), ct = $q.B + encodeURIComponent(d);
const F = [];
if (h.rb) F.push(li(tt(lang, 'rb'), home + $q.C, $q.C));
else if (h.s > 0 && h.s < 400) F.push(li(tt(lang, 'ok', { s: h.s, d: fdt(h.ck, lang), t: ((h.ms || 0) / 1000).toFixed(1) }), home, tt(lang, $q.D)));
else if (h.s >= 400 && h.s < 500) F.push(li(tt(lang, 'b4', { s: h.s, d: fdt(h.ck, lang) }), home, tt(lang, $q.D)));
else if (h.s >= 500) F.push(li(tt(lang, 'x5', { s: h.s, d: fdt(h.ck, lang) }), home, tt(lang, $q.D)));
else if (h.s === 0) F.push(li(tt(lang, 'no', { d: fdt(h.ck, lang), w: tt(lang, 'w_' + (h.err || $q.E)) }), home, tt(lang, $q.D)));
if (!h.rb && h.s != null && lastN(h, 7).n < 3) F.push(li(tt(lang, 'since', { d: fdt(firstChecked(health, h) || today, lang) }), $q.F, tt(lang, 's_log')));
if (!h.rb) {
const w = lastN(h, 7);
if (w.n >= 3) F.push(li((w.bad ? tt(lang, 'bad', { k: w.bad, n: w.n }) : tt(lang, 'allok', { n: w.n })) + (w.n < 7 ? ' ' + tt(lang, 'since', { d: fdt(firstChecked(health, h) || today, lang) }) : ''), $q.F, tt(lang, 's_log')));
if ((h.st || 0) >= 2) F.push(li(tt(lang, $q.G, { n: h.st }), $q.F, tt(lang, 's_log')));
}
if (h.to) F.push(li(tt(lang, 'to', { d: h.to }), home, tt(lang, $q.D)));
if (h.ce === $q.H) F.push(li(tt(lang, $q.I, { d: fdt(h.ck, lang) }), ct, tt(lang, 's_ct')));
else if (h.ce) { const n = daysTo(h.ce, today); F.push(li(n < 0 ? tt(lang, $q.J, { d: fdt(h.ce, lang) }) : n <= 30 ? tt(lang, $q.K, { d: fdt(h.ce, lang), n }) : tt(lang, 'ce', { d: fdt(h.ce, lang) }), ct, tt(lang, 's_ct'))); }
if (h.de) { const n = daysTo(h.de, today); F.push(li(n < 0 ? tt(lang, $q.L, { d: fdt(h.de, lang) }) : n <= 60 ? tt(lang, $q.M, { d: fdt(h.de, lang), n }) : tt(lang, 'de', { d: fdt(h.de, lang) }), rd, tt(lang, $q.N))); }
if (h.lm && h.lm <= today) F.push(li(tt(lang, 'lm', { d: fdt(h.lm, lang) }), home, tt(lang, $q.D)));
F.push(...forensicLines(d, h, today, lang, rd));
if (h.sm) F.push(li(tt(lang, 'sm', { d: fdt(h.sm, lang) }), home + $q.O, $q.P));
return $q.Q + F.join('') + '</ul>' + (h.rb ? '' : strip(health, h, lang));
}
function forensicLines(d, h, today, lang, rd) {
const z = FZ[d] || {}, L = T30[lang] || T30.en, F = [], rg = h.dr || z.rg, iss = h.ci || z.iss, cb = h.cb || z.cb;
if (rg && rg <= today) { const y = Math.floor((Date.parse(today) - Date.parse(rg)) / (365.25 * 864e5)); F.push(li(fill30(L.ws_reg, { d: fdt(rg, lang), y: y < 1 ? L.ws_m : y === 1 ? L.ws_y1 : fill30(L.ws_y, { n: y }), r: fdt(h.dr ? h.ck : (z.rr || today), lang) }), rd, tt(lang, $q.N))); }
if (iss && cb) F.push(li(fill30(L.ws_iss, { i: iss, d: fdt(cb, lang), r: fdt(h.ci ? h.ck : (z.cr || today), lang) }), $q.B + encodeURIComponent(d), $q.R));
return F;
}
const fill30 = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
const methodLine = (health, lang) => $q.n + esc(tt(lang, 'upd', { d: fdt(health.updated, lang) })) + $q.S + esc(tt(lang, $q.T)) + $q.U + esc(lang !== 'en' && (S[lang] || {}).mth ? S[lang].mth : (health.method || '')) + '</p>';
export function projectDomains(wd, x) {
const H = (wd && wd.health && wd.health.d) || {};
return [...new Set([x.url, x.du].map(regDomain).filter(d => d && H[d]))];
}
export function webProjectHtml(wd, x, lang) {
const doms = projectDomains(wd, x); if (!doms.length) return '';
const H = wd.health.d;
return $q.X_WEB_CSS + $q.V + esc(tt(lang, 'intro')) + '</p>' + doms.map(d => $q.W + esc(tt(lang, 'site', { d })) + '</h3>' + siteFacts(wd.health, d, H[d], lang) + $q.p).join('') + methodLine(wd.health, lang);
}
export function webDevHealthHtml(wd, slug, lang) {
const doms = ((wd && wd.devDoms.get(slug)) || []).slice().sort(); if (!doms.length) return '';
const H = wd.health.d, today = wd.health.updated, th = tt(lang, 'th');
if (doms.length === 1) return $q.X_WEB_CSS + $q.V + esc(tt(lang, 'intro')) + $q.X + esc(tt(lang, 'site', { d: doms[0] })) + '</h3>' + siteFacts(wd.health, doms[0], H[doms[0]], lang) + $q.p + methodLine(wd.health, lang);
const rows = doms.map(d => {
const h = H[d], w = lastN(h, 7), ce = h.ce && h.ce !== $q.H ? fdt(h.ce, lang) + (daysTo(h.ce, today) <= 30 && daysTo(h.ce, today) >= 0 ? ' (' + tt(lang, 'ind', { n: daysTo(h.ce, today) }) + ')' : '') : h.ce === $q.H ? tt(lang, $q.I, { d: fdt(h.ck, lang) }) : '-';
const de = h.de ? fdt(h.de, lang) + (daysTo(h.de, today) <= 60 && daysTo(h.de, today) >= 0 ? ' (' + tt(lang, 'ind', { n: daysTo(h.de, today) }) + ')' : '') : '-';
const now = h.rb ? $q.C : h.s > 0 ? tt(lang, 't_ok', { s: h.s }) : h.s === 0 ? tt(lang, 't_no') : '-';
return $q.Y + esc(th[0]) + $q.Z + esc(d) + $t.k1 + esc(d) + $q.aa + esc(th[1]) + '">' + esc(now) + $q.ab + esc(th[2]) + '">' + esc(h.rb || w.n < 3 ? '-' : w.bad ? tt(lang, 't_bad', { k: w.bad, n: w.n }) : tt(lang, 'allok', { n: w.n })) + $q.ab + esc(th[3]) + '">' + esc(ce) + $q.ab + esc(th[4]) + '">' + esc(de) + $q.ac;
}).join('');
return $q.X_WEB_CSS + $q.V + esc(tt(lang, 'intro')) + $t.k2 + th.map(x => '<th>' + esc(x) + '</th>').join('') + $q.ad + rows + $q.ae +
(() => { const fz = doms.map(d => { const L = forensicLines(d, H[d], today, lang, $t.k3 + encodeURIComponent(d)); return L.length ? $q.af + esc(d) + $q.ag + L.join('') + $q.ah : ''; }).join(''); return fz ? $q.ai + fz + '</ul>' : ''; })() +
$q.n + esc(tt(lang, 'th')[3]) + $t.k4 + esc(tt(lang, 'th')[4]) + $t.k5 + methodLine(wd.health, lang);
}
export function webDevLinksHtml(wd, slug, lang) {
const doms = (wd && wd.devDoms.get(slug)) || []; if (!doms.length || !wd.links) return '';
const G = wd.byDev.get(slug) || [], P = pre(lang);
if (!G.length) return $q.V + esc(tt(lang, $q.aj, { d: fdt(wd.links.updated, lang) })) + '</p>';
const items = G.map(g => {
const mine = g.d.filter(d => wd.health.d[d] && wd.health.d[d].dv === slug);
const others = [...new Set(g.dv.filter(s => s !== slug))].map(s => {
const od = g.d.filter(d => wd.health.d[d] && wd.health.d[d].dv === s);
return $q.ak + P + $q.al + esc(s) + '/">' + esc(wd.devName.get(s) || s) + $q.am + od.map(esc).join(', ') + ')';
}).join(', ');
const v = g.t === 'cert' ? '' : g.t === $q.an ? g.v.slice(0, 12) : g.v;
const txt = v ? tt(lang, $q.ao, { t: '%T%', v: '%V%', list: '%L%' }) : tt(lang, $q.ap, { t: '%T%', list: '%L%' });
const html = esc(txt).replace('%T%', esc(typeLabel(lang, g.t))).replace('%V%', $q.aq + esc(v) + $q.ar).replace('%L%', others);
return $q.z + html + $q.as + mine.map(esc).join(', ') + $q.at + src($q.A + mine[0] + '/', mine[0]) + '</li>';
}).join('');
return $q.V + esc(tt(lang, $q.au)) + $q.av + items + $q.aw + P + $q.ax + esc(tt(lang, $q.ay)) + $t.k6 + esc(fdt(wd.links.updated, lang)) + ')</p>';
}
export async function webGroups(env) {
const wd = await webData(env).catch(() => null);
if (!wd || !wd.links) return { groups: [], updated: null };
return { updated: wd.links.updated, groups: (wd.links.groups || []).map(g => ({ t: g.t, v: g.v, label: typeLabel('en', g.t).replace(/^(the|one) /, '') + (g.t === 'cert' ? '' : ' ' + (g.t === $q.an ? g.v.slice(0, 12) : g.v)), devs: g.dv, doms: g.d, dom: Object.fromEntries(g.d.map(d => [d, wd.health && wd.health.d[d] ? wd.health.d[d].dv : null])) })) };
}
export async function webStates(env) {
const wd = await webData(env).catch(() => null); const out = {};
if (!wd || !wd.health || !wd.named) return out;
const today = wd.health.updated;
for (const x of wd.named.projects || []) {
for (const d of projectDomains(wd, x)) {
const h = wd.health.d[d], w = lastN(h, 7);
const s = { d, down: !h.rb && w.n >= 3 && w.bad >= 3 ? w.bad + '/' + w.n : null, ce: h.ce && h.ce !== $q.H && daysTo(h.ce, today) <= 14 ? h.ce : h.ce === $q.H ? $q.H : null, de: h.de && daysTo(h.de, today) <= 30 ? h.de : null };
if (s.down || s.ce || s.de) { out[x.id] = s; break; }
if (!out[x.id]) out[x.id] = { d, down: null, ce: null, de: null };
}
}
return out;
}
export function webDiff(a, b) {
const L = []; a = a || {}; if (!b) return L;
if (b.down && !a.down) L.push($q.az + b.d + $q.aA + b.down.split('/')[0] + $q.aB + b.down.split('/')[1] + $q.aC);
if (b.ce && b.ce !== a.ce) L.push($q.az + b.d + ': ' + (b.ce === $q.H ? $q.aD : $q.aE + b.ce));
if (b.de && b.de !== a.de) L.push($q.az + b.d + $q.aF + b.de);
return L;
}
function out(o, s) { return new Response(JSON.stringify(o), { status: s || 200, headers: { 'content-type': $q.aG, 'access-control-allow-origin': '*', 'cache-control': s && s !== 200 ? $q.aH : $q.aI, 'x-content-type-options': $q.aJ } }); }
export async function handle(req, u, env) {
const wd = await webData(env).catch(() => null);
if (!wd || !wd.health) return out({ error: $q.aK, note: $q.aL }, 503);
const meta = { updated: wd.health.updated, days: wd.health.days, legend: wd.health.legend, method: wd.health.method, licence: wd.health.licence, data: [ORIGIN + $q.F, ORIGIN + $q.aM] };
let m = u.pathname.match(/^\/api\/x\/web\/project\/([A-Za-z0-9-]+)$/);
if (m) {
const id = m[1].toUpperCase(), x = ((wd.named && wd.named.projects) || []).find(p => p.id === id);
if (!x) return out({ error: $q.aN }, 404);
const doms = projectDomains(wd, x);
return out(Object.assign({ id, slug: x.s, sites: doms.map(d => Object.assign({ domain: d }, wd.health.d[d])) }, meta));
}
m = u.pathname.match(/^\/api\/x\/web\/dev\/([a-z0-9-]+)$/);
const s = m[1], doms = wd.devDoms.get(s) || [];
if (!doms.length && !wd.devName.has(s)) return out({ error: $q.aN }, 404);
return out(Object.assign({ developer: s, name: wd.devName.get(s) || null, sites: doms.map(d => Object.assign({ domain: d }, wd.health.d[d])), shared: (wd.byDev.get(s) || []).map(g => ({ type: g.t, type_label: (wd.links.types || {})[g.t] || g.t, value: g.v, domains: g.d, developers: g.dv })), caveat: wd.links && wd.links.caveat }, meta));
}
