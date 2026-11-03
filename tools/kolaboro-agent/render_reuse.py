"""Kolaboro render reuse detector: finds renders/photos that appear on the websites of two or more DIFFERENT tracked projects.

Method: re-collect image URLs from each project page the same way image_index.py does (project url and docs_url), download them,
skip small images (< 200 px) and logos/icons/banners, embed each with CLIP (open_clip ViT-B-32 laion2b_s34b_b79k, CPU),
keep cross-project pairs with cosine >= THRESHOLD, then confirm each pair geometrically (ORB keypoints + RANSAC homography,
which survives crops, recolours and light edits but rejects merely similar skies, pools or stock textures). Pairs on the same
domain, from the same developer, or that look like the same project listed under two ids are excluded, as are 'hub' images
whose near-duplicates appear on many unrelated sites (stock/template art). Every pair carries both image URLs, pages and scores.

Usage: render_reuse.py OUT.json
"""
import json, re, os, sys, io, time, hashlib, datetime, tempfile, urllib.request, urllib.parse, concurrent.futures as cf
import numpy as np
from PIL import Image
import imagehash

THRESHOLD = 0.85          # CLIP cosine similarity (candidates; the geometric check below confirms the same picture)
MIN_INLIERS = 30          # ORB/RANSAC inliers needed to confirm the same picture
MIN_SIDE = 200            # px, smaller images are skipped
PER_PROJECT = 16          # max images per project (runtime cap)
HUB_SITES = 5             # an image with near-duplicates (cosine >= HUB_COS) on this many other domains is stock/template
HUB_COS = 0.93
MAX_PAIRS = 200
TIME_BUDGET = 11 * 60     # seconds (from start) for the download phase before we stop collecting
EMBED_DEADLINE = 22 * 60  # seconds (from start) after which images not yet embedded are left out

A = os.path.dirname(os.path.abspath(__file__)) + '/'
projs = json.load(open(A + 'projects.json'))['projects'] + json.load(open(A + 'projects-world.json'))['projects']
UA = {'User-Agent': 'Mozilla/5.0 (compatible; KolaboroResearchAgent/1.0; +https://kolaboro.com/research)'}
SKIP = ('logo', 'icon', 'favicon', 'avatar', 'flag', 'sprite', 'badge', 'placeholder', 'whatsapp', 'qr', 'payment', 'banner-app')
T0 = time.time()


def get(u, n=6_000_000):
    r = urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=15)
    return r.read(n), r.geturl()


def dom(u):
    h = urllib.parse.urlparse(u).hostname or ''
    h = h[4:] if h.startswith('www.') else h
    p = h.split('.')
    n = 3 if len(p) >= 3 and len(p[-1]) == 2 and p[-2] in ('com', 'co', 'net', 'org', 'gov', 'edu', 'ac', 'or', 'ne', 'go') else 2
    return '.'.join(p[-n:])


STOP = {'the', 'by', 'and', 'of', 'at', 'in', 'residences', 'residence', 'villas', 'villa', 'apartments', 'apartment', 'tower',
        'towers', 'group', 'developments', 'development', 'developers', 'developer', 'properties', 'property', 'real', 'estate',
        'pt', 'llc', 'l.l.c', 'ltd', 'inc', 'sa', 'de', 'cv', 'la', 'el', 'los', 'las', 'co', 'company', 'holding', 'holdings',
        'bali', 'dubai', 'phase', 'project', 'resort', 'homes', 'home', 'living', 'collection', 'investment', 'investments',
        'pcl', 'plc', 'tbk', 'jsc', 'gmbh', 'sl', 'sas', 'srl', 'spa', 'bv', 'ag', 'pty', 'sdn', 'bhd', 'kk', 'lp', 'llp', 'corp',
        'corporation', 'limited', 'realty', 'set', 'owner', 'operator', 'with', 'for', 'asset', 'management', 'construction'}


def toks(s):
    return {t for t in re.findall(r'[a-z0-9]+', (s or '').lower()) if t not in STOP and len(t) > 1}


