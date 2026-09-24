# Manifold — Project Handoff & Master Plan

> Read this first. It is the single source of truth for what Manifold is, what's built, what's
> planned, and every locked decision about content voice, UI, and tech. Pair it with
> [`docs/curriculum-map.md`](./curriculum-map.md) (the full curriculum/IA).
>
> **New lead? Read §12 first** — the complete playbook: style philosophy, content & lab craft,
> the three-pass review loop, upgrade heuristics, and the ordered priority list. §§10–11 hold the
> binding specifics (palette, lab standards, authoring checklist); §12 holds the judgement.
>
> Last updated: 2026-08-28 — 🧭 **THE DATA WORKFLOW PILLAR BUILT (28pp) — the last unbuilt cross-cutting
> pillar, and the first one that is about judgement rather than machinery.** `/learn/data-workflow`
> (`dataWorkflowTrack.ts`, accent `--c-metrics`), 7 chapters: Before you model · Framing · Meeting the data ·
> Data quality & leakage · Preparing features · From baseline to better · Beyond the notebook.
> **Spine: MODEL QUALITY IS DECIDED BEFORE THE MODEL.** Each chapter is one class of pre-`.fit()` decision
> that has a wrong default which feels right; the checklist is deliberately the LAST page, so it reads as
> derived rather than as instructions. Deliberate boundaries — Evaluation owns *which metric*, Model
> selection owns *CV machinery*, the capstones own *the end-to-end walkthrough*; this pillar owns framing,
> data quality, leakage, features, error analysis and life after deployment.
> **5 new labs** (all `--c-metrics`, hydration-safe, every number from a real run):
> `SimpsonsParadoxLab` (240 real points, slopes computed in-component so the readouts cannot drift from the
> prose — pooled **−0.95**, four clinics **+0.69…+0.84**), `LeakageLab` (leaky-vs-pipeline CV over a
> p-sweep, honest curve pinned at chance while the leaky one climbs **0.636 → 0.878**),
> `MissingnessLab` (MCAR/MAR/MNAR survival curves + mean estimates + held-out R²),
> `ErrorAnalysisLab` (**flagship** — three slicings, one of which pays and two of which are duds, sorted by
> *lift*), `DriftLab` (the covariate-shift/concept-drift 2×2). Reuses `DistributionLab`, `InfluenceLab`,
> `CategoricalFeaturesLab`, `FeatureScalingLab`.
> **Honest numbers:** `scripts/data_workflow_cases.py` (8 sections, exit 0). Preprocessing leakage
> **0.878 reported where truth is 0.500**; group leakage **R² 0.569 → 0.044**; temporal leakage
> **R² 0.396 → −0.220**; baselines (**98.7% accuracy worth +0.0402**); MNAR imputation failing where MAR is
> recovered; error slices (**25% of traffic holding 14 of 15 errors**); Simpson's paradox; drift.
> ⚠️ **Three of the eight sections failed to demonstrate their own point on the first run** and were fixed by
> changing the *experiment* — see [[verify-the-effect-before-writing-the-prose]]; the drift section became
> materially better pedagogy as a result (two scenarios and a 2×2, instead of one asserted decay curve).
> 🎨 **SITE-WIDE FIX shipped alongside:** Tailwind preflight was stripping markers, indentation and item
> spacing from every `<ul>`/`<ol>` in `.lesson` — **every bulleted list on all ~400 pages was rendering as
> run-on unstyled text.** Added `.lesson ul/ol/li` rules to `globals.css` (disc/decimal markers, `--faint`
> marker colour, `--muted` body matching `.lesson > p`, ink `<strong>`, 0.55rem item rhythm, tightened
> nesting). One-file edit, inherited everywhere — §12.6 rule 2 in action.
>
> Prior 2026-08-27 — 🎓 **LEARNING THEORY (20pp) + MODEL SELECTION (16pp) BUILT — the two foundations
> pillars the concentration strand was written for.** `/learn/learning-theory` (`learningTheoryTrack.ts`, Tier 3)
> and `/learn/model-selection` (`modelSelectionTrack.ts`, Tier 2), both gray `--c-metrics`. **36 pages, all live,
> tsc EXIT 0, all 200, 0 KaTeX errors, every cross-link verified.**
> **LT arc:** Ch1 generalization (risk-vs-empirical-risk, no-free-lunch [pairing-argument proof], union bound,
> finite classes) · Ch2 PAC (definition, sample complexity, agnostic + approximation/estimation split, ERM +
> the memorizer catastrophe) · Ch3 capacity (when counting fails, VC dimension, Sauer's lemma, the VC bound,
> Rademacher) · Ch4 margins (margin, margin bounds, boosting-and-margins incl. **Breiman's arc-gv counterexample
> — the theory's own prediction failed**) · Ch5 stability (definition, stability⇒generalization, when-the-bounds-break).
> **MS arc:** selection problem (what you're choosing = a CLASS, approx-vs-est, the selection trap) · validation
> (train/val/test, CV, folds, nested CV) · capacity (SRM, regularization, early stopping, AIC/BIC/MDL) · practice
> (learning curves, one-SE rule, non-i.i.d. splits, the 9-step checklist).
> **NEW SHARED PRIMITIVE:** `<Proof>` in `lesson.tsx` — the collapsible "Go deeper ▾" Tier-3 aside §4 has wanted
> since 2026-07-04, finally shipped. Main flow keeps statement + intuition + the one load-bearing step; the aside
> holds the FULL derivation. All ~396 pages inherit it. Styles in globals.css (`.proof-aside`).
> **5 new labs:** `ShatteringLab` (flagship — 3 presets prove the ∃ quantifier: triangle 8/8 shattered, collinear
> 6/8, square 14/16 with the 2 XOR labelings refused; exact 720-direction separability sweep, verified live),
> `EmpiricalRiskLab` (best-of-1000 coin flips breaks the Hoeffding band at EVERY n — selection bias and the band
> both scale 1/√n), `UnionBoundLab`, `SampleComplexityLab` (1/ε vs 1/ε²), `RademacherLab` (exact DP over sign
> changes; capacity 1 → 0.454, capacity 13 → **1.000**), `MarginLab`, `StabilityLab`, `LearningCurveLab`.
> MS reuses `BiasVarianceLab`/`CrossValidationLab`/`RidgePolyLab` unmodified (§12.6 rule 2 paying off again).
> **HONEST NUMBERS — 2 new scripts, both exit 0.** `scripts/learning_theory_cases.py`: VC bound **vacuous**
> (linear p=784, n=60,000 → gap **0.795**; needs **7.4M** examples for 0.1); random labels with 4,000 random
> features → train **1.0000** / test **0.0870** (chance 0.10) vs true labels 1.0000/0.9667; **double descent
> measured** (n=178: classical best p=80 → 0.0929, peak at p=n → **4.778**, p=4000 → **0.0180**, i.e. 5× better
> than the classical optimum). `scripts/model_selection_cases.py`: selection optimism (200 true-0.500 coin flips
> → best-of **0.5975**), nested vs flat CV (**0.9807 → 0.9747, +0.0060**), one-SE rule (α 22× stronger, test MSE
> 0.1516 → 0.1436), learning curves.
> ⚠️ **TWO SELF-CAUGHT ERRORS worth remembering.** (1) My first `EmpiricalRiskLab` used best-of-50 at true risk
> 0.30 — the bias (0.073) stayed INSIDE the band (0.096), so the lab showed a broken promise that wasn't broken.
> Fixed by deriving the required M analytically (bias ≈ z_M·σ, both sides scale 1/√n, so only M matters).
> (2) `model_selection_cases.py` §4 first used a linear SVC as the "underfit" model — it reached 0.938 and its
> validation was STILL CLIMBING, so "more data won't help" was false. Swapped to a depth-2 tree that genuinely
> plateaus (val 0.3166 → 0.3183 over 647 extra examples, gap **0.0011**). **Lesson: when a lab or figure exists to
> demonstrate an effect, verify the effect actually occurs in the numbers before writing the prose around it.**
> Registered: searchIndex (both), siteMap (both groups now have real hrefs — Learning theory & Model selection
> are no longer greyed), Footer. Closes the dead `/learn/model-selection` links left by the math-foundations track.
> **Next foundations:** Optimization pillar is the last greyed foundation.
>
> Prior 2026-08-21 — 🌳🌲 **BOTH TREES TRACKS EXPANDED TO MASTERY PARITY.** Decision Trees **14→20pp**,
> Random Forests **14→21pp** (user: "is 14 enough for mastery?" → "full parity"; they're two of the most-used
> tabular models and deserve KNN/logistic-level depth, not polynomial-level). **DT +6:** missing-values-and-surrogate-splits,
> the-algorithm-family (ID3/C4.5/CHAID, gain-ratio fixes cardinality bias), oblique-and-multivariate-trees (+staircase-vs-diagonal
> figure), class-weights-and-cost-sensitive, probabilities-and-calibration (+reliability figure), case-b-regression (Cal-housing,
> tree R²0.673, no-extrapolation cap). **RF +7:** imbalanced-forests (honest surprise: class_weight WEAK for forests
> recall 0.515→0.423; **threshold** 0.5→0.3 lifts to 0.680), regression-forests (R² 0.673→**0.795**, OOB 0.807),
> quantile-regression-forests (**+QuantileForestLab**, 80% interval coverage **0.839**, band flares where noisy),
> strength-and-correlation (**Breiman PE*≤ρ̄(1−s²)/s²** — formalises max_features tradeoff + no-overfit-from-more-trees),
> isolation-forests (path-length anomaly, ROC-AUC 0.969), importance-for-correlated-features (MDI splits credit x1 .354/x2 .479,
> perm zeroes it x1 .024 — twin compensates), case-b-intervals (finale, 4-Q quiz). Numbers appended to `scripts/tree_cases.py`
> + `scripts/forest_cases.py` (Cal-housing + framed-synthetic demos). Both chains rewired & re-verified end-to-end;
> **`next build` EXIT 0, all pages static-prerendered** (.html generated ⇒ KaTeX rendered, 0 SSR errors). ⚠️ RF's original
> 14 pages were built earlier THIS session then compacted out of context → I nearly rebuilt them; caught via `ls`+mtimes
> before clobbering (**lesson: `ls` the target dir before "continuing" a big build after a /compact**). Dev server STILL
> wedged (whole-router 404s incl. existing pages — framework, not code) → **live interactive eyeball of all labs still owed.**
> **Next family track: Boosting** (`/learn/boosting` — AdaBoost + gradient boosting; sequential/bias-reduction vs forest's parallel/variance).
>
> Prior 2026-08-20 (cont.) — 🌲 **RANDOM FORESTS TRACK COMPLETE (14pp)** — 2nd Trees-family track.
> `/learn/random-forests` (`randomForestsTrack.ts`). Ch1 wisdom-of-many-trees (index *Averaging trees* [**ForestVoteLab**:
> circular boundary, B-slider grows a bagged forest, mount-gated vote-field heatmap melts jagged→smooth ring], bagging
> [**BootstrapLab**: ~37% OOB = 1/e], out-of-bag-error) · Ch2 (decorrelating-the-trees [**DecorrelationLab**: max_features
> sweep, correlation rises + accuracy weak at m=1], the-algorithm, feature-importance) · Ch3 (hyperparameters, extra-trees,
> forest-vs-tree-vs-boosting) · Ch4 T3 (why-averaging-works [**CorrelatedVarianceLab**: Var=ρσ²+(1−ρ)σ²/B, ρ/B sliders,
> the ρ-floor], limits-of-forests) · Ch5 (proximities [RF-as-kernel], when-to-use) · Ch6 case-a-covertype + 5-Q final quiz.
> **Honest numbers `scripts/forest_cases.py`** (Forest Cover Type, 25k subsample): single tree **0.760** → RF **OOB 0.844 ≈
> test 0.847** (+8.7pts), n_estimators plateau (B=1→0.708 … 300→0.847, never overfits), Elevation importance +0.284. 4 new
> labs all deterministic+rounded/mount-gated. **Verified by full `next build`** (all 215 pages static-prerender, 0 errors;
> SSR HTML has real numbers + KaTeX clean) — because the **dev server was stuck in a whole-router 404 state all session**
> (framework-level, not code; `rm .next`+restart didn't fix). Live visual eyeball of the 4 labs still owed. **Next: Boosting.**
> Details: memory `random-forests-track.md`.
>
> Prior 2026-08-20 — 🌳 **DECISION TREES TRACK COMPLETE (14pp)** — first track of the **Trees & ensembles**
> family, built from scratch. `/learn/decision-trees` (`decisionTreesTrack.ts`, green `--c-trees`). Ch1 Twenty
> questions (T1: splitting-the-space [**new DecisionTreeLab** — real client-side CART on a noisy checkerboard,
> depth slider → leaf-rectangle staircase + live train/test acc], what-makes-a-good-split [**new ImpurityLab** —
> drag a split, live Gini + info gain + snap-to-best], growing-the-tree [CART recursion + code]) · Ch2 Choosing a
> split (T2: impurity-measures [Gini/entropy/misclass curves, why concavity matters], regression-trees [**new
> RegressionTreeLab** 1-D variance-split staircase], numeric-and-categorical-splits [scale-invariance, Breiman
> ordering trick, missing values]) · Ch3 Controlling complexity (T2: how-trees-overfit [reuses DecisionTreeLab],
> pre-pruning [5 knobs + horizon effect], cost-complexity-pruning [R_α, weakest-link, CV]) · Ch4 Theory (T3:
> why-greedy [NP-complete, XOR failure, optimal-tree solvers], bias-and-variance-of-trees [low-bias/high-variance
> → **motivates the whole ensembles family**]) · Ch5 Kin (T2: feature-importance [MDI bias, permutation, iris tree
> flowchart], when-to-use-a-tree [green/red guide]) · Ch6 In the wild (case-a-titanic). **Honest numbers via
> `scripts/tree_cases.py`** (Titanic, sklearn 1.8, **drops leakage cols boat/body/home.dest**): full tree 227
> leaves train 0.967/test 0.762 → CV-pruned **depth 3, 8 leaves, test 0.832**; first split is `sex` → tree
> rediscovers "women & children first"; permutation importance sex +0.261 dominant. Index chip auto-flips
> "Complete · 14 pages"; siteMap Decision-trees href added (Trees family "1 live", atlas node clickable);
> searchIndex wired. tsc EXIT 0, all 14 pages 200, KaTeX clean, 0 hydration, both themes. **Next: random forests**
> (reuse DecisionTreeLab + the Ch4 bias–variance setup). See §12.7 item 4. Details in memory `decision-trees-track.md`.
> ⚠️ Dev server hit the §7 degraded state again mid-build (many client comps fast) — `preview_stop`→`rm -rf .next`→`preview_start` fixed it.
>
> Prior 2026-08-19 — 🎉🎉 **THE ENTIRE REGRESSION FAMILY IS COMPLETE** + **BOTH KERNEL TRACKS NOW AT 16pp
> MASTERY PARITY**. 5 tracks live: linear, ridge/lasso/elastic-net, polynomial, **kernel ridge (NOW 16pp)**,
> **support vector regression (NOW 16pp)**. SVR expanded +5: Tier-3 **SMO** (how the QP is solved), **ν-SVR** (bound
> the SV/error fraction), **scaling to large n** (Nyström/RFF → linear SVR), **In the wild** — Case A Mackey-Glass
> forecasting (RBF SVR RMSE 0.0044 vs ridge 0.0095, 224/669 SVs), Case B robustness (OLS ×3.7 worse under 10%
> outliers, SVR ×1.0); numbers from `scripts/svr_cases.py`. KRR expanded +4: Tier-3 **solving-the-linear-system**
> (Cholesky, λ-as-conditioner, eigendecomposition → closed-form LOOCV), **scaling-krr-to-large-n** (density makes it
> worse than SVR; Nyström/RFF → primal ridge), **In the wild** — Case A dense-vs-sparse (KRR R²=0.9291 stores 600/600
> vs SVR 0.9200 stores 291/600 = 2.1× larger), Case B efficient-LOOCV (closed-form 102ms picks λ≈0.0054 vs 5-fold
> GridSearch 3815ms λ≈0.0042 — same regime, 37× faster); numbers from `scripts/krr_cases.py`.
> Built two brand-new Tier-2/3 kernel-methods tracks from scratch: `/learn/kernel-ridge-regression`
> (kernelRidgeTrack.ts) — kernel trick → dual of ridge → kernels-as-similarity → (K+λI)⁻¹y solution → choosing
> kernel/tuning/cost → representer theorem → GP connection → KRR-vs-SVR-vs-linear → worked example; and
> `/learn/support-vector-regression` (svrTrack.ts) — ε-insensitive loss → tube & support vectors → soft-margin C
> → primal → dual+kernel trick → kernels → hyperparams C/ε/γ → KRR-vs-SVR → when-to-use → worked example. TWO new
> labs: **KernelRidgeLab** (real client-side RBF KRR fit, λ+γ chip-buttons, exp-curve mount-gated to avoid
> hydration mismatch) and **SVRTubeLab** (ε-tube slider, support-vectors = points outside, live SV count). Real
> numbers via **`scripts/kernel_cases.py`** (make_friedman1: linear ridge R²=0.667 → KRR R²=0.860 dense-300pts →
> SVR R²=0.838 sparse-166pts), **`scripts/svr_cases.py`** (Mackey-Glass forecasting + outlier robustness), and
> **`scripts/krr_cases.py`** (dense-vs-sparse + closed-form LOOCV timing). All
> 32 regression-kernel pages 200, tsc EXIT 0, 0 KaTeX errors, 0 hydration errors, both index chips
> auto-flip "Complete", siteMap+searchIndex wired, /map shows Regression fully live. See §12.7 items 0l/0m.
> Prior 2026-07-07: 🎉 **k-NEAREST NEIGHBORS TRACK COMPLETE (36/36)** — the FOURTH fully-complete
> track (linear, logistic, polynomial, KNN). Built 28 pages across EIGHT chapters this session (8/36 → 36/36).
> Final chapter Ch10 *In the wild* — **real-number case studies** backed by `scripts/knn_cases.py` (honest-numbers
> doctrine): case-a-digit-recognition [load_digits, **98.67%** test acc at k=3, 6/450 errors, most-confused 9→3
> with **real rendered 8×8 bitmaps**, PCA(30)=97.33%, brute==kd_tree], case-b-recommendation [user-based CF,
> synthetic latent-factor ratings, RMSE **1.139 vs 1.306** baseline = 12.7% lift], case-c-similarity-and-anomaly
> [digits precision@10 **0.9651**; kNN-dist & LOF anomaly ROC-AUC **1.000** (honest: digit-0 cluster is trivially
> separable — framed as such)]. Case pages: real code (`CodeBlock`, no `setup` → no Run) + real `CodeOutput`.
> siteMap `partial` dropped; index chip auto-flips to "Complete · 36 pages". NB the sidebar "N of 36" denominator
> is KNN_DONE — track is **36 pages** total (earlier session notes mislabeled it as 33). Ch9
> *Strengths, weaknesses & kin*: when-to-use-k-nn [green/red decision guide + pre-flight checklist],
> k-nn-vs-logistic-regression-svm-trees [**10-criteria × 4-classifier comparison table**], k-nn-vs-k-means
> [the name-trap table + mnemonic, cross-links k-means track]. Prior this session: Ch *Theory · go deeper*
> (Tier 3): the-bayes-classifier-and-bayes-error [**static class-overlap figure**, R*=E[min(η,1−η)]],
> the-1-nn-error-bound [Cover–Hart R*≤R₁ₙₙ≤2R*(1−R*); **static 2η(1−η) vs min(η,1−η) figure** + full proof],
> consistency-of-k-nn [Stone's theorem, twin conditions k→∞ & k/n→0 mapped to variance/bias],
> k-nn-as-non-parametric-estimation [η̂ estimation, k-NN density k/(nVₖ) as adaptive-bandwidth dual of KDE,
> **static adaptive-window figure**, n^(−2/(d+2)) rate + curse]. Ch *Choosing k*
> (the-role-of-k, bias-and-variance-in-k-nn, choosing-k-by-cross-validation), Ch *Distance & weighting*
> (distance-metrics-for-k-nn, why-feature-scaling-matters, distance-weighted-voting,
> the-curse-of-dimensionality), Ch *Making it work in practice* (preprocessing-and-encoding,
> ties-and-class-imbalance, choosing-the-right-metric, feature-selection-and-weighting), Ch *Scaling the
> search* (the-brute-force-cost, k-d-trees, ball-trees, approximate-nearest-neighbors). Reused
> `KNNBoundaryLab`/`KNNChooseKLab`; many new **static server-rendered** figures (bias–variance U-curve;
> distance-concentration bar chart; Minkowski unit-ball trio; majority-floods diagram; brute-force scan;
> k-d partition; nested ball-tree spheres) + complexity/method tables — all module-scope, rounded coords,
> zero hydration surface (no client labs on these pages). Did NOT reuse `ImbalanceLab` (its numbers are a
> real logistic run — would misrepresent as k-NN); ANN page invents NO benchmark numbers (honest — method
> families described qualitatively). tsc clean, all 200, KaTeX clean, sidebar auto-reads "23 pages".
> siteMap keeps KNN `partial` (10 pages still greyed). See §12.7 items 0e/0f/0g/4.
> 2026-07-06 — THREE completions. (1) **Logistic regression track COMPLETE**
> (25/25) — Tier-3 theory + 3 *In the wild* cases. (2) **Evaluation & Metrics pillar COMPLETE** (10/10,
> `/learn/evaluation`) — first fully-complete *pillar*, reuses eight pre-existing labs. (3) **Polynomial
> & basis-function track COMPLETE** (14/14) — fixed two live 404s (lib linked pages that never existed),
> then shipped 9 pages; new `SplineKnotsLab` (round SVG coords to avoid a sin/cos hydration mismatch).
> **Three fully-complete tracks now: linear, logistic, polynomial**, plus the metrics pillar. All: tsc
> clean, KaTeX clean, hydration clean, `partial`/`In progress` flags dropped. See §12.7 items 0b/0c/0d.
> Prior (2026-07-05 late): logistic regression **Tiers 1 & 2 complete** (18/25 pages) — Tier-2
> shipped 12 pages across 4 chapters + 7 labs (`OddsRatioLab`, `ImbalanceLab`, `SeparationLab`,
> `SoftmaxLab`, `RocLab`, `CalibrationLab`, `CostLab`) + `CREDIT_SETUP`.
> Earlier 2026-07-05: added **§12, the handoff playbook**, after a day that shipped the Start-here
> onboarding track, logistic Tier-1 (6 pages + 4 real-data labs), mobile drawer (`LessonShell`),
> editable `CodeBlock` + `LabFrame`, tier badges + `ModelAnatomy` throughline, `Term` glossary
> popovers, interactive SHAP explorer, active recall across all live tracks, ⌘K search, and the
> capstone reproducibility guard (`scripts/verify_capstone.py`).
> (Earlier 2026-07-05: §11 authoring checklist. 2026-07-04: §10 direction review — palette
> replacement, active-recall pedagogy, landing rebuild. §10 supersedes anything it conflicts with.)

---

## 1. What we're building

**Manifold** (working name — not final; "Manifold" / "ML Manifold" leading) is an **interactive
textbook for machine-learning intuition**. The mission: help anyone understand *how each algorithm
works inside, what drives it, and when/why to use it* — by letting them **drag, tune, and watch**
rather than memorise formulas.

Three things make it different:
- **Intuition first, always.** No equation appears before the learner has played with the idea.
- **Mastery depth.** One topic can run 30–44 pages (e.g. linear regression). Depth over breadth.
- **The full practitioner picture.** Not just algorithms — also the *data workflow* ("given data,
  what do I do?") and *evaluation & metrics* ("which metric matters, case by case"), with
  interview-grade framing.

**Positioning (locked):** a *beautifully designed interactive textbook* in the spirit of
**Stripe Press, Observable, Linear, Notion, Figma docs** — emphatically **NOT** a neon/cyber
"AI startup" site. The serif typography and editorial restraint are the identity; do not trade
them for a generic SaaS look.

**Anti-"AI-generated" rule (locked, 2026-07-04):** nothing on the site may carry the visual
fingerprint of AI-scaffolded projects — no default Tailwind palette swatches, no purple/violet
gradient CTAs, no purple-as-brand, no blue-black dashboard dark mode, no Dracula/neon code themes,
no dead nav items or template-filler sections. When in doubt, ask: "would this appear in a
Stripe Press book or an Observable notebook?" If not, redesign it. See §10.1 for the palette
doctrine that replaces the old violet system.

**Audience strategy — 4 depth tiers (locked):** every topic can be entered shallow and deepened.
- Tier 0 — Math Foundations (prerequisites, only when needed)
- Tier 1 — Intuition (everyone starts here)
- Tier 2 — Practitioner (use it well: code, tuning, workflow)
- Tier 3 — Theory (why it's guaranteed to work)

Theory is opt-in, never a gate. **Mohri/Rostamizadeh/Talwalkar, *Foundations of Machine Learning***
(cs.nyu.edu/~mohri/mlbook) is our **Tier-3 reference for topics only** — all content is original,
written in our own voice with our own visuals. Never reproduce its text/proofs/figures.

---

## 2. Status — what's DONE

> ⚠️ **This section is a historical snapshot from the first weeks and is now badly out of date.**
> It describes 11 live pages; the site is well past 400. **For actual status read §12.7**, whose
> `0a…0o` entries are the running build log. §10.6 supersedes §3's ordering, and §12 supersedes
> §§4–9 wherever they disagree. Kept for the origin story, not as a status report.

The Next.js app is scaffolded, the design system is in place, and the homepage, the `/map`
curriculum atlas, and the first **11 pages of the Linear Regression track** are live.

**Live pages**
- `/` — homepage hero (serif headline, gradient CTA, loss-landscape art, family chips).
- `/map` — full curriculum atlas: depth-scale strip, colour-coded family/pillar/foundation cards,
  book-style "Part one/two/three" chapter headers, scroll-reveal, card hover. Only linear
  regression is "live"; everything else shows "soon".
- `/learn/linear-regression` — **The line of best fit** (lab: `LineOfBestFitLab` — drag the line,
  live MSE/R², squared-error squares toggle, snap-to-OLS).
- `/learn/linear-regression/why-squared-error` — **Why squared error?** (labs: `PenaltyCurves`
  = |e| vs e²; `OutlierLab` = MSE chases an outlier while MAE/IRLS resists).
- `/learn/linear-regression/the-loss-surface` — **The loss surface** (`LossSurface3D` pseudo-3D
  SVG bowl + `GradientDescentLab` = contour-heatmap descent over (slope, intercept) linked to a
  live fit panel, with a learning-rate slider that converges ~0.3 / diverges >1.0).
- `/learn/linear-regression/what-is-a-gradient` — **What is a gradient?** (`GradientTangentLab`
  = drag a ball on a curve → tangent slope = gradient; "step downhill" = 1-D gradient descent).
- `/learn/linear-regression/batch-vs-sgd` — **Batch, stochastic, and mini-batch**
  (`SGDComparisonLab` = same start, three noisy/smooth optimisation paths).
- `/learn/linear-regression/when-do-we-stop` — **When do we stop?** (`StoppingRulesLab` =
  gradient norm, loss-improvement tolerance, and validation patience stopping rules).

**Component inventory**
- `src/components/`: `Header`, `ThemeToggle`, `ManifoldMark` (the logo — a wireframe **saddle
  surface**, computed/projected in SVG), `LossLandscapeArt` (hero contour art), `TrackSidebar`
  (the LR outline rail), `Reveal` (IntersectionObserver scroll-reveal wrapper).
- `src/components/labs/`: `LineOfBestFitLab`, `PenaltyCurves`, `OutlierLab`, `LossSurface3D`,
  `GradientDescentLab`, `GradientTangentLab`, `SGDComparisonLab`, `StoppingRulesLab`.
- `src/lib/`: `linearRegressionTrack.ts` (the 44-page track outline + which pages have `href`s),
  `siteMap.ts` (the `/map` data: tiers, families, pillars, foundations).

---

## 3. What's PLANNED (roadmap)

> ⚠️ **2026-07-04: build order is now governed by §10.6** (components → palette → landing page →
> active recall → Start-here → capstone interactivity → logistic regression). The notes below are
> kept for per-chapter context.

**Immediate goal: finish the Linear Regression track end-to-end before starting any other
algorithm.** Tracked as chapter-level tasks (Ch3 in progress; Ch4–11 pending). Full per-page
breakdown is in `docs/curriculum-map.md`; the live outline + ordering is in
`src/lib/linearRegressionTrack.ts`.

Remaining LR chapters:
- **Ch3 Gradient descent (complete enough for now).** Built: "What is a gradient?", **batch vs
  stochastic vs mini-batch**, and **when do we stop?**. Note: roll-downhill / update-rule /
  learning-rate / descent-on-the-surface are already taught on the loss-surface + gradient pages,
  so avoid adding thin redundant pages unless the outline is intentionally expanded later.
- **Ch4 The direct solution** — normal equation; closed-form vs gradient descent.
- **Ch5 From one feature to many** — multiple regression; **feature scaling** (reuse the contour
  lab: elongated→zig-zag vs circular→straight); categorical/one-hot; polynomial & interactions.
- **Ch6 The assumptions** — overview + linearity, independence, homoscedasticity, normality,
  multicollinearity (VIF).
- **Ch7 Diagnostics** — residual-vs-fitted, heteroscedasticity (we mocked this lab early —
  residual fan), outliers/leverage/Cook's distance, Q–Q plots.
- **Ch8 Evaluation** — R²/adjusted R², RMSE vs MAE, train/test + cross-validation + bias–variance.
- **Ch9 Fixing & optimizing** — transformations, weighted least squares, **regularization**
  (ridge/lasso/elastic-net with a λ slider), bias–variance revisited.
- **Ch10 Inference** — confidence intervals, p-values, prediction vs confidence intervals.
- **Ch11 In the wild** — when to use vs trees/GLMs, failure-mode gallery, end-to-end worked case.

**After LR:** k-Means, then KNN (deep MVP), then broaden families per `curriculum-map.md`.
Cross-cutting pillars (Data Workflow, Evaluation & Metrics) and the Learning Theory / Math
Foundations tracks come later. The **Evaluation & Metrics lab** (interactive confusion matrix +
threshold → live ROC/PR) was prototyped in chat and should be rebuilt as a real page in that pillar.

**Known enhancement (parked):** a true rotatable **WebGL loss-surface** via React Three Fiber.
Deferred because WebGL can't be verified in the preview screenshotter. The user has offered to
**provide screenshots** so we can build & verify it later. Current 3D is done as projected SVG
geometry (no `three` dependency).

---

## 4. Content style (voice & pedagogy) — LOCKED

- **Voice:** warm, friendly, conversational, second-person ("you"). Short paragraphs, concrete
  hooks ("Imagine you're guessing the price of a house…"), light humour, encouraging. Never dry or
  textbook-stiff. Italics for emphasis; `code` for symbols/terms; bold sparingly for key terms.
- **The 7-stage lesson arc** (each algorithm track follows it): Hook → Intuition → Mechanics →
  Math → Code → Levers (tune/optimise) → When & Why.
- **Every term gets text + visual + interactive — together, never prose alone.** Even "small"
  terms (accuracy, precision, prevalence, residual, gradient, MSE…) get their own micro-interactive.
- **Unifying throughline:** every supervised model = **a model form + a loss function + an
  optimiser**. Surface this pattern repeatedly so ML stops looking like 50 random algorithms.
- **Decision muscle:** end concepts with failure modes ("here's the data where this breaks") and a
  "reach for this when / avoid when" + an **interview-grade** answer callout.
- **Page structure convention:** chips (family colour + difficulty + read time) → serif `<h1>` →
  muted intro `<p>` → `.lesson` prose with `<h2>`/`<h3>` sections, interactives inline, a
  fundamentals-amber "callout" box near the end, then a prev/next footer linking sibling pages.
- **Authoring:** AI drafts, user reviews for accuracy & voice. **Accuracy bar is high** — verify
  every formula and run every code sample; this is educational.

**Active-recall doctrine (locked, 2026-07-04; components SHIPPED 2026-07-05).** Exposition alone
is not teaching. Retrieval beats re-reading; every track must exercise the learner, not just show
them. The shared components now exist — **new pages must use them, never reinvent them**:
- **Predict-before-you-drag:** key labs open with a one-line prediction prompt ("Which way will the
  line tilt when you add this outlier?") answered *before* the interaction reveals the truth.
  → `src/components/PredictPrompt.tsx` ("Predict first" chips; deliberately gives NO verdict — the
  lab below is the reveal). **Placement rule: it must sit before any prose that spoils the answer**,
  even if that means placing it a section above the lab.
- **Checkpoint quizzes:** 2–3 instant-feedback questions at the end of each chapter (a shared
  `<Quiz>` component), and a "Can you answer these?" interview-grade self-test at track end.
  → `src/components/Quiz.tsx` (commit → per-question right/wrong + explanation either way → score
  line). Rolled out across all 11 linear-regression chapters (33 questions) as the reference
  implementation; write questions that target *misconceptions* (residual sign, PI vs CI width,
  what a p-value isn't), not recall of trivia, and end tracks with a throughline question.
- **Decision points & guess-the-number** (capstone-proven, reusable anywhere a workflow decision
  or a numeric reveal occurs): `src/components/capstone/DecisionPoint.tsx` ("Your call" — pick
  before the reveal, per-option verdicts) and `GuessSlider.tsx` ("Guess before you look").
- **Make the tier system real in-page:** the 4-tier model must exist as UI, not just on `/map` —
  collapsible "Go deeper ▾" Tier-3 asides, and inline Tier-0 prerequisite pills ("needs: gradients →").
- **Surface the throughline as UI:** each algorithm hub opens with a recurring "anatomy card" —
  *this model's form / loss / optimiser* — so the unifying pattern is visible across tracks.
- **Reader progress is real:** localStorage read-marks per page → sidebar checkmarks, a true
  progress bar (not a count of built pages), and "continue where you left off" on the homepage.
- **Chapter recaps:** a one-paragraph "what you now know" at each chapter boundary; per-chapter
  (not just per-page) time estimates.
- **A "Start here" onboarding track is required** before the site can claim "from the very basics"
  — what is ML, the supervised/unsupervised/RL landscape, how to read Manifold, pick your path.
  ✅ Shipped 2026-07-05 — see §10.6 item 5.

---

## 5. UI / design system — LOCKED

> ⚠️ **2026-07-04: the colour system below is DEPRECATED.** The user rejected the current palette
> as "too AI-generated" — it is stock Tailwind swatches plus a purple-gradient CTA. The type
> system, layout, radius scale, motion rules, and editorial hierarchy in this section remain
> locked; **colour is governed by §10.1** until the new palette lands in `globals.css`, after
> which this section should be rewritten to match. Do not "restore" violet or Tailwind defaults.

The full source of truth is `src/app/globals.css`. Summary:

**Identity**
- Logo: `ManifoldMark` — a fine **wireframe saddle surface** (projected 3-D mesh in SVG), brand
  violet, with a dot at the saddle point. Distinctive/editorial, not a generic SaaS icon.
- Wordmark: "manifold" lowercase in Bricolage Grotesque.

**Type (locked combo)**
- `Instrument Serif` → display/hero headlines (often *italic* on the emphatic phrase). Class:
  `.font-serif`, var `--font-instrument-serif`.
- `Bricolage Grotesque` → wordmark, section/card titles, UI emphasis. Class `.font-display`,
  var `--font-bricolage`.
- `Geist Sans` → body & UI (default `body` font). var `--font-geist-sans`.
- `Geist Mono` → code/formulae. var `--font-geist-mono`.
- Do **not** replace the serif with a sans — it's the core of the identity.

**Two separately-tuned themes** (class `.dark` on `<html>`, persisted to `localStorage.theme`,
no-flash inline script in `layout.tsx`). Warmth comes from the *type*, not the surfaces — keep
surfaces bright/neutral, not cream.

Light tonal ladder (neutral-warm, bright): `--paper #fafaf8` (page) · `--surface #ffffff` (cards)
· `--surface-2 #f2f2ef` (insets/metric boxes) · `--panel #f5f4f1` (sidebar, slightly darker than
page for depth) · `--canvas #f6f6f3` (chart area) · `--border #ebebe7` · `--border-strong #e0e0da`
· `--ink #19191e` · `--muted #6f6e76` · `--faint #a4a3a0`.

Dark (luminous on near-black): `--paper #0c0d14` · `--surface #15161f` · `--surface-2 #1c1e29` ·
`--panel #12141f` · `--canvas #0f111a` · `--border #23252f` · `--ink #ecedf5` · `--muted #9fa0b0`
· `--faint #6e6f80`.

**Brand & CTA:** brand violet `--brand` (#7c3aed light / #a78bfa dark). CTA is a *toned-down*
gradient `--cta` (light #6d28d9→#8b3fd6, dark #8b5cf6→#b07ff0) — purple, deliberately **not** neon;
keep it visually lighter than the hero so hierarchy reads heading → subhead → action.

**Family colours** (one ramp per algorithm family; neutral gray for cross-cutting/foundational):
regression=blue `--c-regression`, classification=pink, clustering=teal, trees=green, neural=coral,
dimensionality-reduction=indigo `--c-dimred`, reinforcement-learning=gold `--c-rl`,
fundamentals/optimization=amber `--c-fundamentals`, pillars/theory/math=gray `--c-metrics`. Plus
semantic `--good`/`--warn`/`--bad`. Tailwind v4 exposes these as `bg-*`/`text-*` via `@theme inline`.

**Editorial / book hierarchy**
- Section headers as book "parts": small uppercase eyebrow ("Part one") + large serif title +
  muted sub, separated by a top divider rule (`.chapter*` classes).
- The `/map` depth strip: a "Read at any depth" band with 4 solid badges deepening
  **indigo→violet** (`#6366f1, #7c3aed, #6d28d9, #5b21b6`), white numerals.
- Cards (`.gcard`): white surface, 0.5–1px border, generous padding, **natural heights** (not a
  uniform grid). Hover = lift (translateY-3) + border adopts the family `--accent` + soft shadow;
  track links shift right and intensify to the accent.

**Radius scale (standardised):** surfaces/cards 16–24px · controls/buttons 10–12px · chips/pills
full (999px). No rounded corners on single-sided borders.

**Motion:** scroll-reveal via `Reveal` (`.reveal-item` → `.in`, staggered by index). Card hover
transitions. **All motion respects `prefers-reduced-motion`** (globals forces reveal-items visible
and kills transitions). Flat surfaces — no gradients/shadows except the CTA gradient and functional
hover shadow.

**Lesson scaffold:** `learn/linear-regression/layout.tsx` = sticky left **sidebar panel**
(`TrackSidebar`, on `--panel`, uppercase chapter headers + indented children + active-page violet
highlight + progress "N / 44") next to a max-720px content column.

---

## 6. Tech stack & conventions

- **Next.js (App Router) + TypeScript + React 19.** Static-first (all pages prerender).
- **Tailwind CSS v4** (CSS-first: `@import "tailwindcss"`, `@custom-variant dark`, `@theme inline`
  token mapping in `globals.css`). Theming is via **CSS variables** — components mostly use inline
  styles referencing `var(--…)` so they're automatically theme-correct.
- **Interactives are hand-built**: SVG + vanilla React state (no D3/Chart.js yet). Common patterns:
  pointer-drag via a window `pointermove`/`pointerup` listener gated on a `dragging` state + an
  SVG `getBoundingClientRect()` → data-coord mapping; deterministic in-component math (OLS, IRLS
  for L1, gradient descent, normal CDF, etc.). All displayed numbers are rounded.
- **3-D is faux**: projected geometry in SVG (see `ManifoldMark`, `LossSurface3D`). No `three` /
  `@react-three/fiber` installed yet (parked — see §3).
- **Fonts** via `next/font` (`Instrument_Serif`, `Bricolage_Grotesque`) + the `geist` package
  (`GeistSans`, `GeistMono`).
- **Content** is currently authored as `.tsx` page components (not MDX yet). MDX/Fumadocs is the
  longer-term plan from `curriculum-map.md` but TSX is fine and fast for now.
- **Adding a lesson page:** create `src/app/learn/<track>/<slug>/page.tsx`, build its lab
  component(s) in `src/components/labs/`, add the `href` to the page's entry in the track data
  (`src/lib/linearRegressionTrack.ts`) so the sidebar marks it live + progress updates, and link
  the previous page's "Next up" footer to it.

---

## 7. Critical workflow rules & gotchas

- **NEVER run `npm run build` while the dev server is running.** They share `.next/` and the build
  clobbers the dev server's webpack chunks → runtime error `Cannot find module './611.js'`. **Fix:**
  stop dev → `rm -rf .next` (PowerShell: `Remove-Item -Recurse -Force .next`) → restart dev.
  **Verify changes through the running dev server, not `build`.**
- **Verification loop:** use the Claude Preview MCP. `.claude/launch.json` defines the `manifold`
  dev server (npm run dev, port 3000). `preview_start` → `preview_eval` to navigate
  (`location.assign('/path')`) → `preview_screenshot` → `preview_logs level:error`. The user is on
  Windows; the dev server hot-reloads on edits.
- **Programmatic scrolling** in `preview_eval` is async because `html { scroll-behavior: smooth }`.
  Set `document.documentElement.style.scrollBehavior='auto'` before `scrollTo`, or compute target Y.
- **Scaffold note:** `create-next-app` refused because the dir contains `.claude/`; the project was
  scaffolded manually (package.json + configs hand-written). Keep that in mind for tooling.
- **Run it:** `npm install` then `npm run dev` → http://localhost:3000.

---

## 8. User preferences & how to work with them

The user is an **experienced full-stack developer with a strong editorial design sense** and gives
precise, high-quality art direction (composition balance, type hierarchy, visual weight, saturation,
radius consistency, logo sophistication). They care equally about **teaching depth** and **beauty** —
both must be satisfied. Work style that's worked well:
- **Show, don't tell** — build the real thing / render a visual and let them react; they iterate.
- Lead with strong opinionated defaults, then refine on their specific feedback.
- They've explicitly asked to keep the serif, the editorial direction, warm-but-bright surfaces,
  and toned-down (non-neon) accents. Past corrections: don't over-warm surfaces into cream; give
  cards real tonal separation + hover; make section headers book-like; avoid washed-out low-contrast
  badges. Honour these going forward.

See also the persistent memory notes: `manifold-project.md` and `user-design-taste.md`.

---

## 9. Audit — LR built out: true state & remaining work (2026-06-21)

Reality on disk: **all 44 LR pages exist and are linked** in `linearRegressionTrack.ts` (§2's
"11 pages" line is stale), with **25 labs**. `npx tsc --noEmit` passes clean. Coverage is complete;
the gaps are about filling to spec:

1. **The "Code" stage is entirely missing** (highest priority). No page has code — no from-scratch
   (NumPy/TS) and no with-a-library (sklearn/statsmodels); no Shiki/Sandpack installed. Add a Shiki
   `CodeBlock` + a "The code" section (From scratch → With a library) on the spine pages first.
2. **Interactivity is uneven.** 24 pages have a lab; **5 have a static visual only** (why-predict,
   what-best-means, linearity, homoscedasticity, normality-of-residuals); **15 have no visual at
   all** — highest-value missing labs: residual-vs-fitted, heteroscedasticity-in-depth,
   detecting-non-normality (Q–Q), r-squared-and-adjusted, cross-validation-bias-variance,
   bias-variance-revisited, multicollinearity, confidence-intervals, transformations,
   weighted-least-squares. Prefer one shared residual-diagnostics lab across the residual pages.
3. **No KaTeX** — math is monospace/Unicode; add proper typesetting.
4. **Runtime verification** still owed: type-check passes, but do a dev-server screenshot pass of all
   44 pages (never `build` while dev runs).
5. **Redundancy/cross-links:** reconcile homoscedasticity vs heteroscedasticity-in-depth and
   cross-validation-bias-variance vs bias-variance-revisited; add forward links to the future
   Evaluation & Metrics / Data Workflow pillars.

---

## 10. Direction review (2026-07-04) — the improvement doctrine · LOCKED

A full project review (docs, design system, landing page, `/map`, lessons across all five live
tracks, labs, CodeBlock runtime, capstone, live screenshots in both themes) produced this doctrine.
**It is the core philosophy going forward; where it conflicts with older sections, §10 wins.**
State at review time: ~180 lesson pages live across linear regression (44), k-means (45),
regularized regression, polynomial regression, KNN (partial), plus the executed California-housing
capstone. Content engine strong; the three weak points were the palette, the landing page, and the
absence of active recall.

### 10.1 Colour doctrine — v2 "risograph" (LIVE in `globals.css` since 2026-07-04)

Why the old palette failed: every accent was a default Tailwind swatch plus a purple-gradient CTA
and a blue-black dark mode — the exact fingerprint of AI-scaffolded sites. A first replacement
(muted archive pigments: delft/madder/verdigris/moss) fixed the AI look but the user found it too
somber. **The locked direction is v2: colourful, poppy, fun — via risograph inks.** Riso is a
curated *print medium* with naturally vivid, saturated, warm hues, so the site stays editorial and
distinctive while being genuinely colourful. This is the identity; do not drift back to either
Tailwind defaults *or* somber archive tones.

The rules:
1. **No gradient CTAs, ever.** The primary CTA is **solid riso blue `#0078bf` in BOTH themes**,
   white text, no lifting (revised 2026-09-15 — the old lifted `#4da8ec` with dark text was the
   single most generic element on the dark page; the undiluted ink reads as a printed block and
   white on it still clears AA at 4.73:1 on the dark ground). Solid colour only.
2. **Ink is still the brand for chrome & type** (`--brand` = ink): logo, links, sidebar highlight,
   progress, primary data lines in labs. The chroma lives in the family colours and the two
   accents: `--brand-2` riso fluorescent pink `#ff48b0` (the "signal"/moving-point accent) and
   `--brand-3` riso gold `#e8a000`. Never purple-as-brand.
3. **Family palette = real risograph ink hues** (light theme; dark theme = lifted versions):
   - Regression: riso blue `#0078bf`
   - Classification: riso pink `#e5399e` (deepened from fluoro for text contrast)
   - Clustering: riso teal `#00838a`
   - Trees: riso green `#009155`
   - Neural: riso orange `#e8541f`
   - Dimensionality reduction: riso violet `#765ba7`
   - Reinforcement learning: riso gold `#c28400` (text-safe) · Fundamentals: bright amber `#d97a00`
   - Semantic: good `#009155` · warn `#d97a00` · bad `#e0442c`
   References: actual risograph ink charts, Figma brand primaries, mid-century poster inks.
4. **Dark theme stays warm-neutral paper-at-night, and is SPACED IN L\*, not in hex**
   (reworked 2026-09-15 — the user liked the light theme and not this one). The first version was
   `--paper: #121211` with 8-unit hex steps to surface and surface-2, which put the entire page
   inside L\* 5-14: cards did not lift (1.08:1), hairlines were invisible (1.32:1), and `#eceae4`
   type glared at 15.6:1. **Perceived lightness compresses toward black, so a dark ramp needs
   BIGGER steps than the light one, not the same steps inverted.** The ladder is now
   paper `#1a1916` (L\* 9) · canvas `#201f1b` · panel `#23221f` · surface `#2a2926` (L\* 17,
   1.21:1 — a real lift) · surface-2 `#353431` · border `#41403d` (1.70:1 on paper) ·
   border-strong `#54534f`, with ink `#e9e5dc` / muted `#a9a59b` / faint `#837f75`. Two dark-only
   overrides come with it: `--selection` uses the blue ink (a near-white wash behind near-white
   text was unreadable) and `--shadow-lift` is a real black shadow (the light one mixes `--ink`,
   which is near-white here, so it painted a white haze under every hovered card). Riso hues stay
   lifted — vivid on warm dark is fine; neon-on-blue-black is not. **Bonus the lift bought:** the
   theme-independent skins (`--space-sky #0b0b16`, `--krat-soot #0e0c0d`, the `--wh-*` concrete)
   now sit clearly apart from the page instead of blending into it.
5. **Code themes use the same riso hues** (violet keywords, teal strings, blue properties, pink
   classes, gold entities) — colourful but never Dracula.
6. **Sweep rule stands:** no hardcoded accent hexes in labs/pages; everything through tokens.

### 10.2 Landing-page doctrine

The landing page must **prove the product, not describe it**. Required structure:
1. **A live lab in the hero** — a real draggable mini-lab (line-of-best-fit with live MSE),
   captioned only "drag the line". Ten seconds in, the visitor has *used* the product. This
   replaces the static `LossLandscapeArt`.
2. **"How it teaches" band** — the 4 depth tiers + the 7-stage arc, in the book-part editorial style.
3. **The shelf, not featured cards** (revised 2026-09-15). Hand-picked track cards rotted: the
   landing page still advertised 5 tracks and the footer 15 when the site had 30. Replaced by
   `<Shelf>` (`src/components/Shelf.tsx`) — one editorial index row per family with its real page
   count, the whole track list (unbuilt entries shown greyed, which is the honest version), and the
   family colour as the only chrome. Rows for PILLARS/FOUNDATIONS pass `unit="chapters"`, because
   there the *group* is the track and its entries are chapters. Each row carries its **signature
   visual** (`src/components/figures/FamilyGlyph.tsx`, 88x50, inherits `--accent`). Per §12.2.4
   these are not decoration: where the maths IS the idea the geometry is COMPUTED at module load
   (least-squares fit, Lloyd's iterations, the covariance's leading eigenvector, Gini-optimal tree
   cuts, gradient descent on the drawn contours, an ROC from two score distributions, and a
   shattering dichotomy whose fills are derived from the side test). Only the network wiring, the
   grid-world policy, the pipeline and the k-fold split are hand-laid, because those objects have
   no data in them. Add a glyph for any new family in `GLYPH_FOR`.
4. **Capstone showcase** — every capstone carries a signature figure of its OWN world:
   `HousingGeoMap`, `NeoField`, `WarehouseFloor` (the real 5x8 shop floor, spill wall and two
   crossings, with a BFS-verified 21-step dock→shelf→drop route, painted in the `--wh-*` skin).
   Render `CAPSTONES` by `.map`, never by index, or new capstones silently never appear.
   The headline result is **structured, not a string**: `metric` / `from` / `to` / optional `note`,
   typeset by `CapstoneCard` as a micro-label above `from → to` with `to` large in Instrument Serif
   in the capstone's accent. Never go back to packing it into one bold line like
   "−816 → 21.2 (oracle 21.2)".
   ⚠️ **Every capstone figure shares one 640x300 frame, and every blurb is ~135-160 characters.**
   The card body ends with `marginTop: auto`, so in a stretched grid row ANY difference in figure
   aspect or blurb length becomes dead space above the stat line. `HousingGeoMap` was square, which
   opened a 197px hole in the asteroid card; it now takes a `wide` prop that letterboxes it for the
   card — the map keeps its true proportions on the left and the extra width carries the value
   histogram (binned from `GEO` at module load, so it is the map's legend as well, and it shows the
   censored target: 18 of the 260 blocks sit exactly at the $500k cap). Match the frame and the
   blurb length when adding a fourth capstone, or the row goes ragged again.
5. **A footer** — derived link columns (families / deepest tracks / capstones), the numbers, and a
   type-nerd colophon on its own rule (on-brand for Stripe Press).
6. **No dead chrome:** header items exist only if their pages exist; family chips link to `/map`.
7. **A closing band** — the three house rules (numbers reproduced · labs run real maths · unbuilt
   pages say so). The page needs an ending, and that honesty *is* the differentiator.

**`CurriculumAtlas` was DELETED 2026-09-15 — do not rebuild it.** `/map` used to open with a
node-and-arc diagram: ten pastel family boxes on a 1000x520 canvas joined by seven curves. It failed
its own brief three ways. The arcs were **unlabelled**, so the picture could show *that* two families
were linked but never *why* — the entire payload lived in the caption underneath. The ten nodes
**re-listed the same ten families** that the group cards ~200px below already list. And it needed
`min-width: 760px` inside a horizontal scroller, so on a phone it was a sideways-scrolling box. Per
§12.2 a graphic whose whole content is its own caption has not earned its ink. Replaced by
`src/components/Throughlines.tsx`: one line per link, `A → B` in the two families' own accents with
the crossing idea spelled out — smaller, honest, readable at every width, and it finally says the
thing the curves were gesturing at.

**LOCKED RULE (2026-09-15): no page/track/capstone count is ever typed by hand.** Everything comes
from `src/lib/catalog.ts`, which imports every `*_TOTAL` / `*_DONE` and exposes `SITE`, `countsFor()`
and `groupPages()`. The landing page, `/map` and the footer all read from it, so adding a page
updates all three. ⚠️ `countsFor()` falls back to the track ROOT href, so a group whose entries are
chapters of one track (the pillars, the foundations) will otherwise print that track's total once
per chapter — `Shelf`, `Footer` AND the map's `GroupCard` each guard against it (gate the
per-entry count on the group having more than one distinct track). This has now been hit three
times; add the guard to any new consumer.

### 10.3 Lab standards

- ✅ **`<LabFrame>` shipped 2026-07-05** (`src/components/LabFrame.tsx`): "Try this:" prompt above
  the lab + an **insight caption revealed only after first interaction** (generic
  `onPointerDownCapture` detection — wraps any lab unmodified). Live on the four flagship LR labs
  (line-of-best-fit, outlier, gradient-descent, SGD-comparison); wrap new labs from day one.
  Labs must never be pedagogically silent — and the insight must not spoil the interaction.
- **Challenge mode** on key labs ("get the loss below 2.0", "place 3 centroids so k-means converges
  wrong") — goals convert fiddling into learning. (Still open.)
- ✅ **CodeBlock is editable 2026-07-05** — Edit/Done toggle + per-tab drafts + "Reset code";
  Run executes the learner's edited code. Still open: preload Pyodide when a runnable block
  scrolls into view.
- Lab state persists in the URL hash (shareable configurations). (Still open.)
- ✅ **Touch drag targets 2026-07-05** — draggable SVG handles carry an invisible r=22 hit circle
  (LineOfBestFitLab, OutlierLab, GradientTangentLab; HeroFitLab already had one; InfluenceLab
  drags at the svg level). New labs must do the same.

### 10.4 Capstone standards

The capstone must simulate *being* the senior DS, not just reading one:
- **Decision-point widgets** at each diagnostic: "What would you do next?" — 3 options, feedback on
  each, before revealing the chosen path.
- **Predict-the-number moments** before big reveals (guess the random forest's R² on a slider).
- **Ship the artifacts:** downloadable/Colab notebook + dataset — "reproduce this yourself" is the
  natural exit.
- **A "your turn" epilogue:** a second dataset (the estate-housing CSVs) with the same framing
  questions and no answers — the transfer test.
- EDA/diagnostics pages should carry at least one interactive figure (residual-map explorer,
  hoverable correlation matrix), not only static ones.

> **RL capstones have their own doctrine — see §13** (planned 2026-09-08: tabular control, a Hill
> Climb Racing neuroevolution clone, and a Lies-of-P imitation-learning *field report*). §13 also
> introduces a **second capstone genre**, the **field report / build log** — documents a real project
> built off-site, links to GitHub/HuggingFace artifacts, and ships its results only after the real
> model exists (the honest-numbers rule still binds).

### 10.5 UI / code-health rules

- **Extract shared lesson primitives BEFORE the recolour**: `<LessonHeader>` (chips + h1 + intro),
  `<Callout>`, `<PrevNext>`, `chip()`/`callout`/`navLink` styles are currently copy-pasted inline
  into ~180 pages — global design changes must be a one-file edit, not a 180-file migration.
- **Search** ✅ DONE 2026-07-05 — dependency-free ⌘K palette in the Header
  (`src/components/SearchPalette.tsx`) over `src/lib/searchIndex.ts`, which builds its index from
  the track libs (same source of truth as the sidebars, so it cannot drift). **A new track becomes
  searchable by adding its track lib to `searchIndex.ts` — one import, nothing else.**
- **Mobile** ✅ DONE 2026-07-05 — all six track layouts now render through
  `src/components/LessonShell.tsx` (client component): desktop keeps the sticky-aside grid, ≤900px
  hides the aside and shows a fixed "Contents" pill that opens a left-slide drawer (closes on link
  tap / backdrop / Escape; body scroll locked while open). Shell styles live in `globals.css`
  under `.lesson-shell` / `.lesson-drawer*` — **new track layouts must use `LessonShell`, never a
  hand-rolled grid.**
- Keep `/map` (`siteMap.ts`) honest — every live track marked live, no stale "soon".

### 10.6 Roadmap re-sequencing (supersedes §3 ordering)

1. ✅ **DONE 2026-07-04** — shared lesson components live in `src/components/lesson.tsx`
   (`Chip`, `LessonHeader`, `Callout`, `PrevNext`); all 140 lesson pages migrated via codemod
   (140 headers, 132 footers, 117 callouts). ~20 pages keep a local `callout`/`navLink` const for
   extra in-body elements — fine. **New pages must use these components, never inline copies.**
   Also done: reader progress (`src/lib/progress.ts` + `TrackSidebar` records visits in
   localStorage → per-page ✓ marks, real "N of M pages read" bar in the track accent, and a
   "continue where you left off" card on the landing page via `ContinueCard`).
2. ✅ **DONE 2026-07-04** — new palette + solid ink CTA + warm dark theme + non-neon code themes
   live in `globals.css`; violet ramp on `/map` replaced with an ink-deepening ramp; `--cta-text`
   token added and all lab CTA buttons migrated; stray hexes in `ElbowLab`/KaTeX fixed.
3. ✅ **DONE 2026-07-04** — landing page rebuilt: live draggable `HeroFitLab` in the hero (real
   OLS math, live error readout, least-squares recognition), "how it teaches" tier band + lesson
   arc, live-track cards with real page counts from the track libs, capstone showcase (geo map +
   R² 0.653→0.858), site-wide `Footer` (learn links + colophon), dead header nav removed
   (Capstone link added).
4. ✅ **DONE 2026-07-05 (all live tracks)** — `<Quiz>` + `<PredictPrompt>` shipped
   (`src/components/Quiz.tsx`, `PredictPrompt.tsx`; see §4 for usage rules). Live: 11 chapter
   checkpoints + a whole-track final test across linear regression, predict-first chips on the four
   flagship LR labs. **Extended 2026-07-05 (same day, later):** 7 chapter-end checkpoints across
   k-means (curse-of-dimensionality, hard-assignment-voronoi, mini-batch, k-means++,
   information-criteria, cluster-stability, vs-dbscan) + predict-first on the three flagship
   k-means labs (index KMeansLab, KMeansPlusPlusLab, ElbowLab); 3 checkpoints in regularized
   regression (penalty-vs-constraint, choosing-lambda, which-when); 1 each on KNN
   (from-1-nn-to-k-nn) and polynomial (linear-in-parameters). The logistic and Start-here tracks
   were born with them. Also done 2026-07-05: **site search** (§10.5).
5. ✅ **DONE 2026-07-05** — "Start here" onboarding track: 5 fully-built pages under
   `/learn/start-here` (`src/lib/startHereTrack.ts`), accent `--c-fundamentals`. Arc: fit a line
   by hand in minute one (LineOfBestFitLab + predict-first) → the three families (one-question
   test) → model = shape + loss + optimiser (+ checkpoint quiz) → how to read Manifold (tiers,
   labs, honest-numbers promise) → pick your path (routes into LR / k-means / capstone + final
   checkpoint). Registered in `searchIndex.ts`, "Start here" link in the Header, on-ramp link atop
   `/map`. Built to the §11 checklist from page one.
6. ✅ **DONE 2026-07-04** — capstone interactivity per §10.4: `DecisionPoint` ("Your call" —
   pick before the reveal, per-option verdicts: senior move / defensible / wrong) on framing
   (metric), data-quality (negative populations), diagnostics (which upgrade first),
   censored-regression (handle the cap), model-selection (which model to ship); `GuessSlider`
   ("Guess before you look" — commit on a slider, reveal marks the truth) on eda (income corr
   0.691), linear-models (R² 0.653), spatial-features (ΔR² +0.019), gradient-boosting (RF 0.834).
   Takeaways gained a 5-question "Defend it" interview self-test (details/summary) and a
   "Your turn" transfer-test epilogue. Components: `src/components/capstone/`. All feedback uses
   only numbers already published on the pages — nothing fabricated. NOTE: `GuessSlider` takes
   `decimals`/`signed` props, never a function prop (RSC boundary).
   **2026-07-05 additions:** bonus epilogue page `/learn/california-housing-capstone/censored-boosting`
   (Tobit-objective LightGBM — real runs: CV exact tie 0.855, cap-zone RMSE 0.911→0.848 — plus
   per-prediction SHAP waterfalls; figures in `src/components/figures/CapstoneBonusFigures.tsx`);
   downloadable artifacts in `public/capstone/` (dataset CSVs + a fully-executed reproduction
   notebook), linked from takeaways. ⚠️ The published capstone numbers come from the ORIGINAL
   experiment pipeline, not the compact code shown on the pages — the notebook is the ground truth;
   details in the auto-memory note `capstone-pipeline-truth.md`. Any future capstone must ship the
   same way: notebook + dataset downloads, and every published number reproduced by executing them.
   **Reproducibility guard (2026-07-05):** `scripts/verify_capstone.py` executes every notebook
   code cell and regex-checks all 26 published capstone numbers against a manifest (exit 1 with a
   drift diff on any mismatch; currently passing). Run it after touching the notebook, the dataset,
   or any capstone page number.
7. ✅ **STARTED 2026-07-05 (18 of 25 pages live — all of Tiers 1 & 2)** — logistic regression track at
   `/learn/logistic-regression` (`src/lib/logisticRegressionTrack.ts`, accent
   `--c-classification`). **Tier-1** (6 pages): from-numbers-to-categories (why linear+threshold
   fails, real run: preds −0.53..1.10, 86% thresholded), the-sigmoid (odds/log-odds derivation,
   `Term` popovers), the-decision-boundary (+ checkpoint), log-loss, the-beautiful-gradient
   (same-form-as-linear gradient; honest beat: sklearn L2-regularizes by default so scratch-GD and
   sklearn weights differ — both printed from real runs), thresholds-and-the-confusion-matrix
   (+ checkpoint). Tier-1 labs: `SigmoidLab`, `DecisionBoundaryLab`, `LogLossLab`, `ThresholdLab`
   on `LOGISTIC_SETUP` (`runtimeSetup.ts`: class_sep 0.9, flip_y 0.07, rs 11 — deliberately
   overlapping). **Tier-2 (added 2026-07-05 evening, 7 pages):** chapter *Reading the model* —
   coefficients-odds-ratios-effect-size (`OddsRatioLab`: the same OR moves a 50% case more than a
   10% case), standardize-before-you-compare (raw vs per-SD coef bars), statistical-significance
   (statsmodels z/p/CI, why sklearn withholds them); chapter *Making it work* —
   regularized-logistic (C-sweep coef path, sklearn's silent default), class-imbalance
   (`ImbalanceLab`: the accuracy trap — 94.7% acc catches 13/61; three real strategies),
   feature-engineering (circular data 63.5%→94.5% with degree-2), when-perfect-separation-breaks
   (`SeparationLab`: drag classes apart, weight runs to ~39, sigmoid → step, warning; L2 pins it —
   the honest-failure page). **Tier-2 batch 2 (added 2026-07-05 late, 5 pages):** chapter *Beyond
   two classes* — softmax-and-multinomial (`SoftmaxLab`: drag a query dot across 3 real blobs,
   the 3 probabilities always sum to 1; softmax = the NN output layer), one-vs-rest-and-one-vs-one
   (real accs softmax 0.928 / OvR 0.922 / OvO 0.928; 1 vs 3 vs 3 models); chapter *Probabilities
   you can trust* — calibration (`CalibrationLab`: logistic on the diagonal, Brier 0.092, vs naive
   Bayes overconfident S, Brier 0.130 — the proper-scoring-rule story), roc-auc-and-thresholds
   (`RocLab`: walk the curve, AUC 0.881 shaded — generalizes `ThresholdLab`), cost-sensitive
   (`CostLab`: t* = C_fp/(C_fp+C_fn) drives the operating point; a dividend of calibration). All
   numbers from `scripts/logit_tier2*.py`; interpretable `CREDIT_SETUP` loan dataset (seed 42,
   n=1200) in `runtimeSetup.ts` so code blocks Run. **Tiers 1 & 2 are now complete** — only Tier-3
   (theory, 4 pages) and *In the wild* cases (3) remain greyed. Registered in searchIndex + siteMap.
   NOTE: `RocLab`/`CostLab`/`CalibrationLab` are the seed for the Evaluation & Metrics pillar.
8. ✅ **DONE 2026-07-05** — tier system + throughline surfaced in-page (old improvement-list item):
   `TrackChapter` gained `tier?: 1|2|3`; all track libs annotated; `TrackSidebar` renders T1/T2/T3
   badges (ink-deepening ramp, hover for tier name) on chapter headers. New `ModelAnatomy`
   component (form / loss / optimiser strip) sits atop every track index — LR, k-means,
   regularized, KNN (form: "the training set itself"), polynomial, logistic. New `Term` component
   (`src/components/Term.tsx`): inline tap-to-reveal glossary popovers — used for SHAP / base
   value / additivity / TreeExplainer on the capstone bonus page and odds / log-odds / log loss /
   convex / confusion-matrix / precision / recall on the logistic track. Use it wherever a page
   leans on jargon it doesn't own.
9. ✅ **DONE 2026-07-05** — interactive SHAP: `ShapExplorerLab` on the censored-boosting page
   replaces the three static waterfalls — step through real TreeExplainer values feature by
   feature (case switcher coastal/inland/capped, running total, additivity check that lands on the
   model's exact output). Wrapped in LabFrame + predict-first. Static `ShapWaterfallFig` remains
   exported but unused.
10. **Next up (per §12.7):** logistic Tier-2 remaining chapters — *Beyond two classes* (softmax /
   multinomial, one-vs-rest) and *Probabilities you can trust* (calibration, ROC/AUC,
   cost-sensitive; the ROC/PR lab generalizes `ThresholdLab`); then the **Evaluation & Metrics
   pillar** first pages (classification's missing ending — `ThresholdLab`/`ImbalanceLab` are the
   seed); then LR §9 static-page upgrades; then KNN/polynomial completion.

---

## 11. Authoring checklist — every NEW track/module ships with this built in · LOCKED (2026-07-05)

The shared components exist; the philosophies are no longer aspirational. A new track (e.g.
logistic regression, "Start here") is built to this checklist from page one — none of it is a
retrofit pass to do "later":

**Scaffolding (one-time per track)**
1. Track lib in `src/lib/<track>Track.ts` (chapters → pages, `href` = live). This single file
   drives the sidebar, the progress bar, **and search** — import it in `src/lib/searchIndex.ts`
   and the whole track is instantly searchable.
2. Layout = `LessonShell` wrapping a `TrackSidebar` (family accent, done/total from the lib) —
   this gives desktop grid + mobile drawer for free; never hand-roll the shell. Update `/map`
   (`siteMap.ts`) honestly — live means live, partial means partial.

**Every lesson page**
3. Shared lesson primitives only: `LessonHeader`, `Callout`, `PrevNext` from
   `src/components/lesson.tsx`. Never inline copies.
4. Text + visual + interactive together (§4). Labs are hand-built themed SVG using tokens only —
   no hardcoded hexes (§10.1 sweep rule).
5. Math in KaTeX (`src/components/Math.tsx`), code in `CodeBlock` (+ `setup` preamble for a Run
   button where the runtime supports it), captured outputs in `CodeOutput` — **outputs are real
   runs, never invented** (see rule 10).

**Active recall (§4 — required, not optional)**
6. `<PredictPrompt>` before each flagship lab — and before any prose that spoils the answer.
7. `<Quiz>` (2–3 questions) at every chapter-end page; questions target misconceptions, not
   trivia. Track ends with a throughline/final-test quiz.
8. `<DecisionPoint>` / `<GuessSlider>` wherever the reader faces a workflow decision or a
   numeric reveal (proven in the capstone; not capstone-only).

**Numbers & honesty**
9. Every metric, coefficient, and figure datum on a page is computed from a real run, and the
   protocol (seed, CV folds, split) is stated on the page.
10. The exact scripts that produced published numbers are preserved (scratchpad is not an
    archive — commit them or bake them into the downloadable notebook). The capstone drift
    incident (pages showed simplified code that did NOT reproduce the published 0.653; see
    §10.6 item 6 note) is the cautionary tale: **if page code and real protocol differ, say so
    on the page and make the notebook the ground truth.**
11. Capstones additionally ship their artifacts: dataset + fully-executed reproduction notebook
    in `public/<capstone>/`, downloads linked from the final page.

**Definition of done for a page**
12. Type-checks, renders in BOTH themes via the dev server (never `npm run build` while dev
    runs), no console errors, prev/next chain intact, track lib updated, and at least one
    active-recall element present.

---

## 12. The complete playbook — philosophy, craft, review & priorities · HANDOFF (2026-07-05)

> This section is the distillation: everything above compressed into the judgement calls the next
> lead (Opus 4.8 or whoever) will actually face. §§4, 10, 11 stay authoritative for their
> specifics; when you're unsure *how to decide*, decide from here.

### 12.1 The north star, in one paragraph

Manifold wins when a reader **feels an idea move under their hands** before they ever see its
formula — and when the page they felt it on is beautiful enough to screenshot. Every decision
serves those two sentences. If a proposed page, feature, or redesign doesn't either deepen the
felt understanding or raise the visual bar, it's scope creep — cut it. The competition isn't
other ML courses; it's the reader's belief that ML is memorization. The product is the moment
that belief breaks.

### 12.2 Style philosophy — what "attractive" actually means here

The site's beauty is **editorial, not decorative**. It comes from five sources, in priority order:

1. **Typography carries the identity.** Instrument Serif display headlines (italic on the
   emphatic word), Bricolage for UI emphasis, Geist for body. If a page looks bland, the fix is
   almost never "add colour" — it's hierarchy: a better serif headline, a tighter intro, a real
   eyebrow. Colour is seasoning; type is the meal.
2. **Restraint reads as confidence.** Flat surfaces, hairline borders, generous whitespace,
   natural card heights, no gradients (the one gradient ban is absolute — §10.1 rule 1). The riso
   palette is allowed to be vivid *because* everything around it is quiet. One accent per
   context; the family colour is the accent; ink is everything else.
3. **Precision is an aesthetic.** Aligned baselines, the 16/12/999 radius scale, consistent
   metric-box styling, labels that never collide, SVG labs whose axes are labelled and whose
   numbers are rounded. Sloppy detail reads instantly as template output — the #1 thing this
   project defines itself against (§1 anti-AI rule).
4. **Every visual earns its ink.** A figure exists to make an argument, not to break up text. If
   a static figure could be a sentence, make it a sentence; if it could be interactive, make it
   interactive. Decoration-only graphics are banned.
5. **Motion is punctuation, not spectacle.** Scroll-reveals, hover lifts, a drawer slide, an
   insight fading in after interaction — 200–500ms, eased, always honouring
   `prefers-reduced-motion`. Nothing loops, nothing bounces, nothing autoplays.

The taste test for anything new remains: *"would this appear in a Stripe Press book or an
Observable notebook?"* — and its sharper variant: *"could a reader tell this apart from a
scaffolded AI site in one glance?"* If not, redo it.

### 12.3 Content craft — how to write a page that teaches

The 7-stage arc (§4) says what to cover; this is how to make it land:

- **Open with a situation, not a definition.** "A friend asks what their house might sell for"
  beats "Linear regression is a supervised method". The reader should be nodding before they
  know they're learning. First technical term appears only after the situation demands it.
- **One page = one insight.** Name it in one sentence before writing (e.g. "the boundary is
  where the model shrugs"). Everything on the page either builds to it or applies it. If you
  find two insights, that's two pages.
- **The lab IS the argument.** Prose before the lab sets up the question; prose after the lab
  names what the reader just saw. Never narrate the lab's conclusion before the reader has
  touched it (this is the PredictPrompt placement rule generalized).
- **Jargon debt is paid on the spot.** A term the page leans on but doesn't own gets a `<Term>`
  popover (odds, base value, convex…); a term the page *owns* gets the full text + visual +
  interactive treatment. No term is ever used and explained "later".
- **Numbers are characters, not wallpaper.** Every number in prose is real (real runs, §11) and
  *does* something — 0.653 → 0.858 tells a story; "high accuracy" tells nothing. When two
  honest numbers disagree (scratch GD vs sklearn's silent L2 default), that discrepancy is the
  most valuable paragraph on the page — never smooth it over.
- **End with judgement, not summary.** The closer is "reach for this when / it breaks when /
  here's the interview answer" — decision muscle, not recap. Recap belongs to the chapter
  quiz, which tests misconceptions, not vocabulary.
- **Voice check:** read the intro aloud. If it couldn't be said to a smart friend at a
  whiteboard, rewrite it. Warm, second person, concrete, a little wry. Never breathless
  ("amazing!", "magic!"), never stiff ("we shall now consider").

### 12.4 Interactivity craft — what separates a good lab from a widget

- **One manipulable cause, one visible effect, one readout.** LineOfBestFitLab: drag ends →
  line moves → MSE ticks. Add a second independent control only when the *interaction between
  controls* is the insight (learning rate × steps; w₁ w₂ b aiming a boundary).
- **The failure case is playable.** Every lab should let the reader break something: push the
  learning rate past 1.0, set k=3 on 4 blobs, crank w until log loss explodes. Understanding
  lives at the boundary of failure.
- **Immediate, continuous feedback** — readouts update during the drag, not on release. Sliders
  (native `input type=range`) over drag-handles unless spatial dragging IS the concept; where
  drag-handles are the concept, invisible r=22 hit circles (§10.3).
- **A "snap to truth" button** wherever there's a fitted optimum — the reader tries by hand,
  then sees how close they got. The gap between their attempt and the optimum is the lesson.
- **Labs never lie.** Data and fitted values inside labs come from real runs, hardcoded with a
  comment citing the run (see SigmoidLab/DecisionBoundaryLab headers). A lab with fake-friendly
  data (perfectly separable classes, noiseless fits) teaches a false world — build the honest
  overlap in (LOGISTIC_SETUP's flip_y=0.07 exists precisely for this).
- **Wrap in `<LabFrame>`**: the "Try this" tells the reader what experiment to run; the insight
  (revealed only after interaction) tells them what they should have noticed. Neither spoils;
  both direct.
- **Component decision table:** prediction the lab will settle → `PredictPrompt` · chapter-end
  understanding check → `Quiz` · workflow fork with a defensible-vs-senior answer →
  `DecisionPoint` · numeric reveal → `GuessSlider` · guided lab → `LabFrame` · in-sentence
  jargon → `Term` · track-index anatomy → `ModelAnatomy` · sequential additive reveal →
  the ShapExplorerLab stepping pattern (reusable for any build-it-up figure).

### 12.5 The review loop — how to audit and improve

Run reviews as **three separate passes** — mixing them produces shallow notes on all three:

**Pass 1 — Truth audit** (highest stakes). Re-run every published number; run
`python scripts/verify_capstone.py` (exit 0 required) after touching anything capstone-adjacent;
diff page code samples against the protocols that produced their outputs; check that stated
seeds/splits match. Any number that can't be reproduced gets fixed or removed the same day —
the site's credibility is a single broken number away from "typeset to look plausible".

**Pass 2 — Pedagogy audit** (per track). Walk the track as a reader who knows nothing: Does
each page's one insight land before its formula? Is every flagship lab preceded by a prediction
and followed by a named observation? Do quizzes catch the misconception the page was built to
prevent? Is there a stretch of 3+ pages with no interaction (= dead zone; add a micro-lab or
merge pages)? Does the chapter sequence still make sense now that later pages exist?

**Pass 3 — Design audit** (screenshot-driven). `preview_screenshot` key pages in **both themes
and at mobile width** (`preview_resize`). Look for: hierarchy collapse (two elements competing),
token violations (`grep -rn "#[0-9a-f]\{6\}" src/components/labs src/app/learn` should stay
clean), label collisions in SVGs, orphaned widows in headlines, chip/badge inflation (max ~2
chips per header), inconsistent metric boxes. Fix classes of problems in the shared component,
never page-by-page.

**Cadence:** truth audit on every capstone/number change; pedagogy audit when a track reaches a
chapter boundary; design audit after any shared-component or palette change, and periodically on
the 3 highest-traffic pages (landing, LR index, Start-here).

**Mechanical gate for every session** (from §11.12, non-negotiable): `npx tsc --noEmit` clean →
both themes render → no console errors → mobile drawer works on touched layouts → task list and
this file updated.

### 12.6 How to improve things — the upgrade heuristics

When deciding what to polish, apply in order:
1. **Fix lies before gaps.** A wrong number outranks a missing page.
2. **Upgrade the shared component, not the instance.** 180+ pages inherit every improvement to
   `lesson.tsx`, `LabFrame`, `Quiz`, `CodeBlock`, `TrackSidebar`, `LessonShell` — one-file edits
   compound; page edits don't.
3. **Interactive > static > prose** for any concept currently explained one level below its
   potential. The §9 list of static/no-visual LR pages is still the backlog for this.
4. **Deepen the spine before widening the map.** A track someone can finish (LR) is worth more
   than five tracks someone can start. Current spine order: logistic Tier-2 → KNN/poly
   completion → Evaluation & Metrics pillar (the confusion-matrix/ROC lab is already
   half-designed by ThresholdLab) → trees.
5. **Reader-visible before internal.** Refactors only when they unblock a reader-visible win.
6. **Never set a page budget before the topic list.** (Added 2026-08-31, after the user caught a
   self-imposed 20-page cap across three neural-network tracks.) Chapter and page counts are an
   *output* of what the subject needs, not an input. When auditing a track for depth, the useful
   test is not "are the pages long enough" — word counts were uniform and every page had a lab or a
   quiz — it is **"which topics are missing"**: word-count for outliers, check quiz/lab coverage,
   then grep the track for terms a mastery treatment must contain. Text already on the site that
   *promises* something not yet written is the strongest possible signal of a gap.
7. **`grep -rl <LabName> src/` before creating any lab.** A `Write` to an existing lab path silently
   replaces a component other tracks depend on; the tool result says "updated", not "created", and
   that word is the only warning you get. (Recovered from git after overwriting `LearningRateLab`.)

### 12.7 Priorities for the next lead (ordered; updated 2026-08-31)

0. ✅ **DONE** — logistic **Tiers 1 & 2 complete** (18/25 pages). Tier-2 shipped 4 chapters +
   labs `OddsRatioLab`/`ImbalanceLab`/`SeparationLab`/`SoftmaxLab`/`RocLab`/`CalibrationLab`/
   `CostLab`, plus `CREDIT_SETUP`. Only Tier-3 theory (4) + *In the wild* cases (3) remain greyed.
0b. ✅ **DONE 2026-07-06** — **Evaluation & Metrics pillar COMPLETE** (10/10 pages, first
   fully-complete *pillar*; `/learn/evaluation`, `evaluationTrack.ts`). Ch1 T1 (accuracy trap →
   confusion matrix → precision/recall/F1) reuses `ImbalanceLab`/`ThresholdLab`; Ch2 T2 (ROC/AUC &
   PR → calibration → cost-sensitive) reuses `RocLab`/`CalibrationLab`/`CostLab`; Ch3 T2 (RMSE-vs-MAE
   → R²/adjusted-R²) reuses `ErrorMetricsLab`/`RSquaredLab`; Ch4 T2 (cross-validation → the
   evaluation checklist) reuses `CrossValidationLab` + a synthesis page. **Every lab pre-existed** —
   the whole pillar was prose + wiring, the §12.6 "reuse the lab" bet paying off twice. Framed
   model-agnostically as *metric selection* ("no best metric, only the one matching what a mistake
   costs"). All labs verified interactive, tsc clean, 0 console errors, siteMap card "5 live"/0 soon.
0c. ✅ **DONE 2026-07-06** — **Logistic regression track COMPLETE** (25/25 pages) — the second
   fully-complete *track* after linear regression. Tier-3 theory (4): maximum-likelihood → log loss,
   convexity of the objective (PSD Hessian proof + a self-contained convex/non-convex `Landscape` SVG),
   GLM view (family table, canonical-link gradient), generative twin (naive Bayes/LDA, reuses
   `CalibrationLab`). *In the wild* cases (3): when-to-use decision table, Case A credit default
   (reuses `ImbalanceLab`/`OddsRatioLab`/`CostLab` end-to-end), Case B medical screening (reuses
   `ThresholdLab`/`RocLab` + the base-rate trap). Index chip auto-flips to "Complete"; siteMap
   `partial` dropped. All KaTeX clean, tsc EXIT 0, 0 console errors. Theory pages are prose+KaTeX
   (no new numbers); cases reuse the existing real-run labs, so the repro guard still covers everything.
0d. ✅ **DONE 2026-07-06** — **Polynomial & basis-function track COMPLETE** (14/14) — third
   fully-complete track. Also FIXED A BUG: the lib linked `basis-functions` + `runge-and-instability`
   as done but the page files never existed → two live 404s in the sidebar; built both. Then shipped
   the 9 greyed pages: RBF (reuses `BasisFunctionLab`), splines (new `SplineKnotsLab` — a
   self-contained interactive knot figure; **round SVG coords with `.toFixed(2)` or sin/cos trips a
   hydration mismatch** — lesson for any new math-driven SVG lab), natural/smoothing splines,
   bias–variance (`BiasVarianceLab`), choosing bases (`CrossValidationLab`), regularizing
   (`RidgePolyLab`), pipelines/leakage (CodeBlock), when-to-use (table), worked example (CodeBlock).
   Index chip auto-flips to "Complete"; siteMap `partial` dropped. tsc EXIT 0, KaTeX clean, hydration
   clean after the toFixed fix. THREE complete tracks now: linear, logistic, polynomial.
0e. ✅ **DONE 2026-07-07** — **KNN Tier-2 depth: two chapters (8/33 → 15/33)**. *Choosing k*
   (the-role-of-k → bias-and-variance-in-k-nn → choosing-k-by-cross-validation) and *Distance &
   weighting* (distance-metrics-for-k-nn → why-feature-scaling-matters → distance-weighted-voting →
   the-curse-of-dimensionality). Reused `KNNBoundaryLab` (role-of-k) + `KNNChooseKLab` (choosing-k) via
   `LabFrame`+`PredictPrompt`; the other 5 pages are prose+KaTeX+Quiz with **two new static
   server-rendered figures** (a bias–variance U-curve; a distance-concentration bar chart) and one
   Minkowski unit-ball trio + a worked scaling table — all computed at module scope with rounded coords,
   so no hydration risk (server components, not client). Honest-numbers safe: no new computed numbers,
   the σ²/k and 0.1^(1/d) figures are analytic. `knnTrack.ts` hrefs added; searchIndex auto-picks-up;
   **siteMap keeps `partial: true`** (correct — 5 chapters / 18 pages still greyed). Verified: tsc EXIT
   0, all 7 pages 200, KaTeX clean, SSR polyline coords all rounded (the console's SplineKnotsLab
   hydration errors are the known STALE cumulative-buffer artifacts, not live — splines SSR is clean).
0f. ✅ **DONE 2026-07-07** — **KNN *Making it work in practice* chapter (15/33 → 19/33)**:
   preprocessing-and-encoding (categorical→distance encoding, KNNImputer, ColumnTransformer order),
   ties-and-class-imbalance (tie rules + imbalance remedies; **new static majority-floods figure**;
   deliberately did NOT reuse `ImbalanceLab` — its numbers are a real logistic run, would misrepresent as
   k-NN), choosing-the-right-metric (reframed as a *validation workflow* + symptom→metric decision table,
   NOT a re-catalog of distance-metrics-for-k-nn; stresses metric×k×weights interaction → joint grid),
   feature-selection-and-weighting (filter/wrapper/embedded → weighting as generalized scaling → metric
   learning LMNN/NCA, one spectrum). Also **wired the-curse-of-dimensionality's `next` forward** into this
   chapter (it was prev-only). All prose+KaTeX+Quiz+CodeBlock; no client labs → no hydration surface.
   siteMap still `partial`. tsc EXIT 0, all 200, KaTeX clean.
0g. ✅ **DONE 2026-07-07** — **KNN *Scaling the search* chapter (19/33 → 23/33)**: the-brute-force-cost
   (O(n·d) per query, lazy-fit trap, complexity table + **static scan-every-point figure**; when brute is
   still right), k-d-trees (median splits, descend+backtrack pruning, **static 2-D partition figure**,
   why it dies past ~20 dims), ball-trees (centroid+radius, triangle-inequality bound
   max(0,‖q−c‖−r), **static nested-spheres figure**, any-metric advantage), approximate-nearest-neighbors
   (recall@k, the LSH/tree/graph/quantization families as a qualitative table — **no invented benchmark
   numbers**, honest; HNSW code block has no `setup` → no Run since hnswlib isn't in Pyodide). Wired
   feature-selection-and-weighting's `next` forward. All prose+KaTeX+Quiz+CodeBlock+static SVG; no client
   labs → no hydration surface. siteMap still `partial`. tsc EXIT 0, all 200, KaTeX clean.
0h. ✅ **DONE 2026-07-07** — **KNN *Regression & other uses* chapter (23/33 → 26/33)**:
   k-nn-regression-in-depth (uniform-average staircase vs distance-weighted-smooth — **static figure**;
   no-extrapolation property; choosing k by RMSE/MAE cross-links eval pillar), local-weighted-regression
   (LOESS = local *linear* vs local *constant*/Nadaraya–Watson; **static figure computed via closed-form
   weighted-least-squares at module scope**, demonstrating lower boundary bias; the degree-0/1/2 kernel
   family), k-nn-for-imputation-and-anomaly-detection (KNNImputer as neighbour-average-of-a-feature; LOF
   / k-distance outlier scoring with a **static neighbour-distance figure**; "one distance, three jobs").
   Wired approximate-nearest-neighbors' `next` forward. All server components (static SVG + CodeBlock),
   no client labs → no hydration surface. Note: chapter-2's regression-by-averaging page already
   cross-linked `/local-weighted-regression`, so that slug was pre-committed. tsc EXIT 0, all 200, KaTeX
   clean.
0i. ✅ **DONE 2026-07-07** — **KNN *Theory · go deeper* chapter, Tier 3 (26/33 → 30/33)**:
   the-bayes-classifier-and-bayes-error (optimal posterior rule, R*=E[min(η,1−η)] as the irreducible
   floor; **static overlapping-density figure** with shaded Bayes error), the-1-nn-error-bound (Cover–Hart:
   nearest label → draw from η, asymptotic error 2η(1−η), full pointwise proof R*≤R₁ₙₙ≤2R*(1−R*)≤2R*;
   **static 2η(1−η)-vs-min(η,1−η) figure** touching at 0,½,1), consistency-of-k-nn (Stone 1977; the twin
   conditions k→∞ [variance→0] & k/n→0 [bias→0] shown as the bias–variance decomposition restated as
   limits; √n satisfies both, with 1/k = k/n = 1/√n), k-nn-as-non-parametric-estimation (k-NN really
   estimates η̂; density k/(nVₖ) as adaptive bandwidth = dual of KDE; rate n^(−2/(d+2)) → curse attacks the
   *rate*). All chips use `Tier 3 · theory` with grey `--c-metrics` accent (doctrine §10.1). Math-dense but
   **0 KaTeX errors** (server + live DOM). All server components, static SVG figures analytic (no invented
   numbers) → no hydration surface. Wired imputation page's `next` forward. tsc EXIT 0, all 200.
0j. ✅ **DONE 2026-07-07** — **KNN *Strengths, weaknesses & kin* chapter (30/36 → 33/36)**:
   when-to-use-k-nn (green/red "reach for it / avoid it" columns, the strength-hides-a-flaw list, a
   pre-flight checklist cross-linking scaling/metric/k/dimensionality/cost/imbalance pages),
   k-nn-vs-logistic-regression-svm-trees (a **10-criteria × 4-classifier comparison table** — model type,
   boundary, train/infer cost, interpretability, extrapolation, scaling, high-d, irrelevant features,
   non-linearity — k-NN column tinted; "try first, rarely ship alone" framing), k-nn-vs-k-means (the
   name-trap 8-row table + one-sentence mnemonic; cross-links the k-means clustering track, uses
   `--c-clustering` accent for the k-means column). No new labs (synthesis chapter, tables + cross-links).
   Wired k-nn-as-non-parametric-estimation's `next` forward. tsc EXIT 0, all 200, KaTeX clean.
0k. ✅ **DONE 2026-07-07** — **KNN *In the wild* cases (33/36 → 36/36) → TRACK COMPLETE**. Real runs in
   **`scripts/knn_cases.py`** (deterministic; python 3.13 + sklearn 1.8): Case A digit-recognition (load_digits
   98.67%@k=3, 6/450 errors, 9→3 confusion with real 8×8 `DigitGrid` bitmaps, PCA(30)=97.33%, brute==kd_tree),
   Case B recommendation (synthetic latent-factor ratings, user-based cosine-CF RMSE 1.139 vs 1.306 baseline,
   +12.7%; = distance-weighted k-NN regression), Case C similarity+anomaly (precision@10=0.9651; kNN-dist & LOF
   ROC-AUC 1.000 — honestly framed as an easy separation since digit-0 is a tight cluster; LOF-vs-global note).
   Case pages use `CodeBlock` (no `setup` → no Run, since load_digits/LOF aren't reliably in Pyodide) + real
   `CodeOutput`. Honest-numbers doctrine satisfied. siteMap `partial` dropped; index chip → "Complete · 36 pages";
   k-nn-vs-k-means wired forward. tsc EXIT 0, all 200, KaTeX clean, real bitmaps render.
0l. ✅ **DONE 2026-07-07** — **Kernel Ridge Regression track built from scratch (12/12)**.
   `/learn/kernel-ridge-regression`, `kernelRidgeTrack.ts`, accent blue `--c-regression`. Ch1 from-ridge-to-kernels
   (the-kernel-trick, the-dual-form-of-ridge [full w=Xᵀα → α=(K+λI)⁻¹y derivation], kernels-as-similarity [static
   RBF decay figure + kernel table]), Ch2 in-depth (the-kernel-ridge-solution [reuses **new KernelRidgeLab**],
   choosing-the-kernel, tuning-lambda-and-gamma [4-quadrant regime cards], the-computational-cost [O(n³), Nyström/RFF]),
   Ch3 theory·T3 (the-representer-theorem [orthogonality proof], kernel-ridge-and-gaussian-processes [KRR = GP
   posterior mean, λ=σ²], kernel-ridge-vs-svr-vs-linear [comparison table + real numbers]), Ch4 worked-example.
   **KernelRidgeLab**: real client-side RBF fit α=(K+λI)⁻¹y via Gauss-elim `solve()` (borrowed from BasisFunctionLab),
   λ+γ chip-buttons; the exp-derived fit `<polyline>` is **mount-gated** (`ready` state via useEffect) so SSR omits it
   → zero hydration risk (data points are deterministic mulberry32, safe to SSR). Index chip auto-"Complete · 12 pages".
0m. ✅ **DONE 2026-07-07** — **Support Vector Regression track built from scratch (11/11) → REGRESSION FAMILY
   COMPLETE**. `/learn/support-vector-regression`, `svrTrack.ts`. Ch1 ε-insensitive idea (index [**new SVRTubeLab**],
   the-epsilon-insensitive-loss [static loss-comparison figure ε-insens vs |r| vs r²], the-tube-and-support-vectors
   [reuses SVRTubeLab + PredictPrompt], soft-margin-c-and-slack [C = inverse of λ]), Ch2 mechanics (the-primal-problem,
   the-dual-and-the-kernel-trick [box constraints 0≤α≤C = robustness; ε-term = sparsity], kernels-for-svr,
   hyperparameters-c-epsilon-gamma [3-knob table]), Ch3 practice (kernel-ridge-vs-svr [reciprocal comparison + real
   numbers], when-to-use-svr [green/red guide], worked-example). **SVRTubeLab**: OLS fit + ε-tube slider; points
   outside tube = support vectors (filled), inside = free (hollow); live SV count. No transcendentals in coords, all
   `.toFixed(2)` → hydration-safe. Real numbers for both worked examples from **`scripts/kernel_cases.py`**
   (make_friedman1, python 3.13/sklearn 1.8): linear ridge R²=0.667 → KRR R²=0.860 (dense, all 300 pts) → SVR
   R²=0.838 (sparse, 166/300 SVs). siteMap both hrefs added (Regression `partial` never used — was greyed by
   absent href); searchIndex both wired. **All 5 Regression tracks now live.** tsc EXIT 0, all 23 pages 200, 0 KaTeX/hydration errors.
0n. ✅ **DONE 2026-08-30/31** — **NEURAL NETWORKS family, tracks 1–3 of 6 built from scratch
   (64 pages, 15 labs, 3 honest-numbers scripts)**. User brief, verbatim: *"lets start with neural
   network family and close it completely"*. Accent coral `--c-neural` (already in `globals.css`).
   **Build order is dependency order, not siteMap order** — activations cannot be taught honestly
   before gradients, architecture not before activations:
   - ✅ **Perceptron → MLP** (21 pp) `/learn/perceptron-to-mlp`, `perceptronMlpTrack.ts`. Spine:
     *a neuron is a linear model with a switch, and stacking them buys features you did not design* —
     arrives at the same fact twice, geometrically (XOR needs a bend) and algebraically (no
     non-linearity ⇒ the stack collapses), because most readers only believe it after both.
     7 labs: `NeuronLab`, `PerceptronRuleLab` (runs the rule in-component), `XorLab`,
     `LinearCollapseLab`, `CapacityLadderLab`, `SpiralLab`, `WeightSymmetryLab`. Script
     `perceptron_mlp_cases.py` (8 §§). **New shared primitive `src/components/labs/halfplane.ts`**
     (Sutherland–Hodgman clipping) — fixed a real correctness bug where three labs drew a fixed
     triangle for a half-plane that can be a quad or pentagon, so the shading was silently wrong.
   - ✅ **Backpropagation & training** (22 pp) `/learn/backpropagation`, `backpropTrack.ts`. Spine:
     *backprop is the chain rule, organised so nothing is computed twice*; the second half turns
     training failures into measurements. 4 labs: `GradientFlowLab` (flagship), `ChainRuleLab`,
     `LearningRateSweepLab`, `ScheduleLab`. Script `backprop_cases.py` (10 §§).
   - ✅ **Activation functions** (21 pp) `/learn/activation-functions`, `activationsTrack.ts`. Spine:
     *an activation is a derivative you are choosing*. 4 labs: `ActivationExplorerLab` (flagship —
     computes its own numbers so readouts cannot drift from prose), `DyingReLULab`,
     `ActivationBakeoffLab`, `UnitDistributionLab`. Script `activation_cases.py` (8 §§).
   **Cross-track number continuity is deliberate**: activations §2 reuses backprop §3's data, depth
   and init so sigmoid/tanh/relu reproduce that track's published 2.9e7 / 1.627 / 0.2555 exactly
   before widening the comparison. Backprop's by-hand page continues track 1's exact 13-parameter net.
   Registered in `searchIndex.ts`, `Footer.tsx`, `siteMap.ts`. All 64 pages 200, tsc EXIT 0,
   0 KaTeX errors, every lab eyeballed live with its numbers read back out of the DOM.
0o. ✅ **DONE 2026-08-31 — MASTERY PASS on the three built NN tracks (60 → 64 pages).** User
   pushed back: *"I feel you have set some internal hard cap of 20 pages which if needed for
   improving the content should be done."* **They were right** — 20/20/20 was a convention copied
   from the Trees family, not a finding. **Audit method worth reusing:** word-count every page
   (uniform 1,000–1,900 incl. JSX ⇒ no thin pages), confirm quiz/lab coverage per page, then grep the
   family for topics a mastery treatment needs (`warmup`, `permutation`, `schedule`, `checkpoint`, …).
   The gaps were **missing topics, not thin prose**, and three were already promised by live text.
   Four pages added, each with a new measured script section:
   `many-equivalent-solutions` (T1) · `learning-rate-schedules` + `the-memory-bill` (T2) ·
   `where-your-units-sit` (T3). ⚠️ The last one **corrects the track's own earlier framing**: sigmoid
   is **0.0% saturated at initialisation**, so "sigmoid units saturate ⇒ gradients vanish" is false —
   the units sit in the *best* part of the curve and 0.25 still compounds. Rule going forward:
   **the page count follows the topic list; never the reverse.**
> **Live ranking as of 2026-08-31: item 4b is the top priority** — the user's standing brief is to
> close the Neural networks family, three of six tracks are done, and the numbers for the next two
> are already measured. The numbered items below keep their original labels as historical anchors;
> read 4b first, then 1.
>
> **Update 2026-09-08 (this log is behind the live state — trust the auto-memory index over the
> numbered items below):** Neural networks family is **COMPLETE** (all 6 tracks, `neural-networks-family.md`)
> and the **Reinforcement learning family** now has **3 tracks live** — MDP, Planning, Learning
> (`rl-family-mdp-track.md`, `planning-track.md`, `learning-track.md`) — plus a **6-lab interactivity
> sweep** (`rl-interactivity-sweep.md`). **Next RL build direction agreed with the user:**
> **RL capstones — see the new §13 for the full in-depth plan** (A: tabular control, buildable now;
> B: Hill Climb Racing neuroevolution clone; C: Lies of P imitation-learning field report). Also
> still open in RL: Function approximation, then policy gradients + actor–critic (confirmed coming).

1. **LR static-page upgrades** — the §9 item-2 list (residual diagnostics shared lab, Q–Q,
   CV/bias–variance) is the oldest unpaid debt in the best track. **The top *polish* priority**, and
   the oldest one on the list: many tracks and two whole families are complete, yet the *flagship*
   LR track still carries debt from the first month.
4. ✅ **KNN (36/36)** + ✅ **REGRESSION FAMILY** + ✅ **DECISION TREES (19)** + ✅ **RANDOM FORESTS (20)**
   (2026-08-20/21) + ✅ **BOOSTING (22)** (2026-08-21). **Trees & ensembles is 3/4 tracks done —
   `Stacking` is the only one left**, and both the forest and boosting tracks already tee it up.
   *(Corrected 2026-08-31: this entry previously said 2/4 with Boosting as "next" and claimed a
   live-visual eyeball of the tree labs was still owed. Boosting shipped 2026-08-21 with 3 labs, and
   all 12 tree-family labs were verified live on 2026-08-22 — the "wedged dev server" was only the
   `basePath: '/Manifold'` prefix.)*
   Other greyed surfaces if pivoting away from Trees: **Classification** — Naive Bayes, SVM
   (low-effort sibling of the built SVR), kernel methods.
4b. **NEURAL NETWORKS — finish the family. Tracks 1–3 are BUILT (see 0n/0o); three remain**, and
   the user's standing brief is to *close it completely*. Build them in this order:
   - **4. Architecture design — depth, width & what to apply when** — spec'd in full at
     `docs/curriculum-map.md` §6.6b. Answers "how many layers, how many neurons" as **a directed
     search procedure with priors** (get it training → overfit deliberately → regularise), each
     technique introduced at the symptom that motivates it. Flagship `ArchitectureSandboxLab`;
     script `architecture_cases.py` (a real depth × width sweep). ⚠️ **`CapacityLadderLab` and
     `SpiralLab` already exist** (track 1) — reuse or rename, and run
     `grep -rl <LabName> src/` before creating any lab (see the near-miss in §12.6 notes).
     Prereqs: learning curves + capacity from Model selection. Three assets are already waiting for
     it: the memory bill's depth-vs-width scaling (params ∝ W², activations ∝ W), track 1's capacity
     ladder, and the residual-connections-as-a-gradient-fix thread that both other tracks tee up.
   - **5. Initialisation & normalisation** — the family's largest unpaid debt, because **all three
     built tracks defer to it by name**. Activations measured the honest complication repeatedly:
     the same sigmoid net spans a 29,000,000× and a 65× gradient ratio on **initialisation scale
     alone**, and `where-your-units-sit` shows tanh drifting from 0.1% to 30.1% saturated *during
     training* (2% → 82% by layer). That is this track's opening argument, already measured.
   - **6. Regularisation — dropout, weight decay, early stopping.**
   ⚠️ Every script must clear [[verify-the-effect-before-writing-the-prose]] — it fired four
   separate times across tracks 1–3, twice on experiments that measured nothing and twice on
   experiments that measured the wrong quantity.
5. **Challenge mode + URL-hash lab state** (§10.3 leftovers) — goals convert fiddling into
   learning; shareable lab states are free marketing.
6. **Chapter recaps + Tier-0 prerequisite pills** (§4 leftovers) — the last unshipped
   active-recall doctrine items.
7. **MDX migration and WebGL surfaces stay parked** until content velocity actually suffers —
   TSX pages + projected SVG are winning; don't modernize what isn't hurting.

### 12.8 Working relationship (compressed from §8)

The user is a senior full-stack dev with sharp editorial taste. Ship strong opinionated
defaults, show the rendered thing, iterate on their reaction. They will catch: visual weight
imbalance, saturation drift, radius inconsistency, cream-tinted surfaces, low-contrast badges,
and anything that smells template. They value depth and beauty *equally* — a gorgeous shallow
page and an ugly deep page are both rejections. When they say "make it better", run §12.5's
three passes and bring findings, not questions.

---

## 13. Capstone roadmap — RL capstones (PLANNING, 2026-09-08 · NOT yet built)

Two capstones are live (`California housing` regression, `Asteroid hazard` classification), both
supervised. The user wants **multiple dedicated RL capstones**. Session 2026-09-08 scoped **three**,
spanning the RL family's arc from "apply the finished tracks" through "watch it learn a game over
generations" to "a real-world engineering field report." **Nothing here is built yet — this is the
agreed plan, not a log of work done.** (Prompted by the RL interactivity sweep that same day; see
§6.7 of `curriculum-map.md` and the auto-memory note `rl-capstones-plan.md`.)

### 13.0 Shared doctrine (extends §10.4)
Every RL capstone still keeps its own identity/accent, transferable-thinking framing, and the
**honest-numbers rule**. Two hard realities shape all of them:
- **Runtime constraint.** Pyodide has **numpy only** — no `gym`, no game engine, no GPU. Every
  environment/physics/mechanic must be **hand-implemented** (this is why the RL tracks use
  `GRIDWORLD_SETUP` / `LEARNING_SETUP`). Rules out "load a real game" for anything running on the site.
- **Two capstone genres now:**
  - **Runnable-notebook capstone** (like the two live ones) — self-contained, in-browser labs,
    numbers verified before the prose, downloadable reproduction notebook.
  - **Field report / build log (NEW genre)** — documents a real project built **off the site** (on
    the user's own machine) and **links out** to external artifacts (GitHub / HuggingFace). Its
    results section ships **only after the real model exists** — the honest-numbers rule forbids
    documenting results that haven't been produced.
- **Method note.** The two game capstones use **neuroevolution** and **imitation learning**, which are
  *cousins* of the tabular value/policy RL the tracks teach, not the same thing. Each capstone must
  teach its own method (or lean on a short primer). A nice recurring contrast: *evolution vs gradient
  RL vs imitation — three ways to search policy space.*

### 13.1 Capstone A — Tabular control ("the RL capstone proper")
- **Caps:** MDP + Planning + Learning (**all three DONE**). **Buildable NOW**, self-contained
  numpy/JS, needs no new track.
- **Environment:** a hand-built world bigger/messier than the 4×4 teaching grid — Windy Gridworld,
  Taxi, or a "warehouse-robot" delivery world.
- **The arc:** frame the MDP → choose **SARSA vs Q-learning vs Expected SARSA** → tune α/ε/γ →
  evaluate → the on-policy-safety vs off-policy-optimality decision (reuse the cliff insight).
  Decision-point widgets + predict-the-number reveals, per §10.4.
- **Flagship lab:** live training + policy visualisation — reuse the `AnimatedRolloutLab` pattern
  (`rl-interactivity-sweep.md`). Honest numbers = real learning curves run before writing.
- **Why first:** completes the RL family's "theory → applied" arc the way the supervised capstones
  do, and proves the RL-capstone format.

### 13.2 Capstone B — "Evolving a driver" (Hill Climb Racing clone via neuroevolution)

> ⚠️ **SUPERSEDED IN PART (2026-09-11) by `docs/neuroevolution-plan.md`** — the authority for B.
> Three changes, made after inspecting the Code Bullet reference repo: **(1)** B is now preceded by a
> new track, **"Policy search without gradients"** (hill climbing → ES → GA → NEAT), because a
> capstone must cap a track and B as specced caps nothing; **(2)** the physics is a ~300-line reduced
> heightfield-car model in numpy, NOT hand-written general rigid-body physics *and* not Box2D — the
> reference uses Box2D only because it needs general collision, which we do not; **(3)** B teaches
> **both** a fixed-topology GA and NEAT, and makes the honest comparison at equal environment steps
> its spine. The bullets below stand except where they say "hand-written — no Box2D" and
> "GA, not NEAT".
- **The CodeBullet HCR project, reproduced.** Evolve a population of small NN controllers over
  **generations** on a **hand-built 2D car physics** (terrain heightfield, chassis + 2 wheels,
  gas/brake, fuel, flip = death).
- **Method:** **neuroevolution / genetic algorithm** — searches policy space by mutation + selection,
  no backprop. Capstone teaches the GA itself (fixed-topology MLP + GA is cleaner to teach than
  NEAT). Contrast page: evolution vs gradient RL.
- **Feasibility:** feasible, **high effort, high payoff**, fully **on-site** (it's a simulation).
- **The spectacle:** an in-browser lab watching the population evolve — generation counter,
  best-distance curve climbing live.
- **Hard parts:** the mini rigid-body car physics (hand-written — no Box2D); actually running the GA
  to report real generation-vs-fitness numbers.
- **Sequencing:** build **after A**, so it inherits the "hand-built sim + live-run lab" pattern.

### 13.3 Capstone C — "Learning to parry" (Lies of P imitation-learning FIELD REPORT)

> 🚧 **FOUNDATIONS BUILT 2026-09-11 — authority is now `docs/lies-of-p-capstone-plan.md`.** Live at
> `/learn/lies-of-p-capstone` (index only, 1/22). Accent `--c-krat` oxblood + the `--krat-*` gaslight
> panel palette; `GaslightPanel.tsx` + `ParryBudget.tsx` (signature figure) built; track scaffold and
> layout in place; **deliberately NOT in siteMap CAPSTONES yet.** Everything below still holds — the
> plan doc adds the genre rule (results pages stay href-less until measured), the risk-first build
> order (synthetic-input spike FIRST, it can kill the project), and the identity spec.
- **Reframed 2026-09-08:** the user can play **Lies of P (offline, single-player)** on their own PC
  and screen-grab **their own** gameplay — legitimate (own recordings, offline, personal use). This
  moves it from "impossible on the site" to a real project the user builds on their machine,
  **documented here as a field report** (§13.0 genre 2).
- **Method: imitation learning / behavioral cloning** — NOT from-scratch RL. From-scratch RL on a
  real Soulslike won't converge (real-time, expensive deaths, brutal reward shaping); BC from human
  demos is how this is actually done. Honest framing: *"an agent that learns to play by watching me
  play,"* optionally + DAgger / a little RL later. **Never** frame it as "self-taught from scratch"
  or "our AI beats Lies of P" beyond the documented reality.
- **Pipeline (built on the user's PC, documented step-by-step on the site):**
  1. **Capture** — high-FPS screen grab (`dxcam` / OBS) **time-synced** with **keyboard+mouse** input
     logging (`pynput` — the user plays **KBM**, confirmed). Downsample (~160×90), **frame-stack** so
     timing is visible to the model.
  2. **Dataset** — label = keys/mouse-buttons held per frame (**multi-label**). Severe class
     imbalance (parry/dodge frames are rare) → weight / resample those classes.
  3. **Model** — a **small** CNN (or a pretrained vision backbone + small head), frame-stacked or with
     a small LSTM (parry timing is temporal).
  4. **Control loop** — inference → synthesize inputs. ⚠️ For a **KBM** setup, synthetic keystrokes
     (`pydirectinput`) may or may not register in the game — **validate early**; the
     capture→infer→act **latency** is the make-or-break (parry windows are ~tens of ms).
  5. **Artifacts** — code on GitHub, weights + model card on HuggingFace, a demo GIF/video; Manifold
     links out. Results section ships only once these exist.
- **Hardware (confirmed):** **GTX 1660 Ti Mobile, 6 GB VRAM.** Enough for a modest CNN at low
  resolution — keep the backbone small (≤ ResNet-18-class), use mixed precision and a small batch.
  6 GB is the ceiling: no large backbones, no high-res frames, no big frame-stacks.
- **Training route (confirmed 2026-09-08 — no GPU purchase needed):** **decouple the two workloads.**
  The **local 1660 Ti** does capture + the live agent loop (it must — the game runs there); **training
  goes to Kaggle's free weekly GPU** (~30 h/week; **T4 or P100 16 GB — NOT the TPU**: a small CNN
  under-utilises a TPU and fights `torch_xla` for no gain). Kaggle is headless — it can't run the game
  or the loop, training only. **Data-transfer gotcha:** raw footage is huge and Kaggle datasets are
  size-capped → **downsample/compress at capture time** (resize to ~160×90, store as encoded video or
  packed `.npz`/webdataset shards, never a folder of raw PNGs); upload as a private Kaggle Dataset,
  train, push weights to HuggingFace. (Cloud alternatives if quota is tight: Colab free T4, or rent an
  A10/3090/4090 on vast.ai / RunPod.)
- **Honest expectations (must appear in the article):** BC imitates *average* play, won't exceed the
  user's own skill, and fails in states the user rarely visited (**distribution shift** → DAgger
  mitigates). Realistic scope = **one boss / one arena**, not the whole game. It may **dodge-tank**
  rather than clean-parry because of loop latency.
- **Deep-RL option (the ambitious follow-up, not the baseline).** "Going Deep RL" on Lies of P adds
  ONE big requirement BC doesn't have: a **reward signal**, which on a real game means **reading game
  state from pixels in real time** — boss/player HP bars, stamina, death/victory — via OpenCV
  template-matching or OCR on the HUD. That HUD parser is the crux new engineering piece, plus a
  gym-like wrapper (`reset()` = reload/walk back to the boss — *expensive* in a Soulslike; `step()` =
  send input → next frame, reward, done). Realistic menu, easiest → hardest:
  1. **BC → RL fine-tune** ⭐ — pretrain on demos, then fine-tune with RL against the HUD reward. The
     BC warm-start kills the exploration problem; **this is the recommended Deep-RL path.**
  2. **Offline RL** — learn a better-than-demo policy from the recorded frames + reward labels, no live
     loop (CQL / IQL / Decision Transformer). Reuses the data, dodges the brutal real-time loop.
  3. **Online DQN / PPO from scratch** — research-grade slog; real-time = no fast-forward, each death
     costs seconds, wants ~millions of frames, may never converge. The bottleneck is game wall-clock,
     not the GPU. **Not recommended as the deliverable.**
  Algorithm fit: **DQN** (+ replay + target net) for the discrete button set, **PPO** for multi-button.
  **Framing:** ship **BC as the deliverable, Deep RL (path 1 or 2) as the labelled stretch/sequel** —
  keeps the field report honest at every stage. NOTE: this is the *off-site* Deep-RL story; the
  *on-site* reproducible Deep-RL home is a DQN-on-a-hand-built-env capstone (see §13.4, 4th capstone).
- **Staging:** the **methodology / architecture article may be drafted now** (planning); the
  **results + external links go in only after the user's real model exists.** Longest tail of the
  three (weeks of the user's own off-site work).

### 13.4 Sequencing & prerequisites
1. **A (tabular control)** — first; caps finished tracks, self-contained, proves the format.
2. **B (Hill Climb / neuroevolution)** — next; proves the hand-built-sim + live-run pattern.
3. **C (Lies of P / imitation)** — field report; draft methodology anytime, ship results after the
   user's model exists.

None of the three require the still-unbuilt **Function approximation** or **policy-gradient** tracks.
A **4th** capstone later — **the on-site Deep-RL home: DQN (value-based) or actor–critic (policy-based)
on a hand-built environment** (CartPole / Mountain Car / a simple game we code in numpy) — would cap
those tracks once they exist. B optionally wants a short **neuroevolution primer**; C needs the
user's off-site build. All three still obey the reproducibility discipline of §10.4 / §11 (a
runnable-notebook capstone ships its notebook + repro guard; a field report ships links to real,
runnable external artifacts instead).

> **On "why isn't Deep RL a track?"** It is — under different names, sequenced bottom-up on purpose.
> **Deep RL = the Function-approximation track (value-based: DQN, target nets, replay, the deadly
> triad) + the policy-gradient/actor–critic track (REINFORCE → A2C → PPO).** You can't teach DQN
> honestly before function approximation + the deadly triad, which need tabular Q-learning first — so
> Deep RL is the *destination* of the family, not an omission. Building it before the foundations
> would be the black box the site refuses to ship (§12.2).

---

## 14. Depth audit — the chapter-by-chapter backlog (2026-09-15)

**`docs/depth-audit.md` is the standing answer to "what should I improve next?"** It walks every
chapter of all 34 tracks and 4 capstones and records, per chapter: depth to add, text to fix, pages
worth adding, labs to add or improve, and visuals that are missing. Read it before planning any
improvement pass; add to it rather than re-deriving it.

It is built on a mechanical inventory (`scripts/inventory.js` — parses every `src/lib/*Track.ts`,
resolves each href to its `page.tsx`, counts prose words, labs, figures, inline SVG, CodeBlocks,
Proofs, Callouts, PredictPrompts, Quizzes and MathBlocks). Re-run it rather than guessing.

**The four findings that matter most:**

1. **35% of built pages (264 of 760) have no visual of any kind** — no lab, no rendered figure, no
   inline `<svg>`. It was 49% (372) when the audit was written. The landing page claims every
   concept is taught "with text, a visual, and an interactive lab together, never prose alone."
   ⚠ Both numbers are on the **corrected** `inventory.js` (2026-09-15): it used to count an import
   as a visual even when the component was never rendered, miss default imports, and treat
   `capstone/pedagogy` — `DecisionPoint`, `GuessSlider` — as a figure. Do not compare against any
   earlier figure, including the 370 → 323 quoted in the fix log below.
2. **The site has three eras and they fail in opposite directions.** Early tracks (k-Means 348 w/pg,
   math foundations 368, regularized regression 372) are thin *in words* — the lab carries the
   teaching. Middle tracks (architecture 1281 w/pg, nn-regularisation 1126, init-norm 1100) are deep
   in words and *blind* — architecture was 26/27 pages with nothing to look at; `init-norm` and
   `nn-regularisation` had **zero code, zero figures, one lab between them across 42 pages**. All
   three are fixed; the era's remaining debt is backprop 13/22, activations 9/21, perceptron→MLP
   9/21 and the data workflow 16/28. Recent
   work (building-environments, the warehouse and asteroid capstones) gets both right and is the
   target.
3. **Pedagogy primitives are built and unused.** `DecisionPoint` — the strongest one — is on 20
   pages in 10 tracks; **24 tracks have none**. `<Term>` 24 uses on 12 pages in 3 tracks.
   `<Backlinks>` on 23 of 760 pages. 21 of 34 tracks contain **zero `<Proof>`**, including
   `math-foundations`.
4. **The Optimization foundation is empty** while regression, neural networks and RL each teach their
   own partial gradient descent. Two of `/map`'s seven throughlines point at it.


### 14.0a What the crew learned — World 2 is finished (2026-09-15)

**`building-environments/what-the-crew-learned` ships, and World 2 with it (28 of 40 pages, still
0 without a visual).** The race page published a score; this page asks what the policy behind the
score actually does, using three new trainer subcommands — `learned` (a behaviour probe), `shield`
and `snap` (two ablations) — plus `where-won` and `figure`, which writes the numbers into the lab's
data module the way `curves` does.

*What the crew does.* Not firefighting. **On 89–96% of its decisions the target cell is not
burning** — the chiefs are at 100% on fire by construction — and it aims 2.6–3.4 cells from the
nearest flame. It hits 3.4–4.2 cells a drop against the guard chief's 5.1, its buckets hit nothing
at all 11–16% of the time against 1–2%, and it puts out less fire than every hand-written rule in
the chapter. It also loses 0.69 village cells against the chief's 1.11 and burns 70 against 82.

*Why it wins, established twice.* A drop does two things — un-burns the cells under it, and wets the
5×5 square to moisture 0.9. **`shield`**: set `WET = 0` (a plain global in the exec'd preamble, so
the ablation is one assignment) and everybody gets worse, but the crews lose 2.57 / 2.75 / 2.82
village cells against guard's 1.82 — and all three finish *behind* the guard chief. **`snap`**: take
each crew's own target and slide it onto the nearest burning cell, changing nothing else, and the
crews go 0.69 / 0.69 / 0.86 → 1.14 / 1.51 / 1.52, bracketing the chief's 1.11, with returns
−85.6 / −92.5 / −88.4 against the chief's −92.3. The advantage is the offset, not the weights that
produce it. The page states the limit of each: `shield` runs a crew outside its training
distribution (a crew *retrained* in the dry world is **UNTESTED** — it needs a GPU million-step run),
and `snap` changes the whole trajectory, so it is not a per-decision counterfactual.

*The uncomfortable one.* `where-won`: **in 142–150 of the 200 exam worlds the crew and the chief
score identically**, and 79–136% of the total gap comes from the ten best worlds (seed 2's figure is
over 100% — its ten best are worth more than its whole advantage). The crew is worse in 14–24
worlds, by 7–9 village cells in its worst. The headline mean is a claim about a quarter of the exam.
This is also the concrete reason the race page paired everything.

*Kept promises and one reconciliation.* The bar is guard's −92.3 as a K=4 commander and the crews
clear it at −75.4 / −76.1 / −80.6. The cobra page's "is this number local?" question is asked again,
of an advantage rather than a metric. And the page reconciles a visible inconsistency: the cobra
page quotes a damage-paid DQN at 2.51 / 2.71 / 2.45, which is the *build-log* crew from trainer v1
(1-step, 50k replay) — its comparison is internally fair and stands unrestated, but a reader
comparing adjacent pages would otherwise see two different DQNs with no explanation.

*Also measured, published, and not tidy.* The crew aims at the last flames only 42–53% of the time
(chiefs 100%) and answers a threatened village on 51–64% of those decisions (guard 100%) — it is not
a crisis responder and still loses fewer houses. The natural firebreak story does **not** fully
check out: its drops that hit nothing sit on only 0.8–1.3 cells that are unburnt, flammable and
touching a flame, so "wets the fire's edge" is not established; most of the gap between 57–66% of
targets having no fire in the square and only 11–16% of drops landing dry is fire arriving during
the three or four steps of the sortie, and the control that would separate anticipation from ambient
spread has not been run. Said so on the page. And the laziest rule — park over the village and soak
it — **beats the crew on the village column** (0.45 against 0.69) while burning 143 cells instead of
70 and scoring −145.8: a reminder that the headline column is not the objective.

### 14.0 World 2's race landed (2026-09-15)

**`building-environments/training-the-crew` now has its result.** Nine runs on Colab — three seeds
of DQN at 1M steps, three of PPO evaluated at 1M and 2M — plus `paired`, a new command that flies
each saved network over the exam worlds one at a time so differences can be tested rather than
eyeballed. The track is now **0 pages without a visual**.

*The result.* DQN averages **0.75** village cells lost against PPO's **1.27**, burns 70.8 cells
against 112.5, and is the first crew on this track to beat the hand-written guard chief (1.11).
But the page's own rule — "a claim only gets made when the seeds do not overlap" — forbids saying
DQN beats PPO: PPO's best seed is 0.78, inside DQN's 0.69–0.86 range. What the seeds *do* support
is reliability. DQN's three runs span **0.17**; PPO's six scores span **1.55**, and not as noise —
two seeds settle near 0.8 and one sticks near 2.1 and never moves, through two million steps.
Paired against the guard chief on the same 200 worlds, two DQN seeds win clear of two standard
errors (−0.42 ±0.31) and the third does not separate (−0.25 ±0.34).

*Four things this cost, all worth remembering.*

- **Two Colab batches came back from a stale trainer.** Both times the DQN arm had run 1-step with
  a 50k replay — the configuration the repo already documents as the one that unlearns — because an
  older `wildfire_train.py` was uploaded. Nothing caught it but reading the configs by hand, and a
  tag blacklist could not have: the files were named exactly like race runs. `curves()` now checks
  the **config**, refuses a DQN run with no `nstep`/`dueling`, and prints `INCOMPLETE` naming any
  missing arm; `save()` stamps `trainer: 2` into every result. There is also a `version` command,
  because the `--help | grep` check I first suggested returns nothing both when the file is stale
  and when the shell has no grep.
- **PPO at 1M and 2M are not six runs.** PPO is deterministic given its seed, so the 2M record
  reproduces the 1M one probe for probe — verified identical to 0.000 village cells and 0 steps
  across all three seeds. `RaceLab` was averaging all six at a cursor and labelling it "over 6
  seeds"; it now plots the longest record per (learner, seed).
- **The figure was drawing 40-world curves against a 200-world bar.** A training probe is 40 worlds
  and the reference line was the chief's exam score. The probe block is not representative: guard
  scores **0.85** there against 1.11 over the full 200, nearest 2.15 against 2.69 — while a flailing
  policy finds it marginally *harder* (random_fire 4.58 vs 4.40), which says exactly what kind of
  worlds they are. The chart was flattering every crew by about a fifth. `curves` now emits
  `BAR_PROBE`, measured on the same block.
- **`var(--bg)` never existed; the token is `--paper`.** Four references across `RaceLab` and
  `CobraLab` (the two World 2 labs, written in one session). An undefined custom property is
  dropped silently: `color: var(--bg)` on a chip with `background: var(--ink)` fell back to the
  inherited `--ink`, so the *selected* toggle -- the control carrying the whole point of the race
  figure -- rendered as black text on a black pill. The readout cards lost their background and the
  cursor dots lost their halo the same way. **`tsc` cannot see this and neither can a text-based
  page audit; it took a screenshot from the user.** Contrast is now part of the check: selected
  chips 16.8:1, unselected 4.8:1, in both themes.

- **Five more layout defects in the same figure, each invisible to the check that came before it.**
  The metric label overlapped the top y-tick ("vil7.77 cells lost"); fixing that put the axis title
  into the tick row, because the bottom band was one row too short and always had been; the first
  x-tick then grazed the bottom y-tick, fixed by edge-anchoring the end ticks; the chiefs' reference
  labels were unreadable under six converging curves, fixed with plates sized from the string; and
  the plates did nothing at first because they were emitted *before* the polylines, so the curves
  painted over them. On the burnt-area metric the two plates then landed on each other, since one
  fixed offset only works while the two lines are far apart. Lesson: a text-vs-text overlap check
  passes things a reader sees instantly, and every one of these was a constant that happened to
  suit the first data put through it.

- **The cobra-effect page scrolled sideways** at 626px: its `<pre>` was written inline as
  `style={{ fontSize: 13 }}` while the other four bare `<pre>`s in the track share a const carrying
  `overflowX: "auto"`. Pre-existing, found only because the `--bg` fix sent me to that page.

- **I made the probe-vs-exam mistake in prose, one paragraph above the callout warning about it.** I wrote
  that two PPO seeds beat DQN at equal wall clock, by reading PPO's 40-world probes against DQN's
  200-world 0.75. Like for like at 13.5 minutes it is PPO 0.80 / 2.04 / 0.71 against DQN 0.45 /
  0.05 / 0.28 — no PPO seed ahead. Two exams in one sentence is easy to do and invisible once
  written.

### 14.0b Math foundations & theory become a teaching rebuild (2026-09-15)

**User instruction, recorded in full in `docs/math-pedagogy-plan.md` — which is now the authority
for every page in `math-foundations`, `learning-theory` and `model-selection`.** The short version:
the math pages are stuffed — one concept per *paragraph* where they should be one concept per
*page*. Lengthen a page when it needs it, split it when it carries two ideas, and then give every
concept **3–4 end-to-end worked examples in a teacher's voice** and **10+ problems with complete
solutions**, in three bands: direct application · two ideas at once · the band where brute force is
a trap and the intended route is a structural shortcut.

That third band is competitive-exam style (JEE / GATE), and **the pages must never say so** — they
name the property instead of the exam, and they teach the technique catalogue explicitly rather than
just posing hard problems. Working band names: **Apply · Combine · Outsmart**.

Three things worth knowing before picking this up:

- **It absorbs the audit's separate math-foundations items.** 368 w/pg, 20/34 blind, 0 `<Proof>`,
  0 runnable code — a page rebuilt to the new standard clears all four at once. Do not schedule them
  as four passes.
- **Phase 0 is the format, not the content.** Two new primitives (`<Worked>`, `<Practice>`), the
  verification harness, and ONE pilot page. Reviewing the pilot before writing the rest is the whole
  point, because the scope behind it is ~400 worked examples and ~1,300 problems — larger than the
  entire neural-networks family.
- **House rule #1 is the hard part.** Several hundred hand-written numeric answers in a subject
  where a sign error is invisible to every check that exists today. The plan requires an independent
  recomputation (`scripts/math_check.py`) and a new `check-pages.js` rule R3, the same way R1 guards
  `<CodeOutput>`.

### 14.0e World 3 gained a build page, a training page and a lab (2026-09-19)

Three pages were added on user request — *"how to train it step by step code by code line by line,
same for env creation... also a lab showcasing"* the trained agent. Track is **44 of 44**.
`writing-the-duel` walks `step()`'s six sections and ends with a `MyDuel(Duel)` the reader assembles
and checks frame for frame (largest disagreement over 6,867 frames: **0**). `the-training-loop` writes
DQN out in numpy — one gradient step, then a complete loop — both runnable in the browser, since
Pyodide has no torch and for a 27-float observation that is a feature. `watch-it-fight` puts the
trained net in the 3D arena with its sixteen Q-values live.

⭐⭐ **The GPU does not help here, and `boss_train.py devices` proves it.** On the loop a real run is
made of, cpu and cuda are **1.00x** apart; for a single duel the GPU is **0.42x** — launch overhead
beats a microsecond of arithmetic. The crossover is visible only with the environment removed: even at
batch 256, **13x** by batch 16,384. The card is genuinely used and genuinely idle (median **19%**
utilisation, **4341 GFLOP/s** on work big enough — 80% of the 1660 Ti's peak, and ten times beyond any
integrated GPU). New `scripts/boss_regen.py --check --all` verifies every published block still equals
what its cell prints, and reports clean.

⚠️ Two of my own measurement bugs were caught by impossible numbers and are written up in
`docs/env-building-plan.md`: a press-counter that undercounted attacks 7x because a decision spans
three frames, and a cpu-vs-gpu table whose control row wandered because the two devices were timed in
sequence rather than interleaved.

### 14.0d World 3 of the env-building track started (2026-09-15)

**The Boss fight world is prototyped, gated and open.** A Soulslike duel at 30 frames a second, where
both fighters are state machines and a move is a list of `(kind, frames)` segments -- windup, an
optional *delay* that looks exactly like windup, the active frames, and a recovery. `BOSS_SETUP` is in
`runtimeSetup.ts`; `scripts/boss_cases.py` extracts it back out of the TypeScript and reproduces every
published number. Page 1, `the-duel-brief`, has shipped; both of its runnable cells
were verified in Pyodide by exact string equality.

**⚠️ REBUILT the same day, from a line to a floor.** The user asked for a 3-D world the character can
move around in. v1 was one-dimensional — only "closer" and "further" — so a three.js view of it would
have been a picture that lies about the simulation underneath. The environment was rebuilt instead of
the renderer: both fighters now have a position on a circular arena, the boss has a facing, and **an
attack has a reach AND an arc** and lands only inside both. The boss tracks you while it winds up and
stops turning the instant the active frames begin, which is what makes a late sidestep work and an
early one fail. Every number measured on v1 — including the DQN-vs-PPO race — is marked stale in the
plan; the lessons carried over, the figures did not.

**The 3-D arena is playable, and it is the same game.** `src/components/boss/DuelArenaLab.tsx` renders
it with three.js (WASD, attack, parry, guard, four roll directions, plus a watch mode for each scripted
duellist); `duelSim.ts` is a TypeScript port of the shipped Python. That port is verified rather than
assumed: `boss_cases.py port` records one duel's boss decisions and buttons, `scripts/boss_port_check.mjs`
replays them through the port, and over 900 frames the largest disagreement in any position, angle,
health or stamina is **5.0x10^-13** with all 14 event counters identical.

**The arena got bodies and meters (2026-09-18), and that was a renderer-only change.** Both fighters
are now posed rigs built from primitives (`fighters.ts`) in a dressed room with canvas-painted textures
and a PMREM environment map (`arenaScene.ts`), and the HUD reads health, stamina, boss health, the
stagger window and a live "frames until it can hurt you" straight off the simulation's own fields.
`duelSim.ts` and `BOSS_SETUP` were not touched, so no measurement went stale. Two honesty corrections
came out of it: the floor wedge had been colouring the *delay* differently from the windup, which hands
the player a tell the world does not give them (they now render identically), and the "special meter"
the brief asked for is the **riposte window** -- `bStagger` counting down -- rather than an invented
resource, because adding a resource would change the environment.
**Poise shipped (2026-09-18): you can stagger it by hitting it.** A landed hit takes 25 off a pool of
50 that refills at 0.08 a frame, so two clean hits inside one engagement put the boss down for 60
frames. This is an environment change, not a renderer one, so every figure involving a player who
attacks was re-measured. The expert is untouched (200/200 on full health, and 0.00 breaks, because
all of its damage is riposte damage already) and the punishers roughly double their score. Two things
are worth knowing. **The window length hid a trap:** at 52-56 frames the ranking of the two avoiders
REVERSES -- a resonance with the sidestepper's roll-and-swing cycle -- so the obvious choice of 55,
matching the parry window, would have quietly inverted the arc finding the whole line-to-floor rebuild
exists to show; 58-64 is the only flat stretch and 60 is the middle of it. **And it cost something:**
mashing, which lost 200 duels out of 200 before poise, now wins 2. A reward for landing hits is a
lottery ticket for the reckless player, and that is documented rather than smoothed over.

**Chapters 6 and 7 drafted in full (2026-09-18): World 3 is 14 of 14 and the track is 41 of 41.** The
user asked for a rough draft of every remaining page to iterate on one at a time, so all twelve were
written and wired: the moveset as a state machine, hitboxes and i-frames, stamina and the parry window,
what the agent sees, thousands of duels at once, the scripted ladder and the difficulty dial, the
curriculum, training, the turtle, delayed attacks, sim vs the real game, and the closing throughline.
Six new `boss_cases.py` commands (`states`, `timing`, `obs`, `curriculum`, `rewards`, `speed`) produce
everything they publish, and `scripts/boss_train.py` is NEW -- DQN and PPO against the extracted
environment, scored through the shipped `score()`, with `probe`, `delays` and `bench`.
**Three findings worth carrying out of it.** (1) `Duel(moves=[i])` turns "which attack is hardest" into
a measurement, and the answer inverts the obvious ordering: against `slam` or `heavy` alone -- the two
long telegraphed attacks -- both avoiders finish on 100.0 hp, while `combo`, the cheapest move in the
table, leaves the sidestepper on 8.2 and is the only move that beats the greedy expert (44% wins). The
mechanism is an interaction nobody designed: combo's two hitboxes are 12 frames apart and the roll's
i-frames are 10 wide, so no press covers both. (2) For BOTH delayed attacks the parry window sits
**inside the hold** (heavy: hitbox at 28, press on 21-25, hold 20-27) -- so "wait out the delay" is
exactly the wrong advice for a parrier, and the expert presses parry on 30% of its delay-frame
decisions against 7% of its windup ones. (3) Under a `survive` reward with a neutral clock, `hold
guard` scores **exactly 30.00** and a win is worth **exactly +30**: the turtle is found in arithmetic,
before any training. ⚠️ Every published block on these pages was machine-generated from the shipped
environment rather than transcribed, but **none has been Pyodide-verified by exact string equality
yet**, which is the first job of the refine pass.

**The training run landed (2026-09-18): DQN matches the expert's win rate, and the probe says it got
there the wrong way.** One run, seed 0, 2,000,000 decisions, 63 min on the 1660 Ti: **200 wins from
200 held-out duels**, no deaths, 83.6 hp left, 4.63 parries and **0.00 poise breaks** — so it found
the parry, not the turtle and not a refusal. It takes **7.01** swings a duel against the expert's
**7.00**, which is arithmetic rather than luck (a riposte is 36 damage and the boss has 240). The
curve is violently non-monotone -- nothing for a million decisions, 100% at 1.3M, a collapse to 69% at
1.6M, then 100% again -- and it visits and abandons both local optima the scripted ladder predicted,
peaking at 1.28 poise breaks and 27.3% guard frames around 900k. ⭐⭐ **But the delay probe fails it:**
against the two attacks that hold a finished-looking windup its median press slips from 4 frames to 6,
its mean to 9.1 and 11.0, and the share of presses landing in the usable band falls from 59-73% to
**45-49%**. It makes twice as many defensive presses as the expert on exactly those two moves and
converts ~30% of them into parries against the expert's ~100%. **It did not learn to wait; it learned
to throw a fifteen-stamina button repeatedly through the hold until one landed.** A page reporting
only the win rate would have called that "it learned to parry" and been wrong about the one thing this
world was built to study.

**What the gating experiments found, before any prose was written:**

- **Solvability with room to spare.** A hand-written duellist that reads the boss's animation clock and
  parries five frames before the hitbox goes live wins **200 of 200** held-out duels on full health,
  never taking a hit. Add one line of greed -- punish during recovery as well as during stagger -- and
  it wins 195 and dies 5 times.
- ⚠️ **The first trained agents found a hole in the physics.** The boss closed the gap only while idle
  and more slowly than the player walks, so walking backwards was a free and permanent refusal of the
  whole duel; PPO found it on all three seeds. The sanity ladder had no "refuse the task" row, so the
  world's worst bug was invisible until an agent pointed it out. **That row is now permanent**, and it
  is the same lesson World 1 learned when its boat sailed off the course.
- ⭐ **PPO's local optimum is a one-line rule, digit for digit, on two independent seeds** (v1, the one-dimensional duel -- kept for the lesson, not the number)**:** press guard
  on 100% of decisions, which reproduces the scripted `hold guard` row exactly (own hp 43.4, boss
  untouched at 240.0, guard 84.3% of frames). World 2's flat pilot did the same thing in a completely
  different world.
- ⭐ **The decision rate is not a training-speed knob.** The parry window is five frames wide; one
  decision every three frames costs the expert nothing, one every six drops it from 100% wins to 21.7%.
  Below a threshold set by the tightest window in the moveset, a coarser decision rate deletes a
  mechanic outright.
- ⚠️ **Fixing a reward hack can flatten the reward.** Making the clock a defeat rather than a truncation
  prices refusal out -- and squeezes every non-winning policy into a 18-point band where mashing (dead
  in 11 s) outscores blocking (alive at 30 s). Measured on scripted players first, then confirmed on a
  learner: the seed that had already stopped engaging did not change at all when its behaviour began
  scoring -30 every duel.
- **Two findings the 3-D rebuild added.** Leaving an attack's *arc* beats leaving its *reach*: rolling
  sideways collects 2.47 attacks a duel that reach the player and miss on angle, against 0.00 for
  rolling backwards, and ends 3 hp better off while standing 0.42 units closer. And the two bodies had to be made
  solid — without that the boss walked through the player while closing, which the one-dimensional
  version could not express and which watching the 3-D view exposed in about a minute.
- ⭐⭐ **The 600k-decision race was a budget artefact** (all v1; the v2 race is unrun)**.** At that budget DQN engages on every seed and PPO
  on none, and neither is close to the expert. One DQN run at **3M decisions reaches 100% wins** on the
  held-out 200 -- the expert's win rate -- with 4.16 parries against the expert's 8.51. The skill the
  world was built around is learnable and shows up about four times later than the local optima. The
  curve is not monotone: 86.5% at 1.45M, a dip to 19.5% at 2.10M, 89.0% at 2.40M.

Full log and every table: the "World 3 - Boss fight" section at the foot of `docs/env-building-plan.md`.

### 14.0c Phase 0 of the maths rebuild shipped (2026-09-15)

**`math-foundations/derivatives` is the reference implementation** of the standard in
`docs/math-pedagogy-plan.md` — 350 words became 2,561 plus a content module, with 4 worked examples,
13 problems in three bands with complete solutions, the track's first `<Proof>` and its first
runnable `CodeBlock`. New primitives `Worked` and `Practice`; new preamble `CALCULUS_SETUP`; new
content directory `src/content/math/`.

**Two new checks, both proved by breaking them.** `scripts/math_check.py` recomputes all 35
published answers independently with sympy — taking the long route where the page takes a shortcut —
and `check-pages.js` gained **R3**: a page rendering `<Worked>` or `<Practice>` must be listed in
that script's `PAGES` map. Flipping two signs produced two precise failures; removing the page from
the map fired R3.

Full pilot write-up, including three implementation traps worth reading before the second page
(fragment keys, sympify's own symbols, and why `.katex-display.scrollWidth` lies), is §11 of
`docs/math-pedagogy-plan.md`.

### 14.1 Working the backlog — the fix log

The audit's §0.3 lists nine cross-cutting fixes. Record each one here as it lands, so a later session
can tell a *decided* question from an open one. **`depth-audit.md` §0.5 is the live register** — what
is done, what is not, and the number attached to each; it is the first thing to read when picking up
this work, and the thing to update when putting it down.

**✅ The register, and a measurement correction (2026-09-15).** Added §0.5 to the audit: a status
table for all nine cross-cutting fixes, the per-track visual debt worst-first, the unbuilt work, and
the depth debt that is not about pictures. Writing it meant re-measuring, and the measure was wrong.

- `scripts/inventory.js` counted an **import** as a visual. Three pages import a figure and never
  render it (`function-approximation/when-td-diverges`, `.../whats-safe`,
  `building-environments/training-the-crew`), and every capstone page carrying a `DecisionPoint`
  counted as illustrated, because `pedagogy.tsx` sits under `components/capstone/`. It also missed
  default imports entirely. Fixed: resolve named *and* default imports, exclude `capstone/pedagogy`,
  and require the component to appear as a JSX tag in the body.
- The **asteroid capstone therefore read as 0 pages without a visual when 15 of its 24 have none** —
  the single largest error the audit contained, and it sat on the capstone the site presents as
  genre-defining. Part four is corrected.
- The independent check used during the figure passes was wrong in the *other* direction: it only
  looked under `components/figures` and `components/labs`, so building-environments (27 pages) and
  the warehouse capstone (24) counted as fully blind when their visuals live in `sail/`, `fire/` and
  `capstone/`. **That is where the "370 → 323, 42%" reported on 2026-09-15 came from, and it is
  wrong.** The two checks now agree exactly at **264 of 760 (35%)**.
- Worth keeping: *the second attempt at a broken metric is not automatically right.* The first fix
  corrected the suffix-matching bug and introduced a root-set bug in the same edit. Check a new
  measure against tracks whose answer you already know, in **both** directions — one that is too
  harsh and one that is too kind.

The register's own conclusion, which replaces the three finished items in §0.4: **naive Bayes
(16/20 blind), SVR (11/16) and kernel ridge (10/16)** are the worst ratios left and are one pass
each; **math foundations** (20/34 blind, 0 proofs, 0 runnable code, 367 w/pg) fails every test in
the audit at once and everything points at it.

**◐ Fix #1 — the figure budget: planning and k-Means (2026-09-15).** 67 pages, 47 blind → 0.
Two new measurement scripts, `scripts/planning_cases.py` and `scripts/kmeans_cases.py`, plus
`components/figures/planning/` and `components/figures/kmeans/`. Site-wide 370 → 323 blind.

*Findings, in order of how much they change what the pages say.*

- **The Planning track had never had a script.** It was the only RL track whose published numbers
  nobody could re-derive. `planning_cases.py` now recomputes every CodeOutput on all 22 pages and
  prints PASS/FAIL against what the page claims: **34 of 34 reproduce.** Four of my first six
  "failures" were my own counting conventions (does a policy-iteration round include the
  confirming round? does a sweep count include the one that detects convergence?) and one was me
  measuring the wrong MDP — *How many iterations* plans in the DEFAULT Sutton grid at γ = 1, not
  the goal/pit grid the rest of the track uses. Match the page's own loop before believing it is
  wrong.

- **Prioritized sweeping was advertising a 22% saving for a method that saves 86%.** The page's
  queue re-expanded every predecessor after every pop, never checked whether the backup moved the
  value, and never replaced a stale priority — so **62 of its 76 backups recomputed a number that
  did not change**. It still converged, which is exactly why it survived: the only symptom was the
  headline. The textbook queue needs **14** backups, one per non-terminal state, in a wavefront out
  from the goal. Listing, number and prose all replaced; the replacement was executed before being
  published.

- **A published Monte-Carlo estimate was a 3.5-sigma draw.** *Planning by sampling* prints four
  rollout values and says they "land right on top of" the exact ones. Three do. The fourth is 1.4
  off. Over 200 repetitions the estimator is unbiased to two decimals with a standard error of
  0.39 — so the seed-0 draw is a genuine outlier, and the four printed numbers read as a strict
  ranking when the truth is two exact ties (up = right = −21, down = left = −19). Now said out
  loud, which makes it the page's best paragraph rather than its weakest.

- **k-Means has 45 pages, 39 code blocks and zero `CodeOutput`.** Not one page commits to what its
  own code prints. So there was almost nothing to *verify* — the job was supplying the numbers the
  prose gestures at, and the gestures turn out to be wrong about as often as they are right.

- **Elkan's acceleration does 93% less arithmetic and takes 3× longer.** The audit asked for "a
  speed number, which is the only thing anyone wants from it". Measured: 92–94% fewer distance
  computations (better than the 2–10× usually quoted) and slower on the clock at every size, with
  the gap *widening* as k grows — 0.30× at k = 100, precisely where the theory says it should win
  most. Lloyd's assign step is one matrix product in threaded BLAS across 12 cores; Elkan's bound
  checks are a branchy per-point loop. Removing fifteen sixteenths of the operations does not pay
  when each survivor runs an order of magnitude slower. The page also told readers scikit-learn
  picks for them via `algorithm="auto"` — removed in 1.3, and it now raises. Both corrected.

- **"Unequal cluster sizes" is not a k-means failure mode.** The construction every textbook uses —
  three well-separated clusters of 500, 100 and 10 points — is recovered **exactly**, ARI 1.000.
  My first failure gallery shipped it as a failure because I built the panels from reputation. Two
  of four panels scored 0.96 and 0.80. The gallery now carries four constructions that were
  *measured* to fail (0.257 / 0.442 / 0.583 / 0.707), guarded by `assert a < 0.75`, plus two
  controls — and the real lesson is sharper: size alone is harmless, size **next to a big
  neighbour** is what gets a cluster swallowed.

- **`InitDistribution` nearly shipped unused.** The audit names the 100-random-vs-100-k-means++
  inertia distribution as "the actual evidence and currently absent"; I measured it (random reaches
  the best solution 9/100, k-means++ 82/100) and then almost left it on the floor because
  `k-means-plus-plus` already had a lab and so never appeared in the blind count. Grep the emitted
  data module for unused exports before calling a pass finished.

*Craft notes.*

- **The blind-page detector was itself wrong.** See the counting note in `depth-audit.md` §0.3 #1.
  A metric that is generous when it is unsure is worse than no metric, because its number is the
  one that gets reported.

- **`insert.py` put imports after `const code = \`import numpy as np ...\``.** It chose the
  insertion point as the last line starting with `import `, and most k-Means pages define their
  Python listing *below* the component. TypeScript caught it only because the identifier then
  happened to be out of scope; on a page whose listing came first it would have worked by luck.
  Placement is now computed from the file's leading block, which cannot contain a template literal.

- **Every clipped-SVG defect this session was a fixed box meeting content that did not fit** — a
  panel label longer than its panel, a legend row past a constant height, six marks in a five-mark
  frame, a baseline at y = 9 under a glyph with 11.4 units of ascent. The client-rect check (§14.1,
  previous entry) found nine across the two tracks, including one on `SilhouetteLab`, a page this
  pass had not otherwise touched. Derive the size from the content; a label written by a future
  caller will eventually be longer than you assumed.

- **The JSX whitespace trap is still live.** `wsscan.py` flagged 23 boundaries in these two tracks;
  checking each against the *rendered* page confirmed **14** real collisions ("previoussweep",
  "roughlyspherical", "beestimated") and cleared 9 that carry a deliberate leading space inside the
  tag. All 14 were pre-existing. Verify against rendered text, not source — the scanner alone
  over-reports by 40%.

**◐ Fix #1 — the figure budget: architecture design and function approximation (2026-09-15).**
The two largest blind tracks, 51 pages between them, **26/27 and 24/24 with nothing to look at** →
**0 and 0**. Counted with one consistent check over the whole tree, the site went **381 → 331 pages
with no visual (50% → 43%)**. Four tracks are now done; the remaining debts are listed in the audit.

The measurement came first, and on the architecture side it did not survive contact with the pages.

- **A load-bearing number was wrong on five pages.** *The depth tax*, *When depth hurts*, *The
  gradient problem*, *The order of operations* and *The playbook* all state that a depth-20,
  width-16 ReLU network with He init reaches **0.750** test accuracy — the result that motivates the
  entire skip-connections chapter. `scripts/architecture_cases.py` measures **0.9400** for that
  architecture, and 0.750 appears nowhere in its output.

  `scripts/arch_depth.py` (new) settles it. It hand-rolls Linear + optional BatchNorm + ReLU + Adam
  or SGD in numpy, because `MLPClassifier` cannot express a skip connection and replaces whatever
  initialisation you hand it — the same defect that made `init_norm_cases.py` unable to test its own
  headline. The finding: **0.750 is real, and it is depth 40 under plain SGD.** Under Adam there is
  no depth wall on this problem at all (0.948 at depth 2, 0.928 at depth 40); what grows with depth
  is the *spread between seeds*, 0.0024 → 0.0510, and the worst seed, 0.945 → 0.830. Under plain SGD
  the wall is sharp: 0.940 at depth 20, 0.770 at 30, 0.750 at 40, with seed spreads above 0.2 —
  meaning some runs fail outright and some are fine. Adam was hiding it, because per-parameter step
  rescaling is itself a partial fix for the problem the chapter is about. All five pages
  re-attributed; the depth tax is now taught as **a rise in the probability that a run is a
  write-off**, which is the same shape of failure the init-norm track found for a bad init.

- **A conclusion contradicted the numbers printed above it.** `architecture_cases.py` section 8 ends
  with "regularising a model that is too big recovers the gap", directly under a run where L2 moved
  the gap from 0.0150 to **0.0163** and test accuracy *down*. The cause is the dataset: 600 points of
  two moons cannot be overfit by any architecture in the grid, which is also why that script's
  "overfit (3×128)" row shows a *smaller* gap than its "good fit" row. Cut the training set to 40
  points and every claim becomes testable: a 4×128 net reaches train 1.000 / held-out 0.818, L2 at
  1e-2 takes held-out to **0.885** (+6.7 points, gap halved), 1e-1 over-corrects to 0.785, and the
  same treatment on a 1×2 net moves held-out by **−0.005**. Those 40 points also give *Reading the
  learning curve* — a page about reading curves, with no curve — four honest panels with a real
  downturn in the overfit one.

- **Chapter 5's real lesson was better than the one it was telling.** Measuring activation scale
  through 20 layers at He init: a plain stack **decays ×0.1** (0.513 → 0.060), a bare residual stack
  **explodes ×9,246** (0.513 → 4,742) because addition accumulates where multiplication decayed, and
  only residual **+ BatchNorm inside the block** stays bounded (×7.3). Under plain SGD the bare
  residual net scores **0.4700 from depth 12 onward — below the 0.5300 majority class**, while
  residual+BN holds 0.9417–0.9550 flat to depth 40. A skip connection alone is not a small
  improvement over a plain network; it is far worse. The track now teaches skip and norm as one
  design, which is why every real ResNet block contains both.

On the function-approximation side the numbers were already right — `fa_cases.py` is one of the more
rigorous scripts in the repo — and the gap was purely visual. `scripts/fa_figures.py` (new) is its
companion: it loads the same shipped `FA_SETUP` out of `runtimeSetup.ts` and prints the *series* a
figure needs (the value function across all 1000 states, the weight norm at every step, the whole
cost-to-go surface) rather than the summary statistic. `scripts/fa_emit_data.js` turns that stdout
into `figures/fa/data.generated.ts`, so forty numeric arrays reach the components without being
retyped. One genuinely new claim fell out: the **TD fixed point is 2.15× worse than the VE optimum**
(0.1167 against 0.0544, disagreeing by up to 0.1711 in a single group), which *Where TD settles* had
only as two RMSE numbers and can now show as two staircases.

When mirroring an existing experiment in a companion script, mirror it *exactly*. The first version
of the Baird section here reimplemented "on-policy" as "always take the solid action", which changes
the transitions and diverges too (40×); `fa_cases.py` means something narrower by dropping that leg —
same data, same transitions, importance ratio 1 — and that settles at 9.00. The script now says so in
a comment and prints both numbers next to what `fa_cases.py` reports, so the next divergence is
caught at the terminal.

Also landed: `figures/LayerTrace` promoted out of `initNorm/` (two tracks now use it) with the
shared `Series` type moved to `figures/series.ts`; `DecisionPoint` on the closing page of each track
(fix #4, 4 of 34 tracks done); PredictPrompts architecture 3 → 9 and FA 21 → 25 (fix #5); and
`MaxBiasLab` reused on *Double DQN*, giving that track its first lab, as the audit asked.

Two craft notes for the next content pass, both of which cost time here:

- **JSX drops newlines adjacent to tags.** `push\n<em>with</em>` renders as `pushwith`. The repo has
  been bitten before (the 2026-08-22 trees review fixed ~51 of these). End the line with `{" "}`.
- **Two series must never be separated by hue alone when one is `--bad` and the other
  `--c-neural`.** They are near-twins on screen and legend swatches become indistinguishable. Give
  the second a dash pattern as well. This is the second session in a row to hit it.
- **Check every hand-laid-out SVG for text that falls outside its own viewBox**, rather than
  eyeballing it. Five real defects on these two tracks got past a read-through and were caught in a
  second by pasting this into the console on each page:

  ```js
  [...document.querySelectorAll('svg[viewBox]')].flatMap((s) => {
    const S = s.getBoundingClientRect();
    return [...s.querySelectorAll('text')]
      .map((el) => [el, el.getBoundingClientRect()])
      .filter(([, b]) => b.width && (b.left < S.left - 1 || b.top < S.top - 1 ||
                                     b.right > S.right + 1 || b.bottom > S.bottom + 1))
      .map(([el]) => el.textContent);
  })
  ```

  It found: the triad diagram's "function approximation" label rendered at y = −6 and was invisible;
  `LayerTrace`'s rotated axis name ran off the left edge as soon as a track passed it a label longer
  than "variance"; a legend that wrapped to a second row fell below a fixed height; and two long
  explanatory sentences inside `<svg>` elements ran off the right edge, because a single `<text>`
  neither wraps nor shrinks. **Use `getBoundingClientRect`, not `getBBox`** — `getBBox` ignores
  ancestor transforms, so everything inside a `<g transform>` reports a false position. My first
  version of this check used `getBBox` and produced nothing but false positives.

  The general lesson is that a figure whose height is a constant will eventually be handed content
  that does not fit. Derive the height from the content (`heightFor(series.length)`), and keep long
  prose in the `caption`, where it reflows, rather than in the drawing.


**✅ Fix #8 — the detached output panel (2026-09-15).** `<CodeOutput>` now has two modes and the prop
picks both meaning and styling:

```tsx
<CodeBlock>…</CodeBlock>
<CodeOutput>…</CodeOutput>                            // attached: stdout of the code above
<CodeOutput source="scripts/boosting_cases.py">…</CodeOutput>   // standalone: a measured result
```

The `source` form gets its own full border (no more detached panel) and prints a
`reproduced by scripts/…` credit line under the numbers. That turns house rule #1 from a promise into
something the page states. All 23 standalone panels across 20 pages were converted — activations 4,
backprop 3, boosting 9, perceptron→MLP 5, random forests 1, housing capstone 1 — each attributed to
the script that prints those exact headers.

`node scripts/check-pages.js` enforces it, and fails on:

- **R1** a `<CodeOutput>` with no `<CodeBlock>` on the page and no `source`;
- **R2** a `source="…"` pointing at a file that does not exist in the repo.

Run it alongside `npx tsc --noEmit` before shipping a content pass.

**◐ Fix #5 — active recall, track by track.** Boosting done (2026-09-15): it had **23 pages and
zero `PredictPrompt`** while publishing nine measured results. Every one of those nine now has a
prediction above it, including the three that are honest nulls or reversals and are the whole reason
the rule exists — row subsampling buys nothing on housing (0.815 -> 0.812), XGBoost accuracy *falls*
monotonically as `reg_lambda` rises, and untuned histogram boosting loses to a random forest by six
points. A reader who has committed to "a clear gain" before seeing 0.812 remembers it; a reader who
is simply told does not.

Still at zero: **kernel ridge** and **regularized regression** (both have runnable code to predict
against), plus **init-norm** and **nn-regularisation**, whose prompts have to wait for fix #2 because
those tracks currently publish no results at all.

**✅ Fix #2 — the two blind tracks (2026-09-15).** `initialisation-and-normalisation` and
`nn-regularisation` were 42 pages carrying **0 figures, 1 lab between them, 0 CodeBlocks and 0
PredictPrompts**, running the identical `<Proof>`·`<Callout>`·`<Quiz>` template on every page. Both
are now at **0 pages without a visual**. Site-wide: 372 → 342 blind pages (49% → 45%).

What went in, and why none of it is decoration:

- **`scripts/init_norm_train.py` (new).** `init_norm_cases.py` measures the network only *at
  initialisation*, and leans on sklearn's `MLPClassifier`, which silently replaces whatever init you
  hand it — so its section 1, headed *Why init matters*, reported the identical 0.9567 / 0.9440 for
  every init scale on the list. The new file hand-rolls Linear (+ optional BatchNorm) + ReLU + Adam
  in numpy so that the init under test is the init that trains. Same 800-sample two-moons data as
  `init_norm_cases.py` and as `INIT_SETUP`, deliberately: one dataset runs through the whole track,
  and "same data, same architecture, only X differs" stops being true the moment they drift.
- **The track's thesis now has a number.** Spread of test accuracy across six init scales:
  **0.4750 without normalisation, 0.0083 with it** — a 57× collapse. BatchNorm lifts the two dead
  inits from 0.470, which is *below* the 0.530 majority class (they emit one constant logit,
  −0.055570, for all 200 test points; gradient norm at layer 1 is 1.33e-20), to 0.950. Against that,
  BatchNorm buys **at most +0.008 accuracy** and is 0.013 *behind* at depth 20. The track now says
  both, and draws the conclusion: **normalisation is a robustness technique, not an accuracy
  technique.** It does not make the good runs better, it stops the bad runs existing.
- **`scripts/reg_curves.py` (new)** re-runs section 6a of `regularisation_cases.py` with the same
  seeds and splits and keeps the trajectory instead of its endpoints — so the pages headed "the
  validation error bottoms out and then climbs" and "reading the curve" finally have the curve. 99%
  of that 4,000-epoch run makes the model worse.
- **New shared figures**: `figures/Dumbbell` (the same sweep run twice, on one axis),
  `figures/SweepCurve`, `figures/LearningCurve` (symlog x — early stopping happens inside the first
  1% of the run, so neither a linear nor a log axis shows it alone). Track-local:
  `figures/initNorm/{LayerTrace,NormAxes,BatchNormFlow,SymmetryFigure,GradRatioBars}` and
  `figures/nnReg/RegFigures` (diagnostic quadrant, penalty sum, dropout masks). One new lab,
  `labs/InitBandLab`, runs the forward and backward pass in the browser as you drag the init scale.
- **⚠ A print format was being published as a fact.** `%.4f` turned genuine geometric decay into
  "0.0000", and six passages across the track asserted the signal *is* zero by layer 2. It is not:
  it is 4.31e-06, then 1.62e-08, down to 1.07e-20 — two to three decades per layer, which on a log
  axis is a straight line and on the page was a wall of zeros. All six corrected, and three pages
  now teach the distinction explicitly. Two related defects fixed: `init_norm_cases.py` section 8
  printed `all outputs identical=False` for a provably identical layer (`len(np.unique(a, axis=1))`
  counts rows, not columns) directly above a conclusion saying the opposite; and `InitScaleLab` held
  rounded placeholders (1e-5, 1e-7, 1e-9) under a comment promising measured numbers — it now reads
  the shared series.
- **Fix #7, partly.** Neither track had runnable code. `INIT_SETUP` already existed in
  `runtimeSetup.ts`, complete and correct, imported by **zero pages**; three init-norm pages now use
  it, and the in-browser Run reproduces the published output panel byte for byte. New `NN_REG_SETUP`
  is numpy-only — the regularisation numbers come from PyTorch, which Pyodide cannot run — and covers
  the inverted-dropout scaling, which is the part of that track a reader is most likely to get wrong
  in their own code and the part that needs no training loop to check.
- **Fixes #4 and #5 advanced.** A `DecisionPoint` on each track's closing page, the first two of the
  one-per-family-track rollout; and 0 → 11 `PredictPrompt`s across the two tracks.

Helper: `node scripts/insert-blocks.js <spec.json>` splices JSX blocks into pages from a spec file.
It refuses missing or ambiguous anchors rather than guessing, handles the repo's CRLF endings, and is
idempotent, so a spec can be re-run safely.

### 14.2 Active recall — which primitive goes where (decided 2026-09-15, fix #6)

The audit found the two recall primitives had silently swapped places: the four newest bodies of work
(building-environments, function approximation, both finished capstones) have **zero `<Quiz>`** and
heavy `PredictPrompt`; the older tracks have the reverse (kNN 29 quizzes / 2 prompts, architecture
26 / 3, init-norm 20 / 0). Readers were learning two different rhythms. The decision:

**They are not substitutes. They sit at opposite ends of a page and do different jobs.**

| | `<PredictPrompt>` | `<Quiz>` |
|---|---|---|
| when | **before** the answer is shown | **after** the teaching is done |
| effect | pre-testing — commit, then get corrected | retrieval practice |
| placement | immediately above the result it precedes | last thing on the page |
| cadence | **every measured result** | **once per chapter**, on the chapter's last page |

1. **A measured number published without a preceding `PredictPrompt` is a defect.** The prompt is what
   turns a number from information into teaching: the reader has to own a guess before the answer
   lands. This is the rule the recent tracks got right and it is why they read better.
2. **`<Quiz>` closes a chapter, not a page.** Quizzing every page (kNN, architecture, init-norm) turns
   recall into background noise and the reader starts scrolling past it. One quiz, on the last page of
   the chapter, covering the chapter.
3. Neither excuses the other. The predict-heavy tracks owe a chapter-end quiz; the quiz-heavy tracks
   owe prompts before their results.

Tracks currently at **zero `PredictPrompt`**: boosting, init-norm, nn-regularisation, kernel ridge,
regularized regression. Those are the five that most need rule 1.

### 14.3 `DecisionPoint` is a site-wide primitive (fix #4, 2026-09-15)

Moved `src/components/capstone/DecisionPoint.tsx` -> `src/components/DecisionPoint.tsx` and repointed
all 16 importers. The folder was the whole problem: the strongest teaching device on the site sat in a
directory named after one genre, so it got used 16 times, 12 of them in capstones, and nowhere in the
34 family tracks.

It is fully general already — it takes an `accent`, so it wears any family colour. Use it where a
page asks the reader to *choose*, not merely to guess a number: the reader commits to what they would
do, then every option gets honest feedback and one is marked the senior move.

**Target: one `DecisionPoint` per family track**, on the track closing page, posing the decision the
track has just taught the reader to make. That is the cheapest large pedagogy win in the audit
(§0.4 item 5) and it is still outstanding.

`PredictPrompt` vs `DecisionPoint`: predict a **result** (a number is about to appear) vs decide an
**action** (what would you do next). They are not interchangeable.
