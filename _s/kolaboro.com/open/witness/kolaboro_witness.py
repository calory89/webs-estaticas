#!/usr/bin/env python3
"""kolaboro_witness.py 1.0 (4 Nov 2026), MIT licence. An independent witness for Kolaboro's public log (kolaboro.com/log).

A witness keeps the last checkpoint it saw. Each run it downloads the new checkpoint, checks Kolaboro's signature on it, checks
with an RFC 9162 consistency proof that the new tree only appended to the one it saw before, and only then cosigns it with its
own Ed25519 key (C2SP tlog-cosignature, cosignature/v1). If Kolaboro ever rewrote or forked its log, the check fails, the
witness refuses to sign and the run fails: that failure is the alarm. Python 3.8+, standard library only (the 'cryptography'
package is used if installed, otherwise the RFC 8032 reference algorithm below). Copy this file into your own repository,
read it, and pin it: a witness should not run code fetched from the log it watches.

  python3 kolaboro_witness.py keygen witness.key          # new key: writes the private seed to witness.key (mode 600),
                                                          # prints only the public key. Store the file content as a secret.
  KB_WITNESS_KEY=$(cat witness.key) python3 kolaboro_witness.py run --name github.com/you/kolaboro-witness \\
      --state witness-state.json --submit                 # verify, cosign, submit to kolaboro.com, update the state file
  python3 kolaboro_witness.py selftest                    # sign/verify test vector (RFC 8032 test 1) and a cosignature round trip

Cosignature line format (C2SP tlog-cosignature, Ed25519, key ID byte 0x04):
  "— " + name + " " + base64( SHA-256(name + "\\n" + 0x04 + public_key)[:4] || timestamp (8 bytes, big-endian) || signature )
  signature = Ed25519( "cosignature/v1\\ntime <timestamp>\\n" + checkpoint body (origin, size, root hash, extension lines) )
"""
import base64, hashlib, json, os, sys, time, urllib.request

LOG = 'https://kolaboro.com'
ORIGIN = 'kolaboro.com/log'
LOG_PUBLIC_KEY = 'rnY6UvDI+L6e8j3a+UPwmddQJFapkfmEXWwHuXzdmzw='   # https://kolaboro.com/.well-known/kolaboro-keys.json
H = lambda b: hashlib.sha256(b).digest()

