# Molnfri front-end brief: Home, recording, Notes and Modes (UI v7)

This is an instruction for the agent working on the Molnfri iOS app. The app already has the mic screen, Notes and Modes, with about 90% of the behaviour described here. Your job is to bring the **visual layer and a few interactions** in line with the approved design. Don't rewrite working logic (recording, transcription, note generation, storage); restyle and rewire the UI around it.

Reference material, in the same zip as this file:

- `screens/` — target screenshots at iPhone 15 Pro size (1179 × 2558 px, 3×, so 393 × 852 pt). `00-overview.png` shows the main screens in phone frames.
- `prototype/version-7.html` — a clickable prototype. Open it in Safari or Chrome. Its CSS uses px at 0.84 scale (330 px = 393 pt). **All values in this brief are already converted to points.** Use the prototype only to check behaviour or a value this brief doesn't give.

The screenshots use English sample text. Keep the app's own Swedish strings and real data (for example "IDAG · 23 OKT", "Alla", "Klar").

---

## 1. What changes compared with the current app

**Home**
1. Replace the hamburger menu with a centred icon pill: **Notes · Modes · Settings** (Modes in the middle). Icons only, no text.
2. Remove the "molnfri" wordmark.
3. Show the current mode as a small icon + name just above the mic. Tapping it opens Modes. Hide it while recording.
4. Recording:
   - The pill becomes the timer ("● 1:26") **in exactly the same capsule size**.
   - Remove the stop button. **Tapping the mic again finishes the recording.**
   - Cancel (×) sits in the bottom-left corner and pause (‖) in the bottom-right corner, mirrored. Both are bare ivory symbols with no button background.
   - The warm glow drops to 50%, the rings to 70% strength, and the rings flow slowly outward.

**Notes**
1. Replace the top row (back button, folder dropdown, search) with: **Tags button (left) · compact pill (centre) · Search button (right)**, all on one line.
2. Tags opens a tray of chips under the header, wrapping onto up to three rows, with no sideways scrolling. If the data model has folders instead of tags, show the folders as these chips.
3. Note cards:
   - Remove the leading icon.
   - Show **time · serif title · tag**. The tag replaces the mode label on the right.
   - Tapping the tag opens an inline tag picker. An untagged note shows an outline tag icon instead, which opens the same picker.
4. Date headers lose the weekday: "TODAY · 23 OCT", "YESTERDAY · 22 OCT", "21 OCT". Keep the year line ("2026") above.
5. Each day sits on its own soft layer, alternating 5% and 10% white.
6. The bottom dock stays: Select · Record · Share with labels.

**Modes**
1. Each row: radio circle on the left, name, small pencil on the right that opens that mode's editor. No icons and no descriptions.
2. **Raw Transcript is always first** and sits on its own warm card. The other modes share one soft layer below it.
3. Selecting applies immediately, with no save step.
4. Reset is a round button to the left of Record in the dock.

**Global**
- Muted steel-teal sky, soft white layers instead of lines, round shapes everywhere.
- Three typefaces: Jost for the UI, Source Serif 4 for note titles, IBM Plex Mono for dates.
- No screen titles anywhere. The pill is the only navigation chrome.

---

## 2. Design principles

1. **One calm sky.** Concentric bands radiate from the microphone on Home and from the Record button on Notes and Modes. The palette is a muted steel-teal, darker at the top.
2. **The mic is the only warm, saturated object.** Everything else is cool, translucent and quiet.
3. **Icons, not words, in the chrome.** The pill under the Dynamic Island is the anchor on every screen. There are no screen titles.
4. **The pill changes size with context.** It is large on Home and 30% smaller inside Notes and Modes, on the same centre line. That leaves room for section tools such as Tags and Search beside it.
5. **Layers instead of lines.** Sections are separated by 5–10% white layers with soft edges: behind the header, behind the dock, per day, the tag tray and the mode group. Use no dividers or hard borders between sections.
6. **Round everything.** Buttons are circles, the pill and cards are full capsules, and layers have large radii.
7. **Content typography is editorial; UI typography is quiet.** Note titles are serif, times are teal, dates are monospaced capitals, and controls use a geometric sans.
8. **Slow, soft motion.** Recording calms the screen: less glow, softer rings and a slow outward flow.

