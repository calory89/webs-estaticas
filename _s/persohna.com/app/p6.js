"use strict";
// ---------- 11. v5: «Busca por mí» con ofertas y casas reales, opiniones compartidas y tareas en segundo plano ----------

const JB = { url: "https://persohna.com/__sb/jobersity/rest/v1/rpc/", key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw" };
const RH = { url: "https://persohna.com/__sb/realhunt/rest/v1/rpc/", key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a2NzbWV4dGNscGRudWdpeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzOTMzNjYsImV4cCI6MjEwNzk2OTM2Nn0.n4lmkzPgZe64B18altwRMYFiQrLQ2Quqg9uV9SoJhAw", site: "https://realhunt.co" };
async function rpc(base, fn, body, timeout = 30000) {
  const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(base.url + fn, { method: "POST", signal: ctl.signal, headers: { "content-type": "application/json", apikey: base.key, authorization: `Bearer ${base.key}` }, body: JSON.stringify(body || {}) });
    const d = await r.json().catch(() => null);
    return r.ok ? d : { error: d?.message || "http_" + r.status };
  } catch (e) { return { error: e?.name === "AbortError" ? "timeout" : "network" }; } finally { clearTimeout(to); }
}
const DEVICE = (() => { try { let d = localStorage.getItem("persohna.device"); if (!d) { d = uid() + uid(); localStorage.setItem("persohna.device", d); } return d; } catch { return "nostore"; } })();
const agoShort = (d) => { const h = Math.max(0, (Date.now() - new Date(d)) / 36e5); return h < 1 ? T("ahora", "now") : h < 24 ? T(`hace ${Math.round(h)} h`, `${Math.round(h)}h ago`) : T(`hace ${Math.round(h / 24)} d`, `${Math.round(h / 24)}d ago`); };
const parseJSON = (t) => { try { return JSON.parse(String(t).slice(String(t).indexOf("{"), String(t).lastIndexOf("}") + 1)); } catch { return null; } };

// Títulos sin «…» cuando falta un dato
Object.keys(CATS).forEach((k) => { const f = CATS[k].title; if (typeof f !== "function") return; CATS[k].title = (p) => { const t = f(p || {}); return /…|\.\.\./.test(t) ? L(CATS[k].verb) : t; }; });
S.goals.forEach((g) => { if (/…$|… ·|«…»/.test(g.title) && CATS[g.cat]) g.title = CATS[g.cat].title(g.prefs || {}); });

// ---------- Capas: saber qué hoja está abierta (para no pisar otra al terminar algo en segundo plano) ----------
const _openLayer6 = openLayer;
openLayer = function (html, opts = {}) { const el = _openLayer6(html, opts); el.dataset.view = opts.label || ""; return el; };
const isTop = (label) => topLayer()?.closest?.(".layer")?.dataset.view === label || stackLayers[stackLayers.length - 1]?.el?.dataset.view === label;
function doneNotify(es, en, fn) {
  notify(es, en); renderNav();
  toast(T(es, en), fn ? { label: T("Ver", "View"), fn } : undefined);
  if (document.hidden) deviceNotify("Persohna", T(es, en));
}
const bgHint = () => `<p class="hint bg-hint">${ico("info", "i16")} ${T("Puedes cerrar esto y seguir usando la app: te aviso cuando esté listo.", "You can close this and keep using the app: I'll tell you when it's ready.")}</p>`;

// ---------- Opiniones compartidas (la base de datos que ninguna IA tiene) ----------
const SIGS = {};
async function loadSignals(keys) {
  keys = keys.filter((k) => k && !(k in SIGS)); if (!keys.length) return;
  keys.forEach((k) => (SIGS[k] = {}));
  const d = await api("signals", { keys });
  if (d?.items) Object.assign(SIGS, d.items);
}
async function sendSignal(key, kind, signal, extra = {}) {
  const s = (SIGS[key] ||= {}); s[signal] = (s[signal] || 0) + (extra.off ? -1 : 1);
  (extra.tags || []).forEach((t) => { s.tags = s.tags || {}; s.tags[t] = (s.tags[t] || 0) + 1; });
  return api("signal", { token: loggedIn() ? AUTH.token : undefined, device: DEVICE, key, kind, signal, ...extra });
}
function sigLine(key) {
  const s = SIGS[key]; if (!s) return "";
  const bits = [];
  if (s.applied) bits.push(T(`${s.applied} aplicó`, `${s.applied} applied`).replace(/(\d+) aplicó/, (m, n) => n > 1 ? `${n} aplicaron` : m));
  if (s.saved) bits.push(T(`${s.saved} guardada${s.saved > 1 ? "s" : ""}`, `${s.saved} saved`));
  if (s.interview) bits.push(T(`${s.interview} con entrevista`, `${s.interview} got interviews`));
  if (s.visited) bits.push(T(`${s.visited} la visitó`, `${s.visited} visited`));
  const tags = Object.entries(s.tags || {}).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t, n]) => `«${esc(t)}»${n > 1 ? " ×" + n : ""}`);
  if (!bits.length && !tags.length) return "";
  return `<p class="sig-line">${ico("users", "i16")} ${T("Personas de Persohna:", "Persohna people:")} ${[...bits.map(esc), ...tags].join(" · ")}</p>`;
}
const JOB_DISLIKE = () => [T("No es mi nivel", "Wrong level"), T("Sueldo bajo", "Low pay"), T("Lejos", "Too far"), T("No me gusta la empresa", "Don't like the company"), T("No es lo mío", "Not my thing")];
const JOB_OPINION = () => [[T("Oferta falsa o caducada", "Fake or expired"), "bad"], [T("No responden", "They never reply"), "bad"], [T("Pagan menos de lo que dicen", "Pay less than stated"), "bad"], [T("Mal ambiente", "Bad culture"), "bad"], [T("Me llamaron", "They called me"), "good"], [T("Buen proceso", "Good process"), "good"]];
const HOME_OPINION = () => [[T("Humedad", "Damp"), "bad"], [T("Ruido", "Noise"), "bad"], [T("Fotos engañosas", "Misleading photos"), "bad"], [T("Precio inflado", "Overpriced"), "bad"], [T("Posible estafa", "Possible scam"), "bad"], [T("Buen casero o vendedor", "Good landlord or seller"), "good"], [T("Mejor en persona", "Better in person"), "good"], [T("Zona tranquila", "Quiet area"), "good"]];

