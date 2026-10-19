"use strict";
/* Persohna · demo local v2 — 1 utilidades/idioma · 2 datos · 3 estado · 4 componentes */

// ---------- 1. Utilidades e idioma ----------
const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function md(t) {
  return esc(t || "")
    .replace(/^#{1,4}\s*(.+)$/gm, "<strong>$1</strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^\s*[-*•]\s+/gm, "• ");
}
const stepAction = (g, i) => (!g.plan && g.cat === "trabajo" && i === 1) ? "cv" : "";
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);
const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const buzz = () => { try { if (!reduceMotion()) navigator.vibrate?.(8); } catch {} };

const LANG_KEY = "persohna.lang";
function detectLang() {
  const q = new URLSearchParams(location.search).get("lang");
  if (q === "es" || q === "en") return q;
  try { const s = localStorage.getItem(LANG_KEY); if (s === "es" || s === "en") return s; } catch {}
  return (navigator.language || "es").toLowerCase().startsWith("es") ? "es" : "en";
}
let LANG = detectLang();
document.documentElement.lang = LANG;
const T = (es, en) => (LANG === "en" ? en : es);
const L = (v) => (v && typeof v === "object" && !Array.isArray(v) ? (v[LANG] ?? v.es) : v);
function setLang(l) {
  LANG = l; document.documentElement.lang = l;
  try { localStorage.setItem(LANG_KEY, l); } catch {}
  document.title = T("Persohna · Tu yo digital que trabaja por ti", "Persohna · Your digital self that works for you");
}
const fmtMoney = (n) => (n === "" || n == null || isNaN(+n)) ? "" : LANG === "en" ? "€" + new Intl.NumberFormat("en-GB").format(+n) : new Intl.NumberFormat("es-ES").format(+n) + " €";
const fmtDate = (d) => { try { return new Date(d).toLocaleDateString(LANG === "en" ? "en-GB" : "es-ES", { day: "numeric", month: "short" }); } catch { return d; } };
function ago(d) {
  const days = Math.round((new Date(today()) - new Date(d)) / 864e5);
  if (isNaN(days)) return "";
  if (days <= 0) return T("Hoy", "Today");
  if (days === 1) return T("Ayer", "Yesterday");
  if (days < 7) return T(`Hace ${days} días`, `${days} days ago`);
  if (days < 14) return T("Hace 1 semana", "1 week ago");
  return T(`Hace ${Math.floor(days / 7)} semanas`, `${Math.floor(days / 7)} weeks ago`);
}
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };

