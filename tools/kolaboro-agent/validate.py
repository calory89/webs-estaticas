#!/usr/bin/env python3
"""Automatic checks on every published project record (n31c, 18 Nov 2026).

Run by named.py on every build of named.json (the agent's publish and every manual data push), so each new fact is checked
before it is published. Rule-based, no network, no paid calls.

Two kinds of result:
- "hold": the value is impossible (a latitude outside -90..90, a pin at 0,0, a handover year before 1990 or after 2050, a negative
  price, a deposit above 100 %). named.py does not publish that one value; the rest of the record is published.
- "check": the value is possible but unusual and needs a person to look again (a pin far from the other pins of its place, a price
  far outside the usual range, a minimum size larger than the maximum, a building start after the promised handover, "completed"
  with a handover date years ahead, the same name twice in one place, two pins a few metres apart with similar names).
Results are published in named.json under "qa" and shown on /engineering/data-quality/ (validation table).
"""
import math, re, statistics
from datetime import date

FX = {'USD': 1.0, 'EUR': 1.08, 'IDR': 1 / 16000.0, 'AUD': 0.65, 'AED': 0.2723, 'THB': 1 / 34.0, 'MXN': 1 / 18.5, 'GBP': 1.27, 'OMR': 2.6, 'TRY': 1 / 41.0,
      'EGP': 1 / 48.0, 'GEL': 0.37, 'COP': 1 / 4000.0, 'BRL': 0.18, 'DOP': 1 / 62.0, 'VND': 1 / 26000.0, 'PHP': 1 / 58.0, 'MYR': 0.23, 'LKR': 1 / 300.0,
      'JPY': 1 / 150.0, 'CRC': 1 / 510.0, 'KHR': 1 / 4050.0, 'SAR': 0.2667, 'QAR': 0.2747, 'CAD': 0.72, 'PLN': 0.25, 'CHF': 1.13, 'NZD': 0.6, 'ZAR': 0.055,
      'KES': 1 / 129.0, 'MUR': 1 / 46.0, 'BHD': 2.65, 'KWD': 3.25, 'MAD': 0.1, 'HUF': 1 / 360.0, 'CZK': 1 / 23.0, 'RON': 0.22, 'BGN': 0.55, 'RSD': 1 / 107.0,
      'ALL': 1 / 92.0, 'TZS': 1 / 2600.0, 'SGD': 0.75, 'HKD': 0.128, 'CNY': 0.14, 'INR': 1 / 85.0, 'KZT': 1 / 500.0, 'AZN': 0.59, 'UYU': 1 / 40.0, 'ARS': 1 / 1000.0,
      'PEN': 0.27, 'CLP': 1 / 950.0, 'NGN': 1 / 1500.0, 'GHS': 1 / 15.0, 'XCD': 0.37, 'BBD': 0.5, 'JMD': 1 / 157.0, 'TTD': 0.15, 'PAB': 1.0, 'TWD': 1 / 32.0,
      'KRW': 1 / 1400.0, 'SEK': 0.095, 'NOK': 0.093, 'DKK': 0.145, 'ISK': 1 / 138.0}
RULES = {
    'pin_range': ['hold', 'pin outside the valid latitude and longitude range, or at 0,0'],
    'date_impossible': ['hold', 'handover or start year before 1990 or after 2050'],
    'price_negative': ['hold', 'price of zero or below'],
    'deposit_range': ['hold', 'deposit outside 0 to 100 %'],
    'pin_far': ['check', 'pin more than 150 km from the median pin of its place (places with 5 or more pins; country-wide places left out)'],
    'price_range': ['check', 'price from below USD 5,000 or above USD 150 million at a rough fixed rate'],
    'price_order': ['check', 'price "to" below price "from"'],
    'size_range': ['check', 'size below 8 m2 or above 50,000 m2, or minimum above maximum'],
    'start_after_handover': ['check', 'building start later than the promised handover'],
    'completed_future': ['check', 'stage "completed" while the handover on record is more than a year ahead'],
    'same_name': ['check', 'the same project name twice in one place'],
    'twin_pin': ['check', 'two projects of one place less than 25 m apart with similar names'],
}
YR = re.compile(r'(19|20)\d\d')


def _year(v):
    m = YR.search(str(v or ''))
    return int(m.group(0)) if m else None


