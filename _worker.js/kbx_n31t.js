// comments: _notes/kolaboro-worker-comments.txt
import { TB } from './kbx_strings.js';
const $q = TB.kbx_n31t__q;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
let T = null;
const MT = { en: ['Kolaboro is down for a short maintenance', 'We are updating the site. Please try again in about {m} minutes. The open data API and the status page keep working.', 'System status'] };
async function loadT(env) {
if (T) return T;
try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/n31t-i18n.json')); if (r.ok) T = await r.json(); } catch (e) {}
if (!T) { try { const r = await fetch(ORIGIN + '/data/n31t-i18n.json', { cf: { cacheTtl: 300 } }); if (r.ok) T = await r.json(); } catch (e) {} }
return T;
}
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const COI_RX = /eco\s*beach\s*city|\bequinox\b/i;
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const t = (l, k) => { const a = T && T[l] && T[l][k]; return a != null ? a : T ? T.en[k] : ''; };
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
const nf = (n, l, d) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { maximumFractionDigits: d == null ? 0 : d, numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); } };
const fd = (d, l) => { if (!d) return ''; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { day: $q.b, month: 'long', year: $q.b, timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(String(d).slice(0, 10) + $q.c)); } catch (e) { return String(d).slice(0, 10); } };
const bdi = (l, h) => l === 'ar' ? '<bdi>' + h + $q.d : h;
const lk = (s, l) => esc(s).replace(/(^|[\s(:\uff1a\uff08])(\/(?:[a-z0-9._#-]+\/?)+)(?=[\s).,;:\u3002\uff0c]|$)/gi, (m, a, p) => { const tail = /[.,]+$/.exec(p); if (tail) p = p.slice(0, -tail[0].length); return a + $q.e + (/^\/(data|api|open|security\/sbom|\.well-known|engineering|status|k)\b/.test(p) || l === 'en' ? p : pre(l) + p) + '"' + (l === 'ar' ? $q.f : '') + '>' + p + '</a>' + (tail ? tail[0] : ''); });
const LP = '(?:(es|de|fr|nl|ru|zh|ar)\\/)?';
const R = {
arch: new RegExp('^\\/' + LP + 'engineering\\/architecture\\/?$'), mods: new RegExp('^\\/' + LP + 'engineering\\/modules\\/?$'), rb: new RegExp('^\\/' + LP + 'engineering\\/rollback\\/?$'),
lic: new RegExp('^\\/' + LP + 'engineering\\/licenses\\/?$'), ck: new RegExp('^\\/' + LP + 'engineering\\/checks\\/?$'), mt: new RegExp('^\\/' + LP + 'engineering\\/maintenance\\/?$'),
sc: new RegExp('^\\/' + LP + 'shortcuts\\/?$'), vd: new RegExp('^\\/' + LP + 'security\\/disclosure\\/?$'), pk: /^\/(es|de|fr|nl|ru|zh|ar)\/press\/?$/,
cs: new RegExp('^\\/' + LP + 'press\\/cases\\/?$'), dj: new RegExp('^\\/' + LP + 'press\\/data-journalism\\/?$'), pm: /^\/(es|de|fr|nl|ru|zh|ar)\/press\/monthly\/?$/
};
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:engineering\/(?:architecture|modules|rollback|licenses|checks|maintenance)|shortcuts|security\/disclosure|press\/cases|press\/data-journalism)\/?$|^\/(?:es|de|fr|nl|ru|zh|ar)\/press(?:\/monthly)?\/?$|^\/api\/v1\/alerts$|^\/security\.txt$/;
const MEMO = {};
async function file(env, p, ttl) {
  const m = MEMO[p]; if (m && Date.now() - m.t < (ttl || 600000)) return m.v;
  let v = null;
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.g + p)); if (r.ok) v = await r.json(); } catch (e) { v = null; }
  MEMO[p] = { t: Date.now(), v }; return v;
}
async function live(path, ms) {   // a public endpoint of this site, read as a visitor would (short timeout)
  try { const r = await fetch(ORIGIN + path, { headers: { accept: $q.h, 'user-agent': $q.i }, signal: AbortSignal.timeout(ms || 8000) }); return r.ok ? await r.json() : null; } catch (e) { return null; }
}
const N = () => import('./kbx_named.js');
const REL = ['/engineering/architecture/', '/engineering/checks/', '/engineering/modules/', '/engineering/rollback/', '/engineering/licenses/', '/status/', '/shortcuts/', '/security/disclosure/'];
const relHtml = (l, skip) => '<h2>' + esc(t(l, 'rel')) + $q.j + REL.map((p, i) => p === skip ? '' : $q.k + (p === $q.l ? p : pre(l) + p) + '">' + esc(t(l, 'rel_l')[i]) + $q.m).join('') + '</ul>';
async function page(shell, l, o) {
  const n = await N(), canon = ORIGIN + pre(l) + o.path;
  const crumbs = [[t(l, 'home'), pre(l) + '/']].concat(o.crumb || [[t(l, 'eng'), $q.n]]).concat([[o.h1, null]]);
  const body = $q.o + (l === 'ar' ? $q.p : '') + $q.q + crumbs.map(c => c[1] ? $q.e + esc(c[1]) + '">' + esc(c[0]) + '</a>' : esc(c[0])).join(' / ') + $q.r + esc(o.h1) + $q.s + esc(o.lead) + '</p>' +
    (o.updated ? $q.t + esc(fill(t(l, 'upd'), { d: fd(o.updated, l) })) + '</p>' : '') + $q.u + (l === 'ar' ? $q.p : '') + '>' + $q.a + o.body + $q.v;
  const ld = { '@context': $q.w, '@graph': [{ '@type': o.type || $q.x, url: canon, name: o.h1, description: o.lead, inLanguage: l, dateModified: o.updated || new Date().toISOString().slice(0, 10), isPartOf: { '@type': $q.y, name: $q.z, url: ORIGIN + '/' } },
    { '@type': $q.A, itemListElement: crumbs.map((c, i) => ({ '@type': $q.B, position: i + 1, name: c[0], item: c[1] ? ORIGIN + c[1] : canon })) }] };
  const langs = o.langs || LANGS;
  const html = await n.assemble({ title: o.title || o.h1 + $q.C, desc: o.desc || o.lead.slice(0, 155), canon, body, ld, alt: x => ORIGIN + pre(langs.includes(x) ? x : 'en') + o.path }, l, await shell(pre(l) + $q.D));
  const h = { 'content-type': $q.E, 'cache-control': $q.F + (o.maxAge || 600), 'content-language': l };
  if (o.noindex) h[$q.G] = $q.H;
  return new Response(o.noindex ? html.replace($q.I, $q.J) : html, { status: o.status || 200, headers: h });
}
const table = (th, rows, cls) => $q.K + (cls ? $q.L + cls + '"' : '') + $q.M + th.map(x => $q.N + esc(x) + '</th>').join('') + $q.O + rows.join('') + $q.P;
function archSvg(l, nMods) {
const D = t(l, 'ar_d'), dir = l === 'ar' ? $q.Q : '';
const box = (x, y, w, h, label, sub) => $q.R + x + '" y="' + y + $q.S + w + $q.T + h + $q.U + (x + w / 2) + '" y="' + (y + h / 2 + (sub ? -2 : 5)) + $q.V + dir + '>' + esc(label) + $q.W + (sub ? $q.X + (x + w / 2) + '" y="' + (y + h / 2 + 16) + $q.Y + dir + '>' + esc(sub) + $q.W : '');
const ar = (x1, y1, x2, y2, dash) => $q.Z + x1 + $q.aa + y1 + $q.ab + x2 + $q.ac + y2 + $q.ad + (dash ? $q.ae : '') + $q.af;
return $q.ag + esc(t(l, $q.ah)) + $q.ai +
$q.aj + dir + '>' + esc(D.e) + $q.W +
box(10, 120, 120, 50, D.v) + box(180, 60, 180, 56, D.s, $q.ak) + box(180, 140, 180, 56, D.w.replace('{n}', nMods), $q.al) + box(390, 140, 170, 56, D.c) + box(180, 212, 380, 46, D.f, $q.am) +
box(640, 90, 300, 56, D.db) + box(640, 180, 300, 56, D.o) +
box(10, 330, 200, 56, D.g, 'main') + box(260, 330, 200, 56, D.p, $q.an) + box(510, 330, 200, 56, D.d, $q.ao) + box(760, 330, 190, 56, D.gd, $q.ap) +
ar(130, 145, 178, 145) + ar(270, 140, 270, 118) + ar(360, 168, 388, 168) + ar(270, 196, 270, 210) + ar(360, 160, 638, 120) + ar(360, 176, 638, 206, 1) +
ar(210, 358, 258, 358) + ar(460, 358, 508, 358) + ar(610, 330, 400, 260) + ar(710, 358, 758, 358) + ar(855, 330, 600, 270, 1) + $q.aq;
}
async function archPage(env, shell, l) {
const m = await file(env, $q.ar), n = m ? m.totals.modules : 0;
const b = $q.as + archSvg(l, n) + $q.at + esc(t(l, $q.ah)) + $q.au +
t(l, 'ar_s').map(([h, p]) => '<h2>' + esc(h) + $q.av + esc(p) + '</p>').join('') +
$q.aw + pre(l) + $q.ax + esc(t(l, $q.ay)) + $q.az + pre(l) + $q.aA + relHtml(l, $q.aB);
return page(shell, l, { path: $q.aB, h1: t(l, 'ar_t'), lead: t(l, 'ar_l'), body: b, updated: $q.aC, type: $q.aD });
}
async function modsPage(env, shell, l) {
const m = await file(env, $q.ar); if (!m) return null;
const F = t(l, $q.aE), LD = t(l, 'mo_ld'), tot = m.totals;
const rows = m.modules.slice().sort((a, b) => b.bytes - a.bytes).map(x => $q.aF + esc(x.file) + $q.aG + esc(F[x.family] || x.family) + $q.aH + esc(LD[x.loaded] || x.loaded) + $q.aI + bdi(l, nf(x.bytes / 1024, l, 0) + ' KB') + $q.aH + x.imported_by.slice(0, 3).map(y => $q.aJ + esc(y[0]) + $q.aK).join(', ') + (x.imported_by.length > 3 ? ' +' + (x.imported_by.length - 3) : '') + $q.aL + esc(x.about.slice(0, 160)) + (x.about.length > 160 ? '…' : '') + $q.aM);
const b = $q.aN + esc(fill(t(l, $q.aO), { n: nf(tot.modules, l), mb: nf(tot.bytes / 1048576, l, 1), d: nf(tot.on_demand, l), u: tot.unreachable.length ? tot.unreachable.join(', ') : t(l, 'none'), x: nf(m.unused_exports.length, l) })) + $q.aP + esc(t(l, 'mo_rm')) + '</p>' +
'<h2>' + esc(t(l, $q.aQ)) + $q.aR + t(l, $q.aS).map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' + table(t(l, 'mo_th'), rows) +
$q.t + lk(fill(t(l, $q.aT), { d: fd(m.generated, l) }), l) + '</p>' + relHtml(l, $q.aU);
return page(shell, l, { path: $q.aU, h1: t(l, 'mo_t'), lead: t(l, 'mo_l'), body: b, updated: String(m.generated).slice(0, 10) });
}
async function rbPage(env, shell, l) {
const [d, c] = await Promise.all([file(env, $q.aV, 300000), file(env, $q.aW)]);
const dep = (d && d.deploys) || [], last = dep[0] || {}, rbk = dep.find(x => x.result === $q.aX), R0 = (c && c.rollback) || {};
const tests = t(l, $q.aY), ts = [];
if (R0.drill) ts.push(fill(tests[0], { a: nf(R0.drill.real_passed, l), b: nf(R0.drill.real_total, l) }));
if (R0.revert) ts.push(fill(tests[1], { f: nf(R0.revert.files, l), s: nf(R0.revert.seconds, l, 1) }));
if (rbk) ts.push(fill(tests[2], { d: fd(rbk.at, l), r: nf(rbk.files_restored || 0, l), p: nf((rbk.after_rollback || {}).checks_total || 32, l) }));
const b = '<ol>' + t(l, 'rb_s').map(([h, p], i) => $q.aZ + esc(h) + $q.ba + esc(i === 0 ? fill(p, { n: nf(last.checks_total || 32, l) }) : p) + '</li>').join('') + '</ol>' +
'<h2>' + esc(t(l, $q.bb)) + $q.aR + ts.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
(last.at ? '<p>' + lk(fill(t(l, $q.bc), { r: last.result, d: fd(last.at, l), p: nf(last.checks_passed || 0, l), t: nf(last.checks_total || 0, l), n: nf(dep.length, l) }), l) + '</p>' : '') +
$q.bd + relHtml(l, $q.be);
return page(shell, l, { path: $q.be, h1: t(l, 'rb_t'), lead: t(l, 'rb_l'), body: b, updated: $q.aC, type: $q.aD });
}
async function licPage(env, shell, l) {
const s = await file(env, $q.bf); if (!s) return null;
const libs = new Map();
for (const c of s.components || []) {
if (c.type !== $q.bg || !c.version) continue;
const lic = (c.licenses || []).map(x => (x.license && (x.license.id || x.license.name)) || x.expression).filter(Boolean).join(', ');
if (!lic) continue;
const k = c.name.replace(/^@contentauth\//, '') + '@' + c.version;
const from = /^pkg:cdnjs/.test(c.purl || '') ? 'cdnjs' : 'npm';
const e = libs.get(k) || { name: c.name, version: c.version, lic, from: new Set() }; e.from.add(from); libs.set(k, e);
}
const U = t(l, $q.bh), L = [...libs.values()].sort((a, b) => a.name.localeCompare(b.name));
const rows = L.map(x => $q.bi + esc(x.name) + $q.bj + esc(x.version) + $q.aH + esc(x.lic) + $q.aH + esc(U[x.name] || U[x.name.replace(/^@[^/]+\//, '')] || '') + $q.bk + [...x.from].join(', ') + $q.bl);
const lv = (L.find(x => x.name === $q.bm) || {}).version || '';
const allPerm = L.every(x => /^(MIT|BSD-[23]-Clause|Apache-2\.0|ISC)$/.test(x.lic));
const rev = t(l, $q.bn).map((x, i) => i === 0 && !allPerm ? '' : '<li>' + esc(fill(x, { n: nf(L.length, l), lv })) + '</li>').join('');
const b = table(t(l, 'li_th'), rows) + '<h2>' + esc(t(l, $q.bo)) + $q.aR + rev + $q.bp + lk(fill(t(l, $q.bq), { d: fd(s.metadata && s.metadata.timestamp, l) }), l) + '</p>' + relHtml(l, $q.br);
return page(shell, l, { path: $q.br, h1: t(l, 'li_t'), lead: t(l, 'li_l'), body: b, updated: String((s.metadata && s.metadata.timestamp) || '').slice(0, 10) });
}
let AL = { t: 0, v: null };
export async function alerts(env) {
if (AL.v && Date.now() - AL.t < 120000) return AL.v;
const [pg, ai, dep] = await Promise.all([live($q.bs, 15000), live($q.bt), file(env, $q.aV, 300000)]);
const day = new Date().toISOString().slice(0, 10), A = [];
if (pg && pg.n && pg.up < pg.n) A.push({ kind: 'pages', level: 'error', up: pg.up, n: pg.n, down: (pg.pages || []).filter(x => !x.ok).map(x => x.p) });
if (pg && pg.checkout && !pg.checkout.ok) A.push({ kind: $q.bu, level: 'error', status: pg.checkout.checkout || pg.checkout.status || 0, step: pg.checkout.step });
const ad = ai && (ai.days || []).find(x => x.day === day), ay = ai && (ai.days || []).find(x => x.day === new Date(Date.now() - 864e5).toISOString().slice(0, 10));
for (const x of [ad, ay]) if (x && x.usd_estimated > 1) A.push({ kind: 'ai', level: $q.bv, day: x.day, usd: x.usd_estimated, line_usd: 1 });
const g = dep && dep.deploys && dep.deploys[0];
if (g && g.result !== 'pass' && Date.now() - Date.parse(g.at) < 864e5) A.push({ kind: 'guard', level: 'error', result: g.result, at: g.at });
const v = { at: new Date().toISOString(), ok: !A.length, alerts: A,
checked: { key_pages: pg ? { up: pg.up, n: pg.n, at: pg.at } : null, checkout: pg && pg.checkout ? { ok: pg.checkout.ok, status: pg.checkout.checkout || null } : null, ai_spend_today_usd: ad ? ad.usd_estimated : 0, ai_alert_line_usd: 1, ai_hard_cap_usd: ai ? ai.cap_usd_per_day : null, last_deploy_check: g ? { result: g.result, at: g.at } : null },
about: $q.bw };
AL = { t: Date.now(), v }; return v;
}
function alertText(l, a) {
const M = t(l, 'ck_al');
if (a.kind === 'pages') return fill(M.pages, { u: nf(a.up, l), n: nf(a.n, l) });
if (a.kind === $q.bu) return fill(M.checkout, { s: a.status });
if (a.kind === 'ai') return fill(M.ai, { d: fd(a.day, l), v: nf(a.usd, l, 2) });
return fill(M.guard, { r: a.result });
}
async function ckPage(env, shell, l, ctx) {
const [c, al, bl, er] = await Promise.all([file(env, $q.aW), alerts(env), file(env, $q.bx, 600000), errCounts(7)]);
if (!c) return null;
const k = al.checked || {};
let b = '<h2>' + esc(t(l, $q.by)) + $q.bz + (al.ok ? '' : $q.bA) + $q.bB + (al.ok ? $q.bC + esc(t(l, $q.bD)) + '</p>' : '<ul>' + al.alerts.map(a => $q.bE + esc(alertText(l, a)) + '</li>').join('') + '</ul>') +
$q.t + lk(fill(t(l, $q.bF), { u: k.key_pages ? nf(k.key_pages.up, l) : '?', n: k.key_pages ? nf(k.key_pages.n, l) : '?', c: k.checkout ? t(l, k.checkout.ok ? 'yes' : 'no') : '?', v: nf(k.ai_spend_today_usd || 0, l, 2) }), l) + $q.bG;
if (c.unit) b += '<h2>' + esc(t(l, $q.bH)) + $q.av + esc(fill(t(l, 'ck_ut'), { p: nf(c.unit.pass, l), n: nf(c.unit.total, l), d: fd(c.unit.at, l) })).replace(/(node --test \S+)/, $q.bI) + $q.bJ;
if (c.ttfb) b += '<h2>' + esc(t(l, $q.bK)) + $q.av + esc(fill(t(l, 'ck_tt'), { d: fd(c.ttfb.at, l) })) + '</p>' + table(t(l, $q.bL), c.ttfb.rows.map(r => $q.bM + esc(r.path) + $q.bN + nf(r.ttfb_ms_median, l) + $q.bO + (r.after_tls_ms_median <= 200 ? 'ok' : 'warn') + '">' + nf(r.after_tls_ms_median, l) + $q.bP + esc(r.cache || '') + $q.aM));
const sc = v => $q.bQ + (v >= 95 ? 'ok' : v >= 90 ? 'warn' : 'bad') + '">' + (v == null ? '' : nf(v, l)) + '</td>';
if (c.lighthouse) b += '<h2>' + esc(t(l, $q.bR)) + $q.av + esc(fill(t(l, 'ck_lh'), { v: c.lighthouse.version, d: fd(c.lighthouse.at, l) })) + '</p>' + table(t(l, $q.bS), c.lighthouse.rows.map(r => $q.bM + esc(r.path) + $q.bT + sc(r.performance) + sc(r.accessibility) + sc(r[$q.bU]) + sc(r.seo) + '</tr>'));
if (c.axe) b += '<h2>' + esc(t(l, $q.bV)) + $q.av + esc(fill(t(l, 'ck_ax'), { v: c.axe.version, d: fd(c.axe.at, l) })) + '</p>' + table(t(l, $q.bW), c.axe.rows.map(r => $q.bM + esc(r.path) + $q.bT + ['light', 'dark'].map(m => $q.bQ + (r[m] ? 'bad' : 'ok') + '">' + nf(r[m] || 0, l) + (r[m + $q.bX] && r[m + $q.bX].length ? $q.bY + esc(r[m + $q.bX].join(', ')) + $q.bZ : '') + '</td>').join('') + '</tr>'));
if (c.load) b += '<h2>' + esc(t(l, $q.ca)) + $q.av + esc(fill(t(l, 'ck_ld'), { d: fd(c.load.at, l), rps: nf(c.load.rps, l), s: nf(c.load.seconds, l), n: nf(c.load.requests, l), ok: nf(c.load.ok, l), e: nf(c.load.errors, l), p50: nf(c.load.p50, l), p95: nf(c.load.p95, l) })) + '</p>';
const B = ((bl && bl.builds) || []).slice().sort((a, b2) => String(a.built_at).localeCompare(String(b2.built_at)));
if (B.length) b += '<h2>' + esc(t(l, $q.cb)) + $q.av + esc(t(l, 'ck_bs')) + '</p>' + table(t(l, $q.cc), B.slice(-8).reverse().map(x => { const i = B.indexOf(x), p = i > 0 ? (x.bytes - B[i - 1].bytes) * 100 / B[i - 1].bytes : null; return $q.cd + esc(fd(x.built_at, l)) + $q.ce + esc(String(x.first_commit || '').slice(0, 10)) + $q.cf + nf(x.bytes / 1048576, l, 2) + $q.cg + (p == null ? '' : p > 5 ? 'bad' : 'ok') + '">' + (p == null ? '' : (p > 0 ? '+' : '') + nf(p, l, 1) + '%') + $q.ch; }));
if (c.headers) b += '<h2>' + esc(t(l, $q.ci)) + $q.av + esc(fill(t(l, 'ck_hd'), { d: fd(c.headers.at, l) })) + '</p>' + table(t(l, $q.cj), c.headers.rows.map(r => $q.bM + esc(r.h) + $q.ck + esc(r.what) + $q.cl + (r.st === 'set' ? 'ok' : 'warn') + '">' + esc(t(l, r.st === 'set' ? $q.cm : $q.cn)) + $q.ch));
b += '<h2>' + esc(t(l, $q.co)) + $q.av + esc(t(l, 'ck_er')) + '</p>' + (er.length ? table(t(l, $q.cp), er.slice(0, 15).map(r => $q.cq + esc(r.m) + $q.cr + esc(r.p) + $q.aI + nf(r.n, l) + $q.ch)) : '<p>' + esc(t(l, $q.cs)) + '</p>');
b += relHtml(l, $q.ct);
return page(shell, l, { path: $q.ct, h1: t(l, 'ck_t'), lead: t(l, 'ck_l'), body: b, updated: c.updated, maxAge: 120 });
}
const ERR_KEY = (d, h) => new Request(ORIGIN + $q.cu + d + '/' + h);
const ERR_IDX = d => new Request(ORIGIN + $q.cu + d + $q.cv);
const hash = s => { let h = 2166136261; for (const ch of s) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; } return h.toString(36); };
function cleanMsg(m) { return String(m || '').replace(/https?:\/\/\S+/g, '<url>').replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, $q.cw).replace(/\b\d{5,}\b/g, '<n>').replace(/\s+/g, ' ').trim().slice(0, 120); }
const pageType = pth => { const p = String(pth || '').replace(/^\/(?:es|de|fr|nl|ru|zh|ar)(?=\/)/, ''); return p === '/' || p === '' ? 'home' : /^\/projects\/[^/]+/.test(p) ? $q.cx : /^\/projects\/?$/.test(p) ? $q.cy : /^\/developers\//.test(p) ? $q.cz : /^\/(m|countries|rankings)\//.test(p) ? $q.cA : /^\/(tools|check)\//.test(p) ? 'tool' : 'other'; };
export function countErrs(items, ctx) {
const d = new Date().toISOString().slice(0, 10);
const work = (async () => {
for (const it of (items || []).filter(x => x && x.kind === 'js').slice(0, 5)) {
const m = cleanMsg(it.msg), pt = pageType(it.page); if (!m || m.length < 4) continue;
const h = hash(pt + '|' + m), k = ERR_KEY(d, h); let n = 0;
try { const r = await caches.default.match(k); if (r) n = (await r.json()).n || 0; } catch (e) {}
await caches.default.put(k, new Response(JSON.stringify({ m, p: pt, n: n + 1 }), { headers: { 'cache-control': $q.cB } }));
if (!n) { let ix = []; try { const r = await caches.default.match(ERR_IDX(d)); if (r) ix = await r.json(); } catch (e) {} if (ix.length < 200 && !ix.includes(h)) { ix.push(h); await caches.default.put(ERR_IDX(d), new Response(JSON.stringify(ix), { headers: { 'cache-control': $q.cB } })); } }
}
})().catch(() => {});
try { ctx.waitUntil(work); } catch (e) {}
}
async function errCounts(days) {
const M = new Map();
try {
for (let i = 0; i < days; i++) {
const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); let ix = [];
try { const r = await caches.default.match(ERR_IDX(d)); if (r) ix = await r.json(); } catch (e) {}
for (const h of ix.slice(0, 200)) { try { const r = await caches.default.match(ERR_KEY(d, h)); if (!r) continue; const o = await r.json(); const k = o.p + '|' + o.m; const e = M.get(k) || { m: o.m, p: o.p, n: 0 }; e.n += o.n || 0; M.set(k, e); } catch (e) {} }
}
} catch (e) {}
return [...M.values()].sort((a, b) => b.n - a.n);
}
async function scPage(shell, l) {
const b = table(t(l, 'sc_th'), t(l, $q.cC).map(([k, w]) => $q.cD + k.split(/(\s(?:or|o|oder|ou|of|или|或|أو|then|y|und|et|en|затем|然后|ثم)\s|,\s)/).map(x => /^\s|,\s/.test(x) ? esc(x) : $q.cE + esc(x) + $q.cF).join('') + $q.cG + esc(w) + $q.ch)) + '<p>' + esc(t(l, $q.cH)) + '</p>' + relHtml(l, $q.cI);
return page(shell, l, { path: $q.cI, h1: t(l, 'sc_t'), lead: t(l, 'sc_l'), body: b, updated: $q.aC, crumb: [] });
}
async function vdPage(shell, l) {
const b = t(l, 'vd_s').map(([h, p]) => '<h2>' + esc(h) + $q.av + lk(p, l).replace(/hello@kolaboro\.com/, $q.cJ).replace(/\/security#thanks/, $q.cK) + '</p>').join('') + relHtml(l, $q.cL);
return page(shell, l, { path: $q.cL, h1: t(l, 'vd_t'), lead: t(l, 'vd_l'), body: b, updated: $q.aC, crumb: [[$q.cM, $q.cN]] });
}
const MAINT_MIN = 15;
export async function maintPage(u, env) {
try { await loadT(env); } catch (e) {}
const lm = /^\/(es|de|fr|nl|ru|zh|ar)(\/|$)/.exec(u.pathname), l = lm ? lm[1] : 'en';
const h = '<!doctype html><html lang="' + l + '"' + (l === 'ar' ? ' dir="rtl"' : '') + '><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>' + esc(t(l, 'mt_h') || MT.en[0]) + ' | Kolaboro</title>' +
'<style>body{margin:0;font:17px/1.6 Archivo,system-ui,sans-serif;background:#F6F6F3;color:#17212B}main{max-width:620px;margin:12vh auto;padding:24px 16px}h1{font-size:1.7rem;line-height:1.25}a{color:#155C75}@media(prefers-color-scheme:dark){body{background:#11181F;color:#E9E7E0}a{color:#7CC4DD}}</style></head><body><main>' +
'<p><b>kolaboro</b></p><h1>' + esc(t(l, 'mt_h') || MT.en[0]) + '</h1><p>' + esc(fill(t(l, 'mt_p') || MT.en[1], { m: MAINT_MIN })) + '</p><p><a href="/status/">' + esc(t(l, 'mt_s') || MT.en[2]) + '</a> · <a href="/api/open/stats">API</a></p></main></body></html>';
return new Response(h, { status: 503, headers: { 'content-type': 'text/html; charset=utf-8', 'retry-after': String(MAINT_MIN * 60), 'cache-control': 'no-store', 'x-robots-tag': 'noindex', 'content-language': l } });
}
export const MAINT_SKIP = /^\/(?:api|data|k|open|\.well-known|status|engineering\/maintenance|_s)(?:\/|$)|\.[a-z0-9]{2,5}$/i;
async function mtPage(shell, l) {
const b = $q.cO + esc(t(l, 'mt_h') || MT.en[0]) + $q.av + esc(fill(t(l, 'mt_p') || MT.en[1], { m: MAINT_MIN })) + $q.cP + esc(t(l, 'mt_s') || MT.en[2]) + $q.cQ + esc(t(l, $q.cR)) + '</p>' + relHtml(l, '');
return page(shell, l, { path: $q.cS, h1: t(l, 'mt_t'), lead: t(l, 'mt_l'), body: b, updated: $q.aC, noindex: true });
}
async function pkPage(env, shell, l) {
const st = await live($q.cT);
const b = '<h2>' + esc(t(l, $q.cU)) + $q.av + esc(t(l, $q.cV)) + $q.cW + esc(t(l, $q.cX)) + $q.av + esc(fill(t(l, $q.cY), { p: st ? nf(st.projects, l) : $q.cZ, c: st ? nf(st.countries, l) : '90+' })) + '</p>' +
'<h2>' + esc(t(l, $q.da)) + $q.aR + t(l, $q.db).map(([n, p]) => $q.k + (/^\/press\/(monthly|cases|data-journalism)\//.test(p) ? pre(l) + p : p) + '">' + esc(n) + $q.m).join('') + '</ul>' +
'<h2>' + esc(t(l, $q.dc)) + $q.av + esc(t(l, 'pr_c')).replace($q.dd, $q.de) + '</p>' +
'<h2>' + esc(t(l, $q.df)) + $q.av + esc(t(l, $q.dg)) + $q.dh;
return page(shell, l, { path: $q.di, h1: t(l, 'pr_t'), lead: t(l, 'pr_l'), title: t(l, 'pr_ti') || undefined, desc: t(l, 'pr_de') || undefined, body: b, updated: st && st.updated ? String(st.updated).slice(0, 10) : $q.aC, crumb: [] });
}
function pmFacts(h) {
const x = h.text || '', n = s => (s || '').replace(/,/g, '');
let m;
if (h.key === $q.dj && (m = /\(([\d,]+) of ([\d,]+)\)/.exec(x))) return { v: h.value, a: n(m[1]), b: n(m[2]) };
if (h.key === $q.dk && (m = /among those ([\d,]+) projects.*?90th percentile: ([\d.]+)/.exec(x))) return { v: h.value, a: n(m[1]), p: m[2] };
if (h.key === $q.dl && (m = /\(([\d,]+) of ([\d,]+)\)/.exec(x))) return { v: h.value, a: n(m[1]), b: n(m[2]) };
if (h.key === $q.dm && (m = /across ([\d,]+) markets/.exec(x))) return { v: h.value, a: n(m[1]) };
if (h.key === $q.dn && (m = /on (\d{4}-\d{2}-\d{2}) \(base 100 on (\d{4}-\d{2}-\d{2})/.exec(x))) return { v: h.value, d: m[1], b: m[2] };
return null;
}
async function pmPage(env, shell, l) {
const r = await file(env, $q.do, 900000); if (!r) return null;
const H = t(l, 'pm_h'), rows = [];
for (const h of r.headlines || []) {
const f = pmFacts(h), tpl = H[h.key]; if (!f || !tpl) continue;
const v = { v: nf(f.v, l, 2), a: f.a != null ? nf(+f.a, l) : '', b: f.b != null && !/-/.test(f.b) ? nf(+f.b, l) : f.b ? fd(f.b, l) : '', p: f.p != null ? nf(+f.p, l, 1) : '', d: f.d ? fd(f.d, l) : '' };
rows.push($q.aZ + esc(h.key === $q.dk ? nf(f.v, l, 1) : h.key === $q.dm ? nf(f.v, l) : h.key === $q.dn ? nf(f.v, l, 2) : nf(f.v, l, 1) + ' %') + '</b> ' + esc(fill(tpl, v)) + $q.dp + esc(t(l, $q.dq)) + ': ' + (h.source || []).map(s => $q.e + esc(s.replace(ORIGIN, '')) + '">' + esc(s.replace(ORIGIN, '')) + '</a>').join(', ') + $q.dr);
}
const ch = [$q.ds, $q.dt, $q.du];
const b = $q.t + esc(fill(t(l, $q.dv), { title: r.title, d: fd(r.generated, l) })) + $q.dw + rows.join('') + $q.dx + esc(t(l, $q.dy)) + $q.aR + ch.map((c, i) => $q.dz + c + $q.dA + esc(t(l, 'pm_ch')[i]) + $q.dB).join('') + '</ul>' +
$q.dC + esc(t(l, 'pm_en')) + $q.dD;
return page(shell, l, { path: $q.dE, h1: t(l, 'pm_t'), lead: t(l, 'pm_l'), body: b, updated: r.generated, crumb: [[t(l, 'pr_t'), pre(l) + $q.di]], type: $q.dF });
}
async function csPage(env, shell, l) {
const n = await N(); let ix; try { ix = await n.data(env); } catch (e) { return null; }
const strong = e => e && e[1] === $q.dG && (e[2] === $q.dH || e[2] === $q.dI) && n.okHttp(e[3]) && !n.isListing(e[3]);
const L = ix.P.filter(x => !COI_RX.test(String(x.n || '') + ' ' + String(x.dv || '')) && !/sumba/i.test(String(x.mk || '') + ' ' + String(x.ar || '')))
.map(x => ({ x, c: (x.cl || []).filter(strong) })).filter(o => o.c.length >= 2).sort((a, b) => b.c.length - a.c.length || String(a.x.n).localeCompare(String(b.x.n))).slice(0, 25);
let k = 0; for (const x of ix.P) for (const e of x.cl || []) if (e && e[1] === $q.dG) k++;
const kind = s => ({ registry: { en: $q.dJ, es: $q.dK, de: $q.dL, fr: $q.dM, nl: $q.dN, ru: $q.dO, zh: '登记记录', ar: 'سجل' }, independent: { en: $q.dP, es: $q.dQ, de: $q.dR, fr: $q.dS, nl: $q.dT, ru: $q.dU, zh: '独立来源', ar: $q.dV } })[s][l];
const rows = L.map(({ x, c }) => $q.dW + pre(l) + $q.dX + esc(x.s) + $q.dY + esc(x.n) + $q.dZ + esc(x.mk) + (x.dv ? ' · ' + esc(x.dv) : '') + $q.ea +
c.slice(0, 4).map(e => $q.eb + esc(e[0]) + $q.ec + esc(kind(e[2])) + $q.ed + esc(n.fixU(e[3])) + $q.ee + esc(n.host(e[3]) || '') + $q.ef).join('') + $q.eg);
const b = '<p>' + esc(fill(t(l, 'cs_n'), { n: nf(L.length, l), k: nf(k, l) })) + '</p>' + table(t(l, 'cs_th'), rows) + '<p>' + esc(t(l, $q.eh)) + $q.ei + pre(l) + $q.ej + esc(t(l, 'pr_t')) + $q.ek + pre(l) + $q.el + esc(t(l, 'dj_t')) + $q.em;
return page(shell, l, { path: $q.en, h1: t(l, 'cs_t'), lead: t(l, 'cs_l'), body: b, updated: ix.updated || new Date().toISOString().slice(0, 10), crumb: [[t(l, 'pr_t'), pre(l) + $q.di]] });
}
async function djPage(shell, l) {
const b = '<h2>' + esc(t(l, $q.eo)) + $q.aR + t(l, $q.ep).map(([n, p]) => $q.k + (p === $q.eq ? pre(l) + p : p) + '">' + esc(n) + $q.er + esc(p) + $q.es).join('') + '</ul>' +
'<h2>' + esc(t(l, $q.et)) + $q.aR + t(l, $q.eu).map(x => '<li>' + esc(x) + '</li>').join('') + $q.ev + esc(t(l, $q.ew)) + $q.av + esc(t(l, $q.ex)).replace($q.dd, $q.de) + $q.ey + esc(t(l, $q.ez)) + '</p>' +
$q.aw + pre(l) + $q.eA + esc(t(l, 'cs_t')) + $q.ek + pre(l) + $q.ej + esc(t(l, 'pr_t')) + $q.em;
return page(shell, l, { path: $q.eB, h1: t(l, 'dj_t'), lead: t(l, 'dj_l'), body: b, updated: $q.aC, crumb: [[t(l, 'pr_t'), pre(l) + $q.di]] });
}
const json = (o, s, extra) => new Response(JSON.stringify(o, null, 1), { status: s || 200, headers: Object.assign({ 'content-type': $q.eC, 'access-control-allow-origin': '*', 'cache-control': $q.eD }, extra || {}) });
export async function handle(req, u, env, ctx, shell) {
const p = u.pathname; let m;
if (!PATHS.test(p)) return null;
if (!(await loadT(env))) return null;
if (req.method !== 'GET' && req.method !== 'HEAD') return null;
if (p === $q.eE) return new Response(null, { status: 301, headers: { location: $q.eF, 'cache-control': $q.eG } });
if (p === $q.eH) { try { return json(await alerts(env)); } catch (e) { return json({ error: $q.eI }, 503); } }
if (!p.endsWith('/')) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } });
const L = x => x || 'en';
if ((m = R.arch.exec(p))) return archPage(env, shell, L(m[1]));
if ((m = R.mods.exec(p))) return modsPage(env, shell, L(m[1]));
if ((m = R.rb.exec(p))) return rbPage(env, shell, L(m[1]));
if ((m = R.lic.exec(p))) return licPage(env, shell, L(m[1]));
if ((m = R.ck.exec(p))) return ckPage(env, shell, L(m[1]), ctx);
if ((m = R.mt.exec(p))) return mtPage(shell, L(m[1]));
if ((m = R.sc.exec(p))) return scPage(shell, L(m[1]));
if ((m = R.vd.exec(p))) return vdPage(shell, L(m[1]));
if ((m = R.pk.exec(p))) return pkPage(env, shell, m[1]);
if ((m = R.pm.exec(p))) return pmPage(env, shell, m[1]);
if ((m = R.cs.exec(p))) return csPage(env, shell, L(m[1]));
if ((m = R.dj.exec(p))) return djPage(shell, L(m[1]));
return null;
}
