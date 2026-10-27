import json,time,subprocess,threading
from concurrent.futures import ThreadPoolExecutor
EPS=["https://maps.mail.ru/osm/tools/overpass/api/interpreter",
     "https://overpass.kumi.systems/api/interpreter",
     "https://overpass-api.de/api/interpreter",
     "https://overpass.private.coffee/api/interpreter"]
def run(q,tag,tries=8):
    for k in range(tries):
        ep=EPS[k%len(EPS)]
        try:
            o=subprocess.run(["curl","-sG","-m","110",ep,"--data-urlencode","data="+q],capture_output=True)
            txt=o.stdout.decode('utf-8','ignore')
            if txt.strip().startswith("{"):
                els=json.loads(txt).get("elements",[])
                print(tag,len(els),flush=True); return els
        except Exception: pass
        time.sleep(4)
    print("FAIL",tag,flush=True); return []

NAT = ('[out:json][timeout:180];area["ISO3166-1"="ES"][admin_level=2]->.a;('
  'nwr["name"~"Cáritas|Caritas|Cruz Roja|Banco de Alimentos|Comedor [Ss]ocial|Albergue|Casa de Acogida|Centro de Acogida|Ropero|Ropería",i](area.a);'
  'nwr["operator"~"Cáritas|Caritas|Cruz Roja|Banco de Alimentos",i](area.a);'
  'nwr["social_facility:for"~"homeless|homless"](area.a);'
  ');out center tags 6000;')

CITIES=[("Madrid",40.4168,-3.7038,10000),("Barcelona",41.3874,2.1686,8000),
 ("Valencia",39.4699,-0.3763,8000),("Sevilla",37.3891,-5.9845,8000),
 ("Zaragoza",41.6488,-0.8891,8000),("Malaga",36.7213,-4.4213,8000),
 ("Murcia",37.9922,-1.1307,8000),("Palma",39.5696,2.6502,7000),
 ("LasPalmas",28.1235,-15.4363,7000),("Bilbao",43.2630,-2.9350,7000)]
def qhealth(lat,lon,r):
    a=f"(around:{r},{lat},{lon})"
    return f'[out:json][timeout:90];(nwr["amenity"="hospital"]{a};nwr["amenity"="clinic"]{a};nwr["office"="lawyer"]{a};nwr["amenity"="community_centre"]{a};);out center tags;'
res={}
lock=threading.Lock()
def job(c):
    n,la,lo,r=c
    e=run(qhealth(la,lo,r),"H-"+n)
    with lock:
        res[n]=e; json.dump(res,open("raw_es2.json","w"))
with ThreadPoolExecutor(max_workers=4) as ex:
    fut=ex.submit(run,NAT,"NATIONAL",10)
    list(ex.map(job,CITIES))
    nat=fut.result()
res["_NATIONAL"]=nat
json.dump(res,open("raw_es2.json","w"))
print("DONE", sum(len(v) for v in res.values()),flush=True)
