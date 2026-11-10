# Google Maps photos and QR posters

Prepared on 10 November 2026. Nothing has been uploaded, printed or put up. Both parts need Carlos or someone on the island.

## Part 1. Contributing photos to Google Maps listings

Why: travellers look at Google Maps before anything else, and many places in Sumba have few or old photos. Good, honest, recent photos help visitors and make the contributor profile visible. This is a contribution to the map, not an advertising channel: Google's rules for contributed content forbid promotional material, and photos with logos, web addresses or advertising text can be removed and the account restricted.

### Set-up (once)

- [ ] Use a personal Google account in Carlos's name (a Local Guide profile). Do not create a business listing for The Sumba Times at a place where it has no premises open to the public.
- [ ] Profile name and picture: a real person. The profile's short bio may say "Publisher of The Sumba Times", which is disclosure, not advertising.
- [ ] In the Google Maps app: Contribute, then turn on Local Guides.
- [ ] Phone camera: location tagging on, highest resolution, lens cleaned.

### What to photograph

- [ ] Only places you have actually visited, with photos you took yourself. Never upload a photo from the site's library: most of those belong to other photographers under Creative Commons licences and are not yours to give to Google.
- [ ] Start with the places that have a page on the site (the place pages): lagoons, beaches, waterfalls, hills, villages, towns, the two national park areas.
- [ ] For each place, 5 to 10 photos that answer a visitor's questions:
  - the view people come for, in good light;
  - the access: the turn-off from the road, the parking area, the path or the steps;
  - signs: entrance sign, price board if there is one, opening times;
  - facilities: toilets, shade, food stalls, or the lack of them;
  - the season: note in the caption whether it is dry or rainy season and the month.
- [ ] Landscape format, horizon straight, no filters, no text or watermark, no logo, no collage.

### What not to photograph or upload

- [ ] No recognisable faces without the person's consent, and no children.
- [ ] In traditional villages: ask first, and do not upload ritual objects, the inside of houses, funerals or ceremonies. Tombs only if the village allows photos of them.
- [ ] No photos of hotels or their grounds, including Villa Eco Beach. Leave hotel listings alone entirely: uploading to competitors' listings, or reviewing them, is a conflict of interest.
- [ ] No drone shots where flying is not permitted.

### Uploading

- [ ] Open the place in Google Maps, tap **Add photos**, select, and add a short factual caption where the app allows it ("Path down to the pool, about 20 minutes, dry season, August 2026").
- [ ] Check the pin is the right place. Many Sumba places have duplicate or misplaced listings: use **Suggest an edit** to fix the name, position or category.
- [ ] If a place on the site has no listing at all, **Add a missing place** with the correct name in Indonesian and the coordinates from our place page.
- [ ] Reviews: only for public places you visited, factual and useful (road condition, fee asked, best hour). Do not mention The Sumba Times or paste links in reviews or captions.
- [ ] Pace: a few places a week. Dozens of uploads in one day from a new account look like spam.

### What this gives the site

No direct link. The benefit is indirect: the contributor profile is seen by the people looking at those places, the places on our pages become easier to find, and the corrected names and positions match our guides. Record in a simple list which places were done and when, so the guides can mention "photo on Google Maps updated November 2026" only if that is true.

## Part 2. QR posters

### What the poster is

One A4 sheet per language with the masthead, the line "Sumba news, guides and maps", the word "Scan" and a QR code that opens the trip planner:

- English: https://thesumbatimes.com/en/plan/?utm_source=qr
- Español: https://thesumbatimes.com/es/plan/?utm_source=qr
- Bahasa Indonesia: https://thesumbatimes.com/id/plan/?utm_source=qr

Files (already generated, one page each): `distribution/posters/sumba-times-qr-en.pdf`, `sumba-times-qr-es.pdf`, `sumba-times-qr-id.pdf`.
To regenerate: `python3 distribution/qr_poster.py` (needs `reportlab`; uses `segno` for the code when installed, otherwise reportlab's own QR widget).

The code is 11 cm wide with the standard quiet margin and medium-high error correction, so it scans from about a metre and survives a scratch or a crease. All three codes were test-decoded from the rendered PDFs on 10 November 2026.

### Where to put them (always with permission)

| Place | Language | Who to ask |
|---|---|---|
| Arrival halls at Tambolaka and Waingapu airports (notice boards, tourist information desk) | English + Indonesian | Airport management or the regency tourism office |
| Regency tourism offices in Waingapu, Waikabubak, Tambolaka and Waibakul | Indonesian + English | The office itself |
| Car rental desks and drivers (a small version on the back of the seat) | English | The owner or driver |
| Cafes, warungs and restaurants used by travellers | English + Indonesian | The owner |
| Guesthouses and homestays (reception or rooms) | English, Spanish where Spanish guests come | The owner. Offer it; do not make it a condition of anything |
| Dive, surf and tour operators | English | The owner |
| Ferry terminals at Waingapu and Waikelo | Indonesian | Port office (ASDP or Pelni counter) |
| Village visitor posts that already have a notice board | Indonesian + English | The village head or the tourism group; never on houses, tombs or trees |

### Rules

- Ask before putting up anything, and take it down if asked. Never on trees, rocks, tombs, traditional houses or road signs.
- The poster offers information. It must not sit next to anything that sells a hotel, and it carries no offer or price.
- One poster per place, at eye level, in the shade, indoors or under cover when possible.

### Printing

- Print at 100% ("actual size"), A4, colour or black and white (both scan). 120 to 160 g paper indoors.
- Outdoors or in humid places: laminate, or print on waterproof synthetic paper. Matte lamination scans better than gloss under strong light.
- Test every batch: scan one printed copy with two different phones before distributing.
- Smaller formats: printing at 50% (A6) gives a 5.5 cm code, still fine at arm's length, for tables and car seats.

### Measuring

- Visits arrive with `utm_source=qr`. In the analytics tool, filter landing pages containing `utm_source=qr`.
- To tell locations apart later, print variants with an extra parameter (for example `&utm_campaign=tmc-airport`). The script has one URL per language on purpose; adding a location parameter is a two-line change when it is needed.
- Review after one month: keep the places that bring visits, replace damaged posters, drop the rest.

### First batch suggestion

20 copies: 8 English, 8 Indonesian, 4 Spanish. Two airports, four tourism offices, six cafes or restaurants, four drivers, four guesthouses that ask for one. Keep a list of where each one went and the date.
