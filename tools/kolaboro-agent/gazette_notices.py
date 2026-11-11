#!/usr/bin/env python3
"""Kolaboro official gazette notices about developer companies (batch 21, n21a). No model calls.

Usage: gazette_notices.py OUT_DIR [--named named.json] [--family gleif-family.json] [--prev gazette.json] [--es-days N] [--budget SECONDS]

For developer companies that are identified by an exact legal name in Spain, France or the United Kingdom, lists the notices the
official gazettes carry about that company: type of notice, date and link. Nothing else is copied: no officer names, no text.
  Spain   BORME, Seccion Primera, actos inscritos (Agencia Estatal Boletin Oficial del Estado, boe.es open data API).
          Read day by day; a company is the same when its name is equal apart from capitals, accents, punctuation and the
          legal form (the Registro Mercantil refuses two companies with the same name: Reglamento del Registro Mercantil
          art. 408). Reuse free with attribution (BOE legal notice).
  France  BODACC, annonces commerciales (DILA open API, Licence Ouverte 2.0). French company names are not unique, so a company
          is searched by its SIREN number, taken from its GLEIF record (CC0). No LEI with a SIREN: not searched.
  UK      The Gazette (thegazette.co.uk, Open Government Licence v3.0): company notices found by exact phrase and kept only when
          the company name in the notice is equal (Companies Act 2006 s.66: no two companies with the same name). Personal
          insolvency, deceased estates and director disqualification notices are never read or kept.
Which names: (a) the developer name our pages publish when it is written with a legal form (S.A., S.L., Ltd, PLC...),
(b) the legal name of the developer's GLEIF record (already shown on the developer page), (c) a company name with a legal form in
the research record of a project when it starts with the published developer name. Brand names alone are never searched.

Output: OUT_DIR/gazette.json (public). Incremental: BORME days already read are not read again (state is inside the file);
a Spanish company added later is searched from the first day read after it was added, and its page says from when.
"""
import html, json, os, re, sys, time, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'kolaboro-w'))
from wcommon import norm, candidates, load, has_form

ARGS = sys.argv[1:]
OUT = ARGS[0]
UA = 'KolaboroGazetteWatch/1.0 (+https://kolaboro.com/data-policy)'
NOW = datetime.now(timezone.utc)
TODAY = NOW.strftime('%Y-%m-%d')
T0 = time.time()


def arg(name, d=None):
    return ARGS[ARGS.index(name) + 1] if name in ARGS and ARGS.index(name) + 1 < len(ARGS) else d


BUDGET = int(arg('--budget', '540'))
ES_DAYS = int(arg('--es-days', '365'))
MAXN = 40      # notices kept per developer (newest first); the total is kept too


def fetch(url, accept='*/*', tries=3, pause=0.25, timeout=45):
    for a in range(tries):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': accept}), timeout=timeout)
            b = r.read(); time.sleep(pause); return r.status, b
        except urllib.error.HTTPError as e:
            if e.code in (400, 404): return e.code, b''
            time.sleep(5 * (a + 1))
        except Exception:
            time.sleep(5 * (a + 1))
    return 0, b''


def getj(path, name):
    f = arg(path)
    if f: return json.load(open(f))
    st, b = fetch('https://kolaboro.com/data/' + name + '?v=' + TODAY, 'application/json')
    return json.loads(b) if st == 200 else None


# ------------------------------------------------------------------------------------------------ which companies
CC = {'Spain': 'ES', 'France': 'FR', 'United Kingdom': 'GB'}


def targets():
    named = getj('--named', 'named.json')
    fam = getj('--family', 'gleif-family.json') or {}
    P, IDS, EXTRA = load(HERE)
    byid = {x['id']: x for x in named['projects']}
    T = {}   # slug -> {dv, names: {norm: {n, cc, via, lei?}}}

    def add(slug, dv, n, cc, via, lei=None):
        b = norm(n)
        if len(b.replace(' ', '')) < 4: return
        t = T.setdefault(slug, {'dv': dv, 'names': {}})
        t['names'].setdefault(cc + '|' + b, {'n': n.strip().rstrip('.,'), 'cc': cc, 'via': via, **({'lei': lei} if lei else {})})

    for p in P:
        cc = CC.get(p.get('country')); x = byid.get(IDS.get(p['slug']))
        if not cc or not x or not x.get('dvs') or not x.get('dv'): continue
        dv = x['dv']
        if has_form(dv) and len(candidates(dv)) <= 1:
            add(x['dvs'], dv, dv, cc, 'published')
        nd = norm(dv)
        devs = [p.get('developer') or ''] + sorted(EXTRA.get(p['slug'], set()) - {p.get('developer')})
        for d in devs:
            for n in candidates(d):
                if has_form(n) and nd and (norm(n) == nd or norm(n).startswith(nd + ' ')):
                    add(x['dvs'], dv, n, cc, 'record')
    dvname = {x['dvs']: x['dv'] for x in named['projects'] if x.get('dvs')}
    for slug, v in (fam.get('devs') or {}).items():
        if v.get('country') in ('ES', 'FR', 'GB') and v.get('legal') and slug in dvname:
            add(slug, dvname[slug], v['legal'], v['country'], 'gleif', v.get('lei'))
    return T


