import { M } from "@/components/Math";
import { CalibrationLab } from "@/components/labs/CalibrationLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-metrics)";

export const metadata = {
  title: "Calibration: is 0.8 really 80%? — Manifold",
  description: "AUC grades ranking. But when you act on a probability — expected value, cost-based thresholds, risk scores — the number itself has to be honest. Calibration is whether it is.",
};

export default function CalibrationPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Evaluation & metrics", color: ACCENT },
          { label: "Practitioner", color: "var(--c-fundamentals)" },
        ]}
        time="about 8 minutes"
        title={<>Calibration: is 0.8 really 80%?</>}
        intro={<>
          A model can rank perfectly and still lie about probabilities — saying &ldquo;0.95&rdquo; for
          cases that are right only 70% of the time. AUC would never notice. But the moment you multiply a
          probability by a dollar amount, or threshold it by cost, the honesty of that number is everything.
        </>}
      />

      <div className="lesson">
        <p>
          There are two very different questions you can ask of a classifier&rsquo;s scores:
        </p>
        <ul>
          <li><strong>Ranking</strong> — does it put positives above negatives? (AUC answers this.)</li>
          <li><strong>Calibration</strong> — when it says 0.8, is the event actually true about 80% of the time?</li>
        </ul>
        <p>
          These come apart completely. A model that outputs exactly your true probability, then squares it,
          ranks <em>identically</em> (squaring preserves order) but is now badly miscalibrated. AUC is blind
          to the difference. So whether you need calibration depends entirely on what you do with the score.
        </p>

        <h2>When the number itself matters</h2>
        <p>
          If you only ever <em>threshold</em> the score — &ldquo;flag the top 5%&rdquo; — ranking is all you
          need and calibration is optional. But you need honest probabilities the instant a decision uses the
          <em> value</em> of the number:
        </p>
        <ul>
          <li><strong>Expected value</strong> — &ldquo;bid <M>{String.raw`p \times \$100`}</M> on this click.&rdquo; If <M>p</M> is inflated, you overbid on every impression.</li>
          <li><strong>Cost-based thresholds</strong> — the next page&rsquo;s <M>{String.raw`t^\*`}</M> formula assumes the probability means what it says.</li>
          <li><strong>Risk communication</strong> — &ldquo;a 30% chance of recurrence&rdquo; told to a patient must be a real 30%.</li>
          <li><strong>Combining models</strong> — averaging or stacking scores only makes sense if they&rsquo;re on the same honest scale.</li>
        </ul>

        <h2>Reading a reliability diagram</h2>
        <p>
          Calibration is checked by a <strong>reliability diagram</strong>: bin the predictions (all the
          &ldquo;around 0.8&rdquo; ones together), and for each bin plot predicted probability against the
          <em> observed</em> frequency of positives. Perfect calibration is the diagonal — predicted equals
          observed. Bins that sag below the line are overconfident; bins above it are underconfident.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>The lab compares logistic regression against naive Bayes on the same data. One sits on the diagonal; the other slams its predictions to 0 and 1. Which is which?</>}
          options={[
            "Logistic is calibrated (on the diagonal); naive Bayes is overconfident",
            "Naive Bayes is calibrated; logistic is overconfident",
            "Both sit on the diagonal",
          ]}
          nudge={<>Toggle between the two models and compare their Brier scores and how far the curve strays from the diagonal.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Toggle to <code>Naive Bayes</code> and look at where the curve lands when it predicts near 1.0. Then toggle back to <code>Logistic regression</code> and compare the Brier scores.</>}
          insight={<>Naive Bayes assumes features are independent; when they&rsquo;re correlated it counts the same evidence
            repeatedly and becomes wildly overconfident — saying 1.0 when the truth is ~0.85 (Brier 0.130). Logistic
            regression minimises log loss, a <em>proper scoring rule</em>, so it&rsquo;s calibrated almost by construction
            (Brier 0.092). Both might rank identically; only one gives numbers you can multiply by money.</>}
        >
          <CalibrationLab />
        </LabFrame>

        <h2>One number for it: the Brier score</h2>
        <p>
          The <strong>Brier score</strong> is just the mean squared error of the probabilities against the
          0/1 outcomes:
        </p>
        <p style={{ textAlign: "center" }}>
          <M>{String.raw`\text{Brier} = \frac{1}{n}\sum_{i=1}^{n}\left(p_i - y_i\right)^2`}</M>
        </p>
        <p>
          Lower is better. Like log loss, it&rsquo;s a <strong>proper scoring rule</strong>: it is minimised
          only by reporting your true beliefs, so you can&rsquo;t game it by shading predictions toward 0 or 1.
          It rolls calibration and ranking into one honest summary — a natural companion to AUC rather than a
          replacement.
        </p>

        <h2>Fixing a miscalibrated model</h2>
        <p>
          If a model ranks well but is miscalibrated (common for SVMs, naive Bayes, and boosted trees), you
          don&rsquo;t retrain — you <strong>post-process</strong> the scores on a held-out set. Two standard
          recipes: <strong>Platt scaling</strong> (fit a small logistic regression mapping scores → probabilities)
          and <strong>isotonic regression</strong> (a non-parametric monotonic fit; more flexible, needs more
          data). Both preserve ranking, so AUC is unchanged while the probabilities become honest.
        </p>

        <Callout color={ACCENT} title={<>The one distinction to keep</>}>
          <strong>Ranking ≠ calibration.</strong> AUC only cares about order; calibration cares about the value.
          If your decision merely sorts or thresholds, ranking is enough. If it multiplies, budgets, or communicates
          the probability, you need calibration — check it with a reliability diagram, summarise it with Brier, and
          fix it with Platt or isotonic scaling.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "A model has AUC 0.95 but, among cases it scores 0.9, only 60% are actually positive. This model is…",
              options: [
                "Well calibrated but poorly ranked",
                "Well ranked but poorly calibrated — its probabilities are overconfident",
                "Broken; this can't happen",
              ],
              answer: 1,
              explain: "High AUC means good ranking. But 0.9-scored cases being 60% positive means the probability is inflated — poor calibration. Ranking and calibration are independent; AUC can't see the second.",
            },
            {
              q: "For which use is calibration essential (not just ranking)?",
              options: [
                "Showing the top 10 riskiest accounts to a reviewer",
                "Computing expected value = probability × payoff to decide a bid",
                "Sorting emails by spam score",
              ],
              answer: 1,
              explain: "Sorting and top-k selection only need ranking. Multiplying the probability by a payoff requires the number to be truthful — an inflated 0.8 that's really 0.6 makes you overbid every time.",
            },
            {
              q: "You have a boosted-tree model that ranks well but is overconfident. The right fix is…",
              options: [
                "Retrain from scratch with more data",
                "Post-process the scores with Platt scaling or isotonic regression on a held-out set",
                "Lower every prediction by 0.1",
              ],
              answer: 1,
              explain: "Calibration is fixed after training by mapping raw scores to honest probabilities on held-out data. Both Platt and isotonic preserve the ranking, so AUC is unchanged while the probabilities become trustworthy.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/evaluation/roc-auc-and-pr-curves", label: <>← ROC, AUC &amp; PR curves</> }}
          next={{ href: "/learn/evaluation/cost-sensitive-thresholds", label: <>Next up · Cost-sensitive thresholds →</> }}
        />
      </div>
    </article>
  );
}
