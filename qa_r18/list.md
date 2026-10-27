# SupportNear QA: list panel, place detail, filters and search

Build tested: http://127.0.0.1:8951/index.html (minified). Line numbers refer to `qa/index.template.snapshot.html`.
Harness: Python Playwright, Chromium headless, 1280×900 desktop (plus 360×740 mobile), `service_workers='block'`, `**/__sb/**` aborted, locale en-US, TZ Europe/Madrid, today 2026‑10‑27 (Tue). Opening-hours cases used a `Date` override in the page (`window.Date` subclass) or `page.clock`.
Cities covered: Madrid, Paris, London, New York, Berlin, Nairobi, Oslo, Copenhagen, Aarhus, Aalborg (town), Fjerritslev (small town via Nominatim), Tamanrasset (remote town), Port of Spain.
I ran every item below at least twice. Screenshots are in `qa/shots/list_*.png`.

**Totals: 2 critical · 19 major · 15 minor · 6 polish (42 items)**

---

## CRITICAL

### C1. Clicking a list card opens a different place when a collapsed group is above it (mouse, Enter/Space and ↑/↓)
- **Repro:** `goCity(CITIES.find(c=>c[0]==='Madrid'))`, then click the 4th card "Mercadillo Solidario" (it sits below the collapsed "Free public toilets · 32 places" group).
  Check: `[...document.querySelectorAll('#list .card')].forEach(c=>{c.querySelector('.card-t').click(); if(S.sel!==c.dataset.id) bad++; closeDetail();})` gives **20 of 23 cards wrong**.
- **Expected:** the card's own place opens. **Actual:** "Free public toilets" (Plaza de Isabel II) opens. Because the place opened is an auto toilet, `select()` then force-expands the group and the list jumps. The keyboard ↓/↑ handler calls `card.click()` and lands on the wrong places in the same way. Screenshot: `list_wrong_place.png`.
- **Root cause:** `render()` builds `shown` from *every* item of a group, including collapsed groups and items past the 12 shown in an open group (13983‑13984). Cards are then mapped by index: `const pl = shown[i]; … select(pl||c.dataset.id)` (14028‑14030). Any group above a card shifts the index. The keyboard handler at 16551‑16559 relies on the same click.
- **Fix:** resolve by id instead of by index: `const byId=new Map(v.map(p=>[p.id,p]));` and `select(byId.get(c.dataset.id)||c.dataset.id,false)`. Alternatively push only the items that are actually rendered (non-group rows, and `items.slice(0,12)` of *open* groups).

### C2. SOS "Send my location" and "Where am I?" report the city centre as the person's position when GPS is unavailable
- **Repro:** fresh profile with no geolocation permission → search/`goCity` Madrid → `openModal('#mSos')` → "Send my location · to someone you trust".
  Clipboard / WhatsApp text: `I am here: https://www.google.com/maps?q=40.41680,-3.70380` (Puerta del Sol, the Madrid entry in CITIES). "Where am I?" shows "Read this to whoever you call, or send it: Calle Mayor 1, Madrid · 40.41680, -3.70380". Screenshot: `list_sos_wrong_location.png`.
- **Expected:** if no real fix is available, say so ("we can't get your location") and send nothing. **Actual:** a made-up position is sent to a trusted contact, or read out to emergency services, from the emergency screen.
- **Root cause:** `shareMe()` (14675‑14690): `catch(e){ if(!S.center){…return;} }`. When geolocation fails it carries on with `S.center`, which is the browsed city. `whereAmI()` (14691‑14710) never checks `S.gps` at all, and `buildSos` shows the button whenever `S.center` is set (15710). This also happens when GPS works but the user is browsing another city, because `S.center` is then that city.
- **Fix:** both functions should use only a fresh `getCurrentPosition` result (or `S.gps===true` with a recent timestamp). On failure, show `geo.h` and stop. Label the result with its accuracy.

---

## MAJOR

### M1. Search sends "Barcelona", "Valencia" and "Córdoba" to the wrong country (Venezuela / Argentina) even when the user is in Spain
- **Repro:** in Madrid (S.country ES), type `Barcelona` and press Enter. Result: `S.placeName='Barcelona', S.country='VE'` (10.13,-64.68). The same happens for `Valencia` (VE) and `Cordoba` (AR). The typo `Barcelnoa` also goes to VE. The dropdown lists the Venezuelan city first. Screenshot: `list_search_barcelona_order.png`.
- **Root cause:** `localSearch()` keeps CITIES order (15483), and the Enter handler takes the first name match (16600‑16604). `pickCity()` (15369) already prefers the same country or the nearest city, but search never uses it.
- **Fix:** sort `cities` by `(c[4]===S.country)` and then by distance from `S.center` before slicing. Use the same ranking for fuzzy hits.