// ---------- «Busca por mí»: trabajo ----------
const H = () => (S.hunt ||= { terms: [], city: "", country: "", remote: true, jobs: [], seen: {}, hidden: {}, saved: [], fits: {}, apps: {}, tab: "todo" });
let HS = { busy: "", err: "", open: null, edit: false, op: null };
const HLBL = () => T("Trabajos para ti", "Jobs for you");
let JSTATS = null;
function trabajoGoal() { return S.goals.find((g) => g.cat === "trabajo" && !g.done); }
function openHunt() {
  H(); HS = { ...HS, err: "", open: null, op: null };
  const g = trabajoGoal();
  if (!S.hunt.terms.length && !S.hunt.profile && g?.prefs?.puesto) S.hunt.terms = [g.prefs.puesto];
  if (!S.hunt.remote && /remot/i.test(g?.prefs?.modo || "")) S.hunt.remote = true;
  closeAll(); openLayer(huntHTML(), { full: true, wide: true, label: HLBL(), onClose: () => { markSeen(); render({ keepScroll: true }); } });
  if (!JSTATS) rpc(JB, "px_jobs_stats", {}).then((d) => { if (d && !d.error) { JSTATS = d; if (isTop(HLBL())) setLayer(huntHTML()); } });
  if (S.cv?.text && !S.hunt.profile && !HS.busy) huntProfile();
  else if (S.hunt.terms.length && (!S.hunt.lastRun || Date.now() - new Date(S.hunt.lastRun) > 6 * 36e5) && !HS.busy) huntRun();
  else loadSignals(S.hunt.jobs.map((j) => "job:" + j.id)).then(() => isTop(HLBL()) && setLayer(huntHTML()));
}
const refreshHunt = () => { if (isTop(HLBL())) { const y = topLayer()?.querySelector(".sheet-body")?.scrollTop; setLayer(huntHTML()); const sb = topLayer()?.querySelector(".sheet-body"); if (sb && y) sb.scrollTop = y; } };
function huntSetupHTML() {
  const h = H(), g = trabajoGoal();
  return `<div class="stack g4">
    <div class="hunt-hero"><img src="${iconSrc("trabajo")}" alt="" width="72" height="72"><div class="stack g1"><h3 class="h-card">${T("Te busco trabajo cada día", "I'll look for jobs every day")}</h3><p class="muted small">${JSTATS ? T(`Entre ${JSTATS.jobs.toLocaleString("es-ES")} ofertas reales de ${JSTATS.companies.toLocaleString("es-ES")} empresas. Tú solo dime quién eres.`, `Across ${JSTATS.jobs.toLocaleString("en-GB")} real jobs from ${JSTATS.companies.toLocaleString("en-GB")} companies. Just tell me who you are.`) : T("Entre decenas de miles de ofertas reales. Tú solo dime quién eres.", "Across tens of thousands of real jobs. Just tell me who you are.")}</p></div></div>
    <label class="drop">${ico("download", "rot180")}<strong>${T("Sube tu CV o el PDF de tu LinkedIn", "Upload your CV or LinkedIn PDF")}</strong><span class="muted small">PDF, Word ${T("o texto", "or text")}</span><input type="file" id="hunt-file" accept=".pdf,.docx,.txt,.md,application/pdf,text/plain" hidden></label>
    <details class="li-help"><summary>${T("¿Cómo saco el PDF de LinkedIn? (10 segundos)", "How do I get my LinkedIn PDF? (10 seconds)")}</summary><ol class="small"><li>${T("Abre tu perfil de LinkedIn en el ordenador.", "Open your LinkedIn profile on a computer.")}</li><li>${T("Pulsa «Más» debajo de tu nombre → «Guardar en PDF».", "Click “More” under your name → “Save to PDF”.")}</li><li>${T("Súbelo aquí.", "Upload it here.")}</li></ol><p class="hint">${T("LinkedIn no deja que ninguna app lea tu perfil solo con el enlace, por eso te pido el PDF.", "LinkedIn doesn't let apps read your profile from just the link, so I ask for the PDF.")}</p></details>
    <div class="or"><span>${T("o, si tienes prisa", "or, if you're in a hurry")}</span></div>
    <div class="row g2 wrap"><div class="field grow"><label for="hunt-role">${T("Puesto que buscas", "Role you want")}</label><input class="input" id="hunt-role" maxlength="80" value="${esc(h.terms[0] || g?.prefs?.puesto || "")}" placeholder="${T("Ej.: diseñadora UX, contable, camarero…", "E.g. UX designer, accountant, chef…")}"></div><div class="field grow"><label for="hunt-city">${T("Ciudad (opcional)", "City (optional)")}</label><input class="input" id="hunt-city" maxlength="60" value="${esc(h.city)}" placeholder="${T("Ej.: Madrid", "E.g. London")}"></div></div>
    <label class="check"><input type="checkbox" id="hunt-remote" ${h.remote ? "checked" : ""}> ${T("Incluir trabajos en remoto", "Include remote jobs")}</label>
    <div class="field"><label for="hunt-li">${T("Tu LinkedIn (opcional, para tu perfil)", "Your LinkedIn (optional, for your profile)")}</label><input class="input" id="hunt-li" type="url" inputmode="url" maxlength="200" value="${esc(h.linkedin || "")}" placeholder="https://www.linkedin.com/in/…"></div>
  </div>`;
}
function jobCard(j) {
  const h = H(), key = "job:" + j.id, fit = h.fits[j.id];
  const saved = h.saved.includes(j.id), isNew = !h.seen[j.id];
  const op = HS.op === j.id;
  const app = h.apps[j.id];
  return `<article class="job${saved ? " saved" : ""}" data-job-id="${j.id}">
    <div class="row g3" style="align-items:flex-start"><span class="co">${esc((j.company || "?").trim().charAt(0).toUpperCase())}</span>
      <div class="grow stack g1"><div class="row g2 wrap">${isNew ? `<span class="tag tag-new">${T("Nueva", "New")}</span>` : ""}${j.remote ? `<span class="tag">${T("Remoto", "Remote")}</span>` : ""}${j.salary ? `<span class="tag tag-ready">${esc(String(j.salary).slice(0, 40))}</span>` : ""}</div>
        <h4 class="job-t">${esc(j.title)}</h4><p class="post-meta">${esc(j.company || "")}${j.location ? " · " + esc(String(j.location).slice(0, 60)) : ""} · ${agoShort(j.posted_at)}</p></div>
      ${fit ? `<span class="fit ${fit.fit >= 75 ? "hi" : fit.fit >= 55 ? "mid" : "lo"}" title="${T("Encaje", "Fit")}">${fit.fit}%</span>` : ""}</div>
    ${fit?.why ? `<p class="why">${ico("sparkle", "i16")} ${esc(fit.why)}</p>` : j.snippet ? `<p class="muted small snip">${esc(j.snippet.slice(0, 180))}…</p>` : ""}
    ${sigLine(key)}
    ${app?.status === "busy" ? `<p class="hint">${T("Preparando tu candidatura…", "Preparing your application…")}</p>` : ""}
    <div class="row g2 wrap job-acts">
      <a class="btn btn-secondary btn-sm" href="${esc(j.url)}" target="_blank" rel="noopener" data-act="job-open" data-id="${j.id}">${T("Ver oferta", "View job")}</a>
      <button class="btn ${app?.text ? "btn-secondary" : "btn-primary"} btn-sm" type="button" data-action="hunt-apply" data-id="${j.id}" ${app?.status === "busy" ? "disabled" : ""}>${app?.text ? T("Ver candidatura", "See application") : T("Preparar candidatura", "Prepare application")}</button>
      <button class="btn btn-ghost btn-sm" type="button" data-action="hunt-save" data-id="${j.id}" aria-pressed="${saved}">${ico("bookmark")}${saved ? T("Guardada", "Saved") : T("Guardar", "Save")}</button>
      <button class="btn btn-ghost btn-sm" type="button" data-action="hunt-op" data-id="${j.id}" aria-expanded="${op}">${T("Opinar / descartar", "Rate / dismiss")}</button>
    </div>
    ${op ? `<div class="opbox stack g2"><div class="section-title">${T("No me interesa porque…", "Not for me because…")}</div><div class="chips wrapchips">${JOB_DISLIKE().map((t) => `<button class="chip chip-sm" type="button" data-action="hunt-hide" data-id="${j.id}" data-t="${esc(t)}">${esc(t)}</button>`).join("")}</div>
      <div class="section-title">${T("¿Sabes algo de esta oferta? Ayuda a los demás", "Know something about this job? Help others")}</div><div class="chips wrapchips">${JOB_OPINION().map(([t, s]) => `<button class="chip chip-sm" type="button" data-action="hunt-opinion" data-id="${j.id}" data-t="${esc(t)}" data-s="${s}">${esc(t)}</button>`).join("")}</div><p class="hint">${T("Es anónimo. Lo verán otras personas que miren esta oferta.", "It's anonymous. Others looking at this job will see it.")}</p></div>` : ""}
  </article>`;
}
function huntResultsHTML() {
  const h = H();
  const list = h.tab === "guardadas" ? h.jobs.filter((j) => h.saved.includes(j.id)).concat((h.savedJobs || []).filter((j) => h.saved.includes(j.id) && !h.jobs.some((x) => x.id === j.id))) : h.jobs.filter((j) => !h.hidden[j.id]);
  const nNew = h.jobs.filter((j) => !h.seen[j.id] && !h.hidden[j.id]).length;
  const p = h.profile;
  return `<div class="stack g4">
    <div class="card stack g2 hunt-prof"><div class="row between wrap g2"><div class="stack g1"><strong>${esc(p?.headline || h.terms.join(" · ") || T("Tu búsqueda", "Your search"))}</strong><span class="post-meta">${[h.city || T("Cualquier ciudad", "Any city"), h.remote ? T("+ remoto", "+ remote") : "", p?.seniority || ""].filter(Boolean).map(esc).join(" · ")}</span></div><button class="btn btn-ghost btn-sm" type="button" data-action="hunt-edit">${ico("edit")}${T("Ajustar", "Adjust")}</button></div>
      ${HS.edit ? `<div class="stack g2"><div class="field"><label for="hunt-terms">${T("Puestos (separados por comas)", "Roles (comma separated)")}</label><input class="input" id="hunt-terms" maxlength="200" value="${esc(h.terms.join(", "))}"></div><div class="row g2 wrap"><div class="field grow"><label for="hunt-city">${T("Ciudad", "City")}</label><input class="input" id="hunt-city" maxlength="60" value="${esc(h.city)}"></div><label class="check" style="align-self:flex-end"><input type="checkbox" id="hunt-remote" ${h.remote ? "checked" : ""}> ${T("Remoto", "Remote")}</label></div><div class="row g2"><button class="btn btn-primary btn-sm" type="button" data-action="hunt-edit-save">${T("Guardar y buscar", "Save and search")}</button><button class="btn btn-ghost btn-sm" type="button" data-action="hunt-new">${T("Cambiar CV", "Change CV")}</button></div></div>` : `<div class="chips wrapchips">${h.terms.map((t) => `<span class="chip chip-sm static">${esc(t)}</span>`).join("")}</div>`}
      <p class="hint">${HS.busy === "search" ? T("Buscando ofertas nuevas…", "Looking for new jobs…") : HS.busy === "rank" ? T("Puntuando cuánto encajas en cada una…", "Scoring how well you fit each one…") : `${T("Última búsqueda", "Last search")}: ${h.lastRun ? agoShort(h.lastRun) : "—"}. ${T("Busco solo cada día: vuelve mañana o te aviso cuando haya nuevas.", "I search on my own every day: come back tomorrow or I'll tell you when there are new ones.")}`} ${HS.busy ? "" : `<button class="link-btn" type="button" data-action="hunt-run">${T("Buscar ahora", "Search now")}</button>`}</p></div>
    <div class="seg seg-sm" role="tablist">${[["todo", T(`Para ti${nNew ? ` · ${nNew} nuevas` : ""}`, `For you${nNew ? ` · ${nNew} new` : ""}`)], ["guardadas", T(`Guardadas · ${h.saved.length}`, `Saved · ${h.saved.length}`)]].map(([k, l]) => `<button role="tab" type="button" aria-selected="${h.tab === k}" data-action="hunt-tab" data-v="${k}">${l}</button>`).join("")}</div>
    ${list.length ? `<div class="jobs">${list.map(jobCard).join("")}</div>` : HS.busy ? `<div class="skel"></div><div class="skel"></div><div class="skel"></div>` : `<div class="empty"><p><strong>${h.tab === "guardadas" ? T("Aún no has guardado ofertas.", "No saved jobs yet.") : T("Hoy no he encontrado ofertas con estos puestos.", "No jobs found today for these roles.")}</strong></p><p class="muted">${T("Prueba con otro nombre de puesto o quita la ciudad. Mañana vuelvo a buscar.", "Try another job title or remove the city. I'll search again tomorrow.")}</p></div>`}
    <p class="post-meta">${T("Ofertas reales de webs de empleo y páginas de empresas, actualizadas cada pocas horas. Persohna aún no se presenta por ti: te prepara la candidatura y tú la envías.", "Real jobs from job boards and company career pages, updated every few hours. Persohna doesn't apply for you yet: it prepares the application and you send it.")}</p>
  </div>`;
}
function huntApplyHTML(j) {
  const a = H().apps[j.id] || {};
  return `<div class="stack g4"><button class="link-btn small" type="button" data-action="hunt-back" style="align-self:flex-start">${ico("back", "i16")} ${T("Volver a las ofertas", "Back to jobs")}</button>
    <div class="stack g1"><h3 class="h-card">${esc(j.title)}</h3><p class="post-meta">${esc(j.company || "")} · ${esc(j.location || "")}</p></div>
    ${a.status === "busy" ? `<div class="skel"></div><div class="skel"></div>${bgHint()}` : a.text ? `<div class="row g2 wrap"><button class="btn btn-secondary btn-sm" type="button" data-action="copy-text" data-t="${esc(a.text)}">${T("Copiar todo", "Copy all")}</button><button class="btn btn-secondary btn-sm" type="button" data-action="hunt-pdf" data-id="${j.id}">${ico("download")}PDF</button><a class="btn btn-primary btn-sm" href="${esc(j.url)}" target="_blank" rel="noopener" data-act="job-open" data-id="${j.id}">${T("Ir a la oferta y enviarla", "Go to the job and send it")}</a></div><div class="ai-out">${md(a.text)}</div>
      <div class="card stack g2"><strong>${T("¿Ya la enviaste?", "Sent it already?")}</strong><div class="row g2 wrap"><button class="btn btn-secondary btn-sm" type="button" data-action="hunt-applied" data-id="${j.id}" ${a.applied ? "disabled" : ""}>${a.applied ? T("Marcada como enviada", "Marked as sent") : T("Sí, la envié", "Yes, I sent it")}</button><button class="btn btn-ghost btn-sm" type="button" data-action="hunt-interview" data-id="${j.id}">${T("Me llamaron para entrevista", "They called me for an interview")}</button></div><p class="hint">${T("Te la paso a «Mis candidaturas» y, si te llaman, practicamos la entrevista.", "I'll move it to “My applications” and, if they call, we practise the interview.")}</p></div>`
    : `<p class="err">${esc(a.err || T("No he podido prepararla.", "Couldn't prepare it."))}</p><button class="btn btn-primary" type="button" data-action="hunt-apply" data-id="${j.id}" data-force="1">${T("Reintentar", "Try again")}</button>`}</div>`;
}
function huntHTML() {
  const h = H();
  let body, foot = "";
  const job = HS.open ? (h.jobs.find((x) => x.id === HS.open) || (h.savedJobs || []).find((x) => x.id === HS.open)) : null;
  if (job) body = huntApplyHTML(job);
  else if (HS.busy === "profile") body = `<div class="stack g4" style="align-items:center;text-align:center;padding:24px 0"><div class="spinner" aria-hidden="true"></div><h3 class="h-card">${T("Leyendo tu perfil…", "Reading your profile…")}</h3><p class="muted">${T("Saco tus puestos, nivel y habilidades y busco ofertas reales que encajen.", "I'm pulling your roles, level and skills and looking for real jobs that fit.")}</p>${bgHint()}</div>`;
  else if (!h.terms.length) { body = huntSetupHTML(); foot = `<button class="btn btn-primary" type="button" data-action="hunt-start">${T("Buscar ofertas", "Find jobs")}</button>`; }
  else body = huntResultsHTML();
  const err = HS.err ? `<p class="err" role="alert">${esc(HS.err)}</p>` : "";
  return `${sheetHead(HLBL())}<div class="sheet-body stack g4" data-view="hunt">${err}${body}</div>${foot ? `<div class="sheet-foot">${foot}</div>` : ""}`;
}
async function huntProfile(text) {
  text = text || S.cv?.text; if (!text) return;
  HS.busy = "profile"; HS.err = ""; refreshHunt();
  const r = await askAI5("profile", [{ role: "user", content: text.slice(0, 20000) }], { cv: undefined });
  HS.busy = "";
  const p = !r.error && parseJSON(r.text);
  if (!p || !Array.isArray(p.roles) || !p.roles.length) { HS.err = T("No he podido leer bien tu perfil. Escribe el puesto que buscas.", "I couldn't read your profile well. Type the role you want."); refreshHunt(); return; }
  const h = H();
  h.profile = { headline: String(p.headline || "").slice(0, 120), seniority: p.seniority || "", skills: (p.skills || []).slice(0, 12), languages: p.languages || [], summary: String(p.summary || "").slice(0, 300), years: p.years || 0 };
  h.terms = [...new Set([...(p.roles || []).map((x) => String(x).trim()).filter(Boolean).slice(0, 4)])];
  if (!h.city && p.city) h.city = String(p.city).slice(0, 60);
  if (p.country_code) h.country = String(p.country_code).toLowerCase().slice(0, 2);
  if (p.remote_ok !== false) h.remote = true;
  const tg = trabajoGoal(); if (tg && !tg.prefs?.puesto && h.terms[0]) { tg.prefs = { ...(tg.prefs || {}), puesto: h.terms[0] }; tg.title = CATS.trabajo.title(tg.prefs); }
  save();
  await huntRun();
}
async function huntRun({ quiet = false } = {}) {
  const h = H(); if (!h.terms.length || HS.busy === "search") return;
  HS.busy = "search"; HS.err = ""; refreshHunt();
  const country = h.country || (/(madrid|barcelona|valencia|sevilla|málaga|malaga|bilbao|zaragoza|españa|spain)/i.test(h.city) ? "es" : "");
  const d = await rpc(JB, "px_jobs_search", { p_terms: h.terms.slice(0, 5), p_where: h.city || null, p_remote: !!h.remote, p_since: null, p_limit: 45, p_country: country || null }, 40000);
  if (!Array.isArray(d)) { HS.busy = ""; HS.err = T("No he podido buscar ahora. Lo intento otra vez en un rato.", "Couldn't search right now. I'll try again shortly."); refreshHunt(); return; }
  const before = new Set(h.jobs.map((j) => j.id));
  const city = (h.city || "").toLowerCase();
  const fresh = d.filter((j) => !h.hidden[j.id]).map((j) => ({ id: j.id, title: j.title, company: j.company, location: j.location, remote: j.remote, salary: j.salary, url: j.url, posted_at: j.posted_at, source: j.source, snippet: j.snippet, reposts: j.reposts || 1, middleman: !!j.middleman, m: j.m + (city && String(j.location || "").toLowerCase().includes(city) ? 3 : 0) - (j.middleman ? 4 : 0) }));
  fresh.sort((a, b) => b.m - a.m);
  const nNew = fresh.filter((j) => !before.has(j.id) && !h.seen[j.id]).length;
  h.jobs = fresh.slice(0, 40); h.lastRun = new Date().toISOString();
  api("demand", { kind: "job", terms: h.terms, place: h.city, n: d.length });
  save(); HS.busy = "rank"; refreshHunt();
  await Promise.all([huntRank(), loadSignals(h.jobs.map((j) => "job:" + j.id))]);
  HS.busy = "";
  h.jobs.sort((a, b) => (h.fits[b.id]?.fit ?? b.m * 6) - (h.fits[a.id]?.fit ?? a.m * 6));
  save(); refreshHunt(); render({ keepScroll: true });
  if (quiet && nNew) doneNotify(`Tu Persohna encontró ${nNew} ofertas nuevas para ti`, `Your Persohna found ${nNew} new jobs for you`, openHunt);
}
async function huntRank() {
  const h = H();
  const todo = h.jobs.filter((j) => !h.fits[j.id]).slice(0, 24);
  if (!todo.length) return;
  const prof = { roles: h.terms, ...(h.profile || {}), city: h.city, remote_ok: h.remote };
  const list = todo.map((j) => `${j.id} | ${j.title} | ${j.company || ""} | ${j.location || ""}${j.remote ? " (remote)" : ""} | ${(j.snippet || "").slice(0, 170)}`).join("\n");
  const r = await askAI5("rank", [{ role: "user", content: `PERFIL:\n${JSON.stringify(prof).slice(0, 1500)}\n\nOFERTAS:\n${list}` }], { cv: undefined, goals: undefined });
  const p = !r.error && parseJSON(r.text);
  (p?.r || []).forEach((x) => { const id = +x.id; if (todo.some((j) => j.id === id)) h.fits[id] = { fit: Math.max(0, Math.min(100, Math.round(+x.fit || 0))), why: String(x.why || "").slice(0, 110) }; });
  const keep = new Set(h.jobs.map((j) => String(j.id)).concat(h.saved.map(String)));
  Object.keys(h.fits).forEach((k) => { if (!keep.has(k)) delete h.fits[k]; });
}
async function huntApply(id, force = false) {
  const h = H(); const j = h.jobs.find((x) => x.id === id) || (h.savedJobs || []).find((x) => x.id === id); if (!j) return;
  HS.open = id;
  if (h.apps[id]?.text && !force) { refreshHunt(); return; }
  if (!S.cv?.text) { HS.open = null; HS.err = T("Para preparar la candidatura necesito tu CV. Súbelo con «Ajustar» → «Cambiar CV».", "To prepare the application I need your CV. Upload it via “Adjust” → “Change CV”."); refreshHunt(); return; }
  h.apps[id] = { status: "busy" }; refreshHunt();
  const det = await rpc(JB, "px_job_detail", { p_id: id });
  const desc = det && !det.error ? `${det.title}\n${det.company || ""} · ${det.location || ""}\n${det.salary || ""}\n\n${det.description || ""}` : `${j.title}\n${j.company}\n${j.snippet}`;
  const r = await askAI5("cv_tailor", [{ role: "user", content: `MI CV:\n${S.cv.text}\n\n---\nOFERTA:\n${desc}` }], { cv: undefined });
  h.apps[id] = r.error ? { status: "err", err: aiErr(r.error) } : { status: "ok", text: r.text, at: today(), emails: (det && !det.error && Array.isArray(det.emails)) ? det.emails.slice(0, 3) : [], desc: (det && !det.error ? (det.description || "") : "").slice(0, 6000) };
  if (!r.error) {
    if (!h.saved.includes(id)) { h.saved.push(id); sendSignal("job:" + id, "job", "saved", { title: j.title, meta: { company: j.company, location: j.location } }); }
    if (!S.jobs.some((x) => x.ext === id)) S.jobs.unshift({ id: uid(), ext: id, title: j.title, company: j.company || "", status: "saved", at: today(), note: "", url: j.url });
    addHistory(`Candidatura preparada: ${j.title}`, `Application prepared: ${j.title}`); S.xp += 5;
  }
  keepSaved(); save();
  if (isTop(HLBL()) && HS.open === id) refreshHunt();
  else if (!r.error) doneNotify(`Candidatura lista: ${j.title}`, `Application ready: ${j.title}`, () => { openHunt(); HS.open = id; refreshHunt(); });
}
function keepSaved() { const h = H(); h.savedJobs = [...(h.savedJobs || []).filter((j) => h.saved.includes(j.id) && !h.jobs.some((x) => x.id === j.id)), ...h.jobs.filter((j) => h.saved.includes(j.id))].slice(0, 60); }
function markSeen() { const h = H(); let ch = false; h.jobs.forEach((j) => { if (!h.seen[j.id]) { h.seen[j.id] = 1; ch = true; } }); const ks = Object.keys(h.seen); if (ks.length > 600) ks.slice(0, ks.length - 600).forEach((k) => delete h.seen[k]); if (ch) save(); }

