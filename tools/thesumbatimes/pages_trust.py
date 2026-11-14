# -*- coding: utf-8 -*-
"""Transparency pages for The Sumba Times (Google News policies, Trust Project indicators, JTI), in en/es/id:
  /LANG/standards/   editorial standards and ethics
  /LANG/corrections/ corrections policy + automatic log of every item with an "updated" field
  /LANG/ai-policy/   how AI is used and its limits
  /LANG/sources/     how sources are ranked + automatic table of the outlets cited most (from every item's "sources")
  /LANG/ownership/   who publishes and funds the site
  /LANG/contact/     how to reach the newsroom (email and the existing forms, no phone)
  /LANG/team/        the newsroom, described as it is (no invented people)
Wiring (build.py): `import pages_trust` and add it to MODULES. Helpers for build.py:
  publishing_principles(l) -> absolute URL of the standards page
  trust_footer_links(l)    -> HTML links for the footer
  org_ld_extra(l)          -> dict of extra NewsMediaOrganization properties (absolute URLs)
Every statement here describes how the site really works (EDITORIAL.md, README.md, check.py, build.py). If the
way of working changes, change the text and REVIEWED."""
import json, html, collections, urllib.parse

BASE = "https://thesumbatimes.com"
REVIEWED = "2026-11-14"
KEYS = ["standards", "corrections", "ai-policy", "sources", "ownership", "contact", "team"]
SITEMAP = ["/{l}/" + k + "/" for k in KEYS]
LD_TYPE = {"standards": "WebPage", "corrections": "WebPage", "ai-policy": "WebPage", "sources": "WebPage",
           "ownership": "AboutPage", "contact": "ContactPage", "team": "AboutPage"}
TOP_N = 40   # rows in the table of most cited outlets

CSS = """.tru h2{margin-top:1.5em}.tru .rev{font:13px -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:var(--muted);margin:0 0 1.2em}
.tru .box{border:1px solid var(--line);border-left:3px solid var(--accent);background:var(--card);padding:12px 16px;margin:16px 0}.tru .box p{margin:.3em 0}
.tru td.n,.tru th.n{text-align:right;white-space:nowrap}.tru .more{border-top:3px double var(--line);margin-top:2.2em;padding-top:.6em}.tru .more ul{columns:2;column-gap:28px;padding-left:1.1em}
@media(max-width:560px){.tru .more ul{columns:1}}"""

def esc(s): return html.escape(str(s), quote=True)

# ---------------------------------------------------------------- shared strings
T = {
 "en": {"rev": "Last reviewed 14 November 2026", "more": "How we work", "about": "About The Sumba Times", "press": "Press room",
        "nav": {"standards": "Editorial standards and ethics", "corrections": "Corrections", "ai-policy": "AI policy", "sources": "Our sources",
                "ownership": "Ownership and funding", "contact": "Contact the newsroom", "team": "The newsroom"},
        "foot": {"standards": "Standards", "corrections": "Corrections", "ai-policy": "AI policy", "ownership": "Ownership", "contact": "Contact"},
        "log_th": ["Updated", "Story", "First published"], "log_none": "No story has been changed after publication so far.",
        "log_note": "Note", "src_th": ["Outlet", "Type", "Citations"],
        "kind": {"official": "Official or primary", "media": "News media", "ref": "Reference and travel"},
        "src_sum": "{items} stories and guides, {cites} source links, {outlets} different outlets. Counted on {d}."},
 "es": {"rev": "Última revisión: 14 de noviembre de 2026", "more": "Cómo trabajamos", "about": "Sobre The Sumba Times", "press": "Sala de prensa",
        "nav": {"standards": "Normas editoriales y principios éticos", "corrections": "Fe de errores", "ai-policy": "Uso de la inteligencia artificial", "sources": "Nuestras fuentes",
                "ownership": "Propiedad y financiación", "contact": "Contacto con la redacción", "team": "La redacción"},
        "foot": {"standards": "Normas editoriales", "corrections": "Fe de errores", "ai-policy": "Uso de la IA", "ownership": "Propiedad", "contact": "Contacto"},
        "log_th": ["Actualizado", "Información", "Primera publicación"], "log_none": "Hasta la fecha no se ha modificado ninguna información después de publicarla.",
        "log_note": "Nota", "src_th": ["Fuente", "Tipo", "Citas"],
        "kind": {"official": "Oficial o primaria", "media": "Medio de comunicación", "ref": "Consulta y viajes"},
        "src_sum": "{items} noticias y guías, {cites} enlaces a fuentes, {outlets} fuentes distintas. Recuento del {d}."},
 "id": {"rev": "Terakhir ditinjau 14 November 2026", "more": "Cara kami bekerja", "about": "Tentang The Sumba Times", "press": "Ruang pers",
        "nav": {"standards": "Pedoman redaksi dan etika", "corrections": "Ralat dan koreksi", "ai-policy": "Kebijakan penggunaan AI", "sources": "Sumber kami",
                "ownership": "Kepemilikan dan pendanaan", "contact": "Hubungi redaksi", "team": "Redaksi"},
        "foot": {"standards": "Pedoman redaksi", "corrections": "Koreksi", "ai-policy": "Kebijakan AI", "ownership": "Kepemilikan", "contact": "Kontak"},
        "log_th": ["Diperbarui", "Artikel", "Pertama terbit"], "log_none": "Sampai saat ini belum ada artikel yang diubah setelah terbit.",
        "log_note": "Catatan", "src_th": ["Sumber", "Jenis", "Kutipan"],
        "kind": {"official": "Resmi atau primer", "media": "Media massa", "ref": "Rujukan dan perjalanan"},
        "src_sum": "{items} berita dan panduan, {cites} tautan sumber, {outlets} sumber berbeda. Dihitung pada {d}."},
}

# ---------------------------------------------------------------- page texts
# Tokens: [L] language code, [MAIL] mailto link, [EBC] link to the publisher, [LOG] corrections log, [TABLE] outlets table, [SUM] table summary.
P = {}

