import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Group and instance normalisation — Manifold",
  description:
    "GroupNorm and InstanceNorm normalise within a single sample over groups of channels. They complete the BN/LN/GN/IN family, which differs only in which axes it pools over.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function GroupAndInstancePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Beyond batch normalisation", color: CORAL }, { label: "Tier 2 · practitioner", color: CORAL }]}
        time="about 7 minutes"
        title={<>Group and instance normalisation</>}
        intro={<>LayerNorm normalised across every feature of a sample. Group and instance
          normalisation are two more points on the same axis: they also work within a single
          sample, but they choose different subsets of channels to pool over. Together with
          BatchNorm and LayerNorm they form one family whose members differ only in which axes
          they average across.</>}
      />

      <div className="lesson">
        <h2>Group normalisation</h2>
        <p>
          Group normalisation (Wu &amp; He, 2018) was designed to fix BatchNorm&rsquo;s weakness
          on small batches. In vision tasks like detection and segmentation the images are large,
          so memory forces the batch down to two, four, or even one image per GPU. At those sizes
          BatchNorm&rsquo;s per-feature statistics are estimated from a handful of samples, become
          noisy, and its accuracy collapses.
        </p>
        <p>
          GroupNorm sidesteps the problem by never touching the batch axis. It splits the{" "}
          <M>{String.raw`C`}</M> channels of a single sample into <M>{String.raw`G`}</M> groups
          and normalises within each group, using that group&rsquo;s own mean and variance
          computed over its channels and their spatial positions. Because everything is computed
          inside one sample, the batch size is irrelevant — GroupNorm gives the same result at
          batch size 32 and batch size 1, and it recovers the small-batch vision performance that
          BatchNorm loses.
        </p>

        <MathBlock>{String.raw`\hat{x} = \gamma \cdot \frac{x - \mu_{\text{group}}}{\sqrt{\sigma^2_{\text{group}} + \varepsilon}} + \beta`}</MathBlock>

        <p>
          The two edge cases of the group count are worth noticing. If <M>{String.raw`G = 1`}</M>,
          every channel is in one group and GroupNorm normalises over all channels at once — that
          is LayerNorm. If <M>{String.raw`G = C`}</M>, each channel is its own group, and we get
          instance normalisation.
        </p>

        <h2>Instance normalisation</h2>
        <p>
          Instance normalisation is the extreme case where the group has size one: it normalises
          each sample and each channel independently, pooling only over the spatial positions of
          that single channel. Every feature map is rescaled to zero mean and unit variance on its
          own.
        </p>
        <p>
          That specific choice is the workhorse of style transfer. An image&rsquo;s overall
          contrast and colour statistics — how bright it is, how saturated, the mean and spread of
          each channel — are exactly the per-channel spatial statistics that InstanceNorm strips
          out. By removing them, InstanceNorm discards the source image&rsquo;s style information
          while keeping its spatial structure, which is precisely what a style-transfer network
          wants before it paints a new style back on.
        </p>

        <h2>One family, four choices of axis</h2>
        <p>
          BatchNorm, LayerNorm, GroupNorm and InstanceNorm are not four unrelated tricks. They are
          one operation — subtract a mean, divide by a standard deviation, apply a learned affine —
          applied over different axes. The only question each answers differently is: which
          activations go into the mean and variance?
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 380 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>method</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>pools over</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>batch-dependent?</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>typical use</th>
              </tr>
            </thead>
            <tbody>
              {([
                { m: "BatchNorm", axis: "one feature, across the batch", dep: "yes", use: "conv nets, large batch" },
                { m: "LayerNorm", axis: "all features of one sample", dep: "no", use: "Transformers, sequences" },
                { m: "GroupNorm", axis: "a group of channels, one sample", dep: "no", use: "small-batch vision" },
                { m: "InstanceNorm", axis: "one channel's spatial map, one sample", dep: "no", use: "style transfer" },
              ] as const).map((r) => (
                <tr key={r.m}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>{r.m}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)" }}>{r.axis}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: r.dep === "no" ? "var(--good)" : "var(--muted)", borderBottom: "1px solid var(--border)" }}>{r.dep}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>{r.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Callout color={CORAL} title={<>Only BatchNorm reaches across samples</>}>
          Read the third column top to bottom: BatchNorm is the only member of the family whose
          statistics depend on the other samples in the mini-batch. The other three compute
          everything from a single sample&rsquo;s own activations. That is why they all work at
          batch size 1 — and why the choice among them is really a choice of <em>how much of one
          sample</em> to pool over: all its features (LN), a group of channels (GN), or a single
          channel&rsquo;s spatial map (IN).
        </Callout>

        <Proof color={CORAL} title="why normalising spatial statistics removes style">
          <p>
            Model an image channel as a spatial field <M>{String.raw`x(p)`}</M> over pixel
            positions <M>{String.raw`p`}</M>. A great deal of what we perceive as &ldquo;style&rdquo;
            in that channel — its overall brightness and its contrast — is captured by just two
            numbers: the mean <M>{String.raw`\mu = \frac{1}{N}\sum_p x(p)`}</M> and the standard
            deviation <M>{String.raw`\sigma`}</M> of the field. Shifting <M>{String.raw`\mu`}</M>
            rebrightens the channel; scaling <M>{String.raw`\sigma`}</M> restretches its contrast.
          </p>
          <p>
            InstanceNorm replaces the field with{" "}
            <M>{String.raw`\tilde{x}(p) = \bigl(x(p) - \mu\bigr)/\sigma`}</M>, which has mean 0 and
            standard deviation 1 <em>by construction</em>, for every image. Any two images that
            differ only in brightness and contrast are mapped to the identical normalised field —
            the per-channel mean and variance that encoded their style have been quotiented away.
            What survives is the relative spatial pattern: where the channel is high versus low.
            A style-transfer network can then re-inject a target style by choosing new{" "}
            <M>{String.raw`\mu`}</M> and <M>{String.raw`\sigma`}</M> to paint back on, which is the
            core idea behind adaptive instance normalisation.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>Why does GroupNorm recover accuracy on small-batch vision tasks where BatchNorm
                collapses?</>,
              options: [
                "GroupNorm uses more learned parameters, which compensates for the small batch",
                "GroupNorm computes its statistics within a single sample over groups of channels, so it never depends on batch size",
                "GroupNorm keeps a larger running average than BatchNorm does",
              ],
              answer: 1,
              explain: <>BatchNorm&rsquo;s per-feature statistics become noisy when estimated from a
                handful of samples. GroupNorm pools over channel groups inside one sample, so its
                estimate is unaffected by how many images share the batch.</>,
            },
            {
              q: <>What are LayerNorm and InstanceNorm in terms of GroupNorm&rsquo;s group count{" "}
                <M>{String.raw`G`}</M> (with <M>{String.raw`C`}</M> channels)?</>,
              options: [
                "LayerNorm is G = C and InstanceNorm is G = 1",
                "LayerNorm is G = 1 (all channels in one group) and InstanceNorm is G = C (each channel its own group)",
                "Both are special cases only when G equals the batch size",
              ],
              answer: 1,
              explain: <>With <M>{String.raw`G = 1`}</M> all channels are pooled together — that is
                LayerNorm. With <M>{String.raw`G = C`}</M> each channel is normalised alone — that is
                InstanceNorm. GroupNorm interpolates between the two.</>,
            },
            {
              q: <>Why is InstanceNorm the standard choice for style transfer?</>,
              options: [
                "It is the fastest normalisation to compute on images",
                "By normalising each channel over its spatial positions it strips out per-image contrast and colour statistics — the very statistics that encode style",
                "It is the only normalisation that preserves the exact pixel values of the input",
              ],
              answer: 1,
              explain: <>A channel&rsquo;s mean and standard deviation over space carry its
                brightness and contrast — a large part of its style. InstanceNorm forces both to a
                fixed value for every image, discarding that style while keeping the spatial
                structure.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/initialisation-and-normalisation/layer-norm", label: <>← Layer normalisation</> }}
          next={{ href: "/learn/initialisation-and-normalisation/rmsnorm", label: <>Next up · RMSNorm →</> }}
        />
      </div>
    </article>
  );
}