def same_developer(p, q):
    a, b = toks(p.get('developer')), toks(q.get('developer'))
    return bool(a and b and (a & b))


def same_project(p, q):
    a, b = toks(p.get('name')), toks(q.get('name'))
    if not a or not b:
        return False
    return len(a & b) / min(len(a), len(b)) >= 0.6


PAGE_TEXT, PAGE_OG = {}, {}
GENERIC = set('''wp content uploads upload images image img media assets asset photo photos pic pics gallery galleries project projects
property properties development developments residence residences tower towers city dubai final medium large small original
webp jpeg scaled cover hero banner exterior interior view views render renders rendering cgi bedroom bedrooms bathroom kitchen
living dining room rooms pool pools unit units type types floor floors plan plans apartment apartments villa villas site storage
public files file static thumb thumbnail thumbnails home homes page slider slide main desktop mobile night aerial lobby amenity
amenities facade copy edit website general settings bucket production fetch auto limit night day evening sunset sunrise front back
side entrance garden terrace balcony rooftop roof beach ocean lake park street master studio penthouse duplex townhouse gym spa
default featured feature news blog post posts photo shoot image_gallery new launch launches listing listings detail details
version scaled resized crop cropped high quality full size width height'''.split())
WIDGET = ('featured', 'related', 'similar', 'recommend', 'other-project', 'more-project', 'others')


def own_tokens(p):
    return toks(p.get('name')) | toks(p.get('slug', '').replace('-', ' ')) | toks(p.get('developer'))


def own_site(page, p):
    label = dom(page).split('.')[0]
    return any(t in label for t in own_tokens(p) if len(t) >= 4)


IDSEG = re.compile(r'(?=.*\d)([0-9]{5,}|[0-9a-f-]{8,})', re.I)


def attributable(r, p):
    """On a third-party page (a listing portal hosting several tracked projects, or a site whose name carries neither the
    project nor the developer), an image counts for the page's project only if it is not in a featured/related widget, its
    file name does not name something else, and it is the og:image, sits in the og:image's folder or names the project."""
    page = r['page']
    if dom(page) not in PORTALS and own_site(page, p):
        return True
    u = urllib.parse.urlparse(r['u'])
    path = urllib.parse.unquote(u.path)
    if any(w in path.lower() for w in WIDGET):
        return False
    own = own_tokens(p)
    stem = path.rsplit('/', 1)[-1].rsplit('.', 1)[0]
    words = [w.lower() for w in re.split(r'[-_ +]+', stem) if re.fullmatch(r'[A-Za-z][a-z]{3,}|[A-Z]{4,}', w)]
    rest = [w for w in words if w not in GENERIC and w.rstrip('s') not in GENERIC and w not in toks(p.get('area'))]
    named = {w for w in re.findall(r'[a-z]{4,}', path.lower())} & own
    if len(words) >= 2 and rest and not (set(words) & own):
        return False
    og = PAGE_OG.get(page)
    if named or not og or r['u'] == og:
        return True
    o = urllib.parse.urlparse(og)
    oseg, useg = [x for x in o.path.split('/')[:-1] if x], [x for x in u.path.split('/')[:-1] if x]
    ids = [x for x in oseg if IDSEG.fullmatch(x)]
    if ids:   # og:image sits in a per-listing folder (numeric id, uuid, hash): the image must sit in the same one
        return ids[0] in useg
    return o.hostname == u.hostname and len(oseg) >= 2 and useg[:2] == oseg[:2]




def name_variants(p):
    n = (p.get('name') or '').lower()
    out = set()
    for v in (n, n.split(' by ')[0], n.split('(')[0], n.split(' - ')[0], n.split(',')[0]):
        v = ' '.join(re.findall(r'[a-z0-9]+', v))
        if len(v) >= 8:
            out.add(v)
    return out


def page_mentions(page, p):
    t = PAGE_TEXT.get(page, '')
    return any(' %s ' % v in t for v in name_variants(p))


