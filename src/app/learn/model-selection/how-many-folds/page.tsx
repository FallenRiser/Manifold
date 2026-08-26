import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "How many folds? — Manifold",
  description:
    "k controls a bias–variance trade in the estimate itself. Leave-one-out is nearly unbiased and often high-variance; 5 and 10 are the defaults for reasons you can state precisely rather than by convention.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13.5, margin: "1.2rem 0" };
const th: React.CSSProperties = { textAlign: "left", padding: "8px 10px", borderBottom: "1px solid var(--border-strong)", color: "var(--muted)", fontSize: 12, fontWeight: 500 };
const td: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid var(--border)", color: "var(--ink)", verticalAlign: "top" };

export default function HowManyFoldsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Validation", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 6 minutes"
        title={<>How many folds?</>}
        intro={<>The estimate has its own bias and its own variance, and <M>k</M> trades one against the other. Once
          you see which way each moves, the conventional answers stop being conventions.</>}
      />

      <div className="lesson">
        <h2>What <M>k</M> controls</h2>
        <p>
          Each fold trains on <M>{String.raw`n(k-1)/k`}</M> examples, so:
        </p>
        <ul>
          <li>
            <strong>Larger <M>k</M> → less bias.</strong> Each fit sees more data, so it more closely resembles
            the model you will actually ship on all <M>n</M> points. At <M>{String.raw`k = n`}</M>{" "}
            (leave-one-out) each fit uses <M>{String.raw`n-1`}</M> examples and the pessimism nearly vanishes.
          </li>
          <li>
            <strong>Larger <M>k</M> → usually more variance.</strong> This is the counterintuitive half. The{" "}
            <M>k</M> training sets overlap more and more as <M>k</M> grows — with leave-one-out, any two training
            sets share <M>{String.raw`n-2`}</M> points. Their errors are therefore highly correlated, and{" "}
            <em>averaging correlated things doesn&rsquo;t reduce variance much</em>.
          </li>
          <li>
            <strong>Larger <M>k</M> → linearly more compute.</strong> <M>k</M> fits, and LOOCV means <M>n</M> of
            them.
          </li>
        </ul>
        <p>
          That second point is the same <M>{String.raw`\rho`}</M>-floor that governs ensemble averaging: averaging{" "}
          <M>B</M> estimators with pairwise correlation <M>{String.raw`\rho`}</M> gives variance{" "}
          <M>{String.raw`\rho\sigma^2 + (1-\rho)\sigma^2/B`}</M>, which stops improving once{" "}
          <M>{String.raw`\rho`}</M> dominates. The{" "}
          <Link href="/learn/random-forests/why-averaging-works" style={link}>random forests track</Link> derives
          it, and it explains folds just as well as it explains trees.
        </p>

        <MathBlock>{String.raw`k \uparrow \;\Rightarrow\; \text{bias} \downarrow, \quad \text{correlation between folds} \uparrow, \quad \text{cost} \uparrow`}</MathBlock>

        <table style={table}>
          <thead>
            <tr><th style={th}>Choice</th><th style={th}>Bias</th><th style={th}>Variance</th><th style={th}>Cost</th><th style={th}>Use when</th></tr>
          </thead>
          <tbody>
            <tr>
              <td style={td}><M>{String.raw`k = 5`}</M></td>
              <td style={td}>slightly pessimistic</td><td style={td}>lower</td><td style={td}>5 fits</td>
              <td style={{ ...td, color: "var(--muted)" }}>the default; plenty of data, expensive models</td>
            </tr>
            <tr>
              <td style={td}><M>{String.raw`k = 10`}</M></td>
              <td style={td}>small</td><td style={td}>low</td><td style={td}>10 fits</td>
              <td style={{ ...td, color: "var(--muted)" }}>the other default; the usual best compromise</td>
            </tr>
            <tr>
              <td style={td}>LOOCV</td>
              <td style={td}>nearly none</td><td style={td}>often high</td><td style={td}><M>n</M> fits</td>
              <td style={{ ...td, color: "var(--muted)" }}>tiny <M>n</M>, or a closed form makes it free</td>
            </tr>
            <tr>
              <td style={td}>repeated <M>k</M>-fold</td>
              <td style={td}>same as <M>k</M></td><td style={td}>lower still</td><td style={td}><M>{String.raw`k \times r`}</M></td>
              <td style={{ ...td, color: "var(--muted)" }}>small data, close comparisons worth resolving</td>
            </tr>
          </tbody>
        </table>

        <Callout color={GRAY} title={<>When leave-one-out is free</>}>
          For a few models LOOCV has a closed form and costs one fit instead of <M>n</M>. Ridge regression is the
          famous case: the PRESS statistic computes every leave-one-out residual from a single fit via the hat
          matrix, <M>{String.raw`e_i^{\text{LOO}} = e_i/(1 - h_{ii})`}</M>. The{" "}
          <Link href="/learn/kernel-ridge-regression/solving-the-linear-system" style={link}>kernel ridge
          track</Link> measures the payoff on a real problem — closed-form LOOCV in 102ms versus 3,815ms for a
          5-fold grid search, landing in the same <M>{String.raw`\lambda`}</M> regime. <strong>When it&rsquo;s
          free, take it; when it costs <M>n</M> fits, it rarely earns them.</strong>
        </Callout>

        <h2>The answer, and why it&rsquo;s boring</h2>
        <p>
          Use <strong>5 or 10</strong>. The empirical literature has looked hard at this and the differences are
          small compared with everything else on your plate — whether your folds respect group structure, whether
          preprocessing leaked, whether your grid was too big. Reach for repeated <M>k</M>-fold when <M>n</M> is
          small and you need to resolve a close comparison; reach for LOOCV when <M>n</M> is tiny or a closed form
          exists.
        </p>
        <p>
          It is worth naming what <em>does</em> deserve your attention instead: the next page shows that no value
          of <M>k</M> repairs the bias introduced by selecting with the same folds you report from.
        </p>

        <PrevNext
          prev={{ href: "/learn/model-selection/cross-validation", label: <>← Cross-validation</> }}
          next={{ href: "/learn/model-selection/nested-cross-validation", label: <>Next up · Nested cross-validation →</> }}
        />
      </div>
    </article>
  );
}
