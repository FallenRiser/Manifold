# Manifold — Curriculum Map & Information Architecture

The complete content plan for Manifold. This is the source of truth for *what* the site
teaches and *how it's organised*. It is intentionally broad; per-page outlines live in
their own track files (e.g. the linear-regression track in `src/lib/linearRegressionTrack.ts`).

---

## 1. The depth-tier model

The defining idea: **one topic, four optional depths.** A complete beginner and a graduate
student use the same site — they just descend to different tiers. Theory is always opt-in,
never a wall in front of beginners.

| Tier | Name | Question it answers | Audience |
|------|------|---------------------|----------|
| **0** | Math Foundations | "What math do I need?" | Anyone missing a prerequisite |
| **1** | Intuition | "What is this, and why does it work?" | Everyone — the front door |
| **2** | Practitioner | "How do I actually use it well?" | People building models |
| **3** | Theory | "Why is it *guaranteed* to work?" | Advanced / grad-level |

Every algorithm page is authored at Tier 1 first. Tier 2 adds code, tuning, and workflow.
Tier 3 ("Go deeper →") adds the formal guarantees and proofs, and links into the
**Learning Theory** track. Tier 0 prerequisites are linked inline wherever first needed.

---

## 2. Family colour system

Each family owns one colour everywhere (chrome, chips, lab accents, progress). Cross-cutting
and foundational content is neutral gray. Brand violet is reserved for UI/CTAs.

| Domain | Colour |
|---|---|
| Regression | blue |
| Classification | pink |
| Trees & ensembles | green |
| Clustering & unsupervised | teal |
| Dimensionality reduction | purple |
| Neural networks | coral |
| Reinforcement learning | amber |
| Optimization / fundamentals | gray-warm |
| Pillars · Theory · Math Foundations | gray (neutral) |

---

## 3. Top-level navigation

```
Start here   ·   Algorithms   ·   Workflow   ·   Metrics   ·   Theory   ·   Foundations
```

1. **Start here** — onboarding
2. **Math Foundations** — Tier 0 prerequisite track
3. **Algorithm families** — the core (7 families)
4. **Cross-cutting pillars** — Data Workflow · Evaluation & Metrics · Model Selection
5. **Learning Theory** — Tier 3 track
6. **Special topics** — later/advanced

---

## 4. Start here (onboarding)

- What is machine learning? (the friendly 5-minute version)
- The landscape: supervised · unsupervised · reinforcement (an interactive map)
- How to read Manifold: the tier system, families, and labs
- Pick your path: complete beginner · practitioner · theory-curious

---

## 5. Math Foundations · Tier 0 *(Mohri appendices A–E)*

Short, interactive refreshers — linked inline from wherever a topic first needs them.

- **Linear algebra** — vectors, norms, dual norms, matrices, SVD, SPSD matrices
- **Calculus & convex optimization** — derivatives, gradients, convexity, constrained
  optimization, Lagrange/Fenchel duality, subgradients
- **Probability** — random variables, conditional probability, expectation, variance,
  moment-generating functions
- **Concentration inequalities** — Hoeffding, Chernoff, Azuma, McDiarmid *(feeds Theory)*
- **Information theory** — entropy, relative entropy (KL), mutual information, Bregman divergences

---

## 6. Algorithm families (the core)

Each family is a hub of algorithm **tracks**; each track spans Tiers 1–3.

### 6.1 Regression · blue
- **Linear regression** — the flagship track *(see `linearRegressionTrack.ts`, ~44 pages)*
- Ridge, Lasso & Elastic-net *(Mohri 11.3.4)*
- Polynomial & basis-function regression
- Kernel ridge regression *(Tier 3 · Mohri 11.3.2)*
- Support vector regression *(Tier 3 · Mohri 11.3.3)*
- Generalization bounds for regression *(Tier 3 · Mohri 11.2)*

### 6.2 Classification · pink
- Logistic regression (+ the maximum-entropy view) *(Mohri 13)*
- k-Nearest Neighbors
- Naive Bayes
- Support Vector Machines — separable, soft-margin, dual, margin theory *(Mohri 5)*
- Kernel methods — PDS kernels, RKHS, the kernel trick, representer theorem *(Mohri 6)*
- Perceptron & online linear classifiers *(Mohri 8.3)*
- Multi-class strategies — one-vs-all, one-vs-one, ECOC, softmax *(Mohri 9.4)*

