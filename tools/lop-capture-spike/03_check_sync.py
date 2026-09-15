"""Spike 3 — do the frames and the keypresses actually line up?

    python 03_check_sync.py                 # first 3 attack presses
    python 03_check_sync.py --key j --n 5

Dumps the frames spanning a window around each chosen keypress into
out/sync/, named by their offset from the press in milliseconds.

WHAT TO LOOK FOR: the swing must begin in the frames named with a POSITIVE
offset. If it has already started at -33 ms or -50 ms, your clocks are offset —
measure by how much before you collect a single episode of real data, because
every label you make afterwards inherits that error.
"""

import argparse
import csv
import os

import cv2
import numpy as np

HERE = os.path.dirname(__file__)
OUT = os.path.join(HERE, "out")
SYNC = os.path.join(OUT, "sync")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--key", default=None,
                    help="which key/button to align on; default = the first mouse button press")
    ap.add_argument("--n", type=int, default=3, help="how many presses to dump")
    ap.add_argument("--before", type=float, default=100.0, help="ms of frames before the press")
    ap.add_argument("--after", type=float, default=200.0, help="ms of frames after")
    args = ap.parse_args()

    npz = np.load(os.path.join(OUT, "frames.npz"))
    frames, t = npz["frames"], npz["t"]

    with open(os.path.join(OUT, "events.csv"), encoding="utf-8") as f:
        rows = [r for r in csv.DictReader(f)]

    if args.key:
        presses = [float(r["t"]) for r in rows
                   if r["state"] == "down" and r["name"].endswith(args.key)]
        label = args.key
    else:
        presses = [float(r["t"]) for r in rows
                   if r["kind"] == "mouse_button" and r["state"] == "down"]
        label = "mouse"

    if not presses:
        print(f"No presses found for '{label}'. Events present:")
        seen = sorted({r["name"] for r in rows if r["state"] == "down"})
        print("  " + " ".join(seen[:40]))
        return

    os.makedirs(SYNC, exist_ok=True)
    for i, tp in enumerate(presses[: args.n]):
        lo, hi = tp - args.before / 1000.0, tp + args.after / 1000.0
        idx = np.where((t >= lo) & (t <= hi))[0]
        for j in idx:
            offset_ms = (t[j] - tp) * 1000.0
            name = f"press{i:02d}_{offset_ms:+07.1f}ms.png"
            cv2.imwrite(os.path.join(SYNC, name), frames[j])
        print(f"press {i}: t={tp:.3f}s -> {len(idx)} frames")

    print(f"\n  -> {SYNC}")
    print("\n  Flip through them in order. The action must START in a frame with a")
    print("  POSITIVE offset. If it starts earlier, note the offset and correct it.")


if __name__ == "__main__":
    main()
