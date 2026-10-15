"""Procedural ambient-cinematic score, composed against video/timeline.json.

The music is part of the explanation:
  * Cancer scenes sit in A minor, the Leo finale lifts into C major
    (A minor and C major are relative keys, as Cancer and Leo are neighbours).
  * Triad scene: C, E and G are struck as the Moon (root), Venus (third) and
    Mercury (fifth) are named, then the full chord on "struck as one".
  * Power-chord scene: a low A5 power chord (root + fifth, no third).
  * Unison scene: two detuned tones beat against each other, then glide into
    unison on "they ring as one".
  * Felt-piano phrases answer the voice in its pauses.

The bed is ducked under the narration and carved in the 1.5-4 kHz presence band
so the voice stays clear.

Run: python3 -I tools/score.py
Outputs: video/assets/audio/score.flac (48 kHz / 24-bit stereo) and build/mix_preview.wav
"""

import json
import os

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.signal import fftconvolve, lfilter, butter, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
RNG = np.random.default_rng(11)
MUSIC_BELOW_VOICE_LU = 12.0

NOTE_INDEX = {"C": -9, "C#": -8, "Db": -8, "D": -7, "D#": -6, "Eb": -6, "E": -5,
              "F": -4, "F#": -3, "Gb": -3, "G": -2, "G#": -1, "Ab": -1, "A": 0,
              "A#": 1, "Bb": 1, "B": 2}


def hz(name: str) -> float:
    pitch, octave = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((NOTE_INDEX[pitch] + 12 * (octave - 4)) / 12)


def cents(c: float) -> float:
    return 2 ** (c / 1200)


# --------------------------------------------------------------------------- voices

def pad_note(f: float, dur: float, attack: float, release: float, bright: float = 1.0,
             detune: float = 6.0) -> np.ndarray:
    """Warm, slightly detuned additive pad note, stereo (n, 2)."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    for v, (dc, pan) in enumerate(((-detune, 0.15), (0.0, 0.5), (detune, 0.85))):
        fv = f * cents(dc)
        sig = np.zeros(n)
        kmax = int(min(14, max(1, (5200 * bright) // fv)))
        for k in range(1, kmax + 1):
            amp = 1.0 / k ** (1.9 - 0.5 * bright)
            sig += amp * np.sin(2 * np.pi * fv * k * t + RNG.uniform(0, 2 * np.pi))
        # slow shimmer of each voice so the pad breathes
        sig *= 1 + 0.12 * np.sin(2 * np.pi * (0.07 + 0.03 * v) * t + v)
        out[:, 0] += sig * np.cos(pan * np.pi / 2)
        out[:, 1] += sig * np.sin(pan * np.pi / 2)
    env = np.ones(n)
    a, r = int(attack * SR), int(release * SR)
    env[:a] = np.sin(np.linspace(0, np.pi / 2, a)) ** 2
    env[n - r:] *= np.cos(np.linspace(0, np.pi / 2, r)) ** 2
    return out * env[:, None] / 3.0


def piano_note(f: float, dur: float = 4.5, vel: float = 1.0, felt: float = 0.6) -> np.ndarray:
    """Felt-piano-like tone: slightly inharmonic partials with per-partial decay."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    B = 0.0003
    for k in range(1, 9):
        fk = f * k * np.sqrt(1 + B * k * k)
        if fk > 9000:
            break
        amp = (1.0 / k ** (1.0 + felt)) * vel
        decay = 0.55 + 0.45 * k * (0.6 + felt)
        sig += amp * np.exp(-t * decay) * np.sin(2 * np.pi * fk * t)
    att = int(0.006 * SR)
    sig[:att] *= np.linspace(0, 1, att)
    rel = int(0.4 * SR)
    sig[-rel:] *= np.linspace(1, 0, rel)
    return sig


