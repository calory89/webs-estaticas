# sumbasecrets.com

Travel guide of the Sumba network (sister of The Sumba Times): map, secret spots, live weather, guides, in EN/ES/ID/DE/FR/NL.

- Hosting: Cloudflare Worker `sumbasecrets` (account d275d2609c10aa655477fd7a47e9b443), custom domains sumbasecrets.com + www (www → 301). Zone 99afc2031af86ec1092f3aae3f9b2349.
- Source: `places.py` (places, coordinates from OpenStreetMap, photo slugs), `ui.py` (UI strings + guides), `worker.tpl.js` (renderer). `python3 build.py` writes `worker.js`.
- Deploy: PUT worker.js to /accounts/<acc>/workers/scripts/sumbasecrets (metadata main_module worker.js).
- Photos: hotlinked from thesumbatimes.com/img/<slug>-{640,1280}.webp (same licensed Commons files; credits in places.py).
- Weather: Open-Meteo in the browser. News box: /api/news proxies The Sumba Times RSS (cached 15 min).
- Any path that is not /<lang>/... returns 410: the old WordPress was hacked (fake Home Depot shop) and its URLs must drop out of Google.
- Rules: real places only, no hotels in listings, no invented facts, never present AI images as photos.