### M2. Enter ignores the "Help you need" suggestion and opens a far-away place instead
- **Repro:** Madrid, type `food` and press Enter. Result: "Refood Santo António" in **Lisbon, 503 km** opens. The map jumps to Lisbon while the list stays on Madrid, and the detail shows "In Spain: soup kitchens…". `shower` + Enter opens a random "Public showers" item instead of the Showers filter. With the UI in Spanish, `comida` + Enter does nothing locally and only queries Nominatim. Screenshot: `list_search_enter_food.png`.
- **Root cause:** the Enter selector (16600) collects `[data-city],[data-town],[data-geo],[data-pid]` but not `[data-need]`. The first `data-pid` wins.
- **Fix:** if a need suggestion exists and no city or town name starts with the query, click `#ac button[data-need]` first. Never auto-open a place more than about 30 km away on Enter.

### M3. Opening hours: a later rule for the same day does not override an earlier one, so the badge contradicts "Today"
- **Repro (real place):** Berlin, `node/10772767725` "Karuna Drugstop", `Mo-Fr 09:00-14:00; Mo 15:00-17:00`, Monday 10:00. The detail shows **"Today: 15:00–17:00"** next to **"Open now"** (`list_oh_override.png`). Another case: `Mo-Su 09:00-23:00; Fr 12:00-23:00` on Friday 10:00 shows "Open now".
- **Scale:** 240 distinct strings (266 places) have overlapping day rules.
- **Root cause:** `ohStatus()` ORs every matching rule into `open` (12705‑12717). `ohRules`/`ohDayIv` (12764) use OSM "last rule wins" semantics, so status, `ohToday` and `ohNextTxt` disagree (`ohNextTxt` then goes silent, 12823).
- **Fix:** when a rule's day selector matches today, reset `open=false` before evaluating its spans (last match wins), or derive `ohStatus` from `ohRules` whenever that parse succeeds.

### M4. Overnight hours that started yesterday are ignored, so shelters show "Closed now" and drop out of "Right now"
- **Repro:** Aalborg, `node/12075574017` "Safe House – Aalborg", `Fr-Sa 23:00-06:30`, Sunday 03:00. Result: `ohStatus` = closed, tag "Closed now", and it is **excluded from `visible()` in Right now mode**. `ohNext` correctly returns `{open:true, at:390}`. The same happens for `Mo-Fr 18:00-08:00` on Saturday 07:00.
- **Scale:** 138 strings / 156 places with cross-midnight spans limited to certain days.
- **Root cause:** `ohStatus` only evaluates rules whose days include today (12705). It never checks yesterday's wrapping span. `ohNext` does (12770).
- **Fix:** after the loop, also evaluate rules containing `(dow+6)%7` whose span has `b<=a` and `mins<b`.

### M5. "Su,PH off" is not applied on public holidays, so places show "Open now" with no holiday warning
- **Repro:** ES holiday 2026‑12‑08 (Tue) 10:00, `Mo-Fr 09:00-17:00; Su,PH off`. Result: `open`, `hol:false`, tag "Open now". The plain `PH off` form works correctly (it shows closed).
- **Scale:** 322 strings / 375 places, mostly charity shops and social offices in DK/DE/FR.
- **Root cause:** only rules that *start* with `ph` are treated as holiday rules (12670). `su,ph off` falls into the "fuzzy" branch (12674) and is skipped. `hol` is then suppressed because the string contains `ph` (12720).
- **Fix:** tokenise the day selector. Treat a `ph` token as "today" when `phToday()` is true and drop it otherwise, then evaluate the remaining days normally.

### M6. Filters restored after a reload are not shown on the chips
- **Repro:** Madrid, turn off Health and Social help, turn on Drinking water, reload. State: `S.filters = food,shelter,hygiene,clothes,legal,water`. Chips with `aria-pressed=true`: food,shelter,hygiene,clothes,**social**,legal,**health**. Water shows as off. The list shows water fountains and no health places, while the chips claim the opposite. Tapping "Social help", which looks on, actually turns it on. Screenshot: `list_chips_after_reload.png`.
- **Root cause:** `applyLang()` → `buildFilters()` runs at 16672, before the saved filters are restored at 16714‑16721. Nothing rebuilds the chips afterwards.
- **Fix:** call `buildFilters()` right after `S.fltReady=true` (16722).

