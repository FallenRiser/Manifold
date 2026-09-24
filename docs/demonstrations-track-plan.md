# Learning from demonstrations — track plan

**Status:** PLANNED 2026-09-19. No pages built. Prototype measured (§2a) — three of the four
gating claims pass. Authority for this track; supersedes any contradicting note elsewhere.

**Route:** `/learn/learning-from-demonstrations` · **Accent:** `--c-rl` gold (shared with the
rest of the RL family) · **Track lib:** `src/lib/demonstrationsTrack.ts` · **Size:** 24 pages /
6 chapters.

---

## 0. Why this track exists

Every RL track on the site so far — MDPs, Planning, Learning, Function approximation,
Building environments — quietly assumes the same thing: **you can explore.** You can reset,
you can try the bad action to find out it was bad, and a failure costs nothing but a step
counter. The boss-fight world runs 40,000 duels a minute and dying is free.

Almost no real control problem is like that. When exploration is expensive, slow, or
catastrophic, you do not start from a random policy. You start from somebody else's behaviour
and the entire subject becomes *what that costs you, and how to get past it.*

Imitation learning currently appears on **one page of the whole site** — the Lies of P capstone
index, which is 1-of-22 built and blocked on the user recording gameplay. That capstone is the
applied end with real human data and no ground truth. This track is the method, with synthetic
demonstrators and ground truth we can compute. Neither substitutes for the other.

### The spine, in one sentence

> Imitation gets you a prior; it cannot get you past the demonstrator. Everything interesting is
> in what you bolt on afterwards.

---

## 1. The world — a data-hall cooling loop

**Why this one.** Three requirements drove the choice, and no other candidate met all three:

1. **Exploration must be obviously catastrophic.** Turn the fans off to see what happens and
   you get thermal runaway and dead hardware. The reader feels it without being told.
2. **The demonstrator's quality must be controllable.** We write the operators, so we can give
   one a *named* flaw and then measure whether the clone inherited exactly that flaw.
3. **Optimal must be computable.** A first-order lag with a quadratic cost is a linear-quadratic
   problem, so **LQR is provably optimal in closed form.** That gives the track a denominator
   nothing else on the site has.

The boss fight and the warehouse both fail (1) — they reset for free, so nothing motivates
reaching for imitation at all. Driving fails (2) and (3).

### 1a. The nominal plant is LINEAR — and that was a correction

The physical picture is a hall whose temperature is driven by IT load and pulled down by a
valve acting through 30 seconds of dead time:

    C · dT/dt  =  load(t)  −  k · v(t − τ) · (T − T_out)  −  h · (T − T_out)

**The nominal world the track trains and scores against is the linearisation of that, not
that.** This is deliberate and it is the single most important design decision in the plan.

The first prototype scored the full nonlinear plant, with diurnal drift, against an LQR derived
from its linearisation — and **a plain proportional controller beat LQR by 71%**, which is
impossible on the problem LQR solves. Two causes, both real: the persistent drift is an
unmodelled disturbance and a pure regulator has no integral action against it; and the dropped
bilinear term `v·(T−T_out)` contributes damping, so the linearisation under-predicts stability
and LQR comes out mistuned for the plant it was scored on.

So the nominal world is **linear-quadratic-Gaussian**, where the optimality guarantee is real:

    x_{k+1} = A·x_k + B·u_{k−D} + w,    w ~ N(0, σ²)
    cost    = Σ  Q·x² + R·u²

and every piece of realism that breaks the guarantee comes back in **chapter 6, one at a time,
each measured as "how much was the guarantee worth once it stopped holding"**: the bilinear
damping, the diurnal disturbance, the cubic fan law, the hard temperature limit. The plan
originally applied this discipline to the cost only; it applies to the dynamics too.

### 1b. Measured constants (prototype, 2026-09-19)

| | value | note |
|---|---|---|
| `DT` | 5.0 s | one control step |
| `TAU` / `D` | 30 s / **6 steps** | dead time — the whole difficulty |
| `H` | 240 steps (20 min) | episode |
| `A`, `B` | `0.9116`, `−0.550` | first-order lag, input delayed by `D` |
| `SIGMA` | `0.06` | process noise, Gaussian → LQG optimality holds |
| `Q`, `R` | `12.0`, `1.0` | quadratic cost weights |
| state dim | **7** = `[x, pipe[0..5]]` | delay line augmented into the state |
| `K_LQR` | `[−0.772, 0.466, 0.511, 0.560, 0.615, 0.674, 0.740]` | via Riccati iteration, no scipy |

