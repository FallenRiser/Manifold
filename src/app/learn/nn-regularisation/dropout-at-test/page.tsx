import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { Dumbbell } from "@/components/figures/Dumbbell";
import { MC_DROPOUT } from "@/components/figures/nnReg/data";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { PredictPrompt } from "@/components/PredictPrompt";
import { NN_REG_SETUP } from "@/lib/runtimeSetup";

export const metadata = {
  title: "Dropout at test time — Manifold",
  description:
    "At test, dropout turns off and inverted scaling means no adjustment is needed. Leaving it on (MC-dropout) gives a stochastic prediction: single-pass mean 0.717 ± 0.010 vs eval() 0.749, with a 50-pass average recovering 0.749. Uncertainty, not accuracy — and the classic model.eval() bug.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function DropoutAtTestPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Dropout", color: CORAL }, { label: "Tier 2 · practitioner", color: CORAL }]}
        time="about 7 minutes"
        title={<>Dropout at test time</>}
        intro={<>Dropout is a training-time trick. At inference you turn it off — and thanks to inverted
          dropout, that is genuinely all you do. But &ldquo;turn it off&rdquo; hides a subtlety worth
          measuring, and forgetting to do it is one of the most common bugs in practice.</>}
      />

      <div className="lesson">
        <p>
          Before the argument, the arithmetic — because this is the piece of the track most likely to
          be got wrong in your own code, and it needs no training loop to check. Take one layer of
          post-ReLU activations and apply dropout two ways: the inverted form, which divides the
          survivors by <M>{String.raw`1-p`}</M>, and the naive form, which just deletes half of them.
        </p>

        <PredictPrompt
          accent={CORAL}
          prompt={<>Drop half the activations at random. The units that survive are then divided by
            0.5, i.e. doubled. What does that do to the <em>mean</em> activation, and what does it do
            to the spread?</>}
          options={[
            "Mean unchanged, spread unchanged",
            "Mean unchanged, spread much larger",
            "Mean halved, spread unchanged",
            "Mean doubled, spread halved",
          ]}
          nudge="Locked in. Run it and read both columns."
        />

        <CodeBlock
          setup={NN_REG_SETUP}
          fromScratch={`h = relu_layer()
p = 0.5
inverted = h * dropout_mask(h.shape, p, inverted=True)
naive    = h * dropout_mask(h.shape, p, inverted=False)

print("                       mean      std")
print("no dropout         %8.4f %8.4f" % (h.mean(), h.std()))
print("inverted dropout   %8.4f %8.4f" % (inverted.mean(), inverted.std()))
print("naive dropout      %8.4f %8.4f" % (naive.mean(), naive.std()))
print()
print("mean error vs no dropout -- inverted %+.5f, naive %+.5f"
      % (inverted.mean() - h.mean(), naive.mean() - h.mean()))`}
        />
        <CodeOutput>{`                       mean      std
no dropout           0.3997   0.5845
inverted dropout     0.3997   0.9175
naive dropout        0.1998   0.4588

mean error vs no dropout -- inverted -0.00009, naive -0.19992`}</CodeOutput>

        <p>
          The first column is why dropout can simply be switched off at test time. Inverted dropout
          leaves the mean activation <em>exactly</em> where it was — the error is 9 parts in a hundred
          thousand — so the eval-time network, which applies no mask and no scaling, receives inputs
          at the scale its weights were trained against. The naive form does not: it halves every
          layer&rsquo;s mean, and a network trained that way needs its activations multiplied by{" "}
          <M>{String.raw`1-p`}</M> at test time to compensate. Inverted dropout exists solely to move
          that correction into the training step, where it costs nothing, and out of inference, where
          forgetting it silently halves your model.
        </p>
        <p>
          The second column is the part that is easy to miss, and it is the mechanism the{" "}
          <Link href="/learn/nn-regularisation/why-dropout-works" style={link}>previous chapter</Link>{" "}
          called noise injection. Preserving the mean is not free: the standard deviation goes from
          0.5845 to <strong>0.9175</strong>, over half as much again. Training sees the right average
          signal and a far noisier one, every step, and surviving that noise is the whole point.
        </p>

        <h2>The default: dropout off</h2>
        <p>
          At test time you want a single, deterministic prediction — the same input should always give the
          same output. So you disable dropout: every unit is kept, no mask is sampled. Because you used{" "}
          <Link href="/learn/nn-regularisation/randomly-removing-units" style={link}>inverted dropout</Link>{" "}
          during training — scaling surviving activations by <M>{String.raw`\tfrac{1}{1-p}`}</M> so their
          expected value equalled the full activation — the full network with dropout off already produces
          activations at the correct scale. There is nothing else to adjust. On this track&rsquo;s network,
          this deterministic evaluation gives test accuracy <strong>0.749</strong>.
        </p>
        <p>
          In a framework this is a mode switch, not a code change: <code>model.eval()</code> in PyTorch,
          <code>training=False</code> in Keras. The layer definitions do not change; the dropout layers simply
          become the identity.
        </p>

        <Callout color={CORAL} title={<>The classic bug: forgetting model.eval()</>}>
          If you run inference without switching to eval mode, dropout stays <em>on</em> — the network keeps
          randomly deleting units at test time. Predictions become stochastic and, on average, worse, and the
          symptom is maddening: the same input gives different answers on repeated calls, and validation
          accuracy is mysteriously below training-time expectations. It is one of the most common
          silent bugs in deep learning. The mirror-image bug is forgetting <code>model.train()</code> again
          afterward, which leaves dropout <em>off</em> during training and quietly removes your
          regularisation. Whenever validation numbers look wrong, check the mode first.</Callout>

        <Dumbbell
          rows={[
            { init: "dropout off (eval)", a: MC_DROPOUT.deterministic },
            { init: "one MC pass", a: MC_DROPOUT.singlePassMean },
            { init: "50 MC passes", a: MC_DROPOUT.fiftyPass },
          ]}
          seriesLabels={["test accuracy"]}
          ticks={[0.72, 0.74]}
          caption={<>Leaving dropout on at test time costs <strong>3.2 points</strong> on a single pass
            (0.717 against 0.749) and, worse, gives a different answer every time — the spread across
            runs is ±0.010. Average fifty stochastic passes and you land back at{" "}
            <strong>0.749</strong>, exactly where simply turning it off puts you, for fifty times the
            compute. That equality is the point of the page: the deterministic pass is not an
            approximation of the ensemble that happens to be cheaper, it is what the ensemble averages
            to.</>}
        />

        <h2>What if you leave dropout on? Monte-Carlo dropout</h2>
        <p>
          Leaving dropout on at test is not always a mistake — done deliberately, it is a technique called
          <strong> Monte-Carlo (MC) dropout</strong>. Each forward pass now samples a fresh mask, so each
          pass is a different thinned subnetwork and gives a different prediction. The measurements on this
          track&rsquo;s network make the behaviour concrete:
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 380 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>evaluation mode</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>test accuracy</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>deterministic?</th>
              </tr>
            </thead>
            <tbody>
              {([
                { m: "eval() — dropout off", acc: "0.749", det: "yes" },
                { m: "single MC pass — dropout on", acc: "0.717 ± 0.010", det: "no" },
                { m: "50-pass MC average", acc: "0.749", det: "≈ yes" },
              ] as const).map((r) => (
                <tr key={r.m}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>{r.m}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: r.acc === "0.749" ? "var(--good)" : "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.acc}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>{r.det}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}> The single-pass row is the mean and standard
          deviation of accuracy across independent masked passes.
        </p>

        <p>
          Read the table carefully. A <strong>single</strong> MC pass averages 0.717 with a standard
          deviation of 0.010 — noticeably <em>worse</em> and non-deterministic, because that one thinned
          subnetwork is missing half its units and nothing has scaled up to compensate on the fly. But
          average the class probabilities over <strong>50</strong> MC passes and accuracy returns to{" "}
          <strong>0.749</strong> — the same number as the clean deterministic <code>eval()</code>.
        </p>

        <Callout color={CORAL} title={<>MC-dropout estimates uncertainty, not a better answer</>}>
          The 50-pass average recovers the deterministic accuracy — it does not beat it. So the point of
          MC-dropout is <em>not</em> to improve the point prediction; the clean eval() already gives you
          that, faster and for free. The point is the <strong>spread</strong> across passes. If the 50
          predictions for an input mostly agree, the model is confident; if they scatter, it is uncertain.
          That variance is a cheap, principled estimate of <strong>predictive uncertainty</strong> — the
          real product of MC-dropout.
        </Callout>

        <Proof color={CORAL} title="why averaging many MC-dropout passes converges to the deterministic eval() prediction">
          <p>
            Consider a single pre-activation <M>{String.raw`z = \sum_i w_i \tilde{h}_i`}</M> feeding a unit,
            where each <M>{String.raw`\tilde{h}_i = \tfrac{1}{1-p} m_i h_i`}</M> is an inverted-dropout
            activation with mask <M>{String.raw`m_i \sim \text{Bernoulli}(1-p)`}</M>. A single MC pass
            evaluates this with one random draw of the masks. Averaging over <M>{String.raw`T`}</M>{" "}
            independent passes computes the empirical mean of <M>{String.raw`z`}</M>, and by the law of
            large numbers that empirical mean converges to the expectation over masks:
          </p>
          <MathBlock>{String.raw`\frac{1}{T}\sum_{t=1}^{T} z^{(t)} \;\xrightarrow[T\to\infty]{}\; \mathbb{E}[z] = \sum_i w_i\, \mathbb{E}[\tilde{h}_i] = \sum_i w_i\, h_i,`}</MathBlock>
          <p>
            using <M>{String.raw`\mathbb{E}[\tilde{h}_i] = h_i`}</M> from the inverted-dropout identity. But
            <M>{String.raw`\;\sum_i w_i h_i`}</M> is exactly the pre-activation the deterministic{" "}
            <code>eval()</code> network computes with dropout off. So the MC average converges to the eval()
            value — for a single layer this is exact in the pre-activations; through the nonlinearities of a
            deep net it is an approximation (the average of a nonlinearity is not the nonlinearity of the
            average), which is why 50 passes recover 0.749 rather than matching it to the last digit. The
            variance of the estimate shrinks like <M>{String.raw`1/T`}</M>, which is why one pass (0.717,
            std 0.010) is noisy and fifty passes are tight.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>With inverted dropout used during training, what must you do to the activations at test
                time when dropout is turned off?</>,
              options: [
                "Multiply them by (1 − p) to compensate",
                "Nothing — the training-time scaling already made the full network's activations correctly scaled",
                "Divide them by (1 − p)",
              ],
              answer: 1,
              explain: <>Inverted dropout moved the <M>{String.raw`\tfrac{1}{1-p}`}</M> factor into training,
                so the full network at test already produces correctly scaled activations. You just switch
                dropout off — no rescaling.</>,
            },
            {
              q: <>A single MC-dropout pass scores 0.717 ± 0.010, but a 50-pass average scores 0.749, the
                same as eval(). What is the practical takeaway?</>,
              options: [
                "MC-dropout is a better inference method that should replace eval()",
                "MC-dropout does not improve the point prediction — its value is the variance across passes, which estimates predictive uncertainty",
                "You should always use a single MC pass at test time",
              ],
              answer: 1,
              explain: <>The average merely recovers the deterministic accuracy; eval() gets there faster and
                for free. The reason to run many passes is to measure the spread — agreement means
                confidence, scatter means uncertainty. Uncertainty is the product, not accuracy.</>,
            },
            {
              q: <>Your model gives a different prediction every time you call it on the same test input, and
                validation accuracy is below what you expected. What is the most likely cause?</>,
              options: [
                "The weights are still being updated at test time",
                "You forgot model.eval(), so dropout is still on at inference",
                "The learning rate is too high",
              ],
              answer: 1,
              explain: <>Non-deterministic predictions plus lower-than-expected accuracy is the signature of
                dropout left on at inference — the classic forgotten-<code>model.eval()</code> bug. Each call
                samples a different thinned subnetwork.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/nn-regularisation/dropout-rate", label: <>← Dropout rate and where to apply it</> }}
          next={{ href: "/learn/nn-regularisation/ensemble-interpretation", label: <>Next up · The ensemble interpretation →</> }}
        />
      </div>
    </article>
  );
}
