"""JSON Schema (2020-12) inference from real documents, used to write the Kolaboro data contracts and the OpenAPI response
schemas from live responses. Nothing here is guessed from names: every property and type comes from a value that was seen.

Rules (kept deliberately simple so a failing contract means something changed, not that the inference was too clever):
- numbers are "number" (an integer that becomes 2.0 is not a contract break);
- objects whose keys are data (project ids, market names, dates, hashes) become maps: additionalProperties = merged values;
- "required" is set only at the top level and for the items of top-level arrays and maps (keys seen in every item);
- deeper than that, leaf values may also be null (required keys must still be present), so a value that is not known yet
  one day (for example a timestamp filled in later) does not fail the contract.
"""
import re

ID_RE = re.compile(r'^[A-Z]{2,6}-\d{2,4}$')
DATE_RE = re.compile(r'^\d{4}-\d{2}(-\d{2})?$')
HEX_RE = re.compile(r'^[0-9a-f]{8,64}$')
NUM_RE = re.compile(r'^-?\d+(\.\d+)?$')


def _tname(v):
    if v is None: return 'null'
    if isinstance(v, bool): return 'boolean'
    if isinstance(v, (int, float)): return 'number'
    if isinstance(v, str): return 'string'
    if isinstance(v, list): return 'array'
    return 'object'


def is_map(d):
    ks = list(d.keys())
    if not ks: return False
    if all(ID_RE.match(k) for k in ks) and len(ks) >= 2: return True
    if all(DATE_RE.match(k) for k in ks) and len(ks) >= 2: return True
    if all(HEX_RE.match(k) for k in ks) and len(ks) >= 2: return True
    if all(NUM_RE.match(k) for k in ks) and len(ks) >= 3: return True
    if '/' in ks[0] and all(k.startswith('/') for k in ks) and len(ks) >= 20: return True   # file paths
    if len(ks) >= 40: return True
    vals = list(d.values())
    if len(ks) >= 8 and all(isinstance(v, dict) for v in vals):
        sets = [set(v.keys()) for v in vals]
        inter, union = set.intersection(*sets), set.union(*sets)
        if union and len(inter) / len(union) >= 0.5: return True
    return False


def key_pattern(ks):
    if ks and all(ID_RE.match(k) for k in ks): return ID_RE.pattern
    if ks and all(DATE_RE.match(k) for k in ks): return DATE_RE.pattern
    return None


def infer(v, depth=0):
    t = _tname(v)
    if t == 'array':
        s = {'type': 'array'}
        if v:
            it = None
            for x in v: it = merge(it, infer(x, depth + 1))
            s['items'] = it
        return s
    if t == 'object':
        if (depth > 0 and is_map(v)) or (depth == 0 and len(v) >= 40 and is_map(v)):
            it = None
            for x in v.values(): it = merge(it, infer(x, depth + 1))
            s = {'type': 'object', 'additionalProperties': it, 'x-map': True}
            pat = key_pattern(list(v.keys()))
            if pat: s['propertyNames'] = {'pattern': pat}
            return s
        props = {k: infer(x, depth + 1) for k, x in v.items()}
        return {'type': 'object', 'properties': props, '_seen': {k: 1 for k in v}, '_n': 1}
    return {'type': t}


def merge(a, b):
    if a is None: return b
    if b is None: return a
    ta, tb = a.get('type'), b.get('type')
    if 'anyOf' in a or 'anyOf' in b or (ta != tb and 'object' in (ta, tb, ) and 'array' in (ta, tb)):
        return _any(a, b)
    if ta == tb == 'object':
        if a.get('x-map') or b.get('x-map'):
            if a.get('x-map') and b.get('x-map'):
                out = dict(a); out['additionalProperties'] = merge(a.get('additionalProperties'), b.get('additionalProperties'))
                if a.get('propertyNames') != b.get('propertyNames'): out.pop('propertyNames', None)
                return out
            return _any(a, b)
        props = dict(a['properties'])
        for k, s in b['properties'].items(): props[k] = merge(props.get(k), s)
        seen = dict(a['_seen'])
        for k in b['_seen']: seen[k] = seen.get(k, 0) + 1
        return {'type': 'object', 'properties': props, '_seen': seen, '_n': a['_n'] + b['_n']}
    if ta == tb == 'array':
        out = {'type': 'array'}
        if 'items' in a or 'items' in b:
            out['items'] = merge(a.get('items'), b.get('items'))
        return out
    if ta == tb: return a
    # different primitive types (or null): a type list
    tl = sorted(set(_types(a)) | set(_types(b)))
    if all(t in ('null', 'boolean', 'number', 'string') for t in tl): return {'type': tl}
    if 'null' in tl:   # object/array that is sometimes null
        base = a if ta != 'null' else b
        out = dict(base); out['type'] = sorted(set(_types(base)) | {'null'}); return out
    return _any(a, b)


def _types(s):
    t = s.get('type')
    return t if isinstance(t, list) else [t] if t else []


def _any(a, b):
    xs = (a.get('anyOf') or [a]) + (b.get('anyOf') or [b])
    out = []
    for x in xs:
        if x not in out: out.append(x)
    return {'anyOf': out}


def finish(s, depth=0, top_item=False, strict=False):
    """Turn the merge bookkeeping into a clean schema. depth 0 is the document root; top-level properties are depth 1."""
    if s is None: return {}
    if 'anyOf' in s: return {'anyOf': [finish(x, depth, top_item, strict) for x in s['anyOf']]}
    s = dict(s)
    is_map_ = s.pop('x-map', False)
    t = s.get('type')
    ts = t if isinstance(t, list) else [t]
    if 'properties' in s:
        n, seen = s.pop('_n', 1), s.pop('_seen', {})
        req = sorted(k for k, c in seen.items() if c == n) if (depth == 0 or top_item) else []
        s['properties'] = {k: finish(v, depth + 1, strict=(k in req)) for k, v in s['properties'].items()}
        if req: s['required'] = req
    if is_map_:
        s['additionalProperties'] = finish(s.get('additionalProperties'), depth + 1, top_item=(depth <= 1))
    if 'items' in s:
        s['items'] = finish(s['items'], depth + 1, top_item=(depth <= 1))
    # leaves deeper than the items of top-level arrays and maps may also be null, unless they are required keys of such an item
    if depth >= 3 and t is not None and all(x in ('boolean', 'number', 'string', 'null') for x in ts):
        u = sorted(set(ts) | {'null'})
        s['type'] = u if len(u) > 1 else 'null'
    if isinstance(s.get('type'), list) and len(s['type']) == 1: s['type'] = s['type'][0]
    return s


def schema_for(doc, title=None, sid=None, description=None):
    s = finish(infer(doc), 0)
    out = {'$schema': 'https://json-schema.org/draft/2020-12/schema'}
    if sid: out['$id'] = sid
    if title: out['title'] = title
    if description: out['description'] = description
    out.update(s)
    return out
