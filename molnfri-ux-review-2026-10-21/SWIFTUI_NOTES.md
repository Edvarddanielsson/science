# Molnfri — SwiftUI / UIKit notes for the proposed UI

These are sketches that map each proposed screen in [`proposed-ui.html`](proposed-ui.html) to the existing code and to platform APIs. The current stack is Swift 6, SwiftUI with some UIKit, Xcode 26, iOS 26, SwiftData, SpeechAnalyzer and FoundationModels.

- These are **not** tested patches. Check signatures against the iOS 26 SDK before use.
- Paths are under `molnfri-review-kit/04-source-snapshot/molnfri/`.
- Item numbers (#) refer to [`REVIEW.md`](REVIEW.md#2-ranked-improvements).

---

## First batch

### #2 Home: stage caption, stop cue, skip — `Views/MolnfriSolarLauncher.swift:64-98`

```swift
} else if presentation == .recording, let recorder = flow?.recorder {
    VStack(spacing: 6) {
        MolnfriSolarElapsed(recorder: recorder)
        Text("Tap the sun to stop").font(.footnote)          // new string
    }
    .position(x: layout.headerX, y: layout.headerY(topInset: geometry.safeAreaInsets.top))
} else if presentation == .transcribing, let flow {
    VStack(spacing: 6) {
        Text(transcribingTitle(flow.speech.state)).font(.title2.weight(.medium))
        Text("Stay in Molnfri · screen stays on").font(.footnote)
    }
    .position(…)
} else if presentation == .applyingTemplate, let flow {
    VStack(spacing: 6) {
        MolnfriSolarProgress(flow: flow, active: active)      // render "About \(p)%"
        Text("Writing \(flow.selected?.name ?? "") note").font(.footnote)
        Button("Skip – use transcript") { flow.useRaw() }      // existing API, MolnfriRecordingFlow.swift:292-305
            .buttonStyle(.borderless)
            .font(.subheadline.weight(.semibold))
    }
    .position(…)
}

private func transcribingTitle(_ state: TranscriptionState) -> LocalizedStringKey {
    if case let .downloadingAssets(fraction?) = state {     // TranscriptionService.swift:148-155
        return "Downloading speech model \(Int(fraction * 100))%"
    }
    return "Transcribing…"
}
```

- `useRaw()` already invalidates the summary revision. A cancelled model task therefore cannot turn the result into a failure (`MolnfriRecordingFlow.swift:292-305, 362-366`).
- The Reduce Motion status line (`MolnfriSolarLauncher.swift:93-98`) becomes redundant once this ships.

### #4 Keep the screen awake while processing (UIKit)

There are two options. The second is the more robust.

**Option 1 — in the launcher.** The Notes and Settings sheets need the same modifier in `MolnfriRecordingFlowView`.

```swift
.onChange(of: presentation.isProcessing, initial: true) { _, busy in
    UIApplication.shared.isIdleTimerDisabled = busy
}
.onDisappear { UIApplication.shared.isIdleTimerDisabled = false }
```

**Option 2 — in `MolnfriRecordingFlow`.** It is already `@MainActor`. Set the flag in `beginTranscription()` and `beginSummaryIfReady()`, and clear it in `fail`, `cancel`, `useRaw` and wherever `phase = .ready`.

### #3 Result: visible template control + edit protection — `Views/MolnfriRecordingFlowView.swift:37-48, 138-147`

```swift
@State private var choosingTemplate = false
@State private var pendingTemplate: MolnfriSummaryTemplate?

Button { choosingTemplate = true } label: {
    HStack(spacing: 6) {
        Text(flow.usesAIOutput ? (flow.outputTemplate?.name ?? "") : String(localized: "Transcript"))
            .font(MolnfriType.heading)
        Image(systemName: "chevron.down").font(.subheadline.weight(.semibold))
    }
}
.buttonStyle(.glass)
.accessibilityLabel("Template")
.sheet(isPresented: $choosingTemplate) {
    TemplateChooserSheet(templates: templates, language: flow.language) { template in
        if flow.output != flow.lastGeneratedOutput { pendingTemplate = template }  // edited → ask
        else { flow.choose(template.snapshot(language: flow.language), builtInKey: template.builtInKey) }
    }
    .presentationDetents([.medium, .large])
}
.alert("Replace your edits?", isPresented: .constant(pendingTemplate != nil), presenting: pendingTemplate) { t in
    Button("Replace", role: .destructive) {
        flow.choose(t.snapshot(language: flow.language), builtInKey: t.builtInKey); pendingTemplate = nil
    }
    Button("Cancel", role: .cancel) { pendingTemplate = nil }
} message: { t in
    Text("A new \(t.snapshot(language: flow.language).name) note replaces the text you changed.")
}
```

- Add `private(set) var lastGeneratedOutput = ""` to `MolnfriRecordingFlow`. Set it wherever `output` is assigned from transcription, summary or `useRaw` (`MolnfriRecordingFlow.swift:257, 299, 323, 352`).
- `TemplateChooserSheet` reuses the existing `MolnfriTemplateDial` rows and adds the one-line captions (#5) plus a final "New template…" row. That row replaces the edit-only toolbar **+** at `:82-89`.
- Remove `if editingResult { templateChooser }` (`:43`). **Edit** now only toggles text editing.

### #1 Confirm deletion from the list — `Views/EntryListView.swift:119-131, 357-363`

```swift
@State private var pendingDelete: MolnfriEntry?

.contextMenu {
    Menu("Flytta") { … }
    Button(role: .destructive) { pendingDelete = entry } label: { Label("Delete Note", systemImage: "trash") }
}

.alert("Delete note?",
       isPresented: Binding(get: { pendingDelete != nil }, set: { if !$0 { pendingDelete = nil } }),
       presenting: pendingDelete) { entry in
    Button("Delete", role: .destructive) { deleteEntry(entry) }
    Button("Cancel", role: .cancel) {}
} message: { _ in
    Text("This removes the note, its transcript and the recording from this iPhone. This can't be undone.")
}
```

Use the same title and message in `EntryDetailView.swift:132-139`.

### #6 Remove inert or duplicate Edit buttons

- **Note toolbar** (`Views/EntryDetailView.swift:122-130`): `if entry.note != nil { EditButton() }`. Only legacy action lists use edit mode (`Views/ActionPlanEditorView.swift:35`).
- **Template editor** (`Views/MolnfriTemplateViews.swift:195`): delete `ToolbarItem(placement: .primaryAction) { EditButton() }`. The arrows at `:153-161` remain the reorder control.
- **Templates list** (`Views/MolnfriTemplateViews.swift:72`): replace `EditButton()` with a labelled toggle.

```swift
@State private var editMode: EditMode = .inactive
.environment(\.editMode, $editMode)
.toolbar {
    Button(editMode.isEditing ? "Done" : "Reorder") {
        withAnimation { editMode = editMode.isEditing ? .inactive : .active }
    }
}
```

---

## Later batches

### #5 One-line captions

Captions show under the selected template only (`Views/MolnfriSolarLauncher.swift:209-231`) and in the chooser sheet. Translated strings already exist for the current VoiceOver hints:

- "Exact original text, without AI."
- "Corrects language without summarizing."
- "Processes text using the template."

These live in `Localizable.xcstrings`. The shorter proposed copy ("Exact transcript · no AI", …) needs new keys. For custom templates, show the effective headings: `template.snapshot(language:).sections.map(\.heading).joined(separator: " · ")`.

### #11 One "After recording" choice

- **Flow.** In `MolnfriRecordingFlow.configureAutomaticTemplate` (`:204-214`), drop the `autoKey` check and always snapshot `MolnfriFlowPreferences.defaultTemplate`. Raw is already handled as the plain transcript (`:320-329`).
- **Migration.** Run once inside `MolnfriTemplateStore.seed`, which has the model context:
  - If Auto was off, set `templateKey` to Raw's UUID.
  - Set a `molnfriAutoMergedV1` flag so it doesn't run again.
- **UI.** In Settings → Templates, `MolnfriAutoTemplateControls` (`Views/MolnfriStructuredTextEditor.swift:87-129`) becomes a single `Picker("After recording", selection:)`.

### #7 Identifiable rows and day groups — `Views/EntryListView.swift:472-507`

```swift
HStack(spacing: 12) {
    Text(entry.date, format: .dateTime.hour().minute())
        .monospacedDigit()
        .foregroundStyle(MolnfriTheme.tealText)
    Text(entry.listTitle).lineLimit(1)                    // title, else first words, else "Untitled"
    Spacer(minLength: 8)
    if let templateName { Text(templateName).foregroundStyle(MolnfriTheme.muted) }
}
```

- Group rows by `Calendar.current.startOfDay(for:)`. Use `isDateInToday` and `isDateInYesterday` for the "Today" and "Yesterday" headers.
- Showing a duration would need a new stored field, because `MolnfriEntry` has none (`Models/Models.swift:5-27`).
- Template filters: use `Image(systemName: "tag")` in the pill and the rows (`:224, 284`).

### #15 Search

```swift
@State private var query = ""
.searchable(text: $query, placement: .navigationBarDrawer(displayMode: .always), prompt: "Search notes")

private var visibleEntries: [MolnfriEntry] {
    let base = /* existing folder/template filtering */
    guard !query.isEmpty else { return base }
    return base.filter {
        $0.title.localizedStandardContains(query)
            || $0.transcript.localizedStandardContains(query)
            || ($0.summaryText?.localizedStandardContains(query) ?? false)
    }
}
```

Do not donate notes to Core Spotlight; the content is sensitive.

### #8 Stage-specific recovery — `Views/MolnfriRecordingFlowView.swift:49-66`

- Branch on `flow.transcriptionFinished` (writing failure) vs `flow.recorder.audioURL != nil` (transcription failure) vs neither (recording failure).
- Permission denial:
  ```swift
  @Environment(\.openURL) var openURL
  openURL(URL(string: UIApplication.openSettingsURLString)!)
  ```
- "Try with Apple Intelligence" needs a one-request provider override. `MolnfriNoteGenerationService(preference: { .appleOnDevice })` already supports injecting a preference (`Services/MolnfriNoteGenerationService.swift:71-79`).
- Raw-note button (`Views/EntryDetailView.swift:84-91`): label it `entry.transcript.isEmpty ? "Transcribe" : "Apply template…"`.

### #9 Transfer only when configured — `Views/DictationReviewControls.swift`

Wrap the Approve, Transfer and retention UI in `if DeploymentConfiguration.current() != nil`. Otherwise show a single `Button(entry.isReviewed ? "Checked ✓" : "Mark as checked")`, which reuses `DictationReviewService.approve`.

### #13 Settings readiness (FoundationModels + Network)

```swift
import FoundationModels
var writingStatus: LocalizedStringKey {
    switch SystemLanguageModel.default.availability {
    case .available: "Apple Intelligence · Ready"
    case .unavailable(.appleIntelligenceNotEnabled): "Turn on Apple Intelligence"
    case .unavailable(.modelNotReady): "Apple Intelligence · Preparing"
    case .unavailable(.deviceNotEligible): "Not available on this iPhone"
    @unknown default: "Unavailable"
    }
}
```

- This is the same API the app calls at generation time (`Services/MolnfriSummarisationProvider.swift:104-107`).
- Before downloads larger than 100 MB, check `NWPathMonitor().currentPath.isExpensive` and confirm with "Download 2.6 GB using mobile data?". `LocalModelStore.swift:256-266` doesn't restrict cellular today.

### #12 Template editor — `Views/MolnfriTemplateViews.swift:141-206`

- Replace the `safeAreaBar` circle with `ToolbarItem(placement: .confirmationAction) { Button("Save") { … } }`.
- Under the Prompt section, add:
  ```swift
  Text("Headings from your prompt: \(headings.joined(separator: " · "))")
  ```
  When `MolnfriPromptHeadings.parse` returns nil, show `Text("Custom headings (\(draft.sections.count))")` instead.

### #14 Localization

- Add English entries for the Swedish-only keys (lock screen, review, transfer, playback).
- Use `String(localized:)` for the `String`-typed messages in `Services/AppAccessController.swift:30, 99, 106, 118, 123`.
- Localize the recovered-note title at display time rather than storing "Återställt diktat".

---

## Complementing frameworks (concepts; rows 7–8 of the canvas)

| Concept | Framework / API | Minimum OS | Caveat |
|---|---|---|---|
| Recording and processing on the Lock Screen and in the Dynamic Island | ActivityKit: `ActivityAttributes`, `Activity.request(attributes:content:)`, `ActivityConfiguration` with `DynamicIsland { … } compactLeading: … compactTrailing: …`; timer via `Text(timerInterval:countsDown:)`; Stop via `Button(intent:)` with a `LiveActivityIntent` | iOS 16.2 (interactive buttons iOS 17) | Show no note text. The app's own lock does not cover the Lock Screen. Needs a widget extension and `NSSupportsLiveActivities` |
| "Record note" in Control Center or on the Action Button | WidgetKit `ControlWidget` + `ControlWidgetButton(action:)` with an `AppIntent` that has `openAppWhenRun = true`; `AppShortcutsProvider` for Siri and Shortcuts | iOS 18 (controls), iOS 16 (App Shortcuts) | Recording starts only after the in-app unlock (`AppAccessController.requireUnlocked`). Route the intent to a pending-start flag |
| One-time "Tap the sun to stop" | TipKit: a `Tip` with `.popoverTip(_:arrowEdge:)`, `Tips.configure()` at launch, with a display-count or event rule | iOS 17 | An alternative to a permanent caption (#2); research decides |
| Processing continues after switching apps | BackgroundTasks `BGContinuedProcessingTask` / `BGContinuedProcessingTaskRequest` with a system progress UI | iOS 26 | Today the app cancels on background by design (`MolnfriApp.swift:88-106`). Protected files and the app lock make this a security decision first. Confirm whether on-device inference is permitted in that context |
| Live transcript while recording | Speech `SpeechAnalyzer` + `SpeechTranscriber(… reportingOptions: [.volatileResults] …)` fed from `AVAudioEngine` | iOS 26 | Battery, thermal and on-screen privacy. Today the app records to a file (`AVAudioRecorder`) and transcribes after Stop |
| Suggested note title at Save | FoundationModels: `LanguageModelSession` with a short guided prompt | iOS 26 + Apple Intelligence | Optional for #7. The user stays in control of the final title |
