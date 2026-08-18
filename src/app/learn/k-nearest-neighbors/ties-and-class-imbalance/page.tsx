import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { KNN_SETUP } from "@/lib/runtimeSetup";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Ties & class imbalance — Manifold",
  description:
    "Two failure modes vanilla k-NN hits on messy data: votes that tie, and a majority class so large it floods every neighbourhood. Both have clean fixes once you see why they happen.",
};

// A query whose k=7 neighbourhood is flooded by the majority class even though its
// single nearest neighbour is the minority. Static, integer coordinates.
const MAJ = "var(--c-regression)";   // majority (blue)
const MIN = "var(--c-classification)"; // minority (pink)
const Q = { x: 150, y: 105 };
const NBRS = [
  { x: 168, y: 100, c: "min", rank: 1 }, // nearest — minority
  { x: 132, y: 124, c: "min", rank: 2 },
  { x: 122, y: 88, c: "maj", rank: 3 },
  { x: 182, y: 128, c: "maj", rank: 4 },
  { x: 192, y: 86, c: "maj", rank: 5 },
  { x: 112, y: 128, c: "maj", rank: 6 },
  { x: 164, y: 150, c: "maj", rank: 7 },
];

export default function TiesImbalancePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Tier 2 · in practice", color: "var(--c-classification)" }]}
        time="about 7 minutes"
        title={<>Ties &amp; class imbalance</>}
        intro={<>
          A majority vote sounds foolproof until two things go wrong: the vote ties, or one class is so
        common it wins every neighbourhood by default. Both are routine on real data, and both have fixes that
        follow directly from how voting works.
        </>}
      />

      <div className="lesson">
        <h2>Ties: when the vote splits evenly</h2>
        <p>
          A tie is any neighbourhood with no clear winner — a 2-vs-2 split with even <M>{String.raw`k`}</M>, or a
          three-way tie in a multi-class problem. You need a deterministic rule so predictions don&rsquo;t depend on
          data ordering. In rough order of preference:
        </p>
        <ul style={ul}>
          <li><strong>Use odd k</strong> for two classes — a binary vote with odd <M>{String.raw`k`}</M> simply cannot tie.</li>
          <li><strong>Weight by distance.</strong> Weighted votes almost never land on an exact tie, and this fixes multi-class ties too — the reason distance weighting is the all-purpose answer here.</li>
          <li><strong>Break by nearest.</strong> Among tied classes, pick the one whose <em>closest</em> member is nearest to the query.</li>
          <li><strong>Reduce k by one</strong> and re-vote, or fall back to a fixed priority (scikit-learn deterministically picks the lowest class label).</li>
        </ul>

        <h2>Imbalance: the majority floods every neighbourhood</h2>
        <p>
          When one class vastly outnumbers another, it dominates by sheer density. Take a query that genuinely
          belongs to the rare class: even here, the k nearest points are mostly drawn from the abundant class,
          so the vote goes the wrong way — the <em>nearest</em> neighbour can be correct while the{" "}
          <em>majority</em> is not:
        </p>

        <figure style={{ margin: "1.4rem 0", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
          <svg viewBox="0 0 300 210" style={{ width: "100%", height: "auto", display: "block", maxWidth: 340, margin: "0 auto" }} role="img" aria-label="A query's 7 nearest neighbours are 5 majority-class and 2 minority-class, so the majority vote overrides the correct nearest neighbour.">
            <rect x={1} y={1} width={298} height={208} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
            <circle cx={Q.x} cy={Q.y} r={62} fill="none" stroke="var(--border-strong)" strokeDasharray="3 4" strokeWidth={1} />
            {NBRS.map((n, i) => (
              <g key={i}>
                <line x1={Q.x} y1={Q.y} x2={n.x} y2={n.y} stroke="var(--border)" strokeWidth={0.8} strokeDasharray="1 3" />
                <circle cx={n.x} cy={n.y} r={n.rank === 1 ? 7 : 6} fill={n.c === "maj" ? MAJ : MIN} stroke={n.rank === 1 ? "var(--ink)" : "var(--surface)"} strokeWidth={n.rank === 1 ? 2 : 1} />
              </g>
            ))}
            <rect x={Q.x - 5} y={Q.y - 5} width={10} height={10} transform={`rotate(45 ${Q.x} ${Q.y})`} fill="var(--ink)" />
            <text x={Q.x + 10} y={Q.y - 8} fontSize={9} fill="var(--muted)">query (truly minority)</text>
            <text x={NBRS[0].x + 6} y={NBRS[0].y - 6} fontSize={8.5} fill={MIN}>nearest ✓</text>
            <text x={16} y={198} fontSize={9} fill={MAJ}>● majority (5 votes)</text>
            <text x={150} y={198} fontSize={9} fill={MIN}>● minority (2 votes)</text>
          </svg>
          <figcaption style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8, lineHeight: 1.55 }}>
            With <M>{String.raw`k = 7`}</M>, the vote is 5–2 for the majority class even though the query&rsquo;s
            single nearest neighbour (outlined) is the correct minority class. Uniform voting lets abundance
            override proximity.
          </figcaption>
        </figure>

        <p>
          Worse, <strong>larger k makes imbalance worse</strong> — a wider net pulls in still more of the common
          class — so the usual &ldquo;raise k for stability&rdquo; instinct backfires here. Fixes, roughly from
          cheapest to most involved:
        </p>
        <ul style={ul}>
          <li><strong>Distance-weighted voting</strong> — lets a very close minority point outweigh several distant majority ones. Often the first and easiest win.</li>
          <li><strong>Resample the training set</strong> — oversample the minority (e.g. SMOTE) or undersample the majority so neighbourhoods are more balanced.</li>
          <li><strong>Adjust the decision threshold</strong> — k-NN gives class proportions via <code>predict_proba</code>; predict the minority when its share exceeds a tuned threshold below <M>{String.raw`0.5`}</M>, rather than requiring an outright majority.</li>
          <li><strong>Judge with the right metric</strong> — accuracy rewards always guessing the majority. Track recall, F1, or balanced accuracy instead (the whole point of the evaluation pillar).</li>
        </ul>

        <Callout color="var(--c-classification)" title={<>Proportions, not just a label</>}>
          Because k-NN&rsquo;s <code>predict_proba</code> is just the fraction of neighbours in each class, it&rsquo;s
            naturally suited to threshold tuning: keep the honest proportion and move the bar. That connects
            straight to <em>cost-sensitive thresholds</em> in the evaluation pillar — set the threshold from what
            a missed minority case actually costs.
        </Callout>

        <CodeBlock setup={KNN_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <Quiz
          accent="var(--c-classification)"
          questions={[
            {
              q: "Which single fix addresses both even-k ties AND multi-class ties?",
              options: ["Distance-weighted voting", "Always predict the lowest class label", "Increase k"],
              answer: 0,
              explain: "Weighted votes are real-valued, so exact ties essentially vanish — for binary and multi-class alike. Odd k only helps the two-class case.",
            },
            {
              q: "Why does increasing k tend to worsen minority-class recall under imbalance?",
              options: ["A wider neighbourhood pulls in even more of the abundant class", "Larger k reduces variance, which hurts recall", "It doesn't — larger k always helps"],
              answer: 0,
              explain: "The majority dominates by density, so a bigger net captures proportionally more of it. Under imbalance, the 'raise k for stability' instinct backfires.",
            },
            {
              q: "k-NN's predict_proba returns the fraction of neighbours per class. That makes it easy to…",
              options: ["Tune a decision threshold below 0.5 to catch the minority", "Avoid scaling the features", "Eliminate the need for cross-validation"],
              answer: 0,
              explain: "Honest class proportions let you move the threshold based on misclassification costs — the cost-sensitive-threshold idea from the evaluation pillar, applied to k-NN.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/preprocessing-and-encoding", label: <>← Preprocessing &amp; encoding</> }} next={{ href: "/learn/k-nearest-neighbors/choosing-the-right-metric", label: <>Next up · Choosing the right metric →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

# imbalance-aware prediction: use the minority's neighbour-fraction with a low bar
def predict_minority(dists, labels, k, minority=1, thresh=0.30):
    idx = np.argsort(dists)[:k]
    frac = (labels[idx] == minority).mean()   # k-NN's predict_proba, by hand
    return minority if frac >= thresh else 1 - minority

# requiring a full majority (0.5) misses rare cases; a tuned 0.30 catches more`;

const codeLib = `from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import balanced_accuracy_score, recall_score

# distance weighting is the cheapest imbalance + tie fix
clf = KNeighborsClassifier(n_neighbors=7, weights="distance").fit(X_train, y_train)

proba = clf.predict_proba(X_test)[:, 1]
pred_default = proba >= 0.5      # standard majority rule
pred_tuned   = proba >= 0.30     # lower bar to recover the minority class

for name, p in [("0.50", pred_default), ("0.30", pred_tuned)]:
    print(name, "recall:", round(recall_score(y_test, p), 3),
          "balanced acc:", round(balanced_accuracy_score(y_test, p), 3))`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
