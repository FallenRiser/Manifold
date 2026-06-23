import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "The algorithm, end to end — Manifold",
  description:
    "k-NN prediction in four concrete steps: store, measure, select, decide. The complete algorithm with no hand-waving — and the one design choice hiding inside each step.",
};

export default function AlgorithmPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-classification)")}>Classification</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        The algorithm, end to end
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        You&rsquo;ve seen the intuition and the failure of 1-NN. Here is the complete k-NN algorithm, written
        out step by step — and the decision quietly built into each step that the rest of the track expands.
      </p>

      <div className="lesson">
        <h2>The four steps</h2>
        <ol style={ol}>
          <li>
            <strong>Store.</strong> &ldquo;Training&rdquo; is just keeping the labelled dataset{" "}
            <code>(X_train, y_train)</code>. No fitting — the data is the model.{" "}
            <span style={{ color: "var(--faint)" }}>Hidden choice: how to store it for fast lookup later (the search-structures chapter).</span>
          </li>
          <li>
            <strong>Measure.</strong> Given a query, compute its distance to every stored point.{" "}
            <span style={{ color: "var(--faint)" }}>Hidden choice: which distance metric — and whether features are scaled.</span>
          </li>
          <li>
            <strong>Select.</strong> Take the <em>k</em> points with the smallest distances — the neighbours.{" "}
            <span style={{ color: "var(--faint)" }}>Hidden choice: the value of k.</span>
          </li>
          <li>
            <strong>Decide.</strong> Combine the neighbours&rsquo; labels — majority vote for classification,
            average for regression.{" "}
            <span style={{ color: "var(--faint)" }}>Hidden choice: equal votes, or distance-weighted.</span>
          </li>
        </ol>
        <p>
          That&rsquo;s the entire algorithm. Its elegance is that those four lines are genuinely all there is —
          and its depth is that each &ldquo;hidden choice&rdquo; is a real lever this track teaches you to set.
        </p>

        <h2>Train time vs. predict time</h2>
        <p>
          The cost profile is the opposite of most models. <strong>Training is O(1)</strong> — you just keep
          a reference to the data. <strong>Prediction is expensive</strong>: a naive query compares against
          all <em>n</em> stored points across <em>d</em> features, so each prediction is{" "}
          <code>O(n·d)</code>. Predicting for many queries, or with a huge dataset, is where k-NN gets slow —
          and why the search-structures chapter exists.
        </p>

        <h2>The complete implementation</h2>
        <p>
          Unlike most algorithms, you can read the whole thing at once — no optimizer, no training loop:
        </p>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-classification)", marginBottom: 4 }}>
            One subtlety: prediction is a function of the whole dataset
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Because there&rsquo;s no compressed model, every prediction re-reads (a structured view of) the
            entire training set. Add a point and future predictions can change with no retraining — wonderful
            for online/streaming settings. But it also means the data must stay in memory and the dataset&rsquo;s
            quirks — outliers, imbalance, irrelevant features — feed <em>directly</em> into every answer.
            There&rsquo;s nowhere for bad data to hide.
          </p>
        </div>

        <p>
          The next two pages take the &ldquo;decide&rdquo; step apart for the two tasks — voting for classes,
          averaging for numbers — and then we&rsquo;ll render the boundary the algorithm draws.
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-nearest-neighbors/from-1-nn-to-k-nn" style={navLink}>← From 1-NN to k-NN</Link>
          <Link href="/learn/k-nearest-neighbors/classification-by-majority-vote" style={{ ...navLink, fontWeight: 600 }}>Next up · Classification by majority vote →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np
from collections import Counter

class KNN:
    def fit(self, X, y):
        self.X, self.y = np.asarray(X), np.asarray(y)   # step 1: store. that's it.

    def predict_one(self, x, k):
        d = np.sqrt(((self.X - x)**2).sum(axis=1))       # step 2: measure
        idx = np.argsort(d)[:k]                          # step 3: select k nearest
        return Counter(self.y[idx]).most_common(1)[0][0] # step 4: decide (vote)

    def predict(self, X, k=5):
        return np.array([self.predict_one(x, k) for x in np.asarray(X)])`;

const codeLib = `from sklearn.neighbors import KNeighborsClassifier

knn = KNeighborsClassifier(
    n_neighbors=5,        # step 3: k
    metric="minkowski", p=2,   # step 2: distance (p=2 is Euclidean)
    weights="uniform",    # step 4: equal votes (or "distance")
    algorithm="auto",     # step 1: sklearn picks brute / kd_tree / ball_tree
)
knn.fit(X_train, y_train)
y_pred = knn.predict(X_test)`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ol: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.85 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-classification) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-classification) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
