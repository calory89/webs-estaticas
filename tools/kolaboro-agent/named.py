#!/usr/bin/env python3
"""Named project index for kolaboro.com project and developer pages (batch 8, "public name, facts only").

Usage: named.py <bali-cases.json just built> <out named.json>

For every tracked project with a public id: the project name, developer, market, area, the pages we read, and the
sourced facts the research agent stored (claims with their source link and status, evidence per check, what the
developer publishes, structured facts, public reports with their link). The worker (_worker.js/kbx_seo.js) renders
/projects/<slug>/ and /developers/<slug>/ from this file plus the public dataset; new projects appear automatically
on the next agent run because ids are computed exactly as agent.public_cases() computes them.

Legal-safety filters applied here (and again in the worker):
- free-text items that mention a person's role (founder, owner, director, CEO...) are dropped: private individuals'
  names are never published;
- items containing opinion words in any of our 8 languages (scam, fraud, avoid, estafa, Betrug, arnaque...) are dropped:
  pages state sourced facts, never verdicts;
- public-report items are classified with strict patterns and published as a neutral category plus the source link,
  never as our wording; context items about other entities ("not about ...") are skipped.
"""
import json, os, re, sys, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, 'data')
sys.path.insert(0, HERE)
from agent import PREFIX  # noqa: E402  (same id prefixes as the public dataset)

ROLE = re.compile(r"\b(founders?|co-?founders?|ceo|chief executive|managing director|directors?|owner|chairman|chairwoman|president|"
                  r"shareholders?|mr|mrs|ms|dr|sheikh|his|her|wife|husband|son|daughter|brother|sister|family)\b\.?", re.I)
OPINION = re.compile(r"(scam|fraud|fraudulent|ponzi|swindl|rip-?off|avoid|beware|dodgy|shady|crook|"
                     r"estafa|fraude|timo|stafador|betrug|betrüg|abzocke|arnaque|escroquer|escroc|oplichting|oplichter|"
                     r"мошен|обман|афер|骗|诈骗|احتيال|نصب)", re.I)
FLAG_RX = [('criminal', r'\b(prosecutor|prosecuted|criminal (?:case|complaint|charges?|investigation)|indicted|charged with)\b'),
           ('legal', r'\b(sued|lawsuit|litigation|legal action|arbitration|court (?:case|ruling|order|judgment|judgement)|judgment against|class action)\b'),
           ('financial', r'\b(bankrupt\w*|insolven\w*|liquidation|receivership|administration order|missed (?:a |an )?(?:bond|interest|coupon) payment|default(?:ed)? on)\b'),
           ('stalled', r'\b(construction (?:halted|stalled|stopped|suspended)|work (?:stopped|halted)|abandoned (?:site|project)|stalled)\b'),
           ('regulator', r'\b(regulator\w*|superintendencia|licen[cs]e (?:revoked|suspended)|fined by|sanctioned by|enforcement action|probe)\b'),
           ('delay', r'\b(delayed|delays|missed (?:the )?(?:completion|handover)|years? late|months? late|overdue)\b')]
FACT_KEEP = ('developer_founded', 'developer_hq', 'developer_company', 'developer_projects_delivered', 'developer_units_delivered', 'listed_or_audited',
             'construction_start', 'handover_promised', 'original_handover', 'delay_months', 'unit_types', 'size_min_m2', 'size_max_m2', 'price_min',
             'price_max', 'currency', 'deposit_pct', 'payment_plan', 'foreign_ownership', 'service_charge', 'permit_authority', 'brand', 'lat', 'lng')
