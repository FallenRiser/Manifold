import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Data augmentation — Manifold",
  description:
    "Manufacture new training examples with label-preserving transformations. The tabular analogue — fresh Gaussian input jitter each epoch — is the strongest single regulariser measured here: test accuracy climbs from 0.753 to 0.784 at jitter std 0.4.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function DataAugmentationPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Early stopping and data augmentation", color: CORAL }, { label: "Tier 2 · practitioner", color: CORAL }]}
        time="about 8 minutes"
        title={<>Data augmentation</>}
        intro={<>Every other regulariser in this track fights overfitting by constraining the{" "}
          <em>model</em>. Data augmentation attacks the same problem from the other side: it enlarges the{" "}
          <em>data</em>. Apply transformations that change the input but not its label, and the network
          effectively sees far more examples than you collected — and, more importantly, learns the
          invariances you built into those transformations. On the problem here it is the single strongest
          regulariser measured.</>}
      />

      <div className="lesson">
        <h2>Manufacturing examples that keep their label</h2>
        <p>
          The core move is to take a training example <M>{String.raw`(\mathbf{x}, y)`}</M> and produce a
          new one <M>{String.raw`(T(\mathbf{x}), y)`}</M>, where <M>{String.raw`T`}</M> is a transformation
          chosen so that the label is <em>preserved</em>. A photo of a cat, flipped left-to-right, is still
          a photo of a cat. Shifted a few pixels, brightened slightly, rotated a little — still a cat. Each
          such transformation hands the network a fresh training point for free, and encodes a fact you
          know about the world: the answer should not depend on horizontal flip, on small translations, on
          modest lighting changes.
        </p>
        <p>
          On images this is the everyday toolkit: random crops, horizontal flips, colour jitter, small
          rotations, mild scaling. Each one tells the network about an <strong>invariance</strong> the true
          labelling function has, so the network stops wasting capacity learning to be sensitive to things
          that do not matter. The model sees effectively more data <em>and</em> a built-in prior about
          which directions in input space are irrelevant.
        </p>

        <h2>The tabular analogue: input jitter</h2>
        <p>
          Our running problem is tabular — 50 features, no pixels to crop or flip. The natural analogue of
          augmentation there is <strong>input jitter</strong>: add fresh Gaussian noise to every input at
          the start of each epoch, so the network never sees the exact same 250 points twice. Each epoch it
          trains on a slightly perturbed cloud around each original point, which encodes the prior that the
          true decision function is <em>smooth</em> — small wiggles in the inputs should not flip the
          prediction.
        </p>
        <p>
          Here is the full sweep of jitter standard deviation against test accuracy on the 3&times;256
          classifier, three seeds averaged:
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 380 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>jitter std</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>test accuracy</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>change from none</th>
              </tr>
            </thead>
            <tbody>
              {([
                { j: "0.0", acc: "0.753", d: "---", best: false },
                { j: "0.05", acc: "0.755", d: "+0.002", best: false },
                { j: "0.1", acc: "0.760", d: "+0.007", best: false },
                { j: "0.2", acc: "0.766", d: "+0.013", best: false },
                { j: "0.4", acc: "0.784", d: "+0.031", best: true },
              ] as const).map((r) => (
                <tr key={r.j}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.j}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: r.best ? "var(--good)" : "var(--ink)", fontWeight: r.best ? 600 : 400, borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.acc}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: r.best ? "var(--good)" : "var(--muted)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
        </p>

        <p>
          The climb is <strong>clean and monotone</strong>: every increase in jitter buys a little more
          test accuracy, from 0.753 at no augmentation up to <strong>0.784</strong> at std 0.4. That top
          number is the best single-regulariser result anywhere in this track — better than dropout&rsquo;s
          peak of 0.777, and far better than weight decay, which barely moved the needle here. On this
          problem, manufacturing data is the most effective thing you can do.
        </p>

        <Callout color={CORAL} title={<>Why augmentation is so effective here</>}>
          It works because it is a <strong>data-space prior</strong>. Dropout and weight decay constrain
          the model in weight space, hoping the constraint corresponds to something true. Augmentation
          states the truth directly: the target function is robust to small perturbations of the input, so
          train on perturbed inputs. When that assumption genuinely holds — and for a smooth decision
          boundary it does — you are handing the network correct information, not just a penalty. That is
          why it beats the model-space regularisers on this task.
        </Callout>

        <h2>The two ways it can go wrong</h2>
        <p>
          Augmentation is powerful precisely because it injects a prior, and an injected prior can be{" "}
          <em>false</em>. Two failure modes bound its use.
        </p>
        <p>
          <strong>The transformation must be label-preserving.</strong> This is the whole contract. Flip a
          photo of the digit 6 and you get a 9 — a horizontal flip is <em>not</em> label-preserving for
          digits, and using it would teach the network something false. Every augmentation you add is a
          claim that the label is invariant to it; if the claim is wrong, you are corrupting your labels.
          The transformations that help on natural images (flips, crops) can be exactly the ones that
          poison a task where orientation or position carries meaning.
        </p>
        <p>
          <strong>Too much noise erases the signal.</strong> On this problem the sweep was still climbing
          at std 0.4, but that cannot continue forever. Push the jitter high enough and the perturbation
          swamps the real feature values — you are no longer showing the network a slightly-varied cat,
          you are showing it static. Augmentation strength is a dial like any other: enough to teach the
          invariance, not so much that the examples stop resembling the data. The monotone climb here says
          we had not yet reached that ceiling, not that there isn&rsquo;t one.
        </p>

        <Proof color={CORAL} title="augmentation as a penalty on input sensitivity">
          <p>
            Suppose you augment by adding zero-mean noise <M>{String.raw`\boldsymbol{\epsilon}`}</M> with
            small variance <M>{String.raw`\sigma^2 I`}</M> to each input. The training objective becomes an
            <em> expectation</em> of the loss over the perturbation distribution:
          </p>
          <MathBlock>{String.raw`\tilde{\mathcal{L}}(\theta) = \mathbb{E}_{\boldsymbol{\epsilon}}\bigl[\ell\bigl(f_\theta(\mathbf{x} + \boldsymbol{\epsilon}),\, y\bigr)\bigr].`}</MathBlock>
          <p>
            Expand the network output to first order around the clean input,{" "}
            <M>{String.raw`f_\theta(\mathbf{x} + \boldsymbol{\epsilon}) \approx f_\theta(\mathbf{x}) + \nabla_{\mathbf{x}} f_\theta(\mathbf{x})^\top \boldsymbol{\epsilon}`}</M>, and take the
            expectation over <M>{String.raw`\boldsymbol{\epsilon}`}</M>. The zero-mean linear term averages
            away; the quadratic term does not, and to second order it contributes a penalty proportional to
            the squared input-gradient of the model:
          </p>
          <MathBlock>{String.raw`\tilde{\mathcal{L}}(\theta) \approx \mathcal{L}(\theta) + \tfrac{1}{2}\sigma^2\, \mathbb{E}_{\mathbf{x}}\bigl\|\nabla_{\mathbf{x}} f_\theta(\mathbf{x})\bigr\|^2.`}</MathBlock>
          <p>
            So training on jittered inputs is, to leading order, training on clean inputs <em>plus</em> a
            penalty on <M>{String.raw`\|\nabla_{\mathbf{x}} f_\theta\|^2`}</M> — the network&rsquo;s
            sensitivity to its inputs. The strength of that penalty scales with the noise variance{" "}
            <M>{String.raw`\sigma^2`}</M>, which is why larger jitter regularises harder. Unlike weight
            decay, which penalises sensitivity in weight space, this is a <strong>data-dependent</strong>
            {" "}penalty: it pushes the function to be flat exactly where your data lives, encoding the smoothness
            prior directly. This is the precise sense in which augmentation and an explicit penalty are two
            views of the same thing.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Input jitter raised test accuracy monotonically from 0.753 (none) to 0.784 (std 0.4),
                beating dropout&rsquo;s peak of 0.777. Why is augmentation so effective on this problem?</>,
              options: [
                "It adds more parameters to the network",
                "It is a data-space prior: it states directly that the target function is robust to small input perturbations, which is true here, rather than hoping a weight-space penalty corresponds to something true",
                "It reduces the learning rate over time",
              ],
              answer: 1,
              explain: <>Dropout and weight decay constrain the model and hope the constraint matches
                reality. Augmentation encodes the truth directly — the boundary is smooth, so train on
                perturbed inputs. When the assumption genuinely holds, you are giving the network correct
                information, which is why it outperforms the model-space regularisers here.</>,
            },
            {
              q: <>Why is a horizontal flip a dangerous augmentation for a handwritten-digit task?</>,
              options: [
                "Flipping is too slow to compute",
                "It is not label-preserving — a flipped 6 looks like a 9, so the transformation teaches the network something false about the label",
                "Digits are already rotationally symmetric, so it does nothing",
              ],
              answer: 1,
              explain: <>Every augmentation is a claim that the label is invariant to it. That claim is
                false for digit flips, so applying it corrupts your labels. The transformations that help
                on natural images can be exactly the ones that poison a task where orientation carries
                meaning.</>,
            },
            {
              q: <>In what sense is adding small Gaussian input noise equivalent to an explicit penalty?</>,
              options: [
                "It is equivalent to L2 weight decay of the same strength",
                "To second order it equals the clean loss plus a term proportional to σ² times the squared input-gradient of the model — a data-dependent penalty on sensitivity to the inputs",
                "It has no relationship to any penalty; it only adds noise",
              ],
              answer: 1,
              explain: <>Expanding the loss over the noise distribution, the linear term averages away and
                the quadratic term leaves a penalty proportional to{" "}
                <M>{String.raw`\sigma^2\|\nabla_{\mathbf{x}} f_\theta\|^2`}</M>. Unlike weight decay this is
                data-dependent — it flattens the function where the data actually lives, encoding the
                smoothness prior directly.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/nn-regularisation/patience", label: <>← Patience and the validation curve</> }}
          next={{ href: "/learn/nn-regularisation/label-smoothing", label: <>Next up · Label smoothing and mixup →</> }}
        />
      </div>
    </article>
  );
}
