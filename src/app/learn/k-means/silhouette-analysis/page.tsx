import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { SilhouetteLab } from "@/components/labs/SilhouetteLab";

export const metadata = {
  title: "Silhouette analysis — Manifold",
  description:
    "The silhouette score asks, for every point, whether it sits closer to its own cluster than to the nearest other one. It judges cluster quality directly — and picks k without an elbow.",
};

export default function SilhouettePage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 7 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Silhouette analysis
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        The elbow reads one global number off a curve. Silhouette analysis goes finer — it scores{" "}
        <em>every single point</em> on how well it belongs, then lets you judge both the clustering and
        the choice of <em>k</em>.
      </p>

      <div className="lesson">
        <h2>One score per point</h2>
        <p>
          For a point <M>{String.raw`i`}</M>, define two averages:
        </p>
        <ul style={ul}>
          <li><M>{String.raw`a(i)`}</M> — its mean distance to the <em>other</em> points in its <strong>own</strong> cluster (how tight its home is).</li>
          <li><M>{String.raw`b(i)`}</M> — its mean distance to the points in the <strong>nearest other</strong> cluster (how far the nearest neighbour-group is).</li>
        </ul>
        <p>The silhouette combines them:</p>
        <MathBlock>{String.raw`s(i) = \frac{b(i) - a(i)}{\max\{a(i),\, b(i)\}}`}</MathBlock>
        <p>
          Read it directly: <M>{String.raw`s \approx 1`}</M> means the point is far snugger in its own
          cluster than any other (great); <M>{String.raw`s \approx 0`}</M> means it sits on the boundary
          between two; <M>{String.raw`s < 0`}</M> means it&rsquo;s actually closer to a <em>different</em>
          cluster — it&rsquo;s probably misassigned. The score is bounded in <M>{String.raw`[-1, 1]`}</M>, so it&rsquo;s
          comparable across datasets, unlike raw inertia.
        </p>

        <h2>From points to a verdict on k</h2>
        <p>
          Average <M>{String.raw`s(i)`}</M> over all points and you get the <strong>mean silhouette
          score</strong> for that clustering. Sweep <em>k</em>, compute the mean each time, and pick the{" "}
          <em>k</em> that <strong>maximises</strong> it. Unlike the elbow there&rsquo;s no &ldquo;bend&rdquo; to
          eyeball — it&rsquo;s a clean argmax.
        </p>

        <h2>The silhouette plot</h2>
        <p>
          Better still, don&rsquo;t collapse to one number — draw every point&rsquo;s score as a bar, grouped by
          cluster and sorted. The shape is diagnostic: fat, even blocks all above the mean signal a
          healthy <em>k</em>; a cluster with short or negative bars is being forced. Try each <em>k</em>
          and watch the plot fall apart away from the best value.
        </p>
        <SilhouetteLab />

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-clustering)", marginBottom: 4 }}>
            Silhouette vs. elbow
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Silhouette gives a sharper, less subjective answer and a per-cluster diagnostic the elbow
            can&rsquo;t. The cost: it needs pairwise distances within and between clusters, so the exact
            score is <M>{String.raw`O(n^2)`}</M> — pricey on huge datasets (sample, or use a cheaper index
            like Calinski–Harabasz). And like every distance-based measure it still assumes roughly
            convex, comparable clusters.
          </p>
        </div>

        <h2>Compute it both ways</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/the-elbow-method" style={navLink}>← The elbow method</Link>
          <Link href="/learn/k-means/the-gap-statistic" style={{ ...navLink, fontWeight: 600 }}>Next up · The gap statistic →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def silhouette(X, labels):
    n = len(X); D = np.sqrt(((X[:, None] - X[None, :])**2).sum(2))  # pairwise
    s = np.zeros(n)
    for i in range(n):
        own = labels == labels[i]
        a = D[i, own & (np.arange(n) != i)].mean()         # cohesion
        b = min(D[i, labels == c].mean()                    # separation
                for c in set(labels) if c != labels[i])
        s[i] = (b - a) / max(a, b)
    return s

# pick k by maximising the mean silhouette
for k in range(2, 7):
    lab = fit_kmeans(X, k)               # your k-means
    print(k, silhouette(X, lab).mean())`;

const codeLib = `from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score, silhouette_samples

for k in range(2, 7):
    lab = KMeans(n_clusters=k, n_init=10, random_state=0).fit_predict(X)
    print(k, silhouette_score(X, lab))   # mean over all points

# per-point scores drive the silhouette plot
best = KMeans(n_clusters=4, n_init=10, random_state=0).fit_predict(X)
per_point = silhouette_samples(X, best)`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-clustering) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-clustering) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
