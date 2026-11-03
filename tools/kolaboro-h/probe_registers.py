# Probe every register linked on /registers/: robots.txt, plain HTTP reachability, content type, SHA-256 of the response.
import json, sys, time, hashlib, urllib.request, urllib.robotparser, urllib.parse, ssl, re
UA = 'KolaboroRegisterCheck/1.0 (+https://kolaboro.com/registers/)'
regs = json.load(open(sys.argv[1])); out = []
ctx = ssl.create_default_context()
def get(url, n=3_000_000):
    req = urllib.request.Request(url, headers={'user-agent': UA, 'accept': 'text/html,application/json,*/*'})
    r = urllib.request.urlopen(req, timeout=30, context=ctx)
    return r.status, r.geturl(), r.headers.get('content-type', ''), r.read(n)
seen = {}
for x in regs:
    rec = dict(x); rec['probed_at'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    if not x['url']:
        rec.update(result='no official link', robots=None); out.append(rec); continue
    u = x['url']
    if u in seen: rec.update({k: v for k, v in seen[u].items() if k not in rec or k in ('result',)}); rec['probed_at'] = seen[u]['probed_at']; out.append(rec); continue
    p = urllib.parse.urlsplit(u); robots = None
    try:
        rp = urllib.robotparser.RobotFileParser(); st, fu, ct, body = get(p.scheme + '://' + p.netloc + '/robots.txt', 200000)
        rp.parse(body.decode('utf-8', 'replace').splitlines()); robots = 'allowed' if rp.can_fetch(UA, u) else 'disallowed'
    except Exception as e:
        robots = 'no robots.txt (%s)' % (getattr(e, 'code', None) or type(e).__name__)
    if robots == 'disallowed':
        rec.update(result='robots.txt disallows automated access', robots=robots)
    else:
        try:
            st, fu, ct, body = get(u)
            txt = body[:400000].decode('utf-8', 'replace').lower()
            js = len(re.sub(r'<script.*?</script>|<style.*?</style>|<[^>]+>|\s+', '', txt, flags=re.S)) < 400
            cap = bool(re.search(r'recaptcha|hcaptcha|cf-challenge|captcha', txt))
            rec.update(robots=robots, http=st, final_url=fu, content_type=ct.split(';')[0], bytes=len(body), sha256=hashlib.sha256(body).hexdigest(),
                       result='reachable' + (', page needs JavaScript' if js else '') + (', captcha on page' if cap else ''))
        except Exception as e:
            rec.update(robots=robots, http=getattr(e, 'code', None), result='not reachable from our checker (%s)' % (getattr(e, 'code', None) or type(e).__name__))
    seen[u] = rec; out.append(rec); time.sleep(1)
    print(rec['market'], '|', rec['register'], '|', rec['result'], '|', rec.get('robots'), file=sys.stderr)
json.dump(out, open(sys.argv[2], 'w'), ensure_ascii=False)