# ------------------------------------------------------------------------------------------------ Spain: BORME
ES_ACTS = [  # (label as printed in BORME, kind)
    ('Constitución', 'reg'), ('Nombramientos', 'appt'), ('Ceses/Dimisiones', 'appt'), ('Revocaciones', 'appt'), ('Reelecciones', 'appt'),
    ('Cancelaciones de oficio de nombramientos', 'appt'), ('Modificación de poderes', 'appt'),
    ('Ampliación de capital', 'capital'), ('Reducción de capital', 'capital'), ('Desembolso de dividendos pasivos', 'capital'),
    ('Acuerdo de ampliación de capital social sin ejecutar', 'capital'), ('Emisión de obligaciones', 'capital'),
    ('Cambio de domicilio social', 'address'), ('Cambio de objeto social', 'bylaws'), ('Ampliación del objeto social', 'bylaws'), ('Ampliacion del objeto social', 'bylaws'),
    ('Cambio de denominación social', 'name'), ('Modificaciones estatutarias', 'bylaws'), ('Página web de la sociedad', 'bylaws'),
    ('Declaración de unipersonalidad', 'owner'), ('Pérdida del carácter de unipersonalidad', 'owner'), ('Pérdida del caracter de unipersonalidad', 'owner'), ('Cambio de identidad del socio único', 'owner'),
    ('Disolución', 'dissolution'), ('Extinción', 'dissolution'), ('Reactivación de la sociedad', 'reg'),
    ('Fusión por absorción', 'merger'), ('Fusión por unión', 'merger'), ('Escisión parcial', 'merger'), ('Escisión total', 'merger'), ('Segregación', 'merger'),
    ('Transformación de sociedad', 'bylaws'), ('Situación concursal', 'insolvency'), ('Suspensión de pagos', 'insolvency'), ('Quiebra', 'insolvency'),
    ('Cierre provisional hoja registral', 'registry'), ('Reapertura hoja registral', 'registry'), ('Depósito de cuentas', 'accounts'),
    ('Otros conceptos', 'other'), ('Fe de erratas', 'other')]
ES_RX = re.compile(r'(?:^|\.\s+)(' + '|'.join(re.escape(a) for a, _ in sorted(ES_ACTS, key=lambda x: -len(x[0]))) + r')(?=[\s.:(])')
ES_KIND = dict(ES_ACTS)


def borme_items(d):
    st, b = fetch('https://www.boe.es/datosabiertos/api/borme/sumario/' + d.strftime('%Y%m%d'), 'application/json')
    if st in (400, 404): return []       # no BORME that day
    if st != 200: return None
    s = json.loads(b)['data']['sumario']; items = []
    for diario in s['diario'] if isinstance(s['diario'], list) else [s['diario']]:
        secs = diario['seccion'] if isinstance(diario['seccion'], list) else [diario['seccion']]
        for sec in secs:
            if sec.get('codigo') != 'A': continue
            it = sec.get('item') or []
            items += it if isinstance(it, list) else [it]
    return items


def borme_page(it, want):
    st, b = fetch(it['url_html'], 'text/html')
    if st != 200: return None
    t = b.decode('utf-8', 'replace'); hits = []
    for m in re.finditer(r'<h5 class="articulo">(.*?)</h5>\s*<p class="parrafo">(.*?)</p>', t, re.S):
        name = re.sub(r'^\d+\s*-\s*', '', html.unescape(re.sub(r'<[^>]+>', '', m.group(1))).strip()).rstrip('.').strip()
        if name.endswith(')'): name = re.sub(r'\s*\((?:R\.M\.|EN LIQUIDACION)[^)]*\)$', '', name, flags=re.I)
        b_ = norm(name)
        if b_ not in want: continue
        par = html.unescape(re.sub(r'<[^>]+>', ' ', m.group(2)))
        acts = list(dict.fromkeys(a for a in ES_RX.findall(par)))
        hits.append((b_, acts or ['Otros conceptos']))
    return hits


