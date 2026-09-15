# Neuroevolution — Track + Capstone B Plan

> Status: 📋 **PLANNING ONLY (2026-09-11). Nothing built.** Written at the user's request after the
> Code Bullet reference repo was inspected. Covers **two** deliverables that ship together:
>
> 1. a new RL-family track — **"Policy search without gradients"** (hill climbing → ES → GA → NEAT), and
> 2. **Capstone B — "Evolving a driver"** (Hill Climb Racing clone), which caps it.
>
> **This document supersedes `PROJECT.md` §13.2 on two points** (see §0). It does not change §13.0's
> genre doctrine, §13.4's Deep-RL framing, or the honest-numbers rule — those still bind.
>
> ⚠️ **Every number in §7 is an EXPERIMENT TO RUN, not a result.** Nothing here may be written as
> prose until it has been measured against the shipped code. Two planned narratives died that way in
> the warehouse capstone; assume one here will too.

---

## 0. What the reference implementation actually does (evidence, 2026-09-11)

Inspected: `github.com/Code-Bullet/Hill-Climb-Racing-AI`. Findings, because two of them contradict
what `PROJECT.md` §13.2 assumed:

- **He rebuilds the game; he never touches the real one.** `Car.js`, `Wheel.js`, `Ground.js`,
  `Person.js`, `World.js`. No screen capture, no emulator. ✅ Confirms our "simulate, don't bot" call.
- **He does NOT hand-write the physics.** `libraries/Box2d.js` (403 KB) + `p5.js` for rendering. The
  car is Box2D bodies and joints: chassis is a `b2DynamicBody`; wheels attach by **revolute joints
  with motors** (`SetMaxMotorTorque(700)` rear / `350` front — that *is* the gas/brake model); the
  driver is a second body on another revolute joint, which is why he ragdolls.
  ⚠️ **Supersedes §13.2's "hand-written — no Box2D".**
- **Terrain is a Perlin-noise heightfield** turned into Box2D **edge shapes** segment by segment, with
  steepness ramped by distance (`map(i, 0, this.distance, 130, 250)`); separate dirt/grass collision
  layers.
- **Death** = falls below the canvas, or a stagnation counter exceeding 250 frames without progress.
- **The AI is NEAT, not a plain GA.** `Genome.js`, `Species.js`, `ConnectionGene.js`,
  `ConnectionHistory.js`, `Node.js`, `Population.js` — full NEAT with speciation and innovation
  numbers, and the majority of the repo by line count.
  ⚠️ **Supersedes §13.2's "fixed-topology MLP + GA is cleaner to teach than NEAT" as the *whole*
  story** — we now teach both, and make the comparison the spine (§5).
- **He never runs the control.** There is no fixed-topology baseline in the repo, so "NEAT was needed
  here" is an untested assumption. That gap is our capstone's central question.

---

## 1. Why a track, not just a capstone

Capstone B teaching *both* GA and NEAT cannot also introduce them from zero — speciation, innovation
numbers and graph crossover are a chapter each, and 24 pages of capstone would become a tutorial.

It also breaks the site's structural rule: **capstones cap tracks** (housing caps regression, NEO caps
classification, warehouse caps MDPs + Planning + Learning). As specced, B caps nothing.

So: build the track first, then B applies it — exactly the warehouse pattern.

**Prerequisites: none that are unbuilt.** It needs the Neural-networks family (✅ complete) and
nothing from Function approximation or policy gradients. **This track is unblocked today**, which
makes it an independent thread from the Deep-RL one.

---

## 2. The track — "Policy search without gradients"

- **Family:** Reinforcement learning (`--c-rl`, riso gold). It solves the same control problems by a
  different route, so it belongs beside the others, not in Optimization.
- **Route:** `/learn/policy-search` (alt: `/learn/neuroevolution` — decide at build time).
- **Position in the family:** after Learning, *parallel* to Function approximation — not a
  prerequisite for it and not dependent on it. The map should show it as a branch, not a rung.
- **Size:** 20–24 pages / 6 chapters, mastery depth, house style per `PROJECT.md` §12.

### 2.1 The thesis (LEAD with this)

> **Every method so far estimated a value function and read a policy off it. You can skip all of it.
> Treat the policy's weights as a search space, evaluate returns, keep what works — no Bellman
> equation, no bootstrapping, no gradient, no credit assignment. It works better than it has any right
> to, and it fails in ways that are specific, learnable, and nothing like how TD methods fail.**

Two hard truths for the reader to discover personally:

- **T1 — Credit assignment is optional.** TD methods exist to answer "which action was responsible?"
  Evolution never asks. It pays for that in samples and gets, in exchange, indifference to reward
  sparsity, delay, non-differentiability and discreteness. Random weight guessing solving a control
  task is the shock that sets this up.
