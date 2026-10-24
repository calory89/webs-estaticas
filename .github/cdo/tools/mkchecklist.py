import asyncio,html
from playwright.async_api import async_playwright
ES=[('Tráfico',['Sabes de qué canal viene cada venta, no solo cada visita','Cada anuncio lleva a una página hecha para esa promesa, no a la home','Las campañas excluyen búsquedas o públicos que nunca compran','Revisas la frecuencia: nadie ve el mismo anuncio diez veces']),
('Landing page',['El titular repite la promesa del anuncio','La página carga en menos de 3 segundos en un móvil normal','Hay un solo siguiente paso claro por página','El botón principal se ve sin hacer scroll','Pides solo los datos que vas a usar','Hay pruebas reales: cifras, casos o testimonios con nombre']),
('Formulario',['Funciona: lo pruebas tú mismo cada semana','Muestra un error claro si falta algo','Confirma que ha llegado y dice qué pasa después','Cada envío llega a una persona en minutos']),
('Respuesta',['Contestas en menos de una hora en horario laboral','Hay una respuesta automática útil, no un \"hemos recibido tu mensaje\" vacío','Sabes qué contactos son prioritarios por presupuesto u objetivo','Haces un segundo seguimiento si no contestan']),
('Seguimiento',['Quien no compra hoy recibe algo útil por email','Tienes una secuencia de bienvenida de 3 a 5 emails','Cada email tiene un único objetivo','La baja es fácil y la respetas']),
('Medición',['Mides coste por cliente, no solo por clic','Revisas los números cada semana, no cada trimestre','Sabes cuánto vale un cliente a lo largo del tiempo'])]
EN=[('Traffic',['You know which channel each sale comes from, not only each visit','Every ad lands on a page built for that promise, not the home page','Campaigns exclude searches or audiences that never buy','You watch frequency: nobody sees the same ad ten times']),
('Landing page',['The headline repeats the ad’s promise','The page loads in under 3 seconds on an average phone','There is one clear next step per page','The main button is visible without scrolling','You only ask for data you will use','There is real proof: numbers, cases or named testimonials']),
('Form',['It works: you test it yourself every week','It shows a clear error when something is missing','It confirms it arrived and says what happens next','Every submission reaches a person within minutes']),
('Response',['You answer within an hour in working hours','There is a useful automatic reply, not an empty \"we got your message\"','You know which leads are priority by budget or goal','You follow up a second time if they do not reply']),
('Follow-up',['People who do not buy today get something useful by email','You have a welcome sequence of 3 to 5 emails','Each email has one goal','Unsubscribing is easy and respected']),
('Measurement',['You measure cost per customer, not only per click','You review numbers every week, not every quarter','You know what a customer is worth over time'])]
def doc(lang,data):
    es=lang=='es'; n=0; body=''
    for sec,items in data:
        body+=f'<h2>{sec}</h2><ul>'
        for it in items: n+=1; body+=f'<li><span class="b">☐</span><b>{n:02d}</b> {html.escape(it)}</li>'
        body+='</ul>'
    t='25 fugas de un embudo de ventas' if es else '25 leaks in a sales funnel'
    sub='Una checklist para revisar tu embudo en 20 minutos. Marca lo que ya haces; lo que quede sin marcar es por donde se te escapan clientes.' if es else 'A checklist to review your funnel in 20 minutes. Tick what you already do; whatever is left unticked is where customers slip away.'
    end=('Si quieres que lo revisemos juntos: carlosdeory.com/agencia' if es else 'If you want us to review it together: carlosdeory.com/growth')
    return f'''<!doctype html><html lang="{lang}"><meta charset="utf-8"><style>@page{{size:A4;margin:16mm 16mm}}body{{font:11.5pt/1.5 -apple-system,Helvetica,Arial,sans-serif;color:#15151A}}
.k{{font:700 9pt monospace;letter-spacing:.2em;text-transform:uppercase;color:#C2452D}}h1{{font-size:30pt;line-height:1.02;letter-spacing:-.02em;margin:4mm 0}}h2{{font-size:14pt;margin:7mm 0 2mm;border-bottom:2px solid #15151A;padding-bottom:1mm}}
ul{{list-style:none;padding:0;margin:0}}li{{padding:2.2mm 0;border-bottom:1px solid #E6E1D8;display:flex;gap:3mm;align-items:baseline}}li b{{font:700 9pt monospace;color:#C2452D}}.b{{font-size:14pt}}.end{{margin-top:8mm;padding:5mm;background:#0E4F49;color:#fff;border-radius:3mm}}</style>
<div class="k">{"Checklist gratis · carlosdeory.com" if es else "Free checklist · carlosdeory.com"}</div><h1>{t}</h1><p style="color:#555">{sub}</p>{body}<div class="end">{end}</div></html>'''
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for lang,data in (('es',ES),('en',EN)):
            assert sum(len(i) for _,i in data)==25
            fn=f'/home/claude/chk/{lang}.html'; open(fn,'w').write(doc(lang,data))
            pg=await b.new_page(); await pg.goto('file://'+fn); await pg.pdf(path=f'/home/claude/chk/checklist-embudo-{lang}.pdf',format='A4',print_background=True)
        await b.close()
asyncio.run(main())
