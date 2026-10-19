"use strict";
// ---------- 5. Vistas ----------
function greeting() { const h = new Date().getHours(); return h < 6 ? T("Buenas noches", "Good evening") : h < 13 ? T("Buenos días", "Good morning") : h < 21 ? T("Buenas tardes", "Good afternoon") : T("Buenas noches", "Good evening"); }

// 5a. Landing: beneficios primero, nada que rellenar
const BENEFITS = [
  { cat: "trabajo", face: "f02", h: { es: "Te consigue entrevistas mientras duermes", en: "Lands you interviews while you sleep" },
    p: { es: "Adapta tu CV a cada oferta, se presenta por ti y te propone horarios. Tú solo confirmas.", en: "Tailors your CV to each job, applies for you and proposes times. You just confirm." },
    live: { es: "3 entrevistas propuestas esta noche", en: "3 interviews proposed overnight" } },
  { cat: "vivienda", face: "f21", h: { es: "Casa más barata, para alquilar o comprar", en: "A cheaper home, to rent or buy" },
    p: { es: "Rastrea anuncios, detecta chollos antes que nadie y negocia el precio por ti.", en: "Tracks listings, spots deals before anyone else and negotiates the price for you." },
    live: { es: "Piso con terraza · 12 % menos tras negociar", en: "Flat with terrace · 12% off after negotiating" } },
  { cat: "eventos", face: "f07", h: { es: "Entradas para tu artista favorito, mucho más baratas", en: "Tickets to your favourite artist for much less" },
    p: { es: "Vigila la reventa oficial y las bajadas de precio, y te avisa en el momento justo.", en: "Watches official resale and price drops, and pings you at the right moment." },
    live: { es: "2 entradas · 48 € menos que ayer", en: "2 tickets · €48 less than yesterday" } },
  { cat: "ahorro", face: "f17", h: { es: "Paga menos de luz, móvil y seguros", en: "Pay less for power, phone and insurance" },
    p: { es: "Compara con tus facturas reales, no con el anuncio, y te deja el cambio preparado.", en: "Compares with your real bills, not the ad, and gets the switch ready." },
    live: { es: "31 € menos al mes en la luz", en: "€31 less a month on electricity" } },
  { cat: "viajes", face: "f10", h: { es: "Vuelos y hoteles cuando bajan", en: "Flights and hotels when prices drop" },
    p: { es: "Prueba fechas flexibles y combinaciones que tú no tienes tiempo de mirar.", en: "Tries flexible dates and combos you don't have time to check." },
    live: { es: "Bali · 348 € ida y vuelta", en: "Bali · €348 return" } },
  { cat: "otro", icon: "familia", face: "f29", h: { es: "Lo que les funcionó a tus amigos, para ti", en: "What worked for your friends, for you" },
    p: { es: "Las Persohnas de tus amigos comparten lo que funciona de verdad: lo que no está en Google ni lo sabe ChatGPT.", en: "Your friends' Persohnas share what actually works — things that aren't on Google and ChatGPT doesn't know." },
    live: { es: "«Visita el piso también de noche»", en: "“Visit the flat at night too”" } },
];
function faceMarquee() {
  const row = (ids) => ids.map((id) => `<span class="av"><img class="av-face" src="${faceSrc(id)}" alt="" width="128" height="128" loading="lazy"></span>`).join("");
  const a = FACE_IDS.slice(0, 18), b = FACE_IDS.slice(18);
  return `<div class="marquee" aria-hidden="true"><div class="mq-track">${row(a)}${row(a)}</div><div class="mq-track rev">${row(b)}${row(b)}</div></div>`;
}
function viewLanding() {
  const cta = (cls = "") => `<a class="btn btn-primary btn-xl ${cls}" href="#/empezar">${S.me ? T("Ir a mi Persohna", "Go to my Persohna") : T("Crear mi Persohna gratis", "Create my Persohna — free")}</a>`;
  return `<div class="landing">
    <header class="l-top"><a class="logo" href="#/inicio"><span class="logo-dot" aria-hidden="true"></span>persohna</a><div class="row g2">${langBtn()}${S.me ? "" : `<a class="btn btn-ghost btn-sm" href="#/descubrir">${T("Explorar", "Explore")}</a><button class="btn btn-secondary btn-sm" type="button" data-action="account" data-v="login">${T("Entrar", "Log in")}</button>`}</div></header>
    <section class="hero">
      <span class="eyebrow">${ico("sparkle")}${T("Tu yo digital · gratis · 24/7", "Your digital self · free · 24/7")}</span>
      <h1 class="hero-h1">${T("Tu Persohna trabaja por ti <em>mientras duermes.</em>", "Your Persohna works for you <em>while you sleep.</em>")}</h1>
      <p class="hero-sub">${T("Dile qué quieres y busca, compara y negocia por ti las 24 horas. Y aprende de lo que les funcionó a tus amigos.", "Tell it what you want and it searches, compares and negotiates for you around the clock. And it learns from what worked for your friends.")}</p>
      <div class="stack g2 hero-cta">${cta()}<p class="hint">${T("30 segundos · gratis · sin tarjeta", "30 seconds · free · no card")}</p></div>
    </section>
    ${faceMarquee()}
    <section class="stack g4" aria-labelledby="ben-t">
      <h2 class="l-h2" id="ben-t">${T("Lo que hace por ti", "What it does for you")}</h2>
      <div class="ben-grid">${BENEFITS.map((b) => `<a class="ben" href="#/empezar" data-action="start-cat" data-cat="${b.cat}">
        <img class="ben-ico" src="${iconSrc(b.icon || b.cat)}" alt="" width="112" height="112" loading="lazy">
        <h3 class="h-card">${L(b.h)}</h3>
        <p class="muted">${L(b.p)}</p>
        <div class="live">${avatar({ face: b.face }, "xs")}<span class="live-dot" aria-hidden="true"></span><span>${L(b.live)}</span></div>
      </a>`).join("")}</div>
      <p class="post-meta">${T("Ejemplos de lo que hace una Persohna. Estamos activando la búsqueda automática poco a poco.", "Examples of what a Persohna does. We're switching on automatic search step by step.")}</p>
    </section>
    <section class="stack g4" aria-labelledby="all-t">
      <div class="stack g1"><h2 class="l-h2" id="all-t">${T("Para todo lo que te importa", "For everything you care about")}</h2><p class="muted">${T("Elige por dónde empezar. Tu Persohna se encarga del resto.", "Pick where to start. Your Persohna handles the rest.")}</p></div>
      <div class="cat-grid">${CAT_ALL.map((c) => `<a class="cat-cell" href="#/empezar" data-action="start-cat" data-cat="${c}"><img src="${iconSrc(c)}" alt="" width="112" height="112" loading="lazy"><span>${esc(L(CATS[c].label))}</span></a>`).join("")}</div>
    </section>
    <section class="stack g4" aria-labelledby="how-t">
      <h2 class="l-h2" id="how-t">${T("Así de fácil", "This easy")}</h2>
      <ol class="how">
        <li><img class="how-ico" src="/icons/comunidad.webp" alt="" width="112" height="112" loading="lazy"><div><span class="how-n">1</span><strong>${T("Dile qué quieres", "Tell it what you want")}</strong><p class="muted">${T("Un trabajo, una casa, unas entradas. En 30 segundos.", "A job, a home, some tickets. In 30 seconds.")}</p></div></li>
        <li><img class="how-ico" src="/icons/organizacion.webp" alt="" width="112" height="112" loading="lazy"><div><span class="how-n">2</span><strong>${T("Trabaja 24/7", "It works 24/7")}</strong><p class="muted">${T("Busca, compara, negocia y aprende de tu red.", "Searches, compares, negotiates and learns from your network.")}</p></div></li>
        <li><img class="how-ico" src="/icons/tramites.webp" alt="" width="112" height="112" loading="lazy"><div><span class="how-n">3</span><strong>${T("Tú decides", "You decide")}</strong><p class="muted">${T("Nada se compra, se envía ni se firma sin tu OK.", "Nothing is bought, sent or signed without your OK.")}</p></div></li>
      </ol>
    </section>
    <section class="trust">
      <div><img src="/icons/tramites.webp" alt="" width="112" height="112" loading="lazy"><span>${T("Nada sin tu OK", "Nothing without your OK")}</span></div>
      <div><img src="/icons/vivienda.webp" alt="" width="112" height="112" loading="lazy"><span>${T("Tus datos son tuyos", "Your data is yours")}</span></div>
      <div><img src="/icons/compras.webp" alt="" width="112" height="112" loading="lazy"><span>${T("Comisiones siempre visibles", "Commissions always shown")}</span></div>
      <div><img src="/icons/dinero.webp" alt="" width="112" height="112" loading="lazy"><span>${T("Gratis para ti", "Free for you")}</span></div>
    </section>
    <section class="card stack g3 early">
      <h2 class="h-card">${T("Acceso anticipado", "Early access")}</h2>
      <p class="muted">${T("Activamos la búsqueda automática por orden de llegada. Crea tu Persohna hoy y guarda tu sitio. Si invitas a amigos, pasas antes.", "We're switching on automatic search in sign-up order. Create your Persohna today to hold your spot. Invite friends to move up.")}</p>
      ${cta("btn-block")}
    </section>
    <footer class="l-foot post-meta">© Persohna · ${T("Beta", "Beta")}</footer>
    ${S.me ? "" : `<div class="sticky-cta">${cta("btn-block")}</div>`}
  </div>`;
}

