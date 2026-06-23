import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Unequal sizes & densities — Manifold",
  description:
    "Even with perfectly round clusters, k-means fails when they differ in population or spread. Minimising inertia has a hidden preference for equal-sized, equal-variance blobs.",
};

// two clusters: one large diffuse, one small tight. k-means boundary sits at the
// midpoint, stealing the near edge of the big cluster into the small one.
const W = 320, H = 150;
const sx = (x: number) => Math.round((16 + (x / 100) * (W - 32)) * 100) / 100;
const sy = (y: number) => Math.round((H - 16 - (y / 100) * (H - 32)) * 100) / 100;

export default function UnequalPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 5 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Unequal sizes & densities
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Make the clusters perfectly round and k-means can <em>still</em> get them wrong — if they differ
        in how many points they hold or how spread out they are. The cause is subtle and lives inside the
        objective itself.
      </p>

      <div className="lesson">
        <h2>Inertia secretly prefers equal blobs</h2>
        <p>
          Minimising total squared distance has an implicit bias: it wants clusters of roughly{" "}
          <strong>equal size and equal variance</strong>. Two mechanisms cause it:
        </p>
        <ul style={ul}>
          <li>
            <strong>Density.</strong> A large, diffuse cluster racks up big squared distances simply
            because its points are far from any center. k-means can lower total inertia by shrinking that
            expensive cluster and letting a neighbouring tight cluster absorb its near edge — even though
            those stolen points clearly belong to the diffuse group.
          </li>
          <li>
            <strong>Size.</strong> A populous cluster contributes many distance terms. k-means is tempted
            to split it (cheap inertia reduction across many points) and merge smaller clusters, so a big
            true cluster gets cut in two while a small one is swallowed.
          </li>
        </ul>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, margin: "1.2rem 0" }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
            <rect x={0} y={0} width={W} height={H} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            {/* large diffuse cluster on the left (true group A) */}
            {DIFFUSE.map((p, i) => <circle key={"a" + i} cx={sx(p.x)} cy={sy(p.y)} r={3} fill="var(--c-clustering)" fillOpacity={0.55} />)}
            {/* small tight cluster on the right (true group B) */}
            {TIGHT.map((p, i) => <circle key={"b" + i} cx={sx(p.x)} cy={sy(p.y)} r={3} fill="var(--good)" fillOpacity={0.8} />)}
            {/* k-means boundary sits near the midpoint, biting into the diffuse cluster */}
            <line x1={sx(58)} y1={sy(0)} x2={sx(58)} y2={sy(100)} stroke="var(--bad, #d9534f)" strokeWidth={1.6} strokeDasharray="4 3" />
            <text x={sx(58)} y={14} fontSize={9} fill="var(--bad, #d9534f)" textAnchor="middle">k-means cut</text>
          </svg>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
            A big diffuse cluster (blue) and a small tight one (green). k-means puts its boundary near the
            midpoint between centroids — so the right-hand edge of the diffuse cluster gets misassigned to
            the tight one. The tight cluster &ldquo;wins&rdquo; territory it doesn&rsquo;t deserve.
          </div>
        </div>

        <h2>Why the boundary lands wrong</h2>
        <p>
          The decision boundary between two centroids is their perpendicular bisector — the geometric
          midpoint, regardless of how many points or how much spread each side has. A sensible clustering
          would put the boundary closer to the small/tight cluster (it owns less space); k-means can&rsquo;t,
          because it weighs only distance to a center, not the cluster&rsquo;s density or population.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-clustering)", marginBottom: 4 }}>
            The principled fix: Gaussian mixtures
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            A Gaussian mixture model gives each cluster its own <em>covariance</em> (spread) and{" "}
            <em>weight</em> (size), so the boundary shifts toward the smaller, tighter cluster
            automatically. k-Means is the special case of a GMM where every cluster is forced to be the
            same size and a unit sphere — which is exactly the assumption that fails here. That link gets
            its own page in the variants chapter.
          </p>
        </div>

        <h2>See the effect</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/non-spherical-clusters" style={navLink}>← Non-spherical clusters</Link>
          <Link href="/learn/k-means/the-failure-mode-gallery" style={{ ...navLink, fontWeight: 600 }}>Next up · The failure-mode gallery →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

rng = np.random.default_rng(0)
# big diffuse cluster (300 pts, wide) + small tight cluster (40 pts, narrow)
big   = rng.normal([0, 0], 2.5, (300, 2))
small = rng.normal([7, 0], 0.6, (40, 2))
X = np.vstack([big, small])

labels = fit_kmeans(X, k=2)        # boundary at the midpoint steals the big cluster's edge
# inertia is lower for the "wrong" split because it equalizes the two clusters' scatter.`;

const codeLib = `from sklearn.cluster import KMeans
from sklearn.mixture import GaussianMixture

km = KMeans(n_clusters=2, n_init=10, random_state=0).fit_predict(X)   # mis-cuts

# GMM gives each component its own size (weight) and spread (covariance)
gmm = GaussianMixture(n_components=2, covariance_type="full",
                      random_state=0).fit_predict(X)                  # recovers them`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-clustering) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-clustering) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };

// figure data (deterministic, hand-placed)
const DIFFUSE = [
  { x: 12, y: 40 }, { x: 20, y: 65 }, { x: 18, y: 25 }, { x: 28, y: 50 }, { x: 30, y: 78 },
  { x: 34, y: 30 }, { x: 40, y: 60 }, { x: 44, y: 42 }, { x: 48, y: 72 }, { x: 52, y: 28 },
  { x: 54, y: 55 }, { x: 24, y: 48 }, { x: 38, y: 18 }, { x: 46, y: 88 }, { x: 16, y: 52 },
];
const TIGHT = [
  { x: 74, y: 46 }, { x: 78, y: 52 }, { x: 76, y: 49 }, { x: 80, y: 47 }, { x: 75, y: 54 },
  { x: 79, y: 44 }, { x: 77, y: 51 }, { x: 81, y: 50 }, { x: 73, y: 48 }, { x: 78, y: 56 },
];
