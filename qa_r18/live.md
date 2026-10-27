# SupportNear live QA: https://supportnear.com (27 Oct 2026)

**Scope.** This was a read-only check. No forms were submitted. Every browser run aborted `**/__sb/**`, so the visit counter was never touched. I fetched 91 pages and parsed them:
- 11 core pages
- 40 city and city×need pages, sampled from the sitemap
- 20 `/t/` pages
- the 20 language share pages

I then checked all 3,847 unique internal links and resources those pages reference. I also checked 150 random sitemap URLs. Browser tests ran in Chromium at 390×844 on a mobile profile. The test IP geolocates to the US (New York).

**Totals: 1 critical, 7 major, 13 minor, 6 polish.** Each item below was reproduced at least twice unless it says otherwise.

Where the fix goes:
- "templates" means `city_pages.py`, `pages.py`, `lang_pages.py`, `i18n_pages.py` or `changes_page.py`.
- "app" means `index.template.html`, built by `build_snapshot.py`.
- "worker/hosting" means `_worker.js` on branch `pub/_wp`, or the Cloudflare zone settings.

---

## CRITICAL

### C1. "Open the map of <city>" sends visitors to a city with the same name in another country
- **URLs.** All city pages for the 11 city names that exist twice in the dataset: London, Barcelona, Valencia, Córdoba, Cartagena, San José, Guadalajara, León (3 cities), Hyderabad, Tripoli and Mérida. The pages affected are the base page, the 8 need pages and the `.en` versions of each, which is about **152 sitemap URLs**. Examples: `/c/london`, `/c/barcelona-food`, `/c/valencia-health.en`. The embed snippet `/incrustar?city=London` has the same problem.
- **Expected.** `/c/london` (United Kingdom) leads to the map of London, UK.
- **Actual.** The page links to `../?city=London` with no country. The app's `pickCity()` picks a match in the visitor's IP country first, otherwise the one nearest the default map centre. From a US IP (2 out of 2 runs):

  | Link | Lands on |
  |---|---|
  | `?city=London` | London, Ontario (`S.center 42.98,-81.25`, `cc=CA`) |
  | `?city=Barcelona` | Barcelona, Venezuela (10.13,-64.68) |
  | `?city=Valencia` | Valencia, Venezuela |

  It also works the other way round: a visitor in Britain who opens `/c/london-canada` gets London, UK. Any council in the UK that embeds `?embed=1&city=London` shows Canada to visitors outside the UK.
- **Fix.**
  - Templates (`city_pages.py` lines 416/419/430/447/622/632, and the incrustar link on line 432): emit something that cannot be ambiguous, such as `?city=London&cc=GB` or `?ll=51.507,-0.128`.
  - App (around line 16739): read `cc` and pass it to `pickCity(qcity, cc)`, which already accepts a country.

## MAJOR

### M1. `/huecos` has 1,030 broken internal links (all 404)
- **URL:** https://supportnear.com/huecos
- **Expected.** Each city in the table links to `/c/<slug>`.
- **Actual.** The table uses `<a href="luena.html">`, which resolves to `/luena.html` at the site root and returns 404. Checked: `/luena.html` 404, `/abidjan.html` 404, `/c/luena` 200. 1,030 of 1,030 links are broken.
- **Fix.** Template: `city_pages.py` around line 794 (`_gtab`) should use `href="c/%s"`.

### M2. The emergency shortcut shows the wrong country's numbers to returning users
- **URL:** `/?sos=1`. This is also the "Emergency numbers" shortcut in `manifest.webmanifest`.
- **Steps.** Visit `/?city=Paris`, then open `/?sos=1` in the same browser.
- **Expected.** France: 112 and 115, plus the nearest emergency room in Paris.
- **Actual (2 out of 2 runs).** The modal shows "EMERGENCY SERVICES · UNITED STATES 911" with the US lines 988, 211 and 1-800-799-7233, next to "Nearest emergency room: Hôtel-Dieu 330 m" in Paris. Closing and reopening the modal fixes it.
- **Cause.** `buildSos()` runs 400 ms after load and reads `S.country || S.guessCC`. `S.country` is not yet set for the restored city, so it falls back to the IP country.
  - This hits anyone whose IP country differs from where they are. That includes refugees and migrants on roaming SIMs, because roaming data usually exits through the home country.
  - With `?city=Paris&sos=1` it is correct.
