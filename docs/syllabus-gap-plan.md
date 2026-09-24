# Syllabus gap closure — plan

Audit run 2026-09-19 against the GATE DA syllabus, **sections 1 (Probability & Statistics), 2
(Linear Algebra), 3 (Calculus & Optimization) and 6 (Machine Learning)**. Sections 4
(Programming/DSA), 5 (DBMS & Warehousing) and 7 (AI: search, logic, PGMs) are **deliberately out
of scope** — user excluded them on 2026-09-19.

This doc is the authority for the gap-closure work. It records what was measured, not what was
assumed: every "missing" below is a grep over `src/app/**/page.tsx`, and the distinction between
*absent*, *incidental* and *taught elsewhere* is kept, because the three need different fixes.

---

## How the audit was done

`grep -rli` over every `page.tsx`, then a second pass to check whether a hit was a real treatment
or an incidental mention. Raw counts mislead badly here — `mode` matches "model" 619 times,
`permutation` matches "permutation importance" — so every hit below was opened and read.

---

## The gaps, ordered by priority

### P1 · Support vector machines (classification) — **the single largest hole**

`maximum margin` returns **zero hits sitewide**. The site has a 20-page *Support Vector
Regression* track that teaches the primal, the dual, the kernel trick, slack, SMO and KKT — all of
it aimed at regression. The classifier, which is the canonical form of the idea, is never taught.
`siteMap.ts` already carries a href-less "Support Vector Machines" slot under Classification.

Because SVR exists, this track must **not** re-teach duality from scratch in a way that
contradicts it; it cross-links, and it owns the classification-specific material (functional vs
geometric margin, hinge loss, the margin–generalisation argument, multi-class).

Target: ~20 pages, accent `--c-classification`, `src/lib/svmTrack.ts`.

**Build status — started 2026-09-19.** Scaffolding + page 1 of 20 live at
`/learn/support-vector-machines`; track lib, layout, `searchIndex.ts` and `siteMap.ts` (marked
`partial`) all wired. Page 1 ships the flagship **MarginLab**: drag the data, watch the widest
corridor and its support vectors move.

Measurement came first, and two of its results changed the page:

- The track's central claim was run as a 200-draw experiment rather than asserted. Max-margin beats
  a perceptron on **30 draws, loses on 3, ties on 152**, mean gain **+0.0056**. So the margin
  argument holds but is *small* on easy data, and page 1 says exactly that instead of overselling
  it — the honest reason to care is sparsity and kernels, not the half-point.
- The head-to-head found **SVM is not automatically best**: logistic regression edges it on
  breast_cancer (0.9789 vs 0.9771), all three tie on wine, and SVC only wins clearly on digits.

Three guards now hold the lab to what it claims:

| script | what it proves |
|---|---|
| `svm_cases.py solver` | Pegasos lands on sklearn's QP boundary (worst **0.023 deg**) |
| `svm_solver_check.mjs` | the shipped TypeScript is a faithful port (worst **6.8e-10**) |
| `svm_sv_tolerance.mjs` | no state on the C dial rings **zero** support vectors |

That last guard exists because it caught a real bug. The textbook support-vector test `z <= 1` is
right for a QP and wrong for an iterative solver: Pegasos approaches from outside, so the closest
points settle just above 1 and the lab ringed **nothing** at high C — a boundary held up by no
points, the exact opposite of the lesson. Fixed by measuring where the points actually land
(`SV_TOL = 1e-2`) and raising iterations to 20000, which `svm_solver_bench.mjs` shows costs 0.74 ms
a solve. The first fix was itself incomplete — it was measured over C ≤ 10 while the slider
goes to 100 — so the guard now tests the shipped range and the shipped iteration count.

**Page 2 of 20 — 2026-09-20.** *Functional & geometric margin*, at
`/learn/support-vector-machines/functional-and-geometric-margin`. Four new measured sections in
`svm_cases.py` (`rescale`, `distance`, `ranking`, `canonical`) and a new lab,
**ScaleInvarianceLab**, whose whole point is a non-event: the dial swings `w`, `b` and the
functional margin over three decades while the line, the corridor and the measured distance do not
move at all.

Two things worth carrying forward from it:

- **The geometric margin is verified as a distance, not assumed to be one.** Checking
  `|w.x+b|/||w||` against the projection formula is circular, so `distance` parameterises the line
  and ternary-searches it for the genuinely nearest point. Agreement to **every printed digit**.
- **The functional margin is shown ranking boundaries backwards**, which is what makes the
  distinction more than notation: on **165 of 185** separable draws it prefers the perceptron's
  boundary, and on all 185 of them the max-margin boundary has the wider geometric margin.

A fourth guard, **`scripts/svm_regen.py`**, now covers this track's pasted `CodeOutput` blocks —
the same blind spot `boss_regen.py` closed for the boss track. It re-runs each section and diffs
it against the page. It earned itself on the first run by flagging page 1's block, and the
registry is the place to add every future SVM block. (That first flag was trailing whitespace, not
a wrong number — fixed at the source, and the tool now trims so it cannot cry wolf about padding
again.)

**Page 3 of 20 — 2026-09-20.** *The maximum-margin hyperplane*, at
`/learn/support-vector-machines/the-maximum-margin-hyperplane`. Three more measured sections
(`minnorm`, `squared`, `tight`), a new lab **MinNormLab**, and a fifth guard,
`scripts/svm_minnorm_check.mjs`.

- **The `max 1/‖w‖` ⟺ `min ‖w‖` equivalence is measured, not asserted.** Every direction gives at
  most one canonical boundary, so the whole space of separating hyperplanes is swept with one
  angle: over all **2,083** separating directions, `margin × ‖w‖` reads **1.000000000000** at both
  its minimum and its maximum.
- **The squared objective claims only what the run supports.** Eight solves from four starts all
  land on `‖w‖ = 0.609794`, so the substitution is exact — but iteration counts are 4–6 either
  way, so the page explicitly says the common "it converges faster" claim gets **no support
  here**, and gives the structural reason (a QP with a usable dual) instead.
- `tight` shows **3 of 40** constraints active at the optimum, which sets up chapter 3 without
  stealing it.

Three things this page cost, worth remembering:

1. **The shared fixture had the wrong tolerance for these questions.** `_demo_fit()` uses
   sklearn's default `tol=1e-3`, which page 2 *wants* (its `canonical` section is about that gap).
   On page 3 the same slack made the QP appear to beat an exhaustive sweep and printed
   "constraints sitting at 1" as `0.9996`. Page 3 uses `_demo_fit_tight()` instead; page 2's
   published numbers are untouched.
2. **The lab shipped opening blank.** `MinNormLab`'s default angle was copied from the Python
   dataset's optimum (195°), which does not separate the *lab's* 14 points — so it opened on "no
   boundary" with four dashes. The opening angle is now derived from the sweep, so it cannot
   open blank whatever the points become.
3. **A guard limit chosen without measuring the spread.** `svm_minnorm_check.mjs` first failed at
   `7.79e-8` on an absolute tolerance — but `‖w‖ = 2/gap` spans **0.61 to 484.5** across the
   sweep, and that worst case was a relative error of `1.6e-10` with nothing wrong. Now relative.
   Same lesson as the encode-against-the-measured-spread rule.

**Page 4 of 20 — 2026-09-20.** *Does a wider margin actually help?*, at
`/learn/support-vector-machines/does-a-wider-margin-help`, closing chapter 1. Four measured
sections (`size`, `band`, `where`, `onepoint`), the **MarginVsTruthLab**, and a sixth guard,
`scripts/svm_truthlab_check.mjs`.

