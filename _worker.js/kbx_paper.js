// kolaboro.com batch 18 (agent n18d, 8 Nov 2026): paperwork that protects buyers. No model calls, nothing stored.
//   (2) Prices over time on named project pages: the prices printed on the page we track, from our sealed copies (page-history,
//       the same SHA-256 copies as /projects/<slug>/changes/) and Internet Archive captures since 2017. Data: /data/price-history.json,
//       built daily on main by .github/workflows/kolaboro-paperwork.yml (tools/kolaboro-agent/paperwork.py). Currency as printed.
//   (8) Planning and building records near the site, on named project pages with a reliable pin (3+ decimals): England
//       (planning.data.gov.uk, OGL v3.0), New York City (DOB NOW filings), City of Miami (building permits). Data: /data/planning.json
//       (same Action); for England a "check the register now" button asks planning.data.gov.uk from the edge (cached one day).
//   (9) /tools/contract-addendum/ (8 languages): protective clauses to propose to the developer, each with the article of law it
//       relies on (law notes in /tools/law/law.json plus official texts quoted below), built in the browser as PDF (jsPDF 2.5.1,
//       MIT, pinned on jsDelivr, loaded on click) and as an editable Word .docx (written by this page's own code). Inputs never leave
//       the device. A draft to discuss with a lawyer, not legal advice.
// Routes:
//   GET /api/x/paper/<ID>                 prices over time and planning records of one named project (public JSON)
//   GET /api/x/paper/planning/<ID>/live   England only: planning.data.gov.uk within 200 m of the pin, now (cached 1 day, rate-limited)
//   GET /tools/contract-addendum/  /<lang>/tools/contract-addendum/
import { TB } from './kbx_strings.js';   // n32w: string tables loaded as static JSON (worker size limit)
const ORIGIN = 'https://kolaboro.com';
export const PATHS = /^\/api\/x\/paper\//;
export const TOOL_RX = /^\/(?:(?:es|de|fr|nl|ru|zh|ar)\/)?tools\/contract-addendum\/?$/;
const LANGS = ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar'];
const LOC = { en: 'en-GB', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', nl: 'nl-NL', ru: 'ru-RU', zh: 'zh-CN', ar: 'ar' };
const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pre = l => l === 'en' ? '' : '/' + l;
const OPINION = /\b(scam\w*|fraud\w*|ponzi|swindl\w*|rip-?off|avoid\w*|beware|dodgy|shady|crook\w*|estafa\w*|fraude\w*|timo|betrug\w*|arnaque\w*|escroc\w*|oplicht\w*|bedrog\w*)\b|мошен|обман|афер|骗局|诈骗|欺诈|احتيال|نصب/i;
const MASK = s => String(s || '').replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[e-mail]').replace(/\+?\d[\d ()-]{8,}\d/g, m => /\d{1,3}([.,\s]\d{3}){2,}/.test(m) ? m : '[phone]');

// ------------------------------------------------------------------------------------------------ data
let MEMO = {};
async function loadOne(env, path, ttl) {
  const m = MEMO[path]; if (m && (m.a || Date.now() - m.t < (ttl || 600000))) return m.v;   // n20p: a file read from this deployment's assets (a) does not expire
  let r = null, a = false;
  try { if (env && env.ASSETS) r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com' + path)); a = !!(r && r.ok); } catch (e) { r = null; }
  if (!r || !r.ok) { try { r = await fetch(ORIGIN + path + '?v=' + Math.floor(Date.now() / 600000), { cf: { cacheTtl: 300, cacheEverything: true } }); } catch (e) { r = null; } }
  const v = r && r.ok ? await r.json().catch(() => null) : null;
  MEMO[path] = { t: Date.now(), v, a: a && v != null }; return v;
}
export async function paperData(env) {
  const [ph, pl] = await Promise.all([loadOne(env, '/data/price-history.json'), loadOne(env, '/data/planning.json')]);
  return { ph, pl, v: ((ph && ph.updated) || '') + '/' + ((pl && pl.updated) || '') };
}

// ------------------------------------------------------------------------------------------------ strings for named pages (8 languages)
const N = TB.kbx_paper_N /* n32w (19 Nov 2026): table moved to /data/i18n/kbx_paper.json, filled by kbx_strings.js before any kolaboro.com request is handled */;
const nt = (l, k, v) => { let s = (N[l] && N[l][k] != null ? N[l][k] : N.en[k]); if (v && typeof s === 'string') s = s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m); return s; };
// n20p: one formatter per locale and options for the life of the isolate (building one per call cost most of the render time)
const dtf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'd' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.DateTimeFormat(L, o)); };
const nmf = (L, o) => { const c = (globalThis.__kbFmt = globalThis.__kbFmt || {}), k = 'n' + L + JSON.stringify(o || 0); return c[k] || (c[k] = new Intl.NumberFormat(L, o)); };
const fdt = (d, l) => { try { return dtf(LOC[l] || 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(String(d).slice(0, 10) + 'T00:00:00Z')); } catch (e) { return String(d || ''); } };
const nf = (v, l) => { try { return nmf(LOC[l] || 'en-GB', { maximumFractionDigits: 0 }).format(v); } catch (e) { return String(v); } };
const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const ia = (ts, url) => 'https://web.archive.org/web/' + ts + '/' + url;
const ltr = t => '<bdi dir="ltr">' + esc(t) + '</bdi>';
// n19f: the words around a price are a cut of the page text; drop markdown asterisks and mark the cut ends with an ellipsis
const ctxClean = c => { let t = String(c).replace(/(?:\s*\*){2,}\s*/g, ' ').replace(/\s+/g, ' ').trim(); const wd = t.split(' ').length > 5;   // n28a: the window is cut by characters, so its first and last words are often halves ("…illion, 1-bedroom ... with pr…"): drop them
  if (/^[a-z0-9]/.test(t)) t = '…' + (wd ? t.replace(/^[^\s\[]+\s+/, '') : t); if (!/[.!?)\]]$/.test(t)) t = (wd ? t.replace(/\s+[^\s\]]+$/, '') : t) + '…'; return t; };

// the source link of one dated copy
function copyHref(x, p, url) { return p.src === 'copy' ? '/projects/' + x.s + '/changes/' + p.ref + '.txt' : ia(p.ref, url); }

