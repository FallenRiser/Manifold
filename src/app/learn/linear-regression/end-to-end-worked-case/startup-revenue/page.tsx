import Link from "next/link";
import { CaseTracker } from "@/components/CaseTracker";
import { CodeBlock } from "@/components/CodeBlock";
import { Backlinks } from "@/components/Backlinks";

export const metadata = {
  title: "Case A: Startup Revenue — Manifold",
  description: "A clean, simple linear-regression case study that walks the full workflow end to end: framing, EDA, fitting, diagnostics, and interpretation.",
};

// ---- data (a fabricated 12-month SaaS startup) ----
const AD = [1200, 1500, 1800, 2200, 2600, 3000, 3100, 3300, 3500, 3800, 4000, 4200];
const CALLS = [45, 50, 52, 60, 65, 75, 80, 82, 90, 95, 100, 105];
const REV = [15000, 17500, 19000, 23000, 27000, 31000, 32500, 34000, 37000, 41000, 42000, 45000];
const N = REV.length;

function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const pv = M[c][c];
    for (let j = c; j <= n; j++) M[c][j] /= pv;
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c]; for (let j = c; j <= n; j++) M[r][j] -= f * M[c][j]; }
  }
  return M.map((r) => r[n]);
}

// normal equation on [1, ad, calls]
const rows = AD.map((a, i) => [1, a, CALLS[i]]);
const XtX = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
const Xty = [0, 0, 0];
for (let i = 0; i < N; i++) for (let r = 0; r < 3; r++) { Xty[r] += rows[i][r] * REV[i]; for (let c = 0; c < 3; c++) XtX[r][c] += rows[i][r] * rows[i][c]; }
const theta = solve(XtX, Xty);
const fitted = rows.map((r) => r[0] * theta[0] + r[1] * theta[1] + r[2] * theta[2]);
const resid = REV.map((y, i) => y - fitted[i]);
const ybar = REV.reduce((s, y) => s + y, 0) / N;
const r2 = 1 - resid.reduce((s, e) => s + e * e, 0) / REV.reduce((s, y) => s + (y - ybar) ** 2, 0);

// EDA scatter geometry (revenue vs ad spend)
const ex = (a: number) => 42 + ((a - 1100) / 3200) * 406;
const ey = (r: number) => 168 - ((r - 14000) / 32000) * 150;
// residual-vs-fitted geometry
const fmin = Math.min(...fitted), fmax = Math.max(...fitted);
const maxAbs = Math.max(...resid.map((e) => Math.abs(e))) * 1.15;
const rx = (f: number) => 42 + ((f - fmin) / (fmax - fmin)) * 406;
const ry = (e: number) => 93 - (e / maxAbs) * 72;

const codeData = `import numpy as np

# 12 months of a B2B SaaS startup
# Features: [Ad spend ($), Sales calls made]
X = np.array([
    [1200, 45], [1500, 50], [1800, 52], [2200, 60],
    [2600, 65], [3000, 75], [3100, 80], [3300, 82],
    [3500, 90], [3800, 95], [4000, 100], [4200, 105],
])
y = np.array([15000, 17500, 19000, 23000, 27000, 31000,
              32500, 34000, 37000, 41000, 42000, 45000])

# EDA: how strongly does each feature move with revenue?
print("corr(ad spend, revenue):", round(np.corrcoef(X[:,0], y)[0,1], 3))
print("corr(sales calls, revenue):", round(np.corrcoef(X[:,1], y)[0,1], 3))`;

const codeFitScratch = `import numpy as np

X = np.array([[1200,45],[1500,50],[1800,52],[2200,60],[2600,65],[3000,75],
              [3100,80],[3300,82],[3500,90],[3800,95],[4000,100],[4200,105]])
y = np.array([15000,17500,19000,23000,27000,31000,
              32500,34000,37000,41000,42000,45000])

# Add a bias column of 1s so the intercept is just another weight
Xb = np.column_stack([np.ones(len(X)), X])

# Normal equation:  theta = (X't X)^-1 X't y   (solved stably, no explicit inverse)
theta = np.linalg.solve(Xb.T @ Xb, Xb.T @ y)

y_hat = Xb @ theta
r2 = 1 - np.sum((y - y_hat)**2) / np.sum((y - y.mean())**2)

print(f"intercept (base revenue): \${theta[0]:,.0f}")
print(f"per $1 of ad spend:       \${theta[1]:.2f}")
print(f"per sales call:           \${theta[2]:,.0f}")
print(f"R²: {r2:.4f}")`;

const codeFitLib = `import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score

X = np.array([[1200,45],[1500,50],[1800,52],[2200,60],[2600,65],[3000,75],
              [3100,80],[3300,82],[3500,90],[3800,95],[4000,100],[4200,105]])
y = np.array([15000,17500,19000,23000,27000,31000,
              32500,34000,37000,41000,42000,45000])

model = LinearRegression()          # handles the bias term for you
model.fit(X, y)

print(f"intercept (base revenue): \${model.intercept_:,.0f}")
print(f"per $1 of ad spend:       \${model.coef_[0]:.2f}")
print(f"per sales call:           \${model.coef_[1]:,.0f}")
print(f"R²: {r2_score(y, model.predict(X)):.4f}")

# Predict next month: $4,500 ad spend, 110 calls
print("forecast:", model.predict([[4500, 110]]).round(0))`;

