# "Learning to parry" — Lies of P Field Report — Plan

> Status: 🚧 **FOUNDATIONS LAID (2026-09-11).** Route live at **`/learn/lies-of-p-capstone`** (index
> page only, 1/22). Accent **`--c-krat`** + the **`--krat-*`** gaslight panel palette shipped;
> `GaslightPanel.tsx` and `ParryBudget.tsx` built; `lopCapstoneTrack.ts` + layout + search
> registration done. **Not** in `siteMap.ts` CAPSTONES yet — that happens only when substantially
> complete, per the warehouse/NEO precedent.
>
> Authority for this capstone. Extends `PROJECT.md` §13.3 (which remains correct on the pipeline,
> hardware and training route) and §13.0 genre 2.

---

## 0. THE RULE (this is the whole reason the genre exists)

**Methodology pages may be written before the model exists. Results pages may not.**

The other three capstones can put a Run button under every number because their worlds live in the
page. This one cannot — the world is a commercial game on one particular laptop. The honest-numbers
doctrine therefore changes *shape*, not substance:

- Acts 1–4 (method) are writable **now**. They describe what will be done and why.
- Act 5 (results) and the verdict page ship **only after a real run**, with real measurements.
- Until then those pages stay **href-less**, so the sidebar greys them. **That greying is a feature.**
  The index page says so explicitly, in public.
- No placeholder numbers, ever. Not even "~", not even in a figure — except where a figure is
  explicitly stamped as an *illustrative budget* (see §3), and even then it must say so on its face.

---

## 1. The thesis

> **An agent that learns one boss fight by watching its author play it — and discovers, twice, that
> the hard part was never the network. First: the moment it acts, it changes its own input
> distribution and drifts somewhere its teacher never went. Second: a model that is perfectly
> accurate and twenty milliseconds late parries nothing.**

Two hard truths, and neither is available to the other capstones because neither exists until a model
acts in a world that answers back:

- **T1 — imitation is a supervised problem wearing a control problem's clothes.** Training is
  literally image classification. Deployment is not. Compounding error / distribution shift is the
  failure mode, and DAgger is the honest fix.
- **T2 — it is a latency problem as much as a learning problem.** The clock, not accuracy, is the
  binding constraint, and it reframes every downstream choice (backbone, resolution, stack depth) as
  a budget decision. This is the most transferable idea in the project.

## 2. What it will and will not claim (locked, appears on the index)

- **Will:** an agent that clones one boss fight from recorded human play.
- **Will not:** be self-taught, exceed its teacher, or generalise past its arena. BC reproduces
  *average* play including the mistakes.
- **Expected honest failure:** it dodges more than it parries, because dodging forgives a late press
  and parrying does not. **If that happens, that is the result** — not a prompt to retry until the
  story improves.
- Framing never used: "self-taught from scratch", "beats Lies of P".

## 3. Visual identity — THE GASLIGHT ✅ BUILT

Designed properly up front, per the warehouse reskin lesson (an accent is not an identity).

- **Editorial accent `--c-krat`** — oxblood crimson `#8f1d2f` / `#e2596e` dark. Red was the one
  unclaimed family hue. ⚠️ Kept deeper and cooler than `--bad`; **never put both on one figure.**
- **`--krat-*` panel palette** — theme-independent (a soot-black room is soot-black in light mode
  too), like NEO's sky and ledger: soot, panel, border, ink/ink-soft/faint, **brass**, brass-dim,
  **ember** (the perfect-guard flash), **blood**, ash.
- **`GaslightPanel.tsx`** — the SkyPanel equivalent: soot ground, a lamp pool falling from the upper
  left, deterministic seeded **ash motes** that fade in once (`.krat-ash` / `.krat-lamp`,
  reduced-motion neutralises both), and an optional **marionette control-bar motif** — chosen because
  it is the thesis as a glyph: something driven from above, with slack in the strings.
