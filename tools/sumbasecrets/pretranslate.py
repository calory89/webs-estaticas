"""Pre-fill tr_cache.json for every language in parallel (TR_URL/TR_KEY or CF_TOKEN). Usage: python3 pretranslate.py"""
import re, concurrent.futures as cf, translate
from guides3 import GUIDES3
from build_langs import LANGS2
def parts(h): return [x for x in re.split(r'(?=<h2>)', h) if x]
def strings():
    acc = []
    for g in GUIDES3:
        acc += [g["t"], g["d"]] + parts(g["b"])
        for q, a in g.get("faq", []): acc += [q, a]
    return acc
S = strings()
def run(l):
    todo = [s for s in S if translate.key(l, s) not in translate.CACHE]
    translate.tr_strings(l, todo)
    return l, len(todo)
with cf.ThreadPoolExecutor(6) as ex:
    for l, n in ex.map(run, LANGS2): print(l, "translated", n, flush=True)
