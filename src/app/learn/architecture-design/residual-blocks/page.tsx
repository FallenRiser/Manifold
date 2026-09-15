import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LayerTrace } from "@/components/figures/LayerTrace";
import { PredictPrompt } from "@/components/PredictPrompt";
import { RESIDUAL_STREAM } from "@/components/figures/arch/data";

export const metadata = {
  title: "Residual blocks in practice — Manifold",
  description:
    "The standard residual block, pre- vs post-activation ordering, bottleneck blocks, and how to handle dimension mismatches. The engineering that turns the skip idea into deployable architecture.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function ResidualBlocksPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Skip connections", color: CORAL },
          { label: "Tier 2 · mechanics", color: CORAL },
        ]}
        time="about 8 minutes"
        title={<>Residual blocks in practice</>}
        intro={
          <>
            The skip connection is one line of arithmetic. Turning it into a building block that
            works across architectures requires a few engineering decisions: how many layers per
            block, where to put the activation, what to do when dimensions change. This page covers
            each one, with the reasoning that drives the choice.
          </>
        }
      />

      <div className="lesson">
        <h2>The standard residual block</h2>
        <p>
          The most common residual block wraps <strong>two layers</strong> inside a single skip:
        </p>

        <MathBlock>{String.raw`\mathbf{y} = g\!\bigl(W_2\,g(W_1\,\mathbf{x} + \mathbf{b}_1) + \mathbf{b}_2\bigr) + \mathbf{x}`}</MathBlock>

        <p>
          where <M>{String.raw`g`}</M> is the activation (typically ReLU). The input{" "}
          <M>{String.raw`\mathbf{x}`}</M> passes through two linear maps and two activations, then
          the original <M>{String.raw`\mathbf{x}`}</M> is added back before the final output.
        </p>
        <p>
          Why two layers and not one? A single-layer block{" "}
          <M>{String.raw`g(W\mathbf{x} + \mathbf{b}) + \mathbf{x}`}</M> has the same representational
          power as a single layer without a skip — the skip just shifts the output. Two layers give
          the block an internal nonlinearity: the first layer can detect a feature, and the second
          can decide how much of it to add. This is the minimum structure that lets the block learn
          a nontrivial residual.
        </p>

        <PredictPrompt
          accent={CORAL}
          prompt={<>Twenty hidden layers of width 16 at He initialisation. Track the size of the
            activations as they pass from layer 1 to layer 20, three ways: a plain stack, a stack
            with skip connections, and a stack with skip connections and BatchNorm inside each
            block. What happens to the bare residual stack?</>}
          options={[
            "It holds steady — that is what the skip is for",
            "It decays, but more slowly than the plain stack",
            "It grows enormously — by four orders of magnitude",
            "It behaves identically to the BatchNorm version",
          ]}
          nudge="Locked in. All three are plotted below, on a log axis."
        />

        <LayerTrace
          series={RESIDUAL_STREAM}
          ylabel="activation std"
          caption={<>This is why the normalisation layer inside the block is not an optional extra.
            The plain stack <strong>decays</strong>, 0.513 down to 0.060 — the failure a skip
            connection is introduced to fix. But the bare residual stack{" "}
            <strong>explodes</strong>: 0.513 to 4,742, a factor of <strong>9,246</strong>, because
            replacing multiplication with addition means every block&rsquo;s output is added to a
            stream that already contains every previous block&rsquo;s output, and variances add.
            Only the third line is bounded, ending at 4.15. A skip connection and a normalisation
            layer are not two independent good ideas that happen to appear together; the second is
            what makes the first survivable.</>}
        />

        <h2>Where to put the activation</h2>
        <p>
          The equation above applies the activation <em>after</em> the addition — this is{" "}
          <strong>post-activation</strong>, and it is what the original ResNet paper used. A
          follow-up paper (He et al., 2016, &ldquo;Identity Mappings in Deep Residual
          Networks&rdquo;) proposed <strong>pre-activation</strong>: apply batch normalisation and
          ReLU <em>before</em> each weight matrix, so the skip path carries the raw, unactivated
          signal.
        </p>

        <MathBlock>{String.raw`\text{post:}\quad \mathbf{y} = g(F(\mathbf{x}) + \mathbf{x}) \qquad\text{pre:}\quad \mathbf{y} = F(g(\mathbf{x})) + \mathbf{x}`}</MathBlock>

        <p>
          The difference seems cosmetic but has measurable consequences. In the post-activation
          design, the skip path carries{" "}
          <M>{String.raw`\mathbf{x}`}</M> through a ReLU, which can zero out negative components —
          the skip is no longer a clean identity. In the pre-activation design, the skip path
          is truly the identity: no activation, no normalisation, just a wire. The gradient through
          the skip is exactly <M>{String.raw`I`}</M>, not{" "}
          <M>{String.raw`\text{diag}(g')`}</M>.
        </p>

        <Callout color={CORAL} title={<>Pre-activation is the cleaner design</>}>
          He et al. (2016) showed that pre-activation ResNets train more easily at extreme depth
          (1001 layers) and produce lower test error than post-activation at matched depth. The
          reason maps directly to the gradient highway: a truly clean identity skip preserves
          gradient magnitude with no dependence on the activation function. Post-activation
          introduces a data-dependent attenuation through <M>{String.raw`g'`}</M> that, while small
          per block, compounds over hundreds of blocks.
          <br /><br />
          In practice, both work well for networks up to about 100 layers. Beyond that, or in
          architectures where gradient health is critical (transformers), pre-activation (or its
          equivalent — LayerNorm before attention) is standard.
        </Callout>

        <h2>Bottleneck blocks</h2>
        <p>
          For high-dimensional inputs (particularly in convolutional networks with 256 or more
          channels), a two-layer block is expensive. The bottleneck block reduces computation by
          using three layers in a 1-3-1 pattern:
        </p>

        <MathBlock>{String.raw`\mathbf{x} \xrightarrow{1\times1,\;d/4} \mathbf{h}_1 \xrightarrow{3\times3,\;d/4} \mathbf{h}_2 \xrightarrow{1\times1,\;d} \mathbf{y}' \xrightarrow{+\mathbf{x}} \mathbf{y}`}</MathBlock>

        <p>
          The first <M>{String.raw`1 \times 1`}</M> convolution reduces the channel dimension by a
          factor of 4 (from <M>{String.raw`d`}</M> to <M>{String.raw`d/4`}</M>). The{" "}
          <M>{String.raw`3 \times 3`}</M> convolution does the expensive spatial processing in this
          reduced dimension. The second <M>{String.raw`1 \times 1`}</M> expands back to{" "}
          <M>{String.raw`d`}</M> so the skip addition works.
        </p>
        <p>
          The savings are substantial. For <M>{String.raw`d = 256`}</M>, a plain two-layer block
          with <M>{String.raw`3 \times 3`}</M> convolutions uses{" "}
          <M>{String.raw`2 \times 256^2 \times 9 = 1{,}179{,}648`}</M> parameters. The bottleneck
          block uses roughly{" "}
          <M>{String.raw`256 \times 64 + 64^2 \times 9 + 64 \times 256 = 69{,}632`}</M> — about 17
          times fewer. This is why ResNet-50 (bottleneck) has fewer parameters than ResNet-34 (plain
          blocks) despite being deeper.
        </p>

        <h2>Handling dimension mismatches</h2>
        <p>
          The skip connection <M>{String.raw`\mathbf{y} = F(\mathbf{x}) + \mathbf{x}`}</M> requires
          that <M>{String.raw`F(\mathbf{x})`}</M> and{" "}
          <M>{String.raw`\mathbf{x}`}</M> have the same dimensions. When the block changes the
          number of channels or the spatial resolution (downsampling), the raw skip fails. Two
          standard fixes:
        </p>
        <p>
          <strong>Projection shortcut.</strong> Apply a learned{" "}
          <M>{String.raw`1 \times 1`}</M> convolution (or linear map, for dense layers) to{" "}
          <M>{String.raw`\mathbf{x}`}</M> to match the output dimension:{" "}
          <M>{String.raw`\mathbf{y} = F(\mathbf{x}) + W_s\mathbf{x}`}</M>. This adds a small
          number of parameters but keeps the skip fully learned.
        </p>
        <p>
          <strong>Zero-padding shortcut.</strong> Pad{" "}
          <M>{String.raw`\mathbf{x}`}</M> with zeros to match the larger channel dimension. This
          adds no parameters and preserves the identity property exactly for the channels that
          exist, but the new channels start at zero and must be learned from scratch.
        </p>
        <p>
          The original ResNet paper compared both and found the projection shortcut marginally better
          on ImageNet, but the zero-padding variant is simpler and used when parameter budget is
          tight.
        </p>

        <Proof color={CORAL} title="parameter cost of a projection shortcut">
          <p>
            A projection shortcut from dimension <M>{String.raw`d_{\text{in}}`}</M> to{" "}
            <M>{String.raw`d_{\text{out}}`}</M> is a single matrix{" "}
            <M>{String.raw`W_s \in \mathbb{R}^{d_{\text{out}} \times d_{\text{in}}}`}</M>, adding{" "}
            <M>{String.raw`d_{\text{in}} \times d_{\text{out}}`}</M> parameters. For a typical
            dimension-doubling block (128 to 256), that is 32,768 parameters — significant but small
            compared to the block itself.
          </p>
          <p>
            In the convolutional case with spatial downsampling, the projection uses a{" "}
            <M>{String.raw`1 \times 1`}</M> convolution with stride 2, which simultaneously halves
            the spatial resolution and changes the channel count. The parameter count is the same:{" "}
            <M>{String.raw`d_{\text{in}} \times d_{\text{out}}`}</M>, because the{" "}
            <M>{String.raw`1 \times 1`}</M> kernel has one spatial element per channel pair.
          </p>
          <p>
            The important point is that projection shortcuts are used <em>only</em> at dimension
            changes, which happen a few times in a network (typically 3-4 in a ResNet). Every other
            block uses the free identity shortcut. The total parameter overhead of projection
            shortcuts is typically under 5% of the network.
          </p>
        </Proof>

        <Callout color={CORAL} title={<>The measured consequence</>}>
          Under plain SGD, a width-16 network with bare skip connections and no normalisation scores{" "}
          <strong>0.4700</strong> from depth 12 onward — below the 0.5300 majority class, which is to
          say it has diverged and is predicting one class for everything. The same network with
          BatchNorm inside each block scores 0.9483 at depth 12 and <strong>0.9467</strong> at depth
          40. The plain network, with no skips at all, sits between them: fine to depth 20, then
          0.7500 by depth 40.
          <br /><br />
          The ordering is worth stating plainly because it is the opposite of the way the idea is
          usually introduced. On this problem, adding a skip connection on its own is not a small
          improvement over a plain network — it is far <em>worse</em> than doing nothing.
        </Callout>

        <h2>When to add skip connections</h2>
        <p>
          The practical advice is straightforward: <strong>add skip connections when going beyond 4-5
          layers.</strong> At 2-3 layers, the gradient path is short enough that vanilla
          feedforward training works reliably with proper initialisation. At 4-5 layers, you are in
          the zone where things might work without skips but will reliably work with them. Beyond
          that, skip connections are not optional — they are infrastructure.
        </p>
        <p>
          The cost of adding them is effectively zero. A skip connection is an addition operation — one
          vector add per block in the forward pass and one in the backward pass. It adds no learnable
          parameters (unless you need a projection shortcut for dimension changes), uses negligible
          memory (you already have <M>{String.raw`\mathbf{x}`}</M> in memory for backprop), and
          negligible compute. There is no reason not to use them whenever depth exceeds the trivial
          range.
        </p>
        <p>
          For fully connected networks (the focus of this track), the implementation is a single line
          of code. If your layer input and output have the same width:{" "}
          <code>y = F(x) + x</code>. If they differ, add a linear projection on the skip:{" "}
          <code>y = F(x) + proj(x)</code>. That is the entire engineering.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: (
                <>
                  Why does a residual block wrap <em>two</em> layers in a skip rather than one?
                </>
              ),
              options: [
                "Two layers are needed so the block can compute a nonlinear residual — one layer with a skip is equivalent to a linear shift",
                "Two layers double the parameter count, which always improves accuracy",
                "The skip connection only works with an even number of layers",
              ],
              answer: 0,
              explain: (
                <>
                  A single-layer block <M>{String.raw`g(W\mathbf{x}) + \mathbf{x}`}</M> has the
                  same expressive power as a single layer without a skip — the skip just adds a bias
                  term. Two layers give the block an internal nonlinearity, which lets it learn a
                  nontrivial correction.
                </>
              ),
            },
            {
              q: (
                <>
                  What is the key advantage of pre-activation over post-activation residual blocks?
                </>
              ),
              options: [
                "Pre-activation uses fewer parameters",
                "Pre-activation keeps the skip path as a clean identity with no activation, so the gradient is exactly I",
                "Pre-activation allows the block to use different activations on each layer",
              ],
              answer: 1,
              explain: (
                <>
                  In post-activation, the skip path passes through a ReLU, which can zero out
                  components and introduces a data-dependent factor in the gradient. Pre-activation
                  moves all nonlinearities inside the block, leaving the skip as a pure identity
                  wire.
                </>
              ),
            },
            {
              q: (
                <>
                  A bottleneck block with <M>{String.raw`d = 256`}</M> channels uses roughly 17
                  times fewer parameters than a plain two-layer block. How does it achieve this?
                </>
              ),
              options: [
                "By using smaller convolution kernels throughout",
                "By reducing the channel dimension by 4x with a 1x1 conv, doing the expensive 3x3 conv in the reduced space, then expanding back",
                "By sharing weights between the two layers",
              ],
              answer: 1,
              explain: (
                <>
                  The 1-3-1 pattern concentrates the expensive{" "}
                  <M>{String.raw`3 \times 3`}</M> convolution in a space that is 4 times smaller,
                  then uses cheap <M>{String.raw`1 \times 1`}</M> convolutions to change
                  dimensionality. The spatial processing cost drops by roughly{" "}
                  <M>{String.raw`4^2 = 16`}</M> times.
                </>
              ),
            },
          ]}
        />

        <PrevNext
          prev={{
            href: "/learn/architecture-design/why-skip-works",
            label: <>&larr; Why F(x) + x changes everything</>,
          }}
          next={{
            href: "/learn/architecture-design/reading-the-curve",
            label: <>Next up &middot; Reading the learning curve &rarr;</>,
          }}
        />
      </div>
    </article>
  );
}
