import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { SymmetryFigure } from "@/components/figures/initNorm/SymmetryFigure";
import { LayerTrace } from "@/components/figures/LayerTrace";
import { SYMMETRY_SERIES } from "@/components/figures/initNorm/data";

export const metadata = {
  title: "Breaking symmetry — Manifold",
  description:
    "Why you cannot initialise a network to zero, or to any constant. Identical weights produce identical gradients and a permanent tie, collapsing the layer to effective width one. The two jobs an initialiser must do: break symmetry and preserve variance.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function BreakingSymmetryPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The starting point matters", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 7 minutes"
        title={<>Breaking symmetry</>}
        intro={<>The variance argument told you the right <em>scale</em> for the weights. But scale
          is only half the job. There is a second, independent requirement that a single number
          cannot satisfy: the weights must be <em>different from each other</em>. Initialise them all
          to the same value — zero being the tempting choice — and a width-32 layer collapses into a
          width-1 layer that can never recover.</>}
      />

      <div className="lesson">
        <h2>The tempting mistake: initialise to zero</h2>
        <p>
          Zero is the natural default. It is unbiased, it is simple, and for the <em>biases</em> it is
          exactly right (more on that below). So why not set the weights to zero as well? Because a
          layer whose weights are all identical has no way to become un-identical. Every unit in the
          layer receives the same inputs; if every unit also has the same weights, every unit computes
          the same thing. A layer of 32 units that all compute the same function is not a 32-unit
          layer — it is a 1-unit layer copied 32 times.
        </p>
        <p>
          Concretely, with a zero initialisation every unit outputs exactly zero, so all units compute
          the same thing, the gradient is identical for every unit, and they update by the identical
          amount — so they stay identical forever. The layer has <strong>effective width 1</strong> no
          matter how many units you gave it. All the capacity you paid for is inaccessible, not because
          the network is too small but because it is perfectly symmetric and nothing in training can
          break the tie.
        </p>

        <Callout color={CORAL} title={<>The trap: constant init is a fixed point of training</>}>
          The problem is not that zero is a bad starting <em>value</em> — it is that identical weights
          are a fixed point of gradient descent. If two units start identical, they receive identical
          gradients and remain identical after the update, and after every update thereafter. Training
          cannot pull them apart because the very thing that would distinguish them — a difference in
          their gradients — requires them to already be different. This is true for any constant, not
          just zero.
        </Callout>

        <SymmetryFigure
          caption={<>The first hidden layer of a width-16 network, one input sample, first eight
            units. On the left every unit emits the same number, so the layer computes one function
            sixteen times over — and because identical outputs receive identical gradients, it will
            still be computing one function after a million steps. On the right the units differ. Three
            of them read zero for this particular sample, which is ReLU doing its job, not symmetry:
            those three are off for <em>this</em> input and on for others.</>}
        />

        <h2>Randomness alone is not enough</h2>
        <p>
          So the fix is randomness: draw each weight independently so no two units start the same. But
          randomness at the wrong scale runs straight back into the vanishing problem from the first
          chapter. Measure the activation std of a deep ReLU network initialised with tiny random
          weights (scale 0.001): layer 1 gives 5.13 &times; 10<sup>-4</sup>, layer 2 gives
          1.22 &times; 10<sup>-6</sup>, layer 3 gives 4.24 &times; 10<sup>-9</sup>, and layer 4 gives
          1.10 &times; 10<sup>-11</sup>. Symmetry <em>is</em> broken — the units genuinely differ — but
          the signal has vanished, so the differences are infinitesimal and the gradients they carry
          are too small to train on.
        </p>
        <p>
          Now the He scale, which satisfies the variance condition: layer 1 activation std 0.5128,
          layer 2 0.4326, layer 3 0.5300, layer 4 0.4879. Each unit computes something genuinely
          different from its neighbours, and the variance stays healthy across depth. Symmetry is
          broken <em>and</em> the signal survives. That is the combination you need, and it is exactly
          why an initialiser has two jobs rather than one.
        </p>

        <LayerTrace
          series={SYMMETRY_SERIES}
          ylabel="activation std"
          caption={<>Activation standard deviation through four layers under the three starting points.
            The zero line is the one place in this entire track where <code>0.0000</code> means exactly
            zero — everywhere else it was a small number rounded by a print format. The tiny-random
            line shows why &ldquo;just break the symmetry&rdquo; is not the whole requirement: it is
            different at every unit and still down at 10⁻¹¹ by layer 4. Both fail, and they fail for
            unrelated reasons, which is why an initialiser has to satisfy two conditions rather than
            one.</>}
        />

        <h2>The two requirements on an initialiser</h2>
        <p>
          Put the last two chapters together and the specification for a good initialiser is complete.
          It must do two independent things, and neither one substitutes for the other:
        </p>
        <MathBlock>{String.raw`\text{(1) randomness} \;\Rightarrow\; \text{break symmetry} \qquad\qquad \text{(2) correct scale} \;\Rightarrow\; \text{preserve variance}`}</MathBlock>
        <p>
          <strong>Randomness breaks symmetry</strong> so the units start out computing different
          functions and can specialise. <strong>The correct scale preserves variance</strong> so those
          different functions carry a signal strong enough to learn from, all the way down a deep stack.
          Zero init satisfies neither. Tiny random satisfies (1) but fails (2). A large constant would
          fail both. Only a random draw at the variance-preserving scale — Xavier for tanh, He for ReLU
          — satisfies both at once, which is the entire reason those schemes are written as &ldquo;a
          random draw with std <M>{String.raw`\sqrt{c/n_{\text{in}}}`}</M>&rdquo; rather than as a single
          fixed matrix.
        </p>

        <h2>Why biases can safely start at zero</h2>
        <p>
          The two-job rule seems to forbid zero, yet biases are almost always initialised to exactly
          zero — and correctly so. The resolution is that the weights have already broken the symmetry.
          Two units with different incoming weight vectors compute different pre-activations even when
          their biases are identical, so they receive different gradients and diverge normally. The
          bias only shifts a unit&rsquo;s threshold; it does not need to distinguish units that their
          weights already distinguish. And a zero bias contributes nothing to the variance budget, so
          it does not disturb the scale that the weights were carefully set to. Biases sit out the
          symmetry-breaking job entirely because the weights already did it, which frees you to give
          them the clean, unbiased starting value of zero.
        </p>

        <Proof color={CORAL} title="identical incoming weights ⇒ identical gradients ⇒ permanent tie">
          <p>
            Consider two units <M>{String.raw`a`}</M> and <M>{String.raw`b`}</M> in the same layer, both
            fed the same input vector <M>{String.raw`\mathbf{x}`}</M>. Suppose at initialisation their
            incoming weight vectors and biases are equal:{" "}
            <M>{String.raw`\mathbf{w}_a = \mathbf{w}_b`}</M> and <M>{String.raw`b_a = b_b`}</M>. Then their
            pre-activations are equal, <M>{String.raw`z_a = \mathbf{w}_a^\top\mathbf{x} + b_a = z_b`}</M>,
            and so are their activations, <M>{String.raw`y_a = g(z_a) = g(z_b) = y_b`}</M>. The two units
            are indistinguishable on the forward pass.
          </p>
          <p>
            Now the backward pass. The gradient of the loss with respect to a unit&rsquo;s incoming
            weight is <M>{String.raw`\dfrac{\partial L}{\partial \mathbf{w}_a} = \delta_a\, \mathbf{x}`}</M>,
            where <M>{String.raw`\delta_a`}</M> is the error signal arriving at the unit. If the two units
            feed the next layer through symmetric outgoing weights as well, their error signals are equal,{" "}
            <M>{String.raw`\delta_a = \delta_b`}</M>, and therefore
          </p>
          <MathBlock>{String.raw`\dfrac{\partial L}{\partial \mathbf{w}_a} = \delta_a\,\mathbf{x} = \delta_b\,\mathbf{x} = \dfrac{\partial L}{\partial \mathbf{w}_b}.`}</MathBlock>
          <p>
            The two weight vectors receive the <em>identical</em> gradient. Apply any gradient-based
            update — plain SGD, momentum, Adam — and both weights change by the same amount, so they
            remain equal after the step:{" "}
            <M>{String.raw`\mathbf{w}_a' = \mathbf{w}_a - \eta\,\delta_a\mathbf{x} = \mathbf{w}_b - \eta\,\delta_b\mathbf{x} = \mathbf{w}_b'`}</M>.
            The equality is preserved by the update, so it holds at every subsequent step by induction.
            The two units are locked together for the entire life of the training run.
          </p>
          <p>
            Zero init is the special case where <em>all</em> units in the layer share this tie at once,
            collapsing the layer to effective width one. The only way out is to start the incoming
            weights unequal — which is what randomness provides, and why the very first job of an
            initialiser is to break this symmetry.
          </p>
        </Proof>

        <h2>Where this leaves the track</h2>
        <p>
          You now have the complete specification: draw the weights randomly (job one, symmetry) at a
          variance-preserving scale (job two, from the <Link href="/learn/initialisation-and-normalisation/the-variance-argument" style={link}>variance
          argument</Link>), and set the biases to zero because the weights have already done the
          breaking. The next chapters give the two canonical scales that satisfy job two — Xavier for
          symmetric activations, He for ReLU — as named formulas you can reach for directly.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>A width-32 layer is initialised with all weights set to zero. What effective width
                does it have during training, and why?</>,
              options: [
                "Width 32, because the biases still differ",
                "Effective width 1: every unit outputs zero, receives an identical gradient, and updates identically, so all 32 units stay identical forever",
                "Width 0, because a zero weight produces no output",
              ],
              answer: 1,
              explain: <>With identical weights every unit computes the same thing and receives the same
                gradient, so they update by the same amount and remain identical at every step. The 32
                units behave as one unit copied 32 times — effective width 1. Identical weights are a
                fixed point of gradient descent.</>,
            },
            {
              q: <>Tiny random init (scale 0.001) gave layer activation stds of 5.13e-4, 1.22e-6,
                4.24e-9 and 1.10e-11, while He gave 0.5128, 0.4326, 0.5300, 0.4879. Both are
                random. What does the comparison show?</>,
              options: [
                "Randomness alone breaks symmetry but does not preserve variance; you also need the correct scale",
                "Tiny random init fails to break symmetry",
                "He init does not break symmetry as well as tiny random",
              ],
              answer: 0,
              explain: <>Both draws break symmetry — the units differ. But the tiny scale lets the
                signal vanish (1.10e-11 by layer 4), so the differences are too small to train on. He
                breaks symmetry <em>and</em> preserves variance. An initialiser has two jobs, and
                randomness satisfies only the first.</>,
            },
            {
              q: <>Weights must be random, yet biases are almost always initialised to exactly zero.
                Why is a zero bias safe when a zero weight matrix is not?</>,
              options: [
                "Biases do not have gradients, so their initial value is irrelevant",
                "The weights already break the symmetry between units, so units diverge regardless of the biases; and a zero bias does not disturb the variance scale",
                "Biases are not trainable parameters",
              ],
              answer: 1,
              explain: <>Symmetry-breaking is the weights&rsquo; job: units with different incoming
                weight vectors compute different pre-activations and receive different gradients even
                with identical biases. The bias only shifts a threshold and adds nothing to the variance
                budget, so zero is a clean, safe choice for it.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/initialisation-and-normalisation/the-variance-argument", label: <>← The variance argument</> }}
          next={{ href: "/learn/initialisation-and-normalisation/xavier", label: <>Next up · Xavier / Glorot →</> }}
        />
      </div>
    </article>
  );
}
