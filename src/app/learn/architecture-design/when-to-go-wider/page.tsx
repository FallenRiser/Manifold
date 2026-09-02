import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "When to go wider — Manifold",
  description:
    "Width is the safest capacity knob, but only when the diagnosis calls for capacity. Here is the decision rule: when widening helps, when it wastes parameters, and why it comes before depth in the troubleshooting order.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhenToGoWiderPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Width", color: CORAL }, { label: "Tier 1 · intuition", color: CORAL }]}
        time="about 8 minutes"
        title={<>When to go wider</>}
        intro={<>The width plateau showed you when more width stops helping. This page gives you
          the other side: the diagnostic rule for when width is the right thing to increase, when
          it is the wrong thing, and why it belongs first in the troubleshooting order.</>}
      />

      <div className="lesson">
        <h2>The diagnostic framework</h2>
        <p>
          Every architecture decision is a response to a diagnosis, and the diagnosis comes from
          two numbers: training performance and test performance. The relationship between them
          tells you which knob to turn.
        </p>
        <p>
          There are three regimes. In the first, both training and test performance are poor — the
          model cannot fit the data at all. In the second, training performance is good but test
          performance is poor — the model fits the training data but fails to generalise. In the
          third, both are good and close together — the model is working and there is nothing
          obvious to fix.
        </p>
        <p>
          Width is the right move in exactly the first regime. It is the wrong move in the second.
          And it is irrelevant in the third.
        </p>

        <h2>When to go wider: high training loss</h2>
        <p>
          If the model cannot fit the training data — training loss stays high, training accuracy
          stays low — the most likely explanation is that the model lacks the capacity to represent
          the decision boundary. The function the network is trying to learn requires more features
          than the current width provides, and no amount of training will overcome that.
        </p>
        <p>
          On the two-moons problem, a depth-2 network with width 2 reaches test accuracy 0.793. The
          training accuracy is around 0.83 — not even close to memorising the training set. The
          boundary requires more than two features per layer to represent, and the gap between what
          the network can express and what the data requires is the bottleneck. Doubling to width 4
          lifts test accuracy to 0.879 and training accuracy to roughly 0.93. Doubling again to
          width 8 brings test to 0.893 and training to 0.96. Each doubling closes the
          representational gap, and the test accuracy follows.
        </p>
        <p>
          The signal is in the training curve, not the test curve. If the training loss is not
          decreasing, or if it decreases but plateaus well above zero, the model is underfitting.
          The fix is more capacity, and width is the simplest way to provide it.
        </p>

        <h2>When to go wider: small train-test gap, both low</h2>
        <p>
          A subtler case. The training accuracy is 0.87, the test accuracy is 0.85. The gap is 0.02,
          which means the model is not overfitting — it generalises almost everything it learns. But
          both numbers are low. The model is well-calibrated but weak.
        </p>
        <p>
          This is still underfitting, even though the classic symptom (high training accuracy, low
          test accuracy) is absent. The model has not memorised the training data, the gap says it
          would generalise if it learned more, and it has not learned more because it does not have
          the capacity to. Width is the right move here too.
        </p>

        <Callout color={CORAL} title={<>The rule: go wider when the model cannot fit the training data</>}>
          The decision is always about training performance, not test performance. If training
          accuracy is high and test accuracy is low, the model has enough capacity — too much, in
          fact — and more width will make overfitting worse. If training accuracy is low, the model
          needs more capacity, and width is the safest way to provide it.
          <br /><br />
          Concretely: if training loss is still decreasing at the end of training, run more epochs
          first. If it has plateaued and training accuracy is still below where you need it, double
          the width.
        </Callout>

        <h2>When not to go wider: large train-test gap</h2>
        <p>
          If training accuracy is 0.99 and test accuracy is 0.85, the gap is 0.14. The model has
          memorised the training data but is not generalising. This is overfitting, and the diagnosis
          is too much capacity relative to the data, not too little.
        </p>
        <p>
          Making the network wider in this regime gives the model even more capacity to memorise
          the training data, and the test accuracy will stay the same or get worse. The fix is in
          the opposite direction: regularisation (dropout, weight decay, data augmentation) to
          constrain the model, or more training data to justify the capacity it already has.
        </p>
        <p>
          The measured width sweep illustrates this indirectly. At depth 2 and width 16, training
          accuracy is already 0.99+. Going to width 512 does not improve test accuracy (0.946 to
          0.950, within noise) because the training fit was already saturated. If the test accuracy
          had been 0.80 instead of 0.946, that same widening would have made the gap worse: the
          training accuracy would stay at 0.99+ while the test accuracy stagnated or declined, because
          the extra capacity would absorb the noise in the training set rather than learning the
          boundary.
        </p>

        <h2>Width before depth: the troubleshooting order</h2>
        <p>
          When you have diagnosed underfitting and need more capacity, width should come before depth
          in the troubleshooting order. This is not because width is always better — depth is often
          the more powerful capacity increase — but because width is <em>safer</em>.
        </p>
        <p>
          Adding depth changes the optimisation problem in ways that adding width does not. A deeper
          network introduces longer gradient paths, which can vanish or explode. It typically
          requires adjusting the learning rate, the initialisation scheme, and sometimes the
          architecture itself (batch normalisation, residual connections). A failed experiment with
          added depth might fail because depth was wrong or because the training setup was not
          adapted for the new depth — and distinguishing the two requires additional experiments.
        </p>
        <p>
          Adding width, by contrast, is a local change. The gradient paths are the same length. The
          same learning rate, initialisation, and training schedule work. If widening does not
          improve training accuracy, the conclusion is clean: width is not the bottleneck. If adding
          depth does not improve training accuracy, the conclusion is ambiguous: either depth is not
          the bottleneck, or it is, but the training setup is not adequate for the deeper network.
        </p>

        <MathBlock>{String.raw`\text{try width first} \;\Rightarrow\; \begin{cases} \text{training improves} & \Rightarrow \text{width was the bottleneck} \\ \text{training unchanged} & \Rightarrow \text{width is not the bottleneck; try depth} \end{cases}`}</MathBlock>

        <p>
          The logic is about interpretability of the experiment, not about which is &ldquo;better.&rdquo;
          Width gives a clean signal. Depth gives an ambiguous one. Run the clean experiment first.
        </p>

        <h2>The practical protocol</h2>
        <p>
          The protocol is four steps and costs two training runs beyond the baseline.
        </p>
        <p>
          <strong>Step 1: Train the baseline.</strong> Record training accuracy and test accuracy at
          convergence. If both are satisfactory, stop — the architecture is adequate.
        </p>
        <p>
          <strong>Step 2: Check the training accuracy.</strong> If training accuracy is already near
          1.0, widening will not help. The model can already fit the training data; the gap between
          training and test is a generalisation problem, not a capacity problem. Skip to
          regularisation or data.
        </p>
        <p>
          <strong>Step 3: Double the width.</strong> Retrain with everything else held constant — same
          learning rate, same epochs, same seed set. Compare training accuracy. If it improved, width
          was the bottleneck, and you can double again if training accuracy is still below target. If
          it did not improve, width is not the bottleneck.
        </p>
        <p>
          <strong>Step 4: If width did not help, try depth.</strong> This is where you accept the
          higher experiment cost — adjusting learning rate and possibly adding normalisation — because
          the clean experiment already told you width was not the answer. You now know the bottleneck
          is either in the network&rsquo;s compositional structure (depth) or somewhere outside the
          architecture entirely (data, features, task formulation).
        </p>

        <Proof color={CORAL} title="why width does not create gradient pathologies">
          <p>
            The gradient of the loss with respect to a weight in layer <M>{String.raw`\ell`}</M>{" "}
            involves a product of Jacobians along the path from the loss back to that layer. The
            length of that product is the depth of the network — the number of layers between the
            output and the weight. Adding width to layer <M>{String.raw`\ell`}</M> does not change
            the number of layers, so the product has the same number of factors.
          </p>
          <p>
            What changes is the <em>shape</em> of the Jacobian at layer <M>{String.raw`\ell`}</M>:
            it becomes a larger matrix. But the spectral properties that govern gradient flow —
            whether the Jacobian&rsquo;s singular values are near 1 or near 0 — depend on the
            initialisation and the activation, not on the width per se. With standard initialisation
            (He or Xavier), wider layers have the same expected gradient magnitude as narrower ones
            because the initialisation scales the variance inversely with the fan-in.
          </p>
          <p>
            Adding depth, by contrast, adds another factor to the product. Even if each factor is
            well-conditioned, the product of many factors can diverge or vanish exponentially with
            the number of factors. This is the fundamental asymmetry: width adds capacity without
            lengthening the gradient path, while depth adds capacity <em>by</em> lengthening the
            gradient path.
          </p>
        </Proof>

        <h2>Summary of the decision rule</h2>
        <p>
          Training accuracy low, train-test gap small: <strong>go wider</strong>. The model cannot
          represent the answer and would generalise if it could.
        </p>
        <p>
          Training accuracy high, train-test gap large: <strong>do not go wider</strong>. The model
          has enough capacity; it is using that capacity to memorise noise. Regularise or add data.
        </p>
        <p>
          Training accuracy high, train-test gap small: <strong>the architecture is adequate</strong>.
          If you want better performance, the bottleneck is outside the architecture — in the data,
          the features, or the task formulation.
        </p>
        <p>
          When you do go wider, double once and retrain. If training accuracy did not improve, stop —
          width is not the bottleneck. If it improved, double again until it stops improving. Then,
          and only then, consider depth.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Your network has training accuracy 0.98 and test accuracy 0.81. Should you make
                it wider?</>,
              options: [
                "Yes — the test accuracy is low, so the model needs more capacity",
                "No — the large train-test gap (0.17) indicates overfitting, and more capacity will make it worse",
                "Yes, but only if you also increase the learning rate",
              ],
              answer: 1,
              explain: <>The model is already fitting the training data well (0.98). The problem is
                that it is not generalising — the 0.17 gap is overfitting. More width adds capacity
                the model does not need and will use to memorise noise further. The fix is
                regularisation (dropout, weight decay) or more training data.</>,
            },
            {
              q: <>You doubled the width and training accuracy did not improve. What does that tell
                you?</>,
              options: [
                "The learning rate is too small for the wider network",
                "Width is not the bottleneck — the representational capacity was already sufficient, and the limitation is elsewhere",
                "You need to double the width again to see an effect",
              ],
              answer: 1,
              explain: <>If doubling the width does not improve the training fit, the model already
                had enough capacity to represent whatever gradient descent could find. The bottleneck
                is either in the network&rsquo;s compositional structure (try depth) or outside the
                architecture entirely (data, features, optimiser).</>,
            },
            {
              q: <>Why should you try widening before adding depth when you diagnose underfitting?</>,
              options: [
                "Width always outperforms depth",
                "Widening is a cleaner experiment — it does not change gradient path length or require adjusting the training setup, so the result is unambiguous",
                "Deeper networks are slower to train",
              ],
              answer: 1,
              explain: <>Width gives a clean diagnostic signal: if it helps, capacity was the
                bottleneck; if it does not, capacity was not the bottleneck. Depth changes the
                optimisation dynamics (gradient path length, learning rate sensitivity), so a failed
                depth experiment could mean depth was wrong or the training was not adapted. Run the
                unambiguous experiment first.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/architecture-design/the-width-plateau", label: <>← The width plateau</> }}
          next={{ href: "/learn/architecture-design/what-depth-buys", label: <>Next up · What depth buys →</> }}
        />
      </div>
    </article>
  );
}
