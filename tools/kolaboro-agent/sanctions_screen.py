#!/usr/bin/env python3
"""Kolaboro sanctions screening of developer companies (batch 19, n19a). No model calls.

Usage: sanctions_screen.py OUT_DIR PRIVATE_DIR [--named named.json] [--lists DIR]

Daily: downloads the official open sanctions lists, keeps their ENTITY entries only (companies, groups, organisations; never
individuals, vessels or aircraft), and compares them with the names of the developer companies in Kolaboro's named project
data (/data/named.json). Developer names that could be a private person's name are not screened at all.
  OFAC Specially Designated Nationals (SDN) and OFAC Consolidated (non-SDN) lists   US Treasury, public domain
  UK Sanctions List (FCDO; replaced the OFSI Consolidated List in January 2026)      Open Government Licence v3.0
  EU Consolidated Financial Sanctions List (European Commission, FSF)                 reuse authorised (Decision 2011/833/EU)
  UN Security Council Consolidated List                                               United Nations, public
A list that cannot be downloaded is reported as such and is not claimed as screened.

Outputs
  OUT_DIR/sanctions.json            public: lists screened (publisher, date of the list, entity entries read, licence) and the
                                    developer page slugs with NO possible match. Nothing else: possible matches, their count
                                    and the names that were not screened are not published.
  PRIVATE_DIR/review.json           private: possible matches for a person to review (developer, list, listed name, score,
                                    programme, list id). Sent to the admin CRM (kolaboro_machine, kept with the internal risk
                                    graph, read with the admin key) by the workflow, never committed or published.
Matching: names are lower-cased, accents and punctuation removed, legal forms (Ltd, LLC, S.L., Sdn Bhd, PT, GmbH...) dropped.
Possible match when the cores are equal, or all words of a two-or-more-word core appear in the listed name with at most two
more words, or the character similarity is 0.92 or more for cores of 8 letters or more.
"""
import csv, io, json, os, re, sys, time, unicodedata, urllib.request, difflib, hashlib
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

UA = 'Mozilla/5.0 (compatible; KolaboroResearchAgent/1.0; +https://kolaboro.com/data-policy)'
NOW = datetime.now(timezone.utc)
TODAY = NOW.strftime('%Y-%m-%d')
ARGS = sys.argv[1:]
OUT, PRIV = ARGS[0], ARGS[1]


def arg(name, d=None):
    return ARGS[ARGS.index(name) + 1] if name in ARGS and ARGS.index(name) + 1 < len(ARGS) else d


