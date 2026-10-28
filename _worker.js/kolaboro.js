// kolaboro.com API (loaded by _worker.js/index.js for host kolaboro.com, paths /api/kb/*).
// POST /api/kb/analyze {url, email} -> desk review of a project's own website (advertised claims + questions to verify).

const MODELS = ['claude-haiku-5-5', 'claude-sonnet-5-5'];
const MAX_TEXT = 14000;
const PER_IP_HOUR = 6;
const TRACKED = ['every-bali.com', 'balitecture.com', 'breig-property.com', 'magnumestate.com', 'teus-group.com', 'lyvinproperties.co',
  'investlandbali.com', 'globalbalihome.com', 'urbanescape.id', 'coreconceptliving.com', 'axoradevelopments.com', 'cocodevelopmentgroup.com',
  'movepropertygroup.com', 'aravitaresidence.com'];

const PROMPT = `You are the research agent of Kolaboro, a company that protects people who buy property abroad, especially off-plan.
Below is the text of a web page about a property project. Extract ONLY what the page itself says. Never guess, never accuse.
Reply with ONLY one JSON object, no other text:
{
 "project": string|null, "developer": string|null, "location": string|null, "country": string|null,
 "property_type": string|null, "price_from": string|null,
 "title_type": "leasehold"|"freehold"|"company structure"|"other"|null, "lease_years": string|null,
 "extension_promised": true|false|null, "completion": string|null,
 "advertised_return": string|null, "guaranteed_language": true|false,
 "permit_claim": string|null, "payment_plan": string|null,
 "promises": [up to 6 short verbatim or near-verbatim claims from the page],
 "questions": [4 to 6 precise questions a buyer must get answered with a document or a site visit before paying, each tied to a claim above],
 "missing": [up to 5 important things the page does NOT state, e.g. permit number, land certificate, escrow, delivery penalty],
 "attention": "low"|"medium"|"high",
 "summary": "two sentences, neutral, for the buyer: what is advertised and what most needs checking"
}
"attention" reflects how much must be verified before paying (unverifiable guarantees, very high returns, missing title or permit info), not a judgement of honesty.`;

function json(o, s = 200) {
  return new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}

function okUrl(raw) {
  let u; try { u = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw); } catch (e) { return null; }
  if (!/^https?:$/.test(u.protocol)) return null;
  const h = u.hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal') || /^[\d.]+$/.test(h) || h.includes(':') || !h.includes('.')) return null;
  if (h.endsWith('kolaboro.com')) return null;
  u.hash = ''; return u;
}

function textOf(html) {
  return html.replace(/<(script|style|noscript|svg|iframe)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
}

async function rateLimited(req, ctx) {
  const ip = req.headers.get('cf-connecting-ip') || 'x';
  const hour = new Date().toISOString().slice(0, 13);
  const k = new Request('https://kolaboro.com/__rl/' + encodeURIComponent(ip) + '/' + hour);
  const c = caches.default; const hit = await c.match(k);
  const n = hit ? (+(await hit.text()) || 0) : 0;
  if (n >= PER_IP_HOUR) return true;
  ctx.waitUntil(c.put(k, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=3600' } })));
  return false;
}

async function claude(env, prompt) {
  let last = '';
  for (const model of MODELS) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model, max_tokens: 1400, messages: [{ role: 'user', content: prompt }] })
    });
    if (r.status === 400 || r.status === 404) { last = model + ' ' + r.status; continue; }
    if (!r.ok) { const t = await r.text(); throw new Error('model ' + r.status + ' ' + t.slice(0, 160)); }
    const d = await r.json();
    const t = (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    const m = t.match(/\{[\s\S]*\}/); if (!m) throw new Error('no json');
    return JSON.parse(m[0]);
  }
  throw new Error(last || 'no model');
}

async function analyze(req, env, ctx) {
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'not_configured' }, 503);
  let b; try { b = await req.json(); } catch (e) { return json({ error: 'bad_request' }, 400); }
  if (b.company) return json({ error: 'bad_request' }, 400);
  const email = String(b.email || '').trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'email' }, 400);
  const u = okUrl(String(b.url || '').trim().slice(0, 500));
  if (!u) return json({ error: 'url' }, 400);
  const host = u.hostname.replace(/^www\./, '');
  const tracked = TRACKED.some(d => host === d || host.endsWith('.' + d));
  const ck = new Request('https://kolaboro.com/__kb_desk/' + encodeURIComponent(host + u.pathname.replace(/\/$/, '')));
  const cache = caches.default;
  const hit = await cache.match(ck);
  if (hit) { const d = await hit.json(); return json({ ...d, cached: true, first: false, tracked }); }
  if (await rateLimited(req, ctx)) return json({ error: 'rate' }, 429);
  let html = '';
  try {
    const r = await fetch(u.toString(), { headers: { 'user-agent': 'Mozilla/5.0 (compatible; KolaboroResearchAgent/1.0; +https://kolaboro.com/research)', 'accept': 'text/html' }, redirect: 'follow', cf: { cacheTtl: 3600 } });
    if (!r.ok) return json({ error: 'fetch', status: r.status }, 422);
    html = (await r.text()).slice(0, 1500000);
  } catch (e) { return json({ error: 'fetch' }, 422); }
  const text = textOf(html).slice(0, MAX_TEXT);
  if (text.length < 200) return json({ error: 'empty' }, 422);
  let out;
  try { out = await claude(env, PROMPT + '\n\nURL: ' + u.toString() + '\nPage text:\n<<<\n' + text + '\n>>>'); }
  catch (e) { return json({ error: 'model', detail: String(e.message || e).replace(/sk-[\w-]+/g, '') }, 503); }
  const res = { url: u.toString(), host, analysed: new Date().toISOString(), report: out };
  ctx.waitUntil(cache.put(ck, new Response(JSON.stringify(res), { headers: { 'content-type': 'application/json', 'cache-control': 'max-age=604800' } })));
  return json({ ...res, cached: false, first: !tracked, tracked });
}

export async function api(req, u, env, ctx) {
  if (u.pathname === '/api/kb/analyze' && req.method === 'POST') return analyze(req, env, ctx);
  if (u.pathname === '/api/kb/health') return json({ ok: true, configured: !!env.ANTHROPIC_API_KEY });
  return json({ error: 'not_found' }, 404);
}
