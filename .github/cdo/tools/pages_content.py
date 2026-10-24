# Contenido de las paginas de servicios, casos, charlas y publicos (EN/ES). Solo hechos publicados en la web.
def cards(items):
    return '<ul class="grid" style="list-style:none;padding:0">' + ''.join(
        f'<li class="card"><h3 style="font-size:21px;margin:0 0 6px">{h}</h3><p style="margin:0;color:var(--ink-2)">{p}</p></li>' for h, p in items) + '</ul>'
def steps(items):
    return '<ol class="grid" style="list-style:none;padding:0">' + ''.join(
        f'<li class="card"><b style="font:700 13px var(--mono,monospace);color:var(--acc,#C2452D)">{i+1:02d}</b><h3 style="font-size:20px;margin:6px 0">{h}</h3><p style="margin:0;color:var(--ink-2)">{p}</p></li>' for i, (h, p) in enumerate(items)) + '</ol>'
def nums(items):
    return '<div class="grid">' + ''.join(f'<div class="card"><b style="display:block;font-size:34px;line-height:1">{n}</b><span style="color:var(--ink-2)">{l}</span></div>' for n, l in items) + '</div>'
def para(*ps): return ''.join(f'<p style="max-width:70ch">{p}</p>' for p in ps)
def bullets(items): return '<ul style="max-width:70ch">' + ''.join(f'<li>{x}</li>' for x in items) + '</ul>'

G_EN = [('/', 'Carlos de Ory'), ('/growth/', 'Growth')]
G_ES = [('/', 'Carlos de Ory'), ('/agencia/', 'Growth')]
S_EN = [('/', 'Carlos de Ory'), ('/speaking/', 'Speaking')]
S_ES = [('/', 'Carlos de Ory'), ('/charlas/', 'Charlas')]

def svc_en(slug, title, h1, lead, what, how, measure, need, faq, eyebrow='Growth marketing'):
    return dict(path=f'/growth/{slug}/', section='growth', title=title, desc=lead.replace('<b>', '').replace('</b>', '')[:155], eyebrow=eyebrow, h1=h1, lead=lead,
                crumbs=G_EN + [(None, title)], ctas=[(f'/growth/?project={title}#start', 'Tell me about your company'), ('/growth/#calc', 'Work out your cost per customer')],
                sections=[{'h': 'What we do', 'html': cards(what)}, {'h': 'How we work', 'html': steps(how)}, {'h': 'What we measure', 'html': bullets(measure)}, {'h': 'What we need from you', 'html': bullets(need)}],
                faq=faq, end_h='Tell me where you are today', end_p='Two minutes on the form saves us a call. I answer personally.', end_href=f'/growth/?project={title}#start', end_cta='Tell me about your company')
def svc_es(slug, title, h1, lead, what, how, measure, need, faq, eyebrow='Growth marketing'):
    return dict(path=f'/agencia/{slug}/', section='growth', title=title, desc=lead.replace('<b>', '').replace('</b>', '')[:155], eyebrow=eyebrow, h1=h1, lead=lead,
                crumbs=G_ES + [(None, title)], ctas=[(f'/agencia/?project={title}#start', 'Cuéntame tu empresa'), ('/agencia/#calc', 'Calcula tu coste por cliente')],
                sections=[{'h': 'Qué hacemos', 'html': cards(what)}, {'h': 'Cómo trabajamos', 'html': steps(how)}, {'h': 'Qué medimos', 'html': bullets(measure)}, {'h': 'Qué necesitamos de ti', 'html': bullets(need)}],
                faq=faq, end_h='Cuéntame dónde estás hoy', end_p='Dos minutos en el formulario nos ahorran una llamada. Te contesto yo personalmente.', end_href=f'/agencia/?project={title}#start', end_cta='Cuéntame tu empresa')

HOW_EN = [('Check-in', 'A call to understand your company, your numbers and your goal.'), ('Take-off', 'A plan with priorities and the first campaigns live.'), ('Cruising altitude', 'Weekly tests and reports. We keep what works and scale it.')]
HOW_ES = [('Check-in', 'Una llamada para entender tu empresa, tus números y tu objetivo.'), ('Despegue', 'Un plan con prioridades y las primeras campañas en marcha.'), ('Velocidad de crucero', 'Pruebas e informes cada semana. Nos quedamos con lo que funciona y lo escalamos.')]

