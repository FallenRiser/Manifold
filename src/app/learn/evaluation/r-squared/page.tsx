import { M } from "@/components/Math";
import { RSquaredLab } from "@/components/labs/RSquaredLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-metrics)";

export const metadata = {
  title: "R² & adjusted R² — Manifold",
  description: "RMSE tells you the error in dollars. R² tells you how much better than guessing the mean you did — a unit-free score from 0 to 1. But it has a trap that adjusted R² exists to fix.",
};

export default function RSquaredPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Evaluation & metrics", color: ACCENT },
          { label: "Practitioner", color: "var(--c-fundamentals)" },
        ]}
        time="about 8 minutes"
        title={<>R² &amp; adjusted R²</>}
        intro={<>
          RMSE is in the units of your target, which makes it concrete but not comparable across problems —
          is an RMSE of 3 good? R² answers a different, unit-free question: how much of the variation in the
          data did your model actually explain, compared to the laziest possible baseline?
        </>}
      />

      <div className="lesson">
        <p>
          The baseline R² measures against is the dumbest regressor there is: <strong>always predict the mean
          of <M>y</M></strong>, ignoring the features entirely. Its total squared error is the total variance in
          the data, <M>{String.raw`SS_{\text{tot}} = \sum_i (y_i - \bar y)^2`}</M>. Your model&rsquo;s squared
          error is <M>{String.raw`SS_{\text{res}} = \sum_i (y_i - \hat y_i)^2`}</M>. R² is how much of that
          variance you removed:
        </p>
        <p style={{ textAlign: "center" }}>
          <M>{String.raw`R^2 = 1 - \frac{SS_{\text{res}}}{SS_{\text{tot}}}`}</M>
        </p>
        <p>
          Read it as a fraction of variance explained. <M>{String.raw`R^2 = 1`}</M> is a perfect fit
          (<M>{String.raw`SS_{\text{res}} = 0`}</M>); <M>{String.raw`R^2 = 0`}</M> means you did exactly as well
          as predicting the mean — your features bought you nothing. And yes, R² <strong>can go negative</strong>:
          a model worse than the mean baseline (easy on a bad test set) scores below zero. That surprises people
          who think of it as &ldquo;a percentage.&rdquo; It&rsquo;s a comparison to a baseline, and you can lose
          to the baseline.
        </p>

        <h2>The trap: R² never punishes complexity</h2>
        <p>
          Here is the failure mode that mirrors the accuracy trap. Add <em>any</em> feature to a linear model —
          even a column of pure random noise — and R² <strong>cannot go down</strong>. The optimiser can always
          set the useless feature&rsquo;s coefficient near zero (no harm) or exploit a chance correlation in the
          training data (small gain). So &ldquo;higher R²&rdquo; is not evidence of a better model; it might just
          be evidence of more columns.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>In the lab you add pure-noise features one at a time. What happens to plain R² versus adjusted R²?</>}
          options={[
            "Both climb — more features, more explanation",
            "R² creeps up; adjusted R² eventually falls as the penalty bites",
            "Both fall immediately",
          ]}
          nudge={<>Drag the noise-feature count up and watch the two bars diverge.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Add noise features one at a time. Watch plain R² tick <em>upward</em> on garbage, while adjusted R² rises only if a feature earns its keep — and drops once they&rsquo;re just noise.</>}
          insight={<>Plain R² rewards you for adding columns even when they&rsquo;re random — it literally cannot decrease.
            Adjusted R² charges a penalty per feature, so it only rises when a new feature explains more than noise would
            by chance. When you&rsquo;re comparing models with different feature counts, adjusted R² is the honest one;
            plain R² will always crown the biggest model.</>}
        >
          <RSquaredLab />
        </LabFrame>

        <h2>Adjusted R²: R² with a complexity tax</h2>
        <p>
          Adjusted R² discounts the score by how many predictors <M>p</M> you spent to earn it, over <M>n</M>{" "}
          data points:
        </p>
        <p style={{ textAlign: "center" }}>
          <M>{String.raw`R^2_{\text{adj}} = 1 - (1 - R^2)\,\frac{n-1}{n-p-1}`}</M>
        </p>
        <p>
          As <M>p</M> grows, the fraction <M>{String.raw`\frac{n-1}{n-p-1}`}</M> inflates, which shrinks the score
          unless the added feature raised R² enough to pay for itself. So adjusted R² can, and does, go down when
          you add junk — exactly the signal plain R² refuses to give. Use it whenever you compare models with
          different numbers of features.
        </p>

        <Callout color={ACCENT} title={<>R² is a score, not a verdict</>}>
          A high R² doesn&rsquo;t mean the model is <em>useful</em> or <em>causal</em> — only that it beats the mean
          on this data. A model can have R² 0.99 and still be useless if its RMSE is huge in absolute terms, or if
          it overfit. Report R² alongside an absolute error (RMSE/MAE) and validate it out-of-sample; on its own it
          flatters. And when feature counts differ, compare with adjusted R², never plain R².
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "A model scores R² = 0. What does that mean?",
              options: [
                "It predicts perfectly",
                "It does exactly as well as always predicting the mean of y",
                "It's impossible — R² starts at 0.5",
              ],
              answer: 1,
              explain: "R² = 1 − SS_res/SS_tot. When your error equals the mean-baseline's error, the ratio is 1 and R² is 0 — your features added nothing over guessing the average.",
            },
            {
              q: "You add 5 columns of random noise to a linear regression. Plain R² will…",
              options: ["Definitely drop", "Stay exactly the same", "Stay the same or rise — it can never decrease"],
              answer: 2,
              explain: "Adding predictors can only maintain or improve the training fit, so R² is non-decreasing in feature count. That's precisely why it can't be trusted to compare models of different sizes — use adjusted R².",
            },
            {
              q: "When comparing a 3-feature model against a 30-feature model, the fairer metric is…",
              options: [
                "Plain R² — higher is better",
                "Adjusted R² — it penalises the extra features that didn't earn their keep",
                "Whichever has more features",
              ],
              answer: 1,
              explain: "Plain R² structurally favours the bigger model. Adjusted R² taxes each feature, so the 30-feature model only wins if those features explain more than noise — the comparison you actually care about.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/evaluation/rmse-vs-mae", label: <>← RMSE vs MAE</> }}
          next={{ href: "/learn/evaluation/cross-validation", label: <>Next up · Cross-validation →</> }}
        />
      </div>
    </article>
  );
}
