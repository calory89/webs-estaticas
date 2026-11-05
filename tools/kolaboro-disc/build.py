#!/usr/bin/env python3
"""Kolaboro discovery data (block U6, batch 6, 5 Nov 2026).

Builds two public files from the PUBLIC dataset only (https://kolaboro.com/data/bali-cases.json):

  market-points.json  one point per market, taken from public gazetteers (never from private per-project coordinates):
                      Natural Earth admin-0 label points for markets that are a whole country, Natural Earth populated
                      places for cities, GeoNames cities1000 as a fallback for small towns. Regions (for example
                      "Costa del Sol") are placed at a named anchor town listed in ANCHOR below, and say so.
  similar.json        (also carries market_points, see above, so the site gains one file, not two) for every public project, the 5 most similar other projects: 50% cosine similarity of
                      sentence embeddings (sentence-transformers/all-MiniLM-L6-v2, Apache 2.0, run locally on the
                      runner) of the public text fields, 50% structured features (market, country, stage, price band,
                      which of the six checks are published). Ids and rounded scores only.

Usage: build.py <bali-cases.json> <gazetteer dir> <out dir> [--no-embed]
The gazetteer dir must hold ne_10m_populated_places_simple.geojson, ne_50m_admin_0_countries.geojson, cities1000.txt.
"""
import hashlib, json, math, os, sys, time, unicodedata
from collections import Counter

ARGS = [a for a in sys.argv[1:] if not a.startswith('--')]
NO_EMBED = '--no-embed' in sys.argv
CASES, GAZ, OUT = ARGS[0], ARGS[1], ARGS[2]
MODEL = 'sentence-transformers/all-MiniLM-L6-v2'
K = 5
W_TEXT, W_STRUCT = 0.5, 0.5
SW = {'market': 0.35, 'country': 0.10, 'stage': 0.15, 'band': 0.15, 'checks': 0.25}
BANDS = ['Under $100k', '$100k to $200k', '$200k to $400k', '$400k and up']
CHECKS = ['permit', 'escrow', 'progress', 'plans', 'record', 'returns_ok']

# Country spellings in the dataset that differ from Natural Earth names.
CALIAS = {'uae': 'united arab emirates', 'usa': 'united states of america', 'st kitts and nevis': 'saint kitts and nevis',
          'st lucia': 'saint lucia', 'cape verde': 'cabo verde', 'turks and caicos islands': 'turks and caicos islands',
          'czech republic': 'czechia', 'turks and caicos': 'turks and caicos islands', 'curacao': 'curacao', 'antigua and barbuda': 'antigua and barbuda'}
# Markets that are regions or islands, placed at a named anchor town (searched in the gazetteers like any other name).
ANCHOR = {
    'Bali': 'Denpasar', 'Lombok': 'Mataram', 'Sumba': 'Waingapu', 'Gili Islands': 'Pemenang', 'Koh Samui': 'Ko Samui',
    'Koh Phangan': 'Ko Pha Ngan', 'Algarve': 'Faro', 'Madeira': 'Funchal', 'Costa del Sol': 'Marbella', 'Costa Blanca': 'Alicante',
    'Balearics': 'Palma', 'Canary Islands': 'Las Palmas de Gran Canaria', 'French Riviera': 'Nice', 'French Alps': 'Chamonix-Mont-Blanc',
    'Riviera Maya': 'Playa del Carmen', 'Riviera Nayarit': 'Nuevo Vallarta', 'Los Cabos': 'Cabo San Lucas', 'Goa': 'Panaji',
    'Okinawa': 'Naha', 'Hawaii': 'Honolulu', 'New York': 'New York City', 'Palm Beach County': 'West Palm Beach',
    'Antigua': "Saint John's", 'Diani': 'Ukunda', 'Ras Al Khaimah': 'Ras al-Khaimah', 'Umm Al Quwain': 'Umm Al Quwain City',
    'Porto de Galinhas': 'Ipojuca', 'Zanzibar': 'Zanzibar',
}


