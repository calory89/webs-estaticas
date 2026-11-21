const SB_URL = Deno.env.get("SUPABASE_URL");
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SITE = "https://www.happylowcost.com";
const PID = "101900924";
const AID = {
  flight: "17288982",
  hotel: "17288959"
};
const SOURCES = [
  {
    name: "hlc-hunt",
    feed: "https://gmdalfsvtfhzepyrdmjj.supabase.co/functions/v1/hlc-routes?action=rss"
  },
  {
    name: "travelfree",
    feed: "https://travelfree.info/feed/"
  },
  {
    name: "fly4free",
    feed: "https://www.fly4free.com/feed/"
  },
  {
    name: "secretflying",
    html: "https://www.secretflying.com/"
  },
  {
    name: "sf-usa",
    html: "https://www.secretflying.com/usa-flight-deals/"
  },
  {
    name: "sf-canada",
    html: "https://www.secretflying.com/canada-flight-deals/"
  },
  {
    name: "sf-uk-ireland",
    html: "https://www.secretflying.com/uk-ireland-flight-deals/"
  },
  {
    name: "sf-europe",
    html: "https://www.secretflying.com/europe-flight-deals/"
  },
  {
    name: "sf-middle-east-north-africa",
    html: "https://www.secretflying.com/middle-east-north-africa-flight-deals/"
  },
  {
    name: "sf-africa",
    html: "https://www.secretflying.com/africa-flight-deals/"
  },
  {
    name: "sf-central-south-asia",
    html: "https://www.secretflying.com/central-south-asia-flight-deals/"
  },
  {
    name: "sf-east-asia",
    html: "https://www.secretflying.com/east-asia-flight-deals/"
  },
  {
    name: "sf-oceania",
    html: "https://www.secretflying.com/oceania-flight-deals/"
  },
  {
    name: "sf-central-america-caribbean",
    html: "https://www.secretflying.com/central-america-caribbean-flight-deals/"
  },
  {
    name: "sf-south-america",
    html: "https://www.secretflying.com/south-america-flight-deals/"
  },
  {
    name: "theflightdeal",
    feed: "https://www.theflightdeal.com/feed/"
  },
  {
    name: "iknowthepilot",
    feed: "https://www.iknowthepilot.com.au/feed/"
  },
  {
    name: "viajerospiratas",
    feed: "https://www.viajerospiratas.es/feed"
  },
  {
    name: "urlaubspiraten",
    feed: "https://www.urlaubspiraten.de/feed"
  },
  {
    name: "travelpirates",
    feed: "https://www.travelpirates.com/feed"
  }
];
const ORIGIN_OK = new Set([
  "ES",
  "PT",
  "FR",
  "IT",
  "GB",
  "AD",
  "GI"
]);
const EUROPE = new Set([
  "ES",
  "PT",
  "FR",
  "IT",
  "GB",
  "IE",
  "DE",
  "NL",
  "BE",
  "LU",
  "CH",
  "AT",
  "DK",
  "SE",
  "NO",
  "FI",
  "IS",
  "PL",
  "CZ",
  "SK",
  "HU",
  "RO",
  "BG",
  "GR",
  "HR",
  "SI",
  "RS",
  "BA",
  "ME",
  "MK",
  "AL",
  "EE",
  "LV",
  "LT",
  "MT",
  "CY",
  "AD",
  "GI",
  "MC",
  "UA",
  "MD",
  "TR"
]);
const MAX_PER_RUN = 6;
const ES_HUBS = [
  {
    city: "Madrid",
    iata: "MAD",
    country: "ES"
  },
  {
    city: "Barcelona",
    iata: "BCN",
    country: "ES"
  }
];
const H = {
  "content-type": "application/json",
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "GET, POST, OPTIONS"
};
const json = (o, s = 200)=>new Response(JSON.stringify(o), {
    status: s,
    headers: H
  });
