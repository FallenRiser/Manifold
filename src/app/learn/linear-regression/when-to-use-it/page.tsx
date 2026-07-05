import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "When to use it (vs trees, GLMs) — Manifold",
  description:
    "Linear regression isn't just a stepping stone; it's often the final destination. Learn when to choose it over Random Forests, XGBoost, or GLMs.",
};

export default function WhenToUseItPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "In the wild", color: "var(--good)" }]}
        time="about 4 minutes"
        title={<>When to use it</>}
        intro={<>
          In the age of Deep Learning and gradient boosted trees, why would anyone
        still use a 200-year-old algorithm? Because inference often beats
        prediction.
        </>}
      />

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

        <Callout color="var(--good)" title={<>The Occam's Razor baseline</>}>
          Even if you plan to build a massive Deep Neural Network, 
            <strong> you must always build a Linear Regression model first.</strong>
            {" "}It provides a strict baseline. If your billion-parameter Neural
            Network cannot beat a simple OLS model with 5 features, you have a
            problem.
        </Callout>

        <PrevNext prev={{ href: "/learn/linear-regression/prediction-intervals", label: <>← Prediction intervals</> }} next={{ href: "/learn/linear-regression/failure-mode-gallery", label: <>Next up · Failure-mode gallery →</> }} />
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

const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, margin: "1.4rem 0" };
