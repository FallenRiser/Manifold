import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { ActivationBakeoffLab } from "@/components/labs/ActivationBakeoffLab";

export const metadata = {
  title: "The bakeoff — Manifold",
  description:
    "Same data, same network, same optimiser, five seeds, swap only the activation. One result is decisive and the rest are inside the noise — and that shape is the finding.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function BakeoffPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The smooth moderns", color: CORAL }, { label: "Tier 2 · evidence", color: CORAL }]}
        time="about 8 minutes"
        title={<>The bakeoff</>}
        intro={<>Seven activations, one problem, one network, five random seeds each, and nothing else changed. This
          is the page that decides how much of the previous six is worth acting on — and the answer is smaller than
          the amount of writing devoted to it, this track included.</>}
      />

      <div className="lesson">
        <h2>The setup</h2>
        <p>
          Two interleaved spirals — a problem that genuinely needs hidden layers; logistic regression scores{" "}
          <Link href="/learn/perceptron-to-mlp/where-an-mlp-wins" style={link}>0.577 on the same construction</Link>{" "}
          in the previous track. Adam at a learning rate of 0.005, 1,500 steps, run at two depths. Each activation is run with five
          different random initialisations, and both the mean and the <em>range</em> across those five are reported,
          because a single run cannot distinguish anything here.
        </p>

        <PredictPrompt
          accent={CORAL}
          prompt={<>Seven activations, five seeds each. How many of the seven are separated by more than their own
            seed-to-seed spread?</>}
          options={["All seven — the ranking is clear", "About three", "One"]}
          nudge="Locked in. Read the pale bars, not the numbers."
        />

        <LabFrame
          accent={CORAL}
          tryThis={<>Look at the pale bars first and the point values second. Then switch to{" "}
            <strong>10 hidden layers</strong> and watch which rows move.</>}
          insight={<>Only <strong>sigmoid</strong> is unambiguously separated — 0.579 shallow and 0.606 deep, roughly
            0.3 behind everything else, with a spread nowhere near large enough to explain it. Among the other six,
            the shallow gap from ReLU (0.784) to Swish (0.886) is 0.102 and ReLU&rsquo;s own five seeds span 0.114.
            <strong> A single-seed comparison between those two would have been a coin flip.</strong></>}
        >
          <ActivationBakeoffLab />
        </LabFrame>

        <h2>Three things the data says</h2>
        <p>
          <strong>1. There is one real decision here, and it is &ldquo;not sigmoid&rdquo;.</strong> At depth it does
          not train at all: the loss sits at 0.6447 from step 300 to step 1,500 without moving. Predicting a constant
          on this balanced problem gives <M>{String.raw`\log 2 = 0.693`}</M>, so the network has improved on
          &ldquo;guess nothing&rdquo; by 0.048 and then stopped — the output layer moved, and ten hidden layers
          contributed nothing. This is the 0.25 ceiling from four pages back, in a form you can watch happen.
        </p>
        <p>
          <strong>2. Depth rescued the ReLU family and hurt sigmoid.</strong> ReLU climbs from 0.784 to 0.839 and
          Leaky from 0.789 to 0.846 when the network goes from two hidden layers to ten. Sigmoid goes from bad to
          non-functional. Depth amplifies whatever the per-layer factor is doing — in both directions.
        </p>
        <p>
          <strong>3. At depth the six survivors collapse into a band of 0.047</strong> — narrower than the seed
          spreads of several of them. Once the gradient flows at all, which activation is delivering it stops
          mattering very much.
        </p>

        <Callout color={CORAL} title={<>The one difference that is not noise</>}>
          Look at the spread column rather than the mean. Swish&rsquo;s five shallow seeds span{" "}
          <strong>0.019</strong>; ReLU&rsquo;s span <strong>0.114</strong>, six times as wide.
          <br /><br />
          That is a real and reproducible difference in <em>reliability</em>, and it is exactly what the
          dead-unit mechanism predicts: an activation that can lose a third of its units on an unlucky
          initialisation has more ways to go wrong than one that cannot lose any. When people report that the smooth
          moderns &ldquo;just work better&rdquo;, this — rather than a higher ceiling — is the most defensible
          version of that claim.
        </Callout>

        <h2>What a benchmark like this cannot tell you</h2>
        <p>
          Being clear about the limits is part of reading the result honestly:
        </p>
        <ul>
          <li><strong>One problem, two dimensions, 600 points.</strong> Spirals are a shape-learning task, not
            ImageNet and not language. Nothing here transfers automatically to a scale where a 0.3% gain is worth
            millions of dollars of compute.</li>
          <li><strong>No normalisation layers.</strong> That is deliberate — it isolates the activation — but it also
            means the zero-centring and saturation effects are visible in their rawest form. Add batch norm and
            several of these differences shrink further.</li>
          <li><strong>One optimiser at one learning rate.</strong> Adam adapts per-parameter step sizes, which
            partly compensates for gradient-magnitude differences between activations. Under plain SGD the gaps
            would look different, and the{" "}
            <Link href="/learn/activation-functions/dying-relu" style={link}>dying-ReLU page</Link> — which does use
            plain SGD — shows a different ordering.</li>
          <li><strong>Five seeds is few.</strong> Enough to show that the spread is comparable to the gaps, which is
            the finding; not enough to rank the six survivors reliably, which is why this page does not.</li>
        </ul>

        <Callout color={CORAL} title={<>The transferable habit</>}>
          The reason this page exists is not the ranking. It is the method:{" "}
          <strong>run the comparison several times with different seeds and report the spread beside the
          mean.</strong> Nearly every activation paper reports single runs, and with spreads of 0.11 on a problem
          this small, single runs can demonstrate almost any ordering you like.
          <br /><br />
          Apply the same standard to your own comparisons. If the gap between two options is smaller than the range
          you get from re-seeding one of them, you have not measured a difference — and you have saved yourself the
          work of chasing it.
        </Callout>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Swish scores 0.886 and ReLU 0.784 in the shallow bakeoff, a gap of 0.102. ReLU&rsquo;s five seeds
                span 0.114. What can you conclude?</>,
              options: [
                "Swish is better than ReLU on this problem",
                "The gap is within the range one activation produces from re-seeding alone, so five seeds cannot separate them",
                "The experiment was run incorrectly",
              ],
              answer: 1,
              explain: <>When the gap is the size of the noise, the ranking is not supported. What <em>is</em>{" "}
                supported is the difference in spread — 0.019 against 0.114 — which is a claim about consistency
                rather than about ceiling.</>,
            },
            {
              q: <>At ten hidden layers, sigmoid&rsquo;s training loss is flat at 0.645 from step 300 onward. What is
                happening?</>,
              options: [
                "It has converged to a good solution",
                "The gradient reaching the hidden layers is negligible, so only the output layer is effectively learning",
                "The learning rate is too high",
              ],
              answer: 1,
              explain: <>A loss pinned near the value achievable without hidden layers, unmoving over 1,200 steps, is
                the vanishing gradient in its final form. The measurement four pages back gives the mechanism: a
                29-million-fold reduction between the last layer and the first.</>,
            },
            {
              q: <>Why does this page report the seed spread beside every mean?</>,
              options: [
                "For completeness, though the means are what matter",
                "Because the spreads are the same size as the gaps between activations, so a mean without a spread would present noise as a result",
                "Because Adam is stochastic",
              ],
              answer: 1,
              explain: <>This is the methodological point of the page. Reporting a single run per activation on a
                problem with spreads of 0.11 would let you demonstrate almost any ranking, which is roughly what the
                literature on activations looks like.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/activation-functions/the-rest-of-the-zoo", label: <>← The rest of the zoo</> }}
          next={{ href: "/learn/activation-functions/the-property-space", label: <>Next up · The property space →</> }}
        />
      </div>
    </article>
  );
}
