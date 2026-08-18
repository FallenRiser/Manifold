import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { KNN_SETUP } from "@/lib/runtimeSetup";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "k-NN regression in depth — Manifold",
  description:
    "The regression staircase, taken further: how distance weighting smooths it, why k-NN never extrapolates, how to pick k for a regressor, and where it beats — and loses to — a linear model.",
};

// 1-D k-NN regression: a smooth target, noisy samples, and TWO predictors on a
// dense grid — uniform k=3 (staircase) vs distance-weighted k=8 (smooth). All
// computed at module scope with rounded coordinates.
const N = 24;
const XS = Array.from({ length: N }, (_, i) => (i / (N - 1)) * 100);
const targetY = (x: number) => 50 + 28 * Math.sin((x / 100) * Math.PI * 1.6);
const PTS = XS.map((x, i) => ({ x, y: targetY(x) + ((i * 37) % 17 - 8) }));
const GRID = Array.from({ length: 101 }, (_, i) => i);

// uniform average of k nearest (in x)
const uniform = (gx: number, k: number) => {
  const near = [...PTS].sort((a, b) => Math.abs(a.x - gx) - Math.abs(b.x - gx)).slice(0, k);
  return near.reduce((s, p) => s + p.y, 0) / k;
};
// gaussian distance-weighted average of k nearest
const weighted = (gx: number, k: number, ell: number) => {
  const near = [...PTS].sort((a, b) => Math.abs(a.x - gx) - Math.abs(b.x - gx)).slice(0, k);
  let num = 0, den = 0;
  for (const p of near) { const w = Math.exp(-((p.x - gx) ** 2) / (2 * ell * ell)); num += w * p.y; den += w; }
  return num / den;
};
const UNI = GRID.map((gx) => uniform(gx, 3));
const WGT = GRID.map((gx) => weighted(gx, 8, 9));

const W = 340, H = 190;
const sx = (x: number) => Math.round((22 + (x / 100) * (W - 34)) * 100) / 100;
const sy = (y: number) => Math.round((H - 16 - (y / 100) * (H - 30)) * 100) / 100;

