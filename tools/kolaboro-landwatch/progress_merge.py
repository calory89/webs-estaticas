#!/usr/bin/env python3
"""Merge the shard outputs of progress.py into kolaboro.com/data/construction-progress.json (compact, no coordinates).
Usage: progress_merge.py PARTS_DIR IMAGES_DIR OUT.json [--prev PREV.json]
PARTS_DIR: part-*.json from every shard. IMAGES_DIR: proj/<ID>.jpg (sprite version = first 10 hex of its sha256).
--prev: the published file; projects not in this run are kept from it (partial runs)."""
import json, os, sys, glob, hashlib, argparse, datetime

SOURCE = {'name': 'Copernicus Sentinel-2 L2A via Element84 Earth Search (STAC) and the Sentinel-2 COGs on AWS Open Data',
          'url': 'https://registry.opendata.aws/sentinel-2-l2a-cogs/', 'stac': 'https://earth-search.aws.element84.com/v1',
          'licence': 'Copernicus Sentinel data are free and open (Copernicus data and information policy, EU Regulation 1159/2013).',
          'licence_url': 'https://sentinels.copernicus.eu/documents/247904/690755/Sentinel_Data_Legal_Notice',
          'attribution': 'Contains modified Copernicus Sentinel data {y0}-{y1}, processed by Kolaboro'}
METHOD = ('Per project, a 150 m circle around the pin from our project record. Per month, up to 2 scenes from one Sentinel-2 tile that see at least 90% '
          'of the circle without cloud (Sentinel-2 scene classification: cloud, cirrus, cloud shadow, dark, unclassified and snow pixels removed), per-pixel median. '
          'b: share of the circle that looks built-up or bare (NDBI > 0 and NDVI < 0.25). r: the same share in a ring 300 to 600 m from the pin. '
          'Change index shown on the project pages: (b - r) minus the median of (b - r) over the first 3 clear months, in percentage points; season and haze move '
          'circle and ring together, so the difference is steadier than either share (single-month deviation in the first months: median 4, 90th percentile 15 points, '
          'so 15 points either way is shown as normal variation). x: share of the circle whose pixels differ visibly from the first clear month (brightness moved by more than 25 of 255, '
          'or a switch between built-up/bare and not with NDBI moving more than 0.1, after subtracting the median shift of the ring); kept for reference, noisier. '
          'Months without a clear scene are left empty, never filled in. '
          'Thumbnails: true colour, 640 m square, one linear stretch per project; the white circle is the 150 m analysis circle.')
LIMITS = ('Sentinel-2 pixels are 10 m. They show cleared ground, slabs, roofs and large cranes, not floors, interiors or quality of work: '
          'a tower going up on a plot that was already concrete changes little, and a finished building should look unchanged. '
          'Season, low winter sun (longer shadows), haze and wet ground also move the index. Cloudy months are empty. '
          'The pin comes from public sources and is about 100 m accurate, so the circle can miss part of a large site or include a neighbour. '
          'This is a prompt to ask the developer for dated site photos, not proof of progress or of a stop.')
KEEP = ('m0', 'n', 'k', 'c', 'b', 'r', 'x', 'f', 'dt', 't', 'base', 'frames', 'clear_months', 'status', 'sum')


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('parts'); ap.add_argument('images'); ap.add_argument('out'); ap.add_argument('--prev', default='')
    a = ap.parse_args()
    parts = [json.load(open(p)) for p in sorted(glob.glob(os.path.join(a.parts, '**', 'part-*.json'), recursive=True))]
    if not parts: raise SystemExit('no shard output')
    res = {}
    for p in parts:
        for k, r in p['projects'].items():
            r = {x: r[x] for x in KEEP if x in r}
            img = os.path.join(a.images, 'proj', k + '.jpg')
            if r.get('frames') and os.path.exists(img): r['v'] = hashlib.sha256(open(img, 'rb').read()).hexdigest()[:10]
            elif r.get('frames'): r['frames'] = 0; r['f'] = [-1] * r.get('n', 0)   # sprite missing: never point at an image we do not have
            res[k] = r
    prev = {}
    if a.prev and os.path.exists(a.prev):
        try: prev = json.load(open(a.prev)).get('projects', {})
        except Exception: prev = {}
    for k, r in prev.items():
        if k not in res: res[k] = r
    p0 = parts[0]; y0, y1 = p0['from'][:4], p0['to'][:4]
    st = {}
    for r in res.values(): st[r.get('status')] = st.get(r.get('status'), 0) + 1
    out = {'v': 1, 'updated': datetime.date.today().isoformat(), 'from': p0['from'], 'to': p0['to'], 'resolution_m': 10, 'radius_m': 150,
           'selection': {'rule': 'Tracked projects whose own record has coordinates with at least 3 decimals (about 100 m), not shared with another project and not the centre of a watched development area; Sumba excluded (independence policy).',
                         'selected': p0['selected'], 'skipped': p0['skipped']},
           'status_counts': st, 'source': dict(SOURCE, attribution=SOURCE['attribution'].format(y0=y0, y1=y1)), 'method': METHOD, 'limits': LIMITS,
           'images': '/k/sat/proj/<id>.jpg?v=<v>: one 96 x 96 px tile per clear month, in month order; f[i] is the tile index of month i (-1: no clear scene).',
           'fields': {'m0': 'first month', 'n': 'months', 'k': 'scenes listed (cloud cover < 70%) per month', 'c': 'share of the circle seen clear, % (null: no clear scene)',
                      'b': 'built-up or bare share of the circle, %', 'r': 'built-up or bare share of the 300-600 m ring, %', 'x': 'share of the circle differing visibly from the first clear month, % (reference, noisier)',
                      'f': 'thumbnail index', 'dt': 'date of the first scene used', 't': 'Sentinel-2 tile', 'base': 'first clear month', 'sum': 'medians of the first and last 3 clear months'},
           'projects': dict(sorted(res.items()))}
    json.dump(out, open(a.out, 'w'), separators=(',', ':'))
    print('projects', len(res), st, 'bytes', os.path.getsize(a.out))


if __name__ == '__main__':
    main()
