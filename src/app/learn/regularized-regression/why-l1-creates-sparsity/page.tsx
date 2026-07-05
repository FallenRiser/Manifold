import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Why L1 creates sparsity — Manifold",
  description:
    "Two complementary explanations for the Lasso's defining trick — the diamond's corners (geometry) and soft-thresholding (algebra) — both showing why L1 sets coefficients to exactly zero and L2 never does.",
};

// soft-threshold vs ridge-shrink, as a function of the OLS value ρ
const W = 300, H = 200, mid = 100, sc = 9;
const sx = (v: number) => Math.round((mid + v * sc) * 100) / 100;
const sy = (v: number) => Math.round((H / 2 - v * sc) * 100) / 100;
const LAM = 4;
const soft = (r: number) => Math.sign(r) * Math.max(Math.abs(r) - LAM, 0);
const ridge = (r: number) => r / (1 + LAM / 4);
const rs = Array.from({ length: 81 }, (_, i) => -10 + i * 0.25);

export default function WhyL1Page() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Go deeper", color: "var(--c-metrics)" }]}
        time="about 7 minutes"
        title={<>Why L1 creates sparsity</>}
        intro={<>
          This is the conceptual centre of the whole track. Two explanations — one geometric, one algebraic —
        both show the same thing: the L1 penalty makes exact zeros inevitable, and the L2 penalty makes them
        impossible.
        </>}
      />

      <div className="lesson">
        <h2>Explanation 1 — the geometry of the corner</h2>
        <p>
          Recall the constraint view: minimise the loss subject to the coefficients living inside a budget
          region. For Lasso that region is the L1 ball — a <strong>diamond</strong> whose corners sit exactly
          on the axes. The solution is where the expanding elliptical loss contours first touch the diamond.
        </p>
        <p>
          Because the diamond&rsquo;s corners <em>stick out</em> the furthest, a contour sweeping inward is highly
          likely to hit a corner first — and a corner lies on an axis, where some coordinate is exactly zero.
          Ridge&rsquo;s region is a smooth circle with no corners, so contours touch it on a curved edge, at a point
          where every coordinate is small but nonzero. <strong>Corners make zeros; smoothness forbids them.</strong>{" "}
          (The two-panel figure on the penalty-vs-constraint page shows this directly.)
        </p>

        <h2>Explanation 2 — soft-thresholding</h2>
        <p>
          The algebra makes it exact. For a single standardized feature with OLS coefficient{" "}
          <M>{String.raw`\rho`}</M>, the two penalties give:
        </p>
        <MathBlock>{String.raw`\beta_{\text{ridge}} = \frac{\rho}{1+\lambda}, \qquad \beta_{\text{lasso}} = \operatorname{sign}(\rho)\,\big(|\rho| - \lambda\big)_{+}`}</MathBlock>
        <p>
          Ridge <em>multiplies</em> <M>{String.raw`\rho`}</M> by a factor less than one — always shrinking, never
          reaching zero. Lasso <em>subtracts</em> a constant <M>{String.raw`\lambda`}</M> and clips at zero (the{" "}
          <M>{String.raw`(\cdot)_+`}</M> means &ldquo;max with 0&rdquo;). So whenever{" "}
          <M>{String.raw`|\rho| \le \lambda`}</M>, the Lasso coefficient is <strong>exactly zero</strong>. This
          operation is called <strong>soft-thresholding</strong>, and it&rsquo;s the engine inside every Lasso
          solver.
        </p>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, margin: "1.2rem 0" }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
            <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            {/* axes */}
            <line x1={10} y1={H / 2} x2={W - 10} y2={H / 2} stroke="var(--border-strong)" strokeWidth={0.8} />
            <line x1={mid} y1={10} x2={mid} y2={H - 10} stroke="var(--border-strong)" strokeWidth={0.8} />
            {/* identity (OLS) */}
            <polyline points={rs.map((r) => `${sx(r)},${sy(r)}`).join(" ")} fill="none" stroke="var(--faint)" strokeWidth={1} strokeDasharray="3 3" />
            {/* ridge */}
            <polyline points={rs.map((r) => `${sx(r)},${sy(ridge(r))}`).join(" ")} fill="none" stroke="var(--c-classification)" strokeWidth={2} />
            {/* lasso (soft-threshold) — flat zero region in the middle */}
            <polyline points={rs.map((r) => `${sx(r)},${sy(soft(r))}`).join(" ")} fill="none" stroke="var(--c-regression)" strokeWidth={2.6} />
            <text x={W - 12} y={H / 2 - 4} fontSize={8} fill="var(--faint)" textAnchor="end">ρ (OLS coef)</text>
            <text x={sx(6)} y={sy(soft(6)) - 4} fontSize={8.5} fill="var(--c-regression)">lasso</text>
            <text x={sx(7)} y={sy(ridge(7)) + 10} fontSize={8.5} fill="var(--c-classification)">ridge</text>
            <text x={mid} y={H - 4} fontSize={8.5} fill="var(--c-regression)" textAnchor="middle">flat ⇒ β = 0 when |ρ| ≤ λ</text>
          </svg>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
            Fitted coefficient vs. the OLS coefficient ρ. Ridge (pink) is a line through the origin — always
            nonzero for nonzero ρ. Lasso (blue) is <strong>flat at zero</strong> across a whole band around the
            origin, then runs parallel to OLS, offset by λ. That flat dead-zone is sparsity.
          </div>
        </div>

        <Callout color="var(--c-regression)" title={<>The unifying idea: the penalty&rsquo;s slope at zero</>}>
          Both explanations come down to one fact. The L1 penalty <M>{String.raw`|\beta|`}</M> has a{" "}
            <strong>kink</strong> at zero — a nonzero slope (a corner) — so there&rsquo;s a finite force holding a
            coefficient at exactly zero until the data pushes hard enough to overcome it. The L2 penalty{" "}
            <M>{String.raw`\beta^2`}</M> is smooth with <em>zero</em> slope at the origin, so the slightest data
            signal nudges the coefficient off zero. Sparsity is precisely the signature of a non-smooth penalty.
        </Callout>

        <h2>Soft-thresholding in code</h2>
        <CodeBlock setup={REGRESSION_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/regularized-regression/the-lasso", label: <>← The Lasso</> }} next={{ href: "/learn/regularized-regression/the-regularization-path", label: <>Next up · The regularization path →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def soft_threshold(rho, lam):
    return np.sign(rho) * np.maximum(np.abs(rho) - lam, 0.0)

rho = np.array([-6, -3, -1, 0.5, 2, 5])
print("ridge:", rho / (1 + 1.0))            # all nonzero
print("lasso:", soft_threshold(rho, 2.0))   # |rho|<=2 -> exactly 0`;

const codeLib = `import numpy as np
from sklearn.linear_model import Lasso, Ridge

lasso = Lasso(alpha=0.3).fit(X, y)
ridge = Ridge(alpha=0.3).fit(X, y)
print("lasso zeros:", (lasso.coef_ == 0).sum())   # > 0
print("ridge zeros:", (ridge.coef_ == 0).sum())   # 0`;




