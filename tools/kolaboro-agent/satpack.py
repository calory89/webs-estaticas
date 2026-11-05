#!/usr/bin/env python3
"""kolaboro.com satellite image packs.

Cloudflare Pages allows 20,000 files per deployment for the whole web-lovable project (about 60 sites), so the
satellite images of kolaboro.com (/k/sat/<area>/...) are not published one file per image. They are concatenated
into a few pack files per area plus one index, and the web-lovable worker (_worker.js/kbsat.js) serves each
original URL from its pack with the same bytes.

Layout (all under _s/kolaboro.com/k/sat/ on branch pub/_lovable):
  packs.json              index: files[path] = [pack, offset, length, content_type, sha256]
  <area>.pack             season composites, latest, radar and change layers (satellite.py)
  <area>.o.pack           optical frames of the current year, timelapse, built-up baseline (satellite_optical.py)
  <area>.h.pack           optical frames of earlier years (change about once a year)
A pack over 24 MiB is split into <name>.2.pack, <name>.3.pack, ... (Pages limit: 25 MiB per file).
Packs are written in sorted path order, so a pack whose images did not change gets byte-identical content
(same git blob, no repository growth).

Usage:
  satpack.py merge --cur DIR --new DIR --out DIR
      DIR given to --cur holds the current packs.json and the packs of the areas present in --new
      (missing = start empty). --new holds <area>/<path> image files (top-level *.json are ignored).
      Writes the rebuilt packs of every touched area and the merged packs.json to --out, and prints
      the pack file names that are no longer used (one per line, prefixed "drop ") so the caller can remove them.
  satpack.py build --src DIR --out DIR
      Packs a full tree of <area>/<path> images from scratch.
  satpack.py verify --packs DIR [--src DIR] [--partial]
      Checks every index entry (length, sha256) and, with --src, byte equality with the original files.
      --partial checks only the entries whose pack is present (after a merge).
"""
import argparse, datetime, hashlib, json, os, re, sys

LIMIT = 24 * 1024 * 1024
TYPES = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp', 'gif': 'image/gif', 'svg': 'image/svg+xml'}
AREA = re.compile(r'^[a-z0-9][a-z0-9-]{0,80}$')


def group(rel, year):
    """Pack group for a path relative to /k/sat/ ('<area>/<file>')."""
    area, rest = rel.split('/', 1)
    m = re.match(r'^opt/(\d{4})-\d\d\.[a-z]+$', rest)
    if m: return area + ('.h' if int(m.group(1)) < year else '.o')
    if rest.startswith('opt/'): return area + '.o'
    return area


def ctype(rel):
    return TYPES.get(rel.rsplit('.', 1)[-1].lower(), 'application/octet-stream')


def read_tree(src):
    out = {}
    for d, _, fs in os.walk(src):
        for f in fs:
            p = os.path.join(d, f); rel = os.path.relpath(p, src).replace(os.sep, '/')
            if '/' not in rel: continue          # top-level files (satellite.json, ...) are not images
            if not AREA.match(rel.split('/', 1)[0]): raise SystemExit('bad area name: ' + rel)
            out[rel] = open(p, 'rb').read()
    return out


def load_entries(cur, areas):
    """Bytes of every indexed image of the given areas, read from the current packs."""
    ip = os.path.join(cur, 'packs.json')
    idx = json.load(open(ip)) if os.path.exists(ip) else {'files': {}}
    data, cache = {}, {}
    for rel, (pack, off, ln, ct, sha) in idx.get('files', {}).items():
        if rel.split('/', 1)[0] not in areas: continue
        if pack not in cache:
            pp = os.path.join(cur, pack)
            if not os.path.exists(pp): raise SystemExit('missing current pack ' + pack + ' (needed for ' + rel + ')')
            cache[pack] = open(pp, 'rb').read()
        b = cache[pack][off:off + ln]
        if len(b) != ln or hashlib.sha256(b).hexdigest() != sha: raise SystemExit('current pack corrupt at ' + rel)
        data[rel] = b
    return idx, data


