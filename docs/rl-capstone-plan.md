# Warehouse-Robot RL Capstone — Plan

> Status: **PLANNING / IN BUILD.** Blueprint for the third flagship capstone — the first
> **control** one. Caps the three built RL tracks (MDPs · Planning · Learning) the way the
> housing/NEO capstones cap the supervised families. Mirrors the NEO conventions
> (`rlCapstoneTrack.ts`, `scripts/rl_capstone_cases.py`, upgrade-driven arc, transfer ladder)
> and inherits the NEO **pedagogical contract** (`neo-capstone-plan.md` §2) verbatim.
> Route: **`/learn/warehouse-robot-capstone`**. Accent: **`--c-warehouse`** (hi-vis olive).
>
> **All numbers below are REAL**, computed during planning (2026-09-08) from the locked
> environment config. Anything not yet verified is marked ⏳.

---

## 1. The one-line thesis (the spine — we LEAD with this)

> **The algorithm is the easy part. A perfectly good Q-learning agent scores −250 and delivers
> *nothing* — until you add one bit to the state. And once it works, the "best" algorithm depends
> on a question no textbook can answer for you: how much will this robot still be exploring on the
> warehouse floor?**

Two hard truths carry it: **state design decides whether learning is possible at all**, and
**on-policy vs off-policy is a decision about deployment, not a ranking.**

## 2. Pedagogical contract — inherited from NEO §2 (GOVERNS EVERY PAGE)

Every page: **(1)** open with 🤖 **The engineer's question** — the reusable question, before the
warehouse; **(2)** teach the general move and *why it works*; **(3)** apply it here, reader predicts
first (`PredictPrompt`/`DecisionPoint`/`GuessSlider`); **(4)** close with a **transfer prompt** and
bank one **Playbook** rule. Voice: narrate *decisions and their justification*, never bare
instructions. The reader should be able to defend every choice to an interviewer.

Primitives: `AnalystQuestion` (accent + label overridden to "The engineer's question"),
`TransferBox`, `PlaybookRule` — now accent-parameterised in `src/components/capstone/pedagogy.tsx`.

## 3. The hard truths the reader discovers personally

| # | General skill gained | How it shows up here | The reusable move |
|---|---|---|---|
| **T1** | **State design decides feasibility** | Position-only agent: **0.0% delivered, −250.19**. Add one bit (`carrying`): **100%, +19.36** | "Ask *what must the agent know to act optimally?* — then test for aliasing by training on the reduced state" |
| **T2** | A hand-coded policy can be **worse than random** | Heuristic "walk toward the target": **−3539.85**, 4.1% delivered, **109.9 spills/ep** — vs random **−818.27** | "A deterministic wrong policy repeats its mistake forever; randomness at least escapes. Always baseline *both*" |
| **T3** | On- vs off-policy is a **deployment decision** | Exploration **off**: Q wins (20.04 vs 18.13, it takes the doorway). Exploration **on**: SARSA wins by a margin growing with ε (+2.1 → **+22.1**), abandoning the doorway (45%→1%) while Q's route never responds to ε | "Ask: will this policy still explore in production? Off-policy answers *'best once I stop exploring'* — an answer that never moves" |
| **T4** | Caution has a **price list** | Spills/ep: Q **0.092** · SARSA **0.041** · Expected SARSA **0.026** — for returns 20.04 / 18.13 / 17.33 | "Rank candidates on *both* axes. 'Best return' and 'fewest incidents' are different questions, and the ordering here is exactly reversed" |
| **T7** | **γ is not just a horizon — it picks the route** | γ ≤ 0.8 → the myopic robot takes the **safe bypass** (0% doorway, 33 steps, 0.002–0.026 spills); γ ≥ 0.9 → it takes the **doorway** (35–48%, 24.6 steps). The undiscounted return is *worse* when myopic (16.5 vs 21.5) | "A discount you picked for 'how far ahead' silently chose your risk appetite too — re-solve at several γ and look at the *behaviour*, not just the value" |
| **T5** | **One seed is not a result** | Returns swing tens of points across seeds; a single run can invert the ranking | "Report mean ± spread over ≥5 seeds, or you are reading noise" |
| **T6** | Know your **ceiling** | Value iteration (needs the model) gives **21.03** — the number no learner can beat | "If you own the simulator, compute the oracle. In the real world you can't — which is why baselines matter" |

