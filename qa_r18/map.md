# SupportNear — QA report: map and data

Date: 2026-10-27 · Build: http://127.0.0.1:8951/index.html (served from /home/claude/sn/src) · Source line numbers refer to `qa/index.template.snapshot.html`.
Tooling: Python Playwright with Chromium. `__sb` was aborted and service workers were blocked. Overpass was aborted or left hanging where noted, to make results deterministic. Every bug below was reproduced at least twice. Screenshots are in `qa/shots/map_*.png`.

**Totals: 0 critical · 10 major · 13 minor · 3 polish (26 items).**

**Regression check: "points in the sea" (`.clus{position:absolute}`)** stays fixed. Zooms 2→19→2 were swept twice (animated and not), plus fast +/− clicks, wheel, double-click, `flyTo` and drag+wheel. Every pin is at 0 px from its latitude/longitude. Every cluster is anchored on one of its real members, so a cluster never sits on water when its members are on land. The only offset left is the cosmetic 6 px one in item 24. No JS exceptions or console errors appeared at any step. The only console noise was network errors: `__sb` aborted, and Overpass/OSRM blocking CORS for the `127.0.0.1` origin.

---

## MAJOR

### 1. "Nearest place" in far mode is wrong by hundreds of km and points people to the wrong cities
- **Repro:** use a context with geolocation (64.9,‑17.0) (north-east Iceland), then run `geolocate(true)` and wait 4 s.
- **Expected:** a message like "nearest place 171 km away". The true nearest place in the data is at 64.31,‑20.31. The city buttons should be Icelandic.
- **Actual:** the app says *"Nothing mapped where you are… nearest place we know of is 759 mi (1 221 km) away"* and offers Glasgow, Bergen and Edinburgh.
  - Other cases: (‑25,135) in Australia says 1 149 km; the truth is 718 km. (0,‑30) in the ocean says 1 034 km; the truth is 837 km (Brazil coast).
  - The text is also self-contradictory. It says "nearest place 642 mi", but the "Natal" button next to it says "538 mi" (`map_far_ocean.png`).
- **Verified:** the true nearest place comes from `await ensureChunks(la,lo,700)` followed by a min over `dist()`. This was run twice for 3 places.
- **Root cause:**
  - `geolocate` computes `S.far`/`S.farDist` only over `S.places` that are already loaded (l.15330‑15333). `refit` does the same (l.15345).
  - The only chunks fetched are within `ensureChunks(lat,lon)`'s default 40 km radius (l.13188 → l.13120 `const r = km || 40`).
- **Fix:**
  - When `best > 40000`, fetch progressively larger radii (150 → 400 → 1000 km, stopping at the first that yields a place) before deciding far/farDist. For example: `for (const r of [150,400,1000]) { await ensureChunks(la,lo,r); best=min…; if(best<r*1000) break; }`.
  - A cheaper alternative: precompute each chunk's bbox/centroid in `CHUNKS`, and take the nearest non-empty chunk distance without fetching.
  - Build the `nearC` buttons from the cities of the nearest found places, not from `CITIES` alone.

### 2. "Search this area" moves the "You are here" dot, accuracy circle and walking route to the map centre
- **Repro:** use a context with geolocation (40.4168,‑3.7038), acc 300.
  1. `geolocate(true)`
  2. `map.setView([40.4168,-3.66],15)` (3.7 km east)
  3. click `#redo`
  4. `select(visible()[0])`
- **Expected:** the blue dot and accuracy circle stay where the person is. Distances and the route are measured from the real position, or the UI says "from the searched area".
- **Actual:** the dot and the ±300 m circle jump to 40.4168,‑3.66. The dashed route and the OSRM walking route start at the map centre, and the label says "↘ 690 m · 9 min walk" (`map_redo_moves_you_dot.png`).
- **Root cause:**
  - The `#redo` handler calls `setCenter(c.lat,c.lng)` with no name (l.16621).
  - `setCenter` only clears `S.gps` when a name is passed (l.13186), so `S.gps` stays `true`.
  - `renderMe` (l.13401‑13410) and `drawRoute`/`streetRoute` (l.14428, l.14450) treat `S.center` as the user's position.
- **Fix:** keep the user's fix separately, e.g. `S.me={lat,lon,acc}` set only in `geolocate`/`startFollow`.
  - `renderMe` and the accuracy circle should use `S.me`.
  - `drawRoute`/`streetRoute`/compass should use `S.me`, and only when it is within ~25 km of the destination.
  - Distances in the list can keep using `S.center`. Also set `S.gps=false` in the `#redo` handler.

