import { M } from "@/components/Math";
import { CostLab } from "@/components/labs/CostLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-metrics)";

export const metadata = {
  title: "Cost-sensitive thresholds — Manifold",
  description: "Every metric so far has been a proxy. This is the real target: turn the dollar cost of each mistake into the exact threshold you deploy — and close the loop on the whole pillar.",
};

export default function CostSensitivePage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Evaluation & metrics", color: ACCENT },
          { label: "Practitioner", color: "var(--c-fundamentals)" },
        ]}
        time="about 8 minutes"
        title={<>Cost-sensitive thresholds</>}
        intro={<>
          Precision, recall, F1, AUC — every one is a stand-in for the question you actually care about:
          what will my mistakes cost me? Once you can name the cost of a false alarm and the cost of a miss,
          you don&rsquo;t need a proxy anymore. You can compute the optimal threshold directly.
        </>}
      />

      <div className="lesson">
        <p>
          The default threshold of 0.5 is a convention, not a law — and it&rsquo;s the right choice only when a
          false positive and a false negative cost exactly the same and the classes are balanced. Real problems
          almost never satisfy both. So set the threshold on purpose. Suppose a false positive costs{" "}
          <M>{String.raw`C_{fp}`}</M> and a false negative costs <M>{String.raw`C_{fn}`}</M>. For a calibrated
          probability <M>p</M>, flagging is worth it exactly when the expected cost of flagging is below the
          expected cost of not flagging:
        </p>
        <p style={{ textAlign: "center" }}>
          <M>{String.raw`(1-p)\,C_{fp} \;<\; p\,C_{fn}`}</M>
        </p>
        <p>
          Solve for <M>p</M> and the whole decision collapses to a single cutoff:
        </p>
        <p style={{ textAlign: "center" }}>
          <M>{String.raw`t^\* = \frac{C_{fp}}{C_{fp} + C_{fn}}`}</M>
        </p>
        <p>
          That&rsquo;s the entire idea. If a miss is 9× as costly as a false alarm, <M>{String.raw`t^\* = 1/(1+9) = 0.1`}</M>:
          flag anyone with more than a 10% chance. Notice the threshold moves <em>opposite</em> to the cost of a
          miss — the more a miss hurts, the lower the bar for flagging. And notice the formula never mentions
          precision, recall, or F1: it goes straight from costs to a cutoff.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>In the lab you set how many times worse a missed default is than a false alarm. As you raise that ratio from 1× to 10×, which way does the optimal threshold move?</>}
          options={[
            "Down — a costlier miss means flag more eagerly, so a lower bar",
            "Up — be more careful before flagging",
            "It stays at 0.5",
          ]}
          nudge={<>Drag the cost ratio and watch <M>{String.raw`t^\*`}</M> and the number of missed defaults.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Set the ratio to 1× (equal costs) and note the threshold. Then push it to 10× and watch <M>{String.raw`t^\*`}</M> drop and the missed-defaults count collapse — you&rsquo;re buying recall with a lower bar, priced in cost.</>}
          insight={<>At 1× the optimum is the familiar 0.50. At 10× it falls to 0.09, cutting misses from 23 to 3 — at the
            cost of more false alarms, exactly as the trade demands. This only works because the probabilities are
            calibrated: <M>{String.raw`t^\*`}</M> is a statement about real probabilities, so a miscalibrated model would
            put the cutoff in the wrong place. That&rsquo;s why calibration came first.</>}
        >
          <CostLab />
        </LabFrame>

        <h2>When you can&rsquo;t name the costs</h2>
        <p>
          Sometimes you genuinely can&rsquo;t put dollars on a mistake. Two honest fallbacks: pick the
          threshold that hits a <strong>required recall or precision</strong> dictated by policy (&ldquo;we must
          catch 95% of fraud&rdquo; → read the threshold off the PR curve at recall 0.95), or optimise a blended
          metric like F1 as a last resort. But treat these as approximations of the cost calculation, not
          replacements for it — the question &ldquo;what does a mistake cost?&rdquo; is always lurking underneath,
          and answering it explicitly beats letting a default threshold answer it for you by accident.
        </p>

        <Callout color={ACCENT} title={<>The pillar, in one arc</>}>
          <strong>Accuracy</strong> hid the mistakes → the <strong>confusion matrix</strong> separated them →{" "}
          <strong>precision &amp; recall</strong> named them and <strong>F1</strong> blended them when you couldn&rsquo;t
          choose → <strong>ROC/PR curves</strong> graded the model across every threshold → <strong>calibration</strong>{" "}
          made the probabilities honest → and here, <strong>cost</strong> turns those honest probabilities into the exact
          threshold you deploy. Every metric was a proxy for this: <em>choose the operating point that minimises what your
          mistakes actually cost.</em>
        </Callout>

        <h2>The habit to keep</h2>
        <p>
          Before you report a single evaluation number again, ask three questions in order. What does a mistake
          cost — and are the two mistakes different? Is the data imbalanced, so accuracy and ROC will flatter me?
          Do I need the probability itself, or only the ranking? Your answers pick the metric. There is no best
          metric in the abstract — only the one that matches the decision in front of you.
        </p>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "A false negative costs $500, a false positive costs $20. The cost-optimal threshold t* is about…",
              options: ["0.50", "0.04 — flag at even a small probability", "0.96"],
              answer: 1,
              explain: "t* = C_fp / (C_fp + C_fn) = 20 / (20 + 500) ≈ 0.038. Because a miss is 25× costlier, you flag at just a ~4% probability.",
            },
            {
              q: "The t* formula assumes the model's probabilities are…",
              options: ["Ranked correctly, nothing more", "Calibrated — the probability genuinely means what it says", "Always above 0.5"],
              answer: 1,
              explain: "t* is a statement about true probabilities. If the model is overconfident, the same cutoff lands in the wrong place. That's why calibration is a prerequisite for cost-based thresholding.",
            },
            {
              q: "The single best summary of this whole pillar is…",
              options: [
                "Always maximise F1",
                "There's no universally best metric — choose the one that matches what a mistake costs in your problem",
                "Accuracy is fine if it's above 90%",
              ],
              answer: 1,
              explain: "Every metric encodes an assumption about relative costs and class balance. The skill is choosing the metric (and threshold) that reflects your actual decision — not defaulting to one out of habit.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/evaluation/calibration", label: <>← Calibration</> }}
          next={{ href: "/learn/evaluation/rmse-vs-mae", label: <>Next up · RMSE vs MAE (regression) →</> }}
        />
      </div>
    </article>
  );
}
