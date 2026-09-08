import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Memory and compute budgets — Manifold",
  description:
    "Parameters are the fixed cost, activations the variable cost. Wide-shallow is heavy on weights; deep-narrow is heavy on stored activations. Knowing which budget binds tells you which direction to grow.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const th: React.CSSProperties = {
  textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500,
  borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)",
  fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
};

// From the backpropagation track, measured on a 784→128→64→10 network.
const MEM_ROWS: { batch: number; params: string; act: string }[] = [
  { batch: 32,   params: "3.16", act: "0.82"  },
  { batch: 64,   params: "3.16", act: "1.64"  },
  { batch: 128,  params: "3.16", act: "3.28"  },
  { batch: 256,  params: "3.16", act: "6.56"  },
  { batch: 512,  params: "3.16", act: "13.11" },
  { batch: 1024, params: "3.16", act: "26.22" },
];

export default function MemoryAndComputePage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Spending parameters", color: CORAL },
          { label: "Tier 2 · mechanics", color: CORAL },
        ]}
        time="about 9 minutes"
        title={<>Memory and compute budgets</>}
        intro={<>Test accuracy is the goal, but it is not the only constraint. Two networks with identical
          accuracy can differ by an order of magnitude in memory or compute cost, and at deployment scale
          that difference is the one that matters. This page separates the fixed costs from the variable
          costs and connects them to the depth-width tradeoff.</>}
      />

      <div className="lesson">
        <h2>Two kinds of memory</h2>
        <p>
          When a neural network is loaded onto a GPU, two separate allocations compete for the same pool of
          memory. They scale differently, and understanding which one is binding changes your architectural
          choices.
        </p>
        <p>
          <strong>Parameters</strong> are the weight matrices and bias vectors — the learned values that define
          the model. They are allocated once and their size is fixed regardless of batch size. A model
          with 3.16 MB of parameters uses 3.16 MB whether you feed it one sample or a thousand. Parameters
          are the <em>fixed cost</em>.
        </p>
        <p>
          <strong>Activations</strong> are the intermediate values computed at each layer during the forward
          pass. During training, backpropagation needs to <em>remember</em> the activation at every layer for
          every sample in the batch, because the chain rule multiplies the upstream gradient by the local
          Jacobian, which depends on the activation value. One sample produces one copy of each layer&rsquo;s
          activation; a batch of 1,024 produces 1,024 copies. Activations are the <em>variable cost</em>.
        </p>

        <h2>How they scale</h2>
        <p>
          The table below, measured on a 784 &rarr; 128 &rarr; 64 &rarr; 10 network from the{" "}
          <Link href="/learn/backpropagation/batch-size-and-noise" style={link}>backpropagation track</Link>,
          makes the split concrete.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 380 }}>
            <thead>
              <tr>
                <th style={th}>batch size</th>
                <th style={th}>params (MB)</th>
                <th style={th}>activations (MB)</th>
              </tr>
            </thead>
            <tbody>
              {MEM_ROWS.map((r) => (
                <tr key={r.batch}>
                  <td style={{ ...td, fontWeight: 500 }}>{r.batch.toLocaleString()}</td>
                  <td style={td}>{r.params}</td>
                  <td style={{
                    ...td,
                    color: parseFloat(r.act) > 10 ? "var(--bad)" : "var(--ink)",
                  }}>{r.act}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Measured, with the backpropagation track.
          Parameters in float32 (4 bytes each); activations include the stored values for all layers.
        </p>

        <p>
          Parameters: 3.16 MB at every batch size, a horizontal line. Activations: 0.82 MB at batch 32,
          growing linearly to 26.22 MB at batch 1,024 — a 32-fold increase. At small batch sizes, parameters
          dominate. At large batch sizes, activations dominate by a factor of eight. Which column binds
          depends on your training regime.
        </p>

        <MathBlock>{String.raw`\text{GPU memory} \;\approx\; \underbrace{\sum_\ell (n_{\ell-1} \cdot n_\ell + n_\ell)}_{\text{parameters (fixed)}} \;+\; \underbrace{B \cdot \sum_\ell n_\ell}_{\text{activations (} \propto B \text{)}}`}</MathBlock>

        <h2>Wide vs deep, through the memory lens</h2>
        <p>
          The depth-width tradeoff looks different depending on which budget is binding.
        </p>
        <p>
          <strong>Wide-shallow networks are heavy on parameters.</strong> A single hidden layer of width{" "}
          <M>{String.raw`w`}</M> with input dimension <M>{String.raw`d`}</M> requires a weight matrix of
          size <M>{String.raw`d \times w`}</M>. For width 333 and input 10, that is 3,330 parameters in one
          layer. The parameter count scales as <M>{String.raw`O(w^2)`}</M> per layer (when both fan-in and
          fan-out are proportional to <M>{String.raw`w`}</M>), so wide layers are expensive in fixed memory.
          But there is only one layer of activations, so the variable cost is low.
        </p>
        <p>
          <strong>Deep-narrow networks are heavy on activations.</strong> Eight layers of width 10 use far
          fewer parameters per layer (the weight matrices are small), but each layer stores its own activation
          tensor. During training, backpropagation caches all eight layers&rsquo; worth of activations for
          every sample in the batch. The per-sample activation memory scales as{" "}
          <M>{String.raw`O(L \cdot w)`}</M> — linear in depth.
        </p>

        <Callout color={CORAL} title={<>The binding constraint decides the direction</>}>
          If your GPU runs out of memory at large batch sizes, <strong>activations</strong> are the binding
          constraint. Reducing depth (fewer layers to store) helps more than reducing width. You want fewer
          wide layers.
          <br /><br />
          If your model is too large to deploy on an edge device or to serve at low latency, the{" "}
          <strong>parameter count</strong> is the binding constraint. Reducing width (smaller weight matrices)
          helps more than reducing depth. You want more narrow layers.
        </Callout>

        <h2>Compute: the FLOP budget</h2>
        <p>
          Memory is about what you <em>store</em>. Compute is about what you <em>do</em>. A single forward
          pass through a fully connected layer of shape <M>{String.raw`n_{\text{in}} \times n_{\text{out}}`}</M>{" "}
          costs roughly <M>{String.raw`B \cdot n_{\text{in}} \cdot n_{\text{out}}`}</M> multiply-add
          operations, where <M>{String.raw`B`}</M> is the batch size.
        </p>

        <MathBlock>{String.raw`\text{FLOPs}_{\text{forward}} \;=\; \sum_{\ell=1}^{L} B \cdot n_{\ell-1} \cdot n_\ell`}</MathBlock>

        <p>
          The backward pass is roughly twice the cost of the forward pass: once to compute the gradient with
          respect to the activations (for the upstream layers), and once to compute the gradient with respect
          to the weights (for the parameter update). So the total cost of one training step is approximately
          three times the forward cost.
        </p>

        <MathBlock>{String.raw`\text{FLOPs}_{\text{step}} \;\approx\; 3 \cdot \text{FLOPs}_{\text{forward}}`}</MathBlock>

        <p>
          For a given total parameter count, the FLOP cost is roughly the same whether those parameters are
          arranged in one wide layer or many narrow layers — the sum{" "}
          <M>{String.raw`\sum n_{\ell-1} n_\ell`}</M> depends on the total number of weight entries, which
          is the parameter count. So the compute budget, unlike the memory budget, does not strongly
          differentiate wide from deep. What it differentiates is <em>total size</em> from total size.
        </p>

        <h2>Gradient checkpointing: trading compute for memory</h2>
        <p>
          When activation memory is the binding constraint — typically in deep networks at large batch sizes —
          there is a well-known trick: do not store all the intermediate activations. Instead, store only a
          subset (the &ldquo;checkpoints&rdquo;), and recompute the others during the backward pass by running
          a partial forward pass from the nearest checkpoint.
        </p>
        <p>
          The trade is explicit: you save memory proportional to the number of activations you drop, and you
          pay compute proportional to the cost of recomputing them. In practice, checkpointing every other
          layer (the <M>{String.raw`\sqrt{L}`}</M> strategy) reduces activation memory by roughly half at
          a cost of about 18--35% more compute per step, depending on the network.
        </p>
        <p>
          This is a good trade when memory is the bottleneck and compute is available — which is the typical
          situation on modern GPUs with large-batch training. It is a bad trade when compute is the bottleneck,
          which is more common in latency-sensitive inference.
        </p>

        <Proof color={CORAL} title="the checkpoint-interval tradeoff">
          <p>
            If you checkpoint every <M>{String.raw`k`}</M>-th layer in a network of depth{" "}
            <M>{String.raw`L`}</M>, you store <M>{String.raw`L/k`}</M> activations instead of{" "}
            <M>{String.raw`L`}</M>, and recompute at most <M>{String.raw`k-1`}</M> activations per
            segment during the backward pass. The total recomputation is at most one additional forward
            pass through the entire network (when <M>{String.raw`k = L`}</M>, checkpoint only the input)
            or zero (when <M>{String.raw`k = 1`}</M>, checkpoint everything, which is the no-checkpointing
            baseline).
          </p>
          <p>
            The optimal <M>{String.raw`k`}</M> is <M>{String.raw`\sqrt{L}`}</M>, which gives{" "}
            <M>{String.raw`O(\sqrt{L})`}</M> stored activations and{" "}
            <M>{String.raw`O(\sqrt{L})`}</M> recomputation per segment — a sublinear memory cost
            at a sublinear compute premium. For a 16-layer network,{" "}
            <M>{String.raw`k = 4`}</M> stores 4 activations and recomputes at most 3 per segment;
            for a 100-layer network, <M>{String.raw`k = 10`}</M> stores 10 and recomputes at most 9.
          </p>
        </Proof>

        <h2>Inference vs training</h2>
        <p>
          Everything above applies to training, where the backward pass forces you to store activations.
          At inference time, you never run the backward pass, so activation memory is{" "}
          <strong>not cumulative</strong> — you can discard each layer&rsquo;s activation as soon as the next
          layer has consumed it. The inference memory cost is dominated by parameters (fixed) plus one layer
          of activations (the largest layer in the network).
        </p>

        <MathBlock>{String.raw`\text{inference memory} \;\approx\; \text{params} \;+\; B \cdot \max_\ell\, n_\ell`}</MathBlock>

        <p>
          This changes the tradeoff. During training, a deep network pays activation memory proportional to
          depth. During inference, it does not. So the memory penalty of depth is a training-only cost.
          If your concern is deployment memory (an edge device, a mobile phone), the parameter count is
          all that matters, and the activation cost is negligible.
        </p>

        <h2>The practical message</h2>
        <p>
          <strong>If you are GPU-memory limited during training</strong>, prefer fewer wide layers. You pay
          more in parameter memory but less in activation memory, and at large batch sizes the activation
          cost dominates. Fewer layers also means fewer layers to checkpoint if you need to go further.
        </p>
        <p>
          <strong>If you are parameter-budget limited at deployment</strong> (edge inference, mobile, serving
          cost), prefer more narrow layers. Each layer has a smaller weight matrix, and at inference time
          the activation cost does not accumulate. You get more representational depth per parameter, which
          matters when the parameter budget is the hard ceiling.
        </p>
        <p>
          <strong>If neither budget is binding</strong> — which is the common case for moderate-scale
          models on modern hardware — the memory and compute costs are secondary to the accuracy and
          generalisation considerations from the{" "}
          <Link href="/learn/architecture-design/wide-vs-deep" style={link}>previous pages</Link>, and
          you should choose based on the structure of your problem.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Parameters use 3.16 MB at batch 32 and 3.16 MB at batch 1,024. Activations use 0.82 MB
                at batch 32 and 26.22 MB at batch 1,024. What does this demonstrate?</>,
              options: [
                "Parameters are always the dominant memory cost",
                "Parameters are a fixed cost independent of batch size, while activations scale linearly with batch size and dominate at large batches",
                "The model should always use small batch sizes to save memory",
              ],
              answer: 1,
              explain: <>Parameters are stored once (the learned weights), while activations are stored
                once per sample in the batch (because backpropagation needs them all). At batch 1,024,
                activations are 8 times larger than parameters. The fixed-vs-variable distinction is the
                key to reasoning about which budget binds.</>,
            },
            {
              q: <>A practitioner is GPU-memory limited at batch 512. Should they make the network wider
                or deeper to reduce memory usage?</>,
              options: [
                "Wider — reducing depth removes activation layers, which is the dominant cost at large batch sizes",
                "Deeper — adding layers reduces the width needed, saving parameter memory",
                "Neither — memory is fixed regardless of architecture",
              ],
              answer: 0,
              explain: <>At batch 512, activations dominate. Each layer adds another activation tensor
                that must be stored for every sample in the batch. Reducing depth (fewer layers) directly
                reduces the number of activation tensors. Making the network wider uses more parameter
                memory, but that is the fixed cost and does not scale with batch size.</>,
            },
            {
              q: <>Why is the activation-memory penalty of depth a training-only cost?</>,
              options: [
                "Because inference uses a smaller batch size",
                "Because at inference there is no backward pass, so activations can be discarded layer by layer instead of stored for all layers simultaneously",
                "Because inference uses lower-precision arithmetic",
              ],
              answer: 1,
              explain: <>Backpropagation is the reason activations accumulate: the chain rule needs
                the activation at every layer to compute the gradient. At inference, there is no
                backward pass, so each layer's activation is consumed and discarded before the next
                layer runs. Only the current layer's activation is in memory at any time.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/architecture-design/width-schedules", label: <>&larr; Funnel, constant, or inverted?</> }}
          next={{ href: "/learn/architecture-design/the-gradient-problem", label: <>Next up &middot; The gradient problem, revisited &rarr;</> }}
        />
      </div>
    </article>
  );
}