# ---------- Ed25519 (RFC 8032), used only if 'cryptography' is missing ----------
_p = 2**255 - 19; _L = 2**252 + 27742317777372353535851937790883648493
_d = -121665 * pow(121666, _p - 2, _p) % _p; _I = pow(2, (_p - 1) // 4, _p)
def _inv(x): return pow(x, _p - 2, _p)
def _xr(y):
    x2 = (y * y - 1) * _inv(_d * y * y + 1); x = pow(x2, (_p + 3) // 8, _p)
    if (x * x - x2) % _p: x = x * _I % _p
    if (x * x - x2) % _p: raise ValueError('not a point')
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
def _enc(P):
    zi = _inv(P[2]); x = P[0] * zi % _p; y = P[1] * zi % _p
    return (y | ((x & 1) << 255)).to_bytes(32, 'little')
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
def _secret(seed):
    h = hashlib.sha512(seed).digest(); a = int.from_bytes(h[:32], 'little')
    a &= (1 << 254) - 8; a |= 1 << 254
    return a, h[32:]
def ed25519_public(seed):
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
        from cryptography.hazmat.primitives import serialization
        return Ed25519PrivateKey.from_private_bytes(seed).public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    except ImportError: pass
    return _enc(_mul(_secret(seed)[0], _B))
def ed25519_sign(seed, msg):
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
        return Ed25519PrivateKey.from_private_bytes(seed).sign(msg)
    except ImportError: pass
    a, prefix = _secret(seed); A = _enc(_mul(a, _B))
    r = int.from_bytes(hashlib.sha512(prefix + msg).digest(), 'little') % _L; R = _enc(_mul(r, _B))
    k = int.from_bytes(hashlib.sha512(R + A + msg).digest(), 'little') % _L
    return R + ((r + k * a) % _L).to_bytes(32, 'little')
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

# ---------- log checks (same as kolaboro_verify.py) ----------
def node(l, r): return H(b'\x01' + l + r)
def verify_consistency(m, n, r1, r2, proof):   # RFC 9162 section 2.1.4.2; roots and proof as bytes
    p = list(proof)
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
def parse_checkpoint(note):
    """Returns (body, origin, size, root_bytes, log_signature_ok)."""
    body, sep, sigs = note.partition('\n\n')
    if not sep: raise ValueError('not a signed note')
    body += '\n'; lines = body.split('\n')
    origin, size, root = lines[0], int(lines[1]), base64.b64decode(lines[2], validate=True)
    if origin != ORIGIN or len(root) != 32 or size < 1: raise ValueError('unexpected checkpoint')
    pub = base64.b64decode(LOG_PUBLIC_KEY); kh = H((origin + '\n').encode() + b'\x01' + pub)[:4]; ok = False
    for l in sigs.split('\n'):
        if l.startswith('— ' + origin + ' '):
            blob = base64.b64decode(l.split(' ')[-1])
            if len(blob) == 68 and blob[:4] == kh and ed25519_verify(pub, body.encode(), blob[4:]): ok = True
    return body, origin, size, root, ok

# ---------- cosignature (C2SP tlog-cosignature, Ed25519) ----------
def key_hash(name, pub): return H(name.encode() + b'\n' + b'\x04' + pub)[:4]
def cosign(seed, name, body, ts=None):
    ts = int(time.time()) if ts is None else int(ts)
    sig = ed25519_sign(seed, ('cosignature/v1\ntime %d\n' % ts).encode() + body.encode())
    return '— %s %s' % (name, base64.b64encode(key_hash(name, ed25519_public(seed)) + ts.to_bytes(8, 'big') + sig).decode()), ts
def verify_cosignature(line, body, pub):
    try:
        name, blob = line[2:].rsplit(' ', 1); blob = base64.b64decode(blob, validate=True)
        if not line.startswith('— ') or len(blob) != 76 or blob[:4] != key_hash(name, pub): return False
        ts = int.from_bytes(blob[4:12], 'big')
        return ed25519_verify(pub, ('cosignature/v1\ntime %d\n' % ts).encode() + body.encode(), blob[12:])
    except Exception: return False

def get(path):
    r = urllib.request.urlopen(urllib.request.Request(LOG + path, headers={'user-agent': 'kolaboro-witness/1.0'}), timeout=30)
    return r.read().decode()
def github_oidc():   # only for Kolaboro's own witness: proves the run is our workflow (names under kolaboro.com/ are reserved)
    u = os.environ.get('ACTIONS_ID_TOKEN_REQUEST_URL')
    if not u: return None
    r = urllib.request.urlopen(urllib.request.Request(u + '&audience=kolaboro.com', headers={'Authorization': 'Bearer ' + os.environ['ACTIONS_ID_TOKEN_REQUEST_TOKEN']}), timeout=15)
    return json.load(r)['value']
def post(path, obj, oidc=False):
    hd = {'content-type': 'application/json', 'user-agent': 'kolaboro-witness/1.0'}
    tok = github_oidc() if oidc else None
    if tok: hd['authorization'] = 'Bearer ' + tok
    req = urllib.request.Request(LOG + path, data=json.dumps(obj).encode(), method='POST', headers=hd)
    try: r = urllib.request.urlopen(req, timeout=30); return r.status, json.loads(r.read() or b'{}')
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read() or b'{}')
        except Exception: return e.code, {}

def seed_from_env():
    raw = os.environ.get('KB_WITNESS_KEY', '').strip()
    if not raw: return None
    s = base64.b64decode(raw)
    if len(s) != 32: raise SystemExit('KB_WITNESS_KEY must be the base64 of a 32-byte Ed25519 seed (made by: keygen)')
    return s

def run(name, state_path, submit, contact, oidc=False):
    out = {'witness': name, 'log': ORIGIN}
    seed = seed_from_env()
    if seed is None: out['skipped'] = 'KB_WITNESS_KEY is not set: nothing was signed'; return out, 0
    pub = ed25519_public(seed); out['public_key'] = base64.b64encode(pub).decode()
    note = get('/api/open/checkpoint')
    body, origin, size, root, sig_ok = parse_checkpoint(note)
    out.update({'tree_size': size, 'root_hash': base64.b64encode(root).decode(), 'log_signature_ok': sig_ok})
    if not sig_ok: out['refused'] = 'checkpoint signature does not verify with the published log key'; return out, 2
    st = {}
    if state_path and os.path.exists(state_path):
        with open(state_path) as f: st = json.load(f)
    if st.get('tree_size'):
        m, r1 = int(st['tree_size']), base64.b64decode(st['root_hash'])
        out['previous'] = {'tree_size': m, 'root_hash': st['root_hash'], 'seen_at': st.get('seen_at')}
        if size < m: out['refused'] = 'the log shrank from %d to %d entries' % (m, size); return out, 3
        if size == m: cons = root == r1
        else:
            c = json.loads(get('/api/open/log-consistency?first=%d&second=%d' % (m, size)))
            cons = c.get('second') == size and verify_consistency(m, size, r1, root, [bytes.fromhex(x) for x in c.get('proof', [])])
        out['consistent_with_previous'] = cons
        if not cons: out['refused'] = 'the new tree is not an append-only extension of the one this witness saw before'; return out, 4
    else: out['previous'] = None; out['note'] = 'first run: no earlier checkpoint to compare (trust on first use)'
    line, ts = cosign(seed, name, body)
    assert verify_cosignature(line, body, pub)
    out.update({'cosignature': line, 'time': ts})
    if submit:
        code, resp = post('/api/x/o/witness', {'checkpoint': body, 'cosignature': line, 'public_key': out['public_key'], 'contact': contact}, oidc)
        out['submitted'] = {'http': code, 'answer': resp}
    if state_path:
        with open(state_path, 'w') as f: json.dump({'tree_size': size, 'root_hash': out['root_hash'], 'seen_at': ts, 'cosignature': line}, f, indent=1)
    return out, 0

def selftest():
    sk = bytes.fromhex('9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60')
    pk = bytes.fromhex('d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a')
    sg = bytes.fromhex('e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b')
    r = {'rfc8032_public': ed25519_public(sk) == pk, 'rfc8032_sign': ed25519_sign(sk, b'') == sg, 'rfc8032_verify': ed25519_verify(pk, b'', sg)}
    body = 'example.com/log\n5\n' + base64.b64encode(H(b'x')).decode() + '\n'
    line, ts = cosign(sk, 'example.com/witness', body, 1679315147)
    r['cosign_roundtrip'] = verify_cosignature(line, body, pk)
    r['cosign_tamper_rejected'] = not verify_cosignature(line, body.replace('\n5\n', '\n6\n'), pk)
    r['consistency_trivial'] = verify_consistency(1, 1, H(b'a'), H(b'a'), [])
    return r

if __name__ == '__main__':
    a = sys.argv[1:]
    cmd = a[0] if a else 'help'
    if cmd == 'keygen':
        path = a[1] if len(a) > 1 else 'witness.key'
        if os.path.exists(path): raise SystemExit(path + ' exists: refusing to overwrite a key')
        seed = os.urandom(32); fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, 'w') as f: f.write(base64.b64encode(seed).decode() + '\n')
        print(json.dumps({'private_seed_written_to': path, 'public_key': base64.b64encode(ed25519_public(seed)).decode()}, indent=1))
    elif cmd == 'pubkey':
        s = seed_from_env(); print(base64.b64encode(ed25519_public(s)).decode() if s else 'KB_WITNESS_KEY is not set')
    elif cmd == 'run':
        opt = lambda k, d=None: a[a.index(k) + 1] if k in a and a.index(k) + 1 < len(a) else d
        name = opt('--name')
        if not name or ' ' in name or '+' in name or len(name) > 120: raise SystemExit('--name is required: a schema-less URL you control, e.g. github.com/you/kolaboro-witness')
        res, code = run(name, opt('--state'), '--submit' in a, opt('--contact'), '--github-oidc' in a)
        print(json.dumps(res, indent=1)); sys.exit(code)
    elif cmd == 'selftest':
        r = selftest(); print(json.dumps(r, indent=1)); sys.exit(0 if all(r.values()) else 1)
    else: print(__doc__)
