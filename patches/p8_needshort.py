# -*- coding: utf-8 -*-
"""Ronda 17: etiquetas cortas (una palabra) para las pastillas del cajon, en los
20 idiomas. La frase larga queda como aria-label y title."""
import io, sys
F='index.template.html'; s=io.open(F,encoding='utf-8').read()
SH={'en':('Eat','Sleep','Shower'),'es':('Comer','Dormir','Ducharme'),'fr':('Manger','Dormir','Se laver'),'ar':('أكل','نوم','استحمام'),
'uk':('Їжа','Ночівля','Душ'),'ro':('Mâncare','Dormit','Duș'),'pl':('Jedzenie','Nocleg','Prysznic'),'ru':('Еда','Ночлег','Душ'),
'pt':('Comer','Dormir','Banho'),'ur':('کھانا','سونا','نہانا'),'fa':('غذا','خواب','دوش'),'wo':('Lekk','Fanaan','Sangu'),
'bm':('Dumuni','Sunɔgɔ','Ko'),'ti':('መግቢ','ምድቃስ','ሻወር'),'ps':('خواړه','خوب','لمبل'),'so':('Cunto','Hurdo','Qubeys'),
'am':('ምግብ','መኝታ','ሻወር'),'tr':('Yemek','Uyku','Duş'),'bn':('খাবার','ঘুম','গোসল'),'zh':('吃饭','睡觉','洗澡')}
def rep(a,b):
    global s
    if s.count(a)!=1: sys.exit('NO ENCONTRADO: '+a[:100])
    s=s.replace(a,b)
for l,(e,sl,w) in SH.items():
    rep('\nT.%s = {\n' % l, '\nT.%s = {\n  "need.eat.s":"%s",\n  "need.sleep.s":"%s",\n  "need.wash.s":"%s",\n' % (l,e,sl,w))
rep("""+'<span class="need-ic">'+svg(n.cat)+'</span><span class="need-l">'+esc(t(n.key))+'</span></button>').join('')""",
    """+'<span class="need-ic">'+svg(n.cat)+'</span><span class="need-l">'+esc(t(n.key+'.s',null,true)||t(n.key))+'</span></button>').join('')""")
rep("""NEED.filter(n=>n.cat!=='sos').map(n=>'<button type="button" class="need-b" data-need="'+n.cat+'" style""",
    """NEED.filter(n=>n.cat!=='sos').map(n=>'<button type="button" class="need-b" data-need="'+n.cat+'" title="'+esc(t(n.key))+'" style""")
io.open(F,'w',encoding='utf-8').write(s); print('p8 ok')
