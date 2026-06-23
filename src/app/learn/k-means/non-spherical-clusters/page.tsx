import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { KMeansFailureLab } from "@/components/labs/KMeansFailureLab";

export const metadata = {
  title: "Non-spherical clusters — Manifold",
  description:
    "k-Means can only draw straight boundaries and assumes round clusters. On rings, crescents, and elongated shapes it fails — not from a bug, but by definition.",
};

export default function NonSphericalPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Non-spherical clusters
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Every assumption k-means makes is now going to bite. The first and most visual: it assumes
        clusters are round and separable by straight lines. When they aren&rsquo;t, it fails — and not because
        you tuned it wrong.
      </p>

      <div className="lesson">
        <h2>The built-in shape bias</h2>
        <p>
          Recall two facts from earlier. k-Means partitions space into <strong>Voronoi cells</strong>
          whose borders are straight perpendicular bisectors, and it minimises <strong>squared Euclidean
          distance</strong> to a centroid. Together these bake in an assumption: clusters are roughly
          <em>spherical</em> (isotropic), similar in size, and separable by flat boundaries. That&rsquo;s the
          only kind of cluster k-means can represent — everything else is forced into that mould.
        </p>

        <h2>Watch it fail</h2>
        <p>
          Each dataset below has obvious structure a human sees instantly — but none of it is round or
          line-separable. The fill colour is what k-means decided; the outlined points are the true second
          group. Flip between shapes and watch the recovery score collapse.
        </p>
        <KMeansFailureLab />

        <h2>Why each one breaks</h2>
        <ul style={ul}>
          <li>
            <strong>Concentric rings.</strong> Inner and outer ring share a centroid — literally the same
            mean. No straight line can separate &ldquo;inside&rdquo; from &ldquo;outside,&rdquo; so k-means slices the
            doughnut into pie wedges.
          </li>
          <li>
            <strong>Interlocking moons.</strong> Separating two crescents needs a <em>curved</em> boundary.
            k-means only has straight ones, so it cuts across both moons.
          </li>
          <li>
            <strong>Elongated / sheared blobs.</strong> Each group is a long diagonal streak. k-means
            prefers compact round cells, so it carves <em>across</em> the streaks rather than along them.
          </li>
        </ul>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-clustering)", marginBottom: 4 }}>
            What actually works here
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            These shapes call for a different notion of &ldquo;cluster.&rdquo; <strong>DBSCAN</strong> groups by
            density and follows arbitrary shapes (great for rings and moons). <strong>Spectral
            clustering</strong> reshapes the data via a similarity graph so the groups become
            line-separable, then runs k-means there. <strong>Gaussian mixtures</strong> allow stretched,
            tilted ellipses. The full comparison is two pages ahead — the point here is that the failure is
            structural, not a tuning problem.
          </p>
        </div>

        <h2>Reproduce the failure</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/clustering-after-dimensionality-reduction" style={navLink}>← Clustering after dimensionality reduction</Link>
          <Link href="/learn/k-means/unequal-sizes-and-densities" style={{ ...navLink, fontWeight: 600 }}>Next up · Unequal sizes &amp; densities →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

# concentric rings: same center, no straight line separates them
rng = np.random.default_rng(0)
def ring(r, n):
    a = rng.uniform(0, 2*np.pi, n)
    return np.c_[r*np.cos(a), r*np.sin(a)] + rng.normal(0, 0.4, (n, 2))
X = np.vstack([ring(1.0, 200), ring(3.0, 200)])

labels = fit_kmeans(X, k=2)        # your k-means -> slices the rings into wedges
# the two true rings share a centroid, so inertia can't tell them apart.`;

const codeLib = `from sklearn.datasets import make_moons, make_circles
from sklearn.cluster import KMeans, DBSCAN, SpectralClustering

X, y = make_moons(n_samples=400, noise=0.06, random_state=0)

km = KMeans(n_clusters=2, n_init=10, random_state=0).fit_predict(X)   # fails: straight cut
db = DBSCAN(eps=0.2, min_samples=5).fit_predict(X)                    # follows the moons
sp = SpectralClustering(n_clusters=2, affinity="nearest_neighbors",
                        random_state=0).fit_predict(X)                # also works`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-clustering) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-clustering) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
