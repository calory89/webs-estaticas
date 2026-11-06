// Feature module 'acct' for kolaboro.com (see kbx.js). Batch 10 (6 Nov 2026, b10b): accounts and trust.
//   Passkeys (WebAuthn) for buyers, next to the password. The worker checks every WebAuthn signature; the database function
//   kolaboro_passkey (worker key only) keeps credentials and single-use challenges (5 minutes) and issues the normal session.
//     POST /api/x/acct/pk/reg/options   {token}                     challenge to create a passkey for the signed-in buyer
//     POST /api/x/acct/pk/reg           {token, chal, id, client_data_json, authenticator_data, spki, alg, label}
//     POST /api/x/acct/pk/login/options {}                          challenge to sign in (discoverable passkey, no email needed)
//     POST /api/x/acct/pk/login         {chal, id, client_data_json, authenticator_data, signature}  -> {token, role}
//     POST /api/x/acct/pk/list | /pk/delete {token, id?}
//   W3C Verifiable Credentials (VC Data Model 2.0, Data Integrity proof, cryptosuite eddsa-jcs-2022), issuer did:web:kolaboro.com,
//   signed with the same Ed25519 key as the open API (Cloudflare secret KB_SIGN_KEY; public key in /.well-known/did.json).
//     GET  /api/x/acct/vc/lookup/{root}   a sealed register lookup as a signed VC (while the sealed result is in the edge cache)
//     POST /api/x/acct/vc/report {token, case_id}   a delivered report of the signed-in buyer's own case as a signed VC
//     POST /api/x/acct/vc/verify {vc}     the same check the browser runs on /verify, done here
//     GET  /.well-known/did.json          the DID document (routed from index.js)
// Admin two-factor needs no worker route: /admin talks to the database function kolaboro_admin_2fa directly (see /k/acct.js).
import { rpc, sha, verifyAssertion, PUB_RAW_B64, WKEY } from './kolaboro.js';
import { handle as lookupHandle } from './kbx_lookup.js';

export const PATHS = /^\/api\/x\/acct\//;
const ORIGIN = 'https://kolaboro.com', RP = 'kolaboro.com', DID = 'did:web:kolaboro.com';
const te = new TextEncoder(), td = new TextDecoder();
const HDR = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const out = (o, s, extra) => new Response(JSON.stringify(o, null, 1), { status: s || 200, headers: Object.assign({}, HDR, extra || {}) });
const pub = (o, age) => out(o, 200, { 'cache-control': 'public, max-age=' + (age || 300), 'access-control-allow-origin': '*' });

// ---------- encodings
const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(s); };
const b64u = u8 => b64(u8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = x => { x = String(x || '').replace(/-/g, '+').replace(/_/g, '/'); while (x.length % 4) x += '='; return Uint8Array.from(atob(x), c => c.charCodeAt(0)); };
const hex = u8 => [...u8].map(x => x.toString(16).padStart(2, '0')).join('');
const h256 = async b => new Uint8Array(await crypto.subtle.digest('SHA-256', typeof b === 'string' ? te.encode(b) : b));
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function b58(u8) {
  const d = []; for (const byte of u8) { let c = byte; for (let j = 0; j < d.length; j++) { c += d[j] << 8; d[j] = c % 58; c = (c / 58) | 0; } while (c) { d.push(c % 58); c = (c / 58) | 0; } }
  let s = ''; for (const byte of u8) { if (byte) break; s += '1'; } for (let i = d.length - 1; i >= 0; i--) s += B58[d[i]];
  return s;
}
function unb58(s) {
  const b = []; for (const ch of s) { let c = B58.indexOf(ch); if (c < 0) throw new Error('base58'); for (let j = 0; j < b.length; j++) { c += b[j] * 58; b[j] = c & 255; c >>= 8; } while (c) { b.push(c & 255); c >>= 8; } }
  let z = 0; while (z < s.length && s[z] === '1') z++;
  return new Uint8Array([...new Array(z).fill(0), ...b.reverse()]);
}
// RFC 8785 JSON Canonicalization Scheme (ES number and string serialization, keys sorted by UTF-16 code units)
export function jcs(v) {
  if (v === null || typeof v !== 'object') { if (typeof v === 'number' && !isFinite(v)) throw new Error('jcs: non-finite number'); return JSON.stringify(v); }
  if (Array.isArray(v)) return '[' + v.map(x => jcs(x === undefined ? null : x)).join(',') + ']';
  return '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + jcs(v[k])).join(',') + '}';
}

