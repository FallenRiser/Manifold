import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Local weighted regression — Manifold",
  description:
    "Distance-weighted k-NN fits a local constant. Fit a local line instead and you get LOESS — the same neighbourhood idea, but it follows trends and shakes off the edge bias that flattens plain k-NN.",
};

// Local-constant (Nadaraya–Watson, weighted average) vs local-linear (LOESS)
// on the same noisy 1-D data. Weighted least squares is solved in closed form at
// each grid point; all coordinates rounded at module scope.
const N = 24;
const XS = Array.from({ length: N }, (_, i) => (i / (N - 1)) * 100);
const targetY = (x: number) => 50 + 28 * Math.sin((x / 100) * Math.PI * 1.6);
const PTS = XS.map((x, i) => ({ x, y: targetY(x) + ((i * 37) % 17 - 8) }));
const GRID = Array.from({ length: 101 }, (_, i) => i);
const ELL = 12;
const wOf = (xi: number, gx: number) => Math.exp(-((xi - gx) ** 2) / (2 * ELL * ELL));

// local constant: weighted average
const localConst = (gx: number) => {
  let num = 0, den = 0;
  for (const p of PTS) { const w = wOf(p.x, gx); num += w * p.y; den += w; }
  return num / den;
};
// local linear: weighted least-squares line, evaluated at gx
const localLinear = (gx: number) => {
  let Sw = 0, Swx = 0, Swy = 0, Swxx = 0, Swxy = 0;
  for (const p of PTS) {
    const w = wOf(p.x, gx);
    Sw += w; Swx += w * p.x; Swy += w * p.y; Swxx += w * p.x * p.x; Swxy += w * p.x * p.y;
  }
  const denom = Sw * Swxx - Swx * Swx;
  if (Math.abs(denom) < 1e-9) return Swy / Sw;
  const b = (Sw * Swxy - Swx * Swy) / denom;
  const a = (Swy - b * Swx) / Sw;
  return a + b * gx;
};
const CONST = GRID.map(localConst);
const LIN = GRID.map(localLinear);

const W = 340, H = 190;
const sx = (x: number) => Math.round((22 + (x / 100) * (W - 34)) * 100) / 100;
const sy = (y: number) => Math.round((H - 16 - (y / 100) * (H - 30)) * 100) / 100;

