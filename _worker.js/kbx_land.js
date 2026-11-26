// kolaboro.com batch 19 (n19c): rules on the land. No model calls, no keys.
// Data (built on main by .github/workflows/kolaboro-land-rules.yml, tools/kolaboro-agent/land_rules.py; same projects and pins as
// /data/construction-progress.json):
//   /data/land-rules.json   protected and restricted land at and near each pin: Natura 2000 (EEA, CC BY 4.0), England planning data
//                           (green belt, conservation areas, SSSI, National Landscapes, national parks, SAC, SPA, Ramsar, ancient
//                           woodland; OGL v3.0), Spain coast distance against the Ley de Costas easements, OpenStreetMap protected areas (ODbL)
//   /data/map-history.json  OpenStreetMap history within 150 m of each pin: when buildings, roads and land use were first mapped and last changed
// Shown on named project pages (kbx_named.js): section #land ("Protected land") and #maphist ("Map history").
// Routes: GET /api/x/land/<ID>  both records of one project (public, cacheable)
//         GET /api/x/land/      about
// The live check for any pin stays at /api/x/u/protected (kbx_u.js, OpenStreetMap and mangroves), shown on /hazards/.
import { TB } from './kbx_strings.js';   // n32w: string tables loaded as static JSON (worker size limit)
const ORIGIN = 'https://kolaboro.com';
export const PATHS = /^\/api\/x\/land(\/|$)/;
let MEMO = {};
async function loadOne(env, name) {
  const m = MEMO[name]; if (m && Date.now() - m.t < 600000) return m.v;
  let r = null;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + name)); } catch (e) { r = null; }
  if (!r || !r.ok) { try { r = await fetch(ORIGIN + '/data/' + name + '?w=1', { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
  const v = r && r.ok ? await r.json().catch(() => null) : null;
  MEMO[name] = { t: Date.now(), v }; return v;
}
export async function landData(env) {
  const [lr, mh, hz] = await Promise.all([loadOne(env, 'land-rules.json'), loadOne(env, 'map-history.json'), loadOne(env, 'hazards.json')]);   // n30c: hazards for the pin check
  return { lr, mh, hz, v: ((lr && lr.updated) || '') + '/' + ((mh && mh.updated) || '') + '/' + ((hz && hz.updated) || '') };
}

// ------------------------------------------------------------------------------------------------ strings (8 languages)
const S = TB.kbx_land_S /* n32w (19 Nov 2026): table moved to /data/i18n/kbx_land.json, filled by kbx_strings.js before any kolaboro.com request is handled */;
const t = (lang, k, v) => { const s = (S[lang] && S[lang][k]) || S.en[k]; return v && typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
const tm = (lang, k, key) => ((S[lang] && S[lang][k]) || {})[key] || (S.en[k] || {})[key] || null;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cm = lang => lang === 'ar' ? '، ' : lang === 'zh' ? '，' : ', ';
const okU = u => typeof u === 'string' && /^https:\/\/[^\s"<>]+$/.test(u);
export const landToc = lang => t(lang, 'toc');
export const landHeading = lang => t(lang, 'h');
export const histToc = lang => t(lang, 'mtoc');
export const histHeading = lang => t(lang, 'mh');

/* CSS: n40 k17, in /data/i18n/k17s.json */

// n20p: one formatter per locale and options for the life of the isolate (building one per call cost most of the render time)
const dtf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'd' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.DateTimeFormat(L, o)); };
const nmf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'n' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.NumberFormat(L, o)); };
const num = (v, lang) => { try { return nmf(lang === 'en' ? 'en-GB' : lang).format(v); } catch (e) { return String(v); } };
const src = (href, label) => okU(href) ? '<a class="k-src" href="' + esc(href) + '" rel="noopener" target="_blank">' + esc(label) + '</a>' : '';

// ------------------------------------------------------------------------------------------------ #land
export function landHtml(ld, x, lang, fd) {
  const lr = ld && ld.lr, r = lr && lr.projects && lr.projects[x.id];
  if (!r) return '';
  const S0 = lr.sources || {}, acc = r.acc || 100, lat = (x.fx || {}).lat, lng = (x.fx || {}).lng, ck = fd(r.checked || lr.updated);
  const m = v => t(lang, 'about', { m: num(v, lang) });
  const rows = [];
  if (r.n2k || (r.scope || []).includes('n2k')) {
    const n = r.n2k || {}, s = S0.n2k || {}, rel = n.release ? fd(n.release) : '';
    let dd;
    const site = o => '<bdi>' + esc(o.name || o.code) + '</bdi> (' + esc(o.code) + ', ' + esc(tm(lang, 'ty', o.type) || o.type || '') + ')' + (okU(s.sdf) ? ' ' + src(s.sdf + encodeURIComponent(o.code), t(lang, 'sdf')) : '');
    if (!n.ok) dd = '<span class="k-muted">' + esc(t(lang, 'unav', { d: ck })) + '</span>';
    else if ((n.in || []).length) dd = n.in.map(o => esc(t(lang, 'n2in', { n: o.name || o.code, c: o.code, t: tm(lang, 'ty', o.type) || o.type || '' })) + (okU(s.sdf) ? ' ' + src(s.sdf + encodeURIComponent(o.code), t(lang, 'sdf')) : '')).join('<br>') +
      ((n.near || []).length ? '<ul class="kl">' + n.near.map(o => '<li>' + site(o) + ', ' + esc(m(o.d)) + '</li>').join('') + '</ul>' : '');
    else if ((n.near || []).length) dd = esc(t(lang, 'n2near')) + '<ul class="kl">' + n.near.map(o => '<li>' + site(o) + ', ' + esc(m(o.d)) + '</li>').join('') + '</ul>';
    else dd = esc(t(lang, 'n2none'));
    rows.push([t(lang, 'n2k'), dd + ' ' + src(s.url, t(lang, 'n2src', { r: rel || '?' }))]);
  }
  if (r.es) {
    const e = r.es, s = S0.es || {};
    let dd = !e.ok ? '<span class="k-muted">' + esc(t(lang, 'unav', { d: ck })) + '</span>' : esc(e.sea_m === 0 ? t(lang, 'sea0') : e.sea_m == null ? t(lang, 'seafar') : t(lang, 'sea', { m: num(e.sea_m, lang) }));
    dd += '<br>' + esc(t(lang, 'eslaw')) + ' ' + src(s.law, t(lang, 'law'));
    if (e.ok && e.sea_m != null && e.sea_m <= 600) dd += '<br>' + esc(t(lang, 'esnear'));
    dd += '<br><span class="k-muted">' + esc(e.mit === 'capabilities' ? t(lang, 'esmit_ok') : t(lang, 'esmit', { d: fd(((s.miteco || {}).checked) || r.checked) })) + '</span> ' + src(s.viewer, t(lang, 'viewer'));
    rows.push([t(lang, 'es'), dd]);
  }
  if ((r.scope || []).includes('eng')) {
    const e = r.eng || {}, s = S0.eng || {};
    const open = lat != null ? 'https://www.planning.data.gov.uk/map/#' + (+lat).toFixed(5) + ',' + (+lng).toFixed(5) + ',16z' : 'https://www.planning.data.gov.uk/map/';
    let dd;
    if (!e.ok) dd = '<span class="k-muted">' + esc(t(lang, 'engerr', { d: ck })) + '</span> ' + src(open, t(lang, 'engopen'));
    else if ((e.hits || []).length) dd = '<ul class="kl">' + e.hits.map(h => '<li>' + esc(tm(lang, 'ds', h.ds) || h.ds) + (h.name ? ': <bdi>' + esc(h.name) + '</bdi>' : '') + ', ' + esc(h.in ? t(lang, 'engin') : m(h.d)) +
      (h.entity ? ' ' + src('https://www.planning.data.gov.uk/entity/' + encodeURIComponent(h.entity), (h.ref || String(h.entity))) : '') + '</li>').join('') + '</ul>';
    else dd = esc(t(lang, 'engnone', { l: (s.datasets || []).map(k => tm(lang, 'ds', k) || k).join(', ') }));
    rows.push([t(lang, 'eng'), dd + ' ' + src(s.url, t(lang, 'engsrc'))]);
  }
  if ((r.scope || []).includes('sco')) rows.push([t(lang, 'sco'), esc(t(lang, 'scotx')) + ' ' + src('https://sitelink.nature.scot/map', t(lang, 'sitelink'))]);
  if (r.osm) {
    const o = r.osm, s = S0.osm || {}, kn = k => tm(lang, 'kind', k) || k;
    let dd;
    if (!o.ok) dd = '<span class="k-muted">' + esc(t(lang, 'unav', { d: ck })) + '</span>';
    else {
      dd = (o.in || []).map(a => esc(t(lang, 'osin', { k: kn(a.kind), n: a.name ? '"' + a.name + '"' : '' }).replace(/\s+\./, '.'))).join('<br>');
      if ((o.near || []).length) dd += (dd ? '<br>' : esc(t(lang, 'osnear'))) + '<ul class="kl">' + o.near.map(a => '<li>' + esc(kn(a.kind)) + (a.name ? ' <bdi>"' + esc(a.name) + '"</bdi>' : '') + ', ' + esc(m(a.d)) + '</li>').join('') + '</ul>';
      if (!dd) dd = esc(t(lang, 'osnone'));
    }
    rows.push([t(lang, 'osm'), dd + '<br><span class="k-muted k-small">' + esc(t(lang, 'oslim')) + '</span> ' + src(s.url, t(lang, 'ossrc', { b: fd(o.build || s.build || lr.updated) }))]);
  }
  if (!rows.length) return '';
  const q = lat != null ? '?lat=' + (+lat).toFixed(4) + '&lng=' + (+lng).toFixed(4) : '';
  return TB.kbx_land__s.CSS + '<div class="kland"><p class="ki">' + esc(t(lang, 'intro', { d: ck, a: num(acc, lang) })) + '</p>' +
    '<dl class="kl-led">' + rows.map(([a, b]) => '<dt>' + esc(a) + '</dt><dd>' + b + '</dd>').join('') + '</dl>' +
    '<p class="lim">' + esc(t(lang, 'lim')) + '</p><p class="srcl"><a href="/hazards/' + esc(q) + '#protected">' + esc(t(lang, 'live')) + '</a><a href="/api/x/land/' + encodeURIComponent(x.id) + '">' + esc(t(lang, 'method')) + cm(lang) + esc(t(lang, 'upd', { d: fd(lr.updated) })) + '</a></p></div>';
}

// ------------------------------------------------------------------------------------------------ #maphist
function tagLabel(lang, tag) {
  const v = String(tag || '').split('=')[1] || '';
  const k = String(tag || '').split('=')[0];
  if (k === 'building') return tm(lang, 'tag', 'construction') && v === 'construction' ? t(lang, 'mb') + ' (' + tm(lang, 'tag', 'construction') + ')' : t(lang, 'mb');
  if (k === 'highway') return t(lang, 'mr');
  return tm(lang, 'tag', v) || null;
}
const osmU = (ty, id) => 'https://www.openstreetmap.org/' + (ty === 'r' ? 'relation' : 'way') + '/' + encodeURIComponent(id) + '/history';
export function histHtml(ld, x, lang, fd) {
  const mh = ld && ld.mh, r = mh && mh.projects && mh.projects[x.id];
  if (!r) return '';
  const acc = r.acc || 100, s = mh.source || {};
  if (!r.ok) return TB.kbx_land__s.CSS + '<div class="kland"><p class="k-muted">' + esc(t(lang, 'unav', { d: fd(r.checked || mh.updated) })) + '</p></div>';
  const b = r.b || {}, rd = r.r || {}, l = r.l || {};
  const line = o => o && o.n ? esc(t(lang, 'mn', { n: num(o.n, lang), a: fd(o.first), b: fd(o.last) })) : '<span class="k-muted">' + esc(t(lang, 'm0')) + '</span>';
  const tagHtml = tag => { const lb = tagLabel(lang, tag); return lb ? esc(lb) + ' <bdi><code>' + esc(tag) + '</code></bdi>' : '<bdi><code>' + esc(tag) + '</code></bdi>'; };
  const rows = [[t(lang, 'mb'), line(b)], [t(lang, 'mr'), line(rd)]];
  const land = [];   // one row per kind and name: several unnamed forest patches read as one line
  for (const a of (r.land || []).filter(a => a.first)) {
    const g = land.find(o => o.tag === a.tag && (o.name || '') === (a.name || ''));
    if (!g) land.push(Object.assign({ k: 1 }, a));
    else { g.k++; if (a.first < g.first) Object.assign(g, { first: a.first, t: a.t, id: a.id }); if ((a.last || '') > (g.last || '')) g.last = a.last; }
  }
  rows.push([t(lang, 'ml'), land.length ? '<ul class="kl">' + land.map(a => '<li>' + tagHtml(a.tag) + (a.name ? ' <bdi>"' + esc(a.name) + '"</bdi>' : '') + (a.k > 1 ? ' (' + num(a.k, lang) + ')' : '') + ': ' + '<bdi>' + esc(fd(a.first)) + (a.last && a.last !== a.first ? ', ' + esc(fd(a.last)) : '') + '</bdi>' + ' ' + src(osmU(a.t, a.id), t(lang, 'hist')) + '</li>').join('') + '</ul>' : '<span class="k-muted">' + esc(t(lang, 'm0')) + '</span>']);
  const cons = (r.cons || []).filter(c => c.first);
  if (cons.length) rows.push([t(lang, 'mcons'), esc(t(lang, 'mcn', { n: num(cons.length, lang), a: fd(cons[0].first) })) + ' ' + src(osmU(cons[0].t, cons[0].id), t(lang, 'hist'))]);
  if (!b.n && !rd.n && !l.n) return TB.kbx_land__s.CSS + '<div class="kland"><p class="ki">' + esc(t(lang, 'mintro')) + '</p><p>' + esc(t(lang, 'none')) + '</p><p class="srcl">' + src(s.url, t(lang, 'msrc')) + '</p></div>';
  // buildings by year first mapped: every year from the first to the year of the check, so gaps show
  let yr = '';
  const by = b.by_year || {}, ys = Object.keys(by).map(Number).filter(Boolean);
  if (ys.length) {
    const y0 = Math.min(...ys), y1 = Math.max(Number(String(r.checked || mh.updated).slice(0, 4)) || y0, ...ys), mx = Math.max(...Object.values(by));
    const span = []; for (let y = Math.max(y0, y1 - 19); y <= y1; y++) span.push(y);
    const lab = span.length > 10 ? (y => y === span[0] || y === y1 || y % 5 === 0) : (() => true);
    yr = '<h3>' + esc(t(lang, 'myr')) + '</h3><ul class="klh-yr" role="list">' + span.map(y => { const n = by[y] || 0; return '<li' + (n ? '' : ' class="z"') + ' aria-label="' + y + ': ' + n + '">' + (n ? '<b>' + num(n, lang) + '</b>' : '') + '<i style="height:' + (n ? Math.max(4, Math.round(n / mx * 52)) : 1) + 'px"></i><span>' + (lab(y) ? "'" + String(y).slice(2) : '&nbsp;') + '</span></li>'; }).join('') + '</ul>' +
      (y0 < span[0] ? '<p class="lim">' + esc(t(lang, 'mn', { n: num(Object.entries(by).filter(([k]) => +k < span[0]).reduce((a, [, v]) => a + v, 0), lang), a: y0, b: span[0] - 1 })) + '</p>' : '');
  }
  // timeline: first building, first road, first time each kind of land use was drawn, first construction tag, busiest year, latest change
  const ev = [];
  if (b.first) ev.push([b.first, t(lang, 't_b1')]);
  if (rd.first) ev.push([rd.first, t(lang, 't_r1')]);
  const seen = new Set();
  for (const a of land.slice().sort((p, q) => (p.first || '').localeCompare(q.first || ''))) { const k = tagLabel(lang, a.tag) || a.tag; if (seen.has(k) || seen.size >= 3) continue; seen.add(k); ev.push([a.first, t(lang, 't_l1', { k: k.charAt(0).toUpperCase() + k.slice(1) })]); }
  if (cons.length) ev.push([cons[0].first, t(lang, 't_c1')]);
  const top = Object.entries(by).sort((p, q) => q[1] - p[1])[0];
  if (top && top[1] >= 3 && Object.keys(by).length > 1) ev.push([top[0] + '-12-31', t(lang, 't_yr', { n: num(top[1], lang), y: top[0] }), top[0]]);
  const rc = (r.recent || [])[0];
  if (rc && rc.last) ev.push([rc.last, t(lang, 't_last', { k: tagLabel(lang, rc.tag) || rc.tag }), null, osmU(rc.t, rc.id)]);
  ev.sort((p, q) => p[0].localeCompare(q[0]));
  const tl = ev.length ? '<h3>' + esc(t(lang, 'tl')) + '</h3><ol class="klh-tl">' + ev.map(([d, txt, y, u]) => '<li><time datetime="' + esc(y || d) + '">' + esc(y || fd(d)) + '</time>' + esc(txt) + (u ? ' ' + src(u, t(lang, 'hist')) : '') + '</li>').join('') + '</ol>' : '';
  return TB.kbx_land__s.CSS + '<div class="kland"><p class="ki">' + esc(t(lang, 'mintro')) + '</p><dl class="kl-led">' + rows.map(([a, c]) => '<dt>' + esc(a) + '</dt><dd>' + c + '</dd>').join('') + '</dl>' + yr + tl +
    '<p class="lim">' + esc(t(lang, 'mlim', { a: num(acc, lang) })) + '</p><p class="srcl">' + src(s.url, t(lang, 'msrc')) + '<a href="/api/x/land/' + encodeURIComponent(x.id) + '">' + esc(t(lang, 'method')) + cm(lang) + esc(t(lang, 'upd', { d: fd(mh.updated) })) + '</a></p></div>';
}

// ------------------------------------------------------------------------------------------------ API
const J = (o, s = 200, age = 0) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': age ? 'public, max-age=' + age : 'no-store', 'x-content-type-options': 'nosniff' } });
export async function handle(req, u, env) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return J({ error: 'GET only' }, 405);
  const id = decodeURIComponent(u.pathname.replace(/^\/api\/x\/land\/?/, '').replace(/\/$/, ''));
  const ld = await landData(env).catch(() => null);
  if (!ld || (!ld.lr && !ld.mh)) return J({ error: 'data not published yet' }, 503);
  const pick = f => f ? Object.fromEntries(Object.entries(f).filter(([k]) => k !== 'projects')) : null;
  if (!id || id === 'about') return J({ about: TB.kbx_land__s.k0,
    land_rules: pick(ld.lr), map_history: pick(ld.mh), projects: Object.keys((ld.lr && ld.lr.projects) || {}).length, files: ['/data/land-rules.json', '/data/map-history.json'], example: '/api/x/land/CDS-001' }, 200, 3600);
  if (!/^[A-Z0-9-]{3,20}$/.test(id)) return J({ error: 'bad id' }, 400);
  const a = ld.lr && ld.lr.projects && ld.lr.projects[id], b = ld.mh && ld.mh.projects && ld.mh.projects[id];
  if (!a && !b) return J({ error: 'not found', note: 'Only named projects with a plot-level pin are covered.' }, 404, 600);
  return J({ id, land_rules: a || null, map_history: b || null, sources: Object.assign({}, (ld.lr || {}).sources || {}, { osm_history: (ld.mh || {}).source || null }), method: (ld.mh || {}).method || null, updated: { land_rules: (ld.lr || {}).updated || null, map_history: (ld.mh || {}).updated || null } }, 200, 3600);
}