### 3. "You are here" dot is drawn without any GPS fix: on the guessed city, a searched city, or on top of a shared place
- **Repro A:** fresh load. `meMarker.getLatLng()` is New York's centre, and the element title is "You are here", while `S.gps===null` (`map_you_are_here_without_gps.png`). The same happens after `goCity(...)` for any city (`map_controls_under_detail_1100.png` shows the dot on Puerta del Sol).
- **Repro B:** open `index.html#p=node/9204135756@44.86227,-0.57552`.
  - The dot titled "You are here" sits exactly on the shared place.
  - The detail says "0 m · 1 min walk" and the header "nearest 0 m" (`map_shared_link_you_are_here.png`).
- **Expected:** no "you are here" marker unless `S.gps`. A searched centre could use a neutral "search centre" marker instead.
- **Root cause:**
  - `renderMe` never checks `S.gps` (l.13401‑13408). It is called from every `setCenter` (l.13189).
  - The deep-link path calls `setCenter(p.lat,p.lon)` on the place itself (l.16765, l.16767).
- **Fix:** in `renderMe`, add `if(!S.gps){ if(meMarker){map.removeLayer(meMarker); meMarker=null;} return; }`, or switch the icon/title to a neutral "search centre". For `#p=` links, centre on the place but do not compute "0 m" distances from it.

### 4. After a GPS fix, the old country's emergency number and units are kept (999/911 in Madrid; yards forever)
- **Repro (realistic):** use a context with locale `es-ES`, tz `Europe/Madrid`, geolocation Madrid, and Overpass left hanging (slow).
  1. `goCity(pickCity('London','GB'))`
  2. `geolocate(true)`
  3. after 0.7 s: `buildSos()`
- **Actual:**
  - The SOS sheet says **"Emergencias · Reino Unido — 999"** (`map_sos_us_in_madrid.png` shows the same with the US default: "911 · United States").
  - After 15 s, `S.country` has become `ES`, but the list still says **"350 yd"** and "el más cercano, a 350 yd". It stays that way until something else calls `render()` (`map_units_yards_in_madrid.png`).
  - In the ocean the "phone that can help right now" card shows the US **211** helpline (`map_far_ocean.png`).
- **Expected:** country, emergency number, helplines and units match the GPS position as soon as the fix arrives.
- **Root cause:**
  - `geolocate` never sets `S.country` (l.15325‑15337).
  - The country is only refreshed by `detectCountry`:
    - at the very end of `loadLive`, after Overpass returns. Overpass is up to 4 servers × 2 methods × 26 s (l.13206‑13217, l.12984, l.13001);
    - or by the `moveend` timer, 1.5 s later and only at zoom ≥ 11 (l.13362‑13374).
  - `detectCountry` sets `S.country` but never re-renders (l.15633‑15639), so `km()`, which reads `S.country` (l.12615), stays in miles.
- **Fix:**
  - In `geolocate`'s success callback, synchronously set `S.country` from `nearestCity(la,lo)` (and `TOWNS` if loaded) before `setCenter`.
  - In `detectCountry`, when `cc !== S.country`, set it and call `render(); updateChipCounts();`.
  - Call `detectCountry` before `loadLive`, not after it.

### 5. A hard 2 500-place cap makes low zooms lie: clusters under-count, whole countries vanish, and the selected pin disappears
- **Repro:**
  1. `goCity(Paris)`, then `await ensureChunks(47,3,1300)` (73 185 places).
  2. `map.setView([46,3],6)`.
- **Actual:**
  - Clusters add up to **2 501** while 56 208 loaded places are in view.
  - Spain, Germany, Switzerland and Italy show no clusters at all (`map_cap2500_z6.png`, `map_cap2500_z5.png`).
  - Even Madrid alone at z8 draws 2 501 of 3 008. During the zoom sweep, every zoom ≤ 8 drew 2 501 and expected 2 759–6 720.
- **Also:** after selecting a place in Lyon while the list centre is Paris, `map.setView([46.5,3.5],7)` leaves the detail open but drops its pin (`markers[id]` absent at z7 and z6) (`map_selected_pin_dropped_by_cap.png`).
- **Root cause:** `if(inView.length>2500) break;` (l.13424). It iterates `S.places` in distance order from `S.center`, so everything far from the list centre is dropped silently. The `p!==S.selPlace` exemption (l.13421) is also cut off by the break.
- **Fix:**
  - Remove the cap from the counting pass. Bucket all in-view places into grid cells (cheap: one projection per place), then cap only the number of DOM markers.
  - Or aggregate per chunk at z<9 (counts per cell precomputed at build time).
  - Always push `S.selPlace` after the loop.

