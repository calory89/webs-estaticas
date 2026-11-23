# Sumba Secrets: road distances on the OpenStreetMap network, routed with the public OSRM demo server (23-nov-2026). Output roads.json (km, OSRM minutes; we do not publish OSRM minutes, they are too optimistic for Sumba).
import json, urllib.request, time, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import os; os.chdir(os.path.dirname(os.path.abspath(__file__)))
from places import PLACES, TOWNS, AIRPORTS
from places_mamboro import MAMBORO
from coords_fix import COORD_FIX
P = {p["s"]: COORD_FIX.get(p["s"], p["ll"]) for p in PLACES + MAMBORO}
P.update({t["s"]: t["ll"] for t in TOWNS}); P["TMC"] = AIRPORTS[0]["ll"]; P["WGP"] = AIRPORTS[1]["ll"]
P.update({"melolo": [-9.8846, 120.6636], "lewa": [-9.7013, 119.8785], "bondo-kodi": [-9.5933, 118.9927], "kabukarudi": [-9.7197, 119.3582], "rambangaru": [-9.4553, 120.0583], "mamboro": [-9.3844, 119.5402]})
def route(*names):
    c = ";".join(f"{P[n][1]},{P[n][0]}" for n in names)
    u = f"https://router.project-osrm.org/route/v1/driving/{c}?overview=false"
    for i in range(3):
        try:
            r = json.load(urllib.request.urlopen(u, timeout=30)); break
        except Exception as e: time.sleep(2)
    legs = r["routes"][0]["legs"]
    return [(names[i], names[i+1], round(l["distance"]/1000, 1), round(l["duration"]/60)) for i, l in enumerate(legs)]
LEGS = {
 "inland": ["waingapu","wairinding-hill","lewa","waibakul","waikabubak","tambolaka"],
 "north": ["waingapu","puru-kambera","mamboro","tambolaka"],
 "north2": ["waingapu","mamboro"],
 "w_t_direct": ["waingapu","tambolaka"],
 "east_d1": ["WGP","prailiu-village","brotherhood-hill","walakiri-beach","waingapu"],
 "east_d2": ["waingapu","wairinding-hill","tanggedu-waterfall","waingapu"],
 "east_d2b": ["waingapu","puru-kambera","waingapu"],
 "east_d3": ["waingapu","melolo","praiyawang-rende","waimarang-waterfall","waingapu"],
 "east_misc": ["waingapu","londa-lima-beach","waingapu","tarimbang-bay"],
 "kodi": ["TMC","weekuri-lagoon","mandorak-beach","bondo-kodi","pero-beach","ratenggaro","watu-maladong","tambolaka"],
 "kodi2": ["tambolaka","pero-beach"],
 "wano": ["waikabubak","prai-ijing","waikabubak","waigalli-village","pasola-wanokaka","rua-beach","marosi-beach","kabukarudi","waikabubak"],
 "wano2": ["TMC","waikabubak"],
 "wunga": ["waingapu","puru-kambera","rambangaru","napu-valley","wunga-village"],
}
out = {k: route(*v) for k, v in LEGS.items()}
json.dump(out, open("roads.json","w"), indent=1)
for k, v in out.items():
    print(k, sum(x[2] for x in v), "km"); [print("   ", x) for x in v]
