// hlc-guides-once: guías de ciudad de alta calidad, encargo único de Carlos (21-nov-2026).
// Tope duro de gasto: 19,50 USD de API en total (tabla hlc_guide_spend). No tiene cron: solo se llama a mano.
const SB_URL = Deno.env.get("SUPABASE_URL");
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const CAP_USD = 19.5;
const PRICE = { "claude-opus-5-5": [4, 20], "claude-sonnet-5-5": [2, 10] };
const BATCH_PRICE = [2, 10]; // Opus 5.5 por lotes: mitad de precio
const MAX_TOK = 16000;
const AH = () => ({ "x-api-key": Deno.env.get("ANTHROPIC_API_KEY"), "anthropic-version": "2023-06-01", "content-type": "application/json" });

async function db(path, init = {}) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, { ...init, headers: { apikey: SB_KEY, authorization: `Bearer ${SB_KEY}`, "content-type": "application/json", ...(init.headers || {}) } });
  const t = await r.text();
  if (!r.ok) throw new Error(`db ${r.status} ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : null;
}
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });

const ES = `Escribes para la redacción de Happy Low Cost, una web española de vuelos baratos con 420.000 seguidores. Esta guía tiene que ser la mejor respuesta de Google para «qué ver en {X}» y «qué hacer en {X}»: más útil, más concreta y más honesta que las que ya existen.

CÓMO SUENA
- Español de España, de tú. Como un amigo que conoce bien la ciudad y te la cuenta tomando algo: directo, con criterio, a veces con humor seco.
- Mezcla frases cortas con otras largas. Párrafos de 2 a 4 frases. Alterna prosa y listas; no todo en viñetas.
- Opina: qué merece la pena, qué no, a qué hora ir, qué pedir, dónde no comer. Di también lo malo (colas, precios inflados, zonas feas, timos).
- Detalles concretos en cada sección: nombres reales de calles, barrios, platos, líneas de metro o bus, miradores, mercados; cuánto tiempo hace falta; precio orientativo.
- Escribe como redacción («nuestro consejo», «lo que haríamos nosotros»), pero NO inventes anécdotas personales ni viajes concretos («cuando fui en 2019...»).

PROHIBIDO (suena a IA o a folleto)
emojis; la raya larga «—» (usa comas, dos puntos o paréntesis); «sumérgete», «joya escondida», «joya», «no te lo puedes perder», «imprescindible» más de una vez, «vibrante», «tapiz», «en resumen», «en conclusión», «descubre», «experiencia inolvidable», «para todos los gustos», «un sinfín», «con encanto», «te espera», «déjate llevar», «en el corazón de», «cabe destacar», «sin duda», «no es de extrañar», «auténtico», «mágico», «único en el mundo», «paraíso», «perderse por sus calles», «rica historia», «ofrece una amplia variedad», «tanto si... como si...»; empezar dos párrafos seguidos igual; empezar con «Además»; frases de relleno; párrafo final de resumen o despedida; preguntas retóricas al lector.

EXACTITUD
Solo lugares, barrios, platos, museos y transportes que existan de verdad y sean conocidos. Si no estás seguro de un dato, no lo pongas. Precios orientativos de 2026 en euros (y moneda local si no es el euro), redondeados («unos 15 €», «entre 10 y 15 €»). Nada de horarios exactos: di «mejor a primera hora» o «comprueba el horario». No digas que eres una IA.

SEO
- Elige el número de días que de verdad pide el destino (ciudad pequeña 2, capital grande 3-4, isla o región 5-7) y úsalo en título, itinerario y respuestas.
- La palabra clave «qué ver en {X}» y variantes naturales («qué hacer en {X}», «{X} en N días», «dónde dormir en {X}») en los títulos de sección, sin repetirlas de forma forzada.
- Responde en la primera frase de cada sección. Las preguntas frecuentes, como las haría alguien en Google.

FORMATO EXACTO
TITULO: título de 48-60 caracteres que empiece por «Qué ver en {X}» (p. ej. «Qué ver en {X} en 3 días: guía práctica y barata»; varía el final)
DESCRIPCION: meta descripción de 140-155 caracteres, natural, con el número de días y algo concreto del destino
---
HTML de 2.000-2.500 palabras usando solo <h2>, <h3>, <p>, <ul>, <li>, <strong>. Sin <h1>. Orden:
1. Dos párrafos sin título: cómo es el sitio de verdad, para quién es, cuántos días hacen falta.
2. <h2>Qué ver en {X}: los sitios que merecen la pena</h2> con 10-14 <h3>, uno por sitio: qué es, por qué ir, cuánto tiempo, precio orientativo o gratis, y un truco (hora, entrada, lugar desde el que mirarlo).
3. <h2>Qué hacer en {X}</h2>: 6-8 planes que no sean «ver monumentos».
4. <h2>{X} gratis o casi</h2>.
5. <h2>Itinerario: {X} en N días</h2> con un <h3> por día (mañana, tarde, noche) en un orden que se pueda hacer andando o en transporte.
6. <h2>Lo que está sobrevalorado (y qué hacer en su lugar)</h2>: 3-4 puntos honestos.
7. <h2>Cuándo ir a {X}</h2>: clima, temporadas, cuándo hay menos gente y cuándo es más barato.
8. <h2>Dónde dormir en {X}: mejores zonas</h2>: 3-5 barrios, para quién es cada uno y rango de precio por noche.
9. <h2>Qué comer en {X}</h2>: platos concretos, qué pedir, cuánto cuesta comer y cenar.
10. <h2>Del aeropuerto al centro y cómo moverse</h2>: opciones reales con tiempo y precio, y abonos de transporte.
11. <h2>Cuánto cuesta un viaje a {X}</h2>: presupuesto por día ajustado y medio, en una lista.
12. <h2>Excursiones de un día desde {X}</h2>: 3-5, con cómo ir y cuánto se tarda.
13. <h2>Errores típicos y timos</h2>.
14. <h2>Preguntas frecuentes sobre {X}</h2> con 6-8 <h3> y respuestas de 1-3 frases.`;

const EN = `You write for Happy Low Cost, a flight-deals site with 420,000 followers. This guide has to be Google's best answer for "things to do in {X}" and "what to see in {X}": more useful, more specific and more honest than what already ranks.

VOICE
- Natural international English. Like a friend who knows the city well telling you over a drink: direct, opinionated, sometimes dry humour.
- Mix short and long sentences. Paragraphs of 2-4 sentences. Alternate prose and lists; not everything in bullets.
- Have opinions: what is worth it, what is not, what time to go, what to order, where not to eat. Say the bad bits too (queues, inflated prices, tourist traps, scams).
- Concrete details in every section: real street, neighbourhood, dish, metro or bus line, viewpoint and market names; how long you need; rough price.
- Write as an editorial team ("our tip", "what we would do"), but do NOT invent personal anecdotes or specific trips.

FORBIDDEN (sounds like AI or a brochure)
emojis; the em dash "—" (use commas, colons or brackets); "hidden gem", "gem", "nestled", "vibrant", "tapestry", "bustling", "a must-see" more than once, "in conclusion", "in summary", "whether you're", "something for everyone", "embark", "delve", "unforgettable experience", "boasts", "rich history", "in the heart of", "a feast for the senses", "steeped in", "truly", "magical", "paradise", "get lost in its streets", "look no further"; two paragraphs in a row starting the same way; starting with "Additionally"; filler; a closing summary or goodbye paragraph; rhetorical questions to the reader.

ACCURACY
Only places, neighbourhoods, dishes, museums and transport that really exist and are well known. If unsure of a fact, leave it out. Rough 2026 prices in euros plus local currency where it is not the euro, rounded ("about €15", "€10-15"). No exact opening hours: say "go first thing" or "check the hours". Never say you are an AI.

SEO
- Pick the number of days the destination really needs (small city 2, big capital 3-4, island or region 5-7) and use it in the title, itinerary and answers.
- Use "things to do in {X}" and natural variants ("what to see in {X}", "{X} itinerary", "where to stay in {X}") in section headings without forcing them.
- Answer in the first sentence of each section. FAQs phrased the way people search Google.

EXACT FORMAT
TITLE: title of 48-60 characters starting with "Things to Do in {X}" or "{X} in N Days" (e.g. "Things to Do in {X}: A 3-Day Guide on a Budget"; vary the ending)
DESCRIPTION: meta description of 140-155 characters, natural, with the number of days and something specific to the place
---
HTML of 2,000-2,500 words using only <h2>, <h3>, <p>, <ul>, <li>, <strong>. No <h1>. Order:
1. Two paragraphs without a heading: what the place is really like, who it suits, how many days you need.
2. <h2>What to see in {X}: the places worth your time</h2> with 10-14 <h3>, one per place: what it is, why go, how long, rough price or free, and one tip (time, ticket, best viewpoint).
3. <h2>Things to do in {X}</h2>: 6-8 ideas beyond sightseeing.
4. <h2>{X} for free (or almost)</h2>.
5. <h2>{X} itinerary: N days</h2> with one <h3> per day (morning, afternoon, evening) in an order you can walk or ride.
6. <h2>What is overrated (and what to do instead)</h2>: 3-4 honest points.
7. <h2>When to visit {X}</h2>: weather, seasons, when it is quieter and when it is cheaper.
8. <h2>Where to stay in {X}: best areas</h2>: 3-5 neighbourhoods, who each suits and price range per night.
9. <h2>What to eat in {X}</h2>: specific dishes, what to order, what a lunch and a dinner cost.
10. <h2>Airport to city centre and getting around</h2>: real options with time and price, and travel passes.
11. <h2>How much a trip to {X} costs</h2>: daily budget for shoestring and mid-range, as a list.
12. <h2>Day trips from {X}</h2>: 3-5, with how to get there and how long it takes.
13. <h2>Common mistakes and scams</h2>.
14. <h2>{X} FAQ</h2> with 6-8 <h3> and 1-3 sentence answers.`;

async function spent() {
  const r = await db("hlc_guide_spend?select=usd");
  return (r || []).reduce((a, x) => a + Number(x.usd || 0), 0);
}

async function gen(lang, name, country) {
  const sys = (lang === "en" ? EN : ES).replaceAll("{X}", name);
  const user = lang === "en" ? `Destination: ${name} (${country}). Write the guide.` : `Destino: ${name} (${country}). Escribe la guía.`;
  let errs = [];
  for (const model of ["claude-opus-5-5", "claude-sonnet-5-5"]) {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": Deno.env.get("ANTHROPIC_API_KEY"), "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: MAX_TOK, ...(model.startsWith("claude-opus") ? { output_config: { effort: "low" } } : {}), system: sys, messages: [{ role: "user", content: user }] })
    });
    const t = await r.text();
    if (!r.ok) { errs.push(`${model} ${r.status} ${t.slice(0, 160)}`); continue; }
    const j = JSON.parse(t);
    const u = j.usage || {}, p = PRICE[model];
    const usd = ((u.input_tokens || 0) * p[0] + (u.output_tokens || 0) * p[1]) / 1e6;
    return { text: (j.content || []).filter((c) => c.type === "text").map((c) => c.text).join(""), model, usd, inTok: u.input_tokens || 0, outTok: u.output_tokens || 0, stop: j.stop_reason };
  }
  throw new Error(errs.join(" | "));
}

function parse(txt, lang) {
  const tk = lang === "en" ? "TITLE" : "TITULO", dk = lang === "en" ? "DESCRIPTION" : "DESCRIPCION";
  const title = ((txt.match(new RegExp(tk + ":\\s*(.+)")) || [, ""])[1]).trim().replace(/^["«]|["»]$/g, "");
  const desc = ((txt.match(new RegExp(dk + ":\\s*(.+)")) || [, ""])[1]).trim().replace(/^["«]|["»]$/g, "");
  const html = txt.includes("---") ? txt.slice(txt.indexOf("---") + 3) : txt;
  const clean = html.replace(/```\w*/g, "").replace(/<(?!\/?(h2|h3|p|ul|li|strong)\b)[^>]*>/gi, "").replace(/\s*—\s*/g, ", ").trim();
  return { title, desc, clean };
}

