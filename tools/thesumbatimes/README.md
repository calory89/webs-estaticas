# The Sumba Times (thesumbatimes.com) - generator v2 (newspaper)

Static site generator, EN/ES/ID. `python3 build.py` writes `out/`. `python3 deploy.py` turns `out/` into `worker/index.js` + `worker/metadata.json`.

## Files
- `content.py`  - UI strings, evergreen guides (`ARTICLES`), the Low Tide letter (`LETTER`), stay table. The daily task adds new stories here.
- `news_briefs.py` - news briefs (`BRIEFS`), same schema.
- `images.py` - hero image metadata per slug (`IMAGES`). An article can also carry its own `"image": {...}` with the same fields.
- `img/` - backup of every image uploaded to KV.
- `build.py`, `deploy.py`.

## Article schema
`{"section": "news|travel|business|living|culture|projects|getting-here|things-to-do|where-to-stay|low-tide", "slug", "date": "YYYY-MM-DD", "time": "HH:MM" (WITA),
  "dateline": "WAINGAPU", "kind": "brief|guide|letter", "top": True (only on the lead story),
  "en"/"es"/"id": {"title", "dek", "body" (HTML, use <h2> for sections; briefs end with a "What it means / Que significa / Apa artinya" h2)}, "sources": [[title, url], ...],
  "image": {"w", "h", "credit", "license", "license_url", "page", "ai": False, "caption": {"en", "es", "id"}}}`
The lead story on the front page is the newest item with `"top": True`; otherwise the newest item. Never mix languages inside one language block.

## Hosting
Cloudflare Worker `thesumbatimes` (account d275d2609c10aa655477fd7a47e9b443), custom domains thesumbatimes.com + www. HTML/XML/JSON are embedded in the Worker.
Images live in Workers KV namespace `thesumbatimes-img` (id f0aa5acc53a44f3194e7e428071161e2), binding `IMG`, keys `img/<slug>-640.webp`, `img/<slug>-1280.webp`, `og/<slug>.jpg` (1200x630, masthead band).

## Images (rule)
1. Prefer a real photo of Sumba with a reuse licence (Wikimedia Commons CC/PD, Unsplash, Pexels): landscapes, culture, nature. Never photos of other hotels or their grounds. Credit + licence go in the caption (`credit`, `license`, `license_url`, `page`).
2. If no good real photo exists, generate a super-realistic image with Higgsfield and set `"ai": True`: the caption then shows "AI-generated illustration / Ilustracion generada con IA / Ilustrasi buatan AI". Never present AI as real, never depict identifiable real people, sacred Marapu rituals or other hotels.
3. Process: 640w and 1280w WebP (quality ~78) + 1200x630 JPEG OG with a dark band and "The Sumba Times" at the bottom; upload to KV with the bulk API (`PUT /accounts/<acct>/storage/kv/namespaces/<ns>/bulk`, items `{key, value: base64, base64: true}`, keep each call < ~700 KB of base64). Save a copy in `img/`.

## Deploy (Composio workbench)
Build in a local dir (not /mnt/files, it is slow): `python3 build.py && python3 deploy.py`. Then run CLOUDFLARE_MCP_EXECUTE with JS that gunzips the base64-gzipped `worker/index.js`, builds multipart (`metadata` part = worker/metadata.json incl. the KV binding, `index.js` part as application/javascript+module) and `PUT /accounts/${accountId}/workers/scripts/thesumbatimes` (contentType multipart/form-data; boundary=..., rawBody: true). Worker is ~2.3 MB today (gzip ~0.3 MB); plan limit is compressed size.
Then resubmit https://thesumbatimes.com/sitemap.xml and /news-sitemap.xml in Search Console (sc-domain:thesumbatimes.com).

## Travel layer (7 Nov 2026)
- `travel.py`: localized slugs for older guides (`SLUGS`), homepage hero/quick facts/"Plan your trip" strings (`T`), base map points.
- `guides/g_*.py`: long travel guides (each defines `GUIDES`). Extra optional fields on any item: `"slugs": {"es","id"}` (localized URL; old English-slug URLs 301 automatically via `/_redirects.json`), `"updated": "YYYY-MM-DD"`, `"img_key"` (reuse another slug's KV image), per-language `"answer"` (quick answer box, used by AI/llms.txt), `"facts"`, `"faq"` (FAQPage schema), `"places"` [{name, lat, lon, area}] (map on /LANG/plan/ + TouristAttraction schema).
- New pages: `/LANG/plan/` (hub + MapLibre/OpenFreeMap map), `/llms.txt`, `/llms-full.txt`. robots.txt explicitly allows AI crawlers.
- Worker: `/` redirects by cookie `st_lang` (set when the reader clicks EN/ES/ID), then country (Spanish-speaking countries → /es/, ID → /id/), then Accept-Language, else /en/. Bots are never redirected (they get the language chooser, hreflang x-default).
- Daily briefs can keep English-only slugs; nothing else changes for the daily task.
