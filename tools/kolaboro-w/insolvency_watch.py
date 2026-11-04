#!/usr/bin/env python3
"""Kolaboro insolvency watch: developer company names (private) against official insolvency notices.

Usage: insolvency_watch.py AGENT_DIR OUT_DIR PRIVATE_JSON [BACKFILL_DAYS]
  OUT_DIR gets two public files:
    insolvency-watch.json     anonymised counts per market and per project id (no company names)
    insolvency-es-index.json  hashed index of Spanish insolvency acts (BORME), used by the live lookup on kolaboro.com
  PRIVATE_JSON  per-hit reasons with the company names. Never published: kept as a private workflow artifact.

Sources
  UK     The Gazette (thegazette.co.uk), corporate insolvency notices (notice codes 24xx), Atom feed search by exact phrase.
         Open Government Licence v3.0. Personal insolvency notices (codes 25xx) are never read or kept.
  Spain  BORME, Section A (actos inscritos), the "Situacion concursal" acts the Registro Mercantil publishes for every
         company in an insolvency procedure (declaration, conclusion, etc.). Read day by day from boe.es (txt.php pages
         listed by the BORME open-data summary API). Reuse of BOE/BORME content is free with attribution (Aviso legal, BOE).

Matching: exact company name only. Both registers refuse a new company whose name is the "same as" an existing one apart
from the legal form (UK Companies Act 2006 s.66; Spain Reglamento del Registro Mercantil art. 408), so the name with the
legal-form words removed identifies one company per register. A hit still says "exact name, check it is the same company".
"""
import hashlib, html, json, os, re, sys, time, urllib.parse, urllib.request
from datetime import datetime, timezone, timedelta
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from wcommon import norm, candidates, load, has_form

AG, OUTD, PRIV = sys.argv[1], sys.argv[2], sys.argv[3]
BACKFILL = int(sys.argv[4]) if len(sys.argv) > 4 else 120
KEEP_DAYS = 730
UA = 'KolaboroInsolvencyWatch/1.0 (+https://kolaboro.com/tools/insolvency-check/)'
NOW = datetime.now(timezone.utc)
P, IDS, EXTRA = load(AG)

def fetch(url, accept='*/*', tries=4, pause=0.6):
    for a in range(tries):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers={'user-agent': UA, 'accept': accept}), timeout=60)
            b = r.read(); time.sleep(pause); return r.status, b
        except urllib.error.HTTPError as e:
            if e.code in (404, 400): time.sleep(pause); return e.code, b''
            time.sleep(15 * (a + 1))
        except Exception:
            time.sleep(15 * (a + 1))
    return 0, b''

def key(base): return hashlib.sha256(('kolaboro-w|' + base).encode()).hexdigest()[:16]

# ---------------- Spain: BORME index
idx_path = os.path.join(OUTD, 'insolvency-es-index.json')
prev = None
try:
    st, b = fetch('https://kolaboro.com/data/insolvency-es-index.json', 'application/json')
    if st == 200: prev = json.loads(b)
