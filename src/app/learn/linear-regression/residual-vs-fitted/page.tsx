import { ResidualPatternLab } from "@/components/labs/ResidualPatternLab";
import { CodeBlock } from "@/components/CodeBlock";
import { REGRESSION_SETUP } from "@/lib/runtimeSetup";
import { Backlinks } from "@/components/Backlinks";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const codeScratch = `import numpy as np

rng = np.random.default_rng(1)
x = np.linspace(0, 10, 50)
y = 2 + 1.5*x + rng.normal(scale=2, size=50)

X = np.column_stack([np.ones_like(x), x])      # design matrix [1, x]
beta, *_ = np.linalg.lstsq(X, y, rcond=None)   # OLS fit
fitted = X @ beta
resid  = y - fitted

# in OLS, residuals are uncorrelated with the fitted values and average to ~0
print("corr(fitted, resid):", round(float(np.corrcoef(fitted, resid)[0, 1]), 6))
print("mean residual:      ", round(float(resid.mean()), 6))`;

const codeLib = `import numpy as np
import statsmodels.api as sm

rng = np.random.default_rng(1)
x = np.linspace(0, 10, 50)
y = 2 + 1.5*x + rng.normal(scale=2, size=50)

model  = sm.OLS(y, sm.add_constant(x)).fit()
resid  = model.resid          # statsmodels exposes residuals + fitted directly
fitted = model.fittedvalues

print("corr(fitted, resid):", round(float(np.corrcoef(fitted, resid)[0, 1]), 6))
print("mean residual:      ", round(float(resid.mean()), 6))`;

export const metadata = {
  title: "Residual-vs-fitted — Manifold",
  description:
    "The undisputed king of diagnostic plots. It reveals non-linearity, heteroscedasticity, and outliers all in one glance.",
};

export default function ResidualVsFittedPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Diagnostics", color: "var(--brand)" }]}
        time="about 4 minutes"
        title={<>Residual-vs-fitted</>}
        intro={<>
          If you only ever look at one plot after fitting a linear model, make it
        this one. It compresses three critical assumption checks into a single
        visualisation.
        </>}
      />

      <Backlinks label="Related" items={[
        { label: "Linearity", href: "/learn/linear-regression/linearity" },
        { label: "Homoscedasticity", href: "/learn/linear-regression/homoscedasticity" },
        { label: "Outliers & influence", href: "/learn/linear-regression/outliers-leverage-influence" },
      ]} />

      <div className="lesson">
        <h2>What it is</h2>
        <p>
          Plot the predicted values (ŷ) on the x-axis, and the residuals (y - ŷ)
          on the y-axis. By definition, ordinary least squares guarantees that
          the mean of the residuals is exactly zero. A horizontal line at 0
          represents a perfect prediction.
        </p>

        <h2>Why against fitted, not actual y?</h2>
        <p>
          A common mistake is plotting residuals against the actual outcome (y).
          Don't do this. Because <code>y = ŷ + ε</code>, the actual y inherently
          contains the residual ε. A plot of residuals vs actual y will{" "}
          <em>always</em> show an upward slope, even for a perfect model, which
          is highly misleading. Fitted values (ŷ), on the other hand, are strictly
          uncorrelated with the residuals in OLS.
        </p>

        <ResidualPatternLab />

        <h2>How to read it</h2>
        <p>
          A healthy residual-vs-fitted plot looks like a night sky: a random
          cloud of stars with no discernible shape, spread evenly above and
          below the zero line.
        </p>
        <div style={plotGrid}>
          <PatternCard label="✗ Arch / U-Shape" color="var(--warn)" 
            body="Indicates non-linearity. The model is systematically under-predicting the middle and over-predicting the extremes (or vice versa). Fix: Add polynomial terms." />
          <PatternCard label="✗ Fan / Cone" color="var(--bad)" 
            body="Indicates heteroscedasticity. The errors get larger as the predictions get larger. Fix: Log-transform y or use robust standard errors." />
          <PatternCard label="✗ Outlier" color="var(--brand)" 
            body="A point living far away from the horizontal zero band. It has a massive residual, but check its leverage before panicking." />
          <PatternCard label="✓ Random scatter" color="var(--good)" 
            body="The ideal state. No patterns, constant vertical spread, roughly symmetric around zero." />
        </div>

        <Callout color="var(--c-fundamentals)" title={<>The Scale-Location variant</>}>
          Sometimes it's hard to see if the spread is changing just by
            eyeballing a cloud of points. The <strong>Scale-Location plot</strong>
            {" "}plots the square root of the absolute standardized residuals
            against fitted values. This folds the negative residuals up, so a
            flat trend line means homoscedasticity, and an upward sloping trend
            line screams heteroscedasticity.
        </Callout>

        <h2>Compute it yourself</h2>
        <p>
          Fit the line, subtract to get residuals, plot them against the fitted
          values. The from-scratch version makes the OLS guarantee visible: fitted
          and residual are uncorrelated.
        </p>
        <CodeBlock setup={REGRESSION_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/linear-regression/multicollinearity", label: <>← Multicollinearity</> }} next={{ href: "/learn/linear-regression/heteroscedasticity-in-depth", label: <>Next up · Heteroscedasticity in depth →</> }} />
      </div>
    </article>
  );
}

function PatternCard({ label, body, color }: { label: string; body: string; color: string }) {
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px" }}>
      <div className="font-display" style={{ fontSize: 13.5, fontWeight: 600, color, marginBottom: 5 }}>{label}</div>
      <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.55 }}>{body}</p>
    </div>
  );
}


const plotGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, margin: "1.4rem 0" };


