// kolaboro.com API (loaded by _worker.js/index.js for host kolaboro.com, paths /api/kb/*).
// POST /api/kb/analyze {url, email} -> desk review of a project's own website (advertised claims + questions to verify).

const MODELS = ['claude-haiku-5-5', 'claude-sonnet-5-5'];
const MAX_TEXT = 14000;
const PER_IP_HOUR = 12;
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
Keep every string under 25 words. Output the JSON only, starting with { and ending with }.
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

const PILOT = new WeakSet();
// identifies this worker to the database for usage logging and timestamp storage (private: the worker source is not served)
const WKEY = 'kbw_05b9a76d1e8195c0d4b0ef74e8d01b5d16b0276008bbc0d0';
async function rateLimited(req, ctx) {
  if (PILOT.has(req)) return false;
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
      body: JSON.stringify({ model, max_tokens: 3000, messages: [{ role: 'user', content: prompt }] })
    });
    if (r.status === 400 || r.status === 404) { last = model + ' ' + r.status; continue; }
    if (!r.ok) { const t = await r.text(); throw new Error('model ' + r.status + ' ' + t.slice(0, 160)); }
    const d = await r.json();
    const t = (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    const m = t.match(/\{[\s\S]*\}/); if (!m) throw new Error('no json ' + d.stop_reason + ' ' + t.slice(0, 120));
    return JSON.parse(m[0]);
  }
  throw new Error(last || 'no model');
}

async function analyze(req, env, ctx) {
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'not_configured' }, 503);
  let b; try { b = await req.json(); } catch (e) { return json({ error: 'bad_request' }, 400); }
  if (b.company) return json({ error: 'bad_request' }, 400);
  const email = String(b.email || '').trim();
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'email' }, 400);
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


const COPILOT_PROMPT = `You are the Kolaboro agent copilot. Kolaboro trains local people (not lawyers) to verify off-plan property for overseas buyers. A junior agent pastes text from documents about ONE property (land certificate, brochure, contract, permit, developer messages). Your job: tell the agent exactly what is inconsistent, what to ask for, what to check on site, and when to escalate to a notary or lawyer. Be concrete and short. Never give legal conclusions; flag and route.
Reply with ONLY one JSON object:
{
 "inconsistencies": [{"topic": string, "a": string, "b": string, "severity": "low"|"medium"|"high", "why": string}],
 "ask_for": [up to 6 precise documents or answers the agent must request, each naming who to ask],
 "check_on_site": [up to 6 things to verify physically, each measurable],
 "escalate": {"needed": true|false, "to": "notary"|"lawyer"|"surveyor"|"none", "why": string},
 "status": "go"|"hold"|"stop_and_escalate",
 "summary": "two sentences for the agent"
}
Use the documents' own words in "a" and "b". Keep every string under 30 words.`;

async function copilot(req, env, ctx) {
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'not_configured' }, 503);
  let b; try { b = await req.json(); } catch (e) { return json({ error: 'bad_request' }, 400); }
  if (b.company) return json({ error: 'bad_request' }, 400);
  const docs = (Array.isArray(b.docs) ? b.docs : []).slice(0, 5).map(d => ({ label: String(d.label || 'Document').slice(0, 60), text: String(d.text || '').slice(0, 5000) })).filter(d => d.text.trim().length > 20);
  if (docs.length < 1) return json({ error: 'empty' }, 400);
  const body = docs.map((d, i) => `### Document ${i + 1}: ${d.label}\n${d.text}`).join('\n\n');
  const ck = new Request('https://kolaboro.com/__kb_cop/' + await sha(body));
  const hit = await caches.default.match(ck);
  if (hit) { const d = await hit.json(); return json({ ...d, cached: true }); }
  if (await rateLimited(req, ctx)) return json({ error: 'rate' }, 429);
  let out;
  try { out = await claude(env, COPILOT_PROMPT + '\n\nMilestone or stage: ' + String(b.stage || 'pre-purchase').slice(0, 60) + '\n\n' + body); }
  catch (e) { return json({ error: 'model' }, 503); }
  const res = { analysed: new Date().toISOString(), copilot: out };
  ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify(res), { headers: { 'content-type': 'application/json', 'cache-control': 'max-age=604800' } })));
  return json({ ...res, cached: false });
}

async function sha(t) { const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return [...new Uint8Array(h)].map(x => x.toString(16).padStart(2, '0')).join(''); }

async function logged(kind, fn, ctx) {
  const t0 = Date.now(); const r = await fn(); const ms = Date.now() - t0;
  try {
    const d = await r.clone().json();
    const k = kind === 'stamp' ? (d.found !== undefined ? 'stamp_lookup' : 'stamp_new') : kind;
    if (d.error !== 'rate' && d.error !== 'bad_request') ctx.waitUntil(rpc('kolaboro_api_log', { p_kind: k, p_ok: r.ok, p_cached: !!(d.cached || d.existing), p_ms: ms, p_wkey: WKEY }).catch(() => {}));
  } catch (e) {}
  const h = new Headers(r.headers); h.set('server-timing', 'app;dur=' + ms);
  return new Response(r.body, { status: r.status, headers: h });
}

async function stats(ctx) {
  const ck = new Request('https://kolaboro.com/__kb_stats');
  const hit = await caches.default.match(ck); if (hit) return json(await hit.json());
  try { const d = await rpc('kolaboro_public_stats', {}); delete d.agent_applications; ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify(d), { headers: { 'content-type': 'application/json', 'cache-control': 'max-age=60' } }))); return json(d); }
  catch (e) { return json({ error: 'db' }, 503); }
}

async function health(env) {
  const t0 = Date.now(); let db = false;
  try { await rpc('kolaboro_public_stats', {}); db = true; } catch (e) {}
  return json({ ok: true, api: 'up', models_configured: !!env.ANTHROPIC_API_KEY, database: db ? 'up' : 'down', db_ms: Date.now() - t0, time: new Date().toISOString() });
}

export async function api(req, u, env, ctx) {
  if (u.pathname === '/api/kb/progress' && req.method === 'POST') return logged('progress', () => progress(req, env, ctx), ctx);
  if (u.pathname === '/api/kb/stamp' && (req.method === 'POST' || req.method === 'GET')) return logged('stamp', () => stamp(req, env, ctx), ctx);
  if (u.pathname === '/api/kb/copilot' && req.method === 'POST') return logged('copilot', () => copilot(req, env, ctx), ctx);
  if (u.pathname === '/api/kb/analyze' && req.method === 'POST') return logged('analyze', () => analyze(req, env, ctx), ctx);
  if (u.pathname === '/api/kb/certificate' && req.method === 'POST') return logged('certificate', () => certificate(req, env, ctx), ctx);
  if (u.pathname === '/api/kb/document' && req.method === 'POST') return logged('document', () => documentRead(req, env, ctx), ctx);
  if (u.pathname === '/api/kb/report-draft' && req.method === 'POST') return logged('report_draft', () => reportDraft(req, env, ctx), ctx);
  if (u.pathname === '/api/kb/telegram' && req.method === 'POST') return telegram(req, env, ctx);
  if (u.pathname === '/api/kb/ask' && req.method === 'POST') return logged('ask', () => ask(req, env, ctx), ctx);
  if (u.pathname.startsWith('/api/v1')) return apiV1(req, u, env, ctx);
  if (u.pathname === '/api/kb/stats') return stats(ctx);
  if (u.pathname === '/api/kb/health') return health(env);
  return json({ error: 'not_found' }, 404);
}

