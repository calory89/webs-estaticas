"""Paginas extra (newsletter y encuesta de lectores) para gen_pages.py."""
import sys
sys.path.insert(0, '/home/claude/tools')
from pages_content import leadbox

def nlbox(lang):
    en = lang == 'en'
    b = leadbox(lang, f'/assets/cdo/million-mile-playbook-{lang}.pdf', 'newsletter:page',
                'Join and get the Million Mile Playbook in PDF.' if en else 'Apúntate y llévate el Million Mile Playbook en PDF.',
                '21 tricks to fly business class for almost nothing.' if en else '21 trucos para volar en business casi gratis.')
    return b.replace('Send me the checklist', 'Join the newsletter').replace('Quiero la checklist', 'Apuntarme').replace(
        'You also join the newsletter. Unsubscribe in one click. ', 'Unsubscribe in one click. ').replace('También te apuntas a la newsletter. Te das de baja en un clic. ', 'Te das de baja en un clic. ')

NL = {
 'es': dict(path='/newsletter/', section='other', title='La newsletter de Carlos de Ory', og='/assets/cdo/og-growth.jpg',
    desc='Viajes, puntos y millas, los episodios del libro y lo que estoy construyendo. Te llevas el Million Mile Playbook en PDF al apuntarte.',
    eyebrow='Newsletter', h1='La newsletter que sí abres.',
    lead='Te escribo cuando tengo algo que merece la pena: rutas, trucos de millas, los episodios nuevos del libro y lo que estoy construyendo desde Sumba.',
    crumbs=[('/', 'Carlos de Ory'), (None, 'Newsletter')], ctas=[('#apuntate', 'Apuntarme'), ('/libro/', 'Leer el libro')],
    sections=[
     {'h': 'Apúntate', 'html': '<div id="apuntate"></div>' + nlbox('es')},
     {'h': 'Qué recibes', 'html': '<ul style="max-width:70ch"><li>Nada más apuntarte, el <b>Million Mile Playbook</b> en PDF.</li><li>Un aviso cuando sale un <a href="/libro/">episodio nuevo del libro</a>.</li><li>Como mucho una vez al mes, un resumen con los artículos nuevos de la web.</li><li>Unos pocos correos de bienvenida con lo mejor de la web para empezar.</li></ul>'},
     {'h': 'Lo que no recibes', 'html': '<p style="max-width:70ch">No vendo tu email a nadie ni te mando publicidad de terceros. Cada correo lleva un enlace para darte de baja con un clic.</p>'},
     {'h': 'Para empezar', 'html': '<ul style="max-width:70ch"><li><a href="/million-mile-playbook-revolut-ultra/">El Million Mile Playbook</a></li><li><a href="/destinos/">Guías de viaje por destino</a></li><li><a href="/growth-marketing/">Artículos de growth marketing</a></li><li><a href="/encuesta/">Encuesta a lectores: dime qué quieres leer</a></li></ul>'}],
    end_h='¿Tienes algo que contarme?', end_p='Si quieres que escriba sobre algo concreto, dímelo en la encuesta. La leo yo.', end_href='/encuesta/', end_cta='Responder la encuesta'),
 'en': dict(path='/the-newsletter/', section='other', title='The Carlos de Ory newsletter', og='/assets/cdo/og-growth.jpg',
    desc='Travel, points and miles, new book episodes and what I am building. You get the Million Mile Playbook in PDF when you join.',
    eyebrow='Newsletter', h1='The newsletter you actually open.',
    lead='I write when I have something worth your time: routes, miles tricks, new book episodes and what I am building from Sumba.',
    crumbs=[('/', 'Carlos de Ory'), (None, 'Newsletter')], ctas=[('#join', 'Join'), ('/book/', 'Read the book')],
    sections=[
     {'h': 'Join', 'html': '<div id="join"></div>' + nlbox('en')},
     {'h': 'What you get', 'html': '<ul style="max-width:70ch"><li>The <b>Million Mile Playbook</b> in PDF as soon as you join.</li><li>A note when a <a href="/book/">new book episode</a> is out.</li><li>At most once a month, a round-up of new articles.</li><li>A few welcome emails with the best of the site to start with.</li></ul>'},
     {'h': 'What you do not get', 'html': '<p style="max-width:70ch">I never sell your email or send third-party advertising. Every email has a one-click unsubscribe link.</p>'},
     {'h': 'Start here', 'html': '<ul style="max-width:70ch"><li><a href="/million-mile-playbook-revolut-ultra/">The Million Mile Playbook</a></li><li><a href="/book/">The book</a></li><li><a href="/survey/">Reader survey: tell me what to write</a></li></ul>'}],
    end_h='Something to tell me?', end_p='If you want me to write about something specific, say so in the survey. I read every answer.', end_href='/survey/', end_cta='Take the survey'),
}

