# Depth audit — every chapter, what it needs

**Written 2026-09-15.** A chapter-by-chapter pass over all 34 tracks + 4 capstones, recording for
each one: what **depth** is missing, what **text** should change, what **chapters/pages** are worth
adding, what **labs** to add or fix, and what **visuals** are missing.

This is a backlog, not a plan. Nothing here is committed to; it exists so that future sessions never
have to re-derive "what's thin" from scratch. Priorities are at the end (§0.4).

---

## §0.1 How this was measured

`scripts/inventory.js` parses every `src/lib/*Track.ts` outline, resolves each page href to its
`page.tsx`, and counts prose words (JSX text **and** long string props — code samples in template
literals excluded), imported labs and figures, inline `<svg>`, `<CodeBlock>`, `<CodeOutput>`,
`<Proof>`, `<Callout>`, `<PredictPrompt>`, `<Quiz>` and `<MathBlock>`. 794 outlined pages, 760 built.

```bash
node scripts/inventory.js   # -> results/inventory.json
```

Re-run it rather than trusting the numbers below once pages change.

Two numbers drive most of what follows:

| | |
|---|---|
| **avg words/page** | how much is actually *said* on a page |
| **no-visual pages** | pages with no lab, no imported figure and no inline `<svg>` |

**264 of 760 built pages (35%) have no visual of any kind** — it was 372 (49%) when this document
was written. The landing page says every concept is taught "with text, a visual, and an interactive
lab together, never prose alone." That claim is currently true of about two thirds of the site.

⚠ **`scripts/inventory.js` was corrected on 2026-09-15 and the two numbers above are on the new
measure.** Three bugs, all of which flattered the site:

- it counted an **import** as a visual, so a figure imported and never rendered still cleared the
  bar — three pages were doing exactly that (§0.5);
- it missed **default imports** (`import Foo from "@/components/labs/Foo"`);
- it treated everything under `components/capstone/` as a figure, including `pedagogy.tsx`, which
  holds `DecisionPoint` and `GuessSlider` — prompts, not pictures. That alone is why the asteroid
  capstone read as **0** pages without a visual when **15 of its 24** have none.

The fix makes `inventory.js` agree exactly with the independent check used during the figure passes
(both now say 264), so one number covers the whole site. Per-track counts in the entries below that
still carry the old measure are marked where they differ.

## §0.2 The site has three eras, and they fail in opposite directions

| era | tracks | avg w/pg | no-visual | the failure |
|---|---|---|---|---|
| **Early (thin)** | k-Means 348, math-foundations 368, regularized-regression 372, PCA 460, random forests 468, kernel ridge 476, SVR 477, linear regression 491 | **~300–500** | mixed | pages are a paragraph, a formula and a lab. The lab carries the teaching; remove it and nothing is left. Reads fast, teaches shallowly. |
| **Middle (dense, blind)** | architecture 1281, nn-regularisation 1126, init-norm 1100, activations 928, perceptron→MLP 928, backprop 854, data workflow 823, FA 712 | **~700–1300** | ~~architecture 26/27, FA 24/24, init-norm 20/21, nn-reg 20/21, planning 19/22~~ **all five fixed 2026-09-15**; the era's remaining debt is backprop 13/22, activations 9/21, perceptron→MLP 9/21, data workflow 16/28 | genuinely deep prose with *nothing to look at*. These are the tracks the memory note warns about: "supersedes the denser neural/NB page style for new work." |
| **Recent (right)** | building-environments 1757, warehouse capstone 1040, asteroid capstone 606, Lies-of-P 936 | **600–1800** | **0** | decision records, real numbers, a bespoke visual or lab per page. This is the target. |

The two failure modes need opposite fixes, so the per-track entries below split into
**"needs ink"** (early tracks: add depth to the words) and **"needs eyes"** (middle tracks: the words
are fine, they need figures).

## §0.3 Nine cross-cutting fixes worth more than any single chapter

Every number below is from the inventory, not an impression.

