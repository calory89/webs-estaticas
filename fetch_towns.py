# Poblaciones de 10.000 habitantes o mas con nombre, para buscar el pueblo de uno
# sin conexion (las 1.221 ciudades del mapa dejan fuera al 42 % de los sitios).
import json, subprocess, time, os
EPS=["https://maps.mail.ru/osm/tools/overpass/api/interpreter","https://overpass.kumi.systems/api/interpreter"]
OUT='raw_towns10k.json'; got=json.load(open(OUT)) if os.path.exists(OUT) else {}
bands=[(s,s+15) for s in range(-60,90,15)]
# la banda 45-60 (Europa central + Rusia) es la mas densa: se parte en 8 franjas de longitud
bands=[b for b in bands if b!=(45,60)]+[(45,60,w,w+45) for w in range(-180,180,45) if w!=-90]+[(45,60,-90,-70),(45,60,-70,-45)]
for b in bands:
    s,n=b[0],b[1]; w,e=(b[2],b[3]) if len(b)>2 else (-180,180)
    k='%d_%d_%d'%(s,n,w) if len(b)>2 else '%d_%d'%(s,n)
    if k in got: continue
    q='[out:json][timeout:170];node[place~"^(city|town)$"]["population"~"^[0-9]{5,}$"](%d,%d,%d,%d);out tags center;'%(s,w,n,e)
    for ep in EPS:
        o=subprocess.run(['curl','-sG','-m','200',ep,'--data-urlencode','data='+q],capture_output=True)
        t=o.stdout.decode('utf-8','ignore')
        if t.strip().startswith('{'):
            j=json.loads(t); els=j.get('elements',[])
            if els or not j.get('remark'):
                got[k]=[[e.get('tags',{}).get('name',''),e.get('tags',{}).get('name:en',''),round(e.get("lat",(e.get("center") or {}).get("lat",0)),4),round(e.get("lon",(e.get("center") or {}).get("lon",0)),4),e['tags'].get('population',''),e['tags'].get('is_in:country_code','') or e['tags'].get('addr:country','')] for e in els if e.get('tags',{}).get('name') and (e.get('lat') or e.get('center'))]
                json.dump(got,open(OUT,'w'),ensure_ascii=False); print(k,len(got[k]),flush=True); break
        print('fail',k,ep.split('/')[2],t[:80].replace('\n',' '),flush=True); time.sleep(5)
print('total',sum(len(v) for v in got.values()))
