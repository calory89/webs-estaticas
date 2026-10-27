# SupportNear: UI, mobile and accessibility QA (27 Oct 2026)

**Build tested:** http://127.0.0.1:8951/index.html (minified). Line numbers point to `qa/index.template.snapshot.html` (CSS is at lines 69–1129 and the app JS starts around line 11400).

**Method:** Python Playwright with Chromium. iPhone was emulated as `is_mobile`, `has_touch`, DPR 3 and an iOS user agent. Service workers were blocked and `__sb` was aborted. Safe-area insets were emulated with CDP `Emulation.setSafeAreaInsetsOverride`, and touch drags were sent with CDP `Input.dispatchTouchEvent`.

**Coverage:**
- **Viewports:** 320×568, 360×740, 390×844, 414×896, 768×1024, 1024×768, 1366×768, 1920×1080 and 844×390, each in light and dark.
- **Languages:** en, es, ar, ru and wo.
- **Checks:** axe-core plus a custom WCAG contrast walker (see the note below), keyboard tab walks, CLS observer, and measured element rectangles.

**Verification:** every item below was reproduced at least twice, by measurement and by screenshot or by a second run. Screenshots are in `qa/shots/ui_*.png`.

**Clean areas:**
- No horizontal page scroll at any tested viewport, language or theme (`scrollWidth == clientWidth` everywhere).
- CLS stays low: 0 on mobile and 0.03 or less on desktop.
- axe reported no critical or serious violations. However, its `color-contrast` rule ended with "Axe encountered an error" on every run, so axe did not actually check contrast. The contrast findings below come from the custom walker.

**Counts:** 2 critical · 11 major · 14 minor · 7 polish (34 items).

---

## CRITICAL

### C1. Modals (SOS, Language, Privacy, Who, Sheet, Show…) do not move or trap focus, and the welcome dialog does not trap focus
- **Repro:** desktop 1366×768. Focus `#sosBtn1`, press Enter, then Tab. Do the same for `#langBtn`. For the welcome, run `openWelcome()` and press Tab 14 times.
- **Expected:** the dialog has `aria-modal="true"`, so focus should move into it, Tab should cycle inside it, and focus should return to the trigger on close.
- **Actual:**
  - SOS and Language: after opening, `activeElement` is still `#sosBtn1` or `#langBtn` (outside the dialog). Tab then walks through `#langBtn`, `#themeBtn` and the filter chips *behind* the overlay.
  - Welcome: after 14 Tabs, focus is on `#micBtn` in the page behind.
  - Screen-reader users hear nothing of the SOS sheet, which is the most urgent screen in the app.
- **Root cause:**
  - `openModal()` (l.16490), the `#langBtn` handler (l.16530) and the `[data-open-priv]` handler (l.16534) only add `.on`.
  - The focus-trap keydown handler (l.16510–16522) is hard-wired to `#mMenu.on`.
  - Restoring focus on close exists only for the menu (l.16492–16497).
- **Fix:** make one generic helper and use it for every `.modal`:

```js
let lastFocus=null;
function openModal(id){ buildSos(); /*…tally…*/ const m=$(id); lastFocus=document.activeElement;
  m.classList.add('on'); document.body.style.overflow='hidden';
  setTimeout(()=>{ const f=m.querySelector('.modal-box '+FOCUSABLE.split(',').join(',.modal-box ')); (f||m.querySelector('.modal-box')).focus(); },50); }
// trap: replace '#mMenu.on' with the top-most open modal
const box=[...document.querySelectorAll('.modal.on')].pop();
// closeModals(): if(lastFocus && document.contains(lastFocus)) lastFocus.focus();
```

  Route `#langBtn`, `[data-open-priv]`, the menu items and `openWelcome` through it. Also put `inert` on `#app` while a modal is open.

