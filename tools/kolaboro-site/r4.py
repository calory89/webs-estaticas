# Round 4: Spanish landing, academy lessons + exam, /check autocomplete, self-hosted fonts.

ES_UI = [
  ('<html lang="en">', '<html lang="es">'),
  ('>How it works<', '>Cómo funciona<'), ('>Trust Score<', '>Trust Score<'), ('>Check a project<', '>Comprobar un proyecto<'),
  ('>Become an agent<', '>Hazte agente<'), ('>Developers<', '>Promotores<'), ('>Protect my purchase<', '>Proteger mi compra<'),
  ('Skip to content', 'Saltar al contenido'), ('aria-label="Menu"', 'aria-label="Menú"'),
  ('Local agents who work for the buyer, never the seller. Launching city by city, Bali first.', 'Agentes locales que trabajan para el comprador, nunca para el vendedor. Empezamos ciudad a ciudad, primero Bali.'),
  ('Monthly: projects that slipped, projects that delivered.', 'Cada mes: proyectos que se retrasaron y proyectos que cumplieron.'),
  ('placeholder="Your email"', 'placeholder="Tu email"'), ('>Subscribe<', '>Suscribirme<'),
]

def es_form(html_):
    rep = [("I'm buying", 'Voy a comprar'), ('I want to be an agent', 'Quiero ser agente'), ("I'm a developer", 'Soy promotor'),
           ('<b>What you get:</b> the land title, permits and developer checked by a local agent, GPS-stamped video before every payment, and a clear "safe to pay" or "hold". From €490.',
            '<b>Qué recibes:</b> título, permisos y promotor revisados por un agente local, vídeo con GPS antes de cada pago y un "puedes pagar" o "espera" claro. Desde 490 €.'),
           ('<b>What you earn:</b> a fee for every inspection and report you deliver, plus a share of the buyer\'s agent fee on every purchase you work on. Paid by Kolaboro, never by developers. Free AI training, no degree needed. <a href="/agents">How agents work</a>',
            '<b>Qué ganas:</b> un pago por cada inspección e informe, más una parte de la comisión de agente del comprador en cada compra en la que trabajes. Te paga Kolaboro, nunca el promotor. Formación con IA gratis, sin título. <a href="/agents">Cómo trabajan los agentes</a>'),
           ('<b>What you get:</b> an independent Trust Score page, a live "Verified by Kolaboro" badge for your website and listings, and visibility to international buyers who check projects on Kolaboro. Paying never changes your Score. <a href="/developers">How verification works</a>',
            '<b>Qué recibes:</b> una página independiente con tu Trust Score, el sello "Verified by Kolaboro" para tu web y anuncios, y visibilidad ante compradores internacionales que revisan proyectos en Kolaboro. Pagar nunca cambia tu nota. <a href="/developers">Cómo funciona</a>'),
           ('>Name<', '>Nombre<'), ('>Continue<', '>Continuar<'), ('Phone (optional)', 'Teléfono (opcional)'),
           ('Three quick questions for agents', 'Tres preguntas rápidas para agentes'), ('Do you live in this city full-time?', '¿Vives en esta ciudad todo el año?'),
           ('Your background', 'Tu experiencia'), ('Languages you speak', 'Idiomas que hablas'), ('>Choose<', '>Elige<'),
           ('I agree that Kolaboro can contact me by email about this request. See our <a href="/legal/privacy">privacy policy</a>.',
            'Acepto que Kolaboro me contacte por email sobre esta solicitud. Ver la <a href="/legal/privacy">política de privacidad</a>.'),
           ('>Send<', '>Enviar<'), ("Sent. We'll be in touch.", 'Enviado. Te contestamos pronto.'),
           ('We reply by email within two working days. While you wait:', 'Respondemos por email en dos días laborables. Mientras tanto:'),
           ('See what a Kolaboro inspection report looks like', 'Mira cómo es un informe de inspección'),
           ('Go through the 20-point before-you-sign checklist', 'Repasa el checklist de 20 puntos antes de firmar'),
           ('Check if a promised rental yield is realistic', 'Comprueba si la rentabilidad prometida es realista')]
    for a, b in rep: html_ = html_.replace(a, b)
    return html_

