"""Synthesise the narration line by line with Kokoro (British female voice) and
lay it out on a timeline.

Outputs (paths relative to the explainer folder):
  build/voice/<line>.wav           raw 24 kHz takes, one per line
  video/assets/audio/narration.flac 48 kHz dual-mono narration with lead-in, pauses and tail
  video/timeline.json              start/end of every line and scene, used by the
                                   score generator and the composition

Run: python3 -I tools/tts.py
"""

import json
import os
import subprocess
import sys

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.expanduser("~/.cache/hyperframes/tts")
MODEL = os.path.join(CACHE, "models", "kokoro-v1.0.onnx")
VOICES = os.path.join(CACHE, "voices", "voices-v1.0.bin")


def main() -> None:
    with open(os.path.join(ROOT, "tools", "narration.json")) as f:
        spec = json.load(f)

    kokoro = Kokoro(MODEL, VOICES)
    voice_dir = os.path.join(ROOT, "build", "voice")
    os.makedirs(voice_dir, exist_ok=True)

    sr = None
    cursor = spec["lead_in"]
    chunks = []
    timeline = {"scenes": [], "lines": []}

    for scene in spec["scenes"]:
        scene_start = cursor
        for line in scene["lines"]:
            phonemes = kokoro.tokenizer.phonemize(line["text"], spec["lang"])
            for wrong, right in spec.get("pronunciations", {}).items():
                phonemes = phonemes.replace(wrong, right)
            audio, sr = kokoro.create(
                phonemes,
                voice=spec["voice"],
                speed=spec["speed"],
                lang=spec["lang"],
                is_phonemes=True,
            )
            sf.write(os.path.join(voice_dir, f"{line['id']}.wav"), audio, sr)
            dur = len(audio) / sr
            chunks.append((cursor, audio))
            timeline["lines"].append(
                {
                    "id": line["id"],
                    "scene": scene["id"],
                    "text": line["text"],
                    "start": round(cursor, 3),
                    "end": round(cursor + dur, 3),
                }
            )
            print(f"{line['id']}  {cursor:7.2f}s  +{dur:5.2f}s  {line['text'][:60]}")
            cursor += dur + line["pause"]
        timeline["scenes"].append(
            {"id": scene["id"], "start": round(scene_start, 3), "end": round(cursor, 3)}
        )

    total = cursor + spec["tail"]
    # Scenes tile the whole film: the first starts at 0, the last runs to the end.
    timeline["scenes"][0]["start"] = 0.0
    timeline["scenes"][-1]["end"] = round(total, 3)
    timeline["duration"] = round(total, 3)

    mix = np.zeros(int(total * sr) + 1, dtype=np.float32)
    for start, audio in chunks:
        i = int(round(start * sr))
        mix[i : i + len(audio)] += audio
    raw = os.path.join(ROOT, "build", "narration_24k.wav")
    sf.write(raw, mix, sr)

    out = os.path.join(ROOT, "video", "assets", "audio", "narration.flac")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    # Gentle voice polish: rumble cut, a touch of presence, broadcast loudness.
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error", "-i", raw,
            "-af",
            "highpass=f=75,equalizer=f=3200:t=q:w=1.2:g=1.5,"
            "loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000",
            # dual-mono stereo so the HyperFrames mixer sums it predictably
            "-ar", "48000", "-ac", "2", "-c:a", "flac", "-compression_level", "8", out,
        ],
        check=True,
    )

    with open(os.path.join(ROOT, "video", "timeline.json"), "w") as f:
        json.dump(timeline, f, indent=2)
    words = sum(len(l["text"].split()) for l in timeline["lines"])
    speech = sum(l["end"] - l["start"] for l in timeline["lines"])
    print(f"\n{words} words, {speech:.1f}s of speech ({words / speech * 60:.0f} wpm), film {total:.1f}s")


if __name__ == "__main__":
    sys.exit(main())