### 6. After geolocating, the map frames hidden places, so a "Sleep"-only search shows an empty map
- **Repro:** use a context with geolocation (40.4168,‑3.7038).
  1. `S.filters=new Set(['shelter']); buildFilters(); render();`
  2. `geolocate(true)`, then wait 4.5 s.
- **Expected:** the view includes the nearest shelters.
- **Actual:** the map stays at z16 framed on two water fountains (86 m, 97 m) and a warm space (218 m). None of these is on the map. The three nearest shelters (637 m, 1.3 km, 1.9 km) are all off-screen. A second spot (40.43,‑3.68) shows **0 markers** (`map_refit_ignores_filters_40.4168.png`, `…_40.43.png`).
- **Root cause:** `refit` picks `S.places.filter(p=>p.d!=null)` without `passes()` (l.15349). Water and warm are also off by default, so this happens even with no filter touched (Nairobi frames 535–643 m hidden spots).
- **Fix:** `const near=S.places.filter(p=>p.d!=null && passes(p)).sort(...).slice(0,3)`. Also cap the frame at the walking bands, so it does not zoom to a single far shelter.

### 7. Places across the antimeridian are never drawn (Fiji ↔ Samoa/Tonga), and world copies are empty
- **Repro:**
  1. `goCity(Apia)`, then `await ensureChunks(-18,178.4,600)`.
  2. `map.setView([-15.5,183],6)`.
- **Actual:** 12 Samoa places lie inside the view (as lon+360), but 0 markers are drawn west of the line. Only the Fiji side shows. The mirror case `setView([-16,-178],6)` shows only Samoa (`map_antimeridian_east.png`). Dragging from Samoa westward behaves the same.
- **Root cause:** `renderMarkers` compares raw `p.lon` with `b.getWest()/getEast()`, which can be < ‑180 or > 180 (l.13422). It also projects and places markers at raw `p.lon` (l.13431, 13441, 13447, 13461). With `worldCopyJump`, bounds such as 167…188 never contain ‑171.
- **Fix:**
  - Shift each longitude to the copy nearest the map centre: `const lo = p.lon + 360*Math.round((map.getCenter().lng - p.lon)/360);`.
  - Use `lo` for the bounds test, for `latLngToContainerPoint`, and for the marker `LatLng`.
  - At z ≤ 2 on wide screens, this also fills the empty world copies.

### 8. Places with identical coordinates become a cluster that cannot be opened
- **Repro:**
  1. `await ensureChunks(39.48841,-1.08934,40)`
  2. `map.setView([39.48841,-1.08934],19)`
- **Actual:** a "2" cluster stays at z17, z18 and z19. Clicking it at z19 *zooms out* to 18. Neither "Hospital General" (way/127093484) nor relation/11594777 can be opened from the map (`map_samecoord_cluster.png`). A second case is 51.04515,3.68123 in Ghent: two toilet entries, same result.
- **Scope:** Western Europe alone has 11 such pairs (see item 21).
- **Root cause:**
  - At z ≥ 17, `cell=1` px still groups points on the same pixel (l.13426).
  - The cluster click does `fitBounds(bb.pad(.35),{maxZoom:18})` on a zero-area bounds (l.13475‑13478). It has no fallback when the zoom can't increase.
- **Fix:** in the click handler, check `if(map.getZoom()>=17 || bb.getNorthEast().equals(bb.getSouthWest()))`. Then either open a small chooser listing the members (popup with `pname` links that call `select`), or spiderfy (offset members radially by ~20 px).

### 9. Compass arrow flips between two headings on Android (absolute and relative events mixed)
- **Repro:** with GPS on in Aalborg, select a place < 1.5 km away and click `#cmpBtn`. Then feed alternating events:
  - `onCompass({alpha:0,absolute:true})`
  - `onCompass({alpha:300,absolute:false})`
  - …repeat.
- **Actual:** `compassH` alternates 0 → 60 → 0 → 60, and the arrow alternates `rotate(288deg)` / `rotate(228deg)`.
  - On Chrome Android, both `deviceorientationabsolute` (north-referenced) and `deviceorientation` (relative to an arbitrary start) fire, so the arrow jitters by an arbitrary angle.
  - Verified with synthetic events. Headless Chromium has no sensor.
