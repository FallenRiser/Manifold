import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "The workflow playbook — Manifold",
  description:
    "The whole pillar as one ordered procedure, with the measured cost of skipping each step — from 0.62 of R² for a random split on time-ordered data down to the steps whose cost is zero.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

type Step = { n: number; title: string; body: React.ReactNode; cost?: string };

const STEPS: Step[] = [
  {
    n: 1,
    title: "Work backwards from the decision to the target",
    body: <>Ask what somebody will do differently, how many of them, and how often. The horizon, the population and the metric all fall out of that answer and out of nothing else.</>,
  },
  {
    n: 2,
    title: "Write the eight-line framing contract, and show it to whoever asked",
    body: <>Decision, population, unit, label, features, split, metric, baseline — including the stop condition. Twenty minutes, before any modelling, while every answer is still a judgement rather than a negotiation.</>,
  },
  {
    n: 3,
    title: "Decide what one row is, from the decision — not from the CSV",
    body: <>Whatever the unit is, that is what must not span the split. Everything downstream inherits this.</>,
    cost: "R² 0.569 → 0.044 (measured)",
  },
  {
    n: 4,
    title: "Time-travel-test every feature",
    body: <>At the exact moment of prediction, was this value known and correct? Build features from a window ending at an explicit cut-off, and make the cut-off an argument.</>,
    cost: "unbounded — the label in a costume",
  },
  {
    n: 5,
    title: "Run the eight questions and the ten checks, as code that raises",
    body: <>Row counts, key uniqueness, impossible values, missingness, time range, suspicious correlations, duplicates — then read twenty random rows like a person.</>,
    cost: "a fanned-out join contaminating the test set",
  },
  {
    n: 6,
    title: "Split to simulate deployment, before you look at anything else",
    body: <>Grouped, time-ordered, or both. Explore the training half; keep the test set untouched until every decision is final.</>,
    cost: "R² 0.396 → −0.220 (measured, temporal)",
  },
  {
    n: 7,
    title: "Put every fitted step inside a pipeline",
    body: <>Scaler, imputer, encoder, selector, resampler, reducer. Not discipline — structure, so the mistake stops being expressible.</>,
    cost: "0.878 reported where the truth is 0.500",
  },
  {
    n: 8,
    title: "Establish the baseline ladder, including the current process",
    body: <>The constant, the one-rule model, what the team does today, and a simple model. Put them at the top of the results table, and judge everything against them.</>,
    cost: "+0.0402 of real value reported as 98.7% accuracy",
  },
  {
    n: 9,
    title: "Fit something boring, end to end, and look at what it got wrong",
    body: <>The first model exists to close the loop, not to win. Once a prediction exists, diagnosis becomes possible — and diagnosis is what tells you where to spend the next two weeks.</>,
  },
  {
    n: 10,
    title: "Slice the errors, sort by lift, and read fifty rows from the top slice",
    body: <>Confidence, true label, every categorical, quartiles of every numeric, time, provenance. Most slices are null; that is the normal ratio and the reason to try many.</>,
    cost: "25% of traffic held 14 of 15 errors, and nothing in the aggregate said so",
  },
  {
    n: 11,
    title: "Let the evidence choose the next action",
    body: <>Converged curves mean features or a different model. A wide, closing gap means data or regularization. Wrong labels mean fix the labels. Identical rows with different outcomes mean you are at the floor.</>,
  },
  {
    n: 12,
    title: "Plan for after launch before you launch",
    body: <>Monitor outcomes first and inputs last, hold out a control slice the model never touches, gate every retrain against the incumbent, and decide the failure behaviour while it is still cheap to decide.</>,
  },
];

