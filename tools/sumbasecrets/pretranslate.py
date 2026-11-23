"""Pre-fill tr_cache.json for every language in parallel (TR_URL/TR_KEY or CF_TOKEN). Usage: python3 pretranslate.py"""
import re, concurrent.futures as cf, translate
from guides3 import GUIDES3
from guides4 import GUIDES4
from guides5 import GUIDES5
from guides6 import GUIDES6
from ui3 import EXTRA_UI3
import native, guides_add
from months import MONTHS
from build_langs import LANGS2
def parts(h): return [x for x in re.split(r'(?=<h2>)', h) if x]
def strings():
    acc = []
    for g in GUIDES3 + GUIDES4 + GUIDES5 + GUIDES6:
        acc += [g["t"], g["d"]] + parts(g["b"])
        for q, a in g.get("faq", []): acc += [q, a]
    for x in MONTHS: acc += [x['t'], x['b']]
    for v in guides_add.ADD.values(): acc += parts(v)
    for f in guides_add.FAQ.values(): acc += [x for q in f for x in q]
    for v in EXTRA_UI3.values(): acc += v if isinstance(v, list) else [v]
    e = native.INTRO["en"]; acc += [e["t"], e["d"], e["i"]] + [x for f in e["faq"] for x in f] + list(native.LINKS["en"])
    return acc
S = strings()
def run(l):
    todo = [s for s in S if translate.key(l, s) not in translate.CACHE]
    translate.tr_strings(l, todo)
    return l, len(todo)
with cf.ThreadPoolExecutor(6) as ex:
    for l, n in ex.map(run, LANGS2): print(l, "translated", n, flush=True)
