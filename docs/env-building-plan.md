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
5 of 7:** baselines · the-crew-that-learned-nothing · pilot-or-commander · reward-is-a-values-decision ·
the-cobra-effect (built OUT OF ORDER — it is p6 in the sidebar). **Track: 26 of 40 pages.** Next: chapter 5 page 5,
"Training the crew: DQN vs PPO" — ⚠️ this is the page that must SHIP `scripts/wildfire_train.py` (it is already named in
`wildfire_cases.py`'s docstring and does not exist), and it needs real training runs on the user's PC against the
commander interface at K=4. When it ships, rewire the chain: reward-is-a-values-decision → training → the-cobra-effect
(today those two link directly to each other). Then chapter 5 page 7, "What the crew learned".

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
