#!/usr/bin/env python3
# Kolaboro JSON-LD check (n33a, 20 Nov 2026). Python standard library only.
# Usage: python3 schema-check.py [--json out.json] URL [URL ...]   (or a file of URLs with @file)
# For every page: each <script type="application/ld+json"> parses; no Review, AggregateRating or ClaimReview anywhere;
# the properties Google and schema.org need for the types we publish are present; every {"@id": ...} reference points to a
# node of the same page or to one of the site-wide ids (the organisation, the website, the team members).
import json, re, sys, urllib.request, concurrent.futures as cf

BANNED = {'Review', 'AggregateRating', 'ClaimReview', 'EmployerAggregateRating'}
NEED = {
    'Organization': ['name', 'url'], 'WebSite': ['name', 'url'], 'WebPage': ['url', 'name'], 'AboutPage': ['url', 'name'],
    'CollectionPage': ['url', 'name'], 'ProfilePage': ['mainEntity'], 'Person': ['name'],
    'Dataset': ['name', 'description', 'license'], 'DataCatalog': ['name', 'url'], 'DataDownload': ['contentUrl', 'encodingFormat'],
    'ImageObject': ['contentUrl'], 'Residence': ['name', 'address'], 'ApartmentComplex': ['name', 'address'], 'Place': ['name'],
    'BreadcrumbList': ['itemListElement'], 'ListItem': ['position'], 'FAQPage': ['mainEntity'], 'Question': ['name', 'acceptedAnswer'],
    'Answer': ['text'], 'GeoCoordinates': ['latitude', 'longitude'], 'PostalAddress': ['addressCountry'],
}
GLOBAL_IDS = re.compile(r'^https://kolaboro\.com/(#org|#website|team/#[a-z-]+|data/(#[a-z0-9-]+)?|developers/[a-z0-9-]+/#org|projects/[a-z0-9-]+/#[a-z]+)$')


def get(u):
    req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (compatible; KolaboroSchemaCheck/1.0; +https://kolaboro.com/engineering/)'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode('utf8', 'replace')


def nodes(o, out):
    if isinstance(o, dict):
        out.append(o)
        for v in o.values():
            nodes(v, out)
    elif isinstance(o, list):
        for v in o:
            nodes(v, out)
    return out


def check(u):
    try:
        h = get(u)
    except Exception as e:
        return u, ['fetch: %s' % e], {}
    issues, types = [], {}
    blocks = re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', h, re.S)
    if not blocks:
        return u, ['no JSON-LD'], {}
    N = []
    for i, b in enumerate(blocks):
        try:
            N += nodes(json.loads(b), [])
        except Exception as e:
            issues.append('block %d does not parse: %s' % (i, e))
    ids = {n['@id'] for n in N if isinstance(n.get('@id'), str) and len(n) > 1}
    for n in N:
        t = n.get('@type')
        if not t:
            if set(n) == {'@id'} and not (n['@id'] in ids or GLOBAL_IDS.match(n['@id'])):
                issues.append('reference to %s, not defined on the page' % n['@id'])
            continue
        for ty in (t if isinstance(t, list) else [t]):
            types[ty] = types.get(ty, 0) + 1
            if ty in BANNED:
                issues.append('banned type %s' % ty)
            for k in NEED.get(ty, []):
                if n.get(k) in (None, '', []):
                    issues.append('%s without %s%s' % (ty, k, (' (' + str(n.get('@id') or n.get('name') or '')[:60] + ')') if (n.get('@id') or n.get('name')) else ''))
            if ty == 'ImageObject' and '/k/sat/' in str(n.get('contentUrl', '')) and not (n.get('license') and n.get('creditText')):
                issues.append('satellite ImageObject without license or creditText')
    return u, sorted(set(issues)), types


def main(a):
    out = None
    if a[:1] == ['--json']:
        out, a = a[1], a[2:]
    U = []
    for x in a:
        U += [l.strip() for l in open(x[1:]) if l.strip()] if x.startswith('@') else [x]
    with cf.ThreadPoolExecutor(6) as ex:
        R = list(ex.map(check, U))
    bad = [r for r in R if r[1]]
    for u, i, t in R:
        print(('FAIL ' if i else 'ok   ') + u + '  ' + ', '.join('%s:%d' % kv for kv in sorted(t.items())))
        for x in i:
            print('       - ' + x)
    print('%d pages, %d with issues' % (len(R), len(bad)))
    if out:
        json.dump([{'url': u, 'issues': i, 'types': t} for u, i, t in R], open(out, 'w'), indent=1)
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
