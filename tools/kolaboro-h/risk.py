# Build data/risk.json: an explainable "unusual versus peers" score per tracked project.
# No outcome labels exist, so this is NOT a fraud predictor. Two unsupervised views:
#   1) additive robust z-score per feature (only the risk direction counts), which gives per-feature contributions;
#   2) an isolation forest on the same features, as an independent cross-check.
import json, sys, hashlib, math, datetime, statistics
import numpy as np
from sklearn.ensemble import IsolationForest
SITE = sys.argv[1]
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from payplan import pre_completion_share
AG = sys.argv[2] if len(sys.argv) > 2 else None
PRE = {}
if AG:
    idm = json.load(open(AG + '/idmap.json'))
    PJ = {p['slug']: p for p in json.load(open(AG + '/pb.json'))['projects'] + json.load(open(AG + '/pw.json'))['projects']}
    for pid, slug in idm.items():
        v = pre_completion_share((PJ[slug].get('seed') or {}).get('payment_plan'))
        if v is not None: PRE[pid] = float(v)
raw = open(SITE + '/data/bali-cases.json', 'rb').read()
D = json.loads(raw); C = D['cases']
DATA_SHA = hashlib.sha256(raw).hexdigest()

def contradicted_checks(c): return sum(1 for v in (c.get('verified') or {}).values() if v == 'contradicted')
def claims_share(c):
    k = c.get('claims') or {}; t = (k.get('verified') or 0) + (k.get('unverified') or 0) + (k.get('contradicted') or 0)
    return (k.get('contradicted') or 0) / t if t else 0.0
def guaranteed(c): return 1 if (c.get('checks') or {}).get('returns_ok') is False else 0
def guaranteed_added(c): return 1 if any(h.get('f') == 'guaranteed-return language' and h.get('to') for h in c.get('history') or []) else 0
def sat_still(c): s = c.get('sat') or {}; return 1 if s.get('status') == 'no visible change' and c.get('stage') == 'under construction' else 0
def reg_not(c): r = c.get('register') or {}; return 1 if r and 'not' in str(r.get('status', '')).lower() else 0

