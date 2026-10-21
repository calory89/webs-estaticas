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

// ---------- Alta en 3 pasos: tu LinkedIn → quién eres → a quién quieres conocer ----------
const NET_DETAIL = () => ({
  clientes: [T("¿Qué vendes y a quién?", "What do you sell, and to whom?"), T("Ej.: marketing para hoteles boutique", "E.g. marketing for boutique hotels")],
  trabajo: [T("¿Qué puesto buscas?", "What role are you after?"), T("Ej.: Head of Growth en una startup", "E.g. Head of Growth at a startup")],
  inversion: [T("¿Para qué buscas inversión y cuánto?", "What are you raising for, and how much?"), T("Ej.: 500.000 € para un resort en Indonesia", "E.g. €500k for a resort in Indonesia")],
  socios: [T("¿Qué perfil te falta?", "What profile are you missing?"), T("Ej.: un CTO que sepa de IA", "E.g. a CTO who knows AI")],
  mentores: [T("¿En qué quieres mejorar?", "What do you want to get better at?"), T("Ej.: escalar ventas de 0 a 1 M€", "E.g. scaling sales from 0 to €1M")],
  sector: [T("¿Qué sector o tema?", "Which industry or topic?"), T("Ej.: proptech en Málaga", "E.g. proptech in Málaga")],
});
const nameFromSlug = (u) => { const m = String(u || "").match(/linkedin\.com\/in\/([^/?#\s]+)/i); if (!m) return ""; let parts = decodeURIComponent(m[1]).split(/[-_]+/).filter((w) => w && !/\d/.test(w)); if (parts.length > 4) parts = parts.slice(0, 4); return parts.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" "); };
function cleanLinkedIn(v) {
  let u = String(v || "").trim().replace(/^<|>$/g, "");
  if (!u) return { err: "empty" };
  if (/lnkd\.in\//i.test(u)) return { err: "short" };
  if (/linkedin\.com\/(company|school|showcase)\//i.test(u)) return { err: "company" };
  if (/^@?[a-z0-9][a-z0-9-]{2,99}$/i.test(u) && !/\./.test(u)) u = "linkedin.com/in/" + u.replace(/^@/, "");
  if (!/^https?:\/\//i.test(u)) u = "https://" + u.replace(/^\/+/, "");
  const m = u.match(/linkedin\.com\/(?:mwlite\/)?in\/([^/?#\s]+)/i);
  if (!m) return { err: "bad_url" };
  return { url: `https://www.linkedin.com/in/${m[1].replace(/\/+$/, "")}` };
}
function netDraft() {
  const n = NET();
  if (!NS.draft) {
    const saved = S.netDraft || {};
    NS.draft = { ...(n.profile || {}), wants: n.wants?.length ? [...n.wants] : n.want ? [n.want] : [], details: { ...(n.details || {}) }, where: n.where || "", lang: n.lang || "auto", ...saved };
  }
  const d = NS.draft;
  d.wants ||= []; d.details ||= {};
  if (!d.name) d.name = nameFromSlug(d.url) || S.me?.name || "";
  return d;
}
function netKeep() { try { S.netDraft = { ...NS.draft, busy: undefined }; save(); } catch {} }
function openNet(start = "", step = "") {
  const n = NET();
  if (n.profile && !start && !step) { go("contactos"); return; }
  NS.draft = null; netDraft();
  NS.step = step || "link"; NS.err = ""; NS.info = ""; NS.busy = false;
  closeAll(); openLayer(netSetupHTML(), { full: true, label: "net" });
  if (start) setTimeout(() => { const i = $("#net-url"); if (i) { i.value = start; netFromLink(); } }, 50);
}
function netProg() {
  const i = { link: 1, who: 2, goal: 3 }[NS.step] || 1;
  return `<div class="net-prog" aria-label="${T(`Paso ${i} de 3`, `Step ${i} of 3`)}"><span class="${i >= 1 ? "on" : ""}"></span><span class="${i >= 2 ? "on" : ""}"></span><span class="${i >= 3 ? "on" : ""}"></span><em>${T(`Paso ${i} de 3`, `Step ${i} of 3`)}</em></div>`;
}
function netSetupHTML() {
  const d = netDraft();
  const head = sheetHead(T("Tus contactos", "Your contacts"));
  const note = (t, kind = "info") => t ? `<p class="net-note ${kind}" role="${kind === "err" ? "alert" : "status"}">${ico(kind === "err" ? "info" : "sparkle")}<span>${esc(t)}</span></p>` : "";
  if (NS.step === "link") {
    return `${head}<div class="sheet-body net-setup stack g5" data-view="net">${netProg()}
      <div class="stack g2"><h3 class="net-h">${T("Empecemos por ti", "Let's start with you")}</h3><p class="muted">${T("Pega el enlace de tu perfil de LinkedIn. Leo lo que es público y en 10 segundos sé a quién presentarte.", "Paste your LinkedIn profile link. I read what's public and in 10 seconds I know who to introduce you to.")}</p></div>
      ${NS.busy ? `<div class="net-reading" role="status"><span class="net-mono" style="background:${netHue(d.name)}">${esc(initials(d.name || "?"))}</span><div class="stack g1 grow"><strong>${esc(d.name || T("Leyendo tu perfil", "Reading your profile"))}</strong><span class="muted small">${T("Buscando tu perfil público, tu empresa y a qué te dedicas…", "Looking up your public profile, company and what you do…")}</span><span class="net-bar"><i></i></span></div></div>` : `
      <form class="stack g3" data-form="net-link" novalidate>
        <label class="sr" for="net-url">${T("Enlace de tu LinkedIn", "Your LinkedIn link")}</label>
        <div class="net-start-row big"><span class="net-li" aria-hidden="true">in</span><input class="input" id="net-url" type="url" inputmode="url" autocomplete="url" autocapitalize="off" spellcheck="false" placeholder="linkedin.com/in/tu-nombre" value="${esc(d.url || "")}"><button class="btn btn-ghost btn-sm net-paste" type="button" data-action="net-paste">${T("Pegar", "Paste")}</button></div>
        <p class="hint" id="net-url-hint">${T("Lo encuentras en la app de LinkedIn: tu foto › Ver perfil › ··· › Compartir perfil › Copiar enlace.", "In the LinkedIn app: your photo › View profile › ··· › Share profile › Copy link.")}</p>
        ${note(NS.err, "err")}
        <button class="btn btn-primary btn-big" type="submit">${T("Seguir", "Continue")}</button>
      </form>
      <div class="net-or"><span>${T("o", "or")}</span></div>
      <div class="stack g2">
        <label class="drop drop-sm">${ico("download", "rot180")}<strong>${T("Sube tu CV o el PDF de tu LinkedIn", "Upload your CV or LinkedIn PDF")}</strong><span class="muted small">${T("En LinkedIn (ordenador): tu perfil › Más › Guardar en PDF", "On LinkedIn (desktop): your profile › More › Save to PDF")}</span><input type="file" id="net-file" accept=".pdf,.docx,.txt,.md,application/pdf" hidden></label>
        ${S.cv?.text ? `<button class="btn btn-secondary" type="button" data-action="net-usecv">${T("Usar el CV que ya me diste", "Use the CV you already gave me")}</button>` : ""}
        <button class="link-btn small" type="button" data-action="net-manual" style="align-self:flex-start">${T("Prefiero escribirlo yo", "I'd rather type it")}</button>
      </div>`}
      <p class="hint">${ico("lock", "i16")} ${T("Solo leo lo que es público. Nunca escribo a nadie por ti: te dejo el mensaje listo y tú decides.", "I only read what's public. I never message anyone for you: I leave the message ready and you decide.")}</p>
    </div>`;
  }
  if (NS.step === "who") {
    const sugg = [...new Set([S.hunt?.profile?.headline, S.me?.bio, d.headline && null].filter((x) => x && x.length > 3))].slice(0, 3);
    return `${head}<form class="sheet-body net-setup stack g5" data-view="net" data-form="net-who" novalidate>${netProg()}
      <h3 class="net-h">${d.found ? T("¿Eres tú?", "Is this you?") : T("Cuéntame quién eres", "Tell me who you are")}</h3>
      ${note(NS.info)}
      <div class="net-me">
        <span class="net-mono" id="net-mono" style="background:${netHue(d.name)}">${esc(initials(d.name || "?"))}</span>
        <div class="stack g3 grow">
          <div class="field"><label for="net-name">${T("Tu nombre", "Your name")}</label><input class="input" id="net-name" maxlength="80" autocomplete="name" value="${esc(d.name || "")}" required></div>
          <div class="field"><label for="net-head">${T("A qué te dedicas", "What you do")}</label><input class="input" id="net-head" maxlength="160" value="${esc(d.headline || "")}" placeholder="${T("Ej.: Fundador de una inmobiliaria en Málaga", "E.g. Founder of a real-estate agency in Málaga")}" required>
            ${sugg.length && !d.headline ? `<div class="chips">${sugg.map((x) => `<button class="chip" type="button" data-action="net-head-sug" data-v="${esc(x)}">${esc(x.slice(0, 60))}</button>`).join("")}</div>` : ""}</div>
          <div class="row g2 wrap net-2col"><div class="field grow"><label for="net-company">${T("Empresa (opcional)", "Company (optional)")}</label><input class="input" id="net-company" maxlength="80" autocomplete="organization" value="${esc(d.company || "")}"></div><div class="field grow"><label for="net-city">${T("Ciudad (opcional)", "City (optional)")}</label><input class="input" id="net-city" maxlength="60" value="${esc(d.city || "")}"></div></div>
        </div>
      </div>
      ${d.skills?.length ? `<div class="stack g2"><span class="small muted">${T("Lo que sé hacer (toca para quitar)", "What you're good at (tap to remove)")}</span><div class="chips">${d.skills.slice(0, 10).map((x, i) => `<button class="chip on" type="button" data-action="net-skill-x" data-i="${i}">${esc(x)} ×</button>`).join("")}</div></div>` : ""}
      ${d.summary ? `<p class="muted small">${esc(d.summary)}</p>` : ""}
      ${note(NS.err, "err")}
    </form><div class="sheet-foot"><button class="btn btn-ghost" type="button" data-action="net-back" style="flex:0 0 auto">${T("Atrás", "Back")}</button><button class="btn btn-primary" type="button" data-action="net-next">${T("Seguir", "Continue")}</button></div>`;
  }
  // paso 3: a quién quieres conocer (varias opciones)
  const D = NET_DETAIL(), wants = d.wants;
  const places = [...new Set([d.city, d.country, T("Remoto / online", "Remote / online"), T("España", "Spain"), T("Europa", "Europe"), T("Todo el mundo", "Anywhere")].filter(Boolean))].slice(0, 6);
  return `${head}<div class="sheet-body net-setup stack g5" data-view="net">${netProg()}
    <div class="stack g1"><h3 class="net-h">${T("¿A quién quieres conocer?", "Who do you want to meet?")}</h3><p class="muted small">${T("Elige hasta 3. Reparto tus 5 personas entre lo que elijas.", "Pick up to 3. I'll split your 5 people across them.")}</p></div>
    <div class="net-wants">${NET_WANTS().map(([k, t, s]) => `<button type="button" class="net-want" data-action="net-want" data-v="${k}" aria-pressed="${wants.includes(k)}"><span class="net-check" aria-hidden="true">${wants.includes(k) ? ico("check") : ""}</span><strong>${t}</strong><span>${s}</span></button>`).join("")}</div>
    ${wants.length ? `<div class="stack g3 net-details">${wants.map((k) => `<div class="field"><label for="nd-${k}">${D[k][0]} <span class="muted small">(${T("opcional", "optional")})</span></label><input class="input" id="nd-${k}" data-nd="${k}" maxlength="200" value="${esc(d.details[k] || (k === "trabajo" ? (S.hunt?.terms || [])[0] || "" : ""))}" placeholder="${esc(D[k][1])}"></div>`).join("")}</div>` : ""}
    <div class="field"><label for="net-where">${T("¿Dónde?", "Where?")} <span class="muted small">(${T("opcional", "optional")})</span></label><input class="input" id="net-where" maxlength="60" value="${esc(d.where || "")}" placeholder="${T("Ciudad, país o «remoto»", "City, country or “remote”")}"><div class="chips">${places.map((x) => `<button class="chip ${d.where === x ? "on" : ""}" type="button" data-action="net-where" data-v="${esc(x)}">${esc(x)}</button>`).join("")}</div></div>
    <div class="field"><span class="lbl" style="font-weight:700">${T("Escribirles en", "Write to them in")}</span><div class="seg seg-sm" role="radiogroup">${[["auto", T("Su idioma", "Their language")], ["es", "Español"], ["en", "English"]].map(([k, l]) => `<button type="button" role="radio" aria-checked="${(d.lang || "auto") === k}" data-action="net-lang" data-v="${k}">${l}</button>`).join("")}</div></div>
    ${note(NS.err, "err")}
  </div><div class="sheet-foot"><button class="btn btn-ghost" type="button" data-action="net-back" style="flex:0 0 auto">${T("Atrás", "Back")}</button><button class="btn btn-primary" type="button" data-action="net-go" ${wants.length ? "" : "aria-disabled=\"true\""}>${wants.length ? T("Buscar mis 5 personas", "Find my 5 people") : T("Elige al menos una", "Pick at least one")}</button></div>`;
}
function netRead() {
  const d = netDraft(), v = (id) => ($("#" + id)?.value ?? null);
  if (v("net-name") !== null) d.name = v("net-name").trim();
  if (v("net-head") !== null) d.headline = v("net-head").trim();
  if (v("net-company") !== null) d.company = v("net-company").trim();
  if (v("net-city") !== null) d.city = v("net-city").trim();
  if (v("net-where") !== null) d.where = v("net-where").trim();
  document.querySelectorAll("[data-nd]").forEach((i) => { d.details[i.dataset.nd] = i.value.trim(); });
  netKeep();
}
async function netFromLink() {
  const d = netDraft();
  const c = cleanLinkedIn($("#net-url")?.value);
  if (c.err) { NS.err = c.err === "empty" ? T("Pega el enlace de tu perfil.", "Paste your profile link.") : c.err === "short" ? T("Ese es un enlace corto (lnkd.in). Ábrelo y copia la dirección completa que empieza por linkedin.com/in/.", "That's a short link (lnkd.in). Open it and copy the full address starting with linkedin.com/in/.") : c.err === "company" ? T("Eso es una página de empresa. Pega tu perfil personal: linkedin.com/in/tu-nombre", "That's a company page. Paste your personal profile: linkedin.com/in/your-name") : netErr("bad_url"); setLayer(netSetupHTML()); return; }
  d.url = c.url; if (!d.name || d.name === S.me?.name) d.name = nameFromSlug(c.url) || d.name;
  NS.busy = true; NS.err = ""; setLayer(netSetupHTML());
  const r = await netCall("profile", { url: c.url, hint: d.name });
  NS.busy = false;
  const p = r.profile || {};
  if (p.found) {
    Object.assign(d, Object.fromEntries(Object.entries(p).filter(([, x]) => x && (!Array.isArray(x) || x.length))));
    if (!d.wants.length && Array.isArray(p.wants)) d.wants = p.wants.filter((k) => NET_DETAIL()[k]).slice(0, 2);
    NS.info = T("He encontrado tu perfil. Revisa que esté bien.", "Found your profile. Check it's right.");
  } else NS.info = r.error === "timeout" || r.error === "network" ? T("No he podido leer tu perfil ahora mismo. Rellénalo en 10 segundos y seguimos.", "I couldn't read your profile right now. Fill it in in 10 seconds and let's go on.") : T("Tu perfil casi no se ve en público. Dime a qué te dedicas y seguimos.", "Your profile is barely visible publicly. Tell me what you do and let's go on.");
  d.found = !!p.found; NS.step = "who"; netKeep(); setLayer(netSetupHTML());
  if (!d.headline) setTimeout(() => $("#net-head")?.focus(), 80);
}
async function netFromText(text) {
  const d = netDraft();
  NS.busy = true; NS.err = ""; NS.step = "link"; setLayer(netSetupHTML());
  const r = await netCall("profile", { text: text.slice(0, 20000) });
  NS.busy = false;
  const p = r.profile || {};
  if (p.found) { Object.assign(d, Object.fromEntries(Object.entries(p).filter(([, x]) => x && (!Array.isArray(x) || x.length)))); if (!d.wants.length && Array.isArray(p.wants)) d.wants = p.wants.filter((k) => NET_DETAIL()[k]).slice(0, 2); NS.info = T("He leído tu CV. Revisa que esté bien.", "I read your CV. Check it's right."); }
  else NS.info = T("No he podido leer bien el archivo. Completa tus datos aquí.", "I couldn't read the file well. Fill in your details here.");
  d.found = !!p.found; NS.step = "who"; netKeep(); setLayer(netSetupHTML());
}
function netWhoNext() {
  netRead(); const d = netDraft();
  if (!d.name) { NS.err = T("Escribe tu nombre.", "Write your name."); setLayer(netSetupHTML()); $("#net-name")?.focus(); return; }
  if (d.headline.length < 4) { NS.err = T("Dime a qué te dedicas: con eso elijo a quién presentarte.", "Tell me what you do: that's how I pick who to introduce you to."); setLayer(netSetupHTML()); $("#net-head")?.focus(); return; }
  NS.err = ""; NS.info = ""; NS.step = "goal"; setLayer(netSetupHTML());
}
function netStart() {
  netRead();
  const d = netDraft(), n = NET();
  if (!d.wants.length) { NS.err = T("Elige al menos a quién quieres conocer.", "Pick at least who you want to meet."); setLayer(netSetupHTML()); return; }
  const changed = JSON.stringify([n.wants, n.details, n.where, n.profile?.headline]) !== JSON.stringify([d.wants, d.details, d.where, d.headline]);
  n.profile = { name: d.name, headline: d.headline, company: d.company || "", city: d.city || "", country: d.country || "", industry: d.industry || "", skills: (d.skills || []).slice(0, 10), summary: d.summary || "", url: d.url || "" };
  n.wants = [...d.wants]; n.want = d.wants[0]; n.details = { ...d.details }; n.note = Object.values(d.details).filter(Boolean).join(" · "); n.where = d.where || ""; n.lang = d.lang || "auto";
  if (!S.me) {
    S.me = { name: d.name.split(/\s+/)[0], face: randomFace(), frame: "none", bio: d.headline.slice(0, 140), code: uid().slice(0, 6) };
    addHistory("Nació tu Persohna", "Your Persohna was born"); S.welcome = false; S.tourDone = true; touchStreak();
  } else if (!S.me.bio) S.me.bio = d.headline.slice(0, 140);
  delete S.netDraft; NS.draft = null;
  save(); closeAll();
  const fresh = !(n.day === today() && n.people.length);
  if (fresh || changed) netFind(true);
  go("contactos");
}

// ---------- Búsqueda (en segundo plano: puedes cerrar la app) ----------
async function netFind(force = false) {
  const n = NET(); if (!n.profile) return;
  if (n.job && Date.now() - n.jobAt < 6 * 60e3) { netWatch(); return; }
  if (!force && n.day === today() && n.people.length) return;
  const wants = n.wants?.length ? n.wants : [n.want || "sector"];
  const companies = wants.includes("trabajo") && S.hunt?.jobs ? [...new Set(S.hunt.jobs.filter((j) => (S.hunt.fits?.[j.id]?.fit || 0) >= 60).map((j) => j.company).filter(Boolean))].slice(0, 6) : [];
  n.err = ""; n.jobAt = Date.now(); n.job = "pending"; save(); netRefresh();
  const r = await netCall("find", { profile: n.profile, want: wants[0], wants, details: n.details || {}, note: n.note, where: n.where, msg_lang: n.lang || "auto", avoid: (n.avoid || []).slice(-10), companies, exclude: n.seen.slice(-120) });
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
      <div class="grow stack g1">${p.goal && NET_DETAIL()[p.goal] ? `<span class="pcard-goal">${esc(netWantLabel(p.goal))}</span>` : ""}<h3>${esc(p.name)}</h3><p class="muted small">${esc([p.role, p.company].filter(Boolean).join(" en "))}${p.place ? ` · ${esc(p.place)}` : ""}</p></div>
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
      ${st.s ? "" : `<button class="link-btn small net-skip" type="button" data-action="net-skipask" data-k="${esc(p.key)}">${T("No me interesa", "Not interested")}</button>`}
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
        <p class="muted small">${T("Buscas", "Looking for")}: <strong>${esc((n.wants?.length ? n.wants : [n.want]).map(netWantLabel).join(", "))}</strong>${n.where ? ` · ${esc(n.where)}` : ""} <button class="link-btn small" type="button" data-action="net-edit" data-v="goal">${T("Cambiar", "Change")}</button></p></div>
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
    case "net-open-setup": e.preventDefault(); openNet("", "link"); break;
    case "net-usecv": netFromText(S.cv.text); break;
    case "net-manual": netDraft(); NS.err = ""; NS.info = ""; NS.step = "who"; setLayer(netSetupHTML()); setTimeout(() => $(NS.draft.name ? "#net-head" : "#net-name")?.focus(), 80); break;
    case "net-paste": { try { const t = await navigator.clipboard.readText(); const i = $("#net-url"); if (i && t) { i.value = t.trim(); const c = cleanLinkedIn(t); if (!c.err) netFromLink(); else { NS.err = netErr("bad_url"); setLayer(netSetupHTML()); } } } catch { toast(T("Mantén pulsado el campo y elige «Pegar».", "Long-press the field and choose “Paste”.")); $("#net-url")?.focus(); } break; }
    case "net-want": { netRead(); const d = netDraft(), k = b.dataset.v; if (d.wants.includes(k)) d.wants = d.wants.filter((x) => x !== k); else if (d.wants.length >= 3) { toast(T("Máximo 3: quita una para elegir otra.", "Max 3: remove one to pick another.")); break; } else d.wants.push(k); NS.err = ""; netKeep(); setLayer(netSetupHTML()); if (d.wants.includes(k)) setTimeout(() => $("#nd-" + k)?.focus({ preventScroll: false }), 60); break; }
    case "net-where": { netRead(); const d = netDraft(); d.where = d.where === b.dataset.v ? "" : b.dataset.v; netKeep(); setLayer(netSetupHTML()); break; }
    case "net-lang": { netRead(); netDraft().lang = b.dataset.v; netKeep(); setLayer(netSetupHTML()); break; }
    case "net-head-sug": { const i = $("#net-head"); if (i) { i.value = b.dataset.v; i.focus(); } break; }
    case "net-skill-x": { netRead(); const d = netDraft(); d.skills.splice(+b.dataset.i, 1); netKeep(); setLayer(netSetupHTML()); break; }
    case "net-next": netWhoNext(); break;
    case "net-back": netRead(); NS.step = NS.step === "goal" ? "who" : "link"; NS.err = ""; NS.info = ""; setLayer(netSetupHTML()); break;
    case "net-go": netStart(); break;
    case "net-edit": openNet("", b.dataset.v || "goal"); break;
    case "net-more": n.err = ""; netFind(true); break;
    case "net-skipask": { const c = b.closest(".pcard"); if (!c || c.querySelector(".net-why")) break; b.insertAdjacentHTML("afterend", `<div class="net-why"><span class="small muted">${T("¿Por qué? Así afino la próxima vez", "Why? It helps me aim better next time")}</span><div class="chips">${[T("No encaja con lo que busco", "Not what I'm looking for"), T("Ya le conozco", "I already know them"), T("Otro país o sector", "Wrong country or industry"), T("Demasiado grande para mí", "Too big for me")].map((r) => `<button class="chip" type="button" data-action="net-skip" data-k="${esc(b.dataset.k)}" data-r="${esc(r)}">${esc(r)}</button>`).join("")}</div></div>`); b.remove(); break; }
    case "net-skip": { const p = find(b.dataset.k); if (!p) return; const st = (n.st[p.key] ||= {}); st.s = "skip"; st.why = b.dataset.r; n.avoid = [...(n.avoid || []), `${p.name} (${p.role || ""}${p.company ? ", " + p.company : ""}): ${b.dataset.r}`].slice(-10); save(); netCall("outcome", { url: p.url, status: "skip" }); toast(T("Entendido. Lo tengo en cuenta para mañana.", "Got it. I'll keep it in mind tomorrow.")); render({ keepScroll: true }); break; }
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

document.addEventListener("input", (e) => {
  if (e.target.id === "net-name") { const m = $("#net-mono"); if (m) { m.textContent = initials(e.target.value || "?"); m.style.background = netHue(e.target.value); } }
  if (e.target.id === "net-url") { const h = $("#net-url-hint"); const c = cleanLinkedIn(e.target.value); if (h && e.target.value.trim()) h.innerHTML = c.err ? T("Debe ser tu perfil: linkedin.com/in/tu-nombre", "It must be your profile: linkedin.com/in/your-name") : `<span class="ok-t">${ico("check", "i16")} ${T("Perfecto, es un perfil de LinkedIn", "Great, that's a LinkedIn profile")}</span>`; }
});
document.addEventListener("submit", (e) => { if (e.target.dataset?.form === "net-who") { e.preventDefault(); netWhoNext(); } }, true);
document.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches?.('[data-view="net"] [data-nd], #net-where') ) { e.preventDefault(); netStart(); } });
