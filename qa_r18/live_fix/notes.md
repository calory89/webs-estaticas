# SupportNear live QA (27 Oct 2026): what was fixed

Source: `qa/live.md`. Deliverables are in this folder:

| File | What it is |
|---|---|
| `patch_live.py` | The runner script: `python3 patch_live.py <root of pub/_wp>`. It uses only the standard library and is idempotent. |
| `generators.diff` | The source fixes, from `diff -ruN src work_live`. The paths are relative to `/home/claude/sn`. |
| `worker.diff` | The exact change the script makes to `_worker.js/index.js`. |
| `orig/` | The live pages downloaded today (270 URLs). |
| `sample/` | The same pages after the patch. |
| `run1.log`, `run2.log` | The output of the first and second run. |
| `tools/make_blobs.py`, `tools/new_claims.json` | These rebuild the two data blobs inside `patch_live.py`: the translated copy and the poster QR codes. |

**Summary: 27 items. 17 fixed, 5 partly fixed, 5 not fixed.** The 5 not fixed are app logic or app copy owned by other engineers, or Cloudflare zone settings.

## How to publish

1. Run `patch_live.py` on the `pub/_wp` checkout with the `patch-pub` workflow.
   - On the full tree it takes about 25 s.
   - The output should end with `c/ files with no city match ... 0`.
   - It should show `worker: patched ...`. If it shows `WORKER NOT PATCHED`, apply `worker.diff` by hand.
   - A second run must print `files changed ...: 0`.
2. Apply `generators.diff` to the `src/supportnear` branch so the next build produces the same pages.
   - `city_pages.py` now runs with only `index.full.html` and `d/`. CITIES carries the country code, and `legacy_cc.json` / `cities_new*.json` are now optional.
   - Tested: it rebuilt all 6,983 pages in 25 s.
   - Running `patch_live.py` on that generator output changes nothing, except the 4 blocked places in M7, which disappear once `build.py` is re-run.
   - Note that the `d/` in `work_live` has 174,389 places, against 171,872 live. A rebuild therefore also refreshes the counts.
   - Commit `pages_lastmod.json` and `snapshot*.json` between builds (see m7).
3. Run `python3 indexnow.py --send`. In Search Console, resubmit `sitemap.xml`, which now includes 19 language pages plus `/about` and `/impacto`.

What the script touches:
- Only `_s/supportnear.com/**` and 3 clearly marked blocks in `_worker.js/index.js`. Each block acts only when the host is `supportnear.com` or `www.supportnear.com`.
- The one deletion is `_s/supportnear.com/falta.html` (see m6).
- It never edits `<script>` code in `index.html`. In that file it changes only `<head>` metadata and plain `href`s, so the existing CSP hashes stay valid. I checked this in Chromium: 0 CSP errors.

How it was tested:
- **Pages.** 270 live URLs went into `orig/`:
  - all 152 sitemap URLs for the 11 repeated city names;
  - their 23 posters and 23 text pages;
  - 20 language pages and 17 core pages;
  - other cities: Paris, Madrid, Kyiv, Cairo, Wien, Napoli, München, Constantine and Mahilyow, including `.en` and need pages.

  I restored `about.html` to the raw branch file, because Cloudflare had rewritten its e-mail links.
- **Idempotency.** The second run changed 0 files.
- **HTML.** html5lib reported 0 new parse errors.
- **Links.** There are 0 links to `*.html` left. The patched pages point to 2,725 distinct internal URLs: 264 are in the sample and the other 2,461 were requested live, and all returned 200.
- **Canonical and hreflang.** Every indexable page has a self-canonical and the hreflang sets are reciprocal (0 problems).
- **Chromium at 390×844**, with `**/__sb/**` and all third-party requests aborted:
  - No CSP violations on any page.
  - The `/c/` filter works.
  - `/incrustar?city=London&cc=GB` rewrites the snippet and the preview, and they survive a language switch.
  - `/es/` stays on the page for a first visit and goes to the map when the URL has a `#p=` hash or the visitor has `sn.*` storage.
  - A Wolof browser still gets French on the info pages.
- **Worker.** I ran it under node with a mock `ASSETS`:
  - www returns 301 with the same path and query, and 308 for POST.
  - `nomagua.com` is untouched.
  - `social.jpg?v=` is served `immutable`.
  - `/google….html` returns 200.
  - Missing pages return 404 with the new page.

---

## CRITICAL