- **Fix.** App:
  - In the `?sos=1` path, derive the country synchronously from `nearestCity(S.center)` before calling `buildSos()`.
  - When `detectCountry()` sets `S.country`, re-render `#mSos` if it is open.
  - Prefer the location's country over `guessCC()`.

### M3. The privacy promise "It never leaves your phone" is broken once "Use my location" is tapped
- **URL:** `/`. The welcome sheet says: "Use my location — Only to find what is near you. It never leaves your phone."
- **Actual (2 out of 2 runs).** With the geolocation permission granted, these requests went out:
  - The **exact** GPS position (7 decimals, `around:4000,51.5073519,-0.1277583`) is sent to `overpass-api.de`, then to `overpass.kumi.systems` and `overpass.private.coffee` as fallbacks. Each gets both a POST and a GET.
  - `api.open-meteo.com` receives it rounded to about 110 m (`51.507,-0.128`).
  - Walking directions send the exact origin to `routing.openstreetmap.de`.
- **Fix.** App:
  - Round the coordinates sent to Overpass (around line 12960, `qCore`/`qExtra`, called from `loadLive`) to 2 decimals, which is about 1 km, and add 1 km to the radius.
  - Use 1–2 decimals for open-meteo (around line 14876).
  - Reword the copy, for example "We never store it; map servers only see the rough area".

### M4. Multilingual SEO: no non-English entry page can be indexed
- **URLs:** `/`, `/?lang=xx`, `/es/` … `/zh/`
- **Actual.**
  1. The homepage `hreflang` points to `https://supportnear.com/?lang=es` and so on. Those URLs return the English HTML (`<html lang="en">`) with `canonical=/`, so the hreflang targets are not canonical and Google ignores them.
  2. The homepage lists only **13 of the 20** languages: ti, ps, so, am, tr, bn and zh are missing. JSON-LD `WebSite.inLanguage` (`build.py:822`) and `og:locale:alternate` have the same 13.
  3. The 20 share pages `/xx/` are `noindex` with `canonical=/`, yet each declares a 20-language hreflang cluster pointing at other noindex pages. Their `og:url` is `/xx/` while their canonical is `/`.
- **Expected.** One reciprocal, indexable cluster: `/` plus `/es/` … `/zh/`, each with a self-canonical.
- **Fix.**
  - Templates (`lang_pages.py`): make `/xx/` indexable with a self-canonical and a server-rendered localized title, description and H1, still redirecting people into the app.
  - App (`index.template.html` lines ~30–44 and `build.py:822`): point the homepage hreflang at `/xx/` for all 20 languages, with x-default `/`.

### M5. 93% of internal links go to `.html` URLs that redirect (308)
- **Actual.** In the sampled pages, 3,720 of 3,978 internal `<a href>` (93.5%) point to `*.html`, which answers 308 to the clean URL.
  - `/c/` index: 1,221 of 1,222 links.
  - Homepage: 43 of 46.
  - Every city page, for its need pages, `.cartel`, `../t/x.html`, `prensa.html?v=…`, `instalar.html?v=…` and `incrustar.html?v=…&city=`.
  - `/t/x`: `../c/x.html`.
- **Effect.** Every crawl hop costs an extra redirect and dilutes link equity. The `?v=` parameter on HTML links also creates duplicate URLs, though the canonical tags absorb them.
- **Fix.** Canonical, hreflang and sitemap are already clean on the live site, so a post-process exists. Extend it to `href` attributes, or emit clean URLs in `city_pages.py` (lines 367, 546, 619, 432…), `pages.py` and the homepage template. Drop `?v=` on links to HTML pages.

### M6. `www.supportnear.com` serves a full duplicate of the site (200, no redirect)
- **URLs:** `https://www.supportnear.com/` and `https://www.supportnear.com/c/london` both return 200. `http://www.supportnear.com/` returns 301 to `https://www…`, not to the apex.
- **Expected.** A 301 to `https://supportnear.com` with the same path and query.
- **Actual.** The worker strips `www.` and serves the same files. The canonical tag limits the SEO damage. But `www` is a separate origin, so offline city downloads, the service worker cache and saved settings do not carry over between the two hosts.
- **Fix.** Worker/hosting: `if (u.hostname.startsWith('www.')) return Response.redirect('https://' + host + u.pathname + u.search, 301)`, before `site()`.

