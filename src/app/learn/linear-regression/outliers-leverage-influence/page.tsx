import Link from "next/link";
import { InfluenceLab } from "@/components/labs/InfluenceLab";

export const metadata = {
  title: "Outliers, leverage & influence — Manifold",
  description:
    "Not all outliers matter. A point needs both discrepancy and leverage to actually pull the regression line. Learn how Cook's Distance measures this influence.",
};

export default function OutliersLeverageInfluencePage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--brand)")}>Diagnostics</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 8 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Outliers, leverage & influence
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 620 }}>
        An outlier in the y-direction just increases your error. An outlier in
        the x-direction acts like a wrench, twisting the entire regression line
        to meet it.
      </p>

      <div className="lesson">
        <h2>The triad of unusual points</h2>
        <p>
          In regression, "outlier" is an ambiguous term. We need to split it
          into three specific concepts:
        </p>

        <div style={grid3}>
          <TriadCard title="Discrepancy (Outlier)" icon="↕️"
            body="An unusual y-value given its x. It falls far from the regression line, resulting in a large residual." />
          <TriadCard title="Leverage" icon="↔️"
            body="An unusual x-value. It lives far from the center of mass of the predictors. It has the potential to tilt the line, but might not." />
          <TriadCard title="Influence" icon="🧲"
            body="The combination of both. An influential point actually pulls the line toward itself. Dropping it drastically changes the coefficients." />
        </div>

        <p style={{ textAlign: "center", fontWeight: 600, fontSize: 15, color: "var(--brand)", margin: "1.8rem 0" }}>
          Influence ≈ Leverage × Discrepancy
        </p>

        <h2>Play with leverage</h2>
        <p>
          In the lab below, the red point starts in the middle (low leverage).
          Drag it straight up: the residual gets huge, but the line barely
          tilts. Now drag it far to the right (high leverage) and up: watch the
          line snap toward it.
        </p>

        <InfluenceLab />

        <h2>The math of leverage (h_ii)</h2>
        <p>
          Leverage is quantified by the diagonal elements of the "Hat Matrix" 
          <code>H = X(XᵀX)⁻¹Xᵀ</code>. The value <code>h_ii</code> measures how
          much observation <em>i</em> influences its own fitted value ŷᵢ.
        </p>
        <p>
          Leverage values are always between 0 and 1. The average leverage is
          p/n (parameters over sample size). A rule of thumb is to investigate
          any point with a leverage greater than <code>2p/n</code>. Notice that
          leverage only depends on X, not y. A point can have high leverage
          even if it perfectly follows the trend.
        </p>

        <h2>Cook's Distance</h2>
        <p>
          To measure actual <strong>influence</strong>, we use Cook's Distance
          (Cook's D). It measures how much <em>all</em> fitted values change when
          observation <em>i</em> is deleted from the dataset.
        </p>
        <p>
          You don't actually have to refit the model N times to calculate it.
          It can be computed directly from the residual and the leverage:
        </p>
        <div style={mathBlock}>Dᵢ = (rᵢ² / p·MSE) × [ hᵢᵢ / (1 - hᵢᵢ)² ]</div>
        <p>
          Notice the structure: it multiplies a function of the residual (rᵢ) by
          a function of the leverage (hᵢᵢ). A high Cook's D (usually &gt; 1, or
          &gt; 4/n) means this single data point is dictating your model's
          coefficients.
        </p>

        <h2>What to do with influential points</h2>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.85, color: "var(--muted)", fontSize: 15 }}>
          <li><strong style={{ color: "var(--ink)" }}>Check for errors.</strong> A misplaced decimal point is the most common cause of massive leverage.</li>
          <li><strong style={{ color: "var(--ink)" }}>Is it a different population?</strong> If you're modelling adult heights and an infant is in the dataset, it will have massive leverage. Remove it and state the model is for adults.</li>
          <li><strong style={{ color: "var(--ink)" }}>Robust regression.</strong> Models like Huber Regressor downweight points with huge residuals, resisting their pull.</li>
          <li><strong style={{ color: "var(--ink)" }}>Don't just delete them.</strong> Deleting a true observation just to make the R² look better is statistical malpractice. If it's real data, the model must account for it.</li>
        </ul>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression/heteroscedasticity-in-depth" style={navLink}>← Heteroscedasticity in depth</Link>
          <Link href="/learn/linear-regression/detecting-non-normality" style={navLink}>Next up · Detecting non-normality →</Link>
        </div>
      </div>
    </article>
  );
}

function TriadCard({ title, icon, body }: { title: string; icon: string; body: string }) {
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "13px 15px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span className="font-display" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{title}</span>
      </div>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const grid3: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, margin: "1.4rem 0" };
const mathBlock: React.CSSProperties = { fontFamily: "ui-monospace, monospace", fontSize: 15, background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 10, padding: "12px 18px", margin: "0.8rem 0 1.2rem", color: "var(--ink)", textAlign: "center" };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