def survey_form(lang):
    en = lang == 'en'
    T = (lambda a, b: a if en else b)
    def checks(name, opts, typ='checkbox'):
        return '<div style="display:flex;flex-wrap:wrap;gap:8px 18px;margin:6px 0 18px">' + ''.join(
            f'<label style="display:flex;gap:8px;align-items:center;font-size:16px"><input type="{typ}" name="{name}" value="{o}"> {o}</label>' for o in opts) + '</div>'
    inp = 'style="width:100%;border:1px solid #E6E1D8;border-radius:12px;padding:11px 14px;font:inherit;font-size:16px;background:#fff"'
    lab = 'style="display:block;font-weight:700;margin:0 0 4px"'
    return ('<style>#cdo-survey input[type=checkbox],#cdo-survey input[type=radio]{width:18px!important;height:18px!important;min-width:0;flex:none;margin:0;padding:0;border-radius:4px;accent-color:#15151A}#cdo-survey label{white-space:nowrap}#cdo-survey label.w{white-space:normal}</style>'
      f'<form id="cdo-survey" class="card" novalidate style="padding:clamp(18px,4vw,32px);max-width:760px" data-lang="{lang}">'
      f'<fieldset style="border:0;padding:0;margin:0"><legend {lab}>{T("What do you come here for?", "¿Para qué lees esta web?")}</legend>'
      + checks('q1', [T('Travel', 'Viajes'), T('Points and miles', 'Puntos y millas'), T('Building companies', 'Emprender'), 'Growth marketing', T('The book', 'El libro')]) + '</fieldset>'
      f'<fieldset style="border:0;padding:0;margin:0"><legend {lab}>{T("How often do you want the newsletter?", "¿Cada cuánto quieres recibir la newsletter?")}</legend>'
      + checks('q2', [T('Every week', 'Cada semana'), T('Every two weeks', 'Cada dos semanas'), T('Once a month', 'Una vez al mes')], 'radio') + '</fieldset>'
      f'<fieldset style="border:0;padding:0;margin:0"><legend {lab}>{T("Have you travelled thanks to something you read here?", "¿Has viajado gracias a algo que leíste aquí?")}</legend>'
      + checks('q3', [T('Yes', 'Sí'), 'No', T('Not yet', 'Todavía no')], 'radio') + '</fieldset>'
      f'<label class="w" for="sq4" {lab}>{T("What would you like me to write about?", "¿Sobre qué te gustaría que escribiera?")}</label><textarea id="sq4" name="q4" rows="3" {inp}></textarea>'
      f'<label class="w" for="sq5" style="display:block;font-weight:700;margin:16px 0 4px">{T("One thing you would improve", "Una cosa que mejorarías")}</label><textarea id="sq5" name="q5" rows="3" {inp}></textarea>'
      f'<div style="display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));margin-top:16px"><div><label for="sqn" {lab}>{T("Name (optional)", "Nombre (opcional)")}</label><input id="sqn" name="name" autocomplete="name" {inp}></div>'
      f'<div><label for="sqe" {lab}>Email</label><input id="sqe" name="email" type="email" autocomplete="email" required {inp}></div></div>'
      f'<input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">'
      f'<label class="w" style="display:flex;gap:10px;align-items:flex-start;margin:16px 0;font-size:14px"><input type="checkbox" name="consent" required style="margin-top:3px"> <span>{T("I accept that Carlos de Ory keeps my answers to improve the site, under the", "Acepto que Carlos de Ory guarde mis respuestas para mejorar la web, según la")} <a href="/politica-de-privacidad/">{T("privacy policy", "política de privacidad")}</a>.</span></label>'
      f'<button class="btn solid" type="submit">{T("Send my answers", "Enviar mis respuestas")}</button> <p class="m" role="status" aria-live="polite" style="margin:12px 0 0;font-weight:700"></p></form>'
      '<script>(function(){var f=document.getElementById("cdo-survey");if(!f)return;var en=f.getAttribute("data-lang")==="en",m=f.querySelector(".m");'
      'f.addEventListener("submit",function(e){e.preventDefault();var fd=new FormData(f),em=(fd.get("email")||"").trim();'
      'if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(em)){m.textContent=en?"Add a valid email.":"Escribe un email válido.";f.email.focus();return;}'
      'if(!f.consent.checked){m.textContent=en?"Tick the box to accept the privacy policy.":"Marca la casilla de la política de privacidad.";return;}'
      
      'var q=function(n){return fd.getAll(n).join(", ")||"-"};'
      'var msg=(en?"Reader survey":"Encuesta a lectores")+" 2026\\n\\n1. "+q("q1")+"\\n2. "+q("q2")+"\\n3. "+q("q3")+"\\n4. "+(fd.get("q4")||"-")+"\\n5. "+(fd.get("q5")||"-");'
      'var b=f.querySelector("button");b.disabled=true;m.textContent=en?"Sending…":"Enviando…";'
      'fetch("https://oykcsmextclpdnugixqz.supabase.co/functions/v1/cdo-contact",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:(fd.get("name")||"").trim()||(en?"Reader":"Lector"),email:em,company:"",kind:"survey",message:msg,lang:en?"en":"es",consent:true,website:fd.get("website")||""})})'
      '.then(function(r){if(!r.ok)throw 0;f.innerHTML="<h3 style=\\"margin:0\\">"+(en?"Thank you. I read every answer.":"Gracias. Leo todas las respuestas.")+"</h3>";try{window.zaraz&&zaraz.track("survey_sent")}catch(x){}})'
      '.catch(function(){b.disabled=false;m.textContent=en?"It could not be sent. Try again in a minute.":"No se pudo enviar. Inténtalo de nuevo en un minuto."});});})();</script>')

