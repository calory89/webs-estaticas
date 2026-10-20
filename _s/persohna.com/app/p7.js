"use strict";
// ---------- 12. v6: datos reales de la gente (sueldos, alquileres, empresas que responden, gente de dentro),
// enviar candidaturas, CV a medida, seguimiento, avisos con la app cerrada, mapa, casas vistas por la comunidad y más ----------

const cn = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ").slice(0, 120);
const money = (n) => (n == null || isNaN(n)) ? "" : (n >= 1000 ? (Math.round(n / 100) / 10).toLocaleString(LANG === "en" ? "en-GB" : "es-ES") + "k €" : Math.round(n) + " €");
const COMP = { stats: {}, ins: {}, sal: {}, loaded: new Set() };
async function loadCompanyData(names) {
  names = [...new Set(names.map(cn).filter(Boolean))].filter((n) => !COMP.loaded.has(n)).slice(0, 60);
  if (!names.length) return;
  names.forEach((n) => COMP.loaded.add(n));
  const [a, b, c] = await Promise.all([api("companies", { names }), api("insiders", { names }), api("reports", { kind: "salary", keys: names })]);
  Object.assign(COMP.stats, a?.items || {}); Object.assign(COMP.ins, b?.items || {}); Object.assign(COMP.sal, c?.items || {});
}
const daysSince = (d) => Math.floor((Date.now() - new Date(d)) / 864e5);

// ---------- Tarjeta de oferta: insignias que solo da la comunidad ----------
function jobBadges(j) {
  const c = cn(j.company), st = COMP.stats[c], ins = COMP.ins[c], sal = COMP.sal[c], out = [];
  if (j.middleman) out.push(`<span class="tag tag-warn" title="${T("Publica una agencia o plataforma, no la empresa final", "Posted by an agency or platform, not the hiring company")}">${T("Intermediario", "Middleman")}</span>`);
  if ((j.reposts || 1) >= 3) out.push(`<span class="tag tag-warn" title="${T("La misma oferta se ha publicado varias veces en 90 días: puede ser una oferta fantasma", "Same ad posted several times in 90 days: may be a ghost job")}">${T(`Republicada ${j.reposts} veces`, `Reposted ${j.reposts} times`)}</span>`);
  if (j.posted_at && daysSince(j.posted_at) > 30) out.push(`<span class="tag tag-warn">${T(`Hace ${daysSince(j.posted_at)} días`, `${daysSince(j.posted_at)} days old`)}</span>`);
  if (st && st.applied) out.push(`<span class="tag ${st.replied ? "tag-ready" : ""}">${T(`Responde a ${st.replied} de ${st.applied}`, `Replied to ${st.replied} of ${st.applied}`)}</span>`);
  else if (st && st.ghost) out.push(`<span class="tag tag-warn">${T(`«No responden» ×${st.ghost}`, `“Never reply” ×${st.ghost}`)}</span>`);
  if (sal) out.push(`<span class="tag tag-ready" title="${T("Lo que cuentan personas de Persohna", "What Persohna people report")}">${T("Sueldo real", "Real pay")} ~${money(sal.med)}${sal.n > 1 ? ` (${sal.n})` : ""}</span>`);
  if (ins?.n) out.push(`<button class="tag tag-ins" type="button" data-action="qa-open" data-c="${esc(j.company)}">${ico("users", "i16")} ${T(`${ins.n} de Persohna ${ins.n > 1 ? "trabajan" : "trabaja"} aquí`, `${ins.n} Persohna ${ins.n > 1 ? "people work" : "person works"} here`)}</button>`);
  return out.length ? `<div class="row g1 wrap badges">${out.join("")}</div>` : "";
}
const _jobCard7 = jobCard;
jobCard = function (j) {
  let h = _jobCard7(j);
  h = h.replace('<h4 class="job-t">', jobBadges(j) + '<h4 class="job-t">');
  if (HS.op === j.id) {
    const c = esc(j.company || ""), watching = (S.watch || []).includes(cn(j.company));
    const extra = `<div class="section-title">${T("Datos que solo tiene Persohna", "Data only Persohna has")}</div>
      <div class="row g2 wrap"><label class="sr" for="sal-${j.id}">${T("Sueldo bruto anual real", "Real gross yearly pay")}</label><input class="input input-sm grow" id="sal-${j.id}" type="number" inputmode="numeric" min="3000" step="500" placeholder="${T("¿Sabes el sueldo real? € brutos/año", "Know the real pay? € gross/year")}"><button class="btn btn-secondary btn-sm" type="button" data-action="sal-report" data-id="${j.id}">${T("Enviar", "Send")}</button></div>
      <div class="row g2 wrap">${j.company ? `<button class="btn btn-ghost btn-sm" type="button" data-action="qa-open" data-c="${c}">${ico("users")}${T("Preguntar a gente de dentro", "Ask insiders")}</button><button class="btn btn-ghost btn-sm" type="button" data-action="watch" data-c="${c}" aria-pressed="${watching}">${ico("bell")}${watching ? T("Siguiendo", "Following") : T("Avisarme si publica", "Alert me when they post")}</button>` : ""}</div>`;
    h = h.replace(/<\/div>\s*<\/article>\s*$/, extra + '</div></article>');
  }
  return h;
};
// filtros: solo con sueldo y orden
const _huntResultsHTML7 = huntResultsHTML;
huntResultsHTML = function () {
  const h = H();
  const jobs0 = h.jobs;
  if (h.onlySalary) h.jobs = h.jobs.filter((j) => j.salary || COMP.sal[cn(j.company)]);
  if (h.sort === "date") h.jobs = [...h.jobs].sort((a, b) => new Date(b.posted_at) - new Date(a.posted_at));
  let html;
  try { html = _huntResultsHTML7(); } finally { h.jobs = jobs0; }
  const bar = `<div class="row g2 wrap hunt-filters"><button class="chip chip-sm" type="button" data-action="hunt-f" data-v="salary" aria-pressed="${!!h.onlySalary}">${T("Solo con sueldo", "Pay shown only")}</button><button class="chip chip-sm" type="button" data-action="hunt-f" data-v="sort" aria-pressed="${h.sort === "date"}">${h.sort === "date" ? T("Más recientes", "Newest") : T("Mejor encaje", "Best fit")}</button><button class="chip chip-sm" type="button" data-action="companies-top">${T("Empresas que responden", "Companies that reply")}</button></div>`;
  return html.replace('<div class="seg seg-sm" role="tablist">', bar + '<div class="seg seg-sm" role="tablist">');
};
const _huntRun7 = huntRun;
huntRun = async function (opts = {}) {
  await _huntRun7(opts);
  await loadCompanyData((S.hunt?.jobs || []).map((j) => j.company));
  refreshHunt(); pushSync();
};
const _openHunt7 = openHunt;
openHunt = function () { _openHunt7(); loadCompanyData((S.hunt?.jobs || []).map((j) => j.company)).then(refreshHunt); };

