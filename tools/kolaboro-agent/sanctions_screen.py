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

Batch 21 (n21a): the same developer company names are also compared with official regulator warning lists of firms that offer
financial services or investments without authorisation (FCA United Kingdom, AMF France, MAS Singapore, SFC Hong Kong, FINMA
Switzerland, Central Bank of Ireland, US SEC). These lists are read at most once a week (--warn-cache FILE keeps the names read
between daily runs). Public result: "warnings" in sanctions.json = lists read (with their dates) and the developer pages with
NO possible match. Possible matches go to the same private review list (review.json "warn_review"), never published.
Listed names that could be a private person's are skipped, like developer names. Nothing from the lists is republished.

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
import csv, io, json, os, re, sys, time, unicodedata, urllib.request, urllib.parse, difflib, hashlib
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


# ------------------------------------------------------------------------------------------------ regulator warning lists (n21a)
WARN = [
    {'id': 'fca', 'name': 'FCA warnings about unauthorised firms', 'short': 'FCA (UK)', 'country': 'GB', 'publisher': 'Financial Conduct Authority, United Kingdom',
     'page': 'https://www.fca.org.uk/consumers/warning-list-unauthorised-firms', 'terms': 'https://www.fca.org.uk/legal',
     'how': 'Titles of the warning pages (fca.org.uk/news/warnings/...) as listed in the FCA sitemap',
     'files': ['https://www.fca.org.uk/sitemap-main.xml?page=1', 'https://www.fca.org.uk/sitemap-main.xml?page=2']},
    {'id': 'amf', 'name': 'AMF blacklists of unauthorised entities (listes noires)', 'short': 'AMF (France)', 'country': 'FR', 'publisher': 'Autorite des marches financiers, France',
     'page': 'https://www.data.gouv.fr/datasets/listes-noires-des-entites-non-autorisees-a-proposer-des-produits-ou-services-financiers-en-france', 'terms': 'https://www.etalab.gouv.fr/licence-ouverte-open-licence/',
     'licence': 'Licence Ouverte 2.0', 'how': 'Open data file on data.gouv.fr',
     'files': ['https://www.data.gouv.fr/api/1/datasets/641d5dab1d84b530f7720b08/']},
    {'id': 'mas', 'name': 'MAS Investor Alert List', 'short': 'MAS (Singapore)', 'country': 'SG', 'publisher': 'Monetary Authority of Singapore',
     'page': 'https://www.mas.gov.sg/investor-alert-list', 'terms': 'https://www.mas.gov.sg/terms-of-use', 'how': 'The list as served by the MAS website search',
     'files': ['https://www.mas.gov.sg/api/v1/ialsearch?json.nl=map&wt=json&sort=date_dt%20desc&q=*:*&rows=5000&start=0']},
    {'id': 'sfc', 'name': 'SFC Alert List', 'short': 'SFC (Hong Kong)', 'country': 'HK', 'publisher': 'Securities and Futures Commission, Hong Kong',
     'page': 'https://www.sfc.hk/en/alert-list', 'terms': 'https://www.sfc.hk/en/Quick-links/Others/Copyright-and-disclaimer', 'how': 'The table on the Alert List page',
     'files': ['https://www.sfc.hk/en/alert-list']},
    {'id': 'finma', 'name': 'FINMA warning list', 'short': 'FINMA (Switzerland)', 'country': 'CH', 'publisher': 'Swiss Financial Market Supervisory Authority',
     'page': 'https://www.finma.ch/en/finma-public/warnungen/warnliste/', 'terms': 'https://www.finma.ch/en/legal-information/', 'how': 'The list as served by the FINMA website',
     'files': ['POST https://www.finma.ch/en/api/search/getresult ds={1C6B8731-638C-4003-A93C-A625BF7A6800}&Order=4']},
    {'id': 'cbi', 'name': 'Central Bank of Ireland warnings on unauthorised firms', 'short': 'Central Bank of Ireland', 'country': 'IE', 'publisher': 'Central Bank of Ireland',
     'page': 'https://www.centralbank.ie/regulation/how-we-regulate/authorisation/unauthorised-firms/search-unauthorised-firms', 'terms': 'https://www.centralbank.ie/terms-and-conditions',
     'how': 'The list on the search page', 'files': ['https://www.centralbank.ie/regulation/how-we-regulate/authorisation/unauthorised-firms/search-unauthorised-firms']},
    {'id': 'sec', 'name': 'SEC PAUSE list of unregistered soliciting entities', 'short': 'SEC (USA)', 'country': 'US', 'publisher': 'US Securities and Exchange Commission',
     'page': 'https://www.sec.gov/enforce/public-alerts', 'terms': 'https://www.sec.gov/privacy#dissemination', 'licence': 'US Government work, public domain',
     'how': 'The table on the public alerts pages', 'files': ['https://www.sec.gov/enforce/public-alerts']},
]
NOT_READ = [
    {'id': 'cnmv', 'name': 'CNMV warnings (entidades advertidas)', 'country': 'ES', 'page': 'https://www.cnmv.es/portal/Advertencias/Entidades-No-Autorizadas', 'why': 'The page refuses automated readers and no open data file was found. Check it by hand.'},
    {'id': 'iosco', 'name': 'IOSCO I-SCAN', 'country': 'INT', 'page': 'https://www.iosco.org/i-scan/', 'why': 'The page refuses automated readers; its API needs a signed access agreement. Check it by hand.'},
]
TLD2 = set('com co org net gov ac edu ltd'.split())


