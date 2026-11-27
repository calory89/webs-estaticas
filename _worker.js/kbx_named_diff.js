// comments: _notes/kolaboro-worker-comments.txt
import { assemble, esc, fd, pre } from './kbx_named.js';
import { jget } from './kbx_jget.js';
import { TB } from './kbx_strings.js';
const TT = TB.kbx_named_diff_TT ;
const tt = (l, k) => (TT[l] && TT[l][k]) || TT.en[k] || '';
const tf = (l, k, o) => tt(l, k).replace(/\{(\w+)\}/g, (m, z) => o[z] != null ? o[z] : m);
const dr = l => l === 'ar' ? ' dir="rtl"' : '';
const IF = (globalThis.__kbIF = globalThis.__kbIF || {}); function sf(k, f) { if (IF[k]) return IF[k]; const p = f(); IF[k] = p; const d = () => { if (IF[k] === p) delete IF[k]; }; p.then(d, d); return p; }   // n40 d12
const ORIGIN = 'https://kolaboro.com';
const SHARDS = 3;
const shardOf = id => [...id].reduce((a, c) => a + c.charCodeAt(0), 0) % SHARDS;
const MEMO = {}, SH = (globalThis.__kbJson = globalThis.__kbJson || {}), phk = k => 'page-history-' + k + '.json';
const shard = (env, k) => { const m = MEMO[k]; return m && (m.a || Date.now() - m.t < 600000) ? Promise.resolve(m.v) : sf('ph:' + k, () => shard0(env, k)); };
async function shard0(env, k) {
const m = MEMO[k]; if (m && (m.a || Date.now() - m.t < 600000)) return m.v;
const o = await jget(env, phk(k), ORIGIN + '/_s/kolaboro.com/data/' + phk(k), ORIGIN + '/data/' + phk(k), 600);   // n40 d14: the same copy kbx_e29 reads
for (const j in MEMO) if (+j !== k) { delete MEMO[j]; delete SH[phk(j)]; }   // n40 d15: at most one whole shard kept (only the /changes/ pages need one)
MEMO[k] = { t: Date.now(), v: o.v, a: o.a }; return o.v;
}
// n40 d15: project pages only need four numbers per project: worked out for a whole shard at once, then the 7 MB shard is let go
const SUM = {};
const sumOf = p => { if (!p || !p.v.length) return null; const N = new Array(p.seg.length), g = j => N[j] !== undefined ? N[j] : (N[j] = norm(p.seg[j])); let changed = 0;
  for (let i = 1; i < p.v.length; i++) { const a = p.v[i].ix, b = p.v[i - 1].ix; let eq; if (a.length === b.length) { eq = true; for (let q = 0; q < a.length; q++) if (a[q] !== b[q] && g(a[q]) !== g(b[q])) { eq = false; break; } } else eq = a.map(g).join('\n') === b.map(g).join('\n'); if (!eq) changed++; }
  return { n: p.v.length, first: p.v[0].d, last: p.v[p.v.length - 1].d, changed }; };
const sums = (env, k) => { const c = SUM[k]; return c && (c.a || Date.now() - c.t < 600000) ? Promise.resolve(c) : sf('phs:' + k, async () => {
  const s = await shard(env, k), a = !!(MEMO[k] && MEMO[k].a), m = new Map(); for (const id in (s.projects || {})) m.set(id, sumOf(s.projects[id]));
  const o = SUM[k] = { t: Date.now(), a, m }; delete MEMO[k]; if (SH[phk(k)] && SH[phk(k)].v === s) delete SH[phk(k)]; return o; }); };