def _km(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 12742 * math.asin(min(1, math.sqrt(h)))


def _num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


_W = lambda n: set(w for w in re.findall(r'[a-z0-9]+', (n or '').lower()) if len(w) > 2 and w not in ('the', 'residence', 'residences', 'villas', 'villa', 'tower', 'towers', 'project', 'apartments', 'by', 'and', 'phase'))


def check(out, today=None):
    """out: named.json project records (id, s, n, mk, co, st, fx). Removes held values from fx in place. Returns the qa block."""
    today = today or date.today()
    issues = []
    add = lambda x, rule, field, val: issues.append([x['id'], rule, field, val if isinstance(val, (int, float)) or val is None else str(val)[:60]])
    pins = {}
    for x in out:
        fx = x.get('fx') or {}
        lat, lng = _num(fx.get('lat')), _num(fx.get('lng'))
        if 'lat' in fx or 'lng' in fx:
            if lat is None or lng is None or not (-90 <= lat <= 90) or not (-180 <= lng <= 180) or (abs(lat) < 0.01 and abs(lng) < 0.01):
                add(x, 'pin_range', 'lat,lng', '%s,%s' % (fx.get('lat'), fx.get('lng'))); fx.pop('lat', None); fx.pop('lng', None)
            else:
                pins.setdefault(x['mk'], []).append((x, lat, lng))
        for k in ('handover_promised', 'original_handover', 'construction_start'):
            y = _year(fx.get(k)) if fx.get(k) else None
            if fx.get(k) and y is not None and not (1990 <= y <= 2050):
                add(x, 'date_impossible', k, fx.get(k)); fx.pop(k, None)
        for k in ('price_min', 'price_max'):
            v = _num(fx.get(k))
            if fx.get(k) is not None and v is not None and v <= 0:
                add(x, 'price_negative', k, fx.get(k)); fx.pop(k, None)
        dp = _num(fx.get('deposit_pct'))
        if fx.get('deposit_pct') is not None and dp is not None and not (0 <= dp <= 100):
            add(x, 'deposit_range', 'deposit_pct', fx.get('deposit_pct')); fx.pop('deposit_pct', None)
        pmin, pmax, cur = _num(fx.get('price_min')), _num(fx.get('price_max')), fx.get('currency')
        if pmin and cur in FX and not (5000 <= pmin * FX[cur] <= 1.5e8): add(x, 'price_range', 'price_min', '%s %s' % (cur, int(pmin)))
        if pmin and pmax and pmax < pmin: add(x, 'price_order', 'price_max', '%s < %s' % (int(pmax), int(pmin)))
        smin, smax = _num(fx.get('size_min_m2')), _num(fx.get('size_max_m2'))
        if (smin is not None and not (8 <= smin <= 50000)) or (smax is not None and not (8 <= smax <= 50000)) or (smin and smax and smin > smax):
            add(x, 'size_range', 'size_m2', '%s-%s' % (fx.get('size_min_m2'), fx.get('size_max_m2')))
        ys, yh = _year(fx.get('construction_start')), _year(fx.get('handover_promised'))
        if ys and yh and ys > yh: add(x, 'start_after_handover', 'construction_start', '%s > %s' % (fx.get('construction_start'), fx.get('handover_promised')))
        if x.get('st') == 'completed' and yh and yh > today.year + 1: add(x, 'completed_future', 'handover_promised', fx.get('handover_promised'))
    for mk, L in pins.items():
        if len(L) < 5 or any(mk == x.get('co') for x, _, _ in L[:1]): continue
        med = (statistics.median(a for _, a, _ in L), statistics.median(b for _, _, b in L))
        for x, a, b in L:
            d = _km(med, (a, b))
            if d > 150: add(x, 'pin_far', 'lat,lng', '%.0f km' % d)
        for i, (x, a, b) in enumerate(L):
            for y, c, d in L[i + 1:]:
                if abs(a - c) < 0.0005 and abs(b - d) < 0.0005 and _km((a, b), (c, d)) < 0.025:
                    wa, wb = _W(x.get('n')), _W(y.get('n'))
                    if wa and wb and len(wa & wb) / len(wa | wb) >= 0.5: add(x, 'twin_pin', 'lat,lng', y['id'])
    seen = {}
    for x in out:
        k = (x['mk'], re.sub(r'[^a-z0-9]+', ' ', (x.get('n') or '').lower()).strip())
        if k[1] and k in seen: add(x, 'same_name', 'name', seen[k])
        else: seen[k] = x['id']
    by = {}
    for i in issues: by[i[1]] = by.get(i[1], 0) + 1
    return {'v': 'kolaboro-validation-1', 'checked': today.isoformat(), 'records': len(out), 'rules': RULES, 'counts': by,
            'held': sum(1 for i in issues if RULES[i[1]][0] == 'hold'), 'issues': issues}