// ---------- Casas reales (RealHunt) y comprobar cualquier anuncio ----------
let HO = null;
const HOLBL = () => T("Casas que encajan", "Homes that fit");
function openHomes(goalId) {
  const g = S.goals.find((x) => x.id === goalId) || S.goals.find((x) => x.cat === "vivienda" && !x.done);
  HO = { g: g?.id, busy: true, rows: [], note: "", op: null, err: "" };
  closeAll(); openLayer(homesHTML(), { full: true, wide: true, label: HOLBL() });
  homesLoad(g);
}
async function homesLoad(g) {
  const p = g?.prefs || {}, buy = /compr|buy/i.test(p.op || ""), max = +p.presupuesto || 0;
  const zona = String(p.zona || "").split(/[,·]/)[0].trim();
  let d = await rpc(RH, "community_feed", { p: { ...(zona ? { q: zona } : {}), ...(buy && max > 5000 ? { max_price: max } : {}), limit: 30 } });
  let rows = d?.rows || [];
  HO.note = "";
  if (!rows.length) { d = await rpc(RH, "community_feed", { p: { ...(buy && max > 5000 ? { max_price: max } : {}), limit: 30 } }); rows = d?.rows || []; HO.note = zona ? T(`No tengo casas verificadas en «${zona}» todavía. Te enseño las mejores cerca de tu presupuesto.`, `No verified homes in “${zona}” yet. Here are the best within your budget.`) : ""; }
  if (!buy && g) HO.note = (HO.note ? HO.note + " " : "") + T("Ojo: estas casas son en venta. Para alquiler aún no tengo una fuente real; usa «Comprobar un anuncio» con los pisos que veas.", "Note: these homes are for sale. I don't have a real rental source yet; use “Check a listing” on the flats you find.");
  HO.rows = rows.slice(0, 30); HO.busy = false;
  if (d?.error) HO.err = T("No he podido cargar las casas ahora.", "Couldn't load homes right now.");
  await loadSignals(HO.rows.map((r) => "home:" + r.slug));
  if (isTop(HOLBL())) setLayer(homesHTML());
}
function homesHTML() {
  const rows = HO.rows;
  const card = (r) => { const key = "home:" + r.slug, img = r.image_urls?.[0] ? (r.image_urls[0].startsWith("http") ? r.image_urls[0] : RH.site + r.image_urls[0]) : ""; return `<article class="home">${img ? `<img src="${esc(img)}" alt="" loading="lazy" width="640" height="400">` : ""}<div class="stack g2 home-b"><div class="row between g2"><strong>${esc(r.title)}</strong>${r.nota ? `<span class="fit hi">${r.nota}</span>` : ""}</div><p class="post-meta">${esc([r.location_name, r.country].filter(Boolean).join(", "))} · <strong>${fmtMoney(r.price_eur)}</strong>${r.sqm ? " · " + r.sqm + " m²" : ""}</p>${r.pick_note ? `<p class="small">${esc(r.pick_note)}</p>` : ""}${sigLine(key)}
    <div class="row g2 wrap"><a class="btn btn-primary btn-sm" href="${RH.site}/deal/${esc(r.slug)}" target="_blank" rel="noopener">${T("Ver casa", "View home")}</a><button class="btn btn-ghost btn-sm" type="button" data-action="home-op" data-k="${esc(r.slug)}">${T("Opinar", "Rate")}</button></div>
    ${HO.op === r.slug ? `<div class="chips wrapchips">${HOME_OPINION().map(([t, s]) => `<button class="chip chip-sm" type="button" data-action="home-opinion" data-k="${esc(r.slug)}" data-t="${esc(t)}" data-s="${s}" data-title="${esc(r.title)}">${esc(t)}</button>`).join("")}</div>` : ""}</div></article>`; };
  const body = HO.busy ? `<div class="skel"></div><div class="skel"></div>` : `${HO.note ? `<div class="note">${ico("info")}<span>${esc(HO.note)}</span></div>` : ""}${HO.err ? `<p class="err">${esc(HO.err)}</p>` : ""}<div class="homes">${rows.map(card).join("")}</div><p class="post-meta">${T("Casas reales revisadas a mano por RealHunt. Persohna no cobra nada por enseñarlas.", "Real homes hand-checked by RealHunt. Persohna charges nothing to show them.")}</p>`;
  return `${sheetHead(HOLBL())}<div class="sheet-body stack g4"><button class="btn btn-secondary" type="button" data-action="check-open" data-kind="home" style="align-self:flex-start">${ico("search")}${T("Comprobar un anuncio que hayas visto", "Check a listing you've seen")}</button>${body}</div>`;
}
// Comprobar cualquier anuncio (piso, oferta o evento) y dejar tu opinión
let CK = null;
const CKLBL = () => T("Comprobar un anuncio", "Check a listing");
function normUrl(u) { try { const x = new URL(String(u).trim()); x.hash = ""; x.pathname = x.pathname.replace(/^\/(en|es|de|fr|it|pt|ca|da|nl|sv)(\/|$)/i, "/"); ["utm_source", "utm_medium", "utm_campaign", "fbclid", "gclid", "ref"].forEach((p) => x.searchParams.delete(p)); return (x.hostname.replace(/^www\./, "") + x.pathname.replace(/\/$/, "") + (x.search || "")).toLowerCase().slice(0, 180); } catch { return ""; } }
function openCheck(kind = "home") { CK = { kind, url: "", key: "", busy: false, done: false }; closeAll(); openLayer(checkHTML(), { label: CKLBL() }); }
function checkHTML() {
  const kinds = [["home", T("Piso o casa", "Flat or house")], ["job", T("Oferta de empleo", "Job ad")], ["event", T("Evento o entradas", "Event or tickets")]];
  const ops = CK.kind === "home" ? HOME_OPINION() : CK.kind === "job" ? JOB_OPINION() : [[T("Reventa abusiva", "Price gouging"), "bad"], [T("Posible estafa", "Possible scam"), "bad"], [T("Entradas legítimas", "Legit tickets"), "good"], [T("Mereció la pena", "Worth it"), "good"]];
  return `${sheetHead(CKLBL())}<div class="sheet-body stack g4">
    <p class="muted">${T("Pega el enlace de un anuncio y te digo qué han dicho otras personas de Persohna. Después deja tu opinión: así nadie más cae en un piso con humedad o una oferta que nunca responde.", "Paste a listing link and I'll show what other Persohna people said. Then leave yours: so nobody else falls for a damp flat or a job that never replies.")}</p>
    <div class="seg seg-sm" role="radiogroup">${kinds.map(([k, l]) => `<button type="button" role="radio" aria-checked="${CK.kind === k}" data-action="check-kind" data-v="${k}">${l}</button>`).join("")}</div>
    <div class="row g2"><label class="sr" for="ck-url">URL</label><input class="input grow" id="ck-url" type="url" inputmode="url" value="${esc(CK.url)}" placeholder="https://…"><button class="btn btn-primary" type="button" data-action="check-go">${T("Comprobar", "Check")}</button></div>
    ${CK.key ? `<div class="card stack g3">${CK.busy ? `<p class="muted">${T("Buscando opiniones…", "Looking for reviews…")}</p>` : sigLine(CK.key) || `<p class="muted">${T("Nadie ha opinado todavía de este anuncio. Sé la primera persona.", "Nobody has reviewed this listing yet. Be the first.")}</p>`}
      <div class="section-title">${T("Tu opinión (anónima)", "Your review (anonymous)")}</div><div class="chips wrapchips">${ops.map(([t, s]) => `<button class="chip chip-sm" type="button" data-action="check-opinion" data-t="${esc(t)}" data-s="${s}">${esc(t)}</button>`).join("")}</div>
      ${CK.done ? `<p class="hint">${ico("check", "i16")} ${T("Gracias: ya lo verán los demás.", "Thanks: others will see it.")}</p>` : ""}</div>` : ""}
  </div>`;
}

