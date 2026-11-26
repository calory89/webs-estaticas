"""Builds kolaboro-<version>-py3-none-any.whl with the standard library only (deterministic: fixed file times and order).
A wheel is a zip of the package plus a .dist-info folder (PEP 427, PEP 376 RECORD, core metadata 2.1)."""
import base64, hashlib, os, sys, zipfile

V = '0.1.0'
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else '.'
DI = 'kolaboro-%s.dist-info/' % V
readme = open(os.path.join(HERE, 'README.md'), encoding='utf-8').read()
meta = '\n'.join([
    'Metadata-Version: 2.1', 'Name: kolaboro', 'Version: ' + V,
    'Summary: Official client for the Kolaboro open data API (off-plan property due diligence), with built-in Ed25519 signature verification',
    'Home-page: https://kolaboro.com/docs/sdk/', 'Author: Kolaboro', 'License: MIT', 'Requires-Python: >=3.8',
    'Classifier: Programming Language :: Python :: 3', 'Classifier: License :: OSI Approved :: MIT License', 'Classifier: Typing :: Typed',
    'Provides-Extra: fast', "Requires-Dist: cryptography>=41; extra == 'fast'",
    'Description-Content-Type: text/markdown', '', readme])
files = []
for n in sorted(os.listdir(os.path.join(HERE, 'kolaboro'))):
    if n.endswith('.py') or n == 'py.typed':
        files.append(('kolaboro/' + n, open(os.path.join(HERE, 'kolaboro', n), 'rb').read()))
files += [(DI + 'METADATA', meta.encode()), (DI + 'WHEEL', b'Wheel-Version: 1.0\nGenerator: kolaboro make_wheel.py\nRoot-Is-Purelib: true\nTag: py3-none-any\n'),
          (DI + 'top_level.txt', b'kolaboro\n')]
rec = ''.join('%s,sha256=%s,%d\n' % (n, base64.urlsafe_b64encode(hashlib.sha256(b).digest()).rstrip(b'=').decode(), len(b)) for n, b in files) + DI + 'RECORD,,\n'
files.append((DI + 'RECORD', rec.encode()))
path = os.path.join(OUT, 'kolaboro-%s-py3-none-any.whl' % V)
with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
    for n, b in files:
        zi = zipfile.ZipInfo(n, (2026, 11, 3, 0, 0, 0)); zi.external_attr = 0o644 << 16; zi.compress_type = zipfile.ZIP_DEFLATED
        z.writestr(zi, b)
print(path)
