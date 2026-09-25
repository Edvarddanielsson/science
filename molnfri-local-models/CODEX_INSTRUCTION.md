# Codex instruction: add Pianissimo (Swedish ASR) and Gemma 4 E2B (note LLM) as selectable on-device models

Prepared 2026-09-25 from web research and from reading the source of FluidAudio v0.17.4, LiteRT-LM v0.17.1 and mlx-swift-lm 3.31.x. Nothing below has been run on a device. Every speed or memory figure comes from a vendor or community page; none is an iPhone 15 Pro measurement.

## 0. How to proceed

1. Read this against the current code first. Before writing code, reply with: (a) where this conflicts with or duplicates what exists, (b) any adjustments you would make, with reasons, (c) your implementation order.
2. Then implement, passing the two prototype gates in §6 before building UI on top. If a gate fails, stop and report rather than forcing that path.
3. Leave defaults alone. Apple stays the default for both pickers; the new models are opt-in downloads.

## 1. Recommendation

| | Transcription | Note LLM |
|---|---|---|
| Model | Klang Pianissimo, `KlangAI/pianissimo-sv` (CC BY 4.0) | Gemma 4 E2B **instruction-tuned**, `google/gemma-4-E2B-it` (Apache 2.0). The linked `google/gemma-4-E2B` is the pretrained base and is the wrong checkpoint for following template instructions. |
| Artifact | `markstrom/pianissimo-sv-coreml`: CoreML, int8 encoder, 688 MB, pinned and hash-verified | `litert-community/gemma-4-E2B-it-litert-lm`, file `gemma-4-E2B-it.litertlm` (2,588,147,712 bytes) |
| Runtime | FluidAudio (Swift, CoreML on CPU+ANE) via `AsrModels.loadLocal` | LiteRT-LM Swift package (`LiteRTLM`) with JSON-schema constrained decoding |
| Why | Best available Swedish accuracy/speed trade-off. The ANE path leaves the GPU free and is allowed in the background. The loader API exists for exactly this kind of community fine-tune. | Google's own on-device artifact. Per-layer embeddings are memory-mapped, so resident memory stays near the "effective" size (0.6–1.5 GB on iPhone 17 Pro per Google). Swift API has schema-constrained output and cancellation. |
| Fallback | ONNX INT8 (`moonhouse/pianissimo-sv-onnx`) via ONNX Runtime or sherpa-onnx. MLX not recommended (§2). | `mlx-swift-lm` Gemma4 + `MLXGuidedGeneration` (xgrammar), then llama.cpp |

## 2. Evidence

Tags: **V** = verified in source code or official docs. **P** = plausible, needs a prototype. **M** = must be measured on device.

### Transcription

- **V** Pianissimo is a ~600M-parameter fine-tune of NVIDIA Parakeet TDT 0.6B v3 (FastConformer encoder, 24 layers, 8× subsampling; TDT decoder = 2-layer LSTM prediction net + joint; durations [0–4]). Input is 16 kHz mono, 128-band log-mel. The tokenizer is the unchanged Parakeet v3 SentencePiece BPE (8,192 tokens, blank id 8192). Attention is local, ±256 encoder frames (~20.5 s). The official repo contains only `pianissimo-sv.nemo` (2.51 GB). Released 2026-09-23. Klang has only evaluated Swedish.
- **V** Klang's Swedish WER, mean of five test sets: Pianissimo 4.5%, KB-Whisper small 5.8% (the app's current model), medium 4.9%, large 3.5%. On Klang Dialects: Pianissimo 4.9% vs KB-Whisper small 5.2%.
- **V** Klang's long-recording write-up: normalizing mel features over the whole recording originally made the model drop passages. A final fine-tune fixed it, and sliding-window normalization also worked (11.1% → 5.1% WER before the fix; 4.7% either way after). FluidAudio normalizes per 15 s window, which is close to the 10–30 s training clips. **P**: long-form quality through FluidAudio's chunk-and-merge still needs checking.
- **V** CoreML conversion `markstrom/pianissimo-sv-coreml` (uploaded 2026-09-23, revision `106fa16`, "Pianissimo CoreML 1.0.0"):
  - Built from Klang revision `8f1f6d8f8bd7482a5ea1d2bfaf6ef5be61597138` (`.nemo` SHA-256 `ca340b82…`).
  - Contents: Preprocessor (fp32), Encoder (int8 per-channel, 649 MB weights), Decoder and JointDecisionv3 (fp16), `parakeet_vocab.json`, and a `manifest.json` listing 15 files with per-file size and SHA-256.
  - Fixed 15 s window. iOS 17 target. Attention was switched to full `rel_pos`; the uploader states this is equivalent because a 188-frame window is shorter than ±256.
  - The uploader's own check: 45 *synthesized* Swedish clips, 40 word-identical, 0.78% WER relative to NeMo.
  - This is one individual's community artifact, two days old. I have not reproduced it.
