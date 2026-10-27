# Fixes for qa/list.md (list panel, detail, filters, search)

Working copy: `work_list/`. Diffs: `qa/fix_list.diff` (index.template.html) and `qa/fix_list_other.diff` (build.py, plus towns.json, which is a single-line file, so its diff is large but changes only 7 entries).
Tests: smoke 0 failures, features 0 failures, csp.py no violations, langs.py `MAL: []` with no JS errors. Embed and offline sanity tests also pass. Each repro below was re-run with Playwright; the opening-hours cases were checked with a stubbed `Date`.
New strings (`me.nofix`, `sos.hosp`, `band.vfar`, `now.chips`, `note.empty`, `ui.mic.err`, `data.saved`, `fav.removed`, and Arabic `#two`/`#few` plural forms for minutes) were added to all 20 tables.

## Critical
- **C1 FIXED**: Cards are now matched to places by `data-id` through a `Map`, not by position. All 23 Madrid cards and ↑/↓ navigation open the right place.
- **C2 FIXED**: `shareMe`/`whereAmI` use only a real GPS fix (`getFix()`: `S.fix` less than 60 s old, or a fresh `getCurrentPosition`). They never fall back to `S.center`. With no fix, they say "We could not get your position…" and send nothing. Where am I offers a retry. Results show accuracy (±). The "Where am I?" button no longer depends on `S.center`. `S.fix` is set in geolocate success and in follow mode (one line each).

## Major
- **M1 FIXED**: City, fuzzy and town results are ranked by name match (exact, then prefix, then contains), then the map's country, then distance. Barcelona, Valencia, Córdoba and Barcelnoa all resolve to ES from Madrid.
- **M2 FIXED**: Enter order is: exact city or town name, then a need whose word matches exactly ("food", "comida", "ducha", "shower"), then a name prefix, then any need, then the first non-place result or a place within 30 km. A far place never opens on Enter.
- **M3 FIXED**: `ohStatus` was rewritten on a cached parser (`ohParse`) plus per-day evaluation (`ohDayState`). The last rule naming a day wins, matching `ohRules`/`ohToday`, so the badge, Today line and next-change text agree.
- **M4 FIXED**: A span that started yesterday and wraps past midnight now counts (Fr-Sa 23:00-06:30 is open Sunday at 03:00; Mo-Fr 18:00-08:00 is open Saturday at 07:00).
- **M5 FIXED**: The day selector is tokenised, and `PH` inside a list (`Su,PH off`) applies when today is a holiday. Fallback rules (`||`) and partial `… off` rules are supported.
- **M6 FIXED**: `buildFilters()` is called right after the saved filters are restored.
- **M7 FIXED (render side)**: The far empty state is shown only when `S.farDist > MAXD`. The `geolocate()` error branch that sets `S.far` was left to the map engineer.
- **M8 FIXED**: New `ccAt()` (sync, from cities and towns), `setCountry()` (repaints list, open detail and SOS) and `curCC()` (browser country only while no map centre). `setCenter(lat,lon,name,cc)` sets the country before rendering. Init sets it from the start point. `detectCountry` uses a sequence guard, and `loadLive` only detects for the current area. Madrid now gets metres and ES lines; no stale ES is left in Algeria.
- **M9 FIXED**: `fmtPhone` takes the longest known dial prefix, groups NANP numbers as 3-3-4, keeps already-spaced numbers as written, and drops extensions.
- **M10 FIXED**: Phone numbers are wrapped LTR (`dir="ltr"` or `<bdi>`) in the detail, helplines, far line, SOS, sheet and pocket. Plain-text shares use LRI/PDI (`ltrTxt`).
- **M11 FIXED (relabel)**: The data has no `emergency` tag, so the build would need a full OSM rebuild to keep it. The row now reads "Nearest hospital · call first, it may have no emergency room". Private, mobile, clinic, psychiatric and similar names are excluded. Live places with `emergency=yes` keep the "emergency room" label.
- **M12 FIXED**: `farLineHTML` no longer offers `e.gen` as a social line. The "ask the town hall" block shows it labelled as Emergency services.
- **M13 FIXED**: `select()` writes `#p=id@lat,lon`. Reload reopens a chunk place (Aarhus Natvarmestuen).
- **M14 FIXED**: In Right now mode, chips are `aria-disabled`, show the categories that are actually listed, and are dimmed with one small CSS rule. Taps show a tip and no longer change the filters.
- **M15 FIXED**: `?now=1` uses `setNow(true)`, so the button is pressed and the title is correct.
- **M16 FIXED**: The 7 Trinidad and Tobago towns are corrected to TT in towns.json, and build.py now forces TT for that area. Towns with an empty code get their country from coordinates via `ccAt`, or detection runs; they no longer keep the previous country.
- **M17 FIXED**: `needSearch` also checks the map country's language and English.
- **M18 FIXED**: Countries are matched by `ccName` (UI language and English). Synonyms, category and subtype labels match from the start of a word, so "spain" no longer matches "pain".
- **M19 FIXED**: The plan closes itself when the need pills are not shown (a need, chip or search changed the filters).

## Minor
- **m1 FIXED**: `telHref` splits on `, ; /` and cuts extensions. The new `telP(p)` uses the place's own country.
- **m2 FIXED**: The far card and the location-help modal show the nearest cities, by name in the UI language.
- **m3 FIXED**: Results for a preferred subtype are sorted by band first, then subtype, then distance.
- **m4 FIXED**: Items beyond MAXD get their own band, "More than 30 km away: call before you go".
- **m5 FIXED**: Place results in search are limited to 50 km.
- **m7 FIXED**: Autocomplete, recent and city rows show `ccName(c[4])`. The `ccName` fallback no longer returns a Spanish region.
- **m8 FIXED**: Recents store coordinates and country and reopen towns. The locale guess moved to the top of "Cities".
- **m9 FIXED**: Places without a phrase in show.json (clothes, water, warm) show only the place, not "free food".
- **m10 FIXED**: Text is required for missing and wrong notes. A note without a place goes to the map centre.
- **m11 FIXED**: The Open-now chip calls `buildFilters()`.
- **m12 FIXED**: After "It was open" or "It was closed", the list is re-sorted and re-rendered.
- **m13 FIXED**: For-whom tags are de-duplicated before the cap of 3.
- **m14 FIXED**: Microphone permission or device errors show a toast.
- **m15 NOT FIXED**: Not an app bug. `t/index.html` and `c/index.html` are generated by `city_pages.py` at deploy time (lines 823 and 846), so they are missing only in local builds.

## Polish
- **p1 FIXED**: Data export shows "File saved".
- **p2 FIXED**: Removing a favourite shows "Removed from my places · Undo".
- **p3 FIXED**: `ohHuman` normalises `,` spacing, `||` and quoted comments.
- **p4 FIXED**: Units are localised with `Intl.NumberFormat` unit style (м, م, 米…), with a safe fallback. Minute strings pass `{n}`, and Arabic has two/few plural forms.
- **p5 FIXED**: Bands are derived from `walkMin` (≤10, ≤30, more).
- **p6 FIXED**: `S.limit` is reset in `setCenter` (and so in `goCity`).
- Related **m6 FIXED**: Any all-week `00:00-24:00` is treated as always open. `ohNext` chains 24:00 into a 00:00 opening the next day, `hm(1440)` shows "24:00", and closings more than a day away are not announced.

Notes for the other engineers: in `geolocate()` I only added `S.fix=…`. I did not change `renderMarkers()`. CSS: one rule, `.chip[aria-disabled="true"]{opacity:.5}`.
