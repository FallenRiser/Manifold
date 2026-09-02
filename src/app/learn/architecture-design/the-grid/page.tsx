import Link from "next/link";
import { LessonHeader, Callout, Proof, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { Quiz } from "@/components/Quiz";
import { LabFrame } from "@/components/LabFrame";
import { DepthVsWidthLab } from "@/components/labs/DepthVsWidthLab";

export const metadata = {
  title: "The depth × width grid — Manifold",
  description:
    "Thirty cells, six depths, five widths, every combination measured. The interactive heatmap shows where test accuracy lives, where the train-test gap explodes, and why the sweet spot is a surprisingly compact region.",
};

const CORAL = "var(--c-neural)";
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

export default function TheGridPage() {
  return (
    <article>
      <LessonHeader
        chips={[
          { label: "Spending parameters", color: CORAL },
          { label: "Tier 2 · mechanics", color: CORAL },
        ]}
        time="about 10 minutes"
        title={<>The depth &times; width grid</>}
        intro={<>The previous page traced a diagonal: fixed budget, trade depth for width. This page fills in the
          entire rectangle. Six depths, five widths, thirty cells — each one a fully trained network measured on
          held-out data. The heatmap that emerges has a clear hotspot, and its shape teaches you more than any
          individual number.</>}
      />

      <div className="lesson">
        <h2>What the grid measures</h2>
        <p>
          Every cell in the grid below is an MLP trained on the same classification task, with the same
          optimiser, the same number of epochs, and the same five random seeds. The two axes are the things
          you control: <strong>depth</strong> (number of hidden layers, from 1 to 8) and{" "}
          <strong>width</strong> (units per hidden layer, from 4 to 64). Everything else is held constant.
        </p>
        <p>
          The colour of each cell encodes test accuracy — the number that matters. You can switch to a
          train-test gap view to see where the model is memorising, or click any cell to inspect its
          exact train accuracy, test accuracy, parameter count, and seed-to-seed variance.
        </p>

        <LabFrame
          accent={CORAL}
          tryThis={<>Click cells to inspect. Switch to train-test gap view. Find the sweet spot where
            test accuracy is highest and the gap is smallest.</>}
          insight={<>The hotspot is a compact region: depth 1--2, width 16--64. Adding depth without width
            (the left column) is catastrophic — depth 8, width 4 collapses to 0.654. Adding width without
            depth (the top row) hits a plateau around width 16. The best cell (depth 2, width 32) uses
            1,185 parameters; the worst deep cell uses 29,377 for less.</>}
        >
          <DepthVsWidthLab />
        </LabFrame>

        <h2>Reading the heatmap</h2>
        <p>
          Three regions are visible immediately, and each one teaches a different lesson.
        </p>
        <p>
          <strong>The cold column on the left: width 4.</strong> Regardless of depth, width 4 never exceeds
          about 0.90 on test — and at depth 8 it collapses to 0.654. This is the information bottleneck made
          graphic: four units cannot represent enough directions for the data to pass through, and no amount
          of depth can compensate. Each layer is a rank-4 projection, and the network is trying to thread the
          data through a series of four-dimensional keyholes.
        </p>
        <p>
          <strong>The warm band across the top: depth 1--2.</strong> At any width of 16 or above, one or two
          hidden layers produce test accuracies in the 0.94--0.96 range. This is the{" "}
          <Link href="/learn/architecture-design/wide-vs-deep" style={link}>wide-shallow advantage</Link>{" "}
          from the previous page, now visible across the full width axis. The shallow networks are not limited
          by depth; they have enough width to represent the decision boundary in a single compositional step.
        </p>
        <p>
          <strong>The fading interior: depth 3+ at moderate width.</strong> As depth increases beyond 2, test
          accuracy declines even as the parameter count grows. A 6-layer network of width 32 has 5,537
          parameters — nearly five times the 1,185 of the best cell — and tests at 0.943. More parameters,
          worse result. The parameters are being spent on depth-induced capacity that the problem cannot use.
        </p>

        <h2>The train-test gap tells a cleaner story</h2>
        <p>
          Switch the lab to gap view and the picture sharpens. The shallow-wide cells show a gap near zero or
          even slightly negative (test better than train, a sign of benign underfitting). The deep cells show
          an expanding positive gap — train accuracy climbs while test accuracy stalls or drops. That wedge
          between the two lines is memorisation.
        </p>
        <p>
          The gap is most useful as a <em>diagnostic</em>. When you are tuning a network and the gap is
          growing, the next move is not to add more capacity — it is to reduce depth, add regularisation, or
          increase the dataset. When the gap is near zero and the model is underfitting, <em>then</em> it is
          safe to add capacity, preferably as width first.
        </p>

        <Callout color={CORAL} title={<>The parameter count is not the cost</>}>
          The 8-layer, width-64 cell has 29,377 parameters — the most expensive network in the grid — and
          tests at 0.944, which is worse than the 1-layer, width-32 cell at 1,057 parameters testing at 0.953.
          A 28-fold increase in parameters buys a one-point <em>decrease</em> in test accuracy. The parameter
          count controls capacity, but capacity is not accuracy. Spending more does not help when the problem
          is not capacity-limited.
        </Callout>

        <h2>Where the sweet spot is</h2>
        <p>
          On this problem, the sweet spot is remarkably compact: depth 1--2, width 16--64. Within that region,
          the differences between cells are smaller than the seed-to-seed variance. Outside it, performance
          degrades — sometimes catastrophically (the width-4 column), sometimes insidiously (depth 6+ where
          train accuracy is high but test accuracy is flat).
        </p>
        <p>
          This compactness is itself a finding. It means the search for a good architecture is not a needle in
          a haystack — it is a broad plateau with steep cliffs only in the corners. A reasonable first guess
          (two layers, 32 units each) lands you in the middle of the plateau. The pathological configurations
          are the ones that ignore the basic constraints: too narrow to represent the data, or too deep to
          train and generalise.
        </p>

        <h2>What the grid does not show</h2>
        <p>
          This grid holds the activation function, optimiser, learning rate, batch size, and regularisation
          constant. Change any of those and the heatmap shifts. Add batch normalisation and the deep cells
          improve. Add dropout and the train-test gap narrows. Use a learning-rate scheduler and the shallow
          cells might improve further. The grid shows the <em>architectural</em> contribution in isolation,
          which is exactly what you need to reason about architecture — but it is not the final answer for
          any production model.
        </p>
        <p>
          The next page zooms in on one of the decisions visible in the grid: when you have settled on a
          depth, how should you schedule the width across layers?
        </p>

        <Proof color={CORAL} title="why parameter count is a poor proxy for generalisation">
          <p>
            The grid makes visible what learning theory only states abstractly: generalisation error depends
            on the <em>effective</em> complexity of the model, not its nominal complexity. A 29,377-parameter
            deep network that can only use a fraction of its parameters (because the narrow early layers
            bottleneck information) has high nominal complexity but low effective capacity. A 1,185-parameter
            shallow network that uses all its parameters efficiently has lower nominal complexity but higher
            effective capacity for this problem.
          </p>
          <p>
            The formal concept behind this is the <em>effective degrees of freedom</em> — roughly, how many
            independent directions in weight space actually change the model&rsquo;s predictions. In an
            over-parameterised deep network, many weight directions are redundant (the same function can be
            represented by permuting units, or by scaling up one layer and scaling down the next). Those
            redundant directions inflate the parameter count without inflating the model&rsquo;s ability to
            fit new patterns.
          </p>
        </Proof>

        <Quiz
          accent={CORAL}
          title="Checkpoint"
          questions={[
            {
              q: <>The 8-layer, width-64 cell has 29,377 parameters and tests at 0.944. The 1-layer, width-32
                cell has 1,057 parameters and tests at 0.953. What does this demonstrate?</>,
              options: [
                "The smaller network is better optimised and would lose with a different learning rate",
                "Parameter count is a poor proxy for test accuracy — more capacity does not help when the problem is not capacity-limited",
                "Deep networks are always worse than shallow ones",
              ],
              answer: 1,
              explain: <>The deep network has 28 times more parameters but one point less test accuracy.
                The extra parameters go into depth-induced capacity that this problem cannot exploit,
                demonstrating that spending more does not help when the limitation is not capacity.</>,
            },
            {
              q: <>Why does the width-4 column perform poorly at every depth?</>,
              options: [
                "Four units is below the minimum required by the activation function",
                "Each layer is a rank-4 projection, so only four linearly independent directions survive — not enough to represent the decision boundary",
                "The learning rate is too high for such narrow layers",
              ],
              answer: 1,
              explain: <>The weight matrix at each layer has rank at most 4, creating an information
                bottleneck that no amount of depth can relieve. The data must pass through a
                four-dimensional keyhole at every layer.</>,
            },
            {
              q: <>In the gap view, what does an expanding positive gap (train rising, test flat)
                tell you about your next move?</>,
              options: [
                "Add more layers to increase the model's representational power",
                "Increase the learning rate to escape the local minimum",
                "Reduce depth, add regularisation, or increase data — the model is memorising, not learning transferable structure",
              ],
              answer: 2,
              explain: <>A growing train-test gap is the signature of memorisation. Adding more capacity
                (depth or width) would make it worse. The remedies are all forms of constraint: less
                depth, explicit regularisation, or more data to dilute the noise the model is fitting.</>,
            },
          ]}
        />

        <PrevNext
          prev={{ href: "/learn/architecture-design/wide-vs-deep", label: <>&larr; Wide-shallow vs deep-narrow</> }}
          next={{ href: "/learn/architecture-design/width-schedules", label: <>Next up &middot; Funnel, constant, or inverted? &rarr;</> }}
        />
      </div>
    </article>
  );
}