- **Root cause:**
  - `startCompass` listens to both events (l.14575).
  - `onCompass` uses `360-alpha` from either, without checking `e.absolute` (l.14569).
  - Screen orientation (landscape) is not compensated either.
- **Fix:**
  - Register `deviceorientationabsolute` when `'ondeviceorientationabsolute' in window`, otherwise `deviceorientation`.
  - In the handler, ignore events with `e.absolute===false && e.webkitCompassHeading===undefined`.
  - Add `(screen.orientation?.angle||0)` to the heading.

### 10. Zoom +/− and "my location" buttons are hidden behind the place detail at 901–1279 px
- **Repro:** set the viewport to 1100×760 (also 1024 and 901), `goCity(Madrid)`, then `select(visible()[0],true)`.
- **Actual:** `elementFromPoint` on `#zin`, `#zout` and `#locate` hits `#detail`. Only a 14 px sliver of the green locate button shows (`map_controls_under_detail_1100.png`, `…_1024.png`, `…_901.png`).
- **Root cause:**
  - `.mapfx--br{inset-inline-end:calc(var(--panel-w) + 14px)}` (l.492) uses `--panel-w` = 330–352 px (l.244, l.1082).
  - The 400 px detail (l.527) overlays it.
  - The `.dopen` variable bump exists only for ≥1280 px (l.639‑640).
- **Fix:** add `@media (min-width:901px) and (max-width:1279px){ html.dopen .mapfx--br{inset-inline-end:calc(400px + 14px)} }`. Or apply `html.dopen{--panel-w:400px}` in that range.

---

## MINOR

### 11. "Follow me" stops for good on the first transient position error
- **Repro:** with GPS on, select a place and click `#followBtn` (`followWatch=1`). Then send CDP `Emulation.clearGeolocationOverride`, which causes POSITION_UNAVAILABLE.
- **Actual:** `followId=null` and `followWatch=null`, and the button resets silently. Real phones emit code 2 and code 3 (timeout 20 s) in tunnels, indoors and under bridges.
- **Root cause:** the error callback is `()=>{ stopFollow(); }` (l.14552).
- **Fix:** stop only on `err.code===1`. For codes 2 and 3, keep the watch and show a small "searching GPS…" state.

### 12. "Follow me" keeps the rest of the UI stale and calls the routing server on every fix
- **Repro:** follow mode with a stubbed `watchPosition`, then 5 fixes 45 m apart.
- **Actual:**
  - The selected place's distance updates (320 → 100 m).
  - Other list rows keep old distances ("Free public toilets" 256 m, really 476 m), and the header still says "nearest 320 m".
  - The ±accuracy circle never updates (`S.acc` not set; a 400 m fix shows no circle).
  - **5 OSRM requests in 5 fixes.** This hammers FOSSGIS, whose usage policy forbids it.
- **Root cause:** `startFollow` (l.14543‑14551) sets `S.center` but neither `S.acc` nor `sortPlaces/render`. `drawRoute` → `streetRoute` runs on every fix, keyed by `S.center.toFixed(4)` (l.14454).
- **Fix:**
  - Throttle: re-route only if the user has moved more than 30 m off the polyline, or every 60 s.
  - Update `S.acc` and call `renderMe()`.
  - Call `sortPlaces(); render()` at most every 15 s.

### 13. The "closest help is a long way off" card offers London, Paris, New York, Mexico City… instead of nearby cities
- **Repro:** use a context with geolocation (23,10) (Sahara), or (20,‑12) (Mauritania), then `geolocate(true)`.
- **Actual:** the `.tip--far` buttons are London, Paris, New York, Mexico City, Buenos Aires and Bogotá (`map_farcard_wrong_cities.png`).
- **Root cause:** `CITIES.slice(0,6)` at l.13975. The empty-state branch correctly sorts by distance (l.13929).
- **Fix:** reuse the `nearC` computation from l.13929.

### 14. Far mode gets stuck after a silent geolocation failure, and a city full of places says "Nothing mapped… 0 m away"
- **Repro:** use a context with locale es-ES and tz Madrid, without the geolocation permission. Madrid is guessed (637 places).
  1. `geolocate(false)`
  2. `S.filters=new Set(['legal']); buildFilters(); render();`