// 5b. Onboarding: objetivo → detalles → nombre (cara opcional)
function onbSteps() { const o = ui.onb; return o.cat && o.cat !== "otro" ? 3 : 2; }
function viewOnboarding() {
  const o = ui.onb, steps = onbSteps();
  const idx = o.step === 2 && steps === 2 ? 1 : o.step;
  const prog = `<div class="progress" aria-hidden="true">${Array.from({ length: steps }, (_, i) => `<span class="${i <= idx ? "on" : ""}"></span>`).join("")}</div>`;
  let body = "", foot = "";
  const back = o.step === 0 ? `<a class="btn btn-secondary" href="#/inicio">${T("Atrás", "Back")}</a>` : `<button class="btn btn-secondary" type="button" data-action="onb-back">${T("Atrás", "Back")}</button>`;
  if (o.step === 0) {
    body = `<div class="stack g2"><h1 class="h-screen">${T("¿Qué quieres que tu Persohna consiga primero?", "What should your Persohna get you first?")}</h1><p class="muted">${T("Elige uno. Luego puedes añadir todos los que quieras.", "Pick one. You can add as many as you like later.")}</p><p class="small">${T("¿Ya tienes cuenta?", "Already have an account?")} <button class="link-btn" type="button" data-action="account" data-v="login">${T("Entrar", "Log in")}</button></p></div>
      <div class="goal-tiles">${CAT_ORDER.map((c) => `<button class="tile" type="button" data-action="onb-goal" data-cat="${c}" aria-pressed="${o.cat === c}">${catIcon(c)}<span class="stack g1"><strong>${esc(L(CATS[c].verb))}</strong><span class="muted small">${esc(L(CATS[c].pitch))}</span></span></button>`).join("")}
        <div class="more-goals"><p class="section-title">${T("Más objetivos", "More goals")}</p><div class="cat-grid sm">${CAT_MORE.map((c) => `<button class="cat-cell" type="button" data-action="onb-goal" data-cat="${c}" aria-pressed="${o.cat === c}"><img src="${iconSrc(c)}" alt="" width="112" height="112" loading="lazy"><span>${esc(L(CATS[c].label))}</span></button>`).join("")}</div></div>
        <button class="tile tile-wide" type="button" data-action="onb-goal" data-cat="otro">${catIcon("otro")}<span class="stack g1"><strong>${T("Todavía no lo sé", "I'm not sure yet")}</strong><span class="muted small">${T("Explorar lo que consiguen otros", "Explore what others achieve")}</span></span></button></div>`;
    foot = back;
  } else if (o.step === 1) {
    const cat = CATS[o.cat];
    const fields = cat.fields.filter((f) => f.step === 1);
    body = `<div class="stack g2">${catIcon(o.cat)}<h1 class="h-screen">${esc(L(cat.verb))}</h1><p class="muted">${T("Con esto tu Persohna ya puede empezar. Si no lo tienes claro, sáltalo.", "That's enough for your Persohna to start. Not sure? Skip it.")}</p></div>
      <form class="stack g4" data-form="onb-details" novalidate>${fields.map((f) => fieldHTML(f, o.data, o.errors || {})).join("")}</form>`;
    foot = `${back}<button class="btn btn-ghost" type="button" data-action="onb-skip">${T("Luego", "Later")}</button><button class="btn btn-primary" type="button" data-action="onb-next">${T("Continuar", "Continue")}</button>`;
  } else {
    body = `<div class="stack g3" style="align-items:center;text-align:center">
        <div class="onb-face">${avatar({ face: o.face }, "xl", "me-av")}<button class="icon-btn shuffle" type="button" data-action="onb-shuffle" aria-label="${T("Otra cara al azar", "Another random face")}">${ico("shuffle")}</button></div>
        <h1 class="h-screen">${T("Esta es tu Persohna.<br>¿Cómo te llamas?", "This is your Persohna.<br>What's your name?")}</h1></div>
      <form class="field" data-form="onb-name" novalidate><label for="onb-name">${T("Tu nombre", "Your name")}</label><input class="input" id="onb-name" name="name" maxlength="30" autocomplete="given-name" enterkeyhint="done" value="${esc(o.name)}" ${o.err ? 'aria-invalid="true" aria-describedby="onb-err"' : ""}>${o.err ? `<p class="err" id="onb-err">${esc(o.err)}</p>` : ""}</form>
      <details class="face-pick"><summary>${T("Elegir otra cara (opcional)", "Pick another face (optional)")}</summary>
        <div class="face-scroll" role="radiogroup" aria-label="${T("Cara", "Face")}">${FACE_IDS.map((k, i) => `<button class="opt" type="button" role="radio" aria-checked="${o.face === k}" aria-label="${T("Cara", "Face")} ${i + 1}" data-action="onb-face" data-v="${k}">${avatar({ face: k }, "md")}</button>`).join("")}</div></details>`;
    foot = `${back}<button class="btn btn-primary" type="button" data-action="onb-create">${T("Crear mi Persohna", "Create my Persohna")}</button>`;
  }
  return `<div class="onb-wrap"><div class="onb-top"><a class="logo" href="#/inicio"><span class="logo-dot" aria-hidden="true"></span>persohna</a><div class="row g2"><span class="post-meta">${T("Paso", "Step")} ${idx + 1} ${T("de", "of")} ${steps}</span>${langBtn()}</div></div>${prog}<div class="onb-body">${body}</div><div class="onb-foot">${foot}</div></div>`;
}