---

## 3. Tokens

### 3.1 Colour (sRGB)

| Role | Value |
|---|---|
| Sky, Home (radius from mic centre) | 0 pt `#D0E5E6` · 202 pt `#C8E1E4` · 393 pt `#A9D1DB` · 595 pt `#84B7C4` · 881 pt `#6EA4B2` |
| Sky, Notes/Modes (radius from Record centre) | 0 pt `#D3E1E1` · 202 pt `#CDDDDD` · 393 pt `#C2D7D7` · 595 pt `#B2CDCE` · 881 pt `#A1C1C3` |
| Menu and side-button icons | `#24525E` |
| Times, small icons, dock icons, pencil | `#346E7C` |
| Note titles, mode names | `#231F19` |
| Tag labels | `#554F45` |
| Year and date headers | `#4F493F` (year `#4A443A`) |
| Dock labels | `#211D18` |
| Active item fill (pill item, open Tags/Search) | `#F7F4E6` |
| Card fill | gradient `#F3F6F6` → `#ECF1F1`, 1 pt inner stroke white 95% |
| Cream round buttons (Select, Share, Reset) | radial `#FFFEF9` → `#F5F4EB` (62%) → `#EBE8DB` |
| Raw Transcript card | gradient `#FBF4E1` → `#F5EAD0`; selected: `#FFFAF0` with 1.5 pt `#D9B062` rim |
| Selected mode card | white with 1.5 pt `#24525E` at 45% rim |
| Selected radio / checkbox | `#24525E` fill, white dot or check |
| Selected note card (Select mode) | `#FFFDF5` with 1.5 pt `#E7C57C` rim |
| Recording dot | `#E8664A` with a 3.5 pt halo at 16%; paused `#708A90` |
| Tag colours | Work `#2C7A8D` · Ideas `#C2841A` · Personal `#B95F7A` · Clients `#5563B3` · Learning `#4A8A5A` · Untagged `#7D8A8D` |

All text pairs above pass WCAG AA (4.5:1 or better).

### 3.2 Microphone material

- **Disc:** radial gradient centred at 30% / 24% of the disc: `#FFF5DA` 0% → `#FDE9BF` 35% → `#F9DCA0` 66% → `#F4CF8A` 100%.
- **Rim:** 2 pt `#FFFBF0` at 95%.
- **Inner shading:** bottom inner shadow `#D6963C` at 22% (blur about 21 pt); top inner highlight white at 55% (blur about 17 pt).
- **Drop shadow:** `#78582A` at about 40%, y 24 pt, blur about 43 pt, pulled in so it reads as contact shadow.
- **Glyph:** the existing ivory microphone, 70% of the disc size, with warm drop shadows.
- **Halo:** radial `#FFDE96` at 46% up to 36% of the halo, `#FFE2A0` at 17% at 52%, 0 at 70%. The halo box extends 57 pt beyond the disc on every side. Multiply by **glow** (1 idle, 0.5 recording).
- **Bloom in the sky:** warm radial from the mic centre, `#FFE4A5` at 50% → 27% at 110 pt → 9% at 179 pt → 0 at 238 pt. Also multiplied by glow.

### 3.3 Glass (pill, side buttons, timer)

- Fill: white gradient, 42% at the top to 27% at the bottom.
- Inner stroke: 1 pt white at 68%.
- Background blur: about 12 pt, slight saturation boost.
- Shadow: `#1E3C46` at about 25%, y 7 pt, radius about 9 pt.
- On iOS 26 you can use `glassEffect` in its clear, lightly white-tinted form. The target is the quiet frosted capsule in the screenshots, not a strongly refractive lens.