- **T2 — More machinery must earn itself.** NEAT's complexification and speciation are beautiful and
  are not free. On a small problem a fixed-topology GA may match it at equal environment steps. The
  track teaches the comparison protocol; the capstone runs it for real.

### 2.2 Chapter outline

**Ch 1 · The other way to search** — policy search vs value-based; the black-box view
(<code>J(θ) = E[return]</code>, samplable but not differentiable); what this buys (sparse/delayed/
non-differentiable rewards, discrete actions) and what it costs (sample complexity); where it sits on
the family map.

**Ch 2 · Random search & hill climbing** — random weight guessing as a real baseline (and a genuine
embarrassment for a task you thought was hard); (1+1) hill climbing; adaptive noise; local optima,
plateaus, and why a *single* trajectory of improvement is fragile.

**Ch 3 · Evolution strategies** — populations: (μ, λ) vs (μ+λ); rank-based fitness shaping; isotropic
ES and the OpenAI-ES estimator — **the bridge page**, where a gradient-free method turns out to be
computing a gradient *estimate*, which connects the whole track back to policy gradients. CMA-ES by
intuition only (covariance adaptation), not implementation.

**Ch 4 · Genetic algorithms over neural networks** — genome encoding of a fixed-topology MLP;
selection (tournament, elitism); mutation; **crossover and the competing-conventions problem** —
permuted hidden units make weight-vector crossover destructive, which is a strong candidate for an
honest null (§7.3); diversity and premature convergence; evaluation noise → the seed discipline again
(warehouse Playbook rule 13 transfers verbatim).

**Ch 5 · NEAT** — the TWEANN problem; **innovation numbers** as historical markings that make
crossover between different topologies meaningful; **speciation + fitness sharing** as protection for
innovations that are not yet any good; **complexification** — start minimal, add nodes and
connections only as they pay; the three mutation operators.

**Ch 6 · Choosing and comparing honestly** — sample complexity vs gradient methods **at equal
environment steps, not equal generations** (the single most common way this comparison is rigged);
embarrassing parallelism and why ES scales across machines where TD does not; deceptive fitness
landscapes and a short, honest look at novelty search; when *not* to reach for evolution.

### 2.3 Environments for the track

New `CONTROL_SETUP` in `runtimeSetup.ts` — deliberately tiny and analytic, since the track's labs must
be cheap:

- **CartPole** — 4-state, ~30 lines, the canonical RWG/hill-climbing demo.
- **Mountain Car** — the deceptive-fitness example (naive fitness = distance up the right slope
  actively misleads; you must go left first). This earns its place: it is the cleanest possible
  demonstration of Ch 6's deception point.
- **A callback to `WAREHOUSE_SETUP`** for Ch 6's equal-env-steps comparison against a method the
  reader already has honest numbers for.

### 2.4 Labs (new; gold `--c-rl` accent)

1. **HillClimbLab** — a 2-parameter policy landscape; drag the start point, watch hill climbing get
   stuck. Establishes the geometry the rest of the track argues about.
2. **PopulationLab** — an ES cloud moving over that same landscape; sliders for σ and population size.
3. **GaEvolveLab** — evolve a tiny MLP on CartPole live; generation counter, best/mean fitness curves.
4. **NeatTopologyLab** ⭐ *flagship* — watch a genome **complexify**: nodes and connections appear over
   generations, drawn as a growing graph beside its fitness curve. This is the track's signature
   image, and nothing else on the site looks like it.
5. **SpeciationLab** — species count and fitness-sharing on/off; watch a promising-but-weak innovation
   survive or get eaten.
6. **SampleCostLab** — the same task, evolution vs Q-learning, x-axis = environment steps. The honest
   comparison, made interactive.

---

## 3. Capstone B — "Evolving a driver"

- **Route:** `/learn/hill-climb-capstone` (decide at build time).
- **Accent:** unoccupied hues remaining are limited; **candidate `--c-hill`, a petrol/rust orange**
  distinct from `--c-neural` orange and `--c-housing` terracotta. **Needs the user's yes/no**, as
  `--c-warehouse` did.
- **Genre:** runnable-notebook (§13.0 genre 1) — on-site simulation, downloadable notebook.
- **Size:** 24 pages / 6 acts, inheriting the NEO pedagogical contract.
- **Identity:** must be its own, per the warehouse design lesson (see §9). Sketch: a **rally
  roadbook / scrutineering sheet** — stage cards, gradient profiles, a telemetry strip. Explicitly
  *not* concrete-and-hazard-tape (warehouse), not dark sky (NEO), not paper (housing). The per-page
  opener varies by act, as `WorkOrder` does.

### 3.1 The thesis

