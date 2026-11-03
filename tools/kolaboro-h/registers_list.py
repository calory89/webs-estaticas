import re, json, sys, html
s = open(sys.argv[1]).read()
out = []
for art in re.finditer(r'<article class="rgc" id="([^"]+)"[^>]*>(.*?)</article>', s, re.S):
    mid, body = art.group(1), art.group(2)
    mname = html.unescape(re.sub('<[^>]+>', '', re.search(r'<h3[^>]*>(.*?)</h3>', body, re.S).group(1))).replace('#', '').strip()
    for li in re.finditer(r'<li class="rg" data-c="([^"]*)">(.*?)</div></li>', body, re.S):
        b = li.group(2)
        name = html.unescape(re.sub('<[^>]+>', '', re.search(r'<h4>(.*?)</h4>', b, re.S).group(1))).strip()
        a = re.search(r'<a class="rg-open" href="([^"]+)"', b)
        out.append({'market_id': mid, 'market': mname, 'register': name, 'checks': li.group(1).split(), 'url': html.unescape(a.group(1)) if a else None})
# added for automated lookups: robots.txt allows /ABN/View and the page answers plain HTTP
if not any(x['register'].startswith('Australian Business Register') for x in out):
    out.append({'market_id': 'australia', 'market': 'Australia', 'register': 'Australian Business Register (ABN Lookup)', 'checks': ['company'], 'url': 'https://abr.business.gov.au/'})
json.dump(out, sys.stdout, ensure_ascii=False, indent=0)