### M7. After a silent geolocation failure, every empty filter result shows the "nothing mapped here, nearest is 0 m" screen
- **Repro:** returning visitor (has `last`) without location permission, reload Madrid, then switch off every category. Result: "**Nothing mapped where you are** · OpenStreetMap has almost nothing mapped around here yet. The nearest place we know of is **0 m** away…" with city buttons. The normal "Nothing found / Show all kinds of help" state does not appear. Screenshot: `list_far_state_wrong.png`.
- **Root cause:** the `geolocate()` error branch sets `S.far = true` whenever it was not explicit (15363), even though a city with 637 places is loaded. `render()` then takes the `S.far` branch whenever `v` is empty (13927).
- **Fix:** don't set `S.far` on a failed silent fix when `S.center` came from `last` or a city. In `render`, use the far state only when `S.farDist>MAXD`.

### M8. Wrong country for units and helplines: yards and the US "211" line in Madrid; Spain's "012" in Algeria
- **Repro A (en-US browser, first visit, GPS in Madrid):** `geolocate(true)` → cards read "**350 yd**". `S.country` becomes ES about 2 s later, but the list is never re-rendered.
- **Repro B:** Madrid, set the Who filter and Open now, reload. The list's "A phone that can help right now" shows **211 — free helpline for housing and food (US)**, and it stays after `S.country` turns ES (`list_reload_us_helpline_madrid.png`).
- **Repro C:** search for the town Tamanrasset (DZ). For several seconds the far card shows Spain's "012 Regional citizen line".
- **Root cause:** `detectCountry()` sets `S.country` without calling `render()` (15633‑15638). The town branch calls `setCenter()`, which renders, *before* `S.country=tw[4]` (15555). `geolocate` keeps the previous country. Before detection, `S.guessCC` (browser locale) feeds `helpLines()`. `telHref` on cards uses the same stale `S.country`.
- **Fix:** in `detectCountry`, call `render()` (and `select()` if a detail is open) when the country changes. In the town branch, set `S.country` before `setCenter`. Clear `S.country` on a new GPS fix.

### M9. Phone numbers in the detail, sheet and pocket cards are grouped as if they had the wrong country code
- **Repro:** London "+44 20 7636 4030" displays as **"+442 076 364 030"**. New York "+1 212-732-8186" displays as **"+12 127 328 186"**. Berlin "+49 30 2093-91800" displays as "+4930 209 391 800". Screenshot: `list_phone_format_london.png`.
- **Root cause:** `fmtPhone()` guesses the country-code length from the total digit count: `d.slice(0, d.length>10 ? d.length-9 : 2)` (14596‑14598). This is wrong for every NANP, UK, DE and IT number. The `tel:` href is correct, but the visible digits that people read aloud or copy by hand are misleading.
- **Fix:** match the longest known prefix from `DIAL` / the ITU list. When the raw OSM value already contains spaces, keep it as is.

### M10. Phone numbers render reversed in RTL languages (ar, fa, ur, ps)
- **Repro:** `setLang('ar',true)`, open "Biblioteca Escuelas Pías" (Madrid). "+34 914 675 522" is shown as **"522 675 914 34+"**. The same happens in `ur`. Screenshot: `list_rtl_phone_ar.png`.
- **Root cause:** the phone anchors in the detail (14143), helpline buttons (13821‑13823), SOS lines (15686, 15701) and sheet/pocket text are not direction-isolated. `km()` already uses LRI/PDI isolation (12612), but phone numbers do not.
- **Fix:** add `dir="ltr"` to every `a[href^="tel:"]` (or wrap the number in `<bdi dir="ltr">`) and to the phone text in the sheet and pocket cards.

### M11. "Nearest emergency room" in SOS points to private and mobile clinics without an ER
- **Repro:** SOS in Copenhagen shows **"Mølholm Privathospital"**. In Nairobi it shows **"University Mobile Clinic"**. In Madrid it shows "Hospital de la Venerable Orden Tercera" (private). The label reads "Nearest emergency room".
- **Root cause:** `nearestER()` (15763‑15773) accepts any `sub==='hospital'` (or a name match) and has no `emergency=yes` signal.
- **Fix:** keep `emergency=yes` at build time and require it. Otherwise relabel the row as "Nearest hospital (call first)" and exclude `privat|private|mobile|clinic` names.

