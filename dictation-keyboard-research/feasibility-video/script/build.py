"""Voice the narration offline with Kokoro and write the HyperFrames composition.

Usage:
    python build.py <kokoro-model-dir> [--seconds 60]

Reads  script/narration.json and script/index.template.html
Writes assets/narration.wav and index.html (scene and caption clips get exact data-start/data-duration)
"""
import argparse
import html
import json
import math
import os
import re

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

LEAD_IN = 0.7
SENTENCE_GAP = 0.22
SCENE_GAP = 0.5
MIN_OUTRO = 2.2
MAX_CAPTION_CHARS = 52


def trim(audio, sr, thresh=0.006, margin=0.03):
    idx = np.where(np.abs(audio) > thresh)[0]
    if len(idx) == 0:
        return audio
    pad = int(margin * sr)
    return audio[max(0, idx[0] - pad): min(len(audio), idx[-1] + pad)]


def synth_all(kokoro, script, speed):
    clips, sr = [], 24000
    for scene in script["scenes"]:
        scene_clips = []
        for s in scene["sentences"]:
            audio, sr = kokoro.create(s.get("say", s["show"]), voice=script["voice"], speed=speed, lang=script["lang"])
            scene_clips.append(trim(np.asarray(audio, dtype=np.float32), sr))
        clips.append(scene_clips)
    return clips, sr


def pauses(audio, sr, frame=0.02, min_len=3):
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
            score = abs(ends[i] - target) - (14 if re.search(r"[,:;.?!]$", words[i]) else 0)
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
    ap.add_argument("--seconds", type=float, default=60.0)
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
    # speaking rate isn't linear in Kokoro's speed knob, so re-fit until it fits (capped at 1.2)
    for _ in range(4):
        if speech <= available or speed >= 1.2:
            break
        speed = min(1.2, speed * speech / available * 1.01)
        clips, sr = synth_all(kokoro, script, speed)
        speech = sum(len(c) for sc in clips for c in sc) / sr
        print(f"speed {speed:.3f}: speech {speech:.1f}s")
    if speech > available:
        raise SystemExit(f"narration is {speech - available:.1f}s too long even at speed {speed:.2f}; shorten the script")

    total = int(round(args.seconds * sr))
    out = np.zeros(total, dtype=np.float32)
    t = LEAD_IN
    scenes, captions = [], []
    for si, (scene, scene_clips) in enumerate(zip(script["scenes"], clips)):
        if si > 0:
            t += SCENE_GAP - SENTENCE_GAP
        scene_start = t
        sentences = []
        for s, clip in zip(scene["sentences"], scene_clips):
            start = t
            i0 = int(round(start * sr))
            out[i0: i0 + len(clip)] += clip[: max(0, total - i0)]
            dur = len(clip) / sr
            sentences.append({"start": round(start, 3), "end": round(start + dur, 3), "text": s["show"]})
            parts = chunk_caption(s["show"])
            weights = [len(p.replace(" ", "")) for p in parts]
            bounds, acc, quiet = [0.0], 0, pauses(clip, sr)
            for w in weights[:-1]:
                acc += w
                b = dur * acc / sum(weights)
                near = [q for q in quiet if abs(q - b) <= 0.45]
                bounds.append(min(near, key=lambda q: abs(q - b)) if near else b)
            bounds.append(dur)
            for p, a, b in zip(parts, bounds[:-1], bounds[1:]):
                # estimate when each word starts: proportional to characters within the chunk
                ws = p.split(" ")
                wlen = [len(w) + 1 for w in ws]
                acc_w, words = 0, []
                for w, l in zip(ws, wlen):
                    words.append({"w": w, "t": round(start + a + (b - a) * acc_w / sum(wlen), 3)})
                    acc_w += l
                captions.append({"start": round(start + a, 3), "end": round(start + b, 3), "text": p, "words": words})
            t = start + dur + SENTENCE_GAP
        scenes.append({"id": scene["id"], "start": round(scene_start, 3), "sentences": sentences})

    # scenes tile the whole timeline: each runs until the next begins
    scenes[0]["start"] = 0.0
    for i, sc in enumerate(scenes):
        sc["end"] = scenes[i + 1]["start"] if i + 1 < len(scenes) else args.seconds

    peak = np.max(np.abs(out))
    out = out / peak * 0.89 if peak > 0 else out

    # voice envelope at 30 fps (0..1), lightly smoothed, for the mic halo
    hop = sr // 30
    frames = len(out) // hop
    rms = np.sqrt(np.mean(out[: frames * hop].reshape(frames, hop) ** 2, axis=1))
    rms = np.convolve(rms, np.ones(3) / 3, mode="same")
    env = np.clip(rms / (np.percentile(rms, 98) + 1e-9), 0, 1)
    envelope = [round(float(v), 2) for v in env]
    os.makedirs(os.path.join(ROOT, "assets"), exist_ok=True)
    sf.write(os.path.join(ROOT, "assets", "narration.wav"), out, sr, subtype="PCM_16")

    with open(os.path.join(HERE, "index.template.html"), encoding="utf-8") as f:
        page = f.read()
    for sc in scenes:
        page = page.replace("{{%s.start}}" % sc["id"], f"{sc['start']:.3f}")
        page = page.replace("{{%s.dur}}" % sc["id"], f"{sc['end'] - sc['start']:.3f}")
    # hold each caption a beat past its last word, but never into the next caption
    holds = [
        min(c["end"] + 0.08, captions[i + 1]["start"]) if i + 1 < len(captions) else c["end"] + 0.08
        for i, c in enumerate(captions)
    ]
    def caption_div(i, c, hold):
        words = " ".join(f'<span class="cw">{html.escape(w["w"])}</span>' for w in c["words"])
        return (
            f'      <div id="cap-{i}" class="clip cap" data-start="{c["start"]:.3f}" '
            f'data-duration="{hold - c["start"]:.3f}" data-track-index="9"><span class="cl">{words}</span></div>'
        )

    cap_html = "\n".join(caption_div(i, c, h) for i, (c, h) in enumerate(zip(captions, holds)))
    page = page.replace("{{CAPTIONS}}", cap_html)
    page = page.replace("{{DURATION}}", f"{args.seconds:.0f}")
    page = page.replace("{{DATA}}", json.dumps({"scenes": scenes, "captions": captions, "envelope": envelope}, ensure_ascii=False, separators=(",", ":")))
    leftover = re.findall(r"\{\{[^}]+\}\}", page)
    if leftover:
        raise SystemExit(f"unfilled placeholders: {leftover}")
    with open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8") as f:
        f.write(page)
    with open(os.path.join(ROOT, "captions.srt"), "w", encoding="utf-8") as f:
        def stamp(x):
            ms = int(round(x * 1000))
            return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
        f.write("\n".join(f"{i}\n{stamp(c['start'])} --> {stamp(c['end'])}\n{c['text']}\n" for i, c in enumerate(captions, 1)))

    words = sum(len(s["show"].split()) for sc in script["scenes"] for s in sc["sentences"])
    print(f"words {words}, speech {speech:.1f}s ({words / speech * 60:.0f} wpm), last speech ends {scenes[-1]['sentences'][-1]['end']:.1f}s")
    for sc in scenes:
        print(f"  {sc['id']:8s} {sc['start']:6.2f}-{sc['end']:6.2f}")
    print(f"{len(captions)} captions")


if __name__ == "__main__":
    main()
