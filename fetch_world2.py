import json,time,subprocess,threading
from concurrent.futures import ThreadPoolExecutor
EPS=["https://maps.mail.ru/osm/tools/overpass/api/interpreter",
     "https://overpass.kumi.systems/api/interpreter",
     "https://overpass-api.de/api/interpreter",
     "https://overpass.private.coffee/api/interpreter"]
C=[("Lisbon",38.7223,-9.1393),("Berlin",52.5200,13.4050),("Rome",41.9028,12.4964),
   ("Athens",37.9838,23.7275),("Warsaw",52.2297,21.0122),("Istanbul",41.0082,28.9784),
   ("Nairobi",-1.2864,36.8172),("Johannesburg",-26.2041,28.0473),("SaoPaulo",-23.5505,-46.6333),
   ("Lima",-12.0464,-77.0428)]
lock=threading.Lock(); OUT={}
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
            o=subprocess.run(["curl","-sG","-m","200",EPS[k%4],"--data-urlencode","data="+q(la,lo)],capture_output=True)
            t=o.stdout.decode('utf-8','ignore')
            if t.strip().startswith("{"):
                with lock:
                    OUT[n]=json.loads(t).get("elements",[])
                    json.dump(OUT,open("raw_world2.json","w"))
                print(n,len(OUT[n]),flush=True); return
        except Exception: pass
        time.sleep(5)
    print("FAIL",n,flush=True)
with ThreadPoolExecutor(max_workers=4) as ex: list(ex.map(job,C))
json.dump(OUT,open("raw_world2.json","w"))
print("DONE",sum(len(v) for v in OUT.values()),flush=True)
