import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";

export const metadata = {
  title: "Backprop by hand — Manifold",
  description:
    "The same thirteen-parameter network from the previous track, now differentiated on paper — including the unit whose entire column of gradients is zero, and why.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function BackpropByHandPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The algorithm", color: CORAL }, { label: "Tier 2 · mechanics", color: CORAL }]}
        time="about 10 minutes"
        title={<>Backprop by hand</>}
        intro={<>The same network you ran forward two chapters ago, run backwards. Thirteen parameters, every number
          on paper, and one column of zeros that explains more about training than the other twelve numbers put
          together.</>}
      />

      <div className="lesson">
        <h2>Where we left it</h2>
        <p>
          The <Link href="/learn/perceptron-to-mlp/a-forward-pass-by-hand" style={link}>forward pass</Link> gave us
          this, for the input <M>{String.raw`\mathbf{x} = (2.0,\ 1.0)`}</M>:
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 420 }}>
            <thead>
              <tr>
                {["", "unit 1", "unit 2", "unit 3"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 24px 7px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["z₁ (pre-activation)", "+1.10", "−1.60", "+2.10"],
                ["h₁ = ReLU(z₁)", "1.10", "0.00", "2.10"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "7px 24px 7px 0", color: j === 2 && i === 1 ? "var(--bad)" : j === 0 ? "var(--muted)" : "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          Then <M>{String.raw`z_2 = 3.42`}</M> and <M>{String.raw`\hat{y} = \sigma(3.42) = 0.9683`}</M>. This time
          take the true label to be <strong>0</strong> — the model is confidently wrong, the interesting case. The
          loss is <M>{String.raw`-\log(1 - 0.9683) = 3.4522`}</M>.
        </p>

        <h2>Step 1 — the delta at the output</h2>
        <p>
          Sigmoid and cross-entropy cancel, so this is simply prediction minus label:
        </p>
        <MathBlock>{String.raw`\delta_2 \;=\; \hat{y} - y \;=\; 0.9683 - 0 \;=\; 0.9683`}</MathBlock>
        <p>
          A large delta, as it should be: the model was as wrong as it is possible to be, and the gradient says so
          in proportion.
        </p>

        <h2>Step 2 — the output layer&rsquo;s gradients</h2>
        <p>
          <M>{String.raw`\partial\mathcal{L}/\partial W_2 = \mathbf{h}_1^\top \delta_2`}</M> — each hidden
          activation times the error:
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 480 }}>
            <thead>
              <tr>
                {["weight", "h₁ value", "× δ₂", "gradient"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 22px 7px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["W₂[1]", "1.10", "× 0.9683", "1.0652"],
                ["W₂[2]", "0.00", "× 0.9683", "0.0000"],
                ["W₂[3]", "2.10", "× 0.9683", "2.0335"],
                ["b₂", "—", "= δ₂", "0.9683"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "7px 22px 7px 0", color: j === 3 ? (c === "0.0000" ? "var(--bad)" : CORAL) : "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          There it is already. <strong>Unit 2&rsquo;s weight gets a gradient of exactly zero</strong> — not small,
          zero — because its activation was zero. The model is badly wrong and this weight will not move at all.
        </p>

        <h2>Step 3 — hand the delta backwards</h2>
        <p>
          First redistribute through the weights, <M>{String.raw`\delta_2 W_2^\top`}</M>:
        </p>
        <MathBlock>{String.raw`\frac{\partial\mathcal{L}}{\partial \mathbf{h}_1} \;=\; 0.9683 \times (1.5,\ -2.0,\ 0.7) \;=\; (1.4525,\ -1.9366,\ 0.6778)`}</MathBlock>
        <p>
          Now the crucial bit — filter by ReLU&rsquo;s slope, which is 1 where the unit was on and{" "}
          <strong>0</strong> where it was off:
        </p>
        <MathBlock>{String.raw`\boldsymbol{\delta}_1 \;=\; (1.4525,\ -1.9366,\ 0.6778) \odot (1,\ 0,\ 1) \;=\; (1.4525,\ 0,\ 0.6778)`}</MathBlock>

        <Callout color={CORAL} title={<>The most instructive number on this page</>}>
          Unit 2&rsquo;s incoming gradient was <M>{String.raw`-1.9366`}</M> — <em>the largest of the three in
          magnitude</em>. The network would benefit most from changing that unit. And ReLU multiplies it by zero.
          <br /><br />
          The unit is not merely unhelpful on this example; it is <strong>unreachable</strong> on it. All three of
          its incoming weights and its bias get exactly zero gradient. If that unit happens to be off for every row
          in the dataset, it gets zero gradient forever and can never come back — which is precisely what{" "}
          <em>dying ReLU</em> means, and precisely what we will measure at a learning rate of 10 in chapter 4, where{" "}
          <strong>16 of 16 units</strong> in a layer die at once.
        </Callout>

        <h2>Step 4 — the first layer&rsquo;s gradients</h2>
        <p>
          <M>{String.raw`\partial\mathcal{L}/\partial W_1 = \mathbf{x}^\top \boldsymbol{\delta}_1`}</M>, with{" "}
          <M>{String.raw`\mathbf{x} = (2.0,\ 1.0)`}</M>:
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 460 }}>
            <thead>
              <tr>
                {["∂L/∂W₁", "to unit 1", "to unit 2", "to unit 3"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 24px 7px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["from x₁ = 2.0", "2.9050", "0.0000", "1.3557"],
                ["from x₂ = 1.0", "1.4525", "0.0000", "0.6778"],
                ["bias b₁", "1.4525", "0.0000", "0.6778"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "7px 24px 7px 0", color: j === 2 ? "var(--bad)" : j === 0 ? "var(--muted)" : "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          All thirteen gradients, from one backward sweep. The middle column is zero throughout, and the{" "}
          <M>{String.raw`x_1`}</M> row is exactly twice the <M>{String.raw`x_2`}</M> row — because{" "}
          <M>{String.raw`x_1 = 2x_2`}</M> and the gradient is proportional to the input. Larger inputs produce larger
          gradients, which is the arithmetic behind why unscaled features wreck training.
        </p>

        <h2>Check it against something that cannot be wrong</h2>
        <CodeBlock
          language="Python"
          fromScratch={`# analytic
delta2 = p - y
gW2 = h1.T @ delta2
dh1  = delta2 @ W2.T
delta1 = dh1 * (z1 > 0)
gW1  = x.T @ delta1

# the same number, by nudging W1[0,0] and re-running the network
h = 1e-6
up, dn = W1.copy(), W1.copy()
up[0, 0] += h
dn[0, 0] -= h
print("analytic         ", gW1[0, 0])
print("finite difference", (loss_of(up) - loss_of(dn)) / (2 * h))`}
        />
        <CodeOutput>{`analytic          2.9049713149
finite difference 2.9049713162`}</CodeOutput>

        <p>
          Agreement to nine significant figures. The remaining disagreement is the finite-difference method&rsquo;s
          error, not backprop&rsquo;s — backprop is exact, and the slow method is the approximate one. That
          inversion is worth holding onto: <strong>we check the fast exact method against the slow approximate one
          because it is the only independent check available</strong>, not because the slow one is more
          trustworthy.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Unit 2&rsquo;s incoming gradient was −1.9366, the largest in magnitude, yet all of its parameter
                gradients are zero. Why?</>,
              options: [
                "Its weights were already optimal",
                "ReLU's slope is 0 for a negative pre-activation, so the delta is multiplied by zero",
                "The gradient was clipped",
              ],
              answer: 1,
              explain: <>The delta arrives, then gets filtered by <M>{String.raw`g'(z)`}</M>, which is 0 here. The
                network &ldquo;wanted&rdquo; that unit to change more than either other unit and has no way to say
                so — the useful signal is destroyed at the gate, not before it.</>,
            },
            {
              q: <>In <M>{String.raw`\partial\mathcal{L}/\partial W_1`}</M>, the <M>{String.raw`x_1`}</M> row is
                exactly double the <M>{String.raw`x_2`}</M> row. What does that tell you?</>,
              options: [
                "There is an error — they should be equal",
                "The weight gradient is proportional to the incoming activation, and x₁ = 2x₂",
                "The first input is twice as important to the prediction",
              ],
              answer: 1,
              explain: <><M>{String.raw`\partial\mathcal{L}/\partial W_{ij} = a_i\delta_j`}</M>, so doubling the
                input doubles the gradient. Importance is not what this measures — it is the arithmetic reason a
                feature measured in tens of thousands dominates one measured in single digits.</>,
            },
            {
              q: <>Analytic and finite-difference gradients agree to nine figures. Which one is exact?</>,
              options: [
                "The finite difference — it is measured directly from the loss",
                "The analytic one — the finite difference is an approximation with both truncation and rounding error",
                "Neither; they are both approximations",
              ],
              answer: 1,
              explain: <>Backprop applies the chain rule exactly, up to floating-point arithmetic. The finite
                difference is a deliberate approximation whose accuracy peaks around{" "}
                <M>{String.raw`h = 10^{-6}`}</M> and degrades on both sides. We use it as a check only because it
                is derived independently.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/backpropagation/the-backward-pass", label: <>← The backward pass</> }}
          next={{ href: "/learn/backpropagation/the-four-equations", label: <>Next up · The four equations →</> }}
        />
      </div>
    </article>
  );
}
