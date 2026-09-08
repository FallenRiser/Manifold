import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";

export const metadata = {
  title: "Init × activation × normalisation — Manifold",
  description:
    "Initialisation, activation, and normalisation are one system, not three independent choices. A measured 3-way grid shows the activation is first-order, the init is a second-order correction, and normalisation makes the init choice nearly irrelevant.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TheInteractionPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "The interaction", color: CORAL }, { label: "Tier 2 · practitioner", color: CORAL }]}
        time="about 9 minutes"
        title={<>Init × activation × normalisation</>}
        intro={<>You have now met the three levers separately: the initialisation scheme, the
          activation function, and the normalisation layer. The temptation is to treat them as three
          independent knobs on a mixing desk. They are not. They are <strong>one system</strong> that
          jointly decides whether the gradient survives the trip through your network — and once you
          measure them together, a clear hierarchy appears.</>}
      />

      <div className="lesson">
        <h2>One number that summarises all three</h2>
        <p>
          To compare choices fairly we need a single scalar that captures &ldquo;can a gradient reach
          the first layer?&rdquo; The natural one is the <strong>gradient ratio at init</strong>: the
          magnitude of the gradient at the first layer divided by its magnitude at the last, measured
          on a freshly initialised network before any training. A ratio near 1 means the gradient
          arrives at the bottom roughly as strong as it left the top. A ratio of 10<sup>5</sup> means
          the signal has been amplified five orders of magnitude on the way down — the network is
          already unstable at step zero.
        </p>
        <p>
          The grid below fixes the architecture (depth 8, width 32, no normalisation) and sweeps two
          activations against two initialisations. Every number is the gradient ratio measured at
          initialisation. Read it as a two-by-three factorial: the <em>rows</em> vary the activation,
          the <em>init column</em> varies within each activation.
        </p>

        <h2>The measured grid</h2>
        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 420 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>activation</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>init</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>gradient ratio at init</th>
              </tr>
            </thead>
            <tbody>
              {([
                { act: "sigmoid", init: "Xavier", ratio: "455,145", bad: true },
                { act: "sigmoid", init: "He", ratio: "55,073", bad: true },
                { act: "tanh", init: "Xavier", ratio: "6.80", bad: false },
                { act: "tanh", init: "He", ratio: "4.35", bad: false },
                { act: "relu", init: "Xavier", ratio: "1.62", bad: false },
                { act: "relu", init: "He", ratio: "2.71", bad: false },
              ] as const).map((r, i) => (
                <tr key={i}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>{r.act}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)" }}>{r.init}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: r.bad ? "var(--bad)" : "var(--good)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}>{r.ratio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Depth 8, width 32, no normalisation. Gradient ratio = first-layer gradient norm ÷ last-layer
          gradient norm at initialisation.
        </p>

        <h2>Reading the grid: a strict hierarchy</h2>
        <p>
          The single loudest signal in the table is the <strong>activation</strong>. Sigmoid is
          catastrophic under <em>either</em> initialisation: 455,145 with Xavier and 55,073 with He.
          Both are five-to-six orders of magnitude away from the healthy range. Switching the init
          from Xavier to He improves sigmoid by a factor of eight — real, but utterly irrelevant when
          you are still five orders of magnitude out. A sigmoid stack at depth 8 is broken no matter
          how you initialise it, because each sigmoid layer saturates and its local derivative
          collapses toward zero. This is a <strong>first-order</strong> effect.
        </p>
        <p>
          Now look at tanh and ReLU. Every one of those four rows lands in single digits: 6.80, 4.35,
          1.62, 2.71. All four are perfectly trainable. Within tanh, He beats Xavier (4.35 vs 6.80);
          within ReLU, Xavier happens to edge He (1.62 vs 2.71). The init clearly matters here — but
          only to move you between &ldquo;fine&rdquo; and &ldquo;slightly finer.&rdquo; Given a
          non-saturating activation, the choice of init is a <strong>second-order</strong> correction.
        </p>

        <Callout color={CORAL} title={<>The order of operations is the whole lesson</>}>
          Pick the <strong>activation</strong> first — it decides whether you are in the single-digit
          world or the six-figure world. <em>Then</em> match the <strong>init</strong> to it (He↔ReLU,
          Xavier↔tanh) to shave the ratio toward 1. Choosing a beautiful initialisation for a sigmoid
          stack is polishing a broken lever; choosing the activation first makes the init a minor
          tune-up rather than a rescue operation.
        </Callout>

        <h2>Where normalisation comes in</h2>
        <p>
          The grid above has <em>no</em> normalisation. Add a normalisation layer after each linear
          layer and the picture changes again: the activation scale is reset to roughly unit variance
          at every layer, so the per-layer factors that build up into these ratios are continually
          corrected. In our depth-10 measurement, an un-normalised ReLU+He network drifts from
          activation std 0.61 down to 0.39 across the depth; the LayerNorm-simulated version holds
          between 0.48 and 0.65 the whole way. Normalisation is the <strong>third leg</strong>: it does
          not replace a good activation or a matched init, it makes the init <em>scale</em> stop
          mattering, because whatever scale the init produced is flattened out layer by layer.
        </p>
        <p>
          So the full design rule reads as a pipeline. Choose a non-saturating activation to escape the
          six-figure regime. Match the initialisation to buy the last factor toward a ratio of 1. Add
          normalisation to buy <em>robustness</em> — the freedom to be a little wrong about the init and
          learning rate and still train. Each leg does a different job, and they compose in that order.
        </p>

        <Proof color={CORAL} title="why the gradient ratio is the right single number">
          <p>
            Backpropagation through a depth-<M>{String.raw`D`}</M> network multiplies one Jacobian per
            layer. The gradient at layer 1 relative to the gradient at layer <M>{String.raw`D`}</M> is,
            up to the loss term, the product of the per-layer Jacobian norms:
          </p>
          <MathBlock>{String.raw`\frac{\lVert \nabla_1 \rVert}{\lVert \nabla_D \rVert} \;\approx\; \prod_{i=2}^{D} \bigl\lVert J_i \bigr\rVert, \qquad J_i = \frac{\partial \mathbf{h}_i}{\partial \mathbf{h}_{i-1}}.`}</MathBlock>
          <p>
            Each factor <M>{String.raw`\lVert J_i \rVert`}</M> is set by exactly the three things this
            page is about: the activation&rsquo;s local derivative (saturating activations push this
            toward 0), the weight scale (which the init sets), and any normalisation (which rescales{" "}
            <M>{String.raw`\mathbf{h}_i`}</M> back toward unit variance). A single scalar — the product —
            therefore summarises all three interacting choices at once, which is why it is the honest
            way to compare rows of the grid. When the product is near 1 the gradient is preserved; when
            it is 10<sup>5</sup> the network is unstable before the first step.
          </p>
        </Proof>

        <h2>The takeaway</h2>
        <p>
          Do not tune these three in isolation. The activation sets the regime, the init corrects
          within the regime, and normalisation makes the correction forgiving. If you remember one
          thing from the whole track, remember that the biggest number in the grid — 455,145 — was
          caused by an <em>activation</em> choice, not an init choice, and no initialisation could have
          saved it.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>In the grid, sigmoid+Xavier gives a gradient ratio of 455,145 and sigmoid+He gives
                55,073, while every tanh and ReLU row is in single digits. What is the correct reading?</>,
              options: [
                "He initialisation is always eight times better than Xavier",
                "The activation is the first-order effect: a saturating activation ruins the ratio under either init, so no initialisation can rescue a sigmoid stack at depth 8",
                "Sigmoid would be fine if the network were shallower and the init were Xavier",
              ],
              answer: 1,
              explain: <>Both sigmoid rows are five-to-six orders of magnitude out of range. Switching
                init from Xavier to He improves sigmoid by 8×, but that is irrelevant when you are still
                55,073 away from a healthy ratio. The activation, not the init, is the dominant term.</>,
            },
            {
              q: <>Given a non-saturating activation, how big is the effect of choosing He versus
                Xavier, according to the grid?</>,
              options: [
                "It is the dominant effect — it changes the ratio by orders of magnitude",
                "It is a second-order correction — it moves the ratio between single-digit values (e.g. tanh 6.80 → 4.35), not between regimes",
                "It has no measurable effect once the activation is fixed",
              ],
              answer: 1,
              explain: <>Within tanh, He (4.35) beats Xavier (6.80); within ReLU, Xavier (1.62) edges He
                (2.71). The init genuinely matters, but only to move you between &ldquo;fine&rdquo; and
                &ldquo;slightly finer&rdquo; once the activation has put you in the single-digit world.</>,
            },
            {
              q: <>What does adding a normalisation layer after each linear layer contribute that a
                good init alone does not?</>,
              options: [
                "It replaces the need to choose a non-saturating activation",
                "It resets the activation scale toward unit variance at every layer, so the init scale stops mattering — buying robustness on top of the activation and init choices",
                "It guarantees the gradient ratio is exactly 1 regardless of activation",
              ],
              answer: 1,
              explain: <>Normalisation is the third leg. It does not replace a good activation or a
                matched init; it re-enforces the scale layer by layer (std held at 0.48–0.65 vs a drift
                to 0.39 without it), which makes the init scale nearly irrelevant and the whole system
                forgiving.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/initialisation-and-normalisation/which-norm-when", label: <>← Which normalisation when</> }}
          next={{ href: "/learn/initialisation-and-normalisation/why-norm-reduces-sensitivity", label: <>Next up · Why normalisation reduces init sensitivity →</> }}
        />
      </div>
    </article>
  );
}