P["standards"] = {
 "en": ("Editorial standards and ethics",
  "The rules The Sumba Times works to: where our facts come from, how we keep the news apart from our publisher and what we will not publish.",
  """<p>The Sumba Times is a small online newspaper about one island. It is published by a company with interests on that island, and much of its daily work is done with AI tools. Both facts make clear rules more necessary, not less. These are ours. They apply to every story and guide, in English, Spanish and Indonesian.</p>
<h2 id="accuracy">Accuracy</h2>
<ul><li>Every fact in a story comes from a source that was opened and read. We do not invent facts, figures, names, dates or quotes.</li>
<li>If a figure comes from a single source, the story says so. If sources disagree, we give both versions and name them.</li>
<li>We write "according to" for claims we cannot confirm ourselves, and we do not present forecasts or plans as things that have happened.</li>
<li>Dates are written in full and times are given in Sumba time (WITA, UTC+8).</li>
<li>A slow news day gets an explainer or a service piece. It never gets a story padded with guesses.</li></ul>
<h2 id="sourcing">Sourcing</h2>
<p>Our stories are built from published sources, and every one of them is linked at the end of the story so that any reader can check our work. Primary and official sources come first, established media second. The <a href="/[L]/sources/">sources page</a> explains the ranking and lists the outlets we cite most.</p>
<p>The Sumba Times does not, as a rule, send reporters into the field. Unless a story says otherwise, it contains no original on-the-ground reporting: it gathers, checks and explains what official bodies and other media have published, for readers who cannot follow the Indonesian press. We do not use anonymous sources.</p>
<h2 id="quotes">Quotes</h2>
<p>We quote people only as their words were published elsewhere, with their name, their role and the outlet that published them. We do not interview by proxy, tidy up quotes or put words into anyone's mouth. Translations of quotes are our own and keep the meaning of the original.</p>
<h2 id="neutrality">Neutrality</h2>
<p>News stories report; they do not campaign. We do not take sides in local politics, land disputes or business rivalries, and when a story involves a conflict we give the published positions of the parties. Headlines say what happened, without exaggeration and without questions the story does not answer.</p>
<h2 id="ethics">Separation from the publisher</h2>
<p>The Sumba Times is published by <a href="/[L]/ownership/">Eco Beach City (PT Eco Beach City)</a>, which operates Villa Eco Beach and has a development project on Sumba. The publisher sets the general editorial line: a neutral, sourced newspaper about the whole island. It does not get coverage in return.</p>
<ul><li>Eco Beach City is never the subject of a news story, and we do not report on its commercial or legal matters.</li>
<li>Anything that comes from the publisher, or mentions a property it runs, is labelled as such on the page.</li>
<li>Every page carries a line saying who publishes the site.</li></ul>
<h2 id="conflicts">Conflicts of interest</h2>
<p>Our main conflict of interest is plain: the publisher is a tourism and property business on the island we cover. We deal with it by declaring it on every page, by keeping the publisher out of the news, and by covering other hotels, projects and businesses on the same terms as any other subject. If a story touches an interest of the publisher that a reader might not expect, the story says so.</p>
<h2 id="paid">No paid coverage</h2>
<p>Nobody can pay to appear in The Sumba Times, to be left out of it or to change what a story says. We publish no sponsored articles and no advertorials, and we take no payment, free stays or gifts in exchange for coverage. We do not link to hotel booking pages or to affiliate pages.</p>
<h2 id="hotels">No hotel promotion</h2>
<p>News stories do not promote any hotel, resort or villa, our publisher's included. Hotels appear in the business pages when they are news (an opening, an investment, jobs), reported neutrally from published sources. Where a guide lists places to stay, it is a factual list, not a ranking, and the property run by our publisher is marked as such. Our photos do not show hotels or their grounds.</p>
<h2 id="communities">Respect for communities and for Marapu</h2>
<p>Sumba is home to people, not a backdrop. We write about villages, clans and families with the care we would want for our own.</p>
<ul><li>Marapu is a living religion. We describe its ceremonies from published sources, explain local terms the first time they appear and do not treat rites, tombs or funerals as attractions.</li>
<li>We never create AI images of sacred Marapu rituals or of real people.</li>
<li>Dates of the Pasola and other ceremonies are set by the ratos (priests). We publish them as announced by the sources we cite and say so when they are not yet confirmed.</li>
<li>We do not publish photos of identifiable private people without consent, and we take particular care with children.</li>
<li>Where we tell visitors how to behave in a village, we follow what local communities and authorities have asked for.</li></ul>
<h2 id="photos">Photos and licences</h2>
<p>We prefer real photographs of Sumba with a licence that allows reuse (Wikimedia Commons, Unsplash, Pexels). Each photo carries its author, its licence and a link to the original. When no suitable real photo exists we may use an AI-generated illustration; it is always labelled "AI-generated illustration" in the caption and is never presented as a photograph. See the <a href="/[L]/ai-policy/">AI policy</a>.</p>
<h2 id="errors">When we get it wrong</h2>
<p>We correct errors in the open, with a date. The <a href="/[L]/corrections/">corrections page</a> explains how, lists every story changed after publication and tells you how to report a mistake. You can also write to [MAIL].</p>"""),
 "es": ("Normas editoriales y principios éticos",
  "Las reglas con las que trabaja The Sumba Times: de dónde proceden los datos, cómo se separa la información del editor y qué no se publica.",
  """<p>The Sumba Times es un periódico digital pequeño dedicado a una sola isla. Lo edita una empresa con intereses en esa isla y buena parte del trabajo diario se hace con herramientas de inteligencia artificial. Ambas circunstancias hacen más necesarias, no menos, unas normas claras. Estas son las nuestras. Obligan en todas las noticias y guías, en inglés, español e indonesio.</p>
<h2 id="accuracy">Rigor</h2>
<ul><li>Todo dato publicado procede de una fuente que se ha abierto y leído. No se inventan hechos, cifras, nombres, fechas ni declaraciones.</li>
<li>Cuando una cifra procede de una sola fuente, el texto lo advierte. Si las fuentes discrepan, se ofrecen las dos versiones y se identifica cada una.</li>
<li>Lo que la redacción no puede confirmar por sí misma se atribuye de forma expresa ("según..."). Las previsiones y los proyectos no se presentan como hechos consumados.</li>
<li>Las fechas se escriben completas y las horas se dan en la hora de Sumba (WITA, UTC+8).</li>
<li>Un día sin noticias se resuelve con una información explicativa o de servicio, nunca con un texto relleno de suposiciones.</li></ul>
<h2 id="sourcing">Fuentes</h2>
<p>Las informaciones se elaboran a partir de fuentes publicadas, y todas ellas se enlazan al final del texto para que cualquier lector pueda comprobar el trabajo de la redacción. Las fuentes primarias y oficiales tienen preferencia; después, los medios de comunicación asentados. La página de <a href="/[L]/sources/">fuentes</a> explica esa jerarquía y recoge las más citadas.</p>
<p>The Sumba Times no desplaza, por norma, reporteros al terreno. Salvo que el texto indique lo contrario, sus informaciones no contienen trabajo propio sobre el terreno: reúnen, contrastan y explican lo que han publicado los organismos oficiales y otros medios, para lectores que no pueden seguir la prensa indonesia. No se emplean fuentes anónimas.</p>
<h2 id="quotes">Declaraciones</h2>
<p>Las declaraciones se reproducen únicamente tal y como se han publicado en otro lugar, con el nombre de quien habla, su cargo y el medio que las recogió. La redacción no retoca las citas ni atribuye a nadie palabras que no ha dicho. Las traducciones son propias y respetan el sentido del original.</p>
<h2 id="neutrality">Neutralidad</h2>
<p>Las noticias informan, no hacen campaña. El periódico no toma partido en la política local, en los conflictos de tierras ni en las rivalidades entre empresas; cuando una información recoge un conflicto, da cuenta de las posiciones publicadas de las partes. Los titulares dicen lo que ha ocurrido, sin exagerar y sin preguntas que el texto no responda.</p>
<h2 id="ethics">Separación respecto del editor</h2>
<p>The Sumba Times lo edita <a href="/[L]/ownership/">Eco Beach City (PT Eco Beach City)</a>, empresa que gestiona Villa Eco Beach y desarrolla un proyecto en Sumba. El editor fija la línea editorial general: un periódico neutral y documentado sobre toda la isla. A cambio no recibe cobertura.</p>
<ul><li>Eco Beach City nunca es objeto de una noticia, y el periódico no informa sobre sus asuntos comerciales o legales.</li>
<li>Todo contenido que procede del editor, o que menciona un establecimiento gestionado por él, se identifica como tal en la página.</li>
<li>Todas las páginas indican quién edita el sitio.</li></ul>
<h2 id="conflicts">Conflictos de intereses</h2>
<p>El principal conflicto de intereses es evidente: el editor es una empresa turística e inmobiliaria en la isla sobre la que se informa. Se afronta declarándolo en todas las páginas, dejando al editor fuera de las noticias y tratando a los demás hoteles, proyectos y negocios con los mismos criterios que a cualquier otro asunto. Si una información afecta a un interés del editor que el lector no tendría por qué conocer, el texto lo advierte.</p>
<h2 id="paid">Sin contenidos pagados</h2>
<p>Nadie puede pagar por aparecer en The Sumba Times, por no aparecer o por modificar una información. No se publican artículos patrocinados ni publirreportajes, y no se aceptan pagos, estancias gratuitas ni regalos a cambio de cobertura. Tampoco se enlaza a páginas de reservas hoteleras ni a páginas de afiliación.</p>
<h2 id="hotels">Sin promoción de hoteles</h2>
<p>Las noticias no promocionan ningún hotel, complejo o villa, tampoco los del editor. Los hoteles aparecen en las páginas de economía cuando son noticia (una apertura, una inversión, empleo) y se tratan de forma neutral a partir de fuentes publicadas. Cuando una guía enumera alojamientos, se trata de una relación de datos, no de una clasificación, y el establecimiento que gestiona el editor figura señalado como tal. Las fotografías no muestran hoteles ni sus instalaciones.</p>
<h2 id="communities">Respeto a las comunidades y al marapu</h2>
<p>Sumba es el hogar de quienes viven en ella, no un decorado. De las aldeas, los clanes y las familias se escribe con el cuidado que cualquiera querría para los suyos.</p>
<ul><li>El marapu es una religión viva. Sus ceremonias se describen a partir de fuentes publicadas, los términos locales se explican la primera vez que aparecen y los ritos, las tumbas y los funerales no se presentan como atracciones.</li>
<li>Nunca se generan con inteligencia artificial imágenes de rituales sagrados del marapu ni de personas reales.</li>
<li>Las fechas de la Pasola y de otras ceremonias las fijan los ratos (sacerdotes). Se publican tal y como las anuncian las fuentes citadas y se advierte cuando aún no están confirmadas.</li>
<li>No se publican fotografías de particulares identificables sin su consentimiento, y se extrema el cuidado con los menores.</li>
<li>Las recomendaciones de comportamiento en las aldeas siguen lo que han pedido las comunidades y las autoridades locales.</li></ul>
<h2 id="photos">Fotografías y licencias</h2>
<p>Se prefieren las fotografías reales de Sumba con una licencia que permita reutilizarlas (Wikimedia Commons, Unsplash, Pexels). Cada imagen lleva su autor, su licencia y un enlace al original. Cuando no existe una fotografía real adecuada puede emplearse una ilustración generada con inteligencia artificial; el pie la identifica siempre como "Ilustración generada con IA" y nunca se presenta como una fotografía. Véase la página sobre el <a href="/[L]/ai-policy/">uso de la inteligencia artificial</a>.</p>
<h2 id="errors">Cuando nos equivocamos</h2>
<p>Los errores se rectifican a la vista y con fecha. La <a href="/[L]/corrections/">fe de errores</a> explica el procedimiento, recoge todas las informaciones modificadas después de su publicación e indica cómo avisar de un fallo. También se puede escribir a [MAIL].</p>"""),
 "id": ("Pedoman redaksi dan etika",
  "Aturan kerja The Sumba Times: asal setiap fakta, pemisahan berita dari penerbit, serta hal-hal yang tidak kami terbitkan.",
  """<p>The Sumba Times adalah media daring kecil yang memberitakan satu pulau. Media ini diterbitkan oleh perusahaan yang memiliki kepentingan di pulau tersebut, dan sebagian besar pekerjaan hariannya dibantu perangkat kecerdasan buatan (AI). Kedua hal itu justru menuntut aturan yang jelas. Inilah pedoman kami. Pedoman ini berlaku untuk semua berita dan panduan, dalam bahasa Inggris, Spanyol, dan Indonesia.</p>
<div class="box"><p>The Sumba Times berupaya mengikuti <strong>Pedoman Pemberitaan Media Siber</strong> yang ditetapkan Dewan Pers serta Kode Etik Jurnalistik. Ini adalah komitmen redaksi, bukan pernyataan bahwa media ini telah terverifikasi atau tersertifikasi Dewan Pers.</p></div>
<h2 id="accuracy">Verifikasi dan akurasi</h2>
<ul><li>Setiap fakta dalam berita berasal dari sumber yang benar-benar dibuka dan dibaca. Kami tidak mengarang fakta, angka, nama, tanggal, ataupun kutipan.</li>
<li>Jika suatu angka hanya berasal dari satu sumber, hal itu disebutkan dalam berita. Jika sumber berbeda pendapat, kedua versi dimuat dan sumbernya disebutkan.</li>
<li>Hal yang tidak dapat kami pastikan sendiri ditulis dengan atribusi yang jelas ("menurut..."). Prakiraan dan rencana tidak disajikan sebagai peristiwa yang sudah terjadi.</li>
<li>Tanggal ditulis lengkap dan waktu memakai waktu Sumba (WITA, UTC+8).</li>
<li>Pada hari yang sepi berita, kami menerbitkan tulisan penjelasan atau informasi layanan, bukan berita yang diisi dugaan.</li></ul>
<h2 id="sourcing">Sumber berita</h2>
<p>Berita kami disusun dari sumber yang telah dipublikasikan, dan semuanya ditautkan di akhir tulisan agar pembaca dapat memeriksanya. Sumber primer dan resmi diutamakan, disusul media massa yang mapan. Halaman <a href="/[L]/sources/">sumber kami</a> menjelaskan urutan itu dan memuat daftar sumber yang paling sering dikutip.</p>
<p>The Sumba Times pada umumnya tidak menurunkan wartawan ke lapangan. Kecuali disebutkan dalam tulisan, berita kami tidak memuat liputan lapangan sendiri: kami menghimpun, memeriksa, dan menjelaskan keterangan yang telah diterbitkan lembaga resmi dan media lain. Kami tidak memakai narasumber anonim.</p>
<h2 id="quotes">Kutipan</h2>
<p>Kutipan hanya dimuat sebagaimana telah diterbitkan di tempat lain, lengkap dengan nama, jabatan, dan media yang memuatnya. Redaksi tidak mengubah isi kutipan dan tidak menaruh pernyataan pada orang yang tidak mengucapkannya. Terjemahan kutipan dibuat redaksi dengan menjaga makna aslinya.</p>
<h2 id="neutrality">Keberimbangan</h2>
<p>Berita menyampaikan peristiwa, bukan berkampanye. Kami tidak berpihak dalam politik lokal, sengketa tanah, ataupun persaingan usaha. Jika suatu berita menyangkut konflik, kami memuat sikap para pihak sebagaimana telah dipublikasikan. Judul menyatakan apa yang terjadi, tanpa dilebih-lebihkan.</p>
<h2 id="ethics">Pemisahan redaksi dari penerbit</h2>
<p>The Sumba Times diterbitkan oleh <a href="/[L]/ownership/">Eco Beach City (PT Eco Beach City)</a>, pengelola Villa Eco Beach yang juga memiliki proyek pengembangan di Sumba. Penerbit menetapkan garis besar kebijakan redaksi: media yang netral, bersumber jelas, dan meliput seluruh pulau. Penerbit tidak mendapat pemberitaan sebagai imbalan.</p>
<ul><li>Eco Beach City tidak pernah menjadi pokok berita, dan kami tidak memberitakan urusan komersial atau hukumnya.</li>
<li>Semua isi yang berasal dari penerbit, atau yang menyebut properti yang dikelolanya, diberi keterangan yang jelas di halaman tersebut.</li>
<li>Setiap halaman mencantumkan siapa penerbit situs ini.</li></ul>
<h2 id="conflicts">Benturan kepentingan</h2>
<p>Benturan kepentingan utama kami jelas: penerbit adalah perusahaan pariwisata dan properti di pulau yang kami beritakan. Kami menyikapinya dengan menyatakannya di setiap halaman, tidak menjadikan penerbit sebagai bahan berita, dan memperlakukan hotel, proyek, serta usaha lain dengan ukuran yang sama seperti pokok berita lainnya. Jika suatu berita menyentuh kepentingan penerbit yang belum tentu diketahui pembaca, hal itu disebutkan dalam berita.</p>
<h2 id="paid">Tanpa berita berbayar</h2>
<p>Tidak seorang pun dapat membayar untuk dimuat di The Sumba Times, untuk tidak dimuat, atau untuk mengubah isi berita. Kami tidak menerbitkan artikel bersponsor ataupun advertorial, serta tidak menerima bayaran, fasilitas menginap gratis, ataupun hadiah sebagai imbalan pemberitaan. Kami juga tidak menautkan halaman pemesanan hotel ataupun tautan afiliasi.</p>
<h2 id="hotels">Tanpa promosi hotel</h2>
<p>Berita kami tidak mempromosikan hotel, resor, ataupun vila mana pun, termasuk milik penerbit. Hotel dimuat di rubrik bisnis bila memang menjadi berita (pembukaan, investasi, lapangan kerja) dan ditulis secara netral dari sumber yang telah dipublikasikan. Jika suatu panduan memuat daftar penginapan, daftar itu berisi data, bukan peringkat, dan properti yang dikelola penerbit diberi keterangan. Foto kami tidak menampilkan hotel ataupun lingkungannya.</p>
<h2 id="communities">Menghormati masyarakat dan Marapu</h2>
<p>Sumba adalah rumah bagi warganya, bukan sekadar latar foto. Kami menulis tentang kampung, kabisu, dan keluarga dengan kehati-hatian yang kami harapkan bagi keluarga kami sendiri.</p>
<ul><li>Marapu adalah kepercayaan yang hidup. Upacaranya kami uraikan berdasarkan sumber yang telah dipublikasikan, istilah setempat dijelaskan saat pertama muncul, dan ritus, kubur batu, serta upacara kematian tidak kami perlakukan sebagai tontonan.</li>
<li>Kami tidak pernah membuat gambar AI tentang ritual sakral Marapu ataupun tentang orang nyata.</li>
<li>Tanggal Pasola dan upacara lain ditetapkan para rato. Kami memuatnya sebagaimana diumumkan sumber yang kami kutip, dan menyebutkan bila tanggal itu belum pasti.</li>
<li>Kami tidak memuat foto warga yang dapat dikenali tanpa persetujuan, dan sangat berhati-hati bila menyangkut anak.</li>
<li>Anjuran bagi pengunjung kampung adat mengikuti permintaan masyarakat dan pemerintah setempat.</li></ul>
<h2 id="photos">Foto dan hak cipta</h2>
<p>Kami mengutamakan foto asli Sumba dengan lisensi yang mengizinkan pemakaian ulang (Wikimedia Commons, Unsplash, Pexels). Setiap foto mencantumkan pembuat, lisensi, dan tautan ke sumber aslinya. Bila tidak ada foto asli yang layak, kami dapat memakai ilustrasi buatan AI. Ilustrasi itu selalu diberi keterangan "Ilustrasi buatan AI" dan tidak pernah disajikan sebagai foto. Lihat <a href="/[L]/ai-policy/">kebijakan penggunaan AI</a>.</p>
<h2 id="errors">Ralat, koreksi, dan hak jawab</h2>
<p>Kesalahan kami perbaiki secara terbuka dan bertanggal. Kami melayani hak jawab dan hak koreksi. Halaman <a href="/[L]/corrections/">ralat dan koreksi</a> menjelaskan caranya, memuat semua artikel yang diubah setelah terbit, dan menerangkan cara melaporkan kesalahan. Anda juga dapat menulis ke [MAIL].</p>"""),
}