SV = {
 'es': dict(path='/encuesta/', section='other', title='Encuesta a lectores 2026', og='/assets/cdo/og-growth.jpg',
    desc='Dos minutos para decirme qué quieres leer en carlosdeory.com y cada cuánto quieres la newsletter. Leo todas las respuestas.',
    eyebrow='Encuesta anual', h1='Dime qué quieres leer.', lead='Cinco preguntas, dos minutos. Con tus respuestas decido qué escribo el próximo año y cada cuánto llega la newsletter.',
    crumbs=[('/', 'Carlos de Ory'), ('/newsletter/', 'Newsletter'), (None, 'Encuesta')], ctas=[('#cdo-survey', 'Empezar')],
    sections=[{'h': 'Cinco preguntas', 'html': survey_form('es')}],
    end_h='¿Aún no estás en la newsletter?', end_p='Apúntate y te llevas el Million Mile Playbook en PDF.', end_href='/newsletter/', end_cta='Ver la newsletter'),
 'en': dict(path='/survey/', section='other', title='Reader survey 2026', og='/assets/cdo/og-growth.jpg',
    desc='Two minutes to tell me what you want to read on carlosdeory.com and how often you want the newsletter. I read every answer.',
    eyebrow='Yearly survey', h1='Tell me what you want to read.', lead='Five questions, two minutes. Your answers decide what I write next year and how often the newsletter arrives.',
    crumbs=[('/', 'Carlos de Ory'), ('/the-newsletter/', 'Newsletter'), (None, 'Survey')], ctas=[('#cdo-survey', 'Start')],
    sections=[{'h': 'Five questions', 'html': survey_form('en')}],
    end_h='Not on the newsletter yet?', end_p='Join and get the Million Mile Playbook in PDF.', end_href='/the-newsletter/', end_cta='See the newsletter'),
}
EXTRA = [NL, SV]

# ---------- Sala de prensa ----------
def _copybox(txt, lab):
    return (f'<div class="card" style="padding:18px 20px;margin:0 0 14px"><p style="margin:0 0 10px;max-width:72ch">{txt}</p>'
            f'<button type="button" class="btn ghost sm" onclick="var t=this.previousElementSibling.textContent;navigator.clipboard&&navigator.clipboard.writeText(t);this.textContent=\'✓\'">{lab}</button></div>')
def _clips(lang):
    en = lang == 'en'
    card = 'class="card" style="display:grid;gap:8px;padding:20px;text-decoration:none;color:inherit"'
    small = 'style="font:700 12px var(--mono);letter-spacing:.08em;color:var(--ink-2);text-transform:uppercase"'
    return ('<div style="display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(250px,1fr))">'
      f'<div {card}><span style="display:inline-flex;align-items:center;gap:7px;font-weight:700;font-size:20px"><img src="/assets/cdo/antena3.svg" alt="" width="22" height="22" loading="lazy">antena<b>3</b></span><b style="font-size:18px;line-height:1.35">{"TV report on StartupsMansion, the house we set up in New York for founders to live and build together." if en else "Reportaje sobre StartupsMansion, la casa que hicimos en Nueva York para que fundadores vivieran y construyeran juntos."}</b><small {small}>Antena 3 Noticias</small></div>'
      f'<div {card}><span style="font-family:Georgia,serif;font-weight:700;font-size:24px">Forbes</span><b style="font-size:18px;line-height:1.35">{"One of the 100 most creative people in business." if en else "Entre las 100 personas más creativas de los negocios."}</b><small {small}>Forbes España · 2022</small></div>'
      f'<div {card}><span style="font-family:Georgia,serif;font-weight:700;font-size:24px">El País</span></div>'
      f'<div {card}><span style="font-family:Georgia,serif;font-weight:700;font-size:24px">The Guardian</span></div>'
      f'<a {card} href="https://wwwhatsnew.com/2014/09/20/comienza-el-programa-startupsmansion-32-emprendedores-en-new-york/" target="_blank" rel="noopener"><span style="font-weight:800;font-size:20px">Wwwhat\'s new</span><b style="font-size:18px;line-height:1.35">Comienza el programa StartupsMansion: 32 emprendedores en New York</b><small {small}>2014</small></a>'
      '</div>')
_BIO = {
 'en': ['Carlos de Ory is a Spanish founder who has been building companies since 2013 and now builds them from Sumba, an island one hour from Bali.',
        'Carlos de Ory has been building companies since 2013. He founded Happy Low Cost, a cheap-flights community through which more than 300,000 flights have been booked, and StartupsMansion, a house for founders in New York covered by Antena 3. In 2022 Forbes España named him one of the 100 most creative people in business. He speaks in English and Spanish.',
        'Carlos de Ory has been building companies since 2013 and is a dad. In 2014 he launched Happy Low Cost, a community that finds cheap flights before they disappear: more than 300,000 flights have been booked through its deals and its communities passed one million followers. He went on to live and build with other founders in New York (StartupsMansion, covered by Antena 3), Berlin, Miami and Bali. In 2022 Forbes España included him in its list of the 100 most creative people in business. Today he lives between Europe and Sumba, where he is building Eco Beach City, a town by the sea with coworking and solar power, and runs AI products such as RealHunt and Jobersity under Equinox Investment Group LLC. He is writing a book, episode by episode, about building companies and a life you choose.'],
 'es': ['Carlos de Ory es un emprendedor español que monta empresas desde 2013 y hoy lo hace desde Sumba, una isla a una hora de Bali.',
        'Carlos de Ory monta empresas desde 2013. Fundó Happy Low Cost, una comunidad de vuelos baratos con la que se han reservado más de 300.000 vuelos, y StartupsMansion, una casa de fundadores en Nueva York que salió en Antena 3. En 2022 Forbes España lo incluyó entre las 100 personas más creativas de los negocios. Da charlas en español y en inglés.',
        'Carlos de Ory monta empresas desde 2013 y es padre. En 2014 lanzó Happy Low Cost, una comunidad que caza vuelos baratos antes de que desaparezcan: con sus ofertas se han reservado más de 300.000 vuelos y sus comunidades superaron el millón de seguidores. Después vivió y construyó con otros fundadores en Nueva York (StartupsMansion, que salió en Antena 3), Berlín, Miami y Bali. En 2022 Forbes España lo incluyó en su lista de las 100 personas más creativas de los negocios. Hoy vive entre Europa y Sumba, donde construye Eco Beach City, un pueblo frente al mar con coworking y energía solar, y lleva productos con IA como RealHunt y Jobersity bajo Equinox Investment Group LLC. Está escribiendo un libro, episodio a episodio, sobre crear empresas y una vida elegida.']}