### M12. The "phone that can help" fallback offers police or general-emergency numbers as a social helpline
- **Repro:** Nairobi with filter Food (empty) shows "If you need to talk to someone now, this line is free in your country: **112** … They know the beds and the meals in your area". Tamanrasset shows **17** (Algerian police) with the same text. Screenshot: `list_nairobi_eat.png`.
- **Root cause:** `farLineHTML()` falls back to `e.gen` (13841‑13842), and `helpLineHTML` wraps it in the social copy `help.p` (13816).
- **Fix:** when no `homeless/social/mental` line exists, don't present `e.gen` as a social line. Show the soft "ask the town hall for social services" block, or label it "Emergencies only".

### M13. The URL written to the address bar for a place does not reopen it
- **Repro:** Aarhus, open "Natvarmestuen" (chunk place). The URL becomes `#p=node%2F10286507935`. Reloading or sharing that URL gives `S.sel=null`, no detail, and the map centred on **New York** (en-US guess). The share button's `#p=id@lat,lon` form works.
- **Root cause:** `select()` writes `'#p='+encodeURIComponent(id)` without coordinates (14073). Init can only resolve ids in the 578-place core (16757‑16770).
- **Fix:** write `'#p='+id+'@'+lat.toFixed(5)+','+lon.toFixed(5)`.

### M14. In "Right now" mode the category and Open-now chips do nothing, but taps still change state
- **Repro:** Madrid, press Right now. All chips stay coloured and pressed, Health included, although Health is never shown. Tap "Social help": the list is unchanged (social places are still listed) but `S.filters` loses social. Turn Right now off: Social help is now silently filtered out and the need pills are gone. Screenshot: `list_now_mode.png`.
- **Root cause:** `passes()` ignores `S.filters`/`S.openOnly` when `S.now` (13248‑13252), while the chip handlers keep mutating them (15261‑15269).
- **Fix:** mark chips `aria-disabled` and dim them in now mode (`buildFilters` knows `S.now`), or make now mode respect the user's filters.

### M15. The `?now=1` link (home-screen shortcut) starts in Right now mode with the button unpressed, so the first tap turns it off
- **Repro:** open `index.html?now=1&city=Madrid`. Result: `S.now=true`, the list is in now mode (120 places), but `#nowBtn aria-pressed=false`, there is no `nowmode` class and the title is "Nearby help". Tapping "Right now" turns the mode off. Screenshot: `list_now_param.png`.
- **Root cause:** `S.now=true` is set at 16744, after `applyLang()` (16672) has already synced the button and title. `setNow` is not used.
- **Fix:** call `setNow(true)` there, or set it before `applyLang`.

### M16. The Trinidad & Tobago towns in towns.json carry country code VE, so SOS shows Venezuela's 911
- **Repro:** search "Port of Spain" and pick the town. The dropdown says "Venezuela" and SOS shows "EMERGENCY SERVICES · VENEZUELA · 911 · Police 171" (Trinidad uses 999/990). Seven TT towns are affected (Chaguanas, Couva, San Fernando, Scarborough…). Another 2,737 towns have an empty code and keep the *previous* country until detection finishes.
- **Root cause:** data in `towns.json`, and `if(tw[4]) S.country=tw[4]` (15555).
- **Fix:** correct the codes (TT). For empty codes, run `detectCountry` synchronously from the town coordinates before rendering.

### M17. Need words are only recognised in the UI language
- **Repro:** English UI in Madrid: `comida` gives no suggestion. `ducha` suggests **Dushanbe** and **Duchang**. Spanish UI: `comida` gives "Ver: Comida".
- **Root cause:** `needSearch` uses only `SYN[LANG]` (15445).
- **Fix:** also test `SYN[LANG_BY_CC[S.country]]` (the local language) and `SYN.en`.

### M18. Searching for "Spain" finds no Spanish cities and suggests "Show: Health"
- **Repro:** type `Spain`. The dropdown shows "Help you need → Show: Health", "Towns → Port of Spain (Venezuela)" and a place 5,598 km away. "France", "Germany" and "Kenya" work. Screenshot: `list_search_spain.png`.
- **Root cause:** all 48 ES rows in CITIES store a *region* in `c[3]` ("Comunidad de Madrid", "Catalunya"…), so the country match (15488) never fires. "spain" contains the English synonym "pain" → health (15446, substring match).
- **Fix:** match countries via `ccName(c[4])` (Intl.DisplayNames in the UI language plus English), not `c[3]`. In `needSearch`, match synonyms on word boundaries.