- **V** FluidAudio (Apache 2.0, iOS 17+, v0.17.4 released 2026-09-24):
  - `AsrModels.loadLocal(from:version:.v3 …)` (synchronous `throws`; added in v0.15.8, PR #928, for community fine-tunes) loads `Preprocessor/Encoder/Decoder/JointDecisionv3.mlmodelc` plus `parakeet_vocab.json` from one exact directory, with no network.
  - Default compute: preprocessor on CPU, the rest on CPU+ANE. Source comment: this "avoids GPU dispatch, which keeps background execution permitted on iOS".
  - Long audio runs in 15 s windows with 2 s overlap. Chunk loops call `Task.checkCancellation()`. Progress comes from `transcriptionProgressStream`.
  - `ModelHub.offlineMode = true` blocks all FluidAudio network fetches.
- **V Security caveat.** For audio over 480,000 samples (30 s), `AsrManager.transcribe(_ url:)` writes a raw float32 PCM copy of the recording to `FileManager.default.temporaryDirectory/fluidaudio-streaming-<UUID>.raw` with default file protection. `cleanup()` deletes it, but it survives a crash or kill. You cannot supply your own sample source: the `ChunkProcessor(sampleSource:)` initializer is internal.
- **M** FluidAudio documents a *different* int8 CoreML encoder (Parakeet Unified) failing to load on A16. Nobody has verified that this int8 encoder loads on the A17 Pro.
- **MLX assessment.** `moonhouse/pianissimo-sv-mlx` (fp16 safetensors, 1.25 GB; config keeps `rel_pos_local_attn` [256,256]) targets Python `parakeet-mlx` on Macs.
  - The uploader's own tests show a regression against NeMo: 6.67% vs 4.67% WER (98% agreement) on the MLX card, and 12.78% vs 6.11% (93.33%) on their ONNX card. The same uploader's ONNX INT8 export matched NeMo 100%.
  - A Swift route exists in principle (`mlx-audio-swift`, `MLXAudioSTT.ParakeetModel`). Its compatibility with this checkpoint and with local attention is unverified.
  - MLX runs only on the Metal GPU, so it cannot work in the background, and all weights stay resident.
  - FluidInference archived its Swift MLX Parakeet port in favour of CoreML/ANE.
  - Verdict: a useful Mac reference, not the iPhone path.

### LLM

- **V** Gemma 4 was released 2026-04-02 under Apache 2.0.
  - E2B has 2.3B effective parameters and 5.1B including per-layer embedding (PLE) tables, which are lookups only. It has 35 layers, a 512-token sliding window, a 262K vocabulary and 128K model context, with text, image and audio input.
  - The card claims 35+ languages out of the box and 140+ in pretraining. I found no Swedish-specific numbers. **P**: Swedish note quality is the largest unknown.
- **V** Card: E2B/E4B emit no thought block when thinking is disabled. The general sampling recommendation is temperature 1.0, top-p 0.95, top-k 64.
- **V** `gemma-4-E2B-it.litertlm` has the tokenizer and chat template embedded. Its card says up to 32k context. Google's iPhone 17 Pro figures (1,024 prefill, 256 decode, 2,048 context):

  | Backend | Prefill | Decode | Memory |
  |---|---|---|---|
  | CPU | 532 tok/s | 25 tok/s | 607 MB |
  | GPU | 2,878 tok/s | 56.5 tok/s | 1,450 MB |

  The other `.litertlm` files in that repo are NPU and web builds; ignore them.
- **V** LiteRT-LM Swift (Apache 2.0; `Package.swift` at v0.17.1 pulls binary `CLiteRTLM.xcframework`; iOS 15+):
  - Setup: `EngineConfig(modelPath:backend: .cpu()/.gpu, maxNumTokens:, cacheDir:)`. `Engine.initialize()` is synchronous `throws` in current source, even though the docs show `await`.
  - Conversation: `ConversationConfig(systemMessage:samplerConfig:thinkingConfig:enableResponseFormat:)`, then `sendMessage(… maxOutputTokens:thinkingConfig:responseFormat: .json(schema:))`, `sendMessageStream`, and `Conversation.cancel()`.
  - Constraints are backed by llguidance (JSON schema or regex).
  - The Swift API exposes no token-count function. It was labelled "early preview" at v0.12 and changes quickly.
- **P** Open questions for LiteRT-LM:
  - Does the prebuilt iOS xcframework actually honour `responseFormat` on device?
  - Does SPM resolve cleanly in this project? A community wrapper reports fragile resolution because the repo LFS-tracks non-Apple prebuilts (upstream issue #2407). The fallback is to vendor the small Apache-2.0 Swift wrapper and reference the same release binary URL and checksum.
  - Can only one session be active at a time (reported by a community wrapper)? Serialize generation regardless.
- **V** Alternatives:
  - `mlx-swift-lm` (iOS 17+) has `Gemma4`/`Gemma4Text` and `MLXGuidedGeneration` (xgrammar JSON schema). `mlx-community/gemma-4-e2b-it-4bit` is a single 3.58 GB safetensors file that includes the vision and audio towers. MLX keeps weights resident and runs only on the GPU.
  - llama.cpp supports Gemma 4 and has mature grammar constraints. But the app already links whisper.cpp's ggml, and a second ggml copy risks duplicate symbols or Metal class clashes (**P**, unverified). The C glue is also larger.
  - One developer anecdotally reported LiteRT-LM running Gemma 4 E2B 3–5× faster than their llama.cpp setup on iOS.
- **V** iOS 27 adds a FoundationModels `LanguageModel`/`LanguageModelExecutor` protocol for third-party models (WWDC26 sessions 241 and 339). LiteRT-LM ships a `LiteRTLMFoundationModels` adapter and mlx-swift-lm ships `MLXFoundationModels`. The app targets iOS 26, so this is out of scope for now. Keep the provider seam compatible so it can be adopted later.

## 3. Transcription integration (Pianissimo)

1. **Dependency.** Pin FluidAudio exactly: at least 0.15.8 is required, and 0.17.4 is current. Set `ModelHub.offlineMode = true` at startup. If the toolchain supports SwiftPM traits cleanly, consider disabling the `NemoTextProcessing` trait (~8 MB per slice, not needed for ASR).
2. **Install.** Use the generic store from §5.
   - Download the 15 files listed in the pinned `manifest.json` (688,257,471 bytes) from `https://huggingface.co/markstrom/pianissimo-sv-coreml/resolve/<full commit SHA of 106fa16>/<path>`. Verify each file's size and SHA-256.
   - Compile each `.mlpackage` on device with `MLModel.compileModel(at:)`.
   - Put the four `.mlmodelc` bundles, `parakeet_vocab.json` and `LICENSE-and-attribution.txt` in one directory, then install it atomically.
   - Then delete the `.mlpackage`s, or keep them so you can recompile if CoreML rejects a compiled model after an OS update. Your call; re-downloading is the simpler recovery.
   - Peak disk use during install is about 1.4 GB.
3. **Provider.** Mirror KB's reservation and cleanup:
   - Call `AsrModels.loadLocal(from: dir, version: .v3)` off the main actor.
   - Create `AsrManager(config: .default, models:)` and a decoder state with `TdtDecoderState.make(decoderLayers: await manager.decoderLayerCount)`.
   - Transcribe, then call `cleanup()` and drop all references, so the ASR weights are gone before any LLM work.
4. **Audio input: avoid FluidAudio's unprotected temp file.**
   - Preferred: decode and resample the protected `.m4a` in process to 16 kHz mono Float32 (FluidAudio's `AudioConverter().resampleAudioFile` or AVAudioConverter), then call `transcribe(_ samples: [Float], decoderState:)`. This costs about 3.84 MB per audio minute (~230 MB per hour).
   - If the app's maximum recording length makes that too large, choose one:
     - (a) Set a protection class on the app's tmp directory, use the URL API, and sweep `fluidaudio-streaming-*.raw` on launch via `AudioLifecycleService`.
     - (b) Split the audio at quiet points into segments of at most ~20 minutes.
   - State which you chose and why.
5. **Progress and cancellation.** Subscribe to `transcriptionProgressStream` before transcribing and map it to the existing progress callback. Rely on task cancellation, and measure how quickly it takes effect.
6. **Locale.** Pianissimo is Swedish-only. Replace the hard-coded "non-Swedish → Apple" rule with a per-provider `supports(locale:)` check that falls back to Apple exactly as KB does today. Keep the per-request provider snapshot.
7. **Output.** Return text only. TDT provides token timestamps, but extend the protocol only if you need them.

## 4. LLM integration (Gemma 4 E2B via LiteRT-LM)

1. **Artifact.** A single file, `gemma-4-E2B-it.litertlm`: 2,588,147,712 bytes, SHA-256 `181938105e0eefd105961417e8da75903eacda102c4fce9ce90f50b97139a63c` (LFS oid observed 2026-09-25; re-check when pinning). Pin the URL to a full commit SHA of `litert-community/gemma-4-E2B-it-litert-lm`. Make the download resumable, check free space first, recommend Wi-Fi, and exclude the file from backup.
2. **Engine lifecycle.**
   - Keep one `Engine` at a time, created lazily for a request only after ASR has been released. Run `initialize()` off the main actor.
   - Put `cacheDir` in app Caches; it holds compiled GPU artifacts, not user content. Don't initialize the vision or audio backends.
   - Pick one fixed `maxNumTokens` that covers the single-pass budget plus output (e.g., 8,192). It is engine-level, so changing it means re-initializing. Measure memory at the chosen value.
   - Drop the engine on memory warning, on backgrounding, and after an idle timeout.
   - Check `os_proc_available_memory()` before loading and fail with a clear error. After measuring, decide whether the `com.apple.developer.kernel.increased-memory-limit` entitlement is needed.
   - Serialize generations through an actor. Use a fresh `Conversation` per request or per chunk so history doesn't pile up in the KV cache.
3. **Backend.** Prefill on `.gpu` is ~5× faster than on CPU in Google's iPhone 17 Pro figures. But GPU (Metal) work is not permitted in the background, so when the scene backgrounds, cancel generation and fall back to the normal retry-from-transcript path. Measure `.cpu()` as well; if its latency is acceptable on iPhone 15 Pro, it may be the simpler default. Let the measurements decide.
4. **Structured output: reuse, don't fork.** Move the provider-neutral parts of the Apple provider into shared code used by both providers: passage segmentation with IDs, prompt assembly from `MolnfriSummaryTemplate`, source-ID validation, and mapping to ordered sections. The Gemma provider should differ only in the generation call.
   - **Schema.** Generate one per template: an object with positional keys `s1…sN` (all required, `additionalProperties: false`). Each is `{text: string, items: [{text: string, sources: [enum of valid passage IDs], minItems: 1}]}`, with `maxItems`/`maxLength` bounds. The model never emits UUIDs or headings; the app re-attaches template IDs, headings and order, so custom templates work unchanged. Match the shape to what the Apple provider's structured types already encode.
   - **Keyword support.** Check on device which JSON-schema keywords llguidance honours (large `enum`s, `maxLength`), and keep the schema minimal.
   - **Post-checks.**
     - Every section is present.
     - Items with no valid source are dropped or flagged.
     - A cheap support check: numbers, dates and capitalized names in an item must appear in its cited passages. Flag failures for review, and don't present this as full grounding.
     - Hitting `maxOutputTokens` (truncation) counts as a failure: retry once with a smaller chunk.
   - **Prompt.** A system message with the template instructions and output language, plus "use only the passages; leave a section empty when unsupported". Label passages `[P12] …`.
   - **Thinking and temperature.** Turn thinking off (`ThinkingConfig(enableThinking: false)`). Use a low temperature (0.2–0.4) for extraction. That departs from Google's general 1.0 recommendation, so confirm it on the evaluation set.
5. **Long transcripts.** The Swift API has no token counter, so use a character budget calibrated on Swedish transcripts (measure Gemma tokens per character offline with the HF tokenizer).
   - Up to the budget, generate in a single pass. Start around 6k tokens of passages and tune.
   - Above the budget, map over passage windows (~3k tokens, small overlap) using the same schema. Merge the results per section in code: dedupe on normalized text and take the union of sources. Add an optional reduce call if a section is still too long.
   - Rationale: 32k fits in this build, but E2B's long-context retrieval is weak (MRCR v2 8-needle 128k: 19.1%), and prefill time and KV memory grow with context.
6. **Per-request selection.** Make `MolnfriNoteGenerationService` resolve its provider per request, snapshotted at the start like `TranscriptionService`. Keep the legacy `generate(...)` adapter and leave other callers unchanged.

## 5. Cross-cutting

- **Generic model store.** Extract the mechanics of `KBWhisperModelStore` into a reusable installer driven by pinned descriptors: files, sizes, SHA-256, install directory, and a post-install hook (used for CoreML compilation). It keeps progress/cancel, atomic install, in-use reservations and removal. KB behaviour and tests stay identical.
- **File protection.** Model weights are public data, not user data. Use `completeUntilFirstUserAuthentication` rather than `complete`, so transcription that starts after a recording on a locked device can still read them. All user audio and transcripts stay under the existing `SensitiveFileStore` rules.
- **Memory sequencing.** ASR and LLM are never resident at the same time. `MolnfriRecordingFlow` already runs them in sequence; make the release step explicit.
- **Settings (`PrivacyView`).** Drive both pickers from provider descriptors: name, download size, install state, supported languages, licence. Remove the KB-specific branching wherever the generic store allows.
- **Attribution** in the in-app acknowledgements:
  - "Klang Pianissimo by Klang AI AB, CC BY 4.0, fine-tuned from NVIDIA Parakeet TDT 0.6B v3 (CC BY 4.0); converted to CoreML by markstrom (format change, int8 encoder, attention mode)", with a licence link and the changes noted.
  - Gemma 4 Apache 2.0 notice.
  - FluidAudio and LiteRT-LM Apache 2.0 notices, plus any third-party notices bundled in the LiteRT-LM xcframework (e.g., llguidance, MIT).
- **Network and privacy.** The only network traffic is weight downloads from pinned Hugging Face URLs. No user content leaves the device, and FluidAudio offline mode is on.

## 6. Prototype gates, then validation

**Gate A (ASR), before any UI work.** On an iPhone 15 Pro with a Release build, load the pinned CoreML bundle via `loadLocal`, then transcribe ~10 Swedish clips with reference text and one recording of at least 30 minutes.
- Pass criteria: it loads on CPU+ANE, WER on the clips is no worse than KB-Whisper Small's, the long recording shows no long dropped passages, and no plaintext audio is left behind.
- If the int8 encoder fails on the A17 Pro, try `encoderComputeUnits: .cpuAndGPU` (foreground only) and report. Don't switch runtimes silently.

**Gate B (LLM).** The LiteRT-LM package builds under Swift 6 strict concurrency, Gemma loads on an iPhone 15 Pro, and one Swedish transcript produces schema-valid JSON through `responseFormat`.
- If constraints don't work in the iOS binary, report it. Fallback order: mlx-swift-lm + `MLXGuidedGeneration`, then prompt-only JSON with validation and one repair retry.

**Automated tests** (`molnfriTests`, `molnfriUITests`):
- Provider IDs and factories; preference persistence; unknown or legacy stored values.
- A locale routing matrix: Swedish/non-Swedish × provider installed/not installed.
- Per-request LLM selection: a preference change between requests is honoured, an in-flight request keeps its provider, and the legacy adapter still works.
- Generic store: size/hash mismatch, cancel, atomic install, removal blocked while reserved, KB unchanged.
- Pure functions for Gemma output handling: schema generation for built-in and custom templates; JSON → sections preserving UUIDs and order; missing sections; invalid source IDs; truncated JSON; map-reduce merge.
- Security: no `fluidaudio-streaming-*` file (or any other plaintext audio) remains after success, failure or cancellation; new files carry the expected protection classes.
- UI: extend `TranscriptionSettingsUITests` for the new option and install states, and add tests for the LLM picker.

**Device measurements** (iPhone 15 Pro, Release, 1-, 10- and 60-minute recordings):
- ASR: first-install compile time, cold and warm load, real-time factor, peak `phys_footprint`, cancellation latency. Compare WER with KB-Whisper Small on ~30 Swedish clips (Common Voice sv / FLEURS sv) plus 2–3 of your own long recordings with references. Use the hypothesis/reference word-count ratio to catch deletions.
- LLM, on both CPU and GPU: init time (first run vs cached), time to first token, prefill and decode tok/s, peak footprint at the chosen `maxNumTokens`, behaviour on backgrounding and cancellation, thermal state across a 60-minute transcript.
- Quality: 10 transcripts × 2–3 templates (Swedish plus one English), Gemma vs the Apple provider. Track the schema-valid rate (target 100%), section completeness, the unsupported-claim rate by manual review, and Swedish fluency. Ship Gemma only if it isn't worse than Apple on unsupported claims.

## 7. Open assumptions and user decisions

- Ship with a two-day-old community CoreML conversion (pinned and hashed), or reproduce the NeMo → CoreML conversion and host it ourselves? Recommendation: prototype with it and decide before release.
- The maximum recording length decides whether ASR can use the in-memory audio path or needs a temp file.
- The distribution channel affects download UX (0.7 GB + 2.6 GB) and where acknowledgements go.
- Whether to offer Gemma only on devices with at least 8 GB RAM.
- The iOS 27 FoundationModels custom-model path stays out of scope while the deployment target is iOS 26.

## 8. Sources

- Pianissimo: https://huggingface.co/KlangAI/pianissimo-sv · https://research.klang.ai/papers/klang-pianissimo-sv · https://research.klang.ai/papers/how-we-trained-pianissimo
- Conversions: https://huggingface.co/markstrom/pianissimo-sv-coreml (see `LICENSE-and-attribution.txt`, `manifest.json`) · https://huggingface.co/moonhouse/pianissimo-sv-mlx · https://huggingface.co/moonhouse/pianissimo-sv-onnx
- FluidAudio v0.17.4: https://github.com/FluidInference/FluidAudio (`Sources/FluidAudio/ASR/Parakeet/SlidingWindow/TDT/AsrModels.swift`, `AsrManager.swift`, `ChunkProcessor.swift`; `Sources/FluidAudio/Shared/AudioSourceFactory.swift`; `Documentation/Orukeet.md`)
- MLX ASR: https://github.com/senstella/parakeet-mlx · https://github.com/Blaizzy/mlx-audio-swift · https://github.com/fluidinference/swift-parakeet-mlx
- Gemma 4: https://huggingface.co/google/gemma-4-E2B-it · https://huggingface.co/google/gemma-4-E2B · https://blog.google/innovation-and-ai/technology/developers-tools/gemma-4/ · https://developers.googleblog.com/bring-state-of-the-art-agentic-skills-to-the-edge-with-gemma-4/
- LiteRT-LM: https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm · https://ai.google.dev/edge/litert-lm/models/gemma-4 · https://ai.google.dev/edge/litert-lm/swift · https://github.com/google-ai-edge/LiteRT-LM (`Package.swift` v0.17.1, `swift/Conversation.swift`, `swift/ResponseFormat.swift`, `docs/api/cpp/constrained-decoding.md`) · https://github.com/john-rocky/swift-litert-lm (SPM/LFS note)
- MLX LLM: https://github.com/ml-explore/mlx-swift-lm (`Libraries/MLXLLM/Models/Gemma4*.swift`, `Libraries/MLXGuidedGeneration`) · https://huggingface.co/mlx-community/gemma-4-e2b-it-4bit
- Apple: https://developer.apple.com/videos/play/wwdc2026/241/ · https://developer.apple.com/videos/play/wwdc2026/339/
