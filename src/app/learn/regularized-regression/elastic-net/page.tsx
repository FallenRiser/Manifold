import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Elastic-net: blending L1 & L2 — Manifold",
  description:
    "Elastic-net adds both penalties at once, getting Lasso's sparsity and Ridge's grouping. Its rounded-diamond geometry selects correlated features together and lifts the p > n cap.",
};

export default function ElasticNetPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Elastic-net: blending L1 & L2
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Why choose between Lasso&rsquo;s selection and Ridge&rsquo;s stability when you can have both? Elastic-net adds
        the two penalties together — and the combination fixes every Lasso weakness from the last page while
        keeping the sparsity.
      </p>

      <div className="lesson">
        <h2>The objective</h2>
        <p>Elastic-net penalises with both the L1 and L2 norms at once:</p>
        <MathBlock>{String.raw`\min_{\boldsymbol{\beta}} \; \sum_{i=1}^{n}\big(y_i - \mathbf{x}_i^\top\boldsymbol{\beta}\big)^2 \;+\; \lambda\Big( \alpha \sum_j |\beta_j| \;+\; (1-\alpha)\sum_j \beta_j^2 \Big)`}</MathBlock>
        <p>
          Two knobs now. <M>{String.raw`\lambda`}</M> sets the overall penalty strength as before. The{" "}
          <strong>mixing parameter</strong> <M>{String.raw`\alpha \in [0,1]`}</M> dials between the two penalties:
          <M>{String.raw`\alpha = 1`}</M> is pure Lasso, <M>{String.raw`\alpha = 0`}</M> is pure Ridge, and anything
          in between is a genuine blend. (scikit-learn calls this mix <code>l1_ratio</code>.)
        </p>

        <h2>The geometry: a rounded diamond</h2>
        <p>
          Add an L1 diamond and an L2 circle and you get a constraint region shaped like a{" "}
          <strong>diamond with rounded edges but sharp corners</strong>. The corners survive — so coefficients
          can still hit exactly zero, giving sparsity. But the edges between corners now bulge outward like a
          circle&rsquo;s, which is what restores the grouping behaviour: correlated features get touched together
          rather than one-or-nothing. You keep L1&rsquo;s zeros and borrow L2&rsquo;s smoothness.
        </p>

        <h2>How it fixes each Lasso weakness</h2>
        <ul style={ul}>
          <li>
            <strong>Grouping.</strong> The L2 component encourages correlated features to enter and shrink{" "}
            <em>together</em>, so elastic-net keeps groups instead of arbitrarily picking one member.
          </li>
          <li>
            <strong>The <M>{String.raw`p > n`}</M> cap.</strong> The L2 part removes Lasso&rsquo;s ceiling — elastic-net
            can select more than <M>{String.raw`n`}</M> features when the signal calls for it.
          </li>
          <li>
            <strong>Stability.</strong> Mixing in L2 makes the objective strictly convex, smoothing the path and
            making the selected set far more reproducible across resamples.
          </li>
        </ul>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-regression)", marginBottom: 4 }}>
            A strong default
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Because it contains both Ridge and Lasso as special cases, elastic-net is a safe go-to when you&rsquo;re
            unsure which to use — tuning <M>{String.raw`\alpha`}</M> lets cross-validation <em>discover</em> the
            right blend. A small L2 component (e.g. <M>{String.raw`\alpha = 0.9`}</M>, mostly Lasso) is a common
            sweet spot: nearly all the sparsity of Lasso, but with the grouping and stability that make it
            trustworthy on real, correlated data.
          </p>
        </div>

        <h2>Elastic-net in code</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/regularized-regression/when-the-lasso-struggles" style={navLink}>← When the Lasso struggles</Link>
          <Link href="/learn/regularized-regression/tuning-the-mix" style={{ ...navLink, fontWeight: 600 }}>Next up · Tuning the mix →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def soft_threshold(rho, lam):
    return np.sign(rho) * np.maximum(np.abs(rho) - lam, 0.0)

# elastic-net coordinate update: L1 soft-threshold in the numerator,
# L2 adds to the denominator (extra shrinkage that enables grouping)
def enet_update(X, y, beta, j, lam, alpha):
    n = len(y)
    r_j = y - X @ beta + X[:, j] * beta[j]
    rho = X[:, j] @ r_j
    l1, l2 = lam * alpha * n, lam * (1 - alpha) * n
    return soft_threshold(rho, l1) / ((X[:, j]**2).sum() + l2)`;

const codeLib = `from sklearn.linear_model import ElasticNet

# l1_ratio is α: 1.0 = Lasso, 0.0 = Ridge, in between = blend
enet = ElasticNet(alpha=0.1, l1_ratio=0.5).fit(X, y)
print((enet.coef_ != 0).sum(), "features kept")   # sparse, but groups survive`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-regression) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-regression) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