def norm(s):
    s = unicodedata.normalize('NFKD', str(s or ''))
    s = ''.join(c for c in s if not unicodedata.combining(c)).lower().replace('-', ' ').replace('.', '').replace("'", '').replace('’', '')
    return ' '.join(s.split())


def r2(x):
    return round(float(x), 2)


def load_gazetteers():
    ne_pp = json.load(open(os.path.join(GAZ, 'ne_10m_populated_places_simple.geojson')))['features']
    ne_c = json.load(open(os.path.join(GAZ, 'ne_50m_admin_0_countries.geojson')))['features']
    countries, iso = {}, {}
    for f in ne_c:
        p = f['properties']
        a2 = p.get('ISO_A2_EH') if p.get('ISO_A2_EH') not in (None, '-99') else p.get('ISO_A2')
        for k in ('NAME', 'NAME_LONG', 'ADMIN', 'NAME_EN', 'BRK_NAME', 'NAME_SORT', 'FORMAL_EN'):
            n = norm(p.get(k))
            if n and n not in countries:
                countries[n] = p
                iso[n] = a2
    places = {}
    for f in ne_pp:
        p = f['properties']
        for k in ('name', 'nameascii', 'namealt'):
            for v in str(p.get(k) or '').split('|'):
                if norm(v):
                    places.setdefault(norm(v), []).append(p)
    geon = {}
    with open(os.path.join(GAZ, 'cities1000.txt'), encoding='utf-8') as fh:
        for line in fh:
            c = line.rstrip('\n').split('\t')
            if len(c) < 15:
                continue
            row = (c[1], float(c[4]), float(c[5]), c[8], int(c[14] or 0), c[0])
            names = {norm(c[1]), norm(c[2])}
            for n in names:
                if n:
                    geon.setdefault(n, []).append(row)
    return countries, iso, places, geon


def ckey(country):
    n = norm(country)
    return CALIAS.get(n, n)


def place_markets(cases):
    countries, iso, places, geon = load_gazetteers()
    by = {}
    for c in cases:
        m = by.setdefault(c['market'], {'country': c['country'], 'n': 0})
        m['n'] += 1
    out, unplaced = {}, []
    for market, info in sorted(by.items()):
        ck = ckey(info['country'])
        cprops = countries.get(ck)
        a2 = iso.get(ck)
        # 1. The market is a whole country: Natural Earth admin-0 label point.
        mk = ckey(market)
        if mk in countries and (mk == ck or norm(market) == norm(info['country'])):
            p = countries[mk]
            out[market] = {'lat': r2(p['LABEL_Y']), 'lng': r2(p['LABEL_X']), 'how': 'country', 'place': p['NAME'],
                           'src': 'Natural Earth admin 0 countries (1:50m), LABEL_Y / LABEL_X'}
            continue
        name = ANCHOR.get(market, market)
        anchor = market in ANCHOR and norm(ANCHOR[market]) != norm(market)
        hit = None
        # 2. Natural Earth populated places, same country.
        cands = [p for p in places.get(norm(name), []) if ckey(p.get('adm0name')) == ck or ckey(p.get('sov0name')) == ck or (a2 and p.get('iso_a2') == a2)]
        if cands:
            p = max(cands, key=lambda p: p.get('pop_max') or 0)
            hit = {'lat': r2(p['latitude']), 'lng': r2(p['longitude']), 'place': p['name'], 'src': 'Natural Earth populated places (1:10m), ne_id ' + str(p.get('ne_id'))}
        # 3. GeoNames cities1000, same country code.
        if not hit and a2:
            g = [r for r in geon.get(norm(name), []) if r[3] == a2]
            if g:
                r = max(g, key=lambda r: r[4])
                hit = {'lat': r2(r[1]), 'lng': r2(r[2]), 'place': r[0], 'src': 'GeoNames cities1000, geonameid ' + r[5]}
        # 4. A territory or island state listed as its own country in Natural Earth.
        if not hit and mk in countries:
            p = countries[mk]
            hit = {'lat': r2(p['LABEL_Y']), 'lng': r2(p['LABEL_X']), 'place': p['NAME'], 'src': 'Natural Earth admin 0 countries (1:50m), LABEL_Y / LABEL_X'}
            out[market] = dict(hit, how='country')
            continue
        if hit:
            out[market] = dict(hit, how='anchor' if anchor else 'place')
        else:
            unplaced.append({'market': market, 'country': info['country'], 'projects': info['n'], 'tried': name})
    return out, unplaced


