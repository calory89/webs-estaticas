"use strict";
// ---------- 9. Cuenta, sincronización, CV e IA ----------
const API_BASE = "https://gmdalfsvtfhzepyrdmjj.supabase.co/functions/v1/";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZGFsZnN2dGZoemVweXJkbWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2Mzc3MjIsImV4cCI6MjA1OTIxMzcyMn0.IIbXzmsRZzBeS6DhTHtYJjQNAFVJMaqb0EnxJbwwMx4";
async function callFn(fn, body, timeout = 45000) {
  const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(API_BASE + fn, { method: "POST", signal: ctl.signal, headers: { "content-type": "application/json", apikey: ANON, authorization: `Bearer ${ANON}` }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    return r.ok ? d : { error: d.error || "http_" + r.status, ...d };
  } catch (e) { return { error: e?.name === "AbortError" ? "timeout" : "network" }; } finally { clearTimeout(to); }
}
const api = (action, body = {}) => callFn("persohna-api", { action, ...body });

// IA: tareas (chat, cv_review, cv_tailor, plan)
function aiContext(extra = {}) {
  return {
    name: S.me?.name || "",
    goals: S.goals.filter((g) => !g.done).slice(0, 6).map((g) => ({ cat: g.cat, title: g.title, prefs: g.prefs || {}, notes: g.notes || "" })),
    cv: S.cv?.text ? S.cv.text.slice(0, 2500) : undefined,
    ...extra,
  };
}
async function askAI(task, messages, extra = {}) {
  const d = await callFn("persohna-chat", { task, lang: LANG, messages, context: aiContext(extra) }, task === "chat" ? 40000 : 90000);
  if (d.error) return { error: d.error };
  return { text: (d.reply || "").trim(), cut: d.stop === "max_tokens" };
}
// sustituye la función del chat (p3) para mandar más contexto
askClaude = async function () {
  const messages = S.chat.filter((m) => !m.pending).slice(-12).map((m) => ({ role: m.from === "me" ? "user" : "assistant", content: m.text ?? L(m) }));
  const r = await askAI("chat", messages);
  return r.error ? "" : r.text;
};

// ---------- Cuenta ----------
const AUTH_KEY = "persohna.auth";
let AUTH = (() => { try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "null") || {}; } catch { return {}; } })();
const loggedIn = () => !!AUTH.token;
function saveAuth() { try { AUTH.token ? localStorage.setItem(AUTH_KEY, JSON.stringify(AUTH)) : localStorage.removeItem(AUTH_KEY); } catch {} }
const SYNC = { state: "idle", at: 0 };
let pushT = null;
const _localSave = save;
save = function () {
  _localSave();
  if (!loggedIn()) return;
  clearTimeout(pushT); SYNC.state = "pending";
  pushT = setTimeout(pushNow, 1500);
};
function syncableState() { const c = { ...S }; delete c.welcome; return c; }
async function pushNow() {
  if (!loggedIn() || !S.me) return;
  SYNC.state = "saving";
  const r = await api("push", { token: AUTH.token, state: syncableState() });
  if (r.error === "bad_token") { sessionLost(); return; }
  if (r.error) { SYNC.state = "error"; return; }
  AUTH.rev = r.rev; saveAuth(); SYNC.state = "ok"; SYNC.at = Date.now();
  const el = $("#sync-status"); if (el) el.innerHTML = syncLabel();
}
window.addEventListener("pagehide", () => { if (loggedIn() && SYNC.state === "pending") { clearTimeout(pushT); try { navigator.sendBeacon?.(API_BASE + "persohna-api", new Blob([JSON.stringify({ action: "push", token: AUTH.token, state: syncableState() })], { type: "text/plain" })); } catch {} } });
function adoptRemote(state, rev) {
  S = Object.assign(fresh(), state || {});
  if (Array.isArray(S.chat)) S.chat = S.chat.filter((m) => !m.pending);
  AUTH.rev = rev; saveAuth(); _localSave();
}
async function pullNow() {
  if (!loggedIn()) return;
  const r = await api("pull", { token: AUTH.token, rev: AUTH.rev ?? null });
  if (r.error === "bad_token") { sessionLost(); return; }
  if (r.error || r.same) { if (!r.error) { SYNC.state = "ok"; SYNC.at = Date.now(); } return; }
  if (r.state && r.state.me && r.rev > (AUTH.rev || 0)) { adoptRemote(r.state, r.rev); SYNC.state = "ok"; SYNC.at = Date.now(); if (!stackLayers.length) render({ keepScroll: true }); }
  else if (S.me && !(r.state && r.state.me)) pushNow();
}
function sessionLost() {
  AUTH = {}; saveAuth(); SYNC.state = "idle";
  toast(T("Tu sesión ha caducado. Vuelve a entrar.", "Your session expired. Please log in again."), { label: T("Entrar", "Log in"), fn: () => openAccount("login") });
}
function syncLabel() {
  if (!loggedIn()) return T("Solo en este dispositivo", "Only on this device");
  if (SYNC.state === "error") return T("Sin conexión: se guardará al volver", "Offline: will save when back");
  if (SYNC.state === "saving" || SYNC.state === "pending") return T("Guardando…", "Saving…");
  return T("Guardado en tu cuenta", "Saved to your account");
}
const ERRS = {
  bad_email: ["Revisa el email.", "Check the email."], weak_password: ["La contraseña necesita al menos 8 caracteres.", "Password needs at least 8 characters."],
  email_taken: ["Ya hay una cuenta con ese email. Entra en vez de crear otra.", "There's already an account with that email. Log in instead."],
  bad_login: ["Email o contraseña incorrectos.", "Wrong email or password."], bad_recovery: ["El código de recuperación no es correcto.", "That recovery code isn't right."],
  rate_limited: ["Demasiados intentos. Espera unos minutos.", "Too many attempts. Wait a few minutes."], network: ["Sin conexión. Inténtalo de nuevo.", "No connection. Try again."], timeout: ["Está tardando demasiado. Inténtalo de nuevo.", "It's taking too long. Try again."],
};
const errText = (e) => { const x = ERRS[e] || ["Algo ha fallado. Inténtalo de nuevo.", "Something went wrong. Try again."]; return T(x[0], x[1]); };

