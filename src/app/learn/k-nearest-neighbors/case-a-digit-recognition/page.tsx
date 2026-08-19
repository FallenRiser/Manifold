import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Case A: handwritten digit recognition — Manifold",
  description:
    "k-NN's breakout demo: classify handwritten digits by pixel similarity alone. On scikit-learn's digits, a 3-line k-NN hits 98.7% test accuracy — here's the real run, the errors it makes, and why.",
};

// Real 8x8 bitmaps from sklearn load_digits (values 0–16), for the most-confused
// pair (true 9 misread as 3). Rendered as static heatmaps.
const NINE = [0, 0, 11, 12, 0, 0, 0, 0, 0, 2, 16, 16, 16, 13, 0, 0, 0, 3, 16, 12, 10, 14, 0, 0, 0, 1, 16, 1, 12, 15, 0, 0, 0, 0, 13, 16, 9, 15, 2, 0, 0, 0, 0, 3, 0, 9, 11, 0, 0, 0, 0, 0, 9, 15, 4, 0, 0, 0, 9, 12, 13, 3, 0, 0];
const THREE = [0, 0, 7, 15, 13, 1, 0, 0, 0, 8, 13, 6, 15, 4, 0, 0, 0, 2, 1, 13, 13, 0, 0, 0, 0, 0, 2, 15, 11, 1, 0, 0, 0, 0, 0, 1, 12, 12, 1, 0, 0, 0, 0, 0, 1, 10, 8, 0, 0, 0, 8, 4, 5, 14, 9, 0, 0, 0, 7, 13, 13, 9, 0, 0];

