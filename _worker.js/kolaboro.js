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