### 6.3 Trees & ensembles · green
- Decision trees *(Mohri 9.3.3)*
- Bagging & random forests
- Boosting — AdaBoost, gradient boosting, modern GBMs *(Mohri 7)*
- Stacking & blending

### 6.4 Clustering & unsupervised · teal
- k-Means (+ k-Means++)
- Hierarchical clustering
- DBSCAN & density-based clustering
- Gaussian mixture models & the EM algorithm

### 6.5 Dimensionality reduction · purple *(Mohri 15)*
- Principal component analysis (PCA)
- Kernel PCA
- **Manifold learning** — Isomap, Locally Linear Embedding, Laplacian eigenmaps *(our namesake)*
- t-SNE & UMAP (practitioner)
- Random projections & the Johnson–Lindenstrauss lemma *(Tier 3)*

### 6.6 Neural networks · coral
- From perceptron to the multilayer perceptron
- Backpropagation & training dynamics
- **Activation functions — choosing & designing** *(own track, see below)*
- **Architecture design — depth, width & what to apply when** *(own track, see below)*
- Initialisation & normalisation
- Regularisation — dropout, weight decay, early stopping
- *(Later/stretch: CNNs, sequence models, attention)*

#### 6.6a Activation functions — choosing & designing · Tier 1→2

The goal is not a lookup table of formulas; it is **a learner who can look at a stuck
training run and name which property of their activation caused it**, and who could
justify a new one.

*What each function actually does* — for every activation, the same four-part anatomy:
the curve, **the derivative** (the part that decides whether learning happens),
the output range, and the failure mode it was invented to fix.
- Step & sign — why the perceptron couldn't be trained by gradient descent
- Sigmoid & tanh — squashing, saturation, why tanh's zero-centring beats sigmoid in hidden layers
- ReLU — the default, and what it bought: non-saturating gradient, sparsity, cheapness
- Dying ReLU, and the family that answers it — Leaky ReLU, PReLU, ELU, SELU
- Smooth moderns — GELU, Swish/SiLU, Mish — and *what the smoothness actually buys*
- Output-layer activations are a different question — identity, sigmoid, softmax —
  chosen by the **loss and the label space**, never by taste
- Gated/other — GLU family, softplus, maxout *(brief, for completeness)*

*The intuition — the properties, not the names.* The load-bearing chapter. Every
activation is a point in a small space of properties, and choosing one means choosing
properties:
- **Gradient behaviour** — where is the derivative ≈ 0? Saturation is the whole story
  behind vanishing gradients; ties directly to backprop's chain-rule product
- **Range & zero-centring** — why non-zero-mean activations bias the gradient, and how
  normalisation makes this matter less than it did in 2012
- **Monotonicity, smoothness, non-linearity** — what breaks if you drop each
- **Cost** — an exp() per unit per step is not free
- **The one non-negotiable** — non-linear, or the whole network collapses to one
  linear map (the proof is one line and belongs here)

*When to use which* — an explicit decision procedure with reasons, not a table:
hidden layers by default → ReLU; deep/transformer → GELU or SiLU; RNN state → tanh;
self-normalising nets → SELU with its required init; output layer ← determined by the
task. Plus the **honest note** that most modern differences are worth fractions of a
point, and are dominated by architecture, data and normalisation.

*Designing a new one* — the transferable skill. State the property you need, write a
function with it, check the derivative doesn't vanish or explode, check it's cheap,
then measure. Case study: **derive Swish's shape from the requirements** (smooth,
non-monotone near zero, unbounded above, bounded below) and see it land where the
search did.