## 4. The RL Playbook the reader builds (the transferable artifact)

Rules 1–14 are **shipped** (the `n=` on each page is authoritative; this list follows it). 15–17 are
planned for Acts 4–6 and will be renumbered as they land.

1. **Frame first** — the decision the agent serves + how success is measured, before any algorithm;
   bracket the problem with a floor and, if you can, a ceiling. *(index)*
2. **Turn the task into ⟨S,A,P,R,γ⟩ on paper first**, recording what each choice throws away. *(from-task-to-mdp)*
3. **Design the state by what the agent must know to act optimally; test for aliasing.** *(designing-the-state)*
4. **Reward outcomes, not methods** — stress-test against an adversary; always score on the *true* objective. *(designing-the-reward)*
5. **Choose γ from the task's timescale** — and know that shrinking it also makes the agent risk-averse. *(choosing-the-discount)*
6. **Specify the environment completely, truncation cap included**, and measure the true end-to-end cost of bad events. *(the-warehouse)*
7. **Design and freeze the evaluation harness before training**, then verify its noise floor is below your effect sizes. *(what-success-means)*
8. **Baseline twice — random and hand-coded** — remembering a deterministic policy repeats its mistakes forever. *(baselines)*
9. **Establish the ceiling before optimising**, keep V* and the scoreboard separate, and read the optimal policy's risk appetite as a review of your reward. *(the-oracle)*
10. **When you lack a model, replace the Bellman expectation with sampled transitions** and bootstrap; keep exploring so every pair is still visited. *(q-learning)*
11. **Bootstrap from the action you'll actually take (on-policy) vs the best action (off-policy) by deployment** — will it still explore in production? *(sarsa)*
12. **Replace a sampled action in the target with an expectation over the policy when you can afford it** — keeps the mean, drops target variance, steadier learning. *(expected-sarsa)*
13. **Never trust one seed** — an RL outcome is a distribution (often multimodal); report spread + failure rate; locate a trade-off in the reward/exploration before blaming the update rule. *(the-safety-tradeoff)*
14. **Judge added complexity by whether its benefit reproduces** — full distribution over seeds, distrust a mean in a multimodal world, verify any textbook effect on YOUR problem. *(algorithm-comparison)*
15. ⏳ **Tune α and ε with a protocol**, not by eyeballing one run. *(Act 4)*
16. ⏳ **Read the policy, not just the score.** *(Act 5)*
17. ⏳ **Name what the agent can never know** — and what breaks at scale. *(Act 5)*

## 5. The environment (LOCKED) — `WAREHOUSE_SETUP`

```
S......D      S = dock (start)        · spills (H) knock the robot back to S
........      P = pickup shelf          and cost the spill penalty
HHH.HH..      D = dropoff (terminal when carrying)
........      doorway = col 3 · safe bypass = cols 6–7
P.......
```
- **5×8 grid**, 40 cells. **State = (row, col, carrying)** → **80 states**. 4 actions (up/right/down/left).
- **Slip 0.10** — with prob 0.10 the robot is shoved perpendicular (0.05 each side). Walls/edges → stay.
- **Rewards:** step **−1**, spill **−30** (+ teleport back to the dock), delivery **+50** (terminal).
- **γ = 0.97.** Auto pick-up on entering P while empty; auto-deliver on entering D while carrying.
- **The design tension:** the doorway (col 3) is the short route but is flanked by spills; the
  bypass (cols 6–7) is spill-free but ~18 steps longer over the two crossings.

### Verified benchmarks (locked config)

**All numbers below come from the SHIPPED `WAREHOUSE_SETUP` code** (extracted from
`runtimeSetup.ts` and executed), not from a prototype — the prototype used a different RNG and gave
materially different values. Training: α=.1, ε=.1, 12k episodes, exploring starts, mean of 5 seeds.

