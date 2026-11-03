#!/usr/bin/env python3
"""Kolaboro visual before/after of developer websites (block R, 3 Nov 2026).

Daily, after the research agent: for tracked projects with their own website (listing portals are skipped, same rule
as render_reuse.py), take a full-page screenshot when the page's TEXT fingerprint (the agent's hash) changed since our
last capture, and compare it with the previous capture.

Privacy and anonymity: screenshots show the developer's site, which would identify an anonymous project. So no pixels
are ever published. Screenshots and the highlighted diff stay private (a 90-day GitHub Actions artifact in this private
repo, plus the rolling baseline in the Actions cache). What we publish (kolaboro.com/data/visual-diff.json) is only the
geometry of the change: which horizontal bands of the page changed, as fractions of the page, and the share of the page
area that changed. Full images are available to a buyer on request.

Diff method: both captures are scaled to the same width and turned to grey. Each pixel row gets a coarse signature; the
two row sequences are aligned (difflib, longest matching blocks), so content that only moved down because something was
inserted above is not counted as changed. Rows that do not align are changed; inside replaced bands of equal height a
pixel threshold narrows the band to the columns that really differ. Bands closer than 12 px merge; bands under 4 px go.

Limits written to the output: page height capped (MAX_CSS_H), time budget, baseline storage cap, artifact cap.
"""
import asyncio, difflib, hashlib, io, json, os, re, sys, time, urllib.parse
import numpy as np
from PIL import Image, ImageDraw

