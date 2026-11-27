# -*- coding: utf-8 -*-
"""Construye el blog en /home/claude/sn/stage_blog/_s/supportnear.com/blog/ y los ficheros auxiliares."""
import os, io, re, json, shutil, sys
sys.path.insert(0, os.path.dirname(__file__))
import core
from core import *
import data_fns
import articles as A
import content_es1, content_es2, content_es3, content_en, content_other

if os.path.exists(OUT): shutil.rmtree(os.path.dirname(os.path.dirname(OUT)))
os.makedirs(OUT + '/blog', exist_ok=True)

# alternates como grupos: union de los alts declarados
parent = {}
def find(x):
    while parent.setdefault(x, x) != x: x = parent[x]
    return x
for a in A.ARTS:
    for l, s in a['alts'].items(): parent[find(a['slug'])] = find(s)
groups = {}
for a in A.ARTS: groups.setdefault(find(a['slug']), []).append(a)
for g in groups.values():
    langs = {}
    for a in g:
        assert a['lang'] not in langs, ('dos del mismo idioma en un grupo', a['slug'], langs.get(a['lang']))
        langs[a['lang']] = a['slug']
    for a in g: a['alts'] = {l: s for l, s in langs.items() if s != a['slug']}

slugs = [a['slug'] for a in A.ARTS]; assert len(slugs) == len(set(slugs)), 'slug repetido'
for a in A.ARTS:
    for r in a['rel']: assert r in slugs, (a['slug'], 'rel', r)
    for l in re.findall(r'\]\(([a-z0-9\-]+)\)', a['body']):
        assert l in slugs or l in ('autor',), (a['slug'], 'enlace interno roto', l)
    write('blog/' + a['slug'], A.render(a))
write('blog/index', A.index_page())
write('blog/autor', A.author_page())
io.open(OUT + '/blog/feed.xml', 'w', encoding='utf-8').write(A.feed())
io.open(OUT + '/sitemap-blog.xml', 'w', encoding='utf-8').write(A.sitemap())

# orientador (sin datos personales, todo en el navegador)
io.open(OUT + '/blog/orientador.js', 'w', encoding='utf-8').write(r"""(function(){
var R={comer:['Comer hoy: comedores sociales','comedores-sociales-abiertos-hoy'],dormir:['Dormir esta noche: albergues y urgencias sociales','donde-dormir-esta-noche-albergues'],
medico:['Médico gratis','medico-gratis-sin-papeles'],ducha:['Duchas y lavar la ropa','duchas-gratis'],nopadron:['Empadronarte sin domicilio','empadronarse-sin-domicilio'],
nopapeles:['Sanidad sin residencia legal','medico-gratis-sin-papeles'],sinrenta:['Ingreso Mínimo Vital','ingreso-minimo-vital-como-pedirlo'],
hijos:['Cosas para bebés y prioridad para familias','ropa-y-panales-para-bebes-gratis'],mayor:['Ayuda para mayores y discapacidad','ayuda-mayores-y-discapacidad']};
var b=document.getElementById('orient-go'),o=document.getElementById('orient-out');if(!b||!o)return;
var f=document.getElementById('orient');f&&f.addEventListener('submit',function(e){e.preventDefault()});b.addEventListener('click',function(){var v=[].slice.call(document.querySelectorAll('#orient input:checked')).map(function(x){return x.value});
var seen={},li=[];v.forEach(function(k){var r=R[k];if(r&&!seen[r[1]]){seen[r[1]]=1;li.push('<li><a href="'+r[1]+'">'+r[0]+'</a></li>')}});
var first=v.indexOf('dormir')>=0||v.indexOf('comer')>=0?'<p><strong>Empieza hoy por aquí:</strong> llama a servicios sociales de urgencia de tu ciudad (o al 112 si hay peligro).</p>':'<p><strong>Empieza por aquí:</strong> pide cita en servicios sociales de tu ayuntamiento.</p>';
o.innerHTML=li.length?first+'<ol>'+li.join('')+'</ol>':'<p>Marca al menos una casilla.</p>';o.focus&&o.focus();});})();
""")

# sello para webs de entidades
io.open(OUT + '/blog/sello.svg', 'w', encoding='utf-8').write("""<svg xmlns="http://www.w3.org/2000/svg" width="220" height="64" viewBox="0 0 220 64" role="img" aria-label="Estamos en SupportNear: ayuda gratis cerca"><rect width="220" height="64" rx="12" fill="#0B7A63"/><g transform="translate(14 14) scale(1.5)" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"/><path d="M12 7v6M9 10h6"/></g><text x="62" y="28" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="13" fill="#E4F2EE">Estamos en</text><text x="62" y="47" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="19" font-weight="700" fill="#fff">SupportNear</text></svg>
""")

# infografia del informe de Espana
cs = cities_where(cc='ES')
tot = {n: sum(count_of(c, n)[0] for c in cs) for n in ('food', 'shelter', 'hygiene', 'health', 'social', 'warm')}
lab = [('Comida gratis', 'food'), ('Albergues', 'shelter'), ('Duchas y aseos', 'hygiene'), ('Salud', 'health'), ('Servicios sociales', 'social'), ('Bibliotecas y centros cívicos', 'warm')]
mx = max(tot.values())
rows = ''.join('<text x="30" y="%d" font-size="16" fill="#4A443C">%s</text><rect x="300" y="%d" width="%.1f" height="22" rx="4" fill="%s"/><text x="%.1f" y="%d" font-size="16" font-weight="700" fill="#14110E">%s</text>' % (
    150 + i * 42, l, 134 + i * 42, max(3, 360.0 * tot[k] / mx), '#C8351B' if k in ('food', 'shelter') else '#0B7A63', 308 + max(3, 360.0 * tot[k] / mx), 150 + i * 42, format(tot[k], ',d').replace(',', '.'))
    for i, (l, k) in enumerate(lab))
io.open(OUT + '/blog/informe-espana-2026.svg', 'w', encoding='utf-8').write(
    '<svg xmlns="http://www.w3.org/2000/svg" width="760" height="420" viewBox="0 0 760 420" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" role="img" aria-label="Ayuda gratuita en el mapa abierto en 48 ciudades españolas, 2026">'
    '<rect width="760" height="420" fill="#FBF8F3"/><text x="30" y="52" font-size="24" font-weight="700" fill="#14110E">La ayuda más básica es la que peor está en el mapa</text>'
    '<text x="30" y="84" font-size="15" fill="#4A443C">Sitios en el mapa abierto a menos de 10 km del centro, 48 ciudades españolas, 2026</text>'
    + rows + '<text x="30" y="400" font-size="13" fill="#7A7168">Fuente: OpenStreetMap (28-10-2026) vía SupportNear · supportnear.com/blog/informe-ayuda-gratuita-espana-2026</text></svg>\n')

print('articulos', len(A.ARTS), 'por idioma', {l: sum(1 for a in A.ARTS if a['lang'] == l) for l in sorted(set(a['lang'] for a in A.ARTS))})
