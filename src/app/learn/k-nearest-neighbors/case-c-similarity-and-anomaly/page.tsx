import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Case C: similarity search & anomaly detection — Manifold",
  description:
    "Two production workhorses from one distance: retrieval (find the nearest) and anomaly detection (find the ones with no neighbours). Real runs on digits — 96.5% retrieval precision and perfect outlier separation.",
};

export default function CaseCSimilarityAnomalyPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Case study", color: "var(--c-classification)" }]}
        time="about 8 minutes"
        title={<>Case C: similarity search &amp; anomaly detection</>}
        intro={<>
          The same neighbour distance runs two of the most deployed jobs in ML — pointed one way it&rsquo;s
        <em>retrieval</em> (&ldquo;find the most similar&rdquo;), pointed the other it&rsquo;s <em>anomaly detection</em>
        (&ldquo;find the ones with no neighbours&rdquo;). Both, run for real, on the digits data.
        </>}
      />

      <div className="lesson">
        <h2>Similarity search: retrieval as k-NN without the vote</h2>
        <p>
          Strip the voting off k-NN and you&rsquo;re left with pure <strong>retrieval</strong>: return the nearest
          items themselves. That&rsquo;s reverse image search, near-duplicate detection, &ldquo;more like this,&rdquo;
          and the retrieval stage of modern semantic search. The quality measure is <strong>precision@k</strong> —
          of the k nearest, how many are genuinely relevant (here: share the query digit&rsquo;s label)?
        </p>
        <CodeBlock fromScratch={codeC1} />
        <CodeOutput label="output · scripts/knn_cases.py">{outputC1}</CodeOutput>
        <p>
          <strong>96.5%</strong> of each digit&rsquo;s ten nearest images are the same digit — with no labels used
          at query time, just distance. That single number is why nearest-neighbour retrieval underpins so much
          production search: neighbours in a good feature space really are relevant.
        </p>

        <h2>Anomaly detection: the points with no neighbours</h2>
        <p>
          Flip it. A normal point has close neighbours; an outlier sits far from everything, so{" "}
          <strong>distance to your neighbours is an outlier score</strong> — unsupervised, no anomaly labels
          needed. Two common scores: the mean distance to your <em>k</em> nearest, and{" "}
          <strong>Local Outlier Factor</strong> (LOF), which compares your local density to your neighbours&rsquo;.
          Testing on a clean cluster of 0-digits with a handful of other digits mixed in as anomalies:
        </p>
        <CodeBlock fromScratch={codeC2} />
        <CodeOutput label="output · scripts/knn_cases.py">{outputC2}</CodeOutput>
        <p>
          Both scores hit <strong>ROC-AUC 1.000</strong> — perfect separation. That&rsquo;s honest but easy: the
          0-digits form one tight, coherent cluster, so anything from another digit is unmistakably far away.
          When the normal class is that clean, plain neighbour-distance is already a flawless detector.
        </p>

        <Callout color="var(--c-classification)" title={<>When you actually need LOF over plain k-distance</>}>
          The two scores agree here, but they diverge when <strong>density varies across the data</strong>. A
            global distance threshold flags every point in a naturally sparse region as anomalous;{" "}
            <strong>LOF</strong> asks instead whether a point is sparse <em>relative to its own neighbours</em>, so
            it catches a local outlier sitting just outside a dense cluster while ignoring the diffuse-but-normal
            fringe. Reach for LOF when your inliers themselves have very different densities.
        </Callout>

        <h2>Both are k-NN at scale</h2>
        <p>
          Retrieval and distance-based anomaly detection are the same operation — nearest-neighbour search — so
          they scale the same way. At millions of vectors, exact search gives way to{" "}
          <Link href="/learn/k-nearest-neighbors/approximate-nearest-neighbors" style={inlineLink}>approximate
          nearest-neighbour</Link> indexes (HNSW, IVF-PQ), which is exactly what vector databases provide. Every
          &ldquo;find similar&rdquo; feature and every distance-based fraud/novelty detector at scale is running
          approximate k-NN under the hood.
        </p>

        <Callout color="var(--c-classification)" title={<>That completes the k-Nearest Neighbours track</>}>
          From &ldquo;copy your nearest neighbour&rdquo; to the Bayes-optimal theory behind it, through choosing{" "}
            <em>k</em>, distance and scaling, the search structures that make it fast, its regression and
            estimation guises, and now three real deployments — you&rsquo;ve seen k-NN end to end. One idea,
            &ldquo;similar things behave similarly,&rdquo; measured carefully, turns out to be one of the most
            broadly useful tools in machine learning. Revisit any part from the{" "}
            <Link href="/map" style={{ color: "var(--brand)", textDecoration: "none" }}>curriculum map</Link>, or
            branch into its unsupervised cousin, <Link href="/learn/k-means" style={inlineLink}>k-means clustering</Link>.
        </Callout>

        <Quiz
          accent="var(--c-classification)"
          questions={[
            {
              q: "Similarity search (retrieval) differs from k-NN classification in that it…",
              options: ["Returns the nearest items themselves, without a vote", "Requires labels at query time", "Uses a different distance metric"],
              answer: 0,
              explain: "Retrieval is k-NN minus the voting step — you surface the neighbours as results. precision@k measures how many are relevant.",
            },
            {
              q: "How does k-NN detect anomalies without any anomaly labels?",
              options: ["Distance to neighbours is the score — isolated points sit far from everything", "It trains a classifier on known anomalies", "It clusters the data first"],
              answer: 0,
              explain: "Density and neighbour-distance are inverses; a large distance to even the nearest points flags an outlier, entirely unsupervised.",
            },
            {
              q: "When does LOF clearly beat a global k-distance threshold?",
              options: ["When inlier density varies — LOF judges a point relative to its own neighbours", "When the data is perfectly clean", "When there are no anomalies"],
              answer: 0,
              explain: "A global threshold mislabels naturally sparse regions. LOF's local, relative view flags points sparse compared to their surroundings, handling varying densities.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/case-b-recommendation", label: <>← Case B: recommendation</> }} next={{ href: "/learn/k-means", label: <>Next track · k-means clustering →</> }} />
      </div>
    </article>
  );
}

