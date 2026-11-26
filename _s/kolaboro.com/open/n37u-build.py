#!/usr/bin/env python3
# Kolaboro batch 37 round 1 (r1u, 23 Nov 2026): the project record, field by field.
# Reads only files already published under /data/ (no network, no model) and writes /data/n37u.json:
#   f    the 10 key fields we track per project, in a fixed order
#   p    per project: [id, slug, name, market, area, developer slug, developer, known mask, cells]
#        cell = [value, source url or "", source kind, date read] or 0 when we hold nothing for that field
#   mk   per market (5+ projects): projects, share of records holding each field (%), median fields held
#   rg   official registers per market or country, from /data/register-checks.json (the list on /registers/,
#        each probed by our checker), with the fields they can confirm
# Source kinds: reg = official register or its published mirror, dev = the developer's own site, portal = a listing
# portal, web = another web page we read, sat = our Sentinel-2 reading, rec = our record (sources listed on the project page).
# Sumba, Eco Beach City and Equinox are left out. Run: python3 open/n37u-build.py <site root, default .>
import json, sys, os, statistics, re
from urllib.parse import urlparse

ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
D = os.path.join(ROOT, '_s/kolaboro.com/data')
J = lambda p: json.load(open(os.path.join(D, p), encoding='utf-8'))
COI = re.compile(r'eco\s*beach|\bequinox\b|\bsumba\b', re.I)
F = ['ho', 'pn', 'un', 'pr', 'co', 'es', 'cp', 'sat', 'reg', 'ct']
PORTALS = {'propertyfinder.ae', 'a1properties.ae', 'condoblackbook.com', 'apartments.com.au', 'rumavi.com', 'apto.vc', 'fumbatown.agency',
           'emlakplatform.com.tr', 'lucasfox.com', 'palmera.realestate', 'off-planproperties.ae', 'bayut.com', 'fazwaz.com', 'hipflat.co.th',
           'ddproperty.com', 'propertyguru.com.sg', 'iproperty.com.my', 'idealista.com', 'rightmove.co.uk', 'zoopla.co.uk', 'thailand-property.com',
           'dotproperty.co.th', 'edgeprop.my', 'batdongsan.com.vn', 'lamudi.com.ph', 'realestate.com.au', 'domain.com.au', 'zillow.com', 'kyero.com'}
MIRRORS = {'dubairealestateiq.com'}   # published mirrors of an official register, labelled as such on the project page

named = J('named.json'); P = [x for x in named['projects'] if not COI.search(' '.join(str(x.get(k) or '') for k in ('n', 'dv', 'mk', 'ar', 's')))]
cp = J('construction-progress.json').get('projects', {})
cc = J('court-cases.json').get('cases', [])
cases_by_dev = {}
for c in cc:
    if c.get('dev'): cases_by_dev.setdefault(c['dev'], []).append(c)
regs = J('register-checks.json').get('registers', [])

def host(u):
    try: return (urlparse(u).hostname or '').replace('www.', '')
    except Exception: return ''
def kind(u, x):
    h = host(u)
    if not h: return 'rec'
    if h in MIRRORS: return 'reg'
    if h in PORTALS: return 'portal'
    if any(len(t) > 3 and t in h.replace('-', '') for t in (x.get('dvs') or '').split('-')): return 'dev'
    if x.get('du') and host(x['du']) == h: return 'dev'
    return 'web'
def read_date(x): return x.get('sealed') or x.get('ad') or ''
def num(v):
    return int(v) if isinstance(v, float) and v.is_integer() else v

