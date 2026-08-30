import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { ChainRuleLab } from "@/components/labs/ChainRuleLab";

export const metadata = {
  title: "The chain rule, as influence — Manifold",
  description:
    "Influence multiplies along a chain. That single sentence is backpropagation, vanishing gradients and exploding gradients at once — and you can watch all three in one lab.",
};

const CORAL = "var(--c-neural)";

export default function ChainRulePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The problem", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 8 minutes"
        title={<>The chain rule, <em>as influence</em></>}
        intro={<>You learned this as a rule for differentiating nested functions and probably as something to
          memorise. There is a reading of it that makes the whole of this track obvious in advance, and it is not a
          rule at all — it is a statement about how influence travels down a chain.</>}
      />

      <div className="lesson">
        <h2>Read it as a sentence about influence</h2>
        <p>
          Turn a dial. It moves a lever. The lever moves a needle. If a full turn of the dial moves the lever 3 cm,
          and 1 cm of lever moves the needle by 2 units, then a full turn moves the needle by 6.
        </p>

        <MathBlock>{String.raw`\frac{dz}{dx} \;=\; \frac{dz}{dy}\cdot\frac{dy}{dx}`}</MathBlock>

        <p>
          <strong>Influence multiplies along a chain.</strong> Not adds — multiplies. That is the whole rule, and it
          is worth dwelling on because multiplication behaves very differently from addition when you repeat it many
          times. Add a hundred small numbers and you get a moderate number. Multiply a hundred numbers slightly less
          than one and you get something indistinguishable from zero.
        </p>

        <Callout color={CORAL} title={<>Everything in chapter 5 is already contained in that sentence</>}>
          A twelve-layer network means twelve factors multiplied together. If each is around 0.4, the product is{" "}
          <M>{String.raw`0.4^{12} \approx 1.7\times10^{-5}`}</M> — the first layer receives essentially nothing.
          That is a <strong>vanishing gradient</strong>, and it is not a mysterious pathology. It is what happens
          when you multiply. If each factor is instead around 1.5, the product is{" "}
          <M>{String.raw`1.5^{12} \approx 130`}</M>, and that is an <strong>exploding gradient</strong>. The whole
          of chapter 5 is this paragraph with measurements attached.
        </Callout>

        <h2>Watch the product</h2>
        <p>
          Below is a chain of four stages. Each computes <M>{String.raw`\tanh(g \cdot v)`}</M> — a gain, then a
          bend. You can set the input and each gain, and the lab shows every local slope, their product, and — as
          an honest check — the true end-to-end derivative obtained by nudging the input and measuring, with no
          calculus at all.
        </p>

        <PredictPrompt
          accent={CORAL}
          prompt={<>Each stage has a gain of 1.2, which is greater than 1. Will the end-to-end slope be larger or
            smaller than 1?</>}
          options={[
            "Larger — the gains are all above 1, so the product grows",
            "Smaller — tanh's own slope pulls each factor below the gain",
            "Exactly 1 — the effects cancel",
          ]}
          nudge="Locked in. Now look at the four local slopes in the lab, not just the gains."
        />

        <LabFrame
          accent={CORAL}
          tryThis={<>Compare the two readouts — they should agree at every setting. Then press{" "}
            <em>Saturate it</em> and <em>Make it explode</em>, and watch the four local slopes rather than the
            gains.</>}
          insight={<>The two numbers agree to five decimals at every setting: one from multiplying local slopes,
            one from nudging the input. That agreement is the point — <strong>the chain rule is not an
            approximation, it is bookkeeping for an exact quantity.</strong> And note that a gain of 1.2 does not
            give a local slope of 1.2: <M>{String.raw`\tanh`}</M> contributes its own factor of{" "}
            <M>{String.raw`1 - a^2`}</M>, which is at most 1 and shrinks fast once the stage saturates. Both halves
            of the product matter, which is exactly why chapter 5 blames the activation <em>and</em> the
            initialisation.</>}
        >
          <ChainRuleLab />
        </LabFrame>

        <h2>When a variable has more than one path</h2>
        <p>
          Networks are not simple chains — one hidden unit feeds every unit in the next layer, so its influence
          reaches the loss by many routes. The rule extends in the way you would hope:{" "}
          <strong>multiply along each path, then add across paths.</strong>
        </p>

        <MathBlock>{String.raw`\frac{\partial \mathcal{L}}{\partial h} \;=\; \sum_{j} \frac{\partial \mathcal{L}}{\partial z_j}\cdot\frac{\partial z_j}{\partial h}`}</MathBlock>

        <p>
          This is the multivariable chain rule, and it is the only piece of calculus in this track that goes beyond
          school. It is also the piece that becomes a matrix multiplication two pages from now — that sum over{" "}
          <M>{String.raw`j`}</M> is precisely what <M>{String.raw`\delta W^\top`}</M> computes.
        </p>

        <Proof color={CORAL} title="why the paths add rather than interfere">
          <p>
            Consider <M>{String.raw`\mathcal{L}`}</M> depending on <M>{String.raw`h`}</M> only through{" "}
            <M>{String.raw`z_1, \dots, z_m`}</M>. A small change <M>{String.raw`\Delta h`}</M> changes each{" "}
            <M>{String.raw`z_j`}</M> by approximately{" "}
            <M>{String.raw`\frac{\partial z_j}{\partial h}\Delta h`}</M>, and to first order the effects on{" "}
            <M>{String.raw`\mathcal{L}`}</M> superpose:
          </p>
          <MathBlock>{String.raw`\Delta \mathcal{L} \;\approx\; \sum_j \frac{\partial \mathcal{L}}{\partial z_j}\,\Delta z_j \;=\; \left(\sum_j \frac{\partial \mathcal{L}}{\partial z_j}\frac{\partial z_j}{\partial h}\right)\Delta h`}</MathBlock>
          <p>
            Divide by <M>{String.raw`\Delta h`}</M> and take the limit. The additivity is inherited from the
            linearity of the first-order approximation — a derivative <em>is</em> the best linear approximation, and
            linear things add.
          </p>
          <p>
            The practical consequence is worth stating: a unit&rsquo;s gradient is the <em>sum</em> of what every
            downstream consumer wants it to do. If half the next layer wants it larger and half wants it smaller,
            those cancel, and the unit receives a small gradient despite being heavily used. Small gradient does not
            mean unimportant.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why does &ldquo;influence multiplies&rdquo; make vanishing gradients unsurprising?</>,
              options: [
                "Because multiplication is slower than addition",
                "Because repeatedly multiplying factors below 1 shrinks toward zero exponentially in depth",
                "Because the chain rule is only an approximation over many layers",
              ],
              answer: 1,
              explain: <>Twelve factors of 0.4 give <M>{String.raw`1.7\times10^{-5}`}</M>. Nothing is malfunctioning
                — it is arithmetic. The chain rule is exact at any depth, which is precisely why the shrinking is
                real rather than an artefact.</>,
            },
            {
              q: <>A hidden unit feeds ten units in the next layer. How is its gradient formed?</>,
              options: [
                "Take the largest of the ten contributions",
                "Multiply the ten contributions together",
                "Sum the ten path contributions, each being a downstream gradient times a local derivative",
              ],
              answer: 2,
              explain: <>Multiply along a path, add across paths. Multiplying the ten would be wrong dimensionally
                and would make a unit with many consumers have a vanishing gradient by construction.</>,
            },
            {
              q: <>In the lab, a gain of 1.2 produced a local slope well below 1.2. Why?</>,
              options: [
                "The lab clips the slope for display",
                "Each stage contributes two factors — the gain and tanh's own slope, which is at most 1",
                "The finite-difference check is inaccurate",
              ],
              answer: 1,
              explain: <>The stage is <M>{String.raw`\tanh(g\cdot v)`}</M>, so its derivative is{" "}
                <M>{String.raw`g\cdot(1 - a^2)`}</M>. The second factor never exceeds 1 and collapses once the stage
                saturates — which is the mechanism behind the sigmoid results measured in chapter 5.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/backpropagation/the-cost-of-a-gradient", label: <>← The cost of a gradient</> }}
          next={{ href: "/learn/backpropagation/the-computational-graph", label: <>Next up · The computational graph →</> }}
        />
      </div>
    </article>
  );
}
