"""Machine translation with Cloudflare Workers AI, cached in tr_cache.json.
Usage inside build: from translate import tr_tree; tr_tree(obj, "ja")
Needs env CF_TOKEN (Workers AI) the first time a string is translated."""
import json, os, hashlib, re, urllib.request, threading, concurrent.futures as cf
LOCK = threading.Lock()

ACC = "d275d2609c10aa655477fd7a47e9b443"
MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
NAMES = {"es":"Spanish (Spain)","id":"Indonesian","de":"German","fr":"French","nl":"Dutch","it":"Italian","zh":"Simplified Chinese","ja":"Japanese","ko":"Korean","ru":"Russian","pt":"Portuguese (Portugal)"}
CACHE_F = os.path.join(os.path.dirname(__file__), "tr_cache.json")
CACHE = json.load(open(CACHE_F)) if os.path.exists(CACHE_F) else {}
key = lambda l, s: hashlib.sha1((l + "\x00" + s).encode()).hexdigest()[:16]

def _call(lang, batch):
    sysmsg = (f"You are a professional travel-guide translator. Translate every JSON value from English into {NAMES[lang]}. "
              "Keep HTML tags, attributes, URLs and placeholders like {n} {l} {r} exactly as they are. Keep proper names of places "
              "(Weekuri, Ratenggaro, Waingapu, Marapu, Pasola, ikat, Sumba) unchanged. Natural, fluent style. No em dashes. "
              "Return ONLY a valid JSON object with exactly the same keys.")
    body = json.dumps({"messages":[{"role":"system","content":sysmsg},{"role":"user","content":json.dumps(batch, ensure_ascii=False)}],"max_tokens":8000,"temperature":0.2}).encode()
    if os.environ.get("TR_URL"):  # 13-nov-2026: translate through the site's own Worker (Workers AI binding), key in TR_KEY
        req = urllib.request.Request(os.environ["TR_URL"], data=body, headers={"x-tr-key": os.environ["TR_KEY"], "content-type": "application/json", "user-agent": "curl/8"})
    else:
        req = urllib.request.Request(f"https://api.cloudflare.com/client/v4/accounts/{ACC}/ai/run/{MODEL}", data=body,
          headers={"Authorization":"Bearer "+os.environ["CF_TOKEN"],"content-type":"application/json","user-agent":"curl/8"})
    for attempt in range(4):
        try:
            r = json.load(urllib.request.urlopen(req, timeout=180))["result"]
            txt = r.get("response") or r["choices"][0]["message"]["content"]
            if isinstance(txt, dict): out = txt
            else:
                txt = txt.strip(); txt = txt[txt.find("{"): txt.rfind("}")+1]; out = json.loads(txt)
            if set(out) >= set(batch) and all(isinstance(out[k], str) and out[k].strip() for k in batch): return out
        except Exception as e:
            err = e
    raise RuntimeError(f"translation failed {lang}: {list(batch)[:3]}")

def tr_strings(lang, strings):
    todo = [s for s in dict.fromkeys(strings) if s and key(lang, s) not in CACHE]
    batches, cur, size = [], {}, 0
    for i, s in enumerate(todo):
        if size + len(s) > 2600 and cur: batches.append(cur); cur, size = {}, 0
        cur[f"k{i}"] = s; size += len(s)
    if cur: batches.append(cur)
    def run(b):
        try: return b, _call(lang, b)
        except Exception:
            out = {}
            for k, v in b.items(): out.update(_call(lang, {k: v}))  # retry one by one
            return b, out
    with cf.ThreadPoolExecutor(8) as ex:
        for b, out in ex.map(run, batches):
            with LOCK:
                for k, s in b.items(): CACHE[key(lang, s)] = out[k]
                json.dump(CACHE, open(CACHE_F, "w"), ensure_ascii=False)
    return {s: CACHE[key(lang, s)] for s in strings if s}

def _collect(o, acc):
    if isinstance(o, str): acc.append(o)
    elif isinstance(o, dict): [ _collect(v, acc) for v in o.values() ]
    elif isinstance(o, list): [ _collect(v, acc) for v in o ]
def _apply(o, m):
    if isinstance(o, str): return m.get(o, o)
    if isinstance(o, dict): return {k: _apply(v, m) for k, v in o.items()}
    if isinstance(o, list): return [_apply(v, m) for v in o]
    return o
FIX = {"ja": [("スマバ", "スンバ")], "zh": [("苏巴", "松巴")]}
def tr_tree(obj, lang):
    if os.environ.get("TR_SKIP"):  # no translator available: keep only cached strings, leave the rest in English
        acc = []; _collect(obj, acc)
        return _apply(obj, {s: CACHE[key(lang, s)] for s in acc if key(lang, s) in CACHE})
    acc = []; _collect(obj, acc)
    m = tr_strings(lang, acc)
    for a, b in FIX.get(lang, []): m = {k: v.replace(a, b) for k, v in m.items()}
    return _apply(obj, m)
