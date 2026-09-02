import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Label smoothing and mixup — Manifold",
  description:
    "Two target-space regularisers that discourage overconfidence. On this tabular problem both barely move accuracy (label smoothing 0.752 to 0.754; mixup 0.751 to 0.745) — their real benefit is calibration and robustness, not top-line accuracy. A regulariser can help calibration without helping accuracy.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function LabelSmoothingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Early stopping and data augmentation", color: CORAL }, { label: "Tier 3 · theory", color: CORAL }]}
        time="about 7 minutes"
        title={<>Label smoothing and mixup</>}
        intro={<>The regularisers so far act on the model or the inputs. These two act on the{" "}
          <strong>targets</strong>. Both attack the same failure — a network trained to be{" "}
          <em>infinitely</em> confident — and both are worth knowing precisely because they teach a subtle
          lesson: a regulariser can meaningfully improve a model without moving its accuracy at all.</>}
      />

      <div className="lesson">
        <h2>Label smoothing: never demand certainty</h2>
        <p>
          Standard classification trains against a <strong>one-hot</strong> target: probability 1 on the
          true class, 0 on every other. Cross-entropy against that target is minimised only as the
          predicted probability of the true class approaches 1 — which, since softmax never quite reaches
          1, drives the logits toward <M>{String.raw`\pm\infty`}</M>. You are literally asking the network
          to become infinitely confident on every training example, including the mislabelled ones.
        </p>
        <p>
          <strong>Label smoothing</strong> softens the target. With smoothing strength{" "}
          <M>{String.raw`\varepsilon`}</M> and <M>{String.raw`K`}</M> classes, the true class gets{" "}
          <M>{String.raw`1-\varepsilon`}</M> and the remaining mass <M>{String.raw`\varepsilon`}</M> is
          spread over the other classes:
        </p>

        <MathBlock>{String.raw`y_k^{\text{LS}} = (1-\varepsilon)\,\mathbb{1}[k = y] + \frac{\varepsilon}{K}.`}</MathBlock>

        <p>
          Now the loss is minimised at a <em>finite</em>, moderate confidence rather than at infinity. The
          network is never rewarded for being certain, so it stops driving its logits to extremes — which,
          on data with label noise, is exactly the overconfidence you want to prevent.
        </p>

        <h2>Mixup: train on blends</h2>
        <p>
          <strong>Mixup</strong> takes a different route to the same goal. Instead of softening one target,
          it builds new training examples by taking a convex combination of two points <em>and</em> their
          labels. For a pair <M>{String.raw`(\mathbf{x}_i, y_i)`}</M>,{" "}
          <M>{String.raw`(\mathbf{x}_j, y_j)`}</M> and a mixing weight{" "}
          <M>{String.raw`\lambda \sim \text{Beta}(\alpha, \alpha)`}</M>:
        </p>

        <MathBlock>{String.raw`\tilde{\mathbf{x}} = \lambda\,\mathbf{x}_i + (1-\lambda)\,\mathbf{x}_j, \qquad \tilde{y} = \lambda\,y_i + (1-\lambda)\,y_j.`}</MathBlock>

        <p>
          A point 70% of the way from a class-0 example to a class-1 example gets the soft target{" "}
          <M>{String.raw`(0.3, 0.7)`}</M>. This forces the network&rsquo;s predictions to vary{" "}
          <em>smoothly</em> between classes rather than jumping, which flattens the decision boundary and,
          like label smoothing, discourages hard-edged overconfidence. The parameter{" "}
          <M>{String.raw`\alpha`}</M> controls how aggressive the blending is: small{" "}
          <M>{String.raw`\alpha`}</M> keeps <M>{String.raw`\lambda`}</M> near 0 or 1 (mild), large{" "}
          <M>{String.raw`\alpha`}</M> pushes it toward 0.5 (heavy blending).
        </p>

        <h2>The measured result — and the honest reading</h2>
        <p>
          Here is where the lesson lands. On the running classifier, both techniques barely touch{" "}
          <em>accuracy</em>, and heavy mixup slightly <em>hurts</em> it. Three seeds averaged, from{" "}
          <code>scripts/regularisation_cases.py</code>:
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 380 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>method</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>test accuracy</th>
              </tr>
            </thead>
            <tbody>
              {([
                { m: "label smoothing 0.0", acc: "0.752", tone: "base" },
                { m: "label smoothing 0.05", acc: "0.752", tone: "flat" },
                { m: "label smoothing 0.1", acc: "0.753", tone: "flat" },
                { m: "label smoothing 0.2", acc: "0.754", tone: "up" },
                { m: "mixup α = 0.2", acc: "0.751", tone: "flat" },
                { m: "mixup α = 0.4", acc: "0.750", tone: "flat" },
                { m: "mixup α = 1.0", acc: "0.745", tone: "down" },
              ] as const).map((r) => (
                <tr key={r.m}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>{r.m}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: r.tone === "up" ? "var(--good)" : r.tone === "down" ? "var(--bad, var(--muted))" : "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.acc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          From <code>scripts/regularisation_cases.py</code>.
        </p>

        <p>
          Label smoothing moves accuracy from 0.752 to 0.754 across its whole sweep — inside the noise.
          Mixup does slightly worse as <M>{String.raw`\alpha`}</M> grows, dropping to 0.745 at{" "}
          <M>{String.raw`\alpha = 1.0`}</M>, where the blended points have wandered so far from the real
          data that they start to mislead. If you were grading these two purely on top-line accuracy on
          this tabular problem, you would conclude they do nothing — or, for heavy mixup, slight harm.
        </p>

        <Callout color={CORAL} title={<>A regulariser can help calibration without helping accuracy</>}>
          That conclusion would miss the point. The real, measurable benefit of both techniques is{" "}
          <strong>calibration and robustness</strong>, not accuracy. By refusing to train toward infinite
          confidence, they produce probabilities that are <em>softer and better-calibrated</em> — when the
          model says 80%, it is right about 80% of the time, instead of blurting out a miscalibrated 99.9%.
          On a task where you act on the probabilities — ranking, thresholding, cost-sensitive decisions,
          anything downstream of the confidence — that matters enormously even though the argmax, and hence
          the accuracy, is unchanged. Accuracy is not the only axis a model can improve on.
        </Callout>

        <p>
          This is the honest reading, and it is the whole reason these techniques sit at Tier 3. They are
          not accuracy dials on a clean tabular problem. They are calibration tools, and their value shows
          up in the quality of the predicted <em>distribution</em> — smoother boundaries, less
          overconfidence, more graceful behaviour under distribution shift — rather than in the fraction of
          argmax predictions that happen to be correct. Judge them on the axis they actually improve.
        </p>

        <Proof color={CORAL} title="label smoothing as a penalty on confidence">
          <p>
            Write the cross-entropy against the smoothed target as a sum of two pieces. With the smoothed
            label <M>{String.raw`y^{\text{LS}}`}</M> from above and predicted distribution{" "}
            <M>{String.raw`p_\theta`}</M>:
          </p>
          <MathBlock>{String.raw`\mathcal{L}_{\text{LS}} = -\sum_k y_k^{\text{LS}} \log p_\theta(k) = (1-\varepsilon)\underbrace{\bigl(-\log p_\theta(y)\bigr)}_{\text{standard CE}} \;+\; \varepsilon\underbrace{\Bigl(-\tfrac{1}{K}\textstyle\sum_k \log p_\theta(k)\Bigr)}_{\text{uniform cross-entropy}}.`}</MathBlock>
          <p>
            The second term is the cross-entropy between the <em>uniform</em> distribution and{" "}
            <M>{String.raw`p_\theta`}</M>, which up to a constant equals{" "}
            <M>{String.raw`-\varepsilon\,\overline{H}`}</M> plus a term pulling{" "}
            <M>{String.raw`p_\theta`}</M> toward uniform. Equivalently, one can write
          </p>
          <MathBlock>{String.raw`\mathcal{L}_{\text{LS}} = \mathcal{L}_{\text{CE}} + \varepsilon\, \mathrm{KL}\!\left(u \,\|\, p_\theta\right) + \text{const},`}</MathBlock>
          <p>
            where <M>{String.raw`u`}</M> is the uniform distribution. The extra term is minimised by making{" "}
            <M>{String.raw`p_\theta`}</M> <em>closer to uniform</em> — that is, by <strong>lowering the
            confidence</strong> of the prediction, or equivalently by raising the entropy of the predictive
            distribution <M>{String.raw`H(p_\theta)`}</M>. So label smoothing is exactly a penalty on
            overconfidence: it adds a force that pulls the softmax away from the corners of the simplex and
            toward the flat interior. That is why it changes calibration — it directly targets the spread of
            the distribution — while leaving the argmax, and therefore the accuracy, largely alone.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>On this problem label smoothing moves test accuracy from 0.752 to 0.754 and mixup at
                α = 1.0 drops it to 0.745. What is the honest takeaway?</>,
              options: [
                "Both techniques are useless and should never be used",
                "Their main benefit here is calibration and robustness (softer, better-calibrated probabilities), not top-line accuracy — a regulariser can help one without helping the other",
                "Accuracy is the only thing that matters, so both are failures",
              ],
              answer: 1,
              explain: <>The argmax, and hence accuracy, barely moves — but the predicted <em>distribution</em>
                {" "}becomes softer and better-calibrated. On any task that acts on the probabilities
                (ranking, thresholding, cost-sensitive decisions) that is a real improvement, even with
                accuracy flat. Heavy mixup slightly hurts because its blended points drift too far from the
                real data.</>,
            },
            {
              q: <>How does label smoothing change the training target, and what does that prevent?</>,
              options: [
                "It removes the true class entirely, forcing the network to guess",
                "It replaces the one-hot target with (1−ε) on the true class and ε spread over the rest, so the loss is minimised at finite confidence instead of driving the logits to infinity",
                "It doubles the weight on the true class to speed up learning",
              ],
              answer: 1,
              explain: <>One-hot targets are minimised only as the true-class probability approaches 1,
                pushing logits toward ±∞ — infinite confidence, including on mislabelled points. Smoothing
                sets a finite, moderate target so the network is never rewarded for certainty.</>,
            },
            {
              q: <>In what precise sense is label smoothing a penalty on confidence?</>,
              options: [
                "It penalises large weights, like L2",
                "It adds a term proportional to KL(uniform ‖ p_θ), which is minimised by pulling the predicted distribution toward uniform — i.e. lowering confidence and raising the entropy of the prediction",
                "It penalises the number of active units",
              ],
              answer: 1,
              explain: <>Decomposing the smoothed cross-entropy leaves the standard term plus{" "}
                <M>{String.raw`\varepsilon\,\mathrm{KL}(u\,\|\,p_\theta)`}</M>, a force pulling the softmax
                toward the flat interior of the simplex. It directly targets the spread of the distribution,
                which is why it changes calibration while leaving the argmax — and the accuracy — largely
                unchanged.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/nn-regularisation/data-augmentation", label: <>← Data augmentation</> }}
          next={{ href: "/learn/nn-regularisation/interactions", label: <>Next up · The interaction between techniques →</> }}
        />
      </div>
    </article>
  );
}
