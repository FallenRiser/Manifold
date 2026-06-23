import Link from "next/link";
import { NormalityLab } from "@/components/labs/NormalityLab";
import { CodeBlock } from "@/components/CodeBlock";
import { Backlinks } from "@/components/Backlinks";

const codeScratch = `import numpy as np

rng = np.random.default_rng(3)
x = np.linspace(0, 10, 200)
y = 2 + 1.5*x + (rng.exponential(scale=2, size=200) - 2)   # skewed errors
X = np.column_stack([np.ones_like(x), x])

beta, *_ = np.linalg.lstsq(X, y, rcond=None)
r = y - X @ beta
z = (r - r.mean()) / r.std()

skew = np.mean(z**3)            # 0 for a normal
kurt = np.mean(z**4) - 3        # excess kurtosis, 0 for a normal
print(f"skewness: {skew:.3f}   excess kurtosis: {kurt:.3f}")`;

const codeLib = `import numpy as np
from scipy import stats

rng = np.random.default_rng(3)
x = np.linspace(0, 10, 200)
y = 2 + 1.5*x + (rng.exponential(scale=2, size=200) - 2)
r = y - np.polyval(np.polyfit(x, y, 1), x)

print(f"skewness: {stats.skew(r):.3f}")
W, p = stats.shapiro(r)        # formal normality test
print(f"Shapiro-Wilk W: {W:.3f}   p-value: {p:.4f}")   # p<0.05 => not normal`;

export const metadata = {
  title: "Normality of residuals — Manifold",
  description:
    "The least important assumption in large samples, but critical in small ones. Here's why OLS assumes normal errors and how the Central Limit Theorem saves you.",
};

