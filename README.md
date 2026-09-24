# Manifold

An interactive machine-learning curriculum: **34 tracks, 4 capstones, 760 built pages**, every one of
them a single idea taught with prose, a visual, a runnable code block and something to poke at.

The site is a static Next.js export. Python on the lesson pages runs in the reader's own browser via
Pyodide, so the Run button on a page executes the same code the page is teaching — not a recording of
it.

---

## Getting it running

```bash
npm install
npm run dev
```

**The dev server lives at `http://localhost:3000/Manifold/`, not `http://localhost:3000/`.**
`next.config.mjs` sets `basePath: '/Manifold'`, so a bare `localhost:3000` 404s and looks exactly
like a wedged dev server. Every route needs the prefix: `/Manifold/learn/k-means`, `/Manifold/map`.

> **Never run `npm run build` while the dev server is running.** They share `.next/`, and the build
> clobbers the dev server's webpack chunks — the symptom is a runtime `Cannot find module './611.js'`.
> Recovering means stopping dev, deleting `.next/`, and restarting. Verify changes through the
> running dev server.

```bash
npm run build     # static export to out/ (stop dev first)
npx tsc --noEmit  # type-check
```

---

## The house rules

These are the two that shape everything else in the repo.

**1. Every published number is reproduced by a script in this repo.** If a page prints `0.865`, a
file in `scripts/` recomputes it. There are 34 Python scripts — mostly per-track case files
(`boosting_cases.py`, `kmeans_cases.py`, `planning_cases.py`, …) plus the trainers behind the
env-building worlds — and they are not illustrations. Several of them have caught the pages being
wrong. A `<CodeOutput>` panel with no code block above it must name the script that produced it,
with `source="scripts/....py"`.

**2. No page ships with nothing to look at.** Prose alone is the failure mode this codebase keeps
correcting; a static SSR SVG counts, and is usually the right answer.

Both are checked, not just promised:

```bash
node scripts/check-pages.js   # R1: unattached <CodeOutput> must carry source=
                              # R2: every source= must point at a file that exists
```

```bash
node scripts/inventory.js     # -> results/inventory.json
```

`inventory.js` parses every track outline, resolves each page to its `page.tsx`, and counts prose
words, rendered figures and labs, inline `<svg>`, code blocks, proofs, prompts and quizzes. It is the
mechanical half of the depth audit. **Re-run it rather than trusting any number written down about
the site** — as of the last run: 760 built pages, **264 (35%) with no visual**, 21 of 34 tracks with
zero `<Proof>`.

---

## Layout

```
src/
  app/learn/<track>/<page>/page.tsx   one page = one idea
  app/map/                            the curriculum atlas
  lib/<name>Track.ts                  34 track outlines (chapters -> pages -> hrefs)
  lib/runtimeSetup.ts                 17 per-track Pyodide preambles (GRIDWORLD_SETUP, WILDFIRE_SETUP, …)
  lib/siteMap.ts, catalog.ts          navigation and search
  components/lesson.tsx               LessonHeader, Callout, Proof, PrevNext
  components/labs/                    161 interactive labs
  components/figures/                 SSR SVG figures, shared and per-track
  components/fire/  sail/             the wildfire and sailing worlds (env-building track)
  components/capstone/                capstone-specific panels and pedagogy primitives
scripts/                              measurement scripts + the two linters
results/                              their JSON output, checked in
docs/                                 the real documentation (below)
```

A lesson page imports its primitives from `components/lesson`, its maths from `components/Math`
(KaTeX), and its runnable code from `CodeBlock` + the relevant `*_SETUP` preamble. The preamble is
what makes the Run button and the measurement script execute identical code.

---

## Documentation

The docs are the project's memory; read them before planning any work.

| file | what it is |
|---|---|
| **`docs/PROJECT.md`** | The handoff. Status, roadmap, locked content/UI/tech decisions, workflow gotchas. **Start at §12** (style philosophy, craft rules, the three-pass review loop); §10 and §11 hold the binding specifics. §14 tracks the audit backlog. |
| **`docs/depth-audit.md`** | Chapter-by-chapter backlog for all 34 tracks and 4 capstones — depth, text, new pages, labs, visuals. **§0.5 is the live pending register**: what is done, what is not, and the number attached to each. |
| **`docs/curriculum-map.md`** | The full curriculum and information architecture. |
| `docs/env-building-plan.md`, `rl-capstone-plan.md`, `neo-capstone-plan.md`, `lies-of-p-capstone-plan.md`, `neuroevolution-plan.md` | Per-project specs, including work not yet built. |

---

## Conventions worth knowing before editing

- **Files are CRLF.** Scripted edits must normalise on read and restore on write.
- **JSX eats a newline between prose and an inline tag.** A line ending in `</em>` followed by
  a line starting with a word renders with no space between them — "previoussweep". The fix is
  a trailing `{" "}` on the earlier line. About 65 have been fixed so far and the trap is still
  live, so check the *rendered* page, not the source.
- **Colours come from CSS custom properties**, never hex — `var(--c-rl)`, `var(--ink)`,
  `color-mix(in srgb, var(--x) 20%, var(--panel))`. Pages render in both themes; check both.
- **Size a figure from its content.** Every clipped-SVG defect found so far has been a fixed box
  meeting a label, a legend or a tick that did not fit — and every one of them was a constant that
  happened to suit the first data put through it.
- **An undefined CSS custom property fails silently.** `var(--bg)` does not exist (it is `--paper`),
  and `color: var(--bg)` simply inherits instead — black text on a black chip, invisible to `tsc`
  and to any text-based page check. Check computed colours, not just markup.
- **`<Proof>`, `<PredictPrompt>`, `<Quiz>`, `<DecisionPoint>`** are the teaching primitives.
  Doctrine: a PredictPrompt before every measured result, a Quiz once per chapter on its last page.

---

## Status

Built and live: regression, classification, trees, clustering (k-Means), dimensionality reduction
(PCA), the six neural-network tracks, five reinforcement-learning tracks, the cross-cutting pillars
(data workflow, evaluation, model selection, learning theory, math foundations), and three of four
capstones.

In progress: the env-building track (27 of 40 pages — World 1 complete, World 2 awaiting its
DQN-vs-PPO race, World 3 unbuilt) and the Lies-of-P field-report capstone (1 of 22; results pages
stay href-less until the model exists).

Not built: the Optimization foundation, policy gradients / actor–critic / PPO, SVM, stacking,
GMM + EM, DBSCAN, hierarchical clustering, t-SNE & UMAP, CNNs. `docs/depth-audit.md` Part five
argues the order.
