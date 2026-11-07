# Brief for new Sumba Times travel guides (read fully)

Site: thesumbatimes.com, a trilingual (en/es/id) news and travel site about the island of Sumba, East Nusa Tenggara, Indonesia.
Goal: long, beautiful, accurate travel guides that make travellers fall in love with Sumba AND rank in Google and get cited by AI chats (ChatGPT, Perplexity, Claude, Gemini).

## Output
Write ONE Python file per assignment at the path you are given. It must define `GUIDES = [ {...}, ... ]` and be valid Python (test with `python3 -c "import ast,sys;ast.parse(open(sys.argv[1]).read())" FILE`). UTF-8. Use triple-quoted strings for bodies.

Each guide dict:
```
{"section": "<getting-here|things-to-do|culture>", "slug": "<english-slug>", "date": "2026-11-07", "time": "<HH:MM>", "kind": "guide",
 "slugs": {"es": "<spanish-slug-no-accents>", "id": "<indonesian-slug>"},
 "en": {"title": ..., "dek": ..., "answer": <2-3 sentence direct answer to the main question, plain text>, "body": <HTML>},
 "es": {... same keys, full natural Spanish (Spain/LatAm neutral), NOT a literal translation ...},
 "id": {... same keys, natural Bahasa Indonesia ...},
 "facts": {"en": [[label, value], ...4-6 rows], "es": [...], "id": [...]},   # a "key facts" box
 "faq": {"en": [[question, answer], ...4-6], "es": [...], "id": [...]},       # real questions travellers type into Google/ChatGPT
 "places": [{"name": "Weekuri Lagoon", "lat": -9.xxxx, "lon": 119.xxxx, "area": "Southwest Sumba"}],  # only places you verified coordinates for (Wikipedia, OpenStreetMap, Wikidata). Empty list is fine.
 "sources": [["Title, publisher, date", "https://..."], ...],                  # 4-8 real pages you actually opened
 "image_candidate": {"file_page": "https://commons.wikimedia.org/wiki/File:...", "direct_url": "https://upload.wikimedia.org/...", "credit": "<author>", "license": "CC BY-SA 4.0", "license_url": "...", "caption": {"en":..., "es":..., "id":...}}  # a real photo OF SUMBA on Wikimedia Commons with a CC/PD licence, landscape orientation, >=1280px wide. No identifiable people in close-up, no hotels. Verify by opening the file page.
}
```

## Body rules
- HTML only: <p>, <h2>, <h3>, <ul>/<ol>/<li>, <strong>, <em>, <table> (simple). Use <h2> for sections (at least 4). No <h1>, no inline styles, no images.
- English body 1,400-2,200 words. Spanish and Indonesian complete equivalents (same sections and facts, natural phrasing).
- Open with a vivid but factual paragraph that makes the reader feel the place (light, sound, landscape, people), then answer the question fast.
- Concrete, useful detail: names, distances in km AND hours of driving, months, typical price ranges in IDR with approximate EUR/USD, what to bring, what to avoid. Prices: say "around" and the year (2025-2026); never invent precise prices you cannot source - give ranges and say they vary.
- Respectful of Sumbanese culture (Marapu belief, villages are homes not museums, ask permission before photos, small contribution/donation book, dress modestly, don't touch graves/ritual objects).
- NO invented facts. Every non-obvious number or claim must be supported by one of your sources. If sources disagree, say "roughly" and give the range.
- NEVER use the em dash character (—) or en dash as punctuation in prose. Use commas, colons, full stops or parentheses. (Hyphens in words and ranges like 2-3 are fine; write ranges with a hyphen.)
- Do NOT recommend or name specific hotels or resorts, and never mention Eco Beach City, Villa Eco Beach, Nihi or other resort names (the publisher owns a villa, we stay neutral). Restaurants/warungs: avoid naming unless very well sourced; prefer generic advice.
- Internal links are welcome to existing guides, using these exact relative paths with the right language prefix (/en/, /es/, /id/): /LANG/getting-here/how-to-get-to-sumba-from-bali/ , /LANG/culture/pasola-explained/ , /LANG/culture/marapu-ikat-traditional-villages/ , /LANG/things-to-do/beaches-lagoons-waterfalls/ , /LANG/where-to-stay/where-to-stay-in-sumba/ . Also you may link to the other new guides listed in your assignment as /LANG/<section>/<english-slug>/ (the site will redirect to localized slugs).
- Title: specific, searchable, includes "Sumba" and the main keyword (e.g. "Best time to visit Sumba: a month-by-month guide"). Dek: one sentence that makes you want to read.
- Spanish slugs: lowercase, hyphens, no accents (e.g. "mejor-epoca-para-viajar-a-sumba"). Indonesian slugs similar (e.g. "waktu-terbaik-ke-sumba").

## Known facts already published on the site (stay consistent)
- Two airports: Tambolaka (TMC, north-west) and Waingapu (WGP, Umbu Mehang Kunda, east). Wings Air Bali-Tambolaka several daily (~1h30); TransNusa Bali-Waingapu non-stop 4x/week since 15 July 2026 (Tue, Wed, Fri, Sat).
- Sumba is about 200 km long, roughly twice the size of Bali. Four regencies: West Sumba (Waikabubak), Southwest Sumba (Tambolaka), Central Sumba (Waibakul), East Sumba (Waingapu).
- Ferry Waikelo (Sumba) - Sape (Sumbawa) reopened May 2026.
- East Sumba counted 41,524 visitors in 2025; about 1 in 8 foreign; average stay 3 nights.
- Dry season roughly May-September (into November in the east), rainy roughly November/December-March. Pasola usually February (Kodi, Lamboya) and March (Wanokaka, Gaura), dates set by Rato elders following the nyale sea worms.
- Time zone WITA (UTC+8). Currency IDR.

When finished, reply with: the file path, word counts per language for each guide, and any claim you were unsure about.
