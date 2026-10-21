# Molnfri — independent UX review (21 October 2026)

This is an independent review of the Molnfri iOS app. It is based only on the compact evidence pack prepared on 21 October 2026: current and older captures, five AI-generated explainers, a 39-file source snapshot and four context documents.

No app, device, data or deployment was changed. No live walkthrough, user research or measurement was done.

| File | What it is |
|---|---|
| [`REVIEW.md`](REVIEW.md) | The review: diagnosis, 15 ranked improvements with evidence, scoring method and first batch, what to preserve and defer, all five explainers checked, three alternative arrangements, validation plan, evidence gaps, version differences |
| [`INFOGRAPHIC_PROMPTS.md`](INFOGRAPHIC_PROMPTS.md) | Visual-first prompts for an image model with the real screens attached: a shared style block, three arrangements and six prioritized widescreen boards |
| [`proposed-ui.html`](proposed-ui.html) | A standalone page of 25 proposed screens drawn in the app's own Solar style. It has an annotation toggle and notes per board. Open it in any browser |
| [`SWIFTUI_NOTES.md`](SWIFTUI_NOTES.md) | How each proposal maps to the existing Swift files and to SwiftUI/UIKit APIs, plus complementing frameworks (ActivityKit, WidgetKit controls, App Intents, TipKit, BackgroundTasks) |
| [`priority-scores.csv`](priority-scores.csv) | Scoring inputs (benefit, effort, risk, confidence) for all 22 scored candidates |

**Minimum first batch** (ranks 1, 2, 3, 4 and 6):

1. Confirm note deletion from the list.
2. Show what the Home sun is doing, with a stop cue and **Skip – use transcript**.
3. Add a visible template control on the result, and confirm before replacing edits.
4. Keep the screen awake while processing.
5. Remove the inert **Edit** buttons.

Citations use paths relative to the evidence pack root (`molnfri-review-kit/`), with source line numbers. The evidence pack itself is not included in this repository.
