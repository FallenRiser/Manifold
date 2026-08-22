# Manifold — Project Handoff & Master Plan

> Read this first. It is the single source of truth for what Manifold is, what's built, what's
> planned, and every locked decision about content voice, UI, and tech. Pair it with
> [`docs/curriculum-map.md`](./curriculum-map.md) (the full curriculum/IA).
>
> **New lead? Read §12 first** — the complete playbook: style philosophy, content & lab craft,
> the three-pass review loop, upgrade heuristics, and the ordered priority list. §§10–11 hold the
> binding specifics (palette, lab standards, authoring checklist); §12 holds the judgement.
>
> Last updated: 2026-08-21 — 🌳🌲 **BOTH TREES TRACKS EXPANDED TO MASTERY PARITY.** Decision Trees **14→20pp**,
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
1. **No gradient CTAs, ever.** The primary CTA is **solid riso blue** (`--cta: #0078bf` light /
   lifted `#4da8ec` with dark text in dark mode). Solid colour only.
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
4. **Dark theme stays warm-neutral** paper-at-night (`#121211` etc.), riso hues lifted — vivid on
   warm black is fine; neon-on-blue-black is not.
5. **Code themes use the same riso hues** (violet keywords, teal strings, blue properties, pink
   classes, gold entities) — colourful but never Dracula.
6. **Sweep rule stands:** no hardcoded accent hexes in labs/pages; everything through tokens.

### 10.2 Landing-page doctrine

The landing page must **prove the product, not describe it**. Required structure:
1. **A live lab in the hero** — a real draggable mini-lab (line-of-best-fit with live MSE),
   captioned only "drag the line". Ten seconds in, the visitor has *used* the product. This
   replaces the static `LossLandscapeArt`.
2. **"How it teaches" band** — the 4 depth tiers + the 7-stage arc, in the book-part editorial style.
3. **Featured tracks** — real cards for every live track with page counts and a signature visual.
4. **Capstone showcase** — "one real dataset, framing → stacked ensemble, R² 0.653 → 0.858" + geo map.
5. **A footer** — map links, theme toggle, and a type-nerd colophon (on-brand for Stripe Press).
6. **No dead chrome:** header items exist only if their pages exist; family chips link to `/map`.

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

### 12.7 Priorities for the next lead (ordered; updated 2026-07-06)

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
1. **LR static-page upgrades** — the §9 item-2 list (residual diagnostics shared lab, Q–Q,
   CV/bias–variance) is the oldest unpaid debt in the best track. **Now the top content priority** —
   five tracks complete + a whole family done, but the *flagship* LR track still carries the oldest polish debt.
4. ✅ **KNN (36/36)** + ✅ **REGRESSION FAMILY** + ✅ **DECISION TREES (14/14)** + ✅ **RANDOM FORESTS (14/14)** — all 2026-08-20.
   Trees & ensembles family is 2/4 tracks done. **Next in the family: Boosting** (`/learn/boosting`) — AdaBoost +
   gradient boosting, the tabular ceiling-raiser. Reuse the tree CART code + the "parallel variance (forest) vs
   sequential bias (boosting)" framing already teed up on random-forests' forest-vs-tree-vs-boosting page + case.
   Flagship lab idea: a sequential residual-fitting stagewise lab (watch each stump correct the last; learning-rate
   + n_rounds → train/val curves that CAN overfit, unlike the forest). Then **Stacking**. Other greyed surfaces if
   pivoting: **Classification** — Naive Bayes, SVM (low-effort sibling of built SVR), kernel methods. Prefer finishing
   the Trees family. NOTE: a live-visual eyeball of the decision-trees + random-forests labs is still owed (dev server
   was wedged 2026-08-20; both tracks verified via `next build` + node instead).
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