def power_chord(root: float, dur: float) -> np.ndarray:
    """Root + fifth + octave, saturated and low-passed: a soft cinematic power chord."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    for f, a in ((root, 1.0), (root * 1.5, 0.8), (root * 2, 0.6), (root * 3, 0.25)):
        for dc in (-5, 0, 5):
            fv = f * cents(dc)
            for k in range(1, 10):
                sig += (a / k) * np.sin(2 * np.pi * fv * k * t + RNG.uniform(0, 6.28))
    sig = np.tanh(sig * 0.35)
    sos = butter(2, 1400, "low", fs=SR, output="sos")
    sig = sosfilt(sos, sig)
    env = np.minimum(1, t / 0.05) * (0.35 + 0.65 * np.exp(-t / 1.4))
    rel = int(1.5 * SR)
    env[-rel:] *= np.linspace(1, 0, rel) ** 2
    return sig * env


def string_tone(freqs: np.ndarray) -> np.ndarray:
    """A sustained string-like tone following a per-sample frequency curve."""
    phase = 2 * np.pi * np.cumsum(freqs) / SR
    sig = np.zeros(len(freqs))
    for k, a in ((1, 1.0), (2, 0.35), (3, 0.18), (4, 0.08)):
        sig += a * np.sin(k * phase)
    return sig


def noise_swell(dur: float, lo: float = 400, hi: float = 7000) -> np.ndarray:
    """Rising filtered-noise riser, stereo."""
    n = int(dur * SR)
    out = np.zeros((n, 2))
    blocks = 24
    edges = np.linspace(0, n, blocks + 1).astype(int)
    for ch in range(2):
        noise = RNG.standard_normal(n)
        y = np.zeros(n)
        for b in range(blocks):
            fc = lo * (hi / lo) ** (b / (blocks - 1))
            sos = butter(2, [fc * 0.6, min(fc * 1.6, SR / 2 - 100)], "band", fs=SR, output="sos")
            seg = sosfilt(sos, noise[max(0, edges[b] - 2000):edges[b + 1]])
            y[edges[b]:edges[b + 1]] = seg[-(edges[b + 1] - edges[b]):]
        out[:, ch] = y
    env = np.linspace(0, 1, n) ** 2.5
    return out * env[:, None]


def boom(dur: float = 4.0) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 52 * np.exp(-t * 0.25) + 30
    sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 1.1)
    sig *= np.minimum(1, t / 0.02)
    return sig


# --------------------------------------------------------------------------- mixing helpers

def add(buf: np.ndarray, sig: np.ndarray, at: float, gain: float = 1.0, pan: float = 0.5) -> None:
    i = int(at * SR)
    if i >= len(buf):
        return
    if sig.ndim == 1:
        sig = np.stack([sig * np.cos(pan * np.pi / 2), sig * np.sin(pan * np.pi / 2)], axis=1) * 1.41
    m = min(len(sig), len(buf) - i)
    buf[i:i + m] += sig[:m] * gain


def reverb_ir(seconds: float, rt60: float, seed: int) -> np.ndarray:
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = np.zeros((n, 2))
    for ch in range(2):
        noise = rng.standard_normal(n)
        lowband = sosfilt(butter(2, 2500, "low", fs=SR, output="sos"), noise)
        highband = noise - lowband
        ir[:, ch] = lowband * np.exp(-6.9 * t / rt60) + 0.5 * highband * np.exp(-6.9 * t / (rt60 * 0.4))
    pre = int(0.025 * SR)
    ir = np.concatenate([np.zeros((pre, 2)), ir])
    return ir / np.sqrt(np.sum(ir ** 2, axis=0, keepdims=True))


def apply_reverb(dry: np.ndarray, wet: float, rt60: float, seed: int) -> np.ndarray:
    ir = reverb_ir(rt60 * 1.3, rt60, seed)
    out = np.zeros_like(dry)
    for ch in range(2):
        out[:, ch] = fftconvolve(dry[:, ch], ir[:, ch])[: len(dry)]
    return dry * (1 - wet) + out * wet * 1.6


def peaking(x: np.ndarray, f0: float, gain_db: float, q: float) -> np.ndarray:
    """RBJ peaking EQ, applied per channel."""
    A = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    alpha = np.sin(w0) / (2 * q)
    b = np.array([1 + alpha * A, -2 * np.cos(w0), 1 - alpha * A])
    a = np.array([1 + alpha / A, -2 * np.cos(w0), 1 - alpha / A])
    return lfilter(b / a[0], a / a[0], x, axis=0)


def voice_envelope(voice: np.ndarray, n: int) -> np.ndarray:
    """0..1 envelope that is high wherever the narrator is speaking."""
    hop = int(0.01 * SR)
    frames = len(voice) // hop
    rms = np.sqrt(np.mean(voice[: frames * hop].reshape(frames, hop) ** 2, axis=1) + 1e-12)
    active = (20 * np.log10(rms) > -45).astype(float)
    # attack 60 ms, release 450 ms
    env = np.zeros(frames)
    level = 0.0
    for i, a in enumerate(active):
        coef = 0.85 if a > level else 0.978
        level = coef * level + (1 - coef) * a
        env[i] = level
    env = np.clip(env * 1.6, 0, 1)
    env = np.repeat(env, hop)
    out = np.zeros(n)
    m = min(n, len(env))
    out[:m] = env[:m]
    return out


# --------------------------------------------------------------------------- composition

def main() -> None:
    with open(os.path.join(ROOT, "video", "timeline.json")) as f:
        tl = json.load(f)
    total = tl["duration"]
    n = int(total * SR) + SR
    bed = np.zeros((n, 2))      # pads, drones, tides: ducked hard under the voice
    feat = np.zeros((n, 2))     # the musical demonstrations: ducked lightly
    keys = np.zeros((n, 2))     # felt piano phrases in the pauses

    scenes = {s["id"]: s for s in tl["scenes"]}
    lines = {l["id"]: l for l in tl["lines"]}

    def chords(seq, start, end, gain=0.11, bright=0.8, overlap=2.6):
        span = (end - start) / len(seq)
        for i, notes in enumerate(seq):
            s = start + i * span
            d = span + overlap
            for j, nm in enumerate(notes):
                g = gain * (1.0 if j else 1.25)
                add(bed, pad_note(hz(nm), d, attack=min(2.8, d / 2.5), release=min(3.2, d / 2.2),
                                  bright=bright), s, g)

    # Overture: A minor world, opening boom
    ov = scenes["overture"]
    add(bed, boom(5.0), 0.15, 0.22)
    chords([["A2", "E3", "A3", "B3", "C4", "E4"],
            ["F2", "C3", "F3", "A3", "E4"],
            ["C3", "G3", "C4", "D4", "E4"],
            ["E2", "B2", "E3", "A3", "B3"]], ov["start"], ov["end"], gain=0.10, bright=0.7)

    # Conductor: the Moon's key, with a slow tidal swell
    co = scenes["conductor"]
    chords([["A2", "E3", "G3", "B3", "C4"],
            ["F2", "C3", "E3", "G3", "A3"],
            ["C3", "G3", "C4", "E4"],
            ["E2", "B2", "D3", "G3"]], co["start"], co["end"], gain=0.10, bright=0.75)

    # Triad: quiet C pedal, then C, E, G struck as each planet is named
    tr = scenes["triad"]
    l12, l13, l14, l15, l16 = (lines[k] for k in ("L12", "L13", "L14", "L15", "L16"))
    chords([["A2", "E3", "G3", "C4"]], tr["start"], l12["start"] - 0.4, gain=0.09, bright=0.6)
    chords([["C2", "G2", "C3"]], l12["start"] - 0.8, l15["start"], gain=0.08, bright=0.5, overlap=1.0)
    for line, note, pan in ((l12, "C4", 0.4), (l13, "E4", 0.5), (l14, "G4", 0.6)):
        add(feat, piano_note(hz(note), 7.0, vel=1.0, felt=0.45), line["start"] - 0.32, 0.30, pan)
    for j, note in enumerate(("C3", "C4", "E4", "G4", "C5")):
        add(feat, piano_note(hz(note), 7.5, vel=1.0, felt=0.45), l15["start"] - 0.34 + j * 0.012, 0.22, 0.3 + j * 0.1)
    chords([["C2", "G2", "E3", "G3", "D4"]], l15["start"], l16["start"], gain=0.09, bright=0.7)
    chords([["F2", "C3", "E3", "A3"]], l16["start"] - 0.5, tr["end"], gain=0.09, bright=0.7)
    for j, note in enumerate(("A4", "C5", "E5", "G5", "E5", "C5")):
        add(feat, piano_note(hz(note), 4.0, vel=0.8, felt=0.8), l16["start"] + 0.2 + j * 0.45, 0.10, 0.25 + 0.1 * j)

    # Power chord: open fifths, an A5 hit, then a wave-like crescendo
    pw = scenes["power"]
    l17, l18, l19, l20 = (lines[k] for k in ("L17", "L18", "L19", "L20"))
    chords([["A1", "A2", "E3"]], pw["start"], l18["start"], gain=0.10, bright=0.6)
    add(feat, power_chord(hz("A1"), 6.5), l18["start"] - 0.36, 0.14)
    chords([["F1", "F2", "C3"], ["G1", "G2", "D3"]], l18["start"] + 1.0, l20["start"], gain=0.10, bright=0.7)
    wave_len = l20["start"] - l19["start"] + 1.0
    swell = noise_swell(wave_len, 200, 3000)
    add(bed, swell, l19["start"], 0.020)
    chords([["A1", "A2", "E3", "A3", "C4"]], l20["start"] - 0.4, pw["end"], gain=0.10, bright=0.85)

    # Unison: two strings beat against each other, then glide into tune
    un = scenes["unison"]
    l21, l22, l23 = (lines[k] for k in ("L21", "L22", "L23"))
    chords([["A2", "E3"]], un["start"], un["end"], gain=0.08, bright=0.5)
    t0 = l21["start"] - 0.6
    t_hold = l22["start"] + 0.4      # keep beating until the line about beating starts
    t_lock = l22["start"] + 0.62 * (l22["end"] - l22["start"])
    t1 = l23["end"] + 0.8
    m = int((t1 - t0) * SR)
    tt = np.arange(m) / SR
    hold, lock = t_hold - t0, t_lock - t0
    detune = np.where(tt < hold, 5.0, 5.0 * np.clip(1 - (tt - hold) / (lock - hold), 0, 1) ** 1.5)
    env = np.minimum(1, tt / 1.2) * np.minimum(1, (tt[-1] - tt) / 1.8)
    a = string_tone(np.full(m, hz("A4")))
    b = string_tone(hz("A4") + detune)
    add(feat, a * env, t0, 0.075, 0.42)
    add(feat, b * env, t0, 0.075, 0.58)

    # Eleventh house: warmer, fuller, the crowd
    el = scenes["eleventh"]
    chords([["F2", "C3", "A3", "C4", "F4"],
            ["E2", "C3", "G3", "E4"],
            ["A2", "E3", "A3", "C4", "E4"],
            ["G2", "D3", "G3", "B3", "D4"]], el["start"], el["end"], gain=0.11, bright=0.9)
    pulse_bpm = 66
    beat = 60 / pulse_bpm
    tb = lines["L25"]["start"]
    while tb < el["end"] - 1.0:
        add(bed, boom(1.2) * 0.6, tb, 0.10)
        tb += beat * 2

    # Leo rising: riser, then a lift into C major and a sunrise bloom
    le = scenes["leo"]
    l29, l32, l34, l35 = (lines[k] for k in ("L29", "L32", "L34", "L35"))
    add(bed, noise_swell(3.4, 500, 9000), l29["start"] - 3.4, 0.03)
    add(bed, boom(5.0), l29["start"] - 0.05, 0.18)
    chords([["C2", "F3", "A3", "C4", "F4"],
            ["G2", "D3", "G3", "B3", "E4"],
            ["A2", "E3", "A3", "C4", "E4"],
            ["F2", "C3", "F3", "A3", "C4", "G4"]], l29["start"], l34["start"] - 0.4, gain=0.11, bright=1.0)
    final = total - (l34["start"] - 0.6)
    for j, nm in enumerate(("C2", "G2", "E3", "B3", "D4", "G4", "E5")):
        add(bed, pad_note(hz(nm), final, attack=2.0, release=min(5.5, final * 0.5), bright=1.1),
            l34["start"] - 0.6, 0.11 if j else 0.14)
    for j, note in enumerate(("C4", "E4", "G4", "B4", "D5", "G5")):
        add(feat, piano_note(hz(note), 6.0, vel=0.9, felt=0.5), l34["start"] - 0.5 + j * 0.16, 0.12, 0.25 + 0.1 * j)
    add(feat, piano_note(hz("C5"), 7.0, vel=0.9, felt=0.5), l35["end"] + 0.5, 0.16, 0.5)
    add(feat, piano_note(hz("G5"), 7.0, vel=0.8, felt=0.6), l35["end"] + 0.9, 0.10, 0.6)
    add(feat, piano_note(hz("C6"), 7.0, vel=0.7, felt=0.7), l35["end"] + 1.3, 0.08, 0.7)

    # Moonlit shimmer + distant tide across the Cancer scenes
    shimmer_end = le["start"]
    m = int(shimmer_end * SR)
    tt = np.arange(m) / SR
    sh = np.zeros(m)
    for f, rate, ph in ((hz("E6"), 0.05, 0.0), (hz("A6"), 0.037, 1.3), (hz("B6"), 0.029, 2.1)):
        sh += np.sin(2 * np.pi * f * tt) * (0.5 + 0.5 * np.sin(2 * np.pi * rate * tt + ph)) ** 2
    sh *= np.minimum(1, tt / 6.0)
    add(bed, sh, 0.0, 0.010, 0.5)
    tide = sosfilt(butter(2, 650, "low", fs=SR, output="sos"), RNG.standard_normal((m, 2)), axis=0)
    tide *= (0.5 + 0.5 * np.sin(2 * np.pi * 0.085 * tt - np.pi / 2))[:, None] ** 2
    tide *= np.minimum(1, tt / 4.0)[:, None]
    add(bed, tide, 0.0, 0.035)

    # Felt piano answers in the pauses (A minor pentatonic, C major in the finale)
    phrase_cancer = ["E5", "A4", "C5", "B4", "G4", "E5", "D5", "A4", "C5", "E4"]
    phrase_leo = ["G4", "C5", "E5", "D5", "G5", "E5"]
    busy = {"L11", "L12", "L13", "L14", "L15", "L16", "L17", "L18", "L21", "L22", "L23", "L33", "L34", "L35"}
    k = 0
    ordered = tl["lines"]
    for i, line in enumerate(ordered[:-1]):
        gap = ordered[i + 1]["start"] - line["end"]
        if line["id"] in busy or gap < 0.45:
            continue
        phrase = phrase_leo if line["scene"] == "leo" else phrase_cancer
        count = 3 if gap > 1.2 else 1
        for j in range(count):
            note = phrase[(k + j) % len(phrase)]
            add(keys, piano_note(hz(note), 4.5, vel=0.9, felt=0.7), line["end"] + 0.08 + j * 0.42,
                0.10, 0.35 + 0.15 * ((k + j) % 3))
        k += count

    # ------------------------------------------------------------------- mixdown
    bed = apply_reverb(bed, 0.45, 4.2, 1)
    feat = apply_reverb(feat, 0.35, 3.2, 2)
    keys = apply_reverb(keys, 0.55, 4.0, 3)

    voice, vsr = sf.read(os.path.join(ROOT, "video", "assets", "audio", "narration.flac"))
    assert vsr == SR, vsr
    if voice.ndim > 1:
        voice = voice.mean(axis=1)
    duck = voice_envelope(voice, n)[:, None]
    bed *= 1 - 0.55 * duck      # about -7 dB under speech
    feat *= 1 - 0.25 * duck     # demonstrations stay audible
    keys *= 1 - 0.45 * duck

    music = bed + feat + keys
    # Carve the voice's presence band out of the music
    music = peaking(music, 2600, -5.0, 0.8)
    music = peaking(music, 1200, -2.0, 1.0)
    music = sosfilt(butter(2, 30, "high", fs=SR, output="sos"), music, axis=0)

    # Fades
    fade_in = int(1.2 * SR)
    music[:fade_in] *= np.linspace(0, 1, fade_in)[:, None]
    fade_out = int(4.5 * SR)
    end = int(total * SR)
    music[end - fade_out:end] *= np.linspace(1, 0, fade_out)[:, None] ** 1.5
    music = music[:end]

    # Level the score a fixed distance under the narration (both measured as stereo)
    meter = pyln.Meter(SR)
    v = np.zeros(end)
    v[: min(end, len(voice))] = voice[:end]
    voice_lufs = meter.integrated_loudness(np.stack([v, v], axis=1))
    music *= 10 ** ((voice_lufs - MUSIC_BELOW_VOICE_LU - meter.integrated_loudness(music)) / 20)

    # Peak guard: ride the music down wherever voice + music would clip
    ceiling = 0.93
    hop = int(0.005 * SR)
    blocks = end // hop
    vb = np.abs(v[: blocks * hop]).reshape(blocks, hop).max(axis=1)
    mb = np.abs(music[: blocks * hop]).max(axis=1).reshape(blocks, hop).max(axis=1)
    g = np.clip((ceiling - vb) / np.maximum(mb, 1e-9), 0, 1)
    g = np.minimum.reduce([np.roll(g, s) for s in range(-8, 9)])  # look-around so gain drops early
    g = lfilter([0.2], [1, -0.8], g)
    gain = np.ones(end)
    gain[: blocks * hop] = np.repeat(np.minimum(g, 1), hop)
    music *= gain[:, None]

    out = os.path.join(ROOT, "video", "assets", "audio", "score.flac")
    sf.write(out, music.astype(np.float32), SR, format="FLAC", subtype="PCM_24")

    preview = music + v[:, None]
    print(f"voice {voice_lufs:.1f} LUFS, score {meter.integrated_loudness(music):.1f} LUFS, "
          f"mix {meter.integrated_loudness(preview):.1f} LUFS")
    sf.write(os.path.join(ROOT, "build", "mix_preview.wav"), preview.astype(np.float32), SR, subtype="PCM_24")
    print(f"score: {out}  ({total:.1f}s)  peak {np.max(np.abs(music)):.3f}  mix peak {np.max(np.abs(preview)):.3f}")


if __name__ == "__main__":
    main()
