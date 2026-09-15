"""Turn raw sessions into (frame, action) pairs for behaviour cloning.

    python build_dataset.py --raw "C:\\Users\\Shlok Sheth\\data\\lop\\raw"
    python build_dataset.py --hz 20 --width 160 --height 90 --all

Reads every session folder under --raw (video.mp4 + frames.csv + events.csv +
manifest.json) and writes one dataset.npz plus a summary.json under --out.

WHAT IT DOES, and why each step exists:

  * Samples at a FIXED rate (--hz), picking the frame whose real timestamp is
    nearest. Never by frame index: ~17% of delivered frames are exact repeats,
    so the index drifts away from wall-clock time as a session runs.

  * Splits actions into HELD and PRESSED. Holding 'w' for two seconds is one
    state that persists; tapping guard is an event that happens at an instant.
    Encoding a parry as "shift was held during this 50 ms" throws away the only
    thing that matters about it. So each sample carries both:
        hold_*   the key was down at the sample instant
        press_*  the key went down during this sample's window
    Multi-hot, not one-of: you really can dodge while moving.

  * Counts a press from TRANSITIONS only. Windows repeats WM_KEYDOWN while a
    key is held (measured: 605 'down' events for 45 real presses of 'w'), so a
    down that follows a down without an up is not a new press. Sessions
    recorded before that fix are still usable because of this.

  * Keeps only marked fight time by default, and drops the --scratch-seconds
    before any F8 mark. Walk-back time is the main thing that dilutes a BC set.

  * Records which session every sample came from, because train/validation must
    be split BY SESSION. Neighbouring frames are nearly identical; a random
    frame split leaks the answer and reports a score you cannot reproduce.
"""

import argparse
import csv
import glob
import json
import os

import cv2
import numpy as np

# Actions worth a column, keyed by the action names in manifest.json's keybinds.
# Anything else the manifest maps (menu, records, belt-slot switching) is ignored.
HELD_ACTIONS = ["forward", "back", "left", "right", "guard"]
PRESS_ACTIONS = ["light_attack", "heavy_attack", "guard", "dash_dodge",
                 "use_belt_item", "legion_arm"]
# Dropped 2026-09-12 after three sessions: fable_arts and lock_on were pressed
# exactly ZERO times, so their columns were all-zero. Add them back here if a
# later session actually uses them.

# Columns with fewer than --min-count positives are pruned at build time. NOTE
# what pruning means: the frames stay, so an action you drop is relabelled as
# "did nothing" rather than removed. That is a lie the model will learn, and it
# is only an acceptable one while the action is too rare to learn anyway.
# --min-count 0 keeps everything.


def load_session(folder):
    with open(os.path.join(folder, "manifest.json"), encoding="utf-8") as f:
        manifest = json.load(f)
    with open(os.path.join(folder, "frames.csv"), encoding="utf-8") as f:
        t_frames = np.array([float(r["t"]) for r in csv.DictReader(f)])
    with open(os.path.join(folder, "events.csv"), encoding="utf-8") as f:
        events = list(csv.DictReader(f))
    return manifest, t_frames, events


def intervals_and_presses(events, keymap):
    """(action -> [(down_t, up_t)], action -> [press_t]) from raw key events."""
    held = {a: [] for a in set(keymap.values())}
    presses = {a: [] for a in set(keymap.values())}
    open_at = {}
    end_t = max((float(e["t"]) for e in events), default=0.0)
    for e in events:
        if e["kind"] not in ("key", "mouse_button"):
            continue
        action = keymap.get(e["name"])
        if action is None:
            continue
        t = float(e["t"])
        if e["state"] == "down":
            if e["name"] in open_at:
                continue                      # auto-repeat, not a new press
            open_at[e["name"]] = t
            presses[action].append(t)
        elif e["state"] == "up" and e["name"] in open_at:
            held[action].append((open_at.pop(e["name"]), t))
    for name, t0 in open_at.items():          # still down when recording stopped
        held[keymap[name]].append((t0, end_t))
    return held, presses