# Pin corrections checked by hand (n19f, 9 Nov 2026). The research record had these two Birmingham pins one degree of latitude
# too far north (Peak District). Sources: OpenStreetMap "Former Police Station > 59x Apartments Conversion (Priors Gate)",
# Steelhouse Lane B4 6QA (developer page: former Steelhouse Lane Police Headquarters); postcodes.io B5 7AY, the postcode on
# investinplc.com/developments/boulevard-birmingham/. Applied after the research facts so a later research run cannot undo them.
PIN_FIX = {'BHX-002': (52.4843, -1.8933), 'BHX-003': (52.4681, -1.9000)}
NO_DEV = re.compile(r'^\s*(not |unknown|n/?a\b|none\b|unnamed|undisclosed|private\b)', re.I)
GIVEN = set('''Aaron Adam Adrian Ahmed Alan Alex Alexander Ali Andre Andrea Andrew Andrey Anna Anthony Antonio Carlos Charles Chris Christian Daniel David Dmitry Eduardo Elena Eric Fernando Francisco Frank Frederic Gary George Gilles Hans Igor Ivan Jack Jairo Jako James Jan Javier Jean Jeffrey John Jorge Jose Joseph Juan Kaweh Kevin Luis Marco Maria Mario Mark Martin Matthew Mehmet Mert Michael Mohamed Mohammed Nicolas Oleg Omar Paul Pedro Peter Pierre Rafael Richard Robert Roberto Sam Sergey Sonia Stefan Steven Sunny Thomas Tihomir Tom Victor Vladimir Wilcko William Yuri'''.split())


def slugify(s):
    s = unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')[:80]


def clean(t, n=400):
    t = re.sub(r'\s+', ' ', str(t or '')).strip()
    return t[:n].rstrip() + ('...' if len(t) > n else '')


def ok_text(t):
    return bool(t) and not ROLE.search(t) and not OPINION.search(t)


def dev_primary(raw):
    """The developer's company name only: no parenthetical notes (they can name founders), no partner lists."""
    if not raw or NO_DEV.search(raw):
        return None
    s = re.split(r"\s\(|;|,\s(?!(?:Ltd|Inc|LLC|L\.L\.C|S\.A|S\.L|SA|SL|Co|Corp|Bhd|Sdn|PLC|JSC|GmbH|B\.V|N\.V|Pvt|Pte|Kft|Zrt|d\.o\.o|A\.Ş)\b)|\s-\s|\swith\s", raw)[0].strip(' ,')
    if not s or NO_DEV.search(s) or len(s) < 2:
        return None
    # a bare "Firstname Lastname" is most likely a private individual: not published
    toks = s.split()
    if 2 <= len(toks) <= 3 and all(re.fullmatch(r"[A-Z][a-zà-ÿ'-]+", x) for x in toks) and toks[0] in GIVEN and not set(toks) & {'Group', 'Limited', 'Villas', 'Monaco', 'Homes', 'Development', 'Developments', 'Properties', 'Realty', 'Estates', 'Holdings', 'Blanche'}:
        return None
    return s