// ---------- Candidatura: enviar por email, CV a medida en PDF, preparar entrevista ----------
const _huntApplyHTML7 = huntApplyHTML;
huntApplyHTML = function (j) {
  let h = _huntApplyHTML7(j);
  const a = H().apps[j.id] || {};
  if (!a.text) return h;
  const em = (a.emails || [])[0];
  const block = `<div class="card stack g3 send-card"><strong>${T("Enviarla", "Send it")}</strong>
    <div class="row g2 wrap">${em ? `<a class="btn btn-primary btn-sm" href="${esc(mailtoFor(j, a, em))}" data-action="mail-sent" data-id="${j.id}">${ico("send")}${T("Enviar por email a", "Email to")} ${esc(em)}</a>` : `<a class="btn btn-primary btn-sm" href="${esc(j.url)}" target="_blank" rel="noopener" data-act="job-open" data-id="${j.id}">${T("Enviar en la web de la oferta", "Apply on the job page")}</a>`}
      <button class="btn btn-secondary btn-sm" type="button" data-action="cvdoc" data-id="${j.id}" ${a.cvBusy ? "disabled" : ""}>${ico("download")}${a.cvBusy ? T("Preparando CV…", "Preparing CV…") : a.cvdoc ? T("Descargar CV a medida", "Download tailored CV") : T("CV a medida en PDF", "Tailored CV as PDF")}</button>
      <button class="btn btn-ghost btn-sm" type="button" data-action="brief" data-id="${j.id}" ${a.briefBusy ? "disabled" : ""}>${a.briefBusy ? T("Preparando…", "Preparing…") : T("Preparar la entrevista", "Prepare the interview")}</button></div>
    <p class="hint">${em ? T("He encontrado el email del reclutador en la oferta. Se abre tu correo con la carta lista; adjunta el CV a medida.", "I found the recruiter's email in the ad. Your mail app opens with the letter ready; attach the tailored CV.") : T("Esta oferta se envía desde su web. Copia la carta y sube el CV a medida.", "This job is applied for on its website. Copy the letter and upload the tailored CV.")} ${T("Persohna nunca envía nada sin ti.", "Persohna never sends anything without you.")}</p>
    ${a.brief ? `<details open><summary>${T("Tu preparación para la entrevista", "Your interview prep")}</summary><div class="ai-out">${md(a.brief)}</div></details>` : ""}</div>`;
  return h.replace('<div class="card stack g2"><strong>', block + '<div class="card stack g2"><strong>');
};
function letterOf(text) {
  const m = String(text).match(/\*\*(Carta de presentación|Cover letter)\*\*[\s\S]*?\n([\s\S]*?)(\n\*\*|$)/i);
  return (m ? m[2] : text).replace(/\*\*/g, "").trim().slice(0, 1800);
}
function mailtoFor(j, a, email) {
  const subj = `${T("Candidatura", "Application")}: ${j.title}${S.me?.name ? " – " + S.me.name : ""}`;
  return `mailto:${email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(letterOf(a.text) + "\n\n" + T("Adjunto mi CV.", "Please find my CV attached.") + "\n" + (S.me?.name || ""))}`;
}
function printCV(title, text) {
  const w = window.open("", "_blank");
  if (!w) { toast(T("Permite las ventanas emergentes para descargar el PDF.", "Allow pop-ups to download the PDF.")); return; }
  w.document.write(`<!doctype html><html lang="${LANG}"><head><meta charset="utf-8"><title>${esc(title)}</title><style>@page{size:A4;margin:16mm}body{font:11pt/1.45 -apple-system,"Segoe UI",Roboto,Helvetica,sans-serif;color:#1d1d1d;max-width:180mm;margin:0 auto}strong{color:#111}body>strong:first-child{display:block;font-size:20pt;margin-bottom:4px}.cv{white-space:pre-wrap}</style></head><body><div class="cv">${md(text).replace(/^<strong>/, '<strong style="font-size:20pt;display:block">')}</div><script>setTimeout(function(){print()},300)<\/script></body></html>`);
  w.document.close();
}
async function makeCVdoc(id) {
  const h = H(), j = (h.jobs.concat(h.savedJobs || [])).find((x) => x.id === id), a = h.apps[id]; if (!j || !a || !S.cv?.text) return;
  if (a.cvdoc) { printCV(`CV · ${S.me?.name || ""} · ${j.title}`, a.cvdoc); return; }
  a.cvBusy = true; refreshHunt();
  const r = await askAI5("cv_doc", [{ role: "user", content: `MI CV:\n${S.cv.text}\n\n---\nOFERTA:\n${j.title} · ${j.company || ""}\n${a.desc || j.snippet || ""}` }], { cv: undefined });
  a.cvBusy = false;
  if (r.error) toast(aiErr(r.error)); else { a.cvdoc = r.text; save(); }
  refreshHunt();
  if (!r.error) toast(T("CV a medida listo", "Tailored CV ready"), { label: T("Descargar", "Download"), fn: () => printCV(`CV · ${S.me?.name || ""} · ${j.title}`, a.cvdoc) });
}
async function makeBrief(id) {
  const h = H(), j = (h.jobs.concat(h.savedJobs || [])).find((x) => x.id === id), a = h.apps[id] || (h.apps[id] = {}); if (!j) return;
  a.briefBusy = true; refreshHunt();
  const c = cn(j.company); await loadCompanyData([j.company]);
  const qa = j.company ? await api("qa_list", { company: c, token: loggedIn() ? AUTH.token : undefined, device: DEVICE }) : null;
  const comm = { empresa: j.company, responde: COMP.stats[c] || null, sueldo_real: COMP.sal[c] || null, gente_dentro: COMP.ins[c]?.n || 0, preguntas_respondidas: (qa?.items || []).filter((x) => x.a).slice(0, 6).map((x) => ({ q: x.q, a: x.a })), opiniones: SIGS["job:" + id]?.tags || {} };
  const r = await askAI5("brief", [{ role: "user", content: `OFERTA:\n${j.title} · ${j.company || ""} · ${j.location || ""}\n${a.desc || j.snippet || ""}\n\nDATOS DE LA COMUNIDAD:\n${JSON.stringify(comm).slice(0, 3000)}` }]);
  a.briefBusy = false;
  if (r.error) toast(aiErr(r.error)); else { a.brief = r.text; save(); }
  if (isTop(HLBL())) refreshHunt(); else if (!r.error) doneNotify(`Tu preparación para ${j.company || j.title} está lista`, `Your prep for ${j.company || j.title} is ready`, () => { openHunt(); HS.open = id; refreshHunt(); });
}

// ---------- Gente de dentro: preguntas y respuestas ----------
let QA = null;
const QALBL = () => T("Pregunta a gente de dentro", "Ask insiders");
async function openQA(company) {
  QA = { company, items: [], busy: true };
  openLayer(qaHTML(), { label: QALBL() });
  const d = await api("qa_list", { company: cn(company), token: loggedIn() ? AUTH.token : undefined, device: DEVICE });
  QA.items = d?.items || []; QA.busy = false;
  await loadCompanyData([company]);
  if (isTop(QALBL())) setLayer(qaHTML());
}
function qaHTML() {
  const ins = COMP.ins[cn(QA.company)];
  return `${sheetHead(QALBL())}<div class="sheet-body stack g4"><div class="stack g1"><h3 class="h-card">${esc(QA.company)}</h3><p class="muted small">${ins?.n ? T(`${ins.n} ${ins.n > 1 ? "personas de Persohna trabajan" : "persona de Persohna trabaja"} aquí. Responden de forma anónima.`, `${ins.n} Persohna ${ins.n > 1 ? "people work" : "person works"} here. They answer anonymously.`) : T("Aún no hay nadie de Persohna dentro. Tu pregunta queda guardada y la verá la primera persona que se una desde esta empresa.", "No Persohna insiders yet. Your question is saved and the first person who joins from this company will see it.")}</p></div>
    ${QA.busy ? `<div class="skel"></div>` : QA.items.length ? `<ul class="qa">${QA.items.map((x) => `<li><strong>${esc(x.q)}</strong>${x.a ? `<p>${esc(x.a)}</p>` : `<p class="muted small">${T("Esperando respuesta…", "Waiting for an answer…")}</p>`}</li>`).join("")}</ul>` : `<p class="muted">${T("Todavía no hay preguntas.", "No questions yet.")}</p>`}
    <div class="field"><label for="qa-q">${T("Tu pregunta (sueldo real, ambiente, horarios, cómo es la entrevista…)", "Your question (real pay, culture, hours, what the interview is like…)")}</label><textarea class="textarea" id="qa-q" rows="3" maxlength="400"></textarea></div>
    <p class="hint">${T("Anónimo. No pongas datos personales.", "Anonymous. Don't include personal details.")}</p></div>
    <div class="sheet-foot"><button class="btn btn-primary" type="button" data-action="qa-send">${T("Preguntar", "Ask")}</button></div>`;
}
let QIN = null;
async function loadInsiderInbox() {
  if (!S.me?.insider?.company) { QIN = null; return; }
  const d = await api("qa_inbox", { token: loggedIn() ? AUTH.token : undefined, device: DEVICE });
  QIN = d?.items?.length ? d : null;
}
function insiderCard() {
  if (!QIN?.items?.length) return "";
  const x = QIN.items[0];
  return `<section class="card stack g3 qa-card"><div class="section-title">${T(`Alguien pregunta por ${esc(QIN.company)}`, `Someone is asking about ${esc(QIN.company)}`)}</div><p><strong>${esc(x.q)}</strong></p><div class="field"><label class="sr" for="qa-a">${T("Tu respuesta", "Your answer")}</label><textarea class="textarea" id="qa-a" rows="2" maxlength="800" placeholder="${T("Responde en anónimo: ayudas a alguien a decidir", "Answer anonymously: you help someone decide")}"></textarea></div><div class="row g2"><button class="btn btn-primary btn-sm" type="button" data-action="qa-answer" data-id="${x.id}">${T("Responder", "Answer")}</button>${QIN.items.length > 1 ? `<span class="post-meta">+${QIN.items.length - 1} ${T("más", "more")}</span>` : ""}</div></section>`;
}

