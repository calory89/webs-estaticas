#!/usr/bin/env python3
"""kolaboro.com register change detection (n34a, batch 34, 21 Nov 2026).

Re-reads the official register records we already hold for tracked projects and lists, field by field, what changed since the
last read. Registers and what is compared:
  - Malaysia KPKT TEDUH (project API, JSON): every field of the record, personal contact fields removed exactly as in our captures
  - Florida DBPR condominium filings (developer summary extract, CSV): the project's rows
  - Thailand ONEP EIA open register (JSON list): the project's report row (approval date and number)
  - RAK RERA list and status of projects (PDF): file hash (the list is a scanned table; we compare the file, not fields)
  - Dubai DLD project register as mirrored per project with its inspection history (the source our records cite): status,
    completion date, % built and inspection date, escrow bank, units
The first comparison uses the record as captured or as published in /data/named.json (with its read date); later runs compare with
the previous run (state = the published /data/register-changes.json). Personal data is never kept. One request per host per second.
  register_diff.py <out dir> [--named named.json] [--captures <dir with /data/captures/...>] [--prev register-changes.json] [--no-dld]
"""
import csv, hashlib, io, json, os, re, sys, time, urllib.request, html as H
from datetime import datetime, timezone

ARGS = sys.argv[1:]
def opt(k, d=None):
    if k in ARGS:
        i = ARGS.index(k); v = ARGS[i + 1]; del ARGS[i:i + 2]; return v
    return d
NODLD = '--no-dld' in ARGS
if NODLD: ARGS.remove('--no-dld')
ROT = '--rotate' in ARGS                      # daily job: one seventh of the DLD records per day, the other registers on one day a week
if ROT: ARGS.remove('--rotate')
NAMED, CAPS, PREV = opt('--named'), opt('--captures'), opt('--prev')
OUT = ARGS[0] if ARGS else '.'
SITE = 'https://kolaboro.com'
UA = 'KolaboroRegisterDiff/1.0 (+https://kolaboro.com/registers/changes/)'
NOW = datetime.now(timezone.utc); TODAY = NOW.strftime('%Y-%m-%d')
PERSONAL = re.compile(r'telefon|emel|email|phone|fax|mobile', re.I)
last_t = {}
def fetch(url, timeout=60):
    h = re.sub(r'^https?://([^/]+).*', r'\1', url)
    w = last_t.get(h, 0) + 1.0 - time.time()
    if w > 0: time.sleep(w)
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={'user-agent': UA}), timeout=timeout) as r: return r.read()
    finally: last_t[h] = time.time()
def jget(path, url):
    if path and os.path.exists(path): return json.load(open(path))
    try: return json.loads(fetch(url))
    except Exception: return None
def cap(p):
    if CAPS and os.path.exists(os.path.join(CAPS, p.lstrip('/'))): return open(os.path.join(CAPS, p.lstrip('/')), 'rb').read()
    try: return fetch(SITE + p)
    except Exception: return None

named = jget(NAMED, SITE + '/data/named.json'); byid = {p['id']: p for p in named['projects']}
caps = jget(os.path.join(CAPS, 'data/register-captures.json') if CAPS else None, SITE + '/data/register-captures.json') or {'items': []}
prev = jget(PREV, SITE + '/data/register-changes.json') or {}
prev_last = prev.get('last') or {}
prev_changes = prev.get('changes') or []

def flat(o, p=''):
    out = {}
    if isinstance(o, dict):
        for k, v in o.items(): out.update(flat(v, p + '/' + k))
    elif isinstance(o, list):
        for i, v in enumerate(o): out.update(flat(v, p + '/' + str(i)))
    else: out[p] = o
    return out
def redact(o):
    if isinstance(o, dict): return {k: ('[removed: personal contact]' if PERSONAL.search(k) and v not in (None, '') else redact(v)) for k, v in o.items()}
    if isinstance(o, list): return [redact(v) for v in o]
    return o

last, changes, reads = {}, [], {}
def compare(key, pid, register, url, before, before_d, after):
    last[key] = {'d': TODAY, 'v': after, 'register': register, 'url': url, 'id': pid}
    pv = prev_last.get(key)
    if pv: before, before_d = pv['v'], pv['d']
    if before is None: return 0
    n = 0
    for f in sorted(set(before) | set(after)):
        if before.get(f) != after.get(f):
            p = byid.get(pid) or {}
            changes.append({'id': pid, 's': p.get('s'), 'n': p.get('n'), 'mk': p.get('mk'), 'register': register, 'field': f, 'before': before.get(f), 'before_d': before_d, 'after': after.get(f), 'after_d': TODAY, 'url': url})
            n += 1
    return n