PAGES = [
 # ---------- SERVICIOS ----------
 {'en': svc_en('google-ads', 'Google Ads', 'Google Ads that pay for themselves.',
   'Search and Performance Max campaigns built around <b>cost per customer</b>, not clicks. Run by the team behind Happy Low Cost, RealHunt and SupportNear.',
   [('Search', 'Campaigns on the searches your customers already make, with the words that convert and without the ones that only spend.'), ('Performance Max', 'When it fits, fed with your best customers and with conversion tracking you can trust.'), ('Landing pages', 'Pages built for each campaign, so the click lands where the promise was made.'), ('Tracking', 'Conversions measured from the ad to the sale or the lead, not only to the form.')],
   HOW_EN, ['Cost per customer and cost per lead', 'Revenue per euro spent', 'Search terms that waste budget', 'Landing page conversion rate'],
   ['Access to your Google Ads account (or we create one in your name)', 'Your margins or the value of a customer', 'Someone who can answer leads quickly'],
   [('Who owns the account?', 'You do. Campaigns are created in your account and you keep everything if we stop working together.'), ('How fast do we see results?', 'Search campaigns usually show useful data in the first weeks. We decide with numbers, not with feelings.'), ('Do you need a minimum budget?', 'No fixed minimum. The calculator on the growth page shows what your budget can realistically buy.')]),
  'es': svc_es('google-ads', 'Google Ads', 'Google Ads que se pagan solos.',
   'Campañas de búsqueda y Performance Max pensadas en <b>coste por cliente</b>, no en clics. Las lleva el equipo detrás de Happy Low Cost, RealHunt y SupportNear.',
   [('Búsqueda', 'Campañas en las búsquedas que ya hacen tus clientes, con las palabras que convierten y sin las que solo gastan.'), ('Performance Max', 'Cuando encaja, alimentada con tus mejores clientes y con una medición de conversiones fiable.'), ('Landing pages', 'Páginas hechas para cada campaña, para que el clic llegue a donde se hizo la promesa.'), ('Medición', 'Conversiones medidas desde el anuncio hasta la venta o el contacto, no solo hasta el formulario.')],
   HOW_ES, ['Coste por cliente y por contacto', 'Ingresos por euro invertido', 'Búsquedas que gastan sin convertir', 'Conversión de cada landing'],
   ['Acceso a tu cuenta de Google Ads (o la creamos a tu nombre)', 'Tus márgenes o lo que vale un cliente', 'Alguien que conteste rápido a los contactos'],
   [('¿De quién es la cuenta?', 'Tuya. Las campañas se crean en tu cuenta y te quedas con todo si dejamos de trabajar juntos.'), ('¿Cuándo se ven resultados?', 'Las campañas de búsqueda suelen dar datos útiles en las primeras semanas. Decidimos con números, no con sensaciones.'), ('¿Hay presupuesto mínimo?', 'No hay un mínimo fijo. La calculadora de la página de growth muestra lo que tu presupuesto puede conseguir.')])},
 {'en': svc_en('meta-ads', 'Meta Ads', 'Meta ads people stop scrolling for.',
   'Facebook and Instagram campaigns with creatives that earn attention and are measured by <b>cost per customer</b>. The same approach that took one RealHunt post to 516,173 views.',
   [('Creatives', 'Hooks, images and short videos tested in batches, keeping only what lowers the cost per result.'), ('Audiences', 'Broad targeting fed with your real customers, retargeting and lookalikes when they help.'), ('Conversions API', 'Server-side tracking so the algorithm learns from real sales, not only from clicks.'), ('Offers', 'Lead magnets, calculators and guides that turn a cold scroll into a contact.')],
   HOW_EN, ['Cost per customer and cost per lead', 'Hook rate and hold rate of each creative', 'Frequency and fatigue', 'Revenue per euro spent'],
   ['Access to your Business Manager and ad account', 'Photos, videos or permission to create them', 'Your best customer, described in one paragraph'],
   [('Organic or paid?', 'Both work together. Organic posts show what people share; the best ones become ads.'), ('Do you make the creatives?', 'Yes. We write, design and test them, and you approve before anything goes live.'), ('How do you report?', 'Weekly, with what we tested, what we keep and what we change.')]),
  'es': svc_es('meta-ads', 'Meta Ads', 'Anuncios en Meta que hacen parar el scroll.',
   'Campañas en Facebook e Instagram con creatividades que ganan atención, medidas por <b>coste por cliente</b>. El mismo enfoque que llevó una publicación de RealHunt a 516.173 visualizaciones.',
   [('Creatividades', 'Ganchos, imágenes y vídeos cortos probados por tandas, quedándonos solo con lo que baja el coste por resultado.'), ('Audiencias', 'Segmentación amplia alimentada con tus clientes reales, retargeting y similares cuando ayudan.'), ('API de conversiones', 'Medición desde el servidor para que el algoritmo aprenda de ventas reales, no solo de clics.'), ('Ofertas', 'Lead magnets, calculadoras y guías que convierten un scroll frío en un contacto.')],
   HOW_ES, ['Coste por cliente y por contacto', 'Retención del gancho de cada creatividad', 'Frecuencia y desgaste', 'Ingresos por euro invertido'],
   ['Acceso a tu Business Manager y a la cuenta publicitaria', 'Fotos, vídeos o permiso para crearlos', 'Tu mejor cliente, descrito en un párrafo'],
   [('¿Orgánico o pago?', 'Los dos juntos. Lo orgánico enseña qué comparte la gente; lo mejor se convierte en anuncio.'), ('¿Hacéis las creatividades?', 'Sí. Las escribimos, diseñamos y probamos, y tú apruebas antes de publicar nada.'), ('¿Cómo informáis?', 'Cada semana: qué probamos, con qué nos quedamos y qué cambiamos.')])},
 {'en': svc_en('seo', 'SEO and content', 'SEO that keeps bringing customers.',
   'Pages and articles that rank and keep bringing visits <b>without paying for each one</b>, plus the technical work that lets Google read your site.',
   [('Technical SEO', 'Broken links, redirects, sitemaps, speed, structured data and indexing, fixed and monitored.'), ('Content that ranks', 'Guides and pages built on what your customers search, written to answer, not to fill.'), ('Programmatic pages', 'When your data allows it, hundreds of useful pages generated from it, like RealHunt rankings.'), ('Internal linking', 'Every page connected to the ones that sell, so authority flows to where it pays.')],
   HOW_EN, ['Organic clicks and leads by page', 'Rankings for the searches that matter', 'Pages indexed and errors in Search Console', 'Speed and Core Web Vitals'],
   ['Access to Search Console and analytics', 'Access to your CMS or code repository', 'An expert in your business for 30 minutes a month'],
   [('How long does SEO take?', 'Technical fixes can show results in weeks. Content usually takes months to compound; we plan with that in mind.'), ('Do you write with AI?', 'We use AI to research and draft faster, and people who know the subject to make it right.'), ('Can you fix an existing site?', 'Yes. On this very site we took 2,529 broken internal links to zero in one day.')]),
  'es': svc_es('seo', 'SEO y contenido', 'SEO que sigue trayendo clientes.',
   'Páginas y artículos que posicionan y siguen trayendo visitas <b>sin pagar por cada una</b>, más el trabajo técnico para que Google entienda tu web.',
   [('SEO técnico', 'Enlaces rotos, redirecciones, sitemaps, velocidad, datos estructurados e indexación, arreglados y vigilados.'), ('Contenido que posiciona', 'Guías y páginas basadas en lo que buscan tus clientes, escritas para responder, no para rellenar.'), ('Páginas programáticas', 'Cuando tus datos lo permiten, cientos de páginas útiles generadas a partir de ellos, como los rankings de RealHunt.'), ('Enlazado interno', 'Cada página conectada con las que venden, para que la autoridad llegue a donde da dinero.')],
   HOW_ES, ['Clics orgánicos y contactos por página', 'Posiciones en las búsquedas que importan', 'Páginas indexadas y errores en Search Console', 'Velocidad y Core Web Vitals'],
   ['Acceso a Search Console y a la analítica', 'Acceso a tu CMS o repositorio de código', 'Una persona experta en tu negocio 30 minutos al mes'],
   [('¿Cuánto tarda el SEO?', 'Los arreglos técnicos pueden notarse en semanas. El contenido suele tardar meses en dar fruto; lo planificamos así.'), ('¿Escribís con IA?', 'Usamos IA para investigar y redactar más rápido, y personas que conocen el tema para que quede bien.'), ('¿Podéis arreglar una web existente?', 'Sí. En esta misma web pasamos de 2.529 enlaces internos rotos a cero en un día.')])},
 {'en': svc_en('funnels', 'Funnels and automation', 'Funnels that turn visits into sales.',
   'Landing pages, email and WhatsApp follow-ups that answer every lead <b>in minutes, not days</b>, and measure where each sale came from.',
   [('Landing pages', 'One page per offer, fast on mobile, with one clear next step.'), ('Lead magnets', 'Guides, calculators and checklists that earn an email honestly.'), ('Email and WhatsApp', 'Automatic replies, welcome sequences and reminders, written in your voice.'), ('CRM and alerts', 'Every lead stored, scored and sent to the right person straight away.')],
   HOW_EN, ['Visit to lead conversion', 'Time to first answer', 'Lead to customer rate', 'Revenue by source'],
   ['Your current tools (CRM, email, forms) or freedom to set up new ones', 'The questions customers ask before buying', 'Someone who closes the sales'],
   [('What tools do you use?', 'Whatever fits your size: from your current CRM to Supabase, Resend and Cloudflare, which run this site.'), ('Do you replace my sales team?', 'No. We make sure every lead reaches them quickly and with context.'), ('Is WhatsApp automation allowed?', 'Yes, through the official WhatsApp Business platform and with the contact’s consent.')]),
  'es': svc_es('embudos', 'Embudos y automatización', 'Embudos que convierten visitas en ventas.',
   'Landing pages, emails y seguimiento por WhatsApp que contestan cada contacto <b>en minutos, no en días</b>, y miden de dónde viene cada venta.',
   [('Landing pages', 'Una página por oferta, rápida en el móvil, con un único siguiente paso claro.'), ('Lead magnets', 'Guías, calculadoras y checklists que se ganan el email de forma honesta.'), ('Email y WhatsApp', 'Respuestas automáticas, secuencias de bienvenida y recordatorios escritos con tu voz.'), ('CRM y avisos', 'Cada contacto guardado, puntuado y enviado a la persona adecuada al momento.')],
   HOW_ES, ['Conversión de visita a contacto', 'Tiempo hasta la primera respuesta', 'Conversión de contacto a cliente', 'Ingresos por origen'],
   ['Tus herramientas actuales (CRM, email, formularios) o libertad para montar otras', 'Las preguntas que hacen los clientes antes de comprar', 'Alguien que cierre las ventas'],
   [('¿Qué herramientas usáis?', 'Las que encajen con tu tamaño: desde tu CRM actual hasta Supabase, Resend y Cloudflare, con los que funciona esta web.'), ('¿Sustituís a mi equipo comercial?', 'No. Hacemos que cada contacto le llegue rápido y con contexto.'), ('¿Se puede automatizar WhatsApp?', 'Sí, con la plataforma oficial de WhatsApp Business y con el consentimiento del contacto.')])},
]

