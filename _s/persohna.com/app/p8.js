"use strict";
// ---------- Persohna v7: más simple. Inicio que se entiende de un vistazo, objetivo claro y arreglos visuales ----------

// 1) Datos antiguos que podían romper «Ver plan» (categorías que ya no existen, propuestas a medias)
function fixGoals8() {
  let ch = false;
  (S.goals || []).forEach((g) => {
    if (!g || typeof g !== "object") return;
    if (!CATS[g.cat] && g.cat !== "otro") { g.cat = "otro"; ch = true; }
    if (g.proposal && !Array.isArray(g.proposal.plan)) { delete g.proposal; ch = true; }
    if (g.plan && !Array.isArray(g.plan)) { delete g.plan; ch = true; }
    if (g.steps && !Array.isArray(g.steps)) { g.steps = []; ch = true; }
    if (!g.title) { g.title = T("Mi objetivo", "My goal"); ch = true; }
  });
  S.goals = (S.goals || []).filter((g) => g && typeof g === "object" && g.id);
  if (ch) save();
}
fixGoals8();

// 2) Al abrir una ventana no saltar al primer campo (en el móvil abría el teclado o el calendario y la ventana bajaba sola)
const _focusFirst8 = focusFirst;
focusFirst = function (el) {
  const touch = matchMedia("(pointer: coarse)").matches;
  if (el.querySelector("[autofocus]") || (!touch && !el.querySelector("[data-goal]"))) return _focusFirst8(el);
  setTimeout(() => { const t = el.querySelector(".sheet-title"); if (t) { t.setAttribute("tabindex", "-1"); t.focus({ preventScroll: true }); } }, 30);
};

// 3) Al marcar un paso, la ventana no vuelve arriba
const _setLayer8 = setLayer;
setLayer = function (html) {
  const el = topLayer(); const b = el?.querySelector(".sheet-body"); const key = b ? (b.dataset.goal || b.dataset.view || "") : null; const top = b ? b.scrollTop : 0;
  const openDet = el ? [...el.querySelectorAll("details[open][data-k]")].map((d) => d.dataset.k) : [];
  _setLayer8(html);
  const nb = topLayer()?.querySelector(".sheet-body");
  if (nb && key !== null && (nb.dataset.goal || nb.dataset.view || "") === key) {
    openDet.forEach((k) => { const d = nb.parentElement.querySelector(`details[data-k="${k}"]`); if (d) d.open = true; });
    nb.scrollTop = top;
  }
};

// 4) «Ver plan» siempre abre algo, aunque el objetivo venga de una versión vieja
openGoal = function (id) {
  const g = S.goals.find((x) => String(x.id) === String(id)); if (!g) { toast(T("No encuentro ese objetivo", "I can't find that goal")); return; }
  let html;
  try { html = goalHTML(g); } catch (e) { console.warn("goalHTML", e); fixGoals8(); try { html = goalHTML(g); } catch { html = `${sheetHead(T("Tu objetivo", "Your goal"))}<div class="sheet-body stack g4" data-goal="${g.id}"><h3 class="h-card">${esc(g.title)}</h3><button class="btn btn-secondary" type="button" data-action="goal-chat" data-id="${g.id}">${T("Hablar de esto con mi Persohna", "Talk about this with my Persohna")}</button></div>`; } }
  openLayer(html, { label: T("Objetivo", "Goal") });
};