except Exception: prev = None
if not prev and os.path.exists(idx_path): prev = json.load(open(idx_path))
H = (prev or {}).get('h', {}); DAYS = set((prev or {}).get('days', []))
CONC = re.compile(r'Situaci[oó]n concursal\. Procedimiento concursal ([0-9]{1,7}/[0-9]{4})\.\s*FIRME:\s*(\w+),\s*Fecha de resoluci[oó]n\s*([0-9]{1,2}/[0-9]{1,2}/[0-9]{4})\.\s*([^.]{3,90})\.(?:\s*(Voluntario|Necesario|Insuficiencia de la masa activa)\.)?', re.I)
FORMSUF = re.compile(r'\b(SOCIEDAD LIMITADA(?: UNIPERSONAL| PROFESIONAL| LABORAL)?|SOCIEDAD ANONIMA(?: UNIPERSONAL)?|S\.?L\.?U?\.?|S\.?A\.?U?\.?)\s*\.?$', re.I)
def borme_day(d):
    st, b = fetch('https://www.boe.es/datosabiertos/api/borme/sumario/' + d.strftime('%Y%m%d'), 'application/json')
    if st != 200: return None   # no BORME that day (weekends, holidays) or not reachable
    s = json.loads(b)['data']['sumario']
    items = []
    for diario in s['diario'] if isinstance(s['diario'], list) else [s['diario']]:
        secs = diario['seccion'] if isinstance(diario['seccion'], list) else [diario['seccion']]
        for sec in secs:
            if sec.get('codigo') != 'A': continue
            it = sec.get('item') or []
            items += it if isinstance(it, list) else [it]
    n = 0
    for it in items:
        st, b = fetch(it['url_html'], 'text/html', pause=0.4)
        if st != 200: continue
        t = b.decode('utf-8', 'replace')
        for m in re.finditer(r'<h5 class="articulo">(.*?)</h5>\s*<p class="parrafo">(.*?)</p>', t, re.S):
            par = html.unescape(re.sub(r'<[^>]+>', '', m.group(2)))
            if 'concursal' not in par: continue
            name = re.sub(r'^\d+\s*-\s*', '', html.unescape(re.sub(r'<[^>]+>', '', m.group(1))).strip()).rstrip('.').strip()
            base = norm(name)
            if not base: continue
            form = (FORMSUF.search(name).group(1).upper().replace('.', '') if FORMSUF.search(name) else '')
            for c in CONC.finditer(par):
                act = re.sub(r'\s+', ' ', c.group(4)).strip()
                if c.group(5): act += '. ' + c.group(5)
                row = [d.strftime('%Y-%m-%d'), it['identificador'], c.group(1), c.group(3), act[:110], c.group(2).upper()[:3], form[:30]]
                lst = H.setdefault(key(base), [])
                if row not in lst: lst.append(row); n += 1
    return n

es_stats = {'days_scanned_this_run': 0, 'acts_added_this_run': 0}
start = (NOW - timedelta(days=BACKFILL)).date()
day = start
while day <= NOW.date():
    ds = day.strftime('%Y-%m-%d')
    if ds not in DAYS or day >= (NOW - timedelta(days=3)).date():
        if day.weekday() < 5:
            r = borme_day(datetime(day.year, day.month, day.day))
            if r is not None:
                DAYS.add(ds); es_stats['days_scanned_this_run'] += 1; es_stats['acts_added_this_run'] += r
                print('BORME', ds, r, file=sys.stderr, flush=True)
    day += timedelta(days=1)
cut = (NOW - timedelta(days=KEEP_DAYS)).strftime('%Y-%m-%d')
DAYS = sorted(d for d in DAYS if d >= cut)
H = {k: v for k, v in ((k, [r for r in v if r[0] >= cut]) for k, v in H.items()) if v}
index = {'updated': NOW.strftime('%Y-%m-%dT%H:%M:%SZ'), 'from': DAYS[0] if DAYS else None, 'to': DAYS[-1] if DAYS else None, 'days': DAYS,
         'source': 'BORME Seccion Primera (actos inscritos), Agencia Estatal Boletin Oficial del Estado, boe.es. Reuse allowed with attribution.',
         'key': "first 16 hex characters of SHA-256 of 'kolaboro-w|' + the company name in capitals with accents, punctuation and the legal form removed",
         'row': ['borme_date', 'borme_id', 'procedure', 'resolution_date', 'act', 'final', 'legal_form'],
         'note': 'Hashed so the file is not a readable list of companies. Anyone can test a name against it, which is its purpose.',
         'acts': sum(len(v) for v in H.values()), 'companies': len(H), 'h': H}
json.dump(index, open(idx_path, 'w'), separators=(',', ':'), ensure_ascii=False)

