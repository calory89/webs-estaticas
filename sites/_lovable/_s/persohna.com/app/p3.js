"use strict";
// ---------- 6. Overlays ----------
const stackLayers = [];
function openLayer(html, { full = false, wide = false, label = "", onClose } = {}) {
  const el = document.createElement("div");
  el.className = "layer";
  el.innerHTML = `<div class="scrim" data-close></div><div class="sheet ${full ? "full" : ""} ${wide ? "wide" : ""}" role="dialog" aria-modal="true" ${label ? `aria-label="${esc(label)}"` : ""}>${full ? "" : '<span class="grabber" aria-hidden="true"></span>'}${html}</div>`;
  $("#layer-root").appendChild(el);
  $("#toast").classList.remove("show");
  const ret = document.activeElement;
  stackLayers.push({ el, ret, onClose });
  document.documentElement.style.overflow = "hidden";
  requestAnimationFrame(() => el.classList.add("in"));
  focusFirst(el);
  el.addEventListener("click", (e) => { if (e.target.matches("[data-close]")) closeLayer(); });
  return el;
}
function focusFirst(el) {
  setTimeout(() => {
    const t = el.querySelector("[autofocus]") || el.querySelector(".sheet-body input:not([type=checkbox]):not([type=radio]), .sheet-body textarea") || el.querySelector(".sheet-title") || el.querySelector("button");
    if (t) { if (t.classList.contains("sheet-title")) t.setAttribute("tabindex", "-1"); t.focus({ preventScroll: true }); }
  }, 30);
}
function closeLayer() {
  const top = stackLayers.pop(); if (!top) return;
  const { el, ret, onClose } = top;
  el.classList.remove("in");
  setTimeout(() => el.remove(), reduceMotion() ? 0 : 200);
  if (!stackLayers.length) document.documentElement.style.overflow = "";
  onClose && onClose();
  if (ret && document.contains(ret)) ret.focus({ preventScroll: true });
}
function closeAll() { while (stackLayers.length) closeLayer(); }
function sheetHead(title, { back = false, close = true } = {}) {
  return `<div class="sheet-head">${back ? `<button class="icon-btn" type="button" data-action="${back}" aria-label="${T("Atrás", "Back")}">${ico("back")}</button>` : '<span style="width:44px"></span>'}<h2 class="sheet-title">${esc(title)}</h2>${close ? `<button class="icon-btn" type="button" data-action="close" aria-label="${T("Cerrar", "Close")}">${ico("close")}</button>` : '<span style="width:44px"></span>'}</div>`;
}
function topLayer() { return stackLayers[stackLayers.length - 1]?.el; }
function setLayer(html) { const el = topLayer(); if (!el) return; const sh = el.querySelector(".sheet"); const grab = sh.querySelector(".grabber"); sh.innerHTML = (grab ? grab.outerHTML : "") + html; focusFirst(el); }
function confirmDialog({ title, text, ok, danger = false }) {
  return new Promise((res) => {
    let done = false;
    const el = openLayer(`${sheetHead(title)}<div class="sheet-body"><p>${esc(text)}</p></div><div class="sheet-foot"><button class="btn btn-secondary" type="button" data-c="no">${T("Cancelar", "Cancel")}</button><button class="btn ${danger ? "btn-danger" : "btn-primary"}" type="button" data-c="yes">${esc(ok || T("Confirmar", "Confirm"))}</button></div>`, { label: title, onClose: () => { if (!done) res(false); } });
    el.addEventListener("click", (e) => { const b = e.target.closest("[data-c]"); if (!b) return; done = true; closeLayer(); res(b.dataset.c === "yes"); });
  });
}
let toastT;
function toast(msg, action) {
  const t = $("#toast");
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button" data-toast>${esc(action.label)}</button>` : ""}`;
  t.classList.add("show");
  if (action) t.querySelector("[data-toast]").onclick = () => { t.classList.remove("show"); action.fn(); };
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), action ? 4500 : 2400);
}
async function shareLink(url, text) {
  try { if (navigator.share) { await navigator.share({ title: "Persohna", text, url }); return "shared"; } } catch (e) { if (e && e.name === "AbortError") return "cancel"; }
  try { await navigator.clipboard.writeText(url); toast(T("Enlace copiado", "Link copied")); return "copied"; } catch {}
  window.prompt(T("Copia el enlace:", "Copy the link:"), url); return "copied";
}
const baseUrl = () => location.origin + location.pathname;