// ---------- Qué hace tu Persohna por cada objetivo (en palabras sencillas) ----------
const MONEY_CATS8 = ["ahorro", "dinero", "compras", "transporte", "tramites"];
function goalAct8(g) {
  const st = goalStatus(g);
  if (g.done) return null;
  if (st === "needs") return { text: T("Me falta un dato para empezar a ayudarte.", "I need one more detail to start helping you."), btn: `<button class="btn btn-primary btn-big" type="button" data-action="edit-goal" data-id="${g.id}">${T("Completar lo que falta", "Fill in what's missing")}</button>` };
  if (g.cat === "trabajo") {
    const h = S.hunt; const has = h?.terms?.length;
    const nNew = has ? (h.jobs || []).filter((j) => !h.seen?.[j.id] && !h.hidden?.[j.id]).length : 0;
    const total = has ? (h.jobs || []).length : 0;
    const text = !has ? T("Sube tu CV (o el PDF de LinkedIn) y te busco ofertas de trabajo reales cada día.", "Upload your CV (or LinkedIn PDF) and I'll find you real jobs every day.")
      : HS?.busy ? T("Estoy buscando ofertas ahora mismo…", "I'm looking for jobs right now…")
      : nNew ? T(`He encontrado ${nNew} ofertas nuevas para ti.`, `I found ${nNew} new jobs for you.`)
      : T(`Busco ofertas cada día. Tienes ${total} guardadas para mirar${h.lastRun ? " · " + agoShort(h.lastRun) : ""}.`, `I look for jobs every day. ${total} waiting for you${h.lastRun ? " · " + agoShort(h.lastRun) : ""}.`);
    return { text, btn: `<button class="btn btn-primary btn-big" type="button" data-action="hunt">${ico("search")}${has ? T("Ver ofertas", "See jobs") : T("Subir mi CV", "Upload my CV")}</button>`, badge: nNew };
  }
  if (g.cat === "vivienda") return { text: T("Te enseño casas reales que encajan contigo y te aviso si un piso tiene problemas (humedad, ruido, estafas).", "I show you real homes that fit and warn you if a flat has problems (damp, noise, scams)."), btn: `<button class="btn btn-primary btn-big" type="button" data-action="homes" data-id="${g.id}">${ico("search")}${T("Ver casas", "See homes")}</button>` };
  if (g.cat === "eventos") return { text: T("Antes de comprar entradas, compruebo si el anuncio es de fiar.", "Before you buy tickets, I check if the listing can be trusted."), btn: `<button class="btn btn-primary btn-big" type="button" data-action="check-open" data-kind="event">${ico("search")}${T("Comprobar unas entradas", "Check some tickets")}</button>` };
  if (MONEY_CATS8.includes(g.cat)) return { text: T("Hazle una foto a una factura o contrato y te digo cuánto pagas y dónde puedes ahorrar.", "Snap a bill or contract and I'll tell you what you pay and where to save."), btn: `<button class="btn btn-primary btn-big" type="button" data-action="tool" data-v="doc">${ico("sparkle")}${T("Revisar una factura", "Check a bill")}</button>` };
  const steps = planOf(g), done = planDone(g), i = done.findIndex((d) => !d);
  if (i >= 0) return { text: `${T("Ahora toca", "Next")}: ${esc(steps[i])}`, btn: `<button class="btn btn-primary btn-big" type="button" data-action="step" data-id="${g.id}" data-i="${i}">${ico("check")}${T("Ya lo hice", "Done it")}</button>` };
  if (!steps.length) return { text: T("Cuéntame un poco más y te preparo los pasos.", "Tell me a bit more and I'll prepare the steps."), btn: `<button class="btn btn-primary btn-big" type="button" data-action="open-goal" data-id="${g.id}">${T("Ver mi plan", "See my plan")}</button>` };
  return { text: T("Has hecho todos los pasos. ¿Lo conseguiste?", "You've done every step. Did you get it?"), btn: `<button class="btn btn-primary btn-big" type="button" data-action="complete-goal" data-id="${g.id}">${ico("check")}${T("¡Lo conseguí!", "I got it!")}</button>` };
}
function goalCard8(g) {
  const a = goalAct8(g) || { text: "", btn: "" };
  const steps = planOf(g), done = planDone(g), n = done.filter(Boolean).length;
  return `<article class="gc8">
    <button class="gc8-head" type="button" data-action="open-goal" data-id="${g.id}" aria-label="${T("Ver el plan de", "See the plan for")} ${esc(g.title)}">${catIcon(g.cat)}<span class="grow stack g1"><strong>${esc(g.title)}</strong>${steps.length ? `<span class="gc8-prog"><span class="meter" aria-hidden="true"><i style="width:${(n / steps.length) * 100}%"></i></span><span class="post-meta">${T(`${n} de ${steps.length} pasos`, `${n} of ${steps.length} steps`)}</span></span>` : ""}</span>${a.badge ? `<span class="gc8-badge">${a.badge}</span>` : ""}${ico("chev", "chev")}</button>
    <p class="gc8-say">${ico("face")}<span>${a.text}</span></p>
    <div class="gc8-acts">${a.btn}<button class="btn btn-secondary" type="button" data-action="open-goal" data-id="${g.id}">${T("Ver mi plan", "See my plan")}</button></div>
  </article>`;
}

