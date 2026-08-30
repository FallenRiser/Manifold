import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { ErrorAnalysisLab } from "@/components/labs/ErrorAnalysisLab";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Error analysis — Manifold",
  description:
    "The highest-return hour in any stalled project. Slice the errors, find where they concentrate, and act there. Measured: 25% of traffic holding 14 of 15 errors, and two slices that find nothing.",
};

const GRAY = "var(--c-metrics)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const CODE = `# Error analysis as a loop over candidate slices. The output is a table
# you SORT BY LIFT -- errors concentrated relative to traffic -- because a
# slice with a bad rate that is only 1% of your data is rarely the lever.

def slices(X, y_true, y_pred, proba=None):
    cands = {"true_label": y_true}
    for col in ["region", "device", "plan", "channel"]:
        cands[col] = X[col]
    for col in ["tenure_days", "order_value"]:
        cands[col] = pd.qcut(X[col], 4, labels=False, duplicates="drop")
    if proba is not None:
        cands["confidence"] = pd.qcut(proba.max(axis=1), 4,
                                      labels=False, duplicates="drop")

    wrong = (y_pred != y_true)
    rows = []
    for name, s in cands.items():
        for level, mask in pd.Series(s).groupby(s):
            m = s == level
            rows.append({
                "slice": f"{name}={level}",
                "n": m.sum(),
                "error_rate": wrong[m].mean(),
                "share_of_errors": wrong[m].sum() / wrong.sum(),
                "share_of_traffic": m.mean(),
            })
    out = pd.DataFrame(rows)
    out["lift"] = out.share_of_errors / out.share_of_traffic
    return out.sort_values("lift", ascending=False)

# Then READ THE ROWS in the top slice. Fifty of them, by hand. The table
# tells you where to look; only the rows tell you what is wrong.`;