// ---------- Plan vs reality: vision check of site photos against what was sold ----------
const PROGRESS_PROMPT = `You are the Kolaboro progress checker. A local agent photographed an off-plan construction site before the buyer pays the next instalment. You get the site photos, optionally a render or plan from the developer's brochure, and what the developer claims about the current stage.
Judge ONLY what is visible. Never guess about things you cannot see; say so instead.
Reply with ONLY one JSON object:
{
 "observed_stage": "land clearing"|"foundations"|"structure"|"roof"|"walls and openings"|"finishes"|"complete"|"unclear",
 "built_pct": integer 0-100 (your estimate of physical completion of the whole building from the photos),
 "confidence": "low"|"medium"|"high",
 "elements": [{"item": string, "expected": string, "observed": string, "status": "matches"|"differs"|"missing"|"not visible"}],
 "discrepancies": [up to 5 concrete differences between what is sold or claimed and what is visible],
 "pay_signal": "consistent"|"ahead_of_works"|"cannot_tell",
 "retake": [up to 4 specific photos the agent should take to raise confidence, each naming angle and subject],
 "summary": "two sentences for the buyer"
}
pay_signal compares the share already paid (if given) to built_pct: "ahead_of_works" when payments exceed visible works by more than 15 points. Keep strings under 25 words.`;

function parseJson(t) {
  const m = t.match(/\{[\s\S]*\}/); if (!m) throw new Error('no json');
  try { return JSON.parse(m[0]); } catch (e) {}
  // light repair: smart quotes, trailing commas, raw newlines inside strings
  const r = m[0].replace(/[\u201c\u201d]/g, '\\"').replace(/,\s*([}\]])/g, '$1').replace(/\n(?=[^"]*"\s*[,}\]])/g, ' ');
  return JSON.parse(r);
}
async function claudeVision(env, content, maxTokens) {
  let last = '';
  for (const model of ['claude-sonnet-5-5', 'claude-haiku-5-5', 'claude-sonnet-5-5']) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model, max_tokens: maxTokens || 2500, system: 'Reply with one valid JSON object only. Inside JSON strings never use unescaped double quotes: use single quotes or the typographic quotes the document uses.', messages: [{ role: 'user', content }] })
    });
    if (r.status === 404 || (r.status === 400 && !last)) { last = model + ' ' + r.status + ' ' + (await r.text()).slice(0, 200); continue; }
    if (!r.ok) { last = 'model ' + r.status + ' ' + (await r.text()).slice(0, 160); if (r.status >= 500 || r.status === 429) continue; throw new Error(last); }
    const d = await r.json();
    const t = (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    try { return parseJson(t); } catch (e) { last = 'json: ' + e.message; continue; }
  }
  throw new Error(last || 'no model');
}

async function progress(req, env, ctx) {
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'not_configured' }, 503);
  const raw = await req.text();
  if (raw.length > 4500000) return json({ error: 'too_big' }, 413);
  let b; try { b = JSON.parse(raw); } catch (e) { return json({ error: 'bad_request' }, 400); }
  if (b.company) return json({ error: 'bad_request' }, 400);
  const img = x => { const m = /^data:(image\/(jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(x || '')); return m ? { type: 'image', source: { type: 'base64', media_type: m[1], data: m[3] } } : null; };
  const photos = (Array.isArray(b.photos) ? b.photos : []).slice(0, 4).map(img).filter(Boolean);
  if (!photos.length) return json({ error: 'photos' }, 400);
  const plan = img(b.plan);
  const claim = String(b.claim || '').slice(0, 1500), paid = Math.max(0, Math.min(100, parseInt(b.paid_pct, 10) || 0));
  const key = await sha(JSON.stringify([b.photos, b.plan || '', claim, paid]));
  const ck = new Request('https://kolaboro.com/__kb_prog/' + key);
  const hit = await caches.default.match(ck);
  if (hit) { const d = await hit.json(); return json({ ...d, cached: true }); }
  if (await rateLimited(req, ctx)) return json({ error: 'rate' }, 429);
  const content = [];
  photos.forEach((p, i) => { content.push({ type: 'text', text: 'Site photo ' + (i + 1) + ':' }); content.push(p); });
  if (plan) { content.push({ type: 'text', text: 'Render or plan from the developer brochure:' }); content.push(plan); }
  content.push({ type: 'text', text: PROGRESS_PROMPT + '\n\nDeveloper claim about this stage: ' + (claim || 'not given') + '\nShare of the price already paid by the buyer: ' + (paid ? paid + '%' : 'not given') });
  let out;
  try { out = await claudeVision(env, content); }
  catch (e) { return json({ error: 'model', detail: String(e.message || e).replace(/sk-[\w-]+/g, '') }, 503); }
  const res = { analysed: new Date().toISOString(), photos: photos.length, plan: !!plan, paid_pct: paid || null, progress: out };
  ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify(res), { headers: { 'content-type': 'application/json', 'cache-control': 'max-age=604800' } })));
  return json({ ...res, cached: false });
}

// ---------- Public timestamping of evidence fingerprints (OpenTimestamps, anchored in Bitcoin) ----------
const SB_RPC = 'https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw';
const CALENDARS = ['https://a.pool.opentimestamps.org', 'https://b.pool.opentimestamps.org', 'https://a.pool.eternitywall.com'];
const OTS_MAGIC = [0x00, 0x4f, 0x70, 0x65, 0x6e, 0x54, 0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d, 0x70, 0x73, 0x00, 0x00, 0x50, 0x72, 0x6f, 0x6f, 0x66, 0x00, 0xbf, 0x89, 0xe2, 0xe8, 0x84, 0xe8, 0x92, 0x94];

async function rpc(fn, args) {
  const r = await fetch(SB_RPC + fn, { method: 'POST', headers: { apikey: SB_ANON, authorization: 'Bearer ' + SB_ANON, 'content-type': 'application/json' }, body: JSON.stringify(args) });
  if (!r.ok) throw new Error('db ' + r.status);
  return r.json();
}
function hexBytes(h) { const a = new Uint8Array(h.length / 2); for (let i = 0; i < a.length; i++) a[i] = parseInt(h.substr(i * 2, 2), 16); return a; }
function b64(u8) { let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(s); }

