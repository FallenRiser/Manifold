import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Classification by majority vote — Manifold",
  description:
    "How k-NN turns k neighbours into a class: count the votes, take the winner — and read the vote fractions as calibrated-ish probabilities. Plus ties, imbalance, and what predict_proba really is.",
};

export default function MajorityVotePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }]}
        time="about 5 minutes"
        title={<>Classification by majority vote</>}
        intro={<>
          The &ldquo;decide&rdquo; step for classes is the simplest democracy imaginable: each of the <em>k</em>
        neighbours casts one vote for its own class, and the plurality wins. But the vote tally tells you
        more than the winner.
        </>}
      />

      <div className="lesson">
        <h2>The rule</h2>
        <p>
          Among the <em>k</em> nearest neighbours, count how many belong to each class and predict the most
          common one:
        </p>
        <MathBlock>{String.raw`\hat{y} = \arg\max_{c} \sum_{i \in N_k(x)} \mathbb{1}[\,y_i = c\,]`}</MathBlock>
        <p>
          where <M>{String.raw`N_k(x)`}</M> is the set of <em>k</em> nearest neighbours and{" "}
          <M>{String.raw`\mathbb{1}[\cdot]`}</M> is 1 when the neighbour&rsquo;s label equals class{" "}
          <M>{String.raw`c`}</M>. With <em>k</em> = 7 and neighbours {`{A, A, B, A, B, A, A}`}, that&rsquo;s 5
          votes for A, 2 for B → predict <strong>A</strong>.
        </p>

        <h2>Vote fractions are (rough) probabilities</h2>
        <p>
          The fraction of neighbours in each class is k-NN&rsquo;s estimate of class probability — exactly what{" "}
          <code>predict_proba</code> returns:
        </p>
        <MathBlock>{String.raw`\hat{P}(y = c \mid x) = \frac{1}{k}\sum_{i \in N_k(x)} \mathbb{1}[\,y_i = c\,]`}</MathBlock>
        <p>
          So 5-of-7 for A means <M>{String.raw`\hat{P}(A) \approx 0.71`}</M>. These are useful for ranking and
          thresholding, but <strong>coarse</strong>: with <em>k</em> = 7 the only possible probabilities are{" "}
          0, 1/7, 2/7, &hellip; — a small <em>k</em> can&rsquo;t express confidence finely, and the estimates aren&rsquo;t
          well-calibrated. Larger <em>k</em> gives smoother probabilities (another reason to tune it).
        </p>

        <h2>Ties and how to break them</h2>
        <ul style={ul}>
          <li><strong>Use odd k</strong> for two classes — it makes a tied vote impossible.</li>
          <li><strong>Multi-class or weighted votes</strong> can still tie. Common breakers: pick the class of the single nearest neighbour, drop to a smaller <em>k</em>, or choose by total/with distance weighting.</li>
          <li><strong>Distance weighting</strong> (next-but-one page) mostly dissolves ties by giving closer neighbours more say.</li>
        </ul>

        <Callout color="var(--c-classification)" title={<>Watch out for class imbalance</>}>
          Plain majority vote is biased toward the <strong>majority class</strong>: if 95% of your data is
            class A, most neighbourhoods are mostly A, and rare-class points get outvoted even when they&rsquo;re
            genuinely surrounded by their own kind nearby. Fixes include distance weighting, resampling to
            balance classes, or adjusting the decision threshold on <code>predict_proba</code>. Imbalance is
            a recurring k-NN gotcha — it gets its own practitioner page.
        </Callout>

        <h2>Vote and read probabilities</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/the-algorithm-end-to-end", label: <>← The algorithm, end to end</> }} next={{ href: "/learn/k-nearest-neighbors/regression-by-averaging", label: <>Next up · Regression by averaging →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np
from collections import Counter

def knn_classify(X, y, x, k):
    idx = np.argsort(np.sqrt(((X - x)**2).sum(1)))[:k]
    neigh = y[idx]
    votes = Counter(neigh)
    pred = votes.most_common(1)[0][0]
    proba = {c: n / k for c, n in votes.items()}   # vote fractions = P(class)
    return pred, proba

pred, proba = knn_classify(X_train, y_train, x_new, k=7)
print(pred, proba)   # e.g. 'A', {'A': 0.714, 'B': 0.286}`;

const codeLib = `from sklearn.neighbors import KNeighborsClassifier

knn = KNeighborsClassifier(n_neighbors=7).fit(X_train, y_train)
print(knn.predict(X_new))          # the majority-vote winner
print(knn.predict_proba(X_new))    # the vote fractions, one column per class`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