# ---------- CASOS (proyectos propios, cifras publicadas en la web) ----------
def case(lang, slug, title, h1, lead, numbers, story, lessons, src_href, src_label):
    en = lang == 'en'
    base = '/growth/' if en else '/agencia/'
    return dict(path=f'{base}{slug}/', section='growth', title=title, desc=lead[:155], eyebrow='Case study' if en else 'Caso', h1=h1, lead=lead,
                crumbs=(G_EN if en else G_ES) + [(None, title)], ctas=[(f'{base}#start', 'Tell me about your company' if en else 'Cuéntame tu empresa'), (src_href, src_label)],
                sections=[{'h': 'The numbers' if en else 'Las cifras', 'html': nums(numbers)}, {'h': 'What we did' if en else 'Qué hicimos', 'html': para(*story)}, {'h': 'What you can take from it' if en else 'Qué puedes aplicar', 'html': bullets(lessons)}],
                faq=None, end_h='Want the same for your company?' if en else '¿Quieres lo mismo para tu empresa?', end_p='Tell me where you are and where you want to be.' if en else 'Cuéntame dónde estás y adónde quieres llegar.', end_href=f'{base}#start', end_cta='Tell me about your company' if en else 'Cuéntame tu empresa')

PAGES += [
 {'en': case('en', 'case-realhunt', 'RealHunt case study', 'RealHunt: 19,920 people in 11 days with €0 on ads.',
   'How a ranking of cheap homes grew from posts people wanted to share, measured on the site and not on social media.',
   [('516,173', 'views of one post on X'), ('19,920', 'people on RealHunt in 11 days'), ('13,205', 'of them in a single day'), ('360', 'accounts created')],
   ['Instead of paying for ads, we posted things people want to share: a home on Lake Como for €46,000, Italy with sea views for €39,000, a whole house in Italy for €13,000.',
    'Each post sent people to a product we own. Between 13 and 23 September 2026, 15,544 visitors came to RealHunt from X; 122 joined the newsletter and 148 set a price alert.',
    'The site was ready for the spike: pages that load fast, a clear next step on every page and alerts that bring people back.'],
   ['Give people something they want to share and point it at something you own.', 'Measure on your site, not on the platform: views are not customers.', 'Prepare the product for the day it works: one lucky post is useless if the site falls over.'],
   '/ten-days-eco-beach-city-realhunt-surfranking/', 'Read the full story'),
  'es': case('es', 'caso-realhunt', 'Caso RealHunt', 'RealHunt: 19.920 personas en 11 días con 0 € en anuncios.',
   'Cómo un ranking de casas baratas creció con publicaciones que la gente quería compartir, medido en la web y no en las redes.',
   [('516.173', 'visualizaciones de una publicación en X'), ('19.920', 'personas en RealHunt en 11 días'), ('13.205', 'de ellas en un solo día'), ('360', 'cuentas creadas')],
   ['En vez de pagar anuncios, publicamos lo que la gente quiere compartir: una casa en el lago de Como por 46.000 €, Italia con vistas al mar por 39.000 €, una casa entera en Italia por 13.000 €.',
    'Cada publicación llevaba a un producto propio. Entre el 13 y el 23 de septiembre de 2026 llegaron 15.544 visitantes a RealHunt desde X; 122 se apuntaron a la newsletter y 148 crearon una alerta de precio.',
    'La web estaba lista para el pico: páginas rápidas, un siguiente paso claro en cada página y alertas que hacen volver a la gente.'],
   ['Da a la gente algo que quiera compartir y apúntalo a algo tuyo.', 'Mide en tu web, no en la plataforma: las visualizaciones no son clientes.', 'Prepara el producto para el día que funcione: una publicación con suerte no sirve si la web se cae.'],
   '/ten-days-eco-beach-city-realhunt-surfranking/', 'Leer la historia completa')},
 {'en': case('en', 'case-supportnear', 'SupportNear case study', 'SupportNear: 37,307 places in 147 countries, almost for free.',
   'A free map of places where anyone can eat, sleep, shower or get help, built fast and cheap to prove the idea before scaling it.',
   [('37,307', 'places'), ('722', 'cities'), ('147', 'countries'), ('13', 'languages')],
   ['It started as a single file with 12,638 places across Spain, to check whether the idea worked before building anything real.',
    'It worked, so it grew to 147 countries: no sign-up, no cookie wall, no app to install, and a button with emergency numbers that works without signal.',
    'Quality control depends on users: corrections and new places sent through the site.'],
   ['Prove the idea with the smallest possible version.', 'Remove every step between the user and the answer.', 'Let the people who use it improve it.'],
   '/supportnear-free-help-map/', 'Read the full story'),
  'es': case('es', 'caso-supportnear', 'Caso SupportNear', 'SupportNear: 37.307 lugares en 147 países, casi gratis.',
   'Un mapa gratuito de sitios donde cualquiera puede comer, dormir, ducharse o pedir ayuda, hecho rápido y barato para probar la idea antes de escalarla.',
   [('37.307', 'lugares'), ('722', 'ciudades'), ('147', 'países'), ('13', 'idiomas')],
   ['Empezó como un único archivo con 12.638 lugares en España, para comprobar si la idea funcionaba antes de construir nada serio.',
    'Funcionó, así que creció a 147 países: sin registro, sin muro de cookies, sin app que instalar y con un botón de teléfonos de emergencia que funciona sin cobertura.',
    'El control de calidad depende de los usuarios: correcciones y lugares nuevos enviados desde la web.'],
   ['Prueba la idea con la versión más pequeña posible.', 'Quita cada paso entre el usuario y la respuesta.', 'Deja que quien lo usa lo mejore.'],
   '/supportnear-free-help-map/', 'Leer la historia completa')},
 {'en': case('en', 'case-happy-low-cost', 'Happy Low Cost case study', 'Happy Low Cost: 300,000+ flights booked through our deals.',
   'The travel deals community that taught me most of what I know about growth, started in 2014.',
   [('300,000+', 'flights booked through our deals'), ('1,000,000+', 'followers across our communities'), ('2014', 'year it started')],
   ['Happy Low Cost publishes travel deals people actually book. The growth came from being useful first: deals worth sharing, published fast, in the channels where travellers already are.',
    'Every deal links to the place where it can be booked, and the commission pays for the work.'],
   ['Usefulness is the best growth channel.', 'Speed matters: a deal is only a deal for a few hours.', 'Build a community you own, not only followers on one platform.'],
   '/', 'More about my projects'),
  'es': case('es', 'caso-happy-low-cost', 'Caso Happy Low Cost', 'Happy Low Cost: más de 300.000 vuelos reservados con nuestras ofertas.',
   'La comunidad de ofertas de viaje que me enseñó casi todo lo que sé de crecimiento, nacida en 2014.',
   [('300.000+', 'vuelos reservados con nuestras ofertas'), ('1.000.000+', 'seguidores en nuestras comunidades'), ('2014', 'año en que empezó')],
   ['Happy Low Cost publica ofertas de viaje que la gente reserva de verdad. El crecimiento llegó por ser útiles primero: ofertas que merece la pena compartir, publicadas rápido, en los canales donde ya están los viajeros.',
    'Cada oferta enlaza al sitio donde se puede reservar, y la comisión paga el trabajo.'],
   ['Ser útil es el mejor canal de crecimiento.', 'La velocidad importa: una oferta solo lo es unas horas.', 'Construye una comunidad propia, no solo seguidores en una plataforma.'],
   '/', 'Más sobre mis proyectos')},
]