async function stamp(req, env, ctx) {
  const u = new URL(req.url);
  if (req.method === 'GET') {
    const h = String(u.searchParams.get('hash') || '').toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(h)) return json({ error: 'hash' }, 400);
    try { const d = await rpc('kolaboro_stamp_get', { p_hash: h }); return json({ found: !!d, stamp: d || null }); }
    catch (e) { return json({ error: 'db' }, 503); }
  }
  let b; try { b = await req.json(); } catch (e) { return json({ error: 'bad_request' }, 400); }
  const h = String(b.hash || '').toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(h)) return json({ error: 'hash' }, 400);
  try { const d = await rpc('kolaboro_stamp_get', { p_hash: h }); if (d) return json({ stamp: d, existing: true }); } catch (e) {}
  const ip = req.headers.get('cf-connecting-ip') || 'x', hour = new Date().toISOString().slice(0, 13);
  const rk = new Request('https://kolaboro.com/__rls/' + encodeURIComponent(ip) + '/' + hour); const rh = await caches.default.match(rk);
  const n = rh ? (+(await rh.text()) || 0) : 0; if (n >= 60) return json({ error: 'rate' }, 429);
  ctx.waitUntil(caches.default.put(rk, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=3600' } })));
  const digest = hexBytes(h);
  const res = await Promise.all(CALENDARS.map(async c => {
    try {
      const r = await fetch(c + '/digest', { method: 'POST', headers: { accept: 'application/vnd.opentimestamps.v1', 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'kolaboro-stamper/1.0' }, body: digest });
      if (!r.ok) return null; const a = new Uint8Array(await r.arrayBuffer()); return a.length > 0 && a.length < 10000 ? { c, a } : null;
    } catch (e) { return null; }
  }));
  const ok = res.filter(Boolean);
  if (!ok.length) return json({ error: 'calendars' }, 503);
  const parts = [...OTS_MAGIC, 0x01, 0x08, ...digest];
  ok.forEach((x, i) => { if (i < ok.length - 1) parts.push(0xff); parts.push(...x.a); });
  const ots = b64(new Uint8Array(parts));
  try {
    const d = await rpc('kolaboro_stamp_put', { p_hash: h, p_ots: ots, p_calendars: ok.map(x => x.c), p_source: String(b.source || 'web').slice(0, 40), p_wkey: WKEY });
    return json({ stamp: d, existing: false });
  } catch (e) { return json({ stamp: { hash: h, ots, calendars: ok.map(x => x.c), created_at: new Date().toISOString() }, stored: false }); }
}

// ---------- Land certificate reader (Indonesian SHM / SHGB / Hak Pakai) ----------
const CERT_PROMPT = `You read photos of Indonesian land certificates (Sertipikat Hak Milik, Hak Guna Bangunan, Hak Pakai) for Kolaboro, which protects foreign property buyers. Transcribe only what is legible; never invent. Then compare with the buyer's claim text if given.
Reply with ONLY one JSON object:
{
 "document_type": "SHM"|"SHGB"|"Hak Pakai"|"Hak Sewa"|"not a land certificate"|"unclear",
 "certificate_number": string|null, "nib": string|null, "surat_ukur": string|null,
 "area_m2": number|null, "village": string|null, "district": string|null, "regency": string|null, "province": string|null,
 "holder": string|null, "holder_type": "individual"|"company"|"unclear",
 "issued": string|null, "expires": string|null,
 "encumbrances": [strings: e.g. Hak Tanggungan (mortgage), blokir, notes in the endorsement pages],
 "legibility": "good"|"partial"|"poor",
 "mismatches": [{"field": string, "certificate": string, "claim": string, "severity": "low"|"medium"|"high"}],
 "flags": [up to 6 plain-English risk notes for a foreign buyer, each tied to what is on the document],
 "next_checks": [up to 5 things the agent must verify at the land office (BPN) or with a notary],
 "summary": "two sentences for the buyer"
}
Rules for flags: foreigners cannot hold SHM; SHGB and Hak Pakai expire and need extension; a company holder needs its deed and NIB checked; a mortgage (Hak Tanggungan) must be lifted before transfer. Keep strings under 30 words.`;

async function certificate(req, env, ctx) {
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'not_configured' }, 503);
  const raw = await req.text(); if (raw.length > 4500000) return json({ error: 'too_big' }, 413);
  let b; try { b = JSON.parse(raw); } catch (e) { return json({ error: 'bad_request' }, 400); }
  if (b.company) return json({ error: 'bad_request' }, 400);
  const m = /^data:(image\/(jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(b.image || ''));
  if (!m) return json({ error: 'image' }, 400);
  const claim = String(b.claim || '').slice(0, 2000), lang = LANGS[b.lang] ? b.lang : 'en';
  const key = await sha(m[3].slice(0, 200000) + '|' + claim + '|' + lang);
  const ck = new Request('https://kolaboro.com/__kb_cert/' + key);
  const hit = await caches.default.match(ck); if (hit) { const d = await hit.json(); return json({ ...d, cached: true }); }
  if (await rateLimited(req, ctx)) return json({ error: 'rate' }, 429);
  let out;
  try { out = await claudeVision(env, [{ type: 'image', source: { type: 'base64', media_type: m[1], data: m[3] } }, { type: 'text', text: CERT_PROMPT + langRule(lang) + '\n\nWhat the developer or brochure claims about this land: ' + (claim || 'not given') }]); }
  catch (e) { return json({ error: 'model', detail: String(e.message || e).replace(/sk-[\w-]+/g, '') }, 503); }
  const res = { analysed: new Date().toISOString(), certificate: out };
  ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify(res), { headers: { 'content-type': 'application/json', 'cache-control': 'max-age=604800' } })));
  return json({ ...res, cached: false });
}


// ---------- Any property document: permit (PBG/IMB/SLF), sale contract (PPJB/AJB), company deed (Akta/NIB), invoice or receipt ----------
const LANGS = { en: 'English', es: 'Spanish', de: 'German', fr: 'French', nl: 'Dutch', ru: 'Russian', zh: 'Simplified Chinese', id: 'Indonesian' };
function langRule(l) { return l && l !== 'en' ? '\n\nWrite every explanation (summary, flags, risks, next checks, mismatch descriptions) in ' + LANGS[l] + '. Keep transcribed values (names, numbers, dates, legal terms) exactly as written on the document.' : ''; }
const DOC_TYPES = {
  permit: 'a building permit or related approval (Indonesia: PBG, old IMB, SLF, KKPR/zoning; elsewhere the local equivalent). Extract permit number, holder, address/plot, permitted use, floors, building area, issue date, issuing office. Flag: holder differs from the developer, use not residential/tourism as sold, more floors/units sold than permitted, permit for a different plot, SLF (fit-for-use) missing for a finished building.',
  contract: 'a property sale or reservation contract (Indonesia: PPJB, AJB, lease agreement; or any off-plan SPA). Extract parties, property, price, payment schedule, completion date, title type, lease term and extension, penalties for late delivery, refund rights, governing law, who holds the title until transfer. In "clauses" list the clauses that put the buyer at risk (unilateral date changes, no penalty for delay, payments not tied to construction milestones, nominee structures, forfeit of all payments on buyer default, extension "promised" without fixed price, dispute forum far from the buyer).',
  company: 'a company deed or registration (Indonesia: Akta Pendirian/Perubahan, SK Kemenkumham/AHU, NIB/OSS, PT PMA). Extract company name, deed number and notary, registration numbers, shareholders, directors, authorised business lines (KBLI), capital. Flag: business lines that do not allow selling or renting property, shareholders that look like nominees, company younger than the project it sells, directors who are not the people you deal with.',
  invoice: 'an invoice, payment request or receipt from a developer or contractor. Extract issuer, bank account holder, amounts, currency, what is being paid for (which milestone), dates. Flag: bank account holder differs from the contracting company, milestone billed that the buyer cannot verify on site, amounts that do not match the payment schedule, personal accounts, crypto or cash requests.',
  certificate: 'an Indonesian land certificate (SHM, SHGB, Hak Pakai). Extract right type, certificate number, NIB, Surat Ukur, area, location, holder, dates, encumbrances (Hak Tanggungan, blokir). Flag: foreigners cannot hold SHM; SHGB/Hak Pakai expire; mortgages must be lifted before transfer.',
  auto: 'any document used when buying property abroad. First decide what it is, then extract what matters for a buyer.'
};
const DOC_PROMPT = (t) => `You read documents for Kolaboro, which protects people who buy property abroad. The buyer uploaded ${DOC_TYPES[t]}
Transcribe only what is legible; never invent a value. If a page is unreadable, say so in "legibility".
Reply with ONLY one JSON object:
{
 "document_kind": short name of what this document is,
 "language": language of the document,
 "fields": [{"label": string, "value": string}] up to 16 most important facts as written,
 "parties": [{"role": string, "name": string}],
 "amounts": [{"label": string, "value": string}],
 "dates": [{"label": string, "value": string}],
 "clauses": [{"clause": string (short quote or reference), "risk": "low"|"medium"|"high", "why": string}],
 "mismatches": [{"field": string, "document": string, "claim": string, "severity": "low"|"medium"|"high"}],
 "flags": [up to 6 risk notes for the buyer, each tied to what is on the document],
 "next_checks": [up to 5 things to verify with the issuing office, a notary or on site],
 "legibility": "good"|"partial"|"poor",
 "summary": "two or three sentences for the buyer"
}
"mismatches" compares the document with the buyer's claim text when given. Keep strings under 35 words. This is not legal advice: route legal conclusions to a notary or lawyer.`;

