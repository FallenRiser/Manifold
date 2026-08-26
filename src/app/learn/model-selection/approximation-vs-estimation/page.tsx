import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { BiasVarianceLab } from "@/components/labs/BiasVarianceLab";

export const metadata = {
  title: "Approximation vs estimation, in practice — Manifold",
  description:
    "Your error splits into the part caused by your class being too poor and the part caused by your data being too small. They have opposite cures, and confusing them is why teams spend months collecting data that cannot possibly help.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13.5, margin: "1.2rem 0" };
const th: React.CSSProperties = { textAlign: "left", padding: "8px 10px", borderBottom: "1px solid var(--border-strong)", color: "var(--muted)", fontSize: 12, fontWeight: 500 };
const td: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid var(--border)", color: "var(--ink)", verticalAlign: "top" };

export default function ApproxEstPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The selection problem", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 7 minutes"
        title={<>Approximation vs estimation, in practice</>}
        intro={<>The most valuable diagnostic in applied machine learning, because the two halves of your error
          have <em>opposite</em> cures — and reaching for the wrong one can cost a team months.</>}
      />

      <div className="lesson">
        <h2>The split</h2>
        <p>
          Write your model&rsquo;s error as its distance above the best achievable error{" "}
          <M>{String.raw`R^\star`}</M>, and insert the best member of your class{" "}
          <M>{String.raw`h^*`}</M>:
        </p>
        <MathBlock>{String.raw`R(\hat h) - R^\star \;=\; \underbrace{\big[R(\hat h) - R(h^*)\big]}_{\text{estimation}} \;+\; \underbrace{\big[R(h^*) - R^\star\big]}_{\text{approximation}}`}</MathBlock>
        <p>
          <strong>Approximation error</strong> is the price of your class being too poor to contain the truth.{" "}
          <strong>Estimation error</strong> is the price of your data being too small to find the best member. The{" "}
          <Link href="/learn/learning-theory/agnostic-pac" style={link}>learning theory track</Link> derives this;
          here we only need one consequence, and it is a big one:
        </p>
        <p style={{ textAlign: "center", fontSize: 16, color: "var(--ink)", margin: "1.2rem 0 1.4rem", fontStyle: "italic" }}>
          more data reduces estimation error and does <strong>nothing at all</strong> to approximation error.
        </p>

        <PredictPrompt
          accent={GRAY}
          prompt={<>A model shows 18% training error and 19% test error. Your team proposes tripling the size of the training set. What will happen?</>}
          options={[
            "Test error will drop substantially — more data always helps",
            "Almost nothing will change — the tiny gap says estimation error is already small",
            "Test error will rise, since more data means more noise to fit",
          ]}
        />

        <h2>Reading the diagnosis off two numbers</h2>
        <p>
          You never observe the decomposition directly — <M>{String.raw`R^\star`}</M> and{" "}
          <M>{String.raw`h^*`}</M> are unknowable. But the <em>gap</em> between training and validation error is a
          reliable proxy for estimation error, and the training error level is a proxy for approximation error. Two
          numbers, four situations:
        </p>

        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Train error</th><th style={th}>Gap to validation</th>
              <th style={th}>Dominant term</th><th style={th}>What actually helps</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={td}>high</td><td style={td}>small</td>
              <td style={{ ...td, color: "var(--warn)" }}>approximation</td>
              <td style={{ ...td, color: "var(--muted)" }}>richer class, better features, weaker regularization. <strong>Not more data.</strong></td>
            </tr>
            <tr>
              <td style={td}>low</td><td style={td}>large</td>
              <td style={{ ...td, color: "var(--warn)" }}>estimation</td>
              <td style={{ ...td, color: "var(--muted)" }}>more data, stronger regularization, smaller class</td>
            </tr>
            <tr>
              <td style={td}>high</td><td style={td}>large</td>
              <td style={{ ...td, color: "var(--bad)" }}>both</td>
              <td style={{ ...td, color: "var(--muted)" }}>usually a sign of a bug, a leak, or a mismatched split — check those first</td>
            </tr>
            <tr>
              <td style={td}>low</td><td style={td}>small</td>
              <td style={{ ...td, color: "var(--good)" }}>neither</td>
              <td style={{ ...td, color: "var(--muted)" }}>you&rsquo;re near the ceiling; ship it, or change the problem</td>
            </tr>
          </tbody>
        </table>

        <p>
          Row one is the expensive mistake. A team sees 19% test error, concludes &ldquo;we need more data&rdquo;,
          and spends two quarters on collection — while the 1-point gap was already telling them that estimation
          error was nearly zero and that <em>no amount of data</em> would move the number. The lever was a richer
          class or better features the whole time.
        </p>

        <h2>Watch the trade move</h2>
        <p>
          The two terms are not independent — enlarging the class lowers approximation and raises estimation. That
          is why there is an optimum rather than a direction, and why &ldquo;use the most powerful model
          available&rdquo; is not a strategy. Drag the degree and watch both move at once.
        </p>

        <LabFrame
          accent={GRAY}
          tryThis={<>Find the degree with the lowest test error. Then go two degrees lower and two higher, and note which of the two errors is responsible for the damage in each direction.</>}
          insight={<>Too simple and both errors are high together — approximation, and the training error itself tells you. Too complex and training error keeps falling while test error climbs — estimation, visible only as the <em>gap</em>. <strong>One curve can&rsquo;t diagnose you; the pair can.</strong> That&rsquo;s the entire reason you always look at both.</>}
        >
          <BiasVarianceLab />
        </LabFrame>

        <Callout color={GRAY} title={<>Bias–variance, and why we use different words here</>}>
          Approximation and estimation are the risk-based counterparts of bias and variance. The bias–variance
          decomposition is exact for squared error and gets awkward for 0/1 loss; approximation–estimation applies
          to any loss and is the version learning theory uses. They are the same intuition with different domains
          of validity — if you find one clearer, use it. The{" "}
          <Link href="/learn/polynomial-regression/bias-variance-and-the-degree" style={link}>polynomial
          track</Link> works the squared-error version through in detail.
        </Callout>

        <p>
          One warning about the diagnosis: it assumes a small gap means you&rsquo;ve found nearly the best member
          of your class. As the{" "}
          <Link href="/learn/learning-theory/when-the-bounds-break" style={link}>double descent</Link> results
          show, hugely over-parameterized models can have zero training error, a large apparent gap, and still be
          excellent. The table is a reliable guide in the classical regime and a starting hypothesis outside it.
        </p>

        <PrevNext
          prev={{ href: "/learn/model-selection/what-youre-choosing", label: <>← What you&rsquo;re actually choosing</> }}
          next={{ href: "/learn/model-selection/the-selection-trap", label: <>Next up · The selection trap →</> }}
        />
      </div>
    </article>
  );
}
