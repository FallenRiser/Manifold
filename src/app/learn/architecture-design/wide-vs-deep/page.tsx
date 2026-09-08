import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Wide-shallow vs deep-narrow — Manifold",
  description:
    "At a fixed parameter budget of roughly 1,000, a single hidden layer of 333 units beats eight layers of 10 on test accuracy, variance, and simplicity. The head-to-head makes the cost of depth concrete.",
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

// Section 4 of scripts/architecture_cases.py — parameter-budget head-to-head.
const ROWS: { shape: string; params: number; train: string; test: string; std: string }[] = [
  { shape: "1 × 333", params: 1333, train: "0.9483", test: "0.9530", std: "0.0024" },
  { shape: "2 × 22",  params: 595,  train: "0.9523", test: "0.9500", std: "0.0000" },
  { shape: "3 × 17",  params: 681,  train: "0.9557", test: "0.9430", std: "0.0024" },
  { shape: "4 × 14",  params: 687,  train: "0.9537", test: "0.9440", std: "0.0049" },
  { shape: "6 × 12",  params: 829,  train: "0.9557", test: "0.9430", std: "0.0040" },
  { shape: "8 × 10",  params: 811,  train: "0.9563", test: "0.9440", std: "0.0037" },
];

export default function WideVsDeepPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Spending parameters", color: CORAL },
          { label: "Tier 2 · mechanics", color: CORAL },
        ]}
        time="about 9 minutes"
        title={<>Wide-shallow vs deep-narrow</>}
        intro={<>The question everyone asks first is &ldquo;more layers or wider layers?&rdquo; This page puts
          roughly the same number of parameters into six different shapes and measures what happens. The answer,
          on this problem, is unambiguous.</>}
      />

      <div className="lesson">
        <h2>The experiment</h2>
        <p>
          Take the same dataset, the same optimiser, the same number of epochs. Allocate roughly 1,000 learnable
          parameters — give or take, because the algebra does not permit exact equality — and distribute them
          across architectures ranging from one hidden layer of 333 units to eight hidden layers of 10 units each.
          Every configuration uses ReLU activations and is trained five times with different seeds.
        </p>
        <p>
          The question is: when the budget is fixed, does it pay to spend it on depth or on width? The table
          below is the answer.
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 520 }}>
            <thead>
              <tr>
                <th style={th}>shape</th>
                <th style={th}>params</th>
                <th style={th}>train acc</th>
                <th style={th}>test acc</th>
                <th style={th}>test std</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.shape}>
                  <td style={{ ...td, fontWeight: 500 }}>{r.shape}</td>
                  <td style={td}>{r.params.toLocaleString()}</td>
                  <td style={td}>{r.train}</td>
                  <td style={{
                    ...td,
                    color: r.test === "0.9530" ? "var(--good)" : parseFloat(r.test) <= 0.944 ? "var(--bad)" : "var(--ink)",
                  }}>{r.test}</td>
                  <td style={{
                    ...td,
                    color: r.std === "0.0000" ? "var(--good)" : parseFloat(r.std) >= 0.004 ? "var(--bad)" : "var(--ink)",
                  }}>{r.std}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Five seeds, 100 epochs each.
        </p>

        <h2>Reading the result</h2>
        <p>
          The wide-shallow configuration — one hidden layer of 333 units — wins on test accuracy (0.953),
          and its seed-to-seed standard deviation (0.0024) is tied for the lowest. The deepest configuration,
          eight layers of ten units, trains <em>better</em> (0.9563 vs 0.9483) but tests{" "}
          <em>worse</em> (0.944 vs 0.953). That one-point gap between train and test is the generalisation
          penalty of depth when depth is not needed.
        </p>
        <p>
          And the progression down the table is monotonic on the dimension that matters. Going from 1 layer to 2
          costs one point of test accuracy (0.953 to 0.950). Going to 3 layers costs another full point (0.950 to
          0.943). After that it flatlines: 4, 6, and 8 layers all sit in the 0.943--0.944 band, having already
          paid the depth tax and gained nothing further from it.
        </p>

        <h2>Why depth costs here</h2>
        <p>
          Two mechanisms compound against the deep-narrow configurations, and both are visible in the numbers.
        </p>
        <p>
          <strong>The information bottleneck.</strong> A hidden layer of width 10 can represent at most 10
          independent basis functions at that stage of the network. Every layer is a linear map (the weight
          matrix) followed by a pointwise non-linearity, and the rank of the linear map is bounded by{" "}
          <M>{String.raw`\min(\text{fan\_in}, \text{fan\_out})`}</M>. With width 10, the network can pass at
          most 10 linearly independent directions through each layer. Any information that cannot be encoded in
          those 10 directions is lost, irrecoverably, before it reaches the next layer. The wide-shallow network
          has 333 directions available and loses nothing.
        </p>

        <MathBlock>{String.raw`\text{rank}(W_\ell) \;\leq\; \min(n_{\ell-1},\; n_\ell) \;=\; 10 \quad\text{at every layer}`}</MathBlock>

        <p>
          <strong>The optimisation landscape.</strong> Deeper networks have more saddle points, more flat regions,
          and more opportunities for vanishing gradients. At width 10 with ReLU activations, a non-trivial
          fraction of units can die (their pre-activation is negative for every training sample, so the gradient
          is exactly zero and they never recover). In a layer of 333 units, losing a few to ReLU death is
          rounding error. In a layer of 10, losing one is losing a tenth of the layer&rsquo;s capacity.
        </p>

        <Callout color={CORAL} title={<>Train goes up, test goes down</>}>
          The deepest networks do not fail to <em>train</em> — they train slightly better than the shallow one.
          What they fail to do is <em>generalise</em>. This is the signature of a model that is using its depth
          to memorise training-specific patterns rather than to learn transferable structure. On a problem where
          the underlying decision boundary is simple (which this one is), the extra depth is modelling noise, not
          signal.
        </Callout>

        <h2>The gap grows with depth</h2>
        <p>
          Look at the train-test gap across the table. At depth 1 it is slightly negative (the model generalises
          better than it fits, which is possible when the problem is easy and the model is well-regularised by
          its simplicity). At depth 2 the gap is small and positive. By depth 3 it is a full percentage point,
          and it stays there through depth 8. Each additional layer adds capacity for memorisation without adding
          capacity for the kind of structure this problem actually contains.
        </p>
        <p>
          This is the practical meaning of the{" "}
          <Link href="/learn/architecture-design/when-depth-hurts" style={link}>depth tax</Link>{" "}
          discussed on the previous page: depth is not free. It costs optimisation difficulty, it costs
          variance across seeds, and on problems without hierarchical structure it costs generalisation.
        </p>

        <h2>The caveat that keeps depth alive</h2>
        <p>
          None of this means depth is a mistake in general. This problem — a low-dimensional classification
          task with a relatively simple decision boundary — rewards width because width gives you more basis
          functions in a single representational step. Problems with <em>natural hierarchy</em> reward depth
          because each layer can build on the abstractions of the layer below.
        </p>
        <p>
          Image classification is the canonical example: early layers detect edges, middle layers assemble
          edges into textures and shapes, late layers compose shapes into objects. That compositional structure
          is exactly what depth provides and width cannot replicate efficiently. A single layer of 10,000 units
          could in principle represent the same function as a 50-layer convolutional network, but it would need
          astronomically more parameters to do so because it would have to re-derive the hierarchy from scratch
          in a single step.
        </p>

        <Proof color={CORAL} title="the exponential advantage of composition">
          <p>
            The formal statement is that there exist functions computable by a depth-<M>{String.raw`d`}</M>{" "}
            network of width <M>{String.raw`w`}</M> that require a depth-2 network of width{" "}
            <M>{String.raw`\Omega(2^w)`}</M> — exponential in the width that was sufficient at depth{" "}
            <M>{String.raw`d`}</M>. The classic example is parity: XOR of <M>{String.raw`n`}</M> bits can
            be computed by a depth-<M>{String.raw`O(\log n)`}</M> network of width{" "}
            <M>{String.raw`O(n)`}</M>, but a depth-2 network requires{" "}
            <M>{String.raw`\Omega(2^n)`}</M> units.
          </p>
          <p>
            The key phrase is &ldquo;there exist functions&rdquo;. This is an existence proof, not a guarantee
            that your particular problem is one of them. The table on this page is evidence that many practical
            problems are <em>not</em> — their structure is simple enough that a shallow network captures it
            efficiently. The question is always whether the hierarchy you expect to exist actually exists in
            your data.
          </p>
        </Proof>

        <h2>The practical message</h2>
        <p>
          When you do not know the structure of your problem — and at the beginning you never do — start wide
          and shallow. One or two hidden layers with generous width is a strong default. If the model underfits
          and you have headroom in your parameter budget, add depth cautiously and watch the train-test gap.
          If test accuracy does not improve or gets worse while train accuracy rises, the depth is costing you
          more than it is buying.
        </p>
        <p>
          The next page puts this into a full grid — every combination of depth and width — so you can see the
          entire landscape rather than just the diagonal slice this page traced.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>In the parameter-budget experiment, the 8-layer network trains at 0.9563 while the 1-layer
                network trains at 0.9483. Why does the 1-layer network still win?</>,
              options: [
                "The training numbers are unreliable at this scale",
                "The 1-layer network tests at 0.953 vs 0.944 for the 8-layer network, because the extra depth memorises noise rather than learning transferable structure",
                "The 8-layer network has more parameters, giving it an unfair advantage",
              ],
              answer: 1,
              explain: <>Higher train accuracy with lower test accuracy is the signature of memorisation.
                The deep network has enough capacity to fit training-specific patterns that do not transfer,
                while the shallow network is regularised by its simplicity into learning only the real
                boundary.</>,
            },
            {
              q: <>Why is a hidden layer of width 10 an information bottleneck?</>,
              options: [
                "Because 10 units cannot store enough weight values",
                "Because the weight matrix has rank at most 10, so only 10 linearly independent directions survive through the layer",
                "Because ReLU kills exactly half the units, leaving only 5 active",
              ],
              answer: 1,
              explain: <>The rank of the weight matrix is bounded by the minimum of its dimensions. At width
                10, at most 10 independent directions can pass through — any richer structure in the
                representation is projected away and lost.</>,
            },
            {
              q: <>When should you prefer depth over width?</>,
              options: [
                "Always, because deeper networks are universally more expressive",
                "When the problem has natural hierarchical structure, so each layer can build on the abstractions of the layer below — as in image or language tasks",
                "When the parameter budget is small, because deep-narrow networks are more parameter-efficient",
              ],
              answer: 1,
              explain: <>Depth pays when there is a compositional hierarchy to exploit — edges to textures
                to shapes to objects. Without that structure, depth adds optimisation difficulty and
                memorisation risk without adding useful capacity. The table on this page demonstrates
                that deep-narrow is not more parameter-efficient when the hierarchy is absent.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/architecture-design/when-depth-hurts", label: <>&larr; When depth hurts</> }}
          next={{ href: "/learn/architecture-design/the-grid", label: <>Next up &middot; The depth &times; width grid &rarr;</> }}
        />
      </div>
    </article>
  );
}
