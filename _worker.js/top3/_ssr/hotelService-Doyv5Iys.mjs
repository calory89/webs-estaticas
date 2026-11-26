//#region node_modules/.nitro/vite/services/ssr/assets/hotelService-Doyv5Iys.js
/**
* Seeded destinations. Maps directly to a future `cities` table.
* `aliases` is search-only sugar and would live in a separate search index.
*/
var CITIES = [
	{
		id: "city_rome",
		name: "Rome",
		slug: "rome",
		country: "Italy",
		countryCode: "IT",
		latitude: 41.8931,
		longitude: 12.4828,
		heroImage: "hotel-luxury-1",
		active: true
	},
	{
		id: "city_paris",
		name: "Paris",
		slug: "paris",
		country: "France",
		countryCode: "FR",
		latitude: 48.8566,
		longitude: 2.3522,
		heroImage: "hotel-budget-1",
		active: true
	},
	{
		id: "city_barcelona",
		name: "Barcelona",
		slug: "barcelona",
		country: "Spain",
		countryCode: "ES",
		latitude: 41.3874,
		longitude: 2.1686,
		heroImage: "hotel-value-1",
		active: true
	},
	{
		id: "city_london",
		name: "London",
		slug: "london",
		country: "United Kingdom",
		countryCode: "GB",
		latitude: 51.5072,
		longitude: -.1276,
		heroImage: "hotel-luxury-2",
		active: true
	},
	{
		id: "city_amsterdam",
		name: "Amsterdam",
		slug: "amsterdam",
		country: "Netherlands",
		countryCode: "NL",
		latitude: 52.3676,
		longitude: 4.9041,
		heroImage: "hotel-budget-2",
		active: true
	},
	{
		id: "city_lisbon",
		name: "Lisbon",
		slug: "lisbon",
		country: "Portugal",
		countryCode: "PT",
		latitude: 38.7223,
		longitude: -9.1393,
		heroImage: "hotel-value-2",
		active: true
	},
	{
		id: "city_new_york",
		name: "New York",
		slug: "new-york",
		country: "United States",
		countryCode: "US",
		latitude: 40.7128,
		longitude: -74.006,
		heroImage: "hotel-luxury-2",
		active: true
	},
	{
		id: "city_tokyo",
		name: "Tokyo",
		slug: "tokyo",
		country: "Japan",
		countryCode: "JP",
		latitude: 35.6762,
		longitude: 139.6503,
		heroImage: "hotel-budget-2",
		active: true
	},
	{
		id: "city_istanbul",
		name: "Istanbul",
		slug: "istanbul",
		country: "Türkiye",
		countryCode: "TR",
		latitude: 41.0082,
		longitude: 28.9784,
		heroImage: "hotel-value-1",
		active: true
	},
	{
		id: "city_dubai",
		name: "Dubai",
		slug: "dubai",
		country: "United Arab Emirates",
		countryCode: "AE",
		latitude: 25.2048,
		longitude: 55.2708,
		heroImage: "hotel-luxury-2",
		active: true
	},
	{
		id: "city_bangkok",
		name: "Bangkok",
		slug: "bangkok",
		country: "Thailand",
		countryCode: "TH",
		latitude: 13.7563,
		longitude: 100.5018,
		heroImage: "hotel-value-2",
		active: true
	},
	{
		id: "city_mexico_city",
		name: "Mexico City",
		slug: "mexico-city",
		country: "Mexico",
		countryCode: "MX",
		latitude: 19.4326,
		longitude: -99.1332,
		heroImage: "hotel-budget-1",
		active: true
	}
];
/** Local-language and common alternative spellings, for instant autocomplete. */
var CITY_ALIASES = {
	rome: ["roma"],
	paris: ["paname"],
	barcelona: ["barna", "bcn"],
	london: ["londres"],
	lisbon: ["lisboa"],
	"new-york": [
		"nyc",
		"new york city",
		"manhattan"
	],
	tokyo: ["tokio"],
	istanbul: ["constantinople"],
	"mexico-city": ["cdmx", "ciudad de mexico"],
	amsterdam: ["ams"]
};
var FEATURED_CITY_SLUGS = [
	"rome",
	"paris",
	"tokyo",
	"new-york",
	"barcelona",
	"lisbon"
];
/**
* DEMO SEED DATA — indicative only.
*
* Prices, review scores and review counts below are realistic placeholders for
* product demonstration. They are NOT live Booking.com data and are not price
* guarantees. Once the supplier integration exists, this file is replaced by a
* `hotels` table refreshed by the ranking job in `src/lib/ranking.ts`.
*
* Invariant: exactly one active hotel per (cityId, category).
*/
var LAST_CHECKED = "2026-09-15T06:00:00.000Z";
var seeds = [
	{
		id: "hotel_rome_budget",
		cityId: "city_rome",
		name: "Casa Monti Rione",
		slug: "casa-monti-rione",
		category: "budget",
		imageUrl: "hotel-budget-1",
		latitude: 41.8955,
		longitude: 12.4919,
		priceFrom: 96,
		currency: "EUR",
		rating: 9.1,
		reviewCount: 2140,
		stars: 3,
		neighborhood: "Monti",
		shortReason: "A small, spotless guesthouse a seven-minute walk from the Colosseum, with review scores that beat hotels costing twice as much.",
		attributes: [
			"Free breakfast",
			"7 min walk to Colosseum",
			"Air conditioning"
		]
	},
	{
		id: "hotel_rome_value",
		cityId: "city_rome",
		name: "Palazzo Arenula Suites",
		slug: "palazzo-arenula-suites",
		category: "best_value",
		imageUrl: "hotel-value-1",
		latitude: 41.8944,
		longitude: 12.4749,
		priceFrom: 189,
		currency: "EUR",
		rating: 9.4,
		reviewCount: 3860,
		stars: 4,
		neighborhood: "Centro Storico",
		shortReason: "Quiet courtyard rooms in a restored palazzo between Campo de' Fiori and Trastevere — the strongest quality-per-euro in central Rome.",
		attributes: [
			"Courtyard breakfast",
			"Walk to Pantheon",
			"Free cancellation"
		]
	},
	{
		id: "hotel_rome_luxury",
		cityId: "city_rome",
		name: "Terrazza Borghese Roma",
		slug: "terrazza-borghese-roma",
		category: "luxury",
		imageUrl: "hotel-luxury-1",
		latitude: 41.9065,
		longitude: 12.4853,
		priceFrom: 620,
		currency: "EUR",
		rating: 9.6,
		reviewCount: 1490,
		stars: 5,
		neighborhood: "Ludovisi",
		shortReason: "Rooftop pool and a dome-filled skyline above Via Veneto, at a nightly rate well below Rome's other five-star terraces.",
		attributes: [
			"Rooftop pool",
			"Spa access",
			"24h concierge"
		]
	},
	{
		id: "hotel_paris_budget",
		cityId: "city_paris",
		name: "Hôtel Batignolles Petit",
		slug: "hotel-batignolles-petit",
		category: "budget",
		imageUrl: "hotel-budget-2",
		latitude: 48.8874,
		longitude: 2.3195,
		priceFrom: 112,
		currency: "EUR",
		rating: 8.9,
		reviewCount: 3210,
		stars: 3,
		neighborhood: "Batignolles",
		shortReason: "A neighbourhood hotel with genuinely quiet rooms, two metro stops from Saint-Lazare and priced like a hostel.",
		attributes: [
			"Metro 2 min",
			"Soundproofed rooms",
			"Free Wi-Fi"
		]
	},
	{
		id: "hotel_paris_value",
		cityId: "city_paris",
		name: "Maison Saint-Germain 7e",
		slug: "maison-saint-germain-7e",
		category: "best_value",
		imageUrl: "hotel-value-2",
		latitude: 48.8543,
		longitude: 2.3255,
		priceFrom: 232,
		currency: "EUR",
		rating: 9.3,
		reviewCount: 2780,
		stars: 4,
		neighborhood: "Saint-Germain-des-Prés",
		shortReason: "Left Bank address, warm service and full breakfast included — the rare Saint-Germain hotel that still reads as fair value.",
		attributes: [
			"Breakfast included",
			"Left Bank location",
			"Family rooms"
		]
	},
	{
		id: "hotel_paris_luxury",
		cityId: "city_paris",
		name: "Le Quai Voltaire Grand",
		slug: "le-quai-voltaire-grand",
		category: "luxury",
		imageUrl: "hotel-luxury-2",
		latitude: 48.8587,
		longitude: 2.3343,
		priceFrom: 760,
		currency: "EUR",
		rating: 9.5,
		reviewCount: 980,
		stars: 5,
		neighborhood: "Quai Voltaire",
		shortReason: "Seine-facing suites and a Michelin-starred dining room, consistently rated above palace hotels charging twice the rate.",
		attributes: [
			"Seine-view suites",
			"Michelin dining",
			"Spa & pool"
		]
	},
	{
		id: "hotel_barcelona_budget",
		cityId: "city_barcelona",
		name: "Gràcia Llum Rooms",
		slug: "gracia-llum-rooms",
		category: "budget",
		imageUrl: "hotel-budget-1",
		latitude: 41.4022,
		longitude: 2.1562,
		priceFrom: 84,
		currency: "EUR",
		rating: 9,
		reviewCount: 1870,
		stars: 3,
		neighborhood: "Gràcia",
		shortReason: "Bright, simple rooms on a Gràcia square — local, safe and a short metro ride from everything tourists come for.",
		attributes: [
			"Rooftop terrace",
			"Metro 4 min",
			"Free cancellation"
		]
	},
	{
		id: "hotel_barcelona_value",
		cityId: "city_barcelona",
		name: "Eixample Nou Hotel",
		slug: "eixample-nou-hotel",
		category: "best_value",
		imageUrl: "hotel-value-1",
		latitude: 41.3918,
		longitude: 2.1638,
		priceFrom: 168,
		currency: "EUR",
		rating: 9.2,
		reviewCount: 4240,
		stars: 4,
		neighborhood: "Eixample",
		shortReason: "Rooftop plunge pool, walkable to Passeig de Gràcia, and one of the highest-reviewed four-stars in the city centre.",
		attributes: [
			"Rooftop pool",
			"Walk to Sagrada Família",
			"Breakfast buffet"
		]
	},
	{
		id: "hotel_barcelona_luxury",
		cityId: "city_barcelona",
		name: "Diagonal Mar Collection",
		slug: "diagonal-mar-collection",
		category: "luxury",
		imageUrl: "hotel-luxury-2",
		latitude: 41.3851,
		longitude: 2.1934,
		priceFrom: 520,
		currency: "EUR",
		rating: 9.5,
		reviewCount: 2050,
		stars: 5,
		neighborhood: "Barceloneta",
		shortReason: "Sea-view suites and a full spa a few minutes from the Gothic Quarter, with service scores that hold up year-round.",
		attributes: [
			"Sea-view suites",
			"Full spa",
			"Beach access"
		]
	},
	{
		id: "hotel_london_budget",
		cityId: "city_london",
		name: "Bloomsbury Row House",
		slug: "bloomsbury-row-house",
		category: "budget",
		imageUrl: "hotel-budget-2",
		latitude: 51.5223,
		longitude: -.1275,
		priceFrom: 119,
		currency: "GBP",
		rating: 8.8,
		reviewCount: 5120,
		stars: 3,
		neighborhood: "Bloomsbury",
		shortReason: "Compact but properly maintained rooms in a Georgian terrace, walking distance to the British Museum and three Tube lines.",
		attributes: [
			"Walk to British Museum",
			"3 Tube lines",
			"Luggage storage"
		]
	},
	{
		id: "hotel_london_value",
		cityId: "city_london",
		name: "Southbank Wharf Hotel",
		slug: "southbank-wharf-hotel",
		category: "best_value",
		imageUrl: "hotel-value-2",
		latitude: 51.5052,
		longitude: -.1067,
		priceFrom: 214,
		currency: "GBP",
		rating: 9.2,
		reviewCount: 6380,
		stars: 4,
		neighborhood: "South Bank",
		shortReason: "River-walk location, large rooms for London, and flexible rates — the most reliable central pick under £250.",
		attributes: [
			"River walk",
			"Large rooms",
			"Free cancellation"
		]
	},
	{
		id: "hotel_london_luxury",
		cityId: "city_london",
		name: "Mayfair Audley House",
		slug: "mayfair-audley-house",
		category: "luxury",
		imageUrl: "hotel-luxury-2",
		latitude: 51.5101,
		longitude: -.1487,
		priceFrom: 690,
		currency: "GBP",
		rating: 9.5,
		reviewCount: 1320,
		stars: 5,
		neighborhood: "Mayfair",
		shortReason: "A discreet Mayfair townhouse hotel with butler-level service, rated higher than neighbours charging £1,200 a night.",
		attributes: [
			"Townhouse suites",
			"Personal concierge",
			"Hyde Park 6 min"
		]
	},
	{
		id: "hotel_amsterdam_budget",
		cityId: "city_amsterdam",
		name: "De Pijp Canal Rooms",
		slug: "de-pijp-canal-rooms",
		category: "budget",
		imageUrl: "hotel-budget-1",
		latitude: 52.3547,
		longitude: 4.8939,
		priceFrom: 108,
		currency: "EUR",
		rating: 8.9,
		reviewCount: 2460,
		stars: 3,
		neighborhood: "De Pijp",
		shortReason: "Canal-side rooms in Amsterdam's best eating neighbourhood, at roughly half the going rate inside the ring.",
		attributes: [
			"Canal views",
			"Bike rental",
			"Tram 3 min"
		]
	},
	{
		id: "hotel_amsterdam_value",
		cityId: "city_amsterdam",
		name: "Grachten Nine Hotel",
		slug: "grachten-nine-hotel",
		category: "best_value",
		imageUrl: "hotel-value-1",
		latitude: 52.3705,
		longitude: 4.8837,
		priceFrom: 196,
		currency: "EUR",
		rating: 9.3,
		reviewCount: 3110,
		stars: 4,
		neighborhood: "Nine Streets",
		shortReason: "Three restored canal houses in the Nine Streets, with breakfast included and the highest guest scores in the district.",
		attributes: [
			"Canal house rooms",
			"Breakfast included",
			"Central location"
		]
	},
	{
		id: "hotel_amsterdam_luxury",
		cityId: "city_amsterdam",
		name: "Museumkwartier Grand",
		slug: "museumkwartier-grand",
		category: "luxury",
		imageUrl: "hotel-luxury-1",
		latitude: 52.3584,
		longitude: 4.8811,
		priceFrom: 495,
		currency: "EUR",
		rating: 9.4,
		reviewCount: 1180,
		stars: 5,
		neighborhood: "Museum Quarter",
		shortReason: "Garden suites next to the Rijksmuseum with a proper spa — quiet, grown-up luxury without canal-belt noise.",
		attributes: [
			"Garden suites",
			"Spa & sauna",
			"Next to Rijksmuseum"
		]
	},
	{
		id: "hotel_lisbon_budget",
		cityId: "city_lisbon",
		name: "Alfama Miradouro Stay",
		slug: "alfama-miradouro-stay",
		category: "budget",
		imageUrl: "hotel-budget-2",
		latitude: 38.7119,
		longitude: -9.1291,
		priceFrom: 72,
		currency: "EUR",
		rating: 9.1,
		reviewCount: 1980,
		stars: 3,
		neighborhood: "Alfama",
		shortReason: "A tiled guesthouse beside a viewpoint in Alfama, with warm hosting and review scores in the top tier for the price.",
		attributes: [
			"Viewpoint terrace",
			"Free breakfast",
			"Tram 28 nearby"
		]
	},
	{
		id: "hotel_lisbon_value",
		cityId: "city_lisbon",
		name: "Chiado Prata Hotel",
		slug: "chiado-prata-hotel",
		category: "best_value",
		imageUrl: "hotel-value-2",
		latitude: 38.7107,
		longitude: -9.1408,
		priceFrom: 155,
		currency: "EUR",
		rating: 9.4,
		reviewCount: 2890,
		stars: 4,
		neighborhood: "Chiado",
		shortReason: "Flat, walkable Chiado location, rooftop bar and generous rooms — the clear balance pick in central Lisbon.",
		attributes: [
			"Rooftop bar",
			"Flat walkable streets",
			"Free cancellation"
		]
	},
	{
		id: "hotel_lisbon_luxury",
		cityId: "city_lisbon",
		name: "Príncipe Real Palácio",
		slug: "principe-real-palacio",
		category: "luxury",
		imageUrl: "hotel-luxury-1",
		latitude: 38.7183,
		longitude: -9.1497,
		priceFrom: 430,
		currency: "EUR",
		rating: 9.6,
		reviewCount: 860,
		stars: 5,
		neighborhood: "Príncipe Real",
		shortReason: "A restored palace with a garden pool in Lisbon's most elegant quarter, and the city's highest service ratings.",
		attributes: [
			"Garden pool",
			"Palace suites",
			"Fine dining"
		]
	},
	{
		id: "hotel_new_york_budget",
		cityId: "city_new_york",
		name: "Hell's Kitchen 46",
		slug: "hells-kitchen-46",
		category: "budget",
		imageUrl: "hotel-budget-1",
		latitude: 40.7601,
		longitude: -73.9925,
		priceFrom: 158,
		currency: "USD",
		rating: 8.7,
		reviewCount: 7420,
		stars: 3,
		neighborhood: "Hell's Kitchen",
		shortReason: "Small rooms, but clean, safe and ten minutes from Times Square — the most dependable sub-$200 room in Midtown.",
		attributes: [
			"10 min to Times Square",
			"24h front desk",
			"Subway 2 min"
		]
	},
	{
		id: "hotel_new_york_value",
		cityId: "city_new_york",
		name: "NoMad Union House",
		slug: "nomad-union-house",
		category: "best_value",
		imageUrl: "hotel-value-1",
		latitude: 40.7449,
		longitude: -73.9877,
		priceFrom: 289,
		currency: "USD",
		rating: 9.2,
		reviewCount: 4980,
		stars: 4,
		neighborhood: "NoMad",
		shortReason: "Well-built rooms between Midtown and Downtown, strong service scores, and rates that stay sane midweek.",
		attributes: [
			"Central NoMad",
			"Fitness centre",
			"Free cancellation"
		]
	},
	{
		id: "hotel_new_york_luxury",
		cityId: "city_new_york",
		name: "Central Park Reserve",
		slug: "central-park-reserve",
		category: "luxury",
		imageUrl: "hotel-luxury-2",
		latitude: 40.7659,
		longitude: -73.9772,
		priceFrom: 820,
		currency: "USD",
		rating: 9.5,
		reviewCount: 1640,
		stars: 5,
		neighborhood: "Midtown East",
		shortReason: "Park-view suites, a skyline spa and famously consistent service — the best-reviewed of the park-front five-stars.",
		attributes: [
			"Park-view suites",
			"Skyline spa",
			"Two restaurants"
		]
	},
	{
		id: "hotel_tokyo_budget",
		cityId: "city_tokyo",
		name: "Kuramae Riverside Inn",
		slug: "kuramae-riverside-inn",
		category: "budget",
		imageUrl: "hotel-budget-2",
		latitude: 35.7002,
		longitude: 139.7902,
		priceFrom: 89,
		currency: "USD",
		rating: 9.2,
		reviewCount: 2310,
		stars: 3,
		neighborhood: "Kuramae",
		shortReason: "Immaculate compact rooms by the Sumida River, two stops from Asakusa, with cleanliness scores near-perfect.",
		attributes: [
			"Spotless rooms",
			"Riverside walk",
			"Metro 3 min"
		]
	},
	{
		id: "hotel_tokyo_value",
		cityId: "city_tokyo",
		name: "Shibuya Sakura Court",
		slug: "shibuya-sakura-court",
		category: "best_value",
		imageUrl: "hotel-value-2",
		latitude: 35.6598,
		longitude: 139.7006,
		priceFrom: 182,
		currency: "USD",
		rating: 9.3,
		reviewCount: 3760,
		stars: 4,
		neighborhood: "Shibuya",
		shortReason: "Quiet rooms a block off Shibuya's crossing, with excellent breakfast and unusually generous square footage.",
		attributes: [
			"Breakfast included",
			"Walk to Shibuya Crossing",
			"Large rooms"
		]
	},
	{
		id: "hotel_tokyo_luxury",
		cityId: "city_tokyo",
		name: "Marunouchi Sky Residence",
		slug: "marunouchi-sky-residence",
		category: "luxury",
		imageUrl: "hotel-luxury-2",
		latitude: 35.6812,
		longitude: 139.7671,
		priceFrom: 640,
		currency: "USD",
		rating: 9.6,
		reviewCount: 1210,
		stars: 5,
		neighborhood: "Marunouchi",
		shortReason: "High-floor rooms over Tokyo Station with a bathhouse-style spa, and the most consistent five-star service in the city.",
		attributes: [
			"High-floor views",
			"Onsen-style spa",
			"Above Tokyo Station"
		]
	},
	{
		id: "hotel_istanbul_budget",
		cityId: "city_istanbul",
		name: "Karaköy Liman Rooms",
		slug: "karakoy-liman-rooms",
		category: "budget",
		imageUrl: "hotel-budget-1",
		latitude: 41.0246,
		longitude: 28.9769,
		priceFrom: 64,
		currency: "USD",
		rating: 9,
		reviewCount: 1740,
		stars: 3,
		neighborhood: "Karaköy",
		shortReason: "A well-kept small hotel on the Galata side, with big Turkish breakfasts and a tram ride to the old city.",
		attributes: [
			"Turkish breakfast",
			"Tram 3 min",
			"Airport transfer"
		]
	},
	{
		id: "hotel_istanbul_value",
		cityId: "city_istanbul",
		name: "Galata Bosphorus Suites",
		slug: "galata-bosphorus-suites",
		category: "best_value",
		imageUrl: "hotel-value-1",
		latitude: 41.0256,
		longitude: 28.9741,
		priceFrom: 138,
		currency: "USD",
		rating: 9.4,
		reviewCount: 2620,
		stars: 4,
		neighborhood: "Galata",
		shortReason: "Bosphorus-view terrace, walkable to Galata Tower, and priced far below comparable waterfront hotels.",
		attributes: [
			"Bosphorus terrace",
			"Walk to Galata Tower",
			"Free cancellation"
		]
	},
	{
		id: "hotel_istanbul_luxury",
		cityId: "city_istanbul",
		name: "Beşiktaş Waterfront Palace",
		slug: "besiktas-waterfront-palace",
		category: "luxury",
		imageUrl: "hotel-luxury-1",
		latitude: 41.0409,
		longitude: 29.0064,
		priceFrom: 470,
		currency: "USD",
		rating: 9.5,
		reviewCount: 1390,
		stars: 5,
		neighborhood: "Beşiktaş",
		shortReason: "Waterfront gardens, a hammam and strait-view suites — palace-level luxury at a fraction of European rates.",
		attributes: [
			"Strait-view suites",
			"Historic hammam",
			"Waterfront pool"
		]
	},
	{
		id: "hotel_dubai_budget",
		cityId: "city_dubai",
		name: "Deira Souk Hotel",
		slug: "deira-souk-hotel",
		category: "budget",
		imageUrl: "hotel-budget-2",
		latitude: 25.2697,
		longitude: 55.3095,
		priceFrom: 78,
		currency: "USD",
		rating: 8.8,
		reviewCount: 3240,
		stars: 3,
		neighborhood: "Deira",
		shortReason: "Old-Dubai location near the creek and gold souk, with a pool and metro access for the price of a hostel bed elsewhere.",
		attributes: [
			"Outdoor pool",
			"Metro 5 min",
			"Airport 12 min"
		]
	},
	{
		id: "hotel_dubai_value",
		cityId: "city_dubai",
		name: "Marina Walk Residences",
		slug: "marina-walk-residences",
		category: "best_value",
		imageUrl: "hotel-value-2",
		latitude: 25.0805,
		longitude: 55.1403,
		priceFrom: 176,
		currency: "USD",
		rating: 9.2,
		reviewCount: 5110,
		stars: 4,
		neighborhood: "Dubai Marina",
		shortReason: "Apartment-sized rooms on the Marina Walk with beach shuttle included — the best all-round rate in new Dubai.",
		attributes: [
			"Apartment-style rooms",
			"Beach shuttle",
			"Rooftop pool"
		]
	},
	{
		id: "hotel_dubai_luxury",
		cityId: "city_dubai",
		name: "Jumeirah Shore Palace",
		slug: "jumeirah-shore-palace",
		category: "luxury",
		imageUrl: "hotel-luxury-2",
		latitude: 25.1412,
		longitude: 55.1853,
		priceFrom: 590,
		currency: "USD",
		rating: 9.5,
		reviewCount: 2470,
		stars: 5,
		neighborhood: "Jumeirah Beach",
		shortReason: "Private beach, five restaurants and villa-style suites, rated above resorts charging well over $1,000 a night.",
		attributes: [
			"Private beach",
			"Five restaurants",
			"Kids club"
		]
	},
	{
		id: "hotel_bangkok_budget",
		cityId: "city_bangkok",
		name: "Phra Nakhon Garden Inn",
		slug: "phra-nakhon-garden-inn",
		category: "budget",
		imageUrl: "hotel-budget-1",
		latitude: 13.7543,
		longitude: 100.4977,
		priceFrom: 41,
		currency: "USD",
		rating: 9.1,
		reviewCount: 2080,
		stars: 3,
		neighborhood: "Phra Nakhon",
		shortReason: "A leafy courtyard hotel near the Grand Palace, quiet at night, with review scores most four-stars never reach.",
		attributes: [
			"Garden courtyard",
			"Walk to Grand Palace",
			"Free breakfast"
		]
	},
	{
		id: "hotel_bangkok_value",
		cityId: "city_bangkok",
		name: "Sathorn Riverline Hotel",
		slug: "sathorn-riverline-hotel",
		category: "best_value",
		imageUrl: "hotel-value-1",
		latitude: 13.7208,
		longitude: 100.5162,
		priceFrom: 94,
		currency: "USD",
		rating: 9.3,
		reviewCount: 4360,
		stars: 4,
		neighborhood: "Sathorn",
		shortReason: "Rooftop pool, BTS on the doorstep and river access — an unusually complete four-star for under $100.",
		attributes: [
			"Rooftop pool",
			"BTS 2 min",
			"River ferry access"
		]
	},
	{
		id: "hotel_bangkok_luxury",
		cityId: "city_bangkok",
		name: "Chao Phraya Grand Wing",
		slug: "chao-phraya-grand-wing",
		category: "luxury",
		imageUrl: "hotel-luxury-1",
		latitude: 13.7226,
		longitude: 100.5117,
		priceFrom: 320,
		currency: "USD",
		rating: 9.6,
		reviewCount: 1880,
		stars: 5,
		neighborhood: "Riverside",
		shortReason: "River-facing suites, a legendary spa and service scores at the very top of Asia — still a relative bargain.",
		attributes: [
			"River-view suites",
			"Destination spa",
			"Private boat transfer"
		]
	},
	{
		id: "hotel_mexico_city_budget",
		cityId: "city_mexico_city",
		name: "Roma Norte Casa Verde",
		slug: "roma-norte-casa-verde",
		category: "budget",
		imageUrl: "hotel-budget-2",
		latitude: 19.4165,
		longitude: -99.1622,
		priceFrom: 68,
		currency: "USD",
		rating: 9.2,
		reviewCount: 1560,
		stars: 3,
		neighborhood: "Roma Norte",
		shortReason: "A restored townhouse on a tree-lined Roma Norte street, walkable to the best cafés and rated near-perfect for cleanliness.",
		attributes: [
			"Walkable Roma Norte",
			"Courtyard breakfast",
			"Free cancellation"
		]
	},
	{
		id: "hotel_mexico_city_value",
		cityId: "city_mexico_city",
		name: "Condesa Parque Hotel",
		slug: "condesa-parque-hotel",
		category: "best_value",
		imageUrl: "hotel-value-2",
		latitude: 19.4118,
		longitude: -99.1731,
		priceFrom: 142,
		currency: "USD",
		rating: 9.4,
		reviewCount: 2240,
		stars: 4,
		neighborhood: "Condesa",
		shortReason: "Park-facing rooms, rooftop dining and calm nights in Condesa — the strongest balance of setting and price in the city.",
		attributes: [
			"Park-facing rooms",
			"Rooftop restaurant",
			"Bike rental"
		]
	},
	{
		id: "hotel_mexico_city_luxury",
		cityId: "city_mexico_city",
		name: "Polanco Masaryk House",
		slug: "polanco-masaryk-house",
		category: "luxury",
		imageUrl: "hotel-luxury-2",
		latitude: 19.4325,
		longitude: -99.1935,
		priceFrom: 385,
		currency: "USD",
		rating: 9.5,
		reviewCount: 1120,
		stars: 5,
		neighborhood: "Polanco",
		shortReason: "Design-led suites off Avenida Masaryk with a rooftop pool, and service ratings ahead of every Polanco rival.",
		attributes: [
			"Rooftop pool",
			"Design suites",
			"Chapultepec 8 min"
		]
	}
];
/**
* Affiliate deep link. Kept in one place so the supplier/partner id can change
* without touching components. Dates are appended at click time when known.
*/
function buildAffiliateUrl(slug) {
	return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(slug.replace(/-/g, " "))}`;
}
var HOTELS = seeds.map((seed) => ({
	...seed,
	bookingId: seed.bookingId ?? null,
	affiliateUrl: buildAffiliateUrl(seed.name),
	lastChecked: LAST_CHECKED,
	active: true
}));
/**
* Local seed implementation of `HotelDataSource`.
*
* Every read the UI performs goes through this module. Swapping in Supabase
* later means writing a second implementation of `HotelDataSource` and changing
* the export at the bottom of this file — no component edits.
*/
var activeCities = () => CITIES.filter((c) => c.active);
function getCityBySlugSync(slug) {
	return activeCities().find((c) => c.slug === slug);
}
function hotelFor(cityId, category) {
	return HOTELS.find((h) => h.cityId === cityId && h.category === category && h.active);
}
function getDestinationPicksSync(slug) {
	const city = getCityBySlugSync(slug);
	if (!city) return null;
	const budget = hotelFor(city.id, "budget");
	const bestValue = hotelFor(city.id, "best_value");
	const luxury = hotelFor(city.id, "luxury");
	if (!budget || !bestValue || !luxury) return null;
	return {
		city,
		budget,
		bestValue,
		luxury
	};
}
/**
* Instant, synchronous autocomplete over the seeded city list.
* Ranking: prefix match on name > prefix match on alias > substring match.
*/
function searchCities(query, limit = 6) {
	const q = query.trim().toLowerCase();
	if (!q) return FEATURED_CITY_SLUGS.map(getCityBySlugSync).filter(Boolean).slice(0, limit);
	const results = [];
	for (const city of activeCities()) {
		const name = city.name.toLowerCase();
		const country = city.country.toLowerCase();
		const aliases = CITY_ALIASES[city.slug] ?? [];
		let score = Number.POSITIVE_INFINITY;
		if (name.startsWith(q)) score = 0;
		else if (aliases.some((a) => a.startsWith(q))) score = 1;
		else if (name.includes(q)) score = 2;
		else if (aliases.some((a) => a.includes(q))) score = 3;
		else if (country.startsWith(q)) score = 4;
		else if (country.includes(q)) score = 5;
		if (score !== Number.POSITIVE_INFINITY) results.push({
			city,
			score
		});
	}
	return results.sort((a, b) => a.score - b.score || a.city.name.localeCompare(b.city.name)).slice(0, limit).map((r) => r.city);
}
/**
* Appends the stay window to an affiliate deep link when the user supplied one.
*/
function withStayDates(affiliateUrl, dates) {
	if (!dates?.checkIn || !dates?.checkOut) return affiliateUrl;
	const url = new URL(affiliateUrl);
	url.searchParams.set("checkin", dates.checkIn);
	url.searchParams.set("checkout", dates.checkOut);
	return url.toString();
}
//#endregion
export { searchCities as n, withStayDates as r, getDestinationPicksSync as t };