// 5c. Inicio
function viewInicio() {
  const me = person("me");
  const goals = S.goals.filter((g) => !g.done);
  const main = goals[0], others = goals.slice(1);
  const cats = new Set(goals.map((g) => g.cat));
  let ideas = SEED_POSTS.filter((p) => cats.has(p.cat) && p.kind !== "question");
  if (ideas.length < 2) ideas = ideas.concat(SEED_POSTS.filter((p) => !cats.has(p.cat) && p.kind !== "question"));
  ideas = ideas.slice(0, 2);
  let mainBlock = "";
  if (main) {
    const st = goalStatus(main), steps = planOf(main), done = planDone(main), n = done.filter(Boolean).length;
    const nextIdx = done.findIndex((d) => !d);
    mainBlock = `<section class="goal-main" aria-labelledby="gm-t">
      <div class="gm-top">
        <div class="row g3">${catIcon(main.cat)}<div class="grow"><div class="section-title">${T("Tu Persohna está con", "Your Persohna is on")}</div><h2 class="h-card" id="gm-t">${esc(main.title)}</h2></div></div>
        <div class="row g2 wrap">${statusTag(st)}${main.from ? `<span class="tag">${T("Inspirado en", "Inspired by")} ${esc(person(findPost(main.from)?.who || "nora")?.name || "")}</span>` : ""}</div>
        ${steps.length ? `<div class="stack g2"><div class="row between small"><span>${T("Plan", "Plan")}</span><span class="muted">${n}/${steps.length}</span></div><div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="${steps.length}" aria-valuenow="${n}" aria-label="${T("Progreso del plan", "Plan progress")}"><i style="width:${(n / steps.length) * 100}%"></i></div></div>` : ""}
      </div>
      <div class="gm-next"><div class="stack g1"><div class="section-title">${T("Siguiente paso", "Next step")}</div><p>${st === "needs" ? T("Falta un dato para que tu Persohna pueda empezar.", "One detail missing before your Persohna can start.") : nextIdx >= 0 ? esc(steps[nextIdx]) : T("Plan completo. ¿Lo conseguiste?", "Plan done. Did you get it?")}</p></div>
        <div class="row g2 wrap">${st === "needs" ? `<button class="btn btn-primary" type="button" data-action="edit-goal" data-id="${main.id}">${T("Completar", "Complete")}</button>` : nextIdx >= 0 && stepAction(main, nextIdx) === "cv" ? `<button class="btn btn-primary" type="button" data-action="cv">${T("Subir o pegar CV", "Upload or paste CV")}</button>` : nextIdx >= 0 ? `<button class="btn btn-primary" type="button" data-action="step" data-id="${main.id}" data-i="${nextIdx}">${ico("check")}${T("Hecho", "Done")}</button>` : `<button class="btn btn-primary" type="button" data-action="complete-goal" data-id="${main.id}">${T("Lo conseguí", "I got it")}</button>`}<button class="btn btn-ghost" type="button" data-action="open-goal" data-id="${main.id}">${T("Ver plan", "See plan")}</button></div></div>
    </section>`;
  }
  const inv = Math.min(S.invites, 3);
  return `<div class="stack g6">
    <div class="hello">
      <button type="button" data-action="wave" aria-label="${T("Saludar a tu Persohna", "Wave at your Persohna")}" class="plain">${avatar(me, "md", "me-av")}</button>
      <div class="grow stack g1"><p class="muted">${greeting()},</p><h1 class="h-screen">${esc(S.me.name)}</h1></div>
      <div class="stack g2" style="align-items:flex-end">${S.streak.n > 1 ? `<span class="streak" title="${T("Días seguidos", "Days in a row")}">${ico("fire")}${S.streak.n}</span>` : ""}${lvlChip(me, true)}</div>
    </div>
    ${S.welcome ? `<div class="note welcome">${ico("sparkle")}<span><strong>${T("¡Tu Persohna ha nacido!", "Your Persohna is alive!")}</strong> ${main ? T("Ya tiene tu primer objetivo y un plan. Marca cada paso cuando lo hagas.", "It has your first goal and a plan. Tick each step as you go.") : T("Mira lo que consiguen otros y pulsa «Mi Persohna también».", "See what others achieve and tap “My Persohna too”.")}</span><button class="icon-btn" type="button" data-action="dismiss-welcome" aria-label="${T("Cerrar", "Close")}">${ico("close")}</button></div>` : ""}
    ${mainBlock}
    ${main?.planBusy ? `<p class="hint">${T("Tu Persohna está preparando un plan a medida…", "Your Persohna is building a tailored plan…")}</p>` : ""}
    ${typeof accountCard === "function" ? accountCard() : ""}
    ${S.goals.some((g) => g.cat === "trabajo" && !g.done) || S.cv ? cvCard() : ""}
    <section class="card invite stack g3" aria-labelledby="inv-t">
      <div class="row g3">${avatar({ face: "f05" }, "sm")}${avatar({ face: "f13" }, "sm", "ov")}${avatar({ face: "f22" }, "sm", "ov")}<div class="grow"><h2 class="h-card" id="inv-t">${T("Tu Persohna es más lista con amigos", "Your Persohna is smarter with friends")}</h2></div></div>
      <p class="muted small">${T("Lo que les funciona a tus amigos llega a tu Persohna. Invita a 3 y pasas antes en el acceso anticipado.", "What works for your friends reaches your Persohna. Invite 3 to move up the early-access list.")}</p>
      <div class="stack g2"><div class="row between small"><span>${T("Invitaciones enviadas", "Invites sent")}</span><span class="muted">${inv}/3</span></div><div class="meter" aria-hidden="true"><i style="width:${(inv / 3) * 100}%"></i></div></div>
      <button class="btn btn-secondary" type="button" data-action="invite">${ico("users")}${T("Invitar amigos", "Invite friends")}</button>
    </section>
    <section class="card ask" aria-labelledby="ask-t">
      <h2 class="h-card" id="ask-t">${main ? T("¿Algo más que quieras conseguir?", "Anything else you want?") : T("¿Qué quieres conseguir?", "What do you want to get?")}</h2>
      <div class="sugs">${CAT_ORDER.slice(0, 4).map((c) => `<button class="sug" type="button" data-action="new-goal" data-cat="${c}">${catIcon(c)}<span>${esc(L(CATS[c].verb))}</span></button>`).join("")}</div>
      <form class="row g2" data-form="free-goal" novalidate>
        <label class="sr" for="free-goal">${T("Escribe tu propio objetivo", "Write your own goal")}</label>
        <input class="input grow" id="free-goal" name="t" maxlength="120" placeholder="${T("O escríbelo con tus palabras…", "Or write it in your own words…")}" autocomplete="off" enterkeyhint="send">
        <button class="icon-btn send-btn" type="submit" aria-label="${T("Crear objetivo", "Create goal")}">${ico("plus")}</button>
      </form>
      <p class="err" id="free-goal-err" hidden></p>
    </section>
    ${others.length ? `<section class="stack g3" aria-labelledby="og-t"><h2 class="section-title" id="og-t">${T("Otros objetivos", "Other goals")}</h2>${others.map(goalRow).join("")}</section>` : ""}
    <section class="stack g3" aria-labelledby="id-t">
      <div class="row between"><h2 class="section-title" id="id-t">${T("Ideas de la comunidad para ti", "Community ideas for you")}</h2><a class="btn btn-ghost btn-sm" href="#/descubrir">${T("Ver todas", "See all")}</a></div>
      <div class="feed">${ideas.map((p) => postCard(p)).join("")}</div>
      <p class="post-meta">${T("Las publicaciones y niveles de esta beta son ejemplos.", "Posts and levels in this beta are examples.")}</p>
    </section>
  </div>`;
}
function goalRow(g) {
  const steps = planOf(g), n = planDone(g).filter(Boolean).length;
  return `<button class="goal-row" type="button" data-action="open-goal" data-id="${g.id}">${catIcon(g.cat)}<span class="grow stack g1"><span style="font-weight:700">${esc(g.title)}</span><span class="row g2 wrap">${statusTag(goalStatus(g))}${steps.length && !g.done ? `<span class="post-meta">${n}/${steps.length}</span>` : ""}</span></span>${ico("chev", "chev")}</button>`;
}