### M7. Wrong places on London's printable poster and text page
- **URLs:** `/c/london.cartel` (the poster made for printing and putting up), `/t/london`, `/c/london`
- **Actual.**
  - The **only "Food" entry** on the poster is "old jewish soup kitchen · Brune Street 17-19". That is a historic building (the Soup Kitchen for the Jewish Poor, closed in the 1990s, now flats).
  - "London Fields Lido" is listed as "Public showers"; it is a paid swimming pool.
  - "Trades Union Congress Headquarters" is listed as "NGO office".
  - Oxfam, Mind and Salvation Army shops appear as "Free clothes".
  - In London, Ontario, "Phi Gamma Delta" (a student fraternity) appears in "Nearby help".
- **Expected.** Only places that offer free help. This is exactly the risk `/falta` warns about.
- **Fix.** Data or build, in `build.py classify()`:
  - Drop `historic=*` and `disused:*` features, and `name~"^old "`.
  - Drop `leisure=swimming_pool`, `sport=swimming` and `fee=yes` from showers.
  - Drop `office=trade_union`, `office=association` and `club=*` from NGO.
  - Do not label `shop=charity` as "Free clothes".

## MINOR

### m1. Category counts are capped but shown as exact numbers, and hospitals are called "free clinics"
- **Actual.** `build.py:480` sets `W_HEALTH=21` and `W_WARM=13`. Titles and descriptions then say "21 free clinics". In 7 of the 24 sampled pages that mention clinics, the number was exactly 21: Quetta, Kigali, Santo Domingo, Agadir, Shymkent, Gitega, Belém…
- `amenity=hospital` is counted as a "free clinic"; in New York the top item is NewYork-Presbyterian Hospital.
- **Fix.** Templates: write "21+" or "20+" when the cap is hit, and say "clinics and hospitals" instead of "free clinics".

### m2. 23 pairs of identical `<title>` for cities with the same name
- **Examples.**
  - `/c/barcelona-food` and `/c/barcelona-venezuela-food` are both "Comedores sociales en Barcelona · SupportNear".
  - `/c/london-social` and `/c/london-canada-social`.
  - Also pairs for Valencia, León, Cartagena, Guadalajara, Córdoba and Tripoli.
- **Fix.** Template (`city_pages.py`): when the name is ambiguous, add the country, for example "… en Barcelona (Venezuela)".

### m3. The 404 response is a bare 9-byte "Not found"
- **Actual.** It has no link to the map or to emergency numbers, which matters for people who land from an old `/c/` link. The worker already serves `/_s/<host>/404` when that file exists (`worker_wp.js:85`).
- **Fix.** Hosting: add `404.html` to `_s/supportnear.com/`, with links to the map, `/c/` and `/?sos=1`.

### m4. A slow basemap tile can block page load for about 30 s
- **URL:** `/?city=London` (London, ON). 2 out of 2 runs: `load` at 31–32 s and LCP at 36 s.
- **Cause.** `server.arcgisonline.com … /tile/14/6022/4494` and nearby tiles answer **502 after about 15 s**. I confirmed this with curl. Chrome then blocks them (ERR_BLOCKED_BY_ORB). The OSM fallback only starts after 8 or more errors plus a 4 s timer.
- **Fix.** App (`initMap`, around line 13344): switch tile providers on 5xx or timeouts sooner, or give each tile its own timeout. The root cause is external (Esri).

### m5. No browser caching for static assets, and no ETag on HTML
- **Actual.**
  - Every asset is served `cache-control: public, max-age=0, must-revalidate`, including fingerprinted ones: `social-*.jpg?v=…`, `holidays.json?v=…`, icons, `qr.js`, `sw.js`.
  - HTML has no `ETag` or `Last-Modified`. Cloudflare drops them because it rewrites HTML (Email Obfuscation and auto-injected Web Analytics). As a result, the homepage (224 KB brotli, 670 KB raw) downloads again in full on every visit that the service worker does not serve.
- **Fix.** Hosting:
  - `_headers`: `/*.jpg`, `/icon-*`, `/*?v=*` → `max-age=31536000, immutable`; `/d/*` and `/l/*` → at least `max-age=3600`.
  - Turn off Email Obfuscation, and add the beacon by hand or drop it, so that HTML keeps its ETag.