function chart(pts, cur, x, url, lang) {
  const P = pts.filter(p => p.head && p.head.cur === cur);
  if (P.length < 2 || new Set(P.map(p => p.head.v)).size < 2) return '';   // a flat line adds nothing to the sentence above
  const T = P.map(p => Date.parse(p.d + 'T00:00:00Z')), V = P.map(p => p.head.v);
  let t0 = Math.min(...T), t1 = Math.max(...T); if (t1 === t0) { t0 -= 86400000; t1 += 86400000; }
  let v0 = Math.min(...V), v1 = Math.max(...V); const pad = (v1 - v0) * 0.15 || v1 * 0.08 || 1; v0 = Math.max(0, v0 - pad); v1 += pad;
  const W = 640, H = 220, L = 74, R = 16, TP = 14, B = 30;
  const X = t => L + (t - t0) / (t1 - t0) * (W - L - R), Y = v => TP + (1 - (v - v0) / (v1 - v0)) * (H - TP - B);
  const ticks = [v0 + (v1 - v0) * 0.1, (v0 + v1) / 2, v1 - (v1 - v0) * 0.1];
  const short = v => { try { return nmf(LOC[lang] || 'en-GB', { notation: 'compact', maximumFractionDigits: 2 }).format(v); } catch (e) { return String(Math.round(v)); } };
  const line = P.map((p, i) => (i ? 'L' : 'M') + X(T[i]).toFixed(1) + ' ' + Y(V[i]).toFixed(1)).join(' ');
  return '<figure class="kph-fig"><svg viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="' + esc(nt(lang, 'ph_chart', { cur })) + '" class="kph-svg">' +
    ticks.map(v => '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" class="kph-grid"/><text x="' + (L - 8) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end" class="kph-ax">' + esc(short(v)) + '</text>').join('') +
    '<text x="' + L + '" y="' + (H - 8) + '" class="kph-ax">' + esc(fdt(P[0].d, lang)) + '</text><text x="' + (W - R) + '" y="' + (H - 8) + '" text-anchor="end" class="kph-ax">' + esc(fdt(P[P.length - 1].d, lang)) + '</text>' +
    '<path d="' + line + '" class="kph-line"/>' +
    P.map((p, i) => '<a href="' + esc(copyHref(x, p, url)) + '"' + (p.src === 'ia' ? ' rel="nofollow noopener" target="_blank"' : '') + '><circle cx="' + X(T[i]).toFixed(1) + '" cy="' + Y(V[i]).toFixed(1) + '" r="6" class="kph-pt' + (p.src === 'ia' ? ' is-ia' : '') + '"><title>' + esc(fdt(p.d, lang) + ': ' + p.head.p + ' (' + nt(lang, p.src === 'ia' ? 'ph_ia' : 'ph_copy') + ')') + '</title></circle></a>').join('') +
    '</svg><figcaption>' + esc(nt(lang, 'ph_chart', { cur })) + '</figcaption></figure>';
}

export function pricesHtml(pd, x, lang) {
  const rec = pd && pd.ph && pd.ph.projects && pd.ph.projects[x.id];
  if (!pd || !pd.ph) return '';
  const url = (rec && rec.url) || x.url || '';
  const pts = (rec && rec.pts) || [];
  const json = ' <a class="k-src" href="/api/x/paper/' + esc(x.id) + '">' + esc(nt(lang, 'ph_json')) + '</a>';
  if (!pts.length) return '<p class="ki">' + esc(nt(lang, 'ph_nocopy')) + json + '</p>';
  const nC = pts.filter(p => p.src === 'copy').length, nI = pts.filter(p => p.src === 'ia').length;
  const intro = '<p class="ki">' + esc(nt(lang, 'ph_intro', { host: hostOf(url) || '-' })) + '</p>';
  const withP = pts.filter(p => p.head), anyP = pts.some(p => (p.all || []).some(a => a.k === 'price'));
  if (!anyP) return intro + '<ul class="fl"><li class="kfact">' + esc(nt(lang, pts.length === 1 ? 'ph_none1' : 'ph_none', { n: pts.length, a: fdt(pts[0].d, lang), b: fdt(pts[pts.length - 1].d, lang) })) +
    ' <a class="src" href="' + esc(copyHref(x, pts[pts.length - 1], url)) + '"' + (pts[pts.length - 1].src === 'ia' ? ' rel="nofollow noopener" target="_blank"' : '') + '>' + esc(nt(lang, 'ph_open')) + '</a></li></ul><p class="k-small k-muted">' + esc(nt(lang, 'ph_src', { a: nC, b: nI })) + json + '</p>';
  const first = withP[0] || null, last = withP[withP.length - 1] || null;
  const curs = [...new Set(withP.map(p => p.head.cur))];
  const L = [];
  const src = p => ' <a class="src" href="' + esc(copyHref(x, p, url)) + '"' + (p.src === 'ia' ? ' rel="nofollow noopener" target="_blank"' : '') + '>' + esc(nt(lang, p.src === 'ia' ? 'ph_ia' : 'ph_copy')) + '</a>';
  if (!first) L.push('<li class="kfact">' + esc(nt(lang, 'ph_nohead')) + src(pts[pts.length - 1]) + '</li>');
  else L.push('<li class="kfact">' + esc(nt(lang, 'ph_first', { p: first.head.p, d: fdt(first.d, lang) })).replace(esc(first.head.p), ltr(first.head.p)) + src(first) + '</li>');
  if (withP.length > 1) {
    L.push('<li class="kfact">' + esc(nt(lang, 'ph_last', { p: last.head.p, d: fdt(last.d, lang) })).replace(esc(last.head.p), ltr(last.head.p)) + src(last) + '</li>');
    if (curs.length > 1) L.push('<li class="kfact">' + esc(nt(lang, 'ph_cur2')) + src(last) + '</li>');
    else if (withP.every(p => p.head.v === first.head.v)) L.push('<li class="kfact">' + esc(nt(lang, 'ph_same', { n: withP.length })) + src(last) + '</li>');
    else { const pct = (last.head.v - first.head.v) / first.head.v * 100; L.push('<li class="kfact">' + esc(nt(lang, 'ph_chg', { cur: first.head.cur, pct: (pct > 0 ? '+' : '') + pct.toFixed(Math.abs(pct) < 1 ? 2 : 1) + '%' })) + src(last) + '</li>'); }
  }
  const main = curs.length ? curs.map(c => [c, withP.filter(p => p.head.cur === c).length]).sort((a, b) => b[1] - a[1])[0][0] : null;
  const th = nt(lang, 'ph_th');
  const kind = k => k === 'price' ? '' : ' <small class="k-muted">(' + esc(nt(lang, 'k_' + k)) + ')</small>';
  // n19f: consecutive copies that print exactly the same prices become one row (date range, number of copies, link to the newest);
  // every copy stays listed in the change log and in the JSON
  const sig = p => JSON.stringify([p.src, p.head ? [p.head.cur, p.head.v, p.head.c] : null, (p.all || []).map(a => [a.cur, a.v, a.k])]);
  const G = []; for (const p of pts.slice().reverse()) { const g = G[G.length - 1]; if (g && sig(g.p) === sig(p)) { g.n++; g.old = p; } else G.push({ p, n: 1, old: p }); }
  const rows = G.map(({ p, n, old }) => {
    const ctx = p.head && p.head.c && !OPINION.test(p.head.c) ? '<br><small class="k-muted kph-ctx" dir="auto">' + esc(ctxClean(MASK(p.head.c))) + '</small>' : '';
    const when = n > 1 ? esc(fdt(old.d, lang)) + ' – ' + esc(fdt(p.d, lang)) + '<br><small class="k-muted">' + esc(nt(lang, 'ph_ncopies', { n })) + '</small>' : esc(fdt(p.d, lang));
    const others = (p.all || []).filter(a => !(p.head && a.cur === p.head.cur && a.v === p.head.v));
    const oth = others.slice(0, 4).map(a => ltr(a.p) + kind(a.k)).join(', ') + (others.length > 4 ? ' ' + '+' + (others.length - 4) : '');
    const noP = !(p.all || []).some(a => a.k === 'price');
    return '<tr class="kfact"><td data-label="' + esc(th[0]) + '"><span>' + when + '</span></td><td data-label="' + esc(th[1]) + '"><span><a class="src" href="' + esc(copyHref(x, p, url)) + '"' + (p.src === 'ia' ? ' rel="nofollow noopener" target="_blank"' : '') + '>' + esc(nt(lang, p.src === 'ia' ? 'ph_ia' : 'ph_copy')) + '</a></span></td>' +
      '<td data-label="' + esc(th[2]) + '"><span>' + (p.head ? '<b>' + ltr(p.head.p) + '</b>' + ctx : '<span class="k-muted">' + (noP ? esc(nt(lang, 'ph_noprice')) : '-') + '</span>') + '</span></td><td data-label="' + esc(th[3]) + '"><span>' + (oth || '<span class="k-muted">-</span>') + '</span></td></tr>';
  }).join('');
  return intro + '<ul class="fl">' + L.join('') + '</ul>' + (main ? chart(pts, main, x, url, lang) : '') +
    '<div class="k-table-wrap"><table class="k-table k-table--dense k-table--stack kph-t"><thead><tr>' + th.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<p class="k-small k-muted">' + esc(nt(lang, 'ph_rule')) + ' ' + esc(nt(lang, 'ph_src', { a: nC, b: nI })) + json + '</p>';
}

function planRows(items, lang) {
  const th = nt(lang, 'pl_th');
  return '<div class="k-table-wrap"><table class="k-table k-table--dense k-table--stack kpl-t"><thead><tr>' + th.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' +
    items.map(it => '<tr class="kfact"><td data-label="' + esc(th[0]) + '"><span><a class="src" href="' + esc(it.url) + '" rel="nofollow noopener" target="_blank">' + ltr(it.ref || '-') + '</a></span></td><td data-label="' + esc(th[1]) + '">' + esc(MASK(it.name || '-')) + '</td>' +
      '<td data-label="' + esc(th[2]) + '"><span>' + esc(MASK(it.desc || '-')) + (it.cost ? ' <small class="k-muted">(' + esc(nt(lang, 'pl_cost')) + ' ' + ltr((it.cur || '') + ' ' + nf(it.cost, lang)) + ')</small>' : '') + '</span></td>' +
      '<td data-label="' + esc(th[3]) + '">' + esc(it.status || '-') + '</td><td data-label="' + esc(th[4]) + '">' + (it.d_in ? esc(fdt(it.d_in, lang)) : '-') + '</td><td data-label="' + esc(th[5]) + '">' + (it.d_dec ? esc(fdt(it.d_dec, lang)) : '-') + '</td>' +
      '<td data-label="' + esc(th[6]) + '" class="k-n">' + (it.dist_m != null ? esc(nf(it.dist_m, lang)) + ' m' : '-') + '</td></tr>').join('') + '</tbody></table></div>';
}

export function planningHtml(pd, x, lang) {
  const P = pd && pd.pl, rec = P && P.projects && P.projects[x.id];
  if (!rec) return '';
  if (rec.src === 'none') return '<p class="ki">' + esc(nt(lang, 'pl_out')) + ' <a class="k-src" href="https://www.eplanning.scot/" rel="noopener" target="_blank">eplanning.scot</a></p>';
  const S = (P.sources || {})[rec.src] || {};
  const head = '<p class="ki">' + esc(nt(lang, 'pl_intro', { r: rec.radius_m || 200, src: S.name || rec.src })) + '</p>';
  const rule = rec.src === 'nyc' ? '<p class="k-small k-muted">' + esc(nt(lang, 'pl_rule_nyc')) + '</p>' : rec.src === 'miami' ? '<p class="k-small k-muted">' + esc(nt(lang, 'pl_rule_mia')) + '</p>' : '';
  const items = rec.items || [];
  let body;
  if (items.length) body = (rec.stale ? '<p class="k-small k-muted">' + esc(nt(lang, 'pl_stale', { d: fdt(rec.checked, lang) })) + '</p>' : '') + planRows(items, lang);
  else if ((rec.errors || []).length) body = '<p class="ki">' + esc(nt(lang, 'pl_err', { d: fdt(rec.checked, lang) })) + '</p>';
  else body = '<ul class="fl"><li class="kfact">' + esc(nt(lang, 'pl_none', { r: rec.radius_m || 200, d: fdt(rec.checked, lang) })) + ' <a class="src" href="' + esc(S.url || '#') + '" rel="nofollow noopener" target="_blank">' + esc(hostOf(S.url || '')) + '</a></li></ul>';
  const live = rec.src === 'uk' ? '<div class="kpl-live" data-id="' + esc(x.id) + '"><button type="button" class="k-btn k-btn--sm" data-kpl-live>' + esc(nt(lang, 'pl_live')) + '</button><div class="kpl-out" aria-live="polite"></div></div>' +
    '<script>window.KPL=' + JSON.stringify({ load: nt(lang, 'pl_load'), none: nt(lang, 'pl_live_none'), err: nt(lang, 'pl_live_err'), th: nt(lang, 'pl_th') }).replace(/</g, '\\u003c') + ';' + LIVE_JS + '</script>' : '';
  return head + body + live + rule + '<p class="k-small k-muted">' + esc(nt(lang, 'pl_lic')) + ': <a class="k-src" href="' + esc(S.licence_url || S.url || '#') + '" rel="noopener" target="_blank">' + esc(S.licence || '') + '</a>. ' + esc(nt(lang, 'pl_priv')) + ' <a class="k-src" href="/api/x/paper/' + esc(x.id) + '">' + esc(nt(lang, 'ph_json')) + '</a></p>';
}
const LIVE_JS = String.raw`(()=>{const T=window.KPL,e=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
document.querySelectorAll('.kpl-live').forEach(w=>{const b=w.querySelector('button'),o=w.querySelector('.kpl-out');if(!b||b.dataset.on)return;b.dataset.on=1;
b.addEventListener('click',async()=>{b.disabled=true;o.textContent=T.load+'...';try{const r=await fetch('/api/x/paper/planning/'+encodeURIComponent(w.dataset.id)+'/live'),d=await r.json();
if(!r.ok||d.error){o.textContent=T.err;b.disabled=false;return}if(!d.items.length){o.textContent=T.none;return}
const td=(i,h)=>'<td data-label="'+e(T.th[i])+'">'+h+'</td>';
o.innerHTML='<div class="k-table-wrap"><table class="k-table k-table--dense k-table--stack"><thead><tr>'+T.th.map(h=>'<th scope="col">'+e(h)+'</th>').join('')+'</tr></thead><tbody>'+d.items.map(i=>'<tr>'+td(0,'<a href="'+e(i.url)+'" rel="nofollow noopener" target="_blank">'+e(i.ref||'-')+'</a>')+td(1,e(i.name||'-'))+td(2,e(i.desc||'-'))+td(3,e(i.status||'-'))+td(4,e(i.d_in||'-'))+td(5,e(i.d_dec||'-'))+td(6,i.dist_m!=null?e(i.dist_m)+' m':'-')+'</tr>').join('')+'</tbody></table></div>'}
catch(x){o.textContent=T.err;b.disabled=false}})})})();`;
export const paperHeading = (lang, k) => nt(lang, k);
export const PAPER_CSS = '.kph-fig{margin:14px 0 10px;max-width:720px}.kph-svg{width:100%;height:auto;display:block}.kph-grid{stroke:var(--k-line,#d5dbd8);stroke-width:1}.kph-ax{font-size:12px;fill:var(--k-muted,#56636F)}' +
  '.kph-line{fill:none;stroke:var(--k-sea,#155C75);stroke-width:2}.kph-pt{fill:var(--k-surface,#fff);stroke:var(--k-sea,#155C75);stroke-width:2.5}.kph-pt.is-ia{fill:var(--k-sea,#155C75)}a:focus-visible .kph-pt{stroke-width:4}' +
  '@media(max-width:600px){.kph-ax{font-size:21px}}.kph-fig figcaption{font-size:.84rem;color:var(--k-muted,#56636F)}.kph-ctx{display:inline-block;max-width:46ch;overflow-wrap:anywhere}.kph-t td,.kpl-t td{vertical-align:top}.kpl-t td{overflow-wrap:break-word}.kpl-t td::before{overflow-wrap:normal;word-break:normal}.kpl-live{margin:10px 0}.kpl-out{margin-top:10px}';

// ------------------------------------------------------------------------------------------------ England: planning.data.gov.uk now (edge)
const R0 = 6371008.8, rad = v => v * Math.PI / 180;
const dist = (a, b, c, d) => { const h = Math.sin(rad(c - a) / 2) ** 2 + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(rad(d - b) / 2) ** 2; return Math.round(2 * R0 * Math.asin(Math.min(1, Math.sqrt(h)))); };
function circle(la, ln, r) { const p = []; for (let i = 0; i <= 24; i++) { const t = 2 * Math.PI * i / 24; p.push((ln + r * Math.sin(t) / (111320 * Math.cos(rad(la)))).toFixed(6) + ' ' + (la + r * Math.cos(t) / 111320).toFixed(6)); } return 'POLYGON((' + p.join(',') + '))'; }
const clean = (s, n) => { s = MASK(String(s || '').replace(/\s+/g, ' ').trim()); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
async function ukLive(la, ln) {
  const items = [];
  for (const ds of ['planning-application', 'brownfield-land']) {
    const q = 'https://www.planning.data.gov.uk/entity.json?' + new URLSearchParams({ dataset: ds, geometry: circle(la, ln, 200), geometry_relation: 'intersects', limit: '100' });
    const r = await fetch(q, { headers: { accept: 'application/json', 'user-agent': 'kolaboro.com planning check (buyer due diligence)' }, cf: { cacheTtl: 86400, cacheEverything: true } });
    if (!r.ok) throw new Error('uk ' + r.status);
    const d = await r.json();
    for (const e of d.entities || []) {
      const m = /POINT\s*\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)/.exec(e.point || '');
      items.push({ kind: ds, ref: String(e.reference || '').slice(0, 60), name: clean(e.name || e['site-address'], 120), desc: clean(e.description || e.notes, 220),
        status: clean(e['planning-decision'] || e.status || e['planning-permission-status'], 60), d_in: e['start-date'] || e['entry-date'] || null, d_dec: e['decision-date'] || e['planning-permission-date'] || null,
        dist_m: m ? dist(la, ln, +m[2], +m[1]) : null, url: 'https://www.planning.data.gov.uk/entity/' + e.entity });
    }
  }
  return items;
}
async function limited(req, ctx, name, max) {
  const ip = req.headers.get('cf-connecting-ip') || 'x', k = new Request(ORIGIN + '/__kpaper_rl/' + name + '/' + encodeURIComponent(ip) + '/' + new Date().toISOString().slice(0, 13));
  const hit = await caches.default.match(k); const n = hit ? (+(await hit.text()) || 0) : 0; if (n >= max) return true;
  const p = caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=3600' } })); if (ctx && ctx.waitUntil) ctx.waitUntil(p.catch(() => {})); else await p.catch(() => {});
  return false;
}

// ------------------------------------------------------------------------------------------------ API
const HJ = { 'content-type': 'application/json; charset=utf-8', 'x-content-type-options': 'nosniff', 'access-control-allow-origin': '*' };
const out = (o, st, cc) => new Response(JSON.stringify(o), { status: st || 200, headers: Object.assign({ 'cache-control': cc || 'no-store' }, HJ) });
export async function handle(req, u, env, ctx) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return out({ error: 'method' }, 405);
  const p = u.pathname.replace(/\/+$/, '');
  try {
    const { data } = await import('./kbx_named.js');
    const ix = await data(env).catch(() => null); if (!ix) return out({ error: 'unavailable' }, 503);
    let m = p.match(/^\/api\/x\/paper\/planning\/([A-Za-z0-9-]{3,20})\/live$/);
    if (m) {
      const x = ix.byId.get(m[1].toUpperCase()); if (!x) return out({ error: 'not_found' }, 404);
      const pd = await paperData(env), rec = pd.pl && pd.pl.projects && pd.pl.projects[x.id];
      if (!rec || rec.src !== 'uk' || !rec.pin) return out({ error: 'not_covered', note: 'Live check is for named projects in England with a reliable pin.' }, 400);
      const ck = new Request(ORIGIN + '/__kpaper_uk/v1/' + x.id);
      const hit = await caches.default.match(ck); if (hit) return new Response(hit.body, { status: 200, headers: Object.assign({ 'cache-control': 'public, max-age=3600', 'x-cache': 'hit' }, HJ) });
      if (await limited(req, ctx, 'uk', 30)) return out({ error: 'rate', note: 'At most 30 live checks per hour from one address.' }, 429);
      let items; try { items = await ukLive(rec.pin[0], rec.pin[1]); } catch (e) { return out({ error: 'register_unavailable', source: 'planning.data.gov.uk', note: 'HTTP 200 on purpose: the page shows its own message.' }, 200); }
      const body = JSON.stringify({ id: x.id, checked: new Date().toISOString(), radius_m: 200, source: (pd.pl.sources || {}).uk || null, items: items.slice(0, 40) });
      const put = caches.default.put(ck, new Response(body, { headers: { 'cache-control': 'max-age=86400' } })); if (ctx && ctx.waitUntil) ctx.waitUntil(put.catch(() => {}));
      return new Response(body, { status: 200, headers: Object.assign({ 'cache-control': 'public, max-age=3600' }, HJ) });
    }
    m = p.match(/^\/api\/x\/paper\/([A-Za-z0-9-]{3,20})$/);
    if (m) {
      const x = ix.byId.get(m[1].toUpperCase()) || ix.bySlug.get(m[1].toLowerCase());
      if (!x) return out({ id: m[1], named: false }, 404, 'public, max-age=300');
      const pd = await paperData(env), ph = pd.ph, pl = pd.pl, r = ph && ph.projects && ph.projects[x.id];
      const pts = r ? r.pts.map(q => Object.assign({}, q, { copy_url: q.src === 'copy' ? ORIGIN + '/projects/' + x.s + '/changes/' + q.ref + '.txt' : ia(q.ref, r.url) })) : [];
      return out({ id: x.id, name: x.n || null, page: ORIGIN + '/projects/' + x.s + '/',
        prices: ph ? { updated: ph.updated, url_tracked: r ? r.url : x.url || null, rules: ph.rules, sources: ph.sources, points: pts } : null,
        planning: pl ? Object.assign({ updated: pl.updated, privacy: pl.privacy, not_covered: pl.not_covered }, pl.projects && pl.projects[x.id] ? { record: pl.projects[x.id], source: (pl.sources || {})[pl.projects[x.id].src] || null } : { record: null }) : null }, 200, 'public, max-age=600');
    }
    return out({ error: 'not_found', see: ['/api/x/paper/<ID>', '/api/x/paper/planning/<ID>/live'] }, 404);
  } catch (e) { return out({ error: 'server' }, 500); }
}