// ---------- Ranking de empresas que responden ----------
async function openCompaniesTop() {
  openLayer(`${sheetHead(T("Empresas que responden", "Companies that reply"))}<div class="sheet-body stack g4"><div class="skel"></div></div>`, { label: "ctop" });
  const d = await api("company_top", {});
  const rows = d?.items || [];
  if (!isTop("ctop")) return;
  setLayer(`${sheetHead(T("Empresas que responden", "Companies that reply"))}<div class="sheet-body stack g4"><p class="muted">${T("Calculado con lo que cuenta la gente de Persohna cuando envía una candidatura y si les llaman. Ningún buscador ni IA tiene este dato.", "Calculated from what Persohna people report when they apply and whether they get a call. No search engine or AI has this.")}</p>
    ${rows.length ? `<ol class="ctop">${rows.map((r) => { const rate = r.applied ? Math.round((r.replied / r.applied) * 100) : 0; return `<li><div class="row between g2"><strong>${esc(r.c)}</strong><span class="post-meta">${r.applied ? T(`responde a ${r.replied} de ${r.applied}`, `replied to ${r.replied} of ${r.applied}`) : ""}${r.ghost ? ` · «${T("no responden", "never reply")}» ×${r.ghost}` : ""}</span></div><div class="meter"><i style="width:${Math.min(100, rate)}%"></i></div></li>`; }).join("")}</ol>`
      : `<div class="empty"><p><strong>${T("Aún no hay datos suficientes.", "Not enough data yet.")}</strong></p><p class="muted">${T("Cada vez que marcas «la envié» o «me llamaron», esta lista crece. Con 2 o más candidaturas por empresa aparece aquí.", "Each time you mark “I sent it” or “they called me”, this list grows. Companies appear with 2+ applications.")}</p></div>`}</div>`);
}

// ---------- Seguimiento a los 7 días ----------
let FU = null;
async function openFollowup(jid) {
  const j = S.jobs.find((x) => x.id === jid); if (!j) return;
  FU = { j, busy: true, text: "" };
  openLayer(fuHTML(), { label: "fu" });
  const r = await askAI5("followup", [{ role: "user", content: `Puesto: ${j.title}\nEmpresa: ${j.company || ""}\nEnviada el: ${j.appliedAt || j.at}\nMi nombre: ${S.me?.name || ""}` }]);
  FU.busy = false; FU.text = r.error ? "" : r.text; FU.err = r.error ? aiErr(r.error) : "";
  if (isTop("fu")) setLayer(fuHTML());
}
function fuHTML() {
  return `${sheetHead(T("Email de seguimiento", "Follow-up email"))}<div class="sheet-body stack g4"><p class="muted">${esc(FU.j.title)}${FU.j.company ? " · " + esc(FU.j.company) : ""}</p>${FU.busy ? `<div class="skel"></div>` : FU.err ? `<p class="err">${esc(FU.err)}</p>` : `<div class="ai-out">${md(FU.text)}</div><div class="row g2 wrap"><button class="btn btn-secondary" type="button" data-action="copy-text" data-t="${esc(FU.text)}">${T("Copiar", "Copy")}</button><button class="btn btn-primary" type="button" data-action="fu-done" data-id="${FU.j.id}">${T("Lo envié", "I sent it")}</button></div>`}</div>`;
}
const _jobsHTML7 = jobsHTML;
jobsHTML = function () {
  let h = _jobsHTML7();
  S.jobs.filter((j) => j.status === "applied").forEach((j) => {
    const late = j.followAt && j.followAt <= today();
    h = h.replace(`<button class="btn btn-ghost btn-sm" type="button" data-action="job-del" data-id="${j.id}"`, `<button class="btn ${late ? "btn-primary" : "btn-ghost"} btn-sm" type="button" data-action="followup" data-id="${j.id}">${late ? T("Toca seguimiento", "Follow up now") : T("Seguimiento", "Follow up")}</button><button class="btn btn-ghost btn-sm" type="button" data-action="job-del" data-id="${j.id}"`);
  });
  return h;
};
const _checkReminders7 = checkReminders;
checkReminders = function () {
  _checkReminders7();
  if (!S?.me) return;
  let ch = false;
  (S.jobs || []).forEach((j) => {
    if (j.status !== "applied" || !j.followAt || j.followNotified || j.followAt > today()) return;
    j.followNotified = true; ch = true;
    notify(`Hace una semana que enviaste «${j.title}»${j.company ? " a " + j.company : ""}. ¿Escribimos un seguimiento?`, `It's been a week since you applied to “${j.title}”${j.company ? " at " + j.company : ""}. Shall we follow up?`, "tool:followup:" + j.id);
  });
  watchCheck();
  if (ch) { save(); renderNav(); }
};

// ---------- Seguir empresas ----------
async function watchCheck() {
  const w = S.watch || []; if (!w.length) return;
  if (S.watchAt && Date.now() - new Date(S.watchAt) < 12 * 36e5) return;
  S.watchAt = new Date().toISOString();
  const seen = new Set(S.watchSeen || []);
  for (const c of w.slice(0, 8)) {
    const list = await rpc(JB, "px_company_jobs", { p_company: c, p_limit: 5 });
    if (!Array.isArray(list)) continue;
    const nw = list.filter((j) => !seen.has(j.id));
    if (nw.length && S.watchSeen) notify(`${nw[0].company} ha publicado: ${nw[0].title}`, `${nw[0].company} posted: ${nw[0].title}`, "tool:hunt");
    list.forEach((j) => seen.add(j.id));
  }
  S.watchSeen = [...seen].slice(-300); save(); renderNav();
}

// ---------- Avisos con la app cerrada (push) ----------
const PUSH_FN = "persohna-push";
const urlB64 = (s) => { const p = "=".repeat((4 - (s.length % 4)) % 4), b = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...b].map((c) => c.charCodeAt(0))); };
async function pushEnable() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) { toast(T("Este navegador no admite avisos. En iPhone: instala la app (Compartir → Añadir a pantalla de inicio) y vuelve a intentarlo.", "This browser doesn't support alerts. On iPhone: install the app (Share → Add to Home Screen) and try again.")); return false; }
  const perm = await Notification.requestPermission(); if (perm !== "granted") { toast(T("Sin permiso no puedo avisarte.", "Without permission I can't alert you.")); return false; }
  const reg = await navigator.serviceWorker.register("/sw.js"); await navigator.serviceWorker.ready;
  const k = await callFn(PUSH_FN, { action: "key" }); if (!k?.key) { toast(T("No he podido activar los avisos ahora.", "Couldn't turn on alerts right now.")); return false; }
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64(k.key) });
  S.push = true; save();
  await pushSync(true);
  return true;
}
function pushPrefs() {
  const h = S.hunt || {}, due = [];
  const at9 = (d) => new Date(d + "T09:00:00").toISOString();
  S.goals.filter((g) => !g.done && g.due).forEach((g) => { const b = new Date(g.due + "T09:00:00"); b.setDate(b.getDate() - 1); due.push({ id: "g" + g.id, at: b.toISOString(), es: `Mañana es la fecha de «${g.title}».`, en: `“${g.title}” is due tomorrow.`, url: "/#/inicio" }); });
  (S.docs || []).filter((x) => x.expires).forEach((x) => { const b = new Date(x.expires + "T09:00:00"); b.setDate(b.getDate() - 30); due.push({ id: "d" + x.id, at: b.toISOString(), es: `«${x.name}» caduca en 30 días.`, en: `“${x.name}” expires in 30 days.`, url: "/#/inicio" }); });
  (S.jobs || []).filter((j) => j.status === "applied" && j.followAt && !j.followNotified).forEach((j) => due.push({ id: "f" + j.id, at: at9(j.followAt), es: `Hace una semana que enviaste «${j.title}». ¿Escribimos un seguimiento?`, en: `A week since you applied to “${j.title}”. Follow up?`, url: "/#/inicio" }));
  return { terms: h.terms || [], city: h.city || "", remote: !!h.remote, country: h.country || "", watch: S.watch || [], due: due.filter((d) => new Date(d.at) > new Date(Date.now() - 864e5)) };
}
let pushT7 = null;
async function pushSync(test = false) {
  if (!S.push || !("serviceWorker" in navigator)) return;
  clearTimeout(pushT7);
  pushT7 = setTimeout(async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration(); const sub = await reg?.pushManager?.getSubscription(); if (!sub) return;
      await callFn(PUSH_FN, { action: "sub", sub: sub.toJSON(), prefs: pushPrefs(), lang: LANG, seen: (S.hunt?.jobs || []).map((j) => j.id), test });
    } catch {}
  }, test ? 0 : 1500);
}

