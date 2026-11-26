// comments: _notes/kolaboro-worker-comments.txt
const $q = TB.kbx_acct__q, $s = TB.kbx_acct__s, $t = TB.kbx_acct__t;   // n40 k46: short names for this module's string tables (strings in /data/i18n/k19s.json, k17s.json, k46s.json)
import { rpc, sha, verifyAssertion, PUB_RAW_B64, WKEY } from './kolaboro.js';
import { handle as lookupHandle } from './kbx_lookup.js';
import { TB } from './kbx_strings.js';
export const PATHS = /^\/api\/x\/acct\//;
const ORIGIN = 'https://kolaboro.com', RP = 'kolaboro.com', DID = 'did:web:kolaboro.com';
const te = new TextEncoder(), td = new TextDecoder();
const HDR = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const out = (o, s, extra) => new Response(JSON.stringify(o, null, 1), { status: s || 200, headers: Object.assign({}, HDR, extra || {}) });
const pub = (o, age) => out(o, 200, { 'cache-control': $q.a + (age || 300), 'access-control-allow-origin': '*' });
const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return btoa(s); };
const b64u = u8 => b64(u8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = x => { x = String(x || '').replace(/-/g, '+').replace(/_/g, '/'); while (x.length % 4) x += '='; return Uint8Array.from(atob(x), c => c.charCodeAt(0)); };
const hex = u8 => [...u8].map(x => x.toString(16).padStart(2, '0')).join('');
const h256 = async b => new Uint8Array(await crypto.subtle.digest($q.b, typeof b === $q.c ? te.encode(b) : b));
function b58(u8) {
const d = []; for (const byte of u8) { let c = byte; for (let j = 0; j < d.length; j++) { c += d[j] << 8; d[j] = c % 58; c = (c / 58) | 0; } while (c) { d.push(c % 58); c = (c / 58) | 0; } }
let s = ''; for (const byte of u8) { if (byte) break; s += '1'; } for (let i = d.length - 1; i >= 0; i--) s += $t.B58[d[i]];
return s;
}
function unb58(s) {
const b = []; for (const ch of s) { let c = $t.B58.indexOf(ch); if (c < 0) throw new Error($q.d); for (let j = 0; j < b.length; j++) { c += b[j] * 58; b[j] = c & 255; c >>= 8; } while (c) { b.push(c & 255); c >>= 8; } }
let z = 0; while (z < s.length && s[z] === '1') z++;
return new Uint8Array([...new Array(z).fill(0), ...b.reverse()]);
}
export function jcs(v) {
if (v === null || typeof v !== $q.e) { if (typeof v === $q.f && !isFinite(v)) throw new Error($q.g); return JSON.stringify(v); }
if (Array.isArray(v)) return '[' + v.map(x => jcs(x === undefined ? null : x)).join(',') + ']';
return '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + jcs(v[k])).join(',') + '}';
}
let SK = null;
async function signKey(env) {
if (SK || !env || !env.KB_SIGN_KEY) return SK;
const der = Uint8Array.from(atob(env.KB_SIGN_KEY), c => c.charCodeAt(0));
for (const alg of [{ name: $q.h }, { name: $q.i, namedCurve: $q.i }]) { try { SK = await crypto.subtle.importKey('pkcs8', der, alg, false, ['sign']); SK._alg = alg; break; } catch (e) {} }
return SK;
}
const kidOf = env => (env && env.KB_SIGN_KID) || 'key-1';
const vmOf = env => DID + '#' + kidOf(env);
const multikey = () => 'z' + b58(new Uint8Array([0xed, 0x01, ...Uint8Array.from(atob(PUB_RAW_B64), c => c.charCodeAt(0))]));
export function didDoc(env) {
const vm = vmOf(env);
return { '@context': [$q.j, $q.k], id: DID,
verificationMethod: [{ id: vm, type: $q.l, controller: DID, publicKeyMultibase: multikey() }],
assertionMethod: [vm],
service: [{ id: DID + $q.m, type: $q.n, serviceEndpoint: ORIGIN + $q.o }] };
}
export function did(env) {
return new Response(JSON.stringify(didDoc(env), null, 1), { headers: { 'content-type': $q.p, 'access-control-allow-origin': '*', 'cache-control': $q.q, 'x-content-type-options': $q.r } });
}
export async function issue(env, doc, created) {
const k = await signKey(env); if (!k) return null;
const proof = { type: $q.s, cryptosuite: $q.t, created: created || new Date().toISOString().replace(/\.\d+Z$/, 'Z'), verificationMethod: vmOf(env), proofPurpose: $q.u, '@context': doc[$q.v] };
const data = new Uint8Array([...(await h256(jcs(proof))), ...(await h256(jcs(doc)))]);
const sig = new Uint8Array(await crypto.subtle.sign(k._alg || { name: $q.h }, k, data));
return Object.assign({}, doc, { proof: Object.assign(proof, { proofValue: 'z' + b58(sig) }) });
}
export async function verifyVc(vc, env) {
const steps = [];
try {
if (!vc || typeof vc !== $q.e || !vc.proof) return { valid: false, reason: $q.w, steps };
const p = vc.proof;
if (p.type !== $q.s || p.cryptosuite !== $q.t) return { valid: false, reason: $q.x + p.type + '/' + p.cryptosuite, steps };
const iss = typeof vc.issuer === $q.c ? vc.issuer : vc.issuer && vc.issuer.id;
if (!String(p.verificationMethod || '').startsWith(iss + '#')) return { valid: false, reason: $t.k0, steps };
if (iss !== DID) return { valid: false, reason: $q.y + DID + $q.z, steps };
const vm = didDoc(env).verificationMethod.find(m => m.id === p.verificationMethod);
if (!vm || !(didDoc(env).assertionMethod || []).includes(vm.id)) return { valid: false, reason: $q.A + p.verificationMethod, steps };
steps.push($q.B + iss + $q.C + vm.id);
const mk = unb58(vm.publicKeyMultibase.slice(1)); if (mk[0] !== 0xed || mk[1] !== 0x01) return { valid: false, reason: $q.D, steps };
const doc = Object.assign({}, vc); delete doc.proof;
const cfg = Object.assign({}, p); delete cfg.proofValue;
if (jcs(cfg[$q.v]) !== jcs(doc[$q.v])) return { valid: false, reason: $t.k1, steps };
const data = new Uint8Array([...(await h256(jcs(cfg))), ...(await h256(jcs(doc)))]);
const sig = unb58(String(p.proofValue || '').replace(/^z/, ''));
let ok = false;
for (const alg of [{ name: $q.h }, { name: $q.i, namedCurve: $q.i }]) {
try { const key = await crypto.subtle.importKey('raw', mk.slice(2), alg, false, [$q.E]); ok = await crypto.subtle.verify(alg, key, sig, data); break; } catch (e) {}
}
steps.push($t.k2 + (ok ? 'valid' : $q.F));
return { valid: ok, reason: ok ? null : $q.G, steps, issuer: iss, type: vc.type, validFrom: vc.validFrom || null };
} catch (e) { return { valid: false, reason: $q.H + String(e && e.message || e).slice(0, 80), steps }; }
}
async function limited(req, ctx, kind, max) {
const ip0 = req.headers.get($q.I) || 'x', ip = ip0.includes(':') ? ip0.split(':').slice(0, 4).join(':') : ip0;
const k = new Request($q.J + kind + '/' + encodeURIComponent(ip) + '/' + new Date().toISOString().slice(0, 13));
const h = await caches.default.match(k), n = h ? (+(await h.text()) || 0) : 0;
if (n >= max) return true;
ctx.waitUntil(caches.default.put(k, new Response(String(n + 1), { headers: { 'cache-control': $q.K } })).catch(() => {}));
return false;
}
async function body(req) { try { const b = await req.json(); return b && typeof b === $q.e ? b : {}; } catch (e) { return {}; } }
const tokOk = t => typeof t === $q.c && /^[0-9a-f]{48}$/.test(t);
async function challenge(purpose, chal) { return b64u(await h256($q.L + purpose + '\n' + chal)); }
const fail = (e, s) => out({ error: e, message: $t.o_PK_MSG[e] || $q.M }, s || 400);
async function regOptions(req, ctx) {
const b = await body(req); if (!tokOk(b.token)) return fail('auth', 401);
if (await limited(req, ctx, 'pkreg', 30)) return fail('busy', 429);
let d; try { d = await rpc($q.N, { p_wkey: WKEY, p_action: 'chal', p_token: b.token, p_payload: { purpose: 'reg' } }); } catch (e) { return fail($q.O, 503); }
if (!d || d.error) return fail((d && d.error) || $q.O, d && d.error === 'auth' ? 401 : 400);
return out({ chal: d.chal, publicKey: { challenge: await challenge('reg', d.chal), rp: { id: RP, name: $q.P },
user: { id: b64u(te.encode(d.user.id)), name: d.user.email, displayName: d.user.name || d.user.email },
pubKeyCredParams: [{ type: $q.Q, alg: -8 }, { type: $q.Q, alg: -7 }, { type: $q.Q, alg: -257 }],
authenticatorSelection: { residentKey: $q.R, requireResidentKey: true, userVerification: $q.R }, attestation: 'none', timeout: 120000,
excludeCredentials: (d.exclude || []).map(id => ({ type: $q.Q, id })) } });
}
async function reg(req, ctx) {
  const b = await body(req); if (!tokOk(b.token)) return fail('auth', 401);
  if (await limited(req, ctx, 'pkreg', 30)) return fail('busy', 429);
  try {
    const cj = unb64u(b.client_data_json), ad = unb64u(b.authenticator_data), cd = JSON.parse(td.decode(cj));
    if (cd.type !== $q.S) return out({ error: $q.T, message: $q.U }, 400);
    if (cd.origin !== ORIGIN) return out({ error: $q.V, message: $q.W }, 400);
    if (!/^[0-9a-f]{64}$/.test(String(b.chal || '')) || cd.challenge !== await challenge('reg', b.chal)) return fail($q.X);
    if (hex(ad.slice(0, 32)) !== hex(await h256(RP))) return out({ error: 'rp', message: $q.Y }, 400);
    const flags = ad[32]; if (!(flags & 1) || !(flags & 4) || !(flags & 0x40)) return out({ error: 'uv', message: $q.Z }, 400);
    const signCount = (ad[33] << 24 | ad[34] << 16 | ad[35] << 8 | ad[36]) >>> 0;
    const idLen = ad[53] << 8 | ad[54], credId = ad.slice(55, 55 + idLen);
    if (!idLen || b64u(credId) !== String(b.id || '')) return out({ error: 'id', message: $q.aa }, 400);
    const alg = +b.alg, spki = Uint8Array.from(atob(String(b.spki || '')), c => c.charCodeAt(0));
    const imp = alg === -7 ? { name: 'ECDSA', namedCurve: 'P-256' } : alg === -8 ? { name: $q.h } : alg === -257 ? { name: $q.ab, hash: $q.b } : null;
    if (!imp) return fail('key');
    try { await crypto.subtle.importKey('spki', spki, imp, false, [$q.E]); } catch (e) { return fail('key'); }
    const d = await rpc($q.N, { p_wkey: WKEY, p_action: $q.ac, p_token: b.token, p_payload: { chal: b.chal, cred_id: b.id, spki: b64(spki), alg: String(alg), label: String(b.label || '').slice(0, 60), sign_count: signCount } });
    if (!d || d.error) return fail((d && d.error) || $q.O);
    return out({ ok: true });
  } catch (e) { return out({ error: $q.ad, message: $q.ae }, 400); }
}
async function loginOptions(req, ctx) {
if (await limited(req, ctx, $q.af, 60)) return fail('busy', 429);
let d; try { d = await rpc($q.N, { p_wkey: WKEY, p_action: 'chal', p_token: null, p_payload: { purpose: 'login' } }); } catch (e) { return fail($q.O, 503); }
if (!d || d.error) return fail((d && d.error) || $q.O);
return out({ chal: d.chal, publicKey: { challenge: await challenge('login', d.chal), rpId: RP, userVerification: $q.R, timeout: 120000, allowCredentials: [] } });
}
async function login(req, ctx) {
const b = await body(req);
if (await limited(req, ctx, $q.af, 60)) return fail('busy', 429);
if (!/^[0-9a-f]{64}$/.test(String(b.chal || '')) || !/^[A-Za-z0-9_-]{16,400}$/.test(String(b.id || ''))) return out({ error: $q.ad, message: $t.k3 }, 400);
let c; try { c = await rpc($q.N, { p_wkey: WKEY, p_action: 'cred', p_token: null, p_payload: { cred_id: b.id } }); } catch (e) { return fail($q.O, 503); }
if (!c || c.error) return fail((c && c.error) || $q.O, 401);
const v = await verifyAssertion({ spki: c.spki, alg: c.alg, authenticator_data: b.authenticator_data, client_data_json: b.client_data_json, signature: b.signature }, $q.ag + b.chal);
if (!v.ok) return out({ error: $q.ah, message: $t.k4 + v.why + ').' }, 401);
let d; try { d = await rpc($q.N, { p_wkey: WKEY, p_action: 'login', p_token: null, p_payload: { chal: b.chal, cred_id: b.id, sign_count: v.sign_count } }); } catch (e) { return fail($q.O, 503); }
if (!d || !d.token) return fail((d && d.error) || $q.O, 401);
return out({ token: d.token, role: d.role || 'buyer' });
}
async function pkList(req, del) {
const b = await body(req); if (!tokOk(b.token)) return fail('auth', 401);
let d; try { d = await rpc($q.N, { p_wkey: WKEY, p_action: del ? $q.ai : 'list', p_token: b.token, p_payload: del ? { cred_id: String(b.id || '') } : {} }); } catch (e) { return fail($q.O, 503); }
if (!d || d.error) return fail((d && d.error) || $q.O, d && d.error === 'auth' ? 401 : 400);
return out(d);
}
const CTX = ['https://www.w3.org/ns/credentials/v2'];
const NONCE_RX = / nonce="[^"]*"/g;
async function vcLookup(root, req, u, env, ctx) {
const r = await lookupHandle(new Request(ORIGIN + $q.aj + root), new URL(ORIGIN + $q.aj + root), env, ctx);
const d = await r.json().catch(() => null);
if (!d || d.error || !d.seal || d.seal.root_sha256 !== root) return out({ error: $q.ak, note: $s.k0 }, 404, { 'access-control-allow-origin': '*' });
const at = String(d.finished_at || d.started_at || new Date().toISOString()).replace(/\.\d+Z$/, 'Z');
const doc = { '@context': CTX, id: ORIGIN + $q.al + root, type: [$q.am, $q.an],
name: $q.ao, description: $s.k1,
issuer: { id: DID, name: $q.P }, validFrom: at,
credentialSubject: { id: d.seal.result_url, type: $q.ap, rootSha256: root, resultSha256: await sha(jcs(d)), summary: d.summary || null,
checks: (d.checks || []).map(c => ({ id: c.id, source: c.source || c.register || c.name || null, status: c.status, url: (c.snapshot && c.snapshot.url) || c.url || null, sha256: c.snapshot && c.snapshot.sha256 || null, fetchedAt: c.snapshot && c.snapshot.fetched_at || null, rawUrl: c.snapshot && c.snapshot.raw_url || null })),
sealLines: d.seal.lines || [], timestamp: d.seal.verify || null, disclaimer: d.disclaimer || null } };
const vc = await issue(env, doc, at);
if (!vc) return out({ error: $q.aq }, 503);
return out(vc, 200, { 'cache-control': $q.q, 'access-control-allow-origin': '*', 'content-disposition': $q.ar + root.slice(0, 12) + $q.as, 'content-type': $q.at });
}
async function vcReport(req, env, ctx) {
const b = await body(req); if (!tokOk(b.token)) return fail('auth', 401);
if (await limited(req, ctx, 'vcrep', 60)) return fail('busy', 429);
let me; try { me = await rpc($q.au, { p_token: b.token, p_action: 'me' }); } catch (e) { return out({ error: 'db' }, 503); }
if (!me || !me.user) return fail('auth', 401);
const c = (me.cases || []).find(x => x.id === b.case_id);
if (!c) return out({ error: 'case', message: $q.av }, 404);
if (!c.report_url && !c.verdict) return out({ error: $q.aw, message: $s.k2 }, 409);
const reportUrl = c.report_url ? new URL(c.report_url, ORIGIN).href : null;
let reportSha = null;
if (reportUrl && /^https:\/\//.test(reportUrl)) {
try { const r = await fetch(reportUrl, { redirect: $q.ax, headers: { 'user-agent': $q.ay } }); if (r.ok) { let buf = new Uint8Array(await r.arrayBuffer()); if (buf.byteLength <= 15e6) { if (/text\/html/.test(r.headers.get($q.az) || '')) buf = te.encode(td.decode(buf).replace(NONCE_RX, '')); reportSha = hex(await h256(buf)); } } } catch (e) {}
}
const logs = (c.log || []).filter(l => l && l.at);
const delivered = String((logs.length ? logs[logs.length - 1].at : c.created_at) || new Date().toISOString());
const at = new Date(delivered).toISOString().replace(/\.\d+Z$/, 'Z');
const doc = { '@context': CTX, id: $q.aA + (await sha($q.aB + c.id + '\n' + (reportUrl || '') + '\n' + (c.verdict || ''))).slice(0, 32),
type: [$q.am, $q.aC], name: $q.aD,
description: $t.k5 + c.code + $s.k3,
issuer: { id: DID, name: $q.P }, validFrom: at,
credentialSubject: { type: $q.aE, caseCode: c.code, stage: c.stage, verdict: c.verdict || null, reportUrl, reportSha256: reportSha, reportSha256Method: reportSha ? $s.k4 : undefined, deliveredAt: at,
project: { name: c.project_name || null, url: c.project_url || null, location: c.location || null, developer: c.developer || null, enteredBy: 'buyer' },
demo: !!(me.user && me.user.demo) || undefined } };
const vc = await issue(env, doc);
if (!vc) return out({ error: $q.aq }, 503);
return out(vc, 200, { 'content-type': $q.at });
}
export async function handle(req, u, env, ctx) {
const p = u.pathname.replace(/\/+$/, '');
if (req.method === $q.aF) return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': $q.aG, 'access-control-allow-headers': $q.az, 'access-control-max-age': '86400' } });
try {
if (req.method === 'POST') {
const o = req.headers.get($q.V);
if (/^\/api\/x\/acct\/pk\//.test(p) && o && o !== ORIGIN) return out({ error: $q.V }, 403);
if (p === $q.aH) return await regOptions(req, ctx);
if (p === $q.aI) return await reg(req, ctx);
if (p === $q.aJ) return await loginOptions(req, ctx);
if (p === $q.aK) return await login(req, ctx);
if (p === $q.aL) return await pkList(req, false);
if (p === $q.aM) return await pkList(req, true);
if (p === $q.aN) return await vcReport(req, env, ctx);
if (p === $q.aO) { const b = await body(req); return out(await verifyVc(b.vc || b, env), 200, { 'access-control-allow-origin': '*' }); }
return out({ error: $q.aP }, 404);
}
if (req.method !== 'GET') return out({ error: $q.aQ }, 405);
const m = p.match(/^\/api\/x\/acct\/vc\/lookup\/([0-9a-f]{64})$/);
if (m) return await vcLookup(m[1], req, u, env, ctx);
if (p === $q.aR) return did(env);
if (p === $q.aS) return pub({ passkeys: true, admin_2fa: true, credentials: { signing: !!(env && env.KB_SIGN_KEY), issuer: DID, did_document: ORIGIN + $q.aT, cryptosuite: $q.t, verifier: ORIGIN + $q.o } }, 60);
return out({ error: $q.aP, see: [$q.aS, $q.aT, $q.o] }, 404);
} catch (e) { return out({ error: $q.aU, detail: String(e && e.message || e).slice(0, 120) }, 500); }
}
