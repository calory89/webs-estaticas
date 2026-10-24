#!/usr/bin/env python3
"""Inserta (idempotente) un bloque de articulos de growth marketing en /agencia/ y sus paginas de servicio.
Volver a ejecutar despues de gen_pages.py o es_pages.py. Uso: python3 growth_links.py <raiz>"""
import os, re, sys, json, html
ROOT = sys.argv[1]
G = json.load(open('/home/claude/tools/growth_posts.json'))
e = lambda s: html.escape(s, quote=True)
PICK = {
 'agencia': ['que-es-growth-marketing', 'como-calcular-coste-por-cliente', 'cac-ltv-cuanto-pagar-por-un-cliente', 'cuando-contratar-agencia-marketing', 'como-elegir-canal-marketing', 'errores-al-empezar-con-anuncios'],
 'agencia/google-ads': ['bajar-coste-por-lead-google-ads', 'palabras-clave-negativas-google-ads', 'performance-max-cuando-usarlo', 'anuncios-de-busqueda-que-convierten'],
 'agencia/meta-ads': ['probar-creatividades-meta-ads', 'gancho-tres-segundos-video', 'api-conversiones-meta', 'retargeting-sin-perseguir'],
 'agencia/seo': ['checklist-seo-tecnico', 'seo-programatico', 'enlazado-interno', 'escribir-para-responder-busquedas'],
 'agencia/embudos': ['landing-pages-que-convierten', 'cuantos-campos-formulario', 'responder-leads-en-minutos', 'secuencia-bienvenida-email'],
}
def block(slugs):
    items = ''.join(f'<li class="card" style="padding:18px 20px"><a href="/{s}/" style="font-weight:700;font-size:17px;line-height:1.35;color:inherit">{e(G[s]["title"])}</a>'
                    f'<p style="margin:8px 0 0;color:var(--ink-2);font-size:15px">{e(G[s]["desc"])}</p></li>' for s in slugs)
    return (f'<section class="sec" id="guias_gm"><h2>Para leer antes de hablar</h2><ul class="grid" style="list-style:none;padding:0;display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">{items}</ul>'
            f'<p style="margin-top:16px;display:flex;flex-wrap:wrap;gap:8px 22px"><a href="/growth-marketing/">Todos los artículos de growth marketing &rarr;</a><a href="/curso-growth/">Curso gratis por email &rarr;</a><a href="/agencia/calculadora-email/">¿Cuánto vale tu lista de email? &rarr;</a></p></section>')
n = 0
for page, slugs in PICK.items():
    fp = os.path.join(ROOT, page, 'index.html'); s = open(fp).read()
    s = re.sub(r'<section class="sec" id="guias_gm">.*?</section>', '', s, flags=re.S)
    b = block(slugs)
    m = re.search(r'<section class="sec" id="faq">', s) or re.search(r'<section class="sec"><h2>Preguntas frecuentes</h2>', s)
    s = s[:m.start()] + b + s[m.start():]
    open(fp, 'w').write(s); n += 1
print(n, 'paginas con enlaces a growth')
