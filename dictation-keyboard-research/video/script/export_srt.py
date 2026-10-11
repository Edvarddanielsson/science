"""Write the caption chunks from src/timeline.json as an .srt subtitle file.

Usage:
    python export_srt.py <output.srt>
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def stamp(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main():
    with open(os.path.join(HERE, "..", "src", "timeline.json"), encoding="utf-8") as f:
        timeline = json.load(f)
    lines = []
    for i, c in enumerate(timeline["captions"], 1):
        lines += [str(i), f"{stamp(c['start'])} --> {stamp(c['end'])}", c["text"], ""]
    with open(sys.argv[1], "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"wrote {len(timeline['captions'])} cues to {sys.argv[1]}")


if __name__ == "__main__":
    main()
