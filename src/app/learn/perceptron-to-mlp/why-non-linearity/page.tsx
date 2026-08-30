import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { PredictPrompt } from "@/components/PredictPrompt";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LinearCollapseLab } from "@/components/labs/LinearCollapseLab";

export const metadata = {
  title: "Why non-linearity is non-negotiable — Manifold",
  description:
    "Remove the activation functions and a hundred-layer network is algebraically identical to a single matrix. Measured: 1,761 parameters collapsing to 5, agreeing to four parts in ten trillion.",
};

const CORAL = "var(--c-neural)";

export default function WhyNonLinearityPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "One neuron is not enough", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 8 minutes"
        title={<>Why non-linearity is <em>non-negotiable</em></>}
        intro={<>Everything so far has said that stacking layers is what buys you power. That is not quite true, and
          the gap matters more than almost anything else in this track: stacking layers, by itself, buys nothing at
          all.</>}
      />

      <div className="lesson">
        <h2>The claim</h2>
        <p>
          Take a network of any depth. Remove the activation functions — each layer just computes{" "}
          <M>{String.raw`W\mathbf{x} + \mathbf{b}`}</M> and passes it on. That network is <strong>exactly
          equivalent to a single layer</strong>. Not approximately, not usually, not for most inputs. It is the same
          function, and you can find the single equivalent layer with a few matrix multiplications.
        </p>

        <MathBlock>{String.raw`W_3(W_2(W_1\mathbf{x} + \mathbf{b}_1) + \mathbf{b}_2) + \mathbf{b}_3 \;=\; \underbrace{(W_3W_2W_1)}_{\text{one matrix}}\mathbf{x} + \underbrace{(W_3W_2\mathbf{b}_1 + W_3\mathbf{b}_2 + \mathbf{b}_3)}_{\text{one vector}}`}</MathBlock>

        <p>
          Multiply the matrices out, fold the biases together, and there is nowhere for the extra capacity to hide.
          A composition of linear maps is a linear map. It is one of the first facts in linear algebra, and here it
          has teeth: <strong>without a non-linearity, a 100-layer network with ten million parameters can express
          exactly what logistic regression can express, and nothing more.</strong>
        </p>

        <PredictPrompt
          accent={CORAL}
          prompt={<>Below is a 1 → 4 → 4 → 1 network with 33 parameters, plotted as output against input, with the
            activation switched off. What will the curve look like?</>}
          options={[
            "A gentle curve — three layers must bend something",
            "A jagged piecewise shape",
            "A perfectly straight line, for every setting of the weights",
          ]}
          nudge="Locked in. Now re-roll the weights a few times below."
        />

        <LabFrame
          accent={CORAL}
          tryThis={<>Press <em>New random weights</em> six or seven times with the activation off. Then turn the
            activation on and press it a few more times.</>}
          insight={<>Straight, every time, no matter what the 33 numbers are — and the readout confirms it: the
            distance from a straight line stays at floating-point noise, around 10<sup>−15</sup>, while turning the
            activation on sends it to single digits. Turn it on and the same weights produce kinks. Each kink is exactly where one hidden unit crosses zero and
            switches on, which is why a ReLU network&rsquo;s output is piecewise linear: <strong>the bends are not
            smooth curvature, they are the seams between linear pieces.</strong></>}
        >
          <LinearCollapseLab />
        </LabFrame>

        <h2>The same thing, at scale</h2>
        <p>
          The lab is exact arithmetic on a toy. Here is the identical check on a network with three hidden layers
          and 1,761 parameters, evaluated over 500 random inputs:
        </p>

        <CodeBlock
          language="Python"
          fromScratch={`# three hidden layers, no activation anywhere
deep = ((((X @ W1 + b1) @ W2 + b2) @ W3 + b3) @ W4 + b4)

# the single layer it collapses to, obtained by multiplying the matrices out
W = W1 @ W2 @ W3 @ W4
b = b1 @ W2 @ W3 @ W4 + b2 @ W3 @ W4 + b3 @ W4 + b4
flat = X @ W + b

print("max |difference| over 500 inputs:", np.max(np.abs(deep - flat)))`}
        />
        <CodeOutput>{`max |difference| over 500 inputs: 3.979e-13`}</CodeOutput>

        <p>
          Four parts in ten trillion — the accumulated rounding error of doing the arithmetic in two different
          orders. <strong>1,761 parameters, and 5 of them would have done.</strong>
        </p>

        <h2>And what it costs on a real task</h2>
        <p>
          The algebra says the capacity is wasted. Here is what that looks like as a score. Two moons, 600 points,
          a 35% test split, a 64–64 network fitted twice — once with <code>activation=&quot;identity&quot;</code>,
          once with <code>relu</code>:
        </p>

        <CodeOutput>{`64-64 net, activation='identity' : test acc 0.8571
logistic regression (5 params)   : test acc 0.8571
64-64 net, activation='relu'     : test acc 0.9143`}</CodeOutput>

        <p>
          The activation-free network and logistic regression do not merely score similarly. They score{" "}
          <strong>identically, to four decimal places</strong>, because on this split they are the same classifier
          wearing 4,417 parameters instead of 5. Switching one argument from <code>identity</code> to{" "}
          <code>relu</code> — changing no architecture, no data, no training budget — is worth{" "}
          <strong>+0.0572</strong>.
        </p>

        <Callout color={CORAL} title={<>The one property an activation must have</>}>
          It must be <strong>non-linear</strong>. That is the entire non-negotiable requirement, and it is a very low
          bar — almost any bend will do, which is why the field has such a long list of activations that all work
          roughly as well. Everything else people argue about (does it saturate, is it zero-centred, is it smooth,
          does it die) is about how easily the network <em>trains</em>, not about what it can represent. Those are
          the subject of the{" "}
          <strong>Activation functions</strong> track; this page is only claiming that the slot cannot be empty.
        </Callout>

        <Proof color={CORAL} title="why any linear activation collapses too, not just the identity">
          <p>
            Suppose the activation is <M>{String.raw`g(z) = \alpha z + \beta`}</M> — any straight line, not
            necessarily the identity. Then a layer computes
          </p>
          <MathBlock>{String.raw`g(W\mathbf{x} + \mathbf{b}) = \alpha W\mathbf{x} + \alpha\mathbf{b} + \beta\mathbf{1} = W'\mathbf{x} + \mathbf{b}'`}</MathBlock>
          <p>
            with <M>{String.raw`W' = \alpha W`}</M> and{" "}
            <M>{String.raw`\mathbf{b}' = \alpha\mathbf{b} + \beta\mathbf{1}`}</M>. The layer is <em>still</em> an
            affine map, just with different constants — so composing them collapses exactly as before.
          </p>
          <p>
            This closes a tempting loophole: scaling the activation, or adding a constant to it, does not rescue
            anything. The requirement is genuinely non-linearity, not merely &ldquo;not the identity function&rdquo;.
          </p>
          <p>
            It also explains why the bar is so low in the other direction. The set of linear functions is
            vanishingly small inside the set of all functions, so essentially <em>any</em> bend you pick lands
            outside it. ReLU — the flattest, cheapest, least sophisticated bend available, a single kink at zero —
            is enough, and is the default in most networks today.
          </p>
        </Proof>

        <h2>Where the chapter lands</h2>
        <p>
          Two arguments, one conclusion. Geometrically, one neuron draws a half-plane and XOR needs something that
          is not a half-plane. Algebraically, stacking half-planes without a bend gives you a half-plane again. Both
          say the same thing: <strong>the power is in the composition of linear maps with non-linearities, and
          removing either ingredient collapses the model back to a line.</strong>
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Someone builds a 50-layer network with <code>activation=&quot;identity&quot;</code> and finds it
                scores the same as logistic regression. What happened?</>,
              options: [
                "It underfitted and needs more training",
                "It is mathematically identical to logistic regression — the layers multiplied out",
                "Fifty layers is too deep and the gradients vanished",
              ],
              answer: 1,
              explain: <>The composition collapses to a single affine map, so it cannot express anything logistic
                regression cannot. This is not a training problem, and no amount of extra epochs, data or width
                changes it — the model class itself is the same one.</>,
            },
            {
              q: <>Would using <M>{String.raw`g(z) = 3z + 1`}</M> as the activation fix the collapse?</>,
              options: [
                "Yes — it is not the identity function",
                "No — any affine activation still composes into a single affine map",
                "Only if the bias terms are removed",
              ],
              answer: 1,
              explain: <>Substituting gives <M>{String.raw`3W\mathbf{x} + 3\mathbf{b} + \mathbf{1}`}</M>, which is
                still of the form <M>{String.raw`W'\mathbf{x} + \mathbf{b}'`}</M>. The requirement is non-linearity;
                &ldquo;differs from the identity&rdquo; is not the same condition.</>,
            },
            {
              q: <>Why is a ReLU network&rsquo;s output made of straight segments rather than smooth curves?</>,
              options: [
                "Because ReLU itself is piecewise linear, so the whole composition is",
                "Because of numerical rounding in the forward pass",
                "It isn't — ReLU networks produce smooth curves",
              ],
              answer: 0,
              explain: <>Between the points where units switch on and off, every unit is in a fixed linear regime, so
                the network is exactly affine there. The kinks are the seams where a unit crosses zero — visible in
                the lab the moment you turn the activation on.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/perceptron-to-mlp/hidden-units-are-features", label: <>← Hidden units are learned features</> }}
          next={{ href: "/learn/perceptron-to-mlp/a-layer-is-a-matrix-multiply", label: <>Next up · A layer is a matrix multiply →</> }}
        />
      </div>
    </article>
  );
}