def page_imgs(page):
    try:
        html, final = get(page, 3_000_000)
        html = html.decode('utf8', 'ignore')
    except Exception:
        return []
    PAGE_TEXT[page] = ' ' + ' '.join(re.findall(r'[a-z0-9]+', re.sub(r'<[^>]+>', ' ', html).lower())) + ' '
    c = re.findall(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)', html)
    if c:
        PAGE_OG[page] = urllib.parse.urljoin(final, c[0].strip())
    c += re.findall(r'<img[^>]+(?:data-src|src)=["\']([^"\']+\.(?:jpe?g|png|webp)(?:\?[^"\']*)?)["\']', html, re.I)
    c += re.findall(r'url\(["\']?([^"\')]+\.(?:jpe?g|webp))', html, re.I)
    return [(urllib.parse.urljoin(final, x.strip()), page) for x in c]


def imgs_of(i):
    p = projs[i]
    pages = [p['url']] + ([p['docs_url']] if p.get('docs_url') and p.get('docs_url') != p['url'] else [])
    out, seen = [], set()
    for pg in pages:
        for u, src in page_imgs(pg):
            if u in seen or not u.startswith('http') or any(k in u.lower() for k in SKIP):
                continue
            seen.add(u)
            out.append((u, src))
            if len(out) >= PER_PROJECT:
                return i, out
    return i, out


TMP = tempfile.mkdtemp(prefix='renders-')


def fetch(job):
    k, (i, u, page) = job
    if time.time() - T0 > TIME_BUDGET:
        return None
    try:
        b, _ = get(u)
        im = Image.open(io.BytesIO(b))
        if im.size[0] * im.size[1] > 80_000_000:
            return None
        im.draft('RGB', (800, 800))
        im = im.convert('RGB')
        w, h = im.size
        if min(w, h) < MIN_SIDE or max(w, h) / min(w, h) > 3.5:
            return None
        small = im.copy()
        small.thumbnail((640, 640))
        cols = small.getcolors(4096)
        if cols is not None and len(cols) < 64:   # flat graphic / icon
            return None
        path = os.path.join(TMP, '%d.jpg' % k)
        small.save(path, quality=90)
        return {'k': k, 'i': i, 'u': u, 'page': page, 'w': w, 'h': h, 'path': path,
                'dh': imagehash.dhash(im), 'sha': hashlib.sha256(b).hexdigest()}
    except Exception:
        return None


with cf.ThreadPoolExecutor(12) as ex:
    lists = list(ex.map(imgs_of, range(len(projs))))
jobs = [(i, u, pg) for i, l in lists for u, pg in l]
print('projects', len(projs), 'with images', sum(1 for _, l in lists if l), 'image urls', len(jobs), 't=%.0fs' % (time.time() - T0), flush=True)
import torch, open_clip
torch.set_num_threads(os.cpu_count() or 4)
MODEL, PRETRAINED = 'ViT-B-32', 'laion2b_s34b_b79k'
model, _, prep = open_clip.create_model_and_transforms(MODEL, pretrained=PRETRAINED)
model.eval()
# embed each distinct file once, while the downloads are still running (download threads are I/O bound)
emb_of, queue, recs = {}, [], []
CACHE = os.environ.get('EMB_CACHE')   # npz of {sha: embedding} from earlier runs (same model), so only new files are embedded
cached = {}
if CACHE and os.path.exists(CACHE):
    try:
        z = np.load(CACHE)
        if str(z['model']) == MODEL + '/' + PRETRAINED:
            cached = dict(zip(z['sha'].tolist(), z['emb'].astype(np.float32)))
    except Exception as e:
        print('cache unreadable', e)
print('cached embeddings', len(cached), flush=True)
embed_budget_hit = False


def embed(batch):
    x = torch.stack([prep(Image.open(r['path']).convert('RGB')) for r in batch])
    with torch.inference_mode():
        e = torch.nn.functional.normalize(model.encode_image(x), dim=-1).numpy()
    for r, v in zip(batch, e):
        emb_of[r['sha']] = v