### 3.4 Layers (the "clean space")

| Layer | Spec |
|---|---|
| Header layer, full width from the top | Height 140 pt on Home, 122 pt in sections. Linear white 8% → 5% at 58% → 0. Plus a centred elliptical white 9% pocket behind the pill (46% × 58% of the layer, fading out at 72%). |
| Dock layer, full width at the bottom | Height 190 pt. White 0 → 6% at 40% → 9% at the bottom. Background blur about 10 pt, faded in from transparent at the top over the first 44%. |
| Day layer (Notes) | Corner radius 33 pt, padding 5 pt. Odd days white 5% with 1 pt inner white 13%; even days white 10% with 1 pt inner white 22%. |
| Tag tray | Corner radius 29 pt, padding 9.5 pt, white 10%, 1 pt inner white 28%. |
| Mode group (Modes) | Corner radius 39 pt, padding 7 pt, white 8%, 1 pt inner white 22%. |
| Mode label on Home | Capsule, white 10%, 1 pt inner white 26%. |

### 3.5 Typography

Bundle these three families. All are SIL Open Font License, so they're free to ship. Register them in `UIAppFonts`.

| Use | Face | Size (pt) | Notes |
|---|---|---|---|
| UI labels, mode names, chips | **Jost** Medium (500) | Mode names 20 · chips 17 · dock labels 16 · Home mode label 18 · tag labels 16 | Fallback: Avenir Next |
| Times on cards | Jost Medium | 18 | Tabular figures, `#346E7C` |
| Recording timer | Jost Medium | 21 | Tabular, tracking 0.04 em |
| Note titles, editor title | **Source Serif 4** Semibold (600) | 19 (editor title 23) | Single line, truncate the tail. Fallback: New York |
| Year line | **IBM Plex Mono** Bold | 27 | `#4A443A` |
| Date headers | IBM Plex Mono Medium | 14 | Uppercase, tracking 0.16 em, `#4F493F` |
| Search field text | Jost | 19 | |

### 3.6 Icons

Use SF Symbols where they match. Use custom shapes for the three marked custom.

| Icon | Symbol |
|---|---|
| Notes | `note.text`, or a rounded rectangle with three lines |
| Modes | **Custom:** three small rounded squares in a pyramid, one above two. In a 24-unit box: squares 5.5 wide at (9.25, 4), (4.5, 13.5) and (14, 13.5), corner radius 1.5, stroke about 1.8. |
| Settings | `gearshape` |
| Tags | `tag` |
| Search | `magnifyingglass` |
| Select | `checkmark.circle` |
| Share | `square.and.arrow.up` |
| Reset | `arrow.counterclockwise` |
| Edit | `pencil` |
| Cancel recording / pause / resume | **Custom ivory 3D glyphs** (× with thick round strokes, two rounded bars, rounded triangle). Fill gradient white → `#FBF7EF` (55%) → `#E8DCC7`, from top-left to bottom-right. Two shadows: `#385862` at 34%, y 1.5 pt, blur 1; and `#385862` at 22%, y 6 pt, blur 11. This is the same material as the mic glyph. |

Use a light-to-regular weight in the pill and side buttons, about 1.8 pt line weight at full size.

---

## 4. Layout (393 × 852 pt; scale proportionally on other phones)

### 4.1 Top pill, shared by all screens

- **Content:** Notes · Modes · Settings, evenly spaced. Modes is the middle icon.
- **Centre line:** 84.6 pt from the top of the screen on every screen, so the pill shrinks around the same centre.
- **Home:** 192 × 57 pt capsule. Items are 48 pt circles with 25 pt icons. Top edge 56 pt, about 8 pt under the Dynamic Island.
- **Notes, Modes and Settings:** 133 × 40.5 pt capsule (30% smaller). Items are 33 pt circles with 18 pt icons, line weight about 2 pt. **Extend each item's hit area vertically to at least 44 pt.**
- **Active screen:** its icon sits on a `#F7F4E6` circle with a soft shadow. Home has no active item. Tapping the active icon returns Home.
- **Recording timer:** uses the Home capsule exactly (192 × 57 pt, same position). It shows the red dot and the time, e.g. "● 1:26".

