"""Shared helpers for block W batch jobs: project ids (same numbering as agent.py and block Q), countries, company-name extraction
and normalisation. Imported by gleif_graph.py and insolvency_watch.py."""
import json, os, re, unicodedata

ISO = {'Albania': 'AL', 'Antigua and Barbuda': 'AG', 'Argentina': 'AR', 'Aruba': 'AW', 'Australia': 'AU', 'Bahamas': 'BS', 'Bahrain': 'BH',
       'Barbados': 'BB', 'Belize': 'BZ', 'Brazil': 'BR', 'Bulgaria': 'BG', 'Cambodia': 'KH', 'Cape Verde': 'CV', 'Cayman Islands': 'KY',
       'Colombia': 'CO', 'Costa Rica': 'CR', 'Croatia': 'HR', 'Curacao': 'CW', 'Cyprus': 'CY', 'Dominican Republic': 'DO', 'Ecuador': 'EC',
       'Egypt': 'EG', 'El Salvador': 'SV', 'Fiji': 'FJ', 'France': 'FR', 'Georgia': 'GE', 'Ghana': 'GH', 'Greece': 'GR', 'Grenada': 'GD',
       'India': 'IN', 'Indonesia': 'ID', 'Ireland': 'IE', 'Italy': 'IT', 'Jamaica': 'JM', 'Japan': 'JP', 'Kenya': 'KE', 'Laos': 'LA',
       'Malaysia': 'MY', 'Maldives': 'MV', 'Malta': 'MT', 'Mauritius': 'MU', 'Mexico': 'MX', 'Montenegro': 'ME', 'Morocco': 'MA',
       'Namibia': 'NA', 'New Zealand': 'NZ', 'Nicaragua': 'NI', 'Oman': 'OM', 'Panama': 'PA', 'Philippines': 'PH', 'Portugal': 'PT',
       'Puerto Rico': 'PR', 'Puerto Rico (USA)': 'PR', 'Qatar': 'QA', 'Rwanda': 'RW', 'Saint Lucia': 'LC', 'St Lucia': 'LC', 'Saudi Arabia': 'SA',
       'Senegal': 'SN', 'Serbia': 'RS', 'Seychelles': 'SC', 'South Africa': 'ZA', 'Spain': 'ES', 'Sri Lanka': 'LK', 'St Kitts and Nevis': 'KN',
       'Tanzania': 'TZ', 'Thailand': 'TH', 'Turkey': 'TR', 'Turks and Caicos Islands': 'TC', 'UAE': 'AE', 'USA': 'US', 'United Kingdom': 'GB',
       'Uruguay': 'UY', 'Vanuatu': 'VU', 'Vietnam': 'VN'}
# Northern Cyprus has no ISO code and no LEI issuer of its own: entities there register as Cyprus (CY) or Turkey (TR).
ISO_ALT = {'Northern Cyprus': ['CY', 'TR'], 'Puerto Rico': ['PR', 'US'], 'Puerto Rico (USA)': ['PR', 'US']}

def load(AG):
    src = open(os.path.join(AG, 'agent.py')).read(); ns = {}
    exec(re.search(r"PREFIX = \{.*?\}\n", src, re.S).group(0), ns); PREFIX = ns['PREFIX']
    P = json.load(open(os.path.join(AG, 'projects.json')))['projects'] + json.load(open(os.path.join(AG, 'projects-world.json'))).get('projects', [])
    IDS, n = {}, {}
    for p in sorted(P, key=lambda x: x.get('market', 'Bali') != 'Bali'):   # same order and numbering as agent.py and block Q
        mk = p.get('market', 'Bali'); n[mk] = n.get(mk, 0) + 1
        IDS[p['slug']] = '%s-%03d' % (PREFIX.get(mk, mk[:3].upper()), n[mk])
    # research files may name the developer differently for the same slug: use both
    EXTRA = {}
    for root, _, files in os.walk(os.path.join(AG, 'research')):
        for f in files:
            if not f.endswith('.json'): continue
            try: d = json.load(open(os.path.join(root, f)))
            except Exception: continue
            rows = d if isinstance(d, list) else (d.get('projects') if isinstance(d, dict) else None) or []
            for r in rows if isinstance(rows, list) else []:
                if isinstance(r, dict) and r.get('slug') and isinstance(r.get('developer'), str):
                    EXTRA.setdefault(r['slug'], set()).add(r['developer'])
    return P, IDS, EXTRA

