// comments: _notes/kolaboro-worker-comments.txt
const ORIGIN = 'https://kolaboro.com';
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const day = s => { const x = new Date(String(s).slice(0, 10) + 'T00:00:00Z'); return isNaN(x) ? '' : MON[x.getUTCMonth()] + ' ' + x.getUTCDate(); };
let C = { t: 0, h: null }, K33 = null;
import { TB } from './kbx_strings.js';
const S = TB.kbx_ticker_S;
export const SHIP_N = 3;
const SITE_V = 'n40k10a';
async function file(env, n) {
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + n)); if (r.ok) return await r.json(); } catch (e) {}
  return null;
}
let I = { t: 0, v: null };
export async function tickerItems(env) {
if (I.v && Date.now() - I.t < 300000) return I.v;
const T = await file(env, 'ticker.json');
I = { t: Date.now(), v: ((T && T.items) || []).filter(x => x && x.text && x.date) };
return I.v;
}
export function mergeShips(items, ships) {
const a = items.map(x => ({ d: String(x.date).slice(0, 10), k: x.kind === 'data' ? 'data' : 'feature', t: x.text, tl: x.tl || undefined, u: x.url || undefined, id: tickId(x),
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
const dayL = (s, lang) => { if (lang === 'en') return day(s); const x = new Date(String(s).slice(0, 10) + 'T00:00:00Z'); if (isNaN(x)) return ''; try { return new Intl.DateTimeFormat(LOCT[lang], { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(x); } catch (e) { return day(s); } };
export async function tickerHtml(env, lang) {
lang = TL_LANGS.includes(lang) ? lang : 'en';
if (C.h !== null && Date.now() - C.t < 300000 && C.h[lang] != null) return C.h[lang];
if (C.h === null || Date.now() - C.t >= 300000) C = { t: Date.now(), h: {} };
const [T, S] = await Promise.all([file(env, 'ticker.json'), file(env, 'shipping.json')]);
const items = [];
for (const x of (T && T.items) || []) if (x && x.text && x.date) items.push(x);
if (items.length < 8) for (const d of ((S && S.days) || []).slice(-3).reverse()) for (const l of ((d.summary || {}).lines || []).slice(0, 4)) if (l && l.text) items.push({ date: d.date, kind: 'shipped', text: l.text });
const seen = new Set(), out = [];
items.sort((a, b) => String(b.date).localeCompare(String(a.date)));
for (const x of items) { const k = x.text.toLowerCase().trim(); if (seen.has(k)) continue; seen.add(k); if (lang !== 'en' && !(x.tl && x.tl[lang])) continue; out.push(x); if (out.length >= SHIP_N) break; }
const L = LBL[lang];
const up = (lang === 'en' ? '' : '/' + lang) + '/updates/#';
const h = out.map(x => { const t = lang === 'en' ? x.text : x.tl && x.tl[lang]; if (!t) return '';
return '<a class="si" href="' + up + tickId(x) + '"><b>' + esc(dayL(x.date, lang)) + '</b><em class="' + (x.kind === 'data' ? 'k-data">' + L[0] : 'k-feature">' + L[1]) + '</em>' + esc(shortOf(x, lang)) + '</a>'; }).join('');
C.h[lang] = h;
return h;
}
const deEnt = v => v.replace(/&#x([0-9a-f]{1,6});?/gi, (m, h) => { try { return String.fromCodePoint(parseInt(h, 16)); } catch (e) { return ''; } }).replace(/&#(\d{1,7});?/g, (m, n) => { try { return String.fromCodePoint(+n); } catch (e) { return ''; } }).replace(/&colon;/gi, ':').replace(/&(?:tab|newline);/gi, '');
function safeHref(e) { const v = deEnt(e.getAttribute('href') || '').replace(/[\t\n\r]/g, ''); if (/^[\u0000- ]*(?:javascript|vbscript|data):/i.test(v)) { e.setAttribute('href', '#'); e.removeAttribute('target'); } }
export async function kbTick(req, r, env) {
try {
if (req.method !== 'GET' || !r || (r.status !== 200 && r.status !== 404 && r.status !== 410) || !/text\/html/.test(r.headers.get('content-type') || '')) return r;
const lm = /^\/(es|de|fr|nl|ru|zh|ar)(\/|$)/.exec(new URL(req.url).pathname), h = await tickerHtml(env, lm ? lm[1] : 'en');
let rw = new HTMLRewriter().on(TB.kbx_ticker__s.BAD_HREF, { element: safeHref })
.on('nav#menu > a[href$="/cases/"]', { element(e) { e.remove(); } })
.on('footer a[href="/accessibility/"]', { element(e) { const lp = /^\/(es|de|fr|nl|ru|zh|ar)(\/|$)/.exec(new URL(req.url).pathname); e.after('</li><li><a href="' + (lp ? '/' + lp[1] : '') + '/shortcuts/">' + esc(S.SC_L[lp ? lp[1] : 'en']) + '</a>', { html: true }); } });
const pl = lm ? lm[1] : 'en', pp = (lm ? '/' + pl : '') + '/progress/', pth = new URL(req.url).pathname;
if (S.COI && S.COI[pl]) rw = rw.on('footer p.fine', { element(e) { e.append(' <span class="coi">' + esc(S.COI[pl]) + ' <a href="/independence/"' + (pl === 'en' ? '' : ' hreflang="en"') + '>' + esc(S.COI_L[pl]) + '</a>.</span>', { html: true }); } });
rw = rw.on('a.ship-l', { element(e) { e.setAttribute('href', pp); } }).on('footer a[href$="/changelog/"]', { element(e) { e.after('</li><li><a href="' + pp + '">' + esc(S.PROG_L[pl]) + '</a>', { html: true }); } })
.on('footer a[href="/corrections/"]', { element(e) { const lp = lm ? '/' + pl : ''; e.setAttribute('href', lp + '/corrections/'); e.after('</li><li><a href="' + lp + '/contact/">' + esc(S.FT27[pl][0]) + '</a></li><li><a href="' + lp + '/cite/">' + esc(S.FT27[pl][1]) + '</a></li><li><a href="' + lp + '/editorial-policy/">' + esc(S.FT29[pl][0]) + '</a></li><li><a href="' + lp + '/how-we-work/">' + esc(S.FT29[pl][1]) + '</a>', { html: true }); } });
try { if (!K33) K33 = await import('./kbx_n33l.js'); if (await K33.load(env)) {
const alt = {}, seen = new Set(); let lsw = false, done = false, msDone = false;
const fh = K33.footer(pl), ms = r.status === 200 && K33.msWants(pth) ? K33.msBlock(pl, pth) : '';
rw = rw.on('head link[rel="alternate"][hreflang]', { element(e) { if (/\?/.test(e.getAttribute('href') || '') && !/^\/x\//.test(pth)) { e.remove(); return; } const l = e.getAttribute('hreflang'), p = K33.altPath(e.getAttribute('href') || ''); if (p && K33.LANGS.includes(l)) alt[l] = p; } })
.on('details.lsw', { element() { lsw = true; } })
.on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); seen.add(l); if (alt[l]) e.setAttribute('href', alt[l]); } })
.on('details.lsw ul', { element(e) { e.onEndTag(t => { const add = K33.lswMissing(alt, seen); if (add) t.before(add, { html: true }); }); } })
.on('nav#menu > a.btn', { element(e) { if (lsw || done || Object.keys(alt).length < 2) return; done = true; e.before(K33.lswHtml(pl, alt), { html: true }); } });
if (fh) rw = rw.on('footer .fgrid > div:not(:first-child)', { element(e) { e.remove(); } }).on('footer .fgrid', { element(e) { e.append(fh, { html: true }); } });
if (ms && /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?$/.test(pth)) rw = rw.on('#hp-band > .wrap', { element(e) { if (msDone) return; msDone = true; e.append(ms, { html: true }); } }).on('main', { element(e) { e.onEndTag(t => { if (msDone) return; msDone = true; t.before(ms, { html: true }); }); } });
else if (ms) rw = rw.on('main', { element(e) { if (msDone) return; msDone = true; e.prepend(ms, { html: true }); } });
} } catch (e) {}
if (/^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?changelog\/$/.test(pth)) { let once = false; rw = rw.on('main h1', { element(e) { if (once) return; once = true; e.after('<p class="k-small">' + esc(S.PROG_C[pl]) + ' <a href="' + pp + '">' + esc(S.PROG_L[pl]) + '</a></p>', { html: true }); } }); }
if (h) rw = rw.on('.ship-g', { element(e) { if (e.getAttribute('aria-hidden') === 'true') { e.setInnerContent(''); e.setAttribute('inert', ''); } else e.setInnerContent(h, { html: true }); } }).on('.ship-v[lang="en"]', { element(e) { if (lm) e.setAttribute('lang', lm[1]); } }).on('script[src^="/k/site.js"]', { element(e) { e.setAttribute('src', '/k/site.js?v=' + SITE_V); } });
return rw.transform(r);
} catch (e) { return r; }
}