_FACTS = {
 'en': ['Building companies since 2013', 'Happy Low Cost: more than 300,000 flights booked, communities past one million followers', 'Forbes España, 100 most creative people in business (2022)', 'StartupsMansion in New York, covered by Antena 3', 'Eco Beach City on Sumba, since 2023', 'SupportNear: free map of more than 37,000 places in 147 countries', 'Talks in English and Spanish'],
 'es': ['Monta empresas desde 2013', 'Happy Low Cost: más de 300.000 vuelos reservados y comunidades de más de un millón de seguidores', 'Forbes España, 100 personas más creativas de los negocios (2022)', 'StartupsMansion en Nueva York, en Antena 3', 'Eco Beach City en Sumba, desde 2023', 'SupportNear: mapa gratuito con más de 37.000 lugares en 147 países', 'Charlas en español y en inglés']}
def _press(lang):
    en = lang == 'en'; T = (lambda a, b: a if en else b)
    bios = ''.join(_copybox(b, T('Copy', 'Copiar')) for b in _BIO[lang])
    labs = [T('One line', 'Una línea'), T('Short (about 60 words)', 'Corta (unas 60 palabras)'), T('Long (about 150 words)', 'Larga (unas 150 palabras)')]
    bios = ''.join(f'<h3 style="font-size:17px;margin:18px 0 8px">{labs[i]}</h3>' + _copybox(b, T('Copy', 'Copiar')) for i, b in enumerate(_BIO[lang]))
    photos = (f'<div style="display:grid;gap:18px;grid-template-columns:minmax(0,220px) minmax(0,1fr);align-items:start">'
              f'<img src="/assets/cdo/carlos.jpg" alt="Carlos de Ory" width="365" height="547" loading="lazy" style="width:100%;height:auto;border-radius:14px">'
              f'<div><p style="margin:0 0 12px">{T("Free to use with credit: Carlos de Ory.", "Uso libre citando: Carlos de Ory.")}</p>'
              f'<p style="display:flex;flex-wrap:wrap;gap:10px"><a class="btn solid" href="/assets/cdo/carlos.jpg" download>{T("Download photo", "Descargar foto")}</a>'
              f'<a class="btn ghost" href="/assets/cdo/carlos-de-ory-speaker-kit-{lang}.pdf" download>{T("Speaker kit (PDF)", "Dossier de ponente (PDF)")}</a></p>'
              f'<p style="color:var(--ink-2);margin:0">{T("High-resolution photos on request through the form.", "Fotos en alta resolución bajo petición en el formulario.")}</p></div></div>')
    return dict(path='/press/' if en else '/prensa/', section='other', title=T('Press room', 'Sala de prensa'), og='/assets/cdo/og-speaking.jpg',
      desc=T('Carlos de Ory press room: bios in three lengths, photos, key facts and media coverage (Forbes, Antena 3, El País, The Guardian).', 'Sala de prensa de Carlos de Ory: bio en tres largos, fotos, datos clave y apariciones en medios (Forbes, Antena 3, El País, The Guardian).'),
      eyebrow=T('Press', 'Prensa'), h1=T('Press room.', 'Sala de prensa.'),
      lead=T('Everything you need to write about Carlos de Ory: bios, photos, facts and past coverage. I answer press requests personally.', 'Todo lo que necesitas para escribir sobre Carlos de Ory: bio, fotos, datos y apariciones. Contesto yo a las peticiones de prensa.'),
      crumbs=[('/', 'Carlos de Ory'), (None, T('Press', 'Prensa'))], ctas=[('#bios', T('Bios', 'Bio')), ('/#contact', T('Contact for press', 'Contacto de prensa'))],
      sections=[{'h': T('In the media', 'En los medios'), 'html': _clips(lang)},
                {'h': T('Key facts', 'Datos clave'), 'html': '<ul style="max-width:72ch">' + ''.join(f'<li>{f}</li>' for f in _FACTS[lang]) + '</ul>'},
                {'h': 'Bio', 'html': '<div id="bios"></div>' + bios},
                {'h': T('Photos and kit', 'Fotos y dossier'), 'html': photos}],
      end_h=T('Writing a story?', '¿Estás escribiendo un reportaje?'), end_p=T('Tell me the outlet, the angle and your deadline. Good angles: building a town on Sumba, flying business for almost nothing, founders living together.', 'Cuéntame el medio, el enfoque y tu fecha de cierre. Buenos temas: construir un pueblo en Sumba, volar en business casi gratis, fundadores que viven juntos.'),
      end_href='/#contact', end_cta=T('Contact', 'Contactar'))
PRESS = {'en': _press('en'), 'es': _press('es')}
EXTRA.append(PRESS)

# ---------- Curso de growth por email (ES) ----------
def _course_box():
    b = leadbox('es', '', 'curso:growth', 'Curso gratis de growth marketing por email.', 'Siete lecciones, una al día, para entender cuánto te cuesta un cliente y cómo bajarlo.')
    return b.replace('Quiero la checklist', 'Empezar el curso').replace('También te apuntas a la newsletter. Te das de baja en un clic. ', 'Te das de baja en un clic. ').replace(' data-pdf=""', ' data-ok="Hecho. La lección 1 ya está en tu email."')
