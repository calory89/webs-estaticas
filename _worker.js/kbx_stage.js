// kolaboro.com batch 18 (n18b): construction stage estimate per month from open satellite and map data. Plain rules, no model,
// no training, no AI calls. Inputs are the public files the "from space" section already shows:
//   /data/construction-progress.json  Sentinel-2 L2A monthly change index of the 150 m circle (kbx_named_sat.js index())
//   /data/satellite-radar.json        Sentinel-1 RTC VV/VH change index, only for cloudy plots (kbx_space.js)
//   /data/buildings.json              Overture Maps building footprints touching the circle, with GERS first-seen release
//   developer's promised dates        /data/promises.json and the project record (kbx_named_sat.js milestones())
// Shown inside the "from space" section of named project pages (kbx_named_sat.js calls stageHtml) and in the time machine.
// Routes:
//   GET /api/x/stage/<ID>                          per-month estimate, confidence and reasons for one named project (JSON)
//   GET /methods/construction-stage/ (+ /<lang>/)  the rules in 8 languages
import { TB } from './kbx_strings.js';   // n32w: string tables loaded as static JSON (worker size limit)
const ORIGIN = 'https://kolaboro.com';
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOCALE = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
export const VERSION = 'stage-rules-1';
export const PATHS = /^\/api\/x\/stage(?:\/|$)/;
export const RULES = { optical_band_pts: 15, optical_window: 3, earthworks_after_clear_months: 3, radar_window: 3, footprint_cover_pct: 10, footprint_near_m: 75, already_built_pct: 50, min_clear_months: 6, start_grace_months: 6 };
const ORDER = ['none', 'cleared', 'earthworks', 'structure', 'roofed'];

