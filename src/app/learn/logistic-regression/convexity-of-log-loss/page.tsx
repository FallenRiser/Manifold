import { M, MathBlock } from "@/components/Math";
import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-classification)";

// self-contained loss-landscape sketch: a single smooth bowl (convex, log loss)
// vs a bumpy multi-minimum curve (non-convex, squared error through the sigmoid).
function Landscape({ convex }: { convex: boolean }) {
  const W = 300, H = 150, PAD = 16;
  const x0 = PAD, x1 = W - PAD;
  const f = (t: number) => {
    // t in [0,1] across the width
    if (convex) return 0.15 + 1.4 * (t - 0.5) ** 2; // single bowl
    // non-convex: two dips
    return 0.42 + 0.5 * (t - 0.5) ** 2 - 0.34 * Math.cos(9.2 * t);
  };
  const pts = Array.from({ length: 121 }, (_, i) => {
    const t = i / 120;
    const x = x0 + t * (x1 - x0);
    const y = PAD + (1 - f(t)) * (H - 2 * PAD - 14) + 8;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  // mark the global (and, for non-convex, a false local) minimum by scanning
  let gi = 0, gv = Infinity, li = 0, lv = Infinity;
  for (let i = 0; i <= 120; i++) {
    const t = i / 120, v = f(t);
    if (v < gv) { gv = v; gi = i; }
    if (!convex && t < 0.4 && v < lv) { lv = v; li = i; }
  }
  const px = (i: number) => x0 + (i / 120) * (x1 - x0);
  const py = (i: number) => PAD + (1 - f(i / 120)) * (H - 2 * PAD - 14) + 8;
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 12, padding: 12, flex: 1, minWidth: 240 }}>
      <div className="font-display" style={{ fontSize: 12.5, fontWeight: 500, color: convex ? "var(--good)" : "var(--bad)", marginBottom: 6 }}>
        {convex ? "Log loss — convex" : "Squared error ∘ sigmoid — not convex"}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border)" />
        <polyline points={pts} fill="none" stroke={convex ? "var(--good)" : "var(--bad)"} strokeWidth={2.2} />
        {!convex && (
          <>
            <circle cx={px(li)} cy={py(li)} r={4} fill="var(--warn)" />
            <text x={px(li)} y={py(li) - 8} fontSize={8.5} fill="var(--warn)" textAnchor="middle">local trap</text>
          </>
        )}
        <circle cx={px(gi)} cy={py(gi)} r={4.5} fill={convex ? "var(--good)" : "var(--bad)"} stroke="var(--surface)" strokeWidth={1.5} />
        <text x={px(gi)} y={py(gi) + 15} fontSize={8.5} fill="var(--muted)" textAnchor="middle">global min</text>
        <text x={W / 2} y={H - 4} fontSize={9} fill="var(--faint)" textAnchor="middle">weight →</text>
      </svg>
    </div>
  );
}

export const metadata = {
  title: "Convexity of the log-loss objective — Manifold",
  description: "Why gradient descent on logistic regression always lands at the one right answer: log loss is convex in the weights, so there's a single global minimum and no local traps to fear.",
};

