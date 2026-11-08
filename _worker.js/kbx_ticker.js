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

async function file(env, n) {
  try { const r = await env.ASSETS.fetch(new Request(ORIGIN + '/_s/kolaboro.com/data/' + n)); if (r.ok) return await r.json(); } catch (e) {}
  return null;
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

export async function kbTick(req, r, env) {
  try {
    if (req.method !== 'GET' || !r || r.status !== 200 || !/text\/html/.test(r.headers.get('content-type') || '')) return r;
    const h = await tickerHtml(env);
    if (!h) return r;
    return new HTMLRewriter().on('.ship-g', { element(e) { e.setInnerContent(h, { html: true }); } }).transform(r);
  } catch (e) { return r; }
}
