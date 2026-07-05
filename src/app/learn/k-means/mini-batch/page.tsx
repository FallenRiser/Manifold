import { Quiz } from "@/components/Quiz";
import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { CLUSTER_SETUP } from "@/lib/runtimeSetup";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Mini-batch k-means — Manifold",
  description:
    "Mini-batch k-means updates centroids from small random samples instead of the full dataset. Slightly worse clusters, an order of magnitude faster — the standard choice at scale.",
};

export default function MiniBatchPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Clustering", color: "var(--c-clustering)" }]}
        time="about 5 minutes"
        title={<>Mini-batch k-means</>}
        intro={<>
          When the full assign step over millions of points is too slow, don&rsquo;t use all the points.
        Update the centroids from small random samples instead — the same trade stochastic gradient
        descent makes against batch gradient descent.
        </>}
      />

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

        <Callout color="var(--c-clustering)" title={<>The trade in one line</>}>
          Mini-batch reaches a typically <strong>slightly higher inertia</strong> than full k-means
            (worse clusters), but often runs <strong>an order of magnitude faster</strong> and streams
            data that never has to fit in memory at once. At large <em>n</em> that&rsquo;s usually a bargain.
        </Callout>

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
        <CodeBlock setup={CLUSTER_SETUP} fromScratch={codeScratch} withLibrary={codeLib} />

        <Quiz
          accent="var(--c-clustering)"
          questions={[
            {
              q: "Why is Lloyd's algorithm guaranteed to stop?",
              options: ["Each assign and update step can only lower (or keep) inertia, and there are finitely many partitions", "The learning rate decays to zero", "Centroids are constrained to the data's bounding box"],
              answer: 0,
              explain: "Monotone descent over a finite set of possible assignments means no cycling and eventual convergence — no learning rate involved anywhere.",
            },
            {
              q: "What Lloyd's converges TO is…",
              options: ["The global minimum of inertia", "A local minimum that depends on where the centroids started", "The same clustering on every run"],
              answer: 1,
              explain: "Convergence is guaranteed; quality isn't. That gap is the entire reason the next chapter — initialization, restarts, k-means++ — exists.",
            },
            {
              q: "Mini-batch k-means trades…",
              options: ["A small amount of final inertia for a large speedup on big datasets", "Convergence guarantees for exactness", "Memory for accuracy"],
              answer: 0,
              explain: "Updating from small random batches adds noise, so it lands slightly above full-batch inertia — typically within a few percent, at a fraction of the cost. The batch-vs-SGD trade, wearing clustering clothes.",
            },
          ]}
        />

        <PrevNext prev={{ href: "/learn/k-means/accelerated-elkan", label: <>← Accelerated k-means (Elkan)</> }} next={{ href: "/learn/k-means", label: <>Back to overview →</> }} />
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


const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };

const inlineLink: React.CSSProperties = { color: "var(--brand)", textDecoration: "none" };

