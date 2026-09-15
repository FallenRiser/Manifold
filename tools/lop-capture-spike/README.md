# Capture spike — can I record my own gameplay with inputs attached?

The first question Capstone C has to answer, before any data is collected or any model is designed:
**can frames and inputs be recorded on one clock, fast enough, and do they actually line up?**

This folder is a throwaway rig for answering that in about an hour. It lives in the website repo for
now so it stays versioned with the plan; it moves to its own GitHub repo once the real pipeline
starts.

Scope: single-player, offline, your own copy, your own recordings, on your own machine.

---

## 0. Before anything — two game settings that matter

1. **Display mode → Borderless windowed.** Exclusive fullscreen breaks desktop-duplication capture on
   Windows and makes alt-tab risky. This is the single most common reason a capture rig records black
   frames.
2. **Cap the framerate to 60.** You want a stable, known frame interval (16.7 ms); an uncapped
   framerate makes every later timing measurement mush.

Also worth deciding now: **play with lock-on enabled.** It removes almost all free camera control,
which shrinks the action space to keys plus the occasional target switch — and mouse-look is the part
of this rig most likely to give you trouble (step 3). Rung 1 of the ladder does not need camera
control at all.

---

## 1. Install

```bash
py -3.11 -m venv .venv
.venv\Scripts\activate
pip install pynput numpy opencv-python bettercam
```

`bettercam` is the maintained fork of `dxcam` (Windows desktop duplication — the fast path). The
scripts import `bettercam` and fall back to `dxcam` if that's what you already have. If neither
installs on your Python version, that is itself a finding: OBS with a virtual-camera output is the
fallback capture path.

---

## 2. Probe the inputs alone

**Run the console as administrator.** Measured 2026-09-12: from an ordinary console, a 73-second
session logged only `Key.alt_l` and `Key.tab` — the two keys the *shell* handles — and nothing the
game consumed. From an elevated console the same session logged 1,589 key events, 210 mouse-button
events and live mouse movement. Windows withholds input from a lower-integrity process's hooks, so
every script in this folder has to run elevated for as long as the game does.

Run it, tab into the game, play for ~30 seconds, then tab out and press `Esc` in the console window.

```bash
python 01_input_probe.py
```

**What you're checking:**

- Do `w/a/s/d`, space, shift and the mouse buttons show up **while the game has focus**? Global
  low-level hooks usually do capture physical keys regardless of focus — but "usually" is why we test.
- Does `mouse_move` show changing coordinates *while you're in the game*? **Expect this one to fail.**
  Games typically capture the cursor and read raw motion, so the absolute pointer sits pinned at the
  screen centre and reports nothing. If that happens it is not a bug in the script — it means camera
  motion needs the Windows Raw Input API, and that becomes a documented decision rather than a
  surprise later.

The script prints a summary at the end telling you which of these worked.

**Key names are the physical key, not the character.** `key.char` is not stable: hold shift and `w`
arrives as `W`, hold ctrl and it arrives as `\x17` (which prints as `↨`). The first real probe run
logged all three spellings of the same movement key. Both scripts therefore name keys by their
virtual-key code — `w` is always `w` — and anything without one is named `vk<number>`. If you ever
see raw control characters in `events.csv` again, that normalisation has regressed.

---

## 3. Record frames and inputs on one clock

```bash
python 02_capture_sync.py --seconds 30 --fps 60 --width 160 --height 90
```

Everything is timestamped with a single `time.perf_counter()` — one clock for frames and events, which
is the whole trick. Anything else (wall clock for one, frame counter for the other) introduces drift
you cannot recover later.

Writes to `out/`:

- `frames.npz` — downsampled grayscale frames plus their timestamps
- `events.csv` — `t, kind, name, state` for every key and mouse event
- a printed report: achieved FPS, worst frame gap, dropped frames

**Pass mark:** a stable ≥30 FPS with no long stalls. If capture itself can't keep up, no model
downstream can fix it.

---

## 4. Prove they actually line up

This is the step people skip, and a systematic offset here silently poisons every label you will
ever collect.

While recording in step 3, do something with an **unmistakable visual signature**: stand still, then
swing your weapon three times with a clear pause between each. Then:

```bash
python 03_check_sync.py
```

With no arguments it aligns on the first three **mouse-button** presses, which is where the attacks
are. To align on a key instead: `python 03_check_sync.py --key w --n 5`.

It dumps the frames spanning a window around each of the first few attack keypresses as PNGs in
`out/sync/`. Flip through them: **the swing must begin in the frames immediately *after* the press,
never before it.** If the animation starts before the timestamp says you pressed the key, your clocks
are offset and you need to find out by how much before collecting anything.

---

## 5. What each outcome means

| Result | What it means |
| --- | --- |
| Keys log, capture holds 60 FPS, sync is clean | Green light. Proceed to rung 1 of the ladder (movement + one normal enemy). |
| Only `Key.alt_l` / `Key.tab` are logged | The console is not elevated. Re-run it as administrator; see step 2. |
| Keys log, capture only manages ~30 FPS | Fine. Record at 30, and note it — it halves your timing resolution and goes straight into the latency budget. |
| Mouse **movement** doesn't register | Expected. Use lock-on, drop camera control from the action space for now, and revisit with Raw Input later if a rung actually needs it. |
| Mouse **buttons** don't register | Serious — attacks are on the mouse. Try running the probe as administrator before concluding anything. |
| Frames are black | Almost certainly exclusive fullscreen. Switch to borderless windowed and retry. |
| Sync is offset by a constant | Recoverable — measure the offset and correct for it. Do **not** proceed until you know its size. |

---

## 5b. Results — run on the author's machine, 2026-09-12

The spike passed. Measured, not estimated:

| Question | Answer |
| --- | --- |
| Do inputs reach us? | Only when the console is **elevated**. Unelevated: 6 events in 73 s, all alt-tab. Elevated: 1,589 key + 210 mouse-button events in 183 s, and mouse movement worked too (349 distinct positions), which the README had expected to fail. |
| Can capture keep up? | Yes. 1,844 frames in 30.0 s: **61.5 FPS delivered**, median gap 16.2 ms, worst gap 22.8 ms, zero gaps over 1.8× the target. |
| Do frames and presses line up? | **Yes, no offset.** Motion sits flat at the baseline through every frame *before* each of the three attack presses, and rises only after. Nothing to correct. |
| How long from press to visible motion? | **About 45–60 ms** (3–4 frames at 60 Hz) before the picture starts changing, growing steadily after. That is animation wind-up plus input latency together; it is not a pure latency figure. |

One caveat found by measuring rather than eyeballing (`04_sync_report.py`): **12.6 % of delivered frames are
pixel-identical to the one before**, spread evenly across the whole 30 s, never two in a row. So the
*unique* frame rate is **53.7 FPS**, not 61.5. Consequences for the real pipeline:

- Label from **timestamps**, never from frame index — the index over-counts by an eighth.
- De-duplicate by content when building training batches, or a repeated frame gets twice the weight.
- The cause is not established. Most likely the game's own frame pacing, or desktop duplication
  serving the last frame when a new one is not ready. Worth one more look before large recordings.

Both numbers come from `02_capture_sync.py` and `04_sync_report.py` on the same recording, at
160×90 grayscale. Frame **resolution** is still an open decision: see the note in the plan about
recording at full resolution with OBS and downscaling offline, so the HUD bars stay readable.

---

## 6. What this does *not* test

Whether the game accepts **synthetic** input — that's the other spike, and it's the one that can
force a re-scope. Recording is reading; playing is writing, and they fail independently. Test that
separately before building anything that depends on the agent being able to act.