let ACC = null;
function openAccount(mode = "signup") {
  ACC = { mode, err: "", busy: false, email: AUTH.email || ACC?.email || "" };
  closeAll(); openLayer(accountHTML(), { label: T("Cuenta", "Account") });
}
function accountHTML() {
  const m = ACC.mode;
  const title = { signup: T("Guarda tu Persohna", "Save your Persohna"), login: T("Entrar", "Log in"), reset: T("Recuperar acceso", "Recover access"), code: T("Guarda este código", "Keep this code") }[m];
  if (m === "code") {
    return `${sheetHead(title)}<div class="sheet-body stack g4"><p>${T("Es tu <strong>código de recuperación</strong>. Si olvidas la contraseña, con él entras de nuevo. Haz una captura o guárdalo en tus notas.", "This is your <strong>recovery code</strong>. If you forget your password, it gets you back in. Screenshot it or keep it in your notes.")}</p>
      <div class="code-box" id="rec-code">${esc(ACC.recovery)}</div>
      <button class="btn btn-secondary" type="button" data-action="copy-text" data-t="${esc(ACC.recovery)}">${T("Copiar código", "Copy code")}</button>
      <p class="hint">${T("No te lo volveremos a mostrar.", "We won't show it again.")}</p></div>
      <div class="sheet-foot"><button class="btn btn-primary" type="button" data-action="close">${T("Ya lo he guardado", "I've saved it")}</button></div>`;
  }
  const email = `<div class="field"><label for="acc-email">Email</label><input class="input" id="acc-email" type="email" autocomplete="email" inputmode="email" value="${esc(ACC.email)}" required></div>`;
  const pass = `<div class="field"><label for="acc-pass">${m === "reset" ? T("Nueva contraseña", "New password") : T("Contraseña", "Password")}</label><div class="pw-wrap"><input class="input" id="acc-pass" type="password" autocomplete="${m === "login" ? "current-password" : "new-password"}" minlength="8" required><button class="btn btn-ghost btn-sm pw-eye" type="button" data-action="pw-toggle">${T("Ver", "Show")}</button></div>${m !== "login" ? `<p class="hint">${T("Mínimo 8 caracteres.", "At least 8 characters.")}</p>` : ""}</div>`;
  const rec = m === "reset" ? `<div class="field"><label for="acc-rec">${T("Código de recuperación", "Recovery code")}</label><input class="input" id="acc-rec" autocomplete="off" placeholder="sol-luna-mar-faro-42" required></div>` : "";
  const lead = m === "signup" ? `<p class="muted">${S.me ? T("Ahora mismo tu Persohna vive solo en este navegador. Con una cuenta la recuperas en cualquier móvil u ordenador.", "Right now your Persohna lives only in this browser. With an account you get it back on any phone or computer.") : T("Crea tu cuenta para guardar tu Persohna.", "Create your account to save your Persohna.")}</p>`
    : m === "login" ? `<p class="muted">${T("Entra para recuperar tu Persohna, tus objetivos y tu CV.", "Log in to get back your Persohna, goals and CV.")}</p>`
    : `<p class="muted">${T("Usa el código que te dimos al crear la cuenta.", "Use the code we gave you when you created your account.")}</p>`;
  const links = m === "signup" ? `<button class="btn btn-ghost btn-sm" type="button" data-action="acc-mode" data-v="login">${T("Ya tengo cuenta", "I already have an account")}</button>`
    : m === "login" ? `<div class="row g2 wrap"><button class="btn btn-ghost btn-sm" type="button" data-action="acc-mode" data-v="reset">${T("He olvidado la contraseña", "Forgot password")}</button>${S.me ? "" : `<a class="btn btn-ghost btn-sm" href="#/empezar" data-action="close">${T("Crear una Persohna nueva", "Create a new Persohna")}</a>`}</div>`
    : `<button class="btn btn-ghost btn-sm" type="button" data-action="acc-mode" data-v="login">${T("Volver a entrar", "Back to log in")}</button>`;
  return `${sheetHead(title)}<form class="sheet-body stack g4" data-form="account" novalidate>${lead}${email}${rec}${pass}
    ${ACC.err ? `<p class="err" role="alert">${esc(ACC.err)}</p>` : ""}${links}</form>
    <div class="sheet-foot"><button class="btn btn-primary" type="button" data-action="acc-submit" ${ACC.busy ? "disabled" : ""}>${ACC.busy ? T("Un momento…", "One moment…") : m === "signup" ? T("Crear cuenta", "Create account") : m === "login" ? T("Entrar", "Log in") : T("Cambiar contraseña", "Change password")}</button></div>`;
}
async function accountSubmit() {
  const email = $("#acc-email")?.value.trim() || "", password = $("#acc-pass")?.value || "", recovery = $("#acc-rec")?.value.trim() || "";
  ACC.email = email; ACC.err = "";
  if (!/^\S+@\S+\.\S+$/.test(email)) { ACC.err = errText("bad_email"); setLayer(accountHTML()); return; }
  if (password.length < 8) { ACC.err = errText(ACC.mode === "login" ? "bad_login" : "weak_password"); setLayer(accountHTML()); return; }
  ACC.busy = true; setLayer(accountHTML());
  const m = ACC.mode;
  const r = m === "signup" ? await api("signup", { email, password, name: S.me?.name || "", state: S.me ? syncableState() : null })
    : m === "login" ? await api("login", { email, password }) : await api("reset", { email, password, recovery });
  ACC.busy = false;
  if (r.error) { ACC.err = errText(r.error); setLayer(accountHTML()); return; }
  AUTH = { token: r.token, email: r.email, rev: r.rev || 0 }; saveAuth(); SYNC.state = "ok"; SYNC.at = Date.now();
  if (m !== "signup") {
    if (r.state && r.state.me) { adoptRemote(r.state, r.rev); toast(T(`Hola de nuevo, ${S.me.name}`, `Welcome back, ${S.me.name}`)); }
    else if (S.me) pushNow();
  }
  if (r.recovery) { ACC.mode = "code"; ACC.recovery = r.recovery; setLayer(accountHTML()); }
  else closeAll();
  if (!S.me) { ui.onb = { step: 0, cat: null, data: {}, face: randomFace(), name: "", err: "" }; location.hash = "#/empezar"; }
  else if (ui.route === "empezar" || ui.route === "publico") location.hash = "#/inicio";
  render({ keepScroll: true });
}
async function logout() {
  const ok = await confirmDialog({ title: T("Cerrar sesión", "Log out"), text: T("Tu Persohna queda guardada en tu cuenta y se borra de este dispositivo.", "Your Persohna stays in your account and is removed from this device."), ok: T("Cerrar sesión", "Log out") });
  if (!ok) return;
  if (SYNC.state === "pending") { clearTimeout(pushT); await pushNow(); }
  api("logout", { token: AUTH.token });
  AUTH = {}; saveAuth();
  try { localStorage.removeItem(KEY); } catch {}
  S = fresh(); ui.seg = "objetivos"; location.hash = "#/inicio"; onRoute(); toast(T("Sesión cerrada", "Logged out"));
}
async function deleteAccount() {
  const ok = await confirmDialog({ title: T("Borrar mi cuenta", "Delete my account"), text: T("Se borrarán tu cuenta y todos tus datos de nuestros servidores y de este dispositivo. No se puede deshacer.", "Your account and all your data will be deleted from our servers and this device. This can't be undone."), ok: T("Borrar para siempre", "Delete forever"), danger: true });
  if (!ok) return;
  const r = await api("delete_account", { token: AUTH.token });
  if (r.error && r.error !== "bad_token") { toast(errText(r.error)); return; }
  AUTH = {}; saveAuth(); try { localStorage.removeItem(KEY); } catch {}
  S = fresh(); location.hash = "#/inicio"; onRoute(); toast(T("Cuenta borrada", "Account deleted"));
}
function accountCard(compact = false) {
  if (loggedIn()) return "";
  return `<section class="card save-card stack g3" aria-labelledby="sv-t"><div class="row g3"><img src="/icons/tramites.webp" alt="" width="56" height="56"><div class="grow"><h2 class="h-card" id="sv-t">${T("Guarda tu Persohna", "Save your Persohna")}</h2><p class="muted small">${T("Ahora solo vive en este navegador. Crea tu cuenta y entra desde cualquier dispositivo.", "Right now it only lives in this browser. Create an account and log in from any device.")}</p></div></div>
    <div class="row g2 wrap"><button class="btn btn-primary" type="button" data-action="account" data-v="signup">${T("Crear cuenta", "Create account")}</button>${compact ? "" : `<button class="btn btn-ghost" type="button" data-action="account" data-v="login">${T("Ya tengo cuenta", "I have an account")}</button>`}</div></section>`;
}
function accountSection() {
  return `<section class="card stack g3" aria-labelledby="acc-t"><h2 class="section-title" id="acc-t">${T("Cuenta", "Account")}</h2>
    ${loggedIn() ? `<p><strong>${esc(AUTH.email)}</strong></p><p class="muted small" id="sync-status">${syncLabel()}</p>
      <div class="row g2 wrap"><button class="btn btn-secondary" type="button" data-action="logout">${T("Cerrar sesión", "Log out")}</button><button class="btn btn-ghost" type="button" data-action="delete-account" style="color:var(--danger)">${T("Borrar mi cuenta", "Delete my account")}</button></div>`
      : `<p class="muted small">${T("Sin cuenta, tu Persohna se guarda solo en este navegador: si lo borras o cambias de móvil, se pierde.", "Without an account your Persohna is stored only in this browser: clear it or switch phones and it's gone.")}</p>
      <div class="row g2 wrap"><button class="btn btn-primary" type="button" data-action="account" data-v="signup">${T("Crear cuenta", "Create account")}</button><button class="btn btn-secondary" type="button" data-action="account" data-v="login">${T("Entrar", "Log in")}</button></div>`}
  </section>`;
}

