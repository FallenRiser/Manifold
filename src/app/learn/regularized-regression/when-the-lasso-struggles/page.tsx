import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "When the Lasso struggles — Manifold",
  description:
    "Lasso has three well-known failure modes — correlated groups, the p > n saturation cap, and instability. Each one is exactly the gap that elastic-net was designed to close.",
};

export default function WhenLassoStrugglesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }]}
        time="about 5 minutes"
        title={<>When the Lasso struggles</>}
        intro={<>
          Lasso is brilliant, but it has three specific weaknesses — and they show up together precisely in the
        modern high-dimensional, correlated-feature problems it&rsquo;s most often reached for. Understanding them
        motivates the next page.
        </>}
      />

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

        <Callout color="var(--c-regression)" title={<>The common root — and the fix</>}>
          All three problems trace to the L1 penalty&rsquo;s sharp, corner-only geometry, which forces hard
            either/or choices among correlated features. The cure is to <strong>mix in a little L2</strong>:
            ridge&rsquo;s rounded penalty restores the grouping behaviour and lifts the <M>{String.raw`n`}</M>-feature
            cap, while L1 still delivers sparsity. That blend is <strong>elastic-net</strong> — the next page —
            and these three weaknesses are exactly what it was invented to repair.
        </Callout>

        <h2>Watch Lasso flip on correlated features</h2>
        <CodeBlock setup={REGRESSION_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/regularized-regression/solving-the-lasso", label: <>← Solving the Lasso</> }} next={{ href: "/learn/regularized-regression/elastic-net", label: <>Next up · Elastic-net: blending L1 &amp; L2 →</> }} />
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