CURSO = {'es': dict(path='/curso-growth/', section='growth', title='Curso gratis de growth marketing por email', og='/assets/cdo/og-growth.jpg',
    desc='Siete lecciones por email, una al día: coste por cliente, cuánto pagar por un cliente, páginas que convierten, respuesta rápida, pruebas A/B y cómo elegir canal.',
    eyebrow='Curso gratis', h1='Growth marketing en 7 días.', lead='Una lección al día en tu email, de cinco minutos de lectura. Al final sabrás cuánto te cuesta un cliente, cuánto puedes pagar por él y dónde invertir.',
    crumbs=[('/', 'Carlos de Ory'), ('/agencia/', 'Growth'), (None, 'Curso')], ctas=[('#empezar', 'Empezar el curso')],
    sections=[{'h': 'Apúntate', 'html': '<div id="empezar"></div>' + _course_box()},
              {'h': 'Las 7 lecciones', 'html': '<ol style="max-width:70ch;line-height:1.9"><li>Qué es el growth marketing (y qué no es)</li><li>Calcula tu coste por cliente</li><li>Cuánto puedes pagar por un cliente</li><li>Páginas que convierten</li><li>Responde en minutos, no en horas</li><li>Pruebas A/B sin estadístico</li><li>Elige tu canal</li></ol>'},
              {'h': 'Para quién es', 'html': '<p style="max-width:70ch">Para fundadores y responsables de marketing de empresas pequeñas y medianas que invierten en anuncios o quieren empezar, y quieren decidir con números en vez de con intuición.</p>'}],
    end_h='¿Prefieres que lo hagamos por ti?', end_p='Mi equipo aplica este método en campañas, webs y embudos, medidos cada semana.', end_href='/agencia/', end_cta='Ver la agencia')}
EXTRA.append(CURSO)

# ---------- Ahora / Now ----------
NOW = {
 'es': dict(path='/ahora/', section='other', title='Qué estoy haciendo ahora', og='/assets/cdo/og-eco-beach-city.jpg',
    desc='En qué está Carlos de Ory este mes: Eco Beach City en Sumba, el libro por episodios, sus productos con IA, la agencia de growth y las charlas.',
    eyebrow='Ahora · octubre 2026', h1='Lo que estoy haciendo ahora.', lead='Una página que actualizo cada mes para que sepas en qué ando, sin tener que seguirme en ninguna red.',
    crumbs=[('/', 'Carlos de Ory'), (None, 'Ahora')], ctas=[('/newsletter/', 'Recibirlo por email')],
    sections=[{'h': 'Este mes', 'html': '<ul style="max-width:70ch;line-height:1.8"><li><b>Eco Beach City.</b> Seguimos construyendo el pueblo en la costa norte de Sumba, a una hora de Bali. <a href="https://www.ecobeachcity.com/">ecobeachcity.com</a></li><li><b>El libro.</b> Ya están publicados los episodios <a href="/el-dia-que-dejas-de-esperar/">1</a> y <a href="/de-5-a-8-o-de-9-a-12/">2</a>. Estoy escribiendo el 3.</li><li><b>Productos con IA.</b> RealHunt, SurfRanking, KlipStay y Jobersity, bajo Equinox Investment Group LLC.</li><li><b>Growth marketing.</b> Mi equipo acepta proyectos nuevos y acabo de publicar <a href="/growth-marketing/">33 artículos</a> y un <a href="/curso-growth/">curso gratis por email</a>.</li><li><b>Charlas.</b> Cerrando fechas para 2027, en español y en inglés. <a href="/charlas/">Ver charlas</a></li></ul>'},
              {'h': 'Dónde estoy', 'html': '<p style="max-width:70ch">Entre Europa y Sumba.</p>'}],
    end_h='¿Hablamos?', end_p='Si algo de esto te encaja, escríbeme.', end_href='/#contact', end_cta='Contactar'),
 'en': dict(path='/now/', section='other', title='What I am doing now', og='/assets/cdo/og-eco-beach-city.jpg',
    desc='What Carlos de Ory is working on this month: Eco Beach City on Sumba, the book, his AI products, the growth agency and talks.',
    eyebrow='Now · October 2026', h1='What I am doing now.', lead='A page I update every month so you know what I am up to, without following me anywhere.',
    crumbs=[('/', 'Carlos de Ory'), (None, 'Now')], ctas=[('/the-newsletter/', 'Get it by email')],
    sections=[{'h': 'This month', 'html': '<ul style="max-width:70ch;line-height:1.8"><li><b>Eco Beach City.</b> Still building the town on the north coast of Sumba, one hour from Bali. <a href="https://www.ecobeachcity.com/">ecobeachcity.com</a></li><li><b>The book.</b> Episodes <a href="/the-day-you-stop-waiting/">1</a> and <a href="/5-to-8-or-9-to-12/">2</a> are out. I am writing episode 3.</li><li><b>AI products.</b> RealHunt, SurfRanking, KlipStay and Jobersity, under Equinox Investment Group LLC.</li><li><b>Growth marketing.</b> My team is taking new projects. <a href="/growth/">See the agency</a></li><li><b>Talks.</b> Booking 2027 dates, in English and Spanish. <a href="/speaking/">See talks</a></li></ul>'},
              {'h': 'Where I am', 'html': '<p style="max-width:70ch">Between Europe and Sumba.</p>'}],
    end_h='Want to talk?', end_p='If any of this fits what you need, write to me.', end_href='/#contact', end_cta='Contact')}
EXTRA.append(NOW)

