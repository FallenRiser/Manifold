import Link from "next/link";

export const metadata = {
  title: "The failure-mode gallery — Manifold",
  description:
    "A single reference card for every way k-means goes wrong, what causes each, the symptom to watch for, and the fix — so you can diagnose a bad clustering at a glance.",
};

type Row = { mode: string; cause: string; symptom: string; fix: string };
const ROWS: Row[] = [
  {
    mode: "Non-spherical shapes",
    cause: "Only straight (Voronoi) boundaries; assumes round clusters",
    symptom: "Rings/moons cut across; obvious structure split wrongly",
    fix: "DBSCAN, spectral clustering, GMM",
  },
  {
    mode: "Unequal sizes/densities",
    cause: "Inertia prefers equal-variance, equal-population blobs",
    symptom: "Big cluster split; small cluster steals the big one's edge",
    fix: "Gaussian mixture (per-cluster size & covariance)",
  },
  {
    mode: "Wrong k",
    cause: "k is a fixed input; nothing infers it",
    symptom: "Real clusters merged or arbitrarily split",
    fix: "Elbow, silhouette, gap statistic, BIC",
  },
  {
    mode: "Bad initialization",
    cause: "Converges to a local minimum that depends on the seed",
    symptom: "Different runs give different, sometimes poor, clusterings",
    fix: "k-means++, more n_init restarts",
  },
  {
    mode: "Unscaled features",
    cause: "Euclidean distance is dominated by the largest-range feature",
    symptom: "Clustering tracks one feature; others ignored",
    fix: "StandardScaler / RobustScaler before fitting",
  },
  {
    mode: "Outliers",
    cause: "Squared distance + non-robust mean update",
    symptom: "Centroid dragged off-cluster; a center wasted on noise",
    fix: "Remove outliers, robust scaling, k-medoids/medians",
  },
  {
    mode: "High dimensions",
    cause: "Distances concentrate; noise features swamp the signal",
    symptom: "Everything nearly equidistant; weak, unstable clusters",
    fix: "PCA/UMAP first, then cluster",
  },
  {
    mode: "Categorical data",
    cause: "No meaningful mean or Euclidean distance for categories",
    symptom: "One-hot warps distances; fractional 'centroids'",
    fix: "k-modes / k-prototypes, Gower + k-medoids",
  },
  {
    mode: "No clusters at all",
    cause: "k-means always returns k groups, even on uniform noise",
    symptom: "Confident clusters in data that has no structure",
    fix: "Gap statistic (can say k = 1); test the null first",
  },
];

export default function GalleryPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={chip("var(--c-metrics)")}>Reference</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 5 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        The failure-mode gallery
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Every weakness we&rsquo;ve met, on one page. When a clustering looks wrong, scan the symptom column,
        find the likely cause, and jump to the fix. This is the diagnostic checklist to keep beside you.
      </p>

      <div className="lesson">
        <p>
          Most k-means failures trace back to one of two roots: a <strong>geometry mismatch</strong> (the
          clusters aren&rsquo;t round, equal, or line-separable) or a <strong>preprocessing miss</strong>
          (scaling, outliers, dimensionality, data type). The table separates the symptom you&rsquo;ll actually
          notice from the underlying cause — because the same bad-looking result can come from several
          places.
        </p>

        <div style={{ overflowX: "auto", margin: "1.4rem 0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr>
                {["Failure mode", "Root cause", "Symptom you see", "Fix"].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.mode}>
                  <td style={{ ...td, fontWeight: 600, color: "var(--ink)" }}>{r.mode}</td>
                  <td style={td}>{r.cause}</td>
                  <td style={td}>{r.symptom}</td>
                  <td style={{ ...td, color: "var(--c-clustering)" }}>{r.fix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-clustering)", marginBottom: 4 }}>
            The one-question triage
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Before blaming k-means, ask: <em>did I scale the features, and are my clusters plausibly round
            and comparable in size?</em> If scaling is missing, fix that first — it&rsquo;s the most common and
            most invisible failure. If the geometry is genuinely non-spherical or wildly unequal, no amount
            of tuning will save k-means; reach for a method whose assumptions match your data. That choice
            is the next page.
          </p>
        </div>

        <p>
          None of this makes k-means a bad algorithm — it makes it a <em>specific</em> one. Knowing its
          failure modes is exactly what lets you use it confidently where it shines and reach past it where
          it can&rsquo;t.
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/unequal-sizes-and-densities" style={navLink}>← Unequal sizes &amp; densities</Link>
          <Link href="/learn/k-means/vs-dbscan-gmm-hierarchical" style={{ ...navLink, fontWeight: 600 }}>Next up · k-means vs DBSCAN, GMM, hierarchical →</Link>
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
const th: React.CSSProperties = { textAlign: "left", padding: "8px 10px", borderBottom: "2px solid var(--border-strong)", color: "var(--muted)", fontWeight: 500, fontSize: 12, verticalAlign: "bottom" };
const td: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid var(--border)", color: "var(--muted)", lineHeight: 1.45, verticalAlign: "top" };
