import Link from "next/link";
import { M, MathBlock } from "@/components/Math";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Computational complexity — Manifold",
  description:
    "One k-means iteration costs O(n·k·d). It's linear in the data, which is why k-means scales to millions of points where most clustering methods choke — and where its real costs hide.",
};

export default function ComplexityPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={chip("var(--c-metrics)")}>Go deeper</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 6 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Computational complexity
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        k-Means earns its popularity on speed. Knowing exactly where the cost lives tells you when
        it will fly through millions of points — and the one factor that can quietly blow up.
      </p>

      <div className="lesson">
        <h2>The cost of one iteration</h2>
        <p>
          Each iteration is dominated by the assign step: for every one of <M>{String.raw`n`}</M> points
          you measure the distance to each of <M>{String.raw`k`}</M> centroids, and every distance touches
          all <M>{String.raw`d`}</M> dimensions. The update step is cheaper — one pass to sum each
          cluster&rsquo;s members. So a single iteration costs:
        </p>
        <MathBlock>{String.raw`O(n \cdot k \cdot d)`}</MathBlock>
        <p>
          Run it for <M>{String.raw`i`}</M> iterations and the total is{" "}
          <M>{String.raw`O(n \cdot k \cdot d \cdot i)`}</M>. The crucial feature: it&rsquo;s{" "}
          <strong>linear in <M>{String.raw`n`}</M></strong>. Double your data, double the time —
          no worse. That is rare and precious among clustering algorithms.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-clustering)", marginBottom: 4 }}>
            Why this beats the alternatives
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Hierarchical (agglomerative) clustering is <M>{String.raw`O(n^2 \log n)`}</M> in time and{" "}
            <M>{String.raw`O(n^2)`}</M> in memory — it must hold a pairwise distance matrix.
            At <M>{String.raw`n = 10^6`}</M> that matrix alone is a trillion entries. k-Means never
            forms one; it only ever compares points to <M>{String.raw`k`}</M> centroids.
          </p>
        </div>

        <h2>What about the number of iterations?</h2>
        <p>
          In practice <M>{String.raw`i`}</M> is small — usually tens, rarely more — and is capped by{" "}
          <code>max_iter</code> (sklearn defaults to 300). The unpleasant surprise is the{" "}
          <em>worst case</em>: Lloyd&rsquo;s algorithm can in theory take a number of iterations that is
          super-polynomial in <M>{String.raw`n`}</M>. Those adversarial inputs essentially never arise on
          real data, which is why the linear-time story holds day to day — but it&rsquo;s why
          <code>max_iter</code> exists as a guardrail.
        </p>

        <h2>The hidden multiplier: n_init</h2>
        <p>
          Because the result depends on initialisation, you normally run k-means several times from
          different seeds and keep the lowest-inertia result. That multiplies the whole cost by{" "}
          <code>n_init</code> (sklearn&rsquo;s default dropped to 1 with <code>k-means++</code> seeding,
          but classic usage was 10). It&rsquo;s an honest part of the runtime — budget for it.
        </p>

        <h2>Where the dimensions bite</h2>
        <p>
          The <M>{String.raw`d`}</M> factor is linear too, but high <M>{String.raw`d`}</M> hurts twice: every
          distance is slower to compute, <em>and</em> Euclidean distance grows less meaningful as
          dimensions pile up (the curse of dimensionality). The standard fix is to reduce dimensions
          first — PCA, then cluster — which shrinks <M>{String.raw`d`}</M> and sharpens the geometry at once.
        </p>

        <h2>Measure it yourself</h2>
        <p>
          Time k-means as you scale <M>{String.raw`n`}</M> and watch the (roughly) straight line:
        </p>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/why-it-converges" style={navLink}>← Why it converges</Link>
          <Link href="/learn/k-means/empty-clusters-and-edge-cases" style={{ ...navLink, fontWeight: 600 }}>Next up · Empty clusters &amp; edge cases →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np, time

def kmeans_iter(X, C):
    # the O(n*k*d) assign step + the O(n*d) update step
    d = ((X[:, None, :] - C[None, :, :])**2).sum(axis=2)
    labels = d.argmin(axis=1)
    return np.array([X[labels == j].mean(axis=0) for j in range(len(C))])

rng = np.random.default_rng(0)
for n in [10_000, 100_000, 1_000_000]:
    X = rng.normal(size=(n, 8))
    C = X[:5].copy()
    t = time.perf_counter()
    for _ in range(10):
        C = kmeans_iter(X, C)
    print(f"n={n:>9}:  {time.perf_counter() - t:.2f}s")   # ~10x per 10x n`;

const codeLib = `import numpy as np, time
from sklearn.cluster import KMeans, MiniBatchKMeans

rng = np.random.default_rng(0)
X = rng.normal(size=(1_000_000, 8))

for name, model in [
    ("full   ", KMeans(n_clusters=5, n_init=1, random_state=0)),
    ("minibatch", MiniBatchKMeans(n_clusters=5, n_init=1, random_state=0)),
]:
    t = time.perf_counter()
    model.fit(X)
    print(f"{name}: {time.perf_counter() - t:.2f}s   inertia {model.inertia_:.0f}")`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-clustering) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-clustering) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