def build_es():
    body = f'''<section class="phero"><div class="wrap">
  <h1>Nunca vuelvas a comprar una casa en el extranjero solo.</h1>
  <p class="lead">Una red de agentes locales que trabajan para el comprador, nunca para el vendedor. Formados con IA, verificados sobre el terreno y respaldados por todos los compradores que vinieron antes que tú.</p>
  <div class="hero-cta"><a class="btn btn-hi" href="#start" data-role="buyer" data-ev="es_cta_hero">Proteger mi compra</a><a class="btn btn-line" href="/check">Comprobar un proyecto</a></div>
  <p class="launch"><i aria-hidden="true"></i>Empezamos ciudad a ciudad. Primero Bali.</p>
</div></section>
<section class="problem"><div class="wrap">
  <h2>Lo más caro que vas a comprar en tu vida, y lo compras a ciegas.</h2>
  <p class="lead">Has visto los renders, has hecho la videollamada y has firmado. Pero no has visto el terreno, no conoces al notario y no has comprobado los permisos.</p>
  <div class="sides">
    <div class="side them"><h3>Del lado del promotor</h3><ul><li>Un equipo de ventas entrenado para cerrar</li><li>Abogados que escribieron el contrato</li><li>Marketing que vende el sueño</li><li>Gente sobre el terreno cada día</li></ul></div>
    <div class="side you"><h3>De tu lado</h3><p class="big">Un PDF y una promesa.</p><p>Kolaboro pone a alguien de tu lado.</p></div>
  </div>
</div></section>
<section class="how"><div class="wrap">
  <h2>De la primera visita a las llaves, alguien te cubre las espaldas.</h2>
  <ol class="track">
    <li><div class="node">1</div><h3>Verifica antes de firmar</h3><p>Título, zonificación, permisos y el historial real del promotor. Ves las alertas antes de pagar nada.</p></li>
    <li><div class="node">2</div><h3>Mira cómo se construye</h3><p>Vídeo con GPS y fecha de tu propiedad en cada hito. Sin fotos preparadas.</p></li>
    <li><div class="node">3</div><h3>Paga cuando sea real</h3><p>Antes de cada pago, tu agente confirma el hito en la obra y te dice si es seguro pagar.</p></li>
    <li><div class="node">4</div><h3>Recibe las llaves a tu manera</h3><p>Una inspección final hecha por alguien que trabaja para ti.</p></li>
  </ol>
</div></section>
<section class="sec alt" id="precios"><div class="wrap">
  <h2>Precios claros. Los pagas tú, nunca el promotor.</h2>
  <div class="grid3" style="margin-top:40px">
    <div class="tile"><h3>Chequeo antes de comprar</h3><p class="price">490 €</p><p class="per">pago único por propiedad</p><ul><li>Título y zonificación verificados</li><li>Permisos e historial del promotor</li><li>Contrato revisado</li><li>Visita con vídeo GPS</li><li>Informe en 7 días</li></ul></div>
    <div class="tile hot"><span class="tag">El más elegido</span><h3>Seguimiento de obra</h3><p class="price">99 €</p><p class="per">al mes por propiedad</p><ul><li>Visita mensual con GPS</li><li>Hito verificado antes de cada pago</li><li>"Puedes pagar" o "espera"</li><li>Alertas de retraso</li><li>Inspección de entrega</li></ul></div>
    <div class="tile"><h3>Agente del comprador</h3><p class="price">1%</p><p class="per">del precio, mínimo 2.000 €</p><ul><li>Todo lo anterior</li><li>Proyectos verificados</li><li>Apoyo en la negociación</li><li>Coordina notario y abogado</li><li>Nunca cobra del promotor</li></ul></div>
  </div>
</div></section>
<section class="start" id="start"><div class="wrap start-grid">
  <div><h2>Hablemos.</h2><p class="lead">Dinos quién eres y dónde compras. Respondemos por email en dos días laborables.</p></div>
  <div>{es_form(lead_form("esform", source="yc-home-es"))}</div>
</div></section>'''
    path = page('/es', 'Kolaboro: nunca compres una casa en el extranjero solo', 'Agentes locales que trabajan para el comprador: verifican el terreno, los permisos y cada hito de obra antes de que pagues.', body)
    fp = os.path.join(OUT, 'es', 'index.html'); s = open(fp).read()
    for a, b in ES_UI: s = s.replace(a, b)
    s = s.replace('<link rel="canonical" href="https://kolaboro.com/es/">', '<link rel="canonical" href="https://kolaboro.com/es/"><link rel="alternate" hreflang="es" href="https://kolaboro.com/es/"><link rel="alternate" hreflang="en" href="https://kolaboro.com/">')
    open(fp, 'w').write(s)
    return path

