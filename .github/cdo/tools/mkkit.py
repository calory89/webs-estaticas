import asyncio,html
from playwright.async_api import async_playwright
T={'en':dict(lang='en',kick='Speaker kit',title='Carlos de Ory',sub='Founder, speaker and growth marketer. Keynotes in English and Spanish.',
 bio='Carlos de Ory started his first business at 16 and has been building companies for more than 20 years. He began in travel, founding Happy Low Cost, and went on to live and build with other founders in New York, Berlin, Miami and Bali. In 2022 Forbes España included him in its list of the 100 most creative people in business. Today he lives between Europe and Sumba, an island one hour from Bali, where he is building Eco Beach City. He is writing a book about building companies and a life you choose.',
 th='Keynotes',talks=[('The day you stop waiting','Why most people don\'t fail for lack of talent, they fail because they wait too long to start. From his book.','Everyone'),
 ('From zero to 300,000 flights','How Happy Low Cost grew a community past one million followers, and what it teaches about growth today.','Marketing'),
 ('Building a town from an island','The story of Eco Beach City on Sumba: building a real place, remotely, one hour from Bali.','Founders')],
 fmt='Formats',fmts='Keynote · Workshop · Fireside chat · Panel. 30 to 60 minutes. On stage or online.',lab_len='Length',lab_for='For',
 seen='As seen in',book='Request a date',url='carlosdeory.com/speaking',foot='Bio, photos and booking form at carlosdeory.com/speaking'),
'es':dict(lang='es',kick='Dossier de ponente',title='Carlos de Ory',sub='Fundador, conferenciante y experto en growth marketing. Charlas en español e inglés.',
 bio='Carlos de Ory montó su primer negocio con 16 años y lleva más de 20 años creando empresas. Empezó con los viajes, fundando Happy Low Cost, y después vivió y construyó con otros fundadores en Nueva York, Berlín, Miami y Bali. En 2022 Forbes España lo incluyó en su lista de las 100 personas más creativas de los negocios. Hoy vive entre Europa y Sumba, una isla a una hora de Bali, donde construye Eco Beach City. Está escribiendo un libro sobre crear empresas y una vida elegida.',
 th='Conferencias',talks=[('El día que dejas de esperar','Por qué la mayoría no fracasa por falta de talento, sino por esperar demasiado para empezar. De su libro.','Todos los públicos'),
 ('De cero a 300.000 vuelos','Cómo Happy Low Cost creó una comunidad de más de un millón de seguidores y qué enseña hoy sobre crecimiento.','Marketing'),
 ('Construir un pueblo desde una isla','La historia de Eco Beach City en Sumba: levantar un lugar real, en remoto, a una hora de Bali.','Fundadores')],
 fmt='Formatos',fmts='Conferencia · Taller · Entrevista en el escenario · Mesa redonda. De 30 a 60 minutos. Presencial u online.',lab_len='Duración',lab_for='Para',
 seen='En los medios',book='Pide fecha',url='carlosdeory.com/speaking',foot='Bio, fotos y formulario de reserva en carlosdeory.com/speaking')}
def page(t):
    talks=''.join(f'<div class="t"><span class="k">CO {["001","014","023"][i]}</span><h3>{html.escape(a)}</h3><p>{html.escape(b)}</p><div class="m"><span>{t["lab_len"]} <b>30-60′</b></span><span>{t["lab_for"]} <b>{html.escape(c)}</b></span><span>EN · ES</span></div></div>' for i,(a,b,c) in enumerate(t['talks']))
    return f'''<!doctype html><html lang="{t['lang']}"><meta charset="utf-8"><style>
@page{{size:A4;margin:0}}*{{box-sizing:border-box}}body{{margin:0;font-family:-apple-system,"Segoe UI",Helvetica,Arial,sans-serif;color:#15151A;background:#F3EFE6}}
.p{{width:210mm;height:297mm;padding:16mm 15mm;position:relative;overflow:hidden}}
.top{{display:grid;grid-template-columns:62mm 1fr;gap:9mm;align-items:center}}
.top img{{width:62mm;height:74mm;object-fit:cover;border-radius:5mm}}
.kick{{font:700 9pt/1 monospace;letter-spacing:.2em;text-transform:uppercase;color:#C2452D}}
h1{{font-size:34pt;line-height:.95;letter-spacing:-.03em;margin:3mm 0 3mm}} .sub{{font-size:12pt;color:#55555f;margin:0}}
.bio{{font-size:10.6pt;line-height:1.55;margin:8mm 0 7mm}}
h2{{font-size:15pt;margin:0 0 4mm}}
.g{{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm}}
.t{{background:#141418;color:#F4F1EA;border-radius:4mm;padding:5mm}} .t .k{{font:700 8pt monospace;color:#F2C14E}} .t h3{{font-size:13pt;line-height:1.1;margin:2mm 0;color:#fff}} .t p{{font-size:9pt;line-height:1.45;color:#cfcfd6;margin:0 0 3mm;min-height:22mm}}
.t .m{{display:flex;flex-direction:column;gap:1mm;font-size:8pt;color:#b9b9c4;border-top:1px dashed #3a3a44;padding-top:2.5mm}} .t b{{color:#fff}}
.f{{margin-top:7mm;font-size:10.5pt}} .seen{{margin-top:6mm;font-size:10pt;color:#55555f}} .seen b{{color:#15151A;font-family:Georgia,serif;font-size:13pt;margin-right:5mm}}
.cta{{position:absolute;left:15mm;right:15mm;bottom:14mm;background:#C2452D;color:#fff;border-radius:4mm;padding:6mm 7mm;display:flex;justify-content:space-between;align-items:center;font-size:12pt}} .cta b{{font-size:15pt}}
</style><div class="p"><div class="top"><img src="carlos.jpg"><div><div class="kick">{t['kick']}</div><h1>{t['title']}</h1><p class="sub">{t['sub']}</p></div></div>
<p class="bio">{html.escape(t['bio'])}</p><h2>{t['th']}</h2><div class="g">{talks}</div>
<p class="f"><b>{t['fmt']}:</b> {t['fmts']}</p><p class="seen">{t['seen']}: <b>Forbes España</b><b>Antena 3</b></p>
<div class="cta"><span><b>{t['book']}</b><br>{t['foot']}</span><span style="font:700 13pt monospace">{t['url']}</span></div></div></html>'''
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for l,t in T.items():
            open(f'/home/claude/kit/kit-{l}.html','w').write(page(t))
            pg=await b.new_page(); await pg.goto(f'file:///home/claude/kit/kit-{l}.html'); await pg.wait_for_timeout(300)
            await pg.pdf(path=f'/home/claude/kit/carlos-de-ory-speaker-kit-{l}.pdf',format='A4',print_background=True)
        await b.close()
asyncio.run(main())