// ------------------------------------------------------------------------------------------------ strings (8 languages)
const S = TB.kbx_stage_S /* n32w (19 Nov 2026): table moved to /data/i18n/kbx_stage.json, filled by kbx_strings.js before any kolaboro.com request is handled */;
const t = (lang, k, v) => { const s = (S[lang] && S[lang][k]) || S.en[k]; return v && typeof s === 'string' ? s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m) : s; };
export const stageWord = (lang, s) => t(lang, 'st_' + s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mi = s => { const m = String(s || '').match(/^(\d{4})-(\d{2})/); return m ? +m[1] * 12 + (+m[2] - 1) : null; };
const ym = i => Math.floor(i / 12) + '-' + String(i % 12 + 1).padStart(2, '0');
const med = a => { const v = a.slice().sort((x, y) => x - y), h = v.length >> 1; return v.length ? (v.length % 2 ? v[h] : (v[h - 1] + v[h]) / 2) : null; };
const r1 = v => Math.round(v * 10) / 10;
const sg = v => (v > 0 ? '+' : '') + v;
const relDate = r => String(r || '').replace(/\.\d+$/, '');
const pre = l => l === 'en' ? '' : '/' + l;

// ------------------------------------------------------------------------------------------------ the rules
// rec: one project of construction-progress.json; ix: kbx_named_sat.js index(rec) (null when fewer than 6 clear months);
// rd: satellite-radar.json; bd: buildings.json; ms: milestones() of the project (promised dates, old ones flagged).
// Returns { enough, months: [{ m, s, c, r: [[code, params], ...] }], latest } where s is a stage key, c 'high'|'medium'|'low'|null.
export function stages(rec, ix, rd, bd, ms, id) {
  const R = RULES, B = R.optical_band_pts;
  if (!rec || !rec.n || !rec.m0) return null;
  const m0 = mi(rec.m0), n = rec.n;
  const rr = rd && rd.projects && rd.projects[id] && rd.projects[id].status === 'ok' && rd.projects[id].y ? rd.projects[id] : null;
  const band = rd && rd.band_db != null ? rd.band_db : null;
  const bl = bd && bd.projects && bd.projects[id] || null;
  const clearN = rec.c.filter(v => v != null).length;
  if (!ix && !rr) return { enough: false, clear: clearN, months: [], latest: null };
  // buildings: from the month of first sighting (or the release, when the registry has no date) onwards
  const rel = bd ? relDate(bd.release) : '';
  const bCover = bl && bl.n ? bl.cover_pct || 0 : 0;
  const bFrom = bl && bl.n ? mi(bl.first_seen_min ? relDate(bl.first_seen_min) : rel) : null;
  const bNear = bl && bl.b && bl.b.length ? Math.min(...bl.b.map(b => b.d == null ? 1e9 : b.d)) : null;
  const bOk = bCover >= R.footprint_cover_pct && bFrom != null && bNear != null && bNear <= R.footprint_near_m;
  const baseIdx = ix ? new Set([ix.first[0], ...ix.y.map((v, i) => v == null ? -1 : i).filter(i => i >= 0).slice(0, 3)]) : new Set();
  const baseLabel = ix ? ym(m0 + ix.first[0]) : (rr ? rr.m0 : rec.m0);
  const baseBuilt = ix ? med([...baseIdx].map(i => rec.b[i]).filter(v => v != null)) : null;   // built-up or bare share of the circle at the start
  const built0 = baseBuilt != null && baseBuilt >= R.already_built_pct;
  const hand = ms.filter(o => o.k === 'handover' && !o.old).sort((a, b) => a.b - b.b).pop(), start = ms.filter(o => o.k === 'construction_start' && !o.old).sort((a, b) => a.b - b.b).pop();
  const out = []; let run = 0, ever = false, rEver = false, lastClear = null, firstUp = null;
  const optHist = [];
  for (let i = 0; i < n; i++) {
    const M = m0 + i, reasons = [], sup = [];
    // optical: median of the last 3 clear months up to this one, read only when this month itself is clear
    let o = null, ox = null;
    if (ix && ix.y[i] != null) {
      optHist.push(ix.y[i]); lastClear = M;
      ox = med(optHist.slice(-R.optical_window));
      if (baseIdx.has(i)) o = 'base';
      else if (ox >= B) { run++; o = run >= R.earthworks_after_clear_months ? 'earthworks' : 'cleared'; ever = true; if (firstUp == null) firstUp = M; }
      else if (ox <= -B) { run = 0; o = 'green'; }
      else { run = 0; o = 'same'; }
    }
    // radar: median of the last 3 months with data up to this one
    let r = null, rx = null, rh = null;
    if (rr && band != null) {
      const j = M - mi(rr.m0);
      if (j >= 0 && j < rr.n && rr.y[j] != null) {
        const ys = [], hs = []; for (let q = j; q >= 0 && ys.length < R.radar_window; q--) if (rr.y[q] != null) { ys.push(rr.y[q]); if (rr.yh && rr.yh[q] != null) hs.push(rr.yh[q]); }
        rx = r1(med(ys)); rh = hs.length ? r1(med(hs)) : null;
        r = rx > band ? 'up' : rx < -band ? 'down' : 'flat';
        if (r === 'up') rEver = true;
      }
    }
    const bm = bOk && M >= bFrom;
    // reasons, one per signal
    if (o === 'base') reasons.push(['o_base', { m: ym(M) }]);
    else if (o === 'cleared' || o === 'earthworks') reasons.push(['o_up', { x: sg(Math.round(ox)), base: baseLabel, k: run }]);
    else if (o === 'green') reasons.push(['o_green', { x: Math.abs(Math.round(ox)), base: baseLabel }]);
    else if (o === 'same') reasons.push(['o_same', { b: B, base: baseLabel }]);
    else reasons.push(lastClear != null ? ['o_gap', { m: ym(lastClear) }] : ['o_never', {}]);
    if (!rr) reasons.push(['r_na', {}]);
    else if (r == null) reasons.push(['r_gap', {}]);
    else { reasons.push([r === 'up' ? 'r_up' : r === 'down' ? 'r_down' : 'r_flat', { x: sg(rx), b: band }]); if (rh != null && rh < -band) reasons.push(['r_vh', { x: sg(rh) }]); }
    if (bl) {
      if (!bl.n) reasons.push(['b_no', { rel }]);
      else if (bCover < R.footprint_cover_pct) reasons.push(['b_low', { p: bCover, t: R.footprint_cover_pct, rel }]);
      else if (!bOk) reasons.push(['b_far', { d: bNear, t: R.footprint_near_m, rel }]);
      else if (bm) reasons.push(bl.first_seen_min ? ['b_yesf', { n: bl.n, p: bCover, rel, d: relDate(bl.first_seen_min) }] : ['b_yes', { n: bl.n, p: bCover, rel }]);
      else reasons.push(['b_later', { d: ym(bFrom) }]);
    }
    // stage
    let s, c = null;
    if (o == null && r == null && !bm) s = 'nodata';
    else if (o === 'base' && r !== 'up' && !bm) { s = 'base'; }
    else if (bm && (ever || rEver)) { s = 'roofed'; sup.push('b'); if (ever) { sup.push('o'); if (o !== 'cleared' && o !== 'earthworks') reasons.push(['o_ever', { b: B, m: ym(firstUp) }]); } if (rEver) sup.push('r'); }
    else if (bm && (o === 'same' || o === 'base' || o == null) && r !== 'up' && built0) { s = 'none'; c = 'low'; reasons.push(['d_pre', { p: Math.round(baseBuilt), base: baseLabel }]); }
    else if (bm && (o === 'same' || o === 'base' || o == null) && r !== 'up') { s = 'cant'; reasons.push(['d_bo', { base: baseLabel }]); }
    else if (r === 'up' && o === 'same' && built0) { s = 'structure'; sup.push('r'); reasons.push(['o_built', { p: Math.round(baseBuilt) }]); }
    else if (r === 'up' && (o === 'same' || o === 'base')) { s = 'cant'; reasons.push(['d_ro', {}]); }
    else if (r === 'up') { s = 'structure'; sup.push('r'); if (o === 'cleared' || o === 'earthworks') sup.push('o'); }
    else if (o === 'cleared' || o === 'earthworks') { s = o; sup.push('o'); if (o === 'cleared' && rh != null && rh < -band) sup.push('r'); }
    else if (o === 'green' || (bm && o === 'green')) { s = 'cant'; reasons.push(['d_g', {}]); }
    else if (o === 'same') { s = 'none'; sup.push('o'); if (r === 'flat') sup.push('r'); }
    else if (r === 'flat') { s = 'none'; sup.push('r'); }
    else if (r === 'down') { s = 'cant'; reasons.push(['d_rd', {}]); }
    else s = 'nodata';
    if (ORDER.includes(s) && !c) {
      const sustained = (sup.includes('o') && (s === 'none' ? optHist.length >= 3 : run >= 3)) || (sup.includes('r') && !sup.includes('o')) || s === 'roofed';
      c = sup.length >= 2 ? 'high' : sustained ? 'medium' : 'low';
    }
    // the developer's dates, as context (never raise confidence)
    if (hand && M > hand.b && s !== 'roofed') reasons.push(['p_hand', { d: hand.d }]);
    if (start && M > start.b + R.start_grace_months && (s === 'none' || s === 'base')) reasons.push(['p_start', { d: start.d }]);
    out.push({ m: ym(M), s, c, r: reasons });
  }
  const enough = clearN >= R.min_clear_months || !!rr;
  const latest = [...out].reverse().find(x => x.s !== 'nodata') || null;
  return { enough, clear: clearN, months: out, latest };
}

// ------------------------------------------------------------------------------------------------ HTML (inside the "from space" section)
const CSS = '<style id="kstage-css">.kstage{margin-top:28px;padding-top:4px;border-top:1px solid var(--k-line,var(--line))}.kstage h3{margin:18px 0 6px;font-size:var(--k-fs-lg,1.2rem)}' +
  '.kstage-now{margin:12px 0 0;padding:14px 16px;border:1px solid var(--k-line,var(--line));border-radius:var(--k-r-lg,14px);background:var(--k-surface,#fff)}.kstage-now .kstage-st{font-size:var(--k-fs-xl,1.4rem);font-weight:700;margin:2px 0 4px}.kstage-now ul{margin:8px 0 0;padding-inline-start:18px;line-height:1.5;font-size:var(--k-fs-sm,.94rem);color:var(--k-ink-2,var(--ink))}' +
  '.kstage-rib{display:flex;gap:1px;margin:16px 0 4px;height:26px;border-radius:var(--k-r-xs,4px);overflow:hidden}.kstage-rib i{flex:1 1 0;min-width:2px;display:block;background:var(--k-sunken,#E8ECEA)}' +
  '.kstage .s-cleared{background:color-mix(in srgb,var(--k-sea,#155C75) 22%,var(--k-surface,#fff))}.kstage .s-earthworks{background:color-mix(in srgb,var(--k-sea,#155C75) 45%,var(--k-surface,#fff))}.kstage .s-structure{background:color-mix(in srgb,var(--k-sea,#155C75) 72%,var(--k-surface,#fff))}.kstage .s-roofed{background:var(--k-sea,#155C75)}' +
  '.kstage .s-none,.kstage .s-base{background:var(--k-sunken,#E8ECEA)}.kstage .s-base{background:repeating-linear-gradient(90deg,var(--k-sunken,#E8ECEA) 0 3px,var(--k-line-2,#C9D0CD) 3px 4px)}.kstage .s-cant{background:repeating-linear-gradient(135deg,var(--k-surface,#fff) 0 3px,var(--k-muted,#56636F) 3px 4px)}.kstage .s-nodata{background:var(--k-surface,#fff);box-shadow:inset 0 0 0 1px var(--k-line,#D5DAD8)}' +
  '.kstage-yr{display:flex;justify-content:space-between;font-size:.72rem;color:var(--k-muted,var(--muted));font-variant-numeric:tabular-nums}.kstage-lg{display:flex;flex-wrap:wrap;gap:6px 16px;margin:10px 0 0;padding:0;list-style:none;font-size:var(--k-fs-xs,.82rem)}.kstage-lg li{display:flex;align-items:center;gap:6px}.kstage-lg i{display:inline-block;width:14px;height:14px;border-radius:3px}' +
  '.kstage .tw{overflow-x:auto}.kstage table{border-collapse:collapse;font-size:var(--k-fs-xs,.82rem);min-width:100%}.kstage th,.kstage td{text-align:start;padding:6px 8px;border-bottom:1px solid var(--k-line,var(--line));vertical-align:top;font-variant-numeric:tabular-nums}.kstage td:first-child{white-space:nowrap}</style>';

const SRC = { o: '/data/construction-progress.json', r: '/data/satellite-radar.json', b: '/data/buildings.json', d: '/promises/', p: '/promises/' };
function reasonText(lang, fd, code, p) {
  const q = Object.assign({}, p);
  for (const k of ['base', 'm', 'd', 'rel']) if (q[k] && /^\d{4}(-\d{2})?/.test(q[k])) q[k] = fd(q[k]);
  if (q.rel) q.rel = q.rel;
  return t(lang, code, q);
}
const srcOf = code => SRC[code[0]] || '';

// est: stages() result; fd(date) display date; returns the HTML block (empty when the project has no series)
export function stageHtml(est, lang, fd, id) {
  if (!est) return '';
  const head = '<h3>' + esc(t(lang, 'h')) + '</h3><p class="ki">' + esc(t(lang, 'intro')) + '</p>';
  const links = '<p class="ksat-src"><a href="' + pre(lang) + '/methods/construction-stage/">' + esc(t(lang, 'method')) + '</a> <a class="src" href="/api/x/stage/' + encodeURIComponent(id) + '">' + esc(t(lang, 'api')) + '</a></p>';
  if (!est.enough || !est.latest) return CSS + '<div class="kstage" id="stage">' + head + '<p>' + esc(t(lang, 'thin', { c: est.clear })) + '</p>' + links + '</div>';
  const L = est.latest;
  const li = L.r.map(([code, p]) => '<li>' + esc(reasonText(lang, fd, code, p)) + (srcOf(code) ? ' <a class="k-src" href="' + srcOf(code) + '">' + esc(code[0] === 'o' ? 'Sentinel-2' : code[0] === 'r' ? 'Sentinel-1' : code[0] === 'b' ? 'Overture' : t(lang, 'why')) + '</a>' : '') + '</li>').join('');
  const now = '<div class="kstage-now" role="group" aria-label="' + esc(t(lang, 'latest', { m: fd(L.m) })) + '"><div class="k-small k-muted">' + esc(t(lang, 'latest', { m: fd(L.m) })) + '</div><div class="kstage-st">' + esc(stageWord(lang, L.s)) + '</div>' +
    (L.c ? '<div>' + esc(t(lang, 'conf', { c: t(lang, 'c_' + L.c) })) + '</div>' : '') + '<ul aria-label="' + esc(t(lang, 'why')) + '">' + li + '</ul></div>';
  const M = est.months;
  const rib = '<div class="kstage-rib" dir="ltr" aria-hidden="true">' + M.map(x => '<i class="s-' + x.s + '" title="' + esc(fd(x.m) + ': ' + stageWord(lang, x.s) + (x.c ? ' (' + t(lang, 'c_' + x.c) + ')' : '')) + '"></i>').join('') + '</div>' +
    '<div class="kstage-yr" dir="ltr" aria-hidden="true"><span>' + esc(M[0].m.slice(0, 4)) + '</span><span>' + esc(M[Math.floor(M.length / 2)].m.slice(0, 4)) + '</span><span>' + esc(M[M.length - 1].m.slice(0, 4)) + '</span></div>';
  const used = [...new Set(M.map(x => x.s))];
  const lg = '<ul class="kstage-lg">' + ['base', 'none', 'cleared', 'earthworks', 'structure', 'roofed', 'cant', 'nodata'].filter(s => used.includes(s)).map(s => '<li><i class="s-' + s + '"></i>' + esc(stageWord(lang, s)) + '</li>').join('') + '</ul><p class="ksat-src">' + esc(t(lang, 'leg')) + '</p>';
  const th = t(lang, 'th');
  const sigs = x => x.r.map(([code, p]) => code === 'o_up' || code === 'o_green' || code === 'o_same' ? (code === 'o_same' ? '' : t(lang, 's_o', { x: code === 'o_green' ? '-' + p.x : p.x })) : code === 'r_up' || code === 'r_down' || code === 'r_flat' ? t(lang, 's_r', { x: p.x }) : code === 'b_yes' || code === 'b_yesf' ? t(lang, 's_b') : '').filter(Boolean).join(', ');
  const rows = M.slice().reverse().map(x => '<tr><td>' + esc(fd(x.m)) + '</td><td>' + esc(stageWord(lang, x.s)) + '</td><td>' + esc(x.c ? t(lang, 'c_' + x.c) : '') + '</td><td>' + esc(sigs(x)) + '</td></tr>').join('');
  const table = '<details><summary>' + esc(t(lang, 'tbl')) + '</summary><div class="tw"><table><thead><tr>' + th.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div></details>';
  return CSS + '<div class="kstage" id="stage">' + head + now + rib + lg + '<p class="ksat-lim">' + esc(t(lang, 'lim')) + '</p>' + links + table + '</div>';
}
// per-month stage words for the time machine (month -> [stage word, confidence word])
export function stageLabels(est, lang) {
  const o = {}; if (!est || !est.enough) return o;
  for (const x of est.months) o[x.m] = stageWord(lang, x.s) + (x.c ? ' (' + t(lang, 'c_' + x.c) + ')' : '');
  return o;
}

// ------------------------------------------------------------------------------------------------ routes
function out(o, s, cc) { return new Response(JSON.stringify(o), { status: s || 200, headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': cc || 'public, max-age=600' } }); }
async function inputs(env, id) {
  const ns = await import('./kbx_named_sat.js'), nm = await import('./kbx_named.js');
  const sat = await ns.satData(env), ix = await nm.data(env), x = ix.byId.get(id);
  if (!sat || !x) return null;
  const rec = sat.projects && sat.projects[id]; if (!rec) return { x, rec: null };
  const ms = ns.milestones(ix.prom[id] || [], x.fx || {});
  return { x, rec, sat, ms, est: stages(rec, ns.index(rec), sat.space && sat.space.radar, sat.space && sat.space.bld, ms, id) };
}
export async function handle(req, u, env) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: 'method not allowed' }, 405, 'no-store');
  const q = u.pathname.replace(/\/+$/, '');
  if (q === '/api/x/stage') return out({ module: 'stage (batch 18, n18b)', endpoints: { '/api/x/stage/<ID>': 'monthly construction stage estimate, confidence and reasons for one named project with a satellite series' }, rules: RULES, version: VERSION, method: ORIGIN + '/methods/construction-stage/', licence: 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)' });
  const id = decodeURIComponent(q.slice('/api/x/stage/'.length)).toUpperCase().slice(0, 20);
  if (!/^[A-Z]{1,6}-\d{1,4}$/.test(id)) return out({ error: 'give /api/x/stage/<ID> like AUH-003' }, 400, 'public, max-age=60');
  let d; try { d = await inputs(env, id); } catch (e) { return out({ error: 'unavailable' }, 503, 'no-store'); }
  if (!d || !d.x) return out({ id, error: 'no named project has this id' }, 404, 'public, max-age=300');
  if (!d.rec) return out({ id, error: 'no satellite series for this project (needs a plot-level pin)' }, 404, 'public, max-age=300');
  const e = d.est;
  return out({ id, name: d.x.n, page: ORIGIN + '/projects/' + d.x.s + '/', version: VERSION, rules: RULES, enough: e.enough, clear_months: e.clear,
    latest: e.latest && { month: e.latest.m, stage: e.latest.s, stage_text: stageWord('en', e.latest.s), confidence: e.latest.c, reasons: e.latest.r.map(([c, p]) => ({ code: c, text: t('en', c, p), params: p, source: srcOf(c) ? ORIGIN + srcOf(c) : null })) },
    months: e.months.map(x => ({ month: x.m, stage: x.s, confidence: x.c, reasons: x.r.map(([c]) => c) })),
    stages: Object.fromEntries(['base', 'none', 'cleared', 'earthworks', 'structure', 'roofed', 'cant', 'nodata'].map(s => [s, stageWord('en', s)])),
    sources: { optical: ORIGIN + SRC.o, radar: ORIGIN + SRC.r, buildings: ORIGIN + SRC.b, promises: ORIGIN + '/data/promises.json' }, data_updated: { optical: d.sat.updated, radar: d.sat.space && d.sat.space.radar && d.sat.space.radar.updated || null, buildings: d.sat.space && d.sat.space.bld && d.sat.space.bld.updated || null },
    caveat: S.en.lim, method: ORIGIN + '/methods/construction-stage/', licence: 'CC BY 4.0 (credit: Kolaboro, kolaboro.com). Contains modified Copernicus Sentinel data; Overture Maps ODbL 1.0.' });
}

// ------------------------------------------------------------------------------------------------ method page
const PG_CSS = '<style id="kstage-pg">.kstg-pg .k-phead{padding-block:var(--k-7,48px) var(--k-5,24px)}.kstg-pg h1{max-width:22ch}.kstg-pg .lead{max-width:62ch;color:var(--k-ink-2)}.kstg-pg h2{margin:0 0 var(--k-3,12px)}.kstg-pg ol,.kstg-pg ul{max-width:72ch;line-height:1.6;padding-inline-start:22px}.kstg-pg li{margin:0 0 8px}.kstg-pg p{max-width:72ch;line-height:1.6}' +
  '.kstg-sw{display:inline-block;width:14px;height:14px;border-radius:3px;margin-inline-end:8px;vertical-align:-2px}.kstg-sw.s-cleared{background:color-mix(in srgb,var(--k-sea,#155C75) 22%,var(--k-surface,#fff))}.kstg-sw.s-earthworks{background:color-mix(in srgb,var(--k-sea,#155C75) 45%,var(--k-surface,#fff))}.kstg-sw.s-structure{background:color-mix(in srgb,var(--k-sea,#155C75) 72%,var(--k-surface,#fff))}.kstg-sw.s-roofed{background:var(--k-sea,#155C75)}.kstg-sw.s-none,.kstg-sw.s-base{background:var(--k-sunken,#E8ECEA);box-shadow:inset 0 0 0 1px var(--k-line,#D5DAD8)}.kstg-sw.s-cant{background:repeating-linear-gradient(135deg,var(--k-surface,#fff) 0 3px,var(--k-muted,#56636F) 3px 4px)}</style>';
function methodBody(lang) {
  const R = RULES, v = { a: R.already_built_pct, n: R.footprint_near_m, w: R.optical_window, t: R.footprint_cover_pct, b: R.optical_band_pts, e: R.earthworks_after_clear_months, c: R.min_clear_months };
  const fill = s => s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m);
  const keys = ['base', 'roofed', 'structure', 'earthworks', 'cleared', 'none'];
  const rules = t(lang, 'm_rules').map((s, i) => '<li><span class="kstg-sw s-' + keys[i] + '" aria-hidden="true"></span>' + esc(fill(s)) + '</li>').join('');
  return '<div class="kstg-pg"><section class="k-sec"><div class="k-wrap"><div class="k-phead"><p class="k-crumb"><a href="' + pre(lang) + '/">Kolaboro</a></p><h1>' + esc(t(lang, 'm_title')) + '</h1><p class="lead">' + esc(t(lang, 'm_lead')) + '</p></div>' +
    '<h2>' + esc(t(lang, 'm_h_in')) + '</h2><ul>' + t(lang, 'm_in').map(s => '<li>' + esc(fill(s)) + '</li>').join('') + '</ul></div></section>' +
    '<section class="k-sec"><div class="k-wrap"><h2>' + esc(t(lang, 'm_h_rules')) + '</h2><ol>' + rules + '</ol>' +
    '<p>' + esc(fill(t(lang, 'm_rule_x'))) + '</p><h2>' + esc(t(lang, 'm_h_conf')) + '</h2><p>' + esc(t(lang, 'm_conf')) + '</p>' +
    '<h2>' + esc(t(lang, 'm_h_cant')) + '</h2><p><span class="kstg-sw s-cant" aria-hidden="true"></span>' + esc(stageWord(lang, 'cant')) + '</p><ul>' + t(lang, 'm_cant').map(s => '<li>' + esc(fill(s)) + '</li>').join('') + '</ul></div></section>' +
    '<section class="k-sec"><div class="k-wrap"><h2>' + esc(t(lang, 'm_h_lim')) + '</h2><p>' + esc(t(lang, 'm_lim')) + '</p><h2>' + esc(t(lang, 'm_h_data')) + '</h2><p>' + esc(t(lang, 'm_data')) + '</p>' +
    '<p class="kfc-links"><a href="/api/x/stage">/api/x/stage</a> <a href="/data/construction-progress.json">/data/construction-progress.json</a> <a href="/data/satellite-radar.json">/data/satellite-radar.json</a> <a href="/data/buildings.json">/data/buildings.json</a> <a href="https://registry.opendata.aws/sentinel-2-l2a-cogs/" rel="noopener">Sentinel-2 L2A COGs</a> <a href="https://planetarycomputer.microsoft.com/dataset/sentinel-1-rtc" rel="noopener">Sentinel-1 RTC</a> <a href="https://docs.overturemaps.org/attribution/" rel="noopener">Overture attribution</a></p></div></section></div>';
}
export async function method(req, u, env, ctx, shell) {
  const m = u.pathname.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?methods\/construction-stage(\/?)$/); if (!m || !shell) return null;
  if (!m[2]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
  const lang = m[1] || 'en', path = '/methods/construction-stage/', url = ORIGIN + pre(lang) + path;
  const sh = await shell(pre(lang) + '/how-we-score/');
  const ld = { '@context': 'https://schema.org', '@graph': [{ '@type': 'TechArticle', '@id': url + '#article', headline: t(lang, 'm_title'), description: t(lang, 'm_desc'), url, inLanguage: lang, dateModified: '2026-11-08', author: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' }, publisher: { '@type': 'Organization', name: 'Kolaboro', url: ORIGIN + '/' } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kolaboro', item: ORIGIN + pre(lang) + '/' }, { '@type': 'ListItem', position: 2, name: t(lang, 'm_title'), item: url }] }] };
  const alts = LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + path + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + path + '">';
  const tags = '<title>' + esc(t(lang, 'm_title')) + ' | Kolaboro</title><meta name="description" content="' + esc(t(lang, 'm_desc')) + '"><link rel="canonical" href="' + url + '">' + alts +
    '<meta property="og:type" content="article"><meta property="og:site_name" content="Kolaboro"><meta property="og:title" content="' + esc(t(lang, 'm_title')) + ' | Kolaboro"><meta property="og:description" content="' + esc(t(lang, 'm_desc')) + '"><meta property="og:url" content="' + url + '"><meta name="twitter:card" content="summary">' +
    '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' + PG_CSS;
  const res = new HTMLRewriter()
    .on('html', { element(e) { e.setAttribute('lang', lang); if (lang === 'ar') e.setAttribute('dir', 'rtl'); else e.removeAttribute('dir'); } })
    .on('title', { element(e) { e.remove(); } })
    .on('meta[name="description"],meta[name="robots"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],link[rel="alternate"][hreflang]', { element(e) { e.remove(); } })
    .on('script[type="application/ld+json"]', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setInnerContent(methodBody(lang), { html: true }); } })
    .on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + path); } })
    .transform(new Response(sh.body, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
  return new Response(await res.text(), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=600' } });
}
