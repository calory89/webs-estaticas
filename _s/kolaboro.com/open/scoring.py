"""Kolaboro scoring rules, open source (MIT licence), version 2026-11-01.

This is the exact logic used to turn a project's public evidence into the scores shown on kolaboro.com.
Inputs are what the research agent and researchers record for a project; outputs are the public fields
you can download from https://kolaboro.com/api/open/projects (score, vscore, tier, claims, overdue).

A high score means the information is public, not that it is genuine. Checking that is what our agents do.
"""
from datetime import date
import math
import re

LEVELS = ('registry', 'independent', 'developer', 'contradicted', 'none')
CONFIRMED = ('registry', 'independent')


def checks(project):
    """The six public checks. project = {'permit_number', 'permit_claim', 'escrow', 'progress_pct',
    'progress_updates', 'plans_published', 'developer_delivered', 'guaranteed_language', 'flags'}"""
    permit = 2 if project.get('permit_number') else (1 if project.get('permit_claim') else 0)   # 2 = number public, 1 = only claimed
    esc = project.get('escrow')
    progress = project.get('progress_pct') if project.get('progress_pct') is not None else ('updates' if project.get('progress_updates') else None)
    returns_ok = project.get('guaranteed_language') is False
    for f in project.get('flags') or []:   # a public report of guaranteed returns overrides the page
        t = (f.get('text') or '').lower()
        if 'guarantee' in t and re.search(r'return|rental|yield|income', t):
            returns_ok = False
    return {'permit': permit, 'escrow': None if esc is None else bool(esc), 'progress': progress,
            'plans': bool(project.get('plans_published')), 'record': bool(project.get('developer_delivered')), 'returns_ok': returns_ok}


def score(ck):
    """Public-disclosure score, 0 to 6: one point per check that is public."""
    return (ck['permit'] == 2) + (ck['escrow'] is True) + (ck['progress'] is not None) + bool(ck['plans']) + bool(ck['record']) + bool(ck['returns_ok'])


def level(text):
    """Verification level of one check from the researcher's note."""
    t = str(text or 'none').lower()
    return next((l for l in LEVELS if l in t), 'none')


def confirmed_score(verification):
    """vscore, 0 to 6: checks confirmed by an official registry or an independent source."""
    return sum(1 for v in (verification or {}).values() if level(v) in CONFIRMED)


def tier(s, flags, researched=6):
    """'caution' with public problems or 0-1 checks, 'clear' with 4+ (3+ when only 3 were researched), else 'mixed'."""
    if flags or s <= 1:
        return 'caution'
    return 'clear' if s >= (3 if researched == 3 else 4) else 'mixed'


def all_six_public(s, flags):
    """'100% public': all six checks public and no problems in public reports."""
    return s == 6 and not flags


def claims(claim_list):
    """Count tested claims by status: verified, unverified, contradicted."""
    out = {'verified': 0, 'unverified': 0, 'contradicted': 0}
    for c in claim_list or []:
        st = str((c or {}).get('status') or '').lower()
        if st in out:
            out[st] += 1
    return out


def overdue_months(handover_promised, stage, today=None):
    """Months past the promised handover ('2026-Q2', '2026-06', '2026') for a project not completed, else None."""
    if 'complet' in str(stage or '').lower():
        return None
    m = re.search(r'(20\d\d)(?:\s*-?\s*(?:Q([1-4])|-(\d\d)))?', str(handover_promised or ''))
    if not m:
        return None
    y = int(m.group(1)); mo = int(m.group(2)) * 3 if m.group(2) else (int(m.group(3)) if m.group(3) else 12)
    t = today or date.today(); late = (t.year - y) * 12 + (t.month - mo)
    return late if late > 0 else None


def transparency_index(cases):
    """Market index 0-100 (markets with 3+ projects): 60% avg score/6 + 30% avg vscore/6 + 10% share without public problems."""
    n = len(cases)
    if n < 3:
        return None
    disc = sum(c['score'] / 6 for c in cases) / n
    conf = sum((c.get('vscore') or 0) / 6 for c in cases) / n
    clean = sum(0 if c.get('flags') else 1 for c in cases) / n
    # Half-up rounding with a float guard, identical to transparency-index/ti-core.js (Python's round() rounds halves to even).
    return math.floor((0.6 * disc + 0.3 * conf + 0.1 * clean) * 1000 + 0.5 + 1e-9) / 10


if __name__ == '__main__':
    p = {'permit_number': 'PBG-123', 'escrow': True, 'progress_pct': 40, 'plans_published': True, 'developer_delivered': False, 'guaranteed_language': False}
    ck = checks(p); s = score(ck)
    print(ck, 'score', s, 'tier', tier(s, []), 'overdue', overdue_months('2025-Q4', 'under construction', date(2026, 11, 1)))
