#!/usr/bin/env python3
"""Submit new or changed kolaboro.com URLs to IndexNow (api.indexnow.org shares them with Bing, Yandex, Naver, Seznam and Yep).

Reads every URL and lastmod from https://kolaboro.com/sitemap_index.xml, compares with the last submission recorded in
https://kolaboro.com/data/indexnow.json and submits only URLs that are new or whose lastmod changed (max 10,000 per call).
The key file is served by the worker at https://kolaboro.com/<key>.txt. Google does not take IndexNow; it reads the sitemaps.
Usage: indexnow.py <out_dir>   writes <out_dir>/indexnow.json (unchanged state is not rewritten: exit code 3 = nothing to publish).
"""
import datetime as dt, json, os, re, sys, urllib.error, urllib.request

BASE = 'https://kolaboro.com'
KEY = '7f3c9a1e5b2d4c8fa06e91d3b7c4f259'
UA = 'KolaboroIndexNow/1.0 (+https://kolaboro.com/engineering/seo/)'


def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers={'user-agent': UA}), timeout=60) as r: return r.read().decode('utf-8', 'replace')


def main(out):
    os.makedirs(out, exist_ok=True)
    if get(BASE + '/' + KEY + '.txt').strip() != KEY: raise SystemExit('key file not served')
    cur = {}
    for m in re.findall(r'<loc>([^<]+)</loc>', get(BASE + '/sitemap_index.xml')):
        for u, lm in re.findall(r'<url><loc>([^<]+)</loc>(?:<lastmod>([^<]+)</lastmod>)?', get(m)): cur[u.replace('&amp;', '&')] = lm or ''
    try: prev = json.loads(get(BASE + '/data/indexnow.json'))
    except Exception: prev = {}
    sent = prev.get('sent') or {}
    todo = [u for u, lm in cur.items() if sent.get(u) != lm]
    if not todo:
        print('nothing new'); sys.exit(3)
    status, done = None, []
    for i in range(0, len(todo), 10000):
        chunk = todo[i:i + 10000]
        body = json.dumps({'host': 'kolaboro.com', 'key': KEY, 'keyLocation': BASE + '/' + KEY + '.txt', 'urlList': chunk}).encode()
        req = urllib.request.Request('https://api.indexnow.org/indexnow', data=body, method='POST', headers={'content-type': 'application/json; charset=utf-8', 'user-agent': UA})
        try:
            with urllib.request.urlopen(req, timeout=60) as r: status = r.status
        except urllib.error.HTTPError as e: status = e.code
        print('IndexNow', status, len(chunk))
        if status in (200, 202): done += chunk
    for u in done: sent[u] = cur[u]
    for u in list(sent):
        if u not in cur: del sent[u]
    now = dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%MZ')
    log = (prev.get('log') or [])[-49:] + [{'at': now, 'submitted': len(todo), 'accepted': len(done), 'status': status}]
    json.dump({'version': 'indexnow-1', 'at': now, 'submitted': len(todo), 'accepted': len(done), 'status': status, 'known': len(cur), 'endpoint': 'https://api.indexnow.org/indexnow', 'key_location': BASE + '/' + KEY + '.txt', 'log': log, 'sent': sent}, open(os.path.join(out, 'indexnow.json'), 'w'), separators=(',', ':'))
    if status not in (200, 202): sys.exit(1)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '.')
