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
    if (d.error !== 'rate' && d.error !== 'bad_request') ctx.waitUntil(rpc('kolaboro_api_log', { p_kind: k, p_ok: r.ok, p_cached: !!(d.cached || d.existing), p_ms: ms }).catch(() => {}));
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

async function claudeVision(env, content) {
  let last = '';
  for (const model of ['claude-sonnet-5-5', 'claude-haiku-5-5']) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model, max_tokens: 2500, messages: [{ role: 'user', content }] })
    });
    if (r.status === 404 || (r.status === 400 && !last)) { last = model + ' ' + r.status + ' ' + (await r.text()).slice(0, 200); continue; }
    if (!r.ok) throw new Error('model ' + r.status + ' ' + (await r.text()).slice(0, 160));
    const d = await r.json();
    const t = (d.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    const m = t.match(/\{[\s\S]*\}/); if (!m) throw new Error('no json');
    return JSON.parse(m[0]);
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
    const d = await rpc('kolaboro_stamp_put', { p_hash: h, p_ots: ots, p_calendars: ok.map(x => x.c), p_source: String(b.source || 'web').slice(0, 40) });
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
  const claim = String(b.claim || '').slice(0, 2000);
  const key = await sha(m[3].slice(0, 200000) + '|' + claim);
  const ck = new Request('https://kolaboro.com/__kb_cert/' + key);
  const hit = await caches.default.match(ck); if (hit) { const d = await hit.json(); return json({ ...d, cached: true }); }
  if (await rateLimited(req, ctx)) return json({ error: 'rate' }, 429);
  let out;
  try { out = await claudeVision(env, [{ type: 'image', source: { type: 'base64', media_type: m[1], data: m[3] } }, { type: 'text', text: CERT_PROMPT + '\n\nWhat the developer or brochure claims about this land: ' + (claim || 'not given') }]); }
  catch (e) { return json({ error: 'model', detail: String(e.message || e).replace(/sk-[\w-]+/g, '') }, 503); }
  const res = { analysed: new Date().toISOString(), certificate: out };
  ctx.waitUntil(caches.default.put(ck, new Response(JSON.stringify(res), { headers: { 'content-type': 'application/json', 'cache-control': 'max-age=604800' } })));
  return json({ ...res, cached: false });
}
