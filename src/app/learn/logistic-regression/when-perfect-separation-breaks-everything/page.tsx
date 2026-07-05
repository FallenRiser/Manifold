import { M } from "@/components/Math";
import { SeparationLab } from "@/components/labs/SeparationLab";
import { PredictPrompt } from "@/components/PredictPrompt";
import { LabFrame } from "@/components/LabFrame";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

const ACCENT = "var(--c-classification)";

export const metadata = {
  title: "When perfect separation breaks everything — Manifold",
  description: "If a feature separates the classes perfectly, unpenalized logistic regression's coefficients run to infinity. The bug that looks like a great fit.",
};

export default function PerfectSeparationPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: ACCENT }, { label: "Failure mode", color: "var(--bad)" }]}
        time="about 8 minutes"
        title={<>When perfect separation breaks everything</>}
        intro={<>
          Logistic regression has one spectacular failure mode, and it disguises itself as success:
          a model so confident it&rsquo;s useless, produced by data that looked <em>too</em> good.
        </>}
      />

      <div className="lesson">
        <p>
          Everything so far assumed the classes overlap — that no feature cleanly splits them. Now
          suppose one does: every borrower with utilization above some line defaulted, every one
          below repaid, no exceptions. This is <strong>perfect separation</strong>, and it turns
          logistic regression&rsquo;s training from a gentle descent into a runaway.
        </p>

        <h2>Why the weights run to infinity</h2>
        <p>
          Recall that log loss rewards confidence when you&rsquo;re right. If a single feature
          separates the classes perfectly, the model can <em>always</em> lower its loss by scaling
          that feature&rsquo;s weight up: bigger weight → steeper sigmoid → probabilities pushed
          closer to a perfect 0 and 1 → lower loss. There is no point where pushing further stops
          helping. The optimal weight is <M>{String.raw`+\infty`}</M>; the loss has no minimum, only
          an infimum it never reaches. Your solver doesn&rsquo;t error — it just quietly stops when it
          runs out of iterations, handing you an enormous, arbitrary weight.
        </p>

        <PredictPrompt
          accent={ACCENT}
          prompt={<>In the lab, you slide the two classes fully apart (a clean gap) with regularization off. What does the fitted weight do?</>}
          options={["Settles at a sensible finite value", "Balloons toward infinity — probabilities snap to 0 and 1", "Drops to zero"]}
          nudge={<>Locked in. Drag the class gap all the way positive with L2 unchecked, and watch the weight readout.</>}
        />

        <LabFrame
          accent={ACCENT}
          tryThis={<>With L2 off, drag the classes from overlapping to a clean gap and watch the fitted weight. Then tick L2 on and watch it snap back to a finite value. Then drag back into overlap and untick L2 — still fine.</>}
          insight={<>The runaway only happens in one exact situation: separable data AND no penalty. Overlap alone tames it
            (there&rsquo;s a real minimum once some points contradict each other), and regularization tames it even when
            separable (the penalty punishes the ballooning weight). The tell isn&rsquo;t an error message — it&rsquo;s a
            gigantic coefficient and probabilities that are all 0.999s and 0.001s. Confidence with no basis.</>}
        >
          <SeparationLab />
        </LabFrame>

        <h2>How to recognize it in the wild</h2>
        <p>
          It rarely announces itself. The symptoms: a coefficient in the tens or hundreds when others
          are near 1; predicted probabilities that are almost all exactly 0 or 1; a statsmodels fit
          that warns <em>&ldquo;Possibly complete quasi-separation&rdquo;</em> or refuses to converge;
          suspiciously perfect training accuracy. Often the culprit is a leaked feature — an ID that
          encodes the label, a post-outcome field, a category that only ever appears with one class.
          Perfect separation is frequently your data telling you a feature is cheating.
        </p>

        <h2>The fixes</h2>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.8, color: "var(--muted)", fontSize: 15 }}>
          <li>
            <strong style={{ color: "var(--ink)" }}>Regularize</strong> — any L2 or L1 penalty gives
            the objective a finite minimum again, because the penalty grows without bound as the
            weight does. This is <em>the</em> reason scikit-learn penalizes by default: it makes the
            solver robust to separation out of the box, so most people never even meet this failure.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Investigate the separating feature</strong> — if
            one feature separates the classes perfectly, ask whether it&rsquo;s leakage before
            celebrating. A legitimately perfect predictor is rare; a leaked label is common.
          </li>
          <li>
            <strong style={{ color: "var(--ink)" }}>Use a Bayesian / penalized-likelihood fit</strong>{" "}
            (e.g. Firth&rsquo;s correction) when you specifically need inference on separated data —
            it keeps the estimates finite and the standard errors meaningful.
          </li>
        </ul>

        <Callout color={ACCENT} title={<>The reframing</>}>
          Perfect separation isn&rsquo;t a bug in logistic regression — it&rsquo;s the model being
          honest that maximum likelihood has no answer here. An infinite weight really is the
          likelihood-maximizing choice for separable data; regularization works precisely because it
          changes the question from &ldquo;which weights fit best?&rdquo; (answer: infinite) to
          &ldquo;which reasonable weights fit best?&rdquo; (answer: finite). It&rsquo;s the same reason
          shrinkage rescued linear regression — you saw it there first.
        </Callout>

        <Quiz
          accent={ACCENT}
          questions={[
            {
              q: "You fit unpenalized logistic regression and one coefficient comes back as 340 while others are near 1. The most likely cause is…",
              options: ["A great, highly predictive feature", "Perfect (or near-perfect) separation — often a leaked feature", "A bug in the solver"],
              answer: 1,
              explain: "A runaway coefficient is the signature of separation. Before trusting it, check whether that feature perfectly splits the classes — and whether it's leakage (an ID or post-outcome field encoding the label).",
            },
            {
              q: "Why does adding any L2 penalty fix the infinite-weight problem?",
              options: ["It removes the separating feature", "The penalty grows as the weight grows, so the objective now has a finite minimum", "It converts the problem to linear regression"],
              answer: 1,
              explain: "Unpenalized, loss keeps dropping as the weight grows — no minimum. The penalty term climbs with the weight, so their sum bottoms out at a finite weight. That's why sklearn's default penalty makes separation a non-event.",
            },
            {
              q: "On perfectly separable data, the maximum-likelihood weight is…",
              options: ["Zero", "Infinite — there's no finite maximizer, only an infimum of the loss", "Exactly 1"],
              answer: 1,
              explain: "Bigger weight always lowers log loss on separable data, forever. MLE genuinely has no finite answer — the model isn't malfunctioning, it's reporting that. Regularization changes the question to one with a finite answer.",
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/logistic-regression/feature-engineering-for-linear-boundaries", label: <>← Feature engineering for linear boundaries</> }}
        />
      </div>
    </article>
  );
}
