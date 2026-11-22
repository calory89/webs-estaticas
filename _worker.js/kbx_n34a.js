// kolaboro.com batch 34 (agent n34a, 21 Nov 2026): data and verification engine. The worker renders page shells, two small JSON
// endpoints and a few blocks added to existing pages; data are static files built by /open/n34a-build.py (published files only) and by
// two jobs on main (tools/kolaboro-agent/source_health.py, register_diff.py); browser code is static under /k/n34a/.
//   GET /[l/]track-record/                    developer track record over time (dated series from our snapshots), method and sample sizes
//   GET /[l/]sources/health/                  every cited source re-read weekly: live share, changed, dead, archived copies
//   GET /[l/]claims/evidence/                 claim to evidence: the passage of the cited page that carries each claim
//   GET /[l/]registers/changes/               dated diff of official register records for tracked projects since the last read
//   GET /[l/]watch/duplicates/                lookalike projects: same image, same page text, same pin, same official page
//   GET /[l/]numbers/intervals/               bootstrap 95% intervals for market statistics (also on /numbers/, /m/<market>/, /delays/)
//   GET /[l/]engineering/reproducible/        one command rebuilds the data and checks the published hashes; latest result
//   GET /[l/]data/history/                    record history API: every dated version of a project record with a JSON diff
//   GET /[l/]engineering/data-quality/pins/   pins against the address and the market boundary (OpenStreetMap)
//   GET /[l/]data/formats/                    GeoJSON, JSON-LD, SQLite with hash, size and version
//   GET /api/v1/projects/<id|slug>/history    versions (?full=1 adds every full version) | GET /api/v1/projects/<id|slug>/evidence
//   GET /api/v1/developers/<slug>/track-record
// Strings in 8 languages: /data/n34a-i18n.json (static asset, read once per isolate).
const ORIGIN = 'https://kolaboro.com';
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const V = 'a1';
let T = null;
async function loadT(env) {
  if (T) return T;
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/n34a-i18n.json')); if (r.ok) T = await r.json(); } catch (e) {}
  if (!T) { try { const r = await fetch(ORIGIN + '/data/n34a-i18n.json', { cf: { cacheTtl: 300 } }); if (r.ok) T = await r.json(); } catch (e) {} }
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
const slugM = m => String(m).toLowerCase().replace(/\s+/g, '-');
const LP = '(?:(es|de|fr|nl|ru|zh|ar)\\/)?';
const F = { tr: 'track-record', sh: 'sources\\/health', ev: 'claims\\/evidence', rc: 'registers\\/changes', du: 'watch\\/duplicates', iv: 'numbers\\/intervals', rp: 'engineering\\/reproducible', hi: 'data\\/history', pi: 'engineering\\/data-quality\\/pins', fm: 'data\\/formats' };
const R = {}; for (const k in F) R[k] = new RegExp('^\\/' + LP + F[k] + '\\/?$');
export const PATHS = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:track-record|sources\/health|claims\/evidence|registers\/changes|watch\/duplicates|numbers\/intervals|engineering\/reproducible|data\/history|engineering\/data-quality\/pins|data\/formats)\/?$|^\/api\/v1\/projects\/[A-Za-z0-9-]{1,90}\/(?:history|evidence)$|^\/api\/v1\/developers\/[a-z0-9-]{1,90}\/track-record$/;
// pages that get a block from this module (see inject)
export const INJECT = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?(?:numbers|delays|m\/[^/.]{2,60}|developers\/[a-z0-9-]{1,90}|projects\/[a-z0-9-]{1,90}|engineering|yc|data|engineering\/data-quality|registers)\/$/;
const ALL = [['tr', '/track-record/'], ['sh', '/sources/health/'], ['ev', '/claims/evidence/'], ['rc', '/registers/changes/'], ['du', '/watch/duplicates/'], ['iv', '/numbers/intervals/'], ['rp', '/engineering/reproducible/'], ['hi', '/data/history/'], ['pi', '/engineering/data-quality/pins/'], ['fm', '/data/formats/']];

const CSS = '<style>.n34{max-width:1100px}.n34 h2{margin:28px 0 8px;font-size:1.3rem}.n34 p,.n34 li{max-width:78ch;line-height:1.6}.n34-tw{overflow-x:auto;border:1px solid var(--line,#d5d3cc);border-radius:12px;margin:10px 0 22px;-webkit-overflow-scrolling:touch}' +
  '.n34 table{width:100%;border-collapse:collapse;font-size:.93rem}.n34 th,.n34 td{padding:8px 10px;border-bottom:1px solid var(--line,#d5d3cc);text-align:start;vertical-align:top}.n34 th{font-size:.82rem;background:var(--card,#fff)}.n34 td.n{font-variant-numeric:tabular-nums;white-space:nowrap}' +
  '.n34 code,.n34 pre{font-size:.88em;overflow-wrap:anywhere}.n34 pre{white-space:pre-wrap;background:var(--card,#f6f5f1);border:1px solid var(--line,#d5d3cc);border-radius:10px;padding:10px 12px;overflow-x:auto}.n34 .k-xs{font-size:.9rem;color:var(--muted,#59626B)}' +
  '.n34-rel{display:flex;flex-wrap:wrap;gap:4px 16px;padding:0;list-style:none}.n34-rel a{display:inline-flex;min-height:44px;align-items:center}.n34-k{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0}.n34-k div{border:1px solid var(--line,#d5d3cc);border-radius:12px;padding:8px 12px;min-width:120px}.n34-k b{display:block;font-size:1.25rem}' +
  ':root[data-theme=dark] .n34 [stroke="#59626B"]{stroke:#9DA9B3}:root[data-theme=dark] .n34 [style="color:#59626B"]{color:#9DA9B3!important}:root[data-theme=dark] .n34 [stroke="#2563EB"]{stroke:#7AA7FF}:root[data-theme=dark] .n34 [style="color:#2563EB"]{color:#7AA7FF!important}:root[data-theme=dark] .n34 [stroke="#B42318"]{stroke:#FF8A7A}:root[data-theme=dark] .n34 [style="color:#B42318"]{color:#FF8A7A!important}:root[data-theme=dark] .n34 [stroke="#B54708"]{stroke:#F2A65A}:root[data-theme=dark] .n34 [style="color:#B54708"]{color:#F2A65A!important}:root[data-theme=dark] .n34 [stroke="#0B7A55"]{stroke:#5BD6A2}:root[data-theme=dark] .n34 [style="color:#0B7A55"]{color:#5BD6A2!important}' +
  '.n34 .ok{color:#0B7A55;font-weight:700}.n34 .bad{color:#B42318;font-weight:700}.n34 .mut{color:var(--muted,#59626B)}:root[data-theme=dark] .n34 .ok{color:#4BE3A4}:root[data-theme=dark] .n34 .bad{color:#FF8A80}' +
  '.n34 input,.n34 select{font:inherit;min-height:44px;padding:8px 10px;border:1px solid var(--line,#c9c6bd);border-radius:10px;background:var(--card,#fff);color:inherit;max-width:100%}.n34 button{min-height:44px}.n34 form{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0}' +
  '.n34 svg{max-width:100%;height:auto}.n34-q{border-inline-start:3px solid var(--line,#d5d3cc);padding-inline-start:10px;margin:4px 0}@media print{.n34-tw{overflow:visible;border:0}}</style>';
