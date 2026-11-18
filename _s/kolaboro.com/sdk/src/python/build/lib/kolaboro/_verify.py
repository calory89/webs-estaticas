#!/usr/bin/env python3
"""kolaboro_verify.py 1.0 (3 Nov 2026), MIT licence. Independent checks of Kolaboro's public records in Python 3.8+.
No dependency: Ed25519 is verified with the 'cryptography' package if installed, otherwise with the RFC 8032 reference algorithm below.
Same checks and same answers as kolaboro-verify.js and the Go version; all three run against test-vectors.json and the live site every day.

  python3 kolaboro_verify.py vectors test-vectors.json   # check the published test vectors
  python3 kolaboro_verify.py live                        # check kolaboro.com now: signatures, log chain, checkpoint, proofs
"""
import base64, hashlib, json, sys, urllib.request

PUBLIC_KEY = 'rnY6UvDI+L6e8j3a+UPwmddQJFapkfmEXWwHuXzdmzw='   # also at https://kolaboro.com/.well-known/kolaboro-keys.json
H = lambda b: hashlib.sha256(b).digest()

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

# ---------- the checks ----------
def leaf(line): return H(b'\x00' + line.encode())
def node(l, r): return H(b'\x01' + l + r)
def verify_signature(body, sig_b64, pub_b64=PUBLIC_KEY):
    msg = ('kolaboro-sig-v1\n' + hashlib.sha256(body if isinstance(body, bytes) else body.encode()).hexdigest()).encode()
    return ed25519_verify(base64.b64decode(pub_b64), msg, base64.b64decode(sig_b64))
def verify_path(line, path, root_hex):
    c = leaf(line)
    for s in path: o = bytes.fromhex(s['hash']); c = node(o, c) if s['side'] == 'L' else node(c, o)
    return c.hex() == root_hex
def verify_proof(p): return verify_path(p['line'], p['path'], p['projects_root'])
def head_hash(h):
    canon = '|'.join(str(x) for x in ['kolaboro-log-v1', h['day'], h['dataset_sha256'], h['projects_root'], h['projects_count'], h.get('evidence_root') or '', h.get('evidence_items') or 0, h.get('audit_head') or '', h.get('audit_count') or 0, h.get('prev') or 'genesis'])
    return hashlib.sha256(canon.encode()).hexdigest()
def verify_log(heads):
    L = sorted(heads, key=lambda h: h['day']); errors = []
    for i, h in enumerate(L):
        if head_hash(h) != h['head']: errors.append(h['day'] + ': head does not recompute')
        if i == 0 and h.get('prev'): errors.append(h['day'] + ': first head has a previous head')
        if i > 0 and h.get('prev') != L[i - 1]['head']: errors.append(h['day'] + ': link to previous head broken')
    return not errors, errors
def verify_consistency(m, n, r1_hex, r2_hex, proof_hex):   # RFC 9162 section 2.1.4.2
    r1, r2, p = bytes.fromhex(r1_hex), bytes.fromhex(r2_hex), [bytes.fromhex(x) for x in proof_hex]
    if not 1 <= m <= n: return False
    if m == n: return not p and r1 == r2
    if not p: return False
    if m & (m - 1) == 0: p = [r1] + p
    fn, sn = m - 1, n - 1
    while fn & 1: fn >>= 1; sn >>= 1
    fr = sr = p[0]
    for c in p[1:]:
        if sn == 0: return False
        if fn & 1 or fn == sn:
            fr, sr = node(c, fr), node(c, sr)
            while not fn & 1 and fn: fn >>= 1; sn >>= 1
        else: sr = node(sr, c)
        fn >>= 1; sn >>= 1
    return sn == 0 and fr == r1 and sr == r2
def verify_checkpoint(note, pub_b64=PUBLIC_KEY):
    body, _, sigs = note.partition('\n\n'); body += '\n'
    lines = body.split('\n'); origin, size, root = lines[0], int(lines[1]), base64.b64decode(lines[2]).hex()
    pub = base64.b64decode(pub_b64); kh = H((origin + '\n').encode() + b'\x01' + pub)[:4]
    for l in sigs.split('\n'):
        if l.startswith('— ' + origin + ' '):
            blob = base64.b64decode(l.split(' ')[-1])
            if len(blob) == 68 and blob[:4] == kh and ed25519_verify(pub, body.encode(), blob[4:]): return True, origin, size, root
    return False, origin, size, root

def get(path):
    r = urllib.request.urlopen(urllib.request.Request('https://kolaboro.com' + path, headers={'user-agent': 'kolaboro-verify-python/1.0'}), timeout=30)
    return r.read(), r.headers

def run_vectors(path):
    V = json.load(open(path)); out = {}
    p = dict(V['proof']); p.setdefault('projects_root', sorted(V['log_heads'], key=lambda h: h['day'])[0]['projects_root'])
    out['proof'] = verify_proof(p)
    out['log'] = verify_log(V['log_heads'])[0]
    s = V['signature']; out['signature'] = verify_signature(s['body'], s['signature'], s.get('public_key_raw_b64', PUBLIC_KEY))
    if 'checkpoint' in V: out['checkpoint'] = verify_checkpoint(V['checkpoint']['note'])[0]
    if 'log_inclusion' in V: L = V['log_inclusion']; out['inclusion'] = verify_path(L['leaf'], L['path'], L['root_hash'])
    if 'log_consistency' in V: C = V['log_consistency']; out['consistency'] = verify_consistency(C['first'], C['second'], C['first_root'], C['second_root'], C['proof'])
    out['tamper_rejected'] = not verify_signature(s['body'] + ' ', s['signature'])
    return out

def run_live():
    out = {}
    body, hd = get('/api/open/summary'); out['summary_signed'] = verify_signature(body, hd['x-kolaboro-signature'])
    body, hd = get('/api/open/log'); out['log_signed'] = verify_signature(body, hd['x-kolaboro-signature'])
    heads = json.loads(body)['heads']; out['log_chain'], errs = verify_log(heads)
    note = get('/api/open/checkpoint')[0].decode(); ok, origin, size, root = verify_checkpoint(note); out['checkpoint_signed'] = ok
    out['checkpoint_size_matches_log'] = size == len(heads)
    inc = []
    for h in heads:
        b, _ = get('/api/open/log-proof?day=' + h['day']); L = json.loads(b); inc.append(L['root_hash'] == root and verify_path(L['leaf'], L['path'], root))
    out['every_day_included'] = all(inc)
    cons = []
    for m in range(1, size + 1):
        b, _ = get('/api/open/log-consistency?first=%d&second=%d' % (m, size)); C = json.loads(b)
        cons.append(C['second_root'] == root and verify_consistency(m, size, C['first_root'], C['second_root'], C['proof']))
    out['append_only'] = all(cons)
    return out

if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'live'
    res = run_vectors(sys.argv[2] if len(sys.argv) > 2 else 'test-vectors.json') if mode == 'vectors' else run_live()
    print(json.dumps(res, indent=1)); sys.exit(0 if all(res.values()) else 1)