| Policy | Return | Delivered | Spills/ep | Steps | Deployed at ε=.1 |
|---|---|---|---|---|---|
| Random | **−817.22** | 0.7% | 18.93 | 249.5 | — |
| Hand-coded heuristic | **−3543.05** | 3.7% | 109.98 | 245.6 | — |
| SARSA | 18.13 | 100.0% | **0.041** | — | 11.94 |
| Expected SARSA | 17.33 | 100.0% | **0.026** | — | 11.25 |
| Q-learning | **20.04** | 100.0% | 0.092 | — | 12.56 |
| **Oracle (value iteration)** | **21.00** | 100.0% | 0.145 | 24.6 | 13.58 |

`V*(dock, empty) = 3.681` (discounted); returns are **undiscounted** episode totals.
**Route:** Q-learning takes the doorway; SARSA takes the bypass — visible directly in the arrow maps.

### T1 — the state-aliasing result (the flagship reveal)

| State representation | Return | Delivered | Steps |
|---|---|---|---|
| position + carrying (80 states) | **+20.12** | **100.0%** | 27.1 |
| position only (40 states) | **−250.00** | **0.0%** | 250 (timeout every episode) |

(On-page snippet uses 3000 episodes so it runs in the browser: **+21.63 / 100.0%** vs **−250.00 / 0.0%**.)

The aliased agent is not "worse" — it is **structurally incapable**: at any cell it needs *two
different* actions depending on whether it is carrying, and one table entry cannot hold both.

### T3 — the deployment-ε result ✅ VERIFIED against shipped code (6 seeds × 800 eval eps, ± SE)

Trained at ε, **deployed at the same ε** (the agent keeps exploring in production):

| ε | Q-learning | spills | doorway | SARSA | spills | doorway |
|---|---|---|---|---|---|---|
| **0** (greedy) | **20.04** | 0.092 | doorway | 18.13 | 0.041 | bypass |
| 0.05 | 13.98 ± 1.17 | 0.19 | 45% | **16.07** ± 0.71 | 0.21 | 45% |
| 0.10 | 12.67 ± 0.87 | 0.21 | 34% | 12.18 ± 0.54 | 0.14 | 23% |
| 0.15 | 2.94 ± 3.44 | 0.23 | 18% | **7.14** ± 0.88 | 0.16 | 16% |
| 0.20 | −10.85 ± 14.35 | 0.49 | 53% | **−2.11** ± 4.40 | 0.17 | 1% |
| 0.30 | −33.83 ± 20.96 | 0.78 | 46% | **−11.76** ± 0.65 | 0.34 | 1% |

**The complete, verified story — this is the classic result, earned on our own environment:**
- **Deploy with exploration OFF and Q-learning wins** (20.04 vs 18.13): it learned the genuinely
  optimal route, straight through the doorway.
- **Deploy with exploration ON and SARSA wins, by a margin that grows with ε** (+2.1 at .05, +4.2 at
  .15, +8.7 at .20, **+22.1** at .30). SARSA abandons the doorway as ε rises (45→23→16→1→1%);
  Q-learning's route never responds to ε, because off-policy asks *"what's best once I stop
  exploring?"* — a question whose answer does not depend on ε.
- **Q doesn't just lose at high ε, it becomes erratic**: ±14.35 and ±20.96 vs SARSA's ±4.40 and
  ±0.65. Its spill rate runs 2–4× SARSA's (0.78 vs 0.34 at ε=.30).
- ⚠️ **The ε=0.10 row is a near-tie** (12.67 ± 0.87 vs 12.18 ± 0.54) — we say so on the page rather
  than pretending the ranking is clean everywhere. `tuning-protocol` reuses this exact table for
  **T5**: at ε=0.20 a single seed could have told you either story.

### Act-1 supporting results ✅ VERIFIED

**γ sweep** (oracle re-solved at each γ; the T7 payload — note the sharp transition at γ≈0.85):

