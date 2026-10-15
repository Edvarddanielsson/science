"""Inject the narration timeline into the composition template -> video/index.html.

Run: python3 -I tools/build_index.py
"""

import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OVERLAP = 0.5  # each scene clip opens/closes half a second either side for crossfades


def main() -> None:
    with open(os.path.join(ROOT, "video", "timeline.json")) as f:
        tl = json.load(f)
    with open(os.path.join(ROOT, "tools", "index.template.html")) as f:
        html = f.read()

    dur = tl["duration"]
    html = html.replace("{{DUR}}", f"{dur:.3f}")
    for sc in tl["scenes"]:
        ds = max(0.0, sc["start"] - OVERLAP)
        de = min(dur, sc["end"] + OVERLAP)
        html = html.replace("{{%s.ds}}" % sc["id"], f"{ds:.3f}")
        html = html.replace("{{%s.dd}}" % sc["id"], f"{de - ds:.3f}")
    assert "{{" not in html, "unfilled placeholder"
    html = html.replace("/*TIMELINE*/ {}", json.dumps(tl, separators=(",", ":"), ensure_ascii=False))

    with open(os.path.join(ROOT, "video", "index.html"), "w") as f:
        f.write(html)
    print(f"video/index.html  duration {dur:.2f}s  scenes {len(tl['scenes'])}")


if __name__ == "__main__":
    main()
