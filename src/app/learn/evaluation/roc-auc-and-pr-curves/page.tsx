import { M } from "@/components/Math";
import { RocLab } from "@/components/labs/RocLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-metrics)";

export const metadata = {
  title: "ROC, AUC & precision–recall curves — Manifold",
  description: "Precision and recall pin you to one threshold. ROC and PR curves grade the whole model across every threshold at once — and on imbalanced data, only one of them tells the truth.",
};

export default function RocPrPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Evaluation & metrics", color: ACCENT },
          { label: "Practitioner", color: "var(--c-fundamentals)" },
        ]}
        time="about 9 minutes"
        title={<>ROC, AUC &amp; precision–recall curves</>}
        intro={<>
          Precision and recall describe the model <em>at one threshold</em>. But the threshold is a
          choice you haven&rsquo;t made yet — so how do you grade the model itself, before committing?
          You sweep every threshold and plot the trace. That trace is the ROC curve, and the area under
          it is the most-quoted single number in classification.
        </>}
      />

      <div className="lesson">
        <p>
          Fix a threshold and you get one confusion matrix, one precision, one recall. Slide the threshold
          from 1 down to 0 and each of those numbers traces out a path. The <strong>ROC curve</strong>{" "}
          plots one such path: the <strong>true positive rate</strong> (recall) on the y-axis against the{" "}
          <strong>false positive rate</strong> on the x-axis, one point per threshold.
        </p>
        <p style={{ textAlign: "center" }}>
          <M>{String.raw`\text{TPR}=\frac{TP}{TP+FN}=\text{recall}, \qquad \text{FPR}=\frac{FP}{FP+TN}=1-\text{specificity}`}</M>
        </p>
        <p>
          At a threshold of 1 you flag nothing — bottom-left corner, (0, 0). At a threshold of 0 you flag
          everything — top-right, (1, 1). In between, a good model bows toward the <strong>top-left</strong>:
          high recall for a low false-alarm rate. A model that&rsquo;s guessing randomly traces the
          diagonal — every point it flags is as likely to be a false alarm as a hit.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>The shaded area under the ROC curve (AUC) has a clean probabilistic meaning. If a model&rsquo;s AUC is 0.88, what is 0.88 the probability of?</>}
          options={[
            "That a randomly chosen positive gets a higher score than a randomly chosen negative",
            "That the model is 88% accurate",
            "That 88% of predictions are above the threshold",
          ]}
          nudge={<>Walk the curve in the lab and read the AUC line — then reason about what &ldquo;area under it&rdquo; is summing up.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Slide the operating point from the bottom-left to the top-right. Watch recall and false-positive rate climb together — and notice the <em>curve itself never moves</em>. Only your point on it does.</>}
          insight={<>The curve&rsquo;s <em>shape</em> is the model&rsquo;s quality; your point on it is the threshold you&rsquo;d
            deploy. That separation is the whole idea: AUC grades the model independently of any threshold, so you can compare
            two models before deciding where to set the cutoff. AUC = 0.5 is a coin flip (the diagonal); 1.0 is perfect
            separation.</>}
        >
          <RocLab />
        </LabFrame>

        <h2>AUC, in one sentence</h2>
        <p>
          The area under the ROC curve equals the probability that the model scores a random positive
          higher than a random negative. It measures <strong>ranking</strong> quality — can the model put
          positives above negatives? — and says nothing about whether the scores are calibrated or where you
          should threshold. It&rsquo;s threshold-free by construction, which is its strength (compare models
          cleanly) and its blind spot (a great AUC can still hide a terrible operating point for <em>your</em> costs).
        </p>

        <h2>The trap: ROC lies on imbalanced data</h2>
        <p>
          Here&rsquo;s the failure mode that costs practitioners dearly. The false-positive rate has the{" "}
          <em>true-negative count in its denominator</em> — <M>{String.raw`\text{FPR}=FP/(FP+TN)`}</M>. When
          negatives massively outnumber positives (fraud: 1 in 1000), that denominator is enormous, so even
          thousands of false alarms barely nudge the FPR. The ROC curve stays hugging the top-left and AUC
          looks fabulous — while your flagged pile is 95% garbage.
        </p>
        <p>
          The fix is the <strong>precision–recall curve</strong>: plot precision against recall instead.
          Precision has <M>{String.raw`FP`}</M> in its denominator relative to <M>{String.raw`TP`}</M>, not the
          huge TN, so it feels every false alarm. On a 1-in-1000 problem a PR curve will collapse toward the
          floor exactly when ROC stays optimistic. The rule:
        </p>

        <Callout color={ACCENT} title={<>ROC or PR? Let the balance decide</>}>
          Roughly balanced classes, and you care about both errors → <strong>ROC / AUC</strong>. Heavy
          imbalance, and you care mainly about the rare positive class (fraud, disease, defaults) →{" "}
          <strong>precision–recall curve</strong> and its area (average precision). ROC-AUC on a 1%-positive
          problem is the sequel to the accuracy trap: a great-looking number for a model you&rsquo;d never ship.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "An AUC of 0.88 means…",
              options: [
                "The model is 88% accurate",
                "A random positive outranks a random negative 88% of the time",
                "88% of the area is below the diagonal",
              ],
              answer: 1,
              explain: "AUC is the probability that the model assigns a higher score to a randomly chosen positive than to a randomly chosen negative — a pure ranking measure, independent of threshold and of calibration.",
            },
            {
              q: "Your fraud dataset is 0.5% positive. AUC is 0.97 but the flagged transactions are mostly false alarms. What happened?",
              options: [
                "The AUC is computed wrong",
                "FPR barely moves because the true-negative count is huge, so ROC looks great while precision is awful — use a PR curve",
                "0.97 AUC guarantees good precision",
              ],
              answer: 1,
              explain: "On heavy imbalance the enormous TN denominator keeps FPR tiny even with many false positives, so ROC/AUC stay optimistic. The precision–recall curve, which ignores TN, exposes the problem.",
            },
            {
              q: "The key advantage of ROC/PR curves over a single precision or recall number is…",
              options: [
                "They require no threshold — they show performance across all thresholds at once",
                "They're always higher",
                "They don't need labels",
              ],
              answer: 0,
              explain: "A single precision/recall pins you to one threshold. The curves sweep every threshold, letting you judge the model's ranking quality first and choose the operating point second.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/evaluation/precision-recall-and-f1", label: <>← Precision, recall &amp; F1</> }}
          next={{ href: "/learn/evaluation/calibration", label: <>Next up · Calibration →</> }}
        />
      </div>
    </article>
  );
}
