#!/usr/bin/env python3
"""Kolaboro API v1: OpenAPI paths and typed SDK generator (n34c, 21 Nov 2026). Python 3.8+, standard library only. MIT licence.

  sdk-gen.py spec    fetch one example answer of every v1 endpoint, infer its JSON schema (2 levels) and write
                     /docs/api/openapi-v1-paths.json (merged into /api/v1/openapi.json by the worker)
  sdk-gen.py gen     generate from that spec: /sdk/v1/kolaboro-v1.mjs (ES module, browsers, Node 18+, Deno, Workers),
                     /sdk/v1/kolaboro-v1.d.ts (TypeScript types), /sdk/v1/kolaboro_v1.py (Python 3.8+, no packages),
                     their tests (/sdk/v1/test-v1.mjs, /sdk/v1/test_v1.py), manifest.json and SHA256SUMS
  sdk-gen.py test    run both test files against the live API and record the result in /sdk/v1/tests.json
Run from the root of a checkout of pub/_lovable. Nothing in the clients is written by hand: change the spec, run gen.
"""
import base64, datetime, hashlib, json, os, re, subprocess, sys, urllib.request
BASE = 'https://kolaboro.com'; SITE = '_s/kolaboro.com'; OUT = SITE + '/sdk/v1'; VERSION = '1.0.0'
now = lambda: datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0, tzinfo=None).isoformat() + 'Z'
S = lambda d: {'type': 'string', 'description': d}
# operationId, path, summary, parameters [(name, in, schema, required, description)], example arguments
OPS = [
 ('listProjects', '/api/v1/projects', 'Every named project with its key facts (stable slug and id).', [], {}),
 ('getProject', '/api/v1/projects/{slug}', 'One named project: facts, sources, checks, dates.', [('slug', 'path', S('Page slug, e.g. amani-melasti'), True)], {'slug': 'amani-melasti'}),
 ('getCertificate', '/api/v1/projects/{slug}/certificate', 'Verification certificate: canonical facts, their SHA-256 and the Ed25519 signature.', [('slug', 'path', S('Page slug'), True)], {'slug': 'amani-melasti'}),
 ('listDevelopers', '/api/v1/developers', 'Every developer with its projects.', [], {}),
 ('getDeveloper', '/api/v1/developers/{slug}', 'One developer and its projects.', [('slug', 'path', S('Developer slug, e.g. teus-group'), True)], {'slug': 'teus-group'}),
 ('getDeveloperWebsite', '/api/v1/developers/{slug}/website', 'Website forensics of a developer: reachability, TLS, domain registration.', [('slug', 'path', S('Developer slug'), True)], {'slug': 'teus-group'}),
 ('find', '/api/v1/find', 'Free-text search in 8 languages over project names, developers and places.', [('q', 'query', S('Query, e.g. "damac lagoons" or "proyectos en Dubái"'), True), ('lang', 'query', {'type': 'string', 'enum': ['en', 'es', 'de', 'fr', 'nl', 'ru', 'zh', 'ar']}, False)], {'q': 'dubai'}),
 ('listChanges', '/api/v1/changes', 'Changes since a date, for incremental sync.', [('since', 'query', S('YYYY-MM-DD'), False)], {'since': '2026-11-20'}),
 ('changesFeed', '/api/v1/changes/feed.json', 'The same changes as a JSON Feed 1.1.', [], {}),
 ('getSnapshots', '/api/v1/snapshots', 'The daily snapshot hash chain of /data/named.json.', [], {}),
 ('getDataQuality', '/api/v1/data-quality', 'Coverage and freshness of every field, by market.', [], {}),
 ('getSlippage', '/api/v1/slippage', 'Handover slippage statistics per market (historical, with sample sizes).', [], {}),
 ('getHandoverHistory', '/api/v1/handover-history/{slug}', 'Every handover date on record for a project, with sources.', [('slug', 'path', S('Page slug'), True)], {'slug': 'amani-melasti'}),
 ('getProvenance', '/api/v1/provenance', 'Signed build attestation: commit, dataset hash, worker tree.', [], {}),
 ('listDeltas', '/api/v1/delta', 'Index of the signed daily delta files.', [], {}),
 ('getDelta', '/api/v1/delta/{day}', 'One daily delta file (exact bytes, signed in x-kolaboro-signature).', [('day', 'path', S('YYYY-MM-DD'), True)], {'day': '2026-11-20'}),
 ('getDeltaSignature', '/api/v1/delta/{day}.sig', 'The Ed25519 signature of one delta file as JSON.', [('day', 'path', S('YYYY-MM-DD'), True)], {'day': '2026-11-20'}),
 ('getTreeHead', '/api/v1/tlog', 'Signed tree head and entries of the transparency log.', [], {}),
 ('getInclusionProof', '/api/v1/tlog/proof', 'Merkle inclusion proof of one project record.', [('project', 'query', S('Page slug'), True), ('day', 'query', S('YYYY-MM-DD'), False)], {'project': 'amani-melasti'}),
 ('getConsistencyProof', '/api/v1/tlog/consistency', 'Merkle consistency proof between two log sizes (append-only).', [('first', 'query', {'type': 'integer'}, True), ('second', 'query', {'type': 'integer'}, False)], {'first': 1}),
 ('getMarketChart', '/api/v1/charts/{market}', 'Delay and disclosure figures of a market, with ready SVG charts.', [('market', 'path', S('Market slug, e.g. dubai'), True), ('lang', 'query', {'type': 'string'}, False)], {'market': 'dubai'}),
 ('getMonitoring', '/api/v1/monitoring', 'Synthetic monitoring of the 20 key pages, 30 days.', [], {}),
]
def get(path, q):
    p = path
    for k, v in q.items():
        if '{' + k + '}' in p: p = p.replace('{' + k + '}', str(v))
    qs = '&'.join('%s=%s' % (k, urllib.request.quote(str(v))) for k, v in q.items() if '{' + k + '}' not in path)
    with urllib.request.urlopen(urllib.request.Request(BASE + p + ('?' + qs if qs else ''), headers={'user-agent': 'kolaboro-sdk-gen/1.0'}), timeout=60) as r: return json.load(r)