export default function KnnRegressionDepthPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Regression", color: "var(--c-regression)" }, { label: "Tier 2 · other uses", color: "var(--c-classification)" }]}
        time="about 8 minutes"
        title={<>k-NN regression in depth</>}
        intro={<>
          You&rsquo;ve met the averaging idea and its staircase. Now the practitioner&rsquo;s view: smoothing the
        steps with distance weights, the hard truth about extrapolation, tuning k for a regressor, and how it
        stacks up against a linear model.
        </>}
      />

      <div className="lesson">
        <h2>Uniform averaging vs. distance weighting</h2>
        <p>
          Plain k-NN regression averages the <M>{String.raw`k`}</M> nearest targets equally, giving the blocky
          staircase. Weighting each neighbour by closeness — the distance-weighting idea, applied to the mean —
          turns that into a genuinely smooth curve:
        </p>
        <MathBlock>{String.raw`\hat{y}(x) = \frac{\sum_{i \in N_k} w_i\, y_i}{\sum_{i \in N_k} w_i}, \qquad w_i = \exp\!\left(-\frac{d_i^2}{2\ell^2}\right)`}</MathBlock>

        <figure style={{ margin: "1.4rem 0", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="A uniform k=3 k-NN regressor produces a staircase, while a distance-weighted k=8 regressor produces a smooth curve through the same noisy points.">
            <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            <polyline points={GRID.map((gx, i) => `${sx(gx)},${sy(UNI[i])}`).join(" ")} fill="none" stroke="var(--faint)" strokeWidth={1.8} strokeDasharray="4 3" />
            <polyline points={GRID.map((gx, i) => `${sx(gx)},${sy(WGT[i])}`).join(" ")} fill="none" stroke="var(--c-regression)" strokeWidth={2.4} />
            {PTS.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={2.8} fill="var(--c-classification)" fillOpacity={0.6} />)}
            <text x={sx(2)} y={sy(UNI[2]) - 6} fontSize={8.5} fill="var(--faint)">uniform k=3 (staircase)</text>
            <text x={sx(98)} y={sy(WGT[98]) + 12} fontSize={8.5} fill="var(--c-regression)" textAnchor="end">weighted k=8 (smooth)</text>
          </svg>
          <figcaption style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8, lineHeight: 1.55 }}>
            Same points, two regressors. The dashed uniform fit jumps whenever the neighbour set swaps; the
            Gaussian-weighted fit lets influence fade with distance, tracing the trend smoothly.
          </figcaption>
        </figure>

        <h2>k-NN regression never extrapolates</h2>
        <p>
          Look at the ends of the curve: both fits flatten. Beyond the range of the training data, every one of
          the <M>{String.raw`k`}</M> nearest points lies on the same side, so the prediction can only repeat the
          edge values — it <strong>cannot project a trend outward</strong>. A linear model happily (sometimes
          recklessly) extrapolates a straight line to infinity; k-NN refuses. That&rsquo;s a safety feature inside
          the data&rsquo;s support and a hard limitation outside it.
        </p>

        <h2>Choosing k for a regressor</h2>
        <p>
          The bias–variance story is identical to classification, just measured on a continuous target:
        </p>
        <ul style={ul}>
          <li><strong>Small k</strong> — low bias, high variance: a jagged fit that chases noise (k = 1 interpolates every point exactly).</li>
          <li><strong>Large k</strong> — high bias, low variance: a flat fit that washes out real structure (k = n predicts the global mean everywhere).</li>
          <li><strong>Tune by CV</strong> on a regression metric — RMSE or MAE — exactly as in the <Link href="/learn/evaluation/rmse-vs-mae" style={inlineLink}>evaluation pillar</Link>. Distance weighting makes larger k safe, so pair the two.</li>
        </ul>

        <Callout color="var(--c-regression)" title={<>k-NN regression vs. linear regression — when each wins</>}>
          <strong>k-NN regression</strong> assumes nothing about global shape and adapts to any local wiggle,
            but it&rsquo;s blocky (or, weighted, smooth-but-local), needs dense data, and never extrapolates.{" "}
            <strong>Linear regression</strong> commits to a global straight line: it extrapolates, needs little
            data, and is interpretable — but is hopeless if the truth is non-linear. Reach for k-NN when the
            relationship is complex and you have plenty of nearby data; reach for a parametric model when the
            trend is smooth, data is scarce, or you must predict beyond the observed range.
        </Callout>

        <CodeBlock setup={KNN_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "How does distance weighting change the k-NN regression fit?",
              options: ["It smooths the staircase — closer neighbours count more, so the curve varies continuously", "It makes the fit extrapolate", "It removes the need to choose k"],
              answer: 0,
              explain: "Weighting the average by closeness lets influence fade with distance, so the prediction changes smoothly instead of jumping when the neighbour set swaps.",
            },
            {
              q: "Why can't k-NN regression extrapolate beyond the training range?",
              options: ["Outside the data, all k neighbours lie on one side, so it just repeats edge values", "Because averaging is undefined there", "It can, but only with distance weighting"],
              answer: 0,
              explain: "With no data on the far side, the nearest neighbours are all interior points; the prediction flattens to the edge value. It can never project a trend outward.",
            },
            {
              q: "You should tune k for a k-NN regressor using…",
              options: ["Cross-validation on a regression metric like RMSE or MAE", "Training-set R², maximised", "The same k as the classifier"],
              answer: 0,
              explain: "As always, held-out error is the honest judge — here RMSE or MAE. Training error would just favour k=1, which interpolates every point.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/approximate-nearest-neighbors", label: <>← Approximate nearest neighbors</> }} next={{ href: "/learn/k-nearest-neighbors/local-weighted-regression", label: <>Next up · Local weighted regression →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def knn_regress(X, y, x, k, ell=None):
    d = np.sqrt(((X - x)**2).sum(axis=1))
    idx = np.argsort(d)[:k]
    if ell is None:
        return y[idx].mean()                         # uniform: the staircase
    w = np.exp(-(d[idx]**2) / (2 * ell**2))          # gaussian distance weights
    return (w * y[idx]).sum() / w.sum()              # smooth curve

# uniform vs weighted at the same query
print(knn_regress(X_train, y_train, X_test[0], k=8))
print(knn_regress(X_train, y_train, X_test[0], k=8, ell=1.0))`;

const codeLib = `from sklearn.neighbors import KNeighborsRegressor
from sklearn.metrics import mean_absolute_error

uni = KNeighborsRegressor(n_neighbors=8, weights="uniform").fit(X_train, y_train)
wgt = KNeighborsRegressor(n_neighbors=8, weights="distance").fit(X_train, y_train)

for name, m in [("uniform", uni), ("weighted", wgt)]:
    print(name, "MAE:", round(mean_absolute_error(y_test, m.predict(X_test)), 3))`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
