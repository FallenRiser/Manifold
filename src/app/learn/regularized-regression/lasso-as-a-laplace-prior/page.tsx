import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Lasso as a Laplace prior (MAP) — Manifold",
  description:
    "Lasso is the MAP estimate under a Laplace (double-exponential) prior. The prior's sharp spike at zero is the probabilistic reason Lasso produces exact zeros where the Gaussian prior cannot.",
};

// Gaussian vs Laplace prior densities — Laplace has a sharp peak at 0
const W = 300, H = 150, mid = 150, base = H - 18, sc = 13;
const gx = (b: number) => Math.round((mid + b * sc) * 100) / 100;
const gauss = (b: number) => Math.exp(-(b * b) / 2);
const lap = (b: number) => Math.exp(-Math.abs(b) * 1.3);
const gy = (d: number) => Math.round((base - d * (H - 36)) * 100) / 100;
const bs = Array.from({ length: 101 }, (_, i) => -5 + i * 0.1);

export default function LassoPriorPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--c-metrics)")}>Go deeper</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Lasso as a Laplace prior (MAP)
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Ridge was MAP under a Gaussian prior. Change the prior to a <strong>Laplace</strong> distribution and
        MAP becomes Lasso — and the prior&rsquo;s sharp spike at zero is the probabilistic source of sparsity.
      </p>

      <div className="lesson">
        <h2>The Laplace prior</h2>
        <p>
          The Laplace (double-exponential) prior puts the absolute value where the Gaussian put the square:
        </p>
        <MathBlock>{String.raw`p(\boldsymbol{\beta}) \propto \exp\!\Big(-\tfrac{1}{b}\sum_j |\beta_j|\Big), \qquad \beta_j \sim \text{Laplace}(0, b)`}</MathBlock>
        <p>
          Run the same MAP derivation as for ridge — log-posterior = log-likelihood + log-prior — and the
          negative log-prior contributes <M>{String.raw`\lambda \sum_j |\beta_j|`}</M>. The MAP estimate is exactly
          the <strong>Lasso</strong>. Same machinery, different prior, L1 penalty.
        </p>

        <h2>Why the prior&rsquo;s shape creates zeros</h2>
        <p>
          Compare the two priors as densities. The Gaussian is a smooth bell — rounded at the top, with no
          special feature at zero. The Laplace has a <strong>sharp peak (a cusp) at zero</strong> and heavier
          tails. That cusp concentrates prior probability right at zero, expressing the belief that many
          coefficients are <em>exactly</em> zero — a sparse world — while the heavy tails still allow a few
          genuinely large coefficients.
        </p>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, margin: "1.2rem 0" }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
            <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            <line x1={12} y1={base} x2={W - 12} y2={base} stroke="var(--border-strong)" strokeWidth={0.8} />
            <line x1={mid} y1={12} x2={mid} y2={base} stroke="var(--border-strong)" strokeWidth={0.6} strokeDasharray="2 2" />
            <polyline points={bs.map((b) => `${gx(b)},${gy(gauss(b))}`).join(" ")} fill="none" stroke="var(--c-classification)" strokeWidth={2} />
            <polyline points={bs.map((b) => `${gx(b)},${gy(lap(b))}`).join(" ")} fill="none" stroke="var(--c-regression)" strokeWidth={2.6} />
            <text x={gx(2.4)} y={gy(gauss(2.4)) - 4} fontSize={8.5} fill="var(--c-classification)">Gaussian (ridge)</text>
            <text x={gx(0.3)} y={gy(lap(0.3)) - 2} fontSize={8.5} fill="var(--c-regression)">Laplace (lasso)</text>
            <text x={mid} y={H - 4} fontSize={8} fill="var(--faint)" textAnchor="middle">coefficient β</text>
          </svg>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
            Both priors are centred at zero, but the Laplace (blue) spikes sharply there while the Gaussian
            (pink) is smoothly rounded. That cusp is the prior&rsquo;s way of saying &ldquo;exactly zero is special&rdquo; —
            and it&rsquo;s the same non-smoothness that, in the penalty, produced the soft-thresholding dead-zone.
          </div>
        </div>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-regression)", marginBottom: 4 }}>
            One caveat: MAP ≠ the full Bayesian answer
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Lasso is the <em>mode</em> (MAP) of the Laplace-prior posterior, not the posterior mean. The full
            Bayesian Lasso posterior actually puts zero probability on exact zeros — the sparsity is an artifact
            of taking the mode, where the cusp pins the optimum at zero. This is a subtle but important point:
            &ldquo;Lasso = Bayesian&rdquo; is true for the MAP estimate specifically. It still gives the right intuition
            for <em>why</em> L1 is sparse: the prior believes in zeros.
          </p>
        </div>

        <h2>The pattern: prior ⟷ penalty</h2>
        <p>
          You now have the full correspondence. <strong>Gaussian prior → L2 penalty → ridge</strong> (smooth
          shrinkage). <strong>Laplace prior → L1 penalty → lasso</strong> (sparse). Elastic-net corresponds to a
          prior that blends the two. Choosing a regularizer is choosing what you believe about the coefficients
          before seeing data — which is a genuinely useful way to think about it.
        </p>

        <h2>MAP equals Lasso</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/regularized-regression/ridge-as-a-gaussian-prior" style={navLink}>← Ridge as a Gaussian prior</Link>
          <Link href="/learn/regularized-regression/degrees-of-freedom" style={{ ...navLink, fontWeight: 600 }}>Next up · Degrees of freedom &amp; effective complexity →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np
from scipy.optimize import minimize

# directly maximize the Laplace-prior log-posterior and recover Lasso
def neg_log_post(beta, X, y, lam):
    return ((y - X @ beta)**2).sum() + lam * np.abs(beta).sum()

lam = 2.0
beta_map = minimize(neg_log_post, np.zeros(X.shape[1]),
                    args=(X, y, lam), method="Powell").x

from sklearn.linear_model import Lasso
beta_lasso = Lasso(alpha=lam/(2*len(y)), fit_intercept=False).fit(X, y).coef_
# both place coefficients at (near) exactly zero in the same places`;

const codeLib = `# Gaussian prior  -> L2 penalty -> Ridge   (smooth shrinkage, no zeros)
# Laplace prior   -> L1 penalty -> Lasso   (sharp spike at 0 -> exact zeros)
from sklearn.linear_model import Ridge, Lasso
print("ridge zeros:", (Ridge(alpha=1).fit(X, y).coef_ == 0).sum())   # 0
print("lasso zeros:", (Lasso(alpha=0.1).fit(X, y).coef_ == 0).sum()) # > 0`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-regression) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-regression) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
