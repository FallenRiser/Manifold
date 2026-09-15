import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { PredictPrompt } from "@/components/PredictPrompt";
import { DepthRisk } from "@/components/figures/arch/ArchFigures";
import { DEPTH_PLAIN, SGD_DEPTH, MAJORITY_CLASS } from "@/components/figures/arch/data";

export const metadata = {
  title: "The gradient problem, revisited — Manifold",
  description:
    "He initialisation and ReLU keep gradient ratios near 1. Under Adam that is enough to depth 40; under plain SGD the same network collapses to 0.750. The ratio is necessary but not sufficient — this chapter introduces the architecture-level fix.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function GradientProblemPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Skip connections", color: CORAL },
          { label: "Tier 2 · mechanics", color: CORAL },
        ]}
        time="about 8 minutes"
        title={<>The gradient problem, revisited</>}
        intro={
          <>
            The backpropagation track showed what happens when gradients vanish or explode. He
            initialisation and ReLU were the first line of defence, and they work — up to a point.
            This chapter measures that point, names the failures that survive past it, and sets up the
            architectural fix that finally broke the depth barrier.
          </>
        }
      />

      <div className="lesson">
        <h2>What He init and ReLU actually solved</h2>
        <p>
          The{" "}
          <Link href="/learn/backpropagation/why-it-is-cheap" style={link}>
            backpropagation track
          </Link>{" "}
          established a single number as the health check for a deep network: the ratio of the
          gradient norm at the first layer to the gradient norm at the last layer. When that ratio
          stays near 1, every layer learns at roughly the same rate. When it drifts toward zero
          (vanishing) or toward infinity (exploding), training collapses.
        </p>
        <p>
          He initialisation, designed specifically for ReLU networks, controls this ratio by setting
          the variance of each weight matrix to{" "}
          <M>{String.raw`\tfrac{2}{n_{\mathrm{in}}}`}</M>. The result, measured on a series of
          networks of increasing depth with width 16 and ReLU activations, is striking.
        </p>

        <MathBlock>{String.raw`\text{depth 2:}\;\frac{\|\nabla_1\|}{\|\nabla_L\|} = 3.22 \qquad \text{depth 20:}\;2.23 \qquad \text{depth 30:}\;2.90`}</MathBlock>

        <p>
          All three ratios are within a small constant factor of 1. Compare sigmoid at depth 12,
          which produced a ratio of{" "}
          <M>{String.raw`2.9 \times 10^7`}</M> — seven orders of magnitude of gradient imbalance.
          He initialisation with ReLU has effectively eliminated the exponential blowup that made deep
          sigmoid networks untrainable.
        </p>

        <h2>So does depth still fail, or not?</h2>
        <p>
          It depends entirely on the optimiser, and the two answers are worth seeing side by side
          before any explanation, because most writing on this subject quietly assumes one of them.
        </p>

        <PredictPrompt
          accent={CORAL}
          prompt={<>Width 16, He init, ReLU, swept to depth 40 on two moons. One sweep uses Adam,
            one uses plain SGD. Which one falls off, and where?</>}
          options={[
            "Both hold up — He init has solved depth",
            "Both collapse past depth 20",
            "Adam holds all the way to 40; SGD collapses past 20",
            "SGD holds; Adam collapses",
          ]}
          nudge="Locked in. Both sweeps are below."
        />

        <DepthRisk
          rows={DEPTH_PLAIN as unknown as Array<Record<string, number>>}
          keys={["test", "worst"]}
          labels={["mean of 3 seeds", "worst seed"]}
          majority={MAJORITY_CLASS}
          caption={<>Under <strong>Adam</strong>, there is no depth wall on this problem at all. The
            mean drifts from 0.948 at depth 2 to 0.928 at depth 40 — two points across a twentyfold
            increase in depth. What moves is the <em>worst seed</em>: it tracks the mean almost
            exactly up to depth 20, then separates, bottoming out at 0.830 at depth 30 while the mean
            still reads 0.902. The seed-to-seed spread goes from 0.0024 to 0.0510, a factor of 21.
            This is the depth tax as it actually appears here — not a loss of accuracy, a loss of
            reliability.</>}
        />

        <DepthRisk
          rows={SGD_DEPTH as unknown as Array<Record<string, number>>}
          keys={["plain", "resBN"]}
          labels={["plain net", "residual + BatchNorm"]}
          majority={MAJORITY_CLASS}
          caption={<>The identical sweep under <strong>plain SGD</strong>, and now the wall is
            unmistakable: flat at about 0.94 to depth 20, then <strong>0.770</strong> at depth 30 and{" "}
            <strong>0.750</strong> at depth 40, with seed spreads of 0.21 and 0.20 — meaning some
            seeds fail outright while others are fine. Adam was hiding this, because rescaling every
            parameter&rsquo;s step by its own gradient history is itself a partial fix for the problem
            this chapter is about. The second line is where the chapter ends up, and the next three
            pages are how it gets there.</>}
        />

        <p>
          So the honest statement is narrower than &ldquo;deep networks do not train&rdquo;. The
          gradient ratio at depth 20 is a healthy 2.23, and with a good optimiser that network
          reaches 0.933. Give the same architecture, the same initialisation and the same
          healthy-looking ratio 40 layers and plain SGD, and it lands at <strong>0.750</strong>.
        </p>
        <p>
          That is the central puzzle of this chapter. The gradient is arriving at the right
          magnitude, and the network still fails. If the ratio is not the bottleneck, what is?
        </p>

        <Callout color={CORAL} title={<>Necessary but not sufficient</>}>
          A healthy gradient ratio means every layer <em>receives</em> a learning signal of
          comparable magnitude. It does not mean the signal is <strong>useful</strong>, and it does
          not mean a plain optimiser can act on it. Three
          distinct pathologies can corrupt a gradient that arrives at the right scale:
          <br /><br />
          <strong>1. Loss landscape roughness.</strong> As depth increases, the loss surface develops
          more saddle points and sharp minima. The gradient at any given step points in a valid
          direction, but that direction changes so rapidly between steps that optimisation wanders
          rather than progresses.
          <br /><br />
          <strong>2. Dead units.</strong> A ReLU whose input is negative for every training example
          has gradient exactly zero — permanently. In a width-16 network with 20 layers, the expected
          number of dead units grows with depth, progressively shrinking the effective capacity of the
          network.
          <br /><br />
          <strong>3. Representational bottleneck.</strong> With only 16 units per layer, the network
          must encode all information about the input in a 16-dimensional vector at every layer. As
          depth grows, the chance of an information-destroying transformation at some layer
          increases — and once information is lost, no subsequent layer can recover it.
        </Callout>

        <h2>The depth wall in numbers</h2>
        <p>
          The pattern is consistent once the optimiser is held fixed: at fixed width, accuracy holds
          flat with depth up to a point, and past that point it falls while the variation between
          runs explodes. The fall is not catastrophic the way sigmoid collapse is — the network does
          not diverge, it does not produce NaN, the loss does decrease — but it settles well below
          what a shallower network reaches, and it does so unpredictably.
        </p>
        <p>
          The unpredictability is the part worth holding on to. A mean of 0.770 at depth 30 with a
          spread of 0.21 does not describe three runs that each lost seventeen points; it describes
          runs that were fine and runs that failed, averaged together. The depth wall is not a tax
          levied evenly on every run. It is a rise in the probability that a given run is a
          write-off — which is exactly the shape of failure the{" "}
          <Link href="/learn/initialisation-and-normalisation/why-norm-reduces-sensitivity" style={link}>
            initialisation and normalisation track
          </Link>{" "}
          found for a badly scaled starting point, and it has the same kind of fix.
        </p>

        <h2>What an architectural fix looks like</h2>
        <p>
          The initialisation fix (He) scaled the weights so that the variance of the signal was
          preserved layer by layer. It addressed the <em>magnitude</em> of the gradient. The
          architectural fix addresses the <em>path</em> of the gradient: instead of asking every
          layer to simultaneously transform and preserve, it provides a separate pathway through
          which information flows unmodified.
        </p>
        <p>
          That pathway is the <strong>skip connection</strong>, and it is the subject of the next
          three pages. The idea is simple — add the input of a block directly to its output — but its
          consequences are profound. It is not an exaggeration to say that skip connections are the
          single most important architectural idea of the last decade, because without them, nothing
          deeper than about 20 layers trains reliably, and every major architecture in current use
          (ResNets, transformers, U-Nets) depends on them.
        </p>

        <Proof color={CORAL} title="why the ratio staying near 1 is not the whole story">
          <p>
            The gradient ratio <M>{String.raw`\|\nabla_1\| / \|\nabla_L\|`}</M> is a scalar summary
            of a high-dimensional object. Two gradient vectors can have the same norm but point in
            completely different directions, and it is the direction that determines whether the
            parameter update is useful.
          </p>
          <p>
            In a deep network without skip connections, the gradient at layer{" "}
            <M>{String.raw`l`}</M> is the product of{" "}
            <M>{String.raw`L - l`}</M> Jacobian matrices:
          </p>
          <MathBlock>{String.raw`\frac{\partial \mathcal{L}}{\partial \mathbf{h}^{(l)}} = \frac{\partial \mathcal{L}}{\partial \mathbf{h}^{(L)}} \prod_{k=l+1}^{L} J_k`}</MathBlock>
          <p>
            He init ensures that the <em>expected norm</em> of this product stays constant, but the
            variance of the product grows with depth. At depth 20, the gradient norm at any given
            step can be far from its expectation, and the <em>direction</em> of the gradient can
            differ substantially from the true steepest-descent direction. This is the shattering
            gradient problem (Balduzzi et al., 2017): the gradient becomes increasingly noisy as
            depth increases, even when its expected magnitude is correct.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: (
                <>
                  A depth-40 ReLU network with He init has a gradient ratio near 1, reaches 0.928
                  under Adam, and 0.750 under plain SGD. What does that tell us about gradient
                  ratios?
                </>
              ),
              options: [
                "The gradient ratio measurement is wrong at depth 40",
                "A healthy gradient ratio is necessary but not sufficient — one unchanged ratio is consistent with both outcomes",
                "He init does not work for networks deeper than 10 layers",
              ],
              answer: 1,
              explain: (
                <>
                  The ratio is correctly measured and He init is working as designed — which is
                  precisely the problem with using it as the health check. One number, unchanged, is
                  consistent with both a 0.928 run and a 0.750 one. Gradient magnitude is one
                  requirement among several: landscape roughness, dead units and information
                  bottlenecks all degrade training independently of it.
                </>
              ),
            },
            {
              q: (
                <>
                  Sigmoid at depth 12 produces a gradient ratio of{" "}
                  <M>{String.raw`2.9 \times 10^7`}</M>. He+ReLU at depth 20 produces 2.23. Why can
                  the He+ReLU network still underperform despite this much better ratio?
                </>
              ),
              options: [
                "Because ReLU is a worse activation than sigmoid",
                "Because the problem is too easy for a deep network",
                "Because correct gradient magnitude does not guarantee correct gradient direction — the signal becomes noisy with depth",
              ],
              answer: 2,
              explain: (
                <>
                  The gradient ratio tells you the signal arrives at the right scale. It says nothing
                  about whether the direction is still informative. Deep products of Jacobians
                  accumulate directional noise even when their norm is controlled.
                </>
              ),
            },
            {
              q: (
                <>
                  The chapter argues that the depth wall is caused by three factors. Which is{" "}
                  <strong>not</strong> one of them?
                </>
              ),
              options: [
                "Loss landscape roughness creating saddle points",
                "Dead ReLU units reducing effective capacity",
                "The learning rate being too high for deep networks",
              ],
              answer: 2,
              explain: (
                <>
                  The three factors are landscape roughness, dead units, and representational
                  bottlenecks. The learning rate is a hyperparameter choice, not a structural
                  pathology of depth — and the measured networks all used the same learning rate.
                </>
              ),
            },
          ]}
        />

        <PrevNext
          prev={{
            href: "/learn/architecture-design/memory-and-compute",
            label: <>&larr; Memory and compute budgets</>,
          }}
          next={{
            href: "/learn/architecture-design/skip-connections",
            label: <>Next up &middot; Skip connections &rarr;</>,
          }}
        />
      </div>
    </article>
  );
}
