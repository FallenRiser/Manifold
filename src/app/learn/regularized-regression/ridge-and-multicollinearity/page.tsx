import Link from "next/link";
import { M } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Ridge & multicollinearity — Manifold",
  description:
    "Multicollinearity makes OLS coefficients explode into huge, unstable, canceling values. Ridge is the classic cure — it tames the variance and shares weight sensibly across correlated features.",
};

export default function MulticollinearityPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Ridge & multicollinearity
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Ridge was invented for exactly this problem. When features are highly correlated, ordinary least
        squares falls apart — and the <M>{String.raw`+\lambda I`}</M> on the diagonal is the fix that gave the
        method its name.
      </p>

      <div className="lesson">
        <h2>What multicollinearity does to OLS</h2>
        <p>
          When two or more features are strongly correlated, the data can&rsquo;t tell their effects apart. The
          model can add a huge positive coefficient to one and a huge negative coefficient to the other and
          get almost the same predictions — so OLS has no reason to prefer sensible values. The result:
        </p>
        <ul style={ul}>
          <li><strong>Enormous coefficients</strong> with opposite signs that nearly cancel.</li>
          <li><strong>Wild instability</strong> — a tiny change in the data flips the coefficients dramatically (high variance).</li>
          <li><strong>Uninterpretable weights</strong> — the signs and sizes stop reflecting any real relationship.</li>
        </ul>
        <p>
          Algebraically, correlated features make <M>{String.raw`X^\top X`}</M> nearly singular, so inverting it
          amplifies noise enormously. In the extreme of perfect correlation it&rsquo;s singular and OLS has no
          unique solution at all.
        </p>

        <h2>How ridge fixes it</h2>
        <p>
          Adding <M>{String.raw`\lambda I`}</M> to <M>{String.raw`X^\top X`}</M> lifts those near-zero eigenvalues
          away from zero, making the matrix well-conditioned and always invertible. Practically, ridge:
        </p>
        <ul style={ul}>
          <li><strong>Caps the coefficients</strong> — the penalty forbids the giant canceling values OLS reaches for.</li>
          <li><strong>Shares the weight.</strong> Among correlated features, ridge distributes the coefficient roughly <em>evenly</em> rather than dumping it all on one. Two identical features each get half the weight.</li>
          <li><strong>Slashes variance.</strong> The fit becomes stable and reproducible across samples.</li>
        </ul>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-regression)", marginBottom: 4 }}>
            Ridge vs Lasso on correlated features
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            This is the cleanest place to feel the difference. Faced with a group of correlated features,
            <strong> ridge keeps them all and splits the weight</strong>; <strong>Lasso tends to pick one
            arbitrarily and zero the rest</strong>. If the correlated features are genuinely a group you want
            to keep together (e.g. related genes), ridge — or elastic-net — is the right tool, and Lasso&rsquo;s
            arbitrary choice is a liability. That tension is exactly what elastic-net was designed to resolve.
          </p>
        </div>

        <h2>The connection to VIF</h2>
        <p>
          If you read the linear-regression track, multicollinearity is what the <strong>Variance Inflation
          Factor</strong> measures. Ridge can be seen as directly counteracting that inflation: by biasing the
          estimates a little, it deflates the variance that collinearity pumped up. The same diagnostic that
          flags the problem points you toward ridge as the remedy.
        </p>

        <h2>See OLS blow up, then ridge rescue it</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/regularized-regression/shrinkage-effect-and-paths" style={navLink}>← The shrinkage effect &amp; coefficient paths</Link>
          <Link href="/learn/regularized-regression/choosing-lambda" style={{ ...navLink, fontWeight: 600 }}>Next up · Choosing λ →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

rng = np.random.default_rng(0)
x1 = rng.normal(size=200)
x2 = x1 + rng.normal(scale=0.01, size=200)     # almost identical to x1
X = np.c_[x1, x2]
y = 3 * x1 + rng.normal(scale=0.1, size=200)

beta_ols = np.linalg.lstsq(X, y, rcond=None)[0]
print("OLS  :", beta_ols)        # huge, opposite-sign, unstable

p = X.shape[1]
beta_ridge = np.linalg.solve(X.T @ X + 1.0 * np.eye(p), X.T @ y)
print("Ridge:", beta_ridge)      # ~[1.5, 1.5] — weight split sensibly`;

const codeLib = `from sklearn.linear_model import LinearRegression, Ridge

print("OLS  :", LinearRegression().fit(X, y).coef_)   # exploded
print("Ridge:", Ridge(alpha=1.0).fit(X, y).coef_)     # tamed, shared`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-regression) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-regression) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