# ---------- similarity ----------
def pub(c, k):
    v = (c.get('checks') or {}).get(k)
    if k == 'permit':
        return 'y' if v == 2 else 'p' if v == 1 else 'n'
    if k == 'escrow':
        return 'y' if v is True else 'n'
    if k == 'progress':
        return 'y' if v is not None else 'n'
    return 'y' if v else 'n'


def text_of(c):
    parts = []
    if c.get('stage'):
        parts.append('Stage: ' + c['stage'] + '.')
    if c.get('title'):
        parts.append('Title: ' + str(c['title']).replace('_', ' ') + (' %s years' % c['lease'] if c.get('lease') else '') + '.')
    if c.get('region') and c.get('region') != c.get('market'):
        parts.append('Area: ' + c['region'] + '.')
    if c.get('yield'):
        parts.append('Advertised yield %s%% a year.' % c['yield'])
    if c.get('units'):
        parts.append('%s units.' % c['units'])
    parts += [str(x) for x in (c.get('flags') or [])]
    parts += [str(x) for x in (c.get('notes') or [])]
    parts += [str(x) for x in (c.get('q') or [])]
    return ' '.join(parts)


def struct_sim(a, b):
    s = 0.0
    if a['market'] == b['market']:
        s += SW['market'] + SW['country']
    elif a['country'] == b['country']:
        s += SW['country']
    if a.get('stage') and a.get('stage') == b.get('stage'):
        s += SW['stage']
    ia = BANDS.index(a['band']) if a.get('band') in BANDS else -1
    ib = BANDS.index(b['band']) if b.get('band') in BANDS else -1
    if ia >= 0 and ia == ib:
        s += SW['band']
    elif ia >= 0 and ib >= 0 and abs(ia - ib) == 1:
        s += SW['band'] / 2
    same = sum(1 for k in CHECKS if pub(a, k) == pub(b, k))
    s += SW['checks'] * same / len(CHECKS)
    return s


def embed(texts):
    from sentence_transformers import SentenceTransformer
    m = SentenceTransformer(MODEL, device='cpu')
    e = m.encode(texts, batch_size=64, normalize_embeddings=True, show_progress_bar=False)
    rev = None
    try:
        from huggingface_hub import model_info
        rev = model_info(MODEL).sha
    except Exception:
        rev = None
    return [list(map(float, v)) for v in e], rev


