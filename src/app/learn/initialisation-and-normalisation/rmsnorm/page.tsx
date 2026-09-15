import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { INIT_SETUP } from "@/lib/runtimeSetup";
import { NormAxes } from "@/components/figures/initNorm/NormAxes";

export const metadata = {
  title: "RMSNorm — Manifold",
  description:
    "RMSNorm drops LayerNorm's mean-centring and divides only by the root-mean-square of the features. It is cheaper and simpler, which is why most modern large language models use it.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function RmsNormPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Beyond batch normalisation", color: CORAL }, { label: "Tier 3 · theory", color: CORAL }]}
        time="about 6 minutes"
        title={<>RMSNorm</>}
        intro={<>Layer normalisation does two things to a sample&rsquo;s features: it re-centres
          them to zero mean, then re-scales them to unit variance. Zhang &amp; Sennrich (2019) asked
          whether the re-centring is really pulling its weight — and concluded it mostly is not.
          RMSNorm keeps the re-scaling and drops the mean subtraction entirely.</>}
      />

      <div className="lesson">
        <NormAxes
          kind="layer"
          caption={<>RMSNorm pools exactly the cells LayerNorm pools — a row, one sample, across the
            features. Nothing about <em>which</em> numbers are gathered changes. The only edit is to
            what is computed from them: LayerNorm takes a mean and a variance from the shaded row,
            RMSNorm takes a root-mean-square and skips the mean. One statistic instead of two, and half
            the arithmetic, on an operation that runs at every layer of every step.</>}
        />

        <h2>Drop the mean, keep the scale</h2>
        <p>
          LayerNorm computes a mean and a variance over a sample&rsquo;s features, subtracts the
          mean, and divides by the standard deviation. RMSNorm removes the first step. It never
          computes a mean and never subtracts one; it simply divides each feature by the{" "}
          <strong>root-mean-square</strong> of the feature vector, then applies a learned per-feature
          scale <M>{String.raw`g`}</M>.
        </p>

        <MathBlock>{String.raw`\text{RMS}(\mathbf{x}) = \sqrt{\frac{1}{H}\sum_{i=1}^{H} x_i^2 + \varepsilon}, \qquad y_i = \frac{x_i}{\text{RMS}(\mathbf{x})} \cdot g_i`}</MathBlock>

        <p>
          Compared to LayerNorm this is strictly less arithmetic: there is no mean to accumulate,
          and the subtraction step is gone. Most implementations also drop the additive bias, so
          RMSNorm carries only the single learned gain <M>{String.raw`g`}</M> where LayerNorm
          carries both a scale <M>{String.raw`\gamma`}</M> and a shift{" "}
          <M>{String.raw`\beta`}</M>. The root-mean-square is exactly the standard deviation you
          would get if the mean were assumed to be zero — so RMSNorm is LayerNorm under the
          assumption that re-centring is unnecessary.
        </p>

        <p>
          The claim that dropping the mean subtraction changes little is testable in about ten lines.
          Take a real layer&rsquo;s activations and standardise them both ways.
        </p>

        <CodeBlock
          setup={INIT_SETUP}
          fromScratch={`# A hidden layer's activations, He init, ReLU.
params = init_manual([2] + [64] * 6 + [1], scale="he", seed=0)
_, pre, _ = forward_activations(X_tr, params, act="relu")
z = pre[4]                      # layer 5 pre-activations, (n, 64)

ln  = (z - z.mean(1, keepdims=True)) / np.sqrt(z.var(1, keepdims=True) + 1e-5)
rms = z / np.sqrt((z ** 2).mean(1, keepdims=True) + 1e-5)

print("mean of z per sample : %+.4f (avg)" % z.mean(1).mean())
print("LayerNorm  out: mean %+.4f  rms %.4f" % (ln.mean(), np.sqrt((ln ** 2).mean())))
print("RMSNorm    out: mean %+.4f  rms %.4f" % (rms.mean(), np.sqrt((rms ** 2).mean())))
print("max |LayerNorm - RMSNorm| = %.4f" % np.abs(ln - rms).max())
print("correlation               = %.6f" % np.corrcoef(ln.ravel(), rms.ravel())[0, 1])`}
        />
        <CodeOutput>{`mean of z per sample : +0.1316 (avg)
LayerNorm  out: mean -0.0000  rms 1.0000
RMSNorm    out: mean +0.0860  rms 1.0000
max |LayerNorm - RMSNorm| = 0.3257
correlation               = 0.992082`}</CodeOutput>

        <p>
          Both put the layer on a unit scale; only LayerNorm also centres it, and the residual mean
          RMSNorm leaves behind is small — <strong>+0.086</strong> against the raw{" "}
          <strong>+0.132</strong>. The two outputs correlate at <strong>0.992</strong>, which is the
          practical argument for RMSNorm in one number. Note the honest figure beside it though: the
          largest single disagreement is <strong>0.33</strong>, on activations whose rms is 1.
          &ldquo;Almost the same on average&rdquo; is not &ldquo;the same&rdquo;, and the reason RMSNorm
          survives that gap is that <M>{String.raw`\beta`}</M> is still there to re-centre whatever the
          layer actually needed re-centred.
        </p>

        <h2>Why it caught on</h2>
        <p>
          The motivation is efficiency and simplicity, not accuracy. RMSNorm removes a reduction
          over the feature dimension and a per-feature subtraction from every normalisation layer,
          and in a large language model there is a normalisation layer in every block. The empirical
          finding of the original work is that the re-centring contributes little to the result
          while the re-scaling does the real work of keeping activations at a controlled scale.
          Remove the part that does little, keep the part that matters, and you get a cheaper layer
          that trains about as well.
        </p>
        <p>
          That trade is why RMSNorm has become the normalisation of choice in modern large language
          models — LLaMA, T5, and most recent large-scale Transformers use it in place of LayerNorm.
          At their scale, shaving a reduction and a subtraction off every block is worth having, and
          the accuracy is not measurably worse.
        </p>

        <Callout color={CORAL} title={<>Be honest about the size of the win</>}>
          RMSNorm is not a technique that makes models more accurate. The gain is in speed and
          simplicity: fewer operations per layer, one fewer learned parameter set, no mean to
          compute. On the metric you care about — validation loss, downstream accuracy — RMSNorm and
          LayerNorm are close to a wash. It is adopted because it costs less for the same result, not
          because it delivers a better one.
        </Callout>

        <Proof color={CORAL} title="the invariance RMSNorm keeps and the one it gives up">
          <p>
            LayerNorm is invariant to two transformations of a sample&rsquo;s feature vector. It is{" "}
            <strong>scale-invariant</strong>: multiply <M>{String.raw`\mathbf{x}`}</M> by any{" "}
            <M>{String.raw`c > 0`}</M> and the output is unchanged, because both the deviations and
            the standard deviation scale by <M>{String.raw`c`}</M>. It is also{" "}
            <strong>shift-invariant</strong>: add a constant <M>{String.raw`b`}</M> to every feature
            and the output is unchanged, because subtracting the mean removes any common shift.
          </p>
          <p>
            RMSNorm keeps the first and gives up the second. Scaling{" "}
            <M>{String.raw`\mathbf{x} \mapsto c\mathbf{x}`}</M> multiplies{" "}
            <M>{String.raw`\text{RMS}(\mathbf{x})`}</M> by <M>{String.raw`c`}</M> as well, so{" "}
            <M>{String.raw`x_i / \text{RMS}(\mathbf{x})`}</M> is unchanged — scale invariance
            survives. But shifting <M>{String.raw`\mathbf{x} \mapsto \mathbf{x} + b`}</M> changes{" "}
            <M>{String.raw`\sum_i (x_i + b)^2`}</M>, so the root-mean-square changes and the output
            changes with it. Without a mean to subtract, RMSNorm cannot be shift-invariant. The
            empirical claim behind the method is that shift invariance was the cheaper of the two
            properties to lose.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>What exactly does RMSNorm remove from LayerNorm?</>,
              options: [
                "The learned scale parameter",
                "The mean-centring step — it never subtracts the mean, dividing only by the root-mean-square",
                "The division by a measure of spread",
              ],
              answer: 1,
              explain: <>RMSNorm keeps the re-scaling (dividing by the root-mean-square) and the
                learned gain <M>{String.raw`g`}</M>. What it drops is the subtraction of the mean,
                usually along with the additive bias.</>,
            },
            {
              q: <>What is the honest characterisation of RMSNorm&rsquo;s benefit over LayerNorm?</>,
              options: [
                "It gives a large, consistent accuracy improvement",
                "It is cheaper and simpler — fewer operations and parameters per layer — for roughly the same accuracy",
                "It removes the need for any learned parameters at all",
              ],
              answer: 1,
              explain: <>The re-centring contributes little while the re-scaling does the work, so
                removing the mean saves computation for a near-identical result. The win is
                efficiency and simplicity, which is why LLMs like LLaMA and T5 adopt it — not a
                jump in accuracy.</>,
            },
            {
              q: <>Which invariance does RMSNorm keep, and which does it lose, relative to
                LayerNorm?</>,
              options: [
                "It keeps shift invariance but loses scale invariance",
                "It keeps scale invariance (dividing by RMS) but loses shift invariance (no mean subtraction)",
                "It loses both invariances",
              ],
              answer: 1,
              explain: <>Scaling the input scales the root-mean-square by the same factor, so the
                ratio is unchanged — scale invariance survives. Adding a constant changes{" "}
                <M>{String.raw`\sum_i x_i^2`}</M>, so without mean subtraction the output moves —
                shift invariance is gone.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/initialisation-and-normalisation/group-and-instance", label: <>← Group and instance normalisation</> }}
          next={{ href: "/learn/initialisation-and-normalisation/which-norm-when", label: <>Next up · Which normalisation when →</> }}
        />
      </div>
    </article>
  );
}