// ---------- Casas: pisos vistos por la comunidad, alquiler justo, guardar y bajadas de precio ----------
const RS = { url: "https://persohna.com/__sb/realhunt/rest/v1/rpc/", key: RH.key };
const _homesLoad7 = homesLoad;
homesLoad = async function (g) {
  const p = g?.prefs || {}, buy = /compr|buy/i.test(p.op || ""), max = +p.presupuesto || 0, zona = String(p.zona || "").split(/[,·]/)[0].trim();
  HO.zona = zona; HO.rent = !buy;
  const [_, seen, fair] = await Promise.all([
    _homesLoad7(g),
    rpc(RS, "px_homes_seen", { p_q: zona || null, p_deal: buy ? "sale" : "rent", p_max: max > 0 ? max : null, p_limit: 24 }),
    zona ? api("reports", { kind: "rent", keys: [cn(zona)] }) : null,
  ]);
  HO.seen = Array.isArray(seen) ? seen : []; HO.fair = fair?.items?.[cn(zona)] || null;
  await loadSignals(HO.seen.map((x) => "home:" + normUrl(x.url)));
  if (isTop(HOLBL())) setLayer(homesHTML());
};
const _homesHTML7 = homesHTML;
homesHTML = function () {
  let h = _homesHTML7();
  if (HO.busy) return h;
  h = h.replace(/(<a class="btn btn-primary btn-sm" href="https:\/\/realhunt\.co\/deal\/([^"]+)" target="_blank" rel="noopener">[^<]*<\/a>)/g, (m, a, slug) => { const on = !!(S.homesSaved || {})[slug]; return `${a}<button class="btn btn-ghost btn-sm" type="button" data-action="home-save" data-k="${slug}" aria-pressed="${on}">${ico("bookmark")}${on ? T("Guardada", "Saved") : T("Avisarme si baja", "Alert me if it drops")}</button>`; });
  const fair = `<section class="card stack g3 fair"><div class="row between g2 wrap"><strong>${T("Alquiler justo", "Fair rent")}${HO.zona ? " · " + esc(HO.zona) : ""}</strong>${HO.fair ? `<span class="fit hi">${HO.fair.med} €/m²</span>` : ""}</div>
    <p class="muted small">${HO.fair ? T(`Lo que pagan ${HO.fair.n} personas de Persohna aquí: entre ${HO.fair.p25} y ${HO.fair.p75} €/m² al mes (mediana ${HO.fair.med}). Un piso de 60 m² a precio justo: ~${HO.fair.med * 60} €/mes.`, `What ${HO.fair.n} Persohna people pay here: ${HO.fair.p25}–${HO.fair.p75} €/m² a month (median ${HO.fair.med}). A fair 60 m² flat: ~${HO.fair.med * 60} €/month.`) : T("Aún no hay datos de esta zona. Cuéntanos cuánto pagas tú (anónimo) y serás de las primeras personas en crear el precio justo real, no el de los anuncios.", "No data for this area yet. Tell us what you pay (anonymous) and help build the real fair price, not the advertised one.")}</p>
    <div class="row g2 wrap"><input class="input input-sm grow" id="rent-amt" type="number" inputmode="numeric" min="80" placeholder="${T("€/mes que pagas", "€/month you pay")}"><input class="input input-sm" style="max-width:110px" id="rent-m2" type="number" inputmode="numeric" min="8" placeholder="m²"><input class="input input-sm grow" id="rent-zone" maxlength="60" value="${esc(HO.zona || "")}" placeholder="${T("Ciudad o barrio", "City or area")}"><button class="btn btn-secondary btn-sm" type="button" data-action="rent-report">${T("Aportar", "Share")}</button></div>
    <div class="row g2 wrap"><button class="btn btn-ghost btn-sm" type="button" data-action="map-open">${ico("compass")}${T("Mapa de edificios con problemas", "Map of problem buildings")}</button>${HO.fair ? `<button class="btn btn-ghost btn-sm" type="button" data-action="rent-negotiate">${T("Negociar mi alquiler con estos datos", "Negotiate my rent with this data")}</button>` : ""}</div></section>`;
  const seen = HO.seen?.length ? `<section class="stack g3"><h3 class="section-title">${T("Pisos que ha mirado la comunidad", "Listings the community has looked at")}</h3><p class="muted small">${T("Anuncios de idealista, fotocasa y otros portales que usuarios de RealHunt Score han puntuado. Con su nota, si está caro frente a la zona y lo que opina la gente.", "Listings from idealista, fotocasa and other portals scored by RealHunt Score users. With their score, whether they're pricey for the area and what people say.")}</p><div class="jobs">${HO.seen.map((x) => { const key = "home:" + normUrl(x.url); return `<article class="job"><div class="row g2 wrap">${x.score ? `<span class="fit ${x.score >= 75 ? "hi" : x.score >= 55 ? "mid" : "lo"}">${x.score}</span>` : ""}${x.pct != null ? `<span class="tag ${x.pct > 10 ? "tag-warn" : "tag-ready"}">${x.pct > 0 ? T(`${x.pct}% más caro que la zona`, `${x.pct}% above area`) : T(`${-x.pct}% más barato que la zona`, `${-x.pct}% below area`)}</span>` : ""}${(x.flags || []).slice(0, 3).map((f) => `<span class="tag tag-warn">${esc(f)}</span>`).join("")}</div><h4 class="job-t">${esc(x.title || x.area || x.portal)}</h4><p class="post-meta">${esc(x.portal)} · <strong>${fmtMoney(x.price)}</strong>${x.sqm ? " · " + Math.round(x.sqm) + " m²" : ""}${x.ppsqm ? " · " + Math.round(x.ppsqm) + " €/m²" : ""}${x.days ? " · " + T(`${x.days} días anunciado`, `${x.days} days listed`) : ""}</p>${sigLine(key)}<div class="row g2 wrap"><a class="btn btn-secondary btn-sm" href="${esc(x.url)}" target="_blank" rel="noopener">${T("Ver anuncio", "View listing")}</a><button class="btn btn-ghost btn-sm" type="button" data-action="visit-open" data-u="${esc(x.url)}">${T("Checklist de visita", "Viewing checklist")}</button></div></article>`; }).join("")}</div></section>` : "";
  return h.replace('<div class="sheet-body stack g4">', '<div class="sheet-body stack g4">' + fair + seen);
};
async function homesPriceCheck() {
  const saved = S.homesSaved || {}; const slugs = Object.keys(saved); if (!slugs.length) return;
  if (S.homesAt && Date.now() - new Date(S.homesAt) < 20 * 36e5) return;
  S.homesAt = new Date().toISOString();
  const d = await rpc(RH, "community_feed", { p: { limit: 500 } });
  (d?.rows || []).forEach((r) => {
    const s = saved[r.slug]; if (!s || !r.price_eur) return;
    if (r.price_eur < s.price) notify(`Ha bajado «${r.title}»: de ${fmtMoney(s.price)} a ${fmtMoney(r.price_eur)}`, `“${r.title}” dropped from ${fmtMoney(s.price)} to ${fmtMoney(r.price_eur)}`, "tool:homes");
    s.price = r.price_eur;
  });
  save(); renderNav();
}