// ---------- CV: análisis y adaptación sin bloquear ----------
const CVLBL = () => T("Tu CV", "Your CV");
cvReview = async function () {
  const cv = S.cv; if (!cv?.text) return;
  CVS.busy = true; CVS.err = ""; CVS.tab = "review"; if (isTop(CVLBL())) setLayer(cvHTML());
  const r = await askAI5("cv_review", [{ role: "user", content: cv.text }], { cv: undefined });
  CVS.busy = false;
  if (r.error) CVS.err = aiErr(r.error);
  else { cv.review = r.text; cv.reviewAt = today(); addHistory("Tu Persohna analizó tu CV", "Your Persohna reviewed your CV"); markCVStep(); save(); }
  if (S.hunt && !S.hunt.profile && !r.error) huntProfile();
  if (isTop(CVLBL())) setLayer(cvHTML()); else if (!r.error) doneNotify("El análisis de tu CV está listo", "Your CV review is ready", () => openCV("review"));
};
const _cvTailor6 = cvTailor;
cvTailor = async function () {
  const wasOpen = () => isTop(CVLBL());
  const _set = setLayer; let lost = false;
  setLayer = (html) => { if (wasOpen()) _set(html); else lost = true; };
  try { await _cvTailor6(); } finally { setLayer = _set; }
  if (lost && CVS.result) doneNotify("Tu CV adaptado a la oferta está listo", "Your tailored CV is ready", () => { openCV("tailor"); });
};
const _cvHTML6 = cvHTML;
cvHTML = function () {
  let h = _cvHTML6();
  if (CVS.busy) h = h.replace('<div class="sheet-foot">', bgHint() + '<div class="sheet-foot">');
  if (CVS.tab === "tailor" && !CVS.result) h = h.replace(/(<div class="stack g4"><p class="muted">)/, `<button class="hunt-cta" type="button" data-action="hunt"><img src="${iconSrc("trabajo")}" alt="" width="44" height="44"><span class="grow stack g1"><strong>${T("Mejor: que busque las ofertas por ti", "Better: let me find the jobs for you")}</strong><span class="post-meta">${T("Sin copiar y pegar anuncios. Ofertas reales cada día, con tu encaje.", "No copy-pasting ads. Real jobs every day, with your fit.")}</span></span>${ico("chev", "chev")}</button>$1`);
  return h;
};
// el error de «pega la oferta» no debe seguir ahí al volver a la pestaña
const _openCV6 = openCV;
openCV = function (tab) { _openCV6(tab); if (CVS) { CVS.err = ""; } };