# ---------- Glosario de puntos y millas ----------
_GL = [
 ('Avios', 'Avios', 'La moneda de puntos de Iberia Plus, British Airways Club, Qatar Airways Privilege Club, Aer Lingus y Vueling. Se pueden mover entre varios de estos programas.', 'The points currency of Iberia Plus, British Airways Club, Qatar Airways Privilege Club, Aer Lingus and Vueling. They can be moved between several of these programmes.'),
 ('Millas', 'Miles', 'Puntos que dan los programas de fidelidad de las aerolíneas. Se ganan volando o, sobre todo, gastando con tarjetas y comercios asociados.', 'Points from airline loyalty programmes. You earn them by flying or, mostly, by spending with partner cards and shops.'),
 ('Programa de fidelidad', 'Loyalty programme', 'El club de una aerolínea u hotel donde acumulas puntos y subes de nivel.', 'An airline or hotel club where you collect points and move up tiers.'),
 ('Alianza', 'Alliance', 'Grupo de aerolíneas que comparten beneficios: oneworld, Star Alliance y SkyTeam. Con millas de una puedes volar en otra del mismo grupo.', 'A group of airlines that share benefits: oneworld, Star Alliance and SkyTeam. Miles from one can be used on another in the same group.'),
 ('Billete premio', 'Award ticket', 'Un vuelo pagado con millas o puntos en lugar de dinero. Normalmente se pagan aparte tasas y suplementos.', 'A flight paid with miles or points instead of money. Taxes and surcharges are usually paid separately.'),
 ('Disponibilidad de premio', 'Award availability', 'Las plazas que una aerolínea abre para canjear con millas. No todas las plazas del avión están disponibles para canje.', 'The seats an airline releases for redemption with miles. Not every seat on the plane is open for awards.'),
 ('Tasas y suplementos', 'Taxes and surcharges', 'Lo que pagas en dinero en un billete premio. Varía mucho según la aerolínea y la ruta.', 'What you pay in cash on an award ticket. It varies a lot by airline and route.'),
 ('Upgrade', 'Upgrade', 'Pasar a una clase superior (por ejemplo, de turista a business) pagando con millas o con dinero.', 'Moving to a higher cabin (for example from economy to business) using miles or money.'),
 ('Status o nivel', 'Elite status', 'El nivel que alcanzas en un programa (plata, oro, platino...). Da ventajas como salas VIP, equipaje extra o embarque prioritario.', 'The tier you reach in a programme (silver, gold, platinum...). It gives perks like lounges, extra bags or priority boarding.'),
 ('Sala VIP', 'Lounge', 'Zona del aeropuerto con asientos, comida y bebida para viajeros de business, con status o con ciertas tarjetas.', 'An airport area with seats, food and drinks for business travellers, elite members or some card holders.'),
 ('Tarjeta co-branded', 'Co-branded card', 'Tarjeta de crédito asociada a una aerolínea u hotel que da puntos de ese programa por cada compra.', 'A credit card linked to an airline or hotel that earns that programme\'s points on every purchase.'),
 ('Bono de bienvenida', 'Welcome bonus', 'Los puntos extra que da una tarjeta al darte de alta y cumplir un gasto mínimo. Suele ser la forma más rápida de acumular.', 'The extra points a card gives when you sign up and meet a minimum spend. Usually the fastest way to collect.'),
 ('Transferencia de puntos', 'Points transfer', 'Pasar puntos de un banco o tarjeta a un programa de aerolínea u hotel. A veces hay promociones con bonus.', 'Moving points from a bank or card to an airline or hotel programme. Sometimes there are bonus promotions.'),
 ('Ratio de transferencia', 'Transfer ratio', 'Cuántos puntos de destino recibes por cada punto de origen, por ejemplo 1:1 o 2:1.', 'How many destination points you get per source point, for example 1:1 or 2:1.'),
 ('Valor del punto', 'Point value', 'Cuánto dinero ahorras por cada punto canjeado. Se calcula dividiendo el precio en efectivo entre los puntos usados.', 'How much money you save per point redeemed. Divide the cash price by the points used.'),
 ('Caducidad', 'Expiry', 'Fecha en la que tus puntos desaparecen si no tienes actividad. Muchos programas la reinician con cualquier movimiento.', 'The date your points vanish if there is no activity. Many programmes reset it with any earning or spending.'),
 ('Stopover', 'Stopover', 'Una parada larga (más de 24 horas en vuelos internacionales) en una ciudad intermedia dentro del mismo billete.', 'A long stop (over 24 hours on international flights) in a city along the way, on the same ticket.'),
 ('Escala', 'Layover', 'Una parada corta entre dos vuelos del mismo viaje.', 'A short stop between two flights on the same trip.'),
 ('Open jaw', 'Open jaw', 'Billete de ida y vuelta en el que llegas a una ciudad y vuelves desde otra.', 'A return ticket where you fly into one city and back from another.'),
 ('Error fare', 'Error fare', 'Un precio equivocado publicado por una aerolínea o agencia. A veces se respeta y otras se cancela.', 'A mistaken price published by an airline or agency. Sometimes honoured, sometimes cancelled.'),
 ('Vuelo de posicionamiento', 'Positioning flight', 'Un vuelo barato a otra ciudad para salir desde allí con una oferta mejor.', 'A cheap flight to another city to start a better deal from there.'),
 ('Tarifa básica', 'Basic fare', 'La tarifa más barata, normalmente sin maleta facturada ni cambios.', 'The cheapest fare, usually without checked bags or changes.'),
 ('Clase tarifaria', 'Fare class', 'La letra del billete que decide cuántas millas acumulas y qué condiciones tiene.', 'The letter on a ticket that decides how many miles you earn and its rules.'),
 ('Doble puntuación', 'Double dipping', 'Ganar puntos dos veces por la misma compra, por ejemplo con la tarjeta y con el programa del comercio.', 'Earning points twice for the same purchase, for example with your card and the shop\'s programme.'),
 ('Portal de compras', 'Shopping portal', 'Web de una aerolínea u hotel que te da puntos por comprar en tiendas online a través de ella.', 'An airline or hotel site that gives points for shopping at online stores through it.'),
 ('Noche gratis', 'Free night', 'Una noche de hotel canjeada con puntos o regalada por una tarjeta o un nivel de status.', 'A hotel night redeemed with points or given by a card or a status tier.'),
 ('Match de status', 'Status match', 'Cuando un programa te da su nivel equivalente al que ya tienes en otro.', 'When a programme gives you its equivalent of a tier you hold elsewhere.'),
 ('Challenge de status', 'Status challenge', 'Un reto para conseguir un nivel cumpliendo un número de vuelos o noches en poco tiempo.', 'A challenge to earn a tier by completing a number of flights or nights in a short time.'),
]
def _gloss(lang):
    en = lang == 'en'; T = (lambda a, b: a if en else b)
    rows = sorted(_GL, key=lambda r: (r[1] if en else r[0]).lower())
    dl = '<dl style="max-width:760px">' + ''.join(f'<dt id="{re.sub(r"[^a-z0-9]+", "-", (r[1] if en else r[0]).lower().translate(str.maketrans("áéíóúñ", "aeioun"))).strip("-")}" style="font-weight:800;font-size:19px;margin:22px 0 4px">{r[1] if en else r[0]}</dt><dd style="margin:0;color:var(--ink-2)">{r[3] if en else r[2]}</dd>' for r in rows) + '</dl>'
    return dict(path='/points-and-miles-glossary/' if en else '/glosario-puntos-y-millas/', section='other',
      title=T('Points and miles glossary', 'Glosario de puntos y millas'), og='/assets/cdo/og-departures.jpg',
      desc=T('Every points and miles term explained in one line: Avios, award availability, status, transfer ratios, stopovers and more.', 'Todos los términos de puntos y millas explicados en una línea: Avios, disponibilidad de premio, status, ratios de transferencia, stopover y más.'),
      eyebrow=T('Points and miles', 'Puntos y millas'), h1=T('Points and miles glossary.', 'Glosario de puntos y millas.'),
      lead=T(f'{len(rows)} terms you will meet when you start flying with points, explained in plain words.', f'{len(rows)} términos que vas a encontrar cuando empieces a volar con puntos, explicados sin jerga.'),
      crumbs=[('/', 'Carlos de Ory'), (None, T('Glossary', 'Glosario'))], ctas=[('/million-mile-playbook-revolut-ultra/', T('Read the Million Mile Playbook', 'Leer el Million Mile Playbook'))],
      sections=[{'h': T('Terms', 'Términos'), 'html': dl}],
      schema={'@context': 'https://schema.org', '@type': 'DefinedTermSet', 'name': T('Points and miles glossary', 'Glosario de puntos y millas'), 'hasDefinedTerm': [{'@type': 'DefinedTerm', 'name': r[1] if en else r[0], 'description': r[3] if en else r[2]} for r in rows]},
      end_h=T('Want the 21 tricks?', '¿Quieres los 21 trucos?'), end_p=T('Join the newsletter and get the Million Mile Playbook in PDF.', 'Apúntate a la newsletter y llévate el Million Mile Playbook en PDF.'),
      end_href=T('/the-newsletter/', '/newsletter/'), end_cta=T('Get the Playbook', 'Quiero el Playbook'))