### C1. Ambiguous `?city=` (London, Barcelona, Valencia…): FIXED (static side)
- Every map link on the city, need and `.en` pages now carries `&cc=<ISO2>`, as do the embed link and the poster QR codes. For example, `../?city=London&amp;cc=GB` and `../?city=Barcelona&amp;cc=VE&amp;need=food`.
  - In the live patch this is 476 links and 23 new QR codes, one for each poster of a repeated name. I made the QR codes with the same settings as `city_pages.py` and checked that the old QR is byte-identical to the live one.
- **How the country is found.**
  - For each file, the city comes from the live CITIES array, which carries the ISO code as `c[4]`.
  - For the 11 repeated names, the script compares each candidate city with the coordinates in the page's own JSON-LD. Spain is told apart by the `-espana` slug.
  - All 1,221 cities matched, with no unmatched files.
- **`/incrustar`** reads `?city=` and `?cc=`, rewrites the iframe snippet and the live preview to match, and documents the `&cc=` option in all 11 languages.
- **Generator.** `city_pages.py` emits `cc` on every link and QR, for all cities. It also pins the published slugs of the repeated names, so `/c/leon` stays León, Mexico, even if the data changes.
- **Still needed: app (another engineer).** The app must read `cc` and pass it to `pickCity(qcity, cc)`. Until that ships, `&cc=` is harmlessly ignored.

## MAJOR

### M1. `/huecos`: 1,030 broken links: FIXED
`href="luena.html"` becomes `href="c/luena"`, in the live page and in `city_pages.py`. All 1,030 targets return 200.

### M2. `?sos=1` shows the IP country: NOT FIXED (app logic, owned by another engineer)
The fix described in live.md, deriving the country from `nearestCity(S.center)` before `buildSos()`, is app code. The new 404 page and the language pages link to `/?sos=1`, so this fix matters for them too.

### M3. "It never leaves your phone": NOT FIXED (app copy, owned by another engineer). Exact wording below.
- The text lives in the `T` tables of `index.template.html`, in all 20 languages:
  - `wel.locp` (line ~1563 in `en`, 1914 in `es`)
  - `hero.m1`
  - `faq.a3`
  - `priv.2`: the third and fourth `<li>`
  - The FAQ JSON-LD is built from `faq.a3` (`build.py` `_tget`), so it follows automatically.
- I did not touch the live JSON-LD. Structured data must match the visible text.
- The wording below is true **with the app as it is today**. The exact position goes to Overpass (and its fallbacks) and to routing, and a ~110 m position goes to Open-Meteo. Use variant B only once Overpass and Open-Meteo really receive rounded coordinates.

**`wel.locp`** (the small text under "Use my location")
- EN: `Only used to find help near you. We never store it; public map servers receive it to show places, weather and walking routes.`
- ES: `Solo se usa para buscar ayuda cerca de ti. No la guardamos; la reciben servidores públicos de mapas para mostrar sitios, el tiempo y rutas a pie.`
- Variant B, after rounding:
  - EN: `Only used to find help near you. We never store it, and map servers only see the rough area — except the route server, when you ask for walking directions.`
  - ES: `Solo se usa para buscar ayuda cerca de ti. No la guardamos, y los servidores de mapas solo ven la zona aproximada, salvo el de rutas cuando pides cómo llegar a pie.`

**`hero.m1`**
- EN: `We never store your location`
- ES: `Nunca guardamos tu ubicación`

**`faq.a3`** ("Is my location sent somewhere?")
- EN: `We never store your position and it is never linked to a name or an account. To show places, the weather and walking routes, the app has to ask public servers about where you are: OpenStreetMap's Overpass servers, Open-Meteo and, if you ask for directions, the OpenStreetMap routing server. They receive your position the way they receive any map app's request. If you would rather not share it, type a street or a station instead of using your location.`
- ES: `Nunca guardamos tu posición ni la unimos a un nombre o una cuenta. Para enseñarte sitios, el tiempo y rutas a pie, la app tiene que preguntar a servidores públicos por el lugar donde estás: los servidores Overpass de OpenStreetMap, Open-Meteo y, si pides cómo llegar, el servidor de rutas de OpenStreetMap. Reciben tu posición como cualquier petición de una app de mapas. Si prefieres no compartirla, escribe una calle o una estación en vez de usar tu ubicación.`

**`priv.2`**: replace the two `<li>` "Your GPS position stays on your device…" and "Search area only…" with this single item.
- EN: `<li><b>Your position is used only to find help.</b> We never store it. To fetch places, the weather and walking routes, your browser sends it to public servers — OpenStreetMap (Overpass and routing) and Open-Meteo — the same way any map does, with no name or account attached.</li>`
- ES: `<li><b>Tu posición solo se usa para buscar ayuda.</b> No la guardamos nunca. Para traer los sitios, el tiempo y las rutas a pie, tu navegador la envía a servidores públicos —OpenStreetMap (Overpass y rutas) y Open-Meteo—, como hace cualquier mapa, sin nombre ni cuenta.</li>`

