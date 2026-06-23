import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Categorical & mixed data — Manifold",
  description:
    "k-Means needs means and Euclidean distance, which categories don't have. One-hot encoding is a trap; k-modes and k-prototypes are the right tools for non-numeric data.",
};

export default function CategoricalPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Categorical & mixed data
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        k-Means assumes two things categories simply don&rsquo;t have: a meaningful mean, and a Euclidean
        distance. Force it anyway and the results quietly lie. Here&rsquo;s why — and what to use instead.
      </p>

      <div className="lesson">
        <h2>Why categories break k-means</h2>
        <p>
          What is the &ldquo;mean&rdquo; of <em>red</em>, <em>blue</em>, and <em>blue</em>? There isn&rsquo;t one — the
          update step is undefined. And what is the distance from <em>red</em> to <em>blue</em>? Nothing
          numeric. Both pillars of the algorithm assume a continuous space, and a colour, a country, or a
          job title doesn&rsquo;t live in one.
        </p>

        <h2>The one-hot trap</h2>
        <p>
          The tempting fix is to one-hot encode — turn a category into 0/1 columns — and run ordinary
          k-means. It <em>runs</em>, but it distorts:
        </p>
        <ul style={ul}>
          <li>
            <strong>Distances get warped.</strong> Two different categories are always exactly{" "}
            <span style={{ whiteSpace: "nowrap" }}>√2</span> apart, regardless of how related they are —
            and a many-category field explodes into many columns that collectively can dominate the
            distance.
          </li>
          <li>
            <strong>Centroids stop meaning anything.</strong> The mean of one-hot columns is a vector of
            fractions like 0.3 — &ldquo;30% red&rdquo; isn&rsquo;t a category. You lose the clean
            &ldquo;centroid = representative member&rdquo; interpretation.
          </li>
        </ul>
        <p>It can work for a few low-cardinality fields, but it&rsquo;s a workaround, not the right model.</p>

        <h2>The right tools</h2>
        <ul style={ul}>
          <li>
            <strong>k-modes</strong> — for all-categorical data. Replace Euclidean distance with a{" "}
            <em>mismatch count</em> (how many attributes differ) and replace the mean with the{" "}
            <strong>mode</strong> (the most frequent category per attribute). Everything else is the
            familiar assign/update loop.
          </li>
          <li>
            <strong>k-prototypes</strong> — for <em>mixed</em> numeric + categorical data. It combines
            squared Euclidean distance on the numeric features with the mismatch count on the categorical
            ones, weighted by a factor <code>γ</code> that balances the two. This is usually what real
            tabular data needs.
          </li>
          <li>
            <strong>Gower distance + a distance-based method.</strong> Gower distance handles mixed types
            per-feature; pair it with k-medoids (which only needs a distance matrix, not means) or
            hierarchical clustering.
          </li>
        </ul>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-clustering)", marginBottom: 4 }}>
            The general lesson
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            k-Means is one instance of a family: <em>assign to nearest center, recompute centers</em>. Swap
            the distance and the center definition and you get a method suited to your data type — k-modes,
            k-medians, k-medoids. Don&rsquo;t bend your data to fit Euclidean k-means; pick the family member
            whose distance already matches your data. That&rsquo;s the whole &ldquo;variants&rdquo; chapter in one
            sentence.
          </p>
        </div>

        <h2>k-prototypes on mixed data</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/outliers-and-robustness" style={navLink}>← Outliers &amp; robustness</Link>
          <Link href="/learn/k-means/clustering-after-dimensionality-reduction" style={{ ...navLink, fontWeight: 600 }}>Next up · Clustering after dimensionality reduction →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

# k-modes core: distance = count of mismatched attributes; center = per-column mode
def mismatch(a, b):
    return np.sum(a != b)                 # categorical "distance"

def mode_center(rows):
    # most frequent value in each categorical column
    return np.array([np.bincount(col).argmax() for col in rows.T])

# the assign/update loop is identical to k-means, only these two pieces change.`;

const codeLib = `# scikit-learn is numeric-only; use the kmodes package for categorical/mixed data.
from kmodes.kprototypes import KPrototypes

# X has numeric and categorical columns; tell it which indices are categorical
kp = KPrototypes(n_clusters=4, init="Huang", random_state=0)
labels = kp.fit_predict(X, categorical=[2, 5, 6])   # columns 2,5,6 are categorical
print(kp.cluster_centroids_)`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-clustering) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-clustering) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
