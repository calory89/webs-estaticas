import json, time, subprocess, os, threading
from concurrent.futures import ThreadPoolExecutor

CITIES = [
 ("Madrid",40.4168,-3.7038,10000),("Barcelona",41.3874,2.1686,8000),
 ("Valencia",39.4699,-0.3763,8000),("Sevilla",37.3891,-5.9845,8000),
 ("Zaragoza",41.6488,-0.8891,8000),("Malaga",36.7213,-4.4213,8000),
 ("Murcia",37.9922,-1.1307,8000),("Palma",39.5696,2.6502,7000),
 ("LasPalmas",28.1235,-15.4363,7000),("Bilbao",43.2630,-2.9350,7000),
]
EPS=["https://maps.mail.ru/osm/tools/overpass/api/interpreter",
     "https://overpass.kumi.systems/api/interpreter",
     "https://overpass-api.de/api/interpreter",
     "https://overpass.private.coffee/api/interpreter"]
lock=threading.Lock()
OUT={}
def qmain(lat,lon,r):
    a=f"(around:{r},{lat},{lon})"
    return ("[out:json][timeout:90];("
      f'nwr["social_facility"]{a};'
      f'nwr["amenity"~"^(shower|public_bath|refugee_site|food_sharing|give_box|social_centre)$"]{a};'
      f'nwr["shop"="charity"]{a};nwr["office"="ngo"]{a};nwr["amenity"="library"]{a};'
      ");out center tags;")
def qwater(lat,lon,r):
    a=f"(around:{r},{lat},{lon})"
    return f'[out:json][timeout:90];(nwr["amenity"="drinking_water"]{a};nwr["amenity"="toilets"]["fee"="no"]{a};);out center tags;'
def run(q,tag):
    for k in range(8):
        ep=EPS[k%len(EPS)]
        try:
            o=subprocess.run(["curl","-sG","-m","95",ep,"--data-urlencode","data="+q],capture_output=True)
            txt=o.stdout.decode('utf-8','ignore')
            if txt.strip().startswith("{"):
                return json.loads(txt).get("elements",[])
        except Exception: pass
        time.sleep(4)
    print("FAIL",tag,flush=True); return []
def job(c):
    name,lat,lon,r=c
    m=run(qmain(lat,lon,r),name+"-m")
    w=run(qwater(lat,lon,min(r,4500)),name+"-w")
    with lock:
        OUT[name]={"main":m,"water":w,"c":[lat,lon]}
        json.dump(OUT,open("raw_es.json","w"))
        print(name,len(m),len(w),flush=True)
with ThreadPoolExecutor(max_workers=4) as ex:
    list(ex.map(job,CITIES))
print("DONE", sum(len(v['main']) for v in OUT.values()), sum(len(v['water']) for v in OUT.values()),flush=True)