`priv.3` ("use it without granting location access…") is correct and should stay. These static pages contain no location claim: `prensa`, `incrustar` (`e.d1` is true), `about`.

### M4. Multilingual SEO: FIXED
- **`/xx/` pages (19 languages).**
  - They are now indexable, with a self-canonical, `og:url` = the page, and one reciprocal hreflang cluster. In that cluster, `x-default` and `en` are `/`, and the other 19 languages are `/xx/`.
  - Title, description, H1, intro, "Open the map", emergency numbers and all cities are server-rendered in each language, from `l/xx.json`.
  - The pages no longer redirect every visitor instantly. Google treats a JS redirect as a redirect, so the old pages could never be indexed. These visitors still go straight to the map:
    - a visitor with a shared place link (`#p=…`);
    - a visitor who has used the app before (any `sn.*` key in localStorage).
  - Everyone else sees a one-screen page with the button on top.
- **`/en/`** remains a share link: noindex, canonical `/`, instant redirect.
- **Homepage**: hreflang now covers all 20 languages and points at `/xx/`. JSON-LD `inLanguage` has 20 codes, and `og:locale:alternate` has 19.
- **Generators**: `lang_pages.py`, `index.template.html` (lines 31–51 and 57–78, meta tags only) and `build.py:822`.

### M5. 93% of internal links go to `.html` and get a 308: FIXED for static pages and the homepage markup
- Every `href`/`src` to `x.html` becomes `x`, and `a/index.html` becomes `a/`. `?v=` is dropped from links to pages.
  - This covers all static pages, `/c/`, `/t/`, the homepage markup (the 40 city links plus the footer) and the iframe preview.
  - 3,761 links in the sample; 0 `.html` links remain.
  - Assets keep `?v=`.
- **Generators**: a shared `seo_common.finalize()`, plus `build.py` (the city links) and `index.template.html` (footer).
- **Still needed: app (another engineer).** The menu links built in JS use `pg('x.html')`, which appends `?v=` (`index.template.html` ~14003, 15174–15187, 16296–16313). Make `pg()` return the clean path without `?v=`.

### M6. `www` serves a duplicate site: FIXED (worker)
- `www.supportnear.com/*` now returns 301 to `https://supportnear.com` with the same path and query (308 for non-GET). This runs before any routing and applies only to this host.
- **Optional (Carlos):** `http://www…` still makes 2 hops, because Cloudflare's HTTPS redirect runs first. A zone Redirect Rule `http*://www.supportnear.com/*` → `https://supportnear.com/${1}` would make it 1 hop.

### M7. Wrong places on London's poster and pages: PARTLY FIXED
- **Fixed at the source** in `build.py classify()`:
  - Drop `historic=*` and `disused:` / `abandoned:` / `was:` features, and names starting "old / former / ehemalige / ancien".
  - Drop pools and lidos (`leisure=swimming_pool`, `sport=swimming`, "lido") as showers.
  - Drop `office=trade_union`, political parties, `club=*` and fraternities; add "trade union", "fraternity" and similar names to `NOTHELP`.
  - `shop=charity` is no longer "Free clothes". A Cáritas or similar clothes bank still gets in through `anchored()`.
  - Unit-tested on the reported cases. Each is dropped and real soup kitchens, shelters and hospitals stay:
    - old jewish soup kitchen
    - London Fields Lido
    - TUC (both as `office=trade_union` and as `office=ngo`)
    - Oxfam
    - Phi Gamma Delta
- **Live, until the next data build:** the patch removes the 4 named places from the lists, the JSON-LD and the posters:
  - node/13536418801, old soup kitchen
  - node/10268572084, TUC
  - node/7893425464, Phi Gamma Delta
  - London Fields Lido, by name on the poster
- **Not fixed live:** charity shops are still counted under clothes (369 in London), and counts in titles still include the removed places. Both need a data rebuild: **Carlos** should run `build.py` (OSM fetch), then the generators.

## MINOR

### m1. Capped counts and "free clinics": FIXED
- Hospitals are counted, so the wording changes:
  - EN "clinics and hospitals"
  - ES "centros de salud y hospitales"
  - PT "centros de saúde e hospitais"
  - FR "soins médicaux"
  - The other languages drop the "free" word (`tr/citypage_*.json`, `SG`).
