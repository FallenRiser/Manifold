import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";

export const metadata = {
  title: "The algorithm family: ID3, C4.5, CHAID — Manifold",
  description:
    "CART is one of several tree algorithms. ID3 and C4.5's gain ratio, CHAID's significance tests, and how they differ from the binary Gini trees scikit-learn ships — including the cardinality bias gain ratio was invented to fix.",
};

const TREES = "var(--c-trees)";

const ROWS: [string, string, string, string][] = [
  ["ID3", "Information gain (entropy)", "Multiway (one branch/category)", "none — overfits"],
  ["C4.5 / C5.0", "Gain ratio", "Multiway + binary numeric", "error-based post-pruning"],
  ["CHAID", "Chi-square / F significance", "Multiway, merges similar categories", "stops on significance"],
  ["CART", "Gini / variance", "Always binary", "cost-complexity pruning"],
];

export default function AlgorithmFamilyPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>The algorithm family: ID3, C4.5, CHAID</>}
        intro={<>
          &ldquo;Decision tree&rdquo; isn&rsquo;t one algorithm — it&rsquo;s a family with a genuine history.
          The CART trees scikit-learn ships are one branch; the others made different choices about how to
          split, whether to go binary, and when to stop. One of those choices fixes a real flaw you&rsquo;ve
          already met.
        </>}
      />

      <div className="lesson">
        <h2>Four algorithms, four sets of choices</h2>
        <div style={{ overflowX: "auto", margin: "1.3rem 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13.5, minWidth: 560 }}>
            <thead>
              <tr>
                <th style={th}>Algorithm</th>
                <th style={th}>Split criterion</th>
                <th style={th}>Split shape</th>
                <th style={th}>Pruning</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([a, b, c, d]) => (
                <tr key={a}>
                  <td style={{ ...td, fontWeight: 600, color: a === "CART" ? "var(--c-trees)" : "var(--ink)" }}>{a}</td>
                  <td style={td}>{b}</td>
                  <td style={td}>{c}</td>
                  <td style={{ ...td, color: "var(--muted)" }}>{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul style={ul}>
          <li><strong>ID3</strong> (Quinlan, 1986) started it: split on the feature with the highest information
            gain, one branch per category, grow until pure. Simple, categorical-only, and it overfits badly —
            no pruning, and it loves many-valued features (see below).</li>
          <li><strong>C4.5</strong> (and its commercial successor C5.0) fixed ID3&rsquo;s problems: it uses{" "}
            <em> gain ratio</em>, handles continuous features with binary thresholds, handles missing values,
            and post-prunes. For decades it was <em>the</em> decision-tree algorithm.</li>
          <li><strong>CHAID</strong> comes from statistics, not CS: it splits using chi-square (categorical) or
            F-test (continuous) <em>significance</em>, merges categories that aren&rsquo;t significantly
            different, and stops when no split is significant. Multiway and very interpretable — a staple in
            market research.</li>
          <li><strong>CART</strong> (Breiman et al., 1984) is the one you&rsquo;ve been learning: strictly
            binary, Gini or variance, cost-complexity pruning, surrogate splits. It&rsquo;s what scikit-learn,
            and therefore most of modern practice, implements.</li>
        </ul>

        <h2>The bias gain ratio was built to fix</h2>
        <p>
          Here is the flaw, and it&rsquo;s worth understanding because it explains a real modelling trap.
          Plain <strong>information gain favours features with many distinct values</strong>. Consider an
          extreme case: a <code>customer_id</code> column, unique for every row. Split on it and every child is
          a single pure row — information gain is <em>maximal</em>. The tree would &ldquo;learn&rdquo; to look
          up each customer by ID: perfect on training, useless on anyone new.
        </p>
        <p>
          C4.5&rsquo;s fix is to divide the gain by how much the split <em>itself</em> fractures the data — its{" "}
          <strong> split information</strong>, the entropy of the partition sizes:
        </p>
        <MathBlock>{String.raw`\text{gain ratio} = \frac{\text{information gain}}{\text{split info}}, \qquad \text{split info} = -\sum_{v} \frac{n_v}{n}\log_2\frac{n_v}{n}`}</MathBlock>
        <p>
          A many-way split has enormous split info (an ID split has <M>{String.raw`\log_2 n`}</M> bits of it),
          so dividing by it <strong>crushes the score of features that win only by shattering the data</strong>.
          A clean two-way split with real predictive power keeps most of its gain. Gain ratio is exactly the
          &ldquo;is this split earning its complexity?&rdquo; correction the raw gain lacks.
        </p>

        <Callout color={TREES} title={<>The same bias, in CART&rsquo;s world</>}>
          CART sidesteps this by being <em>binary</em> — it can&rsquo;t make a 1000-way ID split — but a
          softer version of the bias survives: continuous and high-cardinality features still offer more
          candidate thresholds and win more splits by chance. That&rsquo;s the very bias behind the misleading
          <Link href="/learn/decision-trees/feature-importance" style={link}> impurity-based feature importance</Link>
          you&rsquo;ll meet later. Different algorithm, same root cause — more choices, more chances to look good.
        </Callout>

        <p>
          For practice, the takeaway is short: you&rsquo;ll almost always use CART (it&rsquo;s what your library
          gives you), but knowing the family explains <em>why</em> CART is binary, why raw information gain is
          risky with ID-like columns, and why some tools default to gain ratio.
        </p>

        <PrevNext
          prev={{ href: "/learn/decision-trees/cost-complexity-pruning", label: <>← Cost-complexity pruning</> }}
          next={{ href: "/learn/decision-trees/oblique-and-multivariate-trees", label: <>Next up · Oblique & multivariate trees →</> }}
        />
      </div>
    </article>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "8px 12px", borderBottom: "1.5px solid var(--border-strong)", color: "var(--ink)", fontWeight: 600, fontSize: 12.5 };
const td: React.CSSProperties = { padding: "9px 12px", borderBottom: "1px solid var(--border)", color: "var(--ink)", verticalAlign: "top", lineHeight: 1.5 };
const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
