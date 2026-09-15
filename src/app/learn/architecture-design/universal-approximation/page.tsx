import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { NetworkDiagram, NetworkPair } from "@/components/figures/arch/NetworkDiagram";

export const metadata = {
  title: "Universal approximation, honestly — Manifold",
  description:
    "The most famous theorem about neural networks says less than people think. Here is the exact statement, the exact proof idea, and the four things it conspicuously does not promise.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function UniversalApproximationPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Width", color: CORAL }, { label: "Tier 2 · theory", color: CORAL }]}
        time="about 9 minutes"
        title={<>Universal approximation, honestly</>}
        intro={<>Every introduction to neural networks mentions this theorem, and almost every
          introduction gets more from it than is actually there. Here it is stated precisely,
          with the proof sketch that makes the limits obvious, and the four gaps that separate
          the theorem from practice.</>}
      />

      <div className="lesson">
        <h2>The precise statement</h2>
        <p>
          Let <M>{String.raw`g`}</M> be any continuous, non-polynomial activation function. Let{" "}
          <M>{String.raw`f`}</M> be any continuous function on a compact (closed and bounded) subset{" "}
          <M>{String.raw`K \subset \mathbb{R}^d`}</M>. Then for every{" "}
          <M>{String.raw`\varepsilon > 0`}</M>, there exists a width <M>{String.raw`m`}</M> and
          parameters <M>{String.raw`\{v_j, \mathbf{w}_j, b_j\}`}</M> such that:
        </p>

        <MathBlock>{String.raw`\sup_{\mathbf{x} \in K}\;\left|\; f(\mathbf{x}) \;-\; \sum_{j=1}^{m} v_j \, g\!\bigl(\mathbf{w}_j \cdot \mathbf{x} + b_j\bigr) \;\right| \;<\; \varepsilon`}</MathBlock>

        <p>
          In words: a single hidden layer with finitely many units can approximate any continuous
          function on a bounded domain to any desired precision. This is a statement about the{" "}
          <em>expressiveness</em> of the model class. It says the set of one-hidden-layer networks is
          dense in the space of continuous functions under the supremum norm. Nothing more.
        </p>

        <h2>The proof idea, which reveals the cost</h2>
        <p>
          The classical proof (Cybenko 1989, extended by Hornik 1991 and sharpened by Leshno et al.
          1993) is constructive in its simplest form. A sigmoid with a large weight behaves like a
          step function. Two steps, offset horizontally and subtracted, produce a bump: a function
          that is approximately 1 on an interval and approximately 0 elsewhere. The width and height
          of the bump are controlled by the weights.
        </p>
        <p>
          Now tile the domain with bumps, each scaled to the height of{" "}
          <M>{String.raw`f`}</M> at that location. This produces a staircase approximation. Making the
          steps narrower makes the approximation better, and the error can be driven below any
          positive <M>{String.raw`\varepsilon`}</M> by making the steps fine enough.
        </p>
        <p>
          Each bump requires two hidden units — one for the rising edge, one for the falling edge. In
          one dimension, approximating to resolution <M>{String.raw`\delta`}</M> requires on the
          order of <M>{String.raw`1/\delta`}</M> bumps. In <M>{String.raw`d`}</M> dimensions the
          bumps become hypercubes and the count scales as:
        </p>

        <MathBlock>{String.raw`m \;\sim\; \left(\frac{1}{\delta}\right)^{\!d}`}</MathBlock>

        <p>
          This is the curse of dimensionality appearing inside the proof itself. In 10 dimensions
          with a modest resolution of <M>{String.raw`\delta = 0.1`}</M>, the construction needs on
          the order of <M>{String.raw`10^{10}`}</M> hidden units — ten billion — just to tile the
          space. The theorem says the width exists. The proof shows that the width can be
          astronomically large, and that it grows exponentially with the input dimension.
        </p>

        <h2>What the theorem does say</h2>
        <p>
          It says that the failure modes of neural networks are never about{" "}
          <strong>expressiveness</strong>. If your one-hidden-layer network with 64 units is
          performing badly, the theorem guarantees that some one-hidden-layer network — perhaps with
          64 million units — could match the true function to any precision you like. The model class
          is not the constraint.
        </p>
        <p>
          This is genuinely useful as a diagnostic elimination. When a network underperforms, you can
          cross &ldquo;the architecture cannot represent the answer&rdquo; off the list and focus on
          the things that actually fail in practice: optimisation, data, and generalisation. That
          narrowing is the theorem&rsquo;s real contribution to applied work.
        </p>

        <NetworkPair
          left={{ sizes: [2, 512, 1], title: "What the theorem guarantees", note: "one hidden layer, made as wide as it needs to be" }}
          right={{ sizes: [2, 16, 16, 1], title: "What you would actually build", note: "two modest layers" }}
          caption={<>The theorem is a statement about the left-hand picture: make that middle column
            tall enough and it can approximate any continuous function on a compact set. It says
            nothing about how tall, nothing about whether gradient descent will find the weights, and
            nothing about how many examples you would need. On this problem the left-hand network has
            264,705 parameters and scores 0.942; the right-hand one has 337 and scores 0.951.
            Existence and reachability are different claims.</>}
        />

        <h2>What it does not say</h2>
        <p>
          The theorem has four gaps between its statement and any practical conclusion, and each gap
          is load-bearing.
        </p>

        <h3>1. It does not say how many units</h3>
        <p>
          The statement says &ldquo;there exists a width <M>{String.raw`m`}</M>.&rdquo; It provides
          no upper bound on <M>{String.raw`m`}</M>. The constructive proof suggests{" "}
          <M>{String.raw`m`}</M> can be exponential in the input dimension, and there are known
          functions where this is tight — no polynomial-width single layer suffices. The theorem
          guarantees existence, not feasibility.
        </p>
        <p>
          On the two-moons problem, width 16 at depth 2 is already enough for test accuracy 0.946.
          But two-moons is two-dimensional with a smooth boundary. A 784-dimensional problem like
          MNIST or a 3072-dimensional problem like CIFAR-10 is a different matter entirely, and the
          width required for a single hidden layer to match what a deep network achieves can be
          absurdly large.
        </p>

        <h3>2. It does not say gradient descent can find the weights</h3>
        <p>
          The theorem is about the existence of a set of parameters. It says nothing about whether
          any optimisation algorithm — gradient descent, Adam, or anything else — can find those
          parameters starting from a random initialisation. The loss landscape of a neural network is
          non-convex, and there is no guarantee that training converges to the global minimum, or even
          to a good local one.
        </p>
        <p>
          This gap is not hypothetical. On the XOR problem — the simplest non-linear classification
          task — a two-unit, single-hidden-layer network is provably sufficient: the theorem applies,
          and you can write down the exact weights. But training from random initialisation with
          gradient descent succeeds only about half the time. The architecture can represent the
          answer, but the optimiser cannot reliably find it. Universal approximation guaranteed the
          first property and said nothing about the second.
        </p>

        <h3>3. It does not say you have enough data</h3>
        <p>
          Approximating <M>{String.raw`f`}</M> to precision <M>{String.raw`\varepsilon`}</M>{" "}
          assumes you know <M>{String.raw`f`}</M>. In practice you have <M>{String.raw`n`}</M> noisy
          samples, and the network must learn <M>{String.raw`f`}</M> from those samples. A network
          wide enough to approximate any continuous function is also wide enough to memorise your
          training data perfectly — including its noise. The theorem says nothing about how many
          samples you need, and a wide-enough network can achieve zero training loss on random labels,
          which is the definition of not generalising.
        </p>

        <Callout color={CORAL} title={<>Expressiveness can work against you</>}>
          The same capacity that lets the network approximate the true function also lets it
          approximate the noise in your training set. A model class that can represent{" "}
          <em>everything</em> can represent every wrong answer just as easily as the right one. The
          theorem guarantees that the right answer is in the hypothesis class. It does not guarantee
          that your training procedure, given finite data, will pick the right answer over all the
          wrong ones. That is a generalisation question, and the theorem is silent on it.
        </Callout>

        <h3>4. It does not say one layer is efficient</h3>
        <p>
          This is the gap that matters most for architecture design, and the one people most
          consistently miss. The theorem is stated for a single hidden layer and is often read as
          saying depth is unnecessary. It says nothing of the kind.
        </p>
        <p>
          What it says is that depth is not necessary for <em>expressiveness</em> — one layer suffices
          to represent anything. But there are functions that a single hidden layer can represent only
          with exponentially many units, while a deep network represents them with polynomially many.
          The canonical examples are functions with hierarchical or compositional structure: an image
          classifier that detects edges, composes them into textures, composes textures into parts,
          and composes parts into objects. A single layer must learn each composition pattern
          independently; a deep network shares substructure across layers.
        </p>
        <p>
          The measured numbers make this concrete. On the two-moons task, depth 1 at width 64 gives
          test accuracy 0.919. Depth 2 at width 16 gives 0.946 — better accuracy with 337 parameters
          instead of the roughly 4,000 the width-64 single layer needs. Depth bought the same
          accuracy at a fraction of the parameter cost, and on problems with deeper compositional
          structure the gap is far larger.
        </p>

        <Proof color={CORAL} title="existence versus construction">
          <p>
            The distinction between existence and construction runs through all of mathematics, but it
            matters unusually much here because practitioners encounter the gap every time they train
            a network. The intermediate value theorem says a continuous function that is negative at
            one end of an interval and positive at the other has a zero somewhere in between. It does
            not tell you where, and finding it is a separate problem (bisection, Newton&rsquo;s
            method, etc.).
          </p>
          <p>
            Universal approximation is the same kind of result. It says the zero exists — the
            approximation is in the model class. Finding it requires an algorithm (gradient descent),
            data (training samples), and luck (the initialisation and the loss landscape). The theorem
            gives you one of the four things you need: the guarantee that you are searching a space
            that contains the answer. The other three — the algorithm, the data, and the landscape
            navigability — are what the rest of this curriculum is about.
          </p>
        </Proof>

        <h2>The honest takeaway</h2>
        <p>
          Universal approximation is a relief, not a recipe. It tells you that the model class is not
          your bottleneck. It tells you that the failures you encounter are optimisation failures,
          data failures, or generalisation failures — which is a much more useful list to hold than
          &ldquo;maybe the architecture fundamentally cannot do this.&rdquo;
        </p>
        <p>
          But it does not help you choose a width, a depth, or even a training strategy. It does not
          distinguish a network that will train in minutes from one that would need a geological
          timescale. And it does not promise that the answer gradient descent finds will work on data
          the network has not seen. Everything from this point forward in the track — the width
          plateau, the depth question, the practical checklist — is about the things the theorem left
          unsaid.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>The universal approximation theorem guarantees that a single hidden layer with
                enough units can approximate any continuous function. Your single-hidden-layer network
                has high test error. Does the theorem say a wider version will fix it?</>,
              options: [
                "Yes — the theorem guarantees the approximation improves with width",
                "No — it guarantees a good approximation exists in the model class, but says nothing about whether training will find it or it will generalise",
                "Only if the activation function is a sigmoid",
              ],
              answer: 1,
              explain: <>The theorem is about the expressiveness of the model class, not about
                optimisation or generalisation. A wider network might contain a better solution in its
                parameter space, but gradient descent has no obligation to find it, and the solution
                it does find has no obligation to generalise. The activation choice is irrelevant as
                long as it is non-polynomial.</>,
            },
            {
              q: <>The constructive proof tiles d-dimensional space with bumps. In 10 dimensions at
                resolution 0.1, roughly how many hidden units does the construction need?</>,
              options: [
                "About 100 (ten dimensions times ten steps each)",
                "About ten billion — (1/0.1) to the power 10",
                "The theorem provides no estimate",
              ],
              answer: 1,
              explain: <>The construction uses one bump per cell in a grid, and a d-dimensional grid
                with step size 0.1 has (1/0.1)^d = 10^d cells. At d = 10 that is 10^10. This is the
                curse of dimensionality built into the proof itself — the width exists, but it can be
                enormous.</>,
            },
            {
              q: <>If one hidden layer is already universal, why does depth 2 at width 16 (0.946 test
                accuracy) outperform depth 1 at width 64 (0.919) on the two-moons task?</>,
              options: [
                "The depth-2 network has more parameters",
                "Depth enables feature composition, achieving the same or better accuracy with fewer parameters per layer",
                "The single-layer network is overfitting",
              ],
              answer: 1,
              explain: <>The depth-2 network at width 16 has 337 parameters, far fewer than the
                single-layer network at width 64. Depth buys parameter efficiency through
                composition — the second layer builds on the first layer&rsquo;s features rather than
                learning everything from raw inputs. The theorem says one layer suffices for
                expressiveness; it says nothing about efficiency.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/architecture-design/what-width-buys", label: <>← What width buys</> }}
          next={{ href: "/learn/architecture-design/the-width-plateau", label: <>Next up · The width plateau →</> }}
        />
      </div>
    </article>
  );
}