LESSONS = {
 1: ("How property is sold abroad", "who's who and where the incentives point", [
   ("The people in a sale", "A typical overseas purchase involves the developer, a sales agent (often paid by the developer), a notary who formalises the deal, sometimes a lawyer, and the buyer. Only the buyer's own lawyer and a Kolaboro agent work for the buyer."),
   ("Follow the money", "Ask who pays each person. Sales agents earn when the buyer signs, so their job is to close. Your job is to make sure the buyer signs only what is true."),
   ("Exercise", "For a project in your city, list every person involved in a sale and who pays them.")]),
 3: ("Zoning and permits", "what can legally be built and rented", [
   ("Zoning first", "Zoning decides what a plot can be used for. A villa on land zoned for agriculture or protection may never get permits, whatever the seller says."),
   ("Permits next", "Check the building approval for the project and, once built, the certificate that it's fit for use. Renting to tourists needs its own licence."),
   ("Exercise", "Find the official zoning for one plot in your area and write down which uses are allowed.")]),
 5: ("The site visit", "what to film, in what order, and how to prove where and when", [
   ("Before you go", "Read the contract milestone you are checking. Know exactly what should exist on the day."),
   ("On site", "Start every video at the entrance with the street or a landmark, keep location and time on, then walk the property in one continuous take. Film each element of the milestone up close, then from far away."),
   ("Proof", "Never edit the video. Upload it straight from your phone so the location, time and file fingerprint are kept."),
   ("Exercise", "Film a 3-minute visit of any building under construction following these rules.")]),
 6: ("Reading construction progress", "telling a finished milestone from a staged one", [
   ("What finished looks like", "Foundations are poured and cured, structure carries the roof, the roof is closed. Formwork, a few columns or materials on site are not a finished milestone."),
   ("Common tricks", "Work concentrated where the camera points, photos of a different unit, or a show villa presented as progress on yours."),
   ("Exercise", "Compare a developer's progress photo with your own visit and list every difference.")]),
 7: ("Contracts for non-lawyers", "the clauses that protect buyers and the ones that don't", [
   ("Look for", "Payments tied to milestones, a delivery date with a penalty or refund, which law applies, what happens if the project stops, and who holds the title until handover."),
   ("Warning signs", "Payments by calendar date, no penalty for delay, the right for the developer to change the design or price, and disputes only in a far-away court."),
   ("Your role", "You don't give legal advice. You flag what is missing so the buyer can ask their own lawyer."),
   ("Exercise", "Read a sample contract and list the five clauses above, or note that they're missing.")]),
 8: ("Writing the report", "clear findings and a verdict a buyer can act on", [
   ("Structure", "What the contract promised, what you found, evidence for each finding, and a verdict: safe to pay, safe with a condition, or hold."),
   ("Style", "Short sentences. Facts before opinions. Say 'I couldn't verify' when you couldn't."),
   ("Exercise", "Write a one-page report from the visit you filmed in lesson 5.")]),
 9: ("Ethics and independence", "why we never take money from sellers", [
   ("The rule", "You work for the buyer. No money, gifts, trips or commission from developers or sellers, ever."),
   ("Pressure", "Developers may offer favours or push back on findings. Write down every approach and tell your city lead the same day."),
   ("Exercise", "Describe how you would answer a developer who offers you a commission on every sale you 'help with'.")]),
 10: ("Working with buyers", "explaining risk calmly from thousands of kilometres away", [
   ("Be clear", "Lead with the verdict, then the reasons. Buyers abroad are anxious; vagueness makes it worse."),
   ("Be fair", "Say what is good as well as what is wrong. You are not there to kill deals, only bad ones."),
   ("Exercise", "Record a 2-minute voice note explaining a 'hold' verdict to a buyer.")]),
}

