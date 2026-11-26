// Happy Low Cost · vídeos de viajeros (26-nov-2026)
// Público:  POST {action:"start", kind:"link"|"file", url?, size?, mime?, dest, caption?, handle?, email?, consent, lang}
//           -> link: guarda pendiente · file: devuelve URL de subida firmada al almacén privado
//           POST {action:"done", id, token}  -> comprueba que el archivo subió y lo deja pendiente de revisión
//           GET  ?action=list[&dest=slug]     -> vídeos aprobados (sin datos personales)
// Panel:    POST {action:"admin_list"|"approve"|"reject", pass, id?}  (clave del panel, la misma de /panel/)
const SB = Deno.env.get("SUPABASE_URL")!;
const KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const H = { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type", "access-control-allow-methods": "GET,POST,OPTIONS", "content-type": "application/json; charset=utf-8" };
const MAX_FILE = 50 * 1024 * 1024;          // 50 MB por vídeo
const MAX_TOTAL = 1.5 * 1024 * 1024 * 1024; // 1,5 GB entre todos (pendientes + aprobados)
const PER_IP_DAY = 3;
const IN = "hlc-videos-in", OUT = "hlc-videos";
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: H });
const db = async (path: string, init: RequestInit = {}) => {
  const r = await fetch(`${SB}/rest/v1/${path}`, { ...init, headers: { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json", ...(init.headers || {}) } });
  const t = await r.text();
  if (!r.ok) throw new Error(`db ${r.status} ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : null;
};
const st = (path: string, init: RequestInit = {}) => fetch(`${SB}/storage/v1/${path}`, { ...init, headers: { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json", ...(init.headers || {}) } });
const slug = (s: string) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
const clean = (s: unknown, n: number) => String(s ?? "").replace(/[<>\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
const EXT: Record<string, string> = { "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm" };

function platformOf(u: URL): string | null {
  const h = u.hostname.replace(/^www\.|^m\./, "");
  if (/(^|\.)tiktok\.com$/.test(h)) return "tiktok";
  if (/(^|\.)instagram\.com$/.test(h) && /^\/(reel|reels|p|tv)\//.test(u.pathname)) return "instagram";
  if (h === "youtu.be" || /(^|\.)youtube\.com$/.test(h)) return "youtube";
  return null;
}
async function passOk(p: string) {
  const r = await fetch(`${SB}/rest/v1/rpc/hlc_pass_ok`, { method: "POST", headers: { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json" }, body: JSON.stringify({ p }) });
  return r.ok && (await r.json()) === true;
}
let DESTS: any[] | null = null;
async function destSlug(dest: string) {
  const k = slug(dest);
  try {
    if (!DESTS) DESTS = await (await fetch("https://www.happylowcost.com/hlc/destinos.json")).json();
    for (const p of DESTS || []) if (p.s === k || slug(p.n) === k || (p.a || []).includes(k)) return p.s;
  } catch { /* sin lista: se usa el texto tal cual */ }
  return k;
}
async function used() {
  const rows = await db(`hlc_videos?select=size&kind=eq.file&status=in.(pending,uploading,approved)`);
  return (rows || []).reduce((a: number, r: any) => a + (Number(r.size) || 0), 0);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: H });
  const u = new URL(req.url);
  try {
    if (req.method === "GET" && u.searchParams.get("action") === "list") {
      const d = slug(u.searchParams.get("dest") || "");
      const rows = await db(`rpc/hlc_videos_list`, { method: "POST", body: JSON.stringify({ dslug: d || null, lim: 60 }) });
      return new Response(JSON.stringify({ videos: rows || [] }), { headers: { ...H, "cache-control": "public, max-age=300" } });
    }
    if (req.method === "GET" && u.searchParams.get("action") === "quota") {
      const left = Math.max(0, MAX_TOTAL - await used());
      return json({ file_ok: left > MAX_FILE / 5, max_mb: MAX_FILE / 1048576 });
    }
    if (req.method !== "POST") return json({ error: "method" }, 405);
    const b = await req.json().catch(() => ({}));
    const en = b.lang === "en";
    const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "").split(",")[0].trim().slice(0, 60);

    if (b.action === "start") {
      if (!b.consent) return json({ error: en ? "Tick the box so we can publish your video." : "Marca la casilla para que podamos publicar tu vídeo." }, 400);
      const dest = clean(b.dest, 80);
      if (dest.length < 2) return json({ error: en ? "Tell us where you filmed it." : "Dinos dónde lo grabaste." }, 400);
      const email = clean(b.email, 200);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ error: en ? "Check the email." : "Revisa el email." }, 400);
      const since = new Date(Date.now() - 864e5).toISOString();
      const mine = await db(`hlc_videos?select=id&ip=eq.${encodeURIComponent(ip)}&created_at=gt.${since}`);
      if ((mine || []).length >= PER_IP_DAY) return json({ error: en ? "You've sent 3 videos today. Try again tomorrow." : "Ya has enviado 3 vídeos hoy. Prueba mañana." }, 429);
      const base = { dest, dest_slug: await destSlug(dest), caption: clean(b.caption, 300) || null, handle: clean(b.handle, 60).replace(/^@?/, "@").replace(/^@$/, "") || null, email: email || null, consent: true, lang: en ? "en" : "es", ip };
      if (b.kind === "link") {
        let url: URL;
        try { url = new URL(String(b.url || "").trim()); } catch { return json({ error: en ? "Paste the full link to your TikTok, Reel or YouTube video." : "Pega el enlace completo de tu TikTok, Reel o vídeo de YouTube." }, 400); }
        const pf = url.protocol === "https:" ? platformOf(url) : null;
        if (!pf) return json({ error: en ? "We accept TikTok, Instagram Reels and YouTube links." : "Aceptamos enlaces de TikTok, Reels de Instagram y YouTube." }, 400);
        url.hash = "";
        const row = await db("hlc_videos", { method: "POST", headers: { prefer: "return=representation" }, body: JSON.stringify({ ...base, kind: "link", url: url.toString().slice(0, 400), platform: pf, status: "pending" }) });
        return json({ ok: true, id: row?.[0]?.id });
      }
      if (b.kind === "file") {
        const size = Number(b.size) || 0, mime = String(b.mime || "");
        if (!EXT[mime]) return json({ error: en ? "Upload an MP4, MOV or WebM video." : "Sube un vídeo MP4, MOV o WebM." }, 400);
        if (size <= 0 || size > MAX_FILE) return json({ error: en ? "The video can be up to 50 MB. Shorter is better: 15-60 seconds." : "El vídeo puede pesar hasta 50 MB. Mejor corto: de 15 a 60 segundos." }, 400);
        if (await used() + size > MAX_TOTAL) return json({ error: en ? "Direct uploads are full right now. Paste a TikTok, Reel or YouTube link instead." : "La subida directa está llena ahora mismo. Pega el enlace de tu TikTok, Reel o YouTube." , full: true }, 409);
        const row = await db("hlc_videos", { method: "POST", headers: { prefer: "return=representation" }, body: JSON.stringify({ ...base, kind: "file", size, mime, status: "uploading" }) });
        const id = row?.[0]?.id;
        const path = `${id}.${EXT[mime]}`;
        const r = await st(`object/upload/sign/${IN}/${path}`, { method: "POST", body: "{}" });
        const s = await r.json().catch(() => ({}));
        if (!r.ok || !s.url) { await db(`hlc_videos?id=eq.${id}`, { method: "DELETE" }); return json({ error: "upload sign failed" }, 500); }
        await db(`hlc_videos?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ path }) });
        return json({ ok: true, id, upload: `${SB}/storage/v1${s.url}`, path });
      }
      return json({ error: "kind" }, 400);
    }

    if (b.action === "done") {
      const id = String(b.id || "");
      if (!/^[0-9a-f-]{36}$/.test(id)) return json({ error: "id" }, 400);
      const row = (await db(`hlc_videos?select=id,path,size,status&id=eq.${id}`))?.[0];
      if (!row || row.status !== "uploading" || !row.path) return json({ error: "not found" }, 404);
      const info = await st(`object/info/${IN}/${row.path}`, { method: "GET" });
      if (!info.ok) return json({ error: en ? "We didn't get the file. Try again." : "No nos ha llegado el archivo. Prueba otra vez." }, 400);
      const meta = await info.json().catch(() => ({}));
      const real = Number(meta?.size ?? meta?.metadata?.size ?? row.size) || row.size;
      await db(`hlc_videos?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ status: "pending", size: real }) });
      return json({ ok: true });
    }

    if (["admin_list", "approve", "reject"].includes(b.action)) {
      if (!(await passOk(String(b.pass || "")))) return json({ error: "clave incorrecta" }, 401);
      if (b.action === "admin_list") {
        const rows = await db(`hlc_videos?select=id,created_at,status,kind,url,platform,path,public_url,size,dest,dest_slug,caption,handle,email,lang&status=in.(pending,approved)&order=created_at.desc&limit=100`);
        for (const r of rows || []) {
          if (r.kind === "file" && r.status === "pending" && r.path) {
            const s = await st(`object/sign/${IN}/${r.path}`, { method: "POST", body: JSON.stringify({ expiresIn: 3600 }) });
            const j = await s.json().catch(() => ({}));
            r.preview = j.signedURL ? `${SB}/storage/v1${j.signedURL}` : null;
          }
        }
        return json({ videos: rows || [], used_mb: Math.round(await used() / 1048576), max_mb: MAX_TOTAL / 1048576 });
      }
      const id = String(b.id || "");
      const row = (await db(`hlc_videos?select=id,kind,path,status&id=eq.${id}`))?.[0];
      if (!row) return json({ error: "not found" }, 404);
      if (b.action === "reject") {
        if (row.kind === "file" && row.path) { await st(`object/${IN}`, { method: "DELETE", body: JSON.stringify({ prefixes: [row.path] }) }); await st(`object/${OUT}`, { method: "DELETE", body: JSON.stringify({ prefixes: [row.path] }) }); }
        await db(`hlc_videos?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ status: "rejected", size: 0, public_url: null }) });
        return json({ ok: true });
      }
      let public_url = null;
      if (row.kind === "file") {
        const c = await st(`object/copy`, { method: "POST", body: JSON.stringify({ bucketId: IN, sourceKey: row.path, destinationBucket: OUT, destinationKey: row.path }) });
        if (!c.ok) return json({ error: `copy ${c.status} ${(await c.text()).slice(0, 120)}` }, 500);
        await st(`object/${IN}`, { method: "DELETE", body: JSON.stringify({ prefixes: [row.path] }) });
        public_url = `${SB}/storage/v1/object/public/${OUT}/${row.path}`;
      }
      await db(`hlc_videos?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ status: "approved", approved_at: new Date().toISOString(), public_url }) });
      return json({ ok: true, public_url });
    }
    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String((e as Error)?.message || e).slice(0, 200) }, 500);
  }
});
