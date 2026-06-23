import Link from "next/link";
import { KMeansLab } from "@/components/labs/KMeansLab";

export const metadata = {
  title: "What is clustering? — Manifold",
  description:
    "Clustering finds structure in unlabeled data: groups of points that belong together. k-Means is the canonical algorithm — here's the intuition, interactively.",
};

export default function KMeansHubPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={chip("var(--c-metrics)")}>Unsupervised</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        What is clustering?
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        Linear regression had an answer key — every row came with a target to predict. Clustering
        works in the dark: no labels, just points. The job is to discover the groups that were
        there all along.
      </p>

      <div className="lesson">
        <h2>Supervised vs unsupervised</h2>
        <p>
          In the regression track, every example came as a pair: features <strong>and</strong> the
          right answer. The model learned the mapping between them. That&rsquo;s{" "}
          <strong>supervised</strong> learning.
        </p>
        <p>
          Clustering is <strong>unsupervised</strong>: you get the features and nothing else. There
          is no &ldquo;correct&rdquo; output to copy. Instead, the goal is structure — which points
          naturally belong together? Think customers who shop alike, pixels of a similar colour,
          documents about the same topic. Nobody labelled them; the grouping has to be{" "}
          <em>discovered</em>.
        </p>

        <h2>The goal: tight, separated groups</h2>
        <p>
          A good clustering has two properties: points in the same group are <strong>close to each
          other</strong>, and the groups are <strong>far apart</strong>. That&rsquo;s it. The whole
          field is different answers to &ldquo;close&rdquo; and &ldquo;how many groups.&rdquo;
        </p>
        <p>
          <strong>k-Means</strong> is the canonical first answer. You tell it how many groups to
          find (that&rsquo;s the <em>k</em>), and it places <em>k</em> centre points — centroids —
          then shuffles them around until each one sits in the middle of a tight cluster.
        </p>

        <h2>Watch it work</h2>
        <p>
          Below is the entire algorithm. Press <strong>Run to convergence</strong> and watch the
          centroids (the ✛ marks) crawl into the heart of each blob while the points recolour to
          their nearest centre. Or hit <strong>Assign + update</strong> to take it one step at a
          time. Change <em>k</em>, or generate new data, and run it again.
        </p>

        <KMeansLab />

        <p>
          Notice the <strong>inertia</strong> number only ever falls. Every step makes the clusters
          tighter, never looser — which is exactly why the algorithm is guaranteed to stop. The next
          few pages unpack each piece: what &ldquo;distance&rdquo; really means, the two-phase loop,
          and why that monotonic drop guarantees convergence.
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/linear-regression" style={navLink}>← Linear regression</Link>
          <Link href="/learn/k-means/the-unsupervised-landscape" style={{ ...navLink, fontWeight: 600 }}>Next up · The unsupervised landscape →</Link>
        </div>
      </div>
    </article>
  );
}

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