| γ | return | steps | spills/ep | doorway |
|---|---|---|---|---|
| 0.50 | 16.46 | 33.5 | 0.002 | **0%** |
| 0.80 | 16.14 | 33.1 | 0.026 | **0%** |
| 0.90 | 21.46 | 24.8 | 0.125 | 35% |
| 0.97 | 20.53 | 24.6 | 0.162 | 35% |
| 0.99 | 21.60 | 24.9 | 0.118 | 48% |

**Step cost** (optimal policy re-solved at each): 0.0 → 46.22 ret / **25.4 steps**; −0.1 → 43.73 /
24.9; −1.0 → 20.70 / 24.7; −3.0 → −28.29 / **24.3**. **The honest finding:** the step cost moves the
*scale* of the return but barely moves the *behaviour* (25.4 → 24.3 steps across a 30× change) —
because with γ<1, **discounting is already supplying the urgency**. Good `designing-the-reward`
content: the knob you reach for is not the one doing the work.

**Stochasticity demo:** "right" from the dock, 1000 samples → (0,1) **92.0%**, (1,0) 4.1%,
(0,0) 3.9% (slipped up into the wall and stayed). One snippet that teaches slip *and* wall-bounce
*and* "the robot never gets to read these odds".

## 6. Track blueprint — 24 pages / 6 acts (`rlCapstoneTrack.ts`, BUILT)

### Act 1 — Frame it as an MDP
| Page | 🤖 Engineer's question | Transferable move | Instance |
|---|---|---|---|
| `index` | "What decision does this agent serve, and what is success?" | Framing a control problem as a decision + a metric | The warehouse brief; ModelAnatomy |
| `from-task-to-mdp` | "How do I turn a fuzzy task into ⟨S,A,P,R,γ⟩?" | The MDP-ification checklist | Name each element for the warehouse |
| `designing-the-state` | "What must the agent know to act optimally?" | **T1** — the aliasing test | Position-only fails: 0% delivered |
| `designing-the-reward` | "What do I reward — and what will it exploit?" | Reward the *what*; reward-hacking smells | Why not reward "moving toward P" |
| `choosing-the-discount` | "How far ahead should it care?" | γ as an effective horizon | γ sweep on the warehouse |

### Act 2 — Lock the harness before learning ✅ BUILT (2026-09-08)
Verified against the shipped `WAREHOUSE_SETUP` and re-confirmed by clicking Run in the browser
(map snippet and the baselines snippet both reproduced the published output character-for-character):

- **True cost of a spill = 39.26, not the 31 written** — 3,000 optimal episodes split clean/spoiled:
  26.25 @ 23.7 steps vs −13.01 @ 30.4 steps. The tow back to the dock is ~a quarter of the damage.
  (Sets up the doorway-vs-bypass ratio: the bypass costs ~6 steps, so the doorway pays iff it spills
  less than ~1 episode in 6.)
- **Evaluation ε matters more than most algorithm changes** — same optimal policy: ε=0 → 20.97;
  0.02 → 20.35; 0.05 → 18.02; 0.10 → **13.10**, with spills 0.147 → 0.289.
- **Noise floor** — 15 independent evaluations of one fixed policy: n=20 → mean 22.28, sd 2.73;
  n=100 → 21.27, sd 1.43; n=500 → 21.00, sd 0.72. ⇒ protocol locked at **n=2000** (≈ ±0.35).
- **Baselines** — random **−815.79** / 0.7% / 18.89 spills; hand-coded row-then-column heuristic
  **−3560.04** / 3.2% / **110.50 spills** (drives into (2,0), towed to the dock, repeats forever).
- **Oracle** — V*(dock,empty) = **3.68** (discounted) vs measured **21.21** / 100% / 0.138 spills /
  24.6 steps (undiscounted scoreboard). Both correct; never quote one for the other.
- **The ceiling is not the safe policy** — solving with SPILL=−300 and scoring on the real reward
  gives a genuinely **zero-spill** policy at **16.44** / 33.6 steps. Optimal buys **+4.77** by
  accepting ~1 spill per 7 episodes. That risk appetite is a consequence of our −30 / −1, not of the
  warehouse.
- New shared component **`src/components/capstone/FloorPlan.tsx`** — the capstone's signature motif
  (static SVG floor plan, hatched spill wall, both crossings annotated).