P["corrections"] = {
 "en": ("Corrections",
  "How The Sumba Times corrects its mistakes, the full list of stories changed after publication and how to report an error.",
  """<p>We make mistakes. A source turns out to be wrong, a schedule changes, a number is copied badly, a translation loses something. What matters is that the reader can see what was changed and when.</p>
<h2 id="policy">Our policy</h2>
<ul><li><strong>We fix errors as soon as we have confirmed them</strong>, in all three languages.</li>
<li><strong>Corrections are dated and visible.</strong> A changed story shows an "Updated" date next to its publication date. When the change corrects an error of fact, a note beginning "Correction:" at the end of the story says what was wrong.</li>
<li><strong>We do not rewrite history quietly.</strong> Typos and style are fixed without a note; facts are not.</li>
<li><strong>Updates are not hidden either.</strong> Guides are revised when flights, prices or rules change. They carry the same "Updated" date and appear in the log below.</li>
<li><strong>We do not delete stories</strong> to make an error disappear. If a story ever had to be withdrawn, its address would carry a note saying so and why.</li></ul>
<h2 id="log">Log of updated stories</h2>
<p>This list is generated automatically each time the site is built. It contains every story or guide that has been changed after it was first published, whether to correct an error or to bring it up to date, newest change first.</p>
[LOG]
<h2 id="report">How to report an error</h2>
<p>If you think we have something wrong, tell us. You do not need to be sure.</p>
<ul><li>Use the reader form on the <a href="/[L]/plan/#ask">Plan your trip page</a>. Leave your email only if you want a reply.</li>
<li>Or write to [MAIL] with "Correction" in the subject line.</li></ul>
<p>Please include the address of the page, what you believe is wrong and, if you can, a link to a source. We read every message. If the error is confirmed we correct the story and it joins the log above. If we do not agree, and you have left an address, we will tell you why.</p>
<p>People and organisations named in a story can ask for their published position to be added or put right through the same channels.</p>"""),
 "es": ("Fe de errores",
  "Cómo rectifica The Sumba Times sus errores, la relación completa de informaciones modificadas tras su publicación y la manera de avisar de un fallo.",
  """<p>Nos equivocamos. Una fuente resulta ser errónea, un horario cambia, una cifra se copia mal, una traducción pierde un matiz. Lo importante es que el lector pueda ver qué se ha cambiado y cuándo.</p>
<h2 id="policy">Criterios</h2>
<ul><li><strong>Los errores se corrigen en cuanto se comprueban</strong>, en los tres idiomas.</li>
<li><strong>Las correcciones llevan fecha y están a la vista.</strong> La información modificada muestra la fecha de actualización junto a la de publicación. Cuando el cambio rectifica un error de hecho, una nota al final del texto, encabezada por "Corrección:", explica qué estaba mal.</li>
<li><strong>No se reescribe lo publicado sin advertirlo.</strong> Las erratas y las cuestiones de estilo se arreglan sin nota; los datos, no.</li>
<li><strong>Las actualizaciones tampoco se ocultan.</strong> Las guías se revisan cuando cambian los vuelos, los precios o las normas. Llevan la misma fecha de actualización y figuran en el registro que sigue.</li>
<li><strong>No se borran informaciones</strong> para hacer desaparecer un error. Si alguna vez hubiera que retirar un texto, su dirección mostraría una nota que lo indicara y explicara el motivo.</li></ul>
<h2 id="log">Registro de informaciones actualizadas</h2>
<p>Esta relación se genera de forma automática cada vez que se compone el sitio. Incluye todas las noticias y guías modificadas después de su primera publicación, ya sea para rectificar un error o para ponerlas al día, con el cambio más reciente en primer lugar.</p>
[LOG]
<h2 id="report">Cómo avisar de un error</h2>
<p>Si cree que algo está mal, díganoslo. No hace falta estar seguro.</p>
<ul><li>Utilice el formulario para lectores de la página <a href="/[L]/plan/#ask">Planifica tu viaje</a>. Deje su correo solo si desea respuesta.</li>
<li>O escriba a [MAIL] con la palabra "Corrección" en el asunto.</li></ul>
<p>Indique la dirección de la página, qué considera erróneo y, si es posible, un enlace a una fuente. La redacción lee todos los mensajes. Si el error se confirma, se corrige la información y pasa al registro anterior. Si la redacción no comparte la objeción y el lector ha dejado una dirección, se le explican los motivos.</p>
<p>Las personas y entidades citadas en una información pueden pedir por las mismas vías que se añada o se rectifique su posición publicada.</p>"""),
 "id": ("Ralat dan koreksi",
  "Cara The Sumba Times memperbaiki kesalahan, daftar lengkap artikel yang diubah setelah terbit, dan cara melaporkan kekeliruan.",
  """<p>Kami bisa keliru. Sumber ternyata salah, jadwal berubah, angka salah salin, atau terjemahan kehilangan makna. Yang penting, pembaca dapat melihat apa yang diubah dan kapan.</p>
<h2 id="policy">Kebijakan kami</h2>
<ul><li><strong>Kesalahan diperbaiki segera setelah terbukti</strong>, dalam ketiga bahasa.</li>
<li><strong>Koreksi bertanggal dan terlihat.</strong> Artikel yang diubah menampilkan tanggal "Diperbarui" di samping tanggal terbit. Jika perubahan itu meralat kesalahan fakta, catatan berawalan "Koreksi:" di akhir artikel menjelaskan apa yang keliru.</li>
<li><strong>Kami tidak mengubah isi secara diam-diam.</strong> Salah ketik dan gaya bahasa diperbaiki tanpa catatan, tetapi fakta tidak.</li>
<li><strong>Pembaruan juga tidak disembunyikan.</strong> Panduan direvisi bila penerbangan, harga, atau aturan berubah. Panduan itu memuat tanggal "Diperbarui" yang sama dan masuk dalam daftar di bawah.</li>
<li><strong>Kami tidak menghapus artikel</strong> untuk menghilangkan kesalahan. Sejalan dengan Pedoman Pemberitaan Media Siber, bila suatu artikel terpaksa dicabut, alamatnya akan memuat keterangan pencabutan beserta alasannya.</li></ul>
<h2 id="log">Daftar artikel yang diperbarui</h2>
<p>Daftar ini dibuat otomatis setiap kali situs disusun. Isinya semua berita dan panduan yang diubah setelah pertama terbit, baik untuk meralat kesalahan maupun untuk memutakhirkan isinya, dimulai dari perubahan terbaru.</p>
[LOG]
<h2 id="report">Cara melaporkan kesalahan, hak jawab, dan hak koreksi</h2>
<p>Jika menurut Anda ada yang keliru, sampaikan kepada kami. Anda tidak perlu yakin sepenuhnya.</p>
<ul><li>Gunakan formulir pembaca di halaman <a href="/[L]/plan/#ask">Rencanakan perjalanan</a>. Cantumkan email hanya jika ingin dibalas.</li>
<li>Atau tulis ke [MAIL] dengan subjek "Koreksi".</li></ul>
<p>Sertakan alamat halaman, hal yang menurut Anda keliru, dan bila ada, tautan sumbernya. Redaksi membaca semua pesan. Jika kesalahan terbukti, artikel diperbaiki dan masuk dalam daftar di atas. Jika redaksi berpendapat lain dan Anda mencantumkan alamat, kami akan menjelaskan alasannya.</p>
<p>Orang atau lembaga yang disebut dalam berita dapat menggunakan hak jawab dan hak koreksi melalui saluran yang sama.</p>"""),
}

