"""Spike 1 — do keyboard and mouse events reach us while the game has focus?

Run it, tab into the game, play for ~30 s, tab back out, press Esc here.
It answers three questions and prints a verdict for each:

  1. do key presses register while another window is focused?
  2. do mouse BUTTONS register?
  3. does mouse MOVEMENT register?  (expect "no" — games usually capture the
     cursor and read raw motion, so the absolute pointer never moves)

Nothing here is game-specific and nothing is sent anywhere; it prints to your
console and writes out/probe_events.csv.
"""

import csv
import os
import time
from collections import Counter

from pynput import keyboard, mouse

OUT = os.path.join(os.path.dirname(__file__), "out")
os.makedirs(OUT, exist_ok=True)

T0 = time.perf_counter()
events = []          # (t, kind, name, state)
counts = Counter()
move_positions = set()
_stop = False


def log(kind, name, state):
    events.append((round(time.perf_counter() - T0, 6), kind, name, state))
    counts[kind] += 1


def key_name(key):
    """A name for the PHYSICAL key, stable under shift and ctrl.

    key.char is not that name: holding shift turns 'w' into 'W', and holding
    ctrl turns it into '\\x17'. One physical key would then look like three
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


def on_press(key):
    global _stop
    if key == keyboard.Key.esc:
        _stop = True
        return False
    log("key", key_name(key), "down")


def on_release(key):
    log("key", key_name(key), "up")


def on_click(x, y, button, pressed):
    log("mouse_button", str(button), "down" if pressed else "up")


def on_move(x, y):
    # Sample sparsely: we only care WHETHER the pointer moves, not the full path.
    if counts["mouse_move"] % 20 == 0:
        move_positions.add((x, y))
    log("mouse_move", f"{x},{y}", "")


def main():
    print("Recording input. Tab into the game and play for ~30 s.")
    print("Then tab back here and press Esc.\n")

    ml = mouse.Listener(on_click=on_click, on_move=on_move)
    ml.start()
    with keyboard.Listener(on_press=on_press, on_release=on_release) as kl:
        kl.join()
    ml.stop()

    path = os.path.join(OUT, "probe_events.csv")
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["t", "kind", "name", "state"])
        w.writerows(events)

    dur = time.perf_counter() - T0
    keys_seen = {n for _, k, n, _ in events if k == "key"}

    print(f"\n{len(events)} events over {dur:.1f} s  ->  {path}\n")
    print(f"  keys           : {counts['key']:6d} events, {len(keys_seen)} distinct")
    print(f"  mouse buttons  : {counts['mouse_button']:6d} events")
    print(f"  mouse movement : {counts['mouse_move']:6d} events, "
          f"{len(move_positions)} distinct sampled positions\n")

    verdict("keyboard reaches us", counts["key"] > 0,
            "no key events at all — try running this as administrator")
    verdict("mouse buttons reach us", counts["mouse_button"] > 0,
            "attacks are on the mouse, so this one matters — try administrator")
    verdict("mouse movement is usable", len(move_positions) > 3,
            "expected: the game pins the cursor. Use lock-on and drop camera "
            "control from the action space, or add Raw Input later.")

    if keys_seen:
        print(f"\n  distinct keys seen: {' '.join(sorted(keys_seen)[:24])}")


def verdict(label, ok, hint):
    print(f"  [{'PASS' if ok else 'FAIL'}] {label}")
    if not ok:
        print(f"         -> {hint}")


if __name__ == "__main__":
    main()
