import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { DecisionPoint } from "@/components/DecisionPoint";

export const metadata = {
  title: "Feedback loops — Manifold",
  description:
    "A deployed model changes the world it was trained on. Selective labelling, self-fulfilling predictions, and why subgroup performance is a data-workflow question rather than an ethics appendix.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const LOOPS: { name: string; how: string; symptom: string; fix: string }[] = [
  {
    name: "Selective labelling",
    how: "you only observe outcomes for cases you acted on — approved loans, reviewed claims, dispatched patrols",
    symptom: "the model looks excellent and never improves; rejected cases are permanently unlabelled",
    fix: "a small random holdout that bypasses the model, so some unbiased outcomes always arrive",
  },
  {
    name: "Self-fulfilling prediction",
    how: "the prediction causes the outcome — flag an account as risky, restrict it, and it churns",
    symptom: "spectacular apparent accuracy that nobody can turn into value",
    fix: "measure against a control group; only an experiment separates prediction from causation",
  },
  {
    name: "Rich-get-richer ranking",
    how: "shown items get engagement, engagement is the label, so the next model shows them more",
    symptom: "narrowing recommendations, and a training set that only contains what you already promoted",
    fix: "log the position and correct for it, plus deliberate exploration in the ranking",
  },
  {
    name: "Distilling your own predecessor",
    how: "the new model trains on data shaped by the old model's decisions",
    symptom: "errors of the old model become permanent facts about the world",
    fix: "keep provenance on rows, and weight or exclude model-influenced outcomes",
  },
];

