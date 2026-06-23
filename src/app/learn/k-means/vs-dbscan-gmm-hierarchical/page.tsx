import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "k-means vs DBSCAN, GMM, hierarchical — Manifold",
  description:
    "When k-means' assumptions don't hold, three alternatives cover most of the gap. Here's how each one thinks, what it fixes, what it costs, and how to choose.",
};

type Row = { method: string; idea: string; shapes: string; needsK: string; noise: string; cost: string };
const ROWS: Row[] = [
  { method: "k-means", idea: "Nearest centroid, minimise squared distance", shapes: "Round, equal", needsK: "Yes (fixed)", noise: "No", cost: "O(nkd) — fast" },
  { method: "GMM", idea: "Soft assignment to Gaussians (EM)", shapes: "Ellipses, unequal", needsK: "Yes (fixed)", noise: "Soft", cost: "O(nkd²) — moderate" },
  { method: "DBSCAN", idea: "Grow clusters through dense neighbourhoods", shapes: "Any shape", needsK: "No (finds it)", noise: "Yes (explicit)", cost: "O(n log n) w/ index" },
  { method: "Hierarchical", idea: "Merge/split by linkage into a dendrogram", shapes: "Linkage-dependent", needsK: "No (cut tree)", noise: "No", cost: "O(n²)–O(n³)" },
];

export default function ComparisonPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 8 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        k-means vs DBSCAN, GMM, hierarchical
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        k-Means is one option in a toolkit. Three alternatives cover most of what it can&rsquo;t — each makes a
        different assumption, so &ldquo;which is best&rdquo; is really &ldquo;which assumption matches your data.&rdquo;
      </p>

      <div className="lesson">
        <h2>GMM — soft, elliptical k-means</h2>
        <p>
          A Gaussian mixture models the data as a blend of Gaussians and fits them with EM. Two upgrades
          over k-means: assignments are <strong>soft</strong> (each point has a probability of belonging to
          each cluster), and each cluster has its own <strong>covariance</strong>, so it can be stretched
          and tilted, and its own <strong>weight</strong>, so clusters can differ in size. It fixes the
          unequal-size and elliptical-shape failures directly. Cost: more parameters, slower, and you still
          choose the number of components.
        </p>

        <h2>DBSCAN — density, any shape, with noise</h2>
        <p>
          DBSCAN grows clusters by linking points that have enough neighbours within radius{" "}
          <code>eps</code>. It needs <strong>no k</strong> — it discovers the number of clusters — handles{" "}
          <strong>arbitrary shapes</strong> (rings, moons, blobs), and uniquely labels sparse points as{" "}
          <strong>noise</strong> instead of forcing them into a cluster. The trade: it&rsquo;s sensitive to{" "}
          <code>eps</code> and <code>min_samples</code>, and struggles when clusters have very different
          densities (one <code>eps</code> can&rsquo;t fit all). HDBSCAN eases the density-variation problem.
        </p>

        <h2>Hierarchical — a whole tree of clusterings</h2>
        <p>
          Agglomerative clustering repeatedly merges the closest clusters, producing a{" "}
          <strong>dendrogram</strong> — a tree you can cut at any height to get any number of clusters,
          decided <em>after</em> fitting. It needs no k up front and reveals nested structure, which is
          ideal when the data is genuinely hierarchical (taxonomies, phylogenies). The linkage choice
          (single, complete, average, Ward) controls cluster shape. The cost is steep: it builds on
          pairwise distances, so it&rsquo;s <code>O(n²)</code> memory and up to <code>O(n³)</code> time —
          impractical for very large <em>n</em>, exactly where k-means thrives.
        </p>

        <div style={{ overflowX: "auto", margin: "1.4rem 0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>{["Method", "Core idea", "Cluster shapes", "Needs k?", "Noise?", "Cost"].map((h) => <th key={h} style={th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.method}>
                  <td style={{ ...td, fontWeight: 600, color: r.method === "k-means" ? "var(--c-clustering)" : "var(--ink)" }}>{r.method}</td>
                  <td style={td}>{r.idea}</td>
                  <td style={td}>{r.shapes}</td>
                  <td style={td}>{r.needsK}</td>
                  <td style={td}>{r.noise}</td>
                  <td style={td}>{r.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-clustering)", marginBottom: 4 }}>
            How to choose
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Round, well-separated blobs and a known k, at scale → <strong>k-means</strong>. Elliptical or
            unequal clusters, or you want soft membership → <strong>GMM</strong>. Arbitrary shapes, unknown
            cluster count, real noise → <strong>DBSCAN</strong>. Nested structure or a small dataset where
            you want to see the whole merge tree → <strong>hierarchical</strong>. And often the honest
            answer is to run two or three and compare — they encode different definitions of &ldquo;cluster,&rdquo;
            so disagreement is itself informative.
          </p>
        </div>

        <h2>The same data, four methods</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/the-failure-mode-gallery" style={navLink}>← The failure-mode gallery</Link>
          <Link href="/learn/k-means/k-medoids" style={{ ...navLink, fontWeight: 600 }}>Next up · k-medoids (PAM) →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `# These methods differ in their CORE LOOP, not just parameters:
#   k-means     : assign to nearest centroid;        recompute MEAN
#   GMM (EM)    : soft responsibilities (E-step);    recompute mean+COVARIANCE+weight (M-step)
#   DBSCAN      : flood-fill through dense points;    no centroids at all
#   hierarchical: merge two closest clusters;         repeat, building a tree
# Choosing a method = choosing which of these definitions of "cluster" you want.`;

const codeLib = `from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering
from sklearn.mixture import GaussianMixture
from sklearn.datasets import make_moons

X, _ = make_moons(n_samples=400, noise=0.06, random_state=0)

km  = KMeans(n_clusters=2, n_init=10, random_state=0).fit_predict(X)   # straight cut — fails
gmm = GaussianMixture(n_components=2, random_state=0).fit_predict(X)   # still struggles on moons
db  = DBSCAN(eps=0.2, min_samples=5).fit_predict(X)                    # follows the moons; -1 = noise
agg = AgglomerativeClustering(n_clusters=2, linkage="single").fit_predict(X)  # single-link tracks shape`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-clustering) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-clustering) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
const th: React.CSSProperties = { textAlign: "left", padding: "8px 9px", borderBottom: "2px solid var(--border-strong)", color: "var(--muted)", fontWeight: 500, fontSize: 11.5, verticalAlign: "bottom" };
const td: React.CSSProperties = { padding: "8px 9px", borderBottom: "1px solid var(--border)", color: "var(--muted)", lineHeight: 1.45, verticalAlign: "top" };