def spain(want, prev_es):
    """want: {norm: [slugs]}. Returns (rows {slug: [[date, 'borme', label, kind, url]]}, state)."""
    done_to = (prev_es or {}).get('to'); frm = (prev_es or {}).get('from')
    start = (datetime.strptime(done_to, '%Y-%m-%d').date() + timedelta(days=1)) if done_to else (NOW - timedelta(days=ES_DAYS)).date()
    rows, day, last_ok, days, pages = {}, start, done_to, 0, 0
    with ThreadPoolExecutor(max_workers=4) as ex:
        while day <= NOW.date():
            if time.time() - T0 > BUDGET: print('budget reached at', day); break
            if day.weekday() < 5:
                items = borme_items(datetime(day.year, day.month, day.day))
                if items is None: print('BORME summary not reachable', day); break
                res = list(ex.map(lambda it: (it, borme_page(it, want)), items))
                if any(r is None for _, r in res): print('BORME page failed', day); break
                for it, hits in res:
                    for b_, acts in hits:
                        for slug in want[b_]:
                            for a in acts:
                                rows.setdefault(slug, []).append([day.strftime('%Y-%m-%d'), 'borme', a, ES_KIND.get(a, 'other'), it['url_pdf']['texto'] if isinstance(it.get('url_pdf'), dict) else it['url_html']])
                if items: days += 1; pages += len(items)
                print('BORME', day, len(items), sum(len(h) for _, h in res), flush=True)
            last_ok = day.strftime('%Y-%m-%d'); frm = frm or last_ok
            day += timedelta(days=1)
    return rows, {'from': frm, 'to': last_ok, 'days_read_this_run': days, 'pages_read_this_run': pages}


# ------------------------------------------------------------------------------------------------ France: BODACC by SIREN
FR_KIND = {'creation': 'reg', 'immatriculation': 'reg', 'modification': 'change', 'radiation': 'dissolution', 'collective': 'insolvency', 'conciliation': 'insolvency',
           'retablissement': 'insolvency', 'dpc': 'accounts', 'vente': 'sale', 'divers': 'other'}


def siren_of(lei):
    st, b = fetch('https://api.gleif.org/api/v1/lei-records/' + lei, 'application/vnd.api+json')
    if st != 200: return None
    e = json.loads(b)['data']['attributes']['entity']
    ra = e.get('registeredAt', {}).get('id'); rid = re.sub(r'\D', '', e.get('registeredAs') or '')
    return rid[:9] if ra == 'RA000189' and len(rid) >= 9 else None


def france(siren):
    out, off, total = [], 0, None
    while off < 300:
        q = urllib.parse.urlencode({'where': 'registre="%s"' % siren, 'order_by': 'dateparution desc', 'limit': 100, 'offset': off,
                                    'select': 'id,dateparution,familleavis,familleavis_lib,typeavis,url_complete'})
        st, b = fetch('https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records?' + q, 'application/json', pause=0.6)
        if st != 200: return None, None
        j = json.loads(b); total = j.get('total_count', 0)
        for r in j.get('results', []):
            fam = r.get('familleavis') or ''
            lab = (r.get('familleavis_lib') or fam or 'Annonce') + (' (avis rectificatif)' if r.get('typeavis') == 'rectificatif' else ' (annulation)' if r.get('typeavis') == 'annulation' else '')
            url = r.get('url_complete') or ('https://www.bodacc.fr/pages/annonces-commerciales-detail/?q.id=id:' + r['id'])
            out.append([r.get('dateparution'), 'bodacc', lab, FR_KIND.get(fam, 'other'), url])
        off += 100
        if off >= (total or 0): break
    return out, total


# ------------------------------------------------------------------------------------------------ UK: The Gazette
GZ = 'https://www.thegazette.co.uk'
UK_SKIP = re.compile(r'disqualif|bankrupt|deceased|personal|individual|sequestration|trust deed|debt relief', re.I)


def uk_kind(code, cat):
    if code.startswith('24'): return 'insolvency'
    c = cat.lower()
    if 'capital' in c: return 'capital'
    if 'merger' in c or 'takeover' in c or 'transfer' in c: return 'merger'
    if 'struck' in c or 'dissol' in c or 'restor' in c: return 'dissolution'
    return 'other'


