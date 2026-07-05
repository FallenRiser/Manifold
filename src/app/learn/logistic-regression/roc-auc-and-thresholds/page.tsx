import { RocLab } from "@/components/labs/RocLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Term } from "@/components/Term";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-classification)";

export const metadata = {
  title: "ROC, AUC & choosing a threshold — Manifold",
  description: "Every threshold is one operating point; the ROC curve is all of them at once. AUC scores the model independently of where you set the cutoff.",
};

export default function RocPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: ACCENT }, { label: "Practitioner", color: "var(--c-fundamentals)" }]}
        time="about 9 minutes"
        title={<>ROC, AUC &amp; choosing a threshold</>}
        intro={<>
          Back in the confusion-matrix chapter, one threshold gave one precision and one recall.
          But you can pick any threshold. Plot what happens across <em>all</em> of them and you get
          the most-cited chart in classification.
        </>}
      />

      <div className="lesson">
        <p>
          A trained model hands you a probability for every case; a threshold turns those into
          yes/no verdicts. Slide the threshold from 1 down to 0 and you sweep from &ldquo;flag
          nobody&rdquo; to &ldquo;flag everybody,&rdquo; and at each stop you get a{" "}
          <Term accent={ACCENT} def={<>True positive rate = recall = fraction of actual positives caught. As the threshold drops, TPR only rises (you flag more, so you catch more).</>}>true positive rate</Term>{" "}
          and a{" "}
          <Term accent={ACCENT} def={<>False positive rate = fraction of actual negatives wrongly flagged. Also rises as the threshold drops. The ROC curve trades TPR against FPR.</>}>false positive rate</Term>.
          The <strong>ROC curve</strong> plots one against the other: every point on it is a
          threshold you could choose.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>On the ROC curve, which corner is the dream — perfect recall with zero false alarms?</>}
          options={["Bottom-left (0, 0)", "Top-left (0, 1)", "Top-right (1, 1)"]}
          nudge={<>Locked in. In the lab, slide the operating point and watch which corner means &ldquo;catch everything, false-alarm on nothing.&rdquo;</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Slide the operating point from one end to the other. Watch recall and FPR trade off, and notice the shaded area (the AUC) never changes — only where you sit on the curve does.</>}
          insight={<>The top-left corner is perfection: recall 1, FPR 0. A real curve bows toward it, and how far it bows
            is the model&rsquo;s quality — the area underneath, the AUC. Crucially, moving the threshold slides you
            <em> along</em> the curve but never changes the curve itself. Threshold choice is a business decision;
            the curve is the model. Two different jobs, two different owners.</>}
        >
          <RocLab />
        </LabFrame>

        <h2>AUC: one number for the whole curve</h2>
        <p>
          The <Term accent={ACCENT} def={<>Area under the ROC curve. 1.0 is perfect, 0.5 is random guessing. It equals the probability that the model scores a randomly chosen positive higher than a randomly chosen negative.</>}>AUC</Term>{" "}
          — area under the curve — collapses the whole ROC into a single threshold-free score. It has
          a beautifully concrete meaning: <strong>the probability that the model gives a random
          positive a higher score than a random negative</strong>. 1.0 is a perfect ranker, 0.5 is a
          coin flip (the diagonal), and our model&rsquo;s 0.881 means that 88% of the time it ranks a
          true defaulter above a non-defaulter. Because it ignores the threshold entirely, AUC is the
          standard way to compare models&rsquo; raw ranking power — and, unlike accuracy, it
          isn&rsquo;t fooled by class imbalance.
        </p>

        <h2>ROC vs precision–recall</h2>
        <p>
          One caution: on <strong>heavily imbalanced</strong> problems, ROC can look flatteringly
          good. FPR has the giant negative class in its denominator, so even thousands of false
          positives barely move it. When positives are rare and false positives are the expensive
          mistake, the <strong>precision–recall curve</strong> (precision vs recall) tells the
          honest story, because precision feels every false positive directly. Rule of thumb: ROC/AUC
          for balanced-ish problems and model comparison; PR curves when the positive class is rare
          and you care about the quality of your flags.
        </p>

        <Callout color={ACCENT} title={<>Choosing the actual operating point</>}>
          AUC picks the better <em>model</em>; it does not pick your <em>threshold</em>. That still
          comes from the costs (the confusion-matrix chapter) — and the next page makes it explicit:
          when you know the price of a false negative versus a false positive, the optimal threshold
          for a calibrated model has a clean formula. The ROC curve just shows you every option
          you&rsquo;re choosing among.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "An AUC of 0.5 means…",
              options: ["Half the predictions are correct", "The model ranks no better than random guessing", "The model is perfectly calibrated"],
              answer: 1,
              explain: "AUC 0.5 is the diagonal — the model is as likely to score a random negative above a random positive as the reverse. It's the 'no ranking ability' baseline, unrelated to calibration.",
            },
            {
              q: "You move the decision threshold from 0.5 to 0.3. On the ROC curve you…",
              options: ["Redraw a new curve", "Slide to a different point on the same curve (higher recall, higher FPR)", "Change the AUC"],
              answer: 1,
              explain: "The curve is all thresholds at once, so changing the threshold just moves your operating point along it. The curve — and the AUC — belong to the model and don't move.",
            },
            {
              q: "For a rare-fraud problem where false positives are costly, the more honest curve is…",
              options: ["ROC — it's the standard", "Precision–recall — precision feels every false positive, while FPR barely moves", "Neither; use accuracy"],
              answer: 1,
              explain: "With a huge negative class, FPR stays tiny even with many false positives, so ROC looks great. Precision has the flagged-count in its denominator, so the PR curve exposes the false-positive problem ROC hides.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/logistic-regression/calibration", label: <>← Calibration</> }}
          next={{ href: "/learn/logistic-regression/cost-sensitive-decisions", label: <>Next up · Cost-sensitive decisions →</> }}
        />
      </div>
    </article>
  );
}