| Page | 🤖 Engineer's question | Transferable move | Instance |
|---|---|---|---|
| `the-warehouse` | "What exactly am I training against?" | Reading an env spec: dynamics, stochasticity, episode boundaries | Field guide + slip demo |
| `what-success-means` | "Greedy return or on-policy return — and over how many seeds?" | **RL's evaluation harness**, locked before training | Protocol we then obey everywhere |
| `baselines` | "What's the trivial number every agent must beat?" | Baseline random *and* hand-coded | **T2**: heuristic −3540 < random −818 |
| `the-oracle` | "What's the best *anyone* could do here?" | Oracle ceiling when you own the model | VI → 21.03 |

### Act 3 — Learn it, algorithm by algorithm ✅ BUILT (2026-09-08) — ⚠️ SPINE REVISED
**The plan's original T3 ("on-policy vs off-policy = the safe/risky route crossover") DID NOT
REPRODUCE and was NOT shipped.** Verified against the shipped `WAREHOUSE_SETUP` + browser-Run, and
— critically — over **10 training seeds per algorithm** (via `scripts/rl_capstone_cases.py`, created
this session). What the seeds revealed:

- The warehouse has **two stable policies**: risky doorway (**21.21**, 0.138 spills, 24.6 steps) and
  safe bypass (**16.44**, 0.000 spills, 33.6 steps). On our reward the risky one is *better*.
- **Which basin an agent lands in is a seed lottery, not an algorithm property.** 10-seed greedy
  returns pile up bimodally at ~21 and ~16.4 with occasional ~−3 (broken/non-delivering):
  - Q-learning: `-3.3 16.3 21.1 21.2 20.9 21.0 21.0 20.9 21.0 16.4` → risky **7/10**, mean 17.66, median-spills 0.117, **1 broken**
  - SARSA:      `21.3 16.4 -3.2 20.9 21.0 20.7 16.6 21.1 21.1 16.8` → risky **6/10**, mean 17.27, median-spills 0.092, **1 broken**
  - Exp. SARSA: `21.0 16.4 16.5 16.4 16.4 21.0 21.2 16.4 21.1 21.0` → risky **5/10**, mean 18.74, median-spills 0.050, **0 broken**
- **Q 7/10 vs SARSA 6/10 risky = indistinguishable** → the cliff-walking distinction is invisible
  above seed noise here. We say so explicitly and make refusing-the-tidy-story the lesson.
- **The one reproducible edge is Expected SARSA's**: zero broken runs, lowest spills (0.050) — its
  zero-variance target (verified: at (1,3) empty the SARSA target has mean 4.024 **std 9.105**, the
  Expected-SARSA target is 4.047 **std 0.000**). Its higher *mean* comes from never failing, not from
  better routes — a mean in a multimodal world measures failure rate.
- Per-page single-seed (seed 0, 6000 ep, greedy): Q learning-curve 100ep −259/0% → 1000ep 20.55/100%
  → 6000ep 20.58/100%; SARSA 20.84; Exp. SARSA 20.97. New signature component **`FloorPlan.tsx`** reused.

| Page (slug) | 🤖 Engineer's question | Shipped instance |
|---|---|---|
| `q-learning` | "Simplest agent that learns this?" | Sampled Bellman backup; curve −259 → 20.55 by 1000 ep |
| `sarsa` | "Value the policy I actually run?" | One-symbol diff; 20.84; on/off-policy by deployment |
| `expected-sarsa` | "Keep the mean, cut the noise?" | **T4** — target std 9.105 → 0; 20.97; fewest spills |
| `the-safety-tradeoff` | "Which route — and does the algorithm decide?" | **T3 (revised)** — two basins, a seed lottery, cliff did NOT reproduce |
| `algorithm-comparison` | "Did the complexity earn its keep?" | 10-seed table; ship Expected SARSA for reliability, not route |

Playbook rules **10–14 shipped** here (see §4). tsc EXIT 0; all 5 pages 200; every runnable cell
browser-Run-verified to reproduce its output character-for-character; only favicon 404.

