import Link from "next/link";
import { HomoscedasticityLab } from "@/components/labs/HomoscedasticityLab";
import { MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { Backlinks } from "@/components/Backlinks";

const codeScratch = `import numpy as np

rng = np.random.default_rng(2)
x = np.linspace(1, 10, 200)
y = 2 + 1.5*x + rng.normal(scale=0.3*x, size=200)   # spread grows with x
X = np.column_stack([np.ones_like(x), x])

beta, *_ = np.linalg.lstsq(X, y, rcond=None)
resid = y - X @ beta

# Breusch-Pagan: regress the SQUARED residuals on the predictors
e2 = resid**2
b2, *_ = np.linalg.lstsq(X, e2, rcond=None)
r2_aux = 1 - np.sum((e2 - X @ b2)**2) / np.sum((e2 - e2.mean())**2)
LM = len(y) * r2_aux        # ~ chi-square; large => heteroscedastic
print(f"aux R^2: {r2_aux:.3f}   BP statistic n*R^2: {LM:.1f}")`;

const codeLib = `import numpy as np
import statsmodels.api as sm
from statsmodels.stats.diagnostic import het_breuschpagan

rng = np.random.default_rng(2)
x = np.linspace(1, 10, 200)
y = 2 + 1.5*x + rng.normal(scale=0.3*x, size=200)

model = sm.OLS(y, sm.add_constant(x)).fit()
lm, lm_p, f, f_p = het_breuschpagan(model.resid, model.model.exog)
print(f"Breusch-Pagan LM: {lm:.1f}   p-value: {lm_p:.4f}")   # p<0.05 => heteroscedastic`;

export const metadata = {
  title: "Homoscedasticity — Manifold",
  description:
    "Homoscedasticity means constant error variance. When variance grows with fitted values (heteroscedasticity), OLS standard errors are wrong and inference breaks.",
};

export default function HomoscedasticityPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--warn)")}>Assumptions</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 7 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Homoscedasticity
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        <em>Homos</em> = same, <em>skedasticity</em> = scatter. The variance of
        the errors should be the same everywhere along the fitted line. When it
        isn't — when errors fan out — every standard error in your output is
        wrong.
      </p>

      <Backlinks label="Related" items={[
        { label: "Heteroscedasticity in depth", href: "/learn/linear-regression/heteroscedasticity-in-depth" },
        { label: "Weighted least squares", href: "/learn/linear-regression/weighted-least-squares" },
        { label: "Residual-vs-fitted", href: "/learn/linear-regression/residual-vs-fitted" },
      ]} />

      <div className="lesson">
        <h2>The formal statement</h2>
        <p>
          Homoscedasticity requires that <code>Var(εᵢ) = σ²</code> for all i —
          the same constant σ² regardless of which row. The opposite,{" "}
          <strong>heteroscedasticity</strong>, means the variance depends on x
          (or on the fitted value ŷ):
        </p>
        <MathBlock>{String.raw`\operatorname{Var}(\varepsilon_i) = f(x_i) \quad \text{— wrong!}`}</MathBlock>

        <h2>Why it happens</h2>
        <div style={causeGrid}>
          <CauseCard title="Income / prices" body="Wealthier households have more variable spending. House prices in expensive areas vary more than in cheap ones. Multiplicative noise." color="var(--brand)" />
          <CauseCard title="Percentage outcomes" body="A model predicting vote share near 50% has more uncertainty than one predicting near 0% or 100%. Proportions are naturally bounded." color="var(--good)" />
          <CauseCard title="Omitted variables" body="A relevant variable you forgot to include might correlate with x. Its omission shows up as error variance that grows with x." color="var(--warn)" />
          <CauseCard title="Model mis-specification" body="Trying to fit a curved relationship with a straight line. Residuals are small in the middle, large at the extremes." color="var(--c-regression)" />
        </div>

        <h2>What it looks like</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, margin: "1.2rem 0" }}>
          <FanPlot good label="✓ Homoscedastic" caption="Residuals maintain constant width across fitted values — a horizontal band." />
          <FanPlot good={false} label="✗ Heteroscedastic (fan)" caption="Variance grows with fitted values — the classic 'fan' or 'cone' shape. OLS treats all residuals equally, inflating error estimates on the left and deflating on the right." />
        </div>

        <HomoscedasticityLab />

        <h2>Consequences</h2>
        <p>
          OLS minimises the sum of squared residuals, treating every observation
          equally. With heteroscedasticity, high-variance observations (with
          naturally large errors) get the same weight as low-variance ones.
          This makes OLS <strong>inefficient</strong> — not the best linear
          unbiased estimator. More importantly, the standard errors are wrong:{" "}
          some are too large, some too small. Hypothesis tests and confidence
          intervals based on them are unreliable.
        </p>
        <p>
          Importantly, point predictions (ŷ) are still unbiased — the mean is
          estimated correctly. It's only the <em>uncertainty quantification</em>{" "}
          that breaks.
        </p>

        <h2>Detection: formal tests</h2>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.85, color: "var(--muted)", fontSize: 15 }}>
          <li><strong style={{ color: "var(--ink)" }}>Breusch-Pagan test:</strong> regress squared residuals on the predictors. A significant result means heteroscedasticity.</li>
          <li><strong style={{ color: "var(--ink)" }}>White test:</strong> more general — includes all predictors, squares, and cross-products. Detects more complex forms.</li>
          <li><strong style={{ color: "var(--ink)" }}>Scale-location plot:</strong> √|residuals| vs fitted. A horizontal band = homoscedastic. A rising trend = heteroscedastic.</li>
        </ul>

        <h2>How to fix it</h2>
        <div style={fixGrid}>
          <FixItem title="Robust standard errors" body="(HC3 estimator) Keep OLS for β but use a sandwich estimator for SE. Quick fix, no model change needed. Default in many applied fields." color="var(--good)" />
          <FixItem title="Weighted least squares" body="Assign each observation weight 1/Var(εᵢ). Downweights high-variance observations. Requires knowing (or estimating) the variance function." color="var(--brand)" />
          <FixItem title="Log-transform the outcome" body="If y > 0 and variance is proportional to the mean (common in economic data), log(y) often stabilises variance." color="var(--c-fundamentals)" />
          <FixItem title="Box-Cox transformation" body="Generalises the log transform. Finds the power λ that best symmetrises the residuals. Useful when log isn't quite right." color="var(--c-regression)" />
        </div>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}>
            First fix: always try log(y)
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            If your outcome is a price, income, count, or any strictly positive
            value with a right-skewed distribution — try log(y) first. It often
            simultaneously fixes heteroscedasticity, non-normality of residuals,
            and mild non-linearity. If that works, you also get a convenient
            interpretation: coefficients become multiplicative effects (e.g.,
            "a 1-unit increase in x is associated with a 5% increase in y").
          </p>
        </div>

        <h2>Test for it yourself</h2>
        <p>
          The Breusch-Pagan test formalises the fan: regress the squared residuals
          on your predictors and see if they explain anything. From scratch, then
          via statsmodels:
        </p>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/independence-of-errors" style={navLink}>← Independence of errors</Link>
          <Link href="/learn/linear-regression/normality-of-residuals" style={navLink}>Next up · Normality of residuals →</Link>
        </div>
      </div>
    </article>
  );
}