// ---------- 7. Flujos ----------
// 7a. Detalle de publicación
function openPost(id) {
  const p = findPost(id); if (!p) return;
  const who = person(p.who), m = S.marks[id] || {}, q = p.kind === "question";
  const sample = L(p.sample) || [];
  const answers = S.proposals.filter((x) => x.id === id);
  openLayer(`${sheetHead(q ? T("Pregunta", "Question") : T("Experiencia", "Experience"))}<div class="sheet-body stack g4">
    <div class="post-head">${avatar(who, "md")}<div class="grow"><div class="post-who">${esc(who.name)}</div><div class="post-meta">${esc(L(CATS[p.cat]?.label))} · ${esc(ago(p.at))}</div></div>${who.me ? "" : lvlChip(who)}</div>
    <h3 class="h-card">${q ? "" : "«"}${esc(L(p.title))}${q ? "" : "»"}</h3>
    ${sample.length ? `<div class="sample"><ul>${sample.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></div>` : ""}
    ${p.detail ? `<p>${esc(L(p.detail))}</p>` : ""}
    ${p.context ? `<p class="ctx-line"><strong>${T("Contexto:", "Context:")}</strong> ${esc(L(p.context))}</p>` : ""}
    ${q ? "" : `<div class="row g2 wrap"><span class="tag">${p.kind === "confirmed" ? T("Información confirmada", "Verified info") : T("Experiencia personal", "Personal experience")}</span>${p.validity ? `<span class="tag">${esc(L(p.validity))}</span>` : ""}</div>`}
    ${p.commercial ? `<div class="note">${ico("info")}<span><strong>${T("Relación comercial.", "Commercial relationship.")}</strong> ${T("Quien lo comparte puede recibir una comisión si lo contratas. Valóralo igual que cualquier otra opción.", "The person sharing this may earn a commission if you sign up. Weigh it like any other option.")}</span></div>` : ""}
    ${answers.length ? `<div class="stack g2"><div class="section-title">${q ? T("Tus respuestas", "Your answers") : T("Tus propuestas", "Your suggestions")}</div>${answers.map((a) => `<div class="bubble me" style="max-width:100%">${esc(a.text)}</div>`).join("")}</div>` : ""}
    ${who.me || q ? "" : `<div class="stack g2"><div class="section-title">${T("¿Lo has probado?", "Have you tried it?")}</div><div class="row g2 wrap">
      <button class="chip" type="button" data-action="mark" data-id="${id}" data-k="tried" aria-pressed="${!!m.tried}">${T("Lo probé", "Tried it")}</button>
      <button class="chip" type="button" data-action="mark" data-id="${id}" data-k="worked" aria-pressed="${!!m.worked}">${T("Me funcionó", "It worked")}</button>
      <button class="chip" type="button" data-action="propose" data-id="${id}">${T("Proponer una mejora", "Suggest an improvement")}</button>
      <button class="chip" type="button" data-action="report" data-id="${id}" aria-pressed="${S.reports.includes(id)}">${T("Ya no está actualizado", "Out of date")}</button></div>
      <p class="hint">${T("En la versión completa, tus confirmaciones ayudan a", "In the full version, your confirmations help")} ${esc(who.name)} ${T("a subir de nivel.", "level up.")}</p></div>`}
  </div><div class="sheet-foot">
    <button class="icon-btn bordered" type="button" data-action="share-post" data-id="${id}" aria-label="${T("Compartir enlace", "Share link")}">${ico("share")}</button>
    ${who.me ? "" : `<button class="icon-btn bordered" type="button" data-action="toggle-save" data-id="${id}" aria-pressed="${S.saved.includes(id)}" aria-label="${S.saved.includes(id) ? T("Quitar de guardados", "Remove from saved") : T("Guardar", "Save")}">${ico("bookmark")}</button>`}
    ${who.me ? "" : q ? `<button class="btn btn-primary" type="button" data-action="propose" data-id="${id}">${T("Yo lo sé", "I know this")}</button>` : `<button class="btn btn-primary" type="button" data-action="adapt" data-id="${id}">${ico("sparkle")}${T("Mi Persohna también", "My Persohna too")}</button>`}
  </div>`, { label: T("Detalle", "Detail"), wide: true });
}

// 7b. Mi Persohna también / nuevo objetivo
let F = null;
function startAdapt({ postId = null, cat = null, goalId = null } = {}) {
  const p = postId ? findPost(postId) : null;
  const g = goalId ? S.goals.find((x) => x.id === goalId) : null;
  const c = g?.cat || p?.cat || cat;
  if (!CATS[c]) return;
  if (!S.me) { closeAll(); ui.onb = { ...ui.onb, step: 1, cat: c, data: structuredClone(p?.prefill || {}), from: postId }; go("empezar"); return; }
  F = { postId, goalId, cat: c, step: postId ? 0 : 1, data: g ? structuredClone(g.prefs || {}) : structuredClone(p?.prefill || {}), errors: {} };
  closeAll();
  openLayer(adaptHTML(), { full: true, label: T("Mi Persohna también", "My Persohna too") });
}
function optLabel(o) { return L(o); }
function optValue(o) { return typeof o === "object" ? o.es : o; }
function adaptHTML() {
  const cat = CATS[F.cat], p = F.postId ? findPost(F.postId) : null;
  const idx = Math.max(F.step, 1);
  const progress = F.step >= 1 && F.step <= 3 ? `<div class="progress" aria-hidden="true">${[1, 2, 3].map((i) => `<span class="${i <= idx ? "on" : ""}"></span>`).join("")}</div><p class="sr" aria-live="polite">${T("Paso", "Step")} ${idx} ${T("de", "of")} 3</p>` : "";
  const backAct = F.step > (F.postId ? 0 : 1) && F.step < 4 ? "adapt-back" : false;
  const title = F.goalId ? T("Editar objetivo", "Edit goal") : (F.postId ? T("Mi Persohna también", "My Persohna too") : L(cat.verb));
  let body = "", foot = "";
  if (F.step === 0) {
    const who = person(p.who);
    body = `<div class="stack g4"><div class="card stack g3"><div class="post-head">${avatar(who, "sm")}<div class="grow"><div class="post-who">${esc(who.name)} ${T("consiguió", "got")}</div><div class="post-meta">${esc(ago(p.at))}</div></div></div><h3 class="h-card">«${esc(L(p.title))}»</h3>${p.context ? `<p class="ctx-line">${esc(L(p.context))}</p>` : ""}</div>
      <div class="stack g2"><h3 class="h-card">${T("Adaptémoslo a tu vida", "Let's adapt it to your life")}</h3><p class="muted">${T("Te pido solo lo necesario y lo puedes cambiar después.", "I'll only ask what's needed, and you can change it later.")}</p></div></div>`;
    foot = `<button class="btn btn-primary" type="button" data-action="adapt-next">${T("Empezar", "Start")}</button>`;
  } else if (F.step === 1 || F.step === 2) {
    const fields = cat.fields.filter((f) => f.step === F.step);
    body = `<form class="stack g5" data-form="adapt" novalidate><div class="stack g1"><h3 class="h-card">${F.step === 1 ? T("Lo esencial", "The essentials") : T("Tus preferencias", "Your preferences")}</h3><p class="muted small">${F.step === 1 ? T("Con esto tu Persohna ya puede empezar.", "That's enough for your Persohna to start.") : T("Opcional. Ayuda a afinar.", "Optional. Helps fine-tune.")}</p></div>${fields.map((f) => fieldHTML(f, F.data, F.errors)).join("")}</form>`;
    foot = `<button class="btn btn-primary" type="button" data-action="adapt-next">${F.step === 2 ? T("Revisar", "Review") : T("Continuar", "Continue")}</button>`;
  } else if (F.step === 3) {
    const rows = cat.fields.map((f) => [L(f.label).replace(/[¿?]/g, "").replace(/ \((opcional|optional)\)/, ""), showVal(f, F.data[f.k])]);
    body = `<div class="stack g4"><div class="stack g1"><h3 class="h-card">${esc(cat.title(F.data))}</h3><p class="muted small">${T("Revisa antes de guardar.", "Check before saving.")}</p></div>
      <dl class="summary">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v ? esc(v) : '<span class="muted">—</span>'}</dd></div>`).join("")}</dl>
      <button class="btn btn-ghost" type="button" data-action="adapt-edit" style="align-self:flex-start">${ico("edit")}${T("Cambiar algo", "Change something")}</button>
      <div class="note">${ico("info")}<span>${T("Tu Persohna guarda el objetivo y te prepara un plan paso a paso. La búsqueda automática se activa por orden de llegada.", "Your Persohna saves the goal and builds a step-by-step plan. Automatic search is switching on in sign-up order.")}</span></div></div>`;
    foot = `<button class="btn btn-primary" type="button" data-action="adapt-confirm">${F.goalId ? T("Guardar cambios", "Save changes") : T("Guardar objetivo", "Save goal")}</button>`;
  } else {
    const g = S.goals.find((x) => x.id === F.savedId);
    body = `<div class="stack g4" style="align-items:center;text-align:center;padding-top:var(--s6)">${avatar(person("me"), "lg", "wave")}<h3 class="h-screen" style="font-size:26px">${F.goalId ? T("Objetivo actualizado", "Goal updated") : T("¡Hecho! Ya estoy en ello", "Done! I'm on it")}</h3>
      ${g ? `<div class="goal-row" style="max-width:420px">${catIcon(F.cat)}<span class="grow stack g1" style="text-align:left"><strong>${esc(g.title)}</strong><span>${statusTag(goalStatus(g))}</span></span></div>` : ""}
      <p class="muted">${T("Te he preparado un plan. Lo verás en Inicio.", "I've built you a plan. You'll find it on Home.")}</p></div>`;
    foot = `<button class="btn btn-secondary" type="button" data-action="close">${F.postId ? T("Seguir explorando", "Keep exploring") : T("Cerrar", "Close")}</button><button class="btn btn-primary" type="button" data-action="adapt-to-home">${T("Ver mi plan", "See my plan")}</button>`;
  }
  return `${sheetHead(title, { back: backAct })}${progress}<div class="sheet-body">${body}</div><div class="sheet-foot">${foot}</div>`;
}
function showVal(f, v) {
  if (v == null || v === "" || (Array.isArray(v) && !v.length)) return "";
  if (f.type === "number") return fmtMoney(v);
  if (f.type === "chips") return v.map((x) => L(f.opts.find((o) => optValue(o) === x)) || x).join(", ");
  if (f.type === "select") return L(f.opts.find((o) => optValue(o) === v)) || v;
  if (f.type === "date") return fmtDate(v);
  return String(v);
}
function fieldHTML(f, data, errors) {
  const v = data[f.k], err = errors[f.k], id = "f-" + f.k;
  const inv = err ? `aria-invalid="true" aria-describedby="${id}-err"` : "";
  const ph = esc(L(f.ph) || "");
  let ctl = "";
  if (f.type === "text") ctl = `<input class="input" id="${id}" name="${f.k}" value="${esc(v || "")}" placeholder="${ph}" ${inv} autocomplete="off" enterkeyhint="next">`;
  if (f.type === "number") ctl = `<div class="with-unit"><input class="input" id="${id}" name="${f.k}" inputmode="numeric" value="${esc(v || "")}" placeholder="${ph}" ${inv} enterkeyhint="next"><span class="unit" aria-hidden="true">${f.unit}</span></div>`;
  if (f.type === "date") ctl = `<input class="input" type="date" id="${id}" name="${f.k}" value="${esc(v || "")}" ${inv}>`;
  if (f.type === "select") ctl = `<div class="chips wrapchips" role="radiogroup" aria-labelledby="${id}-l">${f.opts.map((o) => `<button class="chip" type="button" role="radio" data-action="pick" data-k="${f.k}" data-v="${esc(optValue(o))}" aria-checked="${v === optValue(o)}">${esc(optLabel(o))}</button>`).join("")}</div>`;
  if (f.type === "chips" || f.type === "select") {
    const sel = Array.isArray(v) ? v : [];
    const inner = f.type === "chips" ? `<div class="chips wrapchips">${f.opts.map((o) => `<button class="chip" type="button" data-action="chip-toggle" data-k="${f.k}" data-v="${esc(optValue(o))}" aria-pressed="${sel.includes(optValue(o))}">${esc(optLabel(o))}</button>`).join("")}</div>` : ctl;
    return `<div class="field" data-field="${f.k}"><span class="lbl" id="${id}-l">${esc(L(f.label))}</span>${inner}${err ? `<p class="err" id="${id}-err">${esc(err)}</p>` : ""}</div>`;
  }
  return `<div class="field"><label for="${id}">${esc(L(f.label))}</label>${ctl}${err ? `<p class="err" id="${id}-err">${esc(err)}</p>` : ""}</div>`;
}
function readFormInto(form, data) { if (!form) return; form.querySelectorAll("input,textarea,select").forEach((el) => { data[el.name] = el.value.trim(); }); }
function readForm() { readFormInto(topLayer()?.querySelector('[data-form="adapt"]'), F.data); }
function validateFields(fields, data) {
  const errors = {};
  fields.forEach((f) => {
    const v = data[f.k];
    if (f.req && !String(v ?? "").trim()) errors[f.k] = T("Este dato es necesario.", "This is required.");
    else if (f.type === "number" && v && isNaN(+String(v).replace(/[.,\s]/g, ""))) errors[f.k] = T("Escribe solo el número.", "Numbers only, please.");
    else if (f.type === "number" && v) data[f.k] = String(+String(v).replace(/[.,\s]/g, ""));
  });
  return errors;
}
function validateStep() { F.errors = validateFields(CATS[F.cat].fields.filter((f) => f.step === F.step), F.data); return !Object.keys(F.errors).length; }
function createGoal(cat, data, from) {
  const g = { id: uid(), cat, title: CATS[cat].title(data), prefs: data, from, at: today(), done: false, steps: [] };
  S.goals.unshift(g);
  addHistory(`Nuevo objetivo: ${g.title}`, `New goal: ${g.title}`);
  notify(`Tu Persohna tiene un plan para «${g.title}»`, `Your Persohna has a plan for “${g.title}”`, g.id);
  return g;
}
function confirmAdapt() {
  const cat = CATS[F.cat];
  if (F.goalId) { const g = S.goals.find((x) => x.id === F.goalId); if (g) { g.prefs = F.data; g.title = cat.title(F.data); } F.savedId = F.goalId; }
  else { F.savedId = createGoal(F.cat, F.data, F.postId).id; }
  save(); buzz();
  F.step = 4; setLayer(adaptHTML());
  render({ keepScroll: true });
}

// 7c. Detalle de objetivo con plan
function openGoal(id) {
  const g = S.goals.find((x) => x.id === id); if (!g) return;
  openLayer(goalHTML(g), { label: T("Objetivo", "Goal") });
}
function goalHTML(g) {
  const st = goalStatus(g), cat = CATS[g.cat];
  const rows = cat ? cat.fields.map((f) => [L(f.label).replace(/[¿?]/g, "").replace(/ \((opcional|optional)\)/, ""), showVal(f, g.prefs?.[f.k])]) : [];
  const src = g.from ? findPost(g.from) : null;
  const steps = planOf(g), done = planDone(g);
  return `${sheetHead(T("Objetivo", "Goal"))}<div class="sheet-body stack g4" data-goal="${g.id}">
    <div class="row g3">${catIcon(g.cat)}<div class="grow"><h3 class="h-card">${esc(g.title)}</h3><div class="post-meta">${T("Creado el", "Created")} ${fmtDate(g.at)}</div></div></div>
    <div>${statusTag(st)}</div>
    ${src ? `<p class="muted small">${T("Inspirado en", "Inspired by")} ${esc(person(src.who).name)}: «${esc(L(src.title))}»</p>` : ""}
    <div class="stack g2"><div class="row between"><div class="section-title">${g.plan ? T("Plan a medida", "Tailored plan") : T("Plan", "Plan")}</div>${g.planBusy ? `<span class="post-meta">${T("Creando plan…", "Building plan…")}</span>` : g.done ? "" : `<button class="btn btn-ghost btn-sm" type="button" data-action="ai-plan" data-id="${g.id}">${ico("sparkle")}${g.plan ? T("Rehacer con IA", "Redo with AI") : T("Plan a medida con IA", "Tailored plan with AI")}</button>`}</div>
      ${steps.length ? `<ul class="plan">${steps.map((s, i) => `<li><button type="button" class="plan-step" data-action="step" data-id="${g.id}" data-i="${i}" aria-pressed="${done[i]}" ${i === 0 && st !== "needs" && !g.plan ? "disabled" : ""}><span class="box">${done[i] ? ico("check") : ""}</span><span>${esc(s)}</span></button>${stepAction(g, i) && !done[i] ? `<button class="btn btn-secondary btn-sm step-act" type="button" data-action="cv">${T("Subir o pegar CV", "Upload or paste CV")}</button>` : ""}</li>`).join("")}</ul>` : `<p class="muted small">${T("Pulsa «Plan a medida con IA» y te preparo los pasos.", "Tap “Tailored plan with AI” and I'll build the steps.")}</p>`}
      ${g.tip ? `<p class="note">${ico("info")}<span>${esc(g.tip)}</span></p>` : ""}
      ${g.plan && !g.done ? `<button class="link-btn small" type="button" data-action="plan-reset" data-id="${g.id}" style="align-self:flex-start">${T("Volver al plan estándar", "Back to the standard plan")}</button>` : ""}</div>
    ${g.cat === "trabajo" ? `<button class="goal-row" type="button" data-action="cv" data-v="${S.cv?.text ? "tailor" : "edit"}"><img src="/icons/trabajo.webp" alt="" width="40" height="40"><span class="grow stack g1"><strong>${S.cv?.text ? T("Adaptar tu CV a una oferta", "Tailor your CV to a job") : T("Sube tu CV", "Upload your CV")}</strong><span class="post-meta">${S.cv?.text ? T("Encaje, carta y preguntas de entrevista", "Fit, cover letter and interview questions") : T("PDF, Word o texto", "PDF, Word or text")}</span></span>${ico("chev", "chev")}</button>` : ""}
    ${cat ? `<details class="prefs"><summary>${T("Tus datos", "Your details")}</summary><dl class="summary">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v ? esc(v) : `<span class="muted">${T("Falta", "Missing")}</span>`}</dd></div>`).join("")}</dl></details>` :
      `<form class="field" data-form="goal-notes" data-id="${g.id}" novalidate><label for="g-notes">${T("¿Qué necesitas para conseguirlo?", "What do you need to get there?")}</label><textarea class="textarea" id="g-notes" placeholder="${T("Cuéntale a tu Persohna los detalles", "Tell your Persohna the details")}">${esc(g.notes || "")}</textarea><button class="btn btn-secondary" type="submit">${T("Guardar notas", "Save notes")}</button></form>`}
    ${st === "done" ? `<div class="note">${ico("info")}<span>${T("Lo marcaste como conseguido.", "You marked it as achieved.")}</span></div>` : st === "needs" ? `<div class="note">${ico("info")}<span>${T("Completa los datos que faltan para que quede en marcha.", "Fill in the missing details to get it going.")}</span></div>` : ""}
    ${g.done ? "" : `<button class="btn btn-secondary" type="button" data-action="goal-chat" data-id="${g.id}">${ico("face")}${T("Hablar de esto con mi Persohna", "Talk about this with my Persohna")}</button>`}
  </div><div class="sheet-foot" style="flex-wrap:wrap">
    ${cat && !g.done ? `<button class="btn btn-secondary" type="button" data-action="edit-goal" data-id="${g.id}">${ico("edit")}${T("Editar", "Edit")}</button>` : ""}
    ${!g.done && st === "ready" ? `<button class="btn btn-primary" type="button" data-action="complete-goal" data-id="${g.id}">${ico("check")}${T("Lo conseguí", "I got it")}</button>` : ""}
    <button class="btn btn-ghost" type="button" data-action="delete-goal" data-id="${g.id}" style="flex:0 0 auto;color:var(--danger)">${ico("trash")}${T("Eliminar", "Delete")}</button>
  </div>`;
}