// ---------- Cosas pendientes (solo lo importante, sin repetir) ----------
function pendingCard8() {
  const items = [];
  S.goals.filter((g) => !g.done).forEach((g) => {
    if (g.proposal) items.push([ico("sparkle"), T(`Te he preparado un plan nuevo para «${esc(g.title)}»`, `I made you a new plan for “${esc(g.title)}”`), `<button class="btn btn-secondary btn-sm" type="button" data-action="open-goal" data-id="${g.id}">${T("Verlo", "View")}</button>`]);
    const d = daysTo(g.due); if (g.due && d <= 3) items.push([ico("bell"), `${esc(g.title)}: ${d < 0 ? T("la fecha ya pasó", "the date has passed") : d === 0 ? T("es hoy", "it's today") : d === 1 ? T("es mañana", "it's tomorrow") : T(`faltan ${d} días`, `${d} days left`)}`, `<button class="btn btn-secondary btn-sm" type="button" data-action="open-goal" data-id="${g.id}">${T("Ver", "View")}</button>`]);
  });
  (S.jobs || []).filter((j) => j.status === "interview").slice(0, 2).forEach((j) => items.push([ico("users"), T(`Tienes entrevista en ${esc(j.company || j.title)}. Practica antes conmigo.`, `You have an interview at ${esc(j.company || j.title)}. Practise with me first.`), `<button class="btn btn-secondary btn-sm" type="button" data-action="iv-for" data-id="${j.id}">${T("Practicar", "Practise")}</button>`]));
  (S.jobs || []).filter((j) => j.status === "applied" && j.followAt && j.followAt <= today()).slice(0, 2).forEach((j) => items.push([ico("send"), T(`Pasó una semana desde tu candidatura a ${esc(j.company || j.title)}. Escríbeles un recordatorio.`, `A week since you applied to ${esc(j.company || j.title)}. Send them a nudge.`), `<button class="btn btn-secondary btn-sm" type="button" data-action="followup" data-id="${j.id}">${T("Escribir", "Write")}</button>`]));
  (S.docs || []).filter((x) => x.expires && daysTo(x.expires) <= 30).slice(0, 2).forEach((x) => { const d = daysTo(x.expires); items.push([ico("lock"), `${esc(x.name)}: ${d < 0 ? T("está caducado", "has expired") : T(`caduca en ${d} días`, `expires in ${d} days`)}`, `<button class="btn btn-secondary btn-sm" type="button" data-action="tool" data-v="vault">${T("Ver", "View")}</button>`]); });
  if (!items.length) return "";
  return `<section class="card stack g3 pend8" aria-labelledby="pend-t"><h2 class="h-card" id="pend-t">${T("Para hoy", "For today")}</h2><ul>${items.slice(0, 5).map(([i, t, b]) => `<li>${i}<span class="grow">${t}</span>${b}</li>`).join("")}</ul></section>`;
}