- **`ParryBudget.tsx`** — the signature figure, the NeoField equivalent: a 60 fps frame ruler, the
  perfect-guard window, and the see→think→act chain that must fit inside it, with a p99 tail that
  does not. **It contains no machine learning at all**, which is the point.
  ⚠️ **Stamped `ILLUSTRATIVE BUDGET · MEASURED IN ACT 2` on its face.** Its milliseconds are
  arithmetic, not results, and Act 2 replaces them with real measurements. Never quote them.
- **Originality:** all geometry drawn from scratch. No game art, no logo, no screenshots. The capstone
  documents a project; it does not reproduce a game.

## 4. Track blueprint — 22 pages / 6 acts (`lopCapstoneTrack.ts`, SCAFFOLDED)

**Act 1 · Frame the field report** (4pp) — overview & the honest promise ✅ BUILT · why not RL (real-time,
expensive deaths, no reward signal without a HUD parser) · what BC actually is (and why it's just
supervised learning) · scoping to one boss, one arena.

**Act 2 · The rig** (4pp) — capture: frames + keystrokes on **one clock** (the sync is the hard part) ·
**the latency budget** (where `ParryBudget`'s numbers become real) · labels: what a keypress means
(multi-label, hold vs tap) · building the dataset without drowning (downsample at capture; never a
folder of PNGs).

**Act 3 · The model** (4pp) — what fits in **6 GB** (≤ ResNet-18-class, mixed precision, small batch) ·
seeing *time*: frame stacks vs a small LSTM · **the imbalance problem** — parry frames are rare, so
weighting/resampling is the whole ballgame · training off-site: the Kaggle route (T4/P100, **not**
TPU; private dataset; weights → HuggingFace).

**Act 4 · The loop** (3pp) — logits → keystrokes · **does the game even accept synthetic input?**
(`pydirectinput` may simply not register — validate this *first*, it can kill the project) ·
measuring the loop you actually built.

**Act 5 · Results & failure** (4pp) — 🚫 **BLOCKED until a real run.** What it learned · distribution
shift watched live · the dodge-tank problem · DAgger.

**Act 6 · Conclude & transfer** (3pp) — 🚫 verdict, artifacts & model card (blocked) · the Deep-RL
option and its real cost (HUD parser as the crux; BC→RL fine-tune ⭐ recommended, offline RL, then
online DQN/PPO as a research-grade slog) · transfer: cloning any real-time skill.

## 5. Build order (the risk-first ordering)

The pipeline has one step that can kill the whole project, so it goes first — **before** any data is
recorded or any page past Act 1 is written:

1. **Synthetic-input spike.** Can `pydirectinput` (or an alternative) drive the game at all? A
   20-line script and one boss run answers it. If no → the capstone re-scopes to *offline* prediction
   ("what would I have pressed?"), which is still a real, honest, publishable field report.
2. **Latency spike.** Measure the four chain segments on the actual laptop. This turns `ParryBudget`
   from arithmetic into measurement, and it decides the model's size budget before the model exists.
3. **Capture rig + sync validation.** Prove frames and keys line up; a systematic offset here poisons
   every label downstream.
4. Then Acts 1–4 prose (writable in parallel with 1–3), then data, then training, then Act 5.

## 6. Open decisions

- **Route name** — `/learn/lies-of-p-capstone` shipped; alternative `/learn/learning-to-parry` if the
  game's name should be less prominent in the URL.
- **Which boss.** Needs to be one the author can reliably reach and re-fight quickly; the walk-back
  cost sets the data-collection rate. **User's call.**
- Whether Act 5 reports a single model or a BC-vs-BC+DAgger comparison (prefer the comparison — it is
  the same "does the upgrade earn itself" spine the other capstones use).

## 7. Legal / ethical line (stated on the index page)

Single-player, offline, the author's own copy and own recordings; the model plays that same offline
game on that same machine. No game code redistributed, no assets reproduced, nothing touching another
player or an online service.
