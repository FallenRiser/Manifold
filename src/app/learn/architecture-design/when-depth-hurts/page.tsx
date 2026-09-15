import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { GridHeatmap } from "@/components/figures/arch/ArchFigures";
import { GRID, GRID_DEPTHS, GRID_WIDTHS } from "@/components/figures/arch/data";

export const metadata = {
  title: "When depth hurts — Manifold",
  description:
    "The measured cases where adding layers makes the network worse: width too narrow for the depth, problems without hierarchy, and optimisation collapse. Each failure mode has a signature and a remedy.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function WhenDepthHurtsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Depth", color: CORAL }, { label: "Tier 1 · failure modes", color: CORAL }]}
        time="about 10 minutes"
        title={<>When depth hurts</>}
        intro={<>The previous pages showed the theory: depth buys composition, but it taxes gradients,
          parameters, and optimisation. This page shows the measured failures. Three configurations,
          three different ways depth made the model worse, three different explanations. None of
          them required faith — the numbers told the story.</>}
      />

      <div className="lesson">
        <h2>Case 1: the information bottleneck (depth 8, width 4)</h2>
        <p>
          At width 4, the depth sweep produces a dramatic collapse. Here are the numbers:
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 340 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>depth</th>
                <th style={{ textAlign: "left", padding: "6px 18px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>test accuracy (width 4)</th>
              </tr>
            </thead>
            <tbody>
              {([
                { d: 1, acc: "0.852", bad: false },
                { d: 2, acc: "0.869", bad: false },
                { d: 4, acc: "0.912", bad: false },
                { d: 6, acc: "0.813", bad: true },
                { d: 8, acc: "0.654", bad: true },
              ] as const).map((row) => (
                <tr key={row.d}>
                  <td style={{ padding: "6px 18px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)" }}>{row.d}</td>
                  <td style={{ padding: "6px 18px 6px 0", color: row.bad ? "var(--bad)" : "var(--ink)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums", fontWeight: row.bad ? 600 : 400 }}>{row.acc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          Width 4, ReLU, He init.
        </p>

        <p>
          Depth 4 at width 4 is the best: <strong>0.912</strong>. At depth 6 the network has already
          dropped to 0.813. At depth 8 it has collapsed to <strong>0.654</strong> — barely above
          chance for a binary classification problem. The network has not merely underperformed; it
          has <em>stopped learning</em>.
        </p>
        <p>
          The explanation is an information bottleneck. Each hidden layer has only 4 units, so the
          representation at any layer is a 4-dimensional vector. Everything the network knows about
          the input must be compressed into those 4 numbers before being passed to the next layer.
          At depth 2, this compression is mild — the network makes one lossy pass and then
          classifies. At depth 8, the input has been compressed through 8 successive 4-dimensional
          bottlenecks, and by the end, the representation has lost too much information to support
          accurate classification.
        </p>
        <p>
          This is compounded by{" "}
          <Link href="/learn/activation-functions/dying-relu" style={link}>dead ReLU units</Link>.
          At width 4, each dead unit removes 25% of a layer&rsquo;s capacity. If two of the four
          units in a layer die — and with He initialisation and ReLU, this is not unlikely at
          narrow widths — the layer passes only a 2-dimensional signal forward. Eight such layers
          in sequence means the information is being squeezed through a series of progressively
          degraded representations. The network does not just lack capacity; it lacks the ability
          to preserve the information it needs.
        </p>

        <Callout color={CORAL} title={<>The width floor for depth</>}>
          Depth and width are not interchangeable budgets. You cannot compensate for narrow
          layers by adding more of them. Each layer must be wide enough to <em>carry</em> the
          information that the layers above it need. As a rough heuristic, the minimum useful
          width grows with depth: a depth-2 network can work with narrow layers, but a depth-8
          network needs each layer to be wide enough that a few dead units do not collapse the
          representation. On moons at depth 8, width 4 collapses; width 32 does not.
        </Callout>

        <h2>Case 2: depth without hierarchy (depth 8, width 32)</h2>
        <p>
          Now consider the case where width is generous but depth is still excessive. At width 32
          and depth 8, the network scores <strong>0.936</strong>. That is not a collapse — it is
          a functioning model — but it is 0.017 worse than depth 2 at the same width (0.953), and
          it uses roughly 7 times the parameters.
        </p>
        <p>
          The failure here is not catastrophic but economic. The moons problem has a single curved
          boundary with no multi-level structure. A depth-2 network warps the space and classifies;
          layers 3 through 8 have no compositional work to do. They act as near-identity
          transformations — expensive pass-throughs that add parameters, add activation memory, and
          slightly roughen the loss landscape, but contribute nothing to the function.
        </p>
        <p>
          The 0.017 drop is the optimisation tax. Even with He+ReLU keeping the gradient ratio
          healthy (2.52 at depth 8), the deeper loss surface is harder to navigate. The optimiser
          converges to a slightly worse minimum than it would have found in the shallower, simpler
          landscape. The extra layers are not just useless; they actively interfere with the
          search for a good solution.
        </p>

        <h2>Case 3: optimisation failure at extreme depth (depth 40, width 16)</h2>
        <p>
          The most instructive failure is the one where the gradient looks fine but the model does
          not. At depth 20 with width 16, the gradient ratio is <strong>2.23</strong> — squarely
          in the healthy range. He initialisation has done its job. The gradient signal is arriving
          at the first layer with nearly the same magnitude it had at the last.
        </p>
        <p>
          And yet, trained with plain SGD, the same family of networks reads 0.940 at depth 20,
          0.770 at depth 30 and <strong>0.750</strong> at depth 40 — a fall of 0.190 across the back
          half of the sweep, with the ratios unchanged. The network is not failing to propagate
          gradients; it is failing to use them. The loss landscape at depth 40 is so rough — so full
          of saddle points, sharp curvature changes, and narrow ravines — that gradient descent with
          a standard learning rate cannot navigate it.
        </p>
        <p>
          This is the most important lesson in this page. Gradient preservation is necessary for
          deep learning, and the last decade of research on initialisation and normalisation has
          been devoted to achieving it. But it is not sufficient. A network with perfect gradient
          flow can still fail to train if the geometry of the loss surface defeats the optimiser.
          Depth creates that geometry: more layers mean more parameters, more saddle points, more
          places where the curvature switches sign, more directions where a step that reduces the
          loss in one dimension increases it in another.
        </p>

        <Proof color={CORAL} title="why gradient ratio alone is misleading">
          <p>
            The gradient ratio measures the <em>norm</em> of the gradient at two layers. A ratio
            near 1 means the norms are similar, but it says nothing about the{" "}
            <em>direction</em> of the gradient. At depth 20, the gradient vector at the first
            layer changes direction substantially from one mini-batch to the next — the
            signal-to-noise ratio of the gradient direction is poor even though its magnitude is
            stable.
          </p>
          <p>
            This is the difference between a compass needle that points consistently north (low
            depth) and one that spins erratically but always reads the same distance from the
            magnet (high depth with good ratio). The second compass has a &ldquo;healthy&rdquo;
            reading by the magnitude metric but is useless for navigation. The optimiser needs
            consistent direction, not just consistent magnitude.
          </p>
          <p>
            In addition, the gradient ratio is measured at initialisation or early in training.
            As the network trains, the loss landscape deforms, and a ratio that started at 2.23
            can become much worse in regions of sharp curvature. The initialisation guarantee
            is a starting condition, not a running invariant.
          </p>
        </Proof>

        <GridHeatmap
          cells={GRID}
          depths={GRID_DEPTHS}
          widths={GRID_WIDTHS}
          caption={<>Two of the three failures are visible in one corner of this grid. Read down the
            width-4 column: 0.8520, 0.8690, 0.8570, 0.9120, 0.8130, and then <strong>0.6540</strong>{" "}
            at depth 8 — the information bottleneck, where the network is asked to carry everything
            it knows through four units, twice over. Now read across the depth-8 row instead: it
            recovers to 0.9440 by width 8 and never improves after that. Depth without width is the
            failure; depth with width is merely a waste.</>}
        />

        <h2>The three-failure taxonomy</h2>
        <p>
          The three cases form a clean taxonomy of how depth fails:
        </p>

        <div style={{ overflowX: "auto", margin: "1.2rem 0" }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13.5, minWidth: 520 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 14px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>configuration</th>
                <th style={{ textAlign: "left", padding: "6px 14px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>test acc</th>
                <th style={{ textAlign: "left", padding: "6px 14px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>failure mode</th>
                <th style={{ textAlign: "left", padding: "6px 14px 6px 0", color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--border-strong)", whiteSpace: "nowrap" }}>remedy</th>
              </tr>
            </thead>
            <tbody>
              {([
                { cfg: "depth 8, width 4", acc: "0.654", mode: "information bottleneck", remedy: "increase width" },
                { cfg: "depth 8, width 32", acc: "0.936", mode: "no hierarchy to exploit", remedy: "reduce depth" },
                { cfg: "depth 40, width 16, plain SGD", acc: "0.750", mode: "optimisation failure", remedy: "reduce depth, or add skip connections and normalisation" },
              ] as const).map((row) => (
                <tr key={row.cfg}>
                  <td style={{ padding: "6px 14px 6px 0", color: "var(--ink)", fontWeight: 500, borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{row.cfg}</td>
                  <td style={{ padding: "6px 14px 6px 0", color: "var(--bad)", borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{row.acc}</td>
                  <td style={{ padding: "6px 14px 6px 0", color: "var(--ink)", borderBottom: "1px solid var(--border)" }}>{row.mode}</td>
                  <td style={{ padding: "6px 14px 6px 0", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>{row.remedy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          Each failure has a different root cause and a different remedy. The information bottleneck
          is fixed by increasing width, not by changing the optimiser. The hierarchy mismatch is
          fixed by reducing depth, not by adding regularisation. The optimisation failure is fixed
          by reducing depth <em>or</em> by adding skip connections (which fundamentally change the
          loss landscape and are the subject of the next chapter).
        </p>

        <h2>The comparison that matters</h2>
        <p>
          The depth-8, width-32 configuration has roughly 8,000 parameters and scores 0.936. The
          depth-2, width-32 configuration has roughly 1,200 parameters and scores 0.953. The
          deeper model is worse <em>and</em> larger. This is not a pathological edge case; it is the
          typical outcome when depth exceeds the problem&rsquo;s structural depth.
        </p>
        <p>
          An even starker comparison: depth 2 at width 32 (0.953, ~1,200 parameters) versus depth 8
          at width 64 (0.932, ~29,000 parameters). The wide-deep configuration uses{" "}
          <strong>25 times</strong> the parameters and still scores lower. More parameters are not
          inherently better; they are better only when the architecture matches the problem&rsquo;s
          structure. When it does not, more parameters are more ways to overfit, more activation
          memory, more training time, and a worse result.
        </p>

        <Callout color={CORAL} title={<>When to suspect depth is hurting</>}>
          <strong>Check for these symptoms.</strong> (1) The depth sweep peaks early and then
          declines — the strongest signal that the problem&rsquo;s structure is shallow. (2) Training
          loss is much lower than validation loss — the extra layers are memorising rather than
          generalising. (3) Training loss barely decreases — the optimiser is stuck, often in a deep
          architecture that has outrun the problem&rsquo;s complexity. The remedy in every case is
          the same: try the same total parameter budget in a shallower, wider architecture.
        </Callout>

        <h2>The deeper lesson</h2>
        <p>
          Depth is not a virtue. It is a tool — powerful when the problem demands it, costly when
          it does not. The deep-learning revolution was driven by problems that happen to have deep
          hierarchical structure: images, audio, language. On those problems, depth is
          transformative because it lets the network build levels of abstraction that a shallow
          network cannot represent efficiently. On problems without that structure — tabular data,
          low-dimensional classification, already-featurised inputs — depth beyond 2 or 3 is
          usually a net negative.
        </p>
        <p>
          The numbers on this page are not cautionary tales about deep learning in general. They
          are calibration data for the specific question this track is about: how much depth does{" "}
          <em>this</em> problem need? The answer on moons is 2. The answer on your problem is
          whatever the depth sweep tells you. Run it, read it, and believe it.
        </p>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>At width 4 and depth 8, test accuracy drops to 0.654. What is the primary
                failure mechanism?</>,
              options: [
                "Vanishing gradients caused by the narrow width",
                "The 4-unit layers create an information bottleneck: 8 successive compressions through 4 dimensions lose too much information, and dead ReLU units make it worse",
                "The model overfits because depth 8 has too many parameters for the dataset",
              ],
              answer: 1,
              explain: <>At width 4, each hidden layer represents the input as a 4-dimensional
                vector. Eight successive compressions through that bottleneck lose information
                cumulatively. Dead ReLU units further reduce the effective width — at width 4,
                a single dead unit removes 25% of the layer&rsquo;s capacity. The result is a
                network that cannot carry enough information forward to classify accurately.</>,
            },
            {
              q: <>Depth 2 at width 32 (0.953) beats depth 8 at width 64 (0.932) with 25 times
                fewer parameters. What does this demonstrate?</>,
              options: [
                "Smaller models always generalise better due to simpler decision boundaries",
                "The moons problem has shallow structure, so extra depth and width beyond the optimal point add cost without adding useful capacity, and the optimisation tax degrades performance",
                "The depth-8 model is underfitting because it needs more training epochs",
              ],
              answer: 1,
              explain: <>On a problem with one curved boundary and no feature hierarchy, depth 2
                is structurally sufficient. Adding more layers and more width adds parameters that
                the problem cannot use productively. The extra depth makes the loss landscape harder
                to navigate, and the extra width makes each layer&rsquo;s gradient noisier. The
                result is a model that is larger, slower, and less accurate.</>,
            },
            {
              q: <>A network at depth 40 has a healthy gradient ratio but, under plain SGD, only
                reaches 0.750 test accuracy. Which remedy is most likely to help?</>,
              options: [
                "Switch to a better initialisation scheme to fix the gradient ratio",
                "Add more training data to prevent overfitting",
                "Reduce depth or add skip connections to smooth the loss landscape",
              ],
              answer: 2,
              explain: <>The gradient ratio is already healthy, so better initialisation will not
                help. The problem is the loss landscape geometry: too many saddle points and sharp
                curvature changes for the optimiser to navigate. Reducing depth simplifies the
                landscape directly. Skip connections (the subject of the next chapter) reshape it
                by adding shortcut paths that bypass the worst curvature, achieving the same
                effect without giving up depth.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/architecture-design/the-depth-tax", label: <>&#8592; The depth tax</> }}
          next={{ href: "/learn/architecture-design/wide-vs-deep", label: <>Next up &middot; Wide-shallow vs deep-narrow &#8594;</> }}
        />
      </div>
    </article>
  );
}