### M19. The plan card stays stuck on top after choosing a need, with no way to close it
- **Repro:** Madrid, tap Plan, then tap "Eat". The food list is pushed down by "Today's plan" (eat, wash, clothes, help, sleep), and the Plan toggle has disappeared with the need pills. Screenshot: `list_plan_stuck.png`.
- **Root cause:** `nowCard = (S.now || S.plan)` (13968), but `#planBtn` only exists inside `needHTML()`, which is hidden once filters change (13741‑13757).
- **Fix:** reset `S.plan=false` when a need, chip or search changes the filters, or put a close button on `.nowcard`.

---

## MINOR

### m1. `tel:` links break for lists, extensions and numbers from other countries
`telHref("+1 403 225 5102 ext. 226")` gives `tel:+14032255102226`. `"(+993-12) 48-91-14, (+993-12) 48-91-15"` gives `tel:+99312489114+99312489115`. A Finnish local number opened from favourites while viewing Madrid gives `tel:+34406751707`. Root cause: the split only handles `;` and `/`, not `,`, and does not strip `ext|x|poste` (12540). The country comes from the map, not the place (12548). Data: 74 comma lists and about 30 extensions. Fix: split on `[,;/]`, cut at `/(ext|x|poste|loc)\b/i`, and use `nearestCity(p.lat,p.lon)` for the country.

### m2. The far card suggests London, Paris, New York… instead of nearby cities
Tamanrasset (nearest help 122 km away) offers "London | Paris | New York | Mexico City | Buenos Aires | Bogotá". `render()` uses `CITIES.slice(0,6)` (13975), while the empty far state already computes `nearC` (13929). Fix: reuse `nearC`. The same pattern appears in `geoHelp` (15312). Screenshot: `list_farcard_cities.png`.

### m3. Distance band headers repeat and go out of order after a search with a preferred subtype
Search `shower` → "Show: Showers" gives `[10–30 min] Public showers… [Under 10 min] Free public toilets… [10–30 min] Clear Channel… [Further away]`. `visible()` re-sorts by `prefSub` across bands (13270‑13274), and the band printer assumes distance order (13994‑13999). Fix: sort by `band, prefSub, d`, or skip band headers when `S.prefSub` is set. Screenshot: `list_bands_prefsub.png`.

### m4. Short lists quietly mix in places 50–170 km away
Nairobi, Showers only: the chip says "1" and the subtitle says "12 places". Under "Further away" the list shows items at 56, 100, 139 and 168 km with no far warning, because `farCard` only appears when the *first* item is beyond MAXD (13971). Cause: `visible()` falls back to the 25 nearest within 400 km when there are fewer than 3 near items (13275‑13282). Fix: show the far tip whenever any listed item is beyond MAXD, or cap the fallback at about 2×MAXD.

### m5. Place results in search are not distance-limited
`food` in Madrid lists food banks 503–1,718 km away. `طعام` lists items 1,263+ km away. Choosing one moves the map there while the list stays on the old centre. `localSearch` (15496‑15502) searches all loaded places. Fix: limit to about 50 km of `S.center`, or group far results under "Elsewhere".

### m6. "24h" written as `00:00-24:00` triggers false "closes soon" warnings
`Mo-Su 00:00-24:00` at 23:55 shows "closes in 5 min" (shut-soon tip in the detail). Today is shown as "00:00–00:00". The always-open regex only matches the bare `00:00-24:00` (12661). 25 places affected. Fix: treat any day span `00:00-24:00` that covers all days as always open, and make `ohNext` skip a closing at 24:00 when the next day opens at 00:00.

### m7. Autocomplete shows country and region names untranslated
In `es`, `ar` and `fr` the rows show "United Kingdom", "Denmark", "Germany" and "Comunidad de Madrid". `acHTML` prints `c[3]` (15526, 15530) instead of `ccName(c[4])`, which the towns rows already use (15534).

### m8. "Recent" shows a city you never visited and hides towns you did
After visiting Madrid and Aalborg, "Recent" shows **Madrid, New York** (the en-US locale guess is pushed into the recent list, 15572‑15573). Aalborg is missing because recent entries are only mapped to CITIES (15571). Fix: show the guess under its own heading, and render town recents from the stored lat/lon.

### m9. "Show this to someone" says "free food" for clothes, water and warm-space places
Oslo, "Fretex Arkivet" (charity shop) → "Jeg leter etter: **gratis mat**". `needOf()` (14639) has no `clothes`/`water`/`warm` entries and defaults to food. Fix: add those keys to `needOf` and `l/show.json`, or default to the place name only.