def gazette(name):
    want = norm(name)
    phrase = re.sub(r'[\s,]+(?:limited|ltd\.?|plc|llp|public limited company)\.?\s*$', '', name, flags=re.I).strip()
    url = GZ + '/all-notices/notice/data.feed?' + urllib.parse.urlencode({'text': '"%s"' % phrase, 'results-page-size': 100, 'categorycode-all': 'all'})
    st, b = fetch(url, 'application/atom+xml', pause=2.0)
    if st != 200: return None
    hits = []
    for e in re.findall(r'<entry>(.*?)</entry>', b.decode('utf-8', 'replace'), re.S):
        code = (re.search(r'<f:notice-code>(\d+)</f:notice-code>', e) or [None, ''])[1]
        if not (code.startswith('24') or code.startswith('26')): continue    # corporate insolvency and companies notices only
        cat = html.unescape((re.search(r'<category term="([^"]+)"', e) or [None, ''])[1])
        if not cat or UK_SKIP.search(cat): continue
        title = html.unescape((re.search(r'<title>(.*?)</title>', e, re.S) or [None, ''])[1]).strip()
        body = html.unescape(re.sub(r'<[^>]+>', '', (re.search(r'<content[^>]*>(.*?)</content>', e, re.S) or [None, ''])[1]))
        nm = re.search(r'Name of Company:\s*([^.…]+?(?:LIMITED|LTD|PLC|LLP))', body, re.I)
        if not (norm(title) == want or (nm and norm(nm.group(1)) == want) or norm(body.split('…')[0]) == want): continue
        link = (re.search(r'<link href="(https://www\.thegazette\.co\.uk/notice/[^"/]+)"/>', e) or [None, ''])[1]
        date = (re.search(r'<published>([^<]{10})', e) or [None, ''])[1]
        if link and date: hits.append([date, 'gazette', cat, uk_kind(code, cat), link])
    return hits