### C2. Map attribution (Esri / OpenStreetMap / Leaflet) is completely hidden on every phone and tablet layout
- **Repro:** at 390×844, 768×1024 and 844×390, run `elementFromPoint` at the centre of `.leaflet-control-attribution`.
- **Expected:** attribution is visible, as the ODbL and Esri terms require.
- **Actual:** it is covered by `#list` or `.tags`, meaning the bottom sheet or the landscape side panel. It is visible only at 901px and wider.
- **Root cause:** Leaflet's `.leaflet-bottom.leaflet-right` sits at the map's bottom-right. On mobile the panel (`z-index:450`, l.654) covers the bottom 292px of the map, and in landscape it covers the right `min(360px,46vw)` (l.1086).
- **Fix:**

```css
@media (max-width:900px){ .leaflet-bottom.leaflet-right{bottom:calc(292px + var(--safe-b))} }
@media (max-width:900px) and (max-height:520px) and (orientation:landscape){
  .leaflet-bottom.leaflet-right{bottom:0;right:min(360px,46vw)} }
```

  Alternatively, move the attribution to `topleft` below the filters and collapse it to an "ⓘ" toggle.

---

## MAJOR

### M1. Modal close (X) scrolls away with the content, on mobile and desktop
- **Repro:** 320×568, `openModal('#mSos')`, scroll the sheet. The same happens in Privacy, Language and Download.
- **Expected:** the close button stays reachable.
- **Actual:** `.modal-x` is at top −318px while the box top is 68px; see `ui_sos_scrolled_noX_320.png`. Only the sticky `h2` stays. At 1366, the SOS X also scrolls away.
- **Root cause:** `.modal-x{position:absolute}` (l.946/920) sits inside the scrolling `.modal-box` (`overflow-y:auto`, l.825/909).
- **Fix:** make the X sticky together with the title:

```css
.modal-x{position:sticky;top:12px;float:inline-end;margin:-8px -8px 0 8px}
```

  Better still, move the X inside the sticky `h2` row (`display:flex;justify-content:space-between`) on mobile.

### M2. Simple mode: the Emergency button is cut off in landscape, and labels overlap the caption at 320px
- **Repro:** `document.getElementById('simple').hidden=false`.
  - 844×390: the second row ends at y=437, beyond the 390px viewport, so "Emergency" is off-screen (`ui_simple_844x390.png`).
  - 320×568: the last button ends at y=538, below the grid bottom at 496, and the caption "Tap what you need…" is drawn over the word "Emergency" (`ui_simple_320.png`).
- **Root cause:**
  - `.simple-g{grid-auto-rows:1fr}` (l.730) grows rows to their min-content.
  - Font and icon sizes scale with width (`clamp(24px,6vw,44px)`, `clamp(44px,12vw,90px)`, l.731/733), not with height.
  - `#simple` cannot scroll.
- **Fix:**

```css
.simple-g{grid-template-rows:repeat(2,minmax(0,1fr));grid-auto-rows:minmax(0,1fr)}
@media (max-width:360px){.simple-g{grid-template-rows:repeat(4,minmax(0,1fr))}}
.simple-g button{overflow:hidden;min-height:0;font-size:clamp(18px,min(6vw,5.5vh),44px)}
.simple-ic .icon{width:clamp(28px,min(12vw,9vh),90px);height:clamp(28px,min(12vw,9vh),90px)}
#simple{overflow-y:auto}
```

### M3. No visible focus indicator on the search field
- **Repro:** desktop. Tab from the top of the page to `#q`.
- **Actual:** `outline:none`, and the `.search` wrapper does not change: border stays `rgb(230,223,211)`, no outline (`ui_kbd_search_focus.png`). This fails WCAG 2.4.7.
- **Root cause:** `.search input{outline:none}` (l.206), with no `:focus-within` rule.
- **Fix:**

```css
.search:focus-within{border-color:var(--brand);box-shadow:0 0 0 3px color-mix(in srgb,var(--brand) 35%,transparent)}
```

### M4. Dark mode: white text on mint `--brand` (#3ECFA9) reads at 1.6–2.0:1
- **Repro:** set `data-theme=dark`, then open:
  - Language modal, selected tile (English): 1.96:1, and 1.59:1 for the sub-label (`ui_dark_langgrid.png`).
  - Plan numbers `.plan-n`: 1.96 (`ui_dark_plan.png`).
  - Welcome steps `.wel-steps b`: 1.96.
