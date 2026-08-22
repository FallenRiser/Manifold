import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M } from "@/components/Math";

export const metadata = {
  title: "Tree structure & the other knobs — Manifold",
  description:
    "In boosting, tree depth is not a capacity dial in the usual sense — it sets the order of feature interactions each tree can capture. Depth 1 is an additive model; depth 2 allows pairwise interactions. That, plus the leaf-count and min-child knobs, shapes what the ensemble can express.",
};

const TREES = "var(--c-trees)";

export default function TreeKnobsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Tree structure &amp; the other knobs</>}
        intro={<>
          After the learning rate, the most consequential choice in gradient boosting is how big each tree is —
          and it means something different here than it did for a single tree. Tree size in boosting controls the{" "}
          <strong> order of feature interactions</strong> the model can represent.
        </>}
      />

      <div className="lesson">
        <h2>Depth = interaction order</h2>
        <p>
          A boosted tree is deliberately shallow, so it&rsquo;s tempting to read depth as &ldquo;how much each
          tree can overfit.&rdquo; The sharper reading is about <em>interactions</em>. A path from root to leaf is
          a conjunction of conditions — &ldquo;<M>{String.raw`\text{income} > 50\text{k}`}</M> AND{" "}
          <M>{String.raw`\text{age} < 30`}</M>.&rdquo; A tree of depth <M>{String.raw`d`}</M> can therefore
          combine at most <M>{String.raw`d`}</M> features on any one decision, so:
        </p>
        <ul style={ul}>
          <li>
            <strong>Depth 1 (stumps)</strong> — each tree uses exactly one feature. The whole ensemble is a sum of
            single-feature functions: a <em>generalised additive model</em> with <strong>no interactions</strong>{" "}
            at all. Surprisingly strong, and maximally interpretable.
          </li>
          <li>
            <strong>Depth 2</strong> — each tree can combine two features, so the model captures{" "}
            <strong>pairwise interactions</strong> (and only those).
          </li>
          <li>
            <strong>Depth <M>{String.raw`d`}</M></strong> — up to <M>{String.raw`d`}</M>-way interactions.
          </li>
        </ul>
        <p>
          This is why the boosting sweet spot is usually <strong>depth 3–8</strong>, not the depth-20 monsters a
          single tree or a random forest grows. You want each tree weak — able to see a few interactions, not to
          solve the problem alone. If your signal is genuinely additive, shallow trees will beat deep ones; if it
          is riddled with high-order interactions (like <Link href="/learn/boosting/case-a-tabular" style={link}>forest
          cover type</Link>), deeper trees pay off, which is exactly why the tuned booster there used depth 8.
        </p>

        <h2>Depthwise vs leaf-wise: two ways to say &ldquo;how big&rdquo;</h2>
        <p>
          There are two conventions for capping tree size, and the modern libraries differ:
        </p>
        <ul style={ul}>
          <li>
            <strong><code>max_depth</code></strong> (XGBoost&rsquo;s default style) grows the tree{" "}
            <em>level by level</em>, so all leaves are at similar depth — a balanced tree with up to{" "}
            <M>{String.raw`2^d`}</M> leaves.
          </li>
          <li>
            <strong><code>num_leaves</code> / <code>max_leaf_nodes</code></strong> (LightGBM&rsquo;s{" "}
            <Link href="/learn/boosting/histogram" style={link}>leaf-wise growth</Link>) caps the total leaves and
            lets the tree grow lopsidedly, splitting wherever the gain is highest. More expressive per leaf but
            easier to overfit — which is why LightGBM couples it with <code>min_child_samples</code>.
          </li>
        </ul>
        <p>
          They&rsquo;re related but not identical: a leaf-wise tree with 31 leaves can be much deeper down one
          branch than a depth-5 depthwise tree, so <code>num_leaves</code> should be set well below{" "}
          <M>{String.raw`2^{\text{max\_depth}}`}</M> to keep trees weak.
        </p>

        <Callout color={TREES} title={<>The &ldquo;don&rsquo;t split unless it&rsquo;s worth it&rdquo; knobs</>}>
          Two regularisers stop a tree from carving out leaves that fit noise:{" "}
          <strong><code>min_child_weight</code></strong> (a minimum total Hessian — roughly, a minimum amount of
          &ldquo;evidence&rdquo; — required in a leaf) and <strong><code>gamma</code> / <code>min_split_gain</code></strong>{" "}
          (a minimum loss reduction a split must deliver to be kept). Raising either makes each tree weaker and the
          ensemble smoother — direct antidotes to overfitting that pair with the learning rate and subsampling.
        </Callout>

        <h2>How the knobs interact</h2>
        <p>
          Boosting&rsquo;s knobs are coupled, and it helps to hold a rough map of the couplings:
        </p>
        <ul style={ul}>
          <li><strong>Deeper trees</strong> → each step is stronger → lower the <Link href="/learn/boosting/shrinkage" style={link}>learning rate</Link> and/or add the min-child regularisers.</li>
          <li><strong>Lower learning rate</strong> → need more trees → lean on <Link href="/learn/boosting/early-stopping" style={link}>early stopping</Link> to pick the count.</li>
          <li><strong>More <Link href="/learn/boosting/stochastic" style={link}>subsampling</Link></strong> → more regularisation → you can afford slightly deeper trees or a higher rate.</li>
        </ul>
        <p>
          Because everything trades against everything, boosting rewards a disciplined tuning order rather than a
          blind grid search — the subject of the <Link href="/learn/boosting/tuning" style={link}>tuning
          page</Link>. But first, the knob that makes all the others safe: knowing when to stop.
        </p>

        <PrevNext
          prev={{ href: "/learn/boosting/stochastic", label: <>← Stochastic gradient boosting</> }}
          next={{ href: "/learn/boosting/early-stopping", label: <>Next up · Early stopping &amp; staged prediction →</> }}
        />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 12px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const link: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
