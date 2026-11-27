// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_n34a__q, $s = TB.kbx_n34a__s, $t = TB.kbx_n34a__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { TB } from './kbx_strings.js';
const ORIGIN = 'https://kolaboro.com';
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const V = 'a1';
let T = null, TP = null;
async function loadT(env) { return T || TP || (TP = loadT0(env).finally(() => { TP = null; })); }
export const warm = env => loadT(env).then(() => file(env, $q.aL, 3600000)).catch(() => {});   // n40 k57
async function loadT0(env) {
if (T) return T;
try { const r = await env.ASSETS.fetch(new Request(ORIGIN + $q.b)); if (r.ok) T = await r.json(); } catch (e) {}
if (!T) { try { const r = await fetch(ORIGIN + $q.c, { cf: { cacheTtl: 300 } }); if (r.ok) T = await r.json(); } catch (e) {} }
return T;
}
const MEMO = {};
function file(e, p, t) { return FQ[p] || (FQ[p] = file0(e, p, t).finally(() => { delete FQ[p]; })); }   // n40 k21: one shared read per file
const FQ = {};
async function file0(env, p, ttl) {
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
const slugM = m => String(m).toLowerCase().replace(/\s+/g, '-');
const LP = '(?:(es|de|fr|nl|ru|zh|ar)\\/)?';
const F = { tr: 'track-record', sh: 'sources\\/health', ev: 'claims\\/evidence', rc: 'registers\\/changes', du: 'watch\\/duplicates', iv: 'numbers\\/intervals', rp: 'engineering\\/reproducible', hi: 'data\\/history', pi: 'engineering\\/data-quality\\/pins', fm: 'data\\/formats' };
const R = {}; for (const k in F) R[k] = new RegExp('^\\/' + LP + F[k] + '\\/?$');
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:track-record|sources\/health|claims\/evidence|registers\/changes|watch\/duplicates|numbers\/intervals|engineering\/reproducible|data\/history|engineering\/data-quality\/pins|data\/formats)\/?$|^\/api\/v1\/projects\/[A-Za-z0-9-]{1,90}\/(?:history|evidence)$|^\/api\/v1\/developers\/[a-z0-9-]{1,90}\/track-record$/;
export const INJECT = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:numbers|delays|m\/[^/.]{2,60}|developers\/[a-z0-9-]{1,90}|projects\/[a-z0-9-]{1,90}|engineering|yc|data|engineering\/data-quality|registers)\/$/;
const ALL = [['tr', '/track-record/'], ['sh', '/sources/health/'], ['ev', '/claims/evidence/'], ['rc', '/registers/changes/'], ['du', '/watch/duplicates/'], ['iv', '/numbers/intervals/'], ['rp', '/engineering/reproducible/'], ['hi', '/data/history/'], ['pi', '/engineering/data-quality/pins/'], ['fm', '/data/formats/']];
const table = (th, rows) => $q.i + th.map(x => $q.j + esc(x) + '</th>').join('') + $q.k + rows.join('') + $q.l;
const N = () => import('./kbx_named.js');
const rel = (l, skip) => '<h2>' + esc(t(l, 'more')) + $q.m + ALL.filter(x => x[0] !== skip).map(x => $q.n + pre(l) + x[1] + '">' + esc(t(l, x[0] + '_t')) + $q.o).join('') + $q.p + esc(t(l, 'eng')) + $q.q;
const paras = (l, k) => (t(l, k) || []).map(p => '<p>' + esc(p) + '</p>').join('');
const sec = (h, b, id) => '<h2' + (id ? ' id="' + id + '"' : '') + '>' + esc(h) + '</h2>' + b;
const filesList = (l, fs) => '<ul>' + fs.map(f => $q.n + esc(f[0]) + '"' + (l === 'ar' ? $q.r : '') + '>' + esc(f[0]) + '</a>' + (f[1] ? $q.s + esc(f[1]) + $q.t : '') + '</li>').join('') + '</ul>';
const kpis = xs => $q.u + xs.map(x => $q.v + x[0] + '</b>' + esc(x[1]) + $q.w).join('') + $q.w;
const pUrl = (l, s) => pre(l) + $q.x + s + '/';
const ext = u => $q.y + esc(u) + $t.k0 + esc(hostOf(u)) + '</a>';
async function page(shell, l, o) {
  const n = await N(), canon = ORIGIN + pre(l) + o.path;
  const crumbs = [[t(l, 'home'), pre(l) + '/']].concat(o.crumb || []).concat([[o.h1, null]]);
  const body = $q.z + (l === 'ar' ? $q.A : '') + $q.B + crumbs.map(c => c[1] ? $q.y + esc(c[1]) + '">' + esc(c[0]) + '</a>' : esc(c[0])).join(' / ') + $q.C + esc(o.h1) + $q.D + esc(o.lead) + '</p>' +
    (o.updated ? $q.E + esc(fill(t(l, 'upd'), { d: fd(o.updated, l) })) + '</p>' : '') + $q.F + (l === 'ar' ? $q.A : '') + '>' + $q.a + o.body + rel(l, o.k) + $q.w;
  const ld = { '@context': $q.G, '@graph': [{ '@type': o.type || $q.H, url: canon, name: o.h1, description: o.lead, inLanguage: l, dateModified: o.updated || $q.I, isPartOf: { '@type': $q.J, name: $q.K, url: ORIGIN + '/' } },
    { '@type': $q.L, itemListElement: crumbs.map((c, i) => ({ '@type': $q.M, position: i + 1, name: c[0], item: c[1] ? ORIGIN + c[1] : canon })) }].concat(o.ld || []) };
  const desc = o.lead.length > 155 ? o.lead.slice(0, 152).replace(/\s+\S*$/, '') + '…' : o.lead;
  const html = await n.assemble({ title: (o.h1.length > 46 ? o.h1.slice(0, 46).replace(/\s+\S*$/, '') : o.h1) + $q.N, desc, canon, body, ld, alt: x => ORIGIN + pre(x) + o.path }, l, await shell(pre(l) + $q.O));
  const h = { 'content-type': $q.P, 'cache-control': $q.Q + (o.maxAge || 900), 'content-language': l };
  if (o.noindex) h[$q.R] = $q.S;
  return new Response(html, { status: 200, headers: h });
}
const H = (l, k) => ({ h1: t(l, k + '_t'), lead: t(l, k + '_l'), k });
const json = (o, st, extra) => new Response(JSON.stringify(o), { status: st || 200, headers: Object.assign({ 'content-type': $q.T, 'access-control-allow-origin': '*', 'cache-control': $q.U, 'x-robots-tag': $q.V }, extra || {}) });
const CRC = (() => { const a = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; a[n] = c >>> 0; } return a; })();
const crc32 = s => { let c = 0xFFFFFFFF; for (const b of new TextEncoder().encode(s)) c = CRC[(c ^ b) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
async function resolve(env, key) {
const ix = await file(env, $q.W, 3600000); if (!ix) return null;
if (/^[A-Z]{2,5}-\d{1,4}$/.test(key)) return Object.values(ix.slugs).includes(key) ? { id: key, slug: Object.keys(ix.slugs).find(s => ix.slugs[s] === key) } : null;
return ix.slugs[key] ? { id: ix.slugs[key], slug: key } : null;
}
async function versions(env, id) {
const sh = await file(env, $q.X + String(crc32(id) % 32).padStart(2, '0') + '.json', 3600000);
return sh && sh.p ? sh.p[id] || null : null;
}
function apply(base, ops) {
const o = JSON.parse(JSON.stringify(base));
const seg = p => p.split('/').slice(1).map(x => x.replace(/~1/g, '/').replace(/~0/g, '~'));
for (const op of ops) {
const s = seg(op.path); if (!s.length || op.path === '/') return op.value;
let c = o; for (let i = 0; i < s.length - 1; i++) { if (c[s[i]] == null) c[s[i]] = {}; c = c[s[i]]; }
const k = s[s.length - 1];
if (op.op === $q.Y) { if (Array.isArray(c)) c.splice(+k, 1); else delete c[k]; }
else if (op.op === 'add' && Array.isArray(c) && k === '-') c.push(op.value);
else c[k] = op.value;
}
return o;
}
async function historyApi(env, u, key) {
const r = await resolve(env, key); if (!r) return json({ error: $q.Z, id: key }, 404);
const vs = await versions(env, r.id); if (!vs) return json({ error: $q.Z, id: key }, 404);
const ix = await file(env, $q.W, 3600000);
const full = u.searchParams.get('full') === '1';
let cur = null;
const out = vs.map((v, i) => { cur = i ? apply(cur, v.ops) : v.base; const o = { version: i + 1, date: v.d, record_sha256: v.sha, snapshot_sha256: v.file, changes: i ? v.ops : null }; if (full || i === vs.length - 1) o.record = cur; return o; });
return json({ api: $q.aa, id: r.id, slug: r.slug, page: ORIGIN + $q.x + r.slug + '/', versions_n: out.length, diff: ix.diff, record_hash: ix.record_hash, snapshots: ORIGIN + $q.ab,
note: $s.k0, licence: $t.k1, versions: out });
}
async function evidenceApi(env, key) {
const r = await resolve(env, key); if (!r) return json({ error: $q.Z, id: key }, 404);
const [e, vs] = await Promise.all([file(env, $q.ac, 3600000), versions(env, r.id)]);
if (!vs) return json({ error: $q.Z, id: key }, 404);
let cur = null; for (let i = 0; i < vs.length; i++) cur = i ? apply(cur, vs[i].ops) : vs[i].base;
const ev = ((e && e.p) || {})[r.slug] || [], by = new Map(ev.map(x => [x[0], x]));
return json({ api: $q.ad, id: r.id, slug: r.slug, method: e ? e.method : null, read: e ? e.updated : null,
claims: (cur.cl || []).map((c, i) => { const x = by.get(i); return { n: i, claim: c[0], status: c[1], checked_against: c[2], source: c[3] || null, passage: x && x[1] ? x[1] : null, match_share: x ? x[2] : null, read: x ? x[3] : null }; }) });
}
const TR_COLS = [['p', 1], ['ho', 2], ['past', 3], ['mv', 9], ['pn', 5]];
const TR_COL = { p: '#59626B', ho: '#2563EB', past: '#B42318', mv: '#B54708', pn: '#0B7A55' };
function trChart(l, d) {
const W = 640, Hh = 190, L0 = 34, B0 = 26, n = d.days.length, mx = Math.max(1, ...d.days.map(r => r[1]));
const x = i => L0 + (n === 1 ? (W - L0 - 10) / 2 : i * (W - L0 - 10) / (n - 1)), y = v => Hh - B0 - v / mx * (Hh - B0 - 12);
const lab = t(l, 'tr_s');
let s = $q.ae + W + ' ' + Hh + $q.af + W + $q.ag + Hh + $q.ah + esc(fill(t(l, $q.ai), { n: d.n })) + $t.k2;
s += $q.aj + L0 + $q.ak + y(0) + $q.al + (W - 10) + $q.am + y(0) + $t.k3 + (L0 - 4) + '" y="' + (y(mx) + 4) + $q.an + mx + $q.ao + (L0 - 4) + '" y="' + (y(0) + 4) + $q.ap;
[0, n - 1].forEach(i => { s += $q.aq + x(i) + '" y="' + (Hh - 8) + $q.ar + (i ? 'end' : 'start') + '">' + esc(fd(d.days[i][0], l)) + $q.as; });
for (const [k, j] of TR_COLS) s += $q.at + TR_COL[k] + $q.au + d.days.map((r, i) => x(i).toFixed(1) + ',' + y(r[j] || 0).toFixed(1)).join(' ') + '"/>';
s += $q.av + TR_COLS.map(([k]) => $q.aw + TR_COL[k] + $q.ax + esc(lab[k])).join(' · ') + '</p>';
return s;
}
function trTable(l, d) {
const lab = t(l, 'tr_s');
return $q.ay + esc(t(l, $q.az)) + $q.aA + table([t(l, 'date')].concat(TR_COLS.map(([k]) => lab[k])).concat([lab.cv, lab.cx]), d.days.map(r => $q.aB + esc(fd(r[0], l)) + '</td>' + TR_COLS.map(([, j]) => $q.aC + bdi(l, nf(r[j] || 0, l)) + '</td>').join('') + $q.aC + nf(r[6], l) + $q.aD + nf(r[7], l) + $q.aE)) + $q.aF;
}
function trEvents(l, d, max) {
const ev = d.ev.filter(e => e[1] !== 'add').slice(-max).reverse(), lab = t(l, 'tr_e');
if (!ev.length) return $q.aG + esc(t(l, $q.aH)) + '</p>';
return '<ul>' + ev.map(e => $q.aI + esc(fd(e[0], l)) + $q.aJ + esc(lab[e[1]] || e[1]) + $q.aK + pUrl(l, e[2]) + '">' + esc(e[2]) + '</a>' + (e[3] ? $t.k4 + esc(e[3]) + $q.t : '') + '</li>').join('') + '</ul>';
}
export async function devBlock(env, l, slug) {
if (!(await loadT(env))) return '';
const d = await file(env, $q.aL, 3600000); const x = d && d.d[slug]; if (!x || !x.days.length) return '';
return $t.k5 + (l === 'ar' ? $q.A : '') + '>' + $q.a + '<h2>' + esc(t(l, 'tr_dh')) + $q.aM + esc(fill(t(l, 'tr_dl'), { n: nf(x.days.length, l), a: fd(x.days[0][0], l), b: fd(x.days[x.days.length - 1][0], l) })) + '</p>' + trChart(l, x) + trTable(l, x) + trEvents(l, x, 8) +
$q.aN + pre(l) + $q.aO + esc(t(l, 'tr_t')) + $q.aP + esc(slug) + $t.k6;
}
async function trPage(env, shell, l, u) {
const d = await file(env, $q.aL, 3600000); if (!d) return null;
const s = d.sample, lab = t(l, 'tr_s'), v = d.versions;
const one = u.searchParams.get('d'); const x1 = one && d.d[one];
const rows = d.top.map(k => { const x = d.d[k], r = x.days[x.days.length - 1]; return $q.aQ + pre(l) + $q.aR + esc(k) + $q.aS + esc(x.n) + $q.aT + nf(r[1], l) + $q.aD + nf(r[2], l) + $q.aD + nf(r[3], l) + $q.aD + nf(r[9], l) + $q.aD + nf(r[5], l) + $q.aD + nf(r[6], l) + ' / ' + nf(r[7], l) + $q.aD + nf(x.ev.filter(e => e[1] !== 'add').length, l) + $q.aE; });
const ek = t(l, 'tr_e');
const b = $q.aU + esc(t(l, 'nv')) + $q.aV + kpis([[nf(s.developers, l), t(l, 'tr_k')[0]], [nf(v.length, l), t(l, 'tr_k')[1]], [nf(s.latest.mv || 0, l), lab.mv], [nf(s.latest.past || 0, l), lab.past], [nf(s.latest.pn || 0, l), lab.pn]]) +
(x1 ? sec(x1.n, trChart(l, x1) + trTable(l, x1) + trEvents(l, x1, 30)) : '') +
sec(t(l, $q.aW), table(t(l, 'tr_th'), rows)) +
sec(t(l, $q.aX), '<ul>' + Object.keys(d.events).map(k => '<li>' + esc(ek[k] || k) + ': <b>' + nf(s.events[k] || 0, l) + $q.aY).join('') + '</ul>') +
sec(t(l, $q.aZ), paras(l, 'tr_p') + '<p>' + esc(fill(t(l, $q.ba), { d: nf(s.developers, l), m: nf(s.with_two_or_more_days, l), e: nf(s.with_events, l), v: nf(v.length, l), a: fd(v[0], l), b: fd(v[v.length - 1], l) })) + '</p>') +
filesList(l, [[$q.aL, 'JSON'], [$q.ab, t(l, 'snaps')], [$q.bb, $q.bc]]);
return page(shell, l, Object.assign(H(l, 'tr'), { path: $q.bd, body: b, updated: d.built, noindex: !!one, crumb: [[t(l, 'devs'), pre(l) + $q.aR]] }));
}
const stCls = s => typeof s === $q.be ? (s < 400 ? 'ok' : 'bad') : s === 'e' ? 'bad' : 'mut';
const stTxt = (l, s) => typeof s === $q.be ? String(s) : (t(l, 'sh_st')[s] || s);
const archL = (l, d, r) => { const u = r[0]; if (r[6] === 'k' && d.own && d.own[u]) return $q.bf + esc(d.own[u]) + $q.bg + esc(t(l, 'sh_ar').k) + '</a>'; if (r[6] === 'w' && d.wayback && d.wayback[u]) return $q.bh + esc(d.wayback[u]) + '/' + esc(u) + $t.k7 + esc(t(l, 'sh_ar').w) + ' ' + esc(d.wayback[u].slice(0, 4)) + '</a>'; return $t.k8 + esc(u) + $t.k9 + esc(t(l, 'sh_ar').l) + '</a>'; };
const cites = (l, d, u) => ((d.cites || {})[u] || []).slice(0, 2).map(s => $q.y + pUrl(l, s) + '">' + esc(s) + '</a>').join(', ');
async function shPage(env, shell, l, u) {
const d = await file(env, $q.bi, 900000); if (!d) return null;
const c = d.counts || {}, chk = d.checked || 0, pct = chk ? Math.round(d.live / chk * 1000) / 10 : 0;
const wk = new Date(Date.parse(d.updated + $q.bj) - 7 * 864e5).toISOString().slice(0, 10);
const changed = d.u.filter(r => r[4] && r[4] >= wk && r[4] !== r[5]).sort((a, b) => b[4] < a[4] ? -1 : 1);
const dead = d.u.filter(r => typeof r[1] === $q.be && r[1] >= 400 || r[1] === 'e');
const host = (u.searchParams.get('h') || '').toLowerCase().replace(/[^a-z0-9.-]/g, '').slice(0, 80);
const row = r => $q.bk + esc(r[0]) + $q.bl + esc(r[0].replace(/^https?:\/\/(www\.)?/, '').slice(0, 80)) + $q.bm + cites(l, d, r[0]) + $q.bn + stCls(r[1]) + '">' + esc(stTxt(l, r[1])) + $q.t + (r[7] ? $q.bo + esc(r[7]) + $q.t : '') + $q.aD + esc(fd(r[2], l)) + $q.aD + esc(r[4] && r[4] !== r[5] ? fd(r[4], l) : '') + $q.bp + archL(l, d, r) + $q.aE;
const byHost = {}; for (const r of d.u) { const h = hostOf(r[0]); const o = byHost[h] = byHost[h] || [0, 0]; o[0]++; if (typeof r[1] === $q.be && r[1] < 400) o[1]++; }
const hosts = Object.entries(byHost).sort((a, b) => b[1][0] - a[1][0]).slice(0, 15);
const th = t(l, 'sh_th');
const b = kpis([[bdi(l, nf(pct, l, 1) + '%'), t(l, 'sh_k')[0]], [nf(chk, l), fill(t(l, 'sh_k')[1], { n: nf(d.n, l) })], [nf(changed.length, l), t(l, 'sh_k')[2]], [nf(dead.length, l), t(l, 'sh_k')[3]], [nf(c.r || 0, l), t(l, 'sh_k')[4]]]) +
(host ? sec(host, table(th, d.u.filter(r => hostOf(r[0]) === host).slice(0, 300).map(row))) : '') +
sec(t(l, $q.bq), changed.length ? table(th, changed.slice(0, 60).map(row)) : $q.aG + esc(t(l, $q.br)) + '</p>') +
sec(t(l, $q.bs), dead.length ? table(th, dead.slice(0, 80).map(row)) + (dead.length > 80 ? $q.E + esc(fill(t(l, $q.bt), { n: nf(dead.length - 80, l) })) + $t.k10 : '') : $q.bu) +
sec(t(l, $q.bv), table(t(l, $q.bw), hosts.map(([h, o]) => $q.bx + esc(h) + $q.by + esc(h) + $q.aT + nf(o[0], l) + $q.aD + bdi(l, nf(o[0] ? o[1] / o[0] * 100 : 0, l, 1) + '%') + $q.aE))) +
sec(t(l, $q.aZ), paras(l, 'sh_p') + $q.E + esc(fill(t(l, $q.bz), { d: fd(d.updated, l), n: nf(d.read_today || 0, l) })) + '</p>') + filesList(l, [[$q.bi, 'JSON'], [$q.bA, $q.bc]]);
return page(shell, l, Object.assign(H(l, 'sh'), { path: $q.bB, body: b, updated: d.updated, noindex: !!host }));
}
async function evPage(env, shell, l, u) {
const e = await file(env, $q.ac, 3600000); if (!e) return null;
const slugs = Object.keys(e.p);
const withQ = slugs.filter(s => e.p[s].some(x => x[1]));
const pick = (u.searchParams.get('p') || '').replace(/[^a-z0-9-]/g, '').slice(0, 90);
let one = '';
if (pick && e.p[pick]) {
const r = await resolve(env, pick); const vs = r && await versions(env, r.id);
let cur = null; if (vs) for (let i = 0; i < vs.length; i++) cur = i ? apply(cur, vs[i].ops) : vs[i].base;
if (cur) one = sec(cur.n, table(t(l, 'ev_th'), (cur.cl || []).map((c, i) => { const x = e.p[pick].find(y => y[0] === i); return $q.bC + esc(c[0]) + $q.bp + esc(t(l, 'cst')[c[1]] || c[1]) + $q.bp + (x && x[1] ? $t.k11 + esc(x[1]) + $q.bD + esc(fill(t(l, 'ev_q'), { h: hostOf(c[3]), d: fd(x[3], l) })) + $q.t : $q.bE + esc(x ? fill(t(l, $q.bF), { d: fd(x[3], l) }) : t(l, 'ev_nr')) + $q.t) + $q.bp + (c[3] ? ext(c[3]) : '') + $q.aE; })) + $q.bG + pUrl(l, pick) + $q.bH + esc(t(l, $q.bI)) + $q.bJ);
}
const sample = withQ.slice(0, 40).map(s => $q.bK + esc(s) + $q.by + esc(s) + $q.bL + nf(e.p[s].filter(x => x[1]).length, l) + '/' + nf(e.p[s].length, l) + $q.bM).join('');
const b = kpis([[nf(e.n_claims, l), t(l, 'ev_k')[0]], [nf(e.n_quotes, l), t(l, 'ev_k')[1]], [nf(withQ.length, l), t(l, 'ev_k')[2]]]) +
$q.bN + esc(t(l, $q.bO)) + $t.k12 + esc(pick) + $t.k13 + esc(t(l, $q.bP)) + $q.bQ + one +
sec(t(l, $q.bR), $q.bS + sample + '</ul>') + sec(t(l, $q.aZ), paras(l, 'ev_p') + $q.E + esc(e.method) + '</p>') +
filesList(l, [[$q.ac, 'JSON'], [$t.k14, 'API'], [$q.bA, $q.bc]]);
return page(shell, l, Object.assign(H(l, 'ev'), { path: $q.bT, body: b, updated: e.updated, noindex: !!pick, crumb: [[t(l, 'cs'), pre(l) + $q.bU]] }));
}
export async function projBlock(env, l, slug, nonce) {
if (!(await loadT(env))) return '';
const r = await resolve(env, slug); if (!r) return '';
return $t.k15 + esc(slug) + $q.bV + l + $q.bW + esc(t(l, 'ev_q')) + $q.bX + esc(t(l, $q.bF)) + $q.bY + esc(t(l, $q.bZ)) + $q.ca + esc(t(l, $q.bP)) + $q.cb + pre(l) + $q.cc + esc(slug) + $q.by + esc(t(l, 'ev_t')) + $q.cd + esc(r.id) + $q.ce + esc(t(l, 'hi_t')) + $q.cf + nonce + $q.cg + V + $q.ch;
}
const val = v => v == null || v === '' ? '-' : typeof v === $q.be ? String(v) : String(v).slice(0, 80);
async function rcPage(env, shell, l) {
const d = await file(env, $q.ci, 900000); if (!d) return null;
const reads = table(t(l, $q.cj), d.reads.map(r => $q.ck + esc(r.register) + $q.cl + nf(r.records, l) + $q.aD + nf(r.read_ok, l) + $q.aD + nf(r.changed_records, l) + $q.aD + nf(r.changed_fields, l) + $q.aD + esc(fd(r.read, l)) + $q.aE));
const ch = d.changes.slice(0, 300);
const b = $q.aU + esc(t(l, 'nv')) + $q.aV + sec(t(l, $q.cm), reads) +
sec(t(l, 'rc_ch'), ch.length ? table(t(l, 'rc_th'), ch.map(c => $q.ck + (c.s ? $q.y + pUrl(l, c.s) + '">' + esc(c.n) + '</a>' : esc(c.id)) + $q.cn + esc(c.mk || '') + $q.co + esc(c.register) + $q.cp + esc(c.field) + $q.cq + esc(val(c.before)) + $q.cn + esc(fd(c.before_d, l)) + $q.cr + esc(val(c.after)) + $q.cs + esc(fd(c.after_d, l)) + $q.ct + ext(c.url) + $q.aE)) : $q.aG + esc(t(l, $q.cu)) + '</p>') +
sec(t(l, $q.aZ), paras(l, 'rc_p')) + filesList(l, [[$q.ci, 'JSON'], [$q.cv, 'JSON'], [$q.cw, $q.bc]]);
return page(shell, l, Object.assign(H(l, 'rc'), { path: $q.cx, body: b, updated: d.updated, crumb: [[t(l, 'regs'), pre(l) + $q.cy]] }));
}
async function duPage(env, shell, l, u) {
const d = await file(env, $q.cz, 3600000); if (!d) return null;
const sg = t(l, $q.cA);
const only = ['image', 'text', 'pin', 'url'].includes(u.searchParams.get('s')) ? u.searchParams.get('s') : null;
const ps = d.pairs.filter(x => !only || x.s[only]);
const sig = x => Object.entries(x.s).map(([k, v]) => '<b>' + esc(sg[k]) + '</b>' + (k === 'text' ? ' ' + bdi(l, nf(v.v * 100, l) + '%') : k === 'image' ? ' ×' + nf(v.v, l) : '')).join('<br>');
const side = (n, s, m, dv, uu) => $q.y + pUrl(l, s) + '">' + esc(n) + $q.cB + esc(m) + ' · ' + esc(dv) + $q.t + (uu ? '<br>' + ext(uu) : '');
const rows = ps.slice(0, 200).map(x => $q.cC + side(x.na, x.sa, x.ma, x.da, x.ua) + $q.bp + side(x.nb, x.sb, x.mb, x.db, x.ub) + $q.bp + sig(x) + $q.bp + esc([x.cross_market ? t(l, 'du_cm') : '', x.same_dev ? t(l, 'du_sd') : t(l, 'du_dd'), x.same_host ? t(l, 'du_sh') : ''].filter(Boolean).join(' · ')) + $q.aE);
const k = d.counts;
const nav = '<p>' + ['image', 'text', 'pin', 'url'].map(s => $q.cD + s + $q.by + esc(sg[s]) + $q.cE + nf(d.pairs.filter(x => x.s[s]).length, l) + $q.cF).join(' · ') + (only ? $q.cG + esc(t(l, 'all')) + '</a>' : '') + '</p>';
const b = $q.aU + esc(t(l, 'nv')) + $q.aV + kpis([[nf(k.pairs, l), t(l, 'du_k')[0]], [nf(k.different_developer, l), t(l, 'du_k')[1]], [nf(k.cross_market, l), t(l, 'du_k')[2]], [nf(d.compared.projects, l), t(l, 'du_k')[3]]]) + nav +
table(t(l, 'du_th'), rows) + sec(t(l, $q.aZ), paras(l, 'du_p') + '<ul>' + Object.entries(d.signals).map(([s, v]) => $q.cH + esc(sg[s]) + $q.cI + esc(v) + $q.bM).join('') + '</ul>') +
$q.bG + pre(l) + $q.cJ + esc(t(l, $q.cK)) + $q.cL + pre(l) + $q.cM + esc(t(l, 'fix')) + $q.bJ + filesList(l, [[$q.cz, 'JSON'], [$q.bb, $q.bc]]);
return page(shell, l, Object.assign(H(l, 'du'), { path: $q.cN, body: b, updated: d.built, noindex: !!only }));
}
const ci = (l, a, d, u) => a ? bdi(l, nf(a[0], l, d) + (u || '') + ' – ' + nf(a[1], l, d) + (u || '')) : $q.bE + esc(t(l, $q.cO)) + $q.t;
function ivRowsD(l, rows) { return rows.map(r => $q.ck + (r.mk === $q.cP ? esc(t(l, 'allm')) : $q.cQ + esc(slugM(r.mk)) + '/">' + esc(r.mk) + '</a>') + $q.cl + (r.median_late != null ? nf(r.median_late, l, 1) : '-') + $q.aD + ci(l, r.median_ci, 1) + $q.aD + nf(r.n_late, l) + $q.aD + bdi(l, nf(r.share_past_first, l, 1) + '%') + $q.aD + ci(l, r.share_ci, 1, '%') + $q.aD + nf(r.with_date, l) + $q.aE); }
async function ivPage(env, shell, l) {
const d = await file(env, $q.cR, 3600000); if (!d) return null;
const dl = d.delay.filter(r => r.mk === $q.cP || r.with_date >= 10).sort((a, b) => (b.mk === $q.cP) - (a.mk === $q.cP) || b.with_date - a.with_date);
const pp = d.ppm.slice().sort((a, b) => b.n - a.n);
const b = sec(t(l, 'iv_dh'), table(t(l, $q.cS), ivRowsD(l, dl))) +
sec(t(l, 'iv_ph'), table(t(l, $q.cT), pp.map(r => $q.cU + esc(slugM(r.mk)) + '/">' + esc(r.mk) + $q.cV + esc(r.cur) + $q.aD + bdi(l, nf(r.median, l)) + $q.aD + ci(l, r.ci, 0) + $q.aD + nf(r.n, l) + $q.aE))) +
sec(t(l, $q.aZ), paras(l, 'iv_p') + '<ul>' + Object.entries(d.method).map(([k, v]) => $q.cW + esc(k) + $q.cX + esc(v) + $q.bM).join('') + '</ul>') +
$q.bG + pre(l) + $q.cY + esc(t(l, $q.cZ)) + $q.cL + pre(l) + $q.da + esc(t(l, $q.db)) + $q.bJ + filesList(l, [[$q.cR, 'JSON'], [$q.dc, 'JSON'], [$q.bb, $q.bc]]);
return page(shell, l, Object.assign(H(l, 'iv'), { path: $q.dd, body: b, updated: d.built, crumb: [[t(l, $q.cZ), pre(l) + $q.de]] }));
}
async function ivBlock(env, l, mk) {
const d = await file(env, $q.cR, 3600000); if (!d) return '';
const lk = $q.y + pre(l) + $q.df + esc(t(l, $q.dg)) + '</a>';
if (mk) {
const r = d.delay.find(x => slugM(x.mk) === mk), ps = d.ppm.filter(x => slugM(x.mk) === mk);
if (!r && !ps.length) return '';
const li = [];
if (r && r.median_ci) li.push(fill(t(l, 'iv_ld'), { m: nf(r.median_late, l, 1), a: nf(r.median_ci[0], l, 1), b: nf(r.median_ci[1], l, 1), n: nf(r.n_late, l) }));
if (r && r.share_ci) li.push(fill(t(l, 'iv_ls'), { s: nf(r.share_past_first, l, 1), a: nf(r.share_ci[0], l, 1), b: nf(r.share_ci[1], l, 1), n: nf(r.with_date, l) }));
for (const p of ps) li.push(fill(t(l, 'iv_lp'), { c: p.cur, m: nf(p.median, l), a: nf(p.ci[0], l), b: nf(p.ci[1], l), n: nf(p.n, l) }));
if (!li.length) return '';
return $t.k16 + (l === 'ar' ? $q.A : '') + '>' + $q.a + '<h2>' + esc(t(l, 'iv_bh')) + $q.dh + li.map(x => '<li>' + bdi(l, esc(x)) + '</li>').join('') + $q.di + esc(t(l, $q.dj)) + ' ' + lk + $q.dk;
}
const top = d.delay.filter(r => r.mk === $q.cP || r.with_date >= 25).sort((a, b) => (b.mk === $q.cP) - (a.mk === $q.cP) || b.with_date - a.with_date).slice(0, 9);
return $t.k17 + (l === 'ar' ? $q.A : '') + '>' + $q.a + '<h2>' + esc(t(l, 'iv_bh')) + '</h2>' + table(t(l, $q.cS), ivRowsD(l, top)) + $q.E + esc(t(l, $q.dj)) + ' ' + lk + $q.dk;
}
async function rpPage(env, shell, l) {
const [b0, r0] = await Promise.all([file(env, $q.dl, 3600000), file(env, $q.dm, 3600000)]); if (!b0) return null;
const st = r0 ? r0.steps : [];
const res = st.length ? table(t(l, 'rp_th'), st.map(s => $q.ck + esc(s.step) + $q.dn + (s.match ? $q.do + esc(t(l, 'rp_ok')) + $q.t : $q.dp + esc(t(l, 'rp_no')) + $q.t) + $q.cp + esc(String(s.rebuilt_sha256 || s.published_outputs_sha256 || '').slice(0, 16)) + $q.dq + (s.commit ? $q.dr + esc(s.commit) + $q.t : '') + (s.outputs ? $q.s + nf(s.outputs, l) + ' ' + esc(t(l, $q.ds)) + $q.t : '') + $q.aE)) + $q.E + esc(fill(t(l, $q.dt), { d: (r0.run_at || '').replace('T', ' ').slice(0, 16) + ' UTC' })) + '</p>' : $q.bu;
const outs = Object.entries(b0.outputs);
const b = sec(t(l, $q.du), res) + sec(t(l, $q.dv), $s.k1 + paras(l, 'rp_c') + $s.k2) +
sec(t(l, 'rp_io'), $q.ay + esc(fill(t(l, 'rp_n'), { i: nf(Object.keys(b0.inputs).length, l), o: nf(outs.length, l) })) + $q.aA + table(['', $q.dw], Object.entries(b0.inputs).map(([k, v]) => $q.dx + esc(k) + $q.dy + esc(v.slice(0, 16)) + $q.dz).concat(outs.map(([k, v]) => $q.dx + esc(k) + $q.dy + esc(v.slice(0, 16)) + $q.dz))) + $q.dA + esc(t(l, $q.dB)) + $q.dC + esc(b0.outputs_sha256) + $q.dD) +
sec(t(l, $q.aZ), paras(l, 'rp_p')) + filesList(l, [[$q.dl, 'JSON'], [$q.dm, 'JSON'], [$q.bb, $q.bc], [$q.dE, $q.bc]]);
return page(shell, l, Object.assign(H(l, 'rp'), { path: $q.dF, body: b, updated: b0.built, crumb: [[t(l, 'eng'), $q.dG]], type: $q.dH }));
}
async function hiPage(env, shell, l, u) {
const ix = await file(env, $q.W, 3600000); if (!ix) return null;
const pick = (u.searchParams.get('p') || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 90);
let one = '';
if (pick) {
const r = await resolve(env, pick), vs = r && await versions(env, r.id);
if (vs) one = sec(r.slug, table(t(l, 'hi_th'), vs.map((v, i) => $q.aB + esc(fd(v.d, l)) + $q.bp + (i ? $q.ay + nf(v.ops.length, l) + $q.dI + v.ops.slice(0, 40).map(o => $q.cW + esc(o.op) + ' ' + esc(o.path) + $q.dJ).join('') + $q.dK : esc(t(l, $q.dL))) + $q.cp + esc(v.sha.slice(0, 16)) + $q.dz)) + $q.dM + esc(r.id) + $q.dN + esc(r.id) + $q.dO + pUrl(l, r.slug) + '">' + esc(t(l, $q.dP)) + $q.bJ);
else one = $q.dQ + esc(t(l, 'hi_nf')) + '</p>';
}
const vp = ix.versions_per_record;
const b = kpis([[nf(ix.records, l), t(l, 'hi_k')[0]], [nf(ix.versions_from.length, l), t(l, 'hi_k')[1]], [nf(Object.entries(vp).reduce((s, [k, v]) => s + (+k) * v, 0), l), t(l, 'hi_k')[2]]]) +
$q.dR + esc(t(l, $q.bO)) + $t.k18 + esc(pick) + $t.k19 + esc(t(l, 'hi_go')) + $q.bQ + one +
sec(t(l, $q.dS), $s.k3 + paras(l, 'hi_p') + $q.dT + esc(ix.diff) + $t.k20 + esc(ix.record_hash) + $q.dU) +
sec(t(l, $q.dV), table(t(l, $q.dW), Object.entries(vp).map(([k, v]) => $q.aB + nf(+k, l) + $q.aD + nf(v, l) + $q.aE))) +
sec(t(l, $q.dX), '<ul>' + ix.versions_from.map(v => '<li>' + esc(fd(v.d, l)) + $q.dC + esc(v.file_sha256.slice(0, 16)) + $q.dY + esc(v.kind) + $q.bM).join('') + '</ul>') +
filesList(l, [[$q.W, 'JSON'], [$q.ab, t(l, 'snaps')], [$q.dZ, 'API']]);
return page(shell, l, Object.assign(H(l, 'hi'), { path: $q.ea, body: b, updated: ix.built, noindex: !!pick, crumb: [[t(l, 'data'), $q.eb]] }));
}
async function piPage(env, shell, l, u) {
const d = await file(env, $q.ec, 3600000); if (!d) return null;
const fl = t(l, 'pi_f');
const bad = d.p.filter(x => x.f.length);
const b = $q.aU + esc(t(l, 'nv')) + $q.aV + kpis([[nf(d.pins, l), t(l, 'pi_k')[0]], [nf(d.with_boundary, l), t(l, 'pi_k')[1]], [nf(d.flagged, l), t(l, 'pi_k')[2]], [nf(d.boundaries.areas || 0, l), t(l, 'pi_k')[3]]]) +
'<ul>' + Object.keys(d.flags).map(k => $q.cH + esc(fl[k] || k) + $q.ed + nf(d.counts[k] || 0, l) + '</li>').join('') + '</ul>' +
sec(t(l, $q.ee), bad.length ? table(t(l, 'pi_th'), bad.map(x => $q.aQ + pUrl(l, x.s) + $q.ef + esc(x.n) + $q.cV + esc(x.mk) + $q.bp + esc(x.ar || '') + $q.bp + x.f.map(f => esc(fl[f] || f)).join('<br>') + $q.aD + (x.f.includes($q.eg) && x.da != null ? bdi(l, nf(x.da, l, 1) + ' km') : x.f.includes($q.eh) && x.do != null ? bdi(l, '+' + nf(x.do, l, 1) + ' km') : '') + $t.k21 + x.lat + $q.ei + x.lng + $q.ej + x.lat + '/' + x.lng + $t.k22 + x.lat.toFixed(4) + ', ' + x.lng.toFixed(4) + $q.ek)) : $q.bu) +
sec(t(l, $q.aZ), paras(l, 'pi_p') + '<ul>' + Object.entries(d.flags).map(([k, v]) => $q.cH + esc(fl[k] || k) + $q.cI + esc(v) + $q.bM).join('') + $q.di + esc(d.boundaries.source || '') + ' · ' + esc(fd(d.boundaries.read, l)) + '</p>') +
$q.bG + pre(l) + $q.el + esc(t(l, 'dq')) + $q.cL + pre(l) + $q.cM + esc(t(l, 'fix')) + $q.bJ + filesList(l, [[$q.ec, 'JSON'], [$q.em, $q.bc], [$q.bb, $q.bc]]);
return page(shell, l, Object.assign(H(l, 'pi'), { path: $q.en, body: b, updated: d.built, crumb: [[t(l, 'eng'), $q.dG], [t(l, 'dq'), pre(l) + $q.eo]] }));
}
async function fmPage(env, shell, l) {
const d = await file(env, $q.ep, 3600000); if (!d) return null;
const rows = d.files.map(f => $q.aQ + esc(f.path) + $q.eq + esc(f.path.replace($q.eb, '')) + $q.cV + esc(f.format) + $q.aD + nf(f.rows, l) + $q.aD + bdi(l, nf(f.bytes / 1048576, l, 2) + ' MB') + $q.er + esc(f.sha256) + '">' + esc(f.sha256.slice(0, 16)) + $q.es + esc(f.version) + $q.dz);
const b = table(t(l, 'fm_th'), rows) + sec(t(l, $q.et), $s.k4 + paras(l, 'fm_p')) +
sec(t(l, $q.eu), '<ul>' + d.other.map(o => $q.n + esc(o[0]) + '">' + esc(o[0]) + $q.bL + esc(o[1]) + $q.bM).join('') + '</ul>') + $q.E + esc(fill(t(l, $q.ev), { h: d.source.sha256.slice(0, 16), v: d.source.version })) + '</p>' + filesList(l, [[$q.ep, 'JSON'], [$q.bb, $q.bc]]);
return page(shell, l, Object.assign(H(l, 'fm'), { path: $q.ew, body: b, updated: d.built, crumb: [[t(l, 'data'), $q.eb]],
ld: [{ '@type': $q.ex, name: $q.ey, version: d.source.version, license: $t.k23, creator: { '@type': $q.ez, name: $q.K, url: ORIGIN + '/' }, dateModified: d.built,
distribution: d.files.map(f => ({ '@type': $q.eA, encodingFormat: f.media_type, contentUrl: ORIGIN + f.path, contentSize: f.bytes + ' B' })) }] }));
}
const hub = l => $t.k24 + (l === 'ar' ? $q.A : '') + '><h2>' + esc(t(l, 'hub')) + $q.m + ALL.map(x => $q.n + pre(l) + x[1] + '">' + esc(t(l, x[0] + '_t')) + $q.o).join('') + $q.eB;
const one = (l, ks) => '<section class="wrap n34"' + (l === 'ar' ? ' dir="rtl"' : '') + '><ul class="n34-rel">' + ALL.filter(x => ks.includes(x[0])).map(x => '<li><a href="' + pre(l) + x[1] + '">' + esc(t(l, x[0] + '_t')) + '</a></li>').join('') + '</ul></section>';
export async function inject(req, u, env, r, nonce) {
try {
const m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(.*)$/.exec(u.pathname), l = m[1] || 'en', p = m[2];
if (!/text\/html/.test(r.headers.get($q.eC) || '')) return r;
if (!(await loadT(env))) return r;
let h = '', sel = 'main', where = $q.eD;
let mm;
if (p === $q.eE || p === 'yc/') h = hub(l);
else if (p === $q.eF || p === $q.eG) h = await ivBlock(env, l, null) + one(l, ['iv']);
else if ((mm = /^m\/([^/.]{2,60})\/$/.exec(p))) h = await ivBlock(env, l, decodeURIComponent(mm[1]).toLowerCase());
else if ((mm = /^developers\/([a-z0-9-]{1,90})\/$/.exec(p))) { h = await devBlock(env, l, mm[1]); sel = $q.eH; where = $q.eI; }
else if ((mm = /^projects\/([a-z0-9-]{1,90})\/$/.exec(p))) { h = await projBlock(env, l, mm[1], nonce || ''); sel = $q.eJ; }
else if (p === 'data/') h = one(l, ['fm', 'hi', 'rp']);
else if (p === $q.eK) h = one(l, ['pi', 'sh', 'du']);
else if (p === $q.eL) h = one(l, ['rc']);
if (!h) return r;
let done = false;
const out = new HTMLRewriter().on(sel, { element(e) { if (done) return; done = true; if (where === $q.eI) e.before(h, { html: true }); else e.append(h, { html: true }); } });
if (sel === $q.eH) out.on('main', { element(e) { e.onEndTag(end => { if (!done) { done = true; end.before(h, { html: true }); } }); } });
return out.transform(r);
} catch (e) { return r; }
}
export async function handle(req, u, env, ctx, shell) {
const p = u.pathname; let m;
if (!PATHS.test(p) || (req.method !== 'GET' && req.method !== 'HEAD')) return null;
if ((m = /^\/api\/v1\/projects\/([A-Za-z0-9-]{1,90})\/(history|evidence)$/.exec(p))) { try { return m[2] === $q.eM ? await historyApi(env, u, m[1]) : await evidenceApi(env, m[1]); } catch (e) { return json({ error: $q.eN }, 503); } }
if ((m = /^\/api\/v1\/developers\/([a-z0-9-]{1,90})\/track-record$/.exec(p))) {
const d = await file(env, $q.aL, 3600000), x = d && d.d[m[1]];
if (!x) return json({ error: $q.Z, developer: m[1] }, 404);
return json({ api: $q.eO, developer: m[1], name: x.n, columns: d.columns, events_legend: d.events, days: x.days, events: x.ev, page: ORIGIN + $q.aR + m[1] + $q.eP, method: ORIGIN + $q.bd, note: $t.k25, licence: d.licence });
}
if (!(await loadT(env))) return null;
if (!p.endsWith('/')) return new Response(null, { status: 301, headers: { location: p + '/' + u.search } });
const L = x => x || 'en';
if ((m = R.tr.exec(p))) return trPage(env, shell, L(m[1]), u);
if ((m = R.sh.exec(p))) return shPage(env, shell, L(m[1]), u);
if ((m = R.ev.exec(p))) return evPage(env, shell, L(m[1]), u);
if ((m = R.rc.exec(p))) return rcPage(env, shell, L(m[1]));
if ((m = R.du.exec(p))) return duPage(env, shell, L(m[1]), u);
if ((m = R.iv.exec(p))) return ivPage(env, shell, L(m[1]));
if ((m = R.rp.exec(p))) return rpPage(env, shell, L(m[1]));
if ((m = R.hi.exec(p))) return hiPage(env, shell, L(m[1]), u);
if ((m = R.pi.exec(p))) return piPage(env, shell, L(m[1]), u);
if ((m = R.fm.exec(p))) return fmPage(env, shell, L(m[1]));
return null;
}