# ---------- CHARLAS ----------
def talk(lang, slug, code, title, h1, lead, abstract, takeaways, audiences, src_href, src_label, talk_key):
    en = lang == 'en'
    base = '/speaking/' if en else '/charlas/'
    return dict(path=f'{base}{slug}/', section='speaking', title=title, desc=lead[:155], eyebrow=(f'Keynote · {code}' if en else f'Ponencia · {code}'), h1=h1, lead=lead,
                og='/assets/cdo/og-speaking.jpg', crumbs=(S_EN if en else S_ES) + [(None, title)],
                ctas=[(f'{base}?talk={talk_key}#request', 'Check availability' if en else 'Consultar disponibilidad'), (f'/assets/cdo/carlos-de-ory-speaker-kit-{lang}.pdf', 'Speaker kit (PDF)' if en else 'Dossier (PDF)')],
                sections=[{'h': 'What it is about' if en else 'De qué va', 'html': para(*abstract)}, {'h': 'What the audience leaves with' if en else 'Con qué se va el público', 'html': bullets(takeaways)},
                          {'h': 'Format' if en else 'Formato', 'html': bullets(audiences)}],
                faq=None, schema={'@context': 'https://schema.org', '@type': 'Service', 'serviceType': 'Keynote' if en else 'Conferencia', 'name': title, 'provider': {'@type': 'Person', 'name': 'Carlos de Ory', 'url': 'https://www.carlosdeory.com/'}, 'areaServed': 'Worldwide', 'availableLanguage': ['en', 'es']},
                end_h='Bring this talk to your event' if en else 'Lleva esta charla a tu evento', end_p='Tell me the date, the city or if it is online, and who will be in the room.' if en else 'Cuéntame la fecha, la ciudad o si es online, y quién estará en la sala.',
                end_href=f'{base}#request', end_cta='Request a date' if en else 'Pedir fecha')