rows = []
for x in P:
    fx = x.get('fx') or {}; dld = fx.get('dld') or {}; rw = x.get('rw') or {}; rv = x.get('rvw') or {}; ev = x.get('ev') or {}
    dsrc = dld.get('src') or ''; rwd = rw.get('checked') or ''
    c = {}
    if dld.get('comp'): c['ho'] = [dld['comp'], dsrc, 'reg', rwd or dld.get('pd') or '']
    elif fx.get('handover_promised'): c['ho'] = [fx['handover_promised'], x['url'], kind(x['url'], x), read_date(x)]
    if x.get('pn'): c['pn'] = [x['pn'], x['url'], kind(x['url'], x), read_date(x)]
    elif dld.get('no'): c['pn'] = ['DLD ' + str(dld['no']), dsrc, 'reg', rwd]
    elif rw.get('code'): c['pn'] = [str(rw['code']), (rv.get('reg') or [None, None, ''])[2] or '', 'reg', rwd]
    if dld.get('units'): c['un'] = [num(dld['units']), dsrc, 'reg', rwd]
    if fx.get('price_min'): c['pr'] = [(fx.get('currency') or '') + ' ' + format(num(fx['price_min']), ','), x['url'], kind(x['url'], x), read_date(x)]
    if fx.get('developer_company'):
        dc = fx['developer_company']
        c['co'] = [dc, dsrc, 'reg', rwd] if dld and 'DLD developer' in dc else [dc, '', 'rec', read_date(x)]
    if dld.get('bank'): c['es'] = [dld['bank'], dsrc, 'reg', rwd]
    elif ev.get('escrow'): c['es'] = [ev['escrow'][:140], '', 'rec', read_date(x)]
    if dld.get('pct') is not None and dld.get('pd'): c['cp'] = [str(num(dld['pct'])) + '%', dsrc, 'reg', dld['pd']]
    s = cp.get(x['id'])
    if s and s.get('status') == 'ok' and s.get('sum'):
        sm = s['sum']; lm = (sm.get('last') or ['', ''])[1]
        # r2u: the scene date of the last clear month (dt[i]), not just the month
        dts = s.get('dt') or []; i = len(dts) - 1
        while i >= 0 and (not dts[i] or not str(dts[i]).startswith(lm or '~')): i -= 1
        c['sat'] = [str(sm.get('b_first')) + '% > ' + str(sm.get('b_last')) + '%', '/satellite/construction-index/', 'sat', str(dts[i])[:10] if i >= 0 else lm]
    if rw.get('register'):
        # n39 i1: no review link and no DLD mirror: the source of the claim that names this register code (e.g. Florida DBPR extract)
        u = (rv.get('reg') or [None, None, ''])[2] or dsrc or (next((c[3] for c in (x.get('cl') or []) if rw.get('code') and len(str(rw['code'])) >= 4 and str(rw['code']) in c[0] and re.match(r'https?://(?:[a-z0-9-]+\.)*(?:gov|gov\.[a-z]{2}|go\.[a-z]{2}|myfloridalicense\.com)/', str(c[3]))), '') if rw.get('code') else '')
        c['reg'] = [rw['register'] + (': ' + rw['item'] if rw.get('item') else '') + (' (' + rw['status'] + ')' if rw.get('status') else ''), u or '', 'reg', rwd]
    dc = cases_by_dev.get(x.get('dvs') or '')
    if dc: c['ct'] = [len(dc), '/courts/', 'reg', max(k.get('date') or '' for k in dc)]
    mask = ''.join('1' if f in c else '0' for f in F)
    rows.append([x['id'], x['s'], x['n'], x['mk'], x.get('ar') or '', x.get('dvs') or '', x.get('dv') or '', mask, [c.get(f, 0) for f in F], x.get('co') or ''])

mk = {}
by = {}
for r in rows: by.setdefault(r[3], []).append(r)
for m, rs in by.items():
    if len(rs) < 5: continue
    mk[m] = {'n': len(rs), 'cov': [round(100 * sum(r[7][i] == '1' for r in rs) / len(rs)) for i in range(len(F))],
             'med': statistics.median([r[7].count('1') for r in rs]), 'co': rs[0][9]}
# official registers: what each one can confirm, mapped to our fields
CHK = {'permit': ['pn', 'reg'], 'escrow': ['es'], 'company': ['co'], 'title': ['reg'], 'env': ['pn']}
rg = {}
for r in regs:
    rg.setdefault(r['market'], []).append([r['register'], r.get('url') or '', sorted({f for k in r.get('checks', []) for f in CHK.get(k, [])}, key=F.index), r.get('result') or '', (r.get('probed_at') or '')[:10]])