with cf.ThreadPoolExecutor(24) as ex:
    futs = [ex.submit(fetch, j) for j in enumerate(jobs)]
    for f in cf.as_completed(futs):
        r = f.result()
        if not r:
            continue
        recs.append(r)
        if r['sha'] in cached:
            emb_of[r['sha']] = cached[r['sha']]
        if r['sha'] not in emb_of and all(q['sha'] != r['sha'] for q in queue):
            queue.append(r)
        if len(queue) >= 32:
            embed(queue); queue = []
print('downloaded', len(recs), 'embedded so far', len(emb_of), 't=%.0fs' % (time.time() - T0), flush=True)
budget_hit = time.time() - T0 > TIME_BUDGET
# the same file can sit at one URL used by one project twice; keep one record per (project, sha)
uniq = {}
for r in recs:
    uniq.setdefault((r['i'], r['sha']), r)
recs = list(uniq.values())
# site chrome / cross-promotion: the same file shown on the pages of 2+ projects on one domain is not a project image
by_site = {}
for r in recs:
    by_site.setdefault((dom(r['page']), r['sha']), set()).add(r['i'])
chrome = {k for k, v in by_site.items() if len(v) >= 2}
n0 = len(recs)
recs = [r for r in recs if (dom(r['page']), r['sha']) not in chrome]
chrome_dropped = n0 - len(recs)
print('images kept', len(recs), 'site-chrome images dropped', chrome_dropped, len(recs), 'budget hit', budget_hit, 't=%.0fs' % (time.time() - T0), flush=True)
if len(recs) < 200:
    raise SystemExit('too few images (%d): keeping the old file' % len(recs))

# embed what is left (files not yet embedded); stop at the deadline
queue = []
for r in recs:
    if r['sha'] not in emb_of and all(q['sha'] != r['sha'] for q in queue):
        queue.append(r)
    if len(queue) >= 64:
        if time.time() - T0 > EMBED_DEADLINE:
            embed_budget_hit = True
            break
        embed(queue); queue = []
if queue and not embed_budget_hit:
    embed(queue)
n_before_embed = len(recs)
if CACHE and emb_of:
    os.makedirs(os.path.dirname(CACHE) or '.', exist_ok=True)
    ks = list(emb_of)
    np.savez(CACHE, sha=np.array(ks), emb=np.stack([emb_of[k] for k in ks]).astype(np.float16), model=MODEL + '/' + PRETRAINED)
n_files = len({r['sha'] for r in recs})
recs = [r for r in recs if r['sha'] in emb_of]
E = np.stack([emb_of[r['sha']] for r in recs]).astype(np.float32)
print('embedded files', len(emb_of), 'of', n_files, 'records', len(E), 'of', n_before_embed, 'budget hit', embed_budget_hit,
      't=%.0fs' % (time.time() - T0), flush=True)

# candidate cross-project pairs
P = np.array([r['i'] for r in recs])
D = [dom(r['page']) for r in recs]
Ddom = np.array(D)
cand = []
for s in range(0, len(E), 1024):
    S = E[s:s + 1024] @ E.T
    for a_rel, b in zip(*np.nonzero(S >= THRESHOLD)):
        a = s + a_rel
        if b <= a or P[a] == P[b]:
            continue
        cand.append((a, int(b), float(S[a_rel, b])))
print('raw candidates', len(cand), flush=True)

# hub images: near-duplicates across many different domains are stock / template art
nbr_sites = {}
for a, b, c in cand:
    if D[a] != D[b] and c >= HUB_COS:
        nbr_sites.setdefault(a, set()).add(D[b])
        nbr_sites.setdefault(b, set()).add(D[a])
hubs = {k for k, v in nbr_sites.items() if len(v) >= HUB_SITES}

PORTALS = set()
_devs = {}
for _p in projs:
    for _u in {_p['url'], _p.get('docs_url') or _p['url']}:
        _devs.setdefault(dom(_u), []).append(_p)
