import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";
import { KNN_SETUP } from "@/lib/runtimeSetup";
import { Quiz } from "@/components/Quiz";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Distance metrics for k-NN — Manifold",
  description:
    "The metric is k-NN's real hyperparameter — it decides what 'near' means. Minkowski, cosine, Mahalanobis, Hamming: which notion of similarity fits which data, and how the choice reshapes every neighbourhood.",
};

// Unit "balls" for the three common Minkowski metrics, drawn to exact integer
// coordinates (no floating point). L1 ⊂ L2 ⊂ L∞ at the same radius, which is why
// they disagree about which points count as "within distance 1".
const CX = 90, CY = 90, R = 62;

function Ball({ label, color, shape }: { label: string; color: string; shape: React.ReactNode }) {
  return (
    <div style={{ textAlign: "center" }}>
      <svg viewBox="0 0 180 180" style={{ width: "100%", height: "auto", maxWidth: 180 }}>
        <rect x={1} y={1} width={178} height={178} rx={8} fill="var(--canvas)" stroke="var(--border-strong)" />
        <line x1={CX} y1={16} x2={CX} y2={164} stroke="var(--border)" strokeWidth={1} />
        <line x1={16} y1={CY} x2={164} y2={CY} stroke="var(--border)" strokeWidth={1} />
        {shape}
      </svg>
      <div style={{ fontSize: 12.5, color, marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

export default function DistanceMetricsPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Classification", color: "var(--c-classification)" }, { label: "Tier 2 · distance & weighting", color: "var(--c-classification)" }]}
        time="about 8 minutes"
        title={<>Distance metrics for k-NN</>}
        intro={<>
          k-NN fits nothing, so its one real hyperparameter is the metric — the definition of &ldquo;near.&rdquo;
        Swap it and you swap which points are neighbours, and therefore what the model predicts. Here&rsquo;s the
        toolkit and when each tool is right.
        </>}
      />

      <div className="lesson">
        <h2>The Minkowski family</h2>
        <p>
          Most numeric-feature metrics are special cases of one formula, parameterised by a single exponent{" "}
          <M>{String.raw`p`}</M>:
        </p>
        <MathBlock>{String.raw`d_p(\mathbf{x}, \mathbf{z}) = \left( \sum_{i=1}^{m} |x_i - z_i|^p \right)^{1/p}`}</MathBlock>
        <ul style={ul}>
          <li><strong><M>{String.raw`p = 2`}</M> — Euclidean.</strong> Straight-line distance; the default, natural for continuous features on a shared scale.</li>
          <li><strong><M>{String.raw`p = 1`}</M> — Manhattan (city-block).</strong> Sum of absolute differences; less swayed by one large coordinate gap, and often steadier in higher dimensions.</li>
          <li><strong><M>{String.raw`p \to \infty`}</M> — Chebyshev.</strong> Just the single largest coordinate difference, <M>{String.raw`\max_i |x_i - z_i|`}</M>.</li>
        </ul>
        <p>
          The exponent isn&rsquo;t cosmetic — it changes the <em>shape</em> of a neighbourhood. Below is the unit
          ball (all points at distance exactly 1 from the centre) for each. Notice they nest:{" "}
          <M>{String.raw`L_1 \subset L_2 \subset L_\infty`}</M>, so the same radius admits different points.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, margin: "1.4rem 0" }}>
          <Ball
            label="L₁ (Manhattan): diamond"
            color="var(--c-fundamentals)"
            shape={<polygon points={`${CX},${CY - R} ${CX + R},${CY} ${CX},${CY + R} ${CX - R},${CY}`} fill="color-mix(in srgb, var(--c-fundamentals) 16%, transparent)" stroke="var(--c-fundamentals)" strokeWidth={2} />}
          />
          <Ball
            label="L₂ (Euclidean): circle"
            color="var(--c-regression)"
            shape={<circle cx={CX} cy={CY} r={R} fill="color-mix(in srgb, var(--c-regression) 16%, transparent)" stroke="var(--c-regression)" strokeWidth={2} />}
          />
          <Ball
            label="L∞ (Chebyshev): square"
            color="var(--c-classification)"
            shape={<rect x={CX - R} y={CY - R} width={2 * R} height={2 * R} fill="color-mix(in srgb, var(--c-classification) 16%, transparent)" stroke="var(--c-classification)" strokeWidth={2} />}
          />
        </div>

        <h2>When the geometry isn&rsquo;t Euclidean</h2>
        <ul style={ul}>
          <li>
            <strong>Cosine distance</strong> — <M>{String.raw`1 - \frac{\mathbf{x}\cdot\mathbf{z}}{\lVert\mathbf{x}\rVert\,\lVert\mathbf{z}\rVert}`}</M>.
            Compares <em>direction</em>, ignoring magnitude. The right call for text (TF-IDF), embeddings, and any
            data where &ldquo;same profile, different length&rdquo; should count as similar.
          </li>
          <li>
            <strong>Mahalanobis distance</strong> — <M>{String.raw`\sqrt{(\mathbf{x}-\mathbf{z})^\top \Sigma^{-1} (\mathbf{x}-\mathbf{z})}`}</M>.
            Euclidean distance <em>after</em> whitening by the covariance <M>{String.raw`\Sigma`}</M>: it rescales
            and de-correlates the axes, so correlated or unequally-spread features stop distorting
            &ldquo;near.&rdquo; (Standardising features, next page, is the diagonal special case.)
          </li>
          <li>
            <strong>Hamming distance</strong> — count of differing attributes; for categorical or binary features.
          </li>
          <li>
            <strong>Jaccard distance</strong> — for sets / sparse binary data (tags, baskets): the fraction of the
            union not in the intersection.
          </li>
        </ul>

        <Callout color="var(--c-classification)" title={<>Mixed feature types need a mixed metric</>}>
          Real tables mix numeric, categorical, and set-valued columns. A single Euclidean distance can&rsquo;t
            span them — you either engineer everything into a comparable numeric space, or use a composite like{" "}
            <strong>Gower distance</strong> that applies an appropriate per-feature metric and averages. Whatever
            you choose, the same rule holds: the metric encodes your assumption about what makes two records alike.
        </Callout>

        <h2>Choosing a metric in practice</h2>
        <ul style={ul}>
          <li><strong>Dense, continuous, comparable scales</strong> → Euclidean (after scaling).</li>
          <li><strong>Many dimensions, or robustness wanted</strong> → try Manhattan; it concentrates less (next-next page).</li>
          <li><strong>Direction matters, magnitude doesn&rsquo;t</strong> → cosine (text, embeddings).</li>
          <li><strong>Correlated / unequally-scaled numeric features</strong> → Mahalanobis, or standardise then Euclidean.</li>
          <li><strong>Categorical / binary / sets</strong> → Hamming or Jaccard.</li>
        </ul>
        <p>
          Because the metric is a hyperparameter, treat it like k: put a few candidates in your grid search and
          let held-out data decide. And remember — <strong>changing the metric changes the best k</strong>, so
          tune them together.
        </p>

        <CodeBlock setup={KNN_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <Quiz
          accent="var(--c-classification)"
          questions={[
            {
              q: "The Minkowski distance with p = 1 is…",
              options: ["Manhattan (city-block) distance", "Euclidean distance", "Cosine distance"],
              answer: 0,
              explain: "p=1 sums absolute differences (Manhattan); p=2 is Euclidean; p→∞ is Chebyshev (the max coordinate gap).",
            },
            {
              q: "You're comparing TF-IDF document vectors where length varies a lot but topic is what matters. Best metric?",
              options: ["Cosine — compares direction, ignoring magnitude", "Euclidean — long documents will be 'far' from short ones", "Hamming — counts differing words"],
              answer: 0,
              explain: "Cosine measures the angle between vectors, so a short and a long document about the same topic are treated as similar. Euclidean would penalise the length difference.",
            },
            {
              q: "What does Mahalanobis distance add over plain Euclidean?",
              options: ["It whitens by the covariance, de-correlating and rescaling the axes", "It's faster to compute", "It only works on categorical data"],
              answer: 0,
              explain: "Σ⁻¹ rescales and rotates the space so correlated or unequally-spread features no longer distort 'near'. Standardising features is its diagonal special case.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-nearest-neighbors/choosing-k-by-cross-validation", label: <>← Choosing k by cross-validation</> }} next={{ href: "/learn/k-nearest-neighbors/why-feature-scaling-matters", label: <>Next up · Why feature scaling matters →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

def minkowski(x, Z, p=2):
    return (np.abs(Z - x)**p).sum(axis=1)**(1/p)

def cosine(x, Z):
    return 1 - (Z @ x) / (np.linalg.norm(Z, axis=1) * np.linalg.norm(x))

# p=2 Euclidean, p=1 Manhattan, large p → Chebyshev (max coordinate gap)
print(minkowski(X_train[0], X_train[1:4], p=2))
print(minkowski(X_train[0], X_train[1:4], p=1))`;

const codeLib = `from sklearn.neighbors import KNeighborsClassifier

# metric is a first-class hyperparameter — grid-search it alongside k
euclid = KNeighborsClassifier(n_neighbors=7, metric="minkowski", p=2)
manhat = KNeighborsClassifier(n_neighbors=7, metric="minkowski", p=1)
cosine = KNeighborsClassifier(n_neighbors=7, metric="cosine")

for name, clf in [("euclid", euclid), ("manhat", manhat), ("cosine", cosine)]:
    print(name, clf.fit(X_train, y_train).score(X_test, y_test))`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
