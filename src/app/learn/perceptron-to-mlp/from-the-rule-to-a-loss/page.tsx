import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "From the rule to a loss — Manifold",
  description:
    "The perceptron rule repairs mistakes one at a time and cannot rank two models. Replacing it with a loss fixes stopping, best-so-far and graceful failure simultaneously — and buys a non-convex landscape in exchange.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function FromRuleToLossPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Making it learn", color: CORAL }, { label: "Tier 2 · mechanics", color: CORAL }]}
        time="about 8 minutes"
        title={<>From the rule to <em>a loss</em></>}
        intro={<>Chapter 1 diagnosed the perceptron rule&rsquo;s problem precisely: it has no way to say that one
          set of weights is better than another. Here is the fix, what it buys, and the one genuinely uncomfortable
          thing it costs.</>}
      />

      <div className="lesson">
        <h2>Give the model a number to hate</h2>
        <p>
          A <strong>loss function</strong> maps a set of parameters to a single number saying how badly the model is
          doing across all the training data. That is a small-sounding change with outsized consequences, because
          the moment &ldquo;better&rdquo; is defined, a great deal becomes possible that was not.
        </p>

        <MathBlock>{String.raw`\mathcal{L}(\theta) \;=\; \frac{1}{n}\sum_{i=1}^{n} \ell\big(f_\theta(\mathbf{x}_i),\, y_i\big)`}</MathBlock>

        <p>
          Compare the two regimes directly:
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 560 }}>
            <thead>
              <tr>
                {["question", "perceptron rule", "loss + gradient descent"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 22px 7px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Is model A better than B?", "no answer exists", "compare two numbers"],
                ["When do I stop?", "zero mistakes, or never", "when the loss stops improving"],
                ["Can I keep the best so far?", "no — nothing to rank by", "yes, that is just a minimum"],
                ["Non-separable data?", "oscillates forever", "settles at the best compromise"],
                ["How wrong is this point?", "cannot express it", "the loss value says"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "7px 22px 7px 0", color: j === 2 ? CORAL : j === 1 ? "var(--muted)" : "var(--ink)", borderBottom: "1px solid var(--border)", verticalAlign: "top" }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          Every row in the third column is the <em>same</em> fact restated. There is one change here, not five.
        </p>

        <h2>Now it is an optimisation problem you already know</h2>
        <p>
          With a loss defined, training a network is exactly the procedure from{" "}
          <Link href="/learn/linear-regression/descent-on-the-surface" style={link}>gradient descent</Link>: measure the
          slope of the loss with respect to every parameter, and step downhill.
        </p>

        <MathBlock>{String.raw`\theta \;\leftarrow\; \theta - \eta \, \nabla_\theta \mathcal{L}(\theta)`}</MathBlock>

        <p>
          Compare that to the perceptron update, <M>{String.raw`\mathbf{w} \leftarrow \mathbf{w} + \eta t\mathbf{x}`}</M>.
          They look similar and mean something quite different. The perceptron term is <em>the point it just got
          wrong</em>. The gradient term is <em>the direction that most reduces error across the whole dataset</em>.
          One is a reflex; the other is a measurement.
        </p>

        <CodeBlock
          language="Python"
          fromScratch={`for epoch in range(epochs):
    y_hat = forward(X, params)                 # predict on everything
    loss  = loss_fn(y_hat, y)                  # one number
    grads = gradients(loss, params)            # slope for every parameter
    for k in params:
        params[k] -= lr * grads[k]             # step downhill

    if loss < best_loss:                       # impossible without a loss
        best_loss, best_params = loss, copy(params)`}
        />

        <p>
          Those last two lines are the practical difference. <strong>Keeping the best model you have seen</strong>{" "}
          is trivial once a loss exists and is unimplementable without one — and it is the basis of early stopping,
          checkpointing, and every learning-rate schedule.
        </p>

        <Callout color={CORAL} title={<>Where the gradients come from</>}>
          <M>{String.raw`\nabla_\theta \mathcal{L}`}</M> is written above as though it were free. For a network of
          several layers it is not: getting the slope with respect to a first-layer weight means tracing its
          influence forward through every subsequent layer and back again. Doing that efficiently — in one backward
          sweep rather than one forward pass per parameter — is <strong>backpropagation</strong>, and it is the
          entire subject of the next track. Everything on this page holds regardless of how the gradient is
          obtained.
        </Callout>

        <h2>The cost: the landscape is no longer a bowl</h2>
        <p>
          This is the uncomfortable part, and it is worth being straight about because most treatments soften it.
        </p>
        <p>
          Linear and logistic regression have <strong>convex</strong> losses: one valley, no false bottoms, and
          gradient descent provably reaches the global minimum. Networks do not. The moment you have hidden layers,
          the loss surface has many local minima, saddle points, and vast flat regions — and no algorithm finds the
          global minimum of a general one.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 500 }}>
            <thead>
              <tr>
                {["", "linear / logistic regression", "neural network"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 22px 7px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["loss surface", "convex — a single bowl", "non-convex — many valleys"],
                ["where you end up", "the global minimum, always", "wherever you started rolling"],
                ["different seed, same data", "identical answer", "different answer"],
                ["guarantees", "provable convergence", "essentially none"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "7px 22px 7px 0", color: j === 0 ? "var(--muted)" : "var(--ink)", borderBottom: "1px solid var(--border)" }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          You have already seen this cost measured. Two hidden units solve XOR from{" "}
          <strong>25 of 50</strong> random starts — same architecture, same data, same algorithm, and half the runs
          land somewhere they cannot escape.
        </p>

        <Callout color={CORAL} title={<>Why the field accepted the trade anyway</>}>
          Two reasons, and only one of them is theory. In high dimensions, most critical points turn out to be{" "}
          <strong>saddle points</strong> rather than local minima — a point is only a local minimum if the curvature
          is upward in <em>every</em> one of millions of directions, and that is an extraordinarily strong
          coincidence. Saddles slow you down but do not trap you.
          <br /><br />
          The second reason is simply that it works. Convexity is a property of the <em>optimisation</em>, not of
          the <em>model</em>, and a good-enough solution to a rich model routinely beats the exact solution to a
          poor one. Logistic regression&rsquo;s guaranteed global optimum on XOR is 50% accuracy.
        </Callout>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>What single capability does adding a loss function unlock, from which the rest follow?</>,
              options: [
                "The ability to use gradient descent",
                "The ability to rank two parameter settings against each other",
                "The ability to handle non-separable data",
              ],
              answer: 1,
              explain: <>Comparability is the root. Once you can say A is better than B, stopping criteria,
                best-so-far checkpointing, early stopping and graceful degradation all become available — and
                gradient descent becomes <em>possible</em>, since a gradient is the slope of something that must
                first exist.</>,
            },
            {
              q: <>Two identical networks trained on identical data give different answers. Is something wrong?</>,
              options: [
                "Yes — training is not deterministic and should be fixed",
                "No — the loss surface is non-convex, so different starts reach different minima",
                "Yes — one of them has certainly failed to converge",
              ],
              answer: 1,
              explain: <>It is expected behaviour, and the XOR experiment quantifies it: 25 of 50 seeds succeed with
                two hidden units. It is also why serious results are reported over several seeds rather than one,
                and why a single-seed comparison between two architectures proves very little.</>,
            },
            {
              q: <>Why are local minima less catastrophic in large networks than the geometry suggests?</>,
              options: [
                "Large networks have convex losses in practice",
                "Most critical points are saddles — needing upward curvature in every one of millions of directions is a strong coincidence",
                "Modern optimisers can escape any local minimum",
              ],
              answer: 1,
              explain: <>The loss stays firmly non-convex. But being a local minimum requires positive curvature in
                <em> every</em> direction at once, which becomes vanishingly unlikely as dimension grows, so most
                stationary points are saddles — slow to cross, not permanent traps.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/perceptron-to-mlp/a-forward-pass-by-hand", label: <>← A forward pass by hand</> }}
          next={{ href: "/learn/perceptron-to-mlp/the-training-loop", label: <>Next up · The training loop →</> }}
        />
      </div>
    </article>
  );
}
