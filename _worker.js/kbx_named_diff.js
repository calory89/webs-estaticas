// kolaboro.com "what changed" viewer for named project pages (batch 9, agent b9b).
//   GET /projects/<slug>/changes/[?a=<sha256>&b=<sha256>]   side-by-side dated diff of the developer's page text between two of the
//                                                         versions our agents archived (default: the latest change), changed
//                                                         sentences highlighted, word-level marks inside them
//   GET /projects/<slug>/changes/<sha256>.txt             the sealed copy itself: the exact text whose SHA-256 is in the URL
// Data: /data/page-history-<k>.json (k = sum of the id's character codes mod 3), built without any model call by
// tools/kolaboro-agent/page_history.py on main from the agents' archive (data/archive/<sha>.txt.gz). Each version is stored as
// indexes into a list of unique segments; joining them gives back the exact archived text, so the .txt copy hashes to its name.
// Display only (never the .txt copy): e-mail addresses and phone numbers are masked.
import { assemble, esc, fd } from './kbx_named.js';

const ORIGIN = 'https://kolaboro.com';
const SHARDS = 3;
const shardOf = id => [...id].reduce((a, c) => a + c.charCodeAt(0), 0) % SHARDS;
const MEMO = {};
async function shard(env, k) {
  const m = MEMO[k]; if (m && (m.a || Date.now() - m.t < 600000)) return m.v;   // n20p: a shard read from this deployment's assets (a) does not expire (4.3 MB each)
  let r = null, a = false;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/page-history-' + k + '.json')); a = !!(r && r.ok); } catch (e) { r = null; }
  if (!r || !r.ok) r = await fetch(ORIGIN + '/data/page-history-' + k + '.json', { cf: { cacheTtl: 600, cacheEverything: true } });
  if (!r.ok) throw new Error('page-history ' + r.status);
  const v = await r.json(); MEMO[k] = { t: Date.now(), v, a }; return v;
}
async function project(env, id) { const s = await shard(env, shardOf(id)); return { p: (s.projects || {})[id] || null, updated: s.updated }; }
const textOf = (p, v) => v.ix.map(i => p.seg[i]).join('');
const norm = t => String(t).replace(/\s+/g, ' ').trim();

// summary for the named page: number of versions, first and last day, how many versions changed the text
export async function phSummary(env, id) {
  const { p } = await project(env, id); if (!p || !p.v.length) return null;
  let changed = 0;
  for (let i = 1; i < p.v.length; i++) if (p.v[i].ix.map(j => norm(p.seg[j])).join('\n') !== p.v[i - 1].ix.map(j => norm(p.seg[j])).join('\n')) changed++;
  return { n: p.v.length, first: p.v[0].d, last: p.v[p.v.length - 1].d, changed };
}

// LCS diff of two arrays of strings, after trimming the common prefix and suffix
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
// group into rows: equal rows, and change blocks where removed and added sentences are paired side by side
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
// word marks inside a changed pair; long sentences show only the words around each change
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

