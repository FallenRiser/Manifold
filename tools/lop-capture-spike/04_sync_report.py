"""Spike 4 — measure the sync instead of eyeballing it.

    python 04_sync_report.py
    python 04_sync_report.py --out "C:\\path\\to\\out" --key w

For each of the first few presses, print how much the picture is MOVING at each
frame offset (mean absolute difference from the previous frame, 0-255). A swing
is a big, fast change on screen, so motion onset should appear at a small
POSITIVE offset. Onset at a negative offset means the clocks are out of step.

Also writes out/sync/contact_<i>.png: every frame in the window, upscaled and
laid out left-to-right, so one image shows the whole sequence.
"""

import argparse
import csv
import os

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(HERE, "out"), help="the out/ folder to read")
    ap.add_argument("--key", default=None, help="align on this key instead of mouse buttons")
    ap.add_argument("--n", type=int, default=3)
    ap.add_argument("--before", type=float, default=100.0, help="ms before the press")
    ap.add_argument("--after", type=float, default=200.0, help="ms after")
    args = ap.parse_args()

    npz = np.load(os.path.join(args.out, "frames.npz"))
    frames, t = npz["frames"].astype(np.int16), npz["t"]

    with open(os.path.join(args.out, "events.csv"), encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    if args.key:
        presses = [float(r["t"]) for r in rows
                   if r["state"] == "down" and r["name"] == args.key]
        label = args.key
    else:
        presses = [float(r["t"]) for r in rows
                   if r["kind"] == "mouse_button" and r["state"] == "down"]
        label = "mouse button"

    if not presses:
        print(f"No presses found for '{label}'.")
        return

    # motion[i] = how much frame i differs from frame i-1, averaged over pixels
    motion = np.zeros(len(frames))
    motion[1:] = np.abs(np.diff(frames, axis=0)).mean(axis=(1, 2))
    baseline = float(np.median(motion))
    print(f"aligning on: {label}   frames: {len(frames)}   "
          f"median motion across the whole recording: {baseline:.2f}\n")

    sync_dir = os.path.join(args.out, "sync")
    os.makedirs(sync_dir, exist_ok=True)

    for i, tp in enumerate(presses[: args.n]):
        lo, hi = tp - args.before / 1000.0, tp + args.after / 1000.0
        idx = np.where((t >= lo) & (t <= hi))[0]
        print(f"press {i}  t = {tp:.3f}s")
        print(f"   {'offset':>9}   {'motion':>7}   (bar = motion, | = the press)")
        onset = None
        for j in idx:
            off = (t[j] - tp) * 1000.0
            m = motion[j]
            mark = "|" if abs(off) < 8.5 else " "
            bar = "#" * min(40, int(m / max(baseline, 0.05) * 4))
            if onset is None and off > 0 and m > baseline * 3:
                onset = off
            print(f"   {off:+8.1f}ms {mark} {m:7.2f}   {bar}")
        if onset is None:
            print("   -> no clear motion onset after the press in this window")
        else:
            print(f"   -> motion onset at {onset:+.1f} ms after the press")

        # a contact sheet: every frame in the window, 3x upscaled, in a row
        strip = [cv2.resize(frames[j].astype(np.uint8), None, fx=3, fy=3,
                            interpolation=cv2.INTER_NEAREST) for j in idx]
        sheet = np.hstack(strip) if strip else None
        if sheet is not None:
            cv2.imwrite(os.path.join(sync_dir, f"contact_{i}.png"), sheet)
        print()

    print(f"  contact sheets -> {sync_dir}")
    print("\n  Read it like this: motion should be near the baseline before the press")
    print("  and jump a few frames AFTER it (animation start-up takes a frame or two).")
    print("  A jump that begins BEFORE the press means the clocks are offset.")


if __name__ == "__main__":
    main()