### Act 4 — Make it work: tuning
`the-step-size` (α) · `exploration-schedule` (ε, decay, GLIE) · `optimism-and-initialisation` ·
`tuning-protocol` (**T5** — seeds, spread, and not fooling yourself).

### Act 5 — Evaluate, interpret, stress-test
`reading-the-policy` (route maps for both carrying states) · `failure-modes` (the off-path
coverage trap we hit for real during design — see §9) · `limits` (partial observability, the table
wall → function approximation).

### Act 6 — Conclude & transfer
`takeaways` (the §4 Playbook + notebook) · `transfer-near` (a new warehouse: moved spills/doorway,
different slip) · `transfer-far` (**inventory control** — a non-grid MDP: stock levels, stochastic
demand, order costs; same Playbook, no grid intuition to lean on).

## 7. New vs reused labs
- **New:** `WarehouseLab` (flagship — live training on the grid, algorithm/α/ε switches, route
  overlay), `RouteCompareLab` (Q vs SARSA routes + the ε-crossover curve), `StateAliasingLab`
  (toggle the carrying bit and watch delivery collapse — the T1 reveal).
- **Reused:** `AnimatedRolloutLab` pattern, `MdpSandboxLab` idioms, `DecisionPoint`, `GuessSlider`,
  `PredictPrompt`, `LabFrame`, `Quiz`.

## 8. Honest-numbers, reproducibility, wiring
- `scripts/rl_capstone_cases.py` produces **every** published number (currently prototyped in the
  session scratchpad as `wh2.py` / `final.py` / `cross2.py`).
- `WAREHOUSE_SETUP` preamble in `runtimeSetup.ts` so every CodeBlock is runnable in Pyodide (numpy
  only — the env is hand-written, no gym).
- Downloadable reproduction notebook in `public/warehouse-capstone/`.
- Wiring: `rlCapstoneTrack.ts` ✅, `layout.tsx` ✅, `--c-warehouse` token ✅, `siteMap.ts` CAPSTONES
  entry + `searchIndex.ts` ⏳.

## 9. Design decisions & lessons already paid for
- ✅ **Route/accent/genre decided** (see header).
- ✅ **Two crossings, not one** — the robot crosses the spill wall twice (empty→P, carrying→D), so
  the risky/safe decision is made twice per episode and the state-design lesson is unavoidable.
- ⚠️ **A real failure we hit while designing (now a *page*, `failure-modes`):** with a **fixed start**
  and ε=0.1, off-path states get almost no visits, so their greedy actions stay garbage — and slip
  occasionally drags the agent there, causing catastrophic loops (a cell pointing into a wall
  forever). Training with **exploring starts** fixed it. This is a genuine, transferable RL lesson
  about *coverage*, discovered honestly, and it is why the first draft of the algorithm table was
  nonsense.
- ⚠️ **The cliff story does NOT reproduce here** — Q-learning beats SARSA on *return* at ε=0.10 and
  0.15, and the two are tied at ε=0.30. We will **not** re-tell the textbook cliff. What replaces it
  is stronger and verified: the **behavioural** law (SARSA's route responds to ε, Q's does not) plus
  an honest error-barred return table that refuses to crown a winner. Re-telling the cliff here would
  have been the exact failure [[verify-the-effect-before-writing-the-prose]] warns about — this is the
  third time in the RL family that checking first changed the claim.
- ❓ **Open (needs the user):** (a) the `--c-warehouse` hi-vis-olive accent — yes/no; (b) whether
  `transfer-far` is **inventory control** (recommended: non-grid, stock levels + stochastic demand,
  so no grid intuition survives) or elevator dispatch.

## 10. Visual identity
Restrained, per NEO §11: its own accent (`--c-warehouse`, hi-vis olive — the one clearly unoccupied
hue in the riso palette, and thematically right for a warehouse), plus a **signature motif**: the
warehouse floor plan itself, rendered as a hairline grid with spill cells in `--bad` and the two
candidate routes drawn as overlays. No theme swap, no gradients. **Accent needs the user's yes/no.**
