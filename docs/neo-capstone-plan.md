# NEO Hazard Capstone — Plan (v2, for refinement)

> Status: **PLANNING — nothing built yet.** Blueprint to mark up before writing pages.
> Dataset: `neo_v2.csv` (NASA Nearest-Earth-Objects, Kaggle). Classification capstone — the
> counterpart to the regression `california-housing-capstone`. Mirrors its conventions
> (`neoCapstoneTrack.ts`, `scripts/neo_cases.py`, `verify_capstone.py` guard, upgrade-driven arc).
> All numbers below are **real**, computed from the file during planning (2026-08-22).
>
> **v2 change:** the whole capstone is re-framed to teach *transferable thinking & research skill*,
> not a NEO-specific recipe. See §2 — it now governs every page.
> **v3 change:** depth over brevity — heavy acts are split into their own pages (target **~22 pages**,
> can grow further where a topic earns it); the model act is one-page-per-model. The Act 6 transfer
> test now hands the reader a **second, real dataset** to run the whole Playbook on (§10).
> **v4 change:** route = **`/learn/asteroid-hazard-capstone`**; top-level Capstone + own accent
> (visual-identity note §11). **Two** transfer datasets as a near→far ladder (Pulsar → Bank
> Marketing), so Act 6 gains a second transfer page → **~24 pages**.

---

## 1. The one-line thesis (the spine — we LEAD with this)

> **A dumb "is it big?" rule scores ROC-AUC 0.87 and looks brilliant — that's the trap. The honest
> metric (PR-AUC) exposes it at 0.29. The real data science is (a) choosing metrics and a split that
> can't lie to you, and (b) squeezing the bounded, genuine lift — roughly doubling PR-AUC to ~0.48 —
> out of velocity and miss-distance once size has done the obvious work.**

## 2. Pedagogical contract — teach *how to think*, not "do this here" (GOVERNS EVERY PAGE)

The point of this capstone is **skill transfer**: a reader who finishes it should be able to open a
dataset they have never seen, in a field they know nothing about, and *know how to proceed on their
own*. NEO is just the worked example. So every page obeys this structure:

1. **The question a DS asks (general).** Each page opens with the *reusable* question — "Does any
   column carry no information?", "Could the same entity appear in both train and test?", "Which
   metric matches the cost of being wrong?" — phrased so it applies to *any* project, before NEO is
   mentioned.
2. **How you'd find out (the method, general).** Teach the *move* and *why it works*: the heuristic,
   what to look at, what a red flag looks like. The reader learns the technique, not the answer.
3. **Do it on NEO (the instance).** *Now* apply it here — the reader predicts the outcome first
   (`PredictPrompt`/`DecisionPoint`), then sees the real result.
4. **Transfer prompt (your turn, general).** Close with "On your next dataset, how would you catch
   this? What would you do differently if it were images / time-series / medical?" — forcing the
   reader to lift the lesson off NEO.

**Three recurring devices carry the "thinking":**
- **🧭 The Analyst's Question** callout (opens each page): the general question, before any answer.
- **A running "DS Playbook"** the reader accumulates — each page adds one transferable rule to a
  checklist (§4) they could paste into their next project. The final page hands them the whole thing.
- **"Reason it out first"** gates: never state a conclusion the reader could derive. Show the
  *senior's reasoning* (why they suspected duplicates, how they chose PR-AUC), not just the verdict —
  the reasoning is the content.

