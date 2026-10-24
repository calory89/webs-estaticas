// carlosdeory.com contact form -> saved in public.cdo_contact_messages and emailed to Carlos.
// The destination inbox lives only in the secret CDO_CONTACT_TO, never in the website.
// Also: newsletter sign-ups (type=subscribe) -> public.cdo_newsletter.
const ALLOWED = ["https://www.carlosdeory.com", "https://carlosdeory.com"];
const KINDS: Record<string, string> = {
  talk: "Talk / Ponencia",
  agency: "Growth marketing",
  affiliate: "Affiliate income / Afiliación",
  other: "Other / Otro",
};

function cors(origin: string) {
  return {
    "Access-Control-Allow-Origin": ALLOWED.includes(origin) ? origin : ALLOWED[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Vary": "Origin",
  };
}
function json(body: unknown, status: number, h: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: { ...h, "content-type": "application/json; charset=utf-8" } });
}
function clean(v: unknown, n: number) {
  return String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, n);
}
function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string, string>)[c]);
}
async function hmac(s: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! + ":cdo-unsub"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const b = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, 32);
}
const SITE = "https://www.carlosdeory.com";
const FN = "https://oykcsmextclpdnugixqz.supabase.co/functions/v1/cdo-contact";
// Envia con Resend; prueba primero el remitente de carlosdeory.com y, si el dominio no esta verificado, el de realhunt.co
async function send(p: { to: string[]; subject: string; html: string; text: string; reply_to?: string; headers?: Record<string, string> }) {
  const rk = Deno.env.get("RESEND_API_KEY") ?? Deno.env.get("REALHUNT_RESEND_API_KEY");
  const rk2 = Deno.env.get("REALHUNT_RESEND_API_KEY") ?? rk;
  if (!rk) return false;
  const tries: [string, string][] = [[rk, "Carlos de Ory <hola@carlosdeory.com>"], [rk2!, "Carlos de Ory <web@realhunt.co>"]];
  for (const [key, from] of tries) {
    const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, ...p }) });
    if (r.ok) return true;
    const t = await r.text();
    if (!/domain|verif|from/i.test(t)) { console.log("resend", r.status, t.slice(0, 200)); return false; }
  }
  return false;
}
function shell(body: string, foot = "") {
  return `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#15151A;font-size:16px;line-height:1.6">${body}<p style="margin-top:28px;color:#888;font-size:12px;line-height:1.5">Carlos de Ory · Equinox Investment Group LLC · 30 N Gould St Ste N, Sheridan, WY 82801, USA${foot}</p></div>`;
}
function btn(href: string, label: string) {
  return `<p style="margin:22px 0"><a href="${href}" style="background:#C2452D;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px;display:inline-block">${label}</a></p>`;
}
async function sha(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  const h = cors(origin);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  if (req.method === "GET") {
    const u = new URL(req.url), em = (u.searchParams.get("u") ?? "").toLowerCase(), t = u.searchParams.get("t") ?? "";
    const page = (msg: string) => new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Carlos de Ory</title><div style="font-family:sans-serif;max-width:480px;margin:80px auto;padding:0 20px;font-size:18px;line-height:1.5">${msg}<p><a href="${SITE}/">carlosdeory.com</a></p></div>`, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
    if (!em || t !== await hmac(em)) return page("Enlace no válido. / Invalid link.");
    const SBu = Deno.env.get("SUPABASE_URL")!, Ku = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    await fetch(`${SBu}/rest/v1/cdo_newsletter?email=eq.${encodeURIComponent(em)}`, { method: "PATCH", headers: { apikey: Ku, Authorization: `Bearer ${Ku}`, "Content-Type": "application/json" }, body: JSON.stringify({ unsubscribed_at: new Date().toISOString() }) });
    return page("Listo: ya no recibirás más emails. / Done: you will not receive more emails.");
  }
  if (req.method !== "POST") return json({ ok: false, error: "method" }, 405, h);
  if (origin && !ALLOWED.includes(origin)) return json({ ok: false, error: "origin" }, 403, h);

  // secuencia de bienvenida (drip) y aviso de episodios nuevos del libro: solo pg_cron con el secreto
  const qp = new URL(req.url).searchParams;
  if (qp.get("drip") === "1" || qp.get("episodes") === "1") {
    if (!Deno.env.get("CDO_DIGEST_SECRET") || req.headers.get("x-cdo-digest") !== Deno.env.get("CDO_DIGEST_SECRET")) return json({ ok: false }, 401, h);
    const K = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, S = Deno.env.get("SUPABASE_URL")!;
    const rh = { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": "application/json" };
    const unsubLink = async (em: string) => `${FN}?u=${encodeURIComponent(em)}&t=${await hmac(em)}`;
    if (qp.get("drip") === "1") {
      const DAYS = [2, 5, 9, 14, 21];
      const STEPS: Record<string, [string, string, string, string][]> = {
        es: [
          ["El primer capítulo de mi libro", "Estoy escribiendo un libro sobre crear empresas y una vida elegida. El primer episodio va de por qué casi nadie fracasa por falta de talento.", "/el-dia-que-dejas-de-esperar/", "Leer el episodio 1"],
          ["Por qué vivo en Sumba", "Vivo a una hora de Bali, en Sumba, donde estamos construyendo Eco Beach City. Aquí cuento qué hay detrás y cómo participar.", "/parcela-sumba-curso-sevilla-venture-builder/", "Ver la historia"],
          ["Las tres horas que deciden tu vida", "El segundo episodio del libro: por qué de 5 a 8 gana a de 9 a 12, y una acción para esta noche.", "/de-5-a-8-o-de-9-a-12/", "Leer el episodio 2"],
          ["Las herramientas que uso para viajar", "Tarjetas, seguros, reservas y trucos de millas que uso de verdad, sin relleno.", "/herramientas/", "Ver mis herramientas"],
          ["Si quieres trabajar conmigo", "Además de escribir, doy conferencias en español e inglés y mi equipo hace growth marketing para empresas. Si alguna de las dos te encaja, contesta desde la web.", "/speaking/", "Ver charlas y agencia"]],
        en: [
          ["The first chapter of my book", "I am writing a book about building companies and a life you choose. Episode 1 is about why almost nobody fails for lack of talent.", "/the-day-you-stop-waiting/", "Read episode 1"],
          ["Why I live on Sumba", "I live one hour from Bali, on Sumba, where we are building Eco Beach City. Here is the honest comparison between the two islands.", "/sumba-vs-bali-honest-comparison/", "Read the comparison"],
          ["The three hours that decide your life", "Episode 2 of the book: why 5 to 8 beats 9 to 12, and one action for tonight.", "/5-to-8-or-9-to-12/", "Read episode 2"],
          ["Five hours of sleep and three companies", "What a baby did to the way I work, and what I would tell any founder about time.", "/father-and-founder/", "Read the story"],
          ["If you want to work with me", "Besides writing, I give keynotes in English and Spanish and my team runs growth marketing for companies. If either fits, get in touch through the site.", "/speaking/", "See talks and agency"]]};
      const subs = await (await fetch(`${S}/rest/v1/cdo_newsletter?select=email,lang,drip_step,created_at&unsubscribed_at=is.null&welcomed_at=not.is.null&drip_step=lt.5&limit=200`, { headers: rh })).json();
      let sent = 0;
      for (const sub of subs) {
        const step = Number(sub.drip_step || 0);
        if (Date.now() - new Date(sub.created_at).getTime() < DAYS[step] * 864e5) continue;
        const es = sub.lang === "es", [subj, txt, path, cta] = STEPS[es ? "es" : "en"][step];
        const un = await unsubLink(sub.email);
        const ok = await send({ to: [sub.email], subject: subj, html: shell(`<p>${es ? "Hola" : "Hi"},</p><p>${esc(txt)}</p>${btn(SITE + path, cta)}<p>Carlos</p>`, ` · <a href="${un}" style="color:#888">${es ? "Darme de baja" : "Unsubscribe"}</a>`),
          text: `${txt}\n\n${SITE}${path}\n\n${es ? "Darme de baja" : "Unsubscribe"}: ${un}`, headers: { "List-Unsubscribe": `<${un}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } });
        if (ok) { sent++; await fetch(`${S}/rest/v1/cdo_newsletter?email=eq.${encodeURIComponent(sub.email)}`, { method: "PATCH", headers: rh, body: JSON.stringify({ drip_step: step + 1, drip_last_at: new Date().toISOString() }) }); }
      }
      return json({ ok: true, sent }, 200, h);
    }
    // episodios nuevos del libro (feed RSS de la web)
    const feed = await (await fetch(`${SITE}/feed.xml?cb=${Date.now()}`)).text();
    const items = [...feed.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]).filter((it) => /<category>episod(ios|es)<\/category>/.test(it));
    let notified = 0;
    for (const it of items) {
      const url = (it.match(/<link>([^<]+)<\/link>/) ?? [])[1]; if (!url) continue;
      const seen = await (await fetch(`${S}/rest/v1/cdo_sent_posts?select=url&url=eq.${encodeURIComponent(url)}`, { headers: rh })).json();
      if (seen.length) continue;
      const lang = /<category>episodios<\/category>/.test(it) ? "es" : "en";
      const title = ((it.match(/<title>([^<]+)<\/title>/) ?? [])[1] ?? "").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
      const desc = ((it.match(/<description>([^<]*)<\/description>/) ?? [])[1] ?? "").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
      await fetch(`${S}/rest/v1/cdo_sent_posts`, { method: "POST", headers: { ...rh, Prefer: "resolution=ignore-duplicates" }, body: JSON.stringify({ url }) });
      const subs = await (await fetch(`${S}/rest/v1/cdo_newsletter?select=email&unsubscribed_at=is.null&lang=eq.${lang}&limit=5000`, { headers: rh })).json();
      let n = 0;
      for (const sub of subs) {
        const un = await unsubLink(sub.email), es = lang === "es";
        if (await send({ to: [sub.email], subject: title, html: shell(`<p>${esc(desc)}</p>${btn(url, es ? "Leer el episodio" : "Read the episode")}<p>Carlos</p>`, ` · <a href="${un}" style="color:#888">${es ? "Darme de baja" : "Unsubscribe"}</a>`),
          text: `${desc}\n\n${url}\n\n${es ? "Darme de baja" : "Unsubscribe"}: ${un}`, headers: { "List-Unsubscribe": `<${un}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } })) n++;
      }
      await fetch(`${S}/rest/v1/cdo_sent_posts?url=eq.${encodeURIComponent(url)}`, { method: "PATCH", headers: rh, body: JSON.stringify({ recipients: n }) });
      const to = Deno.env.get("CDO_CONTACT_TO");
      if (to) await send({ to: [to], subject: `[carlosdeory.com] Episodio enviado a ${n} suscriptores`, html: shell(`<p>${esc(title)}</p><p>${n} envíos.</p>`), text: `${title}: ${n}` });
      notified++;
    }
    return json({ ok: true, notified }, 200, h);
  }
  // resumen semanal (solo pg_cron con la service role)
  if (new URL(req.url).searchParams.get("digest") === "1") {
    const K = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, S = Deno.env.get("SUPABASE_URL")!;
    if (!Deno.env.get("CDO_DIGEST_SECRET") || req.headers.get("x-cdo-digest") !== Deno.env.get("CDO_DIGEST_SECRET")) return json({ ok: false }, 401, h);
    const rh = { apikey: K, Authorization: `Bearer ${K}` };
    const since = new Date(Date.now() - 7 * 864e5).toISOString();
    const subs = await (await fetch(`${S}/rest/v1/cdo_newsletter?select=email,lang,source,country,created_at&created_at=gte.${since}&order=created_at.desc`, { headers: rh })).json();
    const leads = await (await fetch(`${S}/rest/v1/cdo_contact_messages?select=name,email,company,kind,priority,country,created_at&created_at=gte.${since}&order=created_at.desc`, { headers: rh })).json();
    const tot = await fetch(`${S}/rest/v1/cdo_newsletter?select=id&unsubscribed_at=is.null`, { headers: { ...rh, Prefer: "count=exact", Range: "0-0" } });
    const total = (tot.headers.get("content-range") ?? "*/0").split("/")[1];
    const bySrc: Record<string, number> = {};
    for (const s1 of subs) { const k = String(s1.source || "web").split(":")[0]; bySrc[k] = (bySrc[k] || 0) + 1; }
    const li = leads.map((l: Record<string, unknown>) => `<li>${l.priority ? "⭐ " : ""}<b>${esc(String(KINDS[String(l.kind)] ?? l.kind))}</b> · ${esc(String(l.name))}${l.company ? " · " + esc(String(l.company)) : ""} · ${esc(String(l.email))}</li>`).join("");
    const alert = !subs.length && !leads.length ? `<p style="color:#C2452D"><b>Ojo:</b> ninguna alta ni ningún mensaje en 7 días. Conviene probar los formularios.</p>` : "";
    const to = Deno.env.get("CDO_CONTACT_TO");
    if (to) await send({ to: [to], subject: `[carlosdeory.com] Semana: ${subs.length} suscriptores, ${leads.length} mensajes`,
      html: shell(`<h2>Resumen de la semana</h2>${alert}<p><b>${subs.length}</b> suscriptores nuevos (total activos: ${esc(String(total))}). Origen: ${Object.entries(bySrc).map(([k, v]) => `${esc(k)} ${v}`).join(", ") || "-"}.</p><p><b>${leads.length}</b> mensajes:</p><ul>${li || "<li>Ninguno</li>"}</ul>`),
      text: `${subs.length} suscriptores, ${leads.length} mensajes` });
    return json({ ok: true, subs: subs.length, leads: leads.length }, 200, h);
  }
  let d: Record<string, unknown>;
  try { d = await req.json(); } catch { return json({ ok: false, error: "bad_json" }, 400, h); }
  if (clean(d.website, 200)) return json({ ok: true }, 200, h); // honeypot

  const SB0 = Deno.env.get("SUPABASE_URL")!, KEY0 = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const rest0 = { apikey: KEY0, Authorization: `Bearer ${KEY0}`, "Content-Type": "application/json" };

  // newsletter sign-up (carlosdeory.com/links and the home page)
  if (d.type === "subscribe") {
    const em = clean(d.email, 200).toLowerCase(), nm = clean(d.name, 120);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return json({ ok: false, error: "invalid" }, 422, h);
    if (d.consent !== true) return json({ ok: false, error: "consent" }, 422, h);
    const ip0 = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0";
    const ih = await sha("cdo:" + ip0);
    const since0 = new Date(Date.now() - 3600_000).toISOString();
    const c0 = await fetch(`${SB0}/rest/v1/cdo_newsletter?select=id&ip_hash=eq.${ih}&created_at=gte.${since0}`, { headers: { ...rest0, Prefer: "count=exact", Range: "0-0" } });
    if (Number((c0.headers.get("content-range") ?? "*/0").split("/")[1] || 0) >= 10) return json({ ok: false, error: "rate" }, 429, h);
    const r0 = await fetch(`${SB0}/rest/v1/cdo_newsletter?on_conflict=email`, {
      method: "POST", headers: { ...rest0, Prefer: "resolution=ignore-duplicates,return=representation" },
      body: JSON.stringify({ email: em, name: nm || null, lang: d.lang === "es" ? "es" : "en", source: clean(d.source, 120) || "web",
        country: req.headers.get("cf-ipcountry") ?? "", ip_hash: ih, consent: true }),
    });
    if (!r0.ok) return json({ ok: false, error: "store" }, 502, h);
    const created = await r0.json().catch(() => []);
    if (Array.isArray(created) && created.length) {
      const es = d.lang === "es", pdf = `${SITE}/assets/cdo/million-mile-playbook-${es ? "es" : "en"}.pdf`;
      const gslug = (clean(d.source, 120).match(/^guide:([a-z0-9-]{2,40})$/) ?? [])[1];
      const cslug = (clean(d.source, 120).match(/^checklist:([a-z0-9-]{2,40})$/) ?? [])[1];
      const gpdf = gslug ? `${SITE}/assets/cdo/guias/guia-${gslug}.pdf` : cslug ? `${SITE}/assets/cdo/checklist-${cslug}-${es ? "es" : "en"}.pdf` : "";
      const src0 = clean(d.source, 120);
      const lblock = src0 === "libro:pdf" ? (es ? `<p>Aquí tienes los episodios publicados del libro:</p>${btn(`${SITE}/assets/cdo/libro-episodios-es.pdf`, "Descargar los episodios (PDF)")}<p>Y de regalo, el Million Mile Playbook:</p>` : `<p>Here are the published episodes of the book:</p>${btn(`${SITE}/assets/cdo/libro-episodios-en.pdf`, "Download the episodes (PDF)")}<p>And as a bonus, the Million Mile Playbook:</p>`)
        : src0 === "libro:papel" ? (es ? `<p>Estás en la lista de espera de la edición en papel. Te escribiré cuando salga.</p><p>Mientras tanto, te dejo el Million Mile Playbook:</p>` : `<p>You are on the waiting list for the paper edition. I will write when it is out.</p><p>Meanwhile, here is the Million Mile Playbook:</p>`) : "";
      const gblock = lblock ? lblock : cslug ? (es ? `<p>Aquí tienes la checklist que pediste:</p>${btn(gpdf, "Descargar la checklist (PDF)")}<p>Y de regalo, el Million Mile Playbook:</p>` : `<p>Here is the checklist you asked for:</p>${btn(gpdf, "Download the checklist (PDF)")}<p>And as a bonus, the Million Mile Playbook:</p>`) : gslug ? (es ? `<p>Aquí tienes la guía que pediste:</p>${btn(gpdf, "Descargar la guía (PDF)")}<p>Y de regalo, el Million Mile Playbook:</p>` : `<p>Here is the guide you asked for:</p>${btn(gpdf, "Download the guide (PDF)")}<p>And as a bonus, the Million Mile Playbook:</p>`) : "";
      const unsub = `${FN}?u=${encodeURIComponent(em)}&t=${await hmac(em)}`;
      const body = es
        ? `<p>Hola${nm ? " " + esc(nm) : ""},</p>${gblock}<p>Gracias por apuntarte. Aquí tienes el <b>Million Mile Playbook</b>: 21 trucos para volar en business pagando casi nada.</p>${btn(pdf, "Descargar el Playbook (PDF)")}<p>Ya estás en el sorteo de noches en mi hotel favorito. Te escribiré cuando tenga algo que merezca la pena: viajes, puntos y millas, y cómo monto empresas desde Sumba.</p><p>Si quieres empezar por algo, este es el primer capítulo de mi libro: <a href="${SITE}/libro/">El día que dejas de esperar</a>.</p><p>Carlos</p>`
        : `<p>Hi${nm ? " " + esc(nm) : ""},</p>${gblock}<p>Thanks for joining. Here is the <b>Million Mile Playbook</b>: 21 tricks to fly business class for almost nothing.</p>${btn(pdf, "Download the Playbook (PDF)")}<p>You are now in the draw for nights at my favourite hotel. I will write when I have something worth sending: travel, points and miles, and how I build companies from Sumba.</p><p>If you want somewhere to start, here is the first chapter of my book: <a href="${SITE}/book/">The day you stop waiting</a>.</p><p>Carlos</p>`;
      const foot = ` · <a href="${unsub}" style="color:#888">${es ? "Darme de baja" : "Unsubscribe"}</a>`;
      const ok = await send({ to: [em], subject: cslug ? (es ? "Tu checklist en PDF" : "Your PDF checklist") : gslug ? (es ? "Tu guía en PDF" : "Your PDF guide") : (es ? "Tu Million Mile Playbook" : "Your Million Mile Playbook"), html: shell(body, foot),
        text: (es ? "Descarga el Playbook: " : "Download the Playbook: ") + pdf + "\n\n" + (es ? "Darme de baja: " : "Unsubscribe: ") + unsub,
        headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } });
      if (ok) await fetch(`${SB0}/rest/v1/cdo_newsletter?email=eq.${encodeURIComponent(em)}`, { method: "PATCH", headers: rest0, body: JSON.stringify({ welcomed_at: new Date().toISOString() }) });
      const to0 = Deno.env.get("CDO_CONTACT_TO");
      if (to0) await send({ to: [to0], subject: `[carlosdeory.com] Nuevo suscriptor · ${em}`, html: shell(`<p>Nuevo suscriptor de la newsletter.</p><p><b>${esc(em)}</b>${nm ? " · " + esc(nm) : ""}<br>Idioma: ${es ? "es" : "en"} · País: ${esc(req.headers.get("cf-ipcountry") ?? "-")}<br>Origen: ${esc(clean(d.source, 120) || "web")}</p>`), text: `Nuevo suscriptor: ${em}` });
    }
    return json({ ok: true }, 200, h);
  }

  const name = clean(d.name, 120), email = clean(d.email, 200), company = clean(d.company, 200);
  const message = clean(d.message, 5000), kind = KINDS[String(d.kind)] ? String(d.kind) : "other";
  const lang = d.lang === "es" ? "es" : "en";
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: "invalid" }, 422, h);
  if (d.consent !== true) return json({ ok: false, error: "consent" }, 422, h);

  const SB = Deno.env.get("SUPABASE_URL")!, KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const rest = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0";
  const ipHash = await sha("cdo:" + ip);
  const country = req.headers.get("cf-ipcountry") ?? "";

  // max 5 messages per hour from the same address
  const since = new Date(Date.now() - 3600_000).toISOString();
  const c = await fetch(`${SB}/rest/v1/cdo_contact_messages?select=id&ip_hash=eq.${ipHash}&created_at=gte.${since}`, { headers: { ...rest, Prefer: "count=exact", Range: "0-0" } });
  const total = Number((c.headers.get("content-range") ?? "*/0").split("/")[1] || 0);
  if (total >= 5) return json({ ok: false, error: "rate" }, 429, h);

  const ins = await fetch(`${SB}/rest/v1/cdo_contact_messages`, {
    method: "POST", headers: { ...rest, Prefer: "return=representation" },
    body: JSON.stringify({ name, email, company, kind, message, lang, country, ip_hash: ipHash }),
  });
  const row = ins.ok ? (await ins.json())[0] : null;

  const to = Deno.env.get("CDO_CONTACT_TO");
  let emailed = false;
  const hot = /more than €?5,?000|más de 5\.?000|>\s*5000/i.test(message) || /more than 500|más de 500/i.test(message);
  if (to) {
    const rows: [string, string][] = [["Name", name], ["Email", email], ["Company / event", company || "-"], ["Interested in", KINDS[kind]], ["Language", lang], ["Country", country || "-"]];
    const html = `<h2 style="font-family:sans-serif">${hot ? "⭐ " : ""}${esc(KINDS[kind])}</h2><table style="font-family:sans-serif;font-size:14px">${rows.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${k}</td><td><b>${esc(v)}</b></td></tr>`).join("")}</table><p style="font-family:sans-serif;white-space:pre-wrap;font-size:15px">${esc(message || "(no message)")}</p><p style="font-family:sans-serif;color:#888;font-size:12px">carlosdeory.com contact form · reply to this email to answer ${esc(name)}</p>`;
    emailed = await send({ to: [to], reply_to: email,
      subject: `[carlosdeory.com]${hot ? " PRIORIDAD ·" : ""} ${KINDS[kind]} · ${name}${company ? " · " + company : ""}`,
      html, text: rows.map(([k, v]) => `${k}: ${v}`).join("\n") + "\n\n" + (message || "(no message)") });
    if (row?.id) {
      await fetch(`${SB}/rest/v1/cdo_contact_messages?id=eq.${row.id}`, { method: "PATCH", headers: rest, body: JSON.stringify({ emailed, priority: hot }) });
    }
  }
  // respuesta automatica al remitente
  {
    const es = lang === "es", first = esc(name.split(" ")[0]);
    let body = "";
    if (kind === "talk") {
      const kit = `${SITE}/assets/cdo/carlos-de-ory-speaker-kit-${es ? "es" : "en"}.pdf`;
      body = es
        ? `<p>Hola ${first},</p><p>Gracias por pensar en mí para tu evento. He recibido tu solicitud y te contesto personalmente con disponibilidad y una propuesta.</p><p>Mientras tanto, aquí tienes el dossier con la bio, las conferencias y las fotos para el programa:</p>${btn(kit, "Descargar el dossier (PDF)")}<p>Carlos</p>`
        : `<p>Hi ${first},</p><p>Thank you for thinking of me for your event. I have your request and I will answer personally with availability and a proposal.</p><p>In the meantime, here is the speaker kit with the bio, the keynotes and photos for your programme:</p>${btn(kit, "Download the speaker kit (PDF)")}<p>Carlos</p>`;
    } else if (kind === "agency") {
      body = es
        ? `<p>Hola ${first},</p><p>Gracias por contarme sobre ${company ? esc(company) : "tu empresa"}. He recibido tu mensaje y te contesto personalmente para proponerte una llamada.</p><p>En esa llamada miramos tus números, tu objetivo y cuánto te cuesta hoy un cliente. Si quieres adelantar, puedes probar la calculadora:</p>${btn(SITE + "/growth/#calc", "Calcular mi coste por cliente")}<p>Carlos</p>`
        : `<p>Hi ${first},</p><p>Thank you for telling me about ${company ? esc(company) : "your company"}. I have your message and I will answer personally to set up a call.</p><p>On that call we look at your numbers, your goal and what a customer costs you today. If you want a head start, try the calculator:</p>${btn(SITE + "/growth/#calc", "Work out my cost per customer")}<p>Carlos</p>`;
    } else {
      body = es
        ? `<p>Hola ${first},</p><p>Gracias por escribirme. He recibido tu mensaje y lo leo personalmente.</p><p>Carlos</p>`
        : `<p>Hi ${first},</p><p>Thank you for writing. I have your message and I read every one personally.</p><p>Carlos</p>`;
    }
    const ok = await send({ to: [email], subject: es ? "He recibido tu mensaje" : "I have your message", html: shell(body), text: body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() });
    if (row?.id) await fetch(`${SB}/rest/v1/cdo_contact_messages?id=eq.${row.id}`, { method: "PATCH", headers: rest, body: JSON.stringify({ autoreplied: ok }) });
  }
  if (!row && !emailed) return json({ ok: false, error: "store" }, 502, h);
  return json({ ok: true }, 200, h);
});