def infer(v, depth=0):
    if isinstance(v, bool): return {'type': 'boolean'}
    if isinstance(v, int): return {'type': 'integer'}
    if isinstance(v, float): return {'type': 'number'}
    if isinstance(v, str): return {'type': 'string'}
    if v is None: return {}
    if isinstance(v, list): return {'type': 'array', 'items': infer(v[0], depth + 1) if v and depth < 2 else {}}
    if isinstance(v, dict):
        if depth >= 2 or len(v) > 40: return {'type': 'object'}
        return {'type': 'object', 'properties': {k: infer(x, depth + 1) for k, x in v.items()}, 'required': sorted(k for k, x in v.items() if x is not None)}
    return {}
def cname(op): return op[0][0].upper() + op[0][1:] + 'Response'

def spec():
    paths, schemas = {}, {}
    for op in OPS:
        oid, path, summ, params, ex = op
        try: schemas[cname(op)] = infer(get(path, ex)); ok = True
        except Exception as e: print('example failed', path, e); schemas[cname(op)] = {'type': 'object'}; ok = False
        paths[path] = {'get': {'operationId': oid, 'summary': summ, 'parameters': [{'name': n, 'in': i, 'required': r, 'schema': s} for (n, i, s, r) in params],
                               'responses': {'200': {'description': 'OK. Signed: x-kolaboro-signature (Ed25519 over "kolaboro-sig-v1\\n" + SHA-256 hex of the body).', 'content': {'application/json': {'schema': {'$ref': '#/components/schemas/' + cname(op)}}}}},
                               'x-example': ex}}
        print('%-24s %s' % (oid, 'ok' if ok else 'FAILED'))
    d = {'type': 'kolaboro-openapi-v1-paths', 'built': now(), 'note': 'Response schemas inferred from one live answer per endpoint (two levels deep) by /open/sdk-gen.py spec.', 'paths': paths, 'schemas': schemas}
    json.dump(d, open(SITE + '/docs/api/openapi-v1-paths.json', 'w'), indent=1, ensure_ascii=False)

