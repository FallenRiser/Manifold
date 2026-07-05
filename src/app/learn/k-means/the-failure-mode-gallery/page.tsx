import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

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
      <LessonHeader
        chips={[{ label: "Clustering", color: "var(--c-clustering)" }, { label: "Reference", color: "var(--c-metrics)" }]}
        time="about 5 minutes"
        title={<>The failure-mode gallery</>}
        intro={<>
          Every weakness we&rsquo;ve met, on one page. When a clustering looks wrong, scan the symptom column,
        find the likely cause, and jump to the fix. This is the diagnostic checklist to keep beside you.
        </>}
      />

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

        <Callout color="var(--c-clustering)" title={<>The one-question triage</>}>
          Before blaming k-means, ask: <em>did I scale the features, and are my clusters plausibly round
            and comparable in size?</em> If scaling is missing, fix that first — it&rsquo;s the most common and
            most invisible failure. If the geometry is genuinely non-spherical or wildly unequal, no amount
            of tuning will save k-means; reach for a method whose assumptions match your data. That choice
            is the next page.
        </Callout>

        <p>
          None of this makes k-means a bad algorithm — it makes it a <em>specific</em> one. Knowing its
          failure modes is exactly what lets you use it confidently where it shines and reach past it where
          it can&rsquo;t.
        </p>

        <PrevNext prev={{ href: "/learn/k-means/unequal-sizes-and-densities", label: <>← Unequal sizes &amp; densities</> }} next={{ href: "/learn/k-means/vs-dbscan-gmm-hierarchical", label: <>Next up · k-means vs DBSCAN, GMM, hierarchical →</> }} />
      </div>
    </article>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "8px 10px", borderBottom: "2px solid var(--border-strong)", color: "var(--muted)", fontWeight: 500, fontSize: 12, verticalAlign: "bottom" };
const td: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid var(--border)", color: "var(--muted)", lineHeight: 1.45, verticalAlign: "top" };
