# Swedish voice keyboard research (October 2026)

Market and feasibility research for an on-device Swedish dictation keyboard for iPhone, in the style of Wispr Flow. It builds on the Pianissimo + Gemma 4 E2B handoff in `../molnfri-local-models/`.

| File | What it is |
|---|---|
| `swedish-voice-keyboard-brief.html` | The report: most acclaimed apps, most interesting features, features ranked by leverage, why users get hooked, on-device feasibility, the Swedish build plan, 43 sources. Published at https://claude.ai/artifact/3LmhujzNyR7F2yzLmCYKYk (private until shared). |
| `swedish-voice-keyboards.mp4` | A 3-minute narrated summary with burned-in captions (1920×1080, 30 fps). |
| `swedish-voice-keyboards.srt` | The same captions as a subtitle file. |
| `video/` | Remotion source for the video. |

## Re-rendering the video

The narration is already in `video/public/narration.wav` and its timing in `video/src/timeline.json`, so you only need step 2 unless you change the script.

1. Regenerate the narration (only after editing `video/script/narration.json`). It uses the offline Kokoro TTS voice `af_heart`:

   ```sh
   python3 -m venv .venv && .venv/bin/pip install kokoro-onnx soundfile
   curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
   curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
   .venv/bin/python video/script/build_narration.py . --seconds 180
   python3 video/script/export_srt.py swedish-voice-keyboards.srt
   ```

   The script adjusts the speaking rate so the narration fits the 180-second video, and times each caption chunk to pauses in the audio.

2. Render:

   ```sh
   cd video
   npm install
   npx remotion render src/index.ts DictationKeyboards out/dictation-keyboards.mp4 --crf=20
   ```

   Scene animations are keyed to the moment specific words are spoken (`wordAt()` in `src/timeline.ts`), so they stay in sync if the narration is regenerated. `npx remotion studio` opens a live preview.