EXAM = [
 ("Who should a Kolaboro agent never accept money from?", ["The buyer", "Kolaboro", "The developer or seller"], 2),
 ("A developer sends great progress photos. What do you do?", ["Approve the payment", "Visit and film the milestone yourself", "Ask the sales agent"], 1),
 ("The land is zoned for agriculture and the project is villas. What does that mean?", ["Nothing, zoning is a formality", "A major red flag for permits", "The price should be lower"], 1),
 ("Which payment structure protects the buyer best?", ["Payments by calendar date", "50% upfront to lock the price", "Payments tied to verified milestones"], 2),
 ("You couldn't verify the title this week. What goes in the report?", ["Assume it's fine", "Say clearly that it isn't verified yet", "Leave it out"], 1),
 ("How should a site video be recorded?", ["Edited into a short highlight", "One continuous take with location and time on", "Using the developer's drone footage"], 1),
 ("A contract has no penalty for late delivery. You should…", ["Ignore it", "Flag it so the buyer asks their lawyer", "Tell the buyer not to buy"], 1),
 ("A developer offers you a trip to 'see their other projects'. You…", ["Accept, it's research", "Decline and tell your city lead", "Accept if the buyer agrees"], 1),
]

def lesson_page(n, data):
    t, sub, parts = data
    secs = ''.join(f'<h2>{h}</h2><p>{p}</p>' for h, p in parts)
    nxt = n + 1 if n < 10 else None
    nav = f'<p style="margin-top:36px"><a class="btn btn-line" href="/academy">All lessons</a> ' + (f'<a class="btn btn-hi" href="/academy/{nxt}">Next lesson</a>' if nxt and nxt in LESSONS else '<a class="btn btn-hi" href="/academy/exam">Take the exam</a>') + '</p>'
    body = phero(f'<a href="/academy">Academy</a> / Lesson {n}', f'Lesson {n}: {t}', sub[0].upper() + sub[1:] + '.')
    body += f'<section class="sec"><div class="wrap prose">{secs}{nav}</div></section>'
    return page(f'/academy/{n}', f'Lesson {n}: {t} | Kolaboro academy', f'Kolaboro agent academy, lesson {n}: {sub}.', body)