P["ai-policy"] = {
 "en": ("AI policy",
  "How The Sumba Times uses artificial intelligence to research, draft and check stories, what it is not allowed to do and who answers for the result.",
  """<p>The Sumba Times uses artificial intelligence every day, and we would rather say so plainly than have readers guess. A newspaper about a small island, in three languages, published every morning, would not exist without it. Here is exactly what AI does here and where it stops.</p>
<h2 id="how">How a story is made</h2>
<ol><li><strong>Research.</strong> AI tools search and read published sources: local media such as Waingapu.com, Pos Kupang, Victory News, ANTARA NTT and Kompas, and official bodies such as the weather agency BMKG, the statistics office BPS and national, provincial and regency government sites.</li>
<li><strong>Drafting.</strong> The story is drafted with AI assistance from those sources only, in English, Spanish and Indonesian. Each version is written for its own readers, not translated word for word.</li>
<li><strong>Checking against sources.</strong> Facts, figures, names and dates are compared with the pages they came from. Every source used is listed and linked at the end of the story.</li>
<li><strong>Editorial checklist.</strong> The story is edited against a written checklist of 100 points covering angle, headline, structure, links, language and images.</li>
<li><strong>Automated check before publication.</strong> A program then inspects the whole edition. It blocks publication if a story lacks a language version, cites a source without a link, repeats an existing headline or contains a broken internal link, and it warns about thin sourcing, vague dates and missing elements.</li></ol>
<h2 id="limits">What AI does not do here</h2>
<ul><li>It does not report from the ground. Unless a story says otherwise, there is no original on-the-ground reporting in it.</li>
<li>It does not invent or reconstruct quotes. Quotes appear only as published elsewhere, with attribution.</li>
<li>It does not write from memory. A fact with no source we can link does not go in.</li>
<li>It does not produce images presented as photographs, images of real people or images of sacred Marapu rituals.</li>
<li>It does not decide what the newspaper is for. The editorial line and these rules are set by people.</li></ul>
<h2 id="risk">The limits of the method</h2>
<p>AI can misread a source, merge two facts or translate a term badly, and an automated checker catches form better than meaning. Not every story is read by a person before it goes live. We reduce the risk by working only from linked sources, by publishing those links so you can check us, and by correcting in the open. If a detail matters to your trip or your money, confirm it with the source we link.</p>
<h2 id="responsibility">Human responsibility</h2>
<p>Responsibility does not pass to a machine. The publisher, Eco Beach City, sets the editorial line and the rules the tools work to, reviews what is published and answers for every story, however it was produced. Complaints and corrections go to the publisher, not to a program: see <a href="/[L]/corrections/">corrections</a> and <a href="/[L]/contact/">contact</a>.</p>
<h2 id="labels">Labelling</h2>
<ul><li>Stories are signed "By The Sumba Times desk". There are no personal bylines, because no single reporter wrote them.</li>
<li>AI-generated images carry the label "AI-generated illustration" in the caption. Real photos carry their author and licence.</li>
<li>This page and <a href="/[L]/team/">The newsroom</a> are linked from our standards, so the method is disclosed once, clearly, for the whole site.</li></ul>
<h2 id="assistant">The site assistant</h2>
<p>The "Ask about Sumba" button opens a chat assistant. It is AI, it says so, and it is limited to questions about Sumba. Its answers are grounded in our own published guides, which are passed to it with each question, and it links to them. It can still make mistakes, so check important details in the guide it points to. There is a daily limit of questions per reader. Questions are sent to the service that generates the answer; do not type personal or sensitive information into it.</p>
<h2 id="crawlers">AI systems that read us</h2>
<p>Search engines and AI assistants may read and summarise our pages; we publish a plain-text index for them. We ask that they name The Sumba Times and link the story they used.</p>"""),
 "es": ("Uso de la inteligencia artificial",
  "Cómo emplea The Sumba Times la inteligencia artificial para documentar, redactar y comprobar sus informaciones, qué tiene vedado y quién responde del resultado.",
  """<p>The Sumba Times utiliza la inteligencia artificial todos los días y prefiere decirlo con claridad antes que dejar que el lector lo suponga. Un periódico sobre una isla pequeña, en tres idiomas y con edición diaria no existiría sin ella. Esto es exactamente lo que hace aquí la inteligencia artificial y dónde se detiene.</p>
<h2 id="how">Cómo se elabora una información</h2>
<ol><li><strong>Documentación.</strong> Las herramientas de inteligencia artificial buscan y leen fuentes publicadas: medios locales como Waingapu.com, Pos Kupang, Victory News, ANTARA NTT y Kompas, y organismos oficiales como la agencia meteorológica indonesia (BMKG), la oficina de estadística (BPS) y las páginas de los gobiernos nacional, provincial y de las regencias.</li>
<li><strong>Redacción.</strong> El texto se redacta con ayuda de la inteligencia artificial, únicamente a partir de esas fuentes, en inglés, español e indonesio. Cada versión se escribe para sus lectores; no es una traducción literal.</li>
<li><strong>Contraste con las fuentes.</strong> Los hechos, las cifras, los nombres y las fechas se cotejan con las páginas de las que proceden. Todas las fuentes utilizadas se enumeran y se enlazan al final del texto.</li>
<li><strong>Lista de control editorial.</strong> La información se edita conforme a una lista escrita de 100 puntos sobre enfoque, titular, estructura, enlaces, lengua e imágenes.</li>
<li><strong>Comprobación automática previa.</strong> Un programa revisa después la edición completa. Impide publicar si a una noticia le falta la versión en algún idioma, si cita una fuente sin enlace, si repite un titular ya existente o si contiene un enlace interno roto, y advierte de la escasez de fuentes, de las fechas imprecisas y de los elementos que faltan.</li></ol>
<h2 id="limits">Lo que la inteligencia artificial no hace aquí</h2>
<ul><li>No informa desde el terreno. Salvo que el texto indique lo contrario, no hay en él trabajo propio sobre el terreno.</li>
<li>No inventa ni reconstruye declaraciones. Las citas aparecen solo como se publicaron en otro lugar, con su atribución.</li>
<li>No escribe de memoria. Un dato sin una fuente que pueda enlazarse no se publica.</li>
<li>No genera imágenes que se presenten como fotografías, ni imágenes de personas reales o de rituales sagrados del marapu.</li>
<li>No decide para qué sirve el periódico. La línea editorial y estas normas las fijan personas.</li></ul>
<h2 id="risk">Los límites del método</h2>
<p>La inteligencia artificial puede interpretar mal una fuente, mezclar dos datos o traducir mal un término, y un comprobador automático detecta mejor los defectos de forma que los de fondo. No todas las informaciones las lee una persona antes de su publicación. El riesgo se reduce trabajando solo con fuentes enlazadas, publicando esos enlaces para que el lector pueda verificarlos y rectificando a la vista. Si un dato es importante para un viaje o para una decisión económica, conviene confirmarlo en la fuente enlazada.</p>
<h2 id="responsibility">Responsabilidad humana</h2>
<p>La responsabilidad no se traslada a una máquina. El editor, Eco Beach City, fija la línea editorial y las normas con las que trabajan las herramientas, supervisa lo publicado y responde de cada información, con independencia de cómo se haya elaborado. Las quejas y las rectificaciones llegan al editor, no a un programa: véanse la <a href="/[L]/corrections/">fe de errores</a> y la página de <a href="/[L]/contact/">contacto</a>.</p>
<h2 id="labels">Identificación</h2>
<ul><li>Las informaciones se firman como "Redacción de The Sumba Times". No hay firmas personales porque no las ha escrito un único periodista.</li>
<li>Las imágenes generadas con inteligencia artificial llevan en el pie la mención "Ilustración generada con IA". Las fotografías reales llevan su autor y su licencia.</li>
<li>Esta página y la de <a href="/[L]/team/">la redacción</a> están enlazadas desde las normas editoriales, de modo que el método se declara una vez, con claridad, para todo el sitio.</li></ul>
<h2 id="assistant">El asistente del sitio</h2>
<p>El botón "Pregunta sobre Sumba" abre un asistente conversacional. Es inteligencia artificial, así se indica, y solo atiende preguntas sobre Sumba. Sus respuestas se apoyan en las guías publicadas por el periódico, que recibe junto con cada pregunta, y enlaza a ellas. Aun así puede equivocarse, por lo que conviene comprobar los datos importantes en la guía a la que remite. Hay un límite diario de preguntas por lector. Las preguntas se envían al servicio que genera la respuesta: no deben escribirse en él datos personales ni sensibles.</p>
<h2 id="crawlers">Los sistemas de inteligencia artificial que nos leen</h2>
<p>Los buscadores y los asistentes de inteligencia artificial pueden leer y resumir estas páginas; el periódico publica para ellos un índice en texto plano. Se les pide que citen a The Sumba Times y enlacen la información utilizada.</p>"""),
 "id": ("Kebijakan penggunaan AI",
  "Cara The Sumba Times memakai kecerdasan buatan untuk riset, penulisan, dan pemeriksaan berita, batas-batasnya, serta siapa yang bertanggung jawab.",
  """<p>The Sumba Times memakai kecerdasan buatan (AI) setiap hari, dan kami memilih menyatakannya terus terang daripada membiarkan pembaca menebak. Media tentang sebuah pulau kecil, dalam tiga bahasa dan terbit setiap pagi, tidak akan ada tanpa bantuan itu. Berikut penjelasan tentang apa yang dikerjakan AI di sini dan di mana batasnya.</p>
<h2 id="how">Cara sebuah berita dibuat</h2>
<ol><li><strong>Riset.</strong> Perangkat AI mencari dan membaca sumber yang telah dipublikasikan: media lokal seperti Waingapu.com, Pos Kupang, Victory News, ANTARA NTT, dan Kompas, serta lembaga resmi seperti Badan Meteorologi, Klimatologi, dan Geofisika (BMKG), Badan Pusat Statistik (BPS), dan situs pemerintah pusat, provinsi, dan kabupaten.</li>
<li><strong>Penulisan.</strong> Naskah disusun dengan bantuan AI hanya dari sumber-sumber itu, dalam bahasa Inggris, Spanyol, dan Indonesia. Setiap versi ditulis untuk pembacanya, bukan diterjemahkan kata demi kata.</li>
<li><strong>Pencocokan dengan sumber.</strong> Fakta, angka, nama, dan tanggal dicocokkan dengan halaman asalnya. Semua sumber yang dipakai dicantumkan dan ditautkan di akhir tulisan.</li>
<li><strong>Daftar periksa redaksi.</strong> Naskah disunting berdasarkan daftar periksa tertulis berisi 100 butir tentang sudut berita, judul, struktur, tautan, bahasa, dan gambar.</li>
<li><strong>Pemeriksaan otomatis sebelum terbit.</strong> Sebuah program kemudian memeriksa seluruh edisi. Program itu menahan penerbitan bila ada berita yang belum lengkap dalam tiga bahasa, mengutip sumber tanpa tautan, mengulang judul yang sudah ada, atau memuat tautan internal yang rusak. Program itu juga memberi peringatan bila sumber terlalu sedikit, keterangan waktu tidak jelas, atau ada unsur yang belum lengkap.</li></ol>
<h2 id="limits">Yang tidak dikerjakan AI di sini</h2>
<ul><li>AI tidak meliput di lapangan. Kecuali disebutkan dalam tulisan, berita kami tidak memuat liputan lapangan sendiri.</li>
<li>AI tidak mengarang ataupun merekonstruksi kutipan. Kutipan hanya dimuat sebagaimana diterbitkan di tempat lain, dengan atribusi.</li>
<li>AI tidak menulis berdasarkan ingatan. Fakta tanpa sumber yang dapat ditautkan tidak dimuat.</li>
<li>AI tidak membuat gambar yang disajikan sebagai foto, gambar orang nyata, ataupun gambar ritual sakral Marapu.</li>
<li>AI tidak menentukan arah media ini. Kebijakan redaksi dan pedoman ini ditetapkan oleh manusia.</li></ul>
<h2 id="risk">Keterbatasan cara ini</h2>
<p>AI dapat salah membaca sumber, mencampur dua fakta, atau keliru menerjemahkan istilah, sedangkan pemeriksa otomatis lebih mudah menangkap kesalahan bentuk daripada kesalahan isi. Tidak semua berita dibaca seseorang sebelum terbit. Kami menekan risiko itu dengan hanya bekerja dari sumber yang bertautan, memuat tautan itu agar pembaca dapat memeriksa, dan meralat secara terbuka. Jika suatu keterangan penting bagi perjalanan atau keuangan Anda, pastikan kembali pada sumber yang kami tautkan.</p>
<h2 id="responsibility">Tanggung jawab manusia</h2>
<p>Tanggung jawab tidak berpindah ke mesin. Penerbit, Eco Beach City, menetapkan kebijakan redaksi dan aturan kerja perangkat AI, meninjau apa yang terbit, dan bertanggung jawab atas setiap berita, bagaimanapun cara pembuatannya. Pengaduan dan koreksi sampai kepada penerbit, bukan kepada program: lihat halaman <a href="/[L]/corrections/">ralat dan koreksi</a> serta <a href="/[L]/contact/">kontak</a>.</p>
<h2 id="labels">Penandaan</h2>
<ul><li>Berita ditandai "Redaksi The Sumba Times". Tidak ada nama penulis perorangan karena berita tidak ditulis oleh satu wartawan.</li>
<li>Gambar buatan AI diberi keterangan "Ilustrasi buatan AI". Foto asli mencantumkan pembuat dan lisensinya.</li>
<li>Halaman ini dan halaman <a href="/[L]/team/">redaksi</a> ditautkan dari pedoman redaksi, sehingga cara kerja ini dinyatakan satu kali dengan jelas untuk seluruh situs.</li></ul>
<h2 id="assistant">Asisten situs</h2>
<p>Tombol "Tanya soal Sumba" membuka asisten percakapan. Asisten itu adalah AI, dinyatakan demikian, dan hanya melayani pertanyaan tentang Sumba. Jawabannya bersandar pada panduan yang telah kami terbitkan, yang disertakan bersama setiap pertanyaan, dan menautkan panduan tersebut. Asisten tetap dapat keliru, jadi periksa keterangan penting pada panduan yang dirujuknya. Jumlah pertanyaan per pembaca dibatasi setiap hari. Pertanyaan dikirim ke layanan yang menyusun jawaban, karena itu jangan menuliskan data pribadi ataupun data sensitif.</p>
<h2 id="crawlers">Sistem AI yang membaca kami</h2>
<p>Mesin pencari dan asisten AI boleh membaca dan merangkum halaman kami. Kami menyediakan indeks teks polos untuk keperluan itu. Kami meminta agar The Sumba Times disebut dan artikel yang dipakai ditautkan.</p>"""),
}