export default function LocalWeightedRegressionPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Regression", color: "var(--c-regression)" }, { label: "Tier 2 · other uses", color: "var(--c-classification)" }]}
        time="about 8 minutes"
        title={<>Local weighted regression</>}
        intro={<>
          Distance-weighted k-NN fits a local <em>constant</em> — a weighted average. Fit a local <em>line</em>
        through the same neighbours and you get LOESS: it follows the trend, and crucially it stops flattening
        at the edges of the data.
        </>}
      />

      <div className="lesson">
        <h2>From local constant to local line</h2>
        <p>
          Weighted k-NN regression answers &ldquo;what&rsquo;s the typical <M>{String.raw`y`}</M> around here?&rdquo;
          with a weighted <em>average</em> — a flat local model. <strong>Locally weighted regression</strong>
          (LOESS / LOWESS) asks a slightly richer question: fit a small <em>line</em> (or low-degree polynomial)
          to the nearby points, weighting each by closeness, and read off its value at the query. Same
          neighbourhood idea, one degree more flexible.
        </p>
        <p>For each query <M>{String.raw`x_0`}</M> you solve a tiny <strong>weighted least squares</strong> problem:</p>
        <MathBlock>{String.raw`\min_{a,\,b} \sum_{i} w_i(x_0)\,\big(y_i - (a + b\,x_i)\big)^2, \qquad w_i(x_0) = \exp\!\left(-\frac{(x_i - x_0)^2}{2\ell^2}\right)`}</MathBlock>
        <p>
          then predict <M>{String.raw`\hat{y}(x_0) = a + b\,x_0`}</M>. The bandwidth <M>{String.raw`\ell`}</M>
          plays k&rsquo;s old role — the smoothing knob. Refit at every query point, and the local lines knit
          together into one smooth curve.
        </p>

        <figure style={{ margin: "1.4rem 0", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="A local-constant weighted average flattens near the edges of the data, while a local-linear LOESS fit keeps following the trend to the boundary.">
            <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            <polyline points={GRID.map((gx, i) => `${sx(gx)},${sy(CONST[i])}`).join(" ")} fill="none" stroke="var(--faint)" strokeWidth={1.8} strokeDasharray="4 3" />
            <polyline points={GRID.map((gx, i) => `${sx(gx)},${sy(LIN[i])}`).join(" ")} fill="none" stroke="var(--c-regression)" strokeWidth={2.4} />
            {PTS.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={2.8} fill="var(--c-classification)" fillOpacity={0.6} />)}
            <text x={sx(4)} y={sy(CONST[4]) + 13} fontSize={8.5} fill="var(--faint)">local constant (flattens)</text>
            <text x={sx(96)} y={sy(LIN[96]) - 7} fontSize={8.5} fill="var(--c-regression)" textAnchor="end">local linear / LOESS</text>
          </svg>
          <figcaption style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8, lineHeight: 1.55 }}>
            Both use the same Gaussian neighbourhood weights. The dashed local-constant fit sags toward flat at
            the boundaries (where all nearby points sit on one side); the local-linear fit uses the local slope
            to keep tracking the trend right to the edge.
          </figcaption>
        </figure>

        <h2>Why the local line fixes edge bias</h2>
        <p>
          At the boundary of the data, a weighted <em>average</em> is pulled inward — every neighbour is on the
          interior side, so the mean lags behind a rising or falling trend. A local <em>line</em> estimates the
          slope from those same one-sided neighbours and extends it, cancelling that first-order bias. This is
          the classic result that <strong>local linear smoothing has lower boundary bias than local constant
          (kernel) smoothing</strong> — the main reason LOESS is preferred in practice.
        </p>

        <Callout color="var(--c-regression)" title={<>The kernel-regression family, in one line</>}>
          It&rsquo;s all the same recipe at different polynomial degrees. <strong>Degree 0</strong> (local
            constant) is <em>Nadaraya–Watson</em> kernel regression — literally distance-weighted k-NN.{" "}
            <strong>Degree 1</strong> (local linear) is standard <em>LOESS</em>. <strong>Degree 2</strong> adds
            local curvature. Higher degree lowers bias but raises variance — the same trade-off as everywhere,
            now inside each neighbourhood. Distance-weighted k-NN regression from the{" "}
            <Link href="/learn/k-nearest-neighbors/distance-weighted-voting" style={inlineLink}>weighting page</Link>{" "}
            is simply the degree-0 member.
        </Callout>

        <h2>Practical notes</h2>
        <ul style={ul}>
          <li><strong>Bandwidth is everything.</strong> Too small → wiggly and noisy; too large → oversmoothed. Tune it by cross-validation, just like k.</li>
          <li><strong>Cost.</strong> A fresh weighted fit per query makes LOESS even more query-heavy than plain k-NN — great for exploratory 1–2D smoothing, less so for high-throughput serving.</li>
          <li><strong>Robust LOESS</strong> down-weights outliers over a few iterations, so a handful of bad points don&rsquo;t bend the local lines.</li>
          <li><strong>Best in low dimensions.</strong> Like all neighbourhood methods it meets the curse of dimensionality; it&rsquo;s most useful for 1–2 feature smoothing and trend curves.</li>
        </ul>

        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "How does LOESS differ from distance-weighted k-NN regression?",
              options: ["It fits a local line (degree 1) instead of a local constant (weighted average)", "It uses no distance weighting", "It extrapolates globally"],
              answer: 0,
              explain: "Distance-weighted k-NN is the degree-0 (local constant, Nadaraya–Watson) case. LOESS fits a local weighted line, adding a local slope.",
            },
            {
              q: "Why does local linear regression reduce bias at the edges of the data?",
              options: ["It estimates the local slope and extends it, instead of averaging one-sided neighbours flat", "It ignores boundary points", "It uses a larger bandwidth there"],
              answer: 0,
              explain: "A weighted average at the boundary is dragged inward; a local line reads the slope off the same neighbours and follows the trend, cancelling the first-order bias.",
            },
            {
              q: "In local weighted regression, the bandwidth ℓ plays the role of…",
              options: ["The smoothing knob — analogous to k in k-NN", "The number of output classes", "The polynomial degree"],
              answer: 0,
              explain: "Bandwidth sets how far influence reaches, controlling the bias–variance trade-off exactly as k does for k-NN. Tune it by cross-validation.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/k-nn-regression-in-depth", label: <>← k-NN regression in depth</> }} next={{ href: "/learn/k-nearest-neighbors/k-nn-for-imputation-and-anomaly-detection", label: <>Next up · Imputation &amp; anomaly detection →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def loess_point(X, y, x0, ell):
    # weighted least-squares LINE through the neighbourhood, read off at x0
    w = np.exp(-((X - x0)**2) / (2 * ell**2))
    A = np.c_[np.ones_like(X), X]                 # design matrix [1, x]
    W = np.diag(w)
    beta = np.linalg.solve(A.T @ W @ A, A.T @ W @ y)   # a, b
    return beta[0] + beta[1] * x0

# refit a local line at every query point -> a smooth curve
smooth = np.array([loess_point(x, y, x0, ell=1.0) for x0 in grid])`;

const codeLib = `import numpy as np
from statsmodels.nonparametric.smoothers_lowess import lowess

# statsmodels' LOWESS: frac is the bandwidth (fraction of points per local fit)
fitted = lowess(y, x, frac=0.25, it=3)   # it>0 = robust (down-weights outliers)
x_sorted, y_smooth = fitted[:, 0], fitted[:, 1]`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
