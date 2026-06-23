import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Assign & update (Lloyd's algorithm) — Manifold",
  description:
    "k-Means is two steps in a loop: assign every point to its nearest centroid, then move every centroid to the mean of its points. Repeat until nothing moves.",
};

const codeScratch = `import numpy as np

rng = np.random.default_rng(7)
# three blobs of points in 2D
X = np.vstack([rng.normal(c, 0.6, (40, 2)) for c in [(0, 0), (4, 4), (8, 0)]])

k = 3
centroids = X[rng.choice(len(X), k, replace=False)]   # Forgy init

for step in range(100):
    # 1. ASSIGN: each point to its nearest centroid
    d = ((X[:, None, :] - centroids[None, :, :])**2).sum(axis=2)
    labels = d.argmin(axis=1)

    # 2. UPDATE: each centroid to the mean of its points
    new = np.array([X[labels == j].mean(axis=0) for j in range(k)])

    if np.allclose(new, centroids):    # nothing moved -> converged
        break
    centroids = new

inertia = sum(((X[labels == j] - centroids[j])**2).sum() for j in range(k))
print(f"converged in {step} steps,  inertia {inertia:.1f}")`;

const codeLib = `import numpy as np
from sklearn.cluster import KMeans

rng = np.random.default_rng(7)
X = np.vstack([rng.normal(c, 0.6, (40, 2)) for c in [(0, 0), (4, 4), (8, 0)]])

# n_init=10 runs Lloyd's loop 10 times from different starts, keeps the best
km = KMeans(n_clusters=3, n_init=10, random_state=0).fit(X)

print(f"converged in {km.n_iter_} steps,  inertia {km.inertia_:.1f}")
print("labels of first 5 points:", km.labels_[:5])`;

export default function AssignAndUpdatePage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 7 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Assign &amp; update
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        The whole algorithm is two steps in a loop. It has a name — Lloyd&rsquo;s algorithm — but
        you already watched it run on the first page.
      </p>

      <div className="lesson">
        <h2>Step 1 — Assign</h2>
        <p>
          Hold the centroids fixed. Walk through every point and give it the label of its{" "}
          <strong>nearest centroid</strong>. This carves the plane into regions — one per centroid —
          where every point in a region shares the same nearest centre. (Those regions are a Voronoi
          diagram, if you&rsquo;ve met the term.)
        </p>

        <h2>Step 2 — Update</h2>
        <p>
          Now hold the assignments fixed and move each centroid to the <strong>mean</strong> of the
          points currently assigned to it. As we saw, the mean is the single point that minimises
          squared distance to a group — so this step is the best possible move given the current
          labels.
        </p>

        <h2>Repeat</h2>
        <p>
          Moving the centroids changes which centroid is nearest for some points, so we assign
          again, then update again. Each pass lowers inertia. When a full pass changes nothing — no
          point switches clusters — the algorithm has <strong>converged</strong> and stops.
        </p>

        <h2>The whole thing in code</h2>
        <p>
          From scratch it&rsquo;s a dozen lines of NumPy: the assign step is one
          <code> argmin</code>, the update step is one <code>mean</code>. scikit-learn wraps the same
          loop (plus smart initialisation and multiple restarts) behind <code>KMeans</code>.
        </p>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <p>
          That&rsquo;s the engine. What&rsquo;s left is everything around it: proving it always
          stops, choosing a good starting <em>k</em>, surviving bad initial guesses, and knowing the
          shapes where it quietly breaks. Those are the next chapters.
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/the-k-means-idea" style={navLink}>← The k-means idea</Link>
          <Link href="/learn/k-means" style={navLink}>Back to overview →</Link>
        </div>
      </div>
    </article>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