- **Root cause:** hard-coded `color:#fff` with no dark override on:
  - `.langgrid button[aria-pressed=true]` (l.960)
  - `.plan-n` (l.555)
  - `.wel-steps b` (l.760)
  - the same pattern on `.hrs--open` (l.718), `.follow.on` (l.628) and `.skip` (l.124).
- **Fix:**

```css
html[data-theme=dark] :is(.langgrid button[aria-pressed=true],.plan-n,.wel-steps b,.hrs--open,.follow.on,.skip){color:#04140F}
```

### M5. Dark mode SOS: "Nearest emergency room" shows as a grey browser-default button with low-contrast text
- **Repro:** dark mode, `openModal('#mSos')`, scroll to "Nearest emergency room" (`ui_sos_er_dark.png`).
- **Actual:**
  - Background is `rgb(107,107,107)` (UA ButtonFace).
  - The mint distance text reads at 3.69:1.
  - Text is centred, unlike the other `.hl` rows.
  - On desktop the button is 23px narrower than the link rows.
- **Root cause:** `#sosEr` is a `<button class="hl">` (JS l.15693), but `.hl` (l.950) has no background, width, text-align or font reset.
- **Fix:**

```css
button.hl{width:100%;background:transparent;font:inherit;color:inherit;text-align:start;cursor:pointer}
```

### M6. Tablet / small desktop (901–1279px): the detail panel covers the map's zoom and locate buttons
- **Repro:** 1024×768, open any card.
- **Actual:**
  - The detail spans x 624–1024 (400px wide).
  - The panel and `--panel-w` are 352px, so `.mapfx--br` sits at x 610–658, and 34 of its 48px are under the detail (`ui_sweep_detail_1024x768.png`).
- **Root cause:** `.detail{width:400px}` (l.527) versus `--panel-w:352px` (l.1082). The fab offset follows `--panel-w` only.
- **Fix:**

```css
@media (min-width:901px) and (max-width:1279px){ .detail{width:var(--panel-w)} }
/* or */
html.dopen .mapfx--br{inset-inline-end:calc(400px + 14px)}
```

### M7. Phone landscape: the detail covers the locate button and the selected pin
- **Repro:** 844×390, open a card.
- **Actual:**
  - Detail x 444–844.
  - `#locate` x 422–470, half covered.
  - Selected pin x 391–453, tip under the sheet (`ui_landscape_notch_detail.png`).
- **Root cause:**
  - `.detail{width:min(400px,52vw)}` (l.1088) versus the fab offset `min(360px,46vw)+14px` (l.1089).
  - The map pan offset assumes a bottom sheet.
- **Fix:** in the landscape media query, use `.mapfx--br{inset-inline-end:calc(min(400px,52vw) + 14px)}` while the detail is open (`html.dopen`). When centring the selected place in landscape, pan by half the detail width.

### M8. Landscape iPhone: content sits under the notch and the home-indicator sides
- **Repro:** 844×390 with insets left/right 47px and bottom 21px (CDP override).
- **Actual:**
  - `#menuBtn` is at x≈10, inside the 47px notch area.
  - Emergency ends at 834, inside the right inset (`ui_landscape_notch.png`).
- **Root cause:** `viewport-fit=cover` (l.6) is set, but `safe-area-inset-left/right` are used nowhere (only `-bottom` at l.90 and `-top` at l.875).
- **Fix:**

```css
.topbar,.filters{padding-inline:max(10px,env(safe-area-inset-left)) max(10px,env(safe-area-inset-right))}
#map .leaflet-control-container,.mapfx--br{margin-inline:env(safe-area-inset-left) env(safe-area-inset-right)}
/* landscape .panel/.detail: */
padding-inline-end:env(safe-area-inset-right)
```

### M9. Notification bars on mobile overlap "Search this area" and the offline banner; the locate button jumps into them
- **Repro:** 390×844, Madrid.
  - `#redo.on` plus `showOffline()`: the offline banner (y 139–214) hides `#redo` (y 141–183) completely (`ui_bars_offline_390.png`).
  - Any `.bars` item (lite or update bar): it sits at top 136 and covers both (`ui_bars_two_390.png`, `ui_litebar_360.png`).