import re
EXTRA.append({'en': _gloss('en'), 'es': _gloss('es')})

# ---------- Calculadora: cuánto vale tu lista de email ----------
def _calc(lang):
    en = lang == 'en'; T = (lambda a, b: a if en else b)
    fld = lambda k, lab, v, suf='': (f'<label style="display:grid;gap:6px;font-weight:700">{lab}<span style="display:flex;align-items:center;gap:8px"><input data-c="{k}" type="number" inputmode="decimal" min="0" step="any" value="{v}" style="width:100%;border:1px solid #E6E1D8;border-radius:12px;padding:11px 14px;font:inherit;font-size:17px;background:#fff">'
                                     f'<span style="color:var(--ink-2);min-width:24px">{suf}</span></span></label>')
    form = ('<div class="card" style="padding:clamp(18px,4vw,30px);max-width:820px"><div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">'
      + fld('n', T('Subscribers', 'Suscriptores'), 2000) + fld('f', T('Emails per month', 'Emails al mes'), 4) + fld('o', T('Open rate', 'Tasa de apertura'), 35, '%')
      + fld('c', T('Click rate (of opens)', 'Clics (sobre aperturas)'), 8, '%') + fld('v', T('Conversion (of clicks)', 'Conversión (sobre clics)'), 3, '%') + fld('a', T('Average sale', 'Venta media'), 60, '€')
      + '</div><div style="margin-top:22px;padding-top:18px;border-top:1px solid var(--line,#E6E1D8);display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">'
      + f'<div><small style="font:700 12px var(--mono);letter-spacing:.08em;color:var(--ink-2)">{T("SALES PER MONTH", "VENTAS AL MES")}</small><div data-r="s" style="font:800 32px var(--display,inherit)">0</div></div>'
      + f'<div><small style="font:700 12px var(--mono);letter-spacing:.08em;color:var(--ink-2)">{T("REVENUE PER MONTH", "INGRESOS AL MES")}</small><div data-r="m" style="font:800 32px var(--display,inherit)">0 €</div></div>'
      + f'<div><small style="font:700 12px var(--mono);letter-spacing:.08em;color:var(--ink-2)">{T("VALUE PER SUBSCRIBER / YEAR", "VALOR POR SUSCRIPTOR / AÑO")}</small><div data-r="y" style="font:800 32px var(--display,inherit)">0 €</div></div></div>'
      + f'<p data-r="t" style="margin:14px 0 0;color:var(--ink-2)"></p></div>'
      + '<script>(function(){var b=document.currentScript.previousElementSibling,g=function(k){var x=parseFloat(b.querySelector(\'[data-c="\'+k+\'"]\').value);return isFinite(x)&&x>0?x:0};'
      + 'var L=document.documentElement.lang.indexOf("es")===0?"es-ES":"en-GB",F=function(x,d){return x.toLocaleString(L,{maximumFractionDigits:d||0})};'
      + 'function r(){var s=g("n")*g("f")*g("o")/100*g("c")/100*g("v")/100,m=s*g("a"),y=g("n")?m*12/g("n"):0;'
      + 'b.querySelector(\'[data-r="s"]\').textContent=F(s,1);b.querySelector(\'[data-r="m"]\').textContent=F(m)+" €";b.querySelector(\'[data-r="y"]\').textContent=F(y,2)+" €";'
      + 'b.querySelector(\'[data-r="t"]\').textContent=' + ("\"Each new subscriber is worth about \"+F(y,2)+\" € a year to you. That is the most you should pay to get one.\"" if en else "\"Cada suscriptor nuevo te vale unos \"+F(y,2)+\" € al año. Es lo máximo que deberías pagar por conseguir uno.\"") + ';}'
      + 'b.addEventListener("input",r);r();})();</script>')
    return dict(path='/growth/email-list-value/' if en else '/agencia/calculadora-email/', section='growth',
      title=T('What is your email list worth?', '¿Cuánto vale tu lista de email?'), og='/assets/cdo/og-growth.jpg',
      desc=T('Free calculator: monthly revenue from your email list and how much each subscriber is worth, so you know what to pay to get one.', 'Calculadora gratis: cuánto te deja tu lista de email al mes y cuánto vale cada suscriptor, para saber cuánto pagar por conseguir uno.'),
      eyebrow=T('Calculator', 'Calculadora'), h1=T('What is your email list worth?', '¿Cuánto vale tu lista de email?'),
      lead=T('Put in your own numbers. The result tells you how much each subscriber brings in a year, which is the most you should pay in ads to get one.', 'Pon tus números. El resultado te dice cuánto te deja cada suscriptor al año, que es lo máximo que deberías pagar en anuncios por conseguir uno.'),
      crumbs=[('/', 'Carlos de Ory'), (T('/growth/', '/agencia/'), 'Growth'), (None, T('Email list value', 'Valor de tu lista'))], ctas=[('#calc', T('Calculate', 'Calcular'))],
      sections=[{'h': T('Your numbers', 'Tus números'), 'html': '<div id="calc"></div>' + form},
                {'h': T('How to read it', 'Cómo leerlo'), 'html': T('<p style="max-width:70ch">If your value per subscriber is higher than what a subscriber costs you in ads, every euro you invest in growing the list comes back. If it is lower, improve the emails or the offer before buying more traffic.</p>', '<p style="max-width:70ch">Si el valor por suscriptor es mayor que lo que te cuesta conseguir uno en anuncios, cada euro que inviertes en crecer la lista vuelve. Si es menor, mejora los emails o la oferta antes de comprar más tráfico.</p>')}],
      end_h=T('Want more from your list?', '¿Quieres sacar más a tu lista?'), end_p=T('My team sets up sequences, offers and the ads that feed them, measured every week.', 'Mi equipo monta secuencias, ofertas y los anuncios que las alimentan, medido cada semana.'),
      end_href=T('/growth/#start', '/agencia/#start'), end_cta=T('Tell me about your company', 'Cuéntame tu empresa'))