// ================================================================================================ (9) contract addendum builder
// Official texts not in /tools/law/law.json, read in the official source on 8 Nov 2026. Short quotes only.
const EXTRA = {
  'es-loe-17': { law: 'Law 38/1999 on Building Regulation (Ley de Ordenación de la Edificación)', cite: 'Article 17(1)', url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1999-21567#a17', lang: 'es',
    quote: 'El constructor también responderá de los daños materiales por vicios o defectos de ejecución que afecten a elementos de terminación o acabado de las obras dentro del plazo de un año.',
    tr: 'The builder is also liable for material damage from defects of execution affecting finishing elements of the works within one year (structural defects 10 years, habitability defects 3 years, from acceptance of the works).' },
  'mx-73bis-v': { law: 'Federal Consumer Protection Law (Ley Federal de Protección al Consumidor), last reform DOF 12-12-2025', cite: 'Article 73 Bis, section V', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPC.pdf', lang: 'es',
    quote: 'Para el caso de inmuebles nuevos o preventas, las autorizaciones, licencias o permisos expedidos por las autoridades correspondientes para la construcción', tr: 'For new properties or pre-sales [the seller must make available] the authorisations, licences or permits issued by the competent authorities for the construction.' },
  'mx-73bis-xiii': { law: 'Federal Consumer Protection Law (Ley Federal de Protección al Consumidor), last reform DOF 12-12-2025', cite: 'Article 73 Bis, section XIII', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPC.pdf', lang: 'es',
    quote: 'Se deberá indicar al consumidor sobre la existencia y constitución de garantía hipotecaria, fiduciaria o de cualquier otro tipo, así como su instrumentación.', tr: 'The consumer must be told whether a mortgage, trust or any other guarantee exists and how it is set up.' },
  'mx-73ter-ix': { law: 'Federal Consumer Protection Law (Ley Federal de Protección al Consumidor), last reform DOF 12-12-2025', cite: 'Article 73 Ter, section IX', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPC.pdf', lang: 'es',
    quote: 'Las penas convencionales que se apliquen tanto al proveedor como al consumidor por el incumplimiento de las obligaciones contraídas, las cuales deberán ser recíprocas y equivalentes', tr: 'The contractual penalties for breach that apply to both the seller and the consumer, which must be reciprocal and equivalent.' },
  'mx-73ter-xi': { law: 'Federal Consumer Protection Law (Ley Federal de Protección al Consumidor), last reform DOF 12-12-2025', cite: 'Article 73 Ter, section XI', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPC.pdf', lang: 'es',
    quote: 'El procedimiento para la cancelación del contrato de adhesión y las implicaciones que se deriven para el proveedor y el consumidor', tr: 'The procedure to cancel the standard contract and what follows from it for the seller and the consumer.' },
  'mx-73ter-xii': { law: 'Federal Consumer Protection Law (Ley Federal de Protección al Consumidor), last reform DOF 12-12-2025', cite: 'Article 73 Ter, section XII', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPC.pdf', lang: 'es',
    quote: 'Fecha de inicio y término de ejecución de la actividad o servicio contratado, así como la de entrega del bien objeto del contrato', tr: 'Start and end dates of the work contracted, and the date the property is handed over.' },
  'uk-cra-62': { law: 'Consumer Rights Act 2015', cite: 'Section 62(1) and (4)', url: 'https://www.legislation.gov.uk/ukpga/2015/15/section/62', lang: 'en',
    quote: 'An unfair term of a consumer contract is not binding on the consumer. ... A term is unfair if, contrary to the requirement of good faith, it causes a significant imbalance in the parties\' rights and obligations under the contract to the detriment of the consumer.' },
  'uk-dpa-1': { law: 'Defective Premises Act 1972 (England and Wales)', cite: 'Section 1(1)', url: 'https://www.legislation.gov.uk/ukpga/1972/35/section/1', lang: 'en',
    quote: 'to see that the work which he takes on is done in a workmanlike or, as the case may be, professional manner, with proper materials and so that as regards that work the dwelling will be fit for habitation when completed.' },
  'fl-501-1375': { law: 'Florida Statutes, section 501.1375 (one- and two-family homes)', cite: 's. 501.1375(2)', url: 'https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0500-0599/0501/Sections/0501.1375.html', lang: 'en',
    quote: 'any deposit (up to 10 percent of the purchase price) made by the buyer to the building contractor or developer shall, unless waived in writing by the buyer, be deposited in an escrow account' },
  'fl-718-202-1': { law: 'Florida Statutes, section 718.202 (condominiums)', cite: 's. 718.202(1) and (1)(a)', url: 'https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0700-0799/0718/Sections/0718.202.html', lang: 'en',
    quote: 'the developer shall pay into an escrow account all payments up to 10 percent of the sale price received by the developer from the buyer towards the sale price. ... If a buyer properly terminates the contract pursuant to its terms or pursuant to this chapter, the funds shall be paid to the buyer together with any interest earned.' },
  'fl-718-202-2': { law: 'Florida Statutes, section 718.202 (condominiums)', cite: 's. 718.202(2) and (3)', url: 'https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0700-0799/0718/Sections/0718.202.html', lang: 'en',
    quote: 'shall be held in a special escrow account ... and may not be used by the developer prior to closing the transaction, except as provided in subsection (3) or except for refund to the buyer.',
    note: 'Subsection (3) lets the developer use amounts above 10 percent for construction if the contract so provides. The clause asks the developer to give up that option.' },
  'ny-352h': { law: 'New York General Business Law, section 352-h', cite: 'GBL s. 352-h', url: 'https://www.nysenate.gov/legislation/laws/GBS/352-H', lang: 'en',
    quote: 'all moneys received in connection therewith, including deposits or advances therefor, shall continue to be the money of the person making such purchase, deposit or advance, and shall be held in trust',
    note: 'Applies to offerings under section 352-e, which covers real estate offerings including cooperative interests; new condominium and co-op offering plans in New York are filed under it.' },
  'ny-777a': { law: 'New York General Business Law, section 777-a (housing merchant implied warranty)', cite: 'GBL s. 777-a(1)', url: 'https://www.nysenate.gov/legislation/laws/GBS/777-A', lang: 'en',
    quote: 'one year from and after the warranty date the home will be free from defects due to a failure to have been constructed in a skillful manner',
    note: 'A "new home" under section 777(5) is a single-family house or a for-sale unit in a condominium or co-op building of five stories or less.' }
};
// which law notes each clause relies on, per country (ids from law.json or EXTRA); [] = no statutory rule in our notes
const BASIS = {
  ES: { escrow: ['es-deposit-guarantee'], delay: ['es-deposit-guarantee'], refund: ['es-deposit-guarantee'], complete: [], permits: ['es-deposit-guarantee'], snag: ['es-loe-17'], reg: [] },
  PT: { escrow: [], delay: ['pt-sinal'], refund: ['pt-sinal'], complete: [], permits: [], snag: [], reg: [] },
  'AE-DU': { escrow: ['ae-du-escrow-required', 'ae-du-escrow-ring-fenced'], delay: ['ae-du-not-completed'], refund: ['ae-du-not-completed'], complete: ['ae-du-retention'], permits: ['ae-du-land-and-approvals', 'ae-du-ad-permit'], snag: ['ae-du-retention'], reg: ['ae-du-interim-register'] },
  MX: { escrow: ['mx-73bis-xiii'], delay: ['mx-73ter-ix', 'mx-73ter-xii'], refund: ['mx-73ter-xi'], complete: ['mx-73ter-xii'], permits: ['mx-73bis-v'], snag: [], reg: [] },
  TH: { escrow: [], delay: [], refund: [], complete: [], permits: [], snag: [], reg: ['th-foreign-funds', 'th-49-quota'] },
  ID: { escrow: [], delay: [], refund: [], complete: ['id-pbg-definition'], permits: ['id-ppjb-conditions', 'id-pbg-definition'], snag: [], reg: ['id-foreigner-hak-pakai', 'id-nominee-void'] },
  UK: { escrow: [], delay: ['uk-cra-62'], refund: ['uk-cra-62'], complete: [], permits: [], snag: ['uk-dpa-1'], reg: [] },
  'US-FL': { escrow: ['fl-718-202-1', 'fl-718-202-2', 'fl-501-1375'], delay: [], refund: ['fl-718-202-1'], complete: [], permits: [], snag: [], reg: [] },
  'US-NY': { escrow: ['ny-352h'], delay: [], refund: ['ny-352h'], complete: [], permits: [], snag: ['ny-777a'], reg: [] }
};
const COUNTRIES = [['ES', 'Spain', 'EUR'], ['PT', 'Portugal', 'EUR'], ['AE-DU', 'Dubai (UAE)', 'AED'], ['MX', 'Mexico', 'MXN'], ['TH', 'Thailand', 'THB'], ['ID', 'Indonesia', 'IDR'], ['UK', 'England and Wales (UK)', 'GBP'], ['US-FL', 'Florida (USA)', 'USD'], ['US-NY', 'New York (USA)', 'USD']];