const table = (th, rows) => '<div class="n34-tw" tabindex="0"><table><thead><tr>' + th.map(x => '<th scope="col">' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
const N = () => import('./kbx_named.js');
const rel = (l, skip) => '<h2>' + esc(t(l, 'more')) + '</h2><ul class="n34-rel">' + ALL.filter(x => x[0] !== skip).map(x => '<li><a href="' + pre(l) + x[1] + '">' + esc(t(l, x[0] + '_t')) + '</a></li>').join('') + '<li><a href="/engineering/">' + esc(t(l, 'eng')) + '</a></li></ul>';
const paras = (l, k) => (t(l, k) || []).map(p => '<p>' + esc(p) + '</p>').join('');
const sec = (h, b, id) => '<h2' + (id ? ' id="' + id + '"' : '') + '>' + esc(h) + '</h2>' + b;
const filesList = (l, fs) => '<ul>' + fs.map(f => '<li><a href="' + esc(f[0]) + '"' + (l === 'ar' ? ' dir="ltr"' : '') + '>' + esc(f[0]) + '</a>' + (f[1] ? ' <span class="k-xs">' + esc(f[1]) + '</span>' : '') + '</li>').join('') + '</ul>';
const kpis = xs => '<div class="n34-k">' + xs.map(x => '<div><b>' + x[0] + '</b>' + esc(x[1]) + '</div>').join('') + '</div>';
const pUrl = (l, s) => pre(l) + '/projects/' + s + '/';
const ext = u => '<a href="' + esc(u) + '" rel="nofollow noopener" target="_blank">' + esc(hostOf(u)) + '</a>';

async function page(shell, l, o) {
  const n = await N(), canon = ORIGIN + pre(l) + o.path;
  const crumbs = [[t(l, 'home'), pre(l) + '/']].concat(o.crumb || []).concat([[o.h1, null]]);
  const body = '<section class="phero"' + (l === 'ar' ? ' dir="rtl"' : '') + '><div class="wrap"><p class="crumb">' + crumbs.map(c => c[1] ? '<a href="' + esc(c[1]) + '">' + esc(c[0]) + '</a>' : esc(c[0])).join(' / ') + '</p><h1>' + esc(o.h1) + '</h1><p class="lead">' + esc(o.lead) + '</p>' +
    (o.updated ? '<p class="k-xs">' + esc(fill(t(l, 'upd'), { d: fd(o.updated, l) })) + '</p>' : '') + '</div></section><div class="wrap n34"' + (l === 'ar' ? ' dir="rtl"' : '') + '>' + CSS + o.body + rel(l, o.k) + '</div>';
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': o.type || 'WebPage', url: canon, name: o.h1, description: o.lead, inLanguage: l, dateModified: o.updated || '2026-11-21', isPartOf: { '@type': 'WebSite', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c[0], item: c[1] ? ORIGIN + c[1] : canon })) }].concat(o.ld || []) };
  const desc = o.lead.length > 155 ? o.lead.slice(0, 152).replace(/\s+\S*$/, '') + '…' : o.lead;
  const html = await n.assemble({ title: (o.h1.length > 46 ? o.h1.slice(0, 46).replace(/\s+\S*$/, '') : o.h1) + ' | Kolaboro', desc, canon, body, ld, alt: x => ORIGIN + pre(x) + o.path }, l, await shell(pre(l) + '/how-we-score/'));
  const h = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=' + (o.maxAge || 900), 'content-language': l };
  if (o.noindex) h['x-robots-tag'] = 'noindex, follow';
  return new Response(html, { status: 200, headers: h });
}
const H = (l, k) => ({ h1: t(l, k + '_t'), lead: t(l, k + '_l'), k });
const json = (o, st, extra) => new Response(JSON.stringify(o), { status: st || 200, headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=300', 'x-robots-tag': 'noindex' }, extra || {}) });

// ------------------------------------------------------------------------------------------------ shared: ids, slugs, history shards
const CRC = (() => { const a = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; a[n] = c >>> 0; } return a; })();
const crc32 = s => { let c = 0xFFFFFFFF; for (const b of new TextEncoder().encode(s)) c = CRC[(c ^ b) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
async function resolve(env, key) {
  const ix = await file(env, '/data/n34a/history/index.json', 3600000); if (!ix) return null;
  if (/^[A-Z]{2,5}-\d{1,4}$/.test(key)) return Object.values(ix.slugs).includes(key) ? { id: key, slug: Object.keys(ix.slugs).find(s => ix.slugs[s] === key) } : null;
  return ix.slugs[key] ? { id: ix.slugs[key], slug: key } : null;
}
async function versions(env, id) {
  const sh = await file(env, '/data/n34a/history/' + String(crc32(id) % 32).padStart(2, '0') + '.json', 3600000);
  return sh && sh.p ? sh.p[id] || null : null;
}
function apply(base, ops) {
  const o = JSON.parse(JSON.stringify(base));
  const seg = p => p.split('/').slice(1).map(x => x.replace(/~1/g, '/').replace(/~0/g, '~'));
  for (const op of ops) {
    const s = seg(op.path); if (!s.length || op.path === '/') return op.value;
    let c = o; for (let i = 0; i < s.length - 1; i++) { if (c[s[i]] == null) c[s[i]] = {}; c = c[s[i]]; }
    const k = s[s.length - 1];
    if (op.op === 'remove') { if (Array.isArray(c)) c.splice(+k, 1); else delete c[k]; }
    else if (op.op === 'add' && Array.isArray(c) && k === '-') c.push(op.value);
    else c[k] = op.value;
  }
  return o;
}
async function historyApi(env, u, key) {
  const r = await resolve(env, key); if (!r) return json({ error: 'not_found', id: key }, 404);
  const vs = await versions(env, r.id); if (!vs) return json({ error: 'not_found', id: key }, 404);
  const ix = await file(env, '/data/n34a/history/index.json', 3600000);
  const full = u.searchParams.get('full') === '1';
  let cur = null;
  const out = vs.map((v, i) => { cur = i ? apply(cur, v.ops) : v.base; const o = { version: i + 1, date: v.d, record_sha256: v.sha, snapshot_sha256: v.file, changes: i ? v.ops : null }; if (full || i === vs.length - 1) o.record = cur; return o; });
  return json({ api: 'kolaboro-history-v1', id: r.id, slug: r.slug, page: ORIGIN + '/projects/' + r.slug + '/', versions_n: out.length, diff: ix.diff, record_hash: ix.record_hash, snapshots: ORIGIN + '/data/snapshots/',
    note: 'Each version is the record as published on that day (from the dated snapshot copies, or the live file for the newest day). "changes" lists what changed since the version before.', licence: 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)', versions: out });
}
async function evidenceApi(env, key) {
  const r = await resolve(env, key); if (!r) return json({ error: 'not_found', id: key }, 404);
  const [e, vs] = await Promise.all([file(env, '/data/evidence.json', 3600000), versions(env, r.id)]);
  if (!vs) return json({ error: 'not_found', id: key }, 404);
  let cur = null; for (let i = 0; i < vs.length; i++) cur = i ? apply(cur, vs[i].ops) : vs[i].base;
  const ev = ((e && e.p) || {})[r.slug] || [], by = new Map(ev.map(x => [x[0], x]));
  return json({ api: 'kolaboro-evidence-v1', id: r.id, slug: r.slug, method: e ? e.method : null, read: e ? e.updated : null,
    claims: (cur.cl || []).map((c, i) => { const x = by.get(i); return { n: i, claim: c[0], status: c[1], checked_against: c[2], source: c[3] || null, passage: x && x[1] ? x[1] : null, match_share: x ? x[2] : null, read: x ? x[3] : null }; }) });
}

// ------------------------------------------------------------------------------------------------ 1. track record
const TR_COLS = [['p', 1], ['ho', 2], ['past', 3], ['mv', 9], ['pn', 5]];
const TR_COL = { p: '#59626B', ho: '#2563EB', past: '#B42318', mv: '#B54708', pn: '#0B7A55' };
function trChart(l, d) {
  const W = 640, Hh = 190, L0 = 34, B0 = 26, n = d.days.length, mx = Math.max(1, ...d.days.map(r => r[1]));
  const x = i => L0 + (n === 1 ? (W - L0 - 10) / 2 : i * (W - L0 - 10) / (n - 1)), y = v => Hh - B0 - v / mx * (Hh - B0 - 12);
  const lab = t(l, 'tr_s');
  let s = '<svg viewBox="0 0 ' + W + ' ' + Hh + '" width="' + W + '" height="' + Hh + '" role="img" aria-label="' + esc(fill(t(l, 'tr_alt'), { n: d.n })) + '"><g font-size="11" fill="currentColor">';
  s += '<line x1="' + L0 + '" y1="' + y(0) + '" x2="' + (W - 10) + '" y2="' + y(0) + '" stroke="currentColor" stroke-opacity=".3"/><text x="' + (L0 - 4) + '" y="' + (y(mx) + 4) + '" text-anchor="end">' + mx + '</text><text x="' + (L0 - 4) + '" y="' + (y(0) + 4) + '" text-anchor="end">0</text>';
  [0, n - 1].forEach(i => { s += '<text x="' + x(i) + '" y="' + (Hh - 8) + '" text-anchor="' + (i ? 'end' : 'start') + '">' + esc(fd(d.days[i][0], l)) + '</text>'; });
  for (const [k, j] of TR_COLS) s += '<polyline fill="none" stroke="' + TR_COL[k] + '" stroke-width="2" points="' + d.days.map((r, i) => x(i).toFixed(1) + ',' + y(r[j] || 0).toFixed(1)).join(' ') + '"/>';
  s += '</g></svg><p class="k-xs">' + TR_COLS.map(([k]) => '<span style="color:' + TR_COL[k] + '">&#9632;</span> ' + esc(lab[k])).join(' · ') + '</p>';
  return s;
}
function trTable(l, d) {
  const lab = t(l, 'tr_s');
  return '<details><summary>' + esc(t(l, 'tr_tab')) + '</summary>' + table([t(l, 'date')].concat(TR_COLS.map(([k]) => lab[k])).concat([lab.cv, lab.cx]), d.days.map(r => '<tr><td class="n">' + esc(fd(r[0], l)) + '</td>' + TR_COLS.map(([, j]) => '<td class="n">' + bdi(l, nf(r[j] || 0, l)) + '</td>').join('') + '<td class="n">' + nf(r[6], l) + '</td><td class="n">' + nf(r[7], l) + '</td></tr>')) + '</details>';
}
function trEvents(l, d, max) {
  const ev = d.ev.filter(e => e[1] !== 'add').slice(-max).reverse(), lab = t(l, 'tr_e');
  if (!ev.length) return '<p class="mut">' + esc(t(l, 'tr_noev')) + '</p>';
  return '<ul>' + ev.map(e => '<li><span class="k-xs">' + esc(fd(e[0], l)) + '</span> ' + esc(lab[e[1]] || e[1]) + ': <a href="' + pUrl(l, e[2]) + '">' + esc(e[2]) + '</a>' + (e[3] ? ' <span class="k-xs" lang="en" dir="ltr">' + esc(e[3]) + '</span>' : '') + '</li>').join('') + '</ul>';
}
export async function devBlock(env, l, slug) {
  if (!(await loadT(env))) return '';
  const d = await file(env, '/data/n34a/track-record.json', 3600000); const x = d && d.d[slug]; if (!x || !x.days.length) return '';
  return '<section id="track-record" class="n34"' + (l === 'ar' ? ' dir="rtl"' : '') + '>' + CSS + '<h2>' + esc(t(l, 'tr_dh')) + '</h2><p>' + esc(fill(t(l, 'tr_dl'), { n: nf(x.days.length, l), a: fd(x.days[0][0], l), b: fd(x.days[x.days.length - 1][0], l) })) + '</p>' + trChart(l, x) + trTable(l, x) + trEvents(l, x, 8) +
    '<p class="k-xs"><a href="' + pre(l) + '/track-record/">' + esc(t(l, 'tr_t')) + '</a> · <a href="/api/v1/developers/' + esc(slug) + '/track-record" rel="nofollow">JSON</a></p></section>';
}
async function trPage(env, shell, l, u) {
  const d = await file(env, '/data/n34a/track-record.json', 3600000); if (!d) return null;
  const s = d.sample, lab = t(l, 'tr_s'), v = d.versions;
  const one = u.searchParams.get('d'); const x1 = one && d.d[one];
  const rows = d.top.map(k => { const x = d.d[k], r = x.days[x.days.length - 1]; return '<tr><th scope="row"><a href="' + pre(l) + '/developers/' + esc(k) + '/#track-record">' + esc(x.n) + '</a></th><td class="n">' + nf(r[1], l) + '</td><td class="n">' + nf(r[2], l) + '</td><td class="n">' + nf(r[3], l) + '</td><td class="n">' + nf(r[9], l) + '</td><td class="n">' + nf(r[5], l) + '</td><td class="n">' + nf(r[6], l) + ' / ' + nf(r[7], l) + '</td><td class="n">' + nf(x.ev.filter(e => e[1] !== 'add').length, l) + '</td></tr>'; });
  const ek = t(l, 'tr_e');
  const b = '<p><b>' + esc(t(l, 'nv')) + '</b></p>' + kpis([[nf(s.developers, l), t(l, 'tr_k')[0]], [nf(v.length, l), t(l, 'tr_k')[1]], [nf(s.latest.mv || 0, l), lab.mv], [nf(s.latest.past || 0, l), lab.past], [nf(s.latest.pn || 0, l), lab.pn]]) +
    (x1 ? sec(x1.n, trChart(l, x1) + trTable(l, x1) + trEvents(l, x1, 30)) : '') +
    sec(t(l, 'tr_top'), table(t(l, 'tr_th'), rows)) +
    sec(t(l, 'tr_evh'), '<ul>' + Object.keys(d.events).map(k => '<li>' + esc(ek[k] || k) + ': <b>' + nf(s.events[k] || 0, l) + '</b></li>').join('') + '</ul>') +
    sec(t(l, 'method'), paras(l, 'tr_p') + '<p>' + esc(fill(t(l, 'tr_sample'), { d: nf(s.developers, l), m: nf(s.with_two_or_more_days, l), e: nf(s.with_events, l), v: nf(v.length, l), a: fd(v[0], l), b: fd(v[v.length - 1], l) })) + '</p>') +
    filesList(l, [['/data/n34a/track-record.json', 'JSON'], ['/data/snapshots/', t(l, 'snaps')], ['/open/n34a-build.py', 'Python']]);
  return page(shell, l, Object.assign(H(l, 'tr'), { path: '/track-record/', body: b, updated: d.built, noindex: !!one, crumb: [[t(l, 'devs'), pre(l) + '/developers/']] }));
}

// ------------------------------------------------------------------------------------------------ 2. source health
const stCls = s => typeof s === 'number' ? (s < 400 ? 'ok' : 'bad') : s === 'e' ? 'bad' : 'mut';
const stTxt = (l, s) => typeof s === 'number' ? String(s) : (t(l, 'sh_st')[s] || s);
const archL = (l, d, r) => { const u = r[0]; if (r[6] === 'k' && d.own && d.own[u]) return '<a href="/projects/' + esc(d.own[u]) + '/changes/">' + esc(t(l, 'sh_ar').k) + '</a>'; if (r[6] === 'w' && d.wayback && d.wayback[u]) return '<a href="https://web.archive.org/web/' + esc(d.wayback[u]) + '/' + esc(u) + '" rel="nofollow noopener" target="_blank">' + esc(t(l, 'sh_ar').w) + ' ' + esc(d.wayback[u].slice(0, 4)) + '</a>'; return '<a href="https://web.archive.org/web/*/' + esc(u) + '" rel="nofollow noopener" target="_blank">' + esc(t(l, 'sh_ar').l) + '</a>'; };
const cites = (l, d, u) => ((d.cites || {})[u] || []).slice(0, 2).map(s => '<a href="' + pUrl(l, s) + '">' + esc(s) + '</a>').join(', ');
async function shPage(env, shell, l, u) {
  const d = await file(env, '/data/source-health.json', 900000); if (!d) return null;
  const c = d.counts || {}, chk = d.checked || 0, pct = chk ? Math.round(d.live / chk * 1000) / 10 : 0;
  const wk = new Date(Date.parse(d.updated + 'T00:00:00Z') - 7 * 864e5).toISOString().slice(0, 10);
  const changed = d.u.filter(r => r[4] && r[4] >= wk && r[4] !== r[5]).sort((a, b) => b[4] < a[4] ? -1 : 1);
  const dead = d.u.filter(r => typeof r[1] === 'number' && r[1] >= 400 || r[1] === 'e');
  const host = (u.searchParams.get('h') || '').toLowerCase().replace(/[^a-z0-9.-]/g, '').slice(0, 80);
  const row = r => '<tr><td style="overflow-wrap:anywhere"><a href="' + esc(r[0]) + '" rel="nofollow noopener" target="_blank" dir="ltr">' + esc(r[0].replace(/^https?:\/\/(www\.)?/, '').slice(0, 80)) + '</a></td><td>' + cites(l, d, r[0]) + '</td><td class="n"><span class="' + stCls(r[1]) + '">' + esc(stTxt(l, r[1])) + '</span>' + (r[7] ? ' <span class="k-xs">→ ' + esc(r[7]) + '</span>' : '') + '</td><td class="n">' + esc(fd(r[2], l)) + '</td><td class="n">' + esc(r[4] && r[4] !== r[5] ? fd(r[4], l) : '') + '</td><td>' + archL(l, d, r) + '</td></tr>';
  const byHost = {}; for (const r of d.u) { const h = hostOf(r[0]); const o = byHost[h] = byHost[h] || [0, 0]; o[0]++; if (typeof r[1] === 'number' && r[1] < 400) o[1]++; }
  const hosts = Object.entries(byHost).sort((a, b) => b[1][0] - a[1][0]).slice(0, 15);
  const th = t(l, 'sh_th');
  const b = kpis([[bdi(l, nf(pct, l, 1) + '%'), t(l, 'sh_k')[0]], [nf(chk, l), fill(t(l, 'sh_k')[1], { n: nf(d.n, l) })], [nf(changed.length, l), t(l, 'sh_k')[2]], [nf(dead.length, l), t(l, 'sh_k')[3]], [nf(c.r || 0, l), t(l, 'sh_k')[4]]]) +
    (host ? sec(host, table(th, d.u.filter(r => hostOf(r[0]) === host).slice(0, 300).map(row))) : '') +
    sec(t(l, 'sh_chg'), changed.length ? table(th, changed.slice(0, 60).map(row)) : '<p class="mut">' + esc(t(l, 'sh_nochg')) + '</p>') +
    sec(t(l, 'sh_dead'), dead.length ? table(th, dead.slice(0, 80).map(row)) + (dead.length > 80 ? '<p class="k-xs">' + esc(fill(t(l, 'sh_more'), { n: nf(dead.length - 80, l) })) + ' <a href="/data/source-health.json">JSON</a></p>' : '') : '<p class="mut">-</p>') +
    sec(t(l, 'sh_hosts'), table(t(l, 'sh_hth'), hosts.map(([h, o]) => '<tr><th scope="row"><a href="?h=' + esc(h) + '" rel="nofollow">' + esc(h) + '</a></th><td class="n">' + nf(o[0], l) + '</td><td class="n">' + bdi(l, nf(o[0] ? o[1] / o[0] * 100 : 0, l, 1) + '%') + '</td></tr>'))) +
    sec(t(l, 'method'), paras(l, 'sh_p') + '<p class="k-xs">' + esc(fill(t(l, 'sh_run'), { d: fd(d.updated, l), n: nf(d.read_today || 0, l) })) + '</p>') + filesList(l, [['/data/source-health.json', 'JSON'], ['/open/source_health.py', 'Python']]);
  return page(shell, l, Object.assign(H(l, 'sh'), { path: '/sources/health/', body: b, updated: d.updated, noindex: !!host }));
}

// ------------------------------------------------------------------------------------------------ 3. claim evidence
async function evPage(env, shell, l, u) {
  const e = await file(env, '/data/evidence.json', 3600000); if (!e) return null;
  const slugs = Object.keys(e.p);
  const withQ = slugs.filter(s => e.p[s].some(x => x[1]));
  const pick = (u.searchParams.get('p') || '').replace(/[^a-z0-9-]/g, '').slice(0, 90);
  let one = '';
  if (pick && e.p[pick]) {
    const r = await resolve(env, pick); const vs = r && await versions(env, r.id);
    let cur = null; if (vs) for (let i = 0; i < vs.length; i++) cur = i ? apply(cur, vs[i].ops) : vs[i].base;
    if (cur) one = sec(cur.n, table(t(l, 'ev_th'), (cur.cl || []).map((c, i) => { const x = e.p[pick].find(y => y[0] === i); return '<tr><td lang="en" dir="ltr">' + esc(c[0]) + '</td><td>' + esc(t(l, 'cst')[c[1]] || c[1]) + '</td><td>' + (x && x[1] ? '<p class="n34-q" lang="und" dir="auto">' + esc(x[1]) + '</p><span class="k-xs">' + esc(fill(t(l, 'ev_q'), { h: hostOf(c[3]), d: fd(x[3], l) })) + '</span>' : '<span class="mut">' + esc(x ? fill(t(l, 'ev_none'), { d: fd(x[3], l) }) : t(l, 'ev_nr')) + '</span>') + '</td><td>' + (c[3] ? ext(c[3]) : '') + '</td></tr>'; })) + '<p><a href="' + pUrl(l, pick) + '#claims">' + esc(t(l, 'ev_back')) + '</a></p>');
  }
  const sample = withQ.slice(0, 40).map(s => '<li><a href="?p=' + esc(s) + '" rel="nofollow">' + esc(s) + '</a> <span class="k-xs">' + nf(e.p[s].filter(x => x[1]).length, l) + '/' + nf(e.p[s].length, l) + '</span></li>').join('');
  const b = kpis([[nf(e.n_claims, l), t(l, 'ev_k')[0]], [nf(e.n_quotes, l), t(l, 'ev_k')[1]], [nf(withQ.length, l), t(l, 'ev_k')[2]]]) +
    '<form method="get"><label for="n34p">' + esc(t(l, 'project')) + '</label> <input id="n34p" name="p" value="' + esc(pick) + '" placeholder="amani-melasti" autocomplete="off"> <button type="submit">' + esc(t(l, 'ev_btn')) + '</button></form>' + one +
    sec(t(l, 'ev_some'), '<ul class="n34-rel">' + sample + '</ul>') + sec(t(l, 'method'), paras(l, 'ev_p') + '<p class="k-xs">' + esc(e.method) + '</p>') +
    filesList(l, [['/data/evidence.json', 'JSON'], ['/api/v1/projects/amani-melasti/evidence', 'API'], ['/open/source_health.py', 'Python']]);
  return page(shell, l, Object.assign(H(l, 'ev'), { path: '/claims/evidence/', body: b, updated: e.updated, noindex: !!pick, crumb: [[t(l, 'cs'), pre(l) + '/claims/search/']] }));
}
export async function projBlock(env, l, slug, nonce) {
  if (!(await loadT(env))) return '';
  const r = await resolve(env, slug); if (!r) return '';
  return '<p class="n34-evb"><button type="button" class="btn ghost" data-n34ev="' + esc(slug) + '" data-l="' + l + '" data-q="' + esc(t(l, 'ev_q')) + '" data-nq="' + esc(t(l, 'ev_none')) + '" data-hide="' + esc(t(l, 'ev_hide')) + '" aria-expanded="false">' + esc(t(l, 'ev_btn')) + '</button> <a href="' + pre(l) + '/claims/evidence/?p=' + esc(slug) + '" rel="nofollow">' + esc(t(l, 'ev_t')) + '</a> · <a href="/api/v1/projects/' + esc(r.id) + '/history" rel="nofollow">' + esc(t(l, 'hi_t')) + '</a></p><script' + nonce + ' src="/k/n34a/ev.js?v=' + V + '" defer></script>';
}

// ------------------------------------------------------------------------------------------------ 4. register changes
const val = v => v == null || v === '' ? '-' : typeof v === 'number' ? String(v) : String(v).slice(0, 80);
async function rcPage(env, shell, l) {
  const d = await file(env, '/data/register-changes.json', 900000); if (!d) return null;
  const reads = table(t(l, 'rc_rth'), d.reads.map(r => '<tr><th scope="row">' + esc(r.register) + '</th><td class="n">' + nf(r.records, l) + '</td><td class="n">' + nf(r.read_ok, l) + '</td><td class="n">' + nf(r.changed_records, l) + '</td><td class="n">' + nf(r.changed_fields, l) + '</td><td class="n">' + esc(fd(r.read, l)) + '</td></tr>'));
  const ch = d.changes.slice(0, 300);
  const b = '<p><b>' + esc(t(l, 'nv')) + '</b></p>' + sec(t(l, 'rc_reads'), reads) +
    sec(t(l, 'rc_ch'), ch.length ? table(t(l, 'rc_th'), ch.map(c => '<tr><th scope="row">' + (c.s ? '<a href="' + pUrl(l, c.s) + '">' + esc(c.n) + '</a>' : esc(c.id)) + '<br><span class="k-xs">' + esc(c.mk || '') + '</span></th><td>' + esc(c.register) + '</td><td><code>' + esc(c.field) + '</code></td><td dir="auto">' + esc(val(c.before)) + '<br><span class="k-xs">' + esc(fd(c.before_d, l)) + '</span></td><td dir="auto"><b>' + esc(val(c.after)) + '</b><br><span class="k-xs">' + esc(fd(c.after_d, l)) + '</span></td><td>' + ext(c.url) + '</td></tr>')) : '<p class="mut">' + esc(t(l, 'rc_none')) + '</p>') +
    sec(t(l, 'method'), paras(l, 'rc_p')) + filesList(l, [['/data/register-changes.json', 'JSON'], ['/data/register-captures.json', 'JSON'], ['/open/register_diff.py', 'Python']]);
  return page(shell, l, Object.assign(H(l, 'rc'), { path: '/registers/changes/', body: b, updated: d.updated, crumb: [[t(l, 'regs'), pre(l) + '/registers/']] }));
}

// ------------------------------------------------------------------------------------------------ 5. duplicates
async function duPage(env, shell, l, u) {
  const d = await file(env, '/data/n34a/duplicates.json', 3600000); if (!d) return null;
  const sg = t(l, 'du_sig');
  const only = ['image', 'text', 'pin', 'url'].includes(u.searchParams.get('s')) ? u.searchParams.get('s') : null;
  const ps = d.pairs.filter(x => !only || x.s[only]);
  const sig = x => Object.entries(x.s).map(([k, v]) => '<b>' + esc(sg[k]) + '</b>' + (k === 'text' ? ' ' + bdi(l, nf(v.v * 100, l) + '%') : k === 'image' ? ' ×' + nf(v.v, l) : '')).join('<br>');
  const side = (n, s, m, dv, uu) => '<a href="' + pUrl(l, s) + '">' + esc(n) + '</a><br><span class="k-xs">' + esc(m) + ' · ' + esc(dv) + '</span>' + (uu ? '<br>' + ext(uu) : '');
  const rows = ps.slice(0, 200).map(x => '<tr><td>' + side(x.na, x.sa, x.ma, x.da, x.ua) + '</td><td>' + side(x.nb, x.sb, x.mb, x.db, x.ub) + '</td><td>' + sig(x) + '</td><td>' + esc([x.cross_market ? t(l, 'du_cm') : '', x.same_dev ? t(l, 'du_sd') : t(l, 'du_dd'), x.same_host ? t(l, 'du_sh') : ''].filter(Boolean).join(' · ')) + '</td></tr>');
  const k = d.counts;
  const nav = '<p>' + ['image', 'text', 'pin', 'url'].map(s => '<a href="?s=' + s + '" rel="nofollow">' + esc(sg[s]) + '</a> <span class="k-xs">(' + nf(d.pairs.filter(x => x.s[s]).length, l) + ')</span>').join(' · ') + (only ? ' · <a href="./">' + esc(t(l, 'all')) + '</a>' : '') + '</p>';
  const b = '<p><b>' + esc(t(l, 'nv')) + '</b></p>' + kpis([[nf(k.pairs, l), t(l, 'du_k')[0]], [nf(k.different_developer, l), t(l, 'du_k')[1]], [nf(k.cross_market, l), t(l, 'du_k')[2]], [nf(d.compared.projects, l), t(l, 'du_k')[3]]]) + nav +
    table(t(l, 'du_th'), rows) + sec(t(l, 'method'), paras(l, 'du_p') + '<ul>' + Object.entries(d.signals).map(([s, v]) => '<li><b>' + esc(sg[s]) + '</b>: <span lang="en" dir="ltr">' + esc(v) + '</span></li>').join('') + '</ul>') +
    '<p><a href="' + pre(l) + '/watch/lookalikes/images/">' + esc(t(l, 'du_img')) + '</a> · <a href="' + pre(l) + '/corrections/">' + esc(t(l, 'fix')) + '</a></p>' + filesList(l, [['/data/n34a/duplicates.json', 'JSON'], ['/open/n34a-build.py', 'Python']]);
  return page(shell, l, Object.assign(H(l, 'du'), { path: '/watch/duplicates/', body: b, updated: d.built, noindex: !!only }));
}

// ------------------------------------------------------------------------------------------------ 6. intervals
const ci = (l, a, d, u) => a ? bdi(l, nf(a[0], l, d) + (u || '') + ' – ' + nf(a[1], l, d) + (u || '')) : '<span class="mut">' + esc(t(l, 'iv_small')) + '</span>';
function ivRowsD(l, rows) { return rows.map(r => '<tr><th scope="row">' + (r.mk === 'All markets' ? esc(t(l, 'allm')) : '<a href="/m/' + esc(slugM(r.mk)) + '/">' + esc(r.mk) + '</a>') + '</th><td class="n">' + (r.median_late != null ? nf(r.median_late, l, 1) : '-') + '</td><td class="n">' + ci(l, r.median_ci, 1) + '</td><td class="n">' + nf(r.n_late, l) + '</td><td class="n">' + bdi(l, nf(r.share_past_first, l, 1) + '%') + '</td><td class="n">' + ci(l, r.share_ci, 1, '%') + '</td><td class="n">' + nf(r.with_date, l) + '</td></tr>'); }
async function ivPage(env, shell, l) {
  const d = await file(env, '/data/n34a/intervals.json', 3600000); if (!d) return null;
  const dl = d.delay.filter(r => r.mk === 'All markets' || r.with_date >= 10).sort((a, b) => (b.mk === 'All markets') - (a.mk === 'All markets') || b.with_date - a.with_date);
  const pp = d.ppm.slice().sort((a, b) => b.n - a.n);
  const b = sec(t(l, 'iv_dh'), table(t(l, 'iv_thd'), ivRowsD(l, dl))) +
    sec(t(l, 'iv_ph'), table(t(l, 'iv_thp'), pp.map(r => '<tr><th scope="row"><a href="/m/' + esc(slugM(r.mk)) + '/">' + esc(r.mk) + '</a></th><td>' + esc(r.cur) + '</td><td class="n">' + bdi(l, nf(r.median, l)) + '</td><td class="n">' + ci(l, r.ci, 0) + '</td><td class="n">' + nf(r.n, l) + '</td></tr>'))) +
    sec(t(l, 'method'), paras(l, 'iv_p') + '<ul>' + Object.entries(d.method).map(([k, v]) => '<li><code>' + esc(k) + '</code> <span lang="en" dir="ltr">' + esc(v) + '</span></li>').join('') + '</ul>') +
    '<p><a href="' + pre(l) + '/numbers/">' + esc(t(l, 'numbers')) + '</a> · <a href="' + pre(l) + '/delays/">' + esc(t(l, 'delays')) + '</a></p>' + filesList(l, [['/data/n34a/intervals.json', 'JSON'], ['/data/delay-index.json', 'JSON'], ['/open/n34a-build.py', 'Python']]);
  return page(shell, l, Object.assign(H(l, 'iv'), { path: '/numbers/intervals/', body: b, updated: d.built, crumb: [[t(l, 'numbers'), pre(l) + '/numbers/']] }));
}
async function ivBlock(env, l, mk) {
  const d = await file(env, '/data/n34a/intervals.json', 3600000); if (!d) return '';
  const lk = '<a href="' + pre(l) + '/numbers/intervals/">' + esc(t(l, 'iv_more')) + '</a>';
  if (mk) {
    const r = d.delay.find(x => slugM(x.mk) === mk), ps = d.ppm.filter(x => slugM(x.mk) === mk);
    if (!r && !ps.length) return '';
    const li = [];
    if (r && r.median_ci) li.push(fill(t(l, 'iv_ld'), { m: nf(r.median_late, l, 1), a: nf(r.median_ci[0], l, 1), b: nf(r.median_ci[1], l, 1), n: nf(r.n_late, l) }));
    if (r && r.share_ci) li.push(fill(t(l, 'iv_ls'), { s: nf(r.share_past_first, l, 1), a: nf(r.share_ci[0], l, 1), b: nf(r.share_ci[1], l, 1), n: nf(r.with_date, l) }));
    for (const p of ps) li.push(fill(t(l, 'iv_lp'), { c: p.cur, m: nf(p.median, l), a: nf(p.ci[0], l), b: nf(p.ci[1], l), n: nf(p.n, l) }));
    if (!li.length) return '';
    return '<section class="wrap n34" id="intervals"' + (l === 'ar' ? ' dir="rtl"' : '') + '>' + CSS + '<h2>' + esc(t(l, 'iv_bh')) + '</h2><ul>' + li.map(x => '<li>' + bdi(l, esc(x)) + '</li>').join('') + '</ul><p class="k-xs">' + esc(t(l, 'iv_note')) + ' ' + lk + '</p></section>';
  }
  const top = d.delay.filter(r => r.mk === 'All markets' || r.with_date >= 25).sort((a, b) => (b.mk === 'All markets') - (a.mk === 'All markets') || b.with_date - a.with_date).slice(0, 9);
  return '<section class="wrap n34" id="intervals"' + (l === 'ar' ? ' dir="rtl"' : '') + '>' + CSS + '<h2>' + esc(t(l, 'iv_bh')) + '</h2>' + table(t(l, 'iv_thd'), ivRowsD(l, top)) + '<p class="k-xs">' + esc(t(l, 'iv_note')) + ' ' + lk + '</p></section>';
}

// ------------------------------------------------------------------------------------------------ 7. reproducible builds
async function rpPage(env, shell, l) {
  const [b0, r0] = await Promise.all([file(env, '/data/n34a/build.json', 3600000), file(env, '/data/n34a/repro.json', 3600000)]); if (!b0) return null;
  const st = r0 ? r0.steps : [];
  const res = st.length ? table(t(l, 'rp_th'), st.map(s => '<tr><th scope="row">' + esc(s.step) + '</th><td>' + (s.match ? '<span class="ok">' + esc(t(l, 'rp_ok')) + '</span>' : '<span class="bad">' + esc(t(l, 'rp_no')) + '</span>') + '</td><td><code>' + esc(String(s.rebuilt_sha256 || s.published_outputs_sha256 || '').slice(0, 16)) + '</code>' + (s.commit ? ' <span class="k-xs">main@' + esc(s.commit) + '</span>' : '') + (s.outputs ? ' <span class="k-xs">' + nf(s.outputs, l) + ' ' + esc(t(l, 'rp_files')) + '</span>' : '') + '</td></tr>')) + '<p class="k-xs">' + esc(fill(t(l, 'rp_run'), { d: (r0.run_at || '').replace('T', ' ').slice(0, 16) + ' UTC' })) + '</p>' : '<p class="mut">-</p>';
  const outs = Object.entries(b0.outputs);
  const b = sec(t(l, 'rp_last'), res) + sec(t(l, 'rp_cmd'), '<pre dir="ltr"><code>curl -O https://kolaboro.com/open/n34a-build.py\n# download the files listed under "inputs" in /data/n34a/build.json into data/ (same paths)\npython3 n34a-build.py data --check</code></pre>' + paras(l, 'rp_c') + '<pre dir="ltr"><code>python3 _s/kolaboro.com/open/kolaboro-repro.py --repo . --ref origin/main --write</code></pre>') +
    sec(t(l, 'rp_io'), '<details><summary>' + esc(fill(t(l, 'rp_n'), { i: nf(Object.keys(b0.inputs).length, l), o: nf(outs.length, l) })) + '</summary>' + table(['', 'SHA-256'], Object.entries(b0.inputs).map(([k, v]) => '<tr><td><code>' + esc(k) + '</code></td><td><code>' + esc(v.slice(0, 16)) + '</code></td></tr>').concat(outs.map(([k, v]) => '<tr><td><code>' + esc(k) + '</code></td><td><code>' + esc(v.slice(0, 16)) + '</code></td></tr>'))) + '</details><p>' + esc(t(l, 'rp_all')) + ' <code>' + esc(b0.outputs_sha256) + '</code></p>') +
    sec(t(l, 'method'), paras(l, 'rp_p')) + filesList(l, [['/data/n34a/build.json', 'JSON'], ['/data/n34a/repro.json', 'JSON'], ['/open/n34a-build.py', 'Python'], ['/open/kolaboro-repro.py', 'Python']]);
  return page(shell, l, Object.assign(H(l, 'rp'), { path: '/engineering/reproducible/', body: b, updated: b0.built, crumb: [[t(l, 'eng'), '/engineering/']], type: 'TechArticle' }));
}

// ------------------------------------------------------------------------------------------------ 8. history API page
async function hiPage(env, shell, l, u) {
  const ix = await file(env, '/data/n34a/history/index.json', 3600000); if (!ix) return null;
  const pick = (u.searchParams.get('p') || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 90);
  let one = '';
  if (pick) {
    const r = await resolve(env, pick), vs = r && await versions(env, r.id);
    if (vs) one = sec(r.slug, table(t(l, 'hi_th'), vs.map((v, i) => '<tr><td class="n">' + esc(fd(v.d, l)) + '</td><td>' + (i ? '<details><summary>' + nf(v.ops.length, l) + '</summary><ul>' + v.ops.slice(0, 40).map(o => '<li><code>' + esc(o.op) + ' ' + esc(o.path) + '</code></li>').join('') + '</ul></details>' : esc(t(l, 'hi_first'))) + '</td><td><code>' + esc(v.sha.slice(0, 16)) + '</code></td></tr>')) + '<p><a href="/api/v1/projects/' + esc(r.id) + '/history">/api/v1/projects/' + esc(r.id) + '/history</a> · <a href="' + pUrl(l, r.slug) + '">' + esc(t(l, 'hi_page')) + '</a></p>');
    else one = '<p class="bad">' + esc(t(l, 'hi_nf')) + '</p>';
  }
  const vp = ix.versions_per_record;
  const b = kpis([[nf(ix.records, l), t(l, 'hi_k')[0]], [nf(ix.versions_from.length, l), t(l, 'hi_k')[1]], [nf(Object.entries(vp).reduce((s, [k, v]) => s + (+k) * v, 0), l), t(l, 'hi_k')[2]]]) +
    '<form method="get"><label for="n34h">' + esc(t(l, 'project')) + '</label> <input id="n34h" name="p" value="' + esc(pick) + '" placeholder="BALI-001 / amani-melasti" autocomplete="off"> <button type="submit">' + esc(t(l, 'hi_go')) + '</button></form>' + one +
    sec(t(l, 'hi_api'), '<pre dir="ltr"><code>GET https://kolaboro.com/api/v1/projects/BALI-001/history\nGET https://kolaboro.com/api/v1/projects/amani-melasti/history?full=1</code></pre>' + paras(l, 'hi_p') + '<ul><li><span lang="en" dir="ltr">' + esc(ix.diff) + '</span></li><li><span lang="en" dir="ltr">' + esc(ix.record_hash) + '</span></li></ul>') +
    sec(t(l, 'hi_dist'), table(t(l, 'hi_dth'), Object.entries(vp).map(([k, v]) => '<tr><td class="n">' + nf(+k, l) + '</td><td class="n">' + nf(v, l) + '</td></tr>'))) +
    sec(t(l, 'hi_from'), '<ul>' + ix.versions_from.map(v => '<li>' + esc(fd(v.d, l)) + ' <code>' + esc(v.file_sha256.slice(0, 16)) + '</code> <span class="k-xs">' + esc(v.kind) + '</span></li>').join('') + '</ul>') +
    filesList(l, [['/data/n34a/history/index.json', 'JSON'], ['/data/snapshots/', t(l, 'snaps')], ['/api/docs/', 'API']]);
  return page(shell, l, Object.assign(H(l, 'hi'), { path: '/data/history/', body: b, updated: ix.built, noindex: !!pick, crumb: [[t(l, 'data'), '/data/']] }));
}

// ------------------------------------------------------------------------------------------------ 9. pins
async function piPage(env, shell, l, u) {
  const d = await file(env, '/data/n34a/pins.json', 3600000); if (!d) return null;
  const fl = t(l, 'pi_f');
  const bad = d.p.filter(x => x.f.length);
  const b = '<p><b>' + esc(t(l, 'nv')) + '</b></p>' + kpis([[nf(d.pins, l), t(l, 'pi_k')[0]], [nf(d.with_boundary, l), t(l, 'pi_k')[1]], [nf(d.flagged, l), t(l, 'pi_k')[2]], [nf(d.boundaries.areas || 0, l), t(l, 'pi_k')[3]]]) +
    '<ul>' + Object.keys(d.flags).map(k => '<li><b>' + esc(fl[k] || k) + '</b>: ' + nf(d.counts[k] || 0, l) + '</li>').join('') + '</ul>' +
    sec(t(l, 'pi_list'), bad.length ? table(t(l, 'pi_th'), bad.map(x => '<tr><th scope="row"><a href="' + pUrl(l, x.s) + '#where">' + esc(x.n) + '</a></th><td>' + esc(x.mk) + '</td><td>' + esc(x.ar || '') + '</td><td>' + x.f.map(f => esc(fl[f] || f)).join('<br>') + '</td><td class="n">' + (x.f.includes('far_area') && x.da != null ? bdi(l, nf(x.da, l, 1) + ' km') : x.f.includes('outside') && x.do != null ? bdi(l, '+' + nf(x.do, l, 1) + ' km') : '') + '</td><td class="n"><a href="https://www.openstreetmap.org/?mlat=' + x.lat + '&amp;mlon=' + x.lng + '#map=15/' + x.lat + '/' + x.lng + '" rel="nofollow noopener" target="_blank" dir="ltr">' + x.lat.toFixed(4) + ', ' + x.lng.toFixed(4) + '</a></td></tr>')) : '<p class="mut">-</p>') +
    sec(t(l, 'method'), paras(l, 'pi_p') + '<ul>' + Object.entries(d.flags).map(([k, v]) => '<li><b>' + esc(fl[k] || k) + '</b>: <span lang="en" dir="ltr">' + esc(v) + '</span></li>').join('') + '</ul><p class="k-xs">' + esc(d.boundaries.source || '') + ' · ' + esc(fd(d.boundaries.read, l)) + '</p>') +
    '<p><a href="' + pre(l) + '/engineering/data-quality/">' + esc(t(l, 'dq')) + '</a> · <a href="' + pre(l) + '/corrections/">' + esc(t(l, 'fix')) + '</a></p>' + filesList(l, [['/data/n34a/pins.json', 'JSON'], ['/open/n34a-boundaries.py', 'Python'], ['/open/n34a-build.py', 'Python']]);
  return page(shell, l, Object.assign(H(l, 'pi'), { path: '/engineering/data-quality/pins/', body: b, updated: d.built, crumb: [[t(l, 'eng'), '/engineering/'], [t(l, 'dq'), pre(l) + '/engineering/data-quality/']] }));
}

// ------------------------------------------------------------------------------------------------ 10. formats
async function fmPage(env, shell, l) {
  const d = await file(env, '/data/formats.json', 3600000); if (!d) return null;
  const rows = d.files.map(f => '<tr><th scope="row"><a href="' + esc(f.path) + '" dir="ltr">' + esc(f.path.replace('/data/', '')) + '</a></th><td>' + esc(f.format) + '</td><td class="n">' + nf(f.rows, l) + '</td><td class="n">' + bdi(l, nf(f.bytes / 1048576, l, 2) + ' MB') + '</td><td><code title="' + esc(f.sha256) + '">' + esc(f.sha256.slice(0, 16)) + '…</code></td><td><code>' + esc(f.version) + '</code></td></tr>');
  const b = table(t(l, 'fm_th'), rows) + sec(t(l, 'fm_use'), '<pre dir="ltr"><code>sqlite3 kolaboro.sqlite "SELECT market, COUNT(*) FROM projects GROUP BY market ORDER BY 2 DESC LIMIT 10;"\nsqlite3 kolaboro.sqlite "SELECT status, COUNT(*) FROM claims GROUP BY status;"\nsha256sum kolaboro-pins.geojson</code></pre>' + paras(l, 'fm_p')) +
    sec(t(l, 'fm_other'), '<ul>' + d.other.map(o => '<li><a href="' + esc(o[0]) + '">' + esc(o[0]) + '</a> <span class="k-xs">' + esc(o[1]) + '</span></li>').join('') + '</ul>') + '<p class="k-xs">' + esc(fill(t(l, 'fm_src'), { h: d.source.sha256.slice(0, 16), v: d.source.version })) + '</p>' + filesList(l, [['/data/formats.json', 'JSON'], ['/open/n34a-build.py', 'Python']]);
  return page(shell, l, Object.assign(H(l, 'fm'), { path: '/data/formats/', body: b, updated: d.built, crumb: [[t(l, 'data'), '/data/']],
    ld: [{ '@type': 'Dataset', name: 'Kolaboro off-plan project records', version: d.source.version, license: 'https://creativecommons.org/licenses/by/4.0/', creator: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, dateModified: d.built,
      distribution: d.files.map(f => ({ '@type': 'DataDownload', encodingFormat: f.media_type, contentUrl: ORIGIN + f.path, contentSize: f.bytes + ' B' })) }] }));
}

// ------------------------------------------------------------------------------------------------ blocks on existing pages
const hub = l => '<section class="wrap n34" id="engine-2026-11-21"' + (l === 'ar' ? ' dir="rtl"' : '') + '><h2>' + esc(t(l, 'hub')) + '</h2><ul class="n34-rel">' + ALL.map(x => '<li><a href="' + pre(l) + x[1] + '">' + esc(t(l, x[0] + '_t')) + '</a></li>').join('') + '</ul></section>';
const one = (l, ks) => '<section class="wrap n34"' + (l === 'ar' ? ' dir="rtl"' : '') + '><ul class="n34-rel">' + ALL.filter(x => ks.includes(x[0])).map(x => '<li><a href="' + pre(l) + x[1] + '">' + esc(t(l, x[0] + '_t')) + '</a></li>').join('') + '</ul></section>';
export async function inject(req, u, env, r, nonce) {
  try {
    const m = /^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?(.*)$/.exec(u.pathname), l = m[1] || 'en', p = m[2];
    if (!/text\/html/.test(r.headers.get('content-type') || '')) return r;
    if (!(await loadT(env))) return r;
    let h = '', sel = 'main', where = 'append';
    let mm;
    if (p === 'engineering/' || p === 'yc/') h = hub(l);
    else if (p === 'numbers/' || p === 'delays/') h = await ivBlock(env, l, null) + one(l, ['iv']);
    else if ((mm = /^m\/([^/.]{2,60})\/$/.exec(p))) h = await ivBlock(env, l, decodeURIComponent(mm[1]).toLowerCase());
    else if ((mm = /^developers\/([a-z0-9-]{1,90})\/$/.exec(p))) { h = await devBlock(env, l, mm[1]); sel = '#record'; where = 'before'; }
    else if ((mm = /^projects\/([a-z0-9-]{1,90})\/$/.exec(p))) { h = await projBlock(env, l, mm[1], nonce || ''); sel = '#claims > details'; }
    else if (p === 'data/') h = one(l, ['fm', 'hi', 'rp']);
    else if (p === 'engineering/data-quality/') h = one(l, ['pi', 'sh', 'du']);
    else if (p === 'registers/') h = one(l, ['rc']);
    if (!h) return r;
    let done = false;
    const out = new HTMLRewriter().on(sel, { element(e) { if (done) return; done = true; if (where === 'before') e.before(h, { html: true }); else e.append(h, { html: true }); } });
    if (sel === '#record') out.on('main', { element(e) { e.onEndTag(end => { if (!done) { done = true; end.before(h, { html: true }); } }); } });   // a developer page without the record section
    return out.transform(r);
  } catch (e) { return r; }
}

export async function handle(req, u, env, ctx, shell) {
  const p = u.pathname; let m;
  if (!PATHS.test(p) || (req.method !== 'GET' && req.method !== 'HEAD')) return null;
  if ((m = /^\/api\/v1\/projects\/([A-Za-z0-9-]{1,90})\/(history|evidence)$/.exec(p))) { try { return m[2] === 'history' ? await historyApi(env, u, m[1]) : await evidenceApi(env, m[1]); } catch (e) { return json({ error: 'unavailable' }, 503); } }
  if ((m = /^\/api\/v1\/developers\/([a-z0-9-]{1,90})\/track-record$/.exec(p))) {
    const d = await file(env, '/data/n34a/track-record.json', 3600000), x = d && d.d[m[1]];
    if (!x) return json({ error: 'not_found', developer: m[1] }, 404);
    return json({ api: 'kolaboro-track-record-v1', developer: m[1], name: x.n, columns: d.columns, events_legend: d.events, days: x.days, events: x.ev, page: ORIGIN + '/developers/' + m[1] + '/#track-record', method: ORIGIN + '/track-record/', note: 'A historical record of what our dated records show, not a verdict.', licence: d.licence });
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
