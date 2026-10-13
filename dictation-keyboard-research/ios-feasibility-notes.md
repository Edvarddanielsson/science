# Can an on-device Swedish voice keyboard work on iPhone?

Research notes behind the 2-minute follow-up video (October 2026). The question: can the Molnfri stack (Klang Pianissimo for Swedish ASR, Gemma 4 E2B for cleanup, both on the phone) sit behind a system-wide keyboard the way Wispr Flow does? And how do competitors already do this locally?

## Verdict

**Yes, and it's a proven pattern.** At least eight shipping or open-source iPhone keyboards transcribe on the device: Sayboard, KeySay, Yaps, Diction, Muesli, Wave, Outspoken and Vozzy. They all use the same design, because iOS allows only one: a thin keyboard, plus the main app, which records and runs the models in the background.

You pay three prices for it, and none of them is a blocker:

1. **The bounce.** Starting a listening session means opening your own app for a moment. Since iOS 26.4 there's no public way back to the app the user came from.
2. **No GPU in the background.** Inference has to run on the CPU or the Neural Engine. Apple's iOS 27 rules for background Neural Engine work are unclear.
3. **Memory and latency.** Pianissimo plus Gemma is about 1.3 GB, held by a background app. A full Gemma rewrite on the CPU takes seconds, not milliseconds.

What's left for you is the part nobody has built: Swedish quality. None of the local rivals targets Swedish, and Apple's newest speech and dictation features skip it.

## Constraint by constraint

### 1. The keyboard can't record, and it can't hold the models

- Apple's custom-keyboard rules have said since iOS 8 that keyboards get no microphone. Every local app I checked records in the containing app instead: Sayboard, Muesli ("The keyboard extension does not record audio directly"), Wave, Blitztext, KeySay ("iOS doesn't let keyboards use the microphone, so the KeySay app does the listening") and the KeyboardKit SDK. One vendor blog, Yaps, says a keyboard with Full Access "can record audio", but Yaps itself still opens its app to start a session. Design for the app owning the mic.
- Keyboard extensions get jetsammed somewhere between about 30 and 70 MB. Neither Pianissimo (about 650 MB as CoreML int8) nor Gemma 4 E2B (607 MB peak on CPU) fits. The models live in the app.
- The two processes talk through an App Group plus Darwin notifications, and the keyboard calls `textDocumentProxy.insertText`. That needs Full Access. Sayboard's `TranscriptionBridge` and Muesli's request/result files are both public examples.
- App Store guideline 4.4.1 says a keyboard must "remain functional without full network access and without requiring full access". So ship a real QWERTY layout that works without Full Access, and treat dictation as the extra.

### 2. The bounce, and getting back

- The keyboard opens the app through a URL scheme. On iOS 18 the old responder-chain `openURL:` trick broke. SwiftUI's `openURL` environment action works, and Sayboard bridges it for exactly this reason. Apple DTS calls the responder-chain approach unsupported.
- **Returning to the host app has no public API.** Apps used to read the host bundle ID through private keyboard internals (`_hostBundleID`, `PKService` plus `xpc_connection_copy_bundle_id`), then reopen that app through `LSApplicationWorkspace`. Sayboard's source does exactly this, with the class and selector names built from byte arrays "so that strings/otool binary scans find nothing recognisable".
- **iOS 26.4 broke that path** (KeyboardKit, FB22247647). Sayboard now shows a swipe-back hint and raised its default session length from 5 to 30 minutes, "since each dictation needs a manual swipe back". KeyboardKit 10.9 (August 2026) and its 11.0 `KeyboardKitHostPlugin` ship a new resolver that relies on "sensitive system APIs", isolated in an opt-in plugin. Diction returns cleanly on 26.5, by a mechanism it hasn't disclosed.
- **Mitigation every competitor uses:** keep the session alive. After one bounce, the app keeps an audio session running in the background (`UIBackgroundModes: audio`), and later dictations start from the keyboard with no bounce. KeyboardKit calls this "in-keyboard dictation". Sayboard calls it a session, defaulting to 30 minutes on iOS 26.4 and later. Yaps describes "a listening session".
- **Cost to plan for:** while a session is alive the mic input is running, so the orange indicator stays on. Sayboard has an FAQ entry about it. For work users, explain it up front, and let them end a session from the keyboard.
- **Other entry points:** App Intents (Action Button, Control Center, Back Tap, Siri). Monologue uses the Action Button. These still bring the app forward, because `AudioRecordingIntent` can't cold-start a recording from the background (Apple forum 815725).
- **Review risk:** App Review accepts opening your own app, and Wispr Flow, Willow, Aqua, Yaps, KeySay and Sayboard all ship it. Using private APIs to return to the host violates guideline 2.5.1, so keep it out of v1. Use the system "◀ Back" chip and a clear hint. Write a background-audio justification note for review (KeyboardKit publishes a template).