# kind: 'bin' = present or not; 'num' = continuous, zero when absent
F = [
  ('guaranteed_return_language', 'bin', guaranteed, 'Advertises guaranteed returns'),
  ('advertised_yield_pct', 'num', lambda c: float(c['yield']) if c.get('yield') else 0.0, 'Advertised yield, % a year'),
  ('overdue_months', 'num', lambda c: float(c['overdue'] or 0), 'Months past the advertised completion'),
  ('delay_months', 'num', lambda c: float(c['delay'] or 0), 'Months the completion date has moved'),
  ('no_permit_claimed', 'bin', lambda c: 1 if (c.get('checks') or {}).get('permit') == 0 else 0, 'No permit or licence claimed'),
  ('permit_contradicted', 'bin', lambda c: 1 if (c.get('verified') or {}).get('permit') == 'contradicted' else 0, 'Permit claim contradicted by a register or document'),
  ('no_deposit_protection', 'bin', lambda c: 1 if not (c.get('checks') or {}).get('escrow') else 0, 'No deposit protection stated'),
  ('contradicted_checks', 'num', lambda c: float(contradicted_checks(c)), 'Checks contradicted by an independent source'),
  ('contradicted_claims_share', 'num', claims_share, 'Share of claims contradicted'),
  ('public_problem_flags', 'num', lambda c: float(len(c.get('flags') or [])), 'Public problems reported (disputes, complaints, regulator action)'),
  ('register_not_approved', 'bin', reg_not, 'Not on the official approval register checked'),
  ('satellite_no_change', 'bin', sat_still, 'Sold as under construction, no visible change on satellite'),
  ('front_loaded_payment_plan', 'known', lambda c: PRE.get(c['id']), 'Share of the price due before completion, % (advertised payment plan)'),
  ('no_track_record', 'bin', lambda c: 1 if not (c.get('checks') or {}).get('record') else 0, 'No developer track record found'),
]
NOT_AVAILABLE = [
  ('payment_plan_for_every_project', 'The front-loaded feature uses only advertised plans that state a clear share due on completion (%d projects). Plans written as ranges, dated schedules or options are left out rather than guessed.' % len(PRE)),
  ('price_vs_registered_sales', 'Advertised price per m2 versus official sales in the same area exists for 21 Dubai projects only (see /prices/). Too sparse across all markets to be a fair feature yet.'),
]
X = np.array([[(lambda v: np.nan if v is None else v)(f[2](c)) for f in F] for c in C], dtype=float)
N = len(C)
params, Z = [], np.zeros_like(X)
for j, (k, kind, fn, label) in enumerate(F):
    col = X[:, j]
    if kind == 'known':   # only some projects have a value: robust z among those that do; unknown adds nothing
        kn = col[~np.isnan(col)]; med = float(np.median(kn)); mad = float(np.median(np.abs(kn - med))) * 1.4826 or 1.0
        Z[:, j] = np.where(np.isnan(col), 0, np.clip((np.nan_to_num(col, nan=med) - med) / mad, 0, 8))
        params.append({'feature': k, 'label': label, 'kind': 'number, where known', 'present_pct': round(100 * len(kn) / N, 1), 'known_projects': int(len(kn)), 'median': round(med, 2), 'scale': round(mad, 4), 'scale_basis': 'MAD x 1.4826 among projects where it is known', 'z_cap': 8})
        continue
    if kind == 'bin':
        p = col.mean()
        w = min(8.0, (1 - p) / math.sqrt(p * (1 - p))) if 0 < p < 1 else 0.0
        Z[:, j] = col * w
        params.append({'feature': k, 'label': label, 'kind': 'binary', 'prevalence_pct': round(100 * float(p), 1), 'z_when_present': round(float(w), 2)})
    else:
        med = float(np.median(col)); mad = float(np.median(np.abs(col - med))) * 1.4826
        if mad > 0:
            Z[:, j] = np.clip((col - med) / mad, 0, 8)
            params.append({'feature': k, 'label': label, 'kind': 'number', 'median': round(med, 3), 'scale': round(mad, 4), 'scale_basis': 'MAD x 1.4826', 'present_pct': round(100 * float((col > 0).mean()), 1), 'z_cap': 8})
        else:
            # zero-inflated: most projects have none. z = rarity of having any (as for yes/no signs) + robust z of the size among projects that have it (0 to 4)
            p = float((col > 0).mean()); w = min(8.0, (1 - p) / math.sqrt(p * (1 - p))) if 0 < p < 1 else 0.0
            nz = col[col > 0]; m2 = float(np.median(nz)) if len(nz) else 0.0; s2 = float(np.median(np.abs(nz - m2))) * 1.4826 if len(nz) else 0.0
            if s2 == 0 and len(nz): s2 = float(np.mean(np.abs(nz - m2))) * 1.2533 or 1.0
            mag = np.clip((col - m2) / s2, 0, 4) if len(nz) else np.zeros_like(col)
            Z[:, j] = np.where(col > 0, np.minimum(8, w + mag), 0)
            params.append({'feature': k, 'label': label, 'kind': 'number, mostly zero', 'present_pct': round(100 * p, 1), 'z_when_present': round(w, 2), 'median_when_present': round(m2, 3), 'scale_when_present': round(s2, 4), 'size_z_cap': 4, 'z_cap': 8})
S = Z.sum(axis=1)
XF = np.nan_to_num(X, nan=-1.0)  # unknown gets its own value for the forest
iso = IsolationForest(n_estimators=500, random_state=7, contamination='auto').fit(XF)
A = -iso.score_samples(XF)  # higher = more isolated
def rank_pct(v):
    o = np.argsort(np.argsort(v, kind='stable'), kind='stable'); return 100.0 * o / (len(v) - 1)
RS, RA = rank_pct(S), rank_pct(A)
rho = float(np.corrcoef(RS, RA)[0, 1])
p95 = float(np.percentile(S, 95)); p75 = float(np.percentile(S, 75))
both = int(((RS >= 95) & (RA >= 95)).sum())
projects = {}
for i, c in enumerate(C):
    contrib = sorted([(F[j][0], round(float(Z[i, j]), 2)) for j in range(len(F)) if Z[i, j] > 0], key=lambda t: -t[1])
    lvl = 'unusual' if S[i] >= p95 else 'somewhat unusual' if S[i] >= p75 else 'typical'
    projects[c['id']] = {'m': c['market'], 's': round(float(S[i]), 2), 'r': round(float(RS[i]), 1), 'if': round(float(RA[i]), 1), 'lvl': lvl,
                         'c': [[k, z, round(float(X[i, [f[0] for f in F].index(k)]), 3)] for k, z in contrib]}
