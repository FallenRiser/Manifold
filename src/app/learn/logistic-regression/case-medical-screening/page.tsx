import { M } from "@/components/Math";
import { ThresholdLab } from "@/components/labs/ThresholdLab";
import { RocLab } from "@/components/labs/RocLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-classification)";

export const metadata = {
  title: "Case B: medical screening & thresholds — Manifold",
  description: "A screening test lives or dies on the threshold. Here's why medical screening pushes it far from 0.5, how ROC guides the choice, and the base-rate trap that fools even doctors.",
};

export default function CaseMedicalScreeningPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: ACCENT }, { label: "Case study", color: "var(--c-fundamentals)" }]}
        time="about 11 minutes"
        title={<>Case B: medical screening &amp; thresholds</>}
        intro={<>
          Same model, a world away in stakes. A screening test estimates each patient&rsquo;s probability of
          disease, and the threshold that turns that probability into &ldquo;call them back&rdquo; is a
          life-and-death dial. Where you set it — and why it&rsquo;s nowhere near 0.5 — is the whole case.
        </>}
      />

      <div className="lesson">
        <h2>Screening is not diagnosis</h2>
        <p>
          A screening test is the cheap first pass over a large, mostly-healthy population; a positive result
          doesn&rsquo;t mean &ldquo;you have the disease,&rdquo; it means &ldquo;you go on to the accurate,
          expensive confirmatory test.&rdquo; That reframes the two errors completely. A{" "}
          <strong>false negative</strong> sends a sick patient home reassured — potentially catastrophic. A{" "}
          <strong>false positive</strong> costs one more test and some anxiety — unpleasant, but recoverable.
          The asymmetry is enormous, so the metric that matters is <strong>recall (sensitivity)</strong>: of the
          people who truly have the disease, how many do we catch?
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>Given that a missed case is far worse than a false alarm, which way should the screening threshold move from the default 0.5?</>}
          options={[
            "Down — a lower bar flags more people, catching more true cases (higher recall)",
            "Up — only flag when very confident",
            "Stay at 0.5 — it's always optimal",
          ]}
          nudge={<>In the lab, slide the cutoff left and watch recall and the false-negative count.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Slide the cutoff well below 0.5. Watch recall climb toward 100% and false negatives fall to zero — while false positives (extra confirmatory tests) rise. That trade is the screening design.</>}
          insight={<>Lowering the threshold trades precision for recall — and for screening that&rsquo;s exactly right: every
            extra false positive is one more confirmatory test, while every avoided false negative might be a life. The
            &ldquo;best&rdquo; cutoff here is deliberately far from 0.5, chosen by the asymmetry of the costs, precisely the
            <M>{String.raw`\;t^\* = C_{fp}/(C_{fp}+C_{fn})`}</M> logic with a very large <M>{String.raw`C_{fn}`}</M>.</>}
        >
          <ThresholdLab />
        </LabFrame>

        <h2>ROC picks the operating point</h2>
        <p>
          How far down is far enough? The ROC curve lays out every threshold&rsquo;s (sensitivity, false-positive
          rate) at once, so you can pick the operating point that meets a policy target — say, &ldquo;catch 95%
          of cases&rdquo; — and read off the false-positive rate you&rsquo;ll pay for it. The <strong>AUC</strong>{" "}
          summarises the test&rsquo;s intrinsic quality independent of threshold, which is how screening tests are
          compared in the literature; but the deployed test lives at one chosen point on that curve, not at the AUC.
        </p>

        <LabFrame
          accent={ACCENT}
          tryThis={<>Walk the operating point up toward the top of the curve — high sensitivity. Note the false-positive rate you accept to get there, and that the curve&rsquo;s shape (the AUC) is fixed regardless.</>}
          insight={<>Screening operates near the top of the ROC curve — high sensitivity, and whatever false-positive rate that
            demands. The curve&rsquo;s shape is the test&rsquo;s quality; the point you occupy on it is a policy choice about
            how many confirmatory tests the system can absorb. Two different clinics can deploy the <em>same</em> test at
            different points for the same reason two lenders pick different thresholds.</>}
        >
          <RocLab />
        </LabFrame>

        <h2>The base-rate trap</h2>
        <p>
          Here is the subtlety that fools even clinicians. Suppose the disease affects 1 in 1,000, and the test is
          excellent: 99% sensitivity, 95% specificity. A patient tests positive — what&rsquo;s the chance they
          actually have the disease? Intuition says ~95%. The real answer is under <strong>2%</strong>. Of 1,000
          people, ~1 is sick (caught) but ~50 healthy people also test positive (5% of 999). So a positive means
          sick only about <M>{String.raw`1/51 \approx 2\%`}</M> of the time.
        </p>
        <p>
          This is why a screening positive is a <em>referral</em>, not a diagnosis, and why <strong>calibrated
          probabilities</strong> matter so much: telling a patient &ldquo;your risk is now 2%&rdquo; is honest and
          actionable; telling them &ldquo;you tested positive&rdquo; without the base rate is misleading. Precision
          (positive predictive value) depends on prevalence, not just the test — the same lesson the PR-curve page
          made in the abstract, here with a human on the other end.
        </p>

        <Callout color={ACCENT} title={<>What the case teaches</>}>
          When one error dwarfs the other, the threshold leaves 0.5 and the metric becomes recall; ROC turns
          &ldquo;how cautious?&rdquo; into a concrete operating point; and calibration plus the base rate turn a
          raw positive into a probability a person can actually reason about. Logistic regression fits medical
          screening not because it&rsquo;s the most accurate classifier, but because it gives the calibrated,
          explainable probability the whole decision is built on.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "Why does medical screening set the threshold well below 0.5?",
              options: [
                "To maximise accuracy",
                "A missed case (false negative) is far costlier than a false alarm, so you prioritise recall/sensitivity",
                "Because probabilities below 0.5 are more reliable",
              ],
              answer: 1,
              explain: "A false negative can be fatal; a false positive costs a confirmatory test. That asymmetry (a large C_fn) pushes t* = C_fp/(C_fp+C_fn) far below 0.5 — flag on a small probability to catch nearly every true case.",
            },
            {
              q: "A test with 99% sensitivity and 95% specificity is positive for a patient; disease prevalence is 1 in 1,000. Roughly the chance they're actually sick?",
              options: ["About 99%", "About 2% — false positives from the huge healthy majority dominate", "Exactly 50%"],
              answer: 1,
              explain: "~1 true positive vs ~50 false positives per 1,000 people → PPV ≈ 1/51 ≈ 2%. Precision depends on prevalence; a great test can still yield mostly false positives when the disease is rare. Hence: screening positive = referral, not diagnosis.",
            },
            {
              q: "What does the ROC curve provide for a screening program?",
              options: [
                "The single correct threshold",
                "Every threshold's sensitivity/false-positive trade at once, so you can choose an operating point to meet a policy target",
                "The disease prevalence",
              ],
              answer: 1,
              explain: "ROC shows the full sensitivity–FPR frontier. You pick the operating point that meets a target (e.g. 95% sensitivity) and accept the corresponding false-positive rate; AUC rates the test's quality independent of that choice.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/logistic-regression/case-credit-default", label: <>← Case A: credit default</> }}
          next={{ href: "/learn/evaluation", label: <>Go deeper · the Evaluation &amp; Metrics pillar →</> }}
        />
      </div>
    </article>
  );
}