def main(cases_path, out_path):
    projects = json.load(open(os.path.join(HERE, 'projects.json')))['projects'] + json.load(open(os.path.join(HERE, 'projects-world.json'))).get('projects', [])
    latest = json.load(open(os.path.join(DATA, 'latest.json'))) if os.path.exists(os.path.join(DATA, 'latest.json')) else {}
    regw = (json.load(open(os.path.join(DATA, 'registry-watch.json'))) if os.path.exists(os.path.join(DATA, 'registry-watch.json')) else {}).get('projects', {})
    cases = {c['id']: c for c in json.load(open(cases_path)).get('cases', [])}
    n, out, seen_slug, dropped = {}, [], set(), {'role': 0, 'opinion': 0, 'id_mismatch': 0}
    for p in sorted(projects, key=lambda x: x.get('market', 'Bali') != 'Bali'):   # identical ordering to agent.public_cases()
        mk = p.get('market', 'Bali'); n[mk] = n.get(mk, 0) + 1
        pid = '%s-%03d' % (PREFIX.get(mk, mk[:3].upper()), n[mk])
        c = cases.get(pid)
        if not c or c.get('market') != mk or c.get('units') != (p.get('seed') or {}).get('units'):   # same id, same market, same unit count: the same record
            dropped['id_mismatch'] += 1; continue
        slug = slugify(p.get('slug') or p.get('name')) or pid.lower()
        if slug in seen_slug: slug = slug + '-' + pid.lower()
        seen_slug.add(slug)

        def keep(t):
            t = clean(t)
            if not t: return None
            if ROLE.search(t): dropped['role'] += 1; return None
            if OPINION.search(t): dropped['opinion'] += 1; return None
            return t
        dev = dev_primary(p.get('developer'))
        ev = {}
        for k, v in (p.get('evidence') or {}).items():
            t = keep(v)
            if t: ev[{'no_guaranteed_returns': 'returns_ok', 'returns': 'returns_ok'}.get(k, k)] = t
        cl = []
        for x in p.get('claims') or []:
            if not isinstance(x, dict): continue
            t = keep(x.get('claim')); src = x.get('source') if isinstance(x.get('source'), str) and x.get('source', '').startswith('http') else None
            if t and src: cl.append([t, str(x.get('status') or 'unverified').lower(), clean(x.get('by'), 80) if ok_text(x.get('by')) else None, src])
        fl = []
        for f in p.get('flags') or []:
            if not isinstance(f, dict): continue
            t = (f.get('text') or '').lower(); src = f.get('source')
            if not (isinstance(src, str) and src.startswith('http')) or re.search(r'not about|context[,:]', t): continue
            cat = next((k for k, rx in FLAG_RX if re.search(rx, t)), None)
            if cat and [cat, src] not in fl: fl.append([cat, src])
        fx = {}
        for k in FACT_KEEP:
            v = (p.get('facts') or {}).get(k)
            if v in (None, '', []): continue
            if isinstance(v, str):
                v = keep(v)
                if not v: continue
            if isinstance(v, list): v = [clean(x, 80) for x in v if isinstance(x, str) and ok_text(x)][:12]
            fx[k] = v
        if pid in PIN_FIX: fx['lat'], fx['lng'] = PIN_FIX[pid]
        lt = latest.get(p.get('slug')) or {}
        rw = regw.get(p.get('slug'))
        out.append({'id': pid, 's': slug, 'n': clean(p.get('name'), 140), 'dv': dev, 'dvs': slugify(dev) if dev else None, 'mk': mk, 'co': p.get('country', 'Indonesia'),
                    'ar': clean(p.get('area'), 80) or None, 'st': c.get('stage'), 'sts': p.get('status'), 'url': p.get('url'),
                    'du': p.get('docs_url') if p.get('docs_url') != p.get('url') else None, 'pn': p.get('permit_number') or (p.get('seed') or {}).get('permit_number'),
                    'dl': [t for t in (keep(x) for x in (p.get('docs_listed') or [])) if t][:14], 'ev': ev, 'cl': cl[:24], 'fl': fl[:8], 'fx': fx,
                    'src': [u for u in (p.get('sources') or []) if isinstance(u, str) and u.startswith('http')][:30], 'ad': p.get('added'),
                    'sha': lt.get('sha256'), 'sealed': lt.get('sealed') or lt.get('checked'),
                    'rw': {k: rw.get(k) for k in ('register', 'item', 'status', 'detail', 'code', 'checked')} if rw else None})
    devs = {}
    for x in out:
        if x['dvs']: devs.setdefault(x['dvs'], {'n': x['dv'], 'p': []})['p'].append(x['id'])
    res = {'version': 'named-1', 'updated': json.load(open(cases_path)).get('updated'), 'count': len(out), 'developers': len(devs), 'dropped': dropped,
           'rules': 'Facts only, each with its source link. Items naming a person or using opinion words are dropped before publishing.', 'projects': out}
    json.dump(res, open(out_path, 'w'), ensure_ascii=False, separators=(',', ':'))
    print('named index:', len(out), 'projects,', len(devs), 'developers, dropped', dropped)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