def main():
    t0 = time.time()
    raw = open(CASES, 'rb').read()
    D = json.loads(raw)
    cases = [c for c in D['cases'] if c.get('id') and c.get('market')]
    os.makedirs(OUT, exist_ok=True)

    pts, unplaced = place_markets(cases)
    placed_projects = sum(1 for c in cases if c['market'] in pts)
    mp = {
        'version': 'market-points-1', 'generated': time.strftime('%Y-%m-%d', time.gmtime()), 'dataset_updated': D.get('updated'),
        'what': 'One public point per market, used to place anonymous projects on /map/. It is the market, not the project: private per-project coordinates are never used.',
        'method': [
            'A market that is a whole country (for example Malaysia) is placed at the Natural Earth admin 0 label point of that country.',
            'A city market is placed at the Natural Earth populated place of the same name in the same country (largest population if several match).',
            'If Natural Earth has no such place, GeoNames cities1000 is searched with the same name and country code.',
            'A region or island market is placed at a named anchor town (field place, how = anchor), searched in the same gazetteers. The anchor list is in the build script.',
            'Coordinates are rounded to 2 decimals (about 1 km).'],
        'sources': [
            {'name': 'Natural Earth populated places 1:10m (ne_10m_populated_places_simple)', 'licence': 'Public domain', 'url': 'https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/',
             'query': 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_populated_places_simple.geojson'},
            {'name': 'Natural Earth admin 0 countries 1:50m (LABEL_X, LABEL_Y)', 'licence': 'Public domain', 'url': 'https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-0-countries-2/',
             'query': 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson'},
            {'name': 'GeoNames cities1000', 'licence': 'CC BY 4.0 (credit: GeoNames, geonames.org)', 'url': 'https://www.geonames.org/', 'query': 'https://download.geonames.org/export/dump/cities1000.zip'}],
        'counts': {'markets': len(set(c['market'] for c in cases)), 'placed': len(pts), 'unplaced': len(unplaced), 'projects': len(cases), 'projects_placed': placed_projects,
                   'by_how': dict(Counter(v['how'] for v in pts.values()))},
        'input': {'file': 'https://kolaboro.com/data/bali-cases.json', 'sha256': hashlib.sha256(raw).hexdigest()},
        'markets': pts, 'unplaced': unplaced,
    }
    # Published inside similar.json (key market_points) to keep the site's file count down; written alone only with --no-embed.
    if NO_EMBED:
        json.dump(mp, open(os.path.join(OUT, 'market-points.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    print('market points: %d placed, %d unplaced' % (len(pts), len(unplaced)), unplaced)

    if NO_EMBED:
        return
    texts = [text_of(c) for c in cases]
    E, rev = embed(texts)
    import numpy as np
    n = len(cases)
    M = np.asarray(E, dtype=np.float32)
    T = np.clip(M @ M.T, 0.0, 1.0)
    sims = {}
    for i in range(n):
        ci = cases[i]
        row = []
        for j in range(n):
            if i == j:
                continue
            t = float(T[i, j])
            s = struct_sim(ci, cases[j])
            row.append((W_TEXT * t + W_STRUCT * s, t, s, j))
        row.sort(key=lambda x: (-x[0], cases[x[3]]['id']))
        sims[ci['id']] = [[cases[j]['id'], round(tot, 3), round(t, 3), round(s, 3)] for tot, t, s, j in row[:K]]
    out = {
        'version': 'similar-1', 'generated': time.strftime('%Y-%m-%d', time.gmtime()), 'dataset_updated': D.get('updated'),
        'what': 'For every public project, the 5 most similar other public projects. Ids and rounded scores only.',
        'row': ['id', 'score (0 to 1)', 'text similarity (cosine of embeddings, 0 to 1)', 'structured similarity (0 to 1)'],
        'model': {'name': MODEL, 'revision': rev, 'licence': 'Apache 2.0', 'url': 'https://huggingface.co/' + MODEL, 'run': 'locally on the GitHub Actions runner (CPU), no API call'},
        'text_fields': 'stage, title and lease, area (region), advertised yield, units, public flags and notes, and the questions our agent asks (field q). Market, country and price band are left out of the text because they are scored as structured features.',
        'weights': {'text': W_TEXT, 'structured': W_STRUCT, 'structured_parts': SW, 'band_rule': 'same band scores the full band weight, an adjacent band half of it, an unknown band nothing',
                    'checks_rule': 'share of the six checks (permit, deposit protection, progress, plans, track record, no guaranteed returns) published in the same way'},
        'k': K, 'projects_n': n, 'seconds': round(time.time() - t0, 1),
        'input': {'file': 'https://kolaboro.com/data/bali-cases.json', 'sha256': hashlib.sha256(raw).hexdigest()},
        'projects': sims,
        'market_points': mp,
    }
    json.dump(out, open(os.path.join(OUT, 'similar.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    print('similar: %d projects in %.1fs' % (n, time.time() - t0))


if __name__ == '__main__':
    main()
