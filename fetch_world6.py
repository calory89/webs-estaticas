import json,time,subprocess,threading
from concurrent.futures import ThreadPoolExecutor
EPS=["https://maps.mail.ru/osm/tools/overpass/api/interpreter",
     "https://overpass.kumi.systems/api/interpreter",
     "https://overpass-api.de/api/interpreter",
     "https://overpass.private.coffee/api/interpreter"]
C=[("CapeTown",-33.9249,18.4241),("Durban",-29.8587,31.0218),("Alexandria",31.2001,29.9187),
   ("Luanda",-8.8390,13.2894),("Maputo",-25.9692,32.5732),("Harare",-17.8252,31.0335),
   ("Lusaka",-15.3875,28.3228),("Kigali",-1.9441,30.0619),("Douala",4.0511,9.7679),
   ("Ouagadougou",12.3714,-1.5197),("Conakry",9.6412,-13.5784),("Antananarivo",-18.8792,47.5079),
   ("Kathmandu",27.7172,85.3240),("Colombo",6.9271,79.8612),("Yangon",16.8661,96.1951),
   ("PhnomPenh",11.5564,104.9282),("Hanoi",21.0278,105.8342),("HoChiMinh",10.8231,106.6297),
   ("KualaLumpur",3.1390,101.6869),("Ulaanbaatar",47.8864,106.9057),("Tashkent",41.2995,69.2401)]
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
                    json.dump(OUT,open("raw_world6.json","w"))
                print(n,len(OUT[n]),flush=True); return
        except Exception: pass
        time.sleep(5)
    print("FAIL",n,flush=True)
with ThreadPoolExecutor(max_workers=4) as ex: list(ex.map(job,C))
json.dump(OUT,open("raw_world6.json","w"))
print("DONE",sum(len(v) for v in OUT.values()),flush=True)
