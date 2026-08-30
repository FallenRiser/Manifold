import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { GradientFlowLab } from "@/components/labs/GradientFlowLab";

export const metadata = {
  title: "What depth did to both — Manifold",
  description:
    "The same twelve-layer network, the same weights, the same data — seven activations. The gradient reaching layer one spans thirteen orders of magnitude, and the flattest profile is not the largest.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhatDepthDidPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The squashing era", color: CORAL }, { label: "Tier 2 · mechanics", color: CORAL }]}
        time="about 8 minutes"
        title={<>What depth did to both</>}
        intro={<>Sigmoid and tanh are fine activations in a two-layer network. Everything on the previous two pages
          only becomes decisive when the factors start multiplying — so here is the measurement, over the whole zoo,
          with every variable but one held fixed.</>}
      />

      <div className="lesson">
        <h2>One network, seven curves</h2>
        <p>
          A network with twelve hidden layers of sixteen units, Xavier initialisation, 400 points of two-moons data,
          and a single backward pass before any training at all. Nothing here is the fault of an optimiser or a
          learning rate — this is what the gradient looks like the moment the network is built.
        </p>

        <PredictPrompt
          accent={CORAL}
          prompt={<>Between sigmoid&rsquo;s and ReLU&rsquo;s profiles, how big is the difference in the gradient
            arriving at layer 1?</>}
          options={["A factor of about 10", "A factor of a few hundred", "Nearly a million"]}
          nudge="Locked in. Switch between the two in the lab and read the layer-1 box."
        />

        <LabFrame
          accent={CORAL}
          tryThis={<>Step through all seven. Then compare <strong>ELU</strong> and <strong>GELU</strong> — both have
            an almost perfectly flat profile, and their absolute levels differ by a factor of about 1,000.</>}
          insight={<>Two different things are visible here and they are easy to conflate. The{" "}
            <strong>shape</strong> of the profile says whether the gradient decays with depth: sigmoid&rsquo;s falls
            off a cliff, everything else is flat. The <strong>height</strong> says how large the gradient is at all,
            and it varies by four orders of magnitude among the flat ones — GELU sits near{" "}
            <M>{String.raw`10^{-4}`}</M> and ELU near <M>{String.raw`10^{-1}`}</M>. A flat profile is what you need
            for depth; it says nothing about whether your learning rate is right.</>}
        >
          <GradientFlowLab extended />
        </LabFrame>

        <h2>What the ratios say</h2>
        <p>
          The single summary number is <M>{String.raw`\text{last} \div \text{first}`}</M> — how much of the gradient
          survives the trip from the loss to the input side:
        </p>
        <ul>
          <li><strong>sigmoid: 29,000,000.</strong> Each layer back divides by roughly four, and thirteen layers of
            that is <M>{String.raw`4^{12} \approx 1.7\times10^{7}`}</M>. The measured value lands within a factor of
            two of that back-of-envelope figure, which is the point: this is not a subtle interaction, it is the
            0.25 ceiling compounding exactly as predicted.</li>
          <li><strong>tanh: 1.63. ELU: 2.11. GELU: 1.92. Swish: 1.89.</strong> Essentially flat — the gradient
            arriving at layer 1 is the same order of magnitude as at layer 13.</li>
          <li><strong>ReLU: 0.256. Leaky: 0.260.</strong> Also flat, and slightly the <em>other</em> way — the first
            layer receives about four times <em>more</em> than the last. A ratio near 1 in either direction is the
            healthy case.</li>
        </ul>

        <Callout color={CORAL} title={<>The complication that will not go away</>}>
          Open the panel at the bottom of the lab. It holds the same sigmoid network at three initialisation scales:
          <br /><br />
          <strong>Xavier → 29,000,000. Scale 0.5 → 69,000. Scale 2.0 → 65.</strong>
          <br /><br />
          Same activation, same depth, same data — and the collapse spans six orders of magnitude depending on how
          the weights happened to be drawn. Each layer&rsquo;s contribution to the backward product is{" "}
          <M>{String.raw`W^\top`}</M> <em>and</em> <M>{String.raw`f'`}</M>. The activation fixes one factor; the
          initialisation fixes the other, and at scale 2.0 the weights are large enough to compensate for
          sigmoid&rsquo;s slopes almost entirely.
          <br /><br />
          &ldquo;Sigmoid vanishes&rdquo; is a useful heuristic and an incomplete statement. The honest version is
          that <strong>the product of slopes and weights vanishes</strong>, and you are choosing only half of it.
        </Callout>

        <h2>Why this ended the squashing era</h2>
        <p>
          Between 1986 and roughly 2006, networks deeper than two or three hidden layers were widely believed not to
          work. The measurement above is why. Training such a network was not slow — the early layers received
          gradients of order <M>{String.raw`10^{-9}`}</M> and did not move at all, so the network was, in effect, a
          random projection with a trained classifier on top.
        </p>
        <p>
          The escapes came in the mid-2000s and were partly about the activation and partly not: unsupervised
          layer-wise pretraining (start the weights somewhere the gradient survives), better initialisation schemes,
          and finally ReLU, which removed the 0.25 ceiling entirely. The{" "}
          <Link href="/learn/backpropagation/why-depth-was-hard" style={link}>backpropagation track</Link> tells that
          history properly; the point here is narrower and worth stating plainly:{" "}
          <strong>the choice of hidden activation was one of the three things that had to change, and it was the
          cheapest of the three to fix.</strong>
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Two activations both show a flat gradient profile across twelve layers, but one sits at{" "}
                <M>{String.raw`10^{-1}`}</M> and the other at <M>{String.raw`10^{-4}`}</M>. What does that
                difference mean?</>,
              options: [
                "The second one is vanishing and the first is not",
                "Neither is vanishing with depth; they differ in overall gradient magnitude, which is a learning-rate question rather than a depth question",
                "The measurement is unreliable at that scale",
              ],
              answer: 1,
              explain: <>Vanishing is about the <em>shape</em> — decay from layer to layer. Both profiles are flat,
                so both are healthy in that sense. The absolute level tells you how far a step of a given size will
                move the weights, which you fix with the learning rate.</>,
            },
            {
              q: <>The same sigmoid network gives ratios of 29,000,000 and 65 under two different initialisations.
                What follows?</>,
              options: [
                "The 29,000,000 figure must be a measurement error",
                "The vanishing gradient is a property of the product of slopes and weights, so the activation determines only half of it",
                "Initialisation matters only for sigmoid networks",
              ],
              answer: 1,
              explain: <>Each layer contributes both <M>{String.raw`W^\top`}</M> and{" "}
                <M>{String.raw`f'`}</M> to the backward product. Larger initial weights partly cancel sigmoid's small
                slopes. This is precisely why initialisation is a track of its own rather than a footnote.</>,
            },
            {
              q: <>ReLU&rsquo;s ratio is 0.256 — the first layer gets about four times <em>more</em> gradient than
                the last. Is that a problem?</>,
              options: [
                "Yes — any deviation from 1.0 indicates instability",
                "No — a ratio within a small factor of 1 in either direction means the gradient is neither collapsing nor exploding with depth",
                "Yes — it means ReLU explodes",
              ],
              answer: 1,
              explain: <>The failure mode is exponential in depth. A factor of four across twelve layers is a
                per-layer factor of about 0.89 — nothing compounds dangerously. Compare sigmoid, whose per-layer
                factor of about 0.25 produces a ratio of 29 million over the same depth.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/activation-functions/tanh-and-zero-centring", label: <>← tanh &amp; zero-centring</> }}
          next={{ href: "/learn/activation-functions/relu", label: <>Next up · ReLU, and what it bought →</> }}
        />
      </div>
    </article>
  );
}
