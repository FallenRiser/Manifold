import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "The backward pass — Manifold",
  description:
    "One quantity per layer, computed from the layer after it. Once you know delta, every weight gradient in the network is a single outer product away.",
};

const CORAL = "var(--c-neural)";

// Forward and backward drawn as two sweeps over the same stack. Literal
// coordinates; no hydration surface.
function SweepFigure() {
  const W = 540, H = 176;
  const xs = [56, 176, 296, 416];
  const labels = ["input", "layer 1", "layer 2", "loss"];

  return (
    <figure style={{ margin: "1.6rem 0" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}
        role="img" aria-label="A forward sweep left to right carrying activations, and a backward sweep right to left carrying deltas">
        {xs.map((x, i) => (
          <g key={i}>
            <rect x={x - 34} y={62} width={68} height={40} rx={10}
              fill="var(--surface)" stroke={i === 3 ? CORAL : "var(--border-strong)"} strokeWidth={i === 3 ? 1.6 : 1} />
            <text x={x} y={86} fontSize={11} fill="var(--ink)" textAnchor="middle">{labels[i]}</text>
          </g>
        ))}

        {/* forward */}
        {xs.slice(0, 3).map((x, i) => (
          <g key={`f${i}`}>
            <line x1={x + 34} y1={74} x2={xs[i + 1] - 38} y2={74} stroke="var(--muted)" strokeWidth={1.4} />
            <path d={`M ${xs[i + 1] - 44} 70 L ${xs[i + 1] - 37} 74 L ${xs[i + 1] - 44} 78`} fill="none" stroke="var(--muted)" strokeWidth={1.4} />
          </g>
        ))}
        <text x={W / 2} y={46} fontSize={10.5} fill="var(--muted)" textAnchor="middle">
          forward — carries activations, and stores them
        </text>

        {/* backward */}
        {xs.slice(0, 3).map((x, i) => (
          <g key={`b${i}`}>
            <line x1={xs[i + 1] - 34} y1={92} x2={x + 38} y2={92} stroke={CORAL} strokeWidth={1.6} />
            <path d={`M ${x + 44} 88 L ${x + 37} 92 L ${x + 44} 96`} fill="none" stroke={CORAL} strokeWidth={1.6} />
          </g>
        ))}
        <text x={W / 2} y={126} fontSize={10.5} fill={CORAL} textAnchor="middle">
          backward — carries δ, and uses the stored activations
        </text>
        <text x={W / 2} y={152} fontSize={10} fill="var(--faint)" textAnchor="middle">
          this is why training needs more memory than prediction
        </text>
      </svg>
      <figcaption style={{ fontSize: 12, color: "var(--faint)", marginTop: 6 }}>
        Two sweeps over the same stack. The backward one needs what the forward one saw.
      </figcaption>
    </figure>
  );
}

export default function BackwardPassPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The algorithm", color: CORAL }, { label: "Tier 2 · mechanics", color: CORAL }]}
        time="about 9 minutes"
        title={<>The backward pass</>}
        intro={<>Now the actual algorithm. It is one quantity per layer, defined in terms of the layer after it —
          and once you have that quantity, every weight gradient in the network is one multiplication away.</>}
      />

      <div className="lesson">
        <h2>The one quantity worth naming</h2>
        <p>
          A layer computes <M>{String.raw`\mathbf{z} = \mathbf{a}W + \mathbf{b}`}</M>, then{" "}
          <M>{String.raw`\mathbf{a}' = g(\mathbf{z})`}</M>. The quantity everything hangs on is the gradient of the
          loss with respect to <M>{String.raw`\mathbf{z}`}</M> — the <em>pre-activation</em>, not the weights and
          not the output:
        </p>

        <MathBlock>{String.raw`\boldsymbol{\delta}^{(\ell)} \;=\; \frac{\partial \mathcal{L}}{\partial \mathbf{z}^{(\ell)}}`}</MathBlock>

        <p>
          Why <M>{String.raw`\mathbf{z}`}</M> and not <M>{String.raw`W`}</M>? Because{" "}
          <M>{String.raw`\mathbf{z}`}</M> is the point where <em>all</em> the influence of that layer&rsquo;s
          parameters is concentrated. <M>{String.raw`W`}</M> and <M>{String.raw`\mathbf{b}`}</M> affect the loss{" "}
          <strong>only</strong> through <M>{String.raw`\mathbf{z}`}</M>, so once you know how much{" "}
          <M>{String.raw`\mathbf{z}`}</M> matters, both parameter gradients are immediate. Choosing the right
          intermediate quantity is most of what makes the algorithm tidy.
        </p>

        <h2>Three steps, repeated</h2>
        <p>
          <strong>Step one — start at the end.</strong> With a sigmoid output and cross-entropy loss, the
          saturating factors cancel and the last layer&rsquo;s delta is just prediction minus label:
        </p>

        <MathBlock>{String.raw`\boldsymbol{\delta}^{(L)} \;=\; \hat{\mathbf{y}} - \mathbf{y}`}</MathBlock>

        <p>
          <strong>Step two — move one layer back.</strong> Two things happen, in this order. The delta passes
          backwards through the weight matrix, which redistributes it to the units that fed in; then it is filtered
          by the activation&rsquo;s local slope.
        </p>

        <MathBlock>{String.raw`\boldsymbol{\delta}^{(\ell)} \;=\; \underbrace{\big(\boldsymbol{\delta}^{(\ell+1)} W^{(\ell+1)\top}\big)}_{\text{redistribute through the weights}} \;\odot\; \underbrace{g'\!\big(\mathbf{z}^{(\ell)}\big)}_{\text{filter by the local slope}}`}</MathBlock>

        <p>
          The <M>{String.raw`\odot`}</M> is elementwise multiplication. That second factor is where the whole of
          chapter 5 lives: if <M>{String.raw`g'`}</M> is small, the delta shrinks on every layer it passes through,
          and twelve layers of shrinking is the 29-million-fold ratio we will measure.
        </p>

        <p>
          <strong>Step three — read off the parameter gradients.</strong> Having <M>{String.raw`\delta`}</M>, the
          rest is arithmetic:
        </p>

        <MathBlock>{String.raw`\frac{\partial \mathcal{L}}{\partial W^{(\ell)}} \;=\; \mathbf{a}^{(\ell-1)\top}\boldsymbol{\delta}^{(\ell)} \qquad\qquad \frac{\partial \mathcal{L}}{\partial \mathbf{b}^{(\ell)}} \;=\; \boldsymbol{\delta}^{(\ell)}`}</MathBlock>

        <Callout color={CORAL} title={<>The shape of the weight gradient tells you what it means</>}>
          <M>{String.raw`\partial\mathcal{L}/\partial W_{ij} = a_i \delta_j`}</M> — the activation coming{" "}
          <em>in</em> on the left, times the error going <em>out</em> on the right. A weight only gets a gradient if
          both ends are non-zero. <strong>If the input unit was silent, that weight learns nothing this
          example</strong>, no matter how wrong the prediction was — which is exactly the dead-unit story from the
          previous track, now visible as a product of two terms.
        </Callout>

        <h2>Why the forward pass has to be stored</h2>
        <SweepFigure />
        <p>
          Look at what step three needs: <M>{String.raw`\mathbf{a}^{(\ell-1)}`}</M>, the activation from the forward
          pass. And step two needs <M>{String.raw`g'(\mathbf{z}^{(\ell)})`}</M>, which needs{" "}
          <M>{String.raw`\mathbf{z}`}</M>. So the backward pass cannot run alone — <strong>every intermediate
          activation from the forward pass must be kept</strong> until the backward pass consumes it.
        </p>
        <p>
          This is not a footnote. It is why training a model takes several times the memory of running one, why
          batch size is limited by memory rather than by compute, and why techniques like gradient checkpointing
          exist — they trade time for memory by recomputing activations instead of storing them. When a training
          job runs out of memory and inference on the same model is fine, this is why.
        </p>

        <h2>The whole algorithm</h2>
        <CodeBlock
          language="Python"
          fromScratch={`def backward(y, params, cache, act_grad):
    zs, activations = cache
    grads = [None] * len(params)

    delta = (sigmoid(zs[-1]) - y) / len(y)        # step 1: start at the loss

    for i in range(len(params) - 1, -1, -1):      # walk backwards
        W, _ = params[i]
        grads[i] = [activations[i].T @ delta,     # step 3: this layer's gradients
                    delta.sum(axis=0)]
        if i > 0:                                 # step 2: hand delta back
            delta = (delta @ W.T) * act_grad(zs[i - 1])

    return grads`}
        />

        <p>
          Nine lines, and it computes the gradient of every parameter in a network of any depth. Note the order
          inside the loop: <strong>the gradients for layer <M>{String.raw`i`}</M> are read off before{" "}
          <M>{String.raw`\delta`}</M> is updated</strong>, because the update overwrites it with the previous
          layer&rsquo;s value. Swapping those two statements is a bug that still produces plausible-looking numbers,
          and it is on the shortlist three pages from now.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why is <M>{String.raw`\delta`}</M> defined at the pre-activation{" "}
                <M>{String.raw`\mathbf{z}`}</M> rather than at the weights?</>,
              options: [
                "Because z is easier to compute",
                "Because W and b influence the loss only through z, so knowing δ gives both gradients immediately",
                "Because the activation function is applied to z",
              ],
              answer: 1,
              explain: <><M>{String.raw`\mathbf{z}`}</M> is the bottleneck through which all of that layer&rsquo;s
                parameters act. Once <M>{String.raw`\delta`}</M> is known, the weight gradient is an outer product
                and the bias gradient is <M>{String.raw`\delta`}</M> itself — no further propagation needed.</>,
            },
            {
              q: <>Which factor in the delta recursion causes vanishing gradients?</>,
              options: [
                "The weight matrix transpose",
                "The activation's local slope g′(z), multiplied in at every layer",
                "The division by batch size",
              ],
              answer: 1,
              explain: <>Every layer multiplies by <M>{String.raw`g'`}</M>. For a saturated sigmoid that factor is
                far below 1, and twelve of them compound. The weights contribute too — which is why initialisation
                scale changes the vanishing by six orders of magnitude — but <M>{String.raw`g'`}</M> is the factor
                the activation controls.</>,
            },
            {
              q: <>Why does training a model need much more memory than making a prediction with it?</>,
              options: [
                "Gradients are larger than weights",
                "Every intermediate activation from the forward pass must be kept for the backward pass to use",
                "The optimiser stores a copy of the whole dataset",
              ],
              answer: 1,
              explain: <>The weight gradient needs <M>{String.raw`\mathbf{a}^{(\ell-1)}`}</M> and the delta
                recursion needs <M>{String.raw`\mathbf{z}^{(\ell)}`}</M>, so nothing can be discarded until the
                backward pass reaches it. Inference discards each activation as soon as the next layer is computed,
                which is why the same model fits comfortably at prediction time.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/backpropagation/the-computational-graph", label: <>← The computational graph</> }}
          next={{ href: "/learn/backpropagation/backprop-by-hand", label: <>Next up · Backprop by hand →</> }}
        />
      </div>
    </article>
  );
}