### 3. Background compute: CPU or Neural Engine, never GPU

- Metal command buffers aren't allowed in the background (Apple, "Preparing your Metal app to run in the background"). On iOS 26.2, in-flight work is aborted. whisper.cpp crashed until a ggml fix landed (llama.cpp PR #20306).
- Sayboard's LLM loader: `modelParams.n_gpu_layers = 0 // CPU-only: Metal GPU blocked when app is backgrounded`. It caps threads at `min(cores − 1, 4)`.
- The continued-processing GPU entitlement exists only on iPad with M3 or later (Apple DTS, forum 801229).
- **The Neural Engine is the escape hatch.** FluidAudio (Parakeet, VAD, diarization) says its models are "optimized for background processing … running inference on the ANE … avoiding GPU/MPS entirely". Pianissimo's CoreML build should get the same treatment: set `computeUnits = .cpuAndNeuralEngine`, never `.all`.
- **iOS 27 uncertainty:** Apple's docs describe a `continued-processing.inference` entitlement for background ANE use, but joeblau/voice PR #101 found it isn't in the iOS 27.2 SDK. They shipped CPU and ANE with no entitlement and kept the audio session alive. How a locked iPhone behaves is still unmeasured. This is the first thing to test.

### 4. Memory

- Pianissimo CoreML is about 650 MB and Gemma 4 E2B on LiteRT-LM's CPU backend peaks at 607 MB. Together that's about 1.3 GB resident in a background app.
- iOS publishes no background memory limit. Jetsam kills the largest background apps first, and Apple's advice for apps going to the background is under 50 MB. Your app gets killed when the user opens Camera or a heavy game. Sayboard checks `os_proc_available_memory()` before loading an LLM. It writes a heartbeat to the App Group so the keyboard can detect a killed app and skip a 5-second timeout.
- Options:
  - Keep ASR resident and load the LLM lazily.
  - Fall back to the raw transcript if the LLM isn't loaded.
  - Try CoreML on the ANE for the LLM. One iPhone 17 Pro benchmark ran Qwen 3.5 2B in 241 MB on the ANE at 28 tok/s, and Gemma 4 E2B in 1.19 GB at 33 tok/s.
  - Offer Apple Foundation Models as the cleanup engine. It runs in a system service, not in your app's memory. It supports Swedish, needs an iPhone 15 Pro or later, and is rate-limited when called from the background (`rateLimited` "only happen if your app is running in the background").
- Downloads: Gemma 4 E2B is 2.58 GB on disk. Put the download in onboarding, on Wi-Fi.

### 5. Latency: what a 30-second Swedish note costs

Rough budget on an iPhone 17 Pro, using Google's published LiteRT-LM numbers:

- **Size:** a 30-second note is about 75 words. That's about 130 output tokens, with a ~300-token prompt.
- **CPU, the background case:** prefill at 532 tok/s takes ≈ 0.6 s, and decode at 25 tok/s takes ≈ 5 s. **About 5–6 s in total**, and older phones are slower.
- **GPU, foreground only:** 2,878 tok/s prefill and 56.5 tok/s decode, so ≈ 2.5 s. But the app isn't in the foreground while the user dictates.
- **What makes it feel instant:**
  1. Stream tokens into the field. The first words land in under a second, and 25 tok/s is faster than anyone reads.
  2. Clean each finished sentence while the user is still talking. When they stop, only the last sentence is left, which is about 1 s.
  3. Skip the LLM for short utterances that only need punctuation, and handle fillers with rules.
  4. Benchmark Pianissimo's segment output against a small ANE model and Apple Foundation Models.

### 6. Swedish quality: the gap

