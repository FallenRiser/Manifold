import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "The output layer is chosen by the task — Manifold",
  description:
    "Hidden activations are a judgement call. The output activation is not: the label space and the loss determine it, and there is exactly one right answer for each kind of task.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const ROWS: [string, string, string, string][] = [
  ["Regression — any real number", "none (identity)", "mean squared error", "house price, temperature"],
  ["Regression — must be positive", "softplus, or model log y", "MSE on the log scale", "counts, durations, prices"],
  ["Binary classification", "sigmoid → one probability", "binary cross-entropy", "spam / not spam"],
  ["Multi-class, one label", "softmax → probabilities summing to 1", "categorical cross-entropy", "which digit is this"],
  ["Multi-label, many at once", "sigmoid on each output, independently", "binary cross-entropy per output", "tags on a photo"],
];

export default function OutputLayerPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The forward pass", color: CORAL }, { label: "Tier 1 · practice", color: CORAL }]}
        time="about 8 minutes"
        title={<>The output layer is chosen <em>by the task</em></>}
        intro={<>Which activation to use in the hidden layers is a genuine judgement call with a whole track devoted
          to it. Which one to use at the output is not a judgement call at all. The shape of your labels determines
          it, and getting it wrong is one of the few errors here that is simply wrong rather than suboptimal.</>}
      />

      <div className="lesson">
        <h2>The table</h2>
        <p>
          Start with the answer, because unlike most tables in machine learning this one is not a set of
          suggestions.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 620 }}>
            <thead>
              <tr>
                {["the task", "output activation", "loss", "example"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 18px 7px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row[0]}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "7px 18px 7px 0", color: j === 1 ? CORAL : j === 3 ? "var(--faint)" : "var(--ink)", borderBottom: "1px solid var(--border)", verticalAlign: "top", lineHeight: 1.45 }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          Notice the second and third columns always move together. That is not a coincidence, and it is the thing
          actually worth understanding here.
        </p>

        <h2>The activation and the loss are one decision</h2>
        <p>
          An output activation exists to put the prediction in the same space as the label. A real-valued target
          needs a real-valued output, so no activation. A probability lives in{" "}
          <M>{String.raw`[0,1]`}</M>, so the network&rsquo;s unbounded score has to be squashed into that interval —
          which is what a sigmoid does. A distribution over ten classes must have ten non-negative numbers summing
          to one, which is what softmax does.
        </p>

        <MathBlock>{String.raw`\sigma(z) = \frac{1}{1 + e^{-z}} \qquad\qquad \text{softmax}(\mathbf{z})_i = \frac{e^{z_i}}{\sum_j e^{z_j}}`}</MathBlock>

        <p>
          Then the loss has to be the one that matches that output space. Pairing squared error with a sigmoid
          output is not a taste violation — it actively breaks training. When a sigmoid saturates, its derivative
          approaches zero, so a <em>confidently wrong</em> prediction produces almost no gradient and the model
          cannot recover from it. Cross-entropy is built to cancel that term exactly.
        </p>

        <Proof color={CORAL} title="why cross-entropy and sigmoid cancel, and squared error does not">
          <p>
            With <M>{String.raw`\hat{y} = \sigma(z)`}</M>, squared error gives, by the chain rule:
          </p>
          <MathBlock>{String.raw`\frac{\partial}{\partial z}\tfrac{1}{2}(\hat{y} - y)^2 = (\hat{y} - y)\,\sigma'(z), \qquad \sigma'(z) = \hat{y}(1 - \hat{y})`}</MathBlock>
          <p>
            Take a label of 1 and a prediction of 0.001 — as wrong as it is possible to be. The error term is{" "}
            <M>{String.raw`-0.999`}</M>, but <M>{String.raw`\sigma' = 0.001 \times 0.999 \approx 0.001`}</M>, so the
            gradient is about <M>{String.raw`-0.001`}</M>. <strong>The more badly wrong the model is, the less it
            learns.</strong>
          </p>
          <p>
            Binary cross-entropy is <M>{String.raw`L = -y\log\hat{y} - (1-y)\log(1-\hat{y})`}</M>. Differentiating
            with respect to <M>{String.raw`z`}</M>:
          </p>
          <MathBlock>{String.raw`\frac{\partial L}{\partial z} = \left(\frac{\hat{y}-y}{\hat{y}(1-\hat{y})}\right)\sigma'(z) = \left(\frac{\hat{y}-y}{\hat{y}(1-\hat{y})}\right)\hat{y}(1-\hat{y}) = \hat{y} - y`}</MathBlock>
          <p>
            The saturating factor cancels exactly. The gradient is just <strong>prediction minus label</strong> —
            for the same confidently wrong case, <M>{String.raw`-0.999`}</M>, a thousand times larger. The log in
            cross-entropy is precisely the inverse of the exponential in the sigmoid, and pairing them is what makes
            the composite well-behaved.
          </p>
          <p>
            The identical cancellation happens for softmax with categorical cross-entropy, which is why every
            framework ships them fused.
          </p>
        </Proof>

        <Callout color={CORAL} title={<>Why frameworks want the raw scores, not your softmax</>}>
          You will constantly see APIs asking for <strong>logits</strong> — the pre-activation numbers — rather than
          probabilities: <code>from_logits=True</code>, or PyTorch&rsquo;s{" "}
          <code>CrossEntropyLoss</code>, which applies softmax internally and errors if you did it yourself. The
          reason is numerical, not stylistic. Computing softmax and then its log separately overflows{" "}
          <M>{String.raw`e^{z}`}</M> for large <M>{String.raw`z`}</M> and underflows{" "}
          <M>{String.raw`\log 0`}</M> for small ones, while the fused version subtracts the max first and never
          forms either extreme. Applying softmax and <em>then</em> passing it to a logit-expecting loss squashes
          twice, which trains to something much flatter than it should — a bug that produces a working model with
          mysteriously poor accuracy.
        </Callout>

        <h2>Multi-class and multi-label are different questions</h2>
        <p>
          This is the distinction people most often get wrong, and it is a modelling error rather than a coding
          error. <strong>Softmax forces the outputs to compete</strong> — they sum to one, so raising one lowers the
          others. That is right when exactly one label is true, and wrong when several can be.
        </p>
        <p>
          A photo that is both <em>beach</em> and <em>sunset</em> is not 50/50 between them; it is high on both. Ask
          softmax and it cannot say so — the architecture forbids it. Use an independent sigmoid on each output
          instead and each one answers its own yes/no question.
        </p>

        <CodeBlock
          language="Python"
          fromScratch={`# exactly one label is true  ->  the outputs must compete
logits = model(X)                          # (n, 10), raw scores
loss   = cross_entropy(logits, y)          # softmax applied inside

# several labels may be true  ->  the outputs must not compete
logits = model(X)                          # (n, 10), raw scores
loss   = bce_with_logits(logits, y_multi)  # sigmoid applied inside, per output`}
        />

        <p>
          The forward pass is byte-for-byte identical; only the loss differs. The choice of output non-linearity is
          genuinely a choice about <em>what question you are asking of each output</em>, which is why it belongs to
          the task and not to the architecture.
        </p>

        <h2>The one real judgement call</h2>
        <p>
          Constrained regression is the one row of the table with room to argue. If the target must be positive you
          can put a <code>softplus</code> on the output, or you can model{" "}
          <M>{String.raw`\log y`}</M> and exponentiate afterwards. They are not equivalent: the second trains
          against relative error rather than absolute, which is usually what you want for prices and counts, and it
          is the reason the{" "}
          <Link href="/learn/california-housing-capstone" style={link}>housing capstone</Link> works on a log
          target.
        </p>
        <p>
          Everything else on this page has one right answer. Spend your judgement in the hidden layers.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why does pairing a sigmoid output with squared error damage training?</>,
              options: [
                "Squared error is the wrong scale for probabilities",
                "The sigmoid's derivative shrinks to zero exactly when the model is confidently wrong, so the gradient vanishes",
                "It makes the loss non-convex",
              ],
              answer: 1,
              explain: <>The gradient carries a factor <M>{String.raw`\hat{y}(1-\hat{y})`}</M>, which is tiny for a
                saturated output. A prediction of 0.001 against a label of 1 yields a gradient near{" "}
                <M>{String.raw`-0.001`}</M>. Cross-entropy&rsquo;s log cancels that factor and gives{" "}
                <M>{String.raw`\hat{y} - y`}</M> instead.</>,
            },
            {
              q: <>You are tagging photos, and a photo can be both &ldquo;beach&rdquo; and &ldquo;sunset&rdquo;. What
                belongs at the output?</>,
              options: [
                "Softmax over all tags",
                "An independent sigmoid per tag",
                "Softmax, with a threshold applied afterwards",
              ],
              answer: 1,
              explain: <>Softmax forces the outputs to sum to one, so confidence in one tag must come out of the
                others — the architecture cannot express &ldquo;both are strongly present&rdquo;. Independent
                sigmoids let each tag answer its own question. Thresholding a softmax does not fix this; the
                competition already happened.</>,
            },
            {
              q: <>Why do loss functions ask for logits instead of probabilities?</>,
              options: [
                "It saves a matrix multiplication",
                "Numerical stability — the fused version avoids overflow in exp and underflow in log",
                "Logits train faster because they are unbounded",
              ],
              answer: 1,
              explain: <>Computing softmax then log separately overflows for large scores and underflows for small
                ones; the fused form subtracts the max and never builds the extreme values. The trap is passing
                already-softmaxed values to a logit-expecting loss, which squashes twice and quietly degrades the
                model.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/perceptron-to-mlp/shapes", label: <>← Shapes, and how to keep them straight</> }}
          next={{ href: "/learn/perceptron-to-mlp/a-forward-pass-by-hand", label: <>Next up · A forward pass by hand →</> }}
        />
      </div>
    </article>
  );
}