// ---------- Inicio nuevo ----------
viewInicio = function () {
  fixGoals8();
  const me = person("me");
  const goals = S.goals.filter((g) => !g.done);
  const won = S.goals.filter((g) => g.done).length;
  const shown = goals.slice(0, 4), rest = goals.slice(4);
  const cats = ["trabajo", "vivienda", "ahorro", "eventos", "viajes", "aprender"];
  let ins = "", wk = "";
  try { ins = typeof insiderCard === "function" ? insiderCard() : ""; } catch {}
  try { wk = goals.some((g) => g.cat === "trabajo") && typeof weekCard === "function" ? weekCard() : ""; } catch {}
  return `<div class="stack g6 home8">
    <div class="hello">
      <button type="button" data-action="wave" aria-label="${T("Saludar a tu Persohna", "Wave at your Persohna")}" class="plain">${avatar(me, "md", "me-av")}</button>
      <div class="grow stack g1"><p class="muted">${greeting()},</p><h1 class="h-screen">${esc(S.me.name)}</h1></div>
      ${S.streak?.n > 1 ? `<span class="streak" title="${T("Días seguidos", "Days in a row")}">${ico("fire")}${S.streak.n}</span>` : ""}
    </div>
    ${S.welcome ? `<div class="note welcome">${ico("sparkle")}<span><strong>${T("Hola, soy tu Persohna.", "Hi, I'm your Persohna.")}</strong> ${T("Te ayudo a conseguir cosas: un trabajo, una casa, ahorrar… Abajo ves en qué estoy trabajando y el botón para seguir.", "I help you get things done: a job, a home, saving… Below you can see what I'm working on and the button to carry on.")}</span><button class="icon-btn" type="button" data-action="dismiss-welcome" aria-label="${T("Cerrar", "Close")}">${ico("close")}</button></div>` : ""}
    ${pendingCard8()}
    ${goals.length ? `<section class="stack g3" aria-labelledby="doing-t"><h2 class="section-title" id="doing-t">${T("Lo que estoy haciendo por ti", "What I'm doing for you")}</h2>${shown.map(goalCard8).join("")}${rest.length ? `<details class="more8" data-k="rest"><summary>${rest.length === 1 ? T("Ver 1 objetivo más", "See 1 more goal") : T(`Ver ${rest.length} objetivos más`, `See ${rest.length} more goals`)}</summary><div class="stack g3">${rest.map(goalCard8).join("")}</div></details>` : ""}</section>` : ""}
    ${ins}${wk}
    ${typeof accountCard === "function" ? accountCard() : ""}
    <section class="card ask8 stack g3" aria-labelledby="ask-t">
      <h2 class="h-card" id="ask-t">${goals.length ? T("¿Quieres conseguir algo más?", "Want to get something else?") : T("¿Qué quieres conseguir?", "What do you want to get?")}</h2>
      <p class="muted small">${T("Toca uno y te hago un plan con los pasos.", "Tap one and I'll make you a step-by-step plan.")}</p>
      <div class="big-cats">${cats.map((c) => `<button type="button" data-action="new-goal" data-cat="${c}"><img src="${iconSrc(c)}" alt="" width="56" height="56" loading="lazy"><span>${esc(L(CATS[c].verb))}</span></button>`).join("")}</div>
      <form class="row g2" data-form="free-goal" novalidate>
        <label class="sr" for="free-goal">${T("Escribe tu propio objetivo", "Write your own goal")}</label>
        <input class="input grow" id="free-goal" name="t" maxlength="120" placeholder="${T("Otra cosa: escríbela aquí…", "Something else: write it here…")}" autocomplete="off" enterkeyhint="send">
        <button class="btn btn-primary" type="submit">${T("Crear", "Create")}</button>
      </form>
      <p class="err" id="free-goal-err" hidden></p>
    </section>
    <details class="card more8 tools8" data-k="tools"><summary><span class="grow stack g1"><strong>${T("Más cosas que puedo hacer", "More things I can do")}</strong><span class="post-meta">${T("Simular una entrevista, saber si tu sueldo es justo, revisar un contrato…", "Practise an interview, check if your pay is fair, review a contract…")}</span></span>${ico("chev", "chev")}</summary>${toolsCard().replace(/<h2 class="section-title" id="tools-t">[\s\S]*?<\/h2>/, "")}</details>
    ${won ? `<p class="post-meta" style="text-align:center">${T(`Ya has conseguido ${won} ${won === 1 ? "objetivo" : "objetivos"} conmigo.`, `You've achieved ${won} ${won === 1 ? "goal" : "goals"} with me.`)} <a href="#/perfil">${T("Ver", "See")}</a></p>` : ""}
  </div>`;
};