- **Root cause:**
  - Bars were moved to the top on mobile (l.875), but `#redo` (`top:14px`, l.520) and `.offbadge` (`top:12px`, l.507) live in the same band.
  - Unrelatedly, `body.bars-1/.bars-2` still raise `.mapfx--br` by 96 or 190px (l.703–704). That was the old bottom-bar logic. On 320×568 it pushes `#locate` to y 118–166, over the filters row.
- **Fix:**
  - Delete l.703–704. Bars are no longer at the bottom on mobile.
  - Stack the top overlays in one flow container: offbadge, then redo, then bars. Or offset them, e.g. `body.bars-1 .recenter, body.bars-1 .offbadge{top:calc(var(--bars-h) + 12px)}`.

### M10. `bars-1` class gets stuck after the slow-network bar disappears, so the locate button stays displaced
- **Repro:** 360×740 with `navigator.connection.saveData=true`, open `?city=Madrid`, wait 30s.
- **Actual:** `#litebar` is gone (`#bars` has 0 children), but `body.bars-1` remains and `#locate` stays at y 290 instead of 386 (`ui_litebar_after_360.png`).
- **Root cause:** `offerLite()` (l.16150) calls `barsSync()` *before* `bar.remove()` runs in the inner `setTimeout`.
- **Fix:**

```js
setTimeout(()=>{ bar.classList.remove('on'); setTimeout(()=>{ bar.remove(); barsSync(); },400); }, 20000);
```

### M11. Filter chips are under the 44px touch target on touch devices
- **Repro:** 390×844 with a coarse pointer. `matchMedia('(pointer:coarse)')` is true, yet `.chip` computes `min-height:40px` and measures 40px tall.
- **Root cause:** `.chip{min-height:40px}` at l.812 comes after, and overrides, `@media (pointer:coarse){.chip{min-height:44px}}` at l.228 (same specificity).
- **Other targets under 44px on touch:**
  - `.need-b` pills: 38px (l.409)
  - every `.modal-x` and `#dClose`: 40px (`.iconbtn` at l.689)
  - welcome language pills: 34px (l.762)
  - welcome city links: 32px
  - footer links: 36px
  - detail inline links ("add the opening hours"): 31px (l.1119)
  - toast action: 36px
  - `#qBack`: 36px
- **Fix:** delete l.812, or move the coarse rule after it. Then:

```css
@media (pointer:coarse){
  .iconbtn,.modal-x,#dClose{width:44px;height:44px}
  .need-b{min-height:44px}
  .wel-langs button{min-height:44px}
  .detail-body .kv a{padding-block:12px}
}
```

---

## MINOR

### m1. The autocomplete stays open, with `aria-expanded=true`, after focus leaves the search
- **Repro:** desktop. Focus `#q` and Tab 18 times. Focus is now on `#sosBtn1`, but `#ac.on` is still open and covers the map and filters (`ui_kbd_ac_stays_open.png`). Keyboard users also have to Tab through 13 city suggestions to leave the search.
- **Root cause:** `#ac` only closes on document click (l.16617) or Escape. There is no `focusout` handler.
- **Fix:**

```js
$('.searchwrap').addEventListener('focusout',e=>{ if(!e.currentTarget.contains(e.relatedTarget)){ $('#ac').classList.remove('on'); $('#q').setAttribute('aria-expanded','false'); qLeave(); } });
```

  Keep `aria-expanded` in sync wherever `#ac.on` is toggled.

### m2. Toast wraps into a 3-line oval at half the screen width
- **Repro:** 390×844, `toast('Saved. It works without signal now','Undo',()=>{})`. The toast is about 195px wide and 107px tall with `border-radius:999px` (`ui_toast_390.png`).
- **Root cause:** `left:50%` limits the shrink-to-fit width to 50% of the viewport, so `max-width:90vw` never applies (l.961).
- **Fix:**

```css
.toast{left:0;right:0;margin-inline:auto;width:max-content;max-width:min(90vw,480px);border-radius:18px;transform:translateY(160%)}
.toast.on{transform:none}
```

