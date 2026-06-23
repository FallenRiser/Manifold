import Link from "next/link";
import { MathBlock } from "@/components/Math";

export const metadata = {
  title: "The k-means idea — Manifold",
  description:
    "k-Means represents each cluster by a single point — its centroid — and tries to minimise the total squared distance from every point to its centroid. That objective is inertia.",
};

export default function TheKMeansIdeaPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 5 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        The k-means idea
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        One bold simplification powers the whole algorithm: represent an entire cluster by a single
        point — its centre of mass.
      </p>

      <div className="lesson">
        <h2>A cluster is its centroid</h2>
        <p>
          k-Means summarises each group by one point, the <strong>centroid</strong> — the average
          position of every member. A point belongs to whichever centroid it&rsquo;s nearest. So a
          clustering is fully described by just <em>k</em> centre points; everything else follows
          from &ldquo;nearest wins.&rdquo;
        </p>
        <p>
          That&rsquo;s a strong assumption. It says clusters are blobs that radiate out from a
          centre — roughly round, roughly equal-sized. When that&rsquo;s true (and it often is),
          k-means is fast and excellent. When it isn&rsquo;t, it fails in specific, predictable ways
          we&rsquo;ll catalogue later.
        </p>

        <h2>The objective: inertia</h2>
        <p>
          What makes one set of centroids better than another? k-Means scores a clustering by{" "}
          <strong>inertia</strong> — also called within-cluster sum of squares (WCSS): add up the
          squared distance from every point to its own centroid.
        </p>
        <MathBlock>{String.raw`J = \sum_{j=1}^{k} \sum_{\mathbf{x} \in C_j} \lVert \mathbf{x} - \boldsymbol{\mu}_j \rVert^2`}</MathBlock>
        <p>
          Here <strong>C<sub>j</sub></strong> is the set of points assigned to cluster <em>j</em>,
          and <strong>μ<sub>j</sub></strong> is that cluster&rsquo;s centroid. Lower <em>J</em> means
          tighter clusters. The entire algorithm is just a clever way to drive this one number down.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-clustering)", marginBottom: 4 }}>
            Why squared distance, not plain distance?
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Because the point that minimises the total <em>squared</em> distance to a set of points
            is exactly their <strong>mean</strong>. That single fact is what makes the
            &ldquo;move each centroid to the average of its points&rdquo; step optimal — and it&rsquo;s
            why the algorithm is called k-<em>means</em> and not k-medians.
          </p>
        </div>

        <h2>The chicken and the egg</h2>
        <p>
          There&rsquo;s a catch baked into the objective. To know each point&rsquo;s cluster, you
          need the centroids. To compute the centroids, you need each point&rsquo;s cluster. Neither
          comes first. k-Means breaks the deadlock by guessing centroids, then alternating between
          the two — which is exactly the loop on the next page.
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/similarity-and-distance" style={navLink}>← Similarity & distance</Link>
          <Link href="/learn/k-means/assign-and-update" style={{ ...navLink, fontWeight: 600 }}>Next up · Assign & update →</Link>
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