const CSS = '<style>.kwrap .ki code{white-space:normal;overflow-wrap:anywhere;word-break:break-all}.kd-v{width:100%;border-collapse:collapse;font-size:.92rem}.kd-v th,.kd-v td{text-align:start;padding:7px 8px;border-bottom:1px solid var(--line);vertical-align:top}.kd-v code{font-size:.8rem;overflow-wrap:anywhere}' +
  '.kd-sum{overflow-wrap:anywhere;border:1px solid var(--line);border-inline-start:4px solid var(--k-sea,#155C75);border-radius:var(--k-r-lg,14px);background:var(--k-surface,var(--card));padding:18px 20px;margin:24px 0 14px}.kd-cmd{display:block;margin:10px 0;padding:12px 14px;border-radius:var(--k-r-md,10px);background:var(--k-sunken,var(--paper));border:1px solid var(--line);font:600 .82rem/1.5 ui-monospace,Menlo,monospace;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-all;max-width:80ch}.kd-g{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:0;border:1px solid var(--line);border-radius:14px;overflow:hidden;margin:14px 0}' +
  '.kd-h{font-weight:700;padding:10px 12px;background:var(--card,var(--paper));border-bottom:1px solid var(--line);font-size:.9rem;overflow-wrap:anywhere}.kd-c{padding:8px 12px;border-bottom:1px solid var(--line);font-size:.93rem;line-height:1.5;overflow-wrap:anywhere;min-width:0}' +
  '.kd-c.l{border-inline-end:1px solid var(--line)}.kd-c.del{background:var(--k-bad-bg,#FDE7E1)}.kd-c.add{background:var(--k-ok-bg,#E3F4EA)}.kd-c.empty{background:repeating-linear-gradient(45deg,transparent 0 6px,rgba(0,0,0,.03) 6px 12px)}.kd-c del{background:color-mix(in srgb,var(--k-bad,#A12828) 22%,transparent);text-decoration:line-through;color:inherit}.kd-c ins{background:color-mix(in srgb,var(--k-ok,#0A704E) 22%,transparent);text-decoration:none;color:inherit}' +
  '[data-theme=dark] .kd-c.del{background:#3A1A12}[data-theme=dark] .kd-c.add{background:#12301F}[data-theme=dark] .kd-c del{background:#6B2A18}[data-theme=dark] .kd-c ins{background:#1D5A36}' +
  '.kd-gap{grid-column:1/-1;padding:8px 12px;font-size:.85rem;color:var(--muted);border-bottom:1px dashed var(--line);background:var(--card,var(--paper))}.kd-gap summary{cursor:pointer;min-height:32px;display:flex;align-items:center}.kd-gap .kd-g{margin:8px 0 0;border-radius:10px}' +
  '.kd-lab{display:none;font-size:.75rem;font-weight:700;text-transform:uppercase;color:var(--muted)}.kd-pick{display:flex;flex-wrap:wrap;gap:8px;align-items:end}.kd-pick label{display:flex;flex-direction:column;font-size:.85rem;gap:4px}.kd-pick select{padding:8px;border:1px solid var(--line);border-radius:10px;font:inherit;background:var(--paper);color:var(--ink);max-width:100%}' +
  '@media(max-width:640px){.kd-g{grid-template-columns:minmax(0,1fr)}.kd-c.l{border-inline-end:0}.kd-h.r{display:none}.kd-lab{display:block}.kd-c.empty{display:none}.kd-v .hm,.kd-c.hm{display:none}}</style>';