// tool strings (8 languages); clause wording in the document is English (see doc_lang)
const T = TB.kbx_paper_T /* n32w (19 Nov 2026): table moved to /data/i18n/kbx_paper.json, filled by kbx_strings.js before any kolaboro.com request is handled */;
const tt = l => Object.assign({}, T.en, T[l] || {});

async function lawNotes(env) {
  const lj = await loadOne(env, '/tools/law/law.json', 3600000);
  const out = {};
  if (lj) for (const r of lj.rules || []) { const s = (lj.sources || {})[r.source] || {}; out[r.id] = { law: s.law || r.source, cite: r.cite, url: s.url || '/tools/law/', lang: s.language || 'en', quote: String(r.quote || ''), tr: r.translation || '', title: r.title || '', checked: r.checked || lj.version, kb: '/tools/law/#' + r.id }; }
  for (const [k, v] of Object.entries(EXTRA)) out[k] = Object.assign({ checked: '2026-11-08' }, v);
  return out;
}

const CSS = `<style id="kca18">
.kca .k-phead{padding-block:var(--k-7,48px) var(--k-5,24px)}.kca h1{max-width:24ch}
.kca-grid{display:grid;gap:var(--k-6,32px);grid-template-columns:minmax(0,1fr)}
@media(min-width:1000px){.kca-grid{grid-template-columns:minmax(0,5fr) minmax(0,6fr);align-items:start}.kca-out{position:sticky;top:88px}}
.kca fieldset{border:1px solid var(--k-line);border-radius:var(--k-r-lg,14px);padding:var(--k-4,16px) var(--k-5,24px) var(--k-5,24px);margin:0 0 var(--k-5,24px);background:var(--k-surface);min-width:0}
.kca legend{font-weight:700;padding:0 6px;font-size:var(--k-fs-md,17px)}
.kca-row{display:grid;gap:var(--k-3,12px);grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr))}
.kca .k-field{margin:0 0 var(--k-3,12px)}.kca .k-input,.kca .k-select,.kca .k-textarea{width:100%;box-sizing:border-box}
.kca-cl{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-top:1px solid var(--k-line)}.kca-cl:first-of-type{border-top:0}
.kca-cl input{width:22px;height:22px;margin:2px 0 0;flex:none}.kca-cl label{cursor:pointer}.kca-cl small{display:block;color:var(--k-muted)}
.kca-doc{background:var(--k-surface);border:1px solid var(--k-line-2,var(--k-line));border-radius:var(--k-r-lg,14px);padding:var(--k-5,24px);max-height:none}
.kca-doc h3{font-size:var(--k-fs-lg,20px);margin:0 0 6px}.kca-doc h4{font-size:var(--k-fs-md,17px);margin:var(--k-5,24px) 0 6px}
.kca-doc p{margin:6px 0;line-height:1.55}.kca-doc .kca-meta{color:var(--k-muted);font-size:var(--k-fs-sm,15px)}
.kca-law{margin:8px 0 0;padding:10px 12px;border-inline-start:3px solid var(--k-sea);background:var(--k-sunken);border-radius:0 var(--k-r-sm,6px) var(--k-r-sm,6px) 0;font-size:var(--k-fs-sm,15px)}
.kca-law.is-none{border-inline-start-color:var(--k-line-2,var(--k-line));color:var(--k-muted)}.kca-law q{display:block;margin:4px 0;font-style:italic;overflow-wrap:anywhere}
.kca-acts{display:flex;flex-wrap:wrap;gap:10px;margin:var(--k-4,16px) 0}.kca-st{min-height:1.5em;font-size:var(--k-fs-sm,15px)}
.kca-rel{margin-top:var(--k-6,32px)}
@media print{header,footer,nav,.kca-form,.kca-acts,.k-phead,.kca-rel,.ship,.k-alert{display:none!important}.kca-grid{display:block}.kca-doc{border:0;padding:0}}
</style>`;