### m10. An empty "missing place" note is posted to OpenStreetMap at the city centre
Menu → "Add a place that is missing" → Send, with no text. Result: `POST api/0.6/notes.json?lat=40.416800&lon=-3.703800&text=A free-help place is missing here…`. The note is public, at Puerta del Sol, and has no information (14367‑14378). Fix: require text for `missing`/`wrong`, and use the map centre or a tapped point, not the city centroid.

### m11. Leaving Right now / Open-now does not restore the neutral chip style
Toggling "Only open now" leaves `body.allcats` true, so chips stay neutral. The `#fOpen` handler (15269) doesn't call `buildFilters()`, which owns that class (15233).

### m12. Marking a place as open or closed doesn't refresh the list card or its ranking
After "It was open" in the detail, the card in the list has no "You saw it open" badge and keeps its position until another render. `vOk`/`vNo` call only `select(p,true)` (14248‑14249). Fix: call `sortPlaces(); render();` before re-selecting.

### m13. "Who it is for" tags repeat and the cap is applied before de-duplication
"Kontakt- und Beratungsstelle für Flüchtlinge" (Berlin, `refugee;migrant`) shows "migrants & refugees" twice. `forTags()` maps and then slices to 3 without a `Set` (13684‑13688).

### m14. Microphone errors give no feedback
With `SpeechRecognition` failing (`not-allowed`), the button just resets: no toast, no hint (14722). Fix: toast `t('ui.mic.err')` with a pointer to permissions.

### m15. Two menu links return 404 on the local build
"Text-only version" goes to `t/index.html` and "All cities" goes to `c/index.html`: both return 404 from `src/` (16296, 16311). They may be generated at deploy time; confirm they exist in production.

---

## POLISH

### p1. Downloading CSV or GeoJSON shows the toast "Image ready — save it or send it"
`exportData.save()` reuses `t('share.made')` (16243). Add a `data.saved` string.

### p2. Removing a favourite shows the action label as the confirmation
The toast reads "Remove from my places · Undo" (14221). It should read "Removed from my places".

### p3. Raw OSM syntax leaks into opening-hours text
Examples: "Mon–Fri 11:00–19:00 · Sat–Sun,public holidays…" (no space after the comma), "… Sat 10:00–13:00 || "Se…" (Aalborg, Mødrehjælpen) and "Sun–Fri 09:00–15:00: Sat…". `ohHuman()` (12789‑12807) doesn't normalise `,`, `||` or quoted comments.

### p4. Units and minute plurals are not localised
`km0()` always outputs Latin `m`/`km` (12619‑12620), while the same screens say "500 м" (uk/ru) and "500 م" (ar). `ui.walk`/`oh.closesin` pass `{m}` rather than `{n}`, so plural forms are never used. Arabic reads "5 دقيقة مشيًا" (should be دقائق) (12593).

### p5. Walking minutes and band labels disagree at the edges
At 2,380 m the card says "31 min walk" under "10–30 min walk". Bands cut at 800/2400 m (13994), while `walkMin` uses 78 m/min (12622). Derive the bands from `walkMin`.

### p6. The "Show more" page size persists across cities
After scrolling Paris to 72 rows, `goCity(Madrid)` renders 72 cards immediately (`S.limit` is never reset in `goCity`, 15378). Reset `S.limit` in `goCity` and `setCenter`.

---

### Checked and found working
- Chip counts match the single-category list counts in Madrid and Paris.
- Pluralisation of `ui.results`, `grp.n`, `open.hidden` and `ver.days` in es/fr/ar/uk/ru/pl.
- Translation coverage: only the unused `ui.away` key is missing in es/fr/uk.
- No horizontal overflow at 360 px in es/fr/uk/ar/am.
- Detail close (X, Esc, browser Back) and focus return to the card.
- Favourite toggle and undo.
- Private note save and clear.
- Copy address.
- Share (clipboard + wa.me).
- CSV and GeoJSON content (637 rows in Madrid).
- SOS numbers for ES/FR/GB/US/NO.
- Mic happy path.
- Towns search (Aalborg) and Nominatim fallback (Fjerritslev).
- No uncaught page errors in any flow; console errors are only blocked third-party requests (Overpass CORS, tiles, `__sb`).

### Not verifiable here
- Photon autocomplete (times out through the sandbox proxy).
- Compass heading: this Chromium exposes `DeviceOrientationEvent.requestPermission`, so listeners never attach headless.
- Real `navigator.share`.
