# Codigo ISO de las ciudades que ya estaban: los nombres de pais se escribieron
# en el idioma local ("Maroc", "Türkiye") y no se pueden comparar con los que
# devuelve Nominatim en ingles. Se resuelve por coordenadas, no por nombre.
import json, os, re, subprocess, time
src=open('build.py',encoding='utf-8').read()
w=src[src.index('WORLD = ['):src.index('# Las 300 ciudades nuevas')]
rows=[(m.group(1), float(m.group(3)), float(m.group(4)))
      for m in re.finditer(r'\(\s*"([^"]+)"\s*,\s*"([^"]*)"\s*,\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*,\s*"[^"]+"\s*\)', w)]
print('ciudades legacy:',len(rows),flush=True)
out = json.load(open('legacy_cc.json')) if os.path.exists('legacy_cc.json') else {}
for i,(n,la,lo) in enumerate(rows):
    k='%.4f,%.4f'%(la,lo)
    if k in out: continue
    url=('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=3&accept-language=en&lat=%s&lon=%s'%(la,lo))
    for _ in range(3):
        try:
            r=subprocess.run(['curl','-s','-m','25','-A','SupportNear/1.0 (rrppspain@gmail.com)',url],capture_output=True)
            a=json.loads(r.stdout.decode('utf-8','ignore')).get('address',{})
            cc=(a.get('country_code') or '').upper()
            if cc:
                out[k]={'cc':cc,'country':a.get('country') or ''}
                break
        except Exception: pass
        time.sleep(2)
    if i%25==0:
        json.dump(out,open('legacy_cc.json','w'),ensure_ascii=False); print(i,n,out.get(k),flush=True)
    time.sleep(1.1)
json.dump(out,open('legacy_cc.json','w'),ensure_ascii=False)
print('DONE',len(out),flush=True)