function toolBody(lang, LAW) {
  const t = tt(lang), p = pre(lang);
  const f = (id, label, type, extra, val, opt) => '<div class="k-field"><label class="k-label" for="ca-' + id + '">' + esc(label) + (opt ? ' <small class="k-muted">(' + esc(t.opt) + ')</small>' : '') + '</label>' +
    (type === 'textarea' ? '<textarea class="k-textarea" id="ca-' + id + '" name="' + id + '" rows="2" autocomplete="off"' + (extra || '') + '>' + esc(val || '') + '</textarea>' : '<input class="k-input" id="ca-' + id + '" name="' + id + '" type="' + type + '" autocomplete="off"' + (extra || '') + (val != null ? ' value="' + esc(val) + '"' : '') + '>') + '</div>';
  const cls = ['escrow', 'delay', 'refund', 'complete', 'permits', 'snag', 'reg'];
  const client = { lang, t: { law_none: t.law_none, law_open: t.law_open, quote: t.quote, trans: t.trans, note: t.note, st_pdf: t.st_pdf, st_done: t.st_done, st_err: t.st_err, st_latin: t.st_latin, empty: t.empty, law_h: t.law_h }, LAW, BASIS, C: COUNTRIES };
  return '<div class="kca"><section class="k-phead"><div class="k-wrap"><p class="k-crumb"><a href="' + p + '/">Kolaboro</a> / <a href="/tools/">' + esc(t.crumb_tools) + '</a></p><h1>' + esc(t.h1) + '</h1><p class="lead">' + esc(t.lead) + '</p>' +
    '<div class="k-alert k-alert--warn" role="note"><b>' + esc(t.warn_b) + '</b><span>' + esc(t.warn) + '</span></div>' +
    '<div class="k-alert" role="note" style="margin-top:12px"><b>' + esc(t.priv_b) + '</b><span>' + esc(t.priv) + '</span></div></div></section>' +
    '<section class="k-sec" style="padding-top:var(--k-5,24px)"><div class="k-wrap kca-grid"><form class="kca-form" id="kca-f" data-kb-nosubmit novalidate>' +
    '<fieldset><legend>' + esc(t.s1) + '</legend><div class="k-field"><label class="k-label" for="ca-country">' + esc(t.f_country) + '</label><select class="k-select" id="ca-country" name="country">' + COUNTRIES.map(c => '<option value="' + c[0] + '">' + esc(c[1]) + '</option>').join('') + '</select></div>' +
    '<div class="kca-row">' + f('seller', t.f_seller, 'text') + f('buyer', t.f_buyer, 'text', '', '', 1) + '</div><div class="kca-row">' + f('project', t.f_project, 'text') + f('unit', t.f_unit, 'text') + '</div>' + f('contract', t.f_contract, 'text', '', '', 1) + '</fieldset>' +
    '<fieldset><legend>' + esc(t.s2) + '</legend><div class="kca-row">' + f('price', t.f_price, 'text', ' inputmode="decimal"') + '<div class="k-field"><label class="k-label" for="ca-cur">' + esc(t.f_cur) + '</label><input class="k-input" id="ca-cur" name="cur" type="text" maxlength="3" autocomplete="off" value="EUR" style="text-transform:uppercase"></div>' + f('paid', t.f_paid, 'text', ' inputmode="decimal"', '', 1) + '</div>' +
    f('sched', t.f_sched, 'textarea', '', '', 1) + '<div class="kca-row">' + f('date', t.f_date, 'date') + f('grace', t.f_grace, 'number', ' min="0" max="24" step="1"', '3') + f('long', t.f_long, 'number', ' min="1" max="60" step="1"', '6') + '</div>' +
    '<div class="kca-row">' + f('pen', t.f_pen, 'number', ' min="0" max="5" step="0.05"', '0.5') + f('cap', t.f_cap, 'number', ' min="0" max="50" step="0.5"', '10') + f('int', t.f_int, 'number', ' min="0" max="30" step="0.1"', '4') + f('snag', t.f_snag, 'number', ' min="1" max="365" step="1"', '30') + '</div></fieldset>' +
    '<fieldset><legend>' + esc(t.s3) + '</legend>' + cls.map(k => '<div class="kca-cl"><input type="checkbox" id="ca-c-' + k + '" name="c_' + k + '"' + (k !== 'reg' ? ' checked' : '') + '><label for="ca-c-' + k + '">' + esc(t['c_' + k]) + '<small data-basis="' + k + '"></small></label></div>').join('') + '</fieldset></form>' +
    '<div class="kca-out" aria-labelledby="kca-h4"><h2 id="kca-h4" class="k-vh">' + esc(t.s4) + '</h2><div class="kca-acts"><button type="button" class="k-btn k-btn--primary" id="kca-pdf">' + esc(t.pdf) + '</button><button type="button" class="k-btn" id="kca-docx">' + esc(t.docx) + '</button><button type="button" class="k-btn k-btn--ghost" id="kca-print">' + esc(t.print) + '</button></div>' +
    '<p class="kca-st" id="kca-st" role="status" aria-live="polite"></p><article class="kca-doc" id="kca-doc" lang="en" dir="ltr"></article><p class="k-small k-muted">' + esc(t.doc_lang) + '</p></div></div></section>' +
    '<section class="k-sec kca-rel"><div class="k-wrap"><h2>' + esc(t.rel_h) + '</h2><ul><li><a href="/tools/law/">' + esc(t.rel_law) + '</a></li><li><a href="/tools/delay-compensation/">' + esc(t.rel_delay) + '</a></li><li><a href="/tools/deposit-protection/">' + esc(t.rel_dep) + '</a></li></ul></div></section></div>' +
    '<script>window.KCA=' + JSON.stringify(client).replace(/</g, '\\u003c') + ';</script><script>' + JS + '</script>';
}

