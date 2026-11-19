#!/usr/bin/env python3
"""kolaboro_offline_verify.py 1.0 (19 Nov 2026), MIT licence. Checks Kolaboro's published records OFFLINE, from files you saved.
Python 3.8+, standard library only (Ed25519 per RFC 8032 is implemented below; the 'cryptography' package is used if present).
Same checks and answers as kolaboro-offline-verify.mjs. Exit code 0 = every check passed. Docs: https://kolaboro.com/verify/offline/

  python3 kolaboro_offline_verify.py chain index.json [copy.json.gz ...]   snapshot hash chain + saved daily copies
  python3 kolaboro_offline_verify.py cert cert.json                       project certificate (facts hash, signature)
  python3 kolaboro_offline_verify.py sig body.json <x-kolaboro-signature>  any signed API answer, exact bytes as saved
  python3 kolaboro_offline_verify.py provenance prov.json                 build attestation from /api/v1/provenance
  python3 kolaboro_offline_verify.py selftest                             built-in vectors (one must fail)
"""
import base64, gzip, hashlib, json, os, sys

PUBLIC_KEY = 'rnY6UvDI+L6e8j3a+UPwmddQJFapkfmEXWwHuXzdmzw='   # kid kb-f2e04da5878f8c51; also at https://kolaboro.com/.well-known/kolaboro-keys.json
H = lambda b: hashlib.sha256(b).digest()
hx = lambda b: hashlib.sha256(b).hexdigest()