### m3. "Search this area" wraps to two lines on small phones and in long languages
- **Repro:** at 320 (en) and 390 (ru) the button is 63px tall: "Искать в этом / районе" (`ui_redo_wrap_ru_390.png`, `ui_redo_wrap_320.png`).
- **Root cause:** the same shrink-to-fit trap as m2. On mobile, `inset-inline-start:calc(50% - 0px/2)` plus `translateX(-50%)` limits the width to half the map (l.520).
- **Fix:**

```css
.recenter{white-space:nowrap;max-width:calc(100% - 24px)}
```

  Or centre it with `left:0;right:var(--panel-w);margin-inline:auto;width:max-content;transform:none`.

### m4. RTL modal titles are padded on the wrong side, so long titles can run under the X
- **Repro:** ar at 320, any mobile modal.
- **Actual:** the `h2` has 20px left and 62px right padding, but in RTL the X is on the *left* (x 14–54). The title text starts at x=63, 9px from the X, and is offset 42px from the body text's right edge (`ui_ar_sos_360.png`). The side menu has the same problem: the `h2` uses `padding:0 44px 4px 0` (l.939), so "SupportNear" is indented 44px from the section labels in RTL (`ui_ar_menu_360.png`).
- **Root cause:** physical padding at l.915 and l.939.
- **Fix:** `padding-block:22px 12px; padding-inline:20px 62px` (l.915) and `padding:0; padding-inline-end:44px` (l.939).

### m5. RTL: Latin place names and addresses are left-aligned while everything else in the card is right-aligned
- **Repro:** ar at 360, list and detail. "Comedor Ave María" and "Calle del Doctor Cortezo 4" sit flush left; the Arabic lines sit flush right (`ui_ar_main_360.png`, `ui_ar_detail_360.png`, `ui_ar_desktop_1366.png`).
- **Root cause:** `unicode-bidi:plaintext` (l.814, l.1128) makes `text-align:start` resolve per paragraph.
- **Fix:** keep `plaintext` for glyph order, but force the edge:

```css
html[dir=rtl] :is(.card-t,.card-s,.card-a,.kv-v,#dTitle){text-align:right}
```

### m6. RTL: the search "back" arrow points the wrong way, and it is 7px off-centre in every language
- **Repro:** focus the search at 360.
  - The svg is at top 15 while the search box centre is at 32 (`ui_search_focus_en_360.png`).
  - In ar the arrow still points left (`ui_search_typed_ar_360.png`).
- **Root cause:** `.qback{display:grid}` (l.680) has no `place-items`, and the icon is not mirrored.
- **Fix:**

```css
.qback{place-items:center;padding:0}
html[dir=rtl] .qback svg{transform:scaleX(-1)}
```

### m7. Desktop: filter chips beyond the viewport cannot be reached with a mouse wheel, and the RTL fade is on the wrong side or missing
- **Repro:** at 1024×768, chips "Warm space", "Only open now" and "Who is it for" are off-screen (`scrollWidth` 1594 > 1024). The scrollbar is hidden (l.221–222), and a vertical wheel over the row leaves `scrollLeft` at 0.
- **RTL (ar, 1366):** the wrap has `at-start at-end` while the content overflows by 61px, so no fade shows next to the cut chip (`ui_ar_desktop_1366.png`).
- **Root cause:**
  - No wheel-to-horizontal mapping.
  - `filterEdges()` (l.15218) uses `scrollLeft<=2` (RTL uses negative `scrollLeft`) and is not re-run after the chip counts change width.
- **Fix:**
  - Wheel mapping: `f.addEventListener('wheel',e=>{ if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){ f.scrollLeft+= (dir==='rtl'?-1:1)*e.deltaY; e.preventDefault(); } },{passive:false})`.
  - Use `Math.abs(f.scrollLeft)` in `filterEdges`, and call it from `setCounts()`.
  - Show small ‹ › buttons on `(pointer:fine)`.

### m8. Tall detail at 320×568 slices through the filter chips
- **Repro:** 320×568, open a card, tap its header. The detail top is at y 79.5, and the chips row is cut in half (`ui_detail_tall_320.png`). At 390×844 it overlaps by 9px.
- **Root cause:** `.detail.tall{height:86svh}` (l.664) ignores the 127px of header and filters above `.main`.
- **Fix:** `.detail.tall{top:8px;height:auto;max-height:none}`. `.main` already starts below the filters.

