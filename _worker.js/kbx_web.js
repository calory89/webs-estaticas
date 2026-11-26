// comments: _notes/kolaboro-worker-comments.txt
import { TB } from './kbx_strings.js';
import { LOCALE } from './kbx_named_i18n.js';
import { T as T30 } from './kbx_n30b_i18n.js';
const ORIGIN = 'https://kolaboro.com';
export const PATHS = /^\/api\/x\/web\/(?:project\/[A-Za-z0-9-]{3,20}|dev\/[a-z0-9-]{1,90})$/;
let MEMO = null;
let FZ = {};
async function loadOne(env, name) {
const sh = (globalThis.__kbJson || {})[name]; if (sh && sh.v && (sh.a || Date.now() - sh.t < 600000)) return sh.v;
let r = null;
try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); } catch (e) { r = null; }
if (!r || !r.ok) { try { r = await fetch(ORIGIN + '/data/' + name, { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
return r && r.ok ? await r.json().catch(() => null) : null;
}
export async function webData(env) {
if (MEMO && Date.now() - MEMO.t < 600000) return MEMO.v;
const [health, links, named, forensics] = await Promise.all([loadOne(env, 'web-health.json'), loadOne(env, 'dev-links.json'), loadOne(env, 'named.json'), loadOne(env, 'web-forensics.json')]);
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
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SLD2 = /\.(co|com|net|org|gov|ac|or|ne|go|in|edu)\.[a-z]{2}$/;
export function regDomain(u) {
let h = ''; try { h = new URL(String(u || '')).hostname.toLowerCase(); } catch (e) { return ''; }
h = h.replace(/^www\./, ''); if (!h.includes('.')) return '';
const p = h.split('.'); return SLD2.test(h) ? p.slice(-3).join('.') : p.slice(-2).join('.');
}
const DAY = 86400000;
const daysTo = (d, today) => Math.round((Date.parse(d + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / DAY);
const dtf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'd' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.DateTimeFormat(L, o)); };
const nmf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'n' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.NumberFormat(L, o)); };
function fdt(d, lang) { try { return dtf(LOCALE[lang] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(d + 'T00:00:00Z')); } catch (e) { return d; } }
const pre = l => l === 'en' ? '' : '/' + l;
function lastN(h, n) { const s = (h.h || '').replace(/-/g, ''); const w = s.slice(-n); return { n: w.length, bad: [...w].filter(c => c === '0' || c === 'x').length }; }
function firstChecked(health, h) { const s = h.h || '', days = health.days || []; for (let i = 0; i < s.length; i++) if (s[i] !== '-') return days[i]; return null; }
const S = TB.kbx_web_S ;
const tt = (lang, k, v) => { const L = S[lang] || S.en; let s = L[k] != null ? L[k] : S.en[k]; if (typeof s !== 'string') return s; for (const [a, b] of Object.entries(v || {})) s = s.split('{' + a + '}').join(String(b)); return s; };
export const webHeading = (lang, which) => tt(lang, which === 'l' ? 'hl' : 'hh');
export const typeLabel = (lang, t) => ((S[lang] || S.en).ty || S.en.ty)[t] || t;
export const WEB_CSS = '<style id="kweb18">.kw-strip{display:flex;gap:2px;margin:6px 0 2px;padding:0;list-style:none;max-width:480px}.kw-strip span{flex:0 0 auto;width:calc((100% - 58px) / 30);height:22px;border-radius:2px;background:var(--k-sunken,#E8ECEA)}' +
'.kw-strip .u{background:var(--k-ok,#1F6B45)}.kw-strip .b{background:var(--k-warn,#8A5A00)}.kw-strip .x,.kw-strip .z{background:var(--k-bad,#A12A1C)}.kw-strip .n{background:repeating-linear-gradient(135deg,var(--k-sunken,#E8ECEA) 0 3px,var(--k-line-2,#C9D1CE) 3px 5px)}' +
'.kw-key{display:flex;flex-wrap:wrap;gap:4px 14px;margin:4px 0 10px;padding:0;list-style:none;font-size:var(--k-fs-xs,13px);color:var(--k-muted)}.kw-key i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-inline-end:6px;vertical-align:-1px}' +
'.kw-site{margin:0 0 18px}.kw-site h3{font-size:var(--k-fs-md,17px);margin:0 0 4px;overflow-wrap:anywhere}.kw-site .k-xs{color:var(--k-muted)}.kw-dom{font-variant-numeric:tabular-nums;overflow-wrap:anywhere}' +
'.kw-links li span.kw-v{font-family:inherit;overflow-wrap:anywhere}</style>';
const KEYS = { u: 'l_u', b: 'l_b', x: 'l_x', '0': 'l_x', '-': 'l_n' };
function strip(health, h, lang) {
  const s = h.h || '', days = health.days || [];
  const cells = [...s].map((c, i) => '<span class="' + (c === '0' ? 'z' : c === '-' ? 'n' : c) + '" title="' + esc((days[i] ? fdt(days[i], lang) + ': ' : '') + tt(lang, KEYS[c] || 'l_n')) + '"></span>').join('');
  const cnt = c => [...s].filter(x => x === c).length;
  const alt = tt(lang, 'strip', { n: s.length }) + ': ' + [['u', 'l_u'], ['b', 'l_b'], ['x', 'l_x'], ['-', 'l_n']].map(([c, k]) => tt(lang, k) + ' ' + (c === 'x' ? cnt('x') + cnt('0') : cnt(c))).join(', ');
  return '<p class="k-xs">' + esc(tt(lang, 'strip', { n: s.length })) + '</p><div class="kw-strip" role="img" aria-label="' + esc(alt) + '">' + cells + '</div>' +
    '<ul class="kw-key" aria-hidden="true">' + [['u', 'var(--k-ok,#1F6B45)'], ['b', 'var(--k-warn,#8A5A00)'], ['x', 'var(--k-bad,#A12A1C)'], ['-', 'var(--k-sunken,#E8ECEA)']].map(([c, col]) => '<li><i style="background:' + col + '"></i>' + esc(tt(lang, KEYS[c])) + '</li>').join('') + '</ul>';
}
const src = (u, label) => u.startsWith('/') ? ' <a class="src" href="' + esc(u) + '">' + esc(label) + '</a>' : ' <a class="src" href="' + esc(u) + '" rel="nofollow noopener" target="_blank">' + esc(label) + '</a>';
const li = (t, u, label) => '<li class="kfact">' + esc(t) + (u ? src(u, label) : '') + '</li>';
function siteFacts(health, d, h, lang) {
const today = health.updated, home = 'https://' + d + '/', rd = TB.kbx_web__t.k0 + encodeURIComponent(d), ct = 'https://crt.sh/?q=' + encodeURIComponent(d);
const F = [];
if (h.rb) F.push(li(tt(lang, 'rb'), home + 'robots.txt', 'robots.txt'));
else if (h.s > 0 && h.s < 400) F.push(li(tt(lang, 'ok', { s: h.s, d: fdt(h.ck, lang), t: ((h.ms || 0) / 1000).toFixed(1) }), home, tt(lang, 's_home')));
else if (h.s >= 400 && h.s < 500) F.push(li(tt(lang, 'b4', { s: h.s, d: fdt(h.ck, lang) }), home, tt(lang, 's_home')));
else if (h.s >= 500) F.push(li(tt(lang, 'x5', { s: h.s, d: fdt(h.ck, lang) }), home, tt(lang, 's_home')));
else if (h.s === 0) F.push(li(tt(lang, 'no', { d: fdt(h.ck, lang), w: tt(lang, 'w_' + (h.err || 'connect')) }), home, tt(lang, 's_home')));
if (!h.rb && h.s != null && lastN(h, 7).n < 3) F.push(li(tt(lang, 'since', { d: fdt(firstChecked(health, h) || today, lang) }), '/data/web-health.json', tt(lang, 's_log')));
if (!h.rb) {
const w = lastN(h, 7);
if (w.n >= 3) F.push(li((w.bad ? tt(lang, 'bad', { k: w.bad, n: w.n }) : tt(lang, 'allok', { n: w.n })) + (w.n < 7 ? ' ' + tt(lang, 'since', { d: fdt(firstChecked(health, h) || today, lang) }) : ''), '/data/web-health.json', tt(lang, 's_log')));
if ((h.st || 0) >= 2) F.push(li(tt(lang, 'streak', { n: h.st }), '/data/web-health.json', tt(lang, 's_log')));
}
if (h.to) F.push(li(tt(lang, 'to', { d: h.to }), home, tt(lang, 's_home')));
if (h.ce === 'invalid') F.push(li(tt(lang, 'ce_bad', { d: fdt(h.ck, lang) }), ct, tt(lang, 's_ct')));
else if (h.ce) { const n = daysTo(h.ce, today); F.push(li(n < 0 ? tt(lang, 'ce_past', { d: fdt(h.ce, lang) }) : n <= 30 ? tt(lang, 'ce_soon', { d: fdt(h.ce, lang), n }) : tt(lang, 'ce', { d: fdt(h.ce, lang) }), ct, tt(lang, 's_ct'))); }
if (h.de) { const n = daysTo(h.de, today); F.push(li(n < 0 ? tt(lang, 'de_past', { d: fdt(h.de, lang) }) : n <= 60 ? tt(lang, 'de_soon', { d: fdt(h.de, lang), n }) : tt(lang, 'de', { d: fdt(h.de, lang) }), rd, tt(lang, 's_rdap'))); }
if (h.lm && h.lm <= today) F.push(li(tt(lang, 'lm', { d: fdt(h.lm, lang) }), home, tt(lang, 's_home')));
F.push(...forensicLines(d, h, today, lang, rd));
if (h.sm) F.push(li(tt(lang, 'sm', { d: fdt(h.sm, lang) }), home + 'sitemap.xml', 'sitemap'));
return '<ul class="fl">' + F.join('') + '</ul>' + (h.rb ? '' : strip(health, h, lang));
}
function forensicLines(d, h, today, lang, rd) {
const z = FZ[d] || {}, L = T30[lang] || T30.en, F = [], rg = h.dr || z.rg, iss = h.ci || z.iss, cb = h.cb || z.cb;
if (rg && rg <= today) { const y = Math.floor((Date.parse(today) - Date.parse(rg)) / (365.25 * 864e5)); F.push(li(fill30(L.ws_reg, { d: fdt(rg, lang), y: y < 1 ? L.ws_m : y === 1 ? L.ws_y1 : fill30(L.ws_y, { n: y }), r: fdt(h.dr ? h.ck : (z.rr || today), lang) }), rd, tt(lang, 's_rdap'))); }
if (iss && cb) F.push(li(fill30(L.ws_iss, { i: iss, d: fdt(cb, lang), r: fdt(h.ci ? h.ck : (z.cr || today), lang) }), 'https://crt.sh/?q=' + encodeURIComponent(d), 'crt.sh'));
return F;
}
const fill30 = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
const methodLine = (health, lang) => '<p class="k-xs">' + esc(tt(lang, 'upd', { d: fdt(health.updated, lang) })) + ' <a href="/data/web-health.json">' + esc(tt(lang, 'method')) + '</a>: ' + esc(lang !== 'en' && (S[lang] || {}).mth ? S[lang].mth : (health.method || '')) + '</p>';
export function projectDomains(wd, x) {
const H = (wd && wd.health && wd.health.d) || {};
return [...new Set([x.url, x.du].map(regDomain).filter(d => d && H[d]))];
}
export function webProjectHtml(wd, x, lang) {
const doms = projectDomains(wd, x); if (!doms.length) return '';
const H = wd.health.d;
return WEB_CSS + '<p class="ki">' + esc(tt(lang, 'intro')) + '</p>' + doms.map(d => '<div class="kw-site"><h3>' + esc(tt(lang, 'site', { d })) + '</h3>' + siteFacts(wd.health, d, H[d], lang) + '</div>').join('') + methodLine(wd.health, lang);
}
export function webDevHealthHtml(wd, slug, lang) {
const doms = ((wd && wd.devDoms.get(slug)) || []).slice().sort(); if (!doms.length) return '';
const H = wd.health.d, today = wd.health.updated, th = tt(lang, 'th');
if (doms.length === 1) return WEB_CSS + '<p class="ki">' + esc(tt(lang, 'intro')) + '</p><div class="kw-site"><h3>' + esc(tt(lang, 'site', { d: doms[0] })) + '</h3>' + siteFacts(wd.health, doms[0], H[doms[0]], lang) + '</div>' + methodLine(wd.health, lang);
const rows = doms.map(d => {
const h = H[d], w = lastN(h, 7), ce = h.ce && h.ce !== 'invalid' ? fdt(h.ce, lang) + (daysTo(h.ce, today) <= 30 && daysTo(h.ce, today) >= 0 ? ' (' + tt(lang, 'ind', { n: daysTo(h.ce, today) }) + ')' : '') : h.ce === 'invalid' ? tt(lang, 'ce_bad', { d: fdt(h.ck, lang) }) : '-';
const de = h.de ? fdt(h.de, lang) + (daysTo(h.de, today) <= 60 && daysTo(h.de, today) >= 0 ? ' (' + tt(lang, 'ind', { n: daysTo(h.de, today) }) + ')' : '') : '-';
const now = h.rb ? 'robots.txt' : h.s > 0 ? tt(lang, 't_ok', { s: h.s }) : h.s === 0 ? tt(lang, 't_no') : '-';
return '<tr><td data-label="' + esc(th[0]) + '"><a class="kw-dom" href="https://' + esc(d) + TB.kbx_web__t.k1 + esc(d) + '</a></td><td data-label="' + esc(th[1]) + '">' + esc(now) + '</td><td data-label="' + esc(th[2]) + '">' + esc(h.rb || w.n < 3 ? '-' : w.bad ? tt(lang, 't_bad', { k: w.bad, n: w.n }) : tt(lang, 'allok', { n: w.n })) + '</td><td data-label="' + esc(th[3]) + '">' + esc(ce) + '</td><td data-label="' + esc(th[4]) + '">' + esc(de) + '</td></tr>';
}).join('');
return WEB_CSS + '<p class="ki">' + esc(tt(lang, 'intro')) + TB.kbx_web__t.k2 + th.map(x => '<th>' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
(() => { const fz = doms.map(d => { const L = forensicLines(d, H[d], today, lang, TB.kbx_web__t.k3 + encodeURIComponent(d)); return L.length ? '<li><b>' + esc(d) + '</b><ul class="fl">' + L.join('') + '</ul></li>' : ''; }).join(''); return fz ? '<ul class="kw-fz">' + fz + '</ul>' : ''; })() +
'<p class="k-xs">' + esc(tt(lang, 'th')[3]) + TB.kbx_web__t.k4 + esc(tt(lang, 'th')[4]) + TB.kbx_web__t.k5 + methodLine(wd.health, lang);
}
export function webDevLinksHtml(wd, slug, lang) {
const doms = (wd && wd.devDoms.get(slug)) || []; if (!doms.length || !wd.links) return '';
const G = wd.byDev.get(slug) || [], P = pre(lang);
if (!G.length) return '<p class="ki">' + esc(tt(lang, 'l_none', { d: fdt(wd.links.updated, lang) })) + '</p>';
const items = G.map(g => {
const mine = g.d.filter(d => wd.health.d[d] && wd.health.d[d].dv === slug);
const others = [...new Set(g.dv.filter(s => s !== slug))].map(s => {
const od = g.d.filter(d => wd.health.d[d] && wd.health.d[d].dv === s);
return '<a href="' + P + '/developers/' + esc(s) + '/">' + esc(wd.devName.get(s) || s) + '</a> (' + od.map(esc).join(', ') + ')';
}).join(', ');
const v = g.t === 'cert' ? '' : g.t === 'skeleton' ? g.v.slice(0, 12) : g.v;
const txt = v ? tt(lang, 'l_item', { t: '%T%', v: '%V%', list: '%L%' }) : tt(lang, 'l_item0', { t: '%T%', list: '%L%' });
const html = esc(txt).replace('%T%', esc(typeLabel(lang, g.t))).replace('%V%', '<span class="kw-v" dir="ltr">' + esc(v) + '</span>').replace('%L%', others);
return '<li class="kfact">' + html + ' <small>(' + mine.map(esc).join(', ') + ')</small>' + src('https://' + mine[0] + '/', mine[0]) + '</li>';
}).join('');
return '<p class="ki">' + esc(tt(lang, 'l_intro')) + '</p><ul class="fl kw-links">' + items + '</ul><p><a class="more" href="' + P + '/graph/developers/">' + esc(tt(lang, 'l_graph')) + TB.kbx_web__t.k6 + esc(fdt(wd.links.updated, lang)) + ')</p>';
}
export async function webGroups(env) {
const wd = await webData(env).catch(() => null);
if (!wd || !wd.links) return { groups: [], updated: null };
return { updated: wd.links.updated, groups: (wd.links.groups || []).map(g => ({ t: g.t, v: g.v, label: typeLabel('en', g.t).replace(/^(the|one) /, '') + (g.t === 'cert' ? '' : ' ' + (g.t === 'skeleton' ? g.v.slice(0, 12) : g.v)), devs: g.dv, doms: g.d, dom: Object.fromEntries(g.d.map(d => [d, wd.health && wd.health.d[d] ? wd.health.d[d].dv : null])) })) };
}
export async function webStates(env) {
const wd = await webData(env).catch(() => null); const out = {};
if (!wd || !wd.health || !wd.named) return out;
const today = wd.health.updated;
for (const x of wd.named.projects || []) {
for (const d of projectDomains(wd, x)) {
const h = wd.health.d[d], w = lastN(h, 7);
const s = { d, down: !h.rb && w.n >= 3 && w.bad >= 3 ? w.bad + '/' + w.n : null, ce: h.ce && h.ce !== 'invalid' && daysTo(h.ce, today) <= 14 ? h.ce : h.ce === 'invalid' ? 'invalid' : null, de: h.de && daysTo(h.de, today) <= 30 ? h.de : null };
if (s.down || s.ce || s.de) { out[x.id] = s; break; }
if (!out[x.id]) out[x.id] = { d, down: null, ce: null, de: null };
}
}
return out;
}
export function webDiff(a, b) {
const L = []; a = a || {}; if (!b) return L;
if (b.down && !a.down) L.push('Developer website ' + b.d + ': no answer on ' + b.down.split('/')[0] + ' of the last ' + b.down.split('/')[1] + ' daily checks');
if (b.ce && b.ce !== a.ce) L.push('Developer website ' + b.d + ': ' + (b.ce === 'invalid' ? 'TLS certificate failed validation' : 'TLS certificate expires ' + b.ce));
if (b.de && b.de !== a.de) L.push('Developer website ' + b.d + ': domain registration expires ' + b.de);
return L;
}
function out(o, s) { return new Response(JSON.stringify(o), { status: s || 200, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': s && s !== 200 ? 'public, max-age=60' : 'public, max-age=600', 'x-content-type-options': 'nosniff' } }); }
export async function handle(req, u, env) {
const wd = await webData(env).catch(() => null);
if (!wd || !wd.health) return out({ error: 'unavailable', note: 'web-health.json not published yet' }, 503);
const meta = { updated: wd.health.updated, days: wd.health.days, legend: wd.health.legend, method: wd.health.method, licence: wd.health.licence, data: [ORIGIN + '/data/web-health.json', ORIGIN + '/data/dev-links.json'] };
let m = u.pathname.match(/^\/api\/x\/web\/project\/([A-Za-z0-9-]+)$/);
if (m) {
const id = m[1].toUpperCase(), x = ((wd.named && wd.named.projects) || []).find(p => p.id === id);
if (!x) return out({ error: 'not found' }, 404);
const doms = projectDomains(wd, x);
return out(Object.assign({ id, slug: x.s, sites: doms.map(d => Object.assign({ domain: d }, wd.health.d[d])) }, meta));
}
m = u.pathname.match(/^\/api\/x\/web\/dev\/([a-z0-9-]+)$/);
const s = m[1], doms = wd.devDoms.get(s) || [];
if (!doms.length && !wd.devName.has(s)) return out({ error: 'not found' }, 404);
return out(Object.assign({ developer: s, name: wd.devName.get(s) || null, sites: doms.map(d => Object.assign({ domain: d }, wd.health.d[d])), shared: (wd.byDev.get(s) || []).map(g => ({ type: g.t, type_label: (wd.links.types || {})[g.t] || g.t, value: g.v, domains: g.d, developers: g.dv })), caveat: wd.links && wd.links.caveat }, meta));
}