CO = {'UAE': None, 'USA': 'United States', 'Indonesia': 'Indonesia'}
# r9u (round 9): kp = the Malaysian housing developer register (KPKT TEDUH) per project, from the named.json claims whose source is
# teduh.kpkt.gov.my (written when the register was read): {v, built, src, n, p: {slug: [entry, ...]}} with entry =
#   {c: project code, pn: advertising and sales permit, vf/vt: permit valid from/to, st: register status as printed (Malay), pc: [construction %
#   per component], un: units, pmin/pmax: register price range (RM), spa: first sale agreement, vp: vacant possession due per that agreement,
#   ext: approved extension (months), vp2: new vacant possession date, per: delivery period (months), lic/lt: developer licence and its end, u: source, d: read}
MON = {m: i + 1 for i, m in enumerate(['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'])}
def iso(s):
    s = (s or '').strip()
    if re.fullmatch(r'\d{4}-\d\d-\d\d', s): return s
    m = re.fullmatch(r'(\d{1,2}) ([A-Za-z]+) (\d{4})', s)
    if m:
        k = m.group(2).lower(); mo = MON.get(k) or next((v for n, v in MON.items() if n.startswith(k[:3])), None)
        if mo: return '%s-%02d-%02d' % (m.group(3), mo, int(m.group(1)))
    return ''
def num(s):
    try: return int(str(s).replace(',', ''))
    except Exception: return None
RD = re.compile(r'\(register read (\d{1,2} \w+ \d{4})\)')
def kp_build(named):
    out = {}; os_ = {}
    for x in named['projects']:
        if COI.search(' '.join(str(x.get(k) or '') for k in ('n', 'dv', 'mk', 'ar', 's'))): continue
        cl = [c for c in (x.get('cl') or []) if 'teduh.kpkt.gov.my' in (c[3] or '')]
        if not cl: continue
        ph = {}; order = []
        def P(code):
            if code not in ph: ph[code] = {'c': code}; order.append(code)
            return ph[code]
        rw = x.get('rw') or {}; d0 = rw.get('checked') or ''
        for c in cl:
            t = c[0]; m = re.match(r'Phase ([0-9]+-[0-9]+): (.*)$', t); code = m.group(1) if m else (rw.get('code') or ''); t = m.group(2) if m else t
            m = re.search(r'advertising and sales permit (\S+) for .*?\(project code ([0-9-]+)\), valid (\S+) to (\S+)', t)
            if m:
                p = P(m.group(2) or code); p.update(pn=m.group(1), vf=iso(m.group(3)), vt=iso(m.group(4)), u=c[3]); r = RD.search(t); p['d'] = iso(r.group(1)) if r else d0; continue
            m = re.search(r'also lists phase ([0-9-]+) of .* with advertising and sales permit (\S+), status "([^"]+)"', t)
            if m: p = P(m.group(1)); p.setdefault('pn', m.group(2)); p.setdefault('st', m.group(3)); p.setdefault('u', c[3]); continue
            p = P(code); p.setdefault('u', c[3])
            m = re.search(r'KPKT developer licence (\S+) \(valid (\S+) to (\S+)\)', t)
            if m: p['lic'] = m.group(1); p['lt'] = iso(m.group(3)); continue
            m = re.search(r'overall status "([^"]+)"', t)
            if m:
                p['st'] = m.group(1); g = re.search(r'construction progress ([\d. /]+)% per component', t)
                if g: p['pc'] = [float(v) for v in re.findall(r'[\d.]+', g.group(1))]
                continue
            m = re.match(r'([\d,]+) units on the register', t)
            if m: p['un'] = num(m.group(1)); continue
            m = re.search(r'Register price range for the units: RM ([\d,]+) to RM ([\d,]+)', t)
            if m: p['pmin'] = num(m.group(1)); p['pmax'] = num(m.group(2)); continue
            m = re.search(r'delivery period (\d+) months', t)
            if m: p['per'] = int(m.group(1))
            m = re.search(r'first sale agreement (\d{1,2} \w+ \d{4}), vacant possession due (\d{1,2} \w+ \d{4})', t)
            if m: p['spa'] = iso(m.group(1)); p['vp'] = iso(m.group(2))
            m = re.search(r'approved extension of (\d+) months, new vacant possession date (\d{1,2} \w+ \d{4})', t)
            if m: p['ext'] = int(m.group(1)); p['vp2'] = iso(m.group(2))
        for p in ph.values():
            p.setdefault('d', d0)
            for k in [k for k, v in p.items() if v in ('', None, [])]: del p[k]
        if order and x.get('pn') and 'pn' not in ph[order[0]] and str(x['pn']).startswith(order[0] + '/'): ph[order[0]]['pn'] = x['pn']
        L = [ph[k] for k in order if len(ph[k]) > 3]
        if L: out[x['s']] = L
        # r11u (round 11): the register says completed, our stage does not. Keep our stage as it is and show both, each with its date
        # and source: our stage comes from the claim that states it (its read or profile date), else the date the record was added.
        if L and x.get('st') != 'completed' and any(str(p.get('st') or '').startswith('Siap') for p in L):
            sc = next((c for c in (x.get('cl') or []) if 'teduh.kpkt.gov.my' not in (c[3] or '') and re.search(r'status "[^"]+"', c[0])), None)
            sd = ''
            if sc:
                m = re.search(r'read (\d{1,2} \w+ \d{4})', sc[0]) or re.search(r'dated (\d{4}-\d\d-\d\d)', sc[0]); sd = iso(m.group(1)) if m else ''
            os_[x['s']] = [x.get('st') or '', sd or x.get('ad') or '', (sc[3] if sc else x.get('url')) or '', 1 if sd else 0]
    res = {'v': 'n37u-kp-1', 'built': named.get('updated') or '', 'src': 'https://teduh.kpkt.gov.my/', 'p': out, 'os': os_}
    res['n'] = len(out)
    return res

