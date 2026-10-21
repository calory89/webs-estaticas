"use strict";
// ---------- Persohna v8: «Contactos». Pegas tu LinkedIn y cada día te presento a 5 personas, con el mensaje ya escrito. Tú lo envías. ----------

const NET_WANTS = () => [
  ["clientes", T("Clientes", "Clients"), T("Gente que puede comprarte", "People who could buy from you")],
  ["trabajo", T("Trabajo", "A job"), T("Quien contrata donde encajas", "People who hire where you fit")],
  ["inversion", T("Inversión", "Investment"), T("Inversores de tu sector", "Investors in your field")],
  ["socios", T("Socios", "Partners"), T("Perfiles que te complementan", "People who complement you")],
  ["mentores", T("Mentores", "Mentors"), T("Quien ya hizo tu camino", "People who walked your path")],
  ["sector", T("Mi sector", "My industry"), T("Gente clave cerca de ti", "Key people near you")],
];
const NET = () => (S.net ||= { profile: null, want: "", note: "", where: "", day: "", people: [], seen: [], st: {}, job: null, jobAt: 0, all: [] });
const NS = { step: "link", busy: false, err: "", draft: null, tick: 0 }; // estado de la ventana de alta
let netPoll = null;

// ---------- utilidades ----------
const netHue = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return ["#CFE3D4", "#D6E4F2", "#EFE3C8", "#E2D9F0", "#F2DAD3", "#D9EDE8"][h % 6]; };
const initials = (n) => String(n || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase();
const netWantLabel = (k) => (NET_WANTS().find((w) => w[0] === k) || [, T("Contactos", "Contacts")])[1];
const isLinkedIn = (u) => /linkedin\.com\//i.test(u || "");
const netCall = (action, body = {}) => callFn("persohna-people", { action, lang: LANG, device: DEVICE, token: loggedIn() ? AUTH.token : undefined, ...body }, action === "profile" ? 90000 : 30000);
function netErr(e) {
  return e === "daily_limit" ? T("Por hoy ya está: mañana te traigo 5 personas nuevas.", "That's it for today: tomorrow I'll bring 5 new people.")
    : e === "bad_url" ? T("Ese enlace no parece un perfil de LinkedIn. Debe ser como linkedin.com/in/tu-nombre", "That doesn't look like a LinkedIn profile link. It should look like linkedin.com/in/your-name")
    : e === "timeout" || e === "network" ? T("No hay conexión o ha tardado demasiado. Vuelve a intentarlo.", "No connection or it took too long. Try again.")
    : T("Algo ha fallado al buscar. Vuelve a intentarlo en un momento.", "Something failed while searching. Try again in a moment.");
}

// ---------- Paso 1: tu perfil ----------
function openNet(start = "") {
  const n = NET();
  if (n.profile && !start) { go("contactos"); return; }
  NS.step = "link"; NS.err = ""; NS.busy = false; NS.draft = n.profile ? { ...n.profile } : null;
  closeAll(); openLayer(netSetupHTML(), { full: true, label: "net" });
  if (start) setTimeout(() => { const i = $("#net-url"); if (i) { i.value = start; netFromLink(); } }, 50);
}
function netSetupHTML() {
  const n = NET(), d = NS.draft || {};
  const head = sheetHead(T("Tus contactos", "Your contacts"));
  if (NS.step === "link") {
    return `${head}<div class="sheet-body net-setup stack g5" data-view="net">
      <div class="stack g2"><h3 class="net-h">${T("¿Quién eres?", "Who are you?")}</h3><p class="muted">${T("Pega el enlace de tu perfil de LinkedIn. Con eso busco gente que te conviene conocer.", "Paste your LinkedIn profile link. I'll use it to find people worth meeting.")}</p></div>
      <form class="stack g3" data-form="net-link" novalidate>
        <label class="sr" for="net-url">${T("Enlace de tu LinkedIn", "Your LinkedIn link")}</label>
        <input class="input input-xl" id="net-url" type="url" inputmode="url" autocomplete="url" placeholder="linkedin.com/in/tu-nombre" value="${esc(n.profile?.url || "")}" ${NS.busy ? "disabled" : ""}>
        <button class="btn btn-primary btn-big" type="submit" ${NS.busy ? "disabled" : ""}>${NS.busy ? `<span class="spinner" aria-hidden="true"></span>${T("Leyendo tu perfil…", "Reading your profile…")}` : T("Seguir", "Continue")}</button>
        ${NS.err ? `<p class="err" role="alert">${esc(NS.err)}</p>` : ""}
      </form>
      <div class="net-or"><span>${T("o", "or")}</span></div>
      <div class="stack g2">
        <label class="drop drop-sm">${ico("download", "rot180")}<strong>${T("Sube tu CV o el PDF de tu LinkedIn", "Upload your CV or LinkedIn PDF")}</strong><span class="muted small">${T("En LinkedIn: tu perfil › Más › Guardar en PDF", "On LinkedIn: your profile › More › Save to PDF")}</span><input type="file" id="net-file" accept=".pdf,.docx,.txt,.md,application/pdf" hidden></label>
        ${S.cv?.text ? `<button class="btn btn-secondary" type="button" data-action="net-usecv">${T("Usar el CV que ya me diste", "Use the CV you already gave me")}</button>` : ""}
        <button class="link-btn small" type="button" data-action="net-manual" style="align-self:flex-start">${T("Prefiero escribirlo yo", "I'd rather type it")}</button>
      </div>
      <p class="hint">${ico("lock", "i16")} ${T("Solo leo lo que es público. Nunca escribo a nadie por ti: te dejo el mensaje listo y tú decides.", "I only read what's public. I never message anyone for you: I leave the message ready and you decide.")}</p>
    </div>`;
  }
  // confirmar perfil y elegir qué buscas
  const want = d.want || n.want || "";
  return `${head}<div class="sheet-body net-setup stack g5" data-view="net">
    <div class="net-me">
      <span class="net-mono" style="background:${netHue(d.name)}">${esc(initials(d.name))}</span>
      <div class="stack g2 grow">
        <div class="field"><label for="net-name">${T("Tu nombre", "Your name")}</label><input class="input" id="net-name" maxlength="80" value="${esc(d.name || S.me?.name || "")}"></div>
        <div class="field"><label for="net-head">${T("A qué te dedicas", "What you do")}</label><input class="input" id="net-head" maxlength="140" value="${esc(d.headline || "")}" placeholder="${T("Ej.: Fundador de una inmobiliaria en Málaga", "E.g. Founder of a real-estate agency in Málaga")}"></div>
      </div>
    </div>
    ${d.summary ? `<p class="muted small">${esc(d.summary)}</p>` : ""}
    <fieldset class="stack g3 plain-fs"><legend class="net-h">${T("¿A quién quieres conocer?", "Who do you want to meet?")}</legend>
      <div class="net-wants">${NET_WANTS().map(([k, t, s]) => `<button type="button" class="net-want" data-action="net-want" data-v="${k}" aria-pressed="${want === k}"><strong>${t}</strong><span>${s}</span></button>`).join("")}</div>
    </fieldset>
    <div class="field"><label for="net-note">${T("Cuéntame un poco más (opcional)", "Tell me a bit more (optional)")}</label><input class="input" id="net-note" maxlength="200" value="${esc(d.note ?? n.note ?? "")}" placeholder="${T("Ej.: hoteles boutique que quieran vender en España", "E.g. boutique hotels that want to sell in Spain")}"></div>
    <div class="field"><label for="net-where">${T("¿Dónde? (opcional)", "Where? (optional)")}</label><input class="input" id="net-where" maxlength="60" value="${esc(d.where ?? n.where ?? d.city ?? "")}" placeholder="${T("Ciudad, país o «en remoto»", "City, country or “remote”")}"></div>
    ${NS.err ? `<p class="err" role="alert">${esc(NS.err)}</p>` : ""}
  </div><div class="sheet-foot"><button class="btn btn-ghost" type="button" data-action="net-back" style="flex:0 0 auto">${T("Atrás", "Back")}</button><button class="btn btn-primary" type="button" data-action="net-go" ${NS.busy ? "disabled" : ""}>${T("Buscar mis 5 personas", "Find my 5 people")}</button></div>`;
}
async function netFromLink() {
  let url = ($("#net-url")?.value || "").trim();
  if (!url) { NS.err = T("Pega el enlace de tu perfil.", "Paste your profile link."); setLayer(netSetupHTML()); return; }
  if (!/^https?:\/\//i.test(url)) url = "https://" + url.replace(/^\/+/, "");
  if (!/linkedin\.com\/in\/[^/?#\s]+/i.test(url)) { NS.err = netErr("bad_url"); setLayer(netSetupHTML()); return; }
  NS.busy = true; NS.err = ""; setLayer(netSetupHTML());
  const r = await netCall("profile", { url });
  NS.busy = false;
  const p = r.profile || {};
  NS.draft = { ...(NS.draft || {}), ...p, url: p.url || url };
  if (r.error || !p.found) NS.err = r.error === "bad_url" ? netErr("bad_url") : T("No encuentro mucho de tu perfil en público. Escribe a qué te dedicas y seguimos.", "I can't find much of your profile publicly. Write what you do and let's go on.");
  NS.step = "who"; setLayer(netSetupHTML());
  if (!NS.err) $("#net-head")?.blur();
}
async function netFromText(text, name = "") {
  NS.busy = true; NS.err = ""; NS.step = "link"; setLayer(netSetupHTML());
  const r = await netCall("profile", { text: text.slice(0, 20000) });
  NS.busy = false;
  NS.draft = { ...(NS.draft || {}), ...(r.profile || {}) };
  if (r.error || !r.profile?.found) NS.err = T("No he podido leer bien el archivo. Completa tus datos aquí.", "I couldn't read the file well. Fill in your details here.");
  NS.step = "who"; setLayer(netSetupHTML());
}
function netReadWho() {
  const d = (NS.draft ||= {});
  d.name = ($("#net-name")?.value || "").trim(); d.headline = ($("#net-head")?.value || "").trim();
  d.note = ($("#net-note")?.value || "").trim(); d.where = ($("#net-where")?.value || "").trim();
}
function netStart() {
  netReadWho();
  const d = NS.draft, n = NET();
  if (!d.name || !d.headline) { NS.err = T("Pon tu nombre y a qué te dedicas.", "Add your name and what you do."); setLayer(netSetupHTML()); return; }
  if (!d.want) { NS.err = T("Elige a quién quieres conocer.", "Pick who you want to meet."); setLayer(netSetupHTML()); return; }
  n.profile = { name: d.name, headline: d.headline, company: d.company || "", city: d.city || "", country: d.country || "", industry: d.industry || "", skills: (d.skills || []).slice(0, 10), summary: d.summary || "", url: d.url || "" };
  n.want = d.want; n.note = d.note || ""; n.where = d.where || "";
  // si es la primera vez, nace su Persohna con su nombre
  if (!S.me) {
    S.me = { name: d.name.split(/\s+/)[0], face: randomFace(), frame: "none", bio: d.headline.slice(0, 140), code: uid().slice(0, 6) };
    addHistory("Nació tu Persohna", "Your Persohna was born"); S.welcome = false; S.tourDone = true; touchStreak();
  }
  save(); closeAll(); netFind(true); go("contactos");
}

// ---------- Búsqueda (en segundo plano: puedes cerrar la app) ----------
async function netFind(force = false) {
  const n = NET(); if (!n.profile) return;
  if (n.job && Date.now() - n.jobAt < 6 * 60e3) { netWatch(); return; }
  if (!force && n.day === today() && n.people.length) return;
  const companies = n.want === "trabajo" && S.hunt?.jobs ? [...new Set(S.hunt.jobs.filter((j) => (S.hunt.fits?.[j.id]?.fit || 0) >= 60).map((j) => j.company).filter(Boolean))].slice(0, 6) : [];
  n.err = ""; n.jobAt = Date.now(); n.job = "pending"; save(); netRefresh();
  const r = await netCall("find", { profile: n.profile, want: n.want, note: n.note, where: n.where, companies, exclude: n.seen.slice(-120) });
  if (r.error || !r.job) { n.job = null; n.err = netErr(r.error); save(); netRefresh(); return; }
  n.job = r.job; save(); netWatch();
}
function netWatch() {
  clearTimeout(netPoll);
  const n = NET(); if (!n.job || n.job === "pending") return;
  netPoll = setTimeout(async () => {
    const r = await netCall("job", { id: n.job });
    if (r.status === "running" || (r.error && r.error !== "not_found" && !r.status)) { NS.tick++; netRefresh(); netWatch(); return; }
    n.job = null;
    if (r.status === "done" && r.people?.length) {
      if (n.day !== today()) n.people = [];
      const fresh = r.people.filter((p) => !n.people.some((x) => x.key === p.key));
      fresh.forEach((p) => { p.at = today(); });
      n.people = [...fresh, ...n.people].slice(0, 10); n.day = today();
      n.seen = [...new Set([...n.seen, ...fresh.map((p) => p.url)])].slice(-300);
      n.all = [...fresh, ...n.all.filter((x) => !fresh.some((p) => p.key === x.key))].slice(0, 150);
      notify(`Tus ${fresh.length} personas de hoy están listas, con el mensaje escrito.`, `Your ${fresh.length} people for today are ready, message included.`, "tool:net");
      if (typeof buzz === "function") buzz();
    } else n.err = netErr(r.error);
    save(); netRefresh(true);
  }, 4000);
}
function netRefresh(full = false) {
  if (ui.route === "contactos" && !stackLayers.length) render({ keepScroll: !full });
  else if (ui.route === "inicio" && !stackLayers.length) render({ keepScroll: true });
}

// ---------- La página «Contactos» ----------
function netStepsHTML() {
  const n = NET(), s = Math.floor((Date.now() - n.jobAt) / 1000);
  const steps = [T("Leo tu perfil y lo que buscas", "Reading your profile and goal"), T("Busco en webs de empresas, eventos, prensa y perfiles públicos", "Searching company sites, events, press and public profiles"), T("Compruebo que cada persona existe y sigue en su puesto", "Checking each person exists and is still in the role"), T("Te escribo un mensaje para cada una", "Writing a message for each one")];
  const at = s < 8 ? 0 : s < 40 ? 1 : s < 75 ? 2 : 3;
  return `<section class="net-wait card" aria-live="polite"><div class="net-orbit" aria-hidden="true">${[0, 1, 2, 3, 4].map((i) => `<span style="--i:${i}"></span>`).join("")}</div>
    <h2 class="h-card">${T("Buscando a tus 5 personas", "Finding your 5 people")}</h2>
    <ol class="net-steps">${steps.map((t, i) => `<li class="${i < at ? "ok" : i === at ? "now" : ""}">${i < at ? ico("check") : `<span class="dot"></span>`}<span>${t}</span></li>`).join("")}</ol>
    <p class="hint">${T("Tarda uno o dos minutos. Puedes cerrar la app: lo guardo y te aviso.", "It takes a minute or two. You can close the app: I'll save it and let you know.")}</p></section>`;
}
function personCard(p, i) {
  const n = NET(), st = n.st[p.key] || {};
  const ch = st.ch || (isLinkedIn(p.url) ? "linkedin" : p.x ? "x" : p.email ? "email" : "linkedin");
  const chans = [["linkedin", "LinkedIn"], ...(p.x ? [["x", "X"]] : []), ...(p.email ? [["email", "Email"]] : [])];
  const msg = st.edit?.[ch] ?? (ch === "email" ? p.msg?.email : p.msg?.[ch]) ?? "";
  const liSearch = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent([p.name, p.company].filter(Boolean).join(" "))}`;
  const open = ch === "x" ? `https://x.com/${encodeURIComponent(p.x.replace(/^@/, ""))}` : ch === "email" ? `mailto:${p.email}?subject=${encodeURIComponent(p.msg?.email_subject || "")}&body=${encodeURIComponent(msg)}` : isLinkedIn(p.url) ? p.url : liSearch;
  const openLbl = ch === "email" ? T("Abrir el email", "Open the email") : ch === "x" ? T("Copiar y abrir X", "Copy and open X") : isLinkedIn(p.url) ? T("Copiar y abrir LinkedIn", "Copy and open LinkedIn") : T("Copiar y buscarle en LinkedIn", "Copy and find them on LinkedIn");
  const days = st.at ? Math.round((Date.now() - new Date(st.at)) / 864e5) : 0;
  const state = st.s === "sent" ? (days >= 5 ? `<div class="net-ask"><span>${T("¿Te respondió?", "Did they reply?")}</span><button class="btn btn-secondary btn-sm" type="button" data-action="net-st" data-k="${esc(p.key)}" data-v="replied">${T("Sí", "Yes")}</button><button class="btn btn-ghost btn-sm" type="button" data-action="net-st" data-k="${esc(p.key)}" data-v="noreply">${T("Todavía no", "Not yet")}</button></div>` : `<div class="net-done">${ico("check")}<span>${T(`Enviado ${days ? `hace ${days} ${days === 1 ? "día" : "días"}` : "hoy"}. Si no contesta en 5 días, te lo recuerdo.`, `Sent ${days ? `${days} day${days === 1 ? "" : "s"} ago` : "today"}. If they don't reply in 5 days, I'll remind you.`)}</span></div>`)
    : st.s === "replied" ? `<div class="net-done win">${ico("sparkle")}<span>${T("¡Te respondió! Sigue la conversación por donde le escribiste.", "They replied! Carry on the conversation where you wrote.")}</span></div>`
    : st.s === "noreply" ? `<div class="net-done muted">${T("Sin respuesta. Prueba por otro canal o deja pasar unas semanas.", "No reply. Try another channel or give it a few weeks.")}</div>` : "";
  const com = p.community?.sent ? `<p class="net-com">${ico("users", "i16")}${T(`${p.community.sent} ${p.community.sent === 1 ? "persona de Persohna le escribió" : "personas de Persohna le escribieron"} · ${p.community.replied} con respuesta`, `${p.community.sent} Persohna ${p.community.sent === 1 ? "person" : "people"} wrote · ${p.community.replied} replied`)}</p>` : "";
  return `<article class="pcard ${st.s ? "is-" + st.s : ""}" data-k="${esc(p.key)}" style="--hue:${netHue(p.name)}">
    <header class="pcard-top">
      <span class="net-mono">${esc(initials(p.name))}</span>
      <div class="grow stack g1"><h3>${esc(p.name)}</h3><p class="muted small">${esc([p.role, p.company].filter(Boolean).join(" en "))}${p.place ? ` · ${esc(p.place)}` : ""}</p></div>
      <a class="icon-btn" href="${esc(p.url)}" target="_blank" rel="noopener" aria-label="${isLinkedIn(p.url) ? T("Ver su perfil", "See their profile") : T("Ver dónde aparece", "See where they appear")}" title="${isLinkedIn(p.url) ? T("Ver su perfil", "See their profile") : T("Ver dónde aparece", "See where they appear")}" data-action="net-visit" data-k="${esc(p.key)}">${ico("share")}</a>
    </header>
    <div class="pcard-why"><p><strong>${T("Por qué te conviene", "Why it's worth it")}</strong>${esc(p.why)}</p>${p.hook ? `<p><strong>${T("Para romper el hielo", "To break the ice")}</strong>${esc(p.hook)}</p>` : ""}${com}</div>
    ${st.s === "skip" ? "" : `<div class="pcard-msg">
      ${chans.length > 1 ? `<div class="seg seg-sm" role="tablist">${chans.map(([k, l]) => `<button type="button" role="tab" aria-selected="${ch === k}" data-action="net-ch" data-k="${esc(p.key)}" data-v="${k}">${l}</button>`).join("")}</div>` : ""}
      <label class="sr" for="m-${i}">${T("Tu mensaje", "Your message")}</label>
      <textarea class="textarea net-ta" id="m-${i}" data-net-edit="${esc(p.key)}" data-ch="${ch}" rows="${Math.min(9, Math.max(4, Math.ceil(msg.length / 34) + 1))}">${esc(msg)}</textarea>
      <div class="pcard-acts">
        <a class="btn btn-primary" href="${esc(open)}" target="_blank" rel="noopener" data-action="net-open" data-k="${esc(p.key)}" data-ch="${ch}">${openLbl}</a>
        ${st.s ? "" : `<button class="btn btn-secondary" type="button" data-action="net-st" data-k="${esc(p.key)}" data-v="sent">${ico("check")}${T("Ya se lo envié", "I sent it")}</button>`}
      </div>
      ${st.s ? "" : `<button class="link-btn small net-skip" type="button" data-action="net-st" data-k="${esc(p.key)}" data-v="skip">${T("No me interesa", "Not interested")}</button>`}
    </div>`}
    ${state}
  </article>`;
}
function viewContactos() {
  const n = NET();
  if (!n.profile) {
    return `<div class="stack g6 net-page"><header class="stack g2"><h1 class="h-screen">${T("Contactos", "Contacts")}</h1><p class="muted">${T("Cada día te presento a 5 personas que te conviene conocer, con el mensaje ya escrito.", "Every day I introduce you to 5 people worth meeting, with the message already written.")}</p></header>${netStartBox()}</div>`;
  }
  if (n.day !== today() && !n.job && !n.err) setTimeout(() => netFind(), 50);
  if (n.job && n.job !== "pending") netWatch();
  const todays = n.people.filter((p) => p.at === n.day);
  const done = todays.filter((p) => n.st[p.key]?.s && n.st[p.key].s !== "skip").length;
  const older = n.all.filter((p) => !todays.some((x) => x.key === p.key));
  const pend = older.filter((p) => n.st[p.key]?.s === "sent" && n.st[p.key].at && (Date.now() - new Date(n.st[p.key].at)) / 864e5 >= 5);
  return `<div class="stack g5 net-page">
    <header class="net-head">
      <div class="grow stack g1"><h1 class="h-screen">${n.day === today() && todays.length ? T("Tus 5 de hoy", "Your 5 for today") : T("Contactos", "Contacts")}</h1>
        <p class="muted small">${T("Buscas", "Looking for")}: <strong>${esc(netWantLabel(n.want))}</strong>${n.note ? ` · ${esc(n.note)}` : ""} <button class="link-btn small" type="button" data-action="net-edit">${T("Cambiar", "Change")}</button></p></div>
      ${todays.length ? `<div class="net-count" aria-label="${T(`${done} de ${todays.length} escritos`, `${done} of ${todays.length} written`)}"><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15.5" class="t"/><circle cx="18" cy="18" r="15.5" class="v" style="stroke-dasharray:${(done / todays.length) * 97.4} 97.4"/></svg><span><strong>${done}</strong>/${todays.length}</span></div>` : ""}
    </header>
    ${loggedIn() ? "" : `<div class="net-save">${ico("lock")}<span class="grow">${T("Guarda tus contactos para verlos en el móvil y en el ordenador.", "Save your contacts to see them on your phone and computer.")}</span><button class="btn btn-primary btn-sm" type="button" data-action="net-account">${T("Guardar", "Save")}</button></div>`}
    ${n.job ? netStepsHTML() : ""}
    ${n.err && !n.job ? `<div class="note">${ico("info")}<span>${esc(n.err)}</span>${/mañana|tomorrow/.test(n.err) ? "" : `<button class="btn btn-secondary btn-sm" type="button" data-action="net-more">${T("Reintentar", "Retry")}</button>`}</div>` : ""}
    ${pend.length ? `<section class="stack g3"><h2 class="net-sub">${T("¿Te respondieron?", "Did they reply?")}</h2>${pend.slice(0, 3).map((p, i) => personCard(p, i)).join("")}</section>` : ""}
    ${todays.length ? `<section class="stack g4">${todays.map(personCard).join("")}</section>
      ${n.job ? "" : `<div class="net-more"><p class="muted small">${T("Mañana te traigo 5 nuevas. Si las de hoy no encajan, dime más y busco otras.", "Tomorrow I'll bring 5 new ones. If today's don't fit, tell me more and I'll look again.")}</p><button class="btn btn-secondary" type="button" data-action="net-more">${T("Buscar otras 5", "Find 5 others")}</button></div>`}` : ""}
    ${older.length ? `<details class="more8 card" data-k="net-old"><summary><span class="grow">${T(`Personas anteriores (${older.length})`, `Earlier people (${older.length})`)}</span>${ico("chev", "chev")}</summary><ul class="net-old">${older.map((p) => { const s = n.st[p.key]?.s; return `<li><span class="net-mono sm" style="background:${netHue(p.name)}">${esc(initials(p.name))}</span><span class="grow"><strong>${esc(p.name)}</strong><br><span class="muted small">${esc(p.role || "")}${p.company ? " · " + esc(p.company) : ""}</span></span><span class="tag ${s === "replied" ? "tag-done" : ""}">${s === "replied" ? T("Respondió", "Replied") : s === "sent" ? T("Enviado", "Sent") : s === "noreply" ? T("Sin respuesta", "No reply") : s === "skip" ? T("Descartado", "Skipped") : T("Pendiente", "To do")}</span><a class="icon-btn" href="${esc(p.url)}" target="_blank" rel="noopener" aria-label="${T("Ver perfil", "See profile")}">${ico("share")}</a></li>`; }).join("")}</ul></details>` : ""}
    <p class="post-meta">${T("Solo uso información profesional pública. ¿Apareces aquí y no quieres? Escríbenos y te quitamos.", "I only use public professional information. Listed here and don't want to be? Write to us and we'll remove you.")}</p>
  </div>`;
}
function netStartBox(cls = "") {
  return `<form class="net-start ${cls}" data-form="net-start" novalidate>
    <label class="sr" for="net-start-url">${T("Enlace de tu LinkedIn", "Your LinkedIn link")}</label>
    <div class="net-start-row"><span class="net-li" aria-hidden="true">in</span><input class="input" id="net-start-url" type="url" inputmode="url" autocomplete="url" placeholder="${T("Pega aquí tu LinkedIn", "Paste your LinkedIn here")}"><button class="btn btn-primary" type="submit">${T("Empezar", "Start")}</button></div>
    <button class="link-btn small" type="button" data-action="net-open-setup">${T("No tengo LinkedIn: subir CV o escribirlo", "No LinkedIn: upload a CV or type it")}</button>
  </form>`;
}
// tarjeta de Inicio
function netHomeCard() {
  const n = NET();
  if (!n.profile) return `<section class="card net-home stack g3"><div class="row g3"><div class="net-stack" aria-hidden="true">${["AL", "JM", "SR"].map((x, i) => `<span class="net-mono sm" style="background:${netHue(x + i)}">${x}</span>`).join("")}</div><div class="grow"><h2 class="h-card">${T("5 personas que te conviene conocer, cada día", "5 people worth meeting, every day")}</h2><p class="muted small">${T("Pega tu LinkedIn y te las busco, con el mensaje escrito.", "Paste your LinkedIn and I'll find them, message included.")}</p></div></div>${netStartBox("compact")}</section>`;
  const todays = n.people.filter((p) => p.at === n.day && n.day === today());
  const left = todays.filter((p) => !n.st[p.key]?.s).length;
  return `<a class="card net-home linky row g3" href="#/contactos"><div class="net-stack" aria-hidden="true">${(todays.length ? todays : n.all).slice(0, 3).map((p) => `<span class="net-mono sm" style="background:${netHue(p.name)}">${esc(initials(p.name))}</span>`).join("") || `<span class="net-mono sm">…</span>`}</div>
    <div class="grow stack g1"><strong>${n.job ? T("Buscando tus 5 personas de hoy…", "Finding your 5 people for today…") : todays.length ? (left ? T(`Tus ${todays.length} personas de hoy: ${left} sin escribir`, `Your ${todays.length} people today: ${left} to write`) : T("Hoy ya escribiste a todos. ¡Bien!", "You wrote to everyone today. Nice!")) : T("Tus contactos", "Your contacts")}</strong><span class="muted small">${T("Con el mensaje escrito. Tú lo envías.", "Message written. You send it.")}</span></div>${ico("chev", "chev")}</a>`;
}

// ---------- Rutas y menú ----------
const _render9 = render;
render = function (opts = {}) {
  if (/^#\/contactos/.test(location.hash)) ui.route = S.me ? "contactos" : "inicio";
  return _render9(opts);
};
const _viewInicio9 = viewInicio;
viewInicio = function () { return ui.route === "contactos" ? viewContactos() : _viewInicio9(); };
const _navItems9 = navItems;
navItems = function () { const a = _navItems9(); a.splice(1, 0, ["contactos", T("Contactos", "Contacts"), "users"]); return a; };
const _ctx9 = ctxPanel;
ctxPanel = function () { return ui.route === "contactos" ? "" : _ctx9(); };

// Portada: el LinkedIn es lo primero
const _viewLanding9 = viewLanding;
viewLanding = function () {
  const h = _viewLanding9();
  const ex = [
    { n: "Marta Ruiz", r: T("Directora de compras en una cadena hotelera", "Head of purchasing at a hotel chain"), w: T("Compra justo lo que tú vendes y su equipo está creciendo", "Buys exactly what you sell and her team is growing") },
    { n: "Jonas Berg", r: T("Inversor en proptech", "Proptech investor"), w: T("Invirtió en dos empresas como la tuya este año", "Backed two companies like yours this year") },
    { n: "Sara Okafor", r: T("Jefa de diseño en una fintech", "Head of design at a fintech"), w: T("Está contratando para tu puesto en tu ciudad", "Hiring for your role in your city") },
  ];
  const hero = `<section class="hero hero-net">
      <h1 class="hero-h1">${T("Pega tu LinkedIn. Cada día te presento a 5 personas que te abren puertas.", "Paste your LinkedIn. Every day I'll introduce you to 5 people who open doors.")}</h1>
      <p class="hero-sub">${T("Clientes, trabajo, inversores o socios. Te digo por qué te conviene cada una y te dejo el mensaje escrito. Tú decides si lo envías.", "Clients, jobs, investors or partners. I tell you why each one matters and leave the message written. You decide whether to send it.")}</p>
      ${netStartBox("hero-box")}
      <div class="net-fan" aria-label="${T("Ejemplo", "Example")}">${ex.map((x, i) => `<div class="fan-card" style="--hue:${netHue(x.n)};--r:${(i - 1) * 4}deg"><div class="row g2"><span class="net-mono sm">${initials(x.n)}</span><div><strong>${x.n}</strong><div class="muted small">${x.r}</div></div></div><p class="small">${x.w}</p></div>`).join("")}<span class="fan-tag">${T("Ejemplo", "Example")}</span></div>
    </section>`;
  return h.replace(/<section class="hero">[\s\S]*?<\/section>/, hero);
};

// ---------- Eventos ----------
document.addEventListener("submit", (e) => {
  const f = e.target.closest("form"); if (!f) return;
  if (f.dataset.form === "net-link") { e.preventDefault(); netFromLink(); }
  if (f.dataset.form === "net-start") {
    e.preventDefault(); const v = (f.querySelector("input")?.value || "").trim();
    if (!v) { f.querySelector("input")?.focus(); toast(T("Pega el enlace de tu perfil de LinkedIn", "Paste your LinkedIn profile link")); return; }
    openNet(v);
  }
}, true);
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-action]"); if (!b) return;
  const a = b.dataset.action, n = NET();
  const find = (k) => n.people.find((p) => p.key === k) || n.all.find((p) => p.key === k);
  switch (a) {
    case "net-open-setup": e.preventDefault(); NS.step = "link"; NS.err = ""; NS.busy = false; NS.draft = n.profile ? { ...n.profile } : null; closeAll(); openLayer(netSetupHTML(), { full: true, label: "net" }); break;
    case "net-usecv": netFromText(S.cv.text); break;
    case "net-manual": NS.draft = { ...(NS.draft || {}), name: S.me?.name || "" }; NS.err = ""; NS.step = "who"; setLayer(netSetupHTML()); break;
    case "net-want": netReadWho(); NS.draft.want = b.dataset.v; NS.err = ""; setLayer(netSetupHTML()); break;
    case "net-back": netReadWho(); NS.step = "link"; NS.err = ""; setLayer(netSetupHTML()); break;
    case "net-go": netStart(); break;
    case "net-edit": NS.step = "who"; NS.err = ""; NS.draft = { ...n.profile, want: n.want, note: n.note, where: n.where }; openLayer(netSetupHTML(), { full: true, label: "net" }); break;
    case "net-more": n.err = ""; netFind(true); break;
    case "net-account": openAccount("signup"); break;
    case "net-ch": { const st = (n.st[b.dataset.k] ||= {}); st.ch = b.dataset.v; save(); render({ keepScroll: true }); break; }
    case "net-open": {
      const p = find(b.dataset.k); if (!p) return;
      const ta = b.closest(".pcard")?.querySelector(".net-ta"); const msg = ta ? ta.value : "";
      if (b.dataset.ch !== "email") { try { await navigator.clipboard.writeText(msg); toast(T("Mensaje copiado. Pégalo en su perfil.", "Message copied. Paste it on their profile.")); } catch { toast(T("Copia el mensaje antes de pegarlo.", "Copy the message before pasting it.")); } }
      const st = (n.st[p.key] ||= {}); st.opened = today(); save();
      setTimeout(() => { if (!st.s) { const c = document.querySelector(`.pcard[data-k="${CSS.escape(p.key)}"]`); c?.classList.add("ask-sent"); } }, 1200);
      break;
    }
    case "net-st": {
      const p = find(b.dataset.k); if (!p) return;
      const st = (n.st[p.key] ||= {}); st.s = b.dataset.v; if (b.dataset.v === "sent") st.at = new Date().toISOString();
      save(); netCall("outcome", { url: p.url, status: b.dataset.v });
      if (b.dataset.v === "sent") { S.xp = (S.xp || 0) + 5; toast(T("Apuntado. Si no contesta en 5 días, te lo recuerdo.", "Noted. If they don't reply in 5 days, I'll remind you.")); }
      if (b.dataset.v === "replied") toast(T("¡Genial! Esto ayuda a otros a saber quién responde.", "Great! This helps others know who replies."));
      render({ keepScroll: true }); break;
    }
  }
});
document.addEventListener("input", (e) => {
  const t = e.target; if (!t.dataset?.netEdit) return;
  const st = (NET().st[t.dataset.netEdit] ||= {}); (st.edit ||= {})[t.dataset.ch] = t.value; clearTimeout(t._sv); t._sv = setTimeout(save, 600);
});
document.addEventListener("change", async (e) => {
  if (e.target.id !== "net-file") return;
  const f = e.target.files?.[0]; if (!f) return;
  let text = "";
  try { text = await fileToText(f); } catch { NS.err = T("Formato no compatible. Usa PDF, Word (.docx) o texto.", "Unsupported format. Use PDF, Word (.docx) or text."); setLayer(netSetupHTML()); return; }
  if (text.length < 120) { NS.err = T("No he encontrado texto en el archivo. Prueba con el PDF de LinkedIn.", "No text found in the file. Try the LinkedIn PDF."); setLayer(netSetupHTML()); return; }
  if (!S.cv?.text) S.cv = { text, name: f.name, at: today() };
  netFromText(text);
});
// avisos que abren Contactos
document.addEventListener("click", (e) => {
  const b = e.target.closest('[data-action="inbox-open"]'); if (!b) return;
  const it = S.inbox.find((x) => x.id === b.dataset.id); if (it?.link === "tool:net") { e.stopPropagation(); e.preventDefault(); it.read = true; save(); closeAll(); go("contactos"); }
}, true);
document.addEventListener("click", (e) => { const b = e.target.closest('.tool[data-v="net"]'); if (!b) return; e.stopPropagation(); e.preventDefault(); openNet(); }, true);

// herramienta en «Más cosas»
const _toolsCard9 = toolsCard;
toolsCard = function () { return _toolsCard9().replace('<div class="tools">', `<div class="tools"><button class="tool" type="button" data-action="tool" data-v="net"><img src="${iconSrc("comunidad")}" alt="" width="48" height="48" loading="lazy"><span class="stack g1"><strong>${T("5 contactos al día", "5 contacts a day")}</strong><span class="post-meta">${T("Gente que te conviene conocer", "People worth meeting")}</span></span></button>`); };

// al abrir: seguir una búsqueda pendiente o traer las de hoy
setTimeout(() => { const n = NET(); if (!S.me || !n.profile) return; if (n.job && n.job !== "pending") netWatch(); else if (n.job === "pending") { n.job = null; save(); } else if (n.day !== today()) netFind(); }, 1500);
try { if (/^#\/contactos/.test(location.hash) || !S.me) render({ keepScroll: true }); } catch (e) { console.warn(e); }
