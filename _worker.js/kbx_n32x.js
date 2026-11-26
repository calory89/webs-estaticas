// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_n32x__q, $s = TB.kbx_n32x__s, $t = TB.kbx_n32x__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const V = 'x2';
let T = null;
async function loadT(env) {
if (T) return T;
try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.b)); if (r.ok) T = await r.json(); } catch (e) {}
if (!T) { try { const r = await fetch(ORIGIN + $q.c, { cf: { cacheTtl: 300 } }); if (r.ok) T = await r.json(); } catch (e) {} }
return T;
}
const MEMO = {};
async function file(env, p, ttl) {
  const m = MEMO[p]; if (m && Date.now() - m.t < (ttl || 600000)) return m.v;
  let v = null;
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.d + p)); if (r.ok) v = await r.json(); } catch (e) { v = null; }
  MEMO[p] = { t: Date.now(), v }; return v;
}
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': $q.e, "'": '&#39;' }[c]));
const t = (l, k) => { const a = T && T[l] && T[l][k]; return a != null ? a : T && T.en[k] != null ? T.en[k] : ''; };
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
const nf = (n, l, d) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { maximumFractionDigits: d == null ? 0 : d, numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); } };
const fd = (d, l) => { if (!d) return ''; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { day: $q.f, month: 'short', year: $q.f, timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(String(d).slice(0, 10) + $q.g)); } catch (e) { return String(d).slice(0, 10); } };
const bdi = (l, h) => l === 'ar' ? '<bdi>' + h + $q.h : h;
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const LP = '(?:(es|de|fr|nl|ru|zh|ar)\\/)?';
const F = { sql: 'data\\/sql', cs: 'claims\\/search', an: 'anomalies', gr: 'graph\\/entities', of: 'verify\\/offline', pv: 'engineering\\/provenance', st: 'changes\\/live', wc: 'watch\\/website-changes', eh: 'engineering\\/early-hints', si: 'satellite\\/construction-index' };
const R = {}; for (const k in F) R[k] = new RegExp('^\\/' + LP + F[k] + '\\/?$');
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:data\/sql|claims\/search|anomalies|graph\/entities|verify\/offline|engineering\/(?:provenance|early-hints)|changes\/live|watch\/website-changes|satellite\/construction-index)\/?$|^\/api\/v1\/(?:stream|provenance)$|^\/sql\/?$/;
const ALL = [['sql', '/data/sql/'], ['cs', '/claims/search/'], ['an', '/anomalies/'], ['gr', '/graph/entities/'], ['of', '/verify/offline/'], ['pv', '/engineering/provenance/'], ['st', '/changes/live/'], ['wc', '/watch/website-changes/'], ['eh', '/engineering/early-hints/'], ['si', '/satellite/construction-index/']];
const table = (th, rows) => $q.i + th.map(x => $q.j + esc(x) + '</th>').join('') + $q.k + rows.join('') + $q.l;
const N = () => import('./kbx_named.js');
const rel = (l, skip) => '<h2>' + esc(t(l, 'more')) + $q.m + ALL.filter(x => x[0] !== skip).map(x => $q.n + pre(l) + x[1] + '">' + esc(t(l, x[0] + '_t')) + $q.o).join('') + $q.p + esc(t(l, 'eng')) + $q.q + (X34 ? X34.relLinks(l) : '');
let X34 = null;
const app = (l, k, extra) => $t.k0 + k + $q.r + l + '"' + (extra || '') + $q.s + esc(t(l, 'nojs')) + $t.k1 + JSON.stringify(Object.assign({}, T.en['c_' + k] || {}, (T[l] && T[l]['c_' + k]) || {}, { _l: l, _loc: LOC[l] })).replace(/</g, $q.t) + $q.u + k + $q.v + V + $q.w;
const paras = (l, k) => (t(l, k) || []).map(p => '<p>' + esc(p) + '</p>').join('');
const sec = (h, b) => '<h2>' + esc(h) + '</h2>' + b;
const filesList = (l, fs) => '<ul>' + fs.map(f => $q.n + esc(f[0]) + '"' + (l === 'ar' ? $q.x : '') + '>' + esc(f[0]) + '</a>' + (f[1] ? $q.y + esc(f[1]) + $q.z : '') + '</li>').join('') + '</ul>';
async function page(shell, l, o) {
  const n = await N(), canon = ORIGIN + pre(l) + o.path;
  const crumbs = [[t(l, 'home'), pre(l) + '/']].concat(o.crumb || []).concat([[o.h1, null]]);
  const body = $q.A + (l === 'ar' ? $q.B : '') + $q.C + crumbs.map(c => c[1] ? $q.D + esc(c[1]) + '">' + esc(c[0]) + '</a>' : esc(c[0])).join(' / ') + $q.E + esc(o.h1) + $q.F + esc(o.lead) + '</p>' +
    (o.updated ? $q.G + esc(fill(t(l, 'upd'), { d: fd(o.updated, l) })) + '</p>' : '') + $q.H + (l === 'ar' ? $q.B : '') + '>' + $q.a + o.body + rel(l, o.k) + $q.I;
  const ld = { '@context': $q.J, '@graph': [{ '@type': o.type || $q.K, url: canon, name: o.h1, description: o.lead, inLanguage: l, dateModified: o.updated || $q.L, isPartOf: { '@type': $q.M, name: $q.N, url: ORIGIN + '/' } },
    { '@type': $q.O, itemListElement: crumbs.map((c, i) => ({ '@type': $q.P, position: i + 1, name: c[0], item: c[1] ? ORIGIN + c[1] : canon })) }].concat(o.ld || []) };
  const desc = o.lead.length > 155 ? o.lead.slice(0, 152).replace(/\s+\S*$/, '') + '…' : o.lead;
  const html = await n.assemble({ title: (o.h1.length > 46 ? o.h1.slice(0, 46).replace(/\s+\S*$/, '') : o.h1) + $q.Q, desc, canon, body, ld, alt: x => ORIGIN + pre(x) + o.path }, l, await shell(pre(l) + $q.R));
  const h = { 'content-type': $q.S, 'cache-control': $q.T + (o.maxAge || 900), 'content-language': l };
  if (o.preload) h.link = o.preload;
  return new Response(html, { status: 200, headers: h });
}
const H = (l, k) => ({ h1: t(l, k + '_t'), lead: t(l, k + '_l'), k });
async function sqlPage(env, shell, l) {
const c = await file(env, $q.U); if (!c) return null;
const rows = c.files.map(f => $q.V + esc(f.table) + $q.W + bdi(l, nf(f.rows, l)) + $q.X + f.columns.length + $q.Y + f.parquet.path + $q.Z + bdi(l, nf(f.parquet.bytes / 1024, l) + ' KB') + $q.aa + f.csv.path + $q.ab + bdi(l, nf(f.csv.bytes / 1024, l) + ' KB') + $t.k2 + esc(f.parquet.sha256.slice(0, 16)) + $q.ac);
const b = $q.ad + esc(c.version) + '</b>' + esc(t(l, $q.ae)) + $q.af + bdi(l, nf(c.files[0].rows, l)) + '</b>' + esc(t(l, $q.ag)) + $q.af + bdi(l, nf(c.files[1].rows, l)) + '</b>' + esc(t(l, $q.ah)) + $q.af + bdi(l, nf(c.files[2].rows, l)) + '</b>' + esc(t(l, $q.ai)) + $q.aj +
app(l, 'sql') + sec(t(l, $q.ak), '<p>' + esc(fill(t(l, $q.al), { d: fd(c.source.published, l), h: c.source.sha256.slice(0, 16) })) + $q.am + pre(l) + $t.k3 +
table(t(l, $q.an), rows) + paras(l, 'sql_p') + $s.k0 + esc(c.licence) + '</p>');
return page(shell, l, Object.assign(H(l, 'sql'), { path: $q.ao, body: b, updated: c.built, crumb: [[t(l, 'data'), $q.ap]], 
ld: [{ '@type': $q.aq, name: c.name, description: c.what_it_is, version: c.version, license: $t.k4, creator: { '@type': $q.ar, name: $q.N, url: ORIGIN + '/' }, dateModified: c.built,
distribution: c.files.flatMap(f => [{ '@type': $q.as, encodingFormat: $q.at, contentUrl: ORIGIN + f.parquet.path }, { '@type': $q.as, encodingFormat: $q.au, contentUrl: ORIGIN + f.csv.path }]) }] }));
}
async function csPage(env, shell, l) {
const c = await file(env, $q.U);
const b = app(l, 'cs', $q.av + (c ? c.files[1].rows : '') + '"') + sec(t(l, $q.aw), paras(l, 'cs_p')) + filesList(l, [[$q.ax, t(l, 'cs_f')], [$q.ay, 'CSV']]);
return page(shell, l, Object.assign(H(l, 'cs'), { path: $q.az, body: b, updated: c && c.built }));
}
const AR = ['ppm', 'moved', 'register_date', 'stage', 'size', 'units'];
function anNums(l, a) {
const x = a.x, f = v => bdi(l, esc(typeof v === $q.aA ? nf(v, l, 1) : v));
const k = a.r === 'size' ? $q.aB + x.why : a.r === 'stage' ? (x.pct >= 95 ? $q.aC : $q.aD) : 'an_x_' + a.r;
return fill(esc(t(l, k)), Object.fromEntries(Object.entries(x).map(([kk, v]) => [kk, f(v)])));
}
async function anPage(env, shell, l, u) {
const d = await file(env, $q.aE); if (!d) return null;
const only = AR.includes(u.searchParams.get('r')) ? u.searchParams.get('r') : null;
const by = {}; for (const a of d.items) (by[a.r] = by[a.r] || []).push(a);
const nav = '<p>' + AR.map(r => $q.aF + r + '">' + esc(t(l, 'an_r_' + r)) + $q.aG + nf(d.counts[r] || 0, l) + $q.aH).join(' · ') + '</p>';
const secs = AR.filter(r => !only || r === only).map(r => $q.aI + r + '">' + esc(t(l, 'an_r_' + r)) + $q.y + nf((by[r] || []).length, l) + $q.aJ + esc(fill(t(l, 'an_d_' + r), Object.assign({}, d.rules[r] || {}))) + '</p>' +
((by[r] || []).length ? table(t(l, 'an_th'), (by[r] || []).map(a => $q.aK + pre(l) + $q.aL + esc(a.s) + '/">' + esc(a.n) + $q.aM + esc(a.mk) + $q.aN + anNums(l, a) + $q.aN + (a.src ? $q.D + esc(a.src) + $t.k5 + esc(hostOf(a.src)) + '</a>' : '') + $q.X + esc(fd(a.d, l)) + $q.aO)) : $q.aP + esc(t(l, $q.aQ)) + '</p>')).join('');
const b = $q.aR + esc(t(l, 'an_nv')) + $q.aS + nf(d.items.length, l) + '</b>' + esc(t(l, $q.aT)) + $q.af + nf(d.projects_read, l) + '</b>' + esc(t(l, $q.aU)) + $q.aj + nav + secs +
sec(t(l, $q.aw), paras(l, 'an_p') + '<p>' + esc(fill(t(l, $q.aV), { d: fd(d.source.published, l), h: d.source.sha256.slice(0, 16) })) + '</p>') + filesList(l, [[$q.aE, 'JSON'], [$q.aW, $q.aX]]) +
$q.aY + pre(l) + $q.aZ + esc(t(l, $q.ba)) + $q.bb;
return page(shell, l, Object.assign(H(l, 'an'), { path: $q.bc, body: b, updated: d.built }));
}
async function grPage(env, shell, l) {
const d = await file(env, $q.bd, 3600000); if (!d) return null;
const k = d.counts, ty = t(l, 'gr_ty');
const b = $q.be + ['p', 'd', 'c', 'b', 'm'].map(x => $q.bf + nf(k[x] || 0, l) + '</b>' + esc(ty[x]) + $q.I).join('') + $q.bf + nf(d.edges_n, l) + '</b>' + esc(t(l, 'gr_e')) + $q.aj + app(l, 'gr') +
sec(t(l, $q.aw), paras(l, 'gr_p')) + filesList(l, [[$q.bd, 'JSON'], [$q.bg, t(l, $q.bh)]]);
return page(shell, l, Object.assign(H(l, 'gr'), { path: $q.bi, body: b, updated: d.built }));
}
async function ofPage(env, shell, l) {
const cmd = T.en.of_cmd.map((x, i) => [(t(l, 'of_cd') || [])[i] || x[0], x[1]]);
const b = paras(l, 'of_p') + '<h2>' + esc(t(l, 'of_dl')) + '</h2>' + filesList(l, [[$q.bj, $q.bk], [$q.bl, $q.bm]]) +
'<h2>' + esc(t(l, $q.bn)) + '</h2>' + cmd.map(x => '<p>' + esc(x[0]) + $q.bo + esc(x[1]) + $q.bp).join('') +
sec(t(l, $q.bq), '<ul>' + t(l, $q.br).map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>') + $q.aY + pre(l) + $s.k1;
return page(shell, l, Object.assign(H(l, 'of'), { path: $q.bs, body: b, updated: $q.L, crumb: [[t(l, $q.bt), $q.bu]], type: $q.bv }));
}
let PV = null;
async function provenance(env) {
const commit = (env && env.CF_PAGES_COMMIT_SHA) || null;
if (PV && PV.commit === commit && Date.now() - PV.t < 600000) return PV.v;
const [hist, dep, B] = await Promise.all([file(env, $q.bw, 3600000), file(env, $q.bx, 300000), import('./kbx_n30b.js')]);
let ch = null; try { ch = await B.chain(env); } catch (e) { ch = null; }
const H0 = (hist && hist.history) || [], D0 = (dep && dep.deploys) || [];
const fromHist = H0.find(x => x.commit === commit), fromDep = D0.find(x => x.commit === commit);
const att = { type: $q.by, site: ORIGIN + '/', commit, branch: (env && env.CF_PAGES_BRANCH) || null,
worker_tree: (fromDep && fromDep.worker_tree) || (fromHist && fromHist.worker_tree) || null, worker_bytes: (fromHist && fromHist.worker_bytes) || null,
dataset: { file: $q.bz, sha256: ch ? ch.live.sha256 : null, bytes: ch ? ch.live.bytes : null, snapshot_chain_tip: ch ? ch.chain_tip : null },
live_seen_by_guard: (fromDep && fromDep.at) || null, smoke_checks: fromDep ? [fromDep.checks_passed, fromDep.checks_total] : null,
latest_recorded_deploy: (() => { const x = D0.find(y => y.commit && (y.worker_tree || (H0.find(z => z.commit === y.commit) || {}).worker_tree)); if (!x || x.commit === commit) return null; const hh = H0.find(z => z.commit === x.commit) || {}; return { commit: x.commit, live_seen: x.at, worker_tree: x.worker_tree || hh.worker_tree, note: $s.k2 }; })(),
attested_at: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
meaning: $s.k3 };
let signature = null;
try { const K = await import('./kolaboro.js'), msgHash = await shaHex(B.canon(att)); const s = await K.signBody(env, B.canon(att)); if (s) signature = { alg: $q.bA, kid: (env && env.KB_SIGN_KID) || 'kb', value: s, message: $s.k4, attestation_sha256: msgHash }; } catch (e) {}
const merged = D0.filter(x => x.commit).slice(0, 60).map(x => { const h = H0.find(y => y.commit === x.commit) || {}; return { commit: x.commit, live_seen: x.at, result: x.result, smoke: [x.checks_passed, x.checks_total], worker_tree: x.worker_tree || h.worker_tree || null, worker_bytes: h.worker_bytes || null, dataset_sha256: x.dataset_sha256 || h.dataset_sha256 || null }; });
const v = { attestation: att, signature, history: merged, history_file: $q.bw, verify: ORIGIN + $q.bs };
PV = { commit, t: Date.now(), v }; return v;
}
async function shaHex(s) { const b = new Uint8Array(await crypto.subtle.digest($q.bB, new TextEncoder().encode(s))); return [...b].map(x => x.toString(16).padStart(2, '0')).join(''); }
async function pvPage(env, shell, l) {
const p = await provenance(env), a = p.attestation, s = p.signature;
const sh = x => x ? $q.bC + esc(String(x).slice(0, 12)) + $q.bD : $q.bE + esc(t(l, 'pv_na')) + $q.z;
const kv = t(l, 'pv_kv');
const cur = table([kv[0], kv[1]], [[kv[2], sh(a.commit)], [kv[3], a.worker_tree ? sh(a.worker_tree) : sh(null) + (a.latest_recorded_deploy ? $q.y + esc(fill(t(l, $q.bF), { c: a.latest_recorded_deploy.commit.slice(0, 12), w: String(a.latest_recorded_deploy.worker_tree).slice(0, 12) })) + $q.z : '')], [kv[4], a.worker_bytes ? bdi(l, nf(a.worker_bytes / 1048576, l, 2) + ' MiB') : sh(null)], [kv[5], sh(a.dataset.sha256)], [kv[6], sh(a.dataset.snapshot_chain_tip)], [kv[7], a.live_seen_by_guard ? esc(a.live_seen_by_guard.replace('T', ' ').slice(0, 16)) + ' UTC' : sh(null)], [kv[8], esc(a.attested_at.replace('T', ' ').slice(0, 16)) + ' UTC'], [kv[9], s ? $t.k6 + esc(s.kid) + $q.bD : $q.bE + esc(t(l, $q.bG)) + $q.z]].map(r => $q.bH + esc(r[0]) + $q.bI + r[1] + $q.aO));
const hist = table(t(l, 'pv_th'), p.history.slice(0, 40).map(x => $q.bJ + esc((x.live_seen || '').replace('T', ' ').slice(0, 16)) + $q.aN + sh(x.commit) + $q.aN + esc(t(l, 'pv_r')[x.result] || x.result || '') + (x.smoke && x.smoke[1] ? $q.y + x.smoke[0] + '/' + x.smoke[1] + $q.z : '') + $q.aN + sh(x.worker_tree) + $q.X + (x.worker_bytes ? bdi(l, nf(x.worker_bytes / 1048576, l, 2)) : '') + $q.aN + sh(x.dataset_sha256) + $q.aO));
const b = sec(t(l, $q.bK), cur) + $t.k7 + pre(l) + $q.bL + esc(t(l, 'of_t')) + $q.bb + sec(t(l, $q.bM), hist) + sec(t(l, $q.aw), paras(l, 'pv_p')) + filesList(l, [[$q.bw, 'JSON'], [$q.bx, 'JSON'], [$q.bN, $q.aX]]);
return page(shell, l, Object.assign(H(l, 'pv'), { path: $q.bO, body: b, updated: $q.L, crumb: [[t(l, 'eng'), $q.bP]], maxAge: 300 }));
}
const sse = (id, ev, data) => (id ? 'id: ' + id + '\n' : '') + (ev ? $q.bQ + ev + '\n' : '') + $q.bR + JSON.stringify(data) + '\n\n';
async function stream(req, u, env, ctx) {
const B = await import('./kbx_n30b.js'); let C;
try { C = await B.allChanges(env); } catch (e) { return new Response($q.bS, { status: 503, headers: { 'content-type': $q.bT } }); }
const E = C.E, q = u.searchParams, last = req.headers.get($q.bU) || q.get('last') || '';
const n = Math.max(1, Math.min(200, parseInt(q.get('n') || '50', 10) || 50));
let start = E.length - n;
if (last) { const i = E.findIndex(x => x.id + '@' + x.at === last); start = i >= 0 ? i + 1 : start; }
const rep = E.slice(Math.max(0, start)).map(x => sse(x.id + '@' + x.at, $q.bV, { id: x.id, at: x.at, kind: x.kind, project: x.project, title: x.title, text: x.text, source: x.source, url: x.url }));
const ts = new TransformStream(), w = ts.writable.getWriter(), en = new TextEncoder(), commit = (env && env.CF_PAGES_COMMIT_SHA) || '';
const hold = Math.max(5, Math.min(55, parseInt(q.get('hold') || '50', 10) || 50)) * 1000;
ctx.waitUntil((async () => {
try {
await w.write(en.encode($q.bW + sse(null, 'hello', { api: $q.bX, commit, total: E.length, replayed: rep.length, last_change_at: C.last, hold_s: hold / 1000, docs: ORIGIN + $q.bY }) + rep.join('')));
const t0 = Date.now();
while (Date.now() - t0 < hold) {
await new Promise(r => setTimeout(r, Math.max(1000, Math.min(15000, hold - (Date.now() - t0)))));
let live = ''; try { const r = await fetch(ORIGIN + $q.bZ, { cf: { cacheTtl: 15 } }); if (r.ok) live = String((await r.json()).commit || ''); } catch (e) {}
await w.write(en.encode(live && commit && live !== commit ? sse(null, $q.ca, { commit: live, note: $t.k8 }) : $q.cb + new Date().toISOString() + '\n\n'));
if (live && commit && live !== commit) break;
}
await w.write(en.encode(sse(null, 'bye', { reconnect_ms: 15000, last_id: E.length ? E[E.length - 1].id + '@' + E[E.length - 1].at : null })));
} catch (e) {}
try { await w.close(); } catch (e) {}
})());
return new Response(ts.readable, { headers: { 'content-type': $q.cc, 'cache-control': $q.cd, 'access-control-allow-origin': '*', 'x-accel-buffering': 'no' } });
}
async function stPage(env, shell, l) {
const b = app(l, 'st') + sec(t(l, $q.ce), paras(l, 'st_p') + $s.k5) +
$s.k6 + pre(l) + $q.cf + esc(t(l, $q.cg)) + $q.bb;
return page(shell, l, Object.assign(H(l, 'st'), { path: $q.bY, body: b, updated: $q.L }));
}
async function wcPage(env, shell, l, u) {
const d = await file(env, $q.ch, 3600000); if (!d) return null;
const KN = t(l, 'wc_k'), dv = (u.searchParams.get('dv') || '').replace(/[^a-z0-9-]/g, '');
const rows = d.items.map((x, i) => dv && x.dvs !== dv ? '' : $q.ci + esc(x.s) + $q.cj + (i + 1) + $q.ck + pre(l) + $q.aL + esc(x.s) + '/">' + esc(x.n) + $q.cl + (x.dvs ? $q.D + pre(l) + $q.cm + esc(x.dvs) + '/">' + esc(x.dv) + $q.cn : '') + esc(x.mk) + $q.co + Object.entries(x.kinds).map(([k, v]) => esc(KN[k] || k) + ' ' + v).join(', ') + $q.X + esc(fd(x.a.d, l)) + ' → ' + esc(fd(x.b.d, l)) + $t.k9 + i + '">' + esc(t(l, $q.cp)) + $q.cq + pre(l) + $q.aL + esc(x.s) + $q.cr + x.a.sha + $q.cs + x.b.sha + '">' + esc(t(l, $q.ct)) + '</a>' +
(x.wb ? $t.k10 + esc(x.wb[0]) + '/' + esc(x.url) + $t.k11 + esc(x.wb[0].slice(0, 4)) + $t.k12 + esc(x.wb[1]) + '/' + esc(x.url) + $t.k13 + esc(x.wb[1].slice(0, 4)) + '</a>' : '') + $q.aO);
const b = $q.ad + nf(d.pages_with_two_versions, l) + '</b>' + esc(t(l, $q.cu)) + $q.af + nf(d.pages_with_kept_changes, l) + '</b>' + esc(t(l, $q.cv)) + $q.af + nf(d.listed, l) + '</b>' + esc(t(l, $q.cw)) + $q.aj +
$q.aR + esc(t(l, 'wc_nv')) + $q.cx + app(l, 'wc') + table(t(l, 'wc_th'), rows) + sec(t(l, $q.aw), paras(l, 'wc_p')) + filesList(l, [[$q.ch, 'JSON'], [$q.cy, $q.cz]]);
return page(shell, l, Object.assign(H(l, 'wc'), { path: $q.cA, body: b, updated: d.built }));
}
async function ehPage(env, shell, l) {
const d = await file(env, $q.cB, 3600000);
const NM = t(l, 'eh_nm'), rows = d ? d.templates.map((x, i) => $q.aK + (x.path === '/' ? pre(l) + '/' : /^\/(projects|developers|m)\//.test(x.path) ? pre(l) + x.path : esc(x.path)) + '">' + esc(NM[i] || x.name) + $q.cC + bdi(l, nf(x.before.lcp_ms, l) + ' ms') + $q.X + bdi(l, nf(x.after.lcp_ms, l) + ' ms') + $q.X + bdi(l, (x.after.lcp_ms - x.before.lcp_ms > 0 ? '+' : '') + nf(x.after.lcp_ms - x.before.lcp_ms, l) + ' ms') + $q.X + nf(x.runs, l) + $q.aN + esc(x.lcp_element || '') + $q.aO) : [];
const b = paras(l, 'eh_p') + (d ? $q.cD + esc(d.example_header) + $q.bp + sec(t(l, $q.cE), table(t(l, 'eh_th'), rows) + $q.G + esc(fill(t(l, $q.cF), { d: fd(d.measured, l), tool: d.tool })) + '</p>' + (d.h103 != null ? '<p>' + esc(t(l, d.h103 ? $q.cG : $q.cH)) + '</p>' : '')) : '') +
sec(t(l, $q.cI), paras(l, $q.cJ)) + filesList(l, [[$q.cB, 'JSON']]);
return page(shell, l, Object.assign(H(l, 'eh'), { path: $q.cK, body: b, updated: d ? d.measured : $q.L, crumb: [[t(l, 'eng'), $q.bP]] }));
}
async function siPage(env, shell, l) {
const d = await file(env, $q.cL, 3600000); if (!d) return null;
const c = d.counts, NT = t(l, 'si_nt');
const spark = x => { const v = x.sm, n = v.length, W = 120, Hh = 28; let p = '', go = 0; v.forEach((y, i) => { if (y == null) { go = 0; return; } const X = Math.round(i / (n - 1) * W), Y = Math.round(Hh / 2 - Math.max(-50, Math.min(50, y)) / 100 * Hh); p += (go ? 'L' : 'M') + X + ' ' + Y; go = 1; }); return $q.cM + W + ' ' + Hh + $q.cN + W + $q.cO + Hh + $t.k14 + W + $q.cP + Hh / 2 + $q.cQ + Hh / 2 + $t.k15 + p + $t.k16; };
const rows = d.projects.map((x, i) => $q.cR + esc(x.s) + $q.cS + pre(l) + $q.aL + esc(x.s) + '/">' + esc(x.n) + $q.cl + esc(x.mk) + ' · ' + esc(x.st || '') + $q.co + spark(x) + $q.X + (x.prev12 == null ? '' : bdi(l, nf(x.prev12, l))) + ' → ' + (x.last12 == null ? '' : bdi(l, nf(x.last12, l))) + $q.aN + esc(x.up || '') + $q.aN + (x.note ? esc(NT[x.note]) : '') + $t.k17 + i + '">' + esc(t(l, $q.cT)) + $q.cU);
const b = $q.aR + esc(t(l, 'si_nv')) + $q.aS + nf(c.projects, l) + '</b>' + esc(t(l, 'si_n')) + $q.af + nf(c.visible_change, l) + '</b>' + esc(t(l, $q.cV)) + $q.af + nf(c.rising, l) + '</b>' + esc(NT.rising) + $q.af + nf(c.flat, l) + '</b>' + esc(NT.flat) + $q.aj +
app(l, 'si') + table(t(l, 'si_th'), rows) + sec(t(l, $q.aw), paras(l, 'si_p')) + sec(t(l, $q.cI), paras(l, $q.cW)) + $q.G + esc(d.source) + '</p>' + filesList(l, [[$q.cL, 'JSON'], [$q.cX, 'JSON']]);
return page(shell, l, Object.assign(H(l, 'si'), { path: $q.cY, body: b, updated: d.built, crumb: [[t(l, 'sat'), $q.cZ]] }));
}
const json = (o, extra) => new Response(JSON.stringify(o, null, 1), { headers: Object.assign({ 'content-type': $q.da, 'access-control-allow-origin': '*', 'cache-control': $q.db }, extra || {}) });
export async function handle(req, u, env, ctx, shell) {
const p = u.pathname; let m;
if (!PATHS.test(p) || (req.method !== 'GET' && req.method !== 'HEAD')) return null;
if (/^\/sql\/?$/.test(p)) return new Response(null, { status: 301, headers: { location: $q.ao + u.search, 'cache-control': $q.dc } });
if (p === $q.dd) return stream(req, u, env, ctx);
if (p === $q.de) { try { return json(await provenance(env)); } catch (e) { return json({ error: $q.df }); } }
if (!(await loadT(env))) return null;
try { if (!X34) { const m = await import('./kbx_n34c.js'); if (await m.ready(env)) X34 = m; } } catch (e) {}
if (!p.endsWith('/')) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } });
const L = x => x || 'en';
if ((m = R.sql.exec(p))) return sqlPage(env, shell, L(m[1]));
if ((m = R.cs.exec(p))) return csPage(env, shell, L(m[1]));
if ((m = R.an.exec(p))) return anPage(env, shell, L(m[1]), u);
if ((m = R.gr.exec(p))) return grPage(env, shell, L(m[1]));
if ((m = R.of.exec(p))) return ofPage(env, shell, L(m[1]));
if ((m = R.pv.exec(p))) return pvPage(env, shell, L(m[1]));
if ((m = R.st.exec(p))) return stPage(env, shell, L(m[1]));
if ((m = R.wc.exec(p))) return wcPage(env, shell, L(m[1]), u);
if ((m = R.eh.exec(p))) return ehPage(env, shell, L(m[1]));
if ((m = R.si.exec(p))) return siPage(env, shell, L(m[1]));
return null;
}