FMT_EN = ['Length: 30 to 60 minutes', 'Keynote, workshop, fireside chat or panel', 'In English or Spanish, on stage or online', 'Adapted to your sector and audience']
FMT_ES = ['Duración: de 30 a 60 minutos', 'Conferencia, taller, entrevista en el escenario o mesa redonda', 'En español o en inglés, presencial u online', 'Adaptada a tu sector y a tu público']
PAGES += [
 {'en': talk('en', 'the-day-you-stop-waiting', 'CO 001', 'The day you stop waiting', 'The day you stop waiting.',
   'Why most people don’t fail for lack of talent: they fail because they wait too long to start. A keynote from the first chapter of my book.',
   ['There is a moment almost nobody remembers: the day we start waiting. For more money, for feeling ready, for someone to believe in us. Meanwhile life goes on, and people with less talent start the projects we kept imagining.',
    'The talk is about the difference between being busy and moving forward, about preparation that becomes a hiding place, and about the freedom of accepting that nobody is coming to rescue you.'],
   ['One honest question to separate progress from busyness', 'Why planning can be an elegant form of fear', 'A concrete first step to take the same week'],
   FMT_EN, '/the-day-you-stop-waiting/', 'Read chapter 1', 'waiting'),
  'es': talk('es', 'el-dia-que-dejas-de-esperar', 'CO 001', 'El día que dejas de esperar', 'El día que dejas de esperar.',
   'Por qué la mayoría no fracasa por falta de talento, sino por esperar demasiado para empezar. Una charla basada en el primer capítulo de mi libro.',
   ['Hay un momento que casi nadie recuerda: el día en que empezamos a esperar. A tener más dinero, a sentirnos preparados, a que alguien crea en nosotros. Mientras tanto la vida sigue, y gente con menos talento empieza los proyectos que llevábamos años imaginando.',
    'La charla va de la diferencia entre estar ocupado y avanzar, de la preparación que se convierte en escondite y de la libertad de aceptar que nadie viene a rescatarte.'],
   ['Una pregunta honesta para separar el progreso de estar ocupado', 'Por qué planificar puede ser una forma elegante de miedo', 'Un primer paso concreto para dar esa misma semana'],
   FMT_ES, '/el-dia-que-dejas-de-esperar/', 'Leer el capítulo 1', 'waiting')},
 {'en': talk('en', 'zero-to-300000-flights', 'CO 014', 'From zero to 300,000 flights', 'From zero to 300,000 flights.',
   'How Happy Low Cost grew a community past one million followers, and what it teaches about growth today.',
   ['Happy Low Cost started in 2014 with travel deals. More than 300,000 flights have been booked through them, and its communities passed one million followers.',
    'The talk explains the growth decisions behind it and how the same ideas work today with social media, AI and products that people want to share, with recent examples such as RealHunt.'],
   ['Why being useful beats being clever in marketing', 'How to build a community you own', 'How to measure growth on your site, not on the platform'],
   FMT_EN, '/growth/case-happy-low-cost/', 'Read the case', 'flights'),
  'es': talk('es', 'de-cero-a-300000-vuelos', 'CO 014', 'De cero a 300.000 vuelos', 'De cero a 300.000 vuelos.',
   'Cómo Happy Low Cost creó una comunidad de más de un millón de seguidores y qué enseña hoy sobre crecimiento.',
   ['Happy Low Cost nació en 2014 con ofertas de viaje. Se han reservado más de 300.000 vuelos con ellas y sus comunidades superaron el millón de seguidores.',
    'La charla explica las decisiones de crecimiento que hay detrás y cómo funcionan hoy las mismas ideas con redes, IA y productos que la gente quiere compartir, con ejemplos recientes como RealHunt.'],
   ['Por qué ser útil gana a ser ingenioso en marketing', 'Cómo construir una comunidad propia', 'Cómo medir el crecimiento en tu web y no en la plataforma'],
   FMT_ES, '/agencia/caso-happy-low-cost/', 'Leer el caso', 'flights')},
 {'en': talk('en', 'building-a-town-from-an-island', 'CO 023', 'Building a town from an island', 'Building a town from an island.',
   'The story of Eco Beach City on Sumba: building a real place, remotely, one hour from Bali.',
   ['Sumba is about 400 kilometres east of Bali and receives a tiny fraction of its visitors. On its north coast we are building Eco Beach City: a restaurant, a coworking space with a sea view, padel and tennis courts, a gym, our own water supply and Starlink, already running.',
    'The talk is about building something physical from far away, about remote work making new places possible, and about doing things in the opposite order: services first, people after.'],
   ['How remote work changes where companies and people can live', 'How to run a real project from another continent', 'Why the infrastructure should arrive before the crowd'],
   FMT_EN, '/beachfront-town-sumba/', 'Read the story', 'town'),
  'es': talk('es', 'construir-un-pueblo-desde-una-isla', 'CO 023', 'Construir un pueblo desde una isla', 'Construir un pueblo desde una isla.',
   'La historia de Eco Beach City en Sumba: levantar un lugar real, en remoto, a una hora de Bali.',
   ['Sumba está a unos 400 kilómetros al este de Bali y recibe una parte mínima de sus visitantes. En su costa norte construimos Eco Beach City: restaurante, coworking con vistas al mar, pistas de pádel y tenis, gimnasio, agua propia y Starlink, ya en marcha.',
    'La charla va de construir algo físico desde lejos, de cómo el trabajo en remoto hace posibles lugares nuevos y de hacer las cosas al revés: primero los servicios, después la gente.'],
   ['Cómo el trabajo en remoto cambia dónde pueden vivir empresas y personas', 'Cómo llevar un proyecto real desde otro continente', 'Por qué la infraestructura debe llegar antes que la gente'],
   FMT_ES, '/sumba-vs-bali-honest-comparison/', 'Leer sobre Sumba', 'town')},
]

