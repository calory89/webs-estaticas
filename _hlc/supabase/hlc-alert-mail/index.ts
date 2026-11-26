// Happy Low Cost · envío de alertas por email (26-nov-2026)
// Mismas claves de confirmación y baja que hlc-deals (que sigue atendiendo ?action=confirm y ?action=unsub).
// Envía por Brevo a través del puente hlc-email del proyecto oykcs (allí está BREVO_API_KEY).
// Cron: POST {action:"send"} con cabecera x-hlc-secret = HLC_CRON_SECRET. Prueba: {action:"send", dry:true} o {action:"test", to}
const SITE = "https://www.happylowcost.com";
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BRIDGE = "https://oykcsmextclpdnugixqz.supabase.co/functions/v1/hlc-email";
const MAIL_SECRET = Deno.env.get("HLC_MAIL_SECRET") || "";
const MIN_SAVE = 40;
const FN = `${SB_URL}/functions/v1/hlc-deals`;
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });
async function db(path: string, init: any = {}) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, { ...init, headers: { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json", ...(init.headers || {}) } });
  const t = await r.text(); if (!r.ok) throw new Error(`db ${r.status} ${t.slice(0, 200)}`); return t ? JSON.parse(t) : null;
}
async function mail(to: string, subject: string, html: string, text: string, headers: any = undefined, tag = "alerta") {
  const r = await fetch(BRIDGE, { method: "POST", headers: { "content-type": "application/json", "x-hlc-secret": MAIL_SECRET }, body: JSON.stringify({ to, subject, html, text, headers, tag }) });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok && j.ok, status: r.status, body: j.body || j.error || "" };
}
const slA = (s)=>String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const ALIAS_A = { canarias: ["gran-canaria", "las-palmas-de-gran-canaria", "tenerife", "lanzarote", "fuerteventura", "la-palma"], palma: ["palma-de-mallorca", "palma"], santiago: ["santiago-de-compostela"] };
async function confirmKey(id) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`confirm|${id}|${Deno.env.get("HLC_CRON_SECRET")}`));
  return [...new Uint8Array(d)].slice(0, 10).map((b)=>b.toString(16).padStart(2, "0")).join("");
}
async function unsubKey(id) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${id}|${Deno.env.get("HLC_CRON_SECRET")}`));
  return [...new Uint8Array(d)].slice(0, 10).map((b)=>b.toString(16).padStart(2, "0")).join("");
}
const escH = (s)=>String(s ?? "").replace(/[&<>"]/g, (c)=>({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const fechaEs = (iso)=>{ const m = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]; const p = String(iso || "").slice(0, 10).split("-"); return p.length === 3 ? `${Number(p[2])} ${m[Number(p[1]) - 1]} ${p[0]}` : ""; };
function alertEmail(r, unsub) {
  const f = r.post.facts, u = `${SITE}/chollos/${r.slug}/?utm_source=alerta&utm_medium=email&utm_campaign=chollos`;
  const subject = `${f.origen} → ${f.destino} por ${f.precio} € ida y vuelta (−${f.ahorro_pct} %)`;
  const extra = [
    r.post.cta_hotel ? `<a href="${escH(r.post.cta_hotel)}" style="color:#2E6BF0">Hoteles en ${escH(f.destino)} para esas fechas</a>` : "",
    `<a href="https://www.discovercars.com/es?a_aid=happylowcost&data1=alerta-email" style="color:#2E6BF0">Coche de alquiler</a>`
  ].filter(Boolean).join(" · ");
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#14213D">
<p style="font-size:13px;color:#4A5468;margin:0 0 10px">Tu alerta de Happy Low Cost</p>
<a href="${u}"><img src="${SITE}/chollos/${r.slug}/og.jpg" alt="${escH(f.destino)}" width="560" style="width:100%;border-radius:14px;display:block;border:0"></a>
<h1 style="font-size:24px;line-height:1.2;margin:16px 0 8px">${escH(f.origen)} → ${escH(f.destino)} por ${escH(f.precio)} € ida y vuelta</h1>
<p style="font-size:16px;line-height:1.5;margin:0 0 6px">${f.aerolinea ? escH(f.aerolinea) + (f.escalas === 0 ? ", sin escalas" : "") + ". " : ""}Del ${fechaEs(f.ida)} al ${fechaEs(f.vuelta)}.</p>
<p style="font-size:16px;line-height:1.5;margin:0 0 16px">Lo habitual en esta ruta son unos ${escH(f.precio_normal)} €: ahorras un ${escH(f.ahorro_pct)} %. Estos precios duran poco.</p>
<p><a href="${u}" style="background:#FF5A36;color:#fff;text-decoration:none;font-weight:bold;font-size:17px;padding:14px 22px;border-radius:12px;display:inline-block">Ver vuelo y fechas</a></p>
<p style="font-size:14px;line-height:1.6;margin:18px 0 0">${extra}</p>
<p style="font-size:12px;color:#4A5468;line-height:1.5;margin:26px 0 0">Recibes este email porque creaste una alerta en happylowcost.com. Como mucho un aviso al día. Algunos enlaces son de afiliado. <a href="${unsub}" style="color:#4A5468">Darme de baja</a>.</p></div>`;
  const text = `${subject}\n${f.aerolinea || ""} · del ${fechaEs(f.ida)} al ${fechaEs(f.vuelta)}\nPrecio habitual ${f.precio_normal} €.\n\nVer vuelo y fechas: ${u}\n\nDarme de baja: ${unsub}`;
  return { subject, html, text };
}
async function sendAlerts(dry: boolean, testTo?: string) {
  const today = new Date().toISOString().slice(0, 10);
  const deals = (await db(`hlc_deals?select=slug,post,approved_at&status=in.(approved,web_live,fb_posted)&approved_at=gt.${new Date(Date.now() - 3 * 864e5).toISOString()}&order=approved_at.desc&limit=200`))
    .filter((r: any)=>{ const f = r.post?.facts || {}; return r.slug && f.vuelta && (f.ahorro_pct || 0) >= MIN_SAVE && f.ida > today; })
    .sort((a: any, b: any)=>(b.post.facts.ahorro_pct || 0) - (a.post.facts.ahorro_pct || 0));
  const post = async (to: string, r: any, id: number)=>{
    const unsub = `${FN}?action=unsub&id=${id}&k=${await unsubKey(id)}`;
    const m = alertEmail(r, unsub);
    return await mail(to, m.subject, m.html, m.text, { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" });
  };
  if (testTo) return deals.length ? { test: await post(testTo, deals[0], 0), slug: deals[0].slug } : { error: "no hay chollos para la prueba" };
  const subs = await db(`hlc_alerts?select=id,origins,destination,max_price,contact,last_sent_at,sent_slugs,confirmed,confirm_sent_at&channel=eq.email&active=not.is.false&limit=5000`);
  let sent = 0, confirms = 0; const out: any[] = [];
  for (const s of subs){
    if (!s.confirmed) {
      if (dry || s.confirm_sent_at || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(s.contact || "")) continue;
      const link = `${FN}?action=confirm&id=${s.id}&k=${await confirmKey(s.id)}`;
      const html = `<div style="font:16px/1.6 Arial,sans-serif;color:#14213D;max-width:520px"><p>Hola:</p><p>Alguien (seguramente tú) ha pedido avisos de chollos de vuelos de Happy Low Cost en este email.</p><p><a href="${link}" style="display:inline-block;background:#D63B1C;color:#fff;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:bold">Sí, quiero los avisos</a></p><p style="font-size:13px;color:#4A5468">Si no has sido tú, ignora este mensaje: no te escribiremos más.</p></div>`;
      const res = await mail(s.contact, "Confirma tus avisos de chollos ✈️", html, `Confirma tus avisos de chollos de Happy Low Cost: ${link}\nSi no has sido tú, ignora este mensaje.`, undefined, "confirmar");
      out.push({ id: s.id, confirm: res.ok, status: res.status, body: res.body });
      if (res.ok) { confirms++; await db(`hlc_alerts?id=eq.${s.id}`, { method: "PATCH", body: JSON.stringify({ confirm_sent_at: new Date().toISOString() }) }); }
      continue;
    }
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(s.contact || "")) continue;
    if (s.last_sent_at && Date.now() - Date.parse(s.last_sent_at) < 20 * 36e5) continue;
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(s.contact || "")) continue;
    const done = new Set(s.sent_slugs || []);
    const want = slA(s.destination);
    const anyDest = !want || /^(a-)?(cualquier|cualquier-sitio|anywhere|any|todo|todos)/.test(want);
    const r = deals.find((d)=>{
      const f = d.post.facts, o = slA(f.origen);
      const okO = !(s.origins || []).length ? f.origen_cc === "ES" : s.origins.some((x)=>{ const k = slA(x); return k === o || (ALIAS_A[k] || []).includes(o); });
      const okD = anyDest || [f.destino, f.pais, f.continente].map(slA).some((hh)=>hh && (hh === want || hh.includes(want) || want.includes(hh)));
      return okO && okD && (!s.max_price || f.precio <= s.max_price) && !done.has(d.slug);
    });
    if (!r) continue;
    if (dry) { out.push({ id: s.id, slug: r.slug }); continue; }
    const res = await post(s.contact, r, s.id);
    out.push({ id: s.id, slug: r.slug, ok: res.ok, status: res.status, body: res.body });
    if (res.ok) {
      sent++;
      await db(`hlc_alerts?id=eq.${s.id}`, { method: "PATCH", body: JSON.stringify({ last_sent_at: new Date().toISOString(), sent_slugs: [...done, r.slug].slice(-60) }) });
    }
  }
  return { deals: deals.length, subs: subs.length, sent, confirms, out: out.slice(0, 40) };
}
Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  if (req.headers.get("x-hlc-secret") !== Deno.env.get("HLC_CRON_SECRET")) return json({ error: "forbidden" }, 403);
  const b = await req.json().catch(() => ({}));
  try {
    if (b.action === "send") return json(await sendAlerts(!!b.dry));
    if (b.action === "test") return json(await sendAlerts(false, String(b.to || "")));
    return json({ error: "unknown action" }, 400);
  } catch (e) { return json({ error: String((e as Error)?.message || e).slice(0, 200) }, 500); }
});