export default function FeedbackLoopsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Beyond the notebook", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 9 minutes"
        title={<>Feedback loops</>}
        intro={<>Everything before this page assumed the data-generating process sits still and lets you study it.
          The moment a model is deployed, that stops being true: it acts on the world, and the world it acts on is
          where next year&rsquo;s training data comes from.</>}
      />

      <div className="lesson">
        <h2>The loop, in one example</h2>
        <p>
          You build a churn model. The retention team calls the accounts it flags. Those accounts, having been
          called, mostly stay. Next year you retrain on the new data — in which the high-risk accounts{" "}
          <em>did not churn</em>. The model concludes they were never at risk, stops flagging them, nobody calls
          them, and they leave.
        </p>
        <p>
          Nothing in that story is a bug. Every step is the system working as designed. The problem is that{" "}
          <strong>the model&rsquo;s training data is now downstream of the model&rsquo;s own actions</strong>, and
          the i.i.d. assumption underneath all of supervised learning quietly stopped holding.
        </p>

        <h2>Four loops, all of which appear in ordinary systems</h2>
        <div style={{ display: "grid", gap: 9, margin: "1.3rem 0" }}>
          {LOOPS.map((l) => (
            <div key={l.name} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 15px" }}>
              <div className="font-display" style={{ fontSize: 13.5, fontWeight: 500, color: GRAY, marginBottom: 3 }}>{l.name}</div>
              <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.55 }}>{l.how}</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55, marginTop: 3 }}><strong>Symptom:</strong> {l.symptom}.</div>
              <div style={{ fontSize: 12.5, color: "var(--good)", lineHeight: 1.55, marginTop: 2 }}><strong>Fix:</strong> {l.fix}.</div>
            </div>
          ))}
        </div>

        <Callout color={GRAY} title={<>The single most useful mitigation</>}>
          <strong>Hold out a small random slice that the model does not act on.</strong> One or two percent is
          usually enough. It costs a little value on those cases and it buys the only unbiased labels you will
          ever have — which are what let you measure your true performance, detect{" "}
          <Link href="/learn/data-workflow/drift-and-monitoring" style={link}>drift</Link> honestly, and train a
          successor on data your predecessor did not shape. Nearly every mature system that avoids these loops has
          one, and the decision to fund it has to be made before launch, when it is cheap.
        </Callout>

        <h2>Selective labelling deserves its own paragraph</h2>
        <p>
          It is the most common loop and the least visible. A lending model is trained on repayment outcomes —
          which exist only for applicants who were approved. The rejected applicants have no outcome, ever. Your
          training set is therefore a sample selected by the previous decision policy, and your model is learning{" "}
          <em>repayment among people the old policy liked</em>.
        </p>
        <p>
          The consequence is specific and worth naming: <strong>the model cannot discover that the old policy was
          wrong.</strong> If good applicants were rejected for a bad reason, they are absent from the data, so
          there is no evidence they would have repaid, so the new model rejects them too. The bias becomes
          self-confirming and looks like validated performance.
        </p>

        <DecisionPoint
          accent={GRAY}
          question={<>Your fraud model has 99.2% precision on reviewed cases and the team wants to expand it to auto-block. What is the most important thing to establish first?</>}
          options={[
            {
              label: "What happens to cases the model doesn't flag — do you ever learn they were fraud?",
              verdict: "best",
              response: <>Precision measured on reviewed cases says nothing about recall, and recall is what auto-blocking risks. If unflagged fraud is never discovered, your data contains no examples of the fraud you are missing, and the model will look excellent forever while an entire category passes through. This is selective labelling exactly, and the answer determines whether the 99.2% is a real number or a description of what you chose to look at.</>,
            },
            {
              label: "Whether the model's probabilities are calibrated at the blocking threshold",
              verdict: "close",
              response: <>Genuinely important — auto-blocking makes the threshold a business decision with a real cost per false positive, and an uncalibrated score makes that cost impossible to reason about. But it is a question about the cases you <em>can</em> see. The prior question is whether the cases you cannot see are a systematic category, because no amount of calibration on a biased sample fixes a biased sample.</>,
            },
            {
              label: "Whether precision stays high as volume increases",
              verdict: "miss",
              response: <>This treats the risk as a scaling problem when it is a measurement problem. Precision on reviewed cases can stay at 99.2% indefinitely while the model misses an entire fraud pattern, because missed fraud never enters the numerator or the denominator. Watching a number that is blind to the failure mode is how auto-blocking systems fail quietly.</>,
            },
          ]}
        />

        <h2>Subgroup performance belongs here, not in an appendix</h2>
        <p>
          The reason fairness is a data-workflow topic rather than a separate ethics chapter is that its
          mechanisms are the mechanisms of this pillar. A model performs worse for a subgroup because that group
          is under-represented in the training data, or because the{" "}
          <Link href="/learn/data-workflow/designing-the-label" style={link}>proxy label</Link> measures the
          observation process differently for them, or because a feedback loop has been running for years. All
          three are data problems with data diagnostics.
        </p>
        <p>
          Which means the technique is one you already have:{" "}
          <Link href="/learn/data-workflow/error-analysis" style={link}>slice the errors</Link>. Report
          performance per subgroup, not just in aggregate, for the same reason you report it per confidence
          quartile — because the average is nobody&rsquo;s experience. A model at 94% overall and 71% for one
          group is not a 94% model for the people in that group.
        </p>
        <p>
          The mitigations run in the same order as everything else in this pillar: fix the sampling, fix the
          label, fix the features — and only then reach for a modelling adjustment. Where the disparity comes from
          a proxy label that means different things for different groups, no post-hoc constraint on the model
          repairs it, because the target itself is measuring something different.
        </p>

        <h2>The question to carry out of this chapter</h2>
        <p>
          Before you deploy: <strong>how will this model change the data it will next be trained on?</strong> If
          the honest answer is &ldquo;substantially&rdquo;, then you need a control slice, provenance on your
          rows, and a plan for measuring against something the model did not touch. Retrofitting those after the
          loop has been running for a year is expensive, and sometimes the honest answer is that a clean
          measurement is no longer available.
        </p>

        <PrevNext
          prev={{ href: "/learn/data-workflow/drift-and-monitoring", label: <>← Drift &amp; monitoring</> }}
          next={{ href: "/learn/data-workflow/the-workflow-playbook", label: <>Next up · The workflow playbook →</> }}
        />
      </div>
    </article>
  );
}
