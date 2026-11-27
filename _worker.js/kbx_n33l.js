// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_n33l__q, $s = TB.kbx_n33l__s, $t = TB.kbx_n33l__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
export const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.a, "'": '&#39;' }[c]));
let J = null, JP = null;
export async function load(env) {
if (J) return J;
if (!JP) JP = (async () => { try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.b)); if (r.ok) J = await r.json(); } catch (e) {} JP = null; return J; })();
return JP;
}
const lab = (l, k) => (J.lab[l] && J.lab[l][k]) || J.lab.en[k] || k;
const has = (s, l) => { for (let i = 0; i < (s || '').length; i += 2) if (s.slice(i, i + 2) === l) return true; return false; };
const FC = {};
export function footer(lang) {
if (!J) return '';
if (FC[lang]) return FC[lang];
const G = J.ft[lang] || J.ft.en, order = [$q.c, $q.d, $q.e, $q.f];
const h = order.map(k => G.find(g => g[0] === k)).filter(Boolean).map(g => $q.g + esc(lab(lang, g[0])) + $q.h + g[1].map(x => $q.i + esc(x[0]) + '"' + (lang !== 'en' && !/^\/(es|de|fr|nl|ru|zh|ar)\//.test(x[0]) ? $q.j : '') + '>' + esc(x[1]) + $q.k).join('') + $q.l).join('');
return (FC[lang] = h);
}
const MS_RX = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:|projects\/|m\/|countries\/|countries\/[a-z0-9-]{2,60}\/|rankings\/)$/;
const slugC = c => String(c || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export const msWants = p => MS_RX.test(p);
export function msBlock(lang, path) {
if (!J || !J.ms) return '';
const c = /\/countries\/([a-z0-9-]{2,60})\/$/.exec(path), co = c ? c[1] : null;
let L = J.ms.slice();
if (co) L = L.filter(x => x[2] && slugC(x[2]) === co).concat(L.filter(x => !(x[2] && slugC(x[2]) === co)));
const a = L.slice(0, 9).map(x => { const href = lang !== 'en' && has(x[3], lang) ? '/' + lang + x[0] : x[0];
return $q.m + esc(href) + '"' + (lang !== 'en' && href === x[0] ? $q.j : '') + $q.n + esc((x[5] && x[5][lang]) || x[4]) + $q.o; }).join(' · ');
return $s.MSCSS + $q.p + esc(lab(lang, 'ms_h')) + '"' + (lang === 'ar' ? $q.q : '') + $q.r + esc(lab(lang, 'ms_h')) + $q.s + a + $q.t + esc(lab(lang, $q.u)) + $q.v;
}
const LN = { en: 'English', es: 'Español', de: 'Deutsch', fr: 'Français', ru: 'Русский', nl: 'Nederlands', ar: 'العربية', zh: '简体中文' }, LO = ['en', 'es', 'de', 'fr', 'ru', 'nl', 'ar', 'zh'];
export function lswHtml(lang, alt) {
if (!J) return '';
const cur = lang.toUpperCase();
return $q.w + (J.lswcss || '') + $t.k0 + esc(lab(lang, $q.x)) + ': ' + cur + ' (' + LN[lang] + $s.k0 + esc(lab(lang, $q.x)) + $q.y + cur + $q.z +
LO.map(l => $q.i + esc(alt[l] || pre(l) + '/') + $q.A + l + $q.B + l + '"' + (l === lang ? $q.C : '') + '>' + l.toUpperCase() + $q.D + (l === 'ar' ? $q.q : '') + '>' + LN[l] + $q.E).join('') + $q.F;
}
export const lswMissing = (alt, seen) => LO.filter(l => alt[l] && !seen.has(l)).map(l => $q.i + esc(alt[l]) + $q.A + l + $q.B + l + '">' + l.toUpperCase() + $q.D + (l === 'ar' ? $q.q : '') + '>' + LN[l] + $q.E).join('');
export const altPath = href => { try { const u = new URL(href, ORIGIN); return u.hostname.replace(/^www\./, '') === $q.G ? u.pathname + u.search : null; } catch (e) { return null; } };
export async function devMarkets(req, u, env, r) {
const m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?developers\/([a-z0-9-]{1,90})\/$/.exec(u.pathname);
if (!m || req.method !== 'GET' || !r || r.status !== 200 || !/text\/html/.test(r.headers.get($q.H) || '')) return r;
const lang = m[1] || 'en';
if (!(await load(env))) return r;
let ix; try { const N = await import('./kbx_named.js'); ix = (await N.dvIx(env, m[2]).catch(() => null)) || await N.data(env); } catch (e) { return r; }   // n40 k61
const d = ix.devs && ix.devs.get(m[2]); if (!d || !d.ids || !d.ids.length) return r;
const c = new Map(); for (const id of d.ids) { const x = ix.byId.get(id); if (x && x.mk && !/sumba/i.test(x.mk)) c.set(x.mk, (c.get(x.mk) || 0) + 1); }
if (!c.size) return r;
let mkName = k => k; try { mkName = (await import('./kbx_hdate.js')).mkName; } catch (e) {}
const slugM = k => encodeURIComponent(String(k).toLowerCase().replace(/\s+/g, '-'));
const L = [...c].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(b[0])).slice(0, 12).map(([k, n]) => {
const tr = lang !== 'en' && ((ix.mk.get(k) || {}).k || 0) >= 5;
return $q.m + (tr ? '/' + lang : '') + '/m/' + slugM(k) + '/"' + (lang !== 'en' && !tr ? $q.j : '') + $q.n + esc(mkName(k, lang)) + $q.I + esc(lab(lang, n === 1 ? 'sm_n1' : 'sm_n').replace('{n}', n)) + ')';
});
const line = $t.k1 + esc(lab(lang, $q.d)) + $q.s + L.join(' · ') + '</p>';
let done = false;
return new HTMLRewriter().on($q.J, { element(e) { if (done) return; done = true; e.after(line, { html: true }); } }).transform(r);
}
export const SM_RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?sitemap\/?$/;
export async function sitemapPage(req, u, env, shell) {
const m = SM_RX.exec(u.pathname); if (!m) return null;
if (!/\/$/.test(u.pathname)) return new Response(null, { status: 301, headers: { location: u.pathname + '/' } });
const lang = m[1] || 'en';
if (!(await load(env))) return null;
const N = await import('./kbx_named.js');
const sh = await shell(pre(lang) + $q.K); if (!sh || sh.status !== 200) return null;
const nf = new Intl.NumberFormat(lang === 'en' ? 'en-GB' : lang === 'zh' ? 'zh-CN' : lang, { numberingSystem: 'latn' });
const cnt = n => esc(lab(lang, n === 1 ? 'sm_n1' : 'sm_n').replace('{n}', nf.format(n)));
let dd = J.data || J.v; try { dd = new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : lang === 'zh' ? 'zh-CN' : lang, { day: $q.L, month: 'long', year: $q.L, timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(String(J.data || J.v).slice(0, 10) + $q.M)); } catch (e) {}
const href = (path, ls) => lang !== 'en' && has(ls, lang) ? '/' + lang + path : path;
const enOnly = (path, ls) => lang !== 'en' && !has(ls, lang) ? $q.j : '';
let total = 0;
const co = J.sm.map(([c, cs, ls, nm, mks]) => {
const n = mks.reduce((a, x) => a + x[1], 0); total += n;
const cn = (nm && nm[lang]) || c, cp = $q.N + cs + '/';
const head = has(ls, 'en') ? $q.m + href(cp, ls) + '"' + enOnly(cp, ls) + $q.n + esc(cn) + $q.o : '<bdi>' + esc(cn) + $q.O;
const sl = s => encodeURIComponent(String(s).toLowerCase().replace(/\s+/g, '-'));
const li = mks.map(([mk, k, mls, mn]) => { const mp = '/m/' + sl(mk) + '/', t = '<bdi>' + esc((mn && mn[lang]) || mk) + $q.O;
return '<li>' + (has(mls, 'en') ? $q.m + href(mp, mls) + '"' + enOnly(mp, mls) + '>' + t + '</a>' : t) + $q.P + cnt(k) + $q.Q; }).join('');
return $q.R + head + $q.P + cnt(n) + $q.S + li + $q.l;
}).join('');
const G = J.ft[lang] || J.ft.en, main = G.filter(g => g[0] === $q.c || g[0] === $q.e).flatMap(g => g[1]);
const li = A => A.map(x => '<li><a href="' + esc(x[0]) + '"' + (lang !== 'en' && !/^\/(es|de|fr|nl|ru|zh|ar)\//.test(x[0]) ? ' hreflang="en"' : '') + '>' + esc(x[1]) + '</a></li>').join('');
const body = $t.k2 + pre(lang) + $q.T + esc(lab(lang, 'sm_h1')) + $q.U + esc(lab(lang, 'sm_h1')) + $q.V + esc(lab(lang, $q.W).replace('{d}', dd)) + $q.X +
$q.Y + (lang === 'ar' ? $q.q : '') + '><h2>' + esc(lab(lang, $q.Z)) + $q.aa + li(main) + '</ul>' +
'<h2>' + esc(lab(lang, 'sm_co')) + $q.ab + co + $q.ac +
'<h2>' + esc(lab(lang, $q.ad)) + $q.aa + li((J.ft[lang] || J.ft.en).find(g => g[0] === $q.f)[1].concat(J.more[lang] || J.more.en)) + $q.l + $s.CSS;
const canon = ORIGIN + pre(lang) + $q.ae, title = lab(lang, $q.af);
const pg = { title: (title + $q.ag).length > 60 ? title : title + $q.ag, desc: lab(lang, $q.ah), canon, body, alt: l => ORIGIN + pre(l) + $q.ae,
ld: { '@context': $q.ai, '@graph': [{ '@type': $q.aj, name: title, url: canon, inLanguage: lang, description: lab(lang, $q.ah), dateModified: String(J.data || J.v).slice(0, 10), isPartOf: { '@type': $q.ak, name: $q.al, url: ORIGIN + '/' } },
{ '@type': $q.am, itemListElement: [{ '@type': $q.an, position: 1, name: $q.al, item: ORIGIN + pre(lang) + '/' }, { '@type': $q.an, position: 2, name: lab(lang, 'sm_h1'), item: canon }] }] } };
const out = await N.assemble(pg, lang, sh);
return new Response(out, { status: 200, headers: { 'content-type': $q.ao, 'cache-control': $q.ap } });
}
