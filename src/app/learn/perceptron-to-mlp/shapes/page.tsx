import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "Shapes, and how to keep them straight — Manifold",
  description:
    "Most bugs in a hand-written network are shape bugs, and the worst ones do not raise an error — broadcasting silently produces an array of the wrong rank and training quietly diverges.",
};

const CORAL = "var(--c-neural)";

export default function ShapesPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The forward pass", color: CORAL }, { label: "Tier 1 · practice", color: CORAL }]}
        time="about 7 minutes"
        title={<>Shapes, and how to keep them straight</>}
        intro={<>This is the least glamorous page in the track and the one that will save you the most hours. Nearly
          every bug in a hand-written network is a shape bug, and the dangerous ones do not crash — they broadcast
          into something plausible and give you a model that trains to nothing.</>}
      />

      <div className="lesson">
        <h2>One rule, applied everywhere</h2>
        <p>
          Write the batch dimension first and never move it. With <M>{String.raw`n`}</M> examples and{" "}
          <M>{String.raw`d`}</M> features:
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 14, minWidth: 420 }}>
            <thead>
              <tr>
                {["object", "shape", "read it as"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "6px 22px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["X", "(n, d)", "n rows, one per example"],
                ["W₁", "(d, h)", "from d inputs, to h units"],
                ["b₁", "(h,)", "one number per unit"],
                ["H₁", "(n, h)", "every example's hidden values"],
                ["W₂", "(h, k)", "from h units, to k outputs"],
                ["ŷ", "(n, k)", "k numbers per example"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "5px 22px 5px 0", color: j === 1 ? CORAL : "var(--ink)", borderBottom: "1px solid var(--border)", fontFamily: j <= 1 ? "ui-monospace, monospace" : undefined, fontSize: j <= 1 ? 13 : 14 }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          The pattern to internalise: <strong>the inner dimensions cancel and the outer ones survive.</strong>{" "}
          <M>{String.raw`(n, d) \times (d, h) \to (n, h)`}</M>. If you can state what each axis <em>means</em>, the
          shapes follow without thinking; if you cannot, no amount of transposing will rescue you.
        </p>

        <Callout color={CORAL} title={<>Which side the weights go on</>}>
          Some texts write <M>{String.raw`W\mathbf{x}`}</M> with weights of shape{" "}
          <M>{String.raw`(h, d)`}</M> and examples as columns; this track and every major framework write{" "}
          <M>{String.raw`\mathbf{x}W`}</M> with shape <M>{String.raw`(d, h)`}</M> and examples as rows. Both are
          correct and they are transposes of each other. Pick one and never mix them inside a single project — most
          &ldquo;shapes not aligned&rdquo; errors are two conventions meeting in the middle of a file.
        </Callout>

        <h2>The bug that does not raise</h2>
        <p>
          Shape errors that throw are free: the traceback tells you the line. The expensive ones are the ones
          NumPy&rsquo;s broadcasting rules quietly accept.
        </p>

        <CodeBlock
          language="Python"
          fromScratch={`y     = np.array([0, 1, 1, 0])                     # shape (4,)   <- a flat vector
y_hat = np.array([[0.1], [0.9], [0.8], [0.2]])     # shape (4, 1) <- a column

err = y_hat - y
print("err.shape:", err.shape)
print("loss as written:", np.mean(err ** 2))
print("loss intended:  ", np.mean((y_hat.ravel() - y) ** 2))`}
        />
        <CodeOutput>{`err.shape: (4, 4)
loss as written: 0.37500000000000006
loss intended:   0.024999999999999994`}</CodeOutput>

        <p>
          Subtracting a <M>{String.raw`(4,)`}</M> from a <M>{String.raw`(4, 1)`}</M> does not fail. Broadcasting
          stretches both into <M>{String.raw`(4, 4)`}</M> and hands back <strong>every prediction minus every
          label</strong> — sixteen numbers, twelve of which compare unrelated examples. These predictions are
          excellent, and the loss should be <strong>0.025</strong>; what gets reported is <strong>0.375</strong>,
          fifteen times too large and dominated by comparisons that mean nothing. The gradients flow, training runs
          to completion, and nothing anywhere reports a problem.
        </p>
        <p>
          Two habits kill this permanently. Keep labels and predictions in the same rank — either{" "}
          <code>y.reshape(-1, 1)</code> or <code>y_hat.ravel()</code>, chosen once and applied consistently. And
          assert, rather than trust:
        </p>

        <CodeBlock
          language="Python"
          fromScratch={`def forward(X, params):
    n = X.shape[0]
    H1 = np.maximum(0, X @ params["W1"] + params["b1"])
    H2 = np.maximum(0, H1 @ params["W2"] + params["b2"])
    out = H2 @ params["W3"] + params["b3"]
    assert out.shape == (n, params["W3"].shape[1]), out.shape
    return out`}
        />

        <p>
          One line, and an entire category of silent failure becomes a loud one. This is the same discipline as the
          reproducibility work in the{" "}
          <strong>data workflow</strong> pillar: the failures worth engineering against are not the ones that
          crash.
        </p>

        <h2>Where the bias broadcast is doing you a favour</h2>
        <p>
          One broadcast is deliberate and correct. <M>{String.raw`XW`}</M> has shape{" "}
          <M>{String.raw`(n, h)`}</M> and <M>{String.raw`\mathbf{b}`}</M> has shape <M>{String.raw`(h,)`}</M>, and
          adding them stretches the bias down every row — every example gets the same per-unit offset, which is
          exactly what a bias means.
        </p>
        <p>
          The tell for whether a broadcast is helping or hurting is whether the stretched axis is the{" "}
          <strong>batch</strong> axis. Stretching a per-unit quantity across examples is right, because parameters
          are shared across examples by definition. Stretching a per-example quantity across other examples is the
          bug above.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>You have <code>X</code> of shape (32, 10) and a first layer with 64 units. What shape must{" "}
                <code>W1</code> and <code>b1</code> be?</>,
              options: ["(64, 10) and (32,)", "(10, 64) and (64,)", "(32, 64) and (64,)"],
              answer: 1,
              explain: <>Weights go <em>from</em> 10 inputs <em>to</em> 64 units, so (10, 64) — the inner 10s cancel
                and leave (32, 64). The bias has one entry per unit, never per example: a bias of shape (32,) would
                mean a different offset for each row of the batch, which is not a parameter of the model at all.</>,
            },
            {
              q: <>Subtracting a (100,) label array from a (100, 1) prediction array produces what?</>,
              options: [
                "A shape error",
                "A (100, 100) array comparing every prediction to every label",
                "A (100, 1) array — broadcasting handles it correctly",
              ],
              answer: 1,
              explain: <>Broadcasting aligns from the right and stretches both to (100, 100). It does not raise, the
                resulting loss is a perfectly ordinary number, and training proceeds on a quantity that is 99%
                nonsense.</>,
            },
            {
              q: <>How do you tell a helpful broadcast from a dangerous one?</>,
              options: [
                "Helpful ones do not change the total number of elements",
                "Check whether the stretched axis is the batch axis — stretching across examples is the bug",
                "Any broadcast in a forward pass is a bug",
              ],
              answer: 1,
              explain: <>The bias broadcast deliberately stretches a per-unit vector across examples, which is what
                &ldquo;shared parameters&rdquo; means, and it does change the element count. The dangerous case is
                stretching a <em>per-example</em> quantity across other examples.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/perceptron-to-mlp/a-layer-is-a-matrix-multiply", label: <>← A layer is a matrix multiply</> }}
          next={{ href: "/learn/perceptron-to-mlp/the-output-layer", label: <>Next up · The output layer is chosen by the task →</> }}
        />
      </div>
    </article>
  );
}
