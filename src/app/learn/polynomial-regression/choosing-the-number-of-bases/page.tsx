import { CrossValidationLab } from "@/components/labs/CrossValidationLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-regression)";

export const metadata = {
  title: "Choosing the number of bases — Manifold",
  description: "The bias–variance U has a bottom, but you can't see it from training error. Cross-validation is how you find the right degree, knot count, or bump count from the data itself.",
};

export default function ChoosingBasesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Regression", color: ACCENT }]}
        time="about 8 minutes"
        title={<>Choosing the number of bases</>}
        intro={<>
          You know the sweet spot exists — the bottom of the bias–variance U. Now find it without cheating.
          The wrong way is to trust training error or to peek at the test set. The right way, for degree, knots,
          or bumps alike, is cross-validation.
        </>}
      />

      <div className="lesson">
        <h2>The one number you may not optimise</h2>
        <p>
          The complexity of a basis model — polynomial degree, number of spline knots, number of RBF centres — is
          a <strong>hyperparameter</strong>: you set it, the fit doesn&rsquo;t learn it. And you can&rsquo;t choose
          it by training error, which always rewards more complexity, nor by the final test set, which you must
          keep sealed for an honest performance estimate. Tune on the test set and its score stops meaning
          anything — you&rsquo;ve fit the test set through the back door.
        </p>
        <p>
          The clean solution is a third split: carve a <strong>validation</strong> set out of the training data,
          try each complexity, and keep the one with the best validation error. Cross-validation is the
          low-variance version of that idea.
        </p>

        <h2>k-fold cross-validation, applied to complexity</h2>
        <p>
          Split the training data into <em>k</em> folds. For each candidate complexity, train on <em>k−1</em> folds
          and score the held-out fold, rotating so every fold is scored once; average the <em>k</em> scores. Do
          this for each degree/knot-count and pick the complexity with the lowest average validation error. Because
          it averages over folds, the estimate of the U&rsquo;s bottom is far steadier than any single split.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>In the lab, the purple validation curve and the blue training curve behave differently as complexity rises. Which one do you trust to pick the degree?</>}
          options={[
            "The validation curve — it turns back up when the model starts overfitting",
            "The training curve — lower is always better",
            "Either; they agree",
          ]}
          nudge={<>Only one of the two curves has a minimum in the middle.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Slide the degree and compare the two curves. Training error slides toward zero; validation error dips and then climbs. Read off the degree at the bottom of the validation curve — that&rsquo;s your pick.</>}
          insight={<>The training curve never turns up, so optimising it picks maximum complexity — pure overfitting. The
            validation curve traces the true U and its minimum is the complexity to deploy. Cross-validation just makes that
            minimum reliable by averaging over several folds instead of trusting one lucky split.</>}
        >
          <CrossValidationLab />
        </LabFrame>

        <h2>Two refinements worth knowing</h2>
        <ul>
          <li>
            <strong>The one-standard-error rule.</strong> Among complexities whose CV error is within one standard
            error of the best, pick the <em>simplest</em>. It buys robustness for a hair of accuracy — a good
            default bias toward parsimony when several settings are statistically tied.
          </li>
          <li>
            <strong>Regularization as a continuous alternative.</strong> Instead of searching integer knot counts,
            fix a generous basis and tune a continuous penalty <strong>λ</strong> by the same CV — often easier to
            optimise than a discrete count. That&rsquo;s the next page.
          </li>
        </ul>

        <Callout color={ACCENT} title={<>The rule for every hyperparameter</>}>
          Never choose complexity by training error (it always says &ldquo;more&rdquo;) or by the test set (it must
          stay sealed). Choose it by cross-validated validation error, and lean simpler when settings tie. Degree,
          knots, bumps, penalty strength — same procedure, every time.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "Why can't you pick the polynomial degree using the test set?",
              options: [
                "The test set is too small",
                "Tuning on the test set leaks it into model selection, so its score no longer estimates true performance",
                "Test error can't be computed for polynomials",
              ],
              answer: 1,
              explain: "The test set's job is a single honest performance estimate. If you choose the degree to minimise test error, you've fit the test set — inflating its score. Use cross-validation on the training data instead.",
            },
            {
              q: "In k-fold CV for choosing complexity, you pick the degree that…",
              options: [
                "Minimises training error",
                "Minimises the average validation error across the folds",
                "Uses the most folds",
              ],
              answer: 1,
              explain: "Each candidate degree is scored on held-out folds and averaged; the lowest average validation error marks the bottom of the bias–variance U — the complexity to deploy.",
            },
            {
              q: "The one-standard-error rule says…",
              options: [
                "Always pick the most complex model",
                "Among models within one SE of the best CV score, choose the simplest",
                "Add one to the degree for safety",
              ],
              answer: 1,
              explain: "When several complexities are statistically tied, the simplest is the most robust and least likely to overfit — a small, sensible bias toward parsimony.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/polynomial-regression/bias-variance-and-the-degree", label: <>← Bias–variance &amp; the degree</> }}
          next={{ href: "/learn/polynomial-regression/regularizing-the-basis", label: <>Next up · Regularizing the basis →</> }}
        />
      </div>
    </article>
  );
}
