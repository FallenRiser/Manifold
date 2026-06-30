import Link from "next/link";
import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "When the Lasso struggles — Manifold",
  description:
    "Lasso has three well-known failure modes — correlated groups, the p > n saturation cap, and instability. Each one is exactly the gap that elastic-net was designed to close.",
};

export default function WhenLassoStrugglesPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 5 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        When the Lasso struggles
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Lasso is brilliant, but it has three specific weaknesses — and they show up together precisely in the
        modern high-dimensional, correlated-feature problems it&rsquo;s most often reached for. Understanding them
        motivates the next page.
      </p>

      <div className="lesson">
        <h2>1 — The grouping problem</h2>
        <p>
          When several features are strongly correlated — think a cluster of co-expressed genes, or three
          near-duplicate sensors — Lasso tends to keep <strong>one</strong> of them and zero the others. Worse,
          <em> which</em> one it keeps is nearly a coin flip, sensitive to tiny data changes. If those features
          are a meaningful group you&rsquo;d like to retain together (or at least select together), Lasso&rsquo;s
          arbitrary single pick is both unstable and scientifically misleading. Ridge, by contrast, keeps the
          whole group and shares weight — but then selects nothing.
        </p>

        <h2>2 — The <M>{String.raw`p > n`}</M> saturation cap</h2>
        <p>
          A structural limit: when there are more features than samples, Lasso can select <strong>at most{" "}
          <M>{String.raw`n`}</M></strong> features before it saturates — it simply cannot give nonzero
          coefficients to more than <M>{String.raw`n`}</M> of them. In genomics you might have{" "}
          <M>{String.raw`p = 20{,}000`}</M> genes and <M>{String.raw`n = 200`}</M> patients; if the true signal
          involves more than 200 genes, plain Lasso can&rsquo;t represent it. This is a hard ceiling baked into the
          geometry, not a tuning issue.
        </p>

        <h2>3 — Instability under correlation</h2>
        <p>
          Tied to the grouping problem: in the presence of correlated features the Lasso solution path can be
          erratic, with features flickering in and out as λ or the data shifts slightly. That makes the selected
          set hard to trust and hard to reproduce — a real liability when the feature list itself is the
          deliverable.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-regression)", marginBottom: 4 }}>
            The common root — and the fix
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            All three problems trace to the L1 penalty&rsquo;s sharp, corner-only geometry, which forces hard
            either/or choices among correlated features. The cure is to <strong>mix in a little L2</strong>:
            ridge&rsquo;s rounded penalty restores the grouping behaviour and lifts the <M>{String.raw`n`}</M>-feature
            cap, while L1 still delivers sparsity. That blend is <strong>elastic-net</strong> — the next page —
            and these three weaknesses are exactly what it was invented to repair.
          </p>
        </div>

        <h2>Watch Lasso flip on correlated features</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/regularized-regression/solving-the-lasso" style={navLink}>← Solving the Lasso</Link>
          <Link href="/learn/regularized-regression/elastic-net" style={{ ...navLink, fontWeight: 600 }}>Next up · Elastic-net: blending L1 &amp; L2 →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np
from sklearn.linear_model import Lasso

rng = np.random.default_rng(0)
x1 = rng.normal(size=150)
x2 = x1 + rng.normal(scale=0.01, size=150)     # near-duplicate of x1
X = np.c_[x1, x2]
y = 2 * x1 + rng.normal(scale=0.1, size=150)

# resample a few times: Lasso keeps x1 OR x2 almost at random
for seed in range(4):
    idx = np.random.default_rng(seed).choice(150, 150)
    coef = Lasso(alpha=0.1).fit(X[idx], y[idx]).coef_
    print(f"seed {seed}: coef = {coef.round(2)}")   # which one survives jumps around`;

const codeLib = `from sklearn.linear_model import Lasso, ElasticNet

# Lasso drops one correlated feature; elastic-net keeps both, weight shared
print("lasso :", Lasso(alpha=0.1).fit(X, y).coef_.round(2))
print("enet  :", ElasticNet(alpha=0.1, l1_ratio=0.5).fit(X, y).coef_.round(2))`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-regression) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-regression) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
