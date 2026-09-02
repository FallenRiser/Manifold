import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Skip connections — Manifold",
  description:
    "y = F(x) + x. The identity shortcut that broke the depth barrier. One line of arithmetic, and suddenly 100-layer networks train to state of the art.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function SkipConnectionsPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Skip connections", color: CORAL },
          { label: "Tier 2 · mechanics", color: CORAL },
        ]}
        time="about 8 minutes"
        title={<>Skip connections</>}
        intro={
          <>
            The previous page established that depth fails even when gradient magnitudes are
            controlled. This page introduces the idea that fixed it: instead of forcing every layer
            to simultaneously transform and preserve, give the information a second path that
            bypasses the transformation entirely.
          </>
        }
      />

      <div className="lesson">
        <h2>The identity shortcut</h2>
        <p>
          A standard feedforward layer computes:
        </p>
        <MathBlock>{String.raw`\mathbf{y} = F(\mathbf{x})`}</MathBlock>
        <p>
          where <M>{String.raw`F`}</M> is whatever the layer does — a linear map followed by an
          activation, typically. The input <M>{String.raw`\mathbf{x}`}</M> enters, gets transformed,
          and the original is gone. Everything downstream sees only{" "}
          <M>{String.raw`F(\mathbf{x})`}</M>.
        </p>
        <p>
          A skip connection adds one term:
        </p>
        <MathBlock>{String.raw`\mathbf{y} = F(\mathbf{x}) + \mathbf{x}`}</MathBlock>
        <p>
          The output is the sum of the transformation and the original input, passed through
          unchanged. That is the entire idea. There is no learned parameter in the skip path, no
          gate, no attention mechanism. It is a wire from the input of a block to the output of that
          block, carrying the identity function.
        </p>

        <h2>What happens when F learns nothing</h2>
        <p>
          Suppose <M>{String.raw`F`}</M> has been initialised but has not learned anything useful yet
          — its weights are small random numbers, and its output is close to zero. In a standard
          network, <M>{String.raw`\mathbf{y} \approx \mathbf{0}`}</M>: the layer has destroyed the
          input. Every layer downstream must now work with noise instead of signal.
        </p>
        <p>
          With a skip connection, <M>{String.raw`\mathbf{y} \approx \mathbf{0} + \mathbf{x} = \mathbf{x}`}</M>.
          The input passes through intact. The layer is effectively transparent until it learns
          something worth adding. This is a qualitative change in what it means to initialise a deep
          network: adding a layer can no longer make things worse, because the worst a layer can do
          is contribute nothing, and the skip path ensures the signal survives.
        </p>

        <Callout color={CORAL} title={<>The gradient side of the same coin</>}>
          During backpropagation, the gradient with respect to{" "}
          <M>{String.raw`\mathbf{x}`}</M> is:
          <MathBlock>{String.raw`\frac{\partial \mathbf{y}}{\partial \mathbf{x}} = \frac{\partial F}{\partial \mathbf{x}} + I`}</MathBlock>
          The identity matrix <M>{String.raw`I`}</M> is always there. Even if{" "}
          <M>{String.raw`\partial F / \partial \mathbf{x}`}</M> vanishes — saturated activations,
          dead units, tiny weights — the gradient through the skip path is <strong>exactly 1</strong>{" "}
          in every component. This is the gradient highway: a path of constant slope that no amount
          of depth can attenuate.
        </Callout>

        <h2>The ResNet result</h2>
        <p>
          In 2015, Kaiming He and colleagues published &ldquo;Deep Residual Learning for Image
          Recognition.&rdquo; The paper trained networks of 152 layers — an order of magnitude deeper
          than anything that had worked before — to state-of-the-art accuracy on ImageNet. The core
          mechanism was the skip connection described above, applied between every pair of layers.
        </p>
        <p>
          The result was not a marginal improvement. Prior to ResNet, the best ImageNet networks were
          around 20 layers deep (VGGNet at 19, GoogLeNet at 22). Beyond that depth, training
          accuracy <em>decreased</em> — not test accuracy from overfitting, but{" "}
          <em>training</em> accuracy, meaning the deeper network was failing to learn even the
          training data. The skip connection eliminated this degradation entirely: a 152-layer ResNet
          trained to lower error than a 20-layer plain network.
        </p>
        <p>
          That result changed the field. Every major architecture since — transformers (2017), U-Nets
          for segmentation, diffusion models for generation — uses skip connections as foundational
          infrastructure, not an optional add-on.
        </p>

        <h2>The residual framing</h2>
        <p>
          The name &ldquo;residual&rdquo; comes from rewriting the equation. If the desired output
          mapping is <M>{String.raw`H(\mathbf{x})`}</M>, then:
        </p>
        <MathBlock>{String.raw`H(\mathbf{x}) = F(\mathbf{x}) + \mathbf{x} \quad\Longrightarrow\quad F(\mathbf{x}) = H(\mathbf{x}) - \mathbf{x}`}</MathBlock>
        <p>
          The network does not learn the full mapping <M>{String.raw`H`}</M>. It learns the{" "}
          <strong>residual</strong> <M>{String.raw`F = H - \mathrm{id}`}</M> — the difference
          between the desired output and the input. This is why the architecture is called a residual
          network: each block learns a correction, not a complete representation.
        </p>
        <p>
          The distinction matters because many layers in a deep network need to do very little. If
          the optimal mapping at some layer is close to the identity — pass the input through with a
          minor adjustment — then the residual{" "}
          <M>{String.raw`F(\mathbf{x})`}</M> is close to zero. Learning &ldquo;do almost
          nothing&rdquo; is easier than learning &ldquo;reproduce the input exactly,&rdquo; because
          driving weights toward zero is what regularisation already encourages.
        </p>

        <Proof color={CORAL} title="the gradient product with skip connections">
          <p>
            In a plain network of <M>{String.raw`L`}</M> layers, the gradient at layer{" "}
            <M>{String.raw`l`}</M> is the product of Jacobians:
          </p>
          <MathBlock>{String.raw`\frac{\partial \mathcal{L}}{\partial \mathbf{h}^{(l)}} = \frac{\partial \mathcal{L}}{\partial \mathbf{h}^{(L)}} \prod_{k=l+1}^{L} J_k`}</MathBlock>
          <p>
            Each <M>{String.raw`J_k`}</M> is the Jacobian of layer <M>{String.raw`k`}</M>. If any
            single <M>{String.raw`J_k`}</M> has small singular values, the product shrinks
            exponentially.
          </p>
          <p>
            With a skip connection at every layer, each Jacobian becomes{" "}
            <M>{String.raw`J_k = \frac{\partial F_k}{\partial \mathbf{h}} + I`}</M>. The product
            expands into a sum over subsets:
          </p>
          <MathBlock>{String.raw`\prod_{k=l+1}^{L} (J_k^F + I) = \sum_{S \subseteq \{l+1, \ldots, L\}} \prod_{k \in S} J_k^F`}</MathBlock>
          <p>
            The term where <M>{String.raw`S = \emptyset`}</M> is the identity — gradient that flows
            through <em>all</em> skip paths and hits no transformation. This term alone guarantees
            that the gradient at layer <M>{String.raw`l`}</M> has a component of magnitude at least
            equal to the loss gradient at the output. Every other term is a bonus: gradient that also
            flowed through some of the learned transformations. No product of vanishing factors can
            kill the signal, because the shortest path bypasses all of them.
          </p>
        </Proof>

        <h2>Why this is not cheating</h2>
        <p>
          A reasonable objection: if the network can just pass the input through, why have the layer
          at all? The answer is that the skip connection does not prevent the layer from learning —
          it prevents the layer from <em>having</em> to learn the identity as a prerequisite. In a
          plain network, a layer that should do nothing must learn weights that reproduce the input
          exactly, which is a nontrivial optimisation problem in itself. With a skip, that layer
          starts at the identity for free, and any learning it does is additive: a correction on top
          of what is already there.
        </p>
        <p>
          This is why deeper residual networks do not merely match shallower ones — they beat them.
          The additional layers are not wasted; they contribute small refinements that add up. But
          critically, a layer that cannot find a useful refinement does no damage, because it
          defaults to passing the input through. The network can be as deep as you like without the
          risk that an unhelpful layer corrupts the signal.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: (
                <>
                  In the equation <M>{String.raw`\mathbf{y} = F(\mathbf{x}) + \mathbf{x}`}</M>,
                  what happens to the output if <M>{String.raw`F`}</M> has not yet learned anything
                  useful and its output is near zero?
                </>
              ),
              options: [
                "The output is also near zero, destroying the signal",
                "The output is approximately the input, preserving the signal through the skip path",
                "The network raises an error because F must contribute something",
              ],
              answer: 1,
              explain: (
                <>
                  When <M>{String.raw`F(\mathbf{x}) \approx 0`}</M>, the skip connection
                  ensures <M>{String.raw`\mathbf{y} \approx \mathbf{x}`}</M>. The layer is
                  transparent until it learns a useful correction, which is the key reason adding
                  layers can no longer make things worse.
                </>
              ),
            },
            {
              q: (
                <>
                  Why is learning the residual{" "}
                  <M>{String.raw`F(\mathbf{x}) = H(\mathbf{x}) - \mathbf{x}`}</M> easier than
                  learning <M>{String.raw`H(\mathbf{x})`}</M> directly?
                </>
              ),
              options: [
                "Because F has fewer parameters than H",
                "Because when the optimal mapping is close to identity, F is close to zero, and learning near-zero outputs is easy",
                "Because the residual is always a linear function",
              ],
              answer: 1,
              explain: (
                <>
                  The parameter count is identical — it is the same weights computing{" "}
                  <M>{String.raw`F`}</M>. The advantage is the optimisation landscape: learning
                  &ldquo;output approximately zero&rdquo; aligns with weight decay and small
                  initialisation, whereas learning &ldquo;reproduce the input exactly&rdquo; is a
                  nontrivial optimisation target.
                </>
              ),
            },
            {
              q: (
                <>
                  Which component of the gradient is guaranteed to survive in a residual network,
                  regardless of how many layers have vanishing Jacobians?
                </>
              ),
              options: [
                "The component that flows through the learned transformations F",
                "The component that flows through all skip paths, which equals the identity and cannot be attenuated",
                "The component computed by batch normalisation",
              ],
              answer: 1,
              explain: (
                <>
                  In the product expansion, the term where every layer uses the skip path (the empty
                  subset) contributes the identity. This term is independent of every{" "}
                  <M>{String.raw`J_k^F`}</M>, so no amount of vanishing in the learned
                  transformations can kill it.
                </>
              ),
            },
          ]}
        />

        <PrevNext
          prev={{
            href: "/learn/architecture-design/the-gradient-problem",
            label: <>&larr; The gradient problem, revisited</>,
          }}
          next={{
            href: "/learn/architecture-design/why-skip-works",
            label: <>Next up &middot; Why F(x) + x changes everything &rarr;</>,
          }}
        />
      </div>
    </article>
  );
}
