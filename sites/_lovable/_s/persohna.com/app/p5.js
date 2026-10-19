"use strict";
// ---------- 10. v4: herramientas, avisos, tema, PWA y arreglos ----------

// Markdown sencillo: títulos, negrita, cursiva, listas y código
md = function (t) {
  return esc(t || "")
    .replace(/^#{1,4}\s*(.+)$/gm, "<strong>$1</strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(«"])[*_](?![\s*_])([^*_\n]{1,200}?)[*_](?=[\s).,;:!?»"]|$)/gm, "$1<em>$2</em>")
    .replace(/^\s*[-*•]\s+/gm, "• ")
    .replace(/`([^`\n]+)`/g, "<code>$1</code>");
};

const JOB_ST = [["saved", "Guardada", "Saved"], ["applied", "Enviada", "Applied"], ["interview", "Entrevista", "Interview"], ["offer", "Oferta", "Offer"], ["closed", "Cerrada", "Closed"]];
const DOC_KINDS = [["factura", "Factura", "Bill"], ["contrato", "Contrato", "Contract"], ["seguro", "Seguro", "Insurance"], ["identidad", "DNI / pasaporte", "ID / passport"], ["carta", "Carta", "Letter"], ["otro", "Otro", "Other"]];
const lbl = (arr, k) => { const x = arr.find((a) => a[0] === k) || arr[arr.length - 1]; return T(x[1], x[2]); };
const daysTo = (d) => { if (!d) return null; const a = new Date(today() + "T00:00:00"), b = new Date(d + "T00:00:00"); return Math.round((b - a) / 864e5); };
const aiErr = (e) => e === "rate_limited" ? T("Has hecho muchas peticiones seguidas. Prueba en un rato.", "Too many requests in a row. Try again later.") : T("No he podido hacerlo ahora. Inténtalo de nuevo.", "Couldn't do it right now. Try again.");

function ensureV4() {
  if (!S || typeof S !== "object") return;
  if (!Array.isArray(S.jobs)) S.jobs = [];
  if (!Array.isArray(S.docs)) S.docs = [];
  // las ofertas adaptadas con el CV pasan al seguimiento de candidaturas
  (S.cv?.apps || []).forEach((a) => { if (!a.jobId) { const j = { id: uid(), title: a.title, company: "", status: "saved", at: a.at || today(), note: "" }; S.jobs.unshift(j); a.jobId = j.id; } });
}
ensureV4();

async function askAI5(...a) { const r = await askAI(...a); return !r.error && !r.text ? { error: "empty" } : r; }

// ---------- Tema claro / oscuro ----------
const THEME_KEY = "persohna.theme";
const getTheme = () => { try { return localStorage.getItem(THEME_KEY) || "auto"; } catch { return "auto"; } };
function applyTheme(v = getTheme()) {
  const r = document.documentElement;
  if (v === "auto") r.removeAttribute("data-theme"); else r.setAttribute("data-theme", v);
  const dark = v === "dark" || (v === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#151815" : "#F8F7F3");
}
applyTheme();
try { window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => applyTheme()); } catch {}

// ---------- Avisos (en la app y, si los activas, en el dispositivo) ----------
const canNotify = () => "Notification" in window;
async function deviceNotify(title, body) {
  if (!canNotify() || Notification.permission !== "granted") return;
  try { const reg = await navigator.serviceWorker?.getRegistration(); if (reg) { reg.showNotification(title, { body, icon: "/icon-192.png", badge: "/icon-192.png", tag: title }); return; } } catch {}
  try { new Notification(title, { body, icon: "/icon-192.png" }); } catch {}
}
function checkReminders() {
  if (!S?.me) return;
  ensureV4();
  let changed = false;
  S.goals.forEach((g) => {
    if (g.done || !g.due || g.dueNotified === g.due) return;
    const d = daysTo(g.due); if (d > 1) return;
    g.dueNotified = g.due; changed = true;
    const es = d < 0 ? `Se pasó la fecha de «${g.title}». ¿Lo reprogramamos?` : d === 0 ? `Hoy es el día para «${g.title}».` : `Mañana es la fecha de «${g.title}».`;
    const en = d < 0 ? `“${g.title}” is past its date. Reschedule?` : d === 0 ? `Today is the day for “${g.title}”.` : `“${g.title}” is due tomorrow.`;
    notify(es, en, g.id); deviceNotify("Persohna", T(es, en));
  });
  S.docs.forEach((x) => {
    if (!x.expires || x.notified === x.expires) return;
    const d = daysTo(x.expires); if (d > 30) return;
    x.notified = x.expires; changed = true;
    const es = d < 0 ? `«${x.name}» caducó el ${fmtDate(x.expires)}.` : `«${x.name}» caduca en ${d} día${d === 1 ? "" : "s"} (${fmtDate(x.expires)}).`;
    const en = d < 0 ? `“${x.name}” expired on ${fmtDate(x.expires)}.` : `“${x.name}” expires in ${d} day${d === 1 ? "" : "s"} (${fmtDate(x.expires)}).`;
    notify(es, en); deviceNotify("Persohna", T(es, en));
  });
  if (changed) { save(); renderNav?.(); }
}

// ---------- PWA ----------
let installEvt = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; if (ui.route === "perfil" && !stackLayers.length) render({ keepScroll: true }); });
if ("serviceWorker" in navigator && location.protocol === "https:") window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

// ---------- Imprimir / PDF ----------
function printDoc(title, text) {
  const w = window.open("", "_blank");
  if (!w) { toast(T("Permite las ventanas emergentes para descargar el PDF.", "Allow pop-ups to download the PDF.")); return; }
  w.document.write(`<!doctype html><html lang="${LANG}"><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font:15px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#222;max-width:720px;margin:32px auto;padding:0 24px;white-space:pre-wrap}h1{font-size:22px;white-space:normal}footer{margin-top:32px;color:#777;font-size:12px;white-space:normal}@media print{body{margin:0 auto}}</style></head><body><h1>${esc(title)}</h1>${md(text)}<footer>Persohna · ${fmtDate(today())}</footer><script>setTimeout(function(){print()},300)<\/script></body></html>`);
  w.document.close();
}
const pdfBtn = (src, extra = "") => `<button class="btn btn-secondary" type="button" data-action="print-ai" data-src="${src}" ${extra}>${ico("download")}${T("Descargar PDF", "Download PDF")}</button>`;

// ---------- Imagen para compartir un logro ----------
function loadImg(src) { return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }
async function achievementImage(g) {
  const c = document.createElement("canvas"); c.width = 1080; c.height = 1080;
  const x = c.getContext("2d");
  const grd = x.createLinearGradient(0, 0, 0, 1080); grd.addColorStop(0, "#F8F7F3"); grd.addColorStop(1, "#DEE8D8");
  x.fillStyle = grd; x.fillRect(0, 0, 1080, 1080);
  const icon = await loadImg(iconSrc(g.cat)); if (icon) x.drawImage(icon, 390, 150, 300, 300);
  x.fillStyle = "#254D40"; x.textAlign = "center"; x.font = "800 44px 'Plus Jakarta Sans', system-ui, sans-serif";
  x.fillText(T("¡CONSEGUIDO!", "ACHIEVED!"), 540, 540);
  x.fillStyle = "#222520"; x.font = "800 64px 'Plus Jakarta Sans', system-ui, sans-serif";
  const words = String(g.title).split(/\s+/); const lines = []; let line = "";
  words.forEach((w) => { const t = line ? line + " " + w : w; if (x.measureText(t).width > 900 && line) { lines.push(line); line = w; } else line = t; });
  if (line) lines.push(line);
  lines.slice(0, 4).forEach((l, i) => x.fillText(l, 540, 640 + i * 80));
  x.fillStyle = "#64695F"; x.font = "600 34px 'Plus Jakarta Sans', system-ui, sans-serif";
  x.fillText(T(`${S.me?.name || ""} y su Persohna · persohna.com`, `${S.me?.name || ""} and their Persohna · persohna.com`), 540, 990);
  const blob = await new Promise((r) => c.toBlob(r, "image/png"));
  const file = new File([blob], "persohna-logro.png", { type: "image/png" });
  try { if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text: T(`¡Conseguido: ${g.title}! #Persohna`, `Achieved: ${g.title}! #Persohna`) }); return; } } catch (e) { if (e?.name === "AbortError") return; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "persohna-logro.png"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  toast(T("Imagen descargada", "Image downloaded"));
}

