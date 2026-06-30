import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { KNNLab } from "@/components/labs/KNNLab";

export const metadata = {
  title: "What is k-NN? — Manifold",
  description:
    "k-Nearest Neighbors is the simplest idea in machine learning: to label something new, look at the labelled things most like it and let them vote. No training, no model — just the data itself.",
};

export default function KNNHubPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-classification)")}>Classification</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 44, lineHeight: 1.08, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        What is k-NN?
      </h1>
      <p style={{ fontSize: 17.5, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        k-Nearest Neighbors is the most intuitive algorithm in all of machine learning, and a perfect
        entry to classification: to decide what something is, look at the things most similar to it and
        let them vote. That&rsquo;s the whole idea.
      </p>

      <div className="lesson">
        <h2>You are who your neighbors are</h2>
        <p>
          Want to guess whether a fruit is a lemon or a lime? Find the few fruits in your basket most
          similar in size and colour, and go with the majority. Want to know if an email is spam? Find the
          most similar past emails and copy their label. That folk-wisdom — <em>similar things tend to
          share labels</em> — is exactly k-NN, made precise.
        </p>
        <p>
          To classify a new point, k-NN does just two things: find the <strong>k</strong> stored examples
          nearest to it, then take a <strong>majority vote</strong> of their labels. For numeric targets,
          average them instead. There&rsquo;s no equation to fit, no weights to learn.
        </p>

        <h2>Try it</h2>
        <p>
          Click anywhere to drop the query point. Its <strong>k</strong> nearest neighbours light up and
          vote, and the point takes the winning colour. Move it across the fuzzy middle and flip <em>k</em>{" "}
          — watch how much the answer depends on both where you are and how many neighbours you ask.
        </p>
        <KNNLab />

        <h2>Lazy learning: the model <em>is</em> the data</h2>
        <p>
          k-NN is the textbook <strong>lazy learner</strong>. &ldquo;Training&rdquo; is just storing the dataset —
          it does literally no work up front. All the computation happens at <em>prediction</em> time, when
          it measures distances to find the neighbours. This is the mirror image of most algorithms (linear
          regression, neural nets), which grind through training to build a compact model and then predict
          instantly. k-NN flips that: trivial training, expensive prediction.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-classification)", marginBottom: 4 }}>
            Three consequences of being lazy
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Because k-NN memorises rather than generalises, it is <strong>non-parametric</strong> (it makes
            no assumption about the shape of the decision boundary — it can fit any shape), it adapts
            instantly when you add data (no retraining), but it&rsquo;s <strong>slow and memory-hungry at
            prediction time</strong> and leans entirely on having a good notion of &ldquo;distance.&rdquo; Every
            chapter of this track unpacks one of those consequences.
          </p>
        </div>

        <h2>The whole algorithm, in code</h2>
        <p>
          k-NN is one of the few algorithms you can write in a few honest lines before reaching for a
          library:
        </p>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <h2>What this track covers</h2>
        <p>
          We&rsquo;ll go from this first vote to full mastery: how the prediction and{" "}
          <strong>decision boundary</strong> really work, how to <strong>choose k</strong>, why{" "}
          <strong>scaling and distance</strong> make or break it, the <strong>curse of
          dimensionality</strong>, the clever <strong>search structures</strong> that make it fast, the
          theory (including the famous result that 1-NN is within 2× of the best possible classifier), and
          three real cases. Onward.
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means" style={navLink}>← k-Means clustering</Link>
          <Link href="/learn/k-nearest-neighbors/the-classification-landscape" style={{ ...navLink, fontWeight: 600 }}>Next up · The classification landscape →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np
from collections import Counter

def knn_predict(X_train, y_train, x, k):
    # 1. distance from x to every stored training point
    d = np.sqrt(((X_train - x)**2).sum(axis=1))
    # 2. the k nearest, then a majority vote of their labels
    nearest = y_train[np.argsort(d)[:k]]
    return Counter(nearest).most_common(1)[0][0]

# "training" is just keeping the data around — no work done here
pred = knn_predict(X_train, y_train, x_new, k=5)`;

const codeLib = `from sklearn.neighbors import KNeighborsClassifier

# .fit() just stores the data (lazy learner); .predict() does the real work
knn = KNeighborsClassifier(n_neighbors=5)
knn.fit(X_train, y_train)
print(knn.predict(X_new))
print(knn.predict_proba(X_new))   # vote fractions across classes`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-classification) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-classification) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