# ---------------- UK: The Gazette
GZ = 'https://www.thegazette.co.uk'
def gazette(name):
    want = norm(name)
    phrase = re.sub(r'[\s,]+(?:limited|ltd\.?|plc|llp|public limited company)\.?\s*$', '', name, flags=re.I).strip()   # finds Ltd and Limited notices alike
    url = GZ + '/insolvency/notice/data.feed?' + urllib.parse.urlencode({'text': '"%s"' % phrase, 'results-page-size': 100})
    st, b = fetch(url, 'application/atom+xml', pause=2.0)
    if st != 200: return None
    x = b.decode('utf-8', 'replace'); hits = []
    for e in re.findall(r'<entry>(.*?)</entry>', x, re.S):
        code = (re.search(r'<f:notice-code>(\d+)</f:notice-code>', e) or [None, ''])[1]
        if not code.startswith('24'): continue   # corporate insolvency only, never personal insolvency
        title = html.unescape((re.search(r'<title>(.*?)</title>', e, re.S) or [None, ''])[1]).strip()
        body = html.unescape(re.sub(r'<[^>]+>', '', (re.search(r'<content[^>]*>(.*?)</content>', e, re.S) or [None, ''])[1]))
        cat = html.unescape((re.search(r'<category term="([^"]+)"', e) or [None, ''])[1])
        nm = re.search(r'Name of Company:\s*([^.…]+?(?:LIMITED|LTD|PLC|LLP))', body, re.I)
        exact = norm(title) == want or (nm and norm(nm.group(1)) == want) or norm(body.split('…')[0]) == want
        if not exact: continue
        link = (re.search(r'<link href="(https://www\.thegazette\.co\.uk/notice/[^"/]+)"/>', e) or [None, ''])[1]
        date = (re.search(r'<published>([^<]{10})', e) or [None, ''])[1]
        hits.append({'date': date, 'type': cat or title, 'notice_code': code, 'url': link})
    return hits

# ---------------- run per project
UK_C, ES_C = {'United Kingdom'}, {'Spain'}
pub, private = {}, []
markets = {}
cov = {'uk_projects': 0, 'uk_names_checked': 0, 'uk_gazette_errors': 0, 'es_projects': 0, 'es_names_checked': 0}
gcache = {}
for p in sorted(P, key=lambda x: IDS[x['slug']]):
    c = p.get('country'); mk = p.get('market')
    if c not in UK_C | ES_C: continue
    pid = IDS[p['slug']]
    devs = [p.get('developer') or ''] + sorted(EXTRA.get(p['slug'], set()) - {p.get('developer')})
    names = []
    for d in devs: names += candidates(d)
    # exact legal names only: a brand without a legal form ("Contour") is not the name of one company, so it is never checked
    names = [x for x in dict.fromkeys(names) if has_form(x)][:6]
    m = markets.setdefault(mk, {'country': c, 'source': 'The Gazette (UK)' if c in UK_C else 'BORME (Spain)', 'projects': 0, 'projects_with_names': 0,
                                'names_checked': 0, 'projects_with_notice': 0})
    m['projects'] += 1
    if names: m['projects_with_names'] += 1
    found = []
    for nm in names:
        base = norm(nm)
        if c in UK_C:
            cov['uk_names_checked'] += 1
            if base not in gcache: gcache[base] = gazette(nm)
            hs = gcache[base]
            if hs is None: cov['uk_gazette_errors'] += 1; continue
            for h in hs:
                found.append({'date': h['date'], 'source': 'The Gazette (UK)', 'type': h['type']})
                private.append({'project': pid, 'name': nm, 'source': 'gazette', 'reason': 'Gazette notice "%s" on %s for a company named exactly "%s" (normalised: %s): %s' % (h['type'], h['date'], nm, base, h['url'])})
        else:
            cov['es_names_checked'] += 1
            for r in H.get(key(base), []):
                found.append({'date': r[0], 'source': 'BORME (Spain)', 'type': r[4]})
                private.append({'project': pid, 'name': nm, 'source': 'borme', 'reason': 'BORME %s (%s): procedure %s, resolution %s, "%s", for a company named exactly "%s" (normalised: %s)' % (r[1], r[0], r[2], r[3], r[4], nm, base)})
        m['names_checked'] += 1
    cov['uk_projects' if c in UK_C else 'es_projects'] += 1
    rec = {'market': mk, 'names_checked': len(names), 'notices': len(found)}
    if found:
        m['projects_with_notice'] += 1
        rec['found'] = sorted({(f['date'], f['source'], f['type']) for f in found}, reverse=True)[:10]
        rec['found'] = [{'date': a, 'source': b, 'type': t, 'text': 'Insolvency notice found on %s in %s' % (a, b)} for a, b, t in rec['found']]
    pub[pid] = rec
    print(pid, len(names), len(found), file=sys.stderr, flush=True)