// ---------- Autonomía: en «pedirme permiso», los planes automáticos llegan como propuesta ----------
const _aiPlan4 = aiPlan;
aiPlan = async function (g, opts = {}) {
  if (!g) return;
  if (!opts.quiet || S.autonomy === "notify") return _aiPlan4(g, opts);
  const keep = { plan: g.plan, tip: g.tip, steps: g.steps };
  await _aiPlan4(g, opts);
  if (g.plan && g.plan !== keep.plan) {
    g.proposal = { plan: g.plan, tip: g.tip, at: today() };
    if (keep.plan) g.plan = keep.plan; else delete g.plan;
    if (keep.tip) g.tip = keep.tip; else delete g.tip;
    g.steps = keep.steps || [];
    const n = S.inbox[0]; if (n && n.link === g.id) { n.es = `Tu Persohna te propone un plan a medida para «${g.title}». Revísalo y acéptalo si te sirve.`; n.en = `Your Persohna suggests a tailored plan for “${g.title}”. Review it and accept it if it helps.`; }
    save(); renderNav(); if (!stackLayers.length) render({ keepScroll: true }); else if (topLayer()?.querySelector(`[data-goal="${g.id}"]`)) setLayer(goalHTML(g));
  }
};

// ---------- Detalle de objetivo: propuesta, editar pasos, fecha y logro ----------
const _goalHTML4 = goalHTML;
goalHTML = function (g) {
  let h = _goalHTML4(g);
  const head = '<div class="stack g2"><div class="row between"><div class="section-title">';
  if (g.proposal && !g.done) {
    const p = `<div class="card proposal stack g3"><div class="row g2">${ico("sparkle")}<strong>${T("Propuesta de plan a medida", "Suggested tailored plan")}</strong></div><ol class="prop-list">${g.proposal.plan.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>${g.proposal.tip ? `<p class="muted small">${esc(g.proposal.tip)}</p>` : ""}<div class="row g2 wrap"><button class="btn btn-primary btn-sm" type="button" data-action="prop-accept" data-id="${g.id}">${ico("check")}${T("Usar este plan", "Use this plan")}</button><button class="btn btn-ghost btn-sm" type="button" data-action="prop-reject" data-id="${g.id}">${T("Descartar", "Dismiss")}</button></div><p class="hint">${T("Te la enseño porque elegiste «Pedirme permiso siempre».", "Shown because you chose “Always ask me”.")}</p></div>`;
    h = h.replace(head, p + head);
  }
  if (ui.planEdit === g.id) {
    const ed = `<div class="field"><label for="plan-ed">${T("Un paso por línea", "One step per line")}</label><textarea class="textarea" id="plan-ed" rows="7" maxlength="1500">${esc(planOf(g).join("\n"))}</textarea><div class="row g2"><button class="btn btn-primary btn-sm" type="button" data-action="plan-save" data-id="${g.id}">${T("Guardar pasos", "Save steps")}</button><button class="btn btn-ghost btn-sm" type="button" data-action="plan-cancel" data-id="${g.id}">${T("Cancelar", "Cancel")}</button></div></div>`;
    h = h.replace(/<ul class="plan">[\s\S]*?<\/ul>/, ed).replace(/<p class="muted small">[^<]*(Plan a medida con IA|Tailored plan with AI)[^<]*<\/p>/, ed);
  }
  const extra = [];
  if (!g.done && ui.planEdit !== g.id) extra.push(`<button class="link-btn small" type="button" data-action="plan-edit" data-id="${g.id}" style="align-self:flex-start">${ico("edit")} ${T("Editar los pasos a mano", "Edit the steps yourself")}</button>`);
  if (!g.done) {
    const d = daysTo(g.due);
    extra.push(`<div class="field"><label for="g-due">${T("Fecha límite o recordatorio", "Deadline or reminder")}</label><div class="row g2"><input class="input grow" type="date" id="g-due" data-id="${g.id}" value="${esc(g.due || "")}" min="${today()}">${g.due ? `<button class="btn btn-ghost btn-sm" type="button" data-action="due-clear" data-id="${g.id}">${T("Quitar", "Clear")}</button>` : ""}</div><p class="hint">${g.due ? (d < 0 ? T("La fecha ya pasó.", "The date has passed.") : d === 0 ? T("Es hoy.", "It's today.") : d === 1 ? T("Es mañana. Ya te he avisado.", "It's tomorrow. I've reminded you.") : T(`Faltan ${d} días. Te avisaré el día antes.`, `${d} days left. I'll remind you the day before.`)) : T("Te aviso en la app (y en el móvil si activas los avisos en Perfil).", "I'll remind you in the app (and on your phone if you turn on alerts in Profile).")}</p></div>`);
  }
  if (g.done) extra.push(`<button class="btn btn-secondary" type="button" data-action="ach-img" data-id="${g.id}">${ico("share")}${T("Crear imagen del logro", "Create achievement image")}</button>`);
  if (g.cat === "trabajo" && !g.done) extra.push(`<div class="row g2 wrap"><button class="btn btn-secondary btn-sm" type="button" data-action="tool" data-v="interview">${T("Simular entrevista", "Practice interview")}</button><button class="btn btn-secondary btn-sm" type="button" data-action="tool" data-v="jobs">${T("Mis candidaturas", "My applications")}</button></div>`);
  if (["ahorro", "dinero", "vivienda", "tramites", "compras", "transporte"].includes(g.cat) && !g.done) extra.push(`<div class="row g2 wrap"><button class="btn btn-secondary btn-sm" type="button" data-action="tool" data-v="doc">${T("Analizar una factura o contrato", "Analyse a bill or contract")}</button><button class="btn btn-secondary btn-sm" type="button" data-action="tool" data-v="negotiate">${T("Mensaje para negociar", "Negotiation message")}</button></div>`);
  const cut = h.lastIndexOf('</div><div class="sheet-foot"');
  if (cut > 0 && extra.length) h = h.slice(0, cut) + extra.join("") + h.slice(cut);
  return h;
};

// ---------- Inicio: «Hoy», herramientas e invitación honesta ----------
function todayCard() {
  ensureV4();
  const items = [];
  S.goals.filter((g) => !g.done).slice(0, 4).forEach((g) => {
    const steps = planOf(g), done = planDone(g), i = done.findIndex((d) => !d);
    if (g.proposal) items.push(`<li><span class="grow"><strong>${esc(g.title)}</strong><br><span class="muted small">${T("Tienes un plan a medida para revisar", "You have a tailored plan to review")}</span></span><button class="btn btn-secondary btn-sm" type="button" data-action="open-goal" data-id="${g.id}">${T("Ver", "View")}</button></li>`);
    else if (i >= 0 && goalStatus(g) !== "needs") items.push(`<li><span class="grow"><span class="muted small">${esc(g.title)}</span><br>${esc(steps[i])}</span><button class="btn btn-secondary btn-sm" type="button" data-action="step" data-id="${g.id}" data-i="${i}" aria-label="${T("Marcar hecho", "Mark done")}">${ico("check")}</button></li>`);
    const d = daysTo(g.due); if (g.due && d <= 3) items.push(`<li><span class="grow">${ico("bell", "i16")} ${esc(g.title)} · <span class="${d < 0 ? "danger-t" : ""}">${d < 0 ? T("fecha pasada", "past due") : d === 0 ? T("es hoy", "today") : d === 1 ? T("mañana", "tomorrow") : T(`en ${d} días`, `in ${d} days`)}</span></span></li>`);
  });
  S.docs.filter((x) => x.expires && daysTo(x.expires) <= 30).slice(0, 3).forEach((x) => { const d = daysTo(x.expires); items.push(`<li><span class="grow">${ico("lock", "i16")} ${esc(x.name)} · <span class="${d < 0 ? "danger-t" : ""}">${d < 0 ? T("caducado", "expired") : (d === 1 ? T("caduca mañana", "expires tomorrow") : T(`caduca en ${d} días`, `expires in ${d} days`))}</span></span><button class="btn btn-ghost btn-sm" type="button" data-action="tool" data-v="vault">${T("Ver", "View")}</button></li>`); });
  S.jobs.filter((j) => j.status === "interview").slice(0, 2).forEach((j) => items.push(`<li><span class="grow">${esc(j.title)}${j.company ? " · " + esc(j.company) : ""}<br><span class="muted small">${T("Tienes entrevista: practica antes", "You have an interview: practise first")}</span></span><button class="btn btn-secondary btn-sm" type="button" data-action="iv-for" data-id="${j.id}">${T("Practicar", "Practise")}</button></li>`));
  if (!items.length) return "";
  return `<section class="card stack g3 today" aria-labelledby="today-t"><h2 class="section-title" id="today-t">${T("Hoy", "Today")} · ${fmtDate(today())}</h2><ul class="today-list">${items.slice(0, 6).join("")}</ul></section>`;
}
const TOOLS = () => [
  ["interview", "trabajo", T("Simular entrevista", "Practice interview"), T("Preguntas reales y feedback", "Real questions and feedback")],
  ["jobs", "organizacion", T("Mis candidaturas", "My applications"), S.jobs?.length ? T(`${S.jobs.length} en seguimiento`, `${S.jobs.length} tracked`) : T("Sigue cada oferta", "Track every job")],
  ["doc", "dinero", T("Analizar factura o contrato", "Analyse a bill or contract"), T("Qué pagas, plazos y dónde ahorrar", "What you pay, deadlines, savings")],
  ["vault", "tramites", T("Mis documentos", "My documents"), S.docs?.length ? T(`${S.docs.length} guardados`, `${S.docs.length} saved`) : T("Con aviso antes de caducar", "With alerts before they expire")],
  ["negotiate", "comunidad", T("Mensaje para negociar", "Negotiation message"), T("Alquiler, tarifas, sueldo…", "Rent, tariffs, salary…")],
];
function toolsCard() {
  return `<section class="stack g3" aria-labelledby="tools-t"><h2 class="section-title" id="tools-t">${T("Herramientas de tu Persohna", "Your Persohna's tools")}</h2><div class="tools">${TOOLS().map(([k, icn, t, d]) => `<button class="tool" type="button" data-action="tool" data-v="${k}"><img src="${iconSrc(icn)}" alt="" width="48" height="48" loading="lazy"><span class="stack g1"><strong>${t}</strong><span class="post-meta">${d}</span></span></button>`).join("")}</div></section>`;
}
const _viewInicio4 = viewInicio;
viewInicio = function () {
  ensureV4();
  let h = _viewInicio4();
  h = h.replace('<section class="card invite', todayCard() + toolsCard() + '<section class="card invite');
  h = h.replace("Invitaciones enviadas", "Enlaces compartidos").replace("Invites sent", "Links shared");
  return h;
};

// ---------- CV: botones de entrevista, candidaturas y PDF ----------
const _cvCard4 = cvCard;
cvCard = function () {
  const h = _cvCard4();
  if (!S.cv?.text) return h;
  const cut = h.lastIndexOf("</div></section>");
  return h.slice(0, cut) + `<button class="btn btn-ghost" type="button" data-action="tool" data-v="interview">${T("Simular entrevista", "Practice interview")}</button>` + h.slice(cut);
};
const _cvHTML4 = cvHTML;
cvHTML = function () {
  let h = _cvHTML4();
  if (CVS?.tab === "review" && S.cv?.review) h = h.replace('<div class="ai-out">', `<div class="row g2 wrap">${pdfBtn("cv-review")}</div><div class="ai-out">`);
  if (CVS?.tab === "tailor" && CVS.result) h = h.replace(/(<button class="btn btn-secondary" type="button" data-action="copy-text"[^>]*>[^<]*<\/button>)/, `<div class="row g2 wrap">$1${pdfBtn("cv-tailor")}<button class="btn btn-secondary" type="button" data-action="tool" data-v="interview">${T("Practicar la entrevista", "Practise the interview")}</button></div>`);
  if (CVS?.tab === "tailor" && !CVS.result && S.jobs?.length) h = h.replace('<div class="sheet-foot">', `<div class="sheet-foot"><button class="btn btn-ghost" type="button" data-action="tool" data-v="jobs" style="flex:0 0 auto">${T("Candidaturas", "Applications")}</button>`);
  return h;
};
const _cvTailor4 = cvTailor;
cvTailor = async function () { await _cvTailor4(); const n = (S.cv?.apps || []).filter((a) => !a.jobId).length; if (n) { ensureV4(); save(); } };

// ---------- Simulador de entrevista ----------
let IV = null;
function openInterview(role = "") {
  ensureV4();
  const last = S.iv && S.iv.msgs?.length && !S.iv.over ? S.iv : null;
  IV = last ? { ...last, busy: false, err: "" } : { role: role || S.cv?.apps?.[0]?.title || S.goals.find((g) => g.cat === "trabajo" && !g.done)?.title || "", msgs: [], busy: false, err: "", over: false };
  if (role && last && last.role !== role) IV = { role, msgs: [], busy: false, err: "", over: false };
  closeAll(); openLayer(ivHTML(), { full: true, label: T("Simulador de entrevista", "Interview practice") });
}
function ivHTML() {
  const started = IV.msgs.length > 0;
  let body;
  if (!started) {
    body = `<p class="muted">${T("Te hago preguntas como en una entrevista real, una a una. Respondes y te digo qué mejorar. Escribe FIN o pulsa «Terminar» para ver tu nota.", "I'll ask questions like a real interview, one at a time. You answer and I tell you what to improve. Type END or tap “Finish” for your score.")}</p>
      <div class="field"><label for="iv-role">${T("Puesto y empresa", "Role and company")}</label><input class="input" id="iv-role" maxlength="140" value="${esc(IV.role)}" placeholder="${T("Ej.: Product manager en una fintech", "E.g. Product manager at a fintech")}"></div>
      ${S.cv?.text ? `<p class="hint">${ico("check", "i16")} ${T("Usaré tu CV para hacer preguntas sobre tu experiencia.", "I'll use your CV to ask about your experience.")}</p>` : `<p class="hint">${T("Si subes tu CV, las preguntas serán sobre tu experiencia real.", "Upload your CV and the questions will be about your real experience.")} <button class="link-btn" type="button" data-action="cv" data-v="edit">${T("Subir CV", "Upload CV")}</button></p>`}`;
  } else {
    body = `<div class="chat iv-chat" id="iv-chat" aria-live="polite">${IV.msgs.map((m, i) => i === 0 ? "" : `<div class="bubble ${m.role === "user" ? "me" : "p"}">${m.role === "user" ? esc(m.content) : md(m.content)}</div>`).join("")}${IV.busy ? `<div class="bubble p typing">${T("Pensando…", "Thinking…")}</div>` : ""}</div>
      ${IV.over ? `<div class="row g2 wrap">${pdfBtn("iv")}<button class="btn btn-secondary" type="button" data-action="iv-reset">${T("Otra entrevista", "Another interview")}</button></div>` : `<div class="field"><label for="iv-in">${T("Tu respuesta", "Your answer")}</label><textarea class="textarea" id="iv-in" rows="4" maxlength="3000" placeholder="${T("Responde como lo harías en la entrevista…", "Answer as you would in the interview…")}"></textarea></div>`}`;
  }
  const err = IV.err ? `<p class="err" role="alert">${esc(IV.err)}</p>` : "";
  const foot = !started ? `<button class="btn btn-primary" type="button" data-action="iv-start" ${IV.busy ? "disabled" : ""}>${IV.busy ? T("Preparando…", "Getting ready…") : T("Empezar entrevista", "Start interview")}</button>`
    : IV.over ? `<button class="btn btn-primary" type="button" data-action="close">${T("Cerrar", "Close")}</button>`
    : `<button class="btn btn-secondary" type="button" data-action="iv-end" ${IV.busy ? "disabled" : ""}>${T("Terminar y ver nota", "Finish and see score")}</button><button class="btn btn-primary" type="button" data-action="iv-send" ${IV.busy ? "disabled" : ""}>${T("Responder", "Answer")}</button>`;
  return `${sheetHead(T("Simulador de entrevista", "Interview practice"))}<div class="sheet-body stack g4">${started ? `<p class="post-meta">${esc(IV.role)}</p>` : ""}${body}${err}</div><div class="sheet-foot">${foot}</div>`;
}
async function ivTurn(userText) {
  if (IV.busy) return;
  if (userText) IV.msgs.push({ role: "user", content: userText });
  IV.busy = true; IV.err = ""; setLayer(ivHTML()); $("#iv-chat")?.lastElementChild?.scrollIntoView({ block: "nearest" });
  const hist = IV.msgs.slice(-15); while (hist.length && hist[0].role !== "user") hist.shift();
  const r = await askAI5("interview", hist, { role: IV.role });
  IV.busy = false;
  if (r.error) { IV.err = aiErr(r.error); if (userText) IV.msgs.pop(); }
  else { IV.msgs.push({ role: "assistant", content: r.text }); if (/^(FIN|END)$/i.test(userText || "")) { IV.over = true; S.xp += 5; addHistory(`Practicaste una entrevista: ${IV.role}`, `You practised an interview: ${IV.role}`); } }
  S.iv = { role: IV.role, msgs: IV.msgs, over: IV.over, at: today() }; save();
  if (isTop(T("Simulador de entrevista", "Interview practice"))) { setLayer(ivHTML()); $("#iv-chat")?.lastElementChild?.scrollIntoView({ block: "nearest" }); }
}

// ---------- Candidaturas ----------
function openJobs() { ensureV4(); closeAll(); openLayer(jobsHTML(), { full: true, wide: true, label: T("Mis candidaturas", "My applications") }); }
function jobsHTML() {
  const cols = JOB_ST.map(([k]) => {
    const list = S.jobs.filter((j) => j.status === k);
    return `<section class="kcol" aria-label="${esc(lbl(JOB_ST, k))}"><h3 class="section-title">${esc(lbl(JOB_ST, k))} <span class="muted">${list.length}</span></h3>${list.map((j) => `<div class="kcard stack g2"><strong>${esc(j.title)}</strong>${j.company ? `<span class="post-meta">${esc(j.company)}</span>` : ""}<span class="post-meta">${fmtDate(j.at)}</span>
      <label class="sr" for="js-${j.id}">${T("Estado", "Status")}</label><select class="input input-sm" id="js-${j.id}" data-job="${j.id}">${JOB_ST.map(([s]) => `<option value="${s}" ${s === j.status ? "selected" : ""}>${esc(lbl(JOB_ST, s))}</option>`).join("")}</select>
      <div class="row g1 wrap">${j.status === "interview" ? `<button class="btn btn-secondary btn-sm" type="button" data-action="iv-for" data-id="${j.id}">${T("Practicar", "Practise")}</button>` : ""}${j.status === "saved" && S.cv?.text ? `<button class="btn btn-ghost btn-sm" type="button" data-action="cv" data-v="tailor">${T("Adaptar CV", "Tailor CV")}</button>` : ""}<button class="btn btn-ghost btn-sm" type="button" data-action="job-del" data-id="${j.id}" aria-label="${T("Eliminar", "Delete")}">${ico("trash")}</button></div></div>`).join("") || `<p class="hint">${T("Nada aquí", "Nothing here")}</p>`}</section>`;
  }).join("");
  return `${sheetHead(T("Mis candidaturas", "My applications"))}<div class="sheet-body stack g4">
    <div class="card stack g3"><div class="row g2 wrap"><label class="sr" for="job-t">${T("Puesto", "Role")}</label><input class="input grow" id="job-t" maxlength="90" placeholder="${T("Puesto", "Role")}"><label class="sr" for="job-c">${T("Empresa", "Company")}</label><input class="input grow" id="job-c" maxlength="60" placeholder="${T("Empresa", "Company")}"><button class="btn btn-primary" type="button" data-action="job-add">${ico("plus")}${T("Añadir", "Add")}</button></div>
    <p class="hint">${T("Las ofertas a las que adaptas tu CV aparecen aquí solas. Cambia el estado según avances.", "Jobs you tailor your CV to show up here automatically. Change the status as you go.")}</p></div>
    <div class="kanban">${cols}</div></div>`;
}

// ---------- Analizar documento / factura ----------
let DA = null;
function openDoc(prefill = "") {
  DA = { text: prefill, name: "", busy: false, err: "", result: "" };
  closeAll(); openLayer(docHTML(), { full: true, label: T("Analizar documento", "Analyse a document") });
}
function docHTML() {
  const err = DA.err ? `<p class="err" role="alert">${esc(DA.err)}</p>` : "";
  let body, foot;
  if (!DA.result) {
    body = `<p class="muted">${T("Sube o pega una factura, un contrato, una nómina o una carta. Te digo qué es, cuánto pagas, los plazos y dónde puedes ahorrar o reclamar.", "Upload or paste a bill, contract, payslip or letter. I'll tell you what it is, what you pay, the deadlines and where you could save or claim.")}</p>
      <label class="btn btn-secondary file-btn">${ico("download", "rot180")}${T("Subir PDF, Word o texto", "Upload PDF, Word or text")}<input type="file" id="doc-file" accept=".pdf,.docx,.txt,.md,application/pdf,text/plain" hidden></label>
      <div class="field"><label for="doc-text">${T("O pega el texto", "Or paste the text")}</label><textarea class="textarea cv-area" id="doc-text" maxlength="24000" placeholder="${T("Pega aquí el contenido del documento", "Paste the document text here")}">${esc(DA.text)}</textarea></div>
      <div class="note">${ico("lock")}<span>${T("Solo se usa para analizarlo. Si lo guardas, guardo el análisis, no el documento.", "Only used for the analysis. If you save it, I keep the analysis, not the document.")}</span></div>`;
    foot = `<button class="btn btn-primary" type="button" data-action="doc-analyze" ${DA.busy ? "disabled" : ""}>${DA.busy ? T("Analizando… (hasta 1 min)", "Analysing… (up to 1 min)") : T("Analizar", "Analyse")}</button>`;
  } else {
    body = `<div class="row g2 wrap">${pdfBtn("doc")}<button class="btn btn-secondary" type="button" data-action="tool" data-v="negotiate">${T("Redactar reclamación", "Draft a complaint")}</button></div><div class="ai-out">${md(DA.result)}</div>
      <div class="card stack g3"><div class="section-title">${T("Guardar en Mis documentos", "Save to My documents")}</div>
      <div class="field"><label for="doc-name">${T("Nombre", "Name")}</label><input class="input" id="doc-name" maxlength="80" value="${esc(DA.name)}" placeholder="${T("Ej.: Factura luz octubre", "E.g. October power bill")}"></div>
      <div class="row g2 wrap"><div class="field grow"><label for="doc-kind">${T("Tipo", "Type")}</label><select class="input" id="doc-kind">${DOC_KINDS.map(([k]) => `<option value="${k}">${esc(lbl(DOC_KINDS, k))}</option>`).join("")}</select></div><div class="field grow"><label for="doc-exp">${T("Caduca / vence (opcional)", "Expires / due (optional)")}</label><input class="input" type="date" id="doc-exp"></div></div></div>
      <p class="hint">${T("Análisis hecho por IA: revisa las cifras con el documento original.", "AI analysis: check the figures against the original.")}</p>`;
    foot = `<button class="btn btn-secondary" type="button" data-action="doc-new">${T("Otro documento", "Another document")}</button><button class="btn btn-primary" type="button" data-action="doc-save">${T("Guardar", "Save")}</button>`;
  }
  return `${sheetHead(T("Analizar documento", "Analyse a document"))}<div class="sheet-body stack g4">${body}${DA.busy ? bgHint() : ""}${err}</div><div class="sheet-foot">${foot}</div>`;
}
async function docAnalyze() {
  const t = ($("#doc-text")?.value || "").trim(); DA.text = t;
  if (t.length < 60) { DA.err = T("Pega el texto del documento o súbelo (al menos unas líneas).", "Paste or upload the document (at least a few lines)."); setLayer(docHTML()); return; }
  DA.busy = true; DA.err = ""; setLayer(docHTML());
  let r = await askAI5("doc", [{ role: "user", content: t }], { cv: undefined });
  if (r.error === "empty" || r.error === "upstream") r = await askAI5("chat", [{ role: "user", content: T("Analiza este documento. Dime: qué es, datos clave (importes, plazos, permanencias), fechas importantes, dónde puedo ahorrar o reclamar (sin inventar precios), cosas raras y el siguiente paso. Usa títulos en negrita y sé breve.\n\n", "Analyse this document. Tell me: what it is, key figures (amounts, terms, lock-ins), important dates, where I could save or claim (no invented prices), odd things and the next step. Use bold headings and keep it short.\n\n") + t.slice(0, 10000) }], { cv: undefined });
  DA.busy = false;
  if (r.error) DA.err = aiErr(r.error); else { DA.result = r.text; S.xp += 3; addHistory(`Analizaste un documento${DA.name ? ": " + DA.name : ""}`, `You analysed a document${DA.name ? ": " + DA.name : ""}`); save(); }
  if (isTop(T("Analizar documento", "Analyse a document"))) setLayer(docHTML()); else if (!r.error) doneNotify("El análisis de tu documento está listo", "Your document analysis is ready", () => { openLayer(docHTML(), { full: true, label: T("Analizar documento", "Analyse a document") }); });
}

// ---------- Mis documentos (con caducidad) ----------
let VA = null;
function openVault() { ensureV4(); VA = { open: null, adding: false }; closeAll(); openLayer(vaultHTML(), { full: true, label: T("Mis documentos", "My documents") }); }
function vaultHTML() {
  const docs = [...S.docs].sort((a, b) => (a.expires || "9999") < (b.expires || "9999") ? -1 : 1);
  const open = docs.find((d) => d.id === VA.open);
  let body;
  if (open) {
    const d = daysTo(open.expires);
    body = `<button class="link-btn small" type="button" data-action="vault-back" style="align-self:flex-start">${ico("back", "i16")} ${T("Todos los documentos", "All documents")}</button><div class="stack g1"><h3 class="h-card">${esc(open.name)}</h3><p class="post-meta">${esc(lbl(DOC_KINDS, open.kind))} · ${T("guardado", "saved")} ${fmtDate(open.at)}${open.expires ? ` · ${d < 0 ? T("caducó", "expired") : T("caduca", "expires")} ${fmtDate(open.expires)}` : ""}</p></div>
      ${open.note ? `<p>${esc(open.note)}</p>` : ""}${open.analysis ? `<div class="row g2 wrap">${pdfBtn("vault", `data-id="${open.id}"`)}</div><div class="ai-out">${md(open.analysis)}</div>` : ""}
      <button class="btn btn-ghost" type="button" data-action="doc-del" data-id="${open.id}" style="color:var(--danger);align-self:flex-start">${ico("trash")}${T("Eliminar", "Delete")}</button>`;
  } else {
    body = `<p class="muted">${T("Guarda lo importante y cuándo caduca (DNI, seguro, ITV, contratos…). Te aviso 30 días antes.", "Keep track of what matters and when it expires (ID, insurance, car test, contracts…). I'll warn you 30 days before.")}</p>
      ${VA.adding ? `<div class="card stack g3"><div class="field"><label for="va-name">${T("Nombre", "Name")}</label><input class="input" id="va-name" maxlength="80" placeholder="${T("Ej.: Pasaporte", "E.g. Passport")}"></div><div class="row g2 wrap"><div class="field grow"><label for="va-kind">${T("Tipo", "Type")}</label><select class="input" id="va-kind">${DOC_KINDS.map(([k]) => `<option value="${k}">${esc(lbl(DOC_KINDS, k))}</option>`).join("")}</select></div><div class="field grow"><label for="va-exp">${T("Caduca", "Expires")}</label><input class="input" type="date" id="va-exp"></div></div><div class="field"><label for="va-note">${T("Nota (opcional)", "Note (optional)")}</label><input class="input" id="va-note" maxlength="200" placeholder="${T("Ej.: renovar en la comisaría de…", "E.g. renew at…")}"></div><p class="hint">${T("No guardes aquí números de documentos ni contraseñas.", "Don't store ID numbers or passwords here.")}</p><div class="row g2"><button class="btn btn-primary" type="button" data-action="vault-save">${T("Guardar", "Save")}</button><button class="btn btn-ghost" type="button" data-action="vault-cancel">${T("Cancelar", "Cancel")}</button></div></div>` : ""}
      ${docs.length ? `<div class="stack g2">${docs.map((x) => { const d = daysTo(x.expires); return `<button class="goal-row" type="button" data-action="vault-open" data-id="${x.id}"><img src="${iconSrc(x.kind === "factura" ? "dinero" : "tramites")}" alt="" width="40" height="40"><span class="grow stack g1"><strong>${esc(x.name)}</strong><span class="post-meta">${esc(lbl(DOC_KINDS, x.kind))}${x.expires ? ` · <span class="${d !== null && d <= 30 ? "danger-t" : ""}">${d < 0 ? T("caducado", "expired") : (d === 1 ? T("caduca mañana", "expires tomorrow") : T(`caduca en ${d} días`, `expires in ${d} days`))}</span>` : ""}${x.analysis ? " · " + T("con análisis", "analysed") : ""}</span></span>${ico("chev", "chev")}</button>`; }).join("")}</div>` : VA.adding ? "" : `<div class="empty"><p><strong>${T("Aún no hay documentos.", "No documents yet.")}</strong></p></div>`}`;
  }
  const foot = open ? `<button class="btn btn-primary" type="button" data-action="close">${T("Cerrar", "Close")}</button>` : `<button class="btn btn-secondary" type="button" data-action="tool" data-v="doc">${T("Analizar uno", "Analyse one")}</button><button class="btn btn-primary" type="button" data-action="vault-add" ${VA.adding ? "disabled" : ""}>${ico("plus")}${T("Añadir", "Add")}</button>`;
  return `${sheetHead(T("Mis documentos", "My documents"))}<div class="sheet-body stack g4">${body}</div><div class="sheet-foot">${foot}</div>`;
}

// ---------- Mensaje para negociar o reclamar ----------
let NG = null;
const NG_WHO = [["casero", "Casero", "Landlord"], ["compania", "Compañía (luz, móvil, seguro…)", "Provider (power, phone, insurance…)"], ["empresa", "Empresa / jefe", "Employer / boss"], ["vendedor", "Vendedor", "Seller"], ["otro", "Otro", "Other"]];
function openNegotiate() { NG = { who: "compania", goal: "", ctx: "", busy: false, err: "", result: "" }; closeAll(); openLayer(ngHTML(), { full: true, label: T("Mensaje para negociar", "Negotiation message") }); }
function ngHTML() {
  const err = NG.err ? `<p class="err" role="alert">${esc(NG.err)}</p>` : "";
  const body = NG.result ? `<div class="row g2 wrap"><button class="btn btn-secondary" type="button" data-action="copy-text" data-t="${esc(NG.result)}">${T("Copiar todo", "Copy all")}</button>${pdfBtn("ng")}</div><div class="ai-out">${md(NG.result)}</div><p class="hint">${T("Revísalo y completa lo que está entre [corchetes] antes de enviarlo. Lo envías tú.", "Review it and fill in the [brackets] before sending. You send it.")}</p>`
    : `<p class="muted">${T("Te escribo el mensaje en dos tonos y los argumentos para pedir lo que quieres. Tú decides si lo envías.", "I'll write the message in two tones plus the arguments to ask for what you want. You decide whether to send it.")}</p>
      <fieldset class="stack g2" style="border:0;padding:0;margin:0"><legend class="section-title" style="margin-bottom:8px">${T("¿Con quién?", "Who with?")}</legend><div class="chips wrapchips">${NG_WHO.map(([k]) => `<button class="chip chip-sm" type="button" data-action="ng-who" data-v="${k}" aria-pressed="${NG.who === k}">${esc(lbl(NG_WHO, k))}</button>`).join("")}</div></fieldset>
      <div class="field"><label for="ng-goal">${T("¿Qué quieres conseguir?", "What do you want?")}</label><textarea class="textarea" id="ng-goal" rows="3" maxlength="600" placeholder="${T("Ej.: que me bajen la tarifa de fibra o me quiten la permanencia", "E.g. lower my broadband price or drop the lock-in")}">${esc(NG.goal)}</textarea></div>
      <div class="field"><label for="ng-ctx">${T("Contexto (opcional)", "Context (optional)")}</label><textarea class="textarea" id="ng-ctx" rows="4" maxlength="4000" placeholder="${T("Cuánto pagas, desde cuándo, qué ha pasado, ofertas que has visto…", "What you pay, since when, what happened, offers you've seen…")}">${esc(NG.ctx)}</textarea></div>`;
  const foot = NG.result ? `<button class="btn btn-secondary" type="button" data-action="ng-new">${T("Otro mensaje", "Another message")}</button><button class="btn btn-primary" type="button" data-action="close">${T("Listo", "Done")}</button>`
    : `<button class="btn btn-primary" type="button" data-action="ng-go" ${NG.busy ? "disabled" : ""}>${NG.busy ? T("Escribiendo…", "Writing…") : T("Escribir mensaje", "Write message")}</button>`;
  return `${sheetHead(T("Mensaje para negociar", "Negotiation message"))}<div class="sheet-body stack g4">${body}${NG.busy ? bgHint() : ""}${err}</div><div class="sheet-foot">${foot}</div>`;
}
async function ngGo() {
  NG.goal = ($("#ng-goal")?.value || "").trim(); NG.ctx = ($("#ng-ctx")?.value || "").trim();
  if (NG.goal.length < 8) { NG.err = T("Cuéntame qué quieres conseguir.", "Tell me what you want to achieve."); setLayer(ngHTML()); $("#ng-goal")?.focus(); return; }
  NG.busy = true; NG.err = ""; setLayer(ngHTML());
  const r = await askAI5("negotiate", [{ role: "user", content: `${T("Con quién", "With")}: ${lbl(NG_WHO, NG.who)}\n${T("Quiero", "I want")}: ${NG.goal}\n${NG.ctx ? T("Contexto", "Context") + ": " + NG.ctx : ""}` }]);
  NG.busy = false;
  if (r.error) NG.err = aiErr(r.error); else { NG.result = r.text; addHistory("Tu Persohna te preparó un mensaje para negociar", "Your Persohna drafted a negotiation message"); S.xp += 3; save(); }
  if (isTop(T("Mensaje para negociar", "Negotiation message"))) setLayer(ngHTML()); else if (!r.error) doneNotify("Tu mensaje para negociar está listo", "Your negotiation message is ready", () => { openLayer(ngHTML(), { full: true, label: T("Mensaje para negociar", "Negotiation message") }); });
}

// ---------- Tour de bienvenida ----------
let TOUR = 0;
const TOUR_STEPS = () => [
  ["comunidad", T("Dile qué quieres", "Tell it what you want"), T("Un trabajo, una casa, pagar menos de luz… Lo convierte en un objetivo con un plan a medida.", "A job, a home, a lower power bill… It turns it into a goal with a tailored plan.")],
  ["trabajo", T("Usa sus herramientas", "Use its tools"), T("Revisa tu CV, simula entrevistas, analiza facturas y te escribe mensajes para negociar.", "It reviews your CV, runs mock interviews, analyses bills and writes negotiation messages.")],
  ["organizacion", T("Te avisa a tiempo", "It reminds you in time"), T("Pon fechas a tus objetivos y a tus documentos. Mira la tarjeta «Hoy» cada día.", "Add dates to your goals and documents. Check the “Today” card every day.")],
  ["tramites", T("Tú decides", "You decide"), T("Nada se compra, se envía ni se firma sin tu OK. Crea una cuenta para no perder nada.", "Nothing is bought, sent or signed without your OK. Create an account so you never lose anything.")],
];
function tourHTML() {
  const st = TOUR_STEPS(), [icn, t, d] = st[TOUR];
  return `${sheetHead(T("Así funciona", "How it works"))}<div class="sheet-body stack g4" style="align-items:center;text-align:center"><img src="${iconSrc(icn)}" alt="" width="112" height="112"><h3 class="h-card">${t}</h3><p class="muted">${d}</p><div class="dots" aria-hidden="true">${st.map((_, i) => `<i class="${i === TOUR ? "on" : ""}"></i>`).join("")}</div><p class="sr" aria-live="polite">${TOUR + 1} / ${st.length}</p></div><div class="sheet-foot">${TOUR ? `<button class="btn btn-secondary" type="button" data-action="tour-prev">${T("Atrás", "Back")}</button>` : `<button class="btn btn-ghost" type="button" data-action="close">${T("Saltar", "Skip")}</button>`}<button class="btn btn-primary" type="button" data-action="tour-next">${TOUR === st.length - 1 ? T("Empezar", "Let's go") : T("Siguiente", "Next")}</button></div>`;
}
function openTour() { TOUR = 0; S.tourDone = true; save(); openLayer(tourHTML(), { label: T("Así funciona", "How it works") }); }

// ---------- Mi Persohna: chat (dictado, búsqueda, sugerencias) y capacidades ----------
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
let recog = null;
const _viewPersohna4 = viewPersohna;
viewPersohna = function () {
  let h = _viewPersohna4();
  if (ui.seg === "conversacion") {
    const last = S.chat[S.chat.length - 1];
    if (S.chat.length && last && last.from !== "me" && !last.pending) {
      const sug = [T("Hazlo más corto", "Make it shorter"), T("Dame los pasos uno a uno", "Give me the steps one by one"), T("¿Qué hago hoy?", "What do I do today?")];
      h = h.replace(/<div class="chips wrapchips">[\s\S]*?<\/div>/, `<div class="chips wrapchips">${sug.map((q) => `<button class="chip chip-sm" type="button" data-action="quick" data-t="${esc(q)}">${esc(q)}</button>`).join("")}<button class="chip chip-sm" type="button" data-action="chat-goal">${ico("plus", "i16")} ${T("Crear objetivo con esto", "Make this a goal")}</button></div>`);
    }
    if (SpeechRec) h = h.replace('<button class="icon-btn send-btn" type="submit"', `<button class="icon-btn bordered mic-btn" type="button" data-action="mic" aria-label="${T("Dictar por voz", "Dictate")}" aria-pressed="false">${MIC}</button><button class="icon-btn send-btn" type="submit"`);
    if (S.chat.length > 6) h = h.replace('<div class="chat" id="chat"', `<div class="search chat-search" role="search">${ico("search")}<label class="sr" for="chat-q">${T("Buscar en la conversación", "Search the chat")}</label><input class="input" id="chat-q" type="search" placeholder="${T("Buscar en la conversación", "Search the chat")}" autocomplete="off"></div><div class="chat" id="chat"`);
  }
  if (ui.seg === "capacidades") {
    const caps = [[T("Simular entrevistas", "Practise interviews"), T("Preguntas reales para tu puesto, feedback en cada respuesta y una nota final.", "Real questions for your role, feedback on each answer and a final score."), "interview"],
      [T("Seguir tus candidaturas", "Track your applications"), T("Guardada, enviada, entrevista, oferta: todo en un tablero.", "Saved, applied, interview, offer: all on one board."), "jobs"],
      [T("Analizar facturas y contratos", "Analyse bills and contracts"), T("Qué pagas, plazos, cláusulas raras y dónde ahorrar o reclamar.", "What you pay, deadlines, odd clauses and where to save or claim."), "doc"],
      [T("Avisos de caducidad", "Expiry reminders"), T("DNI, seguros, ITV o contratos: te avisa 30 días antes.", "ID, insurance, car test or contracts: warns you 30 days before."), "vault"],
      [T("Escribir mensajes para negociar", "Write negotiation messages"), T("Dos tonos y argumentos. Lo envías tú.", "Two tones plus arguments. You send it."), "negotiate"]];
    const add = caps.map(([t, d, k]) => `<button class="card row g3 cap-new" type="button" data-action="tool" data-v="${k}" style="align-items:flex-start;text-align:left"><span class="cat-ico cat-aprender">${ico("check")}</span><span class="grow stack g1"><strong>${t}</strong><span class="muted small">${d}</span></span><span class="tag tag-ready">${T("Nuevo", "New")}</span></button>`).join("");
    h = h.replace('<div id="seg-panel" role="tabpanel" aria-labelledby="tab-capacidades"><div class="stack g3">', `<div id="seg-panel" role="tabpanel" aria-labelledby="tab-capacidades"><div class="stack g3">${add}`);
  }
  return h;
};
const MIC = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>`;
function toggleMic(btn) {
  if (!SpeechRec) return;
  if (recog) { recog.stop(); return; }
  const ta = $("#chat-in"); if (!ta) return;
  recog = new SpeechRec(); recog.lang = LANG === "en" ? "en-GB" : "es-ES"; recog.interimResults = true; recog.continuous = false;
  const base = ta.value ? ta.value.trim() + " " : "";
  recog.onresult = (ev) => { let t = ""; for (const r of ev.results) t += r[0].transcript; ta.value = base + t; autoGrow(ta); };
  recog.onerror = (ev) => { if (ev.error === "not-allowed") toast(T("Permite el micrófono para dictar.", "Allow the microphone to dictate.")); };
  recog.onend = () => { recog = null; btn?.setAttribute("aria-pressed", "false"); btn?.classList.remove("rec"); ta.focus(); };
  try { recog.start(); btn.setAttribute("aria-pressed", "true"); btn.classList.add("rec"); toast(T("Te escucho…", "Listening…")); } catch { recog = null; }
}

// ---------- Perfil: tema, avisos, app y tour ----------
const _viewPerfil4 = viewPerfil;
viewPerfil = function () {
  const th = getTheme();
  const perm = canNotify() ? Notification.permission : "unsupported";
  const sec = `<section class="card stack g3" aria-labelledby="dev-t"><h2 class="section-title" id="dev-t">${T("Este dispositivo", "This device")}</h2>
    <div class="switch"><span><strong>${T("Tema", "Theme")}</strong></span><div class="seg seg-sm" role="radiogroup" aria-label="${T("Tema", "Theme")}">${[["auto", T("Auto", "Auto")], ["light", T("Claro", "Light")], ["dark", T("Oscuro", "Dark")]].map(([k, l]) => `<button type="button" role="radio" aria-checked="${th === k}" data-action="theme" data-v="${k}">${l}</button>`).join("")}</div></div>
    <div class="switch"><span><strong>${T("Avisos en el dispositivo", "Device alerts")}</strong><br><span class="muted small">${perm === "granted" ? T("Activados. Te aviso de fechas y caducidades al abrir la app.", "On. I'll alert you about dates and expiries when you open the app.") : perm === "denied" ? T("Bloqueados en el navegador. Actívalos en los ajustes del navegador.", "Blocked by the browser. Turn them on in browser settings.") : perm === "unsupported" ? T("Este navegador no admite avisos. Los verás en la campana.", "This browser doesn't support alerts. You'll see them under the bell.") : T("Recordatorios de tus fechas y documentos.", "Reminders for your dates and documents.")}</span></span>${perm === "default" ? `<button class="btn btn-secondary btn-sm" type="button" data-action="notif-on">${T("Activar", "Turn on")}</button>` : ""}</div>
    ${installEvt && !isStandalone() ? `<div class="switch"><span><strong>${T("Instalar la app", "Install the app")}</strong><br><span class="muted small">${T("Ábrela desde tu pantalla de inicio, como una app.", "Open it from your home screen, like an app.")}</span></span><button class="btn btn-secondary btn-sm" type="button" data-action="install">${T("Instalar", "Install")}</button></div>` : !isStandalone() && /iphone|ipad/i.test(navigator.userAgent) ? `<p class="hint">${T("Para instalarla en iPhone: botón Compartir → «Añadir a pantalla de inicio».", "To install on iPhone: Share button → “Add to Home Screen”.")}</p>` : ""}
    <button class="link-btn small" type="button" data-action="tour" style="align-self:flex-start">${T("Ver cómo funciona", "See how it works")}</button></section>`;
  return _viewPerfil4().replace('<section class="card stack g3" aria-labelledby="demo-t">', sec + '<section class="card stack g3" aria-labelledby="demo-t">');
};

// ---------- Render: estado al día y tour la primera vez ----------
const _render4 = render;
render = function (opts = {}) {
  ensureV4();
  _render4(opts);
  if (S.me && !S.tourDone && ui.route === "inicio" && !stackLayers.length) setTimeout(() => { if (!stackLayers.length && !S.tourDone) openTour(); }, 600);
};

// ---------- Eventos ----------
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-action]"); if (!b) return;
  const a = b.dataset.action, id = b.dataset.id;
  const goal = () => S.goals.find((x) => x.id === id);
  switch (a) {
    case "tool": {
      const v = b.dataset.v;
      if (v === "interview") openInterview(); else if (v === "jobs") openJobs(); else if (v === "doc") openDoc(); else if (v === "vault") openVault(); else if (v === "negotiate") openNegotiate();
      break;
    }
    // entrevista
    case "iv-start": { const r = ($("#iv-role")?.value || "").trim(); if (r.length < 3) { IV.err = T("Escribe el puesto.", "Enter the role."); setLayer(ivHTML()); $("#iv-role")?.focus(); return; } IV.role = r; IV.msgs = [{ role: "user", content: T(`Puesto: ${r}. Empieza la entrevista con la primera pregunta.`, `Role: ${r}. Start the interview with the first question.`) }]; ivTurn(""); break; }
    case "iv-send": { const v = ($("#iv-in")?.value || "").trim(); if (!v) { $("#iv-in")?.focus(); return; } ivTurn(v); break; }
    case "iv-end": ivTurn(T("FIN", "END")); break;
    case "iv-reset": IV = { role: IV?.role || "", msgs: [], busy: false, err: "", over: false }; S.iv = null; save(); setLayer(ivHTML()); break;
    case "iv-for": { const j = S.jobs.find((x) => x.id === id); openInterview(j ? `${j.title}${j.company ? " · " + j.company : ""}` : ""); break; }
    // candidaturas
    case "job-add": { const t = ($("#job-t")?.value || "").trim(); if (!t) { $("#job-t")?.focus(); return; } S.jobs.unshift({ id: uid(), title: t.slice(0, 90), company: ($("#job-c")?.value || "").trim().slice(0, 60), status: "saved", at: today(), note: "" }); save(); setLayer(jobsHTML()); render({ keepScroll: true }); $("#job-t")?.focus(); toast(T("Añadida", "Added")); break; }
    case "job-del": { const i = S.jobs.findIndex((x) => x.id === id); if (i < 0) return; const [j] = S.jobs.splice(i, 1); save(); setLayer(jobsHTML()); toast(T("Eliminada", "Deleted"), { label: T("Deshacer", "Undo"), fn: () => { S.jobs.splice(i, 0, j); save(); if (topLayer()) setLayer(jobsHTML()); } }); break; }
    // documentos
    case "doc-analyze": docAnalyze(); break;
    case "doc-new": DA = { text: "", name: "", busy: false, err: "", result: "" }; setLayer(docHTML()); break;
    case "doc-save": {
      const name = ($("#doc-name")?.value || "").trim() || T("Documento", "Document") + " " + fmtDate(today());
      S.docs.unshift({ id: uid(), name: name.slice(0, 80), kind: $("#doc-kind")?.value || "otro", expires: $("#doc-exp")?.value || "", at: today(), analysis: DA.result.slice(0, 8000), note: "" });
      save(); checkReminders(); closeAll(); openVault(); toast(T("Guardado en Mis documentos", "Saved to My documents")); break;
    }
    case "vault-add": VA.adding = true; setLayer(vaultHTML()); $("#va-name")?.focus(); break;
    case "vault-cancel": VA.adding = false; setLayer(vaultHTML()); break;
    case "vault-save": { const n = ($("#va-name")?.value || "").trim(); if (!n) { $("#va-name")?.focus(); return; } S.docs.unshift({ id: uid(), name: n.slice(0, 80), kind: $("#va-kind")?.value || "otro", expires: $("#va-exp")?.value || "", note: ($("#va-note")?.value || "").trim().slice(0, 200), at: today() }); VA.adding = false; save(); checkReminders(); setLayer(vaultHTML()); toast(T("Guardado", "Saved")); break; }
    case "vault-open": VA.open = id; setLayer(vaultHTML()); break;
    case "vault-back": VA.open = null; setLayer(vaultHTML()); break;
    case "doc-del": { const ok = await confirmDialog({ title: T("Eliminar documento", "Delete document"), text: T("Se borrará de Mis documentos.", "It will be removed from My documents."), ok: T("Eliminar", "Delete"), danger: true }); if (!ok) return; S.docs = S.docs.filter((x) => x.id !== id); save(); VA.open = null; if (topLayer()) setLayer(vaultHTML()); break; }
    // negociar
    case "ng-who": NG.goal = $("#ng-goal")?.value ?? NG.goal; NG.ctx = $("#ng-ctx")?.value ?? NG.ctx; NG.who = b.dataset.v; setLayer(ngHTML()); break;
    case "ng-go": ngGo(); break;
    case "ng-new": NG = { ...NG, result: "", goal: "", ctx: "", err: "" }; setLayer(ngHTML()); break;
    // PDF
    case "print-ai": {
      const s = b.dataset.src;
      if (s === "cv-review") printDoc(T("Análisis de tu CV", "Your CV review"), S.cv?.review || "");
      else if (s === "cv-tailor") printDoc(T("CV adaptado a la oferta", "CV tailored to the job"), CVS?.result || "");
      else if (s === "doc") printDoc(DA?.name || T("Análisis del documento", "Document analysis"), DA?.result || "");
      else if (s === "vault") { const x = S.docs.find((d) => d.id === id); if (x) printDoc(x.name, x.analysis || ""); }
      else if (s === "ng") printDoc(T("Mensaje para negociar", "Negotiation message"), NG?.result || "");
      else if (s === "iv") printDoc(T("Entrevista", "Interview") + " · " + (IV?.role || ""), (IV?.msgs || []).slice(1).map((m) => (m.role === "user" ? "**" + T("Tú", "You") + ":** " : "") + m.content).join("\n\n"));
      break;
    }
    // objetivos
    case "prop-accept": { const g = goal(); if (!g?.proposal) return; g.plan = g.proposal.plan; g.tip = g.proposal.tip; g.steps = []; delete g.proposal; addHistory(`Aceptaste el plan a medida de «${g.title}»`, `You accepted the tailored plan for “${g.title}”`); save(); setLayer(goalHTML(g)); render({ keepScroll: true }); toast(T("Plan actualizado", "Plan updated")); break; }
    case "prop-reject": { const g = goal(); if (!g) return; delete g.proposal; save(); setLayer(goalHTML(g)); render({ keepScroll: true }); break; }
    case "plan-edit": ui.planEdit = id; { const g = goal(); if (g) { setLayer(goalHTML(g)); $("#plan-ed")?.focus(); } } break;
    case "plan-cancel": ui.planEdit = null; { const g = goal(); if (g) setLayer(goalHTML(g)); } break;
    case "plan-save": {
      const g = goal(); if (!g) return;
      const lines = ($("#plan-ed")?.value || "").split("\n").map((s) => s.replace(/^\s*(\d+[.)]|[-*•])\s*/, "").trim()).filter(Boolean).slice(0, 12).map((s) => s.slice(0, 140));
      if (!lines.length) { toast(T("Escribe al menos un paso.", "Write at least one step.")); return; }
      const old = planOf(g), was = planDone(g);
      g.plan = lines; g.steps = lines.map((s) => { const k = old.indexOf(s); return k >= 0 ? !!was[k] : false; });
      ui.planEdit = null; save(); setLayer(goalHTML(g)); render({ keepScroll: true }); toast(T("Pasos guardados", "Steps saved")); break;
    }
    case "due-clear": { const g = goal(); if (!g) return; delete g.due; delete g.dueNotified; save(); setLayer(goalHTML(g)); render({ keepScroll: true }); break; }
    case "ach-img": { const g = goal(); if (g) achievementImage(g); break; }
    // chat
    case "chat-goal": {
      const lastMe = [...S.chat].reverse().find((m) => m.from === "me");
      const t = (lastMe?.text || "").replace(/\s+/g, " ").trim();
      if (!t) return;
      const g = { id: uid(), cat: "otro", title: t.length > 80 ? t.slice(0, 77) + "…" : t, prefs: {}, notes: t.slice(0, 1500), at: today(), done: false, steps: [] };
      S.goals.unshift(g); addHistory(`Nuevo objetivo: ${g.title}`, `New goal: ${g.title}`); save();
      aiPlan(g); toast(T("Objetivo creado. Preparando el plan…", "Goal created. Building the plan…"), { label: T("Ver", "View"), fn: () => openGoal(g.id) });
      break;
    }
    case "mic": toggleMic(b); break;
    // perfil
    case "theme": try { localStorage.setItem(THEME_KEY, b.dataset.v); } catch {} applyTheme(b.dataset.v); render({ keepScroll: true }); break;
    case "notif-on": { if (!canNotify()) return; const p = await Notification.requestPermission(); render({ keepScroll: true }); if (p === "granted") { deviceNotify("Persohna", T("Avisos activados. Te recordaré tus fechas.", "Alerts on. I'll remind you of your dates.")); } break; }
    case "install": { if (!installEvt) return; installEvt.prompt(); const c = await installEvt.userChoice.catch(() => null); installEvt = null; if (c?.outcome === "accepted") toast(T("¡Instalada!", "Installed!")); render({ keepScroll: true }); break; }
    case "tour": TOUR = 0; openLayer(tourHTML(), { label: T("Así funciona", "How it works") }); break;
    case "tour-next": if (TOUR >= TOUR_STEPS().length - 1) { closeLayer(); break; } TOUR++; setLayer(tourHTML()); break;
    case "tour-prev": TOUR = Math.max(0, TOUR - 1); setLayer(tourHTML()); break;
  }
});
document.addEventListener("change", async (e) => {
  const t = e.target;
  if (t.id === "g-due") { const g = S.goals.find((x) => x.id === t.dataset.id); if (!g) return; g.due = t.value || undefined; delete g.dueNotified; save(); checkReminders(); setLayer(goalHTML(g)); render({ keepScroll: true }); if (t.value) toast(T("Fecha guardada", "Date saved")); }
  if (t.dataset.job) { const j = S.jobs.find((x) => x.id === t.dataset.job); if (!j) return; j.status = t.value; if (t.value === "offer") { addHistory(`¡Oferta de ${j.company || j.title}!`, `Offer from ${j.company || j.title}!`); S.xp += 10; } save(); setLayer(jobsHTML()); render({ keepScroll: true }); toast(lbl(JOB_ST, t.value)); }
  if (t.id === "doc-file") {
    const f = t.files?.[0]; if (!f) return;
    toast(T("Leyendo el archivo…", "Reading the file…"));
    try { const text = await fileToText(f); if (text.length < 40) { DA.err = T("No he encontrado texto (¿es un PDF escaneado?). Pega el texto a mano.", "No text found (scanned PDF?). Paste the text instead."); } else { DA.text = text.slice(0, 24000); DA.name = f.name.replace(/\.[a-z0-9]+$/i, ""); DA.err = ""; } }
    catch (err) { DA.err = err?.message === "big" ? T("El archivo es demasiado grande (máx. 8 MB).", "File too large (max 8 MB).") : T("Formato no compatible. Usa PDF, Word (.docx) o texto.", "Unsupported format. Use PDF, Word (.docx) or text."); }
    setLayer(docHTML()); t.value = "";
  }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "chat-q") {
    const q = e.target.value.trim().toLowerCase();
    document.querySelectorAll("#chat .bubble").forEach((el) => { el.hidden = !!q && !el.textContent.toLowerCase().includes(q); });
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && e.target.id === "iv-in" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); $('[data-action="iv-send"]')?.click(); }
  if (e.key === "Enter" && (e.target.id === "job-t" || e.target.id === "job-c")) { e.preventDefault(); $('[data-action="job-add"]')?.click(); }
});
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") checkReminders(); });
setTimeout(checkReminders, 1500);
if (!stackLayers.length) render({ keepScroll: true });