function cvCard() {
  const cv = S.cv;
  return `<section class="card cv-card row g3 wrap" aria-labelledby="cv-t"><img src="/icons/trabajo.webp" alt="" width="56" height="56"><div class="grow stack g1"><h2 class="h-card" id="cv-t">${cv?.text ? T("Tu CV está listo", "Your CV is ready") : T("Sube tu CV", "Upload your CV")}</h2><p class="muted small">${cv?.text ? T("Adáptalo a cada oferta en un minuto: encaje, carta y preguntas de entrevista.", "Tailor it to each job in a minute: fit, cover letter and interview questions.") : T("PDF, Word o pegado. Te digo qué mejorar y qué puestos te encajan.", "PDF, Word or pasted. I'll tell you what to improve and which roles fit.")}</p></div>
    <div class="row g2 wrap">${cv?.text ? `<button class="btn btn-primary" type="button" data-action="cv" data-v="tailor">${T("Adaptar a una oferta", "Tailor to a job")}</button><button class="btn btn-ghost" type="button" data-action="cv" data-v="review">${T("Ver análisis", "See review")}</button>` : `<button class="btn btn-primary" type="button" data-action="cv" data-v="edit">${T("Subir o pegar CV", "Upload or paste CV")}</button>`}</div></section>`;
}

