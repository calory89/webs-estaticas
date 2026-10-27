# Pais de cada ciudad candidata nueva (>200k hab.) que aun no esta en el mapa.
# Reusa lo ya resuelto en cities_cc.json; el resto va a Nominatim a 1 pet./s.
import json, math, re, subprocess, time
def pop(e):
    d=''.join(ch for ch in (e.get('tags',{}).get('population','') or '') if ch.isdigit())
    return int(d) if d else 0
def hav(a,b,c,d):
    R=6371.0;p=math.pi/180
    x=math.sin((c-a)*p/2)**2+math.cos(a*p)*math.cos(c*p)*math.sin((d-b)*p/2)**2
    return 2*R*math.asin(math.sqrt(x))
h=open('index.full.html' if __import__('os').path.exists('index.full.html') else 'index.html',encoding='utf-8').read()
CITIES=json.loads(re.search(r'const CITIES = /\*__CITIES__\*/(\[.*?\]);',h,re.S).group(1))
have=[(c[1],c[2]) for c in CITIES]
els=[e for e in json.load(open('raw_citylist2.json')) if e.get('lat') is not None]
els.sort(key=pop, reverse=True)
known={}
import os
for f in ('cities_cc.json','cities_cc2.json'):
    if os.path.exists(f):
        for c in json.load(open(f)):
            if c.get('cc'): known[(round(c['lat'],2),round(c['lon'],2))]=c
cand=[]
for e in els:
    la,lo=e['lat'],e['lon']
    if any(hav(la,lo,a,b)<40 for a,b in have): continue
    if any(hav(la,lo,c['lat'],c['lon'])<40 for c in cand): continue
    t=e['tags']
    cand.append({'lat':round(la,5),'lon':round(lo,5),'name':t.get('name',''),'en':t.get('name:en',''),'pop':pop(e),
                 'cc':(t.get('ISO3166-2','')[:2] or '').upper() if t.get('ISO3166-2') else '', 'country':''})
print('candidatas:',len(cand),flush=True)
out=[]
for i,c in enumerate(cand):
    k=(round(c['lat'],2),round(c['lon'],2))
    if k in known and known[k].get('cc'):
        c['cc']=known[k]['cc']; c['country']=known[k].get('country',''); out.append(c); continue
    if c['cc'] and i>900:   # con ISO3166-2 nos vale para las de la cola; las primeras 900 se confirman
        out.append(c); continue
    url=('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=3&accept-language=en&lat=%s&lon=%s'%(c['lat'],c['lon']))
    cc=country=''
    for k2 in range(3):
        try:
            r=subprocess.run(['curl','-s','-m','25','-A','SupportNear/1.0 (rrppspain@gmail.com)',url],capture_output=True)
            j=json.loads(r.stdout.decode('utf-8','ignore')); a=j.get('address',{})
            cc=(a.get('country_code') or '').upper(); country=a.get('country') or ''
            if cc: break
        except Exception: pass
        time.sleep(2)
    c['cc']=cc or c['cc']; c['country']=country
    out.append(c)
    if i%50==0:
        json.dump(out,open('cities_cc2.json','w'),ensure_ascii=False); print(i,c.get('en') or c['name'],cc,flush=True)
    time.sleep(1.05)
json.dump(out,open('cities_cc2.json','w'),ensure_ascii=False)
print('DONE',len(out),flush=True)
