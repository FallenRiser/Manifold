# Manifold — Project Handoff & Master Plan

> Read this first. It is the single source of truth for what Manifold is, what's built, what's
> planned, and every locked decision about content voice, UI, and tech. Pair it with
> [`docs/curriculum-map.md`](./curriculum-map.md) (the full curriculum/IA).
> Last updated: 2026-06-21.

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

---

## 5. UI / design system — LOCKED

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