**Voice rule:** we narrate *decisions and their justification* ("we don't trust accuracy here, and
here's the test that proves why"), never bare instructions ("drop these columns"). The reader should
be able to defend every choice to an interviewer afterwards.

## 3. The five hard truths the reader will personally discover

Each truth is taught as a **general move first**, then found on NEO — so the reader leaves with the
*skill of finding it*, not the fact.

| # | General skill the reader gains | How it shows up on NEO | The reusable move |
|---|---|---|---|
| T1 | Spot dead columns | `orbiting_body`≡Earth, `sentry_object`≡False | "Check `nunique()` on every column before modeling" |
| T2 | Detect features that are copies / formulas | diameter ratio ≡ √5; log-diameter vs `absolute_magnitude` corr = **−1.0** | "Correlate everything; corr ±1 or a constant ratio means one feature in disguise" |
| T3 | Suspect hidden group structure → leakage | 90,836 rows, **27,423 unique `id`s** | "Ask *what is one row?* and *could an entity repeat?* → group-aware split" |
| T4 | Interrogate whether a feature encodes the label | every hazardous obj has H ≤ 22.4; rule H≤22 → recall 0.99 | "Read the target's *definition*; if a feature helped define it, that's leakage to reason about" |
| T5 | Match the metric to the cost of error | 9.73% positive; rule ROC-AUC 0.87 but PR-AUC 0.29 | "Before scoring, ask: what does a false negative *cost*? Pick the metric that punishes it" |

## 4. The DS Playbook the reader builds (the transferable artifact)

Accumulated one rule per page; the takeaways page delivers it as a downloadable checklist the reader
can reuse on any dataset. Draft:

1. **Frame before data** — write the decision the model serves and how you'll know it worked.
2. **Research the domain** — find the data dictionary, the target's *official definition*, and units,
   before forming opinions.
3. **Meet the data** — shape, dtypes, one row's meaning, missingness.
4. **Audit integrity** — dead columns, duplicate/again group structure, target balance.
5. **Hunt redundancy** — correlate everything; a formula-derived feature is not new information.
6. **Explore to hypotheses** — plots produce *testable* statements, not vibes.
7. **Lock the harness before modeling** — pick the metric (by cost) and the split (by group
   structure) *first*, so no later result can flatter you.
8. **Baseline** — the trivial number every model must beat.
9. **Climb models by justification** — add complexity only when a diagnostic demands it.
10. **Choose an operating point** — a threshold is a business decision, not a default.
11. **Interpret & stress-test** — does the model agree with the domain? what can it *not* know?
12. **Conclude honestly & hand off** — limits, and a reproducible artifact.

## 5. Dataset facts (verified)

- **Shape:** 90,836 × 10. **No nulls.**
- **Columns:** `id`,`name` (ids) · `est_diameter_min/max` (km, ≡ H) · `relative_velocity` (km/h) ·
  `miss_distance` (km) · `orbiting_body`,`sentry_object` (const) · `absolute_magnitude` (H;
  **smaller = bigger**) · `hazardous` (target).
- **Target:** 9.73% hazardous. **Modeling features after cleaning:** `absolute_magnitude`,
  `relative_velocity`, `miss_distance` (+ `id` for grouping only).

### Honest benchmarks (grouped-by-`id` split, test n ≈ 22,660)

| Model | ROC-AUC | PR-AUC |
|---|---|---|
| Majority | 0.50 | 0.10 |
| Rule: "smaller H ⇒ hazardous" | 0.869 | 0.289 |
| Logistic (balanced) | 0.877 | 0.309 |
| Random forest (balanced) | 0.905 | 0.478 |
| Gradient boosting (HistGB) | 0.906 | 0.472 |

### The leakage gap (random vs grouped — the T3 payoff)

| Model | RANDOM PR-AUC | GROUPED PR-AUC |
|---|---|---|
| Rule: −H | 0.277 | 0.289 |
| Logistic | 0.293 | 0.309 |
| **Random forest** | **0.564** | **0.478** |
| HistGB | 0.520 | 0.472 |

The forest inflates most under random splitting (it can memorize repeated objects); rule/logreg
barely move. That signature *is* the lesson.

## 6. Track blueprint (~22 pages, 6 acts — flex up where a topic earns it)

> Every page carries the §2 four-part structure (Analyst's Question → method → NEO instance →
> transfer prompt) and adds one Playbook rule. Route **`/learn/neo-hazard-capstone`** *(open, §9)*.
> Depth is not rationed: a topic that needs two pages gets two.

### Act 1 — Frame it & learn any unfamiliar field
| Page | 🧭 Analyst's Question (general) | Transferable move taught | NEO instance / interaction |
|---|---|---|---|
| `index` | "What decision does this model serve, and what does success mean?" | Framing a problem as a decision + a metric, before data | Triage framing; ModelAnatomy |
| `research-method` | "I know nothing about this field — how do I get oriented, systematically?" | **A domain-research method for ANY field**: locate the data dictionary → find the target's *official definition* → units & provenance → plausibility of ranges → who made it & why. The general skill, taught standalone. | Demonstrated by doing it live for NEO |
| `neo-field-guide` | "What do these specific columns physically mean?" | Reading a data dictionary critically; converting jargon to plain models | NEO vs PHA, the H≤22 & MOID≤0.05AU rule, H=brightness→size (smaller=bigger), km/h & km. Field-guide figure |
| `questions` | "What will I test, and what do I expect *before* I look?" | Turning curiosity into written, falsifiable hypotheses | Write H1–H3 for NEO |

### Act 2 — First contact & integrity
| Page | 🧭 Analyst's Question | Transferable move | NEO instance |
|---|---|---|---|
| `first-look` | "What is one row, and what am I holding?" | The first-five-minutes routine (shape/dtypes/head/nulls) + "define one row" | code + CodeOutput |
| `integrity` | "Can I trust every row and column?" | Dead-column check; **the duplicate/group question**; target balance | **T1 + T3 reveal**; DecisionPoint: "63k dup ids — what now?" |
| `redundancy` | "Are any features secretly the same feature?" | Correlate-everything; spot formula-derived columns | **T2**: diameter vs H, corr −1.0 |

### Act 3 — Explore & analyze
| Page | 🧭 Analyst's Question | Transferable move | NEO instance |
|---|---|---|---|
| `distributions` | "What shape is each variable, and does that demand a transform?" | Reading skew/outliers; when to log-scale | histogram lab |
| `separation` | "Which features actually separate the classes?" | Bivariate-vs-target thinking; visual signal ≠ proof | pick-x/y scatter colored by target |
| `hypotheses` | "Which hunches survive a check?" | Converting plots into quick statistical checks | formalize H1–H3 |

### Act 4 — Lock the harness BEFORE modeling (the discipline act)
| Page | 🧭 Analyst's Question | Transferable move | NEO instance |
|---|---|---|---|
| `metrics` | "What does being wrong *cost*, and which metric punishes that?" | **T5**: choosing metrics by error cost; why accuracy/ROC mislead when rare | reuse `RocLab`/PR + `CostLab` |
| `the-split` | "How could my test set secretly contain my training data?" | Group-aware validation; leakage from repeated entities | **new SplitLeakLab** — live random-vs-grouped PR-AUC gap |
| `baselines` | "What's the trivial score every model must beat?" | Always baseline first (majority + one-feature rule) | threshold slider on H |

### Act 5 — Model, rung by rung (one model per page; climb only when justified)
| Page | 🧭 Analyst's Question | Transferable move | NEO instance |
|---|---|---|---|
| `logistic` | "What does the simplest honest model say, and why?" | Interpret-first modeling; coefficients/odds; class weights vs threshold for imbalance | reuse logistic labs; ROC 0.877 / PR 0.309 |
| `decision-tree` | "Can a single flexible model beat a linear one — and does it overfit?" | Reading a model's own logic (rules); the overfitting tell | reuse trees-family labs |
| `random-forest` | "Does averaging many trees add real, honest lift?" | Ensembling to cut variance; re-checking on the *grouped* harness | RF PR 0.478 (and why not 0.564) |
| `gradient-boosting` | "Does a stronger learner beat the forest here, and is it worth the tuning?" | When boosting's ceiling is/ isn't worth it | HistGB PR 0.472 ≈ forest |
| `model-comparison` | "Which model, and did complexity *earn* its keep?" | Comparing candidates on one honest harness; the cost of complexity | table vs baseline; pick a winner |
| `operating-point` | "Where do I set the alarm, given the costs?" | A threshold is a decision, not a default | reuse `ThresholdLab`; confusion matrix at chosen point |

### Act 6 — Interpret, conclude, hand off
| Page | 🧭 Analyst's Question | Transferable move | NEO instance |
|---|---|---|---|
| `interpretation` | "Does the model agree with reality?" | Sanity-checking a model against domain truth (importance/PDP/SHAP) | rediscovers size; velocity/dist add the lift |
| `limits` | "What can this model *never* know, and where would it fail?" | Naming blind spots & failure modes honestly | no MOID → can't fully reproduce the PHA rule; distribution caveats |
| `takeaways` | "What did I learn that I can reuse next time?" | **Delivers the whole §4 Playbook** as a downloadable checklist + reproducible notebook | verdict + limits recap |
| `transfer-near` (Pulsar) | "Can I re-run the Playbook in a related field with new features?" | **Near transfer** — same theme (space), lighter domain research, engineered-stat features | HTRU2 pulsar detection; framing Qs, no answers, reveal-able walkthrough |
| `transfer-far` (Bank Marketing) | "Can I do this in a field I know nothing about, with a *different* trap?" | **Far transfer** — cold domain research + rediscover leakage (`duration`) + categorical encoding | UCI bank marketing; framing Qs, no answers, reveal-able walkthrough |

## 7. New vs reused labs
- **New:** `SplitLeakLab` (random vs grouped → PR-AUC gap; flagship). Maybe small `RedundancyLab`.
- **Reused:** `RocLab`, `CostLab`, `ThresholdLab`, `CalibrationLab`, logistic labs, `ShapExplorerLab`,
  histogram/scatter idioms. This capstone is largely *integration* of existing machinery.

## 8. Honest-numbers, reproducibility, wiring
- `scripts/neo_cases.py` produces **every** published number; wire into a `verify_*` guard.
- Downloadable notebook artifact; bundle/deliver `neo_v2.csv`.
- `src/lib/neoCapstoneTrack.ts` (`NEO_TRACK`/`_TOTAL`/`_DONE`), `layout.tsx`, per-page `page.tsx`,
  `siteMap.ts` + `searchIndex.ts` wiring. Accent colour: open (§9).

## 9. Decisions & open questions
- ✅ **Route:** `/learn/asteroid-hazard-capstone`. (decided)
- ✅ **Granularity:** go deep — ~24 pages, flex further where a topic earns it. (decided)
- ✅ **Model act:** one model per page (logistic / tree / forest / boosting / comparison). (decided)
- ✅ **Placement:** top-level Capstone (beside California housing) + its own accent. (decided)
- ✅ **Transfer test:** **two** real datasets as a near→far ladder — Pulsar then Bank Marketing. (decided)
- ❓ **Visual identity / "space theme":** see §11 — recommendation inside, needs your yes/no.
- ❓ **Dataset delivery:** bundle CSVs in `public/` vs link source + a download step?

## 10. The transfer-test ladder (Act 6 — BOTH, near → far)

Two datasets, deliberately ordered so the reader transfers in two hops instead of one leap. Both ship
with framing questions and **no answers**, plus a reveal-able "senior's walkthrough".

| Stage | Dataset | Field to research | Why it sits here | Trap(s) — different from NEO |
|---|---|---|---|---|
| **Near** | Pulsar (HTRU2) | radio astronomy | Same "space" theme → lighter domain research; reader focuses on *applying the method*, not re-learning a field | ~9% positive; features are **engineered summary stats** (teaches reading derived features); no group structure |
| **Far** | Bank Marketing (UCI) | retail banking / telemarketing | Cold, unfamiliar field → the true test of the domain-research method | ~11% positive; **classic target leak via `duration`** (known only *after* the call → reader rediscovers T4); **categorical encoding** (a new skill) |

Rationale for the order: Pulsar proves the reader can wield the Playbook when only the *features*
change; Bank Marketing proves they can wield it when the *entire field and the trap* change — the
strongest evidence the thinking, not the facts, transferred.

## 11. Visual identity — the "space theme" question (needs your yes/no)

You floated changing the whole page to a space theme during the capstone. My honest take, against the
locked editorial doctrine (§10.1: riso palette is vivid *because* everything around it is quiet; the
gradient ban is absolute; "could a reader tell this apart from a scaffolded AI site?"):

- ❌ **A full theme swap** (starfield backgrounds, cosmic gradients, neon) would fight the identity and
  read as decorative — the exact thing the site defines itself against. Not recommended.
- ✅ **Recommended: a restrained "deep-space" identity** that still reads as Manifold —
  1. **Its own accent token** (e.g. `--c-space`): a deep indigo/periwinkle for the track, with the
     riso **coral/amber reserved for the `hazardous` class** everywhere (so colour itself teaches).
  2. **A signature figure motif** unique to this track — hairline orbital/trajectory diagrams, an
     asteroid-size dot scale — giving it a recognizable look without a theme swap.
  3. Optional, subtle: a **near-black canvas** only *inside figures* (not the page), evoking sky while
     keeping body type on the normal surface.
- **Proposal:** I build **one page (the index) both ways** — restrained-identity vs a bolder
  space treatment — and you pick from the real thing before we commit. Low cost, removes the guesswork.
