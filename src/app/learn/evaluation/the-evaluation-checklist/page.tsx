import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-metrics)";

export const metadata = {
  title: "The evaluation checklist — Manifold",
  description: "The whole pillar compressed into a repeatable routine: the questions to ask, in order, before you trust any evaluation number — for classification and regression alike.",
};

export default function EvaluationChecklistPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Evaluation & metrics", color: ACCENT },
          { label: "Practitioner", color: "var(--c-fundamentals)" },
        ]}
        time="about 6 minutes"
        title={<>The evaluation checklist</>}
        intro={<>
          You now have every piece. This page is the assembly instructions — a short routine to run before you
          report or believe any evaluation number. It&rsquo;s deliberately a checklist, not an algorithm: the
          point is to make the assumptions conscious, not to automate the judgement away.
        </>}
      />

      <div className="lesson">
        <p>
          Every trap in this pillar came from skipping a question and letting a default answer it silently.
          Accuracy assumed balanced classes and equal costs. R² assumed more features are free. A single split
          assumed one draw is representative. The checklist is just those questions, asked out loud and in order.
        </p>

        <Step
          n={1}
          title="What does a mistake cost — and are the two mistakes different?"
          body={<>This comes first because it determines the metric. If a false negative and a false positive
            cost the same, symmetric metrics are fine; if not, you need precision vs recall (classification) or
            RMSE vs MAE (regression) chosen to match. Can you put numbers on the costs? Then skip proxies and set a{" "}
            <a href="/learn/evaluation/cost-sensitive-thresholds" style={{ color: ACCENT }}>cost-sensitive threshold</a> directly.</>}
        />
        <Step
          n={2}
          title="Is the data imbalanced or skewed?"
          body={<>If one class dominates, accuracy and ROC-AUC will flatter you — switch to precision/recall and the{" "}
            <a href="/learn/evaluation/roc-auc-and-pr-curves" style={{ color: ACCENT }}>PR curve</a>, and always
            compare against the majority-class baseline. For regression, a few outliers will blow up RMSE relative
            to MAE — the gap between them is your skew detector.</>}
        />
        <Step
          n={3}
          title="Do I need the probability itself, or only the ranking?"
          body={<>Sorting or thresholding needs only ranking (AUC is enough). Multiplying the score by a payoff,
            budgeting, or communicating a risk needs an honest number — check{" "}
            <a href="/learn/evaluation/calibration" style={{ color: ACCENT }}>calibration</a> with a reliability
            diagram and Brier score, and fix it with Platt/isotonic scaling if needed.</>}
        />
        <Step
          n={4}
          title="Is this estimate stable, or one lucky split?"
          body={<>Never trust a single train/test number on anything but very large data. Report{" "}
            <a href="/learn/evaluation/cross-validation" style={{ color: ACCENT }}>cross-validated</a> mean ± std,
            keep every data-dependent step inside the folds to avoid leakage, and read the fold-to-fold spread as a
            stability check — 0.85 ± 0.02 and 0.85 ± 0.15 are very different results.</>}
        />
        <Step
          n={5}
          title="Am I reporting more than one number?"
          body={<>A single metric hides the trade it made. Report a pair at minimum: a headline metric plus what it
            costs (precision with recall; RMSE with MAE; R² with an absolute error). One number is a conclusion; two
            are an argument.</>}
        />

        <Callout color={ACCENT} title={<>The sentence under the whole pillar</>}>
          There is no best metric in the abstract — only the one that matches what a mistake costs in your problem,
          measured on data the model never saw, and reported honestly enough to show the trade it made. Every page
          here was one corner of that sentence.
        </Callout>

        <h2>The through-line, one more time</h2>
        <p>
          Accuracy hid the mistakes → the confusion matrix separated them → precision and recall named them →
          curves graded the model across thresholds → calibration made the probabilities honest → cost turned them
          into a decision → and RMSE, MAE, and R² carried the same logic into regression, with cross-validation
          making every one of those numbers trustworthy. Evaluation isn&rsquo;t a step you do at the end. It&rsquo;s
          the question &ldquo;how would I know if this were wrong?&rdquo; — asked early, and answered on purpose.
        </p>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "The checklist puts 'what does a mistake cost?' first because…",
              options: [
                "It's the easiest question",
                "The answer determines which metric is even appropriate",
                "Costs are always known",
              ],
              answer: 1,
              explain: "Cost structure decides whether symmetric metrics are valid and which of precision/recall or RMSE/MAE to favour. Choosing a metric before knowing the cost is how the defaults trap you.",
            },
            {
              q: "The best one-line summary of the entire pillar is…",
              options: [
                "Maximise accuracy, or R² for regression",
                "No metric is best in the abstract — pick the one matching your costs, measure it out-of-sample, and report the trade",
                "Always use cross-validation and nothing else matters",
              ],
              answer: 1,
              explain: "Every metric encodes assumptions about cost and balance; the skill is matching the metric to the decision, validating it honestly, and reporting enough to show the trade-off it made.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/evaluation/cross-validation", label: <>← Cross-validation</> }}
          next={{ href: "/map", label: <>Apply it · explore the tracks →</> }}
        />
      </div>
    </article>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", margin: "1.3rem 0", padding: "14px 16px", background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 12 }}>
      <div
        className="font-display"
        style={{
          flexShrink: 0, width: 30, height: 30, borderRadius: 999,
          background: `color-mix(in srgb, ${ACCENT} 15%, var(--surface))`,
          color: ACCENT, fontWeight: 600, fontSize: 15,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {n}
      </div>
      <div>
        <div className="font-display" style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)", marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 14.5, color: "var(--muted)", lineHeight: 1.6 }}>{body}</div>
      </div>
    </div>
  );
}