for _d, _ps in _devs.items():
    if any(not same_developer(x, y) and not same_project(x, y) for x in _ps for y in _ps if x is not y):
        PORTALS.add(_d)
excl = {'map_or_plan': 0, 'same_domain': 0, 'same_developer': 0, 'same_project_name': 0, 'page_names_other_project': 0,
        'portal_image_not_attributable': 0, 'hub_image': 0,
        'geometry_failed': 0}
# geometric confirmation
import cv2
orb = cv2.ORB_create(1500)
_kp = {}


def feats(k):
    if k not in _kp:
        g = cv2.imread(recs[k]['path'], cv2.IMREAD_GRAYSCALE)
        _kp[k] = orb.detectAndCompute(g, None) if g is not None else (None, None)
    return _kp[k]


def inliers(a, b):
    ka, da = feats(a)
    kb, db = feats(b)
    if da is None or db is None or len(ka) < 10 or len(kb) < 10:
        return 0
    m = cv2.BFMatcher(cv2.NORM_HAMMING).knnMatch(da, db, k=2)
    good = [x[0] for x in m if len(x) == 2 and x[0].distance < 0.75 * x[1].distance]
    if len(good) < 8:
        return 0
    src = np.float32([ka[g.queryIdx].pt for g in good]).reshape(-1, 1, 2)
    dst = np.float32([kb[g.trainIdx].pt for g in good]).reshape(-1, 1, 2)
    H, mask = cv2.findHomography(src, dst, cv2.RANSAC, 5.0)
    return int(mask.sum()) if mask is not None else 0


MAPPLAN = re.compile(r'(?<![a-z])(map|maps|master[-_ ]?plan|site[-_ ]?plan|floor[-_ ]?plans?|location|layout|unit[-_ ]?plan|plan)(?![a-z])', re.I)


def reason(a, b):
    pa, pb = projs[P[a]], projs[P[b]]
    if MAPPLAN.search(urllib.parse.unquote(recs[a]['u'])) or MAPPLAN.search(urllib.parse.unquote(recs[b]['u'])):
        return 'map_or_plan'   # area maps, master plans and floor-plan templates are legitimately shared
    if D[a] == D[b]:
        return 'same_domain'
    if same_developer(pa, pb):
        return 'same_developer'
    if same_project(pa, pb):
        return 'same_project_name'
    if not attributable(recs[a], pa) or not attributable(recs[b], pb):
        return 'portal_image_not_attributable'
    if page_mentions(recs[a]['page'], pb) or page_mentions(recs[b]['page'], pa):
        # a portal page that names the other project is showing its listing (related projects, carousels), not reusing it
        return 'page_names_other_project'
    if a in hubs or b in hubs:
        return 'hub_image'
    return None


kept, confirmed_excluded = [], {}
for a, b, c in sorted(cand, key=lambda x: -x[2]):
    why = reason(a, b)
    if why is None:
        kept.append((a, b, c)); continue
    excl[why] += 1
    # audit trail (log only): excluded pairs that are nonetheless the same picture
    if why != 'same_domain' and (recs[a]['sha'] == recs[b]['sha'] or inliers(a, b) >= MIN_INLIERS):
        confirmed_excluded[why] = confirmed_excluded.get(why, 0) + 1
        if sum(confirmed_excluded.values()) <= 40:
            print('  excluded %s %.4f %s (%s) | %s (%s)\n     %s\n     %s' % (why, c, projs[P[a]].get('slug'), D[a],
                  projs[P[b]].get('slug'), D[b], recs[a]['u'], recs[b]['u']))

