import asyncio,sys
from playwright.async_api import async_playwright
CSS="""
header.top,header.site-header,body>header,footer,.share,#comments,.comments-area,.sec,.news,.ory-next,.ory-t3,.ory-lb,#toc_container,.ory-lang-bar,.ory-old,.ory-crumbs,nav,.cookie,#cookie,[class*=cookie],.read[style*="flex-wrap"],.author-box,.wrap>.sec,.podcast,.ory-podbar,.disclosure,.ory-ccount,.twitter-tweet,blockquote.twitter-tweet,iframe,.ory-job,.ory-cta{display:none!important}
body{background:#fff!important}
.post-hero{padding-top:0!important}
.entry>*{width:auto!important;max-width:100%!important}
h2{break-after:avoid} table,img{break-inside:avoid}
"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for lang in ['en','es']:
            pg=await b.new_page()
            await pg.goto(f'http://localhost:8811/million-mile-playbook-revolut-ultra/?lang={lang}',wait_until='networkidle')
            # elegir idioma con el boton del post
            await pg.evaluate("""(l)=>{const bs=[...document.querySelectorAll('.ory-lang-bar button')];const b=bs.find(x=>(l=='en'?/english/i:/espa/i).test(x.textContent)); if(b) b.click();}""",lang)
            await pg.wait_for_timeout(500)
            await pg.add_style_tag(content=CSS)
            await pg.evaluate("""(l)=>{const h=document.querySelector('.post-hero');const d=document.createElement('p');d.style.cssText='font:600 13px/1.4 -apple-system,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#C2452D;margin:0 0 10px';d.textContent=l=='en'?'Free PDF · carlosdeory.com':'PDF gratis · carlosdeory.com';h&&h.prepend(d); if(l=='es'){const t=document.querySelector('.post-hero h1'); if(t) t.textContent='El Million Mile Playbook de Carlos de Ory: 21 trucos para volar en business casi gratis'; const sub=t&&t.nextElementSibling; if(sub&&sub.tagName=='P') sub.textContent='Un millón de millas en Qatar, British Airways e Iberia, y casi ninguna volando. Los 21 trucos, ordenados, empezando por el que nadie usa.'; const pm=document.querySelector('.post-meta'); if(pm) pm.style.display='none';} else {const pm=document.querySelector('.post-meta'); if(pm) pm.style.display='none';}
              const f=document.createElement('p');f.style.cssText='margin-top:40px;font:14px/1.6 -apple-system,sans-serif;color:#555;text-align:center';f.innerHTML=(l=='en'?'More at <b>carlosdeory.com</b> · Not financial advice. Check the current terms of each programme before you use them.':'Más en <b>carlosdeory.com</b> · No es asesoramiento financiero. Revisa las condiciones vigentes de cada programa antes de usarlas.');document.querySelector('.entry').append(f);}""",lang)
            await pg.emulate_media(media='screen')
            await pg.pdf(path=f'/home/claude/pdf/million-mile-playbook-{lang}.pdf',format='A4',print_background=True,margin={'top':'18mm','bottom':'18mm','left':'14mm','right':'14mm'})
            print(lang,'ok')
        await b.close()
asyncio.run(main())