// ---------- Ventana del objetivo, nueva y sencilla ----------
goalHTML = function (g) {
  const st = goalStatus(g), cat = CATS[g.cat];
  const steps = planOf(g), done = planDone(g), n = done.filter(Boolean).length;
  const a = goalAct8(g);
  const say = g.done ? T("¡Lo conseguiste! Puedes crear una imagen para compartirlo.", "You did it! You can make an image to share it.") : a?.text || "";
  const big = g.done ? `<button class="btn btn-primary btn-big" type="button" data-action="ach-img" data-id="${g.id}">${ico("share")}${T("Crear imagen del logro", "Make an achievement image")}</button>` : (a && !/data-action="(step|open-goal|complete-goal)"/.test(a.btn) ? a.btn : "");
  const prop = g.proposal && !g.done && Array.isArray(g.proposal.plan) ? `<div class="card proposal stack g3"><div class="row g2">${ico("sparkle")}<strong>${T("Te propongo estos pasos nuevos", "I suggest these new steps")}</strong></div><ol class="prop-list">${g.proposal.plan.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>${g.proposal.tip ? `<p class="muted small">${esc(g.proposal.tip)}</p>` : ""}<div class="row g2 wrap"><button class="btn btn-primary btn-sm" type="button" data-action="prop-accept" data-id="${g.id}">${ico("check")}${T("Sí, usar estos pasos", "Yes, use these steps")}</button><button class="btn btn-ghost btn-sm" type="button" data-action="prop-reject" data-id="${g.id}">${T("No, gracias", "No thanks")}</button></div></div>` : "";
  let stepsHTML;
  if (ui.planEdit === g.id) stepsHTML = `<div class="field"><label for="plan-ed">${T("Escribe un paso en cada línea", "Write one step per line")}</label><textarea class="textarea" id="plan-ed" rows="7" maxlength="1500">${esc(steps.join("\n"))}</textarea><div class="row g2"><button class="btn btn-primary btn-sm" type="button" data-action="plan-save" data-id="${g.id}">${T("Guardar", "Save")}</button><button class="btn btn-ghost btn-sm" type="button" data-action="plan-cancel" data-id="${g.id}">${T("Cancelar", "Cancel")}</button></div></div>`;
  else if (steps.length) stepsHTML = `<ul class="plan plan8">${steps.map((s, i) => { const lock = i === 0 && st !== "needs" && !g.plan; const cv = stepAction(g, i) && !done[i]; return `<li><button type="button" class="plan-step" data-action="step" data-id="${g.id}" data-i="${i}" aria-pressed="${done[i]}" ${lock ? "disabled" : ""}><span class="num">${done[i] ? ico("check") : i + 1}</span><span class="grow">${esc(s)}</span></button>${cv ? `<button class="btn btn-secondary btn-sm step-act" type="button" data-action="hunt">${T("Subir mi CV", "Upload my CV")}</button>` : ""}</li>`; }).join("")}</ul>`;
  else stepsHTML = `<p class="muted">${g.planBusy ? T("Estoy preparando tus pasos…", "I'm preparing your steps…") : T("Todavía no hay pasos. Pulsa «Hacerme un plan» y te los preparo.", "No steps yet. Tap “Make me a plan” and I'll prepare them.")}</p>${g.planBusy || g.done ? "" : `<button class="btn btn-secondary" type="button" data-action="ai-plan" data-id="${g.id}">${ico("sparkle")}${T("Hacerme un plan", "Make me a plan")}</button>`}`;
  const tools = [];
  if (g.cat === "trabajo") tools.push(["interview", T("Practicar una entrevista", "Practise an interview")], ["jobs", T("Mis candidaturas", "My applications")]);
  if (MONEY_CATS8.includes(g.cat) || g.cat === "vivienda") tools.push(["doc", T("Revisar una factura o contrato", "Review a bill or contract")], ["negotiate", T("Escribir un mensaje para negociar", "Write a negotiation message")]);
  const rows = cat ? cat.fields.map((f) => [L(f.label).replace(/[¿?]/g, "").replace(/ \((opcional|optional)\)/, ""), showVal(f, g.prefs?.[f.k])]) : [];
  const d = daysTo(g.due);
  const more = g.done ? "" : `<details class="more8" data-k="more"><summary>${T("Más opciones", "More options")}${ico("chev", "chev")}</summary><div class="stack g4">
      ${tools.length ? `<div class="stack g2">${tools.map(([k, t]) => `<button class="opt8" type="button" data-action="tool" data-v="${k}">${esc(t)}${ico("chev", "chev")}</button>`).join("")}</div>` : ""}
      <div class="field"><label for="g-due">${T("¿Quieres que te lo recuerde un día?", "Want me to remind you on a day?")}</label><div class="row g2"><input class="input grow" type="date" id="g-due" data-id="${g.id}" value="${esc(g.due || "")}" min="${today()}">${g.due ? `<button class="btn btn-ghost btn-sm" type="button" data-action="due-clear" data-id="${g.id}">${T("Quitar", "Clear")}</button>` : ""}</div>${g.due ? `<p class="hint">${d < 0 ? T("La fecha ya pasó.", "The date has passed.") : d === 0 ? T("Es hoy.", "It's today.") : T(`Faltan ${d} días. Te aviso el día antes.`, `${d} days left. I'll remind you the day before.`)}</p>` : ""}</div>
      ${cat ? `<div class="stack g2"><div class="section-title">${T("Lo que me contaste", "What you told me")}</div><dl class="summary">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v ? esc(v) : `<span class="muted">${T("Falta", "Missing")}</span>`}</dd></div>`).join("")}</dl><button class="btn btn-secondary btn-sm" type="button" data-action="edit-goal" data-id="${g.id}" style="align-self:flex-start">${ico("edit")}${T("Cambiar estos datos", "Change these details")}</button></div>`
        : `<form class="field" data-form="goal-notes" data-id="${g.id}" novalidate><label for="g-notes">${T("¿Qué necesitas para conseguirlo?", "What do you need to get there?")}</label><textarea class="textarea" id="g-notes" placeholder="${T("Cuéntame los detalles", "Tell me the details")}">${esc(g.notes || "")}</textarea><button class="btn btn-secondary" type="submit">${T("Guardar", "Save")}</button></form>`}
      <div class="row g2 wrap">${g.planBusy ? "" : `<button class="btn btn-ghost btn-sm" type="button" data-action="ai-plan" data-id="${g.id}">${ico("sparkle")}${g.plan ? T("Hacer otro plan con IA", "Make another AI plan") : T("Plan a medida con IA", "Tailored AI plan")}</button>`}${ui.planEdit === g.id ? "" : `<button class="btn btn-ghost btn-sm" type="button" data-action="plan-edit" data-id="${g.id}">${ico("edit")}${T("Cambiar los pasos yo", "Change the steps myself")}</button>`}${g.plan ? `<button class="btn btn-ghost btn-sm" type="button" data-action="plan-reset" data-id="${g.id}">${T("Volver a los pasos normales", "Back to the normal steps")}</button>` : ""}</div>
      <button class="btn btn-secondary" type="button" data-action="goal-chat" data-id="${g.id}">${ico("face")}${T("Hablar de esto con mi Persohna", "Talk about this with my Persohna")}</button>
      <button class="link-btn danger8" type="button" data-action="delete-goal" data-id="${g.id}">${ico("trash")}${T("Borrar este objetivo", "Delete this goal")}</button>
    </div></details>`;
  return `${sheetHead(T("Tu objetivo", "Your goal"))}<div class="sheet-body stack g5" data-goal="${g.id}">
    <div class="row g3">${catIcon(g.cat)}<div class="grow stack g1"><h3 class="h-card">${esc(g.title)}</h3><div>${statusTag(st)}</div></div></div>
    ${say ? `<p class="gc8-say">${ico("face")}<span>${say}</span></p>` : ""}
    ${big ? `<div class="stack g2">${big}</div>` : ""}
    ${prop}
    <section class="stack g3"><div class="row between"><h4 class="h-card" style="font-size:17px">${T("Tus pasos", "Your steps")}</h4>${steps.length ? `<span class="post-meta">${T(`${n} de ${steps.length} hechos`, `${n} of ${steps.length} done`)}</span>` : ""}</div>
      ${steps.length && !g.done && ui.planEdit !== g.id ? `<p class="hint">${T("Toca un paso cuando lo hayas hecho.", "Tap a step once you've done it.")}</p>` : ""}
      ${stepsHTML}
      ${g.tip ? `<p class="note">${ico("info")}<span>${esc(g.tip)}</span></p>` : ""}
    </section>
    ${more}
  </div>${!g.done && st === "ready" ? `<div class="sheet-foot"><button class="btn ${big ? "btn-secondary" : "btn-primary"}" type="button" data-action="complete-goal" data-id="${g.id}">${ico("check")}${T("¡Ya lo conseguí!", "I got it!")}</button></div>` : ""}`;
};

// pintar ya con el Inicio nuevo (p3 pinta antes de que cargue este archivo)
try { if (S.me && (ui.route === "inicio" || !ui.route) && !stackLayers.length) render({ keepScroll: true }); } catch (e) { console.warn(e); }

// el menú lateral decía «Nivel 0»: mejor «Nuevo»
const _renderNav8 = typeof renderNav === "function" ? renderNav : null;
if (_renderNav8) renderNav = function () { _renderNav8.apply(this, arguments); const m = document.querySelector("#me-mini .post-meta"); if (m && /^(Nivel|Level) 0$/.test(m.textContent)) m.textContent = T("Nuevo", "New"); };
try { renderNav(); } catch {}