kept.sort(key=lambda x: -x[2])
pairs, seen_proj_img = [], set()
for a, b, c in kept:
    if len(pairs) >= MAX_PAIRS:
        break
    exact = recs[a]['sha'] == recs[b]['sha']
    n = 10**6 if exact else inliers(a, b)
    if n < MIN_INLIERS:
        excl['geometry_failed'] += 1
        if excl['geometry_failed'] <= 12:
            print('  rejected (inliers %d) %.4f %s | %s' % (n, c, recs[a]['u'], recs[b]['u']))
        continue
    key = (P[a], P[b], recs[a]['sha'], recs[b]['sha'])
    if key in seen_proj_img:
        continue
    seen_proj_img.add(key)

    def side(k):
        p = projs[P[k]]
        return {'project_id': p.get('slug'), 'project_name': p.get('name'), 'developer': p.get('developer'),
                'market': p.get('market'), 'area': p.get('area'), 'image_url': recs[k]['u'], 'page_url': recs[k]['page'],
                'width': recs[k]['w'], 'height': recs[k]['h']}
    pairs.append({'a': side(a), 'b': side(b), 'cosine': round(c, 4), 'dhash_distance': int(recs[a]['dh'] - recs[b]['dh']),
                  'orb_inliers': None if exact else n, 'identical_file': exact})

out = {
    'generated': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
    'model': 'open_clip %s %s (open_clip_torch %s, torch %s, CPU)' % (MODEL, PRETRAINED, open_clip.__version__, torch.__version__),
    'threshold': THRESHOLD,
    'min_orb_inliers': MIN_INLIERS,
    'images_checked': len(recs),
    'projects_checked': int(len(set(P.tolist()))),
    'projects_tracked': len(projs),
    'limits': {'images_per_project': PER_PROJECT, 'min_side_px': MIN_SIDE, 'download_time_budget_s': TIME_BUDGET,
               'download_budget_hit': budget_hit, 'embedding_deadline_s': EMBED_DEADLINE,
               'embedding_budget_hit': embed_budget_hit, 'max_pairs': MAX_PAIRS},
    'site_chrome_images_dropped': chrome_dropped,
    'candidates_over_threshold': len(cand),
    'excluded': excl,
    'hub_images': len(hubs),
    'same_picture_but_excluded': confirmed_excluded,
    'listing_portals': len(PORTALS),
    'pair_count': len(pairs),
    'pairs': pairs,
    'method': ('Images are collected from each tracked project page (url and docs_url), images under %d px, very wide banners, '
               'flat graphics and URLs naming logos/icons are skipped (maps, master plans and floor plans are not counted), at most %d per project, and a file shown on the pages of '
               'two or more projects of the same site is treated as site chrome and dropped. Each image is embedded with CLIP '
               '%s (%s) and pairs from two different projects with cosine >= %.2f are kept if the two pages are on different '
               'domains, the developers differ, the project names do not look like the same project, neither page names the '
               'other project (portal carousels and related listings), and neither image has '
 'near-duplicates (cosine >= %.2f) on %d+ other domains (stock or template art). On listing portals (sites hosting pages of several '
               'tracked projects) an image only counts for the page\'s project if it is not in a featured/related widget, its '
               'file name does not name another place or project, and it is the page\'s og:image, sits in the og:image folder '
               'or names the project. Each surviving pair must then pass a geometric '
               'check: at least %d ORB keypoint matches consistent with one RANSAC homography (or byte-identical files). '
               'dhash_distance is reported for reference (0-64, low means near-identical; crops and recolours raise it). '
               'A match means the same picture is used on both pages; it is evidence to check, not proof of wrongdoing: '
               'agents, portals and sister brands can legitimately share a render.'
               % (MIN_SIDE, PER_PROJECT, MODEL, PRETRAINED, THRESHOLD, HUB_COS, HUB_SITES, MIN_INLIERS)),
}
json.dump(out, open(sys.argv[1], 'w'), indent=1, ensure_ascii=False)
print('pairs', len(pairs), 'excluded', excl, 'hubs', len(hubs), 't=%.0fs' % (time.time() - T0))
for x in pairs[:15]:
    print('%.4f d%-2d inl=%s  %s (%s) <-> %s (%s)\n   %s\n   %s' % (x['cosine'], x['dhash_distance'], x['orb_inliers'],
          x['a']['project_id'], dom(x['a']['page_url']), x['b']['project_id'], dom(x['b']['page_url']),
          x['a']['image_url'], x['b']['image_url']))
