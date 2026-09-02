import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Why F(x) + x changes everything — Manifold",
  description:
    "Three views of the skip connection: gradient highway, residual learning, and implicit ensemble. Each explains a different aspect of why depth finally works.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhySkipWorksPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Skip connections", color: CORAL },
          { label: "Tier 2 · mechanics", color: CORAL },
        ]}
        time="about 8 minutes"
        title={<>Why F(x) + x changes everything</>}
        intro={
          <>
            The previous page defined the skip connection and showed that it works. This page asks{" "}
            <em>why</em> — three times, from three different angles, each revealing a different
            mechanism. Together they explain not just the empirical result but why the idea
            generalises far beyond image classification.
          </>
        }
      />

      <div className="lesson">
        <h2>View 1: the gradient highway</h2>
        <p>
          Start with the backward pass. In a plain layer <M>{String.raw`\mathbf{y} = F(\mathbf{x})`}</M>,
          the chain rule gives:
        </p>
        <MathBlock>{String.raw`\frac{\partial \mathcal{L}}{\partial \mathbf{x}} = \frac{\partial \mathcal{L}}{\partial \mathbf{y}} \cdot \frac{\partial F}{\partial \mathbf{x}}`}</MathBlock>
        <p>
          If <M>{String.raw`\partial F / \partial \mathbf{x}`}</M> is small — saturated activations,
          tiny weights, dead units — the gradient shrinks. Stack many such layers and the product
          vanishes.
        </p>
        <p>
          With a skip, <M>{String.raw`\mathbf{y} = F(\mathbf{x}) + \mathbf{x}`}</M>, the chain rule
          adds a term:
        </p>
        <MathBlock>{String.raw`\frac{\partial \mathcal{L}}{\partial \mathbf{x}} = \frac{\partial \mathcal{L}}{\partial \mathbf{y}} \cdot \biggl(\frac{\partial F}{\partial \mathbf{x}} + I\biggr)`}</MathBlock>
        <p>
          The identity matrix <M>{String.raw`I`}</M> is a constant. It does not depend on the
          weights, the activations, or the data. No matter how badly{" "}
          <M>{String.raw`F`}</M> behaves, the gradient through the skip path is{" "}
          <M>{String.raw`\partial \mathcal{L} / \partial \mathbf{y}`}</M> itself — the loss gradient
          at the output of the block, passed straight through to the input with no attenuation.
        </p>
        <p>
          In a network with skip connections at every block, this creates a <strong>gradient
          highway</strong>: a direct path from the loss all the way to the first layer, through
          nothing but identity connections. The gradient along this path has the same magnitude at
          layer 1 as it does at layer 150. No initialisation trick is needed to preserve it — it is
          preserved by construction.
        </p>

        <Callout color={CORAL} title={<>The highway is a floor, not a ceiling</>}>
          A common misconception is that skip connections force the gradient to take the identity
          path. They do not. The gradient through{" "}
          <M>{String.raw`\partial F / \partial \mathbf{x}`}</M> still flows and still contributes.
          The skip connection adds a <strong>lower bound</strong> on gradient magnitude — it can
          never be less than the identity component — but it does not prevent the learned path from
          contributing more. In practice, most of the gradient in a trained ResNet flows through the
          learned transformations; the identity path is a safety net that prevents catastrophic
          vanishing, not the main carrier of information.
        </Callout>

        <h2>View 2: learning the residual</h2>
        <p>
          Now look at the forward pass. If the target mapping at some block is{" "}
          <M>{String.raw`H(\mathbf{x})`}</M>, the block learns{" "}
          <M>{String.raw`F(\mathbf{x}) = H(\mathbf{x}) - \mathbf{x}`}</M>: the residual, the
          difference between the desired output and the input. This reframing has a non-obvious
          consequence for optimisation.
        </p>
        <p>
          Consider a block deep in the network where the optimal mapping is close to the identity —
          the block should pass its input through with a small adjustment. In a plain network, this
          block must learn weights <M>{String.raw`W`}</M> such that{" "}
          <M>{String.raw`W\mathbf{x} + \mathbf{b} \approx \mathbf{x}`}</M>. That means{" "}
          <M>{String.raw`W \approx I`}</M> and <M>{String.raw`\mathbf{b} \approx 0`}</M>, which is
          not where the weights start — they start near zero (He init) or at random.
        </p>
        <p>
          With a skip connection, the same block needs{" "}
          <M>{String.raw`F(\mathbf{x}) \approx 0`}</M>. Since the weights start near zero, this is
          where the block <em>already is</em> at initialisation. The block starts doing
          approximately the right thing, and training only needs to refine it. The optimisation
          problem is strictly easier.
        </p>

        <h2>View 3: the implicit ensemble</h2>
        <p>
          The third perspective, due to Veit, Wilber, and Belongie (2016), reveals a structural
          property that is not obvious from the equation. A residual network of depth{" "}
          <M>{String.raw`D`}</M> blocks is equivalent to an ensemble of{" "}
          <M>{String.raw`2^D`}</M> paths of different lengths.
        </p>
        <p>
          The argument is direct. Each block has two paths: through{" "}
          <M>{String.raw`F`}</M> and through the identity. At block 1, the signal can take{" "}
          <M>{String.raw`F_1`}</M> or skip. At block 2, independently,{" "}
          <M>{String.raw`F_2`}</M> or skip. There are{" "}
          <M>{String.raw`2^D`}</M> distinct combinations, each defining a path of a different{" "}
          <em>effective depth</em> — from zero (all skips) to <M>{String.raw`D`}</M> (all
          transformations).
        </p>

        <MathBlock>{String.raw`\text{output} = \sum_{S \subseteq \{1,\ldots,D\}} \;\prod_{k \in S} F_k(\cdot)`}</MathBlock>

        <p>
          Each term in this sum is one path through the network. A 10-block ResNet has 1024 paths; a
          20-block ResNet has over a million. The output is the sum of all their contributions.
        </p>
        <p>
          What Veit et al. showed empirically is that the contribution of each path is approximately
          proportional to its length — short paths (those that skip many blocks) dominate the output.
          Furthermore, deleting a single block from a trained ResNet has only a modest effect on
          accuracy, comparable to removing one model from an ensemble. Deleting a single layer from a
          plain network, by contrast, is catastrophic.
        </p>

        <Proof color={CORAL} title="counting the paths formally">
          <p>
            Let <M>{String.raw`\mathbf{x}_0`}</M> be the input. At each block{" "}
            <M>{String.raw`k`}</M>, the signal becomes{" "}
            <M>{String.raw`\mathbf{x}_k = F_k(\mathbf{x}_{k-1}) + \mathbf{x}_{k-1}`}</M>.
            Unrolling the recursion:
          </p>
          <MathBlock>{String.raw`\mathbf{x}_D = \mathbf{x}_0 + \sum_{k=1}^{D} F_k(\mathbf{x}_{k-1})`}</MathBlock>
          <p>
            This is exact, not an approximation. But the inner dependence — each{" "}
            <M>{String.raw`F_k`}</M> takes as input the sum of all preceding terms — makes the
            paths interact. The ensemble interpretation becomes clean when the interactions are weak,
            which is the case when each <M>{String.raw`F_k`}</M> contributes a small correction.
          </p>
          <p>
            To count independent paths, consider selecting a subset{" "}
            <M>{String.raw`S \subseteq \{1, \ldots, D\}`}</M> of blocks to &ldquo;activate&rdquo;
            (use <M>{String.raw`F_k`}</M>) and skip the rest. There are{" "}
            <M>{String.raw`\binom{D}{0} + \binom{D}{1} + \cdots + \binom{D}{D} = 2^D`}</M> such
            subsets. The binomial distribution peaks near <M>{String.raw`D/2`}</M>, so most paths
            have effective depth near half the network depth. This is why ResNets behave less like
            very deep networks and more like ensembles of moderately deep networks — and ensembles
            are known to be robust to the removal of individual members.
          </p>
        </Proof>

        <h2>Why all three views matter</h2>
        <p>
          Each view answers a different question. The gradient highway explains why training
          succeeds: the gradient cannot vanish. The residual learning view explains why training is{" "}
          <em>fast</em>: each block starts near the identity and only needs to learn a small
          correction. The ensemble view explains why the result is <em>robust</em>: removing a block
          loses one member of a large ensemble, not a critical link in a chain.
        </p>
        <p>
          Together, they explain why the skip connection generalises beyond its original context.
          Transformers use it — every attention block and feedforward block has a skip — because the
          same three properties are needed there: stable gradients across 96 layers (GPT-3), easy
          optimisation of each block, and robustness to the occasional block that learns nothing
          useful.
        </p>
        <p>
          The skip connection is not a trick. It is a structural principle: <strong>let the network
          add to the input rather than replacing it</strong>. That single change makes depth
          tractable.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: (
                <>
                  In the gradient highway view, what is the minimum gradient magnitude at any layer
                  in a residual network?
                </>
              ),
              options: [
                "Zero, same as a plain network",
                "The loss gradient at the output — it flows through the identity path with no attenuation",
                "One divided by the number of layers",
              ],
              answer: 1,
              explain: (
                <>
                  The identity term in{" "}
                  <M>{String.raw`\partial F / \partial \mathbf{x} + I`}</M> passes the output
                  gradient straight through. This sets a floor: the gradient at any layer is at
                  least as large as the gradient at the last layer, regardless of what the learned
                  transformations do.
                </>
              ),
            },
            {
              q: (
                <>
                  A 10-block residual network has how many distinct forward paths from input to
                  output?
                </>
              ),
              options: [
                "10 (one per block)",
                "20 (two per block)",
                "1024 (2 to the power of 10)",
              ],
              answer: 2,
              explain: (
                <>
                  Each block independently offers two choices (transform or skip), giving{" "}
                  <M>{String.raw`2^{10} = 1024`}</M> paths. Most of these paths have effective
                  depth near 5 (half the blocks), which is why ResNets behave like ensembles of
                  moderately deep networks.
                </>
              ),
            },
            {
              q: (
                <>
                  Why does the residual framing make optimisation easier when the optimal mapping at
                  a block is close to the identity?
                </>
              ),
              options: [
                "Because the identity mapping has the fewest parameters",
                "Because learning F(x) near zero aligns with He init and weight decay — the block starts there already",
                "Because the residual function is always linear",
              ],
              answer: 1,
              explain: (
                <>
                  With He init, weights start near zero, so{" "}
                  <M>{String.raw`F(\mathbf{x}) \approx 0`}</M> at initialisation — exactly where
                  it needs to be if the identity is optimal. In a plain network, the block would
                  need to learn <M>{String.raw`W \approx I`}</M>, which is far from its starting
                  point.
                </>
              ),
            },
          ]}
        />

        <PrevNext
          prev={{
            href: "/learn/architecture-design/skip-connections",
            label: <>&larr; Skip connections</>,
          }}
          next={{
            href: "/learn/architecture-design/residual-blocks",
            label: <>Next up &middot; Residual blocks in practice &rarr;</>,
          }}
        />
      </div>
    </article>
  );
}