P["sources"] = {
 "en": ("Our sources",
  "Where The Sumba Times gets its facts, how we rank sources and the outlets we cite most, counted from the source list of every story.",
  """<p>We do not ask readers to take our word for anything. Every story and guide ends with the list of sources it was built from, each with a link. This page explains how we choose between sources and shows, with real counts, which ones we lean on.</p>
<h2 id="rank">How we rank sources</h2>
<ol><li><strong>Primary and official sources first.</strong> The weather agency BMKG for forecasts, warnings and earthquakes; the statistics office BPS for figures; ministries, the immigration service, the provincial government of East Nusa Tenggara and the four regency governments of Sumba for decisions and rules; airlines, ferry and port operators for their own schedules.</li>
<li><strong>Established news media second.</strong> The national agency ANTARA and its regional desks, Kompas, Pos Kupang, Victory News, Waingapu.com and other national and regional newsrooms. They are our main source for what was said and done on the island, and for quotes, which we reproduce only as they published them.</li>
<li><strong>Reference and travel sources third.</strong> Encyclopedias, OpenStreetMap, guidebooks, specialist sites and travel writers who have been there. We use them in travel guides for descriptions, coordinates and practical detail, and treat them as a starting point, not as proof. They do not carry a news story on their own.</li></ol>
<h2 id="rules">Rules we apply</h2>
<ul><li>When an official source and a media report disagree, we follow the official source and say that the report differs.</li>
<li>A figure found in only one place is attributed to it by name.</li>
<li>We link the page that contains the fact, not the outlet's front page.</li>
<li>We do not cite anonymous social media accounts, press releases presented as news or hotel marketing as evidence.</li>
<li>Schedules and prices change. Our pages say when they were checked and tell you to confirm with the operator.</li></ul>
<h2 id="table">The outlets we cite most</h2>
<p>The table is computed automatically from the "sources" list of every story and guide on the site each time it is built. A citation is one source link in one story; the three language versions of a story share one list and are counted once. Reference and travel sites rank high because our long travel guides cite many of them, while a daily news story usually cites two to six official and media sources. The link goes to the outlet's home page.</p>
<p><small>[SUM]</small></p>
[TABLE]
<p>Being on this list is not an endorsement, and we have no commercial relationship with any of these outlets. If you publish one of them and think we have misread you, <a href="/[L]/corrections/#report">tell us</a>.</p>"""),
 "es": ("Nuestras fuentes",
  "De dónde obtiene sus datos The Sumba Times, cómo jerarquiza las fuentes y cuáles cita más, según el recuento de las fuentes de cada información.",
  """<p>No se pide al lector que crea nada bajo palabra. Todas las noticias y guías terminan con la relación de fuentes con las que se han elaborado, cada una con su enlace. Esta página explica cómo se elige entre unas fuentes y otras y muestra, con cifras reales, en cuáles se apoya más el periódico.</p>
<h2 id="rank">Jerarquía de las fuentes</h2>
<ol><li><strong>Primero, las fuentes primarias y oficiales.</strong> La agencia meteorológica indonesia (BMKG) para las previsiones, los avisos y los terremotos; la oficina de estadística (BPS) para las cifras; los ministerios, el servicio de inmigración, el Gobierno provincial de Nusa Tenggara Oriental y los gobiernos de las cuatro regencias de Sumba para las decisiones y las normas; las aerolíneas y los operadores de ferris y puertos para sus propios horarios.</li>
<li><strong>Después, los medios de comunicación asentados.</strong> La agencia nacional ANTARA y sus delegaciones regionales, Kompas, Pos Kupang, Victory News, Waingapu.com y otras redacciones nacionales y regionales. Son la fuente principal de lo que se ha dicho y hecho en la isla, y de las declaraciones, que se reproducen solo como ellos las publicaron.</li>
<li><strong>En tercer lugar, las obras de consulta y las fuentes de viajes.</strong> Enciclopedias, OpenStreetMap, guías de viaje, sitios especializados y autores que han estado allí. Se emplean en las guías para las descripciones, las coordenadas y los detalles prácticos, y se consideran un punto de partida, no una prueba. No sostienen por sí solas una noticia.</li></ol>
<h2 id="rules">Criterios de uso</h2>
<ul><li>Cuando una fuente oficial y una información periodística discrepan, se sigue la fuente oficial y se advierte de la diferencia.</li>
<li>Una cifra que solo aparece en un lugar se atribuye a ese lugar por su nombre.</li>
<li>Se enlaza la página que contiene el dato, no la portada del medio.</li>
<li>No se citan como prueba cuentas anónimas de redes sociales, notas de prensa presentadas como noticia ni publicidad hotelera.</li>
<li>Los horarios y los precios cambian. Las páginas indican cuándo se comprobaron y recomiendan confirmarlos con el operador.</li></ul>
<h2 id="table">Las fuentes más citadas</h2>
<p>La tabla se calcula de forma automática, cada vez que se compone el sitio, a partir de la relación de fuentes de todas las noticias y guías. Una cita es un enlace a una fuente en una información; las tres versiones lingüísticas de un mismo texto comparten una sola relación y cuentan una vez. Las obras de consulta y los sitios de viajes ocupan puestos altos porque las guías largas citan muchos de ellos, mientras que una noticia diaria suele citar entre dos y seis fuentes oficiales y periodísticas. El enlace lleva a la portada de cada fuente.</p>
<p><small>[SUM]</small></p>
[TABLE]
<p>Figurar en esta relación no supone un aval, y el periódico no mantiene relación comercial alguna con estas fuentes. Si usted edita una de ellas y cree que se la ha interpretado mal, puede <a href="/[L]/corrections/#report">comunicarlo</a>.</p>"""),
 "id": ("Sumber kami",
  "Asal fakta The Sumba Times, cara kami menimbang sumber, dan sumber yang paling sering dikutip berdasarkan daftar sumber setiap artikel.",
  """<p>Kami tidak meminta pembaca percaya begitu saja. Setiap berita dan panduan diakhiri daftar sumber yang dipakai, masing-masing dengan tautannya. Halaman ini menjelaskan cara kami memilih sumber dan menunjukkan, dengan hitungan nyata, sumber mana yang paling sering kami gunakan.</p>
<h2 id="rank">Urutan sumber</h2>
<ol><li><strong>Sumber primer dan resmi lebih dahulu.</strong> Badan Meteorologi, Klimatologi, dan Geofisika (BMKG) untuk prakiraan, peringatan dini, dan gempa; Badan Pusat Statistik (BPS) untuk angka; kementerian, imigrasi, Pemerintah Provinsi Nusa Tenggara Timur, dan keempat pemerintah kabupaten di Sumba untuk keputusan dan aturan; maskapai serta operator feri dan pelabuhan untuk jadwal mereka sendiri.</li>
<li><strong>Media massa yang mapan sesudahnya.</strong> Kantor berita ANTARA dan biro daerahnya, Kompas, Pos Kupang, Victory News, Waingapu.com, serta redaksi nasional dan daerah lainnya. Media tersebut menjadi sumber utama kami tentang apa yang dikatakan dan dilakukan di pulau ini, juga untuk kutipan, yang hanya kami muat sebagaimana mereka terbitkan.</li>
<li><strong>Sumber rujukan dan perjalanan di urutan ketiga.</strong> Ensiklopedia, OpenStreetMap, buku panduan, situs khusus, dan penulis perjalanan yang pernah datang. Sumber ini dipakai dalam panduan wisata untuk deskripsi, koordinat, dan keterangan praktis, serta kami perlakukan sebagai titik awal, bukan bukti. Sumber seperti ini tidak cukup untuk menjadi dasar sebuah berita.</li></ol>
<h2 id="rules">Ketentuan yang kami pegang</h2>
<ul><li>Jika sumber resmi dan pemberitaan media berbeda, kami mengikuti sumber resmi dan menyebutkan perbedaannya.</li>
<li>Angka yang hanya ada di satu tempat disebutkan berasal dari sumber itu.</li>
<li>Kami menautkan halaman yang memuat faktanya, bukan halaman depan medianya.</li>
<li>Akun media sosial anonim, siaran pers yang disajikan sebagai berita, dan materi pemasaran hotel tidak kami jadikan bukti.</li>
<li>Jadwal dan harga dapat berubah. Halaman kami mencantumkan kapan data diperiksa dan menganjurkan pembaca memastikannya kepada operator.</li></ul>
<h2 id="table">Sumber yang paling sering dikutip</h2>
<p>Tabel ini dihitung otomatis dari daftar sumber semua berita dan panduan setiap kali situs disusun. Satu kutipan berarti satu tautan sumber dalam satu artikel. Tiga versi bahasa dari artikel yang sama memakai satu daftar dan dihitung satu kali. Situs rujukan dan perjalanan berada di urutan atas karena panduan wisata yang panjang mengutip banyak di antaranya, sedangkan berita harian biasanya mengutip dua sampai enam sumber resmi dan media. Tautan mengarah ke halaman depan sumber tersebut.</p>
<p><small>[SUM]</small></p>
[TABLE]
<p>Tercantum dalam daftar ini bukan berarti kami merekomendasikannya, dan kami tidak memiliki hubungan komersial dengan sumber-sumber tersebut. Jika Anda pengelola salah satunya dan menilai kami keliru memahami isi Anda, silakan <a href="/[L]/corrections/#report">sampaikan kepada kami</a>.</p>"""),
}