export default function ErrorAnalysisPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "From baseline to better", color: GRAY }, { label: "Tier 2 · practitioner", color: GRAY }]}
        time="about 10 minutes"
        title={<>Error analysis</>}
        intro={<>If this pillar has one page to justify itself, this is it. An aggregate metric compresses every
          mistake your model makes into a single number, and then you are asked to decide what to do next from
          that number. You cannot. So decompress it.</>}
      />

      <div className="lesson">
        <h2>The average is nobody&rsquo;s experience</h2>
        <p>
          &ldquo;97% accurate&rdquo; describes no actual user. Some users get a system that is right every single
          time; some get one that is wrong a third of the time. Which of those you are in the presence of changes
          what you should build next, and the aggregate cannot tell you.
        </p>
        <p>
          Error analysis is the practice of asking <strong>where the mistakes are, rather than how many there
          are</strong>. It is the highest-return hour available in a stalled project, and it is skipped almost
          universally, because tuning has a progress bar and looking at errors does not.
        </p>

        <PredictPrompt
          accent={GRAY}
          prompt={<>A digit classifier gets 97.2% on 540 test rows — 15 errors. You split the test set into four equal groups by the model's own confidence. What share of those 15 errors do you expect in the least-confident quarter?</>}
          options={[
            "About a quarter — confidence is a rough guide at best",
            "Around half — some concentration, but plenty of confident mistakes",
            "Nearly all of them",
          ]}
        />

        <LabFrame
          accent={GRAY}
          tryThis={<>Start on confidence and click the tallest bar. Then switch to &ldquo;total ink&rdquo; — a perfectly plausible hunch about what makes digits hard — and click through those bars too.</>}
          insight={<>Confidence concentrates the errors ferociously: the lowest quartile is <strong>25% of traffic holding 14 of the 15 errors</strong>, roughly 3.7× its share. Total ink finds essentially nothing — every quartile sits near the overall rate. <strong>Two of the three slicings are duds, and that is the normal ratio.</strong> Error analysis is a search, and the discipline is trying many slices cheaply rather than being clever about one.</>}
        >
          <ErrorAnalysisLab />
        </LabFrame>

        <Callout color={GRAY} title={<>Sort by lift, not by error rate</>}>
          A slice with a terrible error rate that covers 0.5% of your traffic is a curiosity. A slice with a
          moderately bad rate covering 30% of traffic is your quarter&rsquo;s work. The quantity that ranks these
          correctly is <strong>share of errors divided by share of traffic</strong> — how much the errors
          concentrate. The confidence slice above scores 3.7 on that measure; the ink slices score close to 1.0,
          which is the number that means &ldquo;nothing here&rdquo;.
        </Callout>

        <h2>The slices worth trying, in order</h2>
        <ol>
          <li><strong>The model&rsquo;s own confidence.</strong> Always available, requires no extra data, and
            almost always concentrates something. It also has a directly actionable consequence, below.</li>
          <li><strong>The true label or target range.</strong> Which classes get confused with which; whether
            errors pile up at the top or bottom of a regression target.</li>
          <li><strong>Every categorical column you have.</strong> Region, device, plan, channel, source system.
            Cheap, and this is where the uncomfortable findings live.</li>
          <li><strong>Quartiles of each numeric column.</strong> Including ones you did not use as features —
            especially those, since a slice defined by an unused column suggests a feature you are missing.</li>
          <li><strong>Time.</strong> Error rate by month. A rise is drift; a step change is usually an upstream
            data change.</li>
          <li><strong>Data provenance.</strong> Which source system, which vintage, which collection process.
            Reliably the most productive slice in messy real data and the one people never think to try.</li>
        </ol>
        <CodeBlock fromScratch={CODE} />

        <h2>The step nobody does: read the rows</h2>
        <p>
          The table tells you <em>where</em>. Only the individual examples tell you <em>what</em>. Pull fifty rows
          from the worst slice, look at each one, and sort them into causes by hand:
        </p>
        <ul>
          <li><strong>The label is wrong.</strong> Extremely common, and it caps your metric — a 3% label error
            rate means 97% is a perfect score. This is measurable and worth measuring.</li>
          <li><strong>The information genuinely is not there.</strong> Two rows, identical features, different
            outcomes. No model can separate them, and this is your irreducible floor.</li>
          <li><strong>The information is there and the model missed it.</strong> A capacity or feature problem,
            and the only one of these four that more modelling fixes.</li>
          <li><strong>The row should not be in scope.</strong> A population you did not intend to serve — which
            is a framing fix, back at the start of the loop.</li>
        </ul>
        <p>
          The proportions in that tally are the single most useful piece of information about what to do next.
          They are the input to the decision procedure on{" "}
          <Link href="/learn/data-workflow/what-to-do-next" style={link}>the next page</Link>, and there is no
          substitute for having read the rows.
        </p>

        <Callout color={GRAY} title={<>The confidence slice has an immediate use, before any modelling</>}>
          If the least-confident quarter holds nearly all of your errors, you do not have to fix the model to fix
          the outcome. Route that quarter to a human, or abstain. In the measured example you would send{" "}
          <strong>25% of traffic</strong> for review and remove <strong>14 of 15 errors</strong> from the automated
          path — an enormous quality gain from a routing rule and no retraining. Selective prediction is
          under-used precisely because error analysis is, and it depends on the probabilities being{" "}
          <Link href="/learn/evaluation/calibration" style={link}>calibrated</Link> rather than merely ordered.
        </Callout>

        <h2>Why this reliably beats tuning</h2>
        <p>
          Hyperparameter search moves an aggregate metric by a fraction of a point and tells you nothing about
          the world. An hour of error analysis routinely finds a broken join affecting one region, a label
          definition that changed in March, a subgroup the model has never seen enough of, or a slice you should
          not have been serving. Those findings are worth points, and they are worth them <em>durably</em>,
          because they fix a cause rather than a symptom.
        </p>
        <p>
          They also tend to be the findings that make a project defensible. &ldquo;We improved AUC by
          0.004&rdquo; is a sentence nobody acts on. &ldquo;A third of our errors come from one acquisition
          channel whose records are missing a field&rdquo; is a sentence that starts work.
        </p>

        <PrevNext
          prev={{ href: "/learn/data-workflow/the-first-real-model", label: <>← The first real model</> }}
          next={{ href: "/learn/data-workflow/what-to-do-next", label: <>Next up · What to do next →</> }}
        />
      </div>
    </article>
  );
}
