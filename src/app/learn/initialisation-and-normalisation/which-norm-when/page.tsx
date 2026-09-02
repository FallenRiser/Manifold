import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Which normalisation when — Manifold",
  description:
    "A decision guide across BatchNorm, LayerNorm, GroupNorm, InstanceNorm and RMSNorm. One rule decides most calls: if you have a clean large batch axis use BatchNorm, otherwise normalise within the sample.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhichNormWhenPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Beyond batch normalisation", color: CORAL }, { label: "Tier 2 · practitioner", color: CORAL }]}
        time="about 7 minutes"
        title={<>Which normalisation when</>}
        intro={<>You now have five members of one family: BatchNorm, LayerNorm, GroupNorm,
          InstanceNorm and RMSNorm. They differ only in which axes they pool over, but that choice
          maps cleanly onto the kind of problem you are solving. This page is the decision guide —
          and it turns out one property decides most of the calls.</>}
      />

      <div className="lesson">
        <h2>The decision table</h2>
        <p>
          Match your regime to a row. The &ldquo;why&rdquo; column is the reasoning, not folklore —
          in almost every case it comes down to whether a clean, large batch axis is available.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 380 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>regime</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>recommended norm</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>why</th>
              </tr>
            </thead>
            <tbody>
              {([
                { r: "conv net, large batch", n: "BatchNorm", why: "a clean batch axis gives stable per-feature statistics" },
                { r: "small-batch vision, detection, segmentation", n: "GroupNorm", why: "batch too small for reliable BN statistics; GN is batch-independent" },
                { r: "Transformers, sequences, variable length", n: "LayerNorm", why: "no fixed batch axis per token; LN works within each sample" },
                { r: "large language models (efficiency)", n: "RMSNorm", why: "same as LN but cheaper — drops the mean, often the bias" },
                { r: "style transfer", n: "InstanceNorm", why: "strips per-image contrast and colour statistics (style)" },
                { r: "batch size 1, online, RL", n: "LayerNorm or GroupNorm", why: "anything batch-independent; BN has no batch to pool over" },
              ] as const).map((row) => (
                <tr key={row.r}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>{row.r}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: row.n === "BatchNorm" ? "var(--ink)" : "var(--good)", borderBottom: "1px solid var(--border)" }}>{row.n}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>{row.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          The axis definitions behind each row are in the previous three pages of this chapter.
        </p>

        <h2>The one-line rule</h2>
        <p>
          Read the table top to bottom and a single question separates the first row from all the
          others: <strong>do you have a clean, large batch axis?</strong> If yes — a convolutional
          net training with a healthy batch, where each feature&rsquo;s statistics can be estimated
          reliably across many samples — use BatchNorm. If no, for any reason — the batch is small,
          variable, absent, or the samples are sequence tokens rather than independent images —{" "}
          <strong>normalise within the sample instead</strong>, and pick LayerNorm, GroupNorm,
          InstanceNorm or RMSNorm according to what part of the sample you want to pool over.
        </p>
        <p>
          The remaining choice among the within-sample methods is a choice of scope, covered in the
          earlier pages: all features (LayerNorm), a group of channels (GroupNorm), one
          channel&rsquo;s spatial map (InstanceNorm), or LayerNorm without the mean (RMSNorm). But
          the first, load-bearing decision is always the batch-axis question.
        </p>

        <Callout color={CORAL} title={<>Why the guide is short</>}>
          There are five methods and it can feel like five separate decisions, but it is really one.
          BatchNorm is the only member of the family whose statistics reach across samples in the
          mini-batch; the other four are computed entirely within a single sample. So &ldquo;which
          norm&rdquo; collapses to &ldquo;can I trust a batch axis here?&rdquo; — and only when the
          answer is no do the finer distinctions of scope come into play.
        </Callout>

        <Proof color={CORAL} title="why batch-independence decides most of these calls">
          <p>
            BatchNorm normalises each feature using{" "}
            <M>{String.raw`\mu = \frac{1}{B}\sum_{b} x^{(b)}`}</M> and the matching variance,
            estimated over the <M>{String.raw`B`}</M> samples in the mini-batch. The quality of
            that estimate degrades as <M>{String.raw`B`}</M> shrinks: the sampling error of a mean
            grows like <M>{String.raw`1/\sqrt{B}`}</M>, so at <M>{String.raw`B = 2`}</M> the
            statistics are noisy, and at <M>{String.raw`B = 1`}</M> the variance is undefined. When
            samples are sequence tokens of varying length, there is not even a consistent batch axis
            to average along.
          </p>
          <p>
            Every within-sample method computes its statistics from one sample&rsquo;s own
            activations, so its estimate has nothing to do with <M>{String.raw`B`}</M> and is
            identical at batch size 512 or 1. That is the whole reason the table splits where it
            does: the first question is not &ldquo;images or text?&rdquo; but &ldquo;is the batch
            axis large and clean enough to estimate statistics from?&rdquo; When it is, BatchNorm&rsquo;s
            cross-sample statistics are an asset; when it is not, you must move the computation inside
            the sample — and which within-sample method you then pick is a secondary, scope-level
            choice.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>You are training an object-detection model where memory limits you to two images
                per GPU. Which normalisation is the natural choice?</>,
              options: [
                "BatchNorm, because vision tasks always use it",
                "GroupNorm, because it is batch-independent and keeps working where BatchNorm's statistics become too noisy",
                "InstanceNorm, because detection is a per-image task",
              ],
              answer: 1,
              explain: <>At batch size two, BatchNorm&rsquo;s per-feature statistics are estimated
                from a handful of samples and become unreliable. GroupNorm computes its statistics
                within a single sample, so it is unaffected by the tiny batch.</>,
            },
            {
              q: <>What is the single one-line rule that decides most normalisation choices?</>,
              options: [
                "Always use LayerNorm unless you are doing style transfer",
                "If you have a clean large batch axis, use BatchNorm; otherwise normalise within the sample",
                "Use the newest method available, since normalisation research always improves accuracy",
              ],
              answer: 1,
              explain: <>The load-bearing question is whether a reliable batch axis exists. If it
                does, BatchNorm&rsquo;s cross-sample statistics help; if not, you move to a
                within-sample method and choose among them by scope.</>,
            },
            {
              q: <>Why does &ldquo;batch-independent&rdquo; end up being the property that
                distinguishes the recommendations, rather than &ldquo;vision versus language&rdquo;?</>,
              options: [
                "Because batch-independent methods are always more accurate",
                "Because only BatchNorm pools across samples, so its statistics degrade as the batch shrinks; every other method computes from one sample and is unaffected by batch size",
                "Because language models never use a batch axis at all",
              ],
              answer: 1,
              explain: <>The sampling error of BatchNorm&rsquo;s mean grows like{" "}
                <M>{String.raw`1/\sqrt{B}`}</M> and its variance is undefined at{" "}
                <M>{String.raw`B = 1`}</M>. The within-sample methods have no such dependence, so
                the first split in the guide is exactly the batch-axis question.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/initialisation-and-normalisation/rmsnorm", label: <>← RMSNorm</> }}
          next={{ href: "/learn/initialisation-and-normalisation/the-interaction", label: <>Next up · Init × activation × normalisation →</> }}
        />
      </div>
    </article>
  );
}