The experiments run on data generated from a **known** boundary with a clear band around it, so
there is an exact truth to measure against — and so no non-separable draw is ever handed to
`SVC(C=1e6)`, which has no iteration cap and ran for over six minutes before the first version
was killed.

- **The advantage grows with n**, which is the opposite of the intuitive guess: +0.021 at n=6 to
  +0.043 at n=160, and 110/82 wins to **198/1**. The angle-to-truth columns say why — the
  max-margin boundary converges (14.16° → **0.71°**) while the perceptron **stalls near 6°**,
  because it stops at the first separator and more data just gives it more places to stop.
- **The perceptron gets worse as the problem gets easier**: widening the band takes it from 0.9702
  to 0.8997. More room means more zero-error separators, so its arbitrary pick is a worse pick.

**The finding that required throwing away the planned story.** The page was going to say page 1's
`+0.0056` was small because its blobs had little room between the classes. Measuring the
corridor-to-spread ratio killed that: page 1's blobs read **0.433**, the *wide* end of the dial
(band 1.8 ≈ 0.455), not the narrow end. The real cause is the **test distribution** — `where`
holds the models fixed and only changes where test points come from:

| band | test points | gain |
|---|---|---|
| 0.60 | with the same clear band | +0.0083 |
| 0.60 | uniformly, boundary included | +0.0416 |
| 1.80 | with the same clear band | +0.0020 |
| 1.80 | uniformly, boundary included | +0.0901 |

Two separators that fit the training data perfectly differ **only** near the strip between the
classes, so a test set drawn the way the training set was never asks about the one region where
they disagree, and reports a tie. Page 1 drew its test data from the same two clusters. Its number
is true of that setup and is not a general statement about margins. Worth generalising past this
track: a tie in an evaluation is a claim about the evaluation.

Two smaller things:

1. **`_demo_fit()` vs a fresh generator.** Page 4 needed ground truth, which the blob fixtures
   cannot give, so it has its own generator rather than bending the shared one.
2. **The lab's insight text overclaimed.** It said the max-margin line "has nowhere to go";
   browser testing hit a draw where it was 26.4° off against the perceptron's 2.7°. Measured
   properly: mean error 3.83°, and it is the closer line on ~78% of samples — so the text now says
   four in five and tells the reader to judge over several samples. `svm_truthlab_check.mjs` locks
   the effect in (advantage **1.34° → 12.98°** as the band widens) so a change to the sampler or
   the perceptron cannot quietly flatten it.

**Page 5 of 20 — 2026-09-21.** *Room to be wrong* (Soft margin: slack & C), at
`/learn/support-vector-machines/soft-margin-slack-and-c`, opening chapter 2. Three measured
sections (`rescue`, `slack`, `dial`), the **SoftMarginLab**, and a seventh guard,
`scripts/svm_softlab_check.mjs`. The pre-existing `soft` section stays unpublished — it sweeps C
on `make_moons` with no ground truth, which cannot answer the question the page asks.

Page 4 ended on a cliff (one point walked across the boundary, margin 1.44 → 0.05, then no
feasible hyperplane at all), so page 5 opens by rerunning exactly that walk with slack allowed.

- **`rescue` is the continuity argument.** On clean data hard and soft are indistinguishable —
  **0.9780** vs **0.9778** over 100 draws, so allowing slack costs nothing when none is needed.
  One point across and the hard margin loses ~**9 points** of accuracy to the soft margin's
  **1**. Past 200% displacement **0 of 100 draws** are feasible — the hard problem is
  *answerless*, not inaccurate — while the soft margin still returns 0.968 and a **wider**
  corridor than it started with. The `draws` column is printed because the hard-margin average at
  200% covers only the 2 draws that survived.
- **`slack` makes ξ concrete.** Four cases, and ξ > 1 ⟺ misclassified is exact in the data
  (20 and 20). Hence Σξ upper-bounds the training error count — **0 of 300** draws violated it,
  smallest slack-minus-errors **7.36** — and it is loose by **2.37×** because points inside the
  corridor pay too. One detail worth keeping: **44** points carry slack but there are **45**
  support vectors. The extra is a point at functional margin 1.000206, resting *on* the margin
  with ξ = 0. Support vectors = slack-carriers **plus** margin-touchers, which the dual chapter
  needs.
- **`dial` catches overfitting in the act.** Two Gaussians with a known truth, 60 draws per row.
  At 2σ separation, from C = 0.01 up, train accuracy climbs every step (0.9765 → **0.9812**) while
  test falls every step (0.9746 → **0.9706**). The angle-to-truth column is the more sensitive
  instrument: **3.42° → ~9.3°**, where it flattens — a six-degree swing that cost four thousandths
  of accuracy.
  - **The bottom of the dial fails differently:** at C = 0.001 the corridor is 11.8 wide, wider
    than the data, and **59 of 60** fits predict a single class for everything. Given permission
    to ignore everything, it does.
  - **At 1σ separation C barely matters** (test 0.8257 → 0.8333 across five decades, Bayes
    0.8413). Worth knowing before page 12 teaches tuning: sometimes the search is over nothing.
- **Soft margin contains hard margin.** On separable data every C from **1** upward reproduces
  the hard-margin boundary to four decimals and **0.0000°**, with Σξ ~1e-8. C did not have to
  approach infinity — the hard margin is one end of a dial, not a separate method.

Three things went wrong and are worth not repeating:

1. **Every threshold in the new guard was a guess and three of them fired on correct behaviour.**
   Σξ legitimately plateaus once the fit stops buying slack; "more than half the points pay" was
   read off the overlapping case and is false when the clouds are far apart; and `wrong === 0` at
   separation 3.0 is simply untrue — the tails still cross on about one sample in ten. Rewrote all
   three as ratios across the dial, measured first. Same lesson as `svm_minnorm_check`: an
   absolute 1e-6 tolerance then flagged a 0.0850 → 0.0855 step as a reversal, so that one is
   relative (5%) too, since the real drops are multiples.
2. **The lab shipped with a hydration mismatch.** Box-Muller uses `Math.log`/`Math.cos`, which the
   spec does not require to be correctly rounded, so Node's V8 and the browser's disagreed in the
   last bits and 20000 Pegasos iterations carried it into SVG attributes
   (`y1="-9.678312647625262"` vs `...319`). Every coordinate now goes through a 3-decimal round on
   the way to the DOM. Page 4's lab is unaffected — its sampler's coordinates are bit-exact,
   because only the truth direction touches trig. **Any future lab that samples with transcendental
   functions has this bug latent.**
3. **The caption ran off the canvas** at narrow widths as one line; it is two now, in a dedicated
   strip below the plot area (`PLOT` vs `H`) rather than overlapping the points.

Bash heredocs remain unusable in this environment — an apostrophe inside a quoted heredoc still
breaks parsing — so the three sections went in via a patch script. The page's pasted blocks were
**generated from the real stdout** rather than typed, and `svm_regen --check` passed on all 15
blocks first try.

**Page 6 of 20 — 2026-09-21.** *The price list* (The hinge loss), at
`/learn/support-vector-machines/the-hinge-loss`. Three measured sections (`unconstrained`,
`surrogate`, `descend`), the **HingeLossLab**, and an eighth guard,
`scripts/svm_hingelab_check.mjs`. The old `losses` section stays unpublished — it puts hinge and
logistic in one table, which is page 7's comparison, not this page's.

