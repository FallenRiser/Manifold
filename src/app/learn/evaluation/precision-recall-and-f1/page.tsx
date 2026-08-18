import { M } from "@/components/Math";
import { ThresholdLab } from "@/components/labs/ThresholdLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-metrics)";

export const metadata = {
  title: "Precision, recall & F1 — Manifold",
  description: "Precision and recall name the two mistakes a classifier makes. F1 blends them — but only when you can't say which mistake is worse. Learn which to optimize, and when.",
};

export default function PrecisionRecallF1Page() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Evaluation & metrics", color: ACCENT },
          { label: "Intuition", color: "var(--c-fundamentals)" },
        ]}
        time="about 9 minutes"
        title={<>Precision, recall &amp; F1</>}
        intro={<>
          Two numbers replace the one that lied to us. Precision asks &ldquo;when I flag something, am
          I right?&rdquo; Recall asks &ldquo;of everything I should have caught, how much did I?&rdquo;
          They pull in opposite directions — and knowing which one your problem cares about is most of
          the job.
        </>}
      />

      <div className="lesson">
        <p>
          Both are ratios of confusion-matrix cells, and the trick to never confusing them is to notice
          which cell they <em>share</em> and which they don&rsquo;t:
        </p>
        <p style={{ textAlign: "center" }}>
          <M>{String.raw`\text{precision}=\frac{TP}{TP+FP}\quad(\text{purity of what you flagged}), \qquad \text{recall}=\frac{TP}{TP+FN}\quad(\text{coverage of what's out there})`}</M>
        </p>
        <p>
          Precision is penalised by <strong>false positives</strong> (junk in your flagged pile); recall
          is penalised by <strong>false negatives</strong> (the ones you let slip). Notice what&rsquo;s
          missing from both: the true negatives. Precision and recall <em>ignore</em> the giant TN cell
          entirely — which is exactly why they survive class imbalance where accuracy drowns. When 99% of
          cases are negative, that 99% never enters either formula.
        </p>

        <h2>They trade off — always</h2>
        <p>
          You can buy recall with a lower threshold (flag more, catch more, but flag more junk too) or
          buy precision with a higher one (flag only when very sure, stay clean, but miss more). Except in
          the rare case of a perfectly separable dataset, you cannot maximise both at once. The threshold
          is the dial that sets the exchange rate.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>In the lab, you push the cutoff up to 0.9 so you only flag when very confident. What happens to precision and recall?</>}
          options={["Precision rises, recall falls", "Recall rises, precision falls", "Both rise together"]}
          nudge={<>Drag the cutoff to the right edge and read the two metric tiles.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Find the cutoff that gives the highest recall <em>without</em> dropping precision below 70%. Then find the one that maximises precision. Notice you can&rsquo;t have both.</>}
          insight={<>Slide right and precision climbs while recall sinks; slide left and they swap. The two curves cross
            somewhere in the middle — that crossing is roughly where F1 peaks. But &ldquo;peak F1&rdquo; is only the right
            target if a false alarm and a miss cost you the same. Usually they don&rsquo;t.</>}
        >
          <ThresholdLab />
        </LabFrame>

        <h2>F1: one number when you can&rsquo;t pick a side</h2>
        <p>
          Sometimes you genuinely need a single score — to rank models on a leaderboard, say. F1 is the{" "}
          <strong>harmonic</strong> mean of precision and recall:
        </p>
        <p style={{ textAlign: "center" }}>
          <M>{String.raw`F_1 = 2\cdot\frac{\text{precision}\cdot\text{recall}}{\text{precision}+\text{recall}}`}</M>
        </p>
        <p>
          Why harmonic and not a plain average? Because the harmonic mean is dragged toward the{" "}
          <em>smaller</em> of the two. A model with precision 0.95 and recall 0.05 averages to 0.50 the
          ordinary way — flattering nonsense for a model that misses 95% of cases. Its F1 is <strong>0.095</strong>.
          F1 refuses to let one good number paper over one terrible one; you only score high if{" "}
          <em>both</em> are high.
        </p>

        <h2>The part everyone gets wrong: F1 is not the goal</h2>
        <p>
          F1 hard-codes an assumption — that precision and recall matter <em>equally</em>. That assumption
          is usually false. Two examples pull in opposite directions:
        </p>
        <ul>
          <li>
            <strong>Cancer screening</strong> — a miss (false negative) can be fatal; a false alarm just
            means a follow-up test. You want <strong>recall</strong>, even at the cost of precision. Optimising
            F1 here would trade away recall you can&rsquo;t afford to lose.
          </li>
          <li>
            <strong>Spam / content flagging</strong> — a false positive deletes someone&rsquo;s real, wanted
            email; a miss just leaves one spam in the inbox. You want <strong>precision</strong>.
          </li>
        </ul>
        <p>
          When the two mistakes have different costs, the honest metric is <M>{String.raw`F_\beta`}</M>,
          which weights recall <M>{String.raw`\beta`}</M> times as heavily as precision (<M>{String.raw`\beta>1`}</M>{" "}
          favours recall, <M>{String.raw`\beta<1`}</M> favours precision) — or better still, skip the blended
          score entirely and price the mistakes in dollars, which is the{" "}
          <a href="/learn/evaluation/cost-sensitive-thresholds" style={{ color: ACCENT }}>cost-sensitive threshold</a>{" "}
          page. F1 is a reasonable <em>default when you truly have no information</em> about relative cost — and a
          lazy answer the moment you do.
        </p>

        <Callout color={ACCENT} title={<>The decision, in one line</>}>
          Misses hurt more → optimise recall. False alarms hurt more → optimise precision. Truly can&rsquo;t
          say → F1. Can put a number on the two costs → forget blended metrics and choose the threshold that
          minimises expected cost. The metric should be chosen <em>after</em> you know what a mistake costs, never before.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "A model has precision 0.9 and recall 0.1. Its F1 score is closest to…",
              options: ["0.50 — the average", "0.18 — dragged toward the smaller value", "0.90"],
              answer: 1,
              explain: "F1 = 2·(0.9·0.1)/(0.9+0.1) = 0.18. The harmonic mean punishes the lopsided recall — which is the whole point of using it instead of a plain average.",
            },
            {
              q: "For a hospital's cancer-screening model, which metric should you prioritise?",
              options: ["Precision — avoid false alarms", "Recall — a missed cancer is far costlier than a false alarm", "Accuracy"],
              answer: 1,
              explain: "A false negative (missed cancer) can be fatal; a false positive just triggers a confirmatory test. You accept lower precision to push recall as high as possible.",
            },
            {
              q: "Why do precision and recall handle class imbalance better than accuracy?",
              options: ["They're computed on balanced subsamples", "Neither uses the true-negative count, so a huge negative class can't inflate them", "They ignore false positives"],
              answer: 1,
              explain: "Both formulas exclude TN. Accuracy is dominated by the large negative class on imbalanced data; precision and recall focus only on the positives, which is usually what you care about.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/evaluation/the-confusion-matrix", label: <>← The confusion matrix</> }}
          next={{ href: "/learn/evaluation/roc-auc-and-pr-curves", label: <>Next up · ROC, AUC &amp; PR curves →</> }}
        />
      </div>
    </article>
  );
}