- **Parakeet TDT 0.6B v3**, the default "local" model at Yaps, Sayboard, Diction, Spokenly, VoiceInk and Outspoken, reports **15.08% WER on FLEURS Swedish** (20.16% on CoVoST). Danish is 18.41%.
- **Pianissimo** reports a **4.5% mean WER** on Klang's Swedish evaluation, against 5.8% for KB-Whisper small and 3.5% for KB-Whisper large. These are different test sets, so the comparison is directional, but the gap is large.
- **Apple:**
  - SpeechAnalyzer's `SpeechTranscriber` doesn't list Swedish. `DictationTranscriber` is the fallback.
  - Apple's dictation adds no automatic punctuation in Swedish.
  - iOS 27 Advanced Dictation is English-only.
- **Cleanup models:** Sayboard's own descriptions call Qwen 3 0.6B "basic quality" and SmolLM2 "English-focused". Gemma 4 E2B and Apple's model both handle Swedish.

## How competitors do it locally

| App | Speech-to-text on device | Cleanup on device | Notable mechanics |
|---|---|---|---|
| Sayboard (open source) | WhisperKit, Moonshine, Parakeet via FluidAudio | llama.cpp: Qwen 3 0.6B/1.7B, Gemma 3 1B, Llama 3.2 1B, SmolLM2 1.7B (551 MB–2.1 GB), CPU only | Background audio session, Darwin notifications, private-API host return (broken on 26.4), 5–30 min sessions, memory check before load |
| KeySay | Whisper | Apple Foundation Models ("Apple Intelligence") | App records, keyboard inserts. Voice-only or QWERTY layout. Pay once |
| Yaps | Parakeet TDT 0.6B via sherpa-onnx | On device ("Voice Cleanup") | "Opens briefly to start a listening session". 26 typing languages |
| Diction | Whisper Base/Small/Turbo, Parakeet v2/v3 | On device or self-hosted | Own keyboard and autocorrect. Clean host return on 26.5 (undisclosed) |
| Muesli (open source) | FluidAudio CoreML on the ANE | Optional cloud summaries | Request/result files in the App Group, deep link, polling. "Keyboard Session Mode" |
| Wave (open source) | WhisperKit | Filler removal | Opens the app, then the user returns by hand |
| Outspoken | Apple Speech, Parakeet v3, Whisper v3 Turbo | Apple Intelligence or Qwen 3 | Lets the user choose the engine |
| Vozzy | Apple SpeechAnalyzer | Apple Foundation Models | Documented the iOS 26.4 host-return breakage on Apple's forums |

The common pattern: the app owns the mic and the models, sessions are kept alive with background audio, inference avoids the GPU, cleanup uses a 0.6–2B model or Apple's model, and the keyboard is a full keyboard with a mic button.

## Recommended architecture

1. **Keyboard extension (≤ 40 MB).**
   - Full Swedish QWERTY that works without Full Access.
   - Mic button, live transcript strip and session indicator.
   - Inserts streamed text through `textDocumentProxy`.
2. **Containing app.**
   - Background audio session, plus Pianissimo on `.cpuAndNeuralEngine` with VAD.
   - Sentence-level cleanup queue on Gemma 4 E2B (CPU), with Apple Foundation Models as an option where it's available.
   - Raw-transcript fallback if the LLM is missing or slow.
3. **Bridge.** App Group files plus Darwin notifications, a heartbeat, and a session token.
4. **Entry points.**
   - Keyboard mic, which bounces once per session.
   - Action Button and Control Center App Intents.
   - The "◀ Back" chip, with a one-time hint.
5. **Privacy copy.** Explain Full Access and the orange dot in plain Swedish, and add an "end session" button in the keyboard.

## Prototype gates (pass/fail before building the product)

1. **Session survival.** 20 dictations over 30 minutes across Instagram, Safari and Camera without the app being killed, on iOS 26.4+ and 27.
2. **Background ASR.** Pianissimo with the screen locked, on iOS 27, at a real-time factor under 0.3.
3. **Cleanup latency.** First words under 1 s, and the last sentence polished within 2 s of the user stopping, on an iPhone 15 Pro and a 17 Pro.
4. **Memory.** Peak under 1.5 GB, no jetsam in 50 dictations, and the keyboard recovers through the heartbeat.
5. **Cleanup quality.** Gemma 4 E2B against Apple Foundation Models on 100 real Swedish work notes (edit rate, invented words). Also test the rate limit from the background.
6. **Review.** A TestFlight external review build with the background-audio note and a keyboard that works without Full Access.

