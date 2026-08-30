import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { CodeBlock } from "@/components/CodeBlock";
import { SoftmaxLab } from "@/components/labs/SoftmaxLab";

export const metadata = {
  title: "The output layer is a different question — Manifold",
  description:
    "Hidden activations are chosen by trade-off. The output activation is not chosen at all — it is determined by your label space and your loss, and getting it wrong breaks the gradient in a way that looks like a training bug.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const th: React.CSSProperties = {
  textAlign: "left", padding: "7px 18px 7px 0", color: "var(--muted)", fontWeight: 500,
  borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "7px 18px 7px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)",
  verticalAlign: "top",
};

export default function OutputLayerPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Choosing & designing", color: CORAL }, { label: "Tier 1→2", color: CORAL }]}
        time="about 8 minutes"
        title={<>The output layer is a <em>different question</em></>}
        intro={<>Everything so far has been a trade-off with no right answer. The output activation is not like
          that: it is <em>determined</em> — by what your labels are and which loss you chose — and there is nothing
          to weigh. Confusing the two questions is one of the most common errors in a first neural network.</>}
      />

      <div className="lesson">
        <h2>The rule</h2>
        <p>
          A hidden activation exists to keep gradients flowing. An output activation exists to{" "}
          <strong>put the model&rsquo;s prediction in the space the labels live in</strong>, so that the loss is a
          meaningful comparison. Those are different jobs, and the second one has a unique answer once you name the
          label space.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 560 }}>
            <thead>
              <tr>
                <th style={th}>task</th>
                <th style={th}>output activation</th>
                <th style={th}>loss</th>
                <th style={th}>why</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...td, fontWeight: 500 }}>regression</td>
                <td style={td}>none (identity)</td>
                <td style={td}>MSE / MAE / Huber</td>
                <td style={{ ...td, color: "var(--muted)" }}>the target is any real number; a bend would only
                  restrict what the model can predict</td>
              </tr>
              <tr>
                <td style={{ ...td, fontWeight: 500 }}>binary classification</td>
                <td style={td}>sigmoid</td>
                <td style={td}>binary cross-entropy</td>
                <td style={{ ...td, color: "var(--muted)" }}>the target is a probability in (0,1); sigmoid is the
                  inverse of the log-odds</td>
              </tr>
              <tr>
                <td style={{ ...td, fontWeight: 500 }}>multi-class, one label</td>
                <td style={td}>softmax</td>
                <td style={td}>categorical cross-entropy</td>
                <td style={{ ...td, color: "var(--muted)" }}>the classes are mutually exclusive, so the outputs must
                  sum to 1</td>
              </tr>
              <tr>
                <td style={{ ...td, fontWeight: 500 }}>multi-label</td>
                <td style={td}>sigmoid, per output</td>
                <td style={td}>binary cross-entropy, summed</td>
                <td style={{ ...td, color: "var(--muted)" }}>labels are independent — an image can be both
                  &ldquo;beach&rdquo; and &ldquo;sunset&rdquo;</td>
              </tr>
              <tr>
                <td style={{ ...td, fontWeight: 500 }}>non-negative target</td>
                <td style={td}>softplus or exp</td>
                <td style={td}>Poisson / gamma</td>
                <td style={{ ...td, color: "var(--muted)" }}>counts and rates cannot be negative; softplus does not
                  overflow the way exp does</td>
              </tr>
            </tbody>
          </table>
        </div>

        <Callout color={CORAL} title={<>The row people get wrong</>}>
          <strong>Multi-class versus multi-label.</strong> Softmax makes the outputs compete — raising one lowers the
          others, because they are constrained to sum to 1. That is exactly right when the classes are mutually
          exclusive and exactly wrong when they are not.
          <br /><br />
          Use softmax on a multi-label problem and the model is structurally unable to say &ldquo;both of
          these&rdquo;. It will not throw an error. It will train, converge, and be quietly incapable of the thing
          you asked for.
        </Callout>

        <LabFrame
          accent={CORAL}
          tryThis={<>Raise one logit and watch every other probability fall, even though you did not touch them.
            That coupling is the whole difference between softmax and a row of independent sigmoids.</>}
          insight={<>The outputs are constrained to sum to 1, so the scores are <em>competing</em> for a fixed budget.
            On mutually exclusive classes that constraint is free information the model does not have to learn. On
            independent labels it is a false assumption baked into the architecture.</>}
        >
          <SoftmaxLab />
        </LabFrame>

        <h2>Why the pairing with the loss is not a convention</h2>
        <p>
          Sigmoid appears with binary cross-entropy and softmax with categorical cross-entropy in every framework,
          and it is easy to read that as habit. It is not — the pairing produces an exact cancellation that makes the
          output gradient trivial and well-behaved:
        </p>

        <MathBlock>{String.raw`\frac{\partial \mathcal{L}}{\partial z} \;=\; p - y`}</MathBlock>

        <p>
          The prediction minus the label. No <M>{String.raw`\sigma'`}</M> factor anywhere — which means{" "}
          <strong>the 0.25 ceiling that disqualifies sigmoid from hidden layers never appears at the output.</strong>{" "}
          The activation and the loss cancel each other out precisely, and a confidently wrong prediction produces a
          large gradient rather than a saturated one.
        </p>

        <Proof color={CORAL} title="the cancellation, for the binary case">
          <p>
            With <M>{String.raw`p = \sigma(z)`}</M> and{" "}
            <M>{String.raw`\mathcal{L} = -y\log p - (1-y)\log(1-p)`}</M>:
          </p>
          <MathBlock>{String.raw`\frac{\partial \mathcal{L}}{\partial p} = -\frac{y}{p} + \frac{1-y}{1-p} = \frac{p-y}{p(1-p)}, \qquad \frac{\partial p}{\partial z} = p(1-p)`}</MathBlock>
          <MathBlock>{String.raw`\frac{\partial \mathcal{L}}{\partial z} = \frac{p-y}{p(1-p)}\cdot p(1-p) = p - y`}</MathBlock>
          <p>
            The <M>{String.raw`p(1-p)`}</M> that would saturate is exactly the{" "}
            <M>{String.raw`p(1-p)`}</M> the loss&rsquo;s derivative divides by. This is not luck — cross-entropy is
            the <em>canonical</em> loss for a sigmoid output in the exponential-family sense, and the cancellation is
            the defining property of that pairing.
          </p>
          <p>
            The practical consequence is worth stating: pair sigmoid with <strong>squared error</strong> instead and
            the cancellation is lost. The gradient becomes{" "}
            <M>{String.raw`(p-y)\,p(1-p)`}</M>, which goes to <em>zero</em> when the model is confidently wrong —
            <M>{String.raw`p \approx 0`}</M> with <M>{String.raw`y = 1`}</M> gives almost no gradient at all. The
            model gets stuck being wrong, and the symptom is a loss that plateaus early for no visible reason. This
            is a real bug people ship.
          </p>
        </Proof>

        <h2>The implementation detail that bites</h2>
        <p>
          Every framework provides a fused &ldquo;activation plus loss&rdquo; function, and you should use it:
        </p>

        <CodeBlock
          language="python"
          fromScratch={`import torch.nn as nn

# WRONG: applies sigmoid, then takes a log -- overflows for large logits
model = nn.Sequential(nn.Linear(64, 1), nn.Sigmoid())
loss = nn.BCELoss()

# RIGHT: the model outputs a raw logit; the loss does both, stably
model = nn.Sequential(nn.Linear(64, 1))
loss = nn.BCEWithLogitsLoss()          # log-sum-exp trick inside

# Same story for multi-class: no softmax in the model.
model = nn.Sequential(nn.Linear(64, 10))
loss = nn.CrossEntropyLoss()           # applies log_softmax internally`}
        />

        <p>
          The fused versions use the log-sum-exp trick, which keeps the computation finite for logits of any
          magnitude. Applying the activation yourself and then taking a log of it will produce{" "}
          <code>inf</code> or <code>nan</code> the first time a confident prediction appears — often several hours
          into a run. And remember that the model now outputs <strong>logits, not probabilities</strong>: apply the
          sigmoid or softmax yourself at inference time, or your reported confidences will be wrong.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why is sigmoid unsuitable for hidden layers but correct at the output for binary
                classification?</>,
              options: [
                "It is not — sigmoid should be avoided everywhere",
                "Because at the output it is paired with cross-entropy, whose derivative cancels the p(1−p) factor, so the 0.25 ceiling never enters the gradient",
                "Because the output layer is not trained by backpropagation",
              ],
              answer: 1,
              explain: <>The output gradient is exactly <M>{String.raw`p - y`}</M>. The saturation that compounds
                across twelve hidden layers is cancelled analytically at the output, so the objection simply does
                not apply there.</>,
            },
            {
              q: <>An image can be tagged both &ldquo;beach&rdquo; and &ldquo;sunset&rdquo;. Which output activation
                do you use?</>,
              options: [
                "Softmax over all tags",
                "An independent sigmoid per tag, with binary cross-entropy summed across them",
                "Identity, with mean squared error",
              ],
              answer: 1,
              explain: <>Softmax forces the outputs to sum to 1, so raising one lowers the others — it cannot express
                &ldquo;both&rdquo;. Independent sigmoids let each label be judged on its own, which is what
                multi-label means.</>,
            },
            {
              q: <>What goes wrong if you pair a sigmoid output with squared error?</>,
              options: [
                "Nothing — the loss is just less interpretable",
                "The p(1−p) factor survives, so a confidently wrong prediction produces almost no gradient and the model gets stuck",
                "The gradient becomes undefined",
              ],
              answer: 1,
              explain: <>The gradient becomes <M>{String.raw`(p-y)p(1-p)`}</M>, which vanishes exactly when the error
                is largest. The symptom is a loss that plateaus early with no obvious cause — a real and frequently
                shipped bug.</>,
            },
          ]}
        />

        <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
          Softmax as a model in its own right — the multi-class link function, its relationship to the logit, and its
          temperature — belongs to{" "}
          <Link href="/learn/logistic-regression" style={link}>Logistic regression</Link>.
        </p>

        <PrevNext
          prev={{ href: "/learn/activation-functions/the-property-space", label: <>← The property space</> }}
          next={{ href: "/learn/activation-functions/designing-a-new-one", label: <>Next up · Designing a new one →</> }}
        />
      </div>
    </article>
  );
}