- When a count equals the build cap (health 21, warm 13, water 24), it is shown as "21+". This applies to titles, descriptions, ledes, the count tiles and need pages (`fmt_n` in `city_pages.py`).
- Still left: the need-page lede reads "…where you can get this for free" for every category, including health. That is a translation-table decision.

### m2. 23 duplicate titles for repeated names: FIXED
- `<title>`, `og:title`, `twitter:title` and the JSON-LD name now carry the country. Examples:
  - "Comedores sociales en Barcelona (Venezuela)"
  - "Free help in London (United Kingdom)"
  - "مساعدة مجانية في طرابلس (لبنان)"
- Spain is labelled "España" / "Spain". This covers `/t/` pages too. Generator: the `amb` flag in `city_pages.py`.

### m3. A bare 9-byte 404: FIXED
- New `_s/supportnear.com/404.html`, in English with a Spanish line, noindex and absolute links: map, `/c/` and `/?sos=1`.
- The existing worker already serves it with status 404. Tested with the worker harness.

### m4. A slow Esri tile blocks load for about 30 s: NOT FIXED (app `initMap`, owned by another engineer)

### m5. No browser caching; no ETag on HTML: PARTLY FIXED
- **Fixed in the worker**, for supportnear.com only:

  | Request | `Cache-Control` |
  |---|---|
  | `d/*.json` and `l/*.json` with `?v=` (data/language hashes) | `public, max-age=31536000, immutable` |
  | `social*.jpg?v=` (content hash) | `public, max-age=31536000, immutable` |
  | Other images and icons | `max-age=86400, stale-while-revalidate=604800` |
  | Other `json`/`csv`/`js` | 1 h, or 1 day with `?v=` |

  - `?v=` on `holidays.json` and `qr.js` is `DATA_V`, not a hash of the file, so those are deliberately *not* `immutable`.
  - HTML, `sw.js` and the manifest are unchanged (`must-revalidate`).
  - I did not add `_headers`: it is not applied to responses that go through `_worker.js`, and it would sit outside `_s/supportnear.com`.
- **Not fixed (Carlos, Cloudflare):** the ETag/Last-Modified on HTML is dropped because Cloudflare rewrites HTML. Turn off *Scrape Shield → Email Address Obfuscation* for the zone, and either remove Web Analytics *automatic setup* or add the beacon by hand.

### m6. `/falta` (internal memo) is public: FIXED
- `patch_live.py` deletes `_s/supportnear.com/falta.html`, the only deletion it makes. The reason is the one in live.md: it is an internal strategy memo with outdated figures and a Google Fonts request, and nothing links to it.
- In the source it moves to `docs/internal/falta.html`. **Carlos:** do not include `docs/` in the deploy package.
- After the patch, `/falta` returns 404 with the new page.

### m7. `/cambios` empty and 6 weeks old; one lastmod for everything: PARTLY FIXED
- **Live:** the "0 new · 0 gone · +0" block is replaced by an honest sentence, "The last comparison, between 2026-09-14 and 2026-09-16, found no places added or removed…". The internal "reports worker" note is removed.
- **Generator** (`changes_page.py`):
  - It keeps a snapshot of the current data and one of the *previous different* data, so re-publishing the same data no longer produces an empty diff.
  - Tested: running it twice keeps the real diff.
- **Sitemap and JSON-LD:**
  - `city_pages.py` stores a content hash per URL in `pages_lastmod.json`. `lastmod` and `dateModified` change only when the page changes (tested).
  - The live patch sets `lastmod` to today only on pages whose visible text changed (234 in the sample). Link-only changes do not count.
- **Not fixed:** a real diff needs the previous snapshot, which we no longer have. It appears with the next data update.

### m8. An unknown `?city=` silently shows another city: NOT FIXED (app logic, owned by another engineer)

### m9. Sitemap leaves out indexable pages: FIXED
`/about`, `/impacto` and the 19 `/xx/` pages are now in the sitemap, live and in `city_pages.py`.

### m10. `og:image` and `/t/` metadata: FIXED
- `og:image` and `og` tags are added to `/impacto` and `/t/`.
- `/t/<slug>` pages now have:
  - a self hreflang plus `x-default`;
  - JSON-LD (WebPage + BreadcrumbList);
  - a " · " separator in the title;
  - the city name in the page's script ("Безкоштовна допомога у місті Миколаїв", "مساعدة مجانية في دبي").
- Generator: `lite()`.

### m11. Press-kit claims: FIXED (all 11 languages)
These sentences are rewritten in `prensa`, `incrustar` and `instalar` (`p.t200`, `v4`, `e.d2`, `e.d4`, `i.why`):
- "opens in under a quarter of a second / under 250 ms"
- "no third-party analytics / nothing from third parties"

