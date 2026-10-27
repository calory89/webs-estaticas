# SupportNear — map fixes (qa/map.md)

Patch: `qa/fix_map.diff` (only `index.template.html`). No other files were changed, so there is no `fix_map_other.diff`.
Totals: **23 fixed · 3 not fixed** (the 3 belong to other engineers).

| # | Status | How |
|---|---|---|
| 1 | FIXED | New `nearestKnown()` fetches unloaded chunks nearest-first (by cell distance) and stops when the next cell can't be closer. Iceland gives 171 km, Australia 718 km and the ocean 837 km. The buttons come from `farChoices()`: the areas of the nearest real places (town/city/addr name, or an arrow plus name) merged with the nearest cities, all sorted by distance. |
| 2 | FIXED | The user's fix is now kept in `S.me` (set by geolocate, follow and shareMe). `renderMe`, the accuracy circle, `drawRoute`/`streetRoute`/compass and the detail distance use `S.me` (route only within 25 km). `#redo` sets `S.gps=false`. |
| 3 | FIXED | `renderMe` removes the dot unless `S.me` exists. A `#p=` link centres with the place's name (header "PMI · N places"), and `S.centerPid` hides the "0 m · 1 min walk" in the detail. |
| 4 | NOT FIXED | Country, emergency number and units belong to the list engineer. |
| 5 | FIXED | The 2 500 cap is gone. Places live in a 1° `GRID` index and every in-view place is bucketed, so the DOM is bounded by the cell grid. The selected place is always included. |
| 6 | FIXED | `refit` frames only places that pass `passes()`, up to 2.4 km (or the single nearest within 8 km), and never zooms out further than that. |
| 7 | FIXED | Each longitude is shifted to the world copy nearest the map centre (and to the next copies when the view is ≥180° wide). The same longitude is used for bounds, projection and marker position. |
| 8 | FIXED | A cluster click at z≥17, or one with zero-area bounds, opens a popup chooser built in the DOM (no inline handlers) that lists the members, each a button that calls `select`. |
| 9 | FIXED | Only `deviceorientationabsolute` is registered when the browser supports it. Events with `absolute!==true` and no `webkitCompassHeading` are ignored, and the heading adds `screen.orientation.angle`. |
| 10 | NOT FIXED | Layout overlap with the detail panel belongs to the UI engineer. |
| 11 | FIXED | Follow mode stops only on `err.code===1`. Codes 2 and 3 keep the watch and show a "GPS signal lost. Still looking…" toast once, plus a `.follow.wait` style, which is cleared on the next fix. |
| 12 | FIXED | Each fix updates `S.me`/`S.acc` (so the circle shows). `sortPlaces()`+`render()` run at most every 15 s. OSRM is asked again only when the user is >30 m off the street route (after 10 s) or every 60 s, otherwise the straight line moves in place. In the test, 5 fixes made 0 extra requests. |
| 13 | FIXED | The far card uses `farChoices(v)` (nearby areas and cities by distance) instead of `CITIES.slice(0,6)`. |
| 14 | FIXED | The geolocation error path no longer sets `S.far`. `setCenter` resets `S.far`, and far mode renders only after a GPS fix with a computed `farDist`. |
| 15 | FIXED | Far mode uses its own `S.farBusy` (spinner, no distance) until `nearestKnown` finishes, then shows the final state. Overpass no longer flips it, and the Emergency button is always shown. |
| 16 | FIXED | `moveend` toggles `#redo` (z≥11 and >1.2 km from the centre), and `setCenter` hides it. |
| 17 | FIXED | Cluster cells are keyed on world-pixel Mercator coordinates (the projection is cached per place), not on container points. 53 of 53 clusters stay identical after `panBy`. |
| 18 | FIXED | At z<8, if the view contains chunk cells that aren't loaded, a "Zoom in to see the places here" button (`#zhint`, translated into 20 languages) shows. Clicking it zooms to 8, which loads them. |
| 19 | FIXED | `ohStatus`/`opensSoon` are memoised per minute (and per country). `sortPlaces` reads confirmations once, creates one Date per call instead of one per place, and sorts only places within 600 km. Markers iterate only the visible grid cells. At 73k places with "open now": markers 77→11 ms, sort 90→36 ms, render 167→67 ms. |
| 20 | FIXED | On an Overpass failure the app says nothing if places are already loaded around. Otherwise it shows the softer "Could not check for newer places right now…" (`ui.errlive`, 20 languages). |
| 21 | FIXED (client side) | `addPlaces`/`mergeLive` merge entries with the same category and same ~11 m cell when one has no name (or both have the same name). The named entry and its id are kept, missing fields are copied over, and the old id stays reachable through `ALIAS`/`findPlace` (deep links, `select`). The QA count went from 11 pairs to 3. The 3 pairs left have different names, so they are really different places. The build pipeline is unchanged. |
| 22 | NOT FIXED | Attribution covered by the bottom sheet is a layout overlap with a panel, which belongs to the UI engineer. |
| 23 | FIXED | The selected pin inside a cluster uses `pname(sel)` for title and alt. Leaflet divIcons never render `alt`, just as before; the title is now correct. |
| 24 | FIXED | Cluster `iconSize`/`iconAnchor` follow the bubble size (40/46/52). All ≥10 clusters are now 0 px off. |
| 25 | FIXED | `km()` rounds before choosing the unit and the decimals: 995 m gives "1.0 km", 9960 m gives "10 km", 9.96 mi gives "10 mi". |
| 26 | FIXED | The accuracy toast uses `km()` (`ui.accpos` is now "±{m}" in all 20 languages). `highlight` adds `.hl` to the cluster that contains a hovered card, and restores the marker's base `zIndexOffset` on leave. |

Tests (served from work_map on :8961): smoke 0 failures · features 0 failures · csp 0 violations · langs `MAL: []`, no JS errors · seatest `off: 0`.

seatest's `maxOff` is now 15. That comes from 2 single pins (their anchor is the pin tip, by design), which now render because the 2 500 cap is gone. Measured on clusters only, the offset is 0. Each bug's repro from map.md was re-run and passes. Embed mode (`?embed=1`) and an offline reload through sw.js also work.
