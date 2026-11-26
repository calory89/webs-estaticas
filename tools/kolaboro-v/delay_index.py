#!/usr/bin/env python3
"""Kolaboro delivery-delay index, on-time odds and the monthly press release (block V, 4 Nov 2026).

Inputs are public files only (/data/bali-cases.json, /data/named.json, /data/promises.json, /data/price-index.json) plus the previously published outputs,
so that every figure can be recomputed in a browser. Outputs (written to OUT):
  delay-index.json   per-market share past the first promised handover, median and P90 months late, monthly history
  on-time.json       per project id: status and, where possible, an empirical odds of handover within 6 months
  press/release.json, press/release.txt, press/chart-*.svg, press/index.html (from the page template)
No developer or project names are read or written. AI (optional) only drafts one paragraph from the numbers,
and every number in the draft must appear in the data or the template text is used instead.
"""
import argparse, datetime, hashlib, html, json, math, os, re, sys, urllib.request, urllib.error

VERSION = 'delay-index-1'
WINDOW = 6          # months after the first promised handover that still count as on time
MIN_MARKET = 5      # minimum sample for any market figure
MIN_ODDS = 10       # minimum resolved comparables for an odds estimate
Z = 1.959963984540054
BASE = 'https://kolaboro.com'
# Owner rule: Sumba appears only in the transparency ranking. Its projects are left out of the delay index and the on-time odds
# (rows, totals, history and ids); the transparency figures below still read every case.
HIDE_MARKETS = {'Sumba'}
MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']


def mi(y, m):          # month index
    return y * 12 + m


def ym(i):             # month index -> 'YYYY-MM'
    y, m = divmod(i - 1, 12)
    return '%04d-%02d' % (y, m + 1)


def q7(xs, p):         # quantile, linear interpolation (Hyndman-Fan type 7, numpy default)
    xs = sorted(xs)
    if not xs:
        return None
    h = (len(xs) - 1) * p
    lo = math.floor(h)
    hi = min(lo + 1, len(xs) - 1)
    return round(xs[lo] + (h - lo) * (xs[hi] - xs[lo]), 1)


def wilson(k, n):
    if not n:
        return None, None
    p = k / n
    den = 1 + Z * Z / n
    c = (p + Z * Z / (2 * n)) / den
    h = Z * math.sqrt(p * (1 - p) / n + Z * Z / (4 * n * n)) / den
    return round(max(0.0, c - h) * 100, 1), round(min(1.0, c + h) * 100, 1)


def pct(a, b):
    return round(100.0 * a / b, 1) if b else None


# ---------- handover dates: the same parser and rules as the site (_worker.js kbx_hdate.js hparse/hkey, kbx_named.js handoverOf) ----------
# n40 k27 (26 Nov 2026): the currently published handover month comes from the best available record, not only from the overdue watcher.
_MONW = {'jan': 1, 'january': 1, 'feb': 2, 'february': 2, 'mar': 3, 'march': 3, 'apr': 4, 'april': 4, 'may': 5, 'jun': 6, 'june': 6, 'jul': 7, 'july': 7, 'aug': 8, 'august': 8,
         'sep': 9, 'sept': 9, 'september': 9, 'oct': 10, 'october': 10, 'nov': 11, 'november': 11, 'dec': 12, 'december': 12,
         'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8, 'septiembre': 9, 'setiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12,
         'janeiro': 1, 'fevereiro': 2, 'março': 3, 'marco': 3, 'maio': 5, 'junho': 6, 'julho': 7, 'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12,
         'janvier': 1, 'février': 2, 'fevrier': 2, 'mars': 3, 'avril': 4, 'mai': 5, 'juin': 6, 'juillet': 7, 'août': 8, 'aout': 8, 'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12, 'decembre': 12,
         'januar': 1, 'februar': 2, 'märz': 3, 'maerz': 3, 'juni': 6, 'juli': 7, 'oktober': 10, 'dezember': 12,
         'januari': 1, 'februari': 2, 'maart': 3, 'mei': 5, 'augustus': 8, 'gennaio': 1, 'febbraio': 2, 'aprile': 4, 'maggio': 5, 'giugno': 6, 'luglio': 7, 'settembre': 9, 'ottobre': 10, 'dicembre': 12}
_SEASON = {'spring': 'sp', 'summer': 'su', 'fall': 'au', 'autumn': 'au', 'winter': 'wi', 'primavera': 'sp', 'verano': 'su', 'otoño': 'au', 'invierno': 'wi', 'printemps': 'sp', 'été': 'su',
           'automne': 'au', 'hiver': 'wi', 'frühling': 'sp', 'frühjahr': 'sp', 'sommer': 'su', 'herbst': 'au', 'voorjaar': 'sp', 'zomer': 'su', 'najaar': 'au'}
_PART = {'early': 'b', 'beginning': 'b', 'start': 'b', 'mid': 'm', 'middle': 'm', 'late': 'l', 'end': 'e', 'principios': 'b', 'inicios': 'b', 'comienzos': 'b', 'mediados': 'm',
         'finales': 'e', 'fines': 'e', 'début': 'b', 'debut': 'b', 'fin': 'e', 'anfang': 'b', 'mitte': 'm', 'ende': 'e', 'begin': 'b', 'medio': 'm', 'eind': 'e'}
_W = '[A-Za-zÀ-ÿçñäöüßéèêûôâîœ.]+'
_Y = '((?:19|20)\\d\\d)(?![\\d])'
_B = '(?![A-Za-z0-9_])'   # JavaScript \b after a word character (ASCII)


def _mon(w):
    return _MONW.get(re.sub(r'\.$', '', str(w or '').lower()))


def _ordq(w):
    w = re.sub(r'[º°.]|st|nd|rd|th|er', '', w.lower())
    o = {'first': 1, 'primer': 1, 'second': 2, 'segundo': 2, 'third': 3, 'tercer': 3, 'fourth': 4, 'cuarto': 4}.get(w) or (int(w) if w.isdigit() else 0)
    return o if 1 <= o <= 4 else None