// ---------- Checklist de visita (privada; si marcas un problema, lo puedes compartir) ----------
const VISIT_ITEMS = () => [["humedad", T("Manchas de humedad o moho", "Damp or mould stains")], ["olor", T("Olor a cerrado o desagüe", "Musty or drain smell")], ["ruido", T("Ruido de calle o vecinos", "Street or neighbour noise")], ["luz", T("Poca luz natural", "Little daylight")], ["agua", T("Poca presión de agua o agua fría", "Low water pressure or no hot water")], ["ventanas", T("Ventanas que no aíslan", "Windows that don't insulate")], ["electrica", T("Instalación eléctrica vieja", "Old electrics")], ["cobertura", T("Mala cobertura o internet", "Bad signal or internet")], ["comunidad", T("Zonas comunes descuidadas", "Neglected common areas")], ["fotos", T("No se parece a las fotos", "Doesn't look like the photos")]];
let VS = null;
function openVisit(url) { VS = { url, key: "home:" + normUrl(url) }; S.visits = S.visits || {}; S.visits[VS.key] = S.visits[VS.key] || { url, at: today(), marks: {} }; openLayer(visitHTML(), { label: "visit" }); }
function visitHTML() {
  const v = S.visits[VS.key];
  return `${sheetHead(T("Checklist de visita", "Viewing checklist"))}<div class="sheet-body stack g4"><p class="muted small">${T("Llévala a la visita y marca lo que veas. Es privada; al final puedes compartir los problemas (anónimo) para que nadie más caiga.", "Take it to the viewing and tick what you see. It's private; at the end you can share problems (anonymously) so nobody else falls for it.")}</p><p class="post-meta">${esc(VS.url.slice(0, 80))}</p>
    <ul class="check-list">${VISIT_ITEMS().map(([k, l]) => `<li><label class="check"><input type="checkbox" data-visit="${k}" ${v.marks[k] ? "checked" : ""}> ${l}</label></li>`).join("")}</ul></div>
    <div class="sheet-foot"><button class="btn btn-primary" type="button" data-action="visit-share">${T("Compartir problemas", "Share problems")}</button></div>`;
}