P["ownership"] = {
 "en": ("Ownership and funding",
  "Who publishes and pays for The Sumba Times, what the publisher does on Sumba, how the newsroom's independence is protected and how to complain.",
  """<h2 id="who">Who publishes The Sumba Times</h2>
<p>The Sumba Times is published by [EBC] (PT Eco Beach City), a company that operates Villa Eco Beach and has a development project on Sumba. Eco Beach City owns the site and its name, and is responsible for what it publishes. We say who publishes the site at the foot of every page.</p>
<h2 id="funding">Who pays for it</h2>
<p>Eco Beach City pays the whole cost of the newspaper. Reading it is free, and so is the Sunday newsletter. At the date of this review the site carries no advertising, no sponsored content and no affiliate links. If that changes, this page will say so.</p>
<h2 id="mission">Why it exists</h2>
<p>Almost everything published about Sumba day to day is in Indonesian and scattered across local outlets and government sites. The Sumba Times exists to put that information, checked and with its sources, in front of people who care about the island from near or far: travellers, residents, the Sumbanese abroad and investors, in English, Spanish and Indonesian. A better-informed visitor is a better guest, and an island that is easier to understand is easier to respect.</p>
<h2 id="publisher">What the publisher does</h2>
<p>Eco Beach City is a tourism and property business. It runs accommodation on the island and is developing a beachfront project there. That gives it a commercial interest in Sumba being known and visited, and readers should weigh our coverage knowing it. We would rather you knew than had to find out.</p>
<h2 id="independence">How independence is protected</h2>
<ul><li>The publisher sets the general editorial line, a neutral and sourced newspaper about the whole island, and the written rules the desk works to. It does not choose stories to favour its business.</li>
<li>Eco Beach City is never the subject of a news story, and we do not report on its commercial or legal matters. We would be a poor judge of our own case.</li>
<li>News stories do not promote any hotel, the publisher's included. Other hotels, projects and businesses are covered on the same terms as any other subject.</li>
<li>Anything that comes from the publisher is labelled as such.</li>
<li>Nobody can pay for coverage. See the <a href="/[L]/standards/#paid">standards</a>.</li>
<li>Every source is linked, so a reader can check whether a story has been bent.</li></ul>
<p>These are rules we set for ourselves; no outside body audits them. That is why they are published, and why the next section matters.</p>
<h2 id="complain">How to complain</h2>
<p>If you believe a story is wrong, unfair, or shaped by the publisher's interests, write to [MAIL] with "Complaint" in the subject line, or use the reader form on the <a href="/[L]/plan/#ask">Plan your trip page</a>. Say which page and why. We read every complaint. If you are right we correct the story and record it on the <a href="/[L]/corrections/">corrections page</a>; if we disagree, and you have left an address, we tell you why.</p>"""),
 "es": ("Propiedad y financiación",
  "Quién edita y sufraga The Sumba Times, a qué se dedica el editor en Sumba, cómo se protege la independencia de la redacción y cómo presentar una queja.",
  """<h2 id="who">Quién edita The Sumba Times</h2>
<p>The Sumba Times lo edita [EBC] (PT Eco Beach City), empresa que gestiona Villa Eco Beach y desarrolla un proyecto en Sumba. Eco Beach City es propietaria del sitio y de su cabecera, y responde de lo que se publica. El pie de todas las páginas indica quién es el editor.</p>
<h2 id="funding">Quién lo financia</h2>
<p>Eco Beach City asume íntegramente el coste del periódico. Su lectura es gratuita, al igual que el boletín de los domingos. A la fecha de esta revisión el sitio no tiene publicidad, contenidos patrocinados ni enlaces de afiliación. Si esta situación cambia, se hará constar en esta página.</p>
<h2 id="mission">Para qué existe</h2>
<p>Casi todo lo que se publica a diario sobre Sumba está en indonesio y disperso entre medios locales y páginas oficiales. The Sumba Times existe para poner esa información, contrastada y con sus fuentes, al alcance de quienes se interesan por la isla desde cerca o desde lejos: viajeros, residentes, sumbaneses en el exterior e inversores, en inglés, español e indonesio. Un visitante mejor informado es mejor huésped, y una isla que se entiende mejor se respeta más.</p>
<h2 id="publisher">A qué se dedica el editor</h2>
<p>Eco Beach City es una empresa turística e inmobiliaria. Gestiona alojamiento en la isla y desarrolla allí un proyecto frente al mar. Tiene, por tanto, un interés comercial en que Sumba se conozca y se visite, y el lector debe valorar la cobertura del periódico sabiéndolo. Es preferible decirlo a que el lector tenga que averiguarlo.</p>
<h2 id="independence">Cómo se protege la independencia</h2>
<ul><li>El editor fija la línea editorial general, la de un periódico neutral y documentado sobre toda la isla, y las normas escritas con las que trabaja la redacción. No elige las informaciones para favorecer su negocio.</li>
<li>Eco Beach City nunca es objeto de una noticia, y el periódico no informa sobre sus asuntos comerciales o legales. Nadie es buen juez en causa propia.</li>
<li>Las noticias no promocionan ningún hotel, tampoco los del editor. Los demás hoteles, proyectos y negocios se tratan con los mismos criterios que cualquier otro asunto.</li>
<li>Todo lo que procede del editor se identifica como tal.</li>
<li>Nadie puede pagar por una cobertura. Véanse las <a href="/[L]/standards/#paid">normas editoriales</a>.</li>
<li>Todas las fuentes están enlazadas, de modo que el lector puede comprobar si una información se ha desviado.</li></ul>
<p>Son normas que el periódico se impone a sí mismo; ningún organismo externo las audita. Por eso se publican, y por eso importa el apartado siguiente.</p>
<h2 id="complain">Cómo presentar una queja</h2>
<p>Quien considere que una información es errónea, injusta o está condicionada por los intereses del editor puede escribir a [MAIL] con la palabra "Queja" en el asunto, o emplear el formulario para lectores de la página <a href="/[L]/plan/#ask">Planifica tu viaje</a>, indicando de qué página se trata y por qué. Se leen todas las quejas. Si el lector tiene razón, la información se corrige y queda anotada en la <a href="/[L]/corrections/">fe de errores</a>; si la redacción discrepa y el lector ha dejado una dirección, se le explican los motivos.</p>"""),
 "id": ("Kepemilikan dan pendanaan",
  "Siapa penerbit dan penyandang dana The Sumba Times, kegiatan penerbit di Sumba, cara menjaga independensi redaksi, dan cara mengadu.",
  """<h2 id="who">Siapa penerbit The Sumba Times</h2>
<p>The Sumba Times diterbitkan oleh [EBC] (PT Eco Beach City), perusahaan pengelola Villa Eco Beach yang juga memiliki proyek pengembangan di Sumba. Eco Beach City adalah pemilik situs dan nama media ini, serta bertanggung jawab atas isinya. Nama penerbit tercantum di bagian bawah setiap halaman.</p>
<h2 id="funding">Siapa yang mendanai</h2>
<p>Seluruh biaya media ini ditanggung Eco Beach City. Semua isi dapat dibaca gratis, begitu pula nawala hari Minggu. Pada tanggal peninjauan ini, situs tidak memuat iklan, konten bersponsor, ataupun tautan afiliasi. Jika hal itu berubah, halaman ini akan memuatnya.</p>
<h2 id="mission">Mengapa media ini ada</h2>
<p>Hampir semua kabar harian tentang Sumba ditulis dalam bahasa Indonesia dan tersebar di berbagai media lokal serta situs pemerintah. The Sumba Times hadir untuk menyajikan informasi itu, yang telah diperiksa dan disertai sumbernya, bagi siapa pun yang peduli pada pulau ini dari dekat ataupun jauh: wisatawan, warga, perantau asal Sumba, dan investor, dalam bahasa Inggris, Spanyol, dan Indonesia. Pengunjung yang lebih paham adalah tamu yang lebih baik, dan pulau yang lebih mudah dipahami lebih mudah dihormati.</p>
<h2 id="publisher">Kegiatan penerbit</h2>
<p>Eco Beach City adalah perusahaan pariwisata dan properti. Perusahaan ini mengelola penginapan di Sumba dan sedang mengembangkan proyek di tepi pantai. Karena itu, penerbit memiliki kepentingan komersial agar Sumba dikenal dan dikunjungi, dan pembaca patut menimbang pemberitaan kami dengan mengetahui hal tersebut. Kami memilih menyampaikannya sendiri.</p>
<h2 id="independence">Cara menjaga independensi</h2>
<ul><li>Penerbit menetapkan garis besar kebijakan redaksi, yaitu media yang netral dan bersumber jelas tentang seluruh pulau, beserta aturan tertulis yang menjadi pegangan redaksi. Penerbit tidak memilih berita demi keuntungan usahanya.</li>
<li>Eco Beach City tidak pernah menjadi pokok berita, dan kami tidak memberitakan urusan komersial atau hukumnya. Kami bukan pihak yang tepat untuk menilai perkara sendiri.</li>
<li>Berita tidak mempromosikan hotel mana pun, termasuk milik penerbit. Hotel, proyek, dan usaha lain diberitakan dengan ukuran yang sama seperti pokok berita lainnya.</li>
<li>Semua isi yang berasal dari penerbit diberi keterangan.</li>
<li>Pemberitaan tidak dapat dibeli. Lihat <a href="/[L]/standards/#paid">pedoman redaksi</a>.</li>
<li>Semua sumber ditautkan sehingga pembaca dapat memeriksa apakah suatu berita dibelokkan.</li></ul>
<p>Aturan ini kami tetapkan sendiri dan tidak diaudit lembaga luar. Karena itulah aturan ini kami umumkan, dan karena itu pula bagian berikut penting.</p>
<h2 id="complain">Cara mengadu</h2>
<p>Jika Anda menilai suatu berita keliru, tidak adil, atau dipengaruhi kepentingan penerbit, tulis ke [MAIL] dengan subjek "Pengaduan", atau gunakan formulir pembaca di halaman <a href="/[L]/plan/#ask">Rencanakan perjalanan</a>. Sebutkan halaman yang dimaksud dan alasannya. Setiap pengaduan kami baca. Jika Anda benar, berita diperbaiki dan dicatat di halaman <a href="/[L]/corrections/">ralat dan koreksi</a>. Jika kami berpendapat lain dan Anda mencantumkan alamat, kami akan menjelaskan alasannya.</p>"""),
}

P["contact"] = {
 "en": ("Contact the newsroom",
  "How to reach The Sumba Times with a tip, a correction, a press request or a proposal: one email address and the forms on this site.",
  """<p>The Sumba Times is reached in writing. One address covers the newsroom: [MAIL]. We read and answer in English, Spanish and Indonesian. Putting one of the words below in the subject line gets your message to the right place faster.</p>
<h2 id="tips">News tips</h2>
<p>Something happening on Sumba that we have missed? Write to [MAIL] with "Tip" in the subject line. A link to a published source (a local outlet, an official notice, a public post by an institution) helps most, because we publish only what we can source. Please do not send confidential documents: we have no secure channel for them.</p>
<h2 id="corrections">Corrections and complaints</h2>
<p>Use the reader form on the <a href="/[L]/plan/#ask">Plan your trip page</a> or write to [MAIL] with "Correction" or "Complaint" in the subject line, with the address of the page. How we handle them is set out on the <a href="/[L]/corrections/">corrections page</a>.</p>
<h2 id="questions">Questions about Sumba</h2>
<p>For travel questions, the same <a href="/[L]/plan/#ask">reader form</a> reaches the desk, and the most common questions become new guides. The "Ask about Sumba" button on every page opens an AI assistant that answers from our guides.</p>
<h2 id="press">Press and researchers</h2>
<p>Journalists, researchers and editors will find facts about the site, citation rules and logos in the <a href="/[L]/press/">press room</a>. For anything else write to [MAIL] with "Press" in the subject line.</p>
<h2 id="partners">Partnerships</h2>
<p>We welcome proposals from media, universities, cultural organisations and public bodies, for example to share data or republish a guide: write with "Partnership" in the subject line. We do not sell coverage, links or mentions, so please do not ask. See our <a href="/[L]/standards/#paid">standards</a>.</p>
<h2 id="newsletter">Newsletter</h2>
<p>To receive our weekly summary, or to change or cancel a subscription, use the <a href="/[L]/newsletter/">newsletter page</a>. Every email has an unsubscribe link.</p>
<h2 id="publisher">The publisher</h2>
<p>The Sumba Times is published by [EBC] (PT Eco Beach City). Messages about the publisher's own business are not handled by the newsroom. More on the <a href="/[L]/ownership/">ownership page</a>.</p>
<p><small>We do not publish a telephone number: the desk works in writing, which also leaves a record of what was asked and answered.</small></p>"""),
 "es": ("Contacto con la redacción",
  "Cómo dirigirse a The Sumba Times para enviar una pista, una rectificación, una petición de prensa o una propuesta: un correo y los formularios del sitio.",
  """<p>La comunicación con The Sumba Times es por escrito. Una sola dirección atiende a toda la redacción: [MAIL]. Se leen y se responden mensajes en inglés, español e indonesio. Indicar en el asunto una de las palabras que siguen ayuda a que el mensaje llegue antes a su destino.</p>
<h2 id="tips">Pistas informativas</h2>
<p>¿Ocurre algo en Sumba que al periódico se le ha pasado? Puede escribirse a [MAIL] con la palabra "Pista" en el asunto. Lo más útil es un enlace a una fuente publicada (un medio local, un aviso oficial, una publicación de una institución), porque solo se publica lo que puede documentarse. Se ruega no enviar documentos confidenciales: no existe un canal seguro para recibirlos.</p>
<h2 id="corrections">Rectificaciones y quejas</h2>
<p>Puede emplearse el formulario para lectores de la página <a href="/[L]/plan/#ask">Planifica tu viaje</a> o escribirse a [MAIL] con la palabra "Corrección" o "Queja" en el asunto y la dirección de la página afectada. El procedimiento se explica en la <a href="/[L]/corrections/">fe de errores</a>.</p>
<h2 id="questions">Preguntas sobre Sumba</h2>
<p>Las dudas de viaje llegan a la redacción por el mismo <a href="/[L]/plan/#ask">formulario para lectores</a>, y las más repetidas se convierten en guías nuevas. El botón "Pregunta sobre Sumba", presente en todas las páginas, abre un asistente de inteligencia artificial que responde a partir de las guías del periódico.</p>
<h2 id="press">Prensa e investigadores</h2>
<p>Periodistas, investigadores y editores disponen de los datos del sitio, las normas de cita y los logotipos en la <a href="/[L]/press/">sala de prensa</a>. Para cualquier otra consulta puede escribirse a [MAIL] con la palabra "Prensa" en el asunto.</p>
<h2 id="partners">Colaboraciones</h2>
<p>Son bienvenidas las propuestas de medios, universidades, entidades culturales y organismos públicos, por ejemplo para compartir datos o reproducir una guía: basta escribir con la palabra "Colaboración" en el asunto. El periódico no vende informaciones, enlaces ni menciones; se ruega no solicitarlo. Véanse las <a href="/[L]/standards/#paid">normas editoriales</a>.</p>
<h2 id="newsletter">Boletín</h2>
<p>Para recibir el resumen semanal, o para modificar o cancelar una suscripción, está la <a href="/[L]/newsletter/">página del boletín</a>. Todos los correos incluyen un enlace de baja.</p>
<h2 id="publisher">El editor</h2>
<p>The Sumba Times lo edita [EBC] (PT Eco Beach City). La redacción no atiende los mensajes relativos a la actividad empresarial del editor. Más información en la página de <a href="/[L]/ownership/">propiedad y financiación</a>.</p>
<p><small>No se facilita un número de teléfono: la redacción trabaja por escrito, lo que además deja constancia de lo preguntado y de lo respondido.</small></p>"""),
 "id": ("Hubungi redaksi",
  "Cara menghubungi The Sumba Times untuk informasi, koreksi, keperluan pers, atau kerja sama: satu alamat email dan formulir di situs ini.",
  """<p>The Sumba Times dihubungi secara tertulis. Satu alamat melayani seluruh redaksi: [MAIL]. Kami membaca dan membalas pesan dalam bahasa Indonesia, Inggris, dan Spanyol. Mencantumkan salah satu kata berikut pada subjek akan mempercepat penanganan pesan Anda.</p>
<h2 id="tips">Informasi untuk redaksi</h2>
<p>Ada peristiwa di Sumba yang luput dari kami? Tulis ke [MAIL] dengan subjek "Info". Tautan ke sumber yang sudah dipublikasikan (media lokal, pengumuman resmi, unggahan lembaga) paling membantu, karena kami hanya memuat hal yang ada sumbernya. Mohon tidak mengirim dokumen rahasia: kami tidak memiliki saluran yang aman untuk itu.</p>
<h2 id="corrections">Koreksi, hak jawab, dan pengaduan</h2>
<p>Gunakan formulir pembaca di halaman <a href="/[L]/plan/#ask">Rencanakan perjalanan</a> atau tulis ke [MAIL] dengan subjek "Koreksi", "Hak jawab", atau "Pengaduan", disertai alamat halamannya. Cara penanganannya dijelaskan di halaman <a href="/[L]/corrections/">ralat dan koreksi</a>.</p>
<h2 id="questions">Pertanyaan tentang Sumba</h2>
<p>Pertanyaan seputar perjalanan dapat dikirim lewat <a href="/[L]/plan/#ask">formulir pembaca</a> yang sama, dan pertanyaan yang sering muncul kami jadikan panduan baru. Tombol "Tanya soal Sumba" di setiap halaman membuka asisten AI yang menjawab berdasarkan panduan kami.</p>
<h2 id="press">Pers dan peneliti</h2>
<p>Wartawan, peneliti, dan penyunting dapat menemukan data tentang situs, ketentuan pengutipan, dan logo di <a href="/[L]/press/">ruang pers</a>. Untuk keperluan lain, tulis ke [MAIL] dengan subjek "Pers".</p>
<h2 id="partners">Kerja sama</h2>
<p>Kami terbuka terhadap usulan dari media, perguruan tinggi, lembaga kebudayaan, dan instansi pemerintah, misalnya untuk berbagi data atau memuat ulang panduan: tulis dengan subjek "Kerja sama". Kami tidak menjual pemberitaan, tautan, ataupun penyebutan, jadi mohon tidak memintanya. Lihat <a href="/[L]/standards/#paid">pedoman redaksi</a>.</p>
<h2 id="newsletter">Nawala</h2>
<p>Untuk menerima ringkasan mingguan, atau mengubah dan menghentikan langganan, gunakan <a href="/[L]/newsletter/">halaman nawala</a>. Setiap email memuat tautan berhenti berlangganan.</p>
<h2 id="publisher">Penerbit</h2>
<p>The Sumba Times diterbitkan oleh [EBC] (PT Eco Beach City). Pesan mengenai kegiatan usaha penerbit tidak ditangani redaksi. Keterangan lebih lanjut ada di halaman <a href="/[L]/ownership/">kepemilikan dan pendanaan</a>.</p>
<p><small>Kami tidak mencantumkan nomor telepon: redaksi bekerja secara tertulis, sehingga pertanyaan dan jawabannya tercatat.</small></p>"""),
}

