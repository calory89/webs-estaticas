// Happy Low Cost · puente de email por Brevo (proyecto oykcs, que tiene BREVO_API_KEY). 26-nov-2026
// POST con cabecera x-hlc-secret = HLC_MAIL_SECRET · cuerpo {to, subject, html, text, headers?, tag?}
// Lo llama la función hlc-deals (proyecto gmdalf) para las alertas de chollos y la confirmación de email.
const KEY = Deno.env.get("BREVO_API_KEY") || "";
const SECRET = Deno.env.get("HLC_MAIL_SECRET") || "";
const FROM = { name: "Happy Low Cost", email: "chollos@happylowcost.com" };
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });
Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  if (!SECRET || req.headers.get("x-hlc-secret") !== SECRET) return json({ error: "forbidden" }, 403);
  if (!KEY) return json({ error: "falta BREVO_API_KEY" }, 500);
  const b = await req.json().catch(() => ({}));
  const to = String(b.to || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to) || !b.subject || !(b.html || b.text)) return json({ error: "bad request" }, 400);
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": KEY, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: FROM, to: [{ email: to }], replyTo: { email: "carlos@equinoxinvestmentgroup.com", name: "Happy Low Cost" },
      subject: String(b.subject).slice(0, 200), htmlContent: b.html || undefined, textContent: b.text || undefined,
      headers: b.headers && typeof b.headers === "object" ? b.headers : undefined, tags: ["hlc", String(b.tag || "alerta").slice(0, 30)],
    }),
  });
  const t = await r.text();
  return json({ ok: r.ok, status: r.status, body: r.ok ? "" : t.slice(0, 200) }, r.ok ? 200 : 502);
});
