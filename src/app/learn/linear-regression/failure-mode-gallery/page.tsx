import Link from "next/link";

export const metadata = {
  title: "Failure-mode gallery — Manifold",
  description:
    "A rogue's gallery of the most common ways people ruin perfectly good linear regression models.",
};

export default function FailureModeGalleryPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--good)")}>In the wild</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 3 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Failure-mode gallery
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        Congratulations. You've made it to the end. Before you go out and build
        models in the real world, review these common traps.
      </p>

      <div className="lesson">
        <div style={{ display: "grid", gap: 16, margin: "2rem 0" }}>
          
          <FailureCard title="1. The Extrapolation Trap" color="var(--warn)"
            body="You trained a model on houses ranging from 1,000 to 3,000 sq ft. Someone asks you to predict the price of a 15,000 sq ft mega-mansion. You plug it into the formula and it gives you a number. That number is garbage. A regression line is only valid within the domain of the training data. Beyond that, you are making wild assumptions about the physics of the universe." />

          <FailureCard title="2. The Dummy Variable Trap" color="var(--bad)"
            body="You have a 'Season' column (Spring, Summer, Autumn, Winter). You one-hot encode it into 4 binary columns and throw them all into the model. The model explodes due to perfect multicollinearity (since Spring + Summer + Autumn + Winter exactly equals 1). Always drop one category to serve as the baseline." />

          <FailureCard title="3. The Omitted Variable Bias (Confounding)" color="var(--brand)"
            body="You find a strong positive coefficient showing that 'Ice cream sales' cause 'Drowning deaths'. You failed to include 'Temperature' in your model. When an unmeasured third variable causes both X and Y, your coefficients will capture the spurious correlation. OLS cannot save you from bad experimental design." />

          <FailureCard title="4. The p-Hacking Trap (Data Dredging)" color="var(--c-fundamentals)"
            body="You throw 200 random, useless features into a model. You look at the p-values. About 10 of them will be 'statistically significant' (p < 0.05) by pure random chance. You write a paper claiming you've discovered a new phenomenon. This is a statistical crime. Use Bonferroni corrections or regularization." />

          <FailureCard title="5. The R² Obsession" color="var(--ink)"
            body="You delete massive, highly-leveraged true outliers from your dataset simply because 'it made my R² go up from 0.6 to 0.8'. You have built a model that is beautifully accurate at predicting a fake, sanitized version of reality." />
            
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/when-to-use-it" style={navLink}>← When to use it</Link>
          <Link href="/learn/linear-regression/end-to-end-worked-case" style={navLink}>Next up · End-to-end worked case →</Link>
        </div>
      </div>
    </article>
  );
}

function FailureCard({ title, body, color }: { title: string; body: string; color: string }) {
  return (
    <div style={{ background: "var(--surface-2)", borderTop: `3px solid ${color}`, borderRadius: "0 0 12px 12px", padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
      <div className="font-display" style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>{title}</div>
      <p style={{ margin: 0, fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
