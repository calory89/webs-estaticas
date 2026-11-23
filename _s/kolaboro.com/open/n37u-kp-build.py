#!/usr/bin/env python3
# Kolaboro batch 37 round 9 (r9u, 23 Nov 2026): the Malaysian housing developer register (KPKT TEDUH) per project, as one small file.
# Reads only /data/named.json (claims whose source is teduh.kpkt.gov.my, written when the register was read); no network, no model.
# Writes /data/n37u-kp.json: {v, built, src, p: {slug: [phase, ...]}} with phase =
#   {c: project code, pn: advertising and sales permit, vf/vt: permit valid from/to (ISO), st: register status as printed (Malay),
#    pc: [construction % per component], un: units, pmin/pmax: register price range (RM), spa: first sale agreement (ISO),
#    vp: vacant possession due per the first sale agreement (ISO), ext: approved extension in months, vp2: new vacant possession date,
#    per: delivery period in months, lic: developer licence, lt: licence valid to, u: source url, d: date read}
# Run: python3 open/n37u-kp-build.py <site root, default .>   (also run by n37u-build.py)
import json, sys, os, re
ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
D = os.path.join(ROOT, '_s/kolaboro.com/data')
COI = re.compile(r'eco\s*beach|\bequinox\b|\bsumba\b', re.I)
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
def build():
    named = json.load(open(os.path.join(D, 'named.json'), encoding='utf-8'))
    out = {}
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
    res = {'v': 'n37u-kp-1', 'built': named.get('updated') or '', 'src': 'https://teduh.kpkt.gov.my/', 'p': out}
    res['n'] = len(out)
    json.dump(res, open(os.path.join(D, 'n37u-kp.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    return res
if __name__ == '__main__':
    r = build(); ph = [p for v in r['p'].values() for p in v]
    print('n37u-kp.json', len(r['p']), 'projects,', len(ph), 'phases; status', {s: sum(p.get('st') == s for p in ph) for s in sorted({p.get('st') for p in ph if p.get('st')})}, '; extensions', sum('ext' in p for p in ph))
