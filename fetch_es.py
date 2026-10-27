import json,time,subprocess,threading
from concurrent.futures import ThreadPoolExecutor
EPS=["https://maps.mail.ru/osm/tools/overpass/api/interpreter",
     "https://overpass.kumi.systems/api/interpreter",
     "https://overpass-api.de/api/interpreter",
     "https://overpass.private.coffee/api/interpreter"]
lock=threading.Lock(); OUT={}
def save():
    with lock: json.dump(OUT,open("raw_nat.json","w"))
def run(q,tag,tries=10):
    for k in range(tries):
        ep=EPS[k%len(EPS)]
        try:
            o=subprocess.run(["curl","-sG","-m","280",ep,"--data-urlencode","data="+q],capture_output=True)
            t=o.stdout.decode('utf-8','ignore')
            if t.strip().startswith("{"):
                els=json.loads(t).get("elements",[])
                with lock: OUT[tag]=els
                save(); print(tag,len(els),flush=True); return els
        except Exception as e: pass
        time.sleep(6)
    print("FAIL",tag,flush=True)
    with lock: OUT.setdefault(tag,[])
    return []

A='[out:json][timeout:280];area["ISO3166-1"="ES"][admin_level=2]->.a;'
JOBS=[
 ("social_facility", A+'nwr["social_facility"](area.a);out center tags;'),
 ("amenities",       A+'nwr["amenity"~"^(shower|public_bath|refugee_site|food_sharing|give_box|social_centre)$"](area.a);out center tags;'),
 ("orgs",            A+'(nwr["shop"="charity"](area.a);nwr["office"="ngo"](area.a););out center tags;'),
 ("hospital",        A+'nwr["amenity"="hospital"](area.a);out center tags;'),
 ("healthcentre",    A+'(nwr["healthcare"="centre"](area.a);nwr["amenity"="doctors"]["healthcare"](area.a););out center tags;'),
 ("named",           A+'(nwr["name"~"C[áa]ritas|Cruz Roja|Creu Roja|Banco de Alimentos|Banc dels Aliments|Comedor [Ss]ocial|Menjador [Ss]ocial|Albergue|Casa de Acogida|Centro de Acogida|Ropero|Roper[ií]a|Economato [Ss]ocial",i](area.a);'
                       'nwr["operator"~"C[áa]ritas|Cruz Roja|Creu Roja|Banco de Alimentos",i](area.a);'
                       'nwr["social_facility:for"~"homeless|homless"](area.a););out center tags 8000;'),
]
CITIES=[("Madrid",40.4168,-3.7038),("Barcelona",41.3874,2.1686),("Valencia",39.4699,-0.3763),
 ("Sevilla",37.3891,-5.9845),("Zaragoza",41.6488,-0.8891),("Malaga",36.7213,-4.4213),
 ("Murcia",37.9922,-1.1307),("Palma",39.5696,2.6502),("LasPalmas",28.1235,-15.4363),
 ("Bilbao",43.2630,-2.9350),("Alicante",38.3452,-0.4810),("Cordoba",37.8882,-4.7794),
 ("Valladolid",41.6523,-4.7245),("Vigo",42.2406,-8.7207),("Gijon",43.5322,-5.6611),
 ("Vitoria",42.8467,-2.6716),("Coruna",43.3623,-8.4115),("Granada",37.1773,-3.5986),
 ("Elche",38.2699,-0.7126),("Oviedo",43.3619,-5.8494),("Badalona",41.4500,2.2474),
 ("Cartagena",37.6257,-0.9966),("Terrassa",41.5610,2.0089),("Jerez",36.6866,-6.1367),
 ("Sabadell",41.5433,2.1094),("Mostoles",40.3223,-3.8649),("SantaCruz",28.4636,-16.2518),
 ("Pamplona",42.8125,-1.6458),("Almeria",36.8340,-2.4637),("Donostia",43.3183,-1.9812),
 ("Santander",43.4623,-3.8100),("Castellon",39.9864,-0.0513),("Burgos",42.3439,-3.6969),
 ("Albacete",38.9942,-1.8585),("Salamanca",40.9701,-5.6635),("Logrono",42.4627,-2.4450),
 ("Huelva",37.2614,-6.9447),("Lleida",41.6176,0.6200),("Tarragona",41.1189,1.2445),
 ("Leon",42.5987,-5.5671)]
def city(c):
    n,la,lo=c
    q=f'[out:json][timeout:200];(nwr["amenity"="drinking_water"](around:3500,{la},{lo});nwr["amenity"="toilets"]["fee"="no"](around:3500,{la},{lo});nwr["amenity"="library"](around:6000,{la},{lo}););out center tags;'
    run(q,"city:"+n,6)
with ThreadPoolExecutor(max_workers=4) as ex:
    futs=[ex.submit(run,q,t) for t,q in JOBS]
    list(ex.map(city,CITIES))
    for f in futs: f.result()
save()
print("DONE", sum(len(v) for v in OUT.values()), flush=True)
