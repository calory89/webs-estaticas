# Pais de cada ciudad candidata, via Nominatim a 1 peticion/segundo (su limite).
import json, math, re, subprocess, time
def pop(e):
    d=''.join(ch for ch in (e.get('tags',{}).get('population','') or '') if ch.isdigit())
    return int(d) if d else 0
def hav(a,b,c,d):
    R=6371.0;p=math.pi/180
    x=math.sin((c-a)*p/2)**2+math.cos(a*p)*math.cos(c*p)*math.sin((d-b)*p/2)**2
    return 2*R*math.asin(math.sqrt(x))

els=[e for e in json.load(open('raw_citylist.json')) if e.get('lat') is not None]
src=open('build.py',encoding='utf-8').read()
have=[]
for m in re.finditer(r'\(\s*"([^"]+)"\s*,\s*"([^"]*)"\s*,\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*,\s*"[^"]+"\s*\)', src):
    have.append((float(m.group(3)), float(m.group(4))))
for m in re.finditer(r'\("([^"]+)","([^"]*)",(-?\d+\.\d+),(-?\d+\.\d+)\)', src):
    have.append((float(m.group(3)), float(m.group(4))))

els.sort(key=pop, reverse=True)
cand=[]
for e in els:
    la,lo=e['lat'],e['lon']
    if any(hav(la,lo,a,b)<45 for a,b in have): continue
    if any(hav(la,lo,c['lat'],c['lon'])<45 for c in cand): continue
    t=e['tags']
    cand.append({'lat':round(la,5),'lon':round(lo,5),'name':t.get('name',''),
                 'en':t.get('name:en',''),'pop':pop(e)})
print('candidatas:',len(cand),flush=True)

out=[]
for i,c in enumerate(cand):
    url=('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=3&accept-language=en'
         '&lat=%s&lon=%s'%(c['lat'],c['lon']))
    cc=country=''
    for k in range(3):
        try:
            r=subprocess.run(['curl','-s','-m','25','-A','SupportNear/1.0 (rrppspain@gmail.com)',url],
                             capture_output=True)
            j=json.loads(r.stdout.decode('utf-8','ignore'))
            a=j.get('address',{})
            cc=(a.get('country_code') or '').upper(); country=a.get('country') or ''
            if cc: break
        except Exception: pass
        time.sleep(2)
    c['cc']=cc; c['country']=country
    out.append(c)
    if i%50==0:
        json.dump(out,open('cities_cc.json','w'),ensure_ascii=False)
        print(i,c.get('en') or c['name'],cc,flush=True)
    time.sleep(1.1)
json.dump(out,open('cities_cc.json','w'),ensure_ascii=False)
print('DONE',len(out),flush=True)