P["team"] = {
 "en": ("The newsroom",
  "Who makes The Sumba Times: a small desk that works with AI tools under an editorial line set by the publisher, described as it is.",
  """<p>Most newspapers use this page for a list of names and portraits. Ours would be misleading if it did, so here is what the newsroom of The Sumba Times actually is.</p>
<h2 id="desk">A small desk</h2>
<p>The Sumba Times is produced by a small desk that relies on AI tools for most of its daily work: finding what has been published about Sumba, reading it, drafting stories in three languages and checking them before publication. The desk works to an editorial line and a set of written rules set by the publisher, Eco Beach City. It is not a staff of reporters, and we will not pretend that it is.</p>
<h2 id="byline">Why stories carry a desk byline</h2>
<p>Every story is signed "By The Sumba Times desk". We do not use personal bylines because no single journalist wrote the story, and we will not invent names, faces or biographies to make the newspaper look bigger than it is. If a named person ever writes for us, their name will appear on what they wrote.</p>
<h2 id="does">What the desk does</h2>
<ul><li>Publishes new stories each morning, Sumba time (WITA), and at least one a day.</li>
<li>Follows the island's local media and official sources: transport, weather, health and safety, government decisions, the economy, culture and events.</li>
<li>Keeps the travel guides and reference pages up to date and marks them with the date of each revision.</li>
<li>Writes each edition, English, Spanish and Indonesian, for its own readers.</li>
<li>Reads readers' questions, corrections and complaints, and corrects in the open.</li></ul>
<h2 id="doesnot">What the desk does not do</h2>
<ul><li>It does not, as a rule, report from the ground. Unless a story says otherwise, it is built from published, linked sources.</li>
<li>It does not conduct interviews. Quotes are reproduced as published elsewhere, with attribution.</li>
<li>It does not cover its own publisher, promote hotels or accept payment for coverage.</li></ul>
<h2 id="responsible">Who is responsible</h2>
<p>The publisher, Eco Beach City (PT Eco Beach City), sets the editorial line, reviews what is published and answers for every story. How AI is used, and where it stops, is set out in the <a href="/[L]/ai-policy/">AI policy</a>; the rules the desk works to are in the <a href="/[L]/standards/">editorial standards</a>; who owns and funds the site is on the <a href="/[L]/ownership/">ownership page</a>.</p>
<h2 id="reach">How to reach the desk</h2>
<p>Write to [MAIL] or see the <a href="/[L]/contact/">contact page</a>.</p>"""),
 "es": ("La redacción",
  "Quién hace The Sumba Times: una redacción pequeña que trabaja con herramientas de inteligencia artificial bajo la línea editorial que fija el editor.",
  """<p>La mayoría de los periódicos dedican esta página a una lista de nombres y retratos. En este caso sería engañoso, de modo que aquí se explica qué es realmente la redacción de The Sumba Times.</p>
<h2 id="desk">Una redacción pequeña</h2>
<p>The Sumba Times lo elabora una redacción pequeña que se apoya en herramientas de inteligencia artificial para la mayor parte del trabajo diario: localizar lo que se ha publicado sobre Sumba, leerlo, redactar las informaciones en tres idiomas y comprobarlas antes de su publicación. Trabaja conforme a una línea editorial y a unas normas escritas que fija el editor, Eco Beach City. No es una plantilla de reporteros, y el periódico no va a aparentar que lo sea.</p>
<h2 id="byline">Por qué las informaciones llevan firma colectiva</h2>
<p>Todas las informaciones se firman como "Redacción de The Sumba Times". No se emplean firmas personales porque ningún periodista ha escrito el texto por sí solo, y no se inventarán nombres, rostros ni biografías para aparentar un tamaño que el periódico no tiene. Si alguna vez una persona con nombre y apellidos escribe en estas páginas, su firma figurará en lo que haya escrito.</p>
<h2 id="does">Qué hace la redacción</h2>
<ul><li>Publica informaciones nuevas cada mañana, hora de Sumba (WITA), y al menos una al día.</li>
<li>Sigue los medios locales y las fuentes oficiales de la isla: transporte, tiempo, salud y seguridad, decisiones de gobierno, economía, cultura y acontecimientos.</li>
<li>Mantiene al día las guías de viaje y las páginas de referencia, con la fecha de cada revisión.</li>
<li>Escribe cada edición, en inglés, español e indonesio, para sus propios lectores.</li>
<li>Lee las preguntas, las rectificaciones y las quejas de los lectores, y corrige a la vista.</li></ul>
<h2 id="doesnot">Qué no hace la redacción</h2>
<ul><li>No informa, por norma, desde el terreno. Salvo que el texto indique lo contrario, las informaciones se elaboran con fuentes publicadas y enlazadas.</li>
<li>No realiza entrevistas. Las declaraciones se reproducen como se publicaron en otro lugar, con su atribución.</li>
<li>No informa sobre su propio editor, no promociona hoteles y no acepta pagos a cambio de cobertura.</li></ul>
<h2 id="responsible">Quién responde</h2>
<p>El editor, Eco Beach City (PT Eco Beach City), fija la línea editorial, supervisa lo publicado y responde de cada información. El empleo de la inteligencia artificial y sus límites se explican en la página sobre el <a href="/[L]/ai-policy/">uso de la inteligencia artificial</a>; las reglas con las que trabaja la redacción, en las <a href="/[L]/standards/">normas editoriales</a>; quién es el propietario y quién financia el sitio, en la página de <a href="/[L]/ownership/">propiedad y financiación</a>.</p>
<h2 id="reach">Cómo dirigirse a la redacción</h2>
<p>Puede escribirse a [MAIL] o consultarse la página de <a href="/[L]/contact/">contacto</a>.</p>"""),
 "id": ("Redaksi",
  "Siapa yang mengerjakan The Sumba Times: redaksi kecil yang bekerja dengan perangkat AI di bawah kebijakan redaksi yang ditetapkan penerbit.",
  """<p>Kebanyakan media mengisi halaman ini dengan daftar nama dan foto. Bagi kami hal itu akan menyesatkan, maka berikut keadaan redaksi The Sumba Times yang sebenarnya.</p>
<h2 id="desk">Redaksi kecil</h2>
<p>The Sumba Times dikerjakan oleh redaksi kecil yang mengandalkan perangkat AI untuk sebagian besar pekerjaan harian: mencari apa yang telah diterbitkan tentang Sumba, membacanya, menyusun berita dalam tiga bahasa, dan memeriksanya sebelum terbit. Redaksi bekerja menurut kebijakan redaksi dan aturan tertulis yang ditetapkan penerbit, Eco Beach City. Redaksi ini bukan jajaran wartawan lapangan, dan kami tidak akan berpura-pura demikian.</p>
<h2 id="byline">Mengapa berita memakai nama redaksi</h2>
<p>Setiap berita ditandai "Redaksi The Sumba Times". Kami tidak memakai nama penulis perorangan karena berita tidak ditulis oleh satu wartawan, dan kami tidak akan mengarang nama, wajah, ataupun riwayat hidup agar media ini tampak lebih besar daripada kenyataannya. Jika kelak ada penulis yang menulis untuk kami, namanya akan tercantum pada tulisannya.</p>
<h2 id="does">Yang dikerjakan redaksi</h2>
<ul><li>Menerbitkan berita baru setiap pagi waktu Sumba (WITA), sedikitnya satu berita sehari.</li>
<li>Mengikuti media lokal dan sumber resmi tentang Sumba: transportasi, cuaca, kesehatan dan keselamatan, keputusan pemerintah, ekonomi, budaya, dan agenda.</li>
<li>Memutakhirkan panduan perjalanan dan halaman rujukan, serta mencantumkan tanggal setiap pembaruan.</li>
<li>Menulis setiap edisi, dalam bahasa Inggris, Spanyol, dan Indonesia, untuk pembacanya masing-masing.</li>
<li>Membaca pertanyaan, koreksi, dan pengaduan pembaca, serta meralat secara terbuka.</li></ul>
<h2 id="doesnot">Yang tidak dikerjakan redaksi</h2>
<ul><li>Redaksi pada umumnya tidak meliput di lapangan. Kecuali disebutkan dalam tulisan, berita disusun dari sumber yang telah dipublikasikan dan ditautkan.</li>
<li>Redaksi tidak melakukan wawancara. Kutipan dimuat sebagaimana diterbitkan di tempat lain, dengan atribusi.</li>
<li>Redaksi tidak memberitakan penerbitnya sendiri, tidak mempromosikan hotel, dan tidak menerima bayaran untuk pemberitaan.</li></ul>
<h2 id="responsible">Penanggung jawab</h2>
<p>Penerbit, Eco Beach City (PT Eco Beach City), menetapkan kebijakan redaksi, meninjau apa yang terbit, dan bertanggung jawab atas setiap berita. Penggunaan AI beserta batasnya dijelaskan dalam <a href="/[L]/ai-policy/">kebijakan penggunaan AI</a>, aturan kerja redaksi dalam <a href="/[L]/standards/">pedoman redaksi</a>, dan keterangan tentang pemilik serta penyandang dana di halaman <a href="/[L]/ownership/">kepemilikan dan pendanaan</a>.</p>
<h2 id="reach">Cara menghubungi redaksi</h2>
<p>Tulis ke [MAIL] atau buka halaman <a href="/[L]/contact/">kontak</a>.</p>"""),
}

