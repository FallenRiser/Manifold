import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Layer normalisation — Manifold",
  description:
    "Layer normalisation normalises across features within a single sample, not across the batch. That makes it independent of batch size and the default in Transformers.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function LayerNormPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Beyond batch normalisation", color: CORAL }, { label: "Tier 2 · practitioner", color: CORAL }]}
        time="about 8 minutes"
        title={<>Layer normalisation</>}
        intro={<>BatchNorm normalises each feature down the batch, so its statistics depend on
          which other samples happen to share the mini-batch. Layer normalisation, introduced by
          Ba, Kiros &amp; Hinton in 2016, makes the opposite choice: it normalises across the{" "}
          <strong>features</strong> of a single sample. That one change frees it from the batch
          axis entirely — which is exactly why it became the default in Transformers.</>}
      />

      <div className="lesson">
        <h2>The key move: normalise across features</h2>
        <p>
          BatchNorm looks at one feature at a time and asks: across the samples in this mini-batch,
          what is this feature&rsquo;s mean and variance? Layer normalisation turns the tensor
          ninety degrees. It looks at one sample at a time and asks: across the features of{" "}
          <em>this</em> sample, what is the mean and variance? The normalisation is computed
          entirely from the activations of a single example, using no information from any other
          example in the batch.
        </p>
        <p>
          Because the statistics come from within the sample, LayerNorm does not care how many
          other samples are present. It behaves identically at batch size 512, batch size 1, and
          on a single token in a sequence. There is no running average to maintain and no
          train/test discrepancy: the same computation runs at training time and at inference
          time. That property is what makes it the natural fit for recurrent networks and
          Transformers, where the batch is often small, variable, or effectively absent at
          generation time.
        </p>

        <MathBlock>{String.raw`\mu = \frac{1}{H}\sum_{i=1}^{H} x_i, \qquad \sigma^2 = \frac{1}{H}\sum_{i=1}^{H}\bigl(x_i - \mu\bigr)^2`}</MathBlock>

        <p>
          Here <M>{String.raw`x_1, \ldots, x_H`}</M> are the <M>{String.raw`H`}</M> features of one
          sample, and <M>{String.raw`\mu`}</M> and <M>{String.raw`\sigma^2`}</M> are computed over
          that feature dimension alone. The normalised, rescaled output is then
        </p>

        <MathBlock>{String.raw`\hat{y}_i = \gamma_i \cdot \frac{x_i - \mu}{\sqrt{\sigma^2 + \varepsilon}} + \beta_i,`}</MathBlock>

        <p>
          where <M>{String.raw`\gamma`}</M> and <M>{String.raw`\beta`}</M> are learned per-feature
          scale and shift parameters, and <M>{String.raw`\varepsilon`}</M> is a small constant for
          numerical stability. The affine parameters are shared across all samples, but the
          statistics <M>{String.raw`\mu`}</M> and <M>{String.raw`\sigma^2`}</M> are recomputed
          independently for every sample.
        </p>

        <h2>BatchNorm and LayerNorm pool over different axes</h2>
        <p>
          The entire difference between the two methods is a choice of axis. Picture the activation
          matrix of one layer as a grid with samples going down and features going across.
          BatchNorm computes its statistics <strong>down a column</strong> (one feature, all
          samples in the batch); LayerNorm computes them <strong>across a row</strong> (one sample,
          all features).
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 380 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>method</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>pools over</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>needs a batch axis?</th>
              </tr>
            </thead>
            <tbody>
              {([
                { m: "BatchNorm", axis: "the batch (one feature, down the column)", batch: "yes" },
                { m: "LayerNorm", axis: "the features (one sample, across the row)", batch: "no" },
              ] as const).map((r) => (
                <tr key={r.m}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>{r.m}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)" }}>{r.axis}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: r.batch === "no" ? "var(--good)" : "var(--muted)", borderBottom: "1px solid var(--border)" }}>{r.batch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          Everything else about the two methods — the learned <M>{String.raw`\gamma`}</M> and{" "}
          <M>{String.raw`\beta`}</M>, the <M>{String.raw`\varepsilon`}</M>, the goal of keeping
          activations at a controlled scale — is identical. Only the axis of pooling changes, and
          that single choice is what determines whether the method depends on the batch.
        </p>

        <h2>Measured: LayerNorm holds the scale steady deep in the net</h2>
        <p>
          To see the stabilising effect directly, take a 10-layer network with He initialisation and
          ReLU activations, feed a batch through it, and record the standard deviation of the
          activations at each layer. With LayerNorm inserted, the per-layer activation standard
          deviations are:
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 380 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>layer</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>std with LayerNorm</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>std without any norm</th>
              </tr>
            </thead>
            <tbody>
              {([
                { l: 1, ln: "0.57", no: "0.61" },
                { l: 2, ln: "0.61", no: "0.64" },
                { l: 3, ln: "0.55", no: "0.54" },
                { l: 4, ln: "0.60", no: "0.59" },
                { l: 5, ln: "0.56", no: "0.52" },
                { l: 6, ln: "0.48", no: "0.42" },
                { l: 7, ln: "0.53", no: "0.39" },
                { l: 8, ln: "0.57", no: "0.40" },
                { l: 9, ln: "0.56", no: "0.41" },
                { l: 10, ln: "0.65", no: "0.51" },
              ] as const).map((r) => (
                <tr key={r.l}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>{r.l}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.ln}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--muted)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.no}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          10 layers, He initialisation, ReLU. From <code>scripts/init_norm_cases.py</code>.
        </p>

        <p>
          With LayerNorm the activation scale stays inside a tight <strong>0.48–0.65</strong> band
          across all ten layers — it wanders a little but never trends. The unnormalised network
          starts at the same scale but <strong>drifts downward</strong>: by layers 6 through 9 it
          has fallen to the 0.39–0.42 range, a clear decay that only the last layer partly recovers.
          LayerNorm does not just hold the scale near a target; it prevents the slow deep-net drift
          that shrinks the signal the further it travels.
        </p>

        <Callout color={CORAL} title={<>The band is the point, not the average</>}>
          Both networks average close to 0.55 over the ten layers, so a single summary number would
          hide the story. What matters is the <em>spread</em> across depth. LayerNorm keeps every
          layer within a 0.17-wide band; without it the deep layers sag by roughly 0.2 relative to
          the shallow ones. A steady scale is what lets the gradient flow through a deep stack
          without the signal quietly collapsing on the way.
        </Callout>

        <Proof color={CORAL} title="why LayerNorm's statistics do not depend on the batch">
          <p>
            Fix one sample with feature vector <M>{String.raw`\mathbf{x} = (x_1, \ldots, x_H)`}</M>.
            LayerNorm computes <M>{String.raw`\mu = \frac{1}{H}\sum_i x_i`}</M> and{" "}
            <M>{String.raw`\sigma^2 = \frac{1}{H}\sum_i (x_i - \mu)^2`}</M>. Every term in both sums
            is one of this sample&rsquo;s own features. No activation from any other sample appears
            anywhere in the expression.
          </p>
          <p>
            Therefore the output <M>{String.raw`\hat{y}_i`}</M> for this sample is a function of{" "}
            <M>{String.raw`\mathbf{x}`}</M> alone (and the shared learned{" "}
            <M>{String.raw`\gamma, \beta`}</M>). Change the rest of the batch however you like — add
            samples, remove them, shuffle them, run the sample entirely on its own — and{" "}
            <M>{String.raw`\hat{y}_i`}</M> is bit-for-bit unchanged. This is the formal reason
            LayerNorm works at batch size 1 and needs no running statistics: the batch axis never
            enters the computation. BatchNorm, by contrast, puts every sample in the batch inside
            its <M>{String.raw`\mu`}</M> and <M>{String.raw`\sigma^2`}</M>, so its output for one
            sample genuinely depends on its neighbours.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>What is the single defining difference between LayerNorm and BatchNorm?</>,
              options: [
                "LayerNorm has learned scale and shift parameters while BatchNorm does not",
                "LayerNorm normalises across the features of one sample; BatchNorm normalises each feature across the samples in the batch",
                "LayerNorm is applied before the activation and BatchNorm after it",
              ],
              answer: 1,
              explain: <>Both methods share the learned <M>{String.raw`\gamma`}</M> and{" "}
                <M>{String.raw`\beta`}</M>. The only structural difference is the axis of pooling:
                LayerNorm pools across features within a sample, BatchNorm pools across samples
                within a feature.</>,
            },
            {
              q: <>Why is LayerNorm the default normalisation in Transformers, where BatchNorm is
                rare?</>,
              options: [
                "LayerNorm has fewer parameters, which matters at Transformer scale",
                "Its statistics come from within each sample, so it is independent of batch size and works on single tokens and variable-length sequences with no running average",
                "BatchNorm cannot be used with the attention mechanism for mathematical reasons",
              ],
              answer: 1,
              explain: <>Transformers process sequences with small, variable, or effectively absent
                batches at generation time. Because LayerNorm computes its statistics from each
                sample&rsquo;s own features, it behaves identically at any batch size and needs no
                train/test bookkeeping.</>,
            },
            {
              q: <>In the measured 10-layer network, the unnormalised activation std falls to the
                0.39–0.42 range at layers 6–9 while the LayerNorm network stays in 0.48–0.65. What
                does this show?</>,
              options: [
                "LayerNorm makes every layer have exactly the same standard deviation",
                "LayerNorm holds the activation scale in a tight band across depth, preventing the downward drift that the unnormalised network shows deep in the stack",
                "The unnormalised network is diverging and will not train at all",
              ],
              answer: 1,
              explain: <>The unnormalised net does not blow up; it slowly <em>drifts down</em>, losing
                about 0.2 of scale by the deep layers. LayerNorm keeps all ten layers within a
                0.17-wide band, so the signal keeps a steady magnitude the whole way through.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/initialisation-and-normalisation/when-batchnorm-helps", label: <>← When BatchNorm helps</> }}
          next={{ href: "/learn/initialisation-and-normalisation/group-and-instance", label: <>Next up · Group and instance normalisation →</> }}
        />
      </div>
    </article>
  );
}