// 7d. Compartir: experiencia o pregunta
let SH = null;
function startShare(kind = "personal") {
  SH = { step: 1, data: { cat: S.goals[0]?.cat && S.goals[0].cat !== "otro" ? S.goals[0].cat : "vivienda", kind, when: "0", commercial: false, title: "", sample: "", context: "" }, errors: {} };
  openLayer(shareHTML(), { full: true, label: T("Compartir", "Share") });
}
function shareHTML() {
  const d = SH.data, q = d.kind === "question";
  const prog = `<div class="progress" aria-hidden="true">${[1, 2, 3].map((i) => `<span class="${i <= SH.step ? "on" : ""}"></span>`).join("")}</div>`;
  let body = "", foot = "";
  if (SH.step === 1) {
    const e = SH.errors;
    body = `<form class="stack g5" data-form="share" novalidate>
      <div class="seg" role="radiogroup" aria-label="${T("Tipo", "Type")}"><button type="button" role="radio" aria-checked="${!q}" data-action="share-kind" data-v="personal">${T("Algo que me funcionó", "Something that worked")}</button><button type="button" role="radio" aria-checked="${q}" data-action="share-kind" data-v="question">${T("Una pregunta", "A question")}</button></div>
      <div class="field"><label for="s-title">${q ? T("¿Qué quieres saber?", "What do you want to know?") : T("¿Qué conseguiste o descubriste?", "What did you get or discover?")}</label><input class="input" id="s-title" name="title" maxlength="140" value="${esc(d.title)}" placeholder="${q ? T("Ej.: ¿Merece la pena el barrio de Triana para vivir?", "E.g. Is Shoreditch worth living in?") : T("Ej.: Encontré piso con terraza por 690 €/mes", "E.g. Found a flat with a terrace for €690/month")}" ${e.title ? 'aria-invalid="true" aria-describedby="s-title-err"' : ""}>${e.title ? `<p class="err" id="s-title-err">${esc(e.title)}</p>` : ""}</div>
      <div class="field"><label for="s-cat">${T("Tema", "Topic")}</label><select class="select" id="s-cat" name="cat">${CAT_ALL.map((c) => `<option value="${c}" ${d.cat === c ? "selected" : ""}>${esc(L(CATS[c].label))}</option>`).join("")}</select></div>
      ${q ? "" : `<div class="field"><label for="s-sample">${T("Una muestra útil (opcional)", "A useful sample (optional)")}</label><textarea class="textarea" id="s-sample" name="sample" placeholder="${T("Una línea por dato. Ej.: 2 dormitorios · 690 €/mes", "One line per item. E.g. 2 beds · €690/month")}">${esc(d.sample)}</textarea><p class="hint">${T("Hasta 3 líneas aparecerán en la tarjeta.", "Up to 3 lines will show on the card.")}</p></div>`}
      <div class="field"><label for="s-context">${T("Contexto (opcional)", "Context (optional)")}</label><input class="input" id="s-context" name="context" maxlength="160" value="${esc(d.context)}" placeholder="${T("Ej.: presupuesto, zona, para quién", "E.g. budget, area, who for")}"></div>
      ${q ? "" : `<div class="field"><label for="s-when">${T("¿Cuándo ocurrió?", "When did it happen?")}</label><select class="select" id="s-when" name="when">${[["0", T("Hoy", "Today")], ["3", T("Esta semana", "This week")], ["14", T("Este mes", "This month")], ["60", T("Hace más tiempo", "Longer ago")]].map(([v, l]) => `<option value="${v}" ${d.when === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>
      <fieldset class="stack g2" style="border:0;padding:0;margin:0"><legend class="lbl" style="font-weight:700;margin-bottom:8px">${T("¿De dónde sale?", "Where does it come from?")}</legend>
        <label class="radio-card"><input type="radio" name="kind" value="personal" ${d.kind === "personal" ? "checked" : ""}><span><strong>${T("Experiencia personal", "Personal experience")}</strong><br><span class="muted small">${T("Lo viví yo.", "I lived it.")}</span></span></label>
        <label class="radio-card"><input type="radio" name="kind" value="confirmed" ${d.kind === "confirmed" ? "checked" : ""}><span><strong>${T("Información confirmada", "Verified info")}</strong><br><span class="muted small">${T("Lo he comprobado con una fuente o documento.", "I checked it with a source or document.")}</span></span></label>
      </fieldset>
      <label class="check"><input type="checkbox" name="commercial" ${d.commercial ? "checked" : ""}><span>${T("Tengo una relación comercial con lo que recomiendo (comisión, patrocinio…).", "I have a commercial relationship with what I recommend (commission, sponsorship…).")} <span class="muted small">${T("Se mostrará en la publicación.", "It will be shown on the post.")}</span></span></label>`}
    </form>`;
    foot = `<button class="btn btn-primary" type="button" data-action="share-next">${T("Ver vista previa", "Preview")}</button>`;
  } else if (SH.step === 2) {
    body = `<div class="stack g4"><p class="muted">${T("Así lo verán otras personas:", "This is how others will see it:")}</p>${postCard(previewPost(), { noActions: true })}<div class="note">${ico("lock")}<span>${T("Solo se publica esto. Tus objetivos y conversaciones siguen siendo privados.", "Only this is published. Your goals and chats stay private.")}</span></div></div>`;
    foot = `<button class="btn btn-secondary" type="button" data-action="share-back">${T("Editar", "Edit")}</button><button class="btn btn-primary" type="button" data-action="share-confirm">${T("Publicar", "Publish")}</button>`;
  } else {
    body = `<div class="stack g4" style="align-items:center;text-align:center;padding-top:var(--s6)">${avatar(person("me"), "lg", "wave")}<h3 class="h-screen" style="font-size:26px">${T("Publicado", "Published")}</h3><p class="muted">${q ? T("Tu pregunta ya está en Descubrir.", "Your question is now in Discover.") : T("Ya aparece en Descubrir y en tu perfil. +25 puntos de reputación.", "It's now in Discover and on your profile. +25 reputation points.")}</p><p class="hint">${T("En esta beta solo lo ves tú, en este dispositivo.", "In this beta only you see it, on this device.")}</p></div>`;
    foot = `<button class="btn btn-secondary" type="button" data-action="close">${T("Cerrar", "Close")}</button><button class="btn btn-primary" type="button" data-action="share-see">${T("Verlo en Descubrir", "See it in Discover")}</button>`;
  }
  return `${sheetHead(T("Compartir", "Share"), { back: SH.step === 2 ? "share-back" : false })}${SH.step < 3 ? prog : ""}<div class="sheet-body">${body}</div><div class="sheet-foot">${foot}</div>`;
}
function readShare() {
  const f = topLayer()?.querySelector('[data-form="share"]'); if (!f) return;
  const d = SH.data;
  d.title = f.title.value.trim(); d.cat = f.cat.value; d.context = f.context.value.trim();
  if (d.kind !== "question") { d.sample = f.sample.value; d.when = f.when.value; d.kind = f.querySelector('input[name="kind"]:checked')?.value || "personal"; d.commercial = f.commercial.checked; }
}
function previewPost() {
  const d = SH.data, q = d.kind === "question";
  return { id: "preview", who: "me", cat: d.cat, title: d.title.replace(/^«|»$/g, ""), sample: q ? [] : d.sample.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 3), context: d.context, at: daysAgo(+d.when || 0), kind: d.kind, commercial: !q && d.commercial };
}

// 7e. Varios
function openLevel() {
  const Lv = level(), inL = xpInLevel();
  openLayer(`${sheetHead(`${T("Nivel", "Level")} ${Lv}`)}<div class="sheet-body stack g4">
    <p>${T("Tu nivel (de 0 a 100) refleja <strong>aportaciones útiles</strong>: contar lo que te pasó, responder preguntas, confirmar si algo funciona. Sube cuando ayudas; tú decides si se muestra.", "Your level (0 to 100) reflects <strong>useful contributions</strong>: sharing what happened, answering questions, confirming whether something works. It goes up when you help; you choose whether it shows.")}</p>
    <div class="stack g2"><div class="row between small"><span>${T("Siguiente: nivel", "Next: level")} ${Lv + 1}</span><span class="muted">${T("faltan", "")} ${XP_PER - inL} ${T("puntos", "points to go")}</span></div><div class="meter" aria-hidden="true"><i style="width:${(inL / XP_PER) * 100}%"></i></div></div>
    <div class="stack g2"><div class="section-title">${T("Lo respaldan", "Backed by")}</div>${S.myPosts.length ? `<ul class="timeline">${S.myPosts.map((p) => `<li><span class="dot" aria-hidden="true"></span><div>${esc(p.title)} <span class="muted small">· +${p.kind === "question" ? 0 : 25}</span></div></li>`).join("")}</ul>` : `<p class="muted">${T("Todavía ninguna aportación. Comparte una experiencia para empezar.", "No contributions yet. Share an experience to start.")}</p>`}</div>
    <div class="stack g2"><div class="section-title">${T("Lo que desbloquea", "What it unlocks")}</div><p class="muted small">${T("Marcos para tu Persohna (doble en nivel 2, bosque en nivel 4) y, pronto, más visibilidad para tus aportaciones. Tu cara nunca cambia sola.", "Frames for your Persohna (double at level 2, forest at level 4) and, soon, more reach for your posts. Your face never changes on its own.")}</p></div>
    <div class="note warn">${ico("info")}<span>${T("Un nivel alto no garantiza que una respuesta de la IA sea correcta.", "A high level doesn't guarantee an AI answer is right.")}</span></div>
  </div><div class="sheet-foot"><button class="btn btn-secondary" type="button" data-action="close">${T("Entendido", "Got it")}</button><button class="btn btn-primary" type="button" data-action="share-from-level">${T("Compartir", "Share")}</button></div>`, { label: T("Nivel", "Level") });
}
function openNewGoalPicker() {
  openLayer(`${sheetHead(T("Nuevo objetivo", "New goal"))}<div class="sheet-body stack g3"><p class="muted">${T("¿Qué quieres conseguir?", "What do you want to get?")}</p><div class="sugs">${CAT_ORDER.map((c) => `<button class="sug" type="button" data-action="new-goal" data-cat="${c}">${catIcon(c)}<span>${esc(L(CATS[c].verb))}</span></button>`).join("")}</div><p class="section-title" style="margin-top:var(--s3)">${T("Más objetivos", "More goals")}</p><div class="cat-grid sm">${CAT_MORE.map((c) => `<button class="cat-cell" type="button" data-action="new-goal" data-cat="${c}"><img src="${iconSrc(c)}" alt="" width="112" height="112" loading="lazy"><span>${esc(L(CATS[c].label))}</span></button>`).join("")}</div></div>`, { label: T("Nuevo objetivo", "New goal") });
}
function openEditProfile() {
  openLayer(`${sheetHead(T("Editar perfil", "Edit profile"))}<form class="sheet-body stack g4" data-form="profile" novalidate>
    <div class="field"><label for="pf-name">${T("Nombre", "Name")}</label><input class="input" id="pf-name" name="name" maxlength="30" value="${esc(S.me.name)}"><p class="err" id="pf-err" hidden></p></div>
    <div class="field"><label for="pf-bio">${T("Presentación breve", "Short bio")}</label><textarea class="textarea" id="pf-bio" name="bio" maxlength="160" placeholder="${T("Qué te interesa, qué te gusta compartir", "What you're into, what you like to share")}">${esc(S.me.bio || "")}</textarea><p class="hint">${T("Máximo 160 caracteres.", "Up to 160 characters.")}</p></div>
    <button class="btn btn-ghost" type="button" data-action="go-look" style="align-self:flex-start">${T("Cambiar la cara de mi Persohna", "Change my Persohna's face")}</button>
  </form><div class="sheet-foot"><button class="btn btn-secondary" type="button" data-action="close">${T("Cancelar", "Cancel")}</button><button class="btn btn-primary" type="button" data-action="profile-save">${T("Guardar", "Save")}</button></div>`, { label: T("Editar perfil", "Edit profile") });
}
function demoInfo() {
  openLayer(`${sheetHead(T("Beta", "Beta"))}<div class="sheet-body stack g3"><p>${T("Esta versión de Persohna funciona entera en tu navegador:", "This version of Persohna runs entirely in your browser:")}</p>
    <ul style="margin:0;padding-left:20px" class="stack g2"><li>${T("Sin cuenta, tus datos se guardan solo en este dispositivo. Con cuenta, en tu cuenta y en cualquier dispositivo donde entres.", "Without an account your data stays on this device. With an account, it's saved to your account and any device you log into.")}</li><li>${T("El chat, el análisis de CV y los planes a medida usan IA (Claude). Puede equivocarse: revisa lo importante.", "Chat, CV reviews and tailored plans use AI (Claude). It can make mistakes: double-check what matters.")}</li><li>${T("Las personas, publicaciones y niveles de la comunidad son ejemplos.", "Community people, posts and levels are examples.")}</li><li>${T("Tu Persohna organiza objetivos y planes; la búsqueda, los avisos y la negociación automáticos se activan por orden de llegada.", "Your Persohna organises goals and plans; automatic search, alerts and negotiation switch on in sign-up order.")}</li></ul></div>
    <div class="sheet-foot"><button class="btn btn-primary" type="button" data-action="close">${T("Entendido", "Got it")}</button></div>`, { label: "Beta" });
}
function openInbox() {
  const items = S.inbox;
  openLayer(`${sheetHead(T("Avisos", "Updates"))}<div class="sheet-body stack g2">${items.length ? `<ul class="inbox">${items.map((n) => `<li class="${n.read ? "" : "unread"}"><button type="button" data-action="inbox-open" data-link="${esc(n.link)}">${avatar(person("me"), "xs")}<span class="grow stack g1"><span>${esc(L(n))}</span><span class="post-meta">${esc(ago(n.at))}</span></span></button></li>`).join("")}</ul>` : `<div class="empty"><p><strong>${T("Sin avisos todavía.", "No updates yet.")}</strong></p><p class="muted">${T("Aquí te contará tu Persohna lo que vaya haciendo.", "Your Persohna will tell you what it's up to here.")}</p></div>`}</div>`, { label: T("Avisos", "Updates") });
  S.inbox.forEach((n) => (n.read = true)); save(); renderNav();
}
const AI_URL = "https://gmdalfsvtfhzepyrdmjj.supabase.co/functions/v1/persohna-chat";
const AI_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtZGFsZnN2dGZoemVweXJkbWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2Mzc3MjIsImV4cCI6MjA1OTIxMzcyMn0.IIbXzmsRZzBeS6DhTHtYJjQNAFVJMaqb0EnxJbwwMx4";
if (Array.isArray(S.chat)) S.chat = S.chat.filter((m) => !m.pending);
async function askClaude() {
  try {
    const messages = S.chat.filter((m) => !m.pending).slice(-12).map((m) => ({ role: m.from === "me" ? "user" : "assistant", content: m.text ?? L(m) }));
    const context = { name: S.me?.name || "", goals: S.goals.filter((g) => !g.done).slice(0, 5).map((g) => ({ cat: g.cat, title: g.title })) };
    const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 30000);
    const r = await fetch(AI_URL, { method: "POST", signal: ctl.signal, headers: { "content-type": "application/json", apikey: AI_ANON, authorization: `Bearer ${AI_ANON}` }, body: JSON.stringify({ lang: LANG, messages, context }) });
    clearTimeout(to);
    if (!r.ok) return "";
    const d = await r.json(); return (d.reply || "").trim();
  } catch { return ""; }
}
function chatReply(text) {
  const t = text.toLowerCase();
  const map = [["vivienda", /(casa|piso|alquil|vivir|apartamento|hipoteca|home|flat|rent|house|apartment)/], ["eventos", /(entrada|concierto|festival|ticket|gig|concert|artista|evento)/], ["viajes", /(viaj|vuelo|bali|vacacion|hotel|travel|flight|trip)/], ["trabajo", /(trabaj|entrevista|empleo|sueldo|cv|curr|job|interview|salary|career)/], ["aprender", /(examen|aprend|estudi|curso|idioma|exam|learn|study|course)/], ["ahorro", /(luz|factura|gas|móvil|movil|seguro|bill|electric|phone|insurance)/], ["dinero", /(ahorr|invert|dinero|save|invest|money)/], ["salud", /(médic|medic|salud|dentist|doctor|health)/], ["ejercicio", /(gym|gimnas|forma|correr|fitness|deporte)/], ["comida", /(comer|comida|receta|dieta|restaurante|food|recipe)/], ["compras", /(comprar|chollo|lavadora|oferta|shopping|deal)/], ["transporte", /(coche|moto|abono|car |transport)/], ["mascotas", /(perro|gato|mascota|veterin|dog|cat |pet)/], ["tramites", /(trámite|tramite|papeles|pasaporte|dni|nie|paperwork|passport)/], ["negocio", /(negocio|clientes|empresa|business|customers)/]];
  const hit = map.find(([, r]) => r.test(t));
  if (hit) return { from: "p", es: `Entendido: suena a ${CATS[hit[0]].label.es.toLowerCase()}. Lo convierto en un objetivo con plan.`, en: `Got it: sounds like ${CATS[hit[0]].label.en.toLowerCase()}. I'll turn it into a goal with a plan.`, cta: hit[0] };
  return { from: "p", es: "Te leo. Todavía no busco por mi cuenta, pero si me dices si es sobre trabajo, casa, entradas, facturas, viajes o estudios, lo convierto en un objetivo.", en: "Got it. I can't search on my own yet, but tell me if it's about work, home, tickets, bills, travel or study and I'll turn it into a goal." };
}
async function invite() {
  const code = S.me ? (S.me.code ||= uid().slice(0, 6)) : "";
  save();
  const url = `${baseUrl()}?ref=${code}${LANG === "en" ? "&lang=en" : ""}`;
  const r = await shareLink(url, T(`${S.me?.name || "Te"} te invita a Persohna: tu yo digital que trabaja por ti, gratis.`, `${S.me?.name || "You're"} invited you to Persohna: a digital you that works for you, free.`));
  if (r !== "cancel") { S.invites++; if (S.invites === 3) notify("¡3 invitaciones! Pasas antes en el acceso anticipado.", "3 invites! You've moved up the early-access list."); save(); render({ keepScroll: true }); }
}
function exportData() {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "persohna-datos.json"; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function createMe() {
  const o = ui.onb;
  S.me = { name: o.name, face: o.face, frame: "none", bio: "", code: uid().slice(0, 6) };
  addHistory("Nació tu Persohna", "Your Persohna was born");
  notify(`Hola, ${o.name}. Ya estoy en marcha.`, `Hi ${o.name}, I'm up and running.`);
  if (o.cat && o.cat !== "otro") createGoal(o.cat, o.data || {}, o.from || null);
  S.welcome = true;
  touchStreak(); save(); buzz();
  ui.onb = { step: 0, cat: null, data: {}, face: randomFace(), name: "", err: "" };
  if (o.cat === "otro") { location.hash = "#/persohna"; ui.seg = "conversacion"; } else { location.hash = "#/inicio"; }
  onRoute();
}

// ---------- 8. Eventos ----------
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-action]"); if (!b) return;
  const a = b.dataset.action, id = b.dataset.id;
  switch (a) {
    case "close": closeLayer(); break;
    case "demo-info": demoInfo(); break;
    case "go": go(b.dataset.to); break;
    case "lang": setLang(LANG === "es" ? "en" : "es"); render({ keepScroll: true }); if (stackLayers.length) closeAll(); break;
    case "set-lang": setLang(b.dataset.v); render({ keepScroll: true }); break;
    case "inbox": e.preventDefault(); openInbox(); break;
    case "inbox-open": { closeLayer(); const g = S.goals.find((x) => x.id === b.dataset.link); if (g) openGoal(g.id); break; }
    // landing + onboarding
    case "start-cat": e.preventDefault(); if (S.me) { if (b.dataset.cat === "otro") go("descubrir"); else { go("inicio"); startAdapt({ cat: b.dataset.cat }); } break; }
      ui.onb = { ...ui.onb, step: b.dataset.cat === "otro" ? 2 : 1, cat: b.dataset.cat, data: {} }; go("empezar"); break;
    case "onb-goal": ui.onb.cat = b.dataset.cat; ui.onb.data = ui.onb.data || {}; ui.onb.errors = {}; ui.onb.step = b.dataset.cat === "otro" ? 2 : 1; buzz(); render(); window.scrollTo(0, 0); $("#main h1")?.focus?.(); break;
    case "onb-next": {
      const o = ui.onb; const form = $('[data-form="onb-details"]'); readFormInto(form, o.data);
      o.errors = validateFields(CATS[o.cat].fields.filter((f) => f.step === 1), o.data);
      if (Object.keys(o.errors).length) { render(); $('#main [aria-invalid="true"]')?.focus(); return; }
      o.step = 2; render(); window.scrollTo(0, 0); $("#onb-name")?.focus(); break;
    }
    case "onb-skip": readFormInto($('[data-form="onb-details"]'), ui.onb.data); ui.onb.errors = {}; ui.onb.step = 2; render(); $("#onb-name")?.focus(); break;
    case "onb-back": { const o = ui.onb; if (o.step === 2) o.name = $("#onb-name")?.value.trim() || o.name; if (o.step === 1) readFormInto($('[data-form="onb-details"]'), o.data); o.step = o.step === 2 && (!o.cat || o.cat === "otro") ? 0 : Math.max(0, o.step - 1); render(); break; }
    case "onb-face": ui.onb.face = b.dataset.v; ui.onb.name = $("#onb-name")?.value.trim() || ui.onb.name; render(); $(".face-pick")?.setAttribute("open", ""); $(`[data-action="onb-face"][data-v="${b.dataset.v}"]`)?.focus({ preventScroll: true }); break;
    case "onb-shuffle": { ui.onb.name = $("#onb-name")?.value.trim() || ui.onb.name; let f; do { f = randomFace(); } while (f === ui.onb.face); ui.onb.face = f; render(); $(".shuffle")?.focus(); buzz(); break; }
    case "onb-create": {
      const v = $("#onb-name")?.value.trim() || ""; ui.onb.name = v;
      if (!v) { ui.onb.err = T("Escribe tu nombre para continuar.", "Enter your name to continue."); render(); $("#onb-name")?.focus(); return; }
      ui.onb.err = ""; createMe(); break;
    }
    case "pick": {
      const k = b.dataset.k, v = b.dataset.v, data = stackLayers.length && F ? F.data : ui.onb.data;
      if (stackLayers.length && F) readForm(); else readFormInto($('[data-form="onb-details"]'), ui.onb.data);
      data[k] = data[k] === v ? "" : v;
      b.closest(".chips").querySelectorAll("[data-action=pick]").forEach((x) => x.setAttribute("aria-checked", x.dataset.v === data[k]));
      b.closest(".field")?.querySelector(".err")?.remove(); break;
    }
    // home
    case "wave": { const av = b.querySelector(".av"); av.classList.remove("wave"); void av.offsetWidth; av.classList.add("wave"); buzz(); break; }
    case "dismiss-welcome": S.welcome = false; save(); render({ keepScroll: true }); break;
    case "invite": invite(); break;
    case "new-goal": closeAll(); startAdapt({ cat: b.dataset.cat }); break;
    case "new-goal-picker": openNewGoalPicker(); break;
    case "open-goal": openGoal(id); break;
    case "goal-chat": { const g = S.goals.find((x) => x.id === id); closeAll(); ui.seg = "conversacion"; go("persohna"); setTimeout(() => { const ta = $("#chat-in"); if (ta && g) { ta.value = T(`Ayúdame con mi objetivo «${g.title}». ¿Qué hago primero?`, `Help me with my goal “${g.title}”. What should I do first?`); ta.focus(); } }, 80); break; }
    case "edit-goal": closeAll(); startAdapt({ goalId: id }); F.step = 1; setLayer(adaptHTML()); break;
    case "step": {
      const g = S.goals.find((x) => x.id === id); if (!g) return;
      const i = +b.dataset.i; g.steps = g.steps || []; g.steps[i] = !planDone(g)[i]; save(); buzz();
      if (g.steps[i]) toast(T("Paso hecho", "Step done"));
      if (stackLayers.length) setLayer(goalHTML(g)); render({ keepScroll: true }); break;
    }
    case "complete-goal": {
      const g = S.goals.find((x) => x.id === id); if (!g) return;
      const ok = await confirmDialog({ title: T("¿Lo conseguiste?", "Did you get it?"), text: T(`Marcaremos «${g.title}» como conseguido.`, `We'll mark “${g.title}” as achieved.`), ok: T("Sí, lo conseguí", "Yes, I got it") });
      if (!ok) return;
      g.done = true; addHistory(`Conseguido: ${g.title}`, `Achieved: ${g.title}`); save(); closeAll(); render({ keepScroll: true });
      toast(T("¡Enhorabuena! ¿Lo compartes para ayudar a otros?", "Congrats! Share it to help others?"), { label: T("Compartir", "Share"), fn: () => startShare() });
      break;
    }
    case "delete-goal": {
      const g = S.goals.find((x) => x.id === id); if (!g) return;
      const ok = await confirmDialog({ title: T("Eliminar objetivo", "Delete goal"), text: T(`Se borrará «${g.title}» y su plan.`, `“${g.title}” and its plan will be deleted.`), ok: T("Eliminar", "Delete"), danger: true });
      if (!ok) return;
      const idx = S.goals.indexOf(g); S.goals.splice(idx, 1); save(); closeAll(); render({ keepScroll: true });
      toast(T("Objetivo eliminado", "Goal deleted"), { label: T("Deshacer", "Undo"), fn: () => { S.goals.splice(idx, 0, g); save(); render({ keepScroll: true }); } });
      break;
    }
    // descubrir
    case "filter": ui.filter = b.dataset.cat; closeAll(); if (ui.route !== "descubrir") go("descubrir"); else { render({ keepScroll: true }); $(`[data-action="filter"][data-cat="${b.dataset.cat}"]`)?.focus({ preventScroll: true }); } break;
    case "clear-search": ui.q = ""; ui.filter = "todo"; render(); break;
    case "recent": ui.q = b.dataset.q; render(); $("#q")?.focus(); break;
    case "ask-community": startShare("question"); setTimeout(() => { const i = $("#s-title"); if (i && ui.q) i.value = ui.q; }, 40); break;
    case "open-post": openPost(id); break;
    case "share-post": { const p = findPost(id); shareLink(`${baseUrl()}#/p/${id}`, p ? L(p.title) : "Persohna"); break; }
    case "toggle-save": {
      if (!S.me) { toast(T("Crea tu Persohna para guardar", "Create your Persohna to save"), { label: T("Crear", "Create"), fn: () => { closeAll(); go("empezar"); } }); return; }
      const on = !S.saved.includes(id);
      S.saved = on ? [...S.saved, id] : S.saved.filter((x) => x !== id); save(); buzz();
      document.querySelectorAll(`[data-action="toggle-save"][data-id="${id}"]`).forEach((el) => { el.setAttribute("aria-pressed", on); el.setAttribute("aria-label", on ? T("Quitar de guardados", "Remove from saved") : T("Guardar", "Save")); el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); });
      toast(on ? T("Guardado", "Saved") : T("Quitado de guardados", "Removed"), on ? { label: T("Ver guardados", "See saved"), fn: () => { closeAll(); ui.filter = "guardados"; go("descubrir"); render(); } } : null);
      if (ui.route === "descubrir" && !stackLayers.length && ui.filter === "guardados") render({ keepScroll: true });
      else if (ui.route === "descubrir") { $("#ctx").innerHTML = ctxPanel(); const chip = $('[data-action="filter"][data-cat="guardados"]'); if (chip) chip.textContent = `${T("Guardados", "Saved")}${S.saved.length ? " · " + S.saved.length : ""}`; }
      break;
    }
    case "adapt": startAdapt({ postId: id }); break;
    case "mark": { const m = (S.marks[id] = S.marks[id] || {}); m[b.dataset.k] = !m[b.dataset.k]; save(); b.setAttribute("aria-pressed", m[b.dataset.k]); toast(m[b.dataset.k] ? T("Anotado, gracias", "Noted, thanks") : T("Quitado", "Removed")); break; }
    case "report": { const on = !S.reports.includes(id); S.reports = on ? [...S.reports, id] : S.reports.filter((x) => x !== id); save(); b.setAttribute("aria-pressed", on); toast(on ? T("Gracias: lo marcamos para revisar", "Thanks: flagged for review") : T("Aviso retirado", "Flag removed")); break; }
    case "propose": {
      if (!S.me) { closeAll(); go("empezar"); return; }
      const p = findPost(id), q = p?.kind === "question";
      openLayer(`${sheetHead(q ? T("Responder", "Answer") : T("Proponer una mejora", "Suggest an improvement"))}<form class="sheet-body stack g3" data-form="proposal" data-id="${id}" novalidate><div class="field"><label for="pr-t">${q ? T("¿Qué sabes de esto?", "What do you know about this?") : T("¿Qué añadirías o cambiarías?", "What would you add or change?")}</label><textarea class="textarea" id="pr-t" maxlength="400" placeholder="${q ? T("Cuenta lo que viviste, con datos si puedes", "Share what you lived, with numbers if you can") : T("Ej.: también conviene preguntar por la comunidad de vecinos", "E.g. also ask about building fees")}"></textarea><p class="err" id="pr-err" hidden></p></div><p class="hint">${T("Responder suma 10 puntos. En esta beta se guarda solo en tu dispositivo.", "Answering earns 10 points. In this beta it's stored only on your device.")}</p></form><div class="sheet-foot"><button class="btn btn-secondary" type="button" data-action="close">${T("Cancelar", "Cancel")}</button><button class="btn btn-primary" type="button" data-action="proposal-send" data-id="${id}">${T("Enviar", "Send")}</button></div>`, { label: T("Responder", "Answer") });
      break;
    }
    case "proposal-send": {
      const t = $("#pr-t"); const v = t.value.trim();
      if (!v) { $("#pr-err").hidden = false; $("#pr-err").textContent = T("Escribe tu respuesta.", "Write your answer."); t.setAttribute("aria-invalid", "true"); t.setAttribute("aria-describedby", "pr-err"); t.focus(); return; }
      S.proposals.push({ id, text: v, at: today() }); S.xp += 10; addHistory("Ayudaste respondiendo a la comunidad", "You helped by answering the community"); save(); closeLayer(); toast(T("Enviado · +10 puntos", "Sent · +10 points"));
      break;
    }
    // adapt flow
    case "adapt-next": {
      if (F.step === 1 || F.step === 2) { readForm(); if (!validateStep()) { setLayer(adaptHTML()); topLayer().querySelector('[aria-invalid="true"],.err')?.closest(".field")?.querySelector("input,button")?.focus(); return; } }
      F.step = F.step === 2 ? 3 : F.step + 1; setLayer(adaptHTML()); break;
    }
    case "adapt-back": if (F.step === 1 || F.step === 2) readForm(); F.errors = {}; F.step = Math.max(F.postId ? 0 : 1, F.step - 1); setLayer(adaptHTML()); break;
    case "adapt-edit": F.step = 1; setLayer(adaptHTML()); break;
    case "adapt-confirm": confirmAdapt(); break;
    case "adapt-to-home": closeAll(); go("inicio"); window.scrollTo(0, 0); break;
    case "chip-toggle": {
      const data = stackLayers.length && F ? F.data : ui.onb.data;
      if (stackLayers.length && F) readForm();
      const k = b.dataset.k, v = b.dataset.v; const arr = Array.isArray(data[k]) ? data[k] : [];
      data[k] = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
      b.setAttribute("aria-pressed", data[k].includes(v)); break;
    }
    // mi persohna
    case "seg": ui.seg = b.dataset.seg; if (ui.seg !== "apariencia") draftLook = null; render({ keepScroll: true }); $(`#tab-${ui.seg}`)?.focus(); break;
    case "autonomy": S.autonomy = b.dataset.v; save(); render({ keepScroll: true }); toast(S.autonomy === "ask" ? T("Te pedirá permiso siempre", "It will always ask you") : T("Actuará y te avisará", "It will act and tell you")); break;
    case "quick": { const ta = $("#chat-in"); if (ta) { ta.value = b.dataset.t; ta.form.requestSubmit(); } break; }
    case "look": {
      if (b.dataset.locked) { toast(T(`Se desbloquea en el nivel ${b.dataset.locked}`, `Unlocks at level ${b.dataset.locked}`)); return; }
      draftLook[b.dataset.k] = b.dataset.v; render({ keepScroll: true }); $(`[data-action="look"][data-k="${b.dataset.k}"][data-v="${b.dataset.v}"]`)?.focus({ preventScroll: true }); break;
    }
    case "look-cancel": draftLook = null; render({ keepScroll: true }); break;
    case "look-save": Object.assign(S.me, draftLook); draftLook = null; addHistory("Cambiaste la apariencia de tu Persohna", "You changed your Persohna's look"); save(); render({ keepScroll: true }); toast(T("Apariencia guardada", "Look saved")); break;
    case "go-look": closeLayer(); ui.seg = "apariencia"; go("persohna"); break;
    case "open-level": openLevel(); break;
    // perfil
    case "edit-profile": openEditProfile(); break;
    case "profile-save": {
      const n = $("#pf-name").value.trim();
      if (!n) { const er = $("#pf-err"); er.hidden = false; er.textContent = T("El nombre no puede estar vacío.", "Name can't be empty."); $("#pf-name").setAttribute("aria-invalid", "true"); $("#pf-name").setAttribute("aria-describedby", "pf-err"); $("#pf-name").focus(); return; }
      S.me.name = n; S.me.bio = $("#pf-bio").value.trim(); save(); closeLayer(); render({ keepScroll: true }); toast(T("Perfil guardado", "Profile saved")); break;
    }
    case "toggle-level": S.showLevel = b.checked; save(); render({ keepScroll: true }); $('[data-action="toggle-level"]')?.focus(); break;
    case "share": startShare(); break;
    case "share-kind": readShare(); SH.data.kind = b.dataset.v; SH.errors = {}; setLayer(shareHTML()); break;
    case "share-from-level": closeLayer(); startShare(); break;
    case "share-next": {
      readShare(); SH.errors = {};
      if (!SH.data.title) SH.errors.title = T("Cuéntalo en una frase.", "Say it in one sentence.");
      else if (SH.data.title.length < 8) SH.errors.title = T("Un poco más de detalle, por favor (mínimo 8 caracteres).", "A bit more detail, please (8+ characters).");
      if (SH.errors.title) { setLayer(shareHTML()); $("#s-title")?.focus(); return; }
      SH.step = 2; setLayer(shareHTML()); break;
    }
    case "share-back": SH.step = 1; setLayer(shareHTML()); break;
    case "share-confirm": {
      const p = previewPost(); p.id = "m" + uid();
      S.myPosts.unshift(p); if (p.kind !== "question") S.xp += 25;
      addHistory(`Compartiste: ${p.title}`, `You shared: ${p.title}`); save(); buzz();
      SH.step = 3; setLayer(shareHTML()); render({ keepScroll: true }); break;
    }
    case "share-see": closeLayer(); ui.filter = "todo"; ui.q = ""; ui.scroll.descubrir = 0; go("descubrir"); break;
    case "delete-post": {
      const ok = await confirmDialog({ title: T("Retirar aportación", "Remove contribution"), text: T("Dejará de verse en Descubrir y en tu perfil.", "It will no longer show in Discover or on your profile."), ok: T("Retirar", "Remove"), danger: true });
      if (!ok) return; S.myPosts = S.myPosts.filter((p) => p.id !== id); save(); render({ keepScroll: true }); toast(T("Aportación retirada", "Contribution removed")); break;
    }
    case "export": exportData(); break;
    case "reset": {
      const ok = await confirmDialog({ title: T("Borrar todo", "Delete everything"), text: typeof loggedIn === "function" && loggedIn() ? T("Se borrarán tu Persohna, objetivos, CV y aportaciones de este dispositivo y de tu cuenta (la cuenta sigue existiendo).", "Your Persohna, goals, CV and contributions will be deleted from this device and your account (the account itself stays).") : T("Se borrará tu Persohna, tus objetivos y tus aportaciones de este dispositivo.", "Your Persohna, goals and contributions will be deleted from this device."), ok: T("Borrar todo", "Delete everything"), danger: true });
      if (!ok) return;
      try { localStorage.removeItem(KEY); localStorage.removeItem("persohna.demo.v1"); } catch {}
      S = fresh(); if (typeof loggedIn === "function" && loggedIn()) api("push", { token: AUTH.token, state: {} }); ui.onb = { step: 0, cat: null, data: {}, face: randomFace(), name: "", err: "" }; ui.filter = "todo"; ui.q = ""; ui.seg = "objetivos";
      location.hash = "#/inicio"; onRoute(); window.scrollTo(0, 0); break;
    }
  }
});

