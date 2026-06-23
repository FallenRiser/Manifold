import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Regression by averaging — Manifold",
  description:
    "Swap the vote for an average and k-NN predicts numbers. The result is a piecewise-constant, staircase function — and seeing why it's flat then jumps reveals both k-NN regression's charm and its limits.",
};

// 1-D k-NN regression: a wavy target sampled noisily, predicted by averaging k
// nearest y-values. The prediction is a staircase (piecewise constant).
const N = 24;
const XS = Array.from({ length: N }, (_, i) => (i / (N - 1)) * 100);
// deterministic noisy samples of a smooth curve
function targetY(x: number) { return 50 + 28 * Math.sin((x / 100) * Math.PI * 1.6); }
const PTS = XS.map((x, i) => ({ x, y: targetY(x) + ((i * 37) % 17 - 8) }));
const K = 3;
// predict on a dense grid by averaging k nearest (in x) y-values
const GRID = Array.from({ length: 101 }, (_, i) => i);
const PRED = GRID.map((gx) => {
  const sorted = [...PTS].sort((a, b) => Math.abs(a.x - gx) - Math.abs(b.x - gx)).slice(0, K);
  return sorted.reduce((s, p) => s + p.y, 0) / K;
});
const W = 320, H = 180;
const sx = (x: number) => Math.round((20 + (x / 100) * (W - 32)) * 100) / 100;
const sy = (y: number) => Math.round((H - 16 - (y / 100) * (H - 30)) * 100) / 100;

export default function RegressionPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-classification)")}>Classification</span>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Regression by averaging
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        k-NN isn&rsquo;t only a classifier. Replace the vote with an average and the exact same &ldquo;find the
        neighbours&rdquo; machinery predicts continuous numbers — with a distinctive staircase shape.
      </p>

      <div className="lesson">
        <h2>From vote to average</h2>
        <p>
          To predict a number, take the mean of the <em>k</em> nearest neighbours&rsquo; target values:
        </p>
        <MathBlock>{String.raw`\hat{y}(x) = \frac{1}{k}\sum_{i \in N_k(x)} y_i`}</MathBlock>
        <p>
          Everything before the &ldquo;decide&rdquo; step is identical to classification — measure distances,
          select the <em>k</em> nearest. Only the combination changes: average instead of vote. (For a
          robust variant, use the <em>median</em> of the neighbours&rsquo; values.)
        </p>

        <h2>The prediction is a staircase</h2>
        <p>
          Here&rsquo;s a 1-D example: noisy samples of a smooth curve, predicted with <em>k</em> = {K}-NN
          averaging.
        </p>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, margin: "1.2rem 0" }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
            <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            <polyline points={GRID.map((gx, i) => `${sx(gx)},${sy(PRED[i])}`).join(" ")} fill="none" stroke="var(--c-classification)" strokeWidth={2.2} />
            {PTS.map((p, i) => <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={2.8} fill="var(--c-regression)" fillOpacity={0.7} />)}
          </svg>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
            Dots are noisy training samples; the pink line is the k-NN prediction. It&rsquo;s{" "}
            <strong>piecewise constant</strong> — flat wherever the set of <em>k</em> nearest neighbours
            doesn&rsquo;t change, then it jumps the instant the neighbour set swaps. No smooth slope, no
            extrapolation.
          </div>
        </div>

        <h2>Why the staircase, and what it costs</h2>
        <ul style={ul}>
          <li>
            <strong>Flat segments:</strong> as the query slides a little, its <em>k</em> nearest neighbours
            stay the same, so the average — and the prediction — doesn&rsquo;t change.
          </li>
          <li>
            <strong>Jumps:</strong> when a new point enters the neighbour set and an old one leaves, the
            average shifts abruptly. Hence the steps.
          </li>
          <li>
            <strong>No extrapolation:</strong> beyond the data&rsquo;s range, the <em>k</em> nearest are all on
            one side, so the prediction flattens to a constant. Unlike linear regression, k-NN can never
            project a trend outward.
          </li>
        </ul>
        <p>
          As with classification, <em>k</em> controls smoothness: small <em>k</em> gives a jagged, noise-
          chasing staircase; large <em>k</em> averages over a wide window into a flatter, smoother (but more
          biased) curve.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-classification)", marginBottom: 4 }}>
            k-NN regression vs. linear regression
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Linear regression assumes a global straight-line relationship and extrapolates confidently;
            k-NN regression assumes nothing about the global shape and adapts locally, but produces a blocky
            curve and refuses to extrapolate. k-NN wins when the relationship is complex and non-linear and
            you have dense data; linear regression wins when the trend is roughly linear or you need to
            predict beyond the observed range. <Link href="/learn/k-nearest-neighbors/local-weighted-regression" style={inlineLink}>Distance-weighting
            the average</Link> smooths the staircase into something far nicer.
          </p>
        </div>

        <h2>k-NN regression in code</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-nearest-neighbors/classification-by-majority-vote" style={navLink}>← Classification by majority vote</Link>
          <Link href="/learn/k-nearest-neighbors/decision-boundaries" style={{ ...navLink, fontWeight: 600 }}>Next up · Decision boundaries →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def knn_regress(X, y, x, k):
    idx = np.argsort(np.sqrt(((X - x)**2).sum(axis=1)))[:k]
    return y[idx].mean()              # average instead of vote
    # robust variant: return np.median(y[idx])

preds = np.array([knn_regress(X_train, y_train, x, k=3) for x in X_test])`;

const codeLib = `from sklearn.neighbors import KNeighborsRegressor

reg = KNeighborsRegressor(n_neighbors=3, weights="uniform")
reg.fit(X_train, y_train)
y_pred = reg.predict(X_test)          # piecewise-constant predictions

# 'distance' weighting smooths the staircase (closer neighbours count more)
reg_w = KNeighborsRegressor(n_neighbors=10, weights="distance").fit(X_train, y_train)`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-classification) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-classification) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
