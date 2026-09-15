"""Record one gameplay session: video + inputs on a single clock.

    python record_session.py --name rung1_carcass
    python record_session.py --name rung1_carcass --minutes 12 --width 640 --height 360

MUST be run from an ADMINISTRATOR console. Measured 2026-09-12: from an ordinary
console the game's input never reaches us -- you get a recording with no labels
and no error message.

Hotkeys while recording (they work with the game focused):
    F9   mark a fight boundary   (first press = fight_start, next = fight_end, ...)
    F8   mark the last stretch as SCRATCH -- a bad take to drop at build time
    F10  stop recording and write everything out

Writes one folder per session under --out:
    video.mp4     the frames, encoded as they arrive (never buffered in RAM)
    frames.csv    index,t  -- the REAL timestamp of every frame. Authoritative.
    events.csv    t,kind,name,state  -- every key, mouse button, mark
    manifest.json settings, counts, achieved FPS, duplicate rate

The video's own frame timing is nominal. Trust frames.csv, never the frame
index: 12.6% of delivered frames repeat, so the index drifts from real time.
"""

import argparse
import csv
import json
import os
import time

import cv2
import numpy as np
from pynput import keyboard, mouse

try:
    import bettercam as grab
except ImportError:                      # the older, unmaintained package
    import dxcam as grab

T0 = time.perf_counter()
events = []                              # (t, kind, name, state)
state = {"stop": False, "marks": 0}


def now():
    return time.perf_counter() - T0


def key_name(key):
    """Name the PHYSICAL key: shift/ctrl change key.char, the vk code is stable."""
    if isinstance(key, keyboard.Key):
        return str(key)
    vk = getattr(key, "vk", None)
    if vk is None:
        return str(key)
    if 0x30 <= vk <= 0x5A:
        return chr(vk).lower()
    return f"vk{vk}"


down_now = set()                         # keys currently held, to kill auto-repeat


def on_press(key):
    if key == keyboard.Key.f10:
        state["stop"] = True
        return
    if key == keyboard.Key.f9:
        state["marks"] += 1
        kind = "fight_start" if state["marks"] % 2 == 1 else "fight_end"
        events.append((now(), "mark", kind, ""))
        print(f"  [{now():7.1f}s] {kind}")
        return
    if key == keyboard.Key.f8:
        events.append((now(), "mark", "scratch", ""))
        print(f"  [{now():7.1f}s] scratch -- this stretch gets dropped at build time")
        return
    name = key_name(key)
    # Windows repeats WM_KEYDOWN while a key is held, so on_press fires over and
    # over for ONE press. Measured: 605 'down' events for 45 real presses of 'w'.
    # Keep only the transition -- a down that follows a down is not a new press.
    if name in down_now:
        return
    down_now.add(name)
    events.append((now(), "key", name, "down"))


