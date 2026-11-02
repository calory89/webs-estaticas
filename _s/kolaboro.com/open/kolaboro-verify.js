/*! kolaboro-verify 1.1.0 (2 Nov 2026), MIT licence. Independent checks of Kolaboro's public records, in the browser or Node 18+.
 *  No dependency, no network call of its own: you pass it what you downloaded, it tells you whether it adds up.
 *
 *  KV.verifyProof(proof)          -> true if a project's page fingerprint is inside the daily Merkle root (GET /api/open/proof/{id})
 *  KV.headHash(head)              -> recomputes one log head (GET /api/open/log)
 *  KV.verifyLog(heads)            -> { ok, checked, errors[] }: every head recomputes and links to the previous one
 *  KV.sha256Hex(textOrBytes)      -> SHA-256 of a file you downloaded (e.g. /data/bali-cases.json) to compare with dataset_sha256
 *  KV.verifyEvidenceLines(lines, root) -> true if "ID SHA256" lines hash to the evidence root recorded in the log
 *  KV.verifySignature(bodyText, signatureB64, publicKeyRawB64) -> true if Kolaboro signed this exact answer (Ed25519;
 *       headers x-kolaboro-signature / x-kolaboro-key-id; keys at https://kolaboro.com/.well-known/kolaboro-keys.json)
 *  Each log head is also timestamped in Bitcoin: GET https://kolaboro.com/api/kb/stamp?hash=HEAD returns the OpenTimestamps proof,
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
  var KV = { version: '1.1.0', verifySignature: verifySignature, sha256Hex: sha256Hex, verifyProof: verifyProof, canonical: canonical, headHash: headHash, verifyLog: verifyLog, verifyEvidenceLines: verifyEvidenceLines };
  if (typeof module !== 'undefined' && module.exports) module.exports = KV; else root.KV = KV;
})(typeof self !== 'undefined' ? self : this);