// browser code: builds the document from the form, PDF with jsPDF (loaded on click), .docx with a small stored-ZIP writer. No network calls with user data.
const JS = String.raw`(()=>{const K=window.KCA,t=K.t,$=s=>document.querySelector(s),F=$('#kca-f'),D=$('#kca-doc'),ST=$('#kca-st');
const CUR={ES:'EUR',PT:'EUR','AE-DU':'AED',MX:'MXN',TH:'THB',ID:'IDR',UK:'GBP','US-FL':'USD','US-NY':'USD'};
const e=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const v=n=>{const x=F.elements[n];return x?String(x.value||'').trim():''};const ck=n=>F.elements['c_'+n]&&F.elements['c_'+n].checked;
const num=s=>{s=String(s||'').replace(/[\s\u00a0]/g,'');if(/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(/,/g,'');const n=parseFloat(s);return isFinite(n)?n:null};
const money=(s,c)=>{const n=num(s);return n==null?'[amount]':c+' '+n.toLocaleString('en-GB',{maximumFractionDigits:2})};
const dt=s=>{if(!s)return'[date]';const d=new Date(s+'T00:00:00Z');return isNaN(d)?s:d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})};
const or=(s,d)=>s||d;
const SPEC={escrow:{ES:'a special account at a credit institution, kept apart from any other funds of the Seller and used only for building the Project, and guaranteed by an individual surety insurance policy or a joint and several bank guarantee (aval) in the Buyer\'s name covering all amounts paid plus legal interest',
 'AE-DU':'the escrow account of the Project opened with the Dubai Land Department. The Seller shall write the escrow agent bank and the escrow account number into this addendum and the Buyer shall make every payment only into that account',
 'US-FL':'an escrow account with an escrow agent as required by section 718.202 (condominium) or section 501.1375 (one- or two-family home) of the Florida Statutes. The Buyer does not waive the right to escrow. The Seller shall not withdraw any escrowed amount above 10 percent of the price for construction before closing, even where section 718.202(3) would allow it',
 'US-NY':'trust as required by section 352-h of the General Business Law, in the escrow account named in the offering plan, and shall not be commingled with the Seller\'s own money',
 MX:'a trust (fideicomiso) or an on-demand bank guarantee in the Buyer\'s favour, named in this addendum as the guarantee the Seller discloses under article 73 Bis, section XIII, of the Federal Consumer Protection Law',
 _:'an escrow account at a bank or in a lawyer\'s client account, in the Buyer\'s favour, or shall be covered by an on-demand bank guarantee in the Buyer\'s favour for all amounts paid'},
 cert:{ES:'the first occupation licence (licencia de primera ocupación) or the equivalent declaration of the town hall','AE-DU':'the completion certificate of the Project (Law No. 8 of 2007, Article 14)',ID:'the certificate of fitness for use (Sertifikat Laik Fungsi, SLF)',TH:'registration of the condominium and of the Unit with the Land Department',PT:'the use permit (licença de utilização)',MX:'the notice of completion of works (aviso de terminación de obra) issued by the municipality',UK:'the building control completion certificate and a new-home warranty certificate','US-FL':'the certificate of occupancy','US-NY':'the certificate of occupancy (temporary or final)'},
 permits:{ES:'the building licence (licencia de obras) for the Project','AE-DU':'possession of the land, the approvals of the competent entities, and the written permission of the Land Department to sell and advertise the Project off-plan',ID:'clear land title, the building approval (PBG) and, before this preliminary sale agreement (PPJB), at least 20 percent of the housing built',MX:'the authorisations, licences and permits for the construction and land use of the Project',TH:'the building permit and, where required for the Project, the environmental impact assessment (EIA) approval',PT:'the building licence (licença de construção) for the Project',UK:'planning permission and building control approval for the Project','US-FL':'the building permit for the Project','US-NY':'the building permit for the Project and, for a condominium or co-op, an offering plan accepted for filing by the Attorney General'},
 reg:{'AE-DU':'The Seller shall register this sale in the Interim Property Register of the Dubai Land Department within 30 days of signing and give the Buyer the registration certificate. Until it is registered, the Buyer is not required to make any further payment.',ID:'The Unit shall be registered in the Buyer\'s own name on a right a foreigner may hold (Hak Pakai, or strata title where allowed). The Seller shall not offer any arrangement in which title is held by another person for the Buyer.',TH:'The Seller shall give the Buyer a receipt for every payment and cooperate with the documents the Land Department needs to register a foreign-owned unit, including the bank\'s foreign exchange transaction form for money brought from abroad. The Seller confirms that registering the Unit to the Buyer keeps foreign ownership of the building within 49 percent of the unit area.',_:'The Seller shall complete the registration of the Unit in the Buyer\'s name within 60 days of completion.'}};
function clauses(){const c=v('country'),cur=(v('cur')||CUR[c]||'').toUpperCase(),seller=or(v('seller'),'[Seller]'),date=dt(v('date')),g=or(v('grace'),'0'),pen=or(v('pen'),'0'),cap=or(v('cap'),'0'),int=or(v('int'),'0'),lg=or(v('long'),'6'),sn=or(v('snag'),'30');
 const paid=num(v('paid'))!=null?' (so far '+money(v('paid'),cur)+')':'';const L=[];
 if(ck('escrow'))L.push(['escrow','Protection of payments','All amounts the Buyer pays before completion'+paid+' shall be held in '+(SPEC.escrow[c]||SPEC.escrow._)+'. Within 15 days of signing this addendum the Seller shall give the Buyer written evidence of this protection. While the evidence is missing, the Buyer may hold back any further payment without being in breach.']);
 if(ck('delay'))L.push(['delay','Delay penalty','The Seller shall complete the Unit by '+date+'. If completion is later than that date plus '+g+' month(s), the Seller shall pay the Buyer '+pen+' percent of all amounts paid for each full month of delay, up to '+cap+' percent of the total price. The penalty is due monthly, may be set off against any amount the Buyer still owes, and does not limit the Buyer\'s right to cancel under the clause on cancellation.'+(c==='MX'?' The parties agree that this penalty and any penalty on the Buyer are reciprocal and equivalent.':'')]);
 if(ck('refund'))L.push(['refund','Cancellation and refund with interest','If the Unit is not completed '+lg+' month(s) after '+date+', or if a permit listed in this addendum is refused, suspended or revoked, the Buyer may cancel the contract by written notice. The Seller shall then refund all amounts paid within 30 days, with interest at '+int+' percent per year from the date of each payment until the refund is received'+(c==='ES'?', and never less than the legal interest provided by the First additional provision of Law 38/1999':'')+'. No cancellation fee or deduction applies.']);
 if(ck('complete'))L.push(['complete','What counts as completion','The Unit is complete only when all of these exist: (a) '+(SPEC.cert[c]||'the certificate of occupancy or its local equivalent')+'; (b) the Unit is built as in the plans and specification attached to the contract; (c) the common areas, access and utilities listed in the contract are connected and usable; and (d) the Unit can be transferred or registered to the Buyer. A notice of completion without these does not start any period that runs against the Buyer.']);
 if(ck('permits'))L.push(['permits','Permits as a condition',seller+' confirms that it holds '+(SPEC.permits[c]||'every permit needed to build and sell the Project')+'. The Seller shall give the Buyer copies within 15 days of signing. If any of them is missing, refused, suspended or revoked, the Buyer may cancel and the clause on refunds applies.']);
 if(ck('snag'))L.push(['snag','Snagging and defects','Before completion the Buyer, or an inspector the Buyer chooses, may inspect the Unit with the Seller and list defects in writing. The Seller shall fix the listed defects within '+sn+' days at its own cost. The Buyer may hold back up to 5 percent of the price until the listed defects are fixed. This clause does not limit the Seller\'s liability for defects under the law.']);
 if(ck('reg'))L.push(['reg','Registration of the purchase',SPEC.reg[c]||SPEC.reg._]);
 return L}
function basis(k){const c=v('country');return((K.BASIS[c]||{})[k]||[]).map(id=>K.LAW[id]).filter(Boolean)}
function head(){const c=v('country'),cn=(K.C.find(x=>x[0]===c)||[])[1]||c,cur=(v('cur')||CUR[c]||'').toUpperCase();
 return{title:'Addendum to the purchase contract (draft for discussion)',lines:['Property: '+or(v('project'),'[Project]')+', unit '+or(v('unit'),'[Unit]')+', '+cn,'Seller: '+or(v('seller'),'[Seller]'),'Buyer: '+or(v('buyer'),'[Buyer]'),'Contract amended: '+or(v('contract'),'[contract name and date]'),'Total price: '+money(v('price'),cur)+(v('sched')?'. Payment schedule: '+v('sched'):'')],
 intro:'The parties agree to add the following clauses to the contract. Where this addendum and the contract differ, this addendum prevails.',
 foot:['Draft prepared with kolaboro.com/tools/contract-addendum/ on '+new Date().toISOString().slice(0,10)+'. A draft to discuss with your lawyer, not legal advice. Each legal reference was read in the official source on the date shown; laws change. Where no statute is cited, the clause is a contractual protection the Seller may refuse.','Signed for the Seller: ______________________   Date: __________','Signed by the Buyer: ______________________   Date: __________']}}
function render(){const H=head(),L=clauses();let h='<h3>'+e(H.title)+'</h3>'+H.lines.map(x=>'<p class="kca-meta">'+e(x)+'</p>').join('')+'<p>'+e(H.intro)+'</p>';
 if(!L.length)h+='<p class="k-muted">'+e(t.empty)+'</p>';
 L.forEach((c,i)=>{const B=basis(c[0]);h+='<h4>'+(i+1)+'. '+e(c[1])+'</h4><p>'+e(c[2])+'</p>'+(B.length?B.map(b=>'<div class="kca-law" lang="en"><b>'+e(b.law)+', '+e(b.cite)+'</b> <a class="k-src" href="'+e(b.url)+'" rel="noopener" target="_blank">'+e(t.law_open)+'</a><q lang="'+e(b.lang)+'">'+e(b.quote)+'</q>'+(b.tr?'<small>'+e(t.trans)+': '+e(b.tr)+'</small>':'')+(b.note?'<small style="display:block">'+e(t.note)+': '+e(b.note)+'</small>':'')+'</div>').join(''):'<div class="kca-law is-none" lang="'+e(K.lang)+'" dir="auto">'+e(t.law_none)+'</div>')});
 h+=H.foot.map((x,i)=>'<p class="'+(i?'':'kca-meta')+'">'+e(x)+'</p>').join('');D.innerHTML=h;
 document.querySelectorAll('[data-basis]').forEach(s=>{const B=basis(s.dataset.basis);s.textContent=B.length?B.map(b=>b.cite).join('; '):'-'})}
F.addEventListener('input',render);F.addEventListener('change',ev=>{if(ev.target.name==='country'){F.elements.cur.value=CUR[F.elements.country.value]||''}render()});
try{const q=new URLSearchParams(location.search).get('c');if(q&&CUR[q]){F.elements.country.value=q;F.elements.cur.value=CUR[q]}}catch(x){}
render();
function plain(){const H=head(),L=clauses(),P=[];P.push({h:1,t:H.title});H.lines.forEach(x=>P.push({t:x,m:1}));P.push({t:H.intro});
 L.forEach((c,i)=>{P.push({h:2,t:(i+1)+'. '+c[1]});P.push({t:c[2]});const B=basis(c[0]);if(B.length)B.forEach(b=>{P.push({t:'Legal basis: '+b.law+', '+b.cite+'. '+b.url,s:1});if(b.lang==='en'||b.lang==='es'||b.lang==='pt'||b.lang==='id')P.push({t:'"'+b.quote+'"',s:1,i:1});else P.push({t:'Original text: see the official source above.',s:1});if(b.tr)P.push({t:'English translation: '+b.tr,s:1});if(b.note)P.push({t:'Note: '+b.note,s:1})});else P.push({t:'Legal basis: none in our law notes for this point; contractual protection only.',s:1})});
 H.foot.forEach(x=>P.push({t:x,m:1}));return P}
const fname=x=>('addendum-'+(v('project')||'draft')).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)+'.'+x;
function save(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000)}
let jsp=null;function loadPdf(){if(jsp)return jsp;jsp=new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';s.integrity='sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk';s.crossOrigin='anonymous';s.onload=()=>window.jspdf?res(window.jspdf):rej(new Error('no jsPDF'));s.onerror=()=>{jsp=null;rej(new Error('network'))};document.head.appendChild(s)});return jsp}
const latin=s=>{let r=false;const o=String(s).replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/[\u2013\u2014]/g,'-').replace(/\u2026/g,'...').replace(/[^\x09\x0a\x0d\x20-\x7e\xa0-\xff]/g,()=>{r=true;return'?'});return[o,r]};
$('#kca-pdf').addEventListener('click',async()=>{const b=$('#kca-pdf');b.disabled=true;ST.textContent=t.st_pdf+'...';try{const J=await loadPdf(),doc=new J.jsPDF({unit:'pt',format:'a4'}),W=doc.internal.pageSize.getWidth(),Hh=doc.internal.pageSize.getHeight(),M=56;let y=M,rep=false;
 for(const p of plain()){const [txt,r]=latin(p.t);rep=rep||r;const sz=p.h===1?15:p.h===2?12:p.s?9:10.5;doc.setFont('helvetica',p.h?'bold':p.i?'italic':'normal');doc.setFontSize(sz);doc.setTextColor(p.s||p.m?90:20);
  const lines=doc.splitTextToSize(txt,W-2*M-(p.s?14:0));const lh=sz*1.38;if(p.h)y+=p.h===1?0:8;for(const ln of lines){if(y+lh>Hh-M){doc.addPage();y=M}doc.text(ln,M+(p.s?14:0),y);y+=lh}y+=p.h?2:5}
 const n=doc.getNumberOfPages();for(let i=1;i<=n;i++){doc.setPage(i);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(120);doc.text('Draft to discuss with your lawyer, not legal advice. Page '+i+' of '+n,M,Hh-28)}
 save(doc.output('blob'),fname('pdf'));ST.textContent=t.st_done+(rep?' '+t.st_latin:'')}catch(x){ST.textContent=t.st_err.replace('{e}',x.message||'error')}b.disabled=false});
// .docx: a stored ZIP (no compression) with the four parts Word needs
const CRC=(()=>{const T=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;T[n]=c>>>0}return b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=T[(c^b[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0}})();
function zip(files){const enc=new TextEncoder(),parts=[],cd=[];let off=0;const u16=n=>[n&255,(n>>8)&255],u32=n=>[n&255,(n>>8)&255,(n>>16)&255,(n>>>24)&255];
 for(const[name,txt]of files){const nb=enc.encode(name),db=enc.encode(txt),c=CRC(db);const h=new Uint8Array([0x50,0x4b,3,4,...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(c),...u32(db.length),...u32(db.length),...u16(nb.length),...u16(0)]);
  parts.push(h,nb,db);cd.push(new Uint8Array([0x50,0x4b,1,2,...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0x21),...u32(c),...u32(db.length),...u32(db.length),...u16(nb.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),nb);off+=h.length+nb.length+db.length}
 const cdl=cd.reduce((a,b)=>a+b.length,0);parts.push(...cd,new Uint8Array([0x50,0x4b,5,6,0,0,0,0,...u16(files.length),...u16(files.length),...u32(cdl),...u32(off),0,0]));return new Blob(parts,{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'})}
const x=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,'');
$('#kca-docx').addEventListener('click',()=>{try{const body=plain().map(p=>'<w:p><w:pPr>'+(p.h?'<w:pStyle w:val="Heading'+p.h+'"/>':'')+(p.s?'<w:ind w:left="360"/>':'')+'<w:spacing w:after="120"/></w:pPr><w:r><w:rPr>'+(p.h?'<w:b/>':'')+(p.i?'<w:i/>':'')+'<w:sz w:val="'+(p.h===1?30:p.h===2?24:p.s?18:21)+'"/>'+(p.s||p.m?'<w:color w:val="555555"/>':'')+'</w:rPr><w:t xml:space="preserve">'+x(p.t)+'</w:t></w:r></w:p>').join('');
 const docx=zip([['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'],
  ['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
  ['word/_rels/document.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
  ['word/styles.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Arial"/><w:sz w:val="21"/><w:lang w:val="en-GB"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="30"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style></w:styles>'],
  ['word/document.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+body+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>']]);
 save(docx,fname('docx'));ST.textContent=t.st_done}catch(z){ST.textContent=t.st_err.replace('{e}',z.message||'error')}});
$('#kca-print').addEventListener('click',()=>window.print());})();`;