def write_packs(files, out, year):
    """files: rel -> bytes for complete areas. Returns index entries and pack names written."""
    groups = {}
    for rel in sorted(files): groups.setdefault(group(rel, year), []).append(rel)
    entries, names = {}, []
    for g, rels in sorted(groups.items()):
        n, buf, i = 1, bytearray(), 0
        def flush(n, buf):
            name = g + ('' if n == 1 else '.%d' % n) + '.pack'
            with open(os.path.join(out, name), 'wb') as fh: fh.write(buf)
            names.append(name); return name
        chunk = []
        for rel in rels:
            b = files[rel]
            if len(b) > LIMIT: raise SystemExit('image over the pack limit: ' + rel)
            if buf and len(buf) + len(b) > LIMIT:
                name = flush(n, buf)
                for r_, o_, l_ in chunk: entries[r_] = [name, o_, l_, ctype(r_), hashlib.sha256(files[r_]).hexdigest()]
                n, buf, chunk = n + 1, bytearray(), []
            chunk.append((rel, len(buf), len(b))); buf += b
        name = flush(n, buf)
        for r_, o_, l_ in chunk: entries[r_] = [name, o_, l_, ctype(r_), hashlib.sha256(files[r_]).hexdigest()]
    return entries, names


def save_index(idx, out):
    files = dict(sorted(idx['files'].items()))
    packs = sorted({e[0] for e in files.values()})
    doc = {'v': 1,
           'note': 'kolaboro.com satellite images: each /k/sat/<path> is served by the site worker from [pack, offset, length, content type, sha256]. Built by tools/kolaboro-agent/satpack.py.',
           'packs': packs, 'files': files}
    with open(os.path.join(out, 'packs.json'), 'w') as fh: json.dump(doc, fh, separators=(',', ':'))
    return doc


def main():
    ap = argparse.ArgumentParser(); sub = ap.add_subparsers(dest='cmd', required=True)
    m = sub.add_parser('merge'); m.add_argument('--cur', required=True); m.add_argument('--new', required=True); m.add_argument('--out', required=True)
    b = sub.add_parser('build'); b.add_argument('--src', required=True); b.add_argument('--out', required=True)
    v = sub.add_parser('verify'); v.add_argument('--packs', required=True); v.add_argument('--src'); v.add_argument('--partial', action='store_true', help='check only entries whose pack is in --packs')
    a = ap.parse_args(); year = datetime.datetime.now(datetime.timezone.utc).year
    if a.cmd in ('merge', 'build'): os.makedirs(a.out, exist_ok=True)
    if a.cmd == 'build':
        files = read_tree(a.src); entries, names = write_packs(files, a.out, year)
        save_index({'files': entries}, a.out)
        print('%d images in %d packs' % (len(entries), len(names)))
    elif a.cmd == 'merge':
        new = read_tree(a.new); areas = {r.split('/', 1)[0] for r in new}
        idx, data = load_entries(a.cur, areas)
        before = {e[0] for r, e in idx.get('files', {}).items() if r.split('/', 1)[0] in areas}
        changed = sum(1 for r, x in new.items() if data.get(r) != x)
        data.update(new)
        entries, names = write_packs(data, a.out, year)
        files = {r: e for r, e in idx.get('files', {}).items() if r.split('/', 1)[0] not in areas}
        files.update(entries); save_index({'files': files}, a.out)
        for p in sorted(before - set(names)): print('drop ' + p)
        print('merged %d new or changed of %d images in %d areas; %d packs written; index %d images' % (changed, len(new), len(areas), len(names), len(files)), file=sys.stderr)
    else:
        idx = json.load(open(os.path.join(a.packs, 'packs.json'))); bad = 0; cache = {}
        for rel, (pack, off, ln, ct, sha) in idx['files'].items():
            if a.partial and not os.path.exists(os.path.join(a.packs, pack)): continue
            if pack not in cache: cache[pack] = open(os.path.join(a.packs, pack), 'rb').read()
            x = cache[pack][off:off + ln]
            ok = len(x) == ln and hashlib.sha256(x).hexdigest() == sha and ct == ctype(rel)
            if a.src: ok = ok and open(os.path.join(a.src, rel), 'rb').read() == x
            if not ok: bad += 1; print('BAD', rel)
        big = [p for p in cache if len(cache[p]) > 25 * 1024 * 1024]
        print('%d images, %d packs, %d bad, largest pack %.2f MiB%s' % (len(idx['files']), len(cache), bad, max([len(c) for c in cache.values()] or [0]) / 1048576, ', OVER LIMIT: ' + ','.join(big) if big else ''))
        sys.exit(1 if bad or big else 0)


if __name__ == '__main__':
    main()