export default function NormalityOfResidualsPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--warn)")}>Assumptions</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 5 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Normality of residuals
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        The most misunderstood assumption. Your predictors don't need to be
        normal. Your outcome doesn't need to be normal. Only the <em>residuals</em>
        {" "}need to be normal — and even then, only sometimes.
      </p>

      <Backlinks label="Related" items={[
        { label: "Detecting non-normality", href: "/learn/linear-regression/detecting-non-normality" },
        { label: "Transformations", href: "/learn/linear-regression/transformations" },
        { label: "Confidence intervals", href: "/learn/linear-regression/confidence-intervals" },
      ]} />

      <div className="lesson">
        <h2>What it says</h2>
        <p>
          The assumption is that the true error term ε follows a normal
          (Gaussian) distribution: <code>ε ~ N(0, σ²)</code>.
        </p>
        <p>
          Let's clear up the biggest misconception first: linear regression does{" "}
          <strong>not</strong> assume that your features (X) or your outcome (y)
          are normally distributed. A binary feature is entirely non-normal. An
          outcome with two peaks is non-normal. That's perfectly fine. The model
          only cares about the noise left over <em>after</em> the predictors
          have done their job.
        </p>

        <h2>Why it matters (and when it doesn't)</h2>
        <p>
          The Gauss-Markov theorem proves that OLS gives you the best linear
          unbiased estimates (BLUE) <em>without</em> assuming normality. The
          coefficients you calculate will still be unbiased and have minimum
          variance among linear estimators.
        </p>
        <p>
          So why do we care? <strong>Inference.</strong> If you want to compute
          p-values, construct confidence intervals, or run hypothesis tests (like
          t-tests on coefficients or F-tests on the model), you need to know the
          sampling distribution of your coefficients. If the errors are normal,
          the coefficients are exactly normally distributed, and your p-values
          are exact.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}>
            The Central Limit Theorem rescue
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Here is the secret: as your sample size grows, the sampling
            distribution of the coefficients approaches normality <em>regardless
            of the distribution of the errors</em>. If you have a few hundred
            observations, mild non-normality in the residuals simply doesn't
            matter. Your p-values will still be valid. Normality is only a strict
            requirement for <strong>small samples</strong> (N &lt; 30-50).
          </p>
        </div>

        <h2>Prediction intervals are different</h2>
        <p>
          There is one place where normality always matters: <strong>prediction
          intervals</strong>. A confidence interval bounds the <em>average</em>
          {" "}y; a prediction interval bounds a <em>single new observation</em>.
          Because a single observation includes the raw error term ε, if ε isn't
          normal, your prediction interval will have the wrong coverage.
        </p>

        <NormalityLab />

        <h2>How to detect it</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, margin: "1.4rem 0" }}>
          <DiagCard title="Q-Q Plot (Quantile-Quantile)" body="Plots the sorted residuals against theoretical normal quantiles. Points should fall on a 45-degree line. Deviation at the ends = heavy tails." />
          <DiagCard title="Histogram / KDE" body="Plot a histogram of the residuals and overlay a normal curve. Good for spotting severe skewness or bimodality." />
          <DiagCard title="Shapiro-Wilk test" body="A formal statistical test for normality. Warning: in large samples, it will flag trivial deviations as 'significant'." />
          <DiagCard title="Jarque-Bera test" body="Checks if the skewness and kurtosis match a normal distribution. Often used in econometrics." />
        </div>

        <h2>What the Q-Q plot looks like</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, margin: "1.2rem 0" }}>
          <QQPlot type="normal" label="✓ Normal" caption="Points track the diagonal line closely." />
          <QQPlot type="heavy" label="✗ Heavy tails" caption="Points curve away at both ends (S-shape). The errors produce more extreme outliers than expected." />
          <QQPlot type="skewed" label="✗ Skewed" caption="Points curve away on one side (U-shape). Residuals have a long tail in one direction." />
        </div>

        <h2>How to fix it</h2>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.85, color: "var(--muted)", fontSize: 15 }}>
          <li>
            <strong style={{ color: "var(--ink)" }}>Check for outliers.</strong>{" "}
            A single massive outlier will ruin the normality of residuals. Decide if it's a data error or a genuine extreme event.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Transform the outcome.</strong>{" "}
            If the residuals are heavily right-skewed, log(y) or √y often pulls them back toward symmetry.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Bootstrapping.</strong>{" "}
            If you need valid p-values in a small sample with non-normal errors, resample your data with replacement to build an empirical distribution for your coefficients.
          </li>
        </ul>

        <h2>Measure it yourself</h2>
        <p>
          Standardise the residuals and the third and fourth moments give skew and
          kurtosis; SciPy adds the formal Shapiro-Wilk test.
        </p>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/homoscedasticity" style={navLink}>← Homoscedasticity</Link>
          <Link href="/learn/linear-regression/multicollinearity" style={navLink}>Next up · Multicollinearity →</Link>
        </div>
      </div>
    </article>
  );
}

function DiagCard({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px" }}>
      <div className="font-display" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", marginBottom: 5 }}>{title}</div>
      <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.55 }}>{body}</p>
    </div>
  );
}

function QQPlot({ type, label, caption }: { type: "normal" | "heavy" | "skewed"; label: string; caption: string }) {
  const W = 160, H = 160;
  const isGood = type === "normal";
  const pts = Array.from({ length: 25 }, (_, i) => {
    const q = -2 + (i / 24) * 4; // theoretical quantile
    let r = q; // actual residual
    if (type === "heavy") {
      r = q + Math.sign(q) * Math.pow(Math.abs(q), 2) * 0.4;
    } else if (type === "skewed") {
      r = q + Math.pow(q, 2) * 0.3;
    }
    // Add bit of noise
    r += (Math.sin(i * 3.1) * 0.1);
    
    // Map to coords
    const x = 20 + ((q - -3) / 6) * (W - 40);
    const y = H - 20 - ((r - -3) / 6) * (H - 40);
    return { x, y };
  });

  return (
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: isGood ? "var(--good)" : "var(--bad)", marginBottom: 4 }}>{label}</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <line x1={20} y1={H - 20} x2={W - 20} y2={20} stroke="var(--brand)" strokeWidth={1.5} strokeDasharray="3 3" strokeOpacity={0.6} />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={isGood ? "var(--c-regression)" : "var(--warn)"} fillOpacity={0.8} />
        ))}
      </svg>
      <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 5, lineHeight: 1.5 }}>{caption}</div>
    </div>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-fundamentals) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-fundamentals) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0 0" };