EXTRA.append({'en': _calc('en'), 'es': _calc('es')})

# ---------- Hub de guias en ingles ----------
import os as _os, json as _json
if _os.path.exists('/home/claude/tools/en_posts.json'):
    _EN = _json.load(open('/home/claude/tools/en_posts.json'))
    def _hub():
        cards = ''.join(f'<a class="card" href="{x["en"]}" style="display:grid;gap:10px;padding:0;overflow:hidden;text-decoration:none;color:inherit">'
                        + (f'<img src="{x["img"]}" alt="" width="720" height="450" loading="lazy" style="width:100%;height:auto;aspect-ratio:16/10;object-fit:cover">' if x.get('img') else '')
                        + f'<span style="padding:0 18px 18px;display:grid;gap:6px"><b style="font-size:19px;line-height:1.3">{html.escape(x["title"])}</b><span style="color:var(--ink-2);font-size:15px">{html.escape(x["desc"])}</span></span></a>' for x in sorted(_EN, key=lambda x: x['title']))
        return '<div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">' + cards + '</div>'
    import html
    EXTRA.append({'en': dict(path='/travel-guides/', section='other', title='Travel guides in English', og='/assets/cdo/og-blog.jpg',
        desc=f'{len(_EN)} of my most read travel guides, now in English: Rome, Prague, Budapest, Lisbon, Edinburgh, Madrid, Seville, Venice, Bali and more.',
        eyebrow='Travel', h1='Travel guides in English.', lead='The most read guides from the blog, translated. More than a thousand more are in Spanish.',
        crumbs=[('/', 'Carlos de Ory'), (None, 'Travel guides')], ctas=[('/destinos/', 'All destinations (Spanish)')],
        sections=[{'h': 'Guides', 'html': _hub()}],
        end_h='Want the points tricks too?', end_p='Join the newsletter and get the Million Mile Playbook in PDF.', end_href='/the-newsletter/', end_cta='Get the Playbook')})
