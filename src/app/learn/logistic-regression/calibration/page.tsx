import { M } from "@/components/Math";
import { CalibrationLab } from "@/components/labs/CalibrationLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Term } from "@/components/Term";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-classification)";

export const metadata = {
  title: "Calibration: is 0.8 really 80%? — Manifold",
  description: "A model can rank cases perfectly and still lie about probabilities. Calibration is whether a predicted 0.8 actually happens 80% of the time — and logistic regression is unusually good at it.",
};

export default function CalibrationPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: ACCENT }, { label: "Practitioner", color: "var(--c-fundamentals)" }]}
        time="about 8 minutes"
        title={<>Calibration: is 0.8 really 80%?</>}
        intro={<>
          When a model says &ldquo;80% chance of default,&rdquo; you&rsquo;d like 80% of those
          borrowers to actually default. Astonishingly, many good models get this badly wrong — and
          the ways we usually score them never notice.
        </>}
      />

      <div className="lesson">
        <p>
          There are two separate things a classifier can be good at, and they come apart. One is{" "}
          <strong>discrimination</strong> — ranking positives above negatives, which accuracy and
          AUC measure. The other is <strong>calibration</strong> — whether the actual probability
          numbers are trustworthy. A model can ace the first and fail the second: rank every case
          correctly, yet claim 99% confidence on cases that pan out only 70% of the time. If
          anyone downstream <em>uses</em> the probability — to price a loan, triage a patient, size a
          bet — miscalibration quietly poisons every one of those decisions.
        </p>

        <h2>The reliability diagram</h2>
        <p>
          You check calibration with a{" "}
          <Term accent={ACCENT} def={<>Bin predictions by their probability (all the ~0.7 predictions together, etc.), then plot each bin's average predicted probability against the fraction that were actually positive. Perfect calibration lies on the diagonal.</>}>reliability diagram</Term>:
          bin the predictions, and for each bin plot the average predicted probability against the
          fraction that actually turned out positive. Perfect calibration lies exactly on the
          diagonal — &ldquo;when I say <M>p</M>, it happens <M>p</M> of the time.&rdquo; Below, the same
          two models on the same data; watch what happens when you switch to naive Bayes.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>Naive Bayes here has slightly <em>lower</em> accuracy but is very confident. On the reliability diagram, its curve will…</>}
          options={["Also hug the diagonal", "Bend into an S — too extreme, predictions pushed to 0 and 1", "Be a flat horizontal line"]}
          nudge={<>Locked in. Toggle to Naive Bayes in the lab and compare its curve to the diagonal.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>Toggle between the two models. Watch where each curve sits relative to the diagonal, and read the Brier score and the &ldquo;% of predictions beyond 0.05/0.95&rdquo;.</>}
          insight={<>Logistic regression sits on the diagonal; naive Bayes bows sharply away from it, slamming its
            predictions to 0 and 1. Yet both rank cases about equally well — their accuracies are within a few points.
            Calibration is the axis accuracy and AUC are blind to. Naive Bayes isn&rsquo;t wrong about <em>which</em>
            cases are riskier; it&rsquo;s wrong about <em>how</em> risky, and that&rsquo;s the number a decision uses.</>}
        >
          <CalibrationLab />
        </LabFrame>

        <h2>Why logistic regression is the calibrated one</h2>
        <p>
          It&rsquo;s not luck. Logistic regression is trained by minimizing log loss, a{" "}
          <Term accent={ACCENT} def={<>A loss minimized (in expectation) exactly when the predicted probabilities equal the true probabilities. Log loss and Brier score are both proper; optimizing them pushes toward honest probabilities, not just correct rankings.</>}>proper scoring rule</Term>{" "}
          — a loss whose minimum sits precisely at the true probabilities. So the very objective that
          fits the model is pulling its outputs toward honest frequencies. Naive Bayes, by contrast,
          optimizes no such thing; its independence assumption makes it count the ten correlated
          features here as ten independent votes, and the &ldquo;evidence&rdquo; snowballs into false
          certainty. Decision trees and SVMs have their own calibration quirks for related reasons.
        </p>

        <h2>Measuring and fixing it</h2>
        <p>
          The single-number summary is the <strong>Brier score</strong> — the mean squared error
          between predicted probability and the 0/1 outcome (lower is better; logistic 0.092 vs
          naive Bayes 0.130 here). When a model you like is miscalibrated but ranks well, you
          don&rsquo;t throw it out — you <strong>recalibrate</strong>: fit a small correction (Platt
          scaling, essentially a 1-D logistic regression on the scores, or isotonic regression) on a
          held-out set that maps the raw scores back onto honest probabilities.{" "}
          <code>sklearn.calibration.CalibratedClassifierCV</code> wraps any model to do exactly this.
        </p>

        <Callout color={ACCENT} title={<>The practitioner&rsquo;s rule</>}>
          If nobody reads the probability — you only ever threshold into a yes/no — calibration
          doesn&rsquo;t matter; rank quality is enough. The moment a human or a downstream system
          <em> uses the number</em> (expected value, risk tiers, a &ldquo;70% likely&rdquo; shown to a
          doctor), calibration becomes essential, and it&rsquo;s the first reason to prefer logistic
          regression over a better-ranking but overconfident model — or to wrap that model in
          calibration.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/logistic-regression/one-vs-rest-and-one-vs-one", label: <>← One-vs-rest &amp; one-vs-one</> }}
          next={{ href: "/learn/logistic-regression/roc-auc-and-thresholds", label: <>Next up · ROC, AUC &amp; choosing a threshold →</> }}
        />
      </div>
    </article>
  );
}