def tally(reg, ok, ch):
    r = reads.setdefault(reg, {'register': reg, 'records': 0, 'read_ok': 0, 'changed_records': 0, 'changed_fields': 0, 'read': TODAY})
    r['records'] += 1; r['read_ok'] += 1 if ok else 0; r['changed_records'] += 1 if ch else 0; r['changed_fields'] += ch

dbpr_csv, onep_rows, rak_hash = None, None, {}
DAYN = int(NOW.timestamp() // 86400) % 7
def slot(k): return int(hashlib.sha256(k.encode()).hexdigest()[:8], 16) % 7
for it in (caps.get('items', []) if not ROT or DAYN == 0 else []):
    reg, pid, url = it['register'], it['id'], it['url']
    try:
        if 'TEDUH' in reg:
            b = cap(it['files'][0]['path']); before = flat(json.loads(b)) if b else None
            after = flat(redact(json.loads(fetch(url))))
            tally(reg, True, compare(pid + '|teduh', pid, reg, url, before, it['fetched_at'][:10], after))
        elif 'DBPR' in reg:
            b = cap(it['files'][0]['path']); rows0 = list(csv.reader(io.StringIO(b.decode('utf-8', 'replace')))) if b else []
            if dbpr_csv is None: dbpr_csv = list(csv.reader(io.StringIO(fetch(url, 180).decode('utf-8', 'replace'))))
            nums = set(r[9] for r in rows0[1:] if len(r) > 9)
            hdr = rows0[0] if rows0 else dbpr_csv[0]
            pick = lambda rows: {r[9] + '/' + hdr[j]: r[j] for r in rows[1:] if len(r) > 9 and r[9] in nums for j in range(len(hdr)) if j < len(r)}
            tally(reg, True, compare(pid + '|dbpr', pid, reg, url, pick(rows0), it['fetched_at'][:10], pick(dbpr_csv)))
        elif 'ONEP' in reg:
            b = cap(it['files'][0]['path']); r0 = json.loads(b) if b else []
            code = str((r0[0] if r0 else {}).get('code') or '').strip()
            if onep_rows is None:
                onep_rows = {}
                want = set()
                for it2 in caps.get('items', []):
                    if 'ONEP' in it2['register']:
                        try: want.add(str(json.loads(cap(it2['files'][0]['path']))[0]['code']).strip())
                        except Exception: pass
                for page in range(1, 141):
                    try: d = json.loads(fetch('https://eia.onep.go.th/services/web/open-api/eia-list?page=%d' % page))
                    except Exception as e: print('onep page', page, e); break
                    rows = d.get('dataList') or []
                    if not rows: break
                    for r in rows:
                        if r.get('code'): onep_rows[str(r['code']).strip()] = r
                    if want <= set(onep_rows): break
            keep = lambda r: {k: (str(v).strip() if v is not None else None) for k, v in (r or {}).items() if k in ('approve_date', 'approve_number', 'name', 'owner', 'year', 'province')}
            after = keep(onep_rows.get(code))
            tally(reg, bool(after), compare(pid + '|onep', pid, reg, url, keep(r0[0] if r0 else None), it['fetched_at'][:10], after) if after else 0)
        elif 'RAK' in reg:
            if url not in rak_hash: rak_hash[url] = hashlib.sha256(fetch(url, 180)).hexdigest()
            tally(reg, True, compare(pid + '|rak', pid, reg, url, {'file_sha256': it['sha256']}, it['fetched_at'][:10], {'file_sha256': rak_hash[url]}))
    except Exception as e:
        tally(reg, False, 0); print('fail', pid, reg, str(e)[:120])

MON = {m: i + 1 for i, m in enumerate(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])}
def dmy(s):
    m = re.match(r'(\d{1,2}) (\w{3}) (\d{4})', s or '')
    return '%s-%02d-%02d' % (m.group(3), MON.get(m.group(2), 0), int(m.group(1))) if m else None
