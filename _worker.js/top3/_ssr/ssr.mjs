//#region node_modules/.nitro/vite/services/ssr/index.js
var lastCapturedError;
var TTL_MS = 5e3;
function record(error) {
	lastCapturedError = {
		error,
		at: Date.now()
	};
}
var CAUSE_DEPTH_LIMIT = 5;
var DESCRIPTION_LENGTH_LIMIT = 8e3;
function describeError(error) {
	const parts = [];
	let current = error;
	for (let depth = 0; depth < CAUSE_DEPTH_LIMIT && current != null; depth++) {
		if (!(current instanceof Error)) {
			parts.push(typeof current === "string" ? current : safeStringify(current));
			break;
		}
		const label = depth === 0 ? "" : "caused by: ";
		const status = describeStatus(current);
		parts.push(`${label}${current.stack ?? `${current.name}: ${current.message}`}${status}`);
		current = current.cause;
	}
	return parts.join("\n").slice(0, DESCRIPTION_LENGTH_LIMIT);
}
function describeStatus(error) {
	const { status, statusCode } = error;
	const value = status ?? statusCode;
	return typeof value === "number" ? ` (status ${value})` : "";
}
function safeStringify(value) {
	try {
		return JSON.stringify(value) ?? String(value);
	} catch {
		return String(value);
	}
}
function isErrorLike(value) {
	return value instanceof Error;
}
var originalConsoleError = console.error.bind(console);
console.error = (...args) => {
	originalConsoleError(...args.map((arg) => {
		if (!isErrorLike(arg)) return arg;
		record(arg);
		return describeError(arg);
	}));
};
if (typeof globalThis.addEventListener === "function") {
	globalThis.addEventListener("error", (event) => record(event.error ?? event));
	globalThis.addEventListener("unhandledrejection", (event) => record(event.reason));
}
function consumeLastCapturedError() {
	if (!lastCapturedError) return void 0;
	if (Date.now() - lastCapturedError.at > TTL_MS) {
		lastCapturedError = void 0;
		return;
	}
	const { error } = lastCapturedError;
	lastCapturedError = void 0;
	return error;
}
function renderErrorPage() {
	return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
/** UI strings for server-rendered pages. Hotel names, reviews and guest quotes stay in their source language. */
var LANGS = [
	"en",
	"es",
	"de",
	"fr",
	"it",
	"pt",
	"da"
];
var en$1 = {
	htmlLang: "en",
	name: "English",
	home: "Home",
	search: "Search",
	allDest: "All destinations",
	how: "How we choose",
	lists: "Best-of lists",
	cat: {
		Budget: "Budget",
		"Best Value": "Best Value",
		Luxury: "Luxury",
		Upscale: "Upscale alternative"
	},
	tag: {
		Budget: "Spend thoughtfully",
		"Best Value": "The balanced pick",
		Luxury: "Make it exceptional"
	},
	ourPick: "Our pick",
	cityPhoto: "City photo · hotel photos on Booking.com",
	fromNav: "Direct flights from Denmark",
	fromTitle: (a) => `Direct flights from ${a}: the 3 best hotels in every destination | Top3Hotels`,
	fromH1: (a) => `Fly direct from ${a}`,
	fromLead: (a, n) => `${n} destinations with direct flights from ${a} Airport. For each one: one Budget, one Best Value and one Luxury hotel. Pick in 1 second.`,
	popular: "Popular destinations",
	homeH1: "Top 3 hotels in every city",
	title: (c) => `Best Hotels in ${c} (2026): Budget, Best Value & Luxury | Top3Hotels`,
	desc: (c, co, b, v, l) => `The 3 best hotels in ${c}, ${co}: ${b} (budget), ${v} (best value) and ${l} (luxury). Picked in 1 second.`,
	h1: (c) => `The 3 best hotels in ${c}`,
	lead: (n) => `One Budget, one Best Value, one Luxury${n ? `, chosen from ${n} hotels Booking.com returned for the same stay` : ""}. No endless list: pick your style and book.`,
	checkIn: "Check in",
	checkOut: "Check out",
	seeDates: "See the 3 for my dates",
	perNight: "/ night",
	refRate: "Reference rate",
	reviews: "reviews",
	location: "Location",
	checkPrice: "Check price & availability",
	compare: "Compare prices",
	map: "Map",
	why: (l) => `Why this ${l} pick`,
	guestsSay: "Guests say",
	checked: (d) => d <= 0 ? "Price checked today" : d === 1 ? "Price checked yesterday" : `Price checked ${d} days ago`,
	walk: (m, p) => `≈ ${m} min walk to ${p}`,
	km: (k, p) => `${k} km to ${p}`,
	compared: (c) => `${c} hotels compared`,
	cols: [
		"Pick",
		"Hotel",
		"Area",
		"Stars",
		"Guest score",
		"Ref. price / night"
	],
	faqTitle: (c) => `Questions about hotels in ${c}`,
	faq: {
		budget: (c) => `What is the best budget hotel in ${c}?`,
		value: (c) => `What is the best value hotel in ${c}?`,
		lux: (c) => `What is the best luxury hotel in ${c}?`,
		where: (c) => `Where should I stay in ${c}?`,
		live: "Are these hotel prices live?",
		whereA: (a) => `Our three picks are in ${a}. Open each hotel on the map to see the neighbourhood before you book.`,
		liveA: (d, ch) => `No. They are reference rates for ${d}, 2 adults and 1 room, checked on Booking.com ${ch}. The booking link shows the current rate for your dates.`
	},
	howTitle: "How we pick the three",
	howText: "Budget is the lowest eligible reference rate. Best Value balances price and guest score. Luxury prioritises five-star hotels; if none qualify, a four-star rated 8.5+ is labelled as an upscale alternative. Every pick shows its source, review count and when we checked it. This is a data-based shortlist, not a paid ranking.",
	near: (c) => `Near ${c}`,
	moreIn: (c) => `More in ${c}`,
	allIn: (c) => `All ${c} destinations →`,
	footer: "The best hotel in every city, picked in 1 second.",
	disclaimer: "Independent guide. Booking links may earn us a commission at no cost to you. Reference prices, not live quotes.",
	countryTitle: (c, n) => `Best Hotels in ${c}: ${n} Cities, 3 Picks Each | Top3Hotels`,
	countryH1: (c) => `The best hotels in ${c}`,
	countryLead: (n) => `${n} destinations. Three picks in each: Budget, Best Value and Luxury.`,
	destTitle: (n) => `All ${n} Destinations — Best Hotels by City | Top3Hotels`,
	destH1: (n) => `All ${n} destinations`,
	destLead: (n) => `Every city has exactly three hotels: Budget, Best Value and Luxury. ${n} countries.`,
	notFound: "We're not in that city yet",
	tags: {
		pool: "Pool",
		beach: "Beachfront",
		pets: "Pets allowed",
		family: "Family rooms",
		spa: "Spa",
		parking: "Free parking",
		breakfast: "Great breakfast",
		ac: "Air conditioning",
		gym: "Gym"
	},
	themes: {
		beach: {
			title: "Best beachfront hotels",
			h1: "The best beachfront hotels",
			lead: "Every hotel here is one of our three picks in its city and lists beachfront or private-beach access on Booking.com."
		},
		pool: {
			title: "Best hotels with a pool",
			h1: "The best hotels with a pool",
			lead: "Top-3 picks that list a swimming pool, sorted by guest score."
		},
		pets: {
			title: "Best pet-friendly hotels",
			h1: "The best pet-friendly hotels",
			lead: "Top-3 picks that accept pets, sorted by guest score. Always confirm fees with the hotel."
		},
		family: {
			title: "Best family hotels",
			h1: "The best hotels for families",
			lead: "Top-3 picks with family rooms, sorted by guest score."
		},
		spa: {
			title: "Best hotels with a spa",
			h1: "The best hotels with a spa",
			lead: "Top-3 picks with spa or wellness facilities, sorted by guest score."
		},
		budget: {
			title: "Best budget hotels",
			h1: "The best budget hotels",
			lead: "The Budget pick of every city, sorted by guest score and price."
		},
		luxury: {
			title: "Best luxury hotels",
			h1: "The best luxury hotels",
			lead: "The Luxury pick of every city, sorted by guest score."
		}
	},
	listsTitle: "Best-of hotel lists",
	listsLead: "Themed shortlists built from our three picks in every city.",
	photo: "Photo",
	mapHint: "The three picks and the city's best-known sights."
};
var T = {
	en: en$1,
	es: {
		...en$1,
		htmlLang: "es",
		name: "Español",
		home: "Inicio",
		search: "Buscar",
		allDest: "Todos los destinos",
		how: "Cómo elegimos",
		lists: "Listas",
		cat: {
			Budget: "Económico",
			"Best Value": "Mejor calidad-precio",
			Luxury: "Lujo",
			Upscale: "Alternativa superior"
		},
		tag: {
			Budget: "Gasta con cabeza",
			"Best Value": "El equilibrio perfecto",
			Luxury: "Date un capricho"
		},
		ourPick: "Nuestra elección",
		cityPhoto: "Foto de la ciudad · fotos del hotel en Booking.com",
		fromNav: "Vuelos directos desde Dinamarca",
		fromTitle: (a) => `Vuelos directos desde ${a}: los 3 mejores hoteles de cada destino | Top3Hotels`,
		fromH1: (a) => `Vuela directo desde ${a}`,
		fromLead: (a, n) => `${n} destinos con vuelo directo desde el aeropuerto de ${a}. En cada uno: un hotel económico, uno calidad-precio y uno de lujo. Elige en 1 segundo.`,
		popular: "Destinos populares",
		homeH1: "Los 3 mejores hoteles de cada ciudad",
		title: (c) => `Los 3 mejores hoteles de ${c} (2026): económico, calidad-precio y lujo | Top3Hotels`,
		desc: (c, co, b, v, l) => `Los 3 mejores hoteles de ${c}, ${co}: ${b} (económico), ${v} (calidad-precio) y ${l} (lujo). Elegidos en 1 segundo.`,
		h1: (c) => `Los 3 mejores hoteles de ${c}`,
		lead: (n) => `Uno económico, uno calidad-precio y uno de lujo${n ? `, elegidos entre ${n} hoteles de Booking.com para la misma estancia` : ""}. Sin listas infinitas: elige tu estilo y reserva.`,
		checkIn: "Entrada",
		checkOut: "Salida",
		seeDates: "Ver los 3 con mis fechas",
		perNight: "/ noche",
		refRate: "Precio de referencia",
		reviews: "opiniones",
		location: "Ubicación",
		checkPrice: "Ver precio y disponibilidad",
		compare: "Comparar precios",
		map: "Mapa",
		why: (l) => `Por qué este ${l}`,
		guestsSay: "Los huéspedes dicen",
		checked: (d) => d <= 0 ? "Precio revisado hoy" : d === 1 ? "Precio revisado ayer" : `Precio revisado hace ${d} días`,
		walk: (m, p) => `≈ ${m} min a pie de ${p}`,
		km: (k, p) => `a ${k} km de ${p}`,
		compared: (c) => `Hoteles de ${c} comparados`,
		cols: [
			"Categoría",
			"Hotel",
			"Zona",
			"Estrellas",
			"Nota",
			"Precio ref. / noche"
		],
		faqTitle: (c) => `Preguntas sobre hoteles en ${c}`,
		faq: {
			budget: (c) => `¿Cuál es el mejor hotel económico de ${c}?`,
			value: (c) => `¿Cuál es el hotel con mejor calidad-precio de ${c}?`,
			lux: (c) => `¿Cuál es el mejor hotel de lujo de ${c}?`,
			where: (c) => `¿Dónde alojarse en ${c}?`,
			live: "¿Los precios son en tiempo real?",
			whereA: (a) => `Nuestros tres hoteles están en ${a}. Ábrelos en el mapa para ver el barrio antes de reservar.`,
			liveA: (d, ch) => `No. Son precios de referencia para ${d}, 2 adultos y 1 habitación, revisados en Booking.com ${ch}. El enlace de reserva muestra el precio actual para tus fechas.`
		},
		howTitle: "Cómo elegimos los tres",
		howText: "El económico es la tarifa de referencia más baja que cumple los criterios. El de mejor calidad-precio equilibra precio y nota de los huéspedes. El de lujo prioriza hoteles de cinco estrellas; si ninguno cumple, un cuatro estrellas con 8,5 o más aparece como alternativa superior. Cada elección muestra su fuente, el número de opiniones y cuándo la revisamos. No es un ranking pagado.",
		near: (c) => `Cerca de ${c}`,
		moreIn: (c) => `Más en ${c}`,
		allIn: (c) => `Todos los destinos de ${c} →`,
		footer: "El mejor hotel de cada ciudad, elegido en 1 segundo.",
		disclaimer: "Guía independiente. Los enlaces de reserva pueden darnos una comisión sin coste para ti. Precios de referencia, no en tiempo real.",
		countryTitle: (c, n) => `Mejores hoteles de ${c}: ${n} ciudades, 3 opciones en cada una | Top3Hotels`,
		countryH1: (c) => `Los mejores hoteles de ${c}`,
		countryLead: (n) => `${n} destinos. Tres opciones en cada uno: económico, calidad-precio y lujo.`,
		destTitle: (n) => `Los ${n} destinos — Mejores hoteles por ciudad | Top3Hotels`,
		destH1: (n) => `Los ${n} destinos`,
		destLead: (n) => `Cada ciudad tiene exactamente tres hoteles: económico, calidad-precio y lujo. ${n} países.`,
		notFound: "Aún no tenemos esa ciudad",
		tags: {
			pool: "Piscina",
			beach: "Primera línea",
			pets: "Admite mascotas",
			family: "Habitaciones familiares",
			spa: "Spa",
			parking: "Parking gratis",
			breakfast: "Buen desayuno",
			ac: "Aire acondicionado",
			gym: "Gimnasio"
		},
		themes: {
			beach: {
				title: "Mejores hoteles en primera línea de playa",
				h1: "Los mejores hoteles en primera línea de playa",
				lead: "Cada hotel es uno de nuestros tres elegidos en su ciudad y tiene acceso a playa según Booking.com."
			},
			pool: {
				title: "Mejores hoteles con piscina",
				h1: "Los mejores hoteles con piscina",
				lead: "Nuestros elegidos con piscina, ordenados por nota."
			},
			pets: {
				title: "Mejores hoteles que admiten mascotas",
				h1: "Los mejores hoteles que admiten mascotas",
				lead: "Nuestros elegidos que aceptan mascotas. Confirma siempre los suplementos con el hotel."
			},
			family: {
				title: "Mejores hoteles para familias",
				h1: "Los mejores hoteles para familias",
				lead: "Nuestros elegidos con habitaciones familiares, ordenados por nota."
			},
			spa: {
				title: "Mejores hoteles con spa",
				h1: "Los mejores hoteles con spa",
				lead: "Nuestros elegidos con spa o zona wellness, ordenados por nota."
			},
			budget: {
				title: "Mejores hoteles económicos",
				h1: "Los mejores hoteles económicos",
				lead: "El económico de cada ciudad, ordenado por nota y precio."
			},
			luxury: {
				title: "Mejores hoteles de lujo",
				h1: "Los mejores hoteles de lujo",
				lead: "El de lujo de cada ciudad, ordenado por nota."
			}
		},
		listsTitle: "Listas de los mejores hoteles",
		listsLead: "Listas temáticas hechas con nuestros tres elegidos de cada ciudad.",
		photo: "Foto",
		mapHint: "Los tres hoteles y los lugares más conocidos de la ciudad."
	},
	de: {
		...en$1,
		htmlLang: "de",
		name: "Deutsch",
		home: "Start",
		search: "Suche",
		allDest: "Alle Reiseziele",
		how: "So wählen wir",
		lists: "Bestenlisten",
		cat: {
			Budget: "Günstig",
			"Best Value": "Bestes Preis-Leistungs-Verhältnis",
			Luxury: "Luxus",
			Upscale: "Gehobene Alternative"
		},
		tag: {
			Budget: "Clever sparen",
			"Best Value": "Die ausgewogene Wahl",
			Luxury: "Etwas Besonderes"
		},
		ourPick: "Unsere Wahl",
		cityPhoto: "Stadtfoto · Hotelfotos auf Booking.com",
		fromNav: "Direktflüge ab Dänemark",
		fromTitle: (a) => `Direktflüge ab ${a}: die 3 besten Hotels an jedem Ziel | Top3Hotels`,
		fromH1: (a) => `Direkt ab ${a}`,
		fromLead: (a, n) => `${n} Ziele mit Direktflug ab Flughafen ${a}. Für jedes: ein günstiges Hotel, eines mit bestem Preis-Leistungs-Verhältnis und ein Luxushotel.`,
		popular: "Beliebte Reiseziele",
		homeH1: "Die 3 besten Hotels jeder Stadt",
		title: (c) => `Die besten Hotels in ${c} (2026): günstig, Preis-Leistung & Luxus | Top3Hotels`,
		desc: (c, co, b, v, l) => `Die 3 besten Hotels in ${c}, ${co}: ${b} (günstig), ${v} (Preis-Leistung) und ${l} (Luxus). In 1 Sekunde gewählt.`,
		h1: (c) => `Die 3 besten Hotels in ${c}`,
		lead: (n) => `Ein günstiges, eines mit bestem Preis-Leistungs-Verhältnis und ein Luxushotel${n ? ` – ausgewählt aus ${n} Hotels, die Booking.com für denselben Aufenthalt anzeigte` : ""}. Keine endlose Liste.`,
		checkIn: "Anreise",
		checkOut: "Abreise",
		seeDates: "Die 3 für meine Daten",
		perNight: "/ Nacht",
		refRate: "Referenzpreis",
		reviews: "Bewertungen",
		location: "Lage",
		checkPrice: "Preis & Verfügbarkeit prüfen",
		compare: "Preise vergleichen",
		map: "Karte",
		why: (l) => `Warum diese Wahl (${l})`,
		guestsSay: "Das sagen Gäste",
		checked: (d) => d <= 0 ? "Preis heute geprüft" : d === 1 ? "Preis gestern geprüft" : `Preis vor ${d} Tagen geprüft`,
		walk: (m, p) => `≈ ${m} Min. zu Fuß zu ${p}`,
		km: (k, p) => `${k} km bis ${p}`,
		compared: (c) => `Hotels in ${c} im Vergleich`,
		cols: [
			"Kategorie",
			"Hotel",
			"Viertel",
			"Sterne",
			"Gästebewertung",
			"Ref.-Preis / Nacht"
		],
		faqTitle: (c) => `Fragen zu Hotels in ${c}`,
		faq: {
			budget: (c) => `Welches ist das beste günstige Hotel in ${c}?`,
			value: (c) => `Welches Hotel in ${c} hat das beste Preis-Leistungs-Verhältnis?`,
			lux: (c) => `Welches ist das beste Luxushotel in ${c}?`,
			where: (c) => `Wo übernachtet man am besten in ${c}?`,
			live: "Sind die Preise live?",
			whereA: (a) => `Unsere drei Hotels liegen in ${a}. Öffnen Sie jedes Hotel auf der Karte, bevor Sie buchen.`,
			liveA: (d, ch) => `Nein. Es sind Referenzpreise für ${d}, 2 Erwachsene und 1 Zimmer, ${ch} auf Booking.com geprüft. Der Buchungslink zeigt den aktuellen Preis für Ihre Daten.`
		},
		howTitle: "So wählen wir die drei",
		howText: "Günstig ist der niedrigste passende Referenzpreis. Preis-Leistung wägt Preis und Gästebewertung ab. Luxus bevorzugt Fünf-Sterne-Hotels; erfüllt keines die Kriterien, erscheint ein Vier-Sterne-Hotel mit 8,5+ als gehobene Alternative. Jede Wahl zeigt Quelle, Anzahl der Bewertungen und Prüfdatum. Kein bezahltes Ranking.",
		near: (c) => `In der Nähe von ${c}`,
		moreIn: (c) => `Mehr in ${c}`,
		allIn: (c) => `Alle Reiseziele in ${c} →`,
		footer: "Das beste Hotel jeder Stadt, in 1 Sekunde gewählt.",
		disclaimer: "Unabhängiger Ratgeber. Buchungslinks können uns eine Provision bringen, ohne Kosten für Sie. Referenzpreise, keine Live-Angebote.",
		countryTitle: (c, n) => `Die besten Hotels in ${c}: ${n} Städte, je 3 Tipps | Top3Hotels`,
		countryH1: (c) => `Die besten Hotels in ${c}`,
		countryLead: (n) => `${n} Reiseziele. Jeweils drei Tipps: günstig, Preis-Leistung und Luxus.`,
		destTitle: (n) => `Alle ${n} Reiseziele — die besten Hotels nach Stadt | Top3Hotels`,
		destH1: (n) => `Alle ${n} Reiseziele`,
		destLead: (n) => `Jede Stadt hat genau drei Hotels: günstig, Preis-Leistung und Luxus. ${n} Länder.`,
		notFound: "Diese Stadt haben wir noch nicht",
		tags: {
			pool: "Pool",
			beach: "Strandlage",
			pets: "Haustiere erlaubt",
			family: "Familienzimmer",
			spa: "Spa",
			parking: "Gratis-Parken",
			breakfast: "Tolles Frühstück",
			ac: "Klimaanlage",
			gym: "Fitness"
		},
		themes: {
			beach: {
				title: "Die besten Strandhotels",
				h1: "Die besten Strandhotels",
				lead: "Jedes Hotel ist einer unserer drei Tipps in seiner Stadt und liegt laut Booking.com direkt am Strand."
			},
			pool: {
				title: "Die besten Hotels mit Pool",
				h1: "Die besten Hotels mit Pool",
				lead: "Unsere Tipps mit Pool, sortiert nach Gästebewertung."
			},
			pets: {
				title: "Die besten Hotels mit Hund",
				h1: "Die besten haustierfreundlichen Hotels",
				lead: "Unsere Tipps, die Haustiere erlauben. Gebühren bitte beim Hotel prüfen."
			},
			family: {
				title: "Die besten Familienhotels",
				h1: "Die besten Hotels für Familien",
				lead: "Unsere Tipps mit Familienzimmern, sortiert nach Gästebewertung."
			},
			spa: {
				title: "Die besten Spa-Hotels",
				h1: "Die besten Hotels mit Spa",
				lead: "Unsere Tipps mit Spa oder Wellness, sortiert nach Gästebewertung."
			},
			budget: {
				title: "Die besten günstigen Hotels",
				h1: "Die besten günstigen Hotels",
				lead: "Der günstige Tipp jeder Stadt, sortiert nach Bewertung und Preis."
			},
			luxury: {
				title: "Die besten Luxushotels",
				h1: "Die besten Luxushotels",
				lead: "Der Luxus-Tipp jeder Stadt, sortiert nach Gästebewertung."
			}
		},
		listsTitle: "Hotel-Bestenlisten",
		listsLead: "Themenlisten aus unseren drei Tipps in jeder Stadt.",
		photo: "Foto",
		mapHint: "Die drei Hotels und die bekanntesten Sehenswürdigkeiten."
	},
	fr: {
		...en$1,
		htmlLang: "fr",
		name: "Français",
		home: "Accueil",
		search: "Rechercher",
		allDest: "Toutes les destinations",
		how: "Notre méthode",
		lists: "Sélections",
		cat: {
			Budget: "Petit budget",
			"Best Value": "Meilleur rapport qualité-prix",
			Luxury: "Luxe",
			Upscale: "Alternative haut de gamme"
		},
		tag: {
			Budget: "Dépenser malin",
			"Best Value": "Le choix équilibré",
			Luxury: "S'offrir l'exception"
		},
		ourPick: "Notre choix",
		cityPhoto: "Photo de la ville · photos de l’hôtel sur Booking.com",
		fromNav: "Vols directs depuis le Danemark",
		fromTitle: (a) => `Vols directs depuis ${a} : les 3 meilleurs hôtels de chaque destination | Top3Hotels`,
		fromH1: (a) => `Vols directs depuis ${a}`,
		fromLead: (a, n) => `${n} destinations en vol direct depuis l'aéroport de ${a}. Pour chacune : un hôtel petit budget, un qualité-prix et un luxe.`,
		popular: "Destinations populaires",
		homeH1: "Les 3 meilleurs hôtels de chaque ville",
		title: (c) => `Meilleurs hôtels à ${c} (2026) : petit budget, qualité-prix et luxe | Top3Hotels`,
		desc: (c, co, b, v, l) => `Les 3 meilleurs hôtels à ${c}, ${co} : ${b} (petit budget), ${v} (qualité-prix) et ${l} (luxe). Choisis en 1 seconde.`,
		h1: (c) => `Les 3 meilleurs hôtels à ${c}`,
		lead: (n) => `Un petit budget, un meilleur rapport qualité-prix et un luxe${n ? `, choisis parmi ${n} hôtels proposés par Booking.com pour le même séjour` : ""}. Pas de liste interminable.`,
		checkIn: "Arrivée",
		checkOut: "Départ",
		seeDates: "Voir les 3 pour mes dates",
		perNight: "/ nuit",
		refRate: "Prix de référence",
		reviews: "avis",
		location: "Emplacement",
		checkPrice: "Voir prix et disponibilités",
		compare: "Comparer les prix",
		map: "Carte",
		why: (l) => `Pourquoi ce choix (${l})`,
		guestsSay: "Les clients disent",
		checked: (d) => d <= 0 ? "Prix vérifié aujourd'hui" : d === 1 ? "Prix vérifié hier" : `Prix vérifié il y a ${d} jours`,
		walk: (m, p) => `≈ ${m} min à pied de ${p}`,
		km: (k, p) => `à ${k} km de ${p}`,
		compared: (c) => `Hôtels de ${c} comparés`,
		cols: [
			"Catégorie",
			"Hôtel",
			"Quartier",
			"Étoiles",
			"Note",
			"Prix réf. / nuit"
		],
		faqTitle: (c) => `Questions sur les hôtels à ${c}`,
		faq: {
			budget: (c) => `Quel est le meilleur hôtel pas cher à ${c} ?`,
			value: (c) => `Quel hôtel offre le meilleur rapport qualité-prix à ${c} ?`,
			lux: (c) => `Quel est le meilleur hôtel de luxe à ${c} ?`,
			where: (c) => `Où loger à ${c} ?`,
			live: "Les prix sont-ils en temps réel ?",
			whereA: (a) => `Nos trois hôtels sont à ${a}. Ouvrez chacun sur la carte pour voir le quartier avant de réserver.`,
			liveA: (d, ch) => `Non. Ce sont des prix de référence pour ${d}, 2 adultes et 1 chambre, vérifiés sur Booking.com ${ch}. Le lien de réservation affiche le prix actuel pour vos dates.`
		},
		howTitle: "Comment nous choisissons les trois",
		howText: "Le petit budget est le tarif de référence éligible le plus bas. Le qualité-prix équilibre prix et note des clients. Le luxe privilégie les cinq étoiles ; à défaut, un quatre étoiles noté 8,5+ apparaît comme alternative haut de gamme. Chaque choix affiche sa source, le nombre d'avis et sa date de vérification. Aucun classement payé.",
		near: (c) => `Près de ${c}`,
		moreIn: (c) => `Plus en ${c}`,
		allIn: (c) => `Toutes les destinations en ${c} →`,
		footer: "Le meilleur hôtel de chaque ville, choisi en 1 seconde.",
		disclaimer: "Guide indépendant. Les liens de réservation peuvent nous rapporter une commission, sans frais pour vous. Prix de référence, pas en temps réel.",
		countryTitle: (c, n) => `Meilleurs hôtels en ${c} : ${n} villes, 3 choix chacune | Top3Hotels`,
		countryH1: (c) => `Les meilleurs hôtels en ${c}`,
		countryLead: (n) => `${n} destinations. Trois choix dans chacune : petit budget, qualité-prix et luxe.`,
		destTitle: (n) => `Les ${n} destinations — meilleurs hôtels par ville | Top3Hotels`,
		destH1: (n) => `Les ${n} destinations`,
		destLead: (n) => `Chaque ville a exactement trois hôtels : petit budget, qualité-prix et luxe. ${n} pays.`,
		notFound: "Nous ne couvrons pas encore cette ville",
		tags: {
			pool: "Piscine",
			beach: "Bord de plage",
			pets: "Animaux acceptés",
			family: "Chambres familiales",
			spa: "Spa",
			parking: "Parking gratuit",
			breakfast: "Excellent petit-déjeuner",
			ac: "Climatisation",
			gym: "Salle de sport"
		},
		themes: {
			beach: {
				title: "Meilleurs hôtels en bord de plage",
				h1: "Les meilleurs hôtels en bord de plage",
				lead: "Chaque hôtel est l'un de nos trois choix dans sa ville et indique un accès plage sur Booking.com."
			},
			pool: {
				title: "Meilleurs hôtels avec piscine",
				h1: "Les meilleurs hôtels avec piscine",
				lead: "Nos choix avec piscine, classés par note."
			},
			pets: {
				title: "Meilleurs hôtels acceptant les animaux",
				h1: "Les meilleurs hôtels acceptant les animaux",
				lead: "Nos choix qui acceptent les animaux. Vérifiez les frais auprès de l'hôtel."
			},
			family: {
				title: "Meilleurs hôtels pour les familles",
				h1: "Les meilleurs hôtels pour les familles",
				lead: "Nos choix avec chambres familiales, classés par note."
			},
			spa: {
				title: "Meilleurs hôtels avec spa",
				h1: "Les meilleurs hôtels avec spa",
				lead: "Nos choix avec spa ou bien-être, classés par note."
			},
			budget: {
				title: "Meilleurs hôtels pas chers",
				h1: "Les meilleurs hôtels pas chers",
				lead: "Le choix petit budget de chaque ville, classé par note et prix."
			},
			luxury: {
				title: "Meilleurs hôtels de luxe",
				h1: "Les meilleurs hôtels de luxe",
				lead: "Le choix luxe de chaque ville, classé par note."
			}
		},
		listsTitle: "Sélections d'hôtels",
		listsLead: "Des sélections thématiques construites avec nos trois choix dans chaque ville.",
		photo: "Photo",
		mapHint: "Les trois hôtels et les sites les plus connus de la ville."
	},
	it: {
		...en$1,
		htmlLang: "it",
		name: "Italiano",
		home: "Home",
		search: "Cerca",
		allDest: "Tutte le destinazioni",
		how: "Come scegliamo",
		lists: "Classifiche",
		cat: {
			Budget: "Economico",
			"Best Value": "Miglior rapporto qualità-prezzo",
			Luxury: "Lusso",
			Upscale: "Alternativa di pregio"
		},
		tag: {
			Budget: "Spendere bene",
			"Best Value": "La scelta equilibrata",
			Luxury: "Concediti il meglio"
		},
		ourPick: "La nostra scelta",
		cityPhoto: "Foto della città · foto dell’hotel su Booking.com",
		fromNav: "Voli diretti dalla Danimarca",
		fromTitle: (a) => `Voli diretti da ${a}: i 3 migliori hotel di ogni destinazione | Top3Hotels`,
		fromH1: (a) => `Voli diretti da ${a}`,
		fromLead: (a, n) => `${n} destinazioni con volo diretto dall'aeroporto di ${a}. Per ognuna: un hotel economico, uno qualità-prezzo e uno di lusso.`,
		popular: "Destinazioni popolari",
		homeH1: "I 3 migliori hotel di ogni città",
		title: (c) => `I migliori hotel a ${c} (2026): economico, qualità-prezzo e lusso | Top3Hotels`,
		desc: (c, co, b, v, l) => `I 3 migliori hotel a ${c}, ${co}: ${b} (economico), ${v} (qualità-prezzo) e ${l} (lusso). Scelti in 1 secondo.`,
		h1: (c) => `I 3 migliori hotel a ${c}`,
		lead: (n) => `Uno economico, uno qualità-prezzo e uno di lusso${n ? `, scelti tra ${n} hotel proposti da Booking.com per lo stesso soggiorno` : ""}. Nessuna lista infinita.`,
		checkIn: "Arrivo",
		checkOut: "Partenza",
		seeDates: "Vedi i 3 per le mie date",
		perNight: "/ notte",
		refRate: "Prezzo di riferimento",
		reviews: "recensioni",
		location: "Posizione",
		checkPrice: "Verifica prezzo e disponibilità",
		compare: "Confronta i prezzi",
		map: "Mappa",
		why: (l) => `Perché questa scelta (${l})`,
		guestsSay: "Dicono gli ospiti",
		checked: (d) => d <= 0 ? "Prezzo verificato oggi" : d === 1 ? "Prezzo verificato ieri" : `Prezzo verificato ${d} giorni fa`,
		walk: (m, p) => `≈ ${m} min a piedi da ${p}`,
		km: (k, p) => `a ${k} km da ${p}`,
		compared: (c) => `Hotel a ${c} a confronto`,
		cols: [
			"Categoria",
			"Hotel",
			"Zona",
			"Stelle",
			"Voto",
			"Prezzo rif. / notte"
		],
		faqTitle: (c) => `Domande sugli hotel a ${c}`,
		faq: {
			budget: (c) => `Qual è il miglior hotel economico a ${c}?`,
			value: (c) => `Qual è l'hotel con il miglior rapporto qualità-prezzo a ${c}?`,
			lux: (c) => `Qual è il miglior hotel di lusso a ${c}?`,
			where: (c) => `Dove dormire a ${c}?`,
			live: "I prezzi sono in tempo reale?",
			whereA: (a) => `I nostri tre hotel si trovano a ${a}. Aprili sulla mappa per vedere il quartiere prima di prenotare.`,
			liveA: (d, ch) => `No. Sono prezzi di riferimento per ${d}, 2 adulti e 1 camera, verificati su Booking.com ${ch}. Il link di prenotazione mostra il prezzo attuale per le tue date.`
		},
		howTitle: "Come scegliamo i tre",
		howText: "L'economico è la tariffa di riferimento idonea più bassa. Il qualità-prezzo bilancia prezzo e voto degli ospiti. Il lusso privilegia i cinque stelle; se nessuno è idoneo, un quattro stelle con 8,5+ compare come alternativa di pregio. Ogni scelta mostra fonte, numero di recensioni e data di verifica. Nessuna classifica a pagamento.",
		near: (c) => `Vicino a ${c}`,
		moreIn: (c) => `Altro in ${c}`,
		allIn: (c) => `Tutte le destinazioni in ${c} →`,
		footer: "Il miglior hotel di ogni città, scelto in 1 secondo.",
		disclaimer: "Guida indipendente. I link di prenotazione possono farci guadagnare una commissione senza costi per te. Prezzi di riferimento, non in tempo reale.",
		countryTitle: (c, n) => `I migliori hotel in ${c}: ${n} città, 3 scelte ciascuna | Top3Hotels`,
		countryH1: (c) => `I migliori hotel in ${c}`,
		countryLead: (n) => `${n} destinazioni. Tre scelte in ognuna: economico, qualità-prezzo e lusso.`,
		destTitle: (n) => `Tutte le ${n} destinazioni — i migliori hotel per città | Top3Hotels`,
		destH1: (n) => `Tutte le ${n} destinazioni`,
		destLead: (n) => `Ogni città ha esattamente tre hotel: economico, qualità-prezzo e lusso. ${n} paesi.`,
		notFound: "Non copriamo ancora questa città",
		tags: {
			pool: "Piscina",
			beach: "Fronte mare",
			pets: "Animali ammessi",
			family: "Camere familiari",
			spa: "Spa",
			parking: "Parcheggio gratuito",
			breakfast: "Ottima colazione",
			ac: "Aria condizionata",
			gym: "Palestra"
		},
		themes: {
			beach: {
				title: "I migliori hotel fronte mare",
				h1: "I migliori hotel fronte mare",
				lead: "Ogni hotel è una delle nostre tre scelte nella sua città e indica accesso alla spiaggia su Booking.com."
			},
			pool: {
				title: "I migliori hotel con piscina",
				h1: "I migliori hotel con piscina",
				lead: "Le nostre scelte con piscina, ordinate per voto."
			},
			pets: {
				title: "I migliori hotel che accettano animali",
				h1: "I migliori hotel pet-friendly",
				lead: "Le nostre scelte che accettano animali. Verifica sempre i costi con l'hotel."
			},
			family: {
				title: "I migliori hotel per famiglie",
				h1: "I migliori hotel per famiglie",
				lead: "Le nostre scelte con camere familiari, ordinate per voto."
			},
			spa: {
				title: "I migliori hotel con spa",
				h1: "I migliori hotel con spa",
				lead: "Le nostre scelte con spa o benessere, ordinate per voto."
			},
			budget: {
				title: "I migliori hotel economici",
				h1: "I migliori hotel economici",
				lead: "La scelta economica di ogni città, ordinata per voto e prezzo."
			},
			luxury: {
				title: "I migliori hotel di lusso",
				h1: "I migliori hotel di lusso",
				lead: "La scelta di lusso di ogni città, ordinata per voto."
			}
		},
		listsTitle: "Classifiche di hotel",
		listsLead: "Liste tematiche create con le nostre tre scelte in ogni città.",
		photo: "Foto",
		mapHint: "I tre hotel e i luoghi più famosi della città."
	},
	pt: {
		...en$1,
		htmlLang: "pt",
		name: "Português",
		home: "Início",
		search: "Pesquisar",
		allDest: "Todos os destinos",
		how: "Como escolhemos",
		lists: "Listas",
		cat: {
			Budget: "Económico",
			"Best Value": "Melhor qualidade-preço",
			Luxury: "Luxo",
			Upscale: "Alternativa superior"
		},
		tag: {
			Budget: "Gastar com cabeça",
			"Best Value": "A escolha equilibrada",
			Luxury: "Um mimo especial"
		},
		ourPick: "A nossa escolha",
		cityPhoto: "Foto da cidade · fotos do hotel no Booking.com",
		fromNav: "Voos diretos da Dinamarca",
		fromTitle: (a) => `Voos diretos de ${a}: os 3 melhores hotéis de cada destino | Top3Hotels`,
		fromH1: (a) => `Voe direto de ${a}`,
		fromLead: (a, n) => `${n} destinos com voo direto do aeroporto de ${a}. Em cada um: um hotel económico, um de qualidade-preço e um de luxo.`,
		popular: "Destinos populares",
		homeH1: "Os 3 melhores hotéis de cada cidade",
		title: (c) => `Os melhores hotéis em ${c} (2026): económico, qualidade-preço e luxo | Top3Hotels`,
		desc: (c, co, b, v, l) => `Os 3 melhores hotéis em ${c}, ${co}: ${b} (económico), ${v} (qualidade-preço) e ${l} (luxo). Escolhidos em 1 segundo.`,
		h1: (c) => `Os 3 melhores hotéis em ${c}`,
		lead: (n) => `Um económico, um de melhor qualidade-preço e um de luxo${n ? `, escolhidos entre ${n} hotéis do Booking.com para a mesma estadia` : ""}. Sem listas intermináveis.`,
		checkIn: "Entrada",
		checkOut: "Saída",
		seeDates: "Ver os 3 nas minhas datas",
		perNight: "/ noite",
		refRate: "Preço de referência",
		reviews: "avaliações",
		location: "Localização",
		checkPrice: "Ver preço e disponibilidade",
		compare: "Comparar preços",
		map: "Mapa",
		why: (l) => `Porquê esta escolha (${l})`,
		guestsSay: "Os hóspedes dizem",
		checked: (d) => d <= 0 ? "Preço verificado hoje" : d === 1 ? "Preço verificado ontem" : `Preço verificado há ${d} dias`,
		walk: (m, p) => `≈ ${m} min a pé de ${p}`,
		km: (k, p) => `a ${k} km de ${p}`,
		compared: (c) => `Hotéis em ${c} comparados`,
		cols: [
			"Categoria",
			"Hotel",
			"Zona",
			"Estrelas",
			"Nota",
			"Preço ref. / noite"
		],
		faqTitle: (c) => `Perguntas sobre hotéis em ${c}`,
		faq: {
			budget: (c) => `Qual é o melhor hotel económico em ${c}?`,
			value: (c) => `Qual é o hotel com melhor qualidade-preço em ${c}?`,
			lux: (c) => `Qual é o melhor hotel de luxo em ${c}?`,
			where: (c) => `Onde ficar em ${c}?`,
			live: "Os preços são em tempo real?",
			whereA: (a) => `Os nossos três hotéis ficam em ${a}. Abra cada um no mapa para ver o bairro antes de reservar.`,
			liveA: (d, ch) => `Não. São preços de referência para ${d}, 2 adultos e 1 quarto, verificados no Booking.com ${ch}. O link de reserva mostra o preço atual para as suas datas.`
		},
		howTitle: "Como escolhemos os três",
		howText: "O económico é a tarifa de referência elegível mais baixa. O de qualidade-preço equilibra preço e nota dos hóspedes. O de luxo dá prioridade a hotéis de cinco estrelas; se nenhum for elegível, um quatro estrelas com 8,5+ aparece como alternativa superior. Cada escolha mostra a fonte, o número de avaliações e quando a verificámos. Não é um ranking pago.",
		near: (c) => `Perto de ${c}`,
		moreIn: (c) => `Mais em ${c}`,
		allIn: (c) => `Todos os destinos em ${c} →`,
		footer: "O melhor hotel de cada cidade, escolhido em 1 segundo.",
		disclaimer: "Guia independente. Os links de reserva podem render-nos uma comissão sem custo para si. Preços de referência, não em tempo real.",
		countryTitle: (c, n) => `Melhores hotéis em ${c}: ${n} cidades, 3 escolhas em cada | Top3Hotels`,
		countryH1: (c) => `Os melhores hotéis em ${c}`,
		countryLead: (n) => `${n} destinos. Três escolhas em cada: económico, qualidade-preço e luxo.`,
		destTitle: (n) => `Os ${n} destinos — melhores hotéis por cidade | Top3Hotels`,
		destH1: (n) => `Os ${n} destinos`,
		destLead: (n) => `Cada cidade tem exatamente três hotéis: económico, qualidade-preço e luxo. ${n} países.`,
		notFound: "Ainda não temos essa cidade",
		tags: {
			pool: "Piscina",
			beach: "Frente de praia",
			pets: "Aceita animais",
			family: "Quartos familiares",
			spa: "Spa",
			parking: "Estacionamento grátis",
			breakfast: "Ótimo pequeno-almoço",
			ac: "Ar condicionado",
			gym: "Ginásio"
		},
		themes: {
			beach: {
				title: "Melhores hotéis à beira-mar",
				h1: "Os melhores hotéis à beira-mar",
				lead: "Cada hotel é uma das nossas três escolhas na sua cidade e tem acesso à praia segundo o Booking.com."
			},
			pool: {
				title: "Melhores hotéis com piscina",
				h1: "Os melhores hotéis com piscina",
				lead: "As nossas escolhas com piscina, ordenadas por nota."
			},
			pets: {
				title: "Melhores hotéis que aceitam animais",
				h1: "Os melhores hotéis pet-friendly",
				lead: "As nossas escolhas que aceitam animais. Confirme sempre as taxas com o hotel."
			},
			family: {
				title: "Melhores hotéis para famílias",
				h1: "Os melhores hotéis para famílias",
				lead: "As nossas escolhas com quartos familiares, ordenadas por nota."
			},
			spa: {
				title: "Melhores hotéis com spa",
				h1: "Os melhores hotéis com spa",
				lead: "As nossas escolhas com spa ou bem-estar, ordenadas por nota."
			},
			budget: {
				title: "Melhores hotéis económicos",
				h1: "Os melhores hotéis económicos",
				lead: "A escolha económica de cada cidade, ordenada por nota e preço."
			},
			luxury: {
				title: "Melhores hotéis de luxo",
				h1: "Os melhores hotéis de luxo",
				lead: "A escolha de luxo de cada cidade, ordenada por nota."
			}
		},
		listsTitle: "Listas de hotéis",
		listsLead: "Listas temáticas feitas com as nossas três escolhas em cada cidade.",
		photo: "Foto",
		mapHint: "Os três hotéis e os locais mais conhecidos da cidade."
	},
	da: {
		...en$1,
		htmlLang: "da",
		name: "Dansk",
		home: "Forside",
		search: "Søg",
		allDest: "Alle destinationer",
		how: "Sådan vælger vi",
		lists: "Toplister",
		cat: {
			Budget: "Budget",
			"Best Value": "Mest for pengene",
			Luxury: "Luksus",
			Upscale: "Eksklusivt alternativ"
		},
		tag: {
			Budget: "Bruges klogt",
			"Best Value": "Det balancerede valg",
			Luxury: "Gør det til noget særligt"
		},
		ourPick: "Vores valg",
		cityPhoto: "Byfoto · hotelfotos på Booking.com",
		fromNav: "Direkte fly fra Danmark",
		fromTitle: (a) => `Direkte fly fra ${a}: de 3 bedste hoteller på hver destination | Top3Hotels`,
		fromH1: (a) => `Flyv direkte fra ${a}`,
		fromLead: (a, n) => `${n} destinationer med direkte fly fra ${a} Lufthavn. For hver: ét budgethotel, ét med mest for pengene og ét luksushotel. Vælg på 1 sekund.`,
		popular: "Populære destinationer",
		homeH1: "De 3 bedste hoteller i hver by",
		title: (c) => `De 3 bedste hoteller i ${c} (2026): budget, mest for pengene og luksus | Top3Hotels`,
		desc: (c, co, b, v, l) => `De 3 bedste hoteller i ${c}, ${co}: ${b} (budget), ${v} (mest for pengene) og ${l} (luksus). Valgt på 1 sekund.`,
		h1: (c) => `De 3 bedste hoteller i ${c}`,
		lead: (n) => `Ét budgethotel, ét med mest for pengene og ét luksushotel${n ? ` – valgt blandt ${n} hoteller, som Booking.com viste for samme ophold` : ""}. Ingen endeløs liste: vælg din stil og book.`,
		checkIn: "Indtjekning",
		checkOut: "Udtjekning",
		seeDates: "Se de 3 på mine datoer",
		perNight: "/ nat",
		refRate: "Referencepris",
		reviews: "anmeldelser",
		location: "Beliggenhed",
		checkPrice: "Se pris og ledighed",
		compare: "Sammenlign priser",
		map: "Kort",
		why: (l) => `Hvorfor dette valg (${l})`,
		guestsSay: "Gæsterne siger",
		checked: (d) => d <= 0 ? "Pris tjekket i dag" : d === 1 ? "Pris tjekket i går" : `Pris tjekket for ${d} dage siden`,
		walk: (m, p) => `≈ ${m} min. gang til ${p}`,
		km: (k, p) => `${k} km til ${p}`,
		compared: (c) => `Hoteller i ${c} sammenlignet`,
		cols: [
			"Kategori",
			"Hotel",
			"Område",
			"Stjerner",
			"Gæstescore",
			"Ref.-pris / nat"
		],
		faqTitle: (c) => `Spørgsmål om hoteller i ${c}`,
		faq: {
			budget: (c) => `Hvad er det bedste budgethotel i ${c}?`,
			value: (c) => `Hvilket hotel i ${c} giver mest for pengene?`,
			lux: (c) => `Hvad er det bedste luksushotel i ${c}?`,
			where: (c) => `Hvor skal man bo i ${c}?`,
			live: "Er priserne live?",
			whereA: (a) => `Vores tre hoteller ligger i ${a}. Åbn hvert hotel på kortet for at se området, før du booker.`,
			liveA: (d, ch) => `Nej. Det er referencepriser for ${d}, 2 voksne og 1 værelse, tjekket på Booking.com ${ch}. Bookinglinket viser den aktuelle pris for dine datoer.`
		},
		howTitle: "Sådan vælger vi de tre",
		howText: "Budget er den laveste godkendte referencepris. Mest for pengene balancerer pris og gæstescore. Luksus prioriterer femstjernede hoteller; hvis ingen kvalificerer sig, vises et firestjernet hotel med 8,5+ som eksklusivt alternativ. Hvert valg viser kilde, antal anmeldelser og hvornår vi tjekkede det. Ingen betalte placeringer.",
		near: (c) => `Nær ${c}`,
		moreIn: (c) => `Mere i ${c}`,
		allIn: (c) => `Alle destinationer i ${c} →`,
		footer: "Det bedste hotel i hver by, valgt på 1 sekund.",
		disclaimer: "Uafhængig guide. Bookinglinks kan give os en provision uden ekstra omkostning for dig. Referencepriser, ikke live-tilbud.",
		countryTitle: (c, n) => `De bedste hoteller i ${c}: ${n} byer, 3 valg i hver | Top3Hotels`,
		countryH1: (c) => `De bedste hoteller i ${c}`,
		countryLead: (n) => `${n} destinationer. Tre valg i hver: budget, mest for pengene og luksus.`,
		destTitle: (n) => `Alle ${n} destinationer — de bedste hoteller efter by | Top3Hotels`,
		destH1: (n) => `Alle ${n} destinationer`,
		destLead: (n) => `Hver by har præcis tre hoteller: budget, mest for pengene og luksus. ${n} lande.`,
		notFound: "Den by har vi ikke endnu",
		tags: {
			pool: "Pool",
			beach: "Ved stranden",
			pets: "Kæledyr tilladt",
			family: "Familieværelser",
			spa: "Spa",
			parking: "Gratis parkering",
			breakfast: "God morgenmad",
			ac: "Aircondition",
			gym: "Fitness"
		},
		themes: {
			beach: {
				title: "De bedste strandhoteller",
				h1: "De bedste hoteller ved stranden",
				lead: "Hvert hotel er et af vores tre valg i sin by og har ifølge Booking.com adgang til stranden."
			},
			pool: {
				title: "De bedste hoteller med pool",
				h1: "De bedste hoteller med pool",
				lead: "Vores valg med pool, sorteret efter gæstescore."
			},
			pets: {
				title: "De bedste hoteller, hvor hunden må komme med",
				h1: "De bedste kæledyrsvenlige hoteller",
				lead: "Vores valg, der tillader kæledyr. Tjek altid gebyrer med hotellet."
			},
			family: {
				title: "De bedste familiehoteller",
				h1: "De bedste hoteller for familier",
				lead: "Vores valg med familieværelser, sorteret efter gæstescore."
			},
			spa: {
				title: "De bedste spahoteller",
				h1: "De bedste hoteller med spa",
				lead: "Vores valg med spa eller wellness, sorteret efter gæstescore."
			},
			budget: {
				title: "De bedste budgethoteller",
				h1: "De bedste budgethoteller",
				lead: "Budgetvalget i hver by, sorteret efter gæstescore og pris."
			},
			luxury: {
				title: "De bedste luksushoteller",
				h1: "De bedste luksushoteller",
				lead: "Luksusvalget i hver by, sorteret efter gæstescore."
			}
		},
		listsTitle: "Hotel-toplister",
		listsLead: "Tematiske lister bygget på vores tre valg i hver by.",
		photo: "Foto",
		mapHint: "De tre hoteller og byens mest kendte seværdigheder."
	}
};
var isLang = (s) => LANGS.includes(s);
var en = {
	forHotels: "For hotels",
	about: "About us",
	contact: "Contact",
	privacy: "Privacy",
	terms: "Terms",
	imprint: "Imprint",
	cookies: "Cookies",
	company: "Company",
	legal: "Legal",
	explore: "Explore",
	reviewed: (d) => `Selected with the Top3Hotels method · Updated ${d}`,
	transparency: (w) => `Independent · No paid rankings · Prices checked ${w}`,
	independent: "Independent",
	noPaid: "No paid rankings",
	share: "Share",
	copyLink: "Copy link",
	copied: "Link copied",
	emailMe: "Email these 3 to me",
	quick: "Quick dates",
	thisWeekend: "This weekend",
	nextWeekend: "Next weekend",
	inAMonth: "In a month",
	whereStay: (c) => `Where to stay in ${c}`,
	whereLead: "Each pick sits in a different part of town. Choose the base that fits your trip.",
	whereSame: (a) => `All three picks are in ${a}, so you can choose purely on budget and style.`,
	bestFor: "Best for",
	knowBefore: "Good to know",
	forTypes: {
		budget: "Smart-budget trips",
		value: "Most travellers",
		lux: "Special occasions",
		family: "Families",
		spa: "Wellness breaks",
		pool: "Pool days",
		pets: "Travelling with a dog",
		beach: "Beach holidays",
		central: "Sightseeing on foot"
	},
	badgeQ: "Is your hotel one of these three?",
	badgeHow: "Add the official Top 3 badge to your website. Copy this code:",
	sources: "Sources",
	sourcesText: "Guest scores, review counts, reference prices and hotel photos: Booking.com. City photos: Wikimedia Commons. Sights: Wikipedia. Maps: OpenStreetMap."
};
var X = {
	en,
	es: {
		...en,
		forHotels: "Para hoteles",
		about: "Quiénes somos",
		contact: "Contacto",
		privacy: "Privacidad",
		terms: "Términos",
		imprint: "Aviso legal",
		cookies: "Cookies",
		company: "Empresa",
		legal: "Legal",
		explore: "Explorar",
		reviewed: (d) => `Seleccionado con el método Top3Hotels · Actualizado ${d}`,
		transparency: (w) => `Independiente · Sin rankings pagados · Precios revisados ${w}`,
		independent: "Independiente",
		noPaid: "Sin rankings pagados",
		share: "Compartir",
		copyLink: "Copiar enlace",
		copied: "Enlace copiado",
		emailMe: "Enviarme estos 3 por email",
		quick: "Fechas rápidas",
		thisWeekend: "Este finde",
		nextWeekend: "Próximo finde",
		inAMonth: "Dentro de un mes",
		whereStay: (c) => `Dónde dormir en ${c}`,
		whereLead: "Cada hotel está en una zona distinta. Elige la base que encaja con tu viaje.",
		whereSame: (a) => `Los tres están en ${a}: elige solo por presupuesto y estilo.`,
		bestFor: "Ideal para",
		knowBefore: "A tener en cuenta",
		forTypes: {
			budget: "Viajes con presupuesto ajustado",
			value: "La mayoría de viajeros",
			lux: "Ocasiones especiales",
			family: "Familias",
			spa: "Escapadas de bienestar",
			pool: "Días de piscina",
			pets: "Viajar con perro",
			beach: "Vacaciones de playa",
			central: "Ver la ciudad a pie"
		},
		badgeQ: "¿Tu hotel es uno de estos tres?",
		badgeHow: "Añade el sello oficial Top 3 a tu web. Copia este código:",
		sources: "Fuentes",
		sourcesText: "Notas, número de opiniones, precios de referencia y fotos de hoteles: Booking.com. Fotos de la ciudad: Wikimedia Commons. Lugares: Wikipedia. Mapas: OpenStreetMap."
	},
	de: {
		...en,
		forHotels: "Für Hotels",
		about: "Über uns",
		contact: "Kontakt",
		privacy: "Datenschutz",
		terms: "Bedingungen",
		imprint: "Impressum",
		company: "Unternehmen",
		legal: "Rechtliches",
		explore: "Entdecken",
		reviewed: (d) => `Ausgewählt nach der Top3Hotels-Methode · Aktualisiert am ${d}`,
		transparency: (w) => `Unabhängig · Keine bezahlten Rankings · Preise geprüft ${w}`,
		independent: "Unabhängig",
		noPaid: "Keine bezahlten Rankings",
		share: "Teilen",
		copyLink: "Link kopieren",
		copied: "Link kopiert",
		emailMe: "Diese 3 per E-Mail senden",
		quick: "Schnelle Daten",
		thisWeekend: "Dieses Wochenende",
		nextWeekend: "Nächstes Wochenende",
		inAMonth: "In einem Monat",
		whereStay: (c) => `Wo übernachten in ${c}`,
		whereLead: "Jedes Hotel liegt in einem anderen Viertel. Wählen Sie die Basis, die zu Ihrer Reise passt.",
		whereSame: (a) => `Alle drei liegen in ${a} – Sie wählen also nur nach Budget und Stil.`,
		bestFor: "Ideal für",
		knowBefore: "Gut zu wissen",
		forTypes: {
			budget: "Reisen mit kleinem Budget",
			value: "Die meisten Reisenden",
			lux: "Besondere Anlässe",
			family: "Familien",
			spa: "Wellness-Auszeiten",
			pool: "Pooltage",
			pets: "Reisen mit Hund",
			beach: "Strandurlaub",
			central: "Sightseeing zu Fuß"
		},
		badgeQ: "Ist Ihr Hotel eines dieser drei?",
		badgeHow: "Fügen Sie das offizielle Top-3-Siegel auf Ihrer Website ein. Code kopieren:",
		sources: "Quellen",
		sourcesText: "Gästebewertungen, Anzahl der Bewertungen, Referenzpreise und Hotelfotos: Booking.com. Stadtfotos: Wikimedia Commons. Sehenswürdigkeiten: Wikipedia. Karten: OpenStreetMap."
	},
	fr: {
		...en,
		forHotels: "Pour les hôtels",
		about: "Qui sommes-nous",
		contact: "Contact",
		privacy: "Confidentialité",
		terms: "Conditions",
		imprint: "Mentions légales",
		company: "Société",
		legal: "Légal",
		explore: "Explorer",
		reviewed: (d) => `Sélectionné selon la méthode Top3Hotels · Mis à jour le ${d}`,
		transparency: (w) => `Indépendant · Aucun classement payant · Prix vérifiés ${w}`,
		independent: "Indépendant",
		noPaid: "Aucun classement payant",
		share: "Partager",
		copyLink: "Copier le lien",
		copied: "Lien copié",
		emailMe: "M'envoyer ces 3 par e-mail",
		quick: "Dates rapides",
		thisWeekend: "Ce week-end",
		nextWeekend: "Le week-end prochain",
		inAMonth: "Dans un mois",
		whereStay: (c) => `Où dormir à ${c}`,
		whereLead: "Chaque hôtel est dans un quartier différent. Choisissez la base qui convient à votre séjour.",
		whereSame: (a) => `Les trois sont à ${a} : choisissez simplement selon votre budget et votre style.`,
		bestFor: "Idéal pour",
		knowBefore: "Bon à savoir",
		forTypes: {
			budget: "Voyages à petit budget",
			value: "La plupart des voyageurs",
			lux: "Grandes occasions",
			family: "Familles",
			spa: "Séjours bien-être",
			pool: "Journées piscine",
			pets: "Voyager avec un chien",
			beach: "Vacances à la plage",
			central: "Visiter à pied"
		},
		badgeQ: "Votre hôtel fait-il partie de ces trois ?",
		badgeHow: "Ajoutez le badge officiel Top 3 à votre site. Copiez ce code :",
		sources: "Sources",
		sourcesText: "Notes, nombre d'avis, prix de référence et photos d'hôtels : Booking.com. Photos de la ville : Wikimedia Commons. Lieux : Wikipédia. Cartes : OpenStreetMap."
	},
	it: {
		...en,
		forHotels: "Per gli hotel",
		about: "Chi siamo",
		contact: "Contatti",
		privacy: "Privacy",
		terms: "Termini",
		imprint: "Note legali",
		company: "Azienda",
		legal: "Legale",
		explore: "Esplora",
		reviewed: (d) => `Selezionato con il metodo Top3Hotels · Aggiornato il ${d}`,
		transparency: (w) => `Indipendente · Nessuna classifica a pagamento · Prezzi verificati ${w}`,
		independent: "Indipendente",
		noPaid: "Nessuna classifica a pagamento",
		share: "Condividi",
		copyLink: "Copia link",
		copied: "Link copiato",
		emailMe: "Inviami questi 3 via email",
		quick: "Date rapide",
		thisWeekend: "Questo weekend",
		nextWeekend: "Prossimo weekend",
		inAMonth: "Tra un mese",
		whereStay: (c) => `Dove dormire a ${c}`,
		whereLead: "Ogni hotel è in una zona diversa. Scegli la base giusta per il tuo viaggio.",
		whereSame: (a) => `Tutti e tre sono a ${a}: scegli solo in base a budget e stile.`,
		bestFor: "Ideale per",
		knowBefore: "Da sapere",
		forTypes: {
			budget: "Viaggi low cost",
			value: "La maggior parte dei viaggiatori",
			lux: "Occasioni speciali",
			family: "Famiglie",
			spa: "Weekend benessere",
			pool: "Giornate in piscina",
			pets: "Viaggiare con il cane",
			beach: "Vacanze al mare",
			central: "Visitare a piedi"
		},
		badgeQ: "Il tuo hotel è uno di questi tre?",
		badgeHow: "Aggiungi il badge ufficiale Top 3 al tuo sito. Copia questo codice:",
		sources: "Fonti",
		sourcesText: "Voti, numero di recensioni, prezzi di riferimento e foto degli hotel: Booking.com. Foto della città: Wikimedia Commons. Luoghi: Wikipedia. Mappe: OpenStreetMap."
	},
	pt: {
		...en,
		forHotels: "Para hotéis",
		about: "Quem somos",
		contact: "Contacto",
		privacy: "Privacidade",
		terms: "Termos",
		imprint: "Informação legal",
		company: "Empresa",
		legal: "Legal",
		explore: "Explorar",
		reviewed: (d) => `Selecionado com o método Top3Hotels · Atualizado a ${d}`,
		transparency: (w) => `Independente · Sem rankings pagos · Preços verificados ${w}`,
		independent: "Independente",
		noPaid: "Sem rankings pagos",
		share: "Partilhar",
		copyLink: "Copiar link",
		copied: "Link copiado",
		emailMe: "Enviar-me estes 3 por email",
		quick: "Datas rápidas",
		thisWeekend: "Este fim de semana",
		nextWeekend: "Próximo fim de semana",
		inAMonth: "Daqui a um mês",
		whereStay: (c) => `Onde ficar em ${c}`,
		whereLead: "Cada hotel fica numa zona diferente. Escolha a base certa para a sua viagem.",
		whereSame: (a) => `Os três ficam em ${a}: escolha apenas pelo orçamento e pelo estilo.`,
		bestFor: "Ideal para",
		knowBefore: "A saber",
		forTypes: {
			budget: "Viagens económicas",
			value: "A maioria dos viajantes",
			lux: "Ocasiões especiais",
			family: "Famílias",
			spa: "Escapadinhas de bem-estar",
			pool: "Dias de piscina",
			pets: "Viajar com cão",
			beach: "Férias de praia",
			central: "Conhecer a pé"
		},
		badgeQ: "O seu hotel é um destes três?",
		badgeHow: "Adicione o selo oficial Top 3 ao seu site. Copie este código:",
		sources: "Fontes",
		sourcesText: "Notas, número de avaliações, preços de referência e fotos dos hotéis: Booking.com. Fotos da cidade: Wikimedia Commons. Locais: Wikipédia. Mapas: OpenStreetMap."
	},
	da: {
		...en,
		forHotels: "For hoteller",
		about: "Om os",
		contact: "Kontakt",
		privacy: "Privatliv",
		terms: "Vilkår",
		imprint: "Juridisk information",
		company: "Virksomhed",
		legal: "Juridisk",
		explore: "Udforsk",
		reviewed: (d) => `Udvalgt efter Top3Hotels-metoden · Opdateret ${d}`,
		transparency: (w) => `Uafhængig · Ingen betalte placeringer · Priser tjekket ${w}`,
		independent: "Uafhængig",
		noPaid: "Ingen betalte placeringer",
		share: "Del",
		copyLink: "Kopiér link",
		copied: "Link kopieret",
		emailMe: "Send mig de 3 på e-mail",
		quick: "Hurtige datoer",
		thisWeekend: "Denne weekend",
		nextWeekend: "Næste weekend",
		inAMonth: "Om en måned",
		whereStay: (c) => `Hvor skal man bo i ${c}`,
		whereLead: "Hvert hotel ligger i sin egen del af byen. Vælg den base, der passer til din rejse.",
		whereSame: (a) => `Alle tre ligger i ${a}, så du kan vælge alene efter budget og stil.`,
		bestFor: "Bedst til",
		knowBefore: "Godt at vide",
		forTypes: {
			budget: "Rejser på budget",
			value: "De fleste rejsende",
			lux: "Særlige anledninger",
			family: "Familier",
			spa: "Wellnessophold",
			pool: "Pooldage",
			pets: "Rejser med hund",
			beach: "Strandferie",
			central: "Sightseeing til fods"
		},
		badgeQ: "Er dit hotel et af disse tre?",
		badgeHow: "Tilføj det officielle Top 3-badge på jeres hjemmeside. Kopiér denne kode:",
		sources: "Kilder",
		sourcesText: "Gæstescorer, antal anmeldelser, referencepriser og hotelfotos: Booking.com. Byfotos: Wikimedia Commons. Seværdigheder: Wikipedia. Kort: OpenStreetMap."
	}
};
var js = (o) => o;
var Y = {
	en: {
		js: js({
			search: "Search a city",
			ph: "Type a city: London, Roma, München…",
			surprise: "Surprise me",
			none: "No city found. Try another spelling.",
			save: "Save",
			saved: "Saved",
			recent: "Recently viewed",
			share: "Share",
			copied: "Link copied",
			total: "≈ {p} for {n} nights",
			approx: "approx.",
			empty: "Nothing saved yet. Tap ♡ on any hotel to keep it here.",
			ok: "Thanks! You're on the list.",
			err: "Something went wrong. Please try again.",
			open: "Open",
			remove: "Remove"
		}),
		whyScore: (s, n) => `${s}/10 from ${n} guest reviews`,
		whyFrom: (n) => `Chosen from ${n} hotels`,
		in1: "In 1 second",
		jHotels: "Hotels",
		jWhere: "Where to stay",
		jMap: "Map",
		jCompare: "Compare",
		jFaq: "FAQ",
		flights: "Direct flights from",
		compareWith: (c) => `Compare ${c} with`,
		vsTitle: (a, b) => `${a} vs ${b}: the best hotels side by side`,
		vsLead: (a, b) => `Our Budget, Best Value and Luxury picks in ${a} and ${b}, with scores and reference prices, so you can choose the city and the hotel in one look.`,
		cheapNav: "Cheapest cities",
		cheapTitle: "The cheapest cities for a great hotel",
		cheapLead: (n) => `${n} destinations ranked by the reference price of our Budget pick, a hotel rated 7.5/10 or better. Two adults, one room.`,
		under: "Under",
		all: "All",
		embedTitle: "Add this Top 3 to your blog or website",
		embedHow: "Copy this code. It shows the three picks with photos and links, and stays up to date.",
		newsTitle: "3 cities, 9 hotels, every Friday",
		newsLead: "One short email with three destinations and their Budget, Best Value and Luxury picks. No spam, unsubscribe in one click.",
		newsBtn: "Subscribe",
		emailPh: "Your email",
		nfTitle: "This page took a wrong turn",
		nfLead: "Search any city, or start with one of these.",
		savedTitle: "Your saved hotels",
		savedLead: "Saved on this device only. No account needed.",
		priceRef: (d) => `Reference price, checked ${d}`,
		guests: "Adults",
		rooms: "Rooms",
		currency: "Currency"
	},
	es: {
		js: js({
			search: "Buscar una ciudad",
			ph: "Escribe una ciudad: Londres, Roma, Múnich…",
			surprise: "Sorpréndeme",
			none: "No encontramos esa ciudad. Prueba otra forma de escribirla.",
			save: "Guardar",
			saved: "Guardado",
			recent: "Vistos recientemente",
			share: "Compartir",
			copied: "Enlace copiado",
			total: "≈ {p} por {n} noches",
			approx: "aprox.",
			empty: "Aún no has guardado nada. Toca ♡ en cualquier hotel para tenerlo aquí.",
			ok: "¡Gracias! Ya estás en la lista.",
			err: "Algo ha fallado. Inténtalo de nuevo.",
			open: "Abrir",
			remove: "Quitar"
		}),
		whyScore: (s, n) => `${s}/10 con ${n} opiniones`,
		whyFrom: (n) => `Elegido entre ${n} hoteles`,
		in1: "En 1 segundo",
		jHotels: "Hoteles",
		jWhere: "Dónde alojarse",
		jMap: "Mapa",
		jCompare: "Comparar",
		jFaq: "Preguntas",
		flights: "Vuelos directos desde",
		compareWith: (c) => `Comparar ${c} con`,
		vsTitle: (a, b) => `${a} vs ${b}: los mejores hoteles, cara a cara`,
		vsLead: (a, b) => `Nuestros hoteles Económico, Mejor calidad-precio y Lujo en ${a} y ${b}, con notas y precios de referencia, para elegir ciudad y hotel de un vistazo.`,
		cheapNav: "Ciudades más baratas",
		cheapTitle: "Las ciudades más baratas para dormir en un buen hotel",
		cheapLead: (n) => `${n} destinos ordenados por el precio de referencia de nuestro hotel Económico, con nota de 7,5/10 o más. Dos adultos, una habitación.`,
		under: "Menos de",
		all: "Todos",
		embedTitle: "Añade este Top 3 a tu blog o web",
		embedHow: "Copia este código. Muestra los tres hoteles con fotos y enlaces, y se actualiza solo.",
		newsTitle: "3 ciudades, 9 hoteles, cada viernes",
		newsLead: "Un email corto con tres destinos y sus hoteles Económico, Mejor calidad-precio y Lujo. Sin spam, te das de baja con un clic.",
		newsBtn: "Suscribirme",
		emailPh: "Tu email",
		nfTitle: "Esta página se ha perdido",
		nfLead: "Busca cualquier ciudad o empieza por una de estas.",
		savedTitle: "Tus hoteles guardados",
		savedLead: "Se guardan solo en este dispositivo. Sin cuenta.",
		priceRef: (d) => `Precio de referencia, revisado el ${d}`,
		guests: "Adultos",
		rooms: "Habitaciones",
		currency: "Moneda"
	},
	de: {
		js: js({
			search: "Stadt suchen",
			ph: "Stadt eingeben: London, Rom, München…",
			surprise: "Überrasch mich",
			none: "Keine Stadt gefunden. Versuche eine andere Schreibweise.",
			save: "Merken",
			saved: "Gemerkt",
			recent: "Zuletzt angesehen",
			share: "Teilen",
			copied: "Link kopiert",
			total: "≈ {p} für {n} Nächte",
			approx: "ca.",
			empty: "Noch nichts gemerkt. Tippe bei einem Hotel auf ♡.",
			ok: "Danke! Du bist dabei.",
			err: "Etwas ist schiefgelaufen. Bitte erneut versuchen.",
			open: "Öffnen",
			remove: "Entfernen"
		}),
		whyScore: (s, n) => `${s}/10 aus ${n} Gästebewertungen`,
		whyFrom: (n) => `Ausgewählt aus ${n} Hotels`,
		in1: "In 1 Sekunde",
		jHotels: "Hotels",
		jWhere: "Wo übernachten",
		jMap: "Karte",
		jCompare: "Vergleich",
		jFaq: "FAQ",
		flights: "Direktflüge ab",
		compareWith: (c) => `${c} vergleichen mit`,
		vsTitle: (a, b) => `${a} vs. ${b}: die besten Hotels im direkten Vergleich`,
		vsLead: (a, b) => `Unsere Budget-, Preis-Leistungs- und Luxus-Tipps in ${a} und ${b} mit Bewertungen und Referenzpreisen: Stadt und Hotel auf einen Blick wählen.`,
		cheapNav: "Günstigste Städte",
		cheapTitle: "Die günstigsten Städte für ein gutes Hotel",
		cheapLead: (n) => `${n} Reiseziele, sortiert nach dem Referenzpreis unseres Budget-Tipps (Bewertung ab 7,5/10). Zwei Erwachsene, ein Zimmer.`,
		under: "Unter",
		all: "Alle",
		embedTitle: "Diese Top 3 in deinen Blog oder deine Website einbauen",
		embedHow: "Code kopieren. Zeigt die drei Hotels mit Fotos und Links und bleibt aktuell.",
		newsTitle: "3 Städte, 9 Hotels, jeden Freitag",
		newsLead: "Eine kurze E-Mail mit drei Reisezielen und ihren Budget-, Preis-Leistungs- und Luxus-Tipps. Kein Spam, Abmeldung mit einem Klick.",
		newsBtn: "Abonnieren",
		emailPh: "Deine E-Mail",
		nfTitle: "Diese Seite hat sich verlaufen",
		nfLead: "Suche eine Stadt oder starte mit einer dieser.",
		savedTitle: "Deine gemerkten Hotels",
		savedLead: "Nur auf diesem Gerät gespeichert. Kein Konto nötig.",
		priceRef: (d) => `Referenzpreis, geprüft am ${d}`,
		guests: "Erwachsene",
		rooms: "Zimmer",
		currency: "Währung"
	},
	fr: {
		js: js({
			search: "Chercher une ville",
			ph: "Tapez une ville : Londres, Rome, Munich…",
			surprise: "Surprenez-moi",
			none: "Aucune ville trouvée. Essayez une autre orthographe.",
			save: "Enregistrer",
			saved: "Enregistré",
			recent: "Vus récemment",
			share: "Partager",
			copied: "Lien copié",
			total: "≈ {p} pour {n} nuits",
			approx: "env.",
			empty: "Rien d'enregistré pour l'instant. Touchez ♡ sur un hôtel.",
			ok: "Merci ! Vous êtes inscrit.",
			err: "Une erreur s'est produite. Réessayez.",
			open: "Ouvrir",
			remove: "Retirer"
		}),
		whyScore: (s, n) => `${s}/10 sur ${n} avis clients`,
		whyFrom: (n) => `Choisi parmi ${n} hôtels`,
		in1: "En 1 seconde",
		jHotels: "Hôtels",
		jWhere: "Où dormir",
		jMap: "Carte",
		jCompare: "Comparer",
		jFaq: "FAQ",
		flights: "Vols directs depuis",
		compareWith: (c) => `Comparer ${c} avec`,
		vsTitle: (a, b) => `${a} ou ${b} : les meilleurs hôtels face à face`,
		vsLead: (a, b) => `Nos choix Petit budget, Meilleur rapport qualité-prix et Luxe à ${a} et ${b}, avec notes et prix de référence, pour choisir la ville et l'hôtel d'un coup d'œil.`,
		cheapNav: "Villes les moins chères",
		cheapTitle: "Les villes les moins chères pour un bon hôtel",
		cheapLead: (n) => `${n} destinations classées selon le prix de référence de notre choix Petit budget, noté 7,5/10 ou plus. Deux adultes, une chambre.`,
		under: "Moins de",
		all: "Toutes",
		embedTitle: "Ajoutez ce Top 3 à votre blog ou site",
		embedHow: "Copiez ce code. Il affiche les trois hôtels avec photos et liens, et reste à jour.",
		newsTitle: "3 villes, 9 hôtels, chaque vendredi",
		newsLead: "Un e-mail court avec trois destinations et leurs choix Petit budget, Rapport qualité-prix et Luxe. Pas de spam, désinscription en un clic.",
		newsBtn: "S'abonner",
		emailPh: "Votre e-mail",
		nfTitle: "Cette page s'est égarée",
		nfLead: "Cherchez une ville ou commencez par l'une de celles-ci.",
		savedTitle: "Vos hôtels enregistrés",
		savedLead: "Enregistrés sur cet appareil uniquement. Sans compte.",
		priceRef: (d) => `Prix de référence, vérifié le ${d}`,
		guests: "Adultes",
		rooms: "Chambres",
		currency: "Devise"
	},
	it: {
		js: js({
			search: "Cerca una città",
			ph: "Scrivi una città: Londra, Roma, Monaco…",
			surprise: "Sorprendimi",
			none: "Nessuna città trovata. Prova un'altra grafia.",
			save: "Salva",
			saved: "Salvato",
			recent: "Visti di recente",
			share: "Condividi",
			copied: "Link copiato",
			total: "≈ {p} per {n} notti",
			approx: "circa",
			empty: "Ancora niente di salvato. Tocca ♡ su un hotel.",
			ok: "Grazie! Sei iscritto.",
			err: "Qualcosa è andato storto. Riprova.",
			open: "Apri",
			remove: "Rimuovi"
		}),
		whyScore: (s, n) => `${s}/10 su ${n} recensioni`,
		whyFrom: (n) => `Scelto tra ${n} hotel`,
		in1: "In 1 secondo",
		jHotels: "Hotel",
		jWhere: "Dove dormire",
		jMap: "Mappa",
		jCompare: "Confronta",
		jFaq: "FAQ",
		flights: "Voli diretti da",
		compareWith: (c) => `Confronta ${c} con`,
		vsTitle: (a, b) => `${a} o ${b}: i migliori hotel a confronto`,
		vsLead: (a, b) => `Le nostre scelte Economico, Miglior rapporto qualità-prezzo e Lusso a ${a} e ${b}, con voti e prezzi di riferimento, per scegliere città e hotel in un attimo.`,
		cheapNav: "Città più economiche",
		cheapTitle: "Le città più economiche per un buon hotel",
		cheapLead: (n) => `${n} destinazioni ordinate per il prezzo di riferimento della nostra scelta Economica, con voto da 7,5/10 in su. Due adulti, una camera.`,
		under: "Sotto",
		all: "Tutte",
		embedTitle: "Aggiungi questa Top 3 al tuo blog o sito",
		embedHow: "Copia questo codice. Mostra i tre hotel con foto e link, sempre aggiornati.",
		newsTitle: "3 città, 9 hotel, ogni venerdì",
		newsLead: "Una breve email con tre destinazioni e le loro scelte Economico, Qualità-prezzo e Lusso. Niente spam, disiscrizione con un clic.",
		newsBtn: "Iscriviti",
		emailPh: "La tua email",
		nfTitle: "Questa pagina si è persa",
		nfLead: "Cerca una città o inizia da una di queste.",
		savedTitle: "I tuoi hotel salvati",
		savedLead: "Salvati solo su questo dispositivo. Nessun account.",
		priceRef: (d) => `Prezzo di riferimento, verificato il ${d}`,
		guests: "Adulti",
		rooms: "Camere",
		currency: "Valuta"
	},
	pt: {
		js: js({
			search: "Pesquisar uma cidade",
			ph: "Escreva uma cidade: Londres, Roma, Munique…",
			surprise: "Surpreenda-me",
			none: "Nenhuma cidade encontrada. Tente outra grafia.",
			save: "Guardar",
			saved: "Guardado",
			recent: "Vistos recentemente",
			share: "Partilhar",
			copied: "Link copiado",
			total: "≈ {p} por {n} noites",
			approx: "aprox.",
			empty: "Ainda não guardou nada. Toque em ♡ num hotel.",
			ok: "Obrigado! Já está na lista.",
			err: "Algo correu mal. Tente novamente.",
			open: "Abrir",
			remove: "Remover"
		}),
		whyScore: (s, n) => `${s}/10 em ${n} avaliações`,
		whyFrom: (n) => `Escolhido entre ${n} hotéis`,
		in1: "Em 1 segundo",
		jHotels: "Hotéis",
		jWhere: "Onde ficar",
		jMap: "Mapa",
		jCompare: "Comparar",
		jFaq: "FAQ",
		flights: "Voos diretos de",
		compareWith: (c) => `Comparar ${c} com`,
		vsTitle: (a, b) => `${a} ou ${b}: os melhores hotéis lado a lado`,
		vsLead: (a, b) => `As nossas escolhas Económico, Melhor custo-benefício e Luxo em ${a} e ${b}, com notas e preços de referência, para escolher cidade e hotel num instante.`,
		cheapNav: "Cidades mais baratas",
		cheapTitle: "As cidades mais baratas para um bom hotel",
		cheapLead: (n) => `${n} destinos ordenados pelo preço de referência da nossa escolha Económica, com nota de 7,5/10 ou mais. Dois adultos, um quarto.`,
		under: "Até",
		all: "Todas",
		embedTitle: "Adicione este Top 3 ao seu blog ou site",
		embedHow: "Copie este código. Mostra os três hotéis com fotos e links, sempre atualizados.",
		newsTitle: "3 cidades, 9 hotéis, todas as sextas",
		newsLead: "Um email curto com três destinos e as escolhas Económico, Custo-benefício e Luxo. Sem spam, cancele com um clique.",
		newsBtn: "Subscrever",
		emailPh: "O seu email",
		nfTitle: "Esta página perdeu-se",
		nfLead: "Pesquise uma cidade ou comece por uma destas.",
		savedTitle: "Os seus hotéis guardados",
		savedLead: "Guardados só neste dispositivo. Sem conta.",
		priceRef: (d) => `Preço de referência, verificado a ${d}`,
		guests: "Adultos",
		rooms: "Quartos",
		currency: "Moeda"
	},
	da: {
		js: js({
			search: "Søg en by",
			ph: "Skriv en by: London, Rom, München…",
			surprise: "Overrask mig",
			none: "Ingen by fundet. Prøv en anden stavemåde.",
			save: "Gem",
			saved: "Gemt",
			recent: "Senest set",
			share: "Del",
			copied: "Link kopieret",
			total: "≈ {p} for {n} nætter",
			approx: "ca.",
			empty: "Intet gemt endnu. Tryk ♡ på et hotel.",
			ok: "Tak! Du er tilmeldt.",
			err: "Noget gik galt. Prøv igen.",
			open: "Åbn",
			remove: "Fjern"
		}),
		whyScore: (s, n) => `${s}/10 fra ${n} gæsteanmeldelser`,
		whyFrom: (n) => `Valgt blandt ${n} hoteller`,
		in1: "På 1 sekund",
		jHotels: "Hoteller",
		jWhere: "Hvor skal man bo",
		jMap: "Kort",
		jCompare: "Sammenlign",
		jFaq: "FAQ",
		flights: "Direkte fly fra",
		compareWith: (c) => `Sammenlign ${c} med`,
		vsTitle: (a, b) => `${a} eller ${b}: de bedste hoteller side om side`,
		vsLead: (a, b) => `Vores Budget-, Bedste værdi- og Luksusvalg i ${a} og ${b} med bedømmelser og referencepriser, så du kan vælge by og hotel med ét blik.`,
		cheapNav: "Billigste byer",
		cheapTitle: "De billigste byer til et godt hotel",
		cheapLead: (n) => `${n} destinationer sorteret efter referenceprisen på vores Budget-valg, bedømt 7,5/10 eller bedre. To voksne, ét værelse.`,
		under: "Under",
		all: "Alle",
		embedTitle: "Tilføj denne Top 3 til din blog eller hjemmeside",
		embedHow: "Kopiér koden. Den viser de tre hoteller med billeder og links og holder sig opdateret.",
		newsTitle: "3 byer, 9 hoteller, hver fredag",
		newsLead: "En kort e-mail med tre destinationer og deres Budget-, Værdi- og Luksusvalg. Ingen spam, afmeld med ét klik.",
		newsBtn: "Tilmeld",
		emailPh: "Din e-mail",
		nfTitle: "Denne side er faret vild",
		nfLead: "Søg en by, eller start med en af disse.",
		savedTitle: "Dine gemte hoteller",
		savedLead: "Gemt kun på denne enhed. Ingen konto.",
		priceRef: (d) => `Referencepris, tjekket ${d}`,
		guests: "Voksne",
		rooms: "Værelser",
		currency: "Valuta"
	}
};
var ALIASES = {
	londres: "london",
	londra: "london",
	londen: "london",
	roma: "rome",
	rom: "rome",
	munich: "munich",
	munchen: "munich",
	munique: "munich",
	monaco: "munich",
	"monaco di baviera": "munich",
	lisboa: "lisbon",
	lissabon: "lisbon",
	lisbonne: "lisbon",
	lisbona: "lisbon",
	copenhague: "copenhagen",
	kobenhavn: "copenhagen",
	kopenhagen: "copenhagen",
	copenaghen: "copenhagen",
	copenhaga: "copenhagen",
	atenas: "athens",
	athen: "athens",
	athenes: "athens",
	atene: "athens",
	praga: "prague",
	prag: "prague",
	viena: "vienna",
	wien: "vienna",
	vienne: "vienna",
	"viena de austria": "vienna",
	venecia: "venice",
	venezia: "venice",
	venedig: "venice",
	veneza: "venice",
	venise: "venice",
	florencia: "florence",
	firenze: "florence",
	florenz: "florence",
	florenca: "florence",
	milan: "milan",
	milano: "milan",
	mailand: "milan",
	milao: "milan",
	napoles: "naples",
	napoli: "naples",
	neapel: "naples",
	bruselas: "brussels",
	bruxelles: "brussels",
	brussel: "brussels",
	bruxelas: "brussels",
	colonia: "cologne",
	koln: "cologne",
	ginebra: "geneva",
	geneve: "geneva",
	genf: "geneva",
	ginevra: "geneva",
	genebra: "geneva",
	estocolmo: "stockholm",
	stoccolma: "stockholm",
	varsovia: "warsaw",
	warszawa: "warsaw",
	warschau: "warsaw",
	varsavia: "warsaw",
	cracovia: "krakow",
	krakau: "krakow",
	cracovie: "krakow",
	estambul: "istanbul",
	istambul: "istanbul",
	"nueva york": "new-york",
	"nova iorque": "new-york",
	"new york city": "new-york",
	nyc: "new-york",
	"el cairo": "cairo",
	"le caire": "cairo",
	"il cairo": "cairo",
	kairo: "cairo",
	pekin: "beijing",
	pechino: "beijing",
	dublin: "dublin-ireland",
	dublino: "dublin-ireland",
	edimburgo: "edinburgh",
	amsterdan: "amsterdam",
	amsterdao: "amsterdam",
	berlin: "berlin",
	berlim: "berlin",
	berlino: "berlin",
	paris: "paris",
	parigi: "paris",
	barcelone: "barcelona",
	barcellona: "barcelona",
	sevilla: "seville",
	seville: "seville",
	siviglia: "seville",
	sevilha: "seville",
	tokio: "tokyo",
	toquio: "tokyo",
	"ciudad de mexico": "mexico-city",
	"cidade do mexico": "mexico-city",
	belgrado: "belgrade",
	bucarest: "bucharest",
	bukarest: "bucharest",
	oslo: "oslo",
	helsinki: "helsinki",
	"helsingfors": "helsinki",
	zurich: "zurich",
	zurigo: "zurich",
	"aarhus": "aarhus",
	"arhus": "aarhus",
	aal: "aalborg",
	aar: "aarhus",
	agp: "malaga",
	alc: "alicante",
	ams: "amsterdam",
	arn: "stockholm",
	ath: "athens",
	ayt: "antalya",
	bcn: "barcelona",
	ber: "berlin",
	bgo: "bergen",
	bgy: "milan",
	bkk: "bangkok",
	bll: "billund",
	bru: "brussels",
	bud: "budapest",
	bzo: "bolzano",
	cdg: "paris",
	cfu: "corfu",
	chq: "chania",
	cia: "rome",
	clj: "cluj-napoca",
	cph: "copenhagen",
	cpt: "cape-town",
	cun: "cancun",
	dps: "bali",
	dub: "dublin-ireland",
	dxb: "dubai",
	edi: "edinburgh",
	ewr: "new-york",
	eze: "buenos-aires",
	fae: "torshavn",
	fco: "rome",
	flr: "florence",
	fnc: "funchal",
	fra: "frankfurt",
	gdn: "gdansk",
	gig: "rio-de-janeiro",
	goh: "nuuk",
	gva: "geneva",
	gzp: "alanya",
	ham: "hamburg",
	hel: "helsinki",
	hkg: "hong-kong",
	hnd: "tokyo",
	hrg: "hurghada",
	ias: "iasi",
	ibz: "ibiza",
	ioa: "ioannina",
	ist: "istanbul",
	jfk: "new-york",
	kef: "reykjavik",
	krk: "krakow",
	ktw: "krakow",
	las: "las-vegas",
	lax: "los-angeles",
	lcy: "london",
	lga: "new-york",
	lgw: "london",
	lhr: "london",
	lin: "milan",
	lis: "lisbon",
	lpa: "las-palmas-de-gran-canaria",
	ltn: "london",
	mad: "madrid",
	mex: "mexico-city",
	mia: "miami",
	mjt: "mytilene",
	mla: "valletta",
	muc: "munich",
	mxp: "milan",
	nap: "naples",
	nce: "nice",
	nrt: "tokyo",
	opo: "porto",
	ord: "chicago",
	ory: "paris",
	osl: "oslo",
	otp: "bucharest",
	pfo: "paphos",
	pmi: "palma",
	prg: "prague",
	pvk: "lefkada",
	rix: "riga",
	rnn: "ronne",
	saw: "istanbul",
	scr: "salen",
	sfo: "san-francisco",
	sin: "singapore",
	stn: "london",
	svq: "seville",
	syd: "sydney",
	tia: "tirana",
	vce: "venice",
	vie: "vienna",
	vlc: "valencia-spain",
	vno: "vilnius",
	vrn: "verona",
	waw: "warsaw",
	yyz: "toronto",
	zad: "zadar",
	zrh: "zurich",
	zth: "zakynthos"
};
/** Styles added on top of the base CSS. */
var CSS_PLUS = `@view-transition{navigation:auto}
.price,.pricetag,.v2-price,td{font-variant-numeric:tabular-nums lining-nums}
.tbtn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-width:44px;min-height:44px;border:1px solid var(--line);border-radius:999px;background:var(--card);color:var(--ink);font:inherit;font-size:13px;cursor:pointer;padding:0 12px}
.tbtn:hover{border-color:var(--ink)}.tbtn kbd{font:600 11px var(--sans);border:1px solid var(--line);border-radius:5px;padding:1px 5px;color:var(--muted)}
.tbtn .n{background:var(--coral);color:#fff;border-radius:999px;font-size:10.5px;font-weight:700;padding:1px 6px;margin-left:2px}
@media (max-width:640px){.tbtn kbd,.tbtn .lbl{display:none}}
@media (max-width:560px){.top nav>a:first-child{display:none}.tbtn{min-width:42px;min-height:42px;padding:0 10px}.in1 a{padding:9px 12px}.in1h{margin-top:16px}}
.pal{position:fixed;inset:0;z-index:120;background:#05090fb3;display:flex;align-items:flex-start;justify-content:center;padding:10vh 16px 16px;backdrop-filter:blur(4px)}
.pal>div{width:min(620px,100%);background:var(--card);border:1px solid var(--line);border-radius:20px;box-shadow:0 30px 80px #0007;overflow:hidden;animation:palin .18s ease-out both}
@keyframes palin{from{transform:translateY(-8px) scale(.98);opacity:0}to{transform:none;opacity:1}}
.pal input{width:100%;border:0;border-bottom:1px solid var(--line);background:transparent;color:var(--ink);font:500 19px var(--sans);padding:20px 22px;outline:0}
.pal ul{list-style:none;margin:0;padding:8px;max-height:52vh;overflow:auto}
.pal li a{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:12px 14px;border-radius:12px;color:var(--ink);text-decoration:none;min-height:48px}
.pal li a span{color:var(--muted);font-size:13px}.pal li a[aria-selected=true],.pal li a:hover{background:var(--soft)}
.pal .foot{display:flex;justify-content:space-between;gap:10px;padding:10px 14px;border-top:1px solid var(--line);font-size:12.5px;color:var(--muted)}.pal .foot a{color:var(--ink);font-weight:600}
.acts{display:flex;gap:6px;position:absolute;right:10px;top:12px;z-index:3}
.acts button{width:40px;height:40px;border-radius:50%;border:0;background:#fffffff0;color:#10213a;font-size:18px;line-height:1;display:grid;place-items:center;cursor:pointer;box-shadow:0 3px 12px #0003;transition:transform .15s ease}
.acts button:hover{transform:scale(1.08)}.acts button.on{color:#d83b51}.acts button.pop{animation:pop .45s ease}
@keyframes pop{0%{transform:scale(1)}35%{transform:scale(1.35)}70%{transform:scale(.92)}100%{transform:scale(1)}}
.cityphoto{right:auto!important;left:12px;top:auto!important;bottom:62px}
.ring{--p:0;width:52px;height:52px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#fff calc(var(--p)*1%),#ffffff40 0);box-shadow:0 4px 14px #0004}
.ring b{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:#10213a;color:#fff;font:700 15px/1 var(--sans)}
.badge span:first-child{padding:7px 12px 7px 10px;border-radius:6px 999px 999px 6px}
.card.lux .badge span:first-child{background:linear-gradient(135deg,#b8860b,#e3c26a 50%,#9a6b00);color:#10213a}
.why{list-style:none;margin:0;padding:10px 12px;background:var(--soft);border-radius:12px;display:grid;gap:5px;font-size:12.5px}
.why li{display:flex;gap:8px;align-items:baseline}.why li:before{content:"✓";color:var(--c);font-weight:800}
.total{font-weight:600;color:var(--ink)}
.cmp a{display:inline-flex;align-items:center;min-height:36px}
.cards .card{animation:rise .6s cubic-bezier(.2,.7,.2,1) both}.cards .card:nth-child(2){animation-delay:.08s}.cards .card:nth-child(3){animation-delay:.16s}
@keyframes rise{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
.media .alt{position:absolute;inset:0;opacity:0;transition:opacity .35s ease}.card:hover .media .alt.ready{opacity:1}
.in1{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:16px 0 0}
.in1 a{display:flex;flex-direction:column;gap:2px;padding:12px 14px;border-radius:14px;background:var(--card);border:1px solid var(--line);border-top:4px solid var(--c);text-decoration:none;color:var(--ink)}
.in1 a small{font-size:10.5px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);font-weight:700}.in1 a strong{font:600 16px/1.25 var(--serif)}.in1 a span{font-size:12.5px;color:var(--muted)}
.in1 .budget{--c:var(--budget)}.in1 .value{--c:var(--value)}.in1 .lux{--c:var(--lux)}
.in1h{display:flex;align-items:center;gap:8px;margin:22px 0 0;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted)}.in1h:before{content:"⚡"}
@media (max-width:700px){.in1{grid-template-columns:1fr}.in1 a{flex-direction:row;flex-wrap:wrap;align-items:baseline;gap:4px 10px}}
.jump{position:sticky;top:66px;z-index:30;display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;margin:18px -16px 0;padding:8px 16px;background:color-mix(in srgb,var(--paper) 92%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.jump::-webkit-scrollbar{display:none}.jump a{flex:none;font-size:13px;font-weight:600;color:var(--ink);text-decoration:none;padding:8px 14px;border-radius:999px;min-height:40px;display:inline-flex;align-items:center}.jump a:hover,.jump a.on{background:var(--soft)}
section[id],h2[id]{scroll-margin-top:130px}#hotels{scroll-margin-top:130px}
.flights{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:10px 2px 0;font-size:12.5px;color:var(--muted)}.flights a{font-weight:600;color:var(--ink);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:5px 11px;min-height:34px;display:inline-flex;align-items:center;background:var(--card)}
.plan select{font:inherit;border:1px solid var(--line);border-radius:12px;padding:9px 10px;min-height:46px;color:var(--ink);background:var(--paper)}
main section>h2:before{content:"";display:block;width:34px;height:3px;border-radius:3px;background:var(--coral);margin:0 0 14px}
.chipsrow{display:flex;flex-wrap:wrap;gap:8px}.chipsrow a{border:1px solid var(--line);background:var(--card);border-radius:999px;padding:8px 14px;min-height:40px;display:inline-flex;align-items:center;gap:6px;color:var(--ink);text-decoration:none;font-size:13.5px}.chipsrow a:hover{border-color:var(--ink)}
.news{display:grid;grid-template-columns:1.2fr 1fr;gap:20px;align-items:center;background:linear-gradient(135deg,#10213a,#13417a);color:#fff;border-radius:22px;padding:26px 28px}
.news h2{color:#fff;margin:0 0 6px}.news h2:before{background:#ff8a9a}.news p{margin:0;color:#dfe7f1;font-size:14.5px}
.news form{display:flex;gap:8px;flex-wrap:wrap}.news input{flex:1 1 200px;min-height:50px;border-radius:12px;border:0;padding:0 14px;font:inherit;font-size:16px}.news .btn{background:#ff6b7f;color:#10213a}
@media (max-width:760px){.news{grid-template-columns:1fr}}
.lb{flex-direction:column;gap:12px}.lb .nav{position:absolute;top:50%;transform:translateY(-50%);width:52px;height:52px;border-radius:50%;border:0;background:#ffffffe6;color:#10213a;font-size:24px;cursor:pointer}.lb .prev{left:14px}.lb .next{right:14px}
.lb .cnt{color:#dfe7f1;font-size:13px}.lb .x{position:absolute;top:14px;right:14px;width:46px;height:46px;border-radius:50%;border:0;background:#ffffffe6;font-size:22px;cursor:pointer}
.vs{display:grid;grid-template-columns:1fr 1fr;gap:18px}.vs>div{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:18px;box-shadow:var(--shadow)}.vs h2{font-size:28px;margin:0 0 10px}
.vs .row{display:flex;justify-content:space-between;gap:10px;padding:12px 0;border-top:1px solid var(--line);font-size:14px}.vs .row b{display:block;font:600 16px/1.25 var(--serif)}.vs .row small{color:var(--muted)}.vs .row .pr{text-align:right;white-space:nowrap}
@media (max-width:700px){.vs{grid-template-columns:1fr}}
.filters{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0}.filters button{font:inherit;font-size:13.5px;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:999px;padding:8px 16px;min-height:42px;cursor:pointer}.filters button[aria-pressed=true]{background:var(--ink);color:var(--paper);border-color:var(--ink)}
.rank td:first-child{font:600 18px var(--serif);color:var(--muted);width:44px}
.saved{display:grid;gap:12px}.saved .it{display:flex;gap:14px;align-items:center;background:var(--card);border:1px solid var(--line);border-left:4px solid var(--c);border-radius:16px;padding:12px}
.saved .it img{width:84px;height:64px;object-fit:cover;border-radius:10px;background:var(--soft)}.saved .it div{flex:1}.saved .it b{font:600 17px/1.2 var(--serif);display:block}.saved .it small{color:var(--muted)}
.saved .budget{--c:var(--budget)}.saved .value{--c:var(--value)}.saved .lux{--c:var(--lux)}
.ok-flash{animation:pop .45s ease}
@media print{.jump,.acts,.news,.tbtn,.flights{display:none!important}.cards{display:block}.card{break-inside:avoid;margin-bottom:12px;box-shadow:none}}`;
/** Client features shared by every server-rendered page. Reads window.T3S (strings) and window.T3L (language). */
var JS_PLUS = `(function(){var S=window.T3S||{},L=window.T3L||'en',pre=L==='en'?'':'/'+L;
function ls(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(k)||'null');localStorage.setItem(k,JSON.stringify(v))}catch(_){return null}}
function norm(s){return String(s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]+/g,' ').replace(/\\s+/g,' ').trim()}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function lev(a,b){if(Math.abs(a.length-b.length)>2)return 9;var d=[],i,j;for(i=0;i<=a.length;i++)d[i]=[i];for(j=0;j<=b.length;j++)d[0][j]=j;for(i=1;i<=a.length;i++)for(j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[a.length][b.length]}
var IDX=null,AL=${JSON.stringify(ALIASES)};function idx(){return IDX?Promise.resolve(IDX):fetch('/api/cities.json').then(function(r){return r.json()}).then(function(j){IDX=j.map(function(c){return{s:c[0],c:c[1],k:c[2],p:c[3],n:norm(c[1]),nk:norm(c[2])}});return IDX})}
function find(q){q=norm(q);if(!q)return IDX.slice().sort(function(a,b){return b.p-a.p}).slice(0,8);var al=AL[q]||AL[q.replace(/ae/g,'a').replace(/oe/g,'o').replace(/ue/g,'u')]||AL[q.replace(/ö/g,'o')],out=[];IDX.forEach(function(c){var sc=0;if(al&&c.s===al)sc=1000;else if(c.n===q)sc=900;else if(c.n.indexOf(q)===0)sc=700;else if(c.n.indexOf(' '+q)>=0)sc=500;else if(q.length>3&&lev(q,c.n.slice(0,q.length))<=(q.length>6?2:1))sc=300;else if(c.nk.indexOf(q)===0)sc=150;if(sc)out.push([sc+Math.log(1+c.p),c])});return out.sort(function(a,b){return b[0]-a[0]}).slice(0,8).map(function(x){return x[1]})}
function palette(){if(document.querySelector('.pal'))return;var w=document.createElement('div');w.className='pal';w.setAttribute('role','dialog');w.setAttribute('aria-modal','true');w.setAttribute('aria-label',S.search);w.innerHTML='<div><input type="search" autocomplete="off" spellcheck="false" aria-label="'+esc(S.search)+'" placeholder="'+esc(S.ph)+'"><ul role="listbox"></ul><div class="foot"><a href="/random" data-t="surprise">🎲 '+esc(S.surprise)+'</a><span>↑ ↓ · Enter · Esc</span></div></div>';document.body.appendChild(w);var inp=w.querySelector('input'),ul=w.querySelector('ul'),sel=0,res=[];
function draw(){ul.innerHTML=res.length?res.map(function(c,i){return '<li><a role="option" aria-selected="'+(i===sel)+'" href="'+pre+'/'+c.s+'">'+esc(c.c)+' <span>'+esc(c.k)+'</span></a></li>'}).join(''):'<li style="padding:14px;color:var(--muted)">'+esc(S.none)+'</li>'}
function run(){idx().then(function(){res=find(inp.value);sel=0;draw()})}
function close(){w.remove()}inp.addEventListener('input',run);w.addEventListener('click',function(e){if(e.target===w)close()});inp.addEventListener('keydown',function(e){if(e.key==='Escape')close();else if(e.key==='ArrowDown'){sel=Math.min(sel+1,res.length-1);draw();e.preventDefault()}else if(e.key==='ArrowUp'){sel=Math.max(sel-1,0);draw();e.preventDefault()}else if(e.key==='Enter'&&res[sel]){location.href=pre+'/'+res[sel].s}});run();setTimeout(function(){inp.focus()},10);if(window.t3track)t3track('search_open',{})}
document.addEventListener('keydown',function(e){var t=e.target,typing=t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT'||t.isContentEditable);if(!typing&&(e.key==='/'||((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'))){e.preventDefault();palette()}});
document.addEventListener('click',function(e){if(e.target.closest('[data-pal]')){e.preventDefault();palette()}});
/* saved hotels */
function favs(){return ls('t3-fav')||[]}function savedCount(){var n=favs().length;document.querySelectorAll('[data-savedn]').forEach(function(el){el.textContent=n;el.hidden=!n})}
function markFav(){var f=favs().map(function(x){return x.k});document.querySelectorAll('[data-fav]').forEach(function(b){var on=f.indexOf(JSON.parse(b.getAttribute('data-fav')).k)>=0;b.classList.toggle('on',on);b.textContent=on?'♥':'♡';b.setAttribute('aria-pressed',on);b.setAttribute('aria-label',on?S.saved:S.save)})}
document.addEventListener('click',function(e){var b=e.target.closest('[data-fav]');if(!b)return;e.preventDefault();var d=JSON.parse(b.getAttribute('data-fav')),f=favs(),i=-1;f.forEach(function(x,j){if(x.k===d.k)i=j});if(i>=0)f.splice(i,1);else f.unshift(d);ls('t3-fav',f.slice(0,60));markFav();savedCount();b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');if(window.t3track)t3track(i>=0?'unsave':'save',{city:d.s,category:d.cat})});
markFav();savedCount();
/* share one card */
document.addEventListener('click',function(e){var b=e.target.closest('[data-sharecard]');if(!b)return;e.preventDefault();var u=b.getAttribute('data-sharecard'),t=b.getAttribute('data-title');var done=function(){b.textContent='✓';b.classList.add('pop');setTimeout(function(){b.textContent='↗';b.classList.remove('pop')},1600)};if(navigator.share&&matchMedia('(pointer:coarse)').matches)navigator.share({url:u,title:t}).catch(function(){});else if(navigator.clipboard)navigator.clipboard.writeText(u).then(done);if(window.t3track)t3track('share',{p:'card'})});
/* recently viewed */
var me=document.querySelector('[data-track]');if(me){var r=ls('t3-recent')||[],d=JSON.parse(me.getAttribute('data-track'));r=r.filter(function(x){return x.s!==d.s});r.unshift(d);ls('t3-recent',r.slice(0,10))}
document.querySelectorAll('[data-recent]').forEach(function(box){var r=(ls('t3-recent')||[]).filter(function(x){return !me||x.s!==JSON.parse(me.getAttribute('data-track')).s}).slice(0,8);if(!r.length)return;box.hidden=false;box.querySelector('.chipsrow').innerHTML=r.map(function(x){return '<a href="'+pre+'/'+x.s+'">'+esc(x.c)+'</a>'}).join('')});
/* saved page */
var sv=document.querySelector('[data-savedpage]');if(sv){var draw=function(){var f=favs();sv.innerHTML=f.length?f.map(function(x,i){return '<div class="it '+esc(x.cat)+'">'+(x.img?'<img src="'+esc(x.img)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'')+'<div><small>'+esc(x.lbl)+' · '+esc(x.c)+'</small><b>'+esc(x.n)+'</b><small>'+esc(x.p||'')+'</small></div><a class="btn ghost" href="'+pre+'/'+esc(x.s)+'#'+esc(x.cat)+'">'+esc(S.open)+'</a><button class="tbtn" data-rm="'+i+'" aria-label="'+esc(S.remove)+'">✕</button></div>'}).join(''):'<p class="lead">'+esc(S.empty)+'</p>'};draw();sv.addEventListener('click',function(e){var b=e.target.closest('[data-rm]');if(!b)return;var f=favs();f.splice(+b.getAttribute('data-rm'),1);ls('t3-fav',f);draw();savedCount()})}
/* currency */
var CUR={EUR:1,GBP:.86,USD:1.08,DKK:7.46,SEK:11.4,NOK:11.6,CHF:.94};var cr=ls('t3-rates');if(cr&&Date.now()-cr.t<864e5)Object.assign(CUR,cr.r);else fetch('/api/rates').then(function(r){return r.json()}).then(function(j){if(j&&j.rates){Object.assign(CUR,j.rates);ls('t3-rates',{t:Date.now(),r:j.rates});paint()}}).catch(function(){});
function guessCur(){var l=(navigator.language||'').toLowerCase();if(/-gb$/.test(l))return'GBP';if(/-us$/.test(l))return'USD';if(/^da/.test(l))return'DKK';if(/^sv/.test(l))return'SEK';if(/^(nb|nn|no)/.test(l))return'NOK';if(/-ch$/.test(l))return'CHF';return'EUR'}
var cur=ls('t3-cur')||guessCur();function fmt(v){try{return new Intl.NumberFormat(L,{style:'currency',currency:cur,maximumFractionDigits:0}).format(v*CUR[cur])}catch(_){return Math.round(v)+' €'}}
function nights(){var f=document.querySelector('form.plan');if(!f||!f.querySelector('[name=checkin]'))return 0;var a=f.querySelector('[name=checkin]').value,b=f.querySelector('[name=checkout]').value;var n=Math.round((Date.parse(b)-Date.parse(a))/864e5);return n>0&&n<60?n:0}
function paint(){document.querySelectorAll('[data-eur]').forEach(function(el){var v=+el.getAttribute('data-eur');if(!v)return;var s=el.querySelector('.v')||el;s.textContent=fmt(v)});var n=nights(),f=document.querySelector('form.plan'),rooms=f&&f.querySelector('[name=rooms]')?+f.querySelector('[name=rooms]').value:1;document.querySelectorAll('[data-total]').forEach(function(el){var v=+el.getAttribute('data-total');el.textContent=n&&v?(S.total||'').replace('{p}',fmt(v*n*rooms)).replace('{n}',n):'';el.hidden=!(n&&v)});document.querySelectorAll('[data-cur]').forEach(function(s){s.value=cur})}
document.addEventListener('change',function(e){if(e.target.matches('[data-cur]')){cur=e.target.value;ls('t3-cur',cur);paint();if(window.t3track)t3track('currency',{c:cur})}});
/* guests, rooms and dates → every booking link on the page */
function t3cj(e){var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;if(!a)return;try{var u=new URL(a.href);if(!/(^|\.)booking\.com$/.test(u.hostname))return;u.searchParams.delete('aid');u.searchParams.delete('label');a.href='https://www.anrdoezrs.net/click-101900239-17293132?sid=t3web&url='+encodeURIComponent(u.toString())}catch(_){}}['mousedown','touchstart','keydown','click'].forEach(function(t){document.addEventListener(t,t3cj,true)});function relink(){var f=document.querySelector('form.plan');if(!f||!f.querySelector('[name=checkin]'))return;var ci=f.querySelector('[name=checkin]').value,co=f.querySelector('[name=checkout]').value,ad=f.querySelector('[name=adults]')?f.querySelector('[name=adults]').value:'2',ro=f.querySelector('[name=rooms]')?f.querySelector('[name=rooms]').value:'1',ok=ci&&co&&co>ci;document.querySelectorAll('a[href*="booking.com"],a[href*="anrdoezrs.net"],a[href*="expedia.com"],a[href*="agoda.com"]').forEach(function(a){try{var u=new URL(a.href),h=u.hostname,cj=null;if(/anrdoezrs/.test(h)){cj=u;u=new URL(cj.searchParams.get('url'));h=u.hostname}if(/booking/.test(h)){u.searchParams.set('group_adults',ad);u.searchParams.set('no_rooms',ro);if(ok){u.searchParams.set('checkin',ci);u.searchParams.set('checkout',co)}}else if(/expedia/.test(h)){u.searchParams.set('adults',ad);u.searchParams.set('rooms',ro);if(ok){u.searchParams.set('startDate',ci);u.searchParams.set('endDate',co)}}else{u.searchParams.set('adults',ad);u.searchParams.set('rooms',ro);if(ok){u.searchParams.set('checkIn',ci);u.searchParams.set('los',Math.round((Date.parse(co)-Date.parse(ci))/864e5))}}if(cj){cj.searchParams.set('url',u.toString());a.href=cj.toString()}else a.href=u.toString()}catch(_){}});paint()}
document.addEventListener('input',function(e){if(e.target.closest('form.plan'))relink()});document.addEventListener('change',function(e){if(e.target.closest('form.plan'))relink()});document.addEventListener('click',function(e){if(e.target.closest('[data-quick]'))setTimeout(relink,0)});
paint();
/* gallery lightbox with swipe, arrows and counter */
document.addEventListener('click',function(e){var im=e.target.closest('.media img');if(!im||e.target.closest('.acts'))return;e.preventDefault();var m=im.closest('.media'),g=[];try{g=JSON.parse(m.getAttribute('data-gallery')||'[]')}catch(_){}if(!g.length)g=[im.currentSrc||im.src];var i=Math.max(0,g.indexOf(im.getAttribute('src'))),d=document.createElement('div');d.className='lb';d.setAttribute('role','dialog');d.setAttribute('aria-label',im.alt||'Photo');d.innerHTML='<img alt="'+esc(im.alt||'')+'" referrerpolicy="no-referrer"><span class="cnt"></span><button class="x" aria-label="Close">✕</button>'+(g.length>1?'<button class="nav prev" aria-label="Previous">‹</button><button class="nav next" aria-label="Next">›</button>':'');var big=d.querySelector('img'),cnt=d.querySelector('.cnt');function show(k){i=(k+g.length)%g.length;big.src=g[i];cnt.textContent=(i+1)+' / '+g.length}show(i);function close(){d.remove();document.removeEventListener('keydown',key)}function key(ev){if(ev.key==='Escape')close();if(ev.key==='ArrowRight')show(i+1);if(ev.key==='ArrowLeft')show(i-1)}document.addEventListener('keydown',key);d.addEventListener('click',function(ev){if(ev.target.closest('.next'))show(i+1);else if(ev.target.closest('.prev'))show(i-1);else if(ev.target===d||ev.target.closest('.x'))close()});var x0=null;d.addEventListener('touchstart',function(ev){x0=ev.touches[0].clientX},{passive:true});d.addEventListener('touchend',function(ev){if(x0===null)return;var dx=ev.changedTouches[0].clientX-x0;if(Math.abs(dx)>40)show(i+(dx<0?1:-1));x0=null});document.body.appendChild(d);d.querySelector('.x').focus()},true);
/* desktop hover: reveal the second photo */
if(matchMedia('(hover:hover)').matches)document.querySelectorAll('.media[data-gallery]').forEach(function(m){var g=[];try{g=JSON.parse(m.getAttribute('data-gallery'))}catch(_){}if(g.length<2)return;m.addEventListener('mouseenter',function(){if(m.querySelector('.alt'))return;var a=new Image();a.className='alt';a.alt='';a.referrerPolicy='no-referrer';a.onload=function(){a.classList.add('ready')};a.onerror=function(){a.remove()};a.src=g[1];m.insertBefore(a,m.querySelector('.badge'))},{once:true})});
/* sticky jump-nav highlight */
var jl=document.querySelectorAll('.jump a');if(jl.length&&'IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting)jl.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+en.target.id)})})},{rootMargin:'-40% 0px -55% 0px'});jl.forEach(function(a){var s=document.querySelector(a.getAttribute('href'));if(s)io.observe(s)})}
/* newsletter */
var nf=document.querySelector('[data-news]');if(nf){fetch('/api/alerts').then(function(r){return r.json()}).then(function(j){if(!j.enabled){var s=nf.closest('section');if(s)s.hidden=true}}).catch(function(){});nf.addEventListener('submit',function(e){e.preventDefault();var em=nf.querySelector('input').value,msg=nf.querySelector('.msg');fetch('/api/alerts',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:em,city:'newsletter',category:L,max:1})}).then(function(r){msg.textContent=r.ok?S.ok:S.err;if(r.ok){nf.querySelector('input').value='';msg.classList.add('ok-flash');if(window.t3track)t3track('newsletter',{lang:L})}}).catch(function(){msg.textContent=S.err})})}
/* cheapest-cities filter */
document.querySelectorAll('[data-max]').forEach(function(b){b.addEventListener('click',function(){var mx=+b.getAttribute('data-max');document.querySelectorAll('[data-max]').forEach(function(x){x.setAttribute('aria-pressed',x===b)});document.querySelectorAll('tr[data-price]').forEach(function(tr){tr.hidden=mx>0&&+tr.getAttribute('data-price')>mx})})});
})();`;
var Z = {
	en: {
		disc: "We may earn a commission if you book. It never changes our picks.",
		consent: "We use cookies for booking-partner tracking and basic statistics. Essential cookies are always on.",
		accept: "Accept",
		reject: "Reject",
		more: "Cookie policy",
		filming: (c) => `Hotels in ${c}: we're filming our ${c} picks in late October 2026`,
		filmingLead: "Want your hotel in our videos and featured as a labelled partner on this page? Tell us now, we confirm one hotel per category.",
		hotelsTitle: (c) => `Run a hotel in ${c}?`,
		hotelsLead: "Get a free badge for your website, see how travellers find you, or apply for a labelled partner feature with photos and video.",
		hotelsCta: "Work with us"
	},
	es: {
		disc: "Podemos ganar una comisión si reservas. Nunca cambia nuestra elección.",
		consent: "Usamos cookies para el seguimiento de los socios de reserva y estadísticas básicas. Las esenciales están siempre activas.",
		accept: "Aceptar",
		reject: "Rechazar",
		more: "Política de cookies",
		filming: (c) => `Hoteles de ${c}: grabamos nuestra selección de ${c} a finales de octubre de 2026`,
		filmingLead: "¿Quieres tu hotel en nuestros vídeos y destacado como partner (siempre etiquetado) en esta página? Escríbenos ya, confirmamos un hotel por categoría.",
		hotelsTitle: (c) => `¿Tienes un hotel en ${c}?`,
		hotelsLead: "Consigue un sello gratis para tu web, descubre cómo te encuentran los viajeros o solicita aparecer como partner etiquetado con fotos y vídeo.",
		hotelsCta: "Colabora con nosotros"
	},
	de: {
		disc: "Wir erhalten ggf. eine Provision, wenn du buchst. Unsere Auswahl ändert das nie.",
		consent: "Wir nutzen Cookies für das Tracking unserer Buchungspartner und einfache Statistiken. Notwendige Cookies sind immer aktiv.",
		accept: "Akzeptieren",
		reject: "Ablehnen",
		more: "Cookie-Richtlinie",
		filming: (c) => `Hotels in ${c}: Ende Oktober 2026 filmen wir unsere Auswahl in ${c}`,
		filmingLead: "Möchtest du dein Hotel in unseren Videos und als gekennzeichneten Partner auf dieser Seite? Melde dich jetzt, wir bestätigen ein Hotel pro Kategorie.",
		hotelsTitle: (c) => `Du führst ein Hotel in ${c}?`,
		hotelsLead: "Hol dir ein kostenloses Siegel für deine Website oder bewirb dich als gekennzeichneter Partner mit Fotos und Video.",
		hotelsCta: "Mit uns arbeiten"
	},
	fr: {
		disc: "Nous pouvons toucher une commission si vous réservez. Cela ne change jamais nos choix.",
		consent: "Nous utilisons des cookies pour le suivi de nos partenaires de réservation et des statistiques simples. Les cookies essentiels sont toujours actifs.",
		accept: "Accepter",
		reject: "Refuser",
		more: "Politique cookies",
		filming: (c) => `Hôtels à ${c} : nous filmons notre sélection à ${c} fin octobre 2026`,
		filmingLead: "Votre hôtel dans nos vidéos et mis en avant comme partenaire (toujours signalé) sur cette page ? Écrivez-nous, nous confirmons un hôtel par catégorie.",
		hotelsTitle: (c) => `Vous gérez un hôtel à ${c} ?`,
		hotelsLead: "Obtenez un badge gratuit pour votre site ou proposez-vous comme partenaire signalé, avec photos et vidéo.",
		hotelsCta: "Travailler avec nous"
	},
	it: {
		disc: "Potremmo ricevere una commissione se prenoti. Non cambia mai le nostre scelte.",
		consent: "Usiamo cookie per il tracciamento dei partner di prenotazione e statistiche di base. I cookie essenziali sono sempre attivi.",
		accept: "Accetta",
		reject: "Rifiuta",
		more: "Cookie policy",
		filming: (c) => `Hotel a ${c}: a fine ottobre 2026 filmiamo la nostra selezione di ${c}`,
		filmingLead: "Vuoi il tuo hotel nei nostri video e in evidenza come partner (sempre indicato) su questa pagina? Scrivici, confermiamo un hotel per categoria.",
		hotelsTitle: (c) => `Gestisci un hotel a ${c}?`,
		hotelsLead: "Ottieni un badge gratuito per il tuo sito o candidati come partner indicato, con foto e video.",
		hotelsCta: "Collabora con noi"
	},
	pt: {
		disc: "Podemos receber uma comissão se reservar. Isso nunca muda as nossas escolhas.",
		consent: "Usamos cookies para o acompanhamento dos parceiros de reserva e estatísticas básicas. Os essenciais estão sempre ativos.",
		accept: "Aceitar",
		reject: "Rejeitar",
		more: "Política de cookies",
		filming: (c) => `Hotéis em ${c}: vamos filmar a nossa seleção de ${c} no final de outubro de 2026`,
		filmingLead: "Quer o seu hotel nos nossos vídeos e em destaque como parceiro (sempre identificado) nesta página? Fale connosco, confirmamos um hotel por categoria.",
		hotelsTitle: (c) => `Tem um hotel em ${c}?`,
		hotelsLead: "Obtenha um selo gratuito para o seu site ou candidate-se a parceiro identificado, com fotos e vídeo.",
		hotelsCta: "Trabalhe connosco"
	},
	da: {
		disc: "Vi kan få provision, hvis du booker. Det ændrer aldrig vores valg.",
		consent: "Vi bruger cookies til sporing for vores bookingpartnere og enkel statistik. Nødvendige cookies er altid slået til.",
		accept: "Accepter",
		reject: "Afvis",
		more: "Cookiepolitik",
		filming: (c) => `Hoteller i ${c}: vi filmer vores udvalg i ${c} i slutningen af oktober 2026`,
		filmingLead: "Vil du have dit hotel med i vores videoer og fremhævet som (altid markeret) partner på denne side? Skriv nu, vi bekræfter ét hotel pr. kategori.",
		hotelsTitle: (c) => `Driver du et hotel i ${c}?`,
		hotelsLead: "Få et gratis badge til din hjemmeside, eller søg om at blive markeret partner med billeder og video.",
		hotelsCta: "Samarbejd med os"
	}
};
var CSS_TRUST = `.disc{font-size:11.5px;color:var(--muted);margin:-4px 0 0;text-align:center}
.cbar{position:fixed;left:16px;right:16px;bottom:16px;z-index:90;max-width:720px;margin:0 auto;display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:16px;box-shadow:0 18px 50px #0004;padding:14px 16px;font-size:13.5px}
.cbar p{margin:0;flex:1 1 280px}.cbar a{color:var(--muted)}.cbar .btn{min-height:42px;padding:0 16px}
@media (max-width:900px){.cbar{bottom:76px}}
.guide{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;align-items:stretch;margin-top:16px}
.guide .box{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:18px 20px;box-shadow:var(--shadow)}
.guide h3{font:600 19px/1.2 var(--serif);margin:0 0 10px}.guide p{margin:0 0 10px;font-size:14.5px}
.guide dl{margin:0;display:grid;gap:10px}.guide dt{font-weight:700;font-size:13.5px}.guide dd{margin:2px 0 0;color:var(--muted);font-size:13.5px}
.guide ul{margin:0;padding-left:18px;display:grid;gap:8px;font-size:14px}
.hoods{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:6px}
.hood{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px 18px;position:relative;overflow:hidden}
.hood:before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(var(--budget),var(--value),var(--lux))}
.hood b{display:block;font:600 18px/1.2 var(--serif)}.hood small{display:block;color:var(--coral);font-size:11.5px;font-weight:600;letter-spacing:.3px;margin:4px 0 6px}.hood p{margin:0;font-size:13.5px;color:var(--muted)}
@media (max-width:960px){.guide{grid-template-columns:1fr}}@media (max-width:860px){.hoods{grid-template-columns:1fr 1fr}}@media (max-width:520px){.hoods{grid-template-columns:1fr}}
.collab{display:flex;flex-wrap:wrap;gap:16px 24px;align-items:center;justify-content:space-between;border-radius:22px;padding:22px 26px;background:linear-gradient(120deg,#9a6b00,#c9971c 55%,#e3c26a);color:#10213a}
.collab h2{margin:0 0 6px;color:#10213a;font-size:clamp(22px,2.6vw,30px)}.collab h2:before{display:none}.collab p{margin:0;max-width:640px;font-size:14.5px}
.collab .btn{background:#10213a;color:#fff}
.forh{display:flex;flex-wrap:wrap;gap:12px 20px;align-items:center;justify-content:space-between;border:1px dashed var(--line);border-radius:18px;padding:18px 20px}
.forh h3{font:600 20px/1.2 var(--serif);margin:0 0 4px}.forh p{margin:0;color:var(--muted);font-size:14px;max-width:640px}`;
/** Cookie consent: Travelpayouts (and any analytics) only load after "Accept". */
var consentScript = (z) => `<script>(function(){var K='t3-consent',v=null;try{v=localStorage.getItem(K)}catch(_){}function tp(){var s=document.createElement('script');s.async=1;s.setAttribute('data-cmp-ab','2');s.src='https://tp-em.com/NTc2OTIx.js?t=576921';document.head.appendChild(s)}function go(){(window.requestIdleCallback||function(f){setTimeout(f,1500)})(tp)}if(v==='yes'){if(document.readyState==='complete')go();else addEventListener('load',go);return}if(v==='no')return;addEventListener('DOMContentLoaded',function(){var b=document.createElement('div');b.className='cbar';b.setAttribute('role','dialog');b.setAttribute('aria-label','Cookies');b.innerHTML='<p>${z.consent.replace(/'/g, "\\'")} <a href="/cookies">${z.more}</a></p><button type="button" class="btn ghost" data-c="no">${z.reject}</button><button type="button" class="btn" data-c="yes">${z.accept}</button>';b.addEventListener('click',function(e){var c=e.target.getAttribute&&e.target.getAttribute('data-c');if(!c)return;try{localStorage.setItem(K,c)}catch(_){}b.remove();if(c==='yes')go()});document.body.appendChild(b)})})();<\/script>`;
var guides_default = { london: {
	"filming": true,
	"en": {
		"title": "London in 1 minute",
		"intro": "London rewards a central base. Choose the neighbourhood first, then the hotel: the West End for theatres and a first visit, South Kensington for museums and families, Shoreditch for food and nightlife, the South Bank for river views.",
		"areasTitle": "Neighbourhoods at a glance",
		"areas": [
			[
				"West End",
				"Soho, Covent Garden, Leicester Square",
				"Theatres, restaurants and the busiest streets. Best for a first visit and short stays."
			],
			[
				"Westminster & St James's",
				"Big Ben, Buckingham Palace, St James's Park",
				"The classic landmarks on foot, and much quieter at night than the West End."
			],
			[
				"South Kensington & Knightsbridge",
				"V&A, Natural History Museum, Hyde Park",
				"Free museums, the big park and elegant streets. The best base for families."
			],
			[
				"Shoreditch & the City",
				"Brick Lane, Spitalfields, St Paul's",
				"Street food, bars and design hotels, with quick Tube links to the centre."
			],
			[
				"South Bank & Southwark",
				"London Eye, Tate Modern, Borough Market",
				"Riverside walks, food markets and views across to Westminster."
			],
			[
				"King's Cross & Bloomsbury",
				"St Pancras, British Museum, Coal Drops Yard",
				"Eurostar on the doorstep and some of the best-value central hotels."
			]
		],
		"airTitle": "From the airport",
		"air": [
			["Heathrow (LHR)", "Heathrow Express to Paddington in about 15 min, or the Elizabeth line to central London in about 30–40 min."],
			["Gatwick (LGW)", "Gatwick Express to Victoria in about 30 min, or Thameslink to London Bridge and St Pancras."],
			["Stansted (STN)", "Stansted Express to Liverpool Street in about 50 min."],
			["Luton (LTN)", "Shuttle to Luton Airport Parkway, then Thameslink to St Pancras in about 35 min."],
			["London City (LCY)", "DLR to Bank in about 25 min."]
		],
		"whenTitle": "When to go",
		"when": "Best weather: May to September, with long days and around 20–24°C. Best prices: January, February and November, outside school holidays. December is lively but busy around the Christmas markets and shows.",
		"aroundTitle": "Getting around",
		"around": "Tap in and out with a contactless card or your phone on the Tube, buses and trains. Daily fares are capped automatically, so you don't need an Oyster card. Most central sights are 10 to 25 minutes apart on foot.",
		"tipsTitle": "Good to know",
		"tips": [
			"Many big museums are free: the British Museum, National Gallery, Tate Modern and Natural History Museum.",
			"Book West End shows and the London Eye ahead in summer. Same-day theatre tickets are sold at the TKTS booth in Leicester Square.",
			"Hotel rooms in central London are compact. Check the room size on the booking page if space matters to you."
		]
	},
	"es": {
		"title": "Londres en 1 minuto",
		"intro": "En Londres compensa dormir en el centro. Elige primero el barrio y después el hotel: el West End para teatros y una primera visita, South Kensington para museos y familias, Shoreditch para comer y salir, y la South Bank para vistas al río.",
		"areasTitle": "Los barrios, de un vistazo",
		"areas": [
			[
				"West End",
				"Soho, Covent Garden, Leicester Square",
				"Teatros, restaurantes y las calles con más ambiente. Lo mejor para una primera visita y estancias cortas."
			],
			[
				"Westminster y St James's",
				"Big Ben, Palacio de Buckingham, St James's Park",
				"Los monumentos clásicos a pie y mucha más calma por la noche que en el West End."
			],
			[
				"South Kensington y Knightsbridge",
				"V&A, Museo de Historia Natural, Hyde Park",
				"Museos gratis, el gran parque y calles elegantes. La mejor base para familias."
			],
			[
				"Shoreditch y la City",
				"Brick Lane, Spitalfields, St Paul's",
				"Comida callejera, bares y hoteles de diseño, con metro rápido al centro."
			],
			[
				"South Bank y Southwark",
				"London Eye, Tate Modern, Borough Market",
				"Paseos junto al río, mercados de comida y vistas a Westminster."
			],
			[
				"King's Cross y Bloomsbury",
				"St Pancras, Museo Británico, Coal Drops Yard",
				"El Eurostar al lado y algunos de los hoteles céntricos con mejor precio."
			]
		],
		"airTitle": "Desde el aeropuerto",
		"air": [
			["Heathrow (LHR)", "Heathrow Express a Paddington en unos 15 min, o la Elizabeth line al centro en unos 30–40 min."],
			["Gatwick (LGW)", "Gatwick Express a Victoria en unos 30 min, o Thameslink a London Bridge y St Pancras."],
			["Stansted (STN)", "Stansted Express a Liverpool Street en unos 50 min."],
			["Luton (LTN)", "Lanzadera a Luton Airport Parkway y Thameslink a St Pancras en unos 35 min."],
			["London City (LCY)", "DLR a Bank en unos 25 min."]
		],
		"whenTitle": "Cuándo ir",
		"when": "Mejor tiempo: de mayo a septiembre, con días largos y unos 20–24 °C. Mejores precios: enero, febrero y noviembre, fuera de vacaciones escolares. Diciembre es precioso, pero hay mucha gente por los mercados navideños y los musicales.",
		"aroundTitle": "Cómo moverse",
		"around": "Paga con tarjeta contactless o con el móvil en el metro, el autobús y el tren. El gasto diario tiene tope automático, así que no necesitas la tarjeta Oyster. La mayoría de lugares del centro están a 10–25 minutos andando.",
		"tipsTitle": "Bueno saberlo",
		"tips": [
			"Muchos grandes museos son gratis: el Museo Británico, la National Gallery, la Tate Modern y el Museo de Historia Natural.",
			"En verano reserva antes los musicales del West End y el London Eye. Las entradas de teatro del mismo día se venden en la taquilla TKTS de Leicester Square.",
			"Las habitaciones en el centro de Londres son pequeñas. Si el espacio te importa, mira los metros en la página de reserva."
		]
	},
	"da": {
		"title": "London på 1 minut",
		"intro": "I London betaler det sig at bo centralt. Vælg først kvarteret, så hotellet: West End til teater og første besøg, South Kensington til museer og familier, Shoreditch til mad og natteliv og South Bank til udsigt over floden.",
		"areasTitle": "Kvartererne på et øjeblik",
		"areas": [
			[
				"West End",
				"Soho, Covent Garden, Leicester Square",
				"Teatre, restauranter og byens travleste gader. Bedst til første besøg og korte ophold."
			],
			[
				"Westminster og St James's",
				"Big Ben, Buckingham Palace, St James's Park",
				"De klassiske seværdigheder til fods og meget roligere om aftenen end West End."
			],
			[
				"South Kensington og Knightsbridge",
				"V&A, Natural History Museum, Hyde Park",
				"Gratis museer, den store park og elegante gader. Den bedste base for familier."
			],
			[
				"Shoreditch og City",
				"Brick Lane, Spitalfields, St Paul's",
				"Streetfood, barer og designhoteller med hurtig undergrundsbane til centrum."
			],
			[
				"South Bank og Southwark",
				"London Eye, Tate Modern, Borough Market",
				"Gåture langs floden, madmarkeder og udsigt til Westminster."
			],
			[
				"King's Cross og Bloomsbury",
				"St Pancras, British Museum, Coal Drops Yard",
				"Eurostar lige ved døren og nogle af de centrale hoteller med bedst værdi."
			]
		],
		"airTitle": "Fra lufthavnen",
		"air": [
			["Heathrow (LHR)", "Heathrow Express til Paddington på ca. 15 min eller Elizabeth line til centrum på ca. 30–40 min."],
			["Gatwick (LGW)", "Gatwick Express til Victoria på ca. 30 min eller Thameslink til London Bridge og St Pancras."],
			["Stansted (STN)", "Stansted Express til Liverpool Street på ca. 50 min."],
			["Luton (LTN)", "Shuttle til Luton Airport Parkway og Thameslink til St Pancras på ca. 35 min."],
			["London City (LCY)", "DLR til Bank på ca. 25 min."]
		],
		"whenTitle": "Hvornår skal man rejse",
		"when": "Bedste vejr: maj til september med lange dage og omkring 20–24 °C. Bedste priser: januar, februar og november uden for skoleferierne. December er hyggelig, men travl omkring julemarkeder og musicals.",
		"aroundTitle": "Sådan kommer du rundt",
		"around": "Betal med kontaktløst kort eller telefon i undergrundsbanen, busserne og togene. Dagsprisen har automatisk loft, så du behøver ikke et Oyster-kort. De fleste seværdigheder i centrum ligger 10–25 minutters gang fra hinanden.",
		"tipsTitle": "Godt at vide",
		"tips": [
			"Mange store museer er gratis: British Museum, National Gallery, Tate Modern og Natural History Museum.",
			"Book West End-musicals og London Eye i god tid om sommeren. Billetter til samme dag sælges i TKTS-boden på Leicester Square.",
			"Hotelværelser i det centrale London er små. Tjek værelsets størrelse på bookingsiden, hvis pladsen betyder noget."
		]
	}
} };
var live_prices_default = {
	london: {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/gb/the-z-leicester-square": {
				"total": 574.61,
				"score": 8.5,
				"count": 1936,
				"stars": 3
			},
			"/hotel/gb/page-8": {
				"total": 911.32,
				"score": 9.2,
				"count": 4214,
				"stars": 4
			},
			"/hotel/gb/haymarket": {
				"total": 1562.27,
				"score": 9.6,
				"count": 494,
				"stars": 5
			}
		}
	},
	paris: {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/fr/esmeralda": {
				"total": 440.94,
				"score": 8,
				"count": 1632,
				"stars": 1
			},
			"/hotel/fr/nestay-les-halles": {
				"total": 656,
				"score": 9.4,
				"count": 1191,
				"stars": 4
			},
			"/hotel/fr/le-grand-mazarin": {
				"total": 1518.74,
				"score": 9.3,
				"count": 361,
				"stars": 5
			}
		}
	},
	"amsterdam-netherlands": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/nl/tourist-inn": {
				"total": 220.23,
				"score": 8,
				"count": 1862,
				"stars": 2
			},
			"/hotel/nl/hostel-tourist-inn": {
				"total": 303.57,
				"score": 8.8,
				"count": 3371,
				"stars": 3
			},
			"/hotel/nl/twentyseven-amsterdam": {
				"total": 1820.45,
				"score": 9.4,
				"count": 203,
				"stars": 5
			}
		}
	},
	"copenhagen-denmark": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/dk/wakeup-copenhagen-borgergade": {
				"total": 201.47,
				"score": 8,
				"count": 16568,
				"stars": 2
			},
			"/hotel/dk/kanalhuset": {
				"total": 414.71,
				"score": null,
				"count": null,
				"stars": null
			},
			"/hotel/dk/1-hotel-copenhagen": {
				"total": 602.04,
				"score": 9.1,
				"count": 702,
				"stars": 5
			}
		}
	},
	"malaga-spain": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/es/hostal-vidamia": {
				"total": 170,
				"score": null,
				"count": null,
				"stars": null
			},
			"/hotel/es/ld-convento-cister": {
				"total": 280,
				"score": null,
				"count": null,
				"stars": null
			},
			"/hotel/es/vincci-seleccion-posada-del-patio-malaga": {
				"total": 572,
				"score": 9.2,
				"count": 4153,
				"stars": 5
			}
		}
	},
	"berlin-germany": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/de/ibis-budget-berlin-alexanderplatz": {
				"total": 184.79,
				"score": 8,
				"count": 5598,
				"stars": 1
			},
			"/hotel/de/locke-at-east-side-gallery": {
				"total": 301,
				"score": 8.9,
				"count": 3489,
				"stars": 4
			},
			"/hotel/de/wilmina": {
				"total": 365.8,
				"score": 9.4,
				"count": 1047,
				"stars": 5
			}
		}
	},
	"athens-greece": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/gr/kubic-athens-athina12345678": {
				"total": 126.38,
				"score": 8.3,
				"count": 1377,
				"stars": 4
			},
			"/hotel/gr/evripides": {
				"total": 201,
				"score": 9,
				"count": 4405,
				"stars": 2
			},
			"/hotel/gr/the-pinnacle-athens": {
				"total": 381.05,
				"score": 9.5,
				"count": 997,
				"stars": 5
			}
		}
	},
	"milan-italy": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/it/aparthotel-dei-mercanti": {
				"total": 374.8,
				"score": 8.5,
				"count": 1248,
				"stars": 4
			},
			"/hotel/it/milano-castello": {
				"total": 808,
				"score": 9.2,
				"count": 2237,
				"stars": 3
			},
			"/hotel/it/park-hyatt-milano": {
				"total": 2689.1,
				"score": 9.3,
				"count": 513,
				"stars": 5
			}
		}
	},
	"istanbul-trkiye": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/tr/sultanahmet-inn": {
				"total": 151.2,
				"score": 8.6,
				"count": 1100,
				"stars": 3
			},
			"/hotel/tr/old-harbour-istanbul": {
				"total": 229.5,
				"score": 9.2,
				"count": 684,
				"stars": 3
			},
			"/hotel/tr/ciragan-palace-kempinski-istanbul": {
				"total": 1026.76,
				"score": 9.4,
				"count": 1620,
				"stars": 5
			}
		}
	},
	"odense-denmark": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/dk/nice-nest": {
				"total": 195.55,
				"score": 8.3,
				"count": 107,
				"stars": 5
			},
			"/hotel/dk/ansgarhus-motel": {
				"total": 274.24,
				"score": 8.6,
				"count": 666,
				"stars": 3
			},
			"/hotel/dk/odeon": {
				"total": 444.9,
				"score": 8.5,
				"count": 2756,
				"stars": 4
			}
		}
	},
	"billund-denmark": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/dk/billund-homestay": {
				"total": 280.93,
				"score": null,
				"count": null,
				"stars": null
			},
			"/hotel/dk/refborg-hotel": {
				"total": 373.24,
				"score": 8.6,
				"count": 1120,
				"stars": 3
			},
			"/hotel/dk/the-lodge-billund": {
				"total": 611.1,
				"score": 8.5,
				"count": 3493,
				"stars": 4
			}
		}
	},
	"helsinki-finland": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/fi/senate": {
				"total": 200.45,
				"score": 8,
				"count": 826,
				"stars": 2
			},
			"/hotel/fi/lapland-hotels-bulevardi": {
				"total": 531,
				"score": 9.4,
				"count": 2242,
				"stars": 5
			}
		}
	},
	"zurich-switzerland": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/ch/leonardo-boutique-hotel-rigihof-zurich": {
				"total": 369.39,
				"score": 8.1,
				"count": 596,
				"stars": 4
			},
			"/hotel/ch/motel-one-zurich": {
				"total": 418.42,
				"score": 8.4,
				"count": 8974,
				"stars": 3
			},
			"/hotel/ch/the-dolder-grand": {
				"total": 1794.93,
				"score": 9.1,
				"count": 763,
				"stars": 5
			}
		}
	},
	"warsaw-poland": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/pl/level-rooms": {
				"total": 138.17,
				"score": null,
				"count": null,
				"stars": null
			},
			"/hotel/pl/puro-warszawa-centrum": {
				"total": 277.38,
				"score": 9.4,
				"count": 4084,
				"stars": 4
			},
			"/hotel/pl/intercontinentalwarsaw": {
				"total": 293.44,
				"score": 9.1,
				"count": 10072,
				"stars": 5
			}
		}
	},
	"porto-portugal": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/pt/wot-porto": {
				"total": 160.05,
				"score": null,
				"count": null,
				"stars": null
			},
			"/hotel/pt/legends-house-by-sweet-porto": {
				"total": 267.64,
				"score": 9.3,
				"count": 857,
				"stars": 4
			},
			"/hotel/pt/bonjardim-560": {
				"total": 745.25,
				"score": 9.6,
				"count": 1308,
				"stars": 5
			}
		}
	},
	"singapore-singapore": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/sg/santa-grand-bugis": {
				"total": 173.97,
				"score": 8.1,
				"count": 3983,
				"stars": 4
			},
			"/hotel/sg/jen-orchardgateway-singapore": {
				"total": 435.14,
				"score": 8.8,
				"count": 6126,
				"stars": 4
			},
			"/hotel/sg/parkroyal-on-pickering": {
				"total": 787.01,
				"score": 9,
				"count": 6176,
				"stars": 5
			}
		}
	},
	"hong-kong-hongkong": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/hk/ibis-hong-kong-central": {
				"total": 450.75,
				"score": 8,
				"count": 5614,
				"stars": 3
			},
			"/hotel/hk/the-luxe-manor": {
				"total": 482.37,
				"score": 8.6,
				"count": 3086,
				"stars": 4
			},
			"/hotel/hk/mondrian-hong-kong": {
				"total": 636.73,
				"score": 9.1,
				"count": 1233,
				"stars": 5
			}
		}
	},
	"san-francisco-unitedstates": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/us/beresford-arms": {
				"total": 264.52,
				"score": 8,
				"count": 1188,
				"stars": 3
			},
			"/hotel/us/orchard": {
				"total": 456.03,
				"score": 8.8,
				"count": 1557,
				"stars": 4
			},
			"/hotel/us/four-seasons-embarcadero": {
				"total": 2187.03,
				"score": 9,
				"count": 232,
				"stars": 5
			}
		}
	},
	"chicago-unitedstates": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/us/club-quarters-central-loop": {
				"total": 488.65,
				"score": 8.2,
				"count": 5335,
				"stars": 4
			},
			"/hotel/us/riu-plaza-chicago": {
				"total": 433.27,
				"score": 9.1,
				"count": 8463,
				"stars": 4
			},
			"/hotel/us/trump-international-tower-chicago": {
				"total": 1107.32,
				"score": 9.4,
				"count": 1145,
				"stars": 5
			}
		}
	},
	"cancun-mexico": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/mx/batab": {
				"total": 92.64,
				"score": 8.1,
				"count": 187,
				"stars": 3
			},
			"/hotel/mx/sina-suites": {
				"total": 188.26,
				"score": 8.8,
				"count": 1867,
				"stars": 3
			},
			"/hotel/mx/jungala-park-at-vidantaworld-riviera-maya": {
				"total": 884.05,
				"score": 9,
				"count": 176,
				"stars": 5
			}
		}
	},
	"cape-town-southafrica": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/za/havn-aparthotel-by-totalstay": {
				"total": 98.56,
				"score": 8,
				"count": 5183,
				"stars": 3
			},
			"/hotel/za/the-glen-boutique": {
				"total": 703.41,
				"score": 9.4,
				"count": 773,
				"stars": 5
			}
		}
	},
	rome: {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/it/harry-39-s-bar-trevi-amp-restaurant": {
				"total": 1303.6,
				"score": 9.3,
				"count": 1082,
				"stars": 5
			},
			"/hotel/it/emona-aquaeductus": {
				"total": 307,
				"score": 9,
				"count": 1857,
				"stars": 4
			}
		}
	},
	"new-york-unitedstates": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/us/pod-times-square": {
				"total": 487.64,
				"score": 8.6,
				"count": 16603,
				"stars": 3
			},
			"/hotel/us/hampton-inn-times-square-central": {
				"total": 861.55,
				"score": 8.6,
				"count": 2544,
				"stars": 3
			},
			"/hotel/us/the-knickerbocker": {
				"total": 1093.25,
				"score": 8.7,
				"count": 2217,
				"stars": 5
			}
		}
	},
	dubai: {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/ae/premier-inn-dubai-international-airport": {
				"total": 148.78,
				"score": 8.7,
				"count": 22754,
				"stars": 3
			},
			"/hotel/ae/local-at-jumeirah-village-triangle-by-the-first-collection": {
				"total": 222.57,
				"score": 8.8,
				"count": 1719,
				"stars": 4
			},
			"/hotel/ae/mileo-amp-apartment-dubai": {
				"total": 462.62,
				"score": 9.5,
				"count": 840,
				"stars": 5
			}
		}
	},
	"prague-czechia": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/cz/hotel-international-prague": {
				"total": 160.8,
				"score": 9.2,
				"count": 18993,
				"stars": 4
			},
			"/hotel/cz/old-royal-post-apartments": {
				"total": 207.38,
				"score": 9.6,
				"count": 2457,
				"stars": 5
			}
		}
	},
	"vienna-austria": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/at/bob-w-vienna-dobling": {
				"total": 173.72,
				"score": 9.1,
				"count": 156,
				"stars": 4
			},
			"/hotel/at/eurostars-vienna": {
				"total": 178.77,
				"score": 8.7,
				"count": 4066,
				"stars": 4
			},
			"/hotel/at/sacher-wien": {
				"total": 1538.5,
				"score": 9.6,
				"count": 1022,
				"stars": 5
			}
		}
	},
	"dublin-ireland": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/ie/holiday-inn-express-dublin-city-centre": {
				"total": 291,
				"score": 8.8,
				"count": 5543,
				"stars": 3
			},
			"/hotel/ie/the-fitzwilliam": {
				"total": 1108,
				"score": 9.1,
				"count": 1403,
				"stars": 5
			}
		}
	},
	"florence-italy": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/it/kursaa-ausonia": {
				"total": 204,
				"score": 8.4,
				"count": 1261,
				"stars": 3
			},
			"/hotel/it/orcagna-firenze": {
				"total": 336,
				"score": 9.1,
				"count": 2418,
				"stars": 2
			},
			"/hotel/it/golden-tower": {
				"total": 852,
				"score": 9.4,
				"count": 891,
				"stars": 5
			}
		}
	},
	"munich-germany": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/de/harrys-home-munchen": {
				"total": 661,
				"score": 8.6,
				"count": 1744,
				"stars": 4
			},
			"/hotel/de/maximilian-munich": {
				"total": 950.4,
				"score": 8.9,
				"count": 1016,
				"stars": 4
			},
			"/hotel/de/rosewood-munich": {
				"total": 3246,
				"score": 9.2,
				"count": 817,
				"stars": 5
			}
		}
	},
	"aarhus-denmark": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/dk/wakeup-aarhus": {
				"total": 208.69,
				"score": null,
				"count": null,
				"stars": null
			},
			"/hotel/dk/city-oasia": {
				"total": 360.93,
				"score": 8.7,
				"count": 4184,
				"stars": 3
			}
		}
	},
	"stockholm-sweden": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/se/riddargatan": {
				"total": 462.05,
				"score": 8.3,
				"count": 3781,
				"stars": 4
			},
			"/hotel/se/terminus-stockholm": {
				"total": 626.82,
				"score": 8.9,
				"count": 684,
				"stars": 4
			},
			"/hotel/se/bank": {
				"total": 742.33,
				"score": 9,
				"count": 1383,
				"stars": 5
			}
		}
	},
	"reykjavik-iceland": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/is/vera": {
				"total": 345,
				"score": null,
				"count": null,
				"stars": null
			},
			"/hotel/is/cityhub-reykjavik": {
				"total": 274.2,
				"score": null,
				"count": null,
				"stars": null
			},
			"/hotel/is/consulate-reykjavik-curio-collection-by-hilton": {
				"total": 705.23,
				"score": 9,
				"count": 364,
				"stars": 5
			}
		}
	},
	"geneva-switzerland": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/ch/ibis-budget-gena-ve": {
				"total": 196.07,
				"score": 8,
				"count": 7252,
				"stars": 1
			},
			"/hotel/ch/b-amp-b-geneva-airport": {
				"total": 251.12,
				"score": 8.6,
				"count": 13003,
				"stars": 3
			},
			"/hotel/ch/lesarmures": {
				"total": 2094.27,
				"score": 9.4,
				"count": 622,
				"stars": 5
			}
		}
	},
	"seville-spain": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/es/patio-de-cruces": {
				"total": 165,
				"score": 8.3,
				"count": 4902,
				"stars": 1
			},
			"/hotel/es/amadeus-sevilla": {
				"total": 731,
				"score": 9.1,
				"count": 1739,
				"stars": 4
			},
			"/hotel/es/avenida-kansas-sevilla": {
				"total": 387,
				"score": 9.4,
				"count": 5004,
				"stars": 5
			}
		}
	},
	"palma-spain": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/es/antiguo-brondo-turismo-de-interior": {
				"total": 221.72,
				"score": null,
				"count": null,
				"stars": null
			},
			"/hotel/es/casa-delmonte-ti": {
				"total": 450,
				"score": null,
				"count": null,
				"stars": null
			},
			"/hotel/es/luxury-boutique-can-alomar": {
				"total": 686.6,
				"score": 9.6,
				"count": 237,
				"stars": 5
			}
		}
	},
	"bangkok-thailand": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/th/regent-ramkhamhaeng-22": {
				"total": 52.07,
				"score": 8.5,
				"count": 474,
				"stars": 4
			},
			"/hotel/th/red-door": {
				"total": 273.67,
				"score": 8.8,
				"count": 1225,
				"stars": 3
			},
			"/hotel/th/eastin-grand-sathorn": {
				"total": 303.17,
				"score": 9.4,
				"count": 9152,
				"stars": 5
			}
		}
	},
	"sydney-australia": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/au/macleay-serviced-apartment": {
				"total": 399.21,
				"score": 8.5,
				"count": 2465,
				"stars": 4
			},
			"/hotel/au/hyde-park-inn": {
				"total": 758.51,
				"score": 8.2,
				"count": 5838,
				"stars": 4
			},
			"/hotel/au/capella-sydney": {
				"total": 1734.09,
				"score": 9.7,
				"count": 751,
				"stars": 5
			}
		}
	},
	"miami-unitedstates": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/us/el-jardin-miami": {
				"total": 230.94,
				"score": 8.4,
				"count": 197,
				"stars": 4
			},
			"/hotel/us/hampton-inn-miami-airport-west": {
				"total": 298.51,
				"score": 8.7,
				"count": 1249,
				"stars": 3
			},
			"/hotel/us/inter-continental-miami": {
				"total": 1056.91,
				"score": 8.9,
				"count": 1658,
				"stars": 5
			}
		}
	},
	"toronto-canada": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/ca/crowne-plaza-toronto-north-york-by-ihg": {
				"total": 367.36,
				"score": 8,
				"count": 456,
				"stars": 4
			},
			"/hotel/ca/pantages-suites-spa": {
				"total": 596.04,
				"score": 8.8,
				"count": 1179,
				"stars": 4
			},
			"/hotel/ca/soho-metropolitan": {
				"total": 993.67,
				"score": 9,
				"count": 1142,
				"stars": 5
			}
		}
	},
	"rio-de-janeiro-brazil": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/br/ibis-copacabana-posto-2": {
				"total": 179.39,
				"score": 8.3,
				"count": 2539,
				"stars": 3
			},
			"/hotel/br/vila-gale-rio-de-janeiro": {
				"total": 200.45,
				"score": 8.7,
				"count": 7303,
				"stars": 4
			},
			"/hotel/br/copacabana-palace": {
				"total": 2667.92,
				"score": 9.5,
				"count": 1107,
				"stars": 5
			}
		}
	},
	barcelona: {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/es/me-barcelona-barcelona": {
				"total": 952.83,
				"score": 9,
				"count": 1502,
				"stars": 5
			},
			"/hotel/es/olivia-plaza": {
				"total": 603.96,
				"score": 9.3,
				"count": 3386,
				"stars": 4
			},
			"/hotel/es/nouvel": {
				"total": 311.87,
				"score": 8,
				"count": 2744,
				"stars": 3
			}
		}
	},
	"lisbon-portugal": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/pt/hf-fenix-music": {
				"total": 344,
				"score": 9,
				"count": 3059,
				"stars": 3
			},
			"/hotel/pt/estrela-dos-santos": {
				"total": 473.6,
				"score": 8.8,
				"count": 5102,
				"stars": 3
			}
		}
	},
	tokyo: {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/jp/tian-ran-wen-quan-ling-tian-notang-yu-su-ye-nai-qian-cao-bie-di": {
				"total": 665.54,
				"score": 9.3,
				"count": 1347,
				"stars": 4
			},
			"/hotel/jp/chinzanso-tokyo": {
				"total": 905.24,
				"score": 9.4,
				"count": 790,
				"stars": 5
			}
		}
	},
	"madrid-spain": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/es/b-amp-b-madrid-vallecas-la-gavia": {
				"total": 154.8,
				"score": 8.8,
				"count": 1147,
				"stars": 3
			},
			"/hotel/es/heritage-madrid": {
				"total": 864,
				"score": 9.3,
				"count": 1223,
				"stars": 5
			},
			"/hotel/es/aparto-rosales": {
				"total": 400,
				"score": 9,
				"count": 3424,
				"stars": 3
			}
		}
	},
	"budapest-hungary": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/hu/anva-house": {
				"total": 110,
				"score": null,
				"count": null,
				"stars": null
			},
			"/hotel/hu/aria-budapest": {
				"total": 833.86,
				"score": 9.6,
				"count": 1056,
				"stars": 5
			}
		}
	},
	"edinburgh-unitedkingdom": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/gb/gleneagles-townhouse": {
				"total": 1342.13,
				"score": 9.4,
				"count": 451,
				"stars": 5
			},
			"/hotel/gb/ibis-edinburgh-centre-st-andrew-square": {
				"total": 565.73,
				"score": 8.8,
				"count": 6035,
				"stars": 3
			}
		}
	},
	"venice-italy": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/it/b-amp-b-venezia-laguna": {
				"total": 208.2,
				"score": 8.8,
				"count": 5403,
				"stars": 3
			},
			"/hotel/it/dalla-mora": {
				"total": 184,
				"score": 8.9,
				"count": 2130,
				"stars": 1
			},
			"/hotel/it/hotelgabriellisandwirthvenice": {
				"total": 1190,
				"score": 9.6,
				"count": 370,
				"stars": 5
			}
		}
	},
	"hamburg-germany": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/de/cab20": {
				"total": 119.85,
				"score": 8.5,
				"count": 12768,
				"stars": 2
			},
			"/hotel/de/superbude-hostel-st-pauli": {
				"total": 186.71,
				"score": 8.9,
				"count": 1521,
				"stars": 3
			},
			"/hotel/de/raffleshotelvierjahreszeiten": {
				"total": 1200,
				"score": 9.5,
				"count": 1299,
				"stars": 5
			}
		}
	},
	"aalborg-denmark": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/dk/cabinn-aalborg": {
				"total": 191.3,
				"score": 7.6,
				"count": 3092,
				"stars": 2
			},
			"/hotel/dk/aalborg": {
				"total": 354.24,
				"score": 8.5,
				"count": 3367,
				"stars": 4
			},
			"/hotel/dk/scandicaalborgscity": {
				"total": 397.45,
				"score": 8.4,
				"count": 742,
				"stars": 4
			}
		}
	},
	"oslo-norway": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/no/hobo-oslo": {
				"total": 451.58,
				"score": null,
				"count": null,
				"stars": null
			},
			"/hotel/no/scandic-grensen": {
				"total": 251.41,
				"score": 8.1,
				"count": 1796,
				"stars": 3
			}
		}
	},
	"brussels-belgium": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/be/opo-bruxelles3": {
				"total": 356.11,
				"score": 9.2,
				"count": 3090,
				"stars": 4
			},
			"/hotel/be/ibisstcatherine": {
				"total": 292.2,
				"score": 8.1,
				"count": 6655,
				"stars": 3
			},
			"/hotel/be/amigo": {
				"total": 895.2,
				"score": 9.4,
				"count": 638,
				"stars": 5
			}
		}
	},
	"krakow-poland": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/pl/h15-palace": {
				"total": 452.94,
				"score": 9.4,
				"count": 1575,
				"stars": 5
			},
			"/hotel/pl/venetiab-house-aparthotel": {
				"total": 166.99,
				"score": 9.4,
				"count": 924,
				"stars": 4
			},
			"/hotel/pl/pokoje-goscinne-majus-krakow": {
				"total": 109.53,
				"score": 9,
				"count": 1846,
				"stars": 4
			}
		}
	},
	"valencia-spain": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/es/ibis-budget-valencia-centro-puerto": {
				"total": 150.1,
				"score": 8,
				"count": 2281,
				"stars": 1
			},
			"/hotel/es/palacio-vallier-5": {
				"total": 570,
				"score": 9.6,
				"count": 1401,
				"stars": 5
			},
			"/hotel/es/venecia": {
				"total": 286.44,
				"score": 9.2,
				"count": 9925,
				"stars": 2
			}
		}
	},
	"nice-france": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/fr/maison-albar-le-victoria": {
				"total": 813.55,
				"score": 9.1,
				"count": 758,
				"stars": 5
			},
			"/hotel/fr/hotel-lafayette": {
				"total": 208.02,
				"score": 9.3,
				"count": 1065,
				"stars": 3
			},
			"/hotel/fr/helvetiquenice": {
				"total": 159.12,
				"score": 8.1,
				"count": 2012,
				"stars": 3
			}
		}
	},
	"bali-indonesia": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/id/suka-beach-inn": {
				"total": 44.49,
				"score": 8.2,
				"count": 3189,
				"stars": 3
			},
			"/hotel/id/amnaya-resort-kuta": {
				"total": 164,
				"score": 9.3,
				"count": 7927,
				"stars": 4
			},
			"/hotel/id/intercontinental-bali-resort": {
				"total": 500.33,
				"score": 9.1,
				"count": 1518,
				"stars": 5
			}
		}
	},
	"los-angeles-unitedstates": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/us/citizenm-los-angeles-downtown": {
				"total": 258.53,
				"score": 8.7,
				"count": 3401,
				"stars": 4
			},
			"/hotel/us/new-seoul": {
				"total": 245.64,
				"score": 8.5,
				"count": 1879,
				"stars": 3
			},
			"/hotel/us/shutters-on-the-beach": {
				"total": 1715.2,
				"score": 9.2,
				"count": 411,
				"stars": 5
			}
		}
	},
	"las-vegas-unitedstates": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/us/fontainebleau-las-vegas-las-vegas98": {
				"total": 644.59,
				"score": 8.9,
				"count": 3881,
				"stars": 5
			},
			"/hotel/us/the-carriage-house": {
				"total": 222.12,
				"score": 9,
				"count": 2444,
				"stars": 3
			},
			"/hotel/us/ellis-island-hotel-casino-and-brewery": {
				"total": 153.94,
				"score": 8,
				"count": 6219,
				"stars": 3
			}
		}
	},
	"mexico-city-mexico": {
		"checked": "2026-10-14",
		"hotels": {
			"/hotel/mx/cadillac-boutique": {
				"total": 124.06,
				"score": 8.1,
				"count": 2652,
				"stars": 4
			},
			"/hotel/mx/barcelo-mexico-reforma": {
				"total": 572.63,
				"score": 8.9,
				"count": 3949,
				"stars": 5
			},
			"/hotel/mx/canada": {
				"total": 307.7,
				"score": 9.3,
				"count": 882,
				"stars": 4
			}
		}
	},
	"buenos-aires-argentina": {
		"checked": "2026-10-14",
		"hotels": { "/hotel/ar/up-laprida-solo-adultos": {
			"total": 155.44,
			"score": 8.3,
			"count": 1654,
			"stars": 3
		} }
	}
};
var minprice_default = {
	rome: [
		39.8,
		39.8,
		1
	],
	paris: [
		220.47,
		220.47,
		1
	],
	"london-canada": [
		110.84,
		110.84,
		0
	],
	london: [
		287.31,
		287.31,
		1
	],
	barcelona: [
		155.94,
		155.94,
		1
	],
	tokyo: [
		79.81,
		79.81,
		1
	],
	dubai: [
		74.39,
		74.39,
		1
	],
	sarande: [
		32.4,
		32.4,
		0
	],
	tirana: [
		40,
		40,
		0
	],
	"andorra-la-vella": [
		51.14,
		51.14,
		0
	],
	"bahia-blanca": [
		75.03,
		75.03,
		0
	],
	"buenos-aires": [
		77.72,
		77.72,
		1
	],
	"cordoba-argentina": [
		98.78,
		98.78,
		0
	],
	mendoza: [
		39.83,
		39.83,
		0
	],
	salta: [
		42.84,
		42.84,
		0
	],
	"san-carlos-de-bariloche": [
		43.62,
		43.62,
		0
	],
	"santa-fe-argentina": [
		49.87,
		49.87,
		0
	],
	ushuaia: [
		94.55,
		94.55,
		0
	],
	yerevan: [
		50.43,
		50.43,
		0
	],
	adelaide: [
		127.14,
		127.14,
		0
	],
	brisbane: [
		148.35,
		148.35,
		0
	],
	cairns: [
		108.54,
		108.54,
		0
	],
	canberra: [
		94.36,
		94.36,
		0
	],
	darwin: [
		88.81,
		88.81,
		0
	],
	geelong: [
		110.4,
		110.19,
		0
	],
	"gold-coast": [
		124.05,
		124.05,
		0
	],
	hobart: [
		123.08,
		123.08,
		0
	],
	"melbourne-australia": [
		140.76,
		140.76,
		0
	],
	"newcastle-australia": [
		161.57,
		161.57,
		0
	],
	perth: [
		101.41,
		101.41,
		0
	],
	sydney: [
		199.6,
		199.6,
		1
	],
	townsville: [
		94.89,
		94.89,
		0
	],
	"bad-hofgastein": [
		202.68,
		202.68,
		0
	],
	"bad-ischl": [
		224.6,
		224.6,
		0
	],
	bregenz: [
		128.5,
		128.5,
		0
	],
	graz: [
		78,
		78,
		0
	],
	innsbruck: [
		111.5,
		111.5,
		0
	],
	kitzbuhel: [
		176.6,
		176.6,
		0
	],
	klagenfurt: [
		109.5,
		109.5,
		0
	],
	linz: [
		115.68,
		115.68,
		0
	],
	salzburg: [
		117,
		117,
		0
	],
	"seefeld-in-tirol": [
		241,
		241,
		0
	],
	vienna: [
		86.86,
		86.86,
		1
	],
	villach: [
		144.5,
		144.5,
		0
	],
	wels: [
		133.8,
		133.8,
		0
	],
	"zell-am-see": [
		105.06,
		105.06,
		0
	],
	baku: [
		32.48,
		32.48,
		0
	],
	sheki: [
		46.12,
		46.12,
		0
	],
	manama: [
		59.23,
		59.23,
		0
	],
	bridgetown: [
		137.7,
		137.7,
		0
	],
	aalst: [
		150,
		150,
		0
	],
	antwerp: [
		86.16,
		86.16,
		0
	],
	blankenberge: [
		130.75,
		130.75,
		0
	],
	bruges: [
		130.4,
		130.4,
		0
	],
	brussels: [
		146.1,
		146.1,
		1
	],
	ghent: [
		119.05,
		119.05,
		0
	],
	hasselt: [
		73.5,
		73.5,
		0
	],
	"knokke-heist": [
		151.5,
		151.5,
		0
	],
	kortrijk: [
		133.9,
		133.9,
		0
	],
	leuven: [
		115.25,
		115.25,
		0
	],
	liege: [
		98,
		98,
		0
	],
	mechelen: [
		98.63,
		98.63,
		0
	],
	namur: [
		91.08,
		91.08,
		0
	],
	ostend: [
		81.11,
		81.11,
		0
	],
	spa: [
		116,
		116,
		0
	],
	cotonou: [
		66.31,
		66.31,
		0
	],
	cochabamba: [
		28.92,
		28.92,
		0
	],
	"la-paz-bolivia": [
		21.38,
		21.38,
		0
	],
	sucre: [
		54.97,
		54.97,
		0
	],
	"banja-luka": [
		62.46,
		62.46,
		0
	],
	mostar: [
		78.06,
		78.06,
		0
	],
	sarajevo: [
		54.06,
		54.06,
		0
	],
	gaborone: [
		74.72,
		74.72,
		0
	],
	"balneario-camboriu": [
		44.35,
		44.35,
		0
	],
	barueri: [
		74.48,
		74.48,
		0
	],
	bauru: [
		55.54,
		55.54,
		0
	],
	belem: [
		47.33,
		47.33,
		0
	],
	"belo-horizonte": [
		65.92,
		65.92,
		0
	],
	"bento-goncalves": [
		48.85,
		48.85,
		0
	],
	blumenau: [
		47.08,
		47.08,
		0
	],
	"boa-vista": [
		64.94,
		51.92,
		0
	],
	brasilia: [
		144.68,
		144.68,
		0
	],
	"caldas-novas": [
		35.9,
		35.9,
		0
	],
	campinas: [
		51.12,
		51.12,
		0
	],
	"campo-grande": [
		36.73,
		36.73,
		0
	],
	"campos-do-jordao": [
		43.16,
		43.16,
		0
	],
	canela: [
		66.08,
		66.08,
		0
	],
	caraguatatuba: [
		50.3,
		42.47,
		0
	],
	"caxias-do-sul": [
		47.16,
		47.16,
		0
	],
	cuiaba: [
		79.48,
		79.48,
		0
	],
	curitiba: [
		32.33,
		32.33,
		0
	],
	florianopolis: [
		61.66,
		61.66,
		0
	],
	fortaleza: [
		50.54,
		50.54,
		0
	],
	"foz-do-iguacu": [
		51,
		51,
		0
	],
	"ouro-preto": [
		82.65,
		82.65,
		0
	],
	"presidente-prudente": [
		39.22,
		39.22,
		0
	],
	recife: [
		40.27,
		40.27,
		0
	],
	"rio-branco": [
		34.38,
		34.38,
		0
	],
	"rio-de-janeiro": [
		89.69,
		89.69,
		1
	],
	salvador: [
		50.95,
		50.95,
		0
	],
	"sao-paulo": [
		39.89,
		39.89,
		0
	],
	"bandar-seri-begawan": [
		60.2,
		60.2,
		0
	],
	burgas: [
		60,
		60,
		0
	],
	plovdiv: [
		56.52,
		56.52,
		0
	],
	sofia: [
		84.15,
		84.15,
		0
	],
	varna: [
		69.57,
		69.57,
		0
	],
	battambang: [
		45.94,
		45.94,
		0
	],
	"phnom-penh": [
		24.5,
		24.5,
		0
	],
	"siem-reap": [
		26.18,
		26.18,
		0
	],
	sihanoukville: [
		48.05,
		48.05,
		0
	],
	yaounde: [
		83.84,
		83.84,
		0
	],
	airdrie: [
		61.53,
		61.53,
		0
	],
	banff: [
		114.98,
		114.98,
		0
	],
	boucherville: [
		117.84,
		117.84,
		0
	],
	brossard: [
		109.21,
		109.21,
		0
	],
	burnaby: [
		115.02,
		115.02,
		0
	],
	calgary: [
		69.28,
		69.28,
		0
	],
	charlottetown: [
		109.33,
		109.33,
		0
	],
	chatham: [
		100.67,
		100.67,
		0
	],
	chilliwack: [
		78.75,
		78.75,
		0
	],
	fredericton: [
		106.41,
		94.75,
		0
	],
	halifax: [
		115.86,
		115.86,
		0
	],
	hamilton: [
		97.29,
		97.29,
		0
	],
	kelowna: [
		84.97,
		84.97,
		0
	],
	"kingston-canada": [
		86.68,
		86.68,
		0
	],
	montreal: [
		72.69,
		72.69,
		0
	],
	"niagara-falls": [
		87.1,
		83.1,
		0
	],
	"north-vancouver": [
		145.74,
		145.74,
		0
	],
	ottawa: [
		110.42,
		110.42,
		0
	],
	"quebec-city": [
		108.95,
		108.95,
		0
	],
	regina: [
		84.44,
		84.44,
		0
	],
	saskatoon: [
		92.13,
		92.13,
		0
	],
	"st-john-s": [
		98.76,
		98.76,
		0
	],
	toronto: [
		183.68,
		183.68,
		1
	],
	"vancouver-canada": [
		116.09,
		116.09,
		0
	],
	victoria: [
		94.13,
		94.13,
		0
	],
	whistler: [
		88.55,
		88.55,
		0
	],
	"windsor-canada": [
		91.12,
		91.12,
		0
	],
	winnipeg: [
		118.7,
		118.7,
		0
	],
	arica: [
		43.62,
		43.62,
		0
	],
	concepcion: [
		54.36,
		54.36,
		0
	],
	"puerto-varas": [
		82.92,
		82.92,
		0
	],
	"punta-arenas": [
		94.22,
		94.22,
		0
	],
	santiago: [
		60.2,
		60.2,
		0
	],
	beijing: [
		43.45,
		43.45,
		0
	],
	chengdu: [
		20.23,
		20.23,
		0
	],
	chongqing: [
		21.95,
		21.95,
		0
	],
	dalian: [
		35.05,
		35.05,
		0
	],
	guangzhou: [
		31.66,
		31.66,
		0
	],
	guilin: [
		35.17,
		35.17,
		0
	],
	hangzhou: [
		36.76,
		36.76,
		0
	],
	harbin: [
		22.8,
		22.8,
		0
	],
	kunming: [
		23.39,
		23.39,
		0
	],
	lijiang: [
		28.54,
		28.54,
		0
	],
	nanjing: [
		38.95,
		38.95,
		0
	],
	qingdao: [
		20.59,
		20.59,
		0
	],
	shanghai: [
		20.34,
		20.34,
		0
	],
	shenzhen: [
		22.32,
		22.32,
		0
	],
	suzhou: [
		21.57,
		21.57,
		0
	],
	xian: [
		23.45,
		23.45,
		0
	],
	yangshuo: [
		29.18,
		29.18,
		0
	],
	yantai: [
		33.85,
		33.85,
		0
	],
	barranquilla: [
		33.99,
		33.99,
		0
	],
	bogota: [
		38.35,
		38.35,
		0
	],
	cali: [
		59.95,
		59.95,
		0
	],
	medellin: [
		47.52,
		47.52,
		0
	],
	"santa-marta": [
		35.3,
		35.3,
		0
	],
	alajuela: [
		53.32,
		53.32,
		0
	],
	"san-jose-costa-rica": [
		47.73,
		47.73,
		0
	],
	dubrovnik: [
		81.8,
		81.8,
		0
	],
	makarska: [
		99.4,
		99.4,
		0
	],
	opatija: [
		76.19,
		76.19,
		0
	],
	osijek: [
		88.58,
		88.58,
		0
	],
	porec: [
		89.25,
		89.25,
		0
	],
	pula: [
		90.95,
		90.95,
		0
	],
	rovinj: [
		99.45,
		99.45,
		0
	],
	split: [
		69.8,
		69.8,
		0
	],
	trogir: [
		73.15,
		73.15,
		0
	],
	vodice: [
		81.45,
		81.45,
		0
	],
	zadar: [
		79,
		79,
		0
	],
	zagreb: [
		99.67,
		99.67,
		0
	],
	sibenik: [
		111.6,
		111.6,
		0
	],
	larnaca: [
		87.97,
		87.97,
		0
	],
	limassol: [
		77.08,
		77.08,
		0
	],
	nicosia: [
		65,
		65,
		0
	],
	paphos: [
		75,
		75,
		0
	],
	brno: [
		110.83,
		110.83,
		0
	],
	"ceske-budejovice": [
		80.5,
		80.5,
		0
	],
	olomouc: [
		83.23,
		83.23,
		0
	],
	prague: [
		52,
		52,
		1
	],
	aalborg: [
		95.65,
		95.65,
		1
	],
	aarhus: [
		104.34,
		104.34,
		1
	],
	copenhagen: [
		100.73,
		100.73,
		1
	],
	odense: [
		97.78,
		97.78,
		1
	],
	"santo-domingo": [
		56.05,
		56.05,
		0
	],
	"cuenca-ecuador": [
		28.77,
		28.77,
		0
	],
	quito: [
		39.8,
		39.8,
		0
	],
	aswan: [
		41.53,
		41.53,
		0
	],
	cairo: [
		19.57,
		19.57,
		0
	],
	hurghada: [
		14.71,
		14.71,
		0
	],
	luxor: [
		41.45,
		41.45,
		0
	],
	"sharm-el-sheikh": [
		91.5,
		91.5,
		0
	],
	tallinn: [
		52.74,
		52.74,
		0
	],
	tartu: [
		82,
		82,
		0
	],
	"addis-ababa": [
		35.55,
		35.55,
		0
	],
	nadi: [
		141.54,
		141.54,
		0
	],
	suva: [
		159.48,
		159.48,
		0
	],
	helsinki: [
		100.22,
		100.22,
		1
	],
	oulu: [
		83.7,
		83.7,
		0
	],
	rovaniemi: [
		195.5,
		195.5,
		0
	],
	tampere: [
		123,
		123,
		0
	],
	turku: [
		69.3,
		69.3,
		0
	],
	vaasa: [
		105.5,
		105.5,
		0
	],
	"aix-en-provence": [
		73.12,
		73.12,
		0
	],
	"aix-les-bains": [
		87.5,
		87.5,
		0
	],
	ajaccio: [
		79.2,
		79.2,
		0
	],
	amboise: [
		95.8,
		95.8,
		0
	],
	amiens: [
		66.46,
		66.46,
		0
	],
	angers: [
		84.3,
		84.3,
		0
	],
	annecy: [
		81.4,
		81.4,
		0
	],
	antibes: [
		68.56,
		68.56,
		0
	],
	arcachon: [
		78.64,
		78.64,
		0
	],
	arles: [
		86.48,
		86.48,
		0
	],
	arras: [
		91.4,
		91.4,
		0
	],
	avignon: [
		62.42,
		62.42,
		0
	],
	bastia: [
		69.2,
		69.2,
		0
	],
	bayeux: [
		54.45,
		54.45,
		0
	],
	bayonne: [
		92.02,
		92.02,
		0
	],
	beaune: [
		80.24,
		80.24,
		0
	],
	besancon: [
		79.97,
		79.97,
		0
	],
	biarritz: [
		115.48,
		115.48,
		0
	],
	blois: [
		71.54,
		71.54,
		0
	],
	bordeaux: [
		94.9,
		94.9,
		0
	],
	bourges: [
		82.98,
		82.98,
		0
	],
	brest: [
		74.76,
		74.76,
		0
	],
	beziers: [
		100.54,
		100.54,
		0
	],
	caen: [
		89.15,
		89.15,
		0
	],
	cannes: [
		82.64,
		82.64,
		0
	],
	carcassonne: [
		66.64,
		66.64,
		0
	],
	cassis: [
		96.42,
		96.42,
		0
	],
	"chalon-sur-saone": [
		94.23,
		89.12,
		0
	],
	chantilly: [
		122.24,
		122.24,
		0
	],
	chartres: [
		73.74,
		73.74,
		0
	],
	"clermont-ferrand": [
		48,
		48,
		0
	],
	cognac: [
		94.82,
		94.82,
		0
	],
	colmar: [
		99.3,
		99.3,
		0
	],
	compiegne: [
		78.9,
		78.9,
		0
	],
	dax: [
		82.6,
		82.6,
		0
	],
	deauville: [
		110.74,
		110.74,
		0
	],
	dijon: [
		75.32,
		75.32,
		0
	],
	dinan: [
		83.82,
		83.82,
		0
	],
	dinard: [
		162.18,
		162.18,
		0
	],
	dunkerque: [
		67.66,
		67.66,
		0
	],
	grenoble: [
		79.3,
		79.3,
		0
	],
	honfleur: [
		83.91,
		83.91,
		0
	],
	hyeres: [
		85.83,
		85.83,
		0
	],
	"la-baule": [
		78.7,
		78.7,
		0
	],
	"la-rochelle": [
		84.52,
		84.52,
		0
	],
	"le-havre": [
		65.62,
		65.62,
		0
	],
	"le-mans": [
		69.7,
		69.7,
		0
	],
	"le-puy-en-velay": [
		59.77,
		59.77,
		0
	],
	"le-touquet-paris-plage": [
		77,
		77,
		0
	],
	"les-sables-d-olonne": [
		76.8,
		76.8,
		0
	],
	lille: [
		63.52,
		63.52,
		0
	],
	limoges: [
		53.98,
		53.98,
		0
	],
	lourdes: [
		63.45,
		63.45,
		0
	],
	lyon: [
		78.11,
		78.11,
		0
	],
	marseille: [
		75.6,
		75.6,
		0
	],
	menton: [
		84.66,
		81.66,
		0
	],
	metz: [
		74.45,
		74.45,
		0
	],
	montpellier: [
		80.4,
		80.4,
		0
	],
	mulhouse: [
		71.8,
		71.8,
		0
	],
	nancy: [
		74.7,
		74.7,
		0
	],
	nantes: [
		77.69,
		77.69,
		0
	],
	narbonne: [
		132.62,
		132.62,
		0
	],
	nice: [
		79.56,
		79.56,
		1
	],
	nimes: [
		64.5,
		64.5,
		0
	],
	orleans: [
		86.45,
		86.45,
		0
	],
	pau: [
		89.84,
		89.84,
		0
	],
	perpignan: [
		68.18,
		68.18,
		0
	],
	poitiers: [
		74.8,
		74.8,
		0
	],
	"porto-vecchio": [
		87.2,
		87.2,
		0
	],
	perigueux: [
		73.6,
		73.6,
		0
	],
	quimper: [
		96.98,
		96.98,
		0
	],
	reims: [
		125.5,
		125.5,
		0
	],
	rennes: [
		84.24,
		84.24,
		0
	],
	rochefort: [
		53.41,
		53.41,
		0
	],
	roscoff: [
		101,
		101,
		0
	],
	rouen: [
		73.17,
		73.17,
		0
	],
	royan: [
		107.5,
		107.5,
		0
	],
	"saint-brieuc": [
		99.34,
		99.34,
		0
	],
	"saint-jean-de-luz": [
		100.9,
		100.9,
		0
	],
	"saint-malo": [
		86.7,
		86.7,
		0
	],
	"saint-raphael": [
		99.32,
		99.32,
		0
	],
	"saint-tropez": [
		135.1,
		135.1,
		0
	],
	"sarlat-la-caneda": [
		65.1,
		65.1,
		0
	],
	strasbourg: [
		73.3,
		73.3,
		0
	],
	toulon: [
		83.35,
		83.35,
		0
	],
	toulouse: [
		64.67,
		64.67,
		0
	],
	tours: [
		79.34,
		79.34,
		0
	],
	"trouville-sur-mer": [
		131.74,
		131.74,
		0
	],
	troyes: [
		73.19,
		73.19,
		0
	],
	valence: [
		93.9,
		93.9,
		0
	],
	vannes: [
		77.8,
		77.8,
		0
	],
	versailles: [
		101.8,
		101.8,
		0
	],
	vichy: [
		33.74,
		33.74,
		0
	],
	epinal: [
		73.4,
		73.4,
		0
	],
	"evian-les-bains": [
		97.4,
		97.4,
		0
	],
	cayenne: [
		98.4,
		98.4,
		0
	],
	batumi: [
		45.27,
		45.27,
		0
	],
	tbilisi: [
		34.81,
		34.81,
		0
	],
	aachen: [
		88.3,
		88.3,
		0
	],
	augsburg: [
		81,
		81,
		0
	],
	"bad-homburg-vor-der-hohe": [
		114.13,
		114.13,
		0
	],
	"baden-baden": [
		108.5,
		108.5,
		0
	],
	bayreuth: [
		88.2,
		88.2,
		0
	],
	berlin: [
		92.39,
		92.39,
		1
	],
	bielefeld: [
		159.28,
		113.33,
		0
	],
	binz: [
		86.11,
		86.11,
		0
	],
	bonn: [
		158.01,
		158.01,
		0
	],
	bremen: [
		75.7,
		75.7,
		0
	],
	bremerhaven: [
		105.67,
		104.5,
		0
	],
	chemnitz: [
		66.94,
		66.94,
		0
	],
	cologne: [
		197.69,
		197.69,
		0
	],
	cottbus: [
		110.49,
		106,
		0
	],
	darmstadt: [
		87.61,
		87.61,
		0
	],
	dortmund: [
		82.73,
		82.73,
		0
	],
	dresden: [
		73.67,
		73.67,
		0
	],
	duisburg: [
		59,
		59,
		0
	],
	dusseldorf: [
		80.5,
		80.5,
		0
	],
	eisenach: [
		122.1,
		85.2,
		0
	],
	emden: [
		128.25,
		128.25,
		0
	],
	erfurt: [
		109.2,
		109.2,
		0
	],
	essen: [
		75.2,
		75.2,
		0
	],
	flensburg: [
		100,
		100,
		0
	],
	frankfurt: [
		76.7,
		76.7,
		0
	],
	friedrichshafen: [
		88.2,
		88.2,
		0
	],
	fulda: [
		122,
		122,
		0
	],
	"garmisch-partenkirchen": [
		122,
		122,
		0
	],
	gottingen: [
		117,
		117,
		0
	],
	hamburg: [
		59.92,
		59.92,
		1
	],
	heidelberg: [
		101,
		101,
		0
	],
	heilbronn: [
		87.12,
		87.12,
		0
	],
	heringsdorf: [
		92.25,
		92.25,
		0
	],
	ingolstadt: [
		131.5,
		131.5,
		0
	],
	kaiserslautern: [
		96,
		96,
		0
	],
	karlsruhe: [
		105.62,
		105.62,
		0
	],
	kiel: [
		83.74,
		83.74,
		0
	],
	koblenz: [
		88,
		88,
		0
	],
	konstanz: [
		71.4,
		71.4,
		0
	],
	leipzig: [
		84.53,
		84.53,
		0
	],
	ludwigsburg: [
		84.1,
		84.1,
		0
	],
	"ludwigshafen-am-rhein": [
		104.54,
		104.54,
		0
	],
	lubeck: [
		71,
		71,
		0
	],
	mainz: [
		71.25,
		71.25,
		0
	],
	mannheim: [
		90.03,
		90.03,
		0
	],
	munich: [
		330.5,
		330.5,
		1
	],
	munster: [
		103.45,
		103.45,
		0
	],
	nuremberg: [
		337.25,
		337.25,
		0
	],
	oberstdorf: [
		193.8,
		193.8,
		0
	],
	offenbach: [
		55,
		55,
		0
	],
	osnabruck: [
		108.67,
		108.67,
		0
	],
	passau: [
		92,
		92,
		0
	],
	potsdam: [
		111,
		111,
		0
	],
	quedlinburg: [
		134,
		134,
		0
	],
	regensburg: [
		83.5,
		83.5,
		0
	],
	rostock: [
		79.4,
		79.4,
		0
	],
	saarbrucken: [
		68.83,
		68.83,
		0
	],
	schwerin: [
		112.4,
		112.4,
		0
	],
	stuttgart: [
		67,
		67,
		0
	],
	"timmendorfer-strand": [
		137.4,
		137.4,
		0
	],
	"titisee-neustadt": [
		180.3,
		180.3,
		0
	],
	travemunde: [
		131,
		126.42,
		0
	],
	tubingen: [
		165.92,
		165.92,
		0
	],
	ulm: [
		102.96,
		102.96,
		0
	],
	weimar: [
		88.65,
		88.65,
		0
	],
	wiesbaden: [
		94,
		94,
		0
	],
	wismar: [
		106.58,
		100.8,
		0
	],
	wolfsburg: [
		120.6,
		120.6,
		0
	],
	wurzburg: [
		109.2,
		109.2,
		0
	],
	accra: [
		71.54,
		71.54,
		0
	],
	athens: [
		63.19,
		63.19,
		1
	],
	heraklion: [
		58.5,
		58.5,
		0
	],
	hersonissos: [
		61,
		61,
		0
	],
	ierapetra: [
		65.5,
		65.5,
		0
	],
	loutraki: [
		60,
		60,
		0
	],
	nafplio: [
		84.5,
		84.5,
		0
	],
	"naxos-chora": [
		80.5,
		59.7,
		0
	],
	oia: [
		136.5,
		136.5,
		0
	],
	rethymno: [
		66.5,
		66.5,
		0
	],
	rhodes: [
		58.36,
		58.36,
		0
	],
	thessaloniki: [
		65,
		65,
		0
	],
	volos: [
		60.5,
		60.5,
		0
	],
	"antigua-guatemala": [
		53.68,
		53.68,
		0
	],
	georgetown: [
		134.94,
		134.94,
		0
	],
	comayagua: [
		87.07,
		87.07,
		0
	],
	"hong-kong": [
		225.38,
		225.38,
		1
	],
	budapest: [
		55,
		55,
		1
	],
	debrecen: [
		90.89,
		90.89,
		0
	],
	miskolc: [
		60.94,
		60.94,
		0
	],
	sopron: [
		85.34,
		85.34,
		0
	],
	zalaegerszeg: [
		104.2,
		104.2,
		0
	],
	reykjavik: [
		172.5,
		137.1,
		1
	],
	agra: [
		17.54,
		17.54,
		0
	],
	ahmedabad: [
		42.63,
		42.63,
		0
	],
	amritsar: [
		16.05,
		16.05,
		0
	],
	aurangabad: [
		62.1,
		62.1,
		0
	],
	bhopal: [
		40.51,
		40.51,
		0
	],
	bikaner: [
		47.77,
		47.77,
		0
	],
	chandigarh: [
		13.24,
		13.24,
		0
	],
	coimbatore: [
		26.8,
		26.8,
		0
	],
	hyderabad: [
		20.06,
		20.06,
		0
	],
	jaipur: [
		22.74,
		22.74,
		0
	],
	jodhpur: [
		17.68,
		17.68,
		0
	],
	kolkata: [
		28.89,
		28.89,
		0
	],
	"new-delhi": [
		14.45,
		14.45,
		0
	],
	pune: [
		11.3,
		11.3,
		0
	],
	shimla: [
		21.59,
		21.59,
		0
	],
	siliguri: [
		14.12,
		14.12,
		0
	],
	udaipur: [
		40.63,
		40.63,
		0
	],
	varanasi: [
		51.59,
		51.59,
		0
	],
	bali: [
		22.25,
		22.25,
		1
	],
	bandung: [
		26.57,
		26.57,
		0
	],
	banyuwangi: [
		30.17,
		30.17,
		0
	],
	bekasi: [
		26.9,
		26.9,
		0
	],
	bogor: [
		32.23,
		32.23,
		0
	],
	canggu: [
		47.29,
		47.29,
		0
	],
	cirebon: [
		20.98,
		20.98,
		0
	],
	denpasar: [
		24.35,
		24.35,
		0
	],
	jakarta: [
		26.76,
		26.76,
		0
	],
	jimbaran: [
		35.75,
		35.75,
		0
	],
	kuta: [
		23.21,
		23.21,
		0
	],
	legian: [
		17.84,
		17.84,
		0
	],
	lovina: [
		22.62,
		22.62,
		0
	],
	malang: [
		25.27,
		25.27,
		0
	],
	medan: [
		26.64,
		26.64,
		0
	],
	munduk: [
		82.58,
		82.58,
		0
	],
	"nusa-dua": [
		39.41,
		39.41,
		0
	],
	"nusa-lembongan": [
		50.17,
		50.17,
		0
	],
	"nusa-penida": [
		17.71,
		17.71,
		0
	],
	sanur: [
		25.82,
		25.82,
		0
	],
	semarang: [
		16.6,
		16.6,
		0
	],
	seminyak: [
		32.76,
		32.76,
		0
	],
	solo: [
		13.28,
		13.28,
		0
	],
	surabaya: [
		23.52,
		23.52,
		0
	],
	ubud: [
		19.75,
		19.75,
		0
	],
	yogyakarta: [
		18.07,
		18.07,
		0
	],
	baghdad: [
		74.59,
		74.59,
		0
	],
	cork: [
		92.5,
		92.5,
		0
	],
	"dublin-ireland": [
		96.75,
		96.75,
		1
	],
	galway: [
		113.05,
		113.05,
		0
	],
	"tel-aviv": [
		98.61,
		98.61,
		0
	],
	"abano-terme": [
		137,
		137,
		0
	],
	agrigento: [
		95.5,
		95.5,
		0
	],
	alba: [
		68,
		68,
		0
	],
	alessandria: [
		104,
		104,
		0
	],
	alghero: [
		60.16,
		60.16,
		0
	],
	amalfi: [
		90,
		90,
		0
	],
	ancona: [
		79.6,
		79.6,
		0
	],
	arezzo: [
		101,
		101,
		0
	],
	assisi: [
		111.5,
		111.5,
		0
	],
	asti: [
		107.6,
		107.6,
		0
	],
	bari: [
		123,
		123,
		0
	],
	benevento: [
		129.2,
		129.2,
		0
	],
	bergamo: [
		57.44,
		57.44,
		0
	],
	bologna: [
		293.25,
		293.25,
		0
	],
	bolzano: [
		114.84,
		114.84,
		0
	],
	brescia: [
		92.38,
		75,
		0
	],
	brindisi: [
		75,
		75,
		0
	],
	carpi: [
		138,
		138,
		0
	],
	caserta: [
		75.5,
		75.5,
		0
	],
	catania: [
		105.1,
		105.1,
		0
	],
	cattolica: [
		58.15,
		58.15,
		0
	],
	cefalu: [
		79,
		79,
		0
	],
	cesena: [
		117.5,
		117.5,
		0
	],
	cesenatico: [
		75,
		75,
		0
	],
	"chianciano-terme": [
		83.24,
		83.24,
		0
	],
	como: [
		85.11,
		85.11,
		0
	],
	cosenza: [
		112,
		112,
		0
	],
	cremona: [
		141,
		141,
		0
	],
	cuneo: [
		92.44,
		92.44,
		0
	],
	"desenzano-del-garda": [
		81,
		81,
		0
	],
	fano: [
		78,
		78,
		0
	],
	ferrara: [
		76,
		76,
		0
	],
	florence: [
		102,
		102,
		1
	],
	foggia: [
		80,
		80,
		0
	],
	foligno: [
		86.8,
		86.8,
		0
	],
	forli: [
		69,
		69,
		0
	],
	"forte-dei-marmi": [
		126,
		126,
		0
	],
	gaeta: [
		138.5,
		135,
		0
	],
	gallipoli: [
		79.65,
		79.65,
		0
	],
	genoa: [
		65.85,
		65.85,
		0
	],
	grosseto: [
		82.35,
		82.35,
		0
	],
	gubbio: [
		93.3,
		93.3,
		0
	],
	imola: [
		159.34,
		133.71,
		0
	],
	imperia: [
		124,
		124,
		0
	],
	"la-spezia": [
		87.8,
		87.8,
		0
	],
	"lamezia-terme": [
		62,
		62,
		0
	],
	latina: [
		90,
		90,
		0
	],
	lecce: [
		97.13,
		97.13,
		0
	],
	livorno: [
		103.75,
		94.4,
		0
	],
	lucca: [
		95.4,
		95.4,
		0
	],
	marsala: [
		76.75,
		76.75,
		0
	],
	matera: [
		157,
		157,
		0
	],
	merano: [
		88.17,
		88.17,
		0
	],
	messina: [
		93,
		86,
		0
	],
	milan: [
		187.4,
		187.4,
		1
	],
	modena: [
		202,
		202,
		0
	],
	modica: [
		80.7,
		80.7,
		0
	],
	monopoli: [
		108,
		108,
		0
	],
	"montecatini-terme": [
		55,
		55,
		0
	],
	naples: [
		82.31,
		82.31,
		0
	],
	olbia: [
		98.25,
		98.25,
		0
	],
	oristano: [
		80.75,
		80.75,
		0
	],
	orvieto: [
		139.4,
		139.4,
		0
	],
	ostuni: [
		148.88,
		148.88,
		0
	],
	palermo: [
		58.4,
		58.4,
		0
	],
	parma: [
		81.5,
		81.5,
		0
	],
	perugia: [
		89,
		89,
		0
	],
	pesaro: [
		49,
		49,
		0
	],
	pescara: [
		88,
		88,
		0
	],
	piacenza: [
		90.32,
		90.32,
		0
	],
	pisa: [
		81,
		81,
		0
	],
	"polignano-a-mare": [
		89,
		89,
		0
	],
	pompei: [
		80.25,
		80.25,
		0
	],
	pordenone: [
		109,
		109,
		0
	],
	potenza: [
		65,
		65,
		0
	],
	ragusa: [
		87.9,
		87.9,
		0
	],
	rapallo: [
		81,
		81,
		0
	],
	ravenna: [
		73,
		73,
		0
	],
	"reggio-emilia": [
		76,
		76,
		0
	],
	riccione: [
		33.1,
		33.1,
		0
	],
	rimini: [
		42,
		42,
		0
	],
	"riva-del-garda": [
		93.11,
		93.11,
		0
	],
	salerno: [
		123.1,
		123.1,
		0
	],
	"san-benedetto-del-tronto": [
		73.5,
		73.5,
		0
	],
	sanremo: [
		119,
		119,
		0
	],
	"santa-margherita-ligure": [
		144.38,
		144.38,
		0
	],
	senigallia: [
		71.4,
		71.4,
		0
	],
	"sestri-levante": [
		169.83,
		169.83,
		0
	],
	siena: [
		95.07,
		95.07,
		0
	],
	sirmione: [
		65.6,
		65.6,
		0
	],
	sorrento: [
		68,
		68,
		0
	],
	spoleto: [
		70.51,
		70.51,
		0
	],
	stresa: [
		95,
		95,
		0
	],
	syracuse: [
		93.92,
		93.92,
		0
	],
	taormina: [
		103.15,
		103.15,
		0
	],
	taranto: [
		59,
		59,
		0
	],
	trani: [
		138,
		138,
		0
	],
	trapani: [
		51,
		51,
		0
	],
	trento: [
		93.91,
		93.91,
		0
	],
	treviso: [
		114.9,
		114.9,
		0
	],
	trieste: [
		80,
		80,
		0
	],
	turin: [
		79.5,
		79.5,
		0
	],
	udine: [
		102.2,
		102.2,
		0
	],
	varese: [
		108.85,
		108.85,
		0
	],
	venice: [
		92,
		92,
		1
	],
	verona: [
		79,
		79,
		0
	],
	viareggio: [
		70.44,
		70.44,
		0
	],
	vicenza: [
		80.26,
		80.26,
		0
	],
	viterbo: [
		90.6,
		90.6,
		0
	],
	abidjan: [
		70.97,
		70.97,
		0
	],
	"kingston-jamaica": [
		195.71,
		195.71,
		0
	],
	akita: [
		46.49,
		46.49,
		0
	],
	aomori: [
		57.02,
		57.02,
		0
	],
	beppu: [
		49.76,
		49.76,
		0
	],
	chiba: [
		67.33,
		67.33,
		0
	],
	fukuoka: [
		83.8,
		83.8,
		0
	],
	hakodate: [
		49.24,
		49.24,
		0
	],
	hakone: [
		160.58,
		160.58,
		0
	],
	hamamatsu: [
		49.88,
		49.88,
		0
	],
	hiroshima: [
		80.69,
		80.69,
		0
	],
	kagoshima: [
		49.33,
		49.33,
		0
	],
	kanazawa: [
		59.68,
		59.68,
		0
	],
	kobe: [
		61.69,
		61.69,
		0
	],
	kumamoto: [
		64.59,
		64.59,
		0
	],
	kurashiki: [
		73.16,
		73.16,
		0
	],
	kyoto: [
		91.78,
		91.78,
		0
	],
	matsue: [
		224.95,
		224.95,
		0
	],
	matsumoto: [
		92.78,
		92.78,
		0
	],
	matsuyama: [
		42.12,
		42.12,
		0
	],
	miyazaki: [
		79.55,
		79.55,
		0
	],
	nagasaki: [
		89.93,
		89.93,
		0
	],
	nagoya: [
		41.4,
		41.4,
		0
	],
	naha: [
		45.84,
		45.84,
		0
	],
	nara: [
		96.14,
		96.14,
		0
	],
	okayama: [
		59.85,
		59.85,
		0
	],
	osaka: [
		42.12,
		42.12,
		0
	],
	sapporo: [
		45.92,
		45.92,
		0
	],
	sendai: [
		64.59,
		64.59,
		0
	],
	shizuoka: [
		43.02,
		43.02,
		0
	],
	toyama: [
		61.1,
		61.1,
		0
	],
	yamagata: [
		53.2,
		53.2,
		0
	],
	yokohama: [
		59.85,
		59.85,
		0
	],
	amman: [
		30.02,
		30.02,
		0
	],
	aqaba: [
		34.45,
		34.45,
		0
	],
	almaty: [
		39.03,
		39.03,
		0
	],
	astana: [
		38.65,
		38.65,
		0
	],
	atyrau: [
		26.35,
		26.35,
		0
	],
	mombasa: [
		85.28,
		85.28,
		0
	],
	nairobi: [
		57.95,
		57.95,
		0
	],
	"luang-prabang": [
		37.43,
		37.43,
		0
	],
	pakse: [
		33.16,
		33.16,
		0
	],
	vientiane: [
		11.19,
		11.19,
		0
	],
	liepaja: [
		50,
		50,
		0
	],
	riga: [
		28.81,
		28.81,
		0
	],
	beirut: [
		52.73,
		52.73,
		0
	],
	kaunas: [
		72.68,
		72.68,
		0
	],
	vilnius: [
		63.5,
		63.5,
		0
	],
	"luxembourg-city": [
		101.15,
		101.15,
		0
	],
	macao: [
		70.45,
		70.45,
		0
	],
	"johor-bahru": [
		25.04,
		25.04,
		0
	],
	male: [
		116.36,
		116.36,
		0
	],
	sliema: [
		60,
		60,
		0
	],
	valletta: [
		118,
		118,
		0
	],
	aguascalientes: [
		47.73,
		47.73,
		0
	],
	atlixco: [
		92.8,
		92.8,
		0
	],
	"cabo-san-lucas": [
		53.83,
		53.83,
		0
	],
	campeche: [
		54.91,
		54.91,
		0
	],
	cancun: [
		46.32,
		46.32,
		1
	],
	chihuahua: [
		58.3,
		58.3,
		0
	],
	"ciudad-victoria": [
		53.14,
		53.14,
		0
	],
	coatepec: [
		56.11,
		56.11,
		0
	],
	coatzacoalcos: [
		43.1,
		43.1,
		0
	],
	colima: [
		39.48,
		39.48,
		0
	],
	comitan: [
		30.36,
		30.36,
		0
	],
	"cordoba-mexico": [
		41.8,
		41.8,
		0
	],
	cozumel: [
		115.06,
		115.06,
		0
	],
	cuernavaca: [
		58.48,
		58.48,
		0
	],
	culiacan: [
		39.74,
		39.74,
		0
	],
	"guadalajara-mexico": [
		38.72,
		38.72,
		0
	],
	guanajuato: [
		56.02,
		56.02,
		0
	],
	"la-paz-mexico": [
		88.98,
		88.98,
		0
	],
	mazatlan: [
		68.11,
		68.11,
		0
	],
	"mexico-city": [
		62.03,
		62.03,
		1
	],
	monterrey: [
		84.9,
		84.9,
		0
	],
	morelia: [
		65.75,
		65.75,
		0
	],
	"merida-mexico": [
		53.07,
		53.07,
		0
	],
	palenque: [
		42.55,
		42.55,
		0
	],
	"playa-del-carmen": [
		69.86,
		69.86,
		0
	],
	puebla: [
		41.59,
		41.59,
		0
	],
	"puerto-vallarta": [
		85.34,
		85.34,
		0
	],
	queretaro: [
		59.68,
		59.68,
		0
	],
	"san-cristobal-de-las-casas": [
		45.23,
		45.23,
		0
	],
	"san-miguel-de-allende": [
		72.28,
		72.28,
		0
	],
	tampico: [
		77.86,
		77.86,
		0
	],
	tulum: [
		46.24,
		46.24,
		0
	],
	zacatecas: [
		41.23,
		41.23,
		0
	],
	chisinau: [
		54.84,
		54.84,
		0
	],
	ulaanbaatar: [
		64.91,
		64.91,
		0
	],
	budva: [
		64.56,
		64.56,
		0
	],
	kotor: [
		109.28,
		109.28,
		0
	],
	casablanca: [
		51.01,
		51.01,
		0
	],
	essaouira: [
		49.1,
		49.1,
		0
	],
	rabat: [
		79.17,
		79.17,
		0
	],
	tangier: [
		58.7,
		58.7,
		0
	],
	yangon: [
		23.55,
		23.55,
		0
	],
	swakopmund: [
		139.12,
		139.12,
		0
	],
	windhoek: [
		76.81,
		76.81,
		0
	],
	kathmandu: [
		19.43,
		19.43,
		0
	],
	pokhara: [
		34.55,
		34.55,
		0
	],
	alkmaar: [
		106.72,
		106.72,
		0
	],
	amersfoort: [
		110.06,
		110.06,
		0
	],
	amstelveen: [
		97.19,
		97.19,
		0
	],
	amsterdam: [
		110.11,
		110.11,
		1
	],
	apeldoorn: [
		144.38,
		144.38,
		0
	],
	arnhem: [
		96.18,
		96.18,
		0
	],
	breda: [
		134.4,
		134.4,
		0
	],
	delft: [
		103,
		103,
		0
	],
	"den-bosch": [
		154.85,
		154.85,
		0
	],
	deventer: [
		132.9,
		132.9,
		0
	],
	eindhoven: [
		137.8,
		137.8,
		0
	],
	groningen: [
		138.45,
		138.45,
		0
	],
	haarlem: [
		133.4,
		133.4,
		0
	],
	leeuwarden: [
		119.54,
		115.8,
		0
	],
	maastricht: [
		92.73,
		92.73,
		0
	],
	nijmegen: [
		155.81,
		155.81,
		0
	],
	rotterdam: [
		98.36,
		98.36,
		0
	],
	"the-hague": [
		105.1,
		105.1,
		0
	],
	tilburg: [
		159.26,
		159.26,
		0
	],
	utrecht: [
		133.3,
		133.3,
		0
	],
	valkenburg: [
		108.28,
		108.28,
		0
	],
	zaandam: [
		83.27,
		83.27,
		0
	],
	zandvoort: [
		83.85,
		83.85,
		0
	],
	zwolle: [
		162.5,
		162.5,
		0
	],
	auckland: [
		118.17,
		118.17,
		0
	],
	christchurch: [
		80,
		80,
		0
	],
	dunedin: [
		148.99,
		148.99,
		0
	],
	queenstown: [
		261.11,
		261.11,
		0
	],
	wellington: [
		96.36,
		96.36,
		0
	],
	"granada-nicaragua": [
		23.89,
		23.89,
		0
	],
	"leon-nicaragua": [
		70.23,
		70.23,
		0
	],
	abuja: [
		31.41,
		31.41,
		0
	],
	ikeja: [
		95.97,
		66.31,
		0
	],
	"lagos-nigeria": [
		71.45,
		71.45,
		0
	],
	bitola: [
		51,
		51,
		0
	],
	ohrid: [
		58.5,
		58.5,
		0
	],
	skopje: [
		52.25,
		52.25,
		0
	],
	bergen: [
		88.68,
		88.68,
		0
	],
	oslo: [
		125.7,
		125.7,
		1
	],
	stavanger: [
		178.58,
		178.58,
		0
	],
	tromso: [
		249.26,
		249.26,
		0
	],
	trondheim: [
		104.02,
		104.02,
		0
	],
	alesund: [
		121.23,
		121.23,
		0
	],
	muscat: [
		47.59,
		47.59,
		0
	],
	salalah: [
		29.37,
		29.37,
		0
	],
	karachi: [
		24.9,
		24.9,
		0
	],
	"panama-city": [
		51.16,
		51.16,
		0
	],
	asuncion: [
		35.41,
		35.41,
		0
	],
	arequipa: [
		25.37,
		25.37,
		0
	],
	cajamarca: [
		25.36,
		25.36,
		0
	],
	chiclayo: [
		27.8,
		27.8,
		0
	],
	cusco: [
		25.41,
		25.41,
		0
	],
	iquitos: [
		25.91,
		25.91,
		0
	],
	lima: [
		40.22,
		40.22,
		0
	],
	bacolod: [
		25.44,
		25.44,
		0
	],
	"cebu-city": [
		24.76,
		24.76,
		0
	],
	dumaguete: [
		33.03,
		27.75,
		0
	],
	manila: [
		27.73,
		27.73,
		0
	],
	"puerto-princesa": [
		18.53,
		18.53,
		0
	],
	bialystok: [
		71.26,
		71.26,
		0
	],
	"bielsko-biala": [
		58.43,
		58.43,
		0
	],
	bydgoszcz: [
		81.8,
		81.8,
		0
	],
	bytom: [
		48.69,
		48.69,
		0
	],
	chorzow: [
		45.83,
		45.83,
		0
	],
	czestochowa: [
		51.55,
		51.55,
		0
	],
	gdansk: [
		42.55,
		42.55,
		0
	],
	gdynia: [
		70.58,
		70.58,
		0
	],
	gliwice: [
		64.16,
		64.16,
		0
	],
	karpacz: [
		97.7,
		97.7,
		0
	],
	katowice: [
		49.65,
		49.65,
		0
	],
	kielce: [
		60.72,
		60.72,
		0
	],
	kolobrzeg: [
		80.05,
		80.05,
		0
	],
	krakow: [
		54.77,
		54.77,
		1
	],
	"krynica-zdroj": [
		62.59,
		62.59,
		0
	],
	lublin: [
		52.68,
		52.68,
		0
	],
	miedzyzdroje: [
		64.61,
		64.61,
		0
	],
	olsztyn: [
		68.88,
		68.88,
		0
	],
	opole: [
		57.74,
		57.74,
		0
	],
	poznan: [
		62.26,
		62.26,
		0
	],
	rzeszow: [
		58.43,
		58.43,
		0
	],
	sopot: [
		73.49,
		73.49,
		0
	],
	szczecin: [
		60.8,
		60.8,
		0
	],
	szczyrk: [
		86.11,
		86.11,
		0
	],
	"szklarska-poreba": [
		76.94,
		76.94,
		0
	],
	torun: [
		75.57,
		75.57,
		0
	],
	ustka: [
		80.56,
		80.56,
		0
	],
	warsaw: [
		69.08,
		69.08,
		1
	],
	wisla: [
		74.06,
		74.06,
		0
	],
	wroclaw: [
		50.47,
		50.47,
		0
	],
	zakopane: [
		83.41,
		83.41,
		0
	],
	"zielona-gora": [
		65.88,
		65.88,
		0
	],
	lodz: [
		63.39,
		63.39,
		0
	],
	swinoujscie: [
		67.7,
		67.7,
		0
	],
	albufeira: [
		44,
		44,
		0
	],
	amarante: [
		65,
		65,
		0
	],
	"angra-do-heroismo": [
		57.5,
		57.5,
		0
	],
	aveiro: [
		64.5,
		64.5,
		0
	],
	braga: [
		53,
		53,
		0
	],
	braganca: [
		52.2,
		52.2,
		0
	],
	"caldas-da-rainha": [
		61,
		61,
		0
	],
	cascais: [
		117.5,
		117.5,
		0
	],
	chaves: [
		71.04,
		71.04,
		0
	],
	coimbra: [
		79,
		79,
		0
	],
	estoril: [
		71,
		71,
		0
	],
	faro: [
		69.1,
		69.1,
		0
	],
	funchal: [
		115.29,
		115.29,
		0
	],
	fatima: [
		52.8,
		52.8,
		0
	],
	guimaraes: [
		47.78,
		47.78,
		0
	],
	horta: [
		40,
		40,
		0
	],
	"lagos-portugal": [
		46.8,
		46.8,
		0
	],
	lamego: [
		98,
		98,
		0
	],
	leiria: [
		62.7,
		62.7,
		0
	],
	lisbon: [
		236.8,
		172,
		1
	],
	nazare: [
		62,
		62,
		0
	],
	olhao: [
		56,
		56,
		0
	],
	peniche: [
		72.2,
		72.2,
		0
	],
	"ponta-delgada": [
		57.76,
		57.76,
		0
	],
	"ponte-de-lima": [
		72.63,
		72.63,
		0
	],
	portimao: [
		49.5,
		49.5,
		0
	],
	porto: [
		80.03,
		80.03,
		1
	],
	"porto-moniz": [
		162,
		162,
		0
	],
	quarteira: [
		62.5,
		62.5,
		0
	],
	sesimbra: [
		104,
		104,
		0
	],
	setubal: [
		61.6,
		61.6,
		0
	],
	sintra: [
		95,
		95,
		0
	],
	tavira: [
		84,
		84,
		0
	],
	tomar: [
		85,
		85,
		0
	],
	"viana-do-castelo": [
		57.55,
		57.55,
		0
	],
	"vila-real": [
		110,
		110,
		0
	],
	vilamoura: [
		92,
		92,
		0
	],
	viseu: [
		70,
		70,
		0
	],
	evora: [
		58,
		58,
		0
	],
	obidos: [
		73.3,
		73.3,
		0
	],
	doha: [
		40.85,
		40.85,
		0
	],
	brasov: [
		80.92,
		80.92,
		0
	],
	bucharest: [
		49.31,
		49.31,
		0
	],
	"cluj-napoca": [
		56.32,
		56.32,
		0
	],
	constanta: [
		56.92,
		56.92,
		0
	],
	craiova: [
		45.59,
		45.59,
		0
	],
	kigali: [
		66.08,
		66.08,
		0
	],
	apia: [
		128.47,
		128.47,
		0
	],
	jeddah: [
		50.22,
		50.22,
		0
	],
	riyadh: [
		64.52,
		64.52,
		0
	],
	"ta-if": [
		41.78,
		41.78,
		0
	],
	dakar: [
		46.56,
		46.56,
		0
	],
	belgrade: [
		41.72,
		41.72,
		0
	],
	"novi-sad": [
		69.92,
		69.92,
		0
	],
	freetown: [
		191.94,
		191.94,
		0
	],
	singapore: [
		86.98,
		86.98,
		1
	],
	bratislava: [
		117.7,
		117.7,
		0
	],
	kosice: [
		87,
		87,
		0
	],
	bled: [
		129.26,
		129.26,
		0
	],
	ljubljana: [
		78.26,
		78.26,
		0
	],
	bloemfontein: [
		82.83,
		82.83,
		0
	],
	"cape-town": [
		49.28,
		49.28,
		1
	],
	durban: [
		64.21,
		64.21,
		0
	],
	johannesburg: [
		53.24,
		53.24,
		0
	],
	"newcastle-south-africa": [
		56.63,
		56.63,
		0
	],
	stellenbosch: [
		170.75,
		170.75,
		0
	],
	busan: [
		56,
		56,
		0
	],
	daegu: [
		57.24,
		57.24,
		0
	],
	daejeon: [
		56.81,
		56.81,
		0
	],
	gyeongju: [
		64.76,
		64.76,
		0
	],
	incheon: [
		45.45,
		45.45,
		0
	],
	seoul: [
		75.49,
		75.49,
		0
	],
	suwon: [
		48.45,
		48.45,
		0
	],
	"a-coruna": [
		62.9,
		62.9,
		0
	],
	adeje: [
		130.04,
		130.04,
		0
	],
	albacete: [
		53.1,
		53.1,
		0
	],
	"alcala-de-henares": [
		69,
		69,
		0
	],
	alcobendas: [
		93.6,
		93.6,
		0
	],
	algeciras: [
		63,
		63,
		0
	],
	alicante: [
		72.45,
		72.45,
		0
	],
	almeria: [
		45.5,
		45.5,
		0
	],
	almunecar: [
		60,
		60,
		0
	],
	altea: [
		71,
		71,
		0
	],
	antequera: [
		60,
		60,
		0
	],
	aranjuez: [
		94,
		94,
		0
	],
	arrecife: [
		94.5,
		94.5,
		0
	],
	astorga: [
		74.25,
		74.25,
		0
	],
	aviles: [
		68,
		68,
		0
	],
	badajoz: [
		59.84,
		59.84,
		0
	],
	baeza: [
		67.5,
		52.25,
		0
	],
	benalmadena: [
		68.04,
		68.04,
		0
	],
	benicassim: [
		68,
		68,
		0
	],
	benidorm: [
		89,
		89,
		0
	],
	bilbao: [
		118.15,
		118.15,
		0
	],
	burgos: [
		61.65,
		61.65,
		0
	],
	calpe: [
		73.8,
		73.8,
		0
	],
	cartagena: [
		65,
		65,
		0
	],
	castelldefels: [
		81.98,
		81.98,
		0
	],
	"castellon-de-la-plana": [
		61.9,
		61.9,
		0
	],
	"chiclana-de-la-frontera": [
		68.01,
		68.01,
		0
	],
	"ciudad-real": [
		49.5,
		49.5,
		0
	],
	"conil-de-la-frontera": [
		55.1,
		55.1,
		0
	],
	corralejo: [
		195,
		195,
		0
	],
	"cuenca-spain": [
		53,
		53,
		0
	],
	cullera: [
		69.08,
		69.08,
		0
	],
	caceres: [
		78.3,
		78.3,
		0
	],
	cadiz: [
		64.35,
		64.35,
		0
	],
	"cordoba-spain": [
		49,
		49,
		0
	],
	denia: [
		66.24,
		66.24,
		0
	],
	"el-puerto-de-santa-maria": [
		51,
		51,
		0
	],
	elche: [
		58.95,
		58.95,
		0
	],
	estepona: [
		99,
		99,
		0
	],
	ferrol: [
		55,
		55,
		0
	],
	figueres: [
		61.98,
		61.98,
		0
	],
	fuengirola: [
		55,
		55,
		0
	],
	gandia: [
		60,
		60,
		0
	],
	getafe: [
		84,
		84,
		0
	],
	gijon: [
		57.6,
		57.6,
		0
	],
	girona: [
		76.98,
		76.98,
		0
	],
	"granada-spain": [
		63.7,
		63.7,
		0
	],
	"guadalajara-spain": [
		96,
		96,
		0
	],
	hondarribia: [
		79,
		79,
		0
	],
	huelva: [
		67.5,
		67.5,
		0
	],
	huesca: [
		85.09,
		85.09,
		0
	],
	ibiza: [
		84.05,
		84.05,
		0
	],
	jaca: [
		56.65,
		56.65,
		0
	],
	jaen: [
		87,
		87,
		0
	],
	"jerez-de-la-frontera": [
		62,
		62,
		0
	],
	"las-palmas-de-gran-canaria": [
		69.5,
		69.5,
		0
	],
	"leon-spain": [
		57,
		57,
		0
	],
	llanes: [
		67,
		67,
		0
	],
	lleida: [
		60.3,
		60.3,
		0
	],
	"lloret-de-mar": [
		44.54,
		44.54,
		0
	],
	logrono: [
		64.35,
		64.35,
		0
	],
	lugo: [
		64.5,
		64.5,
		0
	],
	madrid: [
		77.4,
		77.4,
		1
	],
	mahon: [
		86.66,
		86.66,
		0
	],
	marbella: [
		75.49,
		75.49,
		0
	],
	maspalomas: [
		279.78,
		279.78,
		0
	],
	mataro: [
		76.68,
		76.68,
		0
	],
	motril: [
		72,
		72,
		0
	],
	murcia: [
		53.55,
		53.55,
		0
	],
	malaga: [
		85,
		85,
		1
	],
	"merida-spain": [
		52.2,
		52.2,
		0
	],
	nerja: [
		92,
		92,
		0
	],
	ourense: [
		61.75,
		61.75,
		0
	],
	oviedo: [
		58.95,
		58.95,
		0
	],
	palma: [
		110.86,
		110.86,
		1
	],
	pamplona: [
		64.26,
		64.26,
		0
	],
	plasencia: [
		80,
		69.92,
		0
	],
	"playa-blanca": [
		108,
		108,
		0
	],
	ponferrada: [
		64,
		64,
		0
	],
	"puerto-de-la-cruz": [
		83.16,
		83.16,
		0
	],
	"puerto-del-carmen": [
		137,
		137,
		0
	],
	ribadesella: [
		70,
		70,
		0
	],
	ronda: [
		63.62,
		63.62,
		0
	],
	roses: [
		68.68,
		68.68,
		0
	],
	sabadell: [
		83.89,
		83.89,
		0
	],
	salamanca: [
		45,
		45,
		0
	],
	salou: [
		52.48,
		52.48,
		0
	],
	"san-sebastian": [
		71.1,
		71.1,
		0
	],
	"sanlucar-de-barrameda": [
		59,
		59,
		0
	],
	"santa-cruz-de-tenerife": [
		65,
		65,
		0
	],
	santander: [
		66.6,
		66.6,
		0
	],
	"santiago-de-compostela": [
		55.5,
		55.5,
		0
	],
	segovia: [
		65,
		65,
		0
	],
	seville: [
		82.5,
		82.5,
		1
	],
	sitges: [
		76.23,
		76.23,
		0
	],
	soria: [
		77,
		77,
		0
	],
	tarifa: [
		84,
		84,
		0
	],
	tarragona: [
		60.48,
		60.48,
		0
	],
	terrassa: [
		146.89,
		84.95,
		0
	],
	teruel: [
		58.5,
		58.5,
		0
	],
	toledo: [
		60,
		60,
		0
	],
	torremolinos: [
		55,
		55,
		0
	],
	torrevieja: [
		60,
		60,
		0
	],
	tudela: [
		73.28,
		73.28,
		0
	],
	"valencia-spain": [
		75.05,
		75.05,
		1
	],
	valladolid: [
		71.1,
		71.1,
		0
	],
	vigo: [
		50,
		50,
		0
	],
	"vitoria-gasteiz": [
		77.4,
		77.4,
		0
	],
	zamora: [
		66.5,
		66.5,
		0
	],
	zaragoza: [
		68.4,
		68.4,
		0
	],
	avila: [
		55.35,
		55.35,
		0
	],
	ubeda: [
		56,
		56,
		0
	],
	colombo: [
		67.27,
		67.27,
		0
	],
	dambulla: [
		14.13,
		14.13,
		0
	],
	kandy: [
		37.04,
		37.04,
		0
	],
	gothenburg: [
		59.52,
		59.52,
		0
	],
	lund: [
		78.95,
		78.95,
		0
	],
	malmo: [
		101.89,
		101.89,
		0
	],
	stockholm: [
		231.03,
		231.03,
		1
	],
	umea: [
		52.35,
		52.35,
		0
	],
	uppsala: [
		122.14,
		122.14,
		0
	],
	ascona: [
		189.62,
		189.62,
		0
	],
	basel: [
		151.82,
		151.82,
		0
	],
	bern: [
		170.51,
		170.51,
		0
	],
	fribourg: [
		142.72,
		142.72,
		0
	],
	geneva: [
		98.03,
		98.03,
		1
	],
	grindelwald: [
		328.1,
		328.1,
		0
	],
	interlaken: [
		182.1,
		182.1,
		0
	],
	lausanne: [
		120.69,
		120.69,
		0
	],
	locarno: [
		178.93,
		178.93,
		0
	],
	lucerne: [
		136.79,
		136.79,
		0
	],
	lugano: [
		141.75,
		141.75,
		0
	],
	montreux: [
		134.46,
		134.46,
		0
	],
	pontresina: [
		334.77,
		334.77,
		0
	],
	"st-gallen": [
		109.05,
		109.05,
		0
	],
	thun: [
		191.1,
		191.1,
		0
	],
	vevey: [
		141.34,
		141.34,
		0
	],
	zurich: [
		184.69,
		184.69,
		1
	],
	kaohsiung: [
		21.16,
		21.16,
		0
	],
	taichung: [
		21.98,
		21.98,
		0
	],
	tainan: [
		19.23,
		19.23,
		0
	],
	taipei: [
		41.53,
		41.53,
		0
	],
	arusha: [
		38.87,
		38.87,
		0
	],
	"dar-es-salaam": [
		66.74,
		66.74,
		0
	],
	"zanzibar-city": [
		65.87,
		65.87,
		0
	],
	bangkok: [
		26.04,
		26.04,
		1
	],
	"chiang-mai": [
		27.53,
		27.53,
		0
	],
	"chiang-rai": [
		16.94,
		16.94,
		0
	],
	"hat-yai": [
		19.29,
		19.29,
		0
	],
	"hua-hin": [
		34.13,
		34.13,
		0
	],
	pattaya: [
		18.63,
		18.63,
		0
	],
	phuket: [
		29.18,
		29.18,
		0
	],
	tunis: [
		43.6,
		43.6,
		0
	],
	adana: [
		79.92,
		79.92,
		0
	],
	alanya: [
		23.74,
		23.74,
		0
	],
	ankara: [
		60.22,
		60.22,
		0
	],
	antalya: [
		100,
		100,
		0
	],
	bursa: [
		58.94,
		58.94,
		0
	],
	corlu: [
		63.75,
		63.75,
		0
	],
	denizli: [
		53.68,
		53.68,
		0
	],
	diyarbakir: [
		100,
		100,
		0
	],
	edirne: [
		77.97,
		77.97,
		0
	],
	erzurum: [
		68.4,
		68.4,
		0
	],
	eskisehir: [
		60.94,
		60.94,
		0
	],
	gaziantep: [
		60,
		60,
		0
	],
	istanbul: [
		75.6,
		75.6,
		1
	],
	izmir: [
		81.6,
		81.6,
		0
	],
	kayseri: [
		71.04,
		71.04,
		0
	],
	kemer: [
		33.25,
		33.25,
		0
	],
	konya: [
		65.53,
		65.53,
		0
	],
	kusadasi: [
		50,
		50,
		0
	],
	marmaris: [
		40,
		40,
		0
	],
	samsun: [
		56.2,
		56.2,
		0
	],
	side: [
		48.12,
		48.12,
		0
	],
	trabzon: [
		44.29,
		44.29,
		0
	],
	canakkale: [
		68.4,
		68.4,
		0
	],
	cherkasy: [
		54.88,
		54.88,
		0
	],
	chernivtsi: [
		40.99,
		40.99,
		0
	],
	"abu-dhabi": [
		95.05,
		95.05,
		0
	],
	ajman: [
		145.41,
		145.41,
		0
	],
	sharjah: [
		62.24,
		62.24,
		0
	],
	aberdeen: [
		60.95,
		60.95,
		0
	],
	alnwick: [
		101.77,
		101.77,
		0
	],
	ayr: [
		94.13,
		94.13,
		0
	],
	barnstaple: [
		88.59,
		88.59,
		0
	],
	basingstoke: [
		121.82,
		121.82,
		0
	],
	bath: [
		75.3,
		75.3,
		0
	],
	belfast: [
		71.58,
		71.58,
		0
	],
	birmingham: [
		49.55,
		49.55,
		0
	],
	blackpool: [
		62.95,
		62.95,
		0
	],
	bournemouth: [
		84.22,
		84.22,
		0
	],
	bridgwater: [
		120.65,
		91.28,
		0
	],
	bristol: [
		109.11,
		109.11,
		0
	],
	burnley: [
		106.67,
		106.67,
		0
	],
	cambridge: [
		136.97,
		136.97,
		0
	],
	canterbury: [
		85.8,
		85.8,
		0
	],
	cardiff: [
		55.95,
		55.95,
		0
	],
	carlisle: [
		107.02,
		107.02,
		0
	],
	cheltenham: [
		135.22,
		135.22,
		0
	],
	chester: [
		96.75,
		96.75,
		0
	],
	chesterfield: [
		82.36,
		82.36,
		0
	],
	cirencester: [
		140.59,
		140.59,
		0
	],
	colchester: [
		85.68,
		85.68,
		0
	],
	conwy: [
		107.02,
		107.02,
		0
	],
	coventry: [
		104.92,
		104.92,
		0
	],
	crawley: [
		108.41,
		108.41,
		0
	],
	cromer: [
		133.47,
		118.95,
		0
	],
	darlington: [
		114.36,
		114.36,
		0
	],
	derby: [
		83.06,
		83.06,
		0
	],
	"derry-londonderry": [
		94.42,
		94.42,
		0
	],
	doncaster: [
		74.59,
		74.59,
		0
	],
	dundee: [
		55.95,
		55.95,
		0
	],
	"durham-united-kingdom": [
		88.13,
		88.13,
		0
	],
	eastbourne: [
		89.18,
		89.18,
		0
	],
	edinburgh: [
		121.76,
		121.76,
		1
	],
	enniskillen: [
		128.44,
		128.44,
		0
	],
	exeter: [
		102.58,
		102.58,
		0
	],
	falmouth: [
		118.91,
		118.91,
		0
	],
	farnborough: [
		116.67,
		116.67,
		0
	],
	folkestone: [
		75.77,
		67.61,
		0
	],
	glasgow: [
		88.13,
		88.13,
		0
	],
	gloucester: [
		110.75,
		110.75,
		0
	],
	"great-yarmouth": [
		92.5,
		92.5,
		0
	],
	guildford: [
		131.15,
		131.15,
		0
	],
	harrogate: [
		115.41,
		115.41,
		0
	],
	huddersfield: [
		64.11,
		64.11,
		0
	],
	hull: [
		131.72,
		131.72,
		0
	],
	inverness: [
		90.17,
		90.17,
		0
	],
	ipswich: [
		133.76,
		133.76,
		0
	],
	leeds: [
		101.56,
		101.56,
		0
	],
	leicester: [
		98.37,
		98.37,
		0
	],
	lincoln: [
		71.86,
		71.86,
		0
	],
	liverpool: [
		62.95,
		62.95,
		0
	],
	luton: [
		102.14,
		102.14,
		0
	],
	maidstone: [
		128.23,
		128.23,
		0
	],
	manchester: [
		101.74,
		101.74,
		0
	],
	middlesbrough: [
		161.45,
		161.45,
		0
	],
	"milton-keynes": [
		148.17,
		148.17,
		0
	],
	"newcastle-upon-tyne": [
		69.36,
		69.36,
		0
	],
	newquay: [
		169.03,
		169.03,
		0
	],
	norwich: [
		129.98,
		129.98,
		0
	],
	nottingham: [
		158.54,
		97.11,
		0
	],
	oban: [
		100.24,
		100.24,
		0
	],
	oxford: [
		187.1,
		187.1,
		0
	],
	paignton: [
		55.02,
		55.02,
		0
	],
	peterborough: [
		114.24,
		114.24,
		0
	],
	pitlochry: [
		134.64,
		134.64,
		0
	],
	"plymouth-united-kingdom": [
		71.11,
		71.11,
		0
	],
	portree: [
		178.35,
		178.35,
		0
	],
	portrush: [
		83,
		83,
		0
	],
	"portsmouth-united-kingdom": [
		106.08,
		106.08,
		0
	],
	preston: [
		113.08,
		102.99,
		0
	],
	reading: [
		111.47,
		111.47,
		0
	],
	"royal-tunbridge-wells": [
		159.53,
		153.88,
		0
	],
	rye: [
		161.57,
		161.57,
		0
	],
	salisbury: [
		91.51,
		91.51,
		0
	],
	scarborough: [
		48.96,
		48.96,
		0
	],
	sheffield: [
		86.17,
		86.17,
		0
	],
	shrewsbury: [
		123.28,
		123.28,
		0
	],
	slough: [
		75.8,
		75.8,
		0
	],
	southampton: [
		82.05,
		82.05,
		0
	],
	southport: [
		88.19,
		88.19,
		0
	],
	"st-albans": [
		171.94,
		171.94,
		0
	],
	"st-andrews": [
		202.84,
		202.84,
		0
	],
	sunderland: [
		101.75,
		101.75,
		0
	],
	swansea: [
		89.18,
		89.18,
		0
	],
	tenby: [
		115.99,
		115.99,
		0
	],
	torquay: [
		74.03,
		74.03,
		0
	],
	truro: [
		127.58,
		127.58,
		0
	],
	watford: [
		153.29,
		153.29,
		0
	],
	whitstable: [
		110.16,
		110.16,
		0
	],
	winchester: [
		141.79,
		141.79,
		0
	],
	windermere: [
		122.75,
		122.75,
		0
	],
	"windsor-united-kingdom": [
		115.64,
		115.64,
		0
	],
	woking: [
		199.21,
		199.21,
		0
	],
	"worcester-united-kingdom": [
		96.31,
		96.31,
		0
	],
	york: [
		128.23,
		128.23,
		0
	],
	akron: [
		108.17,
		94.83,
		0
	],
	albuquerque: [
		95.83,
		95.83,
		0
	],
	alexandria: [
		136.05,
		136.05,
		0
	],
	alpharetta: [
		86.77,
		86.77,
		0
	],
	altoona: [
		89.72,
		89.72,
		0
	],
	amarillo: [
		106.1,
		106.1,
		0
	],
	ames: [
		88.4,
		88.4,
		0
	],
	anaheim: [
		121.04,
		121.04,
		0
	],
	"ann-arbor": [
		84.44,
		84.44,
		0
	],
	annapolis: [
		97.47,
		97.47,
		0
	],
	appleton: [
		74.82,
		74.82,
		0
	],
	arcadia: [
		115.95,
		115.95,
		0
	],
	arlington: [
		100.42,
		100.42,
		0
	],
	asheville: [
		81.6,
		81.6,
		0
	],
	atlanta: [
		80.97,
		80.97,
		0
	],
	"atlantic-city": [
		86.06,
		86.06,
		0
	],
	"auburn-alabama": [
		97.8,
		97.8,
		0
	],
	augusta: [
		81.52,
		81.52,
		0
	],
	aurora: [
		79.92,
		79.92,
		0
	],
	austin: [
		71.89,
		71.89,
		0
	],
	bakersfield: [
		98.88,
		98.88,
		0
	],
	baltimore: [
		113.48,
		113.48,
		0
	],
	"baton-rouge": [
		85.27,
		85.27,
		0
	],
	beaverton: [
		90.12,
		90.12,
		0
	],
	bellevue: [
		103.22,
		103.22,
		0
	],
	bellingham: [
		113.89,
		113.89,
		0
	],
	bend: [
		81.22,
		81.22,
		0
	],
	bentonville: [
		86.35,
		86.35,
		0
	],
	berkeley: [
		150.25,
		150.25,
		0
	],
	bethesda: [
		172.59,
		129.88,
		0
	],
	bethlehem: [
		99.03,
		99.03,
		0
	],
	billings: [
		97.19,
		97.19,
		0
	],
	biloxi: [
		60.17,
		60.17,
		0
	],
	binghamton: [
		109.7,
		109.7,
		0
	],
	"birmingham-alabama": [
		125.76,
		125.76,
		0
	],
	bismarck: [
		76.5,
		76.5,
		0
	],
	blacksburg: [
		82.3,
		82.3,
		0
	],
	bloomington: [
		101.33,
		101.33,
		0
	],
	"boca-raton": [
		137.47,
		137.47,
		0
	],
	boise: [
		120.82,
		116.48,
		0
	],
	"bossier-city": [
		86.75,
		86.75,
		0
	],
	boston: [
		161.74,
		161.74,
		0
	],
	boulder: [
		142.95,
		142.95,
		0
	],
	bowie: [
		107.42,
		107.42,
		0
	],
	"bowling-green": [
		71.25,
		71.25,
		0
	],
	bozeman: [
		114.21,
		114.21,
		0
	],
	bradenton: [
		124.23,
		124.23,
		0
	],
	branson: [
		50.02,
		50.02,
		0
	],
	brentwood: [
		87.69,
		87.69,
		0
	],
	brookline: [
		256,
		256,
		0
	],
	brooklyn: [
		198.47,
		198.47,
		0
	],
	bryan: [
		85.84,
		85.84,
		0
	],
	"buena-park": [
		84.69,
		84.69,
		0
	],
	buffalo: [
		154.97,
		154.97,
		0
	],
	burbank: [
		139.91,
		139.91,
		0
	],
	burlington: [
		99.11,
		99.11,
		0
	],
	"cambridge-massachusetts": [
		222.71,
		222.71,
		0
	],
	camden: [
		178.88,
		178.88,
		0
	],
	"cape-coral": [
		103.11,
		103.11,
		0
	],
	carmel: [
		150.62,
		150.62,
		0
	],
	cary: [
		127.46,
		127.46,
		0
	],
	casper: [
		118.23,
		118.23,
		0
	],
	"cedar-rapids": [
		193.24,
		193.24,
		0
	],
	centennial: [
		82.89,
		82.89,
		0
	],
	chandler: [
		107.81,
		107.81,
		0
	],
	"chapel-hill": [
		108.92,
		108.92,
		0
	],
	charleston: [
		101.67,
		101.67,
		0
	],
	charlotte: [
		94.83,
		94.83,
		0
	],
	charlottesville: [
		89.58,
		89.58,
		0
	],
	chattanooga: [
		91.14,
		91.14,
		0
	],
	cheyenne: [
		67.42,
		67.42,
		0
	],
	chicago: [
		244.32,
		216.63,
		1
	],
	chico: [
		81.8,
		81.8,
		0
	],
	"chula-vista": [
		87.55,
		87.55,
		0
	],
	cincinnati: [
		73.72,
		73.72,
		0
	],
	cleveland: [
		205.03,
		205.03,
		0
	],
	"coeur-d-alene": [
		62.19,
		62.19,
		0
	],
	"colorado-springs": [
		80.91,
		80.91,
		0
	],
	columbia: [
		98.84,
		98.84,
		0
	],
	columbus: [
		107.06,
		107.06,
		0
	],
	"corpus-christi": [
		100.03,
		100.03,
		0
	],
	"costa-mesa": [
		103.64,
		103.64,
		0
	],
	cupertino: [
		293.47,
		272.08,
		0
	],
	dallas: [
		75.08,
		75.08,
		0
	],
	danville: [
		125.35,
		125.35,
		0
	],
	davenport: [
		112.25,
		112.25,
		0
	],
	davis: [
		87.5,
		87.5,
		0
	],
	dayton: [
		106.72,
		106.72,
		0
	],
	"daytona-beach": [
		90.44,
		90.44,
		0
	],
	deadwood: [
		58.89,
		58.89,
		0
	],
	"delray-beach": [
		142.62,
		142.62,
		0
	],
	denver: [
		99.06,
		99.06,
		0
	],
	"des-moines": [
		83.47,
		83.47,
		0
	],
	detroit: [
		145.38,
		145.38,
		0
	],
	"dublin-united-states": [
		117.36,
		117.36,
		0
	],
	"durham-united-states": [
		90.22,
		90.22,
		0
	],
	flagstaff: [
		53.65,
		53.65,
		0
	],
	"fort-lauderdale": [
		111.45,
		111.45,
		0
	],
	franklin: [
		88.05,
		88.05,
		0
	],
	honolulu: [
		129.77,
		129.77,
		0
	],
	houston: [
		73.31,
		73.31,
		0
	],
	huntsville: [
		81.2,
		81.2,
		0
	],
	indianapolis: [
		68.59,
		68.59,
		0
	],
	"jackson-wyoming": [
		147.04,
		147.04,
		0
	],
	"las-vegas": [
		76.97,
		76.97,
		1
	],
	livermore: [
		101.16,
		101.16,
		0
	],
	"los-angeles": [
		122.82,
		122.82,
		1
	],
	louisville: [
		72.68,
		72.68,
		0
	],
	lynchburg: [
		89.83,
		89.83,
		0
	],
	madison: [
		69.38,
		69.38,
		0
	],
	"melbourne-united-states": [
		69.77,
		69.77,
		0
	],
	memphis: [
		119.25,
		119.25,
		0
	],
	miami: [
		115.47,
		115.47,
		1
	],
	milwaukee: [
		80.28,
		80.28,
		0
	],
	minneapolis: [
		106.25,
		106.25,
		0
	],
	monterey: [
		128.76,
		128.76,
		0
	],
	"naples-florida": [
		71.18,
		71.18,
		0
	],
	nashville: [
		97.36,
		97.36,
		0
	],
	"new-orleans": [
		85.11,
		85.11,
		0
	],
	"new-york": [
		243.82,
		243.82,
		1
	],
	"newport-rhode-island": [
		129.86,
		129.86,
		0
	],
	oakland: [
		107.58,
		107.58,
		0
	],
	"oklahoma-city": [
		72.11,
		72.11,
		0
	],
	omaha: [
		92.92,
		92.92,
		0
	],
	orlando: [
		69.39,
		69.39,
		0
	],
	"palm-springs": [
		202.59,
		202.59,
		0
	],
	philadelphia: [
		130.66,
		130.66,
		0
	],
	phoenix: [
		87.8,
		87.8,
		0
	],
	pittsburgh: [
		84.54,
		84.54,
		0
	],
	pleasanton: [
		112.89,
		112.89,
		0
	],
	"plymouth-united-states": [
		94.64,
		94.64,
		0
	],
	portland: [
		83.42,
		83.42,
		0
	],
	"portsmouth-united-states": [
		108.86,
		108.86,
		0
	],
	raleigh: [
		104.14,
		104.14,
		0
	],
	reno: [
		94.45,
		94.45,
		0
	],
	richmond: [
		107.44,
		107.44,
		0
	],
	rochester: [
		123.55,
		123.55,
		0
	],
	"rock-hill": [
		81,
		81,
		0
	],
	sacramento: [
		101.22,
		101.22,
		0
	],
	"salt-lake-city": [
		81.64,
		81.64,
		0
	],
	"san-antonio": [
		64.94,
		64.94,
		0
	],
	"san-diego": [
		110.82,
		110.82,
		0
	],
	"san-francisco": [
		132.26,
		132.26,
		1
	],
	"san-jose-united-states": [
		158.41,
		158.41,
		0
	],
	sanford: [
		97.83,
		97.83,
		0
	],
	"santa-barbara": [
		118.77,
		118.77,
		0
	],
	"santa-fe-united-states": [
		111.89,
		111.89,
		0
	],
	savannah: [
		94.11,
		94.11,
		0
	],
	seattle: [
		106.03,
		106.03,
		0
	],
	"sierra-vista": [
		104.23,
		90.61,
		0
	],
	spokane: [
		101.19,
		101.19,
		0
	],
	"st-augustine": [
		99.81,
		99.81,
		0
	],
	stamford: [
		250.26,
		250.26,
		0
	],
	tampa: [
		100.16,
		100.16,
		0
	],
	taos: [
		113.79,
		113.79,
		0
	],
	"traverse-city": [
		76.7,
		76.7,
		0
	],
	tucson: [
		68.25,
		68.25,
		0
	],
	valdosta: [
		102.86,
		102.86,
		0
	],
	"valencia-united-states": [
		108.36,
		108.36,
		0
	],
	"vancouver-united-states": [
		92.14,
		92.14,
		0
	],
	ventura: [
		142.47,
		142.47,
		0
	],
	"washington-dc": [
		121.41,
		121.41,
		0
	],
	"wilmington-north-carolina": [
		82.96,
		82.96,
		0
	],
	"worcester-united-states": [
		172.09,
		172.09,
		0
	],
	montevideo: [
		45.37,
		45.37,
		0
	],
	"punta-del-este": [
		78.3,
		78.3,
		0
	],
	caracas: [
		37.13,
		37.13,
		0
	],
	"valencia-venezuela": [
		46.22,
		46.22,
		0
	],
	"can-tho": [
		21.8,
		21.8,
		0
	],
	"da-nang": [
		18.44,
		18.44,
		0
	],
	dalat: [
		13.74,
		13.74,
		0
	],
	"ha-long": [
		19.79,
		19.79,
		0
	],
	hanoi: [
		18.3,
		18.3,
		0
	],
	"ho-chi-minh-city": [
		24.8,
		24.8,
		0
	],
	"hoi-an": [
		21.59,
		21.59,
		0
	],
	hue: [
		13.74,
		13.74,
		0
	],
	"mui-ne": [
		44.65,
		44.65,
		0
	],
	"nha-trang": [
		17.95,
		17.95,
		0
	],
	"quy-nhon": [
		21.12,
		21.12,
		0
	],
	ronne: [
		111.26,
		111.26,
		0
	],
	chania: [
		60.5,
		60.5,
		0
	],
	corfu: [
		65,
		65,
		0
	],
	nuuk: [
		167.9,
		167.9,
		0
	],
	ioannina: [
		55.5,
		55.5,
		0
	],
	zakynthos: [
		58.4,
		58.4,
		0
	],
	billund: [
		140.47,
		140.47,
		1
	],
	torshavn: [
		96.33,
		96.33,
		0
	],
	iasi: [
		39.22,
		39.22,
		0
	],
	lefkada: [
		45.5,
		45.5,
		0
	],
	salen: [
		70.91,
		70.91,
		0
	],
	mytilene: [
		52,
		52,
		0
	]
};
var overrides_default = {
	"seville-spain": { "Best Value": {
		"id": 7967218,
		"name": "Casa Señorial del Siglo XVIII",
		"area": "Old town",
		"address": "Jesús del Gran Poder 55",
		"lat": 37.39735,
		"lng": -5.995251,
		"url": "https://www.booking.com/hotel/es/casa-senorial-del-siglo-xviii.html",
		"score": 9.2,
		"count": 871,
		"stars": 4,
		"total": 252,
		"reason": "An 18th-century manor house in the old town, rated 9.2 by guests, for well under the price of the luxury pick."
	} },
	"aalborg-denmark": { "Best Value": {
		"id": 12311213,
		"name": "B&B HOTEL Aalborg",
		"area": "City centre",
		"address": "Dag Hammarskjølds Gade 2A",
		"lat": 57.041708,
		"lng": 9.925685,
		"url": "https://www.booking.com/hotel/dk/b-amp-b-aalborg.html",
		"score": 8.3,
		"count": 2416,
		"stars": 3,
		"total": 236.31,
		"reason": "Central, rated 8.3 from more than 2,400 reviews, and priced between our budget and upscale picks."
	} },
	"lisbon-portugal": { "Budget": {
		"id": 633883,
		"name": "Dom João Glamour Hotel",
		"area": "Arroios",
		"address": "Rua José Estêvão 43",
		"lat": 38.728806,
		"lng": -9.137707,
		"url": "https://www.booking.com/hotel/pt/residencial-dom-joao.html",
		"score": 8,
		"count": 2828,
		"stars": 2,
		"total": 184.48,
		"reason": "The cheapest well-reviewed private room we found in central Lisbon: rated 8.0 from more than 2,800 reviews, a short metro ride from Baixa."
	} }
};
var blog_default = /*#__PURE__*/ JSON.parse("[{\"slug\":\"where-to-stay-in-odense\",\"city\":\"odense\",\"title\":\"Where to stay in Odense (2026): 3 hotels and the best area\",\"description\":\"Odense is small, so the hotel matters more than the neighbourhood. Our three picks for 2026 (budget, best value and upscale) with real prices, plus which part of town suits your trip.\",\"h1\":\"Where to stay in Odense\",\"dek\":\"Three hotels, one for each budget, and the only area questions that actually matter in a city you can cross on foot in twenty minutes.\",\"tags\":[\"Denmark\",\"City guide\"],\"body\":\"\\n<p>Odense is Denmark's third-largest city, but the centre is compact: from the station to H.C. Andersen's House is a ten-minute walk,\\nand the whole old town fits inside a loop you can do before lunch. That changes how you should choose a hotel. You don't need to\\nagonise over neighbourhoods the way you would in Copenhagen or Hamburg. The real questions are simpler:</p>\\n<ul>\\n<li><b>Are you arriving by car?</b> Then free parking is worth more than being two streets closer to the cathedral.</li>\\n<li><b>Are you here for H.C. Andersen and the old town?</b> Then stay within walking distance of the centre and leave the car at home.</li>\\n<li><b>Is it a concert, a conference or a match?</b> Then check where the event is first. Odense is easy to get around, but not at 11 pm in the rain.</li>\\n</ul>\\n<p>With that in mind, here are the three hotels we would book in Odense right now.</p>\\n<aside class=\\\"method\\\"><b>How we pick.</b> For every city we compare well-reviewed hotels on the same dates and keep three:\\nthe cheapest good private room (own bathroom, solid reviews, no dorms), the best reviews at a normal price, and the best-reviewed five-star\\n(or a four-star scoring 8.5+ when no five-star qualifies). Prices below were checked on Booking.com on 15 October 2026 for 10–12 November 2026 (Tuesday to Thursday), two adults, one room.\\nThey will be different for your dates. <a href=\\\"/how-we-choose\\\">Full method</a>.</aside>\\n<h2>The three hotels we'd book</h2>\\n<article class=\\\"pick pick-lux\\\">\\n<div class=\\\"pick-h\\\"><span class=\\\"chip\\\">♛ Luxury</span><h3>Hotel Odeon</h3></div>\\n<ul class=\\\"facts\\\"><li>4-star (no five-star hotel in Odense met our bar)</li><li>8.5/10 from 2,756 guest reviews</li><li>About 500 m from the town hall</li><li><b>€222</b> a night<small> · 10–12 November 2026</small></li></ul>\\n<p>Hotel Odeon sits right next to ODEON, the city's concert and conference house, between the railway station and H.C. Andersen's House. If you are coming for a show, a congress or simply want to walk everywhere, it's hard to beat the location.</p><p>Odense has no five-star hotel that passes our review threshold, so our 'luxury' pick here is the best-reviewed upscale four-star. Nearly 2,800 reviews averaging 8.5 is a strong, stable signal: you know what you are getting.</p>\\n<p class=\\\"catch\\\"><b>The catch:</b> it's a big, modern city hotel rather than a characterful boutique. If you want small and personal, look at our Best Value pick.</p>\\n<p class=\\\"ctas\\\"><a class=\\\"btn\\\" rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/dk/odeon.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"lux\\\">See prices on Booking.com</a> <a class=\\\"btn ghost\\\" href=\\\"/odense\\\">All three picks in one page →</a></p>\\n</article>\\n<article class=\\\"pick pick-value\\\">\\n<div class=\\\"pick-h\\\"><span class=\\\"chip\\\">★ Best Value</span><h3>Villa A Hotel</h3></div>\\n<ul class=\\\"facts\\\"><li>3-star</li><li>8.6/10 from 668 guest reviews</li><li>About 800 m south-west of the town hall</li><li>Free parking</li><li><b>€137</b> a night<small> · 10–12 November 2026</small></li></ul>\\n<p>Villa A is a small hotel on a quiet residential street, around a ten-to-fifteen-minute walk from the centre. It has the best guest score of every hotel we compared in Odense, at a price close to the city average.</p><p>That combination (top reviews, normal price, free parking, walkable) is exactly what 'best value' means to us. It works for couples, for a weekend without the car, and for business trips where you don't need a conference floor.</p>\\n<p class=\\\"catch\\\"><b>The catch:</b> it's small and simple: no restaurant, no spa. Book early for weekends.</p>\\n<p class=\\\"ctas\\\"><a class=\\\"btn\\\" rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/dk/ansgarhus-motel.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"value\\\">See prices on Booking.com</a> <a class=\\\"btn ghost\\\" href=\\\"/odense\\\">All three picks in one page →</a></p>\\n</article>\\n<article class=\\\"pick pick-budget\\\">\\n<div class=\\\"pick-h\\\"><span class=\\\"chip\\\">€ Budget</span><h3>Nice Nest Boutique Hotel</h3></div>\\n<ul class=\\\"facts\\\"><li>8.4/10 from 109 guest reviews</li><li>About 1.6 km east of the town hall</li><li>Free parking, hot tub, garden</li><li><b>€98</b> a night<small> · 10–12 November 2026</small></li></ul>\\n<p>Nice Nest is the cheapest well-reviewed private room we found in Odense: every room has its own bathroom, and there's free parking on site. It's about twenty minutes on foot from the centre, or a few minutes by car or bus.</p><p>If you are driving in from Jutland or Zealand and want a clean, calm base without paying city-centre prices, this is the one.</p>\\n<p class=\\\"catch\\\"><b>The catch:</b> it has far fewer reviews than the other two, so there's less certainty, and it isn't in the old town. Fine with a car, less ideal without one.</p>\\n<p class=\\\"ctas\\\"><a class=\\\"btn\\\" rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/dk/nice-nest.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"budget\\\">See prices on Booking.com</a> <a class=\\\"btn ghost\\\" href=\\\"/odense\\\">All three picks in one page →</a></p>\\n</article>\\n<h2>Which part of Odense should you stay in?</h2>\\n<h3>The old town and the H.C. Andersen Quarter</h3>\\n<p>Cobbled lanes, half-timbered houses, the cathedral of St Canute and the new H.C. Andersen's House museum. This is where most visitors spend their time,\\nand the best area for a first trip without a car. Hotels here are few and fill up fast on summer weekends and during the Christmas market season.</p>\\n<h3>Around the station and Kongens Have</h3>\\n<p>The most practical area if you arrive by train: Odense sits on the main line between Copenhagen and Jutland, and the station is a short walk from\\nthe centre. Hotel Odeon and several chain hotels are here. The King's Garden park is right in front of the station.</p>\\n<h3>Outside the centre, with parking</h3>\\n<p>Along the ring roads and towards the motorway you'll find hotels with free parking and lower prices, including our budget pick.\\nGood for drivers, families and anyone combining Odense with Egeskov Castle or a drive around Funen.</p>\\n<h2>Getting there</h2>\\n<ul>\\n<li><b>By train:</b> direct trains from Copenhagen Central take a little over an hour and a quarter; there are also direct trains from Copenhagen Airport.</li>\\n<li><b>By plane:</b> Billund Airport is about an hour away by car. Copenhagen Airport is the bigger hub, with a direct train.</li>\\n<li><b>In town:</b> walk. For longer hops, the Odense light rail runs north–south through the city.</li>\\n</ul>\\n<h2>When prices go up</h2>\\n<p>Odense is mostly a business and short-break city, so prices move with events: big conferences, concerts, the summer holidays and December,\\nwhen the Christmas markets bring a lot of weekend visitors. A mid-week stay in November is about as cheap as Odense gets.\\nOur prices above are from exactly that kind of week, so expect more on a summer Saturday.</p>\\n<h2>Coming soon: the film</h2>\\n<p>We're planning to film our Odense picks this autumn. When the video is ready, it will be on this page and on the <a href=\\\"/odense\\\">Odense hotels page</a>.</p>\\n\",\"date\":\"2026-10-15\",\"updated\":\"2026-10-15\",\"author\":\"Carlos de Ory\",\"words\":970,\"mins\":4},{\"slug\":\"where-to-stay-in-hamburg\",\"city\":\"hamburg\",\"title\":\"Where to stay in Hamburg (2026): 3 hotels and the right area for you\",\"description\":\"Hamburg is big and every area feels different. Our three hotel picks for 2026 (budget, best value and luxury) with real prices, and a no-nonsense guide to St. Pauli, St. Georg, HafenCity and the Alster.\",\"h1\":\"Where to stay in Hamburg\",\"dek\":\"A €60 room by the station, a €130 room in the Schanze and a €600 grand hotel on the Alster. Here's who each one is for, and which area fits your trip.\",\"tags\":[\"Germany\",\"City guide\"],\"body\":\"\\n<p>Hamburg is not a city you see in one walk. The old merchant centre around the Rathaus, the port and the Elbphilharmonie, the Reeperbahn,\\nthe cafés of the Schanze and the lakes of the Alster are all different places, and where you sleep decides what your evenings feel like.\\nSo in Hamburg we'd pick the area first and the hotel second. The good news: the S-Bahn and U-Bahn are fast, and almost everything below is\\nwithin 20 minutes of everything else.</p>\\n<aside class=\\\"method\\\"><b>How we pick.</b> For every city we compare well-reviewed hotels on the same dates and keep three:\\nthe cheapest good private room (own bathroom, solid reviews, no dorms), the best reviews at a normal price, and the best-reviewed five-star\\n(or a four-star scoring 8.5+ when no five-star qualifies). Prices below were checked on Booking.com on 15 October 2026 for 10–12 November 2026 (Tuesday to Thursday), two adults, one room.\\nThey will be different for your dates. <a href=\\\"/how-we-choose\\\">Full method</a>.</aside>\\n<h2>The three hotels we'd book</h2>\\n<article class=\\\"pick pick-lux\\\">\\n<div class=\\\"pick-h\\\"><span class=\\\"chip\\\">♛ Luxury</span><h3>Fairmont Hotel Vier Jahreszeiten</h3></div>\\n<ul class=\\\"facts\\\"><li>5-star</li><li>9.5/10 from 1,299 guest reviews</li><li>On the Binnenalster, about 600 m from the Rathaus</li><li><b>€608</b> a night<small> · 10–12 November 2026</small></li></ul>\\n<p>The Vier Jahreszeiten has been Hamburg's grand hotel for more than a century, and it sits on the best address in town: the Neuer Jungfernstieg, looking straight over the Binnenalster. Shopping streets on one side, the lake on the other, the Rathaus five minutes away.</p><p>A 9.5 average across almost 1,300 reviews is remarkable for a hotel this size. This is the one for an anniversary, a proposal or a 'once a year' trip.</p>\\n<p class=\\\"catch\\\"><b>The catch:</b> the price. Mid-week in November it was around €600 a night; weekends and December cost more.</p>\\n<p class=\\\"ctas\\\"><a class=\\\"btn\\\" rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/de/raffleshotelvierjahreszeiten.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"lux\\\">See prices on Booking.com</a> <a class=\\\"btn ghost\\\" href=\\\"/hamburg\\\">All three picks in one page →</a></p>\\n</article>\\n<article class=\\\"pick pick-value\\\">\\n<div class=\\\"pick-h\\\"><span class=\\\"chip\\\">★ Best Value</span><h3>Superbude Hamburg St. Pauli</h3></div>\\n<ul class=\\\"facts\\\"><li>8.9/10 from 1,523 guest reviews</li><li>Edge of the Schanzenviertel, about 2.5 km from the Rathaus</li><li>Pets allowed</li><li><b>€132</b> a night<small> · 10–12 November 2026</small></li></ul>\\n<p>Superbude is playful, design-led and very Hamburg: recycled furniture, a busy lobby bar, and rooms that are small but clever. It sits on the edge of the Schanze, so you have the city's best cafés and bars on your doorstep and St. Pauli a short walk away.</p><p>Guests rate it higher than most hotels that cost twice as much. That's why it is our best value pick.</p>\\n<p class=\\\"catch\\\"><b>The catch:</b> it's a hotel-hostel hybrid with a young, social crowd. Make sure you book a private room with its own bathroom, and don't expect silence on a Saturday.</p>\\n<p class=\\\"ctas\\\"><a class=\\\"btn\\\" rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/de/superbude-hostel-st-pauli.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"value\\\">See prices on Booking.com</a> <a class=\\\"btn ghost\\\" href=\\\"/hamburg\\\">All three picks in one page →</a></p>\\n</article>\\n<article class=\\\"pick pick-budget\\\">\\n<div class=\\\"pick-h\\\"><span class=\\\"chip\\\">€ Budget</span><h3>CAB20</h3></div>\\n<ul class=\\\"facts\\\"><li>8.5/10 from 12,776 guest reviews</li><li>St. Georg, about an 8-minute walk from the Hauptbahnhof</li><li>Bar, terrace, 24-hour reception</li><li><b>€60</b> a night<small> · 10–12 November 2026</small></li></ul>\\n<p>CAB20 is about as cheap as a good private room gets in Hamburg. More than 12,000 reviews averaging 8.5 means this isn't luck: rooms are compact but clean, the location by the main station is perfect if you arrive by train, and the Alster is a ten-minute walk away.</p><p>If you'll only sleep in the room and spend the day out, this is the smart choice.</p>\\n<p class=\\\"catch\\\"><b>The catch:</b> rooms are small (the name is a hint), and the streets right behind the station are lively and a bit scruffy late at night.</p>\\n<p class=\\\"ctas\\\"><a class=\\\"btn\\\" rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/de/cab20.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"budget\\\">See prices on Booking.com</a> <a class=\\\"btn ghost\\\" href=\\\"/hamburg\\\">All three picks in one page →</a></p>\\n</article>\\n<h2>Which area of Hamburg is right for you?</h2>\\n<h3>Altstadt, Neustadt and the Binnenalster: first visit, shopping</h3>\\n<p>The Rathaus, the Jungfernstieg, the shopping streets and the lake. Central, elegant and easy, and quiet at night. Our luxury pick is here.</p>\\n<h3>HafenCity and the Speicherstadt: architecture and the Elbphilharmonie</h3>\\n<p>Red-brick warehouses on the canals (a UNESCO World Heritage site), Miniatur Wunderland and the Elbphilharmonie. Modern hotels, great for a concert trip; a bit empty after dark outside the main squares.</p>\\n<h3>St. Pauli and the Reeperbahn: nightlife</h3>\\n<p>Bars, clubs, music venues and the harbour at Landungsbrücken. Go early on a Sunday for the Fischmarkt. Brilliant if you want to go out, loud if you want to sleep.</p>\\n<h3>Sternschanze: cafés, food and a local feel</h3>\\n<p>Independent shops, brunch spots and bars that are busy every night. A good compromise: lively, but more 'neighbourhood' than the Reeperbahn. Our best value pick is on its edge.</p>\\n<h3>St. Georg: by the station and the Außenalster</h3>\\n<p>The most practical base if you come by train. Lange Reihe is one of the city's nicest streets for dinner, and the big lake is minutes away. The streets right next to the station are rougher; a few blocks makes a big difference.</p>\\n<h3>Altona and Ottensen: calmer and local</h3>\\n<p>Further west, with its own station, the Elbe beaches nearby and lots of restaurants. Good for longer stays and repeat visitors.</p>\\n<h2>Getting there and around</h2>\\n<ul>\\n<li><b>From the airport:</b> the S-Bahn runs from the terminals to the Hauptbahnhof in about 25 minutes.</li>\\n<li><b>By train:</b> the Hauptbahnhof is one of Germany's busiest stations, with direct trains from Berlin, Copenhagen, Amsterdam and most big German cities.</li>\\n<li><b>Around town:</b> S-Bahn, U-Bahn and the harbour ferries, which are part of the normal public-transport network. The ferry from Landungsbrücken is one of the cheapest harbour tours anywhere.</li>\\n</ul>\\n<h2>When prices go up</h2>\\n<p>Hamburg hotel prices jump during big trade fairs, the Harbour Birthday in May, major concerts and the Christmas markets from late November.\\nA quiet mid-week in November or January is when even the grand hotels come down. If your dates are flexible, move them by a few days and compare.</p>\\n<p>We're planning to film our Hamburg picks this autumn. The video will go on this page and on the <a href=\\\"/hamburg\\\">Hamburg hotels page</a>.</p>\\n\",\"date\":\"2026-10-15\",\"updated\":\"2026-10-15\",\"author\":\"Carlos de Ory\",\"words\":940,\"mins\":4},{\"slug\":\"where-to-stay-in-copenhagen\",\"city\":\"copenhagen\",\"title\":\"Where to stay in Copenhagen (2026): 3 hotels and the best neighbourhoods\",\"description\":\"Copenhagen is expensive, so the right hotel saves real money. Our three picks for 2026 (budget, best value and luxury) with real prices, and which neighbourhood suits you: Indre By, Christianshavn, Vesterbro or Nørrebro.\",\"h1\":\"Where to stay in Copenhagen\",\"dek\":\"One of Europe's most expensive hotel cities. Here's where €100, €200 and €300 a night get you the most.\",\"tags\":[\"Denmark\",\"City guide\"],\"body\":\"\\n<p>Copenhagen is small, flat and made for walking and cycling, but it is not cheap: a perfectly normal hotel can easily cost €200 a night.\\nThat's why picking well matters more here than almost anywhere else in Europe. Get it right and you can be ten minutes from Nyhavn for\\naround €100. Get it wrong and you pay luxury prices for a small room by a ring road.</p>\\n<aside class=\\\"method\\\"><b>How we pick.</b> For every city we compare well-reviewed hotels on the same dates and keep three:\\nthe cheapest good private room (own bathroom, solid reviews, no dorms), the best reviews at a normal price, and the best-reviewed five-star\\n(or a four-star scoring 8.5+ when no five-star qualifies). Prices below were checked on Booking.com on 15 October 2026 for 10–12 November 2026 (Tuesday to Thursday), two adults, one room.\\nThey will be different for your dates. <a href=\\\"/how-we-choose\\\">Full method</a>.</aside>\\n<h2>The three hotels we'd book</h2>\\n<article class=\\\"pick pick-lux\\\">\\n<div class=\\\"pick-h\\\"><span class=\\\"chip\\\">♛ Luxury</span><h3>1 Hotel Copenhagen</h3></div>\\n<ul class=\\\"facts\\\"><li>5-star</li><li>9.1/10 from 702 guest reviews</li><li>Latin Quarter, about 550 m from the City Hall Square</li><li><b>€301</b> a night<small> · 10–12 November 2026</small></li></ul>\\n<p>1 Hotel Copenhagen is in the old Latin Quarter, a few steps from the Round Tower and the main pedestrian street. The brand is built around nature and sustainability: lots of wood and plants, and a calm, Scandinavian feel rather than gold and marble.</p><p>It has the best review score among the five-star hotels we compared, in the most walkable spot in the city.</p>\\n<p class=\\\"catch\\\"><b>The catch:</b> around €300 a night mid-week in November, and more in summer. Copenhagen luxury is never cheap.</p>\\n<p class=\\\"ctas\\\"><a class=\\\"btn\\\" rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/dk/1-hotel-copenhagen.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"lux\\\">See prices on Booking.com</a> <a class=\\\"btn ghost\\\" href=\\\"/copenhagen\\\">All three picks in one page →</a></p>\\n</article>\\n<article class=\\\"pick pick-value\\\">\\n<div class=\\\"pick-h\\\"><span class=\\\"chip\\\">★ Best Value</span><h3>Kanalhuset</h3></div>\\n<ul class=\\\"facts\\\"><li>9.4/10 from 869 guest reviews</li><li>On the canal in Christianshavn</li><li>Restaurant on site</li><li><b>€207</b> a night<small> · 10–12 November 2026</small></li></ul>\\n<p>Kanalhuset is a small hotel right on one of Christianshavn's canals: houseboats outside the window, cobbles and cafés all around, and the metro station a short walk away (it runs straight to the airport).</p><p>It has the highest guest score of the 40 Copenhagen hotels we compared, at a price only a little above the city's middle. For a couple's weekend, it's the one we'd book.</p>\\n<p class=\\\"catch\\\"><b>The catch:</b> it's small, so it sells out early, and the rooms vary. Read the room descriptions before you book.</p>\\n<p class=\\\"ctas\\\"><a class=\\\"btn\\\" rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/dk/kanalhuset.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"value\\\">See prices on Booking.com</a> <a class=\\\"btn ghost\\\" href=\\\"/copenhagen\\\">All three picks in one page →</a></p>\\n</article>\\n<article class=\\\"pick pick-budget\\\">\\n<div class=\\\"pick-h\\\"><span class=\\\"chip\\\">€ Budget</span><h3>Wakeup Copenhagen Borgergade</h3></div>\\n<ul class=\\\"facts\\\"><li>8.0/10 from 16,572 guest reviews</li><li>Between Kongens Have and Nyhavn</li><li>24-hour reception, bar</li><li><b>€101</b> a night<small> · 10–12 November 2026</small></li></ul>\\n<p>Wakeup Borgergade is the cheapest good private room in central Copenhagen. Rooms are compact and simple, but with over 16,000 reviews you know exactly what you're getting, and the location is excellent: Nyhavn, Rosenborg Castle and Kongens Nytorv are all on foot.</p><p>If you plan to spend your money on food, Tivoli or a canal tour rather than on the room, start here.</p>\\n<p class=\\\"catch\\\"><b>The catch:</b> small rooms and no frills. An 8.0 average is 'very good', not 'wow'. That's the trade-off for this price in this city.</p>\\n<p class=\\\"ctas\\\"><a class=\\\"btn\\\" rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/dk/wakeup-copenhagen-borgergade.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"budget\\\">See prices on Booking.com</a> <a class=\\\"btn ghost\\\" href=\\\"/copenhagen\\\">All three picks in one page →</a></p>\\n</article>\\n<h2>Which neighbourhood?</h2>\\n<h3>Indre By (the old centre): first visit</h3>\\n<p>Strøget, the Latin Quarter, Nyhavn, the palaces and the main sights. Everything is walkable. Expensive, busy in summer, and the best choice for a short first trip.</p>\\n<h3>Christianshavn: canals and character</h3>\\n<p>Canals, houseboats, the Church of Our Saviour and Christiania. Calm, beautiful and one metro stop from the centre. Our best value pick is here.</p>\\n<h3>Vesterbro: by Central Station, food and bars</h3>\\n<p>The Meatpacking District (Kødbyen), Istedgade and lots of good, younger restaurants. Practical if you arrive by train. Prices tend to be a little lower than in the old centre.</p>\\n<h3>Nørrebro and Østerbro: local life</h3>\\n<p>Nørrebro is diverse, lively and full of small places to eat; Østerbro is green, residential and family-friendly. Both are a short bike ride from the centre.</p>\\n<h3>Ørestad and near the airport: cheaper beds</h3>\\n<p>Modern hotels by the metro line, often much cheaper. Fine for a short stopover or a conference at Bella Center, less charming for a city break.</p>\\n<h2>Getting there and around</h2>\\n<ul>\\n<li><b>From the airport:</b> the metro runs to Kongens Nytorv and Christianshavn in roughly 15 minutes; trains run to Central Station in about the same.</li>\\n<li><b>Around town:</b> walk, or rent a bike. Copenhagen is one of the easiest cities in the world to cycle in.</li>\\n</ul>\\n<h2>Saving money in Copenhagen</h2>\\n<ul>\\n<li>Check whether breakfast is included. In Denmark it often isn't, and it can add a lot per person.</li>\\n<li>Sunday to Thursday is usually cheaper than Friday and Saturday, except during big conferences.</li>\\n<li>Summer and the weeks before Christmas (Tivoli's Christmas season) are the most expensive times. November and January–March are the cheapest.</li>\\n</ul>\\n\",\"date\":\"2026-10-15\",\"updated\":\"2026-10-15\",\"author\":\"Carlos de Ory\",\"words\":785,\"mins\":4},{\"slug\":\"cheapest-5-star-hotels-in-europe\",\"city\":null,\"title\":\"The 20 cheapest 5-star hotels in Europe (prices checked October 2026)\",\"description\":\"Real five-star hotels rated 8.5+ by guests, from about €92 a night. Every price checked on Booking.com for the same mid-week dates. Prague, the Algarve, Poland and more.\",\"h1\":\"The 20 cheapest five-star hotels in Europe\",\"dek\":\"Officially five stars, rated 8.5+ by guests, from about €92 a night. Every price checked for the same dates.\",\"tags\":[\"Europe\",\"Data\"],\"body\":\"\\n<p>In Paris or London, the five-star hotels we recommend cost well over €700 a night. In the places below, a real five-star hotel,\\nofficially rated and loved by guests, costs less than a standard room in central Copenhagen.</p>\\n<p>We took every European five-star hotel in our database, kept only those with an <b>official five-star rating</b> and a <b>guest score of 8.5 or higher</b>,\\nand checked the price for the same dates on Booking.com: 10–12 November 2026 (Tuesday to Thursday), two adults, one room, checked on 15 October 2026. Then we sorted by price.</p>\\n<aside class=\\\"method\\\"><b>Read this first.</b> Hotel prices change every day. These are real prices for one specific week in low season, not a promise.\\nUse the list to find places where luxury is cheap, then check your own dates. Prices are per night (the two-night total divided by two) as shown on Booking.com, and may exclude local tourist taxes.</aside>\\n<h2>The list</h2>\\n<div class=\\\"tablewrap\\\"><table><thead><tr><th>#</th><th>Hotel</th><th>Where</th><th>Guests</th><th>Per night</th></tr></thead><tbody><tr><td>1</td><td><a rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/pt/hotelsrealsantaeulalia.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"lux\\\">Grande Real Santa Eulália Resort &amp; Hotel Spa</a></td><td><a href=\\\"/albufeira\\\">Albufeira</a>, Portugal</td><td>8.5/10 <small>(4,041)</small></td><td><b>€92</b></td></tr><tr><td>2</td><td><a rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/bg/promenade.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"lux\\\">Hotel Residence Promenade</a></td><td><a href=\\\"/burgas\\\">Burgas</a>, Bulgaria</td><td>9.5/10 <small>(1,005)</small></td><td><b>€99</b></td></tr><tr><td>3</td><td><a rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/es/nhgranhotelcasinodeextremadura.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"lux\\\">NH Gran Hotel Casino de Extremadura</a></td><td><a href=\\\"/badajoz\\\">Badajoz</a>, Spain</td><td>9.2/10 <small>(2,451)</small></td><td><b>€104</b></td></tr><tr><td>4</td><td><a rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/cz/old-royal-post-apartments.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"lux\\\">Old Royal Post Boutique Hotel</a></td><td><a href=\\\"/prague\\\">Prague</a>, Czechia</td><td>9.6/10 <small>(2,457)</small></td><td><b>€104</b></td></tr><tr><td>5</td><td><a rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/pl/the-bridge-wroclaw-mgallery-by-sofitel.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"lux\\\">The Bridge Wrocław – MGallery</a></td><td><a href=\\\"/wroclaw\\\">Wrocław</a>, Poland</td><td>9.4/10 <small>(2,927)</small></td><td><b>€107</b></td></tr><tr><td>6</td><td><a rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/pl/radisson-blu-residence-zakopane.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"lux\\\">Radisson Blu Hotel &amp; Residences</a></td><td><a href=\\\"/zakopane\\\">Zakopane</a>, Poland</td><td>8.8/10 <small>(6,434)</small></td><td><b>€110</b></td></tr><tr><td>7</td><td><a rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/pl/gdansk_podewils.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"lux\\\">Podewils Old Town</a></td><td><a href=\\\"/gdansk\\\">Gdańsk</a>, Poland</td><td>9.2/10 <small>(552)</small></td><td><b>€116</b></td></tr><tr><td>8</td><td><a rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/lv/promenade.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"lux\\\">Promenade Hotel Liepāja</a></td><td><a href=\\\"/liepaja\\\">Liepāja</a>, Latvia</td><td>9.2/10 <small>(2,167)</small></td><td><b>€117</b></td></tr><tr><td>9</td><td><a rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/pt/real-marina-spa.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"lux\\\">Real Marina Hotel &amp; Spa</a></td><td><a href=\\\"/olhao\\\">Olhão</a>, Portugal</td><td>8.7/10 <small>(2,713)</small></td><td><b>€119</b></td></tr><tr><td>10</td><td><a rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/pt/montebelo-e-spa.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"lux\\\">Montebelo Viseu Congress Hotel &amp; Spa</a></td><td><a href=\\\"/viseu\\\">Viseu</a>, Portugal</td><td>9.1/10 <small>(973)</small></td><td><b>€121</b></td></tr><tr><td>11</td><td><a rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/ba/mepas-mostar.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"lux\\\">Hotel Mepas</a></td><td><a href=\\\"/mostar\\\">Mostar</a>, Bosnia and Herzegovina</td><td>9.2/10 <small>(2,115)</small></td><td><b>€122</b></td></tr><tr><td>12</td><td><a rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/pt/acores-atlantico.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"lux\\\">Grand Hotel Açores Atlântico</a></td><td><a href=\\\"/ponta-delgada\\\">Ponta Delgada</a>, Portugal</td><td>9.2/10 <small>(865)</small></td><td><b>€123</b></td></tr><tr><td>13</td><td><a rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/rs/prezident.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"lux\\\">Prezident Luxury Hotel</a></td><td><a href=\\\"/novi-sad\\\">Novi Sad</a>, Serbia</td><td>9.3/10 <small>(869)</small></td><td><b>€126</b></td></tr><tr><td>14</td><td><a rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/gr/10gr.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"lux\\\">10GR Boutique Hotel &amp; Wine Bar</a></td><td><a href=\\\"/rhodes\\\">Rhodes</a>, Greece</td><td>9.5/10 <small>(706)</small></td><td><b>€134</b></td></tr><tr><td>15</td><td><a rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/es/palacio-de-aviles-by-melia.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"lux\\\">Palacio de Avilés</a></td><td><a href=\\\"/aviles\\\">Avilés</a>, Spain</td><td>9.2/10 <small>(1,515)</small></td><td><b>€135</b></td></tr><tr><td>16</td><td><a rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/es/aureaconventocapuchinosbyeurostarshotelcompany.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"lux\\\">Áurea Convento Capuchinos</a></td><td><a href=\\\"/segovia\\\">Segovia</a>, Spain</td><td>9.1/10 <small>(2,532)</small></td><td><b>€144</b></td></tr><tr><td>17</td><td><a rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/ee/radisson-sas-tallinn.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"lux\\\">Radisson Collection Hotel</a></td><td><a href=\\\"/tallinn\\\">Tallinn</a>, Estonia</td><td>9.4/10 <small>(6,055)</small></td><td><b>€146</b></td></tr><tr><td>18</td><td><a rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/pl/intercontinentalwarsaw.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"lux\\\">InterContinental Warszawa</a></td><td><a href=\\\"/warsaw\\\">Warsaw</a>, Poland</td><td>9.1/10 <small>(10,072)</small></td><td><b>€147</b></td></tr><tr><td>19</td><td><a rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/es/eurostars-hotel-de-la-reconquista.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"lux\\\">Eurostars Hotel de la Reconquista</a></td><td><a href=\\\"/oviedo\\\">Oviedo</a>, Spain</td><td>9.1/10 <small>(1,547)</small></td><td><b>€150</b></td></tr><tr><td>20</td><td><a rel=\\\"sponsored nofollow\\\" target=\\\"_blank\\\" href=\\\"{{bk:https://www.booking.com/hotel/es/meliameridaboutiquehotel.html}}\\\" data-t=\\\"guide_booking\\\" data-cat=\\\"lux\\\">Hotel Ilunion Mérida Palace</a></td><td><a href=\\\"/merida-spain\\\">Mérida</a>, Spain</td><td>9.0/10 <small>(6,151)</small></td><td><b>€153</b></td></tr></tbody></table></div>\\n<h2>What makes each one worth it</h2>\\n<ol class=\\\"notes\\\"><li><b>Grande Real Santa Eulália Resort &amp; Hotel Spa, Albufeira (€92).</b> A beachfront resort on the Algarve with indoor and outdoor pools and a spa. November is low season, which is exactly why it's this cheap.</li><li><b>Hotel Residence Promenade, Burgas (€99).</b> On the Black Sea seafront in central Burgas, with one of the highest scores on this list.</li><li><b>NH Gran Hotel Casino de Extremadura, Badajoz (€104).</b> A five-star with its own casino, close to the Portuguese border. A great stop on a road trip between Madrid and Lisbon.</li><li><b>Old Royal Post Boutique Hotel, Prague (€104).</b> In the Lesser Quarter (Malá Strana), below the castle and a few minutes from the Charles Bridge. The best location on this list.</li><li><b>The Bridge Wrocław – MGallery, Wrocław (€107).</b> On Cathedral Island, the oldest part of Wrocław, with a spa and sauna. Five-star polish at a three-star price.</li><li><b>Radisson Blu Hotel &amp; Residences, Zakopane (€110).</b> A mountain resort in the Tatras with an indoor pool and spa. Over 6,000 reviews, and very family-friendly.</li><li><b>Podewils Old Town, Gdańsk (€116).</b> A small, classic hotel on the river, facing Gdańsk's old town. Fewer reviews than most here, but consistently excellent.</li><li><b>Promenade Hotel Liepāja, Liepāja (€117).</b> On the harbour canal in Latvia's coastal music city. Free parking and a spa.</li><li><b>Real Marina Hotel &amp; Spa, Olhão (€119).</b> On the Ria Formosa lagoon in the eastern Algarve, with indoor and outdoor pools. A quieter, more local alternative to Albufeira.</li><li><b>Montebelo Viseu Congress Hotel &amp; Spa, Viseu (€121).</b> A spa hotel with pools in the heart of the Dão wine region. Pair it with a few wineries.</li><li><b>Hotel Mepas, Mostar (€122).</b> A modern five-star with an indoor pool and spa, a short drive from the famous Old Bridge.</li><li><b>Grand Hotel Açores Atlântico, Ponta Delgada (€123).</b> On the seafront avenue of São Miguel's main town, with an indoor pool. The base for crater lakes and hot springs.</li><li><b>Prezident Luxury Hotel, Novi Sad (€126).</b> A spa hotel with indoor and outdoor pools in Serbia's second city.</li><li><b>10GR Boutique Hotel &amp; Wine Bar, Rhodes (€134).</b> An adults-only boutique hotel inside the medieval Old Town of Rhodes, with its own wine bar.</li><li><b>Palacio de Avilés, Avilés (€135).</b> A historic palace on the main square of Avilés, on Spain's green north coast.</li><li><b>Áurea Convento Capuchinos, Segovia (€144).</b> A converted convent with a spa, walking distance from the Roman aqueduct. Easy day trip from Madrid.</li><li><b>Radisson Collection Hotel, Tallinn (€146).</b> A tower hotel with views over the old town, a pool and a spa. Over 6,000 reviews averaging 9.4.</li><li><b>InterContinental Warszawa, Warsaw (€147).</b> A big-city five-star with a high-floor pool and more than 10,000 reviews. The cheapest capital-city luxury on this list.</li><li><b>Eurostars Hotel de la Reconquista, Oviedo (€150).</b> Oviedo's landmark hotel in a historic building in the centre.</li><li><b>Hotel Ilunion Mérida Palace, Mérida (€153).</b> On Mérida's Plaza de España, with a rooftop pool, a short walk from the Roman theatre.</li></ol>\\n<h2>The pattern: where luxury is cheap in Europe</h2>\\n<ul>\\n<li><b>Second cities, not capitals.</b> Wrocław, Gdańsk, Oviedo, Mérida, Viseu, Novi Sad: excellent hotels built for business and weddings, with far less tourist demand than the big names.</li>\\n<li><b>Beach resorts out of season.</b> The Algarve, the Black Sea and Rhodes in November cost a fraction of their August prices, and the weather is often still good for walking.</li>\\n<li><b>Poland, Portugal and inland Spain.</b> Three countries make up more than half of this list.</li>\\n<li><b>The two great exceptions: Prague and Warsaw.</b> Capital-city five-stars, in great locations, for under €150.</li>\\n</ul>\\n<h2>How to find cheap luxury yourself</h2>\\n<ol>\\n<li><b>Stay mid-week.</b> Business hotels drop on weekends; leisure hotels drop Sunday to Thursday. Check both.</li>\\n<li><b>Look one city over.</b> Segovia instead of Madrid, Olhão instead of Faro, Wrocław instead of Kraków.</li>\\n<li><b>Ignore the star rating on its own.</b> Plenty of 'five-star' hotels score 7.5. Our rule: official five stars <i>and</i> 8.5+ from guests.</li>\\n<li><b>Count the extras.</b> Breakfast, parking and city tax can add €30–€60 a night. Compare the total, not the headline.</li>\\n</ol>\\n<p>Every city on this list has its own page with our three picks (budget, best value and luxury), so you can compare the five-star\\nwith cheaper options before you book. Start with <a href=\\\"/prague\\\">Prague</a>, <a href=\\\"/wroclaw\\\">Wrocław</a> or <a href=\\\"/albufeira\\\">Albufeira</a>.</p>\\n\",\"date\":\"2026-10-15\",\"updated\":\"2026-10-15\",\"author\":\"Carlos de Ory\",\"words\":1088,\"mins\":5},{\"slug\":\"how-to-choose-a-hotel\",\"city\":null,\"title\":\"How to choose a hotel in 5 minutes (without reading 500 listings)\",\"description\":\"A simple, repeatable way to pick a hotel fast: decide your budget level, pick the area, read reviews the right way and compare the real total price. The same method we use for every city on Top3Hotels.\",\"h1\":\"How to choose a hotel in five minutes\",\"dek\":\"The booking sites show you 500 options. You need one. Here's the method we use for every city.\",\"tags\":[\"Tips\",\"Method\"],\"body\":\"\\n<p>Most people spend more time choosing a hotel than choosing the city. You open a booking site, see hundreds of options, sort by price, then by\\nrating, open twenty tabs, and an hour later you book the one you saw first. The problem isn't a lack of choice. It's too much of it.</p>\\n<p>This is the five-minute method we use to pick three hotels in every city on Top3Hotels. It works just as well for your own trips.</p>\\n<h2>1. Decide your level before you look</h2>\\n<p>Before you see a single photo, decide which of three trips this is:</p>\\n<ul>\\n<li><b>Budget:</b> you just need a clean private room with its own bathroom in a safe, practical spot. You'll be out all day.</li>\\n<li><b>Best value:</b> you want a place you'll actually enjoy, with great reviews, at a normal price for the city.</li>\\n<li><b>Luxury:</b> the hotel is part of the trip. An anniversary, a treat, a 'once a year'.</li>\\n</ul>\\n<p>This one decision removes about 80% of the listings. It's also why we show exactly one hotel at each level, not a long list.</p>\\n<h2>2. Pick the area, then the hotel</h2>\\n<p>A great hotel in the wrong place ruins a city break. Find the one or two neighbourhoods that match your trip (first visit, nightlife,\\nfood, quiet, near the station), then only look at hotels there. In small cities (Odense, Bruges, Salzburg) this barely matters;\\nin big ones (London, Paris, Hamburg) it matters more than anything else.</p>\\n<h2>3. Read the score and the number of reviews together</h2>\\n<p>A 9.6 from 12 reviews tells you very little. An 8.6 from 2,000 reviews tells you a lot. Our rule of thumb:</p>\\n<ul>\\n<li>Under 100 reviews: treat the score as a hint, not a fact.</li>\\n<li>Several hundred reviews and 8.5+: you can trust it.</li>\\n<li>Thousands of reviews and 8.0+: a very safe bet, even if it isn't exciting.</li>\\n</ul>\\n<h2>4. Read three bad reviews, not thirty good ones</h2>\\n<p>Sort by the lowest scores and read the three most recent. You're looking for patterns that would bother <i>you</i>: noise, small rooms,\\na broken lift, a building site next door. A complaint about the breakfast doesn't matter if you never eat breakfast.</p>\\n<h2>5. Compare the real total</h2>\\n<p>The headline price is rarely what you pay. Add breakfast, parking and city tax, and check the cancellation terms. A room that's €15 cheaper\\nbut non-refundable isn't always the better deal.</p>\\n<h2>6. Book, and stop looking</h2>\\n<p>Once a hotel passes all five steps, book it. Prices on good hotels in good areas tend to go up, not down, as the dates get closer.</p>\\n<h2>Or skip the five minutes</h2>\\n<p>That's exactly what Top3Hotels does for you: in every city we compare the well-reviewed hotels on the same dates and keep three, the best\\nbudget room, the best value and the best luxury hotel. <a href=\\\"/destinations\\\">Pick a city</a> and you'll see them in one screen.\\nRead the full <a href=\\\"/how-we-choose\\\">method</a>, or see which cities have the <a href=\\\"/guides/cheapest-5-star-hotels-in-europe\\\">cheapest five-star hotels in Europe</a>.</p>\\n\",\"date\":\"2026-10-15\",\"updated\":\"2026-10-15\",\"author\":\"Carlos de Ory\",\"words\":495,\"mins\":3}]");
var M = {
	en: {
		live: (d) => `Price checked on Booking.com · ${d}`,
		report: "Report an error",
		curatorT: "Picked by Carlos de Ory",
		curatorB: "Founder of Top3Hotels. Every pick follows the same public rules, and no hotel can pay to be included.",
		money: "How we make money",
		map: "Map",
		shareImg: "Share as image",
		voice: "Search by voice",
		mapTitle: "Every city on one map",
		mapLead: "Tap a dot to see the starting price for two and open the three picks.",
		from: "from",
		open: "See the 3 hotels",
		how: "How we choose",
		deal: "Luxury for less: cheaper than our best-value pick right now"
	},
	es: {
		live: (d) => `Precio comprobado en Booking.com · ${d}`,
		report: "Avisar de un error",
		curatorT: "Elegido por Carlos de Ory",
		curatorB: "Fundador de Top3Hotels. Cada elección sigue las mismas reglas públicas y ningún hotel puede pagar por aparecer.",
		money: "Cómo ganamos dinero",
		map: "Mapa",
		shareImg: "Compartir como imagen",
		voice: "Buscar por voz",
		mapTitle: "Todas las ciudades en un mapa",
		mapLead: "Toca un punto para ver el precio desde y abrir los tres hoteles.",
		from: "desde",
		open: "Ver los 3 hoteles",
		how: "Cómo elegimos",
		deal: "Lujo por menos: ahora más barato que el best value"
	},
	de: {
		live: (d) => `Preis auf Booking.com geprüft · ${d}`,
		report: "Fehler melden",
		curatorT: "Ausgewählt von Carlos de Ory",
		curatorB: "Gründer von Top3Hotels. Jede Auswahl folgt denselben öffentlichen Regeln, und kein Hotel kann für einen Platz bezahlen.",
		money: "Wie wir Geld verdienen",
		map: "Karte",
		shareImg: "Als Bild teilen",
		voice: "Per Sprache suchen",
		mapTitle: "Alle Städte auf einer Karte",
		mapLead: "Tippe auf einen Punkt für den Startpreis und die drei Hotels.",
		from: "ab",
		open: "Die 3 Hotels ansehen",
		how: "So wählen wir",
		deal: "Luxus für weniger: gerade günstiger als unser Preis-Leistungs-Tipp"
	},
	fr: {
		live: (d) => `Prix vérifié sur Booking.com · ${d}`,
		report: "Signaler une erreur",
		curatorT: "Sélectionné par Carlos de Ory",
		curatorB: "Fondateur de Top3Hotels. Chaque choix suit les mêmes règles publiques et aucun hôtel ne peut payer pour y figurer.",
		money: "Comment nous gagnons de l'argent",
		map: "Carte",
		shareImg: "Partager en image",
		voice: "Rechercher à la voix",
		mapTitle: "Toutes les villes sur une carte",
		mapLead: "Touchez un point pour voir le prix de départ et les trois hôtels.",
		from: "dès",
		open: "Voir les 3 hôtels",
		how: "Notre méthode",
		deal: "Le luxe pour moins : moins cher que notre meilleur rapport qualité-prix"
	},
	it: {
		live: (d) => `Prezzo verificato su Booking.com · ${d}`,
		report: "Segnala un errore",
		curatorT: "Scelto da Carlos de Ory",
		curatorB: "Fondatore di Top3Hotels. Ogni scelta segue le stesse regole pubbliche e nessun hotel può pagare per esserci.",
		money: "Come guadagniamo",
		map: "Mappa",
		shareImg: "Condividi come immagine",
		voice: "Cerca con la voce",
		mapTitle: "Tutte le città su una mappa",
		mapLead: "Tocca un punto per il prezzo di partenza e i tre hotel.",
		from: "da",
		open: "Vedi i 3 hotel",
		how: "Come scegliamo",
		deal: "Lusso per meno: ora costa meno della scelta qualità-prezzo"
	},
	pt: {
		live: (d) => `Preço verificado no Booking.com · ${d}`,
		report: "Reportar um erro",
		curatorT: "Escolhido por Carlos de Ory",
		curatorB: "Fundador da Top3Hotels. Cada escolha segue as mesmas regras públicas e nenhum hotel pode pagar para aparecer.",
		money: "Como ganhamos dinheiro",
		map: "Mapa",
		shareImg: "Partilhar como imagem",
		voice: "Pesquisar por voz",
		mapTitle: "Todas as cidades num mapa",
		mapLead: "Toque num ponto para ver o preço inicial e os três hotéis.",
		from: "desde",
		open: "Ver os 3 hotéis",
		how: "Como escolhemos",
		deal: "Luxo por menos: agora mais barato que a melhor relação qualidade-preço"
	},
	da: {
		live: (d) => `Pris tjekket på Booking.com · ${d}`,
		report: "Meld en fejl",
		curatorT: "Udvalgt af Carlos de Ory",
		curatorB: "Stifter af Top3Hotels. Alle valg følger de samme offentlige regler, og intet hotel kan betale for at komme med.",
		money: "Sådan tjener vi penge",
		map: "Kort",
		shareImg: "Del som billede",
		voice: "Søg med stemmen",
		mapTitle: "Alle byer på ét kort",
		mapLead: "Tryk på et punkt for at se startprisen og de tre hoteller.",
		from: "fra",
		open: "Se de 3 hoteller",
		how: "Sådan vælger vi",
		deal: "Luksus for mindre: lige nu billigere end vores bedste værdi"
	}
};
var CSS_MORE = `
.live{color:#167a4a;font-weight:600}.live:before{content:"";display:inline-block;width:8px;height:8px;border-radius:50%;background:#1fa463;margin-right:6px;box-shadow:0 0 0 3px #1fa46333;vertical-align:1px}
.pick.deal{background:#fff3e0;color:#9a4a00}
.report{font-size:12px;color:var(--muted);text-decoration:underline}
.ico{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#fff3;margin-right:6px;font-size:12px;line-height:1}
.curator{display:flex;gap:16px;align-items:center;border:1px solid var(--line);border-radius:18px;padding:18px 20px;background:var(--card,#fff);margin:22px 0}
.curator .av{flex:0 0 52px;height:52px;border-radius:50%;display:grid;place-items:center;font:600 18px var(--serif);color:#fff;background:linear-gradient(135deg,#1f7a5a,#d83b51 55%,#b8860b)}
.curator h3{margin:0 0 4px;font-size:17px}.curator p{margin:0;font-size:14px;color:var(--muted)}.curator a{font-size:13px;margin-right:12px}
.sticky3{display:none}
@media (max-width:760px){.sticky{display:none!important}.sticky3{display:flex;position:fixed;left:8px;right:8px;bottom:10px;z-index:50;gap:6px;padding:6px;border-radius:18px;background:#fffffff2;box-shadow:0 10px 30px #0003;backdrop-filter:blur(8px)}
.sticky3 a{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:52px;border-radius:13px;color:#fff;text-decoration:none;font:600 12px/1.15 var(--sans)}.sticky3 a b{font-size:15px}
.sticky3 .budget{background:#1f7a5a}.sticky3 .value{background:#d83b51}.sticky3 .lux{background:#9a6f0a}
body{padding-bottom:84px}.card .body{font-size:16px}.card .hname{font-size:24px;line-height:1.15}.card .btn{min-height:52px;font-size:16px}
section[aria-labelledby="cmp"] table{font-size:13px}section[aria-labelledby="cmp"] th:nth-child(3),section[aria-labelledby="cmp"] td:nth-child(3){display:none}}
.pal .mic{position:absolute;right:14px;top:14px;border:0;background:var(--line,#eee);border-radius:50%;width:36px;height:36px;font-size:17px;cursor:pointer}.pal .mic.on{background:#d83b51;color:#fff;animation:pop .8s infinite}
.pal>div{position:relative}
#wmap{height:70vh;min-height:420px;border-radius:18px;overflow:hidden;border:1px solid var(--line)}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:18px 0}.stats div{border:1px solid var(--line);border-radius:16px;padding:16px}.stats b{display:block;font:500 34px var(--serif)}
@media (max-width:700px){.stats{grid-template-columns:1fr 1fr}}
`;
/** Client-side extras. Plain ES5, no template placeholders. */
var JS_MORE = `(function(){
function ls(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(k)||'null');localStorage.setItem(k,JSON.stringify(v))}catch(_){return null}}
/* 1. remember dates and guests across cities */
var f=document.querySelector('form.plan'),ci=f&&f.querySelector('[name=checkin]');
if(ci){var co=f.querySelector('[name=checkout]'),ad=f.querySelector('[name=adults]'),ro=f.querySelector('[name=rooms]'),sv=ls('t3-plan'),today=new Date().toISOString().slice(0,10);
if(sv&&sv.ci>=today&&sv.co>sv.ci&&!ci.value){ci.value=sv.ci;co.value=sv.co;if(ad&&sv.ad)ad.value=sv.ad;if(ro&&sv.ro)ro.value=sv.ro;ci.dispatchEvent(new Event('change',{bubbles:true}))}
f.addEventListener('change',function(){ls('t3-plan',{ci:ci.value,co:co.value,ad:ad?ad.value:'2',ro:ro?ro.value:'1'})})}
/* 2. voice search inside the search palette */
var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
if(SR&&'MutationObserver' in window){new MutationObserver(function(){var p=document.querySelector('.pal');if(!p||p.querySelector('.mic'))return;var inp=p.querySelector('input');if(!inp)return;var b=document.createElement('button');b.type='button';b.className='mic';b.textContent='🎤';b.setAttribute('aria-label',window.T3V||'Voice');inp.parentNode.appendChild(b);
b.addEventListener('click',function(){try{var r=new SR();r.lang=document.documentElement.lang||'en';r.interimResults=false;b.classList.add('on');r.onresult=function(e){inp.value=e.results[0][0].transcript.replace(/^(hotels? in|hoteles en|hotel en|hotels in)\\s+/i,'');inp.dispatchEvent(new Event('input',{bubbles:true}))};r.onend=function(){b.classList.remove('on')};r.start()}catch(_){b.classList.remove('on')}})}).observe(document.body,{childList:true})}
/* 3. share the three picks as an image (1080x1350) */
document.addEventListener('click',function(e){var b=e.target.closest('[data-shareimg]');if(!b)return;e.preventDefault();var d=JSON.parse(b.getAttribute('data-shareimg'));
var W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;var x=c.getContext('2d');var g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0e1520');g.addColorStop(1,'#1b2a3d');x.fillStyle=g;x.fillRect(0,0,W,H);
x.fillStyle='#fff';x.font='600 34px Inter, Arial, sans-serif';x.fillText('top3hotels.',72,110);x.font='400 76px Georgia, serif';x.fillText(d.t1,72,250);x.fillStyle='#f3c969';x.fillText(d.city,72,340);
var col={budget:'#1f7a5a',value:'#d83b51',lux:'#b8860b'};d.h.forEach(function(h,i){var y=440+i*270;x.fillStyle='#ffffff14';x.fillRect(72,y,W-144,230);x.fillStyle=col[h.k]||'#888';x.fillRect(72,y,14,230);
x.fillStyle=col[h.k]||'#fff';x.font='600 28px Inter, Arial, sans-serif';x.fillText(h.l.toUpperCase(),116,y+56);x.fillStyle='#fff';x.font='600 46px Inter, Arial, sans-serif';var n=h.n.length>30?h.n.slice(0,29)+'…':h.n;x.fillText(n,116,y+122);x.font='400 32px Inter, Arial, sans-serif';x.fillStyle='#c9d4e2';x.fillText(h.s,116,y+180)});
x.fillStyle='#fff';x.font='600 32px Inter, Arial, sans-serif';x.fillText(d.url,72,H-80);
c.toBlob(function(bl){var file=new File([bl],'top3hotels-'+d.slug+'.png',{type:'image/png'});if(navigator.canShare&&navigator.canShare({files:[file]})){navigator.share({files:[file],title:d.t1+' '+d.city,text:d.url}).catch(function(){})}else{var a=document.createElement('a');a.href=URL.createObjectURL(bl);a.download=file.name;document.body.appendChild(a);a.click();a.remove()}if(window.t3track)t3track('share_image',{c:d.slug})},'image/png')});
/* 3b. date fields open the calendar */

/* 4. installable app */
if('serviceWorker' in navigator&&location.protocol==='https:')addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})});
})();`;
var SW_JS = `const C='t3-v1';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||r.mode!=='navigate'||new URL(r.url).origin!==location.origin)return;
e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res}).catch(()=>caches.match(r).then(m=>m||caches.match('/'))))});`;
var MANIFEST = JSON.stringify({
	name: "Top3Hotels",
	short_name: "Top3Hotels",
	description: "The best hotel in every city, picked in 1 second: budget, mid-range and upscale.",
	start_url: "/?source=pwa",
	scope: "/",
	display: "standalone",
	background_color: "#f7f8fa",
	theme_color: "#0e1520",
	icons: [
		{
			src: "/icon-192.png",
			sizes: "192x192",
			type: "image/png"
		},
		{
			src: "/icon-512.png",
			sizes: "512x512",
			type: "image/png"
		},
		{
			src: "/icon-512.png",
			sizes: "512x512",
			type: "image/png",
			purpose: "maskable"
		}
	]
});
var CSS_DP = ".t3dp-btn{all:unset;box-sizing:border-box;display:block;width:100%;min-height:30px;cursor:pointer;font:600 15px/1.3 Inter,system-ui,sans-serif;color:#16202e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.t3dp-btn.empty{color:#7a8594;font-weight:500}\n.t3dp-btn:focus-visible{outline:2px solid #d83b51;outline-offset:3px;border-radius:6px}\n.t3-citybar .t3dp-btn,form .t3dp-btn{font-size:14px;padding:8px 10px;border:1px solid rgba(127,127,127,.3);border-radius:10px;background:rgba(127,127,127,.06);color:inherit;margin-top:4px}\nhtml.t3dp-open,html.t3dp-open body{overflow:hidden}\nhtml.t3dp-open #v2-sticky,html.t3dp-open .sticky3,html.t3dp-open [class*=lang-toast],html.t3dp-open .t3-langbar{display:none!important}\n.t3dp{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;font-family:Inter,system-ui,sans-serif;color:#16202e}\n.t3dp[hidden]{display:none}\n.t3dp-bd{position:absolute;inset:0;background:rgba(10,16,26,.45);backdrop-filter:blur(2px)}\n.t3dp-p{position:relative;background:#fff;border-radius:22px;box-shadow:0 30px 80px rgba(0,0,0,.35);width:min(680px,94vw);max-height:92vh;display:flex;flex-direction:column;padding:16px 18px 14px;animation:t3dpIn .18s ease-out}\n@keyframes t3dpIn{from{transform:translateY(12px);opacity:0}to{transform:none;opacity:1}}\n.t3dp-h{display:flex;align-items:center;gap:8px}\n.t3dp-s{all:unset;cursor:pointer;flex:1;border:1.5px solid #e3e7ee;border-radius:14px;padding:8px 12px;display:flex;flex-direction:column;gap:2px;min-width:0}\n.t3dp-s small{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#7a8594}\n.t3dp-s b{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.t3dp-s.on{border-color:#d83b51;box-shadow:0 0 0 3px rgba(216,59,81,.12)}\n.t3dp-ar{color:#9aa3af}\n.t3dp-c{all:unset;cursor:pointer;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-size:16px;color:#4a5566;flex:none}\n.t3dp-c:hover{background:#f1f3f6}\n.t3dp-hint{margin:10px 2px 10px;font-size:13px;color:#4a5566;min-height:18px}\n.t3dp-wk{display:none}\n.t3dp-nav{display:flex;justify-content:space-between;position:relative;height:0;z-index:2;pointer-events:none}\n.t3dp-nav[hidden]{display:none}\n.t3dp-nav button{all:unset;pointer-events:auto;cursor:pointer;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-size:22px;color:#16202e;background:#fff;border:1px solid #e3e7ee}\n.t3dp-nav button:disabled{opacity:.3;cursor:default}\n.t3dp-ms{display:grid;grid-template-columns:1fr 1fr;gap:26px;overflow:auto;padding:4px 2px}\n.t3dp-m h4{margin:4px 0 10px!important;padding:0!important;line-height:34px;font-family:inherit!important;text-align:center;font-size:15px;font-weight:700;text-transform:capitalize}\n.t3dp-g{display:grid;grid-template-columns:repeat(7,1fr);row-gap:2px}\n.t3dp-g button{all:unset;box-sizing:border-box;cursor:pointer;height:42px;display:grid;place-items:center;font-size:14px;font-weight:500;border-radius:999px;position:relative;z-index:0}\n.t3dp-g button:hover:not(:disabled){background:#f1f3f6}\n.t3dp-g button:disabled{color:#c3c9d2;cursor:default;text-decoration:line-through;text-decoration-color:#e3e7ee}\n.t3dp-g button.td{font-weight:800;color:#d83b51}\n.t3dp-g button.in,.t3dp-g button.pv{border-radius:0;background:#fde8eb}\n.t3dp-g button.pv{background:#fdf1f3}\n.t3dp-g button.a,.t3dp-g button.b{background:#16202e!important;color:#fff!important;font-weight:700}\n.t3dp-g button.a{border-radius:999px 0 0 999px}.t3dp-g button.b{border-radius:0 999px 999px 0}\n.t3dp-g button.a:not(.b):last-child,.t3dp-g button.a.lone{border-radius:999px}\n.t3dp-f{display:flex;align-items:center;gap:10px;border-top:1px solid #eef1f5;margin-top:10px;padding-top:12px}\n.t3dp-clr{all:unset;cursor:pointer;font-size:14px;font-weight:600;text-decoration:underline;color:#16202e;padding:8px 4px}\n.t3dp-n{flex:1;text-align:center;font-size:14px;font-weight:600;color:#4a5566}\n.t3dp-ok{all:unset;cursor:pointer;background:#d83b51;color:#fff;font-weight:700;font-size:15px;padding:12px 26px;border-radius:12px}\n.t3dp-ok:disabled{background:#e9b9c1;cursor:default}\n@media (max-width:720px){\n.t3dp{align-items:flex-end}\n.t3dp-p{width:100%;max-height:88vh;border-radius:22px 22px 0 0;padding:14px 14px calc(12px + env(safe-area-inset-bottom));animation:t3dpUp .22s ease-out}\n@keyframes t3dpUp{from{transform:translateY(40%)}to{transform:none}}\n.t3dp-wk{display:grid;grid-template-columns:repeat(7,1fr);text-align:center;font-size:11px;font-weight:700;color:#7a8594;padding:4px 0 6px;border-bottom:1px solid #eef1f5}\n.t3dp-ms{grid-template-columns:1fr;gap:18px;flex:1;-webkit-overflow-scrolling:touch}\n.t3dp-g button{height:46px;font-size:15px}\n.t3dp-ok{flex:none}\n}\n@media (prefers-color-scheme:dark){.t3dp-p{background:#141c28;color:#eef2f7}.t3dp-s{border-color:#2a3647}.t3dp-g button:hover:not(:disabled),.t3dp-c:hover{background:#1f2a3a}.t3dp-g button.in,.t3dp-g button.pv{background:#3a2230}.t3dp-g button.a,.t3dp-g button.b{background:#eef2f7!important;color:#141c28!important}.t3dp-nav button{background:#141c28;border-color:#2a3647;color:#eef2f7}.t3dp-f{border-color:#22303f}.t3dp-clr{color:#eef2f7}.t3dp-g button:disabled{color:#4a5566}}\n/* destination suggestions must sit above the date fields */\n.search .field:first-child{z-index:40}\n.search .suggestions{z-index:50!important;box-shadow:0 18px 40px rgba(0,0,0,.18)!important;max-height:min(360px,55vh);overflow:auto;background:#fff!important}\nbody:has(#destination:focus) #v2-sticky,body:has(.cityq:focus) #v2-sticky{display:none!important}\nbody.t3-herovis #v2-sticky{transform:translateY(160%)!important}\n\n.t3-citybar .t3dp-btn{border:0!important;background:none!important;padding:2px 0!important;margin:0!important;font-size:15px!important}\n@media (max-width:720px){.v3-quick{flex-wrap:nowrap!important;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}.v3-quick::-webkit-scrollbar{display:none}.v3-quick button{flex:none}}\n.t3dp-m h4{position:relative}.t3dp-mv{all:unset;cursor:pointer;position:absolute;top:50%;transform:translateY(-50%);width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-size:22px;line-height:1;border:1px solid #e3e7ee;background:#fff;color:#16202e}.t3dp-mv.l{left:0}.t3dp-mv.r{right:0}.t3dp-mv:disabled{opacity:.3;cursor:default}.t3dp-mv:hover:not(:disabled){background:#f1f3f6}\n@media (prefers-color-scheme:dark){.t3dp-mv{background:#141c28;border-color:#2a3647;color:#eef2f7}}\n";
var JS_DP = "/* Top3Hotels range date picker: one sheet for check-in + check-out, replaces the native date pickers.\n   The real <input type=date> fields stay in the DOM (hidden) so every existing handler keeps working. */\n(function () {\n  if (window.T3DP) return;\n  var L = (document.documentElement.lang || 'en').slice(0, 2);\n  var TX = {\n    en: { add: 'Add date', ci: 'Check in', co: 'Check out', n1: 'night', n: 'nights', clear: 'Clear', done: 'Done', pickCo: 'Now pick your check-out', pickCi: 'Pick your check-in', max: 'Max. 30 nights' },\n    es: { add: 'Elegir fecha', ci: 'Entrada', co: 'Salida', n1: 'noche', n: 'noches', clear: 'Borrar', done: 'Listo', pickCo: 'Ahora elige la salida', pickCi: 'Elige la entrada', max: 'Máx. 30 noches' },\n    de: { add: 'Datum wählen', ci: 'Anreise', co: 'Abreise', n1: 'Nacht', n: 'Nächte', clear: 'Löschen', done: 'Fertig', pickCo: 'Jetzt Abreise wählen', pickCi: 'Anreise wählen', max: 'Max. 30 Nächte' },\n    fr: { add: 'Choisir', ci: 'Arrivée', co: 'Départ', n1: 'nuit', n: 'nuits', clear: 'Effacer', done: 'OK', pickCo: 'Choisissez le départ', pickCi: \"Choisissez l'arrivée\", max: '30 nuits max.' },\n    it: { add: 'Scegli data', ci: 'Arrivo', co: 'Partenza', n1: 'notte', n: 'notti', clear: 'Cancella', done: 'Fatto', pickCo: 'Ora scegli la partenza', pickCi: \"Scegli l'arrivo\", max: 'Max 30 notti' },\n    pt: { add: 'Escolher', ci: 'Entrada', co: 'Saída', n1: 'noite', n: 'noites', clear: 'Limpar', done: 'Pronto', pickCo: 'Agora escolha a saída', pickCi: 'Escolha a entrada', max: 'Máx. 30 noites' },\n    da: { add: 'Vælg dato', ci: 'Indtjekning', co: 'Udtjekning', n1: 'nat', n: 'nætter', clear: 'Ryd', done: 'Færdig', pickCo: 'Vælg nu udtjekning', pickCi: 'Vælg indtjekning', max: 'Maks. 30 nætter' }\n  };\n  var t = TX[L] || TX.en;\n  var loc = document.documentElement.lang || 'en';\n  var DAY = 864e5;\n  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }\n  function parse(s) { if (!s || !/^\\d{4}-\\d{2}-\\d{2}$/.test(s)) return null; var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }\n  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }\n  function nights(a, b) { return Math.round((b - a) / DAY); }\n  var fmtShort = new Intl.DateTimeFormat(loc, { weekday: 'short', day: 'numeric', month: 'short' });\n  var fmtMonth = new Intl.DateTimeFormat(loc, { month: 'long', year: 'numeric' });\n  var wk = []; for (var i = 0; i < 7; i++) wk.push(new Intl.DateTimeFormat(loc, { weekday: 'narrow' }).format(new Date(2024, 0, 1 + i)));\n  function fire(el) { el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }\n\n  /* sheet */\n  var sh, st = {};\n  function build() {\n    sh = document.createElement('div'); sh.className = 't3dp'; sh.hidden = true;\n    sh.innerHTML = '<div class=\"t3dp-bd\" data-x></div><div class=\"t3dp-p\" role=\"dialog\" aria-modal=\"true\" aria-label=\"' + t.ci + ' / ' + t.co + '\">' +\n      '<div class=\"t3dp-h\"><button type=\"button\" class=\"t3dp-s\" data-s=\"0\"><small>' + t.ci + '</small><b></b></button><span class=\"t3dp-ar\">→</span><button type=\"button\" class=\"t3dp-s\" data-s=\"1\"><small>' + t.co + '</small><b></b></button><button type=\"button\" class=\"t3dp-c\" data-x aria-label=\"Close\">✕</button></div>' +\n      '<p class=\"t3dp-hint\" aria-live=\"polite\"></p><div class=\"t3dp-wk\"></div><div class=\"t3dp-nav\"><button type=\"button\" data-m=\"-1\" aria-label=\"Previous month\">‹</button><button type=\"button\" data-m=\"1\" aria-label=\"Next month\">›</button></div><div class=\"t3dp-ms\"></div>' +\n      '<div class=\"t3dp-f\"><button type=\"button\" class=\"t3dp-clr\">' + t.clear + '</button><span class=\"t3dp-n\"></span><button type=\"button\" class=\"t3dp-ok\">' + t.done + '</button></div></div>';\n    document.body.appendChild(sh);\n    sh.querySelector('.t3dp-wk').innerHTML = wk.map(function (w) { return '<span>' + w + '</span>'; }).join('');\n    sh.addEventListener('click', function (e) {\n      var x = e.target.closest('[data-x]'); if (x) return close();\n      var d = e.target.closest('button[data-d]'); if (d && !d.disabled) return pick(parse(d.dataset.d));\n      var m = e.target.closest('[data-m]'); if (m) { st.off = Math.max(0, st.off + (+m.dataset.m)); return render(); }\n      var s = e.target.closest('[data-s]'); if (s) { st.phase = +s.dataset.s; if (st.phase === 0) { } return render(); }\n      if (e.target.closest('.t3dp-clr')) { st.a = st.b = null; st.phase = 0; return render(); }\n      if (e.target.closest('.t3dp-ok')) return apply(true);\n    });\n    sh.addEventListener('mouseover', function (e) { var d = e.target.closest('button[data-d]'); if (d && st.phase === 1 && st.a) { st.hov = parse(d.dataset.d); paint(); } });\n    document.addEventListener('keydown', function (e) { if (!sh.hidden && e.key === 'Escape') close(); });\n  }\n  function monthHTML(y, m) {\n    var first = new Date(y, m, 1), lead = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate(), td = today(), h = '';\n    for (var i = 0; i < lead; i++) h += '<span></span>';\n    for (var d = 1; d <= days; d++) {\n      var dt = new Date(y, m, d), k = iso(dt), dis = dt < td || (st.phase === 1 && st.a && dt > st.a && nights(st.a, dt) > 30);\n      h += '<button type=\"button\" data-d=\"' + k + '\"' + (dis ? ' disabled' : '') + (+dt === +td ? ' class=\"td\"' : '') + ' aria-label=\"' + fmtShort.format(dt) + '\">' + d + '</button>';\n    }\n    return '<div class=\"t3dp-m\"><h4>' + fmtMonth.format(first) + '</h4><div class=\"t3dp-g\">' + h + '</div></div>';\n  }\n  function render() {\n    var base = today(), many = matchMedia('(max-width: 720px)').matches, n = many ? 12 : 2, h = '';\n    for (var i = 0; i < n; i++) { var dm = new Date(base.getFullYear(), base.getMonth() + (many ? 0 : st.off) + i, 1); h += monthHTML(dm.getFullYear(), dm.getMonth()); }\n    var ms = sh.querySelector('.t3dp-ms'); ms.innerHTML = h;\n    sh.querySelector('.t3dp-nav').hidden = true;\n    if (!many) {\n      var hs = ms.querySelectorAll('.t3dp-m h4');\n      hs[0].insertAdjacentHTML('afterbegin', '<button type=\"button\" class=\"t3dp-mv l\" data-m=\"-1\" aria-label=\"Previous month\"' + (st.off <= 0 ? ' disabled' : '') + '>‹</button>');\n      hs[hs.length - 1].insertAdjacentHTML('beforeend', '<button type=\"button\" class=\"t3dp-mv r\" data-m=\"1\" aria-label=\"Next month\">›</button>');\n    }\n    paint();\n  }\n  function paint() {\n    var a = st.a, b = st.b || (st.phase === 1 && a && st.hov && st.hov > a ? st.hov : null);\n    sh.querySelectorAll('button[data-d]').forEach(function (el) {\n      var d = parse(el.dataset.d), on = a && +d === +a, off = b && +d === +b;\n      el.classList.toggle('a', !!on); el.classList.toggle('b', !!off); el.classList.toggle('lone', !!(on && !b));\n      el.classList.toggle('in', !!(a && b && d > a && d < b));\n      el.classList.toggle('pv', !!(a && !st.b && b && d > a && d <= b));\n    });\n    var s = sh.querySelectorAll('.t3dp-s');\n    s[0].querySelector('b').textContent = st.a ? fmtShort.format(st.a) : t.add;\n    s[1].querySelector('b').textContent = st.b ? fmtShort.format(st.b) : t.add;\n    s[0].classList.toggle('on', st.phase === 0); s[1].classList.toggle('on', st.phase === 1);\n    var nn = st.a && st.b ? nights(st.a, st.b) : 0;\n    sh.querySelector('.t3dp-n').textContent = nn ? nn + ' ' + (nn === 1 ? t.n1 : t.n) : '';\n    sh.querySelector('.t3dp-hint').textContent = st.phase === 1 && st.a && !st.b ? t.pickCo + ' · ' + t.max : (!st.a ? t.pickCi : '');\n    sh.querySelector('.t3dp-ok').disabled = !(st.a && st.b);\n  }\n  function pick(d) {\n    if (st.phase === 0 || !st.a || d <= st.a) { st.a = d; st.b = null; st.phase = 1; st.hov = null; render(); return; }\n    st.b = d; st.hov = null; paint();\n    apply(false); setTimeout(close, 260);\n  }\n  function apply(andClose) {\n    if (!st.a || !st.b || !st.pair) return;\n    var ci = st.pair.ci, co = st.pair.co;\n    ci.value = iso(st.a); fire(ci);\n    co.value = iso(st.b); fire(co);\n    sync(st.pair);\n    try { document.dispatchEvent(new CustomEvent('t3:dates', { detail: { root: st.pair.root, ci: ci.value, co: co.value } })); } catch (_) {}\n    if (andClose) close();\n  }\n  function open(pair, phase) {\n    if (!sh) build();\n    st.pair = pair; st.a = parse(pair.ci.value); st.b = parse(pair.co.value);\n    if (st.a && st.a < today()) { st.a = st.b = null; }\n    st.phase = phase === 1 && st.a ? 1 : 0; if (st.phase === 0) { } st.off = 0; st.hov = null;\n    if (st.a) { var td = today(); st.off = Math.max(0, (st.a.getFullYear() - td.getFullYear()) * 12 + st.a.getMonth() - td.getMonth()); }\n    sh.hidden = false; document.documentElement.classList.add('t3dp-open');\n    render();\n    if (matchMedia('(max-width: 720px)').matches && st.a) {\n      var el = sh.querySelector('[data-d=\"' + iso(st.a) + '\"]'); if (el) { var m = el.closest('.t3dp-m'); if (m) m.scrollIntoView({ block: 'start' }); }\n    } else sh.querySelector('.t3dp-ms').scrollTop = 0;\n  }\n  function close() { if (!sh) return; sh.hidden = true; document.documentElement.classList.remove('t3dp-open'); }\n\n  /* attach to every check-in/check-out pair */\n  function label(el) { var d = parse(el.value); return d ? fmtShort.format(d) : t.add; }\n  function sync(pair) { pair.bi.textContent = label(pair.ci); pair.bo.textContent = label(pair.co); pair.bi.classList.toggle('empty', !pair.ci.value); pair.bo.classList.toggle('empty', !pair.co.value); }\n  function q(root, k) { return root.querySelector('#' + k + ',[name=' + k + '],[data-sync=' + k + ']'); }\n  function attach(root) {\n    var ci = q(root, 'checkin'), co = q(root, 'checkout');\n    if (!ci || !co || ci.dataset.t3dp || ci.type !== 'date') return;\n    var pair = { ci: ci, co: co, root: root }; root.__t3pair = pair;\n    [ci, co].forEach(function (inp, k) {\n      inp.dataset.t3dp = '1'; inp.classList.add('t3dp-real'); inp.style.display = 'none'; inp.tabIndex = -1; inp.setAttribute('aria-hidden', 'true');\n      var b = document.createElement('button'); b.type = 'button'; b.className = 't3dp-btn';\n      b.setAttribute('aria-haspopup', 'dialog'); b.setAttribute('aria-label', k ? t.co : t.ci);\n      inp.insertAdjacentElement('afterend', b);\n      b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); open(pair, k); });\n      inp.addEventListener('change', function () { sync(pair); }); inp.addEventListener('input', function () { sync(pair); });\n      if (k) pair.bo = b; else pair.bi = b;\n    });\n    var lab = root.querySelectorAll('label[for=\"checkin\"],label[for=\"checkout\"]');\n    lab.forEach(function (l) { l.addEventListener('click', function (e) { e.preventDefault(); open(pair, l.getAttribute('for') === 'checkout' ? 1 : 0); }); });\n    sync(pair);\n    setInterval(function () { sync(pair); }, 1500);\n  }\n  function scan() { document.querySelectorAll('.search,.t3-citybar,form').forEach(attach); }\n  window.T3DP = { scan: scan, open: open, openFor: function (root, ph) { scan(); if (root && root.__t3pair) open(root.__t3pair, ph || 0); } };\n  var hero = document.querySelector('.hero');\n  if (hero && document.querySelector('.hero .search') && 'IntersectionObserver' in window) new IntersectionObserver(function (es) { document.body.classList.toggle('t3-herovis', es[0].isIntersecting); }, { threshold: 0.15 }).observe(hero);\n  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();\n  new MutationObserver(function () { clearTimeout(scan.t); scan.t = setTimeout(scan, 120); }).observe(document.documentElement, { childList: true, subtree: true });\n})();\n";
/**
* Server-rendered SEO layer for Top3Hotels (v2).
*
* Real catalogue (src/generated/catalogue-packed.json) + enrichment:
*  - hotel-extras.json: guest pros/cons, facility tags, location score (Booking.com, keyed by hotel path)
*  - city-extras.json:  city hero photo (Wikimedia Commons) and best-known sights (Wikipedia)
* Six languages with hreflang, themed lists, event lists, real map (MapLibre + OpenFreeMap), dark mode.
* No framework: plain HTML + inline CSS, a few lines of JS for the map.
*/
var SITE = "https://www.top3hotels.com";
var SNAPSHOT_DATE = "2026-10-08";
var BRAND = {
	entity: "Equinox Investment Group LLC",
	place: "Wyoming, United States",
	email: "carlos@equinoxinvestmentgroup.com",
	founder: "Carlos de Ory"
};
var fmtDate = (iso, L) => {
	try {
		return new Intl.DateTimeFormat(L, {
			day: "numeric",
			month: "long",
			year: "numeric"
		}).format(new Date(iso));
	} catch {
		return iso;
	}
};
var loaded;
function load() {
	if (!loaded) loaded = Promise.all([
		import("./catalogue-packed-BIOp7wxB.mjs").then((m) => m.default ?? m),
		import("./seo-data-CPbDnV-9.mjs").then((m) => (m.default ?? m).cities),
		import("./hotel-extras-C3OX-bx2.mjs").then((m) => m.default ?? m),
		import("./city-extras-CheXXdIB.mjs").then((m) => m.default ?? m)
	]).then(([packed, index, hx, cx]) => ({
		packed,
		index,
		hx,
		cx
	}));
	return loaded;
}
var maps;
async function data() {
	const d = await load();
	if (!maps) {
		const bySlug = new Map(d.index.map((c) => [c.slug, c]));
		const byId = new Map(d.index.map((c) => [c.id, c]));
		const byCountry = /* @__PURE__ */ new Map();
		for (const c of d.index) {
			const list = byCountry.get(c.cslug) ?? [];
			list.push(c);
			byCountry.set(c.cslug, list);
		}
		for (const list of byCountry.values()) list.sort((a, b) => a.city.localeCompare(b.city));
		maps = {
			bySlug,
			byId,
			byCountry
		};
	}
	return {
		...d,
		...maps
	};
}
function unpack(packed, value) {
	const [strings, schemas] = packed.dictionary;
	const walk = (v) => {
		if (Array.isArray(v)) {
			if (v[0] === -1) return v.slice(1).map(walk);
			if (v[0] === -2) {
				const keys = schemas[v[1]] ?? [];
				const out = {};
				keys.forEach((k, i) => out[k] = walk(v[i + 2]));
				return out;
			}
			return v.map(walk);
		}
		if (v && typeof v === "object") {
			const o = v;
			if ("s" in o && Object.keys(o).length === 1) return strings[o["s"]];
			const out = {};
			for (const k of Object.keys(o)) out[k] = walk(o[k]);
			return out;
		}
		return v;
	};
	return walk(value);
}
var BLOCKED_IMG = /onthebeach\.co\.uk/;
var hotelKey = (h) => {
	try {
		return new URL(h.booking?.url ?? "").pathname;
	} catch {
		return "";
	}
};
/** One destination, unpacked and enriched (used by the pages and by /api/catalogue/<id>). */
var LUX5 = {"georgetown-guyana":{"Luxury":{"id":1286824,"name":"Guyana Marriott Hotel Georgetown","area":"Georgetown","address":"Block Alpha , Battery Road, Kingston","lat":6.825619,"lng":-58.164282,"url":"https://www.booking.com/hotel/gy/guyana-marriott-georgetown-georgetown.html","score":7.5,"count":107,"stars":5,"total":873.52,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Georgetown on Booking.com: 7.5/10 from 107 guest reviews."}},"canggu-indonesia":{"Luxury":{"id":12900339,"name":"TUI BLUE Berawa Hotel and Villas","area":"Canggu","address":"No.101 Jalan Pantai Berawa","lat":-8.660864,"lng":115.140206,"url":"https://www.booking.com/hotel/id/berawa-amp-villas.html","score":9.1,"count":799,"stars":5,"total":222.66,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Canggu on Booking.com: 9.1/10 from 799 guest reviews."}},"dakar-senegal":{"Luxury":{"id":98428,"name":"Pullman Dakar Teranga","area":"Dakar","address":"10 Rue Colbert","lat":14.667689,"lng":-17.430656,"url":"https://www.booking.com/hotel/sn/dakar-teranga.html","score":8.1,"count":265,"stars":5,"total":1207.4,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Dakar on Booking.com: 8.1/10 from 265 guest reviews."}},"mahon-spain":{"Luxury":{"id":6375718,"name":"Cristine Bedfor Mahon Boutique Hotel","area":"Mahón","address":"19 Carrer de la Infanta","lat":39.887369,"lng":4.265355,"url":"https://www.booking.com/hotel/es/cristine-bedfor.html","score":9.2,"count":232,"stars":5,"total":400.72,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Mahón on Booking.com: 9.2/10 from 232 guest reviews."}},"indianapolis-united-states":{"Luxury":{"id":42842,"name":"Conrad Indianapolis","area":"Indianapolis","address":"50 West Washington Street","lat":39.767259,"lng":-86.159345,"url":"https://www.booking.com/hotel/us/conrad-indianapolis.html","score":8.3,"count":131,"stars":5,"total":607.57,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Indianapolis on Booking.com: 8.3/10 from 131 guest reviews."}},"iasi-romania":{"Luxury":{"id":178950,"name":"Pleiada Boutique Hotel & Spa","area":"Iași","address":"Soseaua Bucium nr. 18","lat":47.13434,"lng":27.607629,"url":"https://www.booking.com/hotel/ro/pleiada-boutique-hotel-and-spa.html","score":9.3,"count":1385,"stars":5,"total":216.58,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Iași on Booking.com: 9.3/10 from 1,385 guest reviews."}},"hurghada-egypt":{"Luxury":{"id":8985201,"name":"Pickalbatros Blu Spa Resort - Adults Friendly 16 Years Plus - Couples Only - Ultra All-Inclusive","area":"Hurghada","address":"El Corniche St., Al Mamsha El Seyahi,  . Village Road , Hurghada , Red Sea","lat":27.182645,"lng":33.824915,"url":"https://www.booking.com/hotel/eg/pickalbatros-blu-spa-resort-adults-friendly-16-years-plus.html","score":9.6,"count":3565,"stars":5,"total":697.42,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Hurghada on Booking.com: 9.6/10 from 3,565 guest reviews."}},"taranto-italy":{"Luxury":{"id":14678,"name":"Relais Histò San Pietro Sul Mar Piccolo","area":"Taranto","address":"Via Sant'Andrea, Circummarpiccolo","lat":40.508399,"lng":17.316234,"url":"https://www.booking.com/hotel/it/histo-san-pietro-sul-mar-piccolo.html","score":9.3,"count":119,"stars":5,"total":873.68,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Taranto on Booking.com: 9.3/10 from 119 guest reviews."}},"olsztyn-poland":{"Luxury":{"id":546134,"name":"Hotel Marina Club","area":"Olsztyn","address":"Siła 100","lat":53.710222,"lng":20.376903,"url":"https://www.booking.com/hotel/pl/marina-golf-club.html","score":9.4,"count":2028,"stars":5,"total":329.39,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Olsztyn on Booking.com: 9.4/10 from 2,028 guest reviews."}},"obidos-portugal":{"Luxury":{"id":536563,"name":"The Beachfront - Praia D'El Rey Golf & Beach Resort","area":"Óbidos","address":"Avenida D. Pedro I, nº30","lat":39.399169,"lng":-9.273866,"url":"https://www.booking.com/hotel/pt/the-beachfront-praia-d-el-rey-golf-beach-resort.html","score":9.0,"count":373,"stars":5,"total":408.6,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Óbidos on Booking.com: 9.0/10 from 373 guest reviews."}},"sunderland-united-kingdom":{"Luxury":{"id":13545644,"name":"The Beach House Boutique Hotel","area":"Sunderland","address":"1 Roker Terrace, Sunderland.","lat":54.921596,"lng":-1.365956,"url":"https://www.booking.com/hotel/gb/one-roker-terrace-tyne-and-wear.html","score":9.4,"count":245,"stars":5,"total":498.89,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Sunderland on Booking.com: 9.4/10 from 245 guest reviews."}},"anaheim-united-states":{"Luxury":{"id":5770520,"name":"JW Marriott, Anaheim Resort","area":"Anaheim","address":"1775 South Clementine Street","lat":33.806258,"lng":-117.910233,"url":"https://www.booking.com/hotel/us/jw-marriott-anaheim-resort.html","score":8.8,"count":378,"stars":5,"total":876.1,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Anaheim on Booking.com: 8.8/10 from 378 guest reviews."}},"oklahoma-city-united-states":{"Luxury":{"id":13468127,"name":"Citizen House Hotel","area":"Oklahoma City","address":"600 N Robinson Ave","lat":35.473045,"lng":-97.51608,"url":"https://www.booking.com/hotel/us/citizen-house.html","score":9.3,"count":43,"stars":5,"total":441.71,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Oklahoma City on Booking.com: 9.3/10 from 43 guest reviews."}},"bastia-france":{"Luxury":{"id":15825050,"name":"ROSEMARY hôtel","area":"Bastia","address":"21 boulevard Hyacinthe de Montera","lat":42.699275,"lng":9.446208,"url":"https://www.booking.com/hotel/fr/rosemary.html","score":9.5,"count":36,"stars":5,"total":747.2,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Bastia on Booking.com: 9.5/10 from 36 guest reviews."}},"campeche-mexico":{"Luxury":{"id":326487,"name":"Hotel Boutique Casa Don Gustavo, Campeche","area":"Campeche","address":"calle 59 No. 4","lat":19.845383,"lng":-90.538209,"url":"https://www.booking.com/hotel/mx/casa-don-gustavo-boutique.html","score":8.9,"count":121,"stars":5,"total":602.76,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Campeche on Booking.com: 8.9/10 from 121 guest reviews."}},"haarlem-netherlands":{"Luxury":{"id":303428,"name":"Brasss Hotel Suites","area":"Haarlem","address":"Korte Veerstraat 1","lat":52.379734,"lng":4.637507,"url":"https://www.booking.com/hotel/nl/lambermon-s-suites.html","score":9.0,"count":1119,"stars":5,"total":473.6,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Haarlem on Booking.com: 9.0/10 from 1,119 guest reviews."}},"salalah-oman":{"Luxury":{"id":2014752,"name":"Al Baleed Resort Salalah by Anantara","area":"Salalah","address":"P.O. Box 360, P.C. 214 Al Mansurah Street, Al Baleed, Salalah, Sultunate of Oman","lat":17.009874,"lng":54.146817,"url":"https://www.booking.com/hotel/om/al-baleed-resort-salalah-by-anantara.html","score":8.9,"count":337,"stars":5,"total":724.38,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Salalah on Booking.com: 8.9/10 from 337 guest reviews."}},"ponte-de-lima-portugal":{"Luxury":{"id":367480,"name":"Carmo's Boutique Hotel - Small Luxury Hotels of the World","area":"Ponte de Lima","address":"Rua Santiago da Gemieira, nº 10, Gemieira","lat":41.775439,"lng":-8.534009,"url":"https://www.booking.com/hotel/pt/carmo-s-boutique.html","score":8.8,"count":227,"stars":5,"total":460.8,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Ponte de Lima on Booking.com: 8.8/10 from 227 guest reviews."}},"constanta-romania":{"Luxury":{"id":1889286,"name":"Belle Epoque Boutique (Adult Only)","area":"Constanta","address":"Bulevardul Tomis 16","lat":44.175427,"lng":28.656297,"url":"https://www.booking.com/hotel/ro/belle-epoque-boutique-villa.html","score":9.7,"count":118,"stars":5,"total":336.56,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Constanta on Booking.com: 9.7/10 from 118 guest reviews."}},"alanya-turkiye":{"Luxury":{"id":1328377,"name":"Day One Beach Resort & SPA - Adult Only","area":"Alanya","address":"Cumhuriyet Mah. Sanat Okulu Cad. Alanya","lat":36.538978,"lng":32.026461,"url":"https://www.booking.com/hotel/tr/banana-otel.html","score":8.8,"count":787,"stars":5,"total":324.48,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Alanya on Booking.com: 8.8/10 from 787 guest reviews."}},"gaborone-botswana":{"Luxury":{"id":1168032,"name":"Grand Palm Hotel, Gaborone","area":"Gaborone","address":"Bonnington Farm, Molepolole Road","lat":-24.640255,"lng":25.877409,"url":"https://www.booking.com/hotel/bw/peermont-walmont.html","score":7.5,"count":69,"stars":5,"total":273.83,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Gaborone on Booking.com: 7.5/10 from 69 guest reviews."}},"st-john-s-canada":{"Luxury":{"id":2641413,"name":"Ryan Mansion","area":"St. John's","address":"21 Rennies Mill Road","lat":47.569655,"lng":-52.709049,"url":"https://www.booking.com/hotel/ca/ryan-mansion.html","score":8.3,"count":112,"stars":5,"total":285.4,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in St. John's on Booking.com: 8.3/10 from 112 guest reviews."}},"tours-france":{"Luxury":{"id":7842552,"name":"Les Trésorières","area":"Tours","address":"2 Place Jean Meunier","lat":47.390539,"lng":0.681483,"url":"https://www.booking.com/hotel/fr/les-tresorieres.html","score":9.2,"count":310,"stars":5,"total":670.84,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Tours on Booking.com: 9.2/10 from 310 guest reviews."}},"legian-indonesia":{"Luxury":{"id":402556,"name":"The Magani Hotel and Spa","area":"Legian","address":"Jalan Melasti, Legian Kelod","lat":-8.708689,"lng":115.170053,"url":"https://www.booking.com/hotel/id/the-magani-amp-spa.html","score":9.1,"count":1597,"stars":5,"total":257.3,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Legian on Booking.com: 9.1/10 from 1,597 guest reviews."}},"torquay-unitedkingdom":{"Luxury":{"id":1759331,"name":"Cary Arms & Spa","area":"Torquay","address":"Beach Road","lat":50.478859,"lng":-3.508822,"url":"https://www.booking.com/hotel/gb/cary-arms-babbacombe-torquay.html","score":9.3,"count":266,"stars":5,"total":572.89,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Torquay on Booking.com: 9.3/10 from 266 guest reviews."}},"bentonville-united-states":{"Luxury":{"id":14258020,"name":"The Compton","area":"Bentonville","address":"200 E Central Ave","lat":36.372007,"lng":-94.207705,"url":"https://www.booking.com/hotel/us/the-compton.html","score":9.4,"count":32,"stars":5,"total":1749.71,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Bentonville on Booking.com: 9.4/10 from 32 guest reviews."}},"phoenix-united-states":{"Luxury":{"id":263665,"name":"JW Marriott Phoenix Desert Ridge Resort & Spa","area":"Phoenix","address":"5350 East Marriott Drive","lat":33.683452,"lng":-111.966063,"url":"https://www.booking.com/hotel/us/jw-marriott-phoenix-desert-ridge-resort.html","score":8.6,"count":70,"stars":5,"total":1638.87,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Phoenix on Booking.com: 8.6/10 from 70 guest reviews."}},"mytilene-greece":{"Luxury":{"id":265824,"name":"Elysion Hotel","area":"Mytilene","address":"Neapoli","lat":39.068865,"lng":26.593861,"url":"https://www.booking.com/hotel/gr/elysion.html","score":8.9,"count":482,"stars":5,"total":228.8,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Mytilene on Booking.com: 8.9/10 from 482 guest reviews."}},"balneario-camboriu-brazil":{"Luxury":{"id":11387136,"name":"Morada Pedra Branca boutique Hotel","area":"Balneario Camboriu","address":"Rua Morro da Pedra Branca","lat":-27.031859,"lng":-48.613443,"url":"https://www.booking.com/hotel/br/morada-pedra-branca.html","score":8.9,"count":35,"stars":5,"total":227.68,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Balneario Camboriu on Booking.com: 8.9/10 from 35 guest reviews."}},"whistler-canada":{"Luxury":{"id":446327,"name":"Four Seasons Resort Whistler","area":"Whistler","address":"4591 Blackcomb Way","lat":50.119017,"lng":-122.944345,"url":"https://www.booking.com/hotel/ca/four-seasons-whistler.html","score":9.5,"count":382,"stars":5,"total":738.17,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Whistler on Booking.com: 9.5/10 from 382 guest reviews."}},"valence-france":{"Luxury":{"id":44887,"name":"Maison Pic","area":"Valence","address":"285 Avenue Victor Hugo","lat":44.917659,"lng":4.885483,"url":"https://www.booking.com/hotel/fr/maison-pic.html","score":9.4,"count":160,"stars":5,"total":881.6,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Valence on Booking.com: 9.4/10 from 160 guest reviews."}},"nafplio-greece":{"Luxury":{"id":238954,"name":"Amphitryon Hotel","area":"Nafplio","address":"3-5, Spiliadou Str","lat":37.565807,"lng":22.794421,"url":"https://www.booking.com/hotel/gr/amphitryon.html","score":7.7,"count":153,"stars":5,"total":418.0,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Nafplio on Booking.com: 7.7/10 from 153 guest reviews."}},"nusa-penida-indonesia":{"Luxury":{"id":12077759,"name":"Semaya Beach Resort","area":"Nusa Penida","address":"7J39+J3F, Suana, Nusa Penida, Klungkung Regency, Bali 80771","lat":-8.745938,"lng":115.617672,"url":"https://www.booking.com/hotel/id/nusa-penida-beach-resort.html","score":9.5,"count":775,"stars":5,"total":391.09,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Nusa Penida on Booking.com: 9.5/10 from 775 guest reviews."}},"colima-mexico":{"Luxury":{"id":398386,"name":"Hotel Boutique Hacienda del Gobernador","area":"Colima","address":"Calle Gildardo Gomez, 128. Colonia Centro","lat":19.242987,"lng":-103.730848,"url":"https://www.booking.com/hotel/mx/boutique-hacienda-del-gobernador.html","score":8.1,"count":74,"stars":5,"total":140.24,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Colima on Booking.com: 8.1/10 from 74 guest reviews."}},"horta-portugal":{"Luxury":{"id":16663552,"name":"The Book Hotel","area":"Horta","address":"Largo do Bpo. Dom Alexandre 8","lat":38.540761,"lng":-28.623989,"url":"https://www.booking.com/hotel/pt/the-book.html","score":9.6,"count":38,"stars":5,"total":306.0,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Horta on Booking.com: 9.6/10 from 38 guest reviews."}},"apia-samoa":{"Luxury":{"id":353054,"name":"Sheraton Samoa Aggie Grey's Hotel & Bungalows","area":"Apia","address":"Main Beach Road, Vaisigano","lat":-13.831538,"lng":-171.760168,"url":"https://www.booking.com/hotel/ws/sheraton-samoa-aggie-greys-hotel-and-bungalows.html","score":7.8,"count":1104,"stars":5,"total":275.36,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Apia on Booking.com: 7.8/10 from 1,104 guest reviews."}},"monterey-united-states":{"Luxury":{"id":59154,"name":"Monterey Plaza Hotel & Spa","area":"Monterey","address":"400 Cannery Row","lat":36.611925,"lng":-121.898164,"url":"https://www.booking.com/hotel/us/monterey-park-spa.html","score":9.1,"count":530,"stars":5,"total":759.14,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Monterey on Booking.com: 9.1/10 from 530 guest reviews."}},"kelowna-canada":{"Luxury":{"id":266244,"name":"Delta Hotels by Marriott Grand Okanagan Resort","area":"Kelowna","address":"1310 Water Street","lat":49.891548,"lng":-119.497578,"url":"https://www.booking.com/hotel/ca/delta-grand-okanagan-resort.html","score":8.3,"count":452,"stars":5,"total":343.99,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Kelowna on Booking.com: 8.3/10 from 452 guest reviews."}},"annecy-france":{"Luxury":{"id":888936,"name":"Les Loges Annecy Vieille Ville","area":"Annecy","address":"35 rue Sainte Claire","lat":45.898026,"lng":6.123658,"url":"https://www.booking.com/hotel/fr/les-loges-annecy-vieille-ville.html","score":8.6,"count":599,"stars":5,"total":630.0,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Annecy on Booking.com: 8.6/10 from 599 guest reviews."}},"brescia-italy":{"Luxury":{"id":41871,"name":"Hotel Vittoria","area":"Brescia","address":"Via X Giornate 20","lat":45.538354,"lng":10.220166,"url":"https://www.booking.com/hotel/it/vittoria-brescia.html","score":7.9,"count":1535,"stars":5,"total":244.0,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Brescia on Booking.com: 7.9/10 from 1,535 guest reviews."}},"ferrara-italy":{"Luxury":{"id":1132168,"name":"Hotel & SPA Duchessa Isabella Collection by GSA Hotels","area":"Ferrara","address":"Via Palestro 70","lat":44.840356,"lng":11.624745,"url":"https://www.booking.com/hotel/it/duchessa-isabella.html","score":8.5,"count":528,"stars":5,"total":332.0,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Ferrara on Booking.com: 8.5/10 from 528 guest reviews."}},"conwy-united-kingdom":{"Luxury":{"id":11956279,"name":"The Manor Boutique Hotel Restaurant and Bar","area":"Conwy","address":"the manor, gorse hill caravan park, trefriw road, conwy","lat":53.259653,"lng":-3.831228,"url":"https://www.booking.com/hotel/gb/the-manor-boutique-restaurant-and-bar-conwy.html","score":9.0,"count":546,"stars":5,"total":325.83,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Conwy on Booking.com: 9.0/10 from 546 guest reviews."}},"preston-united-kingdom":{"Luxury":{"id":1970305,"name":"No.10 Preston","area":"Preston","address":"10 Theatre Street","lat":53.75702,"lng":-2.704263,"url":"https://www.booking.com/hotel/gb/10-theatre-street-apartment.html","score":8.8,"count":478,"stars":5,"total":191.2,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Preston on Booking.com: 8.8/10 from 478 guest reviews."}},"naples-florida-united-states":{"Luxury":{"id":188256,"name":"The Ritz-Carlton Naples","area":"Naples, Florida","address":"280 Vanderbilt Beach Road","lat":26.251951,"lng":-81.821301,"url":"https://www.booking.com/hotel/us/ritz-carlton-naples.html","score":9.3,"count":81,"stars":5,"total":3051.2,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Naples, Florida on Booking.com: 9.3/10 from 81 guest reviews."}},"mui-ne-vietnam":{"Luxury":{"id":9194505,"name":"The Anam Mui Ne","area":"Mui Ne","address":"18 Nguyen Dinh Chieu, Mui Ne","lat":10.942592,"lng":108.194609,"url":"https://www.booking.com/hotel/vn/the-anam-mui-ne.html","score":9.5,"count":546,"stars":5,"total":550.65,"checked":"23 Oct 2026","reason":"The best-rated official 5-star hotel we found in Mui Ne on Booking.com: 9.5/10 from 546 guest reviews."}},"menton-france":{"Luxury":{"id":51527,"name":"Hotel Napoléon","area":"Menton","address":"29 Porte de France","lat":43.782683,"lng":7.512074,"url":"https://www.booking.com/hotel/fr/hotelnapolmenton.html","score":8.6,"count":742,"stars":4,"total":214.4,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Menton, so this is our upscale alternative: a 4-star rated 8.6/10 from 742 Booking.com reviews."}},"ierapetra-greece":{"Luxury":{"id":26834,"name":"Petra Mare","area":"Ierapetra","address":"Filotheou A' 6","lat":35.009836,"lng":25.751106,"url":"https://www.booking.com/hotel/gr/petra-mare.html","score":9.4,"count":388,"stars":4,"total":398.04,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Ierapetra, so this is our upscale alternative: a 4-star rated 9.4/10 from 388 Booking.com reviews."}},"grosseto-italy":{"Luxury":{"id":365654,"name":"Hotel Airone","area":"Grosseto","address":"Via Senese 35","lat":42.766834,"lng":11.118105,"url":"https://www.booking.com/hotel/it/airone-grosseto.html","score":8.6,"count":1026,"stars":4,"total":264.0,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Grosseto, so this is our upscale alternative: a 4-star rated 8.6/10 from 1,026 Booking.com reviews."}},"bristol-unitedkingdom":{"Luxury":{"id":6929449,"name":"Leonardo Hotel Bristol City","area":"Bristol","address":"3 Temple Way","lat":51.4538,"lng":-2.583211,"url":"https://www.booking.com/hotel/gb/leonardo-hotel-bristol-city.html","score":9.0,"count":7006,"stars":4,"total":494.12,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Bristol, so this is our upscale alternative: a 4-star rated 9.0/10 from 7,006 Booking.com reviews."}},"oban-unitedkingdom":{"Luxury":{"id":6560432,"name":"No.26 By The Sea","area":"Oban","address":"No 26 by The Sea Corran Esplanade","lat":56.421421,"lng":-5.482255,"url":"https://www.booking.com/hotel/gb/no-26-by-the-sea.html","score":9.5,"count":487,"stars":4,"total":393.86,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Oban, so this is our upscale alternative: a 4-star rated 9.5/10 from 487 Booking.com reviews."}},"whitstable-united-kingdom":{"Luxury":{"id":10447450,"name":"Duke of Cumberland","area":"Whitstable","address":"High Street","lat":51.360378,"lng":1.024129,"url":"https://www.booking.com/hotel/gb/duke-of-cumberland.html","score":8.9,"count":592,"stars":4,"total":411.77,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Whitstable, so this is our upscale alternative: a 4-star rated 8.9/10 from 592 Booking.com reviews."}},"boca-raton-united-states":{"Luxury":{"id":58151,"name":"Renaissance Boca Raton Hotel","area":"Boca Raton","address":"2000 Northwest 19th Street","lat":26.366204,"lng":-80.124184,"url":"https://www.booking.com/hotel/us/renaissance-boca-raton.html","score":8.6,"count":125,"stars":4,"total":600.8,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Boca Raton, so this is our upscale alternative: a 4-star rated 8.6/10 from 125 Booking.com reviews."}},"dalat-vietnam":{"Luxury":{"id":1561468,"name":"Swiss-Belresort Tuyen Lam","area":"Dalat","address":"Zone 7&8, Tuyen Lam Lake Tourist Area, Ward 3","lat":11.882835,"lng":108.451771,"url":"https://www.booking.com/hotel/vn/swiss-belresort-tuyen-lam.html","score":8.9,"count":256,"stars":4,"total":125.62,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Dalat, so this is our upscale alternative: a 4-star rated 8.9/10 from 256 Booking.com reviews."}},"quimper-france":{"Luxury":{"id":3411582,"name":"Hôtel Ginkgo - SPA Biloba","area":"Quimper","address":"1 rue du Chanoine Moreau","lat":47.98837,"lng":-4.111989,"url":"https://www.booking.com/hotel/fr/ginkgo.html","score":8.7,"count":543,"stars":4,"total":332.0,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Quimper, so this is our upscale alternative: a 4-star rated 8.7/10 from 543 Booking.com reviews."}},"arezzo-italy":{"Luxury":{"id":243257,"name":"Graziella Patio Hotel","area":"Arezzo","address":"Via Cavour 23","lat":43.464523,"lng":11.881523,"url":"https://www.booking.com/hotel/it/graziella-patio.html","score":8.7,"count":279,"stars":4,"total":393.08,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Arezzo, so this is our upscale alternative: a 4-star rated 8.7/10 from 279 Booking.com reviews."}},"pompei-italy":{"Luxury":{"id":7013109,"name":"HABITA79, Pompeii, a Tribute Portfolio Hotel","area":"Pompei","address":"Via Roma 10","lat":40.749527,"lng":14.498717,"url":"https://www.booking.com/hotel/it/habita79-pompeii-a-tribute-portfolio-hotel.html","score":9.1,"count":380,"stars":4,"total":402.0,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Pompei, so this is our upscale alternative: a 4-star rated 9.1/10 from 380 Booking.com reviews."}},"lugo-spain":{"Luxury":{"id":13285,"name":"Hotel Monumento Pazo de Orbán","area":"Lugo","address":"Travesía do Miño, 6","lat":43.010193,"lng":-7.560256,"url":"https://www.booking.com/hotel/es/monumento-pazo-de-orban.html","score":9.1,"count":803,"stars":4,"total":220.0,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Lugo, so this is our upscale alternative: a 4-star rated 9.1/10 from 803 Booking.com reviews."}},"boise-united-states":{"Luxury":{"id":909801,"name":"The Anniversary Inn - Boise","area":"Boise","address":"1575 South Lusk Avenue","lat":43.604001,"lng":-116.214841,"url":"https://www.booking.com/hotel/us/the-anniversary-inn-boise.html","score":8.7,"count":101,"stars":4,"total":380.45,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Boise, so this is our upscale alternative: a 4-star rated 8.7/10 from 101 Booking.com reviews."}},"carmel-united-states":{"Luxury":{"id":423881,"name":"La Playa Hotel","area":"Carmel","address":"Camino Real at Eighth Avenue","lat":36.552305,"lng":-121.926274,"url":"https://www.booking.com/hotel/us/la-playa-carmel.html","score":9.1,"count":174,"stars":4,"total":1424.48,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Carmel, so this is our upscale alternative: a 4-star rated 9.1/10 from 174 Booking.com reviews."}},"quedlinburg-germany":{"Luxury":{"id":72323,"name":"Romantik Hotel am Brühl","area":"Quedlinburg","address":"Billungstr. 11","lat":51.784172,"lng":11.137218,"url":"https://www.booking.com/hotel/de/romantik-am-bruhl.html","score":8.6,"count":802,"stars":4,"total":363.0,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Quedlinburg, so this is our upscale alternative: a 4-star rated 8.6/10 from 802 Booking.com reviews."}},"miskolc-hungary":{"Luxury":{"id":7162239,"name":"Premier Hotel Miskolc","area":"Miskolc","address":"Arany Janos tér 1 MIskolc, Arany Janos ter 1","lat":48.10773,"lng":20.787909,"url":"https://www.booking.com/hotel/hu/premier-miskolc.html","score":8.9,"count":1323,"stars":4,"total":305.05,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Miskolc, so this is our upscale alternative: a 4-star rated 8.9/10 from 1,323 Booking.com reviews."}},"den-bosch-netherlands":{"Luxury":{"id":171136,"name":"Good Seasons Hotel Den Bosch","area":"Den Bosch","address":"Kerkstraat 56","lat":51.687979,"lng":5.306792,"url":"https://www.booking.com/hotel/nl/eurohotel-den-bosch.html","score":8.5,"count":2929,"stars":4,"total":471.72,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Den Bosch, so this is our upscale alternative: a 4-star rated 8.5/10 from 2,929 Booking.com reviews."}},"chernivtsi-ukraine":{"Luxury":{"id":453381,"name":"Bukovyna Hotel","area":"Chernivtsi","address":"Golovna Street, 141","lat":48.277467,"lng":25.943356,"url":"https://www.booking.com/hotel/ua/tourist-complex-bukovyna.html","score":8.6,"count":2748,"stars":4,"total":124.64,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Chernivtsi, so this is our upscale alternative: a 4-star rated 8.6/10 from 2,748 Booking.com reviews."}},"chattanooga-united-states":{"Luxury":{"id":14064860,"name":"Embassy Suites By Hilton Chattanooga Downtown","area":"Chattanooga","address":"345 Broad Street","lat":35.052546,"lng":-85.311075,"url":"https://www.booking.com/hotel/us/embassy-suites-by-hilton-chattanooga-downtown.html","score":9.0,"count":247,"stars":4,"total":454.97,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Chattanooga, so this is our upscale alternative: a 4-star rated 9.0/10 from 247 Booking.com reviews."}},"innsbruck-austria":{"Luxury":{"id":70101,"name":"Hotel Das Innsbruck","area":"Innsbruck","address":"Innrain 3","lat":47.267913,"lng":11.391312,"url":"https://www.booking.com/hotel/at/hotelinnsbruck.html","score":9.1,"count":5270,"stars":4,"total":564.21,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Innsbruck, so this is our upscale alternative: a 4-star rated 9.1/10 from 5,270 Booking.com reviews."}},"cordoba-mexico":{"Luxury":{"id":5442760,"name":"Hotel Boutique Casa Zevallos","area":"Cordoba","address":"101 Avenida 1 101, planta alta","lat":18.894549,"lng":-96.934654,"url":"https://www.booking.com/hotel/mx/casa-zevallos.html","score":9.5,"count":117,"stars":4,"total":262.27,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Cordoba, so this is our upscale alternative: a 4-star rated 9.5/10 from 117 Booking.com reviews."}},"kosice-slovakia":{"Luxury":{"id":43539,"name":"Hotel Yasmin Košice","area":"Kosice","address":"Tyršovo Nábrežie 1","lat":48.729583,"lng":21.256995,"url":"https://www.booking.com/hotel/sk/yasmin-kosice.html","score":8.6,"count":812,"stars":4,"total":356.0,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Kosice, so this is our upscale alternative: a 4-star rated 8.6/10 from 812 Booking.com reviews."}},"malmo-sweden":{"Luxury":{"id":15253709,"name":"Home Hotel Baltzar","area":"Malmö","address":"Baltzarsgatan 43","lat":55.604686,"lng":13.00192,"url":"https://www.booking.com/hotel/se/home-baltzar.html","score":9.0,"count":175,"stars":4,"total":387.02,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Malmö, so this is our upscale alternative: a 4-star rated 9.0/10 from 175 Booking.com reviews."}},"klagenfurt-austria":{"Luxury":{"id":70529,"name":"Hotel Dermuth Klagenfurt","area":"Klagenfurt","address":"Kohldorfer Straße 52","lat":46.624714,"lng":14.274703,"url":"https://www.booking.com/hotel/at/restaurant-dermuth.html","score":8.8,"count":1456,"stars":4,"total":324.0,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Klagenfurt, so this is our upscale alternative: a 4-star rated 8.8/10 from 1,456 Booking.com reviews."}},"bauru-brazil":{"Luxury":{"id":1116429,"name":"Blue Tree Towers Bauru","area":"Bauru","address":"Rua Julio de Mesquita Filho, 1036","lat":-22.337173,"lng":-49.051527,"url":"https://www.booking.com/hotel/br/blue-tree-towers-bauru.html","score":8.8,"count":1800,"stars":4,"total":152.09,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Bauru, so this is our upscale alternative: a 4-star rated 8.8/10 from 1,800 Booking.com reviews."}},"olomouc-czechia":{"Luxury":{"id":7440169,"name":"HERBARIUM boutique hotel","area":"Olomouc","address":"Dobrovského 16b","lat":49.599087,"lng":17.258571,"url":"https://www.booking.com/hotel/cz/herbarium-boutique.html","score":9.5,"count":602,"stars":4,"total":332.64,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Olomouc, so this is our upscale alternative: a 4-star rated 9.5/10 from 602 Booking.com reviews."}},"ascona-switzerland":{"Luxury":{"id":329916,"name":"Hotel Ascovilla Charming Hideway","area":"Ascona","address":"Via Albarelle 37/Via Lido 20","lat":46.150872,"lng":8.774726,"url":"https://www.booking.com/hotel/ch/ascovilla.html","score":9.2,"count":246,"stars":4,"total":522.14,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Ascona, so this is our upscale alternative: a 4-star rated 9.2/10 from 246 Booking.com reviews."}},"basingstoke-united-kingdom":{"Luxury":{"id":5641844,"name":"Village Hotel Basingstoke","area":"Basingstoke","address":"Basing View","lat":51.268084,"lng":-1.077534,"url":"https://www.booking.com/hotel/gb/village-basingstoke.html","score":8.5,"count":2554,"stars":4,"total":620.63,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Basingstoke, so this is our upscale alternative: a 4-star rated 8.5/10 from 2,554 Booking.com reviews."}},"tartu-estonia":{"Luxury":{"id":1995331,"name":"V Spa & Conference Hotel","area":"Tartu","address":"Riia 2","lat":58.376425,"lng":26.728768,"url":"https://www.booking.com/hotel/ee/v-spa-amp-conference.html","score":9.2,"count":3777,"stars":4,"total":340.0,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Tartu, so this is our upscale alternative: a 4-star rated 9.2/10 from 3,777 Booking.com reviews."}},"soria-spain":{"Luxury":{"id":9832126,"name":"Noctis Hotel","area":"Soria","address":"Paraje Calle San Marcos 13","lat":41.733817,"lng":-2.495941,"url":"https://www.booking.com/hotel/es/noctis.html","score":9.6,"count":244,"stars":4,"total":429.6,"checked":"23 Oct 2026","reason":"No eligible 5-star hotel came up in Soria, so this is our upscale alternative: a 4-star rated 9.6/10 from 244 Booking.com reviews."}}};
async function cityData(id) {
	const { packed, hx, cx, byId } = await data();
	const raw = packed.cities[id];
	if (!raw) return null;
	const city = unpack(packed, raw);
	const ov0 = overrides_default[id] ?? (id === "odense-denmark" ? { "Best Value": {"id": 22105, "name": "City Hotel Nattergalen", "area": "City centre", "address": "Hans Mules Gade 5", "lat": 55.399016, "lng": 10.394233, "url": "https://www.booking.com/hotel/dk/city-odense.html", "score": 7.9, "count": 2917, "stars": 3, "total": 255.48, "checked": "22 Oct 2026", "reason": "A central Odense hotel with a rooftop terrace, rated 7.9 from more than 2,900 Booking.com reviews, for well under the price of our upscale pick. Hosted stay: the hotel is hosting our team on 25 October 2026."} } : void 0);
	const ov = (ov0 || LUX5[id]) ? { ...(LUX5[id] ?? {}), ...(ov0 ?? {}) } : void 0;
	if (ov) city.hotels = city.hotels.map((h) => {
		const o = ov[h.category];
		if (!o) return h;
		return {
			id: o.id,
			name: o.name,
			category: h.category,
			area: o.area,
			address: o.address,
			url: null,
			coordinates: {
				latitude: o.lat,
				longitude: o.lng
			},
			gallery: [],
			booking: {
				score: o.score,
				count: o.count,
				stars: o.stars,
				url: o.url,
				checked: o.checked ?? "14 Oct 2026"
			},
			offer: {
				total: o.total,
				nightly: Math.round(o.total / 2 * 100) / 100,
				currency: "EUR",
				checkin: "2026-11-10",
				checkout: "2026-11-12",
				adults: 2
			},
			reason: o.reason,
			live: true,
			attributes: [],
			candidateCount: h.candidateCount,
			evidence: {
				shortReason: o.reason,
				reasons: [o.reason, `Guest score ${o.score.toFixed(1)}/10 from ${o.count.toLocaleString("en-US")} Booking.com reviews.`],
				highlights: [],
				tradeoffs: ["Rates change by date: confirm the final price for your dates on Booking.com."]
			},
			tag: h.tag
		};
	});
	for (const h of city.hotels ?? []) {
		if (h.gallery) h.gallery = h.gallery.filter((g) => !BLOCKED_IMG.test(g.src ?? ""));
		const e = hx[hotelKey(h)];
		if (e) h.extras = e;
		const lv = live_prices_default[id];
		const p = lv?.hotels[hotelKey(h).replace(/\.html$/, "")];
		if (lv && p?.total) {
			h.offer = {
				...h.offer ?? {},
				total: p.total,
				nightly: Math.round(p.total / 2 * 100) / 100,
				currency: "EUR",
				checkin: "2026-11-10",
				checkout: "2026-11-12",
				adults: 2
			};
			h.booking = {
				...h.booking ?? {},
				checked: fmtLive(lv.checked)
			};
			h.live = true;
			if (p.score) h.booking.score = p.score;
			if (p.count) h.booking.count = p.count;
			if (p.stars) h.booking.stars = p.stars;
		}
	}
	for (const h of city.hotels ?? []) if (typeof h.name === "string") h.name = h.name.replace(/\s+FREE PARKING[\s\S]*$/i, "").trim();
	city.extras = cx[id] ?? {};
	city.slug = byId.get(id)?.slug ?? id;
	return city;
}
var fmtLive = (d) => {
	const x = /* @__PURE__ */ new Date(d + "T12:00:00Z");
	return `${x.getUTCDate()} ${[
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec"
	][x.getUTCMonth()]} ${x.getUTCFullYear()}`;
};
/** Booking.com links go through our CJ affiliate deep link (Booking.com North America program). */
var CJ_BOOKING = (u, sid = "t3") => {
	try {
		const x = new URL(u);
		x.searchParams.delete("aid");
		x.searchParams.delete("label");
		return `https://www.anrdoezrs.net/click-101900239-17293132?sid=${encodeURIComponent(sid)}&url=${encodeURIComponent(x.toString())}`;
	} catch {
		return u;
	}
};
async function mapJson() {
	const { index } = await data();
	const mp = minprice_default;
	const rows = index.map((c) => [
		c.slug,
		c.city,
		c.country,
		c.lat,
		c.lng,
		mp[c.slug]?.[1] ?? null,
		mp[c.slug]?.[2] ?? 0
	]);
	return new Response(JSON.stringify(rows), { headers: {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "public, max-age=86400"
	} });
}
function mapPage(L) {
	const m = M[L];
	const body = `<h1>${esc(m.mapTitle)}<em>.</em></h1><p class="lead">${esc(m.mapLead)}</p><div id="wmap" role="img" aria-label="${esc(m.mapTitle)}"></div>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.css"><script src="https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.js"><\/script>
<script>(function(){var pre=${json(L === "en" ? "" : "/" + L)},FROM=${json(m.from)},OPEN=${json(m.open)};var map=new maplibregl.Map({container:'wmap',style:'https://tiles.openfreemap.org/styles/positron',center:[12,35],zoom:1.6,attributionControl:true});map.addControl(new maplibregl.NavigationControl({showCompass:false}));
fetch('/api/map.json').then(function(r){return r.json()}).then(function(rows){var fc={type:'FeatureCollection',features:rows.map(function(c){return{type:'Feature',geometry:{type:'Point',coordinates:[c[4],c[3]]},properties:{s:c[0],c:c[1],k:c[2],p:c[5]||0,l:c[6]}}})};
map.on('load',function(){map.addSource('c',{type:'geojson',data:fc});map.addLayer({id:'c',type:'circle',source:'c',paint:{'circle-radius':['interpolate',['linear'],['zoom'],1,3.5,6,7],'circle-color':['step',['get','p'],'#1f7a5a',90,'#d83b51',180,'#b8860b'],'circle-stroke-width':1,'circle-stroke-color':'#fff'}});
map.on('mouseenter','c',function(){map.getCanvas().style.cursor='pointer'});map.on('mouseleave','c',function(){map.getCanvas().style.cursor=''});
map.on('click','c',function(e){var p=e.features[0].properties,price=p.p?' · '+FROM+' '+new Intl.NumberFormat(document.documentElement.lang,{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(p.p):'';var d=document.createElement('div');d.innerHTML='<strong></strong><br><small></small><br><a></a>';d.querySelector('strong').textContent=p.c;d.querySelector('small').textContent=p.k+price;var a=d.querySelector('a');a.href=pre+'/'+p.s;a.textContent=OPEN+' →';new maplibregl.Popup({offset:8}).setLngLat(e.features[0].geometry.coordinates).setDOMContent(d).addTo(map)})})})})();<\/script>`;
	return page({
		L,
		title: `${m.mapTitle} — Top3Hotels`,
		description: m.mapLead,
		path: "/map",
		body,
		langs: true
	});
}
async function pressPage() {
	const { index } = await data();
	const mp = minprice_default;
	const priced = index.filter((c) => mp[c.slug]?.[0]).map((c) => ({
		c,
		v: mp[c.slug][0]
	}));
	const cheap = [...priced].sort((a, b) => a.v - b.v).slice(0, 10);
	const dear = [...priced].sort((a, b) => b.v - a.v).slice(0, 10);
	const countries = new Set(index.map((c) => c.country)).size;
	const row = (x, i) => `<tr><td>${i + 1}</td><td><a href="/${x.c.slug}">${esc(x.c.city)}</a></td><td>${esc(x.c.country)}</td><td>${money(x.v)}</td></tr>`;
	return page({
		L: "en",
		title: "Press & data — Top3Hotels",
		description: "Hotel price data and rankings from Top3Hotels: the cheapest and most expensive cities for a good hotel, free to quote.",
		path: "/press",
		body: `<h1>Press &amp; data<em>.</em></h1><p class="lead">Top3Hotels picks three hotels in every city: the best budget stay, the best mid-range hotel and the best upscale hotel. Free to quote with a link to top3hotels.com.</p>
<div class="stats"><div><b>${index.length.toLocaleString("en-US")}</b>destinations</div><div><b>${(index.length * 3).toLocaleString("en-US")}</b>hotel picks</div><div><b>${countries}</b>countries</div><div><b>7</b>languages</div></div>
<section><h2>The 10 cheapest cities for a good hotel</h2><p class="note">Price per night of our Budget pick, 2 adults, reference stay 10–12 November 2026, Booking.com data checked in October 2026.</p><table><thead><tr><th>#</th><th>City</th><th>Country</th><th>Per night</th></tr></thead><tbody>${cheap.map(row).join("")}</tbody></table></section>
<section><h2>The 10 most expensive cities for a budget hotel</h2><table><thead><tr><th>#</th><th>City</th><th>Country</th><th>Per night</th></tr></thead><tbody>${dear.map(row).join("")}</tbody></table></section>
<section><h2>Media kit and contact</h2><p><a class="btn" href="/top3hotels-media-kit.pdf">Download the media kit (PDF)</a> <a class="btn ghost" href="mailto:${BRAND.email}?subject=Press%20enquiry">Press enquiries</a></p><p class="note">Methodology: <a href="/how-we-choose">how we choose</a> · Commercial relationships: <a href="/affiliate-disclosure">affiliate disclosure</a>.</p></section>`
	});
}
var POSTS = blog_default;
var CSS_BLOG = `.post{max-width:760px;margin:0 auto}.post .crumbs{font-size:13px;opacity:.7;margin:8px 0 18px}.post .crumbs a{color:inherit}
.post h1{font-size:clamp(30px,5vw,46px);line-height:1.08;margin:0 0 12px}.post .dek{font-size:19px;line-height:1.5;opacity:.85;margin:0 0 14px}
.post .by{font-size:14px;opacity:.7;margin:0 0 26px}.post h2{font-size:26px;margin:38px 0 12px}.post h3{font-size:19px;margin:24px 0 6px}
.post p,.post li{font-size:17px;line-height:1.65}.post ul,.post ol{padding-left:22px}.post li{margin:4px 0}
.post .method{border-left:3px solid #d83b51;background:rgba(216,59,81,.06);padding:12px 16px;border-radius:8px;font-size:15px;line-height:1.55;margin:22px 0}
.pick{border:1px solid rgba(127,127,127,.25);border-radius:14px;padding:18px 20px;margin:18px 0}.pick-h{display:flex;flex-direction:column;gap:6px}
.pick h3{margin:0;font-size:22px}.pick .chip{align-self:flex-start;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:4px 10px;border-radius:99px;background:rgba(127,127,127,.12)}
.pick-budget .chip{color:#1f7a5a}.pick-value .chip{color:#d83b51}.pick-lux .chip{color:#b8860b}
.pick .facts{list-style:none;padding:0;margin:10px 0;display:flex;flex-wrap:wrap;gap:6px 16px}.pick .facts li{font-size:14px;margin:0;opacity:.9}
.pick .catch{font-size:15px;opacity:.9}.pick .ctas{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0 0}
.tablewrap{overflow-x:auto;-webkit-overflow-scrolling:touch}.post table{width:100%;border-collapse:collapse;font-size:15px}.post th,.post td{text-align:left;padding:8px 10px;border-bottom:1px solid rgba(127,127,127,.2);vertical-align:top}
.post td small{opacity:.65}@media(max-width:560px){.post td:nth-child(4),.post th:nth-child(4){display:none}.post th,.post td{padding:8px 6px}}.post .notes li{margin:8px 0}.post .more{margin:40px 0 0;padding:18px 0 0;border-top:1px solid rgba(127,127,127,.25)}
.glist{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));margin:24px 0}.glist a{display:block;border:1px solid rgba(127,127,127,.25);border-radius:14px;padding:18px;color:inherit;text-decoration:none}
.glist a:hover{border-color:#d83b51}.glist h2{font-size:20px;margin:6px 0 8px;line-height:1.25}.glist p{margin:0;font-size:15px;opacity:.8;line-height:1.5}.glist small{font-size:12px;text-transform:uppercase;letter-spacing:.05em;opacity:.6}`;
var fmtPostDate = (d) => (/* @__PURE__ */ new Date(d + "T12:00:00Z")).toLocaleDateString("en-GB", {
	day: "numeric",
	month: "long",
	year: "numeric"
});
var postBody = (b) => b.replace(/\{\{bk:([^}]+)\}\}/g, (_m, u) => esc(CJ_BOOKING(u, "t3guide")));
var guideFor = (slug) => POSTS.find((p) => p.city === slug);
function guidesIndex() {
	return page({
		L: "en",
		title: "Hotel guides: where to stay and how to choose — Top3Hotels",
		description: "Long-form hotel guides from Top3Hotels: where to stay in Odense, Hamburg and Copenhagen, the cheapest five-star hotels in Europe and how to choose a hotel in five minutes.",
		path: "/guides",
		body: `<style>${CSS_BLOG}</style><div class="post" style="max-width:1000px"><h1>Hotel guides<em>.</em></h1><p class="dek">Where to stay, which area to pick and where luxury is cheap. Written by people, with real prices checked on the same dates.</p>
<div class="glist">${POSTS.map((p) => `<a href="/guides/${p.slug}"><small>${esc(p.tags.join(" · "))} · ${p.mins} min read</small><h2>${esc(p.h1)}</h2><p>${esc(p.dek)}</p></a>`).join("")}</div></div>`,
		ld: [{
			"@context": "https://schema.org",
			"@type": "CollectionPage",
			name: "Top3Hotels guides",
			url: `${SITE}/guides`,
			hasPart: POSTS.map((p) => ({
				"@type": "Article",
				headline: p.title,
				url: `${SITE}/guides/${p.slug}`
			}))
		}]
	});
}
function guidePage(slug) {
	const p = POSTS.find((x) => x.slug === slug);
	if (!p) return null;
	const others = POSTS.filter((x) => x.slug !== slug).slice(0, 4);
	const body = `<style>${CSS_BLOG}</style><article class="post"><nav class="crumbs"><a href="/">Top3Hotels</a> › <a href="/guides">Guides</a></nav>
<h1>${esc(p.h1)}</h1><p class="dek">${esc(p.dek)}</p><p class="by">By ${esc(p.author)} · Updated ${fmtPostDate(p.updated)} · ${p.mins} min read</p>
${postBody(p.body)}
<p class="note" style="font-size:13px;opacity:.7;margin-top:28px">Booking links are affiliate links: if you book, we may earn a commission at no extra cost to you. It never decides which hotels we pick. <a href="/affiliate-disclosure">How we make money</a>.</p>
<div class="more"><h2 style="margin-top:0">More guides</h2><ul>${others.map((o) => `<li><a href="/guides/${o.slug}">${esc(o.h1)}</a></li>`).join("")}</ul></div></article>`;
	return page({
		L: "en",
		title: `${p.title} | Top3Hotels`,
		description: p.description,
		path: `/guides/${p.slug}`,
		body,
		ld: [{
			"@context": "https://schema.org",
			"@type": "Article",
			headline: p.title,
			description: p.description,
			datePublished: p.date,
			dateModified: p.updated,
			author: {
				"@type": "Person",
				name: p.author,
				url: `${SITE}/about`
			},
			publisher: {
				"@type": "Organization",
				name: "Top3Hotels",
				url: SITE,
				logo: {
					"@type": "ImageObject",
					url: `${SITE}/icon-512.png`
				}
			},
			mainEntityOfPage: `${SITE}/guides/${p.slug}`,
			image: `${SITE}/og.png`
		}, {
			"@context": "https://schema.org",
			"@type": "BreadcrumbList",
			itemListElement: [
				{
					"@type": "ListItem",
					position: 1,
					name: "Top3Hotels",
					item: `${SITE}/`
				},
				{
					"@type": "ListItem",
					position: 2,
					name: "Guides",
					item: `${SITE}/guides`
				},
				{
					"@type": "ListItem",
					position: 3,
					name: p.h1,
					item: `${SITE}/guides/${p.slug}`
				}
			]
		}]
	});
}
var SOCIAL_TXT = {
	en: ["From the team behind", "followers on"],
	es: ["Del equipo de", "seguidores en"],
	de: ["Vom Team hinter", "Follower auf"],
	fr: ["Par l'équipe de", "abonnés sur"],
	it: ["Dal team di", "follower su"],
	pt: ["Da equipa do", "seguidores no"],
	da: ["Fra holdet bag", "følgere på"]
};
var CSS_SOCIAL = `.t3-sp{display:flex;justify-content:center;margin:10px 0 0}.t3-social{display:inline-flex;align-items:center;gap:10px;padding:4px 14px 4px 5px;border-radius:999px;border:1px solid rgba(127,127,127,.22);background:rgba(127,127,127,.06);color:inherit!important;font-size:13px;line-height:1.25;text-decoration:none!important;max-width:100%}
.t3-social:hover{border-color:#1877f2}.t3-social .av{display:inline-flex;flex:none}.t3-social .av img{width:24px;height:24px;border-radius:50%;border:2px solid var(--bg,#fff);object-fit:cover;margin-left:-8px;background:#ddd}.t3-social .av img:first-child{margin-left:0}
.t3-social b{font-weight:700}.t3-social .fb{color:#1877f2;font-weight:600}@media(max-width:520px){.t3-social{font-size:12px;white-space:nowrap}.t3-social .pre,.t3-social .av img:nth-child(4){display:none}}header.top nav a{white-space:nowrap}@media(max-width:1380px){.hide-md{display:none!important}}`;
var socialPill = (L) => {
	const [a, b] = SOCIAL_TXT[L] ?? SOCIAL_TXT["en"];
	return `<div class="t3-sp"><a class="t3-social" href="https://www.facebook.com/happylowcostofficialpage" target="_blank" rel="noopener" data-t="social_fb"><span class="av" aria-hidden="true"><img src="/social/hlc-logo.webp" alt="" width="24" height="24"><img src="/social/hlc-1.webp" alt="" width="24" height="24" loading="lazy"><img src="/social/hlc-2.webp" alt="" width="24" height="24" loading="lazy"><img src="/social/hlc-3.webp" alt="" width="24" height="24" loading="lazy"></span><span><span class="pre">${esc(a)} </span><b>Happy Low Cost</b> · <b>420K+</b> ${esc(b)} <span class="fb">Facebook</span></span></a></div>`;
};
var esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
})[c]);
var money = (n) => n == null ? "" : new Intl.NumberFormat("en-GB", {
	style: "currency",
	currency: "EUR",
	maximumFractionDigits: 0
}).format(n);
var fmtInt = (n) => n == null ? "" : n.toLocaleString("en-US");
var range = (a, b) => {
	if (!a || !b) return "";
	const da = /* @__PURE__ */ new Date(a + "T12:00:00Z"), db = /* @__PURE__ */ new Date(b + "T12:00:00Z");
	const m = db.toLocaleDateString("en-GB", {
		month: "short",
		year: "numeric",
		timeZone: "UTC"
	});
	return `${da.getUTCDate()}–${db.getUTCDate()} ${m}`;
};
var json = (o) => JSON.stringify(o).replace(/</g, "\\u003c");
var catKey = (h) => h.category === "Budget" ? "budget" : h.category === "Best Value" ? "value" : "lux";
var label = (h, L) => h.category === "Luxury" && (h.booking?.stars ?? 5) < 5 ? T[L].cat.Upscale : T[L].cat[h.category];
var daysSince = (s) => {
	const t = Date.parse(s ?? "");
	return Number.isFinite(t) ? Math.max(0, Math.floor((Date.now() - t) / 864e5)) : 0;
};
var km = (a, b) => {
	const r = (x) => x * Math.PI / 180;
	const x = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
	return 12742 * Math.asin(Math.sqrt(x));
};
function walkText(h, sights, L) {
	if (!h.coordinates || !sights?.length) return "";
	const pos = {
		lat: h.coordinates.latitude,
		lng: h.coordinates.longitude
	};
	const best = sights.map((s) => ({
		s,
		d: km(pos, s)
	})).sort((a, b) => a.d - b.d)[0];
	const walkKm = best.d * 1.25;
	if (walkKm <= 3) return T[L].walk(Math.max(1, Math.round(walkKm / 4.8 * 60)), best.s.name);
	return T[L].km(best.d.toFixed(1), best.s.name);
}
function walkMinutes(h, sights) {
	if (!h.coordinates || !sights?.length) return null;
	const pos = {
		lat: h.coordinates.latitude,
		lng: h.coordinates.longitude
	};
	const best = sights.map((s) => ({
		s,
		d: km(pos, s)
	})).sort((a, b) => a.d - b.d)[0];
	return {
		name: best.s.name,
		min: Math.max(1, Math.round(best.d * 1.25 / 4.8 * 60))
	};
}
function bestFor(h, i, L, sights) {
	const f = X[L].forTypes;
	const tags = h.extras?.tags ?? [];
	const out = [f[[
		"budget",
		"value",
		"lux"
	][i]]];
	for (const k of [
		"family",
		"spa",
		"beach",
		"pool",
		"pets"
	]) if (tags.includes(k)) out.push(f[k]);
	const w = walkMinutes(h, sights);
	if (w && w.min <= 15) out.push(f["central"]);
	return [...new Set(out)].slice(0, 3);
}
var countryName = (c, L) => {
	if (L === "en" || !c.cc) return c.country;
	try {
		return new Intl.DisplayNames([L], { type: "region" }).of(c.cc) ?? c.country;
	} catch {
		return c.country;
	}
};
var P = (L, path) => L === "en" ? path : `/${L}${path === "/" ? "" : path}`;
function withDates(u, ci, co) {
	if (ci && co) {
		u.searchParams.set("checkin", ci);
		u.searchParams.set("checkout", co);
	}
	return u;
}
function bookingLink(h, ci, co) {
	if (!h.booking?.url) return null;
	try {
		const u = new URL(h.booking.url);
		u.searchParams.delete("checkin");
		u.searchParams.delete("checkout");
		u.searchParams.set("group_adults", "2");
		u.searchParams.set("no_rooms", "1");
		return CJ_BOOKING(withDates(u, ci, co).toString(), "t3seo");
	} catch {
		return null;
	}
}
var mapLink = (h, city) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`${h.name}, ${h.address ?? ""}, ${city.city}, ${city.country}`);
var LOGO = `<svg width="28" height="24" viewBox="0 0 28 24" aria-hidden="true"><rect x="0" y="11" width="7.5" height="13" rx="2.2" fill="#1f7a5a"/><rect x="10.25" y="0" width="7.5" height="24" rx="2.2" fill="#d83b51"/><rect x="20.5" y="5.5" width="7.5" height="18.5" rx="2.2" fill="#c9971c"/></svg>`;
var CSS = `@font-face{font-family:Fraunces;font-style:normal;font-weight:300 700;font-display:swap;src:url(/fonts/fraunces-latin.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:Fraunces;font-style:normal;font-weight:300 700;font-display:swap;src:url(/fonts/fraunces-latin-ext.woff2) format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:Inter;font-style:normal;font-weight:400 700;font-display:swap;src:url(/fonts/inter-latin.woff2) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:Inter;font-style:normal;font-weight:400 700;font-display:swap;src:url(/fonts/inter-latin-ext.woff2) format("woff2");unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:"Inter Fallback";src:local("Arial"),local("Liberation Sans"),local("Arimo"),local("Helvetica");ascent-override:90.8%;descent-override:22.61%;line-gap-override:0%;size-adjust:106.69%}@font-face{font-family:"Fraunces Fallback";src:local("Times New Roman"),local("Liberation Serif"),local("Tinos"),local("Times");ascent-override:83.81%;descent-override:21.85%;line-gap-override:0%;size-adjust:116.69%}
:root{--paper:#faf8f4;--ink:#10213a;--muted:#525d6b;--blue:#13417a;--coral:#d83b51;--line:#e6e1d8;--card:#fff;--soft:#f2eee7;--budget:#1f7a5a;--value:#d83b51;--lux:#9a6b00;--shadow:0 1px 2px #10213a0d,0 14px 40px #10213a12;--serif:Fraunces,"Fraunces Fallback",Georgia,serif;--sans:Inter,"Inter Fallback",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
@media (prefers-color-scheme:dark){.card.lux .btn,.card.lux .badge span:first-child,.tile.lux:before{color:#10213a}}
@media (prefers-color-scheme:dark){:root{--paper:#0c121b;--ink:#ecf1f7;--muted:#a8b3c1;--blue:#8db8ff;--line:#233041;--card:#131b27;--soft:#1a2432;--shadow:0 14px 40px #0008;--lux:#e0b441}}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;background:var(--paper);color:var(--ink);font:15.5px/1.62 var(--sans);-webkit-font-smoothing:antialiased}
a{color:var(--blue)}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:3px solid var(--coral);outline-offset:3px}
.wrap{width:min(1180px,calc(100% - 32px));margin:0 auto}
.top{position:sticky;top:0;z-index:40;display:flex;align-items:center;justify-content:space-between;gap:12px;height:66px;border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--paper) 88%,transparent);backdrop-filter:saturate(1.4) blur(12px);-webkit-backdrop-filter:saturate(1.4) blur(12px);margin:0 -16px;padding:0 16px}
.logo{display:inline-flex;align-items:center;gap:9px;font:600 23px/1 var(--serif);letter-spacing:-.6px;color:var(--ink);text-decoration:none}.logo em{color:var(--coral);font-style:normal}
.top nav{display:flex;gap:18px;font-size:13.5px;align-items:center;min-width:0}
.top nav a{color:var(--ink);text-decoration:none;min-height:44px;display:inline-flex;align-items:center}.top nav a:hover{color:var(--coral)}
.top nav a.cta{border:1px solid var(--line);border-radius:999px;padding:0 14px;min-height:38px;background:var(--card);font-weight:600}
.lang select{font:inherit;font-size:13px;background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:999px;padding:6px 10px;min-height:38px}
@media (max-width:480px){.top{gap:8px}.top .logo{font-size:20px}.top nav{gap:10px}.top nav>a:first-child{max-width:96px;line-height:1.15}.lang select{max-width:92px;padding:6px 4px}.top nav a.cta{display:none}}
.find{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:14px;margin:18px 0 8px;box-shadow:var(--shadow)}.find label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:600;color:var(--muted);flex:1 1 260px}.find input{font:inherit;font-size:16px;min-height:50px;border:1px solid var(--line);border-radius:12px;padding:0 14px;background:var(--paper);color:var(--ink)}.find .btn{min-height:50px}
.crumbs{font-size:12px;color:var(--muted);margin:18px 0 0}.crumbs a{color:var(--muted)}
h1,h2,h3.serif{font-family:var(--serif);font-weight:500;letter-spacing:-.025em;line-height:1.06;font-optical-sizing:auto}
h1{font-size:clamp(36px,5.4vw,62px);margin:8px 0 12px}h1 em{color:var(--coral);font-style:normal}
h2{font-size:clamp(26px,3.2vw,38px);margin:0 0 14px}
.lead{max-width:720px;color:var(--muted);font-size:17px;margin:0}
.eyebrow{font-size:11px;font-weight:600;letter-spacing:2.2px;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:8px;margin:0}.eyebrow:before{content:"";width:6px;height:6px;border-radius:50%;background:var(--coral)}
.hero{position:relative;margin:16px 0 0;border-radius:26px;overflow:hidden;min-height:clamp(300px,42vw,440px);display:flex;align-items:flex-end;background:#10213a;box-shadow:var(--shadow)}
.hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;animation:kb 18s ease-out both}
@keyframes kb{from{transform:scale(1.06)}to{transform:scale(1)}}
.hero:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,#0000 25%,#08111ecc 100%)}
.hero .in{position:relative;z-index:1;padding:30px 32px;color:#fff;width:100%}.hero .in .eyebrow{color:#e8eef6}.hero .in .lead{color:#e8eef6}
.hero h1{color:#fff;text-shadow:0 2px 24px #0006}.hero small{position:absolute;right:14px;bottom:10px;z-index:1;font-size:10px;color:#dfe7f1}.hero small a{color:#dfe7f1}
.noimg{background:linear-gradient(120deg,#13417a,#10213a)}
.byline{display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;margin:14px 2px 0;font-size:12.5px;color:var(--muted)}
.byline .ok{display:inline-flex;align-items:center;gap:6px}.byline .ok:before{content:"✓";display:inline-grid;place-items:center;width:16px;height:16px;border-radius:50%;background:#1f7a5a;color:#fff;font-size:10px;font-weight:700}
.plan{display:flex;flex-wrap:wrap;gap:10px;align-items:end;margin:18px 0 0;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:14px 16px;box-shadow:var(--shadow)}
.plan label{display:flex;flex-direction:column;font-size:11px;font-weight:600;color:var(--muted);gap:4px}
.plan input{font:inherit;border:1px solid var(--line);border-radius:12px;padding:9px 10px;min-height:46px;color:var(--ink);background:var(--paper)}
.quick{display:flex;flex-wrap:wrap;gap:6px;align-items:center;width:100%;font-size:12px;color:var(--muted)}
.quick button{font:inherit;font-size:12.5px;border:1px solid var(--line);background:var(--paper);color:var(--ink);border-radius:999px;padding:6px 12px;min-height:34px;cursor:pointer}.quick button:hover{border-color:var(--ink)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 20px;border-radius:12px;background:var(--ink);color:var(--paper);text-decoration:none;border:0;font:inherit;font-weight:600;cursor:pointer;transition:transform .15s ease,filter .15s ease}.btn:hover{filter:brightness(1.12);transform:translateY(-1px)}
.btn.coral{background:var(--coral);color:#fff}.btn.ghost{background:var(--card);color:var(--ink);border:1px solid var(--line)}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin:26px 0 8px}
.card{background:var(--card);border:1px solid var(--line);border-radius:22px;overflow:hidden;display:flex;flex-direction:column;box-shadow:var(--shadow);transition:transform .25s ease,box-shadow .25s ease;position:relative}
.card:before{content:"";position:absolute;left:0;right:0;top:0;height:4px;background:var(--c);z-index:2}
.card:hover{transform:translateY(-3px);box-shadow:0 2px 4px #10213a12,0 24px 50px #10213a1f}
.card.budget{--c:var(--budget)}.card.value{--c:var(--value)}.card.lux{--c:var(--lux)}
.media{position:relative;aspect-ratio:3/2;background:var(--soft);cursor:zoom-in;overflow:hidden}
.media img{width:100%;height:100%;object-fit:cover;display:block;animation:fade .6s ease both;transition:transform .6s ease}.card:hover .media img{transform:scale(1.03)}
@keyframes fade{from{opacity:0}to{opacity:1}}
.badge{position:absolute;left:12px;top:14px;display:flex;gap:6px;flex-wrap:wrap;z-index:2}
.badge span{font-size:10.5px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;padding:6px 10px;border-radius:999px;background:var(--c);color:#fff;box-shadow:0 2px 10px #0003}
.badge .pick{background:#fff;color:var(--value)}
.over{position:absolute;left:12px;right:12px;bottom:12px;display:flex;justify-content:space-between;align-items:flex-end;z-index:2;pointer-events:none}
.score{background:#13417a;color:#fff;font-weight:700;font-size:16px;border-radius:10px 10px 10px 3px;padding:7px 10px;box-shadow:0 4px 14px #0004}
.pricetag{background:#fffffff2;color:#10213a;border-radius:12px;padding:7px 12px;font:600 22px/1 var(--serif);letter-spacing:-.3px;box-shadow:0 4px 14px #0003}.pricetag small{font:500 12px var(--sans);color:#525d6b}
.cityphoto{position:absolute;right:10px;top:14px;z-index:2;font-size:10px;background:#000a;color:#fff;border-radius:6px;padding:3px 6px}
.nophoto{display:flex;align-items:center;justify-content:center;height:100%;font:400 34px var(--serif);color:var(--muted)}
.body{padding:18px 20px 20px;display:flex;flex-direction:column;gap:10px;flex:1}
.hname{font:600 21px/1.2 var(--serif);letter-spacing:-.3px;margin:0}
.meta{font-size:13px;color:var(--muted);display:flex;flex-wrap:wrap;gap:4px 10px}.stars{color:#b87737;letter-spacing:1px}
.trust{font-size:12px;color:var(--muted);display:flex;flex-wrap:wrap;gap:4px 12px}.trust b{color:var(--ink)}
.bestfor{font-size:13px;margin:0;color:var(--ink)}.bestfor b{font-size:10.5px;letter-spacing:.8px;text-transform:uppercase;color:var(--muted);margin-right:6px}
.pc{list-style:none;padding:0;margin:0;display:grid;gap:6px;font-size:13.5px}
.pc li{padding-left:22px;position:relative}.pc li:before{position:absolute;left:0;top:0;font-weight:800}
.pc .pro:before{content:"+";color:var(--budget)}.pc .con:before{content:"–";color:var(--coral)}
.pc small{display:block;color:var(--muted);font-size:10.5px;letter-spacing:.8px;text-transform:uppercase;margin-bottom:2px}
.chips{display:flex;flex-wrap:wrap;gap:6px;padding:0;margin:0;list-style:none}.chips li{font-size:12px;background:var(--soft);border-radius:999px;padding:4px 10px;color:var(--ink)}
.price{display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid var(--line);padding-top:12px;margin-top:auto;font-size:12px;color:var(--muted)}
.card .btn{width:100%;background:var(--c);color:#fff}
.cmp{display:flex;flex-wrap:wrap;gap:6px 10px;font-size:12.5px}.cmp span{color:var(--muted)}
details{border-top:1px solid var(--line);padding-top:8px;font-size:13px}summary{cursor:pointer;font-weight:600;min-height:32px}
details ul{padding-left:18px;color:var(--muted);margin:6px 0 0}
.note{font-size:12px;color:var(--muted);margin:6px 0 0}
section{margin:52px 0}
.sharebar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:18px 0 0;font-size:13px;color:var(--muted)}
.sharebar a,.sharebar button{font:inherit;font-size:13px;display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:999px;padding:7px 14px;min-height:38px;text-decoration:none;cursor:pointer}
.areas{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.area{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:18px;border-left:4px solid var(--c)}.area h3{font:600 19px/1.2 var(--serif);margin:4px 0 6px}.area p{margin:0;font-size:13.5px;color:var(--muted)}
.area.budget{--c:var(--budget)}.area.value{--c:var(--value)}.area.lux{--c:var(--lux)}
.sources{font-size:12.5px;color:var(--muted);border:1px dashed var(--line);border-radius:14px;padding:14px 16px}
.forhotels{background:var(--soft);border-radius:18px;padding:18px 20px}.forhotels code{display:block;white-space:pre-wrap;word-break:break-all;font-size:11.5px;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px;margin:8px 0 14px;color:var(--ink)}
#map{height:400px;border-radius:20px;border:1px solid var(--line);background:var(--soft)}
.legend{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--muted);margin-top:8px}.legend i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px;vertical-align:-1px}
table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;font-size:14px}
th,td{padding:12px 14px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}th{background:var(--soft);font-size:11.5px;letter-spacing:.6px;text-transform:uppercase}
.tablewrap{overflow-x:auto;border-radius:16px}
.faq dt{font-weight:600;margin:18px 0 4px;font-family:var(--serif);font-size:18px}.faq dd{margin:0;color:var(--muted)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px 18px;padding:0;margin:0;list-style:none}
.grid a{display:flex;justify-content:space-between;gap:8px;padding:10px 0;border-bottom:1px solid var(--line);text-decoration:none;color:var(--ink)}.grid a:hover{color:var(--coral)}.grid a span{color:var(--muted);font-size:13px}
.countries h2{font:600 15px/1.3 var(--sans);margin:22px 0 6px;letter-spacing:0}
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px;margin-top:20px}
.tile{display:flex;flex-direction:column;background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;text-decoration:none;color:var(--ink);position:relative;box-shadow:var(--shadow);transition:transform .25s ease}.tile:hover{transform:translateY(-3px)}
.tile:before{content:"";position:absolute;left:0;right:0;top:0;height:4px;background:var(--c)}
.tile.budget{--c:var(--budget)}.tile.value{--c:var(--value)}.tile.lux{--c:var(--lux)}
.tile img{width:100%;aspect-ratio:16/10;object-fit:cover;background:var(--soft)}.tile div{padding:13px 15px;font-size:13px;color:var(--muted)}.tile strong{display:block;color:var(--ink);font:600 17px/1.25 var(--serif);margin-bottom:3px}
.prose{max-width:760px}.prose h2{font-size:28px;margin:34px 0 10px}.prose p,.prose li{color:var(--ink);font-size:16px}.prose .muted{color:var(--muted)}
.pillars{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin:24px 0}.pillar{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:20px;box-shadow:var(--shadow)}.pillar b{display:block;font:600 30px/1 var(--serif);color:var(--coral);margin-bottom:6px}.pillar span{font-size:14px;color:var(--muted)}
footer{border-top:1px solid var(--line);margin-top:64px;padding:34px 0 44px;font-size:13px;color:var(--muted)}
footer .cols{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:24px}footer h3{font:600 12px/1 var(--sans);letter-spacing:1.2px;text-transform:uppercase;color:var(--ink);margin:4px 0 12px}footer ul{list-style:none;padding:0;margin:0;display:grid;gap:7px}
footer a{color:var(--muted);text-decoration:none}footer a:hover{color:var(--coral)}footer .fine{margin-top:26px;padding-top:16px;border-top:1px solid var(--line);font-size:12px;display:flex;flex-wrap:wrap;gap:8px 20px;justify-content:space-between}
@media (max-width:760px){footer .cols{grid-template-columns:1fr 1fr}footer .cols>div:first-child{grid-column:1/-1}.areas{grid-template-columns:1fr}}
.reveal{opacity:0;transform:translateY(14px);transition:opacity .7s ease,transform .7s ease}.reveal.in{opacity:1;transform:none}
.lb{position:fixed;inset:0;z-index:100;background:#05090fe6;display:flex;align-items:center;justify-content:center;padding:20px;cursor:zoom-out}.lb img{max-width:100%;max-height:100%;border-radius:12px;box-shadow:0 20px 60px #000}
.sticky{display:none}
@media (max-width:900px){.cards{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:14px;padding-bottom:6px;margin-right:-16px;scrollbar-width:none}.cards::-webkit-scrollbar{display:none}.card{flex:0 0 86%;scroll-snap-align:start}.top nav a.hide-sm{display:none}
.sticky{display:flex;position:fixed;left:12px;right:12px;bottom:12px;z-index:50;gap:8px}.sticky a{flex:1;min-height:50px;font-size:14px;border-radius:14px;box-shadow:0 8px 24px #0004}.hero .in{padding:22px 20px}}
@media print{.top,.sticky,.sharebar,footer,.plan{display:none!important}body{background:#fff;color:#000}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;scroll-behavior:auto!important;transition:none!important}.reveal{opacity:1;transform:none}}`;
var GLOBAL_JS = `(function(){var io='IntersectionObserver' in window?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'}):null;document.querySelectorAll('main>section,.tiles,.areas').forEach(function(el){if(io){el.classList.add('reveal');io.observe(el)}});
document.addEventListener('click',function(ev){
var c=ev.target.closest&&ev.target.closest('[data-copy]');if(c){ev.preventDefault();var u=c.getAttribute('data-copy');(navigator.share&&matchMedia('(pointer:coarse)').matches?navigator.share({url:u,title:document.title}).catch(function(){}):navigator.clipboard.writeText(u).then(function(){c.textContent=c.getAttribute('data-done')}))}
var q=ev.target.closest&&ev.target.closest('[data-quick]');if(q){ev.preventDefault();var f=q.closest('form'),n=+q.getAttribute('data-quick'),d0=new Date(),a,b;if(n<0){var add=(5-d0.getDay()+7)%7+(n===-2?7:0);a=new Date(d0.getTime()+add*864e5);b=new Date(a.getTime()+2*864e5)}else{a=new Date(d0.getTime()+n*864e5);b=new Date(a.getTime()+2*864e5)}var iso=function(x){return x.toISOString().slice(0,10)};f.querySelector('[name=checkin]').value=iso(a);f.querySelector('[name=checkout]').value=iso(b)}})})();`;
function page(o) {
	const t = T[o.L];
	const url = SITE + P(o.L, o.path);
	const image = o.image ?? `https://www.top3hotels.com/og.png`;
	const alt = o.langs ? LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE}${P(l, o.path)}">`).join("") + `<link rel="alternate" hreflang="x-default" href="${SITE}${o.path}">` : o.alts ? o.alts.map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE}${P(l, o.path)}">`).join("") + `<link rel="alternate" hreflang="x-default" href="${SITE}${o.path}">` : "";
	const langSel = o.langs ? `<label class="lang"><span class="sr" hidden>Language</span><select aria-label="Language" onchange="location.href=this.value">${LANGS.map((l) => `<option value="${P(l, o.path)}"${l === o.L ? " selected" : ""}>${T[l].name}</option>`).join("")}</select></label>` : "";
	return `<!doctype html><html lang="${t.htmlLang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(o.title)}</title><meta name="description" content="${esc(o.description)}">
${o.noindex ? "<meta name=\"robots\" content=\"noindex,follow\">" : `<link rel="canonical" href="${esc(url)}"><meta name="robots" content="index,follow,max-image-preview:large">`}${alt}
<meta property="og:site_name" content="Top3Hotels"><meta property="og:type" content="website"><meta property="og:url" content="${esc(url)}"><meta property="og:title" content="${esc(o.title)}"><meta property="og:description" content="${esc(o.description)}"><meta property="og:image" content="${esc(image)}"><meta property="og:locale" content="${t.htmlLang}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(o.title)}"><meta name="twitter:description" content="${esc(o.description)}"><meta name="twitter:image" content="${esc(image)}">
<meta name="theme-color" content="#f7f8fa" media="(prefers-color-scheme: light)"><meta name="theme-color" content="#0e1520" media="(prefers-color-scheme: dark)"><meta name="color-scheme" content="light dark"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" href="/icon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<style>${CSS}
${CSS_PLUS}
${CSS_TRUST}${CSS_ALT}
${CSS_MORE}
${CSS_SOCIAL}
${CSS_DP}</style><link rel="manifest" href="/manifest.webmanifest">
${(o.ld ?? []).map((x) => `<script type="application/ld+json">${json(x)}<\/script>`).join("")}
<script>window.t3track=function(e,p){try{(window.dataLayer=window.dataLayer||[]).push(Object.assign({event:e},p||{}));if(window.gtag)gtag('event',e,p||{});if(window.plausible)plausible(e,{props:p||{}})}catch(_){}};document.addEventListener('click',function(ev){var a=ev.target.closest&&ev.target.closest('[data-t]');if(a)t3track(a.dataset.t,{city:a.dataset.city,category:a.dataset.cat,provider:a.dataset.p})});<\/script>
${consentScript(Z[o.L])}</head><body><div class="wrap">
<header class="top"><a class="logo" href="${P(o.L, "/")}">${LOGO}<span>top3hotels<em>.</em></span></a><nav aria-label="Main"><a href="${P(o.L, "/destinations")}">${t.allDest}</a><a class="hide-sm" href="${P(o.L, "/lists")}">${t.lists}</a><a class="hide-sm" href="/guides">Guides</a><a class="hide-sm" href="/how-we-choose">${t.how}</a><a class="hide-sm hide-md" href="${P(o.L, "/map")}">🗺 ${esc(M[o.L].map)}</a><a class="hide-sm hide-md" href="/affiliate-disclosure">${esc(M[o.L].money)}</a><a class="cta" href="/partners">${X[o.L].forHotels}</a><button type="button" class="tbtn" data-pal aria-label="${esc(Y[o.L].js["search"])}">🔍 <span class="lbl">${esc(Y[o.L].js["search"])}</span> <kbd>/</kbd></button><a class="tbtn" href="${P(o.L, "/saved")}" aria-label="${esc(Y[o.L].js["saved"])}">♡<span class="n" data-savedn hidden></span></a>${langSel}</nav></header>
${socialPill(o.L)}<main>${o.body}</main>
<footer><div class="cols"><div><a class="logo" href="${P(o.L, "/")}" style="font-size:20px">${LOGO}<span>top3hotels<em>.</em></span></a><p style="max-width:340px;margin:12px 0 0">${t.footer} ${X[o.L].independent} · ${X[o.L].noPaid}.</p></div>
<div><h3>${X[o.L].explore}</h3><ul><li><a href="${P(o.L, "/destinations")}">${t.allDest}</a></li><li><a href="${P(o.L, "/lists")}">${t.lists}</a></li><li><a href="${P(o.L, "/from/billund")}">✈ Billund</a></li><li><a href="${P(o.L, "/from/aalborg")}">✈ Aalborg</a></li><li><a href="${P(o.L, "/from/aarhus")}">✈ Aarhus</a></li><li><a href="${P(o.L, "/cheap-cities")}">${esc(Y[o.L].cheapNav)}</a></li><li><a href="${P(o.L, "/map")}">🗺 ${esc(M[o.L].map)}</a></li><li><a href="/random">🎲 ${esc(Y[o.L].js["surprise"])}</a></li><li><a href="/press">Press &amp; data</a></li><li><a href="/guides">Guides</a></li></ul></div>
<div><h3>${X[o.L].company}</h3><ul><li><a href="/about">${X[o.L].about}</a></li><li><a href="/how-we-choose">${t.how}</a></li><li><a href="/partners">${X[o.L].forHotels}</a></li><li><a href="/contact">${X[o.L].contact}</a></li></ul></div>
<div><h3>${X[o.L].legal}</h3><ul><li><a href="/privacy">${X[o.L].privacy}</a></li><li><a href="/cookies">${X[o.L].cookies}</a></li><li><a href="/terms">${X[o.L].terms}</a></li><li><a href="/imprint">${X[o.L].imprint}</a></li><li><a href="/affiliate-disclosure">Affiliate disclosure</a></li><li><a href="/sitemap.xml">Sitemap</a></li></ul></div></div>
<div class="fine"><span>© 2026 Top3Hotels · ${BRAND.entity} (${BRAND.place})</span><span>${t.disclaimer}</span></div></footer>
</div>${o.scripts ?? ""}<script>window.T3L=${json(o.L)};window.T3S=${json(Y[o.L].js)};${GLOBAL_JS}
${JS_PLUS}
window.T3V=${json(M[o.L].voice)};${JS_MORE}<\/script><script>${JS_DP}<\/script></body></html>`;
}
var html = (body, status = 200, cache = "public, max-age=600, s-maxage=86400") => new Response(body, {
	status,
	headers: {
		"content-type": "text/html; charset=utf-8",
		"cache-control": cache
	}
});
var ALT_TXT = {
	en: "Sold out on your dates? See the best available alternatives",
	es: "¿Sin disponibilidad en tus fechas? Ver alternativas disponibles",
	de: "An deinen Daten ausgebucht? Beste verfügbare Alternativen ansehen",
	fr: "Complet à vos dates ? Voir les meilleures alternatives disponibles",
	it: "Tutto esaurito nelle tue date? Vedi le migliori alternative disponibili",
	pt: "Esgotado nas suas datas? Ver as melhores alternativas disponíveis",
	da: "Udsolgt på dine datoer? Se de bedste ledige alternativer"
};
function altSearch(k, nightly, stars, city) {
	const u = new URL("https://www.booking.com/searchresults.html");
	u.searchParams.set("ss", `${city.city}, ${city.country}`);
	u.searchParams.set("group_adults", "2");
	u.searchParams.set("no_rooms", "1");
	u.searchParams.set("group_children", "0");
	u.searchParams.set("order", "bayesian_review_score");
	const n = nightly && nightly > 0 ? nightly : 0;
	let f = "";
	if (k === "budget") f = `review_score=80${n ? `;price=EUR-0-${Math.ceil(n * 1.3)}-1` : ""}`;
	else if (k === "value") f = `review_score=80${n ? `;price=EUR-${Math.floor(n * .7)}-${Math.ceil(n * 1.35)}-1` : ""}`;
	else f = `review_score=80;class=5${(stars ?? 5) < 5 ? ";class=4" : ""}`;
	u.searchParams.set("nflt", f);
	return CJ_BOOKING(u.toString(), "t3alt");
}
var CSS_ALT = `.alt{display:block;margin:8px 0 0;font-size:13px;text-align:center;color:var(--muted);text-decoration:underline;text-underline-offset:3px}.alt:hover{color:inherit}`;
function card(h, city, i, L, sights, cityImg, review) {
	const t = T[L];
	const b = h.booking ?? {}, o = h.offer ?? {}, ex = h.extras ?? {};
	const img = h.gallery?.find((g) => g.src)?.src;
	const k = catKey(h);
	const link = bookingLink(h);
	const walk = walkText(h, sights, L);
	const tags = (ex.tags ?? []).filter((x) => x !== "ac" && x !== "gym").slice(0, 5);
	const cmp = [];
	const gal = (h.gallery ?? []).map((g) => g.src).filter(Boolean).slice(0, 10);
	const fav = {
		k: `${city.slug}/${k}`,
		s: city.slug,
		c: city.city,
		cat: k,
		n: h.name,
		lbl: label(h, L),
		img: img ?? "",
		p: `${b.score ? b.score.toFixed(1) + "/10 · " : ""}${money(o.nightly)} ${t.perNight}`
	};
	const y = Y[L];
	const why = [
		b.score && b.count ? y.whyScore(b.score.toFixed(1), fmtInt(b.count)) : "",
		walk,
		h.candidateCount ? y.whyFrom(h.candidateCount) : ""
	].filter(Boolean);
	return `<article class="card ${k}" id="${k}">
<div class="media"${gal.length ? ` data-gallery="${esc(JSON.stringify(gal))}"` : ""}><div class="acts"><button type="button" data-fav="${esc(JSON.stringify(fav))}" aria-pressed="false" aria-label="${esc(y.js["save"])}">♡</button><button type="button" data-sharecard="${esc(`${SITE}${P(L, "/" + city.slug)}#${k}`)}" data-title="${esc(`${label(h, L)}: ${h.name} · ${city.city}`)}" aria-label="${esc(y.js["share"])}">↗</button></div>${img ? `<img src="${esc(img)}" alt="${esc(h.name)}, ${esc(city.city)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">` : cityImg ? `<img src="${esc(cityImg)}" alt="${esc(city.city)}" loading="lazy"><span class="cityphoto">${esc(t.cityPhoto)}</span>` : `<div class="nophoto">${esc(h.name.slice(0, 1))}</div>`}
<div class="badge"><span><i class="ico" aria-hidden="true">${k === "budget" ? "€" : k === "value" ? "★" : "♛"}</i>${esc(label(h, L))}</span>${i === 1 ? `<span class="pick">★ ${esc(t.ourPick)}</span>` : ""}${h.deal ? `<span class="pick deal">🔥 ${esc(M[L].deal)}</span>` : ""}</div>
<div class="over">${b.score ? `<span class="ring" style="--p:${Math.round(b.score * 10)}" title="Booking.com ${b.score.toFixed(1)}/10"><b>${b.score.toFixed(1)}</b></span>` : "<span></span>"}<span class="pricetag" data-eur="${o.nightly ?? ""}" title="${esc(y.priceRef(fmtDate(SNAPSHOT_DATE, L)))}"><span class="v">${money(o.nightly)}</span><small> ${esc(t.perNight)}</small></span></div></div>
<div class="body"><h2 class="hname">${esc(h.name)}</h2>
<div class="meta">${b.stars ? `<span class="stars" aria-label="${b.stars} stars">${"★".repeat(b.stars)}</span>` : ""}<span>${esc(h.area ?? city.city)}</span></div>
<p class="bestfor"><b>${esc(X[L].bestFor)}</b>${esc(bestFor(h, i, L, sights).join(" · "))}</p>
${why.length ? `<ul class="why">${why.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>` : ""}
<div class="trust"><span><b>${fmtInt(b.count)}</b> Booking.com ${esc(t.reviews)}</span>${ex.loc ? `<span>${esc(t.location)} <b>${ex.loc}</b></span>` : ""}${h.live ? `<span class="live">${esc(M[L].live(b.checked ?? ""))}</span>` : `<span>${esc(t.checked(daysSince(b.checked)))}</span>`}</div>
${ex.pros?.length ? `<ul class="pc"><li class="pro"><small>${esc(t.guestsSay)}</small>${esc(ex.pros[0])}</li>${ex.cons?.[0] ? `<li class="con">${esc(ex.cons[0])}</li>` : ""}</ul>` : `<p style="margin:0;font-size:14px">${esc(h.evidence?.shortReason ?? h.reason ?? "")}</p>`}
${tags.length ? `<ul class="chips">${tags.map((x) => `<li>${esc(t.tags[x] ?? x)}</li>`).join("")}</ul>` : ""}
<div class="price"><span>${esc(t.refRate)} · ${esc(range(o.checkin, o.checkout))} · 2 adults</span><span class="total" data-total="${o.nightly ?? ""}" hidden></span></div>
${link ? `<a class="btn" href="${esc(link)}" rel="sponsored nofollow noopener" target="_blank" data-t="check_availability" data-city="${esc(city.slug)}" data-cat="${k}" data-p="booking">${esc(t.checkPrice)} ↗</a><p class="disc">${esc(Z[L].disc)}</p><a class="alt" href="${esc(altSearch(k, o.nightly, b.stars, city))}" rel="sponsored nofollow noopener" target="_blank" data-t="alt_click" data-city="${esc(city.slug)}" data-cat="${k}" data-p="booking-alt">${esc(ALT_TXT[L])} →</a>` : ""}
${review ? `<a class="alt" href="${esc(review)}" data-t="review_click" data-city="${esc(city.slug)}" data-cat="${k}">${esc(L === "es" ? "Leer el análisis completo" : L === "en" ? "Read the full review" : "Full review (English)")} →</a>` : ""}
<div class="cmp">${cmp.map(([n, u]) => `<a href="${esc(u)}" rel="nofollow noopener" target="_blank" data-t="compare_click" data-city="${esc(city.slug)}" data-cat="${k}" data-p="${esc(n)}">${esc(n)}</a>`).join("")}<a href="${esc(mapLink(h, city))}" rel="noopener nofollow" target="_blank">${esc(t.map)} ↗</a><a class="report" href="mailto:${BRAND.email}?subject=${encodeURIComponent(`Correction: ${h.name} (${city.city})`)}">${esc(M[L].report)}</a></div>
${h.evidence?.reasons?.length ? `<details><summary>${esc(t.why(label(h, L)))}</summary><ul>${h.evidence.reasons.slice(0, 4).map((r) => `<li>${esc(r)}</li>`).join("")}</ul></details>` : ""}
</div></article>`;
}
function mapScript(hs, sights) {
	const pts = hs.filter((h) => h.coordinates).map((h, i) => ({
		n: i + 1,
		name: h.name,
		lat: h.coordinates.latitude,
		lng: h.coordinates.longitude,
		c: [
			"#1f7a5a",
			"#d83b51",
			"#b8860b"
		][i]
	}));
	const ss = (sights ?? []).map((s) => ({
		name: s.name,
		lat: s.lat,
		lng: s.lng
	}));
	return `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.css" media="print" onload="this.media='all'">
<script>(function(){var P=${json(pts)},S=${json(ss)},el=document.getElementById('map');if(!el)return;var go=function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.js';s.onload=function(){var dark=matchMedia('(prefers-color-scheme: dark)').matches;var m=new maplibregl.Map({container:el,style:'https://tiles.openfreemap.org/styles/'+(dark?'dark':'positron'),center:[P[0].lng,P[0].lat],zoom:12,attributionControl:{compact:true},cooperativeGestures:true});m.addControl(new maplibregl.NavigationControl({showCompass:false}));var b=new maplibregl.LngLatBounds();P.forEach(function(p){var d=document.createElement('div');d.style.cssText='width:30px;height:30px;border-radius:50%;background:'+p.c+';color:#fff;font:700 14px system-ui;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 3px 10px #0005';d.textContent=p.n;new maplibregl.Marker({element:d}).setLngLat([p.lng,p.lat]).setPopup(new maplibregl.Popup({offset:18}).setText(p.name)).addTo(m);b.extend([p.lng,p.lat])});var cx=P.reduce(function(t,p){return t+p.lng},0)/P.length,cy=P.reduce(function(t,p){return t+p.lat},0)/P.length;S.forEach(function(p){var d=document.createElement('div');d.style.cssText='width:12px;height:12px;border-radius:50%;background:#46566a;border:2px solid #fff';new maplibregl.Marker({element:d}).setLngLat([p.lng,p.lat]).setPopup(new maplibregl.Popup({offset:10}).setText(p.name)).addTo(m);var dk=Math.hypot((p.lng-cx)*Math.cos(cy*Math.PI/180),p.lat-cy)*111;if(dk<=3)b.extend([p.lng,p.lat])});m.fitBounds(b,{padding:50,maxZoom:15,duration:0})};document.head.appendChild(s)};if('IntersectionObserver' in window){var io=new IntersectionObserver(function(e){if(e[0].isIntersecting){io.disconnect();go()}},{rootMargin:'300px'});io.observe(el)}else go()})();<\/script>`;
}
async function cityPage(city, L) {
	const hpLive = new Set((await hotelPagesList()).map((x) => x.slug));
	const cd = await cityData(city.id);
	if (!cd || cd.hotels?.length !== 3) return null;
	const t = T[L];
	const hs = cd.hotels;
	const [budget, value, lux] = hs;
	if ((value.offer?.nightly ?? 0) > (lux.offer?.nightly ?? Infinity)) lux.deal = true;
	const sights = cd.extras?.sights;
	const hero = cd.extras?.hero;
	const { bySlug, byCountry } = await data();
	const o0 = budget.offer ?? {};
	const sample = budget.candidateCount;
	const cname = countryName(city, L);
	const title = t.title(city.city);
	const description = t.desc(city.city, cname, budget.name, value.name, lux.name);
	const areas = [...new Set(hs.map((h) => h.area).filter(Boolean))].join(", ");
	const dates = range(o0.checkin, o0.checkout);
	const checked = t.checked(daysSince(budget.booking?.checked)).toLowerCase();
	const ans = (h) => `${h.name}${h.area ? ` (${h.area})` : ""}: ${h.booking?.score ?? "–"}/10 · ${fmtInt(h.booking?.count)} ${t.reviews} · ${money(h.offer?.nightly)} ${t.perNight}${h.extras?.pros?.[0] ? ` · ${t.guestsSay}: “${h.extras.pros[0]}”` : ""}`;
	const faq = [
		[t.faq.budget(city.city), ans(budget)],
		[t.faq.value(city.city), ans(value)],
		[t.faq.lux(city.city), ans(lux)],
		[t.faq.where(city.city), t.faq.whereA(areas || city.city)],
		[t.faq.live, t.faq.liveA(dates, `${{
			en: "on",
			es: "el",
			de: "am",
			fr: "le",
			it: "il",
			pt: "em",
			da: "den"
		}[L]} ${fmtDate(budget.booking?.checked || SNAPSHOT_DATE, L)}`)]
	];
	const xt = X[L];
	const updated = fmtDate(SNAPSHOT_DATE, L);
	const areaBlock = `<section aria-labelledby="where"><h2 id="where">${esc(xt.whereStay(city.city))}</h2><p class="lead" style="margin-bottom:18px">${esc(new Set(hs.map((h) => h.area)).size === 1 && hs[0].area ? xt.whereSame(hs[0].area) : xt.whereLead)}</p><div class="areas">${hs.map((h, i) => {
		const w = walkMinutes(h, sights);
		const wt = walkText(h, sights, L);
		return `<div class="area ${catKey(h)}"><p class="eyebrow">${esc(label(h, L))}</p><h3>${esc(h.area || city.city)}</h3><p><a href="#${catKey(h)}">${esc(h.name)}</a>${wt ? ` · ${esc(wt)}` : ""}</p><p style="margin-top:6px">${esc(xt.bestFor)}: ${esc(bestFor(h, i, L, sights).join(", "))}${w ? "" : ""}</p></div>`;
	}).join("")}</div></section>`;
	const near = city.near.map((s) => bySlug.get(s)).filter(Boolean);
	const y = Y[L];
	const aps = Object.entries(await airports()).filter(([, a]) => a.dest.some(([id]) => id === city.id));
	const flights = aps.length ? `<p class="flights"><span>✈ ${esc(y.flights)}</span>${aps.map(([k, a]) => `<a href="${P(L, `/from/${k}`)}">${esc(a.name)} (${esc(a.iata)})</a>`).join("")}</p>` : "";
	const in1 = `<p class="in1h">${esc(y.in1)}</p><div class="in1">${hs.map((h) => `<a class="${catKey(h)}" href="#${catKey(h)}"><small>${esc(label(h, L))}</small><strong>${esc(h.name)}</strong><span>${h.booking?.score ? h.booking.score.toFixed(1) + "/10 · " : ""}<span data-eur="${h.offer?.nightly ?? ""}"><span class="v">${money(h.offer?.nightly)}</span></span> ${esc(t.perNight)}</span></a>`).join("")}</div>`;
	const jump = `<nav class="jump" aria-label="${esc(y.jHotels)}"><a href="#hotels">${esc(y.jHotels)}</a><a href="#where">${esc(y.jWhere)}</a><a href="#maph">${esc(y.jMap)}</a><a href="#cmp">${esc(y.jCompare)}</a><a href="#faq">${esc(y.jFaq)}</a></nav>`;
	const curSel = `<label>${esc(y.currency)}<select data-cur aria-label="${esc(y.currency)}">${[
		"EUR",
		"GBP",
		"USD",
		"DKK",
		"SEK",
		"NOK",
		"CHF"
	].map((c) => `<option>${c}</option>`).join("")}</select></label>`;
	const guestSel = `<label>${esc(y.guests)}<select name="adults">${[
		1,
		2,
		3,
		4,
		5,
		6
	].map((n) => `<option${n === 2 ? " selected" : ""}>${n}</option>`).join("")}</select></label><label>${esc(y.rooms)}<select name="rooms">${[
		1,
		2,
		3,
		4
	].map((n) => `<option>${n}</option>`).join("")}</select></label>`;
	const embed = `<iframe src="${SITE}/embed/${city.slug}" width="100%" height="420" style="border:0;border-radius:16px;max-width:720px" loading="lazy" title="Top 3 hotels in ${city.city} · Top3Hotels"></iframe>`;
	const same = (byCountry.get(city.cslug) ?? []).filter((c) => c.slug !== city.slug).slice(0, 24);
	const path = `/${city.slug}`;
	const image = hero?.img ?? hs.find((h) => h.gallery?.[0]?.src)?.gallery?.[0]?.src;
	const ld = [
		{
			"@context": "https://schema.org",
			"@type": "BreadcrumbList",
			itemListElement: [
				{
					"@type": "ListItem",
					position: 1,
					name: "Top3Hotels",
					item: SITE + P(L, "/")
				},
				{
					"@type": "ListItem",
					position: 2,
					name: cname,
					item: `${SITE}${P(L, `/country/${city.cslug}`)}`
				},
				{
					"@type": "ListItem",
					position: 3,
					name: city.city,
					item: SITE + P(L, path)
				}
			]
		},
		{
			"@context": "https://schema.org",
			"@type": "ItemList",
			name: t.h1(city.city),
			dateModified: SNAPSHOT_DATE,
			author: {
				"@type": "Organization",
				name: "Top3Hotels",
				url: SITE
			},
			numberOfItems: 3,
			itemListElement: hs.map((h, i) => ({
				"@type": "ListItem",
				position: i + 1,
				name: `${label(h, L)}: ${h.name}`,
				item: {
					"@type": "Hotel",
					name: h.name,
					address: {
						"@type": "PostalAddress",
						streetAddress: h.address,
						addressLocality: city.city,
						addressCountry: city.cc || city.country
					},
					...h.coordinates ? { geo: {
						"@type": "GeoCoordinates",
						latitude: h.coordinates.latitude,
						longitude: h.coordinates.longitude
					} } : {},
					...h.booking?.stars ? { starRating: {
						"@type": "Rating",
						ratingValue: h.booking.stars
					} } : {},
					...h.offer?.nightly ? { priceRange: `from ${money(h.offer.nightly)} per night (reference)` } : {},
					...h.gallery?.[0]?.src ? { image: h.gallery[0].src } : {}
				}
			}))
		},
		{
			"@context": "https://schema.org",
			"@type": "FAQPage",
			mainEntity: faq.map(([q, a]) => ({
				"@type": "Question",
				name: q,
				acceptedAnswer: {
					"@type": "Answer",
					text: a
				}
			}))
		}
	];
	return page({
		L,
		title,
		description,
		path,
		body: `<p class="crumbs"><a href="${P(L, "/")}">${esc(t.home)}</a> › <a href="${P(L, `/country/${city.cslug}`)}">${esc(cname)}</a> › ${esc(city.city)}</p>
<div class="hero${hero?.img ? "" : " noimg"}">${hero?.img ? `<img src="/api/img/${esc(city.id)}/big" srcset="/api/img/${esc(city.id)}/small 500w, /api/img/${esc(city.id)}/mid 960w, /api/img/${esc(city.id)}/big 1280w" sizes="(max-width: 960px) 100vw, 1180px" alt="${esc(city.city)}" fetchpriority="high" onerror="this.onerror=null;this.src='/api/img/${esc(city.id)}/orig'">` : ""}
<div class="in"><p class="eyebrow">${esc(cname)} · 3 · ${esc(t.ourPick)}</p><h1>${esc(t.h1(city.city))}<em>.</em></h1><p class="lead">${esc(t.lead(sample))}</p></div>${hero?.page ? `<small>${esc(t.photo)}: <a href="${esc(hero.page)}" rel="nofollow noopener" target="_blank">Wikimedia Commons</a></small>` : ""}</div>
<p class="byline"><span class="ok">${esc(xt.reviewed(updated))}</span><span class="ok">${esc(xt.independent)}</span><span class="ok">${esc(xt.noPaid)}</span></p>${flights}${in1}${jump}<span hidden data-track="${esc(JSON.stringify({
			s: city.slug,
			c: city.city
		}))}"></span>
<form class="plan" action="/" method="get"><input type="hidden" name="city" value="${esc(city.slug)}"><label>${esc(t.checkIn)}<input type="date" name="checkin"></label><label>${esc(t.checkOut)}<input type="date" name="checkout"></label>${guestSel}${curSel}<button class="btn" type="submit" data-t="dates_submit" data-city="${esc(city.slug)}">${esc(t.seeDates)}</button><div class="quick"><span>${esc(xt.quick)}:</span><button type="button" data-quick="-1">${esc(xt.thisWeekend)}</button><button type="button" data-quick="-2">${esc(xt.nextWeekend)}</button><button type="button" data-quick="30">${esc(xt.inAMonth)}</button></div></form>
<div class="cards" id="hotels">${hs.map((h, i) => card(h, city, i, L, sights, hero?.img ? `/api/img/${city.id}/big` : void 0, hpLive.has(hotelSlug(h.name, city.slug)) ? P(HP_LANGS.includes(L) ? L : "en", `/hotel/${hotelSlug(h.name, city.slug)}`) : void 0)).join("")}</div>
<aside class="curator"><span class="av" aria-hidden="true">CO</span><div><h3>${esc(M[L].curatorT)}</h3><p>${esc(M[L].curatorB)}</p><p style="margin-top:6px"><a href="/how-we-choose">${esc(M[L].how)} →</a><a href="/affiliate-disclosure">${esc(M[L].money)} →</a></p></div></aside>${guideFor(city.slug) ? `<p class="note" style="margin:14px 0"><a href="/guides/${guideFor(city.slug).slug}">📖 ${esc(guideFor(city.slug).h1)}: areas, tips and our three picks →</a></p>` : ""}
<p class="note">${esc(t.refRate)}: ${esc(dates)}, 2 adults, 1 room · Booking.com · ${esc(checked)}.</p>
<div class="sharebar"><span>${esc(xt.share)}:</span><button type="button" data-shareimg="${esc(JSON.stringify({
			slug: city.slug,
			city: city.city,
			t1: "Top 3 hotels in",
			url: `top3hotels.com/${city.slug}`,
			h: hs.map((h) => ({
				k: catKey(h),
				l: label(h, "en"),
				n: h.name,
				s: `${h.booking?.score ? h.booking.score.toFixed(1) + "/10 · " : ""}${money(h.offer?.nightly)} / night`
			}))
		}))}">📸 ${esc(M[L].shareImg)}</button><a href="https://wa.me/?text=${encodeURIComponent(t.h1(city.city) + " https://www.top3hotels.com" + P(L, path))}" target="_blank" rel="noopener" data-t="share" data-p="whatsapp">WhatsApp</a><a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE + P(L, path))}" target="_blank" rel="noopener" data-t="share" data-p="facebook">Facebook</a><a href="https://x.com/intent/post?url=${encodeURIComponent(SITE + P(L, path))}&amp;text=${encodeURIComponent(t.h1(city.city))}" target="_blank" rel="noopener" data-t="share" data-p="x">X</a><button type="button" data-copy="${esc(SITE + P(L, path))}" data-done="${esc(xt.copied)}">${esc(xt.copyLink)}</button><a href="mailto:?subject=${encodeURIComponent(t.h1(city.city))}&amp;body=${encodeURIComponent(hs.map((h) => `${label(h, L)}: ${h.name} (${h.booking?.score?.toFixed(1) ?? "–"}/10, ${money(h.offer?.nightly)} ${t.perNight})`).join("\n") + "\n\nhttps://www.top3hotels.com" + P(L, path))}" data-t="share" data-p="email">✉ ${esc(xt.emailMe)}</a></div>
${filmingBlock(city, L)}
${guideBlock(city, L)}
${areaBlock}
<section aria-labelledby="maph"><h2 id="maph">${esc(t.map)}</h2><div id="map" role="img" aria-label="${esc(t.mapHint)}"></div><div class="legend"><span><i style="background:#1f7a5a"></i>${esc(t.cat.Budget)}</span><span><i style="background:#d83b51"></i>${esc(t.cat["Best Value"])}</span><span><i style="background:#b8860b"></i>${esc(label(lux, L))}</span>${sights?.length ? `<span><i style="background:#46566a"></i>${esc(sights.map((s) => s.name).join(" · "))}</span>` : ""}</div></section>
<section aria-labelledby="cmp"><h2 id="cmp">${esc(t.compared(city.city))}</h2><div class="tablewrap"><table><thead><tr>${t.cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>
${hs.map((h) => `<tr><td>${esc(label(h, L))}</td><td>${esc(h.name)}</td><td>${esc(h.area ?? "")}</td><td>${h.booking?.stars ?? "–"}</td><td>${h.booking?.score?.toFixed(1) ?? "–"} (${fmtInt(h.booking?.count)})</td><td>${money(h.offer?.nightly)}</td></tr>`).join("")}
</tbody></table></div></section>
<section aria-labelledby="faq"><h2 id="faq">${esc(t.faqTitle(city.city))}</h2><dl class="faq">${faq.map(([q, a]) => `<dt>${esc(q)}</dt><dd>${esc(a)}</dd>`).join("")}</dl></section>
<section aria-labelledby="how"><h2 id="how">${esc(t.howTitle)}</h2><p class="lead">${esc(t.howText)} <a href="/how-we-choose">${esc(t.how)} →</a></p></section>
<section aria-labelledby="src"><h2 id="src">${esc(xt.sources)}</h2><p class="sources">${esc(xt.sourcesText)} ${esc(t.checked(daysSince(budget.booking?.checked)))}.</p>
<div class="forhotels"><h3 class="serif" style="font-size:22px;margin:0 0 6px">${esc(xt.badgeQ)}</h3><p style="margin:0;font-size:14px;color:var(--muted)">${esc(xt.badgeHow)}</p>${hs.map((h) => `<p style="margin:12px 0 0;font-weight:600">${esc(h.name)}</p><code>${esc(`<a href="${SITE}/${city.slug}" target="_blank" rel="noopener" title="Top3Hotels ${label(h, "en")} pick in ${city.city}"><img src="${SITE}/badge/${city.slug}/${catKey(h)}.svg" width="180" height="60" alt="Top 3 ${label(h, "en")} pick in ${city.city} 2026 · Top3Hotels"></a>`)}</code>`).join("")}<p style="margin:0;font-size:13px"><a href="/partners">${esc(xt.forHotels)} →</a></p><h3 class="serif" style="font-size:22px;margin:22px 0 6px">${esc(y.embedTitle)}</h3><p style="margin:0;font-size:14px;color:var(--muted)">${esc(y.embedHow)} <a href="/embed/${esc(city.slug)}" target="_blank" rel="noopener">Preview ↗</a></p><code>${esc(embed)}</code></div></section>
${near.length ? `<section aria-labelledby="near"><h2 id="near">${esc(t.near(city.city))}</h2><ul class="grid">${near.map((c) => `<li><a href="${P(L, "/" + c.slug)}">${esc(c.city)} <span>${esc(countryName(c, L))}</span></a></li>`).join("")}</ul><p class="note" style="margin-top:14px">${esc(y.compareWith(city.city))}: ${POPULAR.filter((s) => s !== city.slug).slice(0, 6).map((s) => bySlug.get(s)).filter((c) => Boolean(c)).map((c) => `<a href="${P(L, `/compare/${city.slug}/${c.slug}`)}" rel="nofollow">${esc(c.city)}</a>`).join(" · ")}</p></section>` : ""}
${hotelsBlock(city, L)}
<section hidden data-recent><h2>${esc(y.js["recent"])}</h2><div class="chipsrow"></div></section>
${newsBlock(L)}
${same.length ? `<section aria-labelledby="more"><h2 id="more">${esc(t.moreIn(cname))}</h2><ul class="grid">${same.map((c) => `<li><a href="${P(L, "/" + c.slug)}">${esc(c.city)}</a></li>`).join("")}</ul><p class="note"><a href="${P(L, `/country/${city.cslug}`)}">${esc(t.allIn(cname))}</a></p></section>` : ""}
<div class="sticky">${bookingLink(value) ? `<a class="btn coral" href="${esc(bookingLink(value))}" rel="sponsored nofollow noopener" target="_blank" data-t="check_availability" data-city="${esc(city.slug)}" data-cat="value" data-p="booking-sticky">★ ${esc(t.checkPrice)}</a>` : ""}</div>
<nav class="sticky3" aria-label="Book">${hs.map((h) => bookingLink(h) ? `<a class="${catKey(h)}" href="${esc(bookingLink(h))}" rel="sponsored nofollow noopener" target="_blank" data-t="check_availability" data-city="${esc(city.slug)}" data-cat="${catKey(h)}" data-p="booking-sticky3"><span>${esc(label(h, L))}</span><b data-eur="${h.offer?.nightly ?? ""}"><span class="v">${money(h.offer?.nightly)}</span></b></a>` : "").join("")}</nav>`,
		ld,
		...image ? { image } : {},
		langs: true,
		scripts: mapScript(hs, sights)
	});
}
async function tileFor(c, h, L, extra = "") {
	const { cx } = await data();
	const img = h.gallery?.find((g) => g.src)?.src ?? (cx[c.id]?.hero?.img ? `/api/img/${c.id}/small` : void 0);
	return `<a class="tile ${catKey(h)}" href="${P(L, "/" + c.slug)}">${img ? `<img src="${esc(img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}<div><strong>${esc(h.name)}</strong>${esc(c.city)}, ${esc(countryName(c, L))} · ${esc(label(h, L))} · ${h.booking?.score?.toFixed(1) ?? "–"}/10 · ${money(h.offer?.nightly)}${extra}</div></a>`;
}
async function countryPage(cslug, L) {
	const { byCountry } = await data();
	const list = byCountry.get(cslug);
	if (!list?.length) return null;
	const t = T[L];
	const cname = countryName(list[0], L);
	const rows = await Promise.all(list.map(async (c) => ({
		c,
		d: await cityData(c.id)
	})));
	const path = `/country/${cslug}`;
	const ld = [{
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: [{
			"@type": "ListItem",
			position: 1,
			name: "Top3Hotels",
			item: SITE + P(L, "/")
		}, {
			"@type": "ListItem",
			position: 2,
			name: cname,
			item: SITE + P(L, path)
		}]
	}, {
		"@context": "https://schema.org",
		"@type": "ItemList",
		name: t.countryH1(cname),
		itemListElement: list.map((c, i) => ({
			"@type": "ListItem",
			position: i + 1,
			name: t.h1(c.city),
			url: `${SITE}${P(L, "/" + c.slug)}`
		}))
	}];
	const tiles = await Promise.all(rows.filter((r) => r.d).map(({ c, d }) => tileFor(c, d.hotels[1], L)));
	const body = `<p class="crumbs"><a href="${P(L, "/")}">${esc(t.home)}</a> › <a href="${P(L, "/destinations")}">${esc(t.allDest)}</a> › ${esc(cname)}</p>
<h1>${esc(t.countryH1(cname))}<em>.</em></h1><p class="lead">${esc(t.countryLead(list.length))}</p>
<div class="tiles">${tiles.join("")}</div>
<section><div class="tablewrap"><table><thead><tr><th>${esc(t.allDest)}</th><th>${esc(t.cat.Budget)}</th><th>${esc(t.cat["Best Value"])}</th><th>${esc(t.cat.Luxury)}</th></tr></thead><tbody>
${rows.filter((r) => r.d).map(({ c, d }) => `<tr><td><a href="${P(L, "/" + c.slug)}"><strong>${esc(c.city)}</strong></a></td>${d.hotels.map((h) => `<td>${esc(h.name)}<br><small>${h.booking?.score?.toFixed(1) ?? "–"}/10 · ${money(h.offer?.nightly)}</small></td>`).join("")}</tr>`).join("")}
</tbody></table></div></section>`;
	const img = rows.find((r) => r.d?.extras?.hero?.img)?.d?.extras?.hero?.img;
	return page({
		L,
		title: t.countryTitle(cname, list.length),
		description: `${t.countryLead(list.length)} ${list.slice(0, 5).map((c) => c.city).join(", ")}…`,
		path,
		body,
		ld,
		langs: true,
		...img ? { image: img } : {}
	});
}
async function destinationsPage(L) {
	const { byCountry, index } = await data();
	const t = T[L];
	const countries = [...byCountry.entries()].sort((a, b) => countryName(a[1][0], L).localeCompare(countryName(b[1][0], L), L));
	const body = `<p class="crumbs"><a href="${P(L, "/")}">${esc(t.home)}</a> › ${esc(t.allDest)}</p><h1>${esc(t.destH1(index.length))}<em>.</em></h1>
<p class="lead">${esc(t.destLead(countries.length))}</p>
<section class="countries">${countries.map(([cs, list]) => `<h2><a href="${P(L, `/country/${cs}`)}">${esc(countryName(list[0], L))}</a> <small>${list.length}</small></h2><ul class="grid">${list.map((c) => `<li><a href="${P(L, "/" + c.slug)}">${esc(c.city)}</a></li>`).join("")}</ul>`).join("")}</section>`;
	return page({
		L,
		title: t.destTitle(index.length),
		description: t.destLead(countries.length),
		path: "/destinations",
		body,
		langs: true
	});
}
var THEMES = [
	"beach",
	"pool",
	"pets",
	"family",
	"spa",
	"budget",
	"luxury"
];
var EVENTS = [
	{
		slug: "oktoberfest",
		city: "munich",
		name: "Oktoberfest",
		when: "late September – early October"
	},
	{
		slug: "rio-carnival",
		city: "rio-de-janeiro",
		name: "Rio Carnival",
		when: "February / March"
	},
	{
		slug: "venice-carnival",
		city: "venice",
		name: "Venice Carnival",
		when: "February"
	},
	{
		slug: "christmas-markets-vienna",
		city: "vienna",
		name: "Vienna Christmas markets",
		when: "mid-November – December"
	},
	{
		slug: "christmas-markets-prague",
		city: "prague",
		name: "Prague Christmas markets",
		when: "late November – early January"
	},
	{
		slug: "christmas-markets-strasbourg",
		city: "strasbourg",
		name: "Strasbourg Christmas market",
		when: "late November – December"
	},
	{
		slug: "christkindlesmarkt-nuremberg",
		city: "nuremberg",
		name: "Nuremberg Christkindlesmarkt",
		when: "late November – December"
	},
	{
		slug: "cologne-carnival",
		city: "cologne",
		name: "Cologne Carnival",
		when: "February"
	},
	{
		slug: "cherry-blossom-tokyo",
		city: "tokyo",
		name: "Cherry blossom in Tokyo",
		when: "late March – early April"
	},
	{
		slug: "cherry-blossom-kyoto",
		city: "kyoto",
		name: "Cherry blossom in Kyoto",
		when: "early April"
	},
	{
		slug: "las-fallas",
		city: "valencia-spain",
		name: "Las Fallas",
		when: "15–19 March"
	},
	{
		slug: "feria-de-abril",
		city: "seville",
		name: "Seville April Fair",
		when: "April"
	},
	{
		slug: "edinburgh-fringe",
		city: "edinburgh",
		name: "Edinburgh Festival Fringe",
		when: "August"
	},
	{
		slug: "new-years-eve-sydney",
		city: "sydney",
		name: "New Year's Eve in Sydney",
		when: "31 December"
	},
	{
		slug: "new-years-eve-new-york",
		city: "new-york",
		name: "New Year's Eve in New York",
		when: "31 December"
	},
	{
		slug: "san-fermin",
		city: "pamplona",
		name: "San Fermín",
		when: "6–14 July"
	},
	{
		slug: "cannes-film-festival",
		city: "cannes",
		name: "Cannes Film Festival",
		when: "May"
	},
	{
		slug: "salzburg-festival",
		city: "salzburg",
		name: "Salzburg Festival",
		when: "late July – August"
	},
	{
		slug: "legoland-billund",
		city: "billund",
		name: "LEGOLAND season",
		when: "April – October"
	},
	{
		slug: "tivoli-christmas",
		city: "copenhagen",
		name: "Christmas at Tivoli",
		when: "mid-November – December"
	},
	{
		slug: "aarhus-festuge",
		city: "aarhus",
		name: "Aarhus Festuge",
		when: "late August – early September"
	},
	{
		slug: "aalborg-carnival",
		city: "aalborg",
		name: "Aalborg Carnival",
		when: "late May"
	},
	{
		slug: "northern-lights-tromso",
		city: "tromso",
		name: "Northern lights season",
		when: "October – March"
	},
	{
		slug: "ski-salen",
		city: "salen",
		name: "Ski season in Sälen",
		when: "December – April"
	}
];
async function themeRows(theme) {
	const { byId } = await data();
	const lists = (await import("./lists-CPyNRZJ_.mjs")).default ?? {};
	const out = [];
	for (const [id, i] of lists[theme] ?? []) {
		const c = byId.get(id);
		const h = (c ? await cityData(id) : null)?.hotels[i];
		if (c && h) out.push({
			c,
			h
		});
	}
	return out;
}
async function listsIndex(L) {
	const t = T[L];
	const body = `<p class="crumbs"><a href="${P(L, "/")}">${esc(t.home)}</a> › ${esc(t.lists)}</p><h1>${esc(t.listsTitle)}<em>.</em></h1><p class="lead">${esc(t.listsLead)}</p>
<section><ul class="grid">${THEMES.map((th) => `<li><a href="${P(L, `/lists/${th}`)}">${esc(t.themes[th].title)}</a></li>`).join("")}</ul></section>
<section><h2>${esc(t.fromNav)}</h2><ul class="grid">${[
		"billund",
		"aalborg",
		"aarhus"
	].map((k) => `<li><a href="${P(L, `/from/${k}`)}">${esc(t.fromH1(k[0].toUpperCase() + k.slice(1)))}</a></li>`).join("")}</ul></section><section><h2>Events</h2><ul class="grid">${EVENTS.map((e) => `<li><a href="${P(L, `/lists/${e.slug}`)}">${esc(e.name)} <span>${esc(e.when)}</span></a></li>`).join("")}</ul></section>`;
	return page({
		L,
		title: `${t.listsTitle} | Top3Hotels`,
		description: t.listsLead,
		path: "/lists",
		body,
		langs: true
	});
}
async function themePage(theme, L) {
	const t = T[L];
	const th = t.themes[theme];
	const rows = (await themeRows(theme)).slice(0, 60);
	const tiles = await Promise.all(rows.map(({ c, h }) => tileFor(c, h, L)));
	const body = `<p class="crumbs"><a href="${P(L, "/")}">${esc(t.home)}</a> › <a href="${P(L, "/lists")}">${esc(t.lists)}</a> › ${esc(th.title)}</p>
<h1>${esc(th.h1)}<em>.</em></h1><p class="lead">${esc(th.lead)}</p><div class="tiles">${tiles.join("")}</div>`;
	const ld = [{
		"@context": "https://schema.org",
		"@type": "ItemList",
		name: th.h1,
		itemListElement: rows.map(({ c, h }, i) => ({
			"@type": "ListItem",
			position: i + 1,
			name: `${h.name}, ${c.city}`,
			url: `${SITE}${P(L, "/" + c.slug)}`
		}))
	}];
	const img = rows[0]?.h.gallery?.[0]?.src;
	return page({
		L,
		title: `${th.title} (2026) | Top3Hotels`,
		description: th.lead,
		path: `/lists/${theme}`,
		body,
		ld,
		langs: true,
		...img ? { image: img } : {}
	});
}
async function eventPage(slug, L) {
	const ev = EVENTS.find((e) => e.slug === slug);
	if (!ev) return null;
	const { bySlug } = await data();
	const c = bySlug.get(ev.city);
	if (!c) return null;
	const d = await cityData(c.id);
	if (!d) return null;
	const t = T[L];
	const title = `Best hotels for ${ev.name} (2026): the 3 to book | Top3Hotels`;
	const tiles = await Promise.all(d.hotels.map((h) => tileFor(c, h, L)));
	const body = `<p class="crumbs"><a href="${P(L, "/")}">${esc(t.home)}</a> › <a href="${P(L, "/lists")}">${esc(t.lists)}</a> › ${esc(ev.name)}</p>
<div class="hero${d.extras?.hero?.img ? "" : " noimg"}">${d.extras?.hero?.img ? `<img src="/api/img/${esc(c.id)}/big" alt="${esc(c.city)}">` : ""}<div class="in"><p class="eyebrow">${esc(ev.when)}</p><h1>Best hotels for ${esc(ev.name)}<em>.</em></h1><p class="lead">Three hotels in ${esc(c.city)}: one Budget, one Best Value, one Luxury. Book early: prices rise fast around ${esc(ev.name)}.</p></div></div>
<div class="tiles">${tiles.join("")}</div><p style="margin-top:22px"><a class="btn" href="${P(L, "/" + c.slug)}">${esc(t.h1(c.city))} →</a></p>`;
	return page({
		L,
		title,
		description: `The three hotels to book in ${c.city} for ${ev.name} (${ev.when}): Budget, Best Value and Luxury, with sourced scores and reference prices.`,
		path: `/lists/${slug}`,
		body,
		langs: true,
		...d.extras?.hero?.img ? { image: d.extras.hero.img } : {}
	});
}
function notFoundPage(path, L) {
	const t = T[L];
	return page({
		L,
		title: `${t.notFound} — Top3Hotels`,
		description: t.destLead(119),
		path,
		noindex: true,
		body: `<div style="text-align:center;padding:56px 0 10px"><p style="font:400 92px/1 var(--serif);margin:0;color:var(--coral)">4<span style="color:var(--budget)">0</span><span style="color:var(--lux)">4</span></p><h1 style="margin-top:12px">${esc(Y[L].nfTitle)}<em>.</em></h1><p class="lead" style="margin:0 auto">${esc(t.notFound)}. ${esc(Y[L].nfLead)}</p><p style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:22px"><button type="button" class="btn" data-pal>🔍 ${esc(Y[L].js["search"])}</button><a class="btn ghost" href="/random">🎲 ${esc(Y[L].js["surprise"])}</a><a class="btn ghost" href="${P(L, "/destinations")}">${esc(t.allDest)}</a></p><div class="chipsrow" style="justify-content:center;margin-top:26px">${POPULAR.map((s) => `<a href="${P(L, "/" + s)}">${esc(s.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()))}</a>`).join("")}</div></div>`
	});
}
async function stats() {
	const { index, byCountry } = await data();
	return {
		cities: index.length,
		hotels: index.length * 3,
		countries: byCountry.size,
		langs: LANGS.length
	};
}
var pillars = (n) => `<div class="pillars"><div class="pillar"><b>${n.cities.toLocaleString("en-US")}</b><span>destinations, three hotels each</span></div><div class="pillar"><b>${n.hotels.toLocaleString("en-US")}</b><span>picks — Budget, Best Value, Luxury — chosen by public rules</span></div><div class="pillar"><b>${n.countries}</b><span>countries</span></div><div class="pillar"><b>${n.langs}</b><span>languages: EN · ES · DE · FR · IT · PT · DA</span></div></div>`;
var mail = (subject, text = BRAND.email) => `<a href="mailto:${BRAND.email}?subject=${encodeURIComponent(subject)}">${esc(text)}</a>`;
var crumbsEn = (name) => `<p class="crumbs"><a href="/">Home</a> › ${esc(name)}</p>`;
async function aboutPage() {
	const n = await stats();
	return page({
		L: "en",
		title: "About Top3Hotels — the best hotel in every city, picked in 1 second",
		description: "Who we are, why we show only three hotels per city, and how Top3Hotels stays independent.",
		path: "/about",
		body: `${crumbsEn("About us")}<h1>Top 3 hotels in every city<em>.</em></h1>
<p class="lead">Top3Hotels replaces endless hotel lists with three clear choices per city: one Budget, one Best Value and one Luxury hotel. Every pick shows where its data comes from and when we checked it.</p>
${pillars(n)}
<div class="prose">
<h2>Why we exist</h2><p>Booking a hotel should not take an evening. Big booking sites show hundreds of options, sponsored placements and filters. We do the shortlisting for you, with the same rules in every city, so you can decide in seconds and book with confidence.</p>
<h2>What makes us different</h2><ul><li><b>Three picks, not three hundred.</b> One per budget level, always in the same order.</li><li><b>No paid rankings.</b> A hotel cannot pay to be included, moved up or kept in a list.</li><li><b>Sourced and dated.</b> Guest scores, review counts and reference prices come from Booking.com and show the date we checked them.</li><li><b>Useful context.</b> Walking time to the best-known sights, what guests praise and what they criticise, and who each hotel suits best.</li></ul>
<h2>Who is behind Top3Hotels</h2><p>Top3Hotels is an independent project of ${esc(BRAND.entity)} (${esc(BRAND.place)}), founded by ${esc(BRAND.founder)}, a growth and travel-tech entrepreneur based between Denmark and Spain. The editorial rules are public on <a href="/how-we-choose">How we choose</a>.</p>
<h2>How we make money</h2><p>When you book through some of our links we may earn a commission from the booking site, at no extra cost to you. Commissions never influence which hotels we pick.</p>
<p><a class="btn" href="/how-we-choose">How we choose</a> <a class="btn ghost" href="/partners">For hotels &amp; partners</a></p></div>`,
		ld: [orgLd()]
	});
}
async function methodPage() {
	return page({
		L: "en",
		title: "How we choose the three hotels — Top3Hotels methodology",
		description: "The transparent rules behind every Budget, Best Value and Luxury pick on Top3Hotels.",
		path: "/how-we-choose",
		body: `${crumbsEn("How we choose")}<h1>How we choose the three<em>.</em></h1>
<p class="lead">The same transparent rules in every city. No hotel can pay to be one of the three picks.</p>
<div class="prose">
<h2>1. The sample</h2><p>For each destination we take the hotels Booking.com returns for the same reference stay: two adults, one room, two mid-week nights in November 2026. For major destinations we use up to 40 hotels closest to the centre, so every pick is well located.</p>
<h2>2. Eligibility</h2><p>A hotel needs a real track record: at least 15 guest reviews and a guest score of 7.0 or more (8.0 for large samples). When a city has enough proper hotels, private apartments are left out.</p>
<h2>3. The three picks</h2><ul><li><b>Budget</b> — the lowest eligible reference price.</li><li><b>Best Value</b> — the strongest review-confidence score at or near the sample's median price. Review confidence weighs the score by the number of reviews, so a 9.4 from 4,000 guests beats a 9.8 from 12.</li><li><b>Luxury</b> — the best-reviewed five-star hotel. If no five-star qualifies, a four-star rated 8.5+ is shown and clearly labelled as an upscale alternative.</li></ul>
<h2>4. What we show for each hotel</h2><p>Guest score and review count, reference price, star classification, location score, what guests praise and criticise, facilities, walking time to the best-known sights (straight-line estimate) and who the hotel suits best.</p>
<h2>5. Freshness and corrections</h2><p>Every page shows when prices were checked. Prices are reference rates, not live quotes; the booking link always shows the current price for your dates. Spotted something wrong? ${mail("Correction request")}. We aim to review corrections within a few working days.</p>
<h2>6. Independence</h2><p>Some links earn us a commission. That never changes the selection, the order or the text. Hotels cannot buy a place in the three picks, our scores or reviews. A hotel can appear as a clearly labelled <em>Featured partner</em> (for example after a filmed stay); those features are always marked and kept separate from the picks. Read our <a href="/affiliate-disclosure">affiliate disclosure</a>.</p>
<h2>Sources</h2><p class="muted">Booking.com (scores, reviews, prices, hotel photos) · Wikimedia Commons (city photos) · Wikipedia (sights) · OpenStreetMap / OpenFreeMap (maps).</p></div>`
	});
}
async function partnersPage() {
	const n = await stats();
	return page({
		L: "en",
		title: "For hotels & partners — Top3Hotels",
		description: "Badges for selected hotels, destination and route guides, co-branded content. Independent picks that travellers trust.",
		path: "/partners",
		body: `${crumbsEn("For hotels & partners")}<h1>Work with Top3Hotels<em>.</em></h1>
<p class="lead">We help travellers choose in one second. Hotels, destinations and travel brands work with us on content that travellers trust, because our picks can't be bought.</p>
${pillars(n)}
<div class="prose">
<h2>For selected hotels</h2><ul><li><b>The official Top 3 badge</b>, free, for your website and social channels. Find your code at the bottom of your city page.</li><li><b>Your hotel, correctly presented.</b> Send us better photos, facility updates or corrections.</li><li><b>On request:</b> a “Top 3 pick 2026” certificate for your reception and press materials.</li></ul>
<h2>For destinations, airports and airlines</h2><ul><li>Route pages like <a href="/from/billund">Direct flights from Billund</a>, <a href="/from/aalborg">Aalborg</a> and <a href="/from/aarhus">Aarhus</a>: the three best hotels in every destination you fly to.</li><li>Event and season guides (Christmas markets, LEGOLAND season, festivals) in seven languages.</li></ul>
<h2>For travel brands and creators</h2><ul><li>Co-branded city guides, newsletters and social content built on our shortlists.</li><li>On request: embeddable “3 best hotels” blocks for your city or event page.</li></ul>
<h2>Our principles</h2><p>Selection is editorial and rule-based (<a href="/how-we-choose">see how we choose</a>). Partnerships never change which hotels appear or their order. Sponsored content is always labelled.</p>
<p><a class="btn coral" href="mailto:${BRAND.email}?subject=${encodeURIComponent("Partnership with Top3Hotels")}">Contact partnerships</a> <a class="btn ghost" href="/top3hotels-media-kit.pdf" download>Download media kit (PDF)</a> <a class="btn ghost" href="/partners/media-kit">View media kit</a></p></div>`,
		ld: [orgLd()]
	});
}
async function mediaKitPage() {
	const n = await stats();
	return page({
		L: "en",
		title: "Top3Hotels media kit",
		description: "Top3Hotels in numbers, product, principles and partnership formats.",
		path: "/partners/media-kit",
		body: `<p class="eyebrow" style="margin-top:28px">Media kit · ${fmtDate(SNAPSHOT_DATE, "en")}</p><h1>Top3Hotels<em>.</em></h1>
<p class="lead">The best hotel in every city, picked in 1 second. One Budget, one Best Value and one Luxury hotel per destination, with sourced scores and reference prices.</p>
${pillars(n)}
<div class="prose"><h2>The product</h2><ul><li>${n.cities.toLocaleString("en-US")} destination pages in ${n.langs} languages, each with three hotels, map, walking times to sights and guest feedback.</li><li>Country pages, themed lists (beach, pool, pets, family, spa, budget, luxury) and event guides.</li><li>Route pages for direct flights from Billund, Aalborg and Aarhus.</li></ul>
<h2>Why travellers trust it</h2><ul><li>Rule-based, public methodology. No paid rankings.</li><li>Every number shows its source and the date it was checked.</li><li>Fast and accessible: Lighthouse 100 for accessibility, best practices and SEO.</li></ul>
<h2>Partnership formats</h2><ul><li>Top 3 badge for selected hotels (free); certificate on request.</li><li>Destination, airport and airline route guides.</li><li>Co-branded city and event content, newsletters, social.</li></ul>
<h2>Company</h2><p>${esc(BRAND.entity)} · ${esc(BRAND.place)} · Founder: ${esc(BRAND.founder)} · ${mail("Top3Hotels media kit")} · www.top3hotels.com</p></div>`,
		noindex: true
	});
}
async function contactPage() {
	return page({
		L: "en",
		title: "Contact — Top3Hotels",
		description: "Contact Top3Hotels for partnerships, corrections and press.",
		path: "/contact",
		body: `${crumbsEn("Contact")}<h1>Contact us<em>.</em></h1><p class="lead">We usually reply within two working days.</p>
<div class="pillars"><div class="pillar"><b>Partners</b><span>Hotels, destinations, travel brands.<br>${mail("Partnership with Top3Hotels", "Write to partnerships")}</span></div><div class="pillar"><b>Corrections</b><span>Wrong photo, price or detail?<br>${mail("Correction request", "Send a correction")}</span></div><div class="pillar"><b>Press</b><span>Interviews, data and quotes.<br>${mail("Press enquiry", "Press enquiries")}</span></div></div>
<section aria-labelledby="cform"><h2 id="cform">Write to us</h2><form class="plan" style="max-width:720px;flex-direction:column;align-items:stretch" onsubmit="event.preventDefault();var f=this;location.href='mailto:${BRAND.email}?subject='+encodeURIComponent('['+f.topic.value+'] '+f.name.value)+'&body='+encodeURIComponent(f.msg.value+'\n\n'+f.name.value+' · '+f.email.value)"><label>Your name<input name="name" required autocomplete="name"></label><label>Your email<input name="email" type="email" required autocomplete="email"></label><label>Topic<select name="topic"><option>Hotel partnership</option><option>Correction</option><option>Press</option><option>Other</option></select></label><label>Message<textarea name="msg" rows="5" required style="font:inherit;border:1px solid var(--line);border-radius:12px;padding:10px;background:var(--paper);color:var(--ink)"></textarea></label><button class="btn" type="submit">Send message</button></form></section>
<div class="prose"><h2>Company</h2><p><strong>${esc(BRAND.entity)}</strong><br>30 N Gould St, Ste N<br>Sheridan, WY 82801<br>United States<br>${mail("Hello Top3Hotels")}</p><p class="muted">Top3Hotels is operated by ${esc(BRAND.entity)}, founded by ${esc(BRAND.founder)}. We reply within two working days.</p></div>`
	});
}
function legalPage(kind) {
	const upd = fmtDate(SNAPSHOT_DATE, "en");
	const who = `${esc(BRAND.entity)}, ${esc(BRAND.place)} (“Top3Hotels”, “we”). Contact: ${mail("Data protection")}`;
	const [title, html2] = {
		privacy: ["Privacy policy", `<p class="muted">Last updated ${upd}</p><h2>Who is responsible</h2><p>${who}.</p>
<h2>What we collect</h2><ul><li><b>No account, no sign-up.</b> You can use Top3Hotels without giving us any personal data.</li><li><b>Technical data.</b> Our hosting provider processes IP address, browser and requested pages to deliver and secure the site (server logs, kept for a short period).</li><li><b>Price alerts (optional).</b> If you ask for a price alert we store your email address, city, category and price limit with our email provider (Resend) only to send that alert. Unsubscribe at any time.</li><li><b>Saved hotels.</b> Hotels you save are stored only in your own browser (local storage), not on our servers.</li></ul>
<h2>Links to booking sites and affiliate partners</h2><p>When you click a booking link (for example Booking.com, Expedia or Agoda) you leave our site; that site's privacy policy applies. Our affiliate partner Travelpayouts may process technical data to attribute bookings to us.</p>
<h2>Maps, images and fonts</h2><p>Maps are loaded from OpenFreeMap (OpenStreetMap data). Hotel photos are served by Booking.com's image servers. City photos are served from our own domain. Fonts are self-hosted.</p>
<h2>Legal basis and your rights</h2><p>We process data on the basis of legitimate interest (running a secure website) or your consent (price alerts). Under the GDPR and similar laws you can ask for access, correction, deletion, restriction or portability, and object to processing: ${mail("Privacy request")}. You can also complain to your data protection authority.</p>
<h2>International transfers</h2><p>Our providers may process data outside your country, including in the United States, under appropriate safeguards such as standard contractual clauses.</p>`],
		cookies: ["Cookie policy", `<p class="muted">Last updated ${upd}</p><h2>Our own cookies</h2><p>Top3Hotels does not set its own tracking or advertising cookies. We use your browser's local storage only to remember hotels you save and your language choice.</p>
<h2>Third parties</h2><ul><li><b>Travelpayouts</b> (affiliate attribution) may use cookies or similar technology when you click an affiliate link.</li><li><b>Booking sites</b> such as Booking.com set their own cookies after you leave our site.</li><li><b>Analytics</b>: if we enable privacy-friendly analytics, we will list the provider here before doing so.</li></ul>
<h2>Your choices</h2><p>You can block or delete cookies and local storage in your browser settings. The site keeps working without them.</p>`],
		terms: ["Terms of use", `<p class="muted">Last updated ${upd}</p><h2>What Top3Hotels is</h2><p>Top3Hotels is an independent information service operated by ${who}. We are not a travel agency and do not sell or book hotel rooms.</p>
<h2>Prices and information</h2><p>Prices are reference rates for a stated stay and date of checking. They are not offers. Availability, prices, taxes and conditions are set by the booking site and the hotel and can change at any time. Always check the final details before you book.</p>
<h2>Bookings</h2><p>Any booking is a contract between you and the booking site or hotel, under their terms. We are not a party to it.</p>
<h2>Affiliate links</h2><p>Some links are affiliate links. We may earn a commission at no extra cost to you. This never affects our selection.</p>
<h2>Intellectual property</h2><p>Texts, selections, design and logo belong to ${esc(BRAND.entity)}. Hotel photos belong to their owners and Booking.com; city photos come from Wikimedia Commons under their licences, credited on each page. Selected hotels may use the Top 3 badge as provided.</p>
<h2>Liability</h2><p>We take care to keep information accurate, but we provide it “as is”. To the extent permitted by law we are not liable for decisions made on the basis of the information on this site.</p>
<h2>Law</h2><p>These terms are governed by the laws of the State of Wyoming, United States, without prejudice to mandatory consumer protection in your country of residence.</p>`],
		imprint: ["Imprint", `<h2>Operator</h2><p>${esc(BRAND.entity)}<br>${esc(BRAND.place)}</p><h2>Responsible for content</h2><p>${esc(BRAND.founder)}, Founder</p><h2>Contact</h2><p>${mail("Top3Hotels")}<br>Website: www.top3hotels.com</p><h2>Editorial independence</h2><p>Hotel selections follow our <a href="/how-we-choose">public methodology</a>. Rankings cannot be bought.</p>`]
	}[kind];
	const path = `/${kind}`;
	return page({
		L: "en",
		title: `${title} — Top3Hotels`,
		description: `${title} of Top3Hotels (${BRAND.entity}).`,
		path,
		body: `${crumbsEn(title)}<h1>${esc(title)}<em>.</em></h1><div class="prose">${html2}</div>`
	});
}
function orgLd() {
	return {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: "Top3Hotels",
		url: SITE,
		logo: `${SITE}/icon-512.png`,
		email: BRAND.email,
		parentOrganization: {
			"@type": "Organization",
			name: BRAND.entity,
			address: BRAND.place
		},
		founder: {
			"@type": "Person",
			name: BRAND.founder
		}
	};
}
async function badgeSvg(slug, cat) {
	const { bySlug } = await data();
	const c = bySlug.get(slug);
	if (!c || ![
		"budget",
		"value",
		"lux"
	].includes(cat)) return null;
	const lab = {
		budget: "Budget",
		value: "Best Value",
		lux: "Luxury"
	}[cat];
	const col = {
		budget: "#1f7a5a",
		value: "#d83b51",
		lux: "#9a6b00"
	}[cat];
	const city = c.city.length > 18 ? c.city.slice(0, 17) + "…" : c.city;
	const e = (x) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;");
	return `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60" viewBox="0 0 180 60" role="img" aria-label="Top 3 ${e(lab)} pick in ${e(c.city)} 2026, Top3Hotels"><rect x=".5" y=".5" width="179" height="59" rx="12" fill="#fff" stroke="#e6e1d8"/><rect x="0" y="0" width="6" height="60" rx="3" fill="${col}"/><g transform="translate(16 16)"><rect x="0" y="11" width="7" height="13" rx="2" fill="#1f7a5a"/><rect x="9.5" y="0" width="7" height="24" rx="2" fill="#d83b51"/><rect x="19" y="5.5" width="7" height="18.5" rx="2" fill="#c9971c"/></g><text x="54" y="22" font-family="Georgia,serif" font-size="10" letter-spacing="1.2" fill="#525d6b">TOP 3 PICK · 2026</text><text x="54" y="38" font-family="Georgia,serif" font-size="15" font-weight="600" fill="${col}">${e(lab)}</text><text x="54" y="51" font-family="Arial,sans-serif" font-size="10" fill="#10213a">${e(city)} · top3hotels.com</text></svg>`;
}
async function geo(request) {
	const { index } = await data();
	const cf = request.cf ?? {};
	const country = cf.country ?? request.headers.get("cf-ipcountry") ?? "";
	const lat = Number(cf.latitude), lng = Number(cf.longitude);
	let near;
	if (Number.isFinite(lat) && Number.isFinite(lng) && (lat || lng)) near = [...index].sort((a, b) => km({
		lat,
		lng
	}, a) - km({
		lat,
		lng
	}, b)).slice(0, 6);
	else {
		const TOP = [
			"london",
			"manchester",
			"edinburgh",
			"madrid",
			"barcelona",
			"seville",
			"malaga",
			"valencia",
			"paris",
			"nice",
			"lyon",
			"rome",
			"milan",
			"venice",
			"florence",
			"naples",
			"berlin",
			"munich",
			"hamburg",
			"amsterdam",
			"copenhagen",
			"aarhus",
			"aalborg",
			"billund",
			"stockholm",
			"oslo",
			"helsinki",
			"new-york",
			"los-angeles",
			"chicago",
			"san-francisco",
			"miami",
			"las-vegas",
			"lisbon",
			"porto",
			"athens",
			"vienna",
			"prague",
			"budapest",
			"dublin",
			"brussels",
			"zurich",
			"istanbul",
			"dubai",
			"tokyo",
			"bangkok",
			"singapore",
			"sydney",
			"toronto",
			"mexico-city"
		];
		const rank = (c) => TOP.includes(c.slug) ? TOP.indexOf(c.slug) : 999;
		near = index.filter((c) => c.cc === country).sort((a, b) => rank(a) - rank(b) || (b.pop ?? 0) - (a.pop ?? 0)).slice(0, 6);
	}
	return new Response(JSON.stringify({
		country,
		near: near.map((c) => ({
			id: c.id,
			slug: c.slug,
			city: c.city,
			country: c.country
		}))
	}), { headers: {
		"content-type": "application/json",
		"cache-control": "private, max-age=3600"
	} });
}
async function airports() {
	return (await import("./airports-Dk5WM6z0.mjs")).default ?? {};
}
async function fromPage(key, L) {
	const ap = (await airports())[key];
	if (!ap) return null;
	const { byId } = await data();
	const t = T[L];
	const rows = (await Promise.all(ap.dest.map(async ([id, code]) => {
		const c = byId.get(id);
		const d = c ? await cityData(id) : null;
		return c && d ? {
			c,
			d,
			code
		} : null;
	}))).filter((r) => Boolean(r));
	const tiles = await Promise.all(rows.slice(0, 12).map(({ c, d, code }) => tileFor(c, d.hotels[1], L, ` · ✈ ${esc(ap.iata)}–${esc(code)}`)));
	const path = `/from/${key}`;
	const others = Object.entries(await airports()).filter(([k]) => k !== key);
	const body = `<p class="crumbs"><a href="${P(L, "/")}">${esc(t.home)}</a> › ${esc(t.fromNav)} › ${esc(ap.name)}</p>
<h1>${esc(t.fromH1(ap.name))} <small style="font-size:.45em;color:var(--muted)">${esc(ap.iata)}</small><em>.</em></h1><p class="lead">${esc(t.fromLead(ap.name, rows.length))}</p>
<div class="tiles">${tiles.join("")}</div>
<section><div class="tablewrap"><table><thead><tr><th>${esc(t.allDest)}</th><th>${esc(t.cat.Budget)}</th><th>${esc(t.cat["Best Value"])}</th><th>${esc(t.cat.Luxury)}</th></tr></thead><tbody>
${rows.map(({ c, d, code }) => `<tr><td><a href="${P(L, "/" + c.slug)}"><strong>${esc(c.city)}</strong></a><br><small>${esc(countryName(c, L))} · ✈ ${esc(code)}</small></td>${d.hotels.map((h) => `<td>${esc(h.name)}<br><small>${h.booking?.score?.toFixed(1) ?? "–"}/10 · ${money(h.offer?.nightly)}</small></td>`).join("")}</tr>`).join("")}
</tbody></table></div></section>
<section><h2>${esc(t.fromNav)}</h2><ul class="grid">${others.map(([k, a]) => `<li><a href="${P(L, `/from/${k}`)}">${esc(t.fromH1(a.name))} <span>${esc(a.iata)}</span></a></li>`).join("")}</ul></section>`;
	const ld = [{
		"@context": "https://schema.org",
		"@type": "ItemList",
		name: t.fromH1(ap.name),
		itemListElement: rows.map(({ c }, i) => ({
			"@type": "ListItem",
			position: i + 1,
			name: t.h1(c.city),
			url: `${SITE}${P(L, "/" + c.slug)}`
		}))
	}];
	const img = rows.find((r) => r.d.extras?.hero?.img)?.d.extras?.hero?.img;
	return page({
		L,
		title: t.fromTitle(ap.name),
		description: t.fromLead(ap.name, rows.length),
		path,
		body,
		ld,
		langs: true,
		...img ? { image: img } : {}
	});
}
var POPULAR = [
	"london",
	"paris",
	"rome",
	"barcelona",
	"amsterdam",
	"new-york",
	"lisbon",
	"copenhagen",
	"dubai",
	"tokyo",
	"malaga",
	"prague"
];
async function landingPage(L) {
	const { bySlug, byCountry } = await data();
	const t = T[L];
	const tiles = await Promise.all(POPULAR.map(async (s) => {
		const c = bySlug.get(s);
		const d = c ? await cityData(c.id) : null;
		return c && d ? tileFor(c, d.hotels[1], L) : "";
	}));
	const aps = Object.entries(await airports());
	const body = `<h1 style="margin-top:28px">${esc(t.homeH1)}<em>.</em></h1><p class="lead">${esc(t.lead())}</p>
<form class="find" action="/" method="get" role="search"><label><span>${esc(t.search)}</span><input name="city" required autocomplete="off" placeholder="London, Paris, Billund…"></label><button class="btn" type="submit">${esc(t.seeDates)}</button></form>
<section><h2>${esc(t.popular)}</h2><div class="tiles">${tiles.join("")}</div></section>
<section><h2>${esc(t.fromNav)}</h2><ul class="grid">${aps.map(([k, a]) => `<li><a href="${P(L, `/from/${k}`)}">${esc(t.fromH1(a.name))} <span>${esc(a.iata)}</span></a></li>`).join("")}</ul></section>
<section><h2>${esc(t.lists)}</h2><ul class="grid">${THEMES.map((th) => `<li><a href="${P(L, `/lists/${th}`)}">${esc(t.themes[th].title)}</a></li>`).join("")}</ul><p class="note"><a href="${P(L, "/destinations")}">${esc(t.destH1(byCountry.size))} →</a></p></section>`;
	return page({
		L,
		title: `Top3Hotels — ${t.footer}`,
		description: t.lead(),
		path: "/",
		body,
		langs: true
	});
}
function guideBlock(city, L) {
	const d = guides_default[city.slug]?.[L];
	if (!d || typeof d !== "object") return "";
	return `<section aria-labelledby="guide"><h2 id="guide">${esc(d.title)}</h2><p class="lead" style="margin-bottom:18px">${esc(d.intro)}</p>
<div><h3 class="serif" style="font-size:21px;margin:0 0 10px">${esc(d.areasTitle)}</h3><div class="hoods">${d.areas.map(([n, s, t]) => `<div class="hood"><b>${esc(n)}</b><small>${esc(s)}</small><p>${esc(t)}</p></div>`).join("")}</div></div>
<div class="guide"><div class="box"><h3>✈ ${esc(d.airTitle)}</h3><dl>${d.air.map(([a, b]) => `<div><dt>${esc(a)}</dt><dd>${esc(b)}</dd></div>`).join("")}</dl></div>
<div class="box"><h3>☀ ${esc(d.whenTitle)}</h3><p>${esc(d.when)}</p><h3>🚇 ${esc(d.aroundTitle)}</h3><p>${esc(d.around)}</p></div>
<div class="box"><h3>💡 ${esc(d.tipsTitle)}</h3><ul>${d.tips.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div></div></section>`;
}
function filmingBlock(city, L) {
	const z = Z[L];
	if (!guides_default[city.slug]?.filming) return "";
	return `<section><div class="collab"><div><h2>🎬 ${esc(z.filming(city.city))}</h2><p>${esc(z.filmingLead)}</p></div><a class="btn" href="mailto:${BRAND.email}?subject=${encodeURIComponent(`Top3Hotels ${city.city} filming — partnership`)}" data-t="collab_cta" data-city="${esc(city.slug)}">${esc(z.hotelsCta)} →</a></div></section>`;
}
function hotelsBlock(city, L) {
	const z = Z[L];
	return `<section><div class="forh"><div><h3>${esc(z.hotelsTitle(city.city))}</h3><p>${esc(z.hotelsLead)}</p></div><a class="btn ghost" href="/partners" data-t="collab_cta" data-city="${esc(city.slug)}">${esc(z.hotelsCta)} →</a></div></section>`;
}
function disclosurePage() {
	return page({
		L: "en",
		title: "Affiliate disclosure — Top3Hotels",
		description: "How Top3Hotels earns money: booking-partner commissions and labelled partner features. Our picks are never for sale.",
		path: "/affiliate-disclosure",
		body: `${crumbsEn("Affiliate disclosure")}<h1>Affiliate disclosure<em>.</em></h1><div class="prose">
<p>Top3Hotels is free to use. We earn money in three transparent ways:</p>
<ul><li><strong>Booking links.</strong> When you book through a link on our site (for example Booking.com, Hotels.com, Expedia, Agoda or Trip.com), we may receive a commission from that partner. You pay the same price.</li>
<li><strong>Labelled partner features.</strong> Hotels can pay or offer stays to be filmed and shown as a <em>Featured partner</em>. These features are always labelled and kept separate from our three picks.</li>
<li><strong>Badges and widgets.</strong> Hotels and blogs can embed our free badge or widget; this never affects the picks.</li></ul>
<h2>What never changes</h2><p>Our Budget, Best Value and Luxury picks are chosen by public rules: verified guest scores, number of reviews, location and reference price. No hotel can pay to become one of the three picks, and commissions have no influence on which hotel we choose. See <a href="/how-we-choose">how we choose</a>.</p>
<h2>Prices</h2><p>Prices shown are reference rates for 2 adults, 1 room, checked on the date shown on each page. They are not live quotes; always confirm the final price with the booking partner.</p>
<p class="muted">Operated by ${esc(BRAND.entity)} (${esc(BRAND.place)}). Questions: ${mail("Affiliate disclosure question")}.</p></div>`
	});
}
function newsBlock(L) {
	const y = Y[L];
	return `<section aria-labelledby="newsh"><div class="news"><div><h2 id="newsh">${esc(y.newsTitle)}</h2><p>${esc(y.newsLead)}</p></div><form data-news><input type="email" required autocomplete="email" placeholder="${esc(y.emailPh)}" aria-label="${esc(y.emailPh)}"><button class="btn" type="submit">${esc(y.newsBtn)}</button><p class="msg" role="status" style="width:100%;margin:4px 0 0;font-size:13px"></p></form></div></section>`;
}
function savedPage(L) {
	const y = Y[L];
	return page({
		L,
		title: `${y.savedTitle} — Top3Hotels`,
		description: y.savedLead,
		path: "/saved",
		noindex: true,
		langs: true,
		body: `<p class="crumbs"><a href="${P(L, "/")}">${esc(T[L].home)}</a> › ${esc(y.js["saved"])}</p><h1>${esc(y.savedTitle)}<em>.</em></h1><p class="lead">${esc(y.savedLead)}</p><section style="margin-top:26px"><div class="saved" data-savedpage></div></section><section hidden data-recent><h2>${esc(y.js["recent"])}</h2><div class="chipsrow"></div></section>`
	});
}
async function citiesJson() {
	const { index } = await data();
	const rows = index.map((c) => [
		c.slug,
		c.city,
		c.country,
		c.pop ?? 0
	]);
	return new Response(JSON.stringify(rows), { headers: {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "public, max-age=86400"
	} });
}
async function randomCity() {
	const { index } = await data();
	const top = [...index].sort((a, b) => (b.pop ?? 0) - (a.pop ?? 0)).slice(0, 300);
	const c = top[Math.floor(Math.random() * top.length)];
	return new Response(null, {
		status: 302,
		headers: {
			location: `/${c.slug}`,
			"cache-control": "no-store"
		}
	});
}
var cheapCache;
async function cheapRows() {
	if (cheapCache) return cheapCache;
	const { index } = await data();
	const out = [];
	for (const c of index) {
		const d = await cityData(c.id);
		const b = d?.hotels?.[0];
		if (d && b?.offer?.nightly && (b.booking?.score ?? 0) >= 7.5 && (b.booking?.count ?? 0) >= 50) out.push({
			c,
			b,
			v: d.hotels[1]
		});
	}
	out.sort((a, b) => a.b.offer.nightly - b.b.offer.nightly);
	cheapCache = out;
	return out;
}
async function cheapPage(L) {
	const y = Y[L], t = T[L];
	const rows = (await cheapRows()).slice(0, 250);
	const body = `<p class="crumbs"><a href="${P(L, "/")}">${esc(t.home)}</a> › ${esc(y.cheapNav)}</p><h1>${esc(y.cheapTitle)}<em>.</em></h1><p class="lead">${esc(y.cheapLead(rows.length))}</p>
<div class="filters" role="group"><button type="button" data-max="0" aria-pressed="true">${esc(y.all)}</button>${[
		25,
		35,
		45
	].map((n) => `<button type="button" data-max="${n}" aria-pressed="false">${esc(y.under)} €${n}</button>`).join("")}</div>
<div class="tablewrap"><table class="rank"><thead><tr><th>#</th><th>${esc(t.allDest)}</th><th>${esc(t.cat.Budget)}</th><th>${esc(t.cat["Best Value"])}</th></tr></thead><tbody>
${rows.map(({ c, b, v }, i) => `<tr data-price="${b.offer.nightly}"><td>${i + 1}</td><td><a href="${P(L, "/" + c.slug)}"><strong>${esc(c.city)}</strong></a><br><small>${esc(countryName(c, L))}</small></td><td>${esc(b.name)}<br><small>${b.booking?.score?.toFixed(1) ?? "–"}/10 · <b data-eur="${b.offer.nightly}"><span class="v">${money(b.offer.nightly)}</span></b> ${esc(t.perNight)}</small></td><td>${esc(v.name)}<br><small>${v.booking?.score?.toFixed(1) ?? "–"}/10 · <span data-eur="${v.offer?.nightly ?? ""}"><span class="v">${money(v.offer?.nightly)}</span></span></small></td></tr>`).join("")}
</tbody></table></div>${newsBlock(L)}`;
	const ld = [{
		"@context": "https://schema.org",
		"@type": "ItemList",
		name: y.cheapTitle,
		dateModified: SNAPSHOT_DATE,
		itemListElement: rows.slice(0, 50).map(({ c }, i) => ({
			"@type": "ListItem",
			position: i + 1,
			name: c.city,
			url: `${SITE}${P(L, "/" + c.slug)}`
		}))
	}];
	return page({
		L,
		title: `${y.cheapTitle} (2026) — Top3Hotels`,
		description: y.cheapLead(rows.length),
		path: "/cheap-cities",
		body,
		ld,
		langs: true
	});
}
async function comparePage(a, b, L) {
	const { bySlug } = await data();
	const ca = bySlug.get(a), cb = bySlug.get(b);
	if (!ca || !cb || a === b) return null;
	const [da, db] = await Promise.all([cityData(ca.id), cityData(cb.id)]);
	if (!da || !db) return null;
	const y = Y[L], t = T[L];
	const col = (c, d) => `<div><p class="eyebrow">${esc(countryName(c, L))}</p><h2><a href="${P(L, "/" + c.slug)}" style="color:inherit;text-decoration:none">${esc(c.city)}</a></h2>${d.hotels.map((h) => `<div class="row"><div><small>${esc(label(h, L))}</small><b>${esc(h.name)}</b><small>${esc(h.area ?? "")}</small></div><div class="pr"><b data-eur="${h.offer?.nightly ?? ""}"><span class="v">${money(h.offer?.nightly)}</span></b><small>${h.booking?.score?.toFixed(1) ?? "–"}/10 · ${fmtInt(h.booking?.count)}</small></div></div>`).join("")}<a class="btn ghost" style="width:100%;margin-top:10px" href="${P(L, "/" + c.slug)}">${esc(t.h1(c.city))} →</a></div>`;
	const body = `<p class="crumbs"><a href="${P(L, "/")}">${esc(t.home)}</a> › ${esc(y.jCompare)}</p><h1>${esc(y.vsTitle(ca.city, cb.city))}<em>.</em></h1><p class="lead">${esc(y.vsLead(ca.city, cb.city))}</p><section style="margin-top:26px"><div class="vs">${col(ca, da)}${col(cb, db)}</div></section>`;
	return page({
		L,
		title: `${y.vsTitle(ca.city, cb.city)} — Top3Hotels`,
		description: y.vsLead(ca.city, cb.city),
		path: `/compare/${a}/${b}`,
		body,
		noindex: true,
		langs: true
	});
}
async function embedPage(slug) {
	const { bySlug } = await data();
	const c = bySlug.get(slug);
	const d = c ? await cityData(c.id) : null;
	if (!c || !d) return null;
	const t = T.en;
	const items = d.hotels.map((h) => {
		const img = h.gallery?.find((g) => g.src)?.src;
		return `<a class="h ${catKey(h)}" href="${SITE}/${c.slug}#${catKey(h)}" target="_blank" rel="noopener">${img ? `<img src="${esc(img)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ""}<span class="t">${esc(label(h, "en"))}</span><strong>${esc(h.name)}</strong><small>${h.booking?.score?.toFixed(1) ?? "–"}/10 · ${money(h.offer?.nightly)} ${esc(t.perNight)}</small></a>`;
	}).join("");
	return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Top 3 hotels in ${esc(c.city)} · Top3Hotels</title><style>body{margin:0;font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;color:#10213a;background:#faf8f4}.w{padding:14px}.hd{display:flex;justify-content:space-between;align-items:baseline;margin:0 0 10px}.hd b{font:600 18px Georgia,serif}.hd a{color:#d83b51;font-size:12px;text-decoration:none;font-weight:600}.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}.h{display:flex;flex-direction:column;gap:3px;background:#fff;border:1px solid #e6e1d8;border-top:4px solid var(--c);border-radius:14px;overflow:hidden;color:#10213a;text-decoration:none;padding-bottom:10px}.h img{width:100%;aspect-ratio:3/2;object-fit:cover;background:#f2eee7}.h .t,.h strong,.h small{padding:0 10px}.h .t{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--c);margin-top:6px}.h strong{font:600 15px/1.25 Georgia,serif}.h small{color:#525d6b}.budget{--c:#1f7a5a}.value{--c:#d83b51}.lux{--c:#9a6b00}</style></head><body><div class="w"><div class="hd"><b>The 3 best hotels in ${esc(c.city)}</b><a href="${SITE}/${c.slug}" target="_blank" rel="noopener">top3hotels.com ↗</a></div><div class="g">${items}</div></div></body></html>`;
}
async function feedJson() {
	const { index } = await data();
	const top = [...index].sort((a, b) => (b.pop ?? 0) - (a.pop ?? 0)).slice(0, 100);
	const items = await Promise.all(top.map(async (c) => {
		const d = await cityData(c.id);
		return d ? {
			id: `${SITE}/${c.slug}`,
			url: `${SITE}/${c.slug}`,
			title: `The 3 best hotels in ${c.city}`,
			content_text: d.hotels.map((h) => `${label(h, "en")}: ${h.name} (${h.booking?.score ?? "–"}/10, ${money(h.offer?.nightly)} / night)`).join(" · "),
			date_modified: `${SNAPSHOT_DATE}T00:00:00Z`,
			...d.extras?.hero?.img ? { image: d.extras.hero.img } : {}
		} : null;
	}));
	return new Response(JSON.stringify({
		version: "https://jsonfeed.org/version/1.1",
		title: "Top3Hotels",
		home_page_url: SITE,
		feed_url: `${SITE}/feed.json`,
		items: items.filter(Boolean)
	}), { headers: {
		"content-type": "application/feed+json; charset=utf-8",
		"cache-control": "public, max-age=3600"
	} });
}
var HP_API = "https://gmdalfsvtfhzepyrdmjj.supabase.co/functions/v1/top3-seo-agent";
var HP_LANGS = ["en", "es"];
var hpSlugify = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
var hotelSlug = (name, citySlug) => `${hpSlugify(name)}-${citySlug}`.replace(/-+/g, "-");
var hpCache;
async function hotelPagesList() {
  if (hpCache && Date.now() - hpCache.at < 18e5) return hpCache.rows;
  try {
    const r = await fetch(`${HP_API}?action=list`, { cf: { cacheTtl: 1800, cacheEverything: true } });
    if (r.ok) hpCache = { at: Date.now(), rows: await r.json() };
  } catch {}
  return hpCache?.rows ?? [];
}
async function hotelPageData(slug) {
  try {
    const r = await fetch(`${HP_API}?action=get&slug=${encodeURIComponent(slug)}`, { cf: { cacheTtl: 3600, cacheEverything: true } });
    return r.ok ? await r.json() : null;
  } catch { return null; }
}
var HPT = {
  en: { home: "Home", review: "Review", book: "Check prices on Booking.com", faq: "Questions travellers ask", others: "Our other two picks in", all: "See all three picks in", updated: "Updated", by: "By the Top3Hotels editorial team. Based on Booking.com guest scores and reviews, location data and reference prices. We did not stay at this hotel.", per: "per night (reference)", score: "Guest score", reviews: "reviews", cat_budget: "Budget pick", cat_value: "Best Value pick", cat_lux: "Luxury pick", from: "chosen from", hotels: "hotels compared", disc: "We may earn a commission if you book. It never changes our pick.", altl: "Sold out on your dates? See the best available alternatives" },
  es: { home: "Inicio", review: "Análisis", book: "Ver precios en Booking.com", faq: "Preguntas frecuentes", others: "Nuestras otras dos elecciones en", all: "Ver los tres hoteles de", updated: "Actualizado", by: "Por el equipo editorial de Top3Hotels. Basado en puntuaciones y reseñas de Booking.com, datos de ubicación y precios de referencia. No nos hemos alojado en este hotel.", per: "por noche (referencia)", score: "Nota de huéspedes", reviews: "reseñas", cat_budget: "Elección económica", cat_value: "Elección calidad-precio", cat_lux: "Elección de lujo", from: "elegido entre", hotels: "hoteles comparados", disc: "Podemos ganar una comisión si reservas. Nunca cambia nuestra elección.", altl: "¿Sin disponibilidad en tus fechas? Ver alternativas disponibles" }
};
var CSS_HP = `.hp-facts{display:flex;flex-wrap:wrap;gap:8px 18px;margin:0 0 18px;font-size:15px;opacity:.9}.hp-facts b{font-weight:700}.hp-badge{display:inline-block;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:4px 10px;border-radius:999px;background:var(--pale,#eef3fa);margin:0 0 10px}
.hp-hero{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:14px;margin:6px 0 18px;background:#e5e8ee}.hp-verdict{font-size:19px;line-height:1.55;border-left:4px solid currentColor;padding:4px 0 4px 16px;margin:0 0 22px}
.hp-cta{display:block;text-align:center;font-weight:700;padding:14px 18px;border-radius:12px;background:#0b3b8c;color:#fff!important;text-decoration:none;margin:18px 0 6px}.hp-small{font-size:13px;opacity:.7;text-align:center;margin:0 0 6px}.hp-alt{display:block;text-align:center;font-size:14px;margin:0 0 22px}
.hp-faq details{border-top:1px solid rgba(127,127,127,.25);padding:12px 0}.hp-faq summary{font-weight:700;cursor:pointer;font-size:17px}.hp-others{display:grid;gap:10px;margin:10px 0 0;padding:0;list-style:none}.hp-others a{display:block;padding:12px 14px;border:1px solid rgba(127,127,127,.25);border-radius:12px;text-decoration:none}`;
async function hotelPage(slug, L) {
  if (!HP_LANGS.includes(L)) return null;
  const d = await hotelPageData(slug);
  const c = d?.content?.[L];
  if (!d || !c) return null;
  const f = d.facts ?? {};
  const t = HPT[L];
  const { bySlug } = await data();
  const city = bySlug.get(d.city_slug);
  const live = new Set((await hotelPagesList()).map((x) => x.slug));
  const bk = f.booking_url ? CJ_BOOKING(String(f.booking_url), "t3hotel") : null;
  const alt = altSearch(d.cat, f.nightly_eur, f.stars, { city: d.city, country: d.country });
  const others = (f.other_picks ?? []).map((o) => {
    const s2 = hotelSlug(o.name, d.city_slug);
    const href = live.has(s2) ? P(L, `/hotel/${s2}`) : P(L, `/${d.city_slug}`);
    return `<li><a href="${esc(href)}"><b>${esc(o.name)}</b> · ${esc(o.category)}${o.score ? ` · ${o.score.toFixed(1)}/10` : ""}${o.nightly_eur ? ` · ${money(o.nightly_eur)}` : ""}</a></li>`;
  });
  const upd = (d.updated_at || d.published_at || "").slice(0, 10);
  const path = `/hotel/${slug}`;
  const facts = [
    f.score ? `<span>${esc(t.score)} <b>${Number(f.score).toFixed(1)}</b>/10${f.reviews ? ` · ${fmtInt(f.reviews)} ${esc(t.reviews)}` : ""}</span>` : "",
    f.stars ? `<span>${"★".repeat(Number(f.stars))}</span>` : "",
    f.nightly_eur ? `<span><b>${money(f.nightly_eur)}</b> ${esc(t.per)}</span>` : "",
    f.area ? `<span>${esc(f.area)}, ${esc(d.city)}</span>` : "",
    f.candidates_compared ? `<span>${esc(t.from)} ${fmtInt(f.candidates_compared)} ${esc(t.hotels)}</span>` : ""
  ].filter(Boolean).join("");
  const cta = bk ? `<a class="hp-cta" href="${esc(bk)}" rel="sponsored nofollow noopener" target="_blank" data-t="check_availability" data-city="${esc(d.city_slug)}" data-cat="${esc(d.cat)}" data-p="hotel-page">${esc(t.book)} ↗</a><p class="hp-small">${esc(t.disc)}</p><a class="hp-alt" href="${esc(alt)}" rel="sponsored nofollow noopener" target="_blank" data-t="alt_click" data-city="${esc(d.city_slug)}" data-cat="${esc(d.cat)}" data-p="hotel-page-alt">${esc(t.altl)} →</a>` : "";
  const body = `<style>${CSS_BLOG}${CSS_HP}</style><article class="post">
<nav class="crumbs"><a href="${P(L, "/")}">${esc(t.home)}</a> › <a href="${P(L, `/${d.city_slug}`)}">${esc(d.city)}</a> › ${esc(f.name)}</nav>
<span class="hp-badge">${esc(t[`cat_${d.cat}`] ?? d.cat)} · ${esc(d.city)}</span>
<h1>${esc(f.name)}</h1>
<p class="by">${esc(t.by)} ${esc(t.updated)} ${esc(upd)}.</p>
${f.photo ? `<img class="hp-hero" src="${esc(f.photo)}" alt="${esc(f.name)}, ${esc(d.city)}" loading="eager" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}
<div class="hp-facts">${facts}</div>
<p class="hp-verdict">${esc(c.verdict)}</p>
${cta}
${(c.sections ?? []).map((x) => `<h2>${esc(x.h)}</h2>${(x.p ?? []).map((pp) => `<p>${esc(pp)}</p>`).join("")}`).join("\n")}
${cta}
<h2>${esc(t.faq)}</h2><div class="hp-faq">${(c.faq ?? []).map((q) => `<details><summary>${esc(q.q)}</summary><p>${esc(q.a)}</p></details>`).join("")}</div>
<h2>${esc(t.others)} ${esc(d.city)}</h2><ul class="hp-others">${others.join("")}<li><a href="${P(L, `/${d.city_slug}`)}">${esc(t.all)} ${esc(d.city)} →</a></li></ul>
</article>`;
  const ld = [
    { "@context": "https://schema.org", "@type": "Hotel", name: f.name, url: SITE + P(L, path), ...(f.photo ? { image: f.photo } : {}),
      address: { "@type": "PostalAddress", ...(f.address ? { streetAddress: f.address } : {}), addressLocality: d.city, addressCountry: city?.cc || d.country },
      ...(f.lat ? { geo: { "@type": "GeoCoordinates", latitude: f.lat, longitude: f.lng } } : {}),
      ...(f.stars ? { starRating: { "@type": "Rating", ratingValue: f.stars } } : {}),
      ...(f.nightly_eur ? { priceRange: `€${Math.round(f.nightly_eur)} per night (reference)` } : {}) },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: (c.faq ?? []).map((q) => ({ "@type": "Question", name: q.q, acceptedAnswer: { "@type": "Answer", text: q.a } })) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: t.home, item: SITE + P(L, "/") },
      { "@type": "ListItem", position: 2, name: d.city, item: SITE + P(L, `/${d.city_slug}`) },
      { "@type": "ListItem", position: 3, name: f.name, item: SITE + P(L, path) }
    ] }
  ];
  return page({ L, title: `${c.title} | Top3Hotels`, description: c.meta, path, body, ld, alts: HP_LANGS, image: f.photo || void 0 });
}
async function hotelSitemap() {
  const rows = await hotelPagesList();
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${rows.flatMap((r) => HP_LANGS.map((L) => `<url><loc>${SITE}${P(L, `/hotel/${r.slug}`)}</loc><lastmod>${(r.published_at ?? "").slice(0, 10)}</lastmod>${HP_LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${SITE}${P(l, `/hotel/${r.slug}`)}"/>`).join("")}</url>`)).join("\n")}\n</urlset>\n`;
}

async function sitemapFor(L) {
	const { index, byCountry } = await data();
	const paths = [
		"/",
		"/destinations",
		"/lists",
		"/cheap-cities",
		"/map",
		"/press",
		...Object.keys(await airports()).map((k) => `/from/${k}`),
		...THEMES.map((t) => `/lists/${t}`),
		...EVENTS.map((e) => `/lists/${e.slug}`),
		...[...byCountry.keys()].map((c) => `/country/${c}`),
		...index.map((c) => `/${c.slug}`)
	];
	const extra = L === "en" ? [
		"/about",
		"/how-we-choose",
		"/partners",
		"/contact",
		"/privacy",
		"/cookies",
		"/terms",
		"/imprint",
		"/affiliate-disclosure",
		"/guides",
		...POSTS.map((x) => `/guides/${x.slug}`)
	].map((p) => `<url><loc>${SITE}${p}</loc><lastmod>${SNAPSHOT_DATE}</lastmod></url>`).join("\n") + "\n" : "";
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${paths.map((p) => `<url><loc>${SITE}${P(L, p)}</loc><lastmod>${SNAPSHOT_DATE}</lastmod>${LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${SITE}${P(l, p)}"/>`).join("")}</url>`).join("\n")}\n${extra}</urlset>\n`;
}
var sitemapIndex = () => `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${LANGS.map((l) => `<sitemap><loc>${SITE}/sitemap-${l}.xml</loc><lastmod>${SNAPSHOT_DATE}</lastmod></sitemap>`).join("\n")}\n<sitemap><loc>${SITE}/sitemap-hotels.xml</loc></sitemap>\n</sitemapindex>\n`;
var ROBOTS = `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE}/sitemap.xml\n`;
function envVar(env, k) {
	const v = env && env[k] || globalThis.process?.env?.[k];
	return typeof v === "string" && v ? v : void 0;
}
async function alerts(request, env) {
	const key = envVar(env, "RESEND_API_KEY");
	const audience = envVar(env, "RESEND_AUDIENCE_ID");
	const res = (o, s = 200) => new Response(JSON.stringify(o), {
		status: s,
		headers: { "content-type": "application/json" }
	});
	if (request.method === "GET") return res({ enabled: Boolean(key && audience) });
	if (!key || !audience) return res({ error: "alerts_not_configured" }, 503);
	let body;
	try {
		body = await request.json();
	} catch {
		return res({ error: "bad_json" }, 400);
	}
	const email = String(body.email ?? "").trim().toLowerCase();
	if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 200) return res({ error: "bad_email" }, 400);
	const city = String(body.city ?? "").slice(0, 80);
	const category = String(body.category ?? "").slice(0, 20);
	const max = Math.max(1, Math.min(1e5, Math.round(Number(body.max) || 0)));
	return (await fetch(`https://api.resend.com/audiences/${audience}/contacts`, {
		method: "POST",
		headers: {
			authorization: `Bearer ${key}`,
			"content-type": "application/json"
		},
		body: JSON.stringify({
			email,
			unsubscribed: false,
			first_name: `${city}|${category}|${max}`
		})
	})).ok ? res({ ok: true }) : res({ error: "provider_error" }, 502);
}
async function handleSeo(request, env) {
	const url = new URL(request.url);
	let p = url.pathname;
	if (p === "/api/alerts") return alerts(request, env);
	if (request.method !== "GET" && request.method !== "HEAD") return null;
	if (p === "/sitemap.xml") return new Response(sitemapIndex(), { headers: {
		"content-type": "application/xml; charset=utf-8",
		"cache-control": "public, max-age=3600"
	} });
	if (p === "/sitemap-hotels.xml") return new Response(await hotelSitemap(), { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
	const sm = p.match(/^\/sitemap-([a-z]{2})\.xml$/);
	if (sm && isLang(sm[1])) return new Response(await sitemapFor(sm[1]), { headers: {
		"content-type": "application/xml; charset=utf-8",
		"cache-control": "public, max-age=3600"
	} });
	if (p === "/robots.txt") return new Response(ROBOTS, { headers: {
		"content-type": "text/plain; charset=utf-8",
		"cache-control": "public, max-age=3600"
	} });
	const im = p.match(/^\/api\/(?:thumb\/([^/]+)|img\/([^/]+)\/(big|mid|small|thumb|orig))$/);
	if (im) {
		const { cx } = await data();
		const id = decodeURIComponent(im[1] ?? im[2]);
		const size = im[1] ? "thumb" : im[3];
		const h = cx[id]?.hero;
		const src = h ? size === "thumb" ? h.thumb : size === "orig" ? h.orig ?? h.img : size === "mid" || size === "small" ? h.img.replace("/1280px-", size === "mid" ? "/960px-" : "/500px-") : h.img : void 0;
		const up = src ? await fetch(src, {
			headers: { "user-agent": "Top3HotelsBot/1.1 (https://www.top3hotels.com)" },
			cf: {
				cacheEverything: true,
				cacheTtl: 2592e3
			}
		}).catch(() => null) : null;
		if (up && up.ok && (up.headers.get("content-type") ?? "").startsWith("image/")) return new Response(up.body, { headers: {
			"content-type": up.headers.get("content-type"),
			"cache-control": "public, max-age=2592000, immutable"
		} });
		if (size === "thumb") return new Response("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"40\" height=\"30\"><rect width=\"40\" height=\"30\" rx=\"6\" fill=\"#dfe8f2\"/><path d=\"M8 24l8-9 6 6 4-4 6 7z\" fill=\"#9fb3c8\"/></svg>", { headers: {
			"content-type": "image/svg+xml",
			"cache-control": "public, max-age=86400"
		} });
		return new Response(null, {
			status: 404,
			headers: { "cache-control": "public, max-age=3600" }
		});
	}
	if (p === "/api/geo") return geo(request);
	if (p === "/api/cities.json") return citiesJson();
	if (p === "/api/rates") {
		const FALLBACK = {
			GBP: .86,
			USD: 1.08,
			DKK: 7.46,
			SEK: 11.4,
			NOK: 11.6,
			CHF: .94
		};
		let rates = FALLBACK;
		try {
			const r = await fetch("https://api.frankfurter.dev/v1/latest?base=EUR&symbols=GBP,USD,DKK,SEK,NOK,CHF", { cf: {
				cacheEverything: true,
				cacheTtl: 43200
			} });
			if (r.ok) rates = (await r.json()).rates ?? FALLBACK;
		} catch {}
		return new Response(JSON.stringify({ rates }), { headers: {
			"content-type": "application/json",
			"cache-control": "public, max-age=43200"
		} });
	}
	if (p === "/random") return randomCity();
	if (p === "/api/map.json") return mapJson();
	if (p === "/manifest.webmanifest") return new Response(MANIFEST, { headers: {
		"content-type": "application/manifest+json",
		"cache-control": "public, max-age=86400"
	} });
	if (p === "/sw.js") return new Response(SW_JS, { headers: {
		"content-type": "text/javascript; charset=utf-8",
		"cache-control": "no-cache"
	} });
	if (p === "/press") return html(await pressPage());
	if (p === "/32dc9044fbd94643bf577cc240a9a384.txt") return new Response("32dc9044fbd94643bf577cc240a9a384", { headers: { "content-type": "text/plain; charset=utf-8" } });
	if (p === "/guides") return html(guidesIndex());
	const gd = p.match(/^\/guides\/([a-z0-9-]+)$/);
	if (gd) {
		const out = guidePage(gd[1]);
		return out ? html(out) : null;
	}
	const sl = p.match(/^\/l(?:\/([^/]*))?\/?$/);
	if (sl) return Response.redirect(`${SITE}/${sl[1] ? encodeURIComponent(sl[1].toLowerCase()) : ""}`, 301);
	if (p === "/feed.json") return feedJson();
	const em = p.match(/^\/embed\/([a-z0-9-]+)\/?$/);
	if (em) {
		const out = await embedPage(em[1]);
		return out ? new Response(out, { headers: {
			"content-type": "text/html; charset=utf-8",
			"cache-control": "public, max-age=3600, s-maxage=86400"
		} }) : new Response("not found", { status: 404 });
	}
	const bd = p.match(/^\/badge\/([a-z0-9-]+)\/(budget|value|lux)\.svg$/);
	if (bd) {
		const svg = await badgeSvg(bd[1], bd[2]);
		return svg ? new Response(svg, { headers: {
			"content-type": "image/svg+xml; charset=utf-8",
			"cache-control": "public, max-age=86400",
			"access-control-allow-origin": "*"
		} }) : new Response("not found", { status: 404 });
	}
	if (p.startsWith("/api/catalogue/")) {
		const d = await cityData(decodeURIComponent(p.slice(15)));
		if (!d) return new Response("{\"error\":\"not_found\"}", {
			status: 404,
			headers: { "content-type": "application/json" }
		});
		return new Response(JSON.stringify(d), { headers: {
			"content-type": "application/json; charset=utf-8",
			"cache-control": "public, max-age=3600, s-maxage=86400"
		} });
	}
	let L = "en";
	const lm = p.match(/^\/(es|de|fr|it|pt|da)(\/.*)?$/);
	if (lm) {
		L = lm[1];
		p = lm[2] || "/";
		if (p === "/") return html(await landingPage(L));
	}
	const enp = {
		"/about": aboutPage,
		"/how-we-choose": methodPage,
		"/partners": partnersPage,
		"/partners/media-kit": mediaKitPage,
		"/contact": contactPage,
		"/privacy": () => legalPage("privacy"),
		"/cookies": () => legalPage("cookies"),
		"/terms": () => legalPage("terms"),
		"/imprint": () => legalPage("imprint"),
		"/affiliate-disclosure": disclosurePage
	}[p.replace(/\/$/, "") || "/"];
	if (enp) {
		if (L !== "en" || p.endsWith("/") && p !== "/") return Response.redirect(SITE + p.replace(/\/$/, ""), 301);
		return html(await enp());
	}
	if (p === "/destinations" || p === "/destinations/") {
		if (p.endsWith("/")) return Response.redirect(SITE + P(L, "/destinations"), 301);
		return html(await destinationsPage(L));
	}
	if (p === "/lists" || p === "/lists/") return html(await listsIndex(L));
	if (p === "/saved") return html(savedPage(L), 200, "public, max-age=3600");
	if (p === "/map") return html(mapPage(L));
	if (p === "/cheap-cities") return html(await cheapPage(L));
	const vs = p.match(/^\/compare\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/);
	if (vs) {
		const out = await comparePage(vs[1], vs[2], L);
		return out ? html(out) : html(notFoundPage(p, L), 404, "no-store");
	}
	const fr = p.match(/^\/from\/([a-z]+)\/?$/);
	if (fr) {
		const out = await fromPage(fr[1], L);
		return out ? html(out) : html(notFoundPage(p, L), 404, "no-store");
	}
	const lst = p.match(/^\/lists\/([a-z0-9-]+)\/?$/);
	if (lst) {
		const k = lst[1];
		if (THEMES.includes(k)) return html(await themePage(k, L));
		const ev = await eventPage(k, L);
		return ev ? html(ev) : html(notFoundPage(p, L), 404, "no-store");
	}
	const hp = p.match(/^\/hotel\/([a-z0-9-]+)\/?$/);
	if (hp) {
		if (!HP_LANGS.includes(L)) return Response.redirect(`${SITE}/hotel/${hp[1]}`, 302);
		const out = await hotelPage(hp[1], L);
		return out ? html(out, 200, "public, max-age=1800, s-maxage=21600") : html(notFoundPage(p, L), 404, "no-store");
	}
	const country = p.match(/^\/country\/([a-z0-9-]+)\/?$/);
	if (country) {
		const out = await countryPage(country[1], L);
		return out ? html(out) : html(notFoundPage(p, L), 404, "no-store");
	}
	const m = p.match(/^\/([^/.]+)\/?$/);
	if (!m) return null;
	const raw = decodeURIComponent(m[1]);
	const slug = raw.toLowerCase();
	const { bySlug, byId } = await data();
	const city = bySlug.get(slug);
	if (city && (raw !== slug || p.endsWith("/"))) return Response.redirect(`${SITE}${P(L, "/" + slug)}${url.search}`, 301);
	if (!city) {
		const ex = ALIASES[slug.normalize("NFD").replace(/[\u0300-\u036f]/g, "")];
		const legacy = byId.get(slug) ?? (ex ? bySlug.get(ex) ?? byId.get(ex) : void 0) ?? (await data()).index.find((c) => c.alias === slug);
		if (legacy) return Response.redirect(`${SITE}${P(L, "/" + legacy.slug)}${url.search}`, 301);
		return html(notFoundPage(p, L), 404, "no-store");
	}
	const out = await cityPage(city, L);
	return out ? html(out) : html(notFoundPage(p, L), 404, "no-store");
}
var serverEntryPromise;
async function getServerEntry() {
	if (!serverEntryPromise) serverEntryPromise = import("./server-ucyGQcD-.mjs").then((m) => m.default ?? m);
	return serverEntryPromise;
}
async function normalizeCatastrophicSsrResponse(response) {
	if (response.status < 500) return response;
	if (!(response.headers.get("content-type") ?? "").includes("application/json")) return response;
	const body = await response.clone().text();
	if (!isH3SwallowedErrorBody(body)) return response;
	console.error(consumeLastCapturedError() ?? /* @__PURE__ */ new Error(`h3 swallowed SSR error: ${body}`));
	return new Response(renderErrorPage(), {
		status: 500,
		headers: { "content-type": "text/html; charset=utf-8" }
	});
}
function isH3SwallowedErrorBody(body) {
	try {
		const payload = JSON.parse(body);
		return payload.unhandled === true && payload.message === "HTTPError";
	} catch {
		return false;
	}
}
var server_default = { async fetch(request, env, ctx) {
	try {
		const url = new URL(request.url);
		const readRequest = request.method === "GET" || request.method === "HEAD";
		if (url.pathname === "/top3hotels.html" && readRequest) return Response.redirect(new URL("/" + url.search, url).href, 301);
		if (url.pathname === "/" && readRequest) {
			const html = request.method === "HEAD" ? null : (await import("./home-BbuBgX6A.mjs")).default;
			return new Response(html, {
				status: 200,
				headers: {
					"content-type": "text/html; charset=utf-8",
					"cache-control": "public, max-age=0, must-revalidate"
				}
			});
		}
		const seo = await handleSeo(request, env);
		if (seo) return seo;
		return await normalizeCatastrophicSsrResponse(await (await getServerEntry()).fetch(request, env, ctx));
	} catch (error) {
		console.error(error);
		return new Response(renderErrorPage(), {
			status: 500,
			headers: { "content-type": "text/html; charset=utf-8" }
		});
	}
} };
//#endregion
export { server_default as default, renderErrorPage as t };
