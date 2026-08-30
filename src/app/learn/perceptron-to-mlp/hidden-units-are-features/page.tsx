import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { SpiralLab } from "@/components/labs/SpiralLab";

export const metadata = {
  title: "Hidden units are learned features — Manifold",
  description:
    "Feature engineering is the part of machine learning that requires knowing the problem. A hidden layer is that same step, written as parameters and fitted from data instead of guessed.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function HiddenUnitsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "One neuron is not enough", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 9 minutes"
        title={<>Hidden units are <em>learned features</em></>}
        intro={<>There is a way of looking at a neural network that makes almost everything about it obvious, and it
          is not the brain analogy. A network is a feature engineer bolted to a linear model, where the feature
          engineering is fitted rather than guessed.</>}
      />

      <div className="lesson">
        <h2>The move you already know</h2>
        <p>
          You have a linear model that is underperforming, and you suspect the relationship is curved. So you add a
          column: <M>{String.raw`x^2`}</M>. Or you multiply two columns together because you think they interact.
          Or you take a log, or bucket an age into bands. Then you fit the same linear model to the new columns and
          it works much better.
        </p>
        <p>
          Nothing about the model changed. You changed the <em>coordinates</em>, and a linear model in good
          coordinates beats a linear model in bad ones. That is the whole of{" "}
          <Link href="/learn/data-workflow/feature-engineering" style={link}>feature engineering</Link>, and it is
          usually the highest-leverage thing you can do.
        </p>
        <p>
          It has one problem: <strong>you have to already know which transformation to apply.</strong> That requires
          understanding the domain, and it stops working the moment the useful transformation is one no human would
          think to write down.
        </p>

        <Callout color={CORAL} title={<>The one-sentence version of a neural network</>}>
          A hidden layer is a set of features written as <em>parameters</em> instead of as code — so instead of
          guessing the transformation and fitting the model, you fit them both at once. Each hidden unit computes{" "}
          <M>{String.raw`h_j = g(\mathbf{w}_j \cdot \mathbf{x} + b_j)`}</M>, which is a new column derived from the
          old ones, and the <M>{String.raw`\mathbf{w}_j`}</M> that defines it is learned by the same gradient
          descent that fits everything else. The output layer is then an ordinary linear model on those columns.
        </Callout>

        <MathBlock>{String.raw`\underbrace{\mathbf{h} = g(W_1\mathbf{x} + \mathbf{b}_1)}_{\text{features, learned}} \qquad\qquad \underbrace{\hat{y} = \mathbf{w}_2 \cdot \mathbf{h} + b_2}_{\text{a linear model on them}}`}</MathBlock>

        <p>
          Read a network right to left and it is always the same story: a linear model at the end, and everything
          before it exists to hand that model better coordinates. In the XOR network from the last page, the hidden
          layer&rsquo;s job was to move the two positive points on top of each other. Nobody specified that. It fell
          out of minimising the loss.
        </p>

        <h2>What that buys, measured</h2>
        <p>
          Here is a problem where no reasonable person would guess the right transformation. Two spirals, wound
          around each other, 1,000 points. Both classes cover the same range of <M>{String.raw`x_1`}</M> and the same
          range of <M>{String.raw`x_2`}</M> — there is no threshold on either raw feature that tells you anything.
        </p>

        <PredictPrompt
          accent={CORAL}
          prompt={<>Logistic regression scores 0.5767 here — barely above a coin. What do you expect a network with
            two hidden layers of 64 units to reach?</>}
          options={["About the same — the features are the problem", "Around 0.75", "Above 0.90"]}
          nudge="Locked in. Now switch the lab from the linear model to the network."
        />

        <LabFrame
          accent={CORAL}
          tryThis={<>Look at the linear model&rsquo;s region first and ask what it could possibly have done better.
            Then switch to the network and look at the <em>shape</em> of the region it produced.</>}
          insight={<>0.5767 → 0.9500. But the number is not the interesting part — the <em>shape</em> is. Nobody
            gave this network a radius, an angle, or a spiral. There is no line of code anywhere that mentions polar
            coordinates. The region is what 4,417 weights settled into after being shown points and corrected, and
            it is a transformation no one would have written by hand.</>}
        >
          <SpiralLab />
        </LabFrame>

        <p>
          A domain expert <em>could</em> crack this in one line — convert to polar coordinates and the spiral becomes
          nearly linear in <M>{String.raw`(r, \theta)`}</M>. That is the honest comparison, and it is worth sitting
          with: <strong>a good hand-built feature beats a network, when you can find one.</strong> The network&rsquo;s
          advantage is not that it does better than knowledge. It is that it does not need any.
        </p>

        <h2>Why depth, then?</h2>
        <p>
          If one hidden layer already learns features, why stack more? Because the second layer&rsquo;s inputs are
          the first layer&rsquo;s features, so it builds features <em>out of features</em>. In vision this shows up
          as the textbook progression — edges, then corners and textures, then object parts — each layer composing
          what the last one found.
        </p>
        <p>
          Composition is why depth is efficient. To build &ldquo;a wheel detector&rdquo; from raw pixels in one layer,
          a unit needs to encode the whole pattern at once. Built from edge detectors that already exist, it needs
          only to describe how they arrange. The same expressiveness, at far fewer parameters — which is the real
          content of the claim that deep beats wide.
        </p>

        <Callout color={CORAL} title={<>Where this stops being free</>}>
          Learned features are not strictly better than designed ones; they are a different trade. You give up
          interpretability (there is no name for what unit 37 computes), you give up the ability to inject knowledge
          you already have, and you pay in data — a hand-built feature encodes information the network must
          otherwise infer from examples. On small tabular datasets with well-understood columns, that trade is
          usually bad, and{" "}
          <Link href="/learn/perceptron-to-mlp/where-an-mlp-loses" style={link}>the measured version of it</Link>{" "}
          is at the end of this track.
        </Callout>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>In what sense is the output layer of a network &ldquo;just a linear model&rdquo;?</>,
              options: [
                "It isn't — the activation function makes it non-linear",
                "It computes a weighted sum of the hidden features, exactly like linear regression on those columns",
                "It is linear only if the network has one hidden layer",
              ],
              answer: 1,
              explain: <>It takes <M>{String.raw`\mathbf{h}`}</M> and computes{" "}
                <M>{String.raw`\mathbf{w}_2\cdot\mathbf{h} + b_2`}</M>. What makes the whole model non-linear in{" "}
                <M>{String.raw`\mathbf{x}`}</M> is that <M>{String.raw`\mathbf{h}`}</M> is a non-linear function of{" "}
                <M>{String.raw`\mathbf{x}`}</M> — not anything the last layer does.</>,
            },
            {
              q: <>A domain expert solves the spiral problem in one line with polar coordinates. What does that say
                about the network&rsquo;s 0.9500?</>,
              options: [
                "The network was the wrong tool — the expert's feature is better",
                "Nothing much: they solve different problems. The feature needs knowledge; the network needs data",
                "The network would beat the expert's feature given more layers",
              ],
              answer: 1,
              explain: <>With the right feature in hand, use it — it is cheaper, more interpretable and needs less
                data. The network&rsquo;s claim is narrower and more useful than &ldquo;better&rdquo;: it gets there
                without anyone knowing the answer in advance, which is the only option on problems where nobody
                does.</>,
            },
            {
              q: <>Why is a deep network more parameter-efficient than a wide shallow one on structured problems?</>,
              options: [
                "Deeper networks are easier to optimise",
                "Later layers reuse the features earlier layers built, instead of re-deriving them from raw inputs",
                "Depth reduces the number of weights per layer",
              ],
              answer: 1,
              explain: <>Composition is the mechanism. A feature built from existing mid-level features only has to
                describe their arrangement, whereas the same feature built from raw inputs must encode the entire
                pattern. Depth is not <em>easier</em> to optimise — historically it was considerably harder, which is
                what initialisation and normalisation exist to fix.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/perceptron-to-mlp/two-layers-and-the-bend", label: <>← Two layers, and the bend</> }}
          next={{ href: "/learn/perceptron-to-mlp/why-non-linearity", label: <>Next up · Why non-linearity is non-negotiable →</> }}
        />
      </div>
    </article>
  );
}
