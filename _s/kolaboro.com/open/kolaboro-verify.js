/*! kolaboro-verify 1.2.0 (3 Nov 2026), MIT licence. Independent checks of Kolaboro's public records, in the browser or Node 18+.
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
  function verifyPhotoSignature(rc) {
    var pk = rc && rc.passkey; if (!pk) return Promise.resolve({ ok: false, why: 'not signed' });
    var ad = b64u(pk.authenticator_data), cj = b64u(pk.client_data_json), sig = b64u(pk.signature), cd;
    try { cd = JSON.parse(new TextDecoder().decode(cj)); } catch (e) { return Promise.resolve({ ok: false, why: 'malformed' }); }
    return Promise.all([H(te.encode('kolaboro-capture-v1\n' + rc.sha256 + '\n' + (pk.code || ''))), H(te.encode('kolaboro.com')), H(cj)]).then(function (h) {
      var want = btoa(String.fromCharCode.apply(null, h[0])).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      if (cd.type !== 'webauthn.get' || cd.challenge !== want) return { ok: false, why: 'challenge is not this photo' };
      if (cd.origin !== 'https://kolaboro.com' || !eq(ad.slice(0, 32), h[1])) return { ok: false, why: 'wrong origin or relying party' };
      if (!(ad[32] & 1) || !(ad[32] & 4)) return { ok: false, why: 'user not verified' };
      var signed = cat(ad, h[2]), alg = pk.alg === -7 ? [{ name: 'ECDSA', namedCurve: 'P-256' }, { name: 'ECDSA', hash: 'SHA-256' }, derRaw(sig, 32)] : pk.alg === -8 ? [{ name: 'Ed25519' }, { name: 'Ed25519' }, sig] : [{ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, 'RSASSA-PKCS1-v1_5', sig];
      return C.subtle.importKey('spki', b64(pk.spki), alg[0], false, ['verify']).then(function (k) { return C.subtle.verify(alg[1], k, alg[2], signed); }).then(function (ok) { return ok ? { ok: true } : { ok: false, why: 'signature does not verify' }; });
    }).catch(function () { return { ok: false, why: 'malformed' }; });
  }
  var KV = { version: '1.2.0', verifyPhotoSignature: verifyPhotoSignature, verifyInclusion: verifyInclusion, verifyConsistency: verifyConsistency, verifyCheckpoint: verifyCheckpoint, verifySignature: verifySignature, sha256Hex: sha256Hex, verifyProof: verifyProof, canonical: canonical, headHash: headHash, verifyLog: verifyLog, verifyEvidenceLines: verifyEvidenceLines };
  if (typeof module !== 'undefined' && module.exports) module.exports = KV; else root.KV = KV;
})(typeof self !== 'undefined' ? self : this);
