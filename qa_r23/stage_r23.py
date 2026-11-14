# -*- coding: utf-8 -*-
"""Arbol que se publica en la R23: work_osm recien construido + lo que esta en vivo y no se regenera.
   python3 stage_r23.py"""
import json, os, shutil, subprocess, sys
SN='/home/claude/sn'; W=SN+'/work_osm'; S=SN+'/stage_r23'; D=S+'/_s/supportnear.com/'; OLD=SN+'/stage_r22/_s/supportnear.com/'
HERE=os.path.dirname(os.path.abspath(__file__))
live=json.load(open(HERE+'/../r22/live_r22b.json'))
shutil.rmtree(S,ignore_errors=True); os.makedirs(S+'/_worker.js'); os.makedirs(D)
shutil.copy(SN+'/stage_r22/_worker.js/index.js', S+'/_worker.js/index.js')
miss=[]
for rel in live:
    src=None
    if os.path.exists(W+'/'+rel) and rel not in ('llms.txt','robots.txt'): src=W+'/'+rel
    elif os.path.exists(OLD+rel): src=OLD+rel
    if src:
        os.makedirs(os.path.dirname(D+rel) or D,exist_ok=True); shutil.copyfile(src,D+rel)
    else: miss.append(rel)
for top in ('c','d','t','a','tw','l'):
    os.makedirs(D+top,exist_ok=True)
    for f in os.listdir(W+'/'+top):
        if os.path.isfile(W+'/'+top+'/'+f) and not os.path.exists(D+top+'/'+f): shutil.copyfile(W+'/'+top+'/'+f,D+top+'/'+f)
print('en vivo',len(live),'| sin fuente',len(miss),miss[:8])
for k in (1,2):
    r=subprocess.run(['python3',SN+'/qa/live_fix/patch_live.py',S],capture_output=True,text=True)
    print('pasada',k,[l for l in r.stdout.splitlines() if 'files changed' in l or 'worker' in l], r.stderr[-400:])
r=subprocess.run(['python3',SN+'/tools/finish_sw.py',D],capture_output=True,text=True); print(r.stdout.strip(), r.stderr[-300:])