async function assembleTool(shellRes, lang, env) {
  const t = tt(lang), path = '/tools/contract-addendum/', url = ORIGIN + pre(lang) + path;
  const alts = LANGS.map(l => '<link rel="alternate" hreflang="' + l + '" href="' + ORIGIN + pre(l) + path + '">').join('') + '<link rel="alternate" hreflang="x-default" href="' + ORIGIN + path + '">';
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebApplication', name: 'Kolaboro ' + t.title, url, description: t.desc, inLanguage: lang, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
    { '@type': 'BreadcrumbList', itemListElement: [['Kolaboro', ORIGIN + pre(lang) + '/'], [t.crumb_tools, ORIGIN + '/tools/'], [t.title, url]].map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x[0], item: x[1] })) }] };
  const tags = '<title>' + esc(t.title) + ' | Kolaboro</title><meta name="description" content="' + esc(t.desc) + '"><link rel="canonical" href="' + url + '">' + alts +
    '<meta property="og:type" content="website"><meta property="og:site_name" content="Kolaboro"><meta property="og:title" content="' + esc(t.title) + ' | Kolaboro"><meta property="og:description" content="' + esc(t.desc) + '"><meta property="og:url" content="' + url + '"><meta name="twitter:card" content="summary">' +
    '<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin><script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' + CSS;
  const LAW = await lawNotes(env);
  const res = new HTMLRewriter()
    .on('title', { element(e) { e.remove(); } })
    .on('meta[name="description"],meta[name="robots"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],link[rel="alternate"][hreflang]', { element(e) { e.remove(); } })
    .on('script[type="application/ld+json"]', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.setAttribute('data-clarity-mask', 'True'); e.setInnerContent(toolBody(lang, LAW), { html: true }); } })
    .on('details.lsw a[hreflang]', { element(e) { const l = e.getAttribute('hreflang'); if (LANGS.includes(l)) e.setAttribute('href', pre(l) + path); } })
    .transform(new Response(shellRes.body, { headers: { 'content-type': 'text/html; charset=utf-8' } }));
  return await res.text();
}
export async function handleTool(req, u, env, ctx, shell) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return null;
  const m = u.pathname.match(/^\/(?:(es|de|fr|nl|ru|zh|ar)\/)?tools\/contract-addendum(\/?)$/); if (!m) return null;
  if (!m[2]) return new Response(null, { status: 301, headers: { location: u.pathname + '/' + u.search, 'cache-control': 'public, max-age=86400' } });
  const lang = m[1] || 'en';
  const sh = await shell(pre(lang) + '/how-we-score/');
  if (!sh || sh.status !== 200) return null;
  return new Response(await assembleTool(sh, lang, env), { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' } });
}
