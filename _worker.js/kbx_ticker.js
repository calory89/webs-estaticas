// "Shipping daily" bar at the top of every kolaboro.com page, rendered at the edge so it always shows the latest changes
// without rebuilding thousands of static pages. Source, newest first:
//   1. /data/ticker.json: one plain-English line per change, written in the same commit that ships it (the rule for every ship);
//   2. if that file has fewer than 8 lines, the newest day summaries from /data/shipping.json (the automatic daily log).
// Cached in memory for 5 minutes per isolate. No AI, no third parties.
const ORIGIN = 'https://kolaboro.com';
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const day = s => { const x = new Date(String(s).slice(0, 10) + 'T00:00:00Z'); return isNaN(x) ? '' : MON[x.getUTCMonth()] + ' ' + x.getUTCDate(); };
let C = { t: 0, h: null };
const SITE_V = 'tk18b'; // bump when _s/kolaboro.com/k/site.js changes (pages hard-code an older ?v=)

async function file(env, n) {
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + n)); if (r.ok) return await r.json(); } catch (e) {}
  return null;
}

let I = { t: 0, v: null };
export async function tickerItems(env) {
  if (I.v && Date.now() - I.t < 300000) return I.v;
  const T = await file(env, 'ticker.json');
  I = { t: Date.now(), v: ((T && T.items) || []).filter(x => x && x.text && x.date) };
  return I.v;
}
// /api/open/summary ships list (read by site.js for the live bar): hand lines first, then the automatic agent entries, newest first
export function mergeShips(items, ships) {
  const a = items.map(x => ({ d: String(x.date).slice(0, 10), k: x.kind === 'data' ? 'data' : 'feature', t: x.text, tl: x.tl || undefined, u: x.url || undefined }));
  const seen = new Set(a.map(x => x.t.toLowerCase()));
  for (const s of ships) if (s && s.t && !seen.has(s.t.toLowerCase())) a.push(s);
  return a.sort((x, y) => String(y.d).localeCompare(String(x.d))).slice(0, 24);
}

export async function tickerHtml(env) {
  if (C.h !== null && Date.now() - C.t < 300000) return C.h;
  const [T, S] = await Promise.all([file(env, 'ticker.json'), file(env, 'shipping.json')]);
  const items = [];
  for (const x of (T && T.items) || []) if (x && x.text && x.date) items.push(x);
  if (items.length < 8) for (const d of ((S && S.days) || []).slice(-3).reverse()) for (const l of ((d.summary || {}).lines || []).slice(0, 4)) if (l && l.text) items.push({ date: d.date, kind: 'shipped', text: l.text });
  const seen = new Set(), out = [];
  items.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  for (const x of items) { const k = x.text.toLowerCase().trim(); if (seen.has(k)) continue; seen.add(k); out.push(x); if (out.length >= 16) break; }
  const h = out.map(x => '<span class="si"><b>' + esc(day(x.date)) + '</b><em class="' + (x.kind === 'data' ? 'k-data">DATA' : 'k-feature">SHIPPED') + '</em>' + esc(x.text) + '</span>').join('');
  C = { t: Date.now(), h };
  return h;
}

// n20s (9 Nov 2026), defence in depth on every HTML page: a link whose address is a script or data URL (it could only come from
// third-party text such as an OpenStreetMap tag, a register record or a developer page) is made inert. Escaping alone does not stop these.
// The selector only fires on the rare href that contains "script" or starts with "data:", so normal pages pay nothing.
const BAD_HREF = 'a[href*="script" i], a[href^="data:" i], a[href*="&#"], a[href*="&colon" i], a[href*="&tab" i], a[href*="&newline" i], area[href*="script" i]';
const deEnt = v => v.replace(/&#x([0-9a-f]{1,6});?/gi, (m, h) => { try { return String.fromCodePoint(parseInt(h, 16)); } catch (e) { return ''; } }).replace(/&#(\d{1,7});?/g, (m, n) => { try { return String.fromCodePoint(+n); } catch (e) { return ''; } }).replace(/&colon;/gi, ':').replace(/&(?:tab|newline);/gi, '');
function safeHref(e) { const v = deEnt(e.getAttribute('href') || '').replace(/[\t\n\r]/g, ''); if (/^[\u0000- ]*(?:javascript|vbscript|data):/i.test(v)) { e.setAttribute('href', '#'); e.removeAttribute('target'); } }
export async function kbTick(req, r, env) {
  try {
    if (req.method !== 'GET' || !r || r.status !== 200 || !/text\/html/.test(r.headers.get('content-type') || '')) return r;
    const h = await tickerHtml(env);
    let rw = new HTMLRewriter().on(BAD_HREF, { element: safeHref });
    if (h) rw = rw.on('.ship-g', { element(e) { e.setInnerContent(h, { html: true }); } }).on('script[src^="/k/site.js"]', { element(e) { e.setAttribute('src', '/k/site.js?v=' + SITE_V); } });
    return rw.transform(r);
  } catch (e) { return r; }
}
