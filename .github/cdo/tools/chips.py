import os,re,json,html,collections
D=json.load(open('/home/claude/tools/data.json')); P=D['posts']
A=json.load(open('/home/claude/tools/archives.json'))
CATN={c:v['name'] for c,v in A['cat'].items()}; CNT={c:v['n'] for c,v in A['cat'].items()}
REG={'europa','asia','america','africa','oceania'}; NT={'emprender','digital-nomad','puntos-y-millas','episodios','episodes','consejos','1'}
def spec(r):
    cs=[c for c in r['cats'] if c in CATN and c not in REG and c not in NT]; cs.sort(key=lambda c:CNT[c])
    if cs: return CATN[cs[0]]
    cs=[c for c in r['cats'] if c in CATN]; return CATN[cs[0]] if cs else None
st=collections.Counter()
def fix(c):
    m=re.search(r'class="stretch" href="https://www\.carlosdeory\.com(/[^"]*)"',c)
    if not m or m.group(1) not in P: return c
    n=spec(P[m.group(1)])
    if not n: return c
    c2=re.sub(r'<span class="chip on-photo">[^<]*</span>',f'<span class="chip on-photo">{html.escape(n)}</span>',c,count=1)
    if c2!=c: st['chip']+=1
    return c2
for u in P:
    if P[u].get('card'): P[u]['card']=fix(P[u]['card'])
json.dump(D,open('/home/claude/tools/data.json','w'),ensure_ascii=False)
for d,_,fs in os.walk('.'):
    if '.git' in d: continue
    for f in fs:
        if not f.endswith('.html'): continue
        p=os.path.join(d,f); h=open(p,errors='ignore').read()
        h2=re.sub(r'<article class="card[^"]*".*?</article>',lambda m:fix(m.group(0)),h,flags=re.S)
        if h2!=h: open(p,'w').write(h2); st['files']+=1
print(dict(st))