async function documentRead(req, env, ctx) {
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'not_configured' }, 503);
  const raw = await req.text(); if (raw.length > 7000000) return json({ error: 'too_big' }, 413);
  let b; try { b = JSON.parse(raw); } catch (e) { return json({ error: 'bad_request' }, 400); }
  if (b.company) return json({ error: 'bad_request' }, 400);
  const type = DOC_TYPES[b.type] ? b.type : 'auto', lang = LANGS[b.lang] ? b.lang : 'en', claim = String(b.claim || '').slice(0, 2500);
  const files = (Array.isArray(b.files) ? b.files : [b.file]).filter(Boolean).slice(0, 6), content = [];
  for (const f of files) {
    const m = /^data:(image\/(jpeg|png|webp)|application\/pdf);base64,([A-Za-z0-9+/=]+)$/.exec(String(f));
    if (!m) return json({ error: 'file' }, 400);
    content.push(m[1] === 'application/pdf' ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: m[3] } } : { type: 'image', source: { type: 'base64', media_type: m[1], data: m[3] } });
  }
  if (!content.length) return json({ error: 'file' }, 400);
  const key = await sha(files.map(f => String(f).slice(-120000)).join('|') + '|' + type + '|' + lang + '|' + claim);
  const ck = new Request('https://kolaboro.com/__kb_doc/' + key);
  const hit = await caches.default.match(ck); if (hit) { const d = await hit.json(); return json({ ...d, cached: true }); }
  if (await rateLimited(req, ctx)) return json({ error: 'rate' }, 429);
  content.push({ type: 'text', text: DOC_PROMPT(type) + langRule(lang) + '\n\nWhat the buyer was told (developer, brochure or agent): ' + (claim || 'not given') });
  let out;
  try { out = await claudeVision(env, content, 4000); }
  catch (e) { return json({ error: 'model', detail: String(e.message || e).replace(/sk-[\w-]+/g, '') }, 503); }
  const res = { analysed: new Date().toISOString(), type, lang, pages: files.length, document: out };
  ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify(res), { headers: { 'content-type': 'application/json', 'cache-control': 'max-age=604800' } })));
  return json({ ...res, cached: false });
}


// ---------- Report draft from the evidence (reviewer edits and publishes it in the admin) ----------
const REPORT_PROMPT = `You are the Kolaboro report writer. A buyer abroad paid us to check an off-plan property before paying. Below is everything in their case: what the developer advertises, the documents we read, the agent's site photos and notes (with GPS and time), satellite comparisons and the buyer's notes.
Write the DRAFT of the final report. A human reviewer will edit it before it is sent, and every change they make is recorded.
Rules: use only the evidence given; cite evidence ids in each finding; say "not checked yet" instead of guessing; never accuse anyone; plain English; the buyer is not a lawyer.
Reply with ONLY one JSON object:
{
 "verdict": "safe"|"hold"|"stop",
 "headline": "one sentence the buyer reads first",
 "summary": "3 to 5 sentences",
 "findings": [{"area": "title"|"permit"|"developer"|"progress"|"payments"|"contract"|"returns"|"other", "status": "ok"|"concern"|"red_flag"|"not_checked", "text": "what we found and why it matters, under 45 words", "evidence": [ids]}],
 "before_next_payment": ["up to 5 concrete things to get or do before paying again"],
 "questions_for_developer": ["up to 6 precise questions"],
 "limits": "one sentence on what this check could not cover"
}
verdict: "safe" only when title, permit and progress are each supported by evidence and nothing is a red flag; "stop" when any red flag concerns title, permit, money or progress far behind payments; otherwise "hold".`;

async function reportDraft(req, env, ctx) {
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'not_configured' }, 503);
  let b; try { b = await req.json(); } catch (e) { return json({ error: 'bad_request' }, 400); }
  let input; try { input = await rpc('kolaboro_ops2', { p_key: String(b.key || ''), p_action: 'report_input', p_payload: { case_code: String(b.case_code || '') } }); } catch (e) { return json({ error: 'db' }, 503); }
  if (input.error) return json({ error: input.error }, input.error === 'denied' ? 403 : 400);
  const ev = (input.evidence || []).map(e => { const m = e.meta || {}; const r = m.result || {}; return { id: e.id, kind: e.kind, step: e.step, title: e.title, status: e.status, reason: e.reason, taken_at: e.taken_at, gps: e.lat ? [e.lat, e.lng] : null, by: e.by,
    text: m.text || null, summary: r.summary || m.summary || null, flags: r.flags || null, mismatches: r.mismatches || null, area_m2: r.area_m2 || null, holder: r.holder || null, document_type: r.document_type || m.type || null, change: m.change, risky_clauses: r.risky_clauses || r.clauses || null }; });
  const ctxt = JSON.stringify({ case: input.case, evidence: ev, tasks: (input.tasks || []).map(t => ({ kind: t.kind, status: t.status, agent_note: t.agent_note })) }).slice(0, 60000);
  let out;
  try { out = await claude(env, REPORT_PROMPT + '\n\nCASE FILE (JSON):\n' + ctxt); }
  catch (e) { return json({ error: 'model', detail: String(e.message || e).replace(/sk-[\w-]+/g, '') }, 503); }
  if (!['safe', 'hold', 'stop'].includes(out.verdict)) out.verdict = 'hold';
  let saved = {}; try { saved = await rpc('kolaboro_ops2', { p_key: String(b.key || ''), p_action: 'report_save', p_payload: { case_code: input.case.code, draft: out, model: MODELS.join('/') } }); } catch (e) {}
  return json({ id: saved.id || null, draft: out, evidence: ev.length });
}

// ---------- Pilot API for agencies, lenders and lawyers ----------
const API_DOC = { name: 'Kolaboro pilot API', version: 'v1', auth: 'Send your key in the x-api-key header. Get one at https://kolaboro.com/api-pilot', limits: '200 calls a day per key during the pilot',
  endpoints: [
    { method: 'GET', path: '/api/v1/markets', does: 'What developers advertise in each of the 9 markets we track: title types, lease terms, extension promises, guaranteed-return language, permit numbers published, price bands. Advertised claims, not verified facts.' },
    { method: 'GET', path: '/api/v1/cases', does: 'Anonymised Bali cases our research agent is following, with the questions a buyer must get answered.' },
    { method: 'POST', path: '/api/v1/projects/check', body: '{ "url": "https://developer-site/project" }', does: 'Desk review of a project page: what it promises, what it leaves out, what to ask before paying.' },
    { method: 'POST', path: '/api/v1/documents/read', body: '{ "type": "auto|certificate|contract|permit|company|invoice", "files": ["data:image/jpeg;base64,…" or "data:application/pdf;base64,…"], "claim": "what the seller told the buyer", "lang": "en" }', does: 'Reads a land certificate, contract, permit, company deed or invoice and compares it with the claim.' },
    { method: 'GET', path: '/api/v1/verify/{sha256}', does: 'Whether a file fingerprint has a Bitcoin timestamp (OpenTimestamps) and when.' },
    { method: 'GET', path: '/api/v1/attestations/{share_token}', does: 'The status of a buyer\'s case they chose to share with you: stage, verdict, evidence counts, chain head and dates.' }
  ] };
