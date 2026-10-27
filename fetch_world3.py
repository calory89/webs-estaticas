import json,time,subprocess,threading
from concurrent.futures import ThreadPoolExecutor
EPS=["https://maps.mail.ru/osm/tools/overpass/api/interpreter",
     "https://overpass.kumi.systems/api/interpreter",
     "https://overpass-api.de/api/interpreter",
     "https://overpass.private.coffee/api/interpreter"]
C=[("Bucharest",44.4268,26.1025),("Moscow",55.7558,37.6173),("RioDeJaneiro",-22.9068,-43.1729),
   ("Karachi",24.8607,67.0011),("Tehran",35.6892,51.3890),("Dakar",14.7167,-17.4677),
   ("Bamako",12.6392,-8.0029),("Delhi",28.6139,77.2090),("Manila",14.5995,120.9842),("Lagos",6.5244,3.3792)]
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
                    json.dump(OUT,open("raw_world3.json","w"))
                print(n,len(OUT[n]),flush=True); return
        except Exception: pass
        time.sleep(5)
    print("FAIL",n,flush=True)
with ThreadPoolExecutor(max_workers=4) as ex: list(ex.map(job,C))
json.dump(OUT,open("raw_world3.json","w"))
print("DONE",sum(len(v) for v in OUT.values()),flush=True)
