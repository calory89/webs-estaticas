import json,time,subprocess,threading
from concurrent.futures import ThreadPoolExecutor
EPS=["https://maps.mail.ru/osm/tools/overpass/api/interpreter",
     "https://overpass.kumi.systems/api/interpreter",
     "https://overpass-api.de/api/interpreter",
     "https://overpass.private.coffee/api/interpreter"]
C=[("Chicago",41.8781,-87.6298),("SanFrancisco",37.7749,-122.4194),("Toronto",43.6532,-79.3832),
   ("Brussels",50.8503,4.3517),("Amsterdam",52.3676,4.9041),("Vienna",48.2082,16.3738),
   ("Budapest",47.4979,19.0402),("Belgrade",44.7866,20.4489),("Sofia",42.6977,23.3219),
   ("Tunis",36.8065,10.1815),("Algiers",36.7538,3.0588),("Khartoum",15.5007,32.5599),
   ("Damascus",33.5138,36.2765),("Kabul",34.5553,69.2075),("Lahore",31.5204,74.3587),
   ("Chennai",13.0827,80.2707),("Jakarta",-6.2088,106.8456),("Bangkok",13.7563,100.5018),
   ("Medellin",6.2442,-75.5812),("Santiago",-33.4489,-70.6693)]
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
                    json.dump(OUT,open("raw_world5.json","w"))
                print(n,len(OUT[n]),flush=True); return
        except Exception: pass
        time.sleep(5)
    print("FAIL",n,flush=True)
with ThreadPoolExecutor(max_workers=4) as ex: list(ex.map(job,C))
json.dump(OUT,open("raw_world5.json","w"))
print("DONE",sum(len(v) for v in OUT.values()),flush=True)
