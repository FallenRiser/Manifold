import Link from "next/link";

export const metadata = {
  title: "Ridge vs Lasso vs Elastic-net: which when — Manifold",
  description:
    "A practical decision guide. What each penalty does to coefficients, when each is the right call, and the default workflow for choosing among them on a real problem.",
};

type Row = { dim: string; ridge: string; lasso: string; enet: string };
const ROWS: Row[] = [
  { dim: "Coefficients", ridge: "All shrunk, none zero", lasso: "Some exactly zero (sparse)", enet: "Some zero, groups kept" },
  { dim: "Feature selection", ridge: "No", lasso: "Yes (aggressive)", enet: "Yes (grouped)" },
  { dim: "Correlated features", ridge: "Shares weight across them", lasso: "Picks one arbitrarily", enet: "Keeps them together" },
  { dim: "p ≫ n", ridge: "Fine, keeps all", lasso: "Caps at n features", enet: "No cap, sparse" },
  { dim: "Solution", ridge: "Closed form", lasso: "Iterative (CD/LARS)", enet: "Iterative (CD)" },
  { dim: "Hyperparameters", ridge: "λ", lasso: "λ", enet: "λ and α (mix)" },
  { dim: "Best when…", ridge: "Many small effects, multicollinearity", lasso: "Few strong effects, want a short list", enet: "Correlated groups + want sparsity" },
];

export default function WhichWhenPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-regression)")}>Regression</span>
        <span style={chip("var(--c-metrics)")}>Reference</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Ridge vs Lasso vs Elastic-net: which when
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Three penalties, one decision. This page distils the whole track into a practical guide: what each
        does, and how to pick on a real problem without agonising.
      </p>

      <div className="lesson">
        <h2>Side by side</h2>
        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr>
                {["", "Ridge (L2)", "Lasso (L1)", "Elastic-net"].map((h, i) => (
                  <th key={h} style={{ ...th, color: i === 0 ? "var(--muted)" : "var(--c-regression)" }}>{h || "Dimension"}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.dim}>
                  <td style={{ ...td, fontWeight: 600, color: "var(--ink)" }}>{r.dim}</td>
                  <td style={td}>{r.ridge}</td>
                  <td style={td}>{r.lasso}</td>
                  <td style={td}>{r.enet}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>How the choice flows in practice</h2>
        <ol style={ol}>
          <li>
            <strong>Do you need feature selection / interpretability?</strong> If a short list of features is
            part of the deliverable, you want sparsity → Lasso or elastic-net. If you only care about
            prediction accuracy and want stability, ridge is often the simplest strong choice.
          </li>
          <li>
            <strong>Are features correlated or grouped?</strong> Almost always yes on real data. Then prefer{" "}
            <strong>elastic-net</strong> over plain Lasso — it keeps correlated groups together and is far more
            stable. Pure Lasso&rsquo;s arbitrary picks are a liability here.
          </li>
          <li>
            <strong>Is <em>p</em> huge (p ≫ n)?</strong> Elastic-net or Lasso for sparsity; elastic-net if you
            expect more than <em>n</em> relevant features or strong correlation.
          </li>
          <li>
            <strong>Unsure?</strong> Fit <strong>elastic-net and let cross-validation tune α</strong>. Because
            it contains both ridge (α=0) and lasso (α=1) as special cases, the data picks the right blend — and
            you can read off whether it landed near ridge or lasso.
          </li>
        </ol>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-regression)", marginBottom: 4 }}>
            The honest default
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            For a strong, low-effort baseline on most tabular regression: <strong>standardize, then
            cross-validated elastic-net</strong>. It subsumes ridge and lasso, handles correlation gracefully,
            gives you sparsity when the data supports it, and rarely loses to either pure penalty. Reach for
            plain ridge when you specifically want to keep every feature, and plain lasso when you specifically
            want the most aggressive, interpretable selection.
          </p>
        </div>

        <p>
          That&rsquo;s the toolkit. Next, the theory chapter explains <em>why</em> shrinkage works at a deeper level —
          the Bayesian priors behind ridge and lasso, and the surprising guarantee that shrinkage beats OLS —
          before we put everything to work on a real dataset in the capstone.
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/regularized-regression/the-full-path-and-warm-starts" style={navLink}>← The full path &amp; warm starts</Link>
          <Link href="/learn/regularized-regression/ridge-as-a-gaussian-prior" style={{ ...navLink, fontWeight: 600 }}>Next up · Ridge as a Gaussian prior →</Link>
        </div>
      </div>
    </article>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ol: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-regression) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-regression) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
const th: React.CSSProperties = { textAlign: "left", padding: "8px 10px", borderBottom: "2px solid var(--border-strong)", fontWeight: 600, fontSize: 12.5, verticalAlign: "bottom" };
const td: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid var(--border)", color: "var(--muted)", lineHeight: 1.4, verticalAlign: "top" };
