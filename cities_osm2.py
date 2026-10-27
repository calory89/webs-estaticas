# Ciudades del mundo con mas de 200.000 habitantes segun OpenStreetMap.
import json, subprocess, time
EPS=["https://overpass.kumi.systems/api/interpreter","https://overpass-api.de/api/interpreter",
     "https://maps.mail.ru/osm/tools/overpass/api/interpreter","https://overpass.private.coffee/api/interpreter"]
Q = ('[out:json][timeout:600];'
     'node["place"~"^(city|town)$"]["population"](if:number(t["population"])>200000);'
     'out tags center;')
for k in range(10):
    o=subprocess.run(["curl","-sG","-m","620",EPS[k%4],"--data-urlencode","data="+Q],capture_output=True)
    t=o.stdout.decode('utf-8','ignore')
    if t.strip().startswith("{"):
        els=json.loads(t).get("elements",[])
        json.dump(els,open("raw_citylist2.json","w"))
        print("ciudades OSM:",len(els),flush=True); break
    print("reintento",k,flush=True); time.sleep(8)
else:
    print("FAIL",flush=True)
