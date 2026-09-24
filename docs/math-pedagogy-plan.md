# Math foundations & theory — the teaching rebuild

**Status: Phase 0 SHIPPED 2026-09-15 — `math-foundations/derivatives` is the reference
implementation (§11). Everything else planned. Decided 2026-09-15 (user).** Authority for every page in
`math-foundations`, `learning-theory` and `model-selection` from here on. Supersedes the
math-foundations entries in `docs/depth-audit.md` §11 and §0.4 — those stay as the *diagnosis*;
this is the prescription.

---

## 1. The instruction

> *"Math is stuffed a lot per page per concept. What I want is: if a page needs detailed
> explanations, go for it — lengthen a page, add more pages. And for each concept I need 3–4 solved
> examples end to end, completely, like a teacher teaching students. And then 10+ questions per
> concept for the student to solve, with complete end-to-end solutions for the user to check. It
> should have 3 difficulties: (1) normal basic concept application, (2) a bit advanced, (3)
> competitive-exam level — don't mention them like that, but understand how each question is asked
> in those exams, and teach them to solve in that manner too."*

Three separate demands, and they are worth keeping separate because they fail differently:

1. **Space.** One concept per page, taught to completion, however long that takes. Splitting pages
   is preferred to cramming them.
2. **Worked examples.** 3–4 per concept, end to end, in a teacher's voice — every step says *what*
   was done and *why that step was chosen*.
3. **Practice.** 10+ problems per concept, three difficulty bands, every one with a complete
   solution the reader can check against.

---

## 2. Why this is the right fix for this track specifically

The depth audit (§11) found math-foundations failing every test in the document at once, and it is
the only track where all four failures have the same cause:

| audit finding | number |
|---|---|
| words per page | **368** — the lowest on the site, against 810 for learning theory |
| pages with no visual | **20 of 34** |
| `<Proof>` blocks | **0** — in the mathematics track, on a site where `<Proof>` was built for mathematics |
| runnable code | **0 CodeBlocks** |

*The dot product & projection* is **286 words carrying 19 MathBlocks**. That is not a lesson, it is
a formula card. The audit called this "depth inverted", and the cause is that the pages were written
as *reference* — something a later track could link into mid-sentence — rather than as *teaching*.
The reference job is real and it stays; the teaching job was never done.

**So this rebuild absorbs the audit's separate math-foundations items rather than running beside
them.** A page rebuilt to the standard below clears the word-count debt, the visual debt, the
`<Proof>` debt and (where it makes sense) the runnable-code debt in one pass. Do not schedule them
as four passes.

---

## 3. The page standard

### 3.1 One concept, one page

A page teaches exactly one idea. If the current page carries two, it becomes two pages. **Length is
not a constraint**; incoherence is. Target 1,200–2,500 words where today's average is 368 — but the
target is a symptom, not a goal: write until the idea is taught.

Concrete first-pass splits, to show what "add more pages" means:

