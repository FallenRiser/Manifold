import Link from "next/link";
import { WLSLab } from "@/components/labs/WLSLab";
import { MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { Backlinks } from "@/components/Backlinks";

const codeScratch = `import numpy as np

rng = np.random.default_rng(8)
x  = np.linspace(1, 10, 100)
sd = 0.5 + 0.6*x                                   # noise grows with x
y  = 2 + 1.5*x + rng.normal(scale=sd, size=100)
X  = np.column_stack([np.ones_like(x), x])

b_ols = np.linalg.lstsq(X, y, rcond=None)[0]       # every point equal

W = np.diag(1 / sd**2)                             # weight = 1 / variance
b_wls = np.linalg.inv(X.T @ W @ X) @ X.T @ W @ y   # weighted normal equation

print(f"OLS slope: {b_ols[1]:.3f}")
print(f"WLS slope: {b_wls[1]:.3f}   (true 1.5)")`;

const codeLib = `import numpy as np
import statsmodels.api as sm

rng = np.random.default_rng(8)
x  = np.linspace(1, 10, 100)
sd = 0.5 + 0.6*x
y  = 2 + 1.5*x + rng.normal(scale=sd, size=100)

model = sm.WLS(y, sm.add_constant(x), weights=1/sd**2).fit()
print(f"WLS slope: {model.params[1]:.3f}")`;

export const metadata = {
  title: "Weighted least squares — Manifold",
  description:
    "When some data points are intrinsically noisier than others, Weighted Least Squares allows you to trust the quiet ones more than the noisy ones.",
};

export default function WeightedLeastSquaresPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--brand)")}>Fixing</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 4 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Weighted least squares
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        Ordinary Least Squares is an egalitarian algorithm: every data point gets
        exactly one vote. But what if you know certain data points are highly
        unreliable?
      </p>

      <Backlinks label="Related" items={[
        { label: "Homoscedasticity", href: "/learn/linear-regression/homoscedasticity" },
        { label: "Heteroscedasticity in depth", href: "/learn/linear-regression/heteroscedasticity-in-depth" },
        { label: "Transformations", href: "/learn/linear-regression/transformations" },
      ]} />

      <div className="lesson">
        <h2>The heteroscedasticity cure</h2>
        <p>
          We learned that heteroscedasticity (fanning variance) breaks standard
          errors. Robust Standard Errors (HC3) fix the standard errors, but they
          leave the point estimates (the line itself) exactly where OLS put them.
        </p>
        <p>
          <strong>Weighted Least Squares (WLS)</strong> is an elegant
          alternative. It changes the cost function itself to down-weight noisy
          observations, resulting in a <em>different</em>, more efficient
          regression line.
        </p>

        <h2>The math: inverse variance weighting</h2>
        <p>
          Instead of minimizing the raw sum of squared errors, WLS minimizes a
          weighted sum:
        </p>
        <MathBlock>{String.raw`\text{WLS cost} = \sum_{i} w_i\,(y_i - \hat y_i)^2`}</MathBlock>
        <p>
          The mathematically optimal choice for the weight wᵢ is the
          <strong> inverse of the true error variance</strong> for that
          observation:
        </p>
        <MathBlock>{String.raw`w_i = \frac{1}{\operatorname{Var}(\varepsilon_i)}`}</MathBlock>
        <p>
          If a point lies in a region of high variance (the wide part of the fan),
          its weight approaches zero. The model is essentially told: <em>"This
          point is extremely noisy. Ignore it. Pay attention to the tight points
          near the origin."</em>
        </p>

        <WLSLab />

        <h2>Where do the weights come from?</h2>
        <p>
          The catch with WLS is that you don't magically know the true variance
          of every point. You have to estimate it.
        </p>

        <div style={grid2}>
          <SourceCard title="1. Grouped data" color="var(--brand)"
            body="If your rows represent averages of groups (e.g., average income per county), the variance is inversely proportional to the county population. Weight by the population size (N)." />
          <SourceCard title="2. Two-step feasible WLS" color="var(--c-fundamentals)"
            body="Run normal OLS. Take the absolute residuals and regress them against x to predict the variance function. Use those predicted variances to generate weights, then run WLS." />
        </div>

        <h2>WLS vs Robust Standard Errors</h2>
        <p>
          When should you use WLS instead of just using OLS with robust standard
          errors?
        </p>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.85, color: "var(--muted)", fontSize: 15 }}>
          <li>
            Use <strong>WLS</strong> when you know the <em>exact functional
            form</em> of the variance (like grouped data). It is statistically
            more efficient and gives tighter confidence intervals.
          </li>
          <li>
            Use <strong>Robust SEs</strong> when you don't know exactly how the
            variance grows. If you guess the wrong weight function for WLS, it
            can make your estimates worse than OLS. Robust SEs are safer.
          </li>
        </ul>

        <h2>Compute it yourself</h2>
        <p>
          WLS is the normal equation with a weight matrix wedged in. From scratch
          it&rsquo;s one extra <code>W</code>; statsmodels takes a <code>weights</code> argument.
        </p>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/transformations" style={navLink}>← Transformations</Link>
          <Link href="/learn/linear-regression/regularization" style={navLink}>Next up · Regularization →</Link>
        </div>
      </div>
    </article>
  );
}

function SourceCard({ title, body, color }: { title: string; body: string; color: string }) {
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px" }}>
      <div className="font-display" style={{ fontSize: 13.5, fontWeight: 600, color, marginBottom: 5 }}>{title}</div>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, margin: "1.4rem 0" };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
