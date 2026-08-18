import { PredictPrompt } from "@/components/PredictPrompt";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-classification)";

export const metadata = {
  title: "When to use logistic regression (vs trees, SVMs, k-NN) — Manifold",
  description: "Logistic regression is rarely the most accurate classifier — and often the right one anyway. A practitioner's guide to when it wins, when it loses, and what to reach for instead.",
};

export default function WhenToUsePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: ACCENT }, { label: "Practitioner", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>When to use it — vs trees, SVMs, k-NN</>}
        intro={<>
          Logistic regression is almost never the single most accurate model on a Kaggle leaderboard. It is,
          nonetheless, one of the most <em>deployed</em> models on earth. Understanding that gap — accuracy
          isn&rsquo;t the only axis — is what makes you choose well instead of chasing points.
        </>}
      />

      <div className="lesson">
        <h2>Start here, almost always</h2>
        <p>
          Logistic regression is the right <strong>first</strong> model for a binary problem, even when it
          won&rsquo;t be the last. It trains in milliseconds, needs almost no tuning, gives calibrated
          probabilities, and hands you interpretable coefficients you can sanity-check with a domain expert.
          That makes it the ideal <em>baseline</em>: if a random forest beats it by half a point, you&rsquo;ve
          learned the problem is nearly linear and the extra complexity isn&rsquo;t buying much. If it beats
          logistic by twenty points, you&rsquo;ve learned the boundary is deeply nonlinear and where to invest.
          A baseline you understand is worth more than a black box you don&rsquo;t.
        </p>

        <h2>The four contenders, side by side</h2>
        <div style={{ overflowX: "auto", margin: "1.4rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13, minWidth: 620, width: "100%" }}>
            <thead>
              <tr>
                <th style={th}>Model</th>
                <th style={th}>Boundary</th>
                <th style={th}>Probabilities</th>
                <th style={th}>Interpretable?</th>
                <th style={th}>Shines when…</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: `color-mix(in srgb, ${ACCENT} 6%, var(--surface))` }}>
                <td style={td}><strong>Logistic regression</strong></td>
                <td style={td}>linear</td>
                <td style={td}>calibrated, native</td>
                <td style={td}>yes — coefficients / odds ratios</td>
                <td style={td}>baseline; roughly-linear boundary; you need honest probabilities &amp; explanations</td>
              </tr>
              <tr>
                <td style={td}>Trees / gradient boosting</td>
                <td style={td}>axis-aligned, nonlinear</td>
                <td style={td}>uncalibrated (fixable)</td>
                <td style={td}>partly — feature importance / SHAP</td>
                <td style={td}>nonlinear interactions; mixed numeric/categorical; tabular accuracy</td>
              </tr>
              <tr>
                <td style={td}>SVM (kernel)</td>
                <td style={td}>linear or kernelised</td>
                <td style={td}>none natively (Platt)</td>
                <td style={td}>rarely</td>
                <td style={td}>high-dimensional, clear margin, medium-sized data</td>
              </tr>
              <tr>
                <td style={td}>k-nearest neighbours</td>
                <td style={td}>local, highly nonlinear</td>
                <td style={td}>crude (vote fractions)</td>
                <td style={td}>no global story</td>
                <td style={td}>low dimensions; local structure; tiny/quick prototypes</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>Reach past logistic regression when…</h2>
        <ul>
          <li>
            <strong>The boundary is genuinely nonlinear</strong> and you can&rsquo;t or won&rsquo;t hand-craft
            the features to linearise it. Gradient boosting finds interactions automatically; that&rsquo;s its
            whole job. (You saw the manual alternative on the feature-engineering page — sometimes a couple of
            interaction terms let logistic keep up.)
          </li>
          <li>
            <strong>Features are a messy mix</strong> of scales, categories, and missing values. Trees are
            largely invariant to monotonic transforms and handle this with less preprocessing.
          </li>
          <li>
            <strong>You&rsquo;re chasing the last few points of accuracy</strong> on tabular data and
            interpretability is negotiable — boosted trees are the usual winner there.
          </li>
        </ul>

        <h2>Stay with logistic regression when…</h2>
        <ul>
          <li><strong>You must explain every decision</strong> — credit, hiring, medicine, anything regulated. &ldquo;This coefficient means each extra late payment multiplies the odds by 2.1&rdquo; is defensible; a 300-tree ensemble is not.</li>
          <li><strong>You need trustworthy probabilities</strong>, not just a ranking — logistic is calibrated by construction (the calibration page showed the contrast).</li>
          <li><strong>Data is limited or wide</strong> (few rows, many features): a regularised linear model resists overfitting where a flexible model memorises.</li>
          <li><strong>Latency and simplicity matter</strong>: one dot product per prediction, trivially auditable, easy to monitor.</li>
        </ul>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>A bank must approve or deny loans and, by law, explain every denial to the applicant. Accuracy is important but explanations are mandatory. Best model?</>}
          options={[
            "Logistic regression — interpretable coefficients make every decision explainable",
            "A 500-tree gradient boosting ensemble — maximise accuracy",
            "k-NN — simplest to implement",
          ]}
          nudge={<>Weigh the legal requirement to explain against a fraction of a point of accuracy.</>}
        />

        <p>
          The regulated setting is where logistic regression is often not just acceptable but <em>required</em>:
          the ability to state, per applicant, exactly why the odds tipped is a feature no ensemble matches
          cheaply. Accuracy is one axis; explainability, calibration, latency, and auditability are others, and
          real deployments are chosen on all of them at once. That is the entire point of the next two pages —
          two end-to-end cases where the &ldquo;best&rdquo; model is the one that fits the <em>decision</em>,
          not the leaderboard.
        </p>

        <Callout color={ACCENT} title={<>The selection heuristic</>}>
          Start with logistic regression as a calibrated, interpretable baseline. Move to gradient boosting when
          a nonlinear boundary earns its complexity; to kernel SVMs for high-dimensional margin problems; to
          k-NN for small, local, low-dimensional cases. Then let the <em>cost of a mistake and the need to
          explain it</em> — not raw accuracy — cast the deciding vote.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "Why is logistic regression a good baseline even when a boosted-tree model will ultimately win?",
              options: [
                "It's the most accurate model",
                "It's fast, interpretable, and calibrated — the gap to a complex model tells you how nonlinear the problem is",
                "It never overfits",
              ],
              answer: 1,
              explain: "A cheap, understandable baseline quantifies what complexity is worth: a small gap means the problem is near-linear; a large one tells you where nonlinearity lives. That diagnostic value is why you always start here.",
            },
            {
              q: "You have highly nonlinear interactions among mixed numeric and categorical features, and interpretability is negotiable. Best first move?",
              options: ["Logistic regression with no changes", "Gradient boosting — it captures interactions and handles mixed features", "k-NN in the raw feature space"],
              answer: 1,
              explain: "Gradient boosting automatically models nonlinear interactions and is robust to feature scaling and type — the classic strength over a linear model when explanation isn't the priority.",
            },
            {
              q: "In a regulated domain requiring a reason for every decision, logistic regression is favoured because…",
              options: [
                "It's the only model that runs fast",
                "Its coefficients give a defensible, per-decision explanation that ensembles can't match cheaply",
                "It's guaranteed most accurate in regulated domains",
              ],
              answer: 1,
              explain: "Regulation often mandates explainability. Logistic regression's odds-ratio coefficients yield a clear, auditable reason per decision — a requirement that can outweigh a small accuracy edge from a black-box model.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/logistic-regression/generative-twin-naive-bayes-lda", label: <>← The generative twin</> }}
          next={{ href: "/learn/logistic-regression/case-credit-default", label: <>Next up · Case A: credit default →</> }}
        />
      </div>
    </article>
  );
}

const th: React.CSSProperties = {
  border: "1px solid var(--border-strong)",
  padding: "8px 11px",
  textAlign: "left",
  background: "var(--surface-2)",
  fontWeight: 500,
  color: "var(--ink)",
  whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  border: "1px solid var(--border-strong)",
  padding: "8px 11px",
  textAlign: "left",
  color: "var(--muted)",
  verticalAlign: "top",
};
