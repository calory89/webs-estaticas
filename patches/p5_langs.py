import io,json,re
p='/home/claude/supportnear/index.template.html'; s=io.open(p,encoding='utf-8').read()
NL='/tmp/claude-0/-home-claude/c68e587c-e18a-57a7-a2c7-85e43169e67c/scratchpad/newlang/'
NEW=['ti','ps','so','am','tr','bn','zh']
D={c:json.load(open(NL+c+'.json',encoding='utf-8')) for c in NEW}
def span(name):
    m=re.search(r'const %s = \{'%name,s); i=m.end()-1; d=0
    for j in range(i,len(s)):
        if s[j]=='{': d+=1
        elif s[j]=='}':
            d-=1
            if d==0: return i,j+1
# 1) T.xx bloques, antes de la tabla SUB
anchor='\n/* ---------------- what they actually give you ---------------- */'
assert s.count(anchor)==1
blocks=''
for c in NEW:
    assert ('\nT.%s = {'%c) not in s, c
    T=D[c]['T']
    blocks+='\nT.%s = {\n'%c + ',\n'.join('  %s:%s'%(json.dumps(k),json.dumps(v,ensure_ascii=False)) for k,v in T.items()) + '\n};\n'
s=s.replace(anchor, blocks+anchor)
# 2) SUB, LBL, FOR_LBL
for name,key in [('SUB','SUB'),('LBL','LBL'),('FOR_LBL','FOR_LBL')]:
    a,b=span(name)
    add=''.join(',\n %s:%s'%(c,json.dumps(D[c][key],ensure_ascii=False)) for c in NEW)
    s=s[:b-1].rstrip()+add+'\n'+s[b-1:]
# 3) SYN (JSON en una linea)
i=s.find('const SYN = '); j=s.find(';\n',i); syn=json.loads(s[i+12:j])
for c in NEW: syn[c]={k.lower():v for k,v in D[c]['SYN'].items() if v in ['food','shelter','hygiene','clothes','social','legal','health','water','warm']}
s=s[:i+12]+json.dumps(syn,ensure_ascii=False)+s[j:]
# 4) LANGS
L=''.join(",\n  {code:'%s', name:%s, native:%s%s}"%(c,json.dumps(D[c]['meta']['name']),json.dumps(D[c]['meta']['native'],ensure_ascii=False),', rtl:true' if D[c]['meta'].get('rtl') else '') for c in NEW)
s=s.replace("  {code:'bm', name:'Bambara',   native:'Bamanankan'}\n];","  {code:'bm', name:'Bambara',   native:'Bamanankan'}"+L+"\n];")
assert "code:'zh'" in s
# 5) voces
s=s.replace("wo:'fr-FR',bm:'fr-FR'};\nfunction canSpeak","wo:'fr-FR',bm:'fr-FR',ti:'ti-ER',ps:'ps-AF',so:'so-SO',am:'am-ET',tr:'tr-TR',bn:'bn-BD',zh:'zh-CN'};\nfunction canSpeak")
assert "ti:'ti-ER'" in s
# 6) tipografias del sistema para cada escritura
css='''html[lang="ar"]{--ui:'Noto Sans Arabic','Geeza Pro','Segoe UI',system-ui,sans-serif;--display:'Noto Sans Arabic','Geeza Pro',serif;}'''
assert s.count(css)==1
s=s.replace(css, css+'''
html[lang="ps"],html[lang="fa"],html[lang="ur"]{--ui:'Noto Sans Arabic','Noto Naskh Arabic','Geeza Pro','Segoe UI',system-ui,sans-serif;--display:var(--ui)}
html[lang="am"],html[lang="ti"]{--ui:'Noto Sans Ethiopic','Abyssinica SIL','Nyala','Kefa',system-ui,sans-serif;--display:var(--ui)}
html[lang="bn"]{--ui:'Noto Sans Bengali','Hind Siliguri','Vrinda','Shonar Bangla',system-ui,sans-serif;--display:var(--ui)}
html[lang="zh"]{--ui:system-ui,-apple-system,'PingFang SC','Microsoft YaHei','Noto Sans SC',sans-serif;--display:var(--ui)}''')
io.open(p,'w',encoding='utf-8').write(s); print('p5 ok')