let qT;
document.addEventListener("input", (e) => {
  if (e.target.id === "q") {
    ui.q = e.target.value;
    const feed = $("#feed"); if (!feed) return;
    const tmp = document.createElement("div"); tmp.innerHTML = viewDescubrir();
    feed.innerHTML = tmp.querySelector("#feed").innerHTML;
    clearTimeout(qT); qT = setTimeout(() => { const v = ui.q.trim(); if (v.length > 2 && S.me) { S.recent = [v, ...S.recent.filter((x) => x !== v)].slice(0, 4); save(); } }, 1200);
  }
  if (e.target.id === "onb-name" && ui.onb.err) { ui.onb.err = ""; e.target.removeAttribute("aria-invalid"); $("#onb-err")?.remove(); }
  if (e.target.closest('[data-form="adapt"],[data-form="onb-details"]') && e.target.getAttribute("aria-invalid")) { e.target.removeAttribute("aria-invalid"); $(`#${e.target.id}-err`)?.remove(); }
});
document.addEventListener("submit", (e) => {
  const f = e.target.closest("form"); if (!f) return;
  e.preventDefault();
  const kind = f.dataset.form;
  if (kind === "free-goal") {
    const v = f.t.value.trim(); const err = $("#free-goal-err");
    if (!v) { err.hidden = false; err.textContent = T("Escribe qué quieres conseguir o elige una sugerencia.", "Write what you want or pick a suggestion."); f.t.setAttribute("aria-invalid", "true"); f.t.setAttribute("aria-describedby", "free-goal-err"); f.t.focus(); return; }
    const hit = chatReply(v).cta;
    if (hit) { startAdapt({ cat: hit }); return; }
    const g = { id: uid(), cat: "otro", title: v, prefs: {}, notes: "", at: today(), done: false };
    S.goals.unshift(g); addHistory(`Nuevo objetivo: ${v}`, `New goal: ${v}`); save(); render({ keepScroll: true }); openGoal(g.id);
    f.t.value = ""; if (typeof aiPlan === "function") aiPlan(g);
  }
  if (kind === "onb-name") $('[data-action="onb-create"]')?.click();
  if (kind === "onb-details") $('[data-action="onb-next"]')?.click();
  if (kind === "search") { $("#q")?.blur(); }
  if (kind === "chat") {
    const ta = $("#chat-in"); const v = ta.value.trim(); if (!v) { ta.focus(); return; }
    if (ui.chatBusy) return;
    S.chat.push({ from: "me", text: v }); S.chat = S.chat.slice(-40); ta.value = "";
    const ph = { from: "p", pending: true, es: "Pensando…", en: "Thinking…" }; S.chat.push(ph); ui.chatBusy = true;
    save(); render({ keepScroll: true }); $("#chat")?.lastElementChild?.scrollIntoView({ block: "nearest" });
    askClaude(v).then((reply) => {
      const local = chatReply(v); const i = S.chat.indexOf(ph);
      const msg = reply ? { from: "p", text: reply, cta: local.cta } : local;
      if (i >= 0) S.chat[i] = msg; else S.chat.push(msg);
      ui.chatBusy = false; save(); render({ keepScroll: true });
      $("#chat")?.lastElementChild?.scrollIntoView({ block: "nearest" }); $("#chat-in")?.focus();
    });
  }
  if (kind === "goal-notes") {
    const g = S.goals.find((x) => x.id === f.dataset.id); if (!g) return;
    g.notes = $("#g-notes").value.trim(); save(); closeLayer(); render({ keepScroll: true }); toast(T("Notas guardadas", "Notes saved"));
  }
  if (kind === "adapt") $('[data-action="adapt-next"]')?.click();
  if (kind === "profile") $('[data-action="profile-save"]')?.click();
  if (kind === "proposal") $('[data-action="proposal-send"]')?.click();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && stackLayers.length) { e.preventDefault(); closeLayer(); return; }
  if (e.key === "Tab" && stackLayers.length) {
    const el = topLayer(); const f = [...el.querySelectorAll('button:not([disabled]),[href],input,select,textarea,summary,[tabindex]:not([tabindex="-1"])')].filter((x) => x.offsetParent !== null);
    if (!f.length) return; const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  if (e.key === "Enter" && e.target.id === "chat-in" && !e.shiftKey) { e.preventDefault(); e.target.form.requestSubmit(); }
});
window.addEventListener("scroll", () => { $("#topbar")?.classList.toggle("scrolled", window.scrollY > 4); $(".sticky-cta")?.classList.toggle("show", window.scrollY > 480); }, { passive: true });
window.addEventListener("hashchange", onRoute);
setLang(LANG);
onRoute();