_RX = [
    (re.compile('^' + _Y + '-Q([1-4])' + _B, re.I), lambda m: {'y': int(m[1]), 'q': int(m[2])}),
    (re.compile('^' + _Y + '-H([12])' + _B, re.I), lambda m: {'y': int(m[1]), 'h': int(m[2])}),
    (re.compile('^' + _Y + '-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])' + _B), lambda m: {'y': int(m[1]), 'm': int(m[2]), 'd': int(m[3])}),
    (re.compile('^' + _Y + '-(0[1-9]|1[0-2])(?![\\d-])'), lambda m: {'y': int(m[1]), 'm': int(m[2])}),
    (re.compile('^(?:Q|T)([1-4])\\s*[/ .-]?\\s*' + _Y, re.I), lambda m: {'y': int(m[2]), 'q': int(m[1])}),
    (re.compile('^([1-4])\\s*(?:Q|T)\\s*[/ .-]?\\s*' + _Y, re.I), lambda m: {'y': int(m[2]), 'q': int(m[1])}),
    (re.compile('^H([12])\\s*[/ .-]?\\s*' + _Y, re.I), lambda m: {'y': int(m[2]), 'h': int(m[1])}),
    (re.compile('^([12])H\\s*[/ .-]?\\s*' + _Y, re.I), lambda m: {'y': int(m[2]), 'h': int(m[1])}),
    (re.compile('^' + _Y + '\\s*[/ -]\\s*H([12])' + _B, re.I), lambda m: {'y': int(m[1]), 'h': int(m[2])}),
    (re.compile('^' + _Y + '\\s*[/ -]\\s*Q([1-4])' + _B, re.I), lambda m: {'y': int(m[1]), 'q': int(m[2])}),
    (re.compile('^(first|second|last|primer|segundo|1er|1º|2º|1°|2°|1st|2nd|1\\.|2\\.)\\s+(?:half|semester|semestre|halbjahr)(?:\\s+(?:of|de|del))?\\s+' + _Y, re.I),
     lambda m: {'y': int(m[2]), 'h': 1 if re.match('^(first|primer|1)', m[1].lower()) else 2}),
    (re.compile('^(first|second|third|fourth|primer|segundo|tercer|cuarto|1er|1st|2nd|3rd|4th|[1-4]º|[1-4]°|[1-4]\\.)\\s+(?:quarter|trimestre|quartal)(?:\\s+(?:of|de|del))?\\s+' + _Y, re.I),
     lambda m: {'y': int(m[2]), 'q': _ordq(m[1])} if _ordq(m[1]) else None),
    (re.compile('^(early|beginning|start|mid|middle|late|end|principios|inicios|comienzos|mediados|finales|fines|d[ée]but|fin|anfang|mitte|ende|begin|medio|eind)(?:\\s*-\\s*|\\s+(?:of\\s+|de\\s+|del\\s+)?)' + _Y, re.I),
     lambda m: {'y': int(m[2]), 'p': _PART.get(m[1].lower())}),
    (re.compile('^mi-' + _Y, re.I), lambda m: {'y': int(m[1]), 'p': 'm'}),
    (re.compile('^' + _Y + '\\s+(mid|end)-?year' + _B, re.I), lambda m: {'y': int(m[1]), 'p': 'm' if m[2].lower() == 'mid' else 'e'}),
    (re.compile('^(' + '|'.join(_SEASON) + ')(?:\\s+(?:of|de|del))?\\s+' + _Y, re.I), lambda m: {'y': int(m[2]), 's': _SEASON[m[1].lower()]}),
    (re.compile('^(\\d{1,2})\\s+(' + _W + ')\\s+(?:de\\s+)?' + _Y, re.I), lambda m: {'y': int(m[3]), 'm': _mon(m[2]), 'd': int(m[1])} if _mon(m[2]) else None),
    (re.compile('^(' + _W + ')\\s+(\\d{1,2}),?\\s+' + _Y, re.I), lambda m: {'y': int(m[3]), 'm': _mon(m[1]), 'd': int(m[2])} if _mon(m[1]) else None),
    (re.compile('^(' + _W + ')\\s+(?:de\\s+|del\\s+)?' + _Y, re.I), lambda m: {'y': int(m[2]), 'm': _mon(m[1])} if _mon(m[1]) else None),
    (re.compile('^' + _Y + '\\s*年\\s*(1[0-2]|[1-9])\\s*月'), lambda m: {'y': int(m[1]), 'm': int(m[2])}),
    (re.compile('^(0?[1-9]|1[0-2])\\s*/\\s*' + _Y + '(?!\\s*/)'), lambda m: {'y': int(m[2]), 'm': int(m[1])}),
    (re.compile('^' + _Y + '(?:\\s*年)?(?![./:]\\d|-\\d{1,2}(?!\\d))'), lambda m: {'y': int(m[1])}),
]


def _head(t):
    for rx, f in _RX:
        m = rx.match(t)
        if m:
            v = f(m)
            if v and 1990 <= v['y'] <= 2060:
                return v, len(m.group(0))
    return None


def hparse(s):
    if s is None:
        return None
    raw = str(s).strip()
    if not raw:
        return None
    t = raw
    th = re.match(r'^(.*?)[,;]?\s+then\s+(.+)$', t, re.I | re.S)
    if th and _head(th.group(2).strip()):
        t = th.group(2).strip()
    mm = re.match(r'^(?:about|around|approx(?:imately|\.)?|ca\.|circa|hacia|vers|etwa|rond)\s+', t, re.I)
    if mm:
        t = t[len(mm.group(0)):]
    mm = re.match(r'^phase\s+(?:1|i|one)(?![A-Za-z0-9_])[:,]?\s*(?:in\s+)?', t, re.I)
    if mm:
        t = t[len(mm.group(0)):]
    a = _head(t)
    if not a:
        return None
    rest, b = t[a[1]:], None
    rg = re.match(r'^\s*(?:-|–|(?<![A-Za-z0-9_])to(?![A-Za-z0-9_])|(?<![A-Za-z0-9_])al(?![A-Za-z0-9_])|(?<=[A-Za-z0-9_])à(?=[A-Za-z0-9_])|(?<![A-Za-z0-9_])bis(?![A-Za-z0-9_])|(?<![A-Za-z0-9_])to\s+the(?![A-Za-z0-9_]))\s*', rest, re.I)
    if rg:
        z = _head(rest[len(rg.group(0)):])
        if z and z[0]['y'] >= a[0]['y'] and (z[0]['y'] > a[0]['y'] or z[0] != a[0]):
            b = z[0]
    return {'a': a[0], 'b': b}


def hkey(s):
    """Last month of the period a handover text names, as 'YYYY-MM' (the site's hkey)."""
    P = hparse(s)
    if not P:
        return None
    v = P['b'] or P['a']
    m = v.get('m') or (v['q'] * 3 if v.get('q') else v['h'] * 6 if v.get('h') else {'b': 3, 'm': 6, 'l': 10, 'e': 12}.get(v.get('p')) if v.get('p') else
                       {'sp': 5, 'su': 8, 'au': 11, 'wi': 12}.get(v.get('s')) if v.get('s') else 12)
    return '%d-%02d' % (v['y'], m)


def hstart(s):
    P = hparse(s)
    if not P:
        return None
    v = P['a']
    m = v.get('m') or (v['q'] * 3 - 2 if v.get('q') else v['h'] * 6 - 5 if v.get('h') else {'b': 1, 'm': 4, 'l': 9, 'e': 10}.get(v.get('p')) if v.get('p') else
                       {'sp': 3, 'su': 6, 'au': 9, 'wi': 12}.get(v.get('s')) if v.get('s') else 1)
    return '%d-%02d' % (v['y'], m)


def kidx(k):
    y, m = k.split('-')
    return int(y) * 12 + int(m)