### m9. Double safe-area padding under the detail action bar
- **Repro:** 390×844 with a 34px bottom inset. There is 78px of empty space below "Directions": 34px from `.detail` plus 44px from `.dbar` (`ui_notch_portrait_detail.png`).
- **Root cause:** `.detail{padding-bottom:var(--safe-b)}` (l.663) and `.dbar{padding-bottom:calc(10px + var(--safe-b))}` (l.805). The panel has the same pattern: `.panel` padding (l.657) plus `.list` padding (l.251).
- **Fix:** remove `padding-bottom:var(--safe-b)` from `.detail` and `.panel` on mobile.

### m10. Simple mode uses the bottom inset at the top
- **Repro:** set insets to top 47 / bottom 34. `#simple` gets `padding-top:34px` and `padding-bottom:14px`, so the Emergency tile sits on the home indicator.
- **Root cause:** `padding:max(14px,var(--safe-b)) 14px 14px` (l.726).
- **Fix:**

```css
padding:max(14px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) max(14px,var(--safe-b)) max(14px,env(safe-area-inset-left))
```

### m11. Stacked Welcome + Language: Escape closes the dialog underneath, and the Language X kills the welcome
- **Repro:** first visit, tap "…" in the welcome language pills.
  - Escape: `#mWel` closes and `#mLang` stays open, with `body.style.overflow=''` so the page behind can scroll.
  - Language X instead: both close, `welcomed` is never stored, and `afterWelcome()` never runs.
- **Root cause:** the Escape branch at l.16567 checks `#mWel` first; `closeModals()` (l.16491) closes everything.
- **Fix:**
  - On Escape, close only the top-most open modal.
  - Make `[data-close]` close only its own `.modal`.
  - Re-open or keep the welcome when the language modal was opened from it.

### m12. Dark mode: map pin glyphs are below 3:1 non-text contrast
- **Measured:** white glyph on pastel pins reads 1.85 (social `#63D48E`), 1.99 (hygiene), 2.33 (food) and 2.61 (health).
- **Root cause:** `.pin i svg{stroke:#fff}` (l.472) has no dark override. Cards and clusters already switch to `#08111A` (l.259, 482).
- **Fix:**

```css
html[data-theme=dark] .pin i svg{stroke:#08111A}
```

### m13. Bottom-sheet handle has no expanded state, and only a 28px strip can be dragged
- **Repro:** 390×844.
  - `#grab` has `role=button` but no `aria-expanded` or `aria-controls`.
  - A 200px touch-drag on `.panel-head` does nothing.
  - Once the panel is up, pulling the list down at `scrollTop` 0 does not collapse it. Only the grab works.
- **Root cause:** the l.16624–16639 handlers are attached only to `#grab`.
- **Fix:**
  - `grab.setAttribute('aria-controls','list')`, and update `aria-expanded` inside `toggle()` and `barsSync()`.
  - Attach the same touch handlers to `.panel-head`.
  - When `#list.scrollTop===0` and dy > 40, collapse the panel.

### m14. Keyboard: 107 map markers come before the list in tab order
- **Repro:** desktop. After clicking the map, Tab cycles through every Leaflet marker: 108 markers, 107 of them focusable, each named by its title.
- **Root cause:** Leaflet `keyboard:true` on divIcon markers.
- **Fix:** set markers to `tabindex=-1` (`keyboard:false`). The list already exposes every place, and the "Skip to content" link exists. Keep one focusable "Map" control for arrow-key panning.

---

## POLISH

### p1. SOS "112" touches the "Tap to call" pill, and the pill sits low
- **Where:** all viewports (`ui_sos_390.png`).
- **Root cause:** `.emg a{display:block}` (l.949, specificity 0-1-1) overrides `.emg-call{display:inline-flex;gap:12px}` (l.712).
- **Fix:** `.emg a.emg-call{display:inline-flex;align-items:center;gap:12px}`.
- **Desktop:** the label should read "Call", not "Tap to call".