// ---------- Puntos de entrada: tarjeta del CV, inicio y objetivo ----------
cvCard = function () {
  const cv = S.cv, h = S.hunt, nNew = h ? h.jobs.filter((j) => !h.seen[j.id] && !h.hidden[j.id]).length : 0;
  return `<section class="card cv-card hunt-card stack g3" aria-labelledby="cv-t"><div class="row g3"><img src="${iconSrc("trabajo")}" alt="" width="56" height="56"><div class="grow stack g1"><h2 class="h-card" id="cv-t">${h?.terms?.length ? (nNew ? T(`${nNew} ofertas nuevas para ti`, `${nNew} new jobs for you`) : T("Tu Persohna busca trabajo por ti", "Your Persohna is job hunting for you")) : T("Te busco trabajo cada día", "I'll find you jobs every day")}</h2><p class="muted small">${h?.terms?.length ? `${esc(h.terms.slice(0, 2).join(" · "))}${h.lastRun ? " · " + T("última búsqueda", "last search") + " " + agoShort(h.lastRun) : ""}` : T("Sube tu CV o el PDF de LinkedIn. Ofertas reales con tu encaje y la candidatura preparada.", "Upload your CV or LinkedIn PDF. Real jobs with your fit and the application ready.")}</p></div></div>
    <div class="row g2 wrap"><button class="btn btn-primary" type="button" data-action="hunt">${h?.terms?.length ? T("Ver ofertas", "See jobs") : T("Empezar", "Start")}</button>${cv?.text ? `<button class="btn btn-ghost" type="button" data-action="cv" data-v="review">${T("Análisis del CV", "CV review")}</button><button class="btn btn-ghost" type="button" data-action="tool" data-v="interview">${T("Simular entrevista", "Practice interview")}</button>` : ""}</div></section>`;
};
const _goalHTML6 = goalHTML;
goalHTML = function (g) {
  let h = _goalHTML6(g);
  const cut = h.lastIndexOf('</div><div class="sheet-foot"');
  let add = "";
  if (g.cat === "trabajo" && !g.done) add = `<button class="hunt-cta" type="button" data-action="hunt"><img src="${iconSrc("trabajo")}" alt="" width="44" height="44"><span class="grow stack g1"><strong>${T("Buscar ofertas reales por mí", "Find real jobs for me")}</strong><span class="post-meta">${T("Cada día, con tu encaje y la candidatura preparada", "Every day, with your fit and the application ready")}</span></span>${ico("chev", "chev")}</button>`;
  if (g.cat === "vivienda" && !g.done) add = `<button class="hunt-cta" type="button" data-action="homes" data-id="${g.id}"><img src="${iconSrc("vivienda")}" alt="" width="44" height="44"><span class="grow stack g1"><strong>${T("Ver casas reales que encajan", "See real homes that fit")}</strong><span class="post-meta">${T("Y comprueba cualquier anuncio: humedad, ruido, estafas…", "And check any listing: damp, noise, scams…")}</span></span>${ico("chev", "chev")}</button>`;
  if (g.cat === "eventos" && !g.done) add = `<button class="hunt-cta" type="button" data-action="check-open" data-kind="event"><img src="${iconSrc("eventos")}" alt="" width="44" height="44"><span class="grow stack g1"><strong>${T("Comprobar un anuncio de entradas", "Check a ticket listing")}</strong><span class="post-meta">${T("Mira si otras personas lo marcaron como estafa o reventa abusiva", "See if others flagged it as a scam or price gouging")}</span></span>${ico("chev", "chev")}</button>`;
  if (add && cut > 0) h = h.replace('<div class="stack g2"><div class="row between"><div class="section-title">', add + '<div class="stack g2"><div class="row between"><div class="section-title">');
  return h;
};
const _viewInicio6 = viewInicio;
viewInicio = function () {
  let h = _viewInicio6();
  if (S.goals.some((g) => g.cat === "vivienda" && !g.done) && !h.includes('data-action="homes"')) h = h.replace('<section class="stack g3" aria-labelledby="tools-t">', `<section class="card cv-card hunt-card stack g3"><div class="row g3"><img src="${iconSrc("vivienda")}" alt="" width="56" height="56"><div class="grow stack g1"><h2 class="h-card">${T("Casas reales que encajan contigo", "Real homes that fit you")}</h2><p class="muted small">${T("Revisadas a mano, con lo que opinan otras personas.", "Hand-checked, with what other people say.")}</p></div></div><div class="row g2 wrap"><button class="btn btn-primary" type="button" data-action="homes">${T("Ver casas", "See homes")}</button><button class="btn btn-ghost" type="button" data-action="check-open" data-kind="home">${T("Comprobar un anuncio", "Check a listing")}</button></div></section><section class="stack g3" aria-labelledby="tools-t">`);
  return h;
};
// el paso «Pega tu CV o tu LinkedIn» y «Subir o pegar CV» abren «Busca por mí»
document.addEventListener("click", (e) => {
  const eg = e.target.closest('.gm-next [data-action="edit-goal"]');
  if (eg) { const g = S.goals.find((x) => x.id === eg.dataset.id); if (g?.cat === "trabajo") { e.stopPropagation(); e.preventDefault(); openHunt(); return; } }
  const b = e.target.closest('[data-action="cv"]'); if (!b) return;
  const v = b.dataset.v;
  if (!v || (v === "edit" && !S.cv?.text)) { e.stopPropagation(); e.preventDefault(); openHunt(); }
}, true);
// «Herramientas»: añadir «Busca por mí» y «Comprobar un anuncio»
const _TOOLS6 = TOOLS;
function toolsCard6() {
  const extra = [["hunt", "trabajo", T("Busca trabajo por mí", "Find me a job"), T("Ofertas reales cada día", "Real jobs every day")], ["check", "comunidad", T("Comprobar un anuncio", "Check a listing"), T("Pisos, ofertas o entradas: qué dicen otros", "Flats, jobs or tickets: what others say")]];
  return extra;
}
toolsCard = function () {
  const all = [...toolsCard6(), ..._TOOLS6()];
  return `<section class="stack g3" aria-labelledby="tools-t"><h2 class="section-title" id="tools-t">${T("Herramientas de tu Persohna", "Your Persohna's tools")}</h2><div class="tools">${all.map(([k, icn, t, d]) => `<button class="tool" type="button" data-action="tool" data-v="${k}"><img src="${iconSrc(icn)}" alt="" width="48" height="48" loading="lazy"><span class="stack g1"><strong>${t}</strong><span class="post-meta">${d}</span></span></button>`).join("")}</div></section>`;
};