// 5d. Descubrir
function viewDescubrir() {
  const q = ui.q.trim().toLowerCase();
  let posts = allPosts();
  if (ui.filter === "guardados") posts = posts.filter((p) => S.saved.includes(p.id));
  else if (ui.filter === "preguntas") posts = posts.filter((p) => p.kind === "question");
  else if (ui.filter !== "todo") posts = posts.filter((p) => p.cat === ui.filter);
  if (q) posts = posts.filter((p) => [L(p.title), L(p.context), L(p.detail), ...(L(p.sample) || []), person(p.who).name, L(CATS[p.cat]?.label)].join(" ").toLowerCase().includes(q));
  const chips = [["todo", T("Todo", "All")], ...CAT_ORDER.map((c) => [c, L(CATS[c].label)]), ["preguntas", T("Preguntas", "Questions")], ["guardados", `${T("Guardados", "Saved")}${S.saved.length ? " · " + S.saved.length : ""}`]];
  const recent = !q && S.recent.length ? `<div class="row g2 wrap recent"><span class="post-meta">${T("Recientes:", "Recent:")}</span>${S.recent.map((r) => `<button class="chip chip-sm" type="button" data-action="recent" data-q="${esc(r)}">${esc(r)}</button>`).join("")}</div>` : "";
  return `<div class="stack g4">
    ${S.me ? "" : `<div class="guest-cta card row g3 wrap"><span class="grow"><strong>${T("¿Quieres que tu Persohna haga esto por ti?", "Want your Persohna to do this for you?")}</strong></span><a class="btn btn-primary btn-sm" href="#/empezar">${T("Crear gratis", "Create — free")}</a></div>`}
    <div class="stack g1"><h1 class="h-screen">${T("Descubrir", "Discover")}</h1><p class="muted">${T("Lo que otras personas consiguieron y no encontrarás en Google. Pulsa «Mi Persohna también» para adaptarlo a tu vida.", "What others achieved — stuff you won't find on Google. Tap “My Persohna too” to adapt it to your life.")}</p></div>
    <div class="toolbar">
      <form class="search" role="search" data-form="search"><label class="sr" for="q">${T("Buscar experiencias", "Search experiences")}</label>${ico("search")}<input class="input" id="q" type="search" value="${esc(ui.q)}" placeholder="${T("Buscar: Bali, entradas, entrevista…", "Search: Bali, tickets, interview…")}" autocomplete="off" enterkeyhint="search"></form>
      ${recent}
      <div class="chips" role="group" aria-label="${T("Filtrar por tema", "Filter by topic")}">${chips.map(([k, l]) => `<button class="chip" type="button" data-action="filter" data-cat="${k}" aria-pressed="${ui.filter === k}">${esc(l)}</button>`).join("")}</div>
    </div>
    <div class="feed" id="feed">${posts.length ? posts.map((p) => postCard(p)).join("") : emptyFeed()}</div>
    ${S.me ? `<button class="btn btn-secondary" type="button" data-action="share">${ico("plus")}${T("Compartir algo que te funcionó o preguntar", "Share something that worked, or ask")}</button>` : ""}
    <p class="post-meta">${T("Las personas, cifras y niveles de esta beta son ejemplos ilustrativos.", "People, figures and levels in this beta are illustrative examples.")}</p>
  </div>`;
}
function emptyFeed() {
  if (ui.filter === "guardados" && !ui.q) return `<div class="empty">${ico("bookmark")}<p><strong>${T("Todavía no has guardado nada.", "Nothing saved yet.")}</strong></p><p class="muted">${T("Pulsa el marcador de cualquier publicación para tenerla aquí.", "Tap the bookmark on any post to keep it here.")}</p><button class="btn btn-secondary" type="button" data-action="filter" data-cat="todo">${T("Ver todo", "See all")}</button></div>`;
  return `<div class="empty"><p><strong>${T("No hay resultados", "No results")}${ui.q ? ` ${T("para", "for")} «${esc(ui.q)}»` : ""}.</strong></p><p class="muted">${T("Prueba otra palabra o pregunta a la comunidad.", "Try another word or ask the community.")}</p><div class="row g2 wrap" style="justify-content:center"><button class="btn btn-secondary" type="button" data-action="clear-search">${T("Limpiar búsqueda", "Clear search")}</button>${S.me ? `<button class="btn btn-primary" type="button" data-action="ask-community">${T("Preguntar", "Ask")}</button>` : ""}</div></div>`;
}

