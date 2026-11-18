// kolaboro.com batch 23 (agent n23, 12 Nov 2026): the 30 islands and 30 cities of the transparency rankings (/rankings/transparency/).
// No imports, so kolaboro.js (market pages) and kbx_seo.js (country hubs) can link to the rankings without a module cycle.
// Hand-checked list. A project belongs to a place when its market (field "market" of /data/bali-cases.json, "mk" of /data/named.json)
// is one of m, and, when an area rule a is given, its published area text ("ar" of /data/named.json) matches a (and not ax).
// Places picked by real project counts on 12 Nov 2026 (islands: the islands with the most tracked projects, Bali, Lombok and Sumba
// included by decision of the owner; cities: the cities with the most tracked projects). cc = ISO 3166-1 alpha-2 of the country.
export const TR_PLACES = [
  // islands
  { s: 'bali', n: 'Bali', k: 'i', cc: 'ID', co: 'Indonesia', m: ['Bali'] },
  { s: 'phuket', n: 'Phuket', k: 'i', cc: 'TH', co: 'Thailand', m: ['Phuket'] },
  { s: 'lombok', n: 'Lombok', k: 'i', cc: 'ID', co: 'Indonesia', m: ['Lombok'] },
  { s: 'sri-lanka', n: 'Sri Lanka', k: 'i', cc: 'LK', co: 'Sri Lanka', m: ['Sri Lanka'] },
  { s: 'al-marjan-island', n: 'Al Marjan Island', k: 'i', cc: 'AE', co: 'UAE', m: ['Ras Al Khaimah'], a: /Al Marjan Island/i, ax: /also listed as/i, an: 'Al Marjan Island' },
  { s: 'cyprus', n: 'Cyprus (Republic of Cyprus areas)', k: 'i', cc: 'CY', co: 'Cyprus', m: ['Cyprus'] },
  { s: 'koh-samui', n: 'Koh Samui', k: 'i', cc: 'TH', co: 'Thailand', m: ['Koh Samui'] },
  { s: 'hispaniola', n: 'Hispaniola (Dominican Republic)', k: 'i', cc: 'DO', co: 'Dominican Republic', m: ['Punta Cana', 'Dominican Republic'] },
  { s: 'dubai-islands', n: 'Dubai Islands', k: 'i', cc: 'AE', co: 'UAE', m: ['Dubai'], a: /^Dubai Islands\b/i, an: 'Dubai Islands' },
  { s: 'mauritius', n: 'Mauritius', k: 'i', cc: 'MU', co: 'Mauritius', m: ['Mauritius'] },
  { s: 'mallorca', n: 'Mallorca', k: 'i', cc: 'ES', co: 'Spain', m: ['Balearics', 'Spain'], a: /Mallorca/i, an: 'Mallorca' },
  { s: 'northern-cyprus', n: 'Northern Cyprus', k: 'i', cc: 'CY', co: 'Northern Cyprus', m: ['Northern Cyprus'] },
  { s: 'bahrain', n: 'Bahrain', k: 'i', cc: 'BH', co: 'Bahrain', m: ['Bahrain'] },
  { s: 'madeira', n: 'Madeira', k: 'i', cc: 'PT', co: 'Portugal', m: ['Madeira', 'Portugal'], a: /Madeira|Funchal|Calheta|Machico|Santa Cruz/i, am: ['Portugal'], an: 'Madeira, Funchal' },
  { s: 'saadiyat-island', n: 'Saadiyat Island', k: 'i', cc: 'AE', co: 'UAE', m: ['Abu Dhabi'], a: /Saadiyat/i, an: 'Saadiyat' },
  { s: 'malta', n: 'Malta', k: 'i', cc: 'MT', co: 'Malta', m: ['Malta'] },
  { s: 'zanzibar', n: 'Zanzibar (Unguja)', k: 'i', cc: 'TZ', co: 'Tanzania', m: ['Zanzibar'] },
  { s: 'grand-cayman', n: 'Grand Cayman', k: 'i', cc: 'KY', co: 'Cayman Islands', m: ['Cayman Islands'] },
  { s: 'tenerife', n: 'Tenerife', k: 'i', cc: 'ES', co: 'Spain', m: ['Canary Islands', 'Spain'], a: /Tenerife/i, an: 'Tenerife' },
  { s: 'hokkaido', n: 'Hokkaido', k: 'i', cc: 'JP', co: 'Japan', m: ['Niseko', 'Japan'], a: /Hokkaido/i, am: ['Japan'], an: 'Hokkaido' },
  { s: 'qetaifan-island', n: 'Qetaifan Island', k: 'i', cc: 'QA', co: 'Qatar', m: ['Qatar'], a: /Qetaifan/i, an: 'Qetaifan' },
  { s: 'victoria-island-lagos', n: 'Victoria Island and Eko Atlantic, Lagos', k: 'i', cc: 'NG', co: 'Nigeria', m: ['Lagos'], a: /Victoria Island/i, an: 'Victoria Island' },
  { s: 'sumba', n: 'Sumba', k: 'i', cc: 'ID', co: 'Indonesia', m: ['Sumba'], coi: true },
  { s: 'penang', n: 'Penang', k: 'i', cc: 'MY', co: 'Malaysia', m: ['Malaysia'], a: /Penang|George Town|Gurney/i, an: 'Penang, George Town, Gurney' },
  { s: 'barbados', n: 'Barbados', k: 'i', cc: 'BB', co: 'Barbados', m: ['Barbados'] },
  { s: 'flores', n: 'Flores (Labuan Bajo)', k: 'i', cc: 'ID', co: 'Indonesia', m: ['Labuan Bajo'] },
  { s: 'boa-vista', n: 'Boa Vista (Cape Verde)', k: 'i', cc: 'CV', co: 'Cape Verde', m: ['Cape Verde'], a: /Boa Vista/i, an: 'Boa Vista' },
  { s: 'okinawa', n: 'Okinawa', k: 'i', cc: 'JP', co: 'Japan', m: ['Okinawa'] },
  { s: 'oahu', n: 'Oahu (Honolulu)', k: 'i', cc: 'US', co: 'USA', m: ['Hawaii'], a: /Honolulu/i, an: 'Honolulu' },
  { s: 'manhattan', n: 'Manhattan', k: 'i', cc: 'US', co: 'USA', m: ['New York'], a: /Manhattan/i, an: 'Manhattan' },
  // cities
  { s: 'dubai', n: 'Dubai', k: 'c', cc: 'AE', co: 'UAE', m: ['Dubai'] },
  { s: 'ras-al-khaimah', n: 'Ras Al Khaimah', k: 'c', cc: 'AE', co: 'UAE', m: ['Ras Al Khaimah'] },
  { s: 'abu-dhabi', n: 'Abu Dhabi', k: 'c', cc: 'AE', co: 'UAE', m: ['Abu Dhabi'] },
  { s: 'miami', n: 'Miami', k: 'c', cc: 'US', co: 'USA', m: ['Miami'] },
  { s: 'pattaya', n: 'Pattaya', k: 'c', cc: 'TH', co: 'Thailand', m: ['Pattaya'] },
  { s: 'kuala-lumpur', n: 'Kuala Lumpur', k: 'c', cc: 'MY', co: 'Malaysia', m: ['Kuala Lumpur', 'Malaysia'], a: /Kuala Lumpur|^KLCC$/i, am: ['Malaysia'], an: 'Kuala Lumpur, KLCC' },
  { s: 'istanbul', n: 'Istanbul', k: 'c', cc: 'TR', co: 'Turkey', m: ['Istanbul'] },
  { s: 'los-cabos', n: 'Los Cabos', k: 'c', cc: 'MX', co: 'Mexico', m: ['Los Cabos'] },
  { s: 'puerto-vallarta', n: 'Puerto Vallarta', k: 'c', cc: 'MX', co: 'Mexico', m: ['Puerto Vallarta'] },
  { s: 'tulum', n: 'Tulum', k: 'c', cc: 'MX', co: 'Mexico', m: ['Riviera Maya'], a: /Tulum/i, an: 'Tulum' },
  { s: 'muscat', n: 'Muscat', k: 'c', cc: 'OM', co: 'Oman', m: ['Oman'], a: /Muscat/i, an: 'Muscat' },
  { s: 'bangkok', n: 'Bangkok', k: 'c', cc: 'TH', co: 'Thailand', m: ['Bangkok'] },
  { s: 'sharjah', n: 'Sharjah', k: 'c', cc: 'AE', co: 'UAE', m: ['Sharjah'] },
  { s: 'athens', n: 'Athens', k: 'c', cc: 'GR', co: 'Greece', m: ['Greece'], a: /Athens|Ellinikon/i, an: 'Athens, Ellinikon' },
  { s: 'colombo', n: 'Colombo', k: 'c', cc: 'LK', co: 'Sri Lanka', m: ['Sri Lanka'], a: /Colombo/i, an: 'Colombo' },
  { s: 'london', n: 'London', k: 'c', cc: 'GB', co: 'United Kingdom', m: ['London'] },
  { s: 'lisbon', n: 'Lisbon', k: 'c', cc: 'PT', co: 'Portugal', m: ['Lisbon', 'Portugal'], a: /(^|, )Lisbon$/i, am: ['Portugal'], an: 'Lisbon' },
  { s: 'limassol', n: 'Limassol', k: 'c', cc: 'CY', co: 'Cyprus', m: ['Cyprus'], a: /Limassol/i, an: 'Limassol' },
  { s: 'sydney', n: 'Sydney', k: 'c', cc: 'AU', co: 'Australia', m: ['Sydney'] },
  { s: 'gold-coast', n: 'Gold Coast', k: 'c', cc: 'AU', co: 'Australia', m: ['Gold Coast'] },
  { s: 'nairobi', n: 'Nairobi', k: 'c', cc: 'KE', co: 'Kenya', m: ['Nairobi'] },
  { s: 'merida', n: 'Mérida (Yucatán)', k: 'c', cc: 'MX', co: 'Mexico', m: ['Mérida'] },
  { s: 'panama-city', n: 'Panama City', k: 'c', cc: 'PA', co: 'Panama', m: ['Panama City', 'Panama'], a: /Panama City/i, am: ['Panama'], an: 'Panama City' },
  { s: 'metro-manila', n: 'Metro Manila', k: 'c', cc: 'PH', co: 'Philippines', m: ['Philippines'], a: /Makati|Pasig|Taguig|Pasay|Mandaluyong|Metro Manila/i, an: 'Makati, Pasig, Taguig, Pasay, Mandaluyong, Metro Manila' },
  { s: 'ho-chi-minh-city', n: 'Ho Chi Minh City', k: 'c', cc: 'VN', co: 'Vietnam', m: ['Ho Chi Minh City', 'Vietnam'], a: /Ho Chi Minh|District 7/i, am: ['Vietnam'], an: 'Ho Chi Minh City, District 7' },
  { s: 'accra', n: 'Accra', k: 'c', cc: 'GH', co: 'Ghana', m: ['Accra'] },
  { s: 'marrakech', n: 'Marrakech', k: 'c', cc: 'MA', co: 'Morocco', m: ['Marrakech'] },
  { s: 'phnom-penh', n: 'Phnom Penh', k: 'c', cc: 'KH', co: 'Cambodia', m: ['Cambodia'], a: /Phnom Penh/i, an: 'Phnom Penh' },
  { s: 'batumi', n: 'Batumi', k: 'c', cc: 'GE', co: 'Georgia', m: ['Georgia'], a: /Batumi/i, an: 'Batumi' },
  { s: 'antalya', n: 'Antalya', k: 'c', cc: 'TR', co: 'Turkey', m: ['Antalya'], ax: /^Alanya$/i },
];
// a: area rule. am: the markets the area rule applies to (default: every market in m). Markets in m but not in am count whole.
export function inPlace(P, mk, ar) {
  if (!P.m.includes(mk)) return false;
  const ruled = P.a && (!P.am || P.am.includes(mk));
  if (ruled && !P.a.test(String(ar || ''))) return false;
  if (P.ax && P.ax.test(String(ar || ''))) return false;
  return true;
}
// places linked from a market page or a country hub (Sumba is linked only from the rankings hub: conflict of interest)
export function placesForMarket(mk) { return TR_PLACES.filter(P => !P.coi && P.m.includes(mk)); }
export function placesForCountry(co) { return TR_PLACES.filter(P => !P.coi && P.co === co); }