export default function StartupRevenueCasePage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--good)")}>In the wild</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· Case A · ~10 min</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Case A: Startup revenue
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        We start clean and simple — so the <em>shape</em> of the whole workflow is easy to see.
        Frame it, look at it, fit it, check it, explain it. Cases B and C bring the mess.
      </p>

      <CaseTracker />

      <div className="lesson">
        <Phase n="0" title="Frame the problem">
          <p style={pp}>
            <strong>The business question:</strong> a B2B SaaS startup spends on ads and makes
            sales calls. Which one actually drives revenue, and by how much? Before any code, we
            pin down exactly what we&rsquo;re predicting and from what.
          </p>
          <ul style={ul}>
            <li><strong style={{ color: "var(--ink)" }}>Target (y):</strong> monthly revenue, in dollars — a continuous number, so this is regression.</li>
            <li><strong style={{ color: "var(--ink)" }}>Features (X):</strong> ad spend ($) and sales calls made.</li>
          </ul>
          <Backlinks items={[
            { label: "Why predict at all?", href: "/learn/linear-regression/why-predict-at-all" },
            { label: "What a model really is", href: "/learn/linear-regression/what-a-model-really-is" },
          ]} />
        </Phase>

        <Phase n="1" title="Look at the data first">
          <p style={pp}>
            Never fit blind. A quick scatter of revenue against ad spend shows a clean, strong,
            upward-sloping relationship — exactly the kind a straight line handles well. Both
            features are tightly correlated with revenue (run the code to see ~0.99 each).
          </p>
          <Figure caption="Revenue rises almost linearly with ad spend — a straight line is a sensible model here.">
            <svg viewBox="0 0 460 190" style={{ width: "100%", height: "auto", display: "block" }}>
              <rect x={42} y={18} width={406} height={150} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
              {[20000, 30000, 40000].map((g) => (
                <line key={g} x1={42} y1={ey(g)} x2={448} y2={ey(g)} stroke="var(--border)" />
              ))}
              {AD.map((a, i) => (
                <circle key={i} cx={ex(a)} cy={ey(REV[i])} r={4} fill="var(--c-regression)" />
              ))}
              <text x={245} y={186} fontSize={11} fill="var(--faint)" textAnchor="middle">ad spend ($) →</text>
              <text x={13} y={93} fontSize={11} fill="var(--faint)" textAnchor="middle" transform="rotate(-90 13 93)">revenue ($) →</text>
            </svg>
          </Figure>
          <Backlinks items={[
            { label: "The line of best fit", href: "/learn/linear-regression" },
            { label: "What is error?", href: "/learn/linear-regression/what-is-error" },
          ]} />
        </Phase>

        <CodeBlock fromScratch={codeData} withLibrary={codeData} />

        <Phase n="2" title="Prepare the data">
          <p style={pp}>
            This dataset is deliberately tidy: no missing values, no categories to encode, no wild
            outliers. So feature engineering is light. One honest note: the two features live on
            very different scales (thousands of dollars vs dozens of calls). That wouldn&rsquo;t
            bother the closed-form solution we&rsquo;re about to use, but it <em>would</em> matter
            if we trained with gradient descent — which is exactly why scaling exists.
          </p>
          <Backlinks items={[
            { label: "Feature scaling", href: "/learn/linear-regression/feature-scaling" },
            { label: "Categorical features", href: "/learn/linear-regression/categorical-features" },
          ]} />
        </Phase>

        <Phase n="3" title="Choose the model">
          <p style={pp}>
            Two features, twelve rows. With data this small, there&rsquo;s no reason to iterate —
            we can jump straight to the exact answer with the <strong>normal equation</strong>
            (ordinary least squares). No learning rate, no convergence to babysit; one matrix solve
            and we&rsquo;re done.
          </p>
          <Backlinks items={[
            { label: "The normal equation", href: "/learn/linear-regression/the-normal-equation" },
            { label: "Closed-form vs gradient descent", href: "/learn/linear-regression/closed-form-vs-gradient-descent" },
          ]} />
        </Phase>

        <Phase n="4" title="Fit it, and read the coefficients">
          <p style={pp}>
            Here&rsquo;s the same fit two ways — the normal equation from scratch, and one line of
            scikit-learn. They give identical numbers. Hit <strong>Run</strong> to execute it live.
          </p>
        </Phase>

        <CodeBlock fromScratch={codeFitScratch} withLibrary={codeFitLib} />

        <div style={resultGrid}>
          <Stat label="base revenue (intercept)" value={`$${Math.round(theta[0]).toLocaleString()}`} />
          <Stat label="per $1 of ad spend" value={`$${theta[1].toFixed(2)}`} />
          <Stat label="per sales call" value={`$${Math.round(theta[2]).toLocaleString()}`} />
          <Stat label="R²" value={r2.toFixed(4)} accent />
        </div>
        <Backlinks items={[
          { label: "The cost function", href: "/learn/linear-regression/the-cost-function" },
          { label: "R² and adjusted R²", href: "/learn/linear-regression/r-squared-and-adjusted" },
        ]} />

        <Phase n="5" title="Check the residuals">
          <p style={pp}>
            A high R² isn&rsquo;t a free pass — we still look at the leftovers. Plotting each
            residual against the fitted value should look like a structureless cloud around zero.
            If it curved or fanned out, our straight-line assumption would be in trouble. It
            doesn&rsquo;t here: the errors scatter randomly and small.
          </p>
          <Figure caption="Residuals vs fitted: a flat, patternless band around zero — the linear model is appropriate.">
            <svg viewBox="0 0 460 190" style={{ width: "100%", height: "auto", display: "block" }}>
              <rect x={42} y={18} width={406} height={150} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
              <line x1={42} y1={ry(0)} x2={448} y2={ry(0)} stroke="var(--brand)" strokeWidth={1.4} strokeDasharray="4 3" strokeOpacity={0.7} />
              {fitted.map((f, i) => (
                <circle key={i} cx={rx(f)} cy={ry(resid[i])} r={4} fill="var(--c-regression)" />
              ))}
              <text x={245} y={186} fontSize={11} fill="var(--faint)" textAnchor="middle">fitted value →</text>
              <text x={13} y={93} fontSize={11} fill="var(--faint)" textAnchor="middle" transform="rotate(-90 13 93)">residual</text>
            </svg>
          </Figure>
          <Backlinks items={[
            { label: "Residual-vs-fitted", href: "/learn/linear-regression/residual-vs-fitted" },
            { label: "The five assumptions", href: "/learn/linear-regression/the-five-assumptions" },
          ]} />
        </Phase>

        <Phase n="6" title="Interpret &amp; predict">
          <p style={pp}>
            Now the payoff — plain-English meaning. Holding sales calls fixed, each extra{" "}
            <strong>$1 of ad spend is associated with about ${theta[1].toFixed(2)} of revenue</strong>;
            holding ad spend fixed, each extra <strong>sales call is worth about $
            {Math.round(theta[2]).toLocaleString()}</strong>. Plug in next month&rsquo;s planned
            spend and call volume and the model returns a forecast (see the last line of the
            library tab).
          </p>
          <Backlinks items={[
            { label: "Multiple linear regression", href: "/learn/linear-regression/multiple-linear-regression" },
          ]} />
        </Phase>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 15, fontWeight: 600, color: "var(--good)", marginBottom: 6 }}>
            Case A complete — that&rsquo;s the whole skeleton
          </div>
          <p style={{ margin: 0, color: "var(--ink)", fontSize: 14.5, lineHeight: 1.65 }}>
            Frame → look → prepare → choose → fit → check → interpret. Every real project is this
            loop. The catch: real data fights you at every step. <strong>Case B</strong> takes a
            messy 20k-row housing dataset with a skewed target, features on clashing scales, and
            diagnostics that actually fail — and shows what you do about it.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/end-to-end-worked-case" style={navLink}>← Overview</Link>
          <Link href="/learn/linear-regression/end-to-end-worked-case/house-prices" style={{ ...navLink, fontWeight: 600 }}>Case B: House prices →</Link>
        </div>
      </div>
    </article>
  );
}

