import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LearningCurve } from "@/components/figures/LearningCurve";
import { ES_CURVE } from "@/components/figures/nnReg/curves";

export const metadata = {
  title: "Patience and the validation curve — Manifold",
  description:
    "Validation curves are noisy, so you do not stop at the first uptick. Patience, min-delta, and checkpointing the best weights — the mechanics that turn early stopping from a good idea into a reliable one.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function PatiencePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Early stopping and data augmentation", color: CORAL }, { label: "Tier 2 · practitioner", color: CORAL }]}
        time="about 7 minutes"
        title={<>Patience and the validation curve</>}
        intro={<>The idea of early stopping is simple; the mechanics are where it goes right or wrong. A
          real validation curve is <em>noisy</em> — it wobbles up and down from epoch to epoch even while
          the trend is still improving. Stop at the first uptick and you will quit far too early on a false
          alarm. The fix is three small pieces of bookkeeping: <strong>patience</strong>,{" "}
          <strong>min-delta</strong>, and <strong>checkpointing the best weights</strong>.</>}
      />

      <div className="lesson">
        <h2>Why you cannot stop at the first increase</h2>
        <p>
          Recall the regression curve from the previous page: validation MSE checked every few epochs, its
          minimum landing around <strong>epoch 34</strong> before the long climb to a test MSE of 0.0760
          by epoch 4000. That summary hides something important. The validation error does not descend in a
          smooth line and then reverse cleanly. It jitters. On any given check it may tick <em>up</em>
          {" "}relative to the previous check purely because of the stochasticity of training — the batch
          ordering, the optimiser&rsquo;s momentum, the small validation set of just 24 points.
        </p>
        <p>
          A naive rule — &ldquo;stop the moment validation error increases&rdquo; — fires on the first of
          those wobbles. On this curve it could easily trigger at epoch 8 or 12, long before the true
          minimum at 34, leaving accuracy on the table. The uptick that stops you must be a <em>real</em>
          {" "}reversal, not a single noisy sample. Distinguishing the two is exactly what patience buys.
        </p>

        <LearningCurve
          x={ES_CURVE.epochs.slice(0, 41)}
          series={[
            { label: "validation MSE", values: ES_CURVE.val.slice(0, 41), color: "var(--c-neural)" },
          ]}
          markAt={ES_CURVE.bestEpochOfMeanCurve}
          markLabel={`true minimum · epoch ${ES_CURVE.bestEpochOfMeanCurve}`}
          linearUpTo={200}
          ylabel="validation MSE"
          caption={<>The first two hundred epochs of the same run, on a linear axis so the texture is
            visible. The curve does not descend smoothly and then turn; it jitters the whole way down.
            A rule that stops at the first epoch worse than the last would fire at epoch 35 — before
            the real minimum at 45 — purely on that jitter, and this is the <em>averaged</em> curve
            over five seeds, so a single run is noisier still. Patience is not a safety margin bolted
            on for comfort; without it the stopping rule is mostly measuring noise.</>}
        />

        <h2>Patience: wait before you quit</h2>
        <p>
          <strong>Patience</strong> is the number of consecutive checks with no improvement you are willing
          to tolerate before stopping. With patience <M>{String.raw`P = 10`}</M>, training continues until
          the validation error has failed to beat its best-so-far value for ten checks in a row. A single
          noisy uptick resets nothing — as long as a new best arrives within the next ten checks, the
          counter clears and training goes on. Only a <em>sustained</em> failure to improve, the signature
          of genuine overfitting, exhausts the patience budget and halts training.
        </p>
        <p>
          The pseudocode is short, and worth reading slowly:
        </p>

        <MathBlock>{String.raw`\begin{aligned}
&\textbf{best} \leftarrow \infty,\quad \textbf{wait} \leftarrow 0,\quad \textbf{best\_weights} \leftarrow \theta \\
&\textbf{each check: } v \leftarrow \text{val\_error}(\theta) \\
&\quad \textbf{if } v < \textbf{best} - \delta: \quad \textbf{best} \leftarrow v,\ \textbf{wait} \leftarrow 0,\ \textbf{best\_weights} \leftarrow \theta \\
&\quad \textbf{else}: \quad \textbf{wait} \leftarrow \textbf{wait} + 1 \\
&\quad \textbf{if } \textbf{wait} \ge P: \ \textbf{stop and restore best\_weights}
\end{aligned}`}</MathBlock>

        <h2>Min-delta: what counts as improvement</h2>
        <p>
          The <M>{String.raw`\delta`}</M> in that condition is <strong>min-delta</strong>: the smallest
          decrease that counts as a real improvement. Without it, an improvement of{" "}
          <M>{String.raw`10^{-7}`}</M> — pure numerical noise — would reset your patience counter and keep
          a plateaued model training indefinitely. Setting <M>{String.raw`\delta`}</M> to a small positive
          value (say 0.001 in the units of your metric) says &ldquo;only count it as progress if it beats
          the record by at least this much.&rdquo; Patience and min-delta work together: patience sets how
          long you wait, min-delta sets how large a step has to be to reset that wait.
        </p>

        <Callout color={CORAL} title={<>The trade-off patience controls</>}>
          More patience means more compute — you keep training through longer dry spells — but a lower
          chance of a <em>false stop</em> on noise. Less patience saves compute but risks quitting on a
          wobble before the real minimum. On the noisy regression curve, a patience of 1 (stop on the first
          uptick) would fire far before epoch 34; a generous patience rides through the wobbles and lands
          near the true minimum. Tune it to how noisy your validation curve actually looks, not to a
          folklore default.
        </Callout>

        <h2>Checkpoint the best weights, not the last</h2>
        <p>
          Here is the piece beginners most often get wrong. When patience runs out at, say, epoch 44, the
          weights <em>currently in the model</em> are the epoch-44 weights — ten checks <em>past</em> the
          minimum, already slightly overfit. Those are not the weights you want. You want the weights from
          epoch 34, when the validation error was actually lowest. That is why the loop above keeps a
          separate <strong>best_weights</strong> snapshot, updated only when a new best is found, and{" "}
          <em>restores it</em> when training stops.
        </p>
        <p>
          Without that restore step, patience actively hurts you: the larger the patience, the further past
          the minimum the final weights sit. Checkpointing decouples the two roles — patience decides{" "}
          <em>when to stop looking</em>, the checkpoint decides <em>which weights to keep</em> — and those
          are not the same epoch.
        </p>

        <Proof color={CORAL} title="why restoring the checkpoint is what actually matters">
          <p>
            Let <M>{String.raw`v(t)`}</M> be the validation error at epoch <M>{String.raw`t`}</M>, with a
            true minimum at <M>{String.raw`t^\star`}</M>. A patience-<M>{String.raw`P`}</M> rule stops at
            some epoch <M>{String.raw`t_{\text{stop}} \ge t^\star + P`}</M> (it takes at least{" "}
            <M>{String.raw`P`}</M> further checks of no improvement to trigger). The generalisation you
            actually obtain is the error of the weights you <em>keep</em>, not the error at the epoch you
            happened to stop.
          </p>
          <p>
            If you keep the final weights, you obtain <M>{String.raw`v(t_{\text{stop}})`}</M>. Since{" "}
            <M>{String.raw`t_{\text{stop}}`}</M> lies on the rising side of the curve, past the minimum,
            this is <em>strictly worse</em> than the minimum, and it gets worse as{" "}
            <M>{String.raw`P`}</M> grows:
          </p>
          <MathBlock>{String.raw`v(t_{\text{stop}}) \ge v(t^\star), \qquad \text{with the gap widening in } P.`}</MathBlock>
          <p>
            If instead you restore the checkpoint, you obtain <M>{String.raw`v(t^\star)`}</M> regardless of
            how long patience made you wait — the extra epochs after the minimum cost you compute but not
            quality. So the checkpoint <em>removes</em> the downside of a generous patience: you get the
            noise-robustness of waiting without paying for it in the weights you ship. Patience without a
            restore is a rule that punishes its own caution; patience with a restore is free insurance
            against a false stop.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why is &ldquo;stop the moment validation error increases&rdquo; a bad rule on the
                regression curve whose true minimum is around epoch 34?</>,
              options: [
                "It stops too late, well past epoch 34",
                "The validation curve is noisy, so it wobbles up and down even while improving; the first uptick is usually a false alarm that fires long before the real minimum",
                "Validation error never increases, so the rule never triggers",
              ],
              answer: 1,
              explain: <>A real validation curve jitters from check to check because of training
                stochasticity and a small validation set. A single uptick is usually noise, so the naive
                rule quits far too early. Patience waits for a sustained failure to improve before
                stopping.</>,
            },
            {
              q: <>What do patience and min-delta each control?</>,
              options: [
                "Patience sets the learning rate; min-delta sets the batch size",
                "Patience is how many checks of no improvement you tolerate before stopping; min-delta is how large a decrease must be to count as a real improvement",
                "They are two names for the same hyperparameter",
              ],
              answer: 1,
              explain: <>Patience sets <em>how long</em> you wait through a dry spell; min-delta sets{" "}
                <em>how much</em> better a new value must be to reset that wait. Together they stop tiny
                numerical fluctuations from either halting training or keeping a plateaued model alive
                forever.</>,
            },
            {
              q: <>When patience runs out at epoch 44 but the validation minimum was at epoch 34, which
                weights should you keep, and why?</>,
              options: [
                "The epoch-44 weights, because they are the most recent",
                "The epoch-34 checkpoint, because those generalise best; the epoch-44 weights sit past the minimum on the rising side and are already slightly overfit",
                "The average of all weights between epoch 34 and 44",
              ],
              answer: 1,
              explain: <>Patience decides when to stop looking; the checkpoint decides which weights to
                keep — and they are different epochs. Restoring the best checkpoint gives you{" "}
                <M>{String.raw`v(t^\star)`}</M> no matter how long patience made you wait, removing the
                downside of a generous patience.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/nn-regularisation/early-stopping", label: <>← Early stopping</> }}
          next={{ href: "/learn/nn-regularisation/data-augmentation", label: <>Next up · Data augmentation →</> }}
        />
      </div>
    </article>
  );
}