// 5e. Mi Persohna
function viewPersohna() {
  const segs = [["objetivos", T("Objetivos", "Goals")], ["conversacion", T("Conversación", "Chat")], ["capacidades", T("Capacidades", "Abilities")], ["apariencia", T("Apariencia", "Look")], ["evolucion", T("Evolución", "Growth")]];
  const me = person("me");
  let body = "";
  if (ui.seg === "objetivos") {
    const open = S.goals.filter((g) => !g.done), done = S.goals.filter((g) => g.done);
    body = `<div class="stack g3">
      ${open.length ? open.map(goalRow).join("") : `<div class="empty"><p><strong>${T("Sin objetivos todavía.", "No goals yet.")}</strong></p><p class="muted">${T("Empieza por algo concreto.", "Start with something concrete.")}</p><button class="btn btn-primary" type="button" data-action="new-goal-picker">${T("Elegir un objetivo", "Pick a goal")}</button></div>`}
      ${done.length ? `<h3 class="section-title" style="margin-top:var(--s4)">${T("Conseguidos", "Achieved")}</h3>${done.map(goalRow).join("")}` : ""}
      <button class="btn btn-secondary" type="button" data-action="new-goal-picker">${ico("plus")}${T("Nuevo objetivo", "New goal")}</button>
      <div class="card stack g2"><div class="section-title">${T("Cómo actúa", "How it acts")}</div>
        <div class="seg seg-sm" role="radiogroup" aria-label="${T("Autonomía", "Autonomy")}">
          <button type="button" role="radio" aria-checked="${S.autonomy === "ask"}" data-action="autonomy" data-v="ask">${T("Pedirme permiso siempre", "Always ask me")}</button>
          <button type="button" role="radio" aria-checked="${S.autonomy === "notify"}" data-action="autonomy" data-v="notify">${T("Hacerlo y avisarme", "Do it and tell me")}</button></div>
        <p class="hint">${T("Comprar, pagar o firmar siempre requiere tu OK, elijas lo que elijas.", "Buying, paying or signing always needs your OK, whatever you choose.")}</p></div>
    </div>`;
  } else if (ui.seg === "conversacion") {
    const msgs = S.chat.length ? S.chat : [{ from: "p", es: `Hola, ${S.me.name}. Soy tu Persohna. Cuéntame qué quieres conseguir y lo convierto en un objetivo con plan.`, en: `Hi ${S.me.name}, I'm your Persohna. Tell me what you want and I'll turn it into a goal with a plan.` }];
    const quick = [T("Quiero un trabajo mejor pagado", "I want a better-paid job"), T("Busco piso barato", "Looking for a cheap flat"), T("Entradas para un concierto", "Tickets for a gig"), T("Pago mucho de luz", "My power bill is too high")];
    body = `<div class="stack g4">
      <div class="note">${ico("sparkle")}<span>${T("Funciono con IA (Claude). Puedes pegarme o subir tu CV, una oferta o cualquier documento. Aún no busco en webs ni compro por ti: eso llega pronto.", "I run on AI (Claude). You can paste or upload your CV, a job ad or any document. I don't browse sites or buy for you yet: that's coming.")}</span></div>
      <div class="chat" id="chat" aria-live="polite">${msgs.map((m, i) => `<div class="bubble ${m.from === "me" ? "me" : "p"}${m.pending ? " typing" : ""}">${m.from === "me" && (m.text || "").length > 600 ? esc(m.text.slice(0, 280)) + `<span class="muted"> … (${m.text.length} ${T("caracteres", "chars")})</span>` : md(m.text ?? L(m))}${m.from !== "me" && !m.pending && S.chat.length ? `<button class="copy-btn" type="button" data-action="copy-msg" data-i="${i}" aria-label="${T("Copiar", "Copy")}">${T("Copiar", "Copy")}</button>` : ""}${m.cta ? `<div style="margin-top:10px"><button class="btn btn-secondary btn-sm" type="button" data-action="new-goal" data-cat="${esc(m.cta)}">${T("Crear objetivo:", "Create goal:")} ${esc(L(CATS[m.cta].verb).toLowerCase())}</button></div>` : ""}</div>`).join("")}</div>
      <div class="chips wrapchips">${quick.map((q) => `<button class="chip chip-sm" type="button" data-action="quick" data-t="${esc(q)}">${esc(q)}</button>`).join("")}</div>
      <form class="chat-in" data-form="chat" novalidate><button class="icon-btn bordered attach-btn" type="button" data-action="chat-attach" aria-label="${T("Adjuntar CV o documento", "Attach CV or document")}">${ico("plus")}</button><input type="file" id="chat-file" accept=".pdf,.docx,.txt,.md,application/pdf,text/plain" hidden><label class="sr" for="chat-in">${T("Mensaje para tu Persohna", "Message to your Persohna")}</label><textarea class="textarea grow" id="chat-in" rows="1" style="min-height:52px" maxlength="12000" placeholder="${T("Escribe o pega tu CV…", "Write or paste your CV…")}"></textarea><button class="icon-btn send-btn" type="submit" aria-label="${T("Enviar", "Send")}">${ico("send")}</button></form>
      ${S.chat.length ? `<button class="btn btn-ghost btn-sm" type="button" data-action="chat-clear" style="align-self:flex-start">${ico("trash")}${T("Borrar conversación", "Clear chat")}</button>` : ""}
    </div>`;
  } else if (ui.seg === "capacidades") {
    const caps = [
      [T("Hablar con IA", "Chat with AI"), T("Responde, te aconseja y convierte lo que quieres en objetivos. Con Claude.", "Answers, advises and turns what you want into goals. Powered by Claude."), true],
      [T("Revisar y adaptar tu CV", "Review and tailor your CV"), T("Sube tu CV: te dice qué mejorar, qué puestos te encajan y escribe la carta para cada oferta.", "Upload your CV: it tells you what to improve, which roles fit and writes the letter for each job."), true],
      [T("Plan a medida para cada objetivo", "A tailored plan for each goal"), T("Pasos concretos según tus datos, no una lista genérica.", "Concrete steps based on your details, not a generic list."), true],
      [T("Guardar tu Persohna en tu cuenta", "Save your Persohna to your account"), T("Entra desde cualquier dispositivo con tu email.", "Log in from any device with your email."), true],
      [T("Organizar tus objetivos con plan", "Organise your goals with a plan"), T("Guarda qué quieres, tus preferencias y los pasos.", "Stores what you want, your preferences and the steps."), true],
      [T("Adaptar experiencias de otros", "Adapt other people's wins"), T("Convierte lo que le funcionó a otra persona en un objetivo tuyo.", "Turns what worked for someone else into your goal."), true],
      [T("Preguntar a la comunidad", "Ask the community"), T("Lo que no está en internet, te lo cuenta quien lo ha vivido.", "What isn't online, from people who lived it."), true],
      [T("Buscar en portales y webs cada día", "Search portals and sites daily"), T("Anuncios, ofertas de empleo, entradas y tarifas.", "Listings, job ads, tickets and tariffs."), false],
      [T("Avisos de bajada de precio", "Price-drop alerts"), T("Te avisa cuando algo baja de tu precio máximo.", "Pings you when something drops below your max."), false],
      [T("Presentarse a ofertas y agendar entrevistas", "Apply to jobs and book interviews"), T("Con tu OK, se presenta por ti y propone horarios.", "With your OK, applies for you and proposes times."), false],
      [T("Negociar por ti", "Negotiate for you"), T("Precio de alquiler, compra o tarifas, dentro de tus límites.", "Rent, purchase or tariff prices, within your limits."), false],
      [T("Hablar con las Persohnas de tus amigos", "Talk to your friends' Persohnas"), T("Aprovechar lo que tu red ha vivido, con su permiso.", "Use what your network has lived, with their permission."), false],
    ];
    body = `<div class="stack g3">${caps.map(([t, d, on]) => `<div class="card row g3" style="align-items:flex-start"><span class="cat-ico ${on ? "cat-aprender" : "cat-otro"}">${ico(on ? "check" : "lock")}</span><div class="grow stack g1"><strong>${t}</strong><p class="muted small">${d}</p></div><span class="tag ${on ? "tag-ready" : ""}">${on ? T("Disponible", "Available") : T("Pronto", "Soon")}</span></div>`).join("")}</div>`;
  } else if (ui.seg === "apariencia") {
    body = appearanceEditor();
  } else {
    body = evolution();
  }
  return `<div class="stack g5">
    <div class="row g4">${avatar(me, "md")}<div class="grow stack g1"><h1 class="h-screen">${T("Mi Persohna", "My Persohna")}</h1><p class="muted small">${ico("lock", "i16")} ${T("Tu espacio privado. Nada de aquí se publica solo.", "Your private space. Nothing here is published on its own.")}</p></div></div>
    <div class="seg" role="tablist" aria-label="${T("Secciones de Mi Persohna", "My Persohna sections")}">${segs.map(([k, l]) => `<button role="tab" type="button" id="tab-${k}" aria-selected="${ui.seg === k}" aria-controls="seg-panel" data-action="seg" data-seg="${k}">${l}</button>`).join("")}</div>
    <div id="seg-panel" role="tabpanel" aria-labelledby="tab-${ui.seg}">${body}</div>
  </div>`;
}
let draftLook = null;
function appearanceEditor() {
  if (!draftLook) draftLook = { face: S.me.face, frame: S.me.frame || "none" };
  const d = draftLook, Lv = level();
  const changed = d.face !== S.me.face || d.frame !== (S.me.frame || "none");
  return `<div class="stack g5">
    <div class="card stack g3" style="align-items:center;text-align:center">${avatar({ face: d.face, frame: d.frame }, "xl")}<p class="muted small">${T("Vista previa", "Preview")} · ${esc(S.me.name)}</p></div>
    <fieldset class="stack g3" style="border:0;padding:0;margin:0"><legend class="section-title" style="margin-bottom:var(--s3)">${T("Cara", "Face")}</legend>
      <div class="opt-grid many" role="radiogroup" aria-label="${T("Cara", "Face")}">${FACE_IDS.map((k, i) => `<button class="opt" type="button" role="radio" aria-checked="${d.face === k}" aria-label="${T("Cara", "Face")} ${i + 1}" data-action="look" data-k="face" data-v="${k}">${avatar({ face: k }, "md")}</button>`).join("")}</div></fieldset>
    <fieldset class="stack g3" style="border:0;padding:0;margin:0"><legend class="section-title" style="margin-bottom:var(--s3)">${T("Marco", "Frame")}</legend>
      <div class="sw-grid" role="radiogroup" aria-label="${T("Marco", "Frame")}">${FRAMES.map((f) => { const locked = f.lvl > Lv; return `<button class="sw" type="button" role="radio" aria-checked="${d.frame === f.id}" ${locked ? `aria-disabled="true" data-locked="${f.lvl}"` : ""} data-action="look" data-k="frame" data-v="${f.id}">${locked ? ico("lock") : ""}${L(f.label)}${locked ? ` · ${T("nivel", "level")} ${f.lvl}` : ""}</button>`; }).join("")}</div>
      <p class="hint">${T("Los marcos se desbloquean al subir de nivel. Tu cara nunca cambia sola.", "Frames unlock as you level up. Your face never changes on its own.")}</p></fieldset>
    <div class="row g2 sticky-save"><button class="btn btn-secondary grow" type="button" data-action="look-cancel" ${changed ? "" : "disabled"}>${T("Descartar", "Discard")}</button><button class="btn btn-primary grow" type="button" data-action="look-save" ${changed ? "" : "disabled"}>${T("Guardar", "Save")}</button></div>
  </div>`;
}
function evolution() {
  const Lv = level(), inL = xpInLevel(), contribs = S.myPosts.length;
  return `<div class="stack g5">
    <div class="card stack g4">
      <div class="row g4">${avatar(person("me"), "md")}<div class="grow"><div class="h-card">${esc(S.me.name)} · ${T("Nivel", "Level")} ${Lv}<span class="muted small"> / 100</span></div><p class="muted small">${contribs ? T(`${contribs} aportación${contribs > 1 ? "es" : ""}`, `${contribs} contribution${contribs > 1 ? "s" : ""}`) : T("Todavía sin aportaciones", "No contributions yet")}</p></div></div>
      <div class="stack g2"><div class="row between small"><span>${T("Hacia el nivel", "To level")} ${Lv + 1}</span><span class="muted">${inL} / ${XP_PER} ${T("puntos", "points")}</span></div><div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="${XP_PER}" aria-valuenow="${inL}" aria-label="${T("Progreso hacia el siguiente nivel", "Progress to next level")}"><i style="width:${(inL / XP_PER) * 100}%"></i></div>
      <p class="hint">${T("Compartir algo útil suma 25 puntos; responder una pregunta, 10. Cuando otras personas confirmen que les sirvió, sumará más.", "Sharing something useful earns 25 points; answering a question, 10. When others confirm it helped, it'll earn more.")}</p></div>
      <button class="btn btn-secondary" type="button" data-action="open-level">${T("Qué significa mi nivel", "What my level means")}</button>
    </div>
    <div class="trio">
      <div class="card stack g2"><div class="section-title">${T("Reputación", "Reputation")}</div><p><strong>${T("Nivel", "Level")} ${Lv}</strong></p><p class="muted small">${T("Aportaciones útiles reconocidas por otras personas.", "Useful contributions recognised by others.")}</p></div>
      <div class="card stack g2"><div class="section-title">${T("Capacidades", "Abilities")}</div><p><strong>3 ${T("disponibles", "available")}</strong></p><p class="muted small">${T("Lo que tu Persohna sabe hacer. No depende del nivel.", "What your Persohna can do. Not tied to level.")}</p></div>
      <div class="card stack g2"><div class="section-title">${T("Racha", "Streak")}</div><p><strong>${S.streak.n} ${T(S.streak.n === 1 ? "día" : "días", S.streak.n === 1 ? "day" : "days")}</strong></p><p class="muted small">${T("Días seguidos revisando tu Persohna.", "Days in a row checking in.")}</p></div>
    </div>
    <div class="note warn">${ico("info")}<span>${T("Un nivel alto refleja aportaciones útiles. No garantiza que una respuesta de la IA sea correcta.", "A high level reflects useful contributions. It doesn't guarantee an AI answer is right.")}</span></div>
    <section class="card stack g3"><h3 class="section-title">${T("Historia", "History")}</h3>${S.history.length ? `<ul class="timeline">${S.history.slice(0, 12).map((h) => `<li><span class="dot" aria-hidden="true"></span><div class="grow"><div>${esc(h.text ?? L(h))}</div><div class="post-meta">${fmtDate(h.at)}</div></div></li>`).join("")}</ul>` : `<p class="muted">${T("Aquí aparecerá lo que vayáis consiguiendo.", "What you achieve together will show up here.")}</p>`}</section>
  </div>`;
}

