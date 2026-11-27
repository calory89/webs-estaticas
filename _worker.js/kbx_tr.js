// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_tr__q, $s = TB.kbx_tr__s, $t = TB.kbx_tr__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { t31, loadS as loadS31 } from './kbx_n31b_page.js';
import { jget } from './kbx_jget.js';
import { TRS } from './kbx_tr_i18n.js';
import { hdisp, mkName } from './kbx_hdate.js';
import { TR_PLACES, inPlace } from './kbx_tr_places.js';
import { E as E27 } from './kbx_e27_i18n.js';
import { t27 } from './kbx_t27_i18n.js';
import { ogImg } from './kbx_ogt.js';
import { methodLine, accLine } from './kbx_e29_lines.js';
import { regSale, rsText } from './kbx_n31d_rs.js';
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const PAGE_RX = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(?:rankings\/transparency(?:\/([a-z0-9-]{2,40}))?|methods\/(transparency-score))(\/?)$/;
export const SITEMAP = '/rankings/transparency/sitemap.xml';
export const PATHS = /^\/api\/x\/transparency(?:\/[a-z0-9-]{2,40})?\/?$/;
const MIN_RANK = 5;
const COI_RX = /eco\s*beach\s*city|\bequinox\b/i;
const MAX = { legal: 10, register: 5, permit: 15, permitreg: 5, date: 10, record: 10, deposit: 15, location: 10, web: 10, notices: 5, price: 5 };
const KEYS = Object.keys(MAX);
const TICKS = ['legal', 'permit', 'date', 'record', 'deposit', 'location'];
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.b, "'": '&#39;' }[c]));
const bdi = s => '<bdi>' + esc(s) + $q.c;
const t = (lang, k, v) => { let s = (TRS[lang] && TRS[lang][k] != null) ? TRS[lang][k] : TRS.en[k]; if (typeof s !== $q.d) return s; if (v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b); return s; };
const th = (lang, k, v) => { const s = esc((TRS[lang] && TRS[lang][k]) || TRS.en[k]); return v ? s.replace(/\{(\w+)\}/g, (m, a) => v[a] != null ? v[a] : m) : s; };
const nf = (lang, n) => Number(n).toLocaleString(LOC[lang] || 'en-GB');
const fdt = (iso, lang) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); if (!m) return String(iso || ''); try { return new Intl.DateTimeFormat(LOC[lang] || 'en-GB', { day: $q.e, month: 'long', year: $q.e, timeZone: 'UTC' }).format(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))); } catch (e) { return iso.slice(0, 10); } };
const host = u => { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { return ''; } };
const okHttp = u => typeof u === $q.d && /^https?:\/\/[^\s"<>]+$/.test(u.trim());
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const ymIdx = s => { const m = /^(\d{4})-(\d{2})/.exec(s || ''); return m ? +m[1] * 12 + (+m[2] - 1) : null; };
const PUB = (lang, path) => ORIGIN + pre(lang) + path;
function cleanName(n) {
return String(n || '').replace(/\s*\(([^)]*)\)/g, (m, inner) => { const keep = inner.split(/\s*[;,]\s*/).filter(x => x && !/^not the\b/i.test(x) && !/^listing \d+$/i.test(x)); return keep.length ? ' (' + keep.join(', ') + ')' : ''; }).trim();
}
const LF_CS = /(^|[\s,(])(PT|CV|SA|S\.A\.|SL|S\.L\.|SLU|S\.L\.U\.|SAS|S\.A\.S\.?|SARL|AG|BV|B\.V\.|NV|N\.V\.|JSC|PCL|PJSC|P\.J\.S\.C\.?|QPSC|Q\.P\.S\.C\.?|LLC|L\.L\.C\.?|LLP|PLC|FZE|FZCO|FZ-LLC|SpA|S\.p\.A\.?|Srl|S\.r\.l\.?|GmbH|Kft\.?|d\.o\.o\.?|Ltda\.?|K\.K\.|A\.Ş\.?|AŞ)(?=$|[\s,.)])/;
const LF_CI = /\b(limited|ltd\.?|inc\.?|incorporated|corp\.?|corporation|sdn\.?\s*bhd\.?|berhad|bhd\.?|pty\.?\s*ltd|co\.,?\s*ltd|public company|sociedad|société|gesellschaft)\b/i;
const legalForm = s => !!s && (LF_CS.test(s) || LF_CI.test(s));
const SHARED = (globalThis.__kbJson = globalThis.__kbJson || {});
async function load(env, name) {
const m = SHARED[name]; if (m && (m.a || Date.now() - m.t < 600000)) return m.v;
return (await jget(env, name, ORIGIN + $q.f + name, ORIGIN + $q.g + name)).v;
}
let IDX = null;
export async function trData(env) {
const opt = n => load(env, n).catch(() => null);
const [named, cases, prom, ontime, web, look, sanc, gleif] = await Promise.all([load(env, $q.h), load(env, $q.i), opt($q.j), opt($q.k), opt($q.l), opt($q.m), opt($q.n), opt($q.o)]);
const key = [named, cases, prom, ontime, web, look, sanc, gleif];
if (IDX && IDX.key.every((v, i) => v === key[i])) return IDX;
const caseBy = new Map((cases.cases || []).map(c => [c.id, c]));
const today = new Date().toISOString().slice(0, 10), in60 = new Date(Date.now() + 60 * 864e5).toISOString().slice(0, 10);
const OT = (ontime && ontime.projects) || {}, asOf = ymIdx(((ontime && ontime.as_of_month) || today.slice(0, 7)) + '-01');
const WH = (web && web.d) || {}, sanNo = new Set((sanc && sanc.no_match) || []), warnNo = new Set((sanc && sanc.warnings && sanc.warnings.no_match) || []);
const lookOf = new Set(((look && look.items) || []).map(i => String(i.o || '').replace(/^www\./, '').toLowerCase()).filter(Boolean));
const lookWatched = new Set(Object.values((look && look.w) || {}).flat().map(d => String(d).replace(/^www\./, '').toLowerCase()));
const GL = (gleif && gleif.devs) || {}, glChecked = (gleif && gleif.checked) || {};
const PROM = (prom && prom.projects) || {};
const rows = new Map(), excluded = [];
for (const x of (named.projects || [])) {
const c = caseBy.get(x.id); if (!c) continue;
if (COI_RX.test(String(x.n || '')) || COI_RX.test(String(x.dv || ''))) { excluded.push(x.id); continue; }
const fx = x.fx || {}, ck = c.checks || {}, vf = c.verified || {}, page = okHttp(x.url) ? x.url.trim() : null;
const comp = {};
const legal = fx.developer_company && legalForm(fx.developer_company) ? fx.developer_company : (legalForm(x.dv) ? x.dv : (fx.developer_company || null));
comp.legal = legal && legalForm(legal) ? { st: 'yes', v: legal, src: page } : { st: 'no', src: page };
const g = x.dvs && GL[x.dvs];
comp.register = g && g.lei ? { st: 'yes', v: g.lei, src: $q.p + g.lei } : (x.dvs && glChecked[x.dvs] ? { st: 'no', src: $q.q } : { st: 'nc' });
const pn = x.pn || null, permitPub = ck.permit === 2 || !!pn;
comp.permit = permitPub ? { st: 'yes', v: pn, src: (okHttp(x.du) ? x.du : page) } : { st: 'no', src: page };
comp.permitreg = [$q.r, $q.s].includes(vf.permit) ? { st: 'yes', v: vf.permit, src: $q.t } : { st: 'no', src: $q.t };
const hp = (PROM[x.id] || []).find(p => p.k === $q.u), hd = hp ? hp.d : (fx.handover_promised || (c.done ? String(c.done) : null));
comp.date = hd ? { st: 'yes', v: hd, src: page } : { st: 'no', src: page };
const o = OT[x.id]; let rec;
if (!o) rec = hd ? { st: 'nc', r: 'nc' } : { st: 'no', r: 'none' };
else if (o.s === 'open') rec = o.overdue > 0 ? { st: 'no', r: 'past', m: o.overdue } : o.moved > 0 ? { st: 'part', r: 'moved', m: o.moved, v: hd || o.cur } : { st: 'yes', r: 'kept', v: hd || o.cur || o.first };
else if (o.s === 'moved') rec = { st: 'part', r: 'moved', m: o.moved, v: hd || o.cur };
else if (o.s === $q.v) { const f = ymIdx((o.first || '') + '-01'); rec = { st: 'no', r: 'past', m: f != null && asOf != null ? Math.max(1, asOf - f) : (o.overdue || 0) }; }
else if (o.s === $q.w || o.s === $q.x) rec = { st: 'yes', r: 'done' };
else if (o.s === $q.y) rec = { st: 'part', r: 'late' };
else if (o.s === $q.z) rec = hd ? { st: 'nc', r: 'nc' } : { st: 'no', r: 'none' };
else rec = { st: 'nc', r: 'nc' };
rec.src = $q.A; comp.record = rec;
comp.deposit = ck.escrow === true ? { st: 'yes', src: page } : { st: 'no', src: page };
comp.location = (isFinite(fx.lat) && isFinite(fx.lng) && fx.lat !== null && fx.lng !== null) ? { st: 'yes', src: page } : { st: 'no', src: page };
comp.price = fx.price_min > 0 && !regSale(x) ? { st: 'yes', src: page } : { st: 'no', src: page };
const h = host(x.url), w = h && WH[h];
if (w) {
const last = String(w.h || '').slice(-1), ans = last === 'u' || last === 'b', tls = !!w.ce && w.ce >= today, dom = !!w.de && w.de > in60, lk = lookOf.has(h);
const p = (ans ? 4 : 0) + (tls ? 3 : 0) + (dom ? 1 : 0) + (lk ? 0 : 2);
comp.web = { st: p >= 10 ? 'yes' : p > 0 ? 'part' : 'no', p, ans, tls, dom, lk, watched: lookWatched.has(h), src: $q.B + encodeURIComponent(h) };
} else comp.web = { st: 'nc' };
const sn = x.dvs && sanNo.has(x.dvs), wn = x.dvs && warnNo.has(x.dvs);
comp.notices = sn || wn ? { st: sn && wn ? 'yes' : 'part', sn, wn, p: (sn ? 3 : 0) + (wn ? 2 : 0), avail: (sn ? 3 : 0) + (wn ? 2 : 0), src: $q.C } : { st: 'nc' };
let got = 0, avail = 0;
for (const k of KEYS) {
const q = comp[k];
if (k === $q.D) { if (q.st === 'nc') { q.pts = 0; continue; } q.pts = q.p; q.max = q.avail; got += q.p; avail += q.avail; continue; }
if (q.st === 'nc') { q.pts = 0; q.max = MAX[k]; continue; }
q.max = MAX[k]; q.pts = k === 'web' ? q.p : q.st === 'yes' ? MAX[k] : q.st === 'part' ? Math.round(MAX[k] / 2) : 0;
got += q.pts; avail += MAX[k];
}
const score = avail ? Math.round(got / avail * 100) : 0;
rows.set(x.id, { id: x.id, s: x.s, n: cleanName(x.n) || x.id, dv: x.dv || null, dvs: x.dvs || null, mk: x.mk, ar: x.ar, co: x.co || null, url: page, rv: !!(c.verified && Object.values(c.verified).some(v => v && v !== 'none')), comp, got, avail, score, sumba: String(x.mk || '').toLowerCase() === 'sumba' });
}
const places = new Map();
for (const P of TR_PLACES) {
const L = [...rows.values()].filter(r => inPlace(P, r.mk, r.ar)).sort((a, b) => b.score - a.score || a.n.localeCompare(b.n));
const ranked = L.length >= MIN_RANK;
let prev = null, rank = 0; L.forEach((r, i) => { if (r.score !== prev) { rank = i + 1; prev = r.score; } r['rk_' + P.s] = ranked ? rank : null; });
const sc = L.map(r => r.score).sort((a, b) => a - b), med = sc.length ? (sc.length % 2 ? sc[(sc.length - 1) / 2] : Math.round((sc[sc.length / 2 - 1] + sc[sc.length / 2]) / 2)) : null;
const cnt = k => L.filter(r => r.comp[k].st === 'yes').length;
places.set(P.s, { P, L, ranked, med, n: L.length, permit: cnt($q.E), date: cnt('date'), deposit: cnt($q.F) });
}
const updated = String(cases.updated || named.updated || today).slice(0, 10);
const dates = { named: named.updated, cases: cases.updated, ontime: ontime && ontime.generated, web: web && web.updated, look: look && look.updated, sanctions: sanc && sanc.updated, gleif: gleif && String(gleif.updated || '').slice(0, 10) };
IDX = { key, rows, places, updated, dates, excluded, v: String(updated) + '|' + rows.size + '|' + [...rows.values()].reduce((a, r) => a + r.score, 0) };
return IDX;
}
export async function trBadge(env, id, lang) {
let ix; try { ix = await trData(env); } catch (e) { return ''; }
const r = ix.rows.get(id); if (!r || r.sumba) return '';
const out = [];
for (const [s, pl] of ix.places) {
if (pl.P.coi || !pl.L.includes(r)) continue;
const B = $t.o_BADGE[lang] || $t.o_BADGE.en, link = pre(lang) + $q.G + s + '/';
const txt = pl.ranked ? B[0].replace('{r}', nf(lang, r['rk_' + s])).replace('{m}', nf(lang, pl.n)) : B[1].replace('{s}', nf(lang, r.score));
out.push($q.H + link + '">' + esc(txt).replace('{p}', bdi(mkName(pl.P.n, lang))) + '</a>');
}
return out.length ? $t.k0 + out.join(' · ') + '</p>' : '';
}
export async function trProject(env, id, lang) {
let ix; try { ix = await trData(env); } catch (e) { return null; }
const r = ix.rows.get(id); if (!r || r.sumba) return null;
const ranks = [];
for (const [s, pl] of ix.places) if (!pl.P.coi && pl.L.includes(r)) ranks.push({ s, p: pl.P.n, r: pl.ranked ? r['rk_' + s] : null, m: pl.n, ranked: pl.ranked });
const plain = h => String(h).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const gain = k => { const q = r.comp[k]; if (k === $q.D || q.st === 'yes') return 0; const add = q.st === 'nc' ? MAX[k] : MAX[k] - (q.pts || 0), av = r.avail + (q.st === 'nc' ? MAX[k] : 0); return av ? Math.max(0, Math.round((r.got + add) / av * 100) - r.score) : 0; };
const items = KEYS.map(k => ({ k, st: r.comp[k].st, label: t(lang, 'c_' + k), text: plain(compText(lang, k, r.comp[k])), gain: gain(k) }));
return { score: r.score, rv: r.rv, ranks, items, badge: await trBadge(env, id, lang), ledger: ledger(lang, r), method: pre(lang) + $q.I, updated: ix.updated };
}
function tick(lang, st) { const sym = { yes: '✓', part: '◐', no: '○', nc: '?' }[st] || '?'; return $q.J + st + $q.K + sym + '</b>' + esc(t(lang, 'st_' + st)) + $q.L; }
function srcA(lang, u, isSumba) {
if (!u || isSumba && /^https?:/.test(u)) return '';
const lbl = /^https?:/.test(u) && !/gleif\.org/.test(u) ? t(lang, $q.M) : /gleif\.org/.test(u) ? 'GLEIF' : /^\//.test(u) ? $q.N : u.replace(/\?.*$/, '');
return $q.O + esc(u) + '"' + (/^https?:/.test(u) ? $t.k1 : '') + '>' + (/^\//.test(lbl) ? '<bdi>' + esc(lbl) + $q.c : esc(lbl)) + '</a>';
}
function compText(lang, k, q) {
const v = q.v != null ? bdi(k === 'date' || k === $q.P ? hdisp(q.v, lang) : q.v) : '';
switch (k) {
case 'legal': return q.st === 'yes' ? th(lang, $q.Q, { v }) : esc(t(lang, $q.R));
case $q.S: return q.st === 'yes' ? th(lang, $q.T, { v }) : q.st === 'nc' ? esc(t(lang, 'st_nc')) : esc(t(lang, $q.U));
case $q.E: return q.st === 'yes' ? esc(t(lang, $q.V)) + (q.v ? ': ' + v : '') : esc(t(lang, $q.W));
case $q.X: return q.st === 'yes' ? th(lang, $q.Y, { v: esc(q.v) }) : esc(t(lang, $q.Z));
case 'date': return q.st === 'yes' ? th(lang, $q.aa, { v }) : esc(t(lang, $q.ab));
case $q.P: return th(lang, 'r_' + q.r, { v, m: esc(nf(lang, q.m || 0)) });
case $q.F: return esc(t(lang, q.st === 'yes' ? $q.ac : $q.ad));
case $q.ae: return esc(t(lang, q.st === 'yes' ? $q.af : $q.ag));
case 'price': return esc(t(lang, q.st === 'yes' ? $q.ah : $q.ai));
case 'web': return q.st === 'nc' ? esc(t(lang, 'w_nc')) : [q.ans ? 'w_ans' : $q.aj, q.tls ? 'w_tls' : $q.ak, q.dom ? 'w_dom' : $q.al, q.lk ? $q.am : $q.an].map(x => esc(t(lang, x))).join('; ');
case $q.D: return q.st === 'nc' ? esc(t(lang, 'n_nc')) : [q.sn ? t(lang, 'n_san') : null, q.wn ? t(lang, $q.ao) : null].filter(Boolean).concat(q.sn && q.wn ? [] : [t(lang, 'n_nc')]).map(esc).join('; ');
}
return '';
}
function ledger(lang, r) {
return $q.ap + KEYS.map(k => { const q = r.comp[k];
const pts = q.st === 'nc' ? $q.aq + esc(t(lang, $q.ar)) + $q.as : $q.aq + esc(t(lang, 'pts', { a: nf(lang, q.pts), b: nf(lang, q.max) })) + $q.as;
return $q.at + esc(t(lang, 'c_' + k)) + $q.au + compText(lang, k, q) + ' ' + pts + (q.src && q.src !== r.url ? srcA(lang, q.src, r.sumba) : '') + '</li>'; }).join('') +
(r.url && !r.sumba ? '<li>' + esc(t(lang, $q.M)) + $q.av + esc(r.url) + $t.k2 + esc(host(r.url)) + $q.aw + pre(lang) + $q.ax + esc(r.s) + $q.ay : '') + '</ul>';
}
const replyHref = id => $q.az + encodeURIComponent(id);
function rowHtml(lang, r, rank, ranked, o) {
const cols = [t(lang, $q.aA), t(lang, $q.aB), t(lang, $q.aC), t(lang, $q.aD)].concat(TICKS.map(k => t(lang, 'k_' + k)));
const g = o && o.G && !r.sumba ? o.G.get(r.s) || 0 : 0;
const name = (r.sumba ? $q.aE + bdi(r.n) + $q.L : $q.aF + pre(lang) + $q.ax + esc(r.s) + '/">' + bdi(r.n) + '</a>') + (g ? $q.aG + pre(lang) + $q.ax + esc(r.s) + $q.aH + esc(o.RT('rg_b', { n: nf(lang, g) })) + '</a>' : '');
const cells = [
ranked ? $q.aI + esc(cols[0]) + '">' + nf(lang, rank) + '</td>' : null,
$q.aJ + esc(cols[1]) + '">' + name + (r.rv ? '' : $t.k3 + esc(t(lang, $q.aK)) + $q.L) +
$t.k4 + esc(r.id) + '">' + esc(t(lang, $q.aL)) + $q.aM + replyHref(r.id) + '">' + esc(t(lang, $q.aN)) + $q.aO,
$q.aP + esc(cols[2]) + '">' + (r.dv ? bdi(r.dv) : $q.aQ + esc(t(lang, 'st_no')) + $q.L) + '</td>',
$q.aR + esc(cols[3]) + $t.k5 + nf(lang, r.score) + $t.k6 + r.score + $q.aS
].concat(TICKS.map((k, i) => $q.aR + esc(cols[4 + i]) + '">' + tick(lang, r.comp[k].st) + '</td>')).filter(Boolean);
return $q.aT + esc(r.id.toLowerCase()) + '">' + cells.join('') + $q.aU + esc(r.id) + $q.aV + cells.length + $q.aW + ledger(lang, r) + $q.aX;
}
function tableHtml(lang, pl, o) {
const head = (pl.ranked ? [t(lang, $q.aA)] : []).concat([t(lang, $q.aB), t(lang, $q.aC), t(lang, $q.aD)], TICKS.map(k => t(lang, 'k_' + k)));
return $t.k7 + head.map(h => $q.aY + esc(h) + '</th>').join('') + $q.aZ +
pl.L.map(r => rowHtml(lang, r, r['rk_' + pl.P.s], pl.ranked, o)).join('') + $q.ba;
}
function rgBar(lang, pl, path, o) {
const P = pre(lang) + path, k = pl.L.filter(r => !r.sumba && o.G.get(r.s)).length, q = (rg, so) => P + (rg || so ? '?' + [rg ? 'rg=1' : '', so ? 's=reg' : ''].filter(Boolean).join('&amp;') : '') + '#ranking';
const a = (h, txt, cur) => '<a href="' + h + '"' + (cur ? ' aria-current="true"' : '') + '>' + esc(txt) + '</a>';
return $q.bb + esc(o.RT('rk_h')) + '">' + a(q(0, o.so), o.RT($q.bc, { n: nf(lang, pl.L.length) }), !o.rg) + a(q(1, o.so), o.RT('rk_rg', { n: nf(lang, k) }), o.rg) + a(q(o.rg, !o.so), o.RT(o.so ? 'rk_s0' : 'rk_s1'), false) + $q.bd + esc(o.RT($q.be)) + $q.bf + pre(lang) + $t.k8 +
$s.k0;
}
function kvHtml(lang, pl, ix) {
const it = [[nf(lang, pl.n), t(lang, 'kv_n')], [pl.med == null ? '-' : nf(lang, pl.med), t(lang, $q.bg)], [nf(lang, pct(pl.permit, pl.n)) + '%', t(lang, $q.bh)], [nf(lang, pct(pl.date, pl.n)) + '%', t(lang, $q.bi)], [nf(lang, pct(pl.deposit, pl.n)) + '%', t(lang, $q.bj)]];
return $q.bk + it.map(([b, s]) => $q.bl + esc(b) + $q.bm + esc(s) + $q.bn).join('') + $q.bo + esc(t(lang, $q.bp, { d: fdt(ix.updated, lang) })) + $q.bf + pre(lang) + $q.bq + esc(t(lang, $q.br)) + '</a>' + methodLine(lang) + '</p>';
}
function assignHtml(lang, P) {
if (!P.a) return $q.bs + th(lang, $q.bt, { m: P.m.map(bdi).join(', ') }) + '</p>';
const ruled = P.am || P.m, whole = P.m.filter(m => !ruled.includes(m));
return $q.bs + th(lang, $q.bu, { m: ruled.map(bdi).join(', '), a: bdi(P.an || String(P.a.source)) }) + (whole.length ? ' ' + th(lang, $q.bt, { m: whole.map(bdi).join(', ') }) : '') + '</p>';
}
function replyBox(lang, id) {
return $q.bv + esc(t(lang, 'rr_h')) + $q.bw + esc(t(lang, 'rr_t')) + $q.bx + (id ? replyHref(id) : $q.by) + '">' + esc(t(lang, $q.bz)) + $t.k9 + esc({ en: $q.bA, es: $q.bB, fr: $q.bA, de: $q.bC, nl: $q.bD, ru: $q.bE, zh: '更正', ar: $q.bF }[lang]) + $q.bG;
}
function emailBox(lang, P) {
const p = bdi(mkName(P.n, lang));
return $t.k10 + th(lang, 'em_h', { p }) + $q.bw + esc(t(lang, 'em_t')) + '</p>' +
$t.k11 + esc(P.s) + $q.bH + lang + $q.bI + esc(JSON.stringify({ ok: t(lang, 'em_ok', { p: mkName(P.n, lang) }), bad: t(lang, $q.bJ), need: t(lang, $q.bK), err: t(lang, $q.bL), busy: t(lang, $q.bM) })) + '\'>' +
$t.k12 + esc(t(lang, $q.bN)) + $s.k1 +
$t.k13 + th(lang, $q.bO, { p }) + $q.bP + esc(t(lang, $q.bQ)) + $q.bR +
$t.k14 + esc(t(lang, $q.bS)) + $q.bT +
$s.k2 +
$s.k3 + esc(t(lang, $q.bU)) + $q.bV;
}
function faqList(lang, pl, ix) {
const P = pl.P, p = mkName(P.n, lang), n = pl.n, nn = nf(lang, n), top = pl.ranked ? pl.L[0] : null;
const f = [[t(lang, 'q1', { p }), t(lang, 'a1', { n: nn, d: fdt(ix.updated, lang) })]];
if (pl.med != null) f.push([t(lang, 'q2', { p }), t(lang, 'a2', { m: nf(lang, pl.med) })]);
f.push([t(lang, 'q3', { p }), t(lang, 'a3', { a: nf(lang, pl.permit), n: nn, pc: nf(lang, pct(pl.permit, n)) })]);
f.push([t(lang, 'q4', { p }), t(lang, 'a4', { a: nf(lang, pl.deposit), n: nn, pc: nf(lang, pct(pl.deposit, n)), b: nf(lang, pl.date) })]);
if (top) { const ties = pl.L.filter(r => r.score === top.score).map(r => r.n); f.push([t(lang, 'q5', { p }), t(lang, 'a5', { x: ties.slice(0, 4).join(', ') + (ties.length > 4 ? ' (+' + (ties.length - 4) + ')' : ''), s: nf(lang, top.score) })]); }
return f;
}
function crumbHtml(lang, list) { return $q.bW + list.map((x, i) => i < list.length - 1 ? $q.H + x[1] + '">' + esc(x[0]) + '</a>' : $q.bX + x[2] + $q.L).join(' / ') + '</p>'; }
const crumbLd = (lang, list) => ({ '@type': $q.bY, itemListElement: list.map((x, i) => ({ '@type': $q.bZ, position: i + 1, name: x[0], item: ORIGIN + x[1] })) });
const year = () => new Date().getUTCFullYear();
function linksHtml(lang, slug) {
return $q.ca + pre(lang) + $q.cb + esc(t(lang, $q.cc)) + $q.cd + pre(lang) + $q.bq + esc(t(lang, $q.br)) + $q.ce + (slug ? '/' + slug : '') + '">' + esc(t(lang, 'json')) + $q.cf + esc(t(lang, $q.cg)) + '</a>' + (slug && TR_PLACES.some(q => q.s === slug && !q.coi) ? $q.H + pre(lang) + $q.ch + slug + '/">' + esc((E27[lang] || E27.en).wk_t.replace('{p}', TR_PLACES.find(q => q.s === slug).n)) + '</a>' : '') +
(slug ? $q.ci + slug + $q.cj + esc(t27(lang, $q.ck)) + '</a>' : '') + $t.k15 + esc(t27(lang, $q.cl)) + $q.cd + pre(lang) + $q.cm + esc(t27(lang, $q.cn)) + $q.co;
}
const THIN_K = ['legal', 'permit', 'date', 'deposit', 'location', 'price'];
const isThin = r => THIN_K.filter(k => r.comp[k] && r.comp[k].st === 'yes').length <= 1;
const PRICE_L = { en: 'Price', es: 'Precio', de: 'Preis', fr: 'Prix', nl: 'Prijs', ru: 'Цена', zh: '价格', ar: 'السعر' };
function thinHtml(lang, pl) {
const L = pl.L.filter(r => !r.sumba && isThin(r)); if (!L.length) return '';
const T = $t.o_THIN_T[lang] || $t.o_THIN_T.en, f = (i, v) => esc(T[i]).replace('{n}', v == null ? '' : nf(lang, v));
return $q.cp + f(0, L.length) + $q.cq + f(1) + $q.cr + L.map(r => {
const got = THIN_K.filter(k => r.comp[k] && r.comp[k].st === 'yes').map(k => k === 'price' ? (PRICE_L[lang] || PRICE_L.en) : t(lang, 'k_' + k));
return $q.cs + pre(lang) + $q.ax + esc(r.s) + '/">' + bdi(r.n) + '</a>' + (r.dv ? $q.ct + bdi(r.dv) + $q.L : '') + $q.cu + f(2) + ': ' + (got.length ? got.map(esc).join(', ') : f(3)) + $q.cv;
}).join('') + '</ul>';
}
function viewOf(pl, o) { if (!o || !o.G) return pl; let L = o.rg ? pl.L.filter(r => !r.sumba && o.G.get(r.s)) : pl.L; if (o.so) L = L.map((r, i) => [r.sumba ? 0 : o.G.get(r.s) || 0, i, r]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).map(x => x[2]); return Object.assign({}, pl, { L }); }
const PG_N = 100;
function moreHtml(lang, pv, path, o) {
const q = (o.rg ? $q.cw : '') + (o.so ? $q.cx : ''), P = pre(lang) + path, n = pv.L.length;
return $t.k16 + P + $q.cy + q + $q.cz + PG_N + $q.cA + n + $q.cB + esc(o.RT('pg_sh', { a: '{a}', n: nf(lang, n) })) + $q.cC + esc(o.RT($q.cD, { k: '{k}' })) + $q.cE + esc(o.RT($q.cF)) + $q.cG + esc(o.RT('pg_sh', { a: nf(lang, PG_N), n: nf(lang, n) })) + $t.k17 + esc(n - PG_N > PG_N ? o.RT($q.cD, { k: nf(lang, PG_N) }) : o.RT($q.cH, { k: nf(lang, n - PG_N) })) + $q.cI + P + $q.cJ + q + $q.cK + esc(o.RT($q.cL, { n: nf(lang, n) })) + $q.cM +
$s.k4 + $s.PG_JS;
}
function rowsFrag(ix, slug, lang, o, from, all) { const pl = ix.places.get(slug); if (!pl) return null; const L = viewOf(pl, o).L, to = all ? L.length : Math.min(L.length, from + PG_N); return { h: L.slice(from, to).map(r => rowHtml(lang, r, r['rk_' + pl.P.s], pl.ranked, o)).join(''), next: to < L.length ? to : 0 }; }
function placePage(ix, slug, lang, o) {
const pl = ix.places.get(slug); if (!pl) return null;
const P = pl.P, p = bdi(mkName(P.n, lang)), pN = mkName(P.n, lang), path = $q.G + slug + '/';
const title = t(lang, pl.ranked ? $q.cN : $q.cO, { p: pN, y: year() }), h1 = th(lang, pl.ranked ? $q.cP : $q.cQ, { p });
const desc = t(lang, 'desc', { n: nf(lang, pl.n), p: pN, m: pl.med == null ? '-' : nf(lang, pl.med), d: fdt(ix.updated, lang) });
const cr = [[$q.cR, pre(lang) + '/', $q.cR], [t(lang, $q.cg), $q.cS, esc(t(lang, $q.cg))], [t(lang, $q.cT), pre(lang) + $q.G, esc(t(lang, $q.cT))], [pN, pre(lang) + path, p]];
const faq = faqList(lang, pl, ix);
let body = $t.k18 + crumbHtml(lang, cr) + '<h1>' + h1 + $q.cU + esc(t(lang, 'lead')) + $q.bV;
if (P.coi) body += $t.k19 + esc(t(lang, 'coi')) + $q.cV + esc(t(lang, $q.cW)) + $q.cX + esc(t(lang, $q.cY)) + $q.bn;
body += kvHtml(lang, pl, ix) + assignHtml(lang, P) + (pl.ranked ? '' : $q.cZ + esc(t(lang, 'small')) + '</p>');
const pv = viewOf(pl, o);
body += $q.da + esc(t(lang, pl.ranked ? 'tbl_h' : $q.db)) + '</h2>' + (o && o.G ? rgBar(lang, pl, path, o) : '') + (pv.L.length ? (o && !o.all && pv.L.length > PG_N ? tableHtml(lang, Object.assign({}, pv, { L: pv.L.slice(0, PG_N) }), o) + moreHtml(lang, pv, path, o) : tableHtml(lang, pv, o)) : '<p>' + esc(o.RT('rk_0')) + '</p>');
body += thinHtml(lang, pl);
body += emailBox(lang, P) + replyBox(lang, null);
body += $q.dc + esc(t(lang, 'faq_h')) + $q.dd + faq.map(([q, a]) => $q.de + esc(q) + $q.df + esc(a) + $q.dg).join('') + $q.dh;
body += linksHtml(lang, slug) + $q.di + $s.LED_JS + $s.FORM_JS;
const url = PUB(lang, path);
const items = pl.L.slice(0, PG_N).map((r, i) => Object.assign({ '@type': $q.bZ, position: pl.ranked ? r['rk_' + slug] : i + 1, name: r.n }, r.sumba ? {} : { url: PUB(lang, $q.ax + r.s + '/') }));
const ld = [
{ '@type': $q.dj, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: ix.updated, isPartOf: { '@type': $q.dk, name: $q.cR, url: ORIGIN + '/' }, publisher: { '@type': $q.dl, name: $q.cR, url: ORIGIN + '/' }, about: { '@type': 'Place', name: pN, alternateName: P.n !== pN ? P.n : undefined, address: { '@type': $q.dm, addressCountry: P.cc } } },
{ '@type': $q.dn, name: title, numberOfItems: pl.n, itemListOrder: pl.ranked ? $t.k20 : $q.do, itemListElement: items },
{ '@type': $q.dp, name: title, description: desc, url, isAccessibleForFree: true, dateModified: ix.updated, license: $t.k21, creator: { '@type': $q.dl, name: $q.cR, url: ORIGIN + '/' }, spatialCoverage: { '@type': 'Place', name: P.n }, variableMeasured: t('en', 'name') + $q.dq, measurementTechnique: ORIGIN + $q.I, distribution: [{ '@type': $q.dr, encodingFormat: $q.ds, contentUrl: ORIGIN + $q.dt + slug }, { '@type': $q.dr, encodingFormat: $q.du, contentUrl: ORIGIN + $q.G + slug + '.csv' }] },
crumbLd(lang, cr)];
return { title, desc, body, ld, path };
}
function hubTable(lang, ix, kind) {
const L = [...ix.places.values()].filter(pl => pl.P.k === kind).sort((a, b) => b.n - a.n || a.P.n.localeCompare(b.P.n));
const cols = [t(lang, $q.dv), t(lang, 'c_n'), t(lang, 'c_med'), t(lang, $q.dw), t(lang, $q.dx), t(lang, 'c_dep')];
return $s.k5 + cols.map(c => $q.aY + esc(c) + '</th>').join('') + $q.aZ +
L.map(pl => $q.dy + esc(cols[0]) + $q.dz + pre(lang) + $q.G + pl.P.s + '/">' + bdi(mkName(pl.P.n, lang)) + '</a>' + (pl.ranked ? '' : $q.dA + esc(t(lang, $q.dB)) + $q.as) + $q.dC + esc(cols[1]) + '">' + nf(lang, pl.n) + $q.dC + esc(cols[2]) + '">' + (pl.med == null ? '-' : nf(lang, pl.med)) + $q.dC + esc(cols[3]) + '">' + nf(lang, pct(pl.permit, pl.n)) + $q.dD + esc(cols[4]) + '">' + nf(lang, pct(pl.date, pl.n)) + $q.dD + esc(cols[5]) + '">' + nf(lang, pct(pl.deposit, pl.n)) + $q.dE).join('') + $q.ba;
}
function hubPage(ix, lang) {
const path = $q.G, title = t(lang, $q.dF), desc = t(lang, $q.dG);
const cr = [[$q.cR, pre(lang) + '/', $q.cR], [t(lang, $q.cg), $q.cS, esc(t(lang, $q.cg))], [t(lang, $q.cT), pre(lang) + path, esc(t(lang, $q.cT))]];
const body = $t.k22 + crumbHtml(lang, cr) + '<h1>' + esc(t(lang, $q.dH)) + $q.cU + esc(t(lang, $q.dI)) + $q.dJ + esc(t(lang, $q.bp, { d: fdt(ix.updated, lang) })) + $q.bf + pre(lang) + $q.bq + esc(t(lang, $q.br)) + '</a>' + methodLine(lang) + $q.bV +
$q.dK + esc(t(lang, $q.dL)) + '</h2>' + hubTable(lang, ix, 'i') + $q.dM + esc(t(lang, $q.dN)) + '</h2>' + hubTable(lang, ix, 'c') +
$q.cZ + esc(t(lang, $q.dO)) + $q.dP + esc(t(lang, $q.cW)) + $q.co + replyBox(lang, null) + linksHtml(lang, null) + $q.di;
const url = PUB(lang, path), all = [...ix.places.values()];
const ld = [{ '@type': $q.dQ, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: ix.updated, isPartOf: { '@type': $q.dk, name: $q.cR, url: ORIGIN + '/' } },
{ '@type': $q.dn, name: title, numberOfItems: all.length, itemListElement: all.map((pl, i) => ({ '@type': $q.bZ, position: i + 1, name: mkName(pl.P.n, lang), url: PUB(lang, $q.G + pl.P.s + '/') })) },
{ '@type': $q.dp, name: title, description: desc, url, isAccessibleForFree: true, dateModified: ix.updated, license: $t.k23, creator: { '@type': $q.dl, name: $q.cR, url: ORIGIN + '/' }, measurementTechnique: ORIGIN + $q.I, distribution: [{ '@type': $q.dr, encodingFormat: $q.ds, contentUrl: ORIGIN + $q.dR }, { '@type': $q.dr, encodingFormat: $q.du, contentUrl: ORIGIN + $q.dS }] },
crumbLd(lang, cr)];
return { title, desc, body, ld, path };
}
const MX_IDS = ['DXB-021', 'PHK-001', 'MYS-004'];
function exampleHtml(ix, lang) {
const r = MX_IDS.map(i => ix.rows.get(i)).find(Boolean); if (!r || !t31(lang, 'mx_h')) return '';
const nc = KEYS.filter(k => r.comp[k].st === 'nc').map(k => t(lang, 'c_' + k));
const pl = [...ix.places.values()].find(p => p.L.includes(r));
const P = pre(lang) + $q.ax + r.s + '/';
return $q.dT + esc(t31(lang, 'mx_h', { n: r.n })) + $q.bw + esc(t31(lang, $q.dU)) + $q.bf + P + '">' + bdi(r.n) + $q.dV + esc(t31(lang, 'mx_s1')) + '</p>' + ledger(lang, r) +
'<p>' + esc(nc.length ? t31(lang, 'mx_s2', { nc: nc.join(', ') }) : t31(lang, $q.dW)) + $q.dX + esc(t31(lang, 'mx_s3', { g: nf(lang, r.got), a: nf(lang, r.avail), s: nf(lang, r.score) })) + $q.dY +
(pl ? '<p>' + esc(t31(lang, 'mx_s4', { p: pl.P.n })) + $q.bf + pre(lang) + $q.G + pl.P.s + '/">' + bdi(pl.P.n) + $q.co : '');
}
function methodPage(ix, lang) {
const path = $q.I, title = t(lang, $q.dZ), desc = t(lang, $q.ea);
const cr = [[$q.cR, pre(lang) + '/', $q.cR], [t(lang, $q.cT), pre(lang) + $q.G, esc(t(lang, $q.cT))], [title, pre(lang) + path, esc(title)]];
const cols = t(lang, $q.eb), W = t(lang, $q.ec), S = t(lang, $q.ed);
const rows = KEYS.map(k => $q.ee + esc(cols[0]) + '">' + esc(t(lang, 'c_' + k)) + $q.ef + esc(cols[1]) + '">' + nf(lang, MAX[k]) + $q.eg + esc(cols[2]) + '">' + esc(W[k]) + $q.eg + esc(cols[3]) + $q.eh + esc(S[k]) + $q.ei).join('');
const places = TR_PLACES.map(P => $q.cs + pre(lang) + $q.G + P.s + '/">' + bdi(P.n) + $q.ej + bdi(P.cc) + '): ' + th(lang, $q.ek, { m: P.m.map(bdi).join(', ') }) + (P.a ? '; ' + th(lang, $q.el, { a: bdi(P.an || P.a.source) }) + ((P.am || []).length ? ' (' + P.am.map(bdi).join(', ') + ')' : '') : '') + $q.em).join('');
const D = ix.dates, dl = [[$q.en, D.named], [$q.eo, D.cases], [$q.A, D.ontime], [$q.ep, D.web], [$q.eq, D.look], [$q.C, D.sanctions], [$q.er, D.gleif]].map(([f, d]) => $q.cs + f + $q.eh + f + $q.es + (d ? $q.ct + esc(fdt(String(d).slice(0, 10), lang)) + $q.L : '') + '</li>').join('');
const body = $t.k24 + crumbHtml(lang, cr) + '<h1>' + esc(title) + $q.cU + esc(t(lang, $q.et)) + $q.dJ + methodLine(lang).trim() + '</p>' + accLine(lang) + $q.dh +
$q.eu + esc(t(lang, $q.ev)) + $s.k6 + cols.map(c => $q.aY + esc(c) + '</th>').join('') + $q.aZ + rows + $q.ew + esc(t(lang, 'name')) + $t.k25 +
exampleHtml(ix, lang) +
$q.ex + esc(t(lang, $q.ey)) + $q.ez + t(lang, $q.eA).map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>' +
$q.eB + esc(t(lang, $q.eC)) + $q.bw + esc(t(lang, $q.eD)) + '</p>' +
$q.eE + esc(t(lang, $q.cW)) + $q.bw + esc(t(lang, $q.dO)) + ' ' + esc(t(lang, 'coi')) + $q.dP + esc(t(lang, $q.cW)) + $q.co +
$q.eF + esc(t(lang, $q.eG)) + $q.bw + esc(t(lang, $q.eH)) + $q.eI + places + '</ul>' +
$q.eJ + esc(t(lang, $q.eK)) + $q.ez + dl + '</ul>' + replyBox(lang, null) + linksHtml(lang, null) + $q.di;
const url = PUB(lang, path);
const ld = [{ '@type': $q.dj, '@id': url + '#page', url, name: title, description: desc, inLanguage: lang, dateModified: ix.updated, isPartOf: { '@type': $q.dk, name: $q.cR, url: ORIGIN + '/' } }, crumbLd(lang, cr)];
return { title, desc, body, ld, path };
}
const BODY = new Map();
export async function page(req, u, env, ctx, shell) {
  try { await loadS31(env); } catch (e) {}   // n31b: worked example strings
  if (u.pathname === SITEMAP) return sitemap(env);
  const m = u.pathname.match(PAGE_RX); if (!m || !shell) return null;
  if (!m[4]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': $q.eL } });
  const lang = m[1] || 'en', slug = m[2] || null, method = !!m[3];
  let ix; try { ix = await trData(env); } catch (e) { return null; }
  let o = null; if (slug && !method) { try { const R = await import('./kbx_n37u.js'), G = await R.regMap(env); if (G) o = { G, RT: (k, v) => R.rgT(lang, k, v), rg: u.searchParams.get('rg') === '1', so: u.searchParams.get('s') === 'reg', all: u.searchParams.get('all') === '1' }; } catch (e) { o = null; } }   // r10u: register filter and sort; r11u: all=1
  if (o && u.searchParams.has('rows')) {   // r11u: the rows after the first PG_N, as an HTML fragment for the ranking table
    const from = Math.max(0, parseInt(u.searchParams.get('from'), 10) || PG_N), all = u.searchParams.get('to') === 'all', fk = lang + '|' + slug + '|' + ix.v + '|f' + from + (all ? 'a' : '') + (o.rg ? 1 : 0) + (o.so ? 1 : 0) + '|' + o.G.size;
    let h = BODY.get(fk); if (h == null) { h = rowsFrag(ix, slug, lang, o, from, all); if (h == null) return null; BODY.set(fk, h); }
    return new Response(h.h, { status: 200, headers: { 'content-type': $q.eM, 'cache-control': $q.eN, 'x-robots-tag': $q.eO, 'x-kb-tr': ix.v, 'x-kb-next': String(h.next) } });
  }
  const key = lang + '|' + (method ? '#m' : slug || '#h') + '|' + ix.v + (o ? '|g' + (o.rg ? 1 : 0) + (o.so ? 1 : 0) + (o.all ? 'a' : '') + '|' + o.G.size : '');
  let pg = BODY.get(key);
  if (!pg) { pg = method ? methodPage(ix, lang) : slug ? placePage(ix, slug, lang, o) : hubPage(ix, lang); if (!pg) return null; if (BODY.size >= 40) BODY.delete(BODY.keys().next().value); BODY.set(key, pg); }
  const sh = await shell(pre(lang) + $q.eP);
  const url = PUB(lang, pg.path), alts = LANGS.map(l => $q.eQ + l + $q.eR + PUB(l, pg.path) + '">').join('') + $q.eS + ORIGIN + pg.path + '">';
  const tags = $q.eT + esc(pg.title) + ([...pg.title].length + 11 <= 60 ? $q.eU : '') + $q.eV + esc(pg.desc) + $q.eW + url + '">' + alts + $q.eX +
    $q.eY + esc(pg.title) + $q.eZ + esc(pg.desc) + $q.fa + url + $q.fb + ogImg(url) + $q.fc +
    $q.fd + JSON.stringify({ '@context': $q.fe, '@graph': pg.ld }).replace(/</g, $q.ff) + $q.fg + $q.a;
  const res = new HTMLRewriter()
    .on('html', { element(e) { e.setAttribute('lang', lang); if (lang === 'ar') e.setAttribute('dir', 'rtl'); else e.removeAttribute('dir'); } })
    .on('title', { element(e) { e.remove(); } })
    .on($q.fh, { element(e) { e.remove(); } })
    .on($q.fi, { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(pg.body, { html: true }); } })
    .on($q.fj, { element(e) { const l = e.getAttribute($q.fk); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + pg.path); } })
    .transform(new Response(sh.body, { headers: { 'content-type': $q.eM } }));
  return new Response(await res.text(), { status: 200, headers: { 'content-type': $q.eM, 'cache-control': $q.eN, 'x-kb-tr': ix.v } });
}
async function sitemap(env) {
let ix; try { ix = await trData(env); } catch (e) { return new Response($q.fl, { status: 503 }); }
const paths = [$q.G, $q.I].concat([...ix.places.keys()].map(s => $q.G + s + '/'));
const xe = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const urls = paths.flatMap(p => LANGS.map(l => $q.fm + xe(PUB(l, p)) + $q.fn + ix.updated + $q.fo + LANGS.map(a => $t.k26 + a + $q.eR + xe(PUB(a, p)) + '"/>').join('') + $t.k27 + xe(ORIGIN + p) + $q.fp));
return new Response($s.k7 + urls.join('\n') + $q.fq, { headers: { 'content-type': $q.fr, 'cache-control': $q.fs } });
}
function rowJson(r, slug) {
const comp = {}; for (const k of KEYS) { const q = r.comp[k]; comp[k] = { status: q.st === 'yes' ? 'yes' : q.st === 'part' ? $q.ft : q.st === 'no' ? $q.fu : $q.fv, points: q.st === 'nc' ? null : q.pts, max: q.st === 'nc' ? null : q.max }; if (k === $q.P) comp[k].record = q.r; }
return { id: r.id, name: r.n, developer: r.dv, rank: slug ? r['rk_' + slug] : undefined, transparency_score: r.score, points: r.got, points_available: r.avail, reviewed: r.rv, page: r.sumba ? null : ORIGIN + $q.ax + r.s + '/', components: comp };
}
const RL = new Map();
async function allow(req, ctx) {
const ip = req.headers.get($q.fw) || 'x', w = Math.floor(Date.now() / 600000), k = ip + '|' + w;
const local = (RL.get(k) || 0) + 1; RL.set(k, local); if (RL.size > 3000) RL.clear();
let shared = 0; const ck = new Request(ORIGIN + $q.fx + encodeURIComponent(ip) + '/' + w);
try { const hit = await caches.default.match(ck); if (hit) shared = +(await hit.text()) || 0; } catch (e) {}
const n = Math.max(local, shared + 1);
try { const pr = caches.default.put(ck, new Response(String(n), { headers: { 'cache-control': $q.fy } })); if (ctx && ctx.waitUntil) ctx.waitUntil(pr.catch(() => {})); } catch (e) {}
return n <= 5;
}
async function lead(req, u, env, ctx) {
  const o = (b, s) => new Response(JSON.stringify(b), { status: s || 200, headers: { 'content-type': $q.fz, 'cache-control': $q.fA } });
  if (req.method !== 'POST') return o({ error: $q.fB, use: $q.fC }, 405);
  const orig = req.headers.get($q.fD); if (orig && !/^https:\/\/(www\.)?kolaboro\.com$/.test(orig)) return o({ error: $q.fD }, 403);
  let b; try { const tx = await req.text(); if (tx.length > 2000) return o({ error: 'body' }, 400); b = JSON.parse(tx); } catch (e) { return o({ error: 'body' }, 400); }
  if (b && b.website) return o({ ok: true });   // honeypot: answer like success, store nothing
  const email = String((b && b.email) || '').trim().toLowerCase(), P = TR_PLACES.find(x => x.s === String((b && b.place) || '')), lang = LANGS.includes(b && b.lang) ? b.lang : 'en';
  if (email.length > 200 || !/^[^@\s<>"',;]+@[^@\s<>"',;]+\.[a-z]{2,}$/.test(email)) return o({ error: 'email' }, 400);
  if (!P) return o({ error: 'place' }, 400);
  if (!b || b.consent !== true) return o({ error: $q.fE }, 400);
  if (!(await allow(req, ctx))) return o({ error: 'rate' }, 429);
  const { rpc } = await import('./kolaboro.js');
  const today = new Date().toISOString().slice(0, 10), path = pre(lang) + $q.G + P.s + '/';
  let r; try {
    r = await rpc($q.fF, { p_name: $q.fG, p_email: email, p_country: P.co, p_phone: '', p_who: $q.fH + P.n + ' | ' + path,
      p_bring: $q.fI + P.n + $q.fJ + today + ' on ' + path + '.',
      p_learn: '', p_week: '', p_lang: lang, p_source: $q.fK + P.s + $q.fL + path + (b.ref && /^https?:\/\//.test(b.ref) ? $q.fM + host(b.ref) : ''), p_plan: $q.fN });
  } catch (e) { return o({ error: 'db' }, 503); }
  if (r === 'ok' || r === $q.fO) return o({ ok: true, place: P.s });   // too_many: this address already asked 3 times this hour; nothing more is stored
  return o({ error: r === $q.fP ? 'email' : 'db' }, r === $q.fP ? 400 : 503);
}
export async function handle(req, u, env, ctx) {
const p = u.pathname.replace(/\/+$/, '');
if (p === $q.fQ) return lead(req, u, env, ctx);
const H = { 'content-type': $q.fz, 'cache-control': $q.eN, 'access-control-allow-origin': '*', 'x-content-type-options': $q.fR };
if (req.method !== 'GET' && req.method !== 'HEAD') return new Response(JSON.stringify({ error: $q.fB }), { status: 405, headers: H });
let ix; try { ix = await trData(env); } catch (e) { return new Response(JSON.stringify({ error: $q.fS }), { status: 503, headers: Object.assign({}, H, { 'cache-control': $q.fA }) }); }
const meta = { name: $q.fT, method: ORIGIN + $q.I, weights: MAX, licence: $t.k28, data_read: ix.updated, min_projects_to_rank: MIN_RANK, note: $s.k8 };
const slug = p.split('/')[4];
if (slug) {
const pl = ix.places.get(slug); if (!pl) return new Response(JSON.stringify({ error: 'place', places: [...ix.places.keys()] }), { status: 404, headers: H });
return new Response(JSON.stringify(Object.assign(meta, { place: pl.P.n, slug, kind: pl.P.k === 'i' ? $q.fU : 'city', country_iso: pl.P.cc, page: ORIGIN + $q.G + slug + '/', ranked: pl.ranked, projects: pl.n, median: pl.med, permit_published: pl.permit, handover_date_published: pl.date, deposit_protection_stated: pl.deposit, disclosure: pl.P.coi ? t('en', 'coi') : undefined, rows: pl.L.map(r => rowJson(r, pl.ranked ? slug : null)) }), null, 1), { headers: H });
}
return new Response(JSON.stringify(Object.assign(meta, { page: ORIGIN + $q.G, places: [...ix.places.values()].map(pl => ({ slug: pl.P.s, place: pl.P.n, kind: pl.P.k === 'i' ? $q.fU : 'city', country_iso: pl.P.cc, projects: pl.n, ranked: pl.ranked, median: pl.med, permit_published: pl.permit, handover_date_published: pl.date, deposit_protection_stated: pl.deposit, api: ORIGIN + $q.dt + pl.P.s })) }), null, 1), { headers: H });
}
export { placePage, hubPage, methodPage };
