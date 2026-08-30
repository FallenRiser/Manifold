import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "The four equations — Manifold",
  description:
    "Every backpropagation implementation ever written is these four lines. Two of them start and propagate the delta; two read the parameter gradients off it.",
};

const CORAL = "var(--c-neural)";

export default function FourEquationsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The algorithm", color: CORAL }, { label: "Tier 2 · mechanics", color: CORAL }]}
        time="about 8 minutes"
        title={<>The four equations</>}
        intro={<>Everything so far, written once in the compact form you will meet in every paper and every
          textbook. They are worth being able to reproduce from memory — not for their own sake, but because each
          one answers a question you will actually ask while debugging.</>}
      />

      <div className="lesson">
        <h2>The four</h2>

        <div style={{ display: "grid", gap: 12, margin: "1.4rem 0" }}>
          {[
            {
              n: "BP1",
              math: String.raw`\boldsymbol{\delta}^{(L)} \;=\; \nabla_{\hat{\mathbf{y}}}\mathcal{L} \;\odot\; g'\!\big(\mathbf{z}^{(L)}\big)`,
              says: "Start the delta at the output layer. With the matched loss and output activation, the two factors cancel into ŷ − y.",
            },
            {
              n: "BP2",
              math: String.raw`\boldsymbol{\delta}^{(\ell)} \;=\; \big(\boldsymbol{\delta}^{(\ell+1)} W^{(\ell+1)\top}\big) \odot g'\!\big(\mathbf{z}^{(\ell)}\big)`,
              says: "Move it back one layer: redistribute through the weights, then filter by the local slope. The only recursive step.",
            },
            {
              n: "BP3",
              math: String.raw`\frac{\partial \mathcal{L}}{\partial \mathbf{b}^{(\ell)}} \;=\; \boldsymbol{\delta}^{(\ell)}`,
              says: "The bias gradient IS the delta. The bias has a local derivative of exactly 1, so nothing modifies it.",
            },
            {
              n: "BP4",
              math: String.raw`\frac{\partial \mathcal{L}}{\partial W^{(\ell)}} \;=\; \mathbf{a}^{(\ell-1)\top}\,\boldsymbol{\delta}^{(\ell)}`,
              says: "The weight gradient is activation-in times error-out. Both ends must be non-zero for a weight to learn.",
            },
          ].map((e) => (
            <div key={e.n} style={{ background: `color-mix(in srgb, ${CORAL} 5%, var(--surface))`, border: `1px solid color-mix(in srgb, ${CORAL} 20%, var(--border))`, borderRadius: 12, padding: "12px 16px" }}>
              <div className="font-display" style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: CORAL, marginBottom: 2 }}>{e.n}</div>
              <MathBlock>{e.math}</MathBlock>
              <div style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55, marginTop: -6 }}>{e.says}</div>
            </div>
          ))}
        </div>

        <p>
          Only <strong>BP2</strong> is recursive. BP1 starts the chain, BP2 is the entire loop body, and BP3 and BP4
          are read off at each step without propagating anything. That is why the implementation is nine lines.
        </p>

        <h2>Each one answers a debugging question</h2>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 600 }}>
            <thead>
              <tr>
                {["when you ask…", "the equation that answers it", "what it says"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 20px 7px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Why is this weight not learning?", "BP4", "either its input activation or its delta is ~0"],
                ["Why does the first layer barely move?", "BP2", "the product of g′ factors has shrunk the delta"],
                ["Why did my loss go to NaN?", "BP2", "the same product, but growing rather than shrinking"],
                ["Why do biases behave differently?", "BP3", "they get the raw delta, unscaled by any activation"],
                ["Why does the loss choice matter so much?", "BP1", "a mismatched pair leaves a saturating factor uncancelled"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "7px 20px 7px 0", color: j === 1 ? CORAL : "var(--ink)", borderBottom: "1px solid var(--border)", verticalAlign: "top", lineHeight: 1.45, fontWeight: j === 1 ? 500 : 400 }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Callout color={CORAL} title={<>BP4 is the one to internalise</>}>
          <M>{String.raw`\partial\mathcal{L}/\partial W_{ij} = a_i\,\delta_j`}</M> is a product of two things, and a
          product is zero if <em>either</em> factor is. That single observation explains dead ReLUs (the{" "}
          <M>{String.raw`a_i`}</M> is zero), vanishing gradients (the <M>{String.raw`\delta_j`}</M> has been
          multiplied down to nothing), and why unscaled inputs blow training up (a large{" "}
          <M>{String.raw`a_i`}</M> makes an enormous gradient). Three apparently unrelated failures, one equation.
        </Callout>

        <h2>Where the shapes go</h2>
        <p>
          The compact notation hides the thing that actually bites in practice. With a batch of{" "}
          <M>{String.raw`n`}</M> examples, a layer of <M>{String.raw`p`}</M> inputs and{" "}
          <M>{String.raw`q`}</M> units:
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 500 }}>
            <thead>
              <tr>
                {["quantity", "shape", "note"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 24px 7px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["δ", "(n, q)", "one delta per example per unit"],
                ["a⁽ˡ⁻¹⁾", "(n, p)", "the stored forward activation"],
                ["∂L/∂W", "(p, q)", "aᵀδ — the batch dimension is summed away"],
                ["∂L/∂b", "(q,)", "δ summed over the batch, not averaged twice"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "7px 24px 7px 0", color: j === 1 ? CORAL : "var(--ink)", borderBottom: "1px solid var(--border)", fontFamily: j === 1 ? "ui-monospace, monospace" : undefined }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          The gradient of a weight must have the <em>same shape as the weight</em> — it is a step you will add to
          it. So the batch dimension has to disappear, and{" "}
          <M>{String.raw`\mathbf{a}^\top\boldsymbol{\delta}`}</M> with shapes{" "}
          <M>{String.raw`(p,n)\times(n,q) \to (p,q)`}</M> is where it goes. The matrix multiply is summing over
          examples, which is what &ldquo;the gradient of the mean loss&rdquo; means.
        </p>

        <Proof color={CORAL} title="deriving BP2 from the multivariable chain rule">
          <p>
            We want <M>{String.raw`\delta^{(\ell)}_k = \partial\mathcal{L}/\partial z^{(\ell)}_k`}</M>. The
            pre-activation <M>{String.raw`z^{(\ell)}_k`}</M> influences the loss only through its own activation{" "}
            <M>{String.raw`a^{(\ell)}_k = g(z^{(\ell)}_k)`}</M>, which then feeds <em>every</em> unit of the next
            layer. Summing over those paths:
          </p>
          <MathBlock>{String.raw`\delta^{(\ell)}_k = \sum_j \frac{\partial \mathcal{L}}{\partial z^{(\ell+1)}_j}\cdot\frac{\partial z^{(\ell+1)}_j}{\partial a^{(\ell)}_k}\cdot\frac{\partial a^{(\ell)}_k}{\partial z^{(\ell)}_k}`}</MathBlock>
          <p>
            Take the three factors in turn. The first is <M>{String.raw`\delta^{(\ell+1)}_j`}</M> by definition.
            For the second, <M>{String.raw`z^{(\ell+1)}_j = \sum_k a^{(\ell)}_k W^{(\ell+1)}_{kj} + b_j`}</M>, so
            the derivative is just <M>{String.raw`W^{(\ell+1)}_{kj}`}</M>. The third is{" "}
            <M>{String.raw`g'(z^{(\ell)}_k)`}</M>. Hence
          </p>
          <MathBlock>{String.raw`\delta^{(\ell)}_k = \left(\sum_j \delta^{(\ell+1)}_j W^{(\ell+1)}_{kj}\right) g'\!\big(z^{(\ell)}_k\big)`}</MathBlock>
          <p>
            The bracket is row <M>{String.raw`k`}</M> of{" "}
            <M>{String.raw`\boldsymbol{\delta}^{(\ell+1)}W^{(\ell+1)\top}`}</M> — note the transpose appears because
            we are summing over <M>{String.raw`j`}</M>, the <em>second</em> index of{" "}
            <M>{String.raw`W`}</M>, whereas the forward pass sums over the first. <strong>That transpose is the
            whole of &ldquo;going backwards&rdquo;</strong>: the same weights, read in the other direction.
          </p>
          <p>
            BP1 is the same derivation with the loss in place of the next layer; BP3 and BP4 follow from{" "}
            <M>{String.raw`\partial z_j/\partial b_j = 1`}</M> and{" "}
            <M>{String.raw`\partial z_j/\partial W_{ij} = a_i`}</M>.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Which of the four equations is the recursive one?</>,
              options: ["BP1", "BP2", "BP4"],
              answer: 1,
              explain: <>BP2 is the only equation that produces a delta from another delta, so it is the loop body.
                BP1 seeds the recursion once; BP3 and BP4 are read off at each layer without propagating
                anything.</>,
            },
            {
              q: <>Why does <M>{String.raw`W^\top`}</M> appear in the backward pass?</>,
              options: [
                "To make the matrix shapes line up",
                "Because the backward sum runs over the output index of W, while the forward sum runs over the input index",
                "Because the gradient of a matrix is its transpose",
              ],
              answer: 1,
              explain: <>It comes out of the derivation, not from shape-fitting: going backwards sums over{" "}
                <M>{String.raw`j`}</M> rather than <M>{String.raw`k`}</M>. The shapes lining up is a consequence.
                The last option is simply false — the gradient of a matrix is not its transpose.</>,
            },
            {
              q: <>A weight&rsquo;s gradient is zero. From BP4, what are the two possible causes?</>,
              options: [
                "The learning rate is zero, or the weight is at an optimum",
                "Its incoming activation is zero, or its outgoing delta is zero",
                "The loss is zero, or the batch is empty",
              ],
              answer: 1,
              explain: <><M>{String.raw`a_i\delta_j = 0`}</M> requires one factor to vanish. A zero{" "}
                <M>{String.raw`a_i`}</M> is a dead or silent input unit; a zero <M>{String.raw`\delta_j`}</M> is a
                gradient that has vanished on the way back. Distinguishing which is the first step in the
                chapter-5 diagnosis.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/backpropagation/backprop-by-hand", label: <>← Backprop by hand</> }}
          next={{ href: "/learn/backpropagation/why-it-is-cheap", label: <>Next up · Why it is cheap →</> }}
        />
      </div>
    </article>
  );
}
