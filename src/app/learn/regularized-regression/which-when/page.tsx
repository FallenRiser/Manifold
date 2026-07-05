import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

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
      <LessonHeader
        chips={[{ label: "Regression", color: "var(--c-regression)" }, { label: "Reference", color: "var(--c-metrics)" }]}
        time="about 6 minutes"
        title={<>Ridge vs Lasso vs Elastic-net: which when</>}
        intro={<>
          Three penalties, one decision. This page distils the whole track into a practical guide: what each
        does, and how to pick on a real problem without agonising.
        </>}
      />

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

        <Callout color="var(--c-regression)" title={<>The honest default</>}>
          For a strong, low-effort baseline on most tabular regression: <strong>standardize, then
            cross-validated elastic-net</strong>. It subsumes ridge and lasso, handles correlation gracefully,
            gives you sparsity when the data supports it, and rarely loses to either pure penalty. Reach for
            plain ridge when you specifically want to keep every feature, and plain lasso when you specifically
            want the most aggressive, interpretable selection.
        </Callout>

        <p>
          That&rsquo;s the toolkit. Next, the theory chapter explains <em>why</em> shrinkage works at a deeper level —
          the Bayesian priors behind ridge and lasso, and the surprising guarantee that shrinkage beats OLS —
          before we put everything to work on a real dataset in the capstone.
        </p>

        <Quiz
          accent="var(--c-regression)"
          questions={[
            {
              q: "10,000 features, you believe only a few dozen matter, and you need an interpretable shortlist. Reach for…",
              options: ["The Lasso", "Ridge", "OLS with more data"],
              answer: 0,
              explain: "L1's sparsity zeroes out the irrelevant thousands and hands you the shortlist. Ridge keeps every feature nonzero: stable, but no selection.",
            },
            {
              q: "Groups of strongly correlated features, and you want selections that don't flip arbitrarily between correlated twins. Reach for…",
              options: ["Elastic-net", "Pure Lasso", "No penalty at all"],
              answer: 0,
              explain: "Pure Lasso picks one member of a correlated group essentially at random, and the pick changes with the sample. The L2 component in elastic-net pulls groups in together.",
            },
            {
              q: "Plenty of data, modest feature count, everything plausibly relevant — you just want tamer coefficients. Reach for…",
              options: ["Ridge", "The Lasso", "Elastic-net with α = 1"],
              answer: 0,
              explain: "Nothing needs deleting — you want stability, not sparsity. Ridge shrinks smoothly, keeps the closed form, and handles multicollinearity gracefully.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/regularized-regression/the-full-path-and-warm-starts", label: <>← The full path &amp; warm starts</> }} next={{ href: "/learn/regularized-regression/ridge-as-a-gaussian-prior", label: <>Next up · Ridge as a Gaussian prior →</> }} />
      </div>
    </article>
  );
}

const ol: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const th: React.CSSProperties = { textAlign: "left", padding: "8px 10px", borderBottom: "2px solid var(--border-strong)", fontWeight: 600, fontSize: 12.5, verticalAlign: "bottom" };
const td: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid var(--border)", color: "var(--muted)", lineHeight: 1.4, verticalAlign: "top" };
