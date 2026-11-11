# -*- coding: utf-8 -*-
"""Arbol que se publica en la R22: work_osm + lo que ya esta en vivo y no se regenera.
   python3 stage_r22.py [worker.js]   (worker = el que esta en vivo, ya con el cambio de la R22)"""
import json, os, shutil, hashlib, subprocess, re, sys
SN='/home/claude/sn'; W=SN+'/work_osm'; S=SN+'/stage_r22'; D=S+'/_s/supportnear.com/'; OLD=SN+'/stage_r21/_s/supportnear.com/'
HERE=os.path.dirname(os.path.abspath(__file__))
live=json.load(open('/tmp/claude-0/live_r20.json'))
M21=json.load(open('/tmp/claude-0/pub21/manifest.json'))
for r,s in M21['changed'].items(): live[r]=s
for r in M21['delete']: live.pop(r,None)
json.dump(live,open(HERE+'/live_r21.json','w'))
shutil.rmtree(S,ignore_errors=True); os.makedirs(S+'/_worker.js'); os.makedirs(D)
shutil.copy(sys.argv[1] if len(sys.argv)>1 else SN+'/worker_r22.js', S+'/_worker.js/index.js')
miss=[]
for rel in live:
    src=None
    if os.path.exists(W+'/'+rel) and rel not in ('llms.txt','robots.txt'): src=W+'/'+rel
    elif os.path.exists(OLD+rel): src=OLD+rel
    if src:
        os.makedirs(os.path.dirname(D+rel) or D,exist_ok=True); shutil.copyfile(src,D+rel)
    else: miss.append(rel)
for top in ('c','d','t','a','tw'):
    os.makedirs(D+top,exist_ok=True)
    for f in os.listdir(W+'/'+top):
        if not os.path.exists(D+top+'/'+f): shutil.copyfile(W+'/'+top+'/'+f,D+top+'/'+f)
print('en vivo',len(live),'| sin fuente',len(miss),miss[:8])
for k in (1,2):
    r=subprocess.run(['python3',SN+'/qa/live_fix/patch_live.py',S],capture_output=True,text=True)
    print('pasada',k,[l for l in r.stdout.splitlines() if 'files changed' in l or 'worker' in l], r.stderr[-400:])
r=subprocess.run(['python3',SN+'/tools/finish_sw.py',D],capture_output=True,text=True); print(r.stdout.strip(), r.stderr[-300:])
