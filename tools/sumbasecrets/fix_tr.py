"""Repair machine translations of guide sections: links must match the English source exactly."""
import re, json, translate
from guides3 import GUIDES3
from guides4 import GUIDES4
import guides_add
from build_langs import LANGS2
H = re.compile(r'href="([^"]+)"')
def ok(p, t): return sorted(H.findall(p)) == sorted(H.findall(t)) and all(p.count(x) == t.count(x) for x in ("<h2>", "<h3>", "<li>", "<ul>", "</a>"))
def parts(h): return [x for x in re.split(r'(?=<h2>)', h) if x]
fixed = retr = fallback = 0
for g in GUIDES3 + GUIDES4 + [{"s": k, "b": v} for k, v in guides_add.ADD.items()]:
    for p in parts(g["b"]):
        src = H.findall(p)
        for l in LANGS2:
            k = translate.key(l, p); t = translate.CACHE.get(k)
            if t and ok(p, t): continue
            if t and len(H.findall(t)) == len(src) and all(t.count(x) == p.count(x) for x in ("<h2>", "<h3>", "<li>", "<ul>")):
                it = iter(src); t2 = H.sub(lambda m: 'href="%s"' % next(it), t)
                if ok(p, t2): translate.CACHE[k] = t2; fixed += 1; continue
            good = False
            for _ in range(3):
                translate.CACHE.pop(k, None)
                try: t = translate.tr_strings(l, [p])[p]
                except Exception: t = ""
                if ok(p, t): good = True; break
                if t and len(H.findall(t)) == len(src):
                    it = iter(src); t2 = H.sub(lambda m: 'href="%s"' % next(it), t)
                    if ok(p, t2): translate.CACHE[k] = t2; good = True; break
            if good: retr += 1
            else: translate.CACHE[k] = p; fallback += 1; print("fallback EN", l, g["s"], p[:50])
json.dump(translate.CACHE, open(translate.CACHE_F, "w"), ensure_ascii=False)
print("fixed", fixed, "retranslated", retr, "fallback", fallback)