**Labs.** `ActivationExplorerLab` (flagship — curve *and* derivative side by side,
sliders on the shape parameters, live "where does the gradient die?" shading) ·
`VanishingGradientLab` (gradient magnitude per layer vs depth, activation-switchable —
sigmoid dies, ReLU doesn't) · `DyingReLULab` · `ActivationBakeoffLab`
(same net, same data, swap the activation, honest measured curves).

**Honest numbers.** `scripts/activation_cases.py` — one fixed MLP on one dataset,
every activation, measured; plus the per-layer gradient-norm table that makes the
vanishing-gradient claim concrete rather than asserted.

#### 6.6b Architecture design — depth, width & what to apply when · Tier 2

The question every learner asks first and every course answers last: *how many layers,
how many neurons?* Answered as **a search procedure with priors**, not a number.

- **What depth buys** — composition, feature hierarchy, and the exponential-advantage
  results (stated honestly, with their caveats). Why depth beats width per parameter.
- **What width buys** — universal approximation is a *width* theorem; state it, then
  immediately state what it does not promise (nothing about learnability or data).
- Reading it off the data instead of guessing: input dimension, sample size,
  signal complexity, and the **capacity intuition from [[learning theory]]** —
  parameters vs n, and why the classical rule-of-thumb is wrong post-double-descent.
- **Sensible starting points** and where they come from — the funnel, constant-width,
  the "start too big and regularise" modern default.
- **The order of operations** — what to reach for and when: get it training first,
  then overfit deliberately, then regularise. Normalisation, residual connections,
  and dropout each introduced *at the symptom that motivates them*.
- Skip/residual connections as an **architecture-level answer to a gradient problem** —
  the link back to 6.6a.
- Budgeting — parameters, memory, latency — and tuning depth/width **jointly**, which
  is the [[model selection]] lesson applied here.
- **The diagnostic loop** — learning curves and train/val gap tell you which knob to
  turn, so architecture search is directed rather than random.

**Labs.** `ArchitectureSandboxLab` (flagship — add/remove layers and neurons on a live
2-D task, watch the decision boundary and the parameter count move together) ·
`DepthVsWidthLab` (same parameter budget, spent two ways) · `CapacityLadderLab`
(underfit → fit → overfit, driven by width alone).

**Honest numbers.** `scripts/architecture_cases.py` — a real depth × width sweep with
measured train/val, so the recommendations are read off data and the plateau is
visible.

**Prerequisites:** backpropagation (for 6.6a's gradient story), learning curves and
the capacity material in Model selection (for 6.6b). Both are Tier 1→2; the
approximation-theory statements are Tier 3 and belong in `<Proof>` asides.

### 6.7 Reinforcement learning · amber *(Mohri 17)*
- The RL scenario & Markov decision processes
- Policies, value functions, optimal policies
- Planning — value iteration, policy iteration, linear programming
- Learning — TD(0), Q-learning, SARSA, TD(λ)
- Large state spaces & function approximation

### 6.8 Optimization (fundamentals strand) · gray-warm
The engine threaded through every family; has its own reference pages.
- Gradient descent (home base: the LR track) · SGD · mini-batch
- Momentum, RMSProp, Adam
- Convex vs non-convex landscapes
- Coordinate descent *(ties to boosting & maxent · Mohri 7.2.2, 12.7)*

---

## 7. Cross-cutting pillars · gray

### 7.1 The Data Workflow · **BUILT 2026-08-28 · 28 pages · `/learn/data-workflow`**
Given a dataset, what do you actually do? Built as **judgement, not a checklist** — the
spine is *model quality is decided before the model*, and each chapter is one class of
pre-`.fit()` decision with a wrong default that feels right. The checklist is the LAST
page on purpose, so it reads as derived rather than as instructions.

1. **Before you model** — the loop (not a line), working backwards from the decision,
   and what one row is (the unit of analysis).
2. **Framing** — the label is constructed not found · the time-travel test ·
   task choice · the eight-line framing contract.
3. **Meeting the data** — EDA as hypothesis generation · distribution shapes as
   evidence about mechanisms · confounds and Simpson's paradox · ten sanity checks.
4. **Data quality & leakage** — MCAR/MAR/MNAR · outliers vs influence · the four faces
   of leakage · pipelines as the structural fix.
5. **Preparing features** — preprocessing as modelling · encodings · scaling and
   transforms · feature engineering and its honest ROI.
6. **From baseline to better** — the baseline ladder · the first real model ·
   **error analysis (the pillar's flagship page)** · the diagnosis→action table.
7. **Beyond the notebook** — reproducibility · drift and monitoring · feedback loops ·
   the workflow playbook.

**Boundaries (deliberate):** §7.2 owns *which metric*, §7.3 owns *CV machinery*, the
capstones own *the end-to-end walkthrough*. This pillar owns framing, data quality,
leakage, features, diagnosis and life after deployment.

**Labs.** `SimpsonsParadoxLab` · `LeakageLab` · `MissingnessLab` ·
`ErrorAnalysisLab` (flagship) · `DriftLab`. Reuses `DistributionLab`, `InfluenceLab`,
`CategoricalFeaturesLab`, `FeatureScalingLab`.

**Honest numbers.** `scripts/data_workflow_cases.py`, 8 sections. The three largest
measured failures are all decisions made before the model was chosen: temporal leakage
**0.62 of R²**, group leakage **0.52 of R²**, preprocessing leakage **0.38 of accuracy
manufactured from pure noise**.

### 7.2 Evaluation & Metrics
Confusion matrix · accuracy/precision/recall/F1 · ROC/AUC · precision–recall/AP ·
calibration & log-loss · cost-sensitive thresholds · regression metrics · which metric
when, case by case *(prototype lab already built)*.

### 7.3 Model Selection *(Mohri 4)* — bridges practitioner ↔ theory
- Estimation vs approximation error (the bias–complexity decomposition)
- Empirical risk minimization (ERM) & structural risk minimization (SRM)
- Cross-validation & n-fold CV
- Regularization as capacity control
- Convex surrogate losses

---

## 8. Learning Theory · Tier 3 *(the Mohri spine)*

The "why is it guaranteed to work?" track. Ambitious to make visual — built later, kept optional.

- Generalization: the central question *(Mohri 1.6)*
- The PAC learning framework *(Mohri 2)*
- Finite hypothesis sets: consistent & inconsistent cases *(Mohri 2.2–2.3)*
- Bayes error & noise *(Mohri 2.4)*
- Rademacher complexity *(Mohri 3.1)*
- Growth function & VC-dimension *(Mohri 3.2–3.3)*
- Margin theory *(Mohri 5.4, 7.3)*
- Algorithmic stability *(Mohri 14)*
- Online learning & regret — experts, weighted majority, regret bounds *(Mohri 8)*

---

## 9. Special topics (later / advanced)

- **Ranking** — pairwise ranking, RankBoost, area under the ROC curve *(Mohri 10)*
- **Structured prediction** *(Mohri 9.5)*
- **Density estimation & maximum-entropy models** *(Mohri 12–13)*
- **Learning automata & languages** *(Mohri 16 — likely out of scope)*

---

## 10. Mohri → Manifold mapping (quick reference)

| Mohri chapter | Manifold home | Tier |
|---|---|---|
| 1 Introduction | Start here | 1 |
| 2 PAC · 3 Rademacher/VC | Learning Theory | 3 |
| 4 Model selection | Model Selection pillar | 2–3 |
| 5 SVM · 6 Kernels | Classification | 2–3 |
| 7 Boosting | Trees & ensembles | 2–3 |
| 8 Online learning | Classification / Learning Theory | 3 |
| 9 Multi-class | Classification · Trees | 2–3 |
| 10 Ranking | Special topics (↔ Metrics) | 3 |
| 11 Regression | Regression | 2–3 |
| 12–13 Maxent · Logistic | Classification | 2–3 |
| 14 Stability | Learning Theory | 3 |
| 15 Dimensionality reduction | Dim-reduction family | 2–3 |
| 16 Automata & languages | Special topics | 3 |
| 17 Reinforcement learning | RL family | 2–3 |
| Appendices A–E | Math Foundations | 0 |

---

## 11. Build phases

1. **Now** — finish the Linear Regression track (Tiers 1–2), prove the lesson engine.
2. **Next** — k-Means + KNN (broaden families); build the real `/map` page.
3. **Then** — the cross-cutting pillars (Workflow, Metrics, Model Selection).
4. **Deepen** — add Tier-3 sections to mature tracks; stand up the Learning Theory track
   with one strong interactive (bias–variance / generalization) as the proof of concept.
5. **Widen** — remaining families (trees, clustering, dim-reduction, neural, RL).
6. **Later** — special topics; Math Foundations refreshers fleshed out as demand appears.
