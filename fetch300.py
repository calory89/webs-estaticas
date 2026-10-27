# Datos OSM de las 300 ciudades nuevas. Escribe cada ciudad segun llega:
# si esto se corta a la mitad, no se pierde lo ya bajado.
import json,os,time,subprocess,threading
from concurrent.futures import ThreadPoolExecutor
EPS=["https://maps.mail.ru/osm/tools/overpass/api/interpreter",
     "https://overpass.kumi.systems/api/interpreter",
     "https://overpass.private.coffee/api/interpreter",
     "https://overpass-api.de/api/interpreter"]
OUTF="raw_w300.json"
C=[(c['name'],c['lat'],c['lon']) for c in json.load(open('cities_new300.json'))]
OUT = json.load(open(OUTF)) if os.path.exists(OUTF) else {}
C=[c for c in C if c[0] not in OUT]
print('por bajar:',len(C),flush=True)
lock=threading.Lock(); done=[0]
def q(la,lo):
    a=f"(around:11000,{la},{lo})"; b=f"(around:2500,{la},{lo})"
    return ("[out:json][timeout:180];("
      f'nwr["social_facility"]{a};'
      f'nwr["amenity"~"^(shower|public_bath|refugee_site|food_sharing|give_box|social_centre)$"]{a};'
      f'nwr["shop"="charity"]{a};nwr["office"="ngo"]{a};nwr["amenity"="library"]{a};'
      f'nwr["amenity"="hospital"]{a};nwr["healthcare"="centre"]{a};'
      f'nwr["amenity"="drinking_water"]{b};nwr["amenity"="toilets"]["fee"="no"]{b};'
      ");out center tags 2500;")
def job(c):
    n,la,lo=c
    for k in range(8):
        try:
            o=subprocess.run(["curl","-sG","-m","220",EPS[k%4],"--data-urlencode","data="+q(la,lo)],capture_output=True)
            t=o.stdout.decode('utf-8','ignore')
            if t.strip().startswith("{"):
                with lock:
                    OUT[n]=json.loads(t).get("elements",[])
                    done[0]+=1
                    json.dump(OUT,open(OUTF,"w"))
                    print(done[0],n,len(OUT[n]),flush=True)
                return
        except Exception: pass
        time.sleep(6)
    with lock: print("FAIL",n,flush=True)
with ThreadPoolExecutor(max_workers=5) as ex: list(ex.map(job,C))
json.dump(OUT,open(OUTF,"w"))
print("DONE",len(OUT),sum(len(v) for v in OUT.values()),flush=True)
