# The Sumba Times (thesumbatimes.com) - generator v2 (newspaper)

Static site generator, EN/ES/ID. `python3 build.py` writes `out/`. `python3 deploy.py` turns `out/` into `worker/index.js` + `worker/metadata.json`.

## Daily stories: read EDITORIAL.md first
At least one story per day (WITA), more when there is real news; newspaper mix, not a travel blog. EDITORIAL.md has the editorial line and the 100-point SEO/GEO checklist per story and language. Optional fields the build now uses (per-language ones inside en/es/id): "correction" (shown at the end), "slugs", "keywords" {en,es,id}, per-language "answer", "keys" (3-5 bullets), "visitors" (practical paragraph), "faq", "updated".

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

## Deploy (via calory89/claude-ops, since 8 Nov 2026)
The old Composio route (CLOUDFLARE_MCP_EXECUTE) does NOT work: that connection was never authorised, so the daily story was written but not published. Publish like this instead:
1. Add calory89/claude-ops to the session with push access and clone it to /home/claude/claude-ops.
2. Here: `bash publish.sh "what changed"`. It runs build.py, check.py (stops unless it reports 0 errors), deploy.py and `node --check`, commits and pushes this repo, copies the bundle to claude-ops (`/home/claude/claude-ops` beside this repo, or `TST_OPS=<path to its data/thesumbatimes>`), writes `BUILD`, appends the trigger line to `jobs/tst_deploy.sh` and pushes claude-ops. Steps 3 and 4 are what it does, for when you must do it by hand.
3. Since 18 Nov 2026 the page bodies are NOT inside the Worker: `deploy.py` writes `worker/index.js` (code, small files and a map path -> content hash) and `worker/pages.json.gz` (every HTML and Markdown body by hash). BOTH must reach claude-ops `data/thesumbatimes/`: `index.js.gz` (gzip of index.js), `pages.json.gz`, `metadata.json` and `og.json` (copy of `out/_og.json`). deploy.py copies the four files itself when claude-ops is checked out beside this repo. If `pages.json.gz` is missing or stale the deploy job stops before touching the live site (message "ABORT: the bundle points to page bodies...").
4. In claude-ops: write `webs-estaticas <short sha> <UTC time>` to `data/thesumbatimes/BUILD`, append a line `# <UTC time> <what>` to `jobs/tst_deploy.sh` (the push of a job file is what triggers it), commit the four data files + BUILD + the job file and push. The job first uploads the new page bodies to KV (`pg/<sha16>`, jobs/tst_pages.py), then the Worker, then deletes bodies used neither by this deploy nor by the previous one.
5. About a minute later `git pull` and read `out/tst_deploy.txt`: it must say `pages uploaded N`, `upload http 200`, `success True` and end with `# exit=0`; it also pings IndexNow. Then check the story on https://thesumbatimes.com/en/.
New photos for KV: add {slug: commons direct url} to `data/thesumbatimes/images.json` and push `jobs/tst_images.py` (or keep using the img/ upload you already do). Worker secret TST_SECRET (assistant) is kept automatically (metadata keep_bindings).

## Travel layer (7 Nov 2026)
- `travel.py`: localized slugs for older guides (`SLUGS`), homepage hero/quick facts/"Plan your trip" strings (`T`), base map points.
- `guides/g_*.py`: long travel guides (each defines `GUIDES`). Extra optional fields on any item: `"slugs": {"es","id"}` (localized URL; old English-slug URLs 301 automatically via `/_redirects.json`), `"updated": "YYYY-MM-DD"`, `"img_key"` (reuse another slug's KV image), per-language `"answer"` (quick answer box, used by AI/llms.txt), `"facts"`, `"faq"` (FAQPage schema), `"places"` [{name, lat, lon, area}] (map on /LANG/plan/ + TouristAttraction schema).
- New pages: `/LANG/plan/` (hub + MapLibre/OpenFreeMap map), `/llms.txt`, `/llms-full.txt`. robots.txt explicitly allows AI crawlers.
- Worker: `/` redirects by cookie `st_lang` (set when the reader clicks EN/ES/ID), then country (Spanish-speaking countries → /es/, ID → /id/), then Accept-Language, else /en/. Bots are never redirected (they get the language chooser, hreflang x-default).
- Daily briefs can keep English-only slugs; nothing else changes for the daily task.

## Newsletter, topics and extra modules (10 Nov 2026)
- `newsletter.py`: "Sumba this week" (landing /LANG/newsletter/, weekly edition + archive, welcome series, alerts, subscription boxes, exit popup, free guide /LANG/guide/sumba-7-days/). Emails are sent by the Supabase function `tst-newsletter` (code in claude-ops data/thesumbatimes/supabase/functions/tst-newsletter; activation steps in data/thesumbatimes/pending/README.md). Until it is activated the forms fall back to the old table `newsletter_subscribers`.
- Free guide PDF: after build run `python3 make_pdf.py`, copy pdf/*.pdf to claude-ops data/thesumbatimes/pdf/ and touch jobs/tst_pdf.py (uploads to KV, served at /pdf/...).
- `seo_extra.py`: topic hubs /LANG/topic/<tag>/, Dataset schema, reviewed date. Extra page modules are listed in `MODULES` in build.py (each has build(g), optional SITEMAP and CSS). The stylesheet is one shared file /s.<hash>.css.

## Added 18 Nov 2026 (round "300")
- `pages_geo.py` + `data_*.json`: road distances (OSRM on OpenStreetMap, fetched once; driving TIMES are our estimate at 34 to 42 km/h, never the routing engine's), locator maps (SVG from the OSM coastline), `/LANG/distances/` (+6 town-to-town pages), `/LANG/map/`, `/LANG/earthquakes/` (USGS), `/LANG/data/` and the files under `/data/`. Place pages get the box "Distances by road" (airports, nearest town, sunrise and sunset range, combine in a day, map). To refresh the data: re-run the fetch (see the header of pages_geo.py), keep `fetched` dates.
- `pages_tools.py`: `/LANG/attractions/` (every place with entrance fee and best time read from the place pages), `/LANG/rain/`, `/LANG/tools/` (fuel and car-share calculators, prices from the car guide).
- `pages_start.py`: `/LANG/start/` and the text list "All guides" on the front page.
- `engage.py`: yes/no "was this useful", clicks and views per `data-block`, most read, new since last visit, Speculation Rules. Worker endpoints `/api/ev` and `/api/top`; weekly panel `claude-ops jobs/tst_metrics.py` prints them, plus Googlebot/Bingbot hits per URL and site-search queries with and without results.
- build.py: Markdown twin of every article at `<article url>index.md`, `/sitemap-index.xml` + `/sitemaps/{news,guides,places,pages}.xml`, type label next to the kicker, "Background / Earlier" links and the 30-day notice on news (`context_html`, strict topic match), all places on one page, search with synonyms and typo tolerance.
- check.py now stops the deploy when an indexable page has a duplicate title, no JSON-LD, is missing from the sitemap or has fewer than 3 internal links pointing to it.
