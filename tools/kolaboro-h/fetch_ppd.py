# Stream HM Land Registry Price Paid Data (yearly files) and keep only new-build, standard-price residential sales
# in the areas we track. Nothing is stored except the filtered rows (price, date, type, area, tenure).
import csv, io, sys, json, urllib.request, hashlib, time
OUT = sys.argv[1]
AREAS = {('county', 'GREATER LONDON'): 'London', ('district', 'MANCHESTER'): 'Manchester', ('district', 'BIRMINGHAM'): 'Birmingham',
         ('district', 'LEEDS'): 'Leeds', ('district', 'LIVERPOOL'): 'Liverpool'}
man, out = [], open(OUT, 'w')
for y in sys.argv[2:]:
    url = 'http://prod2.publicdata.landregistry.gov.uk.s3-website-eu-west-1.amazonaws.com/pp-%s.csv' % y
    resp = urllib.request.urlopen(urllib.request.Request(url, headers={'user-agent': 'KolaboroResearch/1.0'}), timeout=600)
    h = hashlib.sha256(); n = keep = 0
    class Tee(io.RawIOBase):
        def readable(self): return True
        def readinto(self, b):
            c = resp.read(len(b));
            h.update(c); b[:len(c)] = c; return len(c)
    for r in csv.reader(io.TextIOWrapper(io.BufferedReader(Tee(), 1 << 20), encoding='utf-8', errors='replace')):
        n += 1
        if len(r) < 15 or r[5] != 'Y' or r[14] != 'A' or r[4] == 'O': continue
        mk = AREAS.get(('county', r[13])) or AREAS.get(('district', r[12]))
        if not mk: continue
        keep += 1
        out.write(json.dumps({'mk': mk, 'v': int(r[1]), 'd': r[2][:10], 't': r[4], 'du': r[6]}) + '\n')
    man.append({'file': url, 'rows': n, 'kept': keep, 'sha256': h.hexdigest(), 'at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'last_modified': resp.headers.get('last-modified')})
    print(y, n, keep, file=sys.stderr)
json.dump(man, open(OUT + '.manifest.json', 'w'))
