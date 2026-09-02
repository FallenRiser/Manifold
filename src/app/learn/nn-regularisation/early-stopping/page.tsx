import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Early stopping — Manifold",
  description:
    "Track a held-out error each epoch and keep the weights at its minimum. On regression the test error bottoms at epoch 34 (MSE 0.0118) then climbs to 0.0760 — training longer destroys generalisation. Plus the honest classifier caveat: stop on the metric you care about.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function EarlyStoppingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Early stopping and data augmentation", color: CORAL }, { label: "Tier 2 · practitioner", color: CORAL }]}
        time="about 8 minutes"
        title={<>Early stopping</>}
        intro={<>The cheapest regulariser in the toolkit does not touch the loss, the weights, or the
          architecture. It just decides <em>when to quit</em>. Track a held-out error each epoch, keep the
          weights from its lowest point, and stop once it stops improving. On the right problem, training
          longer does not merely waste compute — it actively destroys generalisation, and stopping early
          is the only thing standing between you and a worse model.</>}
      />

      <div className="lesson">
        <h2>The idea</h2>
        <p>
          A network trained long enough will keep reducing its <em>training</em> loss well past the point
          where it has learned everything useful. What it does with those extra epochs is memorise the
          noise: the label errors, the sampling quirks, the accidents of your particular training set. The
          training curve keeps sliding down, but the held-out curve has already turned around and started
          to climb.
        </p>
        <p>
          Early stopping exploits exactly that. Carve a small <strong>validation set</strong> out of your
          training data, evaluate it every epoch, and remember the weights at the epoch where the
          validation error was lowest. When the validation error stops improving, stop training and hand
          back those best-so-far weights. You never need to know the right number of epochs in advance —
          the validation curve tells you, mid-flight.
        </p>

        <h2>The clean demo: regression that overfits over time</h2>
        <p>
          The sharpest picture comes from a regression setup, because there the test error genuinely
          bottoms out and then climbs. A wide network fits 80 noisy points of a smooth one-dimensional
          target (56 train, 24 validation), trained with Adam for 4000 epochs while we track validation
          MSE. Everything below is a five-seed average from{" "}
          <code>scripts/regularisation_cases.py</code>.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 380 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>weights used</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>epoch</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>test MSE</th>
              </tr>
            </thead>
            <tbody>
              {([
                { w: "best validation", e: "34", mse: "0.0118", best: true },
                { w: "trained to the end", e: "4000", mse: "0.0760", best: false },
              ] as const).map((r) => (
                <tr key={r.e}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>{r.w}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.e}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: r.best ? "var(--good)" : "var(--muted)", fontWeight: r.best ? 600 : 400, borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.mse}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Test MSE against the clean target. From <code>scripts/regularisation_cases.py</code>.
        </p>

        <p>
          The validation error bottoms out at <strong>epoch 34 of 4000</strong>. The weights at that
          moment generalise best: test MSE <strong>0.0118</strong>. Let the same run continue to epoch
          4000 and the test MSE has climbed to <strong>0.0760</strong> — over six times worse. Early
          stopping saves <strong>0.064 MSE</strong> here, and the remarkable thing is what it is saving you
          <em>from</em>: 99% of the training you paid for made the model worse, not better. This is the
          textbook picture — test error bottoms early, then climbs as the network spends its remaining
          epochs memorising the noise.
        </p>

        <Callout color={CORAL} title={<>Training longer is not free, and often not neutral</>}>
          There is a common instinct that more training epochs are at worst a waste of time. On an
          overfitting problem they are worse than that: they are a way to <em>degrade</em> a model you had
          already trained well. The best model on this run existed for a moment around epoch 34 and was
          then trained away. Early stopping is the mechanism that catches and keeps it.
        </Callout>

        <h2>The honest nuance: stop on the metric you care about</h2>
        <p>
          Now the caveat that separates a rule of thumb from real understanding. Take it to the running
          classifier of this track — the 3&times;256 MLP, trained with SGD, on 250 points with 10% label
          noise — and track it the same way. Validation <em>loss</em> bottoms almost immediately, around{" "}
          <strong>epoch 3</strong>, because the network quickly becomes overconfident on the noisy labels
          and its cross-entropy on the validation set starts rising. But test <em>accuracy</em> keeps
          drifting <em>up</em> for a long while after that.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 420 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>stopping rule</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>epoch</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>test accuracy</th>
              </tr>
            </thead>
            <tbody>
              {([
                { r: "stop at min validation loss", e: "~3", acc: "0.741", good: false },
                { r: "train to the end", e: "600", acc: "0.754", good: true },
              ] as const).map((row) => (
                <tr key={row.r}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>{row.r}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{row.e}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: row.good ? "var(--good)" : "var(--muted)", fontWeight: row.good ? 600 : 400, borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{row.acc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Same classifier as the rest of the track, SGD, three-seed average. From{" "}
          <code>scripts/regularisation_cases.py</code>.
        </p>

        <p>
          Stopping blindly on validation loss lands you at epoch 3 and <strong>0.741</strong> test
          accuracy. Training to the end gives <strong>0.754</strong>. Here early stopping on the
          <em> loss</em> would have <em>cost</em> you accuracy — the opposite of the regression story. The
          resolution is not that early stopping fails; it is that you stopped on the wrong signal. When the
          quantity you care about is accuracy, watch validation <em>accuracy</em>, not validation loss.
          Loss and accuracy can diverge whenever the model becomes miscalibrated, and on noisy labels they
          reliably do.
        </p>

        <Callout color={CORAL} title={<>The rule, stated carefully</>}>
          Early-stop on the metric you will ultimately be judged by. If you deploy on accuracy, monitor
          validation accuracy. If you deploy on a probabilistic score, monitor validation loss. When the
          two disagree — as they do the moment label noise makes the network overconfident — trusting the
          wrong one gives you a strictly worse model.
        </Callout>

        <h2>Early stopping as implicit regularisation</h2>
        <p>
          Why should &ldquo;stop sooner&rdquo; behave like a regulariser at all? Because the number of
          optimisation steps is itself a capacity control. Gradient descent from a small initialisation
          reaches large-norm, high-curvature solutions only <em>gradually</em> — the weights grow as
          training proceeds. Stopping early keeps the network in the low-norm, low-complexity part of
          weight space it has explored so far. Fewer effective steps means a smaller effective capacity,
          in almost exactly the sense that a weight-norm bound does. You are not changing what the network
          <em> could</em> represent; you are limiting how far into the high-complexity region the optimiser
          is allowed to travel.
        </p>

        <Proof color={CORAL} title="why early stopping ≈ ridge regression">
          <p>
            Take the cleanest case: a linear model with squared loss, trained by gradient descent from{" "}
            <M>{String.raw`\mathbf{w}_0 = \mathbf{0}`}</M>. Diagonalise the input covariance so the loss
            decouples into independent coordinates, each with curvature (eigenvalue){" "}
            <M>{String.raw`\lambda_i`}</M>. Gradient descent with step size <M>{String.raw`\eta`}</M> on
            coordinate <M>{String.raw`i`}</M> evolves toward its least-squares optimum{" "}
            <M>{String.raw`w_i^\star`}</M> geometrically:
          </p>
          <MathBlock>{String.raw`w_i^{(t)} = \bigl(1 - (1-\eta\lambda_i)^{t}\bigr)\, w_i^\star.`}</MathBlock>
          <p>
            After <M>{String.raw`t`}</M> steps, coordinate <M>{String.raw`i`}</M> has reached a fraction{" "}
            <M>{String.raw`1 - (1-\eta\lambda_i)^{t}`}</M> of its final value. Compare this with the ridge
            (L2-penalised) solution, which shrinks each coordinate by the factor{" "}
            <M>{String.raw`\lambda_i/(\lambda_i + \alpha)`}</M> for penalty strength{" "}
            <M>{String.raw`\alpha`}</M>:
          </p>
          <MathBlock>{String.raw`w_i^{\text{ridge}} = \frac{\lambda_i}{\lambda_i + \alpha}\, w_i^\star.`}</MathBlock>
          <p>
            The two shrinkage profiles have the same shape. High-curvature directions (large{" "}
            <M>{String.raw`\lambda_i`}</M>) converge fast under gradient descent and are barely shrunk by
            ridge; low-curvature directions converge slowly and are heavily shrunk. Matching the factors
            gives the correspondence <M>{String.raw`\alpha \approx 1/(\eta t)`}</M>: <strong>few steps
            (small <M>{String.raw`t`}</M>) behave like a large penalty <M>{String.raw`\alpha`}</M></strong>,
            and training to convergence (<M>{String.raw`t\to\infty`}</M>) sends the penalty to zero. Early
            stopping is a ridge penalty you dial with the epoch counter instead of a hyperparameter.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>On the regression run, the best-validation weights (epoch 34) give test MSE 0.0118,
                while training to epoch 4000 gives 0.0760. What does this show?</>,
              options: [
                "The network needed all 4000 epochs to converge",
                "Past the validation minimum, further training memorises noise and actively worsens generalisation — early stopping keeps the better, earlier model",
                "The validation set was too small to be trusted",
              ],
              answer: 1,
              explain: <>Test error bottomed at epoch 34 and then climbed by more than six-fold. The extra
                training did not help the model converge — it spent those epochs fitting the noise. Early
                stopping catches and restores the weights from the moment the held-out error was lowest.</>,
            },
            {
              q: <>On the classifier, stopping at minimum validation loss (~epoch 3) gives test accuracy
                0.741, but training to the end gives 0.754. What went wrong?</>,
              options: [
                "Early stopping never works for classification",
                "Validation loss and test accuracy diverged — the net got overconfident on label noise so its loss rose while accuracy kept improving; the fix is to stop on the metric you care about",
                "The learning rate was too high",
              ],
              answer: 1,
              explain: <>Cross-entropy loss punishes overconfidence, so it bottomed almost immediately once
                the network started over-committing to the noisy labels, even as test accuracy kept rising.
                Early stopping did not fail — it was watching the wrong signal. Monitor validation accuracy
                when accuracy is what you deploy on.</>,
            },
            {
              q: <>In what sense is early stopping a form of regularisation?</>,
              options: [
                "It adds an explicit penalty term to the loss function",
                "The number of gradient steps controls effective capacity — fewer steps keep the weights small and low-complexity, which for a linear model matches a ridge penalty of roughly 1/(ηt)",
                "It reduces the number of parameters in the network",
              ],
              answer: 1,
              explain: <>Gradient descent from a small start reaches high-norm, high-complexity solutions
                only gradually. Stopping early keeps the model in the low-norm region it has explored so
                far. For a linear model the shrinkage profile matches ridge regression with penalty{" "}
                <M>{String.raw`\alpha \approx 1/(\eta t)`}</M>.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/nn-regularisation/ensemble-interpretation", label: <>← The ensemble interpretation</> }}
          next={{ href: "/learn/nn-regularisation/patience", label: <>Next up · Patience and the validation curve →</> }}
        />
      </div>
    </article>
  );
}