# ---------- PUBLICOS ----------
def aud(lang, slug, title, h1, lead, why, fit, talks_note):
    en = lang == 'en'
    base = '/speaking/' if en else '/charlas/'
    t_links = (['<a href="/speaking/the-day-you-stop-waiting/">The day you stop waiting</a>', '<a href="/speaking/zero-to-300000-flights/">From zero to 300,000 flights</a>', '<a href="/speaking/building-a-town-from-an-island/">Building a town from an island</a>'] if en else
               ['<a href="/charlas/el-dia-que-dejas-de-esperar/">El día que dejas de esperar</a>', '<a href="/charlas/de-cero-a-300000-vuelos/">De cero a 300.000 vuelos</a>', '<a href="/charlas/construir-un-pueblo-desde-una-isla/">Construir un pueblo desde una isla</a>'])
    return dict(path=f'{base}{slug}/', section='speaking', title=title, desc=lead[:155], eyebrow='Speaking' if en else 'Charlas', h1=h1, lead=lead, og='/assets/cdo/og-speaking.jpg',
                crumbs=(S_EN if en else S_ES) + [(None, title)], ctas=[(f'{base}#request', 'Request a date' if en else 'Pedir fecha'), (f'/assets/cdo/carlos-de-ory-speaker-kit-{lang}.pdf', 'Speaker kit (PDF)' if en else 'Dossier (PDF)')],
                sections=[{'h': 'Why it works here' if en else 'Por qué encaja', 'html': cards(why)}, {'h': 'How it fits your programme' if en else 'Cómo encaja en tu programa', 'html': bullets(fit)},
                          {'h': 'Talks' if en else 'Charlas', 'html': para(talks_note) + bullets(t_links)}],
                faq=None, end_h='Tell me about your event' if en else 'Cuéntame tu evento', end_p='Date, city or online, audience and what you want people to leave with.' if en else 'Fecha, ciudad u online, público y con qué quieres que se vaya la gente.', end_href=f'{base}#request', end_cta='Request a date' if en else 'Pedir fecha')
