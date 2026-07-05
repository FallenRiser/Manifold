import { M } from "@/components/Math";
import { CostLab } from "@/components/labs/CostLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-classification)";

export const metadata = {
  title: "Cost-sensitive decisions — Manifold",
  description: "When a false negative costs more than a false positive, 0.5 is the wrong threshold. For a calibrated model, the optimal cutoff has a one-line formula.",
};

export default function CostSensitivePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: ACCENT }, { label: "Practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Cost-sensitive decisions</>}
        intro={<>
          This is where the whole track pays off. You have honest probabilities and a curve of
          options — now turn them into the single decision the business actually needs, using the
          one input models can&rsquo;t supply: what mistakes cost.
        </>}
      />

      <div className="lesson">
        <p>
          The default threshold of 0.5 quietly assumes a false positive and a false negative are
          equally bad. They almost never are. Missing a fraudulent transaction costs the whole
          transaction; a false alarm costs a few seconds of review. Missing a tumour costs a life;
          a false alarm costs a follow-up scan. Once the two mistakes have different prices, the
          break-even point where &ldquo;flag&rdquo; beats &ldquo;don&rsquo;t flag&rdquo; is no longer
          50%.
        </p>

        <h2>The optimal threshold, derived</h2>
        <p>
          Say a false negative costs <M>{String.raw`C_{fn}`}</M> and a false positive costs{" "}
          <M>{String.raw`C_{fp}`}</M>. For a case the model rates at probability <M>p</M>, flagging it
          has expected cost <M>{String.raw`(1-p)\,C_{fp}`}</M> (it might be a false alarm); not
          flagging has expected cost <M>{String.raw`p\,C_{fn}`}</M> (it might be a miss). You should
          flag whenever flagging is cheaper, and setting the two equal gives the tipping point:
        </p>
        <p style={{ textAlign: "center" }}>
          <M>{String.raw`t^* = \frac{C_{fp}}{C_{fp} + C_{fn}}`}</M>
        </p>
        <p>
          When the costs are equal this is <M>{String.raw`1/2`}</M> — the familiar 0.5. Make a miss
          ten times costlier and it drops to <M>{String.raw`1/11 \approx 0.09`}</M>: flag anyone with
          even a 9% chance, because missing a real case is so expensive. This clean formula is a{" "}
          <em>direct dividend of calibration</em> — it&rsquo;s only valid if <M>p</M> really means what
          it says, which is exactly why the previous two pages mattered.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>You slide &ldquo;a miss is 10× worse than a false alarm.&rdquo; What should the model do compared to threshold 0.5?</>}
          options={["Flag fewer cases — be more careful", "Flag many more cases — a miss is too expensive to risk", "Nothing changes"]}
          nudge={<>Locked in. Slide the cost ratio up in the lab and watch the optimal threshold and the missed-vs-false-alarm counts.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Drag the cost ratio from 1× up to 20×. Watch the optimal threshold fall and the trade between missed defaults and false alarms shift with it.</>}
          insight={<>At equal cost the answer is 0.50 and the model misses the most defaulters. Crank a miss up to 10×
            and the threshold collapses toward 0.09 — misses drop to a handful while false alarms climb, because now
            each miss is worth ten false alarms. You never retrained the model; you re-priced its decisions. That&rsquo;s
            the entire job of a threshold, made quantitative.</>}
        >
          <CostLab />
        </LabFrame>

        <h2>When you can&rsquo;t name the costs</h2>
        <p>
          Often the business can&rsquo;t hand you a clean dollar cost for each error — but they can
          usually name a <em>constraint</em>. &ldquo;We can review 50 flags a day&rdquo; fixes a
          budget: pick the threshold whose flag count fits, and read off the recall you get.
          &ldquo;We must catch 90% of fraud&rdquo; fixes a recall target: find the threshold that hits
          it, and report the false-alarm load it implies. Either way the move is the same — the model
          produces the whole ROC curve of options, and you choose the operating point that satisfies
          the real-world limit. Never let 0.5 make that choice by default.
        </p>

        <Callout color={ACCENT} title={<>The throughline, closed</>}>
          Look back at what the last three pages did together. Calibration made the probabilities
          <em> mean</em> something; ROC/AUC laid out every threshold as a curve; cost-sensitivity
          picked the one point on that curve the business actually wants. A model that only emitted
          hard labels could do none of this. The reason logistic regression has survived fifty years
          of fancier competitors is that it hands you an honest probability — and an honest
          probability is a decision waiting for its costs.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "A false negative costs $1000, a false positive costs $50. The cost-optimal threshold for a calibrated model is about…",
              options: ["0.95", "0.50", "0.05"],
              answer: 2,
              explain: "t* = C_fp/(C_fp+C_fn) = 50/1050 ≈ 0.048. Because misses are 20× costlier, you flag almost anyone with a nonzero chance — the threshold plummets.",
            },
            {
              q: "The formula t* = C_fp/(C_fp+C_fn) relies on one property of the model. Which?",
              options: ["High accuracy", "Calibrated probabilities — p must really mean p", "A large training set"],
              answer: 1,
              explain: "The derivation compares expected costs (1−p)·C_fp vs p·C_fn, which are only correct if p is a truthful probability. On a miscalibrated model the formula points at the wrong threshold — hence the calibration chapter came first.",
            },
            {
              q: "The business says 'we can only investigate 30 alerts a day' and gives no dollar costs. You should…",
              options: ["Refuse — you need costs", "Pick the threshold whose daily flag count is ~30 and report the resulting recall", "Default to 0.5"],
              answer: 1,
              explain: "A capacity constraint fixes the operating point just as well as costs do: choose the threshold that flags ~30/day and tell them what recall that buys. The ROC curve gives you every option to choose from.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/logistic-regression/roc-auc-and-thresholds", label: <>← ROC, AUC &amp; choosing a threshold</> }}
        />
      </div>
    </article>
  );
}