`dare()` is solved by plain Riccati iteration rather than `scipy.linalg.solve_discrete_are`, so
`THERMAL_SETUP` ports to Pyodide unchanged.

**Two observations, and the difference between them is the plot.**

- **`full()`** = `[x, pipe[0..5]]` — the error plus *every command still in flight*.
- **`gauge()`** = `[x, x−x₋₁, x₋₁−x₋₂]` — the error and its recent trend. **What an operator
  reads.** A human does not track 30 seconds of in-flight commands, and that gap is most of
  the distance between the operators and LQR.

### 1c. The three operators — measured

Each has one named, deliberate flaw, and all three are blind to the pipe. Scored at n=400,
seed 7, against LQR's **50.63**. Overshoot is from a noise-free 1.5°C step-response test.

| operator | rule | the flaw | cost | vs LQR | overshoot |
|---|---|---|---|---|---|
| `slow_hand` | `u = 0.38·x` | too eager, proportional only — re-commands for an error the last command already handled, it just has not landed | **85.42** ±1.46 | +68.7% | 56% |
| `safety_first` | `u = 0.22·(x + 0.15)` | aims at a colder setpoint than it was given; sits 0.09°C cold | **78.13** ±0.92 | +54.3% | 30% |
| `deadband` | `u = 0` if `|x| < 0.35`, else `0.30·x` | will not touch the valve for a small error, so the hall wanders | **65.02** ±0.95 | +28.4% | 39% |

⚠ **`safety_first` was retuned.** Its first form added a constant `+0.30` bias, which against a
loop with no integral action parks the hall at `x_ss = B·0.30/(1−A) = −1.87°C` and cost
**+3478%**. That is a broken controller, not a cautious operator, and it was also contaminating
the fleet-clone result (§5 step 3). The habit is correctly expressed as *aiming at a lower
setpoint*, not *adding bias to the actuator*.

### 1d. On synthetic demonstrators — stated on page 1, not buried

We write the operators. There is no human. That is not a compromise, it is the only version
that can be measured: with real human logs you do not know what optimal was, so "how much did
imitation cost you" has no denominator. The synthetic operator also buys three things a real one
would not — a *named* flaw, a *plural* and inconsistent demonstrator set, and the ability to
**withhold** the expert so the learner only ever sees a fixed log. That last one is the real
constraint in practice and it is what makes DAgger awkward rather than free.

---

## 2. The measurement ladder

Six arms, all reproducible, all against the same plant:

| arm | what it is | what it demonstrates |
|---|---|---|
| **LQR** | provably optimal, closed form, no training | the denominator |
| **operators** | hand-written, named flaws | the demonstrator's own ceiling |
| **BC (one operator)** | cloned from one operator's log | flaw inheritance — *the reader's own objection* |
| **BC (fleet)** | cloned from all three | mode averaging |
| **BC + DAgger** | expert queried in the learner's own states | the covariate-shift fix, and its price |
| **BC → RL fine-tune** | cloned, then improved in sim | **beats the operator it learned from** |

Two gaps get decomposed on every results page:

- **operator → LQR** = what imitation can *never* give you, however perfect the cloning.
- **clone → operator** = what imitation cost you *on top of that*.

### 2a. What the prototype established

| claim | status | evidence |
|---|---|---|
| 1. LQR beats every operator | **PASS** | 50.63 vs 65.02 / 78.13 / 85.42 |
| 2. the clone inherits the flaw | **PASS** | see below |
| 3. fleet clone shows mode averaging | **RE-RUN NEEDED** | measured at 144.39 vs best-operator 63.71, but with the broken `safety_first` dragging the mean — the number does not yet mean what a page would claim |
| 4. BC → RL beats its own demonstrator | **PASS** | see below |

**Claim 2, the sharpest result in the track.** The clone is given `full()` — the entire delay
line, *strictly more information than `slow_hand` ever had* — and still reproduces it to five
decimal places:

```
  slow_hand (demonstrator)    85.42          +68.7% vs LQR   overshoot  56%
  BC(slow_hand)               85.41 +/-1.46  +68.7% vs LQR   overshoot  54%   (train mse 0.00000)
```

Extra information does not help, because the training signal *is* the operator's mistakes. That
is imitation's ceiling as a measurement rather than a warning, and it is the direct answer to
*"it will just clone the bad habits."*

**Claim 4, the headline.** Plain REINFORCE (warm-started from the clone, per-timestep batch-mean
baseline, 96-episode batches, lr 6e-4, `log_std` init −1.9, 260 iterations, grad-clip 1.0):