### 4.2 Home

- **Mic:** 202 pt circle, centred horizontally. **Its gaps to the left, right and bottom edges are equal: 95 pt each.** Top edge 554 pt, centre 655 pt.
- **Mode label:** centred, top 505 pt, height 38 pt, pyramid icon 18 pt plus the mode name.
- **Recording controls:** cancel × in the bottom-left corner and pause/resume in the bottom-right corner.
  - Glyphs 50 pt, hit areas 74 pt.
  - Centres 65.5 pt in from the left and right edges and 74 pt above the bottom edge.
  - The mic stays where it is.

### 4.3 Notes

- **Header row:**
  - Tags button: 48 pt glass circle, 19 pt from the left edge.
  - Compact pill in the centre.
  - Search button: 48 pt glass circle, 19 pt from the right edge.
  - All three are centred on the 84.6 pt line. Icons 21 pt.
  - When open, Tags or Search gets the `#F7F4E6` fill.
  - When a tag filter is active, the Tags icon shows an 8 pt dot in that tag's colour at its top-right, with a white ring.
- **Body:** starts 117 pt from the top.
- **Search:** opens a 45 pt high capsule field (white about 90%, 1 pt white stroke) under the header. The field animates open by height and fades in.
- **Tag tray:**
  - Opens under the header in the same way.
  - Chips are 38 pt high capsules: dot 8 pt + name + count in a lighter weight, 7 pt gaps, wrapping onto up to three rows.
  - "All (n)" comes first. The selected chip uses the `#F7F4E6` fill.
- **List:**
  - Side inset 14 pt.
  - The year line comes first ("2026"). Start a new year line when the year changes.
  - Then one layer per day: date header (padding about 8 pt), then cards with 6 pt gaps.
  - Days run newest first. Within a day, notes run oldest first.
- **Note card:**
  - Full capsule, 57 pt high. Padding 19 pt on the left, 7 pt on the right, 9.5 pt gaps.
  - **Time** (50 pt min width) · **title** (fills, truncates) · **tag control**.
  - Tag control:
    - Tagged: a 38 pt high pill with a colour dot and the name, `#554F45`. On press or when open, it gets a white background.
    - Untagged: a 38 pt outline circle with a tag icon, 1.2 pt ring at 32%.
  - Tapping either opens the **tag picker** directly under that card: wrapped chips for every tag, with the current one selected. Choosing a tag saves immediately and closes the picker.
- **List fades:** content fades out over the last part before the dock and is gone by about 124 pt above the bottom. The dock layer's blur covers the rest. The list also fades in over 14 pt at its top edge.
- **Dock:**
  - Top edge 712 pt. Three 76 pt columns with 36 pt gaps.
  - Select and Share are 57 pt cream circles with 25 pt icons. Record is a 69 pt mic disc.
  - Labels sit 6 pt below each button: Jost Medium 16 pt `#211D18`.
- **Select mode:**
  - 25 pt round checkboxes appear at the left edge of every card.
  - Tapping a card toggles it, and the selected card gets the warm rim.
  - The Select button turns dark (`#24525E` fill, white icon) and its label becomes "Done".
  - Share stays dimmed (60%) until at least one note is selected, then shows a count badge (`#24525E`, white digits).

### 4.4 Modes

