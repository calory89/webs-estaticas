#!/usr/bin/env python3
"""Kolaboro page history: the developer's own page text, version by version, for the "what changed" viewer on named pages.

Usage: page_history.py NAMED_JSON OUT_DIR
Reads (no network, no model calls, zero cost):
  data/runs/<day>.json     the research agent's daily read: per project slug, the SHA-256 of the page text it read and the day
  data/live-state.json     the hourly re-read: per project slug, the list of [day, sha256] versions it saw
  data/archive/<sha[:2]>/<sha>.txt.gz   the frozen copy of every page text (agent.keep_copy), named by its SHA-256
Writes OUT_DIR/page-history-<k>.json for k in 0..SHARDS-1 (project id -> shard by the sum of its character codes mod SHARDS).
Each project: its page URL, a list of unique text segments (sentences with their exact trailing whitespace) and, per version,
the day it was first seen, its SHA-256 and the segment indexes. Joining a version's segments gives back the exact archived text,
so anyone can hash the copy kolaboro.com serves and compare it with the sealed SHA-256 (checked here before writing).
Only projects that have a public named page (NAMED_JSON, minus the conflict-of-interest market Sumba) are written.
"""
import json, os, re, sys, gzip, glob, hashlib
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, 'data')
sys.path.insert(0, HERE)
SHARDS = 3
MAX_TEXT = 300_000      # skip a version whose text is larger than this (characters)
MAX_VERSIONS = 30       # keep the most recent versions per project
SEG = re.compile(r'.*?(?:[.!?。！？](?=\s)|\n|$)\s*', re.S)


def segments(text):
    out = [m.group(0) for m in SEG.finditer(text) if m.group(0)]
    return out if ''.join(out) == text else [text]


def shard(pid):
    return sum(ord(c) for c in pid) % SHARDS


def public_ids():
    import dev_intel
    return dev_intel.public_ids(dev_intel.projects())


def main(named_path, out_dir):
    named = json.load(open(named_path))
    keep = {p['id']: p for p in named.get('projects', []) if str(p.get('mk', '')).lower() != 'sumba'}
    ids = public_ids()
    seen = {}   # slug -> {sha: first day}
    def add(slug, sha, day):
        if not slug or not sha or not re.fullmatch(r'[0-9a-f]{64}', sha): return
        d = seen.setdefault(slug, {})
        if sha not in d or (day and day < d[sha]): d[sha] = day
    for f in sorted(glob.glob(os.path.join(DATA, 'runs', '*.json'))):
        day = os.path.basename(f)[:10]
        try: latest = json.load(open(f)).get('latest', {})
        except Exception: continue
        for slug, v in latest.items(): add(slug, v.get('sha256'), str(v.get('sealed') or day)[:10])
    try: live = json.load(open(os.path.join(DATA, 'live-state.json')))
    except Exception: live = {}
    for slug, v in live.items():
        for ver in v.get('versions') or []:
            if isinstance(ver, list) and len(ver) >= 2: add(slug, ver[1], str(ver[0])[:10])
    shards = [{} for _ in range(SHARDS)]
    stats = {'projects': 0, 'versions': 0, 'missing_copy': 0, 'bad_hash': 0, 'too_big': 0, 'with_changes': 0}
    for slug, vers in seen.items():
        pid = ids.get(slug)
        if pid not in keep: continue
        segs, index, V = [], {}, []
        for sha, day in sorted(vers.items(), key=lambda kv: (kv[1] or '', kv[0]))[-MAX_VERSIONS:]:
            p = os.path.join(DATA, 'archive', sha[:2], sha + '.txt.gz')
            if not os.path.exists(p): stats['missing_copy'] += 1; continue
            try: text = gzip.open(p).read().decode('utf-8')
            except Exception: stats['missing_copy'] += 1; continue
            if hashlib.sha256(text.encode()).hexdigest() != sha: stats['bad_hash'] += 1; continue
            if len(text) > MAX_TEXT: stats['too_big'] += 1; continue
            ix = []
            for s in segments(text):
                if s not in index: index[s] = len(segs); segs.append(s)
                ix.append(index[s])
            V.append({'d': day, 'sha': sha, 'ix': ix})
        if not V: continue
        stats['projects'] += 1; stats['versions'] += len(V); stats['with_changes'] += len(V) > 1
        shards[shard(pid)][pid] = {'url': keep[pid].get('url'), 'seg': segs, 'v': V}
    os.makedirs(out_dir, exist_ok=True)
    now = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    for k, P in enumerate(shards):
        doc = {'version': 'page-history-1', 'updated': now, 'shard': k, 'shards': SHARDS,
               'note': 'Developer page text as read by the Kolaboro agents, per version. Join seg[i] for i in v.ix to get the exact archived text; its SHA-256 is v.sha. Public named projects only.',
               'projects': P}
        with open(os.path.join(out_dir, 'page-history-%d.json' % k), 'w') as f: json.dump(doc, f, ensure_ascii=False, separators=(',', ':'))
    stats['bytes'] = [os.path.getsize(os.path.join(out_dir, 'page-history-%d.json' % k)) for k in range(SHARDS)]
    print(json.dumps(stats))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
