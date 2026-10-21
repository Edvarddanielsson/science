# Molnfri — independent UX review

**Evidence:** compact evidence pack prepared 21 October 2026 (`molnfri-review-kit/`).
**Review date:** 21 October 2026.
**Scope:** review and proposals only. Nothing in the app, on any device or in any deployment was changed.

All paths are relative to the package root (`molnfri-review-kit/`) and keep the supplied filenames. Source line numbers refer to the supplied snapshot, which the pack states is byte-identical to the original. Three labels mark the kind of statement:

- **Observed**: visible in a capture or present in source.
- **Inferred**: a likely user problem that follows from what was observed. It has not been measured.
- **Proposed**: a recommendation.

Explainers are treated as teaching illustrations, not as proof of anything.

---

## Contents

0. [Evidence base and integrity](#0-evidence-base-and-integrity)
1. [Overall diagnosis](#1-overall-diagnosis)
2. [Ranked improvements](#2-ranked-improvements)
3. [Scoring method and the first batch](#3-scoring-method-and-the-first-batch)
4. [What to preserve, what to defer, and how overlapping controls differ](#4-what-to-preserve-what-to-defer-and-how-overlapping-controls-differ)
5. [Review of the five explainers](#5-review-of-the-five-explainers)
6. [Alternative arrangements and infographic boards](#6-alternative-arrangements-and-infographic-boards)
7. [Validation plan, uncertainties and evidence gaps](#7-validation-plan-uncertainties-and-evidence-gaps)
- [Appendix A — Version differences](#appendix-a--version-differences)
- [Appendix B — Where behaviour lives in the source](#appendix-b--where-behaviour-lives-in-the-source)

Companion files in this folder:

- [`INFOGRAPHIC_PROMPTS.md`](INFOGRAPHIC_PROMPTS.md): prompts for an image model that has the real screens attached. It covers the three arrangements and six boards.
- [`proposed-ui.html`](proposed-ui.html): 25 HTML mock-ups of the proposed screens in the app's Solar style, with per-board notes and the complementing-framework variations.
- [`SWIFTUI_NOTES.md`](SWIFTUI_NOTES.md): how each proposal maps to the existing Swift files and to SwiftUI, UIKit and other Apple framework APIs.
- [`priority-scores.csv`](priority-scores.csv): the scoring inputs, so anyone can re-weight them.

---

## 0. Evidence base and integrity

- **Integrity.** All 74 `MANIFEST.json` SHA-256 hashes and byte counts match. There are no unlisted or missing files.
- **Inspected.** All 14 current captures (`01-current-app-screenshots/`), all 5 explainers (`02-current-app-explainers/`) and all 7 older captures (`03-supplemental-older-captures/`).
- **Read.** Every view and flow file that touches recording, saving, templates, deletion, review/transfer, recovery, settings and models. The model runtimes were skimmed for user-facing messages, and specific keys were looked up in `Localizable.xcstrings`.
- **Context.** The four documents in `05-context/` were read for design intent only. Their QA claims were not re-run.
- **Not done.** No live walkthrough, device use, user research, analytics or performance measurement. The pack's own Simulator attempt stopped at a passcode prompt, and no unlock was attempted here.
- **Version differences.** The working-tree source is newer than at least one capture. These are listed in [Appendix A](#appendix-a--version-differences). The clearest case is that `15-template-prompt-and-headings.png` shows an editor footer which the source has since replaced (`04-source-snapshot/molnfri/Views/MolnfriTemplateViews.swift:128`, compare `04-source-snapshot/molnfri/Resources/Localizable.xcstrings:4` and `:1237`).

---

## 1. Overall diagnosis

Molnfri's core loop is short and calm. You tap one large sun to record, and the app transcribes on the phone. It can optionally rewrite the transcript with a template, and then you save. The engineering underneath is careful. Templates are snapshotted when recording starts. Audio and transcripts survive interruptions, the app locks itself, everything stays local, there is a review digest for managed deployments, and accessibility fallbacks are thorough.

The main problem is not missing features. **The calm, minimal surface hides state, meaning and consequences**, so users must learn things that the screen could simply show:

- **State.** While recording, the sun gives no visible stop cue. During transcription there is no label. The "27 %" is an estimate, but only VoiceOver is told so. Nothing on Home lets you skip a slow template.
- **Meaning.** What Raw, Flow, Meeting and Auto do is explained only to VoiceOver, or only after Auto is switched on. Choosing a template on Home has no effect unless Auto is also on.
- **Consequences.** Changing the template is hidden behind **Edit** and silently replaces corrections the user has made. Deleting a note from the list is immediate and permanent, while the same action in the note itself asks first.
- **Identity.** List rows show only a date and a template name. Same-day sessions cannot be told apart, and no search exists.
- **Dead ends and drift.** There is an **Edit** that does nothing on current notes, and a **Transfer** that can never succeed. Names drift (Flow/Free Flow, Raw/Original, Notes/Entries/Dictation), and several Swedish-only strings appear in the English UI.
- **Two architectures.** The Dark theme renders a different Home and a different recording screen. Recordings started from Notes or Settings use the sheet version, so "how do I stop?" depends on theme and entry point.

Most of what the five explainers teach exists to compensate for these gaps. The most valuable changes are therefore small. They mostly reuse strings and code paths that already exist, and they respect the approved Solar identity and its 30 % visual-change limit (`05-context/DESIGN_SYSTEM.md:88`). Section 4 lists the strengths worth keeping.

---

## 2. Ranked improvements

Scores come from the method in [section 3](#3-scoring-method-and-the-first-batch). Rows marked **★** form the minimum first batch. The table is a summary. Each row is expanded under [Item details](#item-details), with observed facts, inferences and proposals kept separate.

| # | Score | Current friction (observed → inferred) | Supporting evidence | Proposed change and exact labels | Expected benefit | Effort | Confidence | Regression risk | Dependencies |
|---|---|---|---|---|---|---|---|---|---|
| 1 ★ | **80** | Long-press → **Delete Entry** removes the note, transcript and audio at once with no confirmation. Delete inside the note asks first. → An accidental tap destroys client notes, and the inconsistency teaches the wrong rule. | `04-source-snapshot/molnfri/Views/EntryListView.swift:119-131, 357-363`<br>`04-source-snapshot/molnfri/Views/EntryDetailView.swift:132-139`<br>`04-source-snapshot/molnfri/Models/Models.swift:226-262`<br>`02-current-app-explainers/04-review-save-and-find-notes.png` (#9) | Same alert in both places. Title **"Delete note?"**, message "This removes the note, its transcript and the recording from this iPhone. This can't be undone.", buttons **Delete** · **Cancel**. | Prevents irreversible loss and gives one consistent rule. | XS | High | Low | None. "Recently Deleted" is an optional later step. |
| 2 ★ | **68** | While recording, only a timer shows and the mic glyph is unchanged. Transcription shows an unlabeled arc. Template work shows a bare "27%" that is a time-based estimate capped at 95. The sun is disabled, with no skip. → Users don't know how to stop, which stage they are in, or how to escape a slow run. | `01-current-app-screenshots/02-recording.png`, `03-processing.png`, `07-template-processing-progress.png`<br>`04-source-snapshot/molnfri/Views/MolnfriSolarLauncher.swift:57-58, 86-98, 250-261, 292, 297`<br>`04-source-snapshot/molnfri/Services/MolnfriRecordingFlow.swift:13-26, 398-414`<br>`04-source-snapshot/molnfri/Views/MolnfriRecordingFlowView.swift:59-65`<br>`04-source-snapshot/molnfri/Services/TranscriptionService.swift:148-155, 302-312` | One caption line under the header value. Recording: **"Tap the sun to stop"**. Transcribing: **"Transcribing…"**, or **"Downloading speech model 40%"** when assets download. Writing: **"About 27%"** over **"Writing Meeting note"**, plus a text button **"Skip – use transcript"**. No stop square. | Clear stop, stage and escape on every recording, matching the sheet flow. | S | High | Low | Caption exception to `05-context/DESIGN_SYSTEM.md:49`. Wording from #10. |
| 3 ★ | **65** | The template chooser and **+** appear only after **Edit**. Auto is off by default, so *every* post-recording template goes through this hidden route. Picking a template replaces edited text without warning. → Templates go undiscovered, "Edit" means two things, and corrections get lost. | `01-current-app-screenshots/08-result-and-save.png`<br>`03-supplemental-older-captures/10-result-editing-template-chooser.png`<br>`04-source-snapshot/molnfri/Views/MolnfriRecordingFlowView.swift:43, 82-89, 138-147`<br>`04-source-snapshot/molnfri/Services/MolnfriRecordingFlow.swift:263-268, 279-305, 342`<br>`05-context/DESIGN_SYSTEM.md:90, 93`<br>`02-current-app-explainers/02-templates-and-auto.png` (#3) | A capsule under the title: **"Meeting ⌄"**, or **"Transcript ⌄"** on a raw result. It opens a sheet titled **"Choose template"** with one-line descriptions and a last row **"New template…"**. **Edit/Done** edits text only. If the text was edited, confirm: **"Replace your edits?"** / "A new Pitch note replaces the text you changed." / **Replace** · **Cancel**. | Templates become reachable in one tap, and corrections are never silently lost. | S | High | Med | Update `DESIGN_SYSTEM.md:90`. UI tests use `flow.template.heading`. Captions from #5. |
| 4 ★ | **60** | Locking or backgrounding cancels transcription and writing, and nothing keeps the screen awake. → Auto-Lock can interrupt long processing (inferred; e.g. a 10-min recording has a 63 s Apple / 155 s Gemma writing estimate before transcription time). | `04-source-snapshot/molnfri/MolnfriApp.swift:88-106`<br>`04-source-snapshot/molnfri/Services/LocalInferenceCoordinator.swift:113-116`<br>`04-source-snapshot/molnfri/Services/MolnfriRecordingFlow.swift:158-169, 403-409`<br>No `isIdleTimerDisabled` anywhere in the snapshot<br>`03-supplemental-older-captures/08-writing-interrupted.png` | Set `UIApplication.shared.isIdleTimerDisabled = true` only while `presentation.isProcessing`, and restore it on result, failure or cancel. No new UI. | Fewer "Processing was interrupted" loops. The guide's "keep the app open" becomes "don't switch apps". | XS | Med | Low | Device test with 30 s Auto-Lock and a 5–10 min recording. |
| 5 | **51** | What Raw/Flow/Meeting/Pitch do, what Auto *off* means, what the models are and what EN/SV affects is explained only to VoiceOver or after enabling Auto. → Users pick by name alone, and the guides must explain. | `01-current-app-screenshots/05-template-choice.png` vs `06-auto-enabled.png`, `13-settings.png`<br>`04-source-snapshot/molnfri/Views/MolnfriTemplateDial.swift:94`<br>`04-source-snapshot/molnfri/Views/MolnfriSolarLauncher.swift:197, 200-205`<br>`04-source-snapshot/molnfri/Views/PrivacyView.swift:205, 426, 483-491`<br>`04-source-snapshot/molnfri/Services/MolnfriTranscriptionProvider.swift:54` | A caption under the *selected* template only. Raw **"Exact transcript · no AI"**. Flow **"Fixes spelling and grammar"**. Meeting **"Situation · Insights · Action plan"**. Pitch **"Problem · Attention · Solution · Action"**. Custom templates show their effective headings. The Auto caption is always visible: **"Off – you get the transcript first"** / **"Runs after each recording"**. Under EN/SV: **"App and dictation language"**. Model subtitles are shown visibly. | Better template choices without a guide. Most of guide 02's middle column disappears. | S | High | Med | Exception to `DESIGN_SYSTEM.md:49`. Solar menu geometry (`MolnfriSolarLauncher.swift:79-83`). |
| 6 ★ | **50** | A saved note shows two **Edit** buttons, and the toolbar one only affects legacy notes. The template editor shows "Cancel · Edit template · **Edit**", where Edit reorders headings that already have arrows. The Templates list **Edit** duplicates its arrows. → Dead taps, and "Edit" is ambiguous. | `01-current-app-screenshots/09-saved-summary-and-actions.png`, `15-template-prompt-and-headings.png`, `03-supplemental-older-captures/01-template-library.png`<br>`04-source-snapshot/molnfri/Views/EntryDetailView.swift:122-130`<br>`04-source-snapshot/molnfri/Views/ActionPlanEditorView.swift:35`<br>`04-source-snapshot/molnfri/Views/MolnfriTemplateViews.swift:51-55, 72, 85-100, 141-177, 195` | Note toolbar: **Back** and **Delete** only, with `EditButton` shown only for legacy `entry.note`. Template editor: remove the toolbar **Edit** and keep the arrows. Templates list: rename **Edit** → **"Reorder"**. | One meaning for "Edit" and no inert controls. | XS | High | Low | None. |
| 7 | **49** | Rows show "Dec 27" + template only. Titles exist but only VoiceOver hears them. Template filters use the folder icon. → Same-day sessions can't be told apart, and "Meeting" looks like a folder the user made. | `01-current-app-screenshots/10-notes-expanded.png`, `11-notes-compact.png`, `12-template-folder-meeting.png`<br>`03-supplemental-older-captures/02-folder-chooser.png`<br>`04-source-snapshot/molnfri/Views/EntryListView.swift:224, 284, 472-507`<br>`04-source-snapshot/molnfri/Views/EntryDetailView.swift:19`<br>`04-source-snapshot/molnfri/Models/Models.swift:266-269`<br>`05-context/DESIGN_SYSTEM.md:89` | Row: **"14:05 · Anna – follow-up"**, using the title or else the first five words, with the template on the right. Day sub-headers **"Today" / "Yesterday" / "Tue 20 Oct"**. The template filter pill shows a tag icon and **"Template: Meeting"**. The note header reads **"Meeting · 21 Oct 14:05"**. | Finds the right session without opening several notes. | S | Med | Med | Privacy choice on preview words. Reverses `DESIGN_SYSTEM.md:89`. |
| 8 | **43** | One generic interruption message for every stage, plus a duplicate "Recording saved." Transcription failures get only Retry. Microphone denial offers Retry with no route to Settings. Model errors say "choose Apple in Settings" from inside a modal. Untranscribed notes are transcribed via a button labelled **Template**. | `03-supplemental-older-captures/08-writing-interrupted.png`<br>`04-source-snapshot/molnfri/Services/MolnfriRecordingFlow.swift:221-225, 307-316, 416-421`<br>`04-source-snapshot/molnfri/Views/MolnfriRecordingFlowView.swift:50-58`<br>`04-source-snapshot/molnfri/Services/AudioRecorderService.swift:13-14`<br>`04-source-snapshot/molnfri/Services/GemmaNoteOutput.swift:10-18`<br>`04-source-snapshot/molnfri/Services/PianissimoTranscriptionProvider.swift:11-13`<br>`04-source-snapshot/molnfri/Views/EntryDetailView.swift:84-91` | Writing stage: **"Writing the Meeting note stopped. Your transcript is safe."** → **Try again** · **Use transcript** · (Gemma) **Try with Apple Intelligence**. Transcription stage: **"Transcription stopped. Your recording is safe."** → **Transcribe again** · **Save recording only**. Microphone denied → **Open Settings**. Raw-note button: **"Transcribe"** when there is no text, otherwise **"Apply template…"**. | Recovery works without guide 05, and dead-end retries go away. | S | Med | Low | Wording from #10. The provider switch is M if added. |
| 9 | **40** | **Transfer** is always offered but can never complete, and admin retention lines appear in Swedish for everyone. → A dead end that needs a guide footnote. | `04-source-snapshot/molnfri/Views/DictationReviewControls.swift:15-43, 45-65`<br>`04-source-snapshot/molnfri/Services/DictationReviewService.swift:122-128`<br>`02-current-app-explainers/04-review-save-and-find-notes.png` (footer) | Show Transfer and retention lines only when an organization profile and destination exist. When unmanaged, the disclosure becomes **"Checked"** with **"Mark as checked"** and status **"Checked ✓" / "Not checked"**. | Removes a dead end while keeping the managed workflow intact. | XS | High | Low | Product decision on review for personal use. |
| 10 | **37** | Flow vs "Free Flow". Raw vs "Original", even though a saved raw "Original" may be edited text. Notes vs Entries vs Dictation. Result **Back** opens "Keep this recording?" with **Keep recording** (reads as "continue recording") / **Discard recording** / **Continue**. The action-item mic looks like Record. "Ring position" refers to a retired metaphor. | `01-current-app-screenshots/05-template-choice.png` vs `03-supplemental-older-captures/01-template-library.png`<br>`04-source-snapshot/molnfri/Views/MolnfriSolarLauncher.swift:213`<br>`04-source-snapshot/molnfri/Models/MolnfriSummaryTemplate.swift:182-184`<br>`04-source-snapshot/molnfri/Views/MolnfriRecordingFlowView.swift:56, 64, 72, 80, 111-124, 159, 230`<br>`04-source-snapshot/molnfri/Views/EntryListView.swift:101`<br>`04-source-snapshot/molnfri/Views/MolnfriTemplateViews.swift:211` | **"Transcript"** for raw text: the template, the **Use transcript** button and the section header. **"Flow"** everywhere, as a display-only change. **Notes / New note** everywhere. Toolbar **"Close"**. The dialog becomes **"Save this note?"** → **Save note** · **Delete recording** · **Keep editing**. Mic labelled **"Dictate action item"**. Restore message: "Its place in the list won't change." | Guides stop translating names, and the exit choice is unambiguous. | S | Med | Med | Swedish wording test. UI identifiers. |
| 11 | **37** | The Home checkmark does nothing unless Auto is on. Auto *off* produces exactly what Auto *on + Raw* produces. One decision is split across two controls in two places. | `01-current-app-screenshots/05-template-choice.png`, `06-auto-enabled.png`, `03-supplemental-older-captures/01-template-library.png`<br>`04-source-snapshot/molnfri/Views/MolnfriSolarLauncher.swift:191-211`<br>`04-source-snapshot/molnfri/Services/MolnfriRecordingFlow.swift:204-214, 263-268, 318-329`<br>`04-source-snapshot/molnfri/Views/MolnfriStructuredTextEditor.swift:87-129` | Replace the Auto switch with one list headed **"After recording"**: **Transcript only** (default) · Flow · Meeting · Pitch · custom. Caption: **"Runs after each recording"**. Settings → Templates shows the same picker. | One decision, one control. Guide 02 #2 and the "Auto off" note disappear. | S | Med | Med | #5. Preference migration. Auto persistence tests. |
| 12 | **36** | Output headings switch silently to prompt-derived ones when the prompt has 2–12 "Label:" bullets, so instruction bullets can become headings. The preview sits under a 112-pt floating Save. | `01-current-app-screenshots/14-new-template-editor.png`, `15-template-prompt-and-headings.png`<br>`04-source-snapshot/molnfri/Views/MolnfriTemplateViews.swift:128, 141-177, 195-206`<br>`04-source-snapshot/molnfri/Models/MolnfriSummaryTemplate.swift:54-84`<br>`04-source-snapshot/molnfri/Resources/Localizable.xcstrings:4, 1237` | Under Prompt: **"Headings from your prompt: Need · Approach · Benefits · Competition"**, or **"Custom headings (3)"**. Move **Save** into the navigation bar (confirmation position) and keep **Cancel**. | Authors see the effective structure while typing, with nothing covering it. | S | Med | Low | `DESIGN_SYSTEM.md:66`. #6. |
| 13 | **36** | Settings shows no readiness, and Apple Intelligence is checked only when generating. Model rows are disabled while their downloads sit far below. "Available engine: DictationTranscriber" exposes an API name. There is no cellular check before 0.7–2.6 GB downloads. | `01-current-app-screenshots/13-settings.png`, `03-supplemental-older-captures/09-transcription-model-settings-swedish.png`<br>`04-source-snapshot/molnfri/Views/PrivacyView.swift:66-69, 216-229, 284-315, 438-440, 546-549`<br>`04-source-snapshot/molnfri/Services/MolnfriSummarisationProvider.swift:104-107`<br>`04-source-snapshot/molnfri/Services/LocalModelCatalog.swift:24-59`<br>`04-source-snapshot/molnfri/Services/LocalModelStore.swift:256-266` | Caption under Models: **"Apple Intelligence · Ready"** or **"Turn on Apple Intelligence"**. Replace "Available engine" with **"Runs on this iPhone"**. Inline **"Download · 175 MB"** on unavailable rows. A cellular prompt: **"Download 2.6 GB using mobile data?"** | Fewer failed first summaries and clearer setup. | S | Med | Low | None. |
| 14 | **34** | Swedish-only strings have no English entry. These include the lock screen, the Face ID reason, review and transfer text, the playback error and the recovered-note title. → English users see Swedish at every unlock (if the build matches the snapshot). | `04-source-snapshot/molnfri/Services/AppAccessController.swift:30, 99, 106, 118, 154-155`<br>`04-source-snapshot/molnfri/Views/DictationReviewControls.swift:33-38, 50-62, 73, 137-139`<br>`04-source-snapshot/molnfri/Services/AudioLifecycleService.swift:110`<br>Catalog lookup: keys absent from `04-source-snapshot/molnfri/Resources/Localizable.xcstrings` | Add English entries, localize the `String`-typed messages, and display **"Recovered recording"** localized. | A consistent language at the most frequent screen. | XS | Med | Low | Verify against a build. |
| 15 | **33** | There is no search, so finding a client's history relies on dates, folders and template filters. | `04-source-snapshot/molnfri/Views/EntryListView.swift` (no `.searchable`; none in the snapshot)<br>`01-current-app-screenshots/10-notes-expanded.png` | Search field **"Search notes"** over title, transcript and summary. Results show the matching line. No Spotlight indexing, because the data is sensitive. | Finding a session stays fast as notes accumulate. | M | Med | Low | #7 row design. |

**Scored candidates outside the top 15** (same method): label the Home menu glyphs and the Notes **Home** button (31) · one template order everywhere (30) · a live input level instead of the static waveform in the sheet recorder (26) · single-language templates (23) · unify Home and the recording surface across themes and entry points (19) · per-recording dictation language on Home (19) · background-safe processing (15). Section 4 explains why the structural ones wait.

### Item details

#### 1 · Confirm note deletion from the Notes list — score 80 ★

- **Observed.** The row context menu has **Delete Entry**, which calls `deleteEntry` directly (`04-source-snapshot/molnfri/Views/EntryListView.swift:126-130, 357-363`). The note view asks "Delete entry?" / "This removes the local note, transcript, and recorded audio file." (`04-source-snapshot/molnfri/Views/EntryDetailView.swift:132-139`). Deletion unlinks the audio file (`04-source-snapshot/molnfri/Models/Models.swift:226-262`). The snapshot has no trash or undo.
- **Inferred.** One mis-tap in a context menu permanently loses a sensitive client note. Users who learned that delete asks first in the note view are exposed in the list.
- **Proposed.** Reuse one alert: **"Delete note?"** / "This removes the note, its transcript and the recording from this iPhone. This can't be undone." / **Delete** (destructive) · **Cancel**. Later, optionally, a 30-day **Recently Deleted**, which needs a retention-policy decision for managed deployments.
- **Done when.** A long-press delete in the list always shows the alert, and Cancel leaves the note untouched.

#### 2 · Say what the sun is doing — score 68 ★

- **Observed.**
  - Recording shows only `00:05`, and the microphone glyph is unchanged (`01-current-app-screenshots/02-recording.png`). Stopping means tapping the same sun (`04-source-snapshot/molnfri/Views/MolnfriSolarLauncher.swift:57-58`), and only VoiceOver hears "Stop recording" (`:297`).
  - Transcription draws a moving arc with no text (`01-current-app-screenshots/03-processing.png`; `MolnfriSolarLauncher.swift:418-437`). A status line appears only when Reduce Motion is on (`:93-98`).
  - Template work shows "27%" (`01-current-app-screenshots/07-template-processing-progress.png`). That figure is a duration estimate held at 95 until completion (`:250-261`; `04-source-snapshot/molnfri/Services/MolnfriRecordingFlow.swift:398-414`).
  - The sun is disabled while processing (`:292`). The sheet flow offers **Original** during template work (`04-source-snapshot/molnfri/Views/MolnfriRecordingFlowView.swift:61-65`), but Home has no equivalent.
  - Speech-asset downloads report progress (`04-source-snapshot/molnfri/Services/TranscriptionService.swift:148-155, 302-312`) that the UI never shows.
- **Inferred.** First-time users hunt for a stop control, read "27%" as precise, and wait helplessly on a slow model. A first-use speech-asset download looks like a hang.
- **Proposed.** Keep the sun and rays exactly as they are, with no stop square (`05-context/DESIGN_SYSTEM.md:77`), and add one caption line in the header area:

  | State | Header value | Caption |
  |---|---|---|
  | Recording | `00:05` | **Tap the sun to stop** |
  | Transcribing | **Transcribing…** | **Downloading speech model 40%**, only while assets download |
  | Writing | **About 27%** | **Writing Meeting note** + text button **Skip – use transcript** (calls `useRaw()`) |

  The status strings already exist in `MolnfriRecordingFlow.swift:15-26`.
- **Done when.** Each state shows visible text. **Skip** opens the transcript result. VoiceOver output stays the same or improves.

#### 3 · A visible template control on the result, separate from Edit — score 65 ★

- **Observed.**
  - The chooser (`Byt mall`/"Change template") and the **+** for a new template appear only while editing (`04-source-snapshot/molnfri/Views/MolnfriRecordingFlowView.swift:43, 82-89, 138-147`). This is an explicit design rule (`05-context/DESIGN_SYSTEM.md:90`).
  - Auto is off by default (`DESIGN_SYSTEM.md:93`; `04-source-snapshot/molnfri/Views/MolnfriSolarLauncher.swift:155`). With Auto off, the result is the raw transcript (`04-source-snapshot/molnfri/Services/MolnfriRecordingFlow.swift:263-268`).
  - Picking a template reprocesses at once (`:279-290`). The source text is the original transcript if the current text is AI output, and the edited text if it is raw (`:342`). **Original** restores the unedited transcript (`:292-305`).
- **Inferred.** On the default path, every template application starts with an unrelated-sounding **Edit**. Corrections to names and dates can vanish with one tap.
- **Proposed.**
  - Put a capsule directly under the title: **"Meeting ⌄"**, or **"Transcript ⌄"** for raw output.
  - The capsule opens a sheet titled **"Choose template"**. It reuses the dial or list, shows the one-line captions from #5, and ends with **"New template…"**.
  - **Edit/Done** edits text only.
  - If the text changed since it was generated, confirm with **"Replace your edits?"** / "A new Pitch note replaces the text you changed." / **Replace** · **Cancel**.
- **Done when.** A template can be applied from a fresh result in two taps without entering edit mode. Edited text is never replaced without confirmation.

#### 4 · Keep the screen awake while Molnfri processes — score 60 ★

- **Observed.**
  - The scene moving to background, protected-data loss and memory pressure all cancel processing (`04-source-snapshot/molnfri/MolnfriApp.swift:88-106`; `04-source-snapshot/molnfri/Services/LocalInferenceCoordinator.swift:113-116`; `04-source-snapshot/molnfri/Services/MolnfriRecordingFlow.swift:158-169`).
  - The snapshot contains no idle-timer handling.
  - The writing-time estimates (`MolnfriRecordingFlow.swift:403-409`) put a 10-minute recording at about 63 s (Apple) or 155 s (Gemma), *after* transcription.
- **Inferred, runtime unverified.** A user who puts the phone down after Stop can hit Auto-Lock, which interrupts processing. This is consistent with the recovery screen in `03-supplemental-older-captures/08-writing-interrupted.png` and the guides' "keep the app open".
- **Proposed.** Set `UIApplication.shared.isIdleTimerDisabled = true` only while `presentation.isProcessing`, and restore it on result, failure, cancel or dismissal. This respects the existing data-protection design: the device stays unlocked, so the protected files stay readable.
- **Done when.** With a 30 s Auto-Lock, a 5-minute recording finishes processing with no touches, and the idle timer is restored afterwards.

#### 5 · One-line explanations where people decide — score 51

- **Observed.**
  - Template meanings are VoiceOver hints only: "Exact original text, without AI." / "Corrects language without summarizing." / "Processes text using the template." (`04-source-snapshot/molnfri/Views/MolnfriTemplateDial.swift:94`; English and Swedish translations exist in `Localizable.xcstrings`).
  - The Auto caption appears only once Auto is on (`01-current-app-screenshots/05-template-choice.png` vs `06-auto-enabled.png`; `04-source-snapshot/molnfri/Views/MolnfriSolarLauncher.swift:197, 200-205`).
  - Model subtitles are hints only (`04-source-snapshot/molnfri/Views/PrivacyView.swift:426, 483-491`; `04-source-snapshot/molnfri/Services/MolnfriTranscriptionProvider.swift:54`), and so is "App and dictation language" (`PrivacyView.swift:205`).
  - The design system deliberately minimizes copy (`05-context/DESIGN_SYSTEM.md:49`).
- **Inferred.** People choose "Flow" without knowing what it does, and don't know that Auto off yields a transcript or that EN/SV also changes recognition. Guides 02 and 05 exist largely to say these things.
- **Proposed.** Captions appear only at decision points and only for the selected item, as described in table row 5. Model rows show their subtitle under the title. This is a narrow, explicit exception to the copy rule.
- **Done when.** In a 5-second test, participants can say what Flow does and what happens with Auto off.

#### 6 · Remove inert or duplicate Edit buttons — score 50 ★

- **Observed.**
  - The toolbar `EditButton` on a note (`04-source-snapshot/molnfri/Views/EntryDetailView.swift:123`) only matters for legacy action lists (`04-source-snapshot/molnfri/Views/ActionPlanEditorView.swift:35`). Nothing in the summary or raw branches reads edit mode, and the snapshot has no `editMode` use at all. Capture 09 shows both **Edit** buttons (`01-current-app-screenshots/09-saved-summary-and-actions.png`).
  - The template editor's toolbar **Edit** (`04-source-snapshot/molnfri/Views/MolnfriTemplateViews.swift:195`) enables drag-reorder for headings that already have arrow buttons (`:153-161, 171`). It does nothing when the headings come from the prompt (`:141-147`).
  - The Templates list **Edit** (`:72`) duplicates the arrows (`:85-100`).
- **Proposed.** Show the note `EditButton` only when `entry.note != nil`. Remove it from the template editor. Rename it **"Reorder"** in the Templates list. The arrows stay, because they are the accessible alternative to drag.

#### 7 · Make notes identifiable — score 49

- **Observed.**
  - Rows show a waveform, "Dec 27" and the template name (`01-current-app-screenshots/10-notes-expanded.png`, `11-notes-compact.png`; `04-source-snapshot/molnfri/Views/EntryListView.swift:472-507`). Time, title and preview were deliberately removed on 21 October (`05-context/DESIGN_SYSTEM.md:89`). The older design showed date, time and preview (`03-supplemental-older-captures/02-folder-chooser.png`).
  - Titles exist (`04-source-snapshot/molnfri/Views/EntryDetailView.swift:19`; `04-source-snapshot/molnfri/Models/Models.swift:266-269`) but reach only VoiceOver (`EntryListView.swift:506`).
  - Template filters reuse the folder icon (`EntryListView.swift:224, 284`; `01-current-app-screenshots/12-template-folder-meeting.png`).
  - The note view doesn't show which template produced it (`EntryDetailView.swift:17-99`).
- **Inferred.** A coach with several sessions a day must open notes one by one to find "the 14:00 client".
- **Proposed.** Make the minimal row informative without making it busy:
  - Use one line: `14:05 · Anna – follow-up`, where the text is the title or else the first five words, with the template right-aligned.
  - Add day sub-headers inside each year group.
  - Show a tag icon and "Template: Meeting" for template filters.
  - Put a "Meeting · 21 Oct 14:05" header in the note.
  - Preview words are a privacy trade-off (shoulder-surfing), so offer **"Show titles only"** if research asks for it.
  - Optional later: an on-device suggested title at Save, using Foundation Models.

#### 8 · Stage-specific recovery — score 43

- **Observed.**
  - Every interruption shares "Processing was interrupted. Your recording is kept. Retry to continue.", followed by "Recording saved." (`03-supplemental-older-captures/08-writing-interrupted.png`; `04-source-snapshot/molnfri/Services/MolnfriRecordingFlow.swift:416-421`; `04-source-snapshot/molnfri/Views/MolnfriRecordingFlowView.swift:50-58`).
  - **Original** appears only after transcription finished (`:55-58`), so a transcription failure offers only **Retry**. This is source-only, because the capture of that state was omitted from the pack.
  - Retry after a microphone denial repeats the failure (`04-source-snapshot/molnfri/Services/AudioRecorderService.swift:13-14, 121-124`; `MolnfriRecordingFlow.swift:307-316`).
  - Model errors tell users to "choose Apple in Settings" (`04-source-snapshot/molnfri/Services/GemmaNoteOutput.swift:10-18`; `04-source-snapshot/molnfri/Services/PianissimoTranscriptionProvider.swift:11-13`) while the result is a modal sheet.
  - Recovered recordings arrive as "Återställt diktat" with no text (`04-source-snapshot/molnfri/Services/AudioLifecycleService.swift:110`). They can be transcribed only through a button labelled **Template** (`04-source-snapshot/molnfri/Views/EntryDetailView.swift:84-91`; `MolnfriRecordingFlow.swift:221-225`).
- **Proposed.** The stage-specific copy and buttons are listed in table row 8. Remove the duplicate line.

#### 9 · Hide Transfer until it can work — score 40

- **Observed.** **Transfer** (`Överför`) and its preview (`04-source-snapshot/molnfri/Views/DictationReviewControls.swift:27-30, 45-65`) always end in `destinationNotConfigured` (`04-source-snapshot/molnfri/Services/DictationReviewService.swift:122-128`). Retention lines are shown to anyone with audio (`DictationReviewControls.swift:31-39`).
- **Proposed.** Feature-flag the transfer and retention UI on `DeploymentConfiguration.current()` plus an existing destination. For personal installs, keep a lightweight **"Mark as checked"**. Keep the full **Review/Approve** flow for managed profiles.

#### 10 · Terminology and exit labels — score 37

- **Observed.** The sources for each naming split and for the dialog are listed in table row 10. One extra subtlety: when a raw result was edited, Save stores the edited text *as the transcript* (`04-source-snapshot/molnfri/Views/MolnfriRecordingFlowView.swift:159`), yet the note shows it under **"Original"** (`04-source-snapshot/molnfri/Views/EntryDetailView.swift:39`).
- **Proposed.** One word per concept, as in table row 10. The Swedish equivalents need testing, for example "Transkription", "Spara anteckning", "Radera inspelning" and "Fortsätt redigera".

#### 11 · One "After recording" choice instead of template + Auto — score 37

- **Observed.**
  - Tapping a template on Home only stores a default (`04-source-snapshot/molnfri/Views/MolnfriSolarLauncher.swift:211`). It is applied only when Auto is on (`04-source-snapshot/molnfri/Services/MolnfriRecordingFlow.swift:204-214, 263-268`), and with Auto off it isn't even preselected in the result chooser (`04-source-snapshot/molnfri/Views/MolnfriRecordingFlowView.swift:95, 104`).
  - Auto off and Auto on + Raw both end as the raw transcript (`MolnfriRecordingFlow.swift:263-268, 318-329`).
  - The same pair of controls is repeated in Settings → Templates (`04-source-snapshot/molnfri/Views/MolnfriStructuredTextEditor.swift:87-129`; `03-supplemental-older-captures/01-template-library.png`).
- **Proposed.** Use a single list, **After recording**, defaulting to **Transcript only**. Migrate Auto off → Transcript only, and Auto on → the stored template.
- **Risk.** Some users may value an explicit AI switch. Research should test this (section 7).

#### 12 · Template editor: show where headings come from; move Save — score 36

- **Observed.**
  - Output headings come from the prompt whenever it holds 2–12 distinct top-level "Label:" bullets or Markdown headings (`04-source-snapshot/molnfri/Models/MolnfriSummaryTemplate.swift:54-84`). The manual fields are then replaced by a read-only list (`04-source-snapshot/molnfri/Views/MolnfriTemplateViews.swift:141-177`).
  - The exclusion list is short (`MolnfriSummaryTemplate.swift:78-79`), so "- Tone: warm / - Length: short" would yield the headings "Tone" and "Length". That outcome is inferred from the parsing rules.
  - The preview sits below the prompt, under the 112-pt floating **Save** at rest (`01-current-app-screenshots/14-new-template-editor.png`, `15-template-prompt-and-headings.png`; `MolnfriTemplateViews.swift:197-206`).
- **Proposed.** Add a one-line status directly under the prompt, and put **Save** in the navigation bar. An explicit **"Use custom headings"** override is optional. It needs a stored flag, which is M effort.

#### 13 · Settings readiness at a glance — score 36

- **Observed.** The evidence and proposal are in table row 13. The availability API is already used at generation time: `SystemLanguageModel.default.availability` (`04-source-snapshot/molnfri/Services/MolnfriSummarisationProvider.swift:104-107`).
- **Proposed.** Call the same API when Settings appears. Keep the circular Settings design and add one caption line under **Models**.

#### 14 · Localization pass — score 34

- **Observed.** The catalog lookup found no entries for "Dina diktat är låsta.", "Lås upp", "Rättelseperiod ej konfigurerad", the review guidance, the transfer-preview strings or the playback error. Several lock and unlock messages are plain `String`s, which bypass the catalog anyway (`04-source-snapshot/molnfri/Services/AppAccessController.swift:30, 99, 106, 118, 123, 154-155`).
- **Caveat.** The catalog is a working-tree snapshot. Confirm against a build.

#### 15 · Search notes — score 33

- **Observed.** There is no `.searchable` anywhere in the snapshot. The notes list is complete in `04-source-snapshot/molnfri/Views/EntryListView.swift`.
- **Proposed.** Add a native search field (`.searchable`) backed by a SwiftData predicate over title, transcript and summary. Do not index in Spotlight.

---

## 3. Scoring method and the first batch

**Priority = 10 × Benefit × Effort factor × Risk factor × Confidence factor**, rounded half-up. The maximum is 100.

| Input | Scale |
|---|---|
| **Benefit** (1–10) | Expected user value, judged from evidence as frequency × severity × breadth. Irreversible data loss and every-recording friction score highest. |
| **Effort** | XS ≤ ½ day (×1.00) · S ½–2 days (×0.85) · M 3–10 days (×0.65) · L > 2 weeks (×0.45). Estimates assume one developer who knows the codebase, and include tests. |
| **Regression risk** | Low ×1.00 · Med ×0.85 · High ×0.70. Considers lifecycle, persistence and migration, UI-test churn, and conflicts with approved design rules. |
| **Confidence** | High ×1.00: observed in captures and confirmed in source. Med ×0.85: source-only or user impact inferred. Low ×0.70: depends on unknown usage or platform behaviour. |

**Ties** are broken in this order: higher confidence, lower effort, problems visible in current captures, then data-safety relevance. All inputs are in [`priority-scores.csv`](priority-scores.csv).

These are expert estimates to rank work, not measured ROI. They express expected benefit relative to cost and risk. No 80/20 claim is made.

### Smallest coherent high-impact first batch

**#1 delete confirmation · #2 Home status, stop cue and skip · #3 visible template control with edit protection · #4 keep awake while processing · #6 remove inert Edit buttons.**

This is three XS items and two S items, about 3–5 developer-days by estimate. Why these five belong together:

- They all sit on the main loop: record → process → result → saved note.
- They close the two data-safety gaps (list delete, silently replaced edits) and the likeliest reliability gap (Auto-Lock).
- They make the default Auto-off path discoverable.
- They mostly reuse existing strings (`Presentation.status`, the translated hints) and existing code paths (`useRaw()`, the existing dial, the existing alert).
- None of them changes the Solar identity: no stop square, no new chrome on the closed Home.

#5 scores slightly higher than #6, but it is held for the second batch for two reasons. It needs a deliberate exception to the copy rule, and it touches the tight Solar menu geometry.

| Batch | Items | Theme |
|---|---|---|
| First ★ | 1, 2, 3, 4, 6 | Safety and visible state in the main loop |
| Second | 5, 7, 8, 9 | Teach less: explain choices, identify notes, recover clearly, remove dead ends |
| Third | 10, 11, 12, 13, 14, 15 | Consolidate words, the template model, editor, Settings and search |
| Later, structural | Unify Home and the recording surface (19) · background-safe processing (15) · per-recording language (19) · single-language templates (23) · menu labels (31) · one template order (30) · live input level (26) | Each needs design decisions, research or platform/security work first |

---

## 4. What to preserve, what to defer, and how overlapping controls differ

### Preserve: useful capabilities and distinctions

| Keep | Why (evidence) |
|---|---|
| One-tap capture on Home, in place, with an elapsed timer | The fastest path to recording, and the app's identity (`01-current-app-screenshots/01-home-ready.png`, `02-recording.png`; `04-source-snapshot/molnfri/Views/MolnfriSolarLauncher.swift:57-58`) |
| Template snapshot at recording start; transcription never waits for template choice | Later edits can't corrupt an in-flight note (`04-source-snapshot/molnfri/Services/MolnfriRecordingFlow.swift:7, 203-214, 246`) |
| Raw path that bypasses AI, plus an escape back to the transcript | Trust and fallback (`MolnfriRecordingFlow.swift:292-305, 318-329`) |
| Exit confirmation before discarding a result | Prevents loss; needs relabelling only (`04-source-snapshot/molnfri/Views/MolnfriRecordingFlowView.swift:111-124`) |
| Recovery that keeps audio and transcript, the recovery journal, and stage-aware Retry | Robust (`MolnfriRecordingFlow.swift:158-169, 307-316`; `04-source-snapshot/molnfri/Services/AudioLifecycleService.swift:51-122`) |
| App lock, local-only processing, no CloudKit, protected files | Core promise for sensitive notes (`04-source-snapshot/molnfri/Services/AppAccessController.swift`; `04-source-snapshot/molnfri/MolnfriApp.swift:31-46`) |
| Review/approve with content digest, for managed deployments | Attests what was checked and resets on edit (`04-source-snapshot/molnfri/Models/Models.swift:33-40`; `04-source-snapshot/molnfri/Services/DictationReviewService.swift:85-120`) |
| Manual folders **and** template groups | Different jobs: *who/what project* vs *what kind of note* (`04-source-snapshot/molnfri/Views/EntryListView.swift:23-48`) |
| Recording from Notes saves into the selected folder | A useful contextual shortcut (`EntryListView.swift:183`; `MolnfriRecordingFlowView.swift:155-158`) |
| Prompt-derived headings | A power feature (the NABC example) that only needs to be visible (`04-source-snapshot/molnfri/Models/MolnfriSummaryTemplate.swift:54-84`) |
| Bilingual templates with shared section order | Needed by bilingual users; relax the requirement rather than remove the capability |
| Accessibility work: Dynamic Type row fallbacks, Reduce Motion status text, named VoiceOver actions on the sun, selection traits | Strong foundation. Several proposals simply surface these strings for everyone (`MolnfriSolarLauncher.swift:60-61, 93-98`; `04-source-snapshot/molnfri/Views/PrivacyView.swift:139-185`) |
| Copy, Listen, voice action items, completion sounds, haptics | Small, valued conveniences |
| Swipe navigation | Keep as an accelerator, but never as the only route |

### Overlapping controls: treat them differently

| Overlap | Classification | Treatment |
|---|---|---|
| Mic on Home, Notes and Settings | **Useful shortcuts** (same job, different context; Notes adds the folder destination) | Keep all three. Unify the recording *surface* later, so stopping and progress look the same everywhere |
| Template + Auto on Home vs Auto + Template in Settings → Templates | **Same state, two places** (quick choice vs configuration) | Keep both places but use one model ("After recording", #11) and the same names |
| **Edit** on a result vs toolbar **Edit** on a saved note | **Different scopes; one is inert** | Keep the result Edit. Show the toolbar Edit for legacy notes only (#6) |
| Template reorder: arrows vs **Edit** drag | **Accessible alternative + gesture** | Keep the arrows. Rename the list toggle to **Reorder** and drop it from the heading editor (#6) |
| Delete in the list menu vs delete in the note | **Same job, different context** | Keep both, with the same confirmation (#1) |
| **Original** (recovery and processing), **Raw** (template), **Original** (note section) | **Same concept, three names** | One word: **Transcript** (#10) |
| **Copy** vs **Transfer** | **Different jobs** (personal clipboard vs organizational hand-off) | Keep Copy. Hide Transfer until a destination exists (#9) |
| **Save** vs **Approve** | **Different jobs** (persist vs attest) | Keep both for managed profiles. For personal use, a light "Mark as checked" (#9) |
| Dark side buttons vs Sky menu | **Same jobs, different information architecture** | Unify later, with theme as palette only |
| Notes **›** button vs swipe back | **Accessible control + gesture** | Keep both. Clarify the button's label ("Home") |

### Tempting changes to defer, and why

| Tempting change | Why defer |
|---|---|
| Replace the circular Settings with a standard grouped list | The owner explicitly approved the circles (`05-context/DESIGN_SYSTEM.md:12`). A caption line (#13) gets most of the benefit inside the 30 % change limit |
| Turn the sun into a classic record button with a stop square | Conflicts with the approved identity (`DESIGN_SYSTEM.md:77`). A caption (#2) achieves the clarity |
| Remove the Dark theme's own Home | Do it as part of a planned unification, not piecemeal. Recording-lifecycle regressions are likely |
| Follow the system dark mode automatically | With today's code, Home's layout and recording screen would switch at sunset (`04-source-snapshot/molnfri/Views/MolnfriLauncherView.swift:41-76`; `04-source-snapshot/molnfri/MolnfriApp.swift:86-87`). Unify first |
| Background processing after leaving the app | The app locks on background and protects files, so inference would need a security redesign. Evaluate iOS 26 continued processing later |
| Live transcription while recording (SpeechAnalyzer volatile results) | Attractive reassurance, but battery, thermal and privacy UX (text visible on screen) need study |
| Decouple app language from dictation language | It was deliberately merged (`DESIGN_SYSTEM.md:66`). Research bilingual session frequency first |
| Drop manual folders for search or tags | Folders serve a different job (#15 complements them) |
| Merge Review into Save | Distinct legal and attestation meaning in managed deployments |
| Previews of transcript text in rows | Privacy trade-off. Start with time + title (#7) |
| Tooltips or TipKit everywhere | Use at most one or two one-time tips if research still shows a need after #2/#5 |

---

## 5. Review of the five explainers

**Verdicts:**

- **Accurate**: matches the source and current captures.
- **Partly accurate**: true in the main case but incomplete or overstated.
- **Misleading**: the illustration or claim would lead a reader to a wrong belief.

"Guide problem" means the guide should change. "App problem" means the guide is accurate but has to teach around avoidable complexity.

### Guide 01 — Recording (`02-current-app-explainers/01-recording.png`)

| Claim | Verdict | Evidence |
|---|---|---|
| The menu reveals Notes, Settings, template choices and Auto | Accurate | `01-current-app-screenshots/05-template-choice.png`; `04-source-snapshot/molnfri/Views/MolnfriSolarLauncher.swift:103-122, 151-206` |
| Tap once to start; allow the microphone | Accurate | `MolnfriSolarLauncher.swift:57-58`; `04-source-snapshot/molnfri/Services/AudioRecorderService.swift:69-103` |
| The timer shows elapsed time | Accurate | `01-current-app-screenshots/02-recording.png`; `MolnfriSolarLauncher.swift:234-243` |
| "The moving gold rays respond to your voice" | **Partly accurate, overstated.** Rays breathe on a fixed 3.2 s cycle and stay visible in silence; voice only slightly lengthens them | `MolnfriSolarLauncher.swift:376-417`; `05-context/DESIGN_SYSTEM.md:81` |
| Tap again to stop; no pause | Accurate. **App problem:** no visible stop cue | `MolnfriSolarLauncher.swift:57-58, 297` |
| Speech becomes text first; Auto then runs the template | Accurate | `04-source-snapshot/molnfri/Services/MolnfriRecordingFlow.swift:227-268` |
| The "Processing" panel shows **27%** under "Speech becomes text first" | **Misleading illustration.** The percentage appears only during template work; transcription has no number | `01-current-app-screenshots/03-processing.png` vs `07-template-processing-progress.png`; `MolnfriSolarLauncher.swift:89-91` |
| The percentage estimates template work and may wait at 95% | Accurate. **App problem:** unlabeled on screen | `MolnfriRecordingFlow.swift:398-414` |
| Keep the app open while it processes | **Partly accurate, incomplete.** Auto-Lock very likely interrupts too (inferred) | `04-source-snapshot/molnfri/MolnfriApp.swift:88-106` |
| Notes and Settings use a separate Stop button | Accurate. **App problem:** two recording UIs | `04-source-snapshot/molnfri/Views/MolnfriRecordingFlowView.swift:32-36`; `04-source-snapshot/molnfri/Views/EntryListView.swift:169-185`; `04-source-snapshot/molnfri/Views/PrivacyView.swift:98-109` |
| Doesn't capture Phone/FaceTime/WhatsApp calls | **Partly accurate, framed as a capability.** A call interruption *ends* the recording. The actual rule is a policy: "Do not record conversations with the student, patient or client" | `MolnfriRecordingFlow.swift:182-187`; `PrivacyView.swift:240` |

- **Avoidable complexity it teaches:** the hidden stop, the unlabeled percentage, keeping the app open, the two Stop styles.
- **Useful distinctions it should keep:** the transcription and template stages, no pause, the microphone permission, and the dictation-only policy.

### Guide 02 — Templates and Auto (`02-current-app-explainers/02-templates-and-auto.png`)

| Claim | Verdict | Evidence |
|---|---|---|
| Tap a name to choose a default; scroll for more | Accurate | `04-source-snapshot/molnfri/Views/MolnfriSolarLauncher.swift:170-190, 211` |
| Auto runs the chosen template on the next recording; picking a name alone doesn't switch Auto on | Accurate. **App problem:** one decision split over two controls | `04-source-snapshot/molnfri/Services/MolnfriRecordingFlow.swift:204-214, 263-268` |
| Auto off: the result starts as the transcript | Accurate | `MolnfriRecordingFlow.swift:267` |
| Raw / "Flow / Free Flow" / Meeting / Pitch definitions | Accurate. **App problem:** two names for Flow; descriptions are VoiceOver-only | `04-source-snapshot/molnfri/Models/MolnfriSummaryTemplate.swift:176-207`; `04-source-snapshot/molnfri/Views/MolnfriTemplateDial.swift:94` |
| Tap Edit to reveal the template chooser | Accurate. **App problem:** a hidden mode | `04-source-snapshot/molnfri/Views/MolnfriRecordingFlowView.swift:43` |
| "Choose another template to process the original transcript again" | **Partly accurate.** If the current text is a raw transcript the user edited, the *edited* text is processed. Edits to an AI result are replaced without warning | `MolnfriRecordingFlow.swift:279-290, 342` |
| Auto creates a draft and doesn't save or approve | Accurate | `MolnfriRecordingFlowView.swift:128-136, 149-192` |
| Output uses the current transcript, not earlier notes | Accurate (prompt-level) | `MolnfriSummaryTemplate.swift:170-171, 203` |

### Guide 03 — Making a template your own (`02-current-app-explainers/03-create-and-edit-templates.png`)

| Claim | Verdict | Evidence |
|---|---|---|
| Settings → Templates | Accurate | `04-source-snapshot/molnfri/Views/PrivacyView.swift:34, 119` |
| Tap a row to edit; scroll to Add template; Raw stays fixed | Accurate | `04-source-snapshot/molnfri/Views/MolnfriTemplateViews.swift:23-36, 57-66, 97` |
| Fill in both languages before saving | Accurate. **App problem:** a heavy requirement for monolingual users | `04-source-snapshot/molnfri/Models/MolnfriSummaryTemplate.swift:145-153, 160` |
| 2–12 named sections in the prompt become the output; otherwise use the fields | Accurate. **App problem:** a silent mode switch | `MolnfriSummaryTemplate.swift:54-84`; `MolnfriTemplateViews.swift:141-177` |
| Save affects future uses only | Accurate | `04-source-snapshot/molnfri/Services/MolnfriRecordingFlow.swift:203-214` |
| Up to 9 templates; move with arrows **or Edit** | Accurate. **App problem:** two reorder mechanisms | `MolnfriSummaryTemplate.swift:216`; `MolnfriTemplateViews.swift:51-55, 72, 85-100` |
| "You can delete custom templates" | **Partly accurate.** It omits how: a swipe left, which is hidden | `MolnfriTemplateViews.swift:43-49` |
| Restore built-ins, then save | Accurate | `MolnfriTemplateViews.swift:179-183, 207-211` |
| The Save callout is drawn as a separate inset | The illustration compensates for the occlusion visible in `01-current-app-screenshots/14-new-template-editor.png` and `15-template-prompt-and-headings.png` | — |

### Guide 04 — Reviewing and finding notes (`02-current-app-explainers/04-review-save-and-find-notes.png`)

| Claim | Verdict | Evidence |
|---|---|---|
| Edit the text | Accurate. It omits that the same Edit also reveals the template chooser | `04-source-snapshot/molnfri/Views/MolnfriStructuredTextEditor.swift:42`; `04-source-snapshot/molnfri/Views/MolnfriRecordingFlowView.swift:43` |
| Listen; Copy puts the visible result on the clipboard | Accurate. The mock shows the transient "Copied" state | `MolnfriStructuredTextEditor.swift:46-65` |
| Save stores note, transcript and recording; approval is separate | Accurate | `MolnfriRecordingFlowView.swift:149-192` |
| Filter by All, Unfiled, folders or template groups; long-press to move; drag | Accurate. **App problem:** hidden gestures; template groups look like folders | `04-source-snapshot/molnfri/Views/EntryListView.swift:23-25, 119-131, 222-284` |
| Newest first by year; each row shows date and template | Accurate. **App problem:** weak identity | `EntryListView.swift:50-52, 472-507` |
| Recording inside a folder saves there | Accurate (a useful distinction) | `EntryListView.swift:183` |
| Deleting removes note, transcript and audio | Accurate. **App problem:** the list deletes without asking | `04-source-snapshot/molnfri/Models/Models.swift:226-262`; `EntryListView.swift:126-130` |
| Add action points with + or the small microphone | Accurate. **App problem:** that mic looks like Record | `MolnfriRecordingFlowView.swift:223-238` |
| Review and approve; edits require re-review | Accurate | `Models.swift:33-40` |
| "Transfer requires an organization connection, which is not configured in this app" | **Misleading by understatement.** No destination exists in this build at all; Transfer always fails | `04-source-snapshot/molnfri/Services/DictationReviewService.swift:122-128` |

### Guide 05 — Settings, local models and recovery (`02-current-app-explainers/05-settings-models-and-recovery.png`)

| Claim | Verdict | Evidence |
|---|---|---|
| One language choice for app and dictation; set it before recording | Accurate. **App problem:** the coupling is visible only to VoiceOver | `04-source-snapshot/molnfri/Models/MolnfriFlowPreferences.swift:33-45`; `04-source-snapshot/molnfri/Views/PrivacyView.swift:187-214` |
| Sky Glass or Dark; text size and Reduce Motion come from iOS | **Partly accurate.** It omits that Dark also changes Home navigation and the recording screen, and that system appearance is ignored | `04-source-snapshot/molnfri/Views/MolnfriLauncherView.swift:41-76`; `04-source-snapshot/molnfri/MolnfriApp.swift:86-87` |
| Two model choices; Swedish-only optional speech models; Gemma download; Apple Intelligence required | Accurate | `PrivacyView.swift:216-470`; `04-source-snapshot/molnfri/Services/MolnfriTranscriptionProvider.swift:40-67` |
| Processing stays on the phone; no account or sync | Accurate | `MolnfriApp.swift:31-32`; `PrivacyView.swift:241` |
| Haptics and Sound | Accurate | `PrivacyView.swift:76-79` |
| Interrupted processing keeps the recording; Retry continues; Original keeps the transcript | Accurate | `04-source-snapshot/molnfri/Services/MolnfriRecordingFlow.swift:158-169, 292-316` |
| The recovery phone mock shows **only Retry** | **Misleading illustration.** The real writing-failure screen (same 22:48 capture) shows **Retry** and **Original** | `03-supplemental-older-captures/08-writing-interrupted.png`; `04-source-snapshot/molnfri/Views/MolnfriRecordingFlowView.swift:55-58` |
| Model changes apply to the next request | Accurate | `04-source-snapshot/molnfri/Services/MolnfriNoteGenerationService.swift:83-85` |
| Download over Wi-Fi | Advice only. **App problem:** the app doesn't check the network | `04-source-snapshot/molnfri/Services/LocalModelStore.swift:256-266` |

### Guide problems vs app problems

**Fix the guides.** These are incorrect or misleading claims:

1. 01 shows "27%" for the transcription step. That is a composite of two states.
2. 01 says the rays "respond to your voice". They mostly breathe on a timer.
3. 01 presents not capturing calls as a technical limit. It should state the policy (dictate your own notes; don't record client conversations) and that a call ends the recording.
4. 02 says the "original transcript" is reprocessed. An edited raw text is used instead, and edits to AI text are replaced.
5. 04's Transfer footnote implies a configuration step exists. No destination is implemented.
6. 05's recovery mock omits **Original**.
7. 05 is silent about Dark changing Home and recording.
8. 03 doesn't say how templates are deleted (swipe).

**Fix the app.** These guide passages are accurate but teach around avoidable complexity:

- The hidden stop and the unlabeled percentage (#2).
- "Keep the app open" (#4).
- The Auto/selection coupling (#11, #5).
- Edit revealing templates (#3).
- Flow/Free Flow (#10).
- The duplicate reorder mechanisms (#6).
- The silent heading mode (#12).
- The both-languages requirement (later).
- Hidden list gestures and folder-looking template groups (#7, #1).
- The Transfer dead end (#9).
- The language coupling (#5 caption).
- Dark's different Home (later).

### How the strongest changes simplify each guide

| Guide | Callouts today | After the first batch (1, 2, 3, 4, 6) | After later batches | What should remain (useful distinctions) |
|---|---|---|---|---|
| 01 Recording | 6 + 3 footer notes | "Tap again to stop" and the percentage callout are no longer needed (on-screen captions). "Keep the app open" shrinks to "Stay in Molnfri until your note opens" | The separate-Stop note disappears once the recording surfaces are unified | Two stages; no pause; microphone permission; dictation-only policy |
| 02 Templates and Auto | 4 steps + 4 definitions + footer | Step 3 ("Tap Edit to reveal…") is replaced by "Tap the template name" | Step 2 and the Auto-off note disappear (#11). The definitions column shrinks to on-screen captions (#5). "Flow / Free Flow" becomes "Flow" (#10) | What a template is; review before Save |
| 03 Templates | 5 steps + 3 footer notes | "or Edit" disappears from the footer (#6) | Step 4's rule becomes visible on screen (#12). Step 2 can go if single-language templates ship | Prompt-as-instruction; heading control; restore defaults |
| 04 Review and find | 9 callouts + footer | Delete becomes safe and the duplicate Edit is gone | The Transfer footnote disappears (#9). Row identity is self-explanatory (#7). Search replaces browsing tips (#15) | Draft vs saved vs approved (managed); folders vs template groups |
| 05 Settings and recovery | 6 callouts + footer | Recovery happens less often (#4) | Recovery steps become on-screen, stage-specific actions (#8). Readiness is shown on Settings (#13). The language caption (#5) | Two model roles; local processing; downloads need internet |

---

## 6. Alternative arrangements and infographic boards

All three arrangements keep the Solar sky, sun, cream reading surfaces and glass controls. The full image-model prompts are in [`INFOGRAPHIC_PROMPTS.md`](INFOGRAPHIC_PROMPTS.md), and rendered HTML versions are in [`proposed-ui.html`](proposed-ui.html). Everything here is a **concept**, not a current screenshot or a verified prototype.

### Arrangement 1 — "Clear Sun" (= the minimum first batch; about 10 % visual change)

- **Home, recording.** Unchanged sun and rays. The header shows `00:05`, with the caption **"Tap the sun to stop"** below it.
- **Home, processing.** The header shows **"Transcribing…"**, then **"About 27%"** over **"Writing Meeting note"**, plus a small text button **"Skip – use transcript"** under the caption.
- **Result sheet.**
  - Title **"Dictation"**, then the serif heading **"Meeting"** with a capsule **"Meeting ⌄"** directly under it, which replaces the plain heading.
  - The card holds **Edit · Listen · Copy**, and **Save** is the circle as today.
  - Editing then choosing a template triggers **"Replace your edits?"**.
- **Notes.** A long-press on a row then **Delete** shows **"Delete note?"**.
- **Saved note.** The toolbar shows **‹** and **🗑** only.

### Arrangement 2 — "One choice, labelled routes" (later; about 20 % visual change)

- **Home menu (open).**
  - Small text labels under the side glyphs read **Notes** and **Settings**, and the Notes glyph becomes a tray.
  - The vertical list is headed **"After recording"**, with **Transcript only · Flow · Meeting · Pitch** and a caption under the selected row.
  - The Auto switch is gone.
- **Notes.**
  - The top-left button reads **"Home ›"**.
  - Rows read `14:05 · Anna – follow-up   Meeting`, with day sub-headers and a search field **"Search notes"**.
  - The template filter shows a tag icon.
- **Settings.** The same circles. Under **Models** it reads **"Apple Intelligence · Ready"**, and under EN/SV **"App and dictation language"**.
- **Dark theme.** The same Home layout in midnight colours.

### Arrangement 3 — "Session card + system surfaces" (later; about 30 %, at the owner's limit)

- **Home after Stop.** The sun eases into a compact **session card** above the dock: **"Writing Meeting note · about 60%"** with **[Skip]**. Notes and Settings remain reachable while processing runs.
- **Lock Screen / Dynamic Island** (Live Activity).
  - Recording: **"Molnfri · Recording 03:12"** with **[Stop]**.
  - Processing: **"Writing Meeting note"** with an estimate.
  - This needs the security review in section 4.
- **Control Center / Action Button.** A **"Record note"** control (App Intent).
- **Result.** The same as Arrangement 1.

### Six boards (prioritized)

| Board | Title | Base screens | Ranked items | Batch |
|---|---|---|---|---|
| 1 | Say what the sun is doing | `01-current-app-screenshots/02-recording.png`, `03-processing.png`, `07-template-processing-progress.png` | #2, #4 | **First** |
| 2 | Change template without Edit | `01-current-app-screenshots/08-result-and-save.png` (+ dial look from `03-supplemental-older-captures/10-result-editing-template-chooser.png`) | #3 (+ #5 captions in the sheet) | **First** |
| 3 | Safe delete, one Edit | `01-current-app-screenshots/10-notes-expanded.png`, `09-saved-summary-and-actions.png`, `15-template-prompt-and-headings.png` | #1, #6 (+ #10 mic label) | **First** |
| 4 | Explain the choice, merge Auto | `01-current-app-screenshots/05-template-choice.png`, `06-auto-enabled.png` | #5, #11 | Second / third |
| 5 | Find the right note | `01-current-app-screenshots/10-notes-expanded.png`, `11-notes-compact.png`, `12-template-folder-meeting.png` | #7, #15 | Second / third |
| 6 | Recover, configure, author | `03-supplemental-older-captures/08-writing-interrupted.png`, `01-current-app-screenshots/13-settings.png`, `15-template-prompt-and-headings.png` | #8, #13, #12 (+ #9, #14 as notes) | Second / third |

---

## 7. Validation plan, uncertainties and evidence gaps

### Brief validation plan

1. **Device checks** (no users needed; on a test device the team controls):
   - With Auto-Lock at 30 s, record 5 and 10 minutes with Apple and with Gemma, put the phone down, and confirm the interruption today and its absence after #4.
   - Run the new captions at AX5 Dynamic Type, with VoiceOver reading order, Reduce Motion and Increase Contrast, in English and Swedish.
   - Confirm the lock-screen language for an English UI (#14).
2. **Moderated task walkthrough.** 6–8 career coaches, mixed Swedish and English, on their own phones, about 45 minutes, current build first and then the HTML/clickable concept. Tasks:
   1. Record and stop a 1-minute note (first time).
   2. Get a Meeting summary with Auto off.
   3. Correct a name, then switch to Pitch.
   4. Find "yesterday's 14:00 client" among six same-day notes.
   5. Recover from a forced interruption.
   6. Create an English-only template with your own headings.
   7. Delete a note from the list and change your mind.

   Measure success, time, errors and wrong turns, and ask for confidence ratings.
3. **5-second comprehension tests** on the Home menu and the result sheet, current vs proposed: "What will happen after you record?" and "How do you change the template?"
4. **Opt-in, on-device counters** (privacy-preserving, no content). Count:
   - interruptions per processing run;
   - Edit-then-template sequences;
   - list deletes followed by re-recording;
   - Auto usage;
   - searches (once #15 exists).

### Uncertainties that need a walkthrough or research

- Whether people find the stop gesture unaided today, and whether a caption or a one-time tip is enough.
- How users read "27%", and whether "About" plus the stage label prevents waiting at 95%.
- How many notes coaches make per day and how they recall them (time, client name, topic). This decides title vs preview text in #7.
- Whether an explicit AI opt-in ("Auto") matters to users' sense of control (#11).
- How often processing is interrupted in real use: Auto-Lock, app switching, calls.
- The Swedish wording of the new labels, and whether "Transcript" or "Original" is the better concept word.
- Whether personal users want "Review/Approve" at all, and what managed deployments need from Transfer.
- How common bilingual sessions are (the language coupling).
- How usable the circular Settings is with VoiceOver and Switch Control on a real device.

### Evidence gaps caused by the compact selection

- No physical-device or landscape capture. Landscape and device behaviour are unvalidated, although source has landscape branches (`04-source-snapshot/molnfri/Views/MolnfriSolarLauncher.swift:10-22, 51-76`).
- No dark Settings, large-text Settings, or transcription-failure capture. The transcription-failure branch is described from source only (`04-source-snapshot/molnfri/Views/MolnfriRecordingFlowView.swift:50-58`).
- `03-supplemental-older-captures/03-dark-home.png` is older and cannot prove the current Dark Home, though the source still renders that layout (`04-source-snapshot/molnfri/Views/MolnfriLauncherView.swift:48-76`).
- The pack has no captures of these screens, so they are judged from source alone:
  - lock screen, first-run language picker, current Notes folder chooser;
  - expanded Review, Transfer preview, exit dialog;
  - permission denial, list context menu, empty Notes;
  - current Templates list, current model settings and the AI-model picker;
  - Dark recording sheet;
  - saved raw note (**Template** button);
  - the top of a saved note (title, date, Listen). Capture 09 is scrolled past them.
- Synthetic QA text means no judgement of transcription or model quality, speed or reliability. The timing constants are user-reported calibrations (`05-context/QA-2026-10-19-Refinement-3.md:13`).
- `01-current-app-screenshots/12-template-folder-meeting.png` uses a different data set from 10/11 (a single 21 October note vs seeded December fixtures; `04-source-snapshot/molnfri/Models/Models.swift:299-323`), so it cannot test filter correctness.

---

## Appendix A — Version differences

| Topic | Capture | Source snapshot | Note |
|---|---|---|---|
| Template editor footer | `01-current-app-screenshots/15-template-prompt-and-headings.png`: "Edit both languages before saving. Section order is shared between languages." | `04-source-snapshot/molnfri/Views/MolnfriTemplateViews.swift:128`: "Provide template text in both languages. Named sections in the prompt set the output headings; otherwise use the fields below." (new key at `Localizable.xcstrings:4`; old key still at `:1237`) | The working tree is newer than the capture |
| Result actions | `03-supplemental-older-captures/10-result-editing-template-chooser.png`: **Klar · Lyssna · Auto** | **Edit/Done · Listen · Copy** (`04-source-snapshot/molnfri/Views/MolnfriStructuredTextEditor.swift:41-53`); "result actions no longer include Auto" (`05-context/DESIGN_SYSTEM.md:93`) | The current capture `08-result-and-save.png` matches the source |
| Note rows | `03-supplemental-older-captures/02-folder-chooser.png`: date, time and preview | Date + template only (`04-source-snapshot/molnfri/Views/EntryListView.swift:472-507`) | A deliberate 21 October change (`05-context/QA-2026-10-21-Minimal-Notes.md:8`) |
| Dark Home | `03-supplemental-older-captures/03-dark-home.png`: side buttons, no menu | The same structure still exists for Dark (`04-source-snapshot/molnfri/Views/MolnfriLauncherView.swift:48-76`) | The current appearance is unverified |
| Large-text capture label | Index says "Template library with large text" | The image shows the dictation result's **Byt mall** chooser and full-width **Spara** at large text | `EVIDENCE_INDEX.csv:19` description vs `03-supplemental-older-captures/06-templates-large-text.png` |
| Engine label | `03-supplemental-older-captures/09-transcription-model-settings-swedish.png`: "Tillgänglig talmotor: DictationTranscriber" | Still shows `route.engine.rawValue` (`04-source-snapshot/molnfri/Views/PrivacyView.swift:309-311`) | Unchanged |

## Appendix B — Where behaviour lives in the source

All paths are under `04-source-snapshot/molnfri/`.

| Behaviour | Location |
|---|---|
| Home (Sky vs Dark), swipes, Notes overlay, result presentation | `Views/MolnfriLauncherView.swift:28-224` |
| Sun, menu, captions, progress, rays | `Views/MolnfriSolarLauncher.swift:35-439` |
| Flow phases, Auto snapshot, choose/useRaw/retry, interruption, estimate | `Services/MolnfriRecordingFlow.swift:8-421` |
| Result sheet, exit dialog, template chooser, save | `Views/MolnfriRecordingFlowView.swift:5-192` |
| Edit/Listen/Copy; Auto controls in Settings → Templates | `Views/MolnfriStructuredTextEditor.swift:5-129` |
| Template list and editor; prompt-heading preview | `Views/MolnfriTemplateViews.swift:4-239` |
| Template model, defaults, heading parser, validation, store | `Models/MolnfriSummaryTemplate.swift:5-334` |
| Notes list, folders, template filters, row content, delete | `Views/EntryListView.swift:4-507` |
| Saved note, delete confirmation, the "Template" button for raw notes | `Views/EntryDetailView.swift:4-160` |
| Review, approve, transfer | `Views/DictationReviewControls.swift`; `Services/DictationReviewService.swift` |
| Settings, models, privacy | `Views/PrivacyView.swift:4-649` |
| Lock, background cancellation | `Services/AppAccessController.swift`; `MolnfriApp.swift:86-119` |
| Recovery journal, retention | `Services/AudioLifecycleService.swift` |