// 5f. Perfil
function viewPerfil() {
  const me = person("me");
  return `<div class="stack g5">
    <div class="card stack g4">
      <div class="row g4">${avatar(me, "lg")}<div class="grow stack g2"><h1 class="h-screen" style="font-size:28px">${esc(S.me.name)}</h1>${lvlChip(me, true)}</div></div>
      <p>${S.me.bio ? esc(S.me.bio) : `<span class="muted">${T("Sin presentación todavía.", "No bio yet.")}</span>`}</p>
      <button class="btn btn-secondary" type="button" data-action="edit-profile">${ico("edit")}${T("Editar perfil", "Edit profile")}</button>
    </div>
    ${typeof accountSection === "function" ? accountSection() : ""}
    ${cvCard()}
    <section class="stack g3" aria-labelledby="ap-t">
      <div class="row between wrap g2"><h2 class="section-title" id="ap-t">${T("Tus aportaciones", "Your contributions")}</h2><button class="btn btn-primary btn-sm" type="button" data-action="share">${ico("plus")}${T("Compartir", "Share")}</button></div>
      ${S.myPosts.length ? `<div class="feed">${S.myPosts.map((p) => postCard({ ...p, who: "me" }, { noActions: true }) + `<div class="row g2" style="margin-top:-8px"><button class="btn btn-ghost btn-sm" type="button" data-action="delete-post" data-id="${p.id}">${ico("trash")}${T("Retirar", "Remove")}</button></div>`).join("")}</div>`
        : `<div class="empty"><p><strong>${T("Aún no has compartido nada.", "Nothing shared yet.")}</strong></p><p class="muted">${T("Cuenta algo que te funcionó: una visita, un precio, un truco. Verás una vista previa antes de publicar.", "Share something that worked: a viewing, a price, a trick. You'll see a preview first.")}</p></div>`}
    </section>
    <section class="card stack g2" aria-labelledby="earn-t">
      <h2 class="section-title" id="earn-t">${T("Ganancias", "Earnings")}</h2>
      <p><strong>0 €</strong> <span class="tag">${T("Pronto", "Soon")}</span></p>
      <p class="hint">${T("Cuando tu recomendación ayude a alguien a contratar algo con comisión, compartiremos parte contigo. Siempre visible para quien la lee.", "When your tip helps someone buy something that pays a commission, we'll share part of it with you. Always shown to the reader.")}</p>
    </section>
    <section class="card stack g2" aria-labelledby="vis-t">
      <h2 class="section-title" id="vis-t">${T("Preferencias", "Preferences")}</h2>
      <label class="switch"><span><strong>${T("Mostrar mi nivel", "Show my level")}</strong><br><span class="muted small">${T("Si lo ocultas, nadie lo ve, tampoco en tus aportaciones.", "If hidden, nobody sees it, not even on your posts.")}</span></span><input type="checkbox" data-action="toggle-level" ${S.showLevel ? "checked" : ""}></label>
      <div class="switch"><span><strong>${T("Idioma", "Language")}</strong></span><div class="seg seg-sm" role="radiogroup" aria-label="${T("Idioma", "Language")}"><button type="button" role="radio" aria-checked="${LANG === "es"}" data-action="set-lang" data-v="es">Español</button><button type="button" role="radio" aria-checked="${LANG === "en"}" data-action="set-lang" data-v="en">English</button></div></div>
      <p class="hint">${T("Tus objetivos, conversaciones y documentos son privados y nunca aparecen en tu perfil.", "Your goals, chats and documents are private and never appear on your profile.")}</p>
    </section>
    <section class="card stack g3" aria-labelledby="demo-t">
      <h2 class="section-title" id="demo-t">${T("Tus datos", "Your data")}</h2>
      <p class="muted small">${typeof loggedIn === "function" && loggedIn() ? T("Se guarda en tu cuenta y en este dispositivo. Puedes descargarlo o borrarlo cuando quieras.", "Saved to your account and on this device. Download or delete it whenever you like.") : storageOK ? T("Sin cuenta, todo se guarda solo en este dispositivo.", "Without an account, everything is stored only on this device.") : T("Este navegador no permite guardar: los cambios duran mientras la pestaña esté abierta.", "This browser blocks storage: changes last while the tab is open.")}</p>
      <div class="row g2 wrap"><button class="btn btn-secondary" type="button" data-action="export">${ico("download")}${T("Descargar mis datos", "Download my data")}</button><button class="btn btn-danger" type="button" data-action="reset">${T("Borrar todo", "Delete everything")}</button><a class="btn btn-ghost" href="#/publico">${T("Ver portada", "See landing page")}</a></div>
    </section>
  </div>`;
}