export default function PlaybookPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Beyond the notebook", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 9 minutes"
        title={<>The workflow playbook</>}
        intro={<>The whole pillar as one ordered procedure — and, where we measured it, the cost of skipping each
          step. It is deliberately last: a checklist you can derive is a tool, and a checklist you cannot is a
          thing you abandon the first time reality disagrees with it.</>}
      />

      <div className="lesson">
        <div style={{ display: "grid", gap: 10, margin: "1.4rem 0" }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ display: "flex", gap: 12, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px" }}>
              <div className="font-display" style={{ fontSize: 15, fontWeight: 500, color: GRAY, flexShrink: 0, width: 22 }}>{s.n}</div>
              <div>
                <div className="font-display" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginBottom: 3 }}>{s.title}</div>
                <div style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>{s.body}</div>
                {s.cost && (
                  <div style={{ fontSize: 11.5, color: "var(--bad)", marginTop: 5 }}>cost of skipping: {s.cost}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <h2>What the measured costs say about where to spend your care</h2>
        <p>
          Line the numbers up and the ordering is not the one attention usually follows. A random split on
          time-ordered data cost <strong>0.62 of R²</strong> — enough to turn a model that looked useful into one
          worse than predicting the mean. Splitting rows instead of patients cost <strong>0.52 of R²</strong>. A
          feature selector fitted outside the fold manufactured <strong>0.38 of accuracy out of pure noise</strong>.
        </p>
        <p>
          Against those, the entire literature of model choice and hyperparameter tuning operates in the second
          and third decimal place. <strong>Every one of the three largest failures is a decision made before the
          model was chosen, and none of them raised an error.</strong> That is the pillar in one paragraph.
        </p>

        <Callout color={GRAY} title={<>The one-sentence version</>}>
          <strong>Decide what the model is being asked and what it is allowed to know — then let the errors, not
          your instincts, choose what you do next.</strong> The first clause is chapters one to five. The second
          is chapters six and seven. Everything else is detail.
        </Callout>

        <h2>Where to go from here</h2>
        <p>
          The two capstones are this playbook run end to end on real data, with the decisions made explicitly and
          their costs measured. The{" "}
          <Link href="/learn/asteroid-hazard-capstone" style={link}>asteroid-hazard capstone</Link> is the
          stronger match for this pillar — its split decision is worth 8.8 points of PR-AUC and it is made in
          public, on the page. The{" "}
          <Link href="/learn/california-housing-capstone" style={link}>housing capstone</Link> does the same for
          regression, including a censored target and a diagnostics-driven model climb.
        </p>
        <p>
          For the neighbouring pillars: <Link href="/learn/evaluation" style={link}>evaluation &amp; metrics</Link>{" "}
          owns the metric line of your contract, and{" "}
          <Link href="/learn/model-selection" style={link}>model selection</Link> owns the validation machinery
          this playbook keeps invoking. If you want the theory of why a held-out score can be trusted at all,{" "}
          <Link href="/learn/learning-theory" style={link}>learning theory</Link> prices the cost of searching
          exactly.
        </p>

        <Quiz
          accent={GRAY}
          title="Final test · the whole pillar"
          questions={[
            {
              q: <>You inherit a project reporting 0.94 AUC offline that performs near chance in production. Ranked by measured impact, what do you check first?</>,
              options: [
                "Whether the production feature pipeline matches the training one",
                "What the split was, and whether it simulated deployment",
                "Whether the model is overfitting and needs more regularization",
              ],
              answer: 1,
              explain: <>The offline-to-production gap is the signature of a split that did not simulate deployment, and the two largest measured effects in this pillar are both splits — 0.62 of R² for temporal and 0.52 for group. Training/serving skew is a real second candidate and worth checking next. Overfitting is the wrong hypothesis entirely: it depresses held-out scores rather than inflating them, so it cannot explain a good offline number.</>,
            },
            {
              q: <>Your model is at 91%, the curves have converged with a gap of 0.008, and a relabelling exercise found the two labellers disagree 5% of the time. What is the right next action?</>,
              options: [
                "Collect more training data — 91% leaves room to improve",
                "Improve the labelling guideline, or accept the ceiling and stop",
                "Try a larger model to close the remaining nine points",
              ],
              answer: 1,
              explain: <>Two independent signals both say you are at a ceiling. Converged curves mean estimation error is spent, so more data attacks a term that is already near zero. And 5% label disagreement puts a perfect predictor at roughly 95% against these labels, so 91% is close to the achievable maximum. The remaining lever is the label itself — a clearer guideline improves every future example — or the stop condition your framing contract should already have named.</>,
            },
            {
              q: <>Which of these is the strongest argument for writing the framing contract before any modelling?</>,
              options: [
                "It makes the project easier to hand over",
                "Each of its decisions gets made whether or not you make it, and once a score exists every one of them acquires a direction that would improve it",
                "It is required for reproducibility",
              ],
              answer: 1,
              explain: <>The population, the horizon, the metric and the split all get set regardless — by a query filter, an export window, a tutorial default. Writing them down does not add decisions, it makes existing ones visible and attributable. The timing matters for a separate reason: after a number exists, people are extremely good at finding principled-sounding reasons for whichever framing choice raises it, which is why deciding while still ignorant of the effect is the only way these stay honest.</>,
            },
            {
              q: <>An input-drift monitor has been quiet for three months while business outcomes have steadily worsened. What does that pattern indicate?</>,
              options: [
                "The monitor is broken and should be retuned",
                "Concept drift — P(y|x) changed while P(x) did not, which input monitoring cannot see",
                "Nothing about the model; the business change must have another cause",
              ],
              answer: 1,
              explain: <>This is the dangerous cell of the 2×2, and it is measured: in the concept-drift run accuracy collapsed 0.825 → 0.262 while the input monitor never left 0.02–0.04. The monitor is not broken — it is answering a question about P(x), and P(x) genuinely did not move. Dismissing the model as a cause is the other error, and the way to settle it is performance on whatever labels have arrived, not more input monitoring.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/data-workflow/feedback-loops", label: <>← Feedback loops</> }}
          next={{ href: "/learn/asteroid-hazard-capstone", label: <>See it run end to end · The asteroid capstone →</> }}
        />
      </div>
    </article>
  );
}
