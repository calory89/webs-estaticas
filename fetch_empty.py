# Las 39 ciudades que salieron sin ningun sitio a 10 km. Segundo barrido, mas
# ancho (25 km) y con mas etiquetas: en estas ciudades la ayuda no se etiqueta
# como social_facility, se etiqueta como lo que es — una clinica, una mezquita,
# una iglesia con comedor, un pozo, una oficina de una ONG.
import json,os,subprocess,threading,time
from concurrent.futures import ThreadPoolExecutor
EPS=["https://maps.mail.ru/osm/tools/overpass/api/interpreter","https://overpass.kumi.systems/api/interpreter",
     "https://overpass.private.coffee/api/interpreter","https://overpass-api.de/api/interpreter"]
OUTF='raw_empty.json'
C=[(c[0],c[1],c[2]) for c in json.load(open('empty_cities.json'))]
OUT=json.load(open(OUTF)) if os.path.exists(OUTF) else {}
C=[c for c in C if c[0] not in OUT]
print('por bajar:',len(C),flush=True)
lock=threading.Lock(); done=[0]
def q(la,lo):
    a=f"(around:25000,{la},{lo})"; b=f"(around:6000,{la},{lo})"
    return ("[out:json][timeout:180];("
      f'nwr["social_facility"]{a};'
      f'nwr["amenity"~"^(shower|public_bath|refugee_site|food_sharing|give_box|social_centre|community_centre|social_facility)$"]{a};'
      f'nwr["shop"="charity"]{a};nwr["office"~"^(ngo|charity|association)$"]{a};nwr["amenity"="library"]{a};'
      f'nwr["amenity"~"^(hospital|clinic|doctors|health_post|pharmacy)$"]{a};nwr["healthcare"]{a};'
      f'nwr["amenity"="drinking_water"]{b};nwr["man_made"="water_well"]["drinking_water"!="no"]{b};nwr["man_made"="water_tap"]{b};'
      f'nwr["amenity"="toilets"]{b};'
      f'nwr["amenity"="place_of_worship"]["social_facility"]{a};'
      ");out center tags 3000;")
def job(c):
    n,la,lo=c
    for k in range(8):
        try:
            o=subprocess.run(["curl","-sG","-m","220",EPS[k%4],"--data-urlencode","data="+q(la,lo)],capture_output=True)
            t=o.stdout.decode('utf-8','ignore')
            if t.strip().startswith("{"):
                with lock:
                    OUT[n]=json.loads(t).get("elements",[]); done[0]+=1
                    json.dump(OUT,open(OUTF,"w")); print(done[0],n,len(OUT[n]),flush=True)
                return
        except Exception: pass
        time.sleep(6)
    with lock: print("FAIL",n,flush=True)
with ThreadPoolExecutor(max_workers=3) as ex: list(ex.map(job,C))
json.dump(OUT,open(OUTF,"w"))
print("DONE",len(OUT),sum(len(v) for v in OUT.values()),flush=True)