def ts_type(s, ind=''):
    t = s.get('type')
    if t == 'string': return 'string'
    if t in ('integer', 'number'): return 'number'
    if t == 'boolean': return 'boolean'
    if t == 'array': return 'Array<' + (ts_type(s.get('items') or {}, ind) if s.get('items') else 'unknown') + '>'
    if t == 'object' and s.get('properties'):
        req = set(s.get('required') or [])
        return '{\n' + ''.join(ind + '  ' + json.dumps(k) + ('' if k in req else '?') + ': ' + ts_type(v, ind + '  ') + ';\n' for k, v in s['properties'].items()) + ind + '}'
    if t == 'object': return 'Record<string, unknown>'
    return 'unknown'
def gen():
    d = json.load(open(SITE + '/docs/api/openapi-v1-paths.json')); os.makedirs(OUT, exist_ok=True)
    ops = [(p, v['get']) for p, v in d['paths'].items()]
    hdr = 'Generated by https://kolaboro.com/open/sdk-gen.py from https://kolaboro.com/api/v1/openapi.json (%s). Do not edit by hand. MIT licence; data CC BY 4.0, credit Kolaboro.' % d['built'][:10]
    # ---- JavaScript
    js = ['/*! kolaboro-v1 %s | %s */' % (VERSION, hdr), "const KEYS_URL = 'https://kolaboro.com/.well-known/kolaboro-keys.json';",
          'export class KolaboroError extends Error { constructor(status, body) { super("Kolaboro API " + status); this.status = status; this.body = body; } }',
          'export class KolaboroV1 {',
          '  constructor(o = {}) { this.base = (o.base || "https://kolaboro.com").replace(/\\/$/, ""); this.fetch = o.fetch || globalThis.fetch.bind(globalThis); this.verify = !!o.verify; this.last = null; this._etag = new Map(); this._keys = null; }',
          '  async _keysGet() { if (!this._keys) { const r = await this.fetch(KEYS_URL); this._keys = (await r.json()).keys || []; } return this._keys; }',
          '  async _check(text, sig, kid) {',
          '    if (!sig) return { checked: true, ok: false, reason: "no signature header" };',
          '    const keys = await this._keysGet(), k = keys.find(x => x.kid === kid) || keys[0]; if (!k) return { checked: true, ok: false, reason: "no key" };',
          '    const enc = new TextEncoder(), h = [...new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(text)))].map(x => x.toString(16).padStart(2, "0")).join("");',
          '    const raw = Uint8Array.from(atob(k.public_key_raw_b64), c => c.charCodeAt(0)), key = await crypto.subtle.importKey("raw", raw, { name: "Ed25519" }, false, ["verify"]);',
          '    const ok = await crypto.subtle.verify({ name: "Ed25519" }, key, Uint8Array.from(atob(sig), c => c.charCodeAt(0)), enc.encode("kolaboro-sig-v1\\n" + h));',
          '    return { checked: true, ok, kid: k.kid };',
          '  }',
          '  async _get(path, query) {',
          '    const q = Object.entries(query || {}).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => encodeURIComponent(k) + "=" + encodeURIComponent(String(v))).join("&");',
          '    const url = this.base + path + (q ? "?" + q : ""), c = this._etag.get(url), h = c ? { "if-none-match": c.etag } : {};',
          '    const r = await this.fetch(url, { headers: h });',
          '    if (r.status === 304 && c) { this.last = { url, status: 304, signature: c.signature, cached: true }; return c.data; }',
          '    const text = await r.text(); let data; try { data = JSON.parse(text); } catch (e) { data = text; }',
          '    if (!r.ok) throw new KolaboroError(r.status, data);',
          '    const signature = this.verify ? await this._check(text, r.headers.get("x-kolaboro-signature"), r.headers.get("x-kolaboro-key-id")) : { checked: false };',
          '    if (this.verify && !signature.ok) throw new KolaboroError("signature", signature);',
          '    const et = r.headers.get("etag"); if (et) this._etag.set(url, { etag: et, data, signature });',
          '    this.last = { url, status: r.status, signature, ratelimit: r.headers.get("ratelimit") }; return data;',
          '  }']
    dts = ['/*! kolaboro-v1 %s | %s */' % (VERSION, hdr), 'export declare class KolaboroError extends Error { status: number | string; body: unknown; }',
           'export interface Options { base?: string; fetch?: typeof fetch; verify?: boolean; }']
    py = ['"""kolaboro_v1 %s: %s\n\n    from kolaboro_v1 import KolaboroV1\n    k = KolaboroV1()\n    p = k.get_project(slug="amani-melasti")\n"""' % (VERSION, hdr),
          'import json, urllib.parse, urllib.request', 'from typing import Any, Dict, List, Optional', 'try:\n    from typing import TypedDict\nexcept ImportError:  # Python < 3.8\n    TypedDict = dict',
          '\nclass KolaboroError(Exception):\n    def __init__(self, status, body):\n        super().__init__("Kolaboro API %s" % status); self.status = status; self.body = body\n']
    meth_js, meth_ts, meth_py, pyty = [], [], [], []
    snake = lambda s: re.sub(r'(?<!^)(?=[A-Z])', '_', s).lower()
    def pyt(s):
        t = s.get('type'); return {'string': 'str', 'integer': 'int', 'number': 'float', 'boolean': 'bool'}.get(t) or ('List[%s]' % (pyt(s['items']) if s.get('items') else 'Any') if t == 'array' else 'Dict[str, Any]' if t == 'object' else 'Any')
    for path, o in ops:
        oid, params = o['operationId'], o['parameters']; rs = o['responses']['200']['content']['application/json']['schema']['$ref'].split('/')[-1]
        req = [p for p in params if p['required']]; opt = [p for p in params if not p['required']]
        pjs = 'p' + ('' if req else ' = {}')
        build = "'" + re.sub(r'\{(\w+)\}', lambda m: "' + encodeURIComponent(String(p." + m.group(1) + ")) + '", path) + "'"
        qs = '{ ' + ', '.join('%s: p.%s' % (p['name'], p['name']) for p in params if p['in'] == 'query') + ' }'
        meth_js.append('  /** %s */\n  %s(%s) { %sreturn this._get(%s, %s); }' % (o['summary'], oid, pjs, ''.join('if (p.%s == null) throw new TypeError("%s is required"); ' % (p['name'], p['name']) for p in req), build, qs))
        tp = '{ ' + ' '.join('%s%s: %s;' % (p['name'], '' if p['required'] else '?', ts_type(p['schema'])) for p in params) + ' }'
        meth_ts.append('  /** %s */\n  %s(p%s: %s): Promise<%s>;' % (o['summary'], oid, '' if req else '?', tp, rs))
        sig = ', '.join(['self'] + ['%s: %s' % (p['name'], pyt(p['schema'])) for p in req] + ['%s: Optional[%s] = None' % (p['name'], pyt(p['schema'])) for p in opt])
        pth = 'f' + json.dumps(re.sub(r'\{(\w+)\}', lambda m: '{urllib.parse.quote(str(' + m.group(1) + '), safe="")}', path))
        meth_py.append('    def %s(%s) -> "%s":\n        """%s"""\n        return self._get(%s, {%s})\n' % (snake(oid), sig, rs, o['summary'], pth, ', '.join("'%s': %s" % (p['name'], p['name']) for p in params if p['in'] == 'query')))
    for name, s in d['schemas'].items():
        dts.append('export type %s = %s;' % (name, ts_type(s)))
        props = (s.get('properties') or {}) if s.get('type') == 'object' else {}
        if props and all(re.match(r'^[A-Za-z_][A-Za-z0-9_]*$', k) for k in props): pyty.append('class %s(TypedDict, total=False):\n%s\n' % (name, ''.join('    %s: %s\n' % (k, pyt(v)) for k, v in props.items())))
        else: pyty.append('%s = Dict[str, Any]\n' % name)
    js += meth_js + ['}', 'export default KolaboroV1;']
    dts += ['export declare class KolaboroV1 {', '  constructor(o?: Options);', '  last: { url: string; status: number; signature: { checked: boolean; ok?: boolean; kid?: string }; cached?: boolean } | null;'] + meth_ts + ['}', 'export default KolaboroV1;']
    py += pyty + ['\nclass KolaboroV1:', '    """Client for https://kolaboro.com/api/v1 (no key). Keeps ETags and answers 304s from its cache."""',
                  '    def __init__(self, base: str = "https://kolaboro.com", timeout: float = 60):\n        self.base = base.rstrip("/"); self.timeout = timeout; self.last = None; self._etag = {}',
                  '    def _get(self, path, query):\n        q = urllib.parse.urlencode({k: v for k, v in query.items() if v is not None})\n        url = self.base + path + ("?" + q if q else ""); h = {"user-agent": "kolaboro-v1-python/%s"}' % VERSION +
                  '\n        if url in self._etag: h["if-none-match"] = self._etag[url][0]\n        try:\n            with urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=self.timeout) as r:\n                body = r.read(); data = json.loads(body)\n                self.last = {"url": url, "status": r.status, "signature": r.headers.get("x-kolaboro-signature"), "key_id": r.headers.get("x-kolaboro-key-id"), "body": body}\n                if r.headers.get("etag"): self._etag[url] = (r.headers.get("etag"), data)\n                return data\n        except urllib.error.HTTPError as e:\n            if e.code == 304 and url in self._etag: self.last = {"url": url, "status": 304, "cached": True}; return self._etag[url][1]\n            raise KolaboroError(e.code, e.read()[:500])\n'] + meth_py
    # ---- tests: every operation once, with its example, checks the required top-level fields of its schema
    cases = [(o['operationId'], o.get('x-example') or {}, sorted(((d['schemas'][o['responses']['200']['content']['application/json']['schema']['$ref'].split('/')[-1]].get('required')) or []))[:6]) for _, o in ops]
    tjs = ['// Generated tests for kolaboro-v1.mjs: node test-v1.mjs  (needs network; exit 1 on any failure)', "import { KolaboroV1 } from './kolaboro-v1.mjs';",
           'const k = new KolaboroV1({ verify: !!globalThis.crypto?.subtle }), C = ' + json.dumps(cases) + ';', 'let pass = 0, fails = [];',
           'for (const [op, args, req] of C) { try { const d = await k[op](args); const miss = req.filter(x => !(x in d)); if (miss.length) throw new Error("missing " + miss.join(",")); pass++; } catch (e) { fails.push(op + ": " + (e.message || e)); } }',
           'console.log(JSON.stringify({ client: "js", passed: pass, total: C.length, fails })); process.exit(fails.length ? 1 : 0);']
    snake_cases = [(snake(a), b, c) for a, b, c in cases]
    tpy = ['# Generated tests for kolaboro_v1.py: python3 test_v1.py  (needs network; exit 1 on any failure)', 'import json, os, sys', 'sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))', 'from kolaboro_v1 import KolaboroV1',
           'k = KolaboroV1(); C = ' + json.dumps(snake_cases), 'passed, fails = 0, []', 'for op, args, req in C:\n    try:\n        d = getattr(k, op)(**args); miss = [x for x in req if x not in d]\n        if miss: raise Exception("missing " + ",".join(miss))\n        passed += 1\n    except Exception as e: fails.append("%s: %s" % (op, e))',
           'print(json.dumps({"client": "python", "passed": passed, "total": len(C), "fails": fails})); sys.exit(1 if fails else 0)']
    files = {'kolaboro-v1.mjs': '\n'.join(js) + '\n', 'kolaboro-v1.d.ts': '\n'.join(dts) + '\n', 'kolaboro_v1.py': '\n'.join(py) + '\n', 'test-v1.mjs': '\n'.join(tjs) + '\n', 'test_v1.py': '\n'.join(tpy) + '\n'}
    for n, c in files.items(): open(os.path.join(OUT, n), 'w').write(c)
    m = {'type': 'kolaboro-sdk-v1-manifest', 'version': VERSION, 'built': now(), 'spec_version': d['built'][:10], 'operations': len(ops), 'generator': '/open/sdk-gen.py', 'files': {},
         'examples': {'js': "import { KolaboroV1 } from 'https://kolaboro.com/sdk/v1/kolaboro-v1.mjs';\nconst k = new KolaboroV1({ verify: true });   // checks the Ed25519 signature of every answer\nconst p = await k.getProject({ slug: 'amani-melasti' });\nconst hits = await k.find({ q: 'proyectos en Dubái', lang: 'es' });\nconst proof = await k.getInclusionProof({ project: 'amani-melasti' });\nconsole.log(p.name, hits.count, proof.tree_head.root, k.last.signature);",
                      'py': "# curl -O https://kolaboro.com/sdk/v1/kolaboro_v1.py\nfrom kolaboro_v1 import KolaboroV1\nk = KolaboroV1()\np = k.get_project(slug='amani-melasti')\nd = k.list_deltas()\nprint(p['name'], d['entries'][-1]['counts'])"}}
    lines = []
    for n in sorted(files):
        b = files[n].encode(); m['files'][n] = {'bytes': len(b), 'sha256': hashlib.sha256(b).hexdigest(), 'sri': 'sha384-' + base64.b64encode(hashlib.sha384(b).digest()).decode()}; lines.append('%s  %s' % (m['files'][n]['sha256'], n))
    open(os.path.join(OUT, 'SHA256SUMS'), 'w').write('\n'.join(lines) + '\n'); json.dump(m, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1, ensure_ascii=False)
    print('generated', len(ops), 'operations,', ', '.join('%s %d B' % (n, v['bytes']) for n, v in m['files'].items()))

def test():
    runs = []
    for cmd, cl in ((['node', 'test-v1.mjs'], 'JavaScript (Node %s)' % subprocess.run(['node', '--version'], capture_output=True, text=True).stdout.strip()), (['python3', 'test_v1.py'], 'Python %s' % sys.version.split()[0])):
        r = subprocess.run(cmd, cwd=OUT, capture_output=True, text=True, timeout=600)
        try: d = json.loads(r.stdout.strip().splitlines()[-1])
        except Exception: d = {'passed': 0, 'total': 0, 'fails': [(r.stderr or r.stdout)[-300:]]}
        d.update({'client': cl, 'at': now()}); runs.append(d); print(cl, d['passed'], '/', d['total'], d['fails'][:3])
    json.dump({'type': 'kolaboro-sdk-v1-tests', 'runs': runs}, open(os.path.join(OUT, 'tests.json'), 'w'), indent=1)
    return 0 if all(r['passed'] == r['total'] for r in runs) else 1

if __name__ == '__main__':
    a = sys.argv[1:]
    if a and a[0] == 'spec': spec()
    elif a and a[0] == 'gen': gen()
    elif a and a[0] == 'test': sys.exit(test())
    else: print(__doc__); sys.exit(2)