function viewer(p, x, a, b, upd) {
  const vi = p.v.findIndex(v => v.sha === a.sha), vj = p.v.findIndex(v => v.sha === b.sha);
  const A = a.ix.map(i => norm(p.seg[i])).filter(Boolean), B = b.ix.map(i => norm(p.seg[i])).filter(Boolean);
  const R = rows(diff(A, B)), nCh = R.filter(r => r.t === '~').length, nAdd = R.filter(r => r.t === '+').length, nDel = R.filter(r => r.t === '-').length;
  const copy = v => '/projects/' + x.s + '/changes/' + v.sha + '.txt';
  const head = v => fd(v.d, 'en') + ' · <a href="' + copy(v) + '">SHA-256 <code>' + v.sha.slice(0, 12) + '…</code></a>';
  const cell = (side, cls, html, lab) => '<div class="kd-c ' + side + ' ' + cls + '"><span class="kd-lab">' + lab + '</span>' + html + '</div>';
  const pair = r => {
    if (r.t === '=') return cell('l', '', esc(short(r.a, 400)), 'Both') + cell('r', 'eq', esc(short(r.b, 400)), 'Both');
    if (r.t === '~') { const w = words(r.a, r.b); return cell('l', 'del', w[0], 'Before, ' + fd(a.d, 'en')) + cell('r', 'add', w[1], 'After, ' + fd(b.d, 'en')); }
    if (r.t === '-') return cell('l', 'del', '<del>' + esc(short(r.a, 1200)) + '</del>', 'Removed') + cell('r', 'empty', '', '');
    return cell('l', 'empty', '', '') + cell('r', 'add', '<ins>' + esc(short(r.b, 1200)) + '</ins>', 'Added');
  };
  // keep 2 unchanged sentences of context around each change; fold the rest
  const keep = R.map((r, i) => r.t !== '=' || R.slice(Math.max(0, i - 2), i + 3).some(q => q.t !== '='));
  let grid = '', fold = [];
  const flush = () => { if (fold.length) { grid += '<details class="kd-gap"><summary>' + fold.length + ' unchanged sentence' + (fold.length > 1 ? 's' : '') + '</summary><div class="kd-g">' + fold.map(pair).join('') + '</div></details>'; fold = []; } };
  R.forEach((r, i) => { if (keep[i]) { flush(); grid += pair(r); } else fold.push(r); }); flush();
  // the right column of an equal row is the same sentence; mark it so mobile shows it once
  grid = grid.replace(/<div class="kd-c r eq">[\s\S]*?<\/div>/g, m => m.replace('kd-c r eq', 'kd-c r eq hm'));
  const opts = sel => p.v.map(v => '<option value="' + v.sha + '"' + (v.sha === sel ? ' selected' : '') + '>' + esc(fd(v.d, 'en')) + ' · ' + v.sha.slice(0, 10) + '</option>').join('');
  const same = a.sha === b.sha, same2 = A.join('\n') === B.join('\n');
  const sum = same ? 'Pick two different versions to compare.' : same2 ? 'The two versions differ only in spacing or layout characters: the words are the same.'
    : 'Between ' + fd(a.d, 'en') + ' and ' + fd(b.d, 'en') + ': ' + nCh + ' sentence' + (nCh === 1 ? '' : 's') + ' changed, ' + nAdd + ' added, ' + nDel + ' removed (of ' + B.length + ' in the newer version).';
  const list = '<div class="tw"><table class="kd-v"><thead><tr><th>Version</th><th>First read</th><th>Sealed copy (SHA-256)</th><th class="hm">Compare</th></tr></thead><tbody>' + p.v.map((v, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(fd(v.d, 'en')) + '</td><td><a href="' + copy(v) + '"><code>' + v.sha + '</code></a></td><td class="hm">' + (i ? '<a href="?a=' + p.v[i - 1].sha + '&amp;b=' + v.sha + '">with version ' + i + '</a>' : '') + '</td></tr>').join('') + '</tbody></table></div>';
  return '<section class="phero kp"><div class="wrap"><p class="crumb"><a href="/">Kolaboro</a> / <a href="/projects/">Projects</a> / <a href="/projects/' + x.s + '/">' + esc(x.n) + '</a></p>' +
    '<h1>What changed on the developer\'s page: ' + esc(x.n) + '</h1><p class="lead">The text of the page we track for this project, as our agents read it on each date, compared side by side. Removed or changed words are struck through on the left, new words are marked on the right. Every version links to its sealed copy, whose SHA-256 fingerprint you can check yourself.</p></div></section>' +
    '<div class="wrap kwrap">' + CSS +
    (p.v.length < 2 ? '<div class="kd-sum"><p style="margin:0"><b>Only one version so far, first read ' + esc(fd(p.v[0].d, 'en')) + '.</b> A side-by-side comparison appears here as soon as the page text changes.</p>' :
    '<div class="kd-sum" aria-live="polite"><p style="margin:0 0 8px"><b>' + esc(sum) + '</b></p><form class="kd-pick" method="get"><label>Older version<select name="a">' + opts(a.sha) + '</select></label><label>Newer version<select name="b">' + opts(b.sha) + '</select></label><button class="btn btn-line kbtn" type="submit">Compare</button></form>') +
    '<p class="ki" style="margin:10px 0 0">Page tracked: ' + (p.url ? '<a href="' + esc(p.url) + '" rel="nofollow noopener" target="_blank">' + esc(p.url) + '</a>' : 'not recorded') + (p.v.length < 2 ? '.' : '. Version ' + (vi + 1) + ' and version ' + (vj + 1) + ' of ' + p.v.length + '.') + '</p></div>' +
    (same || same2 ? '' : '<div class="kd-g" role="table" aria-label="Side-by-side comparison"><div class="kd-h l" role="columnheader">Before: ' + head(a) + '</div><div class="kd-h r" role="columnheader">After: ' + head(b) + '</div>' + grid + '</div>') +
    '<section class="ks"><h2>All versions we keep</h2><p class="ki">A new version is recorded when the page text read by our agents has a different SHA-256 from the last read. Dates are the day the version was first read, not the day the developer changed it.</p>' + list + '</section>' +
    '<section class="ks"><h2>Check a sealed copy yourself</h2><p class="ki">Download a copy and compute its fingerprint. For example, on a Mac or Linux terminal:</p><code class="kd-cmd">curl -s ' + ORIGIN + copy(b) + ' | sha256sum</code><p class="ki">The result must equal the SHA-256 in its address. The copy is the exact text our agent extracted from the page (not the page\'s HTML or images). In this viewer, e-mail addresses and phone numbers are masked; the copies are unchanged.</p>' +
    '<p class="bts"><a class="btn btn-line kbtn" href="/projects/' + x.s + '/">Back to ' + esc(x.n) + '</a> <a class="btn btn-line kbtn" href="/developers/reply/?id=' + encodeURIComponent(x.id) + '">Reply as the developer</a> <a class="btn btn-line kbtn" href="/corrections?id=' + encodeURIComponent(x.id) + '">Report a correction</a></p></section>' +
    '<p class="ki kfoot">Data file updated ' + esc(String(upd || '').slice(0, 10)) + '. Developer text is quoted as published, without comment.</p></div>';
}

export async function diffRoute(req, u, env, ctx, shell, x, sha) {
  let P; try { P = await project(env, x.id); } catch (e) { P = { p: null }; }
  const p = P.p;
  if (sha) {
    const v = p && p.v.find(z => z.sha === sha);
    if (!v) return new Response('Not found: we hold no copy with this SHA-256 for this project.\n', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8', 'x-robots-tag': 'noindex' } });
    return new Response(textOf(p, v), { headers: { 'content-type': 'text/plain; charset=utf-8', 'x-robots-tag': 'noindex', 'x-content-sha256': sha, 'cache-control': 'public, max-age=86400, immutable', 'access-control-allow-origin': '*',
      'content-disposition': 'inline; filename="' + x.s + '-' + v.d + '-' + sha.slice(0, 12) + '.txt"' } });
  }
  const canon = ORIGIN + '/projects/' + x.s + '/changes/';
  let body, n = p ? p.v.length : 0;
  if (!p || !n) {
    body = '<section class="phero kp"><div class="wrap"><p class="crumb"><a href="/projects/' + x.s + '/">' + esc(x.n) + '</a></p><h1>What changed on the developer\'s page: ' + esc(x.n) + '</h1><p class="lead">We do not hold an archived copy of this project\'s page text yet. Copies are added when our agents read the page.</p><p class="bts"><a class="btn btn-line kbtn" href="/projects/' + x.s + '/">Back to ' + esc(x.n) + '</a></p></div></section>';
  } else {
    const q = s => p.v.find(v => v.sha === String(u.searchParams.get(s) || '').toLowerCase());
    let a = q('a'), b = q('b');
    if (!a || !b) {   // default: the most recent pair whose words differ
      let j = n - 1;
      for (; j > 0; j--) if (p.v[j].ix.map(i => norm(p.seg[i])).join('\n') !== p.v[j - 1].ix.map(i => norm(p.seg[i])).join('\n')) break;
      b = b || p.v[Math.max(j, n > 1 ? 1 : 0)]; a = a || p.v[Math.max(0, p.v.indexOf(b) - 1)];
    }
    if (p.v.indexOf(a) > p.v.indexOf(b)) { const t = a; a = b; b = t; }
    body = viewer(p, x, a, b, P.updated);
  }
  const title = 'What changed on the ' + x.n + ' developer page | Kolaboro';
  const desc = n > 1 ? 'Side-by-side, dated comparison of the ' + x.n + ' developer page text across ' + n + ' archived versions, with sealed SHA-256 copies.' : 'Archived copy of the ' + x.n + ' developer page text with its SHA-256 fingerprint.';
  const pg = { title, desc, canon, body, noindex: !!u.search || n < 2, lastmod: '', alt: () => canon,
    ld: { '@context': 'https://schema.org', '@type': 'WebPage', url: canon, name: title.replace(/ \| Kolaboro$/, ''), description: desc, isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' }, about: { '@id': ORIGIN + '/projects/' + x.s + '/#place' } } };
  const ck = new Request(ORIGIN + '/__named_diff/v5/' + encodeURIComponent(P.updated || '') + '/' + x.s + '/' + encodeURIComponent(u.search));
  try { const hit = await caches.default.match(ck); if (hit) return new Response(hit.body, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache', 'x-named-cache': 'hit' } }); } catch (e) {}
  const html = await assemble(pg, 'en', await shell('/how-we-score/'));
  try { const put = caches.default.put(ck, new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'max-age=3600' } })); if (ctx && ctx.waitUntil) ctx.waitUntil(put.catch(() => {})); } catch (e) {}
  return new Response(html, { status: p && n ? 200 : 404, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache', 'x-named-cache': 'miss' } });
}