const codeC1 = `from sklearn.datasets import load_digits
from sklearn.neighbors import NearestNeighbors

X, y = load_digits(return_X_y=True)
nn = NearestNeighbors(n_neighbors=11).fit(X)     # 1 self + 10 neighbours
_, idx = nn.kneighbors(X)

# precision@10: fraction of the 10 nearest (excluding self) sharing the label
same = (y[idx[:, 1:]] == y[:, None]).mean()
print(f"similarity search precision@10: {same:.4f}")`;

const outputC1 = `similarity search precision@10 (digits): 0.9651`;

const codeC2 = `import numpy as np
from sklearn.neighbors import NearestNeighbors, LocalOutlierFactor
from sklearn.metrics import roc_auc_score

# inliers = digit 0; anomalies = a few other digits mixed in
Xmix, is_anom = build_mix(X, y)                  # 178 zeros + 17 anomalies

# score 1: mean distance to k nearest neighbours (bigger = more anomalous)
d, _ = NearestNeighbors(n_neighbors=6).fit(Xmix).kneighbors(Xmix)
knn_score = d[:, 1:].mean(axis=1)
print("kNN-distance ROC-AUC:", roc_auc_score(is_anom, knn_score))

# score 2: Local Outlier Factor (local density comparison)
lof = LocalOutlierFactor(n_neighbors=20).fit(Xmix)
print("LOF ROC-AUC:", roc_auc_score(is_anom, -lof.negative_outlier_factor_))`;

const outputC2 = `anomaly set: 178 inliers (digit 0) + 17 anomalies
kNN mean-distance score ROC-AUC: 1.0000
LOF ROC-AUC: 1.0000`;

const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
