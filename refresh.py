# -*- coding: utf-8 -*-
# Refresco mensual con red de seguridad: baja el planeta a un fichero nuevo y solo
# sustituye al viejo si ha llegado casi entero (>=95 % de las celdas). Presupuesto
# de tiempo en horas (por defecto 5). Despues reconstruye todo y deja un resumen.
import json, os, subprocess, sys, time, shutil
BUDGET_H = float(os.environ.get('REFRESH_HOURS', '5'))
t0 = time.time()
old = 'raw_planet.json'; new = 'raw_planet.new.json'
if os.path.exists(new): os.remove(new)
# fetch_planet.py escribe en raw_planet.json: se le engana con un enlace temporal
bak = None
if os.path.exists(old):
    bak = old + '.prev'; shutil.copy(old, bak); os.remove(old)
n_old = len(json.load(open(bak))) if bak else 0
try:
    while time.time() - t0 < BUDGET_H * 3600:
        r = subprocess.run(['timeout', '600', 'python3', 'fetch_planet.py'], capture_output=True, text=True)
        done = 'LISTO' in r.stdout
        if done: break
finally:
    got = json.load(open(old)) if os.path.exists(old) else {}
    print('celdas nuevas:', len(got), '| antes:', n_old, '| horas:', round((time.time() - t0) / 3600, 2))
    if bak and len(got) < 0.95 * max(n_old, 1):
        # incompleto: mezcla (celda nueva si la hay, vieja si no) para no perder nada
        prev = json.load(open(bak)); prev.update(got); json.dump(prev, open(old, 'w'))
        print('refresco parcial: se mezclan', len(got), 'celdas nuevas con', n_old - len(got), 'viejas')
# build.py va dos veces a proposito: la primera deja d/ escrito, hours_crawl.py
# lee de ahi que sitios tienen web y no tienen horario y sale a buscarlos, y la
# segunda los mete dentro. Sin la segunda pasada el horario se queda en el CSV.
for step in ['fetch_meta.py', 'build.py', 'hours_crawl.py', 'build.py', 'social.py', 'pages.py', 'city_pages.py', 'changes_page.py', 'about_page.py', 'indexnow.py']:
    if not os.path.exists(step): continue
    cmd = ['timeout', '3600', 'python3', step]
    if step == 'hours_crawl.py': cmd += ['--cats', 'food,shelter,clothes,health']
    r = subprocess.run(cmd, capture_output=True, text=True)
    print('==', step, r.returncode, (r.stdout.strip().splitlines() or [''])[-1][:160])
os.makedirs('_out', exist_ok=True)
for z, d in (('_out/d.zip', 'd'), ('_out/l.zip', 'l'), ('_out/c.zip', 'c'), ('_out/t.zip', 't')):
    if os.path.exists(z): os.remove(z)
    subprocess.run(['zip', '-qr', os.path.abspath(z), '.'], cwd=d)
print('LISTO PARA PUBLICAR: index.html sw.js sitemap.xml social.png cambios.html + _out/{d,l,c,t}.zip')