def wname(s):
    """A listed entry reduced to a name: websites and email addresses become their main label (www.acme-invest.co.uk -> acme invest)."""
    s = (s or '').strip()
    s = re.sub(r'\((?:clone|potential clone|new|chinese name only)[^)]*\)', ' ', s, flags=re.I)
    s = re.sub(r'^\(?[ivx]{1,4}\)\s*', '', s)
    if '@' in s and ' ' not in s:
        s = s.split('@', 1)[1]
    m = re.match(r'^(?:https?://)?(?:www\.)?([a-z0-9][a-z0-9.-]*\.[a-z]{2,24})(?:[/?#:].*)?$', s.strip().lower())
    if m:
        lab = m.group(1).split('.')
        lab = lab[:-1]
        if len(lab) > 1 and lab[-1] in TLD2:
            lab = lab[:-1]
        s = ' '.join(lab[-1:]) if lab else ''
        s = re.sub(r'[-_]+', ' ', s)
    return s.strip()


def split_names(s, seps=r';|\n|<br\s*/?>| / '):
    return [x for x in (wname(re.sub(r'<[^>]+>', ' ', p)) for p in re.split(seps, s or '')) if x]


def w_fca(bodies):
    names, dates = [], []
    for b in bodies:
        if not b:
            raise RuntimeError('sitemap part missing')
        for m in re.finditer(r'<loc>https://www\.fca\.org\.uk/news/warnings/([^<]+)</loc>(?:<lastmod>(\d{4}-\d{2}-\d{2}))?', b.decode('utf-8', 'replace')):
            slug = urllib.parse.unquote(m.group(1)).strip('/')
            nm = re.sub(r'-+', ' ', slug)
            nm = re.split(r'\bclone\b', nm)[0].strip() or nm
            names.append((nm, slug[:80], 'unauthorised firm warning'))
            if m.group(2):
                dates.append(m.group(2))
    return names, len(names), (max(dates) if dates else None)


def w_amf(bodies):
    d = json.loads(bodies[0])
    res = [r for r in d.get('resources', []) if (r.get('format') or '').lower() == 'csv']
    if not res:
        raise RuntimeError('no csv resource')
    _, b = fetch(res[0]['url'])
    if not b:
        raise RuntimeError('csv download failed')
    rows = list(csv.reader(io.StringIO(b.decode('utf-8-sig', 'replace')), delimiter=';'))
    names = [(wname(r[0]), '', r[1]) for r in rows[1:] if len(r) >= 3 and wname(r[0])]
    dates = [r[2][:10] for r in rows[1:] if len(r) >= 3 and re.match(r'\d{4}-\d{2}-\d{2}', r[2])]
    return names, len(rows) - 1, (max(dates) if dates else None)


def w_mas(bodies):
    docs = json.loads(bodies[0])['response']['docs']
    names, dates = [], []
    for x in docs:
        for k in ('unregulatedpersons_s', 'alternativename_s', 'formername_s'):
            for nm in split_names(x.get(k) or '', r';|\n|,(?=\s)'):
                names.append((nm, str(x.get('id', '')), 'investor alert'))
        if x.get('date_dt'):
            dates.append(x['date_dt'][:10])
    return names, len(docs), (max(dates) if dates else None)


def w_sfc(bodies):
    t = bodies[0].decode('utf-8', 'replace')
    i = t.find('tableCompanys')
    names, dates, n = [], [], 0
    for r in re.findall(r'<tr[^>]*>(.*?)</tr>', t[i:] if i >= 0 else '', re.S):
        m = re.search(r'<a href="https://www\.sfc\.hk/en/alert-list/(\d+)">(.*?)</a>.*?data-date="(\d{4}-\d{2}-\d{2})"', r, re.S)
        if not m:
            continue
        n += 1
        dates.append(m.group(3))
        for nm in split_names(html_unescape(m.group(2))):
            names.append((nm, m.group(1), 'alert list'))
    return names, n, (max(dates) if dates else None)


