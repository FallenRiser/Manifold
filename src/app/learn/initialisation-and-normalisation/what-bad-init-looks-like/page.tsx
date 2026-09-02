import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { InitScaleLab } from "@/components/labs/InitScaleLab";

export const metadata = {
  title: "What bad init looks like — Manifold",
  description:
    "A deep network is a long product of matrices, so the per-layer scale compounds. Set it wrong and the signal vanishes to zero or explodes across nine orders of magnitude — before a single training step. Measured on an 8-layer ReLU net.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhatBadInitLooksLikePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The starting point matters", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 8 minutes"
        title={<>What bad init looks like</>}
        intro={<>Before you train, before you choose a learning rate, before the first gradient
          flows, you have to fill the weight matrices with numbers. That choice alone can decide
          whether the network can learn at all. This chapter shows what happens when you get the
          scale wrong — the signal vanishes to zero or explodes across nine orders of magnitude,
          and it happens on the very first forward pass.</>}
      />

      <div className="lesson">
        <h2>A deep network is a product of matrices</h2>
        <p>
          Strip away the activations for a moment and a deep network is a chain of matrix
          multiplies: the input is hit by <M>{String.raw`W_1`}</M>, then <M>{String.raw`W_2`}</M>,
          then <M>{String.raw`W_3`}</M>, and so on down the stack. The signal that reaches layer{" "}
          <M>{String.raw`\ell`}</M> has passed through <M>{String.raw`\ell`}</M> multiplications in
          a row. Whatever each matrix does to the <em>scale</em> of the signal, it does repeatedly,
          and repeated multiplication compounds.
        </p>
        <p>
          If each layer tends to shrink the signal by a factor a little below one, that shrink
          raised to the eighth power is a collapse. If each layer tends to grow it by a factor
          above one, that growth raised to the eighth power is an explosion. There is only a narrow
          band of scales — the ones that keep each layer close to a factor of one — where the
          signal survives the trip. Initialisation is the act of picking a scale inside that band,
          and bad initialisation is picking one outside it.
        </p>

        <h2>Three regimes, measured</h2>
        <p>
          To see this concretely, take an 8-layer network, each hidden layer width 32, ReLU
          activations. Feed it random inputs and measure the standard deviation of the
          pre-activations at each layer — that number is the &ldquo;scale&rdquo; of the signal as
          it flows forward. Do it three times, changing only the standard deviation of the initial
          weights. Nothing is trained; this is the untouched network at initialisation.
        </p>
        <p>
          <strong>Too small (weight std 0.001).</strong> Layer 1 comes out with std 0.0010. By
          layer 2 it is 0.0000, and it reads 0.0000 for every layer after that. Roughly half the
          units are dead — outputting zero — throughout the network. The signal has completely
          vanished by the second layer. The eight-layer network is, functionally, silent.
        </p>
        <p>
          <strong>He (the correct scale for ReLU).</strong> Layer 1 std is 1.0488, then 1.0781,
          1.0128, 0.9733, 0.8933, 0.6454, 0.7319, and 0.6558 at layer 8. Every layer stays within
          a factor of two of one. The signal that entered the network is still recognisably present
          eight layers deep. This is what a healthy forward pass looks like.
        </p>
        <p>
          <strong>Too large (weight std 5.0).</strong> Layer 1 std is 5.2440. Layer 2 is 107.81.
          Layer 3 is 2025.6. By layer 8 it is <M>{String.raw`4.20 \times 10^{9}`}</M> — the scale
          has climbed roughly nine orders of magnitude in eight layers. The fraction of
          pre-activations with <M>{String.raw`|z| > 5`}</M> goes from 0.28 at layer 1 to 1.00 by
          layer 4: past that point, <em>every</em> unit is deep in saturation or overflowing.
        </p>

        <LabFrame
          accent={CORAL}
          tryThis={<>Switch between the three initial weight scales and watch the per-layer bars.
            Note that the vertical axis is logarithmic — it has to be, because the numbers span
            thirteen orders of magnitude. Find the healthy band and see which scale stays inside it.</>}
          insight={<>Only He keeps every layer inside the healthy band around std&nbsp;1. The small
            scale flatlines to the floor by layer 2 (the signal is gone); the large scale marches
            straight up and off the top of the chart by layer 8. There is no training here — this is
            purely the choice of initial scale, decided before any data is seen.</>}
        >
          <InitScaleLab />
        </LabFrame>

        <h2>Why each failure kills learning</h2>
        <p>
          Both failures are fatal, but for different reasons, and it is worth being precise about
          each because the fix in later chapters targets exactly these mechanisms.
        </p>
        <p>
          <strong>Vanishing kills the backward pass.</strong> Learning happens by sending a gradient
          backward through the same chain of matrices. Where the forward activation has collapsed to
          zero, the local gradient of a ReLU is zero, and a zero multiplied into the chain zeroes
          everything upstream of it. A layer that outputs nothing also transmits no learning signal
          to the layers before it. The vanished network cannot represent anything <em>and</em>
          cannot receive a correction — it is stuck at its random starting point.
        </p>
        <p>
          <strong>Exploding overflows and saturates.</strong> A pre-activation of{" "}
          <M>{String.raw`4.20 \times 10^{9}`}</M> is far outside the range any downstream nonlinearity
          or loss can handle gracefully. Squared in a loss it overflows to infinity; the gradient it
          produces is enormous and points in a direction that reflects numerical noise, not the
          problem. In the softmax or sigmoid case the unit is pinned flat against its asymptote, so
          its gradient is zero for the opposite reason. When the fraction of saturated units hits
          1.00, the whole layer is either numerically broken or learning nothing.
        </p>

        <Callout color={CORAL} title={<>The verdict is delivered before training starts</>}>
          Every number on this page came from a forward pass through an <em>untrained</em> network.
          No optimiser ran, no learning rate was chosen, no data was fit. The difference between a
          network that can learn and one that is already dead is decided the instant you fill the
          weight matrices. That is why initialisation is not a footnote — it is a precondition.
        </Callout>

        <Proof color={CORAL} title="why the scale compounds multiplicatively">
          <p>
            Track the standard deviation of the signal layer by layer. Write{" "}
            <M>{String.raw`s_\ell`}</M> for the std of the pre-activation at layer{" "}
            <M>{String.raw`\ell`}</M>. A layer maps the incoming signal through its weight matrix, and
            for a fixed initialisation scheme each layer multiplies the incoming std by roughly the
            same factor <M>{String.raw`r`}</M> — the factor is set by the weight scale, the fan-in, and
            what the activation does to the variance. So the recursion is multiplicative:
          </p>
          <MathBlock>{String.raw`s_\ell \approx r \cdot s_{\ell-1} \quad\Longrightarrow\quad s_\ell \approx r^{\,\ell}\, s_0.`}</MathBlock>
          <p>
            The scale at depth <M>{String.raw`\ell`}</M> is the input scale times{" "}
            <M>{String.raw`r`}</M> raised to the <M>{String.raw`\ell`}</M>-th power. That exponent is
            the whole story. If <M>{String.raw`r < 1`}</M> the signal decays geometrically to zero; if{" "}
            <M>{String.raw`r > 1`}</M> it grows geometrically without bound; only <M>{String.raw`r \approx 1`}</M>
            keeps it stable across depth. With the weight std at 5.0, the measured per-layer factor is
            around 20, and <M>{String.raw`20^{8} \approx 2.6 \times 10^{10}`}</M> — which is exactly the
            order of magnitude the eighth layer reaches. With std 0.001 the factor is far below one and
            the signal is gone within two layers. A deep network does not add its layers&rsquo; effects on
            scale; it multiplies them, and multiplication of a repeated factor is exponential in depth.
          </p>
        </Proof>

        <h2>What the rest of the track is for</h2>
        <p>
          The whole game, then, is to make that per-layer factor equal to one on purpose. The{" "}
          <Link href="/learn/initialisation-and-normalisation/the-variance-argument" style={link}>next
          chapter</Link> turns &ldquo;factor of one&rdquo; into an exact condition on the variance of
          the weights, and the named initialisations that follow — Xavier and He — are just two ways
          of solving that condition. Normalisation, later in the track, is the technique that resets
          the scale to one <em>during</em> training so you never have to rely on the initial choice
          holding up on its own.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>In the too-large regime (weight std 5.0), the pre-activation std climbs from
                5.2440 at layer 1 to 4.20 × 10⁹ at layer 8 — about nine orders of magnitude. Why does
                a modest per-layer growth factor produce such an enormous end result?</>,
              options: [
                "The optimiser amplifies the signal on each step",
                "The layers multiply their scale factors, so a factor above one is raised to the power of the depth — growth is exponential in the number of layers",
                "ReLU doubles the signal at every layer",
              ],
              answer: 1,
              explain: <>A deep network is a product of matrices, so a fixed per-layer scale factor{" "}
                <em>r</em> compounds as r raised to the depth. With r around 20 per layer, eight layers
                give roughly 20⁸ ≈ 2.6 × 10¹⁰ — the same order of magnitude as the measured 4.20 × 10⁹.
                The growth is exponential in depth, not additive.</>,
            },
            {
              q: <>With weight std 0.001 the pre-activation std reads 0.0000 from layer 2 onward and
                about half the units are dead. Why does this specifically prevent the network from
                learning?</>,
              options: [
                "A vanished activation is zero, and its ReLU gradient is zero, so no learning signal can flow backward past it",
                "The learning rate becomes too large for such small activations",
                "Small weights make the loss function non-differentiable",
              ],
              answer: 0,
              explain: <>Learning needs a gradient sent backward through the same chain of matrices.
                Where the forward activation has collapsed to zero, the local ReLU gradient is zero, and
                a zero multiplied into the chain zeroes everything upstream. The network can neither
                represent the answer nor receive a correction.</>,
            },
            {
              q: <>Every measurement on this page was taken from an untrained network on a single
                forward pass. What is the intended takeaway?</>,
              options: [
                "Training will eventually fix any reasonable initialisation",
                "Whether a deep network can learn is largely decided by the initial weight scale, before any training step happens",
                "The measurements would change substantially after a few epochs",
              ],
              answer: 1,
              explain: <>The vanish-or-explode verdict is delivered at initialisation. No optimiser
                ran and no data was fit, yet the signal was already either gone or overflowing.
                Initialisation is a precondition for learning, not something training can rescue after
                the fact.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/initialisation-and-normalisation", label: <>← Init &amp; normalisation</> }}
          next={{ href: "/learn/initialisation-and-normalisation/the-variance-argument", label: <>Next up · The variance argument →</> }}
        />
      </div>
    </article>
  );
}
