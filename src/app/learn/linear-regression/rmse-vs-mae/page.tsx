import Link from "next/link";
import { ErrorMetricsLab } from "@/components/labs/ErrorMetricsLab";

export const metadata = {
  title: "RMSE vs MAE — Manifold",
  description:
    "R² is a percentage. RMSE and MAE are in the actual units of your outcome. Here's why you should care about the difference between absolute and squared errors.",
};

export default function RmseVsMaePage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--good)")}>Evaluation</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        RMSE vs MAE
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        R² tells you how much variance you explained. But if you want to know
        "how many dollars am I off by, on average?", you need error metrics in
        the original units.
      </p>

      <div className="lesson">
        <h2>Mean Absolute Error (MAE)</h2>
        <p>
          MAE is exactly what it sounds like. Take the absolute value of every
          error, and find the average.
        </p>
        <div style={mathBlock}>MAE = (1/N) ∑ |yᵢ − ŷᵢ|</div>
        <p>
          If you are predicting house prices and your MAE is $20,000, it means
          your predictions are off by $20,000 on average. It is perfectly
          intuitive and linear: an error of $100k is exactly twice as bad as an
          error of $50k.
        </p>

        <h2>Root Mean Squared Error (RMSE)</h2>
        <p>
          RMSE is the standard deviation of the residuals. It squares the
          errors, averages them, and takes the square root to get back to the
          original units.
        </p>
        <div style={mathBlock}>RMSE = √ [ (1/N) ∑ (yᵢ − ŷᵢ)² ]</div>
        <p>
          Because OLS minimizes the sum of squared errors, RMSE is the metric
          that the algorithm itself is optimizing.
        </p>

        <h2>The quadratic penalty</h2>
        <p>
          In MAE, a $100k error is twice as bad as a $50k error. In RMSE,
          because of the square, a $100k error is <strong>four times</strong> as
          bad as a $50k error.
        </p>
        <p>
          This means RMSE is highly sensitive to large errors (outliers). Play
          with the slider below. Watch how pushing one single point further away
          causes the MAE to grow linearly, while the RMSE accelerates.
        </p>

        <ErrorMetricsLab />

        <h2>Which one should you use?</h2>
        <p>
          It depends entirely on your business problem. Ask yourself: <em>How
          bad is a really big error?</em>
        </p>
        <div style={grid2}>
          <ChoiceCard title="Use RMSE when..." color="var(--warn)" 
            body="Large errors are disproportionately expensive. If being off by $100k bankrupts the company, but being off by $10k just costs a small fee, you want a metric that screams at you when large errors occur." />
          <ChoiceCard title="Use MAE when..." color="var(--good)" 
            body="All errors cost you linearly. If being off by $100k is exactly ten times as bad as being off by $10k, use MAE. It is also more robust to unavoidable outliers in your dataset." />
        </div>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fundamentals)", marginBottom: 4 }}>
            The persistent gap
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Because of the math, RMSE will always be greater than or equal to
            MAE. They are only equal if every single error is exactly the same
            size. The larger the gap between your RMSE and MAE, the more variance
            there is in the sizes of your errors (i.e., you have some huge outliers).
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/r-squared-and-adjusted" style={navLink}>← R² and adjusted R²</Link>
          <Link href="/learn/linear-regression/cross-validation-bias-variance" style={navLink}>Next up · Cross-validation & bias–variance →</Link>
        </div>
      </div>
    </article>
  );
}

function ChoiceCard({ title, body, color }: { title: string; body: string; color: string }) {
  return (
    <div style={{ padding: "14px 16px", borderTop: `3px solid ${color}`, background: "var(--surface-2)", borderRadius: "0 0 12px 12px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
      <div className="font-display" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>{title}</div>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const mathBlock: React.CSSProperties = { fontFamily: "ui-monospace, monospace", fontSize: 15, background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 10, padding: "12px 18px", margin: "0.8rem 0 1.2rem", color: "var(--ink)", textAlign: "center" };
const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, margin: "1.4rem 0" };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-fundamentals) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-fundamentals) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0 0" };