def w_finma(bodies):
    items = json.loads(bodies[0]).get('Items', [])
    names, dates = [], []
    for x in items:
        for nm in split_names(x.get('Title') or ''):
            names.append((nm, '', 'warning list'))
        m = re.match(r'(\d{2})\.(\d{2})\.(\d{4})', x.get('Date') or '')
        if m:
            dates.append('%s-%s-%s' % (m.group(3), m.group(2), m.group(1)))
    return names, len(items), (max(dates) if dates else None)


def w_cbi(bodies):
    t = bodies[0].decode('utf-8', 'replace')
    names, dates = [], []
    for m in re.finditer(r'"firmName":\s*decodeTitle\("((?:[^"\\]|\\.)*)"\).*?"warningDate":\s*"(\d{2})/(\d{2})/(\d{4})"', t, re.S):
        for nm in split_names(html_unescape(m.group(1))):
            names.append((nm, '', 'unauthorised firm warning'))
        dates.append('%s-%s-%s' % (m.group(4), m.group(3), m.group(2)))
    return names, len(dates), (max(dates) if dates else None)


def w_sec(bodies):
    names, n, page, b = [], 0, 0, bodies[0]
    while b and page < 40:
        rows = re.findall(r'<tr class="pause-list-page-row">.*?<a href="[^"]*"[^>]*>(.*?)</a>', b.decode('utf-8', 'replace'), re.S)
        if not rows:
            break
        for r in rows:
            n += 1
            for nm in split_names(html_unescape(r)):
                names.append((nm, '', 'PAUSE list'))
        page += 1
        time.sleep(1.5)
        _, b = fetch('https://www.sec.gov/enforce/public-alerts?page=%d' % page, timeout=60)
    return names, n, None


def html_unescape(s):
    import html as _h
    return _h.unescape(s)


WPARSE = {'fca': w_fca, 'amf': w_amf, 'mas': w_mas, 'sfc': w_sfc, 'finma': w_finma, 'cbi': w_cbi, 'sec': w_sec}