def keep_windows(events, manifest, use_all, scratch_seconds):
    """The time ranges worth sampling: marked fights, minus scratch stretches."""
    end_t = max((float(e["t"]) for e in events), default=0.0)
    marks = [(float(e["t"]), e["name"]) for e in events if e["kind"] == "mark"]
    fights, open_t = [], None
    for t, name in marks:
        if name == "fight_start":
            open_t = t
        elif name == "fight_end" and open_t is not None:
            fights.append((open_t, t))
            open_t = None
    if open_t is not None:
        fights.append((open_t, end_t))
    if use_all or not fights:
        fights = [(0.0, end_t)]

    scratch = [(max(0.0, t - scratch_seconds), t) for t, n in marks if n == "scratch"]
    out = []
    for a, b in fights:                        # subtract every scratch range
        pieces = [(a, b)]
        for s0, s1 in scratch:
            nxt = []
            for p0, p1 in pieces:
                if s1 <= p0 or s0 >= p1:
                    nxt.append((p0, p1))
                    continue
                if p0 < s0:
                    nxt.append((p0, s0))
                if s1 < p1:
                    nxt.append((s1, p1))
            pieces = nxt
        out.extend(pieces)
    return [(a, b) for a, b in out if b - a > 0.2], fights


def build(folder, args, columns):
    manifest, t_frames, events = load_session(folder)
    keymap = manifest["keybinds"]
    held, presses = intervals_and_presses(events, keymap)
    windows, fights = keep_windows(events, manifest, args.all, args.scratch_seconds)

    dt = 1.0 / args.hz
    sample_t = np.concatenate([np.arange(a, b, dt) for a, b in windows]) if windows \
        else np.array([])
    if not len(sample_t):
        print(f"  {os.path.basename(folder)}: nothing to sample")
        return None

    # nearest real frame to each sample instant, and how far off it was
    idx = np.searchsorted(t_frames, sample_t).clip(1, len(t_frames) - 1)
    pick = np.where(np.abs(t_frames[idx] - sample_t) < np.abs(t_frames[idx - 1] - sample_t),
                    idx, idx - 1)
    skew_ms = np.abs(t_frames[pick] - sample_t) * 1000.0

    labels = np.zeros((len(sample_t), len(columns)), dtype=np.uint8)
    for j, col in enumerate(columns):
        kind, action = col.split(":", 1)
        if kind == "hold":
            for a, b in held.get(action, []):
                labels[(sample_t >= a) & (sample_t < b), j] = 1
        else:
            for tp in presses.get(action, []):
                k = np.searchsorted(sample_t, tp) - 1     # the window containing it
                if 0 <= k < len(sample_t) and tp - sample_t[k] < dt:
                    labels[k, j] = 1

    # pull only the frames we kept, decoding the video once, in order
    wanted = sorted(set(pick.tolist()))
    where = {f: i for i, f in enumerate(wanted)}
    cap = cv2.VideoCapture(os.path.join(folder, "video.mp4"))
    store = np.zeros((len(wanted), args.height, args.width) if args.gray
                     else (len(wanted), args.height, args.width, 3), dtype=np.uint8)
    got, i, target = 0, 0, set(wanted)
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        if i in target:
            small = cv2.resize(frame, (args.width, args.height), interpolation=cv2.INTER_AREA)
            if args.gray:
                small = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
            store[where[i]] = small
            got += 1
        i += 1
    cap.release()
    if got < len(wanted):
        print(f"  [WARN] video ended early: {got} of {len(wanted)} frames decoded")
        keep = np.array([where[f] < got for f in pick])
        pick, labels, sample_t, skew_ms = pick[keep], labels[keep], sample_t[keep], skew_ms[keep]

    frames = store[[where[f] for f in pick]]
    print(f"  {os.path.basename(folder)}: {len(frames)} samples from "
          f"{sum(b - a for a, b in windows):.0f}s kept "
          f"({len(fights)} fight(s)), median frame skew {np.median(skew_ms):.1f} ms")
    return frames, labels, sample_t, skew_ms, manifest


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw", default=os.path.join(here, "..", "..", "data", "lop", "raw"))
    ap.add_argument("--out", default=os.path.join(here, "..", "..", "data", "lop", "processed"))
    ap.add_argument("--hz", type=float, default=20.0, help="samples per second")
    ap.add_argument("--width", type=int, default=160)
    ap.add_argument("--height", type=int, default=90)
    ap.add_argument("--gray", action="store_true", default=True)
    ap.add_argument("--color", dest="gray", action="store_false")
    ap.add_argument("--all", action="store_true",
                    help="use the whole session, not only marked fights")
    ap.add_argument("--scratch-seconds", type=float, default=15.0)
    ap.add_argument("--min-count", type=int, default=50,
                    help="prune action columns with fewer positives than this (0 = keep all)")
    ap.add_argument("--exclude", nargs="*", default=[],
                    help="skip sessions whose folder name contains any of these strings")
    args = ap.parse_args()

    sessions = sorted(d for d in glob.glob(os.path.join(args.raw, "*")) if
                      os.path.exists(os.path.join(d, "manifest.json")))
    if args.exclude:
        keep = [d for d in sessions
                if not any(s in os.path.basename(d) for s in args.exclude)]
        for d in sessions:
            if d not in keep:
                print(f"  excluding {os.path.basename(d)}")
        sessions = keep
    if not sessions:
        print(f"No sessions found under {os.path.abspath(args.raw)}")
        return

    columns = [f"hold:{a}" for a in HELD_ACTIONS] + [f"press:{a}" for a in PRESS_ACTIONS]
    print(f"{len(sessions)} session(s), sampling at {args.hz:g} Hz\n")

    F, L, T, S, names, skews = [], [], [], [], [], []
    for folder in sessions:
        out = build(folder, args, columns)
        if out is None:
            continue
        frames, labels, t, skew, manifest = out
        F.append(frames); L.append(labels); T.append(t); skews.append(skew)
        S.append(np.full(len(frames), len(names), dtype=np.int16))
        names.append(os.path.basename(folder))

    if not F:
        print("Nothing built.")
        return

    frames = np.concatenate(F); labels = np.concatenate(L)
    t = np.concatenate(T); session = np.concatenate(S); skew = np.concatenate(skews)

    # Prune columns too rare to learn. The frames stay; those actions become
    # "no input", so say so out loud rather than letting it happen quietly.
    pruned = []
    if args.min_count > 0:
        counts0 = labels.sum(axis=0)
        keep = counts0 >= args.min_count
        pruned = [(c, int(n)) for c, n, k in zip(columns, counts0, keep) if not k]
        if pruned:
            print("\n  pruned (fewer than "
                  f"{args.min_count} positives, now relabelled as no-input):")
            for c, n in pruned:
                print(f"    {c:22s} {n:5d}")
            labels = labels[:, keep]
            columns = [c for c, k in zip(columns, keep) if k]

    os.makedirs(args.out, exist_ok=True)
    path = os.path.join(os.path.abspath(args.out), "dataset.npz")
    np.savez_compressed(path, frames=frames, labels=labels, t=t, session=session,
                        columns=np.array(columns), sessions=np.array(names))

    counts = labels.sum(axis=0)
    idle = int((labels.sum(axis=1) == 0).sum())
    summary = {
        "samples": int(len(frames)),
        "hz": args.hz,
        "resolution": [args.width, args.height],
        "grayscale": bool(args.gray),
        "sessions": names,
        "minutes_kept": round(len(frames) / args.hz / 60.0, 2),
        "median_frame_skew_ms": round(float(np.median(skew)), 2),
        "no_input_fraction": round(idle / len(frames), 4),
        "pruned_columns": {c: n for c, n in pruned},
        "min_count": args.min_count,
        "column_counts": {c: int(n) for c, n in zip(columns, counts)},
    }
    with open(os.path.join(os.path.abspath(args.out), "summary.json"), "w",
              encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(f"\n  samples        : {len(frames)}  ({summary['minutes_kept']:.1f} min at {args.hz:g} Hz)")
    print(f"  frame shape    : {frames.shape[1:]}")
    print(f"  median skew    : {summary['median_frame_skew_ms']:.1f} ms "
          f"(sample instant vs the frame we used)")
    print(f"  no input at all: {idle} samples ({100*idle/len(frames):.1f}%)")
    print("\n  class balance:")
    for c, n in zip(columns, counts):
        bar = "#" * int(40 * n / max(counts.max(), 1))
        print(f"    {c:22s} {n:6d}  {100*n/len(frames):5.1f}%  {bar}")
    print(f"\n  -> {path}")
    print("\n  Split train/validation BY SESSION using the 'session' array, never by")
    print("  frame: neighbouring frames are near-identical and a random split leaks.")

    rare = [c for c, n in zip(columns, counts) if 0 < n < 25]
    if rare:
        print(f"\n  [WARN] barely present: {', '.join(rare)}")
        print("         Too rare to learn. Record more of these, or drop the column.")
    if len(names) < 2:
        print("\n  [WARN] one session only — you cannot hold a session out yet.")


if __name__ == "__main__":
    main()
