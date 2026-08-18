import Link from "next/link";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "k-NN vs k-means (the name trap) — Manifold",
  description:
    "They share a letter and a reliance on distance, and that's where it ends. k-NN is supervised prediction; k-means is unsupervised grouping. Here's the clean separation so you never conflate them again.",
};

const th: React.CSSProperties = { textAlign: "left", padding: "9px 12px", fontSize: 12.5, fontWeight: 600, borderBottom: "2px solid var(--border-strong)" };
const rowh: React.CSSProperties = { textAlign: "left", padding: "9px 12px", fontSize: 12.5, color: "var(--ink)", fontWeight: 600, borderBottom: "1px solid var(--border)" };
const td: React.CSSProperties = { padding: "9px 12px", fontSize: 13.5, color: "var(--muted)", borderBottom: "1px solid var(--border)", verticalAlign: "top" };

function Row({ h, knn, km }: { h: string; knn: React.ReactNode; km: React.ReactNode }) {
  return (
    <tr>
      <td style={rowh}>{h}</td>
      <td style={{ ...td, background: "color-mix(in srgb, var(--c-classification) 5%, transparent)" }}>{knn}</td>
      <td style={{ ...td, background: "color-mix(in srgb, var(--c-clustering) 5%, transparent)" }}>{km}</td>
    </tr>
  );
}

export default function KnnVsKmeansPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Tier 2 · strengths & kin", color: "var(--c-classification)" }]}
        time="about 6 minutes"
        title={<>k-NN vs k-means (the name trap)</>}
        intro={<>
          No two algorithms are confused more often, purely because they share a letter. k-<em>Nearest
        Neighbours</em> and k-<em>Means</em> are near-opposites — one predicts with labels, the other discovers
        groups without them. Untangling them takes one table.
        </>}
      />

      <div className="lesson">
        <h2>Why they get confused — and why that&rsquo;s wrong</h2>
        <p>
          Both start with &ldquo;k,&rdquo; both lean on a distance metric, and both live in the same geometric
          picture of points in feature space. That&rsquo;s the entire overlap. Everything about what they{" "}
          <em>do</em> — the problem they solve, whether they need labels, what &ldquo;k&rdquo; even counts — is
          different.
        </p>

        <div style={{ overflowX: "auto", margin: "1.4rem 0" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 520, background: "var(--surface)", border: "1px solid var(--border-strong)", borderRadius: 10 }}>
            <thead>
              <tr>
                <th style={th}></th>
                <th style={{ ...th, color: "var(--c-classification)" }}>k-Nearest Neighbours</th>
                <th style={{ ...th, color: "var(--c-clustering)" }}>k-Means</th>
              </tr>
            </thead>
            <tbody>
              <Row h="Learning type" knn="Supervised" km="Unsupervised" />
              <Row h="Goal" knn="Predict a label or value" km="Partition data into groups" />
              <Row h='What "k" means' knn="How many neighbours vote per prediction" km="How many clusters to find" />
              <Row h="Needs labels?" knn="Yes — neighbours carry known answers" km="No — there are no labels" />
              <Row h="Training" knn="None (lazy — just stores data)" km="Iterative (Lloyd's: assign ↔ update centroids)" />
              <Row h="What it produces" knn="A prediction for each query point" km="k centroids + a cluster assignment for every point" />
              <Row h="Model stored" knn="The entire training set" km="Just the k centroids" />
              <Row h="Distance is used to…" knn="Find the nearest labelled points" km="Assign points to the nearest centroid, then recompute it" />
            </tbody>
          </table>
        </div>

        <h2>What they genuinely share</h2>
        <p>The overlap is real but small, and it&rsquo;s all downstream of using a distance:</p>
        <ul style={ul}>
          <li><strong>A distance metric is central</strong> — so both are <em>scaling-sensitive</em> and both suffer the <Link href="/learn/k-nearest-neighbors/the-curse-of-dimensionality" style={inlineLink}>curse of dimensionality</Link>. Scale your features for either.</li>
          <li><strong>&ldquo;k&rdquo; is a hyperparameter you must choose</strong> — though it means completely different things, and you choose it differently (CV against labels for k-NN; the elbow/silhouette for k-means).</li>
          <li><strong>Both assume geometry is meaningful</strong> — that closeness in feature space corresponds to similarity in outcome or in group.</li>
        </ul>

        <Callout color="var(--c-classification)" title={<>A one-sentence mnemonic</>}>
          <strong>k-NN</strong> asks &ldquo;what are my <em>labelled</em> neighbours, so I can copy them?&rdquo;;{" "}
            <strong>k-means</strong> asks &ldquo;where are the <em>centres</em>, so I can group everyone around
            them?&rdquo; One borrows answers; the other invents categories. If you have labels and want a
            prediction, it&rsquo;s k-NN. If you have none and want structure, it&rsquo;s k-means.
        </Callout>

        <p>
          k-means gets the full treatment in its own <Link href="/learn/k-means" style={inlineLink}>clustering track</Link> —
          where you&rsquo;ll see the iterative centroid updates, the initialisation problem (k-means++), and how to
          pick the number of clusters. It&rsquo;s the natural next stop if the unsupervised side intrigues you.
        </p>

        <Callout color="var(--c-classification)" title={<>Where this leaves the k-NN track</>}>
          That completes the conceptual arc: intuition → prediction → choosing k → distance &amp; weighting →
            making it work → scaling the search → regression &amp; other uses → theory → and now strengths,
            weaknesses, and kin. What remains are the hands-on <em>case studies</em> — digit recognition,
            recommendation, and similarity search — where all of this comes together on real data. Explore the
            full path on the <Link href="/map" style={{ color: "var(--brand)", textDecoration: "none" }}>curriculum map</Link>.
        </Callout>

        <Quiz
          accent="var(--c-classification)"
          questions={[
            {
              q: "The fundamental difference between k-NN and k-means is…",
              options: ["k-NN is supervised prediction; k-means is unsupervised clustering", "k-NN is faster to train", "They use different letters for k"],
              answer: 0,
              explain: "k-NN needs labels and predicts; k-means has no labels and groups. Same geometry, opposite tasks.",
            },
            {
              q: "What does 'k' count in each method?",
              options: ["Neighbours per prediction (k-NN) vs number of clusters (k-means)", "The same thing in both", "Iterations (k-NN) vs features (k-means)"],
              answer: 0,
              explain: "In k-NN, k is how many neighbours vote; in k-means, k is how many centroids/clusters you fit. Entirely different roles.",
            },
            {
              q: "What do k-NN and k-means genuinely share?",
              options: ["Reliance on a distance metric — so both need scaling and both feel the curse of dimensionality", "Both require labelled data", "Both store only cluster centroids"],
              answer: 0,
              explain: "Their only real common ground is using distance in feature space, which makes both scaling-sensitive and both vulnerable in high dimensions.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/k-nn-vs-logistic-regression-svm-trees", label: <>← k-NN vs logistic, SVM, trees</> }} next={{ href: "/learn/k-nearest-neighbors/case-a-digit-recognition", label: <>Next up · Case A: digit recognition →</> }} />
      </div>
    </article>
  );
}

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