def fetch_any(spec):
    if spec.startswith('POST '):
        _, url, body = spec.split(' ', 2)
        for i in range(2):
            try:
                r = urllib.request.urlopen(urllib.request.Request(url, data=body.encode(), headers={'User-Agent': UA, 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded'}), timeout=120)
                return r.read()
            except Exception as e:
                print('fetch failed', url[:90], str(e)[:120]); time.sleep(10)
        return None
    return fetch(spec, timeout=120)[1]


def read_warning_lists(cache_file):
    """(index {id: [(name, ref, kind)]}, meta list, date read). Read at most once every 6 days when a cache file is given."""
    if cache_file and os.path.exists(cache_file):
        try:
            c = json.load(open(cache_file))
            if c.get('read', '') > (NOW - __import__('datetime').timedelta(days=6)).strftime('%Y-%m-%d') and c.get('v') == 1:
                print('warning lists: using the copy read on', c['read'])
                return {k: [tuple(x) for x in v] for k, v in c['index'].items()}, c['meta'], c['read']
        except Exception as e:
            print('warning cache unreadable', str(e)[:80])
    index, meta = {}, []
    for L in WARN:
        m = {k: L[k] for k in ('id', 'name', 'short', 'country', 'publisher', 'page', 'terms', 'how') if k in L}
        if L.get('licence'):
            m['licence'] = L['licence']
        try:
            bodies = [fetch_any(u) for u in L['files']]
            if not bodies[0]:
                raise RuntimeError('download failed')
            names, n, date = WPARSE[L['id']](bodies)
            names = [(a, b, c) for (a, b, c) in names if a and not maybe_person(a)]
            if n < 20 or len(names) < 20:
                raise RuntimeError('too few entries (%d)' % n)
            index[L['id']] = names
            m.update(ok=True, list_date=date, entries=n, names=len(names))
        except Exception as e:
            m.update(ok=False, error=str(e)[:120])
        meta.append(m)
        print('warning list', L['id'], m.get('ok'), m.get('entries'), m.get('names'), m.get('list_date'), m.get('error', ''))
    if cache_file and index:
        json.dump({'v': 1, 'read': TODAY, 'index': index, 'meta': meta}, open(cache_file, 'w'), ensure_ascii=False)
    return index, meta, TODAY


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
            md = re.match(r'^(\d{2})/(\d{2})/(\d{4})$', date or '')
            if md:
                date = '%s-%s-%s' % (md.group(3), md.group(2), md.group(1))
            index[L['id']] = names
            m.update(ok=True, list_date=date, entities=n, names=len(names), sha256=hashlib.sha256(b''.join(x or b'' for x in bodies)).hexdigest())
        except Exception as e:
            m.update(ok=False, error=str(e)[:120])
        meta.append(m)
        print(L['id'], m.get('ok'), m.get('entities'), m.get('list_date'), m.get('error', ''))
    if not index:
        sys.exit('no list could be read')
    clean, review, skipped = screen(devs, index)
    windex, wmeta, wread = ({}, [], None) if '--no-warnings' in ARGS else read_warning_lists(arg('--warn-cache'))
    wclean, wreview, _ = screen(devs, windex) if windex else ([], [], 0)
    pub = {
        'version': 'sanctions-1', 'updated': TODAY, 'generated_at': NOW.strftime('%Y-%m-%dT%H:%M:%SZ'),
        'note': 'Developer companies in Kolaboro\'s named project data screened by name against the entity entries of official sanctions lists. Listed here: the developer pages whose company name had no possible match. Names that could be a private person\'s are not screened. A name check is not an identity check: no match does not prove a company is not sanctioned (it may trade under another name), and a similar name is not the same company.',
        'method': 'Names lower-cased, accents and punctuation removed, legal forms dropped; possible match when the cores are equal, when all words of a core of two or more words appear in a listed name with at most two more words, or when the character similarity is at least 0.92 for cores of 8 letters or more. Entity entries only (companies, groups, organisations); individuals, vessels and aircraft are not compared. Possible matches go to a person for review and are not published.',
        'lists': [{k: v for k, v in m.items() if k != 'sha256'} for m in meta],
        'no_match': sorted(clean),
    }
    if windex:
        pub['warnings'] = {
            'updated': wread,
            'note': 'The same developer company names compared with official regulator warning lists of firms that offer financial services or investments without authorisation. Listed here: the developer pages whose company name had no possible match on the lists that could be read. A warning list is about financial services, not about building homes; no match is not an endorsement, and a similar name is not the same company. Possible matches are reviewed by a person and are not published. Nothing from the lists is republished here.',
            'method': 'Same name comparison as for the sanctions lists. Website and email entries on a list are reduced to their main label. Listed names that could be a private person\'s are skipped. Lists are read at most once a week.',
            'lists': wmeta, 'not_read': NOT_READ, 'no_match': sorted(wclean),
        }
    json.dump(pub, open(os.path.join(OUT, 'sanctions.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    priv = {'generated_at': pub['generated_at'], 'lists': [{'id': m['id'], 'ok': m.get('ok'), 'list_date': m.get('list_date'), 'entities': m.get('entities')} for m in meta],
            'screened': len(devs) - skipped, 'not_screened_person_like': skipped, 'no_match': len(clean), 'review': review,
            'warn': {'read': wread, 'lists': [{'id': m['id'], 'ok': m.get('ok'), 'list_date': m.get('list_date'), 'entries': m.get('entries')} for m in wmeta], 'no_match': len(wclean)},
            'warn_review': wreview,
            'key': hashlib.sha256(json.dumps([[r['slug'], [h['ref'] for h in r['hits']]] for r in review] + [[r['slug'], [h['list'] + h['listed_name'] for h in r['hits']]] for r in wreview]).encode()).hexdigest()[:16]}
    json.dump(priv, open(os.path.join(PRIV, 'review.json'), 'w'), ensure_ascii=False, indent=0)
    print('developers', len(devs), 'screened', len(devs) - skipped, 'no match', len(clean), 'to review', len(review))
    print('warning lists read', len(windex), 'no match', len(wclean), 'to review', len(wreview))


SB = 'https://oykcsmextclpdnugixqz.supabase.co/rest/v1/rpc/kolaboro_machine'
AK = 'sb_publishable_WWMM9pbZfP4hJosLJlTobg_lWFGoJ3X'


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
    G['alerts'] += [dict(kind='sanctions screening', what=x['developer'], detail='regulator warning list, possible match to review: ' + '; '.join(h['listed_name'] + ' (' + h['list'] + ')' for h in x['hits'][:3])) for x in priv.get('warn_review', [])]
    print('graph_put', machine('graph_put', {'graph': G}))
    old = open(last_key_file).read().strip() if os.path.exists(last_key_file) else ''
    allrev = priv['review'] + priv.get('warn_review', [])
    if allrev and priv['key'] != old:
        body = 'Screening of developer company names found %d possible matches to review (%d sanctions lists, %d regulator warning lists; not published).\nOpen https://kolaboro.com/admin#screen\n\n' % (len(allrev), len(priv['review']), len(priv.get('warn_review', [])))
        body += '\n'.join('- ' + x['developer'] + ': ' + '; '.join(h['listed_name'] + ' [' + h['list'] + ' ' + h['ref'] + ']' for h in x['hits'][:3]) for x in allrev[:40])
        print('alert', machine('alert', {'title': 'Screening: %d possible matches to review' % len(allrev), 'body': body}))
    open(last_key_file, 'w').write(priv['key'])


if __name__ == '__main__':
    if '--upload' in ARGS:
        upload(arg('--upload'))
    else:
        main()
