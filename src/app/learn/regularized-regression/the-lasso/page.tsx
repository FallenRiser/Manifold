import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "The Lasso — Manifold",
  description:
    "The Lasso swaps ridge's squared penalty for the sum of absolute values. That one change lets it set coefficients to exactly zero — doing variable selection and regression in a single step.",
};

export default function LassoPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        The Lasso
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        The Lasso makes one small-looking change to ridge — penalise the absolute value of the coefficients
        instead of the square — and gains a remarkable new power: it sets coefficients to <em>exactly</em>{" "}
        zero, doing feature selection for free.
      </p>

      <div className="lesson">
        <h2>The objective</h2>
        <p>
          Lasso — Least Absolute Shrinkage and Selection Operator — minimises squared error plus{" "}
          <M>{String.raw`\lambda`}</M> times the <strong>L1 norm</strong> of the coefficients:
        </p>
        <MathBlock>{String.raw`\min_{\boldsymbol{\beta}} \; \sum_{i=1}^{n}\big(y_i - \mathbf{x}_i^\top\boldsymbol{\beta}\big)^2 \;+\; \lambda \sum_{j=1}^{p} \lvert \beta_j \rvert`}</MathBlock>
        <p>
          The only difference from ridge is <M>{String.raw`|\beta_j|`}</M> in place of{" "}
          <M>{String.raw`\beta_j^2`}</M>. It looks trivial. It isn&rsquo;t — the name itself flags the consequence:{" "}
          <strong>shrinkage</strong> <em>and</em> <strong>selection</strong>, together.
        </p>

        <h2>Shrink and select</h2>
        <p>
          Like ridge, the L1 penalty pulls coefficients toward zero. Unlike ridge, it pulls some of them{" "}
          <em>all the way</em> to exactly zero and pins them there. A coefficient at exactly zero means that
          feature is dropped from the model entirely. So a single fit produces a <strong>sparse</strong>
          model — only a subset of features have nonzero weights — which is simultaneously a prediction model
          and an automatic answer to &ldquo;which features matter?&rdquo;
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-regression)", marginBottom: 4 }}>
            Why sparsity is so valuable
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            A model that uses 8 of 10,000 features is <strong>interpretable</strong> (you can read the eight),
            <strong> cheap</strong> (you only need to collect and compute those eight), and often{" "}
            <strong>more accurate</strong> when most features are truly irrelevant noise. In genomics, text,
            and sensor data — where features vastly outnumber samples — this automatic pruning is exactly what
            you need, and it&rsquo;s why Lasso is everywhere in high-dimensional statistics.
          </p>
        </div>

        <h2>The trade-offs vs ridge</h2>
        <ul style={ul}>
          <li><strong>Sparsity</strong> — Lasso selects, ridge keeps everything. Advantage Lasso when you want a short feature list.</li>
          <li><strong>Correlated groups</strong> — Lasso tends to pick <em>one</em> feature from a correlated group and zero the rest, somewhat arbitrarily; ridge spreads weight across them. Advantage ridge for grouped features.</li>
          <li><strong>The <M>{String.raw`p > n`}</M> limit</strong> — Lasso can select at most <M>{String.raw`n`}</M> features before saturating; ridge has no such cap.</li>
          <li><strong>Solvability</strong> — ridge has a closed form; Lasso does not (the absolute value isn&rsquo;t differentiable at zero), needing an iterative solver — its own page.</li>
        </ul>
        <p>
          These aren&rsquo;t strict winners and losers — they&rsquo;re the reason <strong>elastic-net</strong> exists, to
          get the best of both. First, though, the heart of the matter: <em>why</em> does L1 produce exact
          zeros when L2 doesn&rsquo;t?
        </p>

        <h2>One parameter change in code</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/regularized-regression/choosing-lambda" style={navLink}>← Choosing λ</Link>
          <Link href="/learn/regularized-regression/why-l1-creates-sparsity" style={{ ...navLink, fontWeight: 600 }}>Next up · Why L1 creates sparsity →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

# soft-thresholding is the L1 analogue of ridge's shrinkage (derived next page)
def soft_threshold(rho, lam):
    return np.sign(rho) * max(abs(rho) - lam, 0.0)   # can return EXACTLY 0

# ridge shrinks rho by a factor; lasso subtracts a constant and clips at 0:
#   ridge:  beta = rho / (1 + lam)        -> never exactly 0
#   lasso:  beta = soft_threshold(rho, lam) -> zero whenever |rho| <= lam`;

const codeLib = `from sklearn.linear_model import Lasso

lasso = Lasso(alpha=0.1).fit(X, y)        # alpha is λ
print(lasso.coef_)                        # several entries are exactly 0.0
print("features used:", (lasso.coef_ != 0).sum(), "of", X.shape[1])`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-regression) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-regression) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