def fetch(url, timeout=180):
    """(final url, bytes) or (None, None). One attempt plus one retry."""
    for i in range(2):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': '*/*'}), timeout=timeout)
            return r.geturl(), r.read()
        except Exception as e:
            print('fetch failed', url[:90], str(e)[:120])
            time.sleep(10)
    return None, None


LISTS = [
    {'id': 'ofac_sdn', 'name': 'OFAC Specially Designated Nationals and Blocked Persons List (SDN)', 'publisher': 'US Department of the Treasury, Office of Foreign Assets Control',
     'page': 'https://ofac.treasury.gov/specially-designated-nationals-and-blocked-persons-list-sdn-human-readable-lists', 'licence': 'US Government work, public domain',
     'files': ['https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.CSV', 'https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/ALT.CSV']},
    {'id': 'ofac_cons', 'name': 'OFAC Consolidated Sanctions List (non-SDN lists)', 'publisher': 'US Department of the Treasury, Office of Foreign Assets Control',
     'page': 'https://ofac.treasury.gov/other-ofac-sanctions-lists', 'licence': 'US Government work, public domain',
     'files': ['https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/CONS_PRIM.CSV', 'https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/CONS_ALT.CSV']},
    {'id': 'uk', 'name': 'UK Sanctions List', 'publisher': 'UK Foreign, Commonwealth and Development Office (the list OFSI now uses; it replaced the OFSI Consolidated List)',
     'page': 'https://www.gov.uk/government/publications/the-uk-sanctions-list', 'licence': 'Open Government Licence v3.0',
     'files': ['https://sanctionslist.fcdo.gov.uk/docs/UK-Sanctions-List.csv']},
    {'id': 'eu', 'name': 'EU Consolidated Financial Sanctions List', 'publisher': 'European Commission (Financial Sanctions Files)',
     'page': 'https://data.europa.eu/data/datasets/consolidated-list-of-persons-groups-and-entities-subject-to-eu-financial-sanctions', 'licence': 'Reuse authorised, Commission Decision 2011/833/EU',
     'files': ['https://webgate.ec.europa.eu/fsd/fsf/public/files/csvFullSanctionsList_1_1/content?token=dG9rZW4tMjAxNw']},
    {'id': 'un', 'name': 'UN Security Council Consolidated List', 'publisher': 'United Nations Security Council',
     'page': 'https://main.un.org/securitycouncil/en/content/un-sc-consolidated-list', 'licence': 'United Nations, public information',
     'files': ['https://scsanctions.un.org/resources/xml/en/consolidated.xml']},
]

# ------------------------------------------------------------------------------------------------ parsing (entities only)


def sdn_like(prim, alt):
    """OFAC SDN.CSV / CONS_PRIM.CSV + ALT.CSV: ent_num, name, type ('-0-' = entity), programme ..."""
    ents, names = {}, []
    for r in csv.reader(io.StringIO(prim.decode('latin-1'))):
        if len(r) < 4:
            continue
        typ = r[2].strip().strip('"')
        if typ not in ('-0-', ''):
            continue
        ents[r[0].strip()] = (r[1].strip(), r[3].strip())
        names.append((r[1].strip(), r[0].strip(), r[3].strip()))
    for r in csv.reader(io.StringIO((alt or b'').decode('latin-1'))):
        if len(r) >= 4 and r[0].strip() in ents:
            names.append((r[3].strip(), r[0].strip(), ents[r[0].strip()][1]))
    return names, len(ents)


def uk_list(b):
    t = b.decode('utf-8-sig', 'replace')
    first, rest = t.split('\n', 1)
    date = None
    m = re.search(r'(\d{2})-([A-Za-z]{3})-(\d{4})', first)
    if m:
        date = datetime.strptime(m.group(0), '%d-%b-%Y').strftime('%Y-%m-%d')
    rows = csv.reader(io.StringIO(rest))
    h = next(rows)
    ix = {k: i for i, k in enumerate(h)}
    names, ids = [], set()
    for r in rows:
        if len(r) < len(h) or r[ix['Designation Type']].strip() != 'Entity':
            continue
        n = r[ix['Name 6']].strip() or ' '.join(r[ix[k]].strip() for k in ('Name 1', 'Name 2', 'Name 3', 'Name 4', 'Name 5') if r[ix[k]].strip())
        if n:
            names.append((n, r[ix['Unique ID']].strip(), r[ix['Regime Name']].strip()))
            ids.add(r[ix['Unique ID']].strip())
    return names, len(ids), date


def eu_list(b):
    t = b.decode('utf-8-sig', 'replace')
    rows = csv.reader(io.StringIO(t), delimiter=';')
    h = next(rows)
    ix = {k.strip(): i for i, k in enumerate(h)}
    need = ('Entity_SubjectType_ClassificationCode', 'NameAlias_WholeName', 'Entity_LogicalId')
    if not all(k in ix for k in need):
        return None, 0, None
    names, ids, dates = [], set(), []
    for r in rows:
        if len(r) < len(h) or r[ix['Entity_SubjectType_ClassificationCode']].strip().lower() != 'enterprise':
            continue
        n = r[ix['NameAlias_WholeName']].strip()
        if n:
            names.append((n, r[ix['Entity_LogicalId']].strip(), r[ix.get('Entity_Regulation_Programme', 0)].strip() if 'Entity_Regulation_Programme' in ix else ''))
            ids.add(r[ix['Entity_LogicalId']].strip())
        if 'fileGenerationDate' in ix and r[ix['fileGenerationDate']]:
            dates.append(r[ix['fileGenerationDate']][:10])
    return names, len(ids), (max(dates) if dates else None)


def un_list(b):
    root = ET.fromstring(b)
    date = (root.get('dateGenerated') or '')[:10] or None
    names, n = [], 0
    for e in root.iter('ENTITY'):
        n += 1
        ref = (e.findtext('REFERENCE_NUMBER') or '').strip()
        prog = (e.findtext('UN_LIST_TYPE') or '').strip()
        if (e.findtext('FIRST_NAME') or '').strip():
            names.append((e.findtext('FIRST_NAME').strip(), ref, prog))
        for a in e.iter('ENTITY_ALIAS'):
            if (a.findtext('ALIAS_NAME') or '').strip():
                names.append((a.findtext('ALIAS_NAME').strip(), ref, prog))
    return names, n, date


# ------------------------------------------------------------------------------------------------ names
LEGAL = set('''ltd limited llc l l c inc incorporated corp corporation co company plc gmbh ag kg sa s a sl s l slu sas sarl srl spa s p a bv b v nv
n v oy ab as a s aps bhd berhad sdn pt tbk pte pty lp llp pc pcl pjsc jsc ojsc cjsc ooo oao zao tov dd d d doo d o o sae s a e fz fze fzco fzllc
dmcc wll w l l spc saoc saog lda ltda eireli sab de cv s de r l rl sapi kft zrt sro s r o as a.s sp z o o z oo ad ead eood ood ltee cie et
group holding holdings the and of'''.split())
REALTY = set('''development developments developer developers property properties real estate realty homes home construction constructions
builders building buildings land investment investments invest capital partners management ventures enterprises enterprise trading
international global residences residence resorts resort hotels hotel villas living projects project inmobiliaria promociones
grupo groupe gruppe immobilien immobiliare bau wohnbau projektentwicklung emlak insaat yapi gayrimenkul gyo''' .split())
GIVEN = set('''john james robert michael william david richard joseph thomas charles mary patricia jennifer linda elizabeth barbara susan
jessica sarah karen daniel matthew anthony mark donald steven paul andrew joshua kenneth kevin brian george timothy ronald edward jason
jeffrey ryan jacob gary nicholas eric jonathan stephen larry justin scott brandon benjamin samuel frank gregory raymond alexander patrick
jack dennis jerry tyler aaron jose adam henry nathan douglas zachary peter kyle walter ethan jeremy harold keith christian roger noah
gerald carl terry sean austin arthur lawrence jesse dylan bryan joe jordan billy bruce albert willie gabriel logan alan juan wayne roy
ralph randy eugene vincent russell elijah louis bobby philip johnny maria ana carlos luis jorge miguel pedro juan antonio manuel francisco
javier alejandro pablo diego sergio fernando ricardo eduardo rafael andres marco giovanni giuseppe luca marco paolo pierre jean michel
philippe nicolas hans peter klaus stefan thomas andreas ivan sergei dmitry alexei vladimir olga natalia elena anna mohammed muhammad
ahmed ali omar hassan hussein ibrahim yusuf khalid abdullah fatima aisha wei li zhang wang chen liu yang huang raj rahul amit vijay
suresh ramesh priya budi agus made wayan nyoman ketut putu kadek komang gede ida bagus nguyen tran le pham somchai somsak'''.split())


def core(s):
    s = ''.join(c for c in unicodedata.normalize('NFKD', s.lower()) if not unicodedata.combining(c))
    s = s.replace('&', ' and ')
    s = re.sub(r"[^a-z0-9]+", ' ', s)
    w = [x for x in s.split() if x not in LEGAL]
    return ' '.join(w)


def maybe_person(name):
    """True when a developer name could be a private individual's name: then it is not screened at all."""
    raw = re.sub(r'\(.*?\)', ' ', name)
    toks = re.findall(r"[A-Za-zÀ-ÿ'.-]+|\d+", raw)
    low = [t.lower().strip('.') for t in toks]
    if not toks:
        return True
    if any(t in LEGAL or t in REALTY for t in low) or any(c.isdigit() for c in raw):
        return False
    if len(toks) == 1:
        return low[0] in GIVEN
    # starts with a common given name (John Smith, Maria Lopez Garcia): could be a person
    return low[0] in GIVEN or (len(toks) >= 2 and low[0] in ('mr', 'mrs', 'ms', 'dr', 'sr', 'sra', 'herr', 'frau'))


def similar(a, b):
    return difflib.SequenceMatcher(None, a, b).ratio()


def screen(devs, index):
    """devs: [(slug, name)], index: {list_id: [(name, ref, programme)]} -> (no_match slugs, review rows, not screened count)"""
    tokidx = {}
    allnames = []
    for lid, names in index.items():
        for (n, ref, prog) in names:
            c = core(n)
            if len(c.replace(' ', '')) < 3:
                continue
            k = len(allnames)
            allnames.append((c, n, ref, prog, lid))
            for t in set(c.split()):
                tokidx.setdefault(t, []).append(k)
    clean, review, skipped = [], [], 0
    for slug, name in devs:
        if maybe_person(name):
            skipped += 1
            continue
        c = core(name)
        toks = c.split()
        if len(c.replace(' ', '')) < 3:
            skipped += 1
            continue
        cand = set()
        for t in toks:
            if len(tokidx.get(t, [])) < 5000:
                cand.update(tokidx.get(t, []))
        hits = []
        for k in cand:
            lc, ln, ref, prog, lid = allnames[k]
            lt = lc.split()
            score = 0.0
            if lc == c:
                score = 1.0
            elif len(toks) >= 2 and all(t in lt for t in toks) and len(lt) <= len(toks) + 2:
                score = 0.95
            elif len(c) >= 8 and abs(len(lc) - len(c)) <= 4:
                s = similar(lc, c)
                if s >= 0.92:
                    score = round(s, 3)
            if score:
                hits.append({'list': lid, 'listed_name': ln, 'ref': ref, 'programme': prog, 'score': score})
        if hits:
            hits.sort(key=lambda h: -h['score'])
            review.append({'slug': slug, 'developer': name, 'core': c, 'hits': hits[:8]})
        else:
            clean.append(slug)
    return clean, review, skipped


def main():
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(PRIV, exist_ok=True)
    nf = arg('--named')
    named = json.load(open(nf)) if nf else json.loads(fetch('https://kolaboro.com/data/named.json?v=' + TODAY)[1])
    devs = {}
    for x in named.get('projects', []):
        if x.get('dvs') and x.get('dv'):
            devs[x['dvs']] = x['dv']
    devs = sorted(devs.items())
    local = arg('--lists')
    index, meta = {}, []
    for L in LISTS:
        m = {k: L[k] for k in ('id', 'name', 'publisher', 'page', 'licence')}
        m['files'] = L['files']
        try:
            bodies, finals = [], []
            for u in L['files']:
                if local:
                    fn = os.path.join(local, {'SDN.CSV': 'sdn.csv', 'ALT.CSV': 'alt.csv', 'CONS_PRIM.CSV': 'cons.csv', 'CONS_ALT.CSV': 'consalt.csv'}.get(u.rsplit('/', 1)[-1]) or {'uk': 'uk.csv', 'eu': 'eu.csv', 'un': 'un.xml'}[L['id']])
                    b, f = (open(fn, 'rb').read(), u) if os.path.exists(fn) else (None, None)
                else:
                    f, b = fetch(u)
                bodies.append(b)
                finals.append(f or '')
            if bodies[0] is None:
                raise RuntimeError('download failed')
            date = None
            if L['id'].startswith('ofac'):
                names, n = sdn_like(bodies[0], bodies[1] if len(bodies) > 1 else b'')
                md = re.search(r'/(\d{4}-\d{2}-\d{2})/', finals[0])
                date = md.group(1) if md else None
            elif L['id'] == 'uk':
                names, n, date = uk_list(bodies[0])
            elif L['id'] == 'eu':
                names, n, date = eu_list(bodies[0])
                if names is None:
                    raise RuntimeError('unexpected file format')
            else:
                names, n, date = un_list(bodies[0])
            if n < 10:
                raise RuntimeError('too few entities (%d)' % n)
            index[L['id']] = names
            m.update(ok=True, list_date=date, entities=n, names=len(names), sha256=hashlib.sha256(b''.join(x or b'' for x in bodies)).hexdigest())
        except Exception as e:
            m.update(ok=False, error=str(e)[:120])
        meta.append(m)
        print(L['id'], m.get('ok'), m.get('entities'), m.get('list_date'), m.get('error', ''))
    if not index:
        sys.exit('no list could be read')
    clean, review, skipped = screen(devs, index)
    pub = {
        'version': 'sanctions-1', 'updated': TODAY, 'generated_at': NOW.strftime('%Y-%m-%dT%H:%M:%SZ'),
        'note': 'Developer companies in Kolaboro\'s named project data screened by name against the entity entries of official sanctions lists. Listed here: the developer pages whose company name had no possible match. Names that could be a private person\'s are not screened. A name check is not an identity check: no match does not prove a company is not sanctioned (it may trade under another name), and a similar name is not the same company.',
        'method': 'Names lower-cased, accents and punctuation removed, legal forms dropped; possible match when the cores are equal, when all words of a core of two or more words appear in a listed name with at most two more words, or when the character similarity is at least 0.92 for cores of 8 letters or more. Entity entries only (companies, groups, organisations); individuals, vessels and aircraft are not compared. Possible matches go to a person for review and are not published.',
        'lists': [{k: v for k, v in m.items() if k != 'sha256'} for m in meta],
        'no_match': sorted(clean),
    }
    json.dump(pub, open(os.path.join(OUT, 'sanctions.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    priv = {'generated_at': pub['generated_at'], 'lists': [{'id': m['id'], 'ok': m.get('ok'), 'list_date': m.get('list_date'), 'entities': m.get('entities')} for m in meta],
            'screened': len(devs) - skipped, 'not_screened_person_like': skipped, 'no_match': len(clean), 'review': review,
            'key': hashlib.sha256(json.dumps([[r['slug'], [h['ref'] for h in r['hits']]] for r in review]).encode()).hexdigest()[:16]}
    json.dump(priv, open(os.path.join(PRIV, 'review.json'), 'w'), ensure_ascii=False, indent=0)
    print('developers', len(devs), 'screened', len(devs) - skipped, 'no match', len(clean), 'to review', len(review))


SB = 'https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/kolaboro_machine'
AK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw'


def machine(action, payload):
    key = os.environ.get('KB_MACHINE_KEY', '')
    if not key:
        print('no KB_MACHINE_KEY: not sent'); return None
    r = urllib.request.Request(SB, data=json.dumps(dict(p_key=key, p_action=action, p_payload=payload)).encode(), headers={'apikey': AK, 'Authorization': 'Bearer ' + AK, 'content-type': 'application/json'})
    return urllib.request.urlopen(r, timeout=90).read().decode()[:200]


def upload(last_key_file):
    """Private review list into the admin CRM: kept inside the internal risk graph (rebuilt here by graph.py from the repository's
    research data, as an admin would), read in /admin with the admin key. Email alert (kolaboro_machine 'alert') when it changes."""
    priv = json.load(open(os.path.join(PRIV, 'review.json')))
    here = os.path.dirname(os.path.abspath(__file__))
    import subprocess
    r = subprocess.run([sys.executable, '-I', os.path.join(here, 'graph.py')], capture_output=True, text=True, timeout=300)
    print('graph.py', r.returncode, r.stdout[-200:], r.stderr[-300:])
    if r.returncode != 0:
        sys.exit('graph.py failed: review not uploaded')
    G = json.load(open(os.path.join(here, 'data', 'graph.json')))
    G['sanctions_review'] = priv
    G['alerts'] = [a for a in G.get('alerts', []) if a.get('kind') != 'sanctions screening'] + [
        dict(kind='sanctions screening', what=x['developer'], detail='possible match to review: ' + '; '.join(h['listed_name'] + ' (' + h['list'] + ')' for h in x['hits'][:3])) for x in priv['review']]
    print('graph_put', machine('graph_put', {'graph': G}))
    old = open(last_key_file).read().strip() if os.path.exists(last_key_file) else ''
    if priv['review'] and priv['key'] != old:
        body = 'Daily sanctions screening of developer company names found %d possible matches to review (not published).\nOpen https://kolaboro.com/admin#screen\n\n' % len(priv['review'])
        body += '\n'.join('- ' + x['developer'] + ': ' + '; '.join(h['listed_name'] + ' [' + h['list'] + ' ' + h['ref'] + ']' for h in x['hits'][:3]) for x in priv['review'][:40])
        print('alert', machine('alert', {'title': 'Sanctions screening: %d possible matches to review' % len(priv['review']), 'body': body}))
    open(last_key_file, 'w').write(priv['key'])


if __name__ == '__main__':
    if '--upload' in ARGS:
        upload(arg('--upload'))
    else:
        main()