// ---------- Eventos ----------
document.addEventListener("click", async (e) => {
  const a0 = e.target.closest("[data-act]");
  if (a0 && a0.dataset.act === "job-open") { const id = +a0.dataset.id; const h = H(); const j = h.jobs.find((x) => x.id === id) || (h.savedJobs || []).find((x) => x.id === id); if (j) sendSignal("job:" + id, "job", "visited", { title: j.title, meta: { company: j.company } }); }
  const b = e.target.closest("[data-action]"); if (!b) return;
  const a = b.dataset.action, id = +b.dataset.id;
  const h = S.hunt;
  switch (a) {
    case "hunt": openHunt(); break;
    case "tool": if (b.dataset.v === "hunt") openHunt(); else if (b.dataset.v === "check") openCheck("home"); break;
    case "hunt-start": {
      const hh = H(); const role = ($("#hunt-role")?.value || "").trim();
      hh.city = ($("#hunt-city")?.value || "").trim(); hh.remote = !!$("#hunt-remote")?.checked; hh.linkedin = ($("#hunt-li")?.value || "").trim();
      if (!role && !S.cv?.text) { HS.err = T("Sube tu CV o escribe el puesto que buscas.", "Upload your CV or type the role you want."); refreshHunt(); $("#hunt-role")?.focus(); return; }
      if (hh.linkedin && !/linkedin\.com\/in\//i.test(hh.linkedin)) { HS.err = T("Ese enlace no parece de un perfil de LinkedIn (linkedin.com/in/…).", "That link doesn't look like a LinkedIn profile (linkedin.com/in/…)."); refreshHunt(); return; }
      if (role) { hh.terms = [role]; const g = trabajoGoal(); if (g && !g.prefs?.puesto) { g.prefs = { ...(g.prefs || {}), puesto: role }; g.title = CATS.trabajo.title(g.prefs); render({ keepScroll: true }); } } save();
      if (S.cv?.text && !role) huntProfile(); else huntRun();
      break;
    }
    case "hunt-run": huntRun(); break;
    case "hunt-tab": markSeen(); H().tab = b.dataset.v; refreshHunt(); break;
    case "hunt-edit": HS.edit = !HS.edit; refreshHunt(); break;
    case "hunt-edit-save": { const hh = H(); hh.terms = ($("#hunt-terms")?.value || "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 5); hh.city = ($("#hunt-city")?.value || "").trim(); hh.remote = !!$("#hunt-remote")?.checked; hh.fits = {}; HS.edit = false; save(); if (hh.terms.length) huntRun(); else refreshHunt(); break; }
    case "hunt-new": { const hh = H(); hh.terms = []; delete hh.profile; HS.edit = false; save(); refreshHunt(); break; }
    case "hunt-save": {
      const hh = H(); const j = hh.jobs.find((x) => x.id === id) || (hh.savedJobs || []).find((x) => x.id === id); if (!j) return;
      const on = !hh.saved.includes(id);
      hh.saved = on ? [...hh.saved, id] : hh.saved.filter((x) => x !== id);
      if (on && !S.jobs.some((x) => x.ext === id)) S.jobs.unshift({ id: uid(), ext: id, title: j.title, company: j.company || "", status: "saved", at: today(), note: "", url: j.url });
      sendSignal("job:" + id, "job", "saved", { title: j.title, meta: { company: j.company, location: j.location }, off: !on });
      keepSaved(); save(); refreshHunt(); toast(on ? T("Guardada en tus candidaturas", "Saved to your applications") : T("Quitada", "Removed")); break;
    }
    case "hunt-op": HS.op = HS.op === id ? null : id; refreshHunt(); break;
    case "hunt-hide": { const hh = H(); const j = hh.jobs.find((x) => x.id === id); hh.hidden[id] = b.dataset.t; HS.op = null; if (j) sendSignal("job:" + id, "job", "dislike", { title: j.title, tags: [b.dataset.t], meta: { company: j.company } }); save(); refreshHunt(); toast(T("Entendido: afino tus próximas búsquedas", "Got it: I'll fine-tune your next searches"), { label: T("Deshacer", "Undo"), fn: () => { delete hh.hidden[id]; save(); refreshHunt(); } }); break; }
    case "hunt-opinion": { const hh = H(); const j = hh.jobs.find((x) => x.id === id) || (hh.savedJobs || []).find((x) => x.id === id); if (!j) return; await sendSignal("job:" + id, "job", b.dataset.s, { title: j.title, tags: [b.dataset.t], meta: { company: j.company } }); HS.op = null; refreshHunt(); toast(T("Gracias: ayudas a otras personas", "Thanks: you're helping others")); break; }
    case "hunt-apply": huntApply(id, !!b.dataset.force); break;
    case "hunt-back": HS.open = null; refreshHunt(); break;
    case "hunt-pdf": { const j = (H().jobs.concat(H().savedJobs || [])).find((x) => x.id === id); if (j) printDoc(`${T("Candidatura", "Application")} · ${j.title}`, H().apps[id]?.text || ""); break; }
    case "hunt-applied": case "hunt-interview": {
      const hh = H(); const j = (hh.jobs.concat(hh.savedJobs || [])).find((x) => x.id === id); if (!j) return;
      const st = a === "hunt-applied" ? "applied" : "interview";
      hh.apps[id] = { ...(hh.apps[id] || {}), applied: true };
      let t = S.jobs.find((x) => x.ext === id); if (!t) { t = { id: uid(), ext: id, title: j.title, company: j.company || "", at: today(), note: "", url: j.url }; S.jobs.unshift(t); }
      t.status = st; sendSignal("job:" + id, "job", st, { title: j.title, meta: { company: j.company } });
      if (st === "applied") { const f = new Date(); f.setDate(f.getDate() + 7); t.followAt = f.toISOString().slice(0, 10); t.appliedAt = today(); }
      addHistory(st === "applied" ? `Enviaste tu candidatura: ${j.title}` : `¡Entrevista en ${j.company || j.title}!`, st === "applied" ? `You applied: ${j.title}` : `Interview at ${j.company || j.title}!`); S.xp += st === "applied" ? 5 : 15;
      save(); refreshHunt(); render({ keepScroll: true });
      if (st === "interview") toast(T("¡Bien! ¿Practicamos la entrevista?", "Nice! Shall we practise the interview?"), { label: T("Practicar", "Practise"), fn: () => openInterview(`${j.title}${j.company ? " · " + j.company : ""}`) }); else toast(T("Marcada como enviada", "Marked as sent"));
      break;
    }
    case "homes": openHomes(b.dataset.id); break;
    case "home-op": HO.op = HO.op === b.dataset.k ? null : b.dataset.k; setLayer(homesHTML()); break;
    case "home-opinion": await sendSignal("home:" + b.dataset.k, "home", b.dataset.s, { title: b.dataset.title, tags: [b.dataset.t] }); HO.op = null; setLayer(homesHTML()); toast(T("Gracias: ayudas a otras personas", "Thanks: you're helping others")); break;
    case "check-open": openCheck(b.dataset.kind || "home"); break;
    case "check-kind": CK.url = $("#ck-url")?.value || CK.url; CK.kind = b.dataset.v; CK.key = ""; CK.done = false; setLayer(checkHTML()); break;
    case "check-go": {
      CK.url = ($("#ck-url")?.value || "").trim(); const n = normUrl(CK.url);
      if (!n) { toast(T("Pega un enlace válido (https://…)", "Paste a valid link (https://…)")); $("#ck-url")?.focus(); return; }
      CK.key = `${CK.kind}:${n}`; CK.busy = true; CK.done = false; setLayer(checkHTML());
      delete SIGS[CK.key]; await loadSignals([CK.key]); CK.busy = false; setLayer(checkHTML());
      api("demand", { kind: "check-" + CK.kind, terms: [n.split("/")[0]] }); break;
    }
    case "check-opinion": if (!CK?.key) return; await sendSignal(CK.key, CK.kind, b.dataset.s, { title: CK.url.slice(0, 200), tags: [b.dataset.t], meta: { url: CK.url.slice(0, 300) } }); CK.done = true; setLayer(checkHTML()); break;
    case "close": if (S.hunt?.jobs?.length) markSeen(); break;
  }
});
document.addEventListener("change", async (e) => {
  if (e.target.id !== "hunt-file") return;
  const f = e.target.files?.[0]; if (!f) return;
  HS.err = ""; HS.busy = "profile"; refreshHunt();
  let text = "";
  try { text = await fileToText(f); } catch (err) { HS.busy = ""; HS.err = err?.message === "big" ? T("El archivo es demasiado grande (máx. 8 MB).", "File too large (max 8 MB).") : T("Formato no compatible. Usa PDF, Word (.docx) o texto.", "Unsupported format. Use PDF, Word (.docx) or text."); refreshHunt(); return; }
  if (text.length < 120) { HS.busy = ""; HS.err = T("No he encontrado texto (¿es un PDF escaneado?). Prueba con el PDF de LinkedIn.", "No text found (scanned PDF?). Try the LinkedIn PDF."); refreshHunt(); return; }
  const hh = H(); hh.city = ($("#hunt-city")?.value || hh.city || "").trim(); hh.linkedin = ($("#hunt-li")?.value || hh.linkedin || "").trim();
  const changed = text !== S.cv?.text;
  S.cv = { ...(S.cv || {}), text, name: f.name, at: today() }; if (changed) delete S.cv.review;
  markCVStep(); save(); e.target.value = "";
  huntProfile(text);
  if (!S.cv.review) setTimeout(() => { const _o = CVS; CVS = CVS || { tab: "review", busy: false, err: "", job: "", result: "" }; cvReview(); }, 200);
});
document.addEventListener("keydown", (e) => { if (e.key === "Enter" && ["hunt-role", "hunt-city", "hunt-li"].includes(e.target.id)) { e.preventDefault(); $('[data-action="hunt-start"]')?.click(); } if (e.key === "Enter" && e.target.id === "ck-url") { e.preventDefault(); $('[data-action="check-go"]')?.click(); } });
// Búsqueda automática: al abrir la app, si hace más de 12 h
function autoHunt() { const h = S.hunt; if (S.me && h?.terms?.length && !HS.busy && (!h.lastRun || Date.now() - new Date(h.lastRun) > 12 * 36e5)) huntRun({ quiet: true }); }
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") autoHunt(); });
setTimeout(autoHunt, 2500);
if (!stackLayers.length) render({ keepScroll: true });