### p2. Dark-mode welcome pictograms use hard-coded light-theme colours
- **Measured:** 2.26–3.09:1 on `#1A222D` (`ui_sweep_wel_390x844_dark.png`).
- **Root cause:** inline `--cc:#1D4ED8` etc. at l.1238–1242.
- **Fix:** use `--cc:var(--c-food)`, `var(--c-shelter)` and so on.

### p3. "Legal aid" chip with 0 results is 2.87:1 in light and 3.69:1 in dark
- **Where:** `.chip.chip--none{opacity:.55}` (l.811).
- **Fix:** keep full opacity, use a dashed border and `color:var(--ink-3)` (about 6:1).

### p4. Welcome lede is clamped mid-sentence on phones
- **Actual:** "…and it keeps working with …". The key "no signal" claim is lost, and the text cannot be expanded (`ui_welcome_390.png`).
- **Root cause:** `-webkit-line-clamp:4` (l.787) or 3 (l.770).
- **Fix:** shorten the copy, or drop the clamp. The box already scrolls and the CTA is sticky.

### p5. Welcome opens with a heavy double focus ring on "Use my location", even on touch devices
- **Root cause:** a programmatic `.focus()` at l.14768 triggers `:focus-visible`.
- **Fix:** call `focus({focusVisible:false})` where supported, or add `.wel .btn--primary:focus-visible{outline-offset:3px;outline-width:2px}` so it reads less like a rendering bug.

### p6. Typography inconsistencies
- The "Save this area" sizes ("About 2.8 MB") render in the UA monospace (`.zopt .mb{font-family:var(--mono,…)}`, l.841, and `--mono` is undefined; `ui_modal_offline_390.png`). Use `var(--ui)` with `tabular-nums`.
- The native WebKit search-cancel "×" shows in blue (`ui_search_typed_ar_360.png`). Use `input[type=search]::-webkit-search-cancel-button{filter:grayscale(1)}` or a custom clear button.

### p7. Tablet (768px): need-pills stretch into very wide buttons ("Eat" is 190px), and the brand wordmark is hidden despite available space
- **Where:** `ui_sweep_main_768x1024.png`.
- **Root cause:** `.need-b{flex:1 0 auto}` (l.379) and `.brand .brand-w{display:none}` at ≤900 (l.695).
- **Fix:** `@media (min-width:641px){.need-b{flex:0 0 auto}}` and show `.brand-w` from 641px.

---

## Screenshot index (`qa/shots/`)
| File | What it shows |
|---|---|
| `ui_sweep_{wel,main,detail,sos}_{WxH}[_dark].png` | Full sweep, 9 viewports × 2 themes |
| `ui_sos_scrolled_noX_320.png` | M1 |
| `ui_simple_844x390.png`, `ui_simple_320.png` | M2 |
| `ui_kbd_search_focus.png` | M3 |
| `ui_kbd_ac_stays_open.png` | m1 |
| `ui_dark_langgrid.png`, `ui_dark_plan.png` | M4 |
| `ui_sos_er_dark.png` | M5 |
| `ui_sweep_detail_1024x768.png` | M6 |
| `ui_landscape_notch.png`, `ui_landscape_notch_detail.png` | M7, M8 |
| `ui_bars_offline_390.png`, `ui_bars_two_390.png`, `ui_bars_two_320.png`, `ui_litebar_360.png`, `ui_litebar_after_360.png` | M9, M10 |
| `ui_toast_390.png` | m2 |
| `ui_redo_wrap_ru_390.png`, `ui_redo_wrap_320.png` | m3 |
| `ui_ar_*_360.png`, `ui_ar_desktop_1366.png` | m4, m5, m6, m7 |
| `ui_search_focus_en_360.png`, `ui_search_typed_ar_360.png` | m6, p6 |
| `ui_detail_tall_320.png` | m8 |
| `ui_notch_portrait_detail.png` | m9 |
| `ui_wel_lang_stack.png`, `ui_wel_lang_esc.png` | m11 |
| `ui_modal_*_390[_dark].png`, `ui_menu_*` | Remaining modals, no defects beyond those listed |
