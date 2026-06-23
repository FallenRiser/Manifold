import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Empty clusters & edge cases — Manifold",
  description:
    "Sometimes a centroid ends up with no points, ties happen, and duplicates pile up. Here's what breaks the clean Lloyd's loop and how real implementations patch each case.",
};

export default function EdgeCasesPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Empty clusters & edge cases
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        The clean two-step loop hides a few awkward situations. None are fatal, but each forces a
        small decision — and knowing them explains some otherwise baffling results.
      </p>

      <div className="lesson">
        <h2>The empty-cluster problem</h2>
        <p>
          Nothing in Lloyd&rsquo;s algorithm guarantees every centroid keeps at least one point. If a
          centroid starts in a sparse spot, the assign step can leave it with{" "}
          <strong>zero members</strong> — and then the update step is undefined: the mean of an empty
          set is <code>0/0</code>. You asked for <em>k</em> clusters and the run threatens to hand back
          fewer.
        </p>
        <p>Real implementations don&rsquo;t crash; they <strong>relocate</strong> the orphan centroid:</p>
        <ul style={ul}>
          <li>
            <strong>Move it to the worst-fit point.</strong> Find the single point contributing the
            most to inertia (farthest from its own centroid) and reseed the empty centroid there.
            This is what scikit-learn does — it directly attacks the largest error.
          </li>
          <li>
            <strong>Split the largest cluster.</strong> Take the most populous cluster and peel off a
            new centroid from it.
          </li>
        </ul>
        <p>
          Either way the cluster count is preserved and inertia still won&rsquo;t increase. Good
          initialisation (k-means++) makes empty clusters rare in the first place.
        </p>

        <h2>Ties in assignment</h2>
        <p>
          A point exactly equidistant from two centroids has to break the tie somehow — implementations
          just pick the lowest index. It almost never matters with real-valued data (exact ties are
          measure-zero), but on integer or heavily quantised data ties are common and can make a run&rsquo;s
          result depend on centroid ordering.
        </p>

        <h2>Duplicate and coincident points</h2>
        <p>
          If you have more identical points than you might expect, or fewer <em>distinct</em> points
          than <em>k</em>, some centroids are forced to coincide or stay empty — you simply cannot have
          more non-empty clusters than there are unique locations. Asking for <em>k</em> = 10 from 6
          distinct points is ill-posed.
        </p>

        <h2>Other practical gotchas</h2>
        <ul style={ul}>
          <li>
            <strong>Outliers drag centroids.</strong> Because the update is a <em>mean</em>, a single far
            point can pull a centroid noticeably off its cluster. (The robust fix — medians — is
            k-medians, a later variant.)
          </li>
          <li>
            <strong>Label switching.</strong> Cluster <em>0</em> in one run may be cluster <em>2</em> in
            the next. The partition is the same; only the arbitrary labels differ. Never compare raw
            label numbers across runs — compare the groupings (that&rsquo;s what ARI/NMI are for).
          </li>
          <li>
            <strong>Non-determinism.</strong> Different seeds give different local minima. Fix{" "}
            <code>random_state</code> for reproducibility.
          </li>
        </ul>

        <h2>Handle an empty cluster from scratch</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/computational-complexity" style={navLink}>← Computational complexity</Link>
          <Link href="/learn/k-means" style={navLink}>Back to overview →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def update(X, labels, k, prev):
    new = prev.copy()
    for j in range(k):
        members = X[labels == j]
        if len(members) == 0:
            # empty cluster: reseed at the point with the largest error
            d = ((X - prev[labels])**2).sum(axis=1)
            new[j] = X[d.argmax()]
        else:
            new[j] = members.mean(axis=0)
    return new`;

const codeLib = `from sklearn.cluster import KMeans
# scikit-learn handles empty clusters internally by relocating the centroid
# to the point farthest from its assigned centroid — you never see the 0/0.
# Set random_state for reproducible label assignments across runs.
km = KMeans(n_clusters=5, n_init=10, random_state=0)`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
