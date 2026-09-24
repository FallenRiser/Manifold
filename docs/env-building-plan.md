# Building environments from scratch — track plan

*Planned 2026-09-13. Authority for the RL-family track "Building environments from scratch".*

## The decision

Every RL track so far hands the reader a world. This one teaches how to **make** one — and does it three
times, at rising ambition, each world taken through the same five-stage pipeline:

1. **Plan** — the task in words → an MDP spec (what the agent sees, does, is paid for, and when it ends).
2. **Parameterise** — the physical/game constants, the spaces, the timestep, the randomness.
3. **Code** — `reset(seed) → (obs, info)` and `step(a) → (obs, r, terminated, truncated, info)`, the Gymnasium contract, written by hand.
4. **Test** — sanity agents (random, constant), a hand-written expert (the solvability check), invariants, an analytic or planning oracle where one exists.
5. **Train** — drop an agent in, read what it learned, find what broke, fix the env or the agent.

The lunar lander was prototyped and **rejected by the user as unoriginal** (its effects were real).

## The three worlds (user-selected)

| | World | Runs where | Agent | Headline claims to VERIFY before prose |
|---|---|---|---|---|
| 1 | **Beat to windward** — a sailboat must reach an upwind mark | fully in-browser (Pyodide) | tabular Q-learning | agent invents tacking; beating angle ≈ polar VMG optimum; pay-for-speed → sails away, never arrives |
| 2 | **Wildfire command** — helicopter crew protects a village | local PC; mini map in-browser | PPO + small CNN | coupled systems; cobra effect (pay per extinguished cell → lets fires grow?) |
| 3 | **Boss fight simulator** — a Soulslike duel | local PC (GTX 1660 Ti) | PPO, vectorised numpy sim | learns to wait out delayed attacks and parry; chip-damage reward → turtling |

World 3 answers the user's earlier question on the Lies of P capstone ("can we build an environment instead
of cloning?") and its results should sit beside that capstone's behavioural-cloning agent.

## Outline (draft — titles move as experiments land)

Route `/learn/building-environments`, accent `--c-rl`, sidebar `src/lib/envBuildingTrack.ts`.

1. **What an environment is** — Every track handed you a world (hub) · The reset/step contract · Terminated vs truncated · Plan, parameterise, code, test, train
2. **World 1 · Beat to windward: plan & build** — The brief: reach an upwind mark · Parameterising a boat: the polar diagram (derives the VMG oracle) · Writing `step()` · Where the course ends
3. **World 1 · test & train** — Sanity agents and a sailor who can't lose (solvability) · Designing what the boat sees · The agent invents tacking · Pay for speed, get a boat that never arrives
4. **World 2 · Wildfire command: plan & build** — The brief · Fire as a cellular automaton · Wind, moisture and slope · The helicopter: logistics as a system · Coupled clocks · A grid you can vectorise · Invariants and property tests
5. **World 2 · test & train** (revised 2026-09-13 to follow the measured story; sidebar updated in `envBuildingTrack.ts`, track now 14 of 40 pages, tsc clean, browser-verified) — Baselines a fire chief would try · The crew that learned nothing (flat pilot: dump-the-bucket trap; one drop = +4 vs sd 103; random pilot never scores after a refill) · Pilot or commander: choosing the action (K sweep; K=1 reproduces the chiefs) · Reward is a values decision · Training the crew: DQN vs PPO (your PC) · The cobra effect: pay per fire put out · What the crew learned (probe / endgame / village-threat)
6. **World 3 · Boss fight: plan & build** — Designing a boss: a moveset as a state machine · Frames, hitboxes, i-frames · Stamina and the perfect-guard window · What the agent sees: vectors vs pixels · Thousands of duels at once
7. **World 3 · test & train** — Scripted players and a difficulty dial · Curriculum: one move, then the set · Training (your PC) · The turtle: reward hacking a duel · What it learned about delayed attacks · Sim vs the real game
8. **The throughline**

**Decided 2026-09-13 (user): the agent for Worlds 2 and 3 is whichever trains BETTER.** Run DQN (built in
Function approximation) and PPO head to head on each world's prototype, at equal environment steps and several
seeds, and ship the winner. If PPO wins, it is used here as a tool with a forward pointer, and the
policy-gradient track (renamed in the site map to "Policy gradients, actor–critic & PPO") teaches it properly.
The head-to-head itself is worth a page if the gap is real — and an honest null if it is not.

## Build status