top = sorted(projects.items(), key=lambda t: -t[1]['s'])[:25]
mk = {}
for pid, p in projects.items():
    m = mk.setdefault(p['m'], {'market': p['m'], 'projects': 0, 'unusual': 0, 'scores': []}); m['projects'] += 1; m['unusual'] += p['lvl'] == 'unusual'; m['scores'].append(p['s'])
markets = sorted([{'market': m['market'], 'projects': m['projects'], 'unusual': m['unusual'], 'median_score': round(statistics.median(m['scores']), 2)} for m in mk.values() if m['projects'] >= 8], key=lambda t: -t['median_score'])
out = {
  'version': 'risk-patterns-1.0', 'updated': datetime.date.today().isoformat(),
  'model_card': {
    'name': 'Kolaboro risk patterns', 'version': '1.0',
    'purpose': 'Show which tracked projects look unusual on public warning signs compared with all other tracked projects, and why. It ranks; it does not predict.',
    'not_for': 'It is not a fraud predictor and not a verdict. No project in our data has a confirmed outcome (fraud, collapse or delivery), so nothing could be trained or tested against outcomes.',
    'data': {'file': '/data/bali-cases.json', 'sha256': DATA_SHA, 'dataset_date': D.get('updated'), 'projects': N, 'markets': len(mk)},
    'features': params, 'features_not_available': [{'feature': a, 'why': b} for a, b in NOT_AVAILABLE],
    'method': ['Each feature is turned into a robust z-score against all %d tracked projects. Yes/no signs: (1 - p) / sqrt(p (1 - p)) when present, where p is the share of projects showing it, so a rare sign weighs more than a common one. Numbers: (x - median) / (1.4826 x MAD). Numbers that most projects do not have at all (overdue months, contradicted checks, public problems): the same rarity term for having any, plus a robust z of the size among the projects that have it (0 to 4). Every contribution is capped at 8, and only the risky direction counts: absence of a sign adds nothing.' % N,
               'The score is the sum of these z-scores, so every point of it is traceable to one feature. Projects at or above the 95th percentile of the score are labelled "unusual", at or above the 75th "somewhat unusual".',
               'Cross-check: an isolation forest (500 trees, random_state 7, scikit-learn) on the raw features (an unknown payment plan is coded as its own value), with no labels. Its ranking is published next to ours; where both put a project in the top 5%%, the pattern is not an artefact of our weighting.'],
    'agreement': {'spearman_rank_correlation': round(rho, 3), 'top5_both_methods': both, 'top5_size': int((RS >= 95).sum())},
    'thresholds': {'unusual_score_from': round(p95, 2), 'somewhat_unusual_from': round(p75, 2)},
    'limits': ['Features come from what developers publish and what we could check; a project that publishes less can look calmer than it is.', 'Common signs (no deposit protection stated, no permit claimed) weigh little because most projects show them; that is a property of the peer group, not a judgement that they are safe.',
               'Peers are all tracked projects in every market, so market norms (for example yields in Bali) affect scores.', 'Features overlap with the public disclosure score; this view adds rarity weighting and the cross-check, not new facts.',
               'Scores change when the dataset changes; each version is tied to the dataset SHA-256 above.'],
  },
  'summary': {'unusual': sum(1 for p in projects.values() if p['lvl'] == 'unusual'), 'somewhat_unusual': sum(1 for p in projects.values() if p['lvl'] == 'somewhat unusual'), 'typical': sum(1 for p in projects.values() if p['lvl'] == 'typical')},
  'keys': {'m': 'market', 's': 'score (sum of z)', 'r': 'percentile of score among all projects', 'if': 'percentile of isolation-forest anomaly score', 'lvl': 'label', 'c': '[feature, z contribution, raw value] for every feature that contributes'},
  'top': [pid for pid, _ in top], 'markets': markets, 'projects': projects,
}
json.dump(out, open(SITE + '/data/risk.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(out['summary'], out['model_card']['agreement'], out['model_card']['thresholds'])
for pid, p in top[:8]: print(pid, p)
for x in params: print(x)