> **Two evolutions, one car. A fixed-topology GA and NEAT both learn to drive — and the interesting
> result is not that they work, it's what happens when you finally make them race at equal
> environment steps, on terrain neither has seen, over enough seeds to tell luck from skill.**

### 3.2 The six acts

**Act 1 · Frame it (4–5 pp)** — the car as a control problem. What is the policy? **Sensor design is
this capstone's state-design moment**: ground slope at k lookahead points, chassis angle, angular
velocity, wheel-contact flags, speed, fuel. Show a sensor set that makes the task *unlearnable* (no
lookahead → cannot anticipate a crest), mirroring the warehouse's one-bit reveal. Actions: gas/brake
(+ the discrete-vs-continuous question). **The fitness function is the reward-design lesson**:
distance alone rewards suicidal speed; distance + air-time is hackable; distance-before-death with a
flip penalty is the honest one — and an adversary maximising it literally must be tried (warehouse
rule 4).

**Act 2 · Build the world (4 pp)** — the physics (§4), the terrain generator, what an episode is,
death conditions, and — the act's real content — **the reproducibility harness**: fixed terrain seeds,
a held-out terrain set, the noise floor of a fitness evaluation (how many terrains before a fitness
number means anything?). Locked before any evolution runs.

**Act 3 · Evolve it — the GA (4 pp)** — encoding, selection, elitism, mutation; the first population;
reading a generation curve; the first honest failure (whatever §7.4 turns up).

**Act 4 · Make it work (4 pp)** — mutation rate, population size, elitism count, selection pressure;
the exploration/exploitation dial by another name; **"one seed lies"** applied to evolutionary runs,
with tuning seeds split from reporting seeds.

**Act 5 · NEAT — does complexity pay? (4 pp)** — complexification and speciation on the same car,
same harness, **same environment-step budget**. Report what actually happens (§7.5). If NEAT does not
win, that is the page — the warehouse's Act 3 is the template for telling it well.

**Act 6 · Conclude & transfer (3 pp)** — the Playbook; **near transfer** = new terrain seeds and a
steeper generator, held out from evolution; **far transfer** = ⭐ **evolve a policy for the
warehouse-robot MDP from Capstone A** and put it next to Q-learning's 21.2 at equal environment
steps. Same environment, different paradigm, directly comparable published numbers, and a
cross-capstone callback the site has never done. Expect evolution to need far more steps to get
there — which *is* the lesson, honestly measured.

---

## 4. The physics decision (§13.2's open question, resolved on evidence)

Code Bullet used Box2D because he needed **general** rigid-body collision. **We do not.** A car on a
heightfield is a special case: chassis rigid body (x, y, θ), two wheels as point contacts with
spring-damper suspension, motor torque, terrain sampled as a height function with a local normal.
That is ~200–300 lines, deterministic, with no broad-phase collision, no contact solver, no joints.

**Why not just take matter.js in the lab:** the site's doctrine is that the runnable cells reproduce
the published numbers. If the lab's physics is JS and the published numbers come from Python, the
reader can no longer run the thing that produced the figures. That is the one line this project has
not crossed.

**Decision (recommended): numpy is the source of truth; the TSX lab re-implements the same reduced
model and is verified against it.**

- `scripts/` + `runtimeSetup.ts` hold the numpy model → all published numbers, notebook, runnable cells.
- The lab ports the *same* equations to TS for 60 fps rendering.
- **Acceptance test (must exist before the lab ships):** from a fixed initial state and a fixed
  action sequence, 500 steps in both implementations agree to `max |Δstate| < 1e-6`. A drift check
  goes in the repro guard, so a later edit to one side fails loudly.
- Cost: one model written twice. Bought with: reproducibility intact, no npm dependency, and a
  physics model simple enough that the port is *checkable* — which a Box2D port would not be.

**⚠️ Performance requirement, and it shapes the code:** a GA run is population × generations ×
episode-steps — 50 × 200 × 1000 = **10 M steps**, far too slow as a Python loop in Pyodide.
**The population must be stepped as a batch**: all N cars advanced simultaneously as numpy arrays.
This is a design constraint on the environment API from day one, and it doubles as a genuinely good
teaching point (evolution is embarrassingly parallel, and here you can *see* it).

**⚠️ NEAT resists that vectorisation** — heterogeneous topologies do not batch cleanly. Expect NEAT's
on-page runs to be smaller than the GA's, or to be precomputed in `scripts/` with results shown
rather than run live. **Decide before writing Act 5**, and say so on the page rather than hiding it.

---

## 5. The comparison that is the point

Both methods, one harness. The protocol, fixed in advance:

- **equal environment steps**, never equal generations;
- **held-out terrain seeds** for reporting, disjoint from any used in tuning;
- **≥ 10 evolution seeds per configuration**, reporting spread and failure rate, never a best run;
- the same sensor set, fitness function, and episode cap for both.