async function db(path, init = {}) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SB_KEY,
      authorization: `Bearer ${SB_KEY}`,
      "content-type": "application/json",
      prefer: "return=representation",
      ...init.headers || {}
    }
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`db ${r.status} ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : null;
}
async function claude(system, user, maxTokens = 1500, models = [
  "claude-haiku-5-5",
  "claude-haiku-4-5"
]) {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) throw new Error("no ANTHROPIC_API_KEY");
  let last = "";
  for (const model of models){
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: system + "\n\nResponde únicamente con el objeto JSON, sin texto antes ni después y sin bloques de código.",
        messages: [
          {
            role: "user",
            content: user
          }
        ]
      })
    });
    const t = await r.text();
    if (!r.ok) {
      last = `${model} ${r.status} ${t.slice(0, 200)}`;
      continue;
    }
    const j = JSON.parse(t);
    const txt = (j.content || []).filter((c)=>c.type === "text").map((c)=>c.text).join("");
    const a = txt.indexOf("{"), b = txt.lastIndexOf("}");
    try {
      const o = JSON.parse(txt.slice(a, b + 1));
      o._model = model;
      return o;
    } catch  {
      last = model + " bad json " + txt.slice(0, 200);
    }
  }
  throw new Error("claude: " + last);
}
function strip(s) {
  return s.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, " ").replace(/&#8211;|&ndash;/g, "–").replace(/&#8217;|&rsquo;/g, "'").replace(/&amp;/g, "&").replace(/&#8364;|&euro;/g, "€").replace(/&nbsp;|&#160;/g, " ").replace(/&#\d+;/g, " ").replace(/\s+/g, " ").trim();
}
async function readFeed(src) {
  const r = await fetch(src.feed || src.html, {
    headers: {
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36",
      "accept-language": "es-ES,es;q=0.9,en;q=0.8"
    }
  });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const x = await r.text();
  const items = [];
  if (src.html) {
    const seenU = new Set();
    for (const m of x.matchAll(/<a[^>]+href="(https:\/\/www\.secretflying\.com\/posts\/[^"#?]+)"[^>]*>([\s\S]*?)<\/a>/g)){
      const t = strip(m[2]);
      if (t.length < 25 || seenU.has(m[1]) || !/(€|\$|£|A\$|roundtrip|one-way|return)/i.test(t)) continue;
      seenU.add(m[1]);
      items.push({
        source: src.name,
        title: t,
        url: m[1],
        pub: "",
        text: t
      });
    }
    return items.slice(0, 20);
  }
  for (const m of x.matchAll(/<item>([\s\S]*?)<\/item>/g)){
    const it = m[1];
    const g = (tag)=>{
      const mm = it.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return mm ? strip(mm[1]) : "";
    };
    const content = (it.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/) || [
      ,
      ""
    ])[1];
    items.push({
      source: src.name,
      title: g("title"),
      url: g("link"),
      pub: g("pubDate"),
      text: (g("description") + " " + strip(content)).slice(0, 3500)
    });
  }
  return items.slice(0, 25);
}
function looksLikeFlight(t) {
  const flighty = /flight|flights|fly|airline|error fare|return|one-way|round-?trip|vuelo|vuelos|flüge|flug|vols?\b|nonstop|non-stop|roundtrip/i.test(t);
  const money = /€|eur|\$|usd|aud|£|gbp/i.test(t);
  const notHotel = !/^\s*\d?\*?\s*hotel|per night|\/night|cruise|crucero|kreuzfahrt|all-inclusive|todo incluido|pauschal|hotel \d|(?<![\p{L}])spa(?![\p{L}])|win a|gana un|gewinn/iu.test(t);
  return flighty && money && notHotel;
}
function priceIn(t) {
  const m = t.match(/€\s?(\d[\d,.]*)|(\d[\d,.]*)\s?€|(\d[\d,.]*)\s?EUR/i);
  if (!m) return null;
  return Number((m[1] || m[2] || m[3]).replace(/[.,](?=\d{3}\b)/g, "").replace(",", "."));
}
async function kiwi(args) {
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "search-flight",
      arguments: {
        currency: "EUR",
        locale: "es",
        ...args
      }
    }
  };
  const r = await fetch("https://mcp.kiwi.com/", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream"
    },
    body: JSON.stringify(body)
  });
  const raw = await r.text();
  const line = raw.split("\n").find((l)=>l.startsWith("data:"));
  const j = JSON.parse(line ? line.slice(5) : raw);
  const res = j.result || {};
  const c = res.structuredContent || (res.content?.[0]?.text ? JSON.parse(res.content[0].text) : null);
  return c?.itineraries || [];
}
const dmy = (iso)=>{
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
// Foto fiable del destino: artículo de Wikipedia cuyas coordenadas están a < 80 km del aeropuerto (nunca publicamos sin foto)
let AIRPORTS = null;
async function cityPhotoGeo(city, iata) {
  if (!AIRPORTS) {
    try {
      AIRPORTS = await (await fetch("https://www.happylowcost.com/hlc/airports.json")).json();
    } catch  {
      AIRPORTS = {};
    }
  }
  const ap = AIRPORTS[(iata || "").toUpperCase()];
  if (!ap) return null;
  const [la0, lo0] = ap;
  const dist = (a, b)=>{
    const r = Math.PI / 180;
    return 6371 * Math.acos(Math.min(1, Math.sin(a * r) * Math.sin(la0 * r) + Math.cos(a * r) * Math.cos(la0 * r) * Math.cos((b - lo0) * r)));
  };
  const UAH = {
    "user-agent": "HappyLowCostBot/1.0 (https://www.happylowcost.com; bot@happylowcost.com)"
  };
  const BADT = /airport|aeropuerto|aéroport|flughafen|airfield|air base|station|stadium|university|universidad|county|condado|metropolitan area|área metropolitana/i;
  const BADF = /(map|mapa|flag|bandera|coat|escudo|seal|logo|locator|location|montage|collage|airport|aeropuerto)/i;
  for (const [lang, q] of [
    [
      "en",
      city
    ],
    [
      "en",
      `${city} city`
    ],
    [
      "es",
      city
    ]
  ]){
    let j;
    try {
      j = await (await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrlimit=6&gsrsearch=${encodeURIComponent(q)}&prop=pageimages|coordinates&piprop=original&colimit=max`, {
        headers: UAH
      })).json();
    } catch  {
      continue;
    }
    const pages = Object.values(j?.query?.pages || {}).sort((a, b)=>(a.index || 99) - (b.index || 99));
    for (const pg of pages){
      const co = pg.coordinates?.[0];
      if (!co || dist(co.lat, co.lon) > 80 || BADT.test(pg.title || "")) continue;
      const o = pg.original;
      const cands = [];
      if (o?.source && !/\.svg$/i.test(o.source) && !BADF.test(o.source) && o.width >= 1000 && o.width / o.height >= 1.2) cands.push(decodeURIComponent(o.source.split("?")[0].split("/").pop()));
      if (!cands.length) {
        try {
          const im = await (await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&format=json&generator=images&gimlimit=50&titles=${encodeURIComponent(pg.title)}&prop=imageinfo&iiprop=size`, {
            headers: UAH
          })).json();
          for (const ip of Object.values(im?.query?.pages || {})){
            const t = ip.title || "", ii = ip.imageinfo?.[0] || {};
            if (/skyline|downtown|panorama|aerial|view|beach|bay|harbou?r|old town|city|centro|vista/i.test(t) && !/map|flag|seal|logo|svg/i.test(t) && ii.width >= 1400 && ii.width / ii.height >= 1.3 && ii.width / ii.height <= 2.6) cands.push(t.replace(/^(File|Archivo):/, ""));
          }
        } catch  {}
      }
      for (const fname of cands){
        try {
          const ii = await (await fetch(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=1920&titles=File:${encodeURIComponent(fname)}`, {
            headers: UAH
          })).json();
          const info = Object.values(ii?.query?.pages || {})[0]?.imageinfo?.[0];
          if (!info) continue;
          const md = info.extmetadata || {};
          const lic = strip(md.LicenseShortName?.value || "");
          if (!/cc|public domain|pd/i.test(lic)) continue;
          const artist = strip(md.Artist?.value || "").slice(0, 80) || "Wikimedia Commons";
          return {
            url: info.thumburl || info.url,
            credit: `Foto: ${artist} · ${lic} · Wikimedia Commons`,
            page: pg.title
          };
        } catch  {}
      }
    }
  }
  return null;
}
async function cityPhoto(city, country) {
  for (const lang of [
    "es",
    "en"
  ]){
    for (const q of [
      city,
      `${city} (${country})`
    ]){
      try {
        const s = await (await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q.replace(/ /g, "_"))}`, {
          headers: {
            "user-agent": "HappyLowCost/1.0 (carlos@equinoxinvestmentgroup.com)"
          }
        })).json();
        const file = s?.originalimage?.source?.split("/").pop();
        if (!file || /\.svg$/i.test(file) || /(flag|map|locator|coat|escudo|bandera|mapa)/i.test(file)) continue;
        const fname = decodeURIComponent(file).replace(/^\d+px-/, "");
        const ii = await (await fetch(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=1920&titles=File:${encodeURIComponent(fname)}`, {
          headers: {
            "user-agent": "HappyLowCost/1.0"
          }
        })).json();
        const page = Object.values(ii?.query?.pages || {})[0];
        const info = page?.imageinfo?.[0];
        if (!info || info.width && info.width < 900) continue;
        const md = info.extmetadata || {};
        const lic = strip(md.LicenseShortName?.value || "");
        if (!/cc|public domain|pd/i.test(lic)) continue;
        const artist = strip(md.Artist?.value || "").slice(0, 80) || "Wikimedia Commons";
        return {
          url: info.thumburl || info.url,
          credit: `Foto: ${artist} \xB7 ${lic} \xB7 Wikimedia Commons`,
          page: info.descriptionurl
        };
      } catch  {}
    }
  }
  return null;
}
function cj(aid, url) {
  return `https://www.kqzyfj.com/click-${PID}-${aid}?sid=happylowcost&url=${encodeURIComponent(url)}`;
}
function bookingFlights(o, d, dep, ret) {
  const type = ret ? "ROUNDTRIP" : "ONEWAY";
  const u = `https://flights.booking.com/flights/${o}.AIRPORT-${d}.AIRPORT/?type=${type}&adults=1&cabinClass=ECONOMY&from=${o}.AIRPORT&to=${d}.AIRPORT&depart=${dep}${ret ? `&return=${ret}` : ""}&sort=CHEAPEST&locale=es&salesCurrency=EUR`;
  return cj(AID.flight, u);
}
const bookingHotels = (city)=>cj(AID.hotel, `https://www.booking.com/searchresults.es.html?ss=${encodeURIComponent(city)}`);
function slugify(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
}
const EXTRACT = `Eres analista de chollos de vuelos para Happy Low Cost, web en español que publica chollos de todo el mundo. Devuelve SOLO JSON con esta forma:
{"is_flight_deal":bool,"origins":[{"city":"nombre en español","iata":"MAD","country":"ES","country_es":"España","continent":"Europa|Asia|Norteamérica|Centroamérica y Caribe|Sudamérica|África|Oceanía|Oriente Medio"}],"destination":{"city":"nombre en español","iata":"XXX","country":"PT","country_es":"Portugal","continent":"Europa|Asia|Norteamérica|Centroamérica y Caribe|Sudamérica|África|Oceanía|Oriente Medio"},"price_eur":number,"trip":"return"|"oneway","error_fare":bool,"airline":"","direct":bool|null,"period":"texto corto en español de cuándo se vuela","example_dates":[{"depart":"YYYY-MM-DD","return":"YYYY-MM-DD o null"}]}
Reglas: origins = todos los aeropuertos de salida mencionados (códigos IATA reales; si solo hay ciudad usa el aeropuerto principal; country = código ISO de 2 letras). price_eur = el precio más bajo anunciado convertido a euros (1 USD≈0,92 €, 1 AUD≈0,60 €, 1 GBP≈1,17 €, 1 CAD≈0,67 €, 1 PLN≈0,23 €). example_dates: hasta 3 fechas concretas FUTURAS dentro del periodo indicado (si no hay fechas, propone fechas razonables en los próximos 3 meses; ida y vuelta de 4-10 días salvo que el texto diga otra cosa). error_fare=true SOLO si el texto habla de tarifa error / error fare / mistake fare, o si el precio es al menos un 70% más barato de lo normal para esa ruta (por ejemplo 100 € donde lo normal son 500 €); si no, false. Si es un hotel, paquete, crucero, sorteo o noticia: is_flight_deal=false.`;
const WRITE = `Eres el redactor de Happy Low Cost, la web de chollos de vuelos m\xE1s querida de Espa\xF1a (400.000 seguidores en Facebook). Escribes en espa\xF1ol de Espa\xF1a, cercano, con energ\xEDa y sin exagerar. NUNCA copies texto de otras webs: redacta todo con tus palabras. No inventes datos que no te d\xE9 el usuario. NUNCA hables de equipaje, maletas, tasas, condiciones de tarifa ni n\xFAmero de plazas: no lo sabemos. Di siempre que el precio puede cambiar y que se comprueba al pulsar el bot\xF3n. Devuelve SOLO JSON:
{"title":"titular de 60-80 caracteres con origen, destino y precio (ej. ✈️ Madrid → Lisboa desde 73 € ida y vuelta)","excerpt":"1 frase gancho de 120-160 caracteres","body_html":"3-5 p\xE1rrafos <p> cortos: qu\xE9 es el chollo, fechas encontradas, consejo para reservar r\xE1pido (los precios cambian), 2-3 ideas de qu\xE9 hacer en el destino; sin enlaces","fb_message":"post de Facebook de 3-6 l\xEDneas con 2-4 emojis, precio, fechas y llamada a la acci\xF3n 'Mira las fechas y reserva aqu\xED \u{1F447}'; sin hashtags salvo #HappyLowCost al final","tags":["3-5 etiquetas cortas"]}`;
const ANGLES = [
  "primera vez en la ciudad, lo imprescindible sin agobios",
  "escapada de pareja",
  "viaje con amigos y vida nocturna",
  "foodie: comer y beber como un local",
  "presupuesto mínimo: gratis o casi gratis",
  "con niños",
  "fotógrafo: miradores y luces del día",
  "48 horas a toda velocidad",
  "barrios menos turísticos",
  "historia y cultura sin museos aburridos",
  "naturaleza y alrededores en excursión de un día",
  "lluvia o frío: plan B bajo techo"
];
const GUIDE = `Eres un periodista de viajes español que ha estado varias veces en el destino y escribe para la web Happy Low Cost. Escribe en español de España, como habla una persona real a un amigo: frases de longitud variada, alguna opinión propia, algún detalle pequeño y concreto (un plato, una calle, la hora a la que hay menos gente), sin sonar a folleto.
PROHIBIDO: emojis; estas expresiones y parecidas: "sumérgete", "joya escondida", "no te lo puedes perder", "imprescindible" más de una vez, "vibrante", "tapiz", "en resumen", "en conclusión", "descubre", "experiencia inolvidable", "para todos los gustos", "un sinfín", "rincón con encanto", "te espera", "déjate llevar"; empezar párrafos igual; listas de adjetivos; frases de relleno.
Solo lugares, barrios, platos y transportes que existan de verdad y sean conocidos; si no estás 100% seguro de dónde está algo, no lo sitúes en un pueblo o barrio concreto. No des precios ni horarios exactos salvo que sean muy estables; si dudas, habla en general. No menciones el chollo, el vuelo, aerolíneas, equipaje ni que eres una IA.
Formato de salida EXACTO (sin nada más):
TITULO: título SEO de 55-65 caracteres, tipo «Qué ver en X…» o similar, distinto cada vez
DESCRIPCION: meta descripción natural de 140-155 caracteres
---
y después el HTML de la guía (650-900 palabras) usando solo <h2>, <h3>, <p>, <ul>, <li>, <strong>. Secciones con títulos propios, no genéricos: qué ver (5-7 sitios concretos y por qué), qué hacer, dónde comer y qué pedir, en qué barrio dormir según presupuesto, cómo llegar desde el aeropuerto, y un consejo que solo sabría alguien que ha ido.`;
async function claudeRaw(system, user, maxTokens, models) {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  let errs = [];
  for (const model of models){
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system,
        messages: [
          {
            role: "user",
            content: user
          }
        ]
      })
    });
    const t = await r.text();
    if (!r.ok) {
      errs.push(`${model} ${r.status} ${t.slice(0, 160)}`);
      continue;
    }
    const j = JSON.parse(t);
    return {
      text: (j.content || []).filter((c)=>c.type === "text").map((c)=>c.text).join(""),
      model,
      stop: j.stop_reason
    };
  }
  throw new Error("claudeRaw: " + errs.join(" | "));
}
async function makeGuide(dest, country, iata) {
  let prev = [];
  try {
    const rows = await db(`hlc_deals?select=post&parsed->destination->>iata=eq.${encodeURIComponent(iata)}&post->>guide_html=not.is.null&order=created_at.desc&limit=4`);
    prev = rows.map((r)=>({
        angulo: r.post?.guide_angle,
        titulo: r.post?.seo_title,
        inicio: String(r.post?.guide_html || "").replace(/<[^>]+>/g, " ").slice(0, 220)
      }));
  } catch  {}
  const used = new Set(prev.map((p)=>p.angulo));
  const pool = ANGLES.filter((a)=>!used.has(a));
  const angle = (pool.length ? pool : ANGLES)[Math.floor(Math.random() * (pool.length || ANGLES.length))];
  const g = await claudeRaw(GUIDE, `Destino: ${dest} (${country}). Enfoque de esta guía: ${angle}.\nPublicaciones anteriores sobre este destino (NO repitas su título, su enfoque ni sus frases; elige otros sitios destacados cuando sea posible):\n${JSON.stringify(prev)}`, 8000, [
    "claude-sonnet-5-5",
    "claude-haiku-5-5",
    "claude-haiku-4-5"
  ]);
  const txt = g.text;
  const title = (txt.match(/TITULO:\s*(.+)/) || [
    ,
    ""
  ])[1].trim();
  const desc = (txt.match(/DESCRIPCION:\s*(.+)/) || [
    ,
    ""
  ])[1].trim();
  const html = txt.includes("---") ? txt.slice(txt.indexOf("---") + 3) : txt;
  const clean = html.replace(/```\w*/g, "").replace(/<(?!\/?(h2|h3|p|ul|li|strong)\b)[^>]*>/gi, "").trim();
  if (clean.length < 3500) throw new Error("guía demasiado corta " + g.model + " " + g.stop);
  return {
    guide_stop: g.stop,
    guide_model: g.model,
    guide_html: clean,
    seo_title: title.slice(0, 80),
    meta_description: desc.slice(0, 170),
    guide_angle: angle
  };
}
const DEST_GUIDE = `Eres un periodista de viajes español que conoce bien el destino y escribe la guía de referencia de Happy Low Cost. Español de España, tono de persona real que se lo cuenta a un amigo: frases de longitud variada, opiniones propias, detalles concretos (un plato, una calle, la hora con menos gente), cero tono de folleto.
PROHIBIDO: emojis; "sumérgete", "joya escondida", "no te lo puedes perder", "vibrante", "tapiz", "en resumen", "en conclusión", "descubre", "experiencia inolvidable", "para todos los gustos", "un sinfín", "rincón con encanto", "te espera", "déjate llevar"; empezar párrafos igual; relleno.
Solo lugares, barrios, platos y transportes que existan de verdad y sean conocidos; si no estás seguro de dónde está algo, no lo sitúes. Precios solo orientativos y en general. No digas que eres una IA.
Formato EXACTO:
TITULO: título SEO de 55-65 caracteres (p. ej. «Qué ver en X en 3 días: guía de un viajero…», varía la fórmula)
DESCRIPCION: meta descripción natural de 140-155 caracteres
---
HTML de 1.000-1.400 palabras usando solo <h2>, <h3>, <p>, <ul>, <li>, <strong>. Secciones con títulos propios: por qué ir; qué ver (7-10 sitios con por qué); qué hacer; cuántos días y ruta sugerida; cuándo ir (clima y temporadas); dónde dormir por barrios y presupuesto; qué comer y dónde; cómo llegar desde el aeropuerto y moverse; presupuesto orientativo por día; 5 preguntas frecuentes con respuesta corta (<h3> para cada pregunta).`;
async function makeDestGuide(name, country) {
  const g = await claudeRaw(DEST_GUIDE, `Destino: ${name} (${country}).`, 9000, [
    "claude-sonnet-5-5",
    "claude-haiku-5-5"
  ]);
  const txt = g.text;
  const title = (txt.match(/TITULO:\s*(.+)/) || [
    ,
    ""
  ])[1].trim();
  const desc = (txt.match(/DESCRIPCION:\s*(.+)/) || [
    ,
    ""
  ])[1].trim();
  const html = txt.includes("---") ? txt.slice(txt.indexOf("---") + 3) : txt;
  const clean = html.replace(/```\w*/g, "").replace(/<(?!\/?(h2|h3|p|ul|li|strong)\b)[^>]*>/gi, "").trim();
  if (clean.length < 5000) throw new Error("guía corta " + g.model + " " + g.stop);
  return {
    guide_html: clean,
    seo_title: title.slice(0, 80),
    meta_description: desc.slice(0, 170),
    model: g.model
  };
}
async function destGuides(n) {
  const rows = await db(`hlc_dest_guides?select=slug,name,country&guide_html=is.null&limit=${n}`);
  const out = [];
  await Promise.all(rows.map(async (r)=>{
    try {
      const g = await makeDestGuide(r.name, r.country || "");
      await db(`hlc_dest_guides?slug=eq.${encodeURIComponent(r.slug)}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...g,
          updated_at: new Date().toISOString()
        })
      });
      out.push({
        slug: r.slug,
        ok: g.guide_html.length
      });
    } catch (e) {
      out.push({
        slug: r.slug,
        error: e.message
      });
    }
  }));
  return {
    out
  };
}
const DEST_GUIDE_EN = `You are a seasoned travel journalist who knows this destination well and writes the reference guide for Happy Low Cost, a flight-deals site read by travellers all over the world. Natural English, the voice of a real person telling a friend: varied sentence length, honest opinions, concrete details (a dish, a street, the quietest hour), zero brochure tone.
FORBIDDEN: emojis; "hidden gem", "nestled", "vibrant", "tapestry", "bustling", "a must-see", "in conclusion", "whether you're", "something for everyone", "embark", "delve", "unforgettable experience"; starting paragraphs the same way; filler.
Only places, neighbourhoods, dishes and transport that really exist and are well known; if unsure where something is, don't place it. Prices only approximate and general. Never say you are an AI.
EXACT format:
TITLE: SEO title of 55-65 characters (e.g. "What to see in X in 3 days: a traveller's guide", vary the formula)
DESCRIPTION: natural meta description of 140-155 characters
---
HTML of 1,000-1,400 words using only <h2>, <h3>, <p>, <ul>, <li>, <strong>. Sections with their own headings: why go; what to see (7-10 places and why); things to do; how many days and suggested route; when to go (weather and seasons); where to stay by area and budget; what to eat and where; getting from the airport and getting around; rough daily budget; 5 FAQs with short answers (<h3> for each question).`;
async function makeDestGuideEn(name, country) {
  const g = await claudeRaw(DEST_GUIDE_EN, `Destination: ${name} (${country}).`, 9000, [
    "claude-sonnet-5-5",
    "claude-haiku-5-5"
  ]);
  const txt = g.text;
  const title = (txt.match(/TITLE:\s*(.+)/) || [
    ,
    ""
  ])[1].trim();
  const desc = (txt.match(/DESCRIPTION:\s*(.+)/) || [
    ,
    ""
  ])[1].trim();
  const html = txt.includes("---") ? txt.slice(txt.indexOf("---") + 3) : txt;
  const clean = html.replace(/```\w*/g, "").replace(/<(?!\/?(h2|h3|p|ul|li|strong)\b)[^>]*>/gi, "").trim();
  if (clean.length < 5000) throw new Error("short guide " + g.model + " " + g.stop);
  return {
    guide_html_en: clean,
    seo_title_en: title.slice(0, 80),
    meta_description_en: desc.slice(0, 170)
  };
}
async function destGuidesEn(n) {
  const rows = await db(`hlc_dest_guides?select=slug,name,country&guide_html_en=is.null&guide_html=not.is.null&limit=${n}`);
  const out = [];
  await Promise.all(rows.map(async (r)=>{
    try {
      const g = await makeDestGuideEn(r.name, r.country || "");
      await db(`hlc_dest_guides?slug=eq.${encodeURIComponent(r.slug)}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...g,
          updated_en: new Date().toISOString()
        })
      });
      out.push({
        slug: r.slug,
        ok: g.guide_html_en.length
      });
    } catch (e) {
      out.push({
        slug: r.slug,
        error: e.message
      });
    }
  }));
  return {
    out
  };
}
const TRANSLATE_EN = `You adapt Spanish flight-deal posts from Happy Low Cost into natural English for an international audience. Do not translate word for word: rewrite so it reads as if a native English travel writer wrote it. Keep every fact (cities, prices in €, dates, airline, stops) exactly; never add facts. Use English city names (Lisbon, Seville, Tokyo, Marrakesh, Warsaw...). "ida y vuelta" = "return", "solo ida" = "one way". Return ONLY JSON: {"title":"60-80 chars with origin, destination and price, e.g. ✈️ Madrid → Lisbon from €73 return","excerpt":"one hook sentence of 120-160 chars","body_html":"same paragraphs as <p>, no links","seo_title":"Flights X → Y for €N (return) · Verified deal, max 70 chars","meta_description":"140-155 chars","dest_en":"destination city name in English","orig_en":"origin city name in English"}`;
async function translateEn(n) {
  const rows = await db(`hlc_deals?select=id,post&status=in.(approved,web_live,fb_posted)&post->en=is.null&order=approved_at.desc&limit=${n}`);
  const out = [];
  await Promise.all(rows.map(async (r)=>{
    try {
      const p = r.post || {};
      const o = await claude(TRANSLATE_EN, JSON.stringify({
        title: p.title,
        excerpt: p.excerpt,
        body_html: p.body_html,
        facts: p.facts
      }), 2500);
      delete o._model;
      if (!o.title || !o.body_html) throw new Error("incomplete");
      await db(`hlc_deals?id=eq.${r.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          post: {
            ...p,
            en: o
          }
        })
      });
      out.push({
        id: r.id,
        ok: o.title
      });
    } catch (e) {
      out.push({
        id: r.id,
        error: e.message
      });
    }
  }));
  return {
    out
  };
}
// Precio habitual de la ruta: el más barato en Kiwi para 3 fechas distintas (misma duración), mediana.
async function priceRef(n) {
  const rows = await db(`hlc_deals?select=id,post&status=in.(approved,web_live,fb_posted)&post->price_ref=is.null&order=approved_at.desc&limit=${n}`);
  const out = [];
  await Promise.all(rows.map(async (r)=>{
    const p = r.post || {}, f = p.facts || {};
    try {
      if (!f.origen_iata || !f.destino_iata || !f.ida) throw new Error("faltan datos");
      const ida = new Date(f.ida + "T00:00:00Z");
      const len = f.vuelta ? Math.round((new Date(f.vuelta + "T00:00:00Z").getTime() - ida.getTime()) / 864e5) : 0;
      const iso = (d)=>d.toISOString().slice(0, 10);
      const prices = [];
      for (const off of [
        21,
        42,
        63
      ]){
        const d1 = new Date(ida.getTime() + off * 864e5);
        const args = {
          flyFrom: f.origen_iata,
          flyTo: f.destino_iata,
          departureDate: dmy(iso(d1)),
          departureDateFlexDays: 1
        };
        if (len > 0) {
          args.returnDate = dmy(iso(new Date(d1.getTime() + len * 864e5)));
          args.returnDateFlexDays = 1;
        }
        try {
          const its = await kiwi(args);
          const m = Math.min(...its.map((i)=>i.price).filter((x)=>x > 0));
          if (isFinite(m)) prices.push(m);
        } catch  {}
      }
      prices.sort((a, b)=>a - b);
      const med = prices.length ? prices[Math.floor((prices.length - 1) / 2)] : null;
      const price = Number(f.precio || 0);
      const ref = {
        checked_at: new Date().toISOString(),
        samples: prices
      };
      const facts = {
        ...f
      };
      if (med && price && med >= price * 1.2) {
        facts.precio_normal = Math.round(med / 10) * 10;
        facts.ahorro_pct = Math.round((1 - price / facts.precio_normal) * 100);
      }
      await db(`hlc_deals?id=eq.${r.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          post: {
            ...p,
            facts,
            price_ref: ref
          }
        })
      });
      out.push({
        id: r.id,
        price,
        samples: prices,
        normal: facts.precio_normal || null
      });
    } catch (e) {
      await db(`hlc_deals?id=eq.${r.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          post: {
            ...p,
            price_ref: {
              error: e.message,
              checked_at: new Date().toISOString()
            }
          }
        })
      });
      out.push({
        id: r.id,
        error: e.message
      });
    }
  }));
  return {
    out
  };
}
// Precio habitual de una ruta: mediana del más barato en Kiwi en 3 fechas distintas con la misma duración
async function routeRef(f) {
  const ida = new Date(f.ida + "T00:00:00Z");
  const len = f.vuelta ? Math.round((new Date(f.vuelta + "T00:00:00Z").getTime() - ida.getTime()) / 864e5) : 0;
  const iso = (d)=>d.toISOString().slice(0, 10);
  const res = await Promise.all([
    21,
    42,
    63
  ].map(async (off)=>{
    const d1 = new Date(ida.getTime() + off * 864e5);
    const args = {
      flyFrom: f.origen_iata,
      flyTo: f.destino_iata,
      departureDate: dmy(iso(d1)),
      departureDateFlexDays: 1
    };
    if (len > 0) {
      args.returnDate = dmy(iso(new Date(d1.getTime() + len * 864e5)));
      args.returnDateFlexDays = 1;
    }
    try {
      const its = await kiwi(args);
      const m = Math.min(...its.map((i)=>i.price).filter((x)=>x > 0));
      return isFinite(m) ? m : null;
    } catch  {
      return null;
    }
  }));
  const prices = res.filter((x)=>x).sort((a, b)=>a - b);
  return {
    prices,
    med: prices.length ? prices[Math.floor((prices.length - 1) / 2)] : null
  };
}
async function photoBackfill(n) {
  const rows = await db(`hlc_deals?select=id,slug,post&status=in.(approved,web_live,fb_posted)&image_url=is.null&limit=${n}`);
  const out = [];
  for (const r of rows){
    const f = r.post?.facts || {};
    const ph = await cityPhotoGeo(f.destino, f.destino_iata);
    if (ph) {
      await db(`hlc_deals?id=eq.${r.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          image_url: ph.url,
          image_credit: ph.credit
        })
      });
      out.push({
        slug: r.slug,
        ok: ph.page
      });
    } else {
      await db(`hlc_deals?id=eq.${r.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "withdrawn",
          reason: "retirado: sin foto fiable del destino"
        })
      });
      out.push({
        slug: r.slug,
        withdrawn: true
      });
    }
  }
  return {
    out
  };
}
async function backfillGuides(n) {
  const rows = await db(`hlc_deals?select=id,post,parsed&status=in.(approved,web_live,fb_posted)&post->>guide_html=is.null&order=approved_at.desc&limit=${n}`);
  const out = [];
  for (const r of rows){
    try {
      const f = r.post?.facts || {};
      const g = await makeGuide(f.destino, f.pais || "", r.parsed?.destination?.iata || "");
      await db(`hlc_deals?id=eq.${r.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          post: {
            ...r.post,
            ...g
          }
        })
      });
      out.push({
        id: r.id,
        ok: g.guide_html.length
      });
    } catch (e) {
      out.push({
        id: r.id,
        error: e.message
      });
    }
  }
  return {
    out
  };
}
async function run(dry) {
  const T0 = Date.now();
  const log = [];
  const seenRows = await db(`hlc_deals?select=source_url&order=created_at.desc&limit=5000`);
  const seen = new Set(seenRows.map((r)=>r.source_url));
  const lists = await Promise.allSettled(SOURCES.map((s)=>readFeed(s)));
  const queues = [];
  lists.forEach((r, i)=>{
    if (r.status === "fulfilled") {
      queues.push(r.value.filter((it)=>it.url && !seen.has(it.url)));
      log.push(`${SOURCES[i].name}: ${r.value.length}`);
    } else log.push(`${SOURCES[i].name}: ERROR ${r.reason?.message || r.reason}`);
  });
  const items = [];
  // los chollos con salida desde Asia, Oceanía, África y Latinoamérica van primero; el resto rota en cada ejecución
  const PRI = /east-asia|central-south-asia|oceania|south-america|africa|central-america/;
  const pri = queues.filter((q)=>q[0] && PRI.test(q[0].source));
  const rest = queues.filter((q)=>!(q[0] && PRI.test(q[0].source)));
  const off = rest.length ? Math.floor(Date.now() / 1200000) % rest.length : 0;
  // primero las fuentes con salidas desde España/Europa (la audiencia principal de Facebook), luego el resto del mundo
  const ESP = /hlc-hunt|viajerospiratas|travelfree|sf-europe|sf-uk-ireland|fly4free/;
  const all = pri.concat(rest.slice(off), rest.slice(0, off));
  const ordered = all.filter((q)=>q[0] && ESP.test(q[0].source)).concat(all.filter((q)=>q[0] && !ESP.test(q[0].source)));
  for(let k = 0; k < 30; k++)for (const q of ordered)if (q[k]) items.push(q[k]);
  let processed = 0;
  const results = [];
  const today = new Date().toISOString().slice(0, 10);
  for (const it of items){
    if (processed >= MAX_PER_RUN || Date.now() - T0 > 85000) break;
    if (seen.has(it.url)) continue;
    const row = {
      source: it.source,
      source_url: it.url,
      source_title: it.title.slice(0, 300),
      source_price: priceIn(it.title)
    };
    if (!looksLikeFlight(it.title + " " + it.text.slice(0, 300))) {
      row.status = "rejected";
      row.reason = "no parece vuelo";
      if (!dry) {
        try {
          await db("hlc_deals", {
            method: "POST",
            body: JSON.stringify(row)
          });
        } catch  {}
      }
      seen.add(it.url);
      continue;
    }
    processed++;
    try {
      const p = await claude(EXTRACT, `Hoy es ${today}.\nTítulo: ${it.title}\nTexto: ${it.text}`);
      row.parsed = p;
      if (!p.is_flight_deal) throw new Error("no es vuelo");
      // Happy Low Cost publica solo ida y vuelta (regla de Carlos, 24-oct-2026: sin excepciones)
      if (p.trip === "oneway") throw new Error("solo ida (Happy Low Cost publica solo ida y vuelta)");
      const srcPrice = Number(p.price_eur || row.source_price);
      row.source_price = srcPrice;
      if (!srcPrice) throw new Error("sin precio");
      if (!p.destination?.iata) throw new Error("sin destino");
      const origs = (p.origins || []).filter((o)=>o && o.iata);
      if (!origs.length) throw new Error("sin origen");
      if (origs.some((o)=>o.iata === p.destination.iata)) throw new Error("origen = destino");
      let candidates = [];
      const es = origs.filter((o)=>o.country === "ES");
      if (es.length) candidates = es.slice(0, 2);
      else if (EUROPE.has(origs[0].country) && p.destination.country !== "ES") candidates = ES_HUBS.map((h)=>({
          ...h,
          country_es: "España",
          continent: "Europa"
        })).concat(origs.slice(0, 1));
      else candidates = origs.slice(0, 2);
      let best = null, origin = null;
      const dates = (p.example_dates || []).filter((ex)=>ex?.depart && ex.depart >= today).slice(0, 3);
      if (!dates.length) throw new Error("sin fechas futuras");
      // fechas extra repartidas (misma duración que la primera) por si Kiwi no encuentra las del anuncio
      {
        const d0 = dates[0], len = d0.return && d0.return !== "null" ? Math.max(2, Math.round((Date.parse(d0.return) - Date.parse(d0.depart)) / 864e5)) : 0;
        for (const off of [
          14,
          35,
          60
        ]){
          const dd = new Date(Date.parse(d0.depart) + off * 864e5);
          if (dd.getTime() - Date.now() > 300 * 864e5) continue;
          const dep = dd.toISOString().slice(0, 10);
          dates.push({
            depart: dep,
            return: len ? new Date(dd.getTime() + len * 864e5).toISOString().slice(0, 10) : null
          });
        }
      }
      outer: for (const cand of candidates){
        for (const ex of dates){
          const args = {
            flyFrom: cand.iata,
            flyTo: p.destination.iata,
            departureDate: dmy(ex.depart),
            departureDateFlexDays: 3
          };
          if (p.trip === "return" && ex.return && ex.return !== "null") {
            args.returnDate = dmy(ex.return);
            args.returnDateFlexDays = 3;
          }
          let its = [];
          try {
            its = await kiwi(args);
          } catch  {}
          for (const i of its)if (!best || i.price < best.price) {
            best = i;
            origin = cand;
          }
          if (best && best.price <= srcPrice * 1.2) break outer;
        }
      }
      if (!best) throw new Error("Kiwi sin resultados");
      row.parsed.used_origin = origin;
      row.kiwi_price = best.price;
      row.kiwi = {
        price: best.price,
        out: best.outbound?.departureTime,
        back: best.inbound?.departureTime || null,
        route: best.outbound?.route,
        stops: best.outbound?.stops,
        carrier: best.outbound?.segments?.[0]?.carrierName
      };
      if (best.price > srcPrice * 1.2) throw new Error(`precio hoy ${best.price} € > anunciado ${srcPrice} €`);
      const dep = String(best.outbound.departureTime).slice(0, 10);
      const ret = best.inbound ? String(best.inbound.departureTime).slice(0, 10) : null;
      if (!ret) throw new Error("solo ida (Happy Low Cost publica solo ida y vuelta)");
      const price = Math.floor(best.price);
      const facts = {
        origen: origin.city,
        origen_iata: origin.iata,
        origen_cc: origin.country,
        origen_pais: origin.country_es || "",
        origen_continente: origin.continent || (EUROPE.has(origin.country) ? "Europa" : ""),
        destino: p.destination.city,
        destino_iata: p.destination.iata,
        destino_cc: p.destination.country,
        pais: p.destination.country_es,
        continente: p.destination.continent || "",
        precio: price,
        tipo: ret ? "ida y vuelta" : "solo ida",
        ida: dep,
        vuelta: ret,
        aerolinea: row.kiwi.carrier,
        escalas: best.outbound.stops,
        periodo: p.period,
        fuente_precio: srcPrice
      };
      // Solo publicamos chollos de verdad: al menos un 20 % por debajo del precio habitual de la ruta
      const ref = await routeRef(facts);
      if (!ref.med) throw new Error("sin precio habitual para comparar");
      if (price > ref.med * 0.8) throw new Error(`no es chollo: habitual ${Math.round(ref.med)} €, este ${price} €`);
      facts.precio_normal = Math.round(ref.med / 10) * 10;
      facts.ahorro_pct = Math.round((1 - price / facts.precio_normal) * 100);
      facts.ref_samples = ref.prices;
      if (facts.ahorro_pct < MIN_SAVE) throw new Error(`no llega al listón: −${facts.ahorro_pct} % (mínimo ${MIN_SAVE} %)`);
      // Nunca publicamos un destino sin foto
      const ph = await cityPhotoGeo(facts.destino, facts.destino_iata);
      if (!ph) throw new Error("sin foto fiable del destino");
      row.image_url = ph.url;
      row.image_credit = ph.credit;
      try {
        const dup = await db(`hlc_deals?select=id,kiwi_price,post&status=in.(approved,web_live,fb_posted)&post->facts->>origen_iata=eq.${encodeURIComponent(origin.iata)}&post->facts->>destino_iata=eq.${encodeURIComponent(p.destination.iata)}`);
        const cheaper = dup.filter((r)=>Number(r.post?.facts?.precio) <= price);
        if (cheaper.length) throw new Error(`ya publicado más barato (${cheaper[0].post?.facts?.precio} €)`);
        if (!dry) for (const r of dup)await db(`hlc_deals?id=eq.${r.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            status: "superseded"
          })
        });
      } catch (e) {
        if (String(e.message).startsWith("ya publicado")) throw e;
      }
      const post = await claude(WRITE, "Datos verificados hoy:\n" + JSON.stringify(facts), 1800);
      let guide = {};
      if (Date.now() - T0 < 60000) {
        try {
          guide = await makeGuide(p.destination.city, p.destination.country_es || "", p.destination.iata);
        } catch (e) {
          log.push("guide " + e.message);
        }
      }
      const slug = slugify(`${origin.city}-${p.destination.city}-${price}-euros-${dep}`);
      row.slug = slug;
      row.post = {
        ...post,
        ...guide,
        facts,
        cta_flight: bookingFlights(origin.iata, p.destination.iata, dep, ret),
        cta_hotel: bookingHotels(p.destination.city)
      };
      row.status = "approved";
      row.approved_at = new Date().toISOString();
      row.reason = `Kiwi ${best.price} € ≤ anunciado ${srcPrice} €`;
    } catch (e) {
      row.status = "rejected";
      row.reason = String(e.message || e).slice(0, 300);
    }
    results.push({
      title: it.title,
      status: row.status,
      reason: row.reason,
      slug: row.slug
    });
    if (!dry) {
      try {
        await db("hlc_deals", {
          method: "POST",
          body: JSON.stringify(row)
        });
      } catch (e) {
        log.push("insert " + e.message);
      }
    }
    seen.add(it.url);
  }
  if (!dry) {
    try {
      await db(`hlc_deals?status=in.(approved,web_live,fb_posted)&post->facts->>ida=lt.${today}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "expired"
        })
      });
    } catch (e) {
      log.push("expire " + e.message);
    }
  }
  return {
    processed,
    results,
    log,
    ms: Date.now() - T0
  };
}
const MIN_SAVE = 40; // % mínimo frente al precio habitual (Carlos, 11-nov-2026)
const FB_MAX_DAY = 8, FB_GAP_MIN = 100; // como mucho 8 posts al día, separados
function madridHour() {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", hour: "2-digit", hour12: false }).format(new Date()));
}
function fbText(msg, url) {
  // el enlace va arriba, a la vista sin pulsar «Ver más»
  const lines = String(msg || "").split("\n").map((l)=>l.trim()).filter((l)=>l && !/^mira las fechas y reserva/i.test(l) && !/^#happylowcost$/i.test(l) && !/^https?:\/\//i.test(l));
  const head = lines.shift() || "";
  return `${head}\n\u{1F449} Fechas y reserva: ${url}\n\n${lines.join("\n")}\n\n#HappyLowCost`.trim();
}
async function publishFb(dry) {
  const page = Deno.env.get("HLC_FB_PAGE_ID"), token = Deno.env.get("HLC_FB_PAGE_TOKEN");
  if (!page || !token) return {
    error: "faltan HLC_FB_PAGE_ID / HLC_FB_PAGE_TOKEN"
  };
  const h = madridHour();
  if (!dry && (h < 8 || h >= 23)) return { skip: "fuera de horario (8-23 h Madrid)" };
  const recent = await db(`hlc_deals?select=fb_posted_at&fb_posted_at=gt.${new Date(Date.now() - 864e5).toISOString()}&order=fb_posted_at.desc&limit=50`);
  if (!dry && recent.length >= FB_MAX_DAY) return { skip: `ya hay ${recent.length} posts en 24 h` };
  if (!dry && recent[0] && Date.now() - Date.parse(recent[0].fb_posted_at) < FB_GAP_MIN * 60e3) return { skip: "último post hace menos de " + FB_GAP_MIN + " min" };
  const today = new Date().toISOString().slice(0, 10);
  const rows = (await db(`hlc_deals?select=id,slug,post,approved_at,image_url&status=in.(approved,web_live)&fb_post_id=is.null&approved_at=gt.${new Date(Date.now() - 6 * 864e5).toISOString()}&order=approved_at.desc&limit=300`)).filter((r)=>{
    const f = r.post?.facts || {};
    if ((f.ahorro_pct || 0) < MIN_SAVE || !f.vuelta || (f.ida && f.ida <= today)) return false;
    const cc = r.post?.facts?.origen_cc;
    return !cc || ORIGIN_OK.has(cc) || [
      "MAD",
      "BCN",
      "AGP",
      "VLC",
      "SVQ",
      "BIO",
      "ALC",
      "PMI",
      "LPA",
      "TFN",
      "TFS"
    ].includes(r.post?.facts?.origen_iata);
  }).sort((a, b)=>(b.post.facts.ahorro_pct || 0) - (a.post.facts.ahorro_pct || 0)).slice(0, 5);
  const out = [];
  for (const r of rows){
    let url = `${SITE}/chollos/${r.slug}/`;
    let photo = false;
    const live = await fetch(url, {
      method: "GET",
      redirect: "follow"
    });
    if (live.status !== 200) {
      // la web estática se regenera cada pocas horas: si ya pasaron 30 min, publicamos como foto con enlace a la versión instantánea
      // sin ficha fija no se publica: se espera a que la web se regenere
      out.push({
        slug: r.slug,
        skip: "a\xFAn no est\xE1 en la web"
      });
      continue;
    }
    const tracked = `${url}?utm_source=facebook&utm_medium=social&utm_campaign=chollos`;
    if (!photo) await db(`hlc_deals?id=eq.${r.id}&status=eq.approved`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "web_live",
        web_live_at: new Date().toISOString()
      })
    });
    if (dry) {
      out.push({
        slug: r.slug,
        dry: true
      });
      continue;
    }
    const fr = photo ? await fetch(`https://graph.facebook.com/v21.0/${page}/photos`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        url: r.image_url,
        caption: fbText(r.post.fb_message, url),
        access_token: token
      })
    }) : await fetch(`https://graph.facebook.com/v21.0/${page}/feed`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        message: fbText(r.post.fb_message, url),
        link: tracked,
        access_token: token
      })
    });
    const fj = await fr.json();
    if (fj.id) {
      await db(`hlc_deals?id=eq.${r.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "fb_posted",
          fb_post_id: fj.id || fj.post_id,
          fb_posted_at: new Date().toISOString()
        })
      });
      out.push({
        slug: r.slug,
        fb: fj.id,
        photo
      });
    } else out.push({
      slug: r.slug,
      fb_error: fj.error?.message
    });
    break;
  }
  return {
    out
  };
}
async function feed(full) {
  const rows = await db(`hlc_deals?select=slug,post,image_url,image_credit,source_price,kiwi_price,approved_at,status&status=in.(approved,web_live,fb_posted)&order=approved_at.desc&limit=200`);
  return rows.map((r)=>({
      slug: r.slug,
      title: r.post?.title,
      excerpt: r.post?.excerpt,
      body_html: r.post?.body_html,
      tags: r.post?.tags,
      facts: r.post?.facts,
      cta_flight: r.post?.cta_flight,
      cta_hotel: r.post?.cta_hotel,
      image_url: r.image_url,
      image_credit: r.image_credit,
      price: r.post?.facts?.precio,
      approved_at: r.approved_at,
      seo_title: r.post?.seo_title || null,
      meta_description: r.post?.meta_description || null,
      guide_angle: r.post?.guide_angle || null,
      guide_html: full ? r.post?.guide_html || null : undefined,
      en: r.post?.en || null
    }));
}
async function alert(b, req) {
  const contact = String(b.contact || "").trim().slice(0, 120);
  const channel = b.channel === "whatsapp" ? "whatsapp" : "email";
  if (channel === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) return json({
    error: "Email no v\xE1lido"
  }, 400);
  if (channel === "whatsapp" && !/^\+?[0-9 ]{8,16}$/.test(contact)) return json({
    error: "N\xFAmero no v\xE1lido"
  }, 400);
  if (!b.consent) return json({
    error: "Falta el consentimiento"
  }, 400);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "";
  const recent = await db(`hlc_alerts?select=id&ip=eq.${encodeURIComponent(ip)}&created_at=gt.${new Date(Date.now() - 36e5).toISOString()}`);
  if (recent.length >= 5) return json({
    error: "Demasiadas altas seguidas"
  }, 429);
  const origins = (Array.isArray(b.origins) ? b.origins : []).map((s)=>String(s).slice(0, 40)).slice(0, 12);
  await db("hlc_alerts", {
    method: "POST",
    body: JSON.stringify({
      origins,
      destination: String(b.destination || "").slice(0, 80),
      max_price: Math.min(Number(b.max_price) || 0, 5e3) || null,
      channel,
      contact,
      consent: true,
      ip,
      ua: (req.headers.get("user-agent") || "").slice(0, 200)
    })
  });
  return json({
    ok: true
  });
}
const FN = `${SB_URL}/functions/v1/hlc-deals`;
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
async function sendAlerts(dry, testTo) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return { error: "falta RESEND_API_KEY" };
  const from = Deno.env.get("HLC_MAIL_FROM") || "Happy Low Cost <chollos@send.happylowcost.com>";
  const today = new Date().toISOString().slice(0, 10);
  const deals = (await db(`hlc_deals?select=slug,post,approved_at&status=in.(approved,web_live,fb_posted)&approved_at=gt.${new Date(Date.now() - 3 * 864e5).toISOString()}&order=approved_at.desc&limit=200`))
    .filter((r)=>{ const f = r.post?.facts || {}; return r.slug && f.vuelta && (f.ahorro_pct || 0) >= MIN_SAVE && f.ida > today; })
    .sort((a, b)=>(b.post.facts.ahorro_pct || 0) - (a.post.facts.ahorro_pct || 0));
  const post = async (to, r, id)=>{
    const unsub = `${FN}?action=unsub&id=${id}&k=${await unsubKey(id)}`;
    const m = alertEmail(r, unsub);
    const res = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject: m.subject, html: m.html, text: m.text, reply_to: "carlos@equinoxinvestmentgroup.com", headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } }) });
    return { ok: res.ok, status: res.status, body: res.ok ? "" : (await res.text()).slice(0, 200) };
  };
  if (testTo) return deals.length ? { test: await post(testTo, deals[0], 0), slug: deals[0].slug } : { error: "no hay chollos para la prueba" };
  if (!deals.length) return { deals: 0, sent: 0 };
  const subs = await db(`hlc_alerts?select=id,origins,destination,max_price,contact,last_sent_at,sent_slugs,confirmed,confirm_sent_at&channel=eq.email&active=not.is.false&limit=5000`);
  let sent = 0, confirms = 0; const out = [];
  for (const s of subs){
    // doble confirmación: hasta que la persona pulse el enlace, solo recibe (una vez) el email para confirmar
    if (!s.confirmed) {
      if (dry || s.confirm_sent_at || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(s.contact || "")) continue;
      const link = `${FN}?action=confirm&id=${s.id}&k=${await confirmKey(s.id)}`;
      const html = `<div style="font:16px/1.6 Arial,sans-serif;color:#14213D;max-width:520px"><p>Hola:</p><p>Alguien (seguramente tú) ha pedido avisos de chollos de vuelos de Happy Low Cost en este email.</p><p><a href="${link}" style="display:inline-block;background:#D63B1C;color:#fff;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:bold">Sí, quiero los avisos</a></p><p style="font-size:13px;color:#4A5468">Si no has sido tú, ignora este mensaje: no te escribiremos más.</p></div>`;
      const res = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({ from, to: [s.contact], subject: "Confirma tus avisos de chollos ✈️", html, text: `Confirma tus avisos de chollos de Happy Low Cost: ${link}\nSi no has sido tú, ignora este mensaje.` }) });
      if (res.ok) { confirms++; await db(`hlc_alerts?id=eq.${s.id}`, { method: "PATCH", body: JSON.stringify({ confirm_sent_at: new Date().toISOString() }) }); }
      continue;
    }
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
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") return new Response(null, {
    status: 204,
    headers: H
  });
  const u = new URL(req.url);
  try {
    if (req.method === "GET" && u.searchParams.get("action") === "dests") return json(await db(`hlc_dest_guides?select=slug,name,country,guide_html,seo_title,meta_description,updated_at,guide_html_en,seo_title_en,meta_description_en&guide_html=not.is.null`));
    if (u.searchParams.get("action") === "confirm") {
      const id = Number(u.searchParams.get("id")), k = u.searchParams.get("k") || "";
      const ok = id > 0 && k === await confirmKey(id);
      if (ok) await db(`hlc_alerts?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ confirmed: true, active: true }) });
      return Response.redirect(`${SITE}/alertas/?confirmada=${ok ? "ok" : "error"}`, 302);
    }
    if (u.searchParams.get("action") === "unsub") {
      const id = Number(u.searchParams.get("id")), k = u.searchParams.get("k") || "";
      const ok = id > 0 && k === await unsubKey(id);
      if (ok) await db(`hlc_alerts?id=eq.${id}`, { method: "PATCH", body: JSON.stringify({ active: false }) });
      if (req.method === "POST") return json({ ok });
      return Response.redirect(`${SITE}/alertas/?baja=${ok ? "ok" : "error"}`, 302);
    }
    if (req.method === "GET" && u.searchParams.get("action") === "feed") return json(await feed(u.searchParams.get("full") === "1"));
    const b = await req.json().catch(()=>({}));
    if (b.action === "alert") return await alert(b, req);
    const secret = Deno.env.get("HLC_CRON_SECRET");
    if (!secret || req.headers.get("x-hlc-secret") !== secret) return json({
      error: "forbidden"
    }, 403);
    if (b.action === "run") return json(await run(!!b.dry));
    if (b.action === "dest_seed") {
      const it = (b.items || []).map((x)=>({
          slug: String(x.slug),
          name: String(x.name),
          country: String(x.country || "")
        }));
      await db("hlc_dest_guides?on_conflict=slug", {
        method: "POST",
        headers: {
          prefer: "resolution=ignore-duplicates,return=minimal"
        },
        body: JSON.stringify(it)
      });
      return json({
        ok: it.length
      });
    }
    if (b.action === "dest_guides") return json(await destGuides(Math.min(Number(b.n) || 2, 3)));
    if (b.action === "backfill_guides") return json(await backfillGuides(Math.min(Number(b.n) || 2, 4)));
    if (b.action === "photo_backfill") return json(await photoBackfill(Math.min(Number(b.n) || 10, 30)));
    if (b.action === "price_ref") return json(await priceRef(Math.min(Number(b.n) || 3, 6)));
    if (b.action === "translate_en") return json(await translateEn(Math.min(Number(b.n) || 3, 5)));
    if (b.action === "dest_guides_en") return json(await destGuidesEn(Math.min(Number(b.n) || 2, 3)));
    if (b.action === "publish_fb") return json(await publishFb(!!b.dry));
    if (b.action === "send_alerts") return json(await sendAlerts(!!b.dry, b.test_to ? String(b.test_to) : ""));
    return json({
      error: "unknown action"
    }, 400);
  } catch (e) {
    return json({
      error: e.message
    }, 500);
  }
});