The new text is true whether or not the Cloudflare beacon stays: "light", "no external fonts, no code libraries from other sites, no ads, no cookies; map images and live data come from public map services (Esri, OpenStreetMap, Open-Meteo)".
- The Arabic, Persian and Urdu summaries said "13 languages". They now say 20.
- The source is `i18n_pages.py`; the new strings are in `tools/new_claims.json`.

### m12. `maps.mail.ru` in the Overpass mirror list: NOT FIXED (app, owned by another engineer)
Remove it from the mirror list around line 12958.

### m13. Email obfuscation breaks `mailto:` without JS: FIXED for our pages
- `/about` wraps its 4 `mailto:` links in `<!--email_off-->…<!--/email_off-->`, live and in `about_page.py`. Cloudflare leaves those alone.
- **Recommended (Carlos):** also turn the feature off for the zone (see m5).

## POLISH

### p1. Security headers: PARTLY FIXED
- A meta CSP is added to every static page: c/, need, `.en`, posters, t/, `/c/`, `/t/`, `/huecos`, `/about`, `/cambios`, `/prensa`, `/incrustar`, `/instalar`, `/xx/` and 404.
  - The policy is `default-src 'self'`, `script-src 'self'`, Cloudflare Insights, and the sha256 of each inline script; `object-src`, `base-uri` and `form-action` are `'none'`.
  - It is computed after all edits and recomputed on each run.
  - There are 0 violations in Chromium.
  - Untouched: `index.html` and `impacto.html` (they already have one), and `actualizar.html` (its form talks to the OSM API, so it needs a policy of its own).
- **Not fixed (Carlos, Cloudflare):** HSTS `includeSubDomains` is a zone setting, under SSL/TLS → Edge Certificates → HSTS. Add `preload` only after checking that every subdomain is HTTPS.

### p2. Language switcher on info pages: PARTLY FIXED
- Each page embedded 20 language tables, 9 of them exact copies of English or French. Those copies are gone, which brings `prensa`, `incrustar` and `instalar` from about 240 KB to about 150 KB raw.
  - `pick()` maps wo and bm to French; checked with a `wo-SN` browser.
- **Not fixed:** the switcher still shows 11 languages, because ti, ps, so, am, tr, bn, zh, wo and bm have no translation of these pages. Showing a button that gives English text would mislead. This needs translations in `i18n_pages.py`.

### p3. `/about`: FIXED
- The page now has a single `<h1>`. The English section comes first, with `html lang="en"`; the Spanish section is `lang="es"` and its title is an `h2`.
- The bilingual title, plus unique ids (`#security`, `#seguridad`).
- `security.txt` `Policy:` now points to `/about#security`, with no 308.

### p4. Embed preview redirect: FIXED
The preview is `./?embed=1&city=…`, with no extra 301.

### p5. City names in titles: FIXED
- **English pages** use English names for the 20 cities that had local spellings: Vienna, Munich, Cologne, Naples, Rome, Milan, Lisbon, Bucharest, Copenhagen, Seville…
  - The local name stays in small text next to the H1 ("Free help in Vienna · Wien").
  - URLs and `?city=` are unchanged.
- **Tifinagh** is removed from titles, so "قسنطينة ⵇⵙⵏⵟⵉⵏⴰ" becomes "قسنطينة" and "ⵟⴰⵕⴰⴱⵍⵓⵙ طرابلس Tripoli" becomes "طرابلس".
- **Russian pages for Belarus and Kazakhstan** use the Russian names (Могилёв, Минск, Гродно, Актобе…).
- **Spanish, French and Portuguese pages** show the native form instead of the English one (Córdoba, not "Cordoba"; Panamá, not "Panama City").
- In the source this is `seo_common.display_name()`.

### p6. Google verification file redirects: FIXED (worker)
`/google96c3e59d29b71a66.html` is served at 200 from the worker, supportnear.com only. The meta-tag verification is untouched.

## Unconfirmed 5xx/429
Nothing to fix in the files. Watch Search Console → Crawl stats for 5xx after publishing.

## Also found and fixed along the way
- **"In 13 languages"** appeared on every city page and poster. It is now 20, taken from the language list (`{L}` in `tr/*.json`).
- **The `/prensa` "Direct links" block** listed `.html` addresses. They are now the clean ones.
- **For Carlos to decide:** the homepage FAQ says SupportNear "is funded by public grants, foundations and private donations". `/about` says "no grant, no sponsors". One of them is wrong. This is app copy (`faq.a8`).
