import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "The depth tax — Manifold",
  description:
    "Depth is not free. Every layer added costs gradient stability, parameters, memory, and optimisation difficulty. These costs are measurable, and past a crossover point they outweigh the compositional benefit.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TheDepthTaxPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Depth", color: CORAL }, { label: "Tier 1 · costs", color: CORAL }]}
        time="about 10 minutes"
        title={<>The depth tax</>}
        intro={<>The previous pages showed what depth buys. This page shows what it costs. Every
          layer you add taxes three budgets — gradient stability, parameter count, and optimisation
          difficulty — and each tax compounds with depth. Past a problem-dependent crossover, the
          tax exceeds the benefit and more layers make the model worse.</>}
      />

      <div className="lesson">
        <h2>Tax 1: the gradient product</h2>
        <p>
          Backpropagation computes the gradient of the loss with respect to the first layer&rsquo;s
          weights by multiplying <M>{String.raw`D`}</M> Jacobian factors, one per layer. For a
          scalar simplification, the gradient at the first layer scales as the product of the
          per-layer derivative factors:
        </p>

        <MathBlock>{String.raw`\frac{\partial \mathcal{L}}{\partial W_1} \;\propto\; \prod_{i=1}^{D} \frac{\partial f_i}{\partial \mathbf{h}_{i-1}}`}</MathBlock>

        <p>
          If each factor is slightly less than 1, the product <strong>vanishes</strong>{" "}
          exponentially with <M>{String.raw`D`}</M>. If each factor is slightly greater than 1,
          the product <strong>explodes</strong>. Only if every factor is exactly 1 — on average,
          over training — does the gradient arrive at the first layer with the same magnitude it
          had at the last.
        </p>
        <p>
          Modern initialisation (He for ReLU, Glorot for tanh) is designed to set each factor
          near 1 at the start of training. And on this track&rsquo;s running problem, it works:
          the measured gradient ratio (last-layer gradient norm divided by first-layer gradient
          norm) with He initialisation and ReLU at width 16 is:
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 340 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>depth</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>gradient ratio (He + ReLU)</th>
              </tr>
            </thead>
            <tbody>
              {([
                { d: 2, r: "3.22" },
                { d: 4, r: "5.19" },
                { d: 8, r: "2.52" },
                { d: 20, r: "2.23" },
                { d: 30, r: "2.90" },
              ] as const).map((row) => (
                <tr key={row.d}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>{row.d}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{row.r}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Width 16, ReLU, He init. Ratio = ||grad at last layer|| / ||grad at first layer||.
          From <code>scripts/architecture_cases.py</code>.
        </p>

        <p>
          All ratios land between 2 and 6 — well-behaved. With He initialisation and ReLU,
          gradient factors stay near 1 per layer, and the product does not compound disastrously
          even at depth 30. Compare this with sigmoid, which (as measured on the{" "}
          <Link href="/learn/backpropagation" style={link}>backpropagation track</Link>)
          produces a gradient ratio of <strong>2.9 &times; 10<sup>7</sup></strong> at depth 12.
          The per-layer factor for sigmoid&rsquo;s peak derivative is 0.25; raised to the 12th
          power that is <M>{String.raw`6 \times 10^{-8}`}</M>, which is the vanishing direction.
          The ratio measures the explosion in the reverse direction, and either extreme is fatal.
        </p>

        <Callout color={CORAL} title={<>Necessary but not sufficient</>}>
          A reasonable gradient ratio means the gradient <em>signal</em> arrives at the early layers.
          It does not mean the model trains well. At depth 20 with width 16, the gradient ratio is a
          healthy 2.23, but the trained test accuracy is only <strong>0.750</strong> — far below the
          0.953 achieved at depth 2 with width 32. The gradient is arriving, but other pathologies
          are eating the performance. Gradient preservation is a prerequisite, not a guarantee.
        </Callout>

        <h2>Tax 2: parameters and memory</h2>
        <p>
          Each added hidden layer of width <M>{String.raw`W`}</M> introduces{" "}
          <M>{String.raw`W^2 + W`}</M> parameters (the weight matrix plus the bias vector). On its
          own this is linear in depth, and for moderate widths the parameter cost is manageable. A
          depth-8, width-32 network has about 8,000 parameters; a depth-2, width-32 network has
          about 1,200. The eightfold increase buys nothing on this problem — the depth-8 model
          scores 0.936 against the depth-2 model&rsquo;s 0.953.
        </p>
        <p>
          The memory cost during training is worse than the parameter count suggests. To compute
          the backward pass, the training framework must store the <em>activations</em> at every
          layer — the values <M>{String.raw`\mathbf{h}_i`}</M> that the forward pass produced —
          because the chain rule needs them to compute the Jacobians. The activation memory scales
          as <M>{String.raw`D \times B \times W`}</M>, where <M>{String.raw`B`}</M> is the batch
          size. Double the depth, double the activation memory. On large models this is the binding
          constraint: a 100-layer transformer does not just have 100 layers of weights; it has
          100 layers of cached activations, each the size of the batch times the hidden dimension.
        </p>

        <MathBlock>{String.raw`\text{activation memory} = D \times B \times W \times \text{sizeof(float)}`}</MathBlock>

        <p>
          This is why techniques like gradient checkpointing exist: they trade compute for memory
          by recomputing activations during the backward pass instead of storing them. The trade-off
          is real — checkpointing roughly doubles the compute time — but it lets you train models
          that would not fit in memory otherwise. The need for checkpointing is itself a measure of
          how much depth costs.
        </p>

        <h2>Tax 3: optimisation difficulty</h2>
        <p>
          This is the tax that is hardest to measure and often the most important. A deeper loss
          surface is a <em>harder</em> loss surface. The number of saddle points grows exponentially
          with depth. The curvature varies more sharply, so a learning rate that works well in one
          region overshoots in another. The effective learning rate at the first layer is not the
          global learning rate <M>{String.raw`\eta`}</M> but something closer to{" "}
          <M>{String.raw`\eta`}</M> times the product of all the Jacobian norms between the first
          layer and the loss:
        </p>

        <MathBlock>{String.raw`\eta_{\text{eff}}^{(1)} \;\approx\; \eta \;\prod_{i=2}^{D} \left\|\frac{\partial f_i}{\partial \mathbf{h}_{i-1}}\right\|`}</MathBlock>

        <p>
          Even when the gradient ratio is close to 1, the variance of this product across mini-batches
          increases with depth. The gradient at the first layer does not vanish on average, but it
          fluctuates more wildly from batch to batch, making each update noisier. The optimiser
          sees a signal-to-noise ratio that degrades with depth, and no amount of initialisation
          magic fixes this because it is a property of the product structure itself.
        </p>
        <p>
          The depth-20 result makes this concrete. The gradient ratio at depth 20 is 2.23 — well
          within the safe range. Yet the test accuracy is <strong>0.750</strong>, down from 0.953
          at depth 2. The gradient is arriving, but the optimiser cannot use it effectively. The
          loss landscape at depth 20 is rough enough that SGD with a reasonable learning rate cannot
          find a good minimum. This is not a gradient-magnitude problem; it is a landscape-geometry
          problem, and it is the hardest of the three taxes to fix.
        </p>

        <Proof color={CORAL} title="dead units compound with depth">
          <p>
            A ReLU unit that receives a negative input for every example in the batch has a
            derivative of exactly zero — it is{" "}
            <Link href="/learn/activation-functions/dying-relu" style={link}>dead</Link>. In a
            depth-1 network, a dead unit costs you one unit of capacity. In a depth-8 network, a
            dead unit in layer 3 makes every unit in layers 4 through 8 that depends on it
            partially dead as well, because part of their input is a constant zero.
          </p>
          <p>
            The probability that a unit is dead at initialisation depends on the input
            distribution and the initialisation scheme, but it is always positive for ReLU. As
            depth grows, the fraction of the network that is effectively dead can compound,
            especially at narrow widths where each dead unit removes a larger fraction of the
            layer&rsquo;s capacity. At width 4 and depth 8, this effect is catastrophic: the
            measured test accuracy is <strong>0.654</strong>, and the network has essentially
            stopped learning.
          </p>
        </Proof>

        <h2>The three taxes interact</h2>
        <p>
          The gradient tax, the parameter tax, and the optimisation tax are not independent. More
          parameters at the same amount of data mean more overfitting risk, which requires
          regularisation, which changes the effective gradient, which interacts with the gradient
          tax. A rougher loss surface means the optimiser needs a smaller learning rate, which
          means slower convergence, which means more epochs, which means more compute. Dead units
          reduce the effective width, which turns a &ldquo;wide enough&rdquo; layer into a
          bottleneck, which makes the information loss from the previous page worse.
        </p>
        <p>
          The result is a depth where the compounding costs overtake the compositional benefit.
          On moons at width 32, that crossover is at depth 2. On ImageNet with residual
          connections, the crossover is somewhere past depth 150 — but it exists there too. ResNet-
          1000 trains worse than ResNet-152, not because the architecture is incapable but because
          the optimisation tax at that depth exceeds the compositional benefit of the extra layers.
        </p>

        <Callout color={CORAL} title={<>The crossover is problem-dependent</>}>
          There is no universal optimal depth. The crossover point depends on the intrinsic
          dimensionality of the problem, the amount of hierarchical structure in the data, the width
          per layer, the initialisation scheme, the activation function, and whether skip connections
          are present. On moons the crossover is at depth 2. On CIFAR-10 it is around depth 20-40.
          On ImageNet it is around depth 100-150. On language modelling it is still climbing. The
          depth sweep tells you where your problem&rsquo;s crossover sits.
        </Callout>

        <h2>What this means in practice</h2>
        <p>
          When you consider adding a layer, you are not just adding capacity. You are adding a
          factor to the gradient product, <M>{String.raw`W^2 + W`}</M> parameters,{" "}
          <M>{String.raw`B \times W`}</M> bytes of activation memory, and a contribution to
          landscape roughness. If the problem has hierarchy that the extra layer can exploit, these
          costs are worth paying. If the problem does not — if the depth sweep shows no improvement
          or a decline — the costs are pure overhead.
        </p>
        <p>
          The next page shows the measured cases where these costs dominate: width too narrow for
          the depth, depth too great for the problem, and the specific failure modes each
          combination produces.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>The gradient ratio at depth 20 with He+ReLU is 2.23, which seems healthy. Yet
                test accuracy drops to 0.750. What explains this gap?</>,
              options: [
                "The gradient ratio is misleading — 2.23 is actually too large",
                "Gradient preservation is necessary but not sufficient; the loss landscape at depth 20 is rough enough that the optimiser cannot find a good minimum despite receiving the gradient signal",
                "The model is overfitting because it has too many parameters at depth 20",
              ],
              answer: 1,
              explain: <>A healthy gradient ratio means the signal arrives at the early layers. It does
                not mean the optimiser can use it effectively. At depth 20, the loss surface has
                exponentially more saddle points, the curvature varies more sharply, and the
                effective learning rate at the first layer fluctuates more across mini-batches. The
                gradient is there; the landscape is the problem.</>,
            },
            {
              q: <>Why does activation memory scale with depth during training, even though the
                parameter count of each layer is independent of the other layers?</>,
              options: [
                "Because deeper networks need larger batch sizes to converge",
                "Because the backward pass must store the intermediate activations at every layer to compute the chain-rule Jacobians",
                "Because the activation function's output grows with depth",
              ],
              answer: 1,
              explain: <>The chain rule requires the Jacobian{" "}
                <M>{String.raw`\partial f_i / \partial \mathbf{h}_{i-1}`}</M> at every layer,
                and computing that Jacobian requires the stored activation{" "}
                <M>{String.raw`\mathbf{h}_{i-1}`}</M>. So every layer adds one batch-sized tensor
                to the memory footprint during training, scaling total activation memory as{" "}
                <M>{String.raw`D \times B \times W`}</M>.</>,
            },
            {
              q: <>Sigmoid produces a gradient ratio of 2.9 &times; 10<sup>7</sup> at depth 12,
                while He-initialised ReLU produces 2.52 at depth 8. What accounts for this
                difference?</>,
              options: [
                "ReLU networks are always stable regardless of depth or initialisation",
                "Sigmoid's peak derivative is 0.25, which compounds to near-zero over 12 layers, creating an extreme ratio between the last and first layers; ReLU's derivative is exactly 1 for positive inputs, so He init keeps factors near 1",
                "Sigmoid is computed in lower precision than ReLU",
              ],
              answer: 1,
              explain: <>Sigmoid&rsquo;s maximum derivative is 0.25. Even at the peak, each layer
                multiplies the gradient by at most 0.25, and{" "}
                <M>{String.raw`0.25^{12} \approx 6 \times 10^{-8}`}</M>. ReLU&rsquo;s derivative
                is exactly 1 for positive inputs and 0 for negative, and He initialisation sets the
                weight variance so the expected factor per layer is 1. The difference is structural,
                not accidental.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/architecture-design/composition-and-hierarchy", label: <>&#8592; Composition and feature hierarchy</> }}
          next={{ href: "/learn/architecture-design/when-depth-hurts", label: <>Next up &middot; When depth hurts &#8594;</> }}
        />
      </div>
    </article>
  );
}
