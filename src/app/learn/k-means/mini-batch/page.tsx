import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata = {
  title: "Mini-batch k-means — Manifold",
  description:
    "Mini-batch k-means updates centroids from small random samples instead of the full dataset. Slightly worse clusters, an order of magnitude faster — the standard choice at scale.",
};

export default function MiniBatchPage() {
  return (
    <article>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={chip("var(--c-clustering)")}>Clustering</span>
        <span style={{ fontSize: 12, color: "var(--faint)" }}>· about 5 minutes</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 8px", color: "var(--ink)" }}>
        Mini-batch k-means
      </h1>
      <p style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 24px", maxWidth: 620 }}>
        When the full assign step over millions of points is too slow, don&rsquo;t use all the points.
        Update the centroids from small random samples instead — the same trade stochastic gradient
        descent makes against batch gradient descent.
      </p>

      <div className="lesson">
        <h2>The idea: sample, don&rsquo;t scan</h2>
        <p>
          Plain Lloyd&rsquo;s touches every point on every iteration. Mini-batch k-means instead draws a
          small random <strong>batch</strong> (say 1,000 points), assigns just those to centroids, and
          nudges each centroid a little toward its batch members. Repeat with a fresh batch. Each step
          is tiny and cheap, and the centroids drift toward the same regions Lloyd&rsquo;s would find.
        </p>

        <h2>Why it&rsquo;s the SGD of clustering</h2>
        <p>
          The parallel to <Link href="/learn/linear-regression/batch-vs-sgd" style={inlineLink}>batch vs. SGD</Link>{" "}
          is exact. Full k-means is like batch gradient descent: an accurate, expensive step using all
          the data. Mini-batch is like SGD: a noisy, cheap step using a sample. The update even uses a
          shrinking learning rate — each centroid is a running mean, and as a centroid accumulates more
          points its per-batch moves get smaller, so it settles rather than jittering forever.
        </p>

        <div style={callout}>
          <div className="font-display" style={{ fontSize: 13, fontWeight: 500, color: "var(--c-clustering)", marginBottom: 4 }}>
            The trade in one line
          </div>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 14.5, lineHeight: 1.6 }}>
            Mini-batch reaches a typically <strong>slightly higher inertia</strong> than full k-means
            (worse clusters), but often runs <strong>an order of magnitude faster</strong> and streams
            data that never has to fit in memory at once. At large <em>n</em> that&rsquo;s usually a bargain.
          </p>
        </div>

        <h2>When to reach for it</h2>
        <ul style={ul}>
          <li><strong>Large n</strong> — hundreds of thousands of points or more, where a full pass is painful.</li>
          <li><strong>Streaming / out-of-core data</strong> — you can feed batches with <code>partial_fit</code> without ever loading everything.</li>
          <li><strong>Quick iteration</strong> — when you&rsquo;re sweeping <em>k</em> or experimenting and want fast, approximate answers.</li>
        </ul>
        <p>
          For small or medium datasets there&rsquo;s no reason to accept the quality hit — use full
          k-means. The <code>batch_size</code> knob trades quality for speed: bigger batches mean
          steadier, more Lloyd-like updates.
        </p>

        <h2>From a running-mean update to the library</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <Link href="/learn/k-means/accelerated-elkan" style={navLink}>← Accelerated k-means (Elkan)</Link>
          <Link href="/learn/k-means" style={navLink}>Back to overview →</Link>
        </div>
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np

rng = np.random.default_rng(0)
X = rng.normal(size=(200_000, 8))
k, batch_size = 8, 1024

centroids = X[rng.choice(len(X), k, replace=False)].copy()
counts = np.zeros(k)                       # points seen per centroid -> learning rate

for _ in range(100):
    batch = X[rng.choice(len(X), batch_size, replace=False)]
    d = ((batch[:, None, :] - centroids[None, :, :])**2).sum(axis=2)
    labels = d.argmin(axis=1)
    for i, j in enumerate(labels):
        counts[j] += 1
        eta = 1.0 / counts[j]              # shrinking step: running mean
        centroids[j] += eta * (batch[i] - centroids[j])`;

const codeLib = `from sklearn.cluster import MiniBatchKMeans

mbk = MiniBatchKMeans(n_clusters=8, batch_size=1024,
                      n_init=3, random_state=0).fit(X)
print(mbk.inertia_)

# streaming / out-of-core: feed batches one at a time, never loading all of X
mbk = MiniBatchKMeans(n_clusters=8, batch_size=1024, random_state=0)
for batch in stream_of_batches:
    mbk.partial_fit(batch)`;

function chip(color: string): React.CSSProperties {
  return { display: "inline-flex", alignItems: "center", background: `color-mix(in srgb, ${color} 13%, var(--surface))`, color, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
}
const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
const navLink: React.CSSProperties = { fontSize: 14, color: "var(--brand)", textDecoration: "none" };
const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };
const callout: React.CSSProperties = { background: "color-mix(in srgb, var(--c-clustering) 9%, var(--surface))", border: "1px solid color-mix(in srgb, var(--c-clustering) 22%, var(--border))", borderRadius: 12, padding: "13px 15px", margin: "1.8rem 0" };
