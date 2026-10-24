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
    return (f'<form id="cdo-survey" class="card" novalidate style="padding:clamp(18px,4vw,32px);max-width:760px" data-lang="{lang}">'
      f'<fieldset style="border:0;padding:0;margin:0"><legend {lab}>{T("What do you come here for?", "¿Para qué lees esta web?")}</legend>'
      + checks('q1', [T('Travel', 'Viajes'), T('Points and miles', 'Puntos y millas'), T('Building companies', 'Emprender'), 'Growth marketing', T('The book', 'El libro')]) + '</fieldset>'
      f'<fieldset style="border:0;padding:0;margin:0"><legend {lab}>{T("How often do you want the newsletter?", "¿Cada cuánto quieres recibir la newsletter?")}</legend>'
      + checks('q2', [T('Every week', 'Cada semana'), T('Every two weeks', 'Cada dos semanas'), T('Once a month', 'Una vez al mes')], 'radio') + '</fieldset>'
      f'<fieldset style="border:0;padding:0;margin:0"><legend {lab}>{T("Have you travelled thanks to something you read here?", "¿Has viajado gracias a algo que leíste aquí?")}</legend>'
      + checks('q3', [T('Yes', 'Sí'), 'No', T('Not yet', 'Todavía no')], 'radio') + '</fieldset>'
      f'<label for="sq4" {lab}>{T("What would you like me to write about?", "¿Sobre qué te gustaría que escribiera?")}</label><textarea id="sq4" name="q4" rows="3" {inp}></textarea>'
      f'<label for="sq5" {lab} style="display:block;font-weight:700;margin:16px 0 4px">{T("One thing you would improve", "Una cosa que mejorarías")}</label><textarea id="sq5" name="q5" rows="3" {inp}></textarea>'
      f'<div style="display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));margin-top:16px"><div><label for="sqn" {lab}>{T("Name (optional)", "Nombre (opcional)")}</label><input id="sqn" name="name" autocomplete="name" {inp}></div>'
      f'<div><label for="sqe" {lab}>Email</label><input id="sqe" name="email" type="email" autocomplete="email" required {inp}></div></div>'
      f'<input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">'
      f'<label style="display:flex;gap:10px;align-items:flex-start;margin:16px 0;font-size:14px"><input type="checkbox" name="consent" required style="margin-top:3px"> <span>{T("I accept that Carlos de Ory keeps my answers to improve the site, under the", "Acepto que Carlos de Ory guarde mis respuestas para mejorar la web, según la")} <a href="/politica-de-privacidad/">{T("privacy policy", "política de privacidad")}</a>.</span></label>'
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
