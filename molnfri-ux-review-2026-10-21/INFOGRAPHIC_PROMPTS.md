# Molnfri — infographic prompts (PROPOSED UI)

These prompts are for an image or infographic model that can see the real Molnfri screenshots. Each prompt names the screens to attach. Paths are relative to the evidence pack root, `molnfri-review-kit/`.

The pictures should **show the UI, not explain it**. Always start from the attached screen and keep it pixel-faithful. Change only what the prompt lists. Text inside the image is limited to the app's own labels, very short callouts (2–5 words) and the board tag.

Rank numbers (#) refer to the ranked table in [`REVIEW.md`](REVIEW.md#2-ranked-improvements). "First batch" marks the minimum first batch (#1, #2, #3, #4, #6). Everything else is a later alternative.

---

## Shared style block — paste this in front of every prompt

```
You are editing real app screenshots into a widescreen PROPOSED UI board.
Canvas 16:9 (1920×1080). Background warm paper #EFE6D4, generous margins.
Place the phone screens side by side at identical scale, centred, with even gutters.
Keep each source screenshot faithful: same sky gradient, sun-microphone, cream cards
(#F7F0E2), glass capsules, SF-style sans + serif headings, petrol text #14707F,
status bar and sample text exactly as in the source.
Change ONLY what the prompt lists. Outline every new or changed element with a thin
ochre (#D2831F) dashed rounded outline. Show removed elements as a faint ghost with a
small ochre "×" badge.
Callouts: thin petrol arrows from outside the phone to the changed element; label
2–5 words, sentence case, max 3 per phone.
Top-left: solid ochre pill "PROPOSED UI" (white text). Top-right: small grey tag with
the board name, rank numbers and batch. Above each phone: a tiny chip "A · …", "B · …", "C · …".
No paragraphs, no logos, no device marketing frames, no invented data, no lorem ipsum.
Never draw a stop square on the sun; never move or resize the sun.
```

---

## Part A — Three alternative arrangements

### A1 · "Clear Sun" — the minimum first batch (about 10 % visual change)

```
Attach: 01-current-app-screenshots/02-recording.png,
        01-current-app-screenshots/07-template-processing-progress.png,
        01-current-app-screenshots/08-result-and-save.png
Tag: "Arrangement 1 · Clear Sun · First batch (#2 #3 #4)"

A · Recording — use 02-recording.png exactly.
  ADD directly under "00:05": caption "Tap the sun to stop" (petrol, footnote size).
  Callout: "Visible stop cue".

B · Writing — use 07-template-processing-progress.png.
  VARY "27%" → "About 27%". ADD under it: "Writing Meeting note".
  ADD below that a borderless petrol text button "Skip – use transcript".
  Callouts: "Estimate, labelled" · "Escape slow run".

C · Result — use 08-result-and-save.png.
  REPLACE the plain serif heading "Meeting" with a cream glass capsule "Meeting ⌄"
  (same serif, slightly smaller, chevron at right).
  KEEP Edit · Listen · Copy (show "Copy", not "Copied") and the round Save.
  Callout on the capsule: "Change template here".
  Callout on Edit: "Edit = text only".
```

### A2 · "One choice, labelled routes" — later alternative (about 20 %)

```
Attach: 01-current-app-screenshots/06-auto-enabled.png,
        01-current-app-screenshots/10-notes-expanded.png,
        01-current-app-screenshots/13-settings.png
Tag: "Arrangement 2 · One choice · Later (#5 #7 #11 #13 #15)"

A · Home menu — use 06-auto-enabled.png.
  ADD tiny labels under the two side glyphs: "Notes" (left), "Settings" (right).
  VARY the left glyph to a simple tray icon.
  ADD above the template list a small heading "After recording".
  VARY the first row "Raw" → "Transcript only".
  REMOVE the "Auto" switch row (ghost + ×).
  KEEP "Meeting ✓" selected and ADD under it the caption
  "Situation · Insights · Action plan".
  Callouts: "One decision" · "Auto switch removed" · "Says what it does".

B · Notes — use 10-notes-expanded.png.
  VARY the top-left round button to show "Home ›".
  ADD a native search field "Search notes" under the title.
  VARY rows: "14:05 · Anna – follow-up" left, template name right
  (keep row style; add a "Today" sub-header above the first row).
  Callouts: "Time + title" · "Search".

C · Settings — use 13-settings.png.
  ADD small captions: under the EN/SV switch "App and dictation language";
  under Models "Apple Intelligence · Ready".
  KEEP all circles and toggles unchanged.
  Callouts: "Readiness at a glance" · "Scope of language".
```

### A3 · "Session card + system surfaces" — later alternative (about 30 %, at the owner's limit)

```
Attach: 01-current-app-screenshots/07-template-processing-progress.png,
        01-current-app-screenshots/01-home-ready.png,
        01-current-app-screenshots/08-result-and-save.png
Tag: "Arrangement 3 · Session card + Live Activity · Later (structural)"

A · Home while processing — start from 07-template-processing-progress.png.
  VARY: shrink the sun into a compact cream session card docked above the bottom edge
  (sun glyph left, "Writing Meeting note" + "About 60%" centre, text button "Skip" right).
  ADD the menu glyph back at the top (Home stays usable).
  Callouts: "Keeps working" · "Home stays usable".

B · Lock Screen — draw an iPhone Lock Screen in the same palette using the sun glyph from
  01-home-ready.png. Show a Live Activity card: sun glyph, "Molnfri · Recording 03:12",
  a capsule button "Stop". Beside it, a small Dynamic Island pill with a tiny sun and "03:12".
  Callouts: "Live Activity" · "Stop from Lock Screen".

C · Result — use 08-result-and-save.png with the "Meeting ⌄" capsule from A1.
  Callout: "Same result sheet".
Add a tiny footnote chip on B: "Needs security review".
```

---

## Part B — Six prioritized boards

### Board 1 · Say what the sun is doing — Ranks #2 + #4 · FIRST BATCH

```
Attach: 01-current-app-screenshots/02-recording.png,
        01-current-app-screenshots/03-processing.png,
        01-current-app-screenshots/07-template-processing-progress.png
Tag: "Board 1 · #2 + #4 · First batch"

A · Recording — use 02-recording.png. ADD under "00:05": "Tap the sun to stop".
  Callout: "Stop cue".
B · Transcribing — use 03-processing.png. ADD in the empty header slot (same style as
  the timer): "Transcribing…". ADD a small moon-with-slash glyph at the very top right
  under the status bar. Callouts: "Stage named" · "Screen stays awake".
C · Writing — use 07-template-processing-progress.png. VARY "27%" → "About 27%".
  ADD "Writing Meeting note" under it, then text button "Skip – use transcript".
  Callouts: "Estimate, labelled" · "Skip AI".
Keep the sun, rays and arc exactly as in the sources.
```

### Board 2 · Change template without Edit — Rank #3 · FIRST BATCH

```
Attach: 01-current-app-screenshots/08-result-and-save.png,
        03-supplemental-older-captures/10-result-editing-template-chooser.png (style reference for the dial only)
Tag: "Board 2 · #3 · First batch"

A · Result — use 08-result-and-save.png. REPLACE the serif heading "Meeting" with a
  capsule "Meeting ⌄". KEEP Edit · Listen · Copy and Save.
  Callout: "Template, one tap".
B · Chooser sheet — overlay a bottom sheet (medium height, grabber, title "Choose template")
  on the dimmed result. Rows, centred like the dial in the reference image, keeping today's
  names (renames are #10, later):
  "Raw" / small caption "Exact transcript · no AI";
  "Flow" / "Fixes spelling and grammar";
  "Meeting ✓" in a selected capsule / "Situation · Insights · Action plan";
  "Pitch" / "Problem · Attention · Solution · Action";
  last row "New template…" with a plus glyph.
  Callouts: "Says what it does (#5)" · "New template here".
C · Protect edits — use 08-result-and-save.png in editing state (text editor showing the same
  three sections, one word underlined as edited) with a native iOS 26 alert on top:
  title "Replace your edits?", message "A new Pitch note replaces the text you changed.",
  buttons "Cancel" and "Replace". Callout: "No silent loss".
```

### Board 3 · Safe delete, one Edit — Ranks #1 + #6 · FIRST BATCH

```
Attach: 01-current-app-screenshots/10-notes-expanded.png,
        01-current-app-screenshots/09-saved-summary-and-actions.png,
        01-current-app-screenshots/15-template-prompt-and-headings.png
Tag: "Board 3 · #1 + #6 · First batch"

A · Notes — use 10-notes-expanded.png. Show the "Dec 26 · Flow" row lifted with a native
  context menu ("Move", "Delete note" in red), and a native alert centred:
  "Delete note?" / "This removes the note, its transcript and the recording from this iPhone.
  This can't be undone." / "Cancel" · "Delete" (red). Callout: "Always asks first".
B · Saved note — use 09-saved-summary-and-actions.png. REMOVE the toolbar "Edit" capsule
  next to the trash (ghost + ×). KEEP the in-card "Edit" and "Copy".
  VARY the round microphone under "New action item" to a smaller capsule
  "Dictate action item" with a mic glyph, tagged "#10 · later".
  Callouts: "One Edit" · "Not the record button".
C · Template editor — use 15-template-prompt-and-headings.png. REMOVE only the top-right "Edit"
  (ghost + ×). Keep everything else, including the floating round Save (moving Save is #12,
  shown on Board 6). Callout: "No Edit inside Edit template".
```

### Board 4 · Explain the choice, merge Auto — Ranks #5 + #11 · LATER (second/third batch)

```
Attach: 01-current-app-screenshots/05-template-choice.png,
        01-current-app-screenshots/06-auto-enabled.png
Tag: "Board 4 · #5 + #11 · Later"

A · Captions only (#5) — use 05-template-choice.png (Flow ✓, Auto off).
  ADD caption under "Flow ✓": "Fixes spelling and grammar".
  ADD caption under the Auto switch: "Off – you get the transcript first".
  Callouts: "Meaning visible" · "Off state explained".
B · Auto on (#5) — use 06-auto-enabled.png.
  VARY caption "Summarize automatically" → "Runs after each recording".
  ADD caption under "Meeting ✓": "Situation · Insights · Action plan".
C · One choice (#11) — start from 06-auto-enabled.png.
  ADD heading "After recording" above the list.
  VARY "Raw" → "Transcript only". REMOVE the Auto row (ghost + ×).
  KEEP "Meeting ✓" with caption "Runs after each recording".
  Callouts: "One control" · "Same result, fewer steps".
```

### Board 5 · Find the right note — Ranks #7 + #15 · LATER (second/third batch)

```
Attach: 01-current-app-screenshots/10-notes-expanded.png,
        01-current-app-screenshots/11-notes-compact.png,
        01-current-app-screenshots/12-template-folder-meeting.png
Tag: "Board 5 · #7 + #15 · Later"

A · Notes (#7) — use 10-notes-expanded.png. ADD a "Today" sub-header.
  VARY rows to "09:10 · Anna – follow-up   Meeting", "13:30 · Team retro   Flow",
  "16:45 · Untitled   Transcript only"; keep the row capsules and waveform.
  Callout: "Time + title".
B · Search (#15) — use 11-notes-compact.png. ADD a native search field
  "Search notes" with the query "Anna"; show two matching rows with a second line
  in muted text "…Anna will send the proposal on Friday."
  Callout: "Finds by content".
C · Template filter (#7) — use 12-template-folder-meeting.png.
  VARY the pill: folder icon → tag icon, text "Template: Meeting".
  Callout: "Not a folder".
```

### Board 6 · Recover, configure, author — Ranks #8 + #13 + #12 · LATER (second/third batch)

```
Attach: 03-supplemental-older-captures/08-writing-interrupted.png,
        01-current-app-screenshots/13-settings.png,
        01-current-app-screenshots/15-template-prompt-and-headings.png
Tag: "Board 6 · #8 + #13 + #12 · Later"

A · Recovery (#8) — use 08-writing-interrupted.png.
  VARY the message → "Writing the Meeting note stopped. Your transcript is safe."
  REMOVE "Recording saved." (ghost + ×).
  VARY buttons → "Try again" · "Use transcript"; ADD a third, quieter
  "Try with Apple Intelligence". VARY "Back" → "Close".
  Callouts: "Says which step" · "Choices, not dead ends".
B · Settings (#13) — use 13-settings.png. ADD caption under Models
  "Apple Intelligence · Ready" (small check glyph) and under EN/SV
  "App and dictation language". Callout: "Ready before you record".
C · Template editor (#12) — use 15-template-prompt-and-headings.png with the Board 3C fix.
  ADD "Save" as bold text at the top right. REMOVE the floating round Save (ghost + ×),
  revealing the "Output sections" header and its rows "Need", "Approach".
  ADD directly under the Prompt box a one-line petrol status:
  "Headings from your prompt: Need · Approach · Benefits · Competition".
  Callouts: "Save where expected" · "Structure visible while typing".
```

---

## Mapping and order

| Order | Board / arrangement | Ranks | Batch |
|---|---|---|---|
| 1 | Board 1 — Say what the sun is doing | #2, #4 | First |
| 2 | Board 2 — Change template without Edit | #3 | First |
| 3 | Board 3 — Safe delete, one Edit | #1, #6 | First |
| 4 | Board 4 — Explain the choice, merge Auto | #5, #11 | Later |
| 5 | Board 5 — Find the right note | #7, #15 | Later |
| 6 | Board 6 — Recover, configure, author | #8, #13, #12 | Later |
| — | A1 Clear Sun | #2, #3, #4 | First (summary board) |
| — | A2 One choice, labelled routes | #5, #7, #11, #13, #15 | Later |
| — | A3 Session card + system surfaces | structural | Later (needs security review) |
