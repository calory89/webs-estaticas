// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_n31a__q, $s = TB.kbx_n31a__s, $t = TB.kbx_n31a__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { TB } from './kbx_strings.js';
let T = null;
async function loadT(env) {
if (T) return T;
try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.a)); if (r.ok) T = await r.json(); } catch (e) {}
if (!T) { try { const r = await fetch(ORIGIN + $q.b, { cf: { cacheTtl: 300 } }); if (r.ok) T = await r.json(); } catch (e) {} }
return T;
}
const CTA = {"en":["Check this project","€490 · written report usually within 7 days"],"es":["Comprobar este proyecto","490 € · informe escrito, normalmente en 7 días"],"de":["Dieses Projekt prüfen","490 € · schriftlicher Bericht meist innerhalb von 7 Tagen"],"fr":["Vérifier ce projet","490 € · rapport écrit, en général sous 7 jours"],"nl":["Dit project controleren","€ 490 · schriftelijk rapport meestal binnen 7 dagen"],"ru":["Проверить этот проект","490 € · письменный отчёт обычно за 7 дней"],"zh":["核查这个项目","490 欧元 · 书面报告通常 7 天内完成"],"ar":["افحص هذا المشروع","490 يورو · تقرير مكتوب عادةً خلال 7 أيام"]};
const ORIGIN = 'https://kolaboro.com';
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const LP = '(?:(es|de|fr|nl|ru|zh|ar)\\/)?';
const SR_SLUGS = new Set(['crown-penang']);
const RX = {
fn: new RegExp('^\\/' + LP + 'funnel\\/?$'), rq: new RegExp('^\\/' + LP + 'request-project\\/?$'), bz: new RegExp('^\\/' + LP + 'business\\/?$'),
mo: new RegExp('^\\/' + LP + 'money\\/?$'), as: new RegExp('^\\/' + LP + 'already-signed\\/?$'), sr: new RegExp('^\\/' + LP + 'report\\/sample\\/([a-z0-9-]{1,90})\\/?$')
};
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:funnel|request-project|business|money|already-signed|report\/sample\/[a-z0-9-]{1,90})\/?$|^\/api\/open\/(?:fn|funnel|sv)$/;
const pre = l => l === 'en' ? '' : '/' + l;
const LOCAL_PATHS = new Set(['/projects/', '/tools/bulk-check/', '/tools/widget/', '/tools/contract-reader/', '/api/docs/', '/pricing/', '/buyer-protection-law/', '/check/']);
const lk = (l, p) => (LOCAL_PATHS.has(p) ? pre(l) : '') + p;
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.c, "'": '&#39;' }[c]));
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
const nf = (n, l) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); } };
const fdt = (d, l) => { if (!d) return ''; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { day: $q.d, month: 'short', year: $q.d, timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(String(d).slice(0, 10) + $q.e)); } catch (e) { return d; } };
const day = o => new Date(Date.now() - (o || 0) * 864e5).toISOString().slice(0, 10);
const dirA = l => l === 'ar' ? $q.f : '';
const bdi = (l, h) => l === 'ar' ? '<bdi>' + h + $q.g : h;
export const STEPS = ['project_cta', 'check_start', 'check_done', 'lead', 'book', 'pay_click', 'pay_return', 'request'];
export const MISS = ['permit', 'date', 'price', 'dev', 'site', 'nothing'];
const OK_STEP = new Set(STEPS.concat(MISS.map(m => 'miss_' + m)));
const CK = (d, k) => ORIGIN + $q.h + d + '/' + k;
const PV = (d, k) => ORIGIN + $q.i + d + '/' + k;
const SVK = id => ORIGIN + $q.j + id;
const BOT = /bot|crawl|spider|slurp|lighthouse|headless|preview|fetch|curl|wget|python|httpclient|axios|GPT|Claude|anthropic|Perplexity|Bytespider|facebookexternalhit|meta-extern/i;
async function get(k) { try { const r = await caches.default.match(k); return r ? (+(await r.text()) || 0) : 0; } catch (e) { return 0; } }
async function inc(k) { try { const n = await get(k); await caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': $q.k, 'content-type': $q.l } })); } catch (e) {} }
const RL = new Map();
function allow(req, max) {
const ip = req.headers.get($q.m) || 'x', m = Math.floor(Date.now() / 60000), k = ip + '|' + m, n = (RL.get(k) || 0) + 1;
RL.set(k, n); if (RL.size > 4000) for (const key of RL.keys()) if (!key.endsWith('|' + m)) RL.delete(key);
return n <= max;
}
const jout = (o, st, extra) => new Response(JSON.stringify(o, null, 1), { status: st || 200, headers: Object.assign({ 'content-type': $q.n, 'access-control-allow-origin': '*', 'cache-control': $q.o, 'x-content-type-options': $q.p }, extra || {}) });
function ourOrigin(req) { const o = req.headers.get($q.q) || req.headers.get($q.r) || ''; return !o || /^https:\/\/(www\.)?kolaboro\.com(\/|$)/.test(o); }
async function funnel(days) {
days = days || 28;
const ds = Array.from({ length: days }, (_, i) => day(i));
const sum = async (key, names) => { const o = {}; await Promise.all(names.map(async n => { const v = await Promise.all(ds.map(d => get(key(d, n)))); o[n] = v.reduce((a, b) => a + b, 0); })); return o; };
const [pv, st] = await Promise.all([sum(PV, [$q.s, 'check', $q.t]), sum(CK, [...OK_STEP])]);
const order = [[$q.s, pv.project], [$q.u, st.project_cta], ['check', pv.check], [$q.v, st.check_start], [$q.w, st.check_done], ['lead', st.lead], ['book', st.book], [$q.x, st.pay_click], [$q.y, st.pay_return]];
return { page: ORIGIN + $q.z, at: new Date().toISOString(), days, licence: $t.k0,
note: $s.k0,
steps: order.map(([k, n]) => ({ step: k, count: n })), pricing_page_views: pv.pricing, project_requests: st.request,
missing_answers: Object.fromEntries(MISS.map(m => [m, st['miss_' + m] || 0])) };
}
const page = (html, lang, extra) => new Response(html, { headers: Object.assign({ 'content-type': $q.A, 'cache-control': $q.B, 'content-language': lang }, extra || {}) });
const hero = (lang, h1, lead, crumb) => $q.C + dirA(lang) + $t.k1 + (pre(lang) || '') + $q.D + esc(crumb || h1) + $q.E + esc(h1) + $q.F + esc(lead) + $q.G;
async function build(pg, lang, shell, shellPath) {
const n = await import('./kbx_named.js');
return n.assemble(pg, lang, await shell(pre(lang) + shellPath));
}
const ld = (name, url, desc) => ({ '@context': $q.H, '@type': $q.I, name, url, description: desc, inLanguage: LOC.en, isPartOf: { '@type': $q.J, name: $q.K, url: ORIGIN + '/' }, publisher: { '@type': $q.L, name: $q.K, url: ORIGIN + '/' } });
function pgObj(lang, path, title, desc, body, lastmod) {
const canon = ORIGIN + pre(lang) + path, o = ld(title, canon, desc); o.inLanguage = lang;
return { title: title + $q.M, desc: String(desc).slice(0, 155), canon, body: $s.CSS + body, ld: o, lastmod: lastmod || $q.N, alt: l => ORIGIN + pre(l) + path };
}
async function fnPage(lang, shell) {
const L = T[lang], f = await funnel(28);
let prev = null;
const rows = f.steps.map(s => { const pct = prev ? Math.round(s.count / prev * 1000) / 10 : null; const r = $q.O + esc(L.fn_steps[s.step]) + $q.P + nf(s.count, lang) + $q.P + (pct == null || !prev ? '' : nf(pct, lang) + ' %') + $q.Q; prev = s.count || null; return r; }).join('');
const sv = MISS.map(m => $q.O + esc(L.sv_o[m]) + $q.P + nf(f.missing_answers[m], lang) + $q.Q).join('');
const body = hero(lang, L.fn_h1, L.fn_lead, L.fn_title) + $q.R + dirA(lang) + '>' +
$t.k2 + L.fn_th.map((h, i) => $q.S + (i ? $q.T : '') + '>' + esc(h) + '</th>').join('') + $q.U + rows + $q.V +
$q.W + esc(L.fn_note) + '</p>' +
'<h2>' + esc(L.fn_sv_h) + $t.k3 + esc(L.fn_sv_th[0]) + $t.k4 + esc(L.fn_sv_th[1]) + $q.X + sv + $q.V +
'<p>' + esc(fill(L.fn_rq, { n: nf(f.project_requests, lang) })) + $q.Y + pre(lang) + $q.Z + esc(L.rq_title) + $q.aa +
$t.k5 + esc(L.fn_json) + $q.ab + esc(L.more) + $q.ac;
return page(await build(pgObj(lang, $q.z, L.fn_title, L.fn_lead, body, day()), lang, shell, $q.ad), lang, { 'cache-control': $q.ae });
}
async function rqPage(lang, shell) {
const L = T[lang];
const msg = { q: L.rq_e_q, em: L.rq_e_em, ok: L.rq_e_ok, dup: L.rq_e_dup, net: L.rq_e_net, sending: L.rq_sending, alt: L.rq_alt, ck: lk(lang, $q.af) };
const body = hero(lang, L.rq_h1, L.rq_lead, L.rq_title) + $q.R + dirA(lang) + '>' +
$t.k6 + esc(JSON.stringify(msg)) + '">' +
$q.ag + esc(L.rq_q) + $t.k7 +
$q.ag + esc(L.rq_pl) + $t.k8 + esc(L.rq_pl_ph) + $q.ah +
$q.ag + esc(L.rq_em) + $t.k9 +
$s.k1 +
$t.k10 + esc(L.rq_ok) + $q.ai + esc(L.rq_priv) + $q.aj +
$t.k11 + esc(L.rq_send) + $q.ak +
$t.k12 + esc(L.rq_done) + $t.k13 +
$s.k2 +
$s.k3 +
$s.k4 +
$t.k14 +
$q.al + $t.SB + $q.am + $s.AK + $q.an + $s.AK + $s.k5 +
$s.k6 +
$s.k7 +
$s.k8;
return page(await build(pgObj(lang, $q.ao, L.rq_title, L.rq_lead, body), lang, shell, $q.ad), lang, { 'x-robots-tag': $q.ap });
}
function bzPage(lang, shell, env) {
const L = T[lang], vol = offers(env).filter(o => o.k === $q.aq || o.k === $q.ar);
const body = hero(lang, L.bz_h1, L.bz_lead, L.bz_title) + $q.R + dirA(lang) + '>' +
'<h2>' + esc(L.bz_free_h) + $q.as + esc(L.today) + $q.at + L.bz_free.map(([p, t, d]) => $q.au + lk(lang, p) + '">' + esc(t) + $q.av + esc(d) + '</li>').join('') + '</ul>' +
'<h2>' + esc(L.bz_paid_h) + $q.aw + esc(L.bz_paid) + '</p>' + (vol.length ? offerCards(vol, lang) : '') +
$t.k15 + encodeURIComponent($q.ax) + '">' + esc(L.bz_cta) + $q.ay + lk(lang, $q.az) + '">' + esc(L.mo_links.split(':')[0]) + $q.aa +
'<h2>' + esc(L.bz_how_h) + $q.aA + L.bz_how.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
$s.k9 + lk(lang, $q.aB) + $q.aC;
return build(pgObj(lang, $q.aD, L.bz_title, L.bz_lead, body), lang, shell, $q.az).then(h => page(h, lang));
}
function moPage(lang, shell) {
const L = T[lang], lnk = L.mo_links.split(' · ');
const a = (h, t) => '<a href="' + h + '">' + esc(t) + '</a>';
const lines = lnk.map((s, i) => { const k = s.indexOf(':'); return esc(s.slice(0, k + 1)) + ' ' + a(i ? lk(lang, $q.aE) : lk(lang, $q.az), s.slice(k + 1).trim()); }).join(' · ');
const body = hero(lang, L.mo_h1, L.mo_lead, L.mo_title) + $q.R + dirA(lang) + $q.aF + L.mo_items.map(([t, d]) => $q.aG + esc(t) + '</b>' + esc(d) + '</li>').join('') + $q.aH + lines + '</p>' +
$t.k16 + esc(L.rq_priv) + $q.aI;
return build(pgObj(lang, $q.aJ, L.mo_title, L.mo_lead, body), lang, shell, $q.az).then(h => page(h, lang));
}
function asPage(lang, shell) {
const L = T[lang];
const body = hero(lang, L.as_h1, L.as_lead, L.as_title) + $q.R + dirA(lang) + $q.aK + L.as_steps.map(([p, t, d]) => $q.au + lk(lang, p) + '">' + esc(t) + $q.av + esc(d) + '</li>').join('') + '</ol>' +
'<h2>' + esc(L.as_law_h) + $q.aw + esc(L.as_law) + $q.aL + esc(L.as_mon) + $q.Y + lk(lang, $q.az) + '">' + esc(L.more) + $q.aI;
return build(pgObj(lang, $q.aM, L.as_title, L.as_lead, body), lang, shell, $q.ad).then(h => page(h, lang));
}
const ST_CLS = { verified: 'ok', contradicted: 'bad', unverified: 'no' };
async function srPage(lang, shell, env, slug) {
if (!SR_SLUGS.has(slug)) return null;
const n = await import('./kbx_named.js'), ix = await n.data(env), x = ix.bySlug.get(slug);
if (!x) return null;
const L = T[lang], host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const src = u => /^https?:\/\//.test(u || '') ? $q.aN + esc(u) + $q.aO + esc(host(u)) + $q.aP : '';
const cl = Array.isArray(x.cl) ? x.cl : [], ev = x.ev || {}, rv = x.rvw || {}, rw = x.rw || {};
const grp = [[$q.aQ, /return|yield|rental|short-term|short-let/i], ['land', /freehold|leasehold|land title|land (is )?charged|title deed|\bland\b/i], [$q.aR, /delivered|completed projects|track record|\bJV\b|joint venture|listed on|subsidiary/i],
[$q.aS, /permit|licen|APDL|RERA|DLD|PBG|IMB/i], [$q.aT, /possession|completion|handover|extension/i], [$q.aU, /progress|built|construction/i], [$q.aV, /escrow|account|HDA|deposit/i], ['plans', /unit|size|sq ft|m2|floor plan|floors/i]];
const by = {}; for (const c of cl) { const g = grp.find(z => z[1].test(c[0])); const k = g ? g[0] : $q.aR; (by[k] = by[k] || []).push(c); }
const order = [$q.aS, $q.aR, $q.aT, $q.aU, $q.aV, 'plans', $q.aQ];
const sec = k => {
    const items = (by[k] || []).map(c => '<li>' + bdi(lang, esc(c[0])) + $q.aW + (ST_CLS[c[1]] || 'no') + '">' + esc(L.sr_st[c[1]] || c[1]) + $q.aX + esc(L.src) + ': ' + src(c[3]) + $q.aY).join('');
    const e = ev[k] ? '<p>' + bdi(lang, esc(ev[k])) + '</p>' : '';
    if (!items && !e) return '';
    return $q.aZ + esc(L.sr_checks[k]) + '</h3>' + e + (items ? '<ul>' + items + '</ul>' : '') + $q.ba;
  };
const not = (k, t) => { const items = (by[k] || []).map(c => '<li>' + bdi(lang, esc(c[0])) + $q.aW + (ST_CLS[c[1]] || 'no') + '">' + esc(L.sr_st[c[1]] || c[1]) + $q.aX + esc(L.src) + ': ' + src(c[3]) + $q.aY).join('');
return $q.aZ + esc(L.sr_checks[k]) + '</h3>' + (items ? '<ul>' + items + '</ul>' : '') + $q.bb + esc(L.sr_st.unverified) + $q.bc + esc(t) + $q.bd; };
const lastRead = rv.d || rw.checked || x.ad;
const body = hero(lang, fill(L.sr_h1, { n: x.n }), L.sr_lead, fill(L.sr_title, { n: x.n })) + $q.R + dirA(lang) + '>' +
$q.W + esc(fill(L.sr_meta, { id: x.id, dv: x.dv, ar: x.ar || x.mk, d: fdt(lastRead, lang) })) + '</p>' +
(rw.register ? '<p>' + esc(fill(L.sr_rv, { d: fdt(rv.d || rw.checked, lang), r: rw.register })) + (rw.detail ? ' ' + bdi(lang, esc(rw.detail)) : '') + '</p>' : '') +
order.map(sec).join('') + not('land', L.sr_land) + not($q.be, L.sr_contract) + not('site', L.sr_site) +
$t.k17 + (lang === 'en' ? $q.bf : lk(lang, $q.az)) + $q.bg + esc(L.sr_cta) + $q.ay + pre(lang) + $q.bh + x.s + '/">' + esc(L.sr_pdf) + $q.aa +
$t.k18 + esc(L.sr_fict) + $q.aI;
const pg = pgObj(lang, $q.bi + x.s + '/', fill(L.sr_title, { n: x.n }), L.sr_lead, body, lastRead);
pg.ld.about = { '@type': 'Place', name: x.n, url: ORIGIN + pre(lang) + $q.bh + x.s + '/' };
pg.ld.isBasedOn = (x.src || []).slice(0, 12);
return page(await build(pg, lang, shell, $q.ad), lang);
}
export function ctaHtml(lang, slug) {
const L = CTA[lang] || CTA.en, href = (lang === 'en' ? $q.bf : pre(lang) + $q.az) + '?p=' + slug + '#kreq';
return $t.k19 + href + $q.bj + esc(L[0]) + $q.bk + esc(L[1]) + $q.bl +
$s.k10 +
$q.bm + N31V + $q.bn;
}
export const N31V = 'a3';
const OFFERS = [
{ k: 'report', item: 7, price: '€29', t: 'Paid PDF report of one project', d: 'Every fact we hold, its source and date, what is missing, and what to ask the developer. Desk research only.' },
{ k: 'guarantee', item: 23, price: null, t: 'Refund for what we cannot check', d: 'If one of the nine checks cannot be done, that part of the price is refunded.' },
{ k: 'ab', item: 39, price: '€290 / €490 / €690', t: 'Check price test', d: 'Three prices shown at random to new visitors; every visitor sees one price for 30 days.' },
{ k: 'ask', item: 40, price: '€49', t: 'Ask the developer through us', d: 'We send your questions to the developer and publish the dated reply, or the dated absence of one.' },
{ k: 'gift', item: 43, price: '€490', t: 'Gift a check', d: 'A check for a family member who is buying abroad.' },
{ k: 'compare3', item: 44, price: '€1,190', t: 'Check 3 projects', d: 'Three projects checked side by side before you choose.' },
{ k: 'overdue', item: 45, price: '€9 a month', t: 'Overdue handover alert for buyers', d: 'Dated notice when the handover date on record passes, with what the law and contract say.' },
{ k: 'mybuild', item: 46, price: '€19 a month', t: '"Is my build on track?"', d: 'Monthly satellite comparison of the plot for buyers who already signed.' },
{ k: 'volume', item: 34, price: '5 checks €2,200 · 10 checks €3,900', t: 'Volume checks for agencies and lawyers', d: 'Monthly invoice; the same nine checks.' },
{ k: 'datalicence', item: 53, price: 'from €4,900 a year', t: 'Commercial data licence', d: 'Full dataset with history and an update feed for funds and banks.' },
{ k: 'dubai', item: 58, price: '€590', t: 'Dubai pack', d: 'Check with the DLD project status, the Oqood registration and the escrow account.' }
];
function offers(env) {
const on = new Set(String((env && env.KB_N31_OFFERS) || '').split(',').map(s => s.trim()).filter(Boolean));
return OFFERS.filter(o => on.has(o.k)).map(o => Object.assign({}, o, { pay: env[$q.bo + o.k.toUpperCase()] || null }));
}
function offerCards(list, lang) {
return $q.bp + list.map(o => $q.aG + esc(o.t) + (o.price ? ' · ' + esc(o.price) : '') + '</b>' + esc(o.d) + (o.pay ? $q.Y + esc(o.pay) + $q.bq + esc(T[lang].more) + '</a>' : '') + '</li>').join('') + '</ul>';
}
export async function pricingOffers(res, lang, env) {
if (!(await loadT(env))) return res;
const list = offers(env).filter(o => ![$q.aq, $q.ar].includes(o.k));
if (!list.length) return res;
const add = $t.k20 + dirA(lang) + '>' + $s.CSS + '<h2>' + esc(T[lang].of_h) + '</h2>' + offerCards(list, lang) + $q.br;
return new HTMLRewriter().on($q.bs, { element(e) { e.after(add, { html: true }); } }).transform(res);
}
export async function handle(req, u, env, ctx, shell) {
const p = u.pathname;
if (!PATHS.test(p)) return null;
if (p.startsWith($q.bt)) {
if (req.method === $q.bu) return new Response(null, { status: 204, headers: { 'access-control-allow-origin': ORIGIN, 'access-control-allow-methods': $q.bv, 'access-control-max-age': '86400' } });
if (p === $q.bw) return jout(await funnel(Math.min(35, Math.max(1, +u.searchParams.get('days') || 28))), 200, { 'cache-control': $q.bx });
const bot = BOT.test(req.headers.get($q.by) || '');
if (p === $q.bz) {
if (req.method !== 'POST') return jout({ error: $q.bA, use: $q.bB }, 405);
const s = String(u.searchParams.get('s') || '');
if (!OK_STEP.has(s)) return jout({ error: 'step' }, 400);
if (bot || !ourOrigin(req) || !allow(req, 40)) return jout({ ok: false }, 202);
ctx.waitUntil(inc(CK(day(), s)));
return jout({ ok: true }, 202);
}
if (p === $q.bC) {
const id = String(u.searchParams.get('id') || '').toUpperCase();
if (!/^[A-Z0-9-]{3,20}$/.test(id)) return jout({ error: 'id' }, 400);
if (req.method === 'POST') { if (bot || !ourOrigin(req) || !allow(req, 20)) return jout({ ok: false }, 202); ctx.waitUntil(inc(SVK(id))); return jout({ ok: true }, 202); }
const n = await get(SVK(id));
return jout({ id, saves_at_least: n, shown: n >= 3, since: $q.N, note: $s.k11 }, 200, { 'cache-control': $q.B });
}
return null;
}
if (req.method !== 'GET' && req.method !== 'HEAD') return null;
if (!p.endsWith('/')) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } });
if (!(await loadT(env))) return null;
let m;
if ((m = RX.fn.exec(p))) return fnPage(m[1] || 'en', shell);
if ((m = RX.rq.exec(p))) return rqPage(m[1] || 'en', shell);
if ((m = RX.bz.exec(p))) return bzPage(m[1] || 'en', shell, env);
if ((m = RX.mo.exec(p))) return moPage(m[1] || 'en', shell);
if ((m = RX.as.exec(p))) return asPage(m[1] || 'en', shell);
if ((m = RX.sr.exec(p))) return srPage(m[1] || 'en', shell, env, m[2]);
return null;
}
export { funnel, offers, OFFERS };