async function save(lang, it, txt, model) {
  const { title, desc, clean } = parse(txt, lang);
  if (clean.length < 9000) return `corta (${clean.length})`;
  if (lang === "es") {
    await db("hlc_dest_guides?on_conflict=slug", { method: "POST", headers: { prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ slug: it.slug, name: it.name, country: it.country, guide_html: clean, seo_title: title.slice(0, 80), meta_description: desc.slice(0, 170), model: model + " (once)", updated_at: new Date().toISOString() }) });
  } else {
    await db(`hlc_dest_guides?slug=eq.${encodeURIComponent(it.slug)}`, { method: "PATCH", headers: { prefer: "return=minimal" },
      body: JSON.stringify({ guide_html_en: clean, seo_title_en: title.slice(0, 80), meta_description_en: desc.slice(0, 170), updated_en: new Date().toISOString() }) });
  }
  return null;
}

function req1(lang, it) {
  const sys = (lang === "en" ? EN : ES).replaceAll("{X}", lang === "en" ? (it.name_en || it.name) : it.name);
  const user = lang === "en" ? `Destination: ${it.name_en || it.name} (${it.country_en || it.country}). Write the guide.` : `Destino: ${it.name} (${it.country}). Escribe la guía.`;
  return { custom_id: `${lang}__${it.slug}`, params: { model: "claude-opus-5-5", max_tokens: MAX_TOK, output_config: { effort: "low" }, system: sys, messages: [{ role: "user", content: user }] } };
}