function ctxPanel() {
  if (!S.me) return "";
  if (ui.route === "descubrir") {
    const goals = S.goals.filter((g) => !g.done);
    return `<div class="stack g4"><h2 class="section-title">${T("Tus objetivos", "Your goals")}</h2>${goals.length ? goals.slice(0, 4).map(goalRow).join("") : `<p class="muted small">${T("Cuando adaptes una experiencia, aparecerá aquí.", "When you adapt an experience, it'll show up here.")}</p>`}
      <div class="card stack g2"><div class="section-title">${T("Guardados", "Saved")}</div><p><strong>${S.saved.length}</strong></p><button class="btn btn-secondary btn-sm" type="button" data-action="filter" data-cat="guardados">${T("Ver guardados", "See saved")}</button></div></div>`;
  }
  if (ui.route === "inicio") {
    const Lv = level(), inL = xpInLevel();
    return `<div class="stack g4"><h2 class="section-title">${T("Tu Persohna", "Your Persohna")}</h2><div class="card stack g3" style="align-items:center;text-align:center">${avatar(person("me"), "lg")}<div class="h-card">${esc(S.me.name)}</div>${lvlChip(person("me"), true)}
      <div class="stack g2" style="width:100%"><div class="meter" aria-hidden="true"><i style="width:${(inL / XP_PER) * 100}%"></i></div><p class="hint">${XP_PER - inL} ${T("puntos para el nivel", "points to level")} ${Lv + 1}</p></div></div>
      <div class="card stack g2"><div class="section-title">${T("Objetivos", "Goals")}</div><p><strong>${S.goals.filter((g) => !g.done).length}</strong> ${T("activos", "active")} · <strong>${S.goals.filter((g) => g.done).length}</strong> ${T("conseguidos", "achieved")}</p></div></div>`;
  }
  return "";
}

// ---------- Render y rutas ----------
function render(opts = {}) {
  const app = $("#app"), main = $("#main");
  app.classList.remove("onb", "guest", "land");
  const y = window.scrollY;
  if (ui.route === "publico" || (!S.me && ui.route === "inicio")) {
    app.classList.add("land"); main.innerHTML = viewLanding(); $("#ctx").innerHTML = ""; renderNav(); return;
  }
  if (!S.me && ui.route === "empezar") { app.classList.add("onb"); main.innerHTML = viewOnboarding(); $("#ctx").innerHTML = ""; return; }
  if (!S.me) { app.classList.add("guest"); main.innerHTML = viewDescubrir(); $("#ctx").innerHTML = ""; renderNav(); if (opts.keepScroll) window.scrollTo(0, y); return; }
  const views = { inicio: viewInicio, descubrir: viewDescubrir, persohna: viewPersohna, perfil: viewPerfil };
  main.innerHTML = (views[ui.route] || viewInicio)();
  const ctx = ctxPanel();
  $("#ctx").innerHTML = ctx;
  app.classList.toggle("no-ctx", !ctx);
  renderNav();
  if (opts.keepScroll) window.scrollTo(0, y);
}
function go(route) {
  ui.scroll[ui.route] = window.scrollY;
  if (location.hash !== "#/" + route) location.hash = "#/" + route; else onRoute();
}
let pendingPost = null;
function onRoute() {
  let r = (location.hash.replace(/^#\/?/, "") || "inicio").split("?")[0];
  if (r.startsWith("p/")) { pendingPost = r.slice(2); r = "descubrir"; history.replaceState(null, "", "#/descubrir"); }
  const prev = ui.route;
  ui.scroll[prev] = window.scrollY;
  const ok = ["inicio", "descubrir", "persohna", "perfil", "publico", "empezar"];
  ui.route = ok.includes(r) ? r : "inicio";
  if (S.me && ui.route === "empezar") { ui.route = "inicio"; history.replaceState(null, "", "#/inicio"); }
  if (ui.route !== "persohna") draftLook = null;
  touchStreak();
  render();
  window.scrollTo(0, ui.scroll[ui.route] || 0);
  if (prev !== ui.route) { const h = $("#main h1"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); } }
  if (pendingPost) { const id = pendingPost; pendingPost = null; if (findPost(id)) setTimeout(() => openPost(id), 50); }
}
