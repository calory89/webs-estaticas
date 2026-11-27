import json, urllib.request, concurrent.futures as cf, hashlib, time
m = json.load(open('pub/manifest.json'))['changed']
S = '/home/claude/sn/stage_blog/_s/supportnear.com/'
def url(rel):
    if rel.endswith('index.html'): p = rel[:-10]
    elif rel.endswith('.html'): p = rel[:-5]
    else: p = rel
    return 'https://supportnear.com/' + p + '?r27=' + str(int(time.time()))
def chk(rel):
    want = open(S + rel, 'rb').read()
    try:
        req = urllib.request.Request(url(rel), headers={'User-Agent': 'https://supportnear.com/about', 'Accept-Encoding': 'identity'})
        got = urllib.request.urlopen(req, timeout=40).read()
    except Exception as e: return rel, 'ERR ' + str(e)[:60]
    import re
    got = re.sub(rb'\s?<script type="module" src="https://static\.cloudflareinsights\.com/beacon[^>]*></script>', b'', got)
    return rel, 'ok' if got == want else 'DIFF %d vs %d' % (len(got), len(want))
with cf.ThreadPoolExecutor(16) as ex: res = list(ex.map(chk, sorted(m)))
bad = [r for r in res if r[1] != 'ok']
print('ok', len(res) - len(bad), '/', len(res)); print(bad[:10])