- **Actual:** "Aquí no hay nada mapeado … Lo más cercano que conocemos está a 0 m" (`map_far_after_denied_geo.png`).
- **Root cause:** the first-visit error path sets `S.far = true` (l.15363), and `farDist` stays undefined (l.13933). Nothing resets `S.far` except `goCity`.
- **Fix:** do not set `S.far` on error. Far mode must be based on a real position and a computed `farDist`.

### 15. The far-mode message flips from final to "Looking around you…" and loses its buttons
- **Repro:** use geolocation (0,‑30) with Overpass hanging, then `geolocate(true)` and observe the list heading.
- **Actual:**
  - t=0 s: "Nothing mapped where you are" with Add/Emergency buttons.
  - t≈2 s: switches to a spinner, "Looking around you…" and the same "nothing mapped… 642 mi" text, with no buttons.
  - It stays like that until Overpass gives up, which can take minutes (4×2×26 s).
- **Root cause:** `busy = S.busy && !S.searched` (l.13928). `loadLive` sets `S.busy` after the first render (l.15336‑15337, l.13207). A later render (refit at 2 s) flips it.
- **Fix:** set `S.busy` before `setCenter` in `geolocate`, or show the searching state only if no final message has been shown. Always keep the Emergency button.

### 16. The "Search this area" button never hides
- **Repro:**
  1. Pan more than 1.2 km at z ≥ 11 (`#redo` appears).
  2. Pan back to `S.center`: still visible.
  3. Pick another city with `goCity(...)`: still visible (`map_redo_stays_after_city.png`).
  4. Zoom out to 8: still visible.
- **Root cause:** `moveend` only ever adds `.on` (l.13364). It is removed only by `#redo`/`#locate` clicks (l.16618, l.16621).
- **Fix:** `$('#redo').classList.toggle('on', map.getZoom()>=11 && dist(...)>1200)`, and remove `.on` in `setCenter`.

### 17. Clusters regroup on every small pan
- **Repro:** Madrid at z12 (41 clusters), then `map.panBy([45,30])`.
- **Actual:** only 6 of 40 clusters keep the same members and position, and counts jump while dragging (`map_cluster_regroup_a.png` vs `_b.png`).
- **Root cause:** the grid is keyed on `latLngToContainerPoint` (l.13431‑13432), which is relative to the current viewport.
- **Fix:** key on world pixel coordinates, `map.project([lat,lon], z)`, so the grid is fixed to the map, not the screen.

### 18. Below zoom 8 no data is ever loaded, so countries look empty
- **Repro:** fresh load in Madrid, then `map.setView([51,10],6)` (Germany).
- **Actual:** no markers in Germany, although `CHUNKS` has the data. What appears at z ≤ 7 depends only on where the user has been before.
- **Root cause:** `if(map.getZoom()>=8) ensureChunks(...)` (l.13362).
- **Fix:** ship a tiny per-chunk count/centroid index, and draw count bubbles per chunk at z < 8 without fetching the chunks. Or show a hint: "zoom in to load places".

### 19. Performance degrades as places accumulate, which they always do
- **Measurement:** with 73 185 places loaded (Western Europe):
  - `renderMarkers()` at z8 takes 10–15 ms.
  - With "Only open now" on it takes **88–215 ms** on desktop.
  - `sortPlaces()` takes 146 ms, and `render()` 43 ms (194 ms at 4× CPU throttle).
  - 10 programmatic pans take 655 ms at 4× throttle.
- **Leaks:** none (heap and DOM nodes are stable over 300 pans).
- **Root cause:**
  - Every `moveend` filters the whole `S.places` with `passes()`, which calls `ohStatus()` per place when `openOnly` is on (l.13247‑13256, l.13420).
  - `PLACES` is never pruned.
- **Fix:**
  - Pre-filter with a cheap bbox index, e.g. keep places per chunk key and iterate only chunks that intersect the view.
  - Memoise `ohStatus` per place per minute.

### 20. "Search this area" reports "We could not load the map data" when only the live Overpass extra failed
- **Repro:** abort `**/api/interpreter**`, which simulates Overpass returning 429 or 504 (both seen live during testing). Then click `#redo`.
- **Actual:** the toast says "We could not load the map data", while 639 places from the offline chunks are on screen (`map_redo_moves_you_dot.png`, bottom).
- **Root cause:** `loadLive` shows `t('ui.err')` on any Overpass failure (l.13213).
- **Fix:** stay silent when chunk data covers the area. Otherwise use a softer "couldn't check for newer places".

### 21. Duplicate facilities in the data: the same coordinates appear as two entries, one named and one unnamed
- **Repro:**
  1. `await ensureChunks(46,3,1200)`
  2. Group `S.places` by `lat.toFixed(6)+lon.toFixed(6)`.