def parse_dld(t):
    o = {}
    m = re.search(r'DLD project (\d+)', t); o['no'] = m.group(1) if m else None
    m = re.search(r'The DLD project register (\w[\w ]{2,20}?) Completion date', t); o['st'] = m.group(1).strip() if m else None
    m = re.search(r'Completion date on the DLD register: (\d{1,2} \w{3} \d{4})', t); o['comp'] = dmy(m.group(1)) if m else None
    ins = [(dmy(m.group(2)), float(m.group(1))) for m in re.finditer(r'([\d.]+)% built at DLD.s inspection on (\d{1,2} \w{3} \d{4})', t)]
    ins = [x for x in ins if x[0]]
    if ins: o['pd'], o['pct'] = max(ins)                       # the latest inspection printed on the page
    m = re.search(r'Escrow account bank (.+?) Units', t); o['bank'] = m.group(1).strip() if m else None
    m = re.search(r'Units ([\d,]+)', t); o['units'] = int(m.group(1).replace(',', '')) if m else None
    return o
def nbank(x): return re.sub(r'\b(bank|psc|pjsc|p s c|l l c|llc|the)\b', ' ', re.sub(r'[^a-z ]', ' ', str(x or '').lower())).split() if x else None
REG_DLD = 'Dubai DLD project register (per-project mirror with inspection history)'
if not NODLD:
    TAG = re.compile(r'<(script|style)\b.*?</\1>', re.S | re.I)
    for p in named['projects']:
        d = (p.get('fx') or {}).get('dld')
        if not d or not d.get('src'): continue
        if ROT and slot(p['id']) != DAYN: continue
        try:
            s = fetch(d['src'], 30).decode('utf-8', 'replace')
            t = re.sub(r'\s+', ' ', H.unescape(re.sub(r'<[^>]+>', ' ', TAG.sub(' ', s))))
            pg = parse_dld(t)
            if not pg.get('st') and pg.get('pct') is None: tally(REG_DLD, False, 0); continue
            if pg.get('no') and d.get('no') and pg['no'] != str(d['no']): tally(REG_DLD, False, 0); continue   # the page is another DLD project (a phase): not comparable
            before = {k: d.get(k) for k in ('st', 'comp', 'pct', 'pd', 'bank', 'units')}
            after = dict(before)
            for k in ('st', 'comp', 'units'):
                if pg.get(k) is not None and before.get(k) is not None: after[k] = pg[k]   # only fields we hold and the page prints
            if pg.get('bank') and before.get('bank') and nbank(pg['bank']) != nbank(before['bank']): after['bank'] = pg['bank']
            if pg.get('pd') and (not before.get('pd') or pg['pd'] > before['pd'] or (pg['pd'] == before['pd'] and pg.get('pct') != before.get('pct'))):
                after['pd'], after['pct'] = pg['pd'], pg.get('pct')   # a newer inspection than the one on our page
            tally(REG_DLD, True, compare(p['id'] + '|dld', p['id'], REG_DLD, d['src'], before, d.get('pd') or (p.get('rvw') or {}).get('d') or p.get('ad'), after))
        except Exception as e:
            tally(REG_DLD, False, 0)

for k, v in prev_last.items(): last.setdefault(k, v)   # records not read today keep their last read
# keep the older changes (dated), newest first, for the page's history
seen = set((c['id'], c['register'], c['field'], c['after_d']) for c in changes)
allc = changes + [c for c in prev_changes if (c['id'], c['register'], c['field'], c['after_d']) not in seen]
allc.sort(key=lambda c: (c['after_d'], c.get('mk') or '', c.get('n') or ''), reverse=True)
out = {'v': 'register-changes-1', 'updated': TODAY, 'generated_at': NOW.strftime('%Y-%m-%dT%H:%M:%SZ'),
       'licence': 'CC BY 4.0 (credit: Kolaboro, kolaboro.com); register contents belong to the registers',
       'method': 'Each register record we already hold for a tracked project is read again and compared field by field with the last read (the first time: '
                 'with our capture or the value published on the project page, with its read date). Personal contact fields are removed before comparing. '
                 'A change is what the register now prints; it is not a finding about the developer.',
       'reads': sorted(reads.values(), key=lambda r: -r['records']), 'changes': allc[:3000], 'last': last}
os.makedirs(OUT, exist_ok=True)
json.dump(out, open(os.path.join(OUT, 'register-changes.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print(json.dumps(out['reads'], ensure_ascii=False)); print('changes today', len(changes))