function Phase({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ margin: "28px 0 8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={stepBadge}>Phase {n}</span>
        <h2 className="font-display" style={{ fontSize: 19, fontWeight: 500, color: "var(--ink)", margin: 0 }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Figure({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, margin: "1.2rem 0" }}>
      {children}
      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>{caption}</div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ background: accent ? "color-mix(in srgb, var(--good) 10%, var(--surface))" : "var(--surface-2)", border: accent ? "1px solid color-mix(in srgb, var(--good) 25%, var(--border))" : "1px solid var(--border)", borderRadius: 12, padding: "11px 13px" }}>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 500, color: accent ? "var(--good)" : "var(--ink)", fontFamily: "var(--font-geist-mono, monospace)" }}>{value}</div>
    </div>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}

const pp: React.CSSProperties = { margin: "0 0 10px", fontSize: 15, color: "var(--muted)", lineHeight: 1.65 };
const ul: React.CSSProperties = { margin: "0 0 4px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const stepBadge: React.CSSProperties = { display: "inline-block", background: "var(--brand)", color: "white", fontSize: 11, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 6 };
const resultGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, margin: "1.4rem 0 0.4rem" };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--good) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--good) 24%, var(--border))", borderRadius: 12, padding: "16px 18px", margin: "2.2rem 0 0" };