- **Actual:** 11 pairs (22 places). Examples:
  - "Hospital General" way/127093484 + unnamed relation/11594777
  - "PMI" node/9204135756 + unnamed node/9204135755
  - Centro Paroquial … way/1079520165 + unnamed way/992343889
- **Impact:** inflated counts, and the un-openable clusters of item 8.
- **Fix:** in the build pipeline, merge entries of the same category within ~15 m when one has no name. Keep the named one and union their tags.

### 22. Mobile: the map attribution (Esri/OSM) is always hidden under the bottom sheet
- **Repro:** set the viewport to 390×844 (or 360×640) and `goCity(Madrid)`.
- **Actual:** `.leaflet-control-attribution` is at y=830–844, and `elementFromPoint` hits `#panel` at all 3 sample points. The Esri tile licence requires a visible attribution.
- **Root cause:** the sheet (`#panel`, top 552) overlays the bottom of `#map`. l.821 only truncates the text.
- **Fix:** on ≤ 900 px, move the attribution to `topleft`/`topright` (`map.attributionControl.setPosition('topright')`). Or offset `.leaflet-bottom` by the sheet height.

### 23. A selected unnamed place inside a cluster gets an empty marker title and alt
- **Repro:** select an `auto` place (e.g. "Free public toilets"), then `map.setZoom(11)`.
- **Actual:** the `.pin.act` marker has `title=""` and no alt. At z13 it has the correct title.
- **Root cause:** `{title:sel.name, alt:sel.name}` at l.13441. Single pins use `pname(p)` (l.13447).
- **Fix:** use `pname(sel)`.

---

## POLISH

### 24. Clusters of 10 or more are drawn 6 px right and down of their anchor
- **Repro:** at any zoom, compare `.clus b` centres with `latLngToContainerPoint`.
- **Actual:** every bubble with ≥ 10 places is off by exactly 6√2 = 8.5 px (≤ 9 places: 0 px). This is visible next to the "you are here" dot (`map_cap2500_z6.png`, "1808" bubble).
- **Root cause:** `iconSize:[40,40], iconAnchor:[20,20]` for 46 px and 52 px bubbles (l.13466‑13468). The `b` grows from the top-left.
- **Fix:** compute the size first, `const s = n>=25?52:n>=10?46:40`, then use `iconSize:[s,s], iconAnchor:[s/2,s/2]`.

### 25. Distance formatting edge cases
- **Repro:** `km(995)`, `km(9960)` with `S.country='ES'`.
- **Actual:** `km(995)` gives "1000 m", and `km(9960)` gives "10.0 km" (es: "10,0 km").
- **Root cause:** rounding happens after the unit choice (l.12619‑12620).
- **Fix:** `if(Math.round(m/10)*10>=1000)` → switch to km, and use 0 decimals when the rounded value is ≥ 10.

### 26. Mixed units in the accuracy toast; hover highlight is missing for clustered places
- **Units:** "Your position is approximate (±400 m)" always uses metres, even where the list uses yards/miles (l.15329: `Math.round(S.acc/50)*50` without `km()`).
- **Hover:** hovering a list card does nothing when that place is inside a cluster, because `markers[id]` is absent (l.13497). Hovered pins also keep `zIndexOffset(700)` after mouse-leave (l.13500).
- **Fix:** use `km(S.acc)` in the toast. In `highlight`, pulse the containing cluster, and reset `setZIndexOffset(0)` on leave.

---

### Checked and fine
- Cluster counts equal the number of places in view at every zoom where item 5's cap is not hit.
- Clicking a cluster always brings all its members into view (z6/9/12/15 tested), apart from the case in item 8.
- Chunk index ↔ files are consistent: 1 706 keys, all present; the 7 extra files are unused split parents.
- No duplicate ids. Repeated `ensureChunks` calls never fetch a chunk twice. 10 requests (1 MB) at z8 over Paris.
- Distances equal the haversine distance from `S.center`.
- The detail, the list and the dashed route agree with each other.
- Dark-mode tiles invert and restore correctly on toggle. Markers are unaffected.
- RTL (ar) map layout is fine.
- Marker titles and cluster labels re-translate after `setLang`.
- No horizontal scroll at 390/901/1024/1100/1280/1366 px.
- Aalborg, Nairobi and Madrid geolocation: correct zoom; accuracy circle shown only when > 150 m.
