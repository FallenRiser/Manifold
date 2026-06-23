import Link from "next/link";
import { HeteroImpactLab } from "@/components/labs/HeteroImpactLab";
import { MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { Backlinks } from "@/components/Backlinks";

const codeScratch = `import numpy as np

rng = np.random.default_rng(2)
x = np.linspace(1, 10, 200)
y = 2 + 1.5*x + rng.normal(scale=0.3*x, size=200)   # heteroscedastic
X = np.column_stack([np.ones_like(x), x])

XtX_inv = np.linalg.inv(X.T @ X)
beta = XtX_inv @ X.T @ y
resid = y - X @ beta
n, k = X.shape

# naive OLS standard errors (assume constant variance)
sigma2 = np.sum(resid**2) / (n - k)
se_ols = np.sqrt(np.diag(sigma2 * XtX_inv))

# White / HC0 "sandwich" standard errors (robust to heteroscedasticity)
meat   = X.T @ (resid[:, None]**2 * X)
cov_hc = XtX_inv @ meat @ XtX_inv
se_hc  = np.sqrt(np.diag(cov_hc))

print(f"slope SE  OLS: {se_ols[1]:.4f}")
print(f"slope SE  HC0: {se_hc[1]:.4f}   <- honest under heteroscedasticity")`;

const codeLib = `import numpy as np
import statsmodels.api as sm

rng = np.random.default_rng(2)
x = np.linspace(1, 10, 200)
y = 2 + 1.5*x + rng.normal(scale=0.3*x, size=200)
Xc = sm.add_constant(x)

ols = sm.OLS(y, Xc).fit()
hc  = sm.OLS(y, Xc).fit(cov_type="HC0")     # one argument flips on robust SEs
print(f"slope SE  OLS: {ols.bse[1]:.4f}")
print(f"slope SE  HC0: {hc.bse[1]:.4f}")`;

export const metadata = {
  title: "Heteroscedasticity in depth — Manifold",
  description:
    "A deeper dive into the math of heteroscedasticity. How formal tests like Breusch-Pagan and White work, and the mechanics of robust standard errors.",
};

export default function HeteroscedasticityInDepthPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--brand)")}>Diagnostics</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Heteroscedasticity in depth
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        Visual checks are great, but sometimes you need formal proof. And when
        you find heteroscedasticity, you need to fix your covariance matrix.
      </p>

      <Backlinks label="Related" items={[
        { label: "Homoscedasticity", href: "/learn/linear-regression/homoscedasticity" },
        { label: "Weighted least squares", href: "/learn/linear-regression/weighted-least-squares" },
        { label: "Case B: house prices", href: "/learn/linear-regression/end-to-end-worked-case/house-prices" },
      ]} />

      <div className="lesson">
        <h2>Formal testing: predicting the variance</h2>
        <p>
          If heteroscedasticity exists, the squared residuals (a proxy for error
          variance) will be correlated with your predictors. Both major tests
          exploit this logic: run a secondary regression trying to predict the
          squared residuals.
        </p>

        <div style={{ display: "grid", gap: 14, margin: "1.4rem 0" }}>
          <TestCard 
            title="Breusch-Pagan Test" 
            formula="ε² = α₀ + α₁x₁ + α₂x₂ + u"
            body="Regresses squared residuals purely on the original predictors. The test statistic is N × R² from this secondary regression. It follows a Chi-square distribution. Great for detecting linear forms of heteroscedasticity." 
          />
          <TestCard 
            title="White Test" 
            formula="ε² = α₀ + α₁x₁ + α₂x₁² + α₃(x₁·x₂) + ..."
            body="A generalisation of Breusch-Pagan. It includes the predictors, their squares, and their cross-products. This catches non-linear fanning. The downside: with many features, it burns through degrees of freedom instantly." 
          />
        </div>
        <p>
          If the p-value is &lt; 0.05, you reject the null hypothesis of
          homoscedasticity. You have a variance problem.
        </p>

        <HeteroImpactLab />

        <h2>The Sandwich Estimator (HC SE)</h2>
        <p>
          The standard OLS covariance matrix for the coefficients is:
        </p>
        <MathBlock>{String.raw`\operatorname{Var}(\hat\theta) = \sigma^2\,(X^\top X)^{-1}`}</MathBlock>
        <p>
          This assumes σ² is a single scalar number. When heteroscedasticity is
          present, σ² isn't a scalar — it's a diagonal matrix Σ containing a
          different variance for each observation. The correct formula becomes:
        </p>
        <MathBlock>{String.raw`\operatorname{Var}(\hat\theta) = (X^\top X)^{-1}\,(X^\top \Sigma X)\,(X^\top X)^{-1}`}</MathBlock>
        <p>
          Look at the structure: it has "bread" `(XᵀX)⁻¹` on the outside, and
          "meat" `XᵀΣX` on the inside. This is why Halbert White's 1980
          estimator is affectionately called the <strong>Sandwich Estimator</strong>.
        </p>

        <h2>How do we know the meat?</h2>
        <p>
          We don't know the true Σ. White's stroke of genius was showing that we
          can just use the <em>squared OLS residuals</em> for each observation
          in place of the true variances. Even though a single squared residual
          is a terrible estimate of that specific point's true variance, when
          summed across all points in the meat of the sandwich, it provides a
          consistent estimate of the covariance matrix.
        </p>
        <p>
          These are called <strong>Robust Standard Errors</strong>.
          There are variants (HC0, HC1, HC2, HC3) that apply small-sample
          corrections, with HC3 being the modern recommendation.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}>
            Why not always use robust SEs?
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            If robust standard errors protect against heteroscedasticity, why
            does OLS still default to the old ones? Because if the errors{" "}
            <em>are</em> actually homoscedastic, the classic standard errors are
            more efficient (tighter) in small samples. However, in many fields
            (like economics), researchers just use robust SEs by default for
            everything.
          </p>
        </div>

        <h2>Compute the sandwich yourself</h2>
        <p>
          Robust standard errors come from the &ldquo;sandwich&rdquo; estimator — the same
          formula from the panel above, in NumPy. statsmodels exposes it as a single
          <code>cov_type=&quot;HC0&quot;</code> argument.
        </p>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/residual-vs-fitted" style={navLink}>← Residual-vs-fitted</Link>
          <Link href="/learn/linear-regression/outliers-leverage-influence" style={navLink}>Next up · Outliers, leverage & influence →</Link>
        </div>
      </div>
    </article>
  );
}

function TestCard({ title, formula, body }: { title: string; formula: string; body: string }) {
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 18px" }}>
      <div className="font-display" style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>{title}</div>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 14, color: "var(--brand)", marginBottom: 10 }}>{formula}</div>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-fundamentals) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-fundamentals) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0 0" };