function cors(r) { const h = new Headers(r.headers); h.set('access-control-allow-origin', '*'); h.set('access-control-allow-headers', 'x-api-key, content-type'); h.set('access-control-allow-methods', 'GET, POST, OPTIONS'); return new Response(r.body, { status: r.status, headers: h }); }
async function apiV1(req, u, env, ctx) {
  if (req.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));
  const path = u.pathname.replace(/\/+$/, '');
  if (path === '/api/v1' || path === '/api/v1/docs') return cors(json(API_DOC));
  const key = req.headers.get('x-api-key') || u.searchParams.get('key') || '';
  if (!/^kb_pilot_[0-9a-f]{40}$/.test(key)) return cors(json({ error: 'missing_key', how: 'https://kolaboro.com/api-pilot' }, 401));
  const ep = path.replace(/\/[0-9a-f]{64}$/, '/{sha256}').replace(/\/attestations\/[0-9a-f]+$/, '/attestations/{token}');
  let a; try { a = await rpc('kolaboro_api_use', { p_key: key, p_endpoint: req.method + ' ' + ep }); } catch (e) { return cors(json({ error: 'db' }, 503)); }
  if (a.error) return cors(json(a, a.error === 'rate_limited' ? 429 : 401));
  const hdr = r => { const x = cors(r); x.headers.set('x-ratelimit-remaining', String(a.remaining)); return x; };
  try {
    if (path === '/api/v1/markets' && req.method === 'GET') { const r = await fetch('https://kolaboro.com/data/world-claims.json', { cf: { cacheTtl: 600 } }); return hdr(json({ source: 'Advertised claims on developer pages and portals, not verified facts.', data: await r.json() })); }
    if (path === '/api/v1/cases' && req.method === 'GET') { const r = await fetch('https://kolaboro.com/data/bali-cases.json', { cf: { cacheTtl: 600 } }); return hdr(json(await r.json())); }
    let m = path.match(/^\/api\/v1\/verify\/([0-9a-f]{64})$/);
    if (m && req.method === 'GET') { const d = await rpc('kolaboro_stamp_get', { p_hash: m[1] }); return hdr(json({ sha256: m[1], timestamped: !!d, stamp: d ? { created_at: d.created_at, bitcoin_block: d.bitcoin_block || null, calendars: d.calendars, ots_base64: d.ots } : null, verify_by_hand: 'https://kolaboro.com/verify' })); }
    m = path.match(/^\/api\/v1\/attestations\/([0-9a-f]{10,40})$/);
    if (m && req.method === 'GET') { const d = await rpc('kolaboro_share_get', { p_token: m[1] }); if (d.error) return hdr(json({ error: 'not_found' }, 404)); delete d.ref_code; return hdr(json({ ...d, page: 'https://kolaboro.com/r/?t=' + m[1] })); }
    if (path === '/api/v1/projects/check' && req.method === 'POST') { const r2 = new Request(req.url, { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': 'pilot-' + key.slice(9, 17) }, body: await req.text() }); PILOT.add(r2); return hdr(await analyze(r2, env, ctx)); }
    if (path === '/api/v1/documents/read' && req.method === 'POST') { const r2 = new Request(req.url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: await req.text() }); PILOT.add(r2); return hdr(await documentRead(r2, env, ctx)); }
  } catch (e) { return cors(json({ error: 'server', detail: String(e.message || e).slice(0, 120) }, 500)); }
  return cors(json({ error: 'not_found', docs: 'https://kolaboro.com/api/v1' }, 404));
}

// ---------- Open data API (no key): projects, markets, stats, CSV, feeds ----------
const OPEN_FIELDS = ['id', 'market', 'country', 'region', 'stage', 'band', 'done', 'title', 'lease', 'units', 'score', 'max', 'vscore', 'tier', 'delay'];
async function openData() {
  const r = await fetch('https://kolaboro.com/data/bali-cases.json', { cf: { cacheTtl: 600, cacheEverything: true } });
  return r.json();
}
function openProject(c) {
  const o = {}; OPEN_FIELDS.forEach(k => { o[k] = c[k] === undefined ? null : c[k]; });
  const ck = c.checks || {};
  o.checks = { permit_public: ck.permit === 2 || ck.permit === 1 ? ck.permit === 2 : false, permit_claimed: ck.permit >= 1, deposit_protection: ck.escrow, progress: ck.progress, plans: !!ck.plans, track_record: !!ck.record, no_guaranteed_returns: !!ck.returns_ok };
  o.verification = c.verified || null; o.claims = c.claims || null; o.flags = (c.flags || []).length;
  o.all_six_public = c.score === 6 && !(c.flags || []).length;
  o.url = 'https://kolaboro.com/p/?id=' + encodeURIComponent(c.id);
  return o;
}
function marketStats(cases) {
  const by = {}; cases.forEach(c => { (by[c.market] = by[c.market] || []).push(c); });
  return Object.keys(by).map(m => {
    const a = by[m], n = a.length, avg = f => a.reduce((s, c) => s + (f(c) || 0), 0) / n;
    const disc = avg(c => (c.score || 0) / 6), conf = avg(c => (c.vscore || 0) / 6), clean = avg(c => (c.flags || []).length ? 0 : 1);
    return { market: m, country: a[0].country, projects: n, avg_checks: +avg(c => c.score).toFixed(2), avg_confirmed: +avg(c => c.vscore).toFixed(2),
      permit_public_pct: Math.round(avg(c => (c.checks || {}).permit === 2 ? 1 : 0) * 100), deposit_protection_pct: Math.round(avg(c => (c.checks || {}).escrow === true ? 1 : 0) * 100),
      all_six_public: a.filter(c => c.score === 6 && !(c.flags || []).length).length, with_flags: a.filter(c => (c.flags || []).length).length,
      transparency_index: n >= 3 ? Math.round((0.6 * disc + 0.3 * conf + 0.1 * clean) * 100) : null };
  }).sort((x, y) => (y.transparency_index ?? -1) - (x.transparency_index ?? -1) || y.projects - x.projects);
}
const csvCell = v => { v = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
const OPEN_DOC = {
  name: 'Kolaboro open data API', version: '1.0', license: 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)', auth: 'none', rate: 'cached 10 minutes at the edge',
  note: 'Projects are anonymous until verification is complete and the developer has had 10 working days to reply. Scores describe what is public, not whether it is genuine.',
  endpoints: {
    'GET /api/open/stats': 'database totals (projects, markets, countries, claims tested, verification levels)',
    'GET /api/open/projects': 'projects; filters: market, country, stage (off-plan|under construction|completed), min_public (0-6), min_confirmed (0-6), all_six (1), flags (1|0), limit (max 1000), offset',
    'GET /api/open/projects.csv': 'same filters, CSV',
    'GET /api/open/projects/{id}': 'one project, e.g. /api/open/projects/BALI-014',
    'GET /api/open/markets': 'per-market statistics and the transparency index (0-100)',
    'GET /api/open/markets.csv': 'same, CSV',
    'GET /api/open/openapi.json': 'OpenAPI 3.1 description',
    'GET /feed.json, /feed.xml': 'shipping log and new data, JSON Feed and RSS', 'GET /feed.xml?market=Bali': 'changes and alerts for one market or country', 'GET /feed/alerts.xml': 'overdue, stalled and unapproved projects across all markets', 'GET /api/open/badge/{id}.svg': 'live badge for a project, for portals and listings'
  }
};
function openapiSpec() {
  const p = (summary, params) => ({ get: { summary, parameters: (params || []).map(n => ({ name: n, in: 'query', required: false, schema: { type: 'string' } })), responses: { 200: { description: 'OK' } } } });
  const f = ['market', 'country', 'stage', 'min_public', 'min_confirmed', 'all_six', 'flags', 'limit', 'offset'];
  return { openapi: '3.1.0', info: { title: OPEN_DOC.name, version: OPEN_DOC.version, license: { name: 'CC BY 4.0' }, description: OPEN_DOC.note }, servers: [{ url: 'https://kolaboro.com' }],
    paths: { '/api/open/stats': p('Database totals'), '/api/open/projects': p('List projects', f), '/api/open/projects.csv': p('Projects as CSV', f),
      '/api/open/projects/{id}': { get: { summary: 'One project', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } } } },
      '/api/open/markets': p('Markets and transparency index'), '/api/open/markets.csv': p('Markets as CSV') } };
}
function filterCases(cases, q) {
  const num = k => q.get(k) === null || q.get(k) === '' ? null : +q.get(k);
  const lc = k => (q.get(k) || '').toLowerCase();
  return cases.filter(c => (!lc('market') || c.market.toLowerCase() === lc('market')) && (!lc('country') || (c.country || '').toLowerCase() === lc('country')) &&
    (!lc('stage') || c.stage === lc('stage')) && (num('min_public') === null || (c.score || 0) >= num('min_public')) && (num('min_confirmed') === null || (c.vscore || 0) >= num('min_confirmed')) &&
    (q.get('all_six') !== '1' || (c.score === 6 && !(c.flags || []).length)) && (q.get('flags') === null || q.get('flags') === '' || ((c.flags || []).length > 0) === (q.get('flags') === '1')));
}
function openResp(body, type, maxAge) {
  const h = { 'content-type': type || 'application/json; charset=utf-8', 'cache-control': 'public, max-age=' + (maxAge || 600), 'access-control-allow-origin': '*', 'x-license': 'CC BY 4.0, credit Kolaboro' };
  return new Response(typeof body === 'string' ? body : JSON.stringify(body, null, 1), { headers: h });
}
const xesc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export async function open(req, u) {
  const path = u.pathname.replace(/\/+$/, '');
  if (req.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));
  if (path === '/api/open' || path === '/api/open/docs') return openResp(OPEN_DOC);
  if (path === '/api/open/openapi.json') return openResp(openapiSpec());
  let d; try { d = await openData(); } catch (e) { return openResp({ error: 'data_unavailable' }, null, 30); }
  const cases = d.cases || [], meta = { updated: d.updated, license: OPEN_DOC.license, note: OPEN_DOC.note };
  if (path === '/api/open/stats') return openResp({ ...meta, projects: cases.length, markets: d.markets, countries: d.countries, ...(d.db || {}) });
  if (path === '/api/open/markets') return openResp({ ...meta, method: 'transparency_index = 60% average public-disclosure score + 30% average confirmed score + 10% share without public problems; markets with 3+ projects', markets: marketStats(cases) });
  if (path === '/api/open/markets.csv') { const m = marketStats(cases), k = Object.keys(m[0] || {}); return openResp([k.join(',')].concat(m.map(r => k.map(x => csvCell(r[x])).join(','))).join('\n'), 'text/csv; charset=utf-8'); }
  if (path === '/api/open/projects' || path === '/api/open/projects.csv') {
    const all = filterCases(cases, u.searchParams), off = Math.max(0, +u.searchParams.get('offset') || 0), lim = Math.min(1000, Math.max(1, +u.searchParams.get('limit') || 1000));
    const page = all.slice(off, off + lim).map(openProject);
    if (path.endsWith('.csv')) {
      const k = OPEN_FIELDS.concat(['permit_public', 'deposit_protection', 'progress', 'plans', 'track_record', 'no_guaranteed_returns', 'claims_verified', 'claims_unverified', 'claims_contradicted', 'flags', 'all_six_public', 'url']);
      const rows = page.map(o => k.map(x => csvCell(x in o.checks ? o.checks[x] : x.startsWith('claims_') ? (o.claims || {})[x.slice(7)] : o[x])).join(','));
      return openResp([k.join(',')].concat(rows).join('\n'), 'text/csv; charset=utf-8');
    }
    return openResp({ ...meta, total: all.length, offset: off, limit: lim, projects: page });
  }
  const m = path.match(/^\/api\/open\/projects\/([A-Za-z0-9-]{3,20})$/);
  if (m) { const c = cases.find(x => x.id.toLowerCase() === m[1].toLowerCase()); return c ? openResp({ ...meta, project: openProject(c), questions: c.q || [], flags: c.flags || [], notes: c.notes || [] }) : new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } }); }
  if (path === '/feed/alerts.xml' || ((path === '/feed.xml' || path === '/feed.json') && u.searchParams.get('market'))) {
    const mk = (u.searchParams.get('market') || '').toLowerCase();
    const pool = cases.filter(c => !mk || c.market.toLowerCase() === mk || (c.country || '').toLowerCase() === mk);
    const items = [];
    pool.forEach(c => {
      (c.history || []).forEach((h, i) => items.push({ id: c.id + '-h' + h.d + '-' + i, date: h.d, title: c.id + ' (' + c.market + '): ' + h.f + ' changed from ' + (h.from === null ? 'not stated' : h.from) + ' to ' + (h.to === null ? 'not stated' : h.to), url: 'https://kolaboro.com/p/?id=' + c.id }));
      if (c.overdue >= 6) items.push({ id: c.id + '-od-' + c.overdue, date: d.updated, title: c.id + ' (' + c.market + '): ' + c.overdue + ' months past the promised handover', url: 'https://kolaboro.com/p/?id=' + c.id });
      if (c.sat && c.sat.status === 'no visible change' && c.stage === 'under construction') items.push({ id: c.id + '-sat-' + c.sat.date, date: c.sat.date, title: c.id + ' (' + c.market + '): sold as under construction, almost no change visible from space in a year', url: 'https://kolaboro.com/p/?id=' + c.id });
      if (c.register && c.register.status !== 'approved') items.push({ id: c.id + '-reg-' + c.register.checked, date: c.register.checked, title: c.id + ' (' + c.market + '): ' + c.register.register + ', ' + c.register.item + ': ' + c.register.status, url: 'https://kolaboro.com/p/?id=' + c.id });
    });
    const alertsOnly = path === '/feed/alerts.xml';
    const list = items.filter(x => !alertsOnly || /past the promised|from space|not approved|not in the approved/.test(x.title)).sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 100);
    const title = alertsOnly ? 'Kolaboro alerts: overdue, stalled and unapproved projects' : 'Kolaboro: ' + (pool.length && new Set(pool.map(c => c.market)).size > 1 ? pool[0].country : (pool[0] ? pool[0].market : mk)) + ' changes';
    if (path.endsWith('.json')) return openResp({ version: 'https://jsonfeed.org/version/1.1', title, home_page_url: 'https://kolaboro.com/database', items: list.map(x => ({ id: x.id, url: x.url, title: x.title, content_text: x.title, date_published: x.date + 'T12:00:00Z' })) }, 'application/feed+json; charset=utf-8');
    return openResp('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>' + xesc(title) + '</title><link>https://kolaboro.com/database</link><description>Changes on developer pages and alerts from the Kolaboro database. Projects are anonymous.</description>' +
      list.map(x => '<item><title>' + xesc(x.title) + '</title><link>' + x.url + '</link><guid isPermaLink="false">' + xesc(x.id) + '</guid><pubDate>' + new Date((x.date || d.updated) + 'T12:00:00Z').toUTCString() + '</pubDate></item>').join('') + '</channel></rss>', 'application/rss+xml; charset=utf-8');
  }
  const bm = path.match(/^\/api\/open\/badge\/([A-Za-z0-9-]{3,20})\.svg$/);
  if (bm) {
    const c = cases.find(x => x.id.toLowerCase() === bm[1].toLowerCase());
    const L = c ? (c.score + '/6 public · ' + (c.vscore || 0) + '/6 confirmed') : 'not tracked';
    const col = !c ? '#59626B' : (c.flags || []).length ? '#B83A05' : c.score >= 5 && (c.vscore || 0) >= 3 ? '#0B7A55' : c.score >= 3 ? '#9A6B00' : '#B83A05';
    const w1 = 66, w2 = 8 + L.length * 6.4, W = Math.round(w1 + w2);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="22" role="img" aria-label="Kolaboro: ' + xesc(L) + '"><title>Kolaboro: ' + xesc(L) + (c ? ' (checked ' + xesc(c.checked || d.updated) + ')' : '') + '</title><rect width="' + W + '" height="22" rx="4" fill="#17212B"/><rect x="' + w1 + '" width="' + (W - w1) + '" height="22" rx="4" fill="' + col + '"/><rect x="' + w1 + '" width="6" height="22" fill="' + col + '"/>' +
      '<g fill="#fff" font-family="Verdana,DejaVu Sans,sans-serif" font-size="11"><circle cx="10" cy="11" r="3.5" fill="#FF5B14"/><text x="18" y="15">kolaboro</text><text x="' + (w1 + 6) + '" y="15">' + xesc(L) + '</text></g></svg>';
    return new Response(svg, { headers: { 'content-type': 'image/svg+xml; charset=utf-8', 'cache-control': 'public, max-age=3600', 'access-control-allow-origin': '*' } });
  }
  if (path === '/feed.json' || path === '/feed.xml') {
    const items = (d.ships || []).map((s, i) => ({ id: 'kolaboro-' + s.d + '-' + i, date: s.d + 'T12:00:00Z', title: s.t, tag: s.k }));
    if (path === '/feed.json') return openResp({ version: 'https://jsonfeed.org/version/1.1', title: 'Kolaboro: what we shipped', home_page_url: 'https://kolaboro.com/changelog', feed_url: 'https://kolaboro.com/feed.json', items: items.map(x => ({ id: x.id, url: 'https://kolaboro.com/changelog', title: x.title, content_text: x.title, date_published: x.date, tags: [x.tag] })) }, 'application/feed+json; charset=utf-8');
    const rss = '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>Kolaboro: what we shipped</title><link>https://kolaboro.com/changelog</link><description>New data and features, every day.</description>' +
      items.map(x => '<item><title>' + xesc(x.title) + '</title><link>https://kolaboro.com/changelog</link><guid isPermaLink="false">' + x.id + '</guid><pubDate>' + new Date(x.date).toUTCString() + '</pubDate><category>' + x.tag + '</category></item>').join('') + '</channel></rss>';
    return openResp(rss, 'application/rss+xml; charset=utf-8');
  }
  return new Response(JSON.stringify({ error: 'not_found', docs: 'https://kolaboro.com/api/open' }), { status: 404, headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' } });
}

// ---------- Telegram bot: send a project link, get the desk review back ----------
// Switched on when the Cloudflare secrets TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET exist.
// Register once: https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://kolaboro.com/api/kb/telegram&secret_token=<SECRET>
async function tgSend(env, chat, text) {
  return fetch('https://api.telegram.org/bot' + env.TELEGRAM_BOT_TOKEN + '/sendMessage', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text: text.slice(0, 4000), parse_mode: 'HTML', disable_web_page_preview: true }) });
}
const tgEsc = t => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
async function telegram(req, env, ctx) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_WEBHOOK_SECRET) return json({ error: 'not_configured' }, 503);
  if (req.headers.get('x-telegram-bot-api-secret-token') !== env.TELEGRAM_WEBHOOK_SECRET) return json({ error: 'forbidden' }, 403);
  let up; try { up = await req.json(); } catch (e) { return json({ ok: true }); }
  const msg = up.message || up.edited_message; if (!msg || !msg.chat) return json({ ok: true });
  const chat = msg.chat.id, text = String(msg.text || '');
  const link = (text.match(/https?:\/\/[^\s<>"]+/) || [])[0];
  ctx.waitUntil((async () => {
    if (!link) return tgSend(env, chat, 'Send me the link to an off-plan project page and I will tell you what it promises, what it leaves out and what to ask before you pay. Free, about a minute.\n\nFull database: https://kolaboro.com/database');
    await tgSend(env, chat, 'Reading the page… about a minute.');
    const fake = new Request('https://kolaboro.com/api/kb/analyze', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': 'tg-' + chat }, body: JSON.stringify({ url: link }) });
    let d; try { d = await (await analyze(fake, env, ctx)).json(); } catch (e) { d = { error: 'fetch' }; }
    if (d.error) return tgSend(env, chat, d.error === 'rate' ? 'Too many checks right now. Try again in a few minutes.' : 'I could not read that page. Try the project or developer page itself, or use https://kolaboro.com/check');
    const r = d.report || {}, L = [];
    L.push('<b>' + tgEsc(r.project || d.host) + '</b>' + (r.location ? ' · ' + tgEsc(r.location) : ''));
    L.push('Attention needed: <b>' + tgEsc(r.attention || 'unknown') + '</b>');
    if (r.summary) L.push(tgEsc(r.summary));
    if ((r.missing || []).length) L.push('\n<b>Not stated on the page</b>\n' + r.missing.map(x => '✗ ' + tgEsc(x)).join('\n'));
    if (r.guaranteed_language) L.push('\n⚠ Uses "guaranteed" return language.');
    if ((r.questions || []).length) L.push('\n<b>Ask before you pay</b>\n' + r.questions.slice(0, 5).map((x, i) => (i + 1) + '. ' + tgEsc(x)).join('\n'));
    L.push('\nFull review: https://kolaboro.com/check?url=' + encodeURIComponent(link) + '&src=tg\nAgent on site from €490: https://kolaboro.com/pricing');
    return tgSend(env, chat, L.join('\n'));
  })().catch(() => {}));
  return json({ ok: true });
}

// ---------- Ask the database: plain-language questions answered only from the published data ----------
const ASK_PROMPT = `You answer questions about the Kolaboro database of off-plan property projects. Use ONLY the data below. Projects are anonymous (ids like BALI-014); never guess names, developers or facts that are not in the data. If the data cannot answer, say what it can tell instead.
Definitions: six public checks per project (permit number public, deposit protection, construction progress, plans, developer track record, no guaranteed returns); score = how many are public (0-6); confirmed (vscore) = how many are confirmed by an official registry or independent source; claims = developer claims tested (verified, unverified, contradicted); overdue = months past the promised handover; transparency index = 60% avg score/6 + 30% avg confirmed/6 + 10% share without public problems.
A high score means documents are public, not that they are genuine. Not financial or legal advice.
Reply with ONLY one JSON object: {"answer": "2 to 5 plain sentences with the key numbers", "numbers": [{"label": "short", "value": "short"}] (0 to 4), "projects": ["ids worth opening, max 6"], "follow_up": ["up to 2 short follow-up questions"]}`;
export async function ask(req, env, ctx) {
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'not_configured' }, 503);
  let b; try { b = await req.json(); } catch (e) { return json({ error: 'bad_request' }, 400); }
  const q = String(b.q || '').replace(/\s+/g, ' ').trim().slice(0, 300);
  if (q.length < 4) return json({ error: 'question' }, 400);
  const ck = new Request('https://kolaboro.com/__kb_ask/' + encodeURIComponent(q.toLowerCase()));
  const hit = await caches.default.match(ck); if (hit) return json({ ...(await hit.json()), cached: true });
  if (await rateLimited(req, ctx)) return json({ error: 'rate' }, 429);
  let d; try { d = await openData(); } catch (e) { return json({ error: 'data' }, 503); }
  const cases = d.cases || [], ql = q.toLowerCase();
  const ms = marketStats(cases).map(m => [m.market, m.country, m.projects, m.avg_checks, m.avg_confirmed, m.permit_public_pct, m.deposit_protection_pct, m.all_six_public, m.with_flags, m.transparency_index].join('|'));
  const named = [...new Set(cases.map(c => c.market).concat(cases.map(c => c.country)))].filter(x => x && ql.includes(x.toLowerCase()));
  const pick = (named.length ? cases.filter(c => named.includes(c.market) || named.includes(c.country)) : []).slice(0, 80);
  const row = c => [c.id, c.market, c.stage || '', c.band || '', c.done || '', c.title || '', c.score, c.vscore ?? '', (c.checks || {}).permit === 2 ? 'permit' : '', (c.checks || {}).escrow === true ? 'escrow' : '', c.overdue || '', c.delay || '', (c.claims || {}).contradicted || 0, (c.flags || []).length].join('|');
  const db = d.db || {};
  const ctxt = 'DATA updated ' + d.updated + '\nTOTALS: ' + JSON.stringify({ projects: cases.length, markets: d.markets, countries: d.countries, claims: db.claims, claims_total: db.claims_total, checks_by_level: db.checks_by_level, stages: db.stages, all_six_public: db.all_six_public, with_flags: db.with_flags, overdue: db.overdue, overdue_avg_months: db.overdue_avg_months, delayed: db.delayed }) +
    '\nMARKETS (market|country|projects|avg_checks|avg_confirmed|permit_public_pct|deposit_protection_pct|all_six_public|with_flags|transparency_index):\n' + ms.join('\n') +
    (pick.length ? '\nPROJECTS IN NAMED MARKETS (id|market|stage|band|completion|title|score|confirmed|permit|escrow|overdue_months|delay_months|contradicted_claims|flags):\n' + pick.map(row).join('\n') : '');
  let out; try { out = await claude(env, ASK_PROMPT + '\n\n' + ctxt + '\n\nQUESTION: ' + q); } catch (e) { return json({ error: 'model' }, 503); }
  const ids = new Set(cases.map(c => c.id));
  const res = { q, updated: d.updated, answer: String(out.answer || ''), numbers: (out.numbers || []).slice(0, 4), projects: (out.projects || []).filter(x => ids.has(x)).slice(0, 6), follow_up: (out.follow_up || []).slice(0, 2) };
  ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify(res), { headers: { 'content-type': 'application/json', 'cache-control': 'max-age=86400' } })));
  return json(res);
}