- **List top:** 155 pt.
- **Raw Transcript card:** 64 pt high, the warm card, standing alone. Then a 14 pt gap.
- **Mode group:** the soft group layer holding Flow, Meeting, Pitch and Custom as 64 pt cards with 6 pt gaps.
- **Card:** 26 pt radio · mode name (Jost Medium 20 pt) · 48 pt pencil button on the right with a 20 pt icon in `#346E7C`.
- **Dock:** Reset (cream circle) and Record, with labels. Leave the third column empty so Record stays centred.
- **Editor:** bottom sheet with a 45 pt corner radius and 9.5 pt side margins, near-white material.
  - Title: the mode name in serif.
  - Section rows: 52 pt white capsules with drag handles.
  - An outline "Add section" row.
  - A champagne "Done" capsule, 57 pt high.

### 4.5 Sky geometry

- **Bands:** repeat every **83.4 pt** outward from the centre point (mic centre on Home; Record centre at 747 pt on Notes and Modes).
- **Inside each band:** white alpha 0 → 0.05 at 80% of the band → 0.20 just before the outer edge → 0 at the edge. This gives a soft bright rim on the outer edge of each band.
- **Strength:** multiply band alpha by **ring strength**, 1 when idle and 0.7 while recording.

---

## 5. Motion

| What | How |
|---|---|
| Start recording | The pill cross-fades and scales (0.85) into the timer capsule over about 0.35–0.45 s with a soft spring. The mode label fades out. Glow animates 1 → 0.5 and ring strength 1 → 0.7 over 0.8 s, ease in-out. |
| While recording | Bands flow outward by one band (83.4 pt) every **6.24 s**, linear, looping. Two ripple rings leave the mic edge, 1 pt white at 50%, scaling 1 → 1.6 while fading from 0.49 to 0 over 6.24 s, offset by half a cycle. |
| Pause | Freeze the band flow, the ripples and the timer. The red dot turns grey. Pause cross-fades to play (scale 0.6 → 1). |
| Recording controls appear | Fade in, rise 12 pt and scale 0.85 → 1 with a 0.5 s spring. The second control lags by 70 ms. |
| Idle | The mic halo breathes: scale 1 → 1.03 and opacity 1 → 0.85 over 9 s, ease in-out, looping. |
| Tag tray / search field | Height expands over 0.4 s with ease-out and fades in. Collapsing reverses it. |
| Tag picker under a card | Drops in by 6 pt over 0.3 s. |
| Selection, radio, badge | Small spring scale-in (0.25–0.3 s). |
| Moving between Home and a section | Shrink or grow the pill around its fixed centre line (`matchedGeometryEffect` works well). |
| Reduce Motion | No band flow, ripples or breathing. Use plain cross-fades. |
| Reduce Transparency | Replace glass and white layers with solid tints, e.g. `#E7EFEF` for capsules and `#DCE8E8` for layers. |

---

## 6. Behaviour

- **Home**
  - Tap the mic to start recording.
  - Tap it again to finish and save, using the existing save flow.
  - × cancels and discards. Keep any existing confirmation.
  - Pause toggles pause and resume.
  - The mode label opens Modes.
- **Pill**
  - Notes, Modes and Settings open their screens.
  - The active icon returns Home.
  - There is no back button. Keep the system edge-swipe if you use a NavigationStack.
  - The Record button in a dock returns Home and starts recording.
- **Notes**
  - Tags toggles the tray. Tapping a chip filters the list; tapping the active chip again, or "All", clears the filter.
  - Search toggles the field. Search covers **all** notes regardless of the tag filter. Closing the field clears the query.
  - Tag changes save immediately and update the chip counts.
  - Select / Share works as described in 4.3.
- **Modes**
  - Tapping a row selects that mode immediately everywhere, including the Home label.
  - The pencil opens the editor for that row's mode, not necessarily the selected one.
  - Reset returns to the default mode (Meeting) or uses the app's existing reset meaning.
- **Settings:** the existing screen, with the compact pill and Settings active.

---

## 7. Accessibility