Prediction on record, to be confirmed or killed: **on a task with two motors and a handful of
sensors, NEAT's evolved topology will not clearly beat a tuned fixed-topology GA at equal steps.** The
warehouse's SARSA/Q "cliff" evaporated under exactly this treatment. If that happens again, the page
writes itself — *complexity must earn its keep, and here it did not* — and it is a better lesson than
a win would have been.

---

## 6. New vs reused

| Piece | Status |
| --- | --- |
| `CONTROL_SETUP` (CartPole, Mountain Car) | new — small, analytic |
| `HILLCLIMB_SETUP` (car + heightfield, batched) | new — §4, the big one |
| GA / ES / hill-climbing implementations | new — teaching-grade, in the setup |
| NEAT implementation | new — the largest single code artifact in the plan |
| `WAREHOUSE_SETUP` | reused verbatim for Ch 6 + Act 6 far transfer |
| `scripts/neuroevolution_cases.py` | new — every published number |
| Pedagogy contract, PrevNext/LessonHeader/Callout/Proof | reused |
| Capstone skin | **new** — see §9 |

---

## 7. Experiments to run BEFORE any prose (the honest-numbers gate)

Each must be run against the *shipped* setup code, extracted-and-executed, before the page around it
is written.

1. **RWG on CartPole** — draws to solve, distribution over 100 trials. (Ch 2's shock. If it turns out
   *not* to be easy in our version, the shock is gone and Ch 2 needs rewriting.)
2. **Hill climbing vs ES vs GA on CartPole** — episodes-to-solve, 30 seeds, median + IQR + failures.
3. **Does crossover help?** GA with and without crossover, matched budget. **Prime null candidate** —
   competing conventions predict crossover is destructive for NN weights.
4. **GA on the car** — generations-to-first-completion, fitness curve, failure rate over 10 seeds;
   which sensor sets make it unlearnable (Act 1's reveal — must be verified, not assumed).
5. **NEAT vs GA on the car** — §5's protocol. The capstone's headline.
6. **Speciation ablation** — NEAT with fitness sharing off; does an innovation actually get eaten?
7. **Deception on Mountain Car** — naive-fitness ES failure rate vs a shaped/novelty variant.
8. **Evolution vs Q-learning on the warehouse at equal env steps** — Act 6's far transfer, directly
   comparable to Capstone A's published 21.2.
9. **Sim-port drift check** — §4's acceptance test.

---

## 8. Risks, ranked

1. **NEAT is the biggest single implementation in the plan** and it must be *correct* or every number
   in Act 5 is fiction. Budget for verifying it on a known benchmark (XOR is the standard NEAT
   sanity check) before it goes near the car.
2. **Pyodide budget.** Batched stepping is mandatory (§4); NEAT may not fit live at all.
3. **The double physics implementation drifting.** Mitigated by the acceptance test, not by care.
4. **Fitness-function hacking.** Expect at least one "the car learned to exploit the sim" result —
   that is a *feature*, and Act 1 should be written to receive it.
5. **Scope.** Track (20–24 pp) + capstone (24 pp) + a NEAT implementation is the largest single
   commitment on the roadmap. It is two threads, and should be sequenced as such (§10).

---

## 9. Visual identity — do it properly the first time

The warehouse capstone shipped complete and then had to be reskinned, because an accent colour is not
an identity and a per-page pedagogy box that never varies reads as boilerplate by page four. Both
lessons apply here from page one:

- The capstone gets its **own component kit** (its own `src/components/capstone/<name>.tsx`), not a
  recolour of `pedagogy.tsx`.
- Its opener **varies by act** — label, icon, and a numbered ticket — as `WorkOrder` does.
- It gets **one signature figure** that is unmistakably this project's: the **terrain profile with the
  fitness curve running along it**, or a **genome graph that visibly grows**. Nothing generic.
- The track itself stays on the standard editorial surface with the RL family's gold accent —
  identity is a *capstone* affordance, not a track one.

---

## 10. Sequencing

Two independent threads; this plan is thread 2.

- **Thread 1 (Deep RL):** Function approximation → policy gradients / actor–critic. Keeps the promise
  the warehouse's `limits` page already makes.
- **Thread 2 (this doc):** Policy-search track → Capstone B.

Within thread 2 the order is fixed: **track first, capstone second** (§1). The track's own build
order is Ch 1–4 (cheap, analytic envs) before Ch 5 (NEAT), so the largest risk is not front-loaded.

Capstone C (Lies of P) is unaffected and can have its methodology drafted at any time.

**Open decisions before any building starts:** the capstone's accent (§3), its route name, the
track's route name, and — for Act 5 — whether NEAT runs live or precomputed (§4).
