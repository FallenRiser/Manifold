import Link from "next/link";
import { MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "The objective: inertia — Manifold",
  description:
    "k-Means scores a clustering by inertia — the total squared distance from every point to its centroid. It's the number the whole algorithm drives downhill.",
};

// a single cluster: points with spokes to their centroid
const PTS = [
  { x: 30, y: 40 }, { x: 55, y: 30 }, { x: 70, y: 55 },
  { x: 45, y: 65 }, { x: 60, y: 80 }, { x: 38, y: 78 },
];
const cx0 = PTS.reduce((s, p) => s + p.x, 0) / PTS.length;
const cy0 = PTS.reduce((s, p) => s + p.y, 0) / PTS.length;
const inertia = PTS.reduce((s, p) => s + (p.x - cx0) ** 2 + (p.y - cy0) ** 2, 0);
const sx = (x: number) => 30 + (x / 100) * 260;
const sy = (y: number) => 170 - (y / 100) * 140;

const codeScratch = `import numpy as np

rng = np.random.default_rng(7)
X = np.vstack([rng.normal(c, 0.6, (40, 2)) for c in [(0, 0), (4, 4), (8, 0)]])
centroids = np.array([[0, 0], [4, 4], [8, 0]], dtype=float)

# assign each point to its nearest centroid
d = ((X[:, None, :] - centroids[None, :, :])**2).sum(axis=2)
labels = d.argmin(axis=1)

# inertia = total squared distance from each point to its own centroid
inertia = sum(((X[labels == j] - centroids[j])**2).sum() for j in range(len(centroids)))
print(f"inertia: {inertia:.1f}")`;

const codeLib = `import numpy as np
from sklearn.cluster import KMeans

rng = np.random.default_rng(7)
X = np.vstack([rng.normal(c, 0.6, (40, 2)) for c in [(0, 0), (4, 4), (8, 0)]])

km = KMeans(n_clusters=3, n_init=10, random_state=0).fit(X)
print(f"inertia: {km.inertia_:.1f}")   # sklearn stores it on the fitted model`;

export default function ObjectiveInertiaPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 5 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        The objective: inertia
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Every optimisation needs a number to push down. For k-means that number is inertia — and
        once you see it, the whole algorithm is just &ldquo;make this smaller.&rdquo;
      </p>

      <div className="lesson">
        <h2>One number for a whole clustering</h2>
        <p>
          <strong>Inertia</strong> (within-cluster sum of squares) adds up the squared distance from
          every point to the centroid it&rsquo;s assigned to. Tight clusters give short spokes and a
          low inertia; scattered clusters give long spokes and a high one.
        </p>
        <MathBlock>{String.raw`J = \sum_{j=1}^{k} \sum_{\mathbf{x} \in C_j} \lVert \mathbf{x} - \boldsymbol{\mu}_j \rVert^2`}</MathBlock>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, margin: "1.2rem 0" }}>
          <svg viewBox="0 0 320 190" style={{ width: "100%", height: "auto", display: "block" }}>
            <rect x={0} y={0} width={320} height={190} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            {PTS.map((p, i) => (
              <line key={"s" + i} x1={sx(p.x)} y1={sy(p.y)} x2={sx(cx0)} y2={sy(cy0)} stroke="var(--c-clustering)" strokeOpacity={0.4} strokeWidth={1.2} />
            ))}
            {PTS.map((p, i) => (
              <circle key={"p" + i} cx={sx(p.x)} cy={sy(p.y)} r={4} fill="var(--c-clustering)" fillOpacity={0.85} />
            ))}
            <circle cx={sx(cx0)} cy={sy(cy0)} r={6} fill="none" stroke="var(--c-clustering)" strokeWidth={2.4} />
            <path d={`M ${sx(cx0) - 5} ${sy(cy0)} L ${sx(cx0) + 5} ${sy(cy0)} M ${sx(cx0)} ${sy(cy0) - 5} L ${sx(cx0)} ${sy(cy0) + 5}`} stroke="var(--c-clustering)" strokeWidth={2.4} strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
            Inertia is the sum of the squared lengths of these spokes — here, {inertia.toFixed(0)} for
            one cluster of six points. Sum it over all clusters and that&rsquo;s <em>J</em>.
          </div>
        </div>

        <h2>Why squared, and why the mean</h2>
        <p>
          The squares are not arbitrary. The point that minimises the total squared distance to a
          set of points is exactly their <strong>mean</strong>. So once the assignments are fixed,
          the best place for a centroid is provably the average of its members — which is precisely
          the &ldquo;update&rdquo; step. Inertia and the mean are two views of the same fact.
        </p>
        <p>
          Inertia also connects to variance: dividing <em>J</em> by the number of points gives the
          average squared spread within clusters. Minimising inertia is minimising within-cluster
          variance.
        </p>

        <h2>Compute it yourself</h2>
        <p>
          From scratch it&rsquo;s one assignment plus a sum of squares; scikit-learn stores it on the
          fitted model as <code>.inertia_</code>.
        </p>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-clustering)", marginBottom: 4 }}>
            A trap to remember
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Inertia <em>always</em> drops as you add clusters — with <em>k</em> = <em>n</em> it hits
            zero (every point is its own centroid). So you can never pick <em>k</em> by minimising
            inertia alone. That&rsquo;s exactly the problem the &ldquo;choosing k&rdquo; chapter
            solves.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/the-k-means-idea" style={navLink}>← The k-means idea</Link>
          <Link href="/learn/k-means/hard-assignment-and-voronoi" style={{ ...navLink, fontWeight: 600 }}>Next up · Hard assignment &amp; Voronoi cells →</Link>
        </div>
      </div>
    </article>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-clustering) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-clustering) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
