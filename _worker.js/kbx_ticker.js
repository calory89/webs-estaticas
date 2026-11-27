// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_ticker__q, $s = TB.kbx_ticker__s;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
const ORIGIN = 'https://kolaboro.com';
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.a }[c]));
const day = s => { const x = new Date(String(s).slice(0, 10) + $q.b); return isNaN(x) ? '' : MON[x.getUTCMonth()] + ' ' + x.getUTCDate(); };
let C = { t: 0, h: null }, K33 = null;
import { TB } from './kbx_strings.js';
const S = TB.kbx_ticker_S;
export const SHIP_N = 3;
const SITE_V = 'n40k54a';
function file(e, n) { return TF[n] || (TF[n] = file0(e, n).then(v => { if (v == null) delete TF[n]; return v; })); }   // n40 k21: read once
const TF = {};
async function file0(env, n) {
try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.c + n)); if (r.ok) return await r.json(); } catch (e) {}
return null;
}
let I = { t: 0, v: null };
export async function tickerItems(env) {
if (I.v && Date.now() - I.t < 300000) return I.v;
const T = await file(env, $q.d);
I = { t: Date.now(), v: ((T && T.items) || []).filter(x => x && x.text && x.date) };
return I.v;
}
export function mergeShips(items, ships) {
const a = items.map(x => ({ d: String(x.date).slice(0, 10), k: x.kind === 'data' ? 'data' : $q.e, t: x.text, tl: x.tl || undefined, u: x.url || undefined, id: tickId(x),
s: shortOf(x, 'en'), sl: x.tl ? Object.fromEntries(Object.keys(x.tl).map(l => [l, shortOf(x, l)])) : undefined }));
const seen = new Set(a.map(x => x.t.toLowerCase()));
for (const s of ships) if (s && s.t && !seen.has(s.t.toLowerCase())) a.push(s);
return a.sort((x, y) => String(y.d).localeCompare(String(x.d))).slice(0, 24);
}
const TL_LANGS = ['es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
export function shortLine(t, lang) {
const s = String(t || '').trim(); if (!s) return s;
if (lang === 'zh') { const c = s.split(/[：:；;（(]/)[0]; return c.length >= 10 && c.length <= 24 ? c + (c.length < s.length ? '…' : '') : s.length <= 24 ? s : s.slice(0, 22) + '…'; }
const W = s.split(/\s+/), cut = s.split(/[:;(]|\s[-–]\s/)[0].trim().split(/\s+/);
if (cut.length <= 12 && cut.length >= 6) return cut.join(' ').replace(/[,.]$/, '') + (cut.length < W.length ? '…' : '');
return W.length <= 12 ? s : W.slice(0, 12).join(' ').replace(/[,.:;]$/, '') + '…';
}
export function tickId(x) { let h = 2166136261; for (const ch of String(x.text || '')) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; } return 'u-' + String(x.date || '').slice(0, 10) + '-' + h.toString(36).slice(0, 6); }
const shortOf = (x, lang) => { const own = lang === 'en' ? x.short : x.tls && x.tls[lang]; return own || shortLine(lang === 'en' ? x.text : x.tl && x.tl[lang], lang); };
const LBL = { en: ['DATA', 'SHIPPED'], es: ['DATOS', 'NOVEDAD'], de: ['DATEN', 'NEU'], fr: ['DONNÉES', 'NOUVEAU'], nl: ['DATA', 'NIEUW'], ru: ['ДАННЫЕ', 'НОВОЕ'], zh: ['数据', '新功能'], ar: ['بيانات', 'جديد'] };
const LOCT = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const dayL = (s, lang) => { if (lang === 'en') return day(s); const x = new Date(String(s).slice(0, 10) + $q.b); if (isNaN(x)) return ''; try { return new Intl.DateTimeFormat(LOCT[lang], { day: $q.f, month: 'short', timeZone: 'UTC' }).format(x); } catch (e) { return day(s); } };
export async function tickerHtml(env, lang) {
lang = TL_LANGS.includes(lang) ? lang : 'en';
if (C.h !== null && Date.now() - C.t < 300000 && C.h[lang] != null) return C.h[lang];
if (C.h === null || Date.now() - C.t >= 300000) C = { t: Date.now(), h: {} };
const [T, S] = await Promise.all([file(env, $q.d), file(env, $q.g)]);
const items = [];
for (const x of (T && T.items) || []) if (x && x.text && x.date) items.push(x);
if (items.length < 8) for (const d of ((S && S.days) || []).slice(-3).reverse()) for (const l of ((d.summary || {}).lines || []).slice(0, 4)) if (l && l.text) items.push({ date: d.date, kind: $q.h, text: l.text });
const seen = new Set(), out = [];
items.sort((a, b) => String(b.date).localeCompare(String(a.date)));
for (const x of items) { const k = x.text.toLowerCase().trim(); if (seen.has(k)) continue; seen.add(k); if (lang !== 'en' && !(x.tl && x.tl[lang])) continue; out.push(x); if (out.length >= SHIP_N) break; }
const L = LBL[lang];
const up = (lang === 'en' ? '' : '/' + lang) + $q.i;
const h = out.map(x => { const t = lang === 'en' ? x.text : x.tl && x.tl[lang]; if (!t) return '';
return $q.j + up + tickId(x) + '"><b>' + esc(dayL(x.date, lang)) + $q.k + (x.kind === 'data' ? $q.l + L[0] : $q.m + L[1]) + '</em>' + esc(shortOf(x, lang)) + '</a>'; }).join('');
C.h[lang] = h;
return h;
}
const deEnt = v => v.replace(/&#x([0-9a-f]{1,6});?/gi, (m, h) => { try { return String.fromCodePoint(parseInt(h, 16)); } catch (e) { return ''; } }).replace(/&#(\d{1,7});?/g, (m, n) => { try { return String.fromCodePoint(+n); } catch (e) { return ''; } }).replace(/&colon;/gi, ':').replace(/&(?:tab|newline);/gi, '');
function safeHref(e) { const v = deEnt(e.getAttribute('href') || '').replace(/[\t\n\r]/g, ''); if (/^[\u0000- ]*(?:javascript|vbscript|data):/i.test(v)) { e.setAttribute('href', '#'); e.removeAttribute($q.n); } }
export async function kbTick(req, r, env) {
try {
if (req.method !== 'GET' || !r || (r.status !== 200 && r.status !== 404 && r.status !== 410) || !/text\/html/.test(r.headers.get($q.o) || '')) return r;
const lm = /^\/(es|de|fr|nl|ru|zh|ar)(\/|$)/.exec(new URL(req.url).pathname), h = await tickerHtml(env, lm ? lm[1] : 'en');
let rw = new HTMLRewriter().on($s.BAD_HREF, { element: safeHref })
.on($q.p, { element(e) { e.remove(); } })
.on($q.q, { element(e) { const lp = /^\/(es|de|fr|nl|ru|zh|ar)(\/|$)/.exec(new URL(req.url).pathname); e.after($q.r + (lp ? '/' + lp[1] : '') + $q.s + esc(S.SC_L[lp ? lp[1] : 'en']) + '</a>', { html: true }); } });
const pl = lm ? lm[1] : 'en', pp = (lm ? '/' + pl : '') + $q.t, pth = new URL(req.url).pathname;
if (S.COI && S.COI[pl]) rw = rw.on($q.u, { element(e) { e.append($q.v + esc(S.COI[pl]) + $q.w + (pl === 'en' ? '' : $q.x) + '>' + esc(S.COI_L[pl]) + $q.y, { html: true }); } });
rw = rw.on($q.z, { element(e) { e.setAttribute('href', pp); } }).on($q.A, { element(e) { e.after($q.r + pp + '">' + esc(S.PROG_L[pl]) + '</a>', { html: true }); } })
.on($q.B, { element(e) { const lp = lm ? '/' + pl : ''; e.setAttribute('href', lp + $q.C); e.after($q.r + lp + $q.D + esc(S.FT27[pl][0]) + $q.E + lp + $q.F + esc(S.FT27[pl][1]) + $q.E + lp + $q.G + esc(S.FT29[pl][0]) + $q.E + lp + $q.H + esc(S.FT29[pl][1]) + '</a>', { html: true }); } });
try { if (!K33) K33 = await import('./kbx_n33l.js'); if (await K33.load(env)) {
const alt = {}, seen = new Set(); let lsw = false, done = false, msDone = false;
const fh = K33.footer(pl), ms = r.status === 200 && K33.msWants(pth) ? K33.msBlock(pl, pth) : '';
rw = rw.on($q.I, { element(e) { if (/\?/.test(e.getAttribute('href') || '') && !/^\/x\//.test(pth)) { e.remove(); return; } const l = e.getAttribute($q.J), p = K33.altPath(e.getAttribute('href') || ''); if (p && K33.LANGS.includes(l)) alt[l] = p; } })
.on($q.K, { element() { lsw = true; } })
.on($q.L, { element(e) { const l = e.getAttribute($q.J); seen.add(l); if (alt[l]) e.setAttribute('href', alt[l]); } })
.on($q.M, { element(e) { e.onEndTag(t => { const add = K33.lswMissing(alt, seen); if (add) t.before(add, { html: true }); }); } })
.on($q.N, { element(e) { if (lsw || done || Object.keys(alt).length < 2) return; done = true; e.before(K33.lswHtml(pl, alt), { html: true }); } });
if (fh) rw = rw.on($q.O, { element(e) { e.remove(); } }).on($q.P, { element(e) { e.append(fh, { html: true }); } });
if (ms && /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?$/.test(pth)) rw = rw.on($q.Q, { element(e) { if (msDone) return; msDone = true; e.append(ms, { html: true }); } }).on('main', { element(e) { e.onEndTag(t => { if (msDone) return; msDone = true; t.before(ms, { html: true }); }); } });
else if (ms) rw = rw.on('main', { element(e) { if (msDone) return; msDone = true; e.prepend(ms, { html: true }); } });
} } catch (e) {}
if (/^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?changelog\/$/.test(pth)) { let once = false; rw = rw.on($q.R, { element(e) { if (once) return; once = true; e.after($q.S + esc(S.PROG_C[pl]) + $q.T + pp + '">' + esc(S.PROG_L[pl]) + $q.U, { html: true }); } }); }
if (h) rw = rw.on($q.V, { element(e) { if (e.getAttribute($q.W) === 'true') { e.setInnerContent(''); e.setAttribute('inert', ''); } else e.setInnerContent(h, { html: true }); } }).on($q.X, { element(e) { if (lm) e.setAttribute('lang', lm[1]); } }).on($q.Y, { element(e) { e.setAttribute('src', $q.Z + SITE_V); } });
return rw.transform(r);
} catch (e) { return r; }
}
