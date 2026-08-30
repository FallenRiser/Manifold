import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { GuessSlider } from "@/components/capstone/GuessSlider";

export const metadata = {
  title: "A forward pass by hand — Manifold",
  description:
    "Thirteen parameters, one input, and every number computed on paper — including the hidden unit that ReLU switches off, and what the network does when it cannot see it.",
};

const CORAL = "var(--c-neural)";

const UNITS: [string, string, string, string][] = [
  ["h₁", "2.0 × 0.8 + 1.0 × (−0.6) + 0.1", "+1.10", "1.10"],
  ["h₂", "2.0 × (−0.5) + 1.0 × 0.9 + (−1.5)", "−1.60", "0.00"],
  ["h₃", "2.0 × 1.2 + 1.0 × 0.4 + (−0.7)", "+2.10", "2.10"],
];

export default function ForwardPassByHandPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The forward pass", color: CORAL }, { label: "Tier 1 · practice", color: CORAL }]}
        time="about 8 minutes"
        title={<>A forward pass by hand</>}
        intro={<>Everything in the last three pages, executed on paper with pencil-friendly numbers. It is worth
          doing once, because the thing that stops being mysterious is not the arithmetic — it is realising there
          was never anything else in there.</>}
      />

      <div className="lesson">
        <h2>The network</h2>
        <p>
          Two inputs, three hidden units with ReLU, one output with a sigmoid. Thirteen parameters in total —{" "}
          <M>{String.raw`2\times3 + 3`}</M> in the first layer and <M>{String.raw`3\times1 + 1`}</M> in the second.
        </p>

        <MathBlock>{String.raw`W_1 = \begin{bmatrix} 0.8 & -0.5 & 1.2 \\ -0.6 & 0.9 & 0.4 \end{bmatrix} \quad \mathbf{b}_1 = \begin{bmatrix} 0.1 \\ -1.5 \\ -0.7 \end{bmatrix}^{\!\top} \quad W_2 = \begin{bmatrix} 1.5 \\ -2.0 \\ 0.7 \end{bmatrix} \quad b_2 = 0.3`}</MathBlock>

        <p>
          The input is <M>{String.raw`\mathbf{x} = (2.0,\; 1.0)`}</M>.
        </p>

        <h2>Step 1 — mix</h2>
        <p>
          Each hidden unit takes its own <em>column</em> of <M>{String.raw`W_1`}</M> and dots it with the input,
          then adds that unit&rsquo;s bias.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 460 }}>
            <thead>
              <tr>
                {["unit", "weighted sum + bias", "z", "ReLU(z)"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 20px 7px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {UNITS.map((row) => (
                <tr key={row[0]}>
                  {row.map((c, j) => (
                    <td key={j} style={{
                      padding: "7px 20px 7px 0",
                      color: j === 3 ? (c === "0.00" ? "var(--bad)" : CORAL) : "var(--ink)",
                      borderBottom: "1px solid var(--border)",
                      fontVariantNumeric: "tabular-nums",
                      whiteSpace: "nowrap",
                    }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>Step 2 — bend</h2>
        <p>
          ReLU is <M>{String.raw`\max(0, z)`}</M>, applied to each unit on its own. Two units pass through
          unchanged. <strong>Unit 2 is negative, so it outputs exactly zero</strong> — and that is not a rounding
          artefact, it is the entire behaviour of ReLU. For this input, unit 2 might as well not exist.
        </p>

        <Callout color={CORAL} title={<>What a zero actually means here</>}>
          Unit 2&rsquo;s three parameters still exist and still receive gradient on other inputs. But for{" "}
          <M>{String.raw`\mathbf{x} = (2.0, 1.0)`}</M> its contribution to the output is zero, and — importantly —
          the gradient flowing back through it is <em>also</em> zero, because ReLU&rsquo;s slope is flat on the
          negative side. Different inputs switch different units on, so a ReLU network is a large collection of
          smaller linear models, one for each on/off pattern, with the input deciding which one runs. That is the
          precise sense in which such a network is <strong>piecewise linear</strong>, and it is the mechanism behind
          the kinks in the collapse lab two pages ago.
        </Callout>

        <h2>Step 3 — mix again</h2>
        <p>
          The output unit takes the three hidden values and does exactly what a neuron always does.
        </p>

        <MathBlock>{String.raw`z_2 = 1.10 \times 1.5 \;+\; 0.00 \times (-2.0) \;+\; 2.10 \times 0.7 \;+\; 0.3 \;=\; 1.65 + 0 + 1.47 + 0.3 \;=\; 3.42`}</MathBlock>

        <p>
          Note that the <M>{String.raw`-2.0`}</M> weight — the largest in the output layer — contributed nothing,
          because the unit it was weighting is switched off. A large weight on a dead unit is worth exactly as much
          as no weight at all, which is worth remembering the next time you are tempted to read importance off
          weight magnitudes.
        </p>

        <GuessSlider
          accent={CORAL}
          prompt={<>The raw score is 3.42. What probability does the sigmoid turn that into?</>}
          min={0.5}
          max={1}
          step={0.005}
          start={0.75}
          actual={0.9683}
          decimals={4}
          reveal={<>A score of 3.42 is already deep into the flat part of the sigmoid — most people guess lower.
            This is worth feeling directly, because it is the same saturation that kills gradients: at 0.9683 the
            sigmoid&rsquo;s slope is <M>{String.raw`0.9683 \times 0.0317 \approx 0.031`}</M>, so the score would have
            to move a long way to change the answer much.</>}
        />

        <MathBlock>{String.raw`\hat{y} = \sigma(3.42) = \frac{1}{1 + e^{-3.42}} = 0.9683`}</MathBlock>

        <h2>What it cost</h2>
        <p>
          If the true label is 1, the binary cross-entropy is{" "}
          <M>{String.raw`-\log(0.9683) = 0.0322`}</M> — nearly free, because the model was confident and right. If
          the true label is 0, it is <M>{String.raw`-\log(1 - 0.9683) = 3.4522`}</M>, a hundred times larger. That
          asymmetry is the whole point of a log loss: <strong>being confidently wrong is expensive by
          construction</strong>, which is what makes it push probabilities toward honesty.
        </p>

        <h2>Check it</h2>
        <CodeBlock
          language="Python"
          fromScratch={`import numpy as np

W1 = np.array([[0.8, -0.5, 1.2],
               [-0.6, 0.9, 0.4]])
b1 = np.array([0.1, -1.5, -0.7])
W2 = np.array([[1.5], [-2.0], [0.7]])
b2 = np.array([0.3])
x  = np.array([2.0, 1.0])

z1 = x @ W1 + b1
h1 = np.maximum(0, z1)
z2 = h1 @ W2 + b2
y_hat = 1 / (1 + np.exp(-z2))

print("z1     =", z1)
print("h1     =", h1)
print("z2     =", z2)
print("y_hat  =", np.round(y_hat, 4))
print("loss if y=1:", round(float(-np.log(y_hat)), 4))
print("loss if y=0:", round(float(-np.log(1 - y_hat)), 4))`}
        />
        <CodeOutput>{`z1     = [ 1.1 -1.6  2.1]
h1     = [1.1 0.  2.1]
z2     = [3.42]
y_hat  = [0.9683]
loss if y=1: 0.0322
loss if y=0: 3.4522`}</CodeOutput>

        <p>
          Every number on this page came out of that snippet. Six multiply-adds, one <code>max</code>, three more
          multiply-adds and one <code>exp</code> — and that is a forward pass. A production network does the same
          arithmetic several billion times per prediction; it does not do anything <em>else</em>.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Unit 2 has the largest output weight (−2.0) and contributed nothing to the prediction. Why?</>,
              options: [
                "Its weight was cancelled by the bias",
                "Its pre-activation was negative, so ReLU set its output to exactly zero",
                "The output layer ignores negative weights",
              ],
              answer: 1,
              explain: <>ReLU clamps negatives to zero, and <M>{String.raw`0 \times (-2.0) = 0`}</M>. The weight is
                irrelevant for <em>this</em> input and may matter enormously for another. It is a good reason to be
                sceptical of reading feature importance off weight magnitudes in a network.</>,
            },
            {
              q: <>What does it mean that a ReLU network is &ldquo;piecewise linear&rdquo;?</>,
              options: [
                "It approximates curves using many short straight segments chosen in advance",
                "For each on/off pattern of the units, the network is exactly an affine function; the input selects the pattern",
                "It can only represent linear functions",
              ],
              answer: 1,
              explain: <>Within a region where the same units are on, every ReLU is in a fixed linear regime, so the
                whole network is exactly affine there. The segments are not designed — the boundaries between them
                are learned, which is what distinguishes this from fitting a spline with fixed knots.</>,
            },
            {
              q: <>The prediction is 0.9683. Why is the loss for a label of 0 more than a hundred times the loss for
                a label of 1?</>,
              options: [
                "Because the classes are imbalanced",
                "Because log loss grows without bound as the prediction approaches the wrong extreme",
                "Because the sigmoid is asymmetric around 0.5",
              ],
              answer: 1,
              explain: <><M>{String.raw`-\log(0.0317) = 3.4522`}</M> against{" "}
                <M>{String.raw`-\log(0.9683) = 0.0322`}</M>. As a confident prediction becomes wrong the loss goes to
                infinity, which is exactly the property that makes cross-entropy punish overconfidence. The sigmoid
                itself is perfectly symmetric about 0.5.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/perceptron-to-mlp/the-output-layer", label: <>← The output layer is chosen by the task</> }}
          next={{ href: "/learn/perceptron-to-mlp/from-the-rule-to-a-loss", label: <>Next up · From the rule to a loss →</> }}
        />
      </div>
    </article>
  );
}