1. **◐ A figure budget per track.** Rule: *no page ships with zero visual.* The cheapest form is a
   small static SSR SVG, not a lab. **Six tracks done as of 2026-09-15:** init & norm and
   nn-regularisation (20/21 and 20/21 → 0 and 0), architecture design and function approximation
   (26/27 and 24/24 → 1 and 2), then planning and k-Means (19/22 and 28/45 → 0 and 0).
   The site has gone **372 → 264 pages with no visual (49% → 35%)**. The full remaining debt is the
   register in §0.5; the six largest are math foundations 20/34, kNN 16/36, naive Bayes 16/20,
   RL learning 16/24, data workflow 16/28 and the asteroid capstone 15/24.

   *Counting note — the count itself was wrong twice, in the same direction both times.*
   The first check matched component names against a list of likely suffixes (`Lab`, `Figure`,
   `Diagram`, …) and silently missed every component whose name did not end in one — `GpiLoop`,
   `CurseScale`, `RewardBoard`. The replacement resolved imports instead, but only from
   `components/figures` and `components/labs`, so it counted the whole of building-environments
   (27 pages) and the warehouse capstone (24) as blind when their visuals live in
   `components/sail/`, `components/fire/` and `components/capstone/`. That is where the
   **370 → 323 (42%)** figure quoted on 2026-09-15 came from, and it is wrong: too *pessimistic*
   overall, while `inventory.js` was simultaneously too generous for counting unrendered imports
   and `capstone/pedagogy`. Both are now fixed and agree at **264**. Two lessons worth keeping:
   a detector that is generous when unsure is worse than no detector, because its number is the one
   that gets reported — and **the second attempt at a broken metric is not automatically right**.
   Check a new measure against tracks whose answer you already know, in both directions.

   Reach for the shared primitives first — `figures/Dumbbell`, `figures/SweepCurve`,
   `figures/LearningCurve`, `figures/LayerTrace` (promoted out of `initNorm/` when the architecture
   track needed it) — and add a track-local folder only for the shapes that are genuinely specific
   to one subject. The two folders added this session are worth copying as a pattern:
   `figures/arch/` (network diagrams, residual wiring, a grid heatmap, memory bars, the four
   diagnostic curve shapes) and `figures/fa/` (tile coding, Baird's seven states, the deadly triad,
   the DQN wiring, Mountain Car's cost-to-go surface, value-function staircases).

2. **✅ DONE 2026-09-15 — two tracks were pure prose: no code, no lab, no figure.**
   `initialisation-and-normalisation` and `nn-regularisation` had **0 CodeBlocks, 0 figures,
   0 PredictPrompts and one lab across 42 pages** — 20 proofs and 20 quizzes each and nothing else.
   Both are now at **0 pages without a visual**, with 3 runnable CodeBlocks, 11 PredictPrompts, a new
   lab, a `DecisionPoint` on each closing page, and two new measurement scripts
   (`init_norm_train.py`, `reg_curves.py`) so the claims that needed training runs have them. The
   init-norm thesis now has a number: init-scale spread 0.4750 without normalisation, 0.0083 with it.
   Full write-up in `PROJECT.md` §14.1, including the six passages that were publishing a `%.4f`
   print format ("0.0000") as a measured zero.

3. **21 of 34 tracks contain zero `<Proof>`.** The tier-3 "why it's guaranteed to work" promise on
   `/map` is carried entirely by the neural, RL and learning-theory tracks. Zero-proof tracks
   include the whole supervised-classics half — linear regression, logistic regression, kNN,
   naive Bayes, trees, forests, boosting, k-Means, PCA, regularized regression, SVR, kernel ridge —
   **and `math-foundations` itself**, which is the tier-0 mathematics spine and contains not a
   single proof.

4. **Three primitives are built and effectively unused.**
   - `<Term>` (hover-definition popover): 24 uses total, 17 of them in logistic regression. Every
     track re-explains its own jargon inline instead.
   - `<Backlinks>`: 23 pages out of 760.
   - `DecisionPoint` (commit before you see the answer): 16 uses, 12 of them in capstones. It is the
     single strongest teaching primitive on the site and it exists in six places. **◐ 2026-09-15:**
     moved out of `components/capstone/` to `components/DecisionPoint.tsx` — that folder was the whole
     reason nothing outside the capstones reached for it — and all 16 importers repointed. The
     rollout (one per family track, on the closing page) is still outstanding; see `PROJECT.md` §14.3.
   - ℹ `<Term>` deliberately has **no central glossary** ("definitions live where they are used, so
     they cannot drift" — the component says so). Adoption is therefore per-page work, not a
     mechanical fix. Same for `<Backlinks>`: there is no dependency graph to generate them from.

5. **Active recall stops at the RL border.** `PredictPrompt` counts: building-environments 31,
   logistic regression 23, learning 22, FA 21 — against **0** for boosting, init-norm,
   nn-regularisation, kernel ridge and regularized regression, 1 for SVR, 2 for kNN, 3 for k-Means
   and architecture. **◐ 2026-09-15:** boosting (0 → 9), init-norm (0 → 7),
   nn-regularisation (0 → 4) and architecture (3 → 9) done; FA went 21 → 25. Remaining at zero:
   kernel ridge and regularized regression.
   Doctrine is written down in `PROJECT.md` §14.2.

6. **✅ RESOLVED 2026-09-15 — Quiz and PredictPrompt had silently swapped places.** The four
   newest bodies of work (building-environments, FA, and both finished capstones) had **zero
   `<Quiz>`** and heavy PredictPrompt; the older tracks the reverse. Decided in `PROJECT.md` §14.2:
   they are not substitutes. **PredictPrompt before every measured result** (a number published
   without a preceding guess is a defect); **Quiz once per chapter**, on the chapter last page.
   Remaining work: prompts for the five zero-prompt tracks (boosting, init-norm, nn-regularisation,
   kernel ridge, regularized regression), a chapter-end quiz for the four quiz-free ones.

7. **◐ Five tracks had no runnable code at all**: evaluation, init-norm, nn-regularisation,
   learning-theory, math-foundations. **2026-09-15: init-norm and nn-regularisation done.**
   `INIT_SETUP` turned out to already exist in `runtimeSetup.ts`, complete, and imported by zero
   pages — check for that before writing a new preamble. Remaining: evaluation (the important one),
   learning-theory and math-foundations (arguably correct as they are). For the two theory tracks that is arguably correct; for
   evaluation (thresholds, ROC, calibration) and the two neural tracks it is not.

8. **✅ FIXED 2026-09-15 — 20 pages showed an output panel with no code above it.** `<CodeOutput>`
   is built to attach to a `<CodeBlock>` (negative top margin, no top border), so alone it rendered
   detached *and* published a number whose code was not on the page. It now takes a `source` prop:
   `<CodeOutput source="scripts/boosting_cases.py">` gets a full border and a `reproduced by …`
   credit line, which states house rule #1 on the page instead of assuming it. All 23 panels across
   the 20 pages converted and attributed. `node scripts/check-pages.js` now fails if a standalone
   panel has no source, or if a source points at a file that does not exist.

9. **The Optimization foundation is empty** (4 outlined tracks, 0 pages) while regression, neural
   networks and RL each teach their own private gradient descent. Largest duplicated-content debt
   on the site, and the one that would most improve `/map`'s throughlines, two of which point at it.

## §0.4 If only five things get done

1. ~~Give `init-norm` and `nn-regularisation` figures and labs (§Neural).~~ ✅ done 2026-09-15.
2. ~~Give `function-approximation` figures (§RL).~~ ✅ done 2026-09-15, together with
   architecture design. 51 pages, 0 blind.
3. ~~Give `planning` and `k-Means` figures (§RL, §Clustering).~~ ✅ done 2026-09-15. 67 pages,
   0 blind. Deepening k-Means' *prose* (45 pages at 348 w/pg, still the thinnest large track) is
   the part that remains — but the track now has measured numbers to deepen it *with*, in
   `scripts/kmeans_cases.py`.
4. Build the **Optimization** foundation (§Foundations) and re-point the duplicated gradient-descent
   teaching at it. ☐ not started.
5. Put `DecisionPoint` at the end of every family track (§0.3 #4) — cheapest large pedagogy win.
   ◐ it reaches 10 tracks; **24 have none**.

Three of the five are done, so the list needs replacing rather than extending. On the evidence in
§0.5 the next five are:

1. **Naive Bayes (16/20 blind), SVR (11/16) and kernel ridge (10/16)** — the worst *ratios* left,
   each one pass, and kernel ridge is also one of the two tracks still at zero PredictPrompts.
2. **Math foundations (20/34 blind, 0 proofs, 0 runnable code, 367 w/pg)** — the tier-0 spine fails
   every test in this document at once, and every other track points at it.
3. **Finish `DecisionPoint`** (§0.4 #5 above), now that the component no longer lives under
   `capstone/`.
4. **Give `evaluation` runnable code** — thresholds, ROC and calibration are the one place where a
   reader not being able to move the number is a real loss (§0.3 #7).
5. **The Optimization foundation** (§0.4 #4 above), still the largest structural debt.

A live status table for all nine cross-cutting fixes is in **§0.5**.

## §0.5 Pending register — what is actually left, as of 2026-09-15

Everything above is diagnosis. This is the live list: what has been done, what has not, and the
number attached to each. Re-run `node scripts/inventory.js` before trusting any of it.

**Where the site stands.** 794 pages outlined, **760 built**, **264 (35%) with no visual**, 21 of 34
tracks with **zero `<Proof>`**, 5 tracks with **no runnable code**, `DecisionPoint` on **20 pages in
10 tracks**, `<Term>` on **12 pages in 3 tracks**, `<Backlinks>` on **23 of 760**.

### The nine cross-cutting fixes (§0.3), by status

| # | fix | status | what is left |
|---|---|---|---|
| 1 | figure budget — no page ships blind | ◐ **6 of 34 tracks** | 264 pages across 28 tracks; table below |
| 2 | two pure-prose tracks | ✅ done | — |
| 3 | zero `<Proof>` in 21 of 34 tracks | ☐ **not started** | the whole supervised-classics half, **and `math-foundations` itself** |
| 4 | `DecisionPoint` / `<Term>` / `<Backlinks>` unused | ◐ **moved, not rolled out** | `DecisionPoint` reaches 10 tracks; 24 have none. `<Term>` and `<Backlinks>` are per-page work with no mechanical fix |
| 5 | active recall stops at the RL border | ◐ **4 of 6 done** | `kernel-ridge` and `regularized-regression` are still at **0 PredictPrompts** |
| 6 | Quiz and PredictPrompt had swapped places | ◐ **doctrine settled, rollout partial** | 5 tracks still have **0 `<Quiz>`**: building-environments, function-approximation, and the asteroid, housing and Lies-of-P capstones |
| 7 | tracks with no runnable code | ◐ **2 of 5 done** | **evaluation** (the important one: thresholds, ROC, calibration), plus math-foundations, learning-theory and start-here, which are arguably correct as they are |
| 8 | `<CodeOutput>` panels with no code above them | ✅ done | guarded by `scripts/check-pages.js` |
| 9 | the Optimization foundation is empty | ☐ **not started** | 4 outlined tracks, 0 pages; the site's largest duplicated-content debt |

### Remaining visual debt, worst first

Pages with no lab, no rendered figure and no inline `<svg>`. Six tracks are clear; these are not.

| track | blind / built | track | blind / built |
|---|---:|---|---:|
| Math foundations | **20 / 34** | Model selection | 8 / 16 |
| k-Nearest Neighbors | **16 / 36** | Learning theory | 7 / 20 |
| Naive Bayes | **16 / 20** | Logistic regression | 7 / 25 |
| RL · Learning | **16 / 24** | Polynomial regression | 6 / 14 |
| The data workflow | **16 / 28** | Capstone · housing | 5 / 13 |
| Random forests | 15 / 21 | Start here | 4 / 5 |
| Boosting | 15 / 23 | PCA | 4 / 22 |
| Capstone · asteroid | 15 / 24 | Linear regression | 3 / 47 |
| RL · MDPs | 14 / 24 | Function approximation | 2 / 24 |
| Backpropagation | 13 / 22 | Architecture design | 1 / 27 |
| Support vector regression | 11 / 16 | Building environments | 1 / 27 |
| Decision trees | 11 / 20 | Evaluation & metrics | 1 / 10 |
| Kernel ridge regression | 10 / 16 | | |
| Regularized regression | 9 / 26 | | |
| Activation functions | 9 / 21 | | |
| Perceptron to MLP | 9 / 21 | | |

By *ratio* the worst are **naive Bayes 16/20 (80%)**, **SVR 11/16 (69%)** and **kernel ridge 10/16
(63%)** — start-here is 4/5 but is five pages. None of them is as bad as the tracks already fixed
were (function approximation was 24/24, architecture 26/27), and all three are small enough to
finish in one pass each; kernel ridge is also one of the two tracks still at zero PredictPrompts, so
it pays twice. **Math foundations (20/34)** is the largest absolute debt and the one with the most
leverage, since every other track points at it.

### Four pages that are one line from being fixed

Three pages import a visual and never render it — which is why they still count as blind, and why
the corrected `inventory.js` now checks for the tag and not just the import:

- `function-approximation/when-td-diverges` imports `Curve` and `BAIRD_X`/`BAIRD_SERIES`, renders none of them.
- `function-approximation/whats-safe` imports `TriadDiagram`, never renders it.
- `building-environments/training-the-crew` imports `RaceLab`, never renders it — this is the known
  DQN-vs-PPO race gap (`fire/data/raceCurves.ts` is still `[]`), so the import is a placeholder for
  data that does not exist yet.

The fourth, `architecture-design/the-checklist`, is the last blind page in a finished track and
imports nothing; `evaluation/the-evaluation-checklist` is the same shape.

### Unbuilt, in the order Part five argues for

**34 outlined pages are unbuilt**, all of them in two places: **building-environments 13** (World 2's
*Training the crew* and *What the crew learned*, and all of World 3) and **Lies-of-P capstone 21**
(deliberately href-less — the field-report genre ships methodology before results, never results
before the model).

Whole tracks that do not exist: policy gradients / actor–critic / PPO · **Optimization** (4 tracks) ·
SVM · stacking & blending · **GMM + EM** · DBSCAN · hierarchical clustering · t-SNE & UMAP · kernel
PCA · manifold learning · random projections · CNNs · model-based RL & MCTS · neuroevolution ·
perceptron & online classifiers · multi-class strategies.

### Depth debt that is not about pictures

- **k-Means prose, 374 w/pg over 45 pages** — still the thinnest large track, and now the only one
  with a full measurement script (`scripts/kmeans_cases.py`) and no prose built on it.
- **Seven tracks run code and publish no output at all.** k-Means (39 `CodeBlock`s), linear
  regression (41), regularized regression (23), naive Bayes (16), data workflow (10), architecture
  (3) and model selection (1) have **zero `<CodeOutput>`** between them across 209 pages — listings
  that never commit to a result. House rule #1 has nothing to check on those pages.
- **Two pages belong to no track and should exist anyway**: *"Is this difference real?"* (paired
  tests across folds — every bake-off page needs it) and *"When more parameters stopped hurting"*
  (double descent; the only bridge from learning theory to the neural family).

---

# Part one · Algorithm families

## 1. Regression

### 1.1 Linear regression — 47pp · 491 w/pg · 3 pages without a visual · 0 proofs

The flagship, and the house style. Its weakness is not visuals (38 pages carry a lab) but **words**:
eight pages sit under 350 words, and the assumptions chapter averages ~250. The lab does the
teaching and the prose is a caption. Also: **41 CodeBlocks and 0 Proofs** — the most-visited track
on the site has no tier-3 floor at all.

**CH1 · The problem & the intuition** (4pp)
- *Depth*: the data-generating process never appears. `y = f(x) + ε` is the idea that makes error,
  assumptions, intervals and bias–variance all one story, and it is introduced nowhere — bias–variance
  arrives 35 pages later with no groundwork.
- *New page*: **"Where the noise comes from"** between *What a model really is* and *The line of best
  fit*. Truth, sample, fit — three objects, one picture.
- *Lab*: a **noise dial** — known true line, reader raises σ, watches the fitted line wobble across
  resamples. One artifact that can be re-used verbatim in bias–variance, CIs and prediction intervals
  (three later pages that each currently invent their own setup).
- *Visual*: *What a model really is* should get the "model = family + fitted member" diagram that
  `ModelAnatomy` almost is.

**CH2 · Turning wrong into a number** (4pp)
- *Depth*: **the MLE answer to "why squared error" is missing.** Gaussian noise → squared error is
  *the* principled answer and it is exactly a `<Proof>` — this track's first.
- *New page or section*: **Huber and the third option.** Squared vs absolute is posed as a binary; the
  loss that resolves it is never named, and it returns in SVR (ε-insensitive) and in boosting.
- *Lab*: `PenaltyCurves` (59 lines, one use) — add a Huber curve and a δ slider; it becomes a figure
  three tracks can share.
- *Text*: *The cost function* (446w) states MSE and moves on; it should say why the mean and not the
  sum (invariance to n), which is the thing readers actually get wrong later in mini-batch.

**CH3 · Gradient descent** (7pp — the thinnest chapter in the track: 296–706w)
- *Depth*: no momentum, no condition number, no stability bound. *Learning rate* (296w) lets you
  discover divergence by dragging but never says `η > 2/λ_max` diverges, which is a one-line fact that
  explains every later "it exploded" in the neural tracks.
- *Proof*: GD on a quadratic contracts as `(1−ηλ)^t` — one screen, and it is the whole convergence
  story. Also the natural home for κ = λ_max/λ_min.
- *New page*: **"Why scaling changes the path"** — condition number as the shape of the bowl. Feature
  scaling currently arrives 10 pages later as a practitioner tip with no theory behind it.
- *Lab*: `LearningRateLab` — draw the divergence threshold as a marked line on the η axis, so the
  cliff is visible before you fall off it.
- *Visual*: contour + path is present; missing is the **same path under an ill-conditioned bowl**,
  side by side. That one figure justifies scaling, momentum and Adam all at once.

**CH4 · The direct solution** (2pp)
- *Depth*: conditioning is absent. The normal equation is presented as exact with no mention that
  `XᵀX` squares the condition number, which is why every library uses QR/SVD instead.
- *New page*: **"When the normal equation lies"** — rank deficiency, `p > n`, and why the answer stops
  being unique. The honest bridge into ridge and into multicollinearity.
- *Lab*: `ClosedFormVsGDLab` — add n and p sliders so the O(p³) vs O(npt) crossover is something you
  *find*, not something you're told.

**CH5 · From one feature to many** (4pp, 312–631w)
- *Depth*: **the projection picture is missing.** Least squares as orthogonal projection onto the
  column space — residual ⟂ columns, the hat matrix — is the single unifying image that later powers
  leverage, R², ridge shrinkage and PCA. Its absence is why four later pages each re-derive their own
  intuition.
- *New page*: **"Least squares is a projection"** (tier 2/3), with a 3-vector figure.
- *Lab*: `MultipleRegressionLab` — add an added-variable (partial regression) plot toggle; that is
  what "controlling for" actually means and it is currently only asserted.
- *Text*: *Categorical features* (316w) — mention the dummy trap here, where it belongs, not only in
  the failure gallery at the end.

**CH6 · The assumptions** (6pp — the thinnest in the track, min 193w)
- *Depth*: every page says what the assumption is and gives a lab; none says **what breaks, and by how
  much, if it fails.** Heteroscedasticity leaves coefficients unbiased and standard errors wrong —
  that distinction is the whole point and it is nowhere quantified.
- *New page*: **"Which assumption matters for which claim"** — a table across prediction / inference /
  causal columns. Highest-value single missing page in the track: it turns six memorised rules into
  one decision.
- *Honest number*: a script that measures **95% CI coverage under each violation** (it should read far
  below 95% under strong heteroscedasticity). One measured number per page, and the chapter stops
  being a list.
- *Visual*: a 2×3 "violation → the plot that catches it" grid as the chapter index, reused as the
  thumbnail on each of the six pages.
- *Labs*: `HomoscedasticityLab` (58 lines) and `ResidualPatternLab` (61) are two of the three thinnest
  labs on the site; merge them into one diagnostic bench where you *induce* a violation and read the
  plot.

**CH7 · Diagnostics** (4pp)
- *Depth*: leverage is given without `h_ii`, so it stays a vibe. With CH5's projection page it becomes
  "how much of the fit this one row owns" — the same object, twice.
- *Missing*: robust regression. RANSAC / Huber regression is the actual answer to the outlier pages
  and is never named.
- *Lab*: `InfluenceLab` — print the DFBETA when a point is dragged, so "influence" gets a number.

**CH8 · Evaluation** (3pp)
- *Depth*: R²'s two traps are missing — it is not comparable across datasets, and **test R² can be
  negative**. Readers meet negative R² in the capstones with no warning.
- *New page*: **"When R² lies"**, folding in adjusted R² properly (it is currently half a page).
- *Text*: *RMSE vs MAE* (307w) should end with the decision rule — RMSE if large errors hurt
  super-linearly, MAE if they hurt linearly — and it currently ends with a definition.

**CH9 · Fixing & optimizing** (4pp)
- *Depth*: **back-transform bias.** Fit on log(y), exponentiate, and predictions are biased low —
  Duan's smearing estimator. Practical, measurable, taught almost nowhere, and this track has the
  perfect slot for it.
- *Missing family link*: GLMs. "The response isn't continuous" points to logistic regression and stops;
  Poisson / count regression does not exist anywhere on the site (see §New tracks).

**CH10 · Inference** (3pp, tier 3)
- *Depth*: **no bootstrap.** The site has `BootstrapLab` — in the random-forests track. Inference here
  is entirely parametric, which makes the assumptions chapter look load-bearing when the bootstrap
  route would make it optional.
- *New page*: **"Intervals without the assumptions"** — bootstrap CIs, reusing `BootstrapLab`.
- *Proof*: prediction interval = confidence interval + σ² — the variance decomposition in three lines.
  The cleanest tier-3 moment available, and the page currently asserts the result.

**CH11 · In the wild** (6pp)
- *Text*: **the failure-mode gallery is off-voice.** "Congratulations. You've made it to the end",
  "This is a statistical crime" — the only second-person-scolding page on the site, and its five cards
  are prose blocks passed as `body` props with no diagnostic attached to any of them. Rewrite in house
  voice; give each trap the plot that detects it.
- *Structure*: *End-to-end: Overview* is a stub in front of three cases. Either fold it into Case A or
  give it the capstones' 4-beat contract framing, which is what it is gesturing at.
- *Missing*: a `DecisionPoint`. Three worked cases end and nothing asks the reader to commit.

---

### 1.2 Regularized regression (Ridge / Lasso / Elastic-net) — 26pp · 372 w/pg · 9 without a visual · 0 proofs · **0 PredictPrompts**

Structurally excellent (the seven-chapter arc is right) and textually thin: 11 pages under 350 words,
and pages carrying 8–16 `MathBlock`s at 290 words are formula sheets with a sentence between each.

**CH1 · Why regularize** (4pp)
- *Depth*: fine as an on-ramp. *Penalty vs constraint* (489w, 8 math) is the best page in the chapter
  and should be the model for the rest.
- *Visual*: the constraint-region picture exists as an inline SVG on one page — it should be a shared
  `NormBallLab` (67 lines today, one use) with a p-slider from L0.5 through L2, which makes the
  sparsity argument visual instead of assertive.

**CH2 · Ridge · L2** (5pp)
- *Depth*: *The closed-form solution* (290w) contains the best idea in the track — the SVD shrinkage
  factor `d²/(d²+λ)` — and **shows no picture of it.** One curve, with λ as a slider and the data's
  actual `d_j²` marked as ticks, converts the entire chapter's argument into a single image.
- *Lab*: that curve, as `ShrinkageSpectrumLab`. Highest-value new lab in the regression family.
- *Proof*: ridge is always invertible (positive-definiteness in three lines) is currently a `Callout`;
  it is a proof and the track has none.
- *Text*: *Ridge & multicollinearity* (394w) should carry the measured variance reduction from
  `scripts/` rather than the word "unstable".

**CH3 · The Lasso · L1** (5pp)
- *Depth*: *Solving the Lasso* (350w) names coordinate descent; the soft-threshold operator `S(z, λ)`
  is the whole algorithm and deserves its own figure (the flat-then-diagonal line).
- *Lab*: a **soft-threshold dial** — drag z, watch the output pin to zero. Minutes of work, and it
  explains sparsity better than the diamond picture does.
- *Text*: *Why L1 creates sparsity* (315w) gives the geometric answer only. The subgradient answer
  ("the penalty's slope doesn't vanish at zero") is one sentence and is what actually generalises.
- *Missing*: the Lasso's arbitrariness among correlated columns is deferred to CH4 by title but never
  demonstrated. One rerun with a different seed picking a different column would prove it.

**CH4 · Elastic-net** (3pp — the track's thinnest, 258–341w)
- *Depth*: the grouping effect is asserted. Show it: correlated triple, α swept 0→1, watch the three
  coefficients go from one-of-three to three-equal.
- *Lab*: `ElasticNetMixLab` already exists and is used twice — add that correlated triple as a preset
  rather than building anything new.
- *Text*: *Tuning the mix* (258w, 13 math) is the clearest formula-sheet page on the site.

**CH5 · Using it in practice** (4pp)
- *Depth*: **no cost page.** Path algorithms (LARS), warm starts and why `LassoCV` is cheap are
  half-covered in *The full path & warm starts* (339w) and never quantified.
- *New page*: **"Ridge, Lasso and the pipeline"** — the standardize-inside-the-fold rule with the
  leakage number attached. It is stated on *Standardize first* (354w) as a rule; the data-workflow
  track measures leakage but the two never meet.
- *Decision*: `Ridge vs Lasso vs Elastic-net: which when` (424w) is exactly where a `DecisionPoint`
  belongs and it ends with a paragraph.

**CH6 · Theory · go deeper** (4pp, tier 3)
- *Depth*: four MAP / James–Stein pages averaging ~374 words, **zero `<Proof>` blocks**, on a chapter
  whose entire job is proof. The MAP derivations are six lines each; write them out.
- *Visual*: Gaussian vs Laplace prior densities overlaid — one small SVG serves both pages and makes
  "the prior is the penalty" literal.
- *Depth*: **degrees of freedom** (341w) is the most under-served: `df(λ) = Σ d²/(d²+λ)` is the same
  shrinkage factor from CH2, summed. Say so, and the chapter closes a loop.

**CH7 · Apply it** (1pp) — correct as is; the capstone hand-off works.

---

### 1.3 Polynomial & basis-function regression — 14pp · 578 w/pg · 6 without a visual · 11 PredictPrompts

The best-balanced small track on the site: consistent length, a lab on most pages, PredictPrompt
almost everywhere. Its gaps are narrow.

**CH1 · Bending the line** (3pp)
- *Text*: *Polynomial regression* (238w) is the thinnest page and carries 16 MathBlocks — invert that
  ratio.
- *Depth*: the Vandermonde conditioning disaster is hinted at in CH2 but the *number* (condition
  number by degree) is never shown; three lines of script, and a decisive table.

**CH2 · The basis-function view** (5pp)
- *Depth*: strong. Missing: **the basis-function view is the kernel trick with the map written down** —
  the sentence that would connect this track to kernel ridge and SVR is absent from both ends.
- *New page*: **"When the basis gets infinite"** — one page, ending in a hand-off to kernel ridge. This
  is the throughline `/map` claims and nothing implements.
- *Text*: *Natural & smoothing splines* (582w) is the only page in the chapter with no lab;
  `SplineKnotsLab` (67 lines) should gain a "natural" toggle showing the linear tails.

**CH3 · Controlling flexibility** (3pp) — healthy. Only gap: degree selection by CV is shown, by AIC/BIC
is not, and `df` for a spline basis is the bridge to the regularization track's CH6.

**CH4 · In the wild** (3pp)
- *Missing*: `DecisionPoint` on *When to use it (vs kernels, trees)* (693w).
- *Depth*: extrapolation. A degree-9 fit just outside the data range is the most vivid warning in the
  whole regression family and it is not drawn anywhere.

---

### 1.4 Kernel ridge regression — 16pp · 476 w/pg · 10 without a visual · 0 proofs · **0 PredictPrompts**

Mathematically the densest regression track (19–37 MathBlocks/page) and the least illustrated of the
five. Every page has a Quiz; none has a prediction prompt.

**CH1 · From ridge to kernels** (4pp)
- *Visual*: *The kernel trick* (539w, 19 math, **no visual**) is the page most in need of a figure on
  the whole site: the 1-D → 2-D lift where a non-separable set becomes separable. It exists as a
  drawing in every textbook and not here.
- *Depth*: *The dual form of ridge* (468w, 36 math) — the n↔p swap is the entire point and is buried;
  it should open the page as one sentence with the two matrix shapes drawn to scale.
- *Lab*: a **similarity-matrix viewer** — hover a point, see its kernel row as a heat strip. Makes
  *Kernels as similarity* (526w) literal.

**CH2 · Kernel ridge in depth** (5pp) — the strongest chapter; `KrrTuningLab` and `LoocvLab` do real
work. Missing only: γ's effect on the Gram matrix *as an image* — the diagonal-dominance collapse when
γ is too large is why tuning fails, and it is invisible.

**CH3 · Theory & connections** (3pp, tier 3, 0 proofs)
- *Depth*: **the representer theorem is stated, not proved** (514w). It is a half-page argument
  (decompose into span + orthogonal complement, show the orthogonal part only hurts). The clearest
  missing proof on the site.
- *Depth*: *Kernel ridge & Gaussian processes* (453w) gives the mean and stops. The GP's **variance** is
  what makes the connection worth teaching — uncertainty bands drawn around a KRR fit would be a
  memorable figure and the only place the site ever draws predictive uncertainty.

**CH4–5 · In practice / In the wild** (4pp)
- *Depth*: *Scaling KRR to large n* (470w) names Nyström; the rank-vs-error tradeoff is never measured.
  One plot (rank r against test error and wall-clock) makes the page decisive.
- *Missing*: a `DecisionPoint` before *Kernel ridge vs SVR vs linear*.

---

### 1.5 Support vector regression — 16pp · 477 w/pg · 11 without a visual · 0 proofs · 1 PredictPrompt

Same profile as kernel ridge: correct, dense, unillustrated.

**CH1 · The ε-insensitive idea** (4pp) — the one well-served chapter (`SVRTubeLab`, `EpsilonLossLab`).
- *Depth*: *Soft margin: C & slack* (508w) has no lab and is where C is introduced; the tube lab should
  gain the C slider rather than a new lab being written.

**CH2 · The mechanics** (6pp — 4 of 6 pages have no visual)
- *Visual*: *The primal problem* (452w, 20 math) and *The dual & the kernel trick* (436w, 18 math) are
  the two heaviest unillustrated pages in the family. The primal deserves the picture of slack
  variables as vertical sticks poking out of the tube.
- *Depth*: **KKT conditions are the bridge** between the primal, the dual and "which points are support
  vectors", and they appear as symbols rather than as the three-case table they are. One table —
  inside tube / on tube / outside — labelled with α values, would carry three pages.
- *Depth*: *Solving the QP: SMO* (610w) explains the algorithm without ever showing two multipliers
  moving along their constraint line. A two-point animation is the entire idea.

**CH3–4 · In practice / In the wild** (6pp)
- *Depth*: *Kernel ridge vs SVR* (379w) is the decision page of two tracks at once and is the shorter
  of them. It should carry a measured head-to-head (same data, same γ: error, #SVs, fit time) — the
  numbers exist in `scripts/`, they're just not on the page.
- *Missing*: robustness is Case B's subject but Huber / quantile regression is never mentioned as the
  cheaper alternative.
- *Lab*: `NuSvrLab` is fragile by design (it needs the front-loaded ε grid to cover ν); that should be
  said on-page — "this guarantee is why the sweep is expensive" — rather than living only in memory.

---

## 2. Classification

**Structural note before the tracks.** The family outlines seven tracks and has built three. The
largest oddity on the site lives here: **support vector *regression* is a finished 16-page track that
teaches the primal, the dual, KKT and SMO — and there is no support vector *machine* track at all.**
SVR is the harder, rarer subject, taught first and alone. Three other pages (`knn/k-NN vs logistic
regression, SVM, trees`, `logistic/When to use it`, `boosting`) already compare against an SVM the
reader has never met.

### 2.1 Logistic regression — 25pp · 608 w/pg · 7 without a visual · 23 PredictPrompts · 17 `<Term>` · 0 proofs

The healthiest track on the site by pedagogy density: a PredictPrompt on nearly every page, the only
track that really uses `<Term>`, and an honest tier-3 chapter. Two structural gaps only.

**CH1 · The problem & the intuition** (3pp)
- *Visual*: *The sigmoid* (449w, 11 math) has no lab and no figure — the one page in the chapter where
  the picture *is* the content. `SigmoidLab` is imported on the page before it; move or share it.
- *Depth*: the link function is introduced as "we squash it" and only explained 20 pages later in the
  GLM page. One forward sentence would pay for itself.

**CH2 · Loss & training** (3pp)
- *Depth*: *The beautiful gradient* (404w) shows `(ŷ − y)x` and calls it beautiful without showing the
  thing that makes it beautiful — that it is **identical to linear regression's gradient**. Put the two
  side by side; it is the single strongest cross-track moment available and it is one line.
- *Missing*: no optimiser. Logistic regression has no closed form, so *how* it is fitted (IRLS /
  Newton, or plain GD) is skipped entirely. A short page here would also give the Optimization
  foundation its first customer.
- *Lab*: `LogLossLab` is used twice (here and in the MLE page) — good reuse, no change needed.

**CH3 · Reading the model** (3pp) — the best-executed chapter in the family; CodeOutput on all three.
- *Depth*: the only gap is **confounding**. "Coefficients, odds ratios & effect size" teaches reading
  a coefficient as an effect, and nothing warns that the reading is conditional on the model's other
  columns. The regression family has the same hole (§1.1 CH5).

**CH4 · Making it work in practice** (4pp)
- *Strong*: *When perfect separation breaks everything* (745w + `SeparationLab`) is one of the best
  pages on the site — a real failure, reproduced, then fixed.
- *Depth*: *Regularized logistic regression* (350w) is the thinnest page in the track and sits directly
  after it, where the fix for separation is the subject. It should carry the measured coefficient
  blow-up → shrinkage, reusing the separation lab's own data.
- *Missing*: class weights are taught (`ImbalanceLab`) but **resampling (SMOTE and friends) is never
  named**, and it is what practitioners actually reach for. One honest comparison — weights vs
  oversampling vs threshold move, same data, three numbers — would settle it.

**CH5 · Beyond two classes** (2pp)
- *Depth*: softmax is derived, but the **identifiability redundancy** (K logits, K−1 degrees of
  freedom) is skipped, and it is why implementations differ.
- *Visual*: a 3-class simplex/probability-triangle figure, with the reader dragging logits. Nothing on
  the site draws the probability simplex.

**CH6 · Probabilities you can trust** (3pp) — well built, reuses `CalibrationLab`, `RocLab`, `CostLab`.
- *Depth*: Platt scaling and isotonic regression are named as the fix; neither is shown fitting. One
  before/after reliability diagram, measured, closes it.
- *Overlap*: this chapter duplicates most of the Evaluation pillar. Worth an explicit cross-link both
  ways rather than two parallel treatments (see §0.3 #6).

**CH7 · Theory · go deeper** (4pp, tier 3, ~700 w/pg, **0 `<Proof>`**)
- The content is there and the primitive is not used. Four candidates, each a genuine half-page proof:
  MLE → log loss; convexity via the Hessian `XᵀSX ⪰ 0`; the GLM canonical-link result; and the
  naive-Bayes/logistic asymptotic comparison.
- *Visual*: *Convexity of the log-loss objective* has an SVG; the other three have none.

**CH8 · In the wild** (3pp) — the strongest closing chapter on the site (two cases, both reusing three
labs each). Missing only a `DecisionPoint` in each case, which is exactly the primitive the capstones
use for this job.

---

### 2.2 k-Nearest Neighbors — 36pp · 510 w/pg · 16 without a visual · **0 proofs, 2 PredictPrompts, 29 quizzes**

The most *complete* outline in the family — ten chapters, including a real tier-3 chapter and a
three-case wild chapter. Its problem is uniformity: 36 pages of near-identical shape (paragraphs +
code + quiz), four labs total, and almost no active recall. It reads like a well-organised reference
rather than a course.

**CH1–2 · Intuition / How k-NN predicts** (8pp, 275–465w — the thinnest stretch)
- *Depth*: *Classification by majority vote* (275w) and *The algorithm, end to end* (334w) are the two
  thinnest pages; both are procedure without consequence. What is missing across the chapter is **the
  tie**, **the distance-zero duplicate**, and **what happens at the boundary between three classes** —
  the cases that make the algorithm interesting.
- *Lab*: `KNNLab` appears once, on page 1. The chapter that explains *how it predicts* has no lab at
  all. It should be the same lab, with "show the k neighbours and their votes" turned on.

**CH3 · Choosing k** (3pp) — good. `KNNBoundaryLab` twice, `KNNChooseKLab` once.
- *Depth*: k and the effective number of parameters (n/k) is the bridge to model selection and is
  never stated.

**CH4 · Distance & weighting** (4pp)
- *Depth*: *The curse of dimensionality* (643w) is the most important page in the track and argues
  verbally. The measurable version — as d grows, the ratio (farthest − nearest)/nearest → 0 — is four
  lines of numpy and one plot, and it turns the chapter's central claim into a fact.
- *Lab*: a **dimension dial** showing that ratio collapsing. Reusable by PCA and by the neural tracks.

**CH5 · Making it work in practice** (4pp) — uniform, adequate, unillustrated.
- *Text*: four consecutive ~560-word pages with the same shape. Merging *Choosing the right metric*
  into *Distance metrics for k-NN* (CH4) would lose nothing and shorten the plateau.

**CH6 · Scaling k-NN: the search problem** (4pp) — the hidden gem of the track, and four SVGs already.
- *Depth*: no timing. Brute force vs k-d vs ball vs ANN is argued by structure and never by a
  measured curve against n and d — the one place the k-d tree's collapse in high d would become
  visible rather than asserted.
- *Lab*: a **search-cost bench**: n and d sliders, three methods, measured comparisons. Would be the
  most distinctive lab in the classification family.

**CH7 · Regression & other uses** (3pp) — solid, and the LOESS page is a real bridge to the polynomial
track that neither side links.

**CH8 · Theory · go deeper** (4pp, tier 3, 19–33 MathBlocks/page, **0 proofs**)
- *Depth*: the Cover–Hart bound (`R* ≤ R_1NN ≤ 2R*`) is stated with 23 MathBlocks and not proved,
  which is a shame — the two-line version (probability the neighbour's label disagrees) is famous
  precisely because it is short.
- *Visual*: the bound as a **picture** — Bayes error on the x-axis, the 1-NN band between R\* and 2R\* —
  is the single figure that would make the chapter land.

**CH9 · Strengths, weaknesses & kin** (3pp)
- *Good*: *k-NN vs k-means (the name trap)* is a genuinely thoughtful inclusion.
- *Missing*: the comparison pages compare against an **SVM that does not exist on the site** (see the
  family note above).

**CH10 · In the wild** (3pp) — Case A (digits) is the natural home for the one thing the track lacks: a
**visual** error gallery (which digits get confused, and which neighbours caused it).

---

### 2.3 Naive Bayes — 20pp · 643 w/pg · **16 of 20 without a visual** · 0 proofs · 3 labs

Textually the strongest of the three classification tracks (the flavours chapter runs 813–894 words a
page) and the least illustrated. The whole of CH3 — four pages, ~3,400 words, 61 MathBlocks — has no
figure, no lab, and no picture of a single distribution.

**CH1 · The generative idea** (4pp)
- *Visual*: **nothing in this chapter is drawn.** The generative/discriminative distinction is *the*
  idea that wants a picture: two class-conditional densities and the boundary they induce, versus a
  boundary drawn directly. `GenerativeDiscriminativeLab` exists — and is used once, sixteen pages
  later, in CH5. Move it here; CH5 can keep a second instance.
- *Depth*: *Bayes' rule as a classifier* (615w) treats the evidence term as a normalising nuisance.
  Saying why it can be dropped for argmax but **not** for calibrated probabilities would set up CH4's
  calibration page 12 pages early.

**CH2 · The naive assumption** (4pp)
- *Strong*: *Probabilities break, decisions survive* (`NaiveBayesConfidenceLab`) is the best idea in
  the track and the honest centre of it.
- *Depth*: the missing measurement is **how wrong the probabilities get, as a function of feature
  correlation.** Sweep ρ from 0 to 0.9, plot accuracy (flat) against Brier score / mean confidence
  (collapsing). That one chart is the track's thesis, and it does not exist.

**CH3 · The three flavours** (4pp — 3,400 words, **zero visuals**)
- *Visual*: each flavour needs its distribution drawn. Gaussian: per-class bell curves per feature.
  Multinomial: a word-count bar chart with the per-class rate. Bernoulli: presence/absence grid. Three
  small SSR SVGs, and the chapter stops being a specification.
- *Lab*: one **flavour bench** — the same dataset run through all three, with the mismatch (counts fed
  to Gaussian, say) visible as a scoring collapse. `Choosing the flavour` (863w) currently argues this
  in prose.
- *Depth*: Complement NB — the standard fix for imbalanced text — is not mentioned anywhere.

**CH4 · Making it work** (4pp) — the best-supported chapter (`SmoothingLab`, an SVG, three callouts).
- *Depth*: *Naive Bayes for text* (504w) is the thinnest page in the track and the most practically
  used; it stops before TF-IDF vs counts, and before the fact that NB-SVM-style baselines still win on
  small text corpora.

**CH5 · Where it stands** (4pp)
- *Strong*: *The hidden linear classifier* (863w) — showing that Gaussian NB with shared variance is a
  linear boundary — is exactly the kind of connection the site should make more of.
- *Depth*: *Naive Bayes vs logistic regression* (601w) cites the generative/discriminative tradeoff;
  the measurable version (NB wins at small n, LR overtakes as n grows) is a single learning-curve plot
  that would settle the argument. Currently the claim is made and not shown.
- *Missing*: `DecisionPoint` on *When to reach for Naive Bayes* (409w, the second-thinnest page).

---

### 2.4 The four unbuilt classification tracks

- **Support Vector Machines** — the largest single content gap on the site (see the family note). Most
  of the machinery is already written in SVR: the primal/dual, KKT, SMO and kernels transfer almost
  verbatim; what is missing is the margin story, the hinge loss and the geometry. `MarginLab` already
  exists (in learning theory). Estimated: ~20pp, of which perhaps 8 are adaptations.
- **Kernel methods** — currently split across kernel ridge (CH1) and SVR (CH2), so a dedicated track
  would be mostly consolidation plus Mercer's theorem, kernel construction rules, and the RKHS view
  that the representer theorem needs (§1.4 CH3).
- **Perceptron & online classifiers** — the perceptron exists in the neural family
  (`perceptron-to-mlp`), so the classification version should be the *online* story: mistake bounds,
  the perceptron convergence theorem (a real, short proof), passive–aggressive, and online logistic
  regression. It is also the natural home for streaming/regret ideas that nothing else covers.
- **Multi-class strategies** — largely written already inside logistic CH5; a track would add error-
  correcting output codes, hierarchical softmax, and the calibration-under-OvR problem.

---

## 3. Trees & ensembles

Family-wide: **0 proofs across 64 pages**, and only 12 PredictPrompts. The three tracks were built in
three consecutive days and share one shape — good outlines, adequate prose, and a steep drop-off in
visuals after the first chapter. The family's own subject (a tree is a *picture*) makes the visual
debt particularly costly here: 41 of 64 pages have nothing to look at.

### 3.1 Decision trees — 20pp · 590 w/pg · 11 without a visual · 0 proofs · 5 labs

**CH1 · Twenty questions** (3pp) — the strongest opening in the family; `DecisionTreeLab` (with the
tree diagram + checkerboard toggle) does real work.
- *Depth*: *Growing the whole tree* (673w) describes recursion in prose. The recursion is the one thing
  a **filmstrip** would settle: depth 1, 2, 3, 4 as four small partition pictures in a row. The site
  has this pattern already (`sail/LearningFilmstrip`) and it is unused outside RL.

**CH2 · Choosing a split** (4pp)
- *Visual*: *Gini, entropy & information gain* (392w) has an SVG; the impurity **curves** (Gini vs
  entropy vs misclassification over p) are the figure that explains why the choice barely matters, and
  why misclassification error is a bad splitting criterion. `ImpurityLab` exists — it is used once, in
  CH1, and never here where the comparison is the subject.
- *Depth*: *Missing values & surrogate splits* (745w, no visual, no lab) is unusually good content —
  almost nobody teaches surrogates — and is pure text. A small "primary split unavailable → surrogate
  agreement %" diagram would make it concrete.
- *Depth*: *Numeric & categorical splits* (727w) covers the mechanics; the **high-cardinality
  categorical bias** (a 50-level ID column wins every split) is the trap readers actually hit and
  deserves a measured demo.

**CH3 · Controlling complexity** (3pp) — well served (`PruningLab`, 21 MathBlocks on cost-complexity).
- *Depth*: the α-path — the sequence of subtrees as α rises — is described; drawn, it is one of the
  most satisfying pictures in ML. `PruningLab` should expose it as a path plot, not just a slider.

**CH4 · Beyond CART** (3pp)
- *Text*: *The algorithm family: ID3, C4.5, CHAID* (507w) is a history list. Either make it a
  comparison table with the *one* thing each changed, or fold it into a callout and reclaim the page.
- *Depth*: *Oblique & multivariate trees* (416w) — the picture (axis-aligned staircase vs one diagonal
  cut) is exactly the checkerboard/diagonal toggle `DecisionTreeLab` already has. Reuse it here.

**CH5 · Theory · go deeper** (2pp, tier 3, **0 proofs, no visuals, no labs**)
- This is the weakest tier-3 chapter on the site: two pages, both pure prose. *Why greedy?* (541w)
  asserts NP-hardness without citing or sketching it; *The bias–variance profile* (717w) argues in
  words what `BiasVarianceLab` could show in one screen.
- *New page*: **"How unstable is a tree, exactly?"** — retrain on bootstrap resamples, show the root
  split changing. It is the measured fact that the entire random-forest track is built on, and it is
  currently asserted at the start of that track instead of proved at the end of this one.

**CH6 · Strengths, weaknesses & kin** (3pp)
- *Depth*: *Feature importance & reading a tree* (449w) uses impurity importance without warning that
  it is biased toward high-cardinality features — the forest track raises this five chapters later
  (*Importance for correlated features*). The warning belongs at first use.

**CH7 · In the wild** (2pp) — strong; four CodeBlock/CodeOutput pairs on the Titanic case.
- *Missing*: a `DecisionPoint` before the reveal in each case.

---

### 3.2 Random forests — 21pp · 468 w/pg · 15 without a visual · 0 proofs · 5 labs

The thinnest prose in the family (seven pages under 350 words) against unusually ambitious theory
(Breiman's bound, 22 MathBlocks on *Why averaging works*).

**CH1 · The wisdom of many trees** (3pp)
- *Text*: *Bagging: training on bootstraps* (360w) is thin for the idea that names the method.
- *Depth*: the bootstrap's **63.2%** — the probability a row appears in a given bag — is the number that
  makes OOB make sense, and `1 − (1 − 1/n)^n → 1 − e⁻¹` is a two-line derivation. It would be this
  track's first proof.
- *Visual*: OOB is a beautiful picture (rows × trees grid, in-bag shaded, out-of-bag marked) and
  *Out-of-bag error* (534w) draws nothing.

**CH2 · What makes it a forest** (3pp)
- *Text*: *The random forest algorithm* (330w) is the track's second-thinnest page and is the page that
  states the algorithm.
- *Depth*: `mtry` (`max_features`) is the one hyperparameter that makes a forest a forest, and its
  effect on tree correlation is only argued via `DecorrelationLab`. Sweeping mtry against measured
  correlation *and* measured error — the classic U — would be the track's defining chart.

**CH3 · Tuning & variants** (4pp)
- *Text*: *The hyperparameters* (338w) and *Extremely randomized trees* (321w) are both stubs.
  ExtraTrees deserves the comparison that justifies it (faster, higher bias, lower variance — measured
  on one dataset, three numbers).
- *Missing*: **n_estimators has no cost page.** "More trees never hurts" is true for error and false
  for latency; nowhere does the site plot error and inference time against tree count together.

**CH4 · Forests for regression** (2pp) — `QuantileForestLab` is a genuinely distinctive asset.
- *Depth*: quantile forests give calibrated intervals; the **coverage check** (does the 90% interval
  contain 90%?) is the honest follow-through and is missing. This is also the only place on the site
  where interval coverage could be measured cheaply.

**CH5 · Theory · go deeper** (3pp, tier 3, 0 proofs)
- *Depth*: `Var = ρσ² + (1−ρ)σ²/B` is on the page with 22 MathBlocks and no derivation. It is five
  lines, and it is the whole family's thesis.
- *Depth*: Breiman's bound (439w) is quoted. Either derive the pieces (strength, correlation) or state
  plainly that it is a loose bound of historical interest — currently it reads as operative guidance.

**CH6 · Beyond prediction** (4pp) — the most interesting chapter and the least supported: proximities,
isolation forests, correlated-feature importance, all in 359–438 words.
- *Depth*: **permutation importance** is the fix for the impurity-importance bias and gets a fraction
  of a page; it should be its own page with the measured before/after on correlated columns.
- *Visual*: proximity matrices → MDS plot is a striking figure (a forest as an embedding) and is
  described in 359 words with nothing drawn.
- *Lab*: isolation forests have an SVG and no interaction; an anomaly-score playground with a
  contamination slider would carry the page.

**CH7 · In the wild** (2pp) — fine.

---

### 3.3 Boosting — 23pp · 556 w/pg · 15 without a visual · **0 proofs, 0 PredictPrompts** · 3 labs

The most *modern* content on the site (XGBoost's Newton step, LightGBM histograms, CatBoost's ordered
boosting) and the least interactive: 23 pages, three labs, no prediction prompts at all. It is also
the worst case of a site-wide defect: **8 of its 12 `<CodeOutput>` panels have no `<CodeBlock>` above
them.** `CodeOutput` is built to attach underneath a code block (negative top margin, no top border,
bottom-only rounding), so on its own it renders as a detached panel — and pedagogically it shows a
number with the code that produced it missing, which is exactly what house rule #1 promises never
happens. Site-wide this affects 20 pages: boosting 8, activations 4, backprop 3, perceptron→MLP 3,
random forests 1, housing capstone 1.

**CH1 · The boosting idea** (3pp) — `AdaBoostLab` + an SVG + a real hand-worked example. Good.
- *Depth*: "can a weak learner be boosted?" is posed as history (539w). Kearns–Valiant's question and
  Schapire's answer are a genuine tier-3 moment and the track's obvious first proof.

**CH2 · AdaBoost in depth** (3pp)
- *Depth*: *Why AdaBoost works: exponential loss* (490w, **28 MathBlocks**, no visual) is the densest
  formula-to-prose ratio in the family. The exponential-loss curve next to log-loss and 0–1 — one
  figure — explains both why it works and why it is outlier-sensitive.
- *Depth*: *Margins & resistance to overfitting* (550w) is a beautiful result (test error keeps falling
  after training error hits zero) and shows an SVG but **no margin distribution plot**, which is the
  actual evidence. Schapire's margin-distribution figure is reproducible in a few lines.
- *Text*: *Multiclass & real-valued boosting* (388w) is the thinnest page; SAMME vs SAMME.R deserves
  either proper treatment or demotion to a callout.

**CH3 · Gradient boosting** (4pp) — the conceptual core, and *Boosting as gradient descent* (718w) is
  the best explanation in the track.
- *Visual*: **the residual filmstrip is missing.** Round 1 fit, residuals, round 2 fit on residuals,
  running sum — four panels. This is the single most-requested picture in all of boosting and
  `GradientBoostingLab` (which is good) shows the end state rather than the sequence.
- *Depth*: *Loss functions & robustness* (492w) names Huber and quantile losses — the third meeting of
  Huber on the site (§1.1 CH2, §1.5) and still nowhere is it drawn.

**CH4 · Regularising the ensemble** (4pp)
- *Depth*: the learning-rate/n_estimators tradeoff (412w) is the central practical knob and has no
  lab. `BoostingEarlyStopLab` is on the next page but never varies η.
- *Missing*: subsample, colsample and min_child_weight are covered in 460 words as a list. A single
  **knob bench** (four sliders, one validation curve, measured) would replace three pages of prose and
  is the highest-value new lab in the family.

**CH5 · Modern gradient boosting** (4pp) — the most valuable chapter on the site that nobody would
  find, and every page is prose + CodeOutput.
- *Depth*: the Newton step (471w, 23 math) — showing `−g/(h+λ)` against the plain gradient step on one
  curve is a five-minute figure that makes XGBoost's whole advantage visible.
- *Depth*: histogram binning (461w) — the picture is literally a histogram: exact split candidates vs
  255 bins, with the measured speed and the measured accuracy cost.
- *Depth*: **CatBoost's ordered boosting** (498w) is the hardest idea here and the one with no figure at
  all; target leakage in target encoding is the reason it exists, and the data-workflow track already
  teaches leakage without linking here.

**CH6 · Theory & interpretation** (3pp, tier 3, 0 proofs)
- *Depth*: *Interpreting a boosted model* (529w) — the site has `ShapExplorerLab` (built for the
  housing capstone) and this page, the natural home for SHAP, does not use it.

**CH7 · In the wild** (2pp) — *Case: boosting beats the forest* carries the honest headline number
(LightGBM 0.865 > RF 0.842, default HistGBM 0.783). Keep it; it is the track's best moment.

---

### 3.4 Stacking & blending (unbuilt)

The family's fourth track and the natural capstone of the ensembling arc — and the only ensembling
idea the housing capstone actually *uses* (it ends on a stacked ensemble, R² 0.858). So the site
already ships the result of a method it never teaches.
- *Shape*: ~14pp. Out-of-fold prediction generation (the leakage trap is the whole subject — links
  straight to data-workflow), choice of meta-learner, blending vs stacking, multi-level stacks, when
  the gain is real and when it is 0.002.
- *Lab*: a **stacking bench** — pick base learners, watch the meta-learner's weights and the measured
  gain over the best single model. The honest version (often tiny gains for large complexity) is more
  useful than the textbook version.

---

## 4. Clustering

### 4.1 k-Means — 45pp · **348 w/pg** · ~~28 without a visual~~ **0** · 0 proofs · 3 PredictPrompts · 7 quizzes

> **Figures done 2026-09-15** (§0.3 #1). 28 → 0 blind, on measured data from the new
> `scripts/kmeans_cases.py`. Three things that pass changed, beyond the pictures: the track has
> **zero `CodeOutput` blocks across all 45 pages**, so none of its 39 listings ever commits to a
> result; Elkan is **93% fewer distance computations and 3× slower**, and the page's advice to rely
> on `algorithm="auto"` names an option removed in sklearn 1.3; and **"unequal cluster sizes" is
> not a failure mode** — 500/100/10 well separated scores ARI 1.000. The *depth* item below still
> stands, but there are now measured numbers to deepen it with.

The largest track on the site and the thinnest. Eleven chapters, 39 CodeBlocks, and an almost
mechanical page shape: ~320 words, one code block, one callout, next. Twenty-six pages are under 350
words. It is a genuinely comprehensive *outline* — k-medoids, Bregman divergences, Elkan's
acceleration, X-means, the gap statistic — filled in at reference-manual depth.

**This is the track where the most reader-facing value is available per hour of work**, because the
structure is already right; only the pages are empty.

**CH1 · The problem & the intuition** (5pp)
- *Text*: *Similarity & distance* (208w) is the shortest page on the site. It is also the concept the
  next 40 pages depend on.
- *Overlap*: *The curse of dimensionality* (450w) duplicates the kNN track's page of the same name
  (643w) with a different figure. Pick one home (kNN), and have the other link to it — the site has
  the `Backlinks` primitive for exactly this and uses it 23 times.
- *Visual*: `KMeansLab` appears on page 1 and then not again until page 18.

**CH2 · The k-means idea** (3pp)
- *Depth*: *The objective: inertia* (255w) states the objective without the fact that gives it teeth —
  **inertia always decreases as k grows**, so it can never be used to choose k. That single sentence is
  the reason the elbow chapter exists, five chapters later.

**CH3 · The algorithm** (6pp, 254–381w — the thinnest chapter on the site)
- *Visual*: **the alternating-assignment animation is missing.** k-means is the most animatable
  algorithm in the entire curriculum and *Assign & update (Lloyd's)* (254w) is code and prose. The site
  already has the pattern (`AnimatedRolloutLab` in RL); this is the same job.
- *Depth*: *Why it converges* (336w) waves at monotone decrease. The real argument — both steps
  minimise the same objective in turn, and the number of partitions is finite — is four sentences and
  is this track's obvious first proof (it also duplicates CH10's *Convergence as coordinate descent*,
  317w, which should be merged into it).
- *Depth*: *Computational complexity* (325w, 17 MathBlocks) is the correct place to teach O(nkdi) and
  then *measure* it. Elkan's acceleration (273w) is presented without a speed number, which is the
  only thing anyone wants from it.
- *Merge*: *Empty clusters & edge cases* and *Accelerated k-means* and *Mini-batch* are three ~300-word
  pages that would be one strong 900-word page with a measured comparison table.

**CH4 · Initialization** (3pp) — `KMeansPlusPlusLab` (509w) is the best page in the track.
- *Text*: *The initialization problem* (290w) and *Random restarts* (236w) are stubs in front of it.
  Fold both into the k-means++ page as its motivation, and use the reclaimed space for **the measured
  inertia distribution over 100 random inits vs 100 k-means++ inits** — which is the actual evidence
  and is currently absent.

**CH5 · Choosing k** (4pp) — three labs, the best-supported chapter.
- *Depth*: the honest finding is that **the elbow is usually ambiguous**. `ElbowLab` lets you see it;
  the page should say it, and the gap statistic page (284w) should be where the site admits how
  expensive the principled answer is.

**CH6 · Evaluating clusters** (3pp) — 306–404w, no visuals.
- *Depth*: ARI and NMI (377w, 9 math) are defined and not built. The contingency-table picture (true
  labels × cluster ids) is the one figure that makes both metrics obvious.

**CH7 · Preprocessing & practicalities** (4pp) — adequate; `ScalingLab` carries it.
- *Missing*: clustering after PCA (364w) is the direct link to the dimred family and links nowhere.

**CH8 · When k-means fails** (4pp) — should be the most visual chapter in the track and has one lab
and one SVG across four pages.
- *Visual*: the classic four-panel failure gallery (two moons, anisotropic, unequal variance, unequal
  size) is the canonical picture of this subject. `KMeansFailureLab` covers one case; the gallery page
  (332w) has **no figure at all**, which for a page titled "gallery" is the clearest single defect in
  the track.

**CH9 · Variants & the bigger family** (6pp, 302–355w) — six consecutive stub pages.
- *Restructure*: this should be **one comparison page plus two real pages.** k-medoids deserves depth
  (it is the robust answer, and PAM's cost is why nobody uses it); *k-means as EM* deserves depth (it
  is the bridge to the unbuilt GMM track). The other four are a table.

**CH10 · Theory · go deeper** (3pp, tier 3, **0 proofs**, 393/317/387w)
- NP-hardness is asserted; the coordinate-descent argument duplicates CH3; Bregman divergences (387w,
  13 math) is the genuinely interesting one — "k-means works for any Bregman divergence, and that is
  why the mean is the right centre" — and it is the shortest treatment of the three.

**CH11 · In the wild** (4pp) — `ColorQuantizeLab` is a great asset.
- *Depth*: the colour-quantization case (413w) should show the **measured** compression: k, file size,
  and a perceptual error number, side by side with the image. Half the value is sitting unused.

---

### 4.2 The three unbuilt clustering tracks

- **Hierarchical clustering** — the dendrogram is one of the most information-dense visuals in ML and
  the site has no version of it. ~14pp: linkages (single/complete/average/Ward) and what each one
  does to chains and outliers, cutting the tree, cophenetic distance, and the O(n²) memory wall.
  A **linkage-comparison lab** (same points, four dendrograms) would be one of the site's better labs.
- **DBSCAN & density-based** — the direct answer to k-Means CH8's failures, referenced there and
  absent. ~12pp: ε and minPts, the k-distance plot for choosing ε, core/border/noise points, HDBSCAN.
- **Gaussian mixtures & EM** — the most important of the three, because EM is a *method* the site
  never teaches and three other places need (k-means as EM, missing data in data-workflow, and any
  latent-variable model). ~18pp, including a real derivation of the E and M steps and the
  responsibility picture (soft assignment as colour blending) that k-Means CH9 gestures at.

---

## 5. Dimensionality reduction

### 5.1 PCA — 22pp · 460 w/pg · 4 without a visual · 0 proofs · 11 labs · 8 inline SVGs

The best-illustrated track outside RL and the capstones — nearly every page has a lab or a figure —
and still thin in words (11 pages under 400) with an unusually heavy math load (17–23 MathBlocks on
pages of ~360 words). The fix here is almost entirely *prose*, not pictures.

**CH1 · Seeing in fewer dimensions** (3pp) — 589–846w, three visuals. The strongest opening chapter on
the site; leave it alone.

**CH2 · The machinery** (4pp — 364–401w against 16–18 MathBlocks per page)
- *Text*: this is the formula-sheet stretch. *Eigenvectors: the axes of the cloud* (364w, 17 math) is
  the page where a reader either understands PCA or gives up, and it is under 400 words.
- *Depth*: the covariance matrix is introduced without the **units** problem that CH3's *Standardize
  before you PCA* then spends 633 words on. Say it once, here.
- *Lab*: `CovarianceEllipseLab` should let the reader *drag the data* and watch the ellipse and its
  axes follow. If it already does, the page never says so.

**CH3 · How many components?** (3pp) — good.
- *Depth*: *Choosing k in practice* (398w) gives the 95%-variance rule of thumb; the honest note that
  the rule is arbitrary, and that downstream task performance is the real criterion, is missing — and
  it is exactly what the capstone does.

**CH4 · PCA, the SVD & compression** (3pp, 326–361w, 9–21 math)
- *Depth*: **Eckart–Young is stated, not proved** (352w) — "the best low-rank approximation" is the
  strongest claim in the track and the tier-3 chapter that follows it doesn't return to it.
- *Depth*: *PCA is a linear autoencoder* (326w) is a lovely connection given a third of a page, and it
  is the only bridge from this family to the neural family. It should carry the diagram (encoder →
  bottleneck → decoder with tied weights) and forward-link to the architecture track.

**CH5 · Theory · go deeper** (4pp, tier 3, **0 proofs**) — has `RayleighLab` and `PowerIterationLab`,
which is more interactivity than any other tier-3 chapter on the site.
- *Depth*: *Two objectives, one answer* (372w) — max-variance and min-reconstruction-error being the
  same optimisation is the best proof opportunity in the track: three lines with Pythagoras.
- *Depth*: power iteration (522w) is the only page on the site that shows *how an eigenvector is
  actually computed*. It deserves the convergence-rate note (λ₂/λ₁) that explains why it is slow on
  near-degenerate spectra.

**CH6 · Reading it & its limits** (3pp)
- *Depth*: *Reading components: loadings & biplots* (380w) — sign ambiguity (a component and its
  negation are the same component) is the thing that confuses every first-time reader and is not
  mentioned.
- *Depth*: *PCA vs LDA, t-SNE & autoencoders* (433w, no visual) compares against three methods the
  site does not teach. It is the natural place for one figure: the same dataset under all four.

**CH7 · In the wild** (2pp) — uses `GuessSlider`, one of the few non-capstone pages to do so. Good.

---

### 5.2 The four unbuilt dimensionality-reduction tracks

- **Kernel PCA** — cheapest to build of the four: kernel ridge's CH1 already teaches the kernel trick
  and the Gram matrix, and PCA CH4 teaches the eigen-decomposition. ~12pp, mostly assembly, plus the
  one genuinely new problem (centering in feature space) and the pre-image problem.
- **Manifold learning (Isomap, LLE)** — the swiss-roll figure is the most recognisable picture in
  unsupervised learning and the site has nothing like it. ~14pp.
- **t-SNE & UMAP** — the highest-demand track on the whole site's outline, and the one with the most
  honest-numbers potential: perplexity sensitivity, the fact that **cluster sizes and distances in a
  t-SNE plot are not meaningful**, and run-to-run instability. A lab that re-runs t-SNE with three
  seeds side by side would be the most useful thing the site could say about it.
- **Random projections (Johnson–Lindenstrauss)** — short (~10pp) and the only one with a clean theorem
  to prove, which would give this family its first `<Proof>`. It also pairs naturally with the kNN
  track's curse-of-dimensionality page and the concentration strand of math foundations.

---

## 6. Neural networks

The family divides sharply in half. The first three tracks (perceptron→MLP, backprop, activations)
are the best-taught non-RL material on the site: ~900 words a page, real proofs, 24 labs between
them, `DecisionPoint` and `GuessSlider` used outside the capstones. The last three (architecture,
init & norm, nn-regularisation — 69 pages, all built in one sweep) are **the site's largest block of
unillustrated prose**: 66 of 69 pages have no visual, two of the three tracks have no code at all, and
every page in all three follows the identical `<Proof> · <Callout> · <Quiz>` template in the identical
order.

A reader who gets through backprop and starts architecture experiences the site changing genre.

**Family-level gap**: the family blurb promises "stack simple units into something that learns
features", and the six tracks stop at the MLP. Skip connections and residual blocks are taught
(architecture CH5) without a single convolution ever appearing. Either add a **convolutional
networks** track (the natural seventh, and the only one that makes "learns features" literal via
filter visualisation), or say in the family blurb that this is deliberately the MLP core.

### 6.1 Perceptron → MLP — 21pp · 928 w/pg · 7 without a visual · 6 proofs · 9 labs

Close to exemplary. Only narrow gaps.

**CH1 · The unit** (4pp) — `PerceptronRuleLab`, a real convergence proof, and a `DecisionPoint`.
- *Depth*: *A neuron is a linear model with a switch* (682w) is the only page in the chapter without a
  visual and it is the page that introduces the object. One annotated neuron diagram (inputs ×
  weights → sum → switch), reused as a motif in backprop, would pay for itself five times.

**CH2 · One neuron is not enough** (4pp) — the strongest chapter in the family. No changes.

**CH3 · The forward pass** (4pp)
- *Depth*: *Shapes, and how to keep them straight* (614w) is the most practically useful page in the
  track and has no figure. The shape-flow diagram (batch × features → batch × hidden → batch × out,
  with the weight matrices drawn to scale) is the figure; it is also the cure for the single most
  common beginner error.

**CH4 · Making it learn** (4pp) — `CapacityLadderLab` and a `DecisionPoint`; good.
- *Depth*: *The training loop* (838w) has two CodeBlocks and no picture of loss over epochs, which is
  the one output the loop produces.

**CH5 · What networks are and are not** (5pp) — three proofs, `WeightSymmetryLab`. Strong.
- *Depth*: *Where an MLP loses* (872w) is the only page here with neither lab nor figure, and it is the
  honest one. It should carry a measured head-to-head against gradient boosting on tabular data —
  which is both the true answer and a direct link to the trees family.

---

### 6.2 Backpropagation — 22pp · 854 w/pg · 12 without a visual · 5 proofs · 20 CodeBlocks

The most code-heavy track on the site and the best "how it actually works" writing. Its visual gaps
are concentrated in exactly the places where a picture is standard.

**CH1 · The problem** (4pp) — `ChainRuleLab` + the computational-graph SVG. Good.

**CH2 · The algorithm** (5pp — 4 of 5 with no visual)
- *Visual*: **the backward pass has one SVG and the four equations have none.** This is the canonical
  animated diagram of machine learning — forward values flowing right, gradients flowing left over the
  same graph — and the site draws it once, statically.
- *Lab*: a **two-layer graph you can step**: click "forward", see values; click "backward", watch each
  node's local gradient light up and multiply. Highest-value new lab in the neural family.
- *Depth*: *The memory bill* (1013w, with a proof) is excellent and unusual — keep. Gradient
  checkpointing is named; the tradeoff curve (memory vs recompute time) would make it decisive.

**CH3 · Doing it for real** (4pp) — five CodeBlocks on the bugs page; genuinely useful. No changes.

**CH4 · Training dynamics** (5pp) — `LearningRateSweepLab`, `ScheduleLab`.
- *Depth*: *Momentum & adaptive methods* (939w) covers momentum, RMSProp and Adam in one page, with no
  lab and no figure. This is the single most reused optimiser knowledge on the site and it has less
  space than *tanh & zero-centring*. It should be **three pages** (momentum as velocity; per-parameter
  scaling; Adam = both, plus the bias correction nobody explains) — or, better, it should move into the
  **Optimization foundation** (§0.3 #9) and be linked from here, from linear regression CH3 and from
  the RL tracks.
- *Visual*: the classic optimiser-trajectory comparison on one contour plot (SGD vs momentum vs Adam)
  is missing, and it is the figure that makes the whole subject click.

**CH5 · When gradients misbehave** (4pp) — `GradientFlowLab`; solid.
- *Depth*: *Why depth was hard for twenty years* (949w) is a history page with no visual, and it is the
  setup for the architecture track's skip connections. A gradient-magnitude-by-layer chart, with and
  without a residual connection, would link the two tracks in one image.

---

### 6.3 Activation functions — 21pp · 928 w/pg · 9 without a visual · 8 proofs · 12 labs

Well-built. `ActivationExplorerLab` is used on five pages, which is exactly the right kind of reuse.

**CH1 · What an activation is for** (5pp)
- *Depth*: *Saturation* (851w, no visual) is the mechanism behind half the track and shows no curve.
  The same explorer lab with the derivative overlaid is already on the previous page.

**CH2 · The squashing era** (4pp)
- *Depth*: *Sigmoid* (836w, **27 MathBlocks**) and *tanh & zero-centring* (936w, 19) are formula-dense
  with one lab between them. The zero-centring argument (why non-zero-mean activations cause zig-zag
  updates) is the kind of claim that needs the two-parameter zig-zag picture to land.

**CH3 · The ReLU family** (4pp) — `DyingReLULab` is a highlight.
- *Depth*: *SELU & self-normalising nets* (915w) is a dead end taught at full length; either add the
  honest note that SELU largely lost to BatchNorm+ReLU in practice, or compress it.

**CH4 · The smooth moderns** (4pp) — `ActivationBakeoffLab` is the right way to end a chapter.
- *Depth*: *GELU & Swish* (925w, 30 math) needs the one plot that shows how nearly identical they are;
  the reason anyone cares is that the difference is tiny, and prose cannot make that point.

**CH5 · Choosing & designing** (4pp) — *The activation playbook* (1300w) is the longest page in the
track. A **decision table** (task, depth, normalisation present → choice) would do the same job in a
quarter of the space, and the site has no such table anywhere.

**Track-wide**: four pages carry a `<CodeOutput>` with no `<CodeBlock>` (see §0.3 #8).

---

### 6.4 Architecture design — 27pp · **1281 w/pg** · ~~**26 of 27 without a visual**~~ **0 as of 2026-09-15** · 26 proofs · 1 lab · 3 CodeBlocks

The longest prose on the site, and the flattest. Every page: `<Proof>` + `<Callout>` + `<Quiz>`, in
that order, 27 times. The content is good — *Universal approximation, honestly* (1634w) and *The depth
tax* (1671w) are genuinely strong — but the track asks a reader to absorb ~35,000 words of neural
architecture with one interactive lab and no diagrams.

- **The single highest-value fix on the entire site**: this track is about *shapes*, and it contains
  no picture of a shape.

> **✅ 2026-09-15.** Done, and the work turned up a correctness problem rather than only a visual
> one. **Five pages asserted that a depth-20, width-16 ReLU net with He init reaches 0.750 test
> accuracy** — the number that motivates the whole skip-connections chapter. `architecture_cases.py`
> measures **0.9400** for that architecture and 0.750 appears nowhere in its output. A new
> hand-rolled trainer (`scripts/arch_depth.py`, written because sklearn's `MLPClassifier` cannot
> express a skip connection and replaces the init you hand it) found where the number really comes
> from: **depth 40 under plain SGD**. Under Adam there is no depth wall at all on this problem — 0.948
> at depth 2, 0.928 at depth 40 — and what grows instead is the *spread* between seeds, 0.0024 to
> 0.0510. All five pages re-attributed.
>
> Two further findings from the same script. `architecture_cases.py` section 8 printed
> "regularising a model that is too big recovers the gap" directly beneath numbers where L2 made the
> gap **worse** (0.0150 → 0.0163) — because 600 points of two moons cannot be overfit by any
> architecture. On 40 points the claim holds and is now measured: L2 at 1e-2 buys 6.7 points of
> held-out accuracy on a 4×128 net and −0.005 on a 1×2 one. And chapter 5's actual lesson turned out
> to be sharper than the one it was telling: at depth 20, activations **decay ×0.1** in a plain
> stack, **explode ×9,246** in a bare residual stack, and stay bounded (×7.3) only with BatchNorm
> inside the block. Under plain SGD the bare residual net scores 0.4700 from depth 12 on — below the
> majority class. A skip connection on its own is not a small win over a plain network; it is much
> worse. Skip *and* norm are one design.

**CH1 · The question everyone asks first** (4pp)
- *Visual*: *Parameters, and what they cost* (1185w, 37 math) — a layer-sizes → parameter-count
  calculator is ten lines of arithmetic and would replace pages of worked examples.
- *Lab*: a **network-shape sketcher**: set layer widths, see the diagram, the parameter count, the
  FLOPs and the activation memory update live. One lab that CH1, CH4 and CH6 could all reuse.

**CH2 · Width** (4pp, 1497–1865w, **zero visuals, zero code**)
- *Depth*: *The width plateau* (1628w) and *When to go wider* (1865w) make empirical claims about
  diminishing returns with no measured curve. One sweep (width vs validation error, one dataset, real
  numbers) turns 3,500 words of argument into a chart the reader trusts. The site's own house rule #1
  demands the number; this chapter argues without one.

**CH3 · Depth** (4pp, 1380–1742w, zero visuals)
- *Depth*: *Composition and feature hierarchy* (1380w, 30 math) is the page where "learns features"
  should become visible — and the family has no feature visualisation anywhere. Even a 2-D toy
  (`SpiralLab`'s hidden-layer representation, which already exists in perceptron→MLP CH2) plotted
  layer by layer would make the claim concrete.

**CH4 · Spending a parameter budget** (4pp) — has the track's only lab (`DepthVsWidthLab`).
- *Depth*: *Memory and compute budgets* (1427w, 28 math) is the site's only serious treatment of cost
  and it has no figure. A parameters/activations/gradients/optimiser-state stacked bar for one network
  is the picture, and it is also the thing that explains why training takes 4× inference memory.

**CH5 · Fixing depth: skip connections** (4pp, 939–1099w, 35–41 MathBlocks per page, **no visuals**)
- *Visual*: **`F(x) + x` is a diagram.** Four pages about a wiring pattern with no wiring drawn is the
  clearest single omission in the audit. One block diagram would serve all four pages.
- *Depth*: the loss-landscape-smoothing evidence (the well-known visualisation of a ResNet's landscape
  vs a plain net's) is describable in two sentences and drawable; the site has `LossLandscapeArt` and
  `LossSurface3D` already.

**CH6 · The diagnostic loop** (4pp)
- *Visual*: *Reading the learning curve* (1232w) — **a page about reading curves, with no curve.**
  A four-panel gallery (underfit / good / overfit / broken-LR) with "what to change" under each is the
  page. This chapter is the most obviously fixable in the track.

**CH7 · Putting it together** (3pp) — playbook, non-problems, checklist: 2,987 words of summary with
no artefact. A printable one-page decision tree would be worth more than all three.

---

### 6.5 Initialisation & normalisation — 21pp · 1100 w/pg · **20 of 21 without a visual** · **0 CodeBlocks** · 20 proofs · 1 lab

Same shape as architecture, with an additional problem: **there is no code at all in a track about
numerical behaviour.** *Xavier / Glorot* carries **55 MathBlocks** — the most math-dense page on the
site — and shows no distribution, no histogram, and no number.

**CH1 · The starting point matters** (4pp) — `InitScaleLab` is here, and it is the track's only lab.
- *Depth*: *The variance argument* (1258w, 27 math) derives forward/backward variance propagation.
  The payoff is a picture: **activation histograms layer by layer under three inits** (too small, too
  large, correct). That figure is the whole track in one image, and it does not exist.

**CH2 · The named initialisations** (4pp)
- *Depth*: *Xavier vs He, measured* (1095w) — the title promises a measurement and the page has no
  code block and no chart. This is a house-rule violation in the title itself.
- *Lab*: extend `InitScaleLab` into an **init bench**: pick activation + init, see per-layer activation
  and gradient histograms. Serves eight pages across this track and activations CH1.

**CH3 · Batch normalisation** (5pp, 1160–1387w, no visuals)
- *Depth*: *The internal covariate shift story* (1387w) is good history and correctly sceptical; it
  needs the Santurkar-style counter-evidence stated as a measurable claim rather than a narrative.
- *Visual*: BatchNorm's train/test asymmetry (*BatchNorm at test time*, 1189w) is where every practical
  bug comes from and is pure prose. A two-column diagram — batch statistics vs running averages — plus
  the classic "small batch size breaks it" measured curve, would fix the chapter.

**CH4 · Beyond batch normalisation** (4pp)
- *Visual*: the canonical normalisation figure — the (N, C, H, W) cube with the axes each method
  averages over, shaded — is one SVG that would replace most of four pages of prose. Its absence is the
  reason these four pages read as interchangeable.

**CH5 · The interaction** (4pp) — the best idea in the track (init × activation × normalisation as a
grid) and entirely verbal. **It is a grid. Draw the grid.**

---

### 6.6 Regularisation (dropout, weight decay) — 21pp · 1126 w/pg · **20 of 21 without a visual** · **0 CodeBlocks, 0 PredictPrompts** · 19 proofs · 1 lab

The third track of the same shape, and the one with the most genuinely surprising content: *Weight
decay is not L2 regularisation* (1071w, 36 math) is a claim most courses get wrong, and this track
gets it right — invisibly.

**CH1 · The gap** (4pp) — restates the train–test gap that the model-selection pillar and the
regularized-regression track both already teach. Three treatments of one idea; this one should be the
shortest and link out.

**CH2 · Weight decay** (4pp)
- *Depth*: the AdamW distinction is the track's best moment and needs the one figure that proves it:
  the same run with L2-in-the-gradient vs decoupled decay, weights plotted over time.
- *Overlap*: *L2 penalty on weights* (1275w) and the regularized-regression track's ridge chapter are
  the same mathematics twice. Link them; the neural version should keep only what is different
  (per-layer decay, no decay on biases/norm parameters — which is practitioner knowledge the site has
  nowhere else).

**CH3 · Dropout** (5pp) — has `RegulariserLab`, the track's only interactive element.
- *Visual*: dropout is a *mask*. A layer diagram with units greyed out per step, and the inverted-
  scaling arithmetic shown, is a small SVG that would carry five pages.
- *Depth*: *The ensemble interpretation* (945w) — the 2^n subnetworks argument deserves the small
  measured check (train with dropout, then average k sampled subnetworks, compare to the scaled
  deterministic pass).

**CH4 · Early stopping and data augmentation** (4pp)
- *Honest number already in hand*: memory records this family's "honest weight-decay/early-stopping
  nulls" — measured results where the technique did **not** help. Those nulls are exactly what should
  be on these pages, and the pages are pure prose.
- *Visual*: the validation curve with the patience window marked is one small chart and *Patience and
  the validation curve* (1098w) is named after it.
- *Depth*: augmentation (1165w) and mixup (958w) are both image-centric in a family that shows no
  images; either bring in a small image strip or reframe them for tabular/1-D data, which is what this
  site's readers actually have.

**CH5 · Combining regularisers** (4pp) — *BatchNorm as implicit regularisation* correctly connects to
§6.5. The closing page (*The neural networks family: what you now have*, 1269w) is a good idea and the
only page in three tracks without a proof; it should end with a `DecisionPoint`, not a summary.

---

## 7. Reinforcement learning

The most coherent family on the site: each track drops exactly one assumption from the last (the
model → the table → the tabular action space), and every track ends with a page literally called *The
throughline*. Prose is dense (552–1757 w/pg), PredictPrompt is everywhere (31/22/21/16/16), proofs are
real. Two systemic gaps: **almost no static figures outside the env-building track** (14/19/16/**24**
pages with nothing to look at), and `<Quiz>` has quietly disappeared from the two newest tracks.

### 7.1 MDPs, policies & value functions — 24pp · 636 w/pg · 14 without a visual · 13 proofs · 10 labs

The best-balanced RL track. Code + captured output on 21 of 24 pages.

**CH1 · The reinforcement learning problem** (4pp)
- *Visual*: *The agent–environment loop* (584w) is the one diagram every RL text opens with, and this
  page has code and no diagram — while `sail/EnvLoopFigure` (a good loop figure) exists three tracks
  later in env-building. Pull it forward.
- *Depth*: *Reward is the only signal* (867w) is the right opening argument; the reward-hacking
  counter-story now exists as a full page in env-building (*The cobra effect*, 3,846w). One forward
  link makes the family feel like one thing.

**CH2 · The Markov Decision Process** (4pp) — `GridworldMDPLab`, `DiscountLab`.
- *Depth*: *The discount factor* (548w, 27 math) — γ as a horizon (`1/(1−γ)` steps) is the intuition
  that makes every later γ choice legible, and the warehouse capstone devotes a page to choosing γ.
  The two should link.
- *Visual*: the MDP as a graph (states, actions, transition probabilities on edges) is drawn nowhere in
  the family, though `BackupDiagramLab` (next track) is close.

**CH3 · Policies and value functions** (5pp) — the mathematical heart; 45 and 40 MathBlocks on two
pages, with proofs. Well done.
- *Depth*: the only missing piece is **why `v` and `q` need each other** — a single figure showing the
  two backup diagrams side by side would answer it, and again `BackupDiagramLab` exists one track
  away.

**CH4 · Optimality** (4pp) — `MdpSandboxLab` and `ContractionFlowLab` are both strong.
- *Depth*: *The Bellman optimality equation* (449w) is the thinnest page in the track and states the
  most important equation in it.

**CH5 · Solving for values** (3pp) — fine.
- *Depth*: *How fast it converges* (564w, 36 math) — the γ^k contraction rate deserves the measured
  curve (sweep γ, plot iterations to tolerance), which is four lines on top of code already on the
  page.

**CH6 · Where the model ends** (4pp) — the hand-off chapter, and it works. No changes.

---

### 7.2 Planning (value & policy iteration) — 22pp · 552 w/pg · ~~19 of 22 without a visual~~ **0** · 7 proofs · 3 labs

> **Figures done 2026-09-15** (§0.3 #1). 19 → 0 blind. The track also gained its first script,
> `scripts/planning_cases.py`, which reproduces **34 of 34** published numbers. Two corrections
> fell out: prioritized sweeping shipped a queue doing **76 backups where 14 suffice** (62 of them
> changing nothing), which made the chapter's own thesis look like a 22% win instead of 86%; and
> the sampling page's four rollout values include a **3.5-sigma draw** that reads as a ranking
> where the truth is two exact ties.

The thinnest RL track in both words and pictures, and the one whose subject is most visual: every page
is about *a grid of numbers changing*. Twelve of its 22 pages sit under 500 words.

**CH1 · The planning problem** (4pp)
- *Text*: *Prediction vs control* (388w) is the track's shortest page and carries the distinction the
  whole family uses.

**CH2 · Policy iteration** (4pp) — `PolicyIterationLab` is the flagship and it is good.
- *Visual*: three of four pages have nothing. *Why it reaches the optimum* (470w) is a proof page with
  no picture of the monotone improvement it proves — a value-per-iteration staircase would do it.

**CH3 · Value iteration** (4pp) — `ValueIterationLab`.
- *Depth*: *Knowing when to stop* (405w, 34 math) gives the Bellman-error stopping bound and never
  plots the actual gap against the bound, which is the honest check (the bound is usually loose).

**CH4 · One loop, many schedules** (4pp, tier 3) — `GpiDialLab` is the right lab for the chapter's
thesis.
- *Depth*: *Prioritized sweeping* (456w) and *Asynchronous DP* (620w) are the two most practically
  important ideas here and both are prose + code. A **sweep-order visualiser** (heat the cells in the
  order they are updated, under three schedules) is one lab that would carry all four pages.

**CH5 · The limits of planning** (4pp)
- *Depth*: *The cost of a sweep* (471w) and *The curse of dimensionality* (488w) — the third and fourth
  pages on the site with this title (kNN, k-Means). Consolidate: one canonical treatment, three
  backlinks.

**CH6 · Where planning ends** (2pp) — good hand-off.

---

### 7.3 Learning (TD, Q-learning, SARSA) — 24pp · 696 w/pg · 16 without a visual · 11 proofs · 8 labs

Strong track; `AnimatedRolloutLab` and `CliffControlLab` are two of the site's best labs.

**CH1–2 · Learning without a model / Monte Carlo** (8pp)
- *Visual*: the MC-vs-TD backup diagram contrast is the chapter's whole point and `BackupDiagramLab`
  is used once, on page 2.
- *Depth*: *The trouble with Monte Carlo* (938w) argues variance verbally; the measured version (return
  variance vs episode length) is cheap and would make the TD chapter's payoff land harder.

**CH3 · Temporal-difference learning** (4pp) — the best chapter in the track.
- *Depth*: *What TD converges to* (688w) with `StepSizeFloorLab` is excellent and honest. Keep.

**CH4 · Model-free control** (4pp) — `AnimatedRolloutLab`, `CliffControlLab`. No changes needed.

**CH5 · On-policy, off-policy & bias · CH6 · Unifying & bridging** (8pp) — importance sampling, maximization bias
(`MaxBiasLab`), n-step (`NStepDialLab`), TD(λ).
- *Depth*: **eligibility traces have no visual.** TD(λ)'s trace decaying backwards over visited states
  is one of the most beautiful animations in RL and the site describes it. The `AnimatedRolloutLab`
  machinery already exists to show it.
- *Depth*: importance sampling's variance explosion (the product of ratios) deserves the measured
  blow-up — it is the reason ordinary IS is unusable, and it is currently a caution rather than a
  number.

---

### 7.4 Function approximation — 24pp · 712 w/pg · ~~**24 of 24 without a visual**~~ **0 as of 2026-09-15** · ~~0 labs~~ 1 · 8 proofs · 25 PredictPrompts

The only complete track on the site where **every single page has no lab, no figure and no inline
SVG.** It compensates with code + captured output on all 24 pages, so it is not shallow — but it is
the track that contains Mountain Car, tile coding, Baird's counterexample and DQN, and it draws none
of them.

> **✅ 2026-09-15.** Every chapter below now has the figure the note asks for, from
> `scripts/fa_figures.py` — a companion to `fa_cases.py` that runs the same shipped `FA_SETUP` code
> and prints the *series* a figure needs rather than the summary statistic. Its arrays are written
> into `figures/fa/data.generated.ts` by `scripts/fa_emit_data.js`, so nothing is transcribed by
> hand. New this pass: the value-function staircase (the approximation floor, drawn), the tile-coding
> diagram (offsets computed with the shipped `TileCoder`'s own rule), Baird's seven states plus the
> divergence curve, Mountain Car's cost-to-go surface and greedy-action map, the triad diagram, the
> DQN wiring, and the replay scatter. `MaxBiasLab` is reused on *Double DQN*, as this note asked —
> the track's first lab. One new measured claim worth knowing: the **TD fixed point is 2.15× worse
> than the VE optimum** (0.1167 against 0.0544) for the same ten-group aggregation, which the
> *Where TD settles* page previously stated only as two RMSE numbers.

Every chapter below has a picture that is standard in the literature and absent here.

**CH1 · Why the table has to go** (4pp)
- *Visual*: the table-to-function transition (a grid of cells fading into a smooth surface).
- *Depth*: *Gradient descent on values* (1142w, **53 MathBlocks**) is the densest page in the family;
  it needs the semi-gradient caveat drawn (which part of the gradient is dropped, and why).

**CH2 · Linear methods & features** (4pp)
- *Visual*: **tile coding is a picture of overlapping grids.** *Coarse coding & tile coding* (681w)
  explains offset tilings in prose. One SVG of three offset tilings and the active tiles for one point
  is the entire concept.
- *Lab*: a **tiling designer** — number of tilings, tile width, offsets → see the resulting
  generalisation footprint. `FA_SETUP` already ships a `TileCoder`, so the maths exists.
- *Depth*: *The resolution dial* (614w) is the only page in the track with no MathBlocks and is about a
  dial — it should *be* a dial.

**CH3 · Control with approximation** (4pp)
- *Visual*: **Mountain Car's cost-to-go surface** is the single most famous figure in Sutton & Barto,
  the page is called *Mountain Car: what it actually learned* (801w), and the surface is not drawn.
  The site already has `LossSurface3D` and `DescentSurface3D` to build on.
- *Lab*: the width dial (801w) is already a measured result with a surprise in it (per memory) —
  it deserves the interactive version.

**CH4 · The deadly triad** (4pp, tier 3) — the best-argued chapter, and the numbers are already
measured (Baird diverging 68.6×).
- *Visual*: **Baird's counterexample is a 7-state diagram** and a divergence curve. Both are trivial
  SVGs and both are missing; the 68.6× number currently appears as text.
- *Depth*: a two-axis diagram of the triad (bootstrapping × off-policy × approximation, with the
  dangerous corner marked) would replace most of *The three ingredients* (608w).

**CH5 · Deep Q-Networks** (5pp) — the most important chapter in the RL family, since the warehouse
capstone and the env-building track both build on it.
- *Visual*: the DQN architecture diagram (online net, target net, replay buffer, the copy arrow) is
  standard and absent. *DQN, assembled* (592w) is the second-thinnest page in the track and is the
  assembly page.
- *Depth*: *Experience replay* (746w) — the correlation-breaking argument wants the picture of
  consecutive vs sampled transitions. *Target networks* (567w) wants the measured instability without
  them, which the env-building track's own runs could supply.
- *Depth*: **Double DQN** (763w) has the overestimation story; `MaxBiasLab` from the learning track is
  exactly the right lab and is not reused here.

**CH6 · Practice & limits** (3pp) — *Reading a learning curve that lies* (912w) is a genuinely
excellent page and, inevitably, contains no learning curve.

---

### 7.5 Building environments from scratch — 27 of 40pp · **1757 w/pg** · **0 without a visual** · 47 lab instances

The reference standard for the whole site: decision records on every choice, bespoke labs per page
(`FireRuleLab`, `CobraLab`, `ValuesDialLab`, `ClockRatioLab`…), 31 PredictPrompts, and pages running
2,000–3,800 words. Nothing here needs *depth added*. The notes are about completion and consistency.

**Known incomplete work** (carry-over, not new findings)
- *World 2 · **Training the crew: DQN vs PPO*** — the page exists (1833w) with `RaceLab` mounted, but
  the full race (DQN 1M ×3 + PPO 2M ×3) was never run: `fire/data/raceCurves.ts` has zero runs and the
  RESULTS and CLOSING sections are empty. The working DQN config is dueling head + 3-step returns +
  200k replay, held-out 0.68 village damage / 79% saved / return −84.6 vs the hand-written chief's
  −92.3. The prototype log's "DQN wins per sim step" verdict is in doubt and should not be written up
  until the race runs.
- *World 2 · What the crew learned* — unbuilt, and it is the payoff page for six built pages.
- *World 3 · Boss fight* (11pp) and *The throughline* (1pp) — unbuilt.

**Consistency notes**
- **Zero `<Quiz>` in 27 pages.** Deliberate or not, this is the largest instance of §0.3 #6.
- **PPO is named in a page title and taught nowhere.** The policy-gradient track does not exist, so
  the comparison page has to teach PPO from scratch or lean on a reader who has not met it. Whichever
  it does, say so on the page.
- *The cobra effect* (3,846 words) is the longest page on the site by a wide margin. It earns it, but
  it should probably be two pages.

---

### 7.6 The three unbuilt RL tracks

- **Policy gradients, actor–critic & PPO** — the highest-priority unbuilt track on the site. It is a
  *prerequisite of a page that already ships* (§7.5), the RL family's most conspicuous hole, and the
  user has already confirmed actor–critic belongs here. ~24pp: the score-function trick and its
  derivation (a real proof), REINFORCE and its variance, baselines → advantage, actor–critic, TRPO's
  question and PPO's clipped answer, plus the continuous-action story the whole family currently
  lacks. Labs: a **clipped-objective dial** (watch the ratio get clipped), and a **variance-of-the-
  gradient-estimator** bench with and without a baseline.
- **Model-based RL & search (Dyna, MCTS)** — closes the loop back to the planning track, which ends
  with a page called *Planning vs learning* and then goes nowhere. ~18pp. MCTS's four phases are the
  most animatable thing in RL and nothing on the site is like it.
- **Policy search without gradients (neuroevolution)** — already specced in `docs/neuroevolution-plan.md`
  (hill climbing → ES → GA → NEAT) and tied to the planned Capstone B. Lowest priority of the three,
  but the cheapest to make visually distinctive (population clouds, fitness landscapes).

---

# Part two · Cross-cutting pillars

## 8. The data workflow — 28pp · 823 w/pg · 12 without a visual · 15 labs/figures · 2 proofs

The most *grown-up* writing on the site and the only track outside the capstones that uses
`DecisionPoint` (5×) and `GuessSlider`. Seven chapters, consistent length, no stubs. Its gaps are
about reuse and evidence, not structure.

**CH1 · Before you model** (4pp)
- *Depth*: *What is one row?* (1099w) is the sleeper page of the site — the unit-of-analysis question
  causes more real damage than any algorithm choice. It deserves a second worked case (a time series,
  where "one row" is genuinely ambiguous).
- *Visual*: only *The workflow is a loop* has a figure. The loop diagram should then reappear, with
  the current stage highlighted, as a small motif at the top of each of the seven chapters — cheap,
  and it would make a 28-page pillar navigable.

**CH2 · Framing** (4pp) — two `DecisionPoint`s; the strongest framing material anywhere on the site.
- *Depth*: *Designing the label* (747w) covers label definition; **label noise** — how much of it your
  model will happily fit, and how to detect it — is absent and is the natural companion.

**CH3 · Meeting the data** (4pp) — `DistributionLab`, `SimpsonsParadoxLab`.
- *Depth*: *Sanity checks that catch disasters* (884w) is a list of checks; it should ship an actual
  reusable check function (the site has `CodeBlock` with Run — this is the ideal page for a snippet
  readers take away).
- *Missing*: target leakage via **time** gets a full treatment in CH4, but the simplest EDA check for
  it (plot each feature's relationship with the target over time) is not shown.

**CH4 · Data quality & leakage** (4pp) — the best chapter in the pillar. `MissingnessLab`, `LeakageLab`,
a proof, and a `DecisionPoint`.
- *Depth*: MAR/MCAR/MNAR (933w, 24 math) is properly done; the **measured** consequence — how much
  each imputation strategy costs under each mechanism — would make it decisive and is a small script.
- *Cross-link*: this chapter is the reason CatBoost exists (boosting CH5) and the reason
  cross-validation must wrap preprocessing (model-selection CH2). Neither links here.

**CH5 · Preparing features** (4pp) — reuses `CategoricalFeaturesLab` and `FeatureScalingLab` from
linear regression, which is exactly right.
- *Depth*: **target encoding** is where leakage most often enters a modern pipeline and it gets a
  fraction of *Encoding categoricals* (832w). It deserves its own page with the out-of-fold construction
  drawn — and it is the missing link to CatBoost's ordered boosting.

**CH6 · From baseline to better** (4pp) — `ErrorAnalysisLab`, `GuessSlider`, a `DecisionPoint`.
- *Depth*: *Start with a baseline* (485w) is the thinnest page in the pillar and states the most
  repeated advice in it. It should carry the capstones' actual baselines as a table (housing 0.653,
  asteroid 0.29 PR-AUC, warehouse −816) — three real starting points, already measured.

**CH7 · Beyond the notebook** (4pp) — `DriftLab`, a `DecisionPoint`.
- *Depth*: *Reproducibility* (525w) is the second-thinnest page and the site itself is the best case
  study of it (house rule #1, the `scripts/` directory, seeds written down). Say so.
- *Missing*: nothing on the site covers **cost of being wrong in production** — latency budgets,
  retraining cadence, rollback. *Feedback loops* (864w) is adjacent and could absorb it.

---

## 9. Evaluation & metrics — 10pp · 677 w/pg · 1 without a visual · **9 labs** · **0 CodeBlocks** · 0 proofs

Proportionally the best-equipped track on the site: nine pages, nine labs, a PredictPrompt and a Quiz
on every one. It is also the smallest pillar, and the only track with labs on every page and no code
on any page.

- **The structural problem**: this pillar and logistic regression CH6 teach the same five subjects
  (threshold, confusion matrix, ROC/PR, calibration, cost) at similar depth, with the *same four labs*.
  Neither links to the other. Decide which is canonical — the pillar should be — and have the track
  link out with only the logistic-specific parts kept.

**CH1 · When one number lies** (3pp) — excellent. No changes.

**CH2 · Grading the whole model** (3pp)
- *Depth*: the missing page is **ROC vs PR under imbalance**, which the asteroid capstone teaches
  properly (it is the reason that capstone reports PR-AUC) and this pillar mentions in passing. The
  figure exists: `figures/RocVsPr.tsx`, built for the capstone and unused here.
- *Depth*: *Calibration* (811w) — Brier score and its decomposition are the quantitative version of
  the reliability diagram and are not named.

**CH3 · Measuring a regressor** (2pp)
- *Depth*: two pages for all of regression evaluation. Missing: MAPE and its asymmetry, quantile loss
  (which random forests CH4 uses), and the fact that **R² and RMSE rank models identically on the same
  test set** — which is the thing that makes most of the argument moot.

**CH4 · Trusting the estimate** (2pp)
- *Depth*: this is where **statistical significance of a model comparison** belongs — paired tests
  across folds, and the honest note that a 0.002 AUC difference across 5 folds is noise. Nothing on
  the site says this, and every capstone and bake-off page implicitly needs it.
- *New page*: **"Is this difference real?"** — the highest-value single missing page in the pillars.

**New chapter worth adding**: *Evaluating without labels* — proxy metrics, human review, and A/B
tests. The workflow pillar's CH7 assumes it; nothing teaches it.

---

## 10. Model selection — 16pp · 569 w/pg · 8 without a visual · 4 labs · **1 CodeBlock** · 0 proofs

A well-shaped track that reads like lecture notes: five SVGs (the best-illustrated pillar chapter is
CH2) and almost no code or interactivity after it.

**CH1 · The selection problem** (4pp)
- *Strong*: *The selection trap* (814w) — using the test set to choose, then reporting it — is the
  central sin and is well told.
- *Depth*: *Choosing among models* (478w) and *What you're actually choosing* (491w) are near-duplicates
  in the same chapter; merge and use the space for the **measured** version of the trap (select on
  test across 20 candidates, report the optimistic bias).

**CH2 · Validation done right** (4pp)
- *Text*: **"How many folds?" is 392 words carrying 35 MathBlocks** — the most extreme ratio on the
  site. The bias–variance tradeoff of k is a real, plottable result (k against estimate bias and
  variance, measured) and it is given as algebra.
- *Depth*: *Nested cross-validation* (835w) is the only page with code and it is correct; it should
  close with the cost multiplier stated plainly (k_outer × k_inner × candidates).
- *Missing*: **grouped and time-series splits** get one page at the end (*When your data isn't
  i.i.d.*, 528w). Given how often this is the actual failure, it belongs in this chapter with a figure
  of each split type — the single clearest missing figure in the pillars.

**CH3 · Controlling capacity** (4pp)
- *Overlap*: *Regularization as capacity control* (540w) and *Early stopping* (459w) are third and
  fourth treatments of subjects covered at length in regularized-regression and nn-regularisation.
  This track's version should be the short, general one that links out.
- *Depth*: *Information criteria: AIC, BIC & MDL* (783w, 21 math) is the only home for AIC/BIC on the
  site, and several tracks (polynomial CH3, k-Means CH5's X-means) need it. Give it the comparison
  table (what each penalises, when they disagree) and backlink from both.

**CH4 · Selecting in the real world** (4pp)
- *Strong*: *The one-standard-error rule* (472w) is good, practical and rarely taught.
- *Depth*: it needs the picture — the CV curve with the error bars and the 1-SE choice marked — which
  is exactly what `LearningCurveLab` on the previous page could render with one more series.

---

# Part three · Foundations & theory

## 11. Math foundations — 34pp · **368 w/pg** · 20 without a visual · **0 proofs** · **0 CodeBlocks** · 13 labs

Tier 0, the spine under everything, and the site's clearest case of **depth inverted**: 34 pages
averaging 368 words while carrying 10–20 MathBlocks each. *The dot product & projection* is 286 words
and 19 MathBlocks. These are formula cards with commentary.

**The one structural point**: a mathematics track with **zero `<Proof>` blocks** is the site's sharpest
internal contradiction, since `<Proof>` was built precisely so the mathematics could be optional-depth.
Every one of these pages should end with a proof block that most readers skip.

**CH1 · Linear algebra** (10pp, 286–549w)
- *Depth*: the chapter teaches objects, not *why they are the objects ML uses*. Each page should end
  with one line naming where it is needed: dot product → every linear model's prediction; rank →
  multicollinearity; SPD → covariance and kernels; SVD → PCA and ridge's shrinkage factor.
- *Visual*: *Matrix multiplication & composition* (295w, 19 math) has no figure, while
  `MatrixTransformLab` sits on the page before it. The composition of two transforms is the animation.
- *Depth*: **the four fundamental subspaces** never appear, so linear regression's projection picture
  (§1.1 CH5) has no foundation to link back to.

**CH2 · Calculus & optimization** (8pp)
- *Depth*: this chapter is the **stub of the missing Optimization track** (§0.3 #9). *Gradient descent*
  gets 342 words here, ~2,000 in linear regression CH3, and more in backprop CH4 — three partial
  treatments and no canonical one.
- *Depth*: *Duality, in one page* (341w) is asked to support SVR CH2 and kernel ridge CH1, both of
  which are dual-form tracks. One page is not enough; the KKT conditions in particular (§1.5 CH2)
  should live here.
- *Strong*: *Subgradients & non-smooth objectives* (535w) is the right foundation for the Lasso, and
  the Lasso track does not link to it.

**CH3 · Probability** (8pp, 293–340w except the CLT page)
- *Depth*: *Expectation & variance* (296w, 16 math) — the variance decomposition
  `Var(X) = E[X²] − E[X]²` and the law of total variance are the machinery behind bias–variance,
  prediction intervals, and the forests bound. All three later pages re-derive fragments of it.
- *Visual*: only two pages of eight have anything. Distributions are the most drawable subject in the
  chapter and `DistributionLab` appears once.
- *Depth*: *Moment-generating functions* (328w) exists solely to support Chernoff in CH4 and says so
  nowhere.

**CH4 · Concentration inequalities** (4pp, tier 3) — the one chapter with a clear job (feeding learning
theory) and it does it.
- *Depth*: Hoeffding (330w, 20 math) is the single most-used inequality on the site (learning theory
  uses it five times) and is the third-shortest page in the chapter. It deserves the picture: the tail
  bound vs the true tail, with n rising.
- *Lab*: a **concentration dial** — n up, watch the empirical mean's spread collapse against the bound.
  One lab serving four pages and half of learning theory.

**CH5 · Information theory** (5pp)
- *Depth*: cross-entropy and KL (359w) is the loss function of half the site (logistic regression,
  softmax, every classifier) and gets under 400 words. The connection — **minimising cross-entropy is
  maximising likelihood** — is the single most useful sentence and is not on the page.
- *Depth*: *Bregman divergences* (516w) duplicates k-Means CH10's page of the same name. One canonical
  home (here), one backlink (there).

---

## 12. Learning theory — 20pp · 810 w/pg · 7 without a visual · **14 proofs** · 7 labs

The best-executed tier-3 material on the site, and the proof of what `<Proof>` is for. Seven labs
(`ShatteringLab`, `RademacherLab`, `UnionBoundLab`, `SampleComplexityLab`, `MarginLab`,
`StabilityLab`, `EmpiricalRiskLab`) is more interactivity than most tier-1 tracks. Little to fix.

**CH1 · Generalization** (5pp)
- *Text*: *Finite hypothesis classes* (1015w, **73 MathBlocks** — the most on the site) is where a
  reader will stall. Splitting it into the counting argument and the resulting bound would help.

**CH2 · The PAC framework** (4pp) — well done; `SampleComplexityLab` is the right lab.
- *Depth*: the one missing practical note — **these bounds are vacuous for real networks** — arrives
  only in CH5's *When the bounds break* (1268w). A forward pointer at the start of CH2 would keep an
  honest reader on board.

**CH3 · Measuring capacity** (5pp) — the strongest chapter. `ShatteringLab` and `RademacherLab` are
excellent.
- *Depth*: *The growth function & Sauer's lemma* (571w, 68 math) is the densest-per-word page here;
  the combinatorial argument deserves the induction drawn as a small table.

**CH4 · Margins** (3pp) — `MarginLab` lives here, and it is also the lab the unbuilt **SVM track**
(§2.4) will need. Worth knowing before that track is planned.
- *Depth*: *Why boosting doesn't overfit (usually)* (1202w) is the best cross-family page on the site.
  The boosting track's own margin page (§3.3 CH2) does not link to it.

**CH5 · Stability & where the theory ends** (3pp) — the honest closer. Keep.
- *Missing*: modern generalisation puzzles (double descent, interpolation, benign overfitting) are the
  live version of this chapter's question and appear nowhere on the site. One page — **"When more
  parameters stopped hurting"** — would connect learning theory to the neural family, which currently
  has no theoretical hook at all.

---

## 13. Optimization (unbuilt — 4 outlined tracks, 0 pages)

The largest structural hole on the site. Two of `/map`'s seven throughlines point here
(Optimization → Regression, Optimization → Neural networks) and both land on a family with nothing to
read. Meanwhile the same material is taught three times: linear regression CH3 (~2,000w),
backprop CH4 (~4,800w), math-foundations CH2 (~2,900w).

Recommended shape — build **one** track first and re-point the duplicates at it:

- **Gradient descent, properly** (~16pp): the update rule, step size and the `2/L` stability bound,
  convergence on quadratics (a real proof), condition number and why scaling matters, line search,
  convergence rates for convex/strongly-convex/non-convex, and what "converged" means. This is the
  track that linear regression CH3, backprop CH4 and every RL track would link to.
- **SGD, momentum, Adam** (~16pp): noise as a feature, batch size, momentum as velocity, per-parameter
  scaling, Adam and its bias correction, AdamW (which nn-regularisation §6.6 already teaches without
  a home), warmup and schedules. The optimiser-trajectory figure (§6.2 CH4) belongs here.
- **Convex vs non-convex landscapes** (~12pp): convexity as a guarantee, saddle points and why they
  matter more than local minima in high dimensions, plateaus, and the loss-landscape visualisations
  the site already has art for (`LossLandscapeArt`, `LossSurface3D`, `DescentSurface3D`).
- **Coordinate descent** (~10pp): the Lasso's actual solver (regularized-regression §1.2 CH3 needs it),
  k-means as coordinate descent (§4.1 CH10 needs it), and block-coordinate methods. The cheapest of
  the four and the one two existing tracks already depend on.

---

## 14. Start here — 5pp · 425 w/pg · 4 without a visual

The on-ramp, and the first thing a new reader sees after the landing page.

- *Visual*: one lab (`LineOfBestFitLab`) across five pages. *The three kinds of learning* (427w) is a
  three-way distinction with no picture — three tiny panels (labelled data → prediction; unlabelled
  data → structure; environment → reward) would be the site's cheapest high-traffic figure.
- *Depth*: *Every model is three choices* (470w) is the best idea in the on-ramp (it is the frame the
  whole site is built on) and it is 470 words. It should name the three choices against one worked
  example, and then show the same three choices for a tree, a k-means run and a policy — so the frame
  is proved, not asserted.
- *Structure*: *Pick your path* (326w) ends the on-ramp with a quiz and no route. It should end with a
  `DecisionPoint` that actually routes: "I want to predict a number / sort things into bins / find
  structure / learn from trial and error" → four links.

---

# Part four · The capstones

~~All four are visually complete (0 pages without a figure).~~ **Corrected 2026-09-15:** that read
came from `inventory.js` counting `capstone/pedagogy` — `DecisionPoint` and `GuessSlider` — as
figures. On the fixed measure the **asteroid capstone has 15 of 24 pages with nothing to look at**
and **housing has 5 of 13**; only the warehouse capstone is genuinely visually complete. The finding
below still stands, and is **generational**: the capstone genre evolved twice, and the first one
never caught up.

| | pages | w/pg | the trio (`AnalystQuestion` · `TransferBox` · `PlaybookRule`) | transfer tests | playbook |
|---|---|---|---|---|---|
| California housing | 13 | 635 | — | — | — |
| Asteroid hazard | 24 | 606 | 23 · 23 · 20 of 24 pages | 2 | 20 rules |
| Warehouse robot | 24 | 1040 | 24 of 24 pages | 2 | 23 rules |
| Lies of P (field report) | 1 of 22 | 936 | — | planned | planned |

## 15. California housing — 13pp · 635 w/pg · ~~2~~ **5** without a visual · 1 PredictPrompt

The first capstone, and now the odd one out: **half the length of the other two, with none of the
genre's machinery.** It has no Playbook, no transfer tests, no `AnalystQuestion` prompts, and one
PredictPrompt in thirteen pages — against eighteen in the warehouse capstone.

Its figures, by contrast, are the site's best: `ModelLeaderboard`, `PdpFig`, `PermImportanceFig`,
`SpatialCVFig`, `CapZoneFig`, `LatentValueFig`, `ShapGlobalFig`.

- **The single biggest upgrade available**: bring it up to genre. A **housing Playbook** (the
  transferable rules — "look for the cap before you model the target", "spatial data needs spatial
  CV") and **one transfer test** (Ames or King County is the near transfer; a non-spatial tabular
  regression is the far one). That is what turns a worked example into teaching for transfer, and it
  is the explicit thesis of the two capstones that followed.
- *Text*: *Preprocessing pipeline* (267w) is the shortest capstone page on the site, and CH3's three
  pages (267/338/497w) are the thin middle of an otherwise strong arc.
- *Depth*: the capstone **ends on a stacked ensemble that the site never teaches** (§3.4). Until the
  stacking track exists, this page should carry the explanation itself.
- *Depth*: spatial cross-validation is used and `SpatialCVFig` drawn, but the model-selection pillar's
  *When your data isn't i.i.d.* never links here — and this is its best worked example.
- *Lab*: `ShapExplorerLab` is used once, in the epilogue. The boosting track's interpretation page
  (§3.3 CH6) is its second natural home.

## 16. Asteroid hazard — 24pp · 606 w/pg · ~~0~~ **15** without a visual

The genre-defining capstone: the trio on 20–23 of 24 pages, two transfer tests (Pulsars near, Bank
Marketing far), a 20-rule Playbook, and the metric chosen by cost before any model is fitted.

- *Depth*: **the model climb is the thin part.** Five pages (logistic → tree → forest → boosting →
  comparison) average 513 words, and each rung is asserted more than diagnosed. The capstone's own
  thesis is "earn every rung"; the rungs should each end with *what the previous model got wrong that
  this one fixes*, shown in the errors.
- *Depth*: *Baselines: the number to beat* (422w) is the shortest page and, given the 9.73% base rate,
  the most important one.
- *Lab*: one lab in 24 pages (`SplitLeakLab`). The threshold/operating-point page (511w) is where
  `ThresholdLab` or `CostLab` would do real work, and both already exist.
- *Reuse*: `RocVsPr` is built here and used nowhere else — the Evaluation pillar needs it (§9 CH2).
- *Visuals*: **15 of the 24 pages have nothing to look at** — see the correction at the head of Part
  four. Six pages carry a figure, two an inline `<svg>` and one a lab; the rest carry only prose,
  code and `DecisionPoint` prompts, and the prompts were being miscounted as figures. This is now the largest visual debt outside the unfinished tracks,
  and it sits on the capstone the site presents as genre-defining.

## 17. Warehouse robot — 24pp · 1040 w/pg · 0 without a visual · 18 PredictPrompts

The most complete thing on the site. The trio on every page, a 23-rule Playbook, two transfer tests,
a downloadable notebook, and an oracle page (1629w) that establishes the ceiling before any learning
happens. No depth gaps worth recording.

- *Only note*: it is the best argument for §0.3 #4 — `DecisionPoint` appears twice here and it is the
  primitive that makes these pages work. Every family track should borrow it.

## 18. Lies of P (field report) — 1 of 22pp

Genre: methodology may ship before results; unbuilt results pages stay href-less on purpose. Nothing
to audit yet.

- *Risk note, unchanged*: do the synthetic-input spike (*Does the game even accept synthetic input?*)
  **before** recording any gameplay data. It is page 14 in the outline and the cheapest thing that can
  kill the project.

---

# Part five · What to build that does not exist yet

Ordered by what the site's own structure already promises.

1. **Policy gradients, actor–critic & PPO** (RL) — a shipped page already names PPO in its title
   (§7.5). ~24pp.
2. **Optimization: gradient descent, properly** (Foundations) — two `/map` throughlines point at an
   empty family, and three tracks each teach a partial version (§13). ~16pp.
3. **Support vector machines** (Classification) — SVR ships without SVM; three tracks compare against
   it (§2.4). ~20pp, much of it adaptable from SVR.
4. **Stacking & blending** (Trees) — the housing capstone's final model uses it (§3.4). ~14pp.
5. **Gaussian mixtures & EM** (Clustering) — EM is a method the site never teaches and four pages
   elsewhere need (§4.2). ~18pp.
6. **DBSCAN & density-based** (Clustering) — the answer to k-Means' failure chapter, referenced there
   (§4.2). ~12pp.
7. **Coordinate descent** (Optimization) — the Lasso's solver and k-means' convergence argument both
   depend on it (§13). ~10pp, the cheapest item on this list.
8. **t-SNE & UMAP** (Dim. reduction) — highest reader demand, best honest-numbers potential (§5.2).
9. **Convolutional networks** (Neural) — or an explicit statement that the family is MLP-only (§6).
10. **Hierarchical clustering**, **Kernel PCA**, **manifold learning**, **random projections**,
    **model-based RL/MCTS**, **neuroevolution**, **perceptron & online classifiers**,
    **multi-class strategies** — all outlined, all genuinely wanted, none blocking anything else.

**Two new pages that belong to no track and should exist anyway**

- **"Is this difference real?"** (Evaluation §9 CH4) — paired tests across folds. Every bake-off page
  on the site implicitly needs it and none has it.
- **"When more parameters stopped hurting"** (Learning theory §12 CH5) — double descent and benign
  overfitting; the only bridge between the theory track and the neural family.

---

# Appendix · the full inventory

Generated 2026-09-15 by `scripts/inventory.js`. Sorted by visual debt, then by thinness.
"no visual" = pages with no lab, no imported figure and no inline `<svg>`.

| track | outlined | built | w/pg | no visual | lab+fig | code | proof | predict | quiz |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Math foundations | 34 | 34 | 367 | 20 | 13 | 0 | 0 | 4 | 5 |
| k-Nearest Neighbors | 36 | 36 | 510 | 16 | 4 | 27 | 0 | 2 | 29 |
| Naive Bayes | 20 | 20 | 643 | 16 | 3 | 16 | 0 | 7 | 8 |
| RL · Learning | 24 | 24 | 696 | 16 | 8 | 21 | 11 | 22 | 6 |
| The data workflow | 28 | 28 | 823 | 16 | 11 | 10 | 2 | 7 | 9 |
| Random forests | 21 | 21 | 468 | 15 | 5 | 11 | 0 | 5 | 8 |
| Boosting | 23 | 23 | 572 | 15 | 3 | 3 | 0 | 9 | 8 |
| Capstone · asteroid | 24 | 24 | 606 | 15 | 8 | 21 | 0 | 1 | 0 |
| RL · MDPs | 24 | 24 | 635 | 14 | 10 | 21 | 13 | 16 | 6 |
| Backpropagation | 22 | 22 | 854 | 13 | 6 | 20 | 5 | 5 | 21 |
| Support vector regression | 16 | 16 | 476 | 11 | 5 | 7 | 0 | 1 | 15 |
| Decision trees | 20 | 20 | 589 | 11 | 5 | 12 | 0 | 4 | 9 |
| Kernel ridge regression | 16 | 16 | 475 | 10 | 5 | 8 | 0 | 0 | 15 |
| Regularized regression | 26 | 26 | 371 | 9 | 13 | 23 | 0 | 0 | 3 |
| Activation functions | 21 | 21 | 927 | 9 | 12 | 5 | 8 | 8 | 20 |
| Perceptron to MLP | 21 | 21 | 927 | 9 | 9 | 14 | 6 | 7 | 20 |
| Model selection | 16 | 16 | 569 | 8 | 4 | 1 | 0 | 4 | 4 |
| Logistic regression | 25 | 25 | 607 | 7 | 18 | 8 | 0 | 23 | 17 |
| Learning theory | 20 | 20 | 809 | 7 | 7 | 0 | 14 | 6 | 5 |
| Polynomial regression | 14 | 14 | 577 | 6 | 8 | 3 | 0 | 11 | 12 |
| Capstone · housing | 13 | 13 | 635 | 5 | 19 | 17 | 0 | 1 | 0 |
| Start here | 5 | 5 | 425 | 4 | 1 | 0 | 0 | 2 | 2 |
| PCA | 22 | 22 | 459 | 4 | 12 | 5 | 0 | 5 | 4 |
| Linear regression | 47 | 47 | 491 | 3 | 40 | 41 | 0 | 4 | 11 |
| Function approximation | 24 | 24 | 806 | 2 | 24 | 24 | 8 | 25 | 0 |
| Evaluation & metrics | 10 | 10 | 676 | 1 | 9 | 0 | 0 | 9 | 10 |
| Architecture design | 27 | 27 | 1385 | 1 | 28 | 3 | 26 | 9 | 26 |
| Building environments | 40 | 27 | 1756 | 1 | 38 | 68 | 10 | 31 | 0 |
| k-Means | 45 | 45 | 374 | 0 | 41 | 39 | 0 | 3 | 7 |
| RL · Planning | 22 | 22 | 611 | 0 | 25 | 19 | 7 | 16 | 6 |
| Capstone · Lies of P | 22 | 1 | 936 | 0 | 2 | 0 | 0 | 0 | 0 |
| Capstone · warehouse | 24 | 24 | 1039 | 0 | 80 | 36 | 0 | 18 | 5 |
| NN regularisation | 21 | 21 | 1242 | 0 | 24 | 1 | 19 | 5 | 20 |
| Initialisation & normalisation | 21 | 21 | 1248 | 0 | 25 | 3 | 20 | 7 | 20 |

**Totals:** 794 pages outlined, 760 built, **264 (35%) without a visual**.
229 lab/figure component files exist — 161 in `src/components/labs/`, 36 in `figures/`, 13 in
`fire/`, 19 in `sail/`. Only two are never imported by a page (`figures/FamilyGlyph`, used by
`Shelf`, and `sail/course`, the shared course backdrop six sail labs draw on), and three are
imported by a page that never renders them (§0.5). There is still no dead lab code: the problem is
distribution, not supply.