def current_handover(pid, prom, named):
    """The currently published handover date of one project, as the site shows it (kbx_named.js handoverOf):
    the dated handover promise (promises.json), moved to a later date the same records show; else the handover in the
    project's research record (named.json fx.handover_promised). Returns (month 'YYYY-MM', text, source, read date) or None."""
    pr = (prom or {}).get(pid) or []
    h = next((p for p in pr if p.get('k') == 'handover'), None)
    x = (named or {}).get(pid) or {}
    fx = x.get('fx') or {}
    if h:
        k0 = hkey(h.get('d'))
        if k0:
            best, bk = None, k0
            seen0 = next((e.get('seen') for e in (h.get('hist') or []) if e and e.get('d') == h.get('d')), None) or ''
            for d in [e.get('d') for e in (h.get('hist') or []) if e and (e.get('seen') or '') >= seen0] + [h.get('rd'), fx.get('handover_promised')]:
                k = d and hkey(d)
                s0 = d and hstart(d)
                if k and s0 and (kidx(s0) >= kidx(k0) + 3 or (re.match(r'^\d{4}$', str(h.get('d')).strip()) and re.match(r'^\d{4}$', str(d).strip()) and int(d) > int(h['d']))) and k > bk:
                    bk, best = k, d
            seen = max([e.get('seen') or '' for e in (h.get('hist') or []) if e] + [h.get('seen') or ''])
            if best:
                return bk, best, 'promise', seen
            return k0, h.get('d'), 'promise', seen
    f = fx.get('handover_promised')
    if f and hkey(f):
        return hkey(f), f, 'record', (x.get('ad') or (x.get('rw') or {}).get('checked') or x.get('sealed') or '')[:10]
    return None


def derive(c, NOW, hc=None):
    """One project's dates in month indexes. cur = currently advertised handover, first = cur minus recorded moves."""
    st = c.get('stage')
    done = c.get('done') if isinstance(c.get('done'), int) else None
    od = c.get('overdue') if isinstance(c.get('overdue'), (int, float)) and c.get('overdue') > 0 else 0
    d = c.get('delay') if isinstance(c.get('delay'), (int, float)) and c.get('delay') > 0 else 0
    od, d = int(round(od)), int(round(d))
    completed = st == 'completed'
    cur, hs, hr = None, None, None
    if od:
        cur, hs = NOW - od, 'watcher'      # exact month: the overdue watcher counts from the advertised month
    elif hc:
        # n40 k27: the dated handover record the site shows (promises.json, else the research record in named.json), last month of the period it names
        cur, hs, hr = kidx(hc[0]), hc[2], hc[3]
        if not completed and cur < NOW:
            od = NOW - cur                 # not completed and past the currently published month: counts in past_current like a watcher reading
    elif done:
        cur, hs = mi(done, 12), 'year'     # year only: December assumed, which can only understate lateness
    r = {'id': c['id'], 'market': c.get('market'), 'country': c.get('country'), 'stage': st, 'completed': completed,
         'cur': cur, 'd': d, 'od': od, 'first': None, 'status': None, 'late': None, 'hs': hs, 'hr': hr}
    if cur is None:
        r['status'] = 'completed_no_date' if completed else 'no_date'
        return r
    if not completed and not od and cur < NOW:
        r['status'] = 'inconsistent'       # a past year without an overdue reading: left out, counted
        return r
    first = cur - d
    r['first'] = first
    if completed:
        r['status'] = 'done_on_time' if d <= WINDOW else 'done_late'
    else:
        late = NOW - first
        r['late'] = late if late > 0 else 0
        if late > WINDOW:
            r['status'] = 'missed'
        elif cur - first > WINDOW:
            r['status'] = 'moved'
        else:
            r['status'] = 'open'
    return r


def resolved(r, NOW):
    """Window closed: more than 6 months since the first promised handover. y = handed over with at most 6 months of recorded moves."""
    if r['first'] is None or NOW - r['first'] <= WINDOW:
        return None
    return 1 if (r['completed'] and r['d'] <= WINDOW) else 0


def market_row(name, rows):
    dated = [r for r in rows if not r['completed'] and r['first'] is not None]
    late = sorted(r['late'] for r in dated if r['late'] and r['late'] > 0)
    cur_past = [r for r in dated if r['od'] > 0]
    o = {'market': name, 'tracked': len(rows), 'with_date': len(dated), 'past_first': len(late), 'past_current': len(cur_past),
         'completed': sum(1 for r in rows if r['completed']), 'moved': sum(1 for r in rows if r['d'] > 0),
         'no_date': sum(1 for r in rows if r['status'] in ('no_date', 'completed_no_date')),
         'inconsistent': sum(1 for r in rows if r['status'] == 'inconsistent'),
         'share_past_first': None, 'share_past_current': None, 'median_late': None, 'p90_late': None, 'late_months': late}
    if len(dated) >= MIN_MARKET:
        o['share_past_first'] = pct(len(late), len(dated))
        o['share_past_current'] = pct(len(cur_past), len(dated))
    if len(late) >= MIN_MARKET:
        o['median_late'] = q7(late, 0.5)
        o['p90_late'] = q7(late, 0.9)
    return o


def odds_group(pool, r, exclude=None):
    """Comparables: resolved projects in the same market, else the same country, each needing MIN_ODDS; else pooled (context only)."""
    P = [x for x in pool if x[0]['id'] != exclude]
    for lvl, key in (('market', 'market'), ('country', 'country')):
        g = [x for x in P if x[0][key] == r[key]]
        if len(g) >= MIN_ODDS:
            return lvl, r[key], g
    return 'all', 'all markets', P


def odds(g):
    n = len(g); k = sum(y for _, y in g)
    lo, hi = wilson(k, n)
    return {'n': n, 'k': k, 'p': pct(k, n), 'lo': lo, 'hi': hi}


def load(p, default=None):
    try:
        return json.load(open(p))
    except Exception:
        return default


def sha_file(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def transparency(cases):
    by = {}
    for c in cases:
        by.setdefault(c.get('market'), []).append(c)
    out = []
    for m, a in by.items():
        n = len(a)
        if n < 3:
            continue
        disc = sum((c.get('score') or 0) / 6 for c in a) / n
        conf = sum((c.get('vscore') or 0) / 6 for c in a) / n
        clean = sum(0 if (c.get('flags') or []) else 1 for c in a) / n
        out.append({'market': m, 'projects': n, 'transparency_index': math.floor((0.6 * disc + 0.3 * conf + 0.1 * clean) * 100 + 0.5 + 1e-9)})
    out.sort(key=lambda x: (-x['transparency_index'], -x['projects']))
    return out


# ---------- SVG charts (CC BY 4.0) ----------
INK, MUTED, LINE, HI, BG = '#17212B', '#5B6670', '#E3E2DD', '#FF5B14', '#FFFFFF'
FONT = "Archivo, 'Helvetica Neue', Arial, sans-serif"


def svg_bars(title, sub, rows, unit, credit, maxv=None):
    """Horizontal bars: rows = [(label, value, note)]."""
    W, L, R, top, bh, gap = 760, 190, 120, 78, 20, 8
    H = top + len(rows) * (bh + gap) + 56
    mv = maxv or max([v for _, v, _ in rows] + [1])
    x = lambda v: L + (W - L - R) * v / mv
    e = html.escape
    s = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" role="img" aria-labelledby="t d">' % (W, H, W, H),
         '<title id="t">%s</title><desc id="d">%s. %s</desc>' % (e(title), e(sub), e(credit)),
         '<rect width="100%%" height="100%%" fill="%s"/>' % BG,
         '<g font-family="%s">' % FONT,
         '<text x="24" y="34" font-size="20" font-weight="700" fill="%s">%s</text>' % (INK, e(title)),
         '<text x="24" y="56" font-size="13" fill="%s">%s</text>' % (MUTED, e(sub))]
    for t in range(0, 5):
        v = mv * t / 4
        s.append('<line x1="%.1f" x2="%.1f" y1="%d" y2="%d" stroke="%s"/>' % (x(v), x(v), top - 6, H - 50, LINE))
        s.append('<text x="%.1f" y="%d" font-size="11" text-anchor="middle" fill="%s">%s%s</text>' % (x(v), H - 36, MUTED, ('%g' % round(v, 1)), unit))
    for i, (lab, v, note) in enumerate(rows):
        y = top + i * (bh + gap)
        w = max(2.0, x(v) - L)
        s.append('<text x="%d" y="%d" font-size="13" text-anchor="end" fill="%s">%s</text>' % (L - 10, y + 15, INK, e(lab)))
        s.append('<path d="M%d %d h%.1f a4 4 0 0 1 4 4 v%d a4 4 0 0 1 -4 4 h-%.1f z" fill="%s"><title>%s: %s%s %s</title></path>' % (
            L, y, w - 4, bh - 8, w - 4, HI, e(lab), '%g' % v, unit, e(note)))
        s.append('<text x="%.1f" y="%d" font-size="12" fill="%s"><tspan font-weight="700" fill="%s">%s%s</tspan> %s</text>' % (
            L + w + 8, y + 15, MUTED, INK, '%g' % v, unit, e(note)))
    s.append('<text x="24" y="%d" font-size="11" fill="%s">%s</text>' % (H - 12, MUTED, e(credit)))
    s.append('</g></svg>')
    return '\n'.join(s) + '\n'