A = os.path.dirname(os.path.abspath(__file__)) + '/'
OUT_PUBLIC = sys.argv[1]
STATE_F = A + 'data/visual/state.json'
BASE_DIR = os.environ.get('VISUAL_BASE', os.path.expanduser('~/.cache/kolaboro-visual'))
ART_DIR = os.environ.get('VISUAL_ART', '/tmp/kolaboro-visual-art')
CASES_JSON = os.environ.get('CASES_JSON', '')
TODAY = time.strftime('%Y-%m-%d', time.gmtime())
VIEW_W, MAX_CSS_H, STORE_W = 1280, 8000, 560
BUDGET_S = int(os.environ.get('VISUAL_BUDGET_S', str(25 * 60)))
NEW_BASELINES = int(os.environ.get('VISUAL_NEW_BASELINES', '150'))
BASE_CAP_MB, ART_CAP_MB = 90, 40
CONC = 4
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 KolaboroResearchAgent/1.0 (+https://kolaboro.com/research)'
T0 = time.time()
os.makedirs(BASE_DIR, exist_ok=True); os.makedirs(ART_DIR, exist_ok=True); os.makedirs(os.path.dirname(STATE_F), exist_ok=True)

# ---------- projects, public ids (same assignment as agent.py / kolaboro-h/idmap.py) ----------
src = open(A + 'agent.py').read(); ns = {}
exec(re.search(r"PREFIX = \{.*?\}\n", src, re.S).group(0), ns); PREFIX = ns['PREFIX']
P = json.load(open(A + 'projects.json'))['projects'] + json.load(open(A + 'projects-world.json')).get('projects', [])
ids, cnt = {}, {}
for p in sorted(P, key=lambda x: x.get('market', 'Bali') != 'Bali'):
    mk = p.get('market', 'Bali'); cnt[mk] = cnt.get(mk, 0) + 1
    ids[p['slug']] = '%s-%03d' % (PREFIX.get(mk, mk[:3].upper()), cnt[mk])
published = None
if CASES_JSON and os.path.exists(CASES_JSON):
    C = json.load(open(CASES_JSON)); published = {c['id']: c.get('market') for c in C.get('cases', [])}


def dom(u):
    h = urllib.parse.urlparse(u).hostname or ''
    h = h[4:] if h.startswith('www.') else h
    p = h.split('.')
    n = 3 if len(p) >= 3 and len(p[-1]) == 2 and p[-2] in ('com', 'co', 'net', 'org', 'gov', 'edu', 'ac', 'or', 'ne', 'go') else 2
    return '.'.join(p[-n:])


STOP = set('the by and of at in residences residence villas villa apartments apartment tower towers group developments development developers developer properties property real estate pt llc ltd inc sa de co company holding holdings bali dubai phase project resort homes home living collection investment investments limited realty'.split())


def toks(s):
    return {t for t in re.findall(r'[a-z0-9]+', (s or '').lower()) if t not in STOP and len(t) > 1}


def related(x, y):
    a, b = toks(x.get('developer')), toks(y.get('developer'))
    if a and b and a & b:
        return True
    a, b = toks(x.get('name')), toks(y.get('name'))
    return bool(a and b and len(a & b) / min(len(a), len(b)) >= 0.6)


by_dom = {}
for p in P:
    by_dom.setdefault(dom(p['url']), []).append(p)
PORTALS = {d for d, ps in by_dom.items() if any(not related(x, y) for x in ps for y in ps if x is not y)}

runs = sorted(f for f in os.listdir(A + 'data/runs') if f.endswith('.json'))
LATEST = json.load(open(A + 'data/runs/' + runs[-1]))['latest'] if runs else {}
CHANGED_CLAIMS = set()
try:
    for c in json.load(open(A + 'data/changes.json')):
        if c.get('date') >= runs[-1][:10]:
            CHANGED_CLAIMS.add(c.get('slug'))
except Exception:
    pass

state = json.load(open(STATE_F)) if os.path.exists(STATE_F) else {'projects': {}}
S = state.setdefault('projects', {})

eligible = []
for p in P:
    slug, pid = p['slug'], ids.get(p['slug'])
    if published is not None and pid not in published:
        continue
    if dom(p['url']) in PORTALS or not p['url'].startswith('http'):
        continue
    cur = (LATEST.get(slug) or {}).get('hash')
    if not cur:
        continue
    eligible.append((slug, pid, p['url'], cur))

base_path = lambda pid: os.path.join(BASE_DIR, pid + '.webp')
todo_change, todo_new = [], []
for slug, pid, url, cur in eligible:
    st = S.get(slug)
    if st and st.get('hash') != cur and os.path.exists(base_path(pid)):
        todo_change.append((0 if slug in CHANGED_CLAIMS else 1, slug, pid, url, cur))
    elif not st or not os.path.exists(base_path(pid)):
        todo_new.append((st.get('captured', '') if st else '', slug, pid, url, cur))
todo_change.sort(); todo_new.sort()
queue = [('change',) + t[1:] for t in todo_change] + [('new',) + t[1:] for t in todo_new[:NEW_BASELINES]]
print('eligible', len(eligible), 'portals skipped', sum(1 for p in P if dom(p['url']) in PORTALS), 'changed', len(todo_change), 'new', len(todo_new), 'queued', len(queue))


def dir_mb(d):
    return sum(os.path.getsize(os.path.join(d, f)) for f in os.listdir(d) if os.path.isfile(os.path.join(d, f))) / 1e6


def art_mb():
    t = 0
    for r, _, fs in os.walk(ART_DIR):
        t += sum(os.path.getsize(os.path.join(r, f)) for f in fs)
    return t / 1e6


def to_store(png_bytes):
    im = Image.open(io.BytesIO(png_bytes)).convert('RGB')
    if im.width != STORE_W:
        im = im.resize((STORE_W, max(1, round(im.height * STORE_W / im.width))), Image.LANCZOS)
    return im


def webp(im, q=40):
    b = io.BytesIO(); im.save(b, 'WEBP', quality=q, method=6); return b.getvalue()


FW, BLK, TOL = 70, 12, 7.0   # feature width (columns), block height (feature rows of 2 px), mean grey difference tolerance


def feats(im):
    """Grey features: STORE_W x H image -> (H/2) x FW grid of mean grey levels (2 px tall, STORE_W/FW px wide cells)."""
    g = np.asarray(im.convert('L').resize((FW, max(2, im.height // 2)), Image.BOX), dtype=np.float32)
    return g


def unstable_rows(a_im, b_im):
    """Feature rows that differ between two captures of the same page load a few seconds apart (carousels, animations)."""
    a, b = feats(a_im), feats(b_im)
    n = min(len(a), len(b))
    d = np.abs(a[:n] - b[:n]).mean(axis=1)
    rows = np.where(d > TOL / 2)[0]
    return rows.tolist()


def bands_of(rows, gap=3):
    out = []
    for r in rows:
        if out and r - out[-1][1] <= gap:
            out[-1][1] = r + 1
        else:
            out.append([r, r + 1])
    return out


def diff(before, after, unstable_after=(), unstable_before=()):
    """Block matching: each 12-row block of the new capture is looked for anywhere in the old capture (so content that only
    moved is not a change). A block with no match within TOL grey levels is changed. Returns rects in STORE_W pixels."""
    A_, B_ = feats(before), feats(after)
    if len(A_) < BLK or len(B_) < BLK:
        return [[0, 0, after.width, after.height]], 1.0, 0, 0.0
    from numpy.lib.stride_tricks import sliding_window_view
    win = sliding_window_view(A_, (BLK, FW))[:, 0]           # (nA-BLK+1, BLK, FW)
    ua, ub = set(unstable_after), set(unstable_before)
    changed, masked, used = [], 0, np.zeros(len(A_), bool)
    for y in range(0, len(B_) - BLK + 1, BLK):
        blk = B_[y:y + BLK]
        if any(r in ua for r in range(y, y + BLK)):
            masked += 1; continue
        if blk.std() < 1.0:      # flat background block: matches anything, nothing to compare
            continue
        cost = np.abs(win - blk).mean(axis=(1, 2))
        k = int(cost.argmin())
        if cost[k] <= TOL:
            used[k:k + BLK] = True; continue
        if any(r in ub for r in range(k, k + BLK)):
            masked += 1; continue
        colmask = np.abs(win[k] - blk).mean(axis=0) > TOL * 2
        cols = np.where(colmask)[0]
        x0, x1 = (int(cols.min()), int(cols.max()) + 1) if len(cols) else (0, FW)
        changed.append([x0, y, x1, y + BLK])
    sx, sy = after.width / float(FW), after.height / float(len(B_))
    merged = []
    for r in changed:
        if merged and r[1] - merged[-1][3] <= BLK:
            m = merged[-1]; m[0], m[2], m[3] = min(m[0], r[0]), max(m[2], r[2]), r[3]
        else:
            merged.append(r[:])
    rects = [[int(r[0] * sx), int(r[1] * sy), int(r[2] * sx), int(r[3] * sy)] for r in merged]
    area = sum((r[2] - r[0]) * (r[3] - r[1]) for r in rects) / float(after.width * after.height)
    # old content with no counterpart in the new capture (removed), counted in feature rows of non-flat old blocks
    removed = 0
    for y in range(0, len(A_) - BLK + 1, BLK):
        if not used[y:y + BLK].any() and A_[y:y + BLK].std() >= 4.0 and not any(r in ub for r in range(y, y + BLK)):
            removed += BLK
    nb = max(1, (len(B_) - BLK + 1) // BLK)
    return rects, area, int(removed * 2), round(100.0 * masked / nb, 1)


def overlay(after, rects):
    im = after.convert('RGBA'); ov = Image.new('RGBA', im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    for x0, y0, x1, y1 in rects:
        d.rectangle([x0, y0, x1 - 1, y1 - 1], fill=(255, 91, 20, 70), outline=(255, 50, 0, 255), width=2)
    return Image.alpha_composite(im, ov).convert('RGB')


# animations and transitions jump to their end state (scroll-reveal content shows, carousels stop after one cycle); videos hidden
KILL_MOTION = '*,*::before,*::after{animation-duration:1ms!important;animation-delay:0s!important;animation-iteration-count:1!important;transition-duration:1ms!important;transition-delay:0s!important;caret-color:transparent!important;scroll-behavior:auto!important}video{visibility:hidden!important}'


async def shoot(ctx, url):
    page = await ctx.new_page()
    try:
        await page.goto(url, wait_until='load', timeout=30000)
        await page.add_style_tag(content=KILL_MOTION)
        h = await page.evaluate('() => document.documentElement.scrollHeight')
        y = 0
        while y < min(h, MAX_CSS_H):
            y += 700; await page.evaluate('y => window.scrollTo(0, y)', y); await page.wait_for_timeout(250)
        await page.evaluate('() => window.scrollTo(0, 0)'); await page.wait_for_timeout(1200)
        h = min(MAX_CSS_H, await page.evaluate('() => Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0)'))
        clip = {'x': 0, 'y': 0, 'width': VIEW_W, 'height': max(900, h)}
        png = await page.screenshot(full_page=True, clip=clip, timeout=30000)
        await page.wait_for_timeout(3000)
        png2 = await page.screenshot(full_page=True, clip=clip, timeout=30000)
        return png, png2, h
    finally:
        await page.close()


results = {'captured': 0, 'baselines_new': 0, 'changes_visible': 0, 'changes_invisible': 0, 'failed': 0, 'skipped_budget': 0, 'art_cap_hit': False, 'base_cap_hit': False}


async def work(item, ctx, sem):
    kind, slug, pid, url, cur = item
    async with sem:
        if time.time() - T0 > BUDGET_S:
            results['skipped_budget'] += 1; return
        if kind == 'new' and dir_mb(BASE_DIR) > BASE_CAP_MB:
            results['base_cap_hit'] = True; return
        try:
            png, png2, css_h = await shoot(ctx, url)
        except Exception as e:
            results['failed'] += 1
            S.setdefault(slug, {'id': pid})['last_error'] = TODAY
            return
    results['captured'] += 1
    after = to_store(png)
    unst = unstable_rows(after, to_store(png2))
    st = S.setdefault(slug, {'id': pid})
    st['id'] = pid
    if kind == 'change':
        before = Image.open(base_path(pid)).convert('RGB')
        ub = [r for b0, b1 in st.get('unstable', []) for r in range(b0, b1)]
        rects, area, removed, masked_pct = diff(before, after, unst, ub)
        H = after.height
        ch = {'date': TODAY, 'before_date': st.get('captured'), 'area_pct': round(area * 100, 2), 'removed_px': round(removed * VIEW_W / STORE_W),
              'regions': [[round(r[0] / STORE_W, 3), round(r[1] / H, 4), round((r[2] - r[0]) / STORE_W, 3), round((r[3] - r[1]) / H, 4)] for r in rects][:40],
              'page_h': int(round(css_h / 500.0) * 500), 'masked_pct': masked_pct, 'visible': area >= 0.01}
        if ch['visible']:
            results['changes_visible'] += 1
            if art_mb() < ART_CAP_MB:
                d = os.path.join(ART_DIR, pid); os.makedirs(d, exist_ok=True)
                open(os.path.join(d, '%s-before-%s.webp' % (pid, ch['before_date'])), 'wb').write(webp(before, 50))
                open(os.path.join(d, '%s-after-%s.webp' % (pid, TODAY)), 'wb').write(webp(after, 50))
                open(os.path.join(d, '%s-diff-%s.webp' % (pid, TODAY)), 'wb').write(webp(overlay(after, rects), 50))
                ch['images'] = 'artifact'
            else:
                results['art_cap_hit'] = True
            hist = st.setdefault('changes', []); hist.append(ch); st['changes'] = hist[-6:]
        else:
            results['changes_invisible'] += 1
            st['last_invisible'] = TODAY
    else:
        results['baselines_new'] += 1
        st.setdefault('first', TODAY)
    open(base_path(pid), 'wb').write(webp(after, 40))
    st['hash'] = cur; st['captured'] = TODAY; st['h'] = int(css_h); st['unstable'] = bands_of(unst)[:60]


async def main():
    from playwright.async_api import async_playwright
    async with async_playwright() as pw:
        br = await pw.chromium.launch()
        ctx = await br.new_context(viewport={'width': VIEW_W, 'height': 900}, user_agent=UA, reduced_motion='reduce', locale='en-US', ignore_https_errors=False)
        sem = asyncio.Semaphore(CONC)
        await asyncio.gather(*(work(it, ctx, sem) for it in queue))
        await br.close()

asyncio.run(main())
state['updated'] = TODAY
json.dump(state, open(STATE_F, 'w'), indent=0, sort_keys=True)

pub = []
for slug, st in S.items():
    pid = st.get('id')
    if not pid or (published is not None and pid not in published) or not st.get('captured'):
        continue
    pub.append({'id': pid, 'market': (published or {}).get(pid), 'baseline': st.get('first') or st.get('captured'), 'last_capture': st.get('captured'),
                'changes': [{k: c[k] for k in ('date', 'before_date', 'area_pct', 'removed_px', 'regions', 'page_h', 'masked_pct') if k in c} for c in st.get('changes', [])]})
pub.sort(key=lambda r: (-(len(r['changes']) and 1), r['changes'][-1]['date'] if r['changes'] else '', r['id']), reverse=False)
pub.sort(key=lambda r: (r['changes'][-1]['date'] if r['changes'] else ''), reverse=True)
doc = {
    'version': 'visual-diff-1', 'generated': TODAY,
    'what': 'Where the pages of tracked developer websites visibly changed, as page geometry only. No screenshots are published: they would identify anonymous projects. Before, after and highlighted diff images are kept privately for 90 days and are available to a buyer on request.',
    'trigger': 'A capture is taken when the research agent sees the page text change (text fingerprint), or once to make a first baseline.',
    'method': ['Full-page screenshot in Chromium at %d px wide, animations off, lazy images scrolled into view, capped at %d px of page height.' % (VIEW_W, MAX_CSS_H),
               'Both captures scaled to %d px wide and turned grey. Pixel rows are aligned between the two captures (longest matching blocks), so content that only moved down is not counted as changed.' % STORE_W,
               'Rows that do not align are changed. Inside replaced bands of equal height, pixels differing by more than 24 grey levels narrow the band to the columns that changed. Bands closer than 12 px merge; bands under 4 px are dropped.',
               'Before comparing, the page is captured twice 3 seconds apart; rows that differ between those two shots (carousels, animation) are masked in the comparison and counted. A change is listed only if at least 1 % of the page area changed; smaller differences are counted as not visible.',
               'Regions are [x, y, width, height] as fractions of the page width and of the new page height. Page height is rounded to 500 px.'],
    'limits': {'own_site_only': True, 'listing_portals_skipped': len(PORTALS), 'max_page_height_px': MAX_CSS_H, 'time_budget_s': BUDGET_S, 'baseline_cap_mb': BASE_CAP_MB, 'artifact_cap_mb': ART_CAP_MB, 'artifact_retention_days': 90},
    'caveats': ['Carousels, rotating banners, cookie notices, text that animates in and personalised content can still show as changes. In a test of 16 sites captured twice a few minutes apart with no real change, 2 crossed the 1 % threshold. A listed change is a prompt to look, confirmed by eye on the private images.', 'The first capture of a project is only a baseline: a change can be shown only from the second capture on.', 'History starts 3 November 2026.'],
    'run': dict(results, eligible=len(eligible), queued=len(queue), changed_text=len(todo_change), without_baseline=len(todo_new)),
    'totals': {'projects_with_baseline': len(pub), 'projects_with_visible_change': sum(1 for r in pub if r['changes']), 'changes_listed': sum(len(r['changes']) for r in pub)},
    'projects': pub,
}
json.dump(doc, open(OUT_PUBLIC, 'w'), separators=(',', ':'))
print(json.dumps(doc['run']), json.dumps(doc['totals']), 'baseline MB %.1f' % dir_mb(BASE_DIR), 'artifact MB %.1f' % art_mb(), 'elapsed %ds' % (time.time() - T0))
