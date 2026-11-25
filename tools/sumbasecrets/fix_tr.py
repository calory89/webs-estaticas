"""Repair machine translations of guide sections: links must match the English source exactly."""
import re, json, translate
from guides3 import GUIDES3
from guides4 import GUIDES4
import guides_add
from guides5 import GUIDES5
from guides6_data import GUIDES6D
from guides6a import GUIDES6A
from guides6b import GUIDES6B
from guides6c import GUIDES6C
from guides7 import GUIDES7
from guides8 import GUIDES8
from guides9 import GUIDES9
from build_langs import LANGS2
H = re.compile(r'href="([^"]+)"')
def ok(p, t): return sorted(H.findall(p)) == sorted(H.findall(t)) and all(p.count(x) == t.count(x) for x in ("<h2>", "<h3>", "<li>", "<ul>", "</a>"))
def norm(t): return re.sub(r'<(/?)(h2|h3|p|li|ul|ol)(?:[.,;:\-]|\s+)(?![a-z]+=)', r'<\1\2>', t) if t else t
def parts(h): return [x for x in re.split(r'(?=<h2>)', h) if x]
fixed = retr = fallback = piece = 0
for g in GUIDES3 + GUIDES4 + GUIDES5 + GUIDES6D + GUIDES6A + GUIDES6B + GUIDES6C + GUIDES7 + GUIDES8 + GUIDES9 + [{"s": k, "b": v} for k, v in guides_add.ADD.items()]:
    for p in parts(g["b"]):
        src = H.findall(p)
        for l in LANGS2:
            k = translate.key(l, p); t = norm(translate.CACHE.get(k))
            if t and ok(p, t): translate.CACHE[k] = t; continue
            if t and ok(p, t): continue
            if t and len(H.findall(t)) == len(src) and all(t.count(x) == p.count(x) for x in ("<h2>", "<h3>", "<li>", "<ul>")):
                it = iter(src); t2 = H.sub(lambda m: 'href="%s"' % next(it), t)
                if ok(p, t2): translate.CACHE[k] = t2; fixed += 1; continue
            good = False
            for _ in range(3):
                translate.CACHE.pop(k, None)
                try: t = norm(translate.tr_strings(l, [p])[p])
                except Exception: t = ""
                if ok(p, t): good = True; break
                if t and len(H.findall(t)) == len(src):
                    it = iter(src); t2 = H.sub(lambda m: 'href="%s"' % next(it), t)
                    if ok(p, t2): translate.CACHE[k] = t2; good = True; break
            if not good:  # last resort: translate element by element, then restore links in order
                try:
                    pcs = [x for x in re.split(r'(?<=</li>)|(?<=</h2>)|(?<=</h3>)|(?<=</p>)|(?<=</tr>)', p) if x]
                    out = []
                    for x in pcs:
                        if not re.sub(r'<[^>]+>', '', x).strip(): out.append(x); continue
                        y = norm(translate.CACHE.get(translate.key(l, x)) or translate.tr_strings(l, [x])[x])
                        if len(H.findall(y)) != len(H.findall(x)): y = x
                        it = iter(H.findall(x)); out.append(H.sub(lambda m: 'href="%s"' % next(it), y))
                    t = "".join(out)
                    if ok(p, t): translate.CACHE[k] = t; good = True; piece += 1
                except Exception: pass
            if good: retr += 1
            else: translate.CACHE[k] = p; fallback += 1; print("fallback EN", l, g["s"], p[:50])
json.dump(translate.CACHE, open(translate.CACHE_F, "w"), ensure_ascii=False)
print("fixed", fixed, "retranslated", retr, "piecewise", piece, "fallback", fallback)