// ---------- Mapa de edificios con problemas ----------
let MAP = null;
async function openMap() {
  openLayer(`${sheetHead(T("Mapa de edificios", "Building map"))}<div class="sheet-body stack g3"><div id="pxmap" class="pxmap"></div>
    <div class="row g2 wrap"><label class="sr" for="map-addr">${T("Dirección", "Address")}</label><input class="input grow" id="map-addr" maxlength="140" placeholder="${T("Dirección del edificio (calle, número, ciudad)", "Building address (street, number, city)")}"><button class="btn btn-secondary" type="button" data-action="map-find">${T("Buscar", "Find")}</button></div>
    <div id="map-report" class="stack g2"></div>
    <p class="hint">${T("Rojo: alguien marcó problemas (humedad, ruido, estafa…). Verde: buenas experiencias. Todo anónimo.", "Red: someone flagged problems (damp, noise, scam…). Green: good experiences. All anonymous.")}</p></div>`, { full: true, label: "map" });
  try {
    if (!window.L) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"; document.head.appendChild(l); await loadScript("https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"); }
    const start = await geocode(HO?.zona || S.hunt?.city || "Madrid");
    MAP = window.L.map("pxmap").setView(start ? [start.lat, start.lng] : [40.4168, -3.7038], 14);
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(MAP);
    MAP.on("moveend", mapLoad); mapLoad();
  } catch { const el = $("#pxmap"); if (el) el.innerHTML = `<p class="err">${T("No he podido cargar el mapa.", "Couldn't load the map.")}</p>`; }
}
async function geocode(q) {
  if (!q) return null;
  try { const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`, { headers: { "accept-language": LANG } }); const d = await r.json(); return d?.[0] ? { lat: +d[0].lat, lng: +d[0].lon, name: d[0].display_name } : null; } catch { return null; }
}
let mapMarkers = [];
async function mapLoad() {
  if (!MAP || !window.L) return;
  const b = MAP.getBounds();
  const d = await api("geo_items", { bbox: [b.getSouth(), b.getWest(), b.getNorth(), b.getEast()] });
  mapMarkers.forEach((m) => m.remove()); mapMarkers = [];
  (d?.items || []).forEach((it) => {
    const tags = it.tags || {}, bad = HOME_OPINION().filter(([, s]) => s === "bad").some(([t]) => tags[cn(t)]);
    const m = window.L.circleMarker([+it.meta.lat, +it.meta.lng], { radius: 9, color: bad ? "#9B2C2C" : "#2E7D5B", fillOpacity: 0.7 }).addTo(MAP);
    m.bindPopup(`<strong>${esc(it.meta.addr || it.title || "")}</strong><br>${Object.entries(tags).map(([t, n]) => `${esc(t)} ×${n}`).join("<br>")}`);
    mapMarkers.push(m);
  });
}

// ---------- Trabajo en remoto + casa barata ----------
async function openRemoteHome() {
  openLayer(`${sheetHead(T("Trabaja en remoto, vive barato", "Work remotely, live cheaply"))}<div class="sheet-body stack g4"><div class="skel"></div><div class="skel"></div></div>`, { full: true, wide: true, label: "rh" });
  const terms = S.hunt?.terms?.length ? S.hunt.terms : (trabajoGoal()?.prefs?.puesto ? [trabajoGoal().prefs.puesto] : []);
  const [jobs, homes] = await Promise.all([terms.length ? rpc(JB, "px_jobs_search", { p_terms: terms.slice(0, 4), p_where: null, p_remote: true, p_limit: 8, p_country: S.hunt?.country || null }) : [], rpc(RH, "community_feed", { p: { max_price: 120000, limit: 9 } })]);
  if (!isTop("rh")) return;
  const js = Array.isArray(jobs) ? jobs.filter((j) => j.remote && !j.middleman).slice(0, 6) : [];
  const hs = (homes?.rows || []).slice(0, 9);
  setLayer(`${sheetHead(T("Trabaja en remoto, vive barato", "Work remotely, live cheaply"))}<div class="sheet-body stack g4">
    <p class="muted">${T("Lo que más asusta de irse a vivir a un sitio barato es no tener ingresos. Aquí tienes las dos piezas juntas: trabajos remotos reales para tu perfil y casas reales por debajo de 120.000 €.", "The scary part of moving somewhere cheap is income. Here are both pieces together: real remote jobs for your profile and real homes under €120,000.")}</p>
    <h3 class="section-title">${T("Trabajos en remoto para ti", "Remote jobs for you")}</h3>${js.length ? `<div class="jobs">${js.map((j) => `<article class="job"><h4 class="job-t">${esc(j.title)}</h4><p class="post-meta">${esc(j.company || "")} · ${esc(String(j.location || "").slice(0, 50))}${j.salary ? " · " + esc(j.salary) : ""}</p><a class="btn btn-secondary btn-sm" href="${esc(j.url)}" target="_blank" rel="noopener" style="align-self:flex-start">${T("Ver oferta", "View job")}</a></article>`).join("")}</div>` : `<p class="muted">${T("Dime tu puesto en «Busca trabajo por mí» y te enseño remotos.", "Tell me your role in “Find me a job” and I'll show remote ones.")} <button class="link-btn" type="button" data-action="hunt">${T("Empezar", "Start")}</button></p>`}
    <h3 class="section-title">${T("Casas por debajo de 120.000 €", "Homes under €120,000")}</h3><div class="homes">${hs.map((r) => { const img = r.image_urls?.[0] ? (r.image_urls[0].startsWith("http") ? r.image_urls[0] : RH.site + r.image_urls[0]) : ""; return `<article class="home">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : ""}<div class="stack g1 home-b"><strong>${esc(r.title)}</strong><p class="post-meta">${esc([r.location_name, r.country].filter(Boolean).join(", "))} · <strong>${fmtMoney(r.price_eur)}</strong></p><a class="btn btn-secondary btn-sm" href="${RH.site}/deal/${esc(r.slug)}" target="_blank" rel="noopener" style="align-self:flex-start">${T("Ver casa", "View home")}</a></div></article>`; }).join("")}</div></div>`);
}

// ---------- ¿Es justo mi sueldo? ----------
let PAY = null;
function openPay() { PAY = { role: S.hunt?.terms?.[0] || trabajoGoal()?.prefs?.puesto || "", city: S.hunt?.city || "", company: "", amount: "", res: null }; openLayer(payHTML(), { label: "pay" }); }
function payHTML() {
  const r = PAY.res;
  return `${sheetHead(T("¿Es justo mi sueldo?", "Is my pay fair?"))}<div class="sheet-body stack g4"><p class="muted">${T("Compara tu sueldo o una oferta con lo que cuentan personas reales de Persohna (no con estimaciones de internet). Y, si quieres, aporta el tuyo en anónimo.", "Compare your pay or an offer with what real Persohna people report (not internet estimates). And, if you like, share yours anonymously.")}</p>
    <div class="row g2 wrap"><div class="field grow"><label for="pay-role">${T("Puesto", "Role")}</label><input class="input" id="pay-role" maxlength="80" value="${esc(PAY.role)}"></div><div class="field grow"><label for="pay-city">${T("Ciudad", "City")}</label><input class="input" id="pay-city" maxlength="60" value="${esc(PAY.city)}"></div></div>
    <div class="row g2 wrap"><div class="field grow"><label for="pay-co">${T("Empresa (opcional)", "Company (optional)")}</label><input class="input" id="pay-co" maxlength="80" value="${esc(PAY.company)}"></div><div class="field grow"><label for="pay-amt">${T("Sueldo bruto anual (€)", "Gross yearly pay (€)")}</label><input class="input" id="pay-amt" type="number" inputmode="numeric" min="3000" step="500" value="${esc(PAY.amount)}"></div></div>
    <label class="check"><input type="checkbox" id="pay-share" checked> ${T("Aportar mi dato de forma anónima (ayuda a todos)", "Share my figure anonymously (helps everyone)")}</label>
    ${r ? `<div class="card stack g2">${r.role ? `<p><strong>${esc(PAY.role)}${PAY.city ? " · " + esc(PAY.city) : ""}</strong>: ${T(`mediana ${money(r.role.med)} (entre ${money(r.role.p25)} y ${money(r.role.p75)}), ${r.role.n} dato${r.role.n > 1 ? "s" : ""}.`, `median ${money(r.role.med)} (${money(r.role.p25)}–${money(r.role.p75)}), ${r.role.n} report${r.role.n > 1 ? "s" : ""}.`)}</p>` : `<p class="muted">${T("Aún no hay datos de este puesto aquí. El tuyo será el primero.", "No data for this role here yet. Yours will be the first.")}</p>`}${r.co ? `<p><strong>${esc(PAY.company)}</strong>: ${T(`mediana ${money(r.co.med)} (${r.co.n})`, `median ${money(r.co.med)} (${r.co.n})`)}</p>` : ""}${r.verdict ? `<p class="note">${ico("info")}<span>${r.verdict}</span></p>` : ""}</div>` : ""}</div>
    <div class="sheet-foot"><button class="btn btn-primary" type="button" data-action="pay-go">${T("Comparar", "Compare")}</button></div>`;
}

// ---------- Lo que busca la gente (tendencias) ----------
let INS = null;
async function loadInsights() { if (INS && Date.now() - INS.at < 30 * 6e4) return; const d = await api("insights", {}); INS = { at: Date.now(), ...(d || {}) }; }
function insightsCard() {
  if (!INS || (!INS.terms?.length && !INS.places?.length && !INS.tags?.length)) return "";
  return `<section class="card stack g3 insights"><h2 class="section-title">${T("Lo que busca y cuenta la gente esta semana", "What people search and report this week")}</h2>
    ${INS.terms?.length ? `<div><span class="post-meta">${T("Puestos más buscados", "Most searched roles")}</span><div class="chips wrapchips">${INS.terms.slice(0, 8).map((x) => `<span class="chip chip-sm static">${esc(x.term)} · ${x.n}</span>`).join("")}</div></div>` : ""}
    ${INS.places?.length ? `<div><span class="post-meta">${T("Ciudades", "Cities")}</span><div class="chips wrapchips">${INS.places.slice(0, 6).map((x) => `<span class="chip chip-sm static">${esc(x.place)} · ${x.n}</span>`).join("")}</div></div>` : ""}
    ${INS.tags?.length ? `<div><span class="post-meta">${T("Lo que más avisa la gente", "What people warn about most")}</span><div class="chips wrapchips">${INS.tags.slice(0, 6).map((x) => `<span class="chip chip-sm static">${esc(x.tag)} · ${x.n}</span>`).join("")}</div></div>` : ""}</section>`;
}

// ---------- Semana: progreso real ----------
function weekCard() {
  const since = new Date(); since.setDate(since.getDate() - 7); const s = since.toISOString().slice(0, 10);
  const applied = (S.jobs || []).filter((j) => j.appliedAt && j.appliedAt >= s).length;
  const interviews = (S.jobs || []).filter((j) => j.status === "interview").length;
  const saved = (S.hunt?.saved || []).length;
  if (!applied && !interviews && !saved) return "";
  const goal = S.weekGoal || 5;
  return `<section class="card stack g2 week"><div class="row between"><h2 class="section-title">${T("Tu semana", "Your week")}</h2><button class="link-btn small" type="button" data-action="week-goal">${T(`Meta: ${goal} candidaturas`, `Goal: ${goal} applications`)}</button></div>
    <div class="trio"><div><strong>${applied}</strong><span class="post-meta">${T("enviadas", "sent")}</span></div><div><strong>${interviews}</strong><span class="post-meta">${T("entrevistas", "interviews")}</span></div><div><strong>${saved}</strong><span class="post-meta">${T("guardadas", "saved")}</span></div></div>
    <div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="${goal}" aria-valuenow="${applied}"><i style="width:${Math.min(100, (applied / goal) * 100)}%"></i></div></section>`;
}

// ---------- Inicio, Perfil y Descubrir ----------
const _viewInicio7 = viewInicio;
viewInicio = function () {
  let h = _viewInicio7();
  h = h.replace('<section class="stack g3" aria-labelledby="tools-t">', insiderCard() + weekCard() + '<section class="stack g3" aria-labelledby="tools-t">');
  if (typeof INV_N === "number") h = h.replace(/<span class="muted">\d+\/3<\/span><\/div><div class="meter" aria-hidden="true"><i style="width:[^"]*"><\/i>/, `<span class="muted">${Math.min(INV_N, 3)}/3</span></div><div class="meter" aria-hidden="true"><i style="width:${(Math.min(INV_N, 3) / 3) * 100}%"></i>`).replace("Enlaces compartidos", "Amigos que se unieron").replace("Links shared", "Friends who joined");
  return h;
};
const _toolsCard7 = toolsCard;
toolsCard = function () {
  const extra = [["pay", "dinero", T("¿Es justo mi sueldo?", "Is my pay fair?"), T("Datos de gente real", "Real people's data")], ["remotehome", "viajes", T("Remoto + casa barata", "Remote job + cheap home"), T("Las dos piezas juntas", "Both pieces together")], ["map", "vivienda", T("Mapa de edificios", "Building map"), T("Humedad, ruido, estafas…", "Damp, noise, scams…")], ["ctop", "organizacion", T("Empresas que responden", "Companies that reply"), T("Ranking de la comunidad", "Community ranking")]];
  const html = _toolsCard7();
  return html.replace('<div class="tools">', `<div class="tools">${extra.map(([k, icn, t, d]) => `<button class="tool" type="button" data-action="tool" data-v="${k}"><img src="${iconSrc(icn)}" alt="" width="48" height="48" loading="lazy"><span class="stack g1"><strong>${t}</strong><span class="post-meta">${d}</span></span></button>`).join("")}`);
};
const _viewPerfil7 = viewPerfil;
viewPerfil = function () {
  const ins = S.me?.insider || {};
  const sec = `<section class="card stack g3" aria-labelledby="ins-t"><h2 class="section-title" id="ins-t">${T("Ayuda a otras personas (anónimo)", "Help others (anonymous)")}</h2>
    <p class="muted small">${T("Si dices dónde trabajas, otras personas podrán preguntarte cosas que no salen en ninguna web: sueldo real, ambiente, cómo es la entrevista. Nadie ve tu nombre.", "If you say where you work, others can ask you things no website has: real pay, culture, what the interview is like. Nobody sees your name.")}</p>
    <div class="row g2 wrap"><div class="field grow"><label for="ins-co">${T("Empresa donde trabajas", "Company you work at")}</label><input class="input" id="ins-co" maxlength="80" value="${esc(ins.company || "")}"></div><div class="field grow"><label for="ins-role">${T("Puesto (opcional)", "Role (optional)")}</label><input class="input" id="ins-role" maxlength="80" value="${esc(ins.role || "")}"></div></div>
    <div class="row g2 wrap"><button class="btn btn-secondary btn-sm" type="button" data-action="ins-save">${ins.company ? T("Actualizar", "Update") : T("Guardar", "Save")}</button>${ins.company ? `<button class="btn btn-ghost btn-sm" type="button" data-action="ins-clear">${T("Dejar de responder", "Stop answering")}</button>` : ""}</div></section>`;
  let h = _viewPerfil7().replace('<section class="card stack g3" aria-labelledby="demo-t">', sec + '<section class="card stack g3" aria-labelledby="demo-t">');
  if (S.push) h = h.replace(/<div class="switch"><span><strong>(Avisos en el dispositivo|Device alerts)<\/strong>[\s\S]*?<\/div>\s*(?=\$|<div class="switch">|<p class="hint">|<button class="link-btn)/, `<div class="switch"><span><strong>${T("Avisos con la app cerrada", "Alerts with the app closed")}</strong><br><span class="muted small">${T("Activados: ofertas nuevas, fechas, seguimientos y empresas que sigues.", "On: new jobs, dates, follow-ups and companies you follow.")}</span></span><button class="btn btn-ghost btn-sm" type="button" data-action="push-off">${T("Desactivar", "Turn off")}</button></div>`);
  return h;
};
const _viewDescubrir7 = viewDescubrir;
viewDescubrir = function () { return _viewDescubrir7().replace('<div class="toolbar">', insightsCard() + '<div class="toolbar">'); };
// «Nivel 0» desanima: «Nuevo»
const _lvlChip7 = lvlChip;
lvlChip = function (p, button) { const h = _lvlChip7(p, button); return h.replace(/(Nivel|Level) 0(?=<)/, T("Nuevo", "New")); };

// ---------- Invitaciones reales ----------
let INV_N = null;
const _callFn7 = callFn;
callFn = function (fn, body, timeout) { if (fn === "persohna-api" && body?.action === "signup" && S.ref) body = { ...body, ref: S.ref }; return _callFn7(fn, body, timeout); };
async function loadInvites() { if (!S.me?.code) return; const d = await api("my_invites", { code: S.me.code }); if (d && typeof d.n === "number") { INV_N = d.n; if (ui.route === "inicio" && !stackLayers.length) render({ keepScroll: true }); } }
try { const r = new URLSearchParams(location.search).get("ref"); if (r && !S.me && /^[a-z0-9]{4,12}$/i.test(r)) { S.ref = r.toLowerCase(); save(); } } catch {}

// ---------- Botón «atrás» del móvil cierra hojas (sin tocar la navegación por secciones) ----------
const _openLayer7 = openLayer;
openLayer = function (html, opts = {}) { const el = _openLayer7(html, opts); try { history.pushState({ pxLayer: Date.now() }, "", location.href); } catch {} return el; };
window.addEventListener("popstate", () => { if (stackLayers.length) closeLayer(); });

// ---------- Avisos: los enlaces llevan a la herramienta ----------
document.addEventListener("click", (e) => {
  const b = e.target.closest('[data-action="inbox-open"]'); if (!b) return;
  const link = b.dataset.link || ""; if (!link.startsWith("tool:")) return;
  e.stopPropagation(); e.preventDefault(); closeAll();
  const [, t, id] = link.split(":");
  setTimeout(() => { if (t === "hunt") openHunt(); else if (t === "homes") openHomes(); else if (t === "followup") { openJobs(); setTimeout(() => openFollowup(id), 200); } }, 250);
}, true);

// ---------- Eventos ----------
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-action]"); if (!b) return;
  const a = b.dataset.action, id = +b.dataset.id;
  switch (a) {
    case "tool": { const v = b.dataset.v; if (v === "pay") openPay(); else if (v === "remotehome") openRemoteHome(); else if (v === "map") openMap(); else if (v === "ctop") openCompaniesTop(); break; }
    case "companies-top": openCompaniesTop(); break;
    case "hunt-f": { const h = H(); if (b.dataset.v === "salary") h.onlySalary = !h.onlySalary; else h.sort = h.sort === "date" ? "fit" : "date"; save(); refreshHunt(); break; }
    case "sal-report": {
      const h = H(), j = (h.jobs.concat(h.savedJobs || [])).find((x) => x.id === id); const v = +($(`#sal-${id}`)?.value || 0);
      if (!j || v < 3000) { toast(T("Pon el sueldo bruto anual en euros.", "Enter the gross yearly pay in euros.")); return; }
      const base = { token: loggedIn() ? AUTH.token : undefined, device: DEVICE, kind: "salary", amount: v, unit: "year" };
      await Promise.all([api("report", { ...base, key: cn(j.company), sub: cn(j.title) }), api("report", { ...base, key: "role:" + cn(j.title), sub: cn(S.hunt?.city || "") })]);
      delete COMP.sal[cn(j.company)]; COMP.loaded.delete(cn(j.company)); await loadCompanyData([j.company]); HS.op = null; refreshHunt();
      toast(T("Gracias: es el dato que nadie más tiene", "Thanks: nobody else has this data")); break;
    }
    case "qa-open": openQA(b.dataset.c); break;
    case "qa-send": {
      const t = ($("#qa-q")?.value || "").trim(); if (t.length < 8) { $("#qa-q")?.focus(); return; }
      const d = await api("qa_ask", { company: cn(QA.company), q: t, token: loggedIn() ? AUTH.token : undefined, device: DEVICE });
      if (d?.ok) { QA.items.unshift({ q: t, a: null, mine: true }); setLayer(qaHTML()); toast(T("Pregunta enviada. Te aviso en la campana cuando respondan.", "Question sent. I'll tell you when someone answers.")); S.myQs = [...(S.myQs || []), { company: QA.company, q: t, at: today() }].slice(-20); save(); }
      else toast(T("No he podido enviarla.", "Couldn't send it.")); break;
    }
    case "qa-answer": {
      const t = ($("#qa-a")?.value || "").trim(); if (t.length < 5) { $("#qa-a")?.focus(); return; }
      const d = await api("qa_answer", { id, a: t, token: loggedIn() ? AUTH.token : undefined, device: DEVICE });
      if (d?.ok) { QIN.items.shift(); S.xp += 10; save(); render({ keepScroll: true }); toast(T("¡Gracias! +10 puntos", "Thanks! +10 points")); } break;
    }
    case "ins-save": case "ins-clear": {
      const company = a === "ins-clear" ? "" : ($("#ins-co")?.value || "").trim(), role = ($("#ins-role")?.value || "").trim();
      const d = await api("insider_set", { company: cn(company), role, open: true, token: loggedIn() ? AUTH.token : undefined, device: DEVICE });
      if (d?.ok) { S.me.insider = company ? { company, role } : null; save(); render({ keepScroll: true }); toast(company ? T("Listo: te avisaré cuando alguien pregunte", "Done: I'll tell you when someone asks") : T("Ya no recibirás preguntas", "You won't get questions anymore")); loadInsiderInbox(); }
      break;
    }
    case "watch": {
      const c = cn(b.dataset.c); S.watch = S.watch || [];
      S.watch = S.watch.includes(c) ? S.watch.filter((x) => x !== c) : [...S.watch, c].slice(-10);
      if (!S.watchSeen) S.watchSeen = [];
      if (S.watch.includes(c)) rpc(JB, "px_company_jobs", { p_company: c, p_limit: 10 }).then((l) => { if (Array.isArray(l)) { S.watchSeen = [...new Set([...S.watchSeen, ...l.map((j) => j.id)])].slice(-300); save(); } });
      save(); pushSync(); refreshHunt();
      toast(S.watch.includes(c) ? T("Te aviso cuando publique algo nuevo", "I'll tell you when they post something new") : T("Ya no la sigues", "Unfollowed")); break;
    }
    case "cvdoc": makeCVdoc(id); break;
    case "brief": makeBrief(id); break;
    case "mail-sent": setTimeout(() => toast(T("¿La enviaste? Márcala abajo como enviada.", "Sent it? Mark it as sent below.")), 1500); break;
    case "followup": openFollowup(b.dataset.id); break;
    case "fu-done": { const j = S.jobs.find((x) => x.id === b.dataset.id); if (j) { j.followedAt = today(); addHistory(`Seguimiento enviado: ${j.title}`, `Follow-up sent: ${j.title}`); save(); } closeLayer(); toast(T("Hecho", "Done")); break; }
    case "week-goal": { const v = prompt(T("¿Cuántas candidaturas quieres enviar por semana?", "How many applications per week?"), S.weekGoal || 5); const n = Math.max(1, Math.min(50, parseInt(v, 10) || 0)); if (n) { S.weekGoal = n; save(); render({ keepScroll: true }); } break; }
    case "home-save": { const slug = b.dataset.k; S.homesSaved = S.homesSaved || {}; const r = (HO?.rows || []).find((x) => x.slug === slug); if (S.homesSaved[slug]) delete S.homesSaved[slug]; else if (r) { S.homesSaved[slug] = { price: r.price_eur, title: r.title }; sendSignal("home:" + slug, "home", "saved", { title: r.title }); } save(); setLayer(homesHTML()); toast(S.homesSaved[slug] ? T("Te aviso si baja de precio", "I'll tell you if the price drops") : T("Quitada", "Removed")); break; }
    case "rent-report": {
      const amt = +($("#rent-amt")?.value || 0), m2 = +($("#rent-m2")?.value || 0), zone = ($("#rent-zone")?.value || "").trim();
      if (amt < 80 || !zone) { toast(T("Pon lo que pagas al mes y la ciudad o barrio.", "Enter what you pay a month and the city or area.")); return; }
      const d = await api("report", { kind: "rent", key: cn(zone), sub: "", amount: amt, m2: m2 || null, unit: "month", token: loggedIn() ? AUTH.token : undefined, device: DEVICE });
      if (d?.ok) { const f = await api("reports", { kind: "rent", keys: [cn(zone)] }); if (cn(zone) === cn(HO.zona)) HO.fair = f?.items?.[cn(zone)] || HO.fair; setLayer(homesHTML()); toast(T("Gracias: ayudas a que nadie pague de más", "Thanks: you help nobody overpay")); }
      else toast(T("Revisa los datos (m² entre 8 y 1000).", "Check the numbers (m² between 8 and 1000).")); break;
    }
    case "rent-negotiate": { const f = HO.fair; openNegotiate(); NG.who = "casero"; NG.goal = T("Que me bajen el alquiler a un precio justo para la zona", "Lower my rent to a fair price for the area"); NG.ctx = T(`Según lo que pagan ${f.n} inquilinos reales en ${HO.zona} (datos de Persohna), la mediana es ${f.med} €/m² al mes (entre ${f.p25} y ${f.p75}). Mi piso: [m²] m² por [precio] €/mes.`, `Based on what ${f.n} real tenants in ${HO.zona} pay (Persohna data), the median is ${f.med} €/m² a month (${f.p25}–${f.p75}). My flat: [m²] m² for [price] €/month.`); setLayer(ngHTML()); break; }
    case "map-open": openMap(); break;
    case "map-find": {
      const q = ($("#map-addr")?.value || "").trim(); if (!q) return;
      const g = await geocode(q); if (!g) { toast(T("No encuentro esa dirección.", "Can't find that address.")); return; }
      MAP?.setView([g.lat, g.lng], 18);
      const box = $("#map-report"); if (box) box.innerHTML = `<p class="small"><strong>${esc(g.name.slice(0, 120))}</strong></p><div class="chips wrapchips">${HOME_OPINION().map(([t, s]) => `<button class="chip chip-sm" type="button" data-action="map-tag" data-t="${esc(t)}" data-s="${s}" data-lat="${g.lat}" data-lng="${g.lng}" data-addr="${esc(g.name.slice(0, 140))}">${esc(t)}</button>`).join("")}</div>`;
      break;
    }
    case "map-tag": {
      const lat = +b.dataset.lat, lng = +b.dataset.lng;
      await sendSignal(`home:geo:${lat.toFixed(4)},${lng.toFixed(4)}`, "home", b.dataset.s, { title: b.dataset.addr, tags: [cn(b.dataset.t)], meta: { lat, lng, addr: b.dataset.addr } });
      toast(T("Gracias: ya sale en el mapa", "Thanks: it's on the map now")); mapLoad(); break;
    }
    case "visit-open": openVisit(b.dataset.u); break;
    case "visit-share": {
      const v = S.visits[VS.key]; const bad = VISIT_ITEMS().filter(([k]) => v.marks[k]).map(([, l]) => cn(l));
      if (!bad.length) { closeLayer(); toast(T("Sin problemas marcados. ¡Buena señal!", "No problems ticked. Good sign!")); break; }
      await sendSignal(VS.key, "home", "bad", { title: VS.url.slice(0, 200), tags: bad.slice(0, 6), meta: { url: VS.url.slice(0, 300) } });
      closeLayer(); toast(T("Compartido en anónimo. Gracias.", "Shared anonymously. Thanks.")); break;
    }
    case "pay-go": {
      PAY.role = ($("#pay-role")?.value || "").trim(); PAY.city = ($("#pay-city")?.value || "").trim(); PAY.company = ($("#pay-co")?.value || "").trim(); PAY.amount = $("#pay-amt")?.value || "";
      if (!PAY.role) { $("#pay-role")?.focus(); return; }
      const amt = +PAY.amount, share = $("#pay-share")?.checked;
      if (share && amt >= 3000) { const base = { token: loggedIn() ? AUTH.token : undefined, device: DEVICE, kind: "salary", amount: amt, unit: "year" }; await api("report", { ...base, key: "role:" + cn(PAY.role), sub: cn(PAY.city) }); if (PAY.company) await api("report", { ...base, key: cn(PAY.company), sub: cn(PAY.role) }); }
      const [r1, r2] = await Promise.all([api("reports", { kind: "salary", keys: ["role:" + cn(PAY.role)] }), PAY.company ? api("reports", { kind: "salary", keys: [cn(PAY.company)] }) : null]);
      const role = r1?.items?.["role:" + cn(PAY.role)] || null, co = r2?.items?.[cn(PAY.company)] || null;
      let verdict = "";
      const ref = co || role;
      if (ref && amt && ref.n >= 2) verdict = amt < ref.p25 ? T(`Estás por debajo de lo que cobra la mayoría (${money(ref.p25)}+). Tienes argumentos para pedir más.`, `You're below most people (${money(ref.p25)}+). You have grounds to ask for more.`) : amt > ref.p75 ? T("Estás por encima de la mayoría. Buena posición.", "You're above most. Good position.") : T("Estás dentro de lo normal.", "You're within the normal range.");
      else if (amt) verdict = T("Con tan pocos datos aún no puedo comparar con seguridad. Gracias por aportar el tuyo.", "Too little data to compare reliably yet. Thanks for sharing yours.");
      PAY.res = { role, co, verdict }; setLayer(payHTML()); break;
    }
    case "push-off": { try { const reg = await navigator.serviceWorker.getRegistration(); const sub = await reg?.pushManager?.getSubscription(); if (sub) { await callFn(PUSH_FN, { action: "unsub", endpoint: sub.endpoint }); await sub.unsubscribe(); } } catch {} S.push = false; save(); render({ keepScroll: true }); toast(T("Avisos desactivados", "Alerts off")); break; }
  }
});
// «Activar avisos» ahora activa los avisos con la app cerrada
document.addEventListener("click", async (e) => { const b = e.target.closest('[data-action="notif-on"]'); if (!b) return; e.stopPropagation(); e.preventDefault(); if (await pushEnable()) { render({ keepScroll: true }); toast(T("Listo: te aviso aunque tengas la app cerrada", "Done: I'll alert you even with the app closed")); } }, true);
document.addEventListener("change", (e) => { const k = e.target.dataset?.visit; if (k && VS) { S.visits[VS.key].marks[k] = e.target.checked; save(); } });
// abrir desde un aviso push
try { const o = new URLSearchParams(location.search).get("open"); if (o === "hunt") setTimeout(() => openHunt(), 800); } catch {}
// arranque: datos de la comunidad y comprobaciones diarias
setTimeout(() => { if (!S.me) return; loadInsiderInbox().then(() => { if (QIN && ui.route === "inicio" && !stackLayers.length) render({ keepScroll: true }); }); loadInvites(); homesPriceCheck(); watchCheck(); loadInsights(); pushSync(); }, 3000);
if (!stackLayers.length) render({ keepScroll: true });