- **`unconstrained` verifies the elimination instead of asserting it.** The same problem solved
  three ways at each C — sklearn's dual (never forms a ξ), the constrained primal with all 60
  slack variables genuinely optimised under 2n constraints, and the unconstrained form over three
  numbers — agrees to six figures on the objective and **0.0000°** on the boundary. And the
  constrained solver, free to set any ξ it liked, put all 60 on max(0, 1 − y f(x)) to
  **2.4e-14**. So the SVM is a penalised loss of ridge's exact shape, with **1/C** sitting where
  ridge's α sits.
- **`surrogate` is the page's real finding, and the first half is unflattering.** Minimising the
  hinge leaves **2.10** more training mistakes than necessary and hits the true 0-1 optimum in
  **2 draws of 30**. Then the test column: the boundary with the FEWEST training mistakes is the
  WORST out of sample — **0.1800** against pure hinge's **0.1664**, Bayes floor 0.1587. The
  surrogate is not a compromise forced by arithmetic; it produces better classifiers than the
  exact answer to the stated question, because 0-1 cannot tell a point that just crossed from one
  that is nowhere near and will swing the boundary a long way to save one mistake.
- **`descend` kills the obvious objection.** Over a full turn, the mistake count does not move on
  **92.5%** of steps — zero gradient, nothing to follow — and where it moves it jumps, up to
  **3 errors at once**. The hinge changes on **every** step. The two minima sit **18.5°** apart,
  which is the surrogate gap seen as an angle. Brute force is also only possible here because the
  data is 2-D: candidates grow one per PAIR (**4.11x, 4.05x, 4.03x** per doubling of n), and with
  d features the exponent becomes the number of columns.

**HingeLossLab** rotates one boundary and plots both totals underneath: a pink staircase against
a blue ramp. Live check in the browser — across 100°→108° the mistake count sat pinned at 17
while the hinge moved every single step (37.76 → 40.11), and the two buttons land 38.5° apart on
the default sample (13 mistakes / hinge 38.03 vs 16 mistakes / hinge 34.82). The guard holds all
three claims over 60 samples: 85.0% flat, hinge flat 0.0%, minima 13.52° apart on average and
coinciding in only 1 of 60.

Three things worth not repeating:

1. **The first `descend` draft printed wall-clock seconds**, which would have made
   `svm_regen --check` fail on every run — a published block is compared against a rerun of
   itself, so nothing non-deterministic can go in one. Replaced with the candidate count and its
   growth ratio, which is the actual point anyway. Both sections were then diffed across two
   runs to confirm byte-identical output before publishing.
2. **Guard thresholds were measured first this time**, after page 5's three false failures — and
   still needed the 0-1 flatness bound set from the observed 85% rather than the script's 92.5%,
   because the lab's sampler is the browser RNG on a different sample size.
3. **The prose shipped the word "honest"** in "the honest accounting" — exactly the
   self-congratulatory framing the user ruled out on 2026-09-20. Caught by a DOM scan of the
   rendered lesson body, now rewritten, and all six SVM pages re-scanned clean for that whole
   family of phrasing (honest / to be fair / house rule / check script / tolerance of).

**Page 7 of 20 — 2026-09-21.** *Who still gets a vote* (Hinge vs log loss, and where sparsity
comes from), at `/learn/support-vector-machines/hinge-vs-log-loss-and-sparsity`, closing
chapter 2. Publishes the two scaffolding sections that had been sitting unused since the track
was planned — `losses` and `sparsity` — plus one new section `pull` that connects them, the
**SparsityLab**, and two more guards (`svm_logistic_check.mjs`, `svm_sparsitylab_check.mjs`),
taking the track to eight.

The spine: the hinge's derivative is *exactly* zero past the margin and log loss's never is, and
everything else follows from that one fact.

- **`pull` is the connective measurement.** Per point the difference looks trivial — a point at
  z = 20 pulls with **2e-09**. In aggregate it is not: across 20 datasets, **55.25%** of the
  total force shaping a logistic boundary comes from points it already classifies correctly and
  confidently (87.3% of the data). For the hinge the same figure is **0.0000%**, not rounded.
- **Then each model gives up the points it says it does not need.** The SVM has a set with a
  name; log loss has none, so it surrenders the same *count* of its most comfortable points.
  SVM moves **0.0052°** mean / **0.0323°** worst, **20/20** datasets under 0.05°. Log loss moves
  **24.84°** mean / **73.97°** worst, **0/20** under 0.05°.
- **`sparsity` is the payoff:** delete 157 of 280 training points, refit, weights agree to
  **2.4e-05** and test predictions are identical.