### m6. `/falta`: an internal strategy memo is public
- **URL:** https://supportnear.com/falta. It is `noindex` but anyone can open it.
- **Actual.** Spanish, internal tone, with outdated figures ("458 ciudades · 128 países", "34.580 sitios" against 1,221 and 171,872 today). It contains lines a journalist could quote, such as "un mapa que manda a gente sin techo a puertas cerradas". It has no meta description or canonical, and it loads **Google Fonts**, a third-party request the rest of the site avoids.
- **Fix.** Hosting: remove it from the deploy, or put it behind access control.

### m7. `/cambios` is empty and 6 weeks old
- **Actual.** It says "Updated 2026-09-16 … 0 new places · 0 gone · +0 net since 2026-09-14". The sitemap gives `lastmod=2026-10-04` for all 6,982 URLs.
- **Fix.** Templates (`changes_page.py`): compare against the previous published snapshot rather than the current one. Per-URL `lastmod` should follow the data.

### m8. An unknown `?city=` silently shows a different city
- **URL:** `/?city=Zzzxq` shows New York for a US IP, or the last city visited, with no "city not found" message.
- **Fix.** App: when `pickCity()` returns null and the translated-name retry also fails, show a toast and open search.

### m9. The sitemap leaves out indexable pages
- **Actual.** `/about` and `/impacto` are `index,follow` but are not in `sitemap.xml`.
- **Fix.** Templates: add them to the `urls` list (`city_pages.py:868` area).

### m10. `og:image` missing on `/impacto` and `/t/`; `/t/<slug>` pages have little metadata
- **Actual.** The `/t/<slug>` pages (1,010 URLs, `index,follow`) have:
  - no hreflang and no JSON-LD;
  - titles with a " - " separator instead of " · ";
  - Latin-script city names inside non-Latin titles: "Безкоштовна допомога у місті Mykolaiv", "مساعدة مجانية في Dubai".
- **Fix.** Templates: the `/t/` generator in `city_pages.py`, and `pages.py`.

### m11. Press kit claims that do not hold
- **URL:** `/prensa`
- **Claims.** "No … third-party analytics" and "opens in under a quarter of a second".
- **Actual.**
  - Cloudflare Web Analytics (`static.cloudflareinsights.com/beacon.min.js`) loads on every page.
  - Measured on mobile: homepage TTFB 0.25–0.85 s and DOMContentLoaded 1.1–1.7 s.
- **Fix.** Copy (`i18n_pages.py`, key `p.t200` and related), or remove the beacon.

### m12. A dead fallback server in the code
- **Actual.** `maps.mail.ru/osm/tools/overpass` is in the Overpass mirror list (around line 12958) but not in CSP `connect-src`, so the CSP blocks it. If it were ever allowed, the user's location would go to a Russian host.
- **Fix.** App: remove it.

### m13. Cloudflare Email Obfuscation breaks the contact link without JavaScript
- **URL:** `/about`. The `mailto:` becomes `/cdn-cgi/l/email-protection#…`, which returns 404 without JS. This is also the cause of the missing ETag in m5.
- **Fix.** Hosting: turn the feature off for this zone.

## POLISH

- **p1. Security headers.** `strict-transport-security: max-age=15552000` has no `includeSubDomains` or `preload`. City, `/t/` and `/about` pages have no CSP at all; only `/`, `/impacto` and the info pages have a meta CSP.
  - Fix in hosting: send the headers from the worker.
- **p2. Language switcher on info pages.** `/instalar`, `/incrustar` and `/prensa` offer **11 of the 20** languages (EN…FA). Each page also embeds about 200 KB raw (about 40 KB brotli) of strings for every language.
  - Fix in templates: `pages.py` / `i18n_pages.py`.
- **p3. `/about`.**
  - It is Spanish-only (`lang="es"`) but is linked from the English UI, and it has two `<h1>`.
  - `security.txt` gives `Policy: …/about.html#security`, which redirects (308).
- **p4. Embed preview.** The live preview on `/incrustar` uses `src="index.html?embed=1&city=Sevilla"`, which costs an extra 301 to `/`.
- **p5. City names in titles.**
  - English pages use local names: "Free showers in Wien", "Free clinics in Napoli", "Free help in München".
  - `/c/constantine-warm` appends a Tifinagh name ("قسنطينة ⵇⵙⵏⵟⵉⵏⴰ").
  - `/c/mahilyow-health` uses the Belarusian name inside a Russian title (Магілёў).