function CauseCard({ title, body, color }: { title: string; body: string; color: string }) {
  return (
    <div style={{ background: `color-mix(in srgb, ${color} 5%, var(--surface-2))`, border: `1px solid color-mix(in srgb, ${color} 18%, var(--border))`, borderRadius: 12, padding: "11px 13px" }}>
      <div className="font-display" style={{ fontSize: 13, fontWeight: 600, color, marginBottom: 5 }}>{title}</div>
      <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.55 }}>{body}</p>
    </div>
  );
}

function FanPlot({ good, label, caption }: { good: boolean; label: string; caption: string }) {
  const W = 200, H = 120;
  const pts = Array.from({ length: 32 }, (_, i) => {
    const fx = 20 + (i / 31) * (W - 40);
    const spread = good ? 14 : 3 + (i / 31) * 38;
    const noise = Math.sin(i * 1.9) * spread;
    return { x: fx, y: H / 2 + noise };
  });
  return (
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: good ? "var(--good)" : "var(--bad)", marginBottom: 4 }}>{label}</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <line x1={20} y1={H / 2} x2={W - 20} y2={H / 2} stroke="var(--brand)" strokeWidth={1.2} strokeDasharray="4 3" strokeOpacity={0.7} />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={Math.max(6, Math.min(H - 6, p.y))} r={2.8}
            fill={good ? "var(--c-regression)" : "var(--warn)"} fillOpacity={0.85} />
        ))}
        <text x={W / 2} y={H - 2} fontSize={8.5} fill="var(--faint)" textAnchor="middle">fitted →</text>
      </svg>
      <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 5, lineHeight: 1.5 }}>{caption}</div>
    </div>
  );
}

function FixItem({ title, body, color }: { title: string; body: string; color: string }) {
  return (
    <div style={{ background: "var(--surface-2)", border: `1.5px solid color-mix(in srgb, ${color} 20%, var(--border))`, borderRadius: 12, padding: "11px 13px" }}>
      <div className="font-display" style={{ fontSize: 13, fontWeight: 600, color, marginBottom: 5 }}>{title}</div>
      <p style={{ margin: 0, fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}const causeGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, margin: "1.4rem 0" };
const fixGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, margin: "1.4rem 0" };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-fundamentals) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-fundamentals) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0 0" };
