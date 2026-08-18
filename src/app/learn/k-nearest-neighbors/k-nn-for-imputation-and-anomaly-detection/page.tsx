import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { KNN_SETUP } from "@/lib/runtimeSetup";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "k-NN for imputation & anomaly detection — Manifold",
  description:
    "The nearest-neighbour idea does more than classify. It fills missing values from similar rows, and it flags outliers by how far they sit from their neighbours — two workhorse uses of the same distance.",
};

// Anomaly detection by neighbour distance: a dense cluster plus one far outlier.
// The outlier's distance to its nearest neighbour is large; a normal point's is small.
const CLUSTER = [[95, 110], [120, 100], [105, 128], [132, 120], [90, 132], [118, 138],
  [102, 96], [128, 142], [86, 118], [138, 108], [112, 150], [146, 130]];
const NORMAL = [120, 100];       // a typical point
const NORMAL_NBR = [105, 110];   // its close neighbour (drawn implicitly nearby)
const OUTLIER = [258, 52];
const OUT_NBR = [146, 108];      // its nearest cluster point (far away)

export default function ImputationAnomalyPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Tier 2 · other uses", color: "var(--c-classification)" }]}
        time="about 7 minutes"
        title={<>k-NN for imputation &amp; anomaly detection</>}
        intro={<>
          &ldquo;Similar rows have similar values&rdquo; powers more than classification. The same distance that
        finds neighbours can fill in a missing entry from them — or, run the other way, flag the points that
        have no close neighbours at all.
        </>}
      />

      <div className="lesson">
        <h2>Imputation: borrow from your neighbours</h2>
        <p>
          When a value is missing, k-NN imputation finds the rows most similar to the incomplete one — using the
          features that <em>are</em> present — and fills the gap with their average (or mode, for categoricals).
          It&rsquo;s the exact k-NN recipe pointed at a feature instead of the label:
        </p>
        <MathBlock>{String.raw`\hat{x}_{j} = \frac{1}{k}\sum_{i \in N_k}\, x_{i,j} \quad\text{over the } k \text{ nearest complete rows}`}</MathBlock>
        <p>
          Because it uses the local structure of the data, k-NN imputation is usually far more faithful than
          filling every gap with a single column mean — it preserves relationships between features that a
          global constant flattens. The trade-offs are the familiar ones: scale first (so the neighbour search
          is honest), it&rsquo;s costly on large data, and it inherits the curse of dimensionality. This is the
          <code>KNNImputer</code> you already met in{" "}
          <Link href="/learn/k-nearest-neighbors/preprocessing-and-encoding" style={inlineLink}>preprocessing</Link> —
          now you know precisely what it does.
        </p>

        <h2>Anomaly detection: the points with no neighbours</h2>
        <p>
          Flip the question. A normal point sits amid many close neighbours; an anomaly sits far from
          everything. So the <strong>distance to your neighbours is itself an outlier score</strong> — no labels
          required:
        </p>

        <figure style={{ margin: "1.4rem 0", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
          <svg viewBox="0 0 300 200" style={{ width: "100%", height: "auto", display: "block", maxWidth: 380, margin: "0 auto" }} role="img" aria-label="A dense cluster of normal points, each close to its neighbours, and one far-off outlier whose distance to the nearest point is large.">
            <rect x={1} y={1} width={298} height={198} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            {/* outlier's long distance to nearest cluster point */}
            <line x1={OUTLIER[0]} y1={OUTLIER[1]} x2={OUT_NBR[0]} y2={OUT_NBR[1]} stroke="var(--c-classification)" strokeWidth={1.3} strokeDasharray="4 3" />
            {/* normal point's short distance */}
            <line x1={NORMAL[0]} y1={NORMAL[1]} x2={NORMAL_NBR[0]} y2={NORMAL_NBR[1]} stroke="var(--good)" strokeWidth={1.6} />
            {CLUSTER.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={4} fill="var(--c-regression)" fillOpacity={0.8} />)}
            <circle cx={NORMAL[0]} cy={NORMAL[1]} r={5} fill="var(--good)" stroke="var(--surface)" strokeWidth={1} />
            <circle cx={OUTLIER[0]} cy={OUTLIER[1]} r={5.5} fill="var(--c-classification)" stroke="var(--ink)" strokeWidth={1} />
            <text x={OUTLIER[0]} y={OUTLIER[1] - 9} fontSize={9} fill="var(--c-classification)" textAnchor="middle">outlier</text>
            <text x={NORMAL[0] + 8} y={NORMAL[1] + 3} fontSize={8.5} fill="var(--good)">small k-distance</text>
            <text x={200} y={92} fontSize={8.5} fill="var(--c-classification)">large k-distance → anomaly</text>
          </svg>
          <figcaption style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8, lineHeight: 1.55 }}>
            Every normal point has a neighbour close by (short green link). The outlier&rsquo;s <em>nearest</em>
            point is still far away (long dashed link) — that distance is its anomaly score.
          </figcaption>
        </figure>

        <p>Two standard scores build on this:</p>
        <ul style={ul}>
          <li><strong>k-distance / mean k-NN distance</strong> — score each point by the distance to its <M>{String.raw`k`}</M>-th neighbour (or the average over its k neighbours). Big score → isolated → anomalous. Simple and effective when one global density is reasonable.</li>
          <li><strong>Local Outlier Factor (LOF)</strong> — compares a point&rsquo;s local density to that of its neighbours. It catches outliers that a global threshold misses: a point that&rsquo;s normal-looking in absolute distance but sits in a much sparser region than the tight cluster next door.</li>
        </ul>

        <Callout color="var(--c-classification)" title={<>One distance, three jobs</>}>
          Classification votes with neighbour <em>labels</em>; imputation averages neighbour <em>features</em>;
            anomaly detection scores by neighbour <em>distance</em>. All three are the same nearest-neighbour
            search, just reading a different quantity off the neighbours — which is why getting the distance
            right (scaling, metric, dimensionality) pays off across every one of them.
        </Callout>

        <CodeBlock setup={KNN_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <Quiz
          accent="var(--c-classification)"
          questions={[
            {
              q: "How does k-NN imputation fill a missing value?",
              options: ["Averages that feature over the k most similar complete rows", "Uses the global column mean", "Predicts it with a linear model"],
              answer: 0,
              explain: "It runs the usual neighbour search over the observed features, then averages the target feature across the nearest complete rows — preserving local structure a global mean would flatten.",
            },
            {
              q: "Why can distance to neighbours serve as an anomaly score?",
              options: ["Normal points have close neighbours; anomalies sit far from everything", "Anomalies always have the same label", "Distance is unrelated to density"],
              answer: 0,
              explain: "Density and neighbour-distance are inverses: an isolated point has a large distance even to its nearest neighbour, which flags it — no labels needed.",
            },
            {
              q: "What does Local Outlier Factor (LOF) add over a global k-distance threshold?",
              options: ["It compares a point's local density to its neighbours', catching locally-sparse outliers", "It runs faster", "It requires labelled anomalies"],
              answer: 0,
              explain: "LOF is relative: it flags points in regions much sparser than their surroundings, which a single global distance cutoff would miss.",
            },
          ]}
        />

        <Callout color="var(--c-classification)" title={<>Where this chapter leaves you</>}>
          k-NN now spans classification, regression, smoothing, imputation, and anomaly detection — all one
            distance, read different ways. What&rsquo;s left is the <em>theory</em>: why does &ldquo;ask your
            neighbours&rdquo; work at all? The next chapter proves it — the Bayes-optimal target, the famous
            1-NN error bound, and the conditions for consistency. See the full path on the{" "}
            <Link href="/map" style={{ color: "var(--brand)", textDecoration: "none" }}>curriculum map</Link>.
        </Callout>

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/local-weighted-regression", label: <>← Local weighted regression</> }} next={{ href: "/learn/k-nearest-neighbors/the-bayes-classifier-and-bayes-error", label: <>Next up · The Bayes classifier &amp; Bayes error →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

# ANOMALY SCORE: distance to the k-th nearest neighbour (bigger = more anomalous)
def knn_anomaly_scores(X, k=5):
    scores = np.zeros(len(X))
    for i, x in enumerate(X):
        d = np.sqrt(((X - x)**2).sum(axis=1))
        d.sort()
        scores[i] = d[k]        # d[0] is itself (0); d[k] is the k-th neighbour
    return scores

scores = knn_anomaly_scores(X_train, k=5)
flagged = scores > np.percentile(scores, 95)    # top 5% as candidate outliers`;

const codeLib = `from sklearn.impute import KNNImputer
from sklearn.neighbors import LocalOutlierFactor

# IMPUTATION: fill gaps from the k most similar complete rows
X_filled = KNNImputer(n_neighbors=5).fit_transform(X_with_gaps)

# ANOMALY DETECTION: LOF compares local densities; -1 = outlier
lof = LocalOutlierFactor(n_neighbors=20)
labels = lof.fit_predict(X_train)                 # 1 = inlier, -1 = outlier
print("flagged outliers:", (labels == -1).sum())`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