PAGES += [
 {'en': aud('en', 'corporate-events', 'Keynotes for company events', 'Keynotes for kick-offs and company events.',
   'A talk about starting, growing and building from far away, for teams that need energy and something concrete to do on Monday.',
   [('Real stories', 'Companies built and numbers published, not theory.'), ('Practical', 'Every talk ends with steps people can take the same week.'), ('In two languages', 'English or Spanish, for international teams.')],
   ['Opening or closing keynote of 30 to 60 minutes', 'Workshop for leadership or marketing teams', 'Fireside chat with your CEO', 'Online for distributed teams'],
   'The three keynotes can be tuned to your company and sector:'),
  'es': aud('es', 'eventos-de-empresa', 'Conferencias para eventos de empresa', 'Conferencias para convenciones y eventos de empresa.',
   'Una charla sobre empezar, crecer y construir desde lejos, para equipos que necesitan energía y algo concreto que hacer el lunes.',
   [('Historias reales', 'Empresas construidas y cifras publicadas, no teoría.'), ('Práctica', 'Cada charla termina con pasos que se pueden dar esa misma semana.'), ('En dos idiomas', 'Español o inglés, para equipos internacionales.')],
   ['Conferencia de apertura o cierre de 30 a 60 minutos', 'Taller para equipos directivos o de marketing', 'Entrevista en el escenario con tu CEO', 'Online para equipos en remoto'],
   'Las tres conferencias se adaptan a tu empresa y sector:')},
 {'en': aud('en', 'universities', 'Talks for universities and business schools', 'Talks for universities and business schools.',
   'I started my first business at 16. Students hear what it really takes to start, from someone who is still building.',
   [('Started at 16', 'A first business before university, and more than 20 years building companies since.'), ('Honest', 'What went wrong as well as what worked.'), ('Useful', 'A first step students can take before the term ends.')],
   ['Guest lecture or keynote of 30 to 60 minutes', 'Workshop on validating an idea quickly', 'Q&A session with entrepreneurship students', 'Online for remote programmes'],
   'Talks that work especially well with students:'),
  'es': aud('es', 'universidades', 'Charlas para universidades y escuelas de negocio', 'Charlas para universidades y escuelas de negocio.',
   'Monté mi primer negocio con 16 años. Los estudiantes escuchan lo que de verdad hace falta para empezar, de alguien que sigue construyendo.',
   [('Empezó con 16 años', 'Un primer negocio antes de la universidad y más de 20 años creando empresas desde entonces.'), ('Honesto', 'Lo que salió mal, no solo lo que funcionó.'), ('Útil', 'Un primer paso que los estudiantes pueden dar antes de acabar el curso.')],
   ['Clase magistral o conferencia de 30 a 60 minutos', 'Taller para validar una idea rápido', 'Sesión de preguntas con estudiantes de emprendimiento', 'Online para programas en remoto'],
   'Charlas que funcionan especialmente bien con estudiantes:')},
 {'en': aud('en', 'online-events', 'Online keynotes and webinars', 'Online keynotes and webinars.',
   'Talks designed for screens: shorter blocks, live questions and a clear takeaway, from Europe, Sumba or wherever your audience is.',
   [('Built for screens', 'Short blocks and live interaction instead of a long monologue.'), ('Stable connection', 'Tested setups, including from Sumba with Starlink.'), ('Any time zone', 'Sessions for Europe, the Americas or Asia.')],
   ['Webinar of 30 to 45 minutes with Q&A', 'Online workshop with exercises', 'Recorded talk for your platform', 'Interview format for podcasts and streams'],
   'All three keynotes are available online:'),
  'es': aud('es', 'eventos-online', 'Conferencias online y webinars', 'Conferencias online y webinars.',
   'Charlas pensadas para pantalla: bloques más cortos, preguntas en directo y una idea clara para llevarse, desde Europa, Sumba o donde esté tu público.',
   [('Pensadas para pantalla', 'Bloques cortos e interacción en directo en vez de un monólogo largo.'), ('Conexión estable', 'Montajes probados, también desde Sumba con Starlink.'), ('Cualquier horario', 'Sesiones para Europa, América o Asia.')],
   ['Webinar de 30 a 45 minutos con preguntas', 'Taller online con ejercicios', 'Charla grabada para tu plataforma', 'Formato entrevista para podcasts y directos'],
   'Las tres conferencias están disponibles online:')},
]