// ---------- Server-rendered project and market pages for search engines and AI crawlers ----------
const LVL = { registry: 'confirmed in an official register', independent: 'confirmed by an independent source', developer: 'stated only by the developer', contradicted: 'contradicted by another source', none: 'not published' };
const CKN = { permit: 'Permit or licence number', escrow: 'Deposit protection', progress: 'Construction progress', plans: 'Floor or site plans', record: 'Developer track record', returns_ok: 'No guaranteed returns' };
const hesc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const slugM = m => encodeURIComponent(m.toLowerCase().replace(/\s+/g, '-'));
export async function dataSitemap() {
  let d; try { d = await openData(); } catch (e) { return new Response('', { status: 503 }); }
  const cs = d.cases || [], mk = [...new Set(cs.map(c => c.market))];
  const urls = cs.map(c => '<url><loc>https://kolaboro.com/p/' + encodeURIComponent(c.id) + '/</loc><lastmod>' + d.updated + '</lastmod></url>').concat(mk.map(m => '<url><loc>https://kolaboro.com/m/' + slugM(m) + '/</loc><lastmod>' + d.updated + '</lastmod></url>'));
  return new Response('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.join('') + '</urlset>', { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
export async function ssr(base, u, kind) {
  let d; try { d = await openData(); } catch (e) { return base; }
  const cs = d.cases || [], key = decodeURIComponent(u.pathname.split('/')[2] || '');
  let title, desc, canon, body, ld;
  if (kind === 'p') {
    const c = cs.find(x => x.id.toLowerCase() === key.toLowerCase());
    if (!c) return new Response(base.body, { status: 404, headers: base.headers });
    const place = c.region && c.region !== c.market ? c.region + ', ' + c.market : c.market;
    const ck = c.checks || {}, v = c.verified || {}, cl = c.claims || {};
    title = c.id + ': off-plan project in ' + place + ', ' + c.country + ' | Kolaboro';
    desc = 'Anonymous off-plan project in ' + place + ' (' + (c.stage || 'off-plan') + '). ' + c.score + ' of 6 buyer checks public, ' + (c.vscore || 0) + ' confirmed by a register or independent source' + (cl.contradicted ? ', ' + cl.contradicted + ' developer claims contradicted' : '') + '. Checked ' + (c.checked || d.updated) + '.';
    canon = 'https://kolaboro.com/p/' + encodeURIComponent(c.id) + '/';
    const rows = Object.keys(CKN).map(k => { const val = ck[k]; const pub = k === 'permit' ? val === 2 : k === 'progress' ? val != null : val === true; return '<li>' + CKN[k] + ': ' + (pub ? 'public' : 'not public') + (v[k] ? ', ' + LVL[v[k]] : '') + '</li>'; }).join('');
    body = '<h1>' + hesc(c.id) + ': off-plan project in ' + hesc(place) + ', ' + hesc(c.country) + '</h1><p>' + hesc(desc) + '</p><ul>' + rows + '</ul>' +
      (cl.verified + cl.unverified + cl.contradicted ? '<p>Developer claims tested: ' + cl.verified + ' verified, ' + cl.unverified + ' unverified, ' + cl.contradicted + ' contradicted.</p>' : '') +
      (c.overdue ? '<p>' + c.overdue + ' months past the promised handover.</p>' : '') + ((c.flags || []).length ? '<p>Problems in public reports: ' + c.flags.map(hesc).join('; ') + '</p>' : '') +
      ((c.q || []).length ? '<h2>What to ask the developer</h2><ul>' + c.q.map(x => '<li>' + hesc(x) + '</li>').join('') + '</ul>' : '') +
      '<p><a href="/m/' + slugM(c.market) + '/">More projects in ' + hesc(c.market) + '</a> · <a href="/database">The database</a> · <a href="/how-we-score">How we score</a></p>';
    ld = { '@context': 'https://schema.org', '@type': 'WebPage', name: title.replace(' | Kolaboro', ''), description: desc, url: canon, dateModified: d.updated, isPartOf: { '@type': 'Dataset', name: 'Kolaboro off-plan property database', url: 'https://kolaboro.com/database', license: 'https://creativecommons.org/licenses/by/4.0/' }, about: { '@type': 'Place', name: place + ', ' + c.country } };
  } else {
    const L = cs.filter(x => slugM(x.market) === encodeURIComponent(key.toLowerCase().replace(/\s+/g, '-')) || x.market.toLowerCase() === key.toLowerCase());
    if (!L.length) return new Response(base.body, { status: 404, headers: base.headers });
    const m = L[0].market, n = L.length, avg = f => (L.reduce((a, x) => a + (f(x) || 0), 0) / n);
    const pct = f => Math.round(L.filter(f).length / n * 100);
    title = 'Off-plan projects in ' + m + ', ' + L[0].country + ': what developers publish | Kolaboro';
    desc = n + ' off-plan projects tracked in ' + m + '. On average ' + avg(x => x.score).toFixed(1) + ' of 6 buyer checks public; ' + pct(x => (x.checks || {}).permit === 2) + '% publish a permit number and ' + pct(x => (x.checks || {}).escrow === true) + '% deposit protection. Updated ' + d.updated + '.';
    canon = 'https://kolaboro.com/m/' + slugM(m) + '/';
    body = '<h1>Off-plan projects in ' + hesc(m) + ', ' + hesc(L[0].country) + '</h1><p>' + hesc(desc) + '</p><ul>' + L.slice(0, 200).map(x => '<li><a href="/p/' + encodeURIComponent(x.id) + '/">' + hesc(x.id) + '</a>: ' + hesc(x.stage || 'off-plan') + ', ' + x.score + '/6 public, ' + (x.vscore || 0) + '/6 confirmed</li>').join('') + '</ul>';
    ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: title.replace(' | Kolaboro', ''), description: desc, url: canon, dateModified: d.updated };
  }
  const tags = '<title>' + hesc(title) + '</title><meta name="description" content="' + hesc(desc) + '"><link rel="canonical" href="' + canon + '"><meta property="og:title" content="' + hesc(title) + '"><meta property="og:description" content="' + hesc(desc) + '"><meta property="og:url" content="' + canon + '"><script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>';
  let seenTitle = false;
  const res = new HTMLRewriter()
    .on('title', { element(e) { e.remove(); } })
    .on('meta[name="description"]', { element(e) { e.remove(); } })
    .on('link[rel="canonical"]', { element(e) { e.remove(); } })
    .on('meta[property="og:title"],meta[property="og:description"],meta[property="og:url"]', { element(e) { e.remove(); } })
    .on('meta[name="robots"]', { element(e) { e.remove(); } })
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .on('main', { element(e) { e.prepend('<section class="sec ssr-only" id="ssr"><div class="wrap">' + body + '</div></section>', { html: true }); } })
    .transform(base);
  const h = new Headers(res.headers); h.set('cache-control', 'public, max-age=600');
  return new Response(res.body, { status: 200, headers: h });
}