def svg_hist(title, sub, bins, credit):
    W, H, L, R, T, B = 760, 380, 56, 24, 80, 74
    mv = max([n for _, n in bins] + [1])
    bw = (W - L - R) / len(bins)
    y = lambda v: T + (H - T - B) * (1 - v / mv)
    e = html.escape
    s = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d" role="img" aria-labelledby="t d">' % (W, H, W, H),
         '<title id="t">%s</title><desc id="d">%s. %s</desc>' % (e(title), e(sub), e(credit)),
         '<rect width="100%%" height="100%%" fill="%s"/>' % BG, '<g font-family="%s">' % FONT,
         '<text x="24" y="34" font-size="20" font-weight="700" fill="%s">%s</text>' % (INK, e(title)),
         '<text x="24" y="56" font-size="13" fill="%s">%s</text>' % (MUTED, e(sub))]
    step = max(1, int(math.ceil(mv / 4.0)))
    for v in range(0, mv + 1, step):
        s.append('<line x1="%d" x2="%d" y1="%.1f" y2="%.1f" stroke="%s"/><text x="%d" y="%.1f" font-size="11" text-anchor="end" fill="%s">%d</text>' % (
            L, W - R, y(v), y(v), LINE, L - 8, y(v) + 4, MUTED, v))
    for i, (lab, n) in enumerate(bins):
        x0 = L + i * bw + 3
        h = (H - T - B) * n / mv
        if n:
            s.append('<path d="M%.1f %.1f v-%.1f a4 4 0 0 1 4 -4 h%.1f a4 4 0 0 1 4 4 v%.1f z" fill="%s"><title>%s months: %d projects</title></path>' % (
                x0, H - B, max(0.0, h - 4), bw - 14, max(0.0, h - 4), HI, e(lab), n))
        s.append('<text x="%.1f" y="%.1f" font-size="12" font-weight="700" text-anchor="middle" fill="%s">%d</text>' % (x0 + (bw - 6) / 2, y(n) - 6, INK, n))
        s.append('<text x="%.1f" y="%d" font-size="12" text-anchor="middle" fill="%s">%s</text>' % (x0 + (bw - 6) / 2, H - B + 18, MUTED, e(lab)))
    s.append('<text x="%.1f" y="%d" font-size="12" text-anchor="middle" fill="%s">months past the first promised handover</text>' % ((L + W - R) / 2, H - B + 38, MUTED))
    s.append('<text x="24" y="%d" font-size="11" fill="%s">%s</text>' % (H - 12, MUTED, e(credit)))
    s.append('</g></svg>')
    return '\n'.join(s) + '\n'


# ---------- AI paragraph with a number check ----------
NUMBER_WORDS = r'\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|hundred|thousand|half|third|quarter|dozen|double|triple|twice)\b'
BANNED = r'\b(record[- ](?:high|low|level)\w*|soar\w*|plummet\w*|surg\w*|alarming|shocking|massive|huge|dramatic\w*|significant\w*|crisis|boom\w*|crash\w*|best|worst|unprecedented|staggering|only|just|whopping|mere\w*|risky|safe|safest)\b'


def numbers_in(text):
    return [m.group(0).replace(',', '') for m in re.finditer(r'\d[\d,]*(?:\.\d+)?', text)]


def check_text(text, allowed):
    """Every number in text must be in allowed; no number words, no em or en dashes, no loaded adjectives."""
    probs = []
    if '—' in text or '–' in text:
        probs.append('dash')
    if re.search(NUMBER_WORDS, text, re.I):
        probs.append('number word: ' + re.search(NUMBER_WORDS, text, re.I).group(0))
    if re.search(BANNED, text, re.I):
        probs.append('unbacked adjective: ' + re.search(BANNED, text, re.I).group(0))
    nums = numbers_in(text)
    bad = [n for n in nums if n not in allowed]
    if bad:
        probs.append('numbers not in the data: ' + ', '.join(bad[:8]))
    return {'numbers_found': nums, 'all_backed': not probs, 'problems': probs}


def allowed_numbers(facts, NOWd):
    s = set()
    def add(v):
        if v is None or isinstance(v, bool):
            return
        if isinstance(v, (int, float)):
            for t in ('%g' % v, '%d' % round(v) if float(v).is_integer() else '%.1f' % v, '%.1f' % v, '%.2f' % v):
                s.add(t)
            if float(v).is_integer():
                s.add(str(int(v)))
        elif isinstance(v, str):
            for n in numbers_in(v):
                s.add(n)
        elif isinstance(v, dict):
            for x in v.values():
                add(x)
        elif isinstance(v, (list, tuple)):
            for x in v:
                add(x)
    add(facts)
    s.update({str(NOWd.year), str(NOWd.day), '6'})
    return s


def ask_claude(facts, key, model='claude-haiku-5-5', max_usd=0.05):   # 9 Nov 2026 (owner): Kolaboro AI capped at 10 USD a week in total, Haiku only
    prompt = ('You write one paragraph for a monthly press release about off-plan property data. Use ONLY the numbers in the JSON below, '
              'copied exactly as written (same rounding, digits not words). Do not add any other number, date, comparison, cause, forecast or opinion. '
              'Do not name any developer or project. No adjectives unless a number in the same sentence backs them. No dashes. '
              'Plain English, 90 to 140 words, third person ("Kolaboro data show"). Mention that history for the delay index starts this month. '
              'Return only the paragraph.\n\nJSON:\n' + json.dumps(facts, ensure_ascii=False))
    # worst case of this request at the guard prices below, checked before it is sent (real Sonnet cost is about a fifth of it)
    if (len(prompt) / 2.5) * 3e-6 + 600 * 15e-6 > max_usd:
        raise RuntimeError('spend guard: request could pass the cap')
    body = json.dumps({'model': model, 'max_tokens': 600, 'messages': [{'role': 'user', 'content': prompt}]}).encode()
    req = urllib.request.Request('https://api.anthropic.com/v1/messages', data=body, method='POST', headers={
        'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json'})
    with urllib.request.urlopen(req, timeout=90) as r:
        d = json.loads(r.read())
    u = d.get('usage', {})
    # spending guard: priced at 15 USD per million input and 75 USD per million output tokens, well above Sonnet list prices
    usd = u.get('input_tokens', 0) * 3e-6 + u.get('output_tokens', 0) * 15e-6
    if usd > max_usd:
        raise RuntimeError('spend guard')
    text = ''.join(b.get('text', '') for b in d.get('content', []) if b.get('type') == 'text').strip()
    return text, {'stop_reason': d.get('stop_reason'), 'blocks': [b.get('type') for b in d.get('content', [])], 'words': len(text.split()), 'model': d.get('model', model), 'input_tokens': u.get('input_tokens', 0), 'output_tokens': u.get('output_tokens', 0), 'usd_upper_bound': round(usd, 4)}