def on_release(key):
    name = key_name(key)
    down_now.discard(name)
    events.append((now(), "key", name, "up"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--name", required=True,
                    help="what this session is, e.g. rung1_carcass or boss_parade_master")
    ap.add_argument("--minutes", type=float, default=20.0, help="hard stop (F10 stops sooner)")
    ap.add_argument("--fps", type=int, default=60)
    ap.add_argument("--width", type=int, default=640)
    ap.add_argument("--height", type=int, default=360)
    ap.add_argument("--out", default=os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                                  "..", "..", "data", "lop", "raw"))
    ap.add_argument("--note", default="", help="anything the manifest should remember")
    args = ap.parse_args()

    stamp = time.strftime("%Y%m%d_%H%M%S")
    session = os.path.abspath(os.path.join(args.out, f"{stamp}_{args.name}"))
    os.makedirs(session, exist_ok=True)

    kl = keyboard.Listener(on_press=on_press, on_release=on_release)
    ml = mouse.Listener(
        on_click=lambda x, y, b, p: events.append(
            (now(), "mouse_button", str(b), "down" if p else "up")),
        on_move=lambda x, y: events.append((now(), "mouse_move", f"{x},{y}", "")),
    )
    kl.start()
    ml.start()

    cam = grab.create(output_idx=0, output_color="BGR")
    cam.start(target_fps=args.fps, video_mode=True)
    writer = cv2.VideoWriter(os.path.join(session, "video.mp4"),
                             cv2.VideoWriter_fourcc(*"mp4v"), args.fps,
                             (args.width, args.height))

    print(f"\nRecording to {session}")
    print(f"  target {args.fps} FPS at {args.width}x{args.height}, hard stop in {args.minutes:.0f} min")
    print("  F9 = fight boundary    F8 = scratch this take    F10 = stop\n")
    print("Tab into the game NOW.\n")

    stamps, thumb_prev, dups = [], None, 0
    t_end = now() + args.minutes * 60.0
    last = None
    try:
        while not state["stop"] and now() < t_end:
            frame = cam.get_latest_frame()
            if frame is None:
                continue
            t = now()
            if last is not None and t - last < (0.5 / args.fps):
                continue                          # the same frame served twice
            last = t
            small = cv2.resize(frame, (args.width, args.height), interpolation=cv2.INTER_AREA)
            # count exact repeats cheaply, on a thumbnail, so the manifest is honest
            thumb = small[::8, ::8]
            if thumb_prev is not None and np.array_equal(thumb, thumb_prev):
                dups += 1
            thumb_prev = thumb
            writer.write(small)
            stamps.append(t)
    except KeyboardInterrupt:
        print("interrupted -- writing what we have")
    finally:
        cam.stop()
        writer.release()
        kl.stop()
        ml.stop()
        try:
            del cam
            grab.clean_up()
        except Exception:
            pass

    if not stamps:
        print("\nNO FRAMES CAPTURED. Almost always exclusive fullscreen -- set the")
        print("game to BORDERLESS WINDOWED and try again.")
        return

    with open(os.path.join(session, "frames.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["index", "t"])
        w.writerows(enumerate(stamps))

    with open(os.path.join(session, "events.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["t", "kind", "name", "state"])
        w.writerows(events)

    ts = np.asarray(stamps)
    gaps = np.diff(ts)
    dur = float(ts[-1] - ts[0])
    fights = sum(1 for e in events if e[2] == "fight_start")
    keys = sum(1 for e in events if e[1] == "key" and e[3] == "down")
    clicks = sum(1 for e in events if e[1] == "mouse_button" and e[3] == "down")

    manifest = {
        "name": args.name,
        "recorded": stamp,
        "note": args.note,
        "seconds": round(dur, 2),
        "frames": len(ts),
        "fps_delivered": round(len(ts) / dur, 2) if dur else 0,
        "fps_unique": round((len(ts) - dups) / dur, 2) if dur else 0,
        "duplicate_fraction": round(dups / len(ts), 4),
        "worst_gap_ms": round(float(gaps.max() * 1000), 1) if len(gaps) else None,
        "long_gaps": int((gaps > 1.8 / args.fps).sum()) if len(gaps) else 0,
        "resolution": [args.width, args.height],
        "target_fps": args.fps,
        "fights_marked": fights,
        "scratch_marks": sum(1 for e in events if e[2] == "scratch"),
        "key_presses": keys,
        "mouse_presses": clicks,
        # Lies of P DEFAULT keyboard-and-mouse binds, confirmed against the game
        # and the wiki 2026-09-12. Correct these if you ever rebind: the dataset
        # builder reads this map, not a copy of it.
        "keybinds": {
            "w": "forward", "a": "left", "s": "back", "d": "right",
            "Key.space": "dash_dodge",          # also jump forward
            "Key.shift": "guard",               # a TAP is the perfect guard / parry
            "Button.left": "light_attack",
            "Button.right": "heavy_attack",     # held = charged
            "Button.middle": "lock_on",
            "f": "fable_arts",
            "Key.ctrl_l": "legion_arm",
            "r": "use_belt_item",               # potion / grindstone
            "t": "belt_slot_upper", "g": "belt_slot_lower",
            "x": "switch_legion_arm", "Key.tab": "switch_weapon",
            "e": "interact", "c": "records", "Key.esc": "menu",
        },
    }
    with open(os.path.join(session, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"\n  duration      : {dur:.1f} s")
    print(f"  frames        : {len(ts)}   delivered {manifest['fps_delivered']} FPS, "
          f"unique {manifest['fps_unique']} FPS ({manifest['duplicate_fraction']*100:.1f}% repeats)")
    print(f"  worst gap     : {manifest['worst_gap_ms']} ms   long gaps: {manifest['long_gaps']}")
    print(f"  fights marked : {fights}   scratch marks: {manifest['scratch_marks']}")
    print(f"  inputs        : {keys} key presses, {clicks} mouse presses")
    print(f"\n  -> {session}")

    if manifest["long_gaps"] > 0:
        print("\n  [WARN] frames were dropped. Check what else is running.")
    if keys == 0 or clicks == 0:
        print("\n  [FAIL] no inputs logged -- this console is probably NOT elevated.")
        print("         The recording is unusable. Re-run as administrator.")
    if fights == 0:
        print("\n  [WARN] no fight boundaries marked (F9). Usable, but you will have")
        print("         to find the fights by hand later.")


if __name__ == "__main__":
    main()