// ---------- signing key (same secret as the open API signatures)
let SK = null;
async function signKey(env) {
  if (SK || !env || !env.KB_SIGN_KEY) return SK;
  const der = Uint8Array.from(atob(env.KB_SIGN_KEY), c => c.charCodeAt(0));
  for (const alg of [{ name: 'Ed25519' }, { name: 'NODE-ED25519', namedCurve: 'NODE-ED25519' }]) { try { SK = await crypto.subtle.importKey('pkcs8', der, alg, false, ['sign']); SK._alg = alg; break; } catch (e) {} }
  return SK;
}
const kidOf = env => (env && env.KB_SIGN_KID) || 'key-1';
const vmOf = env => DID + '#' + kidOf(env);
const multikey = () => 'z' + b58(new Uint8Array([0xed, 0x01, ...Uint8Array.from(atob(PUB_RAW_B64), c => c.charCodeAt(0))]));

export function didDoc(env) {
  const vm = vmOf(env);
  return { '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/multikey/v1'], id: DID,
    verificationMethod: [{ id: vm, type: 'Multikey', controller: DID, publicKeyMultibase: multikey() }],
    assertionMethod: [vm],
    service: [{ id: DID + '#verify', type: 'LinkedDomains', serviceEndpoint: ORIGIN + '/verify/#vc' }] };
}
export function did(env) {
  return new Response(JSON.stringify(didDoc(env), null, 1), { headers: { 'content-type': 'application/did+json; charset=utf-8', 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=3600', 'x-content-type-options': 'nosniff' } });
}

// eddsa-jcs-2022: hashData = SHA-256(JCS(proof config)) || SHA-256(JCS(document without proof)); proofValue = 'z' + base58btc(Ed25519 signature)
export async function issue(env, doc, created) {
  const k = await signKey(env); if (!k) return null;
  const proof = { type: 'DataIntegrityProof', cryptosuite: 'eddsa-jcs-2022', created: created || new Date().toISOString().replace(/\.\d+Z$/, 'Z'), verificationMethod: vmOf(env), proofPurpose: 'assertionMethod', '@context': doc['@context'] };
  const data = new Uint8Array([...(await h256(jcs(proof))), ...(await h256(jcs(doc)))]);
  const sig = new Uint8Array(await crypto.subtle.sign(k._alg || { name: 'Ed25519' }, k, data));
  return Object.assign({}, doc, { proof: Object.assign(proof, { proofValue: 'z' + b58(sig) }) });
}
export async function verifyVc(vc, env) {
  const steps = [];
  try {
    if (!vc || typeof vc !== 'object' || !vc.proof) return { valid: false, reason: 'no proof', steps };
    const p = vc.proof;
    if (p.type !== 'DataIntegrityProof' || p.cryptosuite !== 'eddsa-jcs-2022') return { valid: false, reason: 'unsupported proof ' + p.type + '/' + p.cryptosuite, steps };
    const iss = typeof vc.issuer === 'string' ? vc.issuer : vc.issuer && vc.issuer.id;
    if (!String(p.verificationMethod || '').startsWith(iss + '#')) return { valid: false, reason: 'verification method is not the issuer\'s', steps };
    if (iss !== DID) return { valid: false, reason: 'this endpoint only resolves ' + DID + '; use /verify for other issuers', steps };
    const vm = didDoc(env).verificationMethod.find(m => m.id === p.verificationMethod);
    if (!vm || !(didDoc(env).assertionMethod || []).includes(vm.id)) return { valid: false, reason: 'unknown or non-assertion key ' + p.verificationMethod, steps };
    steps.push('issuer ' + iss + ' resolved, key ' + vm.id);
    const mk = unb58(vm.publicKeyMultibase.slice(1)); if (mk[0] !== 0xed || mk[1] !== 0x01) return { valid: false, reason: 'not an Ed25519 multikey', steps };
    const doc = Object.assign({}, vc); delete doc.proof;
    const cfg = Object.assign({}, p); delete cfg.proofValue;
    if (jcs(cfg['@context']) !== jcs(doc['@context'])) return { valid: false, reason: 'proof @context differs from the credential @context', steps };
    const data = new Uint8Array([...(await h256(jcs(cfg))), ...(await h256(jcs(doc)))]);
    const sig = unb58(String(p.proofValue || '').replace(/^z/, ''));
    let ok = false;
    for (const alg of [{ name: 'Ed25519' }, { name: 'NODE-ED25519', namedCurve: 'NODE-ED25519' }]) {
      try { const key = await crypto.subtle.importKey('raw', mk.slice(2), alg, false, ['verify']); ok = await crypto.subtle.verify(alg, key, sig, data); break; } catch (e) {}
    }
    steps.push('Ed25519 signature over SHA-256(JCS(proof config)) || SHA-256(JCS(credential)): ' + (ok ? 'valid' : 'INVALID'));
    return { valid: ok, reason: ok ? null : 'signature does not verify', steps, issuer: iss, type: vc.type, validFrom: vc.validFrom || null };
  } catch (e) { return { valid: false, reason: 'malformed: ' + String(e && e.message || e).slice(0, 80), steps }; }
}

// ---------- rate limit (edge cache counter per connection and hour)
async function limited(req, ctx, kind, max) {
  const ip0 = req.headers.get('cf-connecting-ip') || 'x', ip = ip0.includes(':') ? ip0.split(':').slice(0, 4).join(':') : ip0;
  const k = new Request('https://kolaboro.com/__acct_rl/' + kind + '/' + encodeURIComponent(ip) + '/' + new Date().toISOString().slice(0, 13));
  const h = await caches.default.match(k), n = h ? (+(await h.text()) || 0) : 0;
  if (n >= max) return true;
  ctx.waitUntil(caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': 'max-age=3600' } })).catch(() => {}));
  return false;
}
async function body(req) { try { const b = await req.json(); return b && typeof b === 'object' ? b : {}; } catch (e) { return {}; } }
const tokOk = t => typeof t === 'string' && /^[0-9a-f]{48}$/.test(t);
async function challenge(purpose, chal) { return b64u(await h256('kolaboro-passkey-v1\n' + purpose + '\n' + chal)); }
const PK_MSG = { auth: 'Please sign in again first.', challenge: 'That passkey request expired. Try again.', key: 'Your browser sent a key we cannot use.', limit: 'You already have 10 passkeys. Remove one first.', exists: 'This passkey is already registered.', unknown: 'This passkey is not registered with Kolaboro. Sign in with your password, then add a passkey in your portal.', counter: 'This passkey looks cloned (its counter went backwards), so we refused it. Sign in with your password.', busy: 'Too many sign-in attempts right now. Try again in a minute.', denied: 'Passkeys are not available right now.' };
const fail = (e, s) => out({ error: e, message: PK_MSG[e] || 'Something went wrong. Try again.' }, s || 400);

async function regOptions(req, ctx) {
  const b = await body(req); if (!tokOk(b.token)) return fail('auth', 401);
  if (await limited(req, ctx, 'pkreg', 30)) return fail('busy', 429);
  let d; try { d = await rpc('kolaboro_passkey', { p_wkey: WKEY, p_action: 'chal', p_token: b.token, p_payload: { purpose: 'reg' } }); } catch (e) { return fail('denied', 503); }
  if (!d || d.error) return fail((d && d.error) || 'denied', d && d.error === 'auth' ? 401 : 400);
  return out({ chal: d.chal, publicKey: { challenge: await challenge('reg', d.chal), rp: { id: RP, name: 'Kolaboro' },
    user: { id: b64u(te.encode(d.user.id)), name: d.user.email, displayName: d.user.name || d.user.email },
    pubKeyCredParams: [{ type: 'public-key', alg: -8 }, { type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
    authenticatorSelection: { residentKey: 'required', requireResidentKey: true, userVerification: 'required' }, attestation: 'none', timeout: 120000,
    excludeCredentials: (d.exclude || []).map(id => ({ type: 'public-key', id })) } });
}
async function reg(req, ctx) {
  const b = await body(req); if (!tokOk(b.token)) return fail('auth', 401);
  if (await limited(req, ctx, 'pkreg', 30)) return fail('busy', 429);
  try {
    const cj = unb64u(b.client_data_json), ad = unb64u(b.authenticator_data), cd = JSON.parse(td.decode(cj));
    if (cd.type !== 'webauthn.create') return out({ error: 'ceremony', message: 'Wrong WebAuthn ceremony.' }, 400);
    if (cd.origin !== ORIGIN) return out({ error: 'origin', message: 'Passkeys can only be added on kolaboro.com.' }, 400);
    if (!/^[0-9a-f]{64}$/.test(String(b.chal || '')) || cd.challenge !== await challenge('reg', b.chal)) return fail('challenge');
    if (hex(ad.slice(0, 32)) !== hex(await h256(RP))) return out({ error: 'rp', message: 'Wrong relying party.' }, 400);
    const flags = ad[32]; if (!(flags & 1) || !(flags & 4) || !(flags & 0x40)) return out({ error: 'uv', message: 'The passkey must check it is you (fingerprint, face or PIN).' }, 400);
    const signCount = (ad[33] << 24 | ad[34] << 16 | ad[35] << 8 | ad[36]) >>> 0;
    const idLen = ad[53] << 8 | ad[54], credId = ad.slice(55, 55 + idLen);
    if (!idLen || b64u(credId) !== String(b.id || '')) return out({ error: 'id', message: 'The credential id does not match.' }, 400);
    const alg = +b.alg, spki = Uint8Array.from(atob(String(b.spki || '')), c => c.charCodeAt(0));
    const imp = alg === -7 ? { name: 'ECDSA', namedCurve: 'P-256' } : alg === -8 ? { name: 'Ed25519' } : alg === -257 ? { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' } : null;
    if (!imp) return fail('key');
    try { await crypto.subtle.importKey('spki', spki, imp, false, ['verify']); } catch (e) { return fail('key'); }
    const d = await rpc('kolaboro_passkey', { p_wkey: WKEY, p_action: 'register', p_token: b.token, p_payload: { chal: b.chal, cred_id: b.id, spki: b64(spki), alg: String(alg), label: String(b.label || '').slice(0, 60), sign_count: signCount } });
    if (!d || d.error) return fail((d && d.error) || 'denied');
    return out({ ok: true });
  } catch (e) { return out({ error: 'malformed', message: 'Your browser sent an answer we could not read.' }, 400); }
}
async function loginOptions(req, ctx) {
  if (await limited(req, ctx, 'pklogin', 60)) return fail('busy', 429);
  let d; try { d = await rpc('kolaboro_passkey', { p_wkey: WKEY, p_action: 'chal', p_token: null, p_payload: { purpose: 'login' } }); } catch (e) { return fail('denied', 503); }
  if (!d || d.error) return fail((d && d.error) || 'denied');
  return out({ chal: d.chal, publicKey: { challenge: await challenge('login', d.chal), rpId: RP, userVerification: 'required', timeout: 120000, allowCredentials: [] } });
}
async function login(req, ctx) {
  const b = await body(req);
  if (await limited(req, ctx, 'pklogin', 60)) return fail('busy', 429);
  if (!/^[0-9a-f]{64}$/.test(String(b.chal || '')) || !/^[A-Za-z0-9_-]{16,400}$/.test(String(b.id || ''))) return out({ error: 'malformed', message: 'Your browser sent an answer we could not read.' }, 400);
  let c; try { c = await rpc('kolaboro_passkey', { p_wkey: WKEY, p_action: 'cred', p_token: null, p_payload: { cred_id: b.id } }); } catch (e) { return fail('denied', 503); }
  if (!c || c.error) return fail((c && c.error) || 'denied', 401);
  // verifyAssertion wants challenge = SHA-256(text); our challenge is SHA-256('kolaboro-passkey-v1\nlogin\n' + chal)
  const v = await verifyAssertion({ spki: c.spki, alg: c.alg, authenticator_data: b.authenticator_data, client_data_json: b.client_data_json, signature: b.signature }, 'kolaboro-passkey-v1\nlogin\n' + b.chal);
  if (!v.ok) return out({ error: 'signature', message: 'The passkey signature did not verify (' + v.why + ').' }, 401);
  let d; try { d = await rpc('kolaboro_passkey', { p_wkey: WKEY, p_action: 'login', p_token: null, p_payload: { chal: b.chal, cred_id: b.id, sign_count: v.sign_count } }); } catch (e) { return fail('denied', 503); }
  if (!d || !d.token) return fail((d && d.error) || 'denied', 401);
  return out({ token: d.token, role: d.role || 'buyer' });
}
async function pkList(req, del) {
  const b = await body(req); if (!tokOk(b.token)) return fail('auth', 401);
  let d; try { d = await rpc('kolaboro_passkey', { p_wkey: WKEY, p_action: del ? 'delete' : 'list', p_token: b.token, p_payload: del ? { cred_id: String(b.id || '') } : {} }); } catch (e) { return fail('denied', 503); }
  if (!d || d.error) return fail((d && d.error) || 'denied', d && d.error === 'auth' ? 401 : 400);
  return out(d);
}

// ---------- credentials
const CTX = ['https://www.w3.org/ns/credentials/v2'];
async function vcLookup(root, req, u, env, ctx) {
  const r = await lookupHandle(new Request(ORIGIN + '/api/kb/lookup/r/' + root), new URL(ORIGIN + '/api/kb/lookup/r/' + root), env, ctx);
  const d = await r.json().catch(() => null);
  if (!d || d.error || !d.seal || d.seal.root_sha256 !== root) return out({ error: 'not_in_edge_cache', note: 'Sealed results are kept 30 days in the edge cache of the data centre that made the lookup. Open the credential link from the same results page, or run the lookup again.' }, 404, { 'access-control-allow-origin': '*' });
  const at = String(d.finished_at || d.started_at || new Date().toISOString()).replace(/\.\d+Z$/, 'Z');
  const doc = { '@context': CTX, id: ORIGIN + '/api/x/acct/vc/lookup/' + root, type: ['VerifiableCredential', 'KolaboroSealedLookup'],
    name: 'Kolaboro sealed register lookup', description: 'What the named official registers returned at fetched_at, kept byte for byte and sealed by a SHA-256 root (also timestamped through OpenTimestamps). Not a verdict on any project or company.',
    issuer: { id: DID, name: 'Kolaboro' }, validFrom: at,
    credentialSubject: { id: d.seal.result_url, type: 'SealedRegisterLookup', rootSha256: root, resultSha256: await sha(jcs(d)), summary: d.summary || null,
      checks: (d.checks || []).map(c => ({ id: c.id, source: c.source || c.register || c.name || null, status: c.status, url: (c.snapshot && c.snapshot.url) || c.url || null, sha256: c.snapshot && c.snapshot.sha256 || null, fetchedAt: c.snapshot && c.snapshot.fetched_at || null, rawUrl: c.snapshot && c.snapshot.raw_url || null })),
      sealLines: d.seal.lines || [], timestamp: d.seal.verify || null, disclaimer: d.disclaimer || null } };
  const vc = await issue(env, doc, at);
  if (!vc) return out({ error: 'signing_unavailable' }, 503);
  return out(vc, 200, { 'cache-control': 'public, max-age=3600', 'access-control-allow-origin': '*', 'content-disposition': 'inline; filename="kolaboro-lookup-' + root.slice(0, 12) + '.vc.json"', 'content-type': 'application/vc+ld+json; charset=utf-8' });
}
async function vcReport(req, env, ctx) {
  const b = await body(req); if (!tokOk(b.token)) return fail('auth', 401);
  if (await limited(req, ctx, 'vcrep', 60)) return fail('busy', 429);
  let me; try { me = await rpc('kolaboro_portal', { p_token: b.token, p_action: 'me' }); } catch (e) { return out({ error: 'db' }, 503); }
  if (!me || !me.user) return fail('auth', 401);
  const c = (me.cases || []).find(x => x.id === b.case_id);
  if (!c) return out({ error: 'case', message: 'No such case in your account.' }, 404);
  if (!c.report_url && !c.verdict) return out({ error: 'not_delivered', message: 'This case has no delivered report yet. The credential is available once the report is published to you.' }, 409);
  const reportUrl = c.report_url ? new URL(c.report_url, ORIGIN).href : null;
  let reportSha = null;
  if (reportUrl && /^https:\/\//.test(reportUrl)) {
    try { const r = await fetch(reportUrl, { redirect: 'follow', headers: { 'user-agent': 'kolaboro-vc/1' } }); if (r.ok) { const buf = await r.arrayBuffer(); if (buf.byteLength <= 15e6) reportSha = hex(await h256(new Uint8Array(buf))); } } catch (e) {}
  }
  const logs = (c.log || []).filter(l => l && l.at);
  const delivered = String((logs.length ? logs[logs.length - 1].at : c.created_at) || new Date().toISOString());
  const at = new Date(delivered).toISOString().replace(/\.\d+Z$/, 'Z');
  const doc = { '@context': CTX, id: 'urn:kolaboro:report:' + (await sha('kolaboro-report-vc-v1\n' + c.id + '\n' + (reportUrl || '') + '\n' + (c.verdict || ''))).slice(0, 32),
    type: ['VerifiableCredential', 'KolaboroDueDiligenceReport'], name: 'Kolaboro due diligence report',
    description: 'Kolaboro delivered this report to the holder of case ' + c.code + '. Project details are as the buyer entered them. reportSha256 fingerprints the report file as published when this credential was issued.',
    issuer: { id: DID, name: 'Kolaboro' }, validFrom: at,
    credentialSubject: { type: 'DueDiligenceReport', caseCode: c.code, stage: c.stage, verdict: c.verdict || null, reportUrl, reportSha256: reportSha, deliveredAt: at,
      project: { name: c.project_name || null, url: c.project_url || null, location: c.location || null, developer: c.developer || null, enteredBy: 'buyer' },
      demo: !!(me.user && me.user.demo) || undefined } };
  const vc = await issue(env, doc);
  if (!vc) return out({ error: 'signing_unavailable' }, 503);
  return out(vc, 200, { 'content-type': 'application/vc+ld+json; charset=utf-8' });
}

export async function handle(req, u, env, ctx) {
  const p = u.pathname.replace(/\/+$/, '');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400' } });
  try {
    if (req.method === 'POST') {
      // passkey routes are first-party only (the browser sends Origin on POST)
      const o = req.headers.get('origin');
      if (/^\/api\/x\/acct\/pk\//.test(p) && o && o !== ORIGIN) return out({ error: 'origin' }, 403);
      if (p === '/api/x/acct/pk/reg/options') return await regOptions(req, ctx);
      if (p === '/api/x/acct/pk/reg') return await reg(req, ctx);
      if (p === '/api/x/acct/pk/login/options') return await loginOptions(req, ctx);
      if (p === '/api/x/acct/pk/login') return await login(req, ctx);
      if (p === '/api/x/acct/pk/list') return await pkList(req, false);
      if (p === '/api/x/acct/pk/delete') return await pkList(req, true);
      if (p === '/api/x/acct/vc/report') return await vcReport(req, env, ctx);
      if (p === '/api/x/acct/vc/verify') { const b = await body(req); return out(await verifyVc(b.vc || b, env), 200, { 'access-control-allow-origin': '*' }); }
      return out({ error: 'not_found' }, 404);
    }
    if (req.method !== 'GET') return out({ error: 'method' }, 405);
    const m = p.match(/^\/api\/x\/acct\/vc\/lookup\/([0-9a-f]{64})$/);
    if (m) return await vcLookup(m[1], req, u, env, ctx);
    if (p === '/api/x/acct/did') return did(env);
    if (p === '/api/x/acct/status') return pub({ passkeys: true, admin_2fa: true, credentials: { signing: !!(env && env.KB_SIGN_KEY), issuer: DID, did_document: ORIGIN + '/.well-known/did.json', cryptosuite: 'eddsa-jcs-2022', verifier: ORIGIN + '/verify/#vc' } }, 60);
    return out({ error: 'not_found', see: ['/api/x/acct/status', '/.well-known/did.json', '/verify/#vc'] }, 404);
  } catch (e) { return out({ error: 'server', detail: String(e && e.message || e).slice(0, 120) }, 500); }
}