out = {'updated': NOW.strftime('%Y-%m-%dT%H:%M:%SZ'),
       'coverage': {
           'covered': [
               {'country': 'United Kingdom', 'source': 'The Gazette, corporate insolvency notices', 'url': GZ + '/insolvency', 'licence': 'Open Government Licence v3.0',
                'from': 'the whole searchable Gazette notice archive (the oldest hits we have seen date from 2008)', 'how': 'Daily search of each named UK company by exact phrase; notice codes 24xx only (corporate insolvency).'},
               {'country': 'Spain', 'source': 'BORME Seccion Primera, "Situacion concursal" acts', 'url': 'https://www.boe.es/diario_borme/', 'licence': 'BOE reuse terms (free reuse with attribution)',
                'from': index['from'], 'how': 'Daily read of every BORME Section A page; each insolvency act is indexed under a hash of the exact company name.'}],
           'partial_or_by_hand': [
               {'country': 'Spain', 'source': 'Registro Publico Concursal (publicidadconcursal.es)', 'url': 'https://www.publicidadconcursal.es/consulta-publicidad-concursal-new',
                'why': 'Search needs a picture puzzle (captcha) and the debtor\'s tax id. Not automated: check it by hand. Since the 2022 reform the BOE itself only carries insolvency auction notices, which do not name the debtor.'}],
           'not_covered': 'All other markets. Insolvency registers elsewhere are not open machine-readable data, or need an account or a captcha. See /tools/insolvency-check/ for the official register to check by hand in each country.'},
       'method': ['Company names come from the private research record of each tracked UK or Spanish project. Only names written with their legal form (Ltd, Limited, PLC, S.L., S.A....) are checked: a brand name is not the name of one company.',
                  'A notice counts only when the company name in it is exactly the same as the name we hold, apart from capitals, accents, punctuation and the legal form (Ltd, Limited, S.L., Sociedad Limitada...). Both registers forbid two companies with the same name apart from the legal form.',
                  'Personal insolvency notices are never read. The company names and the notices behind each count are kept private, because tracked projects are anonymous.'],
       'privacy': 'No company names on this file. Each hit is reduced to its date, its source and the type of notice.',
       'coverage_counts': cov, 'spain_index': {'from': index['from'], 'to': index['to'], 'days': len(DAYS), 'acts': index['acts'], 'companies': index['companies'], **es_stats},
       'markets': dict(sorted(markets.items())),
       'totals': {'projects_checked': sum(m['projects'] for m in markets.values()), 'projects_with_notice': sum(m['projects_with_notice'] for m in markets.values()),
                  'names_checked': sum(m['names_checked'] for m in markets.values())},
       'projects': pub}
json.dump(out, open(os.path.join(OUTD, 'insolvency-watch.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
json.dump(private, open(PRIV, 'w'), indent=1, ensure_ascii=False)
print(json.dumps(out['totals']), json.dumps(out['spain_index']), file=sys.stderr)
