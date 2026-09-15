import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { SweepCurve } from "@/components/figures/SweepCurve";
import { WIDTH_SWEEP } from "@/components/figures/arch/data";
import { PredictPrompt } from "@/components/PredictPrompt";

export const metadata = {
  title: "What width buys — Manifold",
  description:
    "Width is the simplest capacity knob a network has: each unit in a layer is one more basis function to combine. Here is what that buys, when it stops buying, and why width is the first thing to try.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhatWidthBuysPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Width", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 8 minutes"
        title={<>What width buys</>}
        intro={<>Before you reach for residual blocks, normalisation layers, or any of the
          machinery that makes deep networks trainable, there is a simpler question.
          How many units should each layer have? This chapter starts with the first and most
          accessible capacity knob: width.</>}
      />

      <div className="lesson">
        <h2>Width as capacity</h2>
        <p>
          A single hidden layer computes a weighted sum of its units&rsquo; outputs. Each unit applies
          the activation to a different linear combination of the inputs, producing a different
          nonlinear &ldquo;detector.&rdquo; Adding one more unit is adding one more basis function
          to the mix — one more shape the layer can combine when it constructs its output.
        </p>
        <p>
          In a network with a single hidden layer, width <em>is</em> capacity. There is no other knob.
          The input dimension is fixed by the problem, the output dimension is fixed by the task, and
          the activation is a per-unit choice that rarely varies within a layer. The only free parameter
          that controls what the layer can represent is how many units it has.
        </p>

        <MathBlock>{String.raw`\mathbf{h} = g\!\bigl(W\mathbf{x} + \mathbf{b}\bigr) \in \mathbb{R}^m, \qquad \hat{y} = \mathbf{v}^\top \mathbf{h} + c`}</MathBlock>

        <p>
          Here <M>{String.raw`m`}</M> is the width. If <M>{String.raw`m = 1`}</M> the network can
          produce exactly one nonlinear feature and must solve the entire problem with it. If{" "}
          <M>{String.raw`m = 256`}</M> it has 256 features to blend. The question is what that extra
          capacity actually buys on a real problem, and where it stops buying.
        </p>

        <h2>The capacity ladder, measured</h2>
        <p>
          On the two-moons classification task — two interleaved half-circles, 1000 training points,
          200 test points — a single hidden layer with ReLU activations gives a clean capacity sweep.
          Every number below is a test accuracy averaged over five seeds, trained for 200 epochs with
          Adam at learning rate 0.001.
        </p>
        <p>
          At width 1 the network has a single ReLU unit: one fold in input space, nothing more. Test
          accuracy is 0.641, barely above the 0.500 baseline. The network can draw a line but the
          moons are not linearly separable, and one fold is not enough to wrap around either of them.
        </p>
        <p>
          At width 3 the jump is dramatic: test accuracy reaches 0.852. Three units give the network
          three folds, enough to carve out a triangular region that captures most of one moon. This is
          the transition from &ldquo;cannot represent the answer&rdquo; to &ldquo;can represent a
          rough version of it,&rdquo; and it is the single largest gain in the entire sweep.
        </p>
        <p>
          At width 64 the network reaches 0.919. The boundary is smooth, the error cases are near the
          overlap zone where the moons almost touch, and the network has more than enough capacity to
          represent the true boundary. Going to width 256 gives 0.918 — not higher, a hair lower, and
          within the noise of the measurement.
        </p>

        <Callout color={CORAL} title={<>Width follows a law of diminishing returns</>}>
          The pattern is the same every time you measure it. The first few units buy a lot: 1 to 3 took
          test accuracy from 0.641 to 0.852, a gain of 0.211. The next order of magnitude (3 to 64) bought
          0.067. The next (64 to 256) bought negative 0.001. Width has its biggest effect when the
          network is too small to represent the answer at all. Once it can, more width does not help —
          it is adding basis functions the optimiser has nothing useful to do with.
        </Callout>

        <SweepCurve
          points={WIDTH_SWEEP.map((p) => ({ x: p.x, a: p.y }))}
          log
          xlabel="hidden width (log scale)"
          xticks={[2, 8, 32, 128, 512]}
          caption={<>What width buys, and where it stops buying. The useful range is the left third
            of this axis: 2 → 16 is worth 18 points. After that the curve is flat to within seed
            noise for five further doublings. Width is the knob that is cheap to get wrong in the
            generous direction and expensive to get wrong in the stingy one — which is exactly why
            the playbook turns it first.</>}
        />

        <h2>Width interacts with depth</h2>
        <p>
          The same sweep at depth 2 — two hidden layers instead of one — tells a different and more
          useful story. Now the network can compose features, and width controls how many features
          each layer contributes to the composition.
        </p>
        <p>
          At depth 2 and width 2 the test accuracy is 0.793. At width 4 it jumps to 0.879. At width 16
          it reaches 0.946. And there it stays: width 32, 64, 128, 256, and 512 all give test
          accuracies between 0.946 and 0.950, a range of 0.004 across a 32-fold increase in width
          and a 784-fold increase in parameter count.
        </p>
        <p>
          Compare the two sweeps at width 4. At depth 1, width 4 gives test accuracy around 0.852.
          At depth 2, width 4 gives 0.879. The same number of units per layer, but the second layer
          can combine the first layer&rsquo;s features, and that composition is worth 0.027 in test
          accuracy even at this small scale. At width 16 the gap is larger: depth 1 gives roughly
          0.885, depth 2 gives 0.946 — a difference of 0.061.
        </p>
        <p>
          The lesson is that width and depth are not interchangeable. Width controls how many features
          a single layer can extract. Depth controls how those features can be composed. And composition
          is often worth more than raw feature count, which is why the depth-2 network plateaus at a
          higher accuracy than the depth-1 network ever reaches.
        </p>

        <PredictPrompt
          accent={CORAL}
          prompt={<>Going from a hidden width of 16 to a hidden width of 512 multiplies the
            parameter count by 785, from 337 to 264,705. How much test accuracy does that buy on
            this problem?</>}
          options={[
            "Several points — capacity is the binding constraint",
            "About a point",
            "Nothing, and slightly less than nothing",
            "It collapses — far too many parameters for 600 points",
          ]}
          nudge="Locked in. Check it against the sweep above."
        />

        <h2>The parameter cost of width</h2>
        <p>
          Width is not free. Each unit in a hidden layer of width <M>{String.raw`m`}</M> receiving
          input of dimension <M>{String.raw`d`}</M> has <M>{String.raw`d + 1`}</M> parameters (one
          weight per input plus a bias). The full layer has <M>{String.raw`m(d + 1)`}</M> parameters,
          linear in <M>{String.raw`m`}</M>. In a depth-2 network with input dimension 2, the parameter
          count grows as:
        </p>

        <MathBlock>{String.raw`\text{params} = m \cdot (2 + 1) + m \cdot (m + 1) + 1 \cdot (m + 1) = m^2 + 5m + 1`}</MathBlock>

        <p>
          At width 16 that is 337 parameters. At width 512 it is 264,705 — a factor of 785. The test
          accuracy moved from 0.946 to 0.950. Each additional parameter after the plateau contributes
          nothing measurable to the model&rsquo;s ability to solve the problem, but it does contribute
          to memory usage, training time, and the risk of overfitting.
        </p>

        <Proof color={CORAL} title="why width scales the layer, not the network">
          <p>
            In a fully connected network, the weight matrix between two layers of widths{" "}
            <M>{String.raw`m_1`}</M> and <M>{String.raw`m_2`}</M> has{" "}
            <M>{String.raw`m_1 \times m_2`}</M> entries. Doubling the width of one layer doubles the
            parameters in the matrices on both sides of it — but only those two matrices. The rest of
            the network is unchanged.
          </p>
          <p>
            This means the parameter cost of width is <em>local</em>: it scales the layers adjacent to
            the widened layer, not the entire network. In a 10-layer network, doubling the width of
            layer 5 doubles two weight matrices out of ten. Doubling the width of every layer doubles
            all of them, which squares the parameter count at the widest interior connection. This is
            why uniform widening is expensive and why practitioners often keep most layers at a moderate
            width and widen selectively.
          </p>
        </Proof>

        <h2>Why width is the first knob to turn</h2>
        <p>
          When a model underfits — training loss is high, training accuracy is low — the diagnosis is
          that the model cannot represent the answer. The simplest remedy is to give it more capacity,
          and the simplest way to give it more capacity is to make the layers wider.
        </p>
        <p>
          Width is simpler than depth for three reasons. First, adding units to an existing layer does
          not change the optimisation landscape in the ways that adding layers does: there are no new
          gradient-path bottlenecks, no new places for the signal to vanish. Second, the parameter cost
          is predictable and local — you know exactly which matrices grow and by how much. Third, a
          wider network with the same depth trains with the same learning rate, the same initialisation
          scheme, and the same number of epochs; a deeper network often needs all three adjusted.
        </p>
        <p>
          The practical rule is: if you suspect the network is too small, double the width first. If
          that does not improve training accuracy, width is not the bottleneck, and the answer is
          elsewhere — in depth, in the data, or in the optimiser. But try width first because it is
          the cheapest experiment to run and the easiest result to interpret.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>In a single-hidden-layer network, going from width 1 to width 3 improved test
                accuracy by 0.211 (0.641 to 0.852). Going from width 64 to width 256 changed it by
                −0.001. What explains the difference?</>,
              options: [
                "Width 256 is overfitting while width 64 is not",
                "The first few units add representational capacity the network needs; later units add capacity the optimiser cannot usefully deploy",
                "The learning rate is too small for the wider network to converge",
              ],
              answer: 1,
              explain: <>The transition from 1 to 3 units crosses the threshold where the network can
                represent the decision boundary at all. Beyond width 64 the network already has far
                more capacity than needed, so additional units contribute nothing measurable to test
                accuracy.</>,
            },
            {
              q: <>At width 16, a depth-1 network reaches test accuracy around 0.885 while a depth-2
                network reaches 0.946. Why does depth help at the same width?</>,
              options: [
                "The deeper network has more total parameters",
                "The second layer can compose features from the first, and composition is more powerful than a larger set of independent features",
                "Depth acts as regularisation, reducing overfitting",
              ],
              answer: 1,
              explain: <>Depth enables feature composition — the second layer builds on the
                representations the first layer extracts rather than working directly from the raw
                inputs. This compositional structure can represent the same boundary with fewer units
                per layer than a single wide layer would need.</>,
            },
            {
              q: <>You suspect your network is too small. Why is widening the layers a better first
                experiment than adding more layers?</>,
              options: [
                "Wider networks always outperform deeper ones",
                "Width does not introduce new gradient-path bottlenecks, has predictable parameter cost, and does not require changing the learning rate or initialisation",
                "Adding layers is never helpful",
              ],
              answer: 1,
              explain: <>Width is the safer and more interpretable experiment. It changes capacity
                without changing the optimisation dynamics. If widening does not help, you know the
                bottleneck is elsewhere — but if adding layers does not help, it could be the layers
                themselves or the gradient pathology they introduced.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/architecture-design/the-capacity-intuition", label: <>← The capacity intuition</> }}
          next={{ href: "/learn/architecture-design/universal-approximation", label: <>Next up · Universal approximation, honestly →</> }}
        />
      </div>
    </article>
  );
}
