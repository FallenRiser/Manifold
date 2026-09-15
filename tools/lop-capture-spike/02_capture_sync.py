"""Spike 2 — record frames and inputs on ONE clock, and report whether the
capture can actually keep up.

    python 02_capture_sync.py --seconds 30 --fps 60 --width 160 --height 90

Every timestamp — frames and events alike — comes from a single
time.perf_counter() origin. That is the whole trick: two clocks drift, and you
cannot recover the offset after the fact.

Writes out/frames.npz (downsampled grayscale + timestamps) and out/events.csv.
"""

import argparse
import csv
import os
import time

import cv2
import numpy as np
from pynput import keyboard, mouse

try:
    import bettercam as grab
except ImportError:  # the older, unmaintained package
    import dxcam as grab

OUT = os.path.join(os.path.dirname(__file__), "out")
os.makedirs(OUT, exist_ok=True)

T0 = time.perf_counter()
events = []


def now():
    return time.perf_counter() - T0


def key_name(key):
    """A name for the PHYSICAL key, stable under shift and ctrl.

    key.char is not that name: holding shift turns 'w' into 'W', and holding
    ctrl turns it into '\\x17'. One physical key would then label three
    different actions. The virtual-key code does not move, so use it.
    """
    if isinstance(key, keyboard.Key):
        return str(key)                     # Key.space, Key.shift, Key.ctrl_l, ...
    vk = getattr(key, "vk", None)
    if vk is None:
        return str(key)
    if 0x30 <= vk <= 0x5A:                  # '0'-'9' and 'A'-'Z'
        return chr(vk).lower()
    return f"vk{vk}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--seconds", type=float, default=30.0)
    ap.add_argument("--fps", type=int, default=60)
    ap.add_argument("--width", type=int, default=160)
    ap.add_argument("--height", type=int, default=90)
    args = ap.parse_args()

    kl = keyboard.Listener(
        on_press=lambda k: events.append((now(), "key", key_name(k), "down")),
        on_release=lambda k: events.append((now(), "key", key_name(k), "up")),
    )
    ml = mouse.Listener(
        on_click=lambda x, y, b, p: events.append(
            (now(), "mouse_button", str(b), "down" if p else "up")
        ),
    )
    kl.start()
    ml.start()

    cam = grab.create(output_idx=0, output_color="GRAY")
    cam.start(target_fps=args.fps, video_mode=True)

    print(f"Recording {args.seconds:.0f} s at a target of {args.fps} FPS.")
    print("Tab into the game NOW.\n")
    print("  While recording: stand still, then swing three times with a clear")
    print("  pause between each — that is what step 4 checks the sync against.\n")

    frames, stamps = [], []
    t_end = now() + args.seconds
    last = None
    try:
        while now() < t_end:
            frame = cam.get_latest_frame()
            if frame is None:
                continue
            t = now()
            if last is not None and t - last < (0.5 / args.fps):
                continue  # same frame served twice; don't double-count
            last = t
            small = cv2.resize(frame, (args.width, args.height), interpolation=cv2.INTER_AREA)
            frames.append(small)
            stamps.append(t)
    except KeyboardInterrupt:
        print("interrupted — writing what we have")
    finally:
        cam.stop()
        kl.stop()
        ml.stop()
        # Release the COM objects while the interpreter is still healthy. Without
        # this, comtypes can raise an access violation from __del__ at shutdown --
        # noisy, but harmless: the files below are already written by then.
        try:
            del cam
            grab.clean_up()
        except Exception:
            pass

    if not frames:
        print("\nNO FRAMES CAPTURED.")
        print("  Almost always exclusive fullscreen. Set the game to BORDERLESS")
        print("  WINDOWED and run this again.")
        return

    arr = np.asarray(frames, dtype=np.uint8)
    ts = np.asarray(stamps, dtype=np.float64)
    np.savez_compressed(os.path.join(OUT, "frames.npz"), frames=arr, t=ts)

    with open(os.path.join(OUT, "events.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["t", "kind", "name", "state"])
        w.writerows(events)

    gaps = np.diff(ts)
    dur = ts[-1] - ts[0]
    achieved = len(ts) / dur if dur > 0 else 0.0
    target_gap = 1.0 / args.fps
    dropped = int((gaps > target_gap * 1.8).sum())

    print(f"\n  frames        : {len(ts)}  ({arr.shape[2]}x{arr.shape[1]} grayscale)")
    print(f"  duration      : {dur:.1f} s")
    print(f"  achieved FPS  : {achieved:.1f}   (target {args.fps})")
    print(f"  median gap    : {np.median(gaps) * 1000:.1f} ms")
    print(f"  worst gap     : {gaps.max() * 1000:.1f} ms")
    print(f"  long gaps     : {dropped}  (> 1.8x the target interval)")
    print(f"  input events  : {len(events)}")
    print(f"\n  -> {OUT}")

    if achieved < 30:
        print("\n  [WARN] under 30 FPS. Record at 30 and note it — it halves your")
        print("         timing resolution and belongs in the latency budget.")
    if not events:
        print("\n  [FAIL] no input events. Run 01_input_probe.py on its own first.")


if __name__ == "__main__":
    main()
