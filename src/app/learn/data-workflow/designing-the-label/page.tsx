import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { PredictPrompt } from "@/components/PredictPrompt";

export const metadata = {
  title: "Designing the label — Manifold",
  description:
    "Your target column is something you constructed, not something you found. Proxy labels, label horizons, and the biases that get baked into y before a single model is fitted.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const PROXIES: { want: string; use: string; gap: string }[] = [
  {
    want: "Is this candidate good at the job?",
    use: "Were they promoted within two years?",
    gap: "measures visibility and manager behaviour as much as competence, and inherits every past promotion bias",
  },
  {
    want: "Is this transaction fraudulent?",
    use: "Was it charged back?",
    gap: "only counts fraud somebody noticed and disputed; silent fraud is labelled clean",
  },
  {
    want: "Is this patient ill?",
    use: "Did they receive a diagnosis code?",
    gap: "measures access to care — people who never saw a doctor are labelled healthy",
  },
  {
    want: "Is this article good?",
    use: "Did people click it?",
    gap: "measures the headline, not the article, and rewards whatever the last ranking model promoted",
  },
];

export default function DesigningTheLabelPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Framing", color: GRAY }, { label: "Tier 1 · intuition", color: GRAY }]}
        time="about 8 minutes"
        title={<>Designing the label</>}
        intro={<>Supervised learning is usually introduced as if <em>y</em> were given. In real work it almost never
          is. You build it — out of choices about timing, thresholds and proxies — and everything the model can
          possibly learn is downstream of that construction.</>}
      />

      <div className="lesson">
        <h2>The label is a definition, and definitions have authors</h2>
        <p>
          &ldquo;Churned&rdquo; is not in your database. What is in your database is a last-activity timestamp.
          Turning that into a label requires you to decide how long counts as gone — thirty days, sixty, ninety —
          and each answer produces a different target, a different class balance, and a different model.
        </p>
        <p>
          The same is true of almost every label worth predicting. &ldquo;Defaulted&rdquo; needs a window.
          &ldquo;Satisfied&rdquo; needs a survey cut-off. &ldquo;Relevant&rdquo; needs an annotator and a
          guideline. These are not administrative details; they are where a large fraction of the modelling
          decisions in a project actually live, and they get made in five minutes by whoever wrote the SQL.
        </p>

        <Callout color={GRAY} title={<>A useful reframing</>}>
          You are not selecting a label, you are <em>writing</em> one. The right question is not &ldquo;what is
          the target column?&rdquo; but &ldquo;what would a perfect oracle have told me, and how close can I get
          with what was recorded?&rdquo; The distance between those two is the part of your error budget that no
          model can recover.
        </Callout>

        <h2>Proxy labels: the gap between what you want and what you can measure</h2>
        <p>
          You want to predict something real. You have a column that correlates with it. The substitution is
          usually necessary and always lossy, and being explicit about the loss is the difference between a
          careful project and a confident one.
        </p>
        <div style={{ display: "grid", gap: 8, margin: "1.3rem 0" }}>
          {PROXIES.map((p) => (
            <div key={p.want} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "11px 14px" }}>
              <div style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.55 }}>{p.want}</div>
              <div style={{ fontSize: 13, color: GRAY, lineHeight: 1.55, marginTop: 3 }}>→ {p.use}</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55, marginTop: 3 }}>{p.gap}</div>
            </div>
          ))}
        </div>
        <p>
          The pattern repeats: <strong>a proxy label usually measures the observation process as much as the thing
          being observed.</strong> Charge-backs measure disputes. Diagnosis codes measure clinic visits. Clicks
          measure whatever was shown. A model trained on the proxy will faithfully learn that process, and it will
          be right about it, and it will be answering a different question than the one you asked.
        </p>

        <PredictPrompt
          accent={GRAY}
          prompt={<>A hiring model is trained on &ldquo;promoted within two years&rdquo; as the label, using ten years of company history. It reaches strong validation performance. What has it most likely learnt?</>}
          options={[
            "Which candidates are most capable at the job",
            "Which candidates resemble people this company has promoted before",
            "Nothing useful — promotion is too noisy to predict",
          ]}
        />

        <p>
          The second. The model is not wrong; it is accurate about its label, and its label is a record of past
          promotion decisions. If those decisions were shaped by who had a visible project or a well-connected
          manager, the model learns that and applies it forward with a machine&rsquo;s consistency. This is the
          mechanism behind most documented cases of biased hiring models, and note where it happened:{" "}
          <strong>in the label definition, before any modelling.</strong> No amount of removing protected
          attributes from <em>X</em> touches it.
        </p>

        <h2>Four questions to interrogate any label with</h2>
        <ul>
          <li><strong>Who or what generated it?</strong> A human judgement, an automated rule, a physical
            measurement, or a previous model? The last case is the worst — you are distilling the old model,
            including its mistakes.</li>
          <li><strong>What does a negative actually mean?</strong> Usually not &ldquo;we checked and it was
            fine&rdquo; but &ldquo;nothing was recorded.&rdquo; Unlabelled and negative are different, and
            treating one as the other systematically depresses whatever you are trying to detect.</li>
          <li><strong>Over what window is it defined, and does the window depend on the row?</strong> If recent
            rows have had less time to turn positive, recency is now correlated with the label, and every
            time-related feature becomes a leak.</li>
          <li><strong>Would two careful people produce the same label?</strong> If not, you have an irreducible
            noise floor. Measure it — relabel a few hundred rows independently — because it is the ceiling your
            metric is approaching, and teams routinely burn quarters trying to cross it.</li>
        </ul>

        <h2>Continuous, then thresholded — in that order</h2>
        <p>
          When the underlying quantity is continuous, resist thresholding it into a class until the last possible
          moment. &ldquo;Will this customer spend more than £100?&rdquo; discards the difference between £101 and
          £4,000, and it hands the model a boundary chosen for reporting convenience. Predict the amount, and
          threshold the prediction according to whatever the decision needs — a threshold you can then move
          without retraining.
        </p>
        <p>
          We come back to this as a task-choice decision on{" "}
          <Link href="/learn/data-workflow/regression-classification-or-ranking" style={link}>the next page</Link>,
          and the mechanics of choosing the operating point live in{" "}
          <Link href="/learn/evaluation/cost-sensitive-thresholds" style={link}>cost-sensitive thresholds</Link>.
        </p>

        <Callout color={GRAY} title={<>The one-line test</>}>
          Write your label as a sentence containing a window, a population and a rule:{" "}
          <em>&ldquo;1 if the account had no logins in the 60 days after the cut-off, among accounts active on
          the cut-off date.&rdquo;</em> If you cannot write that sentence, you do not know what your model
          predicts — and neither will anyone reading your results.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/data-workflow/the-unit-of-analysis", label: <>← What is one row?</> }}
          next={{ href: "/learn/data-workflow/what-you-know-at-prediction-time", label: <>Next up · What you know at prediction time →</> }}
        />
      </div>
    </article>
  );
}