function DigitGrid({ px, label }: { px: number[]; label: string }) {
  const c = 15;
  return (
    <div style={{ textAlign: "center" }}>
      <svg viewBox={`0 0 ${8 * c} ${8 * c}`} width={8 * c} height={8 * c} style={{ borderRadius: 8, border: "1px solid var(--border-strong)", background: "var(--canvas)", maxWidth: "100%" }} role="img" aria-label={`8 by 8 bitmap of a handwritten ${label}`}>
        {px.map((v, i) => (
          <rect key={i} x={(i % 8) * c} y={Math.floor(i / 8) * c} width={c} height={c} fill="var(--c-classification)" fillOpacity={v / 16} />
        ))}
      </svg>
      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function CaseADigitsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Case study", color: "var(--c-classification)" }]}
        time="about 8 minutes"
        title={<>Case A: handwritten digit recognition</>}
        intro={<>
          The demo that made k-NN famous: recognise handwritten digits from pixels alone, no feature
        engineering. A three-line classifier that just compares images gets <strong>98.7%</strong> — and its
        few mistakes are exactly the ones a human would make.
        </>}
      />

      <div className="lesson">
        <h2>The task: pixels in, digit out</h2>
        <p>
          scikit-learn&rsquo;s <code>digits</code> dataset is 1,797 handwritten digits, each an 8×8 grayscale
          image flattened to 64 features (pixel intensities 0–16). No edges, no strokes, no engineered features —
          just raw brightness. k-NN&rsquo;s bet is simple: <strong>two images of the same digit have similar
          pixels</strong>, so the nearest images in 64-dimensional pixel space usually share the label.
        </p>

        <h2>A three-line classifier, and the real result</h2>
        <p>
          Split off a test set, fit k-NN, score it. Here&rsquo;s the actual run — the code and its output:
        </p>
        <CodeBlock fromScratch={codeA} />
        <CodeOutput label="output">{outputA}</CodeOutput>
        <p>
          <strong>98.67% test accuracy</strong> at <code>k = 3</code> — 6 wrong out of 450 — from a model that
          does no training and knows nothing about digits beyond &ldquo;compare the pixels.&rdquo; That is the
          headline case for k-NN: on dense, moderate-dimensional data where similar inputs really do share
          labels, it is startlingly strong with almost no effort.
        </p>

        <h2>The mistakes are human mistakes</h2>
        <p>
          The single most common error was a true <strong>9 misread as a 3</strong>. Look at these real bitmaps
          from the dataset — a loopy 9 and a 3 share a lot of ink in the same places:
        </p>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", margin: "1.4rem 0", padding: 16, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14 }}>
          <DigitGrid px={NINE} label="a 9 (true label)" />
          <DigitGrid px={THREE} label="a 3 (predicted)" />
        </div>
        <p>
          k-NN&rsquo;s errors are interpretable precisely <em>because</em> it decides by similarity: when it&rsquo;s
          wrong, it&rsquo;s because the nearest images genuinely look alike. You can always pull up the neighbours
          that outvoted the truth and see why — an honesty most models can&rsquo;t offer.
        </p>

        <h2>What the other numbers tell you</h2>
        <ul style={ul}>
          <li><strong><code>k = 3</code> beat <code>k = 1</code> (98.67% vs 98.22%).</strong> A tiny bit of voting shakes off the odd noisy neighbour; past that, larger k over-smooths and accuracy dips.</li>
          <li><strong>PCA to 30 dims scored 97.33%</strong> — slightly lower here, but with less than half the features and far faster queries. On this easy dataset raw pixels already win; on bigger image problems the compression is what makes k-NN tractable.</li>
          <li><strong>Brute force and the k-d tree gave identical predictions.</strong> The search structure changes <em>speed</em>, never the answer — exactly as the scaling chapter promised.</li>
        </ul>

        <Callout color="var(--c-classification)" title={<>Why this problem suits k-NN so well</>}>
          Digit pixels are dense, on a common 0–16 scale (so scaling barely matters), only mildly
            high-dimensional, and genuinely satisfy &ldquo;similar looks → same class.&rdquo; That&rsquo;s the k-NN
            sweet spot. Push to full-resolution photographs (thousands of pixels, lighting, position) and the
            curse of dimensionality bites — which is why real image systems learn an embedding first, then run
            (approximate) k-NN on top. The idea survives; the representation changes.
        </Callout>

        <Quiz
          accent="var(--c-classification)"
          questions={[
            {
              q: "Why does raw-pixel k-NN work so well on the digits dataset?",
              options: ["Pixels are dense, on a common scale, only mildly high-dimensional, and similar images share the digit", "Because 8×8 images are high-dimensional", "Because k-NN learns edge features during training"],
              answer: 0,
              explain: "The data sits squarely in k-NN's sweet spot. k-NN learns nothing — it just relies on similar images being close in pixel space, which holds here.",
            },
            {
              q: "Brute force and the k-d tree produced identical predictions. What does that confirm?",
              options: ["The search structure affects speed, not the answer", "k-d trees are more accurate", "The dataset is too small for trees"],
              answer: 0,
              explain: "Both find the same nearest neighbours, so they must predict identically. Spatial structures are a speed optimisation, never an accuracy change.",
            },
            {
              q: "PCA to 30 dimensions scored slightly LOWER (97.3% vs 98.7%). The takeaway is…",
              options: ["On this easy dataset raw pixels already win; PCA trades a little accuracy for compactness and speed", "PCA always hurts k-NN", "The run was buggy"],
              answer: 0,
              explain: "Dimensionality reduction is a speed/memory win that can cost a little accuracy on already-easy data. On harder, higher-dimensional problems it's often what makes k-NN feasible at all.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/k-nn-vs-k-means", label: <>← k-NN vs k-means</> }} next={{ href: "/learn/k-nearest-neighbors/case-b-recommendation", label: <>Next up · Case B: recommendation →</> }} />
      </div>
    </article>
  );
}

const codeA = `from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score, confusion_matrix

X, y = load_digits(return_X_y=True)            # 1797 x 64 (8x8 pixels), 10 classes
Xtr, Xte, ytr, yte = train_test_split(
    X, y, test_size=0.25, random_state=0, stratify=y)

for k in [1, 3, 5, 7, 11]:
    clf = KNeighborsClassifier(n_neighbors=k).fit(Xtr, ytr)
    print(f"k={k:>2}: {accuracy_score(yte, clf.predict(Xte)):.4f}")

# best k = 3: inspect the errors
pred = KNeighborsClassifier(n_neighbors=3).fit(Xtr, ytr).predict(Xte)
cm = confusion_matrix(yte, pred)          # most off-diagonal mass: true 9 -> 3`;

const outputA = `samples=1797  features=64 (8x8)  classes=10
train=1347  test=450
acc vs k (raw pixels):
  k= 1: 0.9822
  k= 3: 0.9867
  k= 5: 0.9800
  k= 7: 0.9733
  k=11: 0.9778
k=3 test accuracy: 0.9867
most-confused pair: true 9 -> pred 3  (2 times)
total test errors: 6 of 450
PCA(30)+scale, k=3 test accuracy: 0.9733
brute == kd_tree predictions identical: True`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