# r11p (23 Nov 2026): the units field for Malaysian records comes from the KPKT TEDUH register units (sum of the register
# entries on the record) when the record holds no DLD unit count, with the register page as source and its read date.
KP = kp_build(named); UI = F.index('un'); kp_units = 0
for r in rows:
    if r[8][UI]: continue
    L = [e for e in KP['p'].get(r[1], []) if e.get('un')]
    if not L: continue
    r[8][UI] = [sum(e['un'] for e in L), L[0].get('u') or KP['src'], 'reg', L[0].get('d') or '']
    r[7] = ''.join('1' if r[8][i] else '0' for i in range(len(F))); kp_units += 1
# and construction % from the register entries' per-component progress (latest 7(f) report) when no DLD reading is held
CI = F.index('cp'); kp_cp = 0
for r in rows:
    if r[8][CI]: continue
    L = [e for e in KP['p'].get(r[1], []) if e.get('pc')]
    if not L: continue
    v = sorted({x for e in L for x in e['pc']})
    r[8][CI] = [('%g%%' % v[0]) if len(v) == 1 else ('%g%% to %g%%' % (v[0], v[-1])), L[0].get('u') or KP['src'], 'reg', L[0].get('d') or '']
    r[7] = ''.join('1' if r[8][i] else '0' for i in range(len(F))); kp_cp += 1
print('construction % from the KPKT register:', kp_cp, 'records')
for m, rs in by.items():
    if m in mk: mk[m]['cov'] = [round(100 * sum(r[7][i] == '1' for r in rs) / len(rs)) for i in range(len(F))]; mk[m]['med'] = statistics.median([r[7].count('1') for r in rs])
out = {'v': 'n37u-2', 'built': named.get('updated') or '', 'from': ['named.json', 'construction-progress.json', 'court-cases.json', 'register-checks.json'],
       'f': F, 'p': [r[:9] for r in rows], 'mk': mk, 'rg': rg, 'co': {r[0]: r[9] for r in rows},
       'n': len(rows), 'known': [sum(r[7][i] == '1' for r in rows) for i in range(len(F))], 'kp': KP}
print('units from the KPKT register:', kp_units, 'records')
json.dump(out, open(os.path.join(D, 'n37u.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('n37u.json', len(rows), 'projects,', len(mk), 'markets,', sum(len(v) for v in rg.values()), 'registers; held per field:', dict(zip(F, out['known'])))
print('kp (Malaysian register):', out['kp']['n'], 'projects,', sum(len(v) for v in out['kp']['p'].values()), 'entries')