```
  BC(slow_hand)               85.41 +/-1.46  +68.7% vs LQR   overshoot  54%
      after   65 PG iters     51.16           +1.0%
      after  130 PG iters     53.24           +5.1%
      after  195 PG iters     49.78           -1.7%
      after  260 PG iters     49.19           -2.9%
  BC -> RL fine-tune          50.70 +/-0.63   +0.1% vs LQR   overshoot   8%
```

**100% of the operator-to-optimal gap recovered**, overshoot collapsed 54% → 8%. Deliberately
the plainest policy gradient there is: the claim under test is that RL on top of imitation gets
past the demonstrator, and borrowing a stronger algorithm would make the claim about the
algorithm instead.

⚠ **The two checkpoints reading below LQR (−1.7%, −2.9%) are evaluation noise from a smaller
eval batch, not a result.** Nothing beats LQR on the LQ problem. The final n=400 number (+0.1%,
against LQR's ±0.63 standard error) is a statistical tie — it converges to optimal and stops
exactly where theory says the ceiling is. **The page must say this.** Reporting a
"beats-optimal" number would be the single most damaging error this track could make.

### 2b. Build gotcha, recorded so it is not rediscovered

The first fine-tune run appeared to do nothing — identical evaluation at all four checkpoints.
Cause: the action was sampled as `u = mu + std*randn` and left attached to the graph, so inside
the Gaussian log-density the `mu` terms cancel algebraically and the score-function gradient is
**identically zero**. REINFORCE needs the draw detached and `mu`'s graph kept:

```python
with torch.no_grad():
    u = mu + std * torch.randn(nb)
logps.append(-0.5 * ((u - mu) / std) ** 2 - log_std)
```

The tell was the eval being *byte-identical* across checkpoints rather than merely flat.

---

## 3. Page blueprint — 24 pages / 6 chapters

### Ch. 1 · When you cannot explore (4)
1. **The plant you are not allowed to experiment on** *(index)* — the brief; why every method
   from the last four tracks is unavailable here.
2. **What exploration actually costs** — run the random policy once, show the runaway, put a
   number on it. The only time we exploit the fact that this *is* a simulator.
3. **The log is all you get** — what the dataset contains, what it does not, and why "just try
   it and see" is not on the table.
4. **Three operators and a controller nobody ran** — the demonstrators, their named flaws, and
   LQR. Establishes the ladder before any learning happens.

### Ch. 2 · Behaviour cloning (4)
5. **Control as supervised learning** — the reframe: state → action is a regression, and every
   tool from the supervised half of the site applies unchanged.
6. **Cloning one operator** — claim 2. The clone gets *more* information than the operator and
   inherits the overshoot anyway.
7. **Cloning the fleet** — mode averaging: if one operator goes left and one goes right, the
   mean goes straight into the wall. A distinct failure from covariate shift, distinct lab.
8. **How good is it really** — the two-gap decomposition against LQR.

### Ch. 3 · Why it drifts (4)
9. **The error that compounds** — covariate shift stated properly: trained on the expert's
   states, tested on its own.
10. **Quadratic in the horizon** — the Ross & Bagnell result and the arithmetic behind it, with
    our own measured curve next to the bound.
11. **Watching it leave the data** — flagship lab: distance from the log's state distribution,
    live, over one episode.
12. **More data does not fix it** — 10× the log, measured, same drift. The page that stops the
    reader reaching for the obvious lever.

### Ch. 4 · Asking for help (3)
13. **Let the learner drive, let the expert label** — DAgger.
14. **What DAgger actually costs** — it requires an expert you can *query in new states*. Our
    operators have left the company. Named as a real limitation, not a footnote.
15. **BC vs DAgger on the same budget** — measured.

### Ch. 5 · Getting past the demonstrator (5)
16. **Imitation's ceiling, stated precisely** — and why AlphaGo's policy network was not capped
    by the humans it imitated.
17. **A reward you did not have to invent** — inverse RL, briefly and honestly.
18. **Offline RL, and why naive Q-learning explodes** — extrapolation error on out-of-distribution
    actions, built as a counterexample the way the FA track builds Baird's.
19. **Staying near the data** — behaviour-constrained offline RL.
20. **BC as initialisation, RL as polish** — claim 4, the recipe, the headline, and the
    "it ties with LQR, it does not beat it" honesty note from §2a.

### Ch. 6 · When each one is right (4)
21. **Where the guarantee ends** — bilinear damping, diurnal drift, cubic fan power, a hard
    temperature limit. Added one at a time; LQR stops being optimal and we measure by how much.
    This page exists *because* of the §1a correction.
22. **The safety shield** — a hand-written override the learner cannot bypass. Connects to the
    wildfire shield work.
23. **The decision table** — reset cost × demonstrator quality × reward availability → which
    method. The transferable artifact.
24. **Two worlds, opposite methods** — throughline: the boss fight lets RL do everything
    *because* it resets for free; this plant inverts it. Closes the argument the env-building
    track currently leaves open.

---

## 4. Build artifacts

- `THERMAL_SETUP` in `src/lib/runtimeSetup.ts` — Pyodide-runnable numpy plant + operators + LQR.
  **A third embedded world. Apply the existing discipline: slice the block by regex offsets and
  hash-assert the others before writing** (`BOSS_SETUP` must stay `b126aab75e2b`).
- `scripts/thermal_cases.py` — every published number, `--check` mode like `boss_regen.py`.
- `scripts/thermal_train.py` — BC, DAgger, offline RL, BC→RL fine-tune.
- Labs: `ThermalLoopLab` (flagship — drive the plant yourself, feel the dead time, try to beat
  LQR), `ModeAverageLab`, `DriftLab`, `DaggerLab`, `OfflineQLab`.
- `src/lib/demonstrationsTrack.ts`, imported into `searchIndex.ts`; `siteMap.ts` updated honestly
  (partial until it is not).

Per §11 of `PROJECT.md`: `LessonShell` + `TrackSidebar`, shared lesson primitives only,
`PredictPrompt` before each flagship lab, `Quiz` at every chapter end, `DecisionPoint` at every
workflow fork, KaTeX for maths, tokens only for colour.

Prototype network sizes that worked, as a starting point rather than a result: BC = MLP 96-96,
Adam 3e-3, 400 epochs, batch 4096, over 200 logged episodes.

---

## 5. Build order — risk first

**Do not write a page until the ladder is measured.** The spine is a set of empirical claims and
three of them could have been false. Status as of 2026-09-19:

1. ~~Plant + LQR + three operators; verify LQR beats all three.~~ **DONE.** Required rebuilding
   the nominal plant as linear (§1a) — the first attempt had LQR losing to a P controller.
2. ~~Generate logs, run BC, check the flaw is inherited.~~ **DONE — claim 2 passes**, and more
   strongly than hoped: inheritance survives giving the clone extra information.
3. **Check mode averaging on the fleet clone. OUTSTANDING** — must be re-run now `safety_first`
   is retuned; the earlier 144.39 was contaminated. If the three operators turn out too similar
   to produce averaging, they need to be made more distinct before ch. 2 has a subject.
4. ~~Check BC→RL fine-tune beats the operator.~~ **DONE — claim 4 passes**, 100% of the gap.
5. Only then: pages, in chapter order.

This ordering is the direct lesson of two prior incidents — the lab that silently failed to
demonstrate its own point, and the stunlock that only a trained optimiser found. It has already
paid for itself twice here (the LQR-loses-to-P bug and the zero-gradient bug), both of which
would have become published prose under any other ordering.

---

## 6. Honesty guards

- **LQR is optimal for the linear-quadratic nominal problem only.** Every page that calls it
  "optimal" carries that qualifier, and ch. 6 measures where it stops.
- **Never report the fine-tuned policy as beating LQR.** See §2a — those readings are eval noise.
- **The operators are synthetic**, said plainly on page 1 with the reason.
- **DAgger is not free** — it needs a queryable expert, which the premise of this world denies.
- **Offline RL results are seed-sensitive.** Report seeds and spread, never a single run.
- Every number from `thermal_cases.py`. House rule #1 stands.

## 7. Open decisions

- Discrete 7-level action vs continuous. The prototype is continuous and REINFORCE handled it
  fine; discrete would keep the FA track's DQN-family tools reusable. **Leaning continuous now**
  that claim 4 is established without needing them.
- Whether ch. 5 ships one offline-RL method or a comparison. Prefer the comparison — this plant
  is seven floats and the compute is nothing.
- Whether `ThermalLoopLab` shows LQR's action as a ghost while the reader drives. Probably yes,
  but only after they have tried it blind.
- Whether the operators should also be made *stochastic*. Real operators are inconsistent, and
  it would strengthen the fleet/mode-averaging story — but it weakens claim 2's clean
  five-decimal inheritance result. Possibly both, as separate arms.
