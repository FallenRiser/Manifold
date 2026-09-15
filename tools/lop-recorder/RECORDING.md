# Recording protocol — collecting the Capstone C dataset

The spike proved the rig works (`tools/lop-capture-spike/README.md` §5b). This folder is the thing
you actually record with. Read this once before your first session; it is short, and every rule in
it exists because breaking it silently costs you the whole session.

Scope, unchanged: single-player, offline, your own copy, your own play, on your own machine.

---

## 0. The one rule that kills sessions

**Run the console as administrator.** Every time. From an ordinary console the game's input never
reaches the recorder — you get perfect video with no labels, and no error while it happens. The
recorder checks at the end and shouts `[FAIL]` if no inputs were logged, but that is an hour of
play you cannot get back.

---

## 1. Settings, fixed for every session

Change any of these mid-project and the earlier recordings stop matching the later ones.

| Setting | Value | Why |
| --- | --- | --- |
| Display mode | **Borderless windowed** | Exclusive fullscreen records black frames |
| Frame rate cap | **60** | A known frame interval; uncapped makes every timing measurement mush |
| Resolution | whatever you play at | The recorder downscales; it does not care |
| HUD | **On** | Health, stamina and the boss bar are supervision signals |
| Lock-on | **On** | Removes most free camera control and shrinks the action space |
| Keybinds | never change them | They are recorded in `manifest.json`; a change splits your dataset in two |
| Weapon | **one weapon, whole project** | Different weapons have different swing timings — that is a different task |

Also: close anything that steals frames (browser video, OBS, Discord streams). The recorder reports
`long_gaps`; it should be 0.

---

## 2. What to record first — rung 1 only

Do **not** start on a boss. The ladder in the plan is deliberate: movement → one normal enemy →
boss arena. Rung 1 is one ordinary enemy type, fought over and over, in one place.

Pick a spot where the enemy is close to a Stargazer so the walk-back is short. Walk-back time is
dead time in your dataset, and it sets how fast you can collect.

A session looks like this:

1. Start the recorder, tab into the game.
2. Walk to the enemy.
3. Press **F9** when the fight starts.
4. Fight it, normally, the way you want the model to fight.
5. Press **F9** again when it dies (or you do).
6. Walk back, repeat.
7. Press **F10** to stop.

Press **F8** immediately after any take you want thrown away — a fumbled fight, a phone call, a
menu you opened. It marks the stretch as scratch instead of making you delete anything.

---

## 3. How much

Aim, for rung 1, at **30–60 clean fights**, which is roughly 20–40 minutes of marked fight time
across two or three sessions on different days. Different days matter: same-session recordings are
more alike than they look, and a model that only ever sees one lighting/mood/fatigue state learns
that instead of the fight.

Do not try to collect everything up front. Record one 10-minute session, build the dataset from it,
look at what comes out, and *then* decide how much more you need. The first session's job is to
find the problems in the pipeline, not to be training data.

---

## 4. Play like a teacher, not like a player

Behaviour cloning copies what you did, including your bad habits and your panic mashing. So:

- Play **deliberately**. One clean input per intention. Mashing teaches mashing.
- Play **consistently**. If you sometimes dodge and sometimes parry the same attack, you are
  teaching the model that the correct answer to that attack is a coin flip.
- Do **not** correct a mistake by spamming. Let a bad take be a bad take and press F8.
- Keep the fights **similar**. Same enemy, same arena, same approach.
- Stop when you get tired. Tired play is a different policy, and it is the one that will dominate
  your dataset if you push through a long session.

---

## 5. What you get, per session

```
data/lop/raw/20260912_2140_rung1_carcass/
    video.mp4       frames, encoded as they arrive
    frames.csv      index,t   <- the real timestamp of each frame. AUTHORITATIVE.
    events.csv      t,kind,name,state   every key, mouse button and mark
    manifest.json   settings, counts, achieved FPS, duplicate rate, keybinds
```

**Trust `frames.csv`, never the frame index.** Around 12.6% of delivered frames are exact repeats,
so the index drifts away from real time as the session goes on. Every label must be looked up by
timestamp.

Check `manifest.json` after each session: `fps_unique` should be near 54, `long_gaps` should be 0,
and `key_presses` / `mouse_presses` must be non-zero. If the keybind map at the bottom is wrong for
your setup, fix it in the file — the dataset builder reads it.

---

## 5b. Camera control is not in the dataset, and that is now measured

The recorder logs `mouse_move`, and the capture spike reported mouse movement as working. **It is
not usable as a camera signal**, checked three ways against the first two real sessions:

- Mouse travel per window correlates with on-screen motion at about **zero** (−0.10 and −0.04),
  even when only windows that contain mouse travel are counted.
- **Of the 10% of windows where the screen moves most, 77–85% logged no mouse travel at all.** The
  camera is plainly swinging and the log does not see it.
- It is not cursor clamping at the screen edge: only 0.2–2.5% of events sit at an edge.
- The events that do arrive are bursty — mean 4.8 per 50 ms window, median 0, 64% of windows empty,
  and gaps of up to 5.6 s.

So the plan's original call stands: **play with lock-on and keep camera control out of the action
space.** The `mouse_move` rows stay in `events.csv` (they cost nothing and may be diagnostic later),
but no dataset column is built from them. If a later rung genuinely needs camera control, it needs
the Windows Raw Input API and relative deltas — not absolute cursor positions.

---

## 6. Rules for later, decided now

- **Split train/validation by session, never by frame.** Neighbouring frames are nearly identical;
  a random frame split leaks the answer into validation and reports a score you cannot reproduce.
  Hold out whole sessions.
- **De-duplicate by content when batching**, or repeated frames get double weight.
- Keep every raw session, including bad ones. The scratch marks record the judgement; deleting
  the data destroys the ability to revisit it.
- `manifest.json` is the dataset's memory. If something about a session was unusual — different
  time of day, you were tired, you changed a setting — write it in `--note`.

---

## 7. Your first run

```bash
python record_session.py --name rung1_probe --minutes 10 --note "first real session, learning the flow"
```

Then send me the printed summary and the manifest. The next tool is `build_dataset.py`, which turns
raw sessions into (frame, action) pairs — I will write it against your actual first session rather
than against an imagined one, so the action encoding matches what you really pressed.
