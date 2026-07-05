import { ImbalanceLab } from "@/components/labs/ImbalanceLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-classification)";

export const metadata = {
  title: "Class imbalance & class weights — Manifold",
  description: "When 94% of examples are one class, a model can score 94% accuracy by giving up entirely. Class weights and thresholds are how you make it try.",
};

export default function ImbalancePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: ACCENT }, { label: "Practitioner", color: "var(--c-fundamentals)" }]}
        time="about 9 minutes"
        title={<>Class imbalance &amp; class weights</>}
        intro={<>
          Fraud, disease, defaults, clicks — the events worth predicting are usually rare. And
          rarity quietly breaks the training you just learned, in a way that hides behind a
          reassuring accuracy score.
        </>}
      />

      <div className="lesson">
        <p>
          Our loan dataset has a 6.8% default rate — 61 defaulters in a 900-borrower test set. Train
          a standard logistic model, threshold at 0.5, and it posts <strong>94.7% accuracy</strong>.
          Ship it? Look closer: it catches just <strong>13 of the 61</strong> defaulters. The model
          discovered that the cheapest way to be right 94% of the time is to say &ldquo;no default&rdquo;
          to almost everyone — and log loss, averaged over a sea of easy negatives, barely complains.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>To make the model actually catch defaulters, you switch on <code>class_weight="balanced"</code>. What happens to recall and precision?</>}
          options={["Both improve", "Recall soars, precision drops — many more false alarms", "Nothing; weights only affect training speed"]}
          nudge={<>Locked in. Toggle between the three strategies in the lab and read the recall and precision.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Switch between the three strategies. Watch the &ldquo;caught&rdquo; and &ldquo;missed&rdquo; cells and the recall number — and notice accuracy barely moves while everything that matters swings.</>}
          insight={<>The default model&rsquo;s 94.7% accuracy is a mirage: it beats the do-nothing baseline (93.2%) by a
            hair while catching a fifth of the defaulters. Balancing the class weights, or simply lowering the
            threshold, both trade precision for recall — they push the model to stick its neck out. Which trade is
            right isn&rsquo;t a modelling question; it&rsquo;s &ldquo;what does a missed default cost vs a false alarm?&rdquo;</>}
        >
          <ImbalanceLab />
        </LabFrame>

        <h2>Two levers, one effect</h2>
        <p>
          There are two standard ways to make a model take the rare class seriously, and the lab
          shows both landing in the same place:
        </p>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.8, color: "var(--muted)", fontSize: 15 }}>
          <li>
            <strong style={{ color: "var(--ink)" }}>Class weights.</strong> Multiply each
            example&rsquo;s contribution to the loss by a weight, so misclassifying a rare positive
            costs as much as misclassifying many common negatives.{" "}
            <code>class_weight="balanced"</code> sets the weights inversely proportional to class
            frequency automatically. It changes <em>what the model optimizes for</em>.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Threshold lowering.</strong> Train normally, then
            call &ldquo;positive&rdquo; at 0.10 instead of 0.50. It changes <em>how you read a fixed
            model&rsquo;s probabilities</em> — no retraining. Because the probabilities stay
            untouched, this keeps them honest for other uses.
          </li>
        </ul>
        <p>
          Both convert false negatives (missed defaulters) into true positives at the cost of more
          false positives. Which lever to pull is mostly taste; the threshold approach is often
          cleaner because it leaves you a model whose probabilities still mean what they say.
        </p>

        <h2>The real lesson: stop looking at accuracy</h2>
        <p>
          Imbalance doesn&rsquo;t just call for a fix — it disqualifies accuracy as a metric. On a
          94%-negative problem, &ldquo;94% accurate&rdquo; is the score of total surrender.
          Reach instead for <strong>precision and recall</strong> (what you did with the flags you
          raised, and how many real cases you caught), <strong>F1</strong> or the <strong>AUC</strong>
          (which ignores the threshold entirely), and — best of all — the actual business cost of
          each kind of error. Those get their own pages in the &ldquo;probabilities you can trust&rdquo;
          chapter.
        </p>

        <Callout color={ACCENT} title={<>Don&rsquo;t reach for resampling first</>}>
          You&rsquo;ll hear about SMOTE and random over/under-sampling — synthesizing or duplicating
          minority examples to balance the classes. They sometimes help, but they distort the base
          rate, so the model&rsquo;s output probabilities stop being calibrated (a 0.3 no longer
          means 30%). Class weights and threshold tuning achieve the same recall gains without
          corrupting the probabilities. Start there; reach for resampling only if they aren&rsquo;t
          enough.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "A rare-disease classifier reports 98% accuracy on data that's 98% healthy. Before celebrating, you should suspect…",
              options: ["Nothing — 98% is excellent", "It may be predicting 'healthy' for everyone and catching zero cases (recall 0)", "The test set is too small"],
              answer: 1,
              explain: "98% accuracy exactly matches always-predicting-healthy. Until you see recall (did it catch any sick patients?) the accuracy number is meaningless. This is the accuracy trap the whole page is about.",
            },
            {
              q: "class_weight='balanced' works by…",
              options: ["Deleting majority-class rows", "Weighting each class's loss contribution inversely to its frequency, so rare mistakes cost more", "Lowering the decision threshold automatically"],
              answer: 1,
              explain: "It reweights the loss so the rare class matters as much as the common one during training. (Threshold lowering is the separate, no-retraining lever that reaches a similar recall/precision trade.)",
            },
            {
              q: "Compared to reweighting, the advantage of just lowering the threshold is…",
              options: ["It's more accurate", "It leaves the model's predicted probabilities untouched and still calibrated", "It catches strictly more positives"],
              answer: 1,
              explain: "Threshold tuning doesn't retrain, so the probabilities keep meaning what they say — useful when other downstream decisions depend on calibrated probabilities. Reweighting and resampling both shift the probabilities.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/logistic-regression/regularized-logistic-regression", label: <>← Regularized logistic regression</> }}
          next={{ href: "/learn/logistic-regression/feature-engineering-for-linear-boundaries", label: <>Next up · Feature engineering for linear boundaries →</> }}
        />
      </div>
    </article>
  );
}