def tm_write(raw, cases_path, month, upd, out_dir):
    # n33b (20 Nov 2026): the month's frozen edition of the transparency ranking by market, served at /reports/transparency/<YYYY-MM>/.
    # Same rules and rounding as marketStats in _worker.js/kolaboro.js (/api/open/markets).
    from decimal import Decimal, ROUND_HALF_UP
    fx2 = lambda x: float(Decimal(x).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
    half = lambda x: math.floor(x + 0.5 + 1e-9)
    by = {}
    for c in raw['cases']:
        by.setdefault(c.get('market'), []).append(c)
    rows = []
    for m, a in by.items():
        n = len(a)
        if n < 3:
            continue
        avg = lambda f: sum((f(c) or 0) for c in a) / n
        disc, conf, clean = avg(lambda c: (c.get('score') or 0) / 6), avg(lambda c: (c.get('vscore') or 0) / 6), avg(lambda c: 0 if (c.get('flags') or []) else 1)
        rows.append({'market': m, 'country': a[0].get('country'), 'projects': n, 'avg_checks': fx2(avg(lambda c: c.get('score'))), 'avg_confirmed': fx2(avg(lambda c: c.get('vscore'))),
                     'permit_public_pct': half(avg(lambda c: 1 if (c.get('checks') or {}).get('permit') == 2 else 0) * 100),
                     'deposit_protection_pct': half(avg(lambda c: 1 if (c.get('checks') or {}).get('escrow') is True else 0) * 100),
                     'all_six_public': sum(1 for c in a if c.get('score') == 6 and not (c.get('flags') or [])), 'with_flags': sum(1 for c in a if (c.get('flags') or [])),
                     'transparency_index': math.floor((0.6 * disc + 0.3 * conf + 0.1 * clean) * 100 + 0.5 + 1e-9)})
    rows.sort(key=lambda x: (-x['transparency_index'], -x['projects'], x['market']))
    for i, r in enumerate(rows):
        r['rank'] = i + 1
    os.makedirs(out_dir, exist_ok=True)
    o = {'version': 'kolaboro-transparency-monthly-1', 'edition': month, 'data_as_of': upd[:10], 'frozen': datetime.date.today().isoformat(),
         'source': {'file': '/data/bali-cases.json', 'sha256': sha_file(cases_path), 'projects': len(raw['cases'])},
         'method': 'transparency_index = 60% average public checks / 6 + 30% average confirmed checks / 6 + 10% share without problems in public reports, x 100, rounded half up; markets with 3 or more tracked projects. Same rule as /api/open/markets and /transparency-index/.',
         'licence': 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)', 'page': BASE + '/reports/transparency/' + month + '/', 'markets': rows}
    json.dump(o, open(os.path.join(out_dir, month + '.json'), 'w'), indent=0, ensure_ascii=False, separators=(',', ':'))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cases', required=True)
    ap.add_argument('--prices')
    ap.add_argument('--named', help='/data/named.json: research records with the handover date (fx.handover_promised)')
    ap.add_argument('--promises', help='/data/promises.json: dated handover promises with their history')
    ap.add_argument('--prev-delay')
    ap.add_argument('--prev-ontime')
    ap.add_argument('--prev-release')
    ap.add_argument('--template')
    ap.add_argument('--out', required=True)
    ap.add_argument('--force-press', action='store_true')
    ap.add_argument('--no-ai', action='store_true')
    a = ap.parse_args()
    os.makedirs(os.path.join(a.out, 'press'), exist_ok=True)

    raw = json.load(open(a.cases))
    cases = [c for c in raw['cases'] if c.get('market') not in HIDE_MARKETS]
    upd = raw.get('updated') or datetime.date.today().isoformat()
    NOWd = datetime.date.fromisoformat(upd[:10])
    NOW = mi(NOWd.year, NOWd.month)
    month = ym(NOW)
    inputs = [{'file': '/data/bali-cases.json', 'sha256': sha_file(a.cases), 'updated': upd, 'projects': len(cases)}]
    NM, PR = {}, {}
    if a.named and os.path.exists(a.named):
        nj = json.load(open(a.named)); NM = {x['id']: x for x in nj.get('projects') or [] if x.get('id')}
        inputs.append({'file': '/data/named.json', 'sha256': sha_file(a.named), 'updated': nj.get('updated'), 'projects': len(NM)})
    if a.promises and os.path.exists(a.promises):
        pj = json.load(open(a.promises)); PR = pj.get('projects') or {}
        inputs.append({'file': '/data/promises.json', 'sha256': sha_file(a.promises), 'updated': pj.get('updated'), 'projects': len(PR)})
    rows = [derive(c, NOW, current_handover(c['id'], PR, NM)) for c in cases]

    # ---- 1. delay index ----
    bym = {}
    for r in rows:
        bym.setdefault(r['market'], []).append(r)
    mk = sorted((market_row(m, rs) for m, rs in bym.items()), key=lambda o: (-o['with_date'], o['market']))
    allrow = market_row('All markets', rows)
    prev = load(a.prev_delay, {}) or {}
    for h in prev.get('history') or []:
        for m in HIDE_MARKETS:
            (h.get('markets') or {}).pop(m, None)
    hist = [h for h in (prev.get('history') or []) if h.get('month') != month]
    old = [h for h in (prev.get('history') or []) if h.get('month') == month]
    snap = old[0] if old else {
        'month': month, 'taken': upd, 'input_sha256': inputs[0]['sha256'],
        'all': {k: allrow[k] for k in ('tracked', 'with_date', 'past_first', 'past_current', 'share_past_first', 'share_past_current', 'median_late', 'p90_late')},
        'markets': {o['market']: [o['with_date'], o['past_first'], o['share_past_first'], o['median_late'], o['p90_late']] for o in mk if o['with_date'] >= MIN_MARKET}}
    hist = sorted(hist + [snap], key=lambda h: h['month'])
    delay = {
        'version': VERSION, 'generated': upd, 'as_of_month': month, 'history_starts': hist[0]['month'], 'licence': 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)',
        'what': 'How far tracked off-plan projects are behind the first handover date we have on record, by market.',
        'rules': {'min_sample': MIN_MARKET, 'quantile': 'linear interpolation between order statistics (type 7, as numpy and spreadsheet PERCENTILE.INC)',
                  'month_now': month,
                  'current_handover': 'month of the currently published handover, from the best available record: the overdue watcher reading (today minus its months) when there is one; else the dated handover promise in /data/promises.json (moved to a later date when the same records show one); else the handover in the project research record in /data/named.json; the last month of the period named (a quarter counts as its third month, a year as December); else December of the advertised year in /data/bali-cases.json. on-time.json gives each project its source (hs) and the date the record was read (hr)',
                  'past_current': 'not completed and the month now is after the current handover month (a watcher reading, or a dated record whose month has passed); a year-only date from /data/bali-cases.json that has passed without a reading stays inconsistent and is left out',
                  'first_handover': 'current handover minus the recorded months the date has moved (delay)',
                  'months_late': 'month now minus first handover, for projects not completed whose first handover has passed',
                  'share_past_first': 'projects past the first handover / projects not completed with a usable handover date',
                  'share_past_current': 'projects past the currently advertised handover / the same denominator'},
        'caveats': ['History starts in %s %d: one monthly snapshot is stored each month from now on, so trends need time.' % (MON[NOWd.month - 1], NOWd.year),
                    'Where only a year is public we assume December, and where no date move is recorded we assume none. Both can only understate lateness.',
                    'Dates are what developers and agents advertise, read from their pages. A misread date changes a project\'s figure.',
                    'The tracked projects are the ones being marketed now, not every project in a market. Projects that were finished and stopped marketing are under-represented.'],
        'all_markets': allrow, 'markets': mk, 'history': hist, 'inputs': inputs}

    # ---- 2. on-time odds ----
    pool = [(r, y) for r in rows for y in [resolved(r, NOW)] if y is not None]
    groups, ids = {}, {}
    for r in rows:
        st = r['status']
        rec = {'s': st, 'm': r['market'], 'cur': ym(r['cur']) if r['cur'] else None, 'first': ym(r['first']) if r['first'] else None,
               'moved': r['d'], 'overdue': r['od']}
        if r['hs']:
            rec['hs'] = r['hs']
        if r['hr']:
            rec['hr'] = r['hr']
        if st == 'open':
            lvl, key, g = odds_group(pool, r)
            gk = lvl + ':' + key
            if gk not in groups:
                groups[gk] = dict(odds(g), level=lvl, name=key)
            rec['g'] = gk
            rec['to_first'] = r['first'] - NOW
        ids[r['id']] = rec
    # back-test: leave one out over projects whose window has closed
    bt = []
    for r, y in pool:
        lvl, key, g = odds_group(pool, r, exclude=r['id'])
        o = odds(g)
        bt.append((o['p'] / 100.0, y, lvl))
    def brier(ps):
        return round(sum((p - y) ** 2 for p, y in ps) / len(ps), 4) if ps else None
    base = (sum(y for _, y in pool) / len(pool)) if pool else None
    bins = []
    for lo in range(0, 100, 10):
        b = [(p, y) for p, y, _ in bt if lo <= p * 100 < lo + 10 or (lo == 90 and p == 1)]
        if b:
            bins.append({'predicted_from': lo, 'predicted_to': lo + 10, 'n': len(b), 'mean_predicted': round(100 * sum(p for p, _ in b) / len(b), 1),
                         'observed': round(100 * sum(y for _, y in b) / len(b), 1)})
    lv = {}
    for _, _, l in bt:
        lv[l] = lv.get(l, 0) + 1
    validation = {
        'method': 'Leave one out: for each project whose window has closed, the estimate is recomputed from all other closed projects with the same rule, then compared with what happened.',
        'n': len(bt), 'on_time': sum(y for _, y in pool), 'levels_used': lv,
        'brier': brier([(p, y) for p, y, _ in bt]), 'brier_constant_50': brier([(0.5, y) for _, y, _ in bt]),
        'brier_constant_base_in_sample': brier([(base, y) for _, y, _ in bt]) if base is not None else None,
        'calibration': bins,
        'verdict': ('With %d closed cases and no market reaching %d, every back-test estimate falls back to the pooled rate, so the estimate has no power to tell projects apart yet. '
                    'Its calibration is only as good as the pooled rate: it matches the average by construction and says nothing about any single project.' % (len(bt), MIN_ODDS))
                   if all(l == 'all' for _, _, l in bt) else
                   'Calibration table below; read it with the sample sizes, which are small.'}
    prev_ot = load(a.prev_ontime, {}) or {}
    snaps = {k: v for k, v in (prev_ot.get('snapshots') or {}).items()}
    if month not in snaps:
        snaps[month] = {'taken': upd, 'rows': {r['id']: '%s|%s|%d|%d' % ({'off-plan': 'o', 'under construction': 'u', 'completed': 'c'}.get(r['stage'], '-'),
                                                                         ym(r['cur']) if r['cur'] else '-', r['d'], r['od']) for r in rows}}
    counts = {}
    for v in ids.values():
        counts[v['s']] = counts.get(v['s'], 0) + 1
    ontime = {
        'version': 'on-time-1', 'generated': upd, 'as_of_month': month, 'licence': 'CC BY 4.0 (credit: Kolaboro, kolaboro.com)',
        'question': 'Will this project hand over within %d months of the first handover date we have on record?' % WINDOW,
        'rules': {'window_months': WINDOW, 'min_comparables': MIN_ODDS, 'interval': 'Wilson score interval, 95%',
                  'closed': 'a project whose first handover is more than %d months in the past (month now minus first handover > %d)' % (WINDOW, WINDOW),
                  'on_time': 'a closed project marked completed whose recorded date moves add up to %d months or less' % WINDOW,
                  'comparables': 'closed projects in the same market if there are at least %d, else in the same country if at least %d, else not enough comparable projects (the pooled figure over all markets is then shown only as context)' % (MIN_ODDS, MIN_ODDS),
                  'status': {'open': 'not completed, first handover less than %d months ago or still ahead, and the advertised date has not moved more than %d months: estimated' % (WINDOW, WINDOW),
                             'missed': 'not completed and more than %d months past the first handover: already answered, no' % WINDOW,
                             'moved': 'not completed and the developer\'s own current date is more than %d months after the first one: no, unless it hands over earlier than it now says' % WINDOW,
                             'done_on_time': 'completed, recorded moves of %d months or less' % WINDOW, 'done_late': 'completed, recorded moves of more than %d months' % WINDOW,
                             'no_date': 'no handover date in the open data', 'completed_no_date': 'completed, no date in the open data',
                             'inconsistent': 'a past handover year in /data/bali-cases.json with no overdue reading and no dated handover record: left out until its page is read again'}},
        'why_not_stage': ('The brief for this estimate asked to match on stage and on months to the promised date. The open data has no dated record of what stage each closed project '
                          'was at, or when its delay was announced, so matching on today\'s stage would be circular (a project that handed over is "completed" because of the outcome). '
                          'The monthly snapshot below records stage, advertised date and moves for every project from %s %d, so comparables can be matched on stage and time to handover once those snapshots have closed windows.' % (MON[NOWd.month - 1], NOWd.year)),
        'bias': ('The tracked projects are the ones being marketed now. Projects that handed over on time and stopped marketing are less likely to be in the data, so the on-time rate among closed projects is very likely lower than the true rate. Treat it as a floor for what this data set shows, not as a forecast.'),
        'pooled': odds(pool) if pool else None, 'closed_by_market': {},
        'groups': groups, 'counts': counts, 'validation': validation, 'projects': ids, 'snapshots': snaps, 'inputs': inputs}
    for r, y in pool:
        cm = ontime['closed_by_market'].setdefault(r['market'], [0, 0]); cm[0] += 1; cm[1] += y

    # ---- 3. press release ----
    prices = load(a.prices, None) if a.prices else None
    ti = transparency(raw['cases'])
    tiv = sorted(x['transparency_index'] for x in ti)
    ti_med = q7(tiv, 0.5) if tiv else None
    pi_last = pi_base = None
    if prices and (prices.get('all_markets') or {}).get('index'):
        ix = prices['all_markets']['index']
        pi_base, pi_last = ix[0], ix[-1]
        inputs.append({'file': '/data/price-index.json', 'sha256': sha_file(a.prices), 'generated': prices.get('generated')})
    prev_rel = load(a.prev_release, None) if a.prev_release else None
    regenerate = a.force_press or not prev_rel or prev_rel.get('month') != month
    credit = 'Kolaboro, kolaboro.com. CC BY 4.0. Data: kolaboro.com/data/delay-index.json, %s %d.' % (MON[NOWd.month - 1], NOWd.year)
    if regenerate:
        A = allrow
        heads = [
            {'key': 'share_past_first', 'value': A['share_past_first'], 'unit': '%', 'display': '%g%%' % A['share_past_first'],
             'text': '%s%% of tracked off-plan projects with a usable handover date (%d of %d) are past the first handover date on record.' % (A['share_past_first'], A['past_first'], A['with_date']),
             'source': [BASE + '/index/delays/', BASE + '/data/delay-index.json']},
            {'key': 'median_late', 'value': A['median_late'], 'unit': 'months', 'display': '%g months' % A['median_late'],
             'text': 'Median time past the first handover date among those %d projects: %s months (90th percentile: %s months).' % (A['past_first'], '%g' % A['median_late'], '%g' % A['p90_late']),
             'source': [BASE + '/index/delays/', BASE + '/data/delay-index.json']},
            {'key': 'share_past_current', 'value': A['share_past_current'], 'unit': '%', 'display': '%g%%' % A['share_past_current'],
             'text': '%s%% (%d of %d) are past the handover date their sellers advertise today.' % (A['share_past_current'], A['past_current'], A['with_date']),
             'source': [BASE + '/index/delays/', BASE + '/data/bali-cases.json']},
            {'key': 'transparency_median', 'value': ti_med, 'unit': 'of 100', 'display': '%g of 100' % ti_med,
             'text': 'Median transparency index across %d markets with 3 or more tracked projects: %s out of 100.' % (len(ti), '%g' % ti_med),
             'source': [BASE + '/transparency-index/', BASE + '/api/open/markets']},
        ]
        if pi_last:
            ch = round(pi_last['index'] - 100, 2)
            heads.append({'key': 'price_index', 'value': round(pi_last['index'], 2), 'unit': 'index', 'display': '%.2f' % pi_last['index'],
                          'text': 'Advertised asking-price index, all tracked markets: %s on %s (base 100 on %s, same-project pairs only).' % ('%.2f' % pi_last['index'], pi_last['date'], pi_base['date']),
                          'source': [BASE + '/index/prices/', BASE + '/data/price-index.json']})
        else:
            heads.append({'key': 'tracked', 'value': len(cases), 'unit': 'projects', 'display': '%d projects' % len(cases), 'text': '%d off-plan projects tracked in %d markets.' % (len(cases), len(bym)),
                          'source': [BASE + '/database', BASE + '/data/bali-cases.json']})
        topm = sorted([o for o in mk if o['share_past_first'] is not None], key=lambda o: (-o['share_past_first'], -o['with_date']))
        facts = {'month': '%s %d' % (MON[NOWd.month - 1], NOWd.year), 'tracked_projects': len(cases), 'markets_tracked': len(bym),
                 'projects_with_usable_handover_date': A['with_date'], 'past_first_handover': A['past_first'], 'share_past_first_pct': A['share_past_first'],
                 'past_current_advertised_handover': A['past_current'], 'share_past_current_pct': A['share_past_current'],
                 'median_months_past_first_handover': A['median_late'], 'p90_months_past_first_handover': A['p90_late'],
                 'markets_with_at_least_5_dated_projects': len(topm),
                 'transparency_index_median': ti_med, 'markets_with_transparency_index': len(ti),
                 'price_index_all_markets': ('%.2f' % pi_last['index']) if pi_last else None, 'price_index_base_date': pi_base['date'] if pi_base else None,
                 'price_index_date': pi_last['date'] if pi_last else None,
                 'constants': {'percentile': 90, 'transparency_min_projects': 3, 'index_base': 100, 'transparency_scale_max': 100, 'min_market_sample': MIN_MARKET}}
        allowed = allowed_numbers(facts, NOWd)
        tpl = ('Kolaboro data for %s cover %d off-plan projects in %d markets. Of the %d projects with a usable handover date that are not completed, %d (%s%%) are past the first handover date on record, '
               'with a median of %s months and a 90th percentile of %s months past that date. %d (%s%%) are past the date their sellers advertise today. '
               'The median transparency index across %d markets with 3 or more projects is %s out of 100.%s History for the delay index starts this month.') % (
            facts['month'], len(cases), len(bym), A['with_date'], A['past_first'], A['share_past_first'], '%g' % A['median_late'], '%g' % A['p90_late'],
            A['past_current'], A['share_past_current'], len(ti), '%g' % ti_med,
            (' The advertised asking-price index for all tracked markets stood at %s on %s, against a base of 100 on %s.' % (facts['price_index_all_markets'], pi_last['date'], pi_base['date'])) if pi_last else '')
        para, by, spend, chk = tpl, 'template', None, None
        key = os.environ.get('ANTHROPIC_API_KEY')
        if key and not a.no_ai:
            try:
                txt, spend = ask_claude(facts, key)
                chk = check_text(txt, allowed)
                if chk['all_backed'] and 60 <= len(txt.split()) <= 200:
                    para, by = txt, 'checked-draft'
                else:
                    chk['rejected'] = True
                    chk['words'] = len(txt.split())
                    chk['draft'] = txt[:2000]
            except Exception as e:
                chk = {'error': str(e)[:200], 'rejected': True}
        tchk = check_text(tpl, allowed)
        if by == 'template' and not tchk['all_backed']:
            print('template failed its own check', tchk, file=sys.stderr)
            sys.exit(2)
        charts = []
        rows1 = [(o['market'], o['share_past_first'], 'n=%d' % o['with_date']) for o in topm[:15]]
        if rows1:
            open(os.path.join(a.out, 'press', 'chart-delays.svg'), 'w').write(svg_bars(
                'Share of projects past the first promised handover', 'Markets with 5 or more dated projects, not completed (n = projects). %s %d.' % (MON[NOWd.month - 1], NOWd.year),
                rows1, '%', credit, maxv=100))
            charts.append({'file': 'chart-delays.svg', 'title': 'Share of projects past the first promised handover, by market'})
        B = [('1 to 3', 1, 3), ('4 to 6', 4, 6), ('7 to 12', 7, 12), ('13 to 24', 13, 24), ('25 to 36', 25, 36), ('37+', 37, 10 ** 6)]
        late = allrow['late_months']
        open(os.path.join(a.out, 'press', 'chart-months-late.svg'), 'w').write(svg_hist(
            'How far past the first promised handover', '%d tracked projects past that date, all markets. %s %d.' % (len(late), MON[NOWd.month - 1], NOWd.year),
            [(l, sum(1 for v in late if lo <= v <= hi)) for l, lo, hi in B], credit))
        charts.append({'file': 'chart-months-late.svg', 'title': 'Months past the first promised handover, all markets'})
        rows3 = [(x['market'], x['transparency_index'], 'n=%d' % x['projects']) for x in ti if x['projects'] >= 10]
        if rows3:
            open(os.path.join(a.out, 'press', 'chart-transparency.svg'), 'w').write(svg_bars(
                'Transparency index by market', 'Markets with 10 or more tracked projects, 0 to 100 (n = projects). %s %d.' % (MON[NOWd.month - 1], NOWd.year),
                rows3, '', credit.replace('delay-index.json', 'api/open/markets'), maxv=100))
            charts.append({'file': 'chart-transparency.svg', 'title': 'Transparency index by market'})
        previous = []
        if prev_rel and prev_rel.get('month') != month:
            previous = [{'month': prev_rel['month'], 'headlines': [h['text'] for h in prev_rel.get('headlines', [])], 'paragraph': (prev_rel.get('paragraph') or {}).get('text')}] + (prev_rel.get('previous') or [])
        elif prev_rel:
            previous = prev_rel.get('previous') or []
        rel = {'version': 'press-monthly-1', 'month': month, 'title': 'Kolaboro off-plan data, %s %d' % (MON[NOWd.month - 1], NOWd.year), 'generated': upd,
               'licence': 'CC BY 4.0', 'credit': 'Kolaboro, kolaboro.com', 'contact': 'press@kolaboro.com',
               'headlines': heads, 'paragraph': {'text': para, 'by': by, 'check': chk if by != 'template' else (chk or {'note': 'template text'}), 'template_check': tchk},
               'ai_spend': ({k: v for k, v in spend.items() if k != 'model'} or None) if spend else None, 'charts': charts, 'facts': facts, 'inputs': inputs,
               'rules': ['Every number comes from the linked files.', 'No developers or projects are named.', 'Adjectives appear only when a number in the same sentence backs them.',
                         'Code checks that every number in the summary paragraph appears in the facts above, and uses the template text if any does not.'],
               'previous': previous[:24]}
        json.dump(rel, open(os.path.join(a.out, 'press', 'release.json'), 'w'), indent=1, ensure_ascii=False)
        tm_write(raw, a.cases, month, upd, os.path.join(a.out, 'tm'))   # n33b: frozen edition for /reports/transparency/<month>/
        txt = [rel['title'], '=' * len(rel['title']), '', 'Licence: CC BY 4.0. Credit: Kolaboro, kolaboro.com. Contact: press@kolaboro.com', '', 'Headline numbers', '']
        for i, h in enumerate(heads, 1):
            txt += ['%d. %s' % (i, h['text']), '   Source: ' + ' and '.join(h['source']), '']
        txt += ['Summary', '', para, '', '(Every number in this summary was checked against the data by code.)', '',
                'Charts (SVG, CC BY 4.0):'] + ['  ' + BASE + '/press/monthly/' + c['file'] + '  ' + c['title'] for c in charts] + [
                '', 'Method: ' + BASE + '/index/delays/', 'JSON: ' + BASE + '/press/monthly/release.json', '']
        open(os.path.join(a.out, 'press', 'release.txt'), 'w').write('\n'.join(txt))
    else:
        rel = prev_rel

    # ---- page from template ----
    # n40 k27: the page is only rewritten with a new edition; otherwise the published page (with any later edits to it) stays as it is
    if a.template and os.path.exists(a.template) and rel and regenerate:
        t = open(a.template).read()
        e = html.escape
        hl = ''.join('<li><b class="pm-v">%s</b><span>%s</span><span class="pm-src">Source: %s</span></li>' % (
            e(h.get('display') or ('%g' % h['value'])), e(h['text']),
            ' and '.join('<a href="%s">%s</a>' % (e(s.replace(BASE, '')), e(s.replace(BASE, ''))) for s in h['source'])) for h in rel['headlines'])
        ch = ''.join('<figure class="pm-fig"><img src="/press/monthly/%s?m=%s" alt="%s" width="760" loading="lazy"><figcaption>%s. <a href="/press/monthly/%s" download>Download SVG</a>. CC BY 4.0, credit: Kolaboro, kolaboro.com.</figcaption></figure>' % (
            e(c['file']), e(rel['month']), e(c['title']), e(c['title']), e(c['file'])) for c in rel['charts'])
        p = rel['paragraph']
        by = 'Checked by code: every number in this summary appears in the data files listed below.'   # n33b (20 Nov 2026): public copy names no model or vendor
        prevh = ''.join('<details class="pm-prev"><summary>%s</summary><ol>%s</ol><p>%s</p></details>' % (e(x['month']), ''.join('<li>%s</li>' % e(h) for h in x['headlines']), e(x.get('paragraph') or '')) for x in rel.get('previous') or [])
        body = ('<p class="pm-meta">%s. Generated %s from the files listed below. Licence CC BY 4.0, credit: Kolaboro, kolaboro.com. '
                'Also as <a href="/press/monthly/release.txt">plain text</a> and <a href="/press/monthly/release.json">JSON</a>.</p>'
                '<h2>Five numbers</h2><ol class="pm-h">%s</ol>'
                '<h2>Summary</h2><p class="pm-p">%s</p><p class="pm-fine">%s</p>'
                '<h2>Charts you may reuse</h2><div class="pm-figs">%s</div>'
                '<h2>Inputs</h2><ul class="pm-in">%s</ul>%s') % (
            e(rel['title']), e(rel['generated']), hl, e(p['text']), by, ch,
            ''.join('<li><a href="%s">%s</a> <code>sha256 %s</code></li>' % (e(i['file']), e(i['file']), e(i['sha256'][:16])) for i in rel['inputs']),
            ('<h2>Earlier months</h2>' + prevh) if prevh else '<h2>Earlier months</h2><p>This is the first monthly release. A new one is generated on the first run of each month.</p>')
        t2 = re.sub(r'<!--PM:BEGIN-->.*?<!--PM:END-->', lambda m: '<!--PM:BEGIN-->' + body + '<!--PM:END-->', t, flags=re.S)
        open(os.path.join(a.out, 'press', 'index.html'), 'w').write(t2)

    json.dump(delay, open(os.path.join(a.out, 'delay-index.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
    json.dump(ontime, open(os.path.join(a.out, 'on-time.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
    print(json.dumps({'month': month, 'with_date': allrow['with_date'], 'past_first': allrow['past_first'], 'share': allrow['share_past_first'],
                      'median': allrow['median_late'], 'p90': allrow['p90_late'], 'markets_shown': sum(1 for o in mk if o['share_past_first'] is not None),
                      'closed': len(pool), 'on_time_closed': sum(y for _, y in pool), 'counts': counts, 'press_regenerated': regenerate,
                      'paragraph_by': rel['paragraph']['by'] if rel else None, 'ai_spend': rel.get('ai_spend') if rel else None}))


if __name__ == '__main__':
    main()
