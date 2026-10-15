# The Moon's Orchestra: a Cancer stellium explainer

A three-minute astrology explainer made with [HyperFrames](https://github.com/heygen-com/hyperframes). It is for a musician with five planets in Cancer in the 11th house:

- Moon, Mercury and Venus conjunct within 1°
- Sun and Mars conjunct within 1°
- Leo ascendant

The visuals use musical symbolism: staff lines, planet glyphs as notes, a triad on a piano, a power chord on a guitar fretboard, a tuner, and a concert crowd. A British female voice narrates over an ambient cinematic score.

| | |
|---|---|
| **Video** | `renders/the-moons-orchestra.mp4`: 1920×1080, 30 fps, 3:02 |
| **Script** | [`SCRIPT.md`](SCRIPT.md): the 2-minute reading, the 3-minute narration with a scene-by-scene shot list, and astrologer's notes |
| **Composition** | `video/index.html`: the HyperFrames project (open it in Studio with `npx hyperframes preview`) |

## How it is made

| Layer | What | Where |
|---|---|---|
| Voice | Kokoro-82M (local, via HyperFrames' TTS model), voice `bf_emma` (British English, female), speed 0.88. Each line is synthesised separately so its timing is known exactly. Two pronunciation fixes are applied at phoneme level (Debussy; "lives"). | `tools/narration.json`, `tools/tts.py` |
| Score | Procedural ambient score generated in Python and timed to the narration: warm pads, felt piano answering the voice in its pauses, tides and shimmer. The music also illustrates the script. C, E and G are struck as Moon, Venus and Mercury are named. An A5 power chord plays for Sun–Mars. Two detuned tones beat and then glide into unison on "they ring as one". The Leo finale lifts from A minor into its relative major, C. | `tools/score.py` |
| Mix | Voice at −16 LUFS. The score is 12 LU lower, ducked about 7 dB under speech and EQ-carved at 1.2 and 2.6 kHz so the voice stays clear. A peak guard keeps the summed mix below −1.9 dBFS. | `tools/score.py` |
| Picture | One HyperFrames composition: seven scenes on a single seekable GSAP timeline, synced to the per-line timings. Fonts: Cormorant Garamond, Jost and Noto Music (for the clef and notes), vendored locally. | `tools/index.template.html` → `video/index.html` |

## Rebuild

```bash
npm install                       # hyperframes CLI, fonts, gsap
pip install kokoro-onnx soundfile scipy pyloudnorm
npx hyperframes tts "warm-up" -v bf_emma -o /tmp/warmup.wav   # downloads the Kokoro model once

python3 -I tools/tts.py           # narration + video/timeline.json
python3 -I tools/score.py         # score, mixed against the narration
python3 -I tools/build_index.py   # injects the timeline into video/index.html

cd video
npx hyperframes check             # lint, runtime, layout, motion and contrast
npx hyperframes render --crf 20 --fps 30 --output ../renders/the-moons-orchestra.mp4
```

To change wording, edit `tools/narration.json` and rerun all three scripts. The score and the animation both re-time themselves to the new narration.