// ---------- CV ----------
function loadScript(src) { return new Promise((res, rej) => { if (document.querySelector(`script[src="${src}"]`)) return res(); const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
async function fileToText(file) {
  const name = file.name.toLowerCase();
  if (file.size > 8e6) throw new Error("big");
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
    const lib = window.pdfjsLib; lib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise;
    let out = "";
    for (let i = 1; i <= Math.min(pdf.numPages, 15); i++) {
      const c = await (await pdf.getPage(i)).getTextContent();
      let line = "", lastY = null;
      for (const it of c.items) { const y = it.transform?.[5]; if (lastY !== null && Math.abs(y - lastY) > 2) { out += line.trim() + "\n"; line = ""; } line += it.str + (it.hasEOL ? "\n" : " "); lastY = y; }
      out += line.trim() + "\n\n";
    }
    return out.replace(/\n{3,}/g, "\n\n").trim();
  }
  if (name.endsWith(".docx")) {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js");
    const r = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return (r.value || "").replace(/\n{3,}/g, "\n\n").trim();
  }
  if (/\.(txt|md|rtf|csv)$/.test(name) || file.type.startsWith("text/")) return (await file.text()).trim();
  throw new Error("type");
}
let CVS = null;
function openCV(tab = null) {
  CVS = { tab: tab || (S.cv?.text ? "review" : "edit"), busy: false, err: "", job: "", result: "" };
  closeAll(); openLayer(cvHTML(), { full: true, label: T("Tu CV", "Your CV") });
}
function cvHTML() {
  const cv = S.cv || {};
  const tabs = `<div class="seg seg-sm" role="tablist">${[["edit", T("Mi CV", "My CV")], ["review", T("Análisis", "Review")], ["tailor", T("Adaptar a oferta", "Tailor to a job")]].map(([k, l]) => `<button role="tab" type="button" aria-selected="${CVS.tab === k}" data-action="cv-tab" data-v="${k}" ${k !== "edit" && !cv.text ? "disabled" : ""}>${l}</button>`).join("")}</div>`;
  let body = "", foot = "";
  const err = CVS.err ? `<p class="err" role="alert">${esc(CVS.err)}</p>` : "";
  if (CVS.tab === "edit") {
    body = `<div class="stack g4"><p class="muted">${T("Sube tu CV (PDF, Word o texto) o pégalo. Tu Persohna lo usará para analizarlo, adaptarlo a cada oferta y prepararte las entrevistas.", "Upload your CV (PDF, Word or text) or paste it. Your Persohna will use it to review it, tailor it to each job and prep your interviews.")}</p>
      <label class="btn btn-secondary file-btn">${ico("download", "rot180")}${T("Subir archivo", "Upload file")}<input type="file" id="cv-file" accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" hidden></label>
      <div class="field"><label for="cv-text">${T("O pégalo aquí", "Or paste it here")}</label><textarea class="textarea cv-area" id="cv-text" maxlength="40000" placeholder="${T("Pega aquí el texto de tu CV o de tu perfil de LinkedIn", "Paste your CV or LinkedIn profile text here")}">${esc(cv.text || "")}</textarea><p class="hint" id="cv-count">${(cv.text || "").length} ${T("caracteres", "characters")}${cv.name ? " · " + esc(cv.name) : ""}</p></div>
      ${err}<div class="note">${ico("lock")}<span>${T("Tu CV es privado. Solo se usa para ayudarte y nunca se publica.", "Your CV is private. It's only used to help you and is never published.")}</span></div></div>`;
    foot = `${cv.text ? `<button class="btn btn-ghost" type="button" data-action="cv-delete" style="color:var(--danger);flex:0 0 auto">${ico("trash")}</button>` : ""}<button class="btn btn-primary" type="button" data-action="cv-save" ${CVS.busy ? "disabled" : ""}>${CVS.busy ? T("Analizando… (hasta 1 min)", "Reviewing… (up to 1 min)") : T("Guardar y analizar", "Save and review")}</button>`;
  } else if (CVS.tab === "review") {
    body = cv.review ? `<div class="stack g3"><div class="ai-out">${md(cv.review)}</div><p class="hint">${T("Análisis hecho por IA el", "AI review from")} ${fmtDate(cv.reviewAt || cv.at)}. ${T("Revísalo: puede equivocarse.", "Double-check it: it can be wrong.")}</p>${err}</div>`
      : `<div class="empty"><p><strong>${T("Aún sin analizar.", "Not reviewed yet.")}</strong></p>${err}</div>`;
    foot = `<button class="btn btn-secondary" type="button" data-action="cv-review" ${CVS.busy ? "disabled" : ""}>${CVS.busy ? T("Analizando…", "Reviewing…") : T("Volver a analizar", "Review again")}</button><button class="btn btn-primary" type="button" data-action="cv-tab" data-v="tailor">${T("Adaptar a una oferta", "Tailor to a job")}</button>`;
  } else {
    const apps = cv.apps || [];
    body = `<div class="stack g4"><p class="muted">${T("Pega una oferta de empleo (el texto del anuncio). Te digo cuánto encajas, qué destacar y te escribo la carta.", "Paste a job ad. I'll tell you how well you fit, what to highlight and write the cover letter.")}</p>
      <div class="field"><label for="cv-job">${T("Texto de la oferta", "Job ad text")}</label><textarea class="textarea" id="cv-job" maxlength="15000" placeholder="${T("Pega aquí la oferta: puesto, empresa, requisitos…", "Paste the job ad: role, company, requirements…")}">${esc(CVS.job)}</textarea></div>${err}
      ${CVS.result ? `<div class="ai-out">${md(CVS.result)}</div><button class="btn btn-secondary" type="button" data-action="copy-text" data-t="${esc(CVS.result)}">${T("Copiar todo", "Copy all")}</button>` : ""}
      ${apps.length && !CVS.result ? `<div class="stack g2"><div class="section-title">${T("Ofertas anteriores", "Previous jobs")}</div>${apps.slice(0, 6).map((a, i) => `<button class="goal-row" type="button" data-action="cv-app" data-i="${i}"><span class="grow stack g1"><strong>${esc(a.title)}</strong><span class="post-meta">${fmtDate(a.at)}</span></span>${ico("chev", "chev")}</button>`).join("")}</div>` : ""}</div>`;
    foot = `<button class="btn btn-primary" type="button" data-action="cv-tailor" ${CVS.busy ? "disabled" : ""}>${CVS.busy ? T("Preparando… (hasta 1 min)", "Working… (up to 1 min)") : CVS.result ? T("Otra oferta", "Another job") : T("Adaptar mi CV", "Tailor my CV")}</button>`;
  }
  return `${sheetHead(T("Tu CV", "Your CV"))}<div class="sheet-body stack g4">${tabs}${body}</div><div class="sheet-foot">${foot}</div>`;
}
async function cvReview() {
  const cv = S.cv; if (!cv?.text) return;
  CVS.busy = true; CVS.err = ""; CVS.tab = "review"; setLayer(cvHTML());
  const r = await askAI("cv_review", [{ role: "user", content: cv.text }], { cv: undefined });
  CVS.busy = false;
  if (r.error) { CVS.err = r.error === "rate_limited" ? T("Has hecho muchas peticiones seguidas. Prueba en un rato.", "Too many requests in a row. Try again later.") : T("No he podido analizarlo ahora. Inténtalo de nuevo.", "Couldn't review it right now. Try again."); }
  else { cv.review = r.text; cv.reviewAt = today(); addHistory("Tu Persohna analizó tu CV", "Your Persohna reviewed your CV"); markCVStep(); save(); }
  if (topLayer()) setLayer(cvHTML());
}
async function cvTailor() {
  if (CVS.result) { CVS.result = ""; CVS.job = ""; setLayer(cvHTML()); $("#cv-job")?.focus(); return; }
  const job = $("#cv-job")?.value.trim() || ""; CVS.job = job;
  if (job.length < 80) { CVS.err = T("Pega el texto completo de la oferta (al menos unas líneas).", "Paste the full job ad (at least a few lines)."); setLayer(cvHTML()); return; }
  CVS.busy = true; CVS.err = ""; setLayer(cvHTML());
  const r = await askAI("cv_tailor", [{ role: "user", content: `MI CV:\n${S.cv.text}\n\n---\nOFERTA:\n${job}` }], { cv: undefined });
  CVS.busy = false;
  if (r.error) CVS.err = T("No he podido prepararlo ahora. Inténtalo de nuevo.", "Couldn't do it right now. Try again.");
  else {
    CVS.result = r.text;
    const title = job.split("\n").map((s) => s.trim()).find((s) => s.length > 3)?.slice(0, 70) || T("Oferta", "Job");
    S.cv.apps = [{ title, at: today(), job: job.slice(0, 4000), result: r.text }, ...(S.cv.apps || [])].slice(0, 20);
    addHistory(`Adaptaste tu CV a: ${title}`, `You tailored your CV to: ${title}`); S.xp += 5; save();
  }
  if (topLayer()) setLayer(cvHTML());
}
function markCVStep() {
  S.goals.filter((g) => g.cat === "trabajo" && !g.done && !g.plan).forEach((g) => { g.steps = g.steps || []; g.steps[1] = true; });
}

// ---------- Plan a medida con IA ----------
planOf = function (g) { return g.plan?.length ? g.plan : g.cat === "otro" ? [] : L(CATS[g.cat].plan); };
planDone = function (g) {
  const steps = planOf(g); const d = g.steps || [];
  if (g.plan?.length) return steps.map((_, i) => !!d[i]);
  return steps.map((_, i) => i === 0 ? (goalStatus(g) !== "needs" || !!d[0]) : !!d[i]);
};
goalStatus = function (g) {
  if (g.done) return "done";
  if (g.cat === "otro") return g.title ? "ready" : "needs";
  const req = CATS[g.cat].fields.filter((f) => f.req);
  return req.every((f) => String(g.prefs?.[f.k] ?? "").trim()) ? "ready" : "needs";
};
async function aiPlan(g, { quiet = false } = {}) {
  if (!g || g.planBusy) return;
  g.planBusy = true; if (!quiet && topLayer()) setLayer(goalHTML(g));
  const cat = CATS[g.cat];
  const prefs = cat ? cat.fields.map((f) => `${L(f.label)}: ${showVal(f, g.prefs?.[f.k]) || "-"}`).join("\n") : "";
  const r = await askAI("plan", [{ role: "user", content: `${T("Objetivo", "Goal")}: ${g.title}\n${T("Tema", "Topic")}: ${cat ? L(cat.label) : T("Otro", "Other")}\n${prefs}\n${g.notes ? T("Notas", "Notes") + ": " + g.notes : ""}` }]);
  delete g.planBusy;
  let ok = false;
  if (!r.error) {
    try {
      const j = JSON.parse(r.text.slice(r.text.indexOf("{"), r.text.lastIndexOf("}") + 1));
      const steps = (j.steps || []).map((s) => String(s).trim()).filter(Boolean).slice(0, 7);
      if (steps.length >= 3) { g.plan = steps; g.tip = String(j.tip || "").slice(0, 300); g.steps = []; ok = true; }
    } catch {}
  }
  if (ok) { notify(`Plan a medida listo: «${g.title}»`, `Tailored plan ready: “${g.title}”`, g.id); save(); }
  else if (!quiet) toast(T("No he podido crear el plan ahora. Inténtalo de nuevo.", "Couldn't build the plan right now. Try again."));
  if (stackLayers.length && topLayer()?.querySelector(`[data-goal="${g.id}"]`)) setLayer(goalHTML(g));
  render({ keepScroll: true });
}
const _createGoal = createGoal;
createGoal = function (cat, data, from) { const g = _createGoal(cat, data, from); setTimeout(() => aiPlan(g, { quiet: true }), 400); return g; };

// ---------- Eventos de este módulo ----------
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-action]"); if (!b) return;
  const a = b.dataset.action;
  switch (a) {
    case "account": e.preventDefault(); openAccount(b.dataset.v || "signup"); break;
    case "acc-mode": ACC.email = $("#acc-email")?.value.trim() || ACC.email; ACC.mode = b.dataset.v; ACC.err = ""; setLayer(accountHTML()); break;
    case "acc-submit": accountSubmit(); break;
    case "pw-toggle": { const i = $("#acc-pass"); if (i) { i.type = i.type === "password" ? "text" : "password"; b.textContent = i.type === "password" ? T("Ver", "Show") : T("Ocultar", "Hide"); } break; }
    case "logout": logout(); break;
    case "delete-account": deleteAccount(); break;
    case "copy-text": { try { await navigator.clipboard.writeText(b.dataset.t); toast(T("Copiado", "Copied")); } catch { window.prompt(T("Copia el texto:", "Copy the text:"), b.dataset.t); } break; }
    case "copy-msg": { const m = S.chat[+b.dataset.i]; if (m) { try { await navigator.clipboard.writeText(m.text ?? L(m)); toast(T("Copiado", "Copied")); } catch {} } break; }
    case "chat-clear": { const ok = await confirmDialog({ title: T("Borrar conversación", "Clear chat"), text: T("Se borrarán los mensajes. Tus objetivos y tu CV se quedan.", "Messages will be deleted. Your goals and CV stay."), ok: T("Borrar", "Clear"), danger: true }); if (ok) { S.chat = []; save(); render({ keepScroll: true }); } break; }
    case "chat-attach": $("#chat-file")?.click(); break;
    case "cv": openCV(b.dataset.v || null); break;
    case "cv-tab": CVS.job = $("#cv-job")?.value ?? CVS.job; if (CVS.tab === "edit") { const t = $("#cv-text")?.value; if (t != null && S.cv) S.cv.text = t.trim() || S.cv.text; } CVS.tab = b.dataset.v; CVS.err = ""; setLayer(cvHTML()); break;
    case "cv-save": {
      const t = ($("#cv-text")?.value || "").trim();
      if (t.length < 200) { CVS.err = T("Parece muy corto. Pega el CV completo o sube el archivo.", "That looks too short. Paste the full CV or upload the file."); setLayer(cvHTML()); return; }
      const changed = t !== S.cv?.text;
      S.cv = { ...(S.cv || {}), text: t, at: today() }; if (changed) { delete S.cv.review; }
      markCVStep(); save();
      if (changed || !S.cv.review) cvReview(); else { CVS.tab = "review"; setLayer(cvHTML()); }
      break;
    }
    case "cv-review": cvReview(); break;
    case "cv-tailor": cvTailor(); break;
    case "cv-app": { const ap = S.cv?.apps?.[+b.dataset.i]; if (ap) { CVS.job = ap.job; CVS.result = ap.result; setLayer(cvHTML()); } break; }
    case "cv-delete": { const ok = await confirmDialog({ title: T("Borrar CV", "Delete CV"), text: T("Se borrará tu CV y sus análisis.", "Your CV and its reviews will be deleted."), ok: T("Borrar", "Delete"), danger: true }); if (ok) { delete S.cv; save(); CVS.tab = "edit"; if (topLayer()) setLayer(cvHTML()); toast(T("CV borrado", "CV deleted")); } break; }
    case "ai-plan": { const g = S.goals.find((x) => x.id === b.dataset.id); if (g) aiPlan(g); break; }
    case "plan-reset": { const g = S.goals.find((x) => x.id === b.dataset.id); if (g) { delete g.plan; delete g.tip; g.steps = []; save(); setLayer(goalHTML(g)); render({ keepScroll: true }); } break; }
  }
});
document.addEventListener("change", async (e) => {
  if (e.target.id === "cv-file" || e.target.id === "chat-file") {
    const f = e.target.files?.[0]; if (!f) return;
    const isChat = e.target.id === "chat-file";
    toast(T("Leyendo el archivo…", "Reading the file…"));
    let text = "";
    try { text = await fileToText(f); } catch (err) {
      const msg = err?.message === "big" ? T("El archivo es demasiado grande (máx. 8 MB).", "File too large (max 8 MB).") : err?.message === "type" ? T("Formato no compatible. Usa PDF, Word (.docx) o texto.", "Unsupported format. Use PDF, Word (.docx) or text.") : T("No he podido leer el archivo. Prueba a pegar el texto.", "Couldn't read the file. Try pasting the text.");
      if (isChat) toast(msg); else { CVS.err = msg; setLayer(cvHTML()); } return;
    }
    if (text.length < 50) { const msg = T("No he encontrado texto (¿es un PDF escaneado?). Pega el texto a mano.", "No text found (scanned PDF?). Paste the text instead."); if (isChat) toast(msg); else { CVS.err = msg; setLayer(cvHTML()); } return; }
    if (isChat) {
      const looksCV = /(experiencia|experience|formaci[oó]n|education|skills|habilidades|curr[ií]cul|cv)/i.test(text);
      if (looksCV && (!S.cv?.text || S.cv.text !== text)) { S.cv = { ...(S.cv || {}), text, name: f.name, at: today() }; delete S.cv.review; markCVStep(); }
      const ta = $("#chat-in");
      if (ta) { ta.value = (looksCV ? T(`Te paso mi CV (${f.name}). Analízalo y dime qué mejorar y qué puestos me encajan.`, `Here's my CV (${f.name}). Review it and tell me what to improve and which roles fit.`) : T(`Te paso un documento (${f.name}):`, `Here's a document (${f.name}):`)) + "\n\n" + text.slice(0, 11000); autoGrow(ta); ta.form.requestSubmit(); }
      save();
    } else {
      const ta = $("#cv-text"); if (ta) { ta.value = text; $("#cv-count").textContent = `${text.length} ${T("caracteres", "characters")} · ${f.name}`; }
      S.cv = { ...(S.cv || {}), name: f.name };
      toast(T("Listo. Revisa el texto y pulsa «Guardar y analizar».", "Done. Check the text and tap “Save and review”."));
    }
    e.target.value = "";
  }
});
function autoGrow(ta) { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 260) + "px"; }
document.addEventListener("input", (e) => {
  if (e.target.id === "chat-in") autoGrow(e.target);
  if (e.target.id === "cv-text") { const c = $("#cv-count"); if (c) c.textContent = `${e.target.value.length} ${T("caracteres", "characters")}`; }
});
document.addEventListener("submit", (e) => { if (e.target.closest('[data-form="account"]')) { e.preventDefault(); accountSubmit(); } }, true);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && loggedIn() && !stackLayers.length) pullNow(); });
if (loggedIn()) setTimeout(pullNow, 300);
if (typeof render === "function" && !stackLayers.length) render({ keepScroll: true });