# ---------- Ed25519 (RFC 8032 section 5.1.7), used only if 'cryptography' is missing ----------
_p = 2**255 - 19; _L = 2**252 + 27742317777372353535851937790883648493
_d = -121665 * pow(121666, _p - 2, _p) % _p; _I = pow(2, (_p - 1) // 4, _p)
def _inv(x): return pow(x, _p - 2, _p)
def _xr(y):
    x2 = (y * y - 1) * _inv(_d * y * y + 1); x = pow(x2, (_p + 3) // 8, _p)
    if (x * x - x2) % _p: x = x * _I % _p
    if (x * x - x2) % _p: raise ValueError
    return x
def _add(P, Q):
    (X1, Y1, Z1, T1), (X2, Y2, Z2, T2) = P, Q
    A = (Y1 - X1) * (Y2 - X2) % _p; B = (Y1 + X1) * (Y2 + X2) % _p; C = 2 * T1 * T2 * _d % _p; D = 2 * Z1 * Z2 % _p
    E, F, G, Hh = B - A, D - C, D + C, B + A
    return (E * F % _p, G * Hh % _p, F * G % _p, E * Hh % _p)
def _mul(s, P):
    Q = (0, 1, 1, 0)
    while s:
        if s & 1: Q = _add(Q, P)
        P = _add(P, P); s >>= 1
    return Q
def _dec(b):
    y = int.from_bytes(b, 'little'); sign = y >> 255; y &= (1 << 255) - 1
    if y >= _p: raise ValueError
    x = _xr(y)
    if x & 1 != sign: x = _p - x
    if x == 0 and sign: raise ValueError
    return (x, y, 1, x * y % _p)
def _eq(P, Q): return (P[0] * Q[2] - Q[0] * P[2]) % _p == 0 and (P[1] * Q[2] - Q[1] * P[2]) % _p == 0
_By = 4 * _inv(5) % _p; _B = (_xr(_By), _By, 1, _xr(_By) * _By % _p)
if _B[0] & 1: _B = (_p - _B[0], _By, 1, (_p - _B[0]) * _By % _p)
def ed25519_verify(pub, msg, sig):
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
        try: Ed25519PublicKey.from_public_bytes(pub).verify(sig, msg); return True
        except Exception: return False
    except ImportError: pass
    try:
        if len(sig) != 64: return False
        A = _dec(pub); R = _dec(sig[:32]); s = int.from_bytes(sig[32:], 'little')
        if s >= _L: return False
        h = int.from_bytes(hashlib.sha512(sig[:32] + pub + msg).digest(), 'little') % _L
        return _eq(_mul(s, _B), _add(R, _mul(h, A)))
    except Exception: return False

ok_all = True
def say(ok, text):
    global ok_all
    ok_all = ok_all and bool(ok)
    print(('OK      ' if ok else 'FAILED  ') + text)
    return ok
def canon(v):   # same as the site: keys sorted, no spaces, JSON escaping as JavaScript's JSON.stringify
    return json.dumps(v, sort_keys=True, separators=(',', ':'), ensure_ascii=False)
def sig_ok(digest_hex, sig_b64, pub_b64=PUBLIC_KEY):
    try: return ed25519_verify(base64.b64decode(pub_b64), ('kolaboro-sig-v1\n' + digest_hex).encode(), base64.b64decode(sig_b64))
    except Exception: return False

def cmd_chain(index_path, copies):
    idx = json.load(open(index_path, encoding='utf-8')); E = idx.get('entries') or []; prev = 'genesis'; by_sha = {}
    say(bool(E), '%s: %d entries' % (os.path.basename(index_path), len(E)))
    for e in E:
        msg = 'kolaboro-snapshot-v1|%s|%s|%s|%s|%s' % (e['day'], idx.get('file', '/data/named.json'), e['sha256'], e['bytes'], prev)
        h = hx(msg.encode())
        say(e.get('prev') == prev and h == e['head'], 'head %s %s' % (e['day'], h[:16]))
        prev = e['head']; by_sha[e['sha256']] = e
    if idx.get('tip'): say(idx['tip'] == prev, 'tip %s matches the last head' % prev[:16])
    for c in copies:
        raw = open(c, 'rb').read()
        if raw[:2] == b'\x1f\x8b': raw = gzip.decompress(raw)
        e = by_sha.get(hx(raw))
        say(bool(e) and e['bytes'] == len(raw), '%s: SHA-256 %s, %d bytes%s' % (os.path.basename(c), hx(raw)[:16], len(raw), ', day ' + e['day'] if e else ', not in the chain'))

def cmd_cert(path):
    d = json.load(open(path, encoding='utf-8')); c = d['certificate']; g = d.get('signature') or {}
    say(hx(canon(c['facts']).encode()) == c['facts_sha256'], 'facts hash %s' % c['facts_sha256'][:16])
    ch = hx(canon(c).encode())
    say(g.get('certificate_sha256') in (None, ch), 'certificate hash %s' % ch[:16])
    if g.get('alg') == 'Ed25519': say(sig_ok(ch, g['value']), 'Ed25519 signature (key %s) on %s' % (g.get('kid'), c['subject'].get('slug')))
    else: say(False, 'no Ed25519 signature in the file (hash only)')

def cmd_sig(path, sig):
    raw = open(path, 'rb').read(); say(sig_ok(hx(raw), sig.strip()), 'Ed25519 signature over SHA-256 %s of %s (%d bytes)' % (hx(raw)[:16], os.path.basename(path), len(raw)))

def cmd_prov(path):
    d = json.load(open(path, encoding='utf-8')); a = d['attestation']; g = d.get('signature') or {}
    h = hx(canon(a).encode()); say(g.get('attestation_sha256') in (None, h), 'attestation hash %s' % h[:16])
    print('        commit %s, dataset %s, worker tree %s' % (a.get('commit'), (a.get('dataset') or {}).get('sha256'), a.get('worker_tree')))
    if g.get('alg') == 'Ed25519': say(sig_ok(h, g['value']), 'Ed25519 signature (key %s)' % g.get('kid'))
    else: say(False, 'no Ed25519 signature in the file')

# a real signature made by the site key: header of GET /api/v1/snapshots on 19 Nov 2026 and the SHA-256 of that body
VEC = ('03f5a5f80c7895ab9f14e43605056419e01cfea6d3cb1243517f7648e9bcbd62', 'PiEDZ4cOEzrHb/AjJ6iBwML3hkk4CcODOcHdhd9rmr59bckrMxOzn6prwEk54SfxyMCYT6/7FnqjIAZo/NPOCg==')
def cmd_selftest():
    say(hx(b'abc') == 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', 'SHA-256 test vector')
    say(sig_ok(*VEC), 'Ed25519: real signature verifies')
    bad = VEC[0][:-1] + ('0' if VEC[0][-1] != '0' else '1')
    r = sig_ok(bad, VEC[1]); say(not r, 'Ed25519: one changed character is rejected')
    say(canon({'b': 1, 'a': [1, 'é', None]}) == '{"a":[1,"é",null],"b":1}', 'canonical JSON')

def main(a):
    if not a or a[0] not in ('chain', 'cert', 'sig', 'provenance', 'selftest'): print(__doc__); return 2
    c = a[0]
    if c == 'chain': cmd_chain(a[1], a[2:])
    elif c == 'cert': cmd_cert(a[1])
    elif c == 'sig': cmd_sig(a[1], a[2])
    elif c == 'provenance': cmd_prov(a[1])
    else: cmd_selftest()
    print('ALL CHECKS PASSED' if ok_all else 'SOME CHECKS FAILED'); return 0 if ok_all else 1

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