async function batchSubmit(lang, items) {
  const before = await spent();
  const worst = items.length * MAX_TOK * BATCH_PRICE[1] / 1e6;
  if (before + worst > CAP_USD) return { error: "cap", spent: before, worst };
  const r = await fetch("https://api.anthropic.com/v1/messages/batches", { method: "POST", headers: AH(), body: JSON.stringify({ requests: items.map((it) => req1(lang, it)) }) });
  const j = await r.json();
  if (!r.ok) return { error: JSON.stringify(j).slice(0, 300) };
  await db("hlc_guide_batches", { method: "POST", headers: { prefer: "return=minimal" }, body: JSON.stringify({ id: j.id, lang, items, status: j.processing_status }) });
  return { id: j.id, status: j.processing_status, n: items.length, spent: before, worst };
}

async function batchCollect(id) {
  const rows = await db(`hlc_guide_batches?id=eq.${encodeURIComponent(id)}&select=*`);
  if (!rows || !rows.length) return { error: "no batch" };
  const B = rows[0];
  if (B.status === "collected") return { id, status: "collected" };
  const s = await (await fetch(`https://api.anthropic.com/v1/messages/batches/${id}`, { headers: AH() })).json();
  if (s.processing_status !== "ended") return { id, status: s.processing_status, counts: s.request_counts };
  const res = await (await fetch(s.results_url, { headers: AH() })).text();
  const byId = Object.fromEntries((B.items || []).map((it) => [`${B.lang}__${it.slug}`, it]));
  let ok = 0, usd = 0; const bad = [], spend = [];
  for (const line of res.split("\n")) {
    if (!line.trim()) continue;
    const x = JSON.parse(line); const it = byId[x.custom_id];
    if (!it) continue;
    if (x.result?.type !== "succeeded") { bad.push(`${it.slug}: ${x.result?.type}`); continue; }
    const m = x.result.message, u = m.usage || {};
    const c = ((u.input_tokens || 0) * BATCH_PRICE[0] + (u.output_tokens || 0) * BATCH_PRICE[1]) / 1e6; usd += c;
    spend.push({ slug: it.slug, lang: B.lang, model: "claude-opus-5-5 (batch)", in_tok: u.input_tokens || 0, out_tok: u.output_tokens || 0, usd: c });
    const txt = (m.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
    if (m.stop_reason !== "end_turn") { bad.push(`${it.slug}: ${m.stop_reason}`); continue; }
    try { const e = await save(B.lang, it, txt, "claude-opus-5-5"); if (e) bad.push(`${it.slug}: ${e}`); else ok++; } catch (e) { bad.push(`${it.slug}: ${e.message}`); }
  }
  if (spend.length) await db("hlc_guide_spend", { method: "POST", headers: { prefer: "return=minimal" }, body: JSON.stringify(spend) });
  await db(`hlc_guide_batches?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { prefer: "return=minimal" }, body: JSON.stringify({ status: "collected" }) });
  return { id, ok, bad, usd: Math.round(usd * 100) / 100, total: Math.round((await spent()) * 100) / 100 };
}

Deno.serve(async (req) => {
  try {
    const secret = Deno.env.get("HLC_CRON_SECRET");
    if (!secret || req.headers.get("x-hlc-secret") !== secret) return json({ error: "forbidden" }, 403);
    const b = await req.json().catch(() => ({}));
    if (b.action === "spent") return json({ usd: await spent(), cap: CAP_USD });
    if (b.action === "batch_submit") return json(await batchSubmit(b.lang === "en" ? "en" : "es", b.items || []));
    if (b.action === "batch_collect") return json(await batchCollect(String(b.id || "")));
    if (b.action !== "guide") return json({ error: "action" }, 400);
    const lang = b.lang === "en" ? "en" : "es";
    const slug = String(b.slug || ""), name = String(b.name || ""), country = String(b.country || "");
    if (!slug || !name) return json({ error: "slug/name" }, 400);
    const before = await spent();
    if (before >= CAP_USD) return json({ error: "cap", usd: before }, 402);
    const g = await gen(lang, name, country);
    await db("hlc_guide_spend", { method: "POST", headers: { prefer: "return=minimal" }, body: JSON.stringify({ slug, lang, model: g.model, in_tok: g.inTok, out_tok: g.outTok, usd: g.usd }) });
    const { title, desc, clean } = parse(g.text, lang);
    if (clean.length < 9000 || g.stop !== "end_turn") return json({ slug, lang, error: `corta o cortada (${clean.length}, ${g.stop})`, usd: g.usd });
    if (lang === "es") {
      await db("hlc_dest_guides?on_conflict=slug", { method: "POST", headers: { prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ slug, name, country, guide_html: clean, seo_title: title.slice(0, 80), meta_description: desc.slice(0, 170), model: g.model + " (once)", updated_at: new Date().toISOString() }) });
    } else {
      await db(`hlc_dest_guides?slug=eq.${encodeURIComponent(slug)}`, { method: "PATCH", headers: { prefer: "return=minimal" },
        body: JSON.stringify({ guide_html_en: clean, seo_title_en: title.slice(0, 80), meta_description_en: desc.slice(0, 170), updated_en: new Date().toISOString() }) });
    }
    return json({ slug, lang, ok: clean.length, title, model: g.model, usd: Math.round(g.usd * 10000) / 10000, total: Math.round((before + g.usd) * 100) / 100 });
  } catch (e) {
    return json({ error: String(e && e.message || e) }, 500);
  }
});
