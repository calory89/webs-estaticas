"""Translate everything needed by build.py in parallel (one thread per language)."""
import concurrent.futures as cf, translate as T
from places import PLACES
from ui import UI, GUIDES
from ui2 import UI2, REGION_TXT, CAT_TXT, SEASON
from guides2 import GUIDES2, TOWNS_TXT, EXTRA_UI, EXTRA_UI2
EXTRA_UI = dict(EXTRA_UI, **EXTRA_UI2)
NEW = ["it","zh","ja","ko","ru","pt"]; ALL = ["es","id","de","fr","nl"] + NEW
WX_EN = ["Clear","Partly cloudy","Cloudy","Fog","Drizzle","Rain","Showers","Thunderstorm"]
def strings(o, acc):
    if isinstance(o, str): acc.append(o)
    elif isinstance(o, dict): [strings(v, acc) for v in o.values()]
    elif isinstance(o, list): [strings(v, acc) for v in o]
    return acc
def job(l):
    acc = []
    if l in NEW:
        strings([UI["en"], UI2["en"], WX_EN, [{k: v for k, v in p["en"].items() if k != "n"} for p in PLACES], [g["en"] for g in GUIDES], [d[k]["en"] for d in (REGION_TXT, CAT_TXT, SEASON) for k in d]], acc)
    strings([EXTRA_UI, [{"t": g["t"], "d": g["d"], "b": g["b"]} for g in GUIDES2], list(TOWNS_TXT.values())], acc)
    T.tr_strings(l, acc); return l, len(acc)
with cf.ThreadPoolExecutor(11) as ex:
    for l, n in ex.map(job, ALL): print(l, n, flush=True)
