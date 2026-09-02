import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Funnel, constant, or inverted? — Manifold",
  description:
    "Three classic width schedules — funnel (64-32-16), constant (32-32-32), and inverted (16-32-64) — measured head to head. All three land within 0.002 of each other. The shape barely matters; the total capacity does.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

const th: React.CSSProperties = {
  textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500,
  borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)",
  fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
};

// Section 7 of scripts/architecture_cases.py — funnel vs constant vs inverted.
const ROWS: { name: string; widths: string; params: number; test: string; std: string }[] = [
  { name: "funnel",       widths: "64 → 32 → 16", params: 2817, test: "0.9450", std: "0.0000" },
  { name: "constant",     widths: "32 → 32 → 32", params: 2241, test: "0.9440", std: "0.0049" },
  { name: "inv-funnel",   widths: "16 → 32 → 64", params: 2769, test: "0.9430", std: "0.0040" },
];

export default function WidthSchedulesPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Spending parameters", color: CORAL },
          { label: "Tier 2 · mechanics", color: CORAL },
        ]}
        time="about 8 minutes"
        title={<>Funnel, constant, or inverted?</>}
        intro={<>Once you have decided on depth, a second question appears: should the layers get narrower toward
          the output, stay the same width throughout, or get wider? This is the &ldquo;width schedule&rdquo;
          question, and the measured answer is surprisingly flat.</>}
      />

      <div className="lesson">
        <h2>Three schedules</h2>
        <p>
          There are three common patterns for distributing width across a multi-layer network, and each has an
          intuitive story behind it.
        </p>
        <p>
          <strong>Funnel</strong> (64 &rarr; 32 &rarr; 16): start wide and narrow toward the output. The
          intuition is that early layers need many dimensions to capture the raw input, and later layers
          progressively compress into higher-level, lower-dimensional representations. This is the pattern
          that appears most often in textbooks and tutorials, and it mirrors the structure of convolutional
          networks where spatial dimensions shrink while channel dimensions grow.
        </p>
        <p>
          <strong>Constant</strong> (32 &rarr; 32 &rarr; 32): same width at every layer. No structural
          assumption about the representation — every layer has the same capacity to preserve or transform
          information. This is the simplest choice and the default in most architecture-search frameworks.
        </p>
        <p>
          <strong>Inverted funnel</strong> (16 &rarr; 32 &rarr; 64): start narrow and widen toward the output.
          The intuition is the opposite of the funnel: the input is already low-dimensional, and the network
          needs to expand into a richer space to find a separable representation. This pattern is less common
          in practice but has theoretical support in certain settings.
        </p>

        <h2>The head-to-head</h2>
        <p>
          Same dataset, same optimiser, same depth (three hidden layers), five seeds. The parameter counts
          are not identical — the funnel and inverted funnel have slightly more parameters than the constant
          network because the wide end of the funnel creates larger weight matrices — but they are close
          enough (2,241 to 2,817) that this is not a confound.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 480 }}>
            <thead>
              <tr>
                <th style={th}>schedule</th>
                <th style={th}>widths</th>
                <th style={th}>params</th>
                <th style={th}>test acc</th>
                <th style={th}>test std</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.name}>
                  <td style={{ ...td, fontWeight: 500 }}>{r.name}</td>
                  <td style={td}>{r.widths}</td>
                  <td style={td}>{r.params.toLocaleString()}</td>
                  <td style={td}>{r.test}</td>
                  <td style={td}>{r.std}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Section 7 of <code>scripts/architecture_cases.py</code>. Five seeds, 100 epochs each.
        </p>

        <h2>All three within noise</h2>
        <p>
          The results: funnel 0.945, constant 0.944, inverted 0.943. The spread between best and worst
          is 0.002 — smaller than the seed-to-seed standard deviation of the constant and inverted
          configurations. Statistically, these three results are indistinguishable.
        </p>
        <p>
          This is the honest finding: <strong>the width schedule barely matters, relative to the total number
          of parameters and the depth</strong>. Whether you funnel, hold constant, or invert, you get
          essentially the same test accuracy, because the network&rsquo;s ability to fit the data depends
          primarily on how many total learnable parameters it has and whether the gradient can flow through
          all of them — not on how those parameters are distributed across layers.
        </p>

        <Callout color={CORAL} title={<>Intuition vs measurement</>}>
          The funnel has the strongest intuitive story — later layers represent &ldquo;higher-level&rdquo;
          features that need fewer dimensions. But the measurement says the advantage is at most 0.002,
          which is within noise. The lesson is not that the intuition is wrong; it is that the effect size
          is too small to matter on this problem. When the curriculum or blog post says &ldquo;use a funnel
          because it mirrors the hierarchy of features,&rdquo; it is telling a story, not reporting a
          measured advantage.
        </Callout>

        <h2>Why the shape is a second-order effect</h2>
        <p>
          The{" "}
          <Link href="/learn/architecture-design/the-grid" style={link}>depth-width grid</Link>{" "}
          from the previous page showed that the dominant factors are the minimum width (below which the
          information bottleneck kills you) and the depth (which controls the train-test gap). Given
          that both constraints are satisfied — width is above the bottleneck threshold, depth is not
          excessive — the particular arrangement of widths is a refinement, not a structural decision.
        </p>
        <p>
          Think of it this way: the total number of parameters controls the model&rsquo;s capacity ceiling.
          The minimum width across all layers controls the information bottleneck. The depth controls the
          optimisation difficulty and the memorisation risk. The width <em>schedule</em> — funnel vs constant
          vs inverted — is a way of redistributing parameters that does not change any of those three
          quantities very much. Moving parameters from the first layer to the last (going from funnel to
          inverted) changes the shape of the representation at each stage, but the final layer still has
          access to essentially the same information, routed slightly differently.
        </p>

        <MathBlock>{String.raw`\text{capacity} \;\approx\; \sum_{\ell=1}^{L} n_{\ell-1}\,n_\ell \qquad \text{bottleneck} \;=\; \min_\ell\, n_\ell`}</MathBlock>

        <p>
          As long as the bottleneck width is above the problem&rsquo;s intrinsic dimensionality and the total
          capacity is adequate, rearranging the widths is like rearranging deck chairs.
        </p>

        <h2>When the schedule does matter</h2>
        <p>
          There are settings where the width schedule is <em>not</em> interchangeable, and they all involve
          some form of structural prior that the network needs to respect.
        </p>
        <p>
          <strong>Autoencoders:</strong> The encoder-decoder structure is a funnel by construction — the
          encoder narrows to a bottleneck, and the decoder widens back to the input dimension. The bottleneck
          width is the entire point; it forces the network to learn a compressed representation. Here the
          schedule is not a preference but a requirement.
        </p>
        <p>
          <strong>Convolutional networks:</strong> The spatial dimensions shrink through pooling while the
          channel dimensions grow, creating a funnel in one sense and an inverted funnel in another. This is
          driven by the structure of the problem (images have local correlations that can be progressively
          aggregated) rather than by a general principle about width schedules.
        </p>
        <p>
          <strong>Very deep networks with residual connections:</strong> Modern architectures like ResNets
          hold the width constant within each &ldquo;stage&rdquo; and double it at stage boundaries. The
          constant-within-stage design is motivated by the residual connection, which requires the input and
          output of each block to have the same dimension. This is a constraint imposed by the skip
          connection, not a claim about the optimal width schedule.
        </p>

        <Proof color={CORAL} title="the parameter-count arithmetic of each schedule">
          <p>
            For a three-layer network with input dimension <M>{String.raw`d`}</M> and output
            dimension <M>{String.raw`k`}</M>:
          </p>
          <p>
            Funnel (64 &rarr; 32 &rarr; 16):{" "}
            <M>{String.raw`d \cdot 64 + 64 + 64 \cdot 32 + 32 + 32 \cdot 16 + 16 + 16 \cdot k + k`}</M>
          </p>
          <p>
            Constant (32 &rarr; 32 &rarr; 32):{" "}
            <M>{String.raw`d \cdot 32 + 32 + 32 \cdot 32 + 32 + 32 \cdot 32 + 32 + 32 \cdot k + k`}</M>
          </p>
          <p>
            The funnel uses more parameters because the 64-wide first layer creates a large weight matrix.
            Despite that extra capacity, it achieves essentially the same test accuracy. The extra parameters
            in the wide first layer are not wasted — they absorb the raw input slightly differently — but the
            benefit does not survive to the test set.
          </p>
        </Proof>

        <h2>The practical advice</h2>
        <p>
          <strong>Start constant.</strong> Equal width at every layer is the simplest choice, easiest to
          reason about, and competitive with any other schedule on fully connected networks. If you later
          have a reason to funnel or invert — because the problem has known dimensionality structure, or
          because you are building an autoencoder — let that reason drive the change.
        </p>
        <p>
          Do not funnel &ldquo;because the textbook does.&rdquo; The textbook funnels because it inherited
          the convention from convolutional networks, where the funnel is driven by pooling, not by a
          measured advantage of the width schedule. On a fully connected network, the measurement says the
          choice is nearly free.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>The funnel tests at 0.945, the constant at 0.944, and the inverted at 0.943. What is the
                correct interpretation?</>,
              options: [
                "The funnel is the best architecture and should be preferred",
                "All three are statistically indistinguishable — the 0.002 spread is within seed-to-seed noise, so the width schedule is a second-order effect",
                "The inverted funnel is the worst and should be avoided",
              ],
              answer: 1,
              explain: <>The spread of 0.002 is smaller than the standard deviation of the constant and
                inverted networks themselves (0.0049 and 0.0040). No statistically meaningful ranking can
                be extracted from these numbers. The width schedule is not driving the result.</>,
            },
            {
              q: <>Why does the width schedule have so little effect on test accuracy?</>,
              options: [
                "Because the networks were not trained long enough to show a difference",
                "Because the dominant factors are the minimum width (bottleneck) and total capacity, which are similar across all three schedules",
                "Because all three use the same activation function",
              ],
              answer: 1,
              explain: <>Rearranging widths redistributes parameters without changing the bottleneck
                (the narrowest layer, which bounds the information flow) or the total capacity
                (which bounds the model's expressiveness). Since both constraints are satisfied in
                all three designs, the schedule is a refinement that does not move the needle.</>,
            },
            {
              q: <>When does the width schedule genuinely matter?</>,
              options: [
                "Whenever the network has more than two layers",
                "When the architecture has a structural constraint that couples to the schedule — autoencoders need a bottleneck, ResNets need constant width within stages, CNNs pool spatially",
                "Never — constant width is always optimal",
              ],
              answer: 1,
              explain: <>Structural constraints break the interchangeability. An autoencoder without a
                narrow bottleneck is not an autoencoder. A ResNet with changing width cannot use
                identity skip connections. These are cases where the schedule is part of the design,
                not a free parameter.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/architecture-design/the-grid", label: <>&larr; The depth &times; width grid</> }}
          next={{ href: "/learn/architecture-design/memory-and-compute", label: <>Next up &middot; Memory and compute budgets &rarr;</> }}
        />
      </div>
    </article>
  );
}