- **p6. Google verification file.** `/google96c3e59d29b71a66.html` now redirects (308) to the clean URL, and HTML-file verification may not follow it. The meta-tag verification also exists, so the risk is low.

---

## Unconfirmed (not counted)
During the first bulk crawl (about 3,800 requests, 16 in parallel, roughly 60 req/s), 20 responses were **HTTP 500** and 392 were **HTTP 429**. Examples: `/pt/`, `/t/mariupol`, `/c/havana-health`, `social-fr.jpg`.

None of them came back:
- on a slow retry (412 of 412 were fine);
- on a 300-request burst at 65 req/s (300 out of 300 returned 200);
- on the 150 random sitemap URLs (150 out of 150 returned 200).

The 429 bodies look like Cloudflare or proxy error pages and may come from the test environment's egress. Worth watching for 5xx in Search Console's crawl stats.

## What passed
- **Sitemap.** 6,982 URLs, **none end in `.html`**. All 150 random URLs return 200 with no redirect. No URL in it is `noindex`. `robots.txt` is `Allow: /` with the sitemap declared.
- **City pages.** All 40 sampled pages return 200 with a unique title and meta description and a self-canonical that returns 200.
  - Hreflang between `xx` and `.en` is reciprocal for every sampled page: 65 targets checked, 0 errors, `html lang` matches.
  - JSON-LD parses on every page that has it: WebPage, BreadcrumbList, City/Country, ItemList/Place/GeoCoordinates. On the homepage it is WebSite, WebApplication and FAQPage.
- **`og:image`.** All 19 social images return 200 `image/jpeg`.
- **Mixed content and CSP.** No mixed content, and no CSP console errors on any page tested.
- **Content types.** `.webmanifest` is `application/manifest+json`, `.json` is `application/json`, `.js` is `application/javascript`, `.csv` is `text/csv`, `sitemap.xml` is `application/xml`. `nosniff`, HSTS and `referrer-policy` are present everywhere.
- **Expected redirects.** `/x.html` → 308 `/x`; `/index.html` → 301 `/`; `/es` → `/es/`; `/c` → `/c/`.
- **Static files.** `/.well-known/security.txt`, `/8b51d…txt` (IndexNow key) and `/sw.js` all return 200. Nothing internal is exposed: `build.py`, `DEPLOY.md`, `_src/*`, `_worker.js`, `_headers`, `.htaccess` and the templates all return 404.
- **Mobile 390×844.**
  - The first load works.
  - All 20 `/xx/` pages open the map in their language, with `dir=rtl` for ar, ur, fa and ps.
  - `?city=Paris`, `?need=food` (Food chip active), `?sos=1` (correct with a fresh profile), `?embed=1`, `?now=1` and `#p=way/156620022@…` (opens Centrepoint) all work.
  - No horizontal scroll, broken images or page errors on any of about 60 pages.

## Performance (mobile Chromium, US egress, 2 runs each)
| Page | TTFB | DCL | Load | LCP | HTML (wire / raw) | Total / requests |
|---|---|---|---|---|---|---|
| `/` | 636–853 ms | 1.66–1.73 s | 1.67–1.75 s | 1.3–1.5 s | 224 KB / 670 KB | 587 KB / 13 (9 third-party) |
| `/c/london` | 442–846 ms | 0.6–1.25 s | same | 0.5–0.96 s | 6 KB / 22 KB | 18 KB / 3 |
| `/prensa` | 278–535 ms | 0.57–0.77 s | same | 0.36–0.68 s | 48 KB / 245 KB | 61 KB / 3 |
| `/c/` | 286–417 ms | 0.53–0.66 s | same | 0.41–0.55 s | 19 KB / 77 KB | 31 KB / 3 |
| `/t/london` | 172–388 ms | 0.33–0.57 s | same | 0.21–0.45 s | 1.6 KB / 2.7 KB | 14 KB / 3 |
| `/?city=London` (London, ON) | 254–591 ms | 1.1–1.5 s | **31.7–32.5 s** | **35.9–36.7 s** | 224 KB | see m4 |

With curl, TTFB is 0.2–0.85 s on every page (worker plus Pages, `cf-cache-status: DYNAMIC` for HTML). The homepage carries a 410 KB inline script; with no ETag and `max-age=0`, it downloads again on every visit that the service worker does not serve (see m5).

**Not tested.** `/impacto` data: the page loads it through `/__sb/`, which was blocked by design, so it showed "Could not load the data".
