import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { RegulariserLab } from "@/components/labs/RegulariserLab";

export const metadata = {
  title: "Randomly removing units — Manifold",
  description:
    "Dropout deletes each hidden unit at random on every forward pass. It is the single most effective regulariser on the overfitting network in this track — test 0.751 → 0.777. The mechanism, the inverted-dropout scaling, and the measured win.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function RandomlyRemovingUnitsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Dropout", color: CORAL }, { label: "Tier 2 · practitioner", color: CORAL }]}
        time="about 8 minutes"
        title={<>Randomly removing units</>}
        intro={<>Weight decay tried to shrink the network by pulling weights toward zero, and on this
          problem it barely moved. Dropout takes a stranger route: on every forward pass it <strong>deletes
          a random subset of hidden units entirely</strong>. It sounds like sabotage. It is the single most
          effective regulariser on the network running through this track.</>}
      />

      <div className="lesson">
        <h2>The mechanism</h2>
        <p>
          Dropout was introduced by Srivastava, Hinton, and colleagues in 2014 (&ldquo;Dropout: A Simple
          Way to Prevent Neural Networks from Overfitting&rdquo;). The rule is almost embarrassingly
          simple. During training, for each forward pass and each hidden unit independently, draw a coin
          that comes up &ldquo;keep&rdquo; with probability <M>{String.raw`1-p`}</M> and &ldquo;drop&rdquo;
          with probability <M>{String.raw`p`}</M>. A dropped unit outputs exactly zero for that pass — it
          contributes nothing to the forward computation and receives no gradient on the backward pass.
        </p>
        <p>
          Concretely, let <M>{String.raw`\mathbf{h}`}</M> be a layer&rsquo;s activations. Dropout samples
          a binary mask <M>{String.raw`\mathbf{m}`}</M>, one Bernoulli draw per unit, and multiplies it in
          elementwise:
        </p>

        <MathBlock>{String.raw`m_i \sim \text{Bernoulli}(1-p), \qquad \tilde{h}_i = \frac{1}{1-p}\, m_i \, h_i`}</MathBlock>

        <p>
          Two things are happening in that expression. The mask{" "}
          <M>{String.raw`m_i \in \{0,1\}`}</M> zeroes each unit with probability{" "}
          <M>{String.raw`p`}</M> — that is the deletion. The factor{" "}
          <M>{String.raw`\tfrac{1}{1-p}`}</M> rescales every surviving unit so that the layer&rsquo;s
          <em>expected</em> output is unchanged. This second piece is <strong>inverted dropout</strong>,
          and it is the reason test time needs no special handling: because the surviving activations were
          scaled up during training, at test you simply turn dropout off and use the full, unscaled
          activations. No renormalisation, no bookkeeping. We prove the expectation is preserved below.
        </p>

        <Callout color={CORAL} title={<>A different network on every step</>}>
          Because the mask is resampled every forward pass, no two training steps see the same
          architecture. A layer of 256 units with <M>{String.raw`p = 0.5`}</M> is, on average, a layer of
          128 units — but <em>which</em> 128 changes constantly. The network is never allowed to settle
          into a configuration that depends on any particular unit being present. That instability, applied
          only during training, is the entire regularising force.
        </Callout>

        <h2>See it against every other regulariser</h2>
        <p>
          Before we argue about <em>why</em> dropout works, look at whether it does. The lab below compares
          every regulariser in this track on the exact same overfitting network — a 3&times;256 MLP on 250
          noisy points, train accuracy pinned at 1.000 for all of them. The only thing that varies is the
          test accuracy each technique buys.
        </p>

        <LabFrame
          accent={CORAL}
          tryThis={<>Read the bars from top to bottom. Note where weight decay lands relative to the
            no-regularisation baseline, then find the two dropout rows. Which single technique moves the
            test bar furthest to the right?</>}
          insight={<>Dropout at rate 0.5 is the best single regulariser here — it reaches 0.777, a gain of
            about 0.024 over the unregularised baseline, while weight decay is essentially inert. Only
            augmentation (input jitter) and the weight-decay-plus-dropout combination edge past it, and
            both of those still lean on the same noise-injection idea dropout embodies.</>}
        >
          <RegulariserLab />
        </LabFrame>

        <h2>The measured win</h2>
        <p>
          The unregularised network memorises its 250 training points perfectly — train accuracy 1.000 —
          and generalises to test accuracy <strong>0.751</strong>, a gap of 0.249. Add dropout at rate
          0.5 to the hidden layers and, with everything else held fixed, test accuracy climbs to{" "}
          <strong>0.777</strong>. Train accuracy stays at 1.000; the network still fits its training set,
          it simply fits it in a way that transfers better. That <strong>+0.024</strong> is the largest
          single-technique gain measured on this problem.
        </p>
        <p>
          The contrast with weight decay is the honest headline of this track. Weight decay at{" "}
          <M>{String.raw`10^{-2}`}</M> leaves test accuracy at 0.751 — within noise of doing nothing —
          because on this network the binding constraint on generalisation is not the magnitude of the
          weights. Dropout attacks a different constraint entirely, and that is why it moves the number
          when the textbook-first technique does not.
        </p>

        <Proof color={CORAL} title="why inverted-dropout scaling leaves the expected activation unchanged">
          <p>
            Fix a single unit with clean activation <M>{String.raw`h`}</M>. Under inverted dropout its
            training-time output is the random variable{" "}
            <M>{String.raw`\tilde{h} = \tfrac{1}{1-p}\, m\, h`}</M>, where{" "}
            <M>{String.raw`m \sim \text{Bernoulli}(1-p)`}</M>. Take the expectation over the mask:
          </p>
          <MathBlock>{String.raw`\mathbb{E}[\tilde{h}] = \frac{1}{1-p}\,\mathbb{E}[m]\, h = \frac{1}{1-p}\,(1-p)\, h = h.`}</MathBlock>
          <p>
            The expected value of the dropped-and-rescaled activation is exactly the original activation{" "}
            <M>{String.raw`h`}</M>. So a downstream unit reading a weighted sum{" "}
            <M>{String.raw`\sum_i w_i \tilde{h}_i`}</M> sees, in expectation, the same{" "}
            <M>{String.raw`\sum_i w_i h_i`}</M> it would see with dropout off. At test time we deliberately
            remove the randomness and use the full network, and because training targeted that same
            expected activation, the deterministic test-time activation is the correct thing to feed
            forward — no rescaling required. Had we scaled at test instead (the older &ldquo;standard
            dropout&rdquo; convention) we would multiply activations by <M>{String.raw`1-p`}</M> there;
            inverted dropout just moves that constant factor into training so inference stays clean.
          </p>
        </Proof>

        <h2>Where this is heading</h2>
        <p>
          Dropout works, and the numbers say so. But &ldquo;deleting units at random helps&rdquo; is not
          an explanation — it is a result in search of one. The next three pages supply the reasons: why
          random deletion prevents units from co-adapting, how the rate <M>{String.raw`p`}</M> trades
          capacity against noise, and what actually happens at test time. Then the final page reframes all
          of it as training an ensemble of networks that share their weights.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>During a dropout forward pass with <M>{String.raw`p = 0.5`}</M>, what happens to a
                hidden unit whose mask draw is a &ldquo;drop&rdquo;?</>,
              options: [
                "Its activation is halved for that pass",
                "It outputs exactly zero and receives no gradient on the backward pass",
                "Its weights are permanently set to zero",
              ],
              answer: 1,
              explain: <>A dropped unit contributes nothing to the forward pass (output zero) and therefore
                gets no gradient signal that step. The mask is resampled next pass, so the same unit is
                very likely active again — nothing about its weights is permanently changed.</>,
            },
            {
              q: <>Why does inverted dropout multiply surviving activations by <M>{String.raw`\tfrac{1}{1-p}`}</M> during
                training?</>,
              options: [
                "To make the gradients larger so training is faster",
                "So the expected activation matches the dropout-off activation, letting test time simply use the full network with no rescaling",
                "To compensate for the learning rate being too small",
              ],
              answer: 1,
              explain: <>The scaling keeps <M>{String.raw`\mathbb{E}[\tilde{h}] = h`}</M>. Because training
                already targets the full expected activation, at test you turn dropout off and use the
                unscaled activations directly — the correctness of that is exactly what inverted dropout
                buys you.</>,
            },
            {
              q: <>On this track&rsquo;s overfitting network, dropout 0.5 reaches test 0.777 while weight decay
                stays at 0.751. What does that contrast tell you?</>,
              options: [
                "Weight decay was implemented incorrectly",
                "The binding constraint on generalisation here is not weight magnitude; dropout attacks a different constraint and so moves the number when weight decay cannot",
                "Dropout always beats weight decay on every problem",
              ],
              answer: 1,
              explain: <>Different regularisers target different failure modes. Weight decay penalises large
                weights, which is not what limits generalisation on this network. Dropout forces redundant,
                non-co-adapted representations, which is. It is a statement about this problem, not a
                universal ranking.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/nn-regularisation/landscape-effect", label: <>← The effect on the loss landscape</> }}
          next={{ href: "/learn/nn-regularisation/why-dropout-works", label: <>Next up · Why dropout works →</> }}
        />
      </div>
    </article>
  );
}
