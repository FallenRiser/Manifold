import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "The L2 penalty on weights — Manifold",
  description:
    "Add lambda times the sum of squared weights to the loss, and every gradient step pulls the weights toward zero. Smaller weights mean a smoother function with less room to fit noise — shown here as a clean bias-variance tradeoff on a noisy regression.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function L2PenaltyPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Weight decay", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 8 minutes"
        title={<>The L2 penalty on weights</>}
        intro={<>The first regulariser every textbook reaches for is the simplest one to write down:
          add a term to the loss that grows with the size of the weights. The optimiser, now trying to
          keep the weights small <em>and</em> fit the data, settles on a smoother function. Here is
          exactly what that penalty does to each gradient step, and a regression where you can watch it
          trade training error for test error — the textbook bias&ndash;variance curve, measured.</>}
      />

      <div className="lesson">
        <h2>The penalised objective</h2>
        <p>
          Take whatever loss you were already minimising — mean squared error, cross-entropy — and add
          a term proportional to the sum of the squared weights:
        </p>

        <MathBlock>{String.raw`\mathcal{L}_{\text{reg}}(\mathbf{w}) = \mathcal{L}_{\text{data}}(\mathbf{w}) + \lambda \sum_j w_j^2`}</MathBlock>

        <p>
          The coefficient <M>{String.raw`\lambda \ge 0`}</M> is the one knob. At{" "}
          <M>{String.raw`\lambda = 0`}</M> you are back to the unregularised loss. As{" "}
          <M>{String.raw`\lambda`}</M> grows, the penalty term matters more and the optimiser is
          increasingly willing to accept a worse fit in exchange for smaller weights. The sum runs over
          the weight matrices; biases are conventionally left out, because shrinking a bias toward zero
          just moves the function&rsquo;s baseline, which is rarely what causes overfitting.
        </p>

        <h2>What it does to a gradient step</h2>
        <p>
          The reason this term is so cheap to use is that its gradient is trivial. Differentiating the
          penalty <M>{String.raw`\lambda \sum_j w_j^2`}</M> with respect to a single weight{" "}
          <M>{String.raw`w_j`}</M> gives <M>{String.raw`2\lambda w_j`}</M>. So the gradient the optimiser
          actually follows is:
        </p>

        <MathBlock>{String.raw`\nabla_{\mathbf{w}} \mathcal{L}_{\text{reg}} = \nabla_{\mathbf{w}} \mathcal{L}_{\text{data}} + 2\lambda \mathbf{w}`}</MathBlock>

        <p>
          Read the second term literally: it is a force pointing straight back toward the origin, with a
          magnitude proportional to how large the weight already is. A plain gradient-descent update
          becomes
        </p>

        <MathBlock>{String.raw`\mathbf{w} \leftarrow \mathbf{w} - \eta\,\nabla_{\mathbf{w}} \mathcal{L}_{\text{data}} - 2\eta\lambda\,\mathbf{w} = (1 - 2\eta\lambda)\,\mathbf{w} - \eta\,\nabla_{\mathbf{w}} \mathcal{L}_{\text{data}}`}</MathBlock>

        <p>
          Every single step multiplies the weight by a factor <M>{String.raw`(1 - 2\eta\lambda)`}</M> just
          under one, <em>then</em> applies the usual data gradient. The weight is being nudged toward zero
          continuously, and only the pull of the data gradient keeps it from collapsing there. This
          shrink-then-update view is where the name <strong>weight decay</strong> comes from — the weights
          decay a little each step. (That the two views are exactly the same here, and exactly different
          under Adam, is the whole of the next page.)
        </p>

        <h2>Why smaller weights generalise better</h2>
        <p>
          A network&rsquo;s weights set how sharply its output can swing as the input moves. Large weights
          let a unit switch from off to fully on across a tiny change in input — the ingredient a network
          needs to carve a boundary tightly around individual noisy points. Small weights force gentler
          slopes: the function it represents cannot wiggle as fast, so it has less capacity to chase the
          accidents of one particular sample.
        </p>
        <p>
          That is the intuition in one line: <strong>smaller weights mean a smoother function, and a
          smoother function has less room to fit noise</strong>. The penalty does not know which part of
          the data is signal and which is noise. It simply makes wiggling expensive, and since fitting
          noise requires more wiggling than fitting signal, the noise is what gets sacrificed first.
        </p>

        <h2>The clean demonstration: a noisy regression</h2>
        <p>
          The sharpest place to see this is a regression, where the penalty produces the textbook
          bias&ndash;variance tradeoff with no ambiguity. Take a smooth one-dimensional target, draw 60
          noisy points from it, and fit a deliberately over-wide network with AdamW, sweeping the weight
          decay from zero upward. Every row below is measured.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 420 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>weight decay</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>train MSE</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>test MSE</th>
              </tr>
            </thead>
            <tbody>
              {([
                { wd: "0.0", tr: "0.0221", te: "0.0535" },
                { wd: "0.0001", tr: "0.0220", te: "0.0526" },
                { wd: "0.001", tr: "0.0216", te: "0.0542" },
                { wd: "0.01", tr: "0.0218", te: "0.0516" },
                { wd: "0.03", tr: "0.0224", te: "0.0511" },
                { wd: "0.1", tr: "0.0227", te: "0.0478" },
                { wd: "0.3", tr: "0.0290", te: "0.0412" },
              ] as const).map((r) => (
                <tr key={r.wd}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.wd}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: r.wd === "0.3" ? "var(--muted)" : "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.tr}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: r.te === "0.0412" ? "var(--good)" : "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.te}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Over-wide MLP, AdamW, 60 noisy points of a smooth 1-D target.
        </p>

        <p>
          Read the two columns in opposite directions. As the decay rises, <strong>train MSE goes
          up</strong> — from 0.0221 at no decay to 0.0290 at decay 0.3 — because the penalty is
          deliberately stopping the network from fitting the training points as tightly. At the same
          time, <strong>test MSE goes down</strong>, from 0.0535 to 0.0412. The model gets worse at the
          data it can see and better at the data it cannot, which is exactly the trade a regulariser is
          supposed to make. At <M>{String.raw`\lambda = 0.3`}</M> you have given up 0.0069 of training
          error to buy back 0.0123 of test error — a clear net win.
        </p>

        <Callout color={CORAL} title={<>Train up, test down is the signature of a working regulariser</>}>
          When a regulariser is doing its job, the training metric should get slightly <em>worse</em>.
          If both training and test error improve together, you were underfitting and simply trained
          better — that is not regularisation, that is capacity. The bias&ndash;variance trade is visible
          precisely because the two curves move apart: bias (train error) rises a little, variance (the
          train&ndash;test gap) falls more. The best <M>{String.raw`\lambda`}</M> is where the sum of the
          two is lowest, which here is out at 0.3 or beyond — a value the next pages return to.
        </Callout>

        <p>
          Hold onto one caveat this chapter will not let you forget: this clean win is a{" "}
          <em>regression</em>, where the weights&rsquo; magnitude genuinely controls how much the model
          overfits. That is not true of every problem. The{" "}
          <Link href="/learn/nn-regularisation/how-much-decay" style={link}>classifier this track is built
          around</Link> fits its 250 points with small weights already, and there the same penalty barely
          moves the metric. Weight decay is the right lever only when magnitude is the thing that is out
          of control.
        </p>

        <Proof color={CORAL} title="the L2 penalty is a Gaussian prior on the weights">
          <p>
            Put a zero-mean Gaussian prior on every weight,{" "}
            <M>{String.raw`w_j \sim \mathcal{N}(0, \tau^2)`}</M>, and treat training as{" "}
            <strong>maximum a posteriori</strong> estimation: find the weights that maximise the
            posterior <M>{String.raw`p(\mathbf{w} \mid \mathcal{D}) \propto p(\mathcal{D} \mid \mathbf{w})\,p(\mathbf{w})`}</M>.
            Taking logs turns the product into a sum,
          </p>
          <MathBlock>{String.raw`\log p(\mathbf{w} \mid \mathcal{D}) = \underbrace{\log p(\mathcal{D} \mid \mathbf{w})}_{-\,\mathcal{L}_{\text{data}}} \;+\; \underbrace{\sum_j \log p(w_j)}_{-\frac{1}{2\tau^2}\sum_j w_j^2} \;+\; \text{const.}`}</MathBlock>
          <p>
            Maximising the posterior is minimising its negative, which is exactly{" "}
            <M>{String.raw`\mathcal{L}_{\text{data}} + \tfrac{1}{2\tau^2}\sum_j w_j^2`}</M>. This is the
            penalised objective with <M>{String.raw`\lambda = \tfrac{1}{2\tau^2}`}</M>. A stronger penalty
            (larger <M>{String.raw`\lambda`}</M>) corresponds to a tighter prior (smaller{" "}
            <M>{String.raw`\tau`}</M>): a stronger belief, held before seeing any data, that the weights
            ought to be near zero. So L2 regularisation is not an arbitrary trick — it is the exact
            consequence of assuming, a priori, that small weights are more plausible than large ones, and
            letting the data argue you away from that belief only when it pays for the move in likelihood.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Adding <M>{String.raw`\lambda \sum_j w_j^2`}</M> to the loss changes each gradient-descent
                step how?</>,
              options: [
                "It adds a constant to every weight regardless of the weight's current value",
                "It adds a term 2λw to the gradient, so each step also multiplies the weight by a factor just under one — pulling it toward zero in proportion to its size",
                "It rescales the learning rate but leaves the update direction unchanged",
              ],
              answer: 1,
              explain: <>The penalty&rsquo;s gradient is <M>{String.raw`2\lambda w`}</M>, a force toward the
                origin proportional to the weight. The update becomes{" "}
                <M>{String.raw`(1-2\eta\lambda)w`}</M> followed by the usual data gradient, so large
                weights are shrunk more than small ones each step.</>,
            },
            {
              q: <>In the regression sweep, raising the weight decay pushed train MSE from 0.0221 up to
                0.0290 while test MSE fell from 0.0535 to 0.0412. Why is train error getting worse a good
                sign?</>,
              options: [
                "It is a bug — a regulariser should improve both numbers",
                "It is the bias-variance trade working as intended: the penalty deliberately stops the model fitting the training points so tightly, sacrificing fit to noise and improving generalisation",
                "Train error rose only because the model had not finished training",
              ],
              answer: 1,
              explain: <>A working regulariser trades a little training accuracy for test accuracy. Train
                error rising while test error falls is the signature: bias goes up slightly, variance (the
                gap) falls more, and the net test error improves.</>,
            },
            {
              q: <>Viewing L2 as MAP estimation, a larger <M>{String.raw`\lambda`}</M> corresponds to
                what belief about the weights?</>,
              options: [
                "A wider Gaussian prior — the weights could plausibly be very large",
                "A tighter zero-mean Gaussian prior — a stronger prior belief that the weights are near zero, which the data must overcome to move them",
                "A uniform prior that expresses no preference about the weights",
              ],
              answer: 1,
              explain: <>With <M>{String.raw`\lambda = 1/(2\tau^2)`}</M>, a larger{" "}
                <M>{String.raw`\lambda`}</M> means a smaller <M>{String.raw`\tau`}</M> — a narrower prior
                concentrated at zero. The penalty is exactly the log of that prior, so stronger decay is a
                stronger prior commitment to small weights.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/nn-regularisation/when-to-regularise", label: <>&#8592; When to regularise</> }}
          next={{ href: "/learn/nn-regularisation/weight-decay-vs-l2", label: <>Next up &middot; Weight decay is not L2 regularisation &#8594;</> }}
        />
      </div>
    </article>
  );
}
