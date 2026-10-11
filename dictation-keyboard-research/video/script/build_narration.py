"""Synthesize the narration with Kokoro (offline) and write the caption timeline.

Usage:
    python build_narration.py <kokoro-model-dir> [--seconds 180] [--fps 30]

Writes:
    ../public/narration.wav     mono 24 kHz narration, padded to the video length
    ../src/timeline.json        scene and sentence timings plus caption chunks
"""
import argparse
import json
import math
import os
import re

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

LEAD_IN = 1.2          # silence before the first sentence
SENTENCE_GAP = 0.24    # pause between sentences in a scene
SCENE_GAP = 0.65       # pause between scenes
MIN_OUTRO = 3.0        # hold after the last sentence
MAX_CAPTION_CHARS = 58


def trim(audio, sr, thresh=0.006, margin=0.03):
    idx = np.where(np.abs(audio) > thresh)[0]
    if len(idx) == 0:
        return audio
    pad = int(margin * sr)
    return audio[max(0, idx[0] - pad): min(len(audio), idx[-1] + pad)]


def synth_all(kokoro, script, speed):
    clips = []
    for scene in script["scenes"]:
        scene_clips = []
        for s in scene["sentences"]:
            text = s.get("say", s["show"])
            audio, sr = kokoro.create(text, voice=script["voice"], speed=speed, lang=script["lang"])
            scene_clips.append(trim(np.asarray(audio, dtype=np.float32), sr))
        clips.append(scene_clips)
    return clips, sr


def pauses(audio, sr, frame=0.02, min_len=3):
    """Centres (seconds) of quiet stretches inside a sentence clip."""
    n = int(frame * sr)
    frames = len(audio) // n
    if frames == 0:
        return []
    rms = np.sqrt(np.mean(audio[: frames * n].reshape(frames, n) ** 2, axis=1))
    quiet = rms < 0.08 * rms.max()
    out, run = [], 0
    for i, q in enumerate(quiet):
        if q:
            run += 1
        else:
            if run >= min_len:
                out.append((i - run / 2) * frame)
            run = 0
    return out


def chunk_caption(text):
    """Split a sentence into caption chunks, preferring breaks after punctuation."""
    if len(text) <= MAX_CAPTION_CHARS:
        return [text]
    n = math.ceil(len(text) / MAX_CAPTION_CHARS)
    words = text.split(" ")
    ends = [len(" ".join(words[: i + 1])) for i in range(len(words))]
    breaks, prev = [], -1
    for k in range(1, n):
        target = len(text) * k / n
        best, best_score = None, None
        for i in range(prev + 1, len(words) - 1):
            left = ends[i] - (ends[prev] + 1 if prev >= 0 else 0)
            right = len(text) - ends[i] - 1
            if left < 12 or right < 12:
                continue
            score = abs(ends[i] - target)
            if re.search(r"[,:;.?!]$", words[i]):
                score -= 14
            if best_score is None or score < best_score:
                best, best_score = i, score
        if best is not None:
            breaks.append(best)
            prev = best
    chunks, start = [], 0
    for b in breaks + [len(words) - 1]:
        chunks.append(" ".join(words[start: b + 1]))
        start = b + 1
    return chunks


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("models")
    ap.add_argument("--seconds", type=float, default=180.0)
    ap.add_argument("--fps", type=int, default=30)
    args = ap.parse_args()

    with open(os.path.join(HERE, "narration.json"), encoding="utf-8") as f:
        script = json.load(f)
    kokoro = Kokoro(os.path.join(args.models, "kokoro-v1.0.onnx"), os.path.join(args.models, "voices-v1.0.bin"))

    n_sent = sum(len(s["sentences"]) for s in script["scenes"])
    n_scene = len(script["scenes"])
    gaps = LEAD_IN + (n_sent - n_scene) * SENTENCE_GAP + (n_scene - 1) * SCENE_GAP
    available = args.seconds - gaps - MIN_OUTRO

    speed = 1.0
    clips, sr = synth_all(kokoro, script, speed)
    speech = sum(len(c) for sc in clips for c in sc) / sr
    print(f"speed {speed:.3f}: speech {speech:.1f}s, available {available:.1f}s")
    if speech > available:
        speed = min(1.25, speech / available * 1.01)
        clips, sr = synth_all(kokoro, script, speed)
        speech = sum(len(c) for sc in clips for c in sc) / sr
        print(f"speed {speed:.3f}: speech {speech:.1f}s, available {available:.1f}s")

    total_frames = int(round(args.seconds * args.fps))
    total_samples = int(round(total_frames / args.fps * sr))
    out = np.zeros(total_samples, dtype=np.float32)

    t = LEAD_IN
    timeline_scenes, captions = [], []
    for si, (scene, scene_clips) in enumerate(zip(script["scenes"], clips)):
        if si > 0:
            t += SCENE_GAP - SENTENCE_GAP
        scene_start = t
        sentences = []
        for s, clip in zip(scene["sentences"], scene_clips):
            start = t
            i0 = int(round(start * sr))
            out[i0: i0 + len(clip)] += clip[: max(0, total_samples - i0)]
            dur = len(clip) / sr
            end = start + dur
            sentences.append({"start": round(start, 3), "end": round(end, 3), "text": s["show"]})

            # caption chunks, timed by characters and snapped to pauses in the audio
            parts = chunk_caption(s["show"])
            weights = [len(p.replace(" ", "")) for p in parts]
            total_w = sum(weights)
            bounds = [0.0]
            acc = 0
            quiet = pauses(clip, sr)
            for w in weights[:-1]:
                acc += w
                b = dur * acc / total_w
                near = [q for q in quiet if abs(q - b) <= 0.45]
                if near:
                    b = min(near, key=lambda q: abs(q - b))
                bounds.append(b)
            bounds.append(dur)
            for p, a, b in zip(parts, bounds[:-1], bounds[1:]):
                captions.append({"start": round(start + a, 3), "end": round(start + b, 3), "text": p})
            t = end + SENTENCE_GAP
        timeline_scenes.append({"id": scene["id"], "start": round(scene_start, 3), "sentences": sentences})

    last_end = timeline_scenes[-1]["sentences"][-1]["end"]
    for i, sc in enumerate(timeline_scenes):
        sc["end"] = timeline_scenes[i + 1]["start"] if i + 1 < len(timeline_scenes) else round(args.seconds, 3)
    timeline_scenes[0]["start"] = 0.0

    peak = np.max(np.abs(out))
    if peak > 0:
        out = out / peak * 0.89
    os.makedirs(os.path.join(ROOT, "public"), exist_ok=True)
    sf.write(os.path.join(ROOT, "public", "narration.wav"), out, sr, subtype="PCM_16")

    timeline = {
        "fps": args.fps,
        "durationInFrames": total_frames,
        "seconds": args.seconds,
        "voice": script["voice"],
        "speed": round(speed, 3),
        "lastSpeechEnd": last_end,
        "scenes": timeline_scenes,
        "captions": captions,
    }
    with open(os.path.join(ROOT, "src", "timeline.json"), "w", encoding="utf-8") as f:
        json.dump(timeline, f, indent=1, ensure_ascii=False)
    words = sum(len(s["show"].split()) for sc in script["scenes"] for s in sc["sentences"])
    print(f"words {words}, speech {speech:.1f}s ({words / speech * 60:.0f} wpm), last speech ends {last_end:.1f}s of {args.seconds:.0f}s")
    print(f"{len(captions)} caption chunks, longest {max(len(c['text']) for c in captions)} chars")


if __name__ == "__main__":
    main()
