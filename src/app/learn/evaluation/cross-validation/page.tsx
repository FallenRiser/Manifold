import { M } from "@/components/Math";
import { CrossValidationLab } from "@/components/labs/CrossValidationLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-metrics)";

export const metadata = {
  title: "One split isn't enough: cross-validation — Manifold",
  description: "Every metric in this pillar is measured on held-out data. But which held-out data? A single train/test split is a noisy estimate — cross-validation is how you get a number you can trust.",
};

export default function CrossValidationPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Evaluation & metrics", color: ACCENT },
          { label: "Practitioner", color: "var(--c-fundamentals)" },
        ]}
        time="about 9 minutes"
        title={<>One split isn&rsquo;t enough: cross-validation</>}
        intro={<>
          Everything so far — precision, RMSE, AUC — is measured on held-out data, because a model graded on
          data it trained on always looks better than it is. But a single held-out split is one roll of the
          dice. Cross-validation rolls it many times and averages, turning a noisy guess into a trustworthy estimate.
        </>}
      />

      <div className="lesson">
        <h2>Why not just measure on the training data?</h2>
        <p>
          Because training error is a rigged exam: the model has already seen the answers. Push a model&rsquo;s
          complexity up and its training error keeps falling all the way to zero — it starts memorising the
          noise. That number tells you nothing about new data. The only honest estimate comes from data the
          model never touched during fitting.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>In the lab, as model complexity rises, training error keeps dropping. What does the validation error do?</>}
          options={[
            "Also drops forever — more complexity is always better",
            "Follows a U: drops, bottoms out, then climbs as the model overfits",
            "Stays flat regardless of complexity",
          ]}
          nudge={<>Slide the degree up and watch the two curves separate — the purple one turns around.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Slide the complexity to the far right and compare the two curves. Training error slides to nearly zero; validation error bottoms out and then climbs. Find the degree at the bottom of the U.</>}
          insight={<>Training error always improves with complexity, so it can never tell you when to stop — that&rsquo;s why
            you can&rsquo;t evaluate on it. Validation error traces a U: too simple underfits (high bias), too complex
            overfits (high variance), and the dip is the sweet spot. Cross-validation is how you locate that dip
            <em> reliably</em>, instead of trusting one lucky split to find it.</>}
        >
          <CrossValidationLab />
        </LabFrame>

        <h2>The problem with a single split</h2>
        <p>
          So you hold out 20% as a test set. But <em>which</em> 20%? If a few hard examples happen to land in
          the test set, the score looks bad; if they land in training, it looks great. On smaller datasets a
          single split can swing several points just from the luck of the draw. You&rsquo;re reporting one sample
          from a distribution of possible scores and pretending it&rsquo;s the truth.
        </p>

        <h2>k-fold cross-validation</h2>
        <p>
          The fix: split the data into <M>k</M> equal folds (typically <M>k = 5</M> or <M>10</M>). Train on{" "}
          <M>k-1</M> of them, evaluate on the one held out, and repeat <M>k</M> times so <strong>every point
          is in the test fold exactly once</strong>. Average the <M>k</M> scores for your estimate — and read
          their spread as a bonus:
        </p>
        <p style={{ textAlign: "center" }}>
          <M>{String.raw`\text{CV score} = \frac{1}{k}\sum_{j=1}^{k} \text{score}_j \;\pm\; \text{std across folds}`}</M>
        </p>
        <p>
          The mean is a lower-variance estimate than any single split. The standard deviation across folds is
          almost as valuable: it tells you how <em>stable</em> the model is. A model scoring 0.85 ± 0.02 is
          trustworthy; 0.85 ± 0.15 is a coin flip dressed as a result. Two flavours worth knowing:{" "}
          <strong>stratified</strong> k-fold keeps each fold&rsquo;s class balance equal to the whole (essential
          for imbalanced classification), and <strong>leave-one-out</strong> (LOOCV) takes <M>k = n</M> — nearly
          unbiased but expensive and high-variance.
        </p>

        <Callout color={ACCENT} title={<>The leakage rule that ruins CV silently</>}>
          Every step that learns from data — scaling, imputation, feature selection, target encoding — must be
          fit <em>inside</em> each fold, on the training portion only. Fit your scaler on the whole dataset before
          splitting and information from the test fold leaks into training; your CV score comes out optimistic and
          you discover it only in production. Wrap the whole pipeline in the cross-validation loop, not just the
          model. This is the single most common way good practitioners fool themselves.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "Why is training error a poor estimate of real-world performance?",
              options: [
                "It's computed on data the model already fit, so it's optimistically biased",
                "It's always higher than test error",
                "It can't be computed for regression",
              ],
              answer: 0,
              explain: "The model has already seen the training labels, so training error understates the error on new data — and it keeps dropping with complexity even as generalisation gets worse.",
            },
            {
              q: "The main advantage of 5-fold CV over a single 80/20 split is…",
              options: [
                "It trains faster",
                "Every point is tested once and the averaged score has lower variance — plus the fold spread shows stability",
                "It needs no test data",
              ],
              answer: 1,
              explain: "k-fold uses every point for both training and testing across the folds, so the mean score is a more stable estimate than one arbitrary split, and the standard deviation across folds reveals how consistent the model is.",
            },
            {
              q: "You standardise features using the whole dataset's mean and std, then run cross-validation. What's wrong?",
              options: [
                "Nothing — scaling is harmless",
                "Data leakage: test-fold statistics influenced training, so CV scores are optimistic",
                "You should never standardise",
              ],
              answer: 1,
              explain: "The scaler saw the test folds when computing its mean/std, leaking information into training. Fit all data-dependent steps inside each fold. The clean fix is to cross-validate the entire pipeline, not just the estimator.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/evaluation/r-squared", label: <>← R² &amp; adjusted R²</> }}
          next={{ href: "/learn/evaluation/the-evaluation-checklist", label: <>Next up · The evaluation checklist →</> }}
        />
      </div>
    </article>
  );
}
