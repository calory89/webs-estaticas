/*! kolaboro 0.1.0 | MIT | https://kolaboro.com/docs/sdk/ | bundles kolaboro-verify.js unchanged (https://kolaboro.com/open/kolaboro-verify.js) */
const __KV__ = (function () { var module = { exports: {} };
/*! kolaboro-verify 1.3.0 (3 Nov 2026), MIT licence. Independent checks of Kolaboro's public records, in the browser or Node 18+.
 *  No dependency, no network call of its own: you pass it what you downloaded, it tells you whether it adds up.
 *
 *  KV.verifyProof(proof)          -> true if a project's page fingerprint is inside the daily Merkle root (GET /api/open/proof/{id})
 *  KV.headHash(head)              -> recomputes one log head (GET /api/open/log)
 *  KV.verifyLog(heads)            -> { ok, checked, errors[] }: every head recomputes and links to the previous one
 *  KV.sha256Hex(textOrBytes)      -> SHA-256 of a file you downloaded (e.g. /data/bali-cases.json) to compare with dataset_sha256
 *  KV.verifyEvidenceLines(lines, root) -> true if "ID SHA256" lines hash to the evidence root recorded in the log
 *  KV.verifySignature(bodyText, signatureB64, publicKeyRawB64) -> true if Kolaboro signed this exact answer (Ed25519;
 *       headers x-kolaboro-signature / x-kolaboro-key-id; keys at https://kolaboro.com/.well-known/kolaboro-keys.json)
 *  KV.verifyCheckpoint(noteText, publicKeyRawB64) -> { ok, origin, size, root } for GET /api/open/checkpoint (C2SP signed note, Ed25519)
 *  KV.verifyInclusion(leafLine, index, size, path, rootHex) -> true if a "day head" line is leaf #index of the log tree (GET /api/open/log-proof)
 *  KV.verifyConsistency(first, second, firstRootHex, secondRootHex, proofHex[]) -> true if the newer log tree only appended to the older one
 *       (RFC 9162 section 2.1.4.2; GET /api/open/log-consistency?first=M&second=N). Keep an old checkpoint, check it against a new one later.
 *  KV.verifyPhotoSignature(receipt) -> { ok, why } for a passkey-signed site photo (GET /api/open/receipt/{id}): the agent's phone signed
 *       SHA-256("kolaboro-capture-v1\n" + photo sha256 + "\n" + capture code) with WebAuthn; checks origin, relying party, user verification, signature
 *  KV.verifyBitcoinStamp(otsBytes, hashHex, getMerkleRoot) -> { ok, height }: walks the OpenTimestamps proof (GET /api/kb/stamp?hash=H)
 *       to its Bitcoin block and compares with that block's merkle root from any block explorer. No trust in Kolaboro needed.
 *  Each log head is also recorded in Sigstore Rekor (rekor_uuid in /api/open/log) and timestamped in Bitcoin: GET https://kolaboro.com/api/kb/stamp?hash=HEAD returns the OpenTimestamps proof,
 *  which you can check with the official tools (opentimestamps.org).
 */
(function (root) {
  var C = (typeof crypto !== 'undefined' && crypto.subtle) ? crypto : (typeof require === 'function' ? require('crypto').webcrypto : null);
  var te = new TextEncoder();
  function bytes(x) { return typeof x === 'string' ? te.encode(x) : (x instanceof Uint8Array ? x : new Uint8Array(x)); }
  function hex(u) { return Array.prototype.map.call(new Uint8Array(u), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function unhex(h) { var a = new Uint8Array(h.length / 2); for (var i = 0; i < a.length; i++) a[i] = parseInt(h.substr(i * 2, 2), 16); return a; }
  function H(b) { return C.subtle.digest('SHA-256', b).then(function (d) { return new Uint8Array(d); }); }
  function cat(a, b, c) { var o = new Uint8Array(a.length + b.length + (c ? c.length : 0)); o.set(a, 0); o.set(b, a.length); if (c) o.set(c, a.length + b.length); return o; }
  function sha256Hex(x) { return H(bytes(x)).then(hex); }
  // leaf = H(0x00 || line); node = H(0x01 || left || right)
  function verifyProof(p) {
    if (!p || !p.line || !p.path || !/^[0-9a-f]{64}$/.test(p.projects_root || '')) return Promise.resolve(false);
    var cur = H(cat(new Uint8Array([0]), te.encode(p.line)));
    p.path.forEach(function (s) { cur = cur.then(function (c) { var o = unhex(s.hash); return H(s.side === 'L' ? cat(new Uint8Array([1]), o, c) : cat(new Uint8Array([1]), c, o)); }); });
    return cur.then(function (c) { return hex(c) === p.projects_root; });
  }
  function canonical(h) {
    return ['kolaboro-log-v1', h.day, h.dataset_sha256, h.projects_root, h.projects_count, h.evidence_root || '', h.evidence_items || 0, h.audit_head || '', h.audit_count || 0, h.prev || 'genesis'].join('|');
  }
  function headHash(h) { return sha256Hex(canonical(h)); }
  function verifyLog(heads) {
    var L = (heads || []).slice().sort(function (a, b) { return a.day < b.day ? -1 : 1; }), errors = [];
    return Promise.all(L.map(headHash)).then(function (hs) {
      L.forEach(function (h, i) {
        if (hs[i] !== h.head) errors.push(h.day + ': head does not recompute');
        if (i === 0 && h.prev) errors.push(h.day + ': first head should have no previous head');
        if (i > 0 && h.prev !== L[i - 1].head) errors.push(h.day + ': previous-head link broken');
      });
      return { ok: errors.length === 0, checked: L.length, errors: errors };
    });
  }
  function verifyEvidenceLines(lines, rootHex) { return sha256Hex(lines.map(function (l) { return l + '\n'; }).join('')).then(function (h) { return h === rootHex; }); }
  function b64(s) { var b = (typeof atob === 'function') ? atob(s) : Buffer.from(s, 'base64').toString('binary'); var u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function verifySignature(body, sigB64, pubRawB64) {
    return sha256Hex(body).then(function (h) {
      return C.subtle.importKey('raw', b64(pubRawB64), { name: 'Ed25519' }, false, ['verify']).then(function (k) { return C.subtle.verify({ name: 'Ed25519' }, k, b64(sigB64), te.encode('kolaboro-sig-v1\n' + h)); });
    }).catch(function () { return false; });
  }
  // ----- log tree of daily heads (RFC 9162 / RFC 6962 hashing) -----
  function leafH(line) { return H(cat(new Uint8Array([0]), te.encode(line))); }
  function nodeH(l, r) { return H(cat(new Uint8Array([1]), l, r)); }
  function eq(a, b) { if (a.length !== b.length) return false; for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; }
  function verifyInclusion(line, index, size, path, rootHex) {
    // path as served by /api/open/log-proof: [{side:'L'|'R', hash}]
    if (!(index >= 0 && index < size)) return Promise.resolve(false);
    var cur = leafH(line);
    (path || []).forEach(function (s) { cur = cur.then(function (c) { var o = unhex(s.hash); return s.side === 'L' ? nodeH(o, c) : nodeH(c, o); }); });
    return cur.then(function (c) { return hex(c) === rootHex; });
  }
  function verifyConsistency(m, n, r1hex, r2hex, proofHex) {
    // RFC 9162 section 2.1.4.2
    var r1 = unhex(r1hex), r2 = unhex(r2hex), p = (proofHex || []).map(unhex);
    if (!(m >= 1 && m <= n)) return Promise.resolve(false);
    if (m === n) return Promise.resolve(p.length === 0 && eq(r1, r2));
    if (!p.length) return Promise.resolve(false);
    if ((m & (m - 1)) === 0) p.unshift(r1);
    var fn = m - 1, sn = n - 1;
    while (fn & 1) { fn >>= 1; sn >>= 1; }
    var fr = Promise.resolve(p[0]), sr = Promise.resolve(p[0]), ok = true;
    p.slice(1).forEach(function (c) {
      if (sn === 0) { ok = false; return; }
      if ((fn & 1) || fn === sn) {
        fr = fr.then(function (x) { return nodeH(c, x); }); sr = sr.then(function (x) { return nodeH(c, x); });
        if (!(fn & 1)) { while (!(fn & 1) && fn !== 0) { fn >>= 1; sn >>= 1; } }
      } else { sr = sr.then(function (x) { return nodeH(x, c); }); }
      fn >>= 1; sn >>= 1;
    });
    return Promise.all([fr, sr]).then(function (a) { return ok && sn === 0 && eq(a[0], r1) && eq(a[1], r2); });
  }
  function verifyCheckpoint(note, pubRawB64) {
    var i = note.indexOf('\n\n'); if (i < 0) return Promise.resolve({ ok: false });
    var body = note.slice(0, i + 1), lines = body.split('\n'), origin = lines[0], size = +lines[1], root = lines[2];
    var sigs = note.slice(i + 2).split('\n').filter(function (l) { return l.indexOf('— ' + origin + ' ') === 0; });
    if (!sigs.length) return Promise.resolve({ ok: false, origin: origin });
    var pub = b64(pubRawB64);
    return H(cat(te.encode(origin + '\n'), new Uint8Array([1]), pub)).then(function (kh) {
      var res = sigs.map(function (l) {
        var blob = b64(l.split(' ').pop()); if (blob.length !== 68 || !eq(blob.slice(0, 4), kh.slice(0, 4))) return Promise.resolve(false);
        return C.subtle.importKey('raw', pub, { name: 'Ed25519' }, false, ['verify']).then(function (k) { return C.subtle.verify({ name: 'Ed25519' }, k, blob.slice(4), te.encode(body)); });
      });
      return Promise.all(res).then(function (r) { var rootHex = ''; try { rootHex = hex(b64(root)); } catch (e) {} return { ok: r.some(Boolean), origin: origin, size: size, root: rootHex }; });
    }).catch(function () { return { ok: false }; });
  }
  function b64u(x) { x = String(x || '').replace(/-/g, '+').replace(/_/g, '/'); while (x.length % 4) x += '='; return b64(x); }
  function derRaw(der, n) { var o = 2; if (der[1] & 0x80) o += der[1] & 0x7f; function rd() { o++; var l = der[o++], v = der.slice(o, o + l); o += l; while (v.length > n && v[0] === 0) v = v.slice(1); var out = new Uint8Array(n); out.set(v, n - v.length); return out; } var r = rd(), s2 = rd(), raw = new Uint8Array(2 * n); raw.set(r, 0); raw.set(s2, n); return raw; }
  function verifyPhotoSignature(rc) { return verifyAssertion(rc && rc.passkey, 'kolaboro-capture-v1\n' + (rc && rc.sha256) + '\n' + ((rc && rc.passkey && rc.passkey.code) || '')); }
  // founder co-signature of a log head: KV.verifyCosign(head) with a head from /api/open/log
  function verifyCosign(h) { return verifyAssertion(h && h.cosign, 'kolaboro-cosign-v1\n' + (h && h.day) + '\n' + (h && h.head)); }
  function verifyAssertion(pk, challengeText) {
    if (!pk) return Promise.resolve({ ok: false, why: 'not signed' });
    var ad = b64u(pk.authenticator_data), cj = b64u(pk.client_data_json), sig = b64u(pk.signature), cd;
    try { cd = JSON.parse(new TextDecoder().decode(cj)); } catch (e) { return Promise.resolve({ ok: false, why: 'malformed' }); }
    return Promise.all([H(te.encode(challengeText)), H(te.encode('kolaboro.com')), H(cj)]).then(function (h) {
      var want = btoa(String.fromCharCode.apply(null, h[0])).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      if (cd.type !== 'webauthn.get' || cd.challenge !== want) return { ok: false, why: 'challenge does not match' };
      if (cd.origin !== 'https://kolaboro.com' || !eq(ad.slice(0, 32), h[1])) return { ok: false, why: 'wrong origin or relying party' };
      if (!(ad[32] & 1) || !(ad[32] & 4)) return { ok: false, why: 'user not verified' };
      var signed = cat(ad, h[2]), alg = pk.alg === -7 ? [{ name: 'ECDSA', namedCurve: 'P-256' }, { name: 'ECDSA', hash: 'SHA-256' }, derRaw(sig, 32)] : pk.alg === -8 ? [{ name: 'Ed25519' }, { name: 'Ed25519' }, sig] : [{ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, 'RSASSA-PKCS1-v1_5', sig];
      return C.subtle.importKey('spki', b64(pk.spki), alg[0], false, ['verify']).then(function (k) { return C.subtle.verify(alg[1], k, alg[2], signed); }).then(function (ok) { return ok ? { ok: true } : { ok: false, why: 'signature does not verify' }; });
    }).catch(function () { return { ok: false, why: 'malformed' }; });
  }
  // ----- OpenTimestamps proof, checked against Bitcoin itself -----
  // KV.otsBitcoin(otsBytes, hashHex) -> [{ height, merkle_root }] every Bitcoin attestation the proof reaches for this hash.
  // KV.verifyBitcoinStamp(otsBytes, hashHex, getMerkleRoot) -> { ok, height } where getMerkleRoot(height) returns the block's
  //   merkle root as shown by any block explorer (e.g. mempool.space/api/block-height/H then /api/block/HASH).
  var OTS_MAGIC = [0x00, 0x4f, 0x70, 0x65, 0x6e, 0x54, 0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d, 0x70, 0x73, 0x00, 0x00, 0x50, 0x72, 0x6f, 0x6f, 0x66, 0x00, 0xbf, 0x89, 0xe2, 0xe8, 0x84, 0xe8, 0x92, 0x94];
  function otsBitcoin(bytes, hashHex) {
    var b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), p = 0, out = [];
    function rb() { if (p >= b.length) throw new Error('truncated'); return b[p++]; }
    function vu() { var v = 0, s = 1, x; do { x = rb(); v += (x & 0x7f) * s; s *= 128; } while (x & 0x80); return v; }
    function vb() { var n = vu(); if (p + n > b.length) throw new Error('truncated'); var r = b.slice(p, p + n); p += n; return r; }
    for (var i = 0; i < OTS_MAGIC.length; i++) if (rb() !== OTS_MAGIC[i]) return Promise.reject(new Error('not an OpenTimestamps proof'));
    vu(); if (rb() !== 0x08) return Promise.reject(new Error('only SHA-256 file hashes are supported'));
    var digest = b.slice(p, p + 32); p += 32;
    if (hex(digest) !== String(hashHex).toLowerCase()) return Promise.reject(new Error('the proof is for another hash'));
    // walk the tree; each branch is a promise of its message
    function walk(msgP) {
      var jobs = [];
      function one(tag) {
        if (tag === 0x00) {
          var t = []; for (var k = 0; k < 8; k++) t.push(rb()); var payload = vb(), th = hex(new Uint8Array(t));
          if (th === '0588960d73d71901') { var q = 0, h = 0, s2 = 1, x; do { x = payload[q++]; h += (x & 0x7f) * s2; s2 *= 128; } while (x & 0x80);
            jobs.push(msgP.then(function (m) { out.push({ height: h, merkle_root: hex(m.slice().reverse()) }); })); }
          return;
        }
        var op;
        if (tag === 0xf0) { var a = vb(); op = function (m) { return cat(m, a); }; }
        else if (tag === 0xf1) { var pr = vb(); op = function (m) { return cat(pr, m); }; }
        else if (tag === 0x08) op = function (m) { return H(m); };
        else if (tag === 0xf2) op = function (m) { return m.slice().reverse(); };
        else throw new Error('unsupported operation 0x' + tag.toString(16));
        walk(msgP.then(op)).forEach(function (j) { jobs.push(j); });
      }
      var tag = rb();
      while (tag === 0xff) { one(rb()); tag = rb(); }
      one(tag);
      return jobs;
    }
    try { return Promise.all(walk(Promise.resolve(digest))).then(function () { return out; }); } catch (e) { return Promise.reject(e); }
  }
  function verifyBitcoinStamp(bytes, hashHex, getMerkleRoot) {
    return otsBitcoin(bytes, hashHex).then(function (atts) {
      if (!atts.length) return { ok: false, why: 'no Bitcoin attestation yet (pending)' };
      return Promise.all(atts.map(function (a) { return Promise.resolve(getMerkleRoot(a.height)).then(function (root) { return String(root).toLowerCase() === a.merkle_root; }); })).then(function (r) {
        var bad = atts.filter(function (a, i) { return !r[i]; });
        return bad.length ? { ok: false, why: 'merkle root does not match block ' + bad[0].height } : { ok: true, height: Math.min.apply(null, atts.map(function (a) { return a.height; })), blocks: atts.map(function (a) { return a.height; }) };
      });
    }).catch(function (e) { return { ok: false, why: String(e.message || e) }; });
  }
  var KV = { version: '1.3.0', otsBitcoin: otsBitcoin, verifyBitcoinStamp: verifyBitcoinStamp, verifyPhotoSignature: verifyPhotoSignature, verifyCosign: verifyCosign, verifyInclusion: verifyInclusion, verifyConsistency: verifyConsistency, verifyCheckpoint: verifyCheckpoint, verifySignature: verifySignature, sha256Hex: sha256Hex, verifyProof: verifyProof, canonical: canonical, headHash: headHash, verifyLog: verifyLog, verifyEvidenceLines: verifyEvidenceLines };
  if (typeof module !== 'undefined' && module.exports) module.exports = KV; else root.KV = KV;
})(typeof self !== 'undefined' ? self : this);
; return module.exports; })();
const __KEYS__ = [{"kid": "kb-f2e04da5878f8c51", "alg": "Ed25519", "public_key_raw_b64": "rnY6UvDI+L6e8j3a+UPwmddQJFapkfmEXWwHuXzdmzw=", "status": "active"}];
/**
 * kolaboro 0.1.0: official client for the Kolaboro open data API (https://kolaboro.com/api/open).
 * MIT licence. Works in browsers, Node 20+, Deno, Bun and Cloudflare Workers. No dependency.
 *
 * Every JSON answer of /api/open/* is signed with Ed25519 (header x-kolaboro-signature). By default this client
 * checks that signature before it gives you the data, and throws KolaboroSignatureError if it is missing or wrong.
 * The verification code is kolaboro-verify.js (https://kolaboro.com/open/kolaboro-verify.js), bundled unchanged.
 */
export const VERSION = '0.1.0';
export class KolaboroError extends Error {
    constructor(message, status, body) { super(message); this.name = 'KolaboroError'; this.status = status; this.body = body; }
}
export class KolaboroSignatureError extends KolaboroError {
    constructor(message, status) { super(message, status); this.name = 'KolaboroSignatureError'; }
}
export const verify = __KV__;
export const PINNED_KEYS = __KEYS__;
function qs(f = {}) {
    const p = [];
    for (const [k, v] of Object.entries(f)) {
        if (v === undefined || v === null || v === '')
            continue;
        p.push(encodeURIComponent(k) + '=' + encodeURIComponent(typeof v === 'boolean' ? (v ? '1' : '0') : String(v)));
    }
    return p.length ? '?' + p.join('&') : '';
}
const seg = (s) => encodeURIComponent(String(s));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
export class Kolaboro {
    constructor(opts = {}) {
        /** Metadata of the last answer: signature check, dataset fingerprint, build, ETag. */
        this.last = null;
        this.looked = false;
        this.baseUrl = (opts.baseUrl || 'https://kolaboro.com').replace(/\/+$/, '');
        this.verifySignatures = opts.verify !== false;
        this.keys = new Map((opts.publicKeys || PINNED_KEYS).map(k => [k.kid, k]));
        const g = (typeof fetch === 'function' ? fetch : undefined);
        const f = opts.fetch || g;
        if (!f)
            throw new Error('kolaboro: no fetch available; pass opts.fetch');
        this.f = f;
        this.apiKey = opts.apiKey;
        this.timeoutMs = opts.timeoutMs ?? 30000;
        this.retries = opts.retries ?? 2;
    }
    // ---------- data ----------
    stats() { return this.json('/stats'); }
    summary() { return this.json('/summary'); }
    projects(filters = {}) { return this.json('/projects' + qs(filters)); }
    /** Every project matching the filters, page by page (1000 per request). */
    async *allProjects(filters = {}) {
        let offset = 0;
        for (;;) {
            const page = await this.projects({ ...filters, limit: 1000, offset });
            for (const p of page.projects)
                yield p;
            offset += page.projects.length;
            if (!page.projects.length || offset >= page.total)
                return;
        }
    }
    projectsCsv(filters = {}) { return this.text('/projects.csv' + qs(filters)); }
    project(id) { return this.json('/projects/' + seg(id)); }
    /** The project as published on a past day (daily snapshots). */
    projectAt(id, day) { return this.json('/projects/' + seg(id) + '/at/' + seg(day)); }
    markets() { return this.json('/markets'); }
    marketsCsv() { return this.text('/markets.csv'); }
    changes(since) { return this.json('/changes' + qs({ since })); }
    freshness() { return this.json('/freshness'); }
    evals() { return this.json('/evals'); }
    uptime() { return this.json('/uptime'); }
    aiSpend() { return this.json('/ai-spend'); }
    build() { return this.json('/build'); }
    /** Is this case-file PDF exactly as Kolaboro created it? */
    pdf(sha256) { return this.json('/pdf/' + seg(sha256)); }
    receipt(evidenceId) { return this.json('/receipt/' + seg(evidenceId)); }
    // ---------- public log and proofs ----------
    log() { return this.json('/log'); }
    logInput() { return this.json('/log-input'); }
    proof(id) { return this.json('/proof/' + seg(id)); }
    logProof(day) { return this.json('/log-proof' + qs({ day })); }
    logConsistency(first, second) { return this.json('/log-consistency' + qs({ first, second })); }
    /** The signed checkpoint (C2SP note), with its Ed25519 note signature checked. Throws if the note signature is wrong. */
    async checkpoint() {
        const note = await this.text('/checkpoint', true);
        const r = await this.tryKeys(k => __KV__.verifyCheckpoint(note, k.public_key_raw_b64));
        if (!r || !r.ok) {
            if (this.verifySignatures)
                throw new KolaboroSignatureError('checkpoint signature does not verify', 200);
        }
        const lines = note.split('\n');
        return { note, ok: !!(r && r.ok), origin: lines[0], size: +lines[1], root: (r && r.root) || '' };
    }
    /** Is this project's page fingerprint inside the daily Merkle root? Fetches the proof and recomputes it locally. */
    async verifyProject(id) {
        const proof = await this.proof(id);
        return { ok: await __KV__.verifyProof(proof), proof };
    }
    /**
     * Full audit of the public log, done on your machine: every head recomputes and links to the previous one,
     * the checkpoint is signed, every day is included in the checkpoint tree, and the tree only ever appended.
     */
    async auditLog() {
        const { heads } = await this.log();
        const chain = await __KV__.verifyLog(heads);
        const cp = await this.checkpoint();
        const included = [];
        for (const h of heads) {
            const p = await this.logProof(h.day);
            included.push({ day: h.day, ok: p.root_hash === cp.root && await __KV__.verifyInclusion(p.leaf, p.leaf_index, p.tree_size, p.path, cp.root) });
        }
        const consistent = [];
        for (let m = 1; m <= cp.size; m++) {
            const c = await this.logConsistency(m, cp.size);
            consistent.push({ first: m, ok: c.second_root === cp.root && await __KV__.verifyConsistency(m, cp.size, c.first_root, c.second_root, c.proof) });
        }
        const sizeMatches = cp.size === heads.length;
        return {
            ok: chain.ok && cp.ok && sizeMatches && included.every(x => x.ok) && consistent.every(x => x.ok),
            heads: heads.length, chain: { ok: chain.ok, errors: chain.errors }, checkpoint: { ok: cp.ok, size: cp.size, root: cp.root }, sizeMatches, included, consistent
        };
    }
    /** The dataset file the API answers from, with its SHA-256 compared to the x-kolaboro-dataset-sha256 header of a signed answer. */
    async dataset() {
        await this.stats();
        const want = this.last && this.last.datasetSha256;
        const r = await this.fetchRetry(this.baseUrl + '/data/bali-cases.json', {});
        const text = await r.text();
        const sha256 = await __KV__.sha256Hex(text);
        return { data: JSON.parse(text), sha256, matchesSignedHeader: want ? want === sha256 : null };
    }
    // ---------- transport ----------
    /** GET any /api/open path (e.g. '/stats') and return the parsed, signature-checked JSON. */
    async json(path) {
        const text = await this.text(path);
        let body;
        try {
            body = JSON.parse(text);
        }
        catch (e) {
            throw new KolaboroError('not JSON', this.last ? this.last.status : 0, text.slice(0, 200));
        }
        return body;
    }
    async text(path, skipSignature = false) {
        const base = this.apiKey ? '/api/x/k/m' : '/api/open';
        const url = this.baseUrl + base + path;
        const headers = { accept: 'application/json, text/csv, text/plain' };
        if (this.apiKey)
            headers['x-api-key'] = this.apiKey;
        const r = await this.fetchRetry(url, { headers });
        const text = await r.text();
        const sig = r.headers.get('x-kolaboro-signature'), kid = r.headers.get('x-kolaboro-key-id');
        const meta = { url, status: r.status, signature: { checked: false, ok: null, kid }, datasetSha256: r.headers.get('x-kolaboro-dataset-sha256'), build: r.headers.get('x-kolaboro-build'), etag: r.headers.get('etag') };
        this.last = meta;
        if (!r.ok) {
            let b = text;
            try {
                b = JSON.parse(text);
            }
            catch (e) { /* not JSON */ }
            const msg = b && typeof b === 'object' && 'error' in b ? String(b.error) : 'HTTP ' + r.status;
            throw new KolaboroError(msg, r.status, b);
        }
        if (this.verifySignatures && !skipSignature) {
            if (!sig)
                throw new KolaboroSignatureError('answer is not signed: ' + url, r.status);
            const ok = await this.checkSig(text, sig, kid);
            meta.signature = { checked: true, ok, kid };
            if (!ok)
                throw new KolaboroSignatureError('signature does not verify: ' + url, r.status);
        }
        return text;
    }
    async checkSig(text, sig, kid) {
        let k = kid ? this.keys.get(kid) : undefined;
        if (!k && kid && !this.looked) {
            await this.lookupKeys();
            k = this.keys.get(kid);
        }
        if (k)
            return k.status !== 'revoked' && __KV__.verifySignature(text, sig, k.public_key_raw_b64);
        return false;
    }
    async lookupKeys() {
        this.looked = true;
        try {
            const r = await this.fetchRetry(this.baseUrl + '/.well-known/kolaboro-keys.json', {});
            const d = await r.json();
            for (const k of d.keys || [])
                if (k && k.kid && k.public_key_raw_b64 && !this.keys.has(k.kid))
                    this.keys.set(k.kid, k);
        }
        catch (e) { /* keep pinned keys only */ }
    }
    async tryKeys(fn) {
        let last = null;
        for (const k of this.keys.values()) {
            if (k.status === 'revoked')
                continue;
            last = await fn(k);
            if (last.ok)
                return last;
        }
        if (!this.looked) {
            await this.lookupKeys();
            for (const k of this.keys.values()) {
                if (k.status === 'revoked')
                    continue;
                last = await fn(k);
                if (last.ok)
                    return last;
            }
        }
        return last;
    }
    async fetchRetry(url, init) {
        let err = null;
        for (let i = 0; i <= this.retries; i++) {
            const ac = typeof AbortController === 'function' ? new AbortController() : null;
            const t = ac ? setTimeout(() => ac.abort(), this.timeoutMs) : null;
            try {
                const r = await this.f(url, { ...init, signal: ac ? ac.signal : undefined });
                if ((r.status === 429 || r.status >= 500) && i < this.retries) {
                    await sleep(400 * Math.pow(3, i));
                    continue;
                }
                return r;
            }
            catch (e) {
                err = e;
                if (i < this.retries)
                    await sleep(400 * Math.pow(3, i));
            }
            finally {
                if (t)
                    clearTimeout(t);
            }
        }
        throw new KolaboroError('network: ' + String(err?.message || err), 0);
    }
}
export default Kolaboro;