async function project(env, id) { const s = await shard(env, shardOf(id)); return { p: (s.projects || {})[id] || null, updated: s.updated }; }
const textOf = (p, v) => v.ix.map(i => p.seg[i]).join('');
const norm = t => String(t).replace(/\s+/g, ' ').trim();
export async function phSummary(env, id) { const r = (await sums(env, shardOf(id))).m.get(id); return r ? Object.assign({}, r) : null; }
export function diff(A, B) {
let s = 0; while (s < A.length && s < B.length && A[s] === B[s]) s++;
let e = 0; while (e < A.length - s && e < B.length - s && A[A.length - 1 - e] === B[B.length - 1 - e]) e++;
const a = A.slice(s, A.length - e), b = B.slice(s, B.length - e), n = a.length, m = b.length, ops = [];
for (let i = 0; i < s; i++) ops.push(['=', A[i], B[i]]);
if (n * m > 4e6) { for (const x of a) ops.push(['-', x, null]); for (const y of b) ops.push(['+', null, y]); }
else {
const W = m + 1, L = new Uint32Array((n + 1) * W);
for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i * W + j] = a[i] === b[j] ? L[(i + 1) * W + j + 1] + 1 : Math.max(L[(i + 1) * W + j], L[i * W + j + 1]);
let i = 0, j = 0;
while (i < n && j < m) { if (a[i] === b[j]) { ops.push(['=', a[i], b[j]]); i++; j++; } else if (L[(i + 1) * W + j] >= L[i * W + j + 1]) ops.push(['-', a[i++], null]); else ops.push(['+', null, b[j++]]); }
while (i < n) ops.push(['-', a[i++], null]); while (j < m) ops.push(['+', null, b[j++]]);
}
for (let i = A.length - e; i < A.length; i++) ops.push(['=', A[i], B[i - A.length + B.length]]);
return ops;
}
function rows(ops) {
  const out = []; let k = 0;
  while (k < ops.length) {
    if (ops[k][0] === '=') { out.push({ t: '=', a: ops[k][1], b: ops[k][2] }); k++; continue; }
    const del = [], add = [];
    while (k < ops.length && ops[k][0] !== '=') { if (ops[k][0] === '-') del.push(ops[k][1]); else add.push(ops[k][2]); k++; }
    for (let i = 0; i < Math.max(del.length, add.length); i++) out.push({ t: del[i] != null && add[i] != null ? '~' : del[i] != null ? '-' : '+', a: del[i], b: add[i] });
  }
  return out;
}
const mask = t => String(t).replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[e-mail]').replace(/(\+?\d[\d\s().-]{7,}\d)/g, m => m.replace(/\D/g, '').length >= 8 ? '[phone]' : m);
function words(a, b) {
  const A = mask(a).split(/\s+/).filter(Boolean), B = mask(b).split(/\s+/).filter(Boolean);
  if (A.length * B.length > 250000) return [esc(A.join(' ')), esc(B.join(' '))];
  const ops = diff(A, B), CTX = 12;
  const side = (k, tag) => {
    const toks = ops.filter(o => o[0] === '=' || o[0] === k);
    const keep = toks.map((o, i) => o[0] !== '=' || toks.slice(Math.max(0, i - CTX), i + CTX + 1).some(x => x[0] !== '='));
    let h = '', gap = false;
    toks.forEach((o, i) => { if (!keep[i]) { if (!gap) { h += ' … '; gap = true; } return; } gap = false; const w = esc(o[0] === '=' ? o[1] : o[k === '-' ? 1 : 2]); h += (o[0] === '=' ? w : '<' + tag + '>' + w + '</' + tag + '>') + ' '; });
    return h.trim();
  };
  return [side('-', 'del'), side('+', 'ins')];
}
const short = (t, n) => { t = mask(norm(t)); return t.length > n ? t.slice(0, n) + ' …' : t; };
function viewer(p, x, a, b, upd, l) {
const P = pre(l), q = k => esc(tt(l, k)), D = d => fd(d, l);
const vi = p.v.findIndex(v => v.sha === a.sha), vj = p.v.findIndex(v => v.sha === b.sha);
const A = a.ix.map(i => norm(p.seg[i])).filter(Boolean), B = b.ix.map(i => norm(p.seg[i])).filter(Boolean);
const R = rows(diff(A, B)), nCh = R.filter(r => r.t === '~').length, nAdd = R.filter(r => r.t === '+').length, nDel = R.filter(r => r.t === '-').length;
const copy = v => '/projects/' + x.s + '/changes/' + v.sha + '.txt';
const head = v => esc(D(v.d)) + ' · <a href="' + copy(v) + '">SHA-256 <code>' + v.sha.slice(0, 12) + '…</code></a>';
const cell = (side, cls, html, lab) => '<div class="kd-c ' + side + ' ' + cls + '"><span class="kd-lab">' + lab + '</span>' + html + '</div>';
const pair = r => {
if (r.t === '=') return cell('l', '', esc(short(r.a, 400)), q('both')) + cell('r', 'eq', esc(short(r.b, 400)), q('both'));
if (r.t === '~') { const w = words(r.a, r.b); return cell('l', 'del', w[0], q('before') + ', ' + esc(D(a.d))) + cell('r', 'add', w[1], q('after') + ', ' + esc(D(b.d))); }
if (r.t === '-') return cell('l', 'del', '<del>' + esc(short(r.a, 1200)) + '</del>', q('removed')) + cell('r', 'empty', '', '');
return cell('l', 'empty', '', '') + cell('r', 'add', '<ins>' + esc(short(r.b, 1200)) + '</ins>', q('added'));
};
const keep = R.map((r, i) => r.t !== '=' || R.slice(Math.max(0, i - 2), i + 3).some(q => q.t !== '='));
let grid = '', fold = [];
const flush = () => { if (fold.length) { grid += '<details class="kd-gap"><summary>' + esc(tf(l, 'unch', { n: fold.length })) + '</summary><div class="kd-g">' + fold.map(pair).join('') + '</div></details>'; fold = []; } };
R.forEach((r, i) => { if (keep[i]) { flush(); grid += pair(r); } else fold.push(r); }); flush();
grid = grid.replace(/<div class="kd-c r eq">[\s\S]*?<\/div>/g, m => m.replace('kd-c r eq', 'kd-c r eq hm'));
const opts = sel => p.v.map(v => '<option value="' + v.sha + '"' + (v.sha === sel ? ' selected' : '') + '>' + esc(D(v.d)) + ' · ' + v.sha.slice(0, 10) + '</option>').join('');
const same = a.sha === b.sha, same2 = A.join('\n') === B.join('\n');
const sum = same ? tt(l, 'pick') : same2 ? tt(l, 'same') : tf(l, 'sum', { a: D(a.d), b: D(b.d), c: nCh, d: nAdd, r: nDel, n: B.length });
const list = TB.kbx_named_diff__t.k0 + q('th_v') + '</th><th scope="col">' + q('th_r') + '</th><th scope="col">' + q('th_s') + '</th><th scope="col" class="hm">' + q('cmp') + '</th></tr></thead><tbody>' + p.v.map((v, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(D(v.d)) + '</td><td><a href="' + copy(v) + '"><code>' + v.sha + '</code></a></td><td class="hm">' + (i ? '<a href="?a=' + p.v[i - 1].sha + '&amp;b=' + v.sha + '">' + esc(tf(l, 'withv', { i })) + '</a>' : '') + '</td></tr>').join('') + '</tbody></table></div>';
return '<section class="phero kp"' + dr(l) + TB.kbx_named_diff__t.k1 + P + '/">Kolaboro</a> / <a href="' + P + '/projects/">' + q('projects') + '</a> / <a href="' + P + '/projects/' + x.s + '/">' + esc(x.n) + '</a></p>' +
'<h1>' + esc(tf(l, 'h1', { n: x.n })) + '</h1><p class="lead">' + q('lead') + '</p></div></section>' +
'<div class="wrap kwrap"' + dr(l) + '>' + TB.kbx_named_diff__s.CSS +
(p.v.length < 2 ? TB.kbx_named_diff__t.k2 + esc(tf(l, 'one', { d: D(p.v[0].d) })) + '</b> ' + q('one2') + '</p>' :
TB.kbx_named_diff__t.k3 + esc(sum) + TB.kbx_named_diff__t.k4 + q('older') + '<select name="a">' + opts(a.sha) + '</select></label><label>' + q('newer') + '<select name="b">' + opts(b.sha) + TB.kbx_named_diff__t.k5 + q('cmp') + '</button></form>') +
TB.kbx_named_diff__t.k6 + q('tracked') + ' ' + (p.url ? '<a href="' + esc(p.url) + TB.kbx_named_diff__t.k7 + esc(p.url) + '</a>' : q('norec')) + (p.v.length < 2 ? '' : ' · ' + esc(tf(l, 'vof', { i: vi + 1, j: vj + 1, n: p.v.length }))) + '</p></div>' +
(same || same2 ? '' : TB.kbx_named_diff__t.k8 + q('grid') + '"><div class="kd-h l">' + q('before') + ': ' + head(a) + '</div><div class="kd-h r">' + q('after') + ': ' + head(b) + '</div>' + grid + '</div>') +
'<section class="ks"><h2>' + q('all_h') + '</h2><p class="ki">' + q('all_p') + '</p>' + list + '</section>' +
'<section class="ks"><h2>' + q('chk_h') + '</h2><p class="ki">' + q('chk_p') + TB.kbx_named_diff__t.k9 + ORIGIN + copy(b) + ' | sha256sum</code><p class="ki">' + q('chk_p2') + '</p>' +
TB.kbx_named_diff__t.k10 + P + '/projects/' + x.s + '/">' + esc(tf(l, 'back', { n: x.n })) + TB.kbx_named_diff__t.k11 + encodeURIComponent(x.id) + '">' + q('reply') + TB.kbx_named_diff__t.k12 + encodeURIComponent(x.id) + '">' + q('corr') + '</a></p></section>' +
'<p class="ki kfoot">' + esc(tf(l, 'foot', { d: D(String(upd || '').slice(0, 10)) })) + '</p></div>';
}
export async function diffRoute(req, u, env, ctx, shell, x, sha, lang) {
const l = TT[lang] ? lang : 'en', P = pre(l);
let PH; try { PH = await project(env, x.id); } catch (e) { PH = { p: null }; }
const p = PH.p;
if (sha) {
const v = p && p.v.find(z => z.sha === sha);
if (!v) return new Response(TB.kbx_named_diff__t.k13, { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8', 'x-robots-tag': 'noindex' } });
return new Response(textOf(p, v), { headers: { 'content-type': 'text/plain; charset=utf-8', 'x-robots-tag': 'noindex', 'x-content-sha256': sha, 'cache-control': 'public, max-age=86400, immutable', 'access-control-allow-origin': '*',
'content-disposition': 'inline; filename="' + x.s + '-' + v.d + '-' + sha.slice(0, 12) + '.txt"' } });
}
const canon = ORIGIN + P + '/projects/' + x.s + '/changes/';
let body, n = p ? p.v.length : 0;
if (!p || !n) {
body = '<section class="phero kp"' + dr(l) + TB.kbx_named_diff__t.k14 + P + '/projects/' + x.s + '/">' + esc(x.n) + '</a></p><h1>' + esc(tf(l, 'h1', { n: x.n })) + '</h1><p class="lead">' + esc(tt(l, 'none')) + TB.kbx_named_diff__t.k15 + P + '/projects/' + x.s + '/">' + esc(tf(l, 'back', { n: x.n })) + '</a></p></div></section>';
} else {
const q = s => p.v.find(v => v.sha === String(u.searchParams.get(s) || '').toLowerCase());
let a = q('a'), b = q('b');
if (!a || !b) {
let j = n - 1;
for (; j > 0; j--) if (p.v[j].ix.map(i => norm(p.seg[i])).join('\n') !== p.v[j - 1].ix.map(i => norm(p.seg[i])).join('\n')) break;
b = b || p.v[Math.max(j, n > 1 ? 1 : 0)]; a = a || p.v[Math.max(0, p.v.indexOf(b) - 1)];
}
if (p.v.indexOf(a) > p.v.indexOf(b)) { const t = a; a = b; b = t; }
body = viewer(p, x, a, b, PH.updated, l);
}
const title = tf(l, 'title', { n: x.n }) + ' | Kolaboro';
const desc = n > 1 ? tf(l, 'desc2', { n: x.n, k: n }) : tf(l, 'desc1', { n: x.n });
const pg = { title, desc, canon, body, noindex: !!u.search || n < 2, lastmod: '', alt: z => ORIGIN + pre(z) + '/projects/' + x.s + '/changes/',
ld: { '@context': 'https://schema.org', '@type': 'WebPage', url: canon, name: title.replace(/ \| Kolaboro$/, ''), description: desc, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' }, about: { '@id': ORIGIN + '/projects/' + x.s + '/#place' }, inLanguage: l } };
const ck = new Request(ORIGIN + '/__named_diff/v6/' + l + '/' + encodeURIComponent(PH.updated || '') + '/' + x.s + '/' + encodeURIComponent(u.search));
try { const hit = await caches.default.match(ck); if (hit) return new Response(hit.body, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache', 'x-named-cache': 'hit' } }); } catch (e) {}
const html = await assemble(pg, l, await shell(P + '/how-we-score/'));
try { const put = caches.default.put(ck, new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'max-age=3600' } })); if (ctx && ctx.waitUntil) ctx.waitUntil(put.catch(() => {})); } catch (e) {}
return new Response(html, { status: 200, headers:
{ 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache', 'x-named-cache': 'miss', 'content-language': l } });
}
