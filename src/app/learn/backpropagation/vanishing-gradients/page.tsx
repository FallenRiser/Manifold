import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { GradientFlowLab } from "@/components/labs/GradientFlowLab";

export const metadata = {
  title: "Vanishing gradients — Manifold",
  description:
    "The gradient at the first layer of a 12-layer sigmoid network is 29 million times smaller than at the last. Measured, not asserted — and the initialisation turns out to matter as much as the activation.",
};

const CORAL = "var(--c-neural)";

export default function VanishingGradientsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "When gradients misbehave", color: CORAL }, { label: "Tier 2 · mechanics", color: CORAL }]}
        time="about 9 minutes"
        title={<>Vanishing gradients</>}
        intro={<>The most consequential failure in the history of neural networks, and the one that kept them
          shallow for twenty years. It is not subtle once you can see it — which is exactly the problem, because
          for a long time nobody was looking.</>}
      />

      <div className="lesson">
        <h2>It follows from BP2 and nothing else</h2>
        <p>
          The delta recursion multiplies by two things on every layer it passes back through: the weights, and the
          activation&rsquo;s local slope.
        </p>

        <MathBlock>{String.raw`\boldsymbol{\delta}^{(\ell)} \;=\; \big(\boldsymbol{\delta}^{(\ell+1)} W^{(\ell+1)\top}\big) \odot g'\!\big(\mathbf{z}^{(\ell)}\big)`}</MathBlock>

        <p>
          Unroll it across <M>{String.raw`L`}</M> layers and the gradient at the front is the gradient at the back
          multiplied by a long product. Now put a number on <M>{String.raw`g'`}</M> for a sigmoid:
        </p>

        <MathBlock>{String.raw`\sigma'(z) = \sigma(z)\big(1-\sigma(z)\big) \qquad\Longrightarrow\qquad \max_z \sigma'(z) = 0.25`}</MathBlock>

        <p>
          <strong>At its very best, a sigmoid multiplies the gradient by 0.25.</strong> Not on average, not when
          saturated — at the single most favourable point on the curve, <M>{String.raw`z = 0`}</M>. Everywhere else
          it is smaller. Twelve layers of that is <M>{String.raw`0.25^{12} \approx 6\times10^{-8}`}</M> from the
          activation alone, before the weights have contributed anything.
        </p>

        <PredictPrompt
          accent={CORAL}
          prompt={<>A 12-hidden-layer network, freshly initialised, one backward pass. How does the gradient norm at
            layer 1 compare with layer 13, for sigmoid?</>}
          options={[
            "Roughly the same — it is one backward pass, before any training",
            "A few times smaller",
            "Smaller by many orders of magnitude",
          ]}
          nudge="Locked in. Note the axis on the chart is logarithmic before you read it."
        />

        <LabFrame
          accent={CORAL}
          tryThis={<>Compare sigmoid with tanh and ReLU — the axis is logarithmic, so each gridline is a factor of a
            hundred. Then open the panel underneath and change the initialisation instead of the activation.</>}
          insight={<>Sigmoid&rsquo;s gradient at layer 1 is <strong>6.9 × 10<sup>−9</sup></strong> against{" "}
            <strong>2.0 × 10<sup>−1</sup></strong> at layer 13 — a ratio of <strong>29 million</strong>. tanh comes
            in at 1.63 and ReLU at 0.255, both essentially flat. But the panel underneath is the part that
            complicates the slogan: the <em>same sigmoid network</em> at three initialisation scales ranges from 29
            million down to <strong>65</strong>. The product that vanishes has two factors, and the popular story
            only names one of them.</>}
        >
          <GradientFlowLab />
        </LabFrame>

        <h2>What that ratio means in practice</h2>
        <p>
          The first layer&rsquo;s weights receive updates 29 million times smaller than the last layer&rsquo;s. With
          any sane learning rate, the last layers train and the first layers are effectively frozen at their random
          initial values.
        </p>
        <p>
          Which produces a specific and confusing symptom: <strong>the network trains.</strong> The loss falls, the
          accuracy improves — the final layers are learning to make the best of whatever random features the frozen
          early layers happen to produce. You have paid for a twelve-layer network and are training the last two,
          on top of a random projection. Nothing errors, and adding depth makes it quietly worse rather than better.
        </p>

        <Callout color={CORAL} title={<>Why this is not simply &ldquo;sigmoid is bad&rdquo;</>}>
          The measured ratios for the same architecture with only the initialisation changed:{" "}
          <strong>2.9 × 10<sup>7</sup></strong> (Xavier), <strong>6.9 × 10<sup>4</sup></strong> (scale 0.5),{" "}
          <strong>65</strong> (scale 2.0). Six orders of magnitude, from a single constant.
          <br /><br />
          The reason is that the vanishing product has two factors per layer — <M>{String.raw`g'`}</M> and{" "}
          <M>{String.raw`W`}</M> — and they multiply. Small weights make it worse; larger weights partly cancel
          the activation&rsquo;s shrinkage. That is precisely the insight behind Xavier and He initialisation, which
          choose the weight scale so the product stays near 1. <strong>Activation choice and initialisation are two
          answers to the same equation</strong>, which is why they are so often discussed together — and why they
          are consecutive tracks in this family.
        </Callout>

        <h2>Why ReLU helps so much</h2>
        <p>
          ReLU&rsquo;s derivative is exactly 1 wherever the unit is on, and 0 where it is off. There is no
          shrinking factor at all on the active path — the gradient passes through unattenuated.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 520 }}>
            <thead>
              <tr>
                {["activation", "max slope", "slope when saturated", "measured ratio over 13 layers"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "7px 20px 7px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["sigmoid", "0.25", "→ 0", "2.9 × 10⁷"],
                ["tanh", "1.0", "→ 0", "1.63"],
                ["ReLU", "1.0", "exactly 0, or exactly 1", "0.255"],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((c, j) => (
                    <td key={j} style={{ padding: "7px 20px 7px 0", color: j === 3 ? (i === 0 ? "var(--bad)" : "var(--good)") : "var(--ink)", borderBottom: "1px solid var(--border)" }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          tanh&rsquo;s maximum slope is 1 rather than 0.25, and it is zero-centred, which is why it was the better
          choice long before ReLU arrived — and the measurement bears that out, at 1.63 rather than 29 million. But
          it still saturates, so its slope collapses for large inputs. ReLU&rsquo;s trade is blunt and effective:
          perfect gradient flow on the active side, and none at all on the other. That second half is the dying-ReLU
          problem, and it is the price.
        </p>

        <h2>How to see it in your own model</h2>
        <p>
          One line, and it turns the most confusing symptom in training into a number:
        </p>
        <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 10, padding: "12px 16px", margin: "1.2rem 0", fontFamily: "ui-monospace, monospace", fontSize: 13, color: "var(--ink)", overflowX: "auto" }}>
          for name, p in model.named_parameters():<br />
          &nbsp;&nbsp;&nbsp;&nbsp;print(name, p.grad.norm().item())
        </div>
        <p>
          Read it after one backward pass. If the norms fall by orders of magnitude as you move toward the input,
          you have a vanishing gradient — and you now have four things to try, in the order the evidence supports:
          change the activation, fix the initialisation scale, add normalisation, or add residual connections. The
          last two get their own treatment; the first two are the next tracks in this family, and both exist
          because of the number in this lab.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why is the sigmoid&rsquo;s <em>maximum</em> derivative the damaging fact?</>,
              options: [
                "Because 0.25 is the best case — every layer multiplies the gradient by at most a quarter",
                "Because it occurs at z = 0, which is rare",
                "Because it makes the forward pass slow",
              ],
              answer: 0,
              explain: <>Even in the most favourable circumstance the gradient shrinks fourfold per layer, and away
                from <M>{String.raw`z=0`}</M> it shrinks faster. There is no configuration in which a deep sigmoid
                stack preserves gradient magnitude.</>,
            },
            {
              q: <>Changing only the initialisation scale moved the sigmoid ratio from 2.9 × 10⁷ to 65. What does
                that tell you?</>,
              options: [
                "The measurement is unreliable",
                "The vanishing product has two factors per layer — the slope and the weights — and both matter",
                "Sigmoid is fine and initialisation is the only real issue",
              ],
              answer: 1,
              explain: <>BP2 multiplies by <M>{String.raw`W^\top`}</M> and by <M>{String.raw`g'`}</M>, so the
                weight scale is half the product. That is the reasoning behind Xavier and He initialisation. It does
                not exonerate sigmoid — even at the best scale it is far worse than tanh or ReLU — but &ldquo;sigmoid
                vanishes&rdquo; is an incomplete account.</>,
            },
            {
              q: <>A deep sigmoid network trains and reaches reasonable accuracy. Does that rule out vanishing
                gradients?</>,
              options: [
                "Yes — a vanishing gradient would prevent learning",
                "No — the later layers still learn, on top of early layers frozen at their random initialisation",
                "Yes, provided the loss reaches a low value",
              ],
              answer: 1,
              explain: <>This is what makes it so hard to spot. The final layers train perfectly well using whatever
                random features the frozen early layers produce, so the loss falls and nothing errors. The tell is
                that adding depth stops helping — and the diagnosis is one line printing per-layer gradient
                norms.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/backpropagation/saddles-and-plateaus", label: <>← Saddles, plateaus &amp; why noise helps</> }}
          next={{ href: "/learn/backpropagation/exploding-gradients", label: <>Next up · Exploding gradients &amp; clipping →</> }}
        />
      </div>
    </article>
  );
}