- Every icon-only control needs a VoiceOver label, using the app's Swedish strings. Examples: Notes, Modes, Settings, Tags (state "filtered by Work"), Search, Cancel recording, Pause/Resume, Finish recording (the mic while recording), Select/Done, Share selected notes (n), Reset to Meeting, Edit {mode}, and "{Tag}. Change tag" on a card.
- Use radio semantics for the mode rows and checkbox semantics in Select mode.
- Minimum hit area is 44 × 44 pt. The compact pill needs extended hit areas.
- Dynamic Type: let titles and labels grow. Truncate titles before wrapping cards.

---

## 8. SwiftUI implementation notes

- **Sky:** draw it in a `Canvas` behind everything, wrapped in `TimelineView(.animation)` only while recording.
  - Fill a `RadialGradient` (the stops in 3.1) centred on the mic or Record button.
  - Draw each band as an annulus filled with a radial gradient (the stops in 4.5) multiplied by `ringStrength`.
  - Offset the band phase by `(t mod 6.24) / 6.24 × 83.4`.
  - Add the warm bloom as a second radial gradient multiplied by `glow`.
- **Pill:** an `HStack` in a `Capsule()` with the glass style. Drive its size with a `PillSize` (`.home` / `.section`) so the same view shrinks with `matchedGeometryEffect` when the screen changes.
- **Layers:** a `Rectangle` with a `LinearGradient`, and an `.ultraThinMaterial` blur faded by a gradient `mask` for the dock layer.
- **Cards:** a `Capsule()` filled with the card gradient plus a white `strokeBorder` and soft shadow. Use `.lineLimit(1)` and `.truncationMode(.tail)` for titles.
- **Fades at the list edges:** `.mask(LinearGradient(...))` on the `ScrollView`.

---

## 9. Acceptance checklist

- [ ] Home shows only the pill, the mode label and the mic. No wordmark, no hamburger.
- [ ] The mic's left, right and bottom gaps are equal.
- [ ] The pill and the recording timer are exactly the same capsule on Home. The pill is 30% smaller in Notes and Modes, on the same centre line.
- [ ] Recording: there is no stop button. Tapping the mic finishes. × is bottom-left and pause is bottom-right, mirrored, with ivory 3D glyphs. Glow is at 50%, rings at 70%, and the flow takes 6.24 s per band.
- [ ] The Notes header is Tags · compact pill · Search with 48 pt circles. There is no screen title.
- [ ] The tag tray wraps onto up to three rows, with no sideways scroll.
- [ ] Cards show time · serif title · tag control, with no leading icon and no mode label.
- [ ] Untagged notes show the tag icon, and both tag controls open the inline picker.
- [ ] Date headers have no weekday, and a year line sits above them.
- [ ] Days alternate between 5% and 10% layers.
- [ ] Modes: Raw Transcript is first on its own warm card, then the shared group. Radios are on the left and pencils on the right, with no icons or descriptions. Reset sits beside Record.
- [ ] Fonts are Jost, Source Serif 4 and IBM Plex Mono. The colours match section 3.
- [ ] Reduce Motion and Reduce Transparency are respected, and VoiceOver labels are present.

---

## 10. Screenshot index

| File | Shows |
|---|---|
| `00-overview.png` | Home, recording, Notes, Notes with tags open, Modes (framed) |
| `01-home.png` | Home, idle |
| `02-recording.png` | Recording: timer in the pill capsule, × and ‖ in the corners |
| `03-recording-paused.png` | Paused: rings frozen, grey dot, play symbol |
| `04-notes.png` | Notes default |
| `05-notes-tags-open.png` | Tag tray open, no filter |
| `06-notes-tag-filter.png` | Filtered by Work, with a coloured dot on the Tags icon |
| `07-notes-search.png` | Search open with a query |
| `08-notes-tag-picker.png` | Tag picker open under an untagged note |
| `09-notes-select.png` | Select mode with two notes selected and a Share badge |
| `10-modes.png` | Modes, Meeting selected |
| `11-modes-edit.png` | Mode editor sheet |