**Chapters 1–2 shipped (8 pages), every cell browser-verified by exact string equality:** hub · the-reset-step-contract ·
terminated-vs-truncated · plan-parameterise-code-test-train · the-brief · parameterising-a-boat · writing-step ·
where-the-course-ends. **Chapter 3 (5 pages) — ✅ COMPLETE:** sanity-agents · paying-the-boat ("−1 per second,
investigated") · what-the-boat-sees · the-agent-invents-tacking · pay-for-speed. **World 1 is finished (13 pages), every
cell browser-verified by exact string equality.** Plus the training-ground page (14). **Chapter 4 (World 2 build,
7 pages) — ✅ COMPLETE:** wildfire-brief · fire-as-a-cellular-automaton · wind-moisture-and-slope · the-helicopter ·
coupled-clocks · a-grid-you-can-vectorise · invariants-and-property-tests. **Chapter 5 (World 2 test & train, 7 pages) —
✅ COMPLETE:** baselines · the-crew-that-learned-nothing · pilot-or-commander · reward-is-a-values-decision ·
training-the-crew (ships `scripts/wildfire_train.py`; nine Colab runs) · the-cobra-effect · what-the-crew-learned.
**World 2 is finished.** World 3 is under way: its prototype is gated (see the World 3 log at the foot of
this file) and its first page has shipped. **Track: 29 of 41 pages, 0 without a visual.** Next: chapter 6
page 2, "A moveset as a state machine".

`wildfire_train.py` now carries the analysis half as well as the training half: `learned` (behaviour probe),
`shield` and `snap` (the two ablations), `where-won` (per-world gap distribution) and `figure` (writes
`src/components/fire/data/whatLearned.ts`, the way `curves` writes `raceCurves.ts`). Run `version` FIRST on any
machine — two Colab batches have already come back from a stale trainer.

⚠️ **UNTESTED and named as such on the page:** a crew *retrained* in a world where drops do not wet (`WET = 0`).
The `shield` ablation runs the shipped crew out of its training distribution, which is enough for the narrow claim
the page makes and not enough for "the problem needs wetting". Also open: whether the crew's off-fire aim is
anticipation or ambient spread — the control is a matched target at the same distance from the same fire.

## ⚠️ CORRECTION 2026-09-13 — "−1 per second never learns" is FALSE as a general claim

Chapter 3 measurements at the shipped 60 m config (shipped code, 5 seeds unless noted):
- time reward, 2000 races, ε₀ 0.1: test arrivals **4 / 18 / 0 / 0 / 0 (4.4 ± 7.0)** — BUT practice arrivals **408 / 360 / 365 / 382 / 376**, first arrival at episode **68 / 64 / 48 / 83 / 23** (EARLIER than the progress boat's 248 / 610 / 189 / 120 / 128; progress practice arrivals 1271 / 585 / 983 / 1269 / 1210). So the time boat DOES find the mark; the failure is at TEST.
- time reward, 6000 races (3 seeds): ε₀ 0.3 → **83 / 197 / 200**; ε₀ 1.0 → **173 / 112 / 105**. It learns, slowly.
- **Stall-loop test (`stall_exp.py`, 200 held-out races, 5 seeds):** time reward FROZEN greedy — ran out 159/130/125/101/129, stalled at buzzer (u < 0.05) 155/120/124/76/128, **stuck in ONE table cell for the final 50 s: 140/87/98/62/86**. Same tables with ε = 0.05 at test — arrivals 26/19/3/9/11 (mean **13.6** vs 4.4 frozen), one-cell loops drop to **13–20**, but still 85–107 stalled. ⇒ frozen loops are REAL but only part of the story (breaking them adds ~9 finishes). Progress boats: frozen ran out 9–44 (seed 0 has 42 one-cell loops too); ε = 0.05 barely changes arrivals (156→164, 165→161, 190→177, 177→182, 191→188).
- ✅ **RESOLVED (`learnon_exp.py`, 5 seeds):** time reward — last-200 practice arrivals 83/79/71/74/74; frozen test 4/18/0/0/0; **greedy test with the table still learning inside each race (fresh copy per race): 117/101/61/129/65 = 94.6 ± 27.3.** Progress reward — practice 189/160/180/193/195; frozen 175.8; learning-on 160/175/191/198/196 = 184.0 ± 14.5 (barely changes). ⇒ **The −1 boat's successes live in its UPDATE RULE, not its table**: each stalled second's −1 pushes the stuck action's value down until another action wins. Freeze the table and the escape mechanism is gone.
- ✅ **Budget, not exploration:** time reward ε₀ 0.1 × **6000** races → 171/77/167 (**138.3 ± 43.4**); ε₀ 0.3 × 2000 races → 19/3/0 (**7.3**). −1 per second is a SLOW reward, not a broken one; distance-gained reaches 175.8 in 2000.
- **Tacking page data (seed 0, shipped config):** 156/200, 59.4 s, 1.28 tacks, median beat 52.3° (oracle 49.5°). Heading histogram while beating: **only 1.3 % of beating seconds within ±30° of the wind**; peaks at −50…−40° (20.0 %) and +30…+40° (10.0 %); 12.3 % beyond ±80°. Held-out race 0: 53 s, 1 tack, rounded (clean zig-zag). Race 1: 200 s, 2 tacks, ran out — **first within 20 m of the mark at 48 s, closest 10.0 m, 36 s within 20 m, final speed 0.00, ONE table cell for the final 50 s**. Across the 44 ran-out races: **37 came within 20 m**, closest-approach median 12.4 m (range 10.0–56.4) ⇒ failures are near-miss stalls at the finish, not getting lost. Hypothesis: the first distance band (≤ 15 m) lumps "almost there" with "there". ⚠️ **Experiment was BADLY DESIGNED:** band edges [10, 15, …] gave results identical to the digit (156/165/190/177/191) because d ≤ 10 is terminal — no decision is ever made in the new band, so it is the same view renumbered. Cause of the near-miss stalls remains OPEN; page says so. **Near-miss failures per seed: 37 / 13 / 8 / 2 / 1 (61 total) — seed 0 is the WORST of five and owns 37 of them;** disclosed on the tacking page. Per-seed (from w1): times 59.4/73.9/82.6/79.8/70.0 s, tacks 1.28/1.23/1.70/1.33/1.28, beat 52.3/41.4/49.2/43.5/42.7°, VMG loss 1.0/11.8/0.0/6.2/7.9 %.
- **Speed page data (seed 0):** 0/200, left 22, 3.17 circles/race; held-out race 0: 200 s, mean speed 2.47 m/s, paid 493.9, closest approach 55.7 m (it started 60 m away) — big loops behind the start. **Arithmetic (γ 0.99, bootstrapped):** circling forever at 2.47 m/s = **247.0**; rounding the mark at 48.3 s even at top speed ≤ **115.0** (at 59.4 s ≤ 134.4); leaving the course after 50 s ≤ **57.0**. Finishing ends the paycheck.
- Page title: "Paying the boat: −1 per second, investigated". Honest story = three clues (practice successes exist → frozen loops → learning-on recovers) + budget test + the standard dense-vs-sparse explanation (link warehouse PBRS page; note our progress reward is F = Φ(s′) − Φ(s), not γΦ(s′) − Φ(s), so only approximately potential-based at γ = 0.99).
- Shipped sentences to fix: any "never learns / never teaches" wording (contract page spoiler, pipeline build log). Page renamed "Paying the boat: −1 per second, investigated".

Also measured for chapter 3: observation views (progress, penalised edge, 5 seeds): absolute (x, y, heading) **140.8 ± 39.4** (185/81/120/135/183; 3219 of 5184 cells visited, seed 4) · relative (shipped) **175.8 ± 13.7** (2922 visited) · relative + speed **168.6 ± 28.5** (124/185/193/146/195; 3364 of 15552 visited). ⚠️ The 100 m prototype's 0/200 for the absolute view is confounded (different α, budget) — do NOT present it as the 60 m result. Speed-paid boat, 5 seeds: arrivals 0/0/1/0/0, circles 3.17/3.03/4.50/4.30/4.27 (mean 3.85), left 22/41/22/6/41. Hold-course ran-out races: 40, of which 32 started inside the dead zone and 8 within 3.6° of its edge.

## Gating experiments (World 1)

Status is updated as each is run. **No page may state an effect that is not marked verified here.**

- [x] Oracle exists: polar VMG optimum = **49.50°**, VMG 1.565 m/s; fastest heading 101.7° (2.99 m/s).
- [x] Solvable: hand-written layline sailor arrives **200/200**, mean 75.7 s, 1.0 tacks, beats at 50–60°.
- [x] Sanity agents fail: random 4/200, hold-course 0/200.
- [x] Tabular Q learns to arrive — but **only with a progress reward**. Sweep (3000 eps, 3 seeds, 200 eval starts, ε₀=0.1, α=0.2, γ=0.99):

  | obs | edge | reward = −1/step | reward = distance gained |
  |---|---|---|---|
  | relative | none | 0 / 0 / 2 | **186 / 180 / 179** |
  | relative | ends episode, no penalty | 0 / 0 / 0 — **leaves the course 136–159/200** | 189 / 158 / 196 |
  | relative | ends episode, penalty | 0 / 1 / 1 | 159 / 191 / 182 |
  | relative+speed | none | 1 / 30 / 0 | 110 / 157 / 108 |
  | relative+speed | no penalty | 0 / 0 / 0 (out 144/93/80) | 179 / 190 / 187 |
  | relative+speed | penalty | 1 / 0 / 0 | 67 / 158 / 119 |

  - ⭐ **The escape hatch (verified 3/3 seeds):** −1 per step + an unpenalised edge ⇒ the agent learns to sail OFF the course — 183 / 186 / 196 of its last 200 training episodes end out of bounds. Ending the episode is the cheapest way to stop paying.
  - ⭐ **The obvious reward never learns:** −1/step fails even with a penalised edge; stronger exploration (ε₀ 0.3 / 1.0, α 0.5) only reaches 0–44/200. Distance-gained is potential-based (Φ = −distance) so it reshapes learning without (at γ=1) changing the optimum — link the warehouse capstone for the theory.
  - ⭐ **Honest null — adding speed (the Markov-completing variable) made it WORSE or no better:** 3× the table, slower learning. Momentum here is mild (inertia 0.3).
- [x] Learned beating angle: progress agents beat at a median **41.2–49.1°** vs oracle 49.5° — they pinch slightly high. VMG cost to be quantified. Arrival times 96–153 s vs the expert's 75.7 s.
- [x] **Budget is a phase transition** (progress reward, relative obs, 5 seeds, 200 eval starts): penalised edge 500 eps **0/0/0/0/0** · 1000 **0/0/0/0/0** · 1500 **119/48/121/0/185** · 3000 **159/191/182/176/185 (178.6 ± 10.9)**; no edge 3000 → **181.6 ± 2.9**. 3000 eps ≈ 10 s/seed native ⇒ ~50 s Pyodide — too slow for a live cell as is.
- [x] **VMG cost of pinching** (3000 eps): learned median angles 41.3–48.0° lose **0.3–12.5 %** of the best VMG (1.5647 m/s at 49.5°).
- [x] **Speed-paid boat does donuts:** bounded course (penalised edge) 0/100 arrive in 3/3 seeds, **3.2–5.8 full circles per episode**, stays inside the edge (max radius 149–153 m; one seed still exits 24/100). Open course: 0/100, 6.6–8.3 circles/episode, ends ~785 m away.
- [x] **Live-cell budget found** (progress reward, penalised edge, 5 seeds): **60 m course, 200-step clock** — α 0.2: 1000 eps 26.6 ± 53.2, 2000 eps 23.0 ± 37.2; **α 0.5: 1000 eps 139.4 ± 34.0 (2.1 s/seed), 2000 eps 175.8 ± 13.7 (3.7 s/seed native ⇒ ~18 s Pyodide)**. 100 m course, α 0.2, 1000 eps: 0/0/0/0/0. **Candidate canonical config: 60 m, 200 steps, α 0.5, 2000 eps** — every headline above must be RE-VERIFIED under it before prose (`sail_canon.py`).
- [x] **Canonical baselines (60 m, 200-step clock, penalised edge, 200 starts):** random **4/200** (181 leave the course) · hold course **0/200** (160 leave) · layline expert **200/200 in 48.3 s**, 1.0 tacks, beats at 50.6° (0.2 % VMG loss). Straight-line bound (50 m of windward progress at best VMG) = 32.0 s.
- [x] 100 m course sweep (5 seeds): α 0.2 — 1000 eps 0.0 ± 0.0, 2000 eps 105.6 ± 69.3; α 0.5 — 1000 eps **172.2 ± 29.0** (2.9 s/seed), 2000 eps **143.4 ± 27.1**. ⚠️ **More training made it WORSE at α 0.5** (constant large step size never settles) — note for the step-size discussion; do not claim "more episodes ⇒ better".
- [x] ✅ **CANONICAL CONFIG LOCKED & RE-VERIFIED** — 60 m course, 200-step clock, course edge radius 150 m, arrive within 10 m, relative obs (heading 10° × mark bearing 15° × 6 distance bins = 5184 states), α 0.5, γ 0.99, ε 0.1→0 linear, 2000 episodes, eval on 200 held-out starts (seeds 10⁶+k):

  | experiment | seeds | arrivals /200 | detail |
  |---|---|---|---|
  | distance-gained, penalised edge | 5 | **156 / 165 / 190 / 177 / 191 (175.8 ± 13.7)** | 59.4–82.6 s; beat 41.4–52.3°; VMG loss 0.0–11.8 %; 1.2–1.7 tacks; 4.9 s/seed native |
  | −1/step, edge ends episode free | 3 | **0 / 0 / 0** | greedy boat LEAVES the course 115 / 178 / 148 of 200; ~half of last-200 training episodes end out of bounds (99 / 110 / 115) |
  | −1/step, penalised edge | 3 | 4 / 18 / 0 | never learns |
  | −1/step, no edge | 3 | 27 / 4 / 0 | never learns |
  | paid its speed, penalised edge | 3 | 0 / 0 / 1 | **3.0–4.5 full circles per episode** (progress agent 1.4–2.2, expert 0.6); exits 22–41 |
  | baselines | — | random 4 · hold 0 · **expert 200 (48.3 s)** | |

  ⚠️ The escape hatch is weaker at 60 m than at 100 m (100 m: 183–196 of last-200 training episodes left the course). Quote the 60 m numbers only.
- [x] ✅ **Shipped code reproduces:** `ENV_SETUP` in `runtimeSetup.ts` + `python scripts/env_cases.py w1` gives every number in the canonical table above exactly (156/165/190/177/191; expert 200 in 48.34 s; 0/0/0 free edge, exits 115/178/148; etc.). Hub cell (seed 3): random 58 s left course · hold 51 s left course · expert 52 s, 1 tack, rounded the mark.
- [x] **Contract checker** (5 promises): `Sail` passes 5/5; `LeakySail` (heading from global `np.random`) passes 4/5 and FAILS only "same seed + same actions = same episode" — promise 5 (different seed changes start) still passes, which is why the bug survives casual testing. Gymnasium docs confirmed: `done` → `terminated`/`truncated` "changed in version 0.26"; seeding via `reset(seed=)`; Gymnasium says truncation may also mark going out of bounds — we choose TERMINATED for leaving the course (disqualification ends the race) and must justify it on-page.
- [x] ⭐ **Terminated vs truncated is decided by the TASK, not by convention** (progress reward, penalised edge, 5 seeds, arrivals /200):

  | clock | time in obs | bootstrap at the buzzer (truncated) | zero at the buzzer (terminated) |
  |---|---|---|---|
  | 200 (≈4× expert's 48.3 s) | no | **175.8 ± 13.7** | 159.6 ± 18.6 |
  | 200 | yes (4 bins) | 166.4 ± 24.7 | 156.6 ± 30.4 |
  | 80 (≈1.7× expert) | no | 7.2 ± 10.6 | **76.4 ± 30.9** |
  | 80 | yes (4 bins) | 14.2 ± 11.4 | **85.6 ± 45.1** |

  - Generous clock = safety net ⇒ label barely matters (all within noise) ⇒ **truncated** is the honest label and is what ships.
  - Tight clock = a rule of the race ⇒ treating the buzzer as terminal is **10× better**; bootstrapping teaches values for a race that never ends.
  - Remaining time in the observation does not rescue either case at this table size (4× states). Side observation: time-aware agents at clock 200 arrive much slower (113–164 s vs 59–83 s) — report as measured, don't explain beyond evidence.
  - Pardo et al. 2018 ("Time Limits in Reinforcement Learning") is the right citation for the two cases.
  - ✅ Reproduced from SHIPPED code: `Sail(..., clock)` + `train_sailor(..., clock, bootstrap_truncation)` + `race(..., clock)`; `python scripts/env_cases.py trunc` gives the no-time rows exactly (per-seed 200/boot 156/165/190/177/191 · 200/zero 157/196/148/152/145 · 80/boot 4/0/4/28/0 · 80/zero 77/86/20/85/114). Default path re-checked unchanged (`w1`). Live cell (seed 0, clock 80): boot **4/200, 56.2 s** · zero **77/200, 50.9 s**, 6.0 s native. The time-in-obs rows come from the scratch prototype only (cited in a Proof aside as such).
- [x] **Course-edge page cells (shipped code, seed 0, reward −1/step):** expert's farthest point from course centre in 200 races **54.4 m** (edge radius 150 m). Edge none: practice exits 0/200, test rounded 27 left 0 · **free: practice exits 99/200 after 100.6 s mean, test rounded 0 left 115** · penalised (−remaining clock): practice exits 33/200 after 135.8 s mean, test rounded 4 left 37. 11.9 s native for 3 trainings.
- [x] ⭐ **Why the penalty doesn't close the escape (arithmetic, γ = 0.99, bootstrapping through the clock):** a hopeless boat is valued at −1/(1−γ) = **−100** forever. Free exit at 100.6 s = **−63.6**. Penalised exit G(t) = −(1−γᵗ)/(1−γ) − γᵗ⁻¹(200−t): t=20 **−166.9**, t=50 −131.2, t=100.6 −100.1 (break-even), **t=135.8 −91.0**, t=180 −86.9. ⇒ the penalty punishes EARLY exits and still rewards LATE ones — predicts both the residual exits (33/200) and that they come later (135.8 vs 100.6 s). Undiscounted intuition ("penalty = rest of the clock ⇒ equal") is wrong on two counts: discounting shrinks a late penalty, and bootstrapping values staying at −100, not −200.
- [x] **Edge choice for the SHIPPED reward (progress, 60 m, 5 seeds):** none **138.2 ± 45.9** (187/92/170/74/168) · free **173.6 ± 23.2** (195/184/190/131/168; exits 0/0/0/2/0) · penalised **175.8 ± 13.7**. Edge vs none: 37-race gap NOT strictly resolvable (spreads overlap) but two no-edge runs collapsed (92, 74) and no edged run fell below 131. Free vs penalised: tie ⇒ penalised chosen by reasoning (safe under every reward tested; free edge is an escape hatch under −1/step).
- ~~first attempts~~: (x, y, heading) table 0/200 for every reward; far distance bin aliased 80 m…∞.
- [x] Pay-for-speed hack (relative+speed, 1500 eps): 0/200 arrive, |heading| 110–150° after t=50 (median 131°, where speed is within 6% of max), ends a mean **839 m** from the mark.
- [ ] Live-cell budget in Pyodide.

## World 2 · Wildfire command — SHIPPED CODE (2026-09-13)

`WILDFIRE_SETUP` in `src/lib/runtimeSetup.ts` = single-world, Gymnasium-shaped port of the canonical prototype:
`Wildfire` (pilot, nA 6; rewards values | area | extinguish; drop_r default 2) · `Command` (target cell, nA 256,
DECIDE_EVERY 4) · `pilot_chief(nearest|guard)` · `dispatcher(random|random_fire|nearest|guard|densest)` · `fly` /
`command` scorers on held-out seeds 1000–1199 · `draw_fire`. Canonical constants: N 16, SPREAD = [0.30, 0.16, 0, 0,
0.20] × 0.8, FIRE_EVERY 2, WEATHER_EVERY 30, MAX_STEPS 300, BUCKET 1, DROP_R 2. ("shield" in the prototype log = "guard".)
`python scripts/wildfire_cases.py check` ✅: determinism + invariants pass, and the shipped code reproduces the
prototype EXACTLY (pilot guard 3×3 2.64/58%, 5×5 1.03/77%; commander K=4 guard 1.11/78.5%, densest 3.33/56.5%), 10.9 s.
Random baselines consume a shared rng, so their shipped values are re-measured by `baselines` (not the batched prototype's).
Trained crews (torch) are NOT in the setup — they run on the reader's machine.

**Page 1 `wildfire-brief` written 2026-09-13** — browser: clean console, FireReplay renders and scrubs (step 20
nearest: 26 burning, 21 burnt out, helicopter at the lake refilled); cell 1 (world 1002 stand-by maps) Pyodide output
**identical by exact string equality (1720 chars)**; cell 2 (stand by vs nearest, 200 worlds) **identical (192 chars)**,
≈30 s in Pyodide. ✅ SHIPPED (15 of 40) — (FireReplay of held-out world 1002: stand by 8/9 village, 214 burnt,
88 steps · nearest 0/9, 98 burnt, 54 steps · guard 0/9, 113 burnt, 56 steps; cells: world 1002 stand-by maps, and
stand by vs nearest over 200 worlds, 6.1 s native). ⚠️ Promises made on it that later pages MUST keep: the
coupled-clocks page measures what changing the fire/helicopter clock ratio does (NOT yet run on shipped code) · chapter
5 uses the common-random-numbers replay to explain the first crew's failure · the baselines page quotes guard 77%.

**Page 2 `fire-as-a-cellular-automaton` ✅ SHIPPED 2026-09-13 (16 of 40)** — 4 cells, all Pyodide output identical by
exact string equality (518 / 319 / 141 / 203 chars), console clean, tsc EXIT 0; new `FireRuleLab` (JS rule, seeded dice,
neighbours 4 / 8×0.7 / 8×1, update sync / in place, per-cell chance overlay + hover breakdown) verified stepping one
tick per click and in-place bias (tick 3: north 4, south 29). Prose numbers from `python scripts/wildfire_cases.py ca`:
- cells: world 1002 fire at (4, 5), forest, timer 5 · catch chance grass side 0.240 / corner 0.168 / all 8 **0.840** (sum 1.632) / forest all 8 0.603 / rock 0 · equivalence test 10 worlds (1000–1009) dry calm flat **433 ticks identical**, burns 204.7/256 · in place vs sync, 100 fires, 3 ticks: sync N 3.40 S 3.70 W 3.69 E 3.50; in place **N 5.18 S 23.14** W 9.98 E 17.62.
- test is not vacuous: corners 0.71 → mismatch tick 3 (total burnt only 204.7 → 206.0) · adding chances → tick 4 · in place → tick 1.
- lifetime ignition (grass beside ONE burning cell; exact vs env fire 4000 runs): grass side 0.422/0.416, corner 0.308/0.310 · forest side **0.746/0.749**, corner 0.601/0.609 · village side 0.666/0.668, corner 0.521/0.524.
- fire strength ×1.0 / ×0.8 / ×0.6 (stand by · nearest · guard; village dmg · untouched · burnt): 7.90·9%·202.5 | 3.96·50%·114.3 | 1.87·65%·118.2 · 6.79·20%·169.4 | 2.65·65%·82.9 | 1.03·77%·83.7 · 4.93·37%·119.2 | 1.12·82.5%·43.4 | 0.39·90%·46.4.
- dice decision (guard, first drop → hover, 200 worlds): a die per cell +9.27, paired sd 26.9, ~724 worlds for ±1 · dice only where needed +10.87, sd 47.8, ~2290.
- ⚠️ honest null: corner weight is about SPEED not shape (41×41 field, 8 ticks, 4000 fires; diagonal÷straight reach · cells): 4-only 0.82 · 12.8 · ×0.7 0.94 · 58.0 · ×1/√2 0.94 · 58.6 · ×1 **0.97** · 85.9.
Promise made on it: the next page (wind, moisture, slope) revisits the `r - dr` direction convention. ✅ kept on page 3.

**Page 3 `wind-moisture-and-slope` ✅ SHIPPED 2026-09-13 (17 of 40)** — 4 cells Pyodide output identical by exact string
equality (886 / 596 / 648 / 168 chars), tsc EXIT 0, lab verified live (compass ×2.46/1.89/1.00/0.53/0.41 at speed 0.6;
hover 0.240 × 0.835 × 2.46 × 1.10 = 0.542; step one tick per click; water drop M 0.900 → 0.890 after a tick). Lab insight
claims measured by a JS replica of the lab rule (2000 runs, speed 0.6): same dice wind N vs S → top rows reached 98.9% vs
57.1% (fire still creeps upwind — "barely moves" was WRONG, removed); NE wind + wet line rows 5–9 → fire still crosses
66.0% (vs 98.7%), burnt 97.1 vs 202.9 ("mostly stalls" was WRONG, removed); hill on/off no visible effect (77.6 vs 77.7). New `FireFactorsLab` (grass field + hill, wind
dial/speed, 5×5 water-drop tool, compass of the 8 wind multipliers, per-neighbour factor breakdown on hover). Cells
(native): wind-north factors 4.48 / 2.89 / 1.00 / 0.35 / 0.22, env fire after 4 ticks north **21.77** vs south 1.51 (100
fires) · moisture ×0.950 / 0.835 / 0.100 / 0 and a drop 0.90→0.70→0.50→0.30→0.05 at ticks 0/20/40/60/85 · slope table,
median neighbour rise **0.056** (×1.25), clip binds **3.4%**, steepest 0.300 · full equivalence (nothing off) 10 worlds
**349 ticks identical** (S, timer, M), burns 157.5/256. Broken versions (scratch prototype): r+dr tick 1 (171.2) · angle
from east tick 1 (183.1) · slope sign tick 1 (172.3) · no drying tick 1 (142.7) · source moisture tick 2 (158.2) · **no
slope clip caught only in world 1006, cumulative tick 219, total unchanged 157.5**.
Prose numbers from `python scripts/wildfire_cases.py wind` (village dmg · untouched · burnt; stand by | nearest | guard):
- wind off 7.74·8.5%·190.9 | 1.34·77.5%·64.3 | 0.36·87.5%·68.7 · gain 3 5.93·30.5%·151.4 | 2.81·65%·87.7 | 2.18·68%·95.3 · ⭐ wind off makes STAND-BY worse but the chiefs much better.
- steer-only wind (factor ÷ its diagonal-weighted mean) 5.58·30.5%·138.3 | 1.51·79%·55.0 | 0.53·87.5%·57.4; open field 8 ticks: calm down 3.46 up 3.47 across 3.50 cells 58.0 · shipped 8.00 / 0.68 / 2.72 / 96.5 · steer-only 6.84 / 0.24 / 1.09 / **50.8 (< calm)**.
- ⚠️ honest null: slope off 6.97·18%·179.7 | 2.42·67.5%·76.8 | 0.83·81%·81.2 · gain 8 6.64·20.5%·164.8 | 2.50·65%·80.2 | 1.01·79%·80.7.
- drying 0 6.11·26%·154.1 | 2.12·69.5%·71.7 | 0.87·80.5%·72.3 · drying 0.03 7.12·16.5%·175.8 | 3.02·61%·90.9 | 1.40·73.5%·93.4.
- p > 1 in 522 of 503,956 stand-by ignition attempts (0.10%).
- ⭐ starting wind toward village (cos>0.5 for some fire, n=100) vs away (all cos<0, n=68): stand by 8.53·3% / 3.99·47.1% · nearest 4.49·42% / 0.13·97.1% · guard **1.97·58% / 0.00·100%**; no-wind control 7.85·9% / 7.54·10.3% · 1.40·78% / 1.19·77.9% · 0.43·86% / 0.13·92.6%. Neither chief reads the wind ⇒ room for a crew (promise: chapter 5 checks whether a crew uses the wind layers).

**Page 4 `the-helicopter` ✅ SHIPPED 2026-09-13 (18 of 40)** — 4 cells Pyodide output identical by exact string equality
(377 / 582 / 342 / 497 chars; the budget cell first differed only by trailing spaces on empty bars — fixed with
`.rstrip()` in the cell), lab verified live (guard chief autopilot flew the default fire to "fire out after 69 steps ·
5/9 village · 15 put out", strip 33% lake / 3% fill / 59% water / 4% drops; pads + arrow keys move one step each), tsc
EXIT 0. Prose fact-check fixed: "best rule we have", "the one burning cell outside the square" (three), unverified
lake-start claim, lake-distance attribution (stand-by rises by the same absolute amount). New `HelicopterLab` (fly yourself with arrows/space or
let nearest/guard chief fly; hand-made flat map, fixed SE wind 0.45; dice rolled on fire ticks only ⇒ "same fire again"
is a CRN replay; step strip classifies every step). Cells (native): world 1002 heli at (13, 7), nearest lake 12 steps,
round trip 14 steps = 7 fire ticks for both fires · reader's `helicopter()` drop demo at (7, 8) after 12 fire ticks puts
out 10 · equivalence with fire frozen (`Wildfire(fire_every=10**9)`), half nearest-chief/half random actions, 20 worlds
**1602 actions identical**; branches hover 132 / fly 1253 / wall **3** / fill 79 / drop on fire 40 / on nothing 45 / empty
button 50 · guard budget 200 worlds: to lake 31.0% · fill 4.6% · to fire 58.4% · drop 6.0% (never misses, never hovers),
2.81 drops/ep, 4.77 put out/drop, 16 steps median between drops. Broken versions (scratch): 4×4 square step 8 · no soak
step 8 · put-out=burnt step 43 · no wall step 67 (row −1 silently wraps; IndexError later at row 16) · fill anywhere 68 ·
drop with empty bucket 68. Prose numbers from `python scripts/wildfire_cases.py heli`:
- nearest budget to lake 31.6 · fill 5.9 · to fire 55.2 · drop 7.3%; doused cells/ep 16.8 nearest / 13.3 guard, caught again 5.8% / 6.2%.
- bucket×drop (nearest | guard, dmg·untouched): b1 3×3 4.05·49 | 2.64·58 · **b1 5×5 2.65·65 | 1.03·77** · b1 7×7 1.36·80.5 | 0.45·89.5 · b3 3×3 3.46·55 | 1.47·73.5 · b3 5×5 1.43·78.5 | 0.35·91.5 · b3 7×7 0.54·90 | 0.03·98.5.
- start: empty over village 3.48·54.5 | 1.61·64.5 · full at lake 2.62·65.5 | 0.89·80.5 (small; no strong reason either way — said so).
- ⚠️ honest null: put-out = burnt 2.52·67 | 0.95·79 (vs unburnt 2.65·65 | 1.03·77).
- lake distance (village centre → nearest lake, Manhattan; min 4 median 9 max 18; near ≤7 n76 / middle 8–10 n58 / far ≥11 n66): stand by 6.39·25 / 6.78·19 / 7.24·15.2 · nearest 2.03·71.1 / 2.69·63.8 / 3.33·59.1 · guard 0.66·80.3 / 0.95·77.6 / 1.55·72.7. ⚠️ stand-by rises by about the same absolute amount (0.85 vs guard 0.89) ⇒ part is the map, causes NOT separated (first draft overclaimed; fixed).

**Page 5 `coupled-clocks` ✅ SHIPPED 2026-09-14 (19 of 40)** — 4 cells Pyodide output identical by exact string
equality (534 / 259 / 819 / 633 chars, 45 s for all four), tsc EXIT 0, lab verified live. `Wildfire` gained
`weather_every=WEATHER_EVERY` (default path re-verified: `check` ALL OK). Lab engine moved to
`src/components/fire/heliSim.ts` (HelicopterLab now imports it; `act(..., fireEvery, maxSteps)`); new `ClockRatioLab`
(same fire, four helicopters at 1/2/3/4 steps per fire tick, time called at 150 fire ticks). Lab default fire (guard):
1/9 · 205 burnt · 29 steps | 5/9 · 189 · 69 | 0/9 · 83 · 69 | 0/9 · 71 · 72 — browser identical to headless node check;
500 fires on the lab map, guard untouched 33.2 / 66.6 / 96.6 / 100%, stand-by identical at all speeds 500/500.
Cells: world 1002 hover schedule detected by effects (M change = fire tick; wind 343° N 0.44 → 330° NW 0.59 at step 30);
300 actions / 150 ticks / 10 shifts, all 10 shifts on fire ticks · `my_step` (helicopter → t+=1 → fire → wind → score/end)
vs env.step, 20 worlds, every other world max_steps 40, **1090 steps identical**, 544 fire ticks, 26 wind shifts (all
coinciding), ended fire out 12 / time called 8 (without the short limit: 20 / 0, truncated never checked) · world 1002
with every clock scaled (fire_every=k, weather_every=15k, max_steps=150k): stand by 44 ticks · 214 · 8/9 at every k
(ever + wind history identical); guard burnt 142/113/104/64, drops 2/3/6/7 · guard 200 worlds k1–4: 3.25·48% /
1.03·77% / 0.26·91% / 0.09·97.5%, stand by 6.79·20%·169.4. Broken versions: clock advanced after checks step 1 · fire
before helicopter step 8 · wind before fire step 30 · wind own generator step 30 · ending checked before fire step 82
(burn-out on a fire tick) · time called late (`>`) only world 1003 step 40 (a short-limit world).
Prose numbers from `python scripts/wildfire_cases.py clocks` (village dmg · untouched):
- ratio, clocks scaled (random = own dice per world | nearest | guard; stand by 6.79·20%·169.4 at every k, identical per world): k1 3.50·40.5 | 4.07·49 | 3.25·48 · **k2 3.37·41 | 2.65·65 | 1.03·77** · k3 3.43·41 | 1.26·81 | 0.26·91 · k4 3.38·42.5 | 0.62·91.5 | 0.09·97.5 · k6 3.46·41.5 | 0.15·97.5 | 0.01·99.5. ⭐ nearest−guard gap 0.82 / **1.62** / 1.00 / 0.53 / 0.14 — peaks at the shipped ratio (brief's promise KEPT). At k1 nearest is worse than random on village dmg.
- random-pilot episode steps 39.6 / 79.3 / 118.7 / 157.2 (stand by 38.9 / 77.7 / 116.6 / 155.4). No crews trained at other ratios.
- first bucket worth (guard, CRN, scaled): k1 +13.15 (66/12/22%) sd 93.4 S/N 0.141 · k2 +9.27 sd 74.1 0.125 · k3 +6.05 sd 51.2 0.118 · k4 +3.00 (38/53/8%) sd 36.9 0.081.
- naive (only fire_every): k1 stand 6.79·19.5, guard 3.09·47.5 · k3 stand 6.95·17, guard 0.21·92.5 · k4 stand 7.03·18 (time called 3%), guard 0.06·98.5 — shortcut ≈ same story here; stand-by is the tell-tale.
- order (stand by | nearest | guard): heli→fire→wind 6.79·20 | 2.65·65 | 1.03·77 · fire→wind→heli 6.79·20 | 2.81·64.5 | 1.14·76.5 · heli→wind→fire 6.64·20.5 | 2.68·64.5 | 0.96·77. Small; order chosen from principle (action lands on the observed map).
- ⚠️ honest null, weather clock: never 6.70·19.5 | 2.57·64.5 | 1.09·75.5 · every 30 6.79·20 | 2.65·65 | 1.03·77 · every 10 6.75·20 | 2.49·63.5 | 0.91·77. Wind shifts seen per episode: stand by 2.12 (none 4%), nearest 1.08 (27%), guard 1.05 (23.5%). σ 30° / 0.15 NOT tuned or measured.
Promises made on it: chapter 5 checks whether a crew reads the wind layers (repeated) · a commander decision clock arrives in chapter 5 · next page vectorises the fire and proves it the same world.

**Page 6 `a-grid-you-can-vectorise` ✅ SHIPPED 2026-09-14 (20 of 40)** — 4 cells verified in Pyodide: every
deterministic line identical by exact string equality, timing digits masked (162 / 441 / 182 / 268 chars; ~50–100 s for
all four), console clean, tsc EXIT 0. New `ShiftLab` (flat lab map; 8 passes of shift(burning) accumulate the catch
chance; compares with the loop after pass 8 — "identical at every cell" verified live; hover shows which directions
arrived). Cells: loop vs env.fire_tick on worlds 1000–1002 (90 ticks identical) · `my_shift` 4×4 demo + 4096 checks
(one grid + batch of 5) · `my_fire_tick_vec` (dice as argument, wind `[..., None, None]`) 10 worlds 349 ticks identical ·
batch of 64 via stacked arrays + one generator copy per world: 2478 world-ticks identical + world-ticks/s by B.
⚠️ TIMINGS ARE NOISY — quote ranges only; never run timing scripts in parallel (first native runs were contended).
Browser (3 runs): loop/env **5.5–6.5×** (loop 5.50–6.74 ms, env 0.84–1.15 ms); batch B1/16/64/256 world-ticks/s
1162–1200 / 5128–8349 / 11899–12579 / 10447–13144 (256 beat 64 twice of three). Native idle (m3, 3 reps): loop/env
**2.6–3.0×**; B64 vs B1 7.4–10×, vs loop 20–24×; B256 ≈ B64, B1024 ≈ half; per-world dice vs shared at B64 −2% to
−22% over five runs; batched whole step (vectorised fire + observation, per-world helicopter/wind; 16 worlds × 120 random
steps: 0 observation mismatches) solo 4,177–4,505 · B16 25,252–25,645 · B64 35,825–37,897 · B256 29,064–31,866 ⇒
**8.0–8.7×**. Profile (200 worlds, stable shares): fire_tick 80–81%, observe 13%, rest 6–7%; ~4,200–4,600 steps/s.
Shared generator: all 16 of worlds 1000–1015 burn a different number of cells in 40 ticks at batch 16 vs 64 (world 1000:
165 vs 180) ⇒ per-world dice kept (determinism promise). ⚠️ Honest null: sum of log(1−p) vs product — 0 cells caught
differently in 349 ticks, max diff 2.2e-16; product kept as "the rule as written". numba/JAX NOT measured (said so).
Batched step is NOT in WILDFIRE_SETUP (scratch + `wildfire_cases.py vec` only). Promise made: next page (invariants and
property tests) checks what must hold in every world at every step, on more worlds than a comparison affords.

**Page 7 `invariants-and-property-tests` ✅ SHIPPED 2026-09-14 (21 of 40) — CHAPTER 4 (World 2 build) COMPLETE** — 4
cells Pyodide output identical by exact string equality (203 / 266 / 759 / 463 chars, 74 s for all four), tsc EXIT 0,
lab verified live (browser = headless node on bugHunt.ts). New `src/components/fire/bugHunt.ts` + `BugHuntLab` (plant 1
of 7 bugs in the lab world, 200 episodes half guard/half random with random limits, 10 rule lights + first-failure map).
Lab (200 eps, 9,434 steps no bug): every bug caught except wind-wrong-way; no wall only 3× (ep 1 step 3); time called on
finished fire 4× (first ep 52 step 46); lake dries 9,234×. Cells: 15 invariants (conservation / bounds / bookkeeping /
consistency), harness 100 worlds mixed + random max_steps 10–119: 5,215 steps, drops 231, fills 177, fire out 49, time
called 51; **14 of 15 held; naive reward = −(growth of record) BROKEN 52 steps, first world 0 step 50** · whose bug:
cell (12, 11) put out at step 8, caught again at 50; reward −28 = −8 −2×10 vs expected −27 ⇒ invariant wrong, env
charges re-ignitions (decision record, NOT measured on a crew) · `Buggy` subclass, corrected reward rule (re-does the
drop square — "invariant copies a sliver of the rule"): real step never caught; no wall world 14 step 44 IndexError;
un-burns burnt world 0 step 52; bucket never empties world 0 step 8; lake dries world 0 step 2; village costs nothing
world 0 step 48 (reward); time called on finished fire world 66 step 78 (never both); **wind wrong way & ground dries
5× too fast NEVER caught** (possible-but-wrong worlds) · metamorphic drop-vs-hover (deepcopy, both hover after), 100
worlds 277 drops: cell only in drop copy 2/12/32/67 at k=1/2/4/8, more burning 0/0/2/11, more in record 0/0/0/0; first
case world 1055 drop step 16 cell (2, 12) 1 tick left, burned out in hover copy, relit in drop copy.
Prose numbers from `python scripts/wildfire_cases.py invariants`: shipped env corrected invariants random 40,390 /
mixed 32,626 steps (no limits, time called 0 — never reached 300) and with limits 25,861 (321 called) / 25,065 (256):
none broken · naive reward 324 alarms in 32,626 steps, all explained by re-caught doused cells · checks cost 0.42× a
step · planted in shipped source (mixed, 300 eps): same catches; time-called bug survives 19,810 steps without limits,
caught ep 5 step 64 with; survivors wind wrong way, fire spreads from burnt cells (34,255 steps), ground dries 5×
(21,831) · drop vs hover 200 worlds: 563 drops, only-in-drop 5/24/63/146, more burning 0/1/3/24, more in record 0/0/0/0,
k=1 all 5 = doused cell relit while hover twin burned out · shrink (bug un-burns burnt, random actions): world 8, 53
actions (47 not hover) → 52 hovers + button at step 53. ⚠️ "a drop never makes things worse" is FALSE in this world
even on the same dice — never write it in chapter 5. Hypothesis NOT compared (said so).
Promise made: chapter 5 starts with baselines (the rules a crew must beat).

## World 2 · chapter 5 (test & train) — shipped pages

**Page 1 `baselines` — "Baselines a fire chief would try" (22 of 40).** Built in the previous session; its numbers are
all reproduced by `python scripts/wildfire_cases.py chiefs`, re-run and matched line for line 2026-09-14 (ladder: stand
by 6.79·20.0%·169.4·0.0·77.7·−235.2 | random rng 0 3.55·39.0%·152.9·0.2·78.1·−186.4 | nearest 2.65·65.0%·82.9·17.2·47.0·−108.5
| guard 1.03·77.0%·83.7·13.4·46.9·−93.2 · one drop then hover 2.81·44.0% · random with an empty start bucket 6.79 ·
village moisture 0.157→0.900 · soak the village 0.45·79.0%·142.7 · drop-then-guard 0.42·84.0%·102.6 · wind guard an
honest null +0.00 village, −1.84 return · guard−nearest −1.61, se 0.317 separate / 0.216 paired). Decisions on it: a crew
is ranked by **return** on the 200 held-out worlds, printed beside village / untouched / burnt; ~2 paired standard errors
(≈0.4 village cells, ≈8 points) is the smallest gap the chapter calls real. New `ChiefRaceLab`. Browser verification of
its four cells was not re-done this session. ⚠️ Its promise: the next page trains a crew on the pilot's controls.

**Page 2 `the-crew-that-learned-nothing` ✅ SHIPPED 2026-09-14 (23 of 40)** — 4 cells Pyodide output identical by exact
string equality, `RandomPilotLab` verified live against a headless node run of its engine, fresh page load has zero
failed resources, tsc EXIT 0. Route `/learn/building-environments/the-crew-that-learned-nothing`; baselines now links
next. New `src/components/fire/randomPilot.ts` + `RandomPilotLab.tsx`; new `python scripts/wildfire_cases.py crew`
reproduces every number on the page.

⭐ **THE RESULT: the flat pilot's local optimum IS a one-line rule, to every printed digit.** `fly` over the 200 held-out
worlds of `lambda env: 5 if env.t == 0 else 0` gives village **2.815** · untouched **44.0%** · burnt **152.155** · return
**−178.305** · put out **0.000** · drops **1.00** · steps **77.39** — which is the PPO 5×5 held-out test row character for
character. In the 3×3 world the same rule scores 4.145·28.5%·163.040·−202.490 and the three runs there came back 4.165 /
4.470 / 4.530 (the excess is the 0.5% of episodes where the crew fails to press). Four runs, two worlds, two reward
scales, two observation views, one line of Python.

⭐ **And it is not even the BEST version of its own trick** (one drop at step k, then hover; 200 worlds; village ·
untouched · return): 5×5 step 0 **2.815·44.0%·−178.31** · step 10 **2.215·53.0%·−170.16** · step 20 2.325·54.0%·−172.60 ·
step 30 3.505·41.5%·−188.33 · step 40 4.630·34.0%·−202.52 · step 60 5.900·24.5%·−220.63; 3×3 step 0 4.145 · 2 4.010 ·
5 3.905 · 10 3.635 · 20 3.565. The ground dries 0.01/fire tick, so water laid at step 0 has partly worn off when a distant
fire arrives. The crew found the moment one step from the start state, not the best moment — the exploration problem in
miniature. (Also rules out "the 3×3 runs are worse than the rule because they press late": pressing late is BETTER.)

Flat-pilot runs quoted on the page (held-out tests, from the prototype logs): PPO 3×3 raw s0 2M 6.565·20.5%·168.67·−232.87·
0.48 drops·0.355 put out | PPO 3×3 raw s1 2M 4.470·28.5%·163.68·−206.47·0.995·0.070 | PPO 3×3 ×0.1 1M 4.165·28.5%·163.075·
−202.725·0.995·0.055 | PPO 3×3 ×0.1 ego 1M 4.530·27.5%·162.785·−206.11·0.995·0.025 | **PPO 5×5 ×0.1 1M 2.815·44.0%·152.155·
−178.305·1.000·0.000**. Stopped without a held-out test (page says so): DQN 3×3 raw s0/s1 at 1.16M/1.18M (curves 6.3–6.6
village, 0.3–0.5 put out), DQN 5×5 ×0.1 at 0.81M (3.43–3.83, 0.2–0.3), PPO 5×5 ×0.1 ego at 0.61M (3.18–3.38, 0.1–0.2).
Random buttons score 3.55 with 0.2 put out — the honest claim is only "nothing separated them from random play".

Diagnosis numbers (all from `wildfire_cases.py crew`, all four also runnable on the page):
- **The funnel** (uniform random pilot, 200 worlds; refills · scores with the starting bucket · completes the chain · put out/ep · drops/ep · steps): presses buttons **13 · 10 · 1** · 0.21 · 1.07 · 78.1 | never empties its bucket **— · 132 · 0** · 2.67 · 11.80 · 71.8 | starts on the lake **81 · 60 · 21** · 1.53 · 1.46 · 76.4. ⇒ finding fire is easy; the REFILL is the missing link. ⚠️ the lake-start row's 60 is not comparable with the plain pilot's 10 (different start ⇒ different first drop) — page says so.
- **Why**: shortest flight village→lake median 9 steps, worst 18; a random walk first stands on water after median **411** steps (mean 565, best 19, worst 3385, never in 5000: 0); an average episode is 77.7 steps ⇒ it arrives in time in **19 of 200** worlds.
- **The whisper** (CRN, guard's first drop replaced by a hover): **+9.27** return (median +2.0; helps 60 / no change 22 / hurts 18%), returns sd **74.1** ⇒ S/N **0.125**; whole guard policy vs stand by **+142.06** ⇒ S/N **1.9**. Unpaired, seeing one bucket at two standard errors takes about **512** episodes a side; paired the difference has sd 26.97 (se 1.91) ⇒ 4.9 se from 200 worlds and **34** worlds would have done — a 30× gap, and the Proof says 0.125 is an UPPER bound because a learned value baseline is coarser than holding the dice still.
- **Training-curve length bias** (stand by, 200 worlds): episode length correlates +0.33 with village damage; shorter half (≤72 steps) 5.92 vs longer half 7.68; true mean 6.79 but weighted by 1/length (≈ what a window of finished episodes sees) **5.89** ⇒ ≈1 village cell of free optimism in every curve.

Lab (`RandomPilotLab`, lab map, seed 1, 200 episodes — browser identical to headless node): plain **0/200 ever stand on
the water** (the lab lake is 18 steps away, not the median 9), 28/200 score with the starting bucket, 0/200 chain, 0.38
put out/ep, 1.00 drops, 61.2 steps · free water 146/200 score, 2.82 put out, 9.73 drops, 58.3 steps · starts on the lake
77 refill, 132 early scores, **21 chain**, 2.56 put out, 1.35 drops, 64.4 steps. Chiefs on the lab map for scale: guard
12.23 put out/ep, nearest 20.48.

**Decision record on the page — change the ACTION, not the learner.** Four ways out: shape the reward (untested; puts our
idea of progress into the reward) · demonstrations from the guard chief (untested; teaches the crew our answer) ·
curriculum (MEASURED: starting on the lake takes the chain from 1 in 200 to 21; a real fix, but it changes the training
distribution, not the world) · **the commander interface (chosen)**: it is the only fix that lives in the environment, the
evidence points at the environment (reward scale and observation each changed with no effect; free water fixes the
funnel), and it matches the job. Stated cost: we can never see a crew invent a better flight pattern, and the decision
clock K is a new knob that can be set badly (next page measures it). The page never claims the flat pilot is unlearnable.

Promises made on it that later pages MUST keep: the next page (pilot or commander) builds the interface AND measures the
decision clock K · the chapter keeps reporting drops/ep and put-out/ep beside every score (mechanism, not just the
number) · the bar remains guard's −93.2.

⚠️ `scripts/wildfire_train.py` does not exist yet — the `wildfire_cases.py` docstring names it and the "Training the crew:
DQN vs PPO" page (ch5 p5) must ship it. This page deliberately quotes the trained rows as data from the prototype runs
and does not link to a script.

**Page 3 `pilot-or-commander` — "Pilot or commander: choosing the action" ✅ SHIPPED 2026-09-14 (24 of 40)** — 4 cells
Pyodide output identical by exact string equality (1068 / and cells 2-4 concatenated 1461 chars, ~3 min for all four),
`CommanderLab` verified live against a headless node run of its engine (every quoted lab number matched), fresh page load
has zero failed resources, tsc EXIT 0, no horizontal overflow at 375 px beyond the site-wide code-block scroll.
New `src/components/fire/commander.ts` + `CommanderLab.tsx`; new `python scripts/wildfire_cases.py commander` reproduces
every number. `the-crew-that-learned-nothing` now links next.

⭐ **THE RESULT: at K=1 the commander interface IS the pilot chiefs, to every printed digit** — nearest 2.65·65.0%·82.9·
−108.5·3.42 drops·17.2 put out and guard 1.03·77.0%·83.7·−93.2·2.81·13.4 are identical whether flown as buttons or as
target cells. So are two more baselines-page rules written as commander policies: **soak the village 0.45·79.0%·142.7·
−145.8·4.54·1.4** (identical at K=1 and K=4 — its target never moves) and **drop-then-guard 0.42·84.0%·102.6·−105.8·3.48·
10.9** at K=1 (K=4: 0.47·83.0%·102.5·−105.9). Both aim at a cell that is NOT on fire ⇒ a "pick a burning cell" action
space would delete the best village-saving rules in the chapter. That is the argument for keeping all 256 targets.

⭐ **The decision clock K is an EXPLORATION knob, not a performance knob — it helps a bad crew and hurts a good one.**
Per episode (decisions · steps/decision · drops · put out · put out/drop · return), 200 held-out worlds:
- guard: K1 46.9·1.00·2.81·13.42·4.77·−93.2 | K2 24.1·1.94·2.81·13.61·4.84·−94.0 | **K4 12.3·3.68·2.71·13.71·5.06·−92.3**
  | K8 7.3·6.49·2.82·14.47·5.13·−107.2 | no clock 4.1·13.90·3.38·10.92·3.23·−152.8
- nearest: −108.5 / −110.7 / −111.6 / −121.1 / −168.9 · densest: −119.2 / −120.6 / −129.9 / −138.7 / −163.1 (slips one
  clock earlier than guard) · random_fire −195.2 / −180.5 / **−164.9** / −168.9 / −186.7 (best at K=4) · random −229.9 /
  −222.6 / −207.4 / −195.5 / **−186.4** (monotonically BETTER with a longer clock).
- paired vs K=1, world by world: guard K2 −0.85 (1.7 se) · **K4 +0.87 (0.4 se)** · K8 −14.02 (4.4 se) · no clock −59.62
  (11.0 se); nearest K2 −2.20 (1.9) · K4 −3.08 (1.1) · K8 −12.56 (3.6) · no clock −60.33 (10.3). The chapter's 2-paired-se
  rule ⇒ K = 1, 2, 4 are one thing; K=8 is a real loss; no clock is a rout (worse than soak-the-village's −145.8).
- ⭐ **mechanism — is the named cell still alight when the water lands?** guard 100.0 / 96.6 / 84.7 / 59.0 / **10.4%** at
  K = 1/2/4/8/none (nearest 100 / 94.1 / 80.6 / 60.7 / 8.8). Verified by a probe that re-implements `Command.step` line
  for line and is asserted to reproduce `command()` exactly in all 10 rows. NOTE: K=8's drops are the BEST of the four
  (5.13 cells a drop); what a long clock costs at K=8 is RESPONSE TIME (village 1.03 → 1.74), not aim. Only at no clock
  does aim collapse (5.06 → 3.23 per drop, episodes 45.2 → 56.9 steps).

⭐ **Exploration — the chain (refills · scores with the starting bucket · completes the chain · put out/ep · drops/ep ·
decisions/ep), 200 worlds:** flat random pilot 13 · 10 · **1** · 0.21 · 1.07 · 78.1 | random commander K=1 45 · 20 ·
**1** · 0.48 · 0.28 · 78.0 | K=2 87 · 31 · 6 · 0.80 · 0.59 · 38.5 | **K=4 153 · 64 · 41** · 2.60 · 1.52 · 19.8 | K=8 182 ·
62 · 75 · 3.12 · 2.38 · 10.1 | no clock 191 · 66 · **122** · 5.01 · 3.60 · 4.7. ⇒ **the autopilot alone fixes nothing
(K=1 is still 1 in 200); PERSISTENCE is what fixed exploration.** ⚠️ Honest wrinkle kept on the page: the random
commander at K=4 scores WORSE on village cells than the random pilot (5.58 vs 3.55) because the random pilot starts over
the village with a full bucket — the score got worse while the experience got 12× better.

Action-space width (2,457 real guard-commander decision moments): **11.2 of 256 cells burning (4.4%)**; a uniformly drawn
target whose 5×5 drop covers at least one burning cell **26.2%**. Flat pilot's chain length: guard **16.7 button presses
per bucket delivered** (46.9 steps / 2.81 drops), nearest 13.7. Proof on the page contrasts ~1 in 4 per decision with
~1 in 200 per episode and says 6^-17 is NOT the honest comparison.

Lab (`CommanderLab`, lab map, seed 1, 200 episodes — browser identical to headless node): random targets chain 2 (K=1) /
22 (K=4) / **117** (no clock), put out 0.72 / 2.50 / 4.90 · guard 12.23 put out at K=1 (chain 193) and 11.96 with no
clock (chain 135) · guard K=4 199 refills · 200 early scores · 197 chains · 14.56 put out · 2.75 drops · 16.7 decisions ·
62.7 steps. Reader can click the map to dispatch; clicks are REFUSED mid-decision on purpose (the clock is the point).

**Decision record on the page:** target cell over all 256 · automatic refill · decision ends on the drop · **K = 4**.
Rejected: burning-cells-only actions (deletes soak-the-village and the pre-wetting trick) and one-decision-per-sortie
(measured worst). Stated costs: no crew can invent a flight pattern now, and K=4 was tuned on hand-written rules and a
random crew, neither of which is a half-trained crew — first number to move if training wants a different clock.

Promises made on it that later pages MUST keep: the next page ("Reward is a values decision") takes apart the −1 per
ignited cell / −10 per village cell weighting · the bar is guard's −93.2 (−92.3 as a K=4 commander) · drops/ep and
put-out/ep keep appearing beside every score.

**Page 4 `reward-is-a-values-decision` ✅ SHIPPED 2026-09-14 (25 of 40)** — 4 cells Pyodide-verified individually by
exact string equality (601 / 2041 / 435 / 809 chars; cell 1 ~2 min, the rest faster), `ValuesDialLab` verified live and
band-for-band identical to a headless node run, zero failed resources, tsc EXIT 0, no overflow at 375 px. New
`src/components/fire/values.ts` + `ValuesDialLab.tsx`; new `python scripts/wildfire_cases.py values`.
`pilot-or-commander` now links next.

**Method the page is built on: FLY ONCE, PRICE MANY TIMES.** Each rule is flown once and recorded as four totals the
reward has not yet priced — cells that caught, village cells among them, and the same two counted again on every fire
tick they spend alight ("rent"). Every reward on the page is then arithmetic on those totals, so the flying is held
still while the opinion changes. Rule book (200 held-out worlds; caught · village · rent · v-rent · put out · drops ·
steps): stand by 167.36·6.79·599.92·27.14·0·0·77.7 | one drop then hover 150.16·2.81·538.99·11.26·0·1.00·77.4 | nearest
81.84·2.67·259.21·9.96·17.20·3.42·47.0 | guard 82.56·1.06·269.70·2.77·13.42·2.81·46.9 | soak the village
140.88·0.49·503.68·1.38·1.44·4.54·73.0 | drop-then-guard 101.27·0.46·339.73·1.37·10.87·3.48·51.0 (random buttons
150.94·3.55·541.42·14.18 in the script only).

⭐ **The exchange rate is 1 + w = 11, not 10** — `lit` already counts village cells, then `village_lit` charges them
again. The page uses "rate" (what a village cell is worth in ordinary cells) throughout.

⭐ **THREE BANDS, TWO BOUNDARIES.** rate < 1.45 → nearest · 1.45 ≤ rate < 32.18 → guard · rate ≥ 32.18 →
drop-then-guard, and drop-then-guard stays the answer at every higher rate (it dominates soak-the-village on BOTH
columns, so soak NEVER leads). The shipped 11 sits inside the middle band — wrong by a factor of 7 downward or ~3
upward and the answer is the same. ⚠️ Precision: the page's cell works from the 2-decimal table, giving 1.45 / 9.79 /
32.18 / 103.32; from full episode totals they are 1.44 / 9.77 / **31.93** / 103.33 (the upper one divides by the gap
between village columns rounding to 1.06 and 0.46). The page says so in a muted note; the script prints both.
⭐ **16 of 21 pairs are settled with NO weight at all** (dominance); only 5 are real trades. At the shipped rate,
drop-then-guard (−105.9) and nearest (−108.5) differ by 2.6 — inside the chapter's ~8-point threshold, so the weight is
what breaks that tie.

⭐ **The reward pays NOTHING for extinguishing**, and the natural progress metric is anti-correlated with the score:
holding the guard chief fixed across the 200 worlds, **corr(cells put out, return) = −0.70** (nearest −0.76,
drop-then-guard −0.42); corr(put out, cells burnt) = +0.73. The 20 worlds where it doused most (27.9 cells) returned
−178.6; the 20 where it doused least (2.8) returned −14.7. (Selection uses `np.argsort(kind="stable")` — the first draft
used the default sort and Pyodide broke ties differently from native, printing −177.3 vs −177.6. **Any top-k selection in
a shipped cell must use a stable sort.**) Its whole +142.1 over standing by is fires that never started.

⚠️ **HONEST NULL — shape does not reorder anything.** Charging rent (every burning cell, every fire tick) instead of
charging once at ignition gives the IDENTICAL ranking of all seven rules at rate 11. Crossovers do move: guard over
nearest 1.44 → **2.46**, drop-then-guard over guard 31.93 → **51.01**. Limit stated on the page: none of these six rules
trades "many short fires" against "a few long ones", which is the axis rent is sensitive to.

⭐ **THE REWARD IS ALSO A LEARNABILITY DECISION — and the two goals pull opposite ways.** One bucket (guard, CRN, first
drop hushed) vs the whole policy, by rate: charged at ignition, rate 1 → +8.37 / sd 57.0 / **S/N 0.147** / whole policy
1.49 · rate 11 → +9.27 / 74.1 / **0.125** / 1.92 · rate 31 → +11.06 / 115.4 / 0.096 / 2.22 · rate 101 → +17.36 / 275.0 /
**0.063** / **2.39**. As rent: 0.143 / 0.138 / 0.125 / 0.101 with whole policy 1.63 / 2.32 / 2.95 / 3.42 (rent is the
gentler shape once the village is weighted, but identical at rate 1). Proof on the page: one bucket is worth 8.275
ordinary + **0.090 village** cells (≈1% village) while the whole guard policy is worth 79.08 ordinary + **5.73 village**
(≈7%, six times more); guard's spread is 55.55 on 81.50 ordinary (0.68 of the mean) and 2.36 on 1.06 village (2.2× the
mean — 77% of worlds lose no village cell, one loses ten). Limits as rate → ∞: one bucket 0.090/2.36 = **0.038**, whole
policy 5.73/2.36 = **2.43**.

**Decision record on the page: keep the rate at 11, and say out loud that it is a DESIGN choice, not an ethical one.**
Below 1.45 the village is scenery and the task becomes "minimise burnt area". Above 32 the best rule is one drop in the
first second and then guarding — so weighting the village as heavily as the words ("a house vs trees") would justify
makes the answer be *mostly don't fight the fire*, and this world exists to watch a crew learn to fight one. Stated cost:
every "best policy" claim in this chapter is a claim *at a rate of 11*, and a crew trained here would be correctly
optimising the wrong opinion for a real fire service.

Lab (`ValuesDialLab`, lab map, 200 episodes each, browser = headless node): bands **nearest [1–4.3] · guard [4.3–27.6] ·
drop-then-guard [27.6–200]**, and under rent [1–5.3] · [5.3–27.6] · [27.6–200]. At rate 11: guard −165.3, nearest −178.4,
drop-then-guard −180.4, soak −184.6, one-drop −192.2, stand by −289.0. Band edges are bisected (not scanned) so the
displayed boundary is the real crossover; the dial snaps to a fixed list of round rates including 11 exactly, so what the
reader reads is what is priced.

Promises made on it that later pages MUST keep: paying per cell extinguished is named as "a third shape" and explicitly
deferred to the cobra-effect page (ch5 p6) · the next page hands the priced rule book and the commander interface to a
learner (DQN vs PPO) · the bar is still guard's −93.2.

**Shipped-code numbers (the ONLY ones pages may quote), 200 held-out worlds, village dmg /9 · untouched · burnt · put out:**
- Pilot 3×3: hover 6.79 · 20% · 169.4 · 0 | random (rng 12345) 5.05 · 24% · 162.5 | nearest 4.05 · 49% · 113.2 · 13.1 | guard 2.64 · 58% · 113.6 · 9.5
- Pilot 5×5 (canonical): hover 6.79 · 20% · 169.4 | random 3.06 · 42.5% · 152.8 | nearest 2.65 · 65% · 82.9 · 17.2 | guard 1.03 · 77% · 83.7 · 13.4
- Commander 5×5 K=4: random 5.58 · 28.5% · 153.2 · 2.6 | random_fire 4.40 · 44% · 121.7 · 13.3 | nearest 2.69 · 65.5% · 85.6 · 16.7 | guard 1.11 · 78.5% · 81.7 · 13.7 | densest 3.33 · 56.5% · 96.3 · 22.0
- Whisper (guard's first drop replaced by hover): 3×3 +3.97 (median 0; helps 45 / no change 27 / hurts 28%) vs sd 103.1 → 0.039 · 5×5 +9.27 (median +2; 60 / 22 / 18%) vs sd 74.1 → 0.125
- Explore (uniform random pilot, rng 0): 3×3 refilled 13/200, put out with starting bucket 6/200, **after a refill 0/200** · 5×5 refilled 13/200, starting bucket 10/200, **after a refill 1/200**. ⚠️ CORRECTION: the prototype printed "0%" for both because 1/200 rounds to 0% — the page must say "1 in 200", never "never", for the 5×5 world.
- Decision clock (nearest / guard, village dmg · untouched): K1 2.65·65% / 1.03·77% · K2 2.77·64.5% / 1.08·77.5% · K4 2.69·65.5% / 1.11·78.5% · K8 2.95·64.5% / 1.74·71.5% · whole sortie 4.59·46% / 3.86·53%.

**Page 5 (built OUT OF ORDER) `the-cobra-effect` -- "The cobra effect: pay per fire put out" ⭐ SHIPPED 2026-09-15 (26 of
40)** -- 4 cells Pyodide-verified individually by exact string equality (977 / 935 / 538 / 612 chars; 126 s / 5 s / 89 s
/ 84 s), `CobraLab` verified live and identical to a headless node run of its engine at two different moments, console
clean, zero failed resources, tsc EXIT 0, no overflow at 375 px (both tables in `overflow-x:auto`, the lab's two maps
stack). New `src/components/fire/cobra.ts` + `CobraLab.tsx`; new `python scripts/wildfire_cases.py cobra` (9 sections).
`reward-is-a-values-decision` now links next.

WIRING NOTE: "Training the crew: DQN vs PPO" (ch5 p5) is still UNBUILT and sits BEFORE this page in the sidebar. When it
ships, rewire: values -> training -> cobra (this page's `prev` and page 4's `next` both point at each other today).

⭐ **THE RESULT: the two rewards rank the rule book differently at the top, and the bounty's favourite is a rule NO
exchange rate can ever pick.** Rule book flown once (200 held-out worlds; caught . village . put out . paid for harm):
stand by 167.36.6.79.0.00.-235.2 | one drop then hover 150.16.2.81.0.00.-178.3 | nearest 81.84.2.67.17.20.-108.5 |
guard 82.56.1.06.13.42.-93.2 | **densest 89.67.2.95.22.09.-119.2** | soak the village 140.88.0.49.1.44.-145.8 |
drop-then-guard 101.27.0.46.10.87.-105.8. Paid for harm the book says guard > drop-then-guard > nearest > densest > soak
> one-drop > stand by; paid per cell put out it says densest > nearest > guard > drop-then-guard > soak > stand by >
one-drop. `densest` (new on this page; the shipped `dispatcher("densest")` flown as a pilot) is **strictly dominated by
both nearest and guard** -- more ordinary cells catch AND more village cells -- so no rate from 0 to infinity reaches it.
Also: the bounty scores stand-by and one-drop-then-hover **identically at 0.00** though they differ by 17.2 cells and
3.98 village cells.

⭐ **A bounty of b = 3.0000 a cell, bolted on top of the shipped reward, flips the book** (guard -> densest). Exact:
26.01 points of damage traded for 8.67 more cells put out (5202/1734 = 3 exactly -- a coincidence of two integer counts,
said so on the page as "three points a cell"). nearest overtakes guard at 4.0661, densest overtakes nearest at 2.1740.
The page's cell scans at 0.01 and therefore prints 3.01, then prints the exact crossover. **The 2-decimal table the cell
works from is EXACT here** (every mean is an even integer over 200), so unlike the values page there is no precision
caveat.

⚠️ **THE PREDICTED MECHANISM IS WRONG -- "let the fire grow" LOSES money.** Hover k steps then guard (200 worlds; put
out . village . burnt . drops . harm): k=0 13.42.1.03.83.7.2.81.-93.2 | 8 12.43.1.06.102.1.2.58.-112.1 | 16
11.63.1.50.116.0.2.39.-131.0 | 24 10.78.2.27.128.6.2.19.-151.4 | 40 7.07.4.59.146.5.1.54.-191.1 | 60
3.06.5.87.158.0.0.79.-214.8. Put-out falls MONOTONICALLY. Cause: a fire nobody fights is over in ~77.7 steps, so
waiting spends the clock rather than banking fire. Page states the limit (one form of waiting, one rule).

⭐ **The real mechanism is AIM, not timing.** Every drop, 200 worlds (drops/ep . first at . burning then . cells hit .
distance from village): nearest 3.42.9.0.14.4.5.02.9.9 | guard 2.81.10.2.13.5.4.77.7.9 | **densest
2.56.12.3.14.9.8.63.9.3**. And holding a crew completely FIXED, corr(put out, cells burnt) +0.79 / +0.73 / +0.78 and
corr(put out, return) -0.76 / -0.70 / -0.78 for nearest / guard / densest -- the bounty measures how bad the fire was.
Guard's 20 best-paid worlds: 27.85 cells put out, return -178.6; its 20 worst-paid: 2.80, -14.7 (reused from ch5 p4).

⭐ **Which reward is legible** (guard chief, 9,375 steps over 200 worlds): 6.0% of steps are a drop; the bounty is
non-zero on exactly those 6.0% and nowhere else, corr(step reward, the crew acted) = **+0.866**; the damage reward is
non-zero on **41.4%** of steps, of which only **6.4%** are drops, corr **+0.018**; mean damage charged on a drop step
1.72 vs 2.00 elsewhere. This is the honest case FOR the bounty and the page leads with it.

⚠️ **HONEST NULL that kills the obvious defence of the bounty: it is NOT the louder reward.** One bucket (guard, CRN,
first drop hushed): damage reward +9.27 / sd 74.13 / **S/N 0.125**; bounty +0.36 / sd 7.34 / **S/N 0.049**. Whole policy
vs standing by: 1.92 vs 1.83 (a tie). So the bounty's advantage is per-step ATTRIBUTION, not signal strength -- said
exactly that way in the Proof.

**Proof on the page ("Why a bounty on a good deed is a tax on prevention"), exact arithmetic, no simulation:** under
R = -lit - 10*village_lit + b*put_out, a cell prevented contributes 0 and a cell lit-then-doused contributes -1 + b,
so **at any b > 1 the environment prefers a fire started and put out to a fire that never started** (b > 11 for a
village cell). The measured flip at b = 3.00 is well inside that region. Two qualifications kept on the page: a drop
also wets its 5x5 to 0.9 (prevented ignitions paid nowhere under EITHER reward), and a doused cell dries at 0.01/tick
and can be charged again.

**Trained crews (PROTOTYPE LOGS, flagged on the page as not runnable -- `wildfire_train.py` still does not exist).**
DQN, commander K=4, 1M sim steps, 3 seeds, same 200 worlds (put out . village . all saved . burnt . steps . re-doused):
values 10.6/13.6/14.0 . 2.51/2.71/2.45 . 60-62% . 94-95 . 54-56 . 0.13-0.17 | **extinguish 24.4/25.6/25.3 .
4.78/4.47/4.66 . 38-42% . 119-124 . 63-65 . 0.50-0.55**. Hand-written controls at K=4 from shipped code: guard 13.7 .
1.11 . 78.5% . 81.7 . 45.2 | nearest 16.7 . 2.69 . 65.5% . 85.6 . 47.2 | densest 22.0 . 3.33 . 56.5% . 96.3 . 48.5 |
random_fire 13.3 . 4.40 . 44.0% . 121.7 . 56.5. ⭐ **The paid-per-cell crew's 4.64 mean village damage is WORSE than the
random burning-cell dispatcher's 4.40** while putting out nearly twice as much fire. Per-drop probe, seeds in order
(values | extinguish | densest-pilot): first drop 10.6/11.7/12.7 | 13.9/15.6/16.4 | 12.3 . burning then 13.6/12.5/13.9 |
16.9/18.0/18.6 | 14.9 . hit per drop 3.91/4.14/5.22 | 6.78/7.56/8.29 | 8.63 . wasted 25/29/14% | 9/5/3% | 0% . distance
6.4/6.6/6.5 | 7.6/7.5/7.3 | 9.3. No column overlaps between the two trained crews.

**Two hypotheses refuted on the page:** farming one cell (0.50-0.55 re-doused/ep vs 0.13-0.17 -- 3x more but half a cell
out of 25, not a business model) and prolonging (endgame probe: the paid-per-cell crew covers remaining fire 57-70% of
the time vs the values crew's 40-53% -- it aims at the last flames MORE). Village-threat probe: it answers a threatened
village about as often (48-56% vs 47-61%) but FACES the threat 5.6-5.9 times an episode vs 3.3-3.8 (guard 1.60, answers
100%). ⚠️ **Residual left UNEXPLAINED on the page:** densest reaches 22.0 put out at 3.33 village / 96.3 burnt / 48.5
steps while the trained crew reaches ~25 at ~4.64 / ~122 / ~64 -- about 1.3 village cells, 25 burnt cells and 15 steps
unattributed. The causal chain from upstream aim to downstream threat is called an interpretation of two probes, not a
controlled test.

**Decision record on the page: keep `reward="values"`, keep `extinguish` in the code as a switchable mode.** Rejected:
the pure bounty (measured) . a small bounty on top (flips at 3.00; any b > 1 already prefers arson-then-rescue; the safe
bound is a fact about seven rules, not about the environment) . pay for area saved against a counterfactual (costs an
extra episode per episode, and pays the crew to beat the guard chief rather than to protect the village). Named as the
principled option and flagged UNTESTED in this world: **potential-based shaping** (links World 1's paying-the-boat and
the warehouse capstone's reward page).

**Transferable rule the page closes on:** before paying for a metric, hold a policy FIXED, run it over the worlds the
agent will see, and measure corr(metric, objective). Here it was -0.70 with nothing optimising -- the cobra was visible
before anything was bred.

Lab (`CobraLab`, lab map, 12 dice draws shared across all 256 orders, browser = headless node): step 24 -- most fire put
out **(12, 11) 18.7 cells, damage 151**; least damage **(2, 9) 3.9 cells, damage 74** (covers NO burning cell, 3 from the
village). Step 16 -- **(11, 10) 14.8 / 201** vs **(2, 11) 3.8 / 147, and (2, 11) IS a village cell**. Step 8 (8,6)
23.0/262 vs (6,7) 15.5/88; step 32 (5,5) 8.8/137 vs (3,6) 3.9/29. Deterministic (seeds 4000 + 137*draw). Both heat maps
paint "deeper = more of that quantity"; rings mark each map's own best, dashed for the other's.

Promises made on it that later pages MUST keep: "What the crew learned" (ch5 p7) is the endgame / village-threat page
and may reuse these probes . the bar is still guard's -93.2 (-92.3 as a K=4 commander) . World 3 gets the same
"is this number local?" question asked of its own counters (worded with NO claim about turtling, which the plan does
not mark verified).

## World 2 · Wildfire command — prototype log (started 2026-09-13)

Prototype v1 (scratchpad `wf/wf.py`): batched numpy env, 16×16 cells, 12-channel grid observation.
Systems: terrain (grass/forest/rock, smooth elevation, 1 lake, 3×3 village; helicopter starts at the village) ·
fire CA (8-neighbour ignition p = base[fuel]·(1−moisture)·exp(1.5·wind·cos)·slope, diagonals ×0.7; grass burns 2
ticks, forest 5, village 4) · weather (wind direction random walk σ 30° every 30 steps; drying 0.01/fire tick) ·
helicopter (5 moves + act; act = fill on the lake, else drop one bucket on 3×3: burning → unburnt and wet 0.9).
Clocks: helicopter every step, fire every FIRE_EVERY steps, weather every 30. Terminated = no cell burning;
truncated at 300 steps. Rewards: values (−1 per ignited cell −10 per village cell ignited) · area · extinguish (+1 per cell put out).

- [x] Invariants + determinism (random play, 32 worlds × 300 steps): same seed+actions identical, batched world == solo
  world, no burnt cell returns, no fire on lake/rock, heli in grid, water ∈ {0,1}: **all pass**. Throughput B=64
  ≈ 23k env-steps/s (python per-world helicopter loop dominates).
- [x] Baselines, 200 held-out worlds (seeds 1000–1199), village damaged /9 · all 9 saved · cells burnt:

  | config | hover | random | nearest fire | shield village |
  |---|---|---|---|---|
  | fire every 2, base ×1.0 | 7.90 · 9% · 202.5 | 6.45 · 12% · 196.1 | 5.84 · 30% · 153.5 | 3.96 · 41% · 153.4 |
  | fire every 3, base ×1.0 | 8.32 · 4% · 211.1 | 6.93 · 7% · 205.7 | 4.95 · 40% · 129.1 | 2.38 · 56% · 126.9 |
  | fire every 3, base ×0.8 | 6.95 · 17% · 170.5 | 5.00 · 22% · 162.0 | 3.05 · 61% · 88.4 | 1.35 · 73% · 88.0 |
  | **fire every 2, base ×0.8 (race config)** | 6.79 · 20% · 169.4 | 5.05 · 24% · 162.5 | 4.05 · 49% · 113.2 | 2.64 · 58% · 113.6 |

  Shield beats nearest on the village at equal area burnt in every config (a values trade-off that exists in the
  baselines). Random beats hover on the village because the helicopter starts full over the village — random drops wet it.
- [x] ⚠️ **First crew learned NOTHING (v1 global 16×16 obs, raw reward, B=64):** PPO 2M steps — seed 0 test village
  dmg **6.57**, 20.5% saved, 0.48 drops/episode; seed 1 **4.47**, 28.5%, 1.0 drops (hover is 6.79). DQN stopped at
  ~1.05M steps with no sign of learning (train village dmg 6.3–6.6, ~0.4 cells extinguished/episode). Training-curve
  village numbers (~3.8) are biased low by short episodes finishing first — use the held-out test only.
  Suspects: (a) reward scale (returns ≈ −200 → value loss swamps policy gradient under grad-clip 0.5);
  (b) the helicopter is a single pixel in a global map that two stride-2 convs blur away; (c) exploration — a useful
  drop needs fill → fly → drop in sequence.
- [x] Diagnosis round (1M steps, reward ×0.1): PPO global → test village dmg **4.17**, 28.5% saved, **exactly 0.995
  drops/episode, 0.06 cells put out** = it learned to dump its starting bucket on the village and never refill (a
  local optimum random play already hints at). PPO ego-centred and DQN ego-centred: no learning seen by 0.75M / 0.22M
  (DQN stopped). Reward scale and the helicopter-centred view are NOT the main problem.
- [x] ⭐ **Why nothing learns — one bucket is a whisper (common random numbers; fire dice don't depend on the helicopter):**
  replay each held-out world with the shield chief's FIRST drop replaced by hovering. v1: the drop is worth **+4.0**
  return on average (median 0.0; helps 45%, changes nothing 27%, HURTS 28%) against a return sd across worlds of
  **103** ⇒ signal/noise **0.039**. A "rent on burning cells" reward doesn't fix it (+3.0 vs sd 85, 0.035).
- [x] **World-knob sweep** (base ×0.8; hover / nearest / shield as village dmg · all saved · cells burnt; first-drop effect):

  | fire every | bucket | drop | hover | nearest | shield | drop effect | sd(G) | S/N |
  |---|---|---|---|---|---|---|---|---|
  | 2 | 1 | 3×3 (v1) | 6.79 · 20% · 169 | 4.05 · 49% · 113 | 2.64 · 58% · 114 | +4.0 (hurts 28%) | 103 | 0.039 |
  | 2 | 3 | 3×3 | 6.79 · 20% · 169 | 3.46 · 55% · 99 | 1.47 · 74% · 94 | +3.6 (hurts 26%) | 88 | 0.042 |
  | **2** | **1** | **5×5** | 6.79 · 20% · 169 | 2.65 · 65% · 83 | 1.03 · 77% · 84 | **+9.3 (hurts 18%)** | 74 | **0.125** |
  | 4 | 1 | 3×3 | 7.03 · 18% · 173 | 2.24 · 72% · 66 | 0.55 · 86% · 63 | +7.5 (hurts 16%) | 72 | 0.104 |
  | 3 | 3 | 3×3 | 6.95 · 17% · 170 | 1.62 · 78% · 57 | 0.33 · 91% · 57 | +6.6 (hurts 19%) | 58 | 0.114 |
  | 4 | 3 | 3×3 | 7.03 · 18% · 173 | 0.69 · 90% · 33 | 0.06 · 99% · 32 | +4.4 (hurts 11%) | 37 | 0.118 |

  A bigger bucket (more drops per fill) barely helps S/N; a bigger DROP or a slower fire triples it. fire 4 × bucket 3
  is too easy (shield 99%, no headroom). **Candidate v2: 5×5 drop, fire every 2** — S/N ×3.2, shield 77% leaves
  headroom, nearest-vs-shield values trade-off kept (65% vs 77% at ~equal area).
- [x] v2 flat-pilot round (5×5 drop, reward ×0.1, 1M): PPO global test village dmg 2.82, 44% saved — but **exactly
  1.00 drops and 0.0 cells put out**: the same dump-the-starting-bucket trap (the bigger drop wets more village).
  PPO ego (0.53M) and DQN (0.71M) curves flat at ≤0.3 cells put out; stopped. ⇒ A bigger lever alone does not fix a
  flat pilot — exploration does.
- [x] ⭐ **The exploration trap, measured (uniform random PILOT, 200 worlds):** refills in only **6%** of episodes; puts
  out fire with the starting bucket in 3% (3×3) / 5% (5×5); puts out fire AFTER a refill in **0%** (0 of 200, both drop
  sizes). A flat pilot policy never experiences fill → fly → drop-on-fire ⇒ the learners converge on "dump the starting
  bucket" (0.995 drops). Also: PPO ego ×0.1 v1 final test 4.53, 0.995 drops — same trap.
- [x] **Commander interface v1 (pick a target cell; pilot auto-refills, flies, drops; one decision = whole sortie):**
  3×3 drop — random 6.00 · random burning cell 6.44 · nearest 6.03 · shield **5.43** (34% saved), ~5 decisions/episode;
  5×5 — shield 3.86 (53%). WORSE than the step-by-step pilot chiefs (2.64 / 1.03) — a target chosen at dispatch has
  often burned out or moved by arrival (stale orders). Next: a decision clock K (re-decide every K steps).
- [x] ⭐ **Decision clock K (commander re-decides every K sim steps; village dmg · all saved · decisions/episode):**

  | drop | K | random cell | random burning cell | nearest | shield |
  |---|---|---|---|---|---|
  | 3×3 | 1 | 6.64 · 21% | 6.19 · 26% | 4.05 · 49% | **2.64 · 58%** (55.8) |
  | 3×3 | 4 | 6.13 · 25% | 5.73 · 31% | 4.54 · 44% | 2.81 · 57% (15.2) |
  | 3×3 | 8 | 6.17 · 24% | 5.84 · 29% | 4.91 · 40% | 3.82 · 51% (9.0) |
  | 5×5 | 1 | 6.54 · 22% | 5.51 · 33% | 2.65 · 65% | **1.03 · 77%** (46.9) |
  | 5×5 | 2 | 6.11 · 25% | 4.89 · 40% | 2.77 · 64% | 1.08 · 78% (24.1) |
  | **5×5** | **4** | 5.49 · 31% | 4.38 · 46% | 2.69 · 66% | **1.11 · 78%** (12.3) |
  | 5×5 | 8 | 5.12 · 34% | 4.49 · 44% | 2.95 · 64% | 1.74 · 72% (7.3) |
  | 5×5 | ∞ (whole sortie) | 5.30 · 30% | 5.18 · 38% | 4.59 · 46% | 3.86 · 53% (4.1) |

  K=1 dispatch reproduces the step-by-step pilot chiefs EXACTLY (2.64 / 1.03) — consistency check. K=4 is almost free
  (1.11 vs 1.03) with 4× fewer decisions; K=8 starts to cost; whole-sortie commitment costs a lot. **Candidate v3:
  commander, 5×5 drop, K=4, pointer action over 256 cells** (race_cmd.py, fully-convolutional PointerNet).
- [x] Throughput (idle machine, B=64): commander env **13.1k sim steps/s** (3.89 sim steps per decision); PointerNet
  act forward 1.6 ms; PPO minibatch of 512 = 47.9 ms (update ≈ 0.8 s per 2048 decisions) ⇒ ≈3 min per 1M sim steps.
  ⚠️ Running FOUR trainings at once on the 1660 Ti + 6-core i7 was ~100× slower per iteration (≈3 min per iteration) —
  CPU-bound env loops + GPU contention. Run at most two at a time. (Worth a line on the "Training the crew" page.)
- [ ] Commander race, 1M sim steps (5×5 drop, K=4, reward ×0.1; 200 held-out worlds; baselines random 5.49 · random
  burning 4.38 · nearest 2.69 · shield 1.11 village dmg):
  - ✅ **PPO s0 LEARNS** (5.0 min): village dmg **3.57**, 51.5% saved, burnt 109, **9.8 cells put out/episode** (flat
    pilot: 0), 3.6 drops, re-extinguished 0.18. Beats both random dispatchers; below nearest and shield.
    Paired on the same 200 worlds (analyze.py; baselines cached in results/baselines_cmd_K4_d2.json): village dmg ·
    all saved · burnt · put out · vs shield better/same/worse — random 5.49 · 31% · 154 · 2.0 · 2/34/64% ·
    random burning 4.38 · 46% · 122 · 11.6 · 2/48/50% · nearest 2.69 · 66% · 86 · 16.7 · 2/68/30% · shield 1.11 · 78%
    · 82 · 13.7 · — · **PPO s0 3.56 · 52% · 109 · 9.8 · 4/54/42%**. Note the random BURNING-cell dispatcher puts out more
    (11.6) than PPO yet protects the village less than nearest — "cells put out" is not the objective.
  - ✅ **DQN s0 LEARNS, better than PPO s0** (9.0 min): village dmg **2.51**, 62% saved, burnt 95, 10.6 put out,
    2.7 drops, re-extinguished 0.14; vs shield better/same/worse 7/62/32%. Slightly beats nearest on the village
    (2.69) with less water; still behind shield (1.11). One seed each so far — NOT a verdict.
  - PPO s1 (4.9 min): village dmg **2.94**, 58% saved, burnt 110, 10.5 put out, 3.65 drops, re-ext 0.15; vs shield
    6/60/35%. PPO so far 3.56 / 2.94; DQN 2.51. PPO ≈ 5 min per run vs DQN ≈ 9 min (same sim steps).
  - PPO s2 (5.1 min): village dmg **3.14**, 55% saved, burnt 108, 11.2 put out, re-ext 0.23. **PPO 3 seeds: 3.56 /
    2.94 / 3.14 (mean 3.21).**
  - DQN s1 (9.2 min): village dmg **2.71**, 60% saved, burnt 94, 13.6 put out, re-ext 0.18; vs shield 6/62/32%.
    **DQN 2 seeds: 2.51 / 2.71; burnt 95 / 94 vs PPO 107–110.**
  - DQN s2 (9.7 min): village dmg **2.45**, 61.5% saved, burnt 94, 14.0 put out, re-ext 0.13; vs shield 8/62/29%.
  - ⭐ **VERDICT at equal SIM steps (1M, 3 seeds each): DQN wins** — village dmg DQN **2.51 / 2.71 / 2.45 (mean 2.56)**
    vs PPO **3.56 / 2.94 / 3.13 (mean 3.21)**; every DQN seed beats every PPO seed; burnt DQN 94–95 vs PPO 108–110;
    all saved DQN 60–62% vs PPO 52–58%. Cost: DQN ≈ 9–10 min per run, PPO ≈ 5 min (replay reuse vs fresh rollouts).
    Both still well behind the shield heuristic (1.11, 78%); DQN ≈ nearest (2.69) on village, worse on area (94 vs 86).
    Open: equal WALL-CLOCK check (PPO at 2M sim steps ≈ DQN's 1M time) before the page claims a winner outright.
  - ⚠️ PPO 2M s0 (running): training curve at 1.65M → 2.52 dmg, 1.84M → **2.00 dmg, 58% saved**, burnt 105–107 —
    in DQN's range on the village (training curves are noisy and biased toward short episodes; wait for the
    held-out test). **Do not write "DQN wins" until this lands** — the honest verdict may be "DQN wins per sim
    step; at equal wall-clock it's close".
  - ✅ **PPO 2M s0 held-out (9.2 min ≈ one DQN run): village dmg 2.27 · 58.5% saved · burnt 104 · put out 8.3 ·
    re-ext 0.06**; vs shield 9/60/31%. vs DQN 1M (2.45–2.71 · 60–62% · 94): PPO better on village damage, worse on
    all-saved and area. **Equal wall-clock = too close to call on one seed.** PPO 2M s1 running, s2 queued.
  - ✅ **PPO 2M s1 held-out (9.6 min): village dmg 2.70 · 60% saved · burnt 102 · put out 13.6 · re-ext 0.22**; vs
    shield 6/62/32%. PPO at 2M so far: village dmg 2.27 / 2.70 (DQN 1M 2.51 / 2.71 / 2.45) · saved 58.5 / 60%
    (DQN 60–62%) · burnt 104 / 102 (DQN 94–95). Reading so far: equal wall-clock ≈ tie on the village, DQN burns
    ~8–10 fewer cells. s2 running (train curve 1.13M: 2.74 dmg).
  - ✅ PPO 2M s2 held-out (8.0 min): village dmg **2.17** · 64% saved · burnt 95 · put out 13.5 · re-ext 0.11.
  - ⭐ **FINAL RACE VERDICT (3 seeds each, same 200 held-out worlds):**

    | learner · budget | minutes/run | village dmg /9 (mean) | all saved | burnt (mean) |
    |---|---|---|---|---|
    | DQN · 1M sim steps | 9.0–9.7 | 2.51 / 2.71 / 2.45 (**2.56**) | 60–62% | 94.9 / 94.0 / 94.2 (**94.4**) |
    | PPO · 1M sim steps | 4.9–5.1 | 3.56 / 2.94 / 3.13 (**3.21**) | 52–58% | 109.0 / 110.3 / 107.5 (**108.9**) |
    | PPO · 2M sim steps | 8.0–9.6 | 2.27 / 2.70 / 2.17 (**2.38**) | 58.5–64% | 104.0 / 102.1 / 95.1 (**100.4**) |

    - **Per simulator step: DQN wins clearly** (no seed overlap on village or area).
    - **Per minute of training: an honest tie** — PPO's village mean is lower (2.38 vs 2.56) but the ranges
      overlap (2.17–2.70 vs 2.45–2.71); DQN's area is lower (94.4 vs 100.4) and tighter, but PPO s2 reaches 95.
    - **Decision: ship DQN for World 2.** Neither learner is better at equal time, so the tie-break is reasoned:
      (1) the env, not the network, is the cost here (CPU sim loops), so samples are the scarce resource and DQN
      needs half as many; (2) DQN is already built in the Function-approximation track, so World 2 needs no forward
      pointer; (3) its outcomes are more consistent across seeds. PPO is NOT "worse" — the page must say so.
    - The head-to-head earns its page ("Training the crew: DQN vs PPO") because the answer depends on what you
      count: steps or minutes.
- [ ] Cobra test: DQN, reward = +1 per cell put out (rscale 1.0), commander world, 1M sim steps.
  - ✅ **s0 held-out (200 worlds): put out 24.4/episode (values DQN 10.6–14.0) · village dmg 4.78 (values 2.45–2.71;
    worse than the random BURNING-cell dispatcher 4.38) · all saved 38.5% (values 60–62%) · burnt 124 (values 94) ·
    episode 63.6 steps (values ≈54) · 3.6 drops · re-extinguished 0.50 (values 0.13–0.18).** vs shield
    better/same/worse 2/42/56%.
  - ⚠️ Re-extinguishing the SAME cell is rare in absolute terms (0.5/episode) — "farming one cell" is NOT the main
    mechanism. Candidate mechanism (UNVERIFIED): letting fires grow so each drop hits more — cells per drop 6.8 vs
    3.9–5.2 for the values crew. Drop-level probe (probe.py) to test before any prose.
  - ✅ **Drop-level probe (probe.py, same 200 worlds; replays reproduce every summary number exactly):**

    | crew | drops/ep | first drop t (burning then) | burning at drop | hit per drop | wasted drops | dist from village (≤4) | ep len |
    |---|---|---|---|---|---|---|---|
    | values s0 | 2.70 | 10.6 (14.7) | 13.6 | 3.91 | 25% | 6.4 (26%) | 54.4 |
    | values s1 | 3.29 | 11.7 (16.2) | 12.5 | 4.14 | 29% | 6.6 (17%) | 56.3 |
    | values s2 | 2.69 | 12.7 (16.6) | 13.9 | 5.22 | 14% | 6.5 (23%) | 53.7 |
    | **extinguish s0** | **3.60** | **13.9 (18.2)** | **16.9** | **6.78** | **9%** | **7.6 (18%)** | **63.6** |

    Reads as: the extinguish crew drops where fire is DENSEST (hits 30–70% more per drop, rarely wastes one) and
    farther from the village. "Deliberately waits for fires to grow" is only weakly supported (first drop 1–3 steps
    later). Test next: a "densest 5×5 patch" dispatcher — if it reproduces ≈24 put out / ≈4.8 village dmg, the
    mechanism is proxy-greedy targeting, not farming.
  - ✅ **Densest-patch dispatcher (K=4, 5×5, same 200 worlds):** put out **22.0**, 7.49 per drop, village dmg **3.33**,
    56.5% saved, burnt 96, ep len 48.5, re-ext 0.39 (nearest: 16.7 put out, 2.69 dmg, 86 burnt, 47.2 · shield: 13.7,
    1.11, 82, 45.2). ⇒ **Greed for dense fire explains the put-out count (22.0 vs 24.4) but NOT the harm:** the
    extinguish crew is worse than the greedy rule by +1.45 village dmg, +28 burnt, +15 steps of episode. The residual
    is consistent with PROLONGING (termination ends the pay) — UNVERIFIED; endgame probe next (when few cells burn,
    does the crew finish the fire?). Also: every dispatcher that maximises cells put out (random-burning 11.6,
    densest 22.0) protects the village worse than nearest/shield — the proxy and the objective disagree even for
    hand-written rules.
  - s1 training curve at 0.76M replicates s0's pattern: 25.0 put out, village dmg 5.06, 32% saved, burnt 133.
  - ✅ **s1 held-out (8.5 min): put out 25.6 · village dmg 4.47 · all saved 41.5% · burnt 119 · ep len 62.7 ·
    3.39 drops · re-ext 0.55**; vs shield 2/44/55%. **Extinguish crew, 2 seeds: village dmg 4.78 / 4.47 vs values
    crew 2.51 / 2.71 / 2.45; put out 24.4 / 25.6 vs 10.6–14.0; burnt 124 / 119 vs 94.**
  - ✅ **s2 held-out (8.2 min): put out 25.3 · village dmg 4.66 · 38.5% saved · burnt 124 · ep len 65.1 · 3.06 drops
    · re-ext 0.50**; vs shield 2/41/57%. Endgame (1–6 burning): covers some fire 69.5%, ALL 18.1%. Village threat:
    5.91 decisions/episode, covers the threat 55.6%, elsewhere 35.7%, no fire 8.6%.
  - ⭐ **COBRA EFFECT VERIFIED, 3 seeds each (same 200 held-out worlds, DQN, 1M sim steps):**

    | reward | put out / episode | village dmg /9 | all saved | burnt | episode length | re-extinguished |
    |---|---|---|---|---|---|---|
    | values (−1/ignition, −10/village ignition) | 10.6 / 13.6 / 14.0 | **2.51 / 2.71 / 2.45** | 60–62% | 94–95 | 53.7–56.3 | 0.13–0.17 |
    | extinguish (+1 per cell put out) | **24.4 / 25.6 / 25.3** | **4.78 / 4.47 / 4.66** | 38–42% | 119–124 | 62.7–65.1 | 0.50–0.55 |

    Per-drop probe s2: first drop t **16.4** (burning 20.5) · burning at drop 18.6 · hit/drop **8.29** · wasted **3%** ·
    dist from village 7.3. Across the 3 paid-per-cell seeds: first drop t 13.9–16.4 (values 10.6–12.7) · hit per drop
    6.78–8.29 (values 3.91–5.22) · wasted drops 3–9% (values 14–29%) · dist from village 7.3–7.6 (values 6.4–6.6).
    No seed overlap on any column. Mechanism findings (all 3 paid-per-cell seeds agree): re-dousing the same cell
    rare (≈0.5/episode, not classic farming) · prolonging refuted (aims at the last flames MORE: 57–70% vs 40–53%) ·
    answers a threatened village as often (48–56% vs 48–61%) but faces the threat ~1.7× as often (5.6–5.9 vs 3.3–3.8).
  - Probe s1 replicates s0: drops/ep 3.38 · first drop t **15.6** (burning 20.6) · burning at drop 18.0 · hit/drop
    **7.56** · wasted **5%** · dist from village 7.5 (≤4: 18%) · ep len 62.7. Both paid-per-cell seeds: first drop
    later (13.9 / 15.6 vs 10.6–12.7), hit more per drop, waste fewer drops, drop farther from the village.
  - ✅ **Village-threat probe (neglect.py; decisions taken while fire burns within 3.5 cells of the village centre):**

    | policy | such decisions / episode | target covers the threatening fire | only fire elsewhere | no fire |
    |---|---|---|---|---|
    | nearest | 3.18 | 58.5% | 41.5% | 0% |
    | shield | 1.60 | 100% | 0% | 0% |
    | densest | 3.71 | 68.7% | 31.3% | 0% |
    | values DQN s0 / s1 / s2 | 3.25 / 3.79 / 3.37 | 47.5 / 50.7 / 61.0% | 30.9 / 24.2 / 28.3% | 21.7 / 25.0 / 10.7% |
    | **extinguish DQN s0 / s1** | **5.82 / 5.57** | **50.9 / 48.4%** | 37.0 / 35.3% | 12.1 / 16.3% |

    ⇒ When the village IS threatened, the paid-per-cell crew answers about as often as the values crew (48–51% vs
    48–61%) — it does not ignore a burning village. But the village is threatened **~1.6× as often** (5.6–5.8 vs
    3.3–3.8 such decisions per episode). Measured chain: first drop later + drops on dense fire ~7.5 cells from the
    village ⇒ fire reaches the village more often ⇒ more damage. The causal link between the upstream choice and the
    extra threat is an interpretation of these numbers, not a controlled test — word it that way. Shield's 1.60
    shows how rarely a threat arises when fire near the village is always hit first.
  - ❌ **Prolonging hypothesis REFUTED (endgame.py, decisions taken while 1–6 cells burn, same 200 worlds):**
    target's 5×5 covers some fire / covers ALL remaining fire — nearest 100% / 45.7% · shield 100% / 43.6% · densest
    100% / 61.1% · values DQN s0–s2 **40.3–53.1% / 8.3–13.6%** · extinguish DQN s0, s1 **57.0–57.7% / 14.0–14.9%**.
    The paid-per-cell crew aims at the last flames MORE often than the values crew, not less. So it does not stall
    to keep the fire (and its pay) alive. The residual harm vs the densest rule (+1.45 village dmg, +28 burnt,
    +15 steps) is UNEXPLAINED — say so on the page if it isn't resolved. Side finding: every learned crew aims at
    non-burning cells in ~half of its small-fire decisions (hand-written rules never do) — cause not investigated.
  - s1 — running. PPO 2M-step equal-wall-clock run also running.

## ⚠️ World 3 was rebuilt from a LINE to a FLOOR (2026-09-15)

**Everything in the "prototype log" section below was measured on v1, a one-dimensional duel, and
only the lessons survive — not the numbers.** The user asked for a three-dimensional world the
character can move around in, and a three.js view of a one-axis world would have been a picture that
lies about the simulation underneath it, so the environment was rebuilt rather than the renderer.

What carried over unchanged: frames as the unit, the segment table (`w` windup / `d` delay / `h`
active / `r` recovery), the parry window, the stamina economy, the two expert duellists, and every
lesson v1 taught — above all that **the sanity ladder must contain the agent that refuses the task**,
which is how v1's fatal bug was found in the first place.

**⚠️ STALE, and flagged as such: the DQN-vs-PPO race and the 3M-decision run below were all run
against v1.** They are kept because the refusal and turtle findings are what drove the redesign, but
NO number from them describes the shipped world. Re-running the race on v2 is the next training job.

### v2: the duel on a floor (SHIPPED)

Both fighters have a position on a circular arena of radius 8.0 and the boss has a facing.

- **An attack has a reach AND an arc**, and lands only inside both: `thrust` is 3.6 long and 0.35 rad
  wide (you can step out of it), `slam` is 2.6 long and 1.40 rad wide (you cannot). The boss tracks
  you while it winds up at 0.045 rad a frame and **stops turning the instant the active frames
  begin** — that one rule is what makes a late sidestep work and an early one fail.
- **The arena wall replaces v1's speed patch as the answer to refusal.** The player walks 0.075 a
  frame, the boss closes at 0.105, and there is a wall: backing away spends **89.3% of its frames
  against it and now dies 200 of 200** (v1: 176, and under the original bug, never). Circling forever
  dies 197 of 200, because the boss turns faster than you can orbit it.
- **The two bodies are solid** (`BODY = 0.95`). Without that the boss walked *through* the player
  while closing and the player ended up standing behind it — which the one-dimensional version could
  not express and which the 3-D view made obvious within a minute of watching it. The boss now shoves
  you, which is why `run away` went from dying 176 times to dying every time.
- **New action space:** 16 actions — idle, eight movement directions measured from the boss, attack,
  four roll directions, guard, parry. Observation is 26 floats and now includes the off-axis angle,
  the room behind you, and the reach and arc of the move being wound up.

#### Sanity ladder — 200 held-out duels (seeds 1000-1199), a decision every 3 frames

| player | win | die | clock | boss hp | own hp | meanD | off-axis | parries | blocks | hits | dodges | arcX | wall% | G |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| stand still | 0 | 200 | 0 | 240.0 | −12.6 | 1.77 | 0.00 | 0.00 | 0.00 | 4.53 | 0.00 | 0.00 | 0.0 | −41.26 |
| random buttons | 0 | 200 | 0 | 228.3 | −11.6 | 1.83 | 0.06 | 0.18 | 0.18 | 4.67 | 0.40 | 0.18 | 8.0 | −39.99 |
| mash attack | 0 | 200 | 0 | 149.2 | −13.2 | 1.29 | 0.00 | 0.00 | 0.00 | 4.58 | 0.00 | 0.00 | 0.0 | −32.24 |
| run away | 0 | **200** | 0 | 240.0 | −12.8 | 2.15 | 0.00 | 0.00 | 0.00 | 4.58 | 0.00 | 0.00 | **89.3** | −41.28 |
| circle | 0 | **197** | 3 | 240.0 | −12.0 | 1.84 | 0.26 | 0.00 | 0.00 | 4.62 | 0.00 | 0.93 | 0.0 | −40.75 |
| hold guard | 0 | 0 | 200 | 240.0 | 45.3 | 1.29 | 0.00 | 0.00 | 10.80 | 0.14 | 0.00 | 0.00 | 12.1 | −5.47 |
| block, punish | 0 | 2 | 198 | 193.1 | 37.8 | 1.09 | 0.00 | 0.00 | 10.53 | 0.68 | 0.00 | 0.00 | 6.6 | −1.83 |
| roll, punish | 0 | 2 | 198 | 148.1 | 65.4 | 2.01 | 0.00 | 0.00 | 0.00 | 2.23 | 2.85 | 0.00 | 15.1 | +5.42 |
| **sidestep, punish** | 0 | 2 | 198 | 148.3 | **73.6** | 1.58 | 0.28 | 0.00 | 0.00 | **1.65** | **6.84** | **2.69** | 0.0 | **+6.23** |
| parry oracle | 187 | 13 | 0 | −5.6 | 40.9 | 1.51 | 0.00 | 4.75 | 0.00 | 2.87 | 0.00 | 0.00 | 1.3 | +44.75 |
| **patient parry** | **200** | **0** | 0 | −12.0 | **100.0** | 1.56 | 0.00 | 8.56 | 0.00 | **0.00** | 0.00 | 0.00 | 2.9 | **+55.20** |

⭐ **Solvability survives the rebuild exactly: patient parry still wins 200 of 200 on full health
without ever being hit**, and greed still costs — the oracle wins 187 and dies 13.

⭐ **The two-dimensional mechanic is measurable, and it is the point of the rebuild.**
`arcX` counts attacks that reached the player and missed anyway, on angle. Rolling *backwards*
collects **0.00** of them (it leaves the arc by leaving the reach) while rolling *sideways* collects
**2.69** — and the sidestepping player ends on 73.6 hp against 65.4, taking 1.65 hits against 2.23,
while standing 0.43 closer. Leaving the arc is strictly better than leaving the reach, because it
keeps you close enough to punish the recovery.

#### The sweeps, re-run on v2 (all superseding their v1 versions)

- **Decision rate.** R ≤ 3 is free (100% wins, 8.43–8.51 parries), R = 4 dips to 95.8%, and
  **R = 6 collapses to 21.7% wins / 73.3% deaths** with parries halved. The parry window is five
  frames and the press must land in a three-frame band, so R ≤ 3 guarantees a decision inside it and
  R = 6 cannot. Same conclusion as v1, now measured on the shipped world. Shipped: R = 3.
- **Balance is a cliff.** boss hp × riposte, 120 duels: at 240 hp / ×3.0 the flawless defender wins
  100%; at **260 / ×2.5 it wins 10.8% while still never taking a hit.** It does not start losing
  duels, it starts running out of clock.
- **Aggression is a difficulty dial for players who BLOCK, not for players who AVOID.** hold guard
  56.3 → 30.0 hp as aggression goes 0 → 1, block+punish 46.0 → 23.1 — but **sidestep sits at 70–74 hp
  throughout** and the parrier wins every duel on full health at every setting. A boss that attacks
  more often simply offers those two more openings. (v1 could only show this for the parrier; the
  floor gives a second example and makes the rule clearer.)
- **Chip damage prices the shield.** hold guard G: chip 0 → −0.21 (97.9 hp), 0.20 → −5.48 (45.2),
  0.35 → −16.91 (5.9). Guard breaks do not move with chip at all — the **stamina** cost is what breaks
  a guard — and sidestep's row is perfectly flat because it never blocks, which is the ablation
  checking itself.
- ⚠️ **The clock rule, and its cost.** Under a neutral clock the losers spread over 47 points and rank
  sensibly; under clock-as-defeat every non-winner is squeezed into −23…−41 and **mash attack, dead in
  11 s, outscores hold guard, alive and barely scratched at 30 s.** Note this differs from v1 in an
  important way: v1's neutral clock paid refusal about zero, which was the hack. **On the floor,
  refusal already dies** (run away −41.28), so the neutral clock no longer rewards it — the wall did
  the job the reward was being asked to do. The flattening cost of clock-as-defeat remains real.

#### Invariants, determinism, and the TypeScript port

`boss_cases.py check`: 40 duels of uniform random buttons, every frame — neither fighter outside the
arena, stamina in range, no hp increase, no boss frame past the end of its move, no staggered boss
with a move still out: **PASS**. Same seed plus same buttons is bit-identical. Branch coverage: 14
parries, 12 dodges, 7 blocks, 3 guard breaks, 193 hits, 23 whiffs, **0 wins** — the winning branch is
reachable only by a scripted player.

`src/components/boss/duelSim.ts` is a TypeScript port so the arena can be **played** rather than
replayed. It is verified, not assumed: `boss_cases.py port` records one duel's boss draws and buttons,
and `scripts/boss_port_check.mjs` replays them through the port. Over 900 frames the largest
disagreement in any position, angle, health or stamina is **5.0×10⁻¹³** and all counters are
identical (14 of them at the time; 15 once poise added one).

#### The arena's bodies and meters (2026-09-18)

The first three.js pass drew both fighters as a capsule with a stick for a weapon. Replaced with posed
rigs and a dressed room. **This was a renderer-only change** — `duelSim.ts`, `BOSS_SETUP` and every
constant are untouched, `boss_port_check.mjs` still reports 5.0×10⁻¹³ with every counter identical,
and `check-pages` is still clean over 763 pages, so nothing measured above went stale.

- `src/components/boss/fighters.ts` — a knight (~1.7 units, steel and a blue cape, kite shield, sword)
  and the boss (~2.9 units, horned helm, ember eyes, greatsword), both built from primitives as nested
  groups so every joint can be posed. The pose functions read the SAME fields the simulation stepped —
  `pa`, `pf`, `bm`, `bf`, `bStagger` — and return joint angles. They never write to the duel.
- `src/components/boss/arenaScene.ts` — flagstones, wall, buttresses, four braziers, drifting dust, all
  from `<canvas>` textures painted once at build time, plus a 64×32 equirectangular sky run through
  `PMREMGenerator`. That environment map is not decoration: a `MeshStandardMaterial` with high
  metalness and nothing to reflect has no diffuse term left and simply takes the colour of whatever
  light reaches it, which is why the first pass looked like painted bronze.
- The HUD is wired to real fields only: `php/P_HP_MAX`, `pst/P_ST_MAX` (with ticks at the parry, attack
  and roll costs, dimmed while `pRegenLock` runs), `bhp/B_HP_MAX`, `bStagger/STAGGER`, and
  `framesToActive(e)` as a countdown. It is written straight from the render loop through refs, so a
  30 Hz duel never re-renders React.

**Two honesty corrections the rebuild forced.**

- The floor wedge was colouring the **delay** segment differently from the windup. The delay is
  precisely the frames the boss spends holding a finished-looking windup and doing nothing, so a
  different colour hands the player a tell the world does not give them — and it contradicted the page,
  which already said the wedge is gold while winding and red on the frames that can hurt you. Windup
  and delay now render identically, and so does the blade glow. The phase strip below the arena still
  separates them, because it is labelled as an after-the-fact readout.
- There is **no charge-up special in this world**, and one was not invented for the meter: adding a
  resource would change the environment and stale every number above. The gold meter shows the riposte
  window — `bStagger` counting down, during which an attack multiplies by `RIPOSTE_MULT` and after
  which it does not. The page says this in as many words.

**Measured, at 558×324, dpr 1:** `renderer.render` costs **1.47 ms** a frame (0.70 ms with a
`gl.finish()`), over **74 draw calls and 4,952 triangles**, 8 programs, 4 textures.

⚠️ **The rAF trap, hit a second time.** The arena appeared to run at 2.4 Hz. Before blaming the scene,
measure a control page: a page in the same tab with **zero canvases** stalled the same way, with rAF
gaps of 1–2 seconds. The pane, not the render loop, was the problem — which is exactly what the
1.47 ms render cost says too. Screenshots are still reliable; the frame clock is not. Force the state
you want to inspect and screenshot it rather than waiting for a moment to come round.

#### Poise: a second way to stagger it (2026-09-18) — AN ENVIRONMENT CHANGE

The user asked for a poise bar: stagger the boss by hitting it, not only by parrying it. This one is
**not** renderer-only, so the numbers above that involve a player who attacks have moved and are
re-measured here. `scripts/boss_cases.py poise` reproduces all three tables.

**The mechanic.** A landed hit takes `POISE_HIT` off a pool of `B_POISE_MAX` that refills at
`POISE_REGEN` a frame; empty it and the boss is staggered for `POISE_STAGGER`. Any stagger (parry or
break) cancels the move it had out and refills the pool. Riposte hits do **not** drain poise — the
boss is already down — so the multiplier is read before the drain, which means **the hit that breaks
poise does ordinary damage and the riposte is the next one**. Shipped: 50 / 25 / 0.08 / 60, i.e.
*two clean hits inside the same engagement*, a pool back in ~21 s, and a 60-frame opening.
The observation grew from **26 to 27 floats** (`v[26] = b_poise / B_POISE_MAX`).

**What the sweep settled, in order.**

- With no refill, **only `ceil(pool / hit)` matters** — (45,15), (45,20), (60,20) and (60,25) print
  digit-identical rows because they are all three hits. The pool and the per-hit number are one
  parameter, not two.
- **The refill rate decides *who* the mechanic is for**, and it does not switch off evenly. At
  regen 0.40 the sidestepper is down to 0.21 breaks a duel while the masher still gets 0.97: hits
  landed back to back survive a refill, hits spread across openings do not.
- **The window length was the hard one, and it hid a trap.** Short windows are inert — at 40 frames
  the punisher opens 2.0 breaks and cashes **0.20** of them, because the window shuts before it is
  back in range with the stamina to swing. Conversion jumps from 0.76 to 1.81 between 56 and 58.
  ⚠ And **52–56 REVERSES which avoider scores better** — rolling backwards beats rolling sideways
  there and nowhere else, a resonance between the window and the sidestepper's roll-and-swing cycle.
  58–64 is the only flat stretch where sideways still leads (+0.70 to +1.06), so the shipped value
  is 60, the middle of it. Picking 55 "because a parry buys 55" would have landed inside the notch
  and quietly inverted the finding this world was given a floor to demonstrate.
- `POISE_STAGGER` (60) is therefore **longer** than `STAGGER` (55), which is the right way round: a
  parry also negates the blow that opened it and costs 15 stamina with no setup, where a break costs
  two landed attacks and the exposure of getting them in.

**What it changed (200 held-out duels, poise off → shipped).**

| player | bossHP | ownHP | breaks | G |
|---|---|---|---|---|
| mash attack | 149.2 → **67.0** | −13.2 → −12.6 | 1.97 | −32.24 → −23.35 |
| block, punish | 193.1 → 163.9 | 37.8 → 41.9 | 1.00 | −1.83 → **+1.81** |
| roll, punish | 148.1 → 95.4 | 65.4 → 72.0 | 1.72 | 5.42 → **11.66** |
| sidestep, punish | 148.3 → 90.4 | 73.6 → 75.3 | 1.80 | 6.23 → **12.35** |
| patient parry | −12.0 | 100.0 | **0.00** | 55.20 (unmoved) |

- The **expert is untouched**: 200/200 on full health, never hit, and **0.00 breaks**, because
  everything it lands is riposte damage already. The parry oracle went 192/8 → 195/5.
- ⚠ **The cost: mashing now wins.** Walking in swinging lost 200 of 200 before poise; it now wins
  **2 of 200** (and 1 of the 25 in the published cell). Still last by 26 points, but no longer a
  policy that cannot possibly work — a reward for landing hits is a lottery ticket for the reckless,
  and an agent is good at widening that kind of crack.
- ⚠ **The aggression dial grew a second sign.** Before poise, `sidestep` sat flat at 70–74 hp across
  the whole dial. Now it goes **69.1 → 79.0 hp as the boss gets angrier**, because a boss that
  attacks more often offers an avoider more openings and openings are what poise pays for. The
  blockers still fall (56.3 → 30.0, 48.7 → 29.0). The same knob is now difficulty for one kind of
  player and a gift to another. At aggr 0.00 `sidestep` wins 6.7% — the first non-parrier to win.
- **Unmoved:** `balance` (the 260-hp cliff), `rate` (R≤3 free, R=6 collapses to 21.7%), `refuse`
  (run away 200/200 deaths at 89.3% wall frames) — none of those players ever land a hit.
- The `arc` finding **survives at 60 and only at 60-ish**: sidestep 75.3 hp / 1.57 hits / arcX 2.47 /
  G 12.35 against roll-backwards 72.0 / 1.81 / 0.00 / 11.66.

**Also done:** `ATK_ARC = 0.90` was declared and never used — the player's attack is tested on reach
alone — so it was deleted rather than left to imply an arc that does not exist.

**Re-verified:** invariants PASS with a new `0 < b_poise <= B_POISE_MAX` check and poise breaks in
branch coverage (3 from random play); the port replays 900 frames at **5.0×10⁻¹³** with **all 15**
counters identical, and the recorded duel exercises the new branch (2 breaks, 0 parries); both
runnable cells reproduce their published block by exact string equality in Pyodide.

⚠ **`train.py` now needs a 27-float observation**, on top of already needing the v2 port.

#### Chapters 6 and 7 drafted end to end (2026-09-18) — 12 pages, and six new measurements

The user asked for a rough draft of every remaining page so they can be iterated one at a time. All
**12** unbuilt pages now exist and are wired into `envBuildingTrack.ts`, so the track is **41 of 41**
and no longer 0-blind only by omission. tsc EXIT 0; `check-pages` clean over **775** pages.

⚠️ **Verification status, stated plainly.** Every published block on these pages is machine-generated:
a scratchpad `regen.py` extracts each `codeX` cell out of the page, executes it against a FRESH copy
of the shipped `BOSS_SETUP` namespace (which is what the browser's Run button does — `setup + cell`),
and pastes the real stdout back into `outX`; standalone tables are spliced verbatim out of a named
section of a `boss_cases.py` command by a scratchpad `secs.py`. So no number was transcribed by hand.
**They have NOT yet been verified in Pyodide by exact string equality**, which is the standard every
earlier page in this track met. That is the first thing the refine pass must do.

**Six new `boss_cases.py` commands**, all reproducing what the pages publish:
`states` · `timing` · `obs` · `curriculum` · `rewards` · `speed`.

**⭐ `timing` — the windows, measured instead of declared.** A family of players identical but for one
number k: press as soon as the next hitbox is k frames away or closer. At one decision a FRAME the
parry works for k = 3..7 and **for nothing else** — 100% wins on full health inside, 4.58 hits taken
and death outside. It is a cliff with vertical sides, which is the five-frame window written down as
five frames, and there is no partial credit anywhere in the mechanic. At R = 3 only k = 5..7 is safe
(k = 4 leaks 4.20 hits), because a press aimed at k can land as late as k-2 — **this is the R ≤ 3
argument derived from the moveset rather than from training cost**. The roll is the same shape and
twice as forgiving: k = 3..12 at R = 1, k = 5..12 at R = 3. Hardest timing, biggest payoff.

**⭐⭐ `curriculum` — the moveset is a curriculum and the obvious ordering is BACKWARDS.**
`Duel(moves=[i])` costs one argument because the moveset is data. Per move, 100 duels, own hp left:

| move | mash | hold guard | block,p | roll,p | sidestep,p | oracle | patient |
|---|---|---|---|---|---|---|---|
| slash | −7.6 | 58.0 | 51.4 | 58.8 | 49.8 | 100% / 36.8 | 100% / 100.0 |
| thrust | −10.0 | 50.7 | 49.0 | 71.2 | 71.2 | 99% / 36.6 | 100% / 100.0 |
| heavy | −2.0 | 38.5 | 39.3 | **100.0** | **100.0** | 100% / 47.0 | 100% / 100.0 |
| slam | −20.0 | 50.6 | 52.1 | **100.0** | **100.0** | 100% / 65.5 | 100% / 100.0 |
| combo | −12.0 | **0.8** | 30.8 | −11.3 | **8.2** | **44%** / 0.3 | 100% / 100.0 |
| ALL FIVE | −12.6 | 45.8 | 42.6 | 68.9 | 75.3 | 96% / 41.3 | 100% / 100.0 |

The two attacks the brief calls frightening are the EASIEST — both avoiders finish untouched — because
a long telegraph is only frightening to something with a reaction time. `combo` is the hard one and the
**only move that beats the greedy expert** (44% against 99–100%). ⭐ The mechanism is an interaction
between two numbers written on different pages: combo's hitboxes are **12 frames apart** and the roll's
i-frames are **10 frames wide (3..12)**, so *no press covers both hits*, and the roll is 18 frames long
so you cannot press a second. `patient parry` is untouched because **a parry cancels the move**, so the
second hit never happens. A roll survives an attack; a parry deletes it.

**⭐⭐ `delays` (in `boss_train.py`) — the parry window of BOTH delayed attacks is INSIDE the hold.**
The probe: when a policy presses a defensive button, how many frames away is the hitbox? `patient parry`
is flat at **4.0 / 4.1 / 4.0 / 4.0 / 4.0** across all five moves (sidestep: 7.0–7.9), which is what
"reads the animation clock" looks like as a table and is the reference a trained policy is compared
against. The finding fell out of the phase breakdown: the expert presses parry on 7% of its decisions
during windup frames and **30%** during delay frames. Arithmetic: heavy's hitbox is at frame 28 and the
press must land on 21–25, while the hold runs 20–27; slam's hitbox is at 36, press 29–33, hold 24–35.
**"Wait out the delay" is exactly wrong for a parrier — the delay IS the window.** Nobody designed
that; it is the second mechanic in this world produced by two independently chosen numbers.

**⭐ `rewards` — the turtle, in exact arithmetic, with no training.** Three rewards × two clock rules ×
8 players, 200 duels. Under `survive` + neutral clock `hold guard` scores **exactly 30.00** (900 frames
at 1/30) and a win is worth **exactly +30**: refusing to fight and finishing the fight are the same
number, and the only difference is elapsed time — so a *slower* win scores better (29 s → 59.0, 10 s →
40.0). Under `trade` (dealt only) `hold guard` scores **exactly 0.00**: never deals, never charged.
Under `damage` + `defeat` every non-winner is squeezed into −17…−41 and mash attack (dead at 14 s)
outscores hold guard (alive at 30 s on 45 hp), −23.35 vs −35.47. Shipped stays `damage` + `truncate`,
and the justification is the wall: on a floor refusal already dies, so the neutral clock no longer pays
it. **The environment did the job the reward was being asked to do.**

**`obs` — the observation, and a range check that found two real defects.** Printed labelled off a
real duel at a delay frame; `v[18] phase = DELAY` reads 1.000, which the screen refuses to tell a human.
Worse (better?): `v[11..15]` and `v[16]` *determine* the phase, so deleting the flags removes a
convenience not a secret. Delay is **5.5–7.4%** of a duel's frames (~50 a duel). ⭐ The expert spends
**0 frames** watching a recovery, because it cancels every move it sees. Range check over 20 duels:
**`v[21]` reaches 1.091** (stagger ÷ STAGGER=55 while a poise break sets 60) and **`v[23]` is a raw
radian up to 1.40** against `v[22]` ≤ 0.45 — "I normalised everything" was a claim and two thirds of it
was true. Not fatal (learned first layer), but published rather than tidied away.

**`speed` — 117,030 frames/s on one core** (`stand still`), 119,734 (`patient parry`), best of 3 with
nothing else running ⇒ ~39,000 decisions/s at R=3. A 2M-decision run is 6M frames ≈ **90 s of
simulation** inside an hour of wall clock, so the env is **under 2%** of training. World 2 profiled,
found fire_tick at 80% and vectorised for 8.0–8.7×; World 3 ran the same measurement and **wrote no
vectorised code at all**. Same discipline, opposite conclusion. The 64-duel divergence check is on the
page: at any frame the duels are spread over five of the boss's six situations, so a masked-vectorised
step would run every branch and throw most of it away.

#### `scripts/boss_train.py` — NEW (2026-09-18)

DQN + PPO against the extracted `BOSS_SETUP`, scored through the SHIPPED `score()` on seeds 1000–1199,
so a trained policy is literally a new row in the sanity ladder. MLP 27→256→256→16 (DQN) and a 128-wide
actor-critic (PPO). Budgets in **decisions** (1 decision = 3 frames; a duel is 300). Commands:
`dqn` · `ppo` · `ladder` · `race` · `report` · `probe` · `delays` · `bench` · `version`.
Runs write `results/boss/<tag>.json` + `.pt`.

⚠️ **The envs are batched (16 by default) and NOT because the duel is slow.** One decision costs one
GPU round trip and 16 in a batch cost about the same as one. `bench` measures the four layers — duel
alone, + one forward per decision, + the forward over 16 duels, + half a gradient step per decision —
and must be run on an idle machine.

#### ⭐⭐ The v2 run landed: DQN reaches the expert's win rate, and the delay probe says it CHEATED

**`dqn_2000k_s0` — DQN, seed 0, 2,000,000 decisions, shipped world (poise, neutral clock, `damage`
reward), 63 min on the 1660 Ti.** Held out over the same 200 duels every scripted player sat:

| | win | die | bossHP | ownHP | parry | poise | swing | hits | guard% | G |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **the trained net** | **200** | 0 | −12.1 | 83.6 | 4.63 | **0.00** | 7.01 | 0.85 | 0.2 | **53.57** |
| patient parry | 200 | 0 | −12.0 | 100.0 | 8.56 | 0.00 | 7.00 | 0.00 | 0.0 | 55.20 |
| parry oracle | 195 | 5 | −8.6 | 44.7 | 4.58 | 0.26 | 9.23 | 2.71 | 0.0 | 47.83 |

⭐ **It matches the expert's win rate**, lands between the two experts on score, and gets there by
parrying — with **0.00 poise breaks**, exactly like the expert, because all its damage is already
riposte damage. ⭐ **7.01 swings against the expert's 7.00**, and that is arithmetic rather than
coincidence: a riposte is 12 × 3 = 36 and the boss has 240, so 7 is the number the world allows.
The cost of its worse method is 0.85 hits a duel and 83.6 hp against 100.0.

⭐ **The curve is violently non-monotone and the run's own DecisionPoint predicted it.** Zero wins
through the first six evaluations (to 1.0M), then 22% / 59% / 68%, **100% at 1.3M**, then a collapse
to **91% at 1.5M and 69% at 1.6M**, then 100% from 1.7M on. A budget of 1.6M would have reported a
69% duellist and 1.3M a perfect one, from the same run. ⭐ It also VISITS AND LEAVES both local
optima the scripted ladder predicted: poise breaks peak at **1.28 a duel at 900k** and are **0.00**
from 1.4M, and guard frames peak at **27.3% at 900k** (the turtle forming) and end at 0.2%.

⭐⭐ **`delays` — it did NOT learn to wait, and the probe caught it.** Median notice, frames to the
hitbox, and the share landing inside the usable band:

| move | expert median / in-band | trained median / mean / in-band |
|---|---|---|
| slash | 4 / 100% | 5 / 5.2 / 73% |
| thrust | 4 / 100% | 4 / 4.1 / 59% |
| **heavy** (delayed) | 4 / 100% | **6 / 9.1 / 49%** |
| **slam** (delayed) | 4 / 100% | **6 / 11.0 / 45%** |
| combo | 4 / 100% | 5 / 4.6 / 68% |

The two delayed attacks are measurably the ones it handles worst — the brief's promise CONFIRMED —
but the method is brute force, not patience. It makes **925 and 1051** defensive presses against
heavy and slam where the expert makes **465 and 496**, presses parry on **44%** of its delay-frame
decisions against the expert's 30%, and converts about **30%** of its presses into parries against
the expert's ~100% (15.4 presses a duel → 4.63 parries, vs 8.6 → 8.56). A parry costs 15 stamina, the
cheapest action in the world, so throwing it repeatedly through a long hold is affordable: it turns a
timing problem into a volume problem and pays 0.85 hits a duel for it.
⚠️ **A page reporting only the win rate would have called this "it learned to parry" and been wrong
about the exact thing this world was built to study.** This also sharpens why the masked-observation
ablation is the experiment that matters: the brute-force answer is available only *because* the
policy knows a hitbox is coming and roughly when.

⚠️ **Probe confound found and closed before any prose was written.** The first version counted every
defensive press, including ones made at a safe distance — which the scripted players never make,
since they gate on `will_connect`. Split the buckets and re-ran: **99% (net) and 100% (scripted)** of
presses were made while the attack could actually have reached, so the early pressing is real. The
confound was empty, but it was checked rather than assumed.

**`bench` — where a training second goes** (1660 Ti, idle machine, best of 3): duel alone 18,457
dec/s · + one forward per decision **2,108** · + that forward over 16 duels **15,622** · + half a
gradient step **684**. So the duel is **26×** faster than the cheapest loop that trains on it, and
batching bought **7.4×** — for the GPU round trip, not for the env. 684 dec/s × 2M ≈ 49 min, against
63 observed, the rest being evaluations.

⚠️ **Two of my own errors, caught by arithmetic rather than by review.** (1) The `speed` note said 6M
frames is "about a minute and a half of pure simulation"; it is **under a minute** (6M ÷ ~115k), and
the env's share of the run is **1.4%**, not the "under 2%" I first wrote by luck. (2) `bench`'s first
row (55k frames/s) contradicted `speed` (115k) on the same page. Rather than pick one, the gap was
decomposed and the decomposition added to `bench`: ×0.82 random play resets more often, ×0.87 the
obs() call, ×0.95 the replay writes, ×0.83 stacking the batch = ×0.56, and the rest is the batching
wrapper. ⚠️ Timings also move 108k–117k run to run — **quote ranges, never digits**, as World 2 had
to learn on its vectorisation page.

**Still unrun:** the PPO arm, two more DQN seeds, and the masked-observation ablation. The v1
DQN-vs-PPO race remains STALE and is not quoted anywhere.

#### Pages drafted (all 12), and what each is gated on

| page | the spine | gated on |
|---|---|---|
| A moveset as a state machine | a move is DATA; three states not five; what the table bought | `states` |
| Frames, hitboxes and i-frames | reach AND arc; facing commits; the roll window measured | `timing`, `arc` |
| Stamina and the perfect-guard window | sustainable rate 2.2 s a roll vs 3.2 s between attacks; R ≤ 3 | `chip`, `rate`, `timing` |
| What the agent sees | 27 floats, and v[18] hands over the secret | `obs` |
| Thousands of duels at once | measure which cost dominates; here, don't vectorise | `speed`, `bench` |
| Scripted players and a difficulty dial | the ladder as eleven arguments; the dial has two signs | `ladder`, `refuse`, `dial` |
| Curriculum: one move, then the set | per-move difficulty inverts the obvious ordering | `curriculum` |
| Training the duellist | the exam predates the student; report the curve | `boss_train.py dqn` |
| The turtle | three rewards × two clocks, hacked before training | `rewards` |
| What it learned about delayed attacks | the notice column; the window is inside the hold | `delays` |
| Sim vs the real game | five gaps; reaction arithmetic; imitation goes the other way | arithmetic only |
| Three worlds, one pipeline | the five steps and the eight findings common to all three | quotes W1/W2 |

⚠️ **Still owed after this session:** the PPO arm and two more DQN seeds; the masked-observation
ablation (`v[11..20]` → one flag + a recurrent policy), which is the experiment that would actually
settle the brief's delayed-attack promise and is named as such on the page; and a browser eyeball of
all 12 pages (four were checked). The four `pending:` blocks are now FILLED — `speed`, `bench`,
`curve` and `delays` all landed after the training run.

#### Chapters 8 and 9: how to BUILD it and how to TRAIN it, line by line (2026-09-19)

User: *"have you provided how to train it step by step code by code line by line, same for env
creation? If needed also run 1 epoch or step on cpu but also guide how to run it on GPU if it boosts
speed. Also in end there should be a representation on how the trained agent works against the enemy,
a lab showcasing it."* All three gaps were real. World 3 explained every design **decision** and never
showed the code being written; `training-the-duellist` argued about budgets and evaluation and
contained **zero lines of DQN**; and eleven of the twelve pages had no lab at all.

**Three new pages, track now 44 of 44.**

| page | where | what it is |
|---|---|---|
| `writing-the-duel` | after stamina | `step()` in its six numbered sections, the three lines that matter priced, then a full `MyDuel(Duel)` the reader assembles and checks frame for frame |
| `the-training-loop` | before `training-the-duellist` | DQN written out in numpy and runnable in-browser: one gradient step, then the same step in a loop; then the real commands, CPU first; then the GPU question, measured |
| `watch-it-fight` | after the delay probe | the trained net in the 3D arena with its sixteen Q-values live, plus the chain of checks that makes it the same policy |

⭐⭐ **The GPU answer is no, and it is measured.** New `boss_train.py devices` runs the same four loops
on both devices. On a GTX 1660 Ti, against this world:

| loop | cpu | cuda | speedup |
|---|---:|---:|---:|
| the duel alone (no tensors — the control) | 19001 | 19116 | **1.01x** |
| + a forward per decision, 1 duel | 4458 | 1876 | **0.42x** |
| + the same forward over 16 duels | 16013 | 12755 | 0.80x |
| + half a gradient step (what a run IS) | 639 | 636 | **1.00x** |

A 2,000,000-decision run costs ~52 min of loop either way. Take the environment out and the crossover
appears: batch 256 → **0.99x**, 1024 → 1.94x, 4096 → 6.99x, 16384 → **13.20x**, 65536 → 15.55x. So the
rule to teach is *the batch size at which a GPU starts to pay*, not the hardware.

⚠️ **The user asked twice whether this was really using the GPU** — first "still running on cpu it
seems", then "now it seems you are using integrated GPU not my nvidia dedicated GPU". Both were fair,
and answering them properly improved the page. The script now proves it: it names every adapter
Windows sees (the machine has a 1660 Ti **and** an Intel UHD 630), shows `torch.cuda.device_count()`
is 1 because CUDA is NVIDIA-only silicon, and measures **4341 GFLOP/s = 80% of the 1660 Ti's ~5.4
TFLOP/s peak** — an order of magnitude beyond any integrated part. The card is real and it is *bored*:
median utilisation **19%** at batch 256, 97% at 65536. It looks idle in Task Manager partly because it
nearly is and partly because Task Manager graphs the **3D** engine while CUDA lands on **Compute_0**.

⭐⭐ **`probe` rewritten, and it corrected the page I was about to ship.** The button histogram alone
is misleading, because a press is not an action. New second section counts what the world did with
each press, per duel:

| button | presses | started | dropped: committed | dropped: too poor |
|---|---:|---:|---:|---:|
| attack | 33.3 | **7.00** | 23.3 | 3.1 |
| parry | 16.8 | 4.73 | 11.3 | 0.8 |
| **roll (all four)** | **23.0** | **0.01** | 14.8 | 8.0 |

⭐ **It asks to roll twenty-three times a duel and rolls 0.01 times.** I had written that it "never
rolls" and had "decided the roll is a worse deal than a parry". Both false: it is asking constantly
and being **refused** — half the presses arrive while committed, the rest when it is under 25 stamina,
because it has already spent that stamina attacking and parrying. I had also written "it barely
moves"; walking is **38%** of its decisions. Both bullets were guesses dressed as observations, and
the lab is what exposed them — the very first Q-panel snapshot showed it pressing a walk button.

⚠️ **Two measurement bugs of my own, both caught by a number that could not be true.**
1. The first `probe` said **0.96** attacks a duel against a ladder that says **7.01**. Cause: a
   decision holds one button for 3 frames and `step()` reads it on *every* one, so a press refused on
   the decision frame is often accepted on the next. Counting only the decision frame undercounts by
   7x. Fixed, and the table now prints a **self-check** that re-derives two columns from the shipped
   log counters and says `ok`/`MISMATCH`.
2. `devices` gave **0.96x, 0.84x and 1.49x** on the tensor-free control row across three runs — a row
   that must be 1.00x. Cause: all cpu reps ran before all cuda reps, so background load landed on one
   side. Now **interleaved** cpu/cuda/cpu/cuda per loop; the control row reads **1.01x** and the
   script prints a verdict on its own control row and tells you to throw the table away if it drifts.
   Also `cuda memory allocated` was reporting the whole *process* (18 MB) rather than the net (301 KB).

⭐ **New `scripts/boss_regen.py`** — promoted from a scratchpad tool. Executes every `const codeX` on a
World 3 page against a fresh `BOSS_SETUP` and writes the real stdout into `const outX`; `--check --all`
verifies without writing. **It now reports clean across every World 3 page**, which is the exact-string
guarantee the track has been owing. Three cells were additionally run through the browser's own Run
button and came back **byte-identical** to the published blocks.

**The lab.** `DuelArenaLab` gained a `showNet` prop (off by default, so page 1 neither spoils the
ending nor fetches 300 KB). The trained net plays in the 3D arena with a live sixteen-bar Q panel.
Three new pieces make the claim honest rather than decorative: `Duel.obs()` ported into `duelSim.ts`,
`src/components/boss/trainedPolicy.ts` (pure array arithmetic, imports nothing, so node can load it),
and `scripts/boss_policy_check.mjs`, which replays 505 recorded states and checks weights by sha1,
`obs()` to **5e-10**, Q-values to **1.2e-5**, and **505/505 identical buttons**.

⭐ **An unplanned finding from building it:** the mean gap between the best and second-best Q-value is
**0.065**, on values around forty. The policy is close to indifferent nearly everywhere — which is a
plausible mechanism for the violently non-monotone curve, since a policy balanced on knife edges does
not degrade gracefully, it flips.

#### The Q panel was drawing nothing, and I had already measured why (2026-09-19)

User, with a screenshot: *"the thinking part is not seen."* Correct. The sixteen-bar panel computed
the right Q-values and displayed none of them legibly, because it min-max normalised inside each
frame: `(q - worst) / (best - worst)`.

New `scripts/boss_qspread.mjs` measures what that divides by, over 32,537 decisions:

| | p10 | median | p90 | max |
|---|---:|---:|---:|---:|
| fan (best − worst) | 0.20 | **0.84** | **5.35** | 9.50 |
| margin (best − 2nd) | 0.00 | 0.03 | 0.19 | 2.27 |

A full-width bar therefore stood for 0.84 of Q in one frame and 5.35 in the next, and **31% of the
panel** sat pinned against the right-hand edge on an average frame. Replaced with a **fixed ±4
scale** diverging from the mean, signed-square-root compressed, with a visible centre line: it
clips 3% of bars, which is the price of two frames being comparable at all. Q-values also run
**15.4 to 35.9**, not "in the forties" as two pages claimed.

⭐ The sting: the mechanism was a number I had already published — a mean best-vs-second-best
margin of **0.065** — and I then built a visualisation that divides by exactly that quantity. The
finding and the bug were one fact, a week apart.

Two smaller bugs fixed alongside. Building the bars under `if (!qGrid.childElementCount)` starves
the **second** run of the effect (fast refresh, StrictMode) of its node references while the DOM
keeps the first run's nodes, so the panel can sit at `--` for ever while the net plays on perfectly
— rebuilt with `replaceChildren()`. And in the first version of the measuring script,
`new Duel({ seed })` silently ignored `seed` (DuelOpts takes an `oracle`), so "40 duels" was one
duel forty times; the tell was statistics identical across two different sample sizes.

#### The masked-observation ablation, built (2026-09-19)

`obs()` hands the network the boss's animation state outright: `v[11..15]` which move, `v[16]` how
far into it, `v[17..20]` which segment, `v[22..24]` its reach, arc and whether that hitbox covers
you now. **Fourteen of twenty-seven floats**, and between them they make "windup or delay?" a
lookup rather than a question — which is the thing `what-it-learned-about-delayed-attacks` claims
was learned.

`boss_train.py` gained a `View` between `env.obs()` and the first `Linear`, plus `--obs masked`
(those fourteen floats → one flag: *a move is out*) and `--stack k` (show the last k observations,
so timing can come from memory). `full x1` is the default and is byte-identical to before — `probe`
reproduces its published block exactly. Measured on a real `heavy` at frame 18 (windup) versus
frame 24 (delay):

| view | floats that differ between the two phases |
|---|---|
| full | **5 of 27** — including v[16] the frame counter, v[17] "is windup", v[18] "is delay" |
| masked | **2 of 15** — distance and the clock, i.e. nothing about the attack |

So under the mask the two phases are genuinely indistinguishable from a single frame. New `ablate`
command scores each arm and reports **TV(windup, delay)**: the total-variation distance between
what a policy presses in the two phases. 0.00 means it cannot tell them apart.

**RESULT (2026-09-19).** Three arms at 2,000,000 decisions, seed 0, all other defaults:

| arm | win | TV(windup, delay) | notice, delayed | notice, plain |
|---|---:|---:|---:|---:|
| full x1 (the shipped `dqn_2000k_s0`) | **200**/200 | 0.49 | 10.1 | 4.7 |
| masked x1 | **96**/200 | 0.18 | 17.0 | 6.6 |
| masked x16 | **0**/200 | 0.35 | 18.0 | 7.3 |
| `patient parry` (scripted, reads the clock) | 200/200 | **0.22** | 4.0 | 4.0 |

**Strip the animation state and it falls 200 -> 96.** About half of what looked like skill was the
observation. The delayed-attack lesson was substantially handed over, not learned.

⭐ **The statistic needed its own control and nearly fooled me.** TV 0.49 (full) vs 0.18 (masked)
reads as "the full one understands timing" -- until you see that `patient parry`, which provably
reads the animation clock, scores only **0.22**. A high TV is not understanding: the full net's
0.49 comes from parrying 44% during a DELAY against 13% during a windup, which is exactly what
reading `v[18] = phase is DELAY` gets you with no model of time at all. Without the scripted row in
the same table I would have reported it backwards.

The honest column is *notice*: the full net commits to defence at **10.1 frames** on delayed
attacks, the masked one at **17.0**. It does not wait longer and guess -- it bails EARLIER (26% of
its windup decisions are a roll). Unable to tell a windup from a delay, it stops timing anything
and leaves. Coherent, and worth 96 wins.

⚠️ **Two things this did NOT establish.** (1) The mask drops fourteen floats, not just the two
phase flags -- move identity, reach, arc and "covering you now" go too. So 200 -> 96 is the cost of
losing all animation state and does not isolate the delay flag. A surgical `v[17..20]`-only arm is
the follow-up. (2) **The memory arm failed.** `masked x16` won zero evaluation duels at EVERY
checkpoint across 2M decisions and ended swinging 0.11 times a duel -- it learned to stand still.
Its TV of 0.35 is noise from a degenerate policy. 240 inputs against 27 on identical
hyperparameters did not train; whether memory can recover the lesson is **still unanswered** and
needs a rerun tuned for the wider input.

#### World 3 v2: the fight rebuilt (2026-09-19)

User: *"make boss more elden ring like ... boss has sweeps, aoe strong attack fast attack weak attack
and only 1/10 of a second parry window but window gets smaller if you spam parry (just like sekiro)."*

Built as a SECOND world, not a patch. v1 (`BOSS_SETUP`, hash `b126aab75e2b`) is frozen and still
backs all 44 published pages and the 200/200 net; v2 is `BOSS_SETUP_V2` + `duelSimV2.ts` +
`scripts/boss_v2_train.py`. Nothing in v1 moved -- verified after every change.

**Eight moves.** `jab` (18f total, under reaction time), `sweep` (arc 1.90 rad, no side to step
to), `eruption` (full circle to 4.2m, **unblockable by guard AND parry**), plus v1's slash, thrust,
heavy, slam, combo. Player gained a heavy attack: one hit breaks poise where the light needs two.
Ring 8m -> 11m, obs 27 -> 32 floats, actions 16 -> 17.

**The parry.** Researched rather than guessed: Sekiro's deflect is 12f at 60fps, shrinks with each
recent guard press to ~4f and to 0 if mashed, clears after ~30f or instantly on a success. Ported
to 30fps: **3-frame window (a tenth of a second), -1 per press inside 30 frames, floor 0, cleared
outright by a parry that lands.** Recovery is 16f and heat is 30f *on purpose* -- pressing again as
soon as the game allows is what wears it out. A rule punishing an input you cannot make teaches
nothing.

`parryStack` and `parryHeat` are in the observation (v[30], v[31]). Hiding them would have made the
window depend on a press 30 frames ago that a feedforward net cannot see: partially observed for no
reason.

**Measured before any GPU was spent** (`scripts/boss_v2_probe.mjs`, 200 duels each):

| player | win | parry presses | landed |
|---|---:|---:|---:|
| random | 0/200 | 517 | 2.1% |
| mash parry | 0/200 | 2763 | **1.5%** |
| patient parry | **141/200** | 872 | **63.6%** |

42x the success rate off 3.2x fewer presses; 598 of mash's presses had no window left at all.
Random and mash win nothing, patient wins 71% -- not solved by luck or by one button, but learnable.

`scripts/boss_v2_cases.py parry` isolates the threshold with a *blind* periodic presser: dead
windows go from 722 below a 30-frame gap to **exactly 0** at or above it. Not a gradient -- the rule
showing through.

**Parity:** `boss_port_check_v2.mjs` feeds the TS and the Python identical boss decisions --
**19,125 state values identical** over two recorded duels, all 18 counters, parry stack/heat/window
included. The mashing duel is recorded deliberately: it is the only thing that drives the fatigue
counter to its ceiling.

**Visuals, shared by both worlds.** `arenaScene.ts` rebuilt (two-tier colonnade, gate flanked by
colossi, banners, six braziers with embers, cold rim light) and now takes a radius, so v2's 11m ring
gets a proportionally bigger room for free. `fighters.ts` detail pass on both rigs (horns, cloak,
furnace-through-cracked-iron for the boss; great helm with breath slits, gorget, surcoat, scabbard
for the knight) and its pose functions take a `PoseRules` so ONE renderer draws both worlds. Camera
pulled back 4.1m -> 6.0m and FOV 48 -> 55, because the old framing had the room entirely off-screen.
New page `/learn/building-environments/a-harder-fight` with the playable v2 lab (779 pages, clean).

⚠️ Two measurement traps hit while checking this, both mine, both worth remembering: a second
browser tab running another WebGL arena dragged the pane to 1.2 fps and looked exactly like a
performance regression in the new scene (it is 87 fps with one tab); and rAF only pumps while the
pane is compositing, so DOM-scraped "the clock is frozen" readings during a tool call are an
artifact, not a stall.

#### It found a stunlock, and the stunlock was mine (2026-09-19)

The DQN trained against v2 for 2M decisions and won **198/200**. The question I had posed was
"does it learn to stop pressing the parry button"; the answer was a third option I had not
considered. **It never pressed it. 0.01 parry presses a duel, 0.04 rolls, guard on 0.1% of
frames** -- no defence at all, in a fight built entirely around defending.

Instead: 6.25 heavy attacks a duel, 3.17 poise breaks, **73.7% of its damage from ripostes**,
300 HP boss dead in 12.8 seconds.

Cause, one line of mine: `POISE_HIT2 = 50` against `B_POISE_MAX = 50`. One heavy broke poise
*from full, every time*, and a break is 60 frames of stagger in which every hit does 3x. Heavy ->
break -> two free ripostes -> repeat. **I tightened the defence and, in the same edit, handed the
player a heavy attack without re-checking the arithmetic where those two changes met.** Every
scripted player looked fine, because none of them was optimising.

Fix: heavy worth 36 against a pool of 70, so a break costs TWO commitments. Poise became a
constructor argument so the broken build stays reproducible -- `scripts/boss_v2_stunlock.py` runs
both side by side:

| arm | win | duel | riposte share | breaks | parries | rolls | guard |
|---|---:|---:|---:|---:|---:|---:|---:|
| exploiter, broken world | **198**/200 | 12.8s | 73.7% | 3.17 | 0.01 | 0.04 | 0.1% |
| same net, fixed world | **62**/200 | 17.1s | 40.9% | 1.48 | 0.01 | 0.43 | 0.6% |
| patient parry, broken | 136/200 | 22.1s | 81.7% | 1.28 | 4.08 | 1.26 | 0% |
| patient parry, fixed | 87/200 | 24.2s | 73.9% | 0.71 | 4.39 | 1.42 | 0% |

The control matters and is stated honestly on the page: the fixed world is harder for
**everybody** (patient 136 -> 87). What separates them is the size of the drop -- control loses
36% of its wins, exploiter loses 69%, and that 33-point gap is the part of its record that was
the stunlock rather than the policy.

⚠️ **Near-miss worth remembering.** Making poise a constructor argument used a whole-file
`str.replace`, and `BOSS_SETUP` and `BOSS_SETUP_V2` share `Duel.__init__` verbatim -- so the edit
silently moved FROZEN v1 off `b126aab75e2b` to `3b479d127a75`. Nothing complained until
`boss_regen.py --check --all` failed with `NameError: POISE_HIT2`. Restored by slicing the v1
block alone and refusing to write unless it hashed back. Edit one embedded setup by slice, never
by whole-file replace, and verify the frozen one by hash.

**RESULT: the script beats the net.** Same hyperparameters, same 2M decisions, fixed world:
**73/200** for the DQN against **87/200** for the hand-written `patient parry`. First time in
World 3 that the learned policy loses to the if-statements it was meant to beat.

It still does not parry -- **0.09 presses a duel** against the script's 4.39 -- but when it does
press it lands **64.7%**, against the script's 61.9%. It did not fail to learn the discipline; it
learned the discipline and declined to use the button. What it built instead is evasion: roll in
23% with no move out, move in 36% / roll in 25% during recovery, guard 17% on active frames. It
punishes recovery windows rather than contesting attacks.

Two readings the evidence does not separate: the parry is priced out (3 frames, 15 stamina, 16
frames of recovery if wrong) and evasion is correct; or 2M is not enough. The **curve favours the
second** -- last five evals 24, 24, 33, 38, 37, still climbing at the budget's end, where v1 was
flat by 1.3M. So the next experiment is a longer run, not a rebalance. Stating which before running
it would repeat the mistake made two sections up.

State of v2: scripted ceiling 87/200, best learned 73/200 and rising, mash-parry still 0/200. Not
a solved environment, which is the point.

⚠️ **Still owed:** the PPO arm, two more DQN seeds, the surgical `v[17..20]`-only ablation, a
retuned memory arm, a longer v2 run, and a browser eyeball of the nine World 3 pages
not yet checked.

## World 3 · Boss fight — prototype log (started 2026-09-15)

Prototype in scratchpad `bf/` (`bf.py` the duel · `players.py` the scripted duellists ·
`ladder.py` the sanity ladder · `checks.py` invariants and determinism · `train.py` DQN + PPO ·
`probe.py` behaviour probe). **Nothing is shipped yet.** Every number below was measured before any
prose was written about it, and two of the plan's own predictions have already been refuted.

**The frame is the unit.** 30 frames a second, 900 frames (30 s) on the duel clock. Both fighters are
state machines, and a move is a list of segments: `w` windup · `d` delay (a hold that looks exactly
like windup) · `h` active frames · `r` recovery. That representation *is* the design — it makes
"wait out the delayed attack" a property of a data table rather than of special-case code.

Boss moveset (windup/delay/active/recovery frames · reach · damage):
`slash` 14/–/3/16 · 2.2 · 18 — `thrust` 18/–/2/22 · 3.2 · 22 (advances 0.07 a frame) —
`heavy` 20/**8**/4/28 · 2.5 · 34 — `slam` 24/**12**/5/30 · 2.4 · 30 — `combo` 12/3 then 9/3, rec 22 · 2.1 · 14.

Player: 100 hp, 100 stamina. attack 8/2/14, reach 1.9, 12 dmg, 20 stamina · roll 18 frames with
**i-frames 3–12**, 25 stamina · **parry 22 frames with a five-frame window at frames 3–7**, 15 stamina ·
guard blocks 80% and costs 0.6 stamina per point blocked; stamina to zero is a guard break (45-frame
lockout). A parry staggers the boss for 55 frames and hits during a stagger do **3x**.

### Locked by measurement, not by taste

- **Boss 240 hp, riposte x3.0.** Sweep boss hp {200,220,240,260} x riposte {2.5,3.0,3.5}, 120 duels
  each. The outcome is a **step function, not a slope**: at 260 hp / x2.5 the flawless defensive player
  falls from 94.2% wins to **18.3%** while still never taking a single hit. Nothing about its play
  changed — it ran out of clock. 240 / x3.0 sits one notch inside that cliff.
- **One decision every 3 frames.** Sweep R in {1,2,3,4,6,8,12} (120 duels): the expert is untouched at
  R <= 3 (100% wins, 8.4–8.5 parries), dips at R=4 (95.8%) and **collapses at R=6** (21.7% wins,
  76.7% deaths, parries 8.5 -> 4.1). The parry window is five frames wide and the press has to land in
  a three-frame band, so R <= 3 guarantees a decision inside it and R=6 cannot. ⭐ **The decision rate
  is not a training-speed knob: below a threshold set by the tightest window in the moveset it deletes
  a mechanic.** R=3 costs nothing and buys a third of the decisions (300 an episode, not 900).

### ⚠️ Design bug found by the first trained agent: the boss could not catch anyone

v1's boss closed the gap only while idle and in cooldown, and at 0.055 a frame against the player's
0.090. **Walking backwards was therefore a strictly safe, strictly free refusal of the whole duel** —
and both learners found it. Held-out, after 600k decisions on v1 physics:

- **PPO, all three seeds: 0 wins, 0 deaths, boss on 240.0 of 240 hp, own hp 99.7, 0.00 swings, 0.01
  hits taken, return 0.00.** It never attacks and is never touched. Not a turtle — a refusal.
- DQN was *inconsistent across seeds on the same reward*: seed 0 fought and won **16.5%** (boss down to
  43.3, 12.58 swings, 1.31 parries), seed 1 fought and stalled (0% wins, boss 73.6, **0.00 parries**),
  seed 2 refused exactly like PPO (240.0, 0.00 swings).

⭐ The mechanism is arithmetic, not learning: player retreat 0.090 > boss close 0.055, so the gap grows
0.035 a frame until the 6.0 cap, and every boss reach is under 3.2. A sweep of boss walk speed alone
did **not** fix it (even at 0.140 the runner still took 0.21 hits a duel), because the boss also
stopped closing whenever it committed to a move it could not land, and again through every cooldown.
**The fix is two lines: it closes every frame it is not mid-move, at a run-up speed of 0.130 when
further than 2.6 and a shuffle of 0.055 once nearly in range.** Costs the experts nothing (patient
parry still 200/200 on 100 hp).

### Sanity ladder — 200 held-out duels (seeds 1000–1199), locked config, chasing boss

| player | win | die | clock | boss hp left | own hp | duel s | mean dist | parries | blocks | breaks | hits taken | swings | guard% | G |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| stand still | 0 | 200 | 0 | 240.0 | −13.6 | 11.3 | 1.46 | 0.00 | 0.00 | 0.00 | 4.56 | 0.00 | 0.0 | −41.36 |
| random buttons | 0 | 200 | 0 | 216.1 | −13.6 | 15.2 | 1.54 | 0.26 | 0.28 | 0.18 | 4.65 | 2.91 | 5.6 | −38.97 |
| mash attack | 0 | 200 | 0 | 145.6 | −13.6 | 11.2 | 1.34 | 0.00 | 0.00 | 0.00 | 4.55 | 8.79 | 0.0 | −31.91 |
| **run away** | 0 | 4 | **196** | 240.0 | 66.0 | 29.9 | 4.12 | 0.00 | 0.00 | 0.00 | 1.54 | **0.00** | 0.0 | **−4.00** |
| **roll away** | 0 | 0 | **200** | 240.0 | 72.3 | 30.0 | 4.08 | 0.00 | 0.00 | 0.00 | 1.26 | **0.00** | 0.0 | **−2.77** |
| hold guard | 0 | 0 | 200 | 240.0 | 43.4 | 30.0 | 1.33 | 0.00 | 10.93 | 3.46 | 0.23 | 0.00 | 84.3 | −5.66 |
| block, punish | 0 | 4 | 196 | 190.6 | 37.6 | 29.9 | 1.28 | 0.00 | 10.45 | 6.64 | 0.69 | 4.12 | 55.7 | −1.90 |
| roll, punish | 0 | 0 | 200 | 144.7 | 73.6 | 30.0 | 2.32 | 0.00 | 0.00 | 0.00 | 1.61 | 7.97 | 0.0 | +6.89 |
| parry oracle | 184 | 16 | 0 | −4.4 | 39.5 | 20.0 | 1.48 | 4.71 | 0.00 | 0.00 | 3.03 | 9.62 | 0.0 | +43.58 |
| **patient parry** | **200** | **0** | **0** | −12.0 | **100.0** | 22.8 | 1.57 | 8.51 | 0.00 | 0.00 | **0.00** | 7.00 | 0.0 | **+55.20** |


⚠️ **Reproducibility fix (2026-09-15):** the shipped `random_buttons` policy originally held one shared
generator, so the row moved depending on how many duels had already been flown in the session
(G −38.97 on the first call, −38.91 on the second). It now re-seeds from the duel's own seed at frame 0
and is identical on repeated calls. Same family of bug as World 2's `fly()`-in-a-comprehension.
A baseline row that moves when you run it twice is not a baseline.

⭐ **Solvability is settled with room to spare: the patient parry expert wins 200 of 200 and finishes
every duel on full health, never once taking a hit.** It reads the boss's animation clock, presses
parry when the next active frame is five away, and swings only while the boss is staggered *and* there
is time for the whole swing to land before the stagger ends.

⭐ **The two experts differ by one line, and that line is greed.** `parry oracle` also punishes during
recovery; it wins 184 and **dies 16 times**. Every one of those deaths is a swing still in its recovery
frames when the boss moved again.

⭐ **The ladder must contain the agent that refuses the task.** World 1 learned this the hard way when
its boat sailed off the course; here the first version of the ladder had no "run away" row, so the
env's worst bug was invisible until a trained agent found it. Refusal is now a standing ladder row.

### The clock: truncation or defeat? (and the cost of fixing it)

Even with the chasing boss, refusal still pays under a neutral clock: `roll away` scores **−2.77**
against `mash attack`'s −31.91. Switching the clock from a truncation to a **defeat** (you failed to
finish the duel) removes the profit — and the same 200 duels then say:

| | stand still | random | mash attack | run away | roll away | hold guard | block, punish | roll, punish |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| clock = truncation | −41.36 | −38.97 | −31.91 | −4.00 | −2.77 | −5.66 | −1.90 | **+6.89** |
| clock = defeat | −41.36 | −38.97 | −31.91 | −33.40 | −32.77 | −35.66 | −31.30 | −23.11 |

⚠️ ⭐ **Removing the refusal's profit also flattens the reward's ability to rank the losers.** Under
`defeat`, `mash attack` — which dies in 11 seconds having dealt 94 damage — outscores `hold guard`,
which survives all 30 seconds barely touched (−31.91 vs −35.66), and every non-winning policy is
squeezed into the band −23 to −41. Under `truncate` the same policies spread across 48 points and
rank sensibly. This is World 1's terminated-vs-truncated question asked again, with the opposite
textbook answer, and it is a decision record, not a bug.

### Invariants and determinism

`checks.py`: 40 duels of uniformly random buttons, every frame checked — distance inside [0.6, 6.0],
stamina inside [0, 100], neither fighter's hp ever increases, no boss frame past the end of its move,
no staggered boss with a move still out: **all pass**. Same seed plus same buttons is bit-identical;
a different seed differs. Branch coverage under random play across those 40 duels: 14 parries, 8
i-frame dodges, 11 blocks, 9 guard breaks, 198 clean hits, 15 whiffs, 40 deaths — **0 wins and 0 duels
reaching the clock**, so those two endings are reachable only by a scripted player. (Same lesson as
World 2's `truncated`: a test only checks the endings it actually reaches.)

### DQN vs PPO on the fixed physics — 600k decisions, 3 seeds, both clock rules

Held out: the same 200 duels (seeds 1000-1199), each arm scored under its own clock rule.
Boss health left out of 240; a crew that never swings leaves 240.0.

| | wins | boss hp left | swings | parries |
|---|---|---|---|---|
| DQN, clock = truncation | 0 / **19.0** / 6.5 % | 68.6 / 41.2 / 46.5 | 14.62 / 13.77 / 14.97 | 0.00 / 1.08 / 0.57 |
| PPO, clock = truncation | 0 / 0 / 0 % | **240.0 / 240.0 / 240.0** | **0.00 / 0.00 / 0.00** | 0.00 |
| DQN, clock = defeat | **16.0** / 0 / 0 % | 71.7 / 98.5 / 64.9 | 7.40 / 11.91 / 14.64 | 2.08 / 0.00 / 0.01 |
| PPO, clock = defeat | 0 / 0 / 0 % | 240.0 / 160.8 / 142.5 | 0.00 / 6.60 / 9.31 | 0.00 |

⭐ **At this budget the verdict does not overlap: DQN engages on every seed, PPO on none of them
under a neutral clock.** Unlike World 2's race, where the seeds overlapped and only reliability could
be claimed, here the boss-health column is separated by the whole bar.

⭐⭐ **PPO's local optimum is a one-line rule, digit for digit — twice.** A behaviour probe (all twelve
nets evaluated under one common neutral clock) shows seeds 1 and 2 pressing **guard on 100% of their
decisions**, and every column then equals the scripted `hold guard` row exactly: own hp 43.4, boss
240.0, guard 84.3% of frames, 10.93 blocks, 0.23 hits taken. This is World 2's flat-pilot result
(`lambda env: 5 if env.t == 0 else 0`) happening again in a completely different world.

⭐ **Seed 0 found the other refusal and would not let go of it.** Its buttons are 93% "walk backwards",
7% guard: mean distance 4.00, **68.9% of frames beyond every boss's reach**, 0.00 swings, 0.00 hits.
Switching the clock to a defeat — which scores that policy -30 on every single duel — left it
**unchanged** (93.0 hp, 0.00 swings). Once the policy never engages, every outcome is equally bad and
there is no gradient left to climb, which is exactly the flattening the scripted ladder predicted.

### ⭐⭐ The 600k verdict was a BUDGET artefact, not a ceiling

One DQN run at **3M decisions** (seed 1, neutral clock, 19.9 min on a 1660 Ti), held out over the
same 200 duels:

**100.0% wins · 0% deaths · boss hp -12.8 · own hp 87.1 · 4.16 parries · 0.56 hits taken · guard 0.7%**

It matches the hand-written expert's win rate (200/200) while taking a little damage the expert never
takes (87.1 hp against 100.0) and parrying about half as often (4.16 against 8.51) -- it wins some of
its openings by trading rather than by reading. **The skill this world was built around is learnable,
and it appears about four times later than the local optima do.** Training-curve wins: 23.5% at 1.10M,
76.0% at 1.35M, 86.5% at 1.45M, then a **dip to 19.5% at 2.10M** and a recovery to 89.0% at 2.40M --
so the run is not monotone and a single end-of-run number would misreport it in either direction.

⚠️ Everything above is ONE long run. Whether all three seeds reach the ceiling, and whether PPO does
at the same budget, is UNMEASURED.

### Throughput

64k-83k frames a second on one core (three repeats, measured while a training run was using the
machine, so the true figure is at the top of that range or above).

### Still open after this session

- Chip damage on a block is 20%; measured with scripted players (`boss_cases.py chip`), untested on a
  learner.
- Batching for the "thousands of duels at once" page is not written. The prototype steps one duel at a
  time and that was fast enough to defer it.
- Whether all three DQN seeds reach the ceiling at 3M decisions, and whether PPO does.
- The plan predicted **turtling** as this world's reward hack. Both turtling and outright **refusal**
  were measured, and refusal came first and was the harder of the two to remove.

### Build status

`BOSS_SETUP` shipped in `src/lib/runtimeSetup.ts` (the frame-by-frame `Duel`, the moveset table, the
nine scripted duellists, `duel` / `score` / `ladder`, and `moveset()` which draws each attack as the
frames it occupies). `scripts/boss_cases.py` extracts it back out of the TypeScript and reproduces
every number above: `check` · `ladder` · `balance` · `rate` · `chase` · `clock` · `dial` · `chip` ·
`moveset` · `export`.

**Page 1 of World 3 SHIPPED 2026-09-15: `the-duel-brief` ("The brief: thirty seconds, one boss").**
New `src/components/boss/DuelReplay.tsx` (frame-by-frame replay of recorded duels, with the boss's
last three seconds of animation drawn as a strip) and `data/briefDuels.ts` (three duels on seed 1002,
written by `boss_cases.py export`). Both runnable cells browser-verified by **exact string equality**
in Pyodide; tsc clean; 763 pages house-rule clean.

⚠️ The outline in this plan gave World 3 thirteen pages and no brief, which Worlds 1 and 2 both have.
A brief page was added, so World 3 is fourteen pages and the track is 41.

## 2026-09-19 — the 200 ms parry, and the blocks nothing was checking

The v2 deflect window went from 3 frames to 6. Sekiro's is twelve frames at sixty a second; what
ports across is the **duration** (200 ms), not the frame count, and 200 ms at thirty a second is
six. The original 3 was a mis-port that had been described on the page as faithful. `PARRY_STEP`
went to 2 with it, so the ladder is 6 -> 4 -> 2 -> 0 and three hasty presses still spend it.

**v1 is untouched, and provably so.** It is a different file (`duelSim.ts`), a different setup
block (`BOSS_SETUP`, still sha1 `b126aab75e2b`, 641 lines), and it does not contain the identifiers
that changed at all -- v1 spells its window `PAR_I0 = 3` / `PAR_I1 = 7`, and `PARRY_WIN`/
`PARRY_STEP` do not exist in it. `boss_policy_check.mjs` still reports 200/200 and
`boss_port_check.mjs` still reports all 15 counters identical. No v1 number moved.

What the widening did invalidate was a cluster of numbers on `a-harder-fight` that **nothing was
re-deriving**. Three of its blocks are `CodeOutput source="scripts/..."` -- pasted stdout rather
than runnable cells -- and `boss_regen.py` only knew how to pair a `codeX` with an `outX`, while
`check-pages.js` only verifies attached blocks. So they kept quoting a 3-frame window, and prose
had been written off the stale figures: a "722 dead windows" that contradicted its own table's 832,
and a "63.6%" that appeared nowhere on the page at all.

### Three bugs found while fixing it

1. **`boss_v2_stunlock.py` was contaminated across worlds.** It pins the superseded build by
   loading `scripts/archive/boss_v2_build1.py` (self-contained, `PARRY_WIN = 3`, `N_OBS = 32`) and
   runs the archived nets against it -- but it took its scripted CONTROL from the *live* trainer,
   so a current policy with current helpers was driving a frozen world. Widening the live window
   walked a number published as history from 136/200 to 118/200 without anyone touching the build
   it describes. The control now comes from the archive too, and the published 136 -> 87 / 36% /
   33-point figures reproduce exactly. A control that moves when the thing it controls for does
   not is not a control.
2. **`boss_v2_cases.py` printed a literal `land%%`** -- a `%%` in a plain `print` with no
   formatting applied.
3. **`thousands-of-duels-at-once` quoted a throughput range it had outgrown.** Four fresh runs span
   115,514-121,212 frames/s; the page said 108,000-117,000 (36,000-39,000 decisions/s). Widened to
   108,000-121,000 / 36,000-40,000, which covers every sample ever recorded for it.

### The reproducibility guard now covers standalone blocks

`boss_regen.py` grew a `STANDALONE` registry: an `outX` can name a **command**, and `--check`
re-runs it and diffs. Registered: a-harder-fight's `outProbe`/`outParry`/`outStun`, and
reading-a-policy's `outProbe`/`outButtons` (those two carry an echoed `$ ...` line, supported via
`echo`). reading-a-policy's two reproduced **byte-identically on the first run** -- that page was
already correct.

Coverage: **45 of 76 output blocks in the track are now machine-verified, up from 43.**

### Blocks still checked by hand, and why

A block is registerable only if it is a command's WHOLE stdout. These are not:

- **Hand-trimmed excerpts** -- `a-moveset/outFreq` (5 lines of `states`' 30), `frames-hitboxes/
  outArc` (5 of `arc`'s 8), `reading-a-policy/outSpread` (19 of `boss_qspread_v2.mjs`' 28).
  Re-running them verifies nothing unless the splicer learns to match a sub-range; registering
  them as-is would overwrite the excerpt with the full run.
- **A noisy benchmark** -- `thousands-of-duels/outSpeed` reads a few per cent different every run,
  so it would cry wolf on every check. Its prose quotes a range on purpose.
- **The remaining 28**, which need trained nets, a GPU, or long runs (`boss_train.py` x7,
  `wildfire_train.py` x5, `boss_cases.py` x16 at ~5.5 min total). The 16 `boss_cases.py` ones were
  re-derived by hand this session: **13 reproduce byte-identically and the other 3 are the excerpt
  and benchmark cases above**, so v1's published numbers are confirmed intact.

Verified green after all of it: tsc · `check-pages.js` (781 pages) · `boss_regen.py --check --all`
(18 pages) · `boss_port_check.mjs` · `boss_policy_check.mjs` (200/200) · `boss_port_check_v2.mjs` ·
`boss_policy_check_v2.mjs` · both world hashes (`b126aab75e2b` / `fd3243469b99`).