const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  face: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5c1 1.2 2.1 1.8 3.5 1.8s2.5-.6 3.5-1.8"/><circle cx="9" cy="10" r=".6" fill="currentColor"/><circle cx="15" cy="10" r=".6" fill="currentColor"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  bookmark: '<path class="ico-fill" d="M6 4h12v17l-6-4-6 4z"/>',
  back: '<path d="M15 5 8 12l7 7"/>', close: '<path d="M6 6l12 12M18 6 6 18"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7"/>', chev: '<path d="m9 5 7 7-7 7"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', send: '<path d="M4 12 20 4l-5 16-3-7z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/>',
  star: '<path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z"/>',
  vivienda: '<path d="M4 11 12 4l8 7v9H4z"/><path d="M10 20v-5h4v5"/>',
  viajes: '<path d="M3 13l18-7-5 15-4-6z"/><path d="m12 15 4-6"/>',
  trabajo: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 12h18"/>',
  aprender: '<path d="M3 8l9-4 9 4-9 4z"/><path d="M7 10v5c1.5 1.3 3.2 2 5 2s3.5-.7 5-2v-5"/>',
  ahorro: '<path d="M12 3v18M16.5 7.5c-.8-1.2-2.3-2-4.5-2-2.6 0-4 1.3-4 3s1.6 2.5 4 3 4.5 1.3 4.5 3.3-1.8 3.2-4.5 3.2c-2.3 0-4-.9-4.8-2.3"/>',
  eventos: '<path d="M4 8a2 2 0 0 0 0 4v4h16v-4a2 2 0 0 1 0-4V4H4z" transform="translate(0 2)"/><path d="M14 6v12" stroke-dasharray="2 2.5"/>',
  otro: '<path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  sparkle: '<path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.5 6.5l2.5 2.5M15 15l2.5 2.5M6.5 17.5 9 15M15 9l2.5-2.5"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
  share: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.5-5.5 6.5-5.5s5.5 2 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.6c2.6.2 4.3 2 5 4.9"/>',
  fire: '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6 0-3.7 3.2-5.6 3.5-9.5 2.4 1.5 3.6 3.6 3.5 5.8 1-.6 1.7-1.7 1.9-3 2.4 2 4.1 4.3 4.1 6.7 0 3.4-2.6 6-6.5 6z"/>',
  shuffle: '<path d="M3 7h3.5c4.5 0 6.5 10 11 10H21M3 17h3.5c1.7 0 3-1.4 4.2-3.2M14 10.2C15.2 8.4 16.5 7 18.5 7H21"/><path d="m18 4 3 3-3 3M18 14l3 3-3 3"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  shield: '<path d="M12 3 5 6v5c0 4.5 3 8.4 7 10 4-1.6 7-5.5 7-10V6z"/><path d="m9 12 2 2 4-4"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', q: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7M12 17v.5"/>',
};
const ico = (n, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ""}</svg>`;

// ---------- 2. Datos de demo ----------
const FACE_IDS = Array.from({ length: 36 }, (_, i) => "f" + String(i + 1).padStart(2, "0"));
const LEGACY = ["alex", "nora", "leo", "carmen", "eva", "bruno"];
const faceSrc = (id) => (LEGACY.includes(id) ? `/avatars/${id}.webp` : `/faces/${id}.webp`);
const randomFace = () => FACE_IDS[Math.floor(Math.random() * FACE_IDS.length)];
const FRAMES = [
  { id: "none", label: { es: "Sin marco", en: "No frame" }, lvl: 0 },
  { id: "fino", label: { es: "Fino", en: "Thin" }, lvl: 0 },
  { id: "doble", label: { es: "Doble", en: "Double" }, lvl: 2 },
  { id: "bosque", label: { es: "Bosque", en: "Forest" }, lvl: 4 },
];
// Personas y cifras de ejemplo, no actividad real
const PEOPLE = {
  nora: { name: "Nora", face: "nora", level: 12, bio: { es: "Busco sitios tranquilos para vivir y trabajar.", en: "Looking for quiet places to live and work." } },
  leo: { name: "Leo", face: "leo", level: 7, bio: { es: "Viajo mucho y comparto cómo lo consigo barato.", en: "I travel a lot and share how I do it cheaply." } },
  carmen: { name: "Carmen", face: "carmen", level: 9, bio: { es: "Cambié de sector a los 52. Se puede.", en: "Switched careers at 52. It can be done." } },
  eva: { name: "Eva", face: "eva", level: 5, bio: { es: "Estudio Ingeniería. Comparto lo que me sirve.", en: "Engineering student. I share what helps me." } },
  bruno: { name: "Bruno", face: "bruno", level: 4, bio: { es: "Obsesionado con pagar menos por lo mismo.", en: "Obsessed with paying less for the same thing." } },
  lucia: { name: "Lucía", face: "f07", level: 6, bio: { es: "Voy a todos los conciertos que puedo.", en: "I go to every gig I can." } },
  dani: { name: "Dani", face: "f02", level: 3, bio: { es: "Primer trabajo en tech, aprendiendo rápido.", en: "First tech job, learning fast." } },
};

const CATS = {
  trabajo: {
    label: { es: "Trabajo", en: "Work" }, verb: { es: "Conseguir entrevistas", en: "Land interviews" },
    pitch: { es: "Mejor trabajo, entrevistas mientras duermes", en: "Better job, interviews while you sleep" },
    fields: [
      { k: "puesto", label: { es: "¿Qué puesto buscas?", en: "What role are you after?" }, type: "text", ph: { es: "Ej.: Product marketing", en: "E.g. Product marketing" }, req: true, step: 1 },
      { k: "salario", label: { es: "Salario mínimo anual (opcional)", en: "Minimum yearly salary (optional)" }, type: "number", unit: "€", ph: { es: "Ej.: 40.000", en: "E.g. 40,000" }, step: 1 },
      { k: "modo", label: { es: "Modalidad", en: "Work mode" }, type: "chips", opts: [{ es: "Remoto", en: "Remote" }, { es: "Híbrido", en: "Hybrid" }, { es: "Presencial", en: "On-site" }], step: 2 },
      { k: "practicar", label: { es: "¿Qué quieres practicar?", en: "What do you want to practise?" }, type: "chips", opts: [{ es: "Presentarme en 2 minutos", en: "2-minute intro" }, { es: "Preguntas de comportamiento", en: "Behavioural questions" }, { es: "Negociar salario", en: "Salary negotiation" }], step: 2 },
    ],
    title: (p) => T(`Entrevistas para ${p.puesto || "…"}`, `Interviews for ${p.puesto || "…"}`),
    plan: { es: ["Define el puesto y el salario mínimo", "Pega tu CV o tu LinkedIn", "Elige 3 empresas que te interesen", "Marca tu disponibilidad para entrevistas", "Practica tu presentación de 2 minutos"], en: ["Set the role and minimum salary", "Paste your CV or LinkedIn", "Pick 3 companies you like", "Mark your interview availability", "Practise your 2-minute intro"] },
  },
  vivienda: {
    label: { es: "Casa", en: "Home" }, verb: { es: "Casa más barata", en: "A cheaper home" },
    pitch: { es: "Alquilar o comprar más barato: negocia por ti", en: "Rent or buy for less: it negotiates for you" },
    fields: [
      { k: "op", label: { es: "¿Alquilar o comprar?", en: "Rent or buy?" }, type: "select", opts: [{ es: "Alquilar", en: "Rent" }, { es: "Comprar", en: "Buy" }], req: true, step: 1 },
      { k: "zona", label: { es: "¿Dónde?", en: "Where?" }, type: "text", ph: { es: "Ej.: Sevilla, cerca de la playa…", en: "E.g. Lisbon, near the beach…" }, req: true, step: 1 },
      { k: "presupuesto", label: { es: "Presupuesto máximo", en: "Maximum budget" }, type: "number", unit: "€", ph: { es: "Ej.: 900 al mes o 100.000", en: "E.g. 900 a month or 100,000" }, step: 1 },
      { k: "esencial", label: { es: "¿Qué es imprescindible?", en: "Must-haves" }, type: "chips", opts: [{ es: "Terraza o patio", en: "Terrace or patio" }, { es: "2+ dormitorios", en: "2+ bedrooms" }, { es: "Cerca del transporte", en: "Near transport" }, { es: "Admite mascotas", en: "Pets allowed" }], step: 2 },
    ],
    title: (p) => T(`${p.op === "Comprar" || p.op === "Buy" ? "Comprar" : "Alquilar"} en ${p.zona || "…"}${p.presupuesto ? " · hasta " + fmtMoney(p.presupuesto) : ""}`, `${p.op === "Comprar" || p.op === "Buy" ? "Buy" : "Rent"} in ${p.zona || "…"}${p.presupuesto ? " · up to " + fmtMoney(p.presupuesto) : ""}`),
    plan: { es: ["Fija zona y presupuesto", "Marca lo imprescindible", "Activa el aviso de bajadas de precio", "Visita también de noche", "Prepara tu contraoferta"], en: ["Set area and budget", "Mark your must-haves", "Turn on price-drop alerts", "Visit at night too", "Prepare your counter-offer"] },
  },
  eventos: {
    label: { es: "Entradas", en: "Tickets" }, verb: { es: "Entradas más baratas", en: "Cheaper tickets" },
    pitch: { es: "Tu artista favorito por mucho menos", en: "Your favourite artist for much less" },
    fields: [
      { k: "artista", label: { es: "¿Qué artista o evento?", en: "Which artist or event?" }, type: "text", ph: { es: "Ej.: Rosalía, Mad Cool…", en: "E.g. Taylor Swift, Glastonbury…" }, req: true, step: 1 },
      { k: "ciudad", label: { es: "Ciudad (opcional)", en: "City (optional)" }, type: "text", ph: { es: "Ej.: Madrid", en: "E.g. London" }, step: 1 },
      { k: "max", label: { es: "Máximo por entrada (opcional)", en: "Max per ticket (optional)" }, type: "number", unit: "€", ph: { es: "Ej.: 60", en: "E.g. 60" }, step: 2 },
      { k: "cuantas", label: { es: "¿Cuántas entradas?", en: "How many tickets?" }, type: "select", opts: [{ es: "1", en: "1" }, { es: "2", en: "2" }, { es: "3 o más", en: "3 or more" }], step: 2 },
    ],
    title: (p) => T(`Entradas para ${p.artista || "…"}`, `Tickets for ${p.artista || "…"}`),
    plan: { es: ["Artista, ciudad y fechas", "Precio máximo por entrada", "Solo reventa oficial y vendedores verificados", "Activa el aviso de bajada de precio", "Compra cuando te avise"], en: ["Artist, city and dates", "Max price per ticket", "Only official resale and verified sellers", "Turn on the price-drop alert", "Buy when it pings you"] },
  },
  ahorro: {
    label: { es: "Facturas", en: "Bills" }, verb: { es: "Pagar menos cada mes", en: "Pay less every month" },
    pitch: { es: "Luz, móvil y seguros más baratos", en: "Cheaper power, phone and insurance" },
    fields: [
      { k: "gasto", label: { es: "¿En qué quieres pagar menos?", en: "What do you want to pay less for?" }, type: "select", opts: [{ es: "Luz", en: "Electricity" }, { es: "Gas", en: "Gas" }, { es: "Móvil e internet", en: "Phone & internet" }, { es: "Seguros", en: "Insurance" }], req: true, step: 1 },
      { k: "importe", label: { es: "¿Cuánto pagas al mes?", en: "How much do you pay a month?" }, type: "number", unit: "€", ph: { es: "Ej.: 75", en: "E.g. 75" }, step: 1 },
      { k: "condiciones", label: { es: "Condiciones", en: "Conditions" }, type: "chips", opts: [{ es: "Sin permanencia", en: "No lock-in" }, { es: "Precio fijo", en: "Fixed price" }, { es: "Energía renovable", en: "Renewable energy" }], step: 2 },
    ],
    title: (p) => T(`Pagar menos de ${(p.gasto || "…").toLowerCase()}`, `Pay less for ${(p.gasto || "…").toLowerCase()}`),
    plan: { es: ["Indica cuánto pagas", "Ten a mano tu última factura", "Compara con tu consumo real, no con el anuncio", "Revisa permanencias", "Haz el cambio"], en: ["Enter what you pay", "Have your last bill to hand", "Compare with real usage, not the ad", "Check lock-in periods", "Make the switch"] },
  },
  viajes: {
    label: { es: "Viajes", en: "Travel" }, verb: { es: "Viajar más barato", en: "Travel for less" },
    pitch: { es: "Vuelos y hoteles cuando bajan", en: "Flights and hotels when prices drop" },
    fields: [
      { k: "destino", label: { es: "¿A dónde?", en: "Where to?" }, type: "text", ph: { es: "Ej.: Bali, playa en invierno…", en: "E.g. Bali, winter sun…" }, req: true, step: 1 },
      { k: "fechas", label: { es: "Fechas o duración (opcional)", en: "Dates or length (optional)" }, type: "text", ph: { es: "Ej.: noviembre, 10 días", en: "E.g. November, 10 days" }, step: 1 },
      { k: "presupuesto", label: { es: "Presupuesto (opcional)", en: "Budget (optional)" }, type: "number", unit: "€", ph: { es: "Ej.: 600", en: "E.g. 600" }, step: 2 },
    ],
    title: (p) => T(`Viaje a ${p.destino || "…"}`, `Trip to ${p.destino || "…"}`),
    plan: { es: ["Destino y fechas", "Flexibilidad de ±3 días", "Presupuesto máximo", "Activa el aviso de precio", "Reserva cuando baje"], en: ["Destination and dates", "±3 days of flexibility", "Maximum budget", "Turn on the price alert", "Book when it drops"] },
  },
  aprender: {
    label: { es: "Aprender", en: "Learn" }, verb: { es: "Aprobar o aprender", en: "Pass or learn" },
    pitch: { es: "Aprobar con lo que funcionó a otros", en: "Pass with what worked for others" },
    fields: [
      { k: "materia", label: { es: "¿Qué quieres aprender o aprobar?", en: "What do you want to learn or pass?" }, type: "text", ph: { es: "Ej.: Cálculo II, inglés B2…", en: "E.g. Calculus II, Spanish B2…" }, req: true, step: 1 },
      { k: "fecha", label: { es: "Fecha del examen (opcional)", en: "Exam date (optional)" }, type: "date", step: 2 },
    ],
    title: (p) => T(`Preparar ${p.materia || "…"}`, `Prepare ${p.materia || "…"}`),
    plan: { es: ["Materia y fecha", "Reúne exámenes antiguos compartidos", "Ordena los temas por frecuencia", "Estudia primero lo que más se repite", "Simulacro la semana antes"], en: ["Subject and date", "Gather shared past papers", "Sort topics by frequency", "Study the most repeated first", "Mock exam the week before"] },
  },
};
// Categorías ligeras: un dato esencial + plan genérico
const LIGHT = [
  ["dinero", "Ahorro", "Savings", "Ahorrar o invertir mejor", "Save or invest better", "Que tu dinero rinda más", "Make your money work harder", "Ej.: ahorrar 3.000 € este año", "E.g. save €3,000 this year"],
  ["salud", "Salud", "Health", "Cuidar mi salud", "Look after my health", "Médicos, citas y seguros sin esperas", "Doctors, appointments and cover without the wait", "Ej.: dermatólogo sin lista de espera", "E.g. a dermatologist without a waiting list"],
  ["ejercicio", "Ejercicio", "Fitness", "Ponerme en forma", "Get fit", "Gimnasio, clases y rutinas a tu medida", "Gyms, classes and routines that fit you", "Ej.: gimnasio barato cerca de casa", "E.g. a cheap gym near home"],
  ["comida", "Comida", "Food", "Comer mejor", "Eat better", "Recetas, menús y sitios que valen la pena", "Recipes, menus and places worth it", "Ej.: menú semanal sano por 40 €", "E.g. a healthy weekly menu for €40"],
  ["compras", "Compras", "Shopping", "Comprar más barato", "Shop for less", "El chollo justo, en el momento justo", "The right deal at the right time", "Ej.: lavadora buena por menos de 300 €", "E.g. a good washing machine under €300"],
  ["transporte", "Transporte", "Transport", "Coche o transporte", "Car or transport", "Coche, seguro y abonos al mejor precio", "Car, insurance and passes at the best price", "Ej.: coche eléctrico de segunda mano", "E.g. a second-hand electric car"],
  ["familia", "Familia", "Family", "Algo para mi familia", "Something for my family", "Colegios, planes y ayudas para los tuyos", "Schools, plans and support for your people", "Ej.: campamento de verano para mi hijo", "E.g. a summer camp for my kid"],
  ["mascotas", "Mascotas", "Pets", "Cuidar a mi mascota", "Look after my pet", "Veterinario, cuidadores y seguros", "Vets, sitters and insurance", "Ej.: cuidador de perros para agosto", "E.g. a dog sitter for August"],
  ["tramites", "Trámites", "Paperwork", "Resolver un trámite", "Sort out paperwork", "Papeles, citas y ayudas sin perder el día", "Forms, appointments and grants without losing a day", "Ej.: renovar el pasaporte rápido", "E.g. renew my passport fast"],
  ["organizacion", "Organización", "Organisation", "Organizarme mejor", "Get organised", "Agenda, recordatorios y tiempo libre", "Calendar, reminders and free time", "Ej.: tener los viernes libres", "E.g. keep Fridays free"],
  ["negocio", "Negocio", "Business", "Hacer crecer mi negocio", "Grow my business", "Clientes, proveedores y ayudas", "Customers, suppliers and grants", "Ej.: 10 clientes nuevos para mi tienda", "E.g. 10 new customers for my shop"],
  ["creatividad", "Creatividad", "Creativity", "Crear algo", "Make something", "Cursos, materiales y gente con quien crear", "Courses, supplies and people to create with", "Ej.: aprender acuarela los fines de semana", "E.g. learn watercolour at weekends"],
  ["bienestar", "Bienestar", "Wellbeing", "Vivir con más calma", "Live more calmly", "Descanso, terapias y escapadas", "Rest, therapies and getaways", "Ej.: un retiro de fin de semana", "E.g. a weekend retreat"],
  ["comunidad", "Comunidad", "Community", "Conocer gente", "Meet people", "Planes, grupos y voluntariado cerca", "Plans, groups and volunteering nearby", "Ej.: grupo para correr los domingos", "E.g. a Sunday running group"],
];
LIGHT.forEach(([k, les, len, ves, ven, pes, pen, phes, phen]) => {
  CATS[k] = {
    label: { es: les, en: len }, verb: { es: ves, en: ven }, pitch: { es: pes, en: pen }, light: true,
    fields: [
      { k: "que", label: { es: "¿Qué quieres conseguir exactamente?", en: "What exactly do you want?" }, type: "text", ph: { es: phes, en: phen }, req: true, step: 1 },
      { k: "presupuesto", label: { es: "Presupuesto (opcional)", en: "Budget (optional)" }, type: "number", unit: "€", ph: { es: "Ej.: 200", en: "E.g. 200" }, step: 2 },
      { k: "cuando", label: { es: "¿Para cuándo? (opcional)", en: "By when? (optional)" }, type: "text", ph: { es: "Ej.: antes de verano", en: "E.g. before summer" }, step: 2 },
    ],
    title: (p) => p.que || T(ves, ven),
    plan: { es: ["Define qué quieres y para cuándo", "Fija tu presupuesto", "Mira qué les funcionó a otros", "Pregunta a la comunidad lo que no está en internet", "Decide y márcalo como conseguido"], en: ["Define what you want and by when", "Set your budget", "See what worked for others", "Ask the community what isn't online", "Decide and mark it achieved"] },
  };
});
const CAT_ORDER = ["trabajo", "vivienda", "eventos", "ahorro", "viajes", "aprender"];
const CAT_MORE = LIGHT.map((x) => x[0]);
const CAT_ALL = [...CAT_ORDER, ...CAT_MORE];
const ICON_OF = { otro: "comunidad" };
const iconSrc = (k) => `/icons/${ICON_OF[k] || k}.webp`;

const SEED_POSTS = [
  { id: "p3", who: "carmen", cat: "trabajo", at: daysAgo(5), kind: "personal",
    title: { es: "Mi Persohna me dejó 3 entrevistas agendadas mientras dormía.", en: "My Persohna lined up 3 interviews while I slept." },
    sample: { es: ["Product marketing · empresa de pagos", "Growth lead · startup de viajes", "Marketing manager · cadena de tiendas"], en: ["Product marketing · payments company", "Growth lead · travel startup", "Marketing manager · retail chain"] },
    context: { es: "Tenía el CV actualizado y le pedí adaptar la carta a cada oferta.", en: "My CV was up to date and I asked it to tailor the letter to each job." },
    detail: { es: "Le di tres empresas que me interesaban y mi disponibilidad. Preparó una carta distinta para cada una y me propuso horarios. Yo solo confirmé.", en: "I gave it three companies I liked and my availability. It wrote a different letter for each and proposed times. I just confirmed." },
    prefill: { puesto: "Product marketing" } },
  { id: "p1", who: "nora", cat: "vivienda", at: daysAgo(3), kind: "personal",
    title: { es: "Encontré casa en Sevilla por 83.000 €.", en: "Found a house in Seville for €83,000." },
    sample: { es: ["Piso de 2 dormitorios con patio · 83.000 €", "Casa adosada de 3 dormitorios · 96.000 €", "Ático de 1 dormitorio con terraza · 79.000 €"], en: ["2-bed flat with patio · €83,000", "3-bed terraced house · €96,000", "1-bed penthouse with terrace · €79,000"] },
    context: { es: "Presupuesto de 100.000 €, quería patio y estar a menos de 25 minutos del centro.", en: "€100k budget, wanted a patio and under 25 minutes from the centre." },
    detail: { es: "Lo que más me ayudó fue buscar fuera del centro y decirle a mi Persohna que el patio era imprescindible. Dos de las tres opciones las publicaban particulares.", en: "What helped most was looking outside the centre and telling my Persohna the patio was a must. Two of the three were private sellers." },
    validity: { es: "Precios vistos este mes. Pueden haber cambiado.", en: "Prices seen this month. They may have changed." }, prefill: { op: "Comprar", zona: "Sevilla", presupuesto: "100000" } },
  { id: "p7", who: "lucia", cat: "eventos", at: daysAgo(2), kind: "personal",
    title: { es: "Dos entradas de pista por 48 € menos que el día anterior.", en: "Two standing tickets for €48 less than the day before." },
    sample: { es: ["Reventa oficial, no webs dudosas", "El precio bajó 3 días antes del concierto", "Compra en 2 minutos tras el aviso"], en: ["Official resale, no dodgy sites", "Price dropped 3 days before the gig", "Bought 2 minutes after the alert"] },
    context: { es: "Concierto en Madrid, precio máximo 70 € por entrada.", en: "Gig in Madrid, max €70 per ticket." },
    detail: { es: "Muchos venden cuando ven que no pueden ir. Si fijas tu precio máximo y esperas, suele bajar. Nunca compres fuera de la reventa oficial.", en: "Lots of people sell when they realise they can't go. Set your max price and wait — it often drops. Never buy outside official resale." },
    validity: { es: "Visto este mes.", en: "Seen this month." }, prefill: { artista: "", ciudad: "Madrid", max: "70", cuantas: "2" } },
  { id: "p5", who: "bruno", cat: "ahorro", at: daysAgo(1), kind: "confirmed", commercial: true,
    title: { es: "Bajé mi factura de luz 31 € al mes.", en: "Cut my electricity bill by €31 a month." },
    sample: { es: ["Antes: 92 €/mes con permanencia", "Ahora: 61 €/mes, sin permanencia", "Cambio hecho en 10 minutos"], en: ["Before: €92/month, locked in", "Now: €61/month, no lock-in", "Switched in 10 minutes"] },
    context: { es: "Piso de 70 m², dos personas, sin calefacción eléctrica.", en: "70 m² flat, two people, no electric heating." },
    detail: { es: "Comparé con la factura real de los últimos 12 meses, no con el precio de anuncio. La compañía nueva me da una comisión si alguien se cambia con mi enlace; por eso lo indico.", en: "I compared against my real bills from the last 12 months, not the advertised price. The new company pays me a commission if someone switches with my link, which is why I'm flagging it." },
    validity: { es: "Tarifas de este mes.", en: "This month's rates." }, prefill: { gasto: "Luz", importe: "90" } },
  { id: "p2", who: "leo", cat: "viajes", at: daysAgo(7), kind: "personal",
    title: { es: "Conseguí vuelo a Bali por 348 €.", en: "Got a flight to Bali for €348." },
    sample: { es: ["Ida y vuelta desde Madrid", "Una escala, salida en martes", "Fechas flexibles ± 3 días"], en: ["Return from Madrid", "One stop, Tuesday departure", "Flexible dates ± 3 days"] },
    context: { es: "Viajé solo, 12 días en noviembre, con mochila de cabina.", en: "Travelled solo, 12 days in November, cabin bag only." },
    detail: { es: "La clave fue no fijar el día exacto. Mi Persohna comparó la misma semana en varias combinaciones y el martes salía casi 200 € más barato.", en: "The key was not fixing the exact day. My Persohna compared the same week in several combinations and Tuesday was almost €200 cheaper." },
    validity: { es: "Precio de hace una semana. Los vuelos cambian a diario.", en: "Price from a week ago. Flights change daily." }, prefill: { destino: "Bali", fechas: "noviembre, 12 días" } },
  { id: "p6", who: "nora", cat: "vivienda", at: daysAgo(4), kind: "personal",
    title: { es: "Visité un piso precioso… con mucho ruido por la noche.", en: "Visited a lovely flat… very noisy at night." },
    sample: { es: ["Calle con bares hasta las 2:00", "Ventanas sin doble cristal", "De día no se nota nada"], en: ["Street with bars until 2 am", "No double glazing", "You can't tell during the day"] },
    context: { es: "Visita a las 21:00 de un viernes. Recomiendo ir también de noche.", en: "Visited at 9 pm on a Friday. Go at night too." },
    detail: { es: "El anuncio no lo mencionaba. Esto no lo sabe ninguna IA: solo quien ha ido. Si miras por la zona, pide visitar de noche.", en: "The listing didn't mention it. No AI knows this — only someone who went. If you're looking in the area, ask to visit at night." },
    validity: { es: "Visitado este mes.", en: "Visited this month." }, prefill: { op: "Alquilar", zona: "Sevilla" } },
  { id: "p4", who: "eva", cat: "aprender", at: daysAgo(14), kind: "personal",
    title: { es: "Reuní las preguntas de examen del mismo profesor de los últimos 10 años.", en: "Collected the same professor's exam questions from the last 10 years." },
    sample: { es: ["Derivadas e integrales: 8 de cada 10 años", "Series: siempre en la segunda parte", "El último ejercicio suele valer 3 puntos"], en: ["Derivatives & integrals: 8 years out of 10", "Series: always in part two", "The last exercise is usually worth 3 points"] },
    context: { es: "Usé exámenes antiguos que compartieron otros estudiantes, no material privado.", en: "Used past papers shared by other students, no private material." },
    detail: { es: "Ordenarlo por temas me ahorró semanas. Estudié primero lo que más se repetía y aprobé con un 8,2.", en: "Sorting by topic saved me weeks. I studied the most repeated topics first and passed with 8.2/10." },
    prefill: { materia: "Cálculo II" } },
  { id: "p8", who: "dani", cat: "trabajo", at: daysAgo(6), kind: "question",
    title: { es: "¿Alguien ha negociado salario en una startup de pagos? ¿Cuánto margen hay?", en: "Anyone negotiated salary at a payments startup? How much room is there?" },
    context: { es: "Me han ofrecido 38.000 € y no sé si pedir más.", en: "I've been offered €38k and don't know whether to ask for more." } },
];

// ---------- 3. Estado ----------
const KEY = "persohna.demo.v2";
const fresh = () => ({
  me: null, goals: [], saved: [], myPosts: [], marks: {}, proposals: [], reports: [],
  chat: [], history: [], inbox: [], xp: 0, showLevel: true, autonomy: "ask",
  invites: 0, streak: { n: 0, last: "" }, recent: [], ref: "",
});
let storageOK = true;
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return Object.assign(fresh(), JSON.parse(raw));
    const old = localStorage.getItem("persohna.demo.v1");
    if (old) { const o = JSON.parse(old); const s = Object.assign(fresh(), { me: o.me, goals: o.goals || [], saved: o.saved || [], myPosts: o.myPosts || [], xp: o.xp || 0, history: o.history || [] }); return s; }
    return fresh();
  } catch { storageOK = false; return fresh(); }
}
let S = load();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { storageOK = false; } }
const ui = { route: "inicio", filter: "todo", q: "", seg: "objetivos", scroll: {}, onb: { step: 0, cat: null, data: {}, face: randomFace(), name: "", err: "" } };
{ const r = new URLSearchParams(location.search).get("ref"); if (r && !S.ref) { S.ref = r.slice(0, 24); save(); } }

const XP_PER = 50;
const level = () => Math.min(100, Math.floor(S.xp / XP_PER));
const xpInLevel = () => S.xp % XP_PER;
const allPosts = () => [...S.myPosts.map((p) => ({ ...p, who: "me" })), ...SEED_POSTS];
const findPost = (id) => allPosts().find((p) => p.id === id);
function person(who) {
  if (who === "me") return { name: S.me?.name || T("Tú", "You"), face: S.me?.face || "f01", frame: S.me?.frame, level: level(), me: true };
  return PEOPLE[who];
}
function addHistory(es, en) { S.history.unshift({ es, en, at: today() }); S.history = S.history.slice(0, 40); }
function notify(es, en, link = "") { S.inbox.unshift({ id: uid(), es, en, at: today(), read: false, link }); S.inbox = S.inbox.slice(0, 30); }
const unread = () => S.inbox.filter((n) => !n.read).length;
function touchStreak() {
  if (!S.me) return;
  const t = today(); if (S.streak.last === t) return;
  const y = daysAgo(1);
  S.streak.n = S.streak.last === y ? S.streak.n + 1 : 1; S.streak.last = t; save();
}
function goalStatus(g) {
  if (g.done) return "done";
  if (g.cat === "otro") return g.notes ? "ready" : "needs";
  const req = CATS[g.cat].fields.filter((f) => f.req);
  return req.every((f) => String(g.prefs?.[f.k] ?? "").trim()) ? "ready" : "needs";
}
function planOf(g) { return g.cat === "otro" ? [] : L(CATS[g.cat].plan); }
function planDone(g) {
  const steps = planOf(g); const d = g.steps || [];
  return steps.map((_, i) => i === 0 ? (goalStatus(g) !== "needs" || !!d[0]) : !!d[i]);
}
const STATUS = { needs: [{ es: "Falta concretar", en: "Needs details" }, "tag-needs"], ready: [{ es: "En marcha", en: "In progress" }, "tag-ready"], done: [{ es: "Conseguido", en: "Achieved" }, "tag-done"] };

// ---------- 4. Componentes ----------
function avatar(p, size = "sm", extra = "") {
  const frame = p.frame && p.frame !== "none" ? `frame-${p.frame}` : "";
  return `<span class="av-wrap ${frame}"><span class="av av-${size} ${extra}"><img class="av-face" src="${faceSrc(p.face)}" alt="" width="128" height="128" loading="lazy" decoding="async"></span></span>`;
}
function statusTag(st) { const [t, c] = STATUS[st]; return `<span class="tag ${c}">${st === "done" ? ico("check") : ""}${L(t)}</span>`; }
function catIcon(cat, size = "") { return `<span class="cat-ico ci ${size}"><img src="${iconSrc(cat)}" alt="" width="112" height="112" loading="lazy" decoding="async"></span>`; }
function lvlChip(p, button = false) {
  if (p.me && !S.showLevel) return "";
  const inner = `${ico("star")}${T("Nivel", "Level")} ${p.level}`;
  return button ? `<button class="lvl" type="button" data-action="open-level" aria-label="${T("Nivel", "Level")} ${p.level}. ${T("Ver qué significa", "See what it means")}">${inner}</button>` : `<span class="lvl">${inner}</span>`;
}
function postCard(p, opts = {}) {
  const who = person(p.who);
  const saved = S.saved.includes(p.id);
  const q = p.kind === "question";
  const sample = L(p.sample) || [];
  return `<article class="post${q ? " post-q" : ""}" data-post="${esc(p.id)}" aria-labelledby="pt-${esc(p.id)}">
    <div class="post-head">
      ${avatar(who, "sm")}
      <div class="grow">
        <div class="post-who">${esc(who.name)}${who.me ? ` <span class="muted small">(${T("tú", "you")})</span>` : ""}${!who.me && who.level ? ` <span class="muted small">· ${T("Nv.", "Lv.")} ${who.level}</span>` : ""}</div>
        <div class="post-meta">${esc(L(CATS[p.cat]?.label) || T("Otro", "Other"))} · ${esc(ago(p.at))}${p.kind === "confirmed" ? " · " + T("Información confirmada", "Verified info") : ""}</div>
      </div>
      ${q ? `<span class="tag tag-q">${T("Pregunta", "Question")}</span>` : ""}${p.commercial ? `<span class="tag tag-com" title="${T("Relación comercial", "Commercial relationship")}">${T("Comisión", "Commission")}</span>` : ""}
    </div>
    <button class="post-title" id="pt-${esc(p.id)}" type="button" data-action="open-post" data-id="${esc(p.id)}">${q ? "" : "«"}${esc(L(p.title))}${q ? "" : "»"}</button>
    ${sample.length ? `<div class="sample"><ul>${sample.slice(0, 3).map((s) => `<li>${esc(s)}</li>`).join("")}</ul></div>` : ""}
    ${p.context ? `<p class="ctx-line">${esc(L(p.context))}</p>` : ""}
    ${p.validity ? `<p class="post-meta">${esc(L(p.validity))}</p>` : ""}
    ${opts.noActions ? "" : `<div class="post-actions">
      ${q ? `<button class="btn btn-secondary btn-sm" type="button" data-action="propose" data-id="${esc(p.id)}">${ico("q")}${T("Yo lo sé", "I know this")}</button>`
        : `<button class="btn btn-primary btn-sm" type="button" data-action="adapt" data-id="${esc(p.id)}">${ico("sparkle")}${T("Mi Persohna también", "My Persohna too")}</button>`}
      <button class="icon-btn" type="button" data-action="share-post" data-id="${esc(p.id)}" aria-label="${T("Compartir enlace", "Share link")}">${ico("share")}</button>
      <button class="icon-btn" type="button" data-action="toggle-save" data-id="${esc(p.id)}" aria-pressed="${saved}" aria-label="${saved ? T("Quitar de guardados", "Remove from saved") : T("Guardar", "Save")}">${ico("bookmark")}</button>
    </div>`}
  </article>`;
}
function navItems() {
  return [["inicio", T("Inicio", "Home"), "home"], ["descubrir", T("Descubrir", "Discover"), "compass"], ["persohna", T("Mi Persohna", "My Persohna"), "face"], ["perfil", T("Perfil", "Profile"), "user"]];
}
function langBtn(cls = "") { return `<button class="lang-btn ${cls}" type="button" data-action="lang" aria-label="${T("Cambiar idioma a inglés", "Switch language to Spanish")}">${ico("globe")}<span>${LANG === "en" ? "EN" : "ES"}</span></button>`; }
function bellBtn() { const n = unread(); return `<button class="icon-btn bell" type="button" data-action="inbox" aria-label="${T("Avisos", "Updates")}${n ? ` (${n})` : ""}">${ico("bell")}${n ? `<span class="badge">${n > 9 ? "9+" : n}</span>` : ""}</button>`; }
function renderNav() {
  const cur = ui.route === "publico" ? "" : ui.route;
  const n = unread();
  $("#bottomnav").innerHTML = navItems().map(([r, l, i]) => `<a href="#/${r}" ${cur === r ? 'aria-current="page"' : ""}><span class="nav-ico">${ico(i)}</span>${l}</a>`).join("");
  $("#sidenav").innerHTML = navItems().map(([r, l, i]) => `<a href="#/${r}" ${cur === r ? 'aria-current="page"' : ""}>${ico(i)}${l}</a>`).join("") +
    `<a href="#" data-action="inbox">${ico("bell")}${T("Avisos", "Updates")}${n ? ` <span class="badge static">${n}</span>` : ""}</a>`;
  $("#top-actions").innerHTML = `${langBtn()}${bellBtn()}`;
  $("#side-foot").innerHTML = `${langBtn("side")}<button class="demo-pill" type="button" data-action="demo-info">${typeof loggedIn === "function" && loggedIn() ? T("Beta · guardado en tu cuenta", "Beta · saved to your account") : T("Beta · datos en tu dispositivo", "Beta · data on your device")}</button>`;
  if (S.me) $("#me-mini").innerHTML = `${avatar(person("me"), "sm")}<div class="grow"><div style="font-weight:700">${esc(S.me.name)}</div><div class="post-meta">${S.showLevel ? T("Nivel ", "Level ") + level() : T("Nivel oculto", "Level hidden")}</div></div>`;
}
