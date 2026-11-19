// kolaboro.com batch 32 (agent n32x, 19 Nov 2026): ten engineering features. The worker only renders the page shells and two small
// endpoints; data are static files under /data/ built by /open/n32x-build.py, browser code is static under /k/n32x/.
//   GET /[l/]data/sql/                    SQL on the open dataset (DuckDB-WASM, lazy), data card, Parquet + CSV (/sql/ answers 301 here)
//   GET /[l/]claims/search/               full-text search over every claim and source (prebuilt index /data/claims-index.json)
//   GET /[l/]anomalies/                   statistical outliers in our own data, each with rule, numbers and source (/data/anomalies.json)
//   GET /[l/]graph/entities/              developer, company, escrow bank, project and market graph (canvas, /data/entity-graph.json)
//   GET /[l/]verify/offline/              offline verifier scripts (Python stdlib, Node) and how to use them
//   GET /[l/]engineering/provenance/      per-deploy attestation: commit, dataset hash, worker tree, live time; history; signed
//   GET /[l/]changes/live/                live change stream page; GET /api/v1/stream is the Server-Sent Events endpoint
//   GET /[l/]watch/website-changes/       what developers changed on their own pages (dates, prices, promises), top 200
//   GET /[l/]engineering/early-hints/     103 Early Hints and fetchpriority, LCP before and after
//   GET /[l/]satellite/construction-index/ built-up change index per project from Sentinel-2, with method and limits
//   GET /api/v1/provenance                the attestation as JSON (signed inline and, like every /api/v1 answer, in the header)
// Strings in 8 languages: /data/n32x-i18n.json (static asset, read once per isolate).
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const V = 'x2';
let T = null;
async function loadT(env) {
  if (T) return T;
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/n32x-i18n.json')); if (r.ok) T = await r.json(); } catch (e) {}
  if (!T) { try { const r = await fetch(ORIGIN + '/data/n32x-i18n.json', { cf: { cacheTtl: 300 } }); if (r.ok) T = await r.json(); } catch (e) {} }
  return T;
}
const MEMO = {};
async function file(env, p, ttl) {
  const m = MEMO[p]; if (m && Date.now() - m.t < (ttl || 600000)) return m.v;
  let v = null;
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com' + p)); if (r.ok) v = await r.json(); } catch (e) { v = null; }
  MEMO[p] = { t: Date.now(), v }; return v;
}
const pre = l => l === 'en' ? '' : '/' + l;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const t = (l, k) => { const a = T && T[l] && T[l][k]; return a != null ? a : T && T.en[k] != null ? T.en[k] : ''; };
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : m);
const nf = (n, l, d) => { try { return new Intl.NumberFormat(LOC[l] || 'en-GB', { maximumFractionDigits: d == null ? 0 : d, numberingSystem: 'latn' }).format(n); } catch (e) { return String(n); } };
const fd = (d, l) => { if (!d) return ''; try { return new Intl.DateTimeFormat(LOC[l] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC', numberingSystem: 'latn' }).format(new Date(String(d).slice(0, 10) + 'T12:00:00Z')); } catch (e) { return String(d).slice(0, 10); } };
const bdi = (l, h) => l === 'ar' ? '<bdi>' + h + '</bdi>' : h;
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const LP = '(?:(es|de|fr|nl|ru|zh|ar)\\/)?';
const F = { sql: 'data\\/sql', cs: 'claims\\/search', an: 'anomalies', gr: 'graph\\/entities', of: 'verify\\/offline', pv: 'engineering\\/provenance', st: 'changes\\/live', wc: 'watch\\/website-changes', eh: 'engineering\\/early-hints', si: 'satellite\\/construction-index' };
const R = {}; for (const k in F) R[k] = new RegExp('^\\/' + LP + F[k] + '\\/?$');
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:data\/sql|claims\/search|anomalies|graph\/entities|verify\/offline|engineering\/(?:provenance|early-hints)|changes\/live|watch\/website-changes|satellite\/construction-index)\/?$|^\/api\/v1\/(?:stream|provenance)$|^\/sql\/?$/;
// the ten features, in order, for the "more engineering" list on every page (key, path)
const ALL = [['sql', '/data/sql/'], ['cs', '/claims/search/'], ['an', '/anomalies/'], ['gr', '/graph/entities/'], ['of', '/verify/offline/'], ['pv', '/engineering/provenance/'], ['st', '/changes/live/'], ['wc', '/watch/website-changes/'], ['eh', '/engineering/early-hints/'], ['si', '/satellite/construction-index/']];

const CSS = '<style>.n32{max-width:1100px}.n32 h2{margin:28px 0 8px;font-size:1.3rem}.n32 p,.n32 li{max-width:78ch;line-height:1.6}.n32-tw{overflow-x:auto;border:1px solid var(--line,#d5d3cc);border-radius:12px;margin:10px 0 22px;-webkit-overflow-scrolling:touch}' +
  '.n32 table{width:100%;border-collapse:collapse;font-size:.93rem}.n32 th,.n32 td{padding:8px 10px;border-bottom:1px solid var(--line,#d5d3cc);text-align:start;vertical-align:top}.n32 th{font-size:.82rem;background:var(--card,#fff)}.n32 td.n{font-variant-numeric:tabular-nums;white-space:nowrap}' +
  '.n32 code,.n32 pre{font-size:.88em;overflow-wrap:anywhere}.n32 pre{white-space:pre-wrap;background:var(--card,#f6f5f1);border:1px solid var(--line,#d5d3cc);border-radius:10px;padding:10px 12px;overflow-x:auto}.n32 .k-xs{font-size:.9rem;color:var(--muted,#59626B)}' +
  '.n32-app{margin:14px 0 24px;min-height:120px}.n32-rel{display:flex;flex-wrap:wrap;gap:4px 16px;padding:0;list-style:none}.n32-rel a{display:inline-flex;min-height:44px;align-items:center}.n32-k{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0}.n32-k div{border:1px solid var(--line,#d5d3cc);border-radius:12px;padding:8px 12px;min-width:120px}.n32-k b{display:block;font-size:1.25rem}' +
  '.n32 .ok{color:#0B7A55;font-weight:700}.n32 .bad{color:#B42318;font-weight:700}.n32 .mut{color:var(--muted,#59626B)}:root[data-theme=dark] .n32 .ok{color:#4BE3A4}:root[data-theme=dark] .n32 .bad{color:#FF8A80}' +
  '.n32 input[type=search],.n32 input[type=text],.n32 select,.n32 textarea{font:inherit;min-height:44px;padding:8px 10px;border:1px solid var(--line,#c9c6bd);border-radius:10px;background:var(--card,#fff);color:inherit;max-width:100%}.n32 button{min-height:44px}' +
  '@media print{.n32-tw{overflow:visible;border:0}}</style>';
const table = (th, rows) => '<div class="n32-tw" tabindex="0"><table><thead><tr>' + th.map(x => '<th scope="col">' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
const N = () => import('./kbx_named.js');
const rel = (l, skip) => '<h2>' + esc(t(l, 'more')) + '</h2><ul class="n32-rel">' + ALL.filter(x => x[0] !== skip).map(x => '<li><a href="' + pre(l) + x[1] + '">' + esc(t(l, x[0] + '_t')) + '</a></li>').join('') + '<li><a href="/engineering/">' + esc(t(l, 'eng')) + '</a></li></ul>';
// client strings for one page, inlined as JSON (only that language), and its script
const app = (l, k, extra) => '<div id="n32-app" class="n32-app" data-k="' + k + '" data-l="' + l + '"' + (extra || '') + '><noscript><p>' + esc(t(l, 'nojs')) + '</p></noscript></div><script type="application/json" id="n32-t">' + JSON.stringify(Object.assign({}, T.en['c_' + k] || {}, (T[l] && T[l]['c_' + k]) || {}, { _l: l, _loc: LOC[l] })).replace(/</g, '\\u003c') + '</script><script src="/k/n32x/' + k + '.js?v=' + V + '" defer></script>';
const paras = (l, k) => (t(l, k) || []).map(p => '<p>' + esc(p) + '</p>').join('');
const sec = (h, b) => '<h2>' + esc(h) + '</h2>' + b;
const filesList = (l, fs) => '<ul>' + fs.map(f => '<li><a href="' + esc(f[0]) + '"' + (l === 'ar' ? ' dir="ltr"' : '') + '>' + esc(f[0]) + '</a>' + (f[1] ? ' <span class="k-xs">' + esc(f[1]) + '</span>' : '') + '</li>').join('') + '</ul>';

async function page(shell, l, o) {
  const n = await N(), canon = ORIGIN + pre(l) + o.path;
  const crumbs = [[t(l, 'home'), pre(l) + '/']].concat(o.crumb || []).concat([[o.h1, null]]);
  const body = '<section class="phero"' + (l === 'ar' ? ' dir="rtl"' : '') + '><div class="wrap"><p class="crumb">' + crumbs.map(c => c[1] ? '<a href="' + esc(c[1]) + '">' + esc(c[0]) + '</a>' : esc(c[0])).join(' / ') + '</p><h1>' + esc(o.h1) + '</h1><p class="lead">' + esc(o.lead) + '</p>' +
    (o.updated ? '<p class="k-xs">' + esc(fill(t(l, 'upd'), { d: fd(o.updated, l) })) + '</p>' : '') + '</div></section><div class="wrap n32"' + (l === 'ar' ? ' dir="rtl"' : '') + '>' + CSS + o.body + rel(l, o.k) + '</div>';
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': o.type || 'WebPage', url: canon, name: o.h1, description: o.lead, inLanguage: l, dateModified: o.updated || '2026-11-19', isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] ? ORIGIN + c[1] : canon })) }].concat(o.ld || []) };
  const desc = o.lead.length > 155 ? o.lead.slice(0, 152).replace(/\s+\S*$/, '') + '…' : o.lead;
  const html = await n.assemble({ title: (o.h1.length > 46 ? o.h1.slice(0, 46).replace(/\s+\S*$/, '') : o.h1) + ' | Kolaboro', desc, canon, body, ld, alt: x => ORIGIN + pre(x) + o.path }, l, await shell(pre(l) + '/how-we-score/'));
  const h = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=' + (o.maxAge || 900), 'content-language': l };
  if (o.preload) h.link = o.preload;
  return new Response(html, { status: 200, headers: h });
}
const H = (l, k) => ({ h1: t(l, k + '_t'), lead: t(l, k + '_l'), k });

// ------------------------------------------------------------------------------------------------ 1. SQL
async function sqlPage(env, shell, l) {
  const c = await file(env, '/data/sql/datacard.json'); if (!c) return null;
  const rows = c.files.map(f => '<tr><th scope="row"><code>' + esc(f.table) + '</code></th><td class="n">' + bdi(l, nf(f.rows, l)) + '</td><td class="n">' + f.columns.length + '</td><td><a href="' + f.parquet.path + '">Parquet</a> <span class="k-xs">' + bdi(l, nf(f.parquet.bytes / 1024, l) + ' KB') + '</span> · <a href="' + f.csv.path + '">CSV</a> <span class="k-xs">' + bdi(l, nf(f.csv.bytes / 1024, l) + ' KB') + '</span></td><td><code title="SHA-256">' + esc(f.parquet.sha256.slice(0, 16)) + '…</code></td></tr>');
  const b = '<div class="n32-k"><div><b>' + esc(c.version) + '</b>' + esc(t(l, 'sql_ver')) + '</div><div><b>' + bdi(l, nf(c.files[0].rows, l)) + '</b>' + esc(t(l, 'sql_pr')) + '</div><div><b>' + bdi(l, nf(c.files[1].rows, l)) + '</b>' + esc(t(l, 'sql_cl')) + '</div><div><b>' + bdi(l, nf(c.files[2].rows, l)) + '</b>' + esc(t(l, 'sql_mk')) + '</div></div>' +
    app(l, 'sql') + sec(t(l, 'sql_card'), '<p>' + esc(fill(t(l, 'sql_src'), { d: fd(c.source.published, l), h: c.source.sha256.slice(0, 16) })) + ' <a href="' + pre(l) + '/data/snapshots/">/data/snapshots/</a></p>' +
    table(t(l, 'sql_th'), rows) + paras(l, 'sql_p') + '<p><a href="/data/sql/datacard.json">datacard.json</a> · <a href="/open/n32x-build.py">n32x-build.py</a> · ' + esc(c.licence) + '</p>');
  return page(shell, l, Object.assign(H(l, 'sql'), { path: '/data/sql/', body: b, updated: c.built, crumb: [[t(l, 'data'), '/data/']], 
    ld: [{ '@type': 'Dataset', name: c.name, description: c.what_it_is, version: c.version, license: 'https://creativecommons.org/licenses/by/4.0/', creator: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, dateModified: c.built,
      distribution: c.files.flatMap(f => [{ '@type': 'DataDownload', encodingFormat: 'application/vnd.apache.parquet', contentUrl: ORIGIN + f.parquet.path }, { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: ORIGIN + f.csv.path }]) }] }));
}

// ------------------------------------------------------------------------------------------------ 2. claim search
async function csPage(env, shell, l) {
  const c = await file(env, '/data/sql/datacard.json');
  const b = app(l, 'cs', ' data-n="' + (c ? c.files[1].rows : '') + '"') + sec(t(l, 'method'), paras(l, 'cs_p')) + filesList(l, [['/data/claims-index.json', t(l, 'cs_f')], ['/data/sql/claims.csv', 'CSV']]);
  return page(shell, l, Object.assign(H(l, 'cs'), { path: '/claims/search/', body: b, updated: c && c.built }));
}

// ------------------------------------------------------------------------------------------------ 3. anomaly radar
const AR = ['ppm', 'moved', 'register_date', 'stage', 'size', 'units'];
function anNums(l, a) {
  const x = a.x, f = v => bdi(l, esc(typeof v === 'number' ? nf(v, l, 1) : v));
  const k = a.r === 'size' ? 'an_x_size_' + x.why : a.r === 'stage' ? (x.pct >= 95 ? 'an_x_stage_hi' : 'an_x_stage_0') : 'an_x_' + a.r;
  return fill(esc(t(l, k)), Object.fromEntries(Object.entries(x).map(([kk, v]) => [kk, f(v)])));
}
async function anPage(env, shell, l, u) {
  const d = await file(env, '/data/anomalies.json'); if (!d) return null;
  const only = AR.includes(u.searchParams.get('r')) ? u.searchParams.get('r') : null;
  const by = {}; for (const a of d.items) (by[a.r] = by[a.r] || []).push(a);
  const nav = '<p>' + AR.map(r => '<a href="#' + r + '">' + esc(t(l, 'an_r_' + r)) + '</a> <span class="k-xs">(' + nf(d.counts[r] || 0, l) + ')</span>').join(' · ') + '</p>';
  const secs = AR.filter(r => !only || r === only).map(r => '<h2 id="' + r + '">' + esc(t(l, 'an_r_' + r)) + ' <span class="k-xs">' + nf((by[r] || []).length, l) + '</span></h2><p>' + esc(fill(t(l, 'an_d_' + r), Object.assign({}, d.rules[r] || {}))) + '</p>' +
    ((by[r] || []).length ? table(t(l, 'an_th'), (by[r] || []).map(a => '<tr><th scope="row"><a href="' + pre(l) + '/projects/' + esc(a.s) + '/">' + esc(a.n) + '</a></th><td>' + esc(a.mk) + '</td><td>' + anNums(l, a) + '</td><td>' + (a.src ? '<a href="' + esc(a.src) + '" rel="nofollow noopener" target="_blank">' + esc(hostOf(a.src)) + '</a>' : '') + '</td><td class="n">' + esc(fd(a.d, l)) + '</td></tr>')) : '<p class="mut">' + esc(t(l, 'an_none')) + '</p>')).join('');
  const b = '<p><b>' + esc(t(l, 'an_nv')) + '</b></p><div class="n32-k"><div><b>' + nf(d.items.length, l) + '</b>' + esc(t(l, 'an_items')) + '</div><div><b>' + nf(d.projects_read, l) + '</b>' + esc(t(l, 'an_read')) + '</div></div>' + nav + secs +
    sec(t(l, 'method'), paras(l, 'an_p') + '<p>' + esc(fill(t(l, 'src_line'), { d: fd(d.source.published, l), h: d.source.sha256.slice(0, 16) })) + '</p>') + filesList(l, [['/data/anomalies.json', 'JSON'], ['/open/n32x-build.py', 'Python']]) +
    '<p><a href="' + pre(l) + '/corrections/">' + esc(t(l, 'an_fix')) + '</a></p>';
  return page(shell, l, Object.assign(H(l, 'an'), { path: '/anomalies/', body: b, updated: d.built }));
}

// ------------------------------------------------------------------------------------------------ 4. entity graph
async function grPage(env, shell, l) {
  const d = await file(env, '/data/entity-graph.json', 3600000); if (!d) return null;
  const k = d.counts, ty = t(l, 'gr_ty');
  const b = '<div class="n32-k">' + ['p', 'd', 'c', 'b', 'm'].map(x => '<div><b>' + nf(k[x] || 0, l) + '</b>' + esc(ty[x]) + '</div>').join('') + '<div><b>' + nf(d.edges_n, l) + '</b>' + esc(t(l, 'gr_e')) + '</div></div>' + app(l, 'gr') +
    sec(t(l, 'method'), paras(l, 'gr_p')) + filesList(l, [['/data/entity-graph.json', 'JSON'], ['/graph/', t(l, 'gr_old')]]);
  return page(shell, l, Object.assign(H(l, 'gr'), { path: '/graph/entities/', body: b, updated: d.built }));
}

// ------------------------------------------------------------------------------------------------ 5. offline verifier
async function ofPage(env, shell, l) {
  const cmd = T.en.of_cmd.map((x, i) => [(t(l, 'of_cd') || [])[i] || x[0], x[1]]);
  const b = paras(l, 'of_p') + '<h2>' + esc(t(l, 'of_dl')) + '</h2>' + filesList(l, [['/open/kolaboro_offline_verify.py', 'Python 3.8+, stdlib only'], ['/open/kolaboro-offline-verify.mjs', 'Node 18+, no packages']]) +
    '<h2>' + esc(t(l, 'of_how')) + '</h2>' + cmd.map(x => '<p>' + esc(x[0]) + '</p><pre dir="ltr"><code>' + esc(x[1]) + '</code></pre>').join('') +
    sec(t(l, 'of_what'), '<ul>' + t(l, 'of_chk').map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>') + '<p><a href="' + pre(l) + '/data/snapshots/">/data/snapshots/</a> · <a href="/verify/">/verify/</a> · <a href="/.well-known/kolaboro-keys.json">kolaboro-keys.json</a></p>';
  return page(shell, l, Object.assign(H(l, 'of'), { path: '/verify/offline/', body: b, updated: '2026-11-19', crumb: [[t(l, 'verify'), '/verify/']], type: 'TechArticle' }));
}

// ------------------------------------------------------------------------------------------------ 6. build provenance
let PV = null;
async function provenance(env) {
  const commit = (env && env.CF_PAGES_COMMIT_SHA) || null;
  if (PV && PV.commit === commit && Date.now() - PV.t < 600000) return PV.v;
  const [hist, dep, B] = await Promise.all([file(env, '/data/provenance.json', 3600000), file(env, '/data/deploys.json', 300000), import('./kbx_n30b.js')]);
  let ch = null; try { ch = await B.chain(env); } catch (e) { ch = null; }
  const H0 = (hist && hist.history) || [], D0 = (dep && dep.deploys) || [];
  const fromHist = H0.find(x => x.commit === commit), fromDep = D0.find(x => x.commit === commit);
  const att = { type: 'kolaboro-build-attestation-v1', site: ORIGIN + '/', commit, branch: (env && env.CF_PAGES_BRANCH) || null,
    worker_tree: (fromDep && fromDep.worker_tree) || (fromHist && fromHist.worker_tree) || null, worker_bytes: (fromHist && fromHist.worker_bytes) || null,
    dataset: { file: '/data/named.json', sha256: ch ? ch.live.sha256 : null, bytes: ch ? ch.live.bytes : null, snapshot_chain_tip: ch ? ch.chain_tip : null },
    live_seen_by_guard: (fromDep && fromDep.at) || null, smoke_checks: fromDep ? [fromDep.checks_passed, fromDep.checks_total] : null,
    latest_recorded_deploy: (() => { const x = D0.find(y => y.commit && (y.worker_tree || (H0.find(z => z.commit === y.commit) || {}).worker_tree)); if (!x || x.commit === commit) return null; const hh = H0.find(z => z.commit === x.commit) || {}; return { commit: x.commit, live_seen: x.at, worker_tree: x.worker_tree || hh.worker_tree, note: 'The newest deploy the guard recorded. Commits after it that change only data files keep this worker source; a code commit changes it.' }; })(),
    attested_at: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    meaning: 'Which code commit and which dataset this site served at attested_at, signed by the key in /.well-known/kolaboro-keys.json. worker_tree is null until the deploy guard or the history file records this commit.' };
  let signature = null;
  try { const K = await import('./kolaboro.js'), msgHash = await shaHex(B.canon(att)); const s = await K.signBody(env, B.canon(att)); if (s) signature = { alg: 'Ed25519', kid: (env && env.KB_SIGN_KID) || 'kb', value: s, message: '"kolaboro-sig-v1\\n" + SHA-256 hex of the canonical JSON of "attestation" (keys sorted, no spaces)', attestation_sha256: msgHash }; } catch (e) {}
  const merged = D0.filter(x => x.commit).slice(0, 60).map(x => { const h = H0.find(y => y.commit === x.commit) || {}; return { commit: x.commit, live_seen: x.at, result: x.result, smoke: [x.checks_passed, x.checks_total], worker_tree: x.worker_tree || h.worker_tree || null, worker_bytes: h.worker_bytes || null, dataset_sha256: x.dataset_sha256 || h.dataset_sha256 || null }; });
  const v = { attestation: att, signature, history: merged, history_file: '/data/provenance.json', verify: ORIGIN + '/verify/offline/' };
  PV = { commit, t: Date.now(), v }; return v;
}
async function shaHex(s) { const b = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))); return [...b].map(x => x.toString(16).padStart(2, '0')).join(''); }
async function pvPage(env, shell, l) {
  const p = await provenance(env), a = p.attestation, s = p.signature;
  const sh = x => x ? '<code>' + esc(String(x).slice(0, 12)) + '</code>' : '<span class="mut">' + esc(t(l, 'pv_na')) + '</span>';
  const kv = t(l, 'pv_kv');
  const cur = table([kv[0], kv[1]], [[kv[2], sh(a.commit)], [kv[3], a.worker_tree ? sh(a.worker_tree) : sh(null) + (a.latest_recorded_deploy ? ' <span class="k-xs">' + esc(fill(t(l, 'pv_latest'), { c: a.latest_recorded_deploy.commit.slice(0, 12), w: String(a.latest_recorded_deploy.worker_tree).slice(0, 12) })) + '</span>' : '')], [kv[4], a.worker_bytes ? bdi(l, nf(a.worker_bytes / 1048576, l, 2) + ' MiB') : sh(null)], [kv[5], sh(a.dataset.sha256)], [kv[6], sh(a.dataset.snapshot_chain_tip)], [kv[7], a.live_seen_by_guard ? esc(a.live_seen_by_guard.replace('T', ' ').slice(0, 16)) + ' UTC' : sh(null)], [kv[8], esc(a.attested_at.replace('T', ' ').slice(0, 16)) + ' UTC'], [kv[9], s ? '<span class="ok">Ed25519</span> <code>' + esc(s.kid) + '</code>' : '<span class="mut">' + esc(t(l, 'pv_nosig')) + '</span>']].map(r => '<tr><th scope="row">' + esc(r[0]) + '</th><td>' + r[1] + '</td></tr>'));
  const hist = table(t(l, 'pv_th'), p.history.slice(0, 40).map(x => '<tr><td class="n">' + esc((x.live_seen || '').replace('T', ' ').slice(0, 16)) + '</td><td>' + sh(x.commit) + '</td><td>' + esc(t(l, 'pv_r')[x.result] || x.result || '') + (x.smoke && x.smoke[1] ? ' <span class="k-xs">' + x.smoke[0] + '/' + x.smoke[1] + '</span>' : '') + '</td><td>' + sh(x.worker_tree) + '</td><td class="n">' + (x.worker_bytes ? bdi(l, nf(x.worker_bytes / 1048576, l, 2)) : '') + '</td><td>' + sh(x.dataset_sha256) + '</td></tr>'));
  const b = sec(t(l, 'pv_cur'), cur) + '<p><a href="/api/v1/provenance">/api/v1/provenance</a> · <a href="' + pre(l) + '/verify/offline/">' + esc(t(l, 'of_t')) + '</a></p>' + sec(t(l, 'pv_hist'), hist) + sec(t(l, 'method'), paras(l, 'pv_p')) + filesList(l, [['/data/provenance.json', 'JSON'], ['/data/deploys.json', 'JSON'], ['/open/deploy-guard.py', 'Python']]);
  return page(shell, l, Object.assign(H(l, 'pv'), { path: '/engineering/provenance/', body: b, updated: '2026-11-19', crumb: [[t(l, 'eng'), '/engineering/']], maxAge: 300 }));
}

// ------------------------------------------------------------------------------------------------ 7. live change stream (SSE)
const sse = (id, ev, data) => (id ? 'id: ' + id + '\n' : '') + (ev ? 'event: ' + ev + '\n' : '') + 'data: ' + JSON.stringify(data) + '\n\n';
async function stream(req, u, env, ctx) {
  const B = await import('./kbx_n30b.js'); let C;
  try { C = await B.allChanges(env); } catch (e) { return new Response('{"error":"unavailable"}', { status: 503, headers: { 'content-type': 'application/json' } }); }
  const E = C.E, q = u.searchParams, last = req.headers.get('last-event-id') || q.get('last') || '';
  const n = Math.max(1, Math.min(200, parseInt(q.get('n') || '50', 10) || 50));
  let start = E.length - n;
  if (last) { const i = E.findIndex(x => x.id + '@' + x.at === last); start = i >= 0 ? i + 1 : start; }
  const rep = E.slice(Math.max(0, start)).map(x => sse(x.id + '@' + x.at, 'change', { id: x.id, at: x.at, kind: x.kind, project: x.project, title: x.title, text: x.text, source: x.source, url: x.url }));
  const ts = new TransformStream(), w = ts.writable.getWriter(), en = new TextEncoder(), commit = (env && env.CF_PAGES_COMMIT_SHA) || '';
  const hold = Math.max(5, Math.min(55, parseInt(q.get('hold') || '50', 10) || 50)) * 1000;
  ctx.waitUntil((async () => {
    try {
      await w.write(en.encode('retry: 15000\n' + sse(null, 'hello', { api: 'kolaboro-stream-v1', commit, total: E.length, replayed: rep.length, last_change_at: C.last, hold_s: hold / 1000, docs: ORIGIN + '/changes/live/' }) + rep.join('')));
      const t0 = Date.now();
      while (Date.now() - t0 < hold) {
        await new Promise(r => setTimeout(r, Math.max(1000, Math.min(15000, hold - (Date.now() - t0)))));
        let live = ''; try { const r = await fetch(ORIGIN + '/api/open/build', { cf: { cacheTtl: 15 } }); if (r.ok) live = String((await r.json()).commit || ''); } catch (e) {}
        await w.write(en.encode(live && commit && live !== commit ? sse(null, 'deploy', { commit: live, note: 'A new deploy is live; reconnect to receive its changes.' }) : ': keep-alive ' + new Date().toISOString() + '\n\n'));
        if (live && commit && live !== commit) break;
      }
      await w.write(en.encode(sse(null, 'bye', { reconnect_ms: 15000, last_id: E.length ? E[E.length - 1].id + '@' + E[E.length - 1].at : null })));
    } catch (e) {}
    try { await w.close(); } catch (e) {}
  })());
  return new Response(ts.readable, { headers: { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store', 'access-control-allow-origin': '*', 'x-accel-buffering': 'no' } });
}
async function stPage(env, shell, l) {
  const b = app(l, 'st') + sec(t(l, 'st_api'), paras(l, 'st_p') + '<pre dir="ltr"><code>curl -N https://kolaboro.com/api/v1/stream?n=5\n\nconst es = new EventSource("https://kolaboro.com/api/v1/stream");\nes.addEventListener("change", e => console.log(JSON.parse(e.data)));</code></pre>') +
    '<p><a href="/api/v1/changes">/api/v1/changes</a> · <a href="/api/v1/changes/feed.json">feed.json</a> · <a href="' + pre(l) + '/api/docs/">' + esc(t(l, 'st_docs')) + '</a></p>';
  return page(shell, l, Object.assign(H(l, 'st'), { path: '/changes/live/', body: b, updated: '2026-11-19' }));
}

// ------------------------------------------------------------------------------------------------ 8. website change diff index
async function wcPage(env, shell, l, u) {
  const d = await file(env, '/data/website-changes.json', 3600000); if (!d) return null;
  const KN = t(l, 'wc_k'), dv = (u.searchParams.get('dv') || '').replace(/[^a-z0-9-]/g, '');
  const rows = d.items.map((x, i) => dv && x.dvs !== dv ? '' : '<tr id="' + esc(x.s) + '"><td class="n">' + (i + 1) + '</td><th scope="row"><a href="' + pre(l) + '/projects/' + esc(x.s) + '/">' + esc(x.n) + '</a><br><span class="k-xs">' + (x.dvs ? '<a href="' + pre(l) + '/developers/' + esc(x.dvs) + '/">' + esc(x.dv) + '</a> · ' : '') + esc(x.mk) + '</span></th><td>' + Object.entries(x.kinds).map(([k, v]) => esc(KN[k] || k) + ' ' + v).join(', ') + '</td><td class="n">' + esc(fd(x.a.d, l)) + ' → ' + esc(fd(x.b.d, l)) + '</td><td><button type="button" class="kbtn" data-i="' + i + '">' + esc(t(l, 'wc_show')) + '</button> <a href="' + pre(l) + '/projects/' + esc(x.s) + '/changes/?a=' + x.a.sha + '&amp;b=' + x.b.sha + '">' + esc(t(l, 'wc_full')) + '</a>' +
    (x.wb ? ' · <a href="https://web.archive.org/web/' + esc(x.wb[0]) + '/' + esc(x.url) + '" rel="nofollow noopener" target="_blank">IA ' + esc(x.wb[0].slice(0, 4)) + '</a> <a href="https://web.archive.org/web/' + esc(x.wb[1]) + '/' + esc(x.url) + '" rel="nofollow noopener" target="_blank">IA ' + esc(x.wb[1].slice(0, 4)) + '</a>' : '') + '</td></tr>');
  const b = '<div class="n32-k"><div><b>' + nf(d.pages_with_two_versions, l) + '</b>' + esc(t(l, 'wc_two')) + '</div><div><b>' + nf(d.pages_with_kept_changes, l) + '</b>' + esc(t(l, 'wc_kept')) + '</div><div><b>' + nf(d.listed, l) + '</b>' + esc(t(l, 'wc_listed')) + '</div></div>' +
    '<p><b>' + esc(t(l, 'wc_nv')) + '</b></p>' + app(l, 'wc') + table(t(l, 'wc_th'), rows) + sec(t(l, 'method'), paras(l, 'wc_p')) + filesList(l, [['/data/website-changes.json', 'JSON'], ['/data/wayback.json', 'Internet Archive dates']]);
  return page(shell, l, Object.assign(H(l, 'wc'), { path: '/watch/website-changes/', body: b, updated: d.built }));
}

// ------------------------------------------------------------------------------------------------ 9. early hints
async function ehPage(env, shell, l) {
  const d = await file(env, '/data/early-hints.json', 3600000);
  const rows = d ? d.templates.map(x => '<tr><th scope="row"><a href="' + esc(x.path) + '">' + esc(x.name) + '</a></th><td class="n">' + bdi(l, nf(x.before.lcp_ms, l) + ' ms') + '</td><td class="n">' + bdi(l, nf(x.after.lcp_ms, l) + ' ms') + '</td><td class="n">' + bdi(l, (x.after.lcp_ms - x.before.lcp_ms > 0 ? '+' : '') + nf(x.after.lcp_ms - x.before.lcp_ms, l) + ' ms') + '</td><td class="n">' + nf(x.runs, l) + '</td><td>' + esc(x.lcp_element || '') + '</td></tr>') : [];
  const b = paras(l, 'eh_p') + (d ? '<pre dir="ltr"><code>' + esc(d.example_header) + '</code></pre>' + sec(t(l, 'eh_res'), table(t(l, 'eh_th'), rows) + '<p class="k-xs">' + esc(fill(t(l, 'eh_how'), { d: fd(d.measured, l), tool: d.tool })) + '</p>' + (d.h103 != null ? '<p>' + esc(t(l, d.h103 ? 'eh_103y' : 'eh_103n')) + '</p>' : '')) : '') +
    sec(t(l, 'limits'), paras(l, 'eh_lim')) + filesList(l, [['/data/early-hints.json', 'JSON']]);
  return page(shell, l, Object.assign(H(l, 'eh'), { path: '/engineering/early-hints/', body: b, updated: d ? d.measured : '2026-11-19', crumb: [[t(l, 'eng'), '/engineering/']] }));
}

// ------------------------------------------------------------------------------------------------ 10. satellite construction index
async function siPage(env, shell, l) {
  const d = await file(env, '/data/construction-index.json', 3600000); if (!d) return null;
  const c = d.counts, NT = t(l, 'si_nt');
  const spark = x => { const v = x.sm, n = v.length, W = 120, Hh = 28; let p = '', go = 0; v.forEach((y, i) => { if (y == null) { go = 0; return; } const X = Math.round(i / (n - 1) * W), Y = Math.round(Hh / 2 - Math.max(-50, Math.min(50, y)) / 100 * Hh); p += (go ? 'L' : 'M') + X + ' ' + Y; go = 1; }); return '<svg viewBox="0 0 ' + W + ' ' + Hh + '" width="' + W + '" height="' + Hh + '" aria-hidden="true"><line x1="0" x2="' + W + '" y1="' + Hh / 2 + '" y2="' + Hh / 2 + '" stroke="currentColor" stroke-opacity=".25"/><path d="' + p + '" fill="none" stroke="#FF5B14" stroke-width="1.5"/></svg>'; };
  const rows = d.projects.map((x, i) => '<tr data-s="' + esc(x.s) + '"><th scope="row"><a href="' + pre(l) + '/projects/' + esc(x.s) + '/">' + esc(x.n) + '</a><br><span class="k-xs">' + esc(x.mk) + ' · ' + esc(x.st || '') + '</span></th><td>' + spark(x) + '</td><td class="n">' + (x.prev12 == null ? '' : bdi(l, nf(x.prev12, l))) + ' → ' + (x.last12 == null ? '' : bdi(l, nf(x.last12, l))) + '</td><td>' + esc(x.up || '') + '</td><td>' + (x.note ? esc(NT[x.note]) : '') + '</td><td><button type="button" class="kbtn" data-i="' + i + '">' + esc(t(l, 'si_chart')) + '</button></td></tr>');
  const b = '<p><b>' + esc(t(l, 'si_nv')) + '</b></p><div class="n32-k"><div><b>' + nf(c.projects, l) + '</b>' + esc(t(l, 'si_n')) + '</div><div><b>' + nf(c.visible_change, l) + '</b>' + esc(t(l, 'si_vis')) + '</div><div><b>' + nf(c.rising, l) + '</b>' + esc(NT.rising) + '</div><div><b>' + nf(c.flat, l) + '</b>' + esc(NT.flat) + '</div></div>' +
    app(l, 'si') + table(t(l, 'si_th'), rows) + sec(t(l, 'method'), paras(l, 'si_p')) + sec(t(l, 'limits'), paras(l, 'si_lim')) + '<p class="k-xs">' + esc(d.source) + '</p>' + filesList(l, [['/data/construction-index.json', 'JSON'], ['/data/construction-progress.json', 'JSON']]);
  return page(shell, l, Object.assign(H(l, 'si'), { path: '/satellite/construction-index/', body: b, updated: d.built, crumb: [[t(l, 'sat'), '/satellite/']] }));
}

const json = (o, extra) => new Response(JSON.stringify(o, null, 1), { headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=60' }, extra || {}) });
export async function handle(req, u, env, ctx, shell) {
  const p = u.pathname; let m;
  if (!PATHS.test(p) || (req.method !== 'GET' && req.method !== 'HEAD')) return null;
  if (/^\/sql\/?$/.test(p)) return new Response(null, { status: 301, headers: { location: '/data/sql/' + u.search, 'cache-control': 'public, max-age=86400' } });
  if (p === '/api/v1/stream') return stream(req, u, env, ctx);
  if (p === '/api/v1/provenance') { try { return json(await provenance(env)); } catch (e) { return json({ error: 'unavailable' }); } }
  if (!(await loadT(env))) return null;
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