## Sources

- App Store Review Guidelines 4.4.1 and 2.5.1: https://developer.apple.com/app-store/review/guidelines/
- Sayboard source (host detection, `HostAppOpener`, `LLMInferenceService`, `OperatingSystem.isHostBundleIdBroken`, `SharedSettings`): https://github.com/guguguyml/sayboard
- Sayboard FAQ (model sizes, the app switch, the orange dot): https://sayboard.app/
- KeyboardKit, the iOS 26.4 host application bug: https://keyboardkit.com/blog/2026/03/02/ios-26-4-host-application-bundle-id-bug
- KeyboardKit 10.2 in-keyboard dictation: https://danielsaidi.com/blog/2026/01/09/keyboardkit-10-2
- KeyboardKit 10.9 and 11: https://keyboardkit.com/blog/2026/08/27/keyboardkit-10-9 and https://keyboardkit.com/blog/2026/10/01/keyboardkit-11-is-out
- KeyboardKit dictation docs (background audio, review note): https://docs.keyboardkit.com/documentation/keyboardkit/developer-dictation/
- Diction (on-device models, host return question): https://diction.one/ and https://github.com/DictionLabs/Diction/discussions/17
- Muesli iOS architecture: https://github.com/Muesli-HQ/muesli-ios
- Blitztext iOS (no public API for returning to the previous app): https://github.com/weisserjc/blitztext-ios
- KeySay App Store listing: https://apps.apple.com/us/app/keysay-private-dictation/id6762168533
- Yaps launch and offline guide (Parakeet via sherpa-onnx): https://www.yaps.ai/blog/yaps-ios-app-launch and https://www.yaps.ai/blog/offline-dictation-guide
- Outspoken: https://www.iphone-ticker.de/outspoken-geheimtipp-bringt-lokale-diktierfunktion-in-jede-iphone-app-282532/
- Vozzy developer thread on host return: https://developer.apple.com/forums/thread/843118
- AudioRecordingIntent can't cold-start from the background: https://developer.apple.com/forums/thread/815725
- App Intents as the entry point: https://github.com/Starmel/OpenSuperWhisper/issues/135
- Monologue and the Action Button: https://help.monologue.to/en/articles/14470633-can-i-use-the-iphone-action-button-with-monologue
- Metal in the background: https://developer.apple.com/documentation/metal/preparing-your-metal-app-to-run-in-the-background
- Background GPU is iPad only: https://developer.apple.com/forums/thread/801229
- Background inference entitlement: https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.background-tasks.continued-processing.inference
- Entitlement missing from the iOS 27.2 SDK: https://github.com/joeblau/voice/pull/101
- Background Whisper on CPU: https://github.com/mirkobozzetto/flowflow/issues/198
- FluidAudio (ANE, background-friendly): https://github.com/FluidInference/FluidAudio
- Gemma 4 E2B LiteRT-LM benchmarks: https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm
- Runtime comparison on an iPhone 17 Pro (MLX, llama.cpp, LiteRT-LM, CoreML/ANE): https://dev.to/john-rocky/on-device-llm-on-iphone-which-runtime-is-fastest-mlx-vs-llamacpp-vs-litert-lm-vs-coreml-1b42
- Parakeet TDT 0.6B v3 model card (Swedish WER): https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3
- Pianissimo: https://research.klang.ai/papers/klang-pianissimo-sv and https://huggingface.co/markstrom/pianissimo-sv-coreml
- Foundation Models `rateLimited`: https://developer.apple.com/documentation/foundationmodels/languagemodelsession/generationerror/ratelimited(_:)
- Foundation Models rate limit in an extension: https://developer.apple.com/forums/topics/machine-learning-and-ai/machine-learning-and-ai-foundation-models
- Apple feature availability (Swedish dictation, Apple Intelligence languages): https://www.apple.com/ios/feature-availability/
- iOS 27 Advanced Dictation: https://9to5mac.com/2026/06/12/ai-advanced-dictation-preview-ios-27-beta/
- Background memory (WWDC 2020 "Why is my app getting killed?"): https://developer.apple.com/videos/play/wwdc2020/10078/