- **The caveat is published, not buried.** Support vectors ranged from **1% to 92%** of the data
  across those same 20 datasets. Sparsity is a property of the fit; page 5's C dial is the same
  dial here (it moved #SV from 91.8 to 6.2).
- **Closes by naming what the hinge gives up**: log loss keeps every point, which is what lets it
  calibrate P(y=1|x); the hinge multiplies exactly those points by zero. Sets up page 18
  (probabilities) and chapter 3, where #SV becomes the literal size and speed of a kernel model.

**SparsityLab** draws a halo per point sized by |dL/dz|, with a hinge/log-loss toggle. Verified
live: **27 halos** under the hinge (83 of 110 points bare, share of pull 0%) against **110
halos** under log loss (0 points at zero, share 26.1%). It needed a real logistic fit in
TypeScript, so `logisticFit` was added to svmSolver.ts and held to sklearn by a recorded-case
check — worst **8.5e-7°** and **2.6e-9** relative on ‖w‖.

Three process notes:

1. **My measurement was wrong, not the claim.** Identifying support vectors by `z <= 1 + 1e-9`
   instead of sklearn's `support_` made the sparsity result look like it failed — mean 15.8° of
   movement, 74° worst. Cause: at the default tolerance the points resting ON the margin land
   just *above* 1 (measured 1.0000356 to 1.00053815), so the threshold silently deleted real
   support vectors; on a fit resting on 3 points, losing one swings it 6°. Same tolerance fact
   page 3 hit from the other side. **Use `support_`, never a z threshold.**
2. **An averaged sweep over a fixed keep-fraction was the wrong design** and hid this: the SV
   share varies 1%–92% by seed, so "keep 85%" deletes support vectors on some seeds and not
   others. The per-seed principled set is the only comparison that means anything.
3. **Guard limits were set from measurement, then tightened.** The logistic check first shipped
   0.5° / 5% limits that the port beat by six orders of magnitude and would have caught nothing;
   now 1e-3° / 1e-6, about a thousand times above the observed noise.

**Page 8 of 20 — 2026-09-21.** *A problem with a name* (The primal problem), at
`/learn/support-vector-machines/the-primal-problem`, **opening chapter 3, "The mechanics"
(tier 3)**. Four new measured sections (`primal`, `convex`, `flat`, `shape`), the
**ConvexBowlLab**, and a ninth guard (`svm_primallab_check.mjs`). `svmSolver.ts` gains
`profileHinge`, `primalJ`, `profileWrong`, `primalGrad` and `descendPrimal`.

The spine: the problem pages 1-7 built is a convex quadratic program, and saying so costs nothing
and buys three things — a stock solver, one answer from any start, and a size known in advance.
Nothing on this page moves the boundary; pages 1 to 7 already specified it completely.

- **`primal` puts the SVM in standard form and hands the arrays to solvers that have never heard
  of a margin.** Page 6 had already given scipy this problem, but with the constraints written as
  functions closing over the data; here it is four numeric arrays and nothing else. SLSQP and
  trust-constr both land on sklearn's boundary, **worst 8.51e-05 degrees** over six solves. The
  printed 7x7 `P` makes the asymmetry visible: two nonzero entries, both `w`'s, so nothing
  penalises `b` at all.
- **`convex` tests convexity instead of quoting it.** 50,000 random feasible pairs, **0** midpoint
  violations of either the objective or the feasible set. 60 starts spanning **3.2 to 2353.2** in
  objective all finish at the same value to **ten figures** and the same direction to **2.59e-05
  degrees**. Against the same 60 starts, minimising the mistake count returns **17 distinct
  answers**, 0 to 40 errors, with only 21 reaching the best found.
- **`flat` is the page's best material and it was not planned.** It came from an anomaly: at C = 1
  the restarts agreed on `w` and disagreed on `b` in the second decimal. The optimal offset is a
  genuine **interval 0.016885 wide**, every point of which achieves the identical objective, and
  sklearn returns its midpoint to **1.22e-08**. The mechanism is exact: **39 of 200** fits have a
  real interval, and those are **precisely** the 39 with no point resting ON the margin — 39 of 39
  one way, 0 of 39 the other. At C = 0.01 the interval reaches **1.47** wide and walking it
  relabels **twelve training points on average** with the objective unchanged.
- **`shape` sets up the dual without stealing it.** digits with a degree-3 expansion needs
  d = 47,904, so `P` alone is **19.8 GB**; an RBF cannot be written down at all. The dual's matrix
  is **25.8 MB at any d** — **765x** smaller, and that ratio is why the next two pages exist.

**ConvexBowlLab** draws J over the two weights as banded contours with a ball you drop by clicking.
Verified live: from four corners and the centre, all five descents end on **the same pixel** as the
marked optimum, 0.00 degrees off, after 74 recorded steps. Switched to the mistake count the
surface becomes flat radial wedges and the ball does not move at all.

Six things this page cost:

1. **The subgradient was 2% to 24% wrong, and the cause was the offset interval above.** Danskin's
   rule needs `b` at *a* minimiser, and `profileHinge` was returning the first kink that achieved
   the minimum — an *endpoint* of an interval routinely wider than 1, which yields an extreme
   member of the subdifferential. Descent zigzagged and stopped **25 degrees** short. Returning the
   **midpoint** took the gradient error to **5.9e-10** and the descent to **0.033 degrees**. The
   page's own subject matter was the bug.
2. **Semi-transparent SVG cells that overlap double their alpha along every seam.** The half-unit
   overlap added to avoid gaps drew a bright lattice over the surface instead of a surface. Fixed
   by picking a grid that divides the plot exactly (62 into 248, so every cell is 4 units) plus
   `shapeRendering="crispEdges"` — not by nudging the overlap.
3. **`--brand` is an off-white (#eceae4) on this theme**, so a heat map painted in it is grey on
   grey. Surfaces need the track accent, not the brand token.
4. **An insight line contradicted page 6.** The LabFrame said the two surfaces "have the same
   minimum to aim at"; page 6 measured that the hinge minimiser costs 2.10 extra errors. Caught by
   reading the rendered lab against the earlier page, rewritten to the difference that is actually
   on display.
5. **Prose overstated the table twice.** "Agreement to nine or ten figures" was true of SLSQP and
   false of trust-constr (five to six); "identical to twelve figures" was written over a table
   showing ten. Both rewritten from the printed numbers.
6. **18 of 60 restarts returned a failure flag** and the first instinct was to filter them out.
   Checking where they had actually stopped was better: all 18 were within **4.15e-10** of the best
   objective, standing on the answer while reporting a stalled line search. That went in the block.

Also: Bash heredocs in this environment still break on an apostrophe inside quoted content
(`u'Pu` produced "unexpected EOF"). Write tool plus python patch scripts remains the route for
authoring.

**Page 9 of 20 — 2026-09-21.** *What the rules are worth* (Lagrangian duality & the KKT
conditions), at `/learn/support-vector-machines/lagrangian-duality-and-kkt`. Three measured
sections (`lagrangian`, `kkt`, `prices`), the **DualityLab**, and a tenth guard
(`svm_dualitylab_check.mjs`). `svmSolver.ts` gains the two-variable problem the lab is built on.

The spine: give every constraint a price and a constrained problem becomes an unconstrained one
with a lower bound attached; at the optimum a constraint can have a price or it can have room,
never both. Support vectors are a consequence of that last sentence rather than an observation
about a derivative — which is the same fact page 7 measured, arriving from the other side.

- **`lagrangian` uses a two-variable problem, not the SVM.** Minimise (1/2)(x^2+y^2) subject to
  x+y >= 2 and x >= 0.5, so one constraint binds and one does not. **20,000 random price pairs,
  zero of them above the answer**; the best closes the gap to **1.9e-15**; and the optimal prices
  are **(1, 0)** — the slack constraint is worth nothing, in one number.
- **`kkt` checks the four conditions across two solvers that never spoke.** SLSQP gets the page-8
  arrays and never computes an alpha; sklearn solves in the prices and never builds a xi. They
  agree to **3.5e-08** on `w = sum a_i y_i x_i`, a quantity neither was asked for. Complementary
  slackness holds to **1.4e-14**.
- **The three-way table is the geography of an SVM falling out of one product being zero.** 24 of
  40 points priced at 0 with `y f(x)` from 1.17 to 4.43; **3 points priced strictly between 0 and
  C, sitting at `y f(x)` = 1.0000 to 1.0000**; 13 pinned at C with slack up to 2.98. The middle
  group is what pins `b`, which is **exactly** why page 8's offset interval appeared on the fits
  where that group is empty. The two pages are one fact seen twice.
- **`prices` makes "price" literal.** Move one constraint by a whisker, re-solve the primal from
  scratch, and the optimum shifts by the price times the whisker: **7.3e-08** relative on every
  priced point, and **3.2e-13** — nothing — on every unpriced one.

**DualityLab** draws the two-variable problem: contours, the two constraints, the real optimum
ringed, and a dot at wherever the priced problem bottoms out, with a slider per price and the
bound plotted against the first one. Verified live: pressing *best prices* lands the dot on the
**identical coordinates** as the ring (124.824, 167.176), the bound reads 1.0000 and the gap
reads "nothing". Its guard sweeps **361,201** price pairs with a worst excess over the answer of
exactly **0**.

Four things worth carrying forward:

1. **The first KKT numbers were all exactly 0.000e+00, and that was the bug.** Checking
   `w == sum a_i y_i x_i` against sklearn's own `coef_` is a tautology — for a linear kernel
   sklearn *computes* `coef_` that way. The condition only becomes evidence when `w` comes from
   an independent solver. Rewritten to cross two solvers, and the residual became a real 3.5e-08.
   **A verification that returns exact zeros deserves suspicion, not satisfaction.**
2. **A forward difference measured the curvature along with the slope.** The price check was off
   by 1e-4 relative on points resting on the margin and 1e-9 on points pinned at C. Not noise:
   the optimum is piecewise *quadratic* in the constraint vector, so a one-sided difference picks
   up the second derivative — and the points at C showed no error because their price is locally
   constant, which was the tell. A central difference took the same rows to **1e-8**.
3. **The lab's status caption was reversed.** A feasible priced minimum means the charge pushed it
   *past* the boundary — too high — and the caption said "not been pushed far enough". Caught by
   reading the rendered caption against the slider, not by the guard, which only checks numbers.
4. **The fixture had to be chosen to show the lesson.** The page-8 dataset has *zero* points in
   the middle KKT group, so the three-way table would have had an empty row. A sweep found 37 of
   48 seed/C combinations populate all three; seed 0 at C = 1 gives 24/3/13 with fractional free
   prices (0.585 to 0.845). The empty-middle case is not hidden — it is the callout explaining
   page 8's loose offset.

**Page 10 of 20 — 2026-09-21.** *The problem, inside out* (The dual problem), at
`/learn/support-vector-machines/the-dual-problem`, **halfway**. Three measured sections (`dual`,
`gram`, `pieces`), the **GramLab**, and an eleventh guard (`svm_dual_check.mjs`). `svmSolver.ts`
gains `gramMatrix` and `dualFit` — **an SMO in TypeScript**, which pages 11, 12 and 14 will all
want.

The spine: substitute page 9's stationarity conditions back into L and every primal variable
cancels, leaving a problem in the prices whose only contact with the data is one number per pair
of points.

- **`dual` solves it cold.** 40 unknowns, one equality, a box; **19 iterations**; the boundary it
  implies sits **0.000e+00 degrees** from sklearn's, with prices agreeing to 4.2e-08.
- **The primal-dual gap is decomposed rather than quoted.** The quadratic halves agree to
  **8.9e-16** — the last bit a double holds — which is what says the two expressions are the same
  expression. The full objectives differ by **2.1e-08** when both are read at the dual's own
  solution and **1.4e-07** when the primal is taken from sklearn instead. That difference between
  the two gaps is the evidence: a real duality gap would not shrink when you stop mixing runs.
- **`gram` is the payoff.** Rotate the cloud: inner products move by 1.8e-15, prices by 1.4e-08.
  **Pad every point with 998 zero features: the Gram matrix changes by exactly 0.000e+00 and the
  prices come back bit for bit identical** — while the primal grows from 43 unknowns to 1041.
  Prediction too: scoring 400 fresh points from inner products alone matches sklearn's decision
  function and gives the identical label on every one.
- **`pieces` shows neither dual constraint was chosen.** Remove the ceiling on separable data and
  you get the hard margin back at **0.000e+00 degrees** with the same ‖w‖ to six decimals; remove
  it on overlapping data and the prices climb to whatever ceiling is set (1 → 10 → 100 → 1000)
  with the objective climbing behind them, which is page 5's infeasibility seen from the dual.
  Remove the equality and the dual reports **13.151634501** — the primal with `b` nailed to zero,
  **to twelve figures**. The equality constraint *is* the intercept.

**GramLab** turns the cloud with a dial while re-solving the dual from the turned coordinates
every time. Verified live across six angles: the dual objective reads **5.694621** and the
support-vector count **8 of 24** at every one, the Gram cell opacities are identical to three
decimals, and the largest change anywhere in the table stays at **3.6e-15**.

Five things this page cost:

1. **The first SMO stopped after one pass and was 35 degrees wrong.** The max-|E| partner is
   very often pinned in a corner where L equals H, so the step is impossible — and with no
   fallback the sweep reported "no change" immediately and returned prices barely off zero. Fixed
   by trying the best partner first and then everyone else. Worst multiplier error went from
   1.0e+00 to **2.4e-07**.
2. **Rounding the rotated coordinates for hydration safety cost 2.5e-06 of inner-product drift**
   — enough to make the displayed objective flicker in its last digit and quietly contradict the
   lab's entire claim. The fix is that the rounding was never needed: `base` is already rounded
   and cos/sin are rounded once, so every product downstream is bit-identical by IEEE without
   further help. Drift went to **3.6e-15**. **Round the inputs to a deterministic pipeline, not
   its outputs.**
3. **Renormalising the rotation matrix was the wrong diagnosis first.** Rounding cos/sin does
   break orthogonality, so that got fixed too — but it was not the 2.5e-06, and measuring after
   the fix rather than assuming is what showed it.
4. **A KaTeX `aligned` environment has a shared left column**, so `\text{subject to}` on the
   second line pushed the objective line 70px right and out of the 682px column. `gathered` plus
   tighter separators fixed it. A sweep then found page 9 overflowing by 18px too, and all **21
   math blocks across all ten pages** now fit.
5. **A LabFrame insight named a readout that no longer existed** (‖w‖, replaced by the Gram-drift
   readout during the build). Caught by reading the rendered lab against the prose.

**Page 11 of 20 — 2026-09-21.** *Three kinds of point* (Support vectors, exactly), at
`/learn/support-vector-machines/support-vectors-exactly`. Four measured sections (`svset`,
`becoming`, `offset`, `loo`), the **SupportSetLab**, and a twelfth guard
(`svm_supportset_check.mjs`).

Page 7 already published the delete-the-non-support-vectors result, from the loss side, where the
only visible distinction is "pulls" or "does not". So this page had to earn its place from the
dual side, which has a finer instrument: a price, which sorts a training set into three groups
rather than two. The spine is the difference between the last two.

- **`svset` gets the definition to do work.** Leave each of the 40 points out in turn: the 24
  unpriced ones move the boundary **0.0000 degrees, every one of them**, and the 16 priced ones
  together reproduce the full fit with a literal zero of turn and the offset agreeing to
  **fourteen decimals**.
- **And the converse is false, which is the half that gets overstated.** **Ten of the sixteen**
  support vectors do not TURN the boundary when deleted — the direction comes back bit-identical
  and the line only slides — including one of the three sitting exactly on the margin. A support
  vector is a point the solution priced, not on its own a point the answer depends on.
- **The best row is the one about the points pinned at C.** Drop all 13 and the boundary does not
  turn at all, but the corridor **widens from 0.4948 to 0.5475**. They are not spectators paying
  a fine for being in the way; they are pressing inward, and the corridor is as narrow as it is
  because of them.
- **A claim that held on the fixture and failed everywhere else, caught by sweeping.** "Only the
  three on the margin really count" reproduces the model exactly on this page's data at all three
  values of C — and over 31 fits it is **16 yes, 15 no, and 0 narrower**. Never narrower is the
  explanation, not the caveat: the full answer is always legal for the smaller problem, so the
  smaller problem can only do better, and better means wider. Publishing the flashy version would
  have been one fixture's luck.
- **`becoming` walks one point in and finds the switch.** The price is exactly 0.0000 above
  functional margin 1 and exactly C below it, and the scan says there is no in-between to catch:
  **220 positions across the crossing, zero with a price strictly between 0 and C.** A point
  inside the corridor carries slack and slack forces the ceiling; a point outside has room and
  that forces zero. Interior prices exist **only** at functional margin exactly 1 — which is why
  page 9's middle group reads "1.0000 to 1.0000", why there are so few of them, and why some fits
  have none.
- **Getting a price and mattering are different events.** The point acquires a price at step 1.70
  and at step 2.00 the model is still bit-identical, with the point well inside the corridor it is
  supposedly supporting. Push it further and the direction stays frozen while the corridor widens,
  because a point pinned at C contributes C*y*x and sliding it along w's own normal changes that
  by a multiple of w — which rescales but cannot turn. Hinge outlier-robustness, from the dual
  side. The sideways control: 8 units of travel, wider than the cloud, and not one digit moves.
- **`offset` closes page 8's loose end exactly.** Only a point resting ON the margin has an
  equation to give: the three free ones agree to seven figures and **any one alone** lands within
  1.2e-07 of sklearn's intercept, while the 13 pinned at C spread over 3.88 and the 24 unpriced
  over 6.22. And page 8's fits whose optimal offset was an INTERVAL are precisely the fits with an
  empty middle group — the first row of the sweep is **0.016885 wide, to the digit the one page 8
  measured**. In all **21** such fits libsvm puts b at the exact middle, which is a sensible
  choice and *is* a choice.
- **`loo` is the payoff.** A non-support-vector left out returns the same model, and a point with
  price 0 has functional margin at least 1, so it cannot produce a leave-one-out error. Measured:
  **720 refits, 0 leave-one-out errors traced to a non-support-vector.** Hence LOO rate <= #SV/n,
  readable off one fit with no refitting — and **loose**, 1.69x to 24x the count it bounds, median
  3.7x. The count is also the bill: one kernel evaluation per support vector per prediction, and
  on the same 3000 points the model to keep ranges from **12% to 96%** of the training set.

**SupportSetLab** draws the three groups differently because they behave differently — bare dot,
ring, filled halo — and re-solves the dual from scratch on every click. Verified live: deleting a
bare dot gives **0.0000 deg / 0.0000**, one on the margin **11.4538 deg**, one pinned at C
**14.9800 deg**, and *drop every point with no price* takes 26 to 8 with the readout still at
**0.0000 deg**.

Four things worth carrying:

1. **The guard I wrote asserted the wrong quantifier and failed on correct behaviour.** It
   demanded that *every* priced point be load-bearing; sklearn's own recorded numbers show seed
   0's point 17 can be dropped for **1.5e-08** of movement. Rewritten to require that *some*
   priced point matters, which is the contrast the page actually needs. The check firing was
   right; what it was checking was not.
2. **Two prose paragraphs were contradicted by the tables directly under them**, both caught by
   tightening the test rather than by reading. "Can also be deleted with no effect" became "do not
   turn it, but do move it" once the test required both turn AND offset to be unchanged; "nothing,
   nothing, nothing and then everything" became "the price switches but the boundary does not"
   once the step grid was fine enough to show it.
3. **A published block must not contain a timing.** The first draft of `loo` measured predict
   latency against #SV, which would have made the block irreproducible and broken the sweep the
   moment the machine was busy. Replaced with kernel evaluations, which is the same claim and is
   exact.
4. **Heredocs mangled the backticks** inside `String.raw` this time, not just apostrophes — a
   replacement that matched by eye failed silently. Script files written with the Write tool
   remain the route.

**Page 12 of 20 — 2026-09-25.** *A space you never build* (The kernel trick), at
`/learn/support-vector-machines/the-kernel-trick`. Four new sections in `svm_cases.py` (`swap`,
`lift`, `nospace`, `allowed`), a new lab **KernelTrickLab**, and a thirteenth guard.

Page 10 ended on "the dual reads nothing but a table of inner products". This page fills the table
with something else and keeps everything else — same solver, same box, same equality constraint,
same rule for the offset, same prediction formula.

- **The swap works and the solver is not told.** On concentric rings a line is at chance (0.4383
  on 600 held-out points) and three curved kernels are at **1.0000 train and test**, agreeing with
  sklearn's own decision function to **1.1e-07 … 3.6e-06**. The linear row disagrees by 0.58 for
  page 11's reason, not a bug: **0 of its 60 multipliers is free**, so the offset is an interval
  and two solvers may pick different points in it.
- **The lifted space is real and it is the right size.** The explicit degree-p monomial map and
  the kernel agree at **3e-16 relative at every degree 2–6**, and a *linear* SVM fitted on the
  explicit features returns the same model as `kernel='poly'` — same #SV (15/15, 16/16, 13/13),
  decision values within **4.8e-13 … 6.4e-12** on 400 fresh points.
- **Rank measures a space nobody built.** The polynomial Gram matrices pin at exactly
  `C(d+p,p)` — **2, 6, 10, 21** — and do not move as n goes 25 → 800. The rbf columns equal **n
  exactly** while n is small and are still climbing at 800 (145 and 335). A finite D would cap
  every rank at D, so a count that keeps rising rules out each finite D in turn.
- **What breaks without PSD is nothing loud.** `tanh(x.z+1)` puts **194 of 1560 pairs at negative
  squared distance**; `|x-z|` puts **all 1560** there. Opening the box 100× multiplies the
  objective by **~10,000** for both (9921×, 10520×) against **100×** for the linear kernel and
  **1.0×** for poly and rbf, which saturate dead at 1027 and 2874 because their feature spaces
  separate this data. And `SVC(kernel='sigmoid')` fits, returns 19 support vectors and scores
  0.8250 with no warning.

**Three claims were written before they were measured, and all three were wrong.**

- A flourish — "more coordinates than there are seconds in four hundred thousand years" — was
  268,000 years. The analogy was dropped rather than patched; the number stands on its own.
- "The three kernels grow about ten times, linear in C" was contradicted by the table directly
  under it: 10.0x, **2.9x**, **5.5x**. Pushing C to 1e6 found the real result, which is better —
  poly and rbf **saturate exactly** (1027 and 2874, flat to the digit) because the hinge sum
  reaches zero in their feature spaces. Three behaviours, not two.
- The lab insight said the two routes are "not exactly zero". At the opening position the readout
  **is** exactly 0. Measured over 704k positions: bit-identical at **73% (p=1) falling to 8%
  (p=5)**, worst gap **2.2e-11**. The insight now says that, and the guard holds both ends.

Two layout bugs came out of a bounding-box sweep rather than a screenshot: the lab's footer line
was **744px wide inside a 560px viewBox**, clipping the d=100 figure that was the point of the
line, and a point dragged right carried its coordinate label onto the `difference` row. Four
MathBlocks also overflowed the 682px column (one by 54px) and are now `gathered`.

`svm_kernel_check.mjs` (the thirteenth guard) re-derives the monomial basis independently rather
than importing the lab's, checks the count is `C(2+p,p)` and the weights sum to `3^p`, then sweeps
**1,375,000 positions** across the draggable square at every degree on the dial: worst gap
**2.18e-11**, inside the 1e-10 the page promises, with the bit-identical rates held at both ends.

Verified: tsc clean · 793 pages house-rule clean · all **13** guards green · `svm_regen --check`
clean on the first run and across all twelve pages · four sections byte-identical across two runs
(3–4s each) · zero console errors · all 5 math blocks fit · lab checked for text overlap and
viewBox spill at every degree · real drag confirmed live (2548.04 vs 2548.04, gap 9.1e-13) · no
horizontal scroll at 375px.

One more stale forward reference fixed on the way: `_blob`'s docstring said scaling is page 14,
and it is page 15.

**Page 13 of 20 — 2026-09-25.** *Choosing what similar means* (Kernels you'll actually use), at
`/learn/support-vector-machines/kernels-you-will-actually-use`. Four new sections in
`svm_cases.py` (`menu`, `reach`, `coef0`, `lookup`), a new lab **KernelChoiceLab**, `rbfGram` and
`rbfFit` added to `svmSolver.ts`, and a fourteenth guard.

Page 12 licensed any PSD function. This page is about the three you will actually type, and the
spine is that choosing one is choosing what "similar" means — a claim the defaults will not check
for you.

- **The two mistakes are not the same size.** `rbf - linear` is **+0.0017** where the truth is
  straight and **+0.4617** on concentric rings. That asymmetry, not any superiority, is most of
  why rbf is everyone's default.
- **Gamma is a length, and it is comparable to your data.** `sqrt(ln2/gamma)` is where similarity
  halves. Measured against a mean pairwise distance of **1.7597** and a nearest-neighbour distance
  of **0.1257**: at gamma=0.01 the half-life is 8.33 (4.7x the whole cloud) and the model
  underfits; at gamma=1000 it is 0.026, the average point has **0.05 neighbours**, all 200 points
  become support vectors, train hits **1.0000** and test falls to **0.6200**. Nothing failed —
  the solver converged and every KKT condition held.
- **sklearn's `coef0=0` default breaks every even degree, exactly.** With no constant the kernel
  is homogeneous, so `(-x.z)^p = (x.z)^p` for even p — measured at **0.000e+00**, not
  approximately — and the model labels x and -x the same at **100.0% of points**. The moons are
  87.5%/93.0% antisymmetric, so a coin flip is the best such a model can do: **0.4850, 0.5150,
  0.5100** at degrees 2, 4, 8 against **0.9200, 0.9250, 0.9050** with `coef0=1`. Odd degrees are
  unaffected, which is the tell.
- **Polynomial conditioning decides whether the fit finishes.** Ten times the units makes the
  largest Gram entry **3.5e+15** times bigger at degree 8. On the unscaled moons all three
  polynomial fits **hit a 2,000,000-iteration cap**; the rbf kernel on identical data finished in
  **247**.
- **The rbf default fails by becoming a lookup table, not by losing accuracy.** Linear truth, 400
  points, 5 seeds, gamma left at 'scale': as d goes 2 → 1000 the support set goes **61.6% →
  100.0%**, train **0.7455 → 1.0000**, the train/cv gap **0.0100 → 0.3940** — while cv (0.6060)
  tracks linear's (0.6195) the whole way. The cause is in the data: the spread of pairwise
  distances falls from **0.5263 to 0.0221** of their mean, and your nearest neighbour goes from
  **14.7x** closer than a typical point to **1.06x**.

**A hypothesis died and three claims were wrong before being measured.**

- "rbf loses as n/d falls" looked right on one draw and came back **mixed over 5 seeds** (at
  n=100 d=1000 rbf actually *won* 2 of 5). The reframing — it does not lose accuracy, it stops
  being a model and starts being a lookup table — is both true and the more useful statement.
- "a fortieth of the gap between neighbours" was eyeballed; the measured ratio is **0.21**, off
  by eight times. "Five times the width of the data" was 4.7x. Both ratios are now computed from
  the distances the section prints.
- "Every column moves in one direction and none of them is the accuracy column" was contradicted
  by its own table — cv does move. And "in high dimensions points are all far apart and all
  equally far apart" was asserted; it is now a measured table.

**The guard failed on correct behaviour, again, and the fix made it stronger.** It asserted the
support count is U-shaped in gamma on all three worlds. It is not: on **straight** data the count
climbs from the first gamma, because a straight boundary has no scale to resolve and the widest
kernel on the dial is already the right one. That observation is now in the lab's insight. The
second version also had a decision-value tolerance picked before seeing data (2e-2, one case came
in at 2.98e-2); digging found **0 label flips of 60** and support counts **identical to sklearn in
all 24 cases**, with the gap caused by the browser SMO's 400-pass cap on a point at |f|=1.61. So
the loose tolerance was loosened to 8e-2 and the two that matter were made **exact**.

**A performance bug no screenshot would have shown, and two bad measurements of it.** One click on
the gamma dial rebuilt ~800 `<rect>` elements and re-solved the SVM — and the fit lived in a memo
keyed on the probe point, so *dragging* re-solved it too. My first two timings (10.9s, then 4.0s)
were both artifacts: **this pane throttles `requestAnimationFrame` to ~6 seconds**, so I was
timing the pane. Measured properly via `MutationObserver`, the real figures are **126ms** for a
typical click and **~1.4s** at the hardest setting of the dial in a dev build. The fixes stand
regardless — memos split so the probe no longer re-solves anything, N 90 → 60, and the shading
quantised into four bands with each row merged into runs (**798 → 252 rects**).

Also caught: a hydration mismatch of exactly the kind in the `ssr-hydration-in-labs` note —
`opacity={0.19856833819219655}` server-side against `"0.1985683381921965"` client-side, because
`Math.exp` is not correctly rounded and fed an SVG attribute. Two MathBlocks overflowed the column
and are now `gathered`.

`svm_choice_check.mjs` (the fourteenth guard) runs the shipped TypeScript rbf solver against
sklearn's answers on the same points, recorded by `reach` into `results/svm_choice_case.json`:
**24 cases, every support count equal to sklearn's, no point labelled differently anywhere**, and
the per-world shape of the support curve (U on the curved worlds, climbing on the straight one)
required to match sklearn's too.

Verified: tsc clean · 794 pages house-rule clean · all **14** guards green · `svm_regen --check`
clean on the first run and across all thirteen pages · four sections byte-identical across two
runs (3.2s, 3.0s, 5.1s, 7.8s) · fresh tab with zero console errors · 0 math overflow · lab swept
for text overlap and viewBox spill across all 24 world/gamma states · probe drag confirmed live
(ring 30 → 19, probe landing exactly where it was put).

### P2 · Statistical inference — a whole subject, not a page

GATE asks for the t-distribution, the chi-squared distribution, confidence intervals, and the
z-, t- and chi-squared **tests**. What exists is only inference *about regression coefficients*,
inside the linear-regression track (`hypothesis-tests-and-p-values`, `confidence-intervals`) and
one logistic page (`statistical-significance-of-coefficients`). There is no one-sample or
two-sample test, no goodness-of-fit, no test of independence.

Also missing from the probability strand: **CDF** (appears only as the Gaussian CDF inside GELU),
**conditional PDF**, **conditional expectation & variance** (only in RL/boosting contexts), and
**median/mode as summary statistics** (median appears only as an imputation/robust-scaling tool in
the data-workflow pillar).

Target: ~14 pages, accent `--c-fundamentals`, a new strand or a `statistical-inference` track.

### P3 · Matrix mechanics — the linear-algebra strand teaches geometry and skips the algebra

Absent entirely: **null space / nullity** (zero hits under any name), **projection matrix**
(the concept is taught in `dot-product`, the matrix `P = A(AᵀA)⁻¹Aᵀ` is not), **orthogonal
matrix** (one incidental hit), **idempotent matrix**, **partitioned/block matrix**, **Gaussian
elimination**, **LU decomposition**. **Determinant** is mentioned in 3 pages with no real
treatment; **quadratic forms** are partial (`spd-matrices`).

Target: ~6 pages added to the Math Foundations linear-algebra strand.

### P4 · Hierarchical clustering

`single linkage` / `complete linkage` = 0 hits. Hierarchical clustering exists only as comparison
mentions inside the k-Means track (`vs-dbscan-gmm-hierarchical`, `bisecting-k-means`). GATE asks
for top-down/bottom-up and single/multiple linkage. **k-medoids** is in the same state — mentioned
across 9 k-Means pages, never taught.

Target: ~12 pages, accent `--c-clustering`. Already a href-less slot in `siteMap.ts`.

### P5 · Taylor series & single-variable optimization

`Taylor` is one passing mention in the rebuilt `derivatives` page and one use in
`boosting/newton-boosting`; it is never derived. Maxima/minima appear as "stationary point" ×5
with no second-derivative test.

Target: ~3 pages in the calculus strand.

### P6 · Counting — permutations & combinations

Absent. `binomial coefficient` = 0 hits. The binomial distribution is taught without the
coefficient ever being derived.

Target: ~2 pages at the head of the probability strand.

### P7 · Depth fills on topics that exist but are thin

- **LDA** — one page inside logistic regression (`generative-twin-naive-bayes-lda`). GATE lists it
  as a method in its own right.
- **k-medoids** — see P4.

---

## Cross-cutting: the maths rebuild is 1 of 33

`docs/math-pedagogy-plan.md` set the standard for these pages — one concept per page, 3–4 worked
examples, 10+ graded problems in three bands. Only `derivatives` (37 KB) has been rebuilt; the
other 32 math-foundations pages are 3.9–7.4 KB. **So even the topics marked "covered" above are
currently short conceptual pages, not exam-grade treatment.** P2/P3/P5/P6 should be authored to
the rebuilt standard from page one rather than added at the old depth and rebuilt later.

---

## Binding rules for all of this work

Unchanged from the rest of the build, restated because they bite hardest on new tracks:

1. **Every published number is reproduced by a script in `scripts/`.** Measure before writing the
   prose around it — a claim written first and measured later is how the parry-window and
   stunlock-control errors got published.
2. `docs/PROJECT.md` §11 authoring checklist is LOCKED and applies from page one: track lib →
   `searchIndex.ts` → `siteMap.ts`, `LessonShell` + `TrackSidebar`, shared lesson primitives,
   KaTeX, `CodeBlock`/`CodeOutput` with real captured runs, `PredictPrompt` before each flagship
   lab, `Quiz` at every chapter end, `DecisionPoint` at every real decision.
3. House style is the linear-regression track (see the `linear-regression-design-philosophy`
   memory), not the denser neural-track style.
4. Every design decision gets an in-page decision record — alternatives, evidence, conclusion.

**Page 14 of 20 — 2026-09-25.** *Two at a time* (Solving it: SMO), at
`/learn/support-vector-machines/solving-it-smo`. Four new sections in `svm_cases.py`
(`twoatatime`, `clipbox`, `whichpair`, `stopping`), a new lab **SmoStepLab**, a new guard
`svm_smo_check.mjs` backed by `results/svm_smo_case.json`.

Thirteen pages ended with "and then you solve it". The spine here is that the solver is a
formula for two variables applied a few thousand times, and the asymmetry between how trivial
the step is and how much the pair choice matters IS the page.

- **One equality constraint makes coordinate ascent illegal.** Moving a single multiplier by
  any amount moves `sum a_i y_i` off zero by exactly that amount; two is the smallest legal
  move, which is the "minimal" in the name. The pair is then pinned to a line (slope +1 for
  opposite labels, -1 for equal), the objective on it is a one-variable quadratic, and the
  maximum is a formula. Against a numerical search over 500 pairs: the formula is never worse
  by more than **1.78e-14**, one rounding error in a number of size 20.
- **PSD arrives as a licence to divide.** `eta` is the curvature of that quadratic and is never
  positive over all **3,540** pairs (largest **-1.211e-03**) — page 12's condition doing a
  completely different job. Exactly **0.0e+00**, not nearly zero, for a duplicated point.
- **The solver lands on libsvm.** 187 steps, **24.6%** of them clipped, objective 35.251225
  against sklearn's 35.251225, 37/37 support vectors, 35/35 pinned at C, max|a - a_sk| 2.92e-08.
- **Only the objective is monotone.** Zero decreases in 187 steps. The KKT violation starts at
  2.00 and is **5.65** by step 5 — higher than it began — and climbs again by step 20. The
  quantity you stop on is not the quantity that improves.
- **The selection is the whole algorithm.** Both ends by the rule: **573** steps. One end by
  the rule, the other at random: **39,161** (68x). Both at random: hit the **400,000**-step cap
  still 3.6e-03 from an optimum the rule reached in 573.
- **Nine orders of magnitude of tolerance buy one point.** Gap to the optimum falls through
  twelve orders; test accuracy moves once (0.8800 -> 0.8833, one point in 300) between the two
  loosest rows and then never again; support count settles by tol 1e-02. Steps 140 -> 3,162.
- **Cost.** Updating the error cache is 2n numbers, rebuilding is n^2: by n=1600 the same solve
  is **758x** the arithmetic. Step counts are unpredictable (at n=400 five draws span
  **747-2700**, wider than the gap between n=100 and n=800). Memory is not: 763 MB at n=10,000,
  **74.5 GB** at n=100,000.

**A published timing table had to be thrown away.** The first version of section 53 measured
the cached-vs-rebuilt update in microseconds. A published block is re-run and compared byte for
byte, so a wall-clock number can never reproduce. Replaced with the count of numbers each
variant actually touches over a whole solve — still a measurement of real behaviour (the two
take different step counts), and the same every run.

**The guard found two real defects in the lab, which is what it is for.** `plan()` had no
stopping tolerance, so there was always *some* pair not exactly at a KKT point and "Run to the
end" span its full cap taking steps of size 1e-16. And in the random rule, drawing the same
index twice ended the run instead of drawing again — which is why the random rule appeared to
"finish" in 19 steps at a visibly worse objective. Fixed, and the lab now reproduces sklearn on
all three values of C.

**Four corrections to prose that contradicted its own tables.** "The test accuracy does not
move at all: 0.8800 at every tolerance ... still 0.8833" said both things in one sentence — it
moves once. "Eleven orders of magnitude" was wrong twice (the tolerance spans nine, the gap
twelve). "By n=1600 the same solve is four hundred times the arithmetic" read 758x in the table
beside it. And "an identical answer" was contradicted by the next paragraph, which measures the
two landing 3.2e-02 apart in `a`.

**Three wrong page cross-references,** caught by mapping sections to pages rather than trusting
memory: the dual is page 10 not 9, the general-purpose QP solver is page 8 not 7, and a price
pinned at C is page 5's margin violator, not page 10's.

**Seven phantom CSS variables.** The lab used `--c-rule`, `--c-ink` and `--c-muted`, none of
which exist — only the track accents carry the `--c-` prefix. Every panel border was rendering
with `stroke: none`, i.e. invisible, while the screenshot looked fine because the points and
labels still had colour. The real tokens are `--border-strong`, `--ink`, `--muted`.

**And 24 unicode escapes rendering as literal text.** The page generator wrote `\u2014` into
JSX, where it is not an escape — "the pair whose step a first-order model says buys the
most" was preceded by a visible `\u2014` on the live page. Valid inside the JS string literals
(metadata, quiz options), broken everywhere else; all replaced with the literal characters.

`svm_smo_check.mjs` holds the lab's solver against sklearn on the identical 24 points. The lab
uses a **Lehmer** generator rather than the usual LCG so that `svm_cases.py` can reproduce those
points exactly — 2^31 x 48271 stays under 2^53, so both languages walk the same sequence and the
point-match tolerance is **0**. It also requires: sklearn's objective, support count and pinned
count on all three C; zero objective decreases on every step of every run; eta never positive;
at least one clipped step (or the lab cannot draw its own central picture); and the random rule
converging to the same objective in strictly more steps.

Verified: tsc clean · 795 pages house-rule clean · all **14** guards green · `svm_regen --check`
clean on page 14 and across all fourteen pages · four sections byte-identical across two runs ·
fresh tab with zero console errors and zero hydration warnings · 0 KaTeX errors · all three math
blocks exactly 682px in a 682px column · lab swept for text overlap and viewBox spill across
**360** step/rule states · live run confirmed 9 steps by the rule against 254 at random, both
landing on objective 2.4638 with 5 support vectors and 3 pinned.
