import json,time,subprocess,threading
from concurrent.futures import ThreadPoolExecutor
EPS=["https://maps.mail.ru/osm/tools/overpass/api/interpreter",
     "https://overpass.kumi.systems/api/interpreter",
     "https://overpass-api.de/api/interpreter",
     "https://overpass.private.coffee/api/interpreter"]
C=[("Mumbai",19.0760,72.8777),("Kolkata",22.5726,88.3639),("Dhaka",23.8103,90.4125),
   ("Kinshasa",-4.4419,15.2663),("AddisAbaba",9.0320,38.7469),("Accra",5.6037,-0.1870),
   ("Abidjan",5.3600,-4.0083),("Kampala",0.3476,32.5825),("DarEsSalaam",-6.7924,39.2083),
   ("Amman",31.9454,35.9284),("Beirut",33.8938,35.5018),("Baghdad",33.3152,44.3661),
   ("Caracas",10.4806,-66.9036),("GuatemalaCity",14.6349,-90.5069),("PortAuPrince",18.5944,-72.3074),
   ("SantoDomingo",18.4861,-69.9312),("Quito",-0.1807,-78.4678),("Naples",40.8518,14.2681),
   ("Marseille",43.2965,5.3698),("LosAngeles",34.0522,-118.2437)]
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
                    json.dump(OUT,open("raw_world4.json","w"))
                print(n,len(OUT[n]),flush=True); return
        except Exception: pass
        time.sleep(5)
    print("FAIL",n,flush=True)
with ThreadPoolExecutor(max_workers=4) as ex: list(ex.map(job,C))
json.dump(OUT,open("raw_world4.json","w"))
print("DONE",sum(len(v) for v in OUT.values()),flush=True)