# ---------- KIT PARA PODCASTS ----------
PAGES += [
 {'en': dict(path='/speaking/podcast-guest/', section='speaking', title='Podcast guest kit', desc='Topics, suggested questions and bio for podcasts and interviews with Carlos de Ory, in English or Spanish.',
   eyebrow='Speaking', h1='Invite me to your podcast.', lead='Topics I can talk about with real stories and numbers, suggested questions and a short bio to read on air. In English or Spanish.',
   og='/assets/cdo/og-speaking.jpg', crumbs=S_EN + [(None, 'Podcast guest kit')], ctas=[('/speaking/?talk=podcast#request', 'Invite me'), ('/assets/cdo/carlos-de-ory-speaker-kit-en.pdf', 'Speaker kit (PDF)')],
   sections=[{'h': 'Topics', 'html': cards([('Starting before you feel ready', 'From a first business at 16 to the book I am writing.'), ('Growth without ads', 'Happy Low Cost, RealHunt and posts people want to share.'), ('Building from an island', 'Eco Beach City on Sumba and remote work.'), ('Points and miles', 'Flying business class for almost nothing, from the Million Mile Playbook.')])},
             {'h': 'Suggested questions', 'html': bullets(['What did you start at 16, and what did it teach you?', 'Why do most people wait too long to start?', 'How did Happy Low Cost reach 300,000 flights booked?', 'How did one post bring 13,205 people to RealHunt in a day?', 'Why build a town on Sumba instead of Bali?', 'What is the one trick in the Million Mile Playbook worth more than the other twenty?'])},
             {'h': 'Short bio to read on air', 'html': para('Carlos de Ory started his first business at 16 and has been building companies for more than 20 years, from Happy Low Cost to Eco Beach City on Sumba. In 2022 Forbes España included him among the 100 most creative people in business. He is writing a book about building companies and a life you choose.')}],
   faq=None, end_h='Book me for your show', end_p='Tell me the name of the podcast, the audience and a few possible dates.', end_href='/speaking/?talk=podcast#request', end_cta='Invite me'),
  'es': dict(path='/charlas/podcast/', section='speaking', title='Kit para podcasts', desc='Temas, preguntas sugeridas y bio para podcasts y entrevistas con Carlos de Ory, en español o en inglés.',
   eyebrow='Charlas', h1='Invítame a tu podcast.', lead='Temas de los que puedo hablar con historias y cifras reales, preguntas sugeridas y una bio corta para leer en antena. En español o en inglés.',
   og='/assets/cdo/og-speaking.jpg', crumbs=S_ES + [(None, 'Kit para podcasts')], ctas=[('/charlas/?talk=podcast#request', 'Invitarme'), ('/assets/cdo/carlos-de-ory-speaker-kit-es.pdf', 'Dossier (PDF)')],
   sections=[{'h': 'Temas', 'html': cards([('Empezar antes de sentirte preparado', 'De un primer negocio con 16 años al libro que estoy escribiendo.'), ('Crecer sin anuncios', 'Happy Low Cost, RealHunt y publicaciones que la gente quiere compartir.'), ('Construir desde una isla', 'Eco Beach City en Sumba y el trabajo en remoto.'), ('Puntos y millas', 'Volar en business casi gratis, del Million Mile Playbook.')])},
             {'h': 'Preguntas sugeridas', 'html': bullets(['¿Qué montaste con 16 años y qué te enseñó?', '¿Por qué la mayoría espera demasiado para empezar?', '¿Cómo llegó Happy Low Cost a 300.000 vuelos reservados?', '¿Cómo llevó una publicación a 13.205 personas a RealHunt en un día?', '¿Por qué construir un pueblo en Sumba y no en Bali?', '¿Cuál es el truco del Million Mile Playbook que vale más que los otros veinte?'])},
             {'h': 'Bio corta para leer en antena', 'html': para('Carlos de Ory montó su primer negocio con 16 años y lleva más de 20 años creando empresas, de Happy Low Cost a Eco Beach City en Sumba. En 2022 Forbes España lo incluyó entre las 100 personas más creativas de los negocios. Está escribiendo un libro sobre crear empresas y una vida elegida.')}],
   faq=None, end_h='Reserva una entrevista', end_p='Cuéntame el nombre del podcast, el público y algunas fechas posibles.', end_href='/charlas/?talk=podcast#request', end_cta='Invitarme')},
]