export default function ConvexityPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: ACCENT }, { label: "Theory", color: "var(--c-metrics)" }]}
        time="about 9 minutes"
        title={<>Convexity of the log-loss objective</>}
        intro={<>
          The beautiful-gradient page promised the loop stops &ldquo;for the boring, good reason.&rdquo;
          This is that reason, made rigorous. Log loss is convex in the weights — one bowl, one bottom — so
          any downhill path reaches the same global optimum, regardless of where it starts.
        </>}
      />

      <div className="lesson">
        <h2>What convexity buys you</h2>
        <p>
          A function is <strong>convex</strong> if the line segment between any two points on its graph lies
          on or above the graph — a single bowl with no separate valleys. That one geometric property has
          enormous practical payoff for optimisation:
        </p>
        <ul>
          <li>There is <strong>one global minimum</strong> (or a connected flat set of them) — no local minima to get stuck in.</li>
          <li><strong>Initialisation doesn&rsquo;t matter</strong>: start anywhere, go downhill, arrive at the same place.</li>
          <li>A zero gradient <strong>guarantees</strong> the global optimum — for non-convex losses it only means &ldquo;some flat spot.&rdquo;</li>
          <li>Convergence is well understood, so the learning-rate and stopping intuitions from linear regression transfer intact.</li>
        </ul>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "1.5rem 0" }}>
          <Landscape convex />
          <Landscape convex={false} />
        </div>
        <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: "-0.6rem" }}>
          Left: log loss — gradient descent slides to the one bottom from anywhere. Right: what you&rsquo;d get
          by naïvely putting squared error <em>around</em> the sigmoid — a bumpy surface where a run can settle
          into a local trap and report a worse model as &ldquo;done.&rdquo;
        </p>

        <h2>The proof, in one Hessian</h2>
        <p>
          Convexity of a twice-differentiable function is equivalent to its <strong>Hessian</strong> (the matrix
          of second derivatives) being positive semidefinite everywhere. For logistic regression&rsquo;s log
          loss the Hessian has a clean closed form. With <M>{String.raw`p_i = \sigma(w^\top x_i)`}</M>:
        </p>
        <MathBlock>{String.raw`\nabla^2_w L = \frac{1}{n}\sum_{i=1}^{n} p_i(1 - p_i)\, x_i x_i^\top = \frac{1}{n} X^\top S X, \quad S = \mathrm{diag}\big(p_i(1-p_i)\big).`}</MathBlock>
        <p>
          Now the argument. Each weight <M>{String.raw`p_i(1-p_i)`}</M> is a probability times one minus itself,
          so it is <strong>always <M>{String.raw`\ge 0`}</M></strong>. For any direction <M>v</M>,
        </p>
        <MathBlock>{String.raw`v^\top \big(X^\top S X\big) v = \sum_{i=1}^{n} p_i(1-p_i)\,(x_i^\top v)^2 \;\ge\; 0,`}</MathBlock>
        <p>
          because it is a sum of non-negative weights times squares. A quadratic form that is never negative is
          exactly the definition of a positive-semidefinite Hessian — so <M>L</M> is convex, everywhere, for any
          data. Gradient descent cannot get stuck, because there is nowhere to get stuck.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>The Hessian factor <M>{String.raw`p_i(1-p_i)`}</M> is largest at <M>{String.raw`p_i = 0.5`}</M> and near zero when <M>{String.raw`p_i \approx 0`}</M> or <M>1</M>. What does that say about where the surface is most sharply curved?</>}
          options={[
            "Steepest curvature comes from the uncertain, near-boundary points",
            "Steepest curvature comes from the confidently-classified points",
            "Curvature is the same everywhere",
          ]}
          nudge={<>Think about which examples have <M>{String.raw`p_i`}</M> near 0.5 versus near the extremes.</>}
        />

        <p>
          That prediction is worth internalising: the confidently-classified points (<M>{String.raw`p_i`}</M> near
          0 or 1) contribute almost nothing to the curvature, while the uncertain points near the decision
          boundary (<M>{String.raw`p_i \approx 0.5`}</M>) shape the bowl. The model is, quite literally, most
          sensitive to the examples it&rsquo;s least sure about — the same points that define the boundary.
        </p>

        <Callout color={ACCENT} title={<>The one caveat: convex doesn&rsquo;t mean bounded</>}>
          Convexity guarantees no <em>local</em> traps, not that a minimum exists at finite weights. If the
          classes are perfectly separable, the surface is a convex ramp that keeps descending as{" "}
          <M>{String.raw`\|w\| \to \infty`}</M> — the model buys endless confidence for free and the weights run
          away. The bowl is still a bowl; its bottom is just at infinity. L2 regularization adds a term that
          curls the ramp back into a true bowl with a finite minimum (the perfect-separation page tells that
          story from the practice side).
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "Why does convexity mean initialisation doesn't affect the final logistic-regression weights?",
              options: [
                "Because there's a single global minimum, so every downhill path reaches the same point",
                "Because the gradient is always zero",
                "Because the weights start at zero anyway",
              ],
              answer: 0,
              explain: "A convex objective has one global minimum (or a connected flat set). Descent from any starting point converges there — unlike non-convex losses, where the basin you land in depends on where you began.",
            },
            {
              q: "The Hessian X^T S X is positive semidefinite because…",
              options: [
                "X is always invertible",
                "Each weight p(1−p) ≥ 0, so v^T X^T S X v is a sum of non-negative terms",
                "The sigmoid is monotonic",
              ],
              answer: 1,
              explain: "p(1−p) is a probability times its complement, hence ≥ 0. The quadratic form becomes a sum of non-negative weights times squares, which can't be negative — the definition of PSD.",
            },
            {
              q: "If squared error is wrapped around the sigmoid instead of using log loss, what can go wrong?",
              options: [
                "Nothing — it's equivalent",
                "The objective becomes non-convex, so gradient descent can settle in a local minimum",
                "The gradient becomes undefined",
              ],
              answer: 1,
              explain: "Squared error through the sigmoid is non-convex in the weights, introducing local minima. Log loss (the MLE choice) keeps the objective convex — a major reason it's the standard loss.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/logistic-regression/maximum-likelihood", label: <>← Maximum likelihood</> }}
          next={{ href: "/learn/logistic-regression/logistic-regression-as-a-glm", label: <>Next up · Logistic regression as a GLM →</> }}
        />
      </div>
    </article>
  );
}
