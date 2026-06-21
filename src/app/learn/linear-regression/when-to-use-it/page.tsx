import Link from "next/link";

export const metadata = {
  title: "When to use it (vs trees, GLMs) — Manifold",
  description:
    "Linear regression isn't just a stepping stone; it's often the final destination. Learn when to choose it over Random Forests, XGBoost, or GLMs.",
};

export default function WhenToUseItPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--good)")}>In the wild</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 4 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        When to use it
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        In the age of Deep Learning and gradient boosted trees, why would anyone
        still use a 200-year-old algorithm? Because inference often beats
        prediction.
      </p>

      <div className="lesson">
        <h2>Inference vs Prediction</h2>
        <p>
          Machine learning tasks fall into two broad buckets:
        </p>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.85, color: "var(--muted)", fontSize: 15 }}>
          <li><strong style={{ color: "var(--ink)" }}>Prediction:</strong> "I don't care how it works, just give me the most accurate forecast possible." (e.g., algorithmic trading, image recognition).</li>
          <li><strong style={{ color: "var(--ink)" }}>Inference:</strong> "I need to understand the exact relationship between X and Y." (e.g., medicine, economics, public policy).</li>
        </ul>
        <p>
          If your goal is pure prediction, an XGBoost model or a Neural Network
          will almost always beat Linear Regression. But if your goal is
          inference, Linear Regression is king.
        </p>

        <h2>Linear Regression vs Tree-based Models</h2>
        <div style={grid2}>
          <CompareCard title="Linear Regression" color="var(--brand)"
            body="Outputs exact coefficients ('If you lower the price by $1, sales increase by 14 units'). Extrapolates gracefully beyond the training data bounds. Requires heavy feature engineering and careful assumption checking." />
          <CompareCard title="Random Forest / XGBoost" color="var(--c-fundamentals)"
            body="A black box. Cannot give you an exact coefficient. Terribly at extrapolating (trees predict flat lines outside training data). Handles non-linearities and missing data automatically without you thinking about it." />
        </div>

        <h2>When Linear Regression is the wrong tool</h2>
        <p>
          Even if you want inference, OLS Linear Regression makes a massive
          assumption: that the outcome variable is continuous and spans from
          negative infinity to positive infinity.
        </p>
        <p>
          If your outcome violates this, you must switch to the <strong>Generalized
          Linear Model (GLM)</strong> family:
        </p>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.85, color: "var(--muted)", fontSize: 15 }}>
          <li><strong style={{ color: "var(--warn)" }}>Binary outcomes (0 or 1):</strong> Predicting whether a user will click or not. OLS will output nonsense probabilities like 1.4 or -0.2. Use <strong>Logistic Regression</strong>.</li>
          <li><strong style={{ color: "var(--warn)" }}>Count data (0, 1, 2, 3...):</strong> Predicting the number of traffic accidents at an intersection. OLS assumes negative accidents are possible. Use <strong>Poisson or Negative Binomial Regression</strong>.</li>
          <li><strong style={{ color: "var(--warn)" }}>Time-to-event (Survival):</strong> Predicting how long until a machine breaks. Data is often right-censored (the machine hasn't broken yet). Use <strong>Cox Proportional Hazards</strong>.</li>
        </ul>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--good)", marginBottom: 4 }}>
            The Occam's Razor baseline
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Even if you plan to build a massive Deep Neural Network, 
            <strong> you must always build a Linear Regression model first.</strong>
            {" "}It provides a strict baseline. If your billion-parameter Neural
            Network cannot beat a simple OLS model with 5 features, you have a
            problem.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/prediction-intervals" style={navLink}>← Prediction intervals</Link>
          <Link href="/learn/linear-regression/failure-mode-gallery" style={navLink}>Next up · Failure-mode gallery →</Link>
        </div>
      </div>
    </article>
  );
}

function CompareCard({ title, body, color }: { title: string; body: string; color: string }) {
  return (
    <div style={{ padding: "14px 16px", borderLeft: `3px solid ${color}`, background: "var(--surface-2)", borderRadius: "0 12px 12px 0" }}>
      <div className="font-display" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>{title}</div>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, margin: "1.4rem 0" };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--good) 10%, var(--surface))", border: "1px solid color-mix(in srgb, var(--good) 25%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0 0" };