def build_academy_more():
    out = [lesson_page(n, d) for n, d in LESSONS.items()]
    qs = ''
    for i, (q, opts, ans) in enumerate(EXAM):
        qs += f'<fieldset class="f exq" data-a="{ans}" style="border:0"><legend style="font-weight:700;margin-bottom:8px">{i+1}. {q}</legend><div class="opts">' + ''.join(
            f'<label class="opt"><input type="radio" name="q{i}" value="{j}"><span>{o}</span></label>' for j, o in enumerate(opts)) + '</div></fieldset>'
    body = phero('<a href="/academy">Academy</a> / Exam', 'The agent entry exam', f'{len(EXAM)} questions on independence, evidence and judgement. Score 7 or more and apply with your result.')
    body += f'''<section class="sec"><div class="wrap" style="max-width:820px">
<form id="ex" onsubmit="return false" style="display:grid;gap:24px">{qs}
<p class="err" id="exerr" role="alert"></p><button class="btn btn-hi" type="submit" style="justify-self:start">See my score</button></form>
<div class="ok" id="exres" role="status" tabindex="-1"></div>
</div></section>'''
    js = '''<script>
(function(){
  var f = document.getElementById('ex'), out = document.getElementById('exres');
  f.addEventListener('submit', function(){
    var qs = f.querySelectorAll('.exq'), score = 0, miss = 0;
    qs.forEach(function(q, i){ var c = f.querySelector('input[name=q'+i+']:checked'); if (!c) miss++; else if (+c.value === +q.dataset.a) score++; });
    if (miss) { document.getElementById('exerr').textContent = 'Answer all ' + qs.length + ' questions.'; return; }
    document.getElementById('exerr').textContent = '';
    var pass = score >= 7; f.style.display = 'none'; out.style.display = 'block';
    out.innerHTML = '<h3>' + score + ' of ' + qs.length + (pass ? ': you passed.' : ': not yet.') + '</h3><p>' + (pass ? 'Apply now and mention your score. We review every application personally.' : 'Read the lessons again and retake the exam.') + '</p><p style="margin-top:14px"><a class="btn btn-hi" href="' + (pass ? '/agents?project=Exam%20score%20' + score + '%2F' + qs.length + '#start' : '/academy') + '">' + (pass ? 'Apply as an agent' : 'Back to the lessons') + '</a></p>';
    out.focus(); if (window.kbEvent) kbEvent('academy_exam', { score: score });
  });
})();
</script>'''
    out.append(page('/academy/exam', 'Agent entry exam | Kolaboro academy', 'Eight questions every Kolaboro agent must pass: independence, evidence and judgement.', body, extra_js=js, mcta=False))
    # link lessons from the academy index
    fp = os.path.join(OUT, 'academy', 'index.html'); s = open(fp).read()
    for n in LESSONS:
        s = s.replace(f'<h3>{ACADEMY[n-1][0]}</h3><p>{ACADEMY[n-1][1]} <span class="ev">For trainees</span>', f'<h3><a href="/academy/{n}">{ACADEMY[n-1][0]}</a></h3><p>{ACADEMY[n-1][1]} <a href="/academy/{n}">Read the lesson</a>')
    s = s.replace('<section class="sec"><div class="wrap" style="max-width:900px"><ol class="lessons">', '<section class="sec"><div class="wrap" style="max-width:900px"><p style="margin-bottom:12px"><a class="btn btn-hi" href="/academy/exam" data-ev="academy_exam_cta">Take the entry exam</a></p><ol class="lessons">')
    open(fp, 'w').write(s)
    return out

def check_autocomplete():
    fp = os.path.join(OUT, 'check', 'index.html'); s = open(fp).read()
    names = ['Sample Residences', 'Sample Developer'] + [f'Projects in {d}' for d in ['Bali', 'Lombok', 'Dubai', 'Phuket', 'Tulum', 'the Algarve']]
    dl = '<datalist id="cqlist">' + ''.join(f'<option value="{H.escape(n)}">' for n in names) + '</datalist>'
    s = s.replace('<input id="cqi" name="q"', dl + '<input id="cqi" name="q" list="cqlist" autocomplete="off"', 1)
    open(fp, 'w').write(s)

def self_host_fonts():
    os.makedirs(os.path.join(OUT, 'k', 'fonts'), exist_ok=True)
    for f in ('archivo-latin.woff2', 'archivo-latin-ext.woff2'):
        shutil.copy(os.path.join(HERE, 'k', 'fonts', f), os.path.join(OUT, 'k', 'fonts', f))
    ff = '''@font-face{font-family:'Archivo';font-style:normal;font-weight:100 900;font-stretch:62% 125%;font-display:swap;src:url(/k/fonts/archivo-latin-ext.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'Archivo';font-style:normal;font-weight:100 900;font-stretch:62% 125%;font-display:swap;src:url(/k/fonts/archivo-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
'''
    css = os.path.join(OUT, 'k', 'site.css'); old = open(css).read(); open(css, 'w').write(ff + old)
    gf = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
          '<link href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,100..900;1,62..125,100..900&display=swap" rel="stylesheet">')
    pre = '<link rel="preload" href="/k/fonts/archivo-latin.woff2" as="font" type="font/woff2" crossorigin>'
    for root, _, files in os.walk(OUT):
        for fn in files:
            if fn.endswith('.html'):
                p = os.path.join(root, fn); s = open(p).read()
                if gf in s: open(p, 'w').write(s.replace(gf, pre))

def build_round4():
    out = [build_es()] + build_academy_more()
    check_autocomplete()
    return out
