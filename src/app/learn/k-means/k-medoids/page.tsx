import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "k-medoids (PAM) — Manifold",
  description:
    "k-medoids uses actual data points as cluster centers and minimises total distance, not squared distance. That makes it robust to outliers and usable with any distance metric — at a higher cost.",
};

export default function KMedoidsPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={chip("var(--c-metrics)")}>Variants</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        k-medoids (PAM)
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Change one thing about k-means — make the center an actual data point instead of a mean — and you
        get an algorithm that shrugs off outliers and works with <em>any</em> distance you can define.
      </p>

      <div className="lesson">
        <h2>Medoid, not mean</h2>
        <p>
          A <strong>medoid</strong> is the most central <em>actual member</em> of a cluster — the point
          whose total distance to all the others is smallest. k-medoids represents each cluster by its
          medoid and minimises the sum of distances from points to their medoid:
        </p>
        <ul style={ul}>
          <li>k-means center = the <em>mean</em> (a synthetic point, possibly where no data is).</li>
          <li>k-medoids center = a <em>medoid</em> (always a real data point).</li>
          <li>k-means minimises squared distance; k-medoids minimises plain (often absolute) distance.</li>
        </ul>

        <h2>Why this matters</h2>
        <ul style={ul}>
          <li>
            <strong>Robust to outliers.</strong> A medoid can&rsquo;t be dragged off into empty space the way a
            mean can — it must stay on a real point. Combined with non-squared distance, extreme values
            have far less pull.
          </li>
          <li>
            <strong>Any distance metric.</strong> k-means needs a mean, which only makes sense in Euclidean
            space. k-medoids needs only a distance <em>matrix</em>, so you can use Manhattan, cosine, edit
            distance, Gower (mixed data) — anything. This is its biggest practical advantage.
          </li>
          <li>
            <strong>Interpretable centers.</strong> The center is a genuine example (a real customer, a
            real document), which is often more useful than an average.
          </li>
        </ul>

        <h2>PAM and its faster cousins</h2>
        <p>
          <strong>PAM</strong> (Partitioning Around Medoids) is the classic algorithm: start with k
          medoids, then repeatedly try swapping a medoid with a non-medoid and keep the swap if it lowers
          total cost. It&rsquo;s thorough but expensive — each iteration considers <code>k·(n−k)</code> swaps,
          each costing <code>O(n)</code>, so it&rsquo;s roughly <code>O(k(n−k)²)</code> per iteration. For large
          data, <strong>CLARA</strong> runs PAM on samples and <strong>CLARANS</strong> / <strong>FasterPAM</strong>
          {" "}cut the cost dramatically.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-clustering)", marginBottom: 4 }}>
            The trade in one line
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            k-medoids buys robustness, metric flexibility, and real-example centers — at a meaningfully
            higher computational cost than k-means. Use it when your distance isn&rsquo;t Euclidean, your data
            has outliers, or you need the center to be an actual record; stick with k-means when it&rsquo;s
            plain numeric data at scale.
          </p>
        </div>

        <h2>From the swap rule to the library</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/vs-dbscan-gmm-hierarchical" style={navLink}>← k-means vs DBSCAN, GMM, hierarchical</Link>
          <Link href="/learn/k-means/k-medians-and-k-modes" style={{ ...navLink, fontWeight: 600 }}>Next up · k-medians &amp; k-modes →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def kmedoids(D, k, iters=100):
    # D is an n x n distance matrix — ANY metric you like
    n = len(D)
    medoids = np.arange(k)                      # start: first k points
    for _ in range(iters):
        labels = D[:, medoids].argmin(1)        # assign to nearest medoid
        improved = False
        for j in range(k):                      # try to improve each medoid
            members = np.where(labels == j)[0]
            costs = D[np.ix_(members, members)].sum(0)   # total intra-cluster distance
            best = members[costs.argmin()]      # most central member
            if best != medoids[j]:
                medoids[j] = best; improved = True
        if not improved:
            break
    return medoids, D[:, medoids].argmin(1)`;

const codeLib = `from sklearn_extra.cluster import KMedoids   # pip install scikit-learn-extra

# metric can be 'euclidean', 'manhattan', 'cosine', or a precomputed matrix
km = KMedoids(n_clusters=4, metric="manhattan", method="pam",
              random_state=0).fit(X)
print(km.medoid_indices_)        # indices of the chosen real data points`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-clustering) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-clustering) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