# ---- names
FORMS = ['LIMITED', 'LTD', 'LLC', 'L L C', 'LLP', 'PLC', 'PJSC', 'P J S C', 'PSC', 'JSC', 'SAOG', 'SAOC', 'QPSC', 'QSC', 'INC', 'INCORPORATED', 'CORP', 'CORPORATION',
         'CO', 'COMPANY', 'SA', 'S A', 'SL', 'S L', 'SLU', 'S L U', 'SAU', 'SAS', 'SARL', 'SRL', 'SPA', 'S P A', 'GMBH', 'AG', 'BV', 'NV', 'AS', 'AB', 'OY', 'KFT',
         'DOO', 'D O O', 'EOOD', 'OOD', 'AD', 'EAD', 'AE', 'IKE', 'EPE', 'LDA', 'UNIPESSOAL', 'UNIPERSONAL', 'SLP', 'SLL', 'SOCIEDAD LIMITADA', 'SOCIEDAD ANONIMA', 'SA DE CV', 'S A DE C V',
         'S DE RL DE CV', 'S DE R L DE C V', 'SAPI DE CV', 'S A P I DE C V', 'SDN BHD', 'SDN', 'BHD', 'BERHAD', 'PTE', 'PTY', 'PTE LTD', 'PTY LTD', 'TBK', 'PCL',
         'PUBLIC COMPANY', 'JOINT STOCK COMPANY', 'AS', 'AS', 'ANONIM SIRKETI', 'A S', 'LTD STI', 'LIMITED SIRKETI', 'FZE', 'FZCO', 'FZ LLC', 'FZ', 'DMCC',
         'HOLDING COMPANY', 'KK', 'KABUSHIKI KAISHA', 'CO LTD', 'COMPANY LIMITED', 'PRIVATE', 'PVT', 'SE', 'SPRL', 'CV', 'DE CV', 'L P', 'LP', 'PC', 'P C']
FORMS = sorted(set(FORMS), key=lambda s: -len(s))
FORM_RE = re.compile(r'(?:\s(?:' + '|'.join(re.escape(f) for f in FORMS) + r'))+$')
def ascii_up(s):
    s = unicodedata.normalize('NFKD', s or '')
    return ''.join(c for c in s if not unicodedata.combining(c)).upper()
def norm(s):
    s = ascii_up(s).replace('&', ' AND ')
    s = re.sub(r"[^A-Z0-9 ]+", ' ', s.replace("'", ''))
    s = ' ' + re.sub(r'\s+', ' ', s).strip()
    s = re.sub(r'^ (?:PT|THE|CV) ', ' ', s)        # PT (Indonesia), The ...
    prev = None
    while prev != s:
        prev = s; s = FORM_RE.sub('', s)
    return s.strip()
def has_form(s): return norm(s) != re.sub(r'\s+', ' ', re.sub(r"[^A-Z0-9 ]+", ' ', ascii_up(s).replace('&', ' AND ').replace("'", ''))).strip()

ROLE = re.compile(r"^(?:also|and|with|by|project company|project companies|the project company|spv|developer|development by|developed by|master developer|"
                  r"site owner|seller|landowner|owner|operator|brand licensee|condo filer|dbpr condo filer|joint venture|jv|jv partner|a|an|"
                  r"[a-z ]{0,30}(?:filer|licensee|company|partner|sponsor|owner|manager)\s*:)\s+", re.I)
SKIP = re.compile(r"\b(?:ceo|founder|founders|co-founder|chairman|director|president|mr|mrs|ms|dr|sheikh|family|brand|branded|backing|backed|listed|formerly|"
                  r"not named|unnamed|unknown|undisclosed|not disclosed|not stated|sales contact|agent|agency|architect|architects|architecture|design by|"
                  r"interiors?|operated|managed by|hotel brand|residences by|partner)\b", re.I)
def candidates(dev):
    out = []
    for part in re.split(r'[;()\[\]/]|\s+(?:with|and|x|together with|in partnership with|partnered with|by|via|under|plus|in jv with)\s+|:\s|,\s(?!(?:Ltd|Inc|LLC|S\.?A|S\.?L|Co\.|Limited|S\.? de))', dev or '', flags=re.I):
        s = part.strip(' .,-')
        for _ in range(3): s = ROLE.sub('', s).strip(' .,-')
        if not s or not re.match(r'[A-Z0-9]', s): continue
        if SKIP.search(s): continue   # people, brands, notes: never searched
        w = s.split()
        if len(w) > 9: continue
        b = norm(s)
        if not b: continue
        if len(b.split()) == 1 and len(b) < 5: continue   # one short word is too generic to match on name and country alone
        out.append(s)
    return list(dict.fromkeys(out))