# ---------------------------------------------------------------- outlets (for the table on /sources/)
# host suffix -> (display name, home URL, kind). Hosts not listed fall back to their own domain as name, kind by TLD.
OUTLETS = [
 ("wikipedia.org", "Wikipedia", "https://www.wikipedia.org/", "ref"), ("wikivoyage.org", "Wikivoyage", "https://www.wikivoyage.org/", "ref"),
 ("wikidata.org", "Wikidata", "https://www.wikidata.org/", "ref"), ("wikimedia.org", "Wikimedia Commons", "https://commons.wikimedia.org/", "ref"),
 ("openstreetmap.org", "OpenStreetMap", "https://www.openstreetmap.org/", "ref"), ("britannica.com", "Encyclopaedia Britannica", "https://www.britannica.com/", "ref"),
 ("flightconnections.com", "FlightConnections", "https://www.flightconnections.com/", "ref"), ("sumba-information.com", "Sumba Information", "https://sumba-information.com/", "ref"),
 ("travelfish.org", "Travelfish", "https://www.travelfish.org/", "ref"), ("backindo.com", "Backindo", "https://www.backindo.com/", "ref"),
 ("thespicerouteend.com", "The Spice Route End", "https://thespicerouteend.com/", "ref"), ("lonelyplanet.com", "Lonely Planet", "https://www.lonelyplanet.com/", "ref"),
 ("roughguides.com", "Rough Guides", "https://www.roughguides.com/", "ref"), ("asiantextilestudies.com", "Asian Textile Studies", "https://asiantextilestudies.com/", "ref"),
 ("antaranews.com", "ANTARA", "https://www.antaranews.com/", "media"), ("detik.com", "detikcom", "https://www.detik.com/", "media"),
 ("kompas.com", "Kompas", "https://www.kompas.com/", "media"), ("kompas.id", "Kompas", "https://www.kompas.com/", "media"),
 ("kupang.tribunnews.com", "Pos Kupang", "https://kupang.tribunnews.com/", "media"), ("tribunnews.com", "Tribunnews", "https://www.tribunnews.com/", "media"),
 ("waingapu.com", "Waingapu.com", "https://www.waingapu.com/", "media"), ("victorynews.id", "Victory News", "https://www.victorynews.id/", "media"),
 ("goodnewsfromindonesia.id", "Good News From Indonesia", "https://www.goodnewsfromindonesia.id/", "media"), ("timesindonesia.co.id", "TIMES Indonesia", "https://timesindonesia.co.id/", "media"),
 ("metrotvnews.com", "Metro TV News", "https://www.metrotvnews.com/", "media"), ("thejakartapost.com", "The Jakarta Post", "https://www.thejakartapost.com/", "media"),
 ("tempo.co", "Tempo", "https://www.tempo.co/", "media"), ("kumparan.com", "kumparan", "https://kumparan.com/", "media"),
 ("cnnindonesia.com", "CNN Indonesia", "https://www.cnnindonesia.com/", "media"), ("rri.co.id", "RRI", "https://rri.co.id/", "media"),
 ("voinews.id", "Voice of Indonesia (RRI)", "https://voinews.id/", "media"), ("rctiplus.com", "RCTI+", "https://www.rctiplus.com/", "media"),
 ("inews.id", "iNews", "https://www.inews.id/", "media"), ("jpnn.com", "JPNN", "https://www.jpnn.com/", "media"), ("merdeka.com", "Merdeka.com", "https://www.merdeka.com/", "media"),
 ("mongabay.co.id", "Mongabay Indonesia", "https://mongabay.co.id/", "media"), ("aljazeera.com", "Al Jazeera", "https://www.aljazeera.com/", "media"),
 ("koran-jakarta.com", "Koran Jakarta", "https://koran-jakarta.com/", "media"), ("sergap.co.id", "SERGAP", "https://sergap.co.id/", "media"),
 ("swa.co.id", "SWA", "https://swa.co.id/", "media"), ("popbela.com", "Popbela", "https://www.popbela.com/", "media"),
 ("hukumonline.com", "Hukumonline", "https://www.hukumonline.com/", "media"), ("gourmettraveller.com.au", "Gourmet Traveller", "https://www.gourmettraveller.com.au/", "media"),
 ("bmkg.go.id", "BMKG", "https://www.bmkg.go.id/", "official"), ("bps.go.id", "BPS (Statistics Indonesia)", "https://www.bps.go.id/", "official"),
 ("imigrasi.go.id", "Direktorat Jenderal Imigrasi", "https://www.imigrasi.go.id/", "official"), ("indonesia.travel", "Indonesia.travel (Ministry of Tourism)", "https://www.indonesia.travel/", "official"),
 ("infopublik.id", "InfoPublik (Kementerian Komunikasi dan Digital)", "https://infopublik.id/", "official"),
 ("dispar.sbdkab.go.id", "Dinas Pariwisata Sumba Barat Daya", "https://dispar.sbdkab.go.id/", "official"), ("sbdkab.go.id", "Pemkab Sumba Barat Daya", "https://sbdkab.go.id/", "official"),
 ("cdc.gov", "CDC (United States)", "https://www.cdc.gov/", "official"), ("smartraveller.gov.au", "Smartraveller (Australian Government)", "https://www.smartraveller.gov.au/", "official"),
]
OFFICIAL_SUFFIX = (".go.id", ".gov", ".gov.au", ".gov.uk", ".gob.es", ".europa.eu", ".int")

def _outlet(url):
    h = urllib.parse.urlparse(url).netloc.lower().split(":")[0]
    if h.startswith("www."): h = h[4:]
    if not h: return None
    for suf, name, home, kind in OUTLETS:
        if h == suf or h.endswith("." + suf): return (name, home, kind)
    kind = "official" if h.endswith(OFFICIAL_SUFFIX) else "ref"
    return (h, "https://" + h + "/", kind)

def outlet_stats(g):
    """[(name, home, kind, citations)] sorted by citations, then (total citations, items, outlets)."""
    c = collections.Counter(); meta = {}; cites = 0; items = g["all_items"]()
    for a in items:
        for s in a.get("sources") or []:
            if not isinstance(s, (list, tuple)) or len(s) < 2 or not str(s[1]).startswith("http"): continue
            o = _outlet(str(s[1]))
            if not o: continue
            c[o[0]] += 1; meta[o[0]] = o; cites += 1
    rows = [(n, meta[n][1], meta[n][2], k) for n, k in sorted(c.items(), key=lambda x: (-x[1], x[0].lower()))]
    return rows, cites, len(items), len(c)

# ---------------------------------------------------------------- helpers
def _d(g, iso, l):
    y, m, d = map(int, iso.split("-")); mn = g["MONTHS"][l][m - 1]
    return f"{d} de {mn} de {y}" if l == "es" else f"{d} {mn} {y}"

def _num(n, l): return f"{n:,}".replace(",", "." if l in ("es", "id") else ",")

def url(key, l): return f"{BASE}/{l}/{key}/"

def publishing_principles(l):
    """Absolute URL of the editorial standards page (schema.org publishingPrinciples)."""
    return url("standards", l)

def trust_footer_links(l):
    """HTML for the footer: standards · corrections · AI policy · ownership · contact."""
    f = T[l]["foot"]
    return " · ".join(f'<a href="/{l}/{k}/">{f[k]}</a>' for k in ("standards", "corrections", "ai-policy", "ownership", "contact"))

def org_ld_extra(l):
    """Extra NewsMediaOrganization properties, absolute URLs. Merge into the organization JSON-LD: org.update(pages_trust.org_ld_extra(l))."""
    return {"publishingPrinciples": url("standards", l), "correctionsPolicy": url("corrections", l), "ethicsPolicy": url("standards", l) + "#ethics",
            "ownershipFundingInfo": url("ownership", l), "actionableFeedbackPolicy": url("corrections", l) + "#report", "masthead": url("team", l)}

def log_html(g, l):
    t = T[l]; rows = []
    its = sorted((a for a in g["all_items"]() if a.get("updated") and a.get(l)), key=lambda a: (a["updated"], a["date"], a["slug"]), reverse=True)
    for a in its:
        note = (a[l].get("correction") or "").strip()
        note = f'<br><small><b>{t["log_note"]}:</b> {esc(note)}</small>' if note else ""
        rows.append(f'<tr><td><time datetime="{esc(a["updated"])}">{_d(g, a["updated"], l)}</time></td><td><a href="{g["url_of"](a, l)}">{esc(a[l]["title"])}</a>{note}</td>'
                    f'<td><time datetime="{esc(a["date"])}">{_d(g, a["date"], l)}</time></td></tr>')
    if not rows: return f'<p>{t["log_none"]}</p>'
    th = "".join(f'<th scope="col">{x}</th>' for x in t["log_th"])
    return f'<div class="tw"><table><thead><tr>{th}</tr></thead><tbody>{"".join(rows)}</tbody></table></div>'

def table_html(g, l):
    t = T[l]; rows, cites, items, outlets = outlet_stats(g)
    th = t["src_th"]
    body = "".join(f'<tr><td><a href="{esc(home)}" rel="noopener nofollow">{esc(name)}</a></td><td>{t["kind"][kind]}</td><td class="n">{_num(n, l)}</td></tr>' for name, home, kind, n in rows[:TOP_N])
    tab = f'<div class="tw"><table><thead><tr><th scope="col">{th[0]}</th><th scope="col">{th[1]}</th><th scope="col" class="n">{th[2]}</th></tr></thead><tbody>{body}</tbody></table></div>'
    summ = t["src_sum"].format(items=_num(items, l), cites=_num(cites, l), outlets=_num(outlets, l), d=_d(g, g["NOW"].date().isoformat(), l))
    return tab, summ

def page(g, key, l):
    t = T[l]; title, dek, body = P[key][l]; c = g["CONTACT"]; tpl = "/{l}/" + key + "/"
    body = body.replace("[L]", l).replace("[MAIL]", f'<a href="mailto:{c}">{c}</a>').replace("[EBC]", '<a href="https://ecobeachcity.com/" rel="noopener">Eco Beach City</a>')
    if "[LOG]" in body: body = body.replace("[LOG]", log_html(g, l))
    if "[TABLE]" in body:
        tab, summ = table_html(g, l); body = body.replace("[TABLE]", tab).replace("[SUM]", summ)
    more = "".join(f'<li><a href="/{l}/{k}/">{t["nav"][k]}</a></li>' for k in KEYS if k != key)
    more += f'<li><a href="/{l}/about/">{t["about"]}</a></li><li><a href="/{l}/press/">{t["press"]}</a></li>'
    u = BASE + tpl.format(l=l)
    org = {"@type": "NewsMediaOrganization", "@id": BASE + "/#organization", "name": "The Sumba Times", "url": BASE + "/"}
    org.update(org_ld_extra(l))
    wp = {"@type": LD_TYPE[key], "@id": u, "url": u, "name": title, "headline": title, "description": dek, "inLanguage": l,
          "dateModified": REVIEWED, "lastReviewed": REVIEWED, "isPartOf": {"@type": "WebSite", "name": "The Sumba Times", "url": BASE + "/"},
          "publisher": {"@id": BASE + "/#organization"}, "about": {"@id": BASE + "/#organization"}}
    if key == "contact": org["contactPoint"] = {"@type": "ContactPoint", "contactType": "newsroom", "email": c, "availableLanguage": ["en", "es", "id"]}
    if key in ("ownership", "team"): org["parentOrganization"] = {"@type": "Organization", "name": "Eco Beach City", "legalName": "PT Eco Beach City", "url": "https://ecobeachcity.com/"}
    bc = {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": g["X"][l]["home"], "item": f"{BASE}/{l}/"},
                                                        {"@type": "ListItem", "position": 2, "name": title, "item": u}]}
    ld = {"@context": "https://schema.org", "@graph": [wp, org, bc]}
    pg = g["head"](l, title + " · The Sumba Times", dek, tpl, extra=f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>') + g["masthead"](l, tpl)
    pg += (f'<main id="main" class="w"><article class="nar tru"><div class="crumbs"><a href="/{l}/">{g["X"][l]["home"]}</a> › <a href="/{l}/about/">{t["about"]}</a></div>'
           f'<h1>{title}</h1><p class="dek">{dek}</p><p class="rev"><time datetime="{REVIEWED}">{t["rev"]}</time></p>{body}'
           f'<nav class="more" aria-label="{esc(t["more"])}"><h2>{t["more"]}</h2><ul>{more}</ul></nav></article></main>') + g["footer"](l)
    g["write"](tpl.format(l=l), pg)

def build(g):
    for l in g["LANGS"]:
        for key in KEYS: page(g, key, l)
