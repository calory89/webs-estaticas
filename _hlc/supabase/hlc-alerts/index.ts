// Happy Low Cost: avisos push de chollos y revalidación diaria de precios.
// Público: GET ?action=vapid · POST {action:"subscribe"|"unsubscribe"|"test"}
// Cron (cabecera x-hlc-secret): POST {action:"send"} · POST {action:"revalidate", n}
import webpush from "npm:web-push@3.6.7";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VPUB = Deno.env.get("HLC_VAPID_PUBLIC")!;
const VPRIV = Deno.env.get("HLC_VAPID_PRIVATE")!;
const SECRET = Deno.env.get("HLC_CRON_SECRET");
const SITE = "https://www.happylowcost.com";
webpush.setVapidDetails("mailto:info@happylowcost.com", VPUB, VPRIV);

const H = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: H });

async function db(path: string, init: RequestInit = {}) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SB_KEY, authorization: `Bearer ${SB_KEY}`, "content-type": "application/json", prefer: "return=representation", ...(init.headers || {}) },
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`db ${r.status} ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : null;
}

const sl = (s: string) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// nombres de origen que usa el formulario -> ciudades de salida de los chollos
const ORIGIN_ALIAS: Record<string, string[]> = {
  canarias: ["gran-canaria", "las-palmas-de-gran-canaria", "tenerife", "lanzarote", "fuerteventura", "la-palma"],
  palma: ["palma-de-mallorca", "palma"],
  santiago: ["santiago-de-compostela"],
  londres: ["londres", "london"], paris: ["paris"], roma: ["roma", "rome"], lisboa: ["lisboa", "lisbon"], dublin: ["dublin"],
  "nueva-york": ["nueva-york", "new-york"], "los-angeles": ["los-angeles"], "ciudad-de-mexico": ["ciudad-de-mexico", "mexico-city"],
  dubai: ["dubai"], singapur: ["singapur", "singapore"], sidney: ["sidney", "sydney"], milan: ["milan"], copenhague: ["copenhague", "copenhagen"],
  amsterdam: ["amsterdam"], berlin: ["berlin"], bogota: ["bogota"], "buenos-aires": ["buenos-aires"], oporto: ["oporto", "porto"],
  "hong-kong": ["hong-kong"], seul: ["seul", "seoul"], tokio: ["tokio", "tokyo"], bangkok: ["bangkok"], toronto: ["toronto"], vancouver: ["vancouver"], miami: ["miami"],
};
function originMatches(subOrigins: string[], f: any) {
  if (!subOrigins || !subOrigins.length) return (f.origen_cc || "") === "ES";
  const o = sl(f.origen);
  return subOrigins.some((x) => { const k = sl(x); return k === o || (ORIGIN_ALIAS[k] || []).includes(o); });
}

const MIN_SAVE = 25;
async function activeDeals(sinceHours = 0) {
  const today = new Date().toISOString().slice(0, 10);
  let q = `hlc_deals?select=id,slug,post,approved_at,status&status=in.(approved,web_live,fb_posted)&order=approved_at.desc&limit=300`;
  if (sinceHours) q += `&approved_at=gt.${new Date(Date.now() - sinceHours * 36e5).toISOString()}`;
  const rows = await db(q);
  return (rows || []).filter((r: any) => {
    const f = r.post?.facts || {};
    return r.slug && f.precio && (!f.ida || f.ida >= today) && (!f.ahorro_pct || f.ahorro_pct >= MIN_SAVE);
  });
}

async function push(sub: any, payload: unknown) {
  try {
    const r = await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload), { TTL: 6 * 3600, urgency: "normal" });
    return { ok: true, status: r.statusCode };
  } catch (e: any) {
    return { ok: false, status: e?.statusCode || 0 };
  }
}

function payloadFor(r: any, lang: string) {
  const f = r.post.facts;
  const en = lang === "en";
  const save = f.ahorro_pct ? (en ? ` (−${f.ahorro_pct}%)` : ` (−${f.ahorro_pct} %)`) : "";
  return {
    title: en ? `✈️ ${f.origen} → ${f.destino} for €${f.precio}${save}` : `✈️ ${f.origen} → ${f.destino} por ${f.precio} €${save}`,
    body: en ? `${f.vuelta ? "Return" : "One way"} · departing ${f.ida}. Price checked by Happy Low Cost.` : `${f.tipo || "ida y vuelta"} · salida ${f.ida}. Precio comprobado por Happy Low Cost.`,
    url: en ? `${SITE}/en/deals/?q=${encodeURIComponent(sl(f.destino))}` : `${SITE}/chollos/${r.slug}/`,
    tag: r.slug,
  };
}

async function send() {
  const deals = await activeDeals(48);
  if (!deals.length) return { deals: 0, sent: 0 };
  const subs = await db(`hlc_push_subs?select=*&active=eq.true&limit=5000`);
  const sentRows = await db(`hlc_alerts_sent?select=sub_id,deal_slug&ts=gt.${new Date(Date.now() - 30 * 864e5).toISOString()}&limit=100000`);
  const sent = new Set((sentRows || []).map((x: any) => `${x.sub_id}|${x.deal_slug}`));
  let n = 0, off = 0;
  for (const s of subs || []) {
    if (s.last_sent_at && Date.now() - Date.parse(s.last_sent_at) < 20 * 36e5) continue; // máximo un aviso al día
    const cand = deals.filter((r: any) => originMatches(s.origins, r.post.facts) && (!s.max_price || r.post.facts.precio <= s.max_price) && !sent.has(`${s.id}|${r.slug}`))
      .sort((a: any, b: any) => (b.post.facts.ahorro_pct || 0) - (a.post.facts.ahorro_pct || 0));
    if (!cand.length) continue;
    const r = cand[0];
    const res = await push(s, payloadFor(r, s.lang));
    await db("hlc_push_log", { method: "POST", headers: { prefer: "return=minimal" }, body: JSON.stringify({ sub_id: s.id, deal_slug: r.slug, ok: res.ok, status: res.status }) });
    if (res.ok) {
      n++;
      await db("hlc_alerts_sent", { method: "POST", headers: { prefer: "return=minimal,resolution=ignore-duplicates" }, body: JSON.stringify({ sub_id: s.id, deal_slug: r.slug }) });
      await db(`hlc_push_subs?id=eq.${s.id}`, { method: "PATCH", headers: { prefer: "return=minimal" }, body: JSON.stringify({ last_sent_at: new Date().toISOString(), sent_count: (s.sent_count || 0) + 1, fails: 0 }) });
    } else if (res.status === 404 || res.status === 410 || (s.fails || 0) >= 4) {
      off++;
      await db(`hlc_push_subs?id=eq.${s.id}`, { method: "PATCH", headers: { prefer: "return=minimal" }, body: JSON.stringify({ active: false }) });
    } else {
      await db(`hlc_push_subs?id=eq.${s.id}`, { method: "PATCH", headers: { prefer: "return=minimal" }, body: JSON.stringify({ fails: (s.fails || 0) + 1 }) });
    }
  }
  return { deals: deals.length, subs: (subs || []).length, sent: n, deactivated: off };
}

// ---------- revalidación: mismo vuelo, mismas fechas, en Kiwi ----------
async function kiwi(args: Record<string, unknown>) {
  const body = { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "search-flight", arguments: { currency: "EUR", locale: "es", ...args } } };
  const r = await fetch("https://mcp.kiwi.com/", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" }, body: JSON.stringify(body) });
  const raw = await r.text();
  const line = raw.split("\n").find((l) => l.startsWith("data:"));
  const j = JSON.parse(line ? line.slice(5) : raw);
  const res = j.result || {};
  const c = res.structuredContent || (res.content?.[0]?.text ? JSON.parse(res.content[0].text) : null);
  return c?.itineraries || [];
}
const dmy = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split("-"); return `${d}/${m}/${y}`; };

async function revalidate(n: number) {
  const deals = await activeDeals();
  const day = 20 * 36e5;
  const todo = deals.filter((r: any) => { const c = r.post.facts.checked_at; return !c || Date.now() - Date.parse(c) > day; })
    .sort((a: any, b: any) => String(a.post.facts.checked_at || "").localeCompare(String(b.post.facts.checked_at || ""))).slice(0, n);
  const out: unknown[] = [];
  for (const r of todo) {
    const f = r.post.facts;
    try {
      if (!f.origen_iata || !f.destino_iata || !f.ida) throw new Error("faltan datos");
      const args: Record<string, unknown> = { flyFrom: f.origen_iata, flyTo: f.destino_iata, departureDate: dmy(f.ida), departureDateFlexDays: 1 };
      if (f.vuelta) { args.returnDate = dmy(f.vuelta); args.returnDateFlexDays = 1; }
      const its = await kiwi(args);
      const prices = its.map((i: any) => i.price).filter((x: number) => x > 0);
      const now = Math.floor(Math.min(...prices));
      const facts = { ...f, checked_at: new Date().toISOString() };
      if (!isFinite(now) || now > f.precio * 1.10) {
        // el precio ya no existe o ha subido más de un 10 %: lo retiramos
        await db(`hlc_deals?id=eq.${r.id}`, { method: "PATCH", headers: { prefer: "return=minimal" }, body: JSON.stringify({ status: "expired", reason: isFinite(now) ? `revalidado: ${now} € > ${f.precio} € +10 %` : "revalidado: sin resultados", post: { ...r.post, facts: { ...facts, precio_hoy: isFinite(now) ? now : null } } }) });
        out.push({ slug: r.slug, was: f.precio, now: isFinite(now) ? now : null, action: "retirado" });
      } else {
        facts.precio_hoy = now;
        await db(`hlc_deals?id=eq.${r.id}`, { method: "PATCH", headers: { prefer: "return=minimal" }, body: JSON.stringify({ post: { ...r.post, facts } }) });
        out.push({ slug: r.slug, was: f.precio, now, action: "sigue" });
      }
    } catch (e: any) {
      out.push({ slug: r.slug, error: String(e?.message || e).slice(0, 120) });
    }
  }
  return { pending: deals.length, checked: out.length, out };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: H });
  const u = new URL(req.url);
  try {
    if (req.method === "GET" && u.searchParams.get("action") === "vapid") return json({ key: VPUB });
    if (req.method !== "POST") return json({ error: "method" }, 405);
    const b = await req.json().catch(() => ({}));
    if (b.action === "subscribe") {
      const s = b.sub || {};
      if (!/^https:\/\//.test(s.endpoint || "") || !s.keys?.p256dh || !s.keys?.auth) return json({ error: "Suscripción no válida" }, 400);
      const origins = (Array.isArray(b.origins) ? b.origins : []).map((x: unknown) => String(x).slice(0, 40)).filter(Boolean).slice(0, 12);
      const row = { endpoint: String(s.endpoint).slice(0, 700), p256dh: String(s.keys.p256dh).slice(0, 200), auth: String(s.keys.auth).slice(0, 100), origins,
        max_price: Math.min(Number(b.max_price) || 0, 5000) || null, lang: b.lang === "en" ? "en" : "es", active: true, fails: 0 };
      await db("hlc_push_subs?on_conflict=endpoint", { method: "POST", headers: { prefer: "return=minimal,resolution=merge-duplicates" }, body: JSON.stringify(row) });
      return json({ ok: true });
    }
    if (b.action === "unsubscribe") {
      await db(`hlc_push_subs?endpoint=eq.${encodeURIComponent(String(b.endpoint || ""))}`, { method: "PATCH", headers: { prefer: "return=minimal" }, body: JSON.stringify({ active: false }) });
      return json({ ok: true });
    }
    if (b.action === "test") {
      const rows = await db(`hlc_push_subs?select=*&endpoint=eq.${encodeURIComponent(String(b.endpoint || ""))}&active=eq.true`);
      if (!rows?.length) return json({ error: "no suscrito" }, 404);
      const en = rows[0].lang === "en";
      const r = await push(rows[0], { title: en ? "✈️ Alerts are on" : "✈️ Avisos activados", body: en ? "We will notify you here when we find a deal from your airport (max one a day)." : "Te avisaremos aquí cuando cacemos un chollo desde tu aeropuerto (máximo uno al día).", url: en ? `${SITE}/en/deals/` : `${SITE}/chollos/`, tag: "hlc-test" });
      return json(r);
    }
    if (!SECRET || req.headers.get("x-hlc-secret") !== SECRET) return json({ error: "forbidden" }, 403);
    if (b.action === "send") return json(await send());
    if (b.action === "revalidate") return json(await revalidate(Math.min(Number(b.n) || 8, 20)));
    return json({ error: "unknown action" }, 400);
  } catch (e: any) {
    return json({ error: String(e?.message || e) }, 500);
  }
});
