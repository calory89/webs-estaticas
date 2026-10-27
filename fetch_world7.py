import json,time,subprocess,threading
from concurrent.futures import ThreadPoolExecutor
EPS=["https://maps.mail.ru/osm/tools/overpass/api/interpreter",
     "https://overpass.kumi.systems/api/interpreter",
     "https://overpass-api.de/api/interpreter",
     "https://overpass.private.coffee/api/interpreter"]
C=[("Almaty",43.2220,76.8512),("Tbilisi",41.7151,44.8271),("Erbil",36.1911,44.0092),
   ("Hyderabad",17.3850,78.4867),("Bangalore",12.9716,77.5946),("Manchester",53.4808,-2.2426),
   ("Glasgow",55.8642,-4.2518),("Dublin",53.3498,-6.2603),("Hamburg",53.5511,9.9937),
   ("Munich",48.1351,11.5820),("Milan",45.4642,9.1900),("Prague",50.0755,14.4378),
   ("Thessaloniki",40.6401,22.9444),("Houston",29.7604,-95.3698),("Miami",25.7617,-80.1918),
   ("Montreal",45.5017,-73.5673),("Guadalajara",20.6597,-103.3496),("Recife",-8.0476,-34.8770),
   ("LaPaz",-16.4897,-68.1193),("Sydney",-33.8688,151.2093),("Melbourne",-37.8136,144.9631)]
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
                    json.dump(OUT,open("raw_world7.json","w"))
                print(n,len(OUT[n]),flush=True); return
        except Exception: pass
        time.sleep(5)
    print("FAIL",n,flush=True)
with ThreadPoolExecutor(max_workers=4) as ex: list(ex.map(job,C))
json.dump(OUT,open("raw_world7.json","w"))
print("DONE",sum(len(v) for v in OUT.values()),flush=True)