| today | becomes |
|---|---|
| The dot product & projection (286w) | *The dot product* · *Projection onto a vector and onto a subspace* |
| Rank, inverses & linear systems | *Rank and the four fundamental subspaces* · *Ax = b: existence and uniqueness* · *Inverses, the pseudo-inverse and least squares* |
| Eigenvectors & eigenvalues | *Eigenvectors: what they are* · *Diagonalisation and matrix powers* · *The spectral theorem* |
| Expectation & variance (296w) | *Expectation and linearity* · *Variance and its two decompositions* |
| Duality, in one page (341w) | *The Lagrangian dual* · *KKT conditions* (§0.3 #9 asks for this anyway) |

The four fundamental subspaces do not currently appear anywhere on the site, which is why linear
regression's projection picture has no foundation to link back to. This rebuild is where that lands.

**Estimate: 34 pages → roughly 70.** That number is a consequence of the splits, not a target.

### 3.2 The page skeleton

Every rebuilt page, in this order:

1. **Why this exists** — one paragraph naming where in ML the idea is actually used, concretely
   (dot product → every linear model's prediction; rank → multicollinearity; SPD → covariance and
   kernels; MGF → Chernoff, and nothing else). The audit flags that these sentences are missing.
2. **The idea, built up** — prose carrying the mathematics, not mathematics with captions. One
   visual minimum (this clears the 20/34 blind-page debt).
3. **Worked examples** — §4.
4. **Practice** — §5.
5. **`<Proof>`** — the derivation most readers skip. Non-negotiable: the track has zero today.
6. **Recall + links out** — `<Quiz>` per chapter, `<Backlinks>` to the tracks that depend on this
   page.

The reference job is preserved by keeping the statement of each result in a scannable block near the
top, so a mid-sentence link from another track still lands somewhere useful.

---

## 4. Worked examples — 3–4 per concept

### 4.1 What "like a teacher teaching students" means here

The failure mode of every textbook worked example is that it shows *the* solution as if it were
inevitable. A student who could reproduce the steps still cannot start the next problem, because the
part that was never written down is **why that first step**. So the format is built around exposing
the choice:

```
Worked example 2 · technique: linearity of expectation over indicators

  GIVEN     the statement, in full, with nothing assumed from earlier examples
  READ IT   what the words are actually asking for, in one sentence
  PLAN      the technique reached for, and WHY — including one alternative
            that would also work and what it would have cost
  STEPS     each step: the line, then a sentence on what it did and why it
            was legal (which theorem, which condition)
  ANSWER    stated plainly, with units / shape / range
  CHECK     an independent sanity check: a limiting case, a dimension count,
            a symmetry, a rough numeric estimate
  TRAP      the mistake this problem is built to catch
```

The **PLAN** and **CHECK** sections are the teaching. The steps are the least valuable part.

### 4.2 Coverage rule

Across a concept's 3–4 examples: at least one is the plain application of the definition, at least
one is a case where the obvious route is available and wrong (or ruinously slow), and at least one
comes from ML — the actual thing this page exists to support, worked with real numbers.

---

## 5. Practice — 10+ per concept, three bands

### 5.1 The three bands

Named for what the reader has to *do*, never for an exam:

| band | name | what it is | how many |
|---|---|---|---|
| 1 | **Apply** | one idea, direct, numbers small enough to do by hand. Confirms the definition landed. | 4–5 |
| 2 | **Combine** | two ideas at once, or the same idea behind an unfamiliar wrapper. Confirms the idea is portable. | 4–5 |
| 3 | **Outsmart** | the direct computation exists and is too slow. The intended solution is a structural observation that collapses it. | 3–4 |

**Band 3 is the competitive-exam band and the page never says so.** Its defining property is not
"harder arithmetic" — it is that brute force is a trap, and the problem was *designed* so that
noticing one piece of structure turns ten minutes into thirty seconds. That is exactly what a JEE or
GATE question is, and naming the property instead of the exam is both truer and more useful to a
reader who has never heard of either.

*Alternative names considered and rejected: "Easy/Medium/Hard" (says nothing about what changes),
"Tier 1/2/3" (collides with the site's existing depth tiers), "Contest" (names the exam sideways).*
**If "Outsmart" reads badly, the fallback is "Apply · Combine · Collapse".**

### 5.2 Teaching the band-3 manner, not just posing band-3 problems

This is the part of the instruction that is easy to lose. Posing hard problems is not teaching
anyone to solve hard problems. So:

- **Every band-3 problem carries a named technique** from the strand's catalogue (§5.3), shown
  *after* the reader reveals the solution — never before, or the problem is spoiled.
- **Each page's band-3 block opens with "what these are testing"** — two or three sentences on the
  structural habit the block drills.
- **Each strand gets one page of its own** — *How these problems are built* — that teaches the
  catalogue directly: here is the shortcut, here is the brute-force route it replaces, here is how
  to recognise when it applies, here are three problems that all yield to it.
- **Hints are progressive.** Hint 1 names the region ("you do not need the characteristic
  polynomial"). Hint 2 names the technique. The solution does the rest. A reader who takes hint 1
  and finishes has learned more than one who reads the solution.

### 5.3 The technique catalogue (first draft — to be extended as pages are written)

**Linear algebra.** Trace = Σλ and det = Πλ, to get eigenvalues without a characteristic
polynomial · rank by inspection (rank-1 = outer product; rank of A + uvᵀ) · deciding whether Ax = b
is consistent without solving it · symmetry ⇒ real eigenvalues and orthogonal eigenvectors · powers
via diagonalisation · Cayley–Hamilton to reduce a high power · singular values of a rank-1 matrix ·
block/partitioned structure · "what does this matrix *do*" before "what are its entries".

**Calculus & optimisation.** Stationary points vs boundary — always check both · convexity by
composition rules rather than by computing a Hessian · symmetry: guess the symmetric solution, then
verify · Lagrange multipliers where the constraint is the easy part · AM–GM and Cauchy–Schwarz as
optimisation shortcuts · limiting and dimensional sanity checks · differentiating under a sign
rather than expanding.

**Probability.** Linearity of expectation over indicator variables — the highest-yield trick in the
subject, and it does not care about independence · complement counting · conditioning and the tower
property · first-step analysis / recursion · symmetry and exchangeability · E[X²] = Var + mean²
instead of a second integral · Bayes in odds form · memorylessness.

**Concentration.** Choosing the inequality by what you actually know: mean only → Markov; variance →
Chebyshev; bounded → Hoeffding; MGF → Chernoff · inverting a bound to get a sample size · union-bound
budgeting across many events · when the bound is loose and by how much.

**Information theory.** Jensen's inequality · chain rule of entropy · symmetry of mutual information
· bounding via non-negativity of KL · counting arguments for entropy.

### 5.4 Solutions

Every problem — all three bands — carries a **complete** solution, same shape as a worked example
minus the PLAN section (compressed into one line). Not an answer key. Not "similar to Example 2".
The reader is checking their own work against it unsupervised, so a gap in the solution is a dead
end with nobody to ask.

---

## 6. The primitives to build first

Two new components, and they are Phase 0 because 800 problems authored against a format that turns
out to be wrong is the expensive mistake available here.

### `<Worked>`
Statement always visible; solution behind a reveal, so the reader can attempt first (this is the
site's existing predict-first doctrine — PROJECT.md §4 — applied to mathematics). Renders the
GIVEN / READ IT / PLAN / STEPS / ANSWER / CHECK / TRAP structure of §4.1. Numbered per page, and
addressable by anchor so a later page can link to a specific example.

### `<Practice>` / `<Problem>`
A set with a band filter. Each problem: band chip, statement, 1–2 progressive hints, full solution
behind a reveal, technique tag revealed with the solution. Tracks nothing across sessions beyond
what `localStorage` can hold (which problems the reader has opened), and works with storage
unavailable.

Both must be legible in **both themes**, at **375px**, and must not rely on any CSS custom property
that does not exist — `--paper`, never `--bg`. An undefined custom property is dropped silently and
inherits, which cost this project a black-on-black control that `tsc` and every text-based page
check passed (PROJECT.md §14.0).

---

## 7. House rule #1 applies, and it is the hard part

Every published number on this site is reproduced by something in the repo. This plan proposes to
publish **several hundred numeric answers**, hand-written, in a subject where a sign error is
invisible to every check that currently exists. Untreated, that is the largest source of published
errors this site has ever had.

**Therefore:**

- Each page's problems and answers live in a data module (`src/content/math/<page>.ts`), not inline
  in the JSX.
- `scripts/math_check.py` recomputes every numeric answer **independently** — sympy or numpy, keyed
  by problem id, written without looking at the published solution — and fails on any mismatch.
- A new `check-pages.js` rule (**R3**) refuses a `<Worked>` or `<Practice>` that publishes numbers
  without naming its verifying script, the same way R1 guards `<CodeOutput>`.
- Symbolic answers get the same treatment where sympy can do it (`simplify(published - computed) ==
  0`), and where it cannot, the solution is marked as unverified in the source so the gap is known.

This is not optional polish. A worked example with a wrong answer teaches a wrong method to someone
who cannot tell.

---

## 8. Scope, honestly

| | pages now | pages after | worked examples | problems |
|---|---:|---:|---:|---:|
| Math foundations | 34 | ~70 | ~240 | ~800 |
| Learning theory | 20 | ~26 | ~90 | ~300 |
| Model selection | 16 | ~20 | ~70 | ~230 |

**That is roughly 400 worked examples and 1,300 problems with full solutions.** It is by a wide
margin the largest single body of work ever planned for this site — larger than the entire neural
networks family. It cannot be done in a pass and should not be attempted as one.

### Phasing

- **Phase 0 — the format.** Build `<Worked>` and `<Practice>`, the verification harness, and **one
  pilot page** rebuilt to the complete standard. Proposed pilot: **Expectation & linearity**, split
  out of *Expectation & variance* — the audit names it the highest-leverage page in the chapter
  (bias–variance, prediction intervals and the forests bound all re-derive fragments of it), and
  band-3 probability has the richest technique catalogue, so the format gets its hardest test
  immediately. Review the pilot before writing anything else.
- **Phase 1 — Linear algebra** (10 → ~20 pages), plus the strand's *How these problems are built*
  page.
- **Phase 2 — Probability** (8 → ~16).
- **Phase 3 — Calculus & optimisation** (8 → ~16). Note this strand is entangled with the missing
  **Optimization track** (§0.3 #9): gradient descent is taught three times on this site and
  canonically nowhere. Decide that boundary before writing Phase 3, not during.
- **Phase 4 — Concentration** (4 → ~8) and **Information theory** (5 → ~10).
- **Phase 5 — Learning theory and Model selection.**

Each phase ships complete pages, never partial ones: a page with worked examples and no practice set
is worse than today's page, because it promises a shape it does not keep.

---

## 9. Guardrails

- **Teach before drilling.** The concept section must stand on its own. If the problems are the only
  reason the page works, the page is not finished.
- **No decorative problems.** Every problem drills something nameable. If the technique tag is hard
  to write, the problem is filler.
- **Worked examples are decision records**, not transcripts. The audit's whole complaint about this
  track is that it shows results without showing choices.
- **Verify before writing the prose** (`[[verify-the-effect-before-writing-the-prose]]`). Applies
  here as: compute the answer first, then write the solution around it. Never the reverse.
- **The reference job survives.** Other tracks link into these pages mid-sentence. A rebuilt page
  that buries its statement under 2,000 words of build-up has broken thirty inbound links.

---

## 11. Phase 0 shipped — the pilot page (2026-09-15)

**`math-foundations/derivatives` is rebuilt to this standard and is the reference implementation.**
The pilot was the user's choice, not the *Expectation and linearity* page proposed in §8; it turned
out to be a good one, because the derivative has a clean band-3 catalogue and a natural runnable
demonstration.

**What shipped**

| | before | after |
|---|---:|---:|
| words (page file) | 350 | 2,561 + ~2,000 in the content module |
| worked examples | 0 | 4 |
| problems with full solutions | 0 | 13 (5 Apply · 4 Combine · 4 Outsmart) |
| `<Proof>` blocks | 0 | 1 |
| runnable code | 0 | 1 (the first in this track) |

New primitives: `src/components/Worked.tsx` and `src/components/Practice.tsx`. Content:
`src/content/math/derivatives.tsx`. Verification: `scripts/math_check.py` plus a new
`check-pages.js` rule **R3**. New Pyodide preamble `CALCULUS_SETUP` (deliberately bare — numpy and
`math`, nothing that would do the calculus for the reader).

**The verification harness works and has been proved to work.** 35 published answers, every one
recomputed independently by sympy from the *statement* — and where the page takes a shortcut, the
script deliberately takes the long way round (it expands the degree-10 product, evaluates the limit
as a limit, and brute-forces the absolute-value minimum on a grid of 401 points). Both new checks
were tested by breaking them on purpose: flipping two signs in the content module produced two
precise failures, and removing the page from the `PAGES` map fired R3. A check that has never
failed is not known to work.

**Format decisions that held up**
- `PLAN` and `CHECK` are where the teaching is, exactly as §4.1 predicted. Several checks came out
  better than the solutions: completing the square instead of differentiating, the median argument
  for a sum of absolute values, the closed form re-derived rather than recalled.
- The `TRAP` section earns its place — four of the four worked examples had a real one to name.
- Progressive hints work best when hint 1 is *permission to stop brute-forcing* ("expanding this is
  about forty minutes; that point is special") rather than a nudge toward the answer.
- The band-3 catalogue page promised in §5.2 is not needed per strand after all when the page
  itself closes with a **"what the third band is testing"** section gathering the structural facts.
  Cheaper, and it sits where the reader just met the problems.

**Format decisions still open**
- **Band names** stay working-titles: Apply · Combine · Outsmart. They read fine in situ.
- **13 problems per concept × ~70 pages is ~900 problems.** The pilot took a full working session
  for one page. That is the number to plan against, and it is the argument for cutting scope
  somewhere — probably by accepting fewer band-1 problems on pages where the concept is easy.

**Three implementation traps, all of which cost time**
1. **An array of bare `<>` fragments warns about missing keys** even when each is rendered inside a
   keyed wrapper. `hints: [<span key="h1">…</span>]`, not `hints: [<>…</>]`. 136 console warnings
   before it was fixed.
2. **sympify() mints its own symbols.** `sp.sympify("12*x**2")` produces `Symbol("x")` with no
   assumptions, which does not cancel against `Symbol("x", real=True)` — every symbolic answer
   "fails" while being perfectly correct. Parse with `locals=` pointing at the script's own symbols.
3. **`.katex-display.scrollWidth` is not the width of the equation.** KaTeX embeds the LaTeX source
   in a hidden MathML `<annotation>`, which inflates `scrollWidth` in proportion to how long the
   source string is — so the *longest-source* equation looks like the worst overflow even after it
   has been stacked onto four lines. Measure `.katex-html`'s bounding box against the scroll
   wrapper's `clientWidth` instead. Real overflow does happen (one equation was visibly clipped
   before being split with `\begin{aligned}`), so the measurement matters. Note also that this
   KaTeX build ignores `\\[2pt]` and prints it as literal text.

## 10. Open questions for the next session

1. **Band-3 naming** — "Outsmart" shipped on the pilot and reads well; "Collapse" is still the
   fallback. Worth confirming before a second page, since it appears on every practice block.
   *(§11 has the pilot's verdict.)*
2. **The Optimization track boundary** (Phase 3). Unresolved since the audit.
3. **Are answers hidden by default?** Proposed yes (predict-first doctrine). A reader who wants a
   reference sheet is served by the statement block at the top of the page instead.
4. **Does anything here reach Tier-1 tracks?** The instruction named math foundations and theory.
   Linear regression and logistic regression would obviously benefit, and are explicitly out of
   scope until the foundations are done.
