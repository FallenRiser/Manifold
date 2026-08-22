import Link from "next/link";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Feature importance & reading a tree — Manifold",
  description:
    "A tree is a flowchart you can read, and it ranks its features for free. How impurity-based (Gini) importance works, the bias that inflates high-cardinality features, and permutation importance as the fairer alternative.",
};

const TREES = "var(--c-trees)";

// Small, real iris tree drawn as a flowchart — the actual splits sklearn learns
// on iris (petal length ~2.45, petal width ~1.75). Static SVG, rounded coords.
function Node({ x, y, label, kind }: { x: number; y: number; label: string; kind: "split" | "leaf" }) {
  const w = kind === "split" ? 148 : 96;
  const h = 30;
  return (
    <g>
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx={kind === "split" ? 8 : 15}
        fill={kind === "leaf" ? "color-mix(in srgb, var(--c-trees) 12%, var(--surface))" : "var(--surface)"}
        stroke={kind === "leaf" ? "var(--c-trees)" : "var(--border-strong)"}
        strokeWidth={1}
      />
      <text x={x} y={y + 3.5} fontSize={11} textAnchor="middle" fill={kind === "leaf" ? "var(--c-trees)" : "var(--ink)"} style={{ fontFamily: kind === "split" ? "var(--font-geist-mono)" : "inherit" }}>
        {label}
      </text>
    </g>
  );
}

export default function FeatureImportancePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Trees & ensembles", color: TREES }, { label: "Tier 2 · practitioner", color: "var(--c-fundamentals)" }]}
        time="about 7 minutes"
        title={<>Feature importance &amp; reading a tree</>}
        intro={<>
          A tree&rsquo;s best-loved property is that you can <em>read</em> it. The trained model is a flowchart
          of plain if-then rules, and along the way it hands you a ranking of which features mattered most —
          for free. Both are more subtle than they first look.
        </>}
      />

      <div className="lesson">
        <h2>A tree is a set of rules you can print</h2>
        <p>
          Here is a real (tiny) tree trained to classify irises. Every path from the root to a leaf is a
          human-readable rule — <em>if petal length ≤ 2.45 cm, it&rsquo;s setosa</em> — and there are only as
          many rules as leaves. No other flexible model gives you this.
        </p>

        <figure style={{ margin: "1.4rem 0" }}>
          <div style={{ background: "var(--canvas)", border: "1px solid var(--border-strong)", borderRadius: 14, padding: "16px 12px" }}>
            <svg viewBox="0 0 460 250" width="100%" style={{ maxWidth: 480, display: "block", margin: "0 auto" }} role="img" aria-label="A small decision tree for iris classification drawn as a flowchart">
              {/* edges */}
              <line x1={230} y1={45} x2={120} y2={110} stroke="var(--border-strong)" strokeWidth={1} />
              <line x1={230} y1={45} x2={300} y2={110} stroke="var(--border-strong)" strokeWidth={1} />
              <line x1={300} y1={125} x2={230} y2={195} stroke="var(--border-strong)" strokeWidth={1} />
              <line x1={300} y1={125} x2={380} y2={195} stroke="var(--border-strong)" strokeWidth={1} />
              {/* yes/no labels */}
              <text x={165} y={80} fontSize={10} fill="var(--good)" textAnchor="middle">yes</text>
              <text x={278} y={80} fontSize={10} fill="var(--muted)" textAnchor="middle">no</text>
              <text x={255} y={165} fontSize={10} fill="var(--good)" textAnchor="middle">yes</text>
              <text x={352} y={165} fontSize={10} fill="var(--muted)" textAnchor="middle">no</text>
              {/* nodes */}
              <Node x={230} y={30} label="petal len ≤ 2.45?" kind="split" />
              <Node x={120} y={110} label="setosa" kind="leaf" />
              <Node x={300} y={110} label="petal wid ≤ 1.75?" kind="split" />
              <Node x={230} y={210} label="versicolor" kind="leaf" />
              <Node x={380} y={210} label="virginica" kind="leaf" />
            </svg>
          </div>
        </figure>

        <p>
          Two features and two questions classify irises almost perfectly. That transparency is why trees are a
          favourite for exploratory analysis and for any setting where a decision has to be <em>explained</em>
          — a loan denial, a medical triage — not just made.
        </p>

        <h2>Impurity-based importance (MDI)</h2>
        <p>
          The tree also tells you which features carried the weight. The built-in measure — <strong>mean
          decrease in impurity</strong> (MDI), sometimes called Gini importance — adds up, for each feature,
          the impurity reductions of every split that used it, weighted by how many samples passed through:
        </p>
        <MathBlock>{String.raw`\text{importance}(j) = \sum_{\text{nodes } t \text{ split on } j} \frac{n_t}{n}\,\Delta I(t)`}</MathBlock>
        <p>
          then normalised to sum to one. A feature used high in the tree, on many samples, with big impurity
          drops, scores highly. It costs nothing — the numbers were computed during training.
        </p>

        <Callout color={TREES} title={<>MDI has a bias you must know about</>}>
          Impurity-based importance <strong>systematically favours high-cardinality features</strong> —
          continuous variables and categoricals with many levels. They offer more candidate thresholds, so by
          chance alone they win more splits and accrue more &ldquo;importance,&rdquo; even a random ID column.
          MDI is also computed on the training set, so it rewards features the tree overfit to. Never rank
          features by MDI alone when cardinalities differ.
        </Callout>

        <h2>Permutation importance: the fairer measure</h2>
        <p>
          The trustworthy alternative is <strong>permutation importance</strong>: take a fitted model, shuffle
          one feature&rsquo;s column on held-out data, and measure how much the score drops. If scrambling a
          feature barely hurts, the model wasn&rsquo;t really relying on it. It&rsquo;s model-agnostic,
          measured on validation data, and immune to the cardinality bias — at the cost of a re-scoring pass
          per feature.
        </p>

        <CodeBlock
          fromScratch={`import numpy as np
from sklearn.inspection import permutation_importance

tree.fit(X_train, y_train)

# built-in, fast, but biased toward high-cardinality features
mdi = tree.feature_importances_

# permutation importance on HELD-OUT data — the number to trust
perm = permutation_importance(tree, X_test, y_test, n_repeats=20, random_state=0)
for j in np.argsort(perm.importances_mean)[::-1]:
    print(f"{feature_names[j]:20s} {perm.importances_mean[j]:.3f}")`}
        />

        <Callout color={TREES} title={<>Importance is not causation</>}>
          A high score means the model <em>used</em> the feature, not that the feature <em>drives</em> the
          outcome. Correlated features share and split importance unpredictably; dropping the &ldquo;most
          important&rdquo; feature sometimes barely moves accuracy because a correlated twin covers for it. Read
          importances as a description of this model, not of the world.
        </Callout>

        <PrevNext
          prev={{ href: "/learn/decision-trees/bias-and-variance-of-trees", label: <>← The bias–variance profile</> }}
          next={{ href: "/learn/decision-trees/probabilities-and-calibration", label: <>Next up · Probabilities & calibration →</> }}
        />
      </div>
    </article>
  );
}