# ------------------------------------------------------------------------------------------------ run
def main():
    os.makedirs(OUT, exist_ok=True)
    pf = arg('--prev'); prev = json.load(open(pf)) if pf and os.path.exists(pf) else None
    if prev is None and not pf:
        st, b = fetch('https://kolaboro.com/data/gazette.json?v=' + TODAY, 'application/json')
        prev = json.loads(b) if st == 200 and b[:1] == b'{' else None
    prev = prev or {}
    T = targets()
    pdevs = prev.get('devs') or {}
    devs = {}
    for slug, t in sorted(T.items()):
        devs[slug] = {'names': sorted(t['names'].values(), key=lambda x: (x['cc'], x['n'])), 'notices': [], 'total': 0, 'searched': {}}
    # Spain
    want = {}
    for slug, t in T.items():
        for k, v in t['names'].items():
            if v['cc'] == 'ES': want.setdefault(k.split('|', 1)[1], []).append(slug)
    pst = prev.get('state') or {}
    pes = pst.get('es')
    # a company not searched before has no history on file: its BORME search starts with the days read in this run
    since = pst.get('es_names') or {}
    if isinstance(since, list): since = {k: (pes or {}).get('from') for k in since}
    es_rows, es_state = (spain(want, pes) if want else ({}, pes or {}))
    first_day = (datetime.strptime(pes['to'], '%Y-%m-%d').date() + timedelta(days=1)).strftime('%Y-%m-%d') if pes and pes.get('to') else es_state.get('from')
    since = {k: (since.get(k) or first_day) for k in want}
    es_ok = bool(es_state.get('to'))
    for slug in devs:
        old = [r for r in (pdevs.get(slug) or {}).get('notices_all', []) if r[1] == 'borme'] if pes else []
        devs[slug]['_all'] = old + es_rows.get(slug, [])
        mine = [since[norm(n['n'])] for n in devs[slug]['names'] if n['cc'] == 'ES' and since.get(norm(n['n']))]
        if mine and es_ok and min(mine) <= es_state['to']:
            devs[slug]['searched']['borme'] = {'from': min(mine), 'to': es_state.get('to')}
    # France
    fr_n = 0
    for slug, d in devs.items():
        for n in d['names']:
            if n['cc'] != 'FR' or not n.get('lei'): continue
            sir = siren_of(n['lei'])
            if not sir: continue
            rows, total = france(sir)
            if rows is None:
                rows = [r for r in (pdevs.get(slug) or {}).get('notices_all', []) if r[1] == 'bodacc']; print('BODACC not reachable, kept', len(rows))
            else:
                d['searched']['bodacc'] = {'to': TODAY}; fr_n += 1
            n['siren'] = sir
            d['_all'] += rows
    # UK
    uk_n = 0
    for slug, d in devs.items():
        for n in d['names']:
            if n['cc'] != 'GB': continue
            rows = gazette(n['n'])
            if rows is None:
                rows = [r for r in (pdevs.get(slug) or {}).get('notices_all', []) if r[1] == 'gazette']; print('Gazette not reachable, kept', len(rows))
            else:
                d['searched']['gazette'] = {'to': TODAY}; uk_n += 1
            d['_all'] += rows
    out_devs = {}
    for slug, d in devs.items():
        seen, allr = set(), []
        for r in sorted(d.pop('_all'), key=lambda r: (r[0], r[2]), reverse=True):
            k = tuple(r)
            if k in seen: continue
            seen.add(k); allr.append(r)
        if not d['searched']: continue        # nothing could be searched for this developer: say nothing
        d['total'] = len(allr); d['notices_all'] = allr[:200]; d['notices'] = allr[:MAXN]
        del d['notices']                      # one list only (notices_all, newest first, capped at 200)
        out_devs[slug] = d
    out = {
        'version': 'gazette-1', 'updated': TODAY, 'generated_at': NOW.strftime('%Y-%m-%dT%H:%M:%SZ'),
        'note': 'Notices that official gazettes carry about developer companies identified by an exact legal name: type of notice, date and link only. No officer names or notice text are copied. A notice is a routine legal publication (appointments, capital changes, accounts, mergers, insolvency steps); it is not a finding about the company. Developers not listed here were not searched: their pages give a brand name, or their country has no open gazette we can read.',
        'method': [
            'Names searched: the developer name our pages publish when it carries a legal form; the legal name of its GLEIF record; a company name with a legal form in a project record when it starts with the published developer name. Brand names alone are never searched.',
            'Spain: every page of BORME Seccion Primera (actos inscritos) is read day by day; an entry counts when the company name is equal apart from capitals, accents, punctuation and the legal form.',
            'France: BODACC is searched by the SIREN number of the GLEIF record, not by name.',
            'United Kingdom: The Gazette is searched by exact phrase; a notice counts when the company name in it is equal. Corporate insolvency (codes 24xx) and companies notices (26xx) only. Personal insolvency, deceased estates and director disqualification notices are never read.'],
        'sources': [
            {'id': 'borme', 'country': 'ES', 'name': 'BORME, Boletin Oficial del Registro Mercantil, Seccion Primera', 'publisher': 'Agencia Estatal Boletin Oficial del Estado', 'url': 'https://www.boe.es/diario_borme/', 'api': 'https://www.boe.es/datosabiertos/', 'licence': 'Reuse free with attribution (BOE legal notice)', 'licence_url': 'https://www.boe.es/informacion/aviso_legal/', 'from': es_state.get('from'), 'to': es_state.get('to'), 'companies': len(want)},
            {'id': 'bodacc', 'country': 'FR', 'name': 'BODACC, Bulletin officiel des annonces civiles et commerciales', 'publisher': 'DILA, Direction de l\'information legale et administrative', 'url': 'https://www.bodacc.fr/', 'api': 'https://bodacc-datadila.opendatasoft.com/explore/dataset/annonces-commerciales/', 'licence': 'Licence Ouverte 2.0', 'licence_url': 'https://www.etalab.gouv.fr/licence-ouverte-open-licence/', 'companies': fr_n},
            {'id': 'gazette', 'country': 'GB', 'name': 'The Gazette', 'publisher': 'The Stationery Office for HM Government', 'url': 'https://www.thegazette.co.uk/', 'api': 'https://www.thegazette.co.uk/data', 'licence': 'Open Government Licence v3.0', 'licence_url': 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/', 'companies': uk_n}],
        'kinds': ['change', 'appt', 'capital', 'insolvency', 'accounts', 'merger', 'address', 'bylaws', 'name', 'owner', 'dissolution', 'reg', 'registry', 'sale', 'other'],
        'row': ['date', 'source', 'type as printed', 'kind', 'link'],
        'state': {'es': {k: es_state.get(k) for k in ('from', 'to')}, 'es_names': since},
        'devs': out_devs,
    }
    json.dump(out, open(os.path.join(OUT, 'gazette.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    print('developers', len(out_devs), 'notices', sum(d['total'] for d in out_devs.values()), 'ES names', len(want), 'FR', fr_n, 'UK', uk_n, 'seconds', int(time.time() - T0))


if __name__ == '__main__':
    main